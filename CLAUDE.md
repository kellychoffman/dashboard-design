# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Local development

From the plugin folder, one command:

```sh
npx --yes @wp-now/wp-now start
```

This spins up a fresh WordPress install at `http://localhost:8881` with this plugin auto-activated (login `admin` / `password`). Edits to files under `assets/` are live — refresh the dashboard at `/wp-admin/index.php` to see them.

The plugin only loads on the dashboard screen (`index.php` hook). Bumping `DASHBOARD_DESIGN_VERSION` in `dashboard-design.php` busts the CSS/JS cache via the `?ver=` query string — do this whenever a refresh isn't picking up CSS/JS changes.

## Architecture notes

**The JS file is not optional decoration — it overrides WP core behavior.**

`assets/js/dashboard.js` replaces WordPress's default postbox snap-toggle (a `display: none` flip via the `.closed` class) with a jQuery `slideToggle('fast')` so dashboard widgets expand/collapse with the same 200ms slide that Screen Options and Help tabs use. The handler:

1. Unbinds WP's `click.postboxes` handler on `.postbox .hndle, .postbox .handlediv`
2. Rebinds under the `click.dashboard-design` namespace with the slide animation
3. **Preserves three side effects** WP core relies on: `aria-expanded` attribute, `postboxes.save_state()` (persists open/closed state per user), and the `postbox-toggled` event (used by sortables and other listeners)

If you modify this handler, keep all three side effects or other WP admin behavior will break silently. The script is enqueued with a `postbox` dependency so the `postboxes` global is defined when we unbind.

**CSS specificity is non-trivial because WP admin uses ID selectors.**

A lot of WP core admin CSS uses selectors like `#dashboard_quick_press .inside { padding: 0 }` and `#screen-meta-links .show-settings { border: 1px solid #c3c4c7 }`. Class-based rules in `dashboard.css` lose to those by default. When a CSS change isn't applying, check the resolved styles for an ID selector winning — the fix is to bump the specificity (e.g., scope under `#screen-meta-links` rather than just `.show-settings`).

**The Screen Options / Help tab styling is coordinated with the panel below.**

`.show-settings.screen-meta-active` (the toggle button when its panel is open) and `#screen-meta` (the panel itself) are styled to read as one continuous shape: the active tab uses directional box-shadows on the sides (no bottom shadow, since the panel's opaque white background would hide it anyway), and `#screen-meta` has a `8px 8px 0 8px` radius so the bottom-right is flat. Changing one without the other will reintroduce visible seams at the join.
