"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _TinyProperty = _interopRequireDefault(require("../../axon/js/TinyProperty.js"));
var _chipper = _interopRequireDefault(require("./chipper.js"));
var _getStringModule = require("./getStringModule.js");
var _arrayRemove = _interopRequireDefault(require("../../phet-core/js/arrayRemove.js"));
var _LocalizedStringProperty = _interopRequireDefault(require("./LocalizedStringProperty.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } // Copyright 2022-2024, University of Colorado Boulder
/**
 * Sets up a system of Properties to handle translation fallback and phet-io support for a single translated string.
 *
 * @author Jonathan Olson <jonathan.olson>
 */
// constants
var FALLBACK_LOCALE = 'en';

// for readability/docs

// Where "string" is a phetioID

var localeData = phet.chipper.localeData;
assert && assert(localeData);
var LocalizedString = /*#__PURE__*/function () {
  function LocalizedString(public readonly stringKey,
  // Store initial values, so we can handle state deltas
  private readonly localeToTranslationMap, tandem, metadata) {
    _classCallCheck(this, LocalizedString);
    // Public-facing IProperty<string>, used by string modules
    _defineProperty(this, "property", void 0);
    // Uses lazy creation of locales
    _defineProperty(this, "localePropertyMap", new Map());
    // Store initial values, so we can handle state deltas
    _defineProperty(this, "initialValues", {});
    this.property = new _LocalizedStringProperty["default"](this, tandem, metadata);

    // Add to a global list to support PhET-iO serialization and internal testing
    _getStringModule.localizedStrings.push(this);
  }

  /**
   * Returns an object that shows the changes of strings from their initial values. This includes whether strings are
   * marked as "overridden"
   */
  return _createClass(LocalizedString, [{
    key: "getStateDelta",
    value: function getStateDelta() {
      var _this = this;
      var result = {};
      this.usedLocales.forEach(function (locale) {
        var initialValue = _this.initialValues[locale];
        var currentValue = _this.getLocaleSpecificProperty(locale).value;
        if (currentValue !== initialValue) {
          result[locale] = currentValue;
        }
      });
      return result;
    }

    /**
     * Take a state from getStateDelta, and apply it.
     */
  }, {
    key: "setStateDelta",
    value: function setStateDelta(state) {
      var _this2 = this;
      // Create potential new locales (since locale-specific Properties are lazily created as needed
      Object.keys(state).forEach(function (locale) {
        return _this2.getLocaleSpecificProperty(locale);
      });
      this.usedLocales.forEach(function (locale) {
        var localeSpecificProperty = _this2.getLocaleSpecificProperty(locale);
        var initialValue = _this2.initialValues[locale];
        assert && assert(initialValue !== undefined);
        var stateValue = state[locale] !== undefined ? state[locale] : null;
        localeSpecificProperty.value = stateValue !== null && stateValue !== void 0 ? stateValue : initialValue;
      });
    }
  }, {
    key: "usedLocales",
    get: function get() {
      return _toConsumableArray(this.localePropertyMap.keys());
    }

    /**
     * Returns the locale-specific Property for any locale (lazily creating it if necessary)
     */
  }, {
    key: "getLocaleSpecificProperty",
    value: function getLocaleSpecificProperty(locale) {
      // Lazy creation
      if (!this.localePropertyMap.has(locale)) {
        // Locales in order of fallback
        var orderedLocales = [locale].concat(_toConsumableArray(localeData[locale].fallbackLocales || []), [FALLBACK_LOCALE]);

        // Find the first-defined value
        var initialValue = null;
        var _iterator = _createForOfIteratorHelper(orderedLocales),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var _locale = _step.value;
            if (this.localeToTranslationMap[_locale] !== undefined) {
              initialValue = this.localeToTranslationMap[_locale];
              break;
            }
          }
          // Should be guaranteed because of `en` as a fallback
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        assert && assert(initialValue !== undefined, 'no initial value found for', locale);
        this.initialValues[locale] = initialValue;
        this.localePropertyMap.set(locale, new _TinyProperty["default"](initialValue));
      }
      return this.localePropertyMap.get(locale);
    }
  }, {
    key: "dispose",
    value: function dispose() {
      this.property.dispose();
      (0, _arrayRemove["default"])(_getStringModule.localizedStrings, this);
    }

    /**
     * Reset to the initial value for the specified locale, used for testing.
     */
  }, {
    key: "restoreInitialValue",
    value: function restoreInitialValue(locale) {
      assert && assert(typeof this.initialValues[locale] === 'string', 'initial value expected for', locale);
      this.property.value = this.initialValues[locale];
    }
  }]);
}();
_chipper["default"].register('LocalizedString', LocalizedString);
var _default = exports["default"] = LocalizedString;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfVGlueVByb3BlcnR5IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfY2hpcHBlciIsIl9nZXRTdHJpbmdNb2R1bGUiLCJfYXJyYXlSZW1vdmUiLCJfTG9jYWxpemVkU3RyaW5nUHJvcGVydHkiLCJvYmoiLCJfX2VzTW9kdWxlIiwiX3R5cGVvZiIsIm8iLCJTeW1ib2wiLCJpdGVyYXRvciIsImNvbnN0cnVjdG9yIiwicHJvdG90eXBlIiwiX2NyZWF0ZUZvck9mSXRlcmF0b3JIZWxwZXIiLCJhbGxvd0FycmF5TGlrZSIsIml0IiwiQXJyYXkiLCJpc0FycmF5IiwiX3Vuc3VwcG9ydGVkSXRlcmFibGVUb0FycmF5IiwibGVuZ3RoIiwiaSIsIkYiLCJzIiwibiIsImRvbmUiLCJ2YWx1ZSIsImUiLCJfZSIsImYiLCJUeXBlRXJyb3IiLCJub3JtYWxDb21wbGV0aW9uIiwiZGlkRXJyIiwiZXJyIiwiY2FsbCIsInN0ZXAiLCJuZXh0IiwiX2UyIiwiX3RvQ29uc3VtYWJsZUFycmF5IiwiYXJyIiwiX2FycmF5V2l0aG91dEhvbGVzIiwiX2l0ZXJhYmxlVG9BcnJheSIsIl9ub25JdGVyYWJsZVNwcmVhZCIsIm1pbkxlbiIsIl9hcnJheUxpa2VUb0FycmF5IiwiT2JqZWN0IiwidG9TdHJpbmciLCJzbGljZSIsIm5hbWUiLCJmcm9tIiwidGVzdCIsIml0ZXIiLCJsZW4iLCJhcnIyIiwiX2NsYXNzQ2FsbENoZWNrIiwiaW5zdGFuY2UiLCJDb25zdHJ1Y3RvciIsIl9kZWZpbmVQcm9wZXJ0aWVzIiwidGFyZ2V0IiwicHJvcHMiLCJkZXNjcmlwdG9yIiwiZW51bWVyYWJsZSIsImNvbmZpZ3VyYWJsZSIsIndyaXRhYmxlIiwiZGVmaW5lUHJvcGVydHkiLCJfdG9Qcm9wZXJ0eUtleSIsImtleSIsIl9jcmVhdGVDbGFzcyIsInByb3RvUHJvcHMiLCJzdGF0aWNQcm9wcyIsIl9kZWZpbmVQcm9wZXJ0eSIsInQiLCJfdG9QcmltaXRpdmUiLCJyIiwidG9QcmltaXRpdmUiLCJTdHJpbmciLCJOdW1iZXIiLCJGQUxMQkFDS19MT0NBTEUiLCJsb2NhbGVEYXRhIiwicGhldCIsImNoaXBwZXIiLCJhc3NlcnQiLCJMb2NhbGl6ZWRTdHJpbmciLCJzdHJpbmdLZXkiLCJsb2NhbGVUb1RyYW5zbGF0aW9uTWFwIiwidGFuZGVtIiwibWV0YWRhdGEiLCJNYXAiLCJwcm9wZXJ0eSIsIkxvY2FsaXplZFN0cmluZ1Byb3BlcnR5IiwibG9jYWxpemVkU3RyaW5ncyIsInB1c2giLCJnZXRTdGF0ZURlbHRhIiwiX3RoaXMiLCJyZXN1bHQiLCJ1c2VkTG9jYWxlcyIsImZvckVhY2giLCJsb2NhbGUiLCJpbml0aWFsVmFsdWUiLCJpbml0aWFsVmFsdWVzIiwiY3VycmVudFZhbHVlIiwiZ2V0TG9jYWxlU3BlY2lmaWNQcm9wZXJ0eSIsInNldFN0YXRlRGVsdGEiLCJzdGF0ZSIsIl90aGlzMiIsImtleXMiLCJsb2NhbGVTcGVjaWZpY1Byb3BlcnR5IiwidW5kZWZpbmVkIiwic3RhdGVWYWx1ZSIsImdldCIsImxvY2FsZVByb3BlcnR5TWFwIiwiaGFzIiwib3JkZXJlZExvY2FsZXMiLCJjb25jYXQiLCJmYWxsYmFja0xvY2FsZXMiLCJfaXRlcmF0b3IiLCJfc3RlcCIsInNldCIsIlRpbnlQcm9wZXJ0eSIsImRpc3Bvc2UiLCJhcnJheVJlbW92ZSIsInJlc3RvcmVJbml0aWFsVmFsdWUiLCJyZWdpc3RlciIsIl9kZWZhdWx0IiwiZXhwb3J0cyJdLCJzb3VyY2VzIjpbIkxvY2FsaXplZFN0cmluZy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBTZXRzIHVwIGEgc3lzdGVtIG9mIFByb3BlcnRpZXMgdG8gaGFuZGxlIHRyYW5zbGF0aW9uIGZhbGxiYWNrIGFuZCBwaGV0LWlvIHN1cHBvcnQgZm9yIGEgc2luZ2xlIHRyYW5zbGF0ZWQgc3RyaW5nLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbj5cclxuICovXHJcblxyXG5pbXBvcnQgVGlueVByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvVGlueVByb3BlcnR5LmpzJztcclxuaW1wb3J0IHsgTG9jYWxlIH0gZnJvbSAnLi4vLi4vam9pc3QvanMvaTE4bi9sb2NhbGVQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcbmltcG9ydCBjaGlwcGVyIGZyb20gJy4vY2hpcHBlci5qcyc7XHJcbmltcG9ydCBUUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9UUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgeyBsb2NhbGl6ZWRTdHJpbmdzIH0gZnJvbSAnLi9nZXRTdHJpbmdNb2R1bGUuanMnO1xyXG5pbXBvcnQgYXJyYXlSZW1vdmUgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL2FycmF5UmVtb3ZlLmpzJztcclxuaW1wb3J0IHsgUGhldGlvSUQgfSBmcm9tICcuLi8uLi90YW5kZW0vanMvVGFuZGVtQ29uc3RhbnRzLmpzJztcclxuaW1wb3J0IExvY2FsaXplZFN0cmluZ1Byb3BlcnR5IGZyb20gJy4vTG9jYWxpemVkU3RyaW5nUHJvcGVydHkuanMnO1xyXG5cclxuLy8gY29uc3RhbnRzXHJcbmNvbnN0IEZBTExCQUNLX0xPQ0FMRSA9ICdlbic7XHJcblxyXG4vLyBmb3IgcmVhZGFiaWxpdHkvZG9jc1xyXG50eXBlIFRyYW5zbGF0aW9uU3RyaW5nID0gc3RyaW5nO1xyXG5leHBvcnQgdHlwZSBMb2NhbGl6ZWRTdHJpbmdTdGF0ZURlbHRhID0gUGFydGlhbDxSZWNvcmQ8TG9jYWxlLCBUcmFuc2xhdGlvblN0cmluZz4+O1xyXG5cclxuLy8gV2hlcmUgXCJzdHJpbmdcIiBpcyBhIHBoZXRpb0lEXHJcbmV4cG9ydCB0eXBlIFN0cmluZ3NTdGF0ZVN0YXRlT2JqZWN0ID0geyBkYXRhOiBSZWNvcmQ8UGhldGlvSUQsIExvY2FsaXplZFN0cmluZ1N0YXRlRGVsdGE+IH07XHJcblxyXG5jb25zdCBsb2NhbGVEYXRhID0gcGhldC5jaGlwcGVyLmxvY2FsZURhdGE7XHJcbmFzc2VydCAmJiBhc3NlcnQoIGxvY2FsZURhdGEgKTtcclxuXHJcbmNsYXNzIExvY2FsaXplZFN0cmluZyB7XHJcblxyXG4gIC8vIFB1YmxpYy1mYWNpbmcgSVByb3BlcnR5PHN0cmluZz4sIHVzZWQgYnkgc3RyaW5nIG1vZHVsZXNcclxuICBwdWJsaWMgcmVhZG9ubHkgcHJvcGVydHk6IExvY2FsaXplZFN0cmluZ1Byb3BlcnR5O1xyXG5cclxuICAvLyBVc2VzIGxhenkgY3JlYXRpb24gb2YgbG9jYWxlc1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgbG9jYWxlUHJvcGVydHlNYXAgPSBuZXcgTWFwPExvY2FsZSwgVGlueVByb3BlcnR5PFRyYW5zbGF0aW9uU3RyaW5nPj4oKTtcclxuXHJcbiAgLy8gU3RvcmUgaW5pdGlhbCB2YWx1ZXMsIHNvIHdlIGNhbiBoYW5kbGUgc3RhdGUgZGVsdGFzXHJcbiAgcHJpdmF0ZSByZWFkb25seSBpbml0aWFsVmFsdWVzOiBMb2NhbGl6ZWRTdHJpbmdTdGF0ZURlbHRhID0ge307XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuICAgIHB1YmxpYyByZWFkb25seSBzdHJpbmdLZXk6IHN0cmluZyxcclxuICAgIC8vIFN0b3JlIGluaXRpYWwgdmFsdWVzLCBzbyB3ZSBjYW4gaGFuZGxlIHN0YXRlIGRlbHRhc1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBsb2NhbGVUb1RyYW5zbGF0aW9uTWFwOiBMb2NhbGl6ZWRTdHJpbmdTdGF0ZURlbHRhLFxyXG4gICAgdGFuZGVtOiBUYW5kZW0sXHJcbiAgICBtZXRhZGF0YT86IFJlY29yZDxzdHJpbmcsIHVua25vd24+XHJcbiAgKSB7XHJcbiAgICB0aGlzLnByb3BlcnR5ID0gbmV3IExvY2FsaXplZFN0cmluZ1Byb3BlcnR5KCB0aGlzLCB0YW5kZW0sIG1ldGFkYXRhICk7XHJcblxyXG4gICAgLy8gQWRkIHRvIGEgZ2xvYmFsIGxpc3QgdG8gc3VwcG9ydCBQaEVULWlPIHNlcmlhbGl6YXRpb24gYW5kIGludGVybmFsIHRlc3RpbmdcclxuICAgIGxvY2FsaXplZFN0cmluZ3MucHVzaCggdGhpcyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBvYmplY3QgdGhhdCBzaG93cyB0aGUgY2hhbmdlcyBvZiBzdHJpbmdzIGZyb20gdGhlaXIgaW5pdGlhbCB2YWx1ZXMuIFRoaXMgaW5jbHVkZXMgd2hldGhlciBzdHJpbmdzIGFyZVxyXG4gICAqIG1hcmtlZCBhcyBcIm92ZXJyaWRkZW5cIlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTdGF0ZURlbHRhKCk6IExvY2FsaXplZFN0cmluZ1N0YXRlRGVsdGEge1xyXG4gICAgY29uc3QgcmVzdWx0OiBMb2NhbGl6ZWRTdHJpbmdTdGF0ZURlbHRhID0ge307XHJcblxyXG4gICAgdGhpcy51c2VkTG9jYWxlcy5mb3JFYWNoKCBsb2NhbGUgPT4ge1xyXG4gICAgICBjb25zdCBpbml0aWFsVmFsdWU6IHN0cmluZyA9IHRoaXMuaW5pdGlhbFZhbHVlc1sgbG9jYWxlIF0hO1xyXG4gICAgICBjb25zdCBjdXJyZW50VmFsdWUgPSB0aGlzLmdldExvY2FsZVNwZWNpZmljUHJvcGVydHkoIGxvY2FsZSApLnZhbHVlO1xyXG5cclxuICAgICAgaWYgKCBjdXJyZW50VmFsdWUgIT09IGluaXRpYWxWYWx1ZSApIHtcclxuICAgICAgICByZXN1bHRbIGxvY2FsZSBdID0gY3VycmVudFZhbHVlO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRha2UgYSBzdGF0ZSBmcm9tIGdldFN0YXRlRGVsdGEsIGFuZCBhcHBseSBpdC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0U3RhdGVEZWx0YSggc3RhdGU6IExvY2FsaXplZFN0cmluZ1N0YXRlRGVsdGEgKTogdm9pZCB7XHJcblxyXG4gICAgLy8gQ3JlYXRlIHBvdGVudGlhbCBuZXcgbG9jYWxlcyAoc2luY2UgbG9jYWxlLXNwZWNpZmljIFByb3BlcnRpZXMgYXJlIGxhemlseSBjcmVhdGVkIGFzIG5lZWRlZFxyXG4gICAgT2JqZWN0LmtleXMoIHN0YXRlICkuZm9yRWFjaCggbG9jYWxlID0+IHRoaXMuZ2V0TG9jYWxlU3BlY2lmaWNQcm9wZXJ0eSggbG9jYWxlIGFzIExvY2FsZSApICk7XHJcblxyXG4gICAgdGhpcy51c2VkTG9jYWxlcy5mb3JFYWNoKCBsb2NhbGUgPT4ge1xyXG4gICAgICBjb25zdCBsb2NhbGVTcGVjaWZpY1Byb3BlcnR5ID0gdGhpcy5nZXRMb2NhbGVTcGVjaWZpY1Byb3BlcnR5KCBsb2NhbGUgKTtcclxuICAgICAgY29uc3QgaW5pdGlhbFZhbHVlOiBzdHJpbmcgPSB0aGlzLmluaXRpYWxWYWx1ZXNbIGxvY2FsZSBdITtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggaW5pdGlhbFZhbHVlICE9PSB1bmRlZmluZWQgKTtcclxuXHJcbiAgICAgIGNvbnN0IHN0YXRlVmFsdWU6IHN0cmluZyB8IG51bGwgPSBzdGF0ZVsgbG9jYWxlIF0gIT09IHVuZGVmaW5lZCA/IHN0YXRlWyBsb2NhbGUgXSEgOiBudWxsO1xyXG5cclxuICAgICAgbG9jYWxlU3BlY2lmaWNQcm9wZXJ0eS52YWx1ZSA9IHN0YXRlVmFsdWUgPz8gaW5pdGlhbFZhbHVlO1xyXG4gICAgfSApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBnZXQgdXNlZExvY2FsZXMoKTogTG9jYWxlW10ge1xyXG4gICAgcmV0dXJuIFsgLi4udGhpcy5sb2NhbGVQcm9wZXJ0eU1hcC5rZXlzKCkgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGxvY2FsZS1zcGVjaWZpYyBQcm9wZXJ0eSBmb3IgYW55IGxvY2FsZSAobGF6aWx5IGNyZWF0aW5nIGl0IGlmIG5lY2Vzc2FyeSlcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TG9jYWxlU3BlY2lmaWNQcm9wZXJ0eSggbG9jYWxlOiBMb2NhbGUgKTogVFByb3BlcnR5PHN0cmluZz4ge1xyXG4gICAgLy8gTGF6eSBjcmVhdGlvblxyXG4gICAgaWYgKCAhdGhpcy5sb2NhbGVQcm9wZXJ0eU1hcC5oYXMoIGxvY2FsZSApICkge1xyXG4gICAgICAvLyBMb2NhbGVzIGluIG9yZGVyIG9mIGZhbGxiYWNrXHJcbiAgICAgIGNvbnN0IG9yZGVyZWRMb2NhbGVzOiBMb2NhbGVbXSA9IFtcclxuICAgICAgICBsb2NhbGUsXHJcbiAgICAgICAgLi4uKCBsb2NhbGVEYXRhWyBsb2NhbGUgXS5mYWxsYmFja0xvY2FsZXMgfHwgW10gKSxcclxuICAgICAgICBGQUxMQkFDS19MT0NBTEVcclxuICAgICAgXTtcclxuXHJcbiAgICAgIC8vIEZpbmQgdGhlIGZpcnN0LWRlZmluZWQgdmFsdWVcclxuICAgICAgbGV0IGluaXRpYWxWYWx1ZTogc3RyaW5nIHwgbnVsbCA9IG51bGw7XHJcbiAgICAgIGZvciAoIGNvbnN0IGxvY2FsZSBvZiBvcmRlcmVkTG9jYWxlcyApIHtcclxuICAgICAgICBpZiAoIHRoaXMubG9jYWxlVG9UcmFuc2xhdGlvbk1hcFsgbG9jYWxlIF0gIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgIGluaXRpYWxWYWx1ZSA9IHRoaXMubG9jYWxlVG9UcmFuc2xhdGlvbk1hcFsgbG9jYWxlIF0hO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIC8vIFNob3VsZCBiZSBndWFyYW50ZWVkIGJlY2F1c2Ugb2YgYGVuYCBhcyBhIGZhbGxiYWNrXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGluaXRpYWxWYWx1ZSAhPT0gdW5kZWZpbmVkLCAnbm8gaW5pdGlhbCB2YWx1ZSBmb3VuZCBmb3InLCBsb2NhbGUgKTtcclxuXHJcbiAgICAgIHRoaXMuaW5pdGlhbFZhbHVlc1sgbG9jYWxlIF0gPSBpbml0aWFsVmFsdWUhO1xyXG4gICAgICB0aGlzLmxvY2FsZVByb3BlcnR5TWFwLnNldCggbG9jYWxlLCBuZXcgVGlueVByb3BlcnR5KCBpbml0aWFsVmFsdWUhICkgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcy5sb2NhbGVQcm9wZXJ0eU1hcC5nZXQoIGxvY2FsZSApITtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5wcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICBhcnJheVJlbW92ZSggbG9jYWxpemVkU3RyaW5ncywgdGhpcyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzZXQgdG8gdGhlIGluaXRpYWwgdmFsdWUgZm9yIHRoZSBzcGVjaWZpZWQgbG9jYWxlLCB1c2VkIGZvciB0ZXN0aW5nLlxyXG4gICAqL1xyXG4gIHB1YmxpYyByZXN0b3JlSW5pdGlhbFZhbHVlKCBsb2NhbGU6IExvY2FsZSApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiB0aGlzLmluaXRpYWxWYWx1ZXNbIGxvY2FsZSBdID09PSAnc3RyaW5nJywgJ2luaXRpYWwgdmFsdWUgZXhwZWN0ZWQgZm9yJywgbG9jYWxlICk7XHJcbiAgICB0aGlzLnByb3BlcnR5LnZhbHVlID0gdGhpcy5pbml0aWFsVmFsdWVzWyBsb2NhbGUgXSE7XHJcbiAgfVxyXG59XHJcblxyXG5jaGlwcGVyLnJlZ2lzdGVyKCAnTG9jYWxpemVkU3RyaW5nJywgTG9jYWxpemVkU3RyaW5nICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBMb2NhbGl6ZWRTdHJpbmc7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFRQSxJQUFBQSxhQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFHQSxJQUFBQyxRQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFFQSxJQUFBRSxnQkFBQSxHQUFBRixPQUFBO0FBQ0EsSUFBQUcsWUFBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBRUEsSUFBQUksd0JB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