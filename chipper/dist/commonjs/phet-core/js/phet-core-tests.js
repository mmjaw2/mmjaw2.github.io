"use strict";

var _qunitStart = _interopRequireDefault(require("../../chipper/js/sim-tests/qunitStart.js"));
require("./arrayDifferenceTests.js");
require("./arrayRemoveTests.js");
require("./assertHasPropertiesTests.js");
require("./assertMutuallyExclusiveOptionsTests.js");
require("./cleanArrayTests.js");
require("./detectPrefixEventTests.js");
require("./detectPrefixTests.js");
require("./dimensionForEachTests.js");
require("./dimensionMapTests.js");
require("./EnumerationDeprecatedTests.js");
require("./EnumerationTests.js");
require("./escapeHTMLTests.js");
require("./interleaveTests.js");
require("./isArrayTests.js");
require("./mergeTests.js");
require("./pairsTests.js");
require("./partitionTests.js");
require("./swapObjectKeysTests.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
// Copyright 2017-2023, University of Colorado Boulder

/**
 * Unit tests for phet-core. Please run once in phet brand and once in brand=phet-io to cover all functionality.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

// Since our tests are loaded asynchronously, we must direct QUnit to begin the tests
(0, _qunitStart["default"])();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcXVuaXRTdGFydCIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwib2JqIiwiX19lc01vZHVsZSIsInF1bml0U3RhcnQiXSwic291cmNlcyI6WyJwaGV0LWNvcmUtdGVzdHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVW5pdCB0ZXN0cyBmb3IgcGhldC1jb3JlLiBQbGVhc2UgcnVuIG9uY2UgaW4gcGhldCBicmFuZCBhbmQgb25jZSBpbiBicmFuZD1waGV0LWlvIHRvIGNvdmVyIGFsbCBmdW5jdGlvbmFsaXR5LlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBxdW5pdFN0YXJ0IGZyb20gJy4uLy4uL2NoaXBwZXIvanMvc2ltLXRlc3RzL3F1bml0U3RhcnQuanMnO1xyXG5pbXBvcnQgJy4vYXJyYXlEaWZmZXJlbmNlVGVzdHMuanMnO1xyXG5pbXBvcnQgJy4vYXJyYXlSZW1vdmVUZXN0cy5qcyc7XHJcbmltcG9ydCAnLi9hc3NlcnRIYXNQcm9wZXJ0aWVzVGVzdHMuanMnO1xyXG5pbXBvcnQgJy4vYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zVGVzdHMuanMnO1xyXG5pbXBvcnQgJy4vY2xlYW5BcnJheVRlc3RzLmpzJztcclxuaW1wb3J0ICcuL2RldGVjdFByZWZpeEV2ZW50VGVzdHMuanMnO1xyXG5pbXBvcnQgJy4vZGV0ZWN0UHJlZml4VGVzdHMuanMnO1xyXG5pbXBvcnQgJy4vZGltZW5zaW9uRm9yRWFjaFRlc3RzLmpzJztcclxuaW1wb3J0ICcuL2RpbWVuc2lvbk1hcFRlc3RzLmpzJztcclxuaW1wb3J0ICcuL0VudW1lcmF0aW9uRGVwcmVjYXRlZFRlc3RzLmpzJztcclxuaW1wb3J0ICcuL0VudW1lcmF0aW9uVGVzdHMuanMnO1xyXG5pbXBvcnQgJy4vZXNjYXBlSFRNTFRlc3RzLmpzJztcclxuaW1wb3J0ICcuL2ludGVybGVhdmVUZXN0cy5qcyc7XHJcbmltcG9ydCAnLi9pc0FycmF5VGVzdHMuanMnO1xyXG5pbXBvcnQgJy4vbWVyZ2VUZXN0cy5qcyc7XHJcbmltcG9ydCAnLi9wYWlyc1Rlc3RzLmpzJztcclxuaW1wb3J0ICcuL3BhcnRpdGlvblRlc3RzLmpzJztcclxuaW1wb3J0ICcuL3N3YXBPYmplY3RLZXlzVGVzdHMuanMnO1xyXG5cclxuLy8gU2luY2Ugb3VyIHRlc3RzIGFyZSBsb2FkZWQgYXN5bmNocm9ub3VzbHksIHdlIG11c3QgZGlyZWN0IFFVbml0IHRvIGJlZ2luIHRoZSB0ZXN0c1xyXG5xdW5pdFN0YXJ0KCk7Il0sIm1hcHBpbmdzIjoiOztBQVNBLElBQUFBLFdBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBQSxPQUFBO0FBQ0FBLE9BQUE7QUFDQUEsT0FBQTtBQUNBQSxPQUFBO0FBQ0FBLE9BQUE7QUFDQUEsT0FBQTtBQUNBQSxPQUFBO0FBQ0FBLE9BQUE7QUFDQUEsT0FBQTtBQUNBQSxPQUFBO0FBQ0FBLE9BQUE7QUFDQUEsT0FBQTtBQUNBQSxPQUFBO0FBQ0FBLE9BQUE7QUFDQUEsT0FBQTtBQUNBQSxPQUFBO0FBQ0FBLE9BQUE7QUFDQUEsT0FBQTtBQUFrQyxTQUFBRCx1QkFBQUUsR0FBQSxXQUFBQSxHQUFBLElBQUFBLEdBQUEsQ0FBQUMsVUFBQSxHQUFBRCxHQUFBLGdCQUFBQSxHQUFBO0FBM0JsQzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBc0JBO0FBQ0EsSUFBQUUsc0JBQVUsRUFBQyxDQUFDIiwiaWdub3JlTGlzdCI6W119