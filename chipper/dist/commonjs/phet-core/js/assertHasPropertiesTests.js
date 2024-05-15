"use strict";

var _assertHasProperties = _interopRequireDefault(require("./assertHasProperties.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } // Copyright 2020-2023, University of Colorado Boulder
/**
 * Tests for assertHasProperties
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
QUnit.module('assertHasProperties');
QUnit.test('assertHasProperties', function (assert) {
  assert.ok(true, 'one test whether or not assertions are enabled');
  if (window.assert) {
    var MyObject = /*#__PURE__*/function () {
      function MyObject() {
        _classCallCheck(this, MyObject);
      }
      return _createClass(MyObject, [{
        key: "aFunction",
        value: function aFunction() {
          // Empty
        }
      }, {
        key: "getter",
        get: function get() {
          return 'hi';
        }
      }]);
    }();
    var MyChild = /*#__PURE__*/function (_MyObject) {
      function MyChild() {
        _classCallCheck(this, MyChild);
        return _callSuper(this, MyChild, arguments);
      }
      _inherits(MyChild, _MyObject);
      return _createClass(MyChild, [{
        key: "childMethod",
        value: function childMethod() {
          // Empty
        }
      }, {
        key: "childGetter",
        get: function get() {
          return 'I am a middle child';
        }
      }]);
    }(MyObject); // Should not throw error because options are all from one set.
    (0, _assertHasProperties["default"])({
      a: true,
      b: false
    }, ['a']);
    (0, _assertHasProperties["default"])({
      a: true,
      b: false
    }, ['a', 'b']);
    (0, _assertHasProperties["default"])({
      b: undefined
    }, ['b']);
    (0, _assertHasProperties["default"])({
      b: null
    }, ['b']);
    (0, _assertHasProperties["default"])({
      get b() {
        return 5;
      }
    }, ['b']);
    (0, _assertHasProperties["default"])({
      b: function b() {/*empty*/}
    }, ['b']);
    (0, _assertHasProperties["default"])({
      set b(b) {/*empty*/}
    }, ['b']);
    (0, _assertHasProperties["default"])(new MyObject(), ['aFunction', 'getter']);
    (0, _assertHasProperties["default"])(new MyChild(), ['aFunction', 'getter', 'childMethod', 'childGetter']);

    // Simulate scenery Node style types
    var Parent = /*#__PURE__*/function () {
      function Parent() {
        _classCallCheck(this, Parent);
        _defineProperty(this, "opacityProperty", void 0);
        this.opacityProperty = {};
      }
      return _createClass(Parent, [{
        key: "getOpacity",
        value: function getOpacity() {
          return 0;
        }
      }, {
        key: "opacity",
        get: function get() {
          return 0;
        }
      }]);
    }();
    var Circle = /*#__PURE__*/function (_Parent2) {
      function Circle() {
        _classCallCheck(this, Circle);
        return _callSuper(this, Circle, arguments);
      }
      _inherits(Circle, _Parent2);
      return _createClass(Circle);
    }(Parent); // on direct prototype
    (0, _assertHasProperties["default"])(new Parent(), ['getOpacity', 'opacity', 'opacityProperty']);

    // on ancestor parent prototype
    (0, _assertHasProperties["default"])(new Circle(), ['getOpacity', 'opacity', 'opacityProperty']);

    // Should error because properties are not provided
    assert["throws"](function () {
      return (0, _assertHasProperties["default"])({
        b: false
      }, ['a']);
    });
    assert["throws"](function () {
      return (0, _assertHasProperties["default"])({}, ['a']);
    });
    assert["throws"](function () {
      return (0, _assertHasProperties["default"])({
        ab: 'something'
      }, ['a']);
    });
    assert["throws"](function () {
      return (0, _assertHasProperties["default"])({
        a: true,
        b: false
      }, ['a', 'b', 'c']);
    });
    assert["throws"](function () {
      return (0, _assertHasProperties["default"])({
        a: true,
        c: undefined
      }, ['a', 'b', 'c']);
    });
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0SGFzUHJvcGVydGllcyIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwib2JqIiwiX19lc01vZHVsZSIsIl90eXBlb2YiLCJvIiwiU3ltYm9sIiwiaXRlcmF0b3IiLCJjb25zdHJ1Y3RvciIsInByb3RvdHlwZSIsIl9kZWZpbmVQcm9wZXJ0eSIsImtleSIsInZhbHVlIiwiX3RvUHJvcGVydHlLZXkiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImVudW1lcmFibGUiLCJjb25maWd1cmFibGUiLCJ3cml0YWJsZSIsIl9jYWxsU3VwZXIiLCJ0IiwiZSIsIl9nZXRQcm90b3R5cGVPZiIsIl9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuIiwiX2lzTmF0aXZlUmVmbGVjdENvbnN0cnVjdCIsIlJlZmxlY3QiLCJjb25zdHJ1Y3QiLCJhcHBseSIsInNlbGYiLCJjYWxsIiwiVHlwZUVycm9yIiwiX2Fzc2VydFRoaXNJbml0aWFsaXplZCIsIlJlZmVyZW5jZUVycm9yIiwiQm9vbGVhbiIsInZhbHVlT2YiLCJzZXRQcm90b3R5cGVPZiIsImdldFByb3RvdHlwZU9mIiwiYmluZCIsIl9fcHJvdG9fXyIsIl9pbmhlcml0cyIsInN1YkNsYXNzIiwic3VwZXJDbGFzcyIsImNyZWF0ZSIsIl9zZXRQcm90b3R5cGVPZiIsInAiLCJfY2xhc3NDYWxsQ2hlY2siLCJpbnN0YW5jZSIsIkNvbnN0cnVjdG9yIiwiX2RlZmluZVByb3BlcnRpZXMiLCJ0YXJnZXQiLCJwcm9wcyIsImkiLCJsZW5ndGgiLCJkZXNjcmlwdG9yIiwiX2NyZWF0ZUNsYXNzIiwicHJvdG9Qcm9wcyIsInN0YXRpY1Byb3BzIiwiX3RvUHJpbWl0aXZlIiwiciIsInRvUHJpbWl0aXZlIiwiU3RyaW5nIiwiTnVtYmVyIiwiUVVuaXQiLCJtb2R1bGUiLCJ0ZXN0IiwiYXNzZXJ0Iiwib2siLCJ3aW5kb3ciLCJNeU9iamVjdCIsImFGdW5jdGlvbiIsImdldCIsIk15Q2hpbGQiLCJfTXlPYmplY3QiLCJhcmd1bWVudHMiLCJjaGlsZE1ldGhvZCIsImFzc2VydEhhc1Byb3BlcnRpZXMiLCJhIiwiYiIsInVuZGVmaW5lZCIsIlBhcmVudCIsIm9wYWNpdHlQcm9wZXJ0eSIsImdldE9wYWNpdHkiLCJDaXJjbGUiLCJfUGFyZW50MiIsImFiIiwiYyJdLCJzb3VyY2VzIjpbImFzc2VydEhhc1Byb3BlcnRpZXNUZXN0cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMC0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBUZXN0cyBmb3IgYXNzZXJ0SGFzUHJvcGVydGllc1xyXG4gKlxyXG4gKiBAYXV0aG9yIE1pY2hhZWwgS2F1em1hbm4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IGFzc2VydEhhc1Byb3BlcnRpZXMgZnJvbSAnLi9hc3NlcnRIYXNQcm9wZXJ0aWVzLmpzJztcclxuXHJcblFVbml0Lm1vZHVsZSggJ2Fzc2VydEhhc1Byb3BlcnRpZXMnICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnYXNzZXJ0SGFzUHJvcGVydGllcycsIGFzc2VydCA9PiB7XHJcbiAgYXNzZXJ0Lm9rKCB0cnVlLCAnb25lIHRlc3Qgd2hldGhlciBvciBub3QgYXNzZXJ0aW9ucyBhcmUgZW5hYmxlZCcgKTtcclxuXHJcbiAgaWYgKCB3aW5kb3cuYXNzZXJ0ICkge1xyXG5cclxuICAgIGNsYXNzIE15T2JqZWN0IHtcclxuXHJcbiAgICAgIHB1YmxpYyBhRnVuY3Rpb24oKTogdm9pZCB7XHJcbiAgICAgICAgLy8gRW1wdHlcclxuICAgICAgfVxyXG5cclxuICAgICAgcHVibGljIGdldCBnZXR0ZXIoKSB7IHJldHVybiAnaGknOyB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgTXlDaGlsZCBleHRlbmRzIE15T2JqZWN0IHtcclxuXHJcbiAgICAgIHB1YmxpYyBjaGlsZE1ldGhvZCgpOiB2b2lkIHtcclxuICAgICAgICAvLyBFbXB0eVxyXG4gICAgICB9XHJcblxyXG4gICAgICBwdWJsaWMgZ2V0IGNoaWxkR2V0dGVyKCkgeyByZXR1cm4gJ0kgYW0gYSBtaWRkbGUgY2hpbGQnOyB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2hvdWxkIG5vdCB0aHJvdyBlcnJvciBiZWNhdXNlIG9wdGlvbnMgYXJlIGFsbCBmcm9tIG9uZSBzZXQuXHJcbiAgICBhc3NlcnRIYXNQcm9wZXJ0aWVzKCB7IGE6IHRydWUsIGI6IGZhbHNlIH0sIFsgJ2EnIF0gKTtcclxuICAgIGFzc2VydEhhc1Byb3BlcnRpZXMoIHsgYTogdHJ1ZSwgYjogZmFsc2UgfSwgWyAnYScsICdiJyBdICk7XHJcbiAgICBhc3NlcnRIYXNQcm9wZXJ0aWVzKCB7IGI6IHVuZGVmaW5lZCB9LCBbICdiJyBdICk7XHJcbiAgICBhc3NlcnRIYXNQcm9wZXJ0aWVzKCB7IGI6IG51bGwgfSwgWyAnYicgXSApO1xyXG4gICAgYXNzZXJ0SGFzUHJvcGVydGllcyggeyBnZXQgYigpIHsgcmV0dXJuIDU7IH0gfSwgWyAnYicgXSApO1xyXG4gICAgYXNzZXJ0SGFzUHJvcGVydGllcyggeyBiKCkgeyAvKmVtcHR5Ki8gfSB9LCBbICdiJyBdICk7XHJcbiAgICBhc3NlcnRIYXNQcm9wZXJ0aWVzKCB7IHNldCBiKCBiOiB1bmtub3duICkgeyAvKmVtcHR5Ki8gfSB9LCBbICdiJyBdICk7XHJcbiAgICBhc3NlcnRIYXNQcm9wZXJ0aWVzKCBuZXcgTXlPYmplY3QoKSwgWyAnYUZ1bmN0aW9uJywgJ2dldHRlcicgXSApO1xyXG4gICAgYXNzZXJ0SGFzUHJvcGVydGllcyggbmV3IE15Q2hpbGQoKSwgWyAnYUZ1bmN0aW9uJywgJ2dldHRlcicsICdjaGlsZE1ldGhvZCcsICdjaGlsZEdldHRlcicgXSApO1xyXG5cclxuICAgIC8vIFNpbXVsYXRlIHNjZW5lcnkgTm9kZSBzdHlsZSB0eXBlc1xyXG4gICAgY2xhc3MgUGFyZW50IHtcclxuICAgICAgcHVibGljIG9wYWNpdHlQcm9wZXJ0eTogb2JqZWN0O1xyXG5cclxuICAgICAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMub3BhY2l0eVByb3BlcnR5ID0ge307XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHB1YmxpYyBnZXRPcGFjaXR5KCk6IG51bWJlciB7cmV0dXJuIDA7fVxyXG5cclxuICAgICAgcHVibGljIGdldCBvcGFjaXR5KCkgeyByZXR1cm4gMDt9XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgQ2lyY2xlIGV4dGVuZHMgUGFyZW50IHt9XHJcblxyXG4gICAgLy8gb24gZGlyZWN0IHByb3RvdHlwZVxyXG4gICAgYXNzZXJ0SGFzUHJvcGVydGllcyggbmV3IFBhcmVudCgpLCBbICdnZXRPcGFjaXR5JywgJ29wYWNpdHknLCAnb3BhY2l0eVByb3BlcnR5JyBdICk7XHJcblxyXG4gICAgLy8gb24gYW5jZXN0b3IgcGFyZW50IHByb3RvdHlwZVxyXG4gICAgYXNzZXJ0SGFzUHJvcGVydGllcyggbmV3IENpcmNsZSgpLCBbICdnZXRPcGFjaXR5JywgJ29wYWNpdHknLCAnb3BhY2l0eVByb3BlcnR5JyBdICk7XHJcblxyXG4gICAgLy8gU2hvdWxkIGVycm9yIGJlY2F1c2UgcHJvcGVydGllcyBhcmUgbm90IHByb3ZpZGVkXHJcbiAgICBhc3NlcnQudGhyb3dzKCAoKSA9PiBhc3NlcnRIYXNQcm9wZXJ0aWVzKCB7IGI6IGZhbHNlIH0sIFsgJ2EnIF0gKSApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gYXNzZXJ0SGFzUHJvcGVydGllcygge30sIFsgJ2EnIF0gKSApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gYXNzZXJ0SGFzUHJvcGVydGllcyggeyBhYjogJ3NvbWV0aGluZycgfSwgWyAnYScgXSApICk7XHJcbiAgICBhc3NlcnQudGhyb3dzKCAoKSA9PiBhc3NlcnRIYXNQcm9wZXJ0aWVzKCB7IGE6IHRydWUsIGI6IGZhbHNlIH0sIFsgJ2EnLCAnYicsICdjJyBdICkgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IGFzc2VydEhhc1Byb3BlcnRpZXMoIHsgYTogdHJ1ZSwgYzogdW5kZWZpbmVkIH0sIFsgJ2EnLCAnYicsICdjJyBdICkgKTtcclxuICB9XHJcbn0gKTsiXSwibWFwcGluZ3MiOiI7O0FBUUEsSUFBQUEsb0JBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUEyRCxTQUFBRCx1QkFBQUUsR0FBQSxXQUFBQSxHQUFBLElBQUFBLEdBQUEsQ0FBQUMsVUFBQSxHQUFBRCxHQUFBLGdCQUFBQSxHQUFBO0FBQUEsU0FBQUUsUUFBQUMsQ0FBQSxzQ0FBQUQsT0FBQSx3QkFBQUUsTUFBQSx1QkFBQUEsTUFBQSxDQUFBQyxRQUFBLGFBQUFGLENBQUEsa0JBQUFBLENBQUEsZ0JBQUFBLENBQUEsV0FBQUEsQ0FBQSx5QkFBQUMsTUFBQSxJQUFBRCxDQUFBLENBQUFHLFdBQUEsS0FBQUYsTUFBQSxJQUFBRCxDQUFBLEtBQUFDLE1BQUEsQ0FBQUcsU0FBQSxxQkFBQUosQ0FBQSxLQUFBRCxPQUFBLENBQUFDLENBQUE7QUFBQSxTQUFBSyxnQkFBQVIsR0FBQSxFQUFBUyxHQUFBLEVBQUFDLEtBQUEsSUFBQUQsR0FBQSxHQUFBRSxjQUFBLENBQUFGLEdBQUEsT0FBQUEsR0FBQSxJQUFBVCxHQUFBLElBQUFZLE1BQUEsQ0FBQUMsY0FBQSxDQUFBYixHQUFBLEVBQUFTLEdBQUEsSUFBQUMsS0FBQSxFQUFBQSxLQUFBLEVBQUFJLFVBQUEsUUFBQUMsWUFBQSxRQUFBQyxRQUFBLG9CQUFBaEIsR0FBQSxDQUFBUyxHQUFBLElBQUFDLEtBQUEsV0FBQVYsR0FBQTtBQUFBLFNBQUFpQixXQUFBQyxDQUFBLEVBQUFmLENBQUEsRUFBQWdCLENBQUEsV0FBQWhCLENBQUEsR0FBQWlCLGVBQUEsQ0FBQWpCLENBQUEsR0FBQWtCLDBCQUFBLENBQUFILENBQUEsRUFBQUkseUJBQUEsS0FBQUMsT0FBQSxDQUFBQyxTQUFBLENBQUFyQixDQUFBLEVBQUFnQixDQUFBLFFBQUFDLGVBQUEsQ0FBQUYsQ0FB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