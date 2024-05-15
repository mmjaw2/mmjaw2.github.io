"use strict";

// Copyright 2018, University of Colorado Boulder

/**
 * git checkout -b {{BRANCH}}
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var execute = require('./execute');
var assert = require('assert');
var winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Executes git checkout -b {{BRANCH}}
 * @public
 *
 * @param {string} repo - The repository name
 * @param {string} branch - The branch name to create
 * @returns {Promise.<string>} - Stdout
 * @rejects {ExecuteError}
 */
module.exports = function (repo, branch) {
  assert(typeof repo === 'string');
  assert(typeof branch === 'string');
  winston.info("git checkout -b ".concat(branch, " on ").concat(repo));
  return execute('git', ['checkout', '-b', branch], "../".concat(repo));
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsImFzc2VydCIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwicmVwbyIsImJyYW5jaCIsImluZm8iLCJjb25jYXQiXSwic291cmNlcyI6WyJnaXRDcmVhdGVCcmFuY2guanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIGdpdCBjaGVja291dCAtYiB7e0JSQU5DSH19XHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4vZXhlY3V0ZScgKTtcclxuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSggJ2Fzc2VydCcgKTtcclxuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xyXG5cclxuLyoqXHJcbiAqIEV4ZWN1dGVzIGdpdCBjaGVja291dCAtYiB7e0JSQU5DSH19XHJcbiAqIEBwdWJsaWNcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBicmFuY2ggLSBUaGUgYnJhbmNoIG5hbWUgdG8gY3JlYXRlXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxzdHJpbmc+fSAtIFN0ZG91dFxyXG4gKiBAcmVqZWN0cyB7RXhlY3V0ZUVycm9yfVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggcmVwbywgYnJhbmNoICkge1xyXG4gIGFzc2VydCggdHlwZW9mIHJlcG8gPT09ICdzdHJpbmcnICk7XHJcbiAgYXNzZXJ0KCB0eXBlb2YgYnJhbmNoID09PSAnc3RyaW5nJyApO1xyXG5cclxuICB3aW5zdG9uLmluZm8oIGBnaXQgY2hlY2tvdXQgLWIgJHticmFuY2h9IG9uICR7cmVwb31gICk7XHJcblxyXG4gIHJldHVybiBleGVjdXRlKCAnZ2l0JywgWyAnY2hlY2tvdXQnLCAnLWInLCBicmFuY2ggXSwgYC4uLyR7cmVwb31gICk7XHJcbn07Il0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBTUEsT0FBTyxHQUFHQyxPQUFPLENBQUUsV0FBWSxDQUFDO0FBQ3RDLElBQU1DLE1BQU0sR0FBR0QsT0FBTyxDQUFFLFFBQVMsQ0FBQztBQUNsQyxJQUFNRSxPQUFPLEdBQUdGLE9BQU8sQ0FBRSxTQUFVLENBQUM7O0FBRXBDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBRyxNQUFNLENBQUNDLE9BQU8sR0FBRyxVQUFVQyxJQUFJLEVBQUVDLE1BQU0sRUFBRztFQUN4Q0wsTUFBTSxDQUFFLE9BQU9JLElBQUksS0FBSyxRQUFTLENBQUM7RUFDbENKLE1BQU0sQ0FBRSxPQUFPSyxNQUFNLEtBQUssUUFBUyxDQUFDO0VBRXBDSixPQUFPLENBQUNLLElBQUksb0JBQUFDLE1BQUEsQ0FBcUJGLE1BQU0sVUFBQUUsTUFBQSxDQUFPSCxJQUFJLENBQUcsQ0FBQztFQUV0RCxPQUFPTixPQUFPLENBQUUsS0FBSyxFQUFFLENBQUUsVUFBVSxFQUFFLElBQUksRUFBRU8sTUFBTSxDQUFFLFFBQUFFLE1BQUEsQ0FBUUgsSUFBSSxDQUFHLENBQUM7QUFDckUsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==