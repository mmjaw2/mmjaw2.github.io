"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } // Copyright 2019-2022, University of Colorado Boulder
/**
 * An object that contains a value for each item in an enumeration.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
// T = enumeration value type
// U = mapped value type
var EnumerationMap = /*#__PURE__*/function () {
  /**
   * @param enumeration
   * @param factory - function( {TEnumeration.*} ) => {*}, maps an enumeration value to any value.
   */
  function EnumerationMap(enumeration, factory) {
    var _this = this;
    _classCallCheck(this, EnumerationMap);
    _defineProperty(this, "_enumeration", void 0);
    _defineProperty(this, "_map", new Map());
    _defineProperty(this, "_values", void 0);
    this._enumeration = enumeration;
    this._values = enumeration.enumeration.values;
    this._values.forEach(function (entry) {
      assert && assert(!_this._map.has(entry), 'Enumeration key override problem');
      _this._map.set(entry, factory(entry));
    });
  }

  /**
   * Returns the value associated with the given enumeration entry.
   */
  return _createClass(EnumerationMap, [{
    key: "get",
    value: function get(entry) {
      assert && assert(this._values.includes(entry));
      assert && assert(this._map.has(entry));
      return this._map.get(entry);
    }

    /**
     * Sets the value associated with the given enumeration entry.
     */
  }, {
    key: "set",
    value: function set(entry, value) {
      assert && assert(this._values.includes(entry));
      this._map.set(entry, value);
    }

    /**
     * Returns a new EnumerationMap with mapped values.
     *
     * @param mapFunction - function( {*}, {TEnumeration.*} ): {*}
     * @returns With the mapped values
     */
  }, {
    key: "map",
    value: function map(mapFunction) {
      var _this2 = this;
      return new EnumerationMap(this._enumeration, function (entry) {
        return mapFunction(_this2.get(entry), entry);
      });
    }

    /**
     * Calls the callback on each item of the enumeration map.
     *
     * @param callback - function(value:*, enumerationValue:*)
     */
  }, {
    key: "forEach",
    value: function forEach(callback) {
      var _this3 = this;
      this._values.forEach(function (entry) {
        return callback(_this3.get(entry), entry);
      });
    }

    /**
     * Returns the values stored in the map, as an array
     *
     */
  }, {
    key: "values",
    value: function values() {
      var _this4 = this;
      return this._values.map(function (entry) {
        return _this4.get(entry);
      });
    }
  }]);
}();
_phetCore["default"].register('EnumerationMap', EnumerationMap);
var _default = exports["default"] = EnumerationMap;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcGhldENvcmUiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJfdHlwZW9mIiwibyIsIlN5bWJvbCIsIml0ZXJhdG9yIiwiY29uc3RydWN0b3IiLCJwcm90b3R5cGUiLCJfY2xhc3NDYWxsQ2hlY2siLCJpbnN0YW5jZSIsIkNvbnN0cnVjdG9yIiwiVHlwZUVycm9yIiwiX2RlZmluZVByb3BlcnRpZXMiLCJ0YXJnZXQiLCJwcm9wcyIsImkiLCJsZW5ndGgiLCJkZXNjcmlwdG9yIiwiZW51bWVyYWJsZSIsImNvbmZpZ3VyYWJsZSIsIndyaXRhYmxlIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJfdG9Qcm9wZXJ0eUtleSIsImtleSIsIl9jcmVhdGVDbGFzcyIsInByb3RvUHJvcHMiLCJzdGF0aWNQcm9wcyIsIl9kZWZpbmVQcm9wZXJ0eSIsInZhbHVlIiwidCIsIl90b1ByaW1pdGl2ZSIsInIiLCJlIiwidG9QcmltaXRpdmUiLCJjYWxsIiwiU3RyaW5nIiwiTnVtYmVyIiwiRW51bWVyYXRpb25NYXAiLCJlbnVtZXJhdGlvbiIsImZhY3RvcnkiLCJfdGhpcyIsIk1hcCIsIl9lbnVtZXJhdGlvbiIsIl92YWx1ZXMiLCJ2YWx1ZXMiLCJmb3JFYWNoIiwiZW50cnkiLCJhc3NlcnQiLCJfbWFwIiwiaGFzIiwic2V0IiwiZ2V0IiwiaW5jbHVkZXMiLCJtYXAiLCJtYXBGdW5jdGlvbiIsIl90aGlzMiIsImNhbGxiYWNrIiwiX3RoaXMzIiwiX3RoaXM0IiwicGhldENvcmUiLCJyZWdpc3RlciIsIl9kZWZhdWx0IiwiZXhwb3J0cyJdLCJzb3VyY2VzIjpbIkVudW1lcmF0aW9uTWFwLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE5LTIwMjIsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEFuIG9iamVjdCB0aGF0IGNvbnRhaW5zIGEgdmFsdWUgZm9yIGVhY2ggaXRlbSBpbiBhbiBlbnVtZXJhdGlvbi5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBwaGV0Q29yZSBmcm9tICcuL3BoZXRDb3JlLmpzJztcclxuXHJcbnR5cGUgVEVudW1lcmF0aW9uPFQ+ID0ge1xyXG4gIGVudW1lcmF0aW9uOiB7XHJcbiAgICB2YWx1ZXM6IFRbXTtcclxuICB9O1xyXG59O1xyXG5cclxuLy8gVCA9IGVudW1lcmF0aW9uIHZhbHVlIHR5cGVcclxuLy8gVSA9IG1hcHBlZCB2YWx1ZSB0eXBlXHJcbmNsYXNzIEVudW1lcmF0aW9uTWFwPFQsIFU+IHtcclxuICBwcml2YXRlIHJlYWRvbmx5IF9lbnVtZXJhdGlvbjogVEVudW1lcmF0aW9uPFQ+O1xyXG4gIHByaXZhdGUgX21hcCA9IG5ldyBNYXA8VCwgVT4oKTtcclxuICBwcml2YXRlIF92YWx1ZXM6IFRbXTtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIGVudW1lcmF0aW9uXHJcbiAgICogQHBhcmFtIGZhY3RvcnkgLSBmdW5jdGlvbigge1RFbnVtZXJhdGlvbi4qfSApID0+IHsqfSwgbWFwcyBhbiBlbnVtZXJhdGlvbiB2YWx1ZSB0byBhbnkgdmFsdWUuXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBlbnVtZXJhdGlvbjogVEVudW1lcmF0aW9uPFQ+LCBmYWN0b3J5OiAoIHQ6IFQgKSA9PiBVICkge1xyXG5cclxuICAgIHRoaXMuX2VudW1lcmF0aW9uID0gZW51bWVyYXRpb247XHJcblxyXG4gICAgdGhpcy5fdmFsdWVzID0gZW51bWVyYXRpb24uZW51bWVyYXRpb24udmFsdWVzO1xyXG4gICAgdGhpcy5fdmFsdWVzLmZvckVhY2goIGVudHJ5ID0+IHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMuX21hcC5oYXMoIGVudHJ5ICksICdFbnVtZXJhdGlvbiBrZXkgb3ZlcnJpZGUgcHJvYmxlbScgKTtcclxuICAgICAgdGhpcy5fbWFwLnNldCggZW50cnksIGZhY3RvcnkoIGVudHJ5ICkgKTtcclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHZhbHVlIGFzc29jaWF0ZWQgd2l0aCB0aGUgZ2l2ZW4gZW51bWVyYXRpb24gZW50cnkuXHJcbiAgICovXHJcbiAgcHVibGljIGdldCggZW50cnk6IFQgKTogVSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl92YWx1ZXMuaW5jbHVkZXMoIGVudHJ5ICkgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX21hcC5oYXMoIGVudHJ5ICkgKTtcclxuICAgIHJldHVybiB0aGlzLl9tYXAuZ2V0KCBlbnRyeSApITtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHZhbHVlIGFzc29jaWF0ZWQgd2l0aCB0aGUgZ2l2ZW4gZW51bWVyYXRpb24gZW50cnkuXHJcbiAgICovXHJcbiAgcHVibGljIHNldCggZW50cnk6IFQsIHZhbHVlOiBVICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fdmFsdWVzLmluY2x1ZGVzKCBlbnRyeSApICk7XHJcbiAgICB0aGlzLl9tYXAuc2V0KCBlbnRyeSwgdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBuZXcgRW51bWVyYXRpb25NYXAgd2l0aCBtYXBwZWQgdmFsdWVzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIG1hcEZ1bmN0aW9uIC0gZnVuY3Rpb24oIHsqfSwge1RFbnVtZXJhdGlvbi4qfSApOiB7Kn1cclxuICAgKiBAcmV0dXJucyBXaXRoIHRoZSBtYXBwZWQgdmFsdWVzXHJcbiAgICovXHJcbiAgcHVibGljIG1hcCggbWFwRnVuY3Rpb246ICggdTogVSwgdDogVCApID0+IFUgKTogRW51bWVyYXRpb25NYXA8VCwgVT4ge1xyXG4gICAgcmV0dXJuIG5ldyBFbnVtZXJhdGlvbk1hcCggdGhpcy5fZW51bWVyYXRpb24sIGVudHJ5ID0+IG1hcEZ1bmN0aW9uKCB0aGlzLmdldCggZW50cnkgKSwgZW50cnkgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbHMgdGhlIGNhbGxiYWNrIG9uIGVhY2ggaXRlbSBvZiB0aGUgZW51bWVyYXRpb24gbWFwLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNhbGxiYWNrIC0gZnVuY3Rpb24odmFsdWU6KiwgZW51bWVyYXRpb25WYWx1ZToqKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBmb3JFYWNoKCBjYWxsYmFjazogKCB1OiBVLCB0OiBUICkgPT4gdm9pZCApOiB2b2lkIHtcclxuICAgIHRoaXMuX3ZhbHVlcy5mb3JFYWNoKCBlbnRyeSA9PiBjYWxsYmFjayggdGhpcy5nZXQoIGVudHJ5ICksIGVudHJ5ICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHZhbHVlcyBzdG9yZWQgaW4gdGhlIG1hcCwgYXMgYW4gYXJyYXlcclxuICAgKlxyXG4gICAqL1xyXG4gIHB1YmxpYyB2YWx1ZXMoKTogVVtdIHtcclxuICAgIHJldHVybiB0aGlzLl92YWx1ZXMubWFwKCBlbnRyeSA9PiB0aGlzLmdldCggZW50cnkgKSApO1xyXG4gIH1cclxufVxyXG5cclxucGhldENvcmUucmVnaXN0ZXIoICdFbnVtZXJhdGlvbk1hcCcsIEVudW1lcmF0aW9uTWFwICk7XHJcbmV4cG9ydCBkZWZhdWx0IEVudW1lcmF0aW9uTWFwOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBUUEsSUFBQUEsU0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQXFDLFNBQUFELHVCQUFBRSxHQUFBLFdBQUFBLEdBQUEsSUFBQUEsR0FBQSxDQUFBQyxVQUFBLEdBQUFELEdBQUEsZ0JBQUFBLEdBQUE7QUFBQSxTQUFBRSxRQUFBQyxDQUFBLHNDQUFBRCxPQUFBLHdCQUFBRSxNQUFBLHVCQUFBQSxNQUFBLENBQUFDLFFBQUEsYUFBQUYsQ0FBQSxr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