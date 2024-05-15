"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
// Copyright 2020, University of Colorado Boulder

/**
 * Returns the list of repos listed in active-repos that are not checked out.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var getRepoList = require('./getRepoList');
var fs = require('fs');

/**
 * Returns the list of repos listed in active-repos that are not checked out.
 * @public
 *
 * @returns {Array.<string>}
 */
module.exports = function () {
  var activeRepos = getRepoList('active-repos');
  var missingRepos = [];
  var _iterator = _createForOfIteratorHelper(activeRepos),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var repo = _step.value;
      if (!fs.existsSync("../".concat(repo))) {
        missingRepos.push(repo);
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return missingRepos;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJnZXRSZXBvTGlzdCIsInJlcXVpcmUiLCJmcyIsIm1vZHVsZSIsImV4cG9ydHMiLCJhY3RpdmVSZXBvcyIsIm1pc3NpbmdSZXBvcyIsIl9pdGVyYXRvciIsIl9jcmVhdGVGb3JPZkl0ZXJhdG9ySGVscGVyIiwiX3N0ZXAiLCJzIiwibiIsImRvbmUiLCJyZXBvIiwidmFsdWUiLCJleGlzdHNTeW5jIiwiY29uY2F0IiwicHVzaCIsImVyciIsImUiLCJmIl0sInNvdXJjZXMiOlsiZ2V0TWlzc2luZ1JlcG9zLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIwLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBsaXN0IG9mIHJlcG9zIGxpc3RlZCBpbiBhY3RpdmUtcmVwb3MgdGhhdCBhcmUgbm90IGNoZWNrZWQgb3V0LlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgZ2V0UmVwb0xpc3QgPSByZXF1aXJlKCAnLi9nZXRSZXBvTGlzdCcgKTtcclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcblxyXG4vKipcclxuICogUmV0dXJucyB0aGUgbGlzdCBvZiByZXBvcyBsaXN0ZWQgaW4gYWN0aXZlLXJlcG9zIHRoYXQgYXJlIG5vdCBjaGVja2VkIG91dC5cclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xyXG4gIGNvbnN0IGFjdGl2ZVJlcG9zID0gZ2V0UmVwb0xpc3QoICdhY3RpdmUtcmVwb3MnICk7XHJcbiAgY29uc3QgbWlzc2luZ1JlcG9zID0gW107XHJcblxyXG4gIGZvciAoIGNvbnN0IHJlcG8gb2YgYWN0aXZlUmVwb3MgKSB7XHJcbiAgICBpZiAoICFmcy5leGlzdHNTeW5jKCBgLi4vJHtyZXBvfWAgKSApIHtcclxuICAgICAgbWlzc2luZ1JlcG9zLnB1c2goIHJlcG8gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBtaXNzaW5nUmVwb3M7XHJcbn07Il0sIm1hcHBpbmdzIjoiOzs7OztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBTUEsV0FBVyxHQUFHQyxPQUFPLENBQUUsZUFBZ0IsQ0FBQztBQUM5QyxJQUFNQyxFQUFFLEdBQUdELE9BQU8sQ0FBRSxJQUFLLENBQUM7O0FBRTFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBRSxNQUFNLENBQUNDLE9BQU8sR0FBRyxZQUFXO0VBQzFCLElBQU1DLFdBQVcsR0FBR0wsV0FBVyxDQUFFLGNBQWUsQ0FBQztFQUNqRCxJQUFNTSxZQUFZLEdBQUcsRUFBRTtFQUFDLElBQUFDLFNBQUEsR0FBQUMsMEJBQUEsQ0FFSkgsV0FBVztJQUFBSSxLQUFBO0VBQUE7SUFBL0IsS0FBQUYsU0FBQSxDQUFBRyxDQUFBLE1BQUFELEtBQUEsR0FBQUYsU0FBQSxDQUFBSSxDQUFBLElBQUFDLElBQUEsR0FBa0M7TUFBQSxJQUF0QkMsSUFBSSxHQUFBSixLQUFBLENBQUFLLEtBQUE7TUFDZCxJQUFLLENBQUNaLEVBQUUsQ0FBQ2EsVUFBVSxPQUFBQyxNQUFBLENBQVFILElBQUksQ0FBRyxDQUFDLEVBQUc7UUFDcENQLFlBQVksQ0FBQ1csSUFBSSxDQUFFSixJQUFLLENBQUM7TUFDM0I7SUFDRjtFQUFDLFNBQUFLLEdBQUE7SUFBQVgsU0FBQSxDQUFBWSxDQUFBLENBQUFELEdBQUE7RUFBQTtJQUFBWCxTQUFBLENBQUFhLENBQUE7RUFBQTtFQUVELE9BQU9kLFlBQVk7QUFDckIsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==