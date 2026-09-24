/**
 * Dashboard Design — custom JS for /wp-admin/index.php
 *
 * 1. Replaces postbox snap-toggle with the same slide WP uses for Screen Options / Help.
 * 2. FLIP-animates the move up/down reorder so widgets glide to their new spot.
 * 3. Mode switcher: floating pill that picks between three looks —
 *    Current (stock WP), Elevation (soft shadows), Flat (WPDS cards) — by
 *    enabling/disabling the plugin stylesheets. Persisted in localStorage.
 */
( function ( $ ) {
	'use strict';

	var STORAGE_KEY = 'dd-mode';
	var LEGACY_KEY  = 'dd-before-after';
	var MODES       = [ 'current', 'elevation', 'flat' ];

	// Tracks whether a design mode is active; the reorder animation and the
	// slide toggle apply in Elevation and Flat, but not Current.
	var designOn = false;

	// ── Postbox animation ─────────────────────────────────────────────────────

	function handlePostboxClick( event ) {
		// WP can (re)bind its own snap-toggle after our unbind ran (its postbox
		// init timing moved in newer WP). Ours is bound first, so cut the chain
		// here or both handlers fire and the toggle reverts itself.
		event.stopImmediatePropagation();

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
		// off first: WP may have bound its own copy after our load handler ran,
		// and a second .postboxes binding would double-toggle in Before mode
		$h.off( 'click.postboxes' );
		$h.on( 'click.postboxes', postboxes.handle_click );
	}

	// ── Reorder (move up/down) animation ──────────────────────────────────────
	// WP core moves the .postbox in the DOM instantly when a move up/down button
	// is clicked. We FLIP it: a capture-phase listener records every widget's
	// position *before* WP's click handler runs, then — after WP has moved the
	// DOM but before the browser paints — each displaced widget is pinned back to
	// its old spot and released, sliding to its new position with the same 200ms
	// feel as the expand/collapse slide.

	var FLIP_MS = 200;

	function prefersReducedMotion() {
		return (
			window.matchMedia &&
			window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches
		);
	}

	function columnBoxes( container ) {
		return Array.prototype.filter.call( container.children, function ( el ) {
			return el.classList && el.classList.contains( 'postbox' );
		} );
	}

	function flipReorder( button ) {
		var container = button.closest( '.meta-box-sortables' );
		if ( ! container ) {
			return;
		}

		var boxes   = columnBoxes( container );
		var clicked = button.closest( '.postbox' );

		// Finish any in-flight FLIP first, so we measure true layout positions
		// (getBoundingClientRect reports the transformed rect mid-animation).
		boxes.forEach( function ( el ) {
			el.style.transition = '';
			el.style.transform  = '';
		} );

		var first = boxes.map( function ( el ) {
			return el.getBoundingClientRect();
		} );

		// WP's click handler runs next (synchronously, after this capture-phase
		// listener) and moves the DOM. The rAF fires before the next paint.
		window.requestAnimationFrame( function () {
			var moved = [];

			boxes.forEach( function ( el, i ) {
				var last = el.getBoundingClientRect();
				var dx   = first[ i ].left - last.left;
				var dy   = first[ i ].top - last.top;

				if ( ! dx && ! dy ) {
					return;
				}

				// Invert: pin the widget to its old spot with no transition.
				el.style.transition = 'none';
				el.style.transform  = 'translate(' + dx + 'px,' + dy + 'px)';
				moved.push( el );
			} );

			if ( ! moved.length ) {
				return;
			}

			// Raise the widget you actually moved so it glides over the other
			// during the crossover instead of under it.
			if ( clicked ) {
				clicked.style.position = 'relative';
				clicked.style.zIndex   = '1';
			}

			// Force a reflow so the inverted transforms take hold as the start
			// state before we transition back to zero.
			void container.offsetHeight;

			window.requestAnimationFrame( function () {
				moved.forEach( function ( el ) {
					el.style.transition = 'transform ' + FLIP_MS + 'ms ease';
					el.style.transform  = '';

					var done = function ( event ) {
						if ( event.propertyName !== 'transform' ) {
							return;
						}
						el.style.transition = '';
						if ( el === clicked ) {
							el.style.position = '';
							el.style.zIndex   = '';
						}
						el.removeEventListener( 'transitionend', done );
					};
					el.addEventListener( 'transitionend', done );
				} );
			} );
		} );
	}

	function onReorderCapture( event ) {
		if ( ! designOn || prefersReducedMotion() ) {
			return;
		}

		var target = event.target;
		if ( ! target || ! target.closest ) {
			return;
		}

		var button = target.closest(
			'.handle-order-higher, .handle-order-lower'
		);
		if ( ! button || button.disabled ) {
			return;
		}

		flipReorder( button );
	}

	// ── Mode switcher ─────────────────────────────────────────────────────────

	var TOGGLE_CSS = [
		'#dd-toggle{',
		'  position:fixed; bottom:20px; right:20px; z-index:99999;',
		'  display:flex; align-items:center; gap:2px;',
		'  background:#fff; border-radius:18px;',
		'  padding:4px;',
		'  box-shadow:0 2px 10px rgba(0,0,0,.14),0 0 0 1px rgba(0,0,0,.08);',
		'  font:500 11px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
		'  letter-spacing:.03em; text-transform:uppercase;',
		'  user-select:none;',
		'}',
		'#dd-toggle .dd-seg{',
		'  padding:6px 10px; border-radius:13px;',
		'  color:#787c82; cursor:pointer;',
		'  transition:color .15s,background .15s;',
		'}',
		'#dd-toggle .dd-seg:hover{color:#1d2327;}',
		'#dd-toggle .dd-seg.dd-active{background:#1d2327; color:#fff;}',
	].join( '' );

	function readMode() {
		var mode = localStorage.getItem( STORAGE_KEY );

		// Migrate the old two-state key: before → current, after → elevation.
		if ( ! mode ) {
			var legacy = localStorage.getItem( LEGACY_KEY );
			if ( legacy ) {
				mode = 'before' === legacy ? 'current' : 'elevation';
				localStorage.removeItem( LEGACY_KEY );
			}
		}

		return -1 !== MODES.indexOf( mode ) ? mode : 'elevation';
	}

	// Flip stylesheets via the media attribute rather than link.disabled:
	// Chrome drops a sheet whose link is disabled around load time and does
	// not reliably reload it when the property is set back to false.
	function setSheet( id, on ) {
		var link = document.getElementById( id );
		if ( link ) {
			link.media = on ? 'all' : 'not all';
			link.disabled = false;
			link.removeAttribute( 'disabled' );
		}
	}

	function applyMode( mode ) {
		setSheet( 'dashboard-design-base-css', 'current' !== mode );
		setSheet( 'dashboard-design-elevation-css', 'elevation' === mode );
		setSheet( 'dashboard-design-flat-css', 'flat' === mode );

		designOn = 'current' !== mode;

		if ( designOn ) {
			bindDesign();
		} else {
			bindWP();
		}

		$( '#dd-toggle .dd-seg' ).each( function () {
			var active = $( this ).data( 'mode' ) === mode;
			$( this ).toggleClass( 'dd-active', active );
			$( this ).attr( 'aria-checked', active ? 'true' : 'false' );
		} );

		localStorage.setItem( STORAGE_KEY, mode );
	}

	function initToggle( mode ) {
		$( '<style id="dd-toggle-css">' + TOGGLE_CSS + '</style>' ).appendTo( 'head' );

		var labels  = { current: 'Current', elevation: 'Elevation', flat: 'Flat' };
		var $toggle = $( '<div id="dd-toggle" role="radiogroup" aria-label="Dashboard design mode"></div>' );

		MODES.forEach( function ( m ) {
			$( '<span class="dd-seg" role="radio" tabindex="0"></span>' )
				.text( labels[ m ] )
				.data( 'mode', m )
				.toggleClass( 'dd-active', m === mode )
				.attr( 'aria-checked', m === mode ? 'true' : 'false' )
				.appendTo( $toggle );
		} );

		$( 'body' ).append( $toggle );

		$toggle.on( 'click keydown', '.dd-seg', function ( event ) {
			if ( 'keydown' === event.type && 'Enter' !== event.key && ' ' !== event.key ) {
				return;
			}
			event.preventDefault();
			applyMode( $( this ).data( 'mode' ) );
		} );
	}

	// ── Init ─────────────────────────────────────────────────────────────────

	$( window ).on( 'load', function () {
		var mode = readMode();

		// Capture phase so this runs before WP's own click handler moves the DOM.
		document.addEventListener( 'click', onReorderCapture, true );

		initToggle( mode );

		// All three stylesheets load active; applyMode() switches the inactive
		// ones to media="not all". A brief flash in Current/Flat on load is
		// acceptable for a developer-facing tool — fixing it properly would
		// require a cookie read on the PHP side.
		applyMode( mode );
	} );

} )( jQuery );
