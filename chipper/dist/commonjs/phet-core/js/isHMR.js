"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
// Copyright 2020-2023, University of Colorado Boulder

/**
 * Hot module replacement (HMR) enables reloading and replacing a single module within a running, stateful application.
 * The general pattern is to listen for a module replacement and re-run downstream code that uses the module.
 * For example:
 *
 *  // In a constructor
 *  const initializeWavesNode = () => {
 *   this.wavesNode && this.removeChild( this.wavesNode );
 *   this.wavesNode = new WavesNode( model, this.layoutBounds );
 *   this.addChild( this.wavesNode );
 *  };
 *
 *  initializeWavesNode();
 *
 * // Enable hot module replacement for fast iteration
 * isHMR && module.hot.accept( './WavesNode.js', initializeWavesNode );
 *
 * This can be used in concert with `grunt webpack-dev-server` from a simulation directory to launch a server that
 * supports hot module replacement.
 *
 * Note that when using HMR with a model module, you must pass re-instantiated model elements to corresponding view
 * elements, which can be prohibitively difficult. On the other hand, using HMR on a view can be simpler because often a
 * view element only needs to be swapped out in one place (say, replacing a node). Likewise, using HMR for static or
 * utility functions/modules works very well, since no instances need to be swapped out.
 *
 * When running with webpack-dev-server, a global "module" exists, but window.module does not.  In unbuilt mode,
 * neither "module" nor window.module exist.  This code factors out the check for the global "module".
 *
 * Since this code relies on a try/catch block, you probably should blackbox it in chrome dev tools, see
 * https://developer.chrome.com/devtools/docs/blackboxing#how-to-blackbox
 *
 * TODO: Make sure this gets stripped out on builds, see https://github.com/phetsims/chipper/issues/953
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

var isHMR;
try {
  // @ts-expect-error - hard to use typescript for this NodeJS context
  isHMR = module && module.hot;
} catch (e) {
  isHMR = false;
}

// Not namespaced because Namespace relies on this file
var _default = exports["default"] = isHMR;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJpc0hNUiIsIm1vZHVsZSIsImhvdCIsImUiLCJfZGVmYXVsdCIsImV4cG9ydHMiXSwic291cmNlcyI6WyJpc0hNUi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMC0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBIb3QgbW9kdWxlIHJlcGxhY2VtZW50IChITVIpIGVuYWJsZXMgcmVsb2FkaW5nIGFuZCByZXBsYWNpbmcgYSBzaW5nbGUgbW9kdWxlIHdpdGhpbiBhIHJ1bm5pbmcsIHN0YXRlZnVsIGFwcGxpY2F0aW9uLlxyXG4gKiBUaGUgZ2VuZXJhbCBwYXR0ZXJuIGlzIHRvIGxpc3RlbiBmb3IgYSBtb2R1bGUgcmVwbGFjZW1lbnQgYW5kIHJlLXJ1biBkb3duc3RyZWFtIGNvZGUgdGhhdCB1c2VzIHRoZSBtb2R1bGUuXHJcbiAqIEZvciBleGFtcGxlOlxyXG4gKlxyXG4gKiAgLy8gSW4gYSBjb25zdHJ1Y3RvclxyXG4gKiAgY29uc3QgaW5pdGlhbGl6ZVdhdmVzTm9kZSA9ICgpID0+IHtcclxuICogICB0aGlzLndhdmVzTm9kZSAmJiB0aGlzLnJlbW92ZUNoaWxkKCB0aGlzLndhdmVzTm9kZSApO1xyXG4gKiAgIHRoaXMud2F2ZXNOb2RlID0gbmV3IFdhdmVzTm9kZSggbW9kZWwsIHRoaXMubGF5b3V0Qm91bmRzICk7XHJcbiAqICAgdGhpcy5hZGRDaGlsZCggdGhpcy53YXZlc05vZGUgKTtcclxuICogIH07XHJcbiAqXHJcbiAqICBpbml0aWFsaXplV2F2ZXNOb2RlKCk7XHJcbiAqXHJcbiAqIC8vIEVuYWJsZSBob3QgbW9kdWxlIHJlcGxhY2VtZW50IGZvciBmYXN0IGl0ZXJhdGlvblxyXG4gKiBpc0hNUiAmJiBtb2R1bGUuaG90LmFjY2VwdCggJy4vV2F2ZXNOb2RlLmpzJywgaW5pdGlhbGl6ZVdhdmVzTm9kZSApO1xyXG4gKlxyXG4gKiBUaGlzIGNhbiBiZSB1c2VkIGluIGNvbmNlcnQgd2l0aCBgZ3J1bnQgd2VicGFjay1kZXYtc2VydmVyYCBmcm9tIGEgc2ltdWxhdGlvbiBkaXJlY3RvcnkgdG8gbGF1bmNoIGEgc2VydmVyIHRoYXRcclxuICogc3VwcG9ydHMgaG90IG1vZHVsZSByZXBsYWNlbWVudC5cclxuICpcclxuICogTm90ZSB0aGF0IHdoZW4gdXNpbmcgSE1SIHdpdGggYSBtb2RlbCBtb2R1bGUsIHlvdSBtdXN0IHBhc3MgcmUtaW5zdGFudGlhdGVkIG1vZGVsIGVsZW1lbnRzIHRvIGNvcnJlc3BvbmRpbmcgdmlld1xyXG4gKiBlbGVtZW50cywgd2hpY2ggY2FuIGJlIHByb2hpYml0aXZlbHkgZGlmZmljdWx0LiBPbiB0aGUgb3RoZXIgaGFuZCwgdXNpbmcgSE1SIG9uIGEgdmlldyBjYW4gYmUgc2ltcGxlciBiZWNhdXNlIG9mdGVuIGFcclxuICogdmlldyBlbGVtZW50IG9ubHkgbmVlZHMgdG8gYmUgc3dhcHBlZCBvdXQgaW4gb25lIHBsYWNlIChzYXksIHJlcGxhY2luZyBhIG5vZGUpLiBMaWtld2lzZSwgdXNpbmcgSE1SIGZvciBzdGF0aWMgb3JcclxuICogdXRpbGl0eSBmdW5jdGlvbnMvbW9kdWxlcyB3b3JrcyB2ZXJ5IHdlbGwsIHNpbmNlIG5vIGluc3RhbmNlcyBuZWVkIHRvIGJlIHN3YXBwZWQgb3V0LlxyXG4gKlxyXG4gKiBXaGVuIHJ1bm5pbmcgd2l0aCB3ZWJwYWNrLWRldi1zZXJ2ZXIsIGEgZ2xvYmFsIFwibW9kdWxlXCIgZXhpc3RzLCBidXQgd2luZG93Lm1vZHVsZSBkb2VzIG5vdC4gIEluIHVuYnVpbHQgbW9kZSxcclxuICogbmVpdGhlciBcIm1vZHVsZVwiIG5vciB3aW5kb3cubW9kdWxlIGV4aXN0LiAgVGhpcyBjb2RlIGZhY3RvcnMgb3V0IHRoZSBjaGVjayBmb3IgdGhlIGdsb2JhbCBcIm1vZHVsZVwiLlxyXG4gKlxyXG4gKiBTaW5jZSB0aGlzIGNvZGUgcmVsaWVzIG9uIGEgdHJ5L2NhdGNoIGJsb2NrLCB5b3UgcHJvYmFibHkgc2hvdWxkIGJsYWNrYm94IGl0IGluIGNocm9tZSBkZXYgdG9vbHMsIHNlZVxyXG4gKiBodHRwczovL2RldmVsb3Blci5jaHJvbWUuY29tL2RldnRvb2xzL2RvY3MvYmxhY2tib3hpbmcjaG93LXRvLWJsYWNrYm94XHJcbiAqXHJcbiAqIFRPRE86IE1ha2Ugc3VyZSB0aGlzIGdldHMgc3RyaXBwZWQgb3V0IG9uIGJ1aWxkcywgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9jaGlwcGVyL2lzc3Vlcy85NTNcclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5sZXQgaXNITVI6IGJvb2xlYW47XHJcblxyXG50cnkge1xyXG4gIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBoYXJkIHRvIHVzZSB0eXBlc2NyaXB0IGZvciB0aGlzIE5vZGVKUyBjb250ZXh0XHJcbiAgaXNITVIgPSBtb2R1bGUgJiYgbW9kdWxlLmhvdDtcclxufVxyXG5jYXRjaCggZSApIHtcclxuICBpc0hNUiA9IGZhbHNlO1xyXG59XHJcblxyXG4vLyBOb3QgbmFtZXNwYWNlZCBiZWNhdXNlIE5hbWVzcGFjZSByZWxpZXMgb24gdGhpcyBmaWxlXHJcblxyXG5leHBvcnQgZGVmYXVsdCBpc0hNUjsiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBSUEsS0FBYztBQUVsQixJQUFJO0VBQ0Y7RUFDQUEsS0FBSyxHQUFHQyxNQUFNLElBQUlBLE1BQU0sQ0FBQ0MsR0FBRztBQUM5QixDQUFDLENBQ0QsT0FBT0MsQ0FBQyxFQUFHO0VBQ1RILEtBQUssR0FBRyxLQUFLO0FBQ2Y7O0FBRUE7QUFBQSxJQUFBSSxRQUFBLEdBQUFDLE9BQUEsY0FFZUwsS0FBSyIsImlnbm9yZUxpc3QiOltdfQ==