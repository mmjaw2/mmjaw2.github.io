"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// Copyright 2017-2020, University of Colorado Boulder

/**
 * Handles serializing and deserializing versions for simulations.
 *
 * See https://github.com/phetsims/chipper/issues/560 for discussion on version ID definition.
 *
 * The canonical description of our general versions:
 *
 * Each version string has the form: {{MAJOR}}.{{MINOR}}.{{MAINTENANCE}}[-{{TEST_TYPE}}.{{TEST_NUMBER}}] where:
 *
 * MAJOR: Sequential integer, starts at 1, and is generally incremented when there are significant changes to a simulation.
 * MINOR: Sequential integer, starts at 0, and is generally incremented when there are smaller changes to a simulation.
 *   Resets to 0 whenever the major number is incremented.
 * MAINTENANCE: Sequential integer, starts at 0, and is incremented whenever we build with the same major/minor (but with different SHAs).
 *   Resets to 0 whenever the minor number is incremented.
 * TEST_TYPE (when present): Indicates that this is a non-production build when present. Typically will take the values:
 *   'dev' - A normal dev deployment, which goes to phet-dev.colorado.edu/html/
 *   'rc' -  A release-candidate deployment (off of a release branch). Also goes to phet-dev.colorado.edu/html/ only.
 *   anything else - A one-off deployment name, which is the same name as the branch it was deployed from.
 * TEST_NUMBER (when present): Indicates the version of the test/one-off type (gets incremented for every deployment).
 *   starts at 0 in package.json, but since it is incremented on every deploy, the first version published will be 1.
 *
 * It used to be (pre-chipper-2.0) that sometimes a shortened form of the (non-'phet') brand would be added to the end
 * (e.g. '1.3.0-dev.1-phetio' or '1.3.0-dev.1-adaptedfromphet'), or as a direct prefix for the TEST_TYPE (e.g.
 * 1.1.0-phetiodev.1 or 1.1.0-phetio). We have since moved to a deployment model where there are
 * subdirectories for each brand, so this is no longer part of the version. Since this was not used for any production sim
 * builds that we need statistics from, it is excluded in SimVersion.js or its description.
 *
 * Examples:
 *
 * 1.5.0                - Production simulation version (no test type). Major = 1, minor = 5, maintenance = 0
 * 1.5.0-rc.1           - Example of a release-candidate build version that would be published before '1.5.0' for testing.
 * 1.5.0-dev.1          - Example of a dev build that would be from main.
 * 1.5.0-sonification.1 - Example of a one-off build (which would be from the branch 'sonification')
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

/* eslint-env browser, node */

(function (global) {
  // To support loading in Node.js and the browser
  var assert = typeof module !== 'undefined' ? require('assert') : global && global.assert;
  var SimVersion = /*#__PURE__*/function () {
    /**
     * @constructor
     *
     * @param {number|string} major - The major part of the version (the 3 in 3.1.2)
     * @param {number|string} minor - The minor part of the version (the 1 in 3.1.2)
     * @param {number|string} maintenance - The maintenance part of the version (the 2 in 3.1.2)
     * @param {Object} [options]
     */
    function SimVersion(major, minor, maintenance) {
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
      _classCallCheck(this, SimVersion);
      if (typeof major === 'string') {
        major = Number(major);
      }
      if (typeof minor === 'string') {
        minor = Number(minor);
      }
      if (typeof maintenance === 'string') {
        maintenance = Number(maintenance);
      }
      if (typeof options.testNumber === 'string') {
        options.testNumber = Number(options.testNumber);
      }
      var _options$buildTimesta = options.buildTimestamp,
        buildTimestamp = _options$buildTimesta === void 0 ? null : _options$buildTimesta,
        _options$testType = options.testType,
        testType = _options$testType === void 0 ? null : _options$testType,
        _options$testNumber = options.testNumber,
        testNumber = _options$testNumber === void 0 ? null : _options$testNumber;
      assert && assert(typeof major === 'number' && major >= 0 && major % 1 === 0, "major version should be a non-negative integer: ".concat(major));
      assert && assert(typeof minor === 'number' && minor >= 0 && minor % 1 === 0, "minor version should be a non-negative integer: ".concat(minor));
      assert && assert(typeof maintenance === 'number' && maintenance >= 0 && maintenance % 1 === 0, "maintenance version should be a non-negative integer: ".concat(maintenance));
      assert && assert(typeof testType !== 'string' || typeof testNumber === 'number', 'if testType is provided, testNumber should be a number');

      // @public {number}
      this.major = major;

      // @public {number}
      this.minor = minor;

      // @public {number}
      this.maintenance = maintenance;

      // @public {string|null}
      this.testType = testType;

      // @public {number|null}
      this.testNumber = testNumber;

      // @public {string|null} - If provided, like '2015-06-12 16:05:03 UTC' (phet.chipper.buildTimestamp)
      this.buildTimestamp = buildTimestamp;
    }

    /**
     * Convert into a plain JS object meant for JSON serialization.
     * @public
     *
     * @returns {Object} - with properties like major, minor, maintenance, testType, testNumber, and buildTimestamp
     */
    return _createClass(SimVersion, [{
      key: "serialize",
      value: function serialize() {
        return {
          major: this.major,
          minor: this.minor,
          maintenance: this.maintenance,
          testType: this.testType,
          testNumber: this.testNumber,
          buildTimestamp: this.buildTimestamp
        };
      }

      /**
       * @returns {boolean}
       * @public
       * @ignore - not needed by PhET-iO Clients
       */
    }, {
      key: "isSimNotPublished",
      get: function get() {
        return this.major < 1 ||
        // e.g. 0.0.0-dev.1
        this.major === 1 &&
        // e.g. 1.0.0-dev.1
        this.minor === 0 && this.maintenance === 0 && this.testType;
      }

      /**
       * @returns {boolean}
       * @public
       * @ignore - not needed by PhET-iO Clients
       */
    }, {
      key: "isSimPublished",
      get: function get() {
        return !this.isSimNotPublished;
      }

      /**
       * Takes a serialized form of the SimVersion and returns an actual instance.
       * @public
       *
       * @param {Object} - with properties like major, minor, maintenance, testType, testNumber, and buildTimestamp
       * @returns {SimVersion}
       */
    }, {
      key: "compareNumber",
      value:
      /**
       * Compares versions, returning -1 if this version is before the passed in version, 0 if equal, or 1 if this version
       * is after.
       * @public
       *
       * This function only compares major/minor/maintenance, leaving other details to the client.
       *
       * @param {SimVersion} version
       */
      function compareNumber(version) {
        return SimVersion.comparator(this, version);
      }

      /**
       * Compares versions in standard "comparator" static format, returning -1 if the first parameter SimVersion is
       * before the second parameter SimVersion in version-string, 0 if equal, or 1 if the first parameter SimVersion is
       * after.
       * @public
       *
       * This function only compares major/minor/maintenance, leaving other details to the client.
       *
       * @param {SimVersion} a
       * @param {SimVersion} b
       */
    }, {
      key: "isAfter",
      value:
      /**
       * Returns true if the specified version is strictly after this version
       * @param {SimVersion} version
       * @returns {boolean}
       * @public
       */
      function isAfter(version) {
        return this.compareNumber(version) === 1;
      }

      /**
       * Returns true if the specified version matches or comes before this version.
       * @param version
       * @returns {boolean}
       * @public
       */
    }, {
      key: "isBeforeOrEqualTo",
      value: function isBeforeOrEqualTo(version) {
        return this.compareNumber(version) <= 0;
      }

      /**
       * Returns the string form of the version. Like "1.3.5".
       * @public
       *
       * @returns {string}
       */
    }, {
      key: "toString",
      value: function toString() {
        var str = "".concat(this.major, ".").concat(this.minor, ".").concat(this.maintenance);
        if (typeof this.testType === 'string') {
          str += "-".concat(this.testType, ".").concat(this.testNumber);
        }
        return str;
      }

      /**
       * Parses a sim version from a string form.
       * @public
       *
       * @param {string} versionString - e.g. '1.0.0', '1.0.1-dev.3', etc.
       * @param {string} [buildTimestamp] - Optional build timestamp, like '2015-06-12 16:05:03 UTC' (phet.chipper.buildTimestamp)
       * @returns {SimVersion}
       */
    }], [{
      key: "deserialize",
      value: function deserialize(_ref) {
        var major = _ref.major,
          minor = _ref.minor,
          maintenance = _ref.maintenance,
          testType = _ref.testType,
          testNumber = _ref.testNumber,
          buildTimestamp = _ref.buildTimestamp;
        return new SimVersion(major, minor, maintenance, {
          testType: testType,
          testNumber: testNumber,
          buildTimestamp: buildTimestamp
        });
      }
    }, {
      key: "comparator",
      value: function comparator(a, b) {
        if (a.major < b.major) {
          return -1;
        }
        if (a.major > b.major) {
          return 1;
        }
        if (a.minor < b.minor) {
          return -1;
        }
        if (a.minor > b.minor) {
          return 1;
        }
        if (a.maintenance < b.maintenance) {
          return -1;
        }
        if (a.maintenance > b.maintenance) {
          return 1;
        }
        return 0; // equal
      }
    }, {
      key: "parse",
      value: function parse(versionString, buildTimestamp) {
        var matches = versionString.match(/^(\d+)\.(\d+)\.(\d+)(-(([^.-]+)\.(\d+)))?(-([^.-]+))?$/);
        if (!matches) {
          throw new Error("could not parse version: ".concat(versionString));
        }
        var major = Number(matches[1]);
        var minor = Number(matches[2]);
        var maintenance = Number(matches[3]);
        var testType = matches[6];
        var testNumber = matches[7] === undefined ? matches[7] : Number(matches[7]);
        return new SimVersion(major, minor, maintenance, {
          testType: testType,
          testNumber: testNumber,
          buildTimestamp: buildTimestamp
        });
      }

      /**
       * Parses a branch in the form {{MAJOR}}.{{MINOR}} and returns a corresponding version. Uses 0 for the maintenance version (unknown).
       * @public
       *
       * @param {string} branch - e.g. '1.0'
       * @returns {SimVersion}
       */
    }, {
      key: "fromBranch",
      value: function fromBranch(branch) {
        var bits = branch.split('.');
        assert && assert(bits.length === 2, "Bad branch, should be {{MAJOR}}.{{MINOR}}, had: ".concat(branch));
        var major = Number(branch.split('.')[0]);
        var minor = Number(branch.split('.')[1]);
        return new SimVersion(major, minor, 0);
      }

      /**
       * Ensures that a branch name is ok to be a release branch.
       * @public
       *
       * @param {string} branch - e.g. '1.0'
       * @ignore - not needed by PhET-iO Clients
       */
    }, {
      key: "ensureReleaseBranch",
      value: function ensureReleaseBranch(branch) {
        var version = SimVersion.fromBranch(branch.split('-')[0]);
        assert && assert(version.major > 0, 'Major version for a branch should be greater than zero');
        assert && assert(version.minor >= 0, 'Minor version for a branch should be greater than (or equal) to zero');
      }
    }]);
  }(); // Node.js-compatible definition
  if (typeof module !== 'undefined') {
    module.exports = SimVersion;
  } else {
    // Browser support, assign with
    window.phet = window.phet || {};
    window.phet.preloads = window.phet.preloads || {};
    window.phet.preloads.chipper = window.phet.preloads.chipper || {};
    window.phet.preloads.chipper.SimVersion = SimVersion;
  }
})((1, eval)('this')); // eslint-disable-line no-eval
// Indirect eval usage done since babel likes to wrap things in strict mode.
// See http://perfectionkills.com/unnecessarily-comprehensive-look-into-a-rather-insignificant-issue-of-global-objects-creation/#ecmascript_5_strict_mode
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJnbG9iYWwiLCJhc3NlcnQiLCJtb2R1bGUiLCJyZXF1aXJlIiwiU2ltVmVyc2lvbiIsIm1ham9yIiwibWlub3IiLCJtYWludGVuYW5jZSIsIm9wdGlvbnMiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJ1bmRlZmluZWQiLCJfY2xhc3NDYWxsQ2hlY2siLCJOdW1iZXIiLCJ0ZXN0TnVtYmVyIiwiX29wdGlvbnMkYnVpbGRUaW1lc3RhIiwiYnVpbGRUaW1lc3RhbXAiLCJfb3B0aW9ucyR0ZXN0VHlwZSIsInRlc3RUeXBlIiwiX29wdGlvbnMkdGVzdE51bWJlciIsImNvbmNhdCIsIl9jcmVhdGVDbGFzcyIsImtleSIsInZhbHVlIiwic2VyaWFsaXplIiwiZ2V0IiwiaXNTaW1Ob3RQdWJsaXNoZWQiLCJjb21wYXJlTnVtYmVyIiwidmVyc2lvbiIsImNvbXBhcmF0b3IiLCJpc0FmdGVyIiwiaXNCZWZvcmVPckVxdWFsVG8iLCJ0b1N0cmluZyIsInN0ciIsImRlc2VyaWFsaXplIiwiX3JlZiIsImEiLCJiIiwicGFyc2UiLCJ2ZXJzaW9uU3RyaW5nIiwibWF0Y2hlcyIsIm1hdGNoIiwiRXJyb3IiLCJmcm9tQnJhbmNoIiwiYnJhbmNoIiwiYml0cyIsInNwbGl0IiwiZW5zdXJlUmVsZWFzZUJyYW5jaCIsImV4cG9ydHMiLCJ3aW5kb3ciLCJwaGV0IiwicHJlbG9hZHMiLCJjaGlwcGVyIiwiZXZhbCJdLCJzb3VyY2VzIjpbIlNpbVZlcnNpb24uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyMCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogSGFuZGxlcyBzZXJpYWxpemluZyBhbmQgZGVzZXJpYWxpemluZyB2ZXJzaW9ucyBmb3Igc2ltdWxhdGlvbnMuXHJcbiAqXHJcbiAqIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvNTYwIGZvciBkaXNjdXNzaW9uIG9uIHZlcnNpb24gSUQgZGVmaW5pdGlvbi5cclxuICpcclxuICogVGhlIGNhbm9uaWNhbCBkZXNjcmlwdGlvbiBvZiBvdXIgZ2VuZXJhbCB2ZXJzaW9uczpcclxuICpcclxuICogRWFjaCB2ZXJzaW9uIHN0cmluZyBoYXMgdGhlIGZvcm06IHt7TUFKT1J9fS57e01JTk9SfX0ue3tNQUlOVEVOQU5DRX19Wy17e1RFU1RfVFlQRX19Lnt7VEVTVF9OVU1CRVJ9fV0gd2hlcmU6XHJcbiAqXHJcbiAqIE1BSk9SOiBTZXF1ZW50aWFsIGludGVnZXIsIHN0YXJ0cyBhdCAxLCBhbmQgaXMgZ2VuZXJhbGx5IGluY3JlbWVudGVkIHdoZW4gdGhlcmUgYXJlIHNpZ25pZmljYW50IGNoYW5nZXMgdG8gYSBzaW11bGF0aW9uLlxyXG4gKiBNSU5PUjogU2VxdWVudGlhbCBpbnRlZ2VyLCBzdGFydHMgYXQgMCwgYW5kIGlzIGdlbmVyYWxseSBpbmNyZW1lbnRlZCB3aGVuIHRoZXJlIGFyZSBzbWFsbGVyIGNoYW5nZXMgdG8gYSBzaW11bGF0aW9uLlxyXG4gKiAgIFJlc2V0cyB0byAwIHdoZW5ldmVyIHRoZSBtYWpvciBudW1iZXIgaXMgaW5jcmVtZW50ZWQuXHJcbiAqIE1BSU5URU5BTkNFOiBTZXF1ZW50aWFsIGludGVnZXIsIHN0YXJ0cyBhdCAwLCBhbmQgaXMgaW5jcmVtZW50ZWQgd2hlbmV2ZXIgd2UgYnVpbGQgd2l0aCB0aGUgc2FtZSBtYWpvci9taW5vciAoYnV0IHdpdGggZGlmZmVyZW50IFNIQXMpLlxyXG4gKiAgIFJlc2V0cyB0byAwIHdoZW5ldmVyIHRoZSBtaW5vciBudW1iZXIgaXMgaW5jcmVtZW50ZWQuXHJcbiAqIFRFU1RfVFlQRSAod2hlbiBwcmVzZW50KTogSW5kaWNhdGVzIHRoYXQgdGhpcyBpcyBhIG5vbi1wcm9kdWN0aW9uIGJ1aWxkIHdoZW4gcHJlc2VudC4gVHlwaWNhbGx5IHdpbGwgdGFrZSB0aGUgdmFsdWVzOlxyXG4gKiAgICdkZXYnIC0gQSBub3JtYWwgZGV2IGRlcGxveW1lbnQsIHdoaWNoIGdvZXMgdG8gcGhldC1kZXYuY29sb3JhZG8uZWR1L2h0bWwvXHJcbiAqICAgJ3JjJyAtICBBIHJlbGVhc2UtY2FuZGlkYXRlIGRlcGxveW1lbnQgKG9mZiBvZiBhIHJlbGVhc2UgYnJhbmNoKS4gQWxzbyBnb2VzIHRvIHBoZXQtZGV2LmNvbG9yYWRvLmVkdS9odG1sLyBvbmx5LlxyXG4gKiAgIGFueXRoaW5nIGVsc2UgLSBBIG9uZS1vZmYgZGVwbG95bWVudCBuYW1lLCB3aGljaCBpcyB0aGUgc2FtZSBuYW1lIGFzIHRoZSBicmFuY2ggaXQgd2FzIGRlcGxveWVkIGZyb20uXHJcbiAqIFRFU1RfTlVNQkVSICh3aGVuIHByZXNlbnQpOiBJbmRpY2F0ZXMgdGhlIHZlcnNpb24gb2YgdGhlIHRlc3Qvb25lLW9mZiB0eXBlIChnZXRzIGluY3JlbWVudGVkIGZvciBldmVyeSBkZXBsb3ltZW50KS5cclxuICogICBzdGFydHMgYXQgMCBpbiBwYWNrYWdlLmpzb24sIGJ1dCBzaW5jZSBpdCBpcyBpbmNyZW1lbnRlZCBvbiBldmVyeSBkZXBsb3ksIHRoZSBmaXJzdCB2ZXJzaW9uIHB1Ymxpc2hlZCB3aWxsIGJlIDEuXHJcbiAqXHJcbiAqIEl0IHVzZWQgdG8gYmUgKHByZS1jaGlwcGVyLTIuMCkgdGhhdCBzb21ldGltZXMgYSBzaG9ydGVuZWQgZm9ybSBvZiB0aGUgKG5vbi0ncGhldCcpIGJyYW5kIHdvdWxkIGJlIGFkZGVkIHRvIHRoZSBlbmRcclxuICogKGUuZy4gJzEuMy4wLWRldi4xLXBoZXRpbycgb3IgJzEuMy4wLWRldi4xLWFkYXB0ZWRmcm9tcGhldCcpLCBvciBhcyBhIGRpcmVjdCBwcmVmaXggZm9yIHRoZSBURVNUX1RZUEUgKGUuZy5cclxuICogMS4xLjAtcGhldGlvZGV2LjEgb3IgMS4xLjAtcGhldGlvKS4gV2UgaGF2ZSBzaW5jZSBtb3ZlZCB0byBhIGRlcGxveW1lbnQgbW9kZWwgd2hlcmUgdGhlcmUgYXJlXHJcbiAqIHN1YmRpcmVjdG9yaWVzIGZvciBlYWNoIGJyYW5kLCBzbyB0aGlzIGlzIG5vIGxvbmdlciBwYXJ0IG9mIHRoZSB2ZXJzaW9uLiBTaW5jZSB0aGlzIHdhcyBub3QgdXNlZCBmb3IgYW55IHByb2R1Y3Rpb24gc2ltXHJcbiAqIGJ1aWxkcyB0aGF0IHdlIG5lZWQgc3RhdGlzdGljcyBmcm9tLCBpdCBpcyBleGNsdWRlZCBpbiBTaW1WZXJzaW9uLmpzIG9yIGl0cyBkZXNjcmlwdGlvbi5cclxuICpcclxuICogRXhhbXBsZXM6XHJcbiAqXHJcbiAqIDEuNS4wICAgICAgICAgICAgICAgIC0gUHJvZHVjdGlvbiBzaW11bGF0aW9uIHZlcnNpb24gKG5vIHRlc3QgdHlwZSkuIE1ham9yID0gMSwgbWlub3IgPSA1LCBtYWludGVuYW5jZSA9IDBcclxuICogMS41LjAtcmMuMSAgICAgICAgICAgLSBFeGFtcGxlIG9mIGEgcmVsZWFzZS1jYW5kaWRhdGUgYnVpbGQgdmVyc2lvbiB0aGF0IHdvdWxkIGJlIHB1Ymxpc2hlZCBiZWZvcmUgJzEuNS4wJyBmb3IgdGVzdGluZy5cclxuICogMS41LjAtZGV2LjEgICAgICAgICAgLSBFeGFtcGxlIG9mIGEgZGV2IGJ1aWxkIHRoYXQgd291bGQgYmUgZnJvbSBtYWluLlxyXG4gKiAxLjUuMC1zb25pZmljYXRpb24uMSAtIEV4YW1wbGUgb2YgYSBvbmUtb2ZmIGJ1aWxkICh3aGljaCB3b3VsZCBiZSBmcm9tIHRoZSBicmFuY2ggJ3NvbmlmaWNhdGlvbicpXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG4vKiBlc2xpbnQtZW52IGJyb3dzZXIsIG5vZGUgKi9cclxuXHJcbiggZnVuY3Rpb24oIGdsb2JhbCApIHtcclxuXHJcbiAgLy8gVG8gc3VwcG9ydCBsb2FkaW5nIGluIE5vZGUuanMgYW5kIHRoZSBicm93c2VyXHJcbiAgY29uc3QgYXNzZXJ0ID0gdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyByZXF1aXJlKCAnYXNzZXJ0JyApIDogZ2xvYmFsICYmIGdsb2JhbC5hc3NlcnQ7XHJcblxyXG4gIGNsYXNzIFNpbVZlcnNpb24ge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGNvbnN0cnVjdG9yXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSBtYWpvciAtIFRoZSBtYWpvciBwYXJ0IG9mIHRoZSB2ZXJzaW9uICh0aGUgMyBpbiAzLjEuMilcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gbWlub3IgLSBUaGUgbWlub3IgcGFydCBvZiB0aGUgdmVyc2lvbiAodGhlIDEgaW4gMy4xLjIpXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IG1haW50ZW5hbmNlIC0gVGhlIG1haW50ZW5hbmNlIHBhcnQgb2YgdGhlIHZlcnNpb24gKHRoZSAyIGluIDMuMS4yKVxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvciggbWFqb3IsIG1pbm9yLCBtYWludGVuYW5jZSwgb3B0aW9ucyA9IHt9ICkge1xyXG5cclxuICAgICAgaWYgKCB0eXBlb2YgbWFqb3IgPT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgIG1ham9yID0gTnVtYmVyKCBtYWpvciApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggdHlwZW9mIG1pbm9yID09PSAnc3RyaW5nJyApIHtcclxuICAgICAgICBtaW5vciA9IE51bWJlciggbWlub3IgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIHR5cGVvZiBtYWludGVuYW5jZSA9PT0gJ3N0cmluZycgKSB7XHJcbiAgICAgICAgbWFpbnRlbmFuY2UgPSBOdW1iZXIoIG1haW50ZW5hbmNlICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCB0eXBlb2Ygb3B0aW9ucy50ZXN0TnVtYmVyID09PSAnc3RyaW5nJyApIHtcclxuICAgICAgICBvcHRpb25zLnRlc3ROdW1iZXIgPSBOdW1iZXIoIG9wdGlvbnMudGVzdE51bWJlciApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCB7XHJcbiAgICAgICAgLy8ge3N0cmluZ3xudWxsfSAtIElmIHByb3ZpZGVkLCBpbmRpY2F0ZXMgdGhlIHRpbWUgYXQgd2hpY2ggdGhlIHNpbSBmaWxlIHdhcyBidWlsdFxyXG4gICAgICAgIGJ1aWxkVGltZXN0YW1wID0gbnVsbCxcclxuXHJcbiAgICAgICAgLy8ge3N0cmluZ3xudWxsfSAtIFRoZSB0ZXN0IG5hbWUsIGUuZy4gdGhlICdyYycgaW4gcmMuMS4gQWxzbyBjYW4gYmUgdGhlIG9uZS1vZmYgdmVyc2lvbiBuYW1lLCBpZiBwcm92aWRlZC5cclxuICAgICAgICB0ZXN0VHlwZSA9IG51bGwsXHJcblxyXG4gICAgICAgIC8vIHtudW1iZXJ8c3RyaW5nfG51bGx9IC0gVGhlIHRlc3QgbnVtYmVyLCBlLmcuIHRoZSAxIGluIHJjLjFcclxuICAgICAgICB0ZXN0TnVtYmVyID0gbnVsbFxyXG4gICAgICB9ID0gb3B0aW9ucztcclxuXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiBtYWpvciA9PT0gJ251bWJlcicgJiYgbWFqb3IgPj0gMCAmJiBtYWpvciAlIDEgPT09IDAsIGBtYWpvciB2ZXJzaW9uIHNob3VsZCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyOiAke21ham9yfWAgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIG1pbm9yID09PSAnbnVtYmVyJyAmJiBtaW5vciA+PSAwICYmIG1pbm9yICUgMSA9PT0gMCwgYG1pbm9yIHZlcnNpb24gc2hvdWxkIGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXI6ICR7bWlub3J9YCApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2YgbWFpbnRlbmFuY2UgPT09ICdudW1iZXInICYmIG1haW50ZW5hbmNlID49IDAgJiYgbWFpbnRlbmFuY2UgJSAxID09PSAwLCBgbWFpbnRlbmFuY2UgdmVyc2lvbiBzaG91bGQgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlcjogJHttYWludGVuYW5jZX1gICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiB0ZXN0VHlwZSAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIHRlc3ROdW1iZXIgPT09ICdudW1iZXInLCAnaWYgdGVzdFR5cGUgaXMgcHJvdmlkZWQsIHRlc3ROdW1iZXIgc2hvdWxkIGJlIGEgbnVtYmVyJyApO1xyXG5cclxuICAgICAgLy8gQHB1YmxpYyB7bnVtYmVyfVxyXG4gICAgICB0aGlzLm1ham9yID0gbWFqb3I7XHJcblxyXG4gICAgICAvLyBAcHVibGljIHtudW1iZXJ9XHJcbiAgICAgIHRoaXMubWlub3IgPSBtaW5vcjtcclxuXHJcbiAgICAgIC8vIEBwdWJsaWMge251bWJlcn1cclxuICAgICAgdGhpcy5tYWludGVuYW5jZSA9IG1haW50ZW5hbmNlO1xyXG5cclxuICAgICAgLy8gQHB1YmxpYyB7c3RyaW5nfG51bGx9XHJcbiAgICAgIHRoaXMudGVzdFR5cGUgPSB0ZXN0VHlwZTtcclxuXHJcbiAgICAgIC8vIEBwdWJsaWMge251bWJlcnxudWxsfVxyXG4gICAgICB0aGlzLnRlc3ROdW1iZXIgPSB0ZXN0TnVtYmVyO1xyXG5cclxuICAgICAgLy8gQHB1YmxpYyB7c3RyaW5nfG51bGx9IC0gSWYgcHJvdmlkZWQsIGxpa2UgJzIwMTUtMDYtMTIgMTY6MDU6MDMgVVRDJyAocGhldC5jaGlwcGVyLmJ1aWxkVGltZXN0YW1wKVxyXG4gICAgICB0aGlzLmJ1aWxkVGltZXN0YW1wID0gYnVpbGRUaW1lc3RhbXA7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb252ZXJ0IGludG8gYSBwbGFpbiBKUyBvYmplY3QgbWVhbnQgZm9yIEpTT04gc2VyaWFsaXphdGlvbi5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIHdpdGggcHJvcGVydGllcyBsaWtlIG1ham9yLCBtaW5vciwgbWFpbnRlbmFuY2UsIHRlc3RUeXBlLCB0ZXN0TnVtYmVyLCBhbmQgYnVpbGRUaW1lc3RhbXBcclxuICAgICAqL1xyXG4gICAgc2VyaWFsaXplKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIG1ham9yOiB0aGlzLm1ham9yLFxyXG4gICAgICAgIG1pbm9yOiB0aGlzLm1pbm9yLFxyXG4gICAgICAgIG1haW50ZW5hbmNlOiB0aGlzLm1haW50ZW5hbmNlLFxyXG4gICAgICAgIHRlc3RUeXBlOiB0aGlzLnRlc3RUeXBlLFxyXG4gICAgICAgIHRlc3ROdW1iZXI6IHRoaXMudGVzdE51bWJlcixcclxuICAgICAgICBidWlsZFRpbWVzdGFtcDogdGhpcy5idWlsZFRpbWVzdGFtcFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKiBAaWdub3JlIC0gbm90IG5lZWRlZCBieSBQaEVULWlPIENsaWVudHNcclxuICAgICAqL1xyXG4gICAgZ2V0IGlzU2ltTm90UHVibGlzaGVkKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5tYWpvciA8IDEgfHwgLy8gZS5nLiAwLjAuMC1kZXYuMVxyXG4gICAgICAgICAgICAgKCB0aGlzLm1ham9yID09PSAxICYmIC8vIGUuZy4gMS4wLjAtZGV2LjFcclxuICAgICAgICAgICAgICAgdGhpcy5taW5vciA9PT0gMCAmJlxyXG4gICAgICAgICAgICAgICB0aGlzLm1haW50ZW5hbmNlID09PSAwICYmXHJcbiAgICAgICAgICAgICAgIHRoaXMudGVzdFR5cGUgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICogQGlnbm9yZSAtIG5vdCBuZWVkZWQgYnkgUGhFVC1pTyBDbGllbnRzXHJcbiAgICAgKi9cclxuICAgIGdldCBpc1NpbVB1Ymxpc2hlZCgpIHtcclxuICAgICAgcmV0dXJuICF0aGlzLmlzU2ltTm90UHVibGlzaGVkO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGFrZXMgYSBzZXJpYWxpemVkIGZvcm0gb2YgdGhlIFNpbVZlcnNpb24gYW5kIHJldHVybnMgYW4gYWN0dWFsIGluc3RhbmNlLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSAtIHdpdGggcHJvcGVydGllcyBsaWtlIG1ham9yLCBtaW5vciwgbWFpbnRlbmFuY2UsIHRlc3RUeXBlLCB0ZXN0TnVtYmVyLCBhbmQgYnVpbGRUaW1lc3RhbXBcclxuICAgICAqIEByZXR1cm5zIHtTaW1WZXJzaW9ufVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZGVzZXJpYWxpemUoIHsgbWFqb3IsIG1pbm9yLCBtYWludGVuYW5jZSwgdGVzdFR5cGUsIHRlc3ROdW1iZXIsIGJ1aWxkVGltZXN0YW1wIH0gKSB7XHJcbiAgICAgIHJldHVybiBuZXcgU2ltVmVyc2lvbiggbWFqb3IsIG1pbm9yLCBtYWludGVuYW5jZSwge1xyXG4gICAgICAgIHRlc3RUeXBlOiB0ZXN0VHlwZSxcclxuICAgICAgICB0ZXN0TnVtYmVyOiB0ZXN0TnVtYmVyLFxyXG4gICAgICAgIGJ1aWxkVGltZXN0YW1wOiBidWlsZFRpbWVzdGFtcFxyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb21wYXJlcyB2ZXJzaW9ucywgcmV0dXJuaW5nIC0xIGlmIHRoaXMgdmVyc2lvbiBpcyBiZWZvcmUgdGhlIHBhc3NlZCBpbiB2ZXJzaW9uLCAwIGlmIGVxdWFsLCBvciAxIGlmIHRoaXMgdmVyc2lvblxyXG4gICAgICogaXMgYWZ0ZXIuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogVGhpcyBmdW5jdGlvbiBvbmx5IGNvbXBhcmVzIG1ham9yL21pbm9yL21haW50ZW5hbmNlLCBsZWF2aW5nIG90aGVyIGRldGFpbHMgdG8gdGhlIGNsaWVudC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1NpbVZlcnNpb259IHZlcnNpb25cclxuICAgICAqL1xyXG4gICAgY29tcGFyZU51bWJlciggdmVyc2lvbiApIHtcclxuICAgICAgcmV0dXJuIFNpbVZlcnNpb24uY29tcGFyYXRvciggdGhpcywgdmVyc2lvbiApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29tcGFyZXMgdmVyc2lvbnMgaW4gc3RhbmRhcmQgXCJjb21wYXJhdG9yXCIgc3RhdGljIGZvcm1hdCwgcmV0dXJuaW5nIC0xIGlmIHRoZSBmaXJzdCBwYXJhbWV0ZXIgU2ltVmVyc2lvbiBpc1xyXG4gICAgICogYmVmb3JlIHRoZSBzZWNvbmQgcGFyYW1ldGVyIFNpbVZlcnNpb24gaW4gdmVyc2lvbi1zdHJpbmcsIDAgaWYgZXF1YWwsIG9yIDEgaWYgdGhlIGZpcnN0IHBhcmFtZXRlciBTaW1WZXJzaW9uIGlzXHJcbiAgICAgKiBhZnRlci5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIG9ubHkgY29tcGFyZXMgbWFqb3IvbWlub3IvbWFpbnRlbmFuY2UsIGxlYXZpbmcgb3RoZXIgZGV0YWlscyB0byB0aGUgY2xpZW50LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U2ltVmVyc2lvbn0gYVxyXG4gICAgICogQHBhcmFtIHtTaW1WZXJzaW9ufSBiXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBjb21wYXJhdG9yKCBhLCBiICkge1xyXG4gICAgICBpZiAoIGEubWFqb3IgPCBiLm1ham9yICkgeyByZXR1cm4gLTE7IH1cclxuICAgICAgaWYgKCBhLm1ham9yID4gYi5tYWpvciApIHsgcmV0dXJuIDE7IH1cclxuICAgICAgaWYgKCBhLm1pbm9yIDwgYi5taW5vciApIHsgcmV0dXJuIC0xOyB9XHJcbiAgICAgIGlmICggYS5taW5vciA+IGIubWlub3IgKSB7IHJldHVybiAxOyB9XHJcbiAgICAgIGlmICggYS5tYWludGVuYW5jZSA8IGIubWFpbnRlbmFuY2UgKSB7IHJldHVybiAtMTsgfVxyXG4gICAgICBpZiAoIGEubWFpbnRlbmFuY2UgPiBiLm1haW50ZW5hbmNlICkgeyByZXR1cm4gMTsgfVxyXG4gICAgICByZXR1cm4gMDsgLy8gZXF1YWxcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgc3BlY2lmaWVkIHZlcnNpb24gaXMgc3RyaWN0bHkgYWZ0ZXIgdGhpcyB2ZXJzaW9uXHJcbiAgICAgKiBAcGFyYW0ge1NpbVZlcnNpb259IHZlcnNpb25cclxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICovXHJcbiAgICBpc0FmdGVyKCB2ZXJzaW9uICkge1xyXG4gICAgICByZXR1cm4gdGhpcy5jb21wYXJlTnVtYmVyKCB2ZXJzaW9uICkgPT09IDE7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIHNwZWNpZmllZCB2ZXJzaW9uIG1hdGNoZXMgb3IgY29tZXMgYmVmb3JlIHRoaXMgdmVyc2lvbi5cclxuICAgICAqIEBwYXJhbSB2ZXJzaW9uXHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqL1xyXG4gICAgaXNCZWZvcmVPckVxdWFsVG8oIHZlcnNpb24gKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmNvbXBhcmVOdW1iZXIoIHZlcnNpb24gKSA8PSAwO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgc3RyaW5nIGZvcm0gb2YgdGhlIHZlcnNpb24uIExpa2UgXCIxLjMuNVwiLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICBsZXQgc3RyID0gYCR7dGhpcy5tYWpvcn0uJHt0aGlzLm1pbm9yfS4ke3RoaXMubWFpbnRlbmFuY2V9YDtcclxuICAgICAgaWYgKCB0eXBlb2YgdGhpcy50ZXN0VHlwZSA9PT0gJ3N0cmluZycgKSB7XHJcbiAgICAgICAgc3RyICs9IGAtJHt0aGlzLnRlc3RUeXBlfS4ke3RoaXMudGVzdE51bWJlcn1gO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBzdHI7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQYXJzZXMgYSBzaW0gdmVyc2lvbiBmcm9tIGEgc3RyaW5nIGZvcm0uXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZlcnNpb25TdHJpbmcgLSBlLmcuICcxLjAuMCcsICcxLjAuMS1kZXYuMycsIGV0Yy5cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbYnVpbGRUaW1lc3RhbXBdIC0gT3B0aW9uYWwgYnVpbGQgdGltZXN0YW1wLCBsaWtlICcyMDE1LTA2LTEyIDE2OjA1OjAzIFVUQycgKHBoZXQuY2hpcHBlci5idWlsZFRpbWVzdGFtcClcclxuICAgICAqIEByZXR1cm5zIHtTaW1WZXJzaW9ufVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgcGFyc2UoIHZlcnNpb25TdHJpbmcsIGJ1aWxkVGltZXN0YW1wICkge1xyXG4gICAgICBjb25zdCBtYXRjaGVzID0gdmVyc2lvblN0cmluZy5tYXRjaCggL14oXFxkKylcXC4oXFxkKylcXC4oXFxkKykoLSgoW14uLV0rKVxcLihcXGQrKSkpPygtKFteLi1dKykpPyQvICk7XHJcblxyXG4gICAgICBpZiAoICFtYXRjaGVzICkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvciggYGNvdWxkIG5vdCBwYXJzZSB2ZXJzaW9uOiAke3ZlcnNpb25TdHJpbmd9YCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBtYWpvciA9IE51bWJlciggbWF0Y2hlc1sgMSBdICk7XHJcbiAgICAgIGNvbnN0IG1pbm9yID0gTnVtYmVyKCBtYXRjaGVzWyAyIF0gKTtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBOdW1iZXIoIG1hdGNoZXNbIDMgXSApO1xyXG4gICAgICBjb25zdCB0ZXN0VHlwZSA9IG1hdGNoZXNbIDYgXTtcclxuICAgICAgY29uc3QgdGVzdE51bWJlciA9IG1hdGNoZXNbIDcgXSA9PT0gdW5kZWZpbmVkID8gbWF0Y2hlc1sgNyBdIDogTnVtYmVyKCBtYXRjaGVzWyA3IF0gKTtcclxuXHJcbiAgICAgIHJldHVybiBuZXcgU2ltVmVyc2lvbiggbWFqb3IsIG1pbm9yLCBtYWludGVuYW5jZSwge1xyXG4gICAgICAgIHRlc3RUeXBlOiB0ZXN0VHlwZSxcclxuICAgICAgICB0ZXN0TnVtYmVyOiB0ZXN0TnVtYmVyLFxyXG4gICAgICAgIGJ1aWxkVGltZXN0YW1wOiBidWlsZFRpbWVzdGFtcFxyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQYXJzZXMgYSBicmFuY2ggaW4gdGhlIGZvcm0ge3tNQUpPUn19Lnt7TUlOT1J9fSBhbmQgcmV0dXJucyBhIGNvcnJlc3BvbmRpbmcgdmVyc2lvbi4gVXNlcyAwIGZvciB0aGUgbWFpbnRlbmFuY2UgdmVyc2lvbiAodW5rbm93bikuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGJyYW5jaCAtIGUuZy4gJzEuMCdcclxuICAgICAqIEByZXR1cm5zIHtTaW1WZXJzaW9ufVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZnJvbUJyYW5jaCggYnJhbmNoICkge1xyXG4gICAgICBjb25zdCBiaXRzID0gYnJhbmNoLnNwbGl0KCAnLicgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggYml0cy5sZW5ndGggPT09IDIsIGBCYWQgYnJhbmNoLCBzaG91bGQgYmUge3tNQUpPUn19Lnt7TUlOT1J9fSwgaGFkOiAke2JyYW5jaH1gICk7XHJcblxyXG4gICAgICBjb25zdCBtYWpvciA9IE51bWJlciggYnJhbmNoLnNwbGl0KCAnLicgKVsgMCBdICk7XHJcbiAgICAgIGNvbnN0IG1pbm9yID0gTnVtYmVyKCBicmFuY2guc3BsaXQoICcuJyApWyAxIF0gKTtcclxuXHJcbiAgICAgIHJldHVybiBuZXcgU2ltVmVyc2lvbiggbWFqb3IsIG1pbm9yLCAwICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbnN1cmVzIHRoYXQgYSBicmFuY2ggbmFtZSBpcyBvayB0byBiZSBhIHJlbGVhc2UgYnJhbmNoLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBicmFuY2ggLSBlLmcuICcxLjAnXHJcbiAgICAgKiBAaWdub3JlIC0gbm90IG5lZWRlZCBieSBQaEVULWlPIENsaWVudHNcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGVuc3VyZVJlbGVhc2VCcmFuY2goIGJyYW5jaCApIHtcclxuICAgICAgY29uc3QgdmVyc2lvbiA9IFNpbVZlcnNpb24uZnJvbUJyYW5jaCggYnJhbmNoLnNwbGl0KCAnLScgKVsgMCBdICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHZlcnNpb24ubWFqb3IgPiAwLCAnTWFqb3IgdmVyc2lvbiBmb3IgYSBicmFuY2ggc2hvdWxkIGJlIGdyZWF0ZXIgdGhhbiB6ZXJvJyApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB2ZXJzaW9uLm1pbm9yID49IDAsICdNaW5vciB2ZXJzaW9uIGZvciBhIGJyYW5jaCBzaG91bGQgYmUgZ3JlYXRlciB0aGFuIChvciBlcXVhbCkgdG8gemVybycgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIE5vZGUuanMtY29tcGF0aWJsZSBkZWZpbml0aW9uXHJcbiAgaWYgKCB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyApIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gU2ltVmVyc2lvbjtcclxuICB9XHJcbiAgZWxzZSB7XHJcblxyXG4gICAgLy8gQnJvd3NlciBzdXBwb3J0LCBhc3NpZ24gd2l0aFxyXG4gICAgd2luZG93LnBoZXQgPSB3aW5kb3cucGhldCB8fCB7fTtcclxuICAgIHdpbmRvdy5waGV0LnByZWxvYWRzID0gd2luZG93LnBoZXQucHJlbG9hZHMgfHwge307XHJcbiAgICB3aW5kb3cucGhldC5wcmVsb2Fkcy5jaGlwcGVyID0gd2luZG93LnBoZXQucHJlbG9hZHMuY2hpcHBlciB8fCB7fTtcclxuICAgIHdpbmRvdy5waGV0LnByZWxvYWRzLmNoaXBwZXIuU2ltVmVyc2lvbiA9IFNpbVZlcnNpb247XHJcbiAgfVxyXG59ICkoICggMSwgZXZhbCApKCAndGhpcycgKSApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWV2YWxcclxuLy8gSW5kaXJlY3QgZXZhbCB1c2FnZSBkb25lIHNpbmNlIGJhYmVsIGxpa2VzIHRvIHdyYXAgdGhpbmdzIGluIHN0cmljdCBtb2RlLlxyXG4vLyBTZWUgaHR0cDovL3BlcmZlY3Rpb25raWxscy5jb20vdW5uZWNlc3NhcmlseS1jb21wcmVoZW5zaXZlLWxvb2staW50by1hLXJhdGhlci1pbnNpZ25pZmljYW50LWlzc3VlLW9mLWdsb2JhbC1vYmplY3RzLWNyZWF0aW9uLyNlY21hc2NyaXB0XzVfc3RyaWN0X21vZGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBLENBQUUsVUFBVUEsTUFBTSxFQUFHO0VBRW5CO0VBQ0EsSUFBTUMsTUFBTSxHQUFHLE9BQU9DLE1BQU0sS0FBSyxXQUFXLEdBQUdDLE9BQU8sQ0FBRSxRQUFTLENBQUMsR0FBR0gsTUFBTSxJQUFJQSxNQUFNLENBQUNDLE1BQU07RUFBQyxJQUV2RkcsVUFBVTtJQUVkO0FBQ0o7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