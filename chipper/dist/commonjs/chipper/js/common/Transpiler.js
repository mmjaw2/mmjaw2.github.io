"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// Copyright 2021-2024, University of Colorado Boulder

/**
 * Transpiles *.ts and copies all *.js files to chipper/dist. Does not do type checking. Filters based on
 * perennial-alias/active-repos and subsets of directories within repos (such as js/, images/, and sounds/).
 *
 * Additionally, will transpile *.wgsl files to *.js files.
 *
 * To support the browser and node.js, we output two modes:
 * 1. 'js' outputs to chipper/dist/js - import statements, can be launched in the browser
 * 2. 'commonjs' outputs to chipper/dist/commonjs - require/module.exports, can be used in node.js
 *
 * grunt is constrained to use require statements, so that is why we must support the commonjs mode.
 *
 * See transpile.js for the CLI usage
 *
 *  @author Sam Reid (PhET Interactive Simulations)
 */

// TODO: Move to perennial-alias, see https://github.com/phetsims/chipper/issues/1437. Does this mean we will have perennial-alias/dist? Be careful not to create perennial/dist too.

// imports
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var CacheLayer = require('./CacheLayer');
var wgslMinify = require('./wgslMinify');
var wgslPreprocess = require('./wgslPreprocess');
var wgslStripComments = require('./wgslStripComments');
var webpackGlobalLibraries = require('./webpackGlobalLibraries');
var core = require('@babel/core');
var assert = require('assert');
var _ = require('lodash');

// Cache status is stored in chipper/dist so if you wipe chipper/dist you also wipe the cache
var statusPath = '../chipper/dist/js-cache-status.json';
var root = '..' + path.sep;

// Directories in a sim repo that may contain things for transpilation
// This is used for a top-down search in the initial transpilation and for filtering relevant files in the watch process
// TODO: Subdirs may be different for commonjs/perennial/chipper, see https://github.com/phetsims/chipper/issues/1437
// TODO: Add chipper/test chipper/eslint chipper/templates and perennial/test at a minimum, see https://github.com/phetsims/chipper/issues/1437
var subdirs = ['js', 'images', 'mipmaps', 'sounds', 'shaders', 'common', 'wgsl',
// phet-io-sim-specific has nonstandard directory structure
'repos'];
var getActiveRepos = function getActiveRepos() {
  return fs.readFileSync('../perennial-alias/data/active-repos', 'utf8').trim().split('\n').map(function (sim) {
    return sim.trim();
  });
};
var getModesForRepo = function getModesForRepo(repo) {
  var dualRepos = ['chipper', 'perennial-alias', 'perennial', 'phet-core'];
  if (dualRepos.includes(repo)) {
    return ['js', 'commonjs'];
  } else {
    return ['js'];
  }
};

/**
 * Get a cache status key for the file path and mode
 * @param filePath
 * @param mode 'js' or 'commonjs'
 * @returns {string}
 */
var getStatusKey = function getStatusKey(filePath, mode) {
  return filePath + (mode === 'js' ? '@js' : '@commonjs');
};
var Transpiler = /*#__PURE__*/function () {
  function Transpiler(options) {
    var _this = this;
    _classCallCheck(this, Transpiler);
    options = _.assignIn({
      clean: false,
      // delete the previous state/cache file, and create a new one.
      verbose: false,
      // Add extra logging
      silent: false,
      // hide all logging but error reporting, include any specified with verbose
      repos: [],
      // {string[]} additional repos to be transpiled (beyond those listed in perennial-alias/data/active-repos)
      brands: [],
      // {sting[]} additional brands to visit in the brand repo
      minifyWGSL: false
    }, options);

    // @private
    this.verbose = options.verbose;
    this.silent = options.silent;
    this.repos = options.repos;
    this.brands = options.brands;
    this.minifyWGSL = options.minifyWGSL;

    // Track the status of each repo. Key= repo, value=md5 hash of contents
    this.status = {};

    // Handle the case where programs want to handle this itself and do something before exiting.
    if (!global.processEventOptOut) {
      // Exit on Ctrl + C case, but make sure to save the cache
      process.on('SIGINT', function () {
        _this.saveCache();
        process.exit();
      });
    }

    // Make sure a directory exists for the cached status file
    fs.mkdirSync(path.dirname(statusPath), {
      recursive: true
    });
    if (options.clean) {
      !this.silent && console.log('cleaning...');
      fs.writeFileSync(statusPath, JSON.stringify({}, null, 2));
    }

    // Load cached status
    try {
      this.status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    } catch (e) {
      !this.silent && console.log('couldn\'t parse status cache, making a clean one');
      this.status = {};
      fs.writeFileSync(statusPath, JSON.stringify(this.status, null, 2));
    }

    // Use the same implementation as getRepoList, but we need to read from perennial-alias since chipper should not
    // depend on perennial.
    this.activeRepos = getActiveRepos();
  }

  /**
   * Returns the path in chipper/dist that corresponds to a source file.
   * @param filename
   * @param mode - 'js' or 'commonjs'
   * @returns {string}
   * @private
   */
  return _createClass(Transpiler, [{
    key: "transpileFunction",
    value:
    /**
     * Transpile the file (using babel for JS/TS), and write it to the corresponding location in chipper/dist
     * @param {string} sourceFile
     * @param {string} targetPath
     * @param {string} text - file text
     * @param {string} mode - 'js' or 'commonjs'
     * @private
     */
    function transpileFunction(sourceFile, targetPath, text, mode) {
      assert(mode === 'js' || mode === 'commonjs', 'invalid mode: ' + mode);
      var js;
      if (sourceFile.endsWith('.wgsl')) {
        var pathToRoot = '../'.repeat(sourceFile.match(/\//g).length - 1);

        // NOTE: Will be able to use wgslMangle in the future?
        // NOTE: We could also potentially feed this through the transform (source-maps wouldn't really be useful)
        js = wgslPreprocess(wgslStripComments(text), this.minifyWGSL ? wgslMinify : function (str) {
          return str;
        }, pathToRoot, targetPath);
      } else {
        js = core.transformSync(text, {
          filename: sourceFile,
          // Load directly from node_modules so we do not have to npm install this dependency
          // in every sim repo.  This strategy is also used in transpile.js
          presets: ['../chipper/node_modules/@babel/preset-typescript', '../chipper/node_modules/@babel/preset-react'].concat(_toConsumableArray(mode === 'js' ? [] : [['../chipper/node_modules/@babel/preset-env', {
            modules: 'commonjs'
          }]])),
          sourceMaps: 'inline',
          plugins: [['../chipper/node_modules/@babel/plugin-proposal-decorators', {
            version: '2022-03'
          }]]
        }).code;

        /**
         * TODO: Generalize this so it can look up the appropriate path for any dependency, see https://github.com/phetsims/chipper/issues/1437
         * This can be accomplished with a babel plugin.
         * Note aqua, perennial, perennial-alias, rosetta and skiffle each require (a possibly different version of) winston
         */
        js = js.split('require(\'winston\')').join('require(\'../../../../../../perennial-alias/node_modules/winston\')');
      }
      fs.mkdirSync(path.dirname(targetPath), {
        recursive: true
      });
      fs.writeFileSync(targetPath, js);
    }

    // @private
  }, {
    key: "pruneStaleDistFiles",
    value:
    // @public.  Delete any files in chipper/dist/js that don't have a corresponding file in the source tree
    function pruneStaleDistFiles(mode) {
      assert(mode === 'js' || mode === 'commonjs', 'invalid mode: ' + mode);
      var startTime = Date.now();
      var start = "../chipper/dist/".concat(mode, "/");
      var visitFile = function visitFile(path) {
        path = Transpiler.forwardSlashify(path);
        assert(path.startsWith(start));
        var tail = path.substring(start.length);
        var correspondingFile = "../".concat(tail);
        var jsTsFile = correspondingFile.split('.js').join('.ts');
        var jsTsxFile = correspondingFile.split('.js').join('.tsx');
        var jsWgslFile = correspondingFile.split('.js').join('.wgsl');
        var mjsTsFile = correspondingFile.split('.mjs').join('.ts');
        var mjsTsxFile = correspondingFile.split('.mjs').join('.tsx');
        if (!fs.existsSync(correspondingFile) && !fs.existsSync(jsTsFile) && !fs.existsSync(jsTsxFile) && !fs.existsSync(jsWgslFile) && !fs.existsSync(mjsTsFile) && !fs.existsSync(mjsTsxFile)) {
          fs.unlinkSync(path);
          console.log('No parent source file for: ' + path + ', deleted.');
        }
      };

      // @private - Recursively visit a directory for files to transpile
      var visitDir = function visitDir(dir) {
        var files = fs.readdirSync(dir);
        files.forEach(function (file) {
          var child = Transpiler.join(dir, file);
          if (fs.lstatSync(child).isDirectory() && fs.existsSync(child)) {
            visitDir(child);
          } else if (fs.existsSync(child) && fs.lstatSync(child).isFile()) {
            visitFile(child);
          }
        });
      };
      if (fs.existsSync(start) && fs.lstatSync(start).isDirectory()) {
        visitDir(start);
      }
      var endTime = Date.now();
      var elapsed = endTime - startTime;
      console.log("Clean stale chipper/dist/".concat(mode, " files finished in ") + elapsed + 'ms');
    }

    // @public join and normalize the paths (forward slashes for ease of search and readability)
  }, {
    key: "visitFileWithMode",
    value:
    /**
     * @param {string} filePath
     * @param {string} mode - 'js' or 'commonjs'
     * @private
     */
    function visitFileWithMode(filePath, mode) {
      assert(mode === 'js' || mode === 'commonjs', 'invalid mode: ' + mode);
      if (_.some(['.js', '.ts', '.tsx', '.wgsl', '.mjs'], function (extension) {
        return filePath.endsWith(extension);
      }) && !this.isPathIgnored(filePath)) {
        var changeDetectedTime = Date.now();
        var text = fs.readFileSync(filePath, 'utf-8');
        var hash = crypto.createHash('md5').update(text).digest('hex');

        // If the file has changed, transpile and update the cache.  We have to choose on the spectrum between safety
        // and performance.  In order to maintain high performance with a low error rate, we only write the transpiled file
        // if (a) the cache is out of date (b) there is no target file at all or (c) if the target file has been modified.
        var targetPath = Transpiler.getTargetPath(filePath, mode);
        var statusKey = getStatusKey(filePath, mode);
        if (!this.status[statusKey] || this.status[statusKey].sourceMD5 !== hash || !fs.existsSync(targetPath) || this.status[statusKey].targetMilliseconds !== Transpiler.modifiedTimeMilliseconds(targetPath)) {
          try {
            var reason = '';
            if (this.verbose) {
              reason = !this.status[statusKey] ? ' (not cached)' : this.status[statusKey].sourceMD5 !== hash ? ' (changed)' : !fs.existsSync(targetPath) ? ' (no target)' : this.status[statusKey].targetMilliseconds !== Transpiler.modifiedTimeMilliseconds(targetPath) ? ' (target modified)' : '???';
            }
            this.transpileFunction(filePath, targetPath, text, mode);
            this.status[statusKey] = {
              sourceMD5: hash,
              targetMilliseconds: Transpiler.modifiedTimeMilliseconds(targetPath)
            };
            fs.writeFileSync(statusPath, JSON.stringify(this.status, null, 2));
            var now = Date.now();
            var nowTimeString = new Date(now).toLocaleTimeString();
            !this.silent && console.log("".concat(nowTimeString, ", ").concat(now - changeDetectedTime, " ms: ").concat(filePath, " ").concat(mode).concat(reason));
          } catch (e) {
            console.log(e);
            console.log('ERROR');
          }
        }
      }
    }

    /**
     * For *.ts and *.js files, checks if they have changed file contents since last transpile.  If so, the
     * file is transpiled.
     * @param {string} filePath
     * @param {string[]} modes - some of 'js','commonjs'
     * @private
     */
  }, {
    key: "visitFile",
    value: function visitFile(filePath, modes) {
      var _this2 = this;
      assert(Array.isArray(modes), 'invalid modes: ' + modes);
      modes.forEach(function (mode) {
        return _this2.visitFileWithMode(filePath, mode);
      });
    }

    // @private - Recursively visit a directory for files to transpile
  }, {
    key: "visitDirectory",
    value: function visitDirectory(dir, modes) {
      var _this3 = this;
      assert(Array.isArray(modes), 'invalid modes: ' + modes);
      if (fs.existsSync(dir)) {
        var files = fs.readdirSync(dir);
        files.forEach(function (file) {
          var child = Transpiler.join(dir, file);
          assert(!child.endsWith('/dist'), 'Invalid path: ' + child + ' should not be in dist directory.');
          if (fs.lstatSync(child).isDirectory()) {
            _this3.visitDirectory(child, modes);
          } else {
            _this3.visitFile(child, modes);
          }
        });
      }
    }

    // @private
  }, {
    key: "isPathIgnored",
    value: function isPathIgnored(filePath) {
      var withForwardSlashes = Transpiler.forwardSlashify(filePath);
      try {
        // ignore directories, just care about individual files
        // Try catch because there can still be a race condition between checking and lstatting. This covers enough cases
        // though to still keep it in.
        if (fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory()) {
          return true;
        }
      } catch (e) {/* ignore please */}
      return withForwardSlashes.includes('/node_modules') || withForwardSlashes.includes('.git/') || withForwardSlashes.includes('/build/') || withForwardSlashes.includes('chipper/dist/') || withForwardSlashes.includes('transpile/cache/status.json') ||
      // Temporary files sometimes saved by the IDE
      withForwardSlashes.endsWith('~') ||
      // eslint cache files
      withForwardSlashes.includes('/chipper/eslint/cache/') || withForwardSlashes.includes('/perennial-alias/logs/') || withForwardSlashes.endsWith('.eslintcache');
    }

    // @private
  }, {
    key: "transpileRepos",
    value:
    /**
     * Transpile the specified repos
     * @param {string[]} repos
     * @public
     */
    function transpileRepos(repos) {
      var _this4 = this;
      assert(Array.isArray(repos), 'repos should be an array');
      repos.forEach(function (repo) {
        return _this4.transpileRepo(repo);
      });
    }

    // @public - Visit all the subdirectories in a repo that need transpilation for the specified modes
  }, {
    key: "transpileRepoWithModes",
    value: function transpileRepoWithModes(repo, modes) {
      var _this5 = this;
      assert(Array.isArray(modes), 'modes should be an array');
      subdirs.forEach(function (subdir) {
        return _this5.visitDirectory(Transpiler.join('..', repo, subdir), modes);
      });
      if (repo === 'sherpa') {
        // Our sims load this as a module rather than a preload, so we must transpile it
        this.visitFile(Transpiler.join('..', repo, 'lib', 'game-up-camera-1.0.0.js'), modes);
        this.visitFile(Transpiler.join('..', repo, 'lib', 'pako-2.0.3.min.js'), modes); // used for phet-io-wrappers tests
        this.visitFile(Transpiler.join('..', repo, 'lib', 'big-6.2.1.mjs'), modes); // for consistent, cross-browser number operations (thanks javascript)
        Object.keys(webpackGlobalLibraries).forEach(function (key) {
          var libraryFilePath = webpackGlobalLibraries[key];
          _this5.visitFile(Transpiler.join.apply(Transpiler, ['..'].concat(_toConsumableArray(libraryFilePath.split('/')))), modes);
        });
      } else if (repo === 'brand') {
        this.visitDirectory(Transpiler.join('..', repo, 'phet'), modes);
        this.visitDirectory(Transpiler.join('..', repo, 'phet-io'), modes);
        this.visitDirectory(Transpiler.join('..', repo, 'adapted-from-phet'), modes);
        this.brands.forEach(function (brand) {
          return _this5.visitDirectory(Transpiler.join('..', repo, brand), modes);
        });
      }
    }

    // @public - Visit all the subdirectories in a repo that need transpilation
  }, {
    key: "transpileRepo",
    value: function transpileRepo(repo) {
      this.transpileRepoWithModes(repo, getModesForRepo(repo));
    }

    // @public
  }, {
    key: "transpileAll",
    value: function transpileAll() {
      this.transpileRepos([].concat(_toConsumableArray(this.activeRepos), _toConsumableArray(this.repos)));
    }

    // @private
  }, {
    key: "saveCache",
    value: function saveCache() {
      fs.writeFileSync(statusPath, JSON.stringify(this.status, null, 2));
    }

    // @public
  }, {
    key: "watch",
    value: function watch() {
      var _this6 = this;
      // Invalidate caches when we start watching
      CacheLayer.updateLastChangedTimestamp();

      // For coordination with CacheLayer, clear the cache while we are not watching for file changes
      // https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
      process.stdin.resume(); //so the program will not close instantly

      function exitHandler(options) {
        // NOTE: this gets called 2x on ctrl-c for unknown reasons
        CacheLayer.clearLastChangedTimestamp();
        if (options && options.exit) {
          if (options.arg) {
            throw options.arg;
          }
          process.exit();
        }
      }

      // do something when app is closing
      process.on('exit', function () {
        return exitHandler();
      });

      // catches ctrl+c event
      process.on('SIGINT', function () {
        return exitHandler({
          exit: true
        });
      });

      // catches "kill pid" (for example: nodemon restart)
      process.on('SIGUSR1', function () {
        return exitHandler({
          exit: true
        });
      });
      process.on('SIGUSR2', function () {
        return exitHandler({
          exit: true
        });
      });

      // catches uncaught exceptions
      process.on('uncaughtException', function (e) {
        return exitHandler({
          arg: e,
          exit: true
        });
      });
      fs.watch('..' + path.sep, {
        recursive: true
      }, function (eventType, filename) {
        var changeDetectedTime = Date.now();
        var filePath = Transpiler.forwardSlashify('..' + path.sep + filename);

        // We observed a null filename on Windows for an unknown reason.
        if (filename === null || _this6.isPathIgnored(filePath)) {
          return;
        }

        // Invalidate cache when any relevant file has changed.
        CacheLayer.updateLastChangedTimestamp();
        var pathExists = fs.existsSync(filePath);
        if (!pathExists) {
          var modes = ['js', 'commonjs'];
          modes.forEach(function (mode) {
            var targetPath = Transpiler.getTargetPath(filePath, mode);
            if (fs.existsSync(targetPath) && fs.lstatSync(targetPath).isFile()) {
              fs.unlinkSync(targetPath);
              var statusKey = getStatusKey(filePath, mode);
              delete _this6.status[statusKey];
              _this6.saveCache();
              var now = Date.now();
              var reason = ' (deleted)';
              !_this6.silent && console.log("".concat(new Date(now).toLocaleTimeString(), ", ").concat(now - changeDetectedTime, " ms: ").concat(filePath).concat(mode).concat(reason));
            }
          });
          return;
        }
        if (filePath.endsWith('perennial-alias/data/active-repos')) {
          var newActiveRepos = getActiveRepos();
          !_this6.silent && console.log('reloaded active repos');
          var newRepos = newActiveRepos.filter(function (repo) {
            return !_this6.activeRepos.includes(repo);
          });

          // Run an initial scan on newly added repos
          newRepos.forEach(function (repo) {
            !_this6.silent && console.log('New repo detected in active-repos, transpiling: ' + repo);
            _this6.transpileRepo(repo);
          });
          _this6.activeRepos = newActiveRepos;
        } else {
          var terms = filename.split(path.sep);
          var myRepo = terms[0];
          if ((_this6.activeRepos.includes(myRepo) || _this6.repos.includes(myRepo)) && subdirs.includes(terms[1]) && pathExists) {
            _this6.visitFile(filePath, getModesForRepo(myRepo));
          }
        }
      });
    }
  }], [{
    key: "getTargetPath",
    value: function getTargetPath(filename, mode) {
      assert(mode === 'js' || mode === 'commonjs', 'invalid mode: ' + mode);
      var relativePath = path.relative(root, filename);
      var suffix = relativePath.substring(relativePath.lastIndexOf('.'));

      // Note: When we upgrade to Node 16, this may no longer be necessary, see https://github.com/phetsims/chipper/issues/1437#issuecomment-1222574593
      // TODO: Get rid of mjs?: https://github.com/phetsims/chipper/issues/1437
      var isMJS = relativePath.endsWith('.mjs');
      var extension = isMJS ? '.mjs' : '.js';
      return Transpiler.join.apply(Transpiler, [root, 'chipper', 'dist', mode].concat(_toConsumableArray(relativePath.split(path.sep)))).split(suffix).join(extension);
    }
  }, {
    key: "modifiedTimeMilliseconds",
    value: function modifiedTimeMilliseconds(file) {
      try {
        return fs.statSync(file).mtime.getTime();
      } catch (e) {
        // If one process is reading the file while another is deleting it, we may get an error here.
        console.log('file not found: ' + file);
        return -1;
      }
    }
  }, {
    key: "join",
    value: function join() {
      return Transpiler.forwardSlashify(path.join.apply(path, arguments));
    }
  }, {
    key: "forwardSlashify",
    value: function forwardSlashify(filePath) {
      return filePath.split('\\').join('/');
    }
  }]);
}();
module.exports = Transpiler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJwYXRoIiwiY3J5cHRvIiwiQ2FjaGVMYXllciIsIndnc2xNaW5pZnkiLCJ3Z3NsUHJlcHJvY2VzcyIsIndnc2xTdHJpcENvbW1lbnRzIiwid2VicGFja0dsb2JhbExpYnJhcmllcyIsImNvcmUiLCJhc3NlcnQiLCJfIiwic3RhdHVzUGF0aCIsInJvb3QiLCJzZXAiLCJzdWJkaXJzIiwiZ2V0QWN0aXZlUmVwb3MiLCJyZWFkRmlsZVN5bmMiLCJ0cmltIiwic3BsaXQiLCJtYXAiLCJzaW0iLCJnZXRNb2Rlc0ZvclJlcG8iLCJyZXBvIiwiZHVhbFJlcG9zIiwiaW5jbHVkZXMiLCJnZXRTdGF0dXNLZXkiLCJmaWxlUGF0aCIsIm1vZGUiLCJUcmFuc3BpbGVyIiwib3B0aW9ucyIsIl90aGlzIiwiX2NsYXNzQ2FsbENoZWNrIiwiYXNzaWduSW4iLCJjbGVhbiIsInZlcmJvc2UiLCJzaWxlbnQiLCJyZXBvcyIsImJyYW5kcyIsIm1pbmlmeVdHU0wiLCJzdGF0dXMiLCJnbG9iYWwiLCJwcm9jZXNzRXZlbnRPcHRPdXQiLCJwcm9jZXNzIiwib24iLCJzYXZlQ2FjaGUiLCJleGl0IiwibWtkaXJTeW5jIiwiZGlybmFtZSIsInJlY3Vyc2l2ZSIsImNvbnNvbGUiLCJsb2ciLCJ3cml0ZUZpbGVTeW5jIiwiSlNPTiIsInN0cmluZ2lmeSIsInBhcnNlIiwiZSIsImFjdGl2ZVJlcG9zIiwiX2NyZWF0ZUNsYXNzIiwia2V5IiwidmFsdWUiLCJ0cmFuc3BpbGVGdW5jdGlvbiIsInNvdXJjZUZpbGUiLCJ0YXJnZXRQYXRoIiwidGV4dCIsImpzIiwiZW5kc1dpdGgiLCJwYXRoVG9Sb290IiwicmVwZWF0IiwibWF0Y2giLCJsZW5ndGgiLCJzdHIiLCJ0cmFuc2Zvcm1TeW5jIiwiZmlsZW5hbWUiLCJwcmVzZXRzIiwiY29uY2F0IiwiX3RvQ29uc3VtYWJsZUFycmF5IiwibW9kdWxlcyIsInNvdXJjZU1hcHMiLCJwbHVnaW5zIiwidmVyc2lvbiIsImNvZGUiLCJqb2luIiwicHJ1bmVTdGFsZURpc3RGaWxlcyIsInN0YXJ0VGltZSIsIkRhdGUiLCJub3ciLCJzdGFydCIsInZpc2l0RmlsZSIsImZvcndhcmRTbGFzaGlmeSIsInN0YXJ0c1dpdGgiLCJ0YWlsIiwic3Vic3RyaW5nIiwiY29ycmVzcG9uZGluZ0ZpbGUiLCJqc1RzRmlsZSIsImpzVHN4RmlsZSIsImpzV2dzbEZpbGUiLCJtanNUc0ZpbGUiLCJtanNUc3hGaWxlIiwiZXhpc3RzU3luYyIsInVubGlua1N5bmMiLCJ2aXNpdERpciIsImRpciIsImZpbGVzIiwicmVhZGRpclN5bmMiLCJmb3JFYWNoIiwiZmlsZSIsImNoaWxkIiwibHN0YXRTeW5jIiwiaXNEaXJlY3RvcnkiLCJpc0ZpbGUiLCJlbmRUaW1lIiwiZWxhcHNlZCIsInZpc2l0RmlsZVdpdGhNb2RlIiwic29tZSIsImV4dGVuc2lvbiIsImlzUGF0aElnbm9yZWQiLCJjaGFuZ2VEZXRlY3RlZFRpbWUiLCJoYXNoIiwiY3JlYXRlSGFzaCIsInVwZGF0ZSIsImRpZ2VzdCIsImdldFRhcmdldFBhdGgiLCJzdGF0dXNLZXkiLCJzb3VyY2VNRDUiLCJ0YXJnZXRNaWxsaXNlY29uZHMiLCJtb2RpZmllZFRpbWVNaWxsaXNlY29uZHMiLCJyZWFzb24iLCJub3dUaW1lU3RyaW5nIiwidG9Mb2NhbGVUaW1lU3RyaW5nIiwibW9kZXMiLCJfdGhpczIiLCJBcnJheSIsImlzQXJyYXkiLCJ2aXNpdERpcmVjdG9yeSIsIl90aGlzMyIsIndpdGhGb3J3YXJkU2xhc2hlcyIsInRyYW5zcGlsZVJlcG9zIiwiX3RoaXM0IiwidHJhbnNwaWxlUmVwbyIsInRyYW5zcGlsZVJlcG9XaXRoTW9kZXMiLCJfdGhpczUiLCJzdWJkaXIiLCJPYmplY3QiLCJrZXlzIiwibGlicmFyeUZpbGVQYXRoIiwiYXBwbHkiLCJicmFuZCIsInRyYW5zcGlsZUFsbCIsIndhdGNoIiwiX3RoaXM2IiwidXBkYXRlTGFzdENoYW5nZWRUaW1lc3RhbXAiLCJzdGRpbiIsInJlc3VtZSIsImV4aXRIYW5kbGVyIiwiY2xlYXJMYXN0Q2hhbmdlZFRpbWVzdGFtcCIsImFyZyIsImV2ZW50VHlwZSIsInBhdGhFeGlzdHMiLCJuZXdBY3RpdmVSZXBvcyIsIm5ld1JlcG9zIiwiZmlsdGVyIiwidGVybXMiLCJteVJlcG8iLCJyZWxhdGl2ZVBhdGgiLCJyZWxhdGl2ZSIsInN1ZmZpeCIsImxhc3RJbmRleE9mIiwiaXNNSlMiLCJzdGF0U3luYyIsIm10aW1lIiwiZ2V0VGltZSIsImFyZ3VtZW50cyIsIm1vZHVsZSIsImV4cG9ydHMiXSwic291cmNlcyI6WyJUcmFuc3BpbGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFRyYW5zcGlsZXMgKi50cyBhbmQgY29waWVzIGFsbCAqLmpzIGZpbGVzIHRvIGNoaXBwZXIvZGlzdC4gRG9lcyBub3QgZG8gdHlwZSBjaGVja2luZy4gRmlsdGVycyBiYXNlZCBvblxyXG4gKiBwZXJlbm5pYWwtYWxpYXMvYWN0aXZlLXJlcG9zIGFuZCBzdWJzZXRzIG9mIGRpcmVjdG9yaWVzIHdpdGhpbiByZXBvcyAoc3VjaCBhcyBqcy8sIGltYWdlcy8sIGFuZCBzb3VuZHMvKS5cclxuICpcclxuICogQWRkaXRpb25hbGx5LCB3aWxsIHRyYW5zcGlsZSAqLndnc2wgZmlsZXMgdG8gKi5qcyBmaWxlcy5cclxuICpcclxuICogVG8gc3VwcG9ydCB0aGUgYnJvd3NlciBhbmQgbm9kZS5qcywgd2Ugb3V0cHV0IHR3byBtb2RlczpcclxuICogMS4gJ2pzJyBvdXRwdXRzIHRvIGNoaXBwZXIvZGlzdC9qcyAtIGltcG9ydCBzdGF0ZW1lbnRzLCBjYW4gYmUgbGF1bmNoZWQgaW4gdGhlIGJyb3dzZXJcclxuICogMi4gJ2NvbW1vbmpzJyBvdXRwdXRzIHRvIGNoaXBwZXIvZGlzdC9jb21tb25qcyAtIHJlcXVpcmUvbW9kdWxlLmV4cG9ydHMsIGNhbiBiZSB1c2VkIGluIG5vZGUuanNcclxuICpcclxuICogZ3J1bnQgaXMgY29uc3RyYWluZWQgdG8gdXNlIHJlcXVpcmUgc3RhdGVtZW50cywgc28gdGhhdCBpcyB3aHkgd2UgbXVzdCBzdXBwb3J0IHRoZSBjb21tb25qcyBtb2RlLlxyXG4gKlxyXG4gKiBTZWUgdHJhbnNwaWxlLmpzIGZvciB0aGUgQ0xJIHVzYWdlXHJcbiAqXHJcbiAqICBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbi8vIFRPRE86IE1vdmUgdG8gcGVyZW5uaWFsLWFsaWFzLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzE0MzcuIERvZXMgdGhpcyBtZWFuIHdlIHdpbGwgaGF2ZSBwZXJlbm5pYWwtYWxpYXMvZGlzdD8gQmUgY2FyZWZ1bCBub3QgdG8gY3JlYXRlIHBlcmVubmlhbC9kaXN0IHRvby5cclxuXHJcbi8vIGltcG9ydHNcclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCAncGF0aCcgKTtcclxuY29uc3QgY3J5cHRvID0gcmVxdWlyZSggJ2NyeXB0bycgKTtcclxuY29uc3QgQ2FjaGVMYXllciA9IHJlcXVpcmUoICcuL0NhY2hlTGF5ZXInICk7XHJcbmNvbnN0IHdnc2xNaW5pZnkgPSByZXF1aXJlKCAnLi93Z3NsTWluaWZ5JyApO1xyXG5jb25zdCB3Z3NsUHJlcHJvY2VzcyA9IHJlcXVpcmUoICcuL3dnc2xQcmVwcm9jZXNzJyApO1xyXG5jb25zdCB3Z3NsU3RyaXBDb21tZW50cyA9IHJlcXVpcmUoICcuL3dnc2xTdHJpcENvbW1lbnRzJyApO1xyXG5jb25zdCB3ZWJwYWNrR2xvYmFsTGlicmFyaWVzID0gcmVxdWlyZSggJy4vd2VicGFja0dsb2JhbExpYnJhcmllcycgKTtcclxuY29uc3QgY29yZSA9IHJlcXVpcmUoICdAYmFiZWwvY29yZScgKTtcclxuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSggJ2Fzc2VydCcgKTtcclxuY29uc3QgXyA9IHJlcXVpcmUoICdsb2Rhc2gnICk7XHJcblxyXG4vLyBDYWNoZSBzdGF0dXMgaXMgc3RvcmVkIGluIGNoaXBwZXIvZGlzdCBzbyBpZiB5b3Ugd2lwZSBjaGlwcGVyL2Rpc3QgeW91IGFsc28gd2lwZSB0aGUgY2FjaGVcclxuY29uc3Qgc3RhdHVzUGF0aCA9ICcuLi9jaGlwcGVyL2Rpc3QvanMtY2FjaGUtc3RhdHVzLmpzb24nO1xyXG5jb25zdCByb290ID0gJy4uJyArIHBhdGguc2VwO1xyXG5cclxuLy8gRGlyZWN0b3JpZXMgaW4gYSBzaW0gcmVwbyB0aGF0IG1heSBjb250YWluIHRoaW5ncyBmb3IgdHJhbnNwaWxhdGlvblxyXG4vLyBUaGlzIGlzIHVzZWQgZm9yIGEgdG9wLWRvd24gc2VhcmNoIGluIHRoZSBpbml0aWFsIHRyYW5zcGlsYXRpb24gYW5kIGZvciBmaWx0ZXJpbmcgcmVsZXZhbnQgZmlsZXMgaW4gdGhlIHdhdGNoIHByb2Nlc3NcclxuLy8gVE9ETzogU3ViZGlycyBtYXkgYmUgZGlmZmVyZW50IGZvciBjb21tb25qcy9wZXJlbm5pYWwvY2hpcHBlciwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9jaGlwcGVyL2lzc3Vlcy8xNDM3XHJcbi8vIFRPRE86IEFkZCBjaGlwcGVyL3Rlc3QgY2hpcHBlci9lc2xpbnQgY2hpcHBlci90ZW1wbGF0ZXMgYW5kIHBlcmVubmlhbC90ZXN0IGF0IGEgbWluaW11bSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9jaGlwcGVyL2lzc3Vlcy8xNDM3XHJcbmNvbnN0IHN1YmRpcnMgPSBbICdqcycsICdpbWFnZXMnLCAnbWlwbWFwcycsICdzb3VuZHMnLCAnc2hhZGVycycsICdjb21tb24nLCAnd2dzbCcsXHJcblxyXG4gIC8vIHBoZXQtaW8tc2ltLXNwZWNpZmljIGhhcyBub25zdGFuZGFyZCBkaXJlY3Rvcnkgc3RydWN0dXJlXHJcbiAgJ3JlcG9zJyBdO1xyXG5cclxuY29uc3QgZ2V0QWN0aXZlUmVwb3MgPSAoKSA9PiBmcy5yZWFkRmlsZVN5bmMoICcuLi9wZXJlbm5pYWwtYWxpYXMvZGF0YS9hY3RpdmUtcmVwb3MnLCAndXRmOCcgKS50cmltKCkuc3BsaXQoICdcXG4nICkubWFwKCBzaW0gPT4gc2ltLnRyaW0oKSApO1xyXG5cclxuY29uc3QgZ2V0TW9kZXNGb3JSZXBvID0gcmVwbyA9PiB7XHJcbiAgY29uc3QgZHVhbFJlcG9zID0gWyAnY2hpcHBlcicsICdwZXJlbm5pYWwtYWxpYXMnLCAncGVyZW5uaWFsJywgJ3BoZXQtY29yZScgXTtcclxuICBpZiAoIGR1YWxSZXBvcy5pbmNsdWRlcyggcmVwbyApICkge1xyXG4gICAgcmV0dXJuIFsgJ2pzJywgJ2NvbW1vbmpzJyBdO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIHJldHVybiBbICdqcycgXTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IGEgY2FjaGUgc3RhdHVzIGtleSBmb3IgdGhlIGZpbGUgcGF0aCBhbmQgbW9kZVxyXG4gKiBAcGFyYW0gZmlsZVBhdGhcclxuICogQHBhcmFtIG1vZGUgJ2pzJyBvciAnY29tbW9uanMnXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAqL1xyXG5jb25zdCBnZXRTdGF0dXNLZXkgPSAoIGZpbGVQYXRoLCBtb2RlICkgPT4ge1xyXG4gIHJldHVybiBmaWxlUGF0aCArICggbW9kZSA9PT0gJ2pzJyA/ICdAanMnIDogJ0Bjb21tb25qcycgKTtcclxufTtcclxuXHJcbmNsYXNzIFRyYW5zcGlsZXIge1xyXG5cclxuICBjb25zdHJ1Y3Rvciggb3B0aW9ucyApIHtcclxuXHJcbiAgICBvcHRpb25zID0gXy5hc3NpZ25Jbigge1xyXG4gICAgICBjbGVhbjogZmFsc2UsIC8vIGRlbGV0ZSB0aGUgcHJldmlvdXMgc3RhdGUvY2FjaGUgZmlsZSwgYW5kIGNyZWF0ZSBhIG5ldyBvbmUuXHJcbiAgICAgIHZlcmJvc2U6IGZhbHNlLCAvLyBBZGQgZXh0cmEgbG9nZ2luZ1xyXG4gICAgICBzaWxlbnQ6IGZhbHNlLCAvLyBoaWRlIGFsbCBsb2dnaW5nIGJ1dCBlcnJvciByZXBvcnRpbmcsIGluY2x1ZGUgYW55IHNwZWNpZmllZCB3aXRoIHZlcmJvc2VcclxuICAgICAgcmVwb3M6IFtdLCAvLyB7c3RyaW5nW119IGFkZGl0aW9uYWwgcmVwb3MgdG8gYmUgdHJhbnNwaWxlZCAoYmV5b25kIHRob3NlIGxpc3RlZCBpbiBwZXJlbm5pYWwtYWxpYXMvZGF0YS9hY3RpdmUtcmVwb3MpXHJcbiAgICAgIGJyYW5kczogW10sIC8vIHtzdGluZ1tdfSBhZGRpdGlvbmFsIGJyYW5kcyB0byB2aXNpdCBpbiB0aGUgYnJhbmQgcmVwb1xyXG4gICAgICBtaW5pZnlXR1NMOiBmYWxzZVxyXG4gICAgfSwgb3B0aW9ucyApO1xyXG5cclxuICAgIC8vIEBwcml2YXRlXHJcbiAgICB0aGlzLnZlcmJvc2UgPSBvcHRpb25zLnZlcmJvc2U7XHJcbiAgICB0aGlzLnNpbGVudCA9IG9wdGlvbnMuc2lsZW50O1xyXG4gICAgdGhpcy5yZXBvcyA9IG9wdGlvbnMucmVwb3M7XHJcbiAgICB0aGlzLmJyYW5kcyA9IG9wdGlvbnMuYnJhbmRzO1xyXG4gICAgdGhpcy5taW5pZnlXR1NMID0gb3B0aW9ucy5taW5pZnlXR1NMO1xyXG5cclxuICAgIC8vIFRyYWNrIHRoZSBzdGF0dXMgb2YgZWFjaCByZXBvLiBLZXk9IHJlcG8sIHZhbHVlPW1kNSBoYXNoIG9mIGNvbnRlbnRzXHJcbiAgICB0aGlzLnN0YXR1cyA9IHt9O1xyXG5cclxuICAgIC8vIEhhbmRsZSB0aGUgY2FzZSB3aGVyZSBwcm9ncmFtcyB3YW50IHRvIGhhbmRsZSB0aGlzIGl0c2VsZiBhbmQgZG8gc29tZXRoaW5nIGJlZm9yZSBleGl0aW5nLlxyXG4gICAgaWYgKCAhZ2xvYmFsLnByb2Nlc3NFdmVudE9wdE91dCApIHtcclxuXHJcbiAgICAgIC8vIEV4aXQgb24gQ3RybCArIEMgY2FzZSwgYnV0IG1ha2Ugc3VyZSB0byBzYXZlIHRoZSBjYWNoZVxyXG4gICAgICBwcm9jZXNzLm9uKCAnU0lHSU5UJywgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuc2F2ZUNhY2hlKCk7XHJcbiAgICAgICAgcHJvY2Vzcy5leGl0KCk7XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBNYWtlIHN1cmUgYSBkaXJlY3RvcnkgZXhpc3RzIGZvciB0aGUgY2FjaGVkIHN0YXR1cyBmaWxlXHJcbiAgICBmcy5ta2RpclN5bmMoIHBhdGguZGlybmFtZSggc3RhdHVzUGF0aCApLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9ICk7XHJcblxyXG4gICAgaWYgKCBvcHRpb25zLmNsZWFuICkge1xyXG4gICAgICAhdGhpcy5zaWxlbnQgJiYgY29uc29sZS5sb2coICdjbGVhbmluZy4uLicgKTtcclxuICAgICAgZnMud3JpdGVGaWxlU3luYyggc3RhdHVzUGF0aCwgSlNPTi5zdHJpbmdpZnkoIHt9LCBudWxsLCAyICkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBMb2FkIGNhY2hlZCBzdGF0dXNcclxuICAgIHRyeSB7XHJcbiAgICAgIHRoaXMuc3RhdHVzID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBzdGF0dXNQYXRoLCAndXRmLTgnICkgKTtcclxuICAgIH1cclxuICAgIGNhdGNoKCBlICkge1xyXG4gICAgICAhdGhpcy5zaWxlbnQgJiYgY29uc29sZS5sb2coICdjb3VsZG5cXCd0IHBhcnNlIHN0YXR1cyBjYWNoZSwgbWFraW5nIGEgY2xlYW4gb25lJyApO1xyXG4gICAgICB0aGlzLnN0YXR1cyA9IHt9O1xyXG4gICAgICBmcy53cml0ZUZpbGVTeW5jKCBzdGF0dXNQYXRoLCBKU09OLnN0cmluZ2lmeSggdGhpcy5zdGF0dXMsIG51bGwsIDIgKSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFVzZSB0aGUgc2FtZSBpbXBsZW1lbnRhdGlvbiBhcyBnZXRSZXBvTGlzdCwgYnV0IHdlIG5lZWQgdG8gcmVhZCBmcm9tIHBlcmVubmlhbC1hbGlhcyBzaW5jZSBjaGlwcGVyIHNob3VsZCBub3RcclxuICAgIC8vIGRlcGVuZCBvbiBwZXJlbm5pYWwuXHJcbiAgICB0aGlzLmFjdGl2ZVJlcG9zID0gZ2V0QWN0aXZlUmVwb3MoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHBhdGggaW4gY2hpcHBlci9kaXN0IHRoYXQgY29ycmVzcG9uZHMgdG8gYSBzb3VyY2UgZmlsZS5cclxuICAgKiBAcGFyYW0gZmlsZW5hbWVcclxuICAgKiBAcGFyYW0gbW9kZSAtICdqcycgb3IgJ2NvbW1vbmpzJ1xyXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBzdGF0aWMgZ2V0VGFyZ2V0UGF0aCggZmlsZW5hbWUsIG1vZGUgKSB7XHJcbiAgICBhc3NlcnQoIG1vZGUgPT09ICdqcycgfHwgbW9kZSA9PT0gJ2NvbW1vbmpzJywgJ2ludmFsaWQgbW9kZTogJyArIG1vZGUgKTtcclxuICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHBhdGgucmVsYXRpdmUoIHJvb3QsIGZpbGVuYW1lICk7XHJcbiAgICBjb25zdCBzdWZmaXggPSByZWxhdGl2ZVBhdGguc3Vic3RyaW5nKCByZWxhdGl2ZVBhdGgubGFzdEluZGV4T2YoICcuJyApICk7XHJcblxyXG4gICAgLy8gTm90ZTogV2hlbiB3ZSB1cGdyYWRlIHRvIE5vZGUgMTYsIHRoaXMgbWF5IG5vIGxvbmdlciBiZSBuZWNlc3NhcnksIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvMTQzNyNpc3N1ZWNvbW1lbnQtMTIyMjU3NDU5M1xyXG4gICAgLy8gVE9ETzogR2V0IHJpZCBvZiBtanM/OiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvMTQzN1xyXG4gICAgY29uc3QgaXNNSlMgPSByZWxhdGl2ZVBhdGguZW5kc1dpdGgoICcubWpzJyApO1xyXG5cclxuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGlzTUpTID8gJy5tanMnIDogJy5qcyc7XHJcbiAgICByZXR1cm4gVHJhbnNwaWxlci5qb2luKCByb290LCAnY2hpcHBlcicsICdkaXN0JywgbW9kZSwgLi4ucmVsYXRpdmVQYXRoLnNwbGl0KCBwYXRoLnNlcCApICkuc3BsaXQoIHN1ZmZpeCApLmpvaW4oIGV4dGVuc2lvbiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJhbnNwaWxlIHRoZSBmaWxlICh1c2luZyBiYWJlbCBmb3IgSlMvVFMpLCBhbmQgd3JpdGUgaXQgdG8gdGhlIGNvcnJlc3BvbmRpbmcgbG9jYXRpb24gaW4gY2hpcHBlci9kaXN0XHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNvdXJjZUZpbGVcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFyZ2V0UGF0aFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gZmlsZSB0ZXh0XHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1vZGUgLSAnanMnIG9yICdjb21tb25qcydcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIHRyYW5zcGlsZUZ1bmN0aW9uKCBzb3VyY2VGaWxlLCB0YXJnZXRQYXRoLCB0ZXh0LCBtb2RlICkge1xyXG4gICAgYXNzZXJ0KCBtb2RlID09PSAnanMnIHx8IG1vZGUgPT09ICdjb21tb25qcycsICdpbnZhbGlkIG1vZGU6ICcgKyBtb2RlICk7XHJcbiAgICBsZXQganM7XHJcbiAgICBpZiAoIHNvdXJjZUZpbGUuZW5kc1dpdGgoICcud2dzbCcgKSApIHtcclxuICAgICAgY29uc3QgcGF0aFRvUm9vdCA9ICcuLi8nLnJlcGVhdCggc291cmNlRmlsZS5tYXRjaCggL1xcLy9nICkubGVuZ3RoIC0gMSApO1xyXG5cclxuICAgICAgLy8gTk9URTogV2lsbCBiZSBhYmxlIHRvIHVzZSB3Z3NsTWFuZ2xlIGluIHRoZSBmdXR1cmU/XHJcbiAgICAgIC8vIE5PVEU6IFdlIGNvdWxkIGFsc28gcG90ZW50aWFsbHkgZmVlZCB0aGlzIHRocm91Z2ggdGhlIHRyYW5zZm9ybSAoc291cmNlLW1hcHMgd291bGRuJ3QgcmVhbGx5IGJlIHVzZWZ1bClcclxuICAgICAganMgPSB3Z3NsUHJlcHJvY2Vzcyggd2dzbFN0cmlwQ29tbWVudHMoIHRleHQgKSwgdGhpcy5taW5pZnlXR1NMID8gd2dzbE1pbmlmeSA6IHN0ciA9PiBzdHIsIHBhdGhUb1Jvb3QsIHRhcmdldFBhdGggKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBqcyA9IGNvcmUudHJhbnNmb3JtU3luYyggdGV4dCwge1xyXG4gICAgICAgIGZpbGVuYW1lOiBzb3VyY2VGaWxlLFxyXG5cclxuICAgICAgICAvLyBMb2FkIGRpcmVjdGx5IGZyb20gbm9kZV9tb2R1bGVzIHNvIHdlIGRvIG5vdCBoYXZlIHRvIG5wbSBpbnN0YWxsIHRoaXMgZGVwZW5kZW5jeVxyXG4gICAgICAgIC8vIGluIGV2ZXJ5IHNpbSByZXBvLiAgVGhpcyBzdHJhdGVneSBpcyBhbHNvIHVzZWQgaW4gdHJhbnNwaWxlLmpzXHJcbiAgICAgICAgcHJlc2V0czogW1xyXG4gICAgICAgICAgJy4uL2NoaXBwZXIvbm9kZV9tb2R1bGVzL0BiYWJlbC9wcmVzZXQtdHlwZXNjcmlwdCcsXHJcbiAgICAgICAgICAnLi4vY2hpcHBlci9ub2RlX21vZHVsZXMvQGJhYmVsL3ByZXNldC1yZWFjdCcsXHJcbiAgICAgICAgICAuLi4oIG1vZGUgPT09ICdqcycgPyBbXSA6IFsgWyAnLi4vY2hpcHBlci9ub2RlX21vZHVsZXMvQGJhYmVsL3ByZXNldC1lbnYnLCB7IG1vZHVsZXM6ICdjb21tb25qcycgfSBdIF0gKVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgc291cmNlTWFwczogJ2lubGluZScsXHJcblxyXG4gICAgICAgIHBsdWdpbnM6IFtcclxuICAgICAgICAgIFsgJy4uL2NoaXBwZXIvbm9kZV9tb2R1bGVzL0BiYWJlbC9wbHVnaW4tcHJvcG9zYWwtZGVjb3JhdG9ycycsIHsgdmVyc2lvbjogJzIwMjItMDMnIH0gXVxyXG4gICAgICAgIF1cclxuICAgICAgfSApLmNvZGU7XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogVE9ETzogR2VuZXJhbGl6ZSB0aGlzIHNvIGl0IGNhbiBsb29rIHVwIHRoZSBhcHByb3ByaWF0ZSBwYXRoIGZvciBhbnkgZGVwZW5kZW5jeSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9jaGlwcGVyL2lzc3Vlcy8xNDM3XHJcbiAgICAgICAqIFRoaXMgY2FuIGJlIGFjY29tcGxpc2hlZCB3aXRoIGEgYmFiZWwgcGx1Z2luLlxyXG4gICAgICAgKiBOb3RlIGFxdWEsIHBlcmVubmlhbCwgcGVyZW5uaWFsLWFsaWFzLCByb3NldHRhIGFuZCBza2lmZmxlIGVhY2ggcmVxdWlyZSAoYSBwb3NzaWJseSBkaWZmZXJlbnQgdmVyc2lvbiBvZikgd2luc3RvblxyXG4gICAgICAgKi9cclxuICAgICAganMgPSBqcy5zcGxpdCggJ3JlcXVpcmUoXFwnd2luc3RvblxcJyknICkuam9pbiggJ3JlcXVpcmUoXFwnLi4vLi4vLi4vLi4vLi4vLi4vcGVyZW5uaWFsLWFsaWFzL25vZGVfbW9kdWxlcy93aW5zdG9uXFwnKScgKTtcclxuICAgIH1cclxuXHJcbiAgICBmcy5ta2RpclN5bmMoIHBhdGguZGlybmFtZSggdGFyZ2V0UGF0aCApLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9ICk7XHJcbiAgICBmcy53cml0ZUZpbGVTeW5jKCB0YXJnZXRQYXRoLCBqcyApO1xyXG4gIH1cclxuXHJcbiAgLy8gQHByaXZhdGVcclxuICBzdGF0aWMgbW9kaWZpZWRUaW1lTWlsbGlzZWNvbmRzKCBmaWxlICkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgcmV0dXJuIGZzLnN0YXRTeW5jKCBmaWxlICkubXRpbWUuZ2V0VGltZSgpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2goIGUgKSB7XHJcblxyXG4gICAgICAvLyBJZiBvbmUgcHJvY2VzcyBpcyByZWFkaW5nIHRoZSBmaWxlIHdoaWxlIGFub3RoZXIgaXMgZGVsZXRpbmcgaXQsIHdlIG1heSBnZXQgYW4gZXJyb3IgaGVyZS5cclxuICAgICAgY29uc29sZS5sb2coICdmaWxlIG5vdCBmb3VuZDogJyArIGZpbGUgKTtcclxuICAgICAgcmV0dXJuIC0xO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gQHB1YmxpYy4gIERlbGV0ZSBhbnkgZmlsZXMgaW4gY2hpcHBlci9kaXN0L2pzIHRoYXQgZG9uJ3QgaGF2ZSBhIGNvcnJlc3BvbmRpbmcgZmlsZSBpbiB0aGUgc291cmNlIHRyZWVcclxuICBwcnVuZVN0YWxlRGlzdEZpbGVzKCBtb2RlICkge1xyXG4gICAgYXNzZXJ0KCBtb2RlID09PSAnanMnIHx8IG1vZGUgPT09ICdjb21tb25qcycsICdpbnZhbGlkIG1vZGU6ICcgKyBtb2RlICk7XHJcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xyXG5cclxuICAgIGNvbnN0IHN0YXJ0ID0gYC4uL2NoaXBwZXIvZGlzdC8ke21vZGV9L2A7XHJcblxyXG4gICAgY29uc3QgdmlzaXRGaWxlID0gcGF0aCA9PiB7XHJcbiAgICAgIHBhdGggPSBUcmFuc3BpbGVyLmZvcndhcmRTbGFzaGlmeSggcGF0aCApO1xyXG4gICAgICBhc3NlcnQoIHBhdGguc3RhcnRzV2l0aCggc3RhcnQgKSApO1xyXG4gICAgICBjb25zdCB0YWlsID0gcGF0aC5zdWJzdHJpbmcoIHN0YXJ0Lmxlbmd0aCApO1xyXG5cclxuICAgICAgY29uc3QgY29ycmVzcG9uZGluZ0ZpbGUgPSBgLi4vJHt0YWlsfWA7XHJcbiAgICAgIGNvbnN0IGpzVHNGaWxlID0gY29ycmVzcG9uZGluZ0ZpbGUuc3BsaXQoICcuanMnICkuam9pbiggJy50cycgKTtcclxuICAgICAgY29uc3QganNUc3hGaWxlID0gY29ycmVzcG9uZGluZ0ZpbGUuc3BsaXQoICcuanMnICkuam9pbiggJy50c3gnICk7XHJcbiAgICAgIGNvbnN0IGpzV2dzbEZpbGUgPSBjb3JyZXNwb25kaW5nRmlsZS5zcGxpdCggJy5qcycgKS5qb2luKCAnLndnc2wnICk7XHJcbiAgICAgIGNvbnN0IG1qc1RzRmlsZSA9IGNvcnJlc3BvbmRpbmdGaWxlLnNwbGl0KCAnLm1qcycgKS5qb2luKCAnLnRzJyApO1xyXG4gICAgICBjb25zdCBtanNUc3hGaWxlID0gY29ycmVzcG9uZGluZ0ZpbGUuc3BsaXQoICcubWpzJyApLmpvaW4oICcudHN4JyApO1xyXG4gICAgICBpZiAoICFmcy5leGlzdHNTeW5jKCBjb3JyZXNwb25kaW5nRmlsZSApICYmXHJcbiAgICAgICAgICAgIWZzLmV4aXN0c1N5bmMoIGpzVHNGaWxlICkgJiYgIWZzLmV4aXN0c1N5bmMoIGpzVHN4RmlsZSApICYmICFmcy5leGlzdHNTeW5jKCBqc1dnc2xGaWxlICkgJiZcclxuICAgICAgICAgICAhZnMuZXhpc3RzU3luYyggbWpzVHNGaWxlICkgJiYgIWZzLmV4aXN0c1N5bmMoIG1qc1RzeEZpbGUgKVxyXG4gICAgICApIHtcclxuICAgICAgICBmcy51bmxpbmtTeW5jKCBwYXRoICk7XHJcbiAgICAgICAgY29uc29sZS5sb2coICdObyBwYXJlbnQgc291cmNlIGZpbGUgZm9yOiAnICsgcGF0aCArICcsIGRlbGV0ZWQuJyApO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEBwcml2YXRlIC0gUmVjdXJzaXZlbHkgdmlzaXQgYSBkaXJlY3RvcnkgZm9yIGZpbGVzIHRvIHRyYW5zcGlsZVxyXG4gICAgY29uc3QgdmlzaXREaXIgPSBkaXIgPT4ge1xyXG4gICAgICBjb25zdCBmaWxlcyA9IGZzLnJlYWRkaXJTeW5jKCBkaXIgKTtcclxuICAgICAgZmlsZXMuZm9yRWFjaCggZmlsZSA9PiB7XHJcbiAgICAgICAgY29uc3QgY2hpbGQgPSBUcmFuc3BpbGVyLmpvaW4oIGRpciwgZmlsZSApO1xyXG4gICAgICAgIGlmICggZnMubHN0YXRTeW5jKCBjaGlsZCApLmlzRGlyZWN0b3J5KCkgJiYgZnMuZXhpc3RzU3luYyggY2hpbGQgKSApIHtcclxuICAgICAgICAgIHZpc2l0RGlyKCBjaGlsZCApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggZnMuZXhpc3RzU3luYyggY2hpbGQgKSAmJiBmcy5sc3RhdFN5bmMoIGNoaWxkICkuaXNGaWxlKCkgKSB7XHJcbiAgICAgICAgICB2aXNpdEZpbGUoIGNoaWxkICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIGlmICggZnMuZXhpc3RzU3luYyggc3RhcnQgKSAmJiBmcy5sc3RhdFN5bmMoIHN0YXJ0ICkuaXNEaXJlY3RvcnkoKSApIHtcclxuICAgICAgdmlzaXREaXIoIHN0YXJ0ICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZW5kVGltZSA9IERhdGUubm93KCk7XHJcbiAgICBjb25zdCBlbGFwc2VkID0gZW5kVGltZSAtIHN0YXJ0VGltZTtcclxuICAgIGNvbnNvbGUubG9nKCBgQ2xlYW4gc3RhbGUgY2hpcHBlci9kaXN0LyR7bW9kZX0gZmlsZXMgZmluaXNoZWQgaW4gYCArIGVsYXBzZWQgKyAnbXMnICk7XHJcbiAgfVxyXG5cclxuICAvLyBAcHVibGljIGpvaW4gYW5kIG5vcm1hbGl6ZSB0aGUgcGF0aHMgKGZvcndhcmQgc2xhc2hlcyBmb3IgZWFzZSBvZiBzZWFyY2ggYW5kIHJlYWRhYmlsaXR5KVxyXG4gIHN0YXRpYyBqb2luKCAuLi5wYXRocyApIHtcclxuICAgIHJldHVybiBUcmFuc3BpbGVyLmZvcndhcmRTbGFzaGlmeSggcGF0aC5qb2luKCAuLi5wYXRocyApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZVBhdGhcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbW9kZSAtICdqcycgb3IgJ2NvbW1vbmpzJ1xyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgdmlzaXRGaWxlV2l0aE1vZGUoIGZpbGVQYXRoLCBtb2RlICkge1xyXG4gICAgYXNzZXJ0KCBtb2RlID09PSAnanMnIHx8IG1vZGUgPT09ICdjb21tb25qcycsICdpbnZhbGlkIG1vZGU6ICcgKyBtb2RlICk7XHJcbiAgICBpZiAoIF8uc29tZSggWyAnLmpzJywgJy50cycsICcudHN4JywgJy53Z3NsJywgJy5tanMnIF0sIGV4dGVuc2lvbiA9PiBmaWxlUGF0aC5lbmRzV2l0aCggZXh0ZW5zaW9uICkgKSAmJlxyXG4gICAgICAgICAhdGhpcy5pc1BhdGhJZ25vcmVkKCBmaWxlUGF0aCApICkge1xyXG5cclxuICAgICAgY29uc3QgY2hhbmdlRGV0ZWN0ZWRUaW1lID0gRGF0ZS5ub3coKTtcclxuICAgICAgY29uc3QgdGV4dCA9IGZzLnJlYWRGaWxlU3luYyggZmlsZVBhdGgsICd1dGYtOCcgKTtcclxuICAgICAgY29uc3QgaGFzaCA9IGNyeXB0by5jcmVhdGVIYXNoKCAnbWQ1JyApLnVwZGF0ZSggdGV4dCApLmRpZ2VzdCggJ2hleCcgKTtcclxuXHJcbiAgICAgIC8vIElmIHRoZSBmaWxlIGhhcyBjaGFuZ2VkLCB0cmFuc3BpbGUgYW5kIHVwZGF0ZSB0aGUgY2FjaGUuICBXZSBoYXZlIHRvIGNob29zZSBvbiB0aGUgc3BlY3RydW0gYmV0d2VlbiBzYWZldHlcclxuICAgICAgLy8gYW5kIHBlcmZvcm1hbmNlLiAgSW4gb3JkZXIgdG8gbWFpbnRhaW4gaGlnaCBwZXJmb3JtYW5jZSB3aXRoIGEgbG93IGVycm9yIHJhdGUsIHdlIG9ubHkgd3JpdGUgdGhlIHRyYW5zcGlsZWQgZmlsZVxyXG4gICAgICAvLyBpZiAoYSkgdGhlIGNhY2hlIGlzIG91dCBvZiBkYXRlIChiKSB0aGVyZSBpcyBubyB0YXJnZXQgZmlsZSBhdCBhbGwgb3IgKGMpIGlmIHRoZSB0YXJnZXQgZmlsZSBoYXMgYmVlbiBtb2RpZmllZC5cclxuICAgICAgY29uc3QgdGFyZ2V0UGF0aCA9IFRyYW5zcGlsZXIuZ2V0VGFyZ2V0UGF0aCggZmlsZVBhdGgsIG1vZGUgKTtcclxuXHJcbiAgICAgIGNvbnN0IHN0YXR1c0tleSA9IGdldFN0YXR1c0tleSggZmlsZVBhdGgsIG1vZGUgKTtcclxuXHJcbiAgICAgIGlmIChcclxuICAgICAgICAhdGhpcy5zdGF0dXNbIHN0YXR1c0tleSBdIHx8XHJcbiAgICAgICAgdGhpcy5zdGF0dXNbIHN0YXR1c0tleSBdLnNvdXJjZU1ENSAhPT0gaGFzaCB8fFxyXG4gICAgICAgICFmcy5leGlzdHNTeW5jKCB0YXJnZXRQYXRoICkgfHxcclxuICAgICAgICB0aGlzLnN0YXR1c1sgc3RhdHVzS2V5IF0udGFyZ2V0TWlsbGlzZWNvbmRzICE9PSBUcmFuc3BpbGVyLm1vZGlmaWVkVGltZU1pbGxpc2Vjb25kcyggdGFyZ2V0UGF0aCApXHJcbiAgICAgICkge1xyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgbGV0IHJlYXNvbiA9ICcnO1xyXG4gICAgICAgICAgaWYgKCB0aGlzLnZlcmJvc2UgKSB7XHJcbiAgICAgICAgICAgIHJlYXNvbiA9ICggIXRoaXMuc3RhdHVzWyBzdGF0dXNLZXkgXSApID8gJyAobm90IGNhY2hlZCknIDpcclxuICAgICAgICAgICAgICAgICAgICAgKCB0aGlzLnN0YXR1c1sgc3RhdHVzS2V5IF0uc291cmNlTUQ1ICE9PSBoYXNoICkgPyAnIChjaGFuZ2VkKScgOlxyXG4gICAgICAgICAgICAgICAgICAgICAoICFmcy5leGlzdHNTeW5jKCB0YXJnZXRQYXRoICkgKSA/ICcgKG5vIHRhcmdldCknIDpcclxuICAgICAgICAgICAgICAgICAgICAgKCB0aGlzLnN0YXR1c1sgc3RhdHVzS2V5IF0udGFyZ2V0TWlsbGlzZWNvbmRzICE9PSBUcmFuc3BpbGVyLm1vZGlmaWVkVGltZU1pbGxpc2Vjb25kcyggdGFyZ2V0UGF0aCApICkgPyAnICh0YXJnZXQgbW9kaWZpZWQpJyA6XHJcbiAgICAgICAgICAgICAgICAgICAgICc/Pz8nO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdGhpcy50cmFuc3BpbGVGdW5jdGlvbiggZmlsZVBhdGgsIHRhcmdldFBhdGgsIHRleHQsIG1vZGUgKTtcclxuXHJcbiAgICAgICAgICB0aGlzLnN0YXR1c1sgc3RhdHVzS2V5IF0gPSB7XHJcbiAgICAgICAgICAgIHNvdXJjZU1ENTogaGFzaCxcclxuICAgICAgICAgICAgdGFyZ2V0TWlsbGlzZWNvbmRzOiBUcmFuc3BpbGVyLm1vZGlmaWVkVGltZU1pbGxpc2Vjb25kcyggdGFyZ2V0UGF0aCApXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgZnMud3JpdGVGaWxlU3luYyggc3RhdHVzUGF0aCwgSlNPTi5zdHJpbmdpZnkoIHRoaXMuc3RhdHVzLCBudWxsLCAyICkgKTtcclxuICAgICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICBjb25zdCBub3dUaW1lU3RyaW5nID0gbmV3IERhdGUoIG5vdyApLnRvTG9jYWxlVGltZVN0cmluZygpO1xyXG5cclxuICAgICAgICAgICF0aGlzLnNpbGVudCAmJiBjb25zb2xlLmxvZyggYCR7bm93VGltZVN0cmluZ30sICR7KCBub3cgLSBjaGFuZ2VEZXRlY3RlZFRpbWUgKX0gbXM6ICR7ZmlsZVBhdGh9ICR7bW9kZX0ke3JlYXNvbn1gICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoKCBlICkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coIGUgKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCAnRVJST1InICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGb3IgKi50cyBhbmQgKi5qcyBmaWxlcywgY2hlY2tzIGlmIHRoZXkgaGF2ZSBjaGFuZ2VkIGZpbGUgY29udGVudHMgc2luY2UgbGFzdCB0cmFuc3BpbGUuICBJZiBzbywgdGhlXHJcbiAgICogZmlsZSBpcyB0cmFuc3BpbGVkLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlUGF0aFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IG1vZGVzIC0gc29tZSBvZiAnanMnLCdjb21tb25qcydcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIHZpc2l0RmlsZSggZmlsZVBhdGgsIG1vZGVzICkge1xyXG4gICAgYXNzZXJ0KCBBcnJheS5pc0FycmF5KCBtb2RlcyApLCAnaW52YWxpZCBtb2RlczogJyArIG1vZGVzICk7XHJcbiAgICBtb2Rlcy5mb3JFYWNoKCBtb2RlID0+IHRoaXMudmlzaXRGaWxlV2l0aE1vZGUoIGZpbGVQYXRoLCBtb2RlICkgKTtcclxuICB9XHJcblxyXG4gIC8vIEBwcml2YXRlIC0gUmVjdXJzaXZlbHkgdmlzaXQgYSBkaXJlY3RvcnkgZm9yIGZpbGVzIHRvIHRyYW5zcGlsZVxyXG4gIHZpc2l0RGlyZWN0b3J5KCBkaXIsIG1vZGVzICkge1xyXG4gICAgYXNzZXJ0KCBBcnJheS5pc0FycmF5KCBtb2RlcyApLCAnaW52YWxpZCBtb2RlczogJyArIG1vZGVzICk7XHJcbiAgICBpZiAoIGZzLmV4aXN0c1N5bmMoIGRpciApICkge1xyXG4gICAgICBjb25zdCBmaWxlcyA9IGZzLnJlYWRkaXJTeW5jKCBkaXIgKTtcclxuICAgICAgZmlsZXMuZm9yRWFjaCggZmlsZSA9PiB7XHJcbiAgICAgICAgY29uc3QgY2hpbGQgPSBUcmFuc3BpbGVyLmpvaW4oIGRpciwgZmlsZSApO1xyXG5cclxuICAgICAgICBhc3NlcnQoICFjaGlsZC5lbmRzV2l0aCggJy9kaXN0JyApLCAnSW52YWxpZCBwYXRoOiAnICsgY2hpbGQgKyAnIHNob3VsZCBub3QgYmUgaW4gZGlzdCBkaXJlY3RvcnkuJyApO1xyXG5cclxuICAgICAgICBpZiAoIGZzLmxzdGF0U3luYyggY2hpbGQgKS5pc0RpcmVjdG9yeSgpICkge1xyXG4gICAgICAgICAgdGhpcy52aXNpdERpcmVjdG9yeSggY2hpbGQsIG1vZGVzICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy52aXNpdEZpbGUoIGNoaWxkLCBtb2RlcyApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gQHByaXZhdGVcclxuICBpc1BhdGhJZ25vcmVkKCBmaWxlUGF0aCApIHtcclxuICAgIGNvbnN0IHdpdGhGb3J3YXJkU2xhc2hlcyA9IFRyYW5zcGlsZXIuZm9yd2FyZFNsYXNoaWZ5KCBmaWxlUGF0aCApO1xyXG5cclxuICAgIHRyeSB7XHJcblxyXG4gICAgICAvLyBpZ25vcmUgZGlyZWN0b3JpZXMsIGp1c3QgY2FyZSBhYm91dCBpbmRpdmlkdWFsIGZpbGVzXHJcbiAgICAgIC8vIFRyeSBjYXRjaCBiZWNhdXNlIHRoZXJlIGNhbiBzdGlsbCBiZSBhIHJhY2UgY29uZGl0aW9uIGJldHdlZW4gY2hlY2tpbmcgYW5kIGxzdGF0dGluZy4gVGhpcyBjb3ZlcnMgZW5vdWdoIGNhc2VzXHJcbiAgICAgIC8vIHRob3VnaCB0byBzdGlsbCBrZWVwIGl0IGluLlxyXG4gICAgICBpZiAoIGZzLmV4aXN0c1N5bmMoIGZpbGVQYXRoICkgJiYgZnMubHN0YXRTeW5jKCBmaWxlUGF0aCApLmlzRGlyZWN0b3J5KCkgKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGNhdGNoKCBlICkgeyAvKiBpZ25vcmUgcGxlYXNlICovIH1cclxuXHJcbiAgICByZXR1cm4gd2l0aEZvcndhcmRTbGFzaGVzLmluY2x1ZGVzKCAnL25vZGVfbW9kdWxlcycgKSB8fFxyXG4gICAgICAgICAgIHdpdGhGb3J3YXJkU2xhc2hlcy5pbmNsdWRlcyggJy5naXQvJyApIHx8XHJcbiAgICAgICAgICAgd2l0aEZvcndhcmRTbGFzaGVzLmluY2x1ZGVzKCAnL2J1aWxkLycgKSB8fFxyXG4gICAgICAgICAgIHdpdGhGb3J3YXJkU2xhc2hlcy5pbmNsdWRlcyggJ2NoaXBwZXIvZGlzdC8nICkgfHxcclxuICAgICAgICAgICB3aXRoRm9yd2FyZFNsYXNoZXMuaW5jbHVkZXMoICd0cmFuc3BpbGUvY2FjaGUvc3RhdHVzLmpzb24nICkgfHxcclxuXHJcbiAgICAgICAgICAgLy8gVGVtcG9yYXJ5IGZpbGVzIHNvbWV0aW1lcyBzYXZlZCBieSB0aGUgSURFXHJcbiAgICAgICAgICAgd2l0aEZvcndhcmRTbGFzaGVzLmVuZHNXaXRoKCAnficgKSB8fFxyXG5cclxuICAgICAgICAgICAvLyBlc2xpbnQgY2FjaGUgZmlsZXNcclxuICAgICAgICAgICB3aXRoRm9yd2FyZFNsYXNoZXMuaW5jbHVkZXMoICcvY2hpcHBlci9lc2xpbnQvY2FjaGUvJyApIHx8XHJcbiAgICAgICAgICAgd2l0aEZvcndhcmRTbGFzaGVzLmluY2x1ZGVzKCAnL3BlcmVubmlhbC1hbGlhcy9sb2dzLycgKSB8fFxyXG4gICAgICAgICAgIHdpdGhGb3J3YXJkU2xhc2hlcy5lbmRzV2l0aCggJy5lc2xpbnRjYWNoZScgKTtcclxuICB9XHJcblxyXG4gIC8vIEBwcml2YXRlXHJcbiAgc3RhdGljIGZvcndhcmRTbGFzaGlmeSggZmlsZVBhdGggKSB7XHJcbiAgICByZXR1cm4gZmlsZVBhdGguc3BsaXQoICdcXFxcJyApLmpvaW4oICcvJyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJhbnNwaWxlIHRoZSBzcGVjaWZpZWQgcmVwb3NcclxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSByZXBvc1xyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICB0cmFuc3BpbGVSZXBvcyggcmVwb3MgKSB7XHJcbiAgICBhc3NlcnQoIEFycmF5LmlzQXJyYXkoIHJlcG9zICksICdyZXBvcyBzaG91bGQgYmUgYW4gYXJyYXknICk7XHJcbiAgICByZXBvcy5mb3JFYWNoKCByZXBvID0+IHRoaXMudHJhbnNwaWxlUmVwbyggcmVwbyApICk7XHJcbiAgfVxyXG5cclxuICAvLyBAcHVibGljIC0gVmlzaXQgYWxsIHRoZSBzdWJkaXJlY3RvcmllcyBpbiBhIHJlcG8gdGhhdCBuZWVkIHRyYW5zcGlsYXRpb24gZm9yIHRoZSBzcGVjaWZpZWQgbW9kZXNcclxuICB0cmFuc3BpbGVSZXBvV2l0aE1vZGVzKCByZXBvLCBtb2RlcyApIHtcclxuICAgIGFzc2VydCggQXJyYXkuaXNBcnJheSggbW9kZXMgKSwgJ21vZGVzIHNob3VsZCBiZSBhbiBhcnJheScgKTtcclxuICAgIHN1YmRpcnMuZm9yRWFjaCggc3ViZGlyID0+IHRoaXMudmlzaXREaXJlY3RvcnkoIFRyYW5zcGlsZXIuam9pbiggJy4uJywgcmVwbywgc3ViZGlyICksIG1vZGVzICkgKTtcclxuICAgIGlmICggcmVwbyA9PT0gJ3NoZXJwYScgKSB7XHJcblxyXG4gICAgICAvLyBPdXIgc2ltcyBsb2FkIHRoaXMgYXMgYSBtb2R1bGUgcmF0aGVyIHRoYW4gYSBwcmVsb2FkLCBzbyB3ZSBtdXN0IHRyYW5zcGlsZSBpdFxyXG4gICAgICB0aGlzLnZpc2l0RmlsZSggVHJhbnNwaWxlci5qb2luKCAnLi4nLCByZXBvLCAnbGliJywgJ2dhbWUtdXAtY2FtZXJhLTEuMC4wLmpzJyApLCBtb2RlcyApO1xyXG4gICAgICB0aGlzLnZpc2l0RmlsZSggVHJhbnNwaWxlci5qb2luKCAnLi4nLCByZXBvLCAnbGliJywgJ3Bha28tMi4wLjMubWluLmpzJyApLCBtb2RlcyApOyAvLyB1c2VkIGZvciBwaGV0LWlvLXdyYXBwZXJzIHRlc3RzXHJcbiAgICAgIHRoaXMudmlzaXRGaWxlKCBUcmFuc3BpbGVyLmpvaW4oICcuLicsIHJlcG8sICdsaWInLCAnYmlnLTYuMi4xLm1qcycgKSwgbW9kZXMgKTsgLy8gZm9yIGNvbnNpc3RlbnQsIGNyb3NzLWJyb3dzZXIgbnVtYmVyIG9wZXJhdGlvbnMgKHRoYW5rcyBqYXZhc2NyaXB0KVxyXG4gICAgICBPYmplY3Qua2V5cyggd2VicGFja0dsb2JhbExpYnJhcmllcyApLmZvckVhY2goIGtleSA9PiB7XHJcbiAgICAgICAgY29uc3QgbGlicmFyeUZpbGVQYXRoID0gd2VicGFja0dsb2JhbExpYnJhcmllc1sga2V5IF07XHJcbiAgICAgICAgdGhpcy52aXNpdEZpbGUoIFRyYW5zcGlsZXIuam9pbiggJy4uJywgLi4ubGlicmFyeUZpbGVQYXRoLnNwbGl0KCAnLycgKSApLCBtb2RlcyApO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggcmVwbyA9PT0gJ2JyYW5kJyApIHtcclxuICAgICAgdGhpcy52aXNpdERpcmVjdG9yeSggVHJhbnNwaWxlci5qb2luKCAnLi4nLCByZXBvLCAncGhldCcgKSwgbW9kZXMgKTtcclxuICAgICAgdGhpcy52aXNpdERpcmVjdG9yeSggVHJhbnNwaWxlci5qb2luKCAnLi4nLCByZXBvLCAncGhldC1pbycgKSwgbW9kZXMgKTtcclxuICAgICAgdGhpcy52aXNpdERpcmVjdG9yeSggVHJhbnNwaWxlci5qb2luKCAnLi4nLCByZXBvLCAnYWRhcHRlZC1mcm9tLXBoZXQnICksIG1vZGVzICk7XHJcblxyXG4gICAgICB0aGlzLmJyYW5kcy5mb3JFYWNoKCBicmFuZCA9PiB0aGlzLnZpc2l0RGlyZWN0b3J5KCBUcmFuc3BpbGVyLmpvaW4oICcuLicsIHJlcG8sIGJyYW5kICksIG1vZGVzICkgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIEBwdWJsaWMgLSBWaXNpdCBhbGwgdGhlIHN1YmRpcmVjdG9yaWVzIGluIGEgcmVwbyB0aGF0IG5lZWQgdHJhbnNwaWxhdGlvblxyXG4gIHRyYW5zcGlsZVJlcG8oIHJlcG8gKSB7XHJcbiAgICB0aGlzLnRyYW5zcGlsZVJlcG9XaXRoTW9kZXMoIHJlcG8sIGdldE1vZGVzRm9yUmVwbyggcmVwbyApICk7XHJcbiAgfVxyXG5cclxuICAvLyBAcHVibGljXHJcbiAgdHJhbnNwaWxlQWxsKCkge1xyXG4gICAgdGhpcy50cmFuc3BpbGVSZXBvcyggWyAuLi50aGlzLmFjdGl2ZVJlcG9zLCAuLi50aGlzLnJlcG9zIF0gKTtcclxuICB9XHJcblxyXG4gIC8vIEBwcml2YXRlXHJcbiAgc2F2ZUNhY2hlKCkge1xyXG4gICAgZnMud3JpdGVGaWxlU3luYyggc3RhdHVzUGF0aCwgSlNPTi5zdHJpbmdpZnkoIHRoaXMuc3RhdHVzLCBudWxsLCAyICkgKTtcclxuICB9XHJcblxyXG4gIC8vIEBwdWJsaWNcclxuICB3YXRjaCgpIHtcclxuXHJcbiAgICAvLyBJbnZhbGlkYXRlIGNhY2hlcyB3aGVuIHdlIHN0YXJ0IHdhdGNoaW5nXHJcbiAgICBDYWNoZUxheWVyLnVwZGF0ZUxhc3RDaGFuZ2VkVGltZXN0YW1wKCk7XHJcblxyXG4gICAgLy8gRm9yIGNvb3JkaW5hdGlvbiB3aXRoIENhY2hlTGF5ZXIsIGNsZWFyIHRoZSBjYWNoZSB3aGlsZSB3ZSBhcmUgbm90IHdhdGNoaW5nIGZvciBmaWxlIGNoYW5nZXNcclxuICAgIC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE0MDMxNzYzL2RvaW5nLWEtY2xlYW51cC1hY3Rpb24tanVzdC1iZWZvcmUtbm9kZS1qcy1leGl0c1xyXG4gICAgcHJvY2Vzcy5zdGRpbi5yZXN1bWUoKTsvL3NvIHRoZSBwcm9ncmFtIHdpbGwgbm90IGNsb3NlIGluc3RhbnRseVxyXG5cclxuICAgIGZ1bmN0aW9uIGV4aXRIYW5kbGVyKCBvcHRpb25zICkge1xyXG5cclxuICAgICAgLy8gTk9URTogdGhpcyBnZXRzIGNhbGxlZCAyeCBvbiBjdHJsLWMgZm9yIHVua25vd24gcmVhc29uc1xyXG4gICAgICBDYWNoZUxheWVyLmNsZWFyTGFzdENoYW5nZWRUaW1lc3RhbXAoKTtcclxuXHJcbiAgICAgIGlmICggb3B0aW9ucyAmJiBvcHRpb25zLmV4aXQgKSB7XHJcbiAgICAgICAgaWYgKCBvcHRpb25zLmFyZyApIHtcclxuICAgICAgICAgIHRocm93IG9wdGlvbnMuYXJnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcm9jZXNzLmV4aXQoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGRvIHNvbWV0aGluZyB3aGVuIGFwcCBpcyBjbG9zaW5nXHJcbiAgICBwcm9jZXNzLm9uKCAnZXhpdCcsICgpID0+IGV4aXRIYW5kbGVyKCkgKTtcclxuXHJcbiAgICAvLyBjYXRjaGVzIGN0cmwrYyBldmVudFxyXG4gICAgcHJvY2Vzcy5vbiggJ1NJR0lOVCcsICgpID0+IGV4aXRIYW5kbGVyKCB7IGV4aXQ6IHRydWUgfSApICk7XHJcblxyXG4gICAgLy8gY2F0Y2hlcyBcImtpbGwgcGlkXCIgKGZvciBleGFtcGxlOiBub2RlbW9uIHJlc3RhcnQpXHJcbiAgICBwcm9jZXNzLm9uKCAnU0lHVVNSMScsICgpID0+IGV4aXRIYW5kbGVyKCB7IGV4aXQ6IHRydWUgfSApICk7XHJcbiAgICBwcm9jZXNzLm9uKCAnU0lHVVNSMicsICgpID0+IGV4aXRIYW5kbGVyKCB7IGV4aXQ6IHRydWUgfSApICk7XHJcblxyXG4gICAgLy8gY2F0Y2hlcyB1bmNhdWdodCBleGNlcHRpb25zXHJcbiAgICBwcm9jZXNzLm9uKCAndW5jYXVnaHRFeGNlcHRpb24nLCBlID0+IGV4aXRIYW5kbGVyKCB7IGFyZzogZSwgZXhpdDogdHJ1ZSB9ICkgKTtcclxuXHJcbiAgICBmcy53YXRjaCggJy4uJyArIHBhdGguc2VwLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9LCAoIGV2ZW50VHlwZSwgZmlsZW5hbWUgKSA9PiB7XHJcblxyXG4gICAgICBjb25zdCBjaGFuZ2VEZXRlY3RlZFRpbWUgPSBEYXRlLm5vdygpO1xyXG4gICAgICBjb25zdCBmaWxlUGF0aCA9IFRyYW5zcGlsZXIuZm9yd2FyZFNsYXNoaWZ5KCAnLi4nICsgcGF0aC5zZXAgKyBmaWxlbmFtZSApO1xyXG5cclxuICAgICAgLy8gV2Ugb2JzZXJ2ZWQgYSBudWxsIGZpbGVuYW1lIG9uIFdpbmRvd3MgZm9yIGFuIHVua25vd24gcmVhc29uLlxyXG4gICAgICBpZiAoIGZpbGVuYW1lID09PSBudWxsIHx8IHRoaXMuaXNQYXRoSWdub3JlZCggZmlsZVBhdGggKSApIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEludmFsaWRhdGUgY2FjaGUgd2hlbiBhbnkgcmVsZXZhbnQgZmlsZSBoYXMgY2hhbmdlZC5cclxuICAgICAgQ2FjaGVMYXllci51cGRhdGVMYXN0Q2hhbmdlZFRpbWVzdGFtcCgpO1xyXG5cclxuICAgICAgY29uc3QgcGF0aEV4aXN0cyA9IGZzLmV4aXN0c1N5bmMoIGZpbGVQYXRoICk7XHJcblxyXG4gICAgICBpZiAoICFwYXRoRXhpc3RzICkge1xyXG5cclxuICAgICAgICBjb25zdCBtb2RlcyA9IFsgJ2pzJywgJ2NvbW1vbmpzJyBdO1xyXG5cclxuICAgICAgICBtb2Rlcy5mb3JFYWNoKCBtb2RlID0+IHtcclxuICAgICAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBUcmFuc3BpbGVyLmdldFRhcmdldFBhdGgoIGZpbGVQYXRoLCBtb2RlICk7XHJcbiAgICAgICAgICBpZiAoIGZzLmV4aXN0c1N5bmMoIHRhcmdldFBhdGggKSAmJiBmcy5sc3RhdFN5bmMoIHRhcmdldFBhdGggKS5pc0ZpbGUoKSApIHtcclxuICAgICAgICAgICAgZnMudW5saW5rU3luYyggdGFyZ2V0UGF0aCApO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgc3RhdHVzS2V5ID0gZ2V0U3RhdHVzS2V5KCBmaWxlUGF0aCwgbW9kZSApO1xyXG5cclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuc3RhdHVzWyBzdGF0dXNLZXkgXTtcclxuICAgICAgICAgICAgdGhpcy5zYXZlQ2FjaGUoKTtcclxuICAgICAgICAgICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcclxuICAgICAgICAgICAgY29uc3QgcmVhc29uID0gJyAoZGVsZXRlZCknO1xyXG5cclxuICAgICAgICAgICAgIXRoaXMuc2lsZW50ICYmIGNvbnNvbGUubG9nKCBgJHtuZXcgRGF0ZSggbm93ICkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9LCAkeyggbm93IC0gY2hhbmdlRGV0ZWN0ZWRUaW1lICl9IG1zOiAke2ZpbGVQYXRofSR7bW9kZX0ke3JlYXNvbn1gICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSApO1xyXG5cclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggZmlsZVBhdGguZW5kc1dpdGgoICdwZXJlbm5pYWwtYWxpYXMvZGF0YS9hY3RpdmUtcmVwb3MnICkgKSB7XHJcbiAgICAgICAgY29uc3QgbmV3QWN0aXZlUmVwb3MgPSBnZXRBY3RpdmVSZXBvcygpO1xyXG4gICAgICAgICF0aGlzLnNpbGVudCAmJiBjb25zb2xlLmxvZyggJ3JlbG9hZGVkIGFjdGl2ZSByZXBvcycgKTtcclxuICAgICAgICBjb25zdCBuZXdSZXBvcyA9IG5ld0FjdGl2ZVJlcG9zLmZpbHRlciggcmVwbyA9PiAhdGhpcy5hY3RpdmVSZXBvcy5pbmNsdWRlcyggcmVwbyApICk7XHJcblxyXG4gICAgICAgIC8vIFJ1biBhbiBpbml0aWFsIHNjYW4gb24gbmV3bHkgYWRkZWQgcmVwb3NcclxuICAgICAgICBuZXdSZXBvcy5mb3JFYWNoKCByZXBvID0+IHtcclxuICAgICAgICAgICF0aGlzLnNpbGVudCAmJiBjb25zb2xlLmxvZyggJ05ldyByZXBvIGRldGVjdGVkIGluIGFjdGl2ZS1yZXBvcywgdHJhbnNwaWxpbmc6ICcgKyByZXBvICk7XHJcbiAgICAgICAgICB0aGlzLnRyYW5zcGlsZVJlcG8oIHJlcG8gKTtcclxuICAgICAgICB9ICk7XHJcbiAgICAgICAgdGhpcy5hY3RpdmVSZXBvcyA9IG5ld0FjdGl2ZVJlcG9zO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IHRlcm1zID0gZmlsZW5hbWUuc3BsaXQoIHBhdGguc2VwICk7XHJcbiAgICAgICAgY29uc3QgbXlSZXBvID0gdGVybXNbIDAgXTtcclxuICAgICAgICBpZiAoICggdGhpcy5hY3RpdmVSZXBvcy5pbmNsdWRlcyggbXlSZXBvICkgfHwgdGhpcy5yZXBvcy5pbmNsdWRlcyggbXlSZXBvICkgKVxyXG4gICAgICAgICAgICAgJiYgc3ViZGlycy5pbmNsdWRlcyggdGVybXNbIDEgXSApICYmIHBhdGhFeGlzdHMgKSB7XHJcbiAgICAgICAgICB0aGlzLnZpc2l0RmlsZSggZmlsZVBhdGgsIGdldE1vZGVzRm9yUmVwbyggbXlSZXBvICkgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVHJhbnNwaWxlcjsi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