"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _getGlobal = _interopRequireDefault(require("./getGlobal.js"));
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
// Copyright 2021-2023, University of Colorado Boulder

/**
 * Logs a global variable by converting it to JSON, then writing to phet.log. If the global is undefined,
 * the log will show 'undefined'.  This is currently used to log a collection of query parameters (which exist
 * as globals), but could be applied to other globals.  If phet.log is undefined, this is a no-op.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

/**
 * @param globalString - the name of the global
 */
function logGlobal(globalString) {
  phet.log && phet.log("".concat(globalString, ": ").concat(JSON.stringify((0, _getGlobal["default"])(globalString), null, 2)));
}
_phetCore["default"].register('logGlobal', logGlobal);
var _default = exports["default"] = logGlobal;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZ2V0R2xvYmFsIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfcGhldENvcmUiLCJvYmoiLCJfX2VzTW9kdWxlIiwibG9nR2xvYmFsIiwiZ2xvYmFsU3RyaW5nIiwicGhldCIsImxvZyIsImNvbmNhdCIsIkpTT04iLCJzdHJpbmdpZnkiLCJnZXRHbG9iYWwiLCJwaGV0Q29yZSIsInJlZ2lzdGVyIiwiX2RlZmF1bHQiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsibG9nR2xvYmFsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIExvZ3MgYSBnbG9iYWwgdmFyaWFibGUgYnkgY29udmVydGluZyBpdCB0byBKU09OLCB0aGVuIHdyaXRpbmcgdG8gcGhldC5sb2cuIElmIHRoZSBnbG9iYWwgaXMgdW5kZWZpbmVkLFxyXG4gKiB0aGUgbG9nIHdpbGwgc2hvdyAndW5kZWZpbmVkJy4gIFRoaXMgaXMgY3VycmVudGx5IHVzZWQgdG8gbG9nIGEgY29sbGVjdGlvbiBvZiBxdWVyeSBwYXJhbWV0ZXJzICh3aGljaCBleGlzdFxyXG4gKiBhcyBnbG9iYWxzKSwgYnV0IGNvdWxkIGJlIGFwcGxpZWQgdG8gb3RoZXIgZ2xvYmFscy4gIElmIHBoZXQubG9nIGlzIHVuZGVmaW5lZCwgdGhpcyBpcyBhIG5vLW9wLlxyXG4gKlxyXG4gKiBAYXV0aG9yIENocmlzIE1hbGxleSAoUGl4ZWxab29tLCBJbmMuKVxyXG4gKi9cclxuXHJcbmltcG9ydCBnZXRHbG9iYWwgZnJvbSAnLi9nZXRHbG9iYWwuanMnO1xyXG5pbXBvcnQgcGhldENvcmUgZnJvbSAnLi9waGV0Q29yZS5qcyc7XHJcblxyXG4vKipcclxuICogQHBhcmFtIGdsb2JhbFN0cmluZyAtIHRoZSBuYW1lIG9mIHRoZSBnbG9iYWxcclxuICovXHJcbmZ1bmN0aW9uIGxvZ0dsb2JhbCggZ2xvYmFsU3RyaW5nOiBzdHJpbmcgKTogdm9pZCB7XHJcbiAgcGhldC5sb2cgJiYgcGhldC5sb2coIGAke2dsb2JhbFN0cmluZ306ICR7SlNPTi5zdHJpbmdpZnkoIGdldEdsb2JhbCggZ2xvYmFsU3RyaW5nICksIG51bGwsIDIgKX1gICk7XHJcbn1cclxuXHJcbnBoZXRDb3JlLnJlZ2lzdGVyKCAnbG9nR2xvYmFsJywgbG9nR2xvYmFsICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBsb2dHbG9iYWw7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFVQSxJQUFBQSxVQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxTQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFBcUMsU0FBQUQsdUJBQUFHLEdBQUEsV0FBQUEsR0FBQSxJQUFBQSxHQUFBLENBQUFDLFVBQUEsR0FBQUQsR0FBQSxnQkFBQUEsR0FBQTtBQVhyQzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFLQTtBQUNBO0FBQ0E7QUFDQSxTQUFTRSxTQUFTQSxDQUFFQyxZQUFvQixFQUFTO0VBQy9DQyxJQUFJLENBQUNDLEdBQUcsSUFBSUQsSUFBSSxDQUFDQyxHQUFHLElBQUFDLE1BQUEsQ0FBS0gsWUFBWSxRQUFBRyxNQUFBLENBQUtDLElBQUksQ0FBQ0MsU0FBUyxDQUFFLElBQUFDLHFCQUFTLEVBQUVOLFlBQWEsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFFLENBQUMsQ0FBRyxDQUFDO0FBQ3BHO0FBRUFPLG9CQUFRLENBQUNDLFFBQVEsQ0FBRSxXQUFXLEVBQUVULFNBQVUsQ0FBQztBQUFDLElBQUFVLFFBQUEsR0FBQUMsT0FBQSxjQUU3QlgsU0FBUyIsImlnbm9yZUxpc3QiOltdfQ==