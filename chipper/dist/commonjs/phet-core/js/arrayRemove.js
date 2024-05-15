"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
// Copyright 2014-2023, University of Colorado Boulder

/**
 * Removes a single (the first) matching object from an Array.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

function arrayRemove(array, toRemove) {
  assert && assert(Array.isArray(array), 'arrayRemove takes an Array');
  var index = _.indexOf(array, toRemove);
  assert && assert(index >= 0, 'item not found in Array');
  array.splice(index, 1);
}
_phetCore["default"].register('arrayRemove', arrayRemove);
var _default = exports["default"] = arrayRemove;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcGhldENvcmUiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJhcnJheVJlbW92ZSIsImFycmF5IiwidG9SZW1vdmUiLCJhc3NlcnQiLCJBcnJheSIsImlzQXJyYXkiLCJpbmRleCIsIl8iLCJpbmRleE9mIiwic3BsaWNlIiwicGhldENvcmUiLCJyZWdpc3RlciIsIl9kZWZhdWx0IiwiZXhwb3J0cyJdLCJzb3VyY2VzIjpbImFycmF5UmVtb3ZlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE0LTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYSBzaW5nbGUgKHRoZSBmaXJzdCkgbWF0Y2hpbmcgb2JqZWN0IGZyb20gYW4gQXJyYXkuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgcGhldENvcmUgZnJvbSAnLi9waGV0Q29yZS5qcyc7XHJcblxyXG5mdW5jdGlvbiBhcnJheVJlbW92ZTxUPiggYXJyYXk6IFRbXSwgdG9SZW1vdmU6IFQgKTogdm9pZCB7XHJcbiAgYXNzZXJ0ICYmIGFzc2VydCggQXJyYXkuaXNBcnJheSggYXJyYXkgKSwgJ2FycmF5UmVtb3ZlIHRha2VzIGFuIEFycmF5JyApO1xyXG5cclxuICBjb25zdCBpbmRleCA9IF8uaW5kZXhPZiggYXJyYXksIHRvUmVtb3ZlICk7XHJcbiAgYXNzZXJ0ICYmIGFzc2VydCggaW5kZXggPj0gMCwgJ2l0ZW0gbm90IGZvdW5kIGluIEFycmF5JyApO1xyXG5cclxuICBhcnJheS5zcGxpY2UoIGluZGV4LCAxICk7XHJcbn1cclxuXHJcbnBoZXRDb3JlLnJlZ2lzdGVyKCAnYXJyYXlSZW1vdmUnLCBhcnJheVJlbW92ZSApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXJyYXlSZW1vdmU7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFRQSxJQUFBQSxTQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFBcUMsU0FBQUQsdUJBQUFFLEdBQUEsV0FBQUEsR0FBQSxJQUFBQSxHQUFBLENBQUFDLFVBQUEsR0FBQUQsR0FBQSxnQkFBQUEsR0FBQTtBQVJyQzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUlBLFNBQVNFLFdBQVdBLENBQUtDLEtBQVUsRUFBRUMsUUFBVyxFQUFTO0VBQ3ZEQyxNQUFNLElBQUlBLE1BQU0sQ0FBRUMsS0FBSyxDQUFDQyxPQUFPLENBQUVKLEtBQU0sQ0FBQyxFQUFFLDRCQUE2QixDQUFDO0VBRXhFLElBQU1LLEtBQUssR0FBR0MsQ0FBQyxDQUFDQyxPQUFPLENBQUVQLEtBQUssRUFBRUMsUUFBUyxDQUFDO0VBQzFDQyxNQUFNLElBQUlBLE1BQU0sQ0FBRUcsS0FBSyxJQUFJLENBQUMsRUFBRSx5QkFBMEIsQ0FBQztFQUV6REwsS0FBSyxDQUFDUSxNQUFNLENBQUVILEtBQUssRUFBRSxDQUFFLENBQUM7QUFDMUI7QUFFQUksb0JBQVEsQ0FBQ0MsUUFBUSxDQUFFLGFBQWEsRUFBRVgsV0FBWSxDQUFDO0FBQUMsSUFBQVksUUFBQSxHQUFBQyxPQUFBLGNBRWpDYixXQUFXIiwiaWdub3JlTGlzdCI6W119