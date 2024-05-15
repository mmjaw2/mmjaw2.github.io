"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task checks out the shas for a project, as specified in a dependencies.json file in its top level.
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var assert = require('assert');
var child_process = require('child_process');
var grunt = require('grunt');

/**
 * NOTE: This is somewhat vestigial, kept to ensure some build-server behavior for now.
 * TODO(chipper1.0) https://github.com/phetsims/perennial/issues/169 remove this when possible (when all chipper 1.0 usage is not required, since all sims are chipper 2.0+)
 *
 * @param {string} repositoryName name field from package.json
 * @param {boolean} toMain whether main should be used, or dependencies.json shas should be used
 * @param {boolean} buildServer whether this build is initiated by the build server
 */
module.exports = function (repositoryName, toMain, buildServer) {
  var dependencies = grunt.file.readJSON(buildServer ? '../perennial/js/build-server/tmp/dependencies.json' : "../".concat(repositoryName, "/dependencies.json"));
  var done = grunt.task.current.async();
  var numToCheckOut = 0;
  var numCheckedOut = 0;
  for (var property in dependencies) {
    if (property !== 'comment' && property !== repositoryName) {
      numToCheckOut++;
    }
  }
  var _iterator = _createForOfIteratorHelper(dependencies),
    _step;
  try {
    var _loop = function _loop() {
      var property = _step.value;
      if (property !== 'comment' && property !== repositoryName && dependencies.hasOwnProperty(property)) {
        assert(typeof dependencies[property].branch !== 'undefined' && typeof dependencies[property].sha !== 'undefined');
        grunt.log.writeln("Checking out dependency ".concat(property, ": ").concat(dependencies[property].branch, "@").concat(dependencies[property].sha));

        //To execute something from a different directory:
        //cp.exec('foocommand', { cwd: 'path/to/dir/' }, callback);
        //http://stackoverflow.com/questions/14026967/calling-child-process-exec-in-node-as-though-it-was-executed-in-a-specific-folde
        var command = "git checkout ".concat(toMain ? 'main' : dependencies[property].sha);
        child_process.exec(command, {
          cwd: "../".concat(property)
        }, function (error1, stdout1, stderr1) {
          assert(!error1, "error in ".concat(command, " for repo ").concat(property));
          grunt.log.writeln('Finished checkout.');
          grunt.log.writeln(stdout1);
          grunt.log.writeln(stderr1);
          numCheckedOut = numCheckedOut + 1;
          if (numToCheckOut === numCheckedOut) {
            done();
          }
        });
      }
    };
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      _loop();
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3NlcnQiLCJyZXF1aXJlIiwiY2hpbGRfcHJvY2VzcyIsImdydW50IiwibW9kdWxlIiwiZXhwb3J0cyIsInJlcG9zaXRvcnlOYW1lIiwidG9NYWluIiwiYnVpbGRTZXJ2ZXIiLCJkZXBlbmRlbmNpZXMiLCJmaWxlIiwicmVhZEpTT04iLCJjb25jYXQiLCJkb25lIiwidGFzayIsImN1cnJlbnQiLCJhc3luYyIsIm51bVRvQ2hlY2tPdXQiLCJudW1DaGVja2VkT3V0IiwicHJvcGVydHkiLCJfaXRlcmF0b3IiLCJfY3JlYXRlRm9yT2ZJdGVyYXRvckhlbHBlciIsIl9zdGVwIiwiX2xvb3AiLCJ2YWx1ZSIsImhhc093blByb3BlcnR5IiwiYnJhbmNoIiwic2hhIiwibG9nIiwid3JpdGVsbiIsImNvbW1hbmQiLCJleGVjIiwiY3dkIiwiZXJyb3IxIiwic3Rkb3V0MSIsInN0ZGVycjEiLCJzIiwibiIsImVyciIsImUiLCJmIl0sInNvdXJjZXMiOlsiY2hlY2tvdXRTaGFzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDAyLTIwMTUsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFRoaXMgZ3J1bnQgdGFzayBjaGVja3Mgb3V0IHRoZSBzaGFzIGZvciBhIHByb2plY3QsIGFzIHNwZWNpZmllZCBpbiBhIGRlcGVuZGVuY2llcy5qc29uIGZpbGUgaW4gaXRzIHRvcCBsZXZlbC5cclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoICdhc3NlcnQnICk7XHJcbmNvbnN0IGNoaWxkX3Byb2Nlc3MgPSByZXF1aXJlKCAnY2hpbGRfcHJvY2VzcycgKTtcclxuY29uc3QgZ3J1bnQgPSByZXF1aXJlKCAnZ3J1bnQnICk7XHJcblxyXG4vKipcclxuICogTk9URTogVGhpcyBpcyBzb21ld2hhdCB2ZXN0aWdpYWwsIGtlcHQgdG8gZW5zdXJlIHNvbWUgYnVpbGQtc2VydmVyIGJlaGF2aW9yIGZvciBub3cuXHJcbiAqIFRPRE8oY2hpcHBlcjEuMCkgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BlcmVubmlhbC9pc3N1ZXMvMTY5IHJlbW92ZSB0aGlzIHdoZW4gcG9zc2libGUgKHdoZW4gYWxsIGNoaXBwZXIgMS4wIHVzYWdlIGlzIG5vdCByZXF1aXJlZCwgc2luY2UgYWxsIHNpbXMgYXJlIGNoaXBwZXIgMi4wKylcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG9zaXRvcnlOYW1lIG5hbWUgZmllbGQgZnJvbSBwYWNrYWdlLmpzb25cclxuICogQHBhcmFtIHtib29sZWFufSB0b01haW4gd2hldGhlciBtYWluIHNob3VsZCBiZSB1c2VkLCBvciBkZXBlbmRlbmNpZXMuanNvbiBzaGFzIHNob3VsZCBiZSB1c2VkXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gYnVpbGRTZXJ2ZXIgd2hldGhlciB0aGlzIGJ1aWxkIGlzIGluaXRpYXRlZCBieSB0aGUgYnVpbGQgc2VydmVyXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCByZXBvc2l0b3J5TmFtZSwgdG9NYWluLCBidWlsZFNlcnZlciApIHtcclxuXHJcbiAgY29uc3QgZGVwZW5kZW5jaWVzID0gZ3J1bnQuZmlsZS5yZWFkSlNPTiggKCBidWlsZFNlcnZlciApID8gJy4uL3BlcmVubmlhbC9qcy9idWlsZC1zZXJ2ZXIvdG1wL2RlcGVuZGVuY2llcy5qc29uJyA6IGAuLi8ke3JlcG9zaXRvcnlOYW1lfS9kZXBlbmRlbmNpZXMuanNvbmAgKTtcclxuICBjb25zdCBkb25lID0gZ3J1bnQudGFzay5jdXJyZW50LmFzeW5jKCk7XHJcbiAgbGV0IG51bVRvQ2hlY2tPdXQgPSAwO1xyXG4gIGxldCBudW1DaGVja2VkT3V0ID0gMDtcclxuICBmb3IgKCBjb25zdCBwcm9wZXJ0eSBpbiBkZXBlbmRlbmNpZXMgKSB7XHJcbiAgICBpZiAoIHByb3BlcnR5ICE9PSAnY29tbWVudCcgJiYgcHJvcGVydHkgIT09IHJlcG9zaXRvcnlOYW1lICkge1xyXG4gICAgICBudW1Ub0NoZWNrT3V0Kys7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmb3IgKCBjb25zdCBwcm9wZXJ0eSBvZiBkZXBlbmRlbmNpZXMgKSB7XHJcbiAgICBpZiAoIHByb3BlcnR5ICE9PSAnY29tbWVudCcgJiYgcHJvcGVydHkgIT09IHJlcG9zaXRvcnlOYW1lICYmIGRlcGVuZGVuY2llcy5oYXNPd25Qcm9wZXJ0eSggcHJvcGVydHkgKSApIHtcclxuICAgICAgYXNzZXJ0KCB0eXBlb2YgZGVwZW5kZW5jaWVzWyBwcm9wZXJ0eSBdLmJyYW5jaCAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGRlcGVuZGVuY2llc1sgcHJvcGVydHkgXS5zaGEgIT09ICd1bmRlZmluZWQnICk7XHJcblxyXG4gICAgICBncnVudC5sb2cud3JpdGVsbiggYENoZWNraW5nIG91dCBkZXBlbmRlbmN5ICR7cHJvcGVydHl9OiAke2RlcGVuZGVuY2llc1sgcHJvcGVydHkgXS5icmFuY2h9QCR7ZGVwZW5kZW5jaWVzWyBwcm9wZXJ0eSBdLnNoYX1gICk7XHJcblxyXG4gICAgICAvL1RvIGV4ZWN1dGUgc29tZXRoaW5nIGZyb20gYSBkaWZmZXJlbnQgZGlyZWN0b3J5OlxyXG4gICAgICAvL2NwLmV4ZWMoJ2Zvb2NvbW1hbmQnLCB7IGN3ZDogJ3BhdGgvdG8vZGlyLycgfSwgY2FsbGJhY2spO1xyXG4gICAgICAvL2h0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTQwMjY5NjcvY2FsbGluZy1jaGlsZC1wcm9jZXNzLWV4ZWMtaW4tbm9kZS1hcy10aG91Z2gtaXQtd2FzLWV4ZWN1dGVkLWluLWEtc3BlY2lmaWMtZm9sZGVcclxuICAgICAgY29uc3QgY29tbWFuZCA9IGBnaXQgY2hlY2tvdXQgJHt0b01haW4gPyAnbWFpbicgOiBkZXBlbmRlbmNpZXNbIHByb3BlcnR5IF0uc2hhfWA7XHJcbiAgICAgIGNoaWxkX3Byb2Nlc3MuZXhlYyggY29tbWFuZCwgeyBjd2Q6IGAuLi8ke3Byb3BlcnR5fWAgfSwgKCBlcnJvcjEsIHN0ZG91dDEsIHN0ZGVycjEgKSA9PiB7XHJcbiAgICAgICAgYXNzZXJ0KCAhZXJyb3IxLCBgZXJyb3IgaW4gJHtjb21tYW5kfSBmb3IgcmVwbyAke3Byb3BlcnR5fWAgKTtcclxuICAgICAgICBncnVudC5sb2cud3JpdGVsbiggJ0ZpbmlzaGVkIGNoZWNrb3V0LicgKTtcclxuICAgICAgICBncnVudC5sb2cud3JpdGVsbiggc3Rkb3V0MSApO1xyXG4gICAgICAgIGdydW50LmxvZy53cml0ZWxuKCBzdGRlcnIxICk7XHJcbiAgICAgICAgbnVtQ2hlY2tlZE91dCA9IG51bUNoZWNrZWRPdXQgKyAxO1xyXG4gICAgICAgIGlmICggbnVtVG9DaGVja091dCA9PT0gbnVtQ2hlY2tlZE91dCApIHtcclxuICAgICAgICAgIGRvbmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuICB9XHJcbn07Il0sIm1hcHBpbmdzIjoiOzs7OztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLElBQU1BLE1BQU0sR0FBR0MsT0FBTyxDQUFFLFFBQVMsQ0FBQztBQUNsQyxJQUFNQyxhQUFhLEdBQUdELE9BQU8sQ0FBRSxlQUFnQixDQUFDO0FBQ2hELElBQU1FLEtBQUssR0FBR0YsT0FBTyxDQUFFLE9BQVEsQ0FBQzs7QUFFaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBRyxNQUFNLENBQUNDLE9BQU8sR0FBRyxVQUFVQyxjQUFjLEVBQUVDLE1BQU0sRUFBRUMsV0FBVyxFQUFHO0VBRS9ELElBQU1DLFlBQVksR0FBR04sS0FBSyxDQUFDTyxJQUFJLENBQUNDLFFBQVEsQ0FBSUgsV0FBVyxHQUFLLG9EQUFvRCxTQUFBSSxNQUFBLENBQVNOLGNBQWMsdUJBQXFCLENBQUM7RUFDN0osSUFBTU8sSUFBSSxHQUFHVixLQUFLLENBQUNXLElBQUks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