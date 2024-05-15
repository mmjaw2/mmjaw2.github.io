"use strict";

// Copyright 2020-2024, University of Colorado Boulder

/**
 * Fix end of lines for a string based on the operating system this code is being run on.
 * See https://github.com/phetsims/chipper/issues/933
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

// modules
var os = require('os');

/**
 * @public
 *
 * @returns {string}
 */
module.exports = function (string) {
  return string.split('\r').join('').split('\n').join(os.EOL);
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJvcyIsInJlcXVpcmUiLCJtb2R1bGUiLCJleHBvcnRzIiwic3RyaW5nIiwic3BsaXQiLCJqb2luIiwiRU9MIl0sInNvdXJjZXMiOlsiZml4RU9MLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIwLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEZpeCBlbmQgb2YgbGluZXMgZm9yIGEgc3RyaW5nIGJhc2VkIG9uIHRoZSBvcGVyYXRpbmcgc3lzdGVtIHRoaXMgY29kZSBpcyBiZWluZyBydW4gb24uXHJcbiAqIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvOTMzXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5cclxuLy8gbW9kdWxlc1xyXG5jb25zdCBvcyA9IHJlcXVpcmUoICdvcycgKTtcclxuXHJcbi8qKlxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IHN0cmluZyA9PiBzdHJpbmcuc3BsaXQoICdcXHInICkuam9pbiggJycgKS5zcGxpdCggJ1xcbicgKS5qb2luKCBvcy5FT0wgKTsiXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQTtBQUNBLElBQU1BLEVBQUUsR0FBR0MsT0FBTyxDQUFFLElBQUssQ0FBQzs7QUFFMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBQyxNQUFNLENBQUNDLE9BQU8sR0FBRyxVQUFBQyxNQUFNO0VBQUEsT0FBSUEsTUFBTSxDQUFDQyxLQUFLLENBQUUsSUFBSyxDQUFDLENBQUNDLElBQUksQ0FBRSxFQUFHLENBQUMsQ0FBQ0QsS0FBSyxDQUFFLElBQUssQ0FBQyxDQUFDQyxJQUFJLENBQUVOLEVBQUUsQ0FBQ08sR0FBSSxDQUFDO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=