"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _EnumerationMap2 = _interopRequireDefault(require("./EnumerationMap.js"));
var _Orientation = _interopRequireDefault(require("./Orientation.js"));
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); } // Copyright 2021-2024, University of Colorado Boulder
/**
 * An object that contains a value for each item in an enumeration.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
var OrientationPair = /*#__PURE__*/function (_EnumerationMap) {
  /**
   * @param horizontal - Value for the horizontal orientation
   * @param vertical - Value for the vertical orientation
   */
  function OrientationPair(horizontal, vertical) {
    _classCallCheck(this, OrientationPair);
    return _callSuper(this, OrientationPair, [_Orientation["default"], function (orientation) {
      return orientation === _Orientation["default"].HORIZONTAL ? horizontal : vertical;
    }]);
  }
  _inherits(OrientationPair, _EnumerationMap);
  return _createClass(OrientationPair, [{
    key: "horizontal",
    get: function get() {
      return this.get(_Orientation["default"].HORIZONTAL);
    },
    set: function set(value) {
      this.set(_Orientation["default"].HORIZONTAL, value);
    }
  }, {
    key: "vertical",
    get: function get() {
      return this.get(_Orientation["default"].VERTICAL);
    },
    set: function set(value) {
      this.set(_Orientation["default"].VERTICAL, value);
    }
  }, {
    key: "with",
    value: function _with(orientation, value) {
      return new OrientationPair(orientation === _Orientation["default"].HORIZONTAL ? value : this.horizontal, orientation === _Orientation["default"].VERTICAL ? value : this.vertical);
    }

    /**
     * Creates an orientation pair based on a factory method.
     *
     * @param factory - called once for each orientation to determine
     *                             the value.
     */
  }, {
    key: "map",
    value:
    /**
     * Returns a new EnumerationMap with mapped values.
     *
     * @param mapFunction - function( {*}, {TEnumeration.*} ): {*}
     * @returns With the mapped values
     */
    function map(mapFunction) {
      return new OrientationPair(mapFunction(this.horizontal, _Orientation["default"].HORIZONTAL), mapFunction(this.vertical, _Orientation["default"].VERTICAL));
    }
  }], [{
    key: "create",
    value: function create(factory) {
      return new OrientationPair(factory(_Orientation["default"].HORIZONTAL), factory(_Orientation["default"].VERTICAL));
    }
  }]);
}(_EnumerationMap2["default"]);
_phetCore["default"].register('OrientationPair', OrientationPair);
var _default = exports["default"] = OrientationPair;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfRW51bWVyYXRpb25NYXAyIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfT3JpZW50YXRpb24iLCJfcGhldENvcmUiLCJvYmoiLCJfX2VzTW9kdWxlIiwiX2NsYXNzQ2FsbENoZWNrIiwiaW5zdGFuY2UiLCJDb25zdHJ1Y3RvciIsIlR5cGVFcnJvciIsIl9kZWZpbmVQcm9wZXJ0aWVzIiwidGFyZ2V0IiwicHJvcHMiLCJpIiwibGVuZ3RoIiwiZGVzY3JpcHRvciIsImVudW1lcmFibGUiLCJjb25maWd1cmFibGUiLCJ3cml0YWJsZSIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiX3RvUHJvcGVydHlLZXkiLCJrZXkiLCJfY3JlYXRlQ2xhc3MiLCJwcm90b1Byb3BzIiwic3RhdGljUHJvcHMiLCJwcm90b3R5cGUiLCJ0IiwiX3RvUHJpbWl0aXZlIiwiX3R5cGVvZiIsInIiLCJlIiwiU3ltYm9sIiwidG9QcmltaXRpdmUiLCJjYWxsIiwiU3RyaW5nIiwiTnVtYmVyIiwiX2NhbGxTdXBlciIsIm8iLCJfZ2V0UHJvdG90eXBlT2YiLCJfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybiIsIl9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QiLCJSZWZsZWN0IiwiY29uc3RydWN0IiwiY29uc3RydWN0b3IiLCJhcHBseSIsInNlbGYiLCJfYXNzZXJ0VGhpc0luaXRpYWxpemVkIiwiUmVmZXJlbmNlRXJyb3IiLCJCb29sZWFuIiwidmFsdWVPZiIsInNldFByb3RvdHlwZU9mIiwiZ2V0UHJvdG90eXBlT2YiLCJiaW5kIiwiX19wcm90b19fIiwiX2luaGVyaXRzIiwic3ViQ2xhc3MiLCJzdXBlckNsYXNzIiwiY3JlYXRlIiwidmFsdWUiLCJfc2V0UHJvdG90eXBlT2YiLCJwIiwiT3JpZW50YXRpb25QYWlyIiwiX0VudW1lcmF0aW9uTWFwIiwiaG9yaXpvbnRhbCIsInZlcnRpY2FsIiwiT3JpZW50YXRpb24iLCJvcmllbnRhdGlvbiIsIkhPUklaT05UQUwiLCJnZXQiLCJzZXQiLCJWRVJUSUNBTCIsIl93aXRoIiwibWFwIiwibWFwRnVuY3Rpb24iLCJmYWN0b3J5IiwiRW51bWVyYXRpb25NYXAiLCJwaGV0Q29yZSIsInJlZ2lzdGVyIiwiX2RlZmF1bHQiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsiT3JpZW50YXRpb25QYWlyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEFuIG9iamVjdCB0aGF0IGNvbnRhaW5zIGEgdmFsdWUgZm9yIGVhY2ggaXRlbSBpbiBhbiBlbnVtZXJhdGlvbi5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBFbnVtZXJhdGlvbk1hcCBmcm9tICcuL0VudW1lcmF0aW9uTWFwLmpzJztcclxuaW1wb3J0IE9yaWVudGF0aW9uIGZyb20gJy4vT3JpZW50YXRpb24uanMnO1xyXG5pbXBvcnQgcGhldENvcmUgZnJvbSAnLi9waGV0Q29yZS5qcyc7XHJcblxyXG5jbGFzcyBPcmllbnRhdGlvblBhaXI8VD4gZXh0ZW5kcyBFbnVtZXJhdGlvbk1hcDxPcmllbnRhdGlvbiwgVD4ge1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gaG9yaXpvbnRhbCAtIFZhbHVlIGZvciB0aGUgaG9yaXpvbnRhbCBvcmllbnRhdGlvblxyXG4gICAqIEBwYXJhbSB2ZXJ0aWNhbCAtIFZhbHVlIGZvciB0aGUgdmVydGljYWwgb3JpZW50YXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIGhvcml6b250YWw6IFQsIHZlcnRpY2FsOiBUICkge1xyXG4gICAgc3VwZXIoIE9yaWVudGF0aW9uLCBvcmllbnRhdGlvbiA9PiBvcmllbnRhdGlvbiA9PT0gT3JpZW50YXRpb24uSE9SSVpPTlRBTCA/IGhvcml6b250YWwgOiB2ZXJ0aWNhbCApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBob3Jpem9udGFsKCk6IFQge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0KCBPcmllbnRhdGlvbi5IT1JJWk9OVEFMICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGhvcml6b250YWwoIHZhbHVlOiBUICkge1xyXG4gICAgdGhpcy5zZXQoIE9yaWVudGF0aW9uLkhPUklaT05UQUwsIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHZlcnRpY2FsKCk6IFQge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0KCBPcmllbnRhdGlvbi5WRVJUSUNBTCApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCB2ZXJ0aWNhbCggdmFsdWU6IFQgKSB7XHJcbiAgICB0aGlzLnNldCggT3JpZW50YXRpb24uVkVSVElDQUwsIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgd2l0aCggb3JpZW50YXRpb246IE9yaWVudGF0aW9uLCB2YWx1ZTogVCApOiBPcmllbnRhdGlvblBhaXI8VD4ge1xyXG4gICAgcmV0dXJuIG5ldyBPcmllbnRhdGlvblBhaXIoXHJcbiAgICAgIG9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5IT1JJWk9OVEFMID8gdmFsdWUgOiB0aGlzLmhvcml6b250YWwsXHJcbiAgICAgIG9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5WRVJUSUNBTCA/IHZhbHVlIDogdGhpcy52ZXJ0aWNhbFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW4gb3JpZW50YXRpb24gcGFpciBiYXNlZCBvbiBhIGZhY3RvcnkgbWV0aG9kLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGZhY3RvcnkgLSBjYWxsZWQgb25jZSBmb3IgZWFjaCBvcmllbnRhdGlvbiB0byBkZXRlcm1pbmVcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIHZhbHVlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlPFQ+KCBmYWN0b3J5OiAoIG86IE9yaWVudGF0aW9uICkgPT4gVCApOiBPcmllbnRhdGlvblBhaXI8VD4ge1xyXG4gICAgcmV0dXJuIG5ldyBPcmllbnRhdGlvblBhaXIoIGZhY3RvcnkoIE9yaWVudGF0aW9uLkhPUklaT05UQUwgKSwgZmFjdG9yeSggT3JpZW50YXRpb24uVkVSVElDQUwgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIG5ldyBFbnVtZXJhdGlvbk1hcCB3aXRoIG1hcHBlZCB2YWx1ZXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbWFwRnVuY3Rpb24gLSBmdW5jdGlvbiggeyp9LCB7VEVudW1lcmF0aW9uLip9ICk6IHsqfVxyXG4gICAqIEByZXR1cm5zIFdpdGggdGhlIG1hcHBlZCB2YWx1ZXNcclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgbWFwKCBtYXBGdW5jdGlvbjogKCB2YWx1ZTogVCwgb3JpZW50YXRpb246IE9yaWVudGF0aW9uICkgPT4gVCApOiBPcmllbnRhdGlvblBhaXI8VD4ge1xyXG4gICAgcmV0dXJuIG5ldyBPcmllbnRhdGlvblBhaXIoIG1hcEZ1bmN0aW9uKCB0aGlzLmhvcml6b250YWwsIE9yaWVudGF0aW9uLkhPUklaT05UQUwgKSwgbWFwRnVuY3Rpb24oIHRoaXMudmVydGljYWwsIE9yaWVudGF0aW9uLlZFUlRJQ0FMICkgKTtcclxuICB9XHJcbn1cclxuXHJcbnBoZXRDb3JlLnJlZ2lzdGVyKCAnT3JpZW50YXRpb25QYWlyJywgT3JpZW50YXRpb25QYWlyICk7XHJcbmV4cG9ydCBkZWZhdWx0IE9yaWVudGF0aW9uUGFpcjsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFRQSxJQUFBQSxnQkFBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsWUFBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsU0FBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQXFDLFNB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