# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Local development

From the plugin folder, one command:

```sh
npx --yes @wp-playground/cli@latest start --wp=7.1.2 --php=8.0 --port=8882 --skip-browser
```

This serves WordPress at `http://127.0.0.1:8882` with the plugin auto-mounted and activated (login `admin` / `password`). Edits to files under `assets/` are live, so refresh `/wp-admin/index.php` to see them.

Both versions are pinned on purpose:

- `--php=8.0` keeps the "PHP Update Recommended" widget on the dashboard. That widget is one of the things this plugin styles (caution icon, primary button, external-link icon), so it is a useful test case. A newer PHP hides it.
- `--wp=7.1.2` because `--wp=latest` resolves to a stale version (7.0.2 as of this writing), and a `major.minor` alias like `7.1` tracks the branch tip, which can install a release candidate. Pin the full patch version and bump it when a newer WordPress ships.

Site files (database, uploads) live in `~/.wordpress-playground/sites/<hash>/`, outside the repo. Adding `--reset` deletes that site and provisions a clean one; leave it off for normal work.

`@wp-now/wp-now` was the previous runner. It is deprecated and unmaintained, but it still works and resolves `latest` correctly, so it is a fallback if the Playground CLI version pinning gets in the way:

```sh
npx --yes @wp-now/wp-now start --php=8.0 --port=8882
```

The plugin only loads on the dashboard screen (`index.php` hook). Bumping `DASHBOARD_DESIGN_VERSION` in `dashboard-design.php` busts the CSS/JS cache via the `?ver=` query string. Do this whenever a refresh is not picking up CSS/JS changes.

## Architecture notes

**The JS file is not optional decoration — it overrides WP core behavior.**

`assets/js/dashboard.js` replaces WordPress's default postbox snap-toggle (a `display: none` flip via the `.closed` class) with a jQuery `slideToggle('fast')` so dashboard widgets expand/collapse with the same 200ms slide that Screen Options and Help tabs use. The handler:

1. Unbinds WP's `click.postboxes` handler on `.postbox .hndle, .postbox .handlediv`
2. Rebinds under the `click.dashboard-design` namespace with the slide animation
3. **Preserves three side effects** WP core relies on: `aria-expanded` attribute, `postboxes.save_state()` (persists open/closed state per user), and the `postbox-toggled` event (used by sortables and other listeners)

If you modify this handler, keep all three side effects or other WP admin behavior will break silently. The script is enqueued with a `postbox` dependency so the `postboxes` global is defined when we unbind.

**CSS specificity is non-trivial because WP admin uses ID selectors.**

A lot of WP core admin CSS uses selectors like `#dashboard_quick_press .inside { padding: 0 }` and `#screen-meta-links .show-settings { border: 1px solid #c3c4c7 }`. Class-based rules in the plugin stylesheets (`base.css` is shared; `elevation.css` / `flat.css` are alternate design modes toggled by the floating switcher) lose to those by default. When a CSS change isn't applying, check the resolved styles for an ID selector winning — the fix is to bump the specificity (e.g., scope under `#screen-meta-links` rather than just `.show-settings`).

**The Screen Options / Help tab styling is coordinated with the panel below.**

`.show-settings.screen-meta-active` (the toggle button when its panel is open) and `#screen-meta` (the panel itself) are styled to read as one continuous shape: the active tab uses directional box-shadows on the sides (no bottom shadow, since the panel's opaque white background would hide it anyway), and `#screen-meta` has a `8px 8px 0 8px` radius so the bottom-right is flat. Changing one without the other will reintroduce visible seams at the join.
