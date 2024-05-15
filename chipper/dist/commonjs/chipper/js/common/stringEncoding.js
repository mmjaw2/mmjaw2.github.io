"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
// Copyright 2023-2024, University of Colorado Boulder

/**
 * Handles encoding and decoding of strings to/from a compact format, to lower the file size and download size of
 * simulations.
 *
 * The encoding is stateful, and takes the approximate form of:
 *
 * for each locale:
 *   ( ADD_LOCALE locale )+
 * for each string key:
 *   ( PUSH_TOKEN token )*
 *   START_STRING
 *   for each locale (en, or has a non-en translation):
 *     (SWITCH_LOCALE locale)?
 *     (ADD_STRING string | ADD_STRING_COPY_LAST)
 *   END_STRING
 *   ( POP_TOKEN token )*
 *
 * We add some combinations of "pop + push", and forms that automatically add on the slash/dot/LTR/RTL substrings.
 *
 * String keys are constructed from stack.join( '' ), we'll push/pop substrings of the string key as we go.
 *
 * If a translation is the same as the English translation, it will be omitted (and the END_STRING without having set
 * a translation will indicate it should be filled with this value). If multiple translations share a non-English value,
 * we can note the value is the same as the last-given string.
 *
 * We also record the last-used locale, so that if we only have one translation, we can omit the SWITCH_LOCALE.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

/* eslint-env node */

var _ = require('lodash');
var toLessEscapedString = require('./toLessEscapedString');
var PUSH_TOKEN = "\x01"; // push string on the stack
var PUSH_TOKEN_SLASH = "\x02"; // push `${string}/` on the stack
var PUSH_TOKEN_DOT = "\x03"; // push `${string}.` on the stack
var POP = "\x04"; // pop from the stack
var POP_PUSH_TOKEN = "\x05"; // pop from the stack, then push string on the stack
var POP_PUSH_TOKEN_SLASH = "\x06"; // pop from the stack, then push `${string}/` on the stack
var POP_PUSH_TOKEN_DOT = "\x07"; // pop from the stack, then push `${string}.` on the stack
var SWITCH_LOCALE = "\b"; // switch to the given locale
var START_STRING = "\t"; // start a string
var END_STRING = "\n"; // end a string (and fill in missing translations)
var ADD_STRING = "\x0B"; // add a translation string to the current locale and stringKey
var ADD_STRING_LTR_POP = "\f"; // add `${LTR}${string}${POP}` to the current locale and stringKey
var ADD_STRING_RTL_POP = "\r"; // add `${RTL}${string}${POP}` to the current locale and stringKey
var ADD_STRING_COPY_LAST = "\x0E"; // add the last-used translation to the current locale and stringKey
var ADD_LOCALE = "\x0F"; // add a locale (at the start)
var ESCAPE_CHARACTER = "\x10"; // we'll need to escape any of these characters if they appear in a string

var MAX_CONTROL_CHARACTER_CODE_POINT = 0x10;
var ESCAPE_CHARACTER_CODE_POINT = 0x10;
var CONTROL_CHARACTERS = [PUSH_TOKEN, PUSH_TOKEN_SLASH, PUSH_TOKEN_DOT, POP, POP_PUSH_TOKEN, POP_PUSH_TOKEN_SLASH, POP_PUSH_TOKEN_DOT, SWITCH_LOCALE, START_STRING, END_STRING, ADD_STRING, ADD_STRING_LTR_POP, ADD_STRING_RTL_POP, ADD_STRING_COPY_LAST, ADD_LOCALE, ESCAPE_CHARACTER];

// Our LTR/RTL embedding characters
var CHAR_LTR = "\u202A";
var CHAR_RTL = "\u202B";
var CHAR_POP = "\u202C";

// Converts a map[ locale ][ stringKey ] => string (with a compact encoding)
var encodeStringMap = function encodeStringMap(stringMap) {
  var locales = Object.keys(stringMap).filter(function (locale) {
    return !!stringMap[locale];
  }).sort();

  // Get all string keys
  var stringKeysSet = new Set();
  locales.forEach(function (locale) {
    Object.keys(stringMap[locale]).forEach(function (stringKey) {
      stringKeysSet.add(stringKey);
    });
  });
  // For our stack encoding, we'll want them sorted so we can push/pop deltas between each one
  var stringKeys = _toConsumableArray(stringKeysSet).sort();
  var stack = [];
  var currentLocale = null;
  var currentStringValue = null;
  var output = '';

  // Returns the index of the first character that differs between a and b
  var getMatchIndex = function getMatchIndex(a, b) {
    var i = 0;
    while (i < Math.min(a.length, b.length) && a[i] === b[i]) {
      i++;
    }
    return i;
  };

  // Encodes a string, escaping any control characters
  var encode = function encode(string) {
    var result = '';
    string.split(/(?:)/).forEach(function (_char) {
      if (CONTROL_CHARACTERS.includes(_char)) {
        result += ESCAPE_CHARACTER + _char;
      } else {
        result += _char;
      }
    });
    return result;
  };

  // Adds a locale to the output
  var addLocale = function addLocale(locale) {
    output += ADD_LOCALE + encode(locale);
  };

  // Pushes a token onto the stack (combining with the previous token if possible)
  var push = function push(token) {
    stack.push(token);
    var hasPop = output.length > 0 && output[output.length - 1] === POP;
    if (hasPop) {
      output = output.slice(0, -1);
    }
    var code;
    if (token.endsWith('/')) {
      token = token.slice(0, -1);
      code = hasPop ? POP_PUSH_TOKEN_SLASH : PUSH_TOKEN_SLASH;
    } else if (token.endsWith('.')) {
      token = token.slice(0, -1);
      code = hasPop ? POP_PUSH_TOKEN_DOT : PUSH_TOKEN_DOT;
    } else {
      code = hasPop ? POP_PUSH_TOKEN : PUSH_TOKEN;
    }
    output += code + encode(token);
  };

  // Pops a token from the stack
  var pop = function pop() {
    stack.pop();
    output += POP;
  };
  var startString = function startString() {
    output += START_STRING;
  };
  var endString = function endString() {
    output += END_STRING;
  };
  var switchLocale = function switchLocale(locale) {
    currentLocale = locale;
    output += SWITCH_LOCALE + encode(locale);
  };
  var addStringCopyLast = function addStringCopyLast() {
    output += ADD_STRING_COPY_LAST;
  };

  // Adds a string to the output, encoding LTR/RTL wrapped forms in a more compact way
  var addString = function addString(string) {
    currentStringValue = string;
    var code;
    if (string.startsWith(CHAR_LTR) && string.endsWith(CHAR_POP)) {
      code = ADD_STRING_LTR_POP;
      string = string.slice(1, -1);
    } else if (string.startsWith(CHAR_RTL) && string.endsWith(CHAR_POP)) {
      code = ADD_STRING_RTL_POP;
      string = string.slice(1, -1);
    } else {
      code = ADD_STRING;
    }
    output += code + encode(string);
  };

  ////////////////////////////////////////////////////////////
  // Start of encoding
  ////////////////////////////////////////////////////////////

  locales.forEach(function (locale) {
    addLocale(locale);
  });
  var _loop = function _loop() {
    var stringKey = stringKeys[i];

    // Encode the string key
    {
      while (!stringKey.startsWith(stack.join(''))) {
        pop();
      }

      // We will whittle down the remainder of the string key as we go. We start here from the delta from the last key
      var remainder = stringKey.slice(stack.join('').length);

      // Separate out the requirejsNamespace, if it exists
      if (remainder.includes('/')) {
        var bits = remainder.split('/');
        var token = bits[0] + '/';
        push(token);
        remainder = remainder.slice(token.length);
      }

      // Separate out dot-separated tokens to push independently.
      while (remainder.includes('.')) {
        var _bits = remainder.split('.');
        var _token = _bits[0] + '.';
        push(_token);
        remainder = remainder.slice(_token.length);
      }

      // See if we share a non-trivial prefix with the next string key, and if so, push it
      if (i + 1 < stringKeys.length) {
        var nextStringKey = stringKeys[i + 1];
        var matchIndex = getMatchIndex(remainder, nextStringKey.slice(stack.join('').length));
        if (matchIndex > 1) {
          var _token2 = remainder.slice(0, matchIndex);
          push(_token2);
          remainder = remainder.slice(_token2.length);
        }
      }

      // The rest!
      if (remainder.length) {
        push(remainder);
      }
    }

    // Encode the string
    {
      var defaultValue = stringMap.en[stringKey];

      // Find ONLY the locales that we'll include
      var stringLocales = locales.filter(function (locale) {
        if (locale === 'en') {
          return true;
        }
        var string = stringMap[locale][stringKey];
        return string !== undefined && string !== defaultValue;
      });
      var stringValues = stringLocales.map(function (locale) {
        return stringMap[locale][stringKey];
      });

      // We'll order things by the string values, so we can "copy" when they are the same
      var indices = _.sortBy(_.range(0, stringLocales.length), function (i) {
        return stringValues[i];
      });
      startString();
      indices.forEach(function (i) {
        var locale = stringLocales[i];
        var string = stringValues[i];
        if (locale !== currentLocale) {
          switchLocale(locale);
        }
        if (string === currentStringValue) {
          addStringCopyLast();
        } else {
          addString(string);
        }
      });
      endString();
    }
  };
  for (var i = 0; i < stringKeys.length; i++) {
    _loop();
  }

  // Double-check our output results in the correct structure
  var testStringMap = decodeStringMap(output);
  for (var locale in stringMap) {
    for (var stringKey in stringMap[locale]) {
      if (stringMap[locale][stringKey] !== testStringMap[locale][stringKey]) {
        throw new Error("String map encoding failed, mismatch at ".concat(locale, " ").concat(stringKey));
      }
    }
  }
  return output;
};

// Converts a compact encoding to map[ locale ][ stringKey ]: string
var decodeStringMap = function decodeStringMap(encodedString) {
  var stringMap = {}; // map[ locale ][ stringKey ] => string
  var locales = [];
  var stack = []; // string[], stack.join( '' ) will be the current stringKey
  var currentLocale = null;
  var currentStringValue = null; // the last string value we've seen, for ADD_STRING_COPY_LAST
  var enStringValue = null; // the English string value, for omitted translations
  var localeSet = new Set(); // so we can track the omitted translations
  var stringKey = null;
  var addLocale = function addLocale(locale) {
    stringMap[locale] = {};
    locales.push(locale);
  };
  var push = function push(token) {
    stack.push(token);
  };
  var pop = function pop() {
    stack.pop();
  };
  var switchLocale = function switchLocale(locale) {
    currentLocale = locale;
  };
  var addString = function addString(string) {
    currentStringValue = string;
    stringMap[currentLocale][stringKey] = string;
    if (currentLocale === 'en') {
      enStringValue = string;
    }
    localeSet.add(currentLocale);
  };
  var addStringCopy = function addStringCopy() {
    addString(currentStringValue);
  };
  var startString = function startString() {
    localeSet.clear();
    enStringValue = null;
    stringKey = stack.join('');
  };
  var endString = function endString() {
    for (var i = 0; i < locales.length; i++) {
      var locale = locales[i];
      if (!localeSet.has(locale)) {
        stringMap[locale][stringKey] = enStringValue;
      }
    }
  };
  var index = 0;
  var bits = encodedString.split(/(?:)/); // split by code point, so we don't have to worry about surrogate pairs

  // Reads a string from the bits (at our current index), until we hit a non-escaped control character
  var readString = function readString() {
    var result = '';
    while (index < bits.length) {
      var _char2 = bits[index];
      var codePoint = _char2.codePointAt(0);

      // Pass through any non-control characters
      if (codePoint > MAX_CONTROL_CHARACTER_CODE_POINT) {
        result += _char2;
        index++;
      } else if (codePoint === ESCAPE_CHARACTER_CODE_POINT) {
        var nextChar = bits[index + 1];
        result += nextChar;
        index += 2;
      } else {
        break;
      }
    }
    return result;
  };
  while (index < bits.length) {
    var code = bits[index++];
    if (code === PUSH_TOKEN) {
      push(readString());
    } else if (code === PUSH_TOKEN_SLASH) {
      push(readString() + '/');
    } else if (code === PUSH_TOKEN_DOT) {
      push(readString() + '.');
    } else if (code === POP) {
      pop();
    } else if (code === POP_PUSH_TOKEN) {
      pop();
      push(readString());
    } else if (code === POP_PUSH_TOKEN_SLASH) {
      pop();
      push(readString() + '/');
    } else if (code === POP_PUSH_TOKEN_DOT) {
      pop();
      push(readString() + '.');
    } else if (code === SWITCH_LOCALE) {
      switchLocale(readString());
    } else if (code === START_STRING) {
      startString();
    } else if (code === END_STRING) {
      endString();
    } else if (code === ADD_STRING) {
      addString(readString());
    } else if (code === ADD_STRING_LTR_POP) {
      addString(CHAR_LTR + readString() + CHAR_POP);
    } else if (code === ADD_STRING_RTL_POP) {
      addString(CHAR_RTL + readString() + CHAR_POP);
    } else if (code === ADD_STRING_COPY_LAST) {
      addStringCopy();
    } else if (code === ADD_LOCALE) {
      addLocale(readString());
    } else {
      throw new Error('Unrecognized code: ' + code);
    }
  }
  return stringMap;
};

// A minified version of the above, for inclusion in the JS bundle. Approximately 1 kB.
// a = addString
// r = readString
// f = String.fromCharCode
// m = stringMap
// x = locales
// l = locale
// s = stack
// X = currentLocale
// S = currentStringValue
// e = enStringValue
// k = stringKey
// t = localeSet
// b = bits
// j = index
// c = code
// d = char
// p = codePoint
// q = string/result
// y = encodedString
/* eslint-disable */
var smallDecodeStringMapString = "y=>{let m={};let x=[];let s=[];let X=null;let S=null;let e=null;let t=new Set();let k=null;let f=String.fromCharCode;let A=f(1);let B=f(2);let C=f(3);let D=f(4);let E=f(5);let F=f(6);let G=f(7);let H=f(8);let I=f(9);let J=f(0xA);let K=f(0xB);let L=f(0xC);let M=f(0xD);let N=f(0xE);let O=f(0xF);let a=q=>{S=q;m[X][k]=q;if(X=='en'){e=q;}t.add(X);};let j=0;let b=y.split(/(?:)/u);let r=()=>{let q='';while(j<b.length){let d=b[j];let p=d.codePointAt(0);if(p>0x10){q+=d;j++;}else if(p==0x10){q+=b[j+1];j+=2;}else{break;}}return q;};while(j<b.length){let c=b[j++];if(c==A){s.push(r());}else if(c==B){s.push(r()+'/');}else if(c==C){s.push(r()+'.');}else if(c==D){s.pop();}else if(c==E){s.pop();s.push(r());}else if(c==F){s.pop();s.push(r()+'/');}else if(c==G){s.pop();s.push(r()+'.');}else if(c==H){X=r();}else if(c==I){t.clear();e=null;k=s.join('');}else if(c==J){for(let i=0;i<x.length;i++){let l=x[i];if(!t.has(l)){m[l][k]=e;}}}else if(c==K){a(r());}else if(c==L){a(`\u202A${r()}\u202C`);}else if(c==M){a(`\u202B${r()}\u202C`);}else if(c==N){a(S);}else if(c==O){let l=r();m[l]={};x.push(l);}}return m;}";
/* eslint-enable */

// Given a stringMap (map[ locale ][ stringKey ] => string), returns a JS expression string that will decode to it.
var encodeStringMapToJS = function encodeStringMapToJS(stringMap) {
  return "(".concat(smallDecodeStringMapString, ")(").concat(toLessEscapedString(encodeStringMap(stringMap)), ")");
};
module.exports = {
  encodeStringMap: encodeStringMap,
  decodeStringMap: decodeStringMap,
  encodeStringMapToJS: encodeStringMapToJS
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsInRvTGVzc0VzY2FwZWRTdHJpbmciLCJQVVNIX1RPS0VOIiwiUFVTSF9UT0tFTl9TTEFTSCIsIlBVU0hfVE9LRU5fRE9UIiwiUE9QIiwiUE9QX1BVU0hfVE9LRU4iLCJQT1BfUFVTSF9UT0tFTl9TTEFTSCIsIlBPUF9QVVNIX1RPS0VOX0RPVCIsIlNXSVRDSF9MT0NBTEUiLCJTVEFSVF9TVFJJTkciLCJFTkRfU1RSSU5HIiwiQUREX1NUUklORyIsIkFERF9TVFJJTkdfTFRSX1BPUCIsIkFERF9TVFJJTkdfUlRMX1BPUCIsIkFERF9TVFJJTkdfQ09QWV9MQVNUIiwiQUREX0xPQ0FMRSIsIkVTQ0FQRV9DSEFSQUNURVIiLCJNQVhfQ09OVFJPTF9DSEFSQUNURVJfQ09ERV9QT0lOVCIsIkVTQ0FQRV9DSEFSQUNURVJfQ09ERV9QT0lOVCIsIkNPTlRST0xfQ0hBUkFDVEVSUyIsIkNIQVJfTFRSIiwiQ0hBUl9SVEwiLCJDSEFSX1BPUCIsImVuY29kZVN0cmluZ01hcCIsInN0cmluZ01hcCIsImxvY2FsZXMiLCJPYmplY3QiLCJrZXlzIiwiZmlsdGVyIiwibG9jYWxlIiwic29ydCIsInN0cmluZ0tleXNTZXQiLCJTZXQiLCJmb3JFYWNoIiwic3RyaW5nS2V5IiwiYWRkIiwic3RyaW5nS2V5cyIsIl90b0NvbnN1bWFibGVBcnJheSIsInN0YWNrIiwiY3VycmVudExvY2FsZSIsImN1cnJlbnRTdHJpbmdWYWx1ZSIsIm91dHB1dCIsImdldE1hdGNoSW5kZXgiLCJhIiwiYiIsImkiLCJNYXRoIiwibWluIiwibGVuZ3RoIiwiZW5jb2RlIiwic3RyaW5nIiwicmVzdWx0Iiwic3BsaXQiLCJjaGFyIiwiaW5jbHVkZXMiLCJhZGRMb2NhbGUiLCJwdXNoIiwidG9rZW4iLCJoYXNQb3AiLCJzbGljZSIsImNvZGUiLCJlbmRzV2l0aCIsInBvcCIsInN0YXJ0U3RyaW5nIiwiZW5kU3RyaW5nIiwic3dpdGNoTG9jYWxlIiwiYWRkU3RyaW5nQ29weUxhc3QiLCJhZGRTdHJpbmciLCJzdGFydHNXaXRoIiwiX2xvb3AiLCJqb2luIiwicmVtYWluZGVyIiwiYml0cyIsIm5leHRTdHJpbmdLZXkiLCJtYXRjaEluZGV4IiwiZGVmYXVsdFZhbHVlIiwiZW4iLCJzdHJpbmdMb2NhbGVzIiwidW5kZWZpbmVkIiwic3RyaW5nVmFsdWVzIiwibWFwIiwiaW5kaWNlcyIsInNvcnRCeSIsInJhbmdlIiwidGVzdFN0cmluZ01hcCIsImRlY29kZVN0cmluZ01hcCIsIkVycm9yIiwiY29uY2F0IiwiZW5jb2RlZFN0cmluZyIsImVuU3RyaW5nVmFsdWUiLCJsb2NhbGVTZXQiLCJhZGRTdHJpbmdDb3B5IiwiY2xlYXIiLCJoYXMiLCJpbmRleCIsInJlYWRTdHJpbmciLCJjb2RlUG9pbnQiLCJjb2RlUG9pbnRBdCIsIm5leHRDaGFyIiwic21hbGxEZWNvZGVTdHJpbmdNYXBTdHJpbmciLCJlbmNvZGVTdHJpbmdNYXBUb0pTIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJzb3VyY2VzIjpbInN0cmluZ0VuY29kaW5nLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEhhbmRsZXMgZW5jb2RpbmcgYW5kIGRlY29kaW5nIG9mIHN0cmluZ3MgdG8vZnJvbSBhIGNvbXBhY3QgZm9ybWF0LCB0byBsb3dlciB0aGUgZmlsZSBzaXplIGFuZCBkb3dubG9hZCBzaXplIG9mXHJcbiAqIHNpbXVsYXRpb25zLlxyXG4gKlxyXG4gKiBUaGUgZW5jb2RpbmcgaXMgc3RhdGVmdWwsIGFuZCB0YWtlcyB0aGUgYXBwcm94aW1hdGUgZm9ybSBvZjpcclxuICpcclxuICogZm9yIGVhY2ggbG9jYWxlOlxyXG4gKiAgICggQUREX0xPQ0FMRSBsb2NhbGUgKStcclxuICogZm9yIGVhY2ggc3RyaW5nIGtleTpcclxuICogICAoIFBVU0hfVE9LRU4gdG9rZW4gKSpcclxuICogICBTVEFSVF9TVFJJTkdcclxuICogICBmb3IgZWFjaCBsb2NhbGUgKGVuLCBvciBoYXMgYSBub24tZW4gdHJhbnNsYXRpb24pOlxyXG4gKiAgICAgKFNXSVRDSF9MT0NBTEUgbG9jYWxlKT9cclxuICogICAgIChBRERfU1RSSU5HIHN0cmluZyB8IEFERF9TVFJJTkdfQ09QWV9MQVNUKVxyXG4gKiAgIEVORF9TVFJJTkdcclxuICogICAoIFBPUF9UT0tFTiB0b2tlbiApKlxyXG4gKlxyXG4gKiBXZSBhZGQgc29tZSBjb21iaW5hdGlvbnMgb2YgXCJwb3AgKyBwdXNoXCIsIGFuZCBmb3JtcyB0aGF0IGF1dG9tYXRpY2FsbHkgYWRkIG9uIHRoZSBzbGFzaC9kb3QvTFRSL1JUTCBzdWJzdHJpbmdzLlxyXG4gKlxyXG4gKiBTdHJpbmcga2V5cyBhcmUgY29uc3RydWN0ZWQgZnJvbSBzdGFjay5qb2luKCAnJyApLCB3ZSdsbCBwdXNoL3BvcCBzdWJzdHJpbmdzIG9mIHRoZSBzdHJpbmcga2V5IGFzIHdlIGdvLlxyXG4gKlxyXG4gKiBJZiBhIHRyYW5zbGF0aW9uIGlzIHRoZSBzYW1lIGFzIHRoZSBFbmdsaXNoIHRyYW5zbGF0aW9uLCBpdCB3aWxsIGJlIG9taXR0ZWQgKGFuZCB0aGUgRU5EX1NUUklORyB3aXRob3V0IGhhdmluZyBzZXRcclxuICogYSB0cmFuc2xhdGlvbiB3aWxsIGluZGljYXRlIGl0IHNob3VsZCBiZSBmaWxsZWQgd2l0aCB0aGlzIHZhbHVlKS4gSWYgbXVsdGlwbGUgdHJhbnNsYXRpb25zIHNoYXJlIGEgbm9uLUVuZ2xpc2ggdmFsdWUsXHJcbiAqIHdlIGNhbiBub3RlIHRoZSB2YWx1ZSBpcyB0aGUgc2FtZSBhcyB0aGUgbGFzdC1naXZlbiBzdHJpbmcuXHJcbiAqXHJcbiAqIFdlIGFsc28gcmVjb3JkIHRoZSBsYXN0LXVzZWQgbG9jYWxlLCBzbyB0aGF0IGlmIHdlIG9ubHkgaGF2ZSBvbmUgdHJhbnNsYXRpb24sIHdlIGNhbiBvbWl0IHRoZSBTV0lUQ0hfTE9DQUxFLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuLyogZXNsaW50LWVudiBub2RlICovXHJcblxyXG5jb25zdCBfID0gcmVxdWlyZSggJ2xvZGFzaCcgKTtcclxuY29uc3QgdG9MZXNzRXNjYXBlZFN0cmluZyA9IHJlcXVpcmUoICcuL3RvTGVzc0VzY2FwZWRTdHJpbmcnICk7XHJcblxyXG5jb25zdCBQVVNIX1RPS0VOID0gJ1xcdTAwMDEnOyAvLyBwdXNoIHN0cmluZyBvbiB0aGUgc3RhY2tcclxuY29uc3QgUFVTSF9UT0tFTl9TTEFTSCA9ICdcXHUwMDAyJzsgLy8gcHVzaCBgJHtzdHJpbmd9L2Agb24gdGhlIHN0YWNrXHJcbmNvbnN0IFBVU0hfVE9LRU5fRE9UID0gJ1xcdTAwMDMnOyAvLyBwdXNoIGAke3N0cmluZ30uYCBvbiB0aGUgc3RhY2tcclxuY29uc3QgUE9QID0gJ1xcdTAwMDQnOyAvLyBwb3AgZnJvbSB0aGUgc3RhY2tcclxuY29uc3QgUE9QX1BVU0hfVE9LRU4gPSAnXFx1MDAwNSc7IC8vIHBvcCBmcm9tIHRoZSBzdGFjaywgdGhlbiBwdXNoIHN0cmluZyBvbiB0aGUgc3RhY2tcclxuY29uc3QgUE9QX1BVU0hfVE9LRU5fU0xBU0ggPSAnXFx1MDAwNic7IC8vIHBvcCBmcm9tIHRoZSBzdGFjaywgdGhlbiBwdXNoIGAke3N0cmluZ30vYCBvbiB0aGUgc3RhY2tcclxuY29uc3QgUE9QX1BVU0hfVE9LRU5fRE9UID0gJ1xcdTAwMDcnOyAvLyBwb3AgZnJvbSB0aGUgc3RhY2ssIHRoZW4gcHVzaCBgJHtzdHJpbmd9LmAgb24gdGhlIHN0YWNrXHJcbmNvbnN0IFNXSVRDSF9MT0NBTEUgPSAnXFx1MDAwOCc7IC8vIHN3aXRjaCB0byB0aGUgZ2l2ZW4gbG9jYWxlXHJcbmNvbnN0IFNUQVJUX1NUUklORyA9ICdcXHUwMDA5JzsgLy8gc3RhcnQgYSBzdHJpbmdcclxuY29uc3QgRU5EX1NUUklORyA9ICdcXHUwMDBBJzsgLy8gZW5kIGEgc3RyaW5nIChhbmQgZmlsbCBpbiBtaXNzaW5nIHRyYW5zbGF0aW9ucylcclxuY29uc3QgQUREX1NUUklORyA9ICdcXHUwMDBCJzsgLy8gYWRkIGEgdHJhbnNsYXRpb24gc3RyaW5nIHRvIHRoZSBjdXJyZW50IGxvY2FsZSBhbmQgc3RyaW5nS2V5XHJcbmNvbnN0IEFERF9TVFJJTkdfTFRSX1BPUCA9ICdcXHUwMDBDJzsgLy8gYWRkIGAke0xUUn0ke3N0cmluZ30ke1BPUH1gIHRvIHRoZSBjdXJyZW50IGxvY2FsZSBhbmQgc3RyaW5nS2V5XHJcbmNvbnN0IEFERF9TVFJJTkdfUlRMX1BPUCA9ICdcXHUwMDBEJzsgLy8gYWRkIGAke1JUTH0ke3N0cmluZ30ke1BPUH1gIHRvIHRoZSBjdXJyZW50IGxvY2FsZSBhbmQgc3RyaW5nS2V5XHJcbmNvbnN0IEFERF9TVFJJTkdfQ09QWV9MQVNUID0gJ1xcdTAwMEUnOyAvLyBhZGQgdGhlIGxhc3QtdXNlZCB0cmFuc2xhdGlvbiB0byB0aGUgY3VycmVudCBsb2NhbGUgYW5kIHN0cmluZ0tleVxyXG5jb25zdCBBRERfTE9DQUxFID0gJ1xcdTAwMEYnOyAvLyBhZGQgYSBsb2NhbGUgKGF0IHRoZSBzdGFydClcclxuY29uc3QgRVNDQVBFX0NIQVJBQ1RFUiA9ICdcXHUwMDEwJzsgLy8gd2UnbGwgbmVlZCB0byBlc2NhcGUgYW55IG9mIHRoZXNlIGNoYXJhY3RlcnMgaWYgdGhleSBhcHBlYXIgaW4gYSBzdHJpbmdcclxuXHJcbmNvbnN0IE1BWF9DT05UUk9MX0NIQVJBQ1RFUl9DT0RFX1BPSU5UID0gMHgxMDtcclxuY29uc3QgRVNDQVBFX0NIQVJBQ1RFUl9DT0RFX1BPSU5UID0gMHgxMDtcclxuXHJcbmNvbnN0IENPTlRST0xfQ0hBUkFDVEVSUyA9IFtcclxuICBQVVNIX1RPS0VOLFxyXG4gIFBVU0hfVE9LRU5fU0xBU0gsXHJcbiAgUFVTSF9UT0tFTl9ET1QsXHJcbiAgUE9QLFxyXG4gIFBPUF9QVVNIX1RPS0VOLFxyXG4gIFBPUF9QVVNIX1RPS0VOX1NMQVNILFxyXG4gIFBPUF9QVVNIX1RPS0VOX0RPVCxcclxuICBTV0lUQ0hfTE9DQUxFLFxyXG4gIFNUQVJUX1NUUklORyxcclxuICBFTkRfU1RSSU5HLFxyXG4gIEFERF9TVFJJTkcsXHJcbiAgQUREX1NUUklOR19MVFJfUE9QLFxyXG4gIEFERF9TVFJJTkdfUlRMX1BPUCxcclxuICBBRERfU1RSSU5HX0NPUFlfTEFTVCxcclxuICBBRERfTE9DQUxFLFxyXG4gIEVTQ0FQRV9DSEFSQUNURVJcclxuXTtcclxuXHJcbi8vIE91ciBMVFIvUlRMIGVtYmVkZGluZyBjaGFyYWN0ZXJzXHJcbmNvbnN0IENIQVJfTFRSID0gJ1xcdTIwMkEnO1xyXG5jb25zdCBDSEFSX1JUTCA9ICdcXHUyMDJCJztcclxuY29uc3QgQ0hBUl9QT1AgPSAnXFx1MjAyQyc7XHJcblxyXG4vLyBDb252ZXJ0cyBhIG1hcFsgbG9jYWxlIF1bIHN0cmluZ0tleSBdID0+IHN0cmluZyAod2l0aCBhIGNvbXBhY3QgZW5jb2RpbmcpXHJcbmNvbnN0IGVuY29kZVN0cmluZ01hcCA9IHN0cmluZ01hcCA9PiB7XHJcbiAgY29uc3QgbG9jYWxlcyA9IE9iamVjdC5rZXlzKCBzdHJpbmdNYXAgKS5maWx0ZXIoIGxvY2FsZSA9PiAhIXN0cmluZ01hcFsgbG9jYWxlIF0gKS5zb3J0KCk7XHJcblxyXG4gIC8vIEdldCBhbGwgc3RyaW5nIGtleXNcclxuICBjb25zdCBzdHJpbmdLZXlzU2V0ID0gbmV3IFNldCgpO1xyXG4gIGxvY2FsZXMuZm9yRWFjaCggbG9jYWxlID0+IHtcclxuICAgIE9iamVjdC5rZXlzKCBzdHJpbmdNYXBbIGxvY2FsZSBdICkuZm9yRWFjaCggc3RyaW5nS2V5ID0+IHtcclxuICAgICAgc3RyaW5nS2V5c1NldC5hZGQoIHN0cmluZ0tleSApO1xyXG4gICAgfSApO1xyXG4gIH0gKTtcclxuICAvLyBGb3Igb3VyIHN0YWNrIGVuY29kaW5nLCB3ZSdsbCB3YW50IHRoZW0gc29ydGVkIHNvIHdlIGNhbiBwdXNoL3BvcCBkZWx0YXMgYmV0d2VlbiBlYWNoIG9uZVxyXG4gIGNvbnN0IHN0cmluZ0tleXMgPSBbIC4uLnN0cmluZ0tleXNTZXQgXS5zb3J0KCk7XHJcblxyXG5cclxuICBjb25zdCBzdGFjayA9IFtdO1xyXG4gIGxldCBjdXJyZW50TG9jYWxlID0gbnVsbDtcclxuICBsZXQgY3VycmVudFN0cmluZ1ZhbHVlID0gbnVsbDtcclxuICBsZXQgb3V0cHV0ID0gJyc7XHJcblxyXG4gIC8vIFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBmaXJzdCBjaGFyYWN0ZXIgdGhhdCBkaWZmZXJzIGJldHdlZW4gYSBhbmQgYlxyXG4gIGNvbnN0IGdldE1hdGNoSW5kZXggPSAoIGEsIGIgKSA9PiB7XHJcbiAgICBsZXQgaSA9IDA7XHJcbiAgICB3aGlsZSAoIGkgPCBNYXRoLm1pbiggYS5sZW5ndGgsIGIubGVuZ3RoICkgJiYgYVsgaSBdID09PSBiWyBpIF0gKSB7XHJcbiAgICAgIGkrKztcclxuICAgIH1cclxuICAgIHJldHVybiBpO1xyXG4gIH07XHJcblxyXG4gIC8vIEVuY29kZXMgYSBzdHJpbmcsIGVzY2FwaW5nIGFueSBjb250cm9sIGNoYXJhY3RlcnNcclxuICBjb25zdCBlbmNvZGUgPSBzdHJpbmcgPT4ge1xyXG4gICAgbGV0IHJlc3VsdCA9ICcnO1xyXG5cclxuICAgIHN0cmluZy5zcGxpdCggLyg/OikvdSApLmZvckVhY2goIGNoYXIgPT4ge1xyXG4gICAgICBpZiAoIENPTlRST0xfQ0hBUkFDVEVSUy5pbmNsdWRlcyggY2hhciApICkge1xyXG4gICAgICAgIHJlc3VsdCArPSBFU0NBUEVfQ0hBUkFDVEVSICsgY2hhcjtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByZXN1bHQgKz0gY2hhcjtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfTtcclxuXHJcbiAgLy8gQWRkcyBhIGxvY2FsZSB0byB0aGUgb3V0cHV0XHJcbiAgY29uc3QgYWRkTG9jYWxlID0gbG9jYWxlID0+IHtcclxuICAgIG91dHB1dCArPSBBRERfTE9DQUxFICsgZW5jb2RlKCBsb2NhbGUgKTtcclxuICB9O1xyXG5cclxuICAvLyBQdXNoZXMgYSB0b2tlbiBvbnRvIHRoZSBzdGFjayAoY29tYmluaW5nIHdpdGggdGhlIHByZXZpb3VzIHRva2VuIGlmIHBvc3NpYmxlKVxyXG4gIGNvbnN0IHB1c2ggPSB0b2tlbiA9PiB7XHJcbiAgICBzdGFjay5wdXNoKCB0b2tlbiApO1xyXG4gICAgY29uc3QgaGFzUG9wID0gb3V0cHV0Lmxlbmd0aCA+IDAgJiYgb3V0cHV0WyBvdXRwdXQubGVuZ3RoIC0gMSBdID09PSBQT1A7XHJcblxyXG4gICAgaWYgKCBoYXNQb3AgKSB7XHJcbiAgICAgIG91dHB1dCA9IG91dHB1dC5zbGljZSggMCwgLTEgKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgY29kZTtcclxuICAgIGlmICggdG9rZW4uZW5kc1dpdGgoICcvJyApICkge1xyXG4gICAgICB0b2tlbiA9IHRva2VuLnNsaWNlKCAwLCAtMSApO1xyXG4gICAgICBjb2RlID0gaGFzUG9wID8gUE9QX1BVU0hfVE9LRU5fU0xBU0ggOiBQVVNIX1RPS0VOX1NMQVNIO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHRva2VuLmVuZHNXaXRoKCAnLicgKSApIHtcclxuICAgICAgdG9rZW4gPSB0b2tlbi5zbGljZSggMCwgLTEgKTtcclxuICAgICAgY29kZSA9IGhhc1BvcCA/IFBPUF9QVVNIX1RPS0VOX0RPVCA6IFBVU0hfVE9LRU5fRE9UO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGNvZGUgPSBoYXNQb3AgPyBQT1BfUFVTSF9UT0tFTiA6IFBVU0hfVE9LRU47XHJcbiAgICB9XHJcblxyXG4gICAgb3V0cHV0ICs9IGNvZGUgKyBlbmNvZGUoIHRva2VuICk7XHJcbiAgfTtcclxuXHJcbiAgLy8gUG9wcyBhIHRva2VuIGZyb20gdGhlIHN0YWNrXHJcbiAgY29uc3QgcG9wID0gKCkgPT4ge1xyXG4gICAgc3RhY2sucG9wKCk7XHJcbiAgICBvdXRwdXQgKz0gUE9QO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IHN0YXJ0U3RyaW5nID0gKCkgPT4ge1xyXG4gICAgb3V0cHV0ICs9IFNUQVJUX1NUUklORztcclxuICB9O1xyXG5cclxuICBjb25zdCBlbmRTdHJpbmcgPSAoKSA9PiB7XHJcbiAgICBvdXRwdXQgKz0gRU5EX1NUUklORztcclxuICB9O1xyXG5cclxuICBjb25zdCBzd2l0Y2hMb2NhbGUgPSBsb2NhbGUgPT4ge1xyXG4gICAgY3VycmVudExvY2FsZSA9IGxvY2FsZTtcclxuXHJcbiAgICBvdXRwdXQgKz0gU1dJVENIX0xPQ0FMRSArIGVuY29kZSggbG9jYWxlICk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgYWRkU3RyaW5nQ29weUxhc3QgPSAoKSA9PiB7XHJcbiAgICBvdXRwdXQgKz0gQUREX1NUUklOR19DT1BZX0xBU1Q7XHJcbiAgfTtcclxuXHJcbiAgLy8gQWRkcyBhIHN0cmluZyB0byB0aGUgb3V0cHV0LCBlbmNvZGluZyBMVFIvUlRMIHdyYXBwZWQgZm9ybXMgaW4gYSBtb3JlIGNvbXBhY3Qgd2F5XHJcbiAgY29uc3QgYWRkU3RyaW5nID0gc3RyaW5nID0+IHtcclxuICAgIGN1cnJlbnRTdHJpbmdWYWx1ZSA9IHN0cmluZztcclxuXHJcbiAgICBsZXQgY29kZTtcclxuICAgIGlmICggc3RyaW5nLnN0YXJ0c1dpdGgoIENIQVJfTFRSICkgJiYgc3RyaW5nLmVuZHNXaXRoKCBDSEFSX1BPUCApICkge1xyXG4gICAgICBjb2RlID0gQUREX1NUUklOR19MVFJfUE9QO1xyXG4gICAgICBzdHJpbmcgPSBzdHJpbmcuc2xpY2UoIDEsIC0xICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggc3RyaW5nLnN0YXJ0c1dpdGgoIENIQVJfUlRMICkgJiYgc3RyaW5nLmVuZHNXaXRoKCBDSEFSX1BPUCApICkge1xyXG4gICAgICBjb2RlID0gQUREX1NUUklOR19SVExfUE9QO1xyXG4gICAgICBzdHJpbmcgPSBzdHJpbmcuc2xpY2UoIDEsIC0xICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgY29kZSA9IEFERF9TVFJJTkc7XHJcbiAgICB9XHJcblxyXG4gICAgb3V0cHV0ICs9IGNvZGUgKyBlbmNvZGUoIHN0cmluZyApO1xyXG4gIH07XHJcblxyXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gIC8vIFN0YXJ0IG9mIGVuY29kaW5nXHJcbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG4gIGxvY2FsZXMuZm9yRWFjaCggbG9jYWxlID0+IHtcclxuICAgIGFkZExvY2FsZSggbG9jYWxlICk7XHJcbiAgfSApO1xyXG5cclxuICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzdHJpbmdLZXlzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgY29uc3Qgc3RyaW5nS2V5ID0gc3RyaW5nS2V5c1sgaSBdO1xyXG5cclxuICAgIC8vIEVuY29kZSB0aGUgc3RyaW5nIGtleVxyXG4gICAge1xyXG4gICAgICB3aGlsZSAoICFzdHJpbmdLZXkuc3RhcnRzV2l0aCggc3RhY2suam9pbiggJycgKSApICkge1xyXG4gICAgICAgIHBvcCgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBXZSB3aWxsIHdoaXR0bGUgZG93biB0aGUgcmVtYWluZGVyIG9mIHRoZSBzdHJpbmcga2V5IGFzIHdlIGdvLiBXZSBzdGFydCBoZXJlIGZyb20gdGhlIGRlbHRhIGZyb20gdGhlIGxhc3Qga2V5XHJcbiAgICAgIGxldCByZW1haW5kZXIgPSBzdHJpbmdLZXkuc2xpY2UoIHN0YWNrLmpvaW4oICcnICkubGVuZ3RoICk7XHJcblxyXG4gICAgICAvLyBTZXBhcmF0ZSBvdXQgdGhlIHJlcXVpcmVqc05hbWVzcGFjZSwgaWYgaXQgZXhpc3RzXHJcbiAgICAgIGlmICggcmVtYWluZGVyLmluY2x1ZGVzKCAnLycgKSApIHtcclxuICAgICAgICBjb25zdCBiaXRzID0gcmVtYWluZGVyLnNwbGl0KCAnLycgKTtcclxuICAgICAgICBjb25zdCB0b2tlbiA9IGJpdHNbIDAgXSArICcvJztcclxuICAgICAgICBwdXNoKCB0b2tlbiApO1xyXG4gICAgICAgIHJlbWFpbmRlciA9IHJlbWFpbmRlci5zbGljZSggdG9rZW4ubGVuZ3RoICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFNlcGFyYXRlIG91dCBkb3Qtc2VwYXJhdGVkIHRva2VucyB0byBwdXNoIGluZGVwZW5kZW50bHkuXHJcbiAgICAgIHdoaWxlICggcmVtYWluZGVyLmluY2x1ZGVzKCAnLicgKSApIHtcclxuICAgICAgICBjb25zdCBiaXRzID0gcmVtYWluZGVyLnNwbGl0KCAnLicgKTtcclxuICAgICAgICBjb25zdCB0b2tlbiA9IGJpdHNbIDAgXSArICcuJztcclxuICAgICAgICBwdXNoKCB0b2tlbiApO1xyXG4gICAgICAgIHJlbWFpbmRlciA9IHJlbWFpbmRlci5zbGljZSggdG9rZW4ubGVuZ3RoICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFNlZSBpZiB3ZSBzaGFyZSBhIG5vbi10cml2aWFsIHByZWZpeCB3aXRoIHRoZSBuZXh0IHN0cmluZyBrZXksIGFuZCBpZiBzbywgcHVzaCBpdFxyXG4gICAgICBpZiAoIGkgKyAxIDwgc3RyaW5nS2V5cy5sZW5ndGggKSB7XHJcbiAgICAgICAgY29uc3QgbmV4dFN0cmluZ0tleSA9IHN0cmluZ0tleXNbIGkgKyAxIF07XHJcbiAgICAgICAgY29uc3QgbWF0Y2hJbmRleCA9IGdldE1hdGNoSW5kZXgoIHJlbWFpbmRlciwgbmV4dFN0cmluZ0tleS5zbGljZSggc3RhY2suam9pbiggJycgKS5sZW5ndGggKSApO1xyXG4gICAgICAgIGlmICggbWF0Y2hJbmRleCA+IDEgKSB7XHJcbiAgICAgICAgICBjb25zdCB0b2tlbiA9IHJlbWFpbmRlci5zbGljZSggMCwgbWF0Y2hJbmRleCApO1xyXG4gICAgICAgICAgcHVzaCggdG9rZW4gKTtcclxuICAgICAgICAgIHJlbWFpbmRlciA9IHJlbWFpbmRlci5zbGljZSggdG9rZW4ubGVuZ3RoICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBUaGUgcmVzdCFcclxuICAgICAgaWYgKCByZW1haW5kZXIubGVuZ3RoICkge1xyXG4gICAgICAgIHB1c2goIHJlbWFpbmRlciApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRW5jb2RlIHRoZSBzdHJpbmdcclxuICAgIHtcclxuICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gc3RyaW5nTWFwLmVuWyBzdHJpbmdLZXkgXTtcclxuXHJcbiAgICAgIC8vIEZpbmQgT05MWSB0aGUgbG9jYWxlcyB0aGF0IHdlJ2xsIGluY2x1ZGVcclxuICAgICAgY29uc3Qgc3RyaW5nTG9jYWxlcyA9IGxvY2FsZXMuZmlsdGVyKCBsb2NhbGUgPT4ge1xyXG4gICAgICAgIGlmICggbG9jYWxlID09PSAnZW4nICkge1xyXG4gICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzdHJpbmcgPSBzdHJpbmdNYXBbIGxvY2FsZSBdWyBzdHJpbmdLZXkgXTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHN0cmluZyAhPT0gdW5kZWZpbmVkICYmIHN0cmluZyAhPT0gZGVmYXVsdFZhbHVlO1xyXG4gICAgICB9ICk7XHJcbiAgICAgIGNvbnN0IHN0cmluZ1ZhbHVlcyA9IHN0cmluZ0xvY2FsZXMubWFwKCBsb2NhbGUgPT4gc3RyaW5nTWFwWyBsb2NhbGUgXVsgc3RyaW5nS2V5IF0gKTtcclxuXHJcbiAgICAgIC8vIFdlJ2xsIG9yZGVyIHRoaW5ncyBieSB0aGUgc3RyaW5nIHZhbHVlcywgc28gd2UgY2FuIFwiY29weVwiIHdoZW4gdGhleSBhcmUgdGhlIHNhbWVcclxuICAgICAgY29uc3QgaW5kaWNlcyA9IF8uc29ydEJ5KCBfLnJhbmdlKCAwLCBzdHJpbmdMb2NhbGVzLmxlbmd0aCApLCBpID0+IHN0cmluZ1ZhbHVlc1sgaSBdICk7XHJcblxyXG4gICAgICBzdGFydFN0cmluZygpO1xyXG5cclxuICAgICAgaW5kaWNlcy5mb3JFYWNoKCBpID0+IHtcclxuICAgICAgICBjb25zdCBsb2NhbGUgPSBzdHJpbmdMb2NhbGVzWyBpIF07XHJcbiAgICAgICAgY29uc3Qgc3RyaW5nID0gc3RyaW5nVmFsdWVzWyBpIF07XHJcblxyXG4gICAgICAgIGlmICggbG9jYWxlICE9PSBjdXJyZW50TG9jYWxlICkge1xyXG4gICAgICAgICAgc3dpdGNoTG9jYWxlKCBsb2NhbGUgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICggc3RyaW5nID09PSBjdXJyZW50U3RyaW5nVmFsdWUgKSB7XHJcbiAgICAgICAgICBhZGRTdHJpbmdDb3B5TGFzdCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGFkZFN0cmluZyggc3RyaW5nICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICBlbmRTdHJpbmcoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIERvdWJsZS1jaGVjayBvdXIgb3V0cHV0IHJlc3VsdHMgaW4gdGhlIGNvcnJlY3Qgc3RydWN0dXJlXHJcbiAgY29uc3QgdGVzdFN0cmluZ01hcCA9IGRlY29kZVN0cmluZ01hcCggb3V0cHV0ICk7XHJcbiAgZm9yICggY29uc3QgbG9jYWxlIGluIHN0cmluZ01hcCApIHtcclxuICAgIGZvciAoIGNvbnN0IHN0cmluZ0tleSBpbiBzdHJpbmdNYXBbIGxvY2FsZSBdICkge1xyXG4gICAgICBpZiAoIHN0cmluZ01hcFsgbG9jYWxlIF1bIHN0cmluZ0tleSBdICE9PSB0ZXN0U3RyaW5nTWFwWyBsb2NhbGUgXVsgc3RyaW5nS2V5IF0gKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBgU3RyaW5nIG1hcCBlbmNvZGluZyBmYWlsZWQsIG1pc21hdGNoIGF0ICR7bG9jYWxlfSAke3N0cmluZ0tleX1gICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBvdXRwdXQ7XHJcbn07XHJcblxyXG4vLyBDb252ZXJ0cyBhIGNvbXBhY3QgZW5jb2RpbmcgdG8gbWFwWyBsb2NhbGUgXVsgc3RyaW5nS2V5IF06IHN0cmluZ1xyXG5jb25zdCBkZWNvZGVTdHJpbmdNYXAgPSBlbmNvZGVkU3RyaW5nID0+IHtcclxuICBjb25zdCBzdHJpbmdNYXAgPSB7fTsgLy8gbWFwWyBsb2NhbGUgXVsgc3RyaW5nS2V5IF0gPT4gc3RyaW5nXHJcbiAgY29uc3QgbG9jYWxlcyA9IFtdO1xyXG4gIGNvbnN0IHN0YWNrID0gW107IC8vIHN0cmluZ1tdLCBzdGFjay5qb2luKCAnJyApIHdpbGwgYmUgdGhlIGN1cnJlbnQgc3RyaW5nS2V5XHJcbiAgbGV0IGN1cnJlbnRMb2NhbGUgPSBudWxsO1xyXG4gIGxldCBjdXJyZW50U3RyaW5nVmFsdWUgPSBudWxsOyAvLyB0aGUgbGFzdCBzdHJpbmcgdmFsdWUgd2UndmUgc2VlbiwgZm9yIEFERF9TVFJJTkdfQ09QWV9MQVNUXHJcbiAgbGV0IGVuU3RyaW5nVmFsdWUgPSBudWxsOyAvLyB0aGUgRW5nbGlzaCBzdHJpbmcgdmFsdWUsIGZvciBvbWl0dGVkIHRyYW5zbGF0aW9uc1xyXG4gIGNvbnN0IGxvY2FsZVNldCA9IG5ldyBTZXQoKTsgLy8gc28gd2UgY2FuIHRyYWNrIHRoZSBvbWl0dGVkIHRyYW5zbGF0aW9uc1xyXG4gIGxldCBzdHJpbmdLZXkgPSBudWxsO1xyXG5cclxuICBjb25zdCBhZGRMb2NhbGUgPSBsb2NhbGUgPT4ge1xyXG4gICAgc3RyaW5nTWFwWyBsb2NhbGUgXSA9IHt9O1xyXG4gICAgbG9jYWxlcy5wdXNoKCBsb2NhbGUgKTtcclxuICB9O1xyXG5cclxuICBjb25zdCBwdXNoID0gdG9rZW4gPT4ge1xyXG4gICAgc3RhY2sucHVzaCggdG9rZW4gKTtcclxuICB9O1xyXG5cclxuICBjb25zdCBwb3AgPSAoKSA9PiB7XHJcbiAgICBzdGFjay5wb3AoKTtcclxuICB9O1xyXG5cclxuICBjb25zdCBzd2l0Y2hMb2NhbGUgPSBsb2NhbGUgPT4ge1xyXG4gICAgY3VycmVudExvY2FsZSA9IGxvY2FsZTtcclxuICB9O1xyXG5cclxuICBjb25zdCBhZGRTdHJpbmcgPSBzdHJpbmcgPT4ge1xyXG4gICAgY3VycmVudFN0cmluZ1ZhbHVlID0gc3RyaW5nO1xyXG4gICAgc3RyaW5nTWFwWyBjdXJyZW50TG9jYWxlIF1bIHN0cmluZ0tleSBdID0gc3RyaW5nO1xyXG4gICAgaWYgKCBjdXJyZW50TG9jYWxlID09PSAnZW4nICkge1xyXG4gICAgICBlblN0cmluZ1ZhbHVlID0gc3RyaW5nO1xyXG4gICAgfVxyXG4gICAgbG9jYWxlU2V0LmFkZCggY3VycmVudExvY2FsZSApO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IGFkZFN0cmluZ0NvcHkgPSAoKSA9PiB7XHJcbiAgICBhZGRTdHJpbmcoIGN1cnJlbnRTdHJpbmdWYWx1ZSApO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IHN0YXJ0U3RyaW5nID0gKCkgPT4ge1xyXG4gICAgbG9jYWxlU2V0LmNsZWFyKCk7XHJcbiAgICBlblN0cmluZ1ZhbHVlID0gbnVsbDtcclxuICAgIHN0cmluZ0tleSA9IHN0YWNrLmpvaW4oICcnICk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgZW5kU3RyaW5nID0gKCkgPT4ge1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbG9jYWxlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgbG9jYWxlID0gbG9jYWxlc1sgaSBdO1xyXG4gICAgICBpZiAoICFsb2NhbGVTZXQuaGFzKCBsb2NhbGUgKSApIHtcclxuICAgICAgICBzdHJpbmdNYXBbIGxvY2FsZSBdWyBzdHJpbmdLZXkgXSA9IGVuU3RyaW5nVmFsdWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG5cclxuICBsZXQgaW5kZXggPSAwO1xyXG4gIGNvbnN0IGJpdHMgPSBlbmNvZGVkU3RyaW5nLnNwbGl0KCAvKD86KS91ICk7IC8vIHNwbGl0IGJ5IGNvZGUgcG9pbnQsIHNvIHdlIGRvbid0IGhhdmUgdG8gd29ycnkgYWJvdXQgc3Vycm9nYXRlIHBhaXJzXHJcblxyXG4gIC8vIFJlYWRzIGEgc3RyaW5nIGZyb20gdGhlIGJpdHMgKGF0IG91ciBjdXJyZW50IGluZGV4KSwgdW50aWwgd2UgaGl0IGEgbm9uLWVzY2FwZWQgY29udHJvbCBjaGFyYWN0ZXJcclxuICBjb25zdCByZWFkU3RyaW5nID0gKCkgPT4ge1xyXG4gICAgbGV0IHJlc3VsdCA9ICcnO1xyXG5cclxuICAgIHdoaWxlICggaW5kZXggPCBiaXRzLmxlbmd0aCApIHtcclxuICAgICAgY29uc3QgY2hhciA9IGJpdHNbIGluZGV4IF07XHJcbiAgICAgIGNvbnN0IGNvZGVQb2ludCA9IGNoYXIuY29kZVBvaW50QXQoIDAgKTtcclxuXHJcbiAgICAgIC8vIFBhc3MgdGhyb3VnaCBhbnkgbm9uLWNvbnRyb2wgY2hhcmFjdGVyc1xyXG4gICAgICBpZiAoIGNvZGVQb2ludCA+IE1BWF9DT05UUk9MX0NIQVJBQ1RFUl9DT0RFX1BPSU5UICkge1xyXG4gICAgICAgIHJlc3VsdCArPSBjaGFyO1xyXG4gICAgICAgIGluZGV4Kys7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIGNvZGVQb2ludCA9PT0gRVNDQVBFX0NIQVJBQ1RFUl9DT0RFX1BPSU5UICkge1xyXG4gICAgICAgIGNvbnN0IG5leHRDaGFyID0gYml0c1sgaW5kZXggKyAxIF07XHJcbiAgICAgICAgcmVzdWx0ICs9IG5leHRDaGFyO1xyXG4gICAgICAgIGluZGV4ICs9IDI7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH07XHJcblxyXG4gIHdoaWxlICggaW5kZXggPCBiaXRzLmxlbmd0aCApIHtcclxuICAgIGNvbnN0IGNvZGUgPSBiaXRzWyBpbmRleCsrIF07XHJcblxyXG4gICAgaWYgKCBjb2RlID09PSBQVVNIX1RPS0VOICkge1xyXG4gICAgICBwdXNoKCByZWFkU3RyaW5nKCkgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBjb2RlID09PSBQVVNIX1RPS0VOX1NMQVNIICkge1xyXG4gICAgICBwdXNoKCByZWFkU3RyaW5nKCkgKyAnLycgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBjb2RlID09PSBQVVNIX1RPS0VOX0RPVCApIHtcclxuICAgICAgcHVzaCggcmVhZFN0cmluZygpICsgJy4nICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggY29kZSA9PT0gUE9QICkge1xyXG4gICAgICBwb3AoKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBjb2RlID09PSBQT1BfUFVTSF9UT0tFTiApIHtcclxuICAgICAgcG9wKCk7XHJcbiAgICAgIHB1c2goIHJlYWRTdHJpbmcoKSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGNvZGUgPT09IFBPUF9QVVNIX1RPS0VOX1NMQVNIICkge1xyXG4gICAgICBwb3AoKTtcclxuICAgICAgcHVzaCggcmVhZFN0cmluZygpICsgJy8nICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggY29kZSA9PT0gUE9QX1BVU0hfVE9LRU5fRE9UICkge1xyXG4gICAgICBwb3AoKTtcclxuICAgICAgcHVzaCggcmVhZFN0cmluZygpICsgJy4nICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggY29kZSA9PT0gU1dJVENIX0xPQ0FMRSApIHtcclxuICAgICAgc3dpdGNoTG9jYWxlKCByZWFkU3RyaW5nKCkgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBjb2RlID09PSBTVEFSVF9TVFJJTkcgKSB7XHJcbiAgICAgIHN0YXJ0U3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggY29kZSA9PT0gRU5EX1NUUklORyApIHtcclxuICAgICAgZW5kU3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggY29kZSA9PT0gQUREX1NUUklORyApIHtcclxuICAgICAgYWRkU3RyaW5nKCByZWFkU3RyaW5nKCkgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBjb2RlID09PSBBRERfU1RSSU5HX0xUUl9QT1AgKSB7XHJcbiAgICAgIGFkZFN0cmluZyggQ0hBUl9MVFIgKyByZWFkU3RyaW5nKCkgKyBDSEFSX1BPUCApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGNvZGUgPT09IEFERF9TVFJJTkdfUlRMX1BPUCApIHtcclxuICAgICAgYWRkU3RyaW5nKCBDSEFSX1JUTCArIHJlYWRTdHJpbmcoKSArIENIQVJfUE9QICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggY29kZSA9PT0gQUREX1NUUklOR19DT1BZX0xBU1QgKSB7XHJcbiAgICAgIGFkZFN0cmluZ0NvcHkoKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBjb2RlID09PSBBRERfTE9DQUxFICkge1xyXG4gICAgICBhZGRMb2NhbGUoIHJlYWRTdHJpbmcoKSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggJ1VucmVjb2duaXplZCBjb2RlOiAnICsgY29kZSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHN0cmluZ01hcDtcclxufTtcclxuXHJcbi8vIEEgbWluaWZpZWQgdmVyc2lvbiBvZiB0aGUgYWJvdmUsIGZvciBpbmNsdXNpb24gaW4gdGhlIEpTIGJ1bmRsZS4gQXBwcm94aW1hdGVseSAxIGtCLlxyXG4vLyBhID0gYWRkU3RyaW5nXHJcbi8vIHIgPSByZWFkU3RyaW5nXHJcbi8vIGYgPSBTdHJpbmcuZnJvbUNoYXJDb2RlXHJcbi8vIG0gPSBzdHJpbmdNYXBcclxuLy8geCA9IGxvY2FsZXNcclxuLy8gbCA9IGxvY2FsZVxyXG4vLyBzID0gc3RhY2tcclxuLy8gWCA9IGN1cnJlbnRMb2NhbGVcclxuLy8gUyA9IGN1cnJlbnRTdHJpbmdWYWx1ZVxyXG4vLyBlID0gZW5TdHJpbmdWYWx1ZVxyXG4vLyBrID0gc3RyaW5nS2V5XHJcbi8vIHQgPSBsb2NhbGVTZXRcclxuLy8gYiA9IGJpdHNcclxuLy8gaiA9IGluZGV4XHJcbi8vIGMgPSBjb2RlXHJcbi8vIGQgPSBjaGFyXHJcbi8vIHAgPSBjb2RlUG9pbnRcclxuLy8gcSA9IHN0cmluZy9yZXN1bHRcclxuLy8geSA9IGVuY29kZWRTdHJpbmdcclxuLyogZXNsaW50LWRpc2FibGUgKi9cclxuY29uc3Qgc21hbGxEZWNvZGVTdHJpbmdNYXBTdHJpbmcgPSBcInk9PntsZXQgbT17fTtsZXQgeD1bXTtsZXQgcz1bXTtsZXQgWD1udWxsO2xldCBTPW51bGw7bGV0IGU9bnVsbDtsZXQgdD1uZXcgU2V0KCk7bGV0IGs9bnVsbDtsZXQgZj1TdHJpbmcuZnJvbUNoYXJDb2RlO2xldCBBPWYoMSk7bGV0IEI9ZigyKTtsZXQgQz1mKDMpO2xldCBEPWYoNCk7bGV0IEU9Zig1KTtsZXQgRj1mKDYpO2xldCBHPWYoNyk7bGV0IEg9Zig4KTtsZXQgST1mKDkpO2xldCBKPWYoMHhBKTtsZXQgSz1mKDB4Qik7bGV0IEw9ZigweEMpO2xldCBNPWYoMHhEKTtsZXQgTj1mKDB4RSk7bGV0IE89ZigweEYpO2xldCBhPXE9PntTPXE7bVtYXVtrXT1xO2lmKFg9PSdlbicpe2U9cTt9dC5hZGQoWCk7fTtsZXQgaj0wO2xldCBiPXkuc3BsaXQoLyg/OikvdSk7bGV0IHI9KCk9PntsZXQgcT0nJzt3aGlsZShqPGIubGVuZ3RoKXtsZXQgZD1iW2pdO2xldCBwPWQuY29kZVBvaW50QXQoMCk7aWYocD4weDEwKXtxKz1kO2orKzt9ZWxzZSBpZihwPT0weDEwKXtxKz1iW2orMV07ais9Mjt9ZWxzZXticmVhazt9fXJldHVybiBxO307d2hpbGUoajxiLmxlbmd0aCl7bGV0IGM9YltqKytdO2lmKGM9PUEpe3MucHVzaChyKCkpO31lbHNlIGlmKGM9PUIpe3MucHVzaChyKCkrJy8nKTt9ZWxzZSBpZihjPT1DKXtzLnB1c2gocigpKycuJyk7fWVsc2UgaWYoYz09RCl7cy5wb3AoKTt9ZWxzZSBpZihjPT1FKXtzLnBvcCgpO3MucHVzaChyKCkpO31lbHNlIGlmKGM9PUYpe3MucG9wKCk7cy5wdXNoKHIoKSsnLycpO31lbHNlIGlmKGM9PUcpe3MucG9wKCk7cy5wdXNoKHIoKSsnLicpO31lbHNlIGlmKGM9PUgpe1g9cigpO31lbHNlIGlmKGM9PUkpe3QuY2xlYXIoKTtlPW51bGw7az1zLmpvaW4oJycpO31lbHNlIGlmKGM9PUope2ZvcihsZXQgaT0wO2k8eC5sZW5ndGg7aSsrKXtsZXQgbD14W2ldO2lmKCF0LmhhcyhsKSl7bVtsXVtrXT1lO319fWVsc2UgaWYoYz09Syl7YShyKCkpO31lbHNlIGlmKGM9PUwpe2EoYFxcdTIwMmEke3IoKX1cXHUyMDJjYCk7fWVsc2UgaWYoYz09TSl7YShgXFx1MjAyYiR7cigpfVxcdTIwMmNgKTt9ZWxzZSBpZihjPT1OKXthKFMpO31lbHNlIGlmKGM9PU8pe2xldCBsPXIoKTttW2xdPXt9O3gucHVzaChsKTt9fXJldHVybiBtO31cIjtcclxuLyogZXNsaW50LWVuYWJsZSAqL1xyXG5cclxuLy8gR2l2ZW4gYSBzdHJpbmdNYXAgKG1hcFsgbG9jYWxlIF1bIHN0cmluZ0tleSBdID0+IHN0cmluZyksIHJldHVybnMgYSBKUyBleHByZXNzaW9uIHN0cmluZyB0aGF0IHdpbGwgZGVjb2RlIHRvIGl0LlxyXG5jb25zdCBlbmNvZGVTdHJpbmdNYXBUb0pTID0gc3RyaW5nTWFwID0+IGAoJHtzbWFsbERlY29kZVN0cmluZ01hcFN0cmluZ30pKCR7dG9MZXNzRXNjYXBlZFN0cmluZyggZW5jb2RlU3RyaW5nTWFwKCBzdHJpbmdNYXAgKSApfSlgO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgZW5jb2RlU3RyaW5nTWFwOiBlbmNvZGVTdHJpbmdNYXAsXHJcbiAgZGVjb2RlU3RyaW5nTWFwOiBkZWNvZGVTdHJpbmdNYXAsXHJcbiAgZW5jb2RlU3RyaW5nTWFwVG9KUzogZW5jb2RlU3RyaW5nTWFwVG9KU1xyXG59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