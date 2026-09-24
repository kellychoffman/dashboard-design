# Dashboard Design

A tiny WordPress plugin for updating the design of the WP admin dashboard (`/wp-admin/index.php`).

## What it does

Enqueues CSS and JS only on the dashboard page, with a floating switcher to flip between three looks: **Current** (stock WP), **Elevation** (soft shadows), and **Flat** (WordPress Design System cards).

## Install

Clone or download into your `wp-content/plugins/` directory, then activate from **Plugins** in wp-admin.

```sh
cd wp-content/plugins
git clone https://github.com/kellychoffman/dashboard-design.git
```

## Develop

- CSS: `assets/css/base.css` (shared spacing + icons), `assets/css/elevation.css`, `assets/css/flat.css` (one per design mode)
- JS: `assets/js/dashboard.js` (animations + the mode switcher)

Both load only on `index.php` (the dashboard). Bump `DASHBOARD_DESIGN_VERSION` in `dashboard-design.php` to bust the cache after changes.
