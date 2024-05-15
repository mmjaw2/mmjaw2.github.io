"use strict";

// Copyright 2022, University of Colorado Boulder

/**
 * Returns a list of arguments to use with `grunt` to build a specific simulation
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var assert = require('assert');

/**
 * Returns a list of arguments to use with `grunt` to build a specific simulation
 * @public
 *
 * @param {ChipperVersion} chipperVersion
 * @param {Object} [options]
 * @returns {string[]}
 */
module.exports = function (chipperVersion, options) {
  var _ref = options || {},
    _ref$brands = _ref.brands,
    brands = _ref$brands === void 0 ? ['phet'] : _ref$brands,
    _ref$locales = _ref.locales,
    locales = _ref$locales === void 0 ? 'en' : _ref$locales,
    _ref$allHTML = _ref.allHTML,
    allHTML = _ref$allHTML === void 0 ? true : _ref$allHTML,
    _ref$debugHTML = _ref.debugHTML,
    debugHTML = _ref$debugHTML === void 0 ? true : _ref$debugHTML,
    _ref$uglify = _ref.uglify,
    uglify = _ref$uglify === void 0 ? true : _ref$uglify,
    _ref$mangle = _ref.mangle,
    mangle = _ref$mangle === void 0 ? true : _ref$mangle,
    _ref$minify = _ref.minify,
    minify = _ref$minify === void 0 ? true : _ref$minify,
    _ref$lint = _ref.lint,
    lint = _ref$lint === void 0 ? true : _ref$lint,
    _ref$clean = _ref.clean,
    clean = _ref$clean === void 0 ? true : _ref$clean,
    _ref$thumbnails = _ref.thumbnails,
    thumbnails = _ref$thumbnails === void 0 ? false : _ref$thumbnails,
    _ref$twitterCard = _ref.twitterCard,
    twitterCard = _ref$twitterCard === void 0 ? false : _ref$twitterCard,
    _ref$buildForServer = _ref.buildForServer,
    buildForServer = _ref$buildForServer === void 0 ? false : _ref$buildForServer;
  var args = [];

  // Chipper "1.0" (it was called such) had version 0.0.0 in its package.json
  if (chipperVersion.major === 0 && chipperVersion.minor === 0) {
    assert(brands.length === 1, 'chipper 0.0.0 cannot build multiple brands at a time');
    if (lint) {
      args.push('lint-all');
    }
    if (clean) {
      args.push('clean');
    }
    if (buildForServer) {
      args.push('build-for-server');
    } else {
      args.push('build');
    }
    if (thumbnails) {
      args.push('generate-thumbnails');
    }
    if (twitterCard) {
      args.push('generate-twitter-card');
    }
    args.push("--brand=".concat(brands[0]));
    args.push("--locales=".concat(locales));
    if (!uglify) {
      args.push('--uglify=false');
    }
    if (!mangle) {
      args.push('--mangle=false');
    }
    if (allHTML && brands[0] !== 'phet-io') {
      args.push('--allHTML');
    }
    if (debugHTML) {
      args.push('--debugHTML');
    }
  }
  // Chipper 2.0
  else if (chipperVersion.major === 2 && chipperVersion.minor === 0) {
    args.push("--brands=".concat(brands.join(',')));
    args.push("--locales=".concat(locales));
    if (!uglify) {
      args.push('--minify.uglify=false');
    }
    if (!mangle) {
      args.push('--minify.mangle=false');
    }
    if (!minify) {
      args.push('--minify.minify=false');
    }
    if (!lint) {
      args.push('--lint=false');
    }
    if (allHTML) {
      args.push('--allHTML');
    }
    if (debugHTML) {
      args.push('--debugHTML');
    }
  } else {
    throw new Error("unsupported chipper version: ".concat(chipperVersion.toString()));
  }
  return args;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3NlcnQiLCJyZXF1aXJlIiwibW9kdWxlIiwiZXhwb3J0cyIsImNoaXBwZXJWZXJzaW9uIiwib3B0aW9ucyIsIl9yZWYiLCJfcmVmJGJyYW5kcyIsImJyYW5kcyIsIl9yZWYkbG9jYWxlcyIsImxvY2FsZXMiLCJfcmVmJGFsbEhUTUwiLCJhbGxIVE1MIiwiX3JlZiRkZWJ1Z0hUTUwiLCJkZWJ1Z0hUTUwiLCJfcmVmJHVnbGlmeSIsInVnbGlmeSIsIl9yZWYkbWFuZ2xlIiwibWFuZ2xlIiwiX3JlZiRtaW5pZnkiLCJtaW5pZnkiLCJfcmVmJGxpbnQiLCJsaW50IiwiX3JlZiRjbGVhbiIsImNsZWFuIiwiX3JlZiR0aHVtYm5haWxzIiwidGh1bWJuYWlscyIsIl9yZWYkdHdpdHRlckNhcmQiLCJ0d2l0dGVyQ2FyZCIsIl9yZWYkYnVpbGRGb3JTZXJ2ZXIiLCJidWlsZEZvclNlcnZlciIsImFyZ3MiLCJtYWpvciIsIm1pbm9yIiwibGVuZ3RoIiwicHVzaCIsImNvbmNhdCIsImpvaW4iLCJFcnJvciIsInRvU3RyaW5nIl0sInNvdXJjZXMiOlsiZ2V0QnVpbGRBcmd1bWVudHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjIsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgYSBsaXN0IG9mIGFyZ3VtZW50cyB0byB1c2Ugd2l0aCBgZ3J1bnRgIHRvIGJ1aWxkIGEgc3BlY2lmaWMgc2ltdWxhdGlvblxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSggJ2Fzc2VydCcgKTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGEgbGlzdCBvZiBhcmd1bWVudHMgdG8gdXNlIHdpdGggYGdydW50YCB0byBidWlsZCBhIHNwZWNpZmljIHNpbXVsYXRpb25cclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge0NoaXBwZXJWZXJzaW9ufSBjaGlwcGVyVmVyc2lvblxyXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXHJcbiAqIEByZXR1cm5zIHtzdHJpbmdbXX1cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIGNoaXBwZXJWZXJzaW9uLCBvcHRpb25zICkge1xyXG4gIGNvbnN0IHtcclxuICAgIGJyYW5kcyA9IFsgJ3BoZXQnIF0sXHJcbiAgICBsb2NhbGVzID0gJ2VuJyxcclxuICAgIGFsbEhUTUwgPSB0cnVlLFxyXG4gICAgZGVidWdIVE1MID0gdHJ1ZSwgLy8gRGVzaXJlZCBpbiBhbG1vc3QgYWxsIHBlcmVubmlhbCBidWlsZHMsIHNvIHNldCB0byB0cnVlIGhlcmVcclxuICAgIHVnbGlmeSA9IHRydWUsXHJcbiAgICBtYW5nbGUgPSB0cnVlLFxyXG4gICAgbWluaWZ5ID0gdHJ1ZSxcclxuICAgIGxpbnQgPSB0cnVlLFxyXG4gICAgY2xlYW4gPSB0cnVlLFxyXG4gICAgdGh1bWJuYWlscyA9IGZhbHNlLFxyXG4gICAgdHdpdHRlckNhcmQgPSBmYWxzZSxcclxuICAgIGJ1aWxkRm9yU2VydmVyID0gZmFsc2VcclxuICB9ID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgY29uc3QgYXJncyA9IFtdO1xyXG5cclxuICAvLyBDaGlwcGVyIFwiMS4wXCIgKGl0IHdhcyBjYWxsZWQgc3VjaCkgaGFkIHZlcnNpb24gMC4wLjAgaW4gaXRzIHBhY2thZ2UuanNvblxyXG4gIGlmICggY2hpcHBlclZlcnNpb24ubWFqb3IgPT09IDAgJiYgY2hpcHBlclZlcnNpb24ubWlub3IgPT09IDAgKSB7XHJcbiAgICBhc3NlcnQoIGJyYW5kcy5sZW5ndGggPT09IDEsICdjaGlwcGVyIDAuMC4wIGNhbm5vdCBidWlsZCBtdWx0aXBsZSBicmFuZHMgYXQgYSB0aW1lJyApO1xyXG4gICAgaWYgKCBsaW50ICkge1xyXG4gICAgICBhcmdzLnB1c2goICdsaW50LWFsbCcgKTtcclxuICAgIH1cclxuICAgIGlmICggY2xlYW4gKSB7XHJcbiAgICAgIGFyZ3MucHVzaCggJ2NsZWFuJyApO1xyXG4gICAgfVxyXG4gICAgaWYgKCBidWlsZEZvclNlcnZlciApIHtcclxuICAgICAgYXJncy5wdXNoKCAnYnVpbGQtZm9yLXNlcnZlcicgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBhcmdzLnB1c2goICdidWlsZCcgKTtcclxuICAgIH1cclxuICAgIGlmICggdGh1bWJuYWlscyApIHtcclxuICAgICAgYXJncy5wdXNoKCAnZ2VuZXJhdGUtdGh1bWJuYWlscycgKTtcclxuICAgIH1cclxuICAgIGlmICggdHdpdHRlckNhcmQgKSB7XHJcbiAgICAgIGFyZ3MucHVzaCggJ2dlbmVyYXRlLXR3aXR0ZXItY2FyZCcgKTtcclxuICAgIH1cclxuICAgIGFyZ3MucHVzaCggYC0tYnJhbmQ9JHticmFuZHNbIDAgXX1gICk7XHJcbiAgICBhcmdzLnB1c2goIGAtLWxvY2FsZXM9JHtsb2NhbGVzfWAgKTtcclxuICAgIGlmICggIXVnbGlmeSApIHtcclxuICAgICAgYXJncy5wdXNoKCAnLS11Z2xpZnk9ZmFsc2UnICk7XHJcbiAgICB9XHJcbiAgICBpZiAoICFtYW5nbGUgKSB7XHJcbiAgICAgIGFyZ3MucHVzaCggJy0tbWFuZ2xlPWZhbHNlJyApO1xyXG4gICAgfVxyXG4gICAgaWYgKCBhbGxIVE1MICYmIGJyYW5kc1sgMCBdICE9PSAncGhldC1pbycgKSB7XHJcbiAgICAgIGFyZ3MucHVzaCggJy0tYWxsSFRNTCcgKTtcclxuICAgIH1cclxuICAgIGlmICggZGVidWdIVE1MICkge1xyXG4gICAgICBhcmdzLnB1c2goICctLWRlYnVnSFRNTCcgKTtcclxuICAgIH1cclxuICB9XHJcbiAgLy8gQ2hpcHBlciAyLjBcclxuICBlbHNlIGlmICggY2hpcHBlclZlcnNpb24ubWFqb3IgPT09IDIgJiYgY2hpcHBlclZlcnNpb24ubWlub3IgPT09IDAgKSB7XHJcbiAgICBhcmdzLnB1c2goIGAtLWJyYW5kcz0ke2JyYW5kcy5qb2luKCAnLCcgKX1gICk7XHJcbiAgICBhcmdzLnB1c2goIGAtLWxvY2FsZXM9JHtsb2NhbGVzfWAgKTtcclxuICAgIGlmICggIXVnbGlmeSApIHtcclxuICAgICAgYXJncy5wdXNoKCAnLS1taW5pZnkudWdsaWZ5PWZhbHNlJyApO1xyXG4gICAgfVxyXG4gICAgaWYgKCAhbWFuZ2xlICkge1xyXG4gICAgICBhcmdzLnB1c2goICctLW1pbmlmeS5tYW5nbGU9ZmFsc2UnICk7XHJcbiAgICB9XHJcbiAgICBpZiAoICFtaW5pZnkgKSB7XHJcbiAgICAgIGFyZ3MucHVzaCggJy0tbWluaWZ5Lm1pbmlmeT1mYWxzZScgKTtcclxuICAgIH1cclxuICAgIGlmICggIWxpbnQgKSB7XHJcbiAgICAgIGFyZ3MucHVzaCggJy0tbGludD1mYWxzZScgKTtcclxuICAgIH1cclxuICAgIGlmICggYWxsSFRNTCApIHtcclxuICAgICAgYXJncy5wdXNoKCAnLS1hbGxIVE1MJyApO1xyXG4gICAgfVxyXG4gICAgaWYgKCBkZWJ1Z0hUTUwgKSB7XHJcbiAgICAgIGFyZ3MucHVzaCggJy0tZGVidWdIVE1MJyApO1xyXG4gICAgfVxyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvciggYHVuc3VwcG9ydGVkIGNoaXBwZXIgdmVyc2lvbjogJHtjaGlwcGVyVmVyc2lvbi50b1N0cmluZygpfWAgKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBhcmdzO1xyXG59OyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLElBQU1BLE1BQU0sR0FBR0MsT0FBTyxDQUFFLFFBQVMsQ0FBQzs7QUFFbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBQyxNQUFNLENBQUNDLE9BQU8sR0FBRyxVQUFVQyxjQUFjLEVBQUVDLE9BQU8sRUFBRztFQUNuRCxJQUFBQyxJQUFBLEdBYUlELE9BQU8sSUFBSSxDQUFDLENB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