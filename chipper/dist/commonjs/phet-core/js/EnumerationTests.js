"use strict";

var _Enumeration = _interopRequireDefault(require("./Enumeration.js"));
var _EnumerationValue3 = _interopRequireDefault(require("./EnumerationValue.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } // Copyright 2022-2024, University of Colorado Boulder
/**
 * Tests for Enumeration, EnumerationValue
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
QUnit.module('Enumeration');
QUnit.test('Enumeration', function (assert) {
  var _MyEnumeration;
  var MyEnumeration = /*#__PURE__*/function (_EnumerationValue) {
    function MyEnumeration() {
      _classCallCheck(this, MyEnumeration);
      return _callSuper(this, MyEnumeration, arguments);
    }
    _inherits(MyEnumeration, _EnumerationValue);
    return _createClass(MyEnumeration);
  }(_EnumerationValue3["default"]);
  _MyEnumeration = MyEnumeration;
  _defineProperty(MyEnumeration, "ITEM_1", new _MyEnumeration());
  _defineProperty(MyEnumeration, "ITEM_2", new _MyEnumeration());
  _defineProperty(MyEnumeration, "ITEM_3", new _MyEnumeration());
  _defineProperty(MyEnumeration, "enumeration", new _Enumeration["default"](_MyEnumeration));
  assert.ok(MyEnumeration.enumeration.keys.length === 3, 'keys all there');
  assert.ok(MyEnumeration.enumeration.values.length === 3, 'values all there');
  assert.ok(MyEnumeration.enumeration === MyEnumeration.ITEM_1.enumeration, 'enumeration instances are the same');
  assert.ok(MyEnumeration.enumeration === MyEnumeration.ITEM_2.enumeration, 'enumeration instances are the same 2');
  assert.ok(MyEnumeration.enumeration === MyEnumeration.ITEM_3.enumeration, 'enumeration instances are the same 3');
  window.assert && assert["throws"](function () {
    return new MyEnumeration();
  }, 'cannot create new instances after class is defined and sealed');
});
QUnit.test('Enumeration Subtyping', function (assert) {
  var _MyEnumeration2, _MySubEnumeration;
  var MyEnumeration = /*#__PURE__*/function (_EnumerationValue2) {
    function MyEnumeration() {
      _classCallCheck(this, MyEnumeration);
      return _callSuper(this, MyEnumeration, arguments);
    }
    _inherits(MyEnumeration, _EnumerationValue2);
    return _createClass(MyEnumeration);
  }(_EnumerationValue3["default"]);
  _MyEnumeration2 = MyEnumeration;
  _defineProperty(MyEnumeration, "ITEM_1", new _MyEnumeration2());
  _defineProperty(MyEnumeration, "ITEM_2", new _MyEnumeration2());
  _defineProperty(MyEnumeration, "ITEM_3", new _MyEnumeration2());
  _defineProperty(MyEnumeration, "enumeration", new _Enumeration["default"](_MyEnumeration2));
  var MySubEnumeration = /*#__PURE__*/function (_MyEnumeration3) {
    function MySubEnumeration() {
      _classCallCheck(this, MySubEnumeration);
      return _callSuper(this, MySubEnumeration, arguments);
    }
    _inherits(MySubEnumeration, _MyEnumeration3);
    return _createClass(MySubEnumeration);
  }(MyEnumeration);
  _MySubEnumeration = MySubEnumeration;
  _defineProperty(MySubEnumeration, "ITEM_4", new _MySubEnumeration());
  _defineProperty(MySubEnumeration, "enumeration", new _Enumeration["default"](_MySubEnumeration, {
    instanceType: MyEnumeration
  }));
  assert.ok(MySubEnumeration.enumeration.keys.length === 4, 'keys all there');
  assert.ok(MySubEnumeration.enumeration.values.length === 4, 'values all there');
  assert.ok(MyEnumeration.enumeration === MySubEnumeration.ITEM_1.enumeration, 'enumeration instances from parent');
  assert.ok(MyEnumeration.enumeration === MySubEnumeration.ITEM_2.enumeration, 'enumeration instances from parent 2');
  assert.ok(MyEnumeration.enumeration === MySubEnumeration.ITEM_3.enumeration, 'enumeration instances from parent 3');
  assert.ok(MySubEnumeration.enumeration !== MySubEnumeration.ITEM_1.enumeration, 'enumeration instances not from child');
  assert.ok(MySubEnumeration.enumeration !== MySubEnumeration.ITEM_2.enumeration, 'enumeration instances not from child 2');

  // @ts-expect-error INTENTIONAL - we know this doesn't exist, but still want the runtime check
  assert.ok(!MyEnumeration.ITEM_4, 'super should not have sub item');
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfRW51bWVyYXRpb24iLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9FbnVtZXJhdGlvblZhbHVlMyIsIm9iaiIsIl9fZXNNb2R1bGUiLCJfdHlwZW9mIiwibyIsIlN5bWJvbCIsIml0ZXJhdG9yIiwiY29uc3RydWN0b3IiLCJwcm90b3R5cGUiLCJfZGVmaW5lUHJvcGVydGllcyIsInRhcmdldCIsInByb3BzIiwiaSIsImxlbmd0aCIsImRlc2NyaXB0b3IiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsIl90b1Byb3BlcnR5S2V5Iiwia2V5IiwiX2NyZWF0ZUNsYXNzIiwiQ29uc3RydWN0b3IiLCJwcm90b1Byb3BzIiwic3RhdGljUHJvcHMiLCJfY2xhc3NDYWxsQ2hlY2siLCJpbnN0YW5jZSIsIlR5cGVFcnJvciIsIl9jYWxsU3VwZXIiLCJ0IiwiZSIsIl9nZXRQcm90b3R5cGVPZiIsIl9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuIiwiX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCIsIlJlZmxlY3QiLCJjb25zdHJ1Y3QiLCJhcHBseSIsInNlbGYiLCJjYWxsIiwiX2Fzc2VydFRoaXNJbml0aWFsaXplZCIsIlJlZmVyZW5jZUVycm9yIiwiQm9vbGVhbiIsInZhbHVlT2YiLCJzZXRQcm90b3R5cGVPZiIsImdldFByb3RvdHlwZU9mIiwiYmluZCIsIl9fcHJvdG9fXyIsIl9pbmhlcml0cyIsInN1YkNsYXNzIiwic3VwZXJDbGFzcyIsImNyZWF0ZSIsInZhbHVlIiwiX3NldFByb3RvdHlwZU9mIiwicCIsIl9kZWZpbmVQcm9wZXJ0eSIsIl90b1ByaW1pdGl2ZSIsInIiLCJ0b1ByaW1pdGl2ZSIsIlN0cmluZyIsIk51bWJlciIsIlFVbml0IiwibW9kdWxlIiwidGVzdCIsImFzc2VydCIsIl9NeUVudW1lcmF0aW9uIiwiTXlFbnVtZXJhdGlvbiIsIl9FbnVtZXJhdGlvblZhbHVlIiwiYXJndW1lbnRzIiwiRW51bWVyYXRpb25WYWx1ZSIsIkVudW1lcmF0aW9uIiwib2siLCJlbnVtZXJhdGlvbiIsImtleXMiLCJ2YWx1ZXMiLCJJVEVNXzEiLCJJVEVNXzIiLCJJVEVNXzMiLCJ3aW5kb3ciLCJfTXlFbnVtZXJhdGlvbjIiLCJfTXlTdWJFbnVtZXJhdGlvbiIsIl9FbnVtZXJhdGlvblZhbHVlMiIsIk15U3ViRW51bWVyYXRpb24iLCJfTXlFbnVtZXJhdGlvbjMiLCJpbnN0YW5jZVR5cGUiLCJJVEVNXzQiXSwic291cmNlcyI6WyJFbnVtZXJhdGlvblRlc3RzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIyLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFRlc3RzIGZvciBFbnVtZXJhdGlvbiwgRW51bWVyYXRpb25WYWx1ZVxyXG4gKlxyXG4gKiBAYXV0aG9yIE1pY2hhZWwgS2F1em1hbm4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IEVudW1lcmF0aW9uIGZyb20gJy4vRW51bWVyYXRpb24uanMnO1xyXG5pbXBvcnQgRW51bWVyYXRpb25WYWx1ZSBmcm9tICcuL0VudW1lcmF0aW9uVmFsdWUuanMnO1xyXG5cclxuUVVuaXQubW9kdWxlKCAnRW51bWVyYXRpb24nICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnRW51bWVyYXRpb24nLCBhc3NlcnQgPT4ge1xyXG5cclxuICBjbGFzcyBNeUVudW1lcmF0aW9uIGV4dGVuZHMgRW51bWVyYXRpb25WYWx1ZSB7XHJcbiAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IElURU1fMSA9IG5ldyBNeUVudW1lcmF0aW9uKCk7XHJcbiAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IElURU1fMiA9IG5ldyBNeUVudW1lcmF0aW9uKCk7XHJcbiAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IElURU1fMyA9IG5ldyBNeUVudW1lcmF0aW9uKCk7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyByZWFkb25seSBlbnVtZXJhdGlvbiA9IG5ldyBFbnVtZXJhdGlvbiggTXlFbnVtZXJhdGlvbiApO1xyXG4gIH1cclxuXHJcbiAgYXNzZXJ0Lm9rKCBNeUVudW1lcmF0aW9uLmVudW1lcmF0aW9uLmtleXMubGVuZ3RoID09PSAzLCAna2V5cyBhbGwgdGhlcmUnICk7XHJcbiAgYXNzZXJ0Lm9rKCBNeUVudW1lcmF0aW9uLmVudW1lcmF0aW9uLnZhbHVlcy5sZW5ndGggPT09IDMsICd2YWx1ZXMgYWxsIHRoZXJlJyApO1xyXG4gIGFzc2VydC5vayggTXlFbnVtZXJhdGlvbi5lbnVtZXJhdGlvbiA9PT0gTXlFbnVtZXJhdGlvbi5JVEVNXzEuZW51bWVyYXRpb24sICdlbnVtZXJhdGlvbiBpbnN0YW5jZXMgYXJlIHRoZSBzYW1lJyApO1xyXG4gIGFzc2VydC5vayggTXlFbnVtZXJhdGlvbi5lbnVtZXJhdGlvbiA9PT0gTXlFbnVtZXJhdGlvbi5JVEVNXzIuZW51bWVyYXRpb24sICdlbnVtZXJhdGlvbiBpbnN0YW5jZXMgYXJlIHRoZSBzYW1lIDInICk7XHJcbiAgYXNzZXJ0Lm9rKCBNeUVudW1lcmF0aW9uLmVudW1lcmF0aW9uID09PSBNeUVudW1lcmF0aW9uLklURU1fMy5lbnVtZXJhdGlvbiwgJ2VudW1lcmF0aW9uIGluc3RhbmNlcyBhcmUgdGhlIHNhbWUgMycgKTtcclxuXHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICByZXR1cm4gbmV3IE15RW51bWVyYXRpb24oKTtcclxuICB9LCAnY2Fubm90IGNyZWF0ZSBuZXcgaW5zdGFuY2VzIGFmdGVyIGNsYXNzIGlzIGRlZmluZWQgYW5kIHNlYWxlZCcgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ0VudW1lcmF0aW9uIFN1YnR5cGluZycsIGFzc2VydCA9PiB7XHJcblxyXG4gIGNsYXNzIE15RW51bWVyYXRpb24gZXh0ZW5kcyBFbnVtZXJhdGlvblZhbHVlIHtcclxuICAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgSVRFTV8xID0gbmV3IE15RW51bWVyYXRpb24oKTtcclxuICAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgSVRFTV8yID0gbmV3IE15RW51bWVyYXRpb24oKTtcclxuICAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgSVRFTV8zID0gbmV3IE15RW51bWVyYXRpb24oKTtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IGVudW1lcmF0aW9uID0gbmV3IEVudW1lcmF0aW9uKCBNeUVudW1lcmF0aW9uICk7XHJcbiAgfVxyXG5cclxuICBjbGFzcyBNeVN1YkVudW1lcmF0aW9uIGV4dGVuZHMgTXlFbnVtZXJhdGlvbiB7XHJcbiAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IElURU1fNCA9IG5ldyBNeVN1YkVudW1lcmF0aW9uKCk7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBvdmVycmlkZSByZWFkb25seSBlbnVtZXJhdGlvbiA9IG5ldyBFbnVtZXJhdGlvbiggTXlTdWJFbnVtZXJhdGlvbiwge1xyXG4gICAgICBpbnN0YW5jZVR5cGU6IE15RW51bWVyYXRpb25cclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIGFzc2VydC5vayggTXlTdWJFbnVtZXJhdGlvbi5lbnVtZXJhdGlvbi5rZXlzLmxlbmd0aCA9PT0gNCwgJ2tleXMgYWxsIHRoZXJlJyApO1xyXG4gIGFzc2VydC5vayggTXlTdWJFbnVtZXJhdGlvbi5lbnVtZXJhdGlvbi52YWx1ZXMubGVuZ3RoID09PSA0LCAndmFsdWVzIGFsbCB0aGVyZScgKTtcclxuICBhc3NlcnQub2soIE15RW51bWVyYXRpb24uZW51bWVyYXRpb24gPT09IE15U3ViRW51bWVyYXRpb24uSVRFTV8xLmVudW1lcmF0aW9uLCAnZW51bWVyYXRpb24gaW5zdGFuY2VzIGZyb20gcGFyZW50JyApO1xyXG4gIGFzc2VydC5vayggTXlFbnVtZXJhdGlvbi5lbnVtZXJhdGlvbiA9PT0gTXlTdWJFbnVtZXJhdGlvbi5JVEVNXzIuZW51bWVyYXRpb24sICdlbnVtZXJhdGlvbiBpbnN0YW5jZXMgZnJvbSBwYXJlbnQgMicgKTtcclxuICBhc3NlcnQub2soIE15RW51bWVyYXRpb24uZW51bWVyYXRpb24gPT09IE15U3ViRW51bWVyYXRpb24uSVRFTV8zLmVudW1lcmF0aW9uLCAnZW51bWVyYXRpb24gaW5zdGFuY2VzIGZyb20gcGFyZW50IDMnICk7XHJcbiAgYXNzZXJ0Lm9rKCBNeVN1YkVudW1lcmF0aW9uLmVudW1lcmF0aW9uICE9PSBNeVN1YkVudW1lcmF0aW9uLklURU1fMS5lbnVtZXJhdGlvbiwgJ2VudW1lcmF0aW9uIGluc3RhbmNlcyBub3QgZnJvbSBjaGlsZCcgKTtcclxuICBhc3NlcnQub2soIE15U3ViRW51bWVyYXRpb24uZW51bWVyYXRpb24gIT09IE15U3ViRW51bWVyYXRpb24uSVRFTV8yLmVudW1lcmF0aW9uLCAnZW51bWVyYXRpb24gaW5zdGFuY2VzIG5vdCBmcm9tIGNoaWxkIDInICk7XHJcblxyXG4gIC8vIEB0cy1leHBlY3QtZXJyb3IgSU5URU5USU9OQUwgLSB3ZSBrbm93IHRoaXMgZG9lc24ndCBleGlzdCwgYnV0IHN0aWxsIHdhbnQgdGhlIHJ1bnRpbWUgY2hlY2tcclxuICBhc3NlcnQub2soICFNeUVudW1lcmF0aW9uLklURU1fNCwgJ3N1cGVyIHNob3VsZCBub3QgaGF2ZSBzdWIgaXRlbScgKTtcclxufSApOyJdLCJtYXBwaW5ncyI6Ijs7QUFRQSxJQUFBQSxZQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxrQkFBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQXFELFNBQUFELHVCQUFBRyxHQUFBLFdBQUFBLEdBQUEsSUFBQUEsR0FBQSxDQUFBQyxVQUFBLEdBQUFELEdBQUEsZ0JBQUFBLEdBQUE7QUFBQSxTQUFBRSxRQUFBQyxDQUFBLHNDQUFBRCxPQUFBLHdCQUFBRSxNQUFBLHVCQUFBQSxNQUFBLENBQUFDLFFBQUEsYUFBQUYsQ0FBQSxrQkFB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