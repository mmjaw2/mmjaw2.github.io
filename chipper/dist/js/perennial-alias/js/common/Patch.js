// Copyright 2018, University of Colorado Boulder

/**
 * Represents a specific patch being applied to a repository for maintenance purposes.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const assert = require('assert');
module.exports = function () {
  class Patch {
    /**
     * @public
     * @constructor
     *
     * @param {string} repo
     * @param {string} name
     * @param {string} message - Usually an issue URL, but can include other things
     * @param {Array.<string>} shas - SHAs used to cherry-pick
     */
    constructor(repo, name, message, shas = []) {
      assert(typeof repo === 'string');
      assert(typeof name === 'string');
      assert(typeof message === 'string');
      assert(Array.isArray(shas));
      shas.forEach(sha => assert(typeof sha === 'string'));

      // @public {string}
      this.repo = repo;
      this.name = name;
      this.message = message;

      // @public {Array.<string>}
      this.shas = shas;
    }

    /**
     * Convert into a plain JS object meant for JSON serialization.
     * @public
     *
     * @returns {Object}
     */
    serialize() {
      return {
        repo: this.repo,
        name: this.name,
        message: this.message,
        shas: this.shas
      };
    }

    /**
     * Takes a serialized form of the Patch and returns an actual instance.
     * @public
     *
     * @param {Object}
     * @returns {Patch}
     */
    static deserialize({
      repo,
      name,
      message,
      shas
    }) {
      return new Patch(repo, name, message, shas);
    }
  }
  return Patch;
}();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3NlcnQiLCJyZXF1aXJlIiwibW9kdWxlIiwiZXhwb3J0cyIsIlBhdGNoIiwiY29uc3RydWN0b3IiLCJyZXBvIiwibmFtZSIsIm1lc3NhZ2UiLCJzaGFzIiwiQXJyYXkiLCJpc0FycmF5IiwiZm9yRWFjaCIsInNoYSIsInNlcmlhbGl6ZSIsImRlc2VyaWFsaXplIl0sInNvdXJjZXMiOlsiUGF0Y2guanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFJlcHJlc2VudHMgYSBzcGVjaWZpYyBwYXRjaCBiZWluZyBhcHBsaWVkIHRvIGEgcmVwb3NpdG9yeSBmb3IgbWFpbnRlbmFuY2UgcHVycG9zZXMuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCAnYXNzZXJ0JyApO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoIGZ1bmN0aW9uKCkge1xyXG5cclxuICBjbGFzcyBQYXRjaCB7XHJcbiAgICAvKipcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqIEBjb25zdHJ1Y3RvclxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSBVc3VhbGx5IGFuIGlzc3VlIFVSTCwgYnV0IGNhbiBpbmNsdWRlIG90aGVyIHRoaW5nc1xyXG4gICAgICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gc2hhcyAtIFNIQXMgdXNlZCB0byBjaGVycnktcGlja1xyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvciggcmVwbywgbmFtZSwgbWVzc2FnZSwgc2hhcyA9IFtdICkge1xyXG4gICAgICBhc3NlcnQoIHR5cGVvZiByZXBvID09PSAnc3RyaW5nJyApO1xyXG4gICAgICBhc3NlcnQoIHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJyApO1xyXG4gICAgICBhc3NlcnQoIHR5cGVvZiBtZXNzYWdlID09PSAnc3RyaW5nJyApO1xyXG4gICAgICBhc3NlcnQoIEFycmF5LmlzQXJyYXkoIHNoYXMgKSApO1xyXG4gICAgICBzaGFzLmZvckVhY2goIHNoYSA9PiBhc3NlcnQoIHR5cGVvZiBzaGEgPT09ICdzdHJpbmcnICkgKTtcclxuXHJcbiAgICAgIC8vIEBwdWJsaWMge3N0cmluZ31cclxuICAgICAgdGhpcy5yZXBvID0gcmVwbztcclxuICAgICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcclxuXHJcbiAgICAgIC8vIEBwdWJsaWMge0FycmF5LjxzdHJpbmc+fVxyXG4gICAgICB0aGlzLnNoYXMgPSBzaGFzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29udmVydCBpbnRvIGEgcGxhaW4gSlMgb2JqZWN0IG1lYW50IGZvciBKU09OIHNlcmlhbGl6YXRpb24uXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge09iamVjdH1cclxuICAgICAqL1xyXG4gICAgc2VyaWFsaXplKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlcG86IHRoaXMucmVwbyxcclxuICAgICAgICBuYW1lOiB0aGlzLm5hbWUsXHJcbiAgICAgICAgbWVzc2FnZTogdGhpcy5tZXNzYWdlLFxyXG4gICAgICAgIHNoYXM6IHRoaXMuc2hhc1xyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGFrZXMgYSBzZXJpYWxpemVkIGZvcm0gb2YgdGhlIFBhdGNoIGFuZCByZXR1cm5zIGFuIGFjdHVhbCBpbnN0YW5jZS5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH1cclxuICAgICAqIEByZXR1cm5zIHtQYXRjaH1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGRlc2VyaWFsaXplKCB7IHJlcG8sIG5hbWUsIG1lc3NhZ2UsIHNoYXMgfSApIHtcclxuICAgICAgcmV0dXJuIG5ldyBQYXRjaCggcmVwbywgbmFtZSwgbWVzc2FnZSwgc2hhcyApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFBhdGNoO1xyXG59ICkoKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTUEsTUFBTSxHQUFHQyxPQUFPLENBQUUsUUFBUyxDQUFDO0FBRWxDQyxNQUFNLENBQUNDLE9BQU8sR0FBSyxZQUFXO0VBRTVCLE1BQU1DLEtBQUssQ0FBQztJQUNWO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNJQyxXQUFXQSxDQUFFQyxJQUFJLEVBQUVDLElBQUksRUFBRUMsT0FBTyxFQUFFQyxJQUFJLEdBQUcsRUFBRSxFQUFHO01BQzVDVCxNQUFNLENBQUUsT0FBT00sSUFBSSxLQUFLLFFBQVMsQ0FBQztNQUNsQ04sTUFBTSxDQUFFLE9BQU9PLElBQUksS0FBSyxRQUFTLENBQUM7TUFDbENQLE1BQU0sQ0FBRSxPQUFPUSxPQUFPLEtBQUssUUFBUyxDQUFDO01BQ3JDUixNQUFNLENBQUVVLEtBQUssQ0FBQ0MsT0FBTyxDQUFFRixJQUFLLENBQUUsQ0FBQztNQUMvQkEsSUFBSSxDQUFDRyxPQUFPLENBQUVDLEdBQUcsSUFBSWIsTUFBTSxDQUFFLE9BQU9hLEdBQUcsS0FBSyxRQUFTLENBQUUsQ0FBQzs7TUFFeEQ7TUFDQSxJQUFJLENBQUNQLElBQUksR0FBR0EsSUFBSTtNQUNoQixJQUFJLENBQUNDLElBQUksR0FBR0EsSUFBSTtNQUNoQixJQUFJLENBQUNDLE9BQU8sR0FBR0EsT0FBTzs7TUFFdEI7TUFDQSxJQUFJLENBQUNDLElBQUksR0FBR0EsSUFBSTtJQUNsQjs7SUFFQTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDSUssU0FBU0EsQ0FBQSxFQUFHO01BQ1YsT0FBTztRQUNMUixJQUFJLEVBQUUsSUFBSSxDQUFDQSxJQUFJO1FBQ2ZDLElBQUksRUFBRSxJQUFJLENBQUNBLElBQUk7UUFDZkMsT0FBTyxFQUFFLElBQUksQ0FBQ0EsT0FBTztRQUNyQkMsSUFBSSxFQUFFLElBQUksQ0FBQ0E7TUFDYixDQUFDO0lBQ0g7O0lBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDSSxPQUFPTSxXQUFXQSxDQUFFO01BQUVULElBQUk7TUFBRUMsSUFBSTtNQUFFQyxPQUFPO01BQUVDO0lBQUssQ0FBQyxFQUFHO01BQ2xELE9BQU8sSUFBSUwsS0FBSyxDQUFFRSxJQUFJLEVBQUVDLElBQUksRUFBRUMsT0FBTyxFQUFFQyxJQUFLLENBQUM7SUFDL0M7RUFDRjtFQUVBLE9BQU9MLEtBQUs7QUFDZCxDQUFDLENBQUcsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==