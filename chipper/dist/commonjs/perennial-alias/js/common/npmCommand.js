"use strict";

// Copyright 2017, University of Colorado Boulder

/**
 * The npm "command" based on the platform.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// {string} - needs to be a slightly different command for Windows
module.exports = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwidGVzdCIsInByb2Nlc3MiLCJwbGF0Zm9ybSJdLCJzb3VyY2VzIjpbIm5wbUNvbW1hbmQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTcsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFRoZSBucG0gXCJjb21tYW5kXCIgYmFzZWQgb24gdGhlIHBsYXRmb3JtLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuLy8ge3N0cmluZ30gLSBuZWVkcyB0byBiZSBhIHNsaWdodGx5IGRpZmZlcmVudCBjb21tYW5kIGZvciBXaW5kb3dzXHJcbm1vZHVsZS5leHBvcnRzID0gL153aW4vLnRlc3QoIHByb2Nlc3MucGxhdGZvcm0gKSA/ICducG0uY21kJyA6ICducG0nOyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0FBLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLE1BQU0sQ0FBQ0MsSUFBSSxDQUFFQyxPQUFPLENBQUNDLFFBQVMsQ0FBQyxHQUFHLFNBQVMsR0FBRyxLQUFLIiwiaWdub3JlTGlzdCI6W119