<?php
/**
 * Plugin Name: Dashboard Design
 * Description: Custom CSS and design tweaks for the WordPress dashboard (wp-admin/index.php).
 * Version:     0.1.0
 * Author:      Kelly Hoffman
 * License:     GPL-2.0-or-later
 * Text Domain: dashboard-design
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const DASHBOARD_DESIGN_VERSION = '0.1.48';

add_action( 'admin_enqueue_scripts', 'dashboard_design_enqueue_assets' );

function dashboard_design_enqueue_assets( $hook ) {
	if ( 'index.php' !== $hook ) {
		return;
	}

	// Three layers: shared base plus one theme (Elevation or Flat). All are
	// enqueued; dashboard.js enables/disables the <link>s per the selected
	// mode (Current disables all three).
	wp_enqueue_style(
		'dashboard-design-base',
		plugins_url( 'assets/css/base.css', __FILE__ ),
		array(),
		DASHBOARD_DESIGN_VERSION
	);

	wp_enqueue_style(
		'dashboard-design-elevation',
		plugins_url( 'assets/css/elevation.css', __FILE__ ),
		array( 'dashboard-design-base' ),
		DASHBOARD_DESIGN_VERSION
	);

	wp_enqueue_style(
		'dashboard-design-flat',
		plugins_url( 'assets/css/flat.css', __FILE__ ),
		array( 'dashboard-design-base' ),
		DASHBOARD_DESIGN_VERSION
	);

	wp_enqueue_script(
		'dashboard-design',
		plugins_url( 'assets/js/dashboard.js', __FILE__ ),
		array( 'jquery', 'postbox' ),
		DASHBOARD_DESIGN_VERSION,
		true
	);
}
