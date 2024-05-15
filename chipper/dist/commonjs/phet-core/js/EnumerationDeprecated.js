"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _deprecationWarning = _interopRequireDefault(require("./deprecationWarning.js"));
var _merge = _interopRequireDefault(require("./merge.js"));
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } // Copyright 2018-2022, University of Colorado Boulder
/**
 * Creates a simple enumeration, with most of the boilerplate.
 *
 * An EnumerationDeprecated can be created like this:
 *
 *   const CardinalDirection = EnumerationDeprecated.byKeys( [ 'NORTH', 'SOUTH', 'EAST', 'WEST' ] );
 *
 * OR using rich values like so:
 *
 *   const CardinalDirection = EnumerationDeprecated.byMap( {NORTH: northObject, SOUTH: southObject, EAST: eastObject, WEST: westObject} );
 *
 * and values are referenced like this:
 *
 *   CardinalDirection.NORTH;
 *   CardinalDirection.SOUTH;
 *   CardinalDirection.EAST;
 *   CardinalDirection.WEST;
 *
 *   CardinalDirection.VALUES;
 *   // returns [ CardinalDirection.NORTH, CardinalDirection.SOUTH, CardinalDirection.EAST, CardinalDirection.WEST ]
 *
 * And support for checking whether any value is a value of the enumeration:
 *
 *   CardinalDirection.includes( CardinalDirection.NORTH ); // true
 *   CardinalDirection.includes( CardinalDirection.SOUTHWEST ); // false
 *   CardinalDirection.includes( 'NORTH' ); // false, values are not strings
 *
 * Conventions for using EnumerationDeprecated, from https://github.com/phetsims/phet-core/issues/53:
 *
 * (1) Enumerations are named like classes/types. Nothing in the name needs to identify that they are Enumerations.
 *     See the example above: CardinalDirection, not CardinalDirectionEnum or CardinalDirectionEnumeration.
 *
 * (2) EnumerationDeprecated values are named like constants, using uppercase. See the example above.
 *
 * (3) If an EnumerationDeprecated is closely related to some class, then make it a static field of that class. If an
 *     EnumerationDeprecated is specific to a Property, then the EnumerationDeprecated should likely be owned by the class that
 *     owns that Property.
 *
 * (4) If an EnumerationDeprecated is not closely related to some class, then put the EnumerationDeprecated in its own .js file.
 *     Do not combine multiple Enumerations into one file.
 *
 * (5) If a Property takes an EnumerationDeprecated value, its validation typically looks like this:
 *
 *     const cardinalDirectionProperty = new Property( CardinalDirection.NORTH, {
 *       validValues: CardinalDirection.VALUES
 *     }
 *
 * (6) Values of the EnumerationDeprecated are considered instances of the EnumerationDeprecated in documentation. For example, a method
 *     that that takes an EnumerationDeprecated value as an argument would be documented like this:
 *
 *     // @param {Scene} mode - value from Scene EnumerationDeprecated
 *     setSceneMode( mode ) {
 *       assert && assert( Scene.includes( mode ) );
 *       //...
 *     }
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/**
 * @deprecated
 */
var EnumerationDeprecated = /*#__PURE__*/function () {
  /**
   * @param {Object} config - must provide keys such as {keys:['RED','BLUE]}
   *                          - or map such as {map:{RED: myRedValue, BLUE: myBlueValue}}
   *
   * @private - clients should use EnumerationDeprecated.byKeys or EnumerationDeprecated.byMap
   */
  function EnumerationDeprecated(config) {
    var _this = this;
    _classCallCheck(this, EnumerationDeprecated);
    (0, _deprecationWarning["default"])('EnumerationDeprecated should be exchanged for classes that extend EnumerationValue, see WilderEnumerationPatterns for examples.');
    assert && assert(config, 'config must be provided');
    var keysProvided = !!config.keys;
    var mapProvided = !!config.map;
    assert && assert(keysProvided !== mapProvided, 'must provide one or the other but not both of keys/map');
    var keys = config.keys || Object.keys(config.map);
    var map = config.map || {};
    config = (0, _merge["default"])({
      // {string|null} Will be appended to the EnumerationIO documentation, if provided
      phetioDocumentation: null,
      // {function(EnumerationDeprecated):|null} If provided, it will be called as beforeFreeze( enumeration ) just before the
      // enumeration is frozen. Since it's not possible to modify the enumeration after
      // it is frozen (e.g. adding convenience functions), and there is no reference to
      // the enumeration object beforehand, this allows defining custom values/methods
      // on the enumeration object itself.
      beforeFreeze: null
    }, config);
    assert && assert(Array.isArray(keys), 'Values should be an array');
    assert && assert(_.uniq(keys).length === keys.length, 'There should be no duplicated values provided');
    assert && keys.forEach(function (value) {
      return assert(typeof value === 'string', 'Each value should be a string');
    });
    assert && keys.forEach(function (value) {
      return assert(/^[A-Z][A-Z0-9_]*$/g.test(value), 'EnumerationDeprecated values should be uppercase alphanumeric with underscores and begin with a letter');
    });
    assert && assert(!_.includes(keys, 'VALUES'), 'This is the name of a built-in provided value, so it cannot be included as an enumeration value');
    assert && assert(!_.includes(keys, 'KEYS'), 'This is the name of a built-in provided value, so it cannot be included as an enumeration value');
    assert && assert(!_.includes(keys, 'includes'), 'This is the name of a built-in provided value, so it cannot be included as an enumeration value');

    // @public (phet-io) - provides additional documentation for PhET-iO which can be viewed in studio
    // Note this uses the same term as used by PhetioObject, but via a different channel.
    this.phetioDocumentation = config.phetioDocumentation;

    // @public {string[]} (read-only) - the string keys of the enumeration
    this.KEYS = keys;

    // @public {Object[]} (read-only) - the object values of the enumeration
    this.VALUES = [];
    keys.forEach(function (key) {
      var value = map[key] || {};

      // Set attributes of the enumeration value
      assert && assert(value.name === undefined, '"rich" enumeration values cannot provide their own name attribute');
      assert && assert(value.toString === Object.prototype.toString, '"rich" enumeration values cannot provide their own toString');

      // @public {string} (read-only) - PhET-iO public API relies on this mapping, do not change it lightly
      value.name = key;

      // @public {function():string} (read-only)
      value.toString = function () {
        return key;
      };

      // Assign to the enumeration
      _this[key] = value;
      _this.VALUES.push(value);
    });
    config.beforeFreeze && config.beforeFreeze(this);
    assert && Object.freeze(this);
    assert && Object.freeze(this.VALUES);
    assert && Object.freeze(this.KEYS);
    assert && keys.forEach(function (key) {
      return assert && Object.freeze(map[key]);
    });
  }

  /**
   * Based solely on the keys in EnumerationDeprecated.
   * @public
   *
   * @returns {String}
   */
  return _createClass(EnumerationDeprecated, [{
    key: "toString",
    value: function toString() {
      return this.KEYS.join(', ');
    }

    /**
     * Checks whether the given value is a value of this enumeration. Should generally be used for assertions
     * @public
     *
     * @param {Object} value
     * @returns {boolean}
     */
  }, {
    key: "includes",
    value: function includes(value) {
      return _.includes(this.VALUES, value);
    }

    /**
     * To support consistent API with Enumeration.
     * @public
     * @param {string} key
     * @returns {*}
     */
  }, {
    key: "getValue",
    value: function getValue(key) {
      return this[key];
    }

    /**
     * To support consistent API with Enumeration.
     * @public
     * @param {Object} enumerationValue
     * @returns {string}
     */
  }, {
    key: "getKey",
    value: function getKey(enumerationValue) {
      return enumerationValue.name;
    }

    /**
     * To support consistent API with Enumeration.
     * @public
     * @returns {Object[]}
     */
  }, {
    key: "values",
    get: function get() {
      return this.VALUES;
    }

    /**
     * To support consistent API with Enumeration.
     * @public
     * @returns {string[]}
     */
  }, {
    key: "keys",
    get: function get() {
      return this.KEYS;
    }

    /**
     * To support consistent API with Enumeration.
     * @public
     * @returns {EnumerationDeprecated}
     */
  }, {
    key: "enumeration",
    get: function get() {
      return this;
    }

    /**
     * Creates an enumeration based on the provided string array
     * @param {string[]} keys - such as ['RED','BLUE']
     * @param {Object} [options]
     * @returns {EnumerationDeprecated}
     * @public
     */
  }], [{
    key: "byKeys",
    value: function byKeys(keys, options) {
      assert && assert(Array.isArray(keys), 'keys must be an array');
      assert && assert(!options || options.keys === undefined);
      return new EnumerationDeprecated((0, _merge["default"])({
        keys: keys
      }, options));
    }

    /**
     * Creates a "rich" enumeration based on the provided map
     * @param {Object} map - such as {RED: myRedValue, BLUE: myBlueValue}
     * @param {Object} [options]
     * @returns {EnumerationDeprecated}
     * @public
     */
  }, {
    key: "byMap",
    value: function byMap(map, options) {
      assert && assert(!options || options.map === undefined);
      if (assert) {
        var values = _.values(map);
        assert && assert(values.length >= 1, 'must have at least 2 entries in an enumeration');
        assert && assert(_.every(values, function (value) {
          return value.constructor === values[0].constructor;
        }), 'Values must have same constructor');
      }
      return new EnumerationDeprecated((0, _merge["default"])({
        map: map
      }, options));
    }
  }]);
}();
_phetCore["default"].register('EnumerationDeprecated', EnumerationDeprecated);
var _default = exports["default"] = EnumerationDeprecated;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZGVwcmVjYXRpb25XYXJuaW5nIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfbWVyZ2UiLCJfcGhldENvcmUiLCJvYmoiLCJfX2VzTW9kdWxlIiwiX3R5cGVvZiIsIm8iLCJTeW1ib2wiLCJpdGVyYXRvciIsImNvbnN0cnVjdG9yIiwicHJvdG90eXBlIiwiX2NsYXNzQ2FsbENoZWNrIiwiaW5zdGFuY2UiLCJDb25zdHJ1Y3RvciIsIlR5cGVFcnJvciIsIl9kZWZpbmVQcm9wZXJ0aWVzIiwidGFyZ2V0IiwicHJvcHMiLCJpIiwibGVuZ3RoIiwiZGVzY3JpcHRvciIsImVudW1lcmFibGUiLCJjb25maWd1cmFibGUiLCJ3cml0YWJsZSIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiX3RvUHJvcGVydHlLZXkiLCJrZXkiLCJfY3JlYXRlQ2xhc3MiLCJwcm90b1Byb3BzIiwic3RhdGljUHJvcHMiLCJ0IiwiX3RvUHJpbWl0aXZlIiwiciIsImUiLCJ0b1ByaW1pdGl2ZSIsImNhbGwiLCJTdHJpbmciLCJOdW1iZXIiLCJFbnVtZXJhdGlvbkRlcHJlY2F0ZWQiLCJjb25maWciLCJfdGhpcyIsImRlcHJlY2F0aW9uV2FybmluZyIsImFzc2VydCIsImtleXNQcm92aWRlZCIsImtleXMiLCJtYXBQcm92aWRlZCIsIm1hcCIsIm1lcmdlIiwicGhldGlvRG9jdW1lbnRhdGlvbiIsImJlZm9yZUZyZWV6ZSIsIkFycmF5IiwiaXNBcnJheSIsIl8iLCJ1bmlxIiwiZm9yRWFjaCIsInZhbHVlIiwidGVzdCIsImluY2x1ZGVzIiwiS0VZUyIsIlZBTFVFUyIsIm5hbWUiLCJ1bmRlZmluZWQiLCJ0b1N0cmluZyIsInB1c2giLCJmcmVlemUiLCJqb2luIiwiZ2V0VmFsdWUiLCJnZXRLZXkiLCJlbnVtZXJhdGlvblZhbHVlIiwiZ2V0IiwiYnlLZXlzIiwib3B0aW9ucyIsImJ5TWFwIiwidmFsdWVzIiwiZXZlcnkiLCJwaGV0Q29yZSIsInJlZ2lzdGVyIiwiX2RlZmF1bHQiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsiRW51bWVyYXRpb25EZXByZWNhdGVkLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBzaW1wbGUgZW51bWVyYXRpb24sIHdpdGggbW9zdCBvZiB0aGUgYm9pbGVycGxhdGUuXHJcbiAqXHJcbiAqIEFuIEVudW1lcmF0aW9uRGVwcmVjYXRlZCBjYW4gYmUgY3JlYXRlZCBsaWtlIHRoaXM6XHJcbiAqXHJcbiAqICAgY29uc3QgQ2FyZGluYWxEaXJlY3Rpb24gPSBFbnVtZXJhdGlvbkRlcHJlY2F0ZWQuYnlLZXlzKCBbICdOT1JUSCcsICdTT1VUSCcsICdFQVNUJywgJ1dFU1QnIF0gKTtcclxuICpcclxuICogT1IgdXNpbmcgcmljaCB2YWx1ZXMgbGlrZSBzbzpcclxuICpcclxuICogICBjb25zdCBDYXJkaW5hbERpcmVjdGlvbiA9IEVudW1lcmF0aW9uRGVwcmVjYXRlZC5ieU1hcCgge05PUlRIOiBub3J0aE9iamVjdCwgU09VVEg6IHNvdXRoT2JqZWN0LCBFQVNUOiBlYXN0T2JqZWN0LCBXRVNUOiB3ZXN0T2JqZWN0fSApO1xyXG4gKlxyXG4gKiBhbmQgdmFsdWVzIGFyZSByZWZlcmVuY2VkIGxpa2UgdGhpczpcclxuICpcclxuICogICBDYXJkaW5hbERpcmVjdGlvbi5OT1JUSDtcclxuICogICBDYXJkaW5hbERpcmVjdGlvbi5TT1VUSDtcclxuICogICBDYXJkaW5hbERpcmVjdGlvbi5FQVNUO1xyXG4gKiAgIENhcmRpbmFsRGlyZWN0aW9uLldFU1Q7XHJcbiAqXHJcbiAqICAgQ2FyZGluYWxEaXJlY3Rpb24uVkFMVUVTO1xyXG4gKiAgIC8vIHJldHVybnMgWyBDYXJkaW5hbERpcmVjdGlvbi5OT1JUSCwgQ2FyZGluYWxEaXJlY3Rpb24uU09VVEgsIENhcmRpbmFsRGlyZWN0aW9uLkVBU1QsIENhcmRpbmFsRGlyZWN0aW9uLldFU1QgXVxyXG4gKlxyXG4gKiBBbmQgc3VwcG9ydCBmb3IgY2hlY2tpbmcgd2hldGhlciBhbnkgdmFsdWUgaXMgYSB2YWx1ZSBvZiB0aGUgZW51bWVyYXRpb246XHJcbiAqXHJcbiAqICAgQ2FyZGluYWxEaXJlY3Rpb24uaW5jbHVkZXMoIENhcmRpbmFsRGlyZWN0aW9uLk5PUlRIICk7IC8vIHRydWVcclxuICogICBDYXJkaW5hbERpcmVjdGlvbi5pbmNsdWRlcyggQ2FyZGluYWxEaXJlY3Rpb24uU09VVEhXRVNUICk7IC8vIGZhbHNlXHJcbiAqICAgQ2FyZGluYWxEaXJlY3Rpb24uaW5jbHVkZXMoICdOT1JUSCcgKTsgLy8gZmFsc2UsIHZhbHVlcyBhcmUgbm90IHN0cmluZ3NcclxuICpcclxuICogQ29udmVudGlvbnMgZm9yIHVzaW5nIEVudW1lcmF0aW9uRGVwcmVjYXRlZCwgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1jb3JlL2lzc3Vlcy81MzpcclxuICpcclxuICogKDEpIEVudW1lcmF0aW9ucyBhcmUgbmFtZWQgbGlrZSBjbGFzc2VzL3R5cGVzLiBOb3RoaW5nIGluIHRoZSBuYW1lIG5lZWRzIHRvIGlkZW50aWZ5IHRoYXQgdGhleSBhcmUgRW51bWVyYXRpb25zLlxyXG4gKiAgICAgU2VlIHRoZSBleGFtcGxlIGFib3ZlOiBDYXJkaW5hbERpcmVjdGlvbiwgbm90IENhcmRpbmFsRGlyZWN0aW9uRW51bSBvciBDYXJkaW5hbERpcmVjdGlvbkVudW1lcmF0aW9uLlxyXG4gKlxyXG4gKiAoMikgRW51bWVyYXRpb25EZXByZWNhdGVkIHZhbHVlcyBhcmUgbmFtZWQgbGlrZSBjb25zdGFudHMsIHVzaW5nIHVwcGVyY2FzZS4gU2VlIHRoZSBleGFtcGxlIGFib3ZlLlxyXG4gKlxyXG4gKiAoMykgSWYgYW4gRW51bWVyYXRpb25EZXByZWNhdGVkIGlzIGNsb3NlbHkgcmVsYXRlZCB0byBzb21lIGNsYXNzLCB0aGVuIG1ha2UgaXQgYSBzdGF0aWMgZmllbGQgb2YgdGhhdCBjbGFzcy4gSWYgYW5cclxuICogICAgIEVudW1lcmF0aW9uRGVwcmVjYXRlZCBpcyBzcGVjaWZpYyB0byBhIFByb3BlcnR5LCB0aGVuIHRoZSBFbnVtZXJhdGlvbkRlcHJlY2F0ZWQgc2hvdWxkIGxpa2VseSBiZSBvd25lZCBieSB0aGUgY2xhc3MgdGhhdFxyXG4gKiAgICAgb3ducyB0aGF0IFByb3BlcnR5LlxyXG4gKlxyXG4gKiAoNCkgSWYgYW4gRW51bWVyYXRpb25EZXByZWNhdGVkIGlzIG5vdCBjbG9zZWx5IHJlbGF0ZWQgdG8gc29tZSBjbGFzcywgdGhlbiBwdXQgdGhlIEVudW1lcmF0aW9uRGVwcmVjYXRlZCBpbiBpdHMgb3duIC5qcyBmaWxlLlxyXG4gKiAgICAgRG8gbm90IGNvbWJpbmUgbXVsdGlwbGUgRW51bWVyYXRpb25zIGludG8gb25lIGZpbGUuXHJcbiAqXHJcbiAqICg1KSBJZiBhIFByb3BlcnR5IHRha2VzIGFuIEVudW1lcmF0aW9uRGVwcmVjYXRlZCB2YWx1ZSwgaXRzIHZhbGlkYXRpb24gdHlwaWNhbGx5IGxvb2tzIGxpa2UgdGhpczpcclxuICpcclxuICogICAgIGNvbnN0IGNhcmRpbmFsRGlyZWN0aW9uUHJvcGVydHkgPSBuZXcgUHJvcGVydHkoIENhcmRpbmFsRGlyZWN0aW9uLk5PUlRILCB7XHJcbiAqICAgICAgIHZhbGlkVmFsdWVzOiBDYXJkaW5hbERpcmVjdGlvbi5WQUxVRVNcclxuICogICAgIH1cclxuICpcclxuICogKDYpIFZhbHVlcyBvZiB0aGUgRW51bWVyYXRpb25EZXByZWNhdGVkIGFyZSBjb25zaWRlcmVkIGluc3RhbmNlcyBvZiB0aGUgRW51bWVyYXRpb25EZXByZWNhdGVkIGluIGRvY3VtZW50YXRpb24uIEZvciBleGFtcGxlLCBhIG1ldGhvZFxyXG4gKiAgICAgdGhhdCB0aGF0IHRha2VzIGFuIEVudW1lcmF0aW9uRGVwcmVjYXRlZCB2YWx1ZSBhcyBhbiBhcmd1bWVudCB3b3VsZCBiZSBkb2N1bWVudGVkIGxpa2UgdGhpczpcclxuICpcclxuICogICAgIC8vIEBwYXJhbSB7U2NlbmV9IG1vZGUgLSB2YWx1ZSBmcm9tIFNjZW5lIEVudW1lcmF0aW9uRGVwcmVjYXRlZFxyXG4gKiAgICAgc2V0U2NlbmVNb2RlKCBtb2RlICkge1xyXG4gKiAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBTY2VuZS5pbmNsdWRlcyggbW9kZSApICk7XHJcbiAqICAgICAgIC8vLi4uXHJcbiAqICAgICB9XHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgZGVwcmVjYXRpb25XYXJuaW5nIGZyb20gJy4vZGVwcmVjYXRpb25XYXJuaW5nLmpzJztcclxuaW1wb3J0IG1lcmdlIGZyb20gJy4vbWVyZ2UuanMnO1xyXG5pbXBvcnQgcGhldENvcmUgZnJvbSAnLi9waGV0Q29yZS5qcyc7XHJcblxyXG4vKipcclxuICogQGRlcHJlY2F0ZWRcclxuICovXHJcbmNsYXNzIEVudW1lcmF0aW9uRGVwcmVjYXRlZCB7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWcgLSBtdXN0IHByb3ZpZGUga2V5cyBzdWNoIGFzIHtrZXlzOlsnUkVEJywnQkxVRV19XHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgIC0gb3IgbWFwIHN1Y2ggYXMge21hcDp7UkVEOiBteVJlZFZhbHVlLCBCTFVFOiBteUJsdWVWYWx1ZX19XHJcbiAgICpcclxuICAgKiBAcHJpdmF0ZSAtIGNsaWVudHMgc2hvdWxkIHVzZSBFbnVtZXJhdGlvbkRlcHJlY2F0ZWQuYnlLZXlzIG9yIEVudW1lcmF0aW9uRGVwcmVjYXRlZC5ieU1hcFxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKCBjb25maWcgKSB7XHJcbiAgICBkZXByZWNhdGlvbldhcm5pbmcoICdFbnVtZXJhdGlvbkRlcHJlY2F0ZWQgc2hvdWxkIGJlIGV4Y2hhbmdlZCBmb3IgY2xhc3NlcyB0aGF0IGV4dGVuZCBFbnVtZXJhdGlvblZhbHVlLCBzZWUgV2lsZGVyRW51bWVyYXRpb25QYXR0ZXJucyBmb3IgZXhhbXBsZXMuJyApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGNvbmZpZywgJ2NvbmZpZyBtdXN0IGJlIHByb3ZpZGVkJyApO1xyXG5cclxuICAgIGNvbnN0IGtleXNQcm92aWRlZCA9ICEhY29uZmlnLmtleXM7XHJcbiAgICBjb25zdCBtYXBQcm92aWRlZCA9ICEhY29uZmlnLm1hcDtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGtleXNQcm92aWRlZCAhPT0gbWFwUHJvdmlkZWQsICdtdXN0IHByb3ZpZGUgb25lIG9yIHRoZSBvdGhlciBidXQgbm90IGJvdGggb2Yga2V5cy9tYXAnICk7XHJcblxyXG4gICAgY29uc3Qga2V5cyA9IGNvbmZpZy5rZXlzIHx8IE9iamVjdC5rZXlzKCBjb25maWcubWFwICk7XHJcbiAgICBjb25zdCBtYXAgPSBjb25maWcubWFwIHx8IHt9O1xyXG5cclxuICAgIGNvbmZpZyA9IG1lcmdlKCB7XHJcblxyXG4gICAgICAvLyB7c3RyaW5nfG51bGx9IFdpbGwgYmUgYXBwZW5kZWQgdG8gdGhlIEVudW1lcmF0aW9uSU8gZG9jdW1lbnRhdGlvbiwgaWYgcHJvdmlkZWRcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogbnVsbCxcclxuXHJcbiAgICAgIC8vIHtmdW5jdGlvbihFbnVtZXJhdGlvbkRlcHJlY2F0ZWQpOnxudWxsfSBJZiBwcm92aWRlZCwgaXQgd2lsbCBiZSBjYWxsZWQgYXMgYmVmb3JlRnJlZXplKCBlbnVtZXJhdGlvbiApIGp1c3QgYmVmb3JlIHRoZVxyXG4gICAgICAvLyBlbnVtZXJhdGlvbiBpcyBmcm96ZW4uIFNpbmNlIGl0J3Mgbm90IHBvc3NpYmxlIHRvIG1vZGlmeSB0aGUgZW51bWVyYXRpb24gYWZ0ZXJcclxuICAgICAgLy8gaXQgaXMgZnJvemVuIChlLmcuIGFkZGluZyBjb252ZW5pZW5jZSBmdW5jdGlvbnMpLCBhbmQgdGhlcmUgaXMgbm8gcmVmZXJlbmNlIHRvXHJcbiAgICAgIC8vIHRoZSBlbnVtZXJhdGlvbiBvYmplY3QgYmVmb3JlaGFuZCwgdGhpcyBhbGxvd3MgZGVmaW5pbmcgY3VzdG9tIHZhbHVlcy9tZXRob2RzXHJcbiAgICAgIC8vIG9uIHRoZSBlbnVtZXJhdGlvbiBvYmplY3QgaXRzZWxmLlxyXG4gICAgICBiZWZvcmVGcmVlemU6IG51bGxcclxuICAgIH0sIGNvbmZpZyApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIEFycmF5LmlzQXJyYXkoIGtleXMgKSwgJ1ZhbHVlcyBzaG91bGQgYmUgYW4gYXJyYXknICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBfLnVuaXEoIGtleXMgKS5sZW5ndGggPT09IGtleXMubGVuZ3RoLCAnVGhlcmUgc2hvdWxkIGJlIG5vIGR1cGxpY2F0ZWQgdmFsdWVzIHByb3ZpZGVkJyApO1xyXG4gICAgYXNzZXJ0ICYmIGtleXMuZm9yRWFjaCggdmFsdWUgPT4gYXNzZXJ0KCB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnLCAnRWFjaCB2YWx1ZSBzaG91bGQgYmUgYSBzdHJpbmcnICkgKTtcclxuICAgIGFzc2VydCAmJiBrZXlzLmZvckVhY2goIHZhbHVlID0+IGFzc2VydCggL15bQS1aXVtBLVowLTlfXSokL2cudGVzdCggdmFsdWUgKSxcclxuICAgICAgJ0VudW1lcmF0aW9uRGVwcmVjYXRlZCB2YWx1ZXMgc2hvdWxkIGJlIHVwcGVyY2FzZSBhbHBoYW51bWVyaWMgd2l0aCB1bmRlcnNjb3JlcyBhbmQgYmVnaW4gd2l0aCBhIGxldHRlcicgKSApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIV8uaW5jbHVkZXMoIGtleXMsICdWQUxVRVMnICksXHJcbiAgICAgICdUaGlzIGlzIHRoZSBuYW1lIG9mIGEgYnVpbHQtaW4gcHJvdmlkZWQgdmFsdWUsIHNvIGl0IGNhbm5vdCBiZSBpbmNsdWRlZCBhcyBhbiBlbnVtZXJhdGlvbiB2YWx1ZScgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFfLmluY2x1ZGVzKCBrZXlzLCAnS0VZUycgKSxcclxuICAgICAgJ1RoaXMgaXMgdGhlIG5hbWUgb2YgYSBidWlsdC1pbiBwcm92aWRlZCB2YWx1ZSwgc28gaXQgY2Fubm90IGJlIGluY2x1ZGVkIGFzIGFuIGVudW1lcmF0aW9uIHZhbHVlJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIV8uaW5jbHVkZXMoIGtleXMsICdpbmNsdWRlcycgKSxcclxuICAgICAgJ1RoaXMgaXMgdGhlIG5hbWUgb2YgYSBidWlsdC1pbiBwcm92aWRlZCB2YWx1ZSwgc28gaXQgY2Fubm90IGJlIGluY2x1ZGVkIGFzIGFuIGVudW1lcmF0aW9uIHZhbHVlJyApO1xyXG5cclxuICAgIC8vIEBwdWJsaWMgKHBoZXQtaW8pIC0gcHJvdmlkZXMgYWRkaXRpb25hbCBkb2N1bWVudGF0aW9uIGZvciBQaEVULWlPIHdoaWNoIGNhbiBiZSB2aWV3ZWQgaW4gc3R1ZGlvXHJcbiAgICAvLyBOb3RlIHRoaXMgdXNlcyB0aGUgc2FtZSB0ZXJtIGFzIHVzZWQgYnkgUGhldGlvT2JqZWN0LCBidXQgdmlhIGEgZGlmZmVyZW50IGNoYW5uZWwuXHJcbiAgICB0aGlzLnBoZXRpb0RvY3VtZW50YXRpb24gPSBjb25maWcucGhldGlvRG9jdW1lbnRhdGlvbjtcclxuXHJcbiAgICAvLyBAcHVibGljIHtzdHJpbmdbXX0gKHJlYWQtb25seSkgLSB0aGUgc3RyaW5nIGtleXMgb2YgdGhlIGVudW1lcmF0aW9uXHJcbiAgICB0aGlzLktFWVMgPSBrZXlzO1xyXG5cclxuICAgIC8vIEBwdWJsaWMge09iamVjdFtdfSAocmVhZC1vbmx5KSAtIHRoZSBvYmplY3QgdmFsdWVzIG9mIHRoZSBlbnVtZXJhdGlvblxyXG4gICAgdGhpcy5WQUxVRVMgPSBbXTtcclxuXHJcbiAgICBrZXlzLmZvckVhY2goIGtleSA9PiB7XHJcbiAgICAgIGNvbnN0IHZhbHVlID0gbWFwWyBrZXkgXSB8fCB7fTtcclxuXHJcbiAgICAgIC8vIFNldCBhdHRyaWJ1dGVzIG9mIHRoZSBlbnVtZXJhdGlvbiB2YWx1ZVxyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB2YWx1ZS5uYW1lID09PSB1bmRlZmluZWQsICdcInJpY2hcIiBlbnVtZXJhdGlvbiB2YWx1ZXMgY2Fubm90IHByb3ZpZGUgdGhlaXIgb3duIG5hbWUgYXR0cmlidXRlJyApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB2YWx1ZS50b1N0cmluZyA9PT0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZywgJ1wicmljaFwiIGVudW1lcmF0aW9uIHZhbHVlcyBjYW5ub3QgcHJvdmlkZSB0aGVpciBvd24gdG9TdHJpbmcnICk7XHJcblxyXG4gICAgICAvLyBAcHVibGljIHtzdHJpbmd9IChyZWFkLW9ubHkpIC0gUGhFVC1pTyBwdWJsaWMgQVBJIHJlbGllcyBvbiB0aGlzIG1hcHBpbmcsIGRvIG5vdCBjaGFuZ2UgaXQgbGlnaHRseVxyXG4gICAgICB2YWx1ZS5uYW1lID0ga2V5O1xyXG5cclxuICAgICAgLy8gQHB1YmxpYyB7ZnVuY3Rpb24oKTpzdHJpbmd9IChyZWFkLW9ubHkpXHJcbiAgICAgIHZhbHVlLnRvU3RyaW5nID0gKCkgPT4ga2V5O1xyXG5cclxuICAgICAgLy8gQXNzaWduIHRvIHRoZSBlbnVtZXJhdGlvblxyXG4gICAgICB0aGlzWyBrZXkgXSA9IHZhbHVlO1xyXG4gICAgICB0aGlzLlZBTFVFUy5wdXNoKCB2YWx1ZSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbmZpZy5iZWZvcmVGcmVlemUgJiYgY29uZmlnLmJlZm9yZUZyZWV6ZSggdGhpcyApO1xyXG4gICAgYXNzZXJ0ICYmIE9iamVjdC5mcmVlemUoIHRoaXMgKTtcclxuICAgIGFzc2VydCAmJiBPYmplY3QuZnJlZXplKCB0aGlzLlZBTFVFUyApO1xyXG4gICAgYXNzZXJ0ICYmIE9iamVjdC5mcmVlemUoIHRoaXMuS0VZUyApO1xyXG4gICAgYXNzZXJ0ICYmIGtleXMuZm9yRWFjaCgga2V5ID0+IGFzc2VydCAmJiBPYmplY3QuZnJlZXplKCBtYXBbIGtleSBdICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEJhc2VkIHNvbGVseSBvbiB0aGUga2V5cyBpbiBFbnVtZXJhdGlvbkRlcHJlY2F0ZWQuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1N0cmluZ31cclxuICAgKi9cclxuXHJcbiAgdG9TdHJpbmcoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5LRVlTLmpvaW4oICcsICcgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBnaXZlbiB2YWx1ZSBpcyBhIHZhbHVlIG9mIHRoaXMgZW51bWVyYXRpb24uIFNob3VsZCBnZW5lcmFsbHkgYmUgdXNlZCBmb3IgYXNzZXJ0aW9uc1xyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZVxyXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAqL1xyXG4gIGluY2x1ZGVzKCB2YWx1ZSApIHtcclxuICAgIHJldHVybiBfLmluY2x1ZGVzKCB0aGlzLlZBTFVFUywgdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRvIHN1cHBvcnQgY29uc2lzdGVudCBBUEkgd2l0aCBFbnVtZXJhdGlvbi5cclxuICAgKiBAcHVibGljXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleVxyXG4gICAqIEByZXR1cm5zIHsqfVxyXG4gICAqL1xyXG4gIGdldFZhbHVlKCBrZXkgKSB7XHJcbiAgICByZXR1cm4gdGhpc1sga2V5IF07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUbyBzdXBwb3J0IGNvbnNpc3RlbnQgQVBJIHdpdGggRW51bWVyYXRpb24uXHJcbiAgICogQHB1YmxpY1xyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbnVtZXJhdGlvblZhbHVlXHJcbiAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgKi9cclxuICBnZXRLZXkoIGVudW1lcmF0aW9uVmFsdWUgKSB7XHJcbiAgICByZXR1cm4gZW51bWVyYXRpb25WYWx1ZS5uYW1lO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVG8gc3VwcG9ydCBjb25zaXN0ZW50IEFQSSB3aXRoIEVudW1lcmF0aW9uLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKiBAcmV0dXJucyB7T2JqZWN0W119XHJcbiAgICovXHJcbiAgZ2V0IHZhbHVlcygpIHtcclxuICAgIHJldHVybiB0aGlzLlZBTFVFUztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRvIHN1cHBvcnQgY29uc2lzdGVudCBBUEkgd2l0aCBFbnVtZXJhdGlvbi5cclxuICAgKiBAcHVibGljXHJcbiAgICogQHJldHVybnMge3N0cmluZ1tdfVxyXG4gICAqL1xyXG4gIGdldCBrZXlzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuS0VZUztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRvIHN1cHBvcnQgY29uc2lzdGVudCBBUEkgd2l0aCBFbnVtZXJhdGlvbi5cclxuICAgKiBAcHVibGljXHJcbiAgICogQHJldHVybnMge0VudW1lcmF0aW9uRGVwcmVjYXRlZH1cclxuICAgKi9cclxuICBnZXQgZW51bWVyYXRpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW4gZW51bWVyYXRpb24gYmFzZWQgb24gdGhlIHByb3ZpZGVkIHN0cmluZyBhcnJheVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IGtleXMgLSBzdWNoIGFzIFsnUkVEJywnQkxVRSddXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxyXG4gICAqIEByZXR1cm5zIHtFbnVtZXJhdGlvbkRlcHJlY2F0ZWR9XHJcbiAgICogQHB1YmxpY1xyXG4gICAqL1xyXG4gIHN0YXRpYyBieUtleXMoIGtleXMsIG9wdGlvbnMgKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBBcnJheS5pc0FycmF5KCBrZXlzICksICdrZXlzIG11c3QgYmUgYW4gYXJyYXknICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhb3B0aW9ucyB8fCBvcHRpb25zLmtleXMgPT09IHVuZGVmaW5lZCApO1xyXG4gICAgcmV0dXJuIG5ldyBFbnVtZXJhdGlvbkRlcHJlY2F0ZWQoIG1lcmdlKCB7IGtleXM6IGtleXMgfSwgb3B0aW9ucyApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgXCJyaWNoXCIgZW51bWVyYXRpb24gYmFzZWQgb24gdGhlIHByb3ZpZGVkIG1hcFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBtYXAgLSBzdWNoIGFzIHtSRUQ6IG15UmVkVmFsdWUsIEJMVUU6IG15Qmx1ZVZhbHVlfVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cclxuICAgKiBAcmV0dXJucyB7RW51bWVyYXRpb25EZXByZWNhdGVkfVxyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICBzdGF0aWMgYnlNYXAoIG1hcCwgb3B0aW9ucyApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFvcHRpb25zIHx8IG9wdGlvbnMubWFwID09PSB1bmRlZmluZWQgKTtcclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICBjb25zdCB2YWx1ZXMgPSBfLnZhbHVlcyggbWFwICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHZhbHVlcy5sZW5ndGggPj0gMSwgJ211c3QgaGF2ZSBhdCBsZWFzdCAyIGVudHJpZXMgaW4gYW4gZW51bWVyYXRpb24nICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIF8uZXZlcnkoIHZhbHVlcywgdmFsdWUgPT4gdmFsdWUuY29uc3RydWN0b3IgPT09IHZhbHVlc1sgMCBdLmNvbnN0cnVjdG9yICksICdWYWx1ZXMgbXVzdCBoYXZlIHNhbWUgY29uc3RydWN0b3InICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3IEVudW1lcmF0aW9uRGVwcmVjYXRlZCggbWVyZ2UoIHsgbWFwOiBtYXAgfSwgb3B0aW9ucyApICk7XHJcbiAgfVxyXG59XHJcblxyXG5waGV0Q29yZS5yZWdpc3RlciggJ0VudW1lcmF0aW9uRGVwcmVjYXRlZCcsIEVudW1lcmF0aW9uRGVwcmVjYXRlZCApO1xyXG5leHBvcnQgZGVmYXVsdCBFbnVtZXJhdGlvbkRlcHJlY2F0ZWQ7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUE2REEsSUFBQUEsbUJBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLE1BQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLFNBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUFxQyxTQUFBRCx1QkFBQUksR0FBQSxXQUFBQSxHQUFBLElBQUFBLEdBQUEsQ0FBQUMsVUFBQSxHQUFBRCxHQUFBLGdCQUFBQSxHQUFBO0FBQUEsU0FBQUUsUUFBQUMsQ0FBQSxzQ0FBQUQsT0FBQSx3QkFBQUUsTUFBQSx1QkFBQUEsTUFBQSxDQUFBQyxRQUFBLGFBQUFGLENBQUEsa0JBQUFBLENBQUEsZ0JBQUFBLENBQUEsV0FBQUEsQ0FBQSx5QkFBQUMsTUFBQSxJQUFBRCxDQUFBLENBQUFHLFdBQUEsS0FBQUYsTUFBQSxJQUFBRCxDQUFBLEtBQUFDLE1BQUEsQ0FBQUcsU0FBQSxxQkFBQUosQ0FBQSxLQUFBRCxPQUFBLENBQUFDLENBQUE7QUFBQSxTQUFBSyxnQkFBQUMsUUFBQSxFQUFBQyxXQUFBLFVBQUFELFFBQUEsWUFBQUMsV0FBQSxlQUFBQyxTQUFBO0FBQUEsU0FBQUMsa0JBQUFDLE1BQUEsRUFBQUMsS0FBQSxhQUFBQyxDQUFBLE1BQUFBLENBQUEsR0FBQUQsS0FBQSxDQUFBRSxNQUFBLEVBQUFELENBQUEsVUFBQUUsVUFBQSxHQUFBSCxLQUFBLENBQUFDLENBQUEsR0FBQUUsVUFBQSxDQUFBQyxVQUFBLEdBQUFELFVBQUEsQ0FBQUMsVUFBQSxXQUFBRCxVQUFBLENBQUFFLFlBQUEsd0JBQUFGLFVBQUEsRUFBQUEsVUFBQSxDQUFBRyxRQUFBLFNBQUFDLE1BQUEsQ0FBQUMsY0FBQSxDQUFB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