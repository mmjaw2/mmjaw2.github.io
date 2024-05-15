"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
var _EnumerationValue;
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } // Copyright 2021-2023, University of Colorado Boulder
/**
 * EnumerationValue is the base class for enumeration value instances.
 * See https://github.com/phetsims/phet-info/blob/main/doc/phet-software-design-patterns.md#enumeration
 *
 * PhET's Enumeration pattern is:
 *
 * class MyEnumeration extends EnumerationValue {
 *   public static readonly VALUE_1 = new MyEnumeration();
 *   public static readonly VALUE_2 = new MyEnumeration();
 *
 *   // Make sure this is last, once all EnumerationValues have been declared statically.
 *   public static readonly enumeration = new Enumeration( MyEnumeration );
 * }
 *
 * // Usage
 * console.log( MyEnumeration.VALUE_1 );
 * const printValue = enumValue => {
 *   assert && assert( enumValue.enumeration.values.includes(enumValue));
 *   console.log( enumValue );
 * };
 * printValue( MyEnumeration.VALUE_2 );
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
var EnumerationValue = /*#__PURE__*/function () {
  function EnumerationValue() {
    _classCallCheck(this, EnumerationValue);
    // null until set by Enumeration. Once set, cannot be changed.
    _defineProperty(this, "_name", void 0);
    _defineProperty(this, "_enumeration", void 0);
    var c = this.constructor;
    assert && assert(!EnumerationValue.sealedCache.has(c), 'cannot create instanceof of a sealed constructor');
    this._name = null;
    this._enumeration = null;
  }
  return _createClass(EnumerationValue, [{
    key: "toString",
    value: function toString() {
      return this.name;
    }

    // This method is unused, but needs to remain here so other types don't accidentally structurally match
    // enumeration values.  Without this, string satisfies the EnumerationValue interface, but we don't want it to.
  }, {
    key: "isEnumerationValue",
    value: function isEnumerationValue() {
      return true;
    }
  }, {
    key: "name",
    get: function get() {
      assert && assert(this._name, 'name cannot be retrieved until it has been filled in by Enumeration.');
      return this._name;
    },
    set: function set(name) {
      assert && assert(!this._name, 'name cannot be changed once defined.');
      this._name = name;
    }
  }, {
    key: "enumeration",
    get: function get() {
      assert && assert(this._enumeration, 'enumeration cannot be retrieved until it has been filled in by Enumeration.');
      return this._enumeration;
    },
    set: function set(enumeration) {
      assert && assert(!this._enumeration, 'enumeration cannot be changed once defined.');
      this._enumeration = enumeration;
    }
  }]);
}();
_EnumerationValue = EnumerationValue;
// After an Enumeration is constructed, no new instances of that exact type can be made (though it is OK to
// create subtypes)
_defineProperty(EnumerationValue, "sealedCache", new Set());
_phetCore["default"].register('EnumerationValue', EnumerationValue);
var _default = exports["default"] = EnumerationValue;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcGhldENvcmUiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9FbnVtZXJhdGlvblZhbHVlIiwib2JqIiwiX19lc01vZHVsZSIsIl90eXBlb2YiLCJvIiwiU3ltYm9sIiwiaXRlcmF0b3IiLCJjb25zdHJ1Y3RvciIsInByb3RvdHlwZSIsIl9jbGFzc0NhbGxDaGVjayIsImluc3RhbmNlIiwiQ29uc3RydWN0b3IiLCJUeXBlRXJyb3IiLCJfZGVmaW5lUHJvcGVydGllcyIsInRhcmdldCIsInByb3BzIiwiaSIsImxlbmd0aCIsImRlc2NyaXB0b3IiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsIl90b1Byb3BlcnR5S2V5Iiwia2V5IiwiX2NyZWF0ZUNsYXNzIiwicHJvdG9Qcm9wcyIsInN0YXRpY1Byb3BzIiwiX2RlZmluZVByb3BlcnR5IiwidmFsdWUiLCJ0IiwiX3RvUHJpbWl0aXZlIiwiciIsImUiLCJ0b1ByaW1pdGl2ZSIsImNhbGwiLCJTdHJpbmciLCJOdW1iZXIiLCJFbnVtZXJhdGlvblZhbHVlIiwiYyIsImFzc2VydCIsInNlYWxlZENhY2hlIiwiaGFzIiwiX25hbWUiLCJfZW51bWVyYXRpb24iLCJ0b1N0cmluZyIsIm5hbWUiLCJpc0VudW1lcmF0aW9uVmFsdWUiLCJnZXQiLCJzZXQiLCJlbnVtZXJhdGlvbiIsIlNldCIsInBoZXRDb3JlIiwicmVnaXN0ZXIiLCJfZGVmYXVsdCIsImV4cG9ydHMiXSwic291cmNlcyI6WyJFbnVtZXJhdGlvblZhbHVlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEVudW1lcmF0aW9uVmFsdWUgaXMgdGhlIGJhc2UgY2xhc3MgZm9yIGVudW1lcmF0aW9uIHZhbHVlIGluc3RhbmNlcy5cclxuICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWluZm8vYmxvYi9tYWluL2RvYy9waGV0LXNvZnR3YXJlLWRlc2lnbi1wYXR0ZXJucy5tZCNlbnVtZXJhdGlvblxyXG4gKlxyXG4gKiBQaEVUJ3MgRW51bWVyYXRpb24gcGF0dGVybiBpczpcclxuICpcclxuICogY2xhc3MgTXlFbnVtZXJhdGlvbiBleHRlbmRzIEVudW1lcmF0aW9uVmFsdWUge1xyXG4gKiAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVkFMVUVfMSA9IG5ldyBNeUVudW1lcmF0aW9uKCk7XHJcbiAqICAgcHVibGljIHN0YXRpYyByZWFkb25seSBWQUxVRV8yID0gbmV3IE15RW51bWVyYXRpb24oKTtcclxuICpcclxuICogICAvLyBNYWtlIHN1cmUgdGhpcyBpcyBsYXN0LCBvbmNlIGFsbCBFbnVtZXJhdGlvblZhbHVlcyBoYXZlIGJlZW4gZGVjbGFyZWQgc3RhdGljYWxseS5cclxuICogICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IGVudW1lcmF0aW9uID0gbmV3IEVudW1lcmF0aW9uKCBNeUVudW1lcmF0aW9uICk7XHJcbiAqIH1cclxuICpcclxuICogLy8gVXNhZ2VcclxuICogY29uc29sZS5sb2coIE15RW51bWVyYXRpb24uVkFMVUVfMSApO1xyXG4gKiBjb25zdCBwcmludFZhbHVlID0gZW51bVZhbHVlID0+IHtcclxuICogICBhc3NlcnQgJiYgYXNzZXJ0KCBlbnVtVmFsdWUuZW51bWVyYXRpb24udmFsdWVzLmluY2x1ZGVzKGVudW1WYWx1ZSkpO1xyXG4gKiAgIGNvbnNvbGUubG9nKCBlbnVtVmFsdWUgKTtcclxuICogfTtcclxuICogcHJpbnRWYWx1ZSggTXlFbnVtZXJhdGlvbi5WQUxVRV8yICk7XHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgcGhldENvcmUgZnJvbSAnLi9waGV0Q29yZS5qcyc7XHJcbmltcG9ydCBFbnVtZXJhdGlvbiBmcm9tICcuL0VudW1lcmF0aW9uLmpzJztcclxuaW1wb3J0IENvbnN0cnVjdG9yIGZyb20gJy4vdHlwZXMvQ29uc3RydWN0b3IuanMnO1xyXG5cclxuY2xhc3MgRW51bWVyYXRpb25WYWx1ZSB7XHJcblxyXG4gIC8vIG51bGwgdW50aWwgc2V0IGJ5IEVudW1lcmF0aW9uLiBPbmNlIHNldCwgY2Fubm90IGJlIGNoYW5nZWQuXHJcbiAgcHJpdmF0ZSBfbmFtZTogc3RyaW5nIHwgbnVsbDtcclxuICBwcml2YXRlIF9lbnVtZXJhdGlvbjogRW51bWVyYXRpb248dGhpcz4gfCBudWxsO1xyXG5cclxuICAvLyBBZnRlciBhbiBFbnVtZXJhdGlvbiBpcyBjb25zdHJ1Y3RlZCwgbm8gbmV3IGluc3RhbmNlcyBvZiB0aGF0IGV4YWN0IHR5cGUgY2FuIGJlIG1hZGUgKHRob3VnaCBpdCBpcyBPSyB0b1xyXG4gIC8vIGNyZWF0ZSBzdWJ0eXBlcylcclxuICBwdWJsaWMgc3RhdGljIHNlYWxlZENhY2hlID0gbmV3IFNldDxDb25zdHJ1Y3RvcjxFbnVtZXJhdGlvblZhbHVlPj4oKTtcclxuXHJcbiAgcHVibGljIHRvU3RyaW5nKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy5uYW1lO1xyXG4gIH1cclxuXHJcbiAgLy8gVGhpcyBtZXRob2QgaXMgdW51c2VkLCBidXQgbmVlZHMgdG8gcmVtYWluIGhlcmUgc28gb3RoZXIgdHlwZXMgZG9uJ3QgYWNjaWRlbnRhbGx5IHN0cnVjdHVyYWxseSBtYXRjaFxyXG4gIC8vIGVudW1lcmF0aW9uIHZhbHVlcy4gIFdpdGhvdXQgdGhpcywgc3RyaW5nIHNhdGlzZmllcyB0aGUgRW51bWVyYXRpb25WYWx1ZSBpbnRlcmZhY2UsIGJ1dCB3ZSBkb24ndCB3YW50IGl0IHRvLlxyXG4gIHByaXZhdGUgaXNFbnVtZXJhdGlvblZhbHVlKCk6IGJvb2xlYW4ge3JldHVybiB0cnVlO31cclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgY29uc3QgYyA9IHRoaXMuY29uc3RydWN0b3IgYXMgQ29uc3RydWN0b3I8RW51bWVyYXRpb25WYWx1ZT47XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhRW51bWVyYXRpb25WYWx1ZS5zZWFsZWRDYWNoZS5oYXMoIGMgKSwgJ2Nhbm5vdCBjcmVhdGUgaW5zdGFuY2VvZiBvZiBhIHNlYWxlZCBjb25zdHJ1Y3RvcicgKTtcclxuXHJcbiAgICB0aGlzLl9uYW1lID0gbnVsbDtcclxuICAgIHRoaXMuX2VudW1lcmF0aW9uID0gbnVsbDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgbmFtZSggbmFtZTogc3RyaW5nICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMuX25hbWUsICduYW1lIGNhbm5vdCBiZSBjaGFuZ2VkIG9uY2UgZGVmaW5lZC4nICk7XHJcbiAgICB0aGlzLl9uYW1lID0gbmFtZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgbmFtZSgpOiBzdHJpbmcge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fbmFtZSwgJ25hbWUgY2Fubm90IGJlIHJldHJpZXZlZCB1bnRpbCBpdCBoYXMgYmVlbiBmaWxsZWQgaW4gYnkgRW51bWVyYXRpb24uJyApO1xyXG4gICAgcmV0dXJuIHRoaXMuX25hbWUhO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBlbnVtZXJhdGlvbiggZW51bWVyYXRpb246IEVudW1lcmF0aW9uPHRoaXM+ICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMuX2VudW1lcmF0aW9uLCAnZW51bWVyYXRpb24gY2Fubm90IGJlIGNoYW5nZWQgb25jZSBkZWZpbmVkLicgKTtcclxuICAgIHRoaXMuX2VudW1lcmF0aW9uID0gZW51bWVyYXRpb247XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGVudW1lcmF0aW9uKCk6IEVudW1lcmF0aW9uPHRoaXM+IHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2VudW1lcmF0aW9uLCAnZW51bWVyYXRpb24gY2Fubm90IGJlIHJldHJpZXZlZCB1bnRpbCBpdCBoYXMgYmVlbiBmaWxsZWQgaW4gYnkgRW51bWVyYXRpb24uJyApO1xyXG4gICAgcmV0dXJuIHRoaXMuX2VudW1lcmF0aW9uITtcclxuICB9XHJcbn1cclxuXHJcbnBoZXRDb3JlLnJlZ2lzdGVyKCAnRW51bWVyYXRpb25WYWx1ZScsIEVudW1lcmF0aW9uVmFsdWUgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IEVudW1lcmF0aW9uVmFsdWU7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUE0QkEsSUFBQUEsU0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQXFDLElBQUFDLGlCQUFBO0FBQUEsU0FBQUYsdUJBQUFHLEdBQUEsV0FBQUEsR0FBQSxJQUFBQSxHQUFBLENBQUFDLFVBQUEsR0FBQUQsR0FBQSxnQkFBQUEsR0FBQTtBQUFBLFNBQUFFLFFBQUFDLENBQUEsc0NBQUFELE9BQUEsd0JBQUFFLE1BQUEsdUJBQUFBLE1BQUEsQ0FBQUMsUUFBQSxhQUFBRixDQUFBLGtCQUFBQSxDQUFBLGdCQUFBQSxDQUFBLFdBQUFBLENBQUEseUJBQUFDLE1BQUEsSUFBQUQsQ0FBQSxDQUFBRyxXQUFBLEtBQUFGLE1BQUEsSUFBQUQsQ0FBQSxLQUFBQyxNQUFBLENBQUFHLFNBQUEscUJBQUFKLENBQUEsS0FBQUQsT0FBQSxDQUFBQyxDQUFBO0FBQUEsU0FBQUssZ0JBQUFDLFFBQUEsRUFBQUMsV0FBQSxVQUFBRCxRQUFBLFlBQUFDLFdBQUEsZUFBQUMsU0FBQTtBQUFBLFNBQUFDLGtCQUFBQyxNQUFBLEVBQUFDLEtBQUEsYUFBQUMsQ0FBQSxNQUFBQSxDQUFBLEdBQUFELEtBQUEsQ0FBQUUsTUFBQSxFQUFBRCxDQUFBLFVBQUFFLFVBQUEsR0FBQUgsS0FBQSxDQUFBQyxDQUFBLEdBQUFFLFVBQUEsQ0FBQUMsVUFBQSxHQUFBRCxVQUFBLENBQUFDLFVB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