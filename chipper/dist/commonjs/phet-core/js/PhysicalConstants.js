"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
// Copyright 2019-2023, University of Colorado Boulder

/**
 * From wikipedia:
 *  > A physical constant, sometimes fundamental physical constant or universal constant, is a physical quantity that is
 *  > generally believed to be both universal in nature and have constant value in time. It is contrasted with a
 *  > mathematical constant, which has a fixed numerical value, but does not directly involve any physical
 *  > measurement.
 *
 * Here is a link to examples of these types of "universal constants"
 * https://cosmologist.info/teaching/Cosmology/Physical_constants.pdf
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

var PhysicalConstants = {
  /**
   * The coefficient in Newton's universal law of gravitation: F = G * m1 * m2 * r^-2
   * The value is described in:
   * https://en.wikipedia.org/wiki/Gravitational_constant
   * https://physics.nist.gov/cgi-bin/cuu/Value?bg
   * https://www.quora.com/What-is-the-value-of-gravitational-constant-G
   */
  GRAVITATIONAL_CONSTANT: 6.67430E-11,
  // m^3 kg^-1 s^-2

  /**
   * The amount of gravity on Earth.
   * m/s^2
   */
  GRAVITY_ON_EARTH: 9.81
};
_phetCore["default"].register('PhysicalConstants', PhysicalConstants);
var _default = exports["default"] = PhysicalConstants;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcGhldENvcmUiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJQaHlzaWNhbENvbnN0YW50cyIsIkdSQVZJVEFUSU9OQUxfQ09OU1RBTlQiLCJHUkFWSVRZX09OX0VBUlRIIiwicGhldENvcmUiLCJyZWdpc3RlciIsIl9kZWZhdWx0IiwiZXhwb3J0cyJdLCJzb3VyY2VzIjpbIlBoeXNpY2FsQ29uc3RhbnRzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE5LTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEZyb20gd2lraXBlZGlhOlxyXG4gKiAgPiBBIHBoeXNpY2FsIGNvbnN0YW50LCBzb21ldGltZXMgZnVuZGFtZW50YWwgcGh5c2ljYWwgY29uc3RhbnQgb3IgdW5pdmVyc2FsIGNvbnN0YW50LCBpcyBhIHBoeXNpY2FsIHF1YW50aXR5IHRoYXQgaXNcclxuICogID4gZ2VuZXJhbGx5IGJlbGlldmVkIHRvIGJlIGJvdGggdW5pdmVyc2FsIGluIG5hdHVyZSBhbmQgaGF2ZSBjb25zdGFudCB2YWx1ZSBpbiB0aW1lLiBJdCBpcyBjb250cmFzdGVkIHdpdGggYVxyXG4gKiAgPiBtYXRoZW1hdGljYWwgY29uc3RhbnQsIHdoaWNoIGhhcyBhIGZpeGVkIG51bWVyaWNhbCB2YWx1ZSwgYnV0IGRvZXMgbm90IGRpcmVjdGx5IGludm9sdmUgYW55IHBoeXNpY2FsXHJcbiAqICA+IG1lYXN1cmVtZW50LlxyXG4gKlxyXG4gKiBIZXJlIGlzIGEgbGluayB0byBleGFtcGxlcyBvZiB0aGVzZSB0eXBlcyBvZiBcInVuaXZlcnNhbCBjb25zdGFudHNcIlxyXG4gKiBodHRwczovL2Nvc21vbG9naXN0LmluZm8vdGVhY2hpbmcvQ29zbW9sb2d5L1BoeXNpY2FsX2NvbnN0YW50cy5wZGZcclxuICpcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBwaGV0Q29yZSBmcm9tICcuL3BoZXRDb3JlLmpzJztcclxuXHJcbmNvbnN0IFBoeXNpY2FsQ29uc3RhbnRzID0ge1xyXG5cclxuICAvKipcclxuICAgKiBUaGUgY29lZmZpY2llbnQgaW4gTmV3dG9uJ3MgdW5pdmVyc2FsIGxhdyBvZiBncmF2aXRhdGlvbjogRiA9IEcgKiBtMSAqIG0yICogcl4tMlxyXG4gICAqIFRoZSB2YWx1ZSBpcyBkZXNjcmliZWQgaW46XHJcbiAgICogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvR3Jhdml0YXRpb25hbF9jb25zdGFudFxyXG4gICAqIGh0dHBzOi8vcGh5c2ljcy5uaXN0Lmdvdi9jZ2ktYmluL2N1dS9WYWx1ZT9iZ1xyXG4gICAqIGh0dHBzOi8vd3d3LnF1b3JhLmNvbS9XaGF0LWlzLXRoZS12YWx1ZS1vZi1ncmF2aXRhdGlvbmFsLWNvbnN0YW50LUdcclxuICAgKi9cclxuICBHUkFWSVRBVElPTkFMX0NPTlNUQU5UOiA2LjY3NDMwRS0xMSwgLy8gbV4zIGtnXi0xIHNeLTJcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGFtb3VudCBvZiBncmF2aXR5IG9uIEVhcnRoLlxyXG4gICAqIG0vc14yXHJcbiAgICovXHJcbiAgR1JBVklUWV9PTl9FQVJUSDogOS44MVxyXG59O1xyXG5cclxucGhldENvcmUucmVnaXN0ZXIoICdQaHlzaWNhbENvbnN0YW50cycsIFBoeXNpY2FsQ29uc3RhbnRzICk7XHJcbmV4cG9ydCBkZWZhdWx0IFBoeXNpY2FsQ29uc3RhbnRzOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBZUEsSUFBQUEsU0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQXFDLFNBQUFELHVCQUFBRSxHQUFBLFdBQUFBLEdBQUEsSUFBQUEsR0FBQSxDQUFBQyxVQUFBLEdBQUFELEdBQUEsZ0JBQUFBLEdBQUE7QUFmckM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUlBLElBQU1FLGlCQUFpQixHQUFHO0VBRXhCO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0VDLHNCQUFzQixFQUFFLFdBQVc7RUFBRTs7RUFFckM7QUFDRjtBQUNBO0FBQ0E7RUFDRUMsZ0JBQWdCLEVBQUU7QUFDcEIsQ0FBQztBQUVEQyxvQkFBUSxDQUFDQyxRQUFRLENBQUUsbUJBQW1CLEVBQUVKLGlCQUFrQixDQUFDO0FBQUMsSUFBQUssUUFBQSxHQUFBQyxPQUFBLGNBQzdDTixpQkFBaUIiLCJpZ25vcmVMaXN0IjpbXX0=