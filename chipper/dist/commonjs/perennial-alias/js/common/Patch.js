"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// Copyright 2018, University of Colorado Boulder

/**
 * Represents a specific patch being applied to a repository for maintenance purposes.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var assert = require('assert');
module.exports = function () {
  var Patch = /*#__PURE__*/function () {
    /**
     * @public
     * @constructor
     *
     * @param {string} repo
     * @param {string} name
     * @param {string} message - Usually an issue URL, but can include other things
     * @param {Array.<string>} shas - SHAs used to cherry-pick
     */
    function Patch(repo, name, message) {
      var shas = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
      _classCallCheck(this, Patch);
      assert(typeof repo === 'string');
      assert(typeof name === 'string');
      assert(typeof message === 'string');
      assert(Array.isArray(shas));
      shas.forEach(function (sha) {
        return assert(typeof sha === 'string');
      });

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
    return _createClass(Patch, [{
      key: "serialize",
      value: function serialize() {
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
    }], [{
      key: "deserialize",
      value: function deserialize(_ref) {
        var repo = _ref.repo,
          name = _ref.name,
          message = _ref.message,
          shas = _ref.shas;
        return new Patch(repo, name, message, shas);
      }
    }]);
  }();
  return Patch;
}();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3NlcnQiLCJyZXF1aXJlIiwibW9kdWxlIiwiZXhwb3J0cyIsIlBhdGNoIiwicmVwbyIsIm5hbWUiLCJtZXNzYWdlIiwic2hhcyIsImFyZ3VtZW50cyIsImxlbmd0aCIsInVuZGVmaW5lZCIsIl9jbGFzc0NhbGxDaGVjayIsIkFycmF5IiwiaXNBcnJheSIsImZvckVhY2giLCJzaGEiLCJfY3JlYXRlQ2xhc3MiLCJrZXkiLCJ2YWx1ZSIsInNlcmlhbGl6ZSIsImRlc2VyaWFsaXplIiwiX3JlZiJdLCJzb3VyY2VzIjpbIlBhdGNoLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBSZXByZXNlbnRzIGEgc3BlY2lmaWMgcGF0Y2ggYmVpbmcgYXBwbGllZCB0byBhIHJlcG9zaXRvcnkgZm9yIG1haW50ZW5hbmNlIHB1cnBvc2VzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSggJ2Fzc2VydCcgKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCBmdW5jdGlvbigpIHtcclxuXHJcbiAgY2xhc3MgUGF0Y2gge1xyXG4gICAgLyoqXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKiBAY29uc3RydWN0b3JcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIC0gVXN1YWxseSBhbiBpc3N1ZSBVUkwsIGJ1dCBjYW4gaW5jbHVkZSBvdGhlciB0aGluZ3NcclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IHNoYXMgLSBTSEFzIHVzZWQgdG8gY2hlcnJ5LXBpY2tcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoIHJlcG8sIG5hbWUsIG1lc3NhZ2UsIHNoYXMgPSBbXSApIHtcclxuICAgICAgYXNzZXJ0KCB0eXBlb2YgcmVwbyA9PT0gJ3N0cmluZycgKTtcclxuICAgICAgYXNzZXJ0KCB0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycgKTtcclxuICAgICAgYXNzZXJ0KCB0eXBlb2YgbWVzc2FnZSA9PT0gJ3N0cmluZycgKTtcclxuICAgICAgYXNzZXJ0KCBBcnJheS5pc0FycmF5KCBzaGFzICkgKTtcclxuICAgICAgc2hhcy5mb3JFYWNoKCBzaGEgPT4gYXNzZXJ0KCB0eXBlb2Ygc2hhID09PSAnc3RyaW5nJyApICk7XHJcblxyXG4gICAgICAvLyBAcHVibGljIHtzdHJpbmd9XHJcbiAgICAgIHRoaXMucmVwbyA9IHJlcG87XHJcbiAgICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XHJcblxyXG4gICAgICAvLyBAcHVibGljIHtBcnJheS48c3RyaW5nPn1cclxuICAgICAgdGhpcy5zaGFzID0gc2hhcztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnZlcnQgaW50byBhIHBsYWluIEpTIG9iamVjdCBtZWFudCBmb3IgSlNPTiBzZXJpYWxpemF0aW9uLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9XHJcbiAgICAgKi9cclxuICAgIHNlcmlhbGl6ZSgpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICByZXBvOiB0aGlzLnJlcG8sXHJcbiAgICAgICAgbmFtZTogdGhpcy5uYW1lLFxyXG4gICAgICAgIG1lc3NhZ2U6IHRoaXMubWVzc2FnZSxcclxuICAgICAgICBzaGFzOiB0aGlzLnNoYXNcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRha2VzIGEgc2VyaWFsaXplZCBmb3JtIG9mIHRoZSBQYXRjaCBhbmQgcmV0dXJucyBhbiBhY3R1YWwgaW5zdGFuY2UuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9XHJcbiAgICAgKiBAcmV0dXJucyB7UGF0Y2h9XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBkZXNlcmlhbGl6ZSggeyByZXBvLCBuYW1lLCBtZXNzYWdlLCBzaGFzIH0gKSB7XHJcbiAgICAgIHJldHVybiBuZXcgUGF0Y2goIHJlcG8sIG5hbWUsIG1lc3NhZ2UsIHNoYXMgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBQYXRjaDtcclxufSApKCk7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBTUEsTUFBTSxHQUFHQyxPQUFPLENBQUUsUUFBUyxDQUFDO0FBRWxDQyxNQUFNLENBQUNDLE9BQU8sR0FBSyxZQUFXO0VBQUEsSUFFdEJDLEtBQUs7SUFDVDtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDSSxTQUFBQSxNQUFhQyxJQUFJLEVBQUVDLElBQUksRUFBRUMsT0FBTyxFQUFjO01BQUEsSUFBWkMsSUFBSSxHQUFBQyxTQUFBLENBQUFDLE1BQUEsUUFBQUQsU0FBQSxRQUFBRSxTQUFBLEdBQUFGLFNBQUEsTUFBRyxFQUFFO01BQUFHLGVBQUEsT0FBQVIsS0FBQTtNQUN6Q0osTUFBTSxDQUFFLE9BQU9LLElBQUksS0FBSyxRQUFTLENBQUM7TUFDbENMLE1BQU0sQ0FBRSxPQUFPTSxJQUFJLEtBQUssUUFBUyxDQUFDO01BQ2xDTixNQUFNLENBQUUsT0FBT08sT0FBTyxLQUFLLFFBQVMsQ0FBQztNQUNyQ1AsTUFBTSxDQUFFYSxLQUFLLENBQUNDLE9BQU8sQ0FBRU4sSUFBSyxDQUFFLENBQUM7TUFDL0JBLElBQUksQ0FBQ08sT0FBTyxDQUFFLFVBQUFDLEdBQUc7UUFBQSxPQUFJaEIsTUFBTSxDQUFFLE9BQU9nQixHQUFHLEtBQUssUUFBUyxDQUFDO01BQUEsQ0FBQyxDQUFDOztNQUV4RDtNQUNBLElBQUksQ0FBQ1gsSUFBSSxHQUFHQSxJQUFJO01BQ2hCLElBQUksQ0FBQ0MsSUFBSSxHQUFHQSxJQUFJO01BQ2hCLElBQUksQ0FBQ0MsT0FBTyxHQUFHQSxPQUFPOztNQUV0QjtNQUNBLElBQUksQ0FBQ0MsSUFBSSxHQUFHQSxJQUFJO0lBQ2xCOztJQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUxJLE9BQUFTLFlBQUEsQ0FBQWIsS0FBQTtNQUFBYyxHQUFBO01BQUFDLEtBQUEsRUFNQSxTQUFBQyxVQUFBLEVBQVk7UUFDVixPQUFPO1VBQ0xmLElBQUksRUFBRSxJQUFJLENBQUNBLElBQUk7VUFDZkMsSUFBSSxFQUFFLElBQUksQ0FBQ0EsSUFBSTtVQUNmQyxPQUFPLEVBQUUsSUFBSSxDQUFDQSxPQUFPO1VBQ3JCQyxJQUFJLEVBQUUsSUFBSSxDQUFDQTtRQUNiLENBQUM7TUFDSDs7TUFFQTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQU5JO01BQUFVLEdBQUE7TUFBQUMsS0FBQSxFQU9BLFNBQUFFLFlBQUFDLElBQUEsRUFBb0Q7UUFBQSxJQUE5QmpCLElBQUksR0FBQWlCLElBQUEsQ0FBSmpCLElBQUk7VUFBRUMsSUFBSSxHQUFBZ0IsSUFBQSxDQUFKaEIsSUFBSTtVQUFFQyxPQUFPLEdBQUFlLElBQUEsQ0FBUGYsT0FBTztVQUFFQyxJQUFJLEdBQUFjLElBQUEsQ0FBSmQsSUFBSTtRQUM3QyxPQUFPLElBQUlKLEtBQUssQ0FBRUMsSUFBSSxFQUFFQyxJQUFJLEVBQUVDLE9BQU8sRUFBRUMsSUFBSyxDQUFDO01BQy9DO0lBQUM7RUFBQTtFQUdILE9BQU9KLEtBQUs7QUFDZCxDQUFDLENBQUcsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==