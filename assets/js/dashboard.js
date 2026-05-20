/**
 * Dashboard Design — custom JS for /wp-admin/index.php
 *
 * Replaces postbox snap-toggle with the same slide WP uses for Screen Options / Help.
 */
( function ( $ ) {
	'use strict';

	$( window ).on( 'load', function () {
		var $handles = $( '.postbox .hndle, .postbox .handlediv' );

		$handles.off( 'click.postboxes' );
		$handles.on( 'click.dashboard-design', function () {
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
		} );
	} );
} )( jQuery );
