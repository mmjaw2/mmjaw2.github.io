"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; } // Copyright 2019-2023, University of Colorado Boulder
/**
 * Throws an assertion error if mutually exclusive options are specified.
 *
 * @example
 * assertMutuallyExclusiveOptions( { tree:1, flower:2 }, [ 'tree' ], [ 'flower' ] ) => error
 * assertMutuallyExclusiveOptions( { flower:2 }, [ 'tree' ], [ 'flower' ] ) => no error
 * assertMutuallyExclusiveOptions( { tree:1 }, [ 'tree' ], [ 'flower' ] ) => no error
 * assertMutuallyExclusiveOptions( { tree:1, mountain:2 }, [ 'tree', 'mountain' ], [ 'flower' ] ) => no error
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
/**
 * @param options - an options object.  Could be before or after merge, and may therefore
 *                                        - be null or undefined
 * @param sets - families of mutually exclusive option keys, see examples above.
 */
var assertMutuallyExclusiveOptions = function assertMutuallyExclusiveOptions(options) {
  if (assert && options) {
    for (var _len = arguments.length, sets = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      sets[_key - 1] = arguments[_key];
    }
    // Determine which options are used from each set
    var usedElementsFromEachSet = sets.map(function (set) {
      var _ref;
      return Object.keys((_ref = _).pick.apply(_ref, [options].concat(_toConsumableArray(set))));
    });

    // If any element is used from more than one set...
    if (usedElementsFromEachSet.filter(function (usedElements) {
      return usedElements.length > 0;
    }).length > 1) {
      // Output the errant options.
      assert && assert(false, "Cannot simultaneously specify ".concat(usedElementsFromEachSet.join(' and ')));
    }
  }
};
_phetCore["default"].register('assertMutuallyExclusiveOptions', assertMutuallyExclusiveOptions);
var _default = exports["default"] = assertMutuallyExclusiveOptions;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcGhldENvcmUiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJfdG9Db25zdW1hYmxlQXJyYXkiLCJhcnIiLCJfYXJyYXlXaXRob3V0SG9sZXMiLCJfaXRlcmFibGVUb0FycmF5IiwiX3Vuc3VwcG9ydGVkSXRlcmFibGVUb0FycmF5IiwiX25vbkl0ZXJhYmxlU3ByZWFkIiwiVHlwZUVycm9yIiwibyIsIm1pbkxlbiIsIl9hcnJheUxpa2VUb0FycmF5IiwibiIsIk9iamVjdCIsInByb3RvdHlwZSIsInRvU3RyaW5nIiwiY2FsbCIsInNsaWNlIiwiY29uc3RydWN0b3IiLCJuYW1lIiwiQXJyYXkiLCJmcm9tIiwidGVzdCIsIml0ZXIiLCJTeW1ib2wiLCJpdGVyYXRvciIsImlzQXJyYXkiLCJsZW4iLCJsZW5ndGgiLCJpIiwiYXJyMiIsImFzc2VydE11dHVhbGx5RXhjbHVzaXZlT3B0aW9ucyIsIm9wdGlvbnMiLCJhc3NlcnQiLCJfbGVuIiwiYXJndW1lbnRzIiwic2V0cyIsIl9rZXkiLCJ1c2VkRWxlbWVudHNGcm9tRWFjaFNldCIsIm1hcCIsInNldCIsIl9yZWYiLCJrZXlzIiwiXyIsInBpY2siLCJhcHBseSIsImNvbmNhdCIsImZpbHRlciIsInVzZWRFbGVtZW50cyIsImpvaW4iLCJwaGV0Q29yZSIsInJlZ2lzdGVyIiwiX2RlZmF1bHQiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsiYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE5LTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFRocm93cyBhbiBhc3NlcnRpb24gZXJyb3IgaWYgbXV0dWFsbHkgZXhjbHVzaXZlIG9wdGlvbnMgYXJlIHNwZWNpZmllZC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zKCB7IHRyZWU6MSwgZmxvd2VyOjIgfSwgWyAndHJlZScgXSwgWyAnZmxvd2VyJyBdICkgPT4gZXJyb3JcclxuICogYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zKCB7IGZsb3dlcjoyIH0sIFsgJ3RyZWUnIF0sIFsgJ2Zsb3dlcicgXSApID0+IG5vIGVycm9yXHJcbiAqIGFzc2VydE11dHVhbGx5RXhjbHVzaXZlT3B0aW9ucyggeyB0cmVlOjEgfSwgWyAndHJlZScgXSwgWyAnZmxvd2VyJyBdICkgPT4gbm8gZXJyb3JcclxuICogYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zKCB7IHRyZWU6MSwgbW91bnRhaW46MiB9LCBbICd0cmVlJywgJ21vdW50YWluJyBdLCBbICdmbG93ZXInIF0gKSA9PiBubyBlcnJvclxyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBwaGV0Q29yZSBmcm9tICcuL3BoZXRDb3JlLmpzJztcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0gb3B0aW9ucyAtIGFuIG9wdGlvbnMgb2JqZWN0LiAgQ291bGQgYmUgYmVmb3JlIG9yIGFmdGVyIG1lcmdlLCBhbmQgbWF5IHRoZXJlZm9yZVxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIGJlIG51bGwgb3IgdW5kZWZpbmVkXHJcbiAqIEBwYXJhbSBzZXRzIC0gZmFtaWxpZXMgb2YgbXV0dWFsbHkgZXhjbHVzaXZlIG9wdGlvbiBrZXlzLCBzZWUgZXhhbXBsZXMgYWJvdmUuXHJcbiAqL1xyXG5jb25zdCBhc3NlcnRNdXR1YWxseUV4Y2x1c2l2ZU9wdGlvbnMgPSBmdW5jdGlvbiggb3B0aW9uczogb2JqZWN0IHwgbnVsbCB8IHVuZGVmaW5lZCwgLi4uc2V0czogc3RyaW5nW11bXSApOiB2b2lkIHtcclxuICBpZiAoIGFzc2VydCAmJiBvcHRpb25zICkge1xyXG5cclxuICAgIC8vIERldGVybWluZSB3aGljaCBvcHRpb25zIGFyZSB1c2VkIGZyb20gZWFjaCBzZXRcclxuICAgIGNvbnN0IHVzZWRFbGVtZW50c0Zyb21FYWNoU2V0ID0gc2V0cy5tYXAoIHNldCA9PiBPYmplY3Qua2V5cyggXy5waWNrKCBvcHRpb25zLCAuLi5zZXQgKSApICk7XHJcblxyXG4gICAgLy8gSWYgYW55IGVsZW1lbnQgaXMgdXNlZCBmcm9tIG1vcmUgdGhhbiBvbmUgc2V0Li4uXHJcbiAgICBpZiAoIHVzZWRFbGVtZW50c0Zyb21FYWNoU2V0LmZpbHRlciggdXNlZEVsZW1lbnRzID0+IHVzZWRFbGVtZW50cy5sZW5ndGggPiAwICkubGVuZ3RoID4gMSApIHtcclxuXHJcbiAgICAgIC8vIE91dHB1dCB0aGUgZXJyYW50IG9wdGlvbnMuXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGZhbHNlLCBgQ2Fubm90IHNpbXVsdGFuZW91c2x5IHNwZWNpZnkgJHt1c2VkRWxlbWVudHNGcm9tRWFjaFNldC5qb2luKCAnIGFuZCAnICl9YCApO1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbnBoZXRDb3JlLnJlZ2lzdGVyKCAnYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zJywgYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zICk7XHJcbmV4cG9ydCBkZWZhdWx0IGFzc2VydE11dHVhbGx5RXhjbHVzaXZlT3B0aW9uczsiXSwibWFwcGluZ3MiOiI7Ozs7OztBQWNBLElBQUFBLFNBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUFxQyxTQUFBRCx1QkFBQUUsR0FBQSxXQUFBQSxHQUFBLElBQUFBLEdBQUEsQ0FBQUMsVUFBQSxHQUFBRCxHQUFBLGdCQUFBQSxHQUFBO0FBQUEsU0FBQUUsbUJBQUFDLEdBQUEsV0FBQUMsa0JBQUEsQ0FBQUQsR0FBQSxLQUFBRSxnQkFBQSxDQUFBRixHQUFBLEtBQUFHLDJCQUFBLENBQUFILEdBQUEsS0FBQUksa0JBQUE7QUFBQSxTQUFBQSxtQkFBQSxj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