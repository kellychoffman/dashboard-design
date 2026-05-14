# Dashboard Design

A tiny WordPress plugin for tweaking the look of the WP admin dashboard (`/wp-admin/index.php`).

## What it does

Enqueues a CSS file (and an optional JS file) only on the dashboard page. Edit `assets/css/dashboard.css` to make your changes.

## Install

Clone or download into your `wp-content/plugins/` directory, then activate from **Plugins** in wp-admin.

```sh
cd wp-content/plugins
git clone https://github.com/kellychoffman/dashboard-design.git
```

## Develop

- CSS: `assets/css/dashboard.css`
- JS: `assets/js/dashboard.js`

Both load only on `index.php` (the dashboard). Bump `DASHBOARD_DESIGN_VERSION` in `dashboard-design.php` to bust the cache after changes.
