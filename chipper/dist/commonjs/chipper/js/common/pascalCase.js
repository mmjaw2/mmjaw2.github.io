"use strict";

// Copyright 2022-2024, University of Colorado Boulder

/* eslint-env node */

var _ = require('lodash');

/**
 * Convert a string to PascalCase
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
module.exports = function pascalCase(string) {
  return "".concat(_.startCase(_.camelCase(string)).split(' ').join(''));
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsIm1vZHVsZSIsImV4cG9ydHMiLCJwYXNjYWxDYXNlIiwic3RyaW5nIiwiY29uY2F0Iiwic3RhcnRDYXNlIiwiY2FtZWxDYXNlIiwic3BsaXQiLCJqb2luIl0sInNvdXJjZXMiOlsicGFzY2FsQ2FzZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qIGVzbGludC1lbnYgbm9kZSAqL1xyXG5cclxuY29uc3QgXyA9IHJlcXVpcmUoICdsb2Rhc2gnICk7XHJcblxyXG4vKipcclxuICogQ29udmVydCBhIHN0cmluZyB0byBQYXNjYWxDYXNlXHJcbiAqIEBhdXRob3IgQ2hyaXMgS2x1c2VuZG9yZiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXNjYWxDYXNlKCBzdHJpbmcgKSB7XHJcbiAgcmV0dXJuIGAke18uc3RhcnRDYXNlKCBfLmNhbWVsQ2FzZSggc3RyaW5nICkgKS5zcGxpdCggJyAnICkuam9pbiggJycgKX1gO1xyXG59OyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFFQTs7QUFFQSxJQUFNQSxDQUFDLEdBQUdDLE9BQU8sQ0FBRSxRQUFTLENBQUM7O0FBRTdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQUMsTUFBTSxDQUFDQyxPQUFPLEdBQUcsU0FBU0MsVUFBVUEsQ0FBRUMsTUFBTSxFQUFHO0VBQzdDLFVBQUFDLE1BQUEsQ0FBVU4sQ0FBQyxDQUFDTyxTQUFTLENBQUVQLENBQUMsQ0FBQ1EsU0FBUyxDQUFFSCxNQUFPLENBQUUsQ0FBQyxDQUFDSSxLQUFLLENBQUUsR0FBSSxDQUFDLENBQUNDLElBQUksQ0FBRSxFQUFHLENBQUM7QUFDeEUsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==