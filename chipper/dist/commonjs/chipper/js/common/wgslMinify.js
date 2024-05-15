"use strict";

// Copyright 2023-2024, University of Colorado Boulder

/* eslint-env node */

/**
 * Minifies a WGSL string
 *
 * IDEA: could look at places where abstract int/float could be swapped in for the explicit types
 * IDEA: could wrap long builtin function calls with a shorter named function (but that might reduce performance?)
 * IDEA: looking at you, bitcast!!!
 * IDEA: vec2(0.0, 0.0) => vec2(0.0) (and similar) -- doesn't happen often enough to bother
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var REPLACEMENT_MAP = {
  'vec2<i32>': 'vec2i',
  'vec3<i32>': 'vec3i',
  'vec4<i32>': 'vec4i',
  'vec2<u32>': 'vec2u',
  'vec3<u32>': 'vec3u',
  'vec4<u32>': 'vec4u',
  'vec2<f32>': 'vec2f',
  'vec3<f32>': 'vec3f',
  'vec4<f32>': 'vec4f',
  'vec2<f16>': 'vec2h',
  'vec3<f16>': 'vec3h',
  'vec4<f16>': 'vec4h',
  'mat2x2<f32>': 'mat2x2f',
  'mat2x3<f32>': 'mat2x3f',
  'mat2x4<f32>': 'mat2x4f',
  'mat3x2<f32>': 'mat3x2f',
  'mat3x3<f32>': 'mat3x3f',
  'mat3x4<f32>': 'mat3x4f',
  'mat4x2<f32>': 'mat4x2f',
  'mat4x3<f32>': 'mat4x3f',
  'mat4x4<f32>': 'mat4x4f',
  'mat2x2<f16>': 'mat2x2h',
  'mat2x3<f16>': 'mat2x3h',
  'mat2x4<f16>': 'mat2x4h',
  'mat3x2<f16>': 'mat3x2h',
  'mat3x3<f16>': 'mat3x3h',
  'mat3x4<f16>': 'mat3x4h',
  'mat4x2<f16>': 'mat4x2h',
  'mat4x3<f16>': 'mat4x3h',
  'mat4x4<f16>': 'mat4x4h'
};
var wgslMinify = function wgslMinify(str) {
  str = str.replace(/\r\n/g, '\n');

  // // Naga does not yet recognize `const` but web does not allow global `let`.
  str = str.replace(/\nlet /g, '\nconst ');

  // According to WGSL spec:
  // line breaks: \u000A\u000B\u000C\u000D\u0085\u2028\u2029
  // white space: \u0020\u0009\u000A\u000B\u000C\u000D\u0085\u200E\u200F\u2028\u2029

  var linebreak = "[\n\x0B\f\r\x85\u2028\u2029]";
  var whitespace = "[ \t\x85\u200E\u200F\u2028\u2029]"; // don't include most the linebreak ones
  var linebreakOrWhitespace = "[\n\x0B\f\r\x85\u2028\u2029 \t\x85\u200E\u200F]";

  // Collapse newlines
  str = str.replace(new RegExp("".concat(whitespace, "*").concat(linebreak, "+").concat(whitespace, "*"), 'g'), '\n');
  str = str.trim();

  // Collapse other whitespace
  str = str.replace(new RegExp("".concat(whitespace, "+"), 'g'), ' ');

  // Semicolon + newline => semicolon
  str = str.replace(new RegExp(";".concat(linebreak), 'g'), ';');

  // Comma + newline => comma
  str = str.replace(new RegExp(",".concat(linebreak), 'g'), ',');

  // whitespace around {}
  str = str.replace(new RegExp("".concat(linebreakOrWhitespace, "*([\\{\\}])").concat(linebreakOrWhitespace, "*"), 'g'), function (_, m) {
    return m;
  });

  // Remove whitespace after :;,
  str = str.replace(new RegExp("([:;,])".concat(linebreakOrWhitespace, "+"), 'g'), function (_, m) {
    return m;
  });

  // Remove trailing commas before }])
  str = str.replace(new RegExp(',([\\}\\]\\)])', 'g'), function (_, m) {
    return m;
  });

  // It's safe to remove whitespace before '-', however Firefox's tokenizer doesn't like 'x-1u' (presumably identifier + literal number, no operator)
  // So we'll only replace whitespace after '-' if it's not followed by a digit
  str = str.replace(new RegExp("".concat(linebreakOrWhitespace, "*-"), 'g'), '-');
  str = str.replace(new RegExp("-".concat(linebreakOrWhitespace, "+([^0-9])"), 'g'), function (_, m) {
    return "-".concat(m);
  });

  // Operators don't need whitespace around them in general
  str = str.replace(new RegExp("".concat(linebreakOrWhitespace, "*([\\+\\*/<>&\\|=\\(\\)!])").concat(linebreakOrWhitespace, "*"), 'g'), function (_, m) {
    return m;
  });

  // e.g. 0.5 => .5, 10.0 => 10.
  str = str.replace(/\d+\.\d+/g, function (m) {
    if (m.endsWith('.0')) {
      m = m.substring(0, m.length - 1);
    }
    if (m.startsWith('0.') && m.length > 2) {
      m = m.substring(1);
    }
    return m;
  });

  // Replace hex literals with decimal literals if they are shorter
  str = str.replace(/0x([0-9abcdefABCDEF]+)u/g, function (m, digits) {
    var str = '' + parseInt(digits, 16) + 'u';
    if (str.length < m.length) {
      return str;
    } else {
      return m;
    }
  });

  // Detect cases where abstract int can be used safely, instead of the explicit ones
  // str = str.replace( /(==|!=)([0-9.])+[uif]/g, ( m, op, digits ) => {
  //   return `${op}${digits}`;
  // } );

  // Replace some predeclared aliases (vec2<f32> => vec2f)
  Object.keys(REPLACEMENT_MAP).forEach(function (key) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      var match = new RegExp("[^\\w](".concat(key, ")[^\\w]"), 'g').exec(str);
      if (match) {
        var index0 = match.index + 1;
        var index1 = index0 + key.length;
        var before = str.substring(0, index0);
        var after = str.substring(index1);
        str = before + REPLACEMENT_MAP[key] + after;
      } else {
        break;
      }
    }
  });
  return str;
};
module.exports = wgslMinify;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSRVBMQUNFTUVOVF9NQVAiLCJ3Z3NsTWluaWZ5Iiwic3RyIiwicmVwbGFjZSIsImxpbmVicmVhayIsIndoaXRlc3BhY2UiLCJsaW5lYnJlYWtPcldoaXRlc3BhY2UiLCJSZWdFeHAiLCJjb25jYXQiLCJ0cmltIiwiXyIsIm0iLCJlbmRzV2l0aCIsInN1YnN0cmluZyIsImxlbmd0aCIsInN0YXJ0c1dpdGgiLCJkaWdpdHMiLCJwYXJzZUludCIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwia2V5IiwibWF0Y2giLCJleGVjIiwiaW5kZXgwIiwiaW5kZXgiLCJpbmRleDEiLCJiZWZvcmUiLCJhZnRlciIsIm1vZHVsZSIsImV4cG9ydHMiXSwic291cmNlcyI6WyJ3Z3NsTWluaWZ5LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyogZXNsaW50LWVudiBub2RlICovXHJcblxyXG4vKipcclxuICogTWluaWZpZXMgYSBXR1NMIHN0cmluZ1xyXG4gKlxyXG4gKiBJREVBOiBjb3VsZCBsb29rIGF0IHBsYWNlcyB3aGVyZSBhYnN0cmFjdCBpbnQvZmxvYXQgY291bGQgYmUgc3dhcHBlZCBpbiBmb3IgdGhlIGV4cGxpY2l0IHR5cGVzXHJcbiAqIElERUE6IGNvdWxkIHdyYXAgbG9uZyBidWlsdGluIGZ1bmN0aW9uIGNhbGxzIHdpdGggYSBzaG9ydGVyIG5hbWVkIGZ1bmN0aW9uIChidXQgdGhhdCBtaWdodCByZWR1Y2UgcGVyZm9ybWFuY2U/KVxyXG4gKiBJREVBOiBsb29raW5nIGF0IHlvdSwgYml0Y2FzdCEhIVxyXG4gKiBJREVBOiB2ZWMyKDAuMCwgMC4wKSA9PiB2ZWMyKDAuMCkgKGFuZCBzaW1pbGFyKSAtLSBkb2Vzbid0IGhhcHBlbiBvZnRlbiBlbm91Z2ggdG8gYm90aGVyXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBSRVBMQUNFTUVOVF9NQVAgPSB7XHJcbiAgJ3ZlYzI8aTMyPic6ICd2ZWMyaScsXHJcbiAgJ3ZlYzM8aTMyPic6ICd2ZWMzaScsXHJcbiAgJ3ZlYzQ8aTMyPic6ICd2ZWM0aScsXHJcbiAgJ3ZlYzI8dTMyPic6ICd2ZWMydScsXHJcbiAgJ3ZlYzM8dTMyPic6ICd2ZWMzdScsXHJcbiAgJ3ZlYzQ8dTMyPic6ICd2ZWM0dScsXHJcbiAgJ3ZlYzI8ZjMyPic6ICd2ZWMyZicsXHJcbiAgJ3ZlYzM8ZjMyPic6ICd2ZWMzZicsXHJcbiAgJ3ZlYzQ8ZjMyPic6ICd2ZWM0ZicsXHJcbiAgJ3ZlYzI8ZjE2Pic6ICd2ZWMyaCcsXHJcbiAgJ3ZlYzM8ZjE2Pic6ICd2ZWMzaCcsXHJcbiAgJ3ZlYzQ8ZjE2Pic6ICd2ZWM0aCcsXHJcbiAgJ21hdDJ4MjxmMzI+JzogJ21hdDJ4MmYnLFxyXG4gICdtYXQyeDM8ZjMyPic6ICdtYXQyeDNmJyxcclxuICAnbWF0Mng0PGYzMj4nOiAnbWF0Mng0ZicsXHJcbiAgJ21hdDN4MjxmMzI+JzogJ21hdDN4MmYnLFxyXG4gICdtYXQzeDM8ZjMyPic6ICdtYXQzeDNmJyxcclxuICAnbWF0M3g0PGYzMj4nOiAnbWF0M3g0ZicsXHJcbiAgJ21hdDR4MjxmMzI+JzogJ21hdDR4MmYnLFxyXG4gICdtYXQ0eDM8ZjMyPic6ICdtYXQ0eDNmJyxcclxuICAnbWF0NHg0PGYzMj4nOiAnbWF0NHg0ZicsXHJcbiAgJ21hdDJ4MjxmMTY+JzogJ21hdDJ4MmgnLFxyXG4gICdtYXQyeDM8ZjE2Pic6ICdtYXQyeDNoJyxcclxuICAnbWF0Mng0PGYxNj4nOiAnbWF0Mng0aCcsXHJcbiAgJ21hdDN4MjxmMTY+JzogJ21hdDN4MmgnLFxyXG4gICdtYXQzeDM8ZjE2Pic6ICdtYXQzeDNoJyxcclxuICAnbWF0M3g0PGYxNj4nOiAnbWF0M3g0aCcsXHJcbiAgJ21hdDR4MjxmMTY+JzogJ21hdDR4MmgnLFxyXG4gICdtYXQ0eDM8ZjE2Pic6ICdtYXQ0eDNoJyxcclxuICAnbWF0NHg0PGYxNj4nOiAnbWF0NHg0aCdcclxufTtcclxuXHJcbmNvbnN0IHdnc2xNaW5pZnkgPSBzdHIgPT4ge1xyXG4gIHN0ciA9IHN0ci5yZXBsYWNlKCAvXFxyXFxuL2csICdcXG4nICk7XHJcblxyXG4gIC8vIC8vIE5hZ2EgZG9lcyBub3QgeWV0IHJlY29nbml6ZSBgY29uc3RgIGJ1dCB3ZWIgZG9lcyBub3QgYWxsb3cgZ2xvYmFsIGBsZXRgLlxyXG4gIHN0ciA9IHN0ci5yZXBsYWNlKCAvXFxubGV0IC9nLCAnXFxuY29uc3QgJyApO1xyXG5cclxuICAvLyBBY2NvcmRpbmcgdG8gV0dTTCBzcGVjOlxyXG4gIC8vIGxpbmUgYnJlYWtzOiBcXHUwMDBBXFx1MDAwQlxcdTAwMENcXHUwMDBEXFx1MDA4NVxcdTIwMjhcXHUyMDI5XHJcbiAgLy8gd2hpdGUgc3BhY2U6IFxcdTAwMjBcXHUwMDA5XFx1MDAwQVxcdTAwMEJcXHUwMDBDXFx1MDAwRFxcdTAwODVcXHUyMDBFXFx1MjAwRlxcdTIwMjhcXHUyMDI5XHJcblxyXG4gIGNvbnN0IGxpbmVicmVhayA9ICdbXFx1MDAwQVxcdTAwMEJcXHUwMDBDXFx1MDAwRFxcdTAwODVcXHUyMDI4XFx1MjAyOV0nO1xyXG4gIGNvbnN0IHdoaXRlc3BhY2UgPSAnW1xcdTAwMjBcXHUwMDA5XFx1MDA4NVxcdTIwMEVcXHUyMDBGXFx1MjAyOFxcdTIwMjldJzsgLy8gZG9uJ3QgaW5jbHVkZSBtb3N0IHRoZSBsaW5lYnJlYWsgb25lc1xyXG4gIGNvbnN0IGxpbmVicmVha09yV2hpdGVzcGFjZSA9ICdbXFx1MDAwQVxcdTAwMEJcXHUwMDBDXFx1MDAwRFxcdTAwODVcXHUyMDI4XFx1MjAyOVxcdTAwMjBcXHUwMDA5XFx1MDA4NVxcdTIwMEVcXHUyMDBGXSc7XHJcblxyXG4gIC8vIENvbGxhcHNlIG5ld2xpbmVzXHJcbiAgc3RyID0gc3RyLnJlcGxhY2UoIG5ldyBSZWdFeHAoIGAke3doaXRlc3BhY2V9KiR7bGluZWJyZWFrfSske3doaXRlc3BhY2V9KmAsICdnJyApLCAnXFxuJyApO1xyXG4gIHN0ciA9IHN0ci50cmltKCk7XHJcblxyXG4gIC8vIENvbGxhcHNlIG90aGVyIHdoaXRlc3BhY2VcclxuICBzdHIgPSBzdHIucmVwbGFjZSggbmV3IFJlZ0V4cCggYCR7d2hpdGVzcGFjZX0rYCwgJ2cnICksICcgJyApO1xyXG5cclxuICAvLyBTZW1pY29sb24gKyBuZXdsaW5lID0+IHNlbWljb2xvblxyXG4gIHN0ciA9IHN0ci5yZXBsYWNlKCBuZXcgUmVnRXhwKCBgOyR7bGluZWJyZWFrfWAsICdnJyApLCAnOycgKTtcclxuXHJcbiAgLy8gQ29tbWEgKyBuZXdsaW5lID0+IGNvbW1hXHJcbiAgc3RyID0gc3RyLnJlcGxhY2UoIG5ldyBSZWdFeHAoIGAsJHtsaW5lYnJlYWt9YCwgJ2cnICksICcsJyApO1xyXG5cclxuICAvLyB3aGl0ZXNwYWNlIGFyb3VuZCB7fVxyXG4gIHN0ciA9IHN0ci5yZXBsYWNlKCBuZXcgUmVnRXhwKCBgJHtsaW5lYnJlYWtPcldoaXRlc3BhY2V9KihbXFxcXHtcXFxcfV0pJHtsaW5lYnJlYWtPcldoaXRlc3BhY2V9KmAsICdnJyApLCAoIF8sIG0gKSA9PiBtICk7XHJcblxyXG4gIC8vIFJlbW92ZSB3aGl0ZXNwYWNlIGFmdGVyIDo7LFxyXG4gIHN0ciA9IHN0ci5yZXBsYWNlKCBuZXcgUmVnRXhwKCBgKFs6OyxdKSR7bGluZWJyZWFrT3JXaGl0ZXNwYWNlfStgLCAnZycgKSwgKCBfLCBtICkgPT4gbSApO1xyXG5cclxuICAvLyBSZW1vdmUgdHJhaWxpbmcgY29tbWFzIGJlZm9yZSB9XSlcclxuICBzdHIgPSBzdHIucmVwbGFjZSggbmV3IFJlZ0V4cCggJywoW1xcXFx9XFxcXF1cXFxcKV0pJywgJ2cnICksICggXywgbSApID0+IG0gKTtcclxuXHJcbiAgLy8gSXQncyBzYWZlIHRvIHJlbW92ZSB3aGl0ZXNwYWNlIGJlZm9yZSAnLScsIGhvd2V2ZXIgRmlyZWZveCdzIHRva2VuaXplciBkb2Vzbid0IGxpa2UgJ3gtMXUnIChwcmVzdW1hYmx5IGlkZW50aWZpZXIgKyBsaXRlcmFsIG51bWJlciwgbm8gb3BlcmF0b3IpXHJcbiAgLy8gU28gd2UnbGwgb25seSByZXBsYWNlIHdoaXRlc3BhY2UgYWZ0ZXIgJy0nIGlmIGl0J3Mgbm90IGZvbGxvd2VkIGJ5IGEgZGlnaXRcclxuICBzdHIgPSBzdHIucmVwbGFjZSggbmV3IFJlZ0V4cCggYCR7bGluZWJyZWFrT3JXaGl0ZXNwYWNlfSotYCwgJ2cnICksICctJyApO1xyXG4gIHN0ciA9IHN0ci5yZXBsYWNlKCBuZXcgUmVnRXhwKCBgLSR7bGluZWJyZWFrT3JXaGl0ZXNwYWNlfSsoW14wLTldKWAsICdnJyApLCAoIF8sIG0gKSA9PiBgLSR7bX1gICk7XHJcblxyXG4gIC8vIE9wZXJhdG9ycyBkb24ndCBuZWVkIHdoaXRlc3BhY2UgYXJvdW5kIHRoZW0gaW4gZ2VuZXJhbFxyXG4gIHN0ciA9IHN0ci5yZXBsYWNlKCBuZXcgUmVnRXhwKCBgJHtsaW5lYnJlYWtPcldoaXRlc3BhY2V9KihbXFxcXCtcXFxcKi88PiZcXFxcfD1cXFxcKFxcXFwpIV0pJHtsaW5lYnJlYWtPcldoaXRlc3BhY2V9KmAsICdnJyApLCAoIF8sIG0gKSA9PiBtICk7XHJcblxyXG4gIC8vIGUuZy4gMC41ID0+IC41LCAxMC4wID0+IDEwLlxyXG4gIHN0ciA9IHN0ci5yZXBsYWNlKCAvXFxkK1xcLlxcZCsvZywgbSA9PiB7XHJcbiAgICBpZiAoIG0uZW5kc1dpdGgoICcuMCcgKSApIHtcclxuICAgICAgbSA9IG0uc3Vic3RyaW5nKCAwLCBtLmxlbmd0aCAtIDEgKTtcclxuICAgIH1cclxuICAgIGlmICggbS5zdGFydHNXaXRoKCAnMC4nICkgJiYgbS5sZW5ndGggPiAyICkge1xyXG4gICAgICBtID0gbS5zdWJzdHJpbmcoIDEgKTtcclxuICAgIH1cclxuICAgIHJldHVybiBtO1xyXG4gIH0gKTtcclxuXHJcbiAgLy8gUmVwbGFjZSBoZXggbGl0ZXJhbHMgd2l0aCBkZWNpbWFsIGxpdGVyYWxzIGlmIHRoZXkgYXJlIHNob3J0ZXJcclxuICBzdHIgPSBzdHIucmVwbGFjZSggLzB4KFswLTlhYmNkZWZBQkNERUZdKyl1L2csICggbSwgZGlnaXRzICkgPT4ge1xyXG4gICAgY29uc3Qgc3RyID0gJycgKyBwYXJzZUludCggZGlnaXRzLCAxNiApICsgJ3UnO1xyXG4gICAgaWYgKCBzdHIubGVuZ3RoIDwgbS5sZW5ndGggKSB7XHJcbiAgICAgIHJldHVybiBzdHI7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIG07XHJcbiAgICB9XHJcbiAgfSApO1xyXG5cclxuICAvLyBEZXRlY3QgY2FzZXMgd2hlcmUgYWJzdHJhY3QgaW50IGNhbiBiZSB1c2VkIHNhZmVseSwgaW5zdGVhZCBvZiB0aGUgZXhwbGljaXQgb25lc1xyXG4gIC8vIHN0ciA9IHN0ci5yZXBsYWNlKCAvKD09fCE9KShbMC05Ll0pK1t1aWZdL2csICggbSwgb3AsIGRpZ2l0cyApID0+IHtcclxuICAvLyAgIHJldHVybiBgJHtvcH0ke2RpZ2l0c31gO1xyXG4gIC8vIH0gKTtcclxuXHJcbiAgLy8gUmVwbGFjZSBzb21lIHByZWRlY2xhcmVkIGFsaWFzZXMgKHZlYzI8ZjMyPiA9PiB2ZWMyZilcclxuICBPYmplY3Qua2V5cyggUkVQTEFDRU1FTlRfTUFQICkuZm9yRWFjaCgga2V5ID0+IHtcclxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zdGFudC1jb25kaXRpb25cclxuICAgIHdoaWxlICggdHJ1ZSApIHtcclxuICAgICAgY29uc3QgbWF0Y2ggPSBuZXcgUmVnRXhwKCBgW15cXFxcd10oJHtrZXl9KVteXFxcXHddYCwgJ2cnICkuZXhlYyggc3RyICk7XHJcblxyXG4gICAgICBpZiAoIG1hdGNoICkge1xyXG4gICAgICAgIGNvbnN0IGluZGV4MCA9IG1hdGNoLmluZGV4ICsgMTtcclxuICAgICAgICBjb25zdCBpbmRleDEgPSBpbmRleDAgKyBrZXkubGVuZ3RoO1xyXG4gICAgICAgIGNvbnN0IGJlZm9yZSA9IHN0ci5zdWJzdHJpbmcoIDAsIGluZGV4MCApO1xyXG4gICAgICAgIGNvbnN0IGFmdGVyID0gc3RyLnN1YnN0cmluZyggaW5kZXgxICk7XHJcbiAgICAgICAgc3RyID0gYmVmb3JlICsgUkVQTEFDRU1FTlRfTUFQWyBrZXkgXSArIGFmdGVyO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSApO1xyXG5cclxuICByZXR1cm4gc3RyO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB3Z3NsTWluaWZ5OyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxJQUFNQSxlQUFlLEdBQUc7RUFDdEIsV0FBVyxFQUFFLE9BQU87RUFDcEIsV0FBVyxFQUFFLE9BQU87RUFDcEIsV0FBVyxFQUFFLE9BQU87RUFDcEIsV0FBVyxFQUFFLE9BQU87RUFDcEIsV0FBVyxFQUFFLE9BQU87RUFDcEIsV0FBVyxFQUFFLE9BQU87RUFDcEIsV0FBVyxFQUFFLE9BQU87RUFDcEIsV0FBVyxFQUFFLE9BQU87RUFDcEIsV0FBVyxFQUFFLE9BQU87RUFDcEIsV0FBVyxFQUFFLE9BQU87RUFDcEIsV0FBVyxFQUFFLE9BQU87RUFDcEIsV0FBVyxFQUFFLE9BQU87RUFDcEIsYUFBYSxFQUFFLFNBQVM7RUFDeEIsYUFBYSxFQUFFLFNBQVM7RUFDeEIsYUFBYSxFQUFFLFNBQVM7RUFDeEIsYUFBYSxFQUFFLFNBQVM7RUFDeEIsYUFBYSxFQUFFLFNBQVM7RUFDeEIsYUFBYSxFQUFFLFNBQVM7RUFDeEIsYUFBYSxFQUFFLFNBQVM7RUFDeEIsYUFBYSxFQUFFLFNBQVM7RUFDeEIsYUFBYSxFQUFFLFNBQVM7RUFDeEIsYUFBYSxFQUFFLFNBQVM7RUFDeEIsYUFBYSxFQUFFLFNBQVM7RUFDeEIsYUFBYSxFQUFFLFNBQVM7RUFDeEIsYUFBYSxFQUFFLFNBQVM7RUFD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