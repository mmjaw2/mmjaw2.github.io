"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
var _EnumerationValue = _interopRequireDefault(require("./EnumerationValue.js"));
var _inheritance = _interopRequireDefault(require("./inheritance.js"));
var _optionize = _interopRequireDefault(require("./optionize.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } // Copyright 2021-2023, University of Colorado Boulder
/**
 * This implementation auto-detects the enumeration values by Object.keys and instanceof. Every property that has a
 * type matching the enumeration type is marked as a value.  See sample usage in Orientation.ts.
 *
 * For general pattern see https://github.com/phetsims/phet-info/blob/main/doc/phet-software-design-patterns.md#enumeration
 *
 * This creates 2-way maps (key-to-value and value-to-key) for ease of use and to enable phet-io serialization.
 *
 * class T extends EnumerationValue {
 *     static a=new T();
 *     static b =new T();
 *     getName(){return 'he';}
 *     get thing(){return 'text';}
 *     static get age(){return 77;}
 *     static enumeration = new Enumeration( T );
 * }
 * T.enumeration.keys => ['a', 'b']
 * T.enumeration.values => [T, T]
 *
 * Note how `keys` only picks up 'a' and 'b'.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
var Enumeration = /*#__PURE__*/function () {
  function Enumeration(_Enumeration2, providedOptions) {
    var _this = this;
    _classCallCheck(this, Enumeration);
    _defineProperty(this, "values", void 0);
    // in the order that static instances are defined
    _defineProperty(this, "keys", void 0);
    _defineProperty(this, "Enumeration", void 0);
    _defineProperty(this, "phetioDocumentation", void 0);
    var options = (0, _optionize["default"])()({
      phetioDocumentation: '',
      // Values are plucked from the supplied Enumeration, but in order to support subtyping (augmenting) Enumerations,
      // you can specify the rule for what counts as a member of the enumeration. This should only be used in the
      // special case of augmenting existing enumerations.
      instanceType: _Enumeration2
    }, providedOptions);
    this.phetioDocumentation = options.phetioDocumentation;
    var instanceType = options.instanceType;

    // Iterate over the type hierarchy to support augmenting enumerations, but reverse so that newly added enumeration
    // values appear after previously existing enumeration values
    var types = _.reverse((0, _inheritance["default"])(_Enumeration2));
    assert && assert(types.includes(instanceType), 'the specified type should be in its own hierarchy');
    this.keys = [];
    this.values = [];
    types.forEach(function (type) {
      Object.keys(type).forEach(function (key) {
        var value = type[key];
        if (value instanceof instanceType) {
          assert && assert(key === key.toUpperCase(), 'keys should be upper case by convention');
          _this.keys.push(key);
          _this.values.push(value);

          // Only assign this to the lowest Enumeration in the hierarchy. Otherwise this would overwrite the
          // supertype-assigned Enumeration. See https://github.com/phetsims/phet-core/issues/102
          if (value instanceof _Enumeration2) {
            value.name = key;
            value.enumeration = _this;
          }
        }
      });
    });
    assert && assert(this.keys.length > 0, 'no keys found');
    assert && assert(this.values.length > 0, 'no values found');
    this.Enumeration = _Enumeration2;
    _EnumerationValue["default"].sealedCache.add(_Enumeration2);
  }
  return _createClass(Enumeration, [{
    key: "getKey",
    value: function getKey(value) {
      return value.name;
    }
  }, {
    key: "getValue",
    value: function getValue(key) {
      return this.Enumeration[key];
    }
  }, {
    key: "includes",
    value: function includes(value) {
      return this.values.includes(value);
    }
  }]);
}();
_phetCore["default"].register('Enumeration', Enumeration);
var _default = exports["default"] = Enumeration;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcGhldENvcmUiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9FbnVtZXJhdGlvblZhbHVlIiwiX2luaGVyaXRhbmNlIiwiX29wdGlvbml6ZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJfdHlwZW9mIiwibyIsIlN5bWJvbCIsIml0ZXJhdG9yIiwiY29uc3RydWN0b3IiLCJwcm90b3R5cGUiLCJfY2xhc3NDYWxsQ2hlY2siLCJpbnN0YW5jZSIsIkNvbnN0cnVjdG9yIiwiVHlwZUVycm9yIiwiX2RlZmluZVByb3BlcnRpZXMiLCJ0YXJnZXQiLCJwcm9wcyIsImkiLCJsZW5ndGgiLCJkZXNjcmlwdG9yIiwiZW51bWVyYWJsZSIsImNvbmZpZ3VyYWJsZSIsIndyaXRhYmxlIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJfdG9Qcm9wZXJ0eUtleSIsImtleSIsIl9jcmVhdGVDbGFzcyIsInByb3RvUHJvcHMiLCJzdGF0aWNQcm9wcyIsIl9kZWZpbmVQcm9wZXJ0eSIsInZhbHVlIiwidCIsIl90b1ByaW1pdGl2ZSIsInIiLCJlIiwidG9QcmltaXRpdmUiLCJjYWxsIiwiU3RyaW5nIiwiTnVtYmVyIiwiRW51bWVyYXRpb24iLCJwcm92aWRlZE9wdGlvbnMiLCJfdGhpcyIsIm9wdGlvbnMiLCJvcHRpb25pemUiLCJwaGV0aW9Eb2N1bWVudGF0aW9uIiwiaW5zdGFuY2VUeXBlIiwidHlwZXMiLCJfIiwicmV2ZXJzZSIsImluaGVyaXRhbmNlIiwiYXNzZXJ0IiwiaW5jbHVkZXMiLCJrZXlzIiwidmFsdWVzIiwiZm9yRWFjaCIsInR5cGUiLCJ0b1VwcGVyQ2FzZSIsInB1c2giLCJuYW1lIiwiZW51bWVyYXRpb24iLCJFbnVtZXJhdGlvblZhbHVlIiwic2VhbGVkQ2FjaGUiLCJhZGQiLCJnZXRLZXkiLCJnZXRWYWx1ZSIsInBoZXRDb3JlIiwicmVnaXN0ZXIiLCJfZGVmYXVsdCIsImV4cG9ydHMiXSwic291cmNlcyI6WyJFbnVtZXJhdGlvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMS0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBUaGlzIGltcGxlbWVudGF0aW9uIGF1dG8tZGV0ZWN0cyB0aGUgZW51bWVyYXRpb24gdmFsdWVzIGJ5IE9iamVjdC5rZXlzIGFuZCBpbnN0YW5jZW9mLiBFdmVyeSBwcm9wZXJ0eSB0aGF0IGhhcyBhXHJcbiAqIHR5cGUgbWF0Y2hpbmcgdGhlIGVudW1lcmF0aW9uIHR5cGUgaXMgbWFya2VkIGFzIGEgdmFsdWUuICBTZWUgc2FtcGxlIHVzYWdlIGluIE9yaWVudGF0aW9uLnRzLlxyXG4gKlxyXG4gKiBGb3IgZ2VuZXJhbCBwYXR0ZXJuIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pbmZvL2Jsb2IvbWFpbi9kb2MvcGhldC1zb2Z0d2FyZS1kZXNpZ24tcGF0dGVybnMubWQjZW51bWVyYXRpb25cclxuICpcclxuICogVGhpcyBjcmVhdGVzIDItd2F5IG1hcHMgKGtleS10by12YWx1ZSBhbmQgdmFsdWUtdG8ta2V5KSBmb3IgZWFzZSBvZiB1c2UgYW5kIHRvIGVuYWJsZSBwaGV0LWlvIHNlcmlhbGl6YXRpb24uXHJcbiAqXHJcbiAqIGNsYXNzIFQgZXh0ZW5kcyBFbnVtZXJhdGlvblZhbHVlIHtcclxuICogICAgIHN0YXRpYyBhPW5ldyBUKCk7XHJcbiAqICAgICBzdGF0aWMgYiA9bmV3IFQoKTtcclxuICogICAgIGdldE5hbWUoKXtyZXR1cm4gJ2hlJzt9XHJcbiAqICAgICBnZXQgdGhpbmcoKXtyZXR1cm4gJ3RleHQnO31cclxuICogICAgIHN0YXRpYyBnZXQgYWdlKCl7cmV0dXJuIDc3O31cclxuICogICAgIHN0YXRpYyBlbnVtZXJhdGlvbiA9IG5ldyBFbnVtZXJhdGlvbiggVCApO1xyXG4gKiB9XHJcbiAqIFQuZW51bWVyYXRpb24ua2V5cyA9PiBbJ2EnLCAnYiddXHJcbiAqIFQuZW51bWVyYXRpb24udmFsdWVzID0+IFtULCBUXVxyXG4gKlxyXG4gKiBOb3RlIGhvdyBga2V5c2Agb25seSBwaWNrcyB1cCAnYScgYW5kICdiJy5cclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBwaGV0Q29yZSBmcm9tICcuL3BoZXRDb3JlLmpzJztcclxuaW1wb3J0IFRFbnVtZXJhdGlvbiBmcm9tICcuL1RFbnVtZXJhdGlvbi5qcyc7XHJcbmltcG9ydCBFbnVtZXJhdGlvblZhbHVlIGZyb20gJy4vRW51bWVyYXRpb25WYWx1ZS5qcyc7XHJcbmltcG9ydCBpbmhlcml0YW5jZSBmcm9tICcuL2luaGVyaXRhbmNlLmpzJztcclxuaW1wb3J0IENvbnN0cnVjdG9yIGZyb20gJy4vdHlwZXMvQ29uc3RydWN0b3IuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplIGZyb20gJy4vb3B0aW9uaXplLmpzJztcclxuXHJcbmV4cG9ydCB0eXBlIEVudW1lcmF0aW9uT3B0aW9uczxUIGV4dGVuZHMgRW51bWVyYXRpb25WYWx1ZT4gPSB7XHJcbiAgcGhldGlvRG9jdW1lbnRhdGlvbj86IHN0cmluZztcclxuICBpbnN0YW5jZVR5cGU/OiBDb25zdHJ1Y3RvcjxUPjtcclxufTtcclxuXHJcbmNsYXNzIEVudW1lcmF0aW9uPFQgZXh0ZW5kcyBFbnVtZXJhdGlvblZhbHVlPiBpbXBsZW1lbnRzIFRFbnVtZXJhdGlvbjxUPiB7XHJcbiAgcHVibGljIHJlYWRvbmx5IHZhbHVlczogVFtdOyAvLyBpbiB0aGUgb3JkZXIgdGhhdCBzdGF0aWMgaW5zdGFuY2VzIGFyZSBkZWZpbmVkXHJcbiAgcHVibGljIHJlYWRvbmx5IGtleXM6IHN0cmluZ1tdO1xyXG4gIHB1YmxpYyByZWFkb25seSBFbnVtZXJhdGlvbjogQ29uc3RydWN0b3I8VD4gJiBSZWNvcmQ8c3RyaW5nLCBUPjtcclxuICBwdWJsaWMgcmVhZG9ubHkgcGhldGlvRG9jdW1lbnRhdGlvbj86IHN0cmluZztcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBFbnVtZXJhdGlvbjogQ29uc3RydWN0b3I8VD4sIHByb3ZpZGVkT3B0aW9ucz86IEVudW1lcmF0aW9uT3B0aW9uczxUPiApIHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPEVudW1lcmF0aW9uT3B0aW9uczxUPj4oKSgge1xyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnJyxcclxuXHJcbiAgICAgIC8vIFZhbHVlcyBhcmUgcGx1Y2tlZCBmcm9tIHRoZSBzdXBwbGllZCBFbnVtZXJhdGlvbiwgYnV0IGluIG9yZGVyIHRvIHN1cHBvcnQgc3VidHlwaW5nIChhdWdtZW50aW5nKSBFbnVtZXJhdGlvbnMsXHJcbiAgICAgIC8vIHlvdSBjYW4gc3BlY2lmeSB0aGUgcnVsZSBmb3Igd2hhdCBjb3VudHMgYXMgYSBtZW1iZXIgb2YgdGhlIGVudW1lcmF0aW9uLiBUaGlzIHNob3VsZCBvbmx5IGJlIHVzZWQgaW4gdGhlXHJcbiAgICAgIC8vIHNwZWNpYWwgY2FzZSBvZiBhdWdtZW50aW5nIGV4aXN0aW5nIGVudW1lcmF0aW9ucy5cclxuICAgICAgaW5zdGFuY2VUeXBlOiBFbnVtZXJhdGlvblxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcbiAgICB0aGlzLnBoZXRpb0RvY3VtZW50YXRpb24gPSBvcHRpb25zLnBoZXRpb0RvY3VtZW50YXRpb247XHJcblxyXG4gICAgY29uc3QgaW5zdGFuY2VUeXBlID0gb3B0aW9ucy5pbnN0YW5jZVR5cGU7XHJcblxyXG4gICAgLy8gSXRlcmF0ZSBvdmVyIHRoZSB0eXBlIGhpZXJhcmNoeSB0byBzdXBwb3J0IGF1Z21lbnRpbmcgZW51bWVyYXRpb25zLCBidXQgcmV2ZXJzZSBzbyB0aGF0IG5ld2x5IGFkZGVkIGVudW1lcmF0aW9uXHJcbiAgICAvLyB2YWx1ZXMgYXBwZWFyIGFmdGVyIHByZXZpb3VzbHkgZXhpc3RpbmcgZW51bWVyYXRpb24gdmFsdWVzXHJcbiAgICBjb25zdCB0eXBlcyA9IF8ucmV2ZXJzZSggaW5oZXJpdGFuY2UoIEVudW1lcmF0aW9uICkgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlcy5pbmNsdWRlcyggaW5zdGFuY2VUeXBlICksICd0aGUgc3BlY2lmaWVkIHR5cGUgc2hvdWxkIGJlIGluIGl0cyBvd24gaGllcmFyY2h5JyApO1xyXG5cclxuICAgIHRoaXMua2V5cyA9IFtdO1xyXG4gICAgdGhpcy52YWx1ZXMgPSBbXTtcclxuICAgIHR5cGVzLmZvckVhY2goIHR5cGUgPT4ge1xyXG4gICAgICBPYmplY3Qua2V5cyggdHlwZSApLmZvckVhY2goIGtleSA9PiB7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSB0eXBlWyBrZXkgXTtcclxuICAgICAgICBpZiAoIHZhbHVlIGluc3RhbmNlb2YgaW5zdGFuY2VUeXBlICkge1xyXG4gICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCgga2V5ID09PSBrZXkudG9VcHBlckNhc2UoKSwgJ2tleXMgc2hvdWxkIGJlIHVwcGVyIGNhc2UgYnkgY29udmVudGlvbicgKTtcclxuICAgICAgICAgIHRoaXMua2V5cy5wdXNoKCBrZXkgKTtcclxuICAgICAgICAgIHRoaXMudmFsdWVzLnB1c2goIHZhbHVlICk7XHJcblxyXG4gICAgICAgICAgLy8gT25seSBhc3NpZ24gdGhpcyB0byB0aGUgbG93ZXN0IEVudW1lcmF0aW9uIGluIHRoZSBoaWVyYXJjaHkuIE90aGVyd2lzZSB0aGlzIHdvdWxkIG92ZXJ3cml0ZSB0aGVcclxuICAgICAgICAgIC8vIHN1cGVydHlwZS1hc3NpZ25lZCBFbnVtZXJhdGlvbi4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWNvcmUvaXNzdWVzLzEwMlxyXG4gICAgICAgICAgaWYgKCB2YWx1ZSBpbnN0YW5jZW9mIEVudW1lcmF0aW9uICkge1xyXG4gICAgICAgICAgICB2YWx1ZS5uYW1lID0ga2V5O1xyXG4gICAgICAgICAgICB2YWx1ZS5lbnVtZXJhdGlvbiA9IHRoaXM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5rZXlzLmxlbmd0aCA+IDAsICdubyBrZXlzIGZvdW5kJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy52YWx1ZXMubGVuZ3RoID4gMCwgJ25vIHZhbHVlcyBmb3VuZCcgKTtcclxuXHJcbiAgICB0aGlzLkVudW1lcmF0aW9uID0gRW51bWVyYXRpb24gYXMgQ29uc3RydWN0b3I8VD4gJiBSZWNvcmQ8c3RyaW5nLCBUPjtcclxuICAgIEVudW1lcmF0aW9uVmFsdWUuc2VhbGVkQ2FjaGUuYWRkKCBFbnVtZXJhdGlvbiApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldEtleSggdmFsdWU6IFQgKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB2YWx1ZS5uYW1lO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldFZhbHVlKCBrZXk6IHN0cmluZyApOiBUIHtcclxuICAgIHJldHVybiB0aGlzLkVudW1lcmF0aW9uWyBrZXkgXTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBpbmNsdWRlcyggdmFsdWU6IFQgKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy52YWx1ZXMuaW5jbHVkZXMoIHZhbHVlICk7XHJcbiAgfVxyXG59XHJcblxyXG5waGV0Q29yZS5yZWdpc3RlciggJ0VudW1lcmF0aW9uJywgRW51bWVyYXRpb24gKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IEVudW1lcmF0aW9uOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBMkJBLElBQUFBLFNBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUVBLElBQUFDLGlCQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxZQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7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