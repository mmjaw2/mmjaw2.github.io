"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _extend = _interopRequireDefault(require("./extend.js"));
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
var _optionize = _interopRequireDefault(require("./optionize.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; } // Copyright 2015-2024, University of Colorado Boulder
/**
 * Object pooling mixin, for cases where creating new objects is expensive, and we'd rather mark some objects as able
 * to be reused (i.e. 'in the pool'). This provides a pool of objects for each type it is invoked on. It allows for
 * getting "new" objects that can either be constructed OR pulled in from a pool, and requires that the objects are
 * essentially able to "re-run" the constructor. Then when putting the object back in the pool, references should be
 * released, so memory isn't leaked.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/**
 * @deprecated - Please use Pool.ts instead as the new pooling pattern.
 */
var Poolable = {
  /**
   * Changes the given type (and its prototype) to support object pooling.
   */
  mixInto: function mixInto(type, providedOptions) {
    var options = (0, _optionize["default"])()({
      defaultArguments: [],
      initialize: type.prototype.initialize,
      maxSize: 100,
      initialSize: 0,
      useDefaultConstruction: false
    }, providedOptions);
    assert && assert(options.maxSize >= 0);
    assert && assert(options.initialSize >= 0);

    // The actual array we store things in. Always push/pop.
    var pool = [];
    var maxPoolSize = options.maxSize;

    // There is a madness to this craziness. We'd want to use the method noted at
    // https://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible, but the type is
    // not provided in the arguments array below. By calling bind on itself, we're able to get a version of bind that
    // inserts the constructor as the first argument of the .apply called later so we don't create garbage by having
    // to pack `arguments` into an array AND THEN concatenate it with a new first element (the type itself).
    var partialConstructor = Function.prototype.bind.bind(type, type);

    // Basically our type constructor, but with the default arguments included already.
    var DefaultConstructor = partialConstructor.apply(void 0, _toConsumableArray(options.defaultArguments));
    var initialize = options.initialize;
    var useDefaultConstruction = options.useDefaultConstruction;
    var proto = type.prototype;
    (0, _extend["default"])(type, {
      /**
       * This should not be modified externally. In the future if desired, functions could be added to help
       * adding/removing poolable instances manually.
       */
      pool: pool,
      /**
       * Returns an object with arbitrary state (possibly constructed with the default arguments).
       */
      dirtyFromPool: function dirtyFromPool() {
        return pool.length ? pool.pop() : new DefaultConstructor();
      },
      /**
       * Returns an object that behaves as if it was constructed with the given arguments. May result in a new object
       * being created (if the pool is empty), or it may use the constructor to mutate an object from the pool.
       */
      createFromPool: function createFromPool() {
        var result;
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        if (pool.length) {
          result = pool.pop();
          initialize.apply(result, args);
        } else if (useDefaultConstruction) {
          result = new DefaultConstructor();
          initialize.apply(result, args);
        } else {
          result = new (partialConstructor.apply(void 0, args))();
        }
        return result;
      },
      /**
       * Returns the current size of the pool.
       */
      get poolSize() {
        return pool.length;
      },
      /**
       * Sets the maximum pool size.
       */
      set maxPoolSize(value) {
        assert && assert(value === Number.POSITIVE_INFINITY || Number.isInteger(value) && value >= 0, 'maxPoolSize should be a non-negative integer or infinity');
        maxPoolSize = value;
      },
      /**
       * Returns the maximum pool size.
       */
      get maxPoolSize() {
        return maxPoolSize;
      }
    });
    (0, _extend["default"])(proto, {
      /**
       * Adds this object into the pool, so that it can be reused elsewhere. Generally when this is done, no other
       * references to the object should be held (since they should not be used at all).
       */
      freeToPool: function freeToPool() {
        if (pool.length < maxPoolSize) {
          pool.push(this);
        }
      }
    });

    // Initialize the pool (if it should have objects)
    while (pool.length < options.initialSize) {
      pool.push(new DefaultConstructor());
    }
    return type;
  }
};
_phetCore["default"].register('Poolable', Poolable);
var _default = exports["default"] = Poolable;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZXh0ZW5kIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfcGhldENvcmUiLCJfb3B0aW9uaXplIiwib2JqIiwiX19lc01vZHVsZSIsIl90b0NvbnN1bWFibGVBcnJheSIsImFyciIsIl9hcnJheVdpdGhvdXRIb2xlcyIsIl9pdGVyYWJsZVRvQXJyYXkiLCJfdW5zdXBwb3J0ZWRJdGVyYWJsZVRvQXJyYXkiLCJfbm9uSXRlcmFibGVTcHJlYWQiLCJUeXBlRXJyb3IiLCJvIiwibWluTGVuIiwiX2FycmF5TGlrZVRvQXJyYXkiLCJuIiwiT2JqZWN0IiwicHJvdG90eXBlIiwidG9TdHJpbmciLCJjYWxsIiwic2xpY2UiLCJjb25zdHJ1Y3RvciIsIm5hbWUiLCJBcnJheSIsImZyb20iLCJ0ZXN0IiwiaXRlciIsIlN5bWJvbCIsIml0ZXJhdG9yIiwiaXNBcnJheSIsImxlbiIsImxlbmd0aCIsImkiLCJhcnIyIiwiUG9vbGFibGUiLCJtaXhJbnRvIiwidHlwZSIsInByb3ZpZGVkT3B0aW9ucyIsIm9wdGlvbnMiLCJvcHRpb25pemUiLCJkZWZhdWx0QXJndW1lbnRzIiwiaW5pdGlhbGl6ZSIsIm1heFNpemUiLCJpbml0aWFsU2l6ZSIsInVzZURlZmF1bHRDb25zdHJ1Y3Rpb24iLCJhc3NlcnQiLCJwb29sIiwibWF4UG9vbFNpemUiLCJwYXJ0aWFsQ29uc3RydWN0b3IiLCJGdW5jdGlvbiIsImJpbmQiLCJEZWZhdWx0Q29uc3RydWN0b3IiLCJhcHBseSIsInByb3RvIiwiZXh0ZW5kIiwiZGlydHlGcm9tUG9vbCIsInBvcCIsImNyZWF0ZUZyb21Qb29sIiwicmVzdWx0IiwiX2xlbiIsImFyZ3VtZW50cyIsImFyZ3MiLCJfa2V5IiwicG9vbFNpemUiLCJ2YWx1ZSIsIk51bWJlciIsIlBPU0lUSVZFX0lORklOSVRZIiwiaXNJbnRlZ2VyIiwiZnJlZVRvUG9vbCIsInB1c2giLCJwaGV0Q29yZSIsInJlZ2lzdGVyIiwiX2RlZmF1bHQiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsiUG9vbGFibGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTUtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogT2JqZWN0IHBvb2xpbmcgbWl4aW4sIGZvciBjYXNlcyB3aGVyZSBjcmVhdGluZyBuZXcgb2JqZWN0cyBpcyBleHBlbnNpdmUsIGFuZCB3ZSdkIHJhdGhlciBtYXJrIHNvbWUgb2JqZWN0cyBhcyBhYmxlXHJcbiAqIHRvIGJlIHJldXNlZCAoaS5lLiAnaW4gdGhlIHBvb2wnKS4gVGhpcyBwcm92aWRlcyBhIHBvb2wgb2Ygb2JqZWN0cyBmb3IgZWFjaCB0eXBlIGl0IGlzIGludm9rZWQgb24uIEl0IGFsbG93cyBmb3JcclxuICogZ2V0dGluZyBcIm5ld1wiIG9iamVjdHMgdGhhdCBjYW4gZWl0aGVyIGJlIGNvbnN0cnVjdGVkIE9SIHB1bGxlZCBpbiBmcm9tIGEgcG9vbCwgYW5kIHJlcXVpcmVzIHRoYXQgdGhlIG9iamVjdHMgYXJlXHJcbiAqIGVzc2VudGlhbGx5IGFibGUgdG8gXCJyZS1ydW5cIiB0aGUgY29uc3RydWN0b3IuIFRoZW4gd2hlbiBwdXR0aW5nIHRoZSBvYmplY3QgYmFjayBpbiB0aGUgcG9vbCwgcmVmZXJlbmNlcyBzaG91bGQgYmVcclxuICogcmVsZWFzZWQsIHNvIG1lbW9yeSBpc24ndCBsZWFrZWQuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgQ29uc3RydWN0b3IgZnJvbSAnLi90eXBlcy9Db25zdHJ1Y3Rvci5qcyc7XHJcbmltcG9ydCBleHRlbmQgZnJvbSAnLi9leHRlbmQuanMnO1xyXG5pbXBvcnQgcGhldENvcmUgZnJvbSAnLi9waGV0Q29yZS5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgSW50ZW50aW9uYWxBbnkgZnJvbSAnLi90eXBlcy9JbnRlbnRpb25hbEFueS5qcyc7XHJcblxyXG50eXBlIFBvb2xhYmxlT3B0aW9uczxUeXBlIGV4dGVuZHMgQ29uc3RydWN0b3I+ID0ge1xyXG4gIC8vIElmIGFuIG9iamVjdCBuZWVkcyB0byBiZSBjcmVhdGVkIHdpdGhvdXQgYSBkaXJlY3QgY2FsbCAoc2F5LCB0byBmaWxsIHRoZSBwb29sIGluaXRpYWxseSksIHRoZXNlIGFyZSB0aGUgYXJndW1lbnRzXHJcbiAgLy8gdGhhdCB3aWxsIGJlIHBhc3NlZCBpbnRvIHRoZSBjb25zdHJ1Y3RvclxyXG4gIGRlZmF1bHRBcmd1bWVudHM/OiBDb25zdHJ1Y3RvclBhcmFtZXRlcnM8VHlwZT47XHJcblxyXG4gIC8vIFRoZSBmdW5jdGlvbiB0byBjYWxsIG9uIHRoZSBvYmplY3RzIHRvIHJlaW5pdGlhbGl6ZSB0aGVtICh0aGF0IGlzIGVpdGhlciB0aGUgY29uc3RydWN0b3IsIG9yIGFjdHMgbGlrZSB0aGVcclxuICAvLyBjb25zdHJ1Y3RvcikuXHJcbiAgaW5pdGlhbGl6ZT86IFBvb2xhYmxlSW5pdGlhbGl6ZXI8VHlwZT47XHJcblxyXG4gIC8vIEEgbGltaXQgZm9yIHRoZSBwb29sIHNpemUgKHNvIHdlIGRvbid0IGxlYWsgbWVtb3J5IGJ5IGdyb3dpbmcgdGhlIHBvb2wgZmFzdGVyIHRoYW4gd2UgdGFrZSB0aGluZ3MgZnJvbSBpdCkuIENhbiBiZVxyXG4gIC8vIGN1c3RvbWl6ZWQgYnkgc2V0dGluZyBUeXBlLm1heFBvb2xTaXplXHJcbiAgbWF4U2l6ZT86IG51bWJlcjtcclxuXHJcbiAgLy8gVGhlIGluaXRpYWwgc2l6ZSBvZiB0aGUgcG9vbC4gVG8gZmlsbCBpdCwgb2JqZWN0cyB3aWxsIGJlIGNyZWF0ZWQgd2l0aCB0aGUgZGVmYXVsdCBhcmd1bWVudHMuXHJcbiAgaW5pdGlhbFNpemU/OiBudW1iZXI7XHJcblxyXG4gIC8vIElmIHRydWUsIHdoZW4gY29uc3RydWN0aW5nIHRoZSBkZWZhdWx0IGFyZ3VtZW50cyB3aWxsIGFsd2F5cyBiZSB1c2VkIChhbmQgdGhlbiBpbml0aWFsaXplZCB3aXRoIHRoZSBpbml0aWFsaXplcilcclxuICAvLyBpbnN0ZWFkIG9mIGp1c3QgcHJvdmlkaW5nIHRoZSBhcmd1bWVudHMgc3RyYWlnaHQgdG8gdGhlIGNvbnN0cnVjdG9yLlxyXG4gIHVzZURlZmF1bHRDb25zdHJ1Y3Rpb24/OiBib29sZWFuO1xyXG59O1xyXG50eXBlIFBvb2xhYmxlSW5zdGFuY2UgPSB7XHJcbiAgZnJlZVRvUG9vbCgpOiB2b2lkO1xyXG59O1xyXG50eXBlIFBvb2xhYmxlVmVyc2lvbjxUeXBlIGV4dGVuZHMgQ29uc3RydWN0b3I+ID0gSW5zdGFuY2VUeXBlPFR5cGU+ICYgUG9vbGFibGVJbnN0YW5jZTtcclxudHlwZSBQb29sYWJsZUluaXRpYWxpemVyPFR5cGUgZXh0ZW5kcyBDb25zdHJ1Y3Rvcj4gPSAoIC4uLmFyZ3M6IENvbnN0cnVjdG9yUGFyYW1ldGVyczxUeXBlPiApID0+IEludGVudGlvbmFsQW55O1xyXG50eXBlIFBvb2xhYmxlQ2xhc3M8VHlwZSBleHRlbmRzIENvbnN0cnVjdG9yPiA9ICggbmV3ICggLi4uYXJnczogQ29uc3RydWN0b3JQYXJhbWV0ZXJzPFR5cGU+ICkgPT4gKCBQb29sYWJsZVZlcnNpb248VHlwZT4gKSApICYgUG9vbGFibGVUeXBlPFR5cGU+O1xyXG50eXBlIFBvb2xhYmxlRXhpc3RpbmdTdGF0aWNzPFR5cGUgZXh0ZW5kcyBDb25zdHJ1Y3Rvcj4gPSB7XHJcbiAgLy8gV2UgZ3JhYiB0aGUgc3RhdGljIHZhbHVlcyBvZiBhIHR5cGVcclxuICBbUHJvcGVydHkgaW4ga2V5b2YgVHlwZV06IFR5cGVbIFByb3BlcnR5IF1cclxufTtcclxudHlwZSBQb29sYWJsZVR5cGU8VHlwZSBleHRlbmRzIENvbnN0cnVjdG9yPiA9IHtcclxuICBwb29sOiBQb29sYWJsZVZlcnNpb248VHlwZT5bXTtcclxuICBkaXJ0eUZyb21Qb29sKCk6IFBvb2xhYmxlVmVyc2lvbjxUeXBlPjtcclxuICBjcmVhdGVGcm9tUG9vbCggLi4uYXJnczogQ29uc3RydWN0b3JQYXJhbWV0ZXJzPFR5cGU+ICk6IFBvb2xhYmxlVmVyc2lvbjxUeXBlPjtcclxuICBnZXQgcG9vbFNpemUoKTogbnVtYmVyO1xyXG4gIHNldCBtYXhQb29sU2l6ZSggdmFsdWU6IG51bWJlciApO1xyXG4gIGdldCBtYXhQb29sU2l6ZSgpOiBudW1iZXI7XHJcbn0gJiBQb29sYWJsZUV4aXN0aW5nU3RhdGljczxUeXBlPjtcclxuXHJcbi8qKlxyXG4gKiBAZGVwcmVjYXRlZCAtIFBsZWFzZSB1c2UgUG9vbC50cyBpbnN0ZWFkIGFzIHRoZSBuZXcgcG9vbGluZyBwYXR0ZXJuLlxyXG4gKi9cclxuY29uc3QgUG9vbGFibGUgPSB7XHJcbiAgLyoqXHJcbiAgICogQ2hhbmdlcyB0aGUgZ2l2ZW4gdHlwZSAoYW5kIGl0cyBwcm90b3R5cGUpIHRvIHN1cHBvcnQgb2JqZWN0IHBvb2xpbmcuXHJcbiAgICovXHJcbiAgbWl4SW50bzxUeXBlIGV4dGVuZHMgQ29uc3RydWN0b3I+KCB0eXBlOiBUeXBlLCBwcm92aWRlZE9wdGlvbnM/OiBQb29sYWJsZU9wdGlvbnM8VHlwZT4gKTogUG9vbGFibGVDbGFzczxUeXBlPiB7XHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPFBvb2xhYmxlT3B0aW9uczxUeXBlPiwgUG9vbGFibGVPcHRpb25zPFR5cGU+PigpKCB7XHJcblxyXG4gICAgICBkZWZhdWx0QXJndW1lbnRzOiBbXSBhcyB1bmtub3duIGFzIENvbnN0cnVjdG9yUGFyYW1ldGVyczxUeXBlPixcclxuICAgICAgaW5pdGlhbGl6ZTogdHlwZS5wcm90b3R5cGUuaW5pdGlhbGl6ZSxcclxuICAgICAgbWF4U2l6ZTogMTAwLFxyXG4gICAgICBpbml0aWFsU2l6ZTogMCxcclxuICAgICAgdXNlRGVmYXVsdENvbnN0cnVjdGlvbjogZmFsc2VcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApIGFzIFJlcXVpcmVkPFBvb2xhYmxlT3B0aW9uczxUeXBlPj47XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5tYXhTaXplID49IDAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG9wdGlvbnMuaW5pdGlhbFNpemUgPj0gMCApO1xyXG5cclxuICAgIC8vIFRoZSBhY3R1YWwgYXJyYXkgd2Ugc3RvcmUgdGhpbmdzIGluLiBBbHdheXMgcHVzaC9wb3AuXHJcbiAgICBjb25zdCBwb29sOiBJbnN0YW5jZVR5cGU8VHlwZT5bXSA9IFtdO1xyXG5cclxuICAgIGxldCBtYXhQb29sU2l6ZSA9IG9wdGlvbnMubWF4U2l6ZTtcclxuXHJcbiAgICAvLyBUaGVyZSBpcyBhIG1hZG5lc3MgdG8gdGhpcyBjcmF6aW5lc3MuIFdlJ2Qgd2FudCB0byB1c2UgdGhlIG1ldGhvZCBub3RlZCBhdFxyXG4gICAgLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTYwNjc5Ny91c2Utb2YtYXBwbHktd2l0aC1uZXctb3BlcmF0b3ItaXMtdGhpcy1wb3NzaWJsZSwgYnV0IHRoZSB0eXBlIGlzXHJcbiAgICAvLyBub3QgcHJvdmlkZWQgaW4gdGhlIGFyZ3VtZW50cyBhcnJheSBiZWxvdy4gQnkgY2FsbGluZyBiaW5kIG9uIGl0c2VsZiwgd2UncmUgYWJsZSB0byBnZXQgYSB2ZXJzaW9uIG9mIGJpbmQgdGhhdFxyXG4gICAgLy8gaW5zZXJ0cyB0aGUgY29uc3RydWN0b3IgYXMgdGhlIGZpcnN0IGFyZ3VtZW50IG9mIHRoZSAuYXBwbHkgY2FsbGVkIGxhdGVyIHNvIHdlIGRvbid0IGNyZWF0ZSBnYXJiYWdlIGJ5IGhhdmluZ1xyXG4gICAgLy8gdG8gcGFjayBgYXJndW1lbnRzYCBpbnRvIGFuIGFycmF5IEFORCBUSEVOIGNvbmNhdGVuYXRlIGl0IHdpdGggYSBuZXcgZmlyc3QgZWxlbWVudCAodGhlIHR5cGUgaXRzZWxmKS5cclxuICAgIGNvbnN0IHBhcnRpYWxDb25zdHJ1Y3RvciA9IEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kLmJpbmQoIHR5cGUsIHR5cGUgKTtcclxuXHJcbiAgICAvLyBCYXNpY2FsbHkgb3VyIHR5cGUgY29uc3RydWN0b3IsIGJ1dCB3aXRoIHRoZSBkZWZhdWx0IGFyZ3VtZW50cyBpbmNsdWRlZCBhbHJlYWR5LlxyXG4gICAgY29uc3QgRGVmYXVsdENvbnN0cnVjdG9yID0gcGFydGlhbENvbnN0cnVjdG9yKCAuLi5vcHRpb25zLmRlZmF1bHRBcmd1bWVudHMgKTtcclxuXHJcbiAgICBjb25zdCBpbml0aWFsaXplID0gb3B0aW9ucy5pbml0aWFsaXplO1xyXG4gICAgY29uc3QgdXNlRGVmYXVsdENvbnN0cnVjdGlvbiA9IG9wdGlvbnMudXNlRGVmYXVsdENvbnN0cnVjdGlvbjtcclxuXHJcbiAgICBjb25zdCBwcm90byA9IHR5cGUucHJvdG90eXBlO1xyXG5cclxuICAgIGV4dGVuZDxUeXBlPiggdHlwZSwge1xyXG4gICAgICAvKipcclxuICAgICAgICogVGhpcyBzaG91bGQgbm90IGJlIG1vZGlmaWVkIGV4dGVybmFsbHkuIEluIHRoZSBmdXR1cmUgaWYgZGVzaXJlZCwgZnVuY3Rpb25zIGNvdWxkIGJlIGFkZGVkIHRvIGhlbHBcclxuICAgICAgICogYWRkaW5nL3JlbW92aW5nIHBvb2xhYmxlIGluc3RhbmNlcyBtYW51YWxseS5cclxuICAgICAgICovXHJcbiAgICAgIHBvb2w6IHBvb2wsXHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBhcmJpdHJhcnkgc3RhdGUgKHBvc3NpYmx5IGNvbnN0cnVjdGVkIHdpdGggdGhlIGRlZmF1bHQgYXJndW1lbnRzKS5cclxuICAgICAgICovXHJcbiAgICAgIGRpcnR5RnJvbVBvb2woKTogUG9vbGFibGVWZXJzaW9uPFR5cGU+IHtcclxuICAgICAgICByZXR1cm4gcG9vbC5sZW5ndGggPyBwb29sLnBvcCgpIDogbmV3IERlZmF1bHRDb25zdHJ1Y3RvcigpO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFJldHVybnMgYW4gb2JqZWN0IHRoYXQgYmVoYXZlcyBhcyBpZiBpdCB3YXMgY29uc3RydWN0ZWQgd2l0aCB0aGUgZ2l2ZW4gYXJndW1lbnRzLiBNYXkgcmVzdWx0IGluIGEgbmV3IG9iamVjdFxyXG4gICAgICAgKiBiZWluZyBjcmVhdGVkIChpZiB0aGUgcG9vbCBpcyBlbXB0eSksIG9yIGl0IG1heSB1c2UgdGhlIGNvbnN0cnVjdG9yIHRvIG11dGF0ZSBhbiBvYmplY3QgZnJvbSB0aGUgcG9vbC5cclxuICAgICAgICovXHJcbiAgICAgIGNyZWF0ZUZyb21Qb29sKCAuLi5hcmdzOiBDb25zdHJ1Y3RvclBhcmFtZXRlcnM8VHlwZT4gKTogUG9vbGFibGVWZXJzaW9uPFR5cGU+IHtcclxuICAgICAgICBsZXQgcmVzdWx0O1xyXG5cclxuICAgICAgICBpZiAoIHBvb2wubGVuZ3RoICkge1xyXG4gICAgICAgICAgcmVzdWx0ID0gcG9vbC5wb3AoKTtcclxuICAgICAgICAgIGluaXRpYWxpemUuYXBwbHkoIHJlc3VsdCwgYXJncyApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggdXNlRGVmYXVsdENvbnN0cnVjdGlvbiApIHtcclxuICAgICAgICAgIHJlc3VsdCA9IG5ldyBEZWZhdWx0Q29uc3RydWN0b3IoKTtcclxuICAgICAgICAgIGluaXRpYWxpemUuYXBwbHkoIHJlc3VsdCwgYXJncyApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHJlc3VsdCA9IG5ldyAoIHBhcnRpYWxDb25zdHJ1Y3RvciggLi4uYXJncyApICkoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogUmV0dXJucyB0aGUgY3VycmVudCBzaXplIG9mIHRoZSBwb29sLlxyXG4gICAgICAgKi9cclxuICAgICAgZ2V0IHBvb2xTaXplKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHBvb2wubGVuZ3RoO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFNldHMgdGhlIG1heGltdW0gcG9vbCBzaXplLlxyXG4gICAgICAgKi9cclxuICAgICAgc2V0IG1heFBvb2xTaXplKCB2YWx1ZTogbnVtYmVyICkge1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHZhbHVlID09PSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkgfHwgKCBOdW1iZXIuaXNJbnRlZ2VyKCB2YWx1ZSApICYmIHZhbHVlID49IDAgKSwgJ21heFBvb2xTaXplIHNob3VsZCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyIG9yIGluZmluaXR5JyApO1xyXG5cclxuICAgICAgICBtYXhQb29sU2l6ZSA9IHZhbHVlO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFJldHVybnMgdGhlIG1heGltdW0gcG9vbCBzaXplLlxyXG4gICAgICAgKi9cclxuICAgICAgZ2V0IG1heFBvb2xTaXplKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIG1heFBvb2xTaXplO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgZXh0ZW5kKCBwcm90bywge1xyXG4gICAgICAvKipcclxuICAgICAgICogQWRkcyB0aGlzIG9iamVjdCBpbnRvIHRoZSBwb29sLCBzbyB0aGF0IGl0IGNhbiBiZSByZXVzZWQgZWxzZXdoZXJlLiBHZW5lcmFsbHkgd2hlbiB0aGlzIGlzIGRvbmUsIG5vIG90aGVyXHJcbiAgICAgICAqIHJlZmVyZW5jZXMgdG8gdGhlIG9iamVjdCBzaG91bGQgYmUgaGVsZCAoc2luY2UgdGhleSBzaG91bGQgbm90IGJlIHVzZWQgYXQgYWxsKS5cclxuICAgICAgICovXHJcbiAgICAgIGZyZWVUb1Bvb2woKSB7XHJcbiAgICAgICAgaWYgKCBwb29sLmxlbmd0aCA8IG1heFBvb2xTaXplICkge1xyXG4gICAgICAgICAgcG9vbC5wdXNoKCB0aGlzIGFzIEluc3RhbmNlVHlwZTxUeXBlPiApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIEluaXRpYWxpemUgdGhlIHBvb2wgKGlmIGl0IHNob3VsZCBoYXZlIG9iamVjdHMpXHJcbiAgICB3aGlsZSAoIHBvb2wubGVuZ3RoIDwgb3B0aW9ucy5pbml0aWFsU2l6ZSApIHtcclxuICAgICAgcG9vbC5wdXNoKCBuZXcgRGVmYXVsdENvbnN0cnVjdG9yKCkgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHlwZSBhcyB1bmtub3duIGFzIFBvb2xhYmxlQ2xhc3M8VHlwZT47XHJcbiAgfVxyXG59O1xyXG5cclxucGhldENvcmUucmVnaXN0ZXIoICdQb29sYWJsZScsIFBvb2xhYmxlICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBQb29sYWJsZTtcclxuZXhwb3J0IHR5cGUgeyBQb29sYWJsZU9wdGlvbnMsIFBvb2xhYmxlSW5zdGFuY2UsIFBvb2xhYmxlVmVyc2lvbiwgUG9vbGFibGVJbml0aWFsaXplciwgUG9vbGFibGVDbGFzcywgUG9vbGFibGVUeXBlIH07Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFhQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxTQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxVQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFBdUMsU0FBQUQsdUJBQUFJLEdBQUEsV0FBQUEsR0FBQSxJQUFBQSxHQUFBLENBQUFDLFVBQUEsR0FBQUQsR0FBQSxnQkFBQUEsR0FBQTtBQUFBLFNBQUFFLG1CQUFBQyxHQUFBLFdBQUFDLGtCQUFBLENBQUFELEdBQUEsS0FBQUUsZ0JBQUEsQ0FBQUYsR0FBQSxLQUFBRywyQkFBQSxDQUFBSCxHQUFBLEtBQUFJLGtCQUFBO0FBQUEsU0FBQUEsbUJBQUEsY0FBQUMsU0FBQTtBQUFBLFNBQUFGLDRCQUFBRyxDQUFBLEVBQUFDLE1BQUEsU0FBQUQsQ0FBQSxxQkFBQUEsQ0FBQSxz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