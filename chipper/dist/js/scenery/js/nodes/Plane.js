// Copyright 2013-2024, University of Colorado Boulder

/**
 * A node which always fills the entire screen, no matter what the transform is.
 * Used for showing an overlay on the screen e.g., when a popup dialog is shown.
 * This can fade the background to focus on the dialog/popup as well as intercept mouse events for dismissing the dialog/popup.
 * Note: This is currently implemented using large numbers, it should be rewritten to work in any coordinate frame, possibly using phet.kite.Shape.plane()
 * TODO: Implement using infinite geometry https://github.com/phetsims/scenery/issues/1581
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import { Rectangle, scenery } from '../imports.js';
export default class Plane extends Rectangle {
  constructor(options) {
    super(-2000, -2000, 6000, 6000, options);
  }
}
scenery.register('Plane', Plane);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWN0YW5nbGUiLCJzY2VuZXJ5IiwiUGxhbmUiLCJjb25zdHJ1Y3RvciIsIm9wdGlvbnMiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlBsYW5lLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEEgbm9kZSB3aGljaCBhbHdheXMgZmlsbHMgdGhlIGVudGlyZSBzY3JlZW4sIG5vIG1hdHRlciB3aGF0IHRoZSB0cmFuc2Zvcm0gaXMuXHJcbiAqIFVzZWQgZm9yIHNob3dpbmcgYW4gb3ZlcmxheSBvbiB0aGUgc2NyZWVuIGUuZy4sIHdoZW4gYSBwb3B1cCBkaWFsb2cgaXMgc2hvd24uXHJcbiAqIFRoaXMgY2FuIGZhZGUgdGhlIGJhY2tncm91bmQgdG8gZm9jdXMgb24gdGhlIGRpYWxvZy9wb3B1cCBhcyB3ZWxsIGFzIGludGVyY2VwdCBtb3VzZSBldmVudHMgZm9yIGRpc21pc3NpbmcgdGhlIGRpYWxvZy9wb3B1cC5cclxuICogTm90ZTogVGhpcyBpcyBjdXJyZW50bHkgaW1wbGVtZW50ZWQgdXNpbmcgbGFyZ2UgbnVtYmVycywgaXQgc2hvdWxkIGJlIHJld3JpdHRlbiB0byB3b3JrIGluIGFueSBjb29yZGluYXRlIGZyYW1lLCBwb3NzaWJseSB1c2luZyBwaGV0LmtpdGUuU2hhcGUucGxhbmUoKVxyXG4gKiBUT0RPOiBJbXBsZW1lbnQgdXNpbmcgaW5maW5pdGUgZ2VvbWV0cnkgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgeyBSZWN0YW5nbGUsIFJlY3RhbmdsZU9wdGlvbnMsIHNjZW5lcnkgfSBmcm9tICcuLi9pbXBvcnRzLmpzJztcclxuXHJcbmV4cG9ydCB0eXBlIFBsYW5lT3B0aW9ucyA9IFJlY3RhbmdsZU9wdGlvbnM7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQbGFuZSBleHRlbmRzIFJlY3RhbmdsZSB7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBvcHRpb25zPzogUGxhbmVPcHRpb25zICkge1xyXG4gICAgc3VwZXIoIC0yMDAwLCAtMjAwMCwgNjAwMCwgNjAwMCwgb3B0aW9ucyApO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ1BsYW5lJywgUGxhbmUgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxTQUFTQSxTQUFTLEVBQW9CQyxPQUFPLFFBQVEsZUFBZTtBQUlwRSxlQUFlLE1BQU1DLEtBQUssU0FBU0YsU0FBUyxDQUFDO0VBQ3BDRyxXQUFXQSxDQUFFQyxPQUFzQixFQUFHO0lBQzNDLEtBQUssQ0FBRSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFQSxPQUFRLENBQUM7RUFDNUM7QUFDRjtBQUVBSCxPQUFPLENBQUNJLFFBQVEsQ0FBRSxPQUFPLEVBQUVILEtBQU0sQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==