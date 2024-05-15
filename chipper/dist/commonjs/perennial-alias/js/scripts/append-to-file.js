"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _nodeFs = require("node:fs");
// Copyright 2023, University of Colorado Boulder

/**
 * Add content to file.
 *
 * @author Liam Mulhall <liammulh@gmail.com>
 */

/**
 * Append the given content to the file.
 *
 * @param {String} pathToFile - path to the file you want to append to
 * @param {String} content - content you want to add to the file
 */
var appendToFile = function appendToFile(pathToFile, content) {
  (0, _nodeFs.writeFileSync)(pathToFile, content, {
    encoding: 'utf-8',
    flag: 'a'
  });
};
var _default = exports["default"] = appendToFile;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfbm9kZUZzIiwicmVxdWlyZSIsImFwcGVuZFRvRmlsZSIsInBhdGhUb0ZpbGUiLCJjb250ZW50Iiwid3JpdGVGaWxlU3luYyIsImVuY29kaW5nIiwiZmxhZyIsIl9kZWZhdWx0IiwiZXhwb3J0cyJdLCJzb3VyY2VzIjpbImFwcGVuZC10by1maWxlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBZGQgY29udGVudCB0byBmaWxlLlxyXG4gKlxyXG4gKiBAYXV0aG9yIExpYW0gTXVsaGFsbCA8bGlhbW11bGhAZ21haWwuY29tPlxyXG4gKi9cclxuXHJcbmltcG9ydCB7IHdyaXRlRmlsZVN5bmMgfSBmcm9tICdub2RlOmZzJztcclxuXHJcbi8qKlxyXG4gKiBBcHBlbmQgdGhlIGdpdmVuIGNvbnRlbnQgdG8gdGhlIGZpbGUuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoVG9GaWxlIC0gcGF0aCB0byB0aGUgZmlsZSB5b3Ugd2FudCB0byBhcHBlbmQgdG9cclxuICogQHBhcmFtIHtTdHJpbmd9IGNvbnRlbnQgLSBjb250ZW50IHlvdSB3YW50IHRvIGFkZCB0byB0aGUgZmlsZVxyXG4gKi9cclxuY29uc3QgYXBwZW5kVG9GaWxlID0gKCBwYXRoVG9GaWxlLCBjb250ZW50ICkgPT4ge1xyXG4gIHdyaXRlRmlsZVN5bmMoIHBhdGhUb0ZpbGUsIGNvbnRlbnQsIHsgZW5jb2Rpbmc6ICd1dGYtOCcsIGZsYWc6ICdhJyB9ICk7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhcHBlbmRUb0ZpbGU7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFRQSxJQUFBQSxPQUFBLEdBQUFDLE9BQUE7QUFSQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQU1DLFlBQVksR0FBRyxTQUFmQSxZQUFZQSxDQUFLQyxVQUFVLEVBQUVDLE9BQU8sRUFBTTtFQUM5QyxJQUFBQyxxQkFBYSxFQUFFRixVQUFVLEVBQUVDLE9BQU8sRUFBRTtJQUFFRSxRQUFRLEVBQUUsT0FBTztJQUFFQyxJQUFJLEVBQUU7RUFBSSxDQUFFLENBQUM7QUFDeEUsQ0FBQztBQUFDLElBQUFDLFFBQUEsR0FBQUMsT0FBQSxjQUVhUCxZQUFZIiwiaWdub3JlTGlzdCI6W119