"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// Copyright 2024, University of Colorado Boulder

/**
 * TODO: Move over to updateLocaleInfo.js once we are ready to propagate the locale changes https://github.com/phetsims/joist/issues/963
 *
 * WARNING: This will commit/push the changes. Those changes likely be propagated immediately to the website and rosetta.
 *
 * NOTE: Run with CWD of chipper/js/data
 *
 * @author Matt Pennington (PhET Interactive Simulations)
 */

var child_process = require('child_process');
var fs = require('fs');

/**
 * Converts locale data from babel/localeData.json into legacy formats used by rosetta and the website.
 *
 * Overall description of the localeData system:
 *
 * - babel/localeData.json - Ground truth, includes the "new" format with locale3 and englishName instead of name
 * - chipper/js/data/localeInfo.js - CommonJS legacy module
 * - chipper/js/data/localeInfoModule.js - ES6 legacy module
 * - chipper/js/data/localeInfo.json - JSON legacy
 *
 * IMPORTANT - MUST READ!!!
 * You may modify babel/localeData.json file with new locale information. After modifying the file you must take the following steps:
 * 1. Run ./updateLocaleInfo.js, so that the automatically generated files are also update
 * 2. Notify the responsible developers for rosetta, weddell, yotta, and the website that localeInfo was updated.
 * 3. TODO figure out next steps, see https://github.com/phetsims/joist/issues/963
 *
 * Locale data was originally based on Java's Locale object, but has been modified. Essentially each locale has the
 * following data:
 *
 * - locale: Either in the format `xx` or `xx_XX` (ISO-639-1 with 2-letter country code optional). Sometimes these
 *           do not match with ISO-639-1, we have had to add some for our needs.
 *           - language codes are ISO 639-1, see http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
 *           - country codes are ISO 3166-1 alpha2, see http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
 *
 *           NOTE: We are using an older version of ISO 639-1 because java.util.Locale maps some of the newer language codes to
 *           older codes. See Locale.convertOldISOCodes.
 *           The affected country codes are:
 *           he -> iw (Hebrew)
 *           yi -> ji (Yiddish)
 *           id -> in (Indonesian)
 * - locale3: Format of `xxx`. The ISO-639-2 code for the language (3-letter code), if available. Some locales do not
 *            have this information (most do).
 * - direction: either `ltr` or `rtl` for left-to-right or right-to-left
 * - englishName: The name of the locale in English
 * - localizedName: The name of the locale in the locale itself
 *
 * ALSO NOTE: We had a request to support Lakota, which is not included in ISO 639-1, and is only defined as a three-
 * letter code in ISO 639-3.  The locale combination 'lk' was not taken in ISO 639-1, so we added it.  Strictly
 * speaking, this is a deviation from the spec.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// Load our ground source of truth
var localeData = JSON.parse(fs.readFileSync('../../../babel/localeData.json', 'utf8'));

// Construct the concise JS that defines the legacy locale-info format
var localeInfoSnippet = '{';
// eslint-disable-next-line bad-text
var badText = 'Slave'; // There is an englishName that contains this word, see https://en.wikipedia.org/?title=Slave_language_(Athapascan)&redirect=no
// Add properties for all locales
for (var _i = 0, _Object$keys = Object.keys(localeData); _i < _Object$keys.length; _i++) {
  var locale = _Object$keys[_i];
  localeInfoSnippet += "\n  ".concat(locale, ": {\n    ").concat(localeData[locale].englishName.includes(badText) ? '// eslint-disable-next-line bad-text\n    ' : '', "name: '").concat(localeData[locale].englishName.replace(/'/g, '\\\''), "',\n    localizedName: '").concat(localeData[locale].localizedName.replace(/'/g, '\\\''), "',\n    direction: '").concat(localeData[locale].direction, "'\n  },");
}
// Remove the trailing comma
localeInfoSnippet = localeInfoSnippet.slice(0, -1);
// Close the object
localeInfoSnippet += '\n}';
var localeInfo = {};
for (var _i2 = 0, _Object$keys2 = Object.keys(localeData); _i2 < _Object$keys2.length; _i2++) {
  var _locale = _Object$keys2[_i2];
  localeInfo[_locale] = {
    name: localeData[_locale].englishName,
    localizedName: localeData[_locale].localizedName,
    direction: localeData[_locale].direction
  };
}
var newLocaleInfo = _objectSpread({
  _comment: 'This file is automatically generated by js/data/updateLocaleInfo.js. Do not modify it directly.'
}, localeInfo);
fs.writeFileSync('../../data/localeInfo.json', JSON.stringify(newLocaleInfo, null, 2));
var commonDocumentation = "// Copyright 2015-".concat(new Date().getFullYear(), ", University of Colorado Boulder\n\n/**\n  * This file is automatically generated by js/data/updateLocaleInfo.js. Do not modify it directly.\n  *\n  * @author automatically generated by updateLocaleInfo.js\n  */\n\n/* eslint-env browser, node */\n\n\n");
var newCommonJSSouceCode = "".concat(commonDocumentation, "module.exports = ").concat(localeInfoSnippet, ";");
fs.writeFileSync('./localeInfo.js', newCommonJSSouceCode);
var newModuleSourceCode = "".concat(commonDocumentation, "export default ").concat(localeInfoSnippet, ";");
fs.writeFileSync('./localeInfoModule.js', newModuleSourceCode);
console.log('locale info files updated');
throw new Error('NO COMMIT YET, safeguard so we do not commit changes to main yet'); // TODO: remove for https://github.com/phetsims/joist/issues/963

// eslint-disable-next-line no-unreachable
var needsCommit = false;
try {
  // 0 exit code if there are no working copy changes from HEAD.
  child_process.execSync('git diff-index --quiet HEAD --');
  console.log('No locale info changes, no commit needed.');
} catch (e) {
  needsCommit = true;
}
if (needsCommit) {
  try {
    console.log('pulling');

    // Some devs have rebase set by default, and you cannot rebase-pull with working copy changes.
    child_process.execSync('git pull --no-rebase');
    child_process.execSync('git add ../../data/localeInfo.json');
    child_process.execSync('git add ./localeInfo.js');
    child_process.execSync('git add ./localeInfoModule.js');
    if (needsCommit) {
      console.log('committing');
      child_process.execSync('git commit --no-verify ../../data/localeInfo.json ./localeInfo.js ./localeInfoModule.js -m "Automatically updated generated localeInfo files"');
      console.log('pushing');
      child_process.execSync('git push');
    }
  } catch (e) {
    console.error('Unable to update files in git.', e);
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjaGlsZF9wcm9jZXNzIiwicmVxdWlyZSIsImZzIiwibG9jYWxlRGF0YSIsIkpTT04iLCJwYXJzZSIsInJlYWRGaWxlU3luYyIsImxvY2FsZUluZm9TbmlwcGV0IiwiYmFkVGV4dCIsIl9pIiwiX09iamVjdCRrZXlzIiwiT2JqZWN0Iiwia2V5cyIsImxlbmd0aCIsImxvY2FsZSIsImNvbmNhdCIsImVuZ2xpc2hOYW1lIiwiaW5jbHVkZXMiLCJyZXBsYWNlIiwibG9jYWxpemVkTmFtZSIsImRpcmVjdGlvbiIsInNsaWNlIiwibG9jYWxlSW5mbyIsIl9pMiIsIl9PYmplY3Qka2V5czIiLCJuYW1lIiwibmV3TG9jYWxlSW5mbyIsIl9vYmplY3RTcHJlYWQiLCJfY29tbWVudCIsIndyaXRlRmlsZVN5bmMiLCJzdHJpbmdpZnkiLCJjb21tb25Eb2N1bWVudGF0aW9uIiwiRGF0ZSIsImdldEZ1bGxZZWFyIiwibmV3Q29tbW9uSlNTb3VjZUNvZGUiLCJuZXdNb2R1bGVTb3VyY2VDb2RlIiwiY29uc29sZSIsImxvZyIsIkVycm9yIiwibmVlZHNDb21taXQiLCJleGVjU3luYyIsImUiLCJlcnJvciJdLCJzb3VyY2VzIjpbIm5ld1VwZGF0ZUxvY2FsZUluZm8uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFRPRE86IE1vdmUgb3ZlciB0byB1cGRhdGVMb2NhbGVJbmZvLmpzIG9uY2Ugd2UgYXJlIHJlYWR5IHRvIHByb3BhZ2F0ZSB0aGUgbG9jYWxlIGNoYW5nZXMgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2pvaXN0L2lzc3Vlcy85NjNcclxuICpcclxuICogV0FSTklORzogVGhpcyB3aWxsIGNvbW1pdC9wdXNoIHRoZSBjaGFuZ2VzLiBUaG9zZSBjaGFuZ2VzIGxpa2VseSBiZSBwcm9wYWdhdGVkIGltbWVkaWF0ZWx5IHRvIHRoZSB3ZWJzaXRlIGFuZCByb3NldHRhLlxyXG4gKlxyXG4gKiBOT1RFOiBSdW4gd2l0aCBDV0Qgb2YgY2hpcHBlci9qcy9kYXRhXHJcbiAqXHJcbiAqIEBhdXRob3IgTWF0dCBQZW5uaW5ndG9uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmNvbnN0IGNoaWxkX3Byb2Nlc3MgPSByZXF1aXJlKCAnY2hpbGRfcHJvY2VzcycgKTtcclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcblxyXG4vKipcclxuICogQ29udmVydHMgbG9jYWxlIGRhdGEgZnJvbSBiYWJlbC9sb2NhbGVEYXRhLmpzb24gaW50byBsZWdhY3kgZm9ybWF0cyB1c2VkIGJ5IHJvc2V0dGEgYW5kIHRoZSB3ZWJzaXRlLlxyXG4gKlxyXG4gKiBPdmVyYWxsIGRlc2NyaXB0aW9uIG9mIHRoZSBsb2NhbGVEYXRhIHN5c3RlbTpcclxuICpcclxuICogLSBiYWJlbC9sb2NhbGVEYXRhLmpzb24gLSBHcm91bmQgdHJ1dGgsIGluY2x1ZGVzIHRoZSBcIm5ld1wiIGZvcm1hdCB3aXRoIGxvY2FsZTMgYW5kIGVuZ2xpc2hOYW1lIGluc3RlYWQgb2YgbmFtZVxyXG4gKiAtIGNoaXBwZXIvanMvZGF0YS9sb2NhbGVJbmZvLmpzIC0gQ29tbW9uSlMgbGVnYWN5IG1vZHVsZVxyXG4gKiAtIGNoaXBwZXIvanMvZGF0YS9sb2NhbGVJbmZvTW9kdWxlLmpzIC0gRVM2IGxlZ2FjeSBtb2R1bGVcclxuICogLSBjaGlwcGVyL2pzL2RhdGEvbG9jYWxlSW5mby5qc29uIC0gSlNPTiBsZWdhY3lcclxuICpcclxuICogSU1QT1JUQU5UIC0gTVVTVCBSRUFEISEhXHJcbiAqIFlvdSBtYXkgbW9kaWZ5IGJhYmVsL2xvY2FsZURhdGEuanNvbiBmaWxlIHdpdGggbmV3IGxvY2FsZSBpbmZvcm1hdGlvbi4gQWZ0ZXIgbW9kaWZ5aW5nIHRoZSBmaWxlIHlvdSBtdXN0IHRha2UgdGhlIGZvbGxvd2luZyBzdGVwczpcclxuICogMS4gUnVuIC4vdXBkYXRlTG9jYWxlSW5mby5qcywgc28gdGhhdCB0aGUgYXV0b21hdGljYWxseSBnZW5lcmF0ZWQgZmlsZXMgYXJlIGFsc28gdXBkYXRlXHJcbiAqIDIuIE5vdGlmeSB0aGUgcmVzcG9uc2libGUgZGV2ZWxvcGVycyBmb3Igcm9zZXR0YSwgd2VkZGVsbCwgeW90dGEsIGFuZCB0aGUgd2Vic2l0ZSB0aGF0IGxvY2FsZUluZm8gd2FzIHVwZGF0ZWQuXHJcbiAqIDMuIFRPRE8gZmlndXJlIG91dCBuZXh0IHN0ZXBzLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2pvaXN0L2lzc3Vlcy85NjNcclxuICpcclxuICogTG9jYWxlIGRhdGEgd2FzIG9yaWdpbmFsbHkgYmFzZWQgb24gSmF2YSdzIExvY2FsZSBvYmplY3QsIGJ1dCBoYXMgYmVlbiBtb2RpZmllZC4gRXNzZW50aWFsbHkgZWFjaCBsb2NhbGUgaGFzIHRoZVxyXG4gKiBmb2xsb3dpbmcgZGF0YTpcclxuICpcclxuICogLSBsb2NhbGU6IEVpdGhlciBpbiB0aGUgZm9ybWF0IGB4eGAgb3IgYHh4X1hYYCAoSVNPLTYzOS0xIHdpdGggMi1sZXR0ZXIgY291bnRyeSBjb2RlIG9wdGlvbmFsKS4gU29tZXRpbWVzIHRoZXNlXHJcbiAqICAgICAgICAgICBkbyBub3QgbWF0Y2ggd2l0aCBJU08tNjM5LTEsIHdlIGhhdmUgaGFkIHRvIGFkZCBzb21lIGZvciBvdXIgbmVlZHMuXHJcbiAqICAgICAgICAgICAtIGxhbmd1YWdlIGNvZGVzIGFyZSBJU08gNjM5LTEsIHNlZSBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0xpc3Rfb2ZfSVNPXzYzOS0xX2NvZGVzXHJcbiAqICAgICAgICAgICAtIGNvdW50cnkgY29kZXMgYXJlIElTTyAzMTY2LTEgYWxwaGEyLCBzZWUgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9JU09fMzE2Ni0xX2FscGhhLTJcclxuICpcclxuICogICAgICAgICAgIE5PVEU6IFdlIGFyZSB1c2luZyBhbiBvbGRlciB2ZXJzaW9uIG9mIElTTyA2MzktMSBiZWNhdXNlIGphdmEudXRpbC5Mb2NhbGUgbWFwcyBzb21lIG9mIHRoZSBuZXdlciBsYW5ndWFnZSBjb2RlcyB0b1xyXG4gKiAgICAgICAgICAgb2xkZXIgY29kZXMuIFNlZSBMb2NhbGUuY29udmVydE9sZElTT0NvZGVzLlxyXG4gKiAgICAgICAgICAgVGhlIGFmZmVjdGVkIGNvdW50cnkgY29kZXMgYXJlOlxyXG4gKiAgICAgICAgICAgaGUgLT4gaXcgKEhlYnJldylcclxuICogICAgICAgICAgIHlpIC0+IGppIChZaWRkaXNoKVxyXG4gKiAgICAgICAgICAgaWQgLT4gaW4gKEluZG9uZXNpYW4pXHJcbiAqIC0gbG9jYWxlMzogRm9ybWF0IG9mIGB4eHhgLiBUaGUgSVNPLTYzOS0yIGNvZGUgZm9yIHRoZSBsYW5ndWFnZSAoMy1sZXR0ZXIgY29kZSksIGlmIGF2YWlsYWJsZS4gU29tZSBsb2NhbGVzIGRvIG5vdFxyXG4gKiAgICAgICAgICAgIGhhdmUgdGhpcyBpbmZvcm1hdGlvbiAobW9zdCBkbykuXHJcbiAqIC0gZGlyZWN0aW9uOiBlaXRoZXIgYGx0cmAgb3IgYHJ0bGAgZm9yIGxlZnQtdG8tcmlnaHQgb3IgcmlnaHQtdG8tbGVmdFxyXG4gKiAtIGVuZ2xpc2hOYW1lOiBUaGUgbmFtZSBvZiB0aGUgbG9jYWxlIGluIEVuZ2xpc2hcclxuICogLSBsb2NhbGl6ZWROYW1lOiBUaGUgbmFtZSBvZiB0aGUgbG9jYWxlIGluIHRoZSBsb2NhbGUgaXRzZWxmXHJcbiAqXHJcbiAqIEFMU08gTk9URTogV2UgaGFkIGEgcmVxdWVzdCB0byBzdXBwb3J0IExha290YSwgd2hpY2ggaXMgbm90IGluY2x1ZGVkIGluIElTTyA2MzktMSwgYW5kIGlzIG9ubHkgZGVmaW5lZCBhcyBhIHRocmVlLVxyXG4gKiBsZXR0ZXIgY29kZSBpbiBJU08gNjM5LTMuICBUaGUgbG9jYWxlIGNvbWJpbmF0aW9uICdsaycgd2FzIG5vdCB0YWtlbiBpbiBJU08gNjM5LTEsIHNvIHdlIGFkZGVkIGl0LiAgU3RyaWN0bHlcclxuICogc3BlYWtpbmcsIHRoaXMgaXMgYSBkZXZpYXRpb24gZnJvbSB0aGUgc3BlYy5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbi8vIExvYWQgb3VyIGdyb3VuZCBzb3VyY2Ugb2YgdHJ1dGhcclxuY29uc3QgbG9jYWxlRGF0YSA9IEpTT04ucGFyc2UoIGZzLnJlYWRGaWxlU3luYyggJy4uLy4uLy4uL2JhYmVsL2xvY2FsZURhdGEuanNvbicsICd1dGY4JyApICk7XHJcblxyXG4vLyBDb25zdHJ1Y3QgdGhlIGNvbmNpc2UgSlMgdGhhdCBkZWZpbmVzIHRoZSBsZWdhY3kgbG9jYWxlLWluZm8gZm9ybWF0XHJcbmxldCBsb2NhbGVJbmZvU25pcHBldCA9ICd7JztcclxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGJhZC10ZXh0XHJcbmNvbnN0IGJhZFRleHQgPSAnU2xhdmUnOyAvLyBUaGVyZSBpcyBhbiBlbmdsaXNoTmFtZSB0aGF0IGNvbnRhaW5zIHRoaXMgd29yZCwgc2VlIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy8/dGl0bGU9U2xhdmVfbGFuZ3VhZ2VfKEF0aGFwYXNjYW4pJnJlZGlyZWN0PW5vXHJcbi8vIEFkZCBwcm9wZXJ0aWVzIGZvciBhbGwgbG9jYWxlc1xyXG5mb3IgKCBjb25zdCBsb2NhbGUgb2YgT2JqZWN0LmtleXMoIGxvY2FsZURhdGEgKSApIHtcclxuICBsb2NhbGVJbmZvU25pcHBldCArPSBgXHJcbiAgJHtsb2NhbGV9OiB7XHJcbiAgICAke2xvY2FsZURhdGFbIGxvY2FsZSBdLmVuZ2xpc2hOYW1lLmluY2x1ZGVzKCBiYWRUZXh0ICkgPyAnLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGJhZC10ZXh0XFxuICAgICcgOiAnJ31uYW1lOiAnJHtsb2NhbGVEYXRhWyBsb2NhbGUgXS5lbmdsaXNoTmFtZS5yZXBsYWNlKCAvJy9nLCAnXFxcXFxcJycgKX0nLFxyXG4gICAgbG9jYWxpemVkTmFtZTogJyR7bG9jYWxlRGF0YVsgbG9jYWxlIF0ubG9jYWxpemVkTmFtZS5yZXBsYWNlKCAvJy9nLCAnXFxcXFxcJycgKX0nLFxyXG4gICAgZGlyZWN0aW9uOiAnJHtsb2NhbGVEYXRhWyBsb2NhbGUgXS5kaXJlY3Rpb259J1xyXG4gIH0sYDtcclxufVxyXG4vLyBSZW1vdmUgdGhlIHRyYWlsaW5nIGNvbW1hXHJcbmxvY2FsZUluZm9TbmlwcGV0ID0gbG9jYWxlSW5mb1NuaXBwZXQuc2xpY2UoIDAsIC0xICk7XHJcbi8vIENsb3NlIHRoZSBvYmplY3RcclxubG9jYWxlSW5mb1NuaXBwZXQgKz0gJ1xcbn0nO1xyXG5cclxuY29uc3QgbG9jYWxlSW5mbyA9IHt9O1xyXG5mb3IgKCBjb25zdCBsb2NhbGUgb2YgT2JqZWN0LmtleXMoIGxvY2FsZURhdGEgKSApIHtcclxuICBsb2NhbGVJbmZvWyBsb2NhbGUgXSA9IHtcclxuICAgIG5hbWU6IGxvY2FsZURhdGFbIGxvY2FsZSBdLmVuZ2xpc2hOYW1lLFxyXG4gICAgbG9jYWxpemVkTmFtZTogbG9jYWxlRGF0YVsgbG9jYWxlIF0ubG9jYWxpemVkTmFtZSxcclxuICAgIGRpcmVjdGlvbjogbG9jYWxlRGF0YVsgbG9jYWxlIF0uZGlyZWN0aW9uXHJcbiAgfTtcclxufVxyXG5cclxuY29uc3QgbmV3TG9jYWxlSW5mbyA9IHtcclxuICBfY29tbWVudDogJ1RoaXMgZmlsZSBpcyBhdXRvbWF0aWNhbGx5IGdlbmVyYXRlZCBieSBqcy9kYXRhL3VwZGF0ZUxvY2FsZUluZm8uanMuIERvIG5vdCBtb2RpZnkgaXQgZGlyZWN0bHkuJyxcclxuICAuLi5sb2NhbGVJbmZvXHJcbn07XHJcblxyXG5mcy53cml0ZUZpbGVTeW5jKCAnLi4vLi4vZGF0YS9sb2NhbGVJbmZvLmpzb24nLCBKU09OLnN0cmluZ2lmeSggbmV3TG9jYWxlSW5mbywgbnVsbCwgMiApICk7XHJcblxyXG5jb25zdCBjb21tb25Eb2N1bWVudGF0aW9uID0gYC8vIENvcHlyaWdodCAyMDE1LSR7bmV3IERhdGUoKS5nZXRGdWxsWWVhcigpfSwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICAqIFRoaXMgZmlsZSBpcyBhdXRvbWF0aWNhbGx5IGdlbmVyYXRlZCBieSBqcy9kYXRhL3VwZGF0ZUxvY2FsZUluZm8uanMuIERvIG5vdCBtb2RpZnkgaXQgZGlyZWN0bHkuXHJcbiAgKlxyXG4gICogQGF1dGhvciBhdXRvbWF0aWNhbGx5IGdlbmVyYXRlZCBieSB1cGRhdGVMb2NhbGVJbmZvLmpzXHJcbiAgKi9cclxuXHJcbi8qIGVzbGludC1lbnYgYnJvd3Nlciwgbm9kZSAqL1xyXG5cclxuXHJcbmA7XHJcblxyXG5jb25zdCBuZXdDb21tb25KU1NvdWNlQ29kZSA9IGAke2NvbW1vbkRvY3VtZW50YXRpb259bW9kdWxlLmV4cG9ydHMgPSAke2xvY2FsZUluZm9TbmlwcGV0fTtgO1xyXG5mcy53cml0ZUZpbGVTeW5jKCAnLi9sb2NhbGVJbmZvLmpzJywgbmV3Q29tbW9uSlNTb3VjZUNvZGUgKTtcclxuXHJcbmNvbnN0IG5ld01vZHVsZVNvdXJjZUNvZGUgPSBgJHtjb21tb25Eb2N1bWVudGF0aW9ufWV4cG9ydCBkZWZhdWx0ICR7bG9jYWxlSW5mb1NuaXBwZXR9O2A7XHJcbmZzLndyaXRlRmlsZVN5bmMoICcuL2xvY2FsZUluZm9Nb2R1bGUuanMnLCBuZXdNb2R1bGVTb3VyY2VDb2RlICk7XHJcblxyXG5jb25zb2xlLmxvZyggJ2xvY2FsZSBpbmZvIGZpbGVzIHVwZGF0ZWQnICk7XHJcblxyXG50aHJvdyBuZXcgRXJyb3IoICdOTyBDT01NSVQgWUVULCBzYWZlZ3VhcmQgc28gd2UgZG8gbm90IGNvbW1pdCBjaGFuZ2VzIHRvIG1haW4geWV0JyApOyAvLyBUT0RPOiByZW1vdmUgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9qb2lzdC9pc3N1ZXMvOTYzXHJcblxyXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5yZWFjaGFibGVcclxubGV0IG5lZWRzQ29tbWl0ID0gZmFsc2U7XHJcbnRyeSB7XHJcblxyXG4gIC8vIDAgZXhpdCBjb2RlIGlmIHRoZXJlIGFyZSBubyB3b3JraW5nIGNvcHkgY2hhbmdlcyBmcm9tIEhFQUQuXHJcbiAgY2hpbGRfcHJvY2Vzcy5leGVjU3luYyggJ2dpdCBkaWZmLWluZGV4IC0tcXVpZXQgSEVBRCAtLScgKTtcclxuICBjb25zb2xlLmxvZyggJ05vIGxvY2FsZSBpbmZvIGNoYW5nZXMsIG5vIGNvbW1pdCBuZWVkZWQuJyApO1xyXG59XHJcbmNhdGNoKCBlICkge1xyXG4gIG5lZWRzQ29tbWl0ID0gdHJ1ZTtcclxufVxyXG5cclxuaWYgKCBuZWVkc0NvbW1pdCApIHtcclxuICB0cnkge1xyXG5cclxuICAgIGNvbnNvbGUubG9nKCAncHVsbGluZycgKTtcclxuXHJcbiAgICAvLyBTb21lIGRldnMgaGF2ZSByZWJhc2Ugc2V0IGJ5IGRlZmF1bHQsIGFuZCB5b3UgY2Fubm90IHJlYmFzZS1wdWxsIHdpdGggd29ya2luZyBjb3B5IGNoYW5nZXMuXHJcbiAgICBjaGlsZF9wcm9jZXNzLmV4ZWNTeW5jKCAnZ2l0IHB1bGwgLS1uby1yZWJhc2UnICk7XHJcblxyXG4gICAgY2hpbGRfcHJvY2Vzcy5leGVjU3luYyggJ2dpdCBhZGQgLi4vLi4vZGF0YS9sb2NhbGVJbmZvLmpzb24nICk7XHJcbiAgICBjaGlsZF9wcm9jZXNzLmV4ZWNTeW5jKCAnZ2l0IGFkZCAuL2xvY2FsZUluZm8uanMnICk7XHJcbiAgICBjaGlsZF9wcm9jZXNzLmV4ZWNTeW5jKCAnZ2l0IGFkZCAuL2xvY2FsZUluZm9Nb2R1bGUuanMnICk7XHJcblxyXG4gICAgaWYgKCBuZWVkc0NvbW1pdCApIHtcclxuICAgICAgY29uc29sZS5sb2coICdjb21taXR0aW5nJyApO1xyXG4gICAgICBjaGlsZF9wcm9jZXNzLmV4ZWNTeW5jKCAnZ2l0IGNvbW1pdCAtLW5vLXZlcmlmeSAuLi8uLi9kYXRhL2xvY2FsZUluZm8uanNvbiAuL2xvY2FsZUluZm8uanMgLi9sb2NhbGVJbmZvTW9kdWxlLmpzIC1tIFwiQXV0b21hdGljYWxseSB1cGRhdGVkIGdlbmVyYXRlZCBsb2NhbGVJbmZvIGZpbGVzXCInICk7XHJcbiAgICAgIGNvbnNvbGUubG9nKCAncHVzaGluZycgKTtcclxuICAgICAgY2hpbGRfcHJvY2Vzcy5leGVjU3luYyggJ2dpdCBwdXNoJyApO1xyXG4gICAgfVxyXG4gIH1cclxuICBjYXRjaCggZSApIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoICdVbmFibGUgdG8gdXBkYXRlIGZpbGVzIGluIGdpdC4nLCBlICk7XHJcbiAgfVxyXG59Il0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxJQUFNQSxhQUFhLEdBQUdDLE9BQU8sQ0FBRSxlQUFnQixDQUFDO0FBQ2hELElBQU1DLEVBQUUsR0FBR0QsT0FBTyxDQUFFLElBQUssQ0FBQzs7QUFFMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsSUFBTUUsVUFBVSxHQUFHQyxJQUFJLENBQUNDLEtBQUssQ0FBRUgsRUFBRSxDQUFDSSxZQUFZLENBQUUsZ0NBQWdDLEVBQUUsTUFBTyxDQUFFLENBQUM7O0FBRTVGO0FBQ0EsSUFBSUMsaUJBQWlCLEdBQUcsR0FBRztBQUMzQjtBQUNBLElBQU1DLE9BQU8sR0FBRyxPQUFPLENBQUMsQ0FBQztBQUN6QjtBQUNBLFNBQUFDLEVBQUEsTUFBQUMsWUFBQSxHQUFzQkMsTUFBTSxDQUFDQyxJQUFJLENBQUVULFVBQVcsQ0FBQyxFQUFBTSxFQUFB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