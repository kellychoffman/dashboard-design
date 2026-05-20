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

const DASHBOARD_DESIGN_VERSION = '0.1.20';

add_action( 'admin_enqueue_scripts', 'dashboard_design_enqueue_assets' );

function dashboard_design_enqueue_assets( $hook ) {
	if ( 'index.php' !== $hook ) {
		return;
	}

	wp_enqueue_style(
		'dashboard-design',
		plugins_url( 'assets/css/dashboard.css', __FILE__ ),
		array(),
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
