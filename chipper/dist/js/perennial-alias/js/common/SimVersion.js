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
  const assert = typeof module !== 'undefined' ? require('assert') : global && global.assert;
  class SimVersion {
    /**
     * @constructor
     *
     * @param {number|string} major - The major part of the version (the 3 in 3.1.2)
     * @param {number|string} minor - The minor part of the version (the 1 in 3.1.2)
     * @param {number|string} maintenance - The maintenance part of the version (the 2 in 3.1.2)
     * @param {Object} [options]
     */
    constructor(major, minor, maintenance, options = {}) {
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
      const {
        // {string|null} - If provided, indicates the time at which the sim file was built
        buildTimestamp = null,
        // {string|null} - The test name, e.g. the 'rc' in rc.1. Also can be the one-off version name, if provided.
        testType = null,
        // {number|string|null} - The test number, e.g. the 1 in rc.1
        testNumber = null
      } = options;
      assert && assert(typeof major === 'number' && major >= 0 && major % 1 === 0, `major version should be a non-negative integer: ${major}`);
      assert && assert(typeof minor === 'number' && minor >= 0 && minor % 1 === 0, `minor version should be a non-negative integer: ${minor}`);
      assert && assert(typeof maintenance === 'number' && maintenance >= 0 && maintenance % 1 === 0, `maintenance version should be a non-negative integer: ${maintenance}`);
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
    serialize() {
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
    get isSimNotPublished() {
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
    get isSimPublished() {
      return !this.isSimNotPublished;
    }

    /**
     * Takes a serialized form of the SimVersion and returns an actual instance.
     * @public
     *
     * @param {Object} - with properties like major, minor, maintenance, testType, testNumber, and buildTimestamp
     * @returns {SimVersion}
     */
    static deserialize({
      major,
      minor,
      maintenance,
      testType,
      testNumber,
      buildTimestamp
    }) {
      return new SimVersion(major, minor, maintenance, {
        testType: testType,
        testNumber: testNumber,
        buildTimestamp: buildTimestamp
      });
    }

    /**
     * Compares versions, returning -1 if this version is before the passed in version, 0 if equal, or 1 if this version
     * is after.
     * @public
     *
     * This function only compares major/minor/maintenance, leaving other details to the client.
     *
     * @param {SimVersion} version
     */
    compareNumber(version) {
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
    static comparator(a, b) {
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

    /**
     * Returns true if the specified version is strictly after this version
     * @param {SimVersion} version
     * @returns {boolean}
     * @public
     */
    isAfter(version) {
      return this.compareNumber(version) === 1;
    }

    /**
     * Returns true if the specified version matches or comes before this version.
     * @param version
     * @returns {boolean}
     * @public
     */
    isBeforeOrEqualTo(version) {
      return this.compareNumber(version) <= 0;
    }

    /**
     * Returns the string form of the version. Like "1.3.5".
     * @public
     *
     * @returns {string}
     */
    toString() {
      let str = `${this.major}.${this.minor}.${this.maintenance}`;
      if (typeof this.testType === 'string') {
        str += `-${this.testType}.${this.testNumber}`;
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
    static parse(versionString, buildTimestamp) {
      const matches = versionString.match(/^(\d+)\.(\d+)\.(\d+)(-(([^.-]+)\.(\d+)))?(-([^.-]+))?$/);
      if (!matches) {
        throw new Error(`could not parse version: ${versionString}`);
      }
      const major = Number(matches[1]);
      const minor = Number(matches[2]);
      const maintenance = Number(matches[3]);
      const testType = matches[6];
      const testNumber = matches[7] === undefined ? matches[7] : Number(matches[7]);
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
    static fromBranch(branch) {
      const bits = branch.split('.');
      assert && assert(bits.length === 2, `Bad branch, should be {{MAJOR}}.{{MINOR}}, had: ${branch}`);
      const major = Number(branch.split('.')[0]);
      const minor = Number(branch.split('.')[1]);
      return new SimVersion(major, minor, 0);
    }

    /**
     * Ensures that a branch name is ok to be a release branch.
     * @public
     *
     * @param {string} branch - e.g. '1.0'
     * @ignore - not needed by PhET-iO Clients
     */
    static ensureReleaseBranch(branch) {
      const version = SimVersion.fromBranch(branch.split('-')[0]);
      assert && assert(version.major > 0, 'Major version for a branch should be greater than zero');
      assert && assert(version.minor >= 0, 'Minor version for a branch should be greater than (or equal) to zero');
    }
  }

  // Node.js-compatible definition
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJnbG9iYWwiLCJhc3NlcnQiLCJtb2R1bGUiLCJyZXF1aXJlIiwiU2ltVmVyc2lvbiIsImNvbnN0cnVjdG9yIiwibWFqb3IiLCJtaW5vciIsIm1haW50ZW5hbmNlIiwib3B0aW9ucyIsIk51bWJlciIsInRlc3ROdW1iZXIiLCJidWlsZFRpbWVzdGFtcCIsInRlc3RUeXBlIiwic2VyaWFsaXplIiwiaXNTaW1Ob3RQdWJsaXNoZWQiLCJpc1NpbVB1Ymxpc2hlZCIsImRlc2VyaWFsaXplIiwiY29tcGFyZU51bWJlciIsInZlcnNpb24iLCJjb21wYXJhdG9yIiwiYSIsImIiLCJpc0FmdGVyIiwiaXNCZWZvcmVPckVxdWFsVG8iLCJ0b1N0cmluZyIsInN0ciIsInBhcnNlIiwidmVyc2lvblN0cmluZyIsIm1hdGNoZXMiLCJtYXRjaCIsIkVycm9yIiwidW5kZWZpbmVkIiwiZnJvbUJyYW5jaCIsImJyYW5jaCIsImJpdHMiLCJzcGxpdCIsImxlbmd0aCIsImVuc3VyZVJlbGVhc2VCcmFuY2giLCJleHBvcnRzIiwid2luZG93IiwicGhldCIsInByZWxvYWRzIiwiY2hpcHBlciIsImV2YWwiXSwic291cmNlcyI6WyJTaW1WZXJzaW9uLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMjAsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEhhbmRsZXMgc2VyaWFsaXppbmcgYW5kIGRlc2VyaWFsaXppbmcgdmVyc2lvbnMgZm9yIHNpbXVsYXRpb25zLlxyXG4gKlxyXG4gKiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzU2MCBmb3IgZGlzY3Vzc2lvbiBvbiB2ZXJzaW9uIElEIGRlZmluaXRpb24uXHJcbiAqXHJcbiAqIFRoZSBjYW5vbmljYWwgZGVzY3JpcHRpb24gb2Ygb3VyIGdlbmVyYWwgdmVyc2lvbnM6XHJcbiAqXHJcbiAqIEVhY2ggdmVyc2lvbiBzdHJpbmcgaGFzIHRoZSBmb3JtOiB7e01BSk9SfX0ue3tNSU5PUn19Lnt7TUFJTlRFTkFOQ0V9fVste3tURVNUX1RZUEV9fS57e1RFU1RfTlVNQkVSfX1dIHdoZXJlOlxyXG4gKlxyXG4gKiBNQUpPUjogU2VxdWVudGlhbCBpbnRlZ2VyLCBzdGFydHMgYXQgMSwgYW5kIGlzIGdlbmVyYWxseSBpbmNyZW1lbnRlZCB3aGVuIHRoZXJlIGFyZSBzaWduaWZpY2FudCBjaGFuZ2VzIHRvIGEgc2ltdWxhdGlvbi5cclxuICogTUlOT1I6IFNlcXVlbnRpYWwgaW50ZWdlciwgc3RhcnRzIGF0IDAsIGFuZCBpcyBnZW5lcmFsbHkgaW5jcmVtZW50ZWQgd2hlbiB0aGVyZSBhcmUgc21hbGxlciBjaGFuZ2VzIHRvIGEgc2ltdWxhdGlvbi5cclxuICogICBSZXNldHMgdG8gMCB3aGVuZXZlciB0aGUgbWFqb3IgbnVtYmVyIGlzIGluY3JlbWVudGVkLlxyXG4gKiBNQUlOVEVOQU5DRTogU2VxdWVudGlhbCBpbnRlZ2VyLCBzdGFydHMgYXQgMCwgYW5kIGlzIGluY3JlbWVudGVkIHdoZW5ldmVyIHdlIGJ1aWxkIHdpdGggdGhlIHNhbWUgbWFqb3IvbWlub3IgKGJ1dCB3aXRoIGRpZmZlcmVudCBTSEFzKS5cclxuICogICBSZXNldHMgdG8gMCB3aGVuZXZlciB0aGUgbWlub3IgbnVtYmVyIGlzIGluY3JlbWVudGVkLlxyXG4gKiBURVNUX1RZUEUgKHdoZW4gcHJlc2VudCk6IEluZGljYXRlcyB0aGF0IHRoaXMgaXMgYSBub24tcHJvZHVjdGlvbiBidWlsZCB3aGVuIHByZXNlbnQuIFR5cGljYWxseSB3aWxsIHRha2UgdGhlIHZhbHVlczpcclxuICogICAnZGV2JyAtIEEgbm9ybWFsIGRldiBkZXBsb3ltZW50LCB3aGljaCBnb2VzIHRvIHBoZXQtZGV2LmNvbG9yYWRvLmVkdS9odG1sL1xyXG4gKiAgICdyYycgLSAgQSByZWxlYXNlLWNhbmRpZGF0ZSBkZXBsb3ltZW50IChvZmYgb2YgYSByZWxlYXNlIGJyYW5jaCkuIEFsc28gZ29lcyB0byBwaGV0LWRldi5jb2xvcmFkby5lZHUvaHRtbC8gb25seS5cclxuICogICBhbnl0aGluZyBlbHNlIC0gQSBvbmUtb2ZmIGRlcGxveW1lbnQgbmFtZSwgd2hpY2ggaXMgdGhlIHNhbWUgbmFtZSBhcyB0aGUgYnJhbmNoIGl0IHdhcyBkZXBsb3llZCBmcm9tLlxyXG4gKiBURVNUX05VTUJFUiAod2hlbiBwcmVzZW50KTogSW5kaWNhdGVzIHRoZSB2ZXJzaW9uIG9mIHRoZSB0ZXN0L29uZS1vZmYgdHlwZSAoZ2V0cyBpbmNyZW1lbnRlZCBmb3IgZXZlcnkgZGVwbG95bWVudCkuXHJcbiAqICAgc3RhcnRzIGF0IDAgaW4gcGFja2FnZS5qc29uLCBidXQgc2luY2UgaXQgaXMgaW5jcmVtZW50ZWQgb24gZXZlcnkgZGVwbG95LCB0aGUgZmlyc3QgdmVyc2lvbiBwdWJsaXNoZWQgd2lsbCBiZSAxLlxyXG4gKlxyXG4gKiBJdCB1c2VkIHRvIGJlIChwcmUtY2hpcHBlci0yLjApIHRoYXQgc29tZXRpbWVzIGEgc2hvcnRlbmVkIGZvcm0gb2YgdGhlIChub24tJ3BoZXQnKSBicmFuZCB3b3VsZCBiZSBhZGRlZCB0byB0aGUgZW5kXHJcbiAqIChlLmcuICcxLjMuMC1kZXYuMS1waGV0aW8nIG9yICcxLjMuMC1kZXYuMS1hZGFwdGVkZnJvbXBoZXQnKSwgb3IgYXMgYSBkaXJlY3QgcHJlZml4IGZvciB0aGUgVEVTVF9UWVBFIChlLmcuXHJcbiAqIDEuMS4wLXBoZXRpb2Rldi4xIG9yIDEuMS4wLXBoZXRpbykuIFdlIGhhdmUgc2luY2UgbW92ZWQgdG8gYSBkZXBsb3ltZW50IG1vZGVsIHdoZXJlIHRoZXJlIGFyZVxyXG4gKiBzdWJkaXJlY3RvcmllcyBmb3IgZWFjaCBicmFuZCwgc28gdGhpcyBpcyBubyBsb25nZXIgcGFydCBvZiB0aGUgdmVyc2lvbi4gU2luY2UgdGhpcyB3YXMgbm90IHVzZWQgZm9yIGFueSBwcm9kdWN0aW9uIHNpbVxyXG4gKiBidWlsZHMgdGhhdCB3ZSBuZWVkIHN0YXRpc3RpY3MgZnJvbSwgaXQgaXMgZXhjbHVkZWQgaW4gU2ltVmVyc2lvbi5qcyBvciBpdHMgZGVzY3JpcHRpb24uXHJcbiAqXHJcbiAqIEV4YW1wbGVzOlxyXG4gKlxyXG4gKiAxLjUuMCAgICAgICAgICAgICAgICAtIFByb2R1Y3Rpb24gc2ltdWxhdGlvbiB2ZXJzaW9uIChubyB0ZXN0IHR5cGUpLiBNYWpvciA9IDEsIG1pbm9yID0gNSwgbWFpbnRlbmFuY2UgPSAwXHJcbiAqIDEuNS4wLXJjLjEgICAgICAgICAgIC0gRXhhbXBsZSBvZiBhIHJlbGVhc2UtY2FuZGlkYXRlIGJ1aWxkIHZlcnNpb24gdGhhdCB3b3VsZCBiZSBwdWJsaXNoZWQgYmVmb3JlICcxLjUuMCcgZm9yIHRlc3RpbmcuXHJcbiAqIDEuNS4wLWRldi4xICAgICAgICAgIC0gRXhhbXBsZSBvZiBhIGRldiBidWlsZCB0aGF0IHdvdWxkIGJlIGZyb20gbWFpbi5cclxuICogMS41LjAtc29uaWZpY2F0aW9uLjEgLSBFeGFtcGxlIG9mIGEgb25lLW9mZiBidWlsZCAod2hpY2ggd291bGQgYmUgZnJvbSB0aGUgYnJhbmNoICdzb25pZmljYXRpb24nKVxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuLyogZXNsaW50LWVudiBicm93c2VyLCBub2RlICovXHJcblxyXG4oIGZ1bmN0aW9uKCBnbG9iYWwgKSB7XHJcblxyXG4gIC8vIFRvIHN1cHBvcnQgbG9hZGluZyBpbiBOb2RlLmpzIGFuZCB0aGUgYnJvd3NlclxyXG4gIGNvbnN0IGFzc2VydCA9IHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gcmVxdWlyZSggJ2Fzc2VydCcgKSA6IGdsb2JhbCAmJiBnbG9iYWwuYXNzZXJ0O1xyXG5cclxuICBjbGFzcyBTaW1WZXJzaW9uIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEBjb25zdHJ1Y3RvclxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gbWFqb3IgLSBUaGUgbWFqb3IgcGFydCBvZiB0aGUgdmVyc2lvbiAodGhlIDMgaW4gMy4xLjIpXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IG1pbm9yIC0gVGhlIG1pbm9yIHBhcnQgb2YgdGhlIHZlcnNpb24gKHRoZSAxIGluIDMuMS4yKVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSBtYWludGVuYW5jZSAtIFRoZSBtYWludGVuYW5jZSBwYXJ0IG9mIHRoZSB2ZXJzaW9uICh0aGUgMiBpbiAzLjEuMilcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoIG1ham9yLCBtaW5vciwgbWFpbnRlbmFuY2UsIG9wdGlvbnMgPSB7fSApIHtcclxuXHJcbiAgICAgIGlmICggdHlwZW9mIG1ham9yID09PSAnc3RyaW5nJyApIHtcclxuICAgICAgICBtYWpvciA9IE51bWJlciggbWFqb3IgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIHR5cGVvZiBtaW5vciA9PT0gJ3N0cmluZycgKSB7XHJcbiAgICAgICAgbWlub3IgPSBOdW1iZXIoIG1pbm9yICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCB0eXBlb2YgbWFpbnRlbmFuY2UgPT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgIG1haW50ZW5hbmNlID0gTnVtYmVyKCBtYWludGVuYW5jZSApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggdHlwZW9mIG9wdGlvbnMudGVzdE51bWJlciA9PT0gJ3N0cmluZycgKSB7XHJcbiAgICAgICAgb3B0aW9ucy50ZXN0TnVtYmVyID0gTnVtYmVyKCBvcHRpb25zLnRlc3ROdW1iZXIgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3Qge1xyXG4gICAgICAgIC8vIHtzdHJpbmd8bnVsbH0gLSBJZiBwcm92aWRlZCwgaW5kaWNhdGVzIHRoZSB0aW1lIGF0IHdoaWNoIHRoZSBzaW0gZmlsZSB3YXMgYnVpbHRcclxuICAgICAgICBidWlsZFRpbWVzdGFtcCA9IG51bGwsXHJcblxyXG4gICAgICAgIC8vIHtzdHJpbmd8bnVsbH0gLSBUaGUgdGVzdCBuYW1lLCBlLmcuIHRoZSAncmMnIGluIHJjLjEuIEFsc28gY2FuIGJlIHRoZSBvbmUtb2ZmIHZlcnNpb24gbmFtZSwgaWYgcHJvdmlkZWQuXHJcbiAgICAgICAgdGVzdFR5cGUgPSBudWxsLFxyXG5cclxuICAgICAgICAvLyB7bnVtYmVyfHN0cmluZ3xudWxsfSAtIFRoZSB0ZXN0IG51bWJlciwgZS5nLiB0aGUgMSBpbiByYy4xXHJcbiAgICAgICAgdGVzdE51bWJlciA9IG51bGxcclxuICAgICAgfSA9IG9wdGlvbnM7XHJcblxyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2YgbWFqb3IgPT09ICdudW1iZXInICYmIG1ham9yID49IDAgJiYgbWFqb3IgJSAxID09PSAwLCBgbWFqb3IgdmVyc2lvbiBzaG91bGQgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlcjogJHttYWpvcn1gICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiBtaW5vciA9PT0gJ251bWJlcicgJiYgbWlub3IgPj0gMCAmJiBtaW5vciAlIDEgPT09IDAsIGBtaW5vciB2ZXJzaW9uIHNob3VsZCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyOiAke21pbm9yfWAgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIG1haW50ZW5hbmNlID09PSAnbnVtYmVyJyAmJiBtYWludGVuYW5jZSA+PSAwICYmIG1haW50ZW5hbmNlICUgMSA9PT0gMCwgYG1haW50ZW5hbmNlIHZlcnNpb24gc2hvdWxkIGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXI6ICR7bWFpbnRlbmFuY2V9YCApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2YgdGVzdFR5cGUgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiB0ZXN0TnVtYmVyID09PSAnbnVtYmVyJywgJ2lmIHRlc3RUeXBlIGlzIHByb3ZpZGVkLCB0ZXN0TnVtYmVyIHNob3VsZCBiZSBhIG51bWJlcicgKTtcclxuXHJcbiAgICAgIC8vIEBwdWJsaWMge251bWJlcn1cclxuICAgICAgdGhpcy5tYWpvciA9IG1ham9yO1xyXG5cclxuICAgICAgLy8gQHB1YmxpYyB7bnVtYmVyfVxyXG4gICAgICB0aGlzLm1pbm9yID0gbWlub3I7XHJcblxyXG4gICAgICAvLyBAcHVibGljIHtudW1iZXJ9XHJcbiAgICAgIHRoaXMubWFpbnRlbmFuY2UgPSBtYWludGVuYW5jZTtcclxuXHJcbiAgICAgIC8vIEBwdWJsaWMge3N0cmluZ3xudWxsfVxyXG4gICAgICB0aGlzLnRlc3RUeXBlID0gdGVzdFR5cGU7XHJcblxyXG4gICAgICAvLyBAcHVibGljIHtudW1iZXJ8bnVsbH1cclxuICAgICAgdGhpcy50ZXN0TnVtYmVyID0gdGVzdE51bWJlcjtcclxuXHJcbiAgICAgIC8vIEBwdWJsaWMge3N0cmluZ3xudWxsfSAtIElmIHByb3ZpZGVkLCBsaWtlICcyMDE1LTA2LTEyIDE2OjA1OjAzIFVUQycgKHBoZXQuY2hpcHBlci5idWlsZFRpbWVzdGFtcClcclxuICAgICAgdGhpcy5idWlsZFRpbWVzdGFtcCA9IGJ1aWxkVGltZXN0YW1wO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29udmVydCBpbnRvIGEgcGxhaW4gSlMgb2JqZWN0IG1lYW50IGZvciBKU09OIHNlcmlhbGl6YXRpb24uXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge09iamVjdH0gLSB3aXRoIHByb3BlcnRpZXMgbGlrZSBtYWpvciwgbWlub3IsIG1haW50ZW5hbmNlLCB0ZXN0VHlwZSwgdGVzdE51bWJlciwgYW5kIGJ1aWxkVGltZXN0YW1wXHJcbiAgICAgKi9cclxuICAgIHNlcmlhbGl6ZSgpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBtYWpvcjogdGhpcy5tYWpvcixcclxuICAgICAgICBtaW5vcjogdGhpcy5taW5vcixcclxuICAgICAgICBtYWludGVuYW5jZTogdGhpcy5tYWludGVuYW5jZSxcclxuICAgICAgICB0ZXN0VHlwZTogdGhpcy50ZXN0VHlwZSxcclxuICAgICAgICB0ZXN0TnVtYmVyOiB0aGlzLnRlc3ROdW1iZXIsXHJcbiAgICAgICAgYnVpbGRUaW1lc3RhbXA6IHRoaXMuYnVpbGRUaW1lc3RhbXBcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICogQGlnbm9yZSAtIG5vdCBuZWVkZWQgYnkgUGhFVC1pTyBDbGllbnRzXHJcbiAgICAgKi9cclxuICAgIGdldCBpc1NpbU5vdFB1Ymxpc2hlZCgpIHtcclxuICAgICAgcmV0dXJuIHRoaXMubWFqb3IgPCAxIHx8IC8vIGUuZy4gMC4wLjAtZGV2LjFcclxuICAgICAgICAgICAgICggdGhpcy5tYWpvciA9PT0gMSAmJiAvLyBlLmcuIDEuMC4wLWRldi4xXHJcbiAgICAgICAgICAgICAgIHRoaXMubWlub3IgPT09IDAgJiZcclxuICAgICAgICAgICAgICAgdGhpcy5tYWludGVuYW5jZSA9PT0gMCAmJlxyXG4gICAgICAgICAgICAgICB0aGlzLnRlc3RUeXBlICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqIEBpZ25vcmUgLSBub3QgbmVlZGVkIGJ5IFBoRVQtaU8gQ2xpZW50c1xyXG4gICAgICovXHJcbiAgICBnZXQgaXNTaW1QdWJsaXNoZWQoKSB7XHJcbiAgICAgIHJldHVybiAhdGhpcy5pc1NpbU5vdFB1Ymxpc2hlZDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRha2VzIGEgc2VyaWFsaXplZCBmb3JtIG9mIHRoZSBTaW1WZXJzaW9uIGFuZCByZXR1cm5zIGFuIGFjdHVhbCBpbnN0YW5jZS5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gLSB3aXRoIHByb3BlcnRpZXMgbGlrZSBtYWpvciwgbWlub3IsIG1haW50ZW5hbmNlLCB0ZXN0VHlwZSwgdGVzdE51bWJlciwgYW5kIGJ1aWxkVGltZXN0YW1wXHJcbiAgICAgKiBAcmV0dXJucyB7U2ltVmVyc2lvbn1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGRlc2VyaWFsaXplKCB7IG1ham9yLCBtaW5vciwgbWFpbnRlbmFuY2UsIHRlc3RUeXBlLCB0ZXN0TnVtYmVyLCBidWlsZFRpbWVzdGFtcCB9ICkge1xyXG4gICAgICByZXR1cm4gbmV3IFNpbVZlcnNpb24oIG1ham9yLCBtaW5vciwgbWFpbnRlbmFuY2UsIHtcclxuICAgICAgICB0ZXN0VHlwZTogdGVzdFR5cGUsXHJcbiAgICAgICAgdGVzdE51bWJlcjogdGVzdE51bWJlcixcclxuICAgICAgICBidWlsZFRpbWVzdGFtcDogYnVpbGRUaW1lc3RhbXBcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29tcGFyZXMgdmVyc2lvbnMsIHJldHVybmluZyAtMSBpZiB0aGlzIHZlcnNpb24gaXMgYmVmb3JlIHRoZSBwYXNzZWQgaW4gdmVyc2lvbiwgMCBpZiBlcXVhbCwgb3IgMSBpZiB0aGlzIHZlcnNpb25cclxuICAgICAqIGlzIGFmdGVyLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIFRoaXMgZnVuY3Rpb24gb25seSBjb21wYXJlcyBtYWpvci9taW5vci9tYWludGVuYW5jZSwgbGVhdmluZyBvdGhlciBkZXRhaWxzIHRvIHRoZSBjbGllbnQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTaW1WZXJzaW9ufSB2ZXJzaW9uXHJcbiAgICAgKi9cclxuICAgIGNvbXBhcmVOdW1iZXIoIHZlcnNpb24gKSB7XHJcbiAgICAgIHJldHVybiBTaW1WZXJzaW9uLmNvbXBhcmF0b3IoIHRoaXMsIHZlcnNpb24gKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbXBhcmVzIHZlcnNpb25zIGluIHN0YW5kYXJkIFwiY29tcGFyYXRvclwiIHN0YXRpYyBmb3JtYXQsIHJldHVybmluZyAtMSBpZiB0aGUgZmlyc3QgcGFyYW1ldGVyIFNpbVZlcnNpb24gaXNcclxuICAgICAqIGJlZm9yZSB0aGUgc2Vjb25kIHBhcmFtZXRlciBTaW1WZXJzaW9uIGluIHZlcnNpb24tc3RyaW5nLCAwIGlmIGVxdWFsLCBvciAxIGlmIHRoZSBmaXJzdCBwYXJhbWV0ZXIgU2ltVmVyc2lvbiBpc1xyXG4gICAgICogYWZ0ZXIuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogVGhpcyBmdW5jdGlvbiBvbmx5IGNvbXBhcmVzIG1ham9yL21pbm9yL21haW50ZW5hbmNlLCBsZWF2aW5nIG90aGVyIGRldGFpbHMgdG8gdGhlIGNsaWVudC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1NpbVZlcnNpb259IGFcclxuICAgICAqIEBwYXJhbSB7U2ltVmVyc2lvbn0gYlxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgY29tcGFyYXRvciggYSwgYiApIHtcclxuICAgICAgaWYgKCBhLm1ham9yIDwgYi5tYWpvciApIHsgcmV0dXJuIC0xOyB9XHJcbiAgICAgIGlmICggYS5tYWpvciA+IGIubWFqb3IgKSB7IHJldHVybiAxOyB9XHJcbiAgICAgIGlmICggYS5taW5vciA8IGIubWlub3IgKSB7IHJldHVybiAtMTsgfVxyXG4gICAgICBpZiAoIGEubWlub3IgPiBiLm1pbm9yICkgeyByZXR1cm4gMTsgfVxyXG4gICAgICBpZiAoIGEubWFpbnRlbmFuY2UgPCBiLm1haW50ZW5hbmNlICkgeyByZXR1cm4gLTE7IH1cclxuICAgICAgaWYgKCBhLm1haW50ZW5hbmNlID4gYi5tYWludGVuYW5jZSApIHsgcmV0dXJuIDE7IH1cclxuICAgICAgcmV0dXJuIDA7IC8vIGVxdWFsXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIHNwZWNpZmllZCB2ZXJzaW9uIGlzIHN0cmljdGx5IGFmdGVyIHRoaXMgdmVyc2lvblxyXG4gICAgICogQHBhcmFtIHtTaW1WZXJzaW9ufSB2ZXJzaW9uXHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqL1xyXG4gICAgaXNBZnRlciggdmVyc2lvbiApIHtcclxuICAgICAgcmV0dXJuIHRoaXMuY29tcGFyZU51bWJlciggdmVyc2lvbiApID09PSAxO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBzcGVjaWZpZWQgdmVyc2lvbiBtYXRjaGVzIG9yIGNvbWVzIGJlZm9yZSB0aGlzIHZlcnNpb24uXHJcbiAgICAgKiBAcGFyYW0gdmVyc2lvblxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKi9cclxuICAgIGlzQmVmb3JlT3JFcXVhbFRvKCB2ZXJzaW9uICkge1xyXG4gICAgICByZXR1cm4gdGhpcy5jb21wYXJlTnVtYmVyKCB2ZXJzaW9uICkgPD0gMDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIHN0cmluZyBmb3JtIG9mIHRoZSB2ZXJzaW9uLiBMaWtlIFwiMS4zLjVcIi5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICB0b1N0cmluZygpIHtcclxuICAgICAgbGV0IHN0ciA9IGAke3RoaXMubWFqb3J9LiR7dGhpcy5taW5vcn0uJHt0aGlzLm1haW50ZW5hbmNlfWA7XHJcbiAgICAgIGlmICggdHlwZW9mIHRoaXMudGVzdFR5cGUgPT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgIHN0ciArPSBgLSR7dGhpcy50ZXN0VHlwZX0uJHt0aGlzLnRlc3ROdW1iZXJ9YDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gc3RyO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUGFyc2VzIGEgc2ltIHZlcnNpb24gZnJvbSBhIHN0cmluZyBmb3JtLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2ZXJzaW9uU3RyaW5nIC0gZS5nLiAnMS4wLjAnLCAnMS4wLjEtZGV2LjMnLCBldGMuXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2J1aWxkVGltZXN0YW1wXSAtIE9wdGlvbmFsIGJ1aWxkIHRpbWVzdGFtcCwgbGlrZSAnMjAxNS0wNi0xMiAxNjowNTowMyBVVEMnIChwaGV0LmNoaXBwZXIuYnVpbGRUaW1lc3RhbXApXHJcbiAgICAgKiBAcmV0dXJucyB7U2ltVmVyc2lvbn1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIHBhcnNlKCB2ZXJzaW9uU3RyaW5nLCBidWlsZFRpbWVzdGFtcCApIHtcclxuICAgICAgY29uc3QgbWF0Y2hlcyA9IHZlcnNpb25TdHJpbmcubWF0Y2goIC9eKFxcZCspXFwuKFxcZCspXFwuKFxcZCspKC0oKFteLi1dKylcXC4oXFxkKykpKT8oLShbXi4tXSspKT8kLyApO1xyXG5cclxuICAgICAgaWYgKCAhbWF0Y2hlcyApIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIGBjb3VsZCBub3QgcGFyc2UgdmVyc2lvbjogJHt2ZXJzaW9uU3RyaW5nfWAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgbWFqb3IgPSBOdW1iZXIoIG1hdGNoZXNbIDEgXSApO1xyXG4gICAgICBjb25zdCBtaW5vciA9IE51bWJlciggbWF0Y2hlc1sgMiBdICk7XHJcbiAgICAgIGNvbnN0IG1haW50ZW5hbmNlID0gTnVtYmVyKCBtYXRjaGVzWyAzIF0gKTtcclxuICAgICAgY29uc3QgdGVzdFR5cGUgPSBtYXRjaGVzWyA2IF07XHJcbiAgICAgIGNvbnN0IHRlc3ROdW1iZXIgPSBtYXRjaGVzWyA3IF0gPT09IHVuZGVmaW5lZCA/IG1hdGNoZXNbIDcgXSA6IE51bWJlciggbWF0Y2hlc1sgNyBdICk7XHJcblxyXG4gICAgICByZXR1cm4gbmV3IFNpbVZlcnNpb24oIG1ham9yLCBtaW5vciwgbWFpbnRlbmFuY2UsIHtcclxuICAgICAgICB0ZXN0VHlwZTogdGVzdFR5cGUsXHJcbiAgICAgICAgdGVzdE51bWJlcjogdGVzdE51bWJlcixcclxuICAgICAgICBidWlsZFRpbWVzdGFtcDogYnVpbGRUaW1lc3RhbXBcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUGFyc2VzIGEgYnJhbmNoIGluIHRoZSBmb3JtIHt7TUFKT1J9fS57e01JTk9SfX0gYW5kIHJldHVybnMgYSBjb3JyZXNwb25kaW5nIHZlcnNpb24uIFVzZXMgMCBmb3IgdGhlIG1haW50ZW5hbmNlIHZlcnNpb24gKHVua25vd24pLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBicmFuY2ggLSBlLmcuICcxLjAnXHJcbiAgICAgKiBAcmV0dXJucyB7U2ltVmVyc2lvbn1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGZyb21CcmFuY2goIGJyYW5jaCApIHtcclxuICAgICAgY29uc3QgYml0cyA9IGJyYW5jaC5zcGxpdCggJy4nICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGJpdHMubGVuZ3RoID09PSAyLCBgQmFkIGJyYW5jaCwgc2hvdWxkIGJlIHt7TUFKT1J9fS57e01JTk9SfX0sIGhhZDogJHticmFuY2h9YCApO1xyXG5cclxuICAgICAgY29uc3QgbWFqb3IgPSBOdW1iZXIoIGJyYW5jaC5zcGxpdCggJy4nIClbIDAgXSApO1xyXG4gICAgICBjb25zdCBtaW5vciA9IE51bWJlciggYnJhbmNoLnNwbGl0KCAnLicgKVsgMSBdICk7XHJcblxyXG4gICAgICByZXR1cm4gbmV3IFNpbVZlcnNpb24oIG1ham9yLCBtaW5vciwgMCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW5zdXJlcyB0aGF0IGEgYnJhbmNoIG5hbWUgaXMgb2sgdG8gYmUgYSByZWxlYXNlIGJyYW5jaC5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYnJhbmNoIC0gZS5nLiAnMS4wJ1xyXG4gICAgICogQGlnbm9yZSAtIG5vdCBuZWVkZWQgYnkgUGhFVC1pTyBDbGllbnRzXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBlbnN1cmVSZWxlYXNlQnJhbmNoKCBicmFuY2ggKSB7XHJcbiAgICAgIGNvbnN0IHZlcnNpb24gPSBTaW1WZXJzaW9uLmZyb21CcmFuY2goIGJyYW5jaC5zcGxpdCggJy0nIClbIDAgXSApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB2ZXJzaW9uLm1ham9yID4gMCwgJ01ham9yIHZlcnNpb24gZm9yIGEgYnJhbmNoIHNob3VsZCBiZSBncmVhdGVyIHRoYW4gemVybycgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdmVyc2lvbi5taW5vciA+PSAwLCAnTWlub3IgdmVyc2lvbiBmb3IgYSBicmFuY2ggc2hvdWxkIGJlIGdyZWF0ZXIgdGhhbiAob3IgZXF1YWwpIHRvIHplcm8nICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBOb2RlLmpzLWNvbXBhdGlibGUgZGVmaW5pdGlvblxyXG4gIGlmICggdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFNpbVZlcnNpb247XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG5cclxuICAgIC8vIEJyb3dzZXIgc3VwcG9ydCwgYXNzaWduIHdpdGhcclxuICAgIHdpbmRvdy5waGV0ID0gd2luZG93LnBoZXQgfHwge307XHJcbiAgICB3aW5kb3cucGhldC5wcmVsb2FkcyA9IHdpbmRvdy5waGV0LnByZWxvYWRzIHx8IHt9O1xyXG4gICAgd2luZG93LnBoZXQucHJlbG9hZHMuY2hpcHBlciA9IHdpbmRvdy5waGV0LnByZWxvYWRzLmNoaXBwZXIgfHwge307XHJcbiAgICB3aW5kb3cucGhldC5wcmVsb2Fkcy5jaGlwcGVyLlNpbVZlcnNpb24gPSBTaW1WZXJzaW9uO1xyXG4gIH1cclxufSApKCAoIDEsIGV2YWwgKSggJ3RoaXMnICkgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1ldmFsXHJcbi8vIEluZGlyZWN0IGV2YWwgdXNhZ2UgZG9uZSBzaW5jZSBiYWJlbCBsaWtlcyB0byB3cmFwIHRoaW5ncyBpbiBzdHJpY3QgbW9kZS5cclxuLy8gU2VlIGh0dHA6Ly9wZXJmZWN0aW9ua2lsbHMuY29tL3VubmVjZXNzYXJpbHktY29tcHJlaGVuc2l2ZS1sb29rLWludG8tYS1yYXRoZXItaW5zaWduaWZpY2FudC1pc3N1ZS1vZi1nbG9iYWwtb2JqZWN0cy1jcmVhdGlvbi8jZWNtYXNjcmlwdF81X3N0cmljdF9tb2RlIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUEsQ0FBRSxVQUFVQSxNQUFNLEVBQUc7RUFFbkI7RUFDQSxNQUFNQyxNQUFNLEdBQUcsT0FBT0MsTUFBTSxLQUFLLFdBQVcsR0FBR0MsT0FBTyxDQUFFLFFBQVMsQ0FBQyxHQUFHSCxNQUFNLElBQUlBLE1BQU0sQ0FBQ0MsTUFBTTtFQUU1RixNQUFNRyxVQUFVLENBQUM7SUFFZjtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBQ0lDLFdBQVdBLENBQUVDLEtBQUssRUFBRUMsS0FBSyxFQUFFQyxXQUFXLEVBQUVDLE9BQU8sR0FBRyxDQUFDLENBQUMsRUFBRztNQUVyRCxJQUFLLE9B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