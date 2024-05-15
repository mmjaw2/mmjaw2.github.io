"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _arrayRemove = _interopRequireDefault(require("../../phet-core/js/arrayRemove.js"));
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } // Copyright 2021-2024, University of Colorado Boulder
/**
 * Singleton which keeps track of all async items currently loading, and doesn't proceed until all have been loaded.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */
var AsyncLoader = /*#__PURE__*/function () {
  function AsyncLoader() {
    _classCallCheck(this, AsyncLoader);
    // Locks waiting to be resolved before we can move to the next phase after loading. Lock objects can be arbitrary
    // objects.
    _defineProperty(this, "pendingLocks", void 0);
    // Marked as true when there are no more locks and we try to proceed.  Helps protect against new locks being created
    // after they should be.
    _defineProperty(this, "loadComplete", void 0);
    // Listeners which will be invoked after everything has been loaded.
    _defineProperty(this, "listeners", void 0);
    this.pendingLocks = [];
    this.loadComplete = false;
    this.listeners = [];
  }

  // Allow resetting this for sandbox or other non-sim purposes. We'll want to be able to load resources AFTER
  // we've completed loading.
  return _createClass(AsyncLoader, [{
    key: "reset",
    value: function reset() {
      this.loadComplete = false;
    }

    /**
     * @param listener - called when load is complete
     */
  }, {
    key: "addListener",
    value: function addListener(listener) {
      this.listeners.push(listener);
    }

    /**
     * Attempts to proceed to the next phase if possible (otherwise it's a no-op).
     */
  }, {
    key: "proceedIfReady",
    value: function proceedIfReady() {
      if (this.pendingLocks.length === 0) {
        assert && assert(!this.loadComplete, 'cannot complete load twice');
        this.loadComplete = true;
        this.listeners.forEach(function (listener) {
          return listener();
        });
      }
    }

    /**
     * Creates a lock, which is a callback that needs to be run before we can proceed.
     */
  }, {
    key: "createLock",
    value: function createLock(object) {
      var _this = this;
      assert && assert(!this.loadComplete, 'Cannot create more locks after load-step has completed');
      this.pendingLocks.push(object);
      return function () {
        assert && assert(_this.pendingLocks.includes(object), 'invalid lock');
        (0, _arrayRemove["default"])(_this.pendingLocks, object);
        _this.proceedIfReady();
      };
    }
  }]);
}();
var asyncLoader = new AsyncLoader();
_phetCore["default"].register('asyncLoader', asyncLoader);
var _default = exports["default"] = asyncLoader;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXJyYXlSZW1vdmUiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9waGV0Q29yZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJfdHlwZW9mIiwibyIsIlN5bWJvbCIsIml0ZXJhdG9yIiwiY29uc3RydWN0b3IiLCJwcm90b3R5cGUiLCJfY2xhc3NDYWxsQ2hlY2siLCJpbnN0YW5jZSIsIkNvbnN0cnVjdG9yIiwiVHlwZUVycm9yIiwiX2RlZmluZVByb3BlcnRpZXMiLCJ0YXJnZXQiLCJwcm9wcyIsImkiLCJsZW5ndGgiLCJkZXNjcmlwdG9yIiwiZW51bWVyYWJsZSIsImNvbmZpZ3VyYWJsZSIsIndyaXRhYmxlIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJfdG9Qcm9wZXJ0eUtleSIsImtleSIsIl9jcmVhdGVDbGFzcyIsInByb3RvUHJvcHMiLCJzdGF0aWNQcm9wcyIsIl9kZWZpbmVQcm9wZXJ0eSIsInZhbHVlIiwidCIsIl90b1ByaW1pdGl2ZSIsInIiLCJlIiwidG9QcmltaXRpdmUiLCJjYWxsIiwiU3RyaW5nIiwiTnVtYmVyIiwiQXN5bmNMb2FkZXIiLCJwZW5kaW5nTG9ja3MiLCJsb2FkQ29tcGxldGUiLCJsaXN0ZW5lcnMiLCJyZXNldCIsImFkZExpc3RlbmVyIiwibGlzdGVuZXIiLCJwdXNoIiwicHJvY2VlZElmUmVhZHkiLCJhc3NlcnQiLCJmb3JFYWNoIiwiY3JlYXRlTG9jayIsIm9iamVjdCIsIl90aGlzIiwiaW5jbHVkZXMiLCJhcnJheVJlbW92ZSIsImFzeW5jTG9hZGVyIiwicGhldENvcmUiLCJyZWdpc3RlciIsIl9kZWZhdWx0IiwiZXhwb3J0cyJdLCJzb3VyY2VzIjpbImFzeW5jTG9hZGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG4vKipcclxuICogU2luZ2xldG9uIHdoaWNoIGtlZXBzIHRyYWNrIG9mIGFsbCBhc3luYyBpdGVtcyBjdXJyZW50bHkgbG9hZGluZywgYW5kIGRvZXNuJ3QgcHJvY2VlZCB1bnRpbCBhbGwgaGF2ZSBiZWVuIGxvYWRlZC5cclxuICpcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBhcnJheVJlbW92ZSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvYXJyYXlSZW1vdmUuanMnO1xyXG5pbXBvcnQgcGhldENvcmUgZnJvbSAnLi9waGV0Q29yZS5qcyc7XHJcbmltcG9ydCBJbnRlbnRpb25hbEFueSBmcm9tICcuL3R5cGVzL0ludGVudGlvbmFsQW55LmpzJztcclxuXHJcbnR5cGUgQXN5bmNMb2FkZXJMaXN0ZW5lciA9ICgpID0+IHZvaWQ7XHJcbnR5cGUgQXN5bmNMb2FkZXJMb2NrID0gKCkgPT4gdm9pZDtcclxuXHJcbmNsYXNzIEFzeW5jTG9hZGVyIHtcclxuXHJcbiAgLy8gTG9ja3Mgd2FpdGluZyB0byBiZSByZXNvbHZlZCBiZWZvcmUgd2UgY2FuIG1vdmUgdG8gdGhlIG5leHQgcGhhc2UgYWZ0ZXIgbG9hZGluZy4gTG9jayBvYmplY3RzIGNhbiBiZSBhcmJpdHJhcnlcclxuICAvLyBvYmplY3RzLlxyXG4gIHByaXZhdGUgcGVuZGluZ0xvY2tzOiBJbnRlbnRpb25hbEFueVtdO1xyXG5cclxuICAvLyBNYXJrZWQgYXMgdHJ1ZSB3aGVuIHRoZXJlIGFyZSBubyBtb3JlIGxvY2tzIGFuZCB3ZSB0cnkgdG8gcHJvY2VlZC4gIEhlbHBzIHByb3RlY3QgYWdhaW5zdCBuZXcgbG9ja3MgYmVpbmcgY3JlYXRlZFxyXG4gIC8vIGFmdGVyIHRoZXkgc2hvdWxkIGJlLlxyXG4gIHByaXZhdGUgbG9hZENvbXBsZXRlOiBib29sZWFuO1xyXG5cclxuICAvLyBMaXN0ZW5lcnMgd2hpY2ggd2lsbCBiZSBpbnZva2VkIGFmdGVyIGV2ZXJ5dGhpbmcgaGFzIGJlZW4gbG9hZGVkLlxyXG4gIHByaXZhdGUgbGlzdGVuZXJzOiBBc3luY0xvYWRlckxpc3RlbmVyW107XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHRoaXMucGVuZGluZ0xvY2tzID0gW107XHJcbiAgICB0aGlzLmxvYWRDb21wbGV0ZSA9IGZhbHNlO1xyXG4gICAgdGhpcy5saXN0ZW5lcnMgPSBbXTtcclxuICB9XHJcblxyXG4gIC8vIEFsbG93IHJlc2V0dGluZyB0aGlzIGZvciBzYW5kYm94IG9yIG90aGVyIG5vbi1zaW0gcHVycG9zZXMuIFdlJ2xsIHdhbnQgdG8gYmUgYWJsZSB0byBsb2FkIHJlc291cmNlcyBBRlRFUlxyXG4gIC8vIHdlJ3ZlIGNvbXBsZXRlZCBsb2FkaW5nLlxyXG4gIHB1YmxpYyByZXNldCgpOiB2b2lkIHtcclxuICAgIHRoaXMubG9hZENvbXBsZXRlID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gbGlzdGVuZXIgLSBjYWxsZWQgd2hlbiBsb2FkIGlzIGNvbXBsZXRlXHJcbiAgICovXHJcbiAgcHVibGljIGFkZExpc3RlbmVyKCBsaXN0ZW5lcjogQXN5bmNMb2FkZXJMaXN0ZW5lciApOiB2b2lkIHtcclxuICAgIHRoaXMubGlzdGVuZXJzLnB1c2goIGxpc3RlbmVyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBdHRlbXB0cyB0byBwcm9jZWVkIHRvIHRoZSBuZXh0IHBoYXNlIGlmIHBvc3NpYmxlIChvdGhlcndpc2UgaXQncyBhIG5vLW9wKS5cclxuICAgKi9cclxuICBwcml2YXRlIHByb2NlZWRJZlJlYWR5KCk6IHZvaWQge1xyXG4gICAgaWYgKCB0aGlzLnBlbmRpbmdMb2Nrcy5sZW5ndGggPT09IDAgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLmxvYWRDb21wbGV0ZSwgJ2Nhbm5vdCBjb21wbGV0ZSBsb2FkIHR3aWNlJyApO1xyXG4gICAgICB0aGlzLmxvYWRDb21wbGV0ZSA9IHRydWU7XHJcblxyXG4gICAgICB0aGlzLmxpc3RlbmVycy5mb3JFYWNoKCBsaXN0ZW5lciA9PiBsaXN0ZW5lcigpICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgbG9jaywgd2hpY2ggaXMgYSBjYWxsYmFjayB0aGF0IG5lZWRzIHRvIGJlIHJ1biBiZWZvcmUgd2UgY2FuIHByb2NlZWQuXHJcbiAgICovXHJcbiAgcHVibGljIGNyZWF0ZUxvY2soIG9iamVjdD86IEludGVudGlvbmFsQW55ICk6IEFzeW5jTG9hZGVyTG9jayB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5sb2FkQ29tcGxldGUsICdDYW5ub3QgY3JlYXRlIG1vcmUgbG9ja3MgYWZ0ZXIgbG9hZC1zdGVwIGhhcyBjb21wbGV0ZWQnICk7XHJcbiAgICB0aGlzLnBlbmRpbmdMb2Nrcy5wdXNoKCBvYmplY3QgKTtcclxuICAgIHJldHVybiAoKSA9PiB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMucGVuZGluZ0xvY2tzLmluY2x1ZGVzKCBvYmplY3QgKSwgJ2ludmFsaWQgbG9jaycgKTtcclxuICAgICAgYXJyYXlSZW1vdmUoIHRoaXMucGVuZGluZ0xvY2tzLCBvYmplY3QgKTtcclxuICAgICAgdGhpcy5wcm9jZWVkSWZSZWFkeSgpO1xyXG4gICAgfTtcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IGFzeW5jTG9hZGVyID0gbmV3IEFzeW5jTG9hZGVyKCk7XHJcblxyXG5waGV0Q29yZS5yZWdpc3RlciggJ2FzeW5jTG9hZGVyJywgYXN5bmNMb2FkZXIgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jTG9hZGVyO1xyXG5leHBvcnQgdHlwZSB7IEFzeW5jTG9hZGVyTG9jaywgQXN5bmNMb2FkZXJMaXN0ZW5lciB9OyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBUUEsSUFBQUEsWUFBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFB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U0FBUyxHQUFHLEVBQUU7RUFDckI7O0VBRUE7RUFDQTtFQUFBLE9BQUFoQixZQUFBLENBQUFhLFdBQUE7SUFBQWQsR0FBQTtJQUFBSyxLQUFBLEVBQ0EsU0FBQWEsTUFBQSxFQUFxQjtNQUNuQixJQUFJLENBQUNGLFlBQVksR0FBRyxLQUFLO0lBQzNCOztJQUVBO0FBQ0Y7QUFDQTtFQUZFO0lBQUFoQixHQUFBO0lBQUFLLEtBQUEsRUFHQSxTQUFBYyxZQUFvQkMsUUFBNkIsRUFBUztNQUN4RCxJQUFJLENBQUNILFNBQVMsQ0FBQ0ksSUFBSSxDQUFFRCxRQUFTLENBQUM7SUFDakM7O0lBRUE7QUFDRjtBQUNBO0VBRkU7SUFBQXBCLEdBQUE7SUFBQUssS0FBQSxFQUdBLFNBQUFpQixlQUFBLEVBQStCO01BQzdCLElBQUssSUFBSSxDQUFDUCxZQUFZLENBQUN2QixNQUFNLEtBQUssQ0FBQyxFQUFHO1FBQ3BDK0IsTUFBTSxJQUFJQSxNQUFNLENBQUUsQ0FBQyxJQUFJLENBQUNQLFlBQVksRUFBRSw0QkFBNkIsQ0FBQztRQUNwRSxJQUFJLENBQUNBLFlBQVksR0FBRyxJQUFJO1FBRXhCLElBQUksQ0FBQ0MsU0FBUyxDQUFDTyxPQUFPLENBQUUsVUFBQUosUUFBUTtVQUFBLE9BQUlBLFFBQVEsQ0FBQyxDQUFDO1FBQUEsQ0FBQyxDQUFDO01BQ2xEO0lBQ0Y7O0lBRUE7QUFDRjtBQUNBO0VBRkU7SUFBQXBCLEdBQUE7SUFBQUssS0FBQSxFQUdBLFNBQUFvQixXQUFtQkMsTUFBdUIsRUFBb0I7TUFBQSxJQUFBQyxLQUFBO01BQzVESixNQUFNLElBQUlBLE1BQU0sQ0FBRSxDQUFDLElBQUksQ0FBQ1AsWUFBWSxFQUFFLHdEQUF5RCxDQUFDO01BQ2hHLElBQUksQ0FBQ0QsWUFBWSxDQUFDTSxJQUFJLENBQUVLLE1BQU8sQ0FBQztNQUNoQyxPQUFPLFlBQU07UUFDWEgsTUFBTSxJQUFJQSxNQUFNLENBQUVJLEtBQUksQ0FBQ1osWUFBWSxDQUFDYSxRQUFRLENBQUVGLE1BQU8sQ0FBQyxFQUFFLGNBQWUsQ0FBQztRQUN4RSxJQUFBRyx1QkFBVyxFQUFFRixLQUFJLENBQUNaLFlBQVksRUFBRVcsTUFBTyxDQUFDO1FBQ3hDQyxLQUFJLENBQUNMLGNBQWMsQ0FBQyxDQUFDO01BQ3ZCLENBQUM7SUFDSDtFQUFDO0FBQUE7QUFHSCxJQUFNUSxXQUFXLEdBQUcsSUFBSWhCLFdBQVcsQ0FBQyxDQUFDO0FBRXJDaUIsb0JBQVEsQ0FBQ0MsUUFBUSxDQUFFLGFBQWEsRUFBRUYsV0FBWSxDQUFDO0FBQUMsSUFBQUcsUUFBQSxHQUFBQyxPQUFBLGNBRWpDSixXQUFXIiwiaWdub3JlTGlzdCI6W119