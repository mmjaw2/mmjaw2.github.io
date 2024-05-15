"use strict";

// Copyright 2023-2024, University of Colorado Boulder

/**
 * More space-efficient alternative to JSON.stringify for strings, that will escape only the necessary characters.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var toLessEscapedString = function toLessEscapedString(string) {
  var result = '';
  string.split(/(?:)/).forEach(function (_char) {
    if (_char === '\r') {
      result += '\\r';
    } else if (_char === '\n') {
      result += '\\n';
    } else if (_char === '\\') {
      result += '\\\\';
    } else if (_char === '\'') {
      result += '\\\'';
    } else {
      result += _char;
    }
  });
  return "'".concat(result, "'");
};
module.exports = toLessEscapedString;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ0b0xlc3NFc2NhcGVkU3RyaW5nIiwic3RyaW5nIiwicmVzdWx0Iiwic3BsaXQiLCJmb3JFYWNoIiwiY2hhciIsImNvbmNhdCIsIm1vZHVsZSIsImV4cG9ydHMiXSwic291cmNlcyI6WyJ0b0xlc3NFc2NhcGVkU3RyaW5nLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIE1vcmUgc3BhY2UtZWZmaWNpZW50IGFsdGVybmF0aXZlIHRvIEpTT04uc3RyaW5naWZ5IGZvciBzdHJpbmdzLCB0aGF0IHdpbGwgZXNjYXBlIG9ubHkgdGhlIG5lY2Vzc2FyeSBjaGFyYWN0ZXJzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgdG9MZXNzRXNjYXBlZFN0cmluZyA9IHN0cmluZyA9PiB7XHJcbiAgbGV0IHJlc3VsdCA9ICcnO1xyXG5cclxuICBzdHJpbmcuc3BsaXQoIC8oPzopL3UgKS5mb3JFYWNoKCBjaGFyID0+IHtcclxuICAgIGlmICggY2hhciA9PT0gJ1xccicgKSB7XHJcbiAgICAgIHJlc3VsdCArPSAnXFxcXHInO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGNoYXIgPT09ICdcXG4nICkge1xyXG4gICAgICByZXN1bHQgKz0gJ1xcXFxuJztcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBjaGFyID09PSAnXFxcXCcgKSB7XHJcbiAgICAgIHJlc3VsdCArPSAnXFxcXFxcXFwnO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGNoYXIgPT09ICdcXCcnICkge1xyXG4gICAgICByZXN1bHQgKz0gJ1xcXFxcXCcnO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJlc3VsdCArPSBjaGFyO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuXHJcbiAgcmV0dXJuIGAnJHtyZXN1bHR9J2A7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHRvTGVzc0VzY2FwZWRTdHJpbmc7Il0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBTUEsbUJBQW1CLEdBQUcsU0FBdEJBLG1CQUFtQkEsQ0FBR0MsTUFBTSxFQUFJO0VBQ3BDLElBQUlDLE1BQU0sR0FBRyxFQUFFO0VBRWZELE1BQU0sQ0FBQ0UsS0FBSyxDQUFFLE1BQVEsQ0FBQyxDQUFDQyxPQUFPLENBQUUsVUFBQUMsS0FBSSxFQUFJO0lBQ3ZDLElBQUtBLEtBQUksS0FBSyxJQUFJLEVBQUc7TUFDbkJILE1BQU0sSUFBSSxLQUFLO0lBQ2pCLENBQUMsTUFDSSxJQUFLRyxLQUFJLEtBQUssSUFBSSxFQUFHO01BQ3hCSCxNQUFNLElBQUksS0FBSztJQUNqQixDQUFDLE1BQ0ksSUFBS0csS0FBSSxLQUFLLElBQUksRUFBRztNQUN4QkgsTUFBTSxJQUFJLE1BQU07SUFDbEIsQ0FBQyxNQUNJLElBQUtHLEtBQUksS0FBSyxJQUFJLEVBQUc7TUFDeEJILE1BQU0sSUFBSSxNQUFNO0lBQ2xCLENBQUMsTUFDSTtNQUNIQSxNQUFNLElBQUlHLEtBQUk7SUFDaEI7RUFDRixDQUFFLENBQUM7RUFFSCxXQUFBQyxNQUFBLENBQVdKLE1BQU07QUFDbkIsQ0FBQztBQUVESyxNQUFNLENBQUNDLE9BQU8sR0FBR1IsbUJBQW1CIiwiaWdub3JlTGlzdCI6W119