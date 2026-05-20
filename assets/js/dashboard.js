/**
 * Dashboard Design — custom JS for /wp-admin/index.php
 *
 * 1. Replaces postbox snap-toggle with the same slide WP uses for Screen Options / Help.
 * 2. Before/After toggle: floating pill that disables the plugin CSS/JS to compare
 *    the styled dashboard against stock WP. State persisted in localStorage.
 */
( function ( $ ) {
	'use strict';

	var STORAGE_KEY = 'dd-before-after';

	// ── Postbox animation ─────────────────────────────────────────────────────

	function handlePostboxClick() {
		var $el      = $( this );
		var $postbox = $el.closest( '.postbox' );
		var id       = $postbox.attr( 'id' );

		if ( 'dashboard_browser_nag' === id ) {
			return;
		}

		var isClosed = $postbox.hasClass( 'closed' );
		var $inside  = $postbox.find( '.inside' );

		if ( isClosed ) {
			$postbox.removeClass( 'closed' );
			$inside.hide().slideDown( 'fast' );
		} else {
			$inside.slideUp( 'fast', function () {
				$postbox.addClass( 'closed' );
			} );
		}

		var newExpanded = isClosed ? 'true' : 'false';
		if ( $el.hasClass( 'handlediv' ) ) {
			$el.attr( 'aria-expanded', newExpanded );
		} else {
			$postbox.find( 'button.handlediv' ).attr( 'aria-expanded', newExpanded );
		}

		if (
			'undefined' !== typeof postboxes &&
			postboxes.page &&
			'press-this' !== postboxes.page &&
			'function' === typeof postboxes.save_state
		) {
			postboxes.save_state( postboxes.page );
		}

		$( document ).trigger( 'postbox-toggled', $postbox );
	}

	function bindDesign() {
		var $h = $( '.postbox .hndle, .postbox .handlediv' );
		$h.off( 'click.postboxes' );
		$h.on( 'click.dashboard-design', handlePostboxClick );
	}

	function bindWP() {
		var $h = $( '.postbox .hndle, .postbox .handlediv' );
		$h.off( 'click.dashboard-design' );
		$h.on( 'click.postboxes', postboxes.handle_click );
	}

	// ── Before / After toggle ─────────────────────────────────────────────────

	var TOGGLE_CSS = [
		'#dd-toggle{',
		'  position:fixed; bottom:20px; right:20px; z-index:99999;',
		'  display:flex; align-items:center; gap:7px;',
		'  background:#fff; border-radius:20px;',
		'  padding:6px 12px 6px 10px;',
		'  box-shadow:0 2px 10px rgba(0,0,0,.14),0 0 0 1px rgba(0,0,0,.08);',
		'  font:500 11px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
		'  letter-spacing:.03em; text-transform:uppercase;',
		'  cursor:pointer; user-select:none;',
		'  transition:box-shadow .15s;',
		'}',
		'#dd-toggle:hover{box-shadow:0 3px 14px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.1);}',
		'#dd-toggle .dd-sw{',
		'  width:28px; height:16px; border-radius:8px;',
		'  background:#c3c4c7; position:relative; flex-shrink:0;',
		'  transition:background .2s;',
		'}',
		'#dd-toggle .dd-sw::after{',
		'  content:""; position:absolute;',
		'  width:12px; height:12px; border-radius:50%;',
		'  background:#fff; top:2px; left:2px;',
		'  transition:transform .2s;',
		'}',
		'#dd-toggle.dd-on .dd-sw{background:#2271b1;}',
		'#dd-toggle.dd-on .dd-sw::after{transform:translateX(12px);}',
		'#dd-toggle .dd-lbl{color:#a7aaad; transition:color .15s;}',
		'#dd-toggle.dd-on .dd-lbl-after{color:#2271b1;}',
		'#dd-toggle:not(.dd-on) .dd-lbl-before{color:#1d2327;}',
	].join( '' );

	function applyState( $toggle, isOn ) {
		$toggle.toggleClass( 'dd-on', isOn );

		if ( isOn ) {
			$( 'link#dashboard-design-css' ).prop( 'disabled', false );
			bindDesign();
		} else {
			$( 'link#dashboard-design-css' ).prop( 'disabled', true );
			bindWP();
		}

		localStorage.setItem( STORAGE_KEY, isOn ? 'after' : 'before' );
	}

	function initToggle( startOn ) {
		$( '<style id="dd-toggle-css">' + TOGGLE_CSS + '</style>' ).appendTo( 'head' );

		var $toggle = $(
			'<div id="dd-toggle" role="switch" aria-checked="' + ( startOn ? 'true' : 'false' ) + '">' +
				'<span class="dd-lbl dd-lbl-before">Before</span>' +
				'<span class="dd-sw"></span>' +
				'<span class="dd-lbl dd-lbl-after">After</span>' +
			'</div>'
		);

		if ( startOn ) {
			$toggle.addClass( 'dd-on' );
		}

		$( 'body' ).append( $toggle );

		$toggle.on( 'click', function () {
			var nowOn = ! $toggle.hasClass( 'dd-on' );
			$toggle.attr( 'aria-checked', nowOn ? 'true' : 'false' );
			applyState( $toggle, nowOn );
		} );
	}

	// ── Init ─────────────────────────────────────────────────────────────────

	$( window ).on( 'load', function () {
		var startOn = localStorage.getItem( STORAGE_KEY ) !== 'before';

		if ( startOn ) {
			bindDesign();
		}
		// "before" on load: leave WP's handlers intact; CSS is already loaded
		// (brief flash is acceptable for a developer-facing tool — fixing it
		// properly would require a cookie read on the PHP side)

		initToggle( startOn );

		if ( ! startOn ) {
			$( 'link#dashboard-design-css' ).prop( 'disabled', true );
		}
	} );

} )( jQuery );
