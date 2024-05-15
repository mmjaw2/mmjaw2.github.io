"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
// Copyright 2019-2024, University of Colorado Boulder

/**
 * Runs webpack - DO NOT RUN MULTIPLE CONCURRENTLY
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// modules
var ChipperConstants = require('../common/ChipperConstants');
var webpackGlobalLibraries = require('../common/webpackGlobalLibraries');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var webpack = require('webpack');
// eslint-disable-next-line require-statement-match
var _require = require('modify-source-webpack-plugin'),
  ModifySourcePlugin = _require.ModifySourcePlugin,
  ConcatOperation = _require.ConcatOperation;
var activeRepos = fs.readFileSync(path.resolve(__dirname, '../../../perennial-alias/data/active-repos'), 'utf-8').trim().split(/\r?\n/).map(function (s) {
  return s.trim();
});
var reposByNamespace = {};
var aliases = {};
var _iterator = _createForOfIteratorHelper(activeRepos),
  _step;
try {
  for (_iterator.s(); !(_step = _iterator.n()).done;) {
    var repo = _step.value;
    var packageFile = path.resolve(__dirname, "../../../".concat(repo, "/package.json"));
    if (fs.existsSync(packageFile)) {
      var packageObject = JSON.parse(fs.readFileSync(packageFile, 'utf-8'));
      if (packageObject.phet && packageObject.phet.requirejsNamespace) {
        reposByNamespace[packageObject.phet.requirejsNamespace] = repo;
        aliases[packageObject.phet.requirejsNamespace] = path.resolve(__dirname, "../../../".concat(repo).concat(repo === 'brand' ? '/phet' : '', "/js"));
      }
    }
  }
} catch (err) {
  _iterator.e(err);
} finally {
  _iterator.f();
}
var getModuleRules = function getModuleRules() {
  return Object.keys(webpackGlobalLibraries).map(function (globalKey) {
    return {
      // path.join to normalize on the right path separator, perhaps there is another way?!
      test: function test(fileName) {
        return fileName.includes(path.join(webpackGlobalLibraries[globalKey]));
      },
      loader: '../chipper/node_modules/expose-loader',
      options: {
        exposes: globalKey
      }
    };
  });
};

/**
 * Convert absolute paths of modules to relative ones
 * @param {Array.<string>} modules
 * @returns {Array.<string>}
 */
var getRelativeModules = function getRelativeModules(modules) {
  var root = path.resolve(__dirname, '../../../');
  return modules

  // Webpack 5 reports intermediate paths which need to be filtered out
  .filter(function (m) {
    return fs.lstatSync(m).isFile();
  })

  // Get the relative path to the root, like "joist/js/Sim.js" or, on Windows, "joist\js\Sim.js"
  .map(function (m) {
    return path.relative(root, m);
  })

  // Some developers check in a package.json to the root of the checkouts, as described in https://github.com/phetsims/chipper/issues/494#issuecomment-821292542
  // like: /Users/samreid/apache-document-root/package.json. This powers grunt only and should not be included in the modules
  .filter(function (m) {
    return m !== '../package.json' && m !== '..\\package.json';
  });
};

/**
 * Runs webpack - DO NOT RUN MULTIPLE CONCURRENTLY
 * @public
 *
 * @param {string} repo
 * @param {string} brand
 * @param {Object} [options]
 * @returns {Promise.<string>} - The combined JS output from the process
 */
var webpackBuild = function webpackBuild(repo, brand, options) {
  return new Promise(function (resolve, reject) {
    options = _.merge({
      outputDir: repo
    }, options);
    var outputDir = path.resolve(__dirname, "../../".concat(ChipperConstants.BUILD_DIR), options.outputDir);
    var outputFileName = "".concat(repo, ".js");
    var outputPath = path.resolve(outputDir, outputFileName);

    // Create plugins to ignore brands that we are not building at this time. Here "resource" is the module getting
    // imported, and "context" is the directory that holds the module doing the importing. This is split up because
    // of how brands are loaded in simLauncher.js. They are a dynamic import who's import path resolves to the current
    // brand. The way that webpack builds this is by creating a map of all the potential resources that could be loaded
    // by that import (by looking at the file structure). Thus the following resource/context regex split is accounting
    // for the "map" created in the built webpack file, in which the "resource" starts with "./{{brand}}" even though
    // the simLauncher line includes the parent directory: "brand/". For more details see https://github.com/phetsims/chipper/issues/879
    var ignorePhetBrand = new webpack.IgnorePlugin({
      resourceRegExp: /\/phet\//,
      contextRegExp: /brand/
    });
    var ignorePhetioBrand = new webpack.IgnorePlugin({
      resourceRegExp: /\/phet-io\//,
      contextRegExp: /brand/
    });
    var ignoreAdaptedFromPhetBrand = new webpack.IgnorePlugin({
      resourceRegExp: /\/adapted-from-phet\//,
      contextRegExp: /brand/
    });

    // Allow builds for developers that do not have the phet-io repo checked out. IgnorePlugin will skip any require
    // that matches the following regex.
    var ignorePhetioRepo = new webpack.IgnorePlugin({
      resourceRegExp: /\/phet-io\// // ignore anything in a phet-io named directory
    });
    var compiler = webpack({
      module: {
        rules: getModuleRules()
      },
      // We uglify as a step after this, with many custom rules. So we do NOT optimize or uglify in this step.
      optimization: {
        minimize: false
      },
      // Simulations or runnables will have a single entry point
      entry: {
        repo: "../chipper/dist/js/".concat(repo, "/js/").concat(repo, "-main.js")
      },
      // We output our builds to the following dir
      output: {
        path: outputDir,
        filename: outputFileName,
        hashFunction: 'xxhash64' // for Node 17+, see https://github.com/webpack/webpack/issues/14532
      },
      // {Array.<Plugin>}
      plugins: [].concat(_toConsumableArray(brand === 'phet' ? [ignorePhetioBrand, ignorePhetioRepo, ignoreAdaptedFromPhetBrand] : brand === 'phet-io' ? [ignorePhetBrand, ignoreAdaptedFromPhetBrand] :
      // adapted-from-phet and all other brands
      [ignorePhetBrand, ignorePhetioBrand, ignorePhetioRepo]), _toConsumableArray(options.profileFileSize ? [new ModifySourcePlugin({
        rules: [{
          test: /.*/,
          operations: [new ConcatOperation('start', 'console.log(\'START_MODULE\',\'$FILE_PATH\');\n\n'), new ConcatOperation('end', '\n\nconsole.log(\'END_MODULE\',\'$FILE_PATH\');\n\n')]
        }]
      })] : []))
    });
    compiler.run(function (err, stats) {
      if (err || stats.hasErrors()) {
        console.error('Webpack build errors:', stats.compilation.errors);
        reject(err || stats.compilation.errors[0]);
      } else {
        var jsFile = outputPath;
        var js = fs.readFileSync(jsFile, 'utf-8');
        fs.unlinkSync(jsFile);
        resolve({
          js: js,
          usedModules: getRelativeModules(Array.from(stats.compilation.fileDependencies))
        });
      }
    });
  });
};
module.exports = webpackBuild;
webpackBuild.getModuleRules = getModuleRules;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJDaGlwcGVyQ29uc3RhbnRzIiwicmVxdWlyZSIsIndlYnBhY2tHbG9iYWxMaWJyYXJpZXMiLCJmcyIsInBhdGgiLCJfIiwid2VicGFjayIsIl9yZXF1aXJlIiwiTW9kaWZ5U291cmNlUGx1Z2luIiwiQ29uY2F0T3BlcmF0aW9uIiwiYWN0aXZlUmVwb3MiLCJyZWFkRmlsZVN5bmMiLCJyZXNvbHZlIiwiX19kaXJuYW1lIiwidHJpbSIsInNwbGl0IiwibWFwIiwicyIsInJlcG9zQnlOYW1lc3BhY2UiLCJhbGlhc2VzIiwiX2l0ZXJhdG9yIiwiX2NyZWF0ZUZvck9mSXRlcmF0b3JIZWxwZXIiLCJfc3RlcCIsIm4iLCJkb25lIiwicmVwbyIsInZhbHVlIiwicGFja2FnZUZpbGUiLCJjb25jYXQiLCJleGlzdHNTeW5jIiwicGFja2FnZU9iamVjdCIsIkpTT04iLCJwYXJzZSIsInBoZXQiLCJyZXF1aXJlanNOYW1lc3BhY2UiLCJlcnIiLCJlIiwiZiIsImdldE1vZHVsZVJ1bGVzIiwiT2JqZWN0Iiwia2V5cyIsImdsb2JhbEtleSIsInRlc3QiLCJmaWxlTmFtZSIsImluY2x1ZGVzIiwiam9pbiIsImxvYWRlciIsIm9wdGlvbnMiLCJleHBvc2VzIiwiZ2V0UmVsYXRpdmVNb2R1bGVzIiwibW9kdWxlcyIsInJvb3QiLCJmaWx0ZXIiLCJtIiwibHN0YXRTeW5jIiwiaXNGaWxlIiwicmVsYXRpdmUiLCJ3ZWJwYWNrQnVpbGQiLCJicmFuZCIsIlByb21pc2UiLCJyZWplY3QiLCJtZXJnZSIsIm91dHB1dERpciIsIkJVSUxEX0RJUiIsIm91dHB1dEZpbGVOYW1lIiwib3V0cHV0UGF0aCIsImlnbm9yZVBoZXRCcmFuZCIsIklnbm9yZVBsdWdpbiIsInJlc291cmNlUmVnRXhwIiwiY29udGV4dFJlZ0V4cCIsImlnbm9yZVBoZXRpb0JyYW5kIiwiaWdub3JlQWRhcHRlZEZyb21QaGV0QnJhbmQiLCJpZ25vcmVQaGV0aW9SZXBvIiwiY29tcGlsZXIiLCJtb2R1bGUiLCJydWxlcyIsIm9wdGltaXphdGlvbiIsIm1pbmltaXplIiwiZW50cnkiLCJvdXRwdXQiLCJmaWxlbmFtZSIsImhhc2hGdW5jdGlvbiIsInBsdWdpbnMiLCJfdG9Db25zdW1hYmxlQXJyYXkiLCJwcm9maWxlRmlsZVNpemUiLCJvcGVyYXRpb25zIiwicnVuIiwic3RhdHMiLCJoYXNFcnJvcnMiLCJjb25zb2xlIiwiZXJyb3IiLCJjb21waWxhdGlvbiIsImVycm9ycyIsImpzRmlsZSIsImpzIiwidW5saW5rU3luYyIsInVzZWRNb2R1bGVzIiwiQXJyYXkiLCJmcm9tIiwiZmlsZURlcGVuZGVuY2llcyIsImV4cG9ydHMiXSwic291cmNlcyI6WyJ3ZWJwYWNrQnVpbGQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUnVucyB3ZWJwYWNrIC0gRE8gTk9UIFJVTiBNVUxUSVBMRSBDT05DVVJSRU5UTFlcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcblxyXG4vLyBtb2R1bGVzXHJcbmNvbnN0IENoaXBwZXJDb25zdGFudHMgPSByZXF1aXJlKCAnLi4vY29tbW9uL0NoaXBwZXJDb25zdGFudHMnICk7XHJcbmNvbnN0IHdlYnBhY2tHbG9iYWxMaWJyYXJpZXMgPSByZXF1aXJlKCAnLi4vY29tbW9uL3dlYnBhY2tHbG9iYWxMaWJyYXJpZXMnICk7XHJcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG5jb25zdCBwYXRoID0gcmVxdWlyZSggJ3BhdGgnICk7XHJcbmNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xyXG5jb25zdCB3ZWJwYWNrID0gcmVxdWlyZSggJ3dlYnBhY2snICk7XHJcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZXF1aXJlLXN0YXRlbWVudC1tYXRjaFxyXG5jb25zdCB7IE1vZGlmeVNvdXJjZVBsdWdpbiwgQ29uY2F0T3BlcmF0aW9uIH0gPSByZXF1aXJlKCAnbW9kaWZ5LXNvdXJjZS13ZWJwYWNrLXBsdWdpbicgKTtcclxuXHJcbmNvbnN0IGFjdGl2ZVJlcG9zID0gZnMucmVhZEZpbGVTeW5jKCBwYXRoLnJlc29sdmUoIF9fZGlybmFtZSwgJy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9kYXRhL2FjdGl2ZS1yZXBvcycgKSwgJ3V0Zi04JyApLnRyaW0oKS5zcGxpdCggL1xccj9cXG4vICkubWFwKCBzID0+IHMudHJpbSgpICk7XHJcbmNvbnN0IHJlcG9zQnlOYW1lc3BhY2UgPSB7fTtcclxuY29uc3QgYWxpYXNlcyA9IHt9O1xyXG5cclxuZm9yICggY29uc3QgcmVwbyBvZiBhY3RpdmVSZXBvcyApIHtcclxuICBjb25zdCBwYWNrYWdlRmlsZSA9IHBhdGgucmVzb2x2ZSggX19kaXJuYW1lLCBgLi4vLi4vLi4vJHtyZXBvfS9wYWNrYWdlLmpzb25gICk7XHJcbiAgaWYgKCBmcy5leGlzdHNTeW5jKCBwYWNrYWdlRmlsZSApICkge1xyXG4gICAgY29uc3QgcGFja2FnZU9iamVjdCA9IEpTT04ucGFyc2UoIGZzLnJlYWRGaWxlU3luYyggcGFja2FnZUZpbGUsICd1dGYtOCcgKSApO1xyXG4gICAgaWYgKCBwYWNrYWdlT2JqZWN0LnBoZXQgJiYgcGFja2FnZU9iamVjdC5waGV0LnJlcXVpcmVqc05hbWVzcGFjZSApIHtcclxuICAgICAgcmVwb3NCeU5hbWVzcGFjZVsgcGFja2FnZU9iamVjdC5waGV0LnJlcXVpcmVqc05hbWVzcGFjZSBdID0gcmVwbztcclxuICAgICAgYWxpYXNlc1sgcGFja2FnZU9iamVjdC5waGV0LnJlcXVpcmVqc05hbWVzcGFjZSBdID0gcGF0aC5yZXNvbHZlKCBfX2Rpcm5hbWUsIGAuLi8uLi8uLi8ke3JlcG99JHtyZXBvID09PSAnYnJhbmQnID8gJy9waGV0JyA6ICcnfS9qc2AgKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IGdldE1vZHVsZVJ1bGVzID0gZnVuY3Rpb24gZ2V0TW9kdWxlUnVsZXMoKSB7XHJcbiAgcmV0dXJuIE9iamVjdC5rZXlzKCB3ZWJwYWNrR2xvYmFsTGlicmFyaWVzICkubWFwKCBnbG9iYWxLZXkgPT4ge1xyXG4gICAgcmV0dXJuIHtcclxuXHJcbiAgICAgIC8vIHBhdGguam9pbiB0byBub3JtYWxpemUgb24gdGhlIHJpZ2h0IHBhdGggc2VwYXJhdG9yLCBwZXJoYXBzIHRoZXJlIGlzIGFub3RoZXIgd2F5PyFcclxuICAgICAgdGVzdDogZmlsZU5hbWUgPT4gZmlsZU5hbWUuaW5jbHVkZXMoIHBhdGguam9pbiggd2VicGFja0dsb2JhbExpYnJhcmllc1sgZ2xvYmFsS2V5IF0gKSApLFxyXG4gICAgICBsb2FkZXI6ICcuLi9jaGlwcGVyL25vZGVfbW9kdWxlcy9leHBvc2UtbG9hZGVyJyxcclxuICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgIGV4cG9zZXM6IGdsb2JhbEtleVxyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH0gKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb252ZXJ0IGFic29sdXRlIHBhdGhzIG9mIG1vZHVsZXMgdG8gcmVsYXRpdmUgb25lc1xyXG4gKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBtb2R1bGVzXHJcbiAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn1cclxuICovXHJcbmNvbnN0IGdldFJlbGF0aXZlTW9kdWxlcyA9IG1vZHVsZXMgPT4ge1xyXG4gIGNvbnN0IHJvb3QgPSBwYXRoLnJlc29sdmUoIF9fZGlybmFtZSwgJy4uLy4uLy4uLycgKTtcclxuICByZXR1cm4gbW9kdWxlc1xyXG5cclxuICAgIC8vIFdlYnBhY2sgNSByZXBvcnRzIGludGVybWVkaWF0ZSBwYXRocyB3aGljaCBuZWVkIHRvIGJlIGZpbHRlcmVkIG91dFxyXG4gICAgLmZpbHRlciggbSA9PiBmcy5sc3RhdFN5bmMoIG0gKS5pc0ZpbGUoKSApXHJcblxyXG4gICAgLy8gR2V0IHRoZSByZWxhdGl2ZSBwYXRoIHRvIHRoZSByb290LCBsaWtlIFwiam9pc3QvanMvU2ltLmpzXCIgb3IsIG9uIFdpbmRvd3MsIFwiam9pc3RcXGpzXFxTaW0uanNcIlxyXG4gICAgLm1hcCggbSA9PiBwYXRoLnJlbGF0aXZlKCByb290LCBtICkgKVxyXG5cclxuICAgIC8vIFNvbWUgZGV2ZWxvcGVycyBjaGVjayBpbiBhIHBhY2thZ2UuanNvbiB0byB0aGUgcm9vdCBvZiB0aGUgY2hlY2tvdXRzLCBhcyBkZXNjcmliZWQgaW4gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzQ5NCNpc3N1ZWNvbW1lbnQtODIxMjkyNTQyXHJcbiAgICAvLyBsaWtlOiAvVXNlcnMvc2FtcmVpZC9hcGFjaGUtZG9jdW1lbnQtcm9vdC9wYWNrYWdlLmpzb24uIFRoaXMgcG93ZXJzIGdydW50IG9ubHkgYW5kIHNob3VsZCBub3QgYmUgaW5jbHVkZWQgaW4gdGhlIG1vZHVsZXNcclxuICAgIC5maWx0ZXIoIG0gPT4gbSAhPT0gJy4uL3BhY2thZ2UuanNvbicgJiYgbSAhPT0gJy4uXFxcXHBhY2thZ2UuanNvbicgKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSdW5zIHdlYnBhY2sgLSBETyBOT1QgUlVOIE1VTFRJUExFIENPTkNVUlJFTlRMWVxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBicmFuZFxyXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxzdHJpbmc+fSAtIFRoZSBjb21iaW5lZCBKUyBvdXRwdXQgZnJvbSB0aGUgcHJvY2Vzc1xyXG4gKi9cclxuY29uc3Qgd2VicGFja0J1aWxkID0gZnVuY3Rpb24gd2VicGFja0J1aWxkKCByZXBvLCBicmFuZCwgb3B0aW9ucyApIHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoICggcmVzb2x2ZSwgcmVqZWN0ICkgPT4ge1xyXG5cclxuICAgIG9wdGlvbnMgPSBfLm1lcmdlKCB7XHJcbiAgICAgIG91dHB1dERpcjogcmVwb1xyXG4gICAgfSwgb3B0aW9ucyApO1xyXG5cclxuICAgIGNvbnN0IG91dHB1dERpciA9IHBhdGgucmVzb2x2ZSggX19kaXJuYW1lLCBgLi4vLi4vJHtDaGlwcGVyQ29uc3RhbnRzLkJVSUxEX0RJUn1gLCBvcHRpb25zLm91dHB1dERpciApO1xyXG4gICAgY29uc3Qgb3V0cHV0RmlsZU5hbWUgPSBgJHtyZXBvfS5qc2A7XHJcbiAgICBjb25zdCBvdXRwdXRQYXRoID0gcGF0aC5yZXNvbHZlKCBvdXRwdXREaXIsIG91dHB1dEZpbGVOYW1lICk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIHBsdWdpbnMgdG8gaWdub3JlIGJyYW5kcyB0aGF0IHdlIGFyZSBub3QgYnVpbGRpbmcgYXQgdGhpcyB0aW1lLiBIZXJlIFwicmVzb3VyY2VcIiBpcyB0aGUgbW9kdWxlIGdldHRpbmdcclxuICAgIC8vIGltcG9ydGVkLCBhbmQgXCJjb250ZXh0XCIgaXMgdGhlIGRpcmVjdG9yeSB0aGF0IGhvbGRzIHRoZSBtb2R1bGUgZG9pbmcgdGhlIGltcG9ydGluZy4gVGhpcyBpcyBzcGxpdCB1cCBiZWNhdXNlXHJcbiAgICAvLyBvZiBob3cgYnJhbmRzIGFyZSBsb2FkZWQgaW4gc2ltTGF1bmNoZXIuanMuIFRoZXkgYXJlIGEgZHluYW1pYyBpbXBvcnQgd2hvJ3MgaW1wb3J0IHBhdGggcmVzb2x2ZXMgdG8gdGhlIGN1cnJlbnRcclxuICAgIC8vIGJyYW5kLiBUaGUgd2F5IHRoYXQgd2VicGFjayBidWlsZHMgdGhpcyBpcyBieSBjcmVhdGluZyBhIG1hcCBvZiBhbGwgdGhlIHBvdGVudGlhbCByZXNvdXJjZXMgdGhhdCBjb3VsZCBiZSBsb2FkZWRcclxuICAgIC8vIGJ5IHRoYXQgaW1wb3J0IChieSBsb29raW5nIGF0IHRoZSBmaWxlIHN0cnVjdHVyZSkuIFRodXMgdGhlIGZvbGxvd2luZyByZXNvdXJjZS9jb250ZXh0IHJlZ2V4IHNwbGl0IGlzIGFjY291bnRpbmdcclxuICAgIC8vIGZvciB0aGUgXCJtYXBcIiBjcmVhdGVkIGluIHRoZSBidWlsdCB3ZWJwYWNrIGZpbGUsIGluIHdoaWNoIHRoZSBcInJlc291cmNlXCIgc3RhcnRzIHdpdGggXCIuL3t7YnJhbmR9fVwiIGV2ZW4gdGhvdWdoXHJcbiAgICAvLyB0aGUgc2ltTGF1bmNoZXIgbGluZSBpbmNsdWRlcyB0aGUgcGFyZW50IGRpcmVjdG9yeTogXCJicmFuZC9cIi4gRm9yIG1vcmUgZGV0YWlscyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzg3OVxyXG4gICAgY29uc3QgaWdub3JlUGhldEJyYW5kID0gbmV3IHdlYnBhY2suSWdub3JlUGx1Z2luKCB7IHJlc291cmNlUmVnRXhwOiAvXFwvcGhldFxcLy8sIGNvbnRleHRSZWdFeHA6IC9icmFuZC8gfSApO1xyXG4gICAgY29uc3QgaWdub3JlUGhldGlvQnJhbmQgPSBuZXcgd2VicGFjay5JZ25vcmVQbHVnaW4oIHsgcmVzb3VyY2VSZWdFeHA6IC9cXC9waGV0LWlvXFwvLywgY29udGV4dFJlZ0V4cDogL2JyYW5kLyB9ICk7XHJcbiAgICBjb25zdCBpZ25vcmVBZGFwdGVkRnJvbVBoZXRCcmFuZCA9IG5ldyB3ZWJwYWNrLklnbm9yZVBsdWdpbigge1xyXG4gICAgICByZXNvdXJjZVJlZ0V4cDogL1xcL2FkYXB0ZWQtZnJvbS1waGV0XFwvLyxcclxuICAgICAgY29udGV4dFJlZ0V4cDogL2JyYW5kL1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIEFsbG93IGJ1aWxkcyBmb3IgZGV2ZWxvcGVycyB0aGF0IGRvIG5vdCBoYXZlIHRoZSBwaGV0LWlvIHJlcG8gY2hlY2tlZCBvdXQuIElnbm9yZVBsdWdpbiB3aWxsIHNraXAgYW55IHJlcXVpcmVcclxuICAgIC8vIHRoYXQgbWF0Y2hlcyB0aGUgZm9sbG93aW5nIHJlZ2V4LlxyXG4gICAgY29uc3QgaWdub3JlUGhldGlvUmVwbyA9IG5ldyB3ZWJwYWNrLklnbm9yZVBsdWdpbigge1xyXG4gICAgICByZXNvdXJjZVJlZ0V4cDogL1xcL3BoZXQtaW9cXC8vIC8vIGlnbm9yZSBhbnl0aGluZyBpbiBhIHBoZXQtaW8gbmFtZWQgZGlyZWN0b3J5XHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3QgY29tcGlsZXIgPSB3ZWJwYWNrKCB7XHJcblxyXG4gICAgICBtb2R1bGU6IHtcclxuICAgICAgICBydWxlczogZ2V0TW9kdWxlUnVsZXMoKVxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gV2UgdWdsaWZ5IGFzIGEgc3RlcCBhZnRlciB0aGlzLCB3aXRoIG1hbnkgY3VzdG9tIHJ1bGVzLiBTbyB3ZSBkbyBOT1Qgb3B0aW1pemUgb3IgdWdsaWZ5IGluIHRoaXMgc3RlcC5cclxuICAgICAgb3B0aW1pemF0aW9uOiB7XHJcbiAgICAgICAgbWluaW1pemU6IGZhbHNlXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBTaW11bGF0aW9ucyBvciBydW5uYWJsZXMgd2lsbCBoYXZlIGEgc2luZ2xlIGVudHJ5IHBvaW50XHJcbiAgICAgIGVudHJ5OiB7XHJcbiAgICAgICAgcmVwbzogYC4uL2NoaXBwZXIvZGlzdC9qcy8ke3JlcG99L2pzLyR7cmVwb30tbWFpbi5qc2BcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIFdlIG91dHB1dCBvdXIgYnVpbGRzIHRvIHRoZSBmb2xsb3dpbmcgZGlyXHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIHBhdGg6IG91dHB1dERpcixcclxuICAgICAgICBmaWxlbmFtZTogb3V0cHV0RmlsZU5hbWUsXHJcbiAgICAgICAgaGFzaEZ1bmN0aW9uOiAneHhoYXNoNjQnIC8vIGZvciBOb2RlIDE3Kywgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS93ZWJwYWNrL3dlYnBhY2svaXNzdWVzLzE0NTMyXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyB7QXJyYXkuPFBsdWdpbj59XHJcbiAgICAgIHBsdWdpbnM6IFtcclxuXHJcbiAgICAgICAgLy8gRXhjbHVkZSBicmFuZCBzcGVjaWZpYyBjb2RlLiBUaGlzIGluY2x1ZGVzIGFsbCBvZiB0aGUgYHBoZXQtaW9gIHJlcG8gZm9yIG5vbiBwaGV0LWlvIGJ1aWxkcy5cclxuICAgICAgICAuLi4oIGJyYW5kID09PSAncGhldCcgPyBbIGlnbm9yZVBoZXRpb0JyYW5kLCBpZ25vcmVQaGV0aW9SZXBvLCBpZ25vcmVBZGFwdGVkRnJvbVBoZXRCcmFuZCBdIDpcclxuICAgICAgICAgIGJyYW5kID09PSAncGhldC1pbycgPyBbIGlnbm9yZVBoZXRCcmFuZCwgaWdub3JlQWRhcHRlZEZyb21QaGV0QnJhbmQgXSA6XHJcblxyXG4gICAgICAgICAgICAvLyBhZGFwdGVkLWZyb20tcGhldCBhbmQgYWxsIG90aGVyIGJyYW5kc1xyXG4gICAgICAgICAgICBbIGlnbm9yZVBoZXRCcmFuZCwgaWdub3JlUGhldGlvQnJhbmQsIGlnbm9yZVBoZXRpb1JlcG8gXSApLFxyXG4gICAgICAgIC4uLiggb3B0aW9ucy5wcm9maWxlRmlsZVNpemUgPyBbXHJcbiAgICAgICAgICBuZXcgTW9kaWZ5U291cmNlUGx1Z2luKCB7XHJcbiAgICAgICAgICAgIHJ1bGVzOiBbXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGVzdDogLy4qLyxcclxuICAgICAgICAgICAgICAgIG9wZXJhdGlvbnM6IFtcclxuICAgICAgICAgICAgICAgICAgbmV3IENvbmNhdE9wZXJhdGlvbihcclxuICAgICAgICAgICAgICAgICAgICAnc3RhcnQnLFxyXG4gICAgICAgICAgICAgICAgICAgICdjb25zb2xlLmxvZyhcXCdTVEFSVF9NT0RVTEVcXCcsXFwnJEZJTEVfUEFUSFxcJyk7XFxuXFxuJ1xyXG4gICAgICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAgICAgICBuZXcgQ29uY2F0T3BlcmF0aW9uKFxyXG4gICAgICAgICAgICAgICAgICAgICdlbmQnLFxyXG4gICAgICAgICAgICAgICAgICAgICdcXG5cXG5jb25zb2xlLmxvZyhcXCdFTkRfTU9EVUxFXFwnLFxcJyRGSUxFX1BBVEhcXCcpO1xcblxcbidcclxuICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICAgfSApXHJcbiAgICAgICAgXSA6IFtdIClcclxuICAgICAgXVxyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbXBpbGVyLnJ1biggKCBlcnIsIHN0YXRzICkgPT4ge1xyXG4gICAgICBpZiAoIGVyciB8fCBzdGF0cy5oYXNFcnJvcnMoKSApIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCAnV2VicGFjayBidWlsZCBlcnJvcnM6Jywgc3RhdHMuY29tcGlsYXRpb24uZXJyb3JzICk7XHJcbiAgICAgICAgcmVqZWN0KCBlcnIgfHwgc3RhdHMuY29tcGlsYXRpb24uZXJyb3JzWyAwIF0gKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBjb25zdCBqc0ZpbGUgPSBvdXRwdXRQYXRoO1xyXG4gICAgICAgIGNvbnN0IGpzID0gZnMucmVhZEZpbGVTeW5jKCBqc0ZpbGUsICd1dGYtOCcgKTtcclxuXHJcbiAgICAgICAgZnMudW5saW5rU3luYygganNGaWxlICk7XHJcblxyXG4gICAgICAgIHJlc29sdmUoIHtcclxuICAgICAgICAgIGpzOiBqcyxcclxuICAgICAgICAgIHVzZWRNb2R1bGVzOiBnZXRSZWxhdGl2ZU1vZHVsZXMoIEFycmF5LmZyb20oIHN0YXRzLmNvbXBpbGF0aW9uLmZpbGVEZXBlbmRlbmNpZXMgKSApXHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgfSApO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB3ZWJwYWNrQnVpbGQ7XHJcbndlYnBhY2tCdWlsZC5nZXRNb2R1bGVSdWxlcyA9IGdldE1vZHVsZVJ1bGVzOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBRUE7QUFDQTtB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