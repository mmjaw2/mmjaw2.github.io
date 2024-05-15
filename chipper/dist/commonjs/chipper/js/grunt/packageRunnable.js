"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
// Copyright 2017-2024, University of Colorado Boulder

/**
 * Combines all parts of a runnable's built file into one HTML file.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// modules
var assert = require('assert');
var ChipperStringUtils = require('../common/ChipperStringUtils');
var getTitleStringKey = require('./getTitleStringKey');
var grunt = require('grunt');
var pako = require('pako');
var fs = require('fs');
var nodeHTMLEncoder = require('node-html-encoder'); // eslint-disable-line require-statement-match

/**
 * From a given set of config (including the JS and other required things), it creates an HTML file for a runnable.
 * @public
 *
 * @param {Object} config
 * @returns {string} - The HTML for the file.
 */
module.exports = function (config) {
  var encoder = new nodeHTMLEncoder.Encoder('entity');
  var repo = config.repo,
    stringMap = config.stringMap,
    licenseScript = config.licenseScript,
    scripts = config.scripts,
    locale = config.locale,
    htmlHeader = config.htmlHeader,
    _config$compressScrip = config.compressScripts,
    compressScripts = _config$compressScrip === void 0 ? false : _config$compressScrip;
  assert(typeof repo === 'string', 'Requires repo');
  assert(stringMap, 'Requires stringMap');
  assert(scripts, 'Requires scripts');
  assert(licenseScript, 'Requires license script');
  assert(typeof locale === 'string', 'Requires locale');
  assert(typeof htmlHeader === 'string', 'Requires htmlHeader');
  var localizedTitle = stringMap[locale][getTitleStringKey(repo)];

  // Directory on the PhET website where the latest version of the sim lives
  var latestDir = "https://phet.colorado.edu/sims/html/".concat(repo, "/latest/");

  // Converts a Uint8Array to a base64-encoded string (the usual String.fromCharCode.apply trick doesn't work for large arrays)
  var encodeBytes = function encodeBytes(uint8Array) {
    var binary = '';
    var len = uint8Array.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  };

  // Converts from a JS string to a base64-encoded string
  var toEncodedString = function toEncodedString(string) {
    return encodeBytes(pako.deflate(string));
  };

  // Converts from a JS string to a compressed JS string that can be run
  var toRunString = function toRunString(string) {
    return "_C('".concat(toEncodedString(string), "')");
  };
  var scriptSection;
  if (compressScripts) {
    scriptSection = "<script>\n".concat(licenseScript, "\n</script>") + "<script>".concat(fs.readFileSync('../sherpa/lib/pako_inflate-2.0.3.min.js', 'utf-8'), "</script>\n") + '<script>let _R=q=>{var s=document.createElement("script");s.type=\'text/javascript\';s.async=false;var c=document.createTextNode(q);s.appendChild(c);document.body.appendChild(s);};let _D=s=>{const ar=new Uint8Array(s.length);for (let i=0;i<s.length;i++){ar[i]=s.charCodeAt(i);}return ar;};let _F=s=>pako.inflate(_D(atob(s)),{to:\'string\'});let _C=string=>_R(_F(string));' + scripts.map(function (script) {
      return "".concat(toRunString(script));
    }).join('\n') + '</script>';
  } else {
    scriptSection = [licenseScript].concat(_toConsumableArray(scripts)).map(function (script) {
      return "<script type=\"text/javascript\">".concat(script, "</script>");
    }).join('\n');
  }
  return ChipperStringUtils.replacePlaceholders(grunt.file.read('../chipper/templates/sim.html'), {
    PHET_CARRIAGE_RETURN: '\r',
    PHET_SIM_TITLE: encoder.htmlEncode(localizedTitle),
    PHET_HTML_HEADER: htmlHeader,
    // wrap scripts in global check for IE
    PHET_SIM_SCRIPTS: scriptSection,
    // metadata for Open Graph protocol, see phet-edmodo#2
    OG_TITLE: encoder.htmlEncode(localizedTitle),
    OG_URL: "".concat(latestDir).concat(repo, "_").concat(locale, ".html"),
    OG_IMAGE: "".concat(latestDir).concat(repo, "-600.png")
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3NlcnQiLCJyZXF1aXJlIiwiQ2hpcHBlclN0cmluZ1V0aWxzIiwiZ2V0VGl0bGVTdHJpbmdLZXkiLCJncnVudCIsInBha28iLCJmcyIsIm5vZGVIVE1MRW5jb2RlciIsIm1vZHVsZSIsImV4cG9ydHMiLCJjb25maWciLCJlbmNvZGVyIiwiRW5jb2RlciIsInJlcG8iLCJzdHJpbmdNYXAiLCJsaWNlbnNlU2NyaXB0Iiwic2NyaXB0cyIsImxvY2FsZSIsImh0bWxIZWFkZXIiLCJfY29uZmlnJGNvbXByZXNzU2NyaXAiLCJjb21wcmVzc1NjcmlwdHMiLCJsb2NhbGl6ZWRUaXRsZSIsImxhdGVzdERpciIsImNvbmNhdCIsImVuY29kZUJ5dGVzIiwidWludDhBcnJheSIsImJpbmFyeSIsImxlbiIsImJ5dGVMZW5ndGgiLCJpIiwiU3RyaW5nIiwiZnJvbUNoYXJDb2RlIiwiYnRvYSIsInRvRW5jb2RlZFN0cmluZyIsInN0cmluZyIsImRlZmxhdGUiLCJ0b1J1blN0cmluZyIsInNjcmlwdFNlY3Rpb24iLCJyZWFkRmlsZVN5bmMiLCJtYXAiLCJzY3JpcHQiLCJqb2luIiwiX3RvQ29uc3VtYWJsZUFycmF5IiwicmVwbGFjZVBsYWNlaG9sZGVycyIsImZpbGUiLCJyZWFkIiwiUEhFVF9DQVJSSUFHRV9SRVRVUk4iLCJQSEVUX1NJTV9USVRMRSIsImh0bWxFbmNvZGUiLCJQSEVUX0hUTUxfSEVBREVSIiwiUEhFVF9TSU1fU0NSSVBUUyIsIk9HX1RJVExFIiwiT0dfVVJMIiwiT0dfSU1BR0UiXSwic291cmNlcyI6WyJwYWNrYWdlUnVubmFibGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQ29tYmluZXMgYWxsIHBhcnRzIG9mIGEgcnVubmFibGUncyBidWlsdCBmaWxlIGludG8gb25lIEhUTUwgZmlsZS5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcblxyXG4vLyBtb2R1bGVzXHJcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoICdhc3NlcnQnICk7XHJcbmNvbnN0IENoaXBwZXJTdHJpbmdVdGlscyA9IHJlcXVpcmUoICcuLi9jb21tb24vQ2hpcHBlclN0cmluZ1V0aWxzJyApO1xyXG5jb25zdCBnZXRUaXRsZVN0cmluZ0tleSA9IHJlcXVpcmUoICcuL2dldFRpdGxlU3RyaW5nS2V5JyApO1xyXG5jb25zdCBncnVudCA9IHJlcXVpcmUoICdncnVudCcgKTtcclxuY29uc3QgcGFrbyA9IHJlcXVpcmUoICdwYWtvJyApO1xyXG5jb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcclxuY29uc3Qgbm9kZUhUTUxFbmNvZGVyID0gcmVxdWlyZSggJ25vZGUtaHRtbC1lbmNvZGVyJyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHJlcXVpcmUtc3RhdGVtZW50LW1hdGNoXHJcblxyXG4vKipcclxuICogRnJvbSBhIGdpdmVuIHNldCBvZiBjb25maWcgKGluY2x1ZGluZyB0aGUgSlMgYW5kIG90aGVyIHJlcXVpcmVkIHRoaW5ncyksIGl0IGNyZWF0ZXMgYW4gSFRNTCBmaWxlIGZvciBhIHJ1bm5hYmxlLlxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWdcclxuICogQHJldHVybnMge3N0cmluZ30gLSBUaGUgSFRNTCBmb3IgdGhlIGZpbGUuXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBjb25maWcgKSB7XHJcblxyXG4gIGNvbnN0IGVuY29kZXIgPSBuZXcgbm9kZUhUTUxFbmNvZGVyLkVuY29kZXIoICdlbnRpdHknICk7XHJcblxyXG4gIGNvbnN0IHtcclxuICAgIHJlcG8sIC8vIHtzdHJpbmd9XHJcbiAgICBzdHJpbmdNYXAsIC8vIHtPYmplY3R9LCBtYXBbIGxvY2FsZSBdWyBzdHJpbmdLZXkgXSA9PiB7c3RyaW5nfVxyXG4gICAgbGljZW5zZVNjcmlwdCwgLy8ge3N0cmluZ31cclxuICAgIHNjcmlwdHMsIC8vIHtBcnJheS48c3RyaW5nPn1cclxuICAgIGxvY2FsZSwgLy8ge3N0cmluZ31cclxuICAgIGh0bWxIZWFkZXIsIC8vIHtzdHJpbmd9XHJcbiAgICBjb21wcmVzc1NjcmlwdHMgPSBmYWxzZVxyXG4gIH0gPSBjb25maWc7XHJcbiAgYXNzZXJ0KCB0eXBlb2YgcmVwbyA9PT0gJ3N0cmluZycsICdSZXF1aXJlcyByZXBvJyApO1xyXG4gIGFzc2VydCggc3RyaW5nTWFwLCAnUmVxdWlyZXMgc3RyaW5nTWFwJyApO1xyXG4gIGFzc2VydCggc2NyaXB0cywgJ1JlcXVpcmVzIHNjcmlwdHMnICk7XHJcbiAgYXNzZXJ0KCBsaWNlbnNlU2NyaXB0LCAnUmVxdWlyZXMgbGljZW5zZSBzY3JpcHQnICk7XHJcbiAgYXNzZXJ0KCB0eXBlb2YgbG9jYWxlID09PSAnc3RyaW5nJywgJ1JlcXVpcmVzIGxvY2FsZScgKTtcclxuICBhc3NlcnQoIHR5cGVvZiBodG1sSGVhZGVyID09PSAnc3RyaW5nJywgJ1JlcXVpcmVzIGh0bWxIZWFkZXInICk7XHJcblxyXG4gIGNvbnN0IGxvY2FsaXplZFRpdGxlID0gc3RyaW5nTWFwWyBsb2NhbGUgXVsgZ2V0VGl0bGVTdHJpbmdLZXkoIHJlcG8gKSBdO1xyXG5cclxuICAvLyBEaXJlY3Rvcnkgb24gdGhlIFBoRVQgd2Vic2l0ZSB3aGVyZSB0aGUgbGF0ZXN0IHZlcnNpb24gb2YgdGhlIHNpbSBsaXZlc1xyXG4gIGNvbnN0IGxhdGVzdERpciA9IGBodHRwczovL3BoZXQuY29sb3JhZG8uZWR1L3NpbXMvaHRtbC8ke3JlcG99L2xhdGVzdC9gO1xyXG5cclxuICAvLyBDb252ZXJ0cyBhIFVpbnQ4QXJyYXkgdG8gYSBiYXNlNjQtZW5jb2RlZCBzdHJpbmcgKHRoZSB1c3VhbCBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5IHRyaWNrIGRvZXNuJ3Qgd29yayBmb3IgbGFyZ2UgYXJyYXlzKVxyXG4gIGNvbnN0IGVuY29kZUJ5dGVzID0gdWludDhBcnJheSA9PiB7XHJcbiAgICBsZXQgYmluYXJ5ID0gJyc7XHJcbiAgICBjb25zdCBsZW4gPSB1aW50OEFycmF5LmJ5dGVMZW5ndGg7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBsZW47IGkrKyApIHtcclxuICAgICAgYmluYXJ5ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoIHVpbnQ4QXJyYXlbIGkgXSApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJ0b2EoIGJpbmFyeSApO1xyXG4gIH07XHJcblxyXG4gIC8vIENvbnZlcnRzIGZyb20gYSBKUyBzdHJpbmcgdG8gYSBiYXNlNjQtZW5jb2RlZCBzdHJpbmdcclxuICBjb25zdCB0b0VuY29kZWRTdHJpbmcgPSBzdHJpbmcgPT4gZW5jb2RlQnl0ZXMoIHBha28uZGVmbGF0ZSggc3RyaW5nICkgKTtcclxuXHJcbiAgLy8gQ29udmVydHMgZnJvbSBhIEpTIHN0cmluZyB0byBhIGNvbXByZXNzZWQgSlMgc3RyaW5nIHRoYXQgY2FuIGJlIHJ1blxyXG4gIGNvbnN0IHRvUnVuU3RyaW5nID0gc3RyaW5nID0+IGBfQygnJHt0b0VuY29kZWRTdHJpbmcoIHN0cmluZyApfScpYDtcclxuXHJcbiAgbGV0IHNjcmlwdFNlY3Rpb247XHJcbiAgaWYgKCBjb21wcmVzc1NjcmlwdHMgKSB7XHJcbiAgICBzY3JpcHRTZWN0aW9uID0gYDxzY3JpcHQ+XFxuJHtsaWNlbnNlU2NyaXB0fVxcbjwvc2NyaXB0PmAgK1xyXG4gICAgICBgPHNjcmlwdD4ke2ZzLnJlYWRGaWxlU3luYyggJy4uL3NoZXJwYS9saWIvcGFrb19pbmZsYXRlLTIuMC4zLm1pbi5qcycsICd1dGYtOCcgKX08L3NjcmlwdD5cXG5gICtcclxuICAgICAgJzxzY3JpcHQ+bGV0IF9SPXE9Pnt2YXIgcz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpO3MudHlwZT1cXCd0ZXh0L2phdmFzY3JpcHRcXCc7cy5hc3luYz1mYWxzZTt2YXIgYz1kb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShxKTtzLmFwcGVuZENoaWxkKGMpO2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocyk7fTtsZXQgX0Q9cz0+e2NvbnN0IGFyPW5ldyBVaW50OEFycmF5KHMubGVuZ3RoKTtmb3IgKGxldCBpPTA7aTxzLmxlbmd0aDtpKyspe2FyW2ldPXMuY2hhckNvZGVBdChpKTt9cmV0dXJuIGFyO307bGV0IF9GPXM9PnBha28uaW5mbGF0ZShfRChhdG9iKHMpKSx7dG86XFwnc3RyaW5nXFwnfSk7bGV0IF9DPXN0cmluZz0+X1IoX0Yoc3RyaW5nKSk7JyArXHJcbiAgICAgIHNjcmlwdHMubWFwKCBzY3JpcHQgPT4gYCR7dG9SdW5TdHJpbmcoIHNjcmlwdCApfWAgKS5qb2luKCAnXFxuJyApICsgJzwvc2NyaXB0Pic7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgc2NyaXB0U2VjdGlvbiA9IFsgbGljZW5zZVNjcmlwdCwgLi4uc2NyaXB0cyBdLm1hcCggc2NyaXB0ID0+IGA8c2NyaXB0IHR5cGU9XCJ0ZXh0L2phdmFzY3JpcHRcIj4ke3NjcmlwdH08L3NjcmlwdD5gICkuam9pbiggJ1xcbicgKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZVBsYWNlaG9sZGVycyggZ3J1bnQuZmlsZS5yZWFkKCAnLi4vY2hpcHBlci90ZW1wbGF0ZXMvc2ltLmh0bWwnICksIHtcclxuICAgIFBIRVRfQ0FSUklBR0VfUkVUVVJOOiAnXFxyJyxcclxuICAgIFBIRVRfU0lNX1RJVExFOiBlbmNvZGVyLmh0bWxFbmNvZGUoIGxvY2FsaXplZFRpdGxlICksXHJcbiAgICBQSEVUX0hUTUxfSEVBREVSOiBodG1sSGVhZGVyLFxyXG5cclxuICAgIC8vIHdyYXAgc2NyaXB0cyBpbiBnbG9iYWwgY2hlY2sgZm9yIElFXHJcbiAgICBQSEVUX1NJTV9TQ1JJUFRTOiBzY3JpcHRTZWN0aW9uLFxyXG5cclxuICAgIC8vIG1ldGFkYXRhIGZvciBPcGVuIEdyYXBoIHByb3RvY29sLCBzZWUgcGhldC1lZG1vZG8jMlxyXG4gICAgT0dfVElUTEU6IGVuY29kZXIuaHRtbEVuY29kZSggbG9jYWxpemVkVGl0bGUgKSxcclxuICAgIE9HX1VSTDogYCR7bGF0ZXN0RGlyfSR7cmVwb31fJHtsb2NhbGV9Lmh0bWxgLFxyXG4gICAgT0dfSU1BR0U6IGAke2xhdGVzdERpcn0ke3JlcG99LTYwMC5wbmdgXHJcbiAgfSApO1xyXG59OyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUdBO0FBQ0EsSUFBTUEsTUFBTSxHQUFHQyxPQUFPLENBQUUsUUFBUyxDQUFDO0FBQ2xDLElBQU1DLGtCQUFrQixHQUFHRCxPQUFPLENBQUUsOEJBQStCLENBQUM7QUFDcEUsSUFBTUUsaUJBQWlCLEdBQUdGLE9BQU8sQ0FBRSxxQkFBc0IsQ0FBQztBQUMxRCxJQUFNRyxLQUFLLEdBQUdILE9BQU8sQ0FBRSxPQUFRLENBQUM7QUFDaEMsSUFBTUksSUFBSSxHQUFHSixPQUFPLENBQUUsTUFBTyxDQUFDO0FBQzlCLElBQU1LLEVBQUUsR0FBR0wsT0FBTyxDQUFFLElBQUssQ0FBQztBQUMxQixJQUFNTSxlQUFlLEdBQUdOLE9BQU8sQ0FBRSxtQkFBb0IsQ0FBQyxDQUFDLENBQUM7O0FBRXhEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FPLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLFVBQVVDLE1BQU0sRUFBRztFQUVsQyxJQUFNQyxPQUFPLEdBQUcsSUFBSUosZUFBZSxDQUFDSyxPQUFPLENBQUUsUUFBUyxDQUFDO0VBRXZELElBQ0VDLElBQUksR0FPRkgsTUFBTSxDQVBSRyxJQUFJO0lBQ0pDLFNBQVMsR0FNUEosTUFBTSxDQU5SSSxTQUFTO0lBQ1RDLGFBQWEsR0FLWEwsTUFBTSxDQUxSSyxhQUFhO0lBQ2JDLE9BQU8sR0FJTE4sTUFBTSxDQUpSTSxPQUFPO0lBQ1BDLE1BQU0sR0FHSlAsTUFBTSxDQUhSTyxNQUFNO0lBQ05DLFVBQVUsR0FFUlIsTUFBTSxDQUZSUSxVQUFVO0lBQUFDLHFCQUFBLEdBRVJULE1BQU0sQ0FEUlUsZUFBZTtJQUFmQSxlQUFlLEdBQUFELHFCQUFBLGNBQUcsS0FBSyxHQUFBQSxxQkFBQTtFQUV6Qm5CLE1BQU0sQ0FBRSxPQUFPYSxJQUFJLEtBQUssUUFBUSxFQUFFLGVBQWdCLENBQUM7RUFDbkRiLE1BQU0sQ0FBRWMsU0FBUyxFQUFFLG9CQUFxQixDQUFDO0VBQ3pDZCxNQUFNLENBQUVnQixPQUFPLEVBQUUsa0JBQW1CLENBQUM7RUFDckNoQixNQUFNLENBQUVlLGFBQWEsRUFBRSx5QkFBMEIsQ0FBQztFQUNsRGYsTUFBTSxDQUFFLE9BQU9pQixNQUFNLEtBQUssUUFBUSxFQUFFLGlCQUFrQixDQUFDO0VBQ3ZEakIsTUFBTSxDQUFFLE9BQU9rQixVQUFVLEtBQUssUUFBUSxFQUFFLHFCQUFzQixDQUFDO0VBRS9ELElBQU1HLGNBQWMsR0FBR1AsU0FBUyxDQUFFRyxNQUFNLENBQUUsQ0FBRWQsaUJBQWlCLENBQUVVLElBQUssQ0FBQyxDQUFFOztFQUV2RTtFQUNBLElBQU1TLFNBQVMsMENBQUFDLE1BQUEsQ0FBMENWLElBQUksYUFBVTs7RUFFdkU7RUFDQSxJQUFNVyxXQUFXLEdBQUcsU0FBZEEsV0FBV0EsQ0FBR0MsVUFBVSxFQUFJO0lBQ2hDLElBQUlDLE1BQU0sR0FBRyxFQUFFO0lBQ2YsSUFBTUMsR0FBRyxHQUFHRixVQUFVLENBQUNHLFVBQVU7SUFDakMsS0FBTSxJQUFJQyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdGLEdBQUcsRUFBRUUsQ0FBQyxFQUFFLEVBQUc7TUFDOUJILE1BQU0sSUFBSUksTUFBTSxDQUFDQyxZQUFZLENBQUVOLFVBQVUsQ0FBRUksQ0FBQyxDQUFHLENBQUM7SUFDbEQ7SUFDQSxPQUFPRyxJQUFJLENBQUVOLE1BQU8sQ0FBQztFQUN2QixDQUFDOztFQUVEO0VBQ0EsSUFBTU8sZUFBZSxHQUFHLFNBQWxCQSxlQUFlQSxDQUFHQyxNQUFNO0lBQUEsT0FBSVYsV0FBVyxDQUFFbkIsSUFBSSxDQUFDOEIsT0FBTyxDQUFFRCxNQUFPLENBQUUsQ0FBQztFQUFBOztFQUV2RTtFQUNBLElBQU1FLFdBQVcsR0FBRyxTQUFkQSxXQUFXQSxDQUFHRixNQUFNO0lBQUEsY0FBQVgsTUFBQSxDQUFXVSxlQUFlLENBQUVDLE1BQU8sQ0FBQztFQUFBLENBQUk7RUFFbEUsSUFBSUcsYUFBYTtFQUNqQixJQUFLakIsZUFBZSxFQUFHO0lBQ3JCaUIsYUFBYSxHQUFHLGFBQUFkLE1BQUEsQ0FBYVIsYUFBYSw4QkFBQVEsTUFBQSxDQUM3QmpCLEVBQUUsQ0FBQ2dDLFlBQVksQ0FBRSx5Q0FBeUMsRUFBRSxPQUFRLENBQUMsZ0JBQWEsR0FDN0YscVhBQXFYLEdBQ3JYdEIsT0FBTyxDQUFDdUIsR0FBRyxDQUFFLFVBQUFDLE1BQU07TUFBQSxVQUFBakIsTUFBQSxDQUFPYSxXQUFXLENBQUVJLE1BQU8sQ0FBQztJQUFBLENBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUUsSUFBSyxDQUFDLEdBQUcsV0FBVztFQUNsRixDQUFDLE1BQ0k7SUFDSEosYUFBYSxHQUFHLENBQUV0QixhQUFhLEVBQUFRLE1BQUEsQ0FBQW1CLGtCQUFBLENBQUsxQixPQUFPLEdBQUd1QixHQUFHLENBQUUsVUFBQUMsTUFBTTtNQUFBLDJDQUFBakIsTUFBQSxDQUFzQ2lCLE1BQU07SUFBQSxDQUFZLENBQUMsQ0FBQ0MsSUFBSSxDQUFFLElBQUssQ0FBQztFQUNqSTtFQUVBLE9BQU92QyxrQkFBa0IsQ0FBQ3lDLG1CQUFtQixDQUFFdkMsS0FBSyxDQUFDd0MsSUFBSSxDQUFDQyxJQUFJLENBQUUsK0JBQWdDLENBQUMsRUFBRTtJQUNqR0Msb0JBQW9CLEVBQUUsSUFBSTtJQUMxQkMsY0FBYyxFQUFFcEMsT0FBTyxDQUFDcUMsVUFBVSxDQUFFM0IsY0FBZSxDQUFDO0lBQ3BENEIsZ0JBQWdCLEVBQUUvQixVQUFVO0lBRTVCO0lBQ0FnQyxnQkFBZ0IsRUFBRWIsYUFBYTtJQUUvQjtJQUNBYyxRQUFRLEVBQUV4QyxPQUFPLENBQUNxQyxVQUFVLENBQUUzQixjQUFlLENBQUM7SUFDOUMrQixNQUFNLEtBQUE3QixNQUFBLENBQUtELFNBQVMsRUFBQUMsTUFBQSxDQUFHVixJQUFJLE9BQUFVLE1BQUEsQ0FBSU4sTUFBTSxVQUFPO0lBQzVDb0MsUUFBUSxLQUFBOUIsTUFBQSxDQUFLRCxTQUFTLEVBQUFDLE1BQUEsQ0FBR1YsSUFBSTtFQUMvQixDQUFFLENBQUM7QUFDTCxDQUFDIiwiaWdub3JlTGlzdCI6W119