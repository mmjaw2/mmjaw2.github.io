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
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const CacheLayer = require('./CacheLayer');
const wgslMinify = require('./wgslMinify');
const wgslPreprocess = require('./wgslPreprocess');
const wgslStripComments = require('./wgslStripComments');
const webpackGlobalLibraries = require('./webpackGlobalLibraries');
const core = require('@babel/core');
const assert = require('assert');
const _ = require('lodash');

// Cache status is stored in chipper/dist so if you wipe chipper/dist you also wipe the cache
const statusPath = '../chipper/dist/js-cache-status.json';
const root = '..' + path.sep;

// Directories in a sim repo that may contain things for transpilation
// This is used for a top-down search in the initial transpilation and for filtering relevant files in the watch process
// TODO: Subdirs may be different for commonjs/perennial/chipper, see https://github.com/phetsims/chipper/issues/1437
// TODO: Add chipper/test chipper/eslint chipper/templates and perennial/test at a minimum, see https://github.com/phetsims/chipper/issues/1437
const subdirs = ['js', 'images', 'mipmaps', 'sounds', 'shaders', 'common', 'wgsl',
// phet-io-sim-specific has nonstandard directory structure
'repos'];
const getActiveRepos = () => fs.readFileSync('../perennial-alias/data/active-repos', 'utf8').trim().split('\n').map(sim => sim.trim());
const getModesForRepo = repo => {
  const dualRepos = ['chipper', 'perennial-alias', 'perennial', 'phet-core'];
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
const getStatusKey = (filePath, mode) => {
  return filePath + (mode === 'js' ? '@js' : '@commonjs');
};
class Transpiler {
  constructor(options) {
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
      process.on('SIGINT', () => {
        this.saveCache();
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
  static getTargetPath(filename, mode) {
    assert(mode === 'js' || mode === 'commonjs', 'invalid mode: ' + mode);
    const relativePath = path.relative(root, filename);
    const suffix = relativePath.substring(relativePath.lastIndexOf('.'));

    // Note: When we upgrade to Node 16, this may no longer be necessary, see https://github.com/phetsims/chipper/issues/1437#issuecomment-1222574593
    // TODO: Get rid of mjs?: https://github.com/phetsims/chipper/issues/1437
    const isMJS = relativePath.endsWith('.mjs');
    const extension = isMJS ? '.mjs' : '.js';
    return Transpiler.join(root, 'chipper', 'dist', mode, ...relativePath.split(path.sep)).split(suffix).join(extension);
  }

  /**
   * Transpile the file (using babel for JS/TS), and write it to the corresponding location in chipper/dist
   * @param {string} sourceFile
   * @param {string} targetPath
   * @param {string} text - file text
   * @param {string} mode - 'js' or 'commonjs'
   * @private
   */
  transpileFunction(sourceFile, targetPath, text, mode) {
    assert(mode === 'js' || mode === 'commonjs', 'invalid mode: ' + mode);
    let js;
    if (sourceFile.endsWith('.wgsl')) {
      const pathToRoot = '../'.repeat(sourceFile.match(/\//g).length - 1);

      // NOTE: Will be able to use wgslMangle in the future?
      // NOTE: We could also potentially feed this through the transform (source-maps wouldn't really be useful)
      js = wgslPreprocess(wgslStripComments(text), this.minifyWGSL ? wgslMinify : str => str, pathToRoot, targetPath);
    } else {
      js = core.transformSync(text, {
        filename: sourceFile,
        // Load directly from node_modules so we do not have to npm install this dependency
        // in every sim repo.  This strategy is also used in transpile.js
        presets: ['../chipper/node_modules/@babel/preset-typescript', '../chipper/node_modules/@babel/preset-react', ...(mode === 'js' ? [] : [['../chipper/node_modules/@babel/preset-env', {
          modules: 'commonjs'
        }]])],
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
  static modifiedTimeMilliseconds(file) {
    try {
      return fs.statSync(file).mtime.getTime();
    } catch (e) {
      // If one process is reading the file while another is deleting it, we may get an error here.
      console.log('file not found: ' + file);
      return -1;
    }
  }

  // @public.  Delete any files in chipper/dist/js that don't have a corresponding file in the source tree
  pruneStaleDistFiles(mode) {
    assert(mode === 'js' || mode === 'commonjs', 'invalid mode: ' + mode);
    const startTime = Date.now();
    const start = `../chipper/dist/${mode}/`;
    const visitFile = path => {
      path = Transpiler.forwardSlashify(path);
      assert(path.startsWith(start));
      const tail = path.substring(start.length);
      const correspondingFile = `../${tail}`;
      const jsTsFile = correspondingFile.split('.js').join('.ts');
      const jsTsxFile = correspondingFile.split('.js').join('.tsx');
      const jsWgslFile = correspondingFile.split('.js').join('.wgsl');
      const mjsTsFile = correspondingFile.split('.mjs').join('.ts');
      const mjsTsxFile = correspondingFile.split('.mjs').join('.tsx');
      if (!fs.existsSync(correspondingFile) && !fs.existsSync(jsTsFile) && !fs.existsSync(jsTsxFile) && !fs.existsSync(jsWgslFile) && !fs.existsSync(mjsTsFile) && !fs.existsSync(mjsTsxFile)) {
        fs.unlinkSync(path);
        console.log('No parent source file for: ' + path + ', deleted.');
      }
    };

    // @private - Recursively visit a directory for files to transpile
    const visitDir = dir => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const child = Transpiler.join(dir, file);
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
    const endTime = Date.now();
    const elapsed = endTime - startTime;
    console.log(`Clean stale chipper/dist/${mode} files finished in ` + elapsed + 'ms');
  }

  // @public join and normalize the paths (forward slashes for ease of search and readability)
  static join(...paths) {
    return Transpiler.forwardSlashify(path.join(...paths));
  }

  /**
   * @param {string} filePath
   * @param {string} mode - 'js' or 'commonjs'
   * @private
   */
  visitFileWithMode(filePath, mode) {
    assert(mode === 'js' || mode === 'commonjs', 'invalid mode: ' + mode);
    if (_.some(['.js', '.ts', '.tsx', '.wgsl', '.mjs'], extension => filePath.endsWith(extension)) && !this.isPathIgnored(filePath)) {
      const changeDetectedTime = Date.now();
      const text = fs.readFileSync(filePath, 'utf-8');
      const hash = crypto.createHash('md5').update(text).digest('hex');

      // If the file has changed, transpile and update the cache.  We have to choose on the spectrum between safety
      // and performance.  In order to maintain high performance with a low error rate, we only write the transpiled file
      // if (a) the cache is out of date (b) there is no target file at all or (c) if the target file has been modified.
      const targetPath = Transpiler.getTargetPath(filePath, mode);
      const statusKey = getStatusKey(filePath, mode);
      if (!this.status[statusKey] || this.status[statusKey].sourceMD5 !== hash || !fs.existsSync(targetPath) || this.status[statusKey].targetMilliseconds !== Transpiler.modifiedTimeMilliseconds(targetPath)) {
        try {
          let reason = '';
          if (this.verbose) {
            reason = !this.status[statusKey] ? ' (not cached)' : this.status[statusKey].sourceMD5 !== hash ? ' (changed)' : !fs.existsSync(targetPath) ? ' (no target)' : this.status[statusKey].targetMilliseconds !== Transpiler.modifiedTimeMilliseconds(targetPath) ? ' (target modified)' : '???';
          }
          this.transpileFunction(filePath, targetPath, text, mode);
          this.status[statusKey] = {
            sourceMD5: hash,
            targetMilliseconds: Transpiler.modifiedTimeMilliseconds(targetPath)
          };
          fs.writeFileSync(statusPath, JSON.stringify(this.status, null, 2));
          const now = Date.now();
          const nowTimeString = new Date(now).toLocaleTimeString();
          !this.silent && console.log(`${nowTimeString}, ${now - changeDetectedTime} ms: ${filePath} ${mode}${reason}`);
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
  visitFile(filePath, modes) {
    assert(Array.isArray(modes), 'invalid modes: ' + modes);
    modes.forEach(mode => this.visitFileWithMode(filePath, mode));
  }

  // @private - Recursively visit a directory for files to transpile
  visitDirectory(dir, modes) {
    assert(Array.isArray(modes), 'invalid modes: ' + modes);
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const child = Transpiler.join(dir, file);
        assert(!child.endsWith('/dist'), 'Invalid path: ' + child + ' should not be in dist directory.');
        if (fs.lstatSync(child).isDirectory()) {
          this.visitDirectory(child, modes);
        } else {
          this.visitFile(child, modes);
        }
      });
    }
  }

  // @private
  isPathIgnored(filePath) {
    const withForwardSlashes = Transpiler.forwardSlashify(filePath);
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
  static forwardSlashify(filePath) {
    return filePath.split('\\').join('/');
  }

  /**
   * Transpile the specified repos
   * @param {string[]} repos
   * @public
   */
  transpileRepos(repos) {
    assert(Array.isArray(repos), 'repos should be an array');
    repos.forEach(repo => this.transpileRepo(repo));
  }

  // @public - Visit all the subdirectories in a repo that need transpilation for the specified modes
  transpileRepoWithModes(repo, modes) {
    assert(Array.isArray(modes), 'modes should be an array');
    subdirs.forEach(subdir => this.visitDirectory(Transpiler.join('..', repo, subdir), modes));
    if (repo === 'sherpa') {
      // Our sims load this as a module rather than a preload, so we must transpile it
      this.visitFile(Transpiler.join('..', repo, 'lib', 'game-up-camera-1.0.0.js'), modes);
      this.visitFile(Transpiler.join('..', repo, 'lib', 'pako-2.0.3.min.js'), modes); // used for phet-io-wrappers tests
      this.visitFile(Transpiler.join('..', repo, 'lib', 'big-6.2.1.mjs'), modes); // for consistent, cross-browser number operations (thanks javascript)
      Object.keys(webpackGlobalLibraries).forEach(key => {
        const libraryFilePath = webpackGlobalLibraries[key];
        this.visitFile(Transpiler.join('..', ...libraryFilePath.split('/')), modes);
      });
    } else if (repo === 'brand') {
      this.visitDirectory(Transpiler.join('..', repo, 'phet'), modes);
      this.visitDirectory(Transpiler.join('..', repo, 'phet-io'), modes);
      this.visitDirectory(Transpiler.join('..', repo, 'adapted-from-phet'), modes);
      this.brands.forEach(brand => this.visitDirectory(Transpiler.join('..', repo, brand), modes));
    }
  }

  // @public - Visit all the subdirectories in a repo that need transpilation
  transpileRepo(repo) {
    this.transpileRepoWithModes(repo, getModesForRepo(repo));
  }

  // @public
  transpileAll() {
    this.transpileRepos([...this.activeRepos, ...this.repos]);
  }

  // @private
  saveCache() {
    fs.writeFileSync(statusPath, JSON.stringify(this.status, null, 2));
  }

  // @public
  watch() {
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
    process.on('exit', () => exitHandler());

    // catches ctrl+c event
    process.on('SIGINT', () => exitHandler({
      exit: true
    }));

    // catches "kill pid" (for example: nodemon restart)
    process.on('SIGUSR1', () => exitHandler({
      exit: true
    }));
    process.on('SIGUSR2', () => exitHandler({
      exit: true
    }));

    // catches uncaught exceptions
    process.on('uncaughtException', e => exitHandler({
      arg: e,
      exit: true
    }));
    fs.watch('..' + path.sep, {
      recursive: true
    }, (eventType, filename) => {
      const changeDetectedTime = Date.now();
      const filePath = Transpiler.forwardSlashify('..' + path.sep + filename);

      // We observed a null filename on Windows for an unknown reason.
      if (filename === null || this.isPathIgnored(filePath)) {
        return;
      }

      // Invalidate cache when any relevant file has changed.
      CacheLayer.updateLastChangedTimestamp();
      const pathExists = fs.existsSync(filePath);
      if (!pathExists) {
        const modes = ['js', 'commonjs'];
        modes.forEach(mode => {
          const targetPath = Transpiler.getTargetPath(filePath, mode);
          if (fs.existsSync(targetPath) && fs.lstatSync(targetPath).isFile()) {
            fs.unlinkSync(targetPath);
            const statusKey = getStatusKey(filePath, mode);
            delete this.status[statusKey];
            this.saveCache();
            const now = Date.now();
            const reason = ' (deleted)';
            !this.silent && console.log(`${new Date(now).toLocaleTimeString()}, ${now - changeDetectedTime} ms: ${filePath}${mode}${reason}`);
          }
        });
        return;
      }
      if (filePath.endsWith('perennial-alias/data/active-repos')) {
        const newActiveRepos = getActiveRepos();
        !this.silent && console.log('reloaded active repos');
        const newRepos = newActiveRepos.filter(repo => !this.activeRepos.includes(repo));

        // Run an initial scan on newly added repos
        newRepos.forEach(repo => {
          !this.silent && console.log('New repo detected in active-repos, transpiling: ' + repo);
          this.transpileRepo(repo);
        });
        this.activeRepos = newActiveRepos;
      } else {
        const terms = filename.split(path.sep);
        const myRepo = terms[0];
        if ((this.activeRepos.includes(myRepo) || this.repos.includes(myRepo)) && subdirs.includes(terms[1]) && pathExists) {
          this.visitFile(filePath, getModesForRepo(myRepo));
        }
      }
    });
  }
}
module.exports = Transpiler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJwYXRoIiwiY3J5cHRvIiwiQ2FjaGVMYXllciIsIndnc2xNaW5pZnkiLCJ3Z3NsUHJlcHJvY2VzcyIsIndnc2xTdHJpcENvbW1lbnRzIiwid2VicGFja0dsb2JhbExpYnJhcmllcyIsImNvcmUiLCJhc3NlcnQiLCJfIiwic3RhdHVzUGF0aCIsInJvb3QiLCJzZXAiLCJzdWJkaXJzIiwiZ2V0QWN0aXZlUmVwb3MiLCJyZWFkRmlsZVN5bmMiLCJ0cmltIiwic3BsaXQiLCJtYXAiLCJzaW0iLCJnZXRNb2Rlc0ZvclJlcG8iLCJyZXBvIiwiZHVhbFJlcG9zIiwiaW5jbHVkZXMiLCJnZXRTdGF0dXNLZXkiLCJmaWxlUGF0aCIsIm1vZGUiLCJUcmFuc3BpbGVyIiwiY29uc3RydWN0b3IiLCJvcHRpb25zIiwiYXNzaWduSW4iLCJjbGVhbiIsInZlcmJvc2UiLCJzaWxlbnQiLCJyZXBvcyIsImJyYW5kcyIsIm1pbmlmeVdHU0wiLCJzdGF0dXMiLCJnbG9iYWwiLCJwcm9jZXNzRXZlbnRPcHRPdXQiLCJwcm9jZXNzIiwib24iLCJzYXZlQ2FjaGUiLCJleGl0IiwibWtkaXJTeW5jIiwiZGlybmFtZSIsInJlY3Vyc2l2ZSIsImNvbnNvbGUiLCJsb2ciLCJ3cml0ZUZpbGVTeW5jIiwiSlNPTiIsInN0cmluZ2lmeSIsInBhcnNlIiwiZSIsImFjdGl2ZVJlcG9zIiwiZ2V0VGFyZ2V0UGF0aCIsImZpbGVuYW1lIiwicmVsYXRpdmVQYXRoIiwicmVsYXRpdmUiLCJzdWZmaXgiLCJzdWJzdHJpbmciLCJsYXN0SW5kZXhPZiIsImlzTUpTIiwiZW5kc1dpdGgiLCJleHRlbnNpb24iLCJqb2luIiwidHJhbnNwaWxlRnVuY3Rpb24iLCJzb3VyY2VGaWxlIiwidGFyZ2V0UGF0aCIsInRleHQiLCJqcyIsInBhdGhUb1Jvb3QiLCJyZXBlYXQiLCJtYXRjaCIsImxlbmd0aCIsInN0ciIsInRyYW5zZm9ybVN5bmMiLCJwcmVzZXRzIiwibW9kdWxlcyIsInNvdXJjZU1hcHMiLCJwbHVnaW5zIiwidmVyc2lvbiIsImNvZGUiLCJtb2RpZmllZFRpbWVNaWxsaXNlY29uZHMiLCJmaWxlIiwic3RhdFN5bmMiLCJtdGltZSIsImdldFRpbWUiLCJwcnVuZVN0YWxlRGlzdEZpbGVzIiwic3RhcnRUaW1lIiwiRGF0ZSIsIm5vdyIsInN0YXJ0IiwidmlzaXRGaWxlIiwiZm9yd2FyZFNsYXNoaWZ5Iiwic3RhcnRzV2l0aCIsInRhaWwiLCJjb3JyZXNwb25kaW5nRmlsZSIsImpzVHNGaWxlIiwianNUc3hGaWxlIiwianNXZ3NsRmlsZSIsIm1qc1RzRmlsZSIsIm1qc1RzeEZpbGUiLCJleGlzdHNTeW5jIiwidW5saW5rU3luYyIsInZpc2l0RGlyIiwiZGlyIiwiZmlsZXMiLCJyZWFkZGlyU3luYyIsImZvckVhY2giLCJjaGlsZCIsImxzdGF0U3luYyIsImlzRGlyZWN0b3J5IiwiaXNGaWxlIiwiZW5kVGltZSIsImVsYXBzZWQiLCJwYXRocyIsInZpc2l0RmlsZVdpdGhNb2RlIiwic29tZSIsImlzUGF0aElnbm9yZWQiLCJjaGFuZ2VEZXRlY3RlZFRpbWUiLCJoYXNoIiwiY3JlYXRlSGFzaCIsInVwZGF0ZSIsImRpZ2VzdCIsInN0YXR1c0tleSIsInNvdXJjZU1ENSIsInRhcmdldE1pbGxpc2Vjb25kcyIsInJlYXNvbiIsIm5vd1RpbWVTdHJpbmciLCJ0b0xvY2FsZVRpbWVTdHJpbmciLCJtb2RlcyIsIkFycmF5IiwiaXNBcnJheSIsInZpc2l0RGlyZWN0b3J5Iiwid2l0aEZvcndhcmRTbGFzaGVzIiwidHJhbnNwaWxlUmVwb3MiLCJ0cmFuc3BpbGVSZXBvIiwidHJhbnNwaWxlUmVwb1dpdGhNb2RlcyIsInN1YmRpciIsIk9iamVjdCIsImtleXMiLCJrZXkiLCJsaWJyYXJ5RmlsZVBhdGgiLCJicmFuZCIsInRyYW5zcGlsZUFsbCIsIndhdGNoIiwidXBkYXRlTGFzdENoYW5nZWRUaW1lc3RhbXAiLCJzdGRpbiIsInJlc3VtZSIsImV4aXRIYW5kbGVyIiwiY2xlYXJMYXN0Q2hhbmdlZFRpbWVzdGFtcCIsImFyZyIsImV2ZW50VHlwZSIsInBhdGhFeGlzdHMiLCJuZXdBY3RpdmVSZXBvcyIsIm5ld1JlcG9zIiwiZmlsdGVyIiwidGVybXMiLCJteVJlcG8iLCJtb2R1bGUiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsiVHJhbnNwaWxlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMS0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBUcmFuc3BpbGVzICoudHMgYW5kIGNvcGllcyBhbGwgKi5qcyBmaWxlcyB0byBjaGlwcGVyL2Rpc3QuIERvZXMgbm90IGRvIHR5cGUgY2hlY2tpbmcuIEZpbHRlcnMgYmFzZWQgb25cclxuICogcGVyZW5uaWFsLWFsaWFzL2FjdGl2ZS1yZXBvcyBhbmQgc3Vic2V0cyBvZiBkaXJlY3RvcmllcyB3aXRoaW4gcmVwb3MgKHN1Y2ggYXMganMvLCBpbWFnZXMvLCBhbmQgc291bmRzLykuXHJcbiAqXHJcbiAqIEFkZGl0aW9uYWxseSwgd2lsbCB0cmFuc3BpbGUgKi53Z3NsIGZpbGVzIHRvICouanMgZmlsZXMuXHJcbiAqXHJcbiAqIFRvIHN1cHBvcnQgdGhlIGJyb3dzZXIgYW5kIG5vZGUuanMsIHdlIG91dHB1dCB0d28gbW9kZXM6XHJcbiAqIDEuICdqcycgb3V0cHV0cyB0byBjaGlwcGVyL2Rpc3QvanMgLSBpbXBvcnQgc3RhdGVtZW50cywgY2FuIGJlIGxhdW5jaGVkIGluIHRoZSBicm93c2VyXHJcbiAqIDIuICdjb21tb25qcycgb3V0cHV0cyB0byBjaGlwcGVyL2Rpc3QvY29tbW9uanMgLSByZXF1aXJlL21vZHVsZS5leHBvcnRzLCBjYW4gYmUgdXNlZCBpbiBub2RlLmpzXHJcbiAqXHJcbiAqIGdydW50IGlzIGNvbnN0cmFpbmVkIHRvIHVzZSByZXF1aXJlIHN0YXRlbWVudHMsIHNvIHRoYXQgaXMgd2h5IHdlIG11c3Qgc3VwcG9ydCB0aGUgY29tbW9uanMgbW9kZS5cclxuICpcclxuICogU2VlIHRyYW5zcGlsZS5qcyBmb3IgdGhlIENMSSB1c2FnZVxyXG4gKlxyXG4gKiAgQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG4vLyBUT0RPOiBNb3ZlIHRvIHBlcmVubmlhbC1hbGlhcywgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9jaGlwcGVyL2lzc3Vlcy8xNDM3LiBEb2VzIHRoaXMgbWVhbiB3ZSB3aWxsIGhhdmUgcGVyZW5uaWFsLWFsaWFzL2Rpc3Q/IEJlIGNhcmVmdWwgbm90IHRvIGNyZWF0ZSBwZXJlbm5pYWwvZGlzdCB0b28uXHJcblxyXG4vLyBpbXBvcnRzXHJcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG5jb25zdCBwYXRoID0gcmVxdWlyZSggJ3BhdGgnICk7XHJcbmNvbnN0IGNyeXB0byA9IHJlcXVpcmUoICdjcnlwdG8nICk7XHJcbmNvbnN0IENhY2hlTGF5ZXIgPSByZXF1aXJlKCAnLi9DYWNoZUxheWVyJyApO1xyXG5jb25zdCB3Z3NsTWluaWZ5ID0gcmVxdWlyZSggJy4vd2dzbE1pbmlmeScgKTtcclxuY29uc3Qgd2dzbFByZXByb2Nlc3MgPSByZXF1aXJlKCAnLi93Z3NsUHJlcHJvY2VzcycgKTtcclxuY29uc3Qgd2dzbFN0cmlwQ29tbWVudHMgPSByZXF1aXJlKCAnLi93Z3NsU3RyaXBDb21tZW50cycgKTtcclxuY29uc3Qgd2VicGFja0dsb2JhbExpYnJhcmllcyA9IHJlcXVpcmUoICcuL3dlYnBhY2tHbG9iYWxMaWJyYXJpZXMnICk7XHJcbmNvbnN0IGNvcmUgPSByZXF1aXJlKCAnQGJhYmVsL2NvcmUnICk7XHJcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoICdhc3NlcnQnICk7XHJcbmNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xyXG5cclxuLy8gQ2FjaGUgc3RhdHVzIGlzIHN0b3JlZCBpbiBjaGlwcGVyL2Rpc3Qgc28gaWYgeW91IHdpcGUgY2hpcHBlci9kaXN0IHlvdSBhbHNvIHdpcGUgdGhlIGNhY2hlXHJcbmNvbnN0IHN0YXR1c1BhdGggPSAnLi4vY2hpcHBlci9kaXN0L2pzLWNhY2hlLXN0YXR1cy5qc29uJztcclxuY29uc3Qgcm9vdCA9ICcuLicgKyBwYXRoLnNlcDtcclxuXHJcbi8vIERpcmVjdG9yaWVzIGluIGEgc2ltIHJlcG8gdGhhdCBtYXkgY29udGFpbiB0aGluZ3MgZm9yIHRyYW5zcGlsYXRpb25cclxuLy8gVGhpcyBpcyB1c2VkIGZvciBhIHRvcC1kb3duIHNlYXJjaCBpbiB0aGUgaW5pdGlhbCB0cmFuc3BpbGF0aW9uIGFuZCBmb3IgZmlsdGVyaW5nIHJlbGV2YW50IGZpbGVzIGluIHRoZSB3YXRjaCBwcm9jZXNzXHJcbi8vIFRPRE86IFN1YmRpcnMgbWF5IGJlIGRpZmZlcmVudCBmb3IgY29tbW9uanMvcGVyZW5uaWFsL2NoaXBwZXIsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvMTQzN1xyXG4vLyBUT0RPOiBBZGQgY2hpcHBlci90ZXN0IGNoaXBwZXIvZXNsaW50IGNoaXBwZXIvdGVtcGxhdGVzIGFuZCBwZXJlbm5pYWwvdGVzdCBhdCBhIG1pbmltdW0sIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvMTQzN1xyXG5jb25zdCBzdWJkaXJzID0gWyAnanMnLCAnaW1hZ2VzJywgJ21pcG1hcHMnLCAnc291bmRzJywgJ3NoYWRlcnMnLCAnY29tbW9uJywgJ3dnc2wnLFxyXG5cclxuICAvLyBwaGV0LWlvLXNpbS1zcGVjaWZpYyBoYXMgbm9uc3RhbmRhcmQgZGlyZWN0b3J5IHN0cnVjdHVyZVxyXG4gICdyZXBvcycgXTtcclxuXHJcbmNvbnN0IGdldEFjdGl2ZVJlcG9zID0gKCkgPT4gZnMucmVhZEZpbGVTeW5jKCAnLi4vcGVyZW5uaWFsLWFsaWFzL2RhdGEvYWN0aXZlLXJlcG9zJywgJ3V0ZjgnICkudHJpbSgpLnNwbGl0KCAnXFxuJyApLm1hcCggc2ltID0+IHNpbS50cmltKCkgKTtcclxuXHJcbmNvbnN0IGdldE1vZGVzRm9yUmVwbyA9IHJlcG8gPT4ge1xyXG4gIGNvbnN0IGR1YWxSZXBvcyA9IFsgJ2NoaXBwZXInLCAncGVyZW5uaWFsLWFsaWFzJywgJ3BlcmVubmlhbCcsICdwaGV0LWNvcmUnIF07XHJcbiAgaWYgKCBkdWFsUmVwb3MuaW5jbHVkZXMoIHJlcG8gKSApIHtcclxuICAgIHJldHVybiBbICdqcycsICdjb21tb25qcycgXTtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICByZXR1cm4gWyAnanMnIF07XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCBhIGNhY2hlIHN0YXR1cyBrZXkgZm9yIHRoZSBmaWxlIHBhdGggYW5kIG1vZGVcclxuICogQHBhcmFtIGZpbGVQYXRoXHJcbiAqIEBwYXJhbSBtb2RlICdqcycgb3IgJ2NvbW1vbmpzJ1xyXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gKi9cclxuY29uc3QgZ2V0U3RhdHVzS2V5ID0gKCBmaWxlUGF0aCwgbW9kZSApID0+IHtcclxuICByZXR1cm4gZmlsZVBhdGggKyAoIG1vZGUgPT09ICdqcycgPyAnQGpzJyA6ICdAY29tbW9uanMnICk7XHJcbn07XHJcblxyXG5jbGFzcyBUcmFuc3BpbGVyIHtcclxuXHJcbiAgY29uc3RydWN0b3IoIG9wdGlvbnMgKSB7XHJcblxyXG4gICAgb3B0aW9ucyA9IF8uYXNzaWduSW4oIHtcclxuICAgICAgY2xlYW46IGZhbHNlLCAvLyBkZWxldGUgdGhlIHByZXZpb3VzIHN0YXRlL2NhY2hlIGZpbGUsIGFuZCBjcmVhdGUgYSBuZXcgb25lLlxyXG4gICAgICB2ZXJib3NlOiBmYWxzZSwgLy8gQWRkIGV4dHJhIGxvZ2dpbmdcclxuICAgICAgc2lsZW50OiBmYWxzZSwgLy8gaGlkZSBhbGwgbG9nZ2luZyBidXQgZXJyb3IgcmVwb3J0aW5nLCBpbmNsdWRlIGFueSBzcGVjaWZpZWQgd2l0aCB2ZXJib3NlXHJcbiAgICAgIHJlcG9zOiBbXSwgLy8ge3N0cmluZ1tdfSBhZGRpdGlvbmFsIHJlcG9zIHRvIGJlIHRyYW5zcGlsZWQgKGJleW9uZCB0aG9zZSBsaXN0ZWQgaW4gcGVyZW5uaWFsLWFsaWFzL2RhdGEvYWN0aXZlLXJlcG9zKVxyXG4gICAgICBicmFuZHM6IFtdLCAvLyB7c3RpbmdbXX0gYWRkaXRpb25hbCBicmFuZHMgdG8gdmlzaXQgaW4gdGhlIGJyYW5kIHJlcG9cclxuICAgICAgbWluaWZ5V0dTTDogZmFsc2VcclxuICAgIH0sIG9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZVxyXG4gICAgdGhpcy52ZXJib3NlID0gb3B0aW9ucy52ZXJib3NlO1xyXG4gICAgdGhpcy5zaWxlbnQgPSBvcHRpb25zLnNpbGVudDtcclxuICAgIHRoaXMucmVwb3MgPSBvcHRpb25zLnJlcG9zO1xyXG4gICAgdGhpcy5icmFuZHMgPSBvcHRpb25zLmJyYW5kcztcclxuICAgIHRoaXMubWluaWZ5V0dTTCA9IG9wdGlvbnMubWluaWZ5V0dTTDtcclxuXHJcbiAgICAvLyBUcmFjayB0aGUgc3RhdHVzIG9mIGVhY2ggcmVwby4gS2V5PSByZXBvLCB2YWx1ZT1tZDUgaGFzaCBvZiBjb250ZW50c1xyXG4gICAgdGhpcy5zdGF0dXMgPSB7fTtcclxuXHJcbiAgICAvLyBIYW5kbGUgdGhlIGNhc2Ugd2hlcmUgcHJvZ3JhbXMgd2FudCB0byBoYW5kbGUgdGhpcyBpdHNlbGYgYW5kIGRvIHNvbWV0aGluZyBiZWZvcmUgZXhpdGluZy5cclxuICAgIGlmICggIWdsb2JhbC5wcm9jZXNzRXZlbnRPcHRPdXQgKSB7XHJcblxyXG4gICAgICAvLyBFeGl0IG9uIEN0cmwgKyBDIGNhc2UsIGJ1dCBtYWtlIHN1cmUgdG8gc2F2ZSB0aGUgY2FjaGVcclxuICAgICAgcHJvY2Vzcy5vbiggJ1NJR0lOVCcsICgpID0+IHtcclxuICAgICAgICB0aGlzLnNhdmVDYWNoZSgpO1xyXG4gICAgICAgIHByb2Nlc3MuZXhpdCgpO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTWFrZSBzdXJlIGEgZGlyZWN0b3J5IGV4aXN0cyBmb3IgdGhlIGNhY2hlZCBzdGF0dXMgZmlsZVxyXG4gICAgZnMubWtkaXJTeW5jKCBwYXRoLmRpcm5hbWUoIHN0YXR1c1BhdGggKSwgeyByZWN1cnNpdmU6IHRydWUgfSApO1xyXG5cclxuICAgIGlmICggb3B0aW9ucy5jbGVhbiApIHtcclxuICAgICAgIXRoaXMuc2lsZW50ICYmIGNvbnNvbGUubG9nKCAnY2xlYW5pbmcuLi4nICk7XHJcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMoIHN0YXR1c1BhdGgsIEpTT04uc3RyaW5naWZ5KCB7fSwgbnVsbCwgMiApICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTG9hZCBjYWNoZWQgc3RhdHVzXHJcbiAgICB0cnkge1xyXG4gICAgICB0aGlzLnN0YXR1cyA9IEpTT04ucGFyc2UoIGZzLnJlYWRGaWxlU3luYyggc3RhdHVzUGF0aCwgJ3V0Zi04JyApICk7XHJcbiAgICB9XHJcbiAgICBjYXRjaCggZSApIHtcclxuICAgICAgIXRoaXMuc2lsZW50ICYmIGNvbnNvbGUubG9nKCAnY291bGRuXFwndCBwYXJzZSBzdGF0dXMgY2FjaGUsIG1ha2luZyBhIGNsZWFuIG9uZScgKTtcclxuICAgICAgdGhpcy5zdGF0dXMgPSB7fTtcclxuICAgICAgZnMud3JpdGVGaWxlU3luYyggc3RhdHVzUGF0aCwgSlNPTi5zdHJpbmdpZnkoIHRoaXMuc3RhdHVzLCBudWxsLCAyICkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBVc2UgdGhlIHNhbWUgaW1wbGVtZW50YXRpb24gYXMgZ2V0UmVwb0xpc3QsIGJ1dCB3ZSBuZWVkIHRvIHJlYWQgZnJvbSBwZXJlbm5pYWwtYWxpYXMgc2luY2UgY2hpcHBlciBzaG91bGQgbm90XHJcbiAgICAvLyBkZXBlbmQgb24gcGVyZW5uaWFsLlxyXG4gICAgdGhpcy5hY3RpdmVSZXBvcyA9IGdldEFjdGl2ZVJlcG9zKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBwYXRoIGluIGNoaXBwZXIvZGlzdCB0aGF0IGNvcnJlc3BvbmRzIHRvIGEgc291cmNlIGZpbGUuXHJcbiAgICogQHBhcmFtIGZpbGVuYW1lXHJcbiAgICogQHBhcmFtIG1vZGUgLSAnanMnIG9yICdjb21tb25qcydcclxuICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgc3RhdGljIGdldFRhcmdldFBhdGgoIGZpbGVuYW1lLCBtb2RlICkge1xyXG4gICAgYXNzZXJ0KCBtb2RlID09PSAnanMnIHx8IG1vZGUgPT09ICdjb21tb25qcycsICdpbnZhbGlkIG1vZGU6ICcgKyBtb2RlICk7XHJcbiAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBwYXRoLnJlbGF0aXZlKCByb290LCBmaWxlbmFtZSApO1xyXG4gICAgY29uc3Qgc3VmZml4ID0gcmVsYXRpdmVQYXRoLnN1YnN0cmluZyggcmVsYXRpdmVQYXRoLmxhc3RJbmRleE9mKCAnLicgKSApO1xyXG5cclxuICAgIC8vIE5vdGU6IFdoZW4gd2UgdXBncmFkZSB0byBOb2RlIDE2LCB0aGlzIG1heSBubyBsb25nZXIgYmUgbmVjZXNzYXJ5LCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzE0MzcjaXNzdWVjb21tZW50LTEyMjI1NzQ1OTNcclxuICAgIC8vIFRPRE86IEdldCByaWQgb2YgbWpzPzogaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzE0MzdcclxuICAgIGNvbnN0IGlzTUpTID0gcmVsYXRpdmVQYXRoLmVuZHNXaXRoKCAnLm1qcycgKTtcclxuXHJcbiAgICBjb25zdCBleHRlbnNpb24gPSBpc01KUyA/ICcubWpzJyA6ICcuanMnO1xyXG4gICAgcmV0dXJuIFRyYW5zcGlsZXIuam9pbiggcm9vdCwgJ2NoaXBwZXInLCAnZGlzdCcsIG1vZGUsIC4uLnJlbGF0aXZlUGF0aC5zcGxpdCggcGF0aC5zZXAgKSApLnNwbGl0KCBzdWZmaXggKS5qb2luKCBleHRlbnNpb24gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyYW5zcGlsZSB0aGUgZmlsZSAodXNpbmcgYmFiZWwgZm9yIEpTL1RTKSwgYW5kIHdyaXRlIGl0IHRvIHRoZSBjb3JyZXNwb25kaW5nIGxvY2F0aW9uIGluIGNoaXBwZXIvZGlzdFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzb3VyY2VGaWxlXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhcmdldFBhdGhcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIGZpbGUgdGV4dFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtb2RlIC0gJ2pzJyBvciAnY29tbW9uanMnXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICB0cmFuc3BpbGVGdW5jdGlvbiggc291cmNlRmlsZSwgdGFyZ2V0UGF0aCwgdGV4dCwgbW9kZSApIHtcclxuICAgIGFzc2VydCggbW9kZSA9PT0gJ2pzJyB8fCBtb2RlID09PSAnY29tbW9uanMnLCAnaW52YWxpZCBtb2RlOiAnICsgbW9kZSApO1xyXG4gICAgbGV0IGpzO1xyXG4gICAgaWYgKCBzb3VyY2VGaWxlLmVuZHNXaXRoKCAnLndnc2wnICkgKSB7XHJcbiAgICAgIGNvbnN0IHBhdGhUb1Jvb3QgPSAnLi4vJy5yZXBlYXQoIHNvdXJjZUZpbGUubWF0Y2goIC9cXC8vZyApLmxlbmd0aCAtIDEgKTtcclxuXHJcbiAgICAgIC8vIE5PVEU6IFdpbGwgYmUgYWJsZSB0byB1c2Ugd2dzbE1hbmdsZSBpbiB0aGUgZnV0dXJlP1xyXG4gICAgICAvLyBOT1RFOiBXZSBjb3VsZCBhbHNvIHBvdGVudGlhbGx5IGZlZWQgdGhpcyB0aHJvdWdoIHRoZSB0cmFuc2Zvcm0gKHNvdXJjZS1tYXBzIHdvdWxkbid0IHJlYWxseSBiZSB1c2VmdWwpXHJcbiAgICAgIGpzID0gd2dzbFByZXByb2Nlc3MoIHdnc2xTdHJpcENvbW1lbnRzKCB0ZXh0ICksIHRoaXMubWluaWZ5V0dTTCA/IHdnc2xNaW5pZnkgOiBzdHIgPT4gc3RyLCBwYXRoVG9Sb290LCB0YXJnZXRQYXRoICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAganMgPSBjb3JlLnRyYW5zZm9ybVN5bmMoIHRleHQsIHtcclxuICAgICAgICBmaWxlbmFtZTogc291cmNlRmlsZSxcclxuXHJcbiAgICAgICAgLy8gTG9hZCBkaXJlY3RseSBmcm9tIG5vZGVfbW9kdWxlcyBzbyB3ZSBkbyBub3QgaGF2ZSB0byBucG0gaW5zdGFsbCB0aGlzIGRlcGVuZGVuY3lcclxuICAgICAgICAvLyBpbiBldmVyeSBzaW0gcmVwby4gIFRoaXMgc3RyYXRlZ3kgaXMgYWxzbyB1c2VkIGluIHRyYW5zcGlsZS5qc1xyXG4gICAgICAgIHByZXNldHM6IFtcclxuICAgICAgICAgICcuLi9jaGlwcGVyL25vZGVfbW9kdWxlcy9AYmFiZWwvcHJlc2V0LXR5cGVzY3JpcHQnLFxyXG4gICAgICAgICAgJy4uL2NoaXBwZXIvbm9kZV9tb2R1bGVzL0BiYWJlbC9wcmVzZXQtcmVhY3QnLFxyXG4gICAgICAgICAgLi4uKCBtb2RlID09PSAnanMnID8gW10gOiBbIFsgJy4uL2NoaXBwZXIvbm9kZV9tb2R1bGVzL0BiYWJlbC9wcmVzZXQtZW52JywgeyBtb2R1bGVzOiAnY29tbW9uanMnIH0gXSBdIClcclxuICAgICAgICBdLFxyXG4gICAgICAgIHNvdXJjZU1hcHM6ICdpbmxpbmUnLFxyXG5cclxuICAgICAgICBwbHVnaW5zOiBbXHJcbiAgICAgICAgICBbICcuLi9jaGlwcGVyL25vZGVfbW9kdWxlcy9AYmFiZWwvcGx1Z2luLXByb3Bvc2FsLWRlY29yYXRvcnMnLCB7IHZlcnNpb246ICcyMDIyLTAzJyB9IF1cclxuICAgICAgICBdXHJcbiAgICAgIH0gKS5jb2RlO1xyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFRPRE86IEdlbmVyYWxpemUgdGhpcyBzbyBpdCBjYW4gbG9vayB1cCB0aGUgYXBwcm9wcmlhdGUgcGF0aCBmb3IgYW55IGRlcGVuZGVuY3ksIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvMTQzN1xyXG4gICAgICAgKiBUaGlzIGNhbiBiZSBhY2NvbXBsaXNoZWQgd2l0aCBhIGJhYmVsIHBsdWdpbi5cclxuICAgICAgICogTm90ZSBhcXVhLCBwZXJlbm5pYWwsIHBlcmVubmlhbC1hbGlhcywgcm9zZXR0YSBhbmQgc2tpZmZsZSBlYWNoIHJlcXVpcmUgKGEgcG9zc2libHkgZGlmZmVyZW50IHZlcnNpb24gb2YpIHdpbnN0b25cclxuICAgICAgICovXHJcbiAgICAgIGpzID0ganMuc3BsaXQoICdyZXF1aXJlKFxcJ3dpbnN0b25cXCcpJyApLmpvaW4oICdyZXF1aXJlKFxcJy4uLy4uLy4uLy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9ub2RlX21vZHVsZXMvd2luc3RvblxcJyknICk7XHJcbiAgICB9XHJcblxyXG4gICAgZnMubWtkaXJTeW5jKCBwYXRoLmRpcm5hbWUoIHRhcmdldFBhdGggKSwgeyByZWN1cnNpdmU6IHRydWUgfSApO1xyXG4gICAgZnMud3JpdGVGaWxlU3luYyggdGFyZ2V0UGF0aCwganMgKTtcclxuICB9XHJcblxyXG4gIC8vIEBwcml2YXRlXHJcbiAgc3RhdGljIG1vZGlmaWVkVGltZU1pbGxpc2Vjb25kcyggZmlsZSApIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHJldHVybiBmcy5zdGF0U3luYyggZmlsZSApLm10aW1lLmdldFRpbWUoKTtcclxuICAgIH1cclxuICAgIGNhdGNoKCBlICkge1xyXG5cclxuICAgICAgLy8gSWYgb25lIHByb2Nlc3MgaXMgcmVhZGluZyB0aGUgZmlsZSB3aGlsZSBhbm90aGVyIGlzIGRlbGV0aW5nIGl0LCB3ZSBtYXkgZ2V0IGFuIGVycm9yIGhlcmUuXHJcbiAgICAgIGNvbnNvbGUubG9nKCAnZmlsZSBub3QgZm91bmQ6ICcgKyBmaWxlICk7XHJcbiAgICAgIHJldHVybiAtMTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIEBwdWJsaWMuICBEZWxldGUgYW55IGZpbGVzIGluIGNoaXBwZXIvZGlzdC9qcyB0aGF0IGRvbid0IGhhdmUgYSBjb3JyZXNwb25kaW5nIGZpbGUgaW4gdGhlIHNvdXJjZSB0cmVlXHJcbiAgcHJ1bmVTdGFsZURpc3RGaWxlcyggbW9kZSApIHtcclxuICAgIGFzc2VydCggbW9kZSA9PT0gJ2pzJyB8fCBtb2RlID09PSAnY29tbW9uanMnLCAnaW52YWxpZCBtb2RlOiAnICsgbW9kZSApO1xyXG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcclxuXHJcbiAgICBjb25zdCBzdGFydCA9IGAuLi9jaGlwcGVyL2Rpc3QvJHttb2RlfS9gO1xyXG5cclxuICAgIGNvbnN0IHZpc2l0RmlsZSA9IHBhdGggPT4ge1xyXG4gICAgICBwYXRoID0gVHJhbnNwaWxlci5mb3J3YXJkU2xhc2hpZnkoIHBhdGggKTtcclxuICAgICAgYXNzZXJ0KCBwYXRoLnN0YXJ0c1dpdGgoIHN0YXJ0ICkgKTtcclxuICAgICAgY29uc3QgdGFpbCA9IHBhdGguc3Vic3RyaW5nKCBzdGFydC5sZW5ndGggKTtcclxuXHJcbiAgICAgIGNvbnN0IGNvcnJlc3BvbmRpbmdGaWxlID0gYC4uLyR7dGFpbH1gO1xyXG4gICAgICBjb25zdCBqc1RzRmlsZSA9IGNvcnJlc3BvbmRpbmdGaWxlLnNwbGl0KCAnLmpzJyApLmpvaW4oICcudHMnICk7XHJcbiAgICAgIGNvbnN0IGpzVHN4RmlsZSA9IGNvcnJlc3BvbmRpbmdGaWxlLnNwbGl0KCAnLmpzJyApLmpvaW4oICcudHN4JyApO1xyXG4gICAgICBjb25zdCBqc1dnc2xGaWxlID0gY29ycmVzcG9uZGluZ0ZpbGUuc3BsaXQoICcuanMnICkuam9pbiggJy53Z3NsJyApO1xyXG4gICAgICBjb25zdCBtanNUc0ZpbGUgPSBjb3JyZXNwb25kaW5nRmlsZS5zcGxpdCggJy5tanMnICkuam9pbiggJy50cycgKTtcclxuICAgICAgY29uc3QgbWpzVHN4RmlsZSA9IGNvcnJlc3BvbmRpbmdGaWxlLnNwbGl0KCAnLm1qcycgKS5qb2luKCAnLnRzeCcgKTtcclxuICAgICAgaWYgKCAhZnMuZXhpc3RzU3luYyggY29ycmVzcG9uZGluZ0ZpbGUgKSAmJlxyXG4gICAgICAgICAgICFmcy5leGlzdHNTeW5jKCBqc1RzRmlsZSApICYmICFmcy5leGlzdHNTeW5jKCBqc1RzeEZpbGUgKSAmJiAhZnMuZXhpc3RzU3luYygganNXZ3NsRmlsZSApICYmXHJcbiAgICAgICAgICAgIWZzLmV4aXN0c1N5bmMoIG1qc1RzRmlsZSApICYmICFmcy5leGlzdHNTeW5jKCBtanNUc3hGaWxlIClcclxuICAgICAgKSB7XHJcbiAgICAgICAgZnMudW5saW5rU3luYyggcGF0aCApO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCAnTm8gcGFyZW50IHNvdXJjZSBmaWxlIGZvcjogJyArIHBhdGggKyAnLCBkZWxldGVkLicgKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSAtIFJlY3Vyc2l2ZWx5IHZpc2l0IGEgZGlyZWN0b3J5IGZvciBmaWxlcyB0byB0cmFuc3BpbGVcclxuICAgIGNvbnN0IHZpc2l0RGlyID0gZGlyID0+IHtcclxuICAgICAgY29uc3QgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyggZGlyICk7XHJcbiAgICAgIGZpbGVzLmZvckVhY2goIGZpbGUgPT4ge1xyXG4gICAgICAgIGNvbnN0IGNoaWxkID0gVHJhbnNwaWxlci5qb2luKCBkaXIsIGZpbGUgKTtcclxuICAgICAgICBpZiAoIGZzLmxzdGF0U3luYyggY2hpbGQgKS5pc0RpcmVjdG9yeSgpICYmIGZzLmV4aXN0c1N5bmMoIGNoaWxkICkgKSB7XHJcbiAgICAgICAgICB2aXNpdERpciggY2hpbGQgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIGZzLmV4aXN0c1N5bmMoIGNoaWxkICkgJiYgZnMubHN0YXRTeW5jKCBjaGlsZCApLmlzRmlsZSgpICkge1xyXG4gICAgICAgICAgdmlzaXRGaWxlKCBjaGlsZCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG4gICAgfTtcclxuXHJcbiAgICBpZiAoIGZzLmV4aXN0c1N5bmMoIHN0YXJ0ICkgJiYgZnMubHN0YXRTeW5jKCBzdGFydCApLmlzRGlyZWN0b3J5KCkgKSB7XHJcbiAgICAgIHZpc2l0RGlyKCBzdGFydCApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGVuZFRpbWUgPSBEYXRlLm5vdygpO1xyXG4gICAgY29uc3QgZWxhcHNlZCA9IGVuZFRpbWUgLSBzdGFydFRpbWU7XHJcbiAgICBjb25zb2xlLmxvZyggYENsZWFuIHN0YWxlIGNoaXBwZXIvZGlzdC8ke21vZGV9IGZpbGVzIGZpbmlzaGVkIGluIGAgKyBlbGFwc2VkICsgJ21zJyApO1xyXG4gIH1cclxuXHJcbiAgLy8gQHB1YmxpYyBqb2luIGFuZCBub3JtYWxpemUgdGhlIHBhdGhzIChmb3J3YXJkIHNsYXNoZXMgZm9yIGVhc2Ugb2Ygc2VhcmNoIGFuZCByZWFkYWJpbGl0eSlcclxuICBzdGF0aWMgam9pbiggLi4ucGF0aHMgKSB7XHJcbiAgICByZXR1cm4gVHJhbnNwaWxlci5mb3J3YXJkU2xhc2hpZnkoIHBhdGguam9pbiggLi4ucGF0aHMgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVQYXRoXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1vZGUgLSAnanMnIG9yICdjb21tb25qcydcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIHZpc2l0RmlsZVdpdGhNb2RlKCBmaWxlUGF0aCwgbW9kZSApIHtcclxuICAgIGFzc2VydCggbW9kZSA9PT0gJ2pzJyB8fCBtb2RlID09PSAnY29tbW9uanMnLCAnaW52YWxpZCBtb2RlOiAnICsgbW9kZSApO1xyXG4gICAgaWYgKCBfLnNvbWUoIFsgJy5qcycsICcudHMnLCAnLnRzeCcsICcud2dzbCcsICcubWpzJyBdLCBleHRlbnNpb24gPT4gZmlsZVBhdGguZW5kc1dpdGgoIGV4dGVuc2lvbiApICkgJiZcclxuICAgICAgICAgIXRoaXMuaXNQYXRoSWdub3JlZCggZmlsZVBhdGggKSApIHtcclxuXHJcbiAgICAgIGNvbnN0IGNoYW5nZURldGVjdGVkVGltZSA9IERhdGUubm93KCk7XHJcbiAgICAgIGNvbnN0IHRleHQgPSBmcy5yZWFkRmlsZVN5bmMoIGZpbGVQYXRoLCAndXRmLTgnICk7XHJcbiAgICAgIGNvbnN0IGhhc2ggPSBjcnlwdG8uY3JlYXRlSGFzaCggJ21kNScgKS51cGRhdGUoIHRleHQgKS5kaWdlc3QoICdoZXgnICk7XHJcblxyXG4gICAgICAvLyBJZiB0aGUgZmlsZSBoYXMgY2hhbmdlZCwgdHJhbnNwaWxlIGFuZCB1cGRhdGUgdGhlIGNhY2hlLiAgV2UgaGF2ZSB0byBjaG9vc2Ugb24gdGhlIHNwZWN0cnVtIGJldHdlZW4gc2FmZXR5XHJcbiAgICAgIC8vIGFuZCBwZXJmb3JtYW5jZS4gIEluIG9yZGVyIHRvIG1haW50YWluIGhpZ2ggcGVyZm9ybWFuY2Ugd2l0aCBhIGxvdyBlcnJvciByYXRlLCB3ZSBvbmx5IHdyaXRlIHRoZSB0cmFuc3BpbGVkIGZpbGVcclxuICAgICAgLy8gaWYgKGEpIHRoZSBjYWNoZSBpcyBvdXQgb2YgZGF0ZSAoYikgdGhlcmUgaXMgbm8gdGFyZ2V0IGZpbGUgYXQgYWxsIG9yIChjKSBpZiB0aGUgdGFyZ2V0IGZpbGUgaGFzIGJlZW4gbW9kaWZpZWQuXHJcbiAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBUcmFuc3BpbGVyLmdldFRhcmdldFBhdGgoIGZpbGVQYXRoLCBtb2RlICk7XHJcblxyXG4gICAgICBjb25zdCBzdGF0dXNLZXkgPSBnZXRTdGF0dXNLZXkoIGZpbGVQYXRoLCBtb2RlICk7XHJcblxyXG4gICAgICBpZiAoXHJcbiAgICAgICAgIXRoaXMuc3RhdHVzWyBzdGF0dXNLZXkgXSB8fFxyXG4gICAgICAgIHRoaXMuc3RhdHVzWyBzdGF0dXNLZXkgXS5zb3VyY2VNRDUgIT09IGhhc2ggfHxcclxuICAgICAgICAhZnMuZXhpc3RzU3luYyggdGFyZ2V0UGF0aCApIHx8XHJcbiAgICAgICAgdGhpcy5zdGF0dXNbIHN0YXR1c0tleSBdLnRhcmdldE1pbGxpc2Vjb25kcyAhPT0gVHJhbnNwaWxlci5tb2RpZmllZFRpbWVNaWxsaXNlY29uZHMoIHRhcmdldFBhdGggKVxyXG4gICAgICApIHtcclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGxldCByZWFzb24gPSAnJztcclxuICAgICAgICAgIGlmICggdGhpcy52ZXJib3NlICkge1xyXG4gICAgICAgICAgICByZWFzb24gPSAoICF0aGlzLnN0YXR1c1sgc3RhdHVzS2V5IF0gKSA/ICcgKG5vdCBjYWNoZWQpJyA6XHJcbiAgICAgICAgICAgICAgICAgICAgICggdGhpcy5zdGF0dXNbIHN0YXR1c0tleSBdLnNvdXJjZU1ENSAhPT0gaGFzaCApID8gJyAoY2hhbmdlZCknIDpcclxuICAgICAgICAgICAgICAgICAgICAgKCAhZnMuZXhpc3RzU3luYyggdGFyZ2V0UGF0aCApICkgPyAnIChubyB0YXJnZXQpJyA6XHJcbiAgICAgICAgICAgICAgICAgICAgICggdGhpcy5zdGF0dXNbIHN0YXR1c0tleSBdLnRhcmdldE1pbGxpc2Vjb25kcyAhPT0gVHJhbnNwaWxlci5tb2RpZmllZFRpbWVNaWxsaXNlY29uZHMoIHRhcmdldFBhdGggKSApID8gJyAodGFyZ2V0IG1vZGlmaWVkKScgOlxyXG4gICAgICAgICAgICAgICAgICAgICAnPz8/JztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHRoaXMudHJhbnNwaWxlRnVuY3Rpb24oIGZpbGVQYXRoLCB0YXJnZXRQYXRoLCB0ZXh0LCBtb2RlICk7XHJcblxyXG4gICAgICAgICAgdGhpcy5zdGF0dXNbIHN0YXR1c0tleSBdID0ge1xyXG4gICAgICAgICAgICBzb3VyY2VNRDU6IGhhc2gsXHJcbiAgICAgICAgICAgIHRhcmdldE1pbGxpc2Vjb25kczogVHJhbnNwaWxlci5tb2RpZmllZFRpbWVNaWxsaXNlY29uZHMoIHRhcmdldFBhdGggKVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoIHN0YXR1c1BhdGgsIEpTT04uc3RyaW5naWZ5KCB0aGlzLnN0YXR1cywgbnVsbCwgMiApICk7XHJcbiAgICAgICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgICAgY29uc3Qgbm93VGltZVN0cmluZyA9IG5ldyBEYXRlKCBub3cgKS50b0xvY2FsZVRpbWVTdHJpbmcoKTtcclxuXHJcbiAgICAgICAgICAhdGhpcy5zaWxlbnQgJiYgY29uc29sZS5sb2coIGAke25vd1RpbWVTdHJpbmd9LCAkeyggbm93IC0gY2hhbmdlRGV0ZWN0ZWRUaW1lICl9IG1zOiAke2ZpbGVQYXRofSAke21vZGV9JHtyZWFzb259YCApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCggZSApIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCBlICk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggJ0VSUk9SJyApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRm9yICoudHMgYW5kICouanMgZmlsZXMsIGNoZWNrcyBpZiB0aGV5IGhhdmUgY2hhbmdlZCBmaWxlIGNvbnRlbnRzIHNpbmNlIGxhc3QgdHJhbnNwaWxlLiAgSWYgc28sIHRoZVxyXG4gICAqIGZpbGUgaXMgdHJhbnNwaWxlZC5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZVBhdGhcclxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBtb2RlcyAtIHNvbWUgb2YgJ2pzJywnY29tbW9uanMnXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICB2aXNpdEZpbGUoIGZpbGVQYXRoLCBtb2RlcyApIHtcclxuICAgIGFzc2VydCggQXJyYXkuaXNBcnJheSggbW9kZXMgKSwgJ2ludmFsaWQgbW9kZXM6ICcgKyBtb2RlcyApO1xyXG4gICAgbW9kZXMuZm9yRWFjaCggbW9kZSA9PiB0aGlzLnZpc2l0RmlsZVdpdGhNb2RlKCBmaWxlUGF0aCwgbW9kZSApICk7XHJcbiAgfVxyXG5cclxuICAvLyBAcHJpdmF0ZSAtIFJlY3Vyc2l2ZWx5IHZpc2l0IGEgZGlyZWN0b3J5IGZvciBmaWxlcyB0byB0cmFuc3BpbGVcclxuICB2aXNpdERpcmVjdG9yeSggZGlyLCBtb2RlcyApIHtcclxuICAgIGFzc2VydCggQXJyYXkuaXNBcnJheSggbW9kZXMgKSwgJ2ludmFsaWQgbW9kZXM6ICcgKyBtb2RlcyApO1xyXG4gICAgaWYgKCBmcy5leGlzdHNTeW5jKCBkaXIgKSApIHtcclxuICAgICAgY29uc3QgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyggZGlyICk7XHJcbiAgICAgIGZpbGVzLmZvckVhY2goIGZpbGUgPT4ge1xyXG4gICAgICAgIGNvbnN0IGNoaWxkID0gVHJhbnNwaWxlci5qb2luKCBkaXIsIGZpbGUgKTtcclxuXHJcbiAgICAgICAgYXNzZXJ0KCAhY2hpbGQuZW5kc1dpdGgoICcvZGlzdCcgKSwgJ0ludmFsaWQgcGF0aDogJyArIGNoaWxkICsgJyBzaG91bGQgbm90IGJlIGluIGRpc3QgZGlyZWN0b3J5LicgKTtcclxuXHJcbiAgICAgICAgaWYgKCBmcy5sc3RhdFN5bmMoIGNoaWxkICkuaXNEaXJlY3RvcnkoKSApIHtcclxuICAgICAgICAgIHRoaXMudmlzaXREaXJlY3RvcnkoIGNoaWxkLCBtb2RlcyApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHRoaXMudmlzaXRGaWxlKCBjaGlsZCwgbW9kZXMgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIEBwcml2YXRlXHJcbiAgaXNQYXRoSWdub3JlZCggZmlsZVBhdGggKSB7XHJcbiAgICBjb25zdCB3aXRoRm9yd2FyZFNsYXNoZXMgPSBUcmFuc3BpbGVyLmZvcndhcmRTbGFzaGlmeSggZmlsZVBhdGggKTtcclxuXHJcbiAgICB0cnkge1xyXG5cclxuICAgICAgLy8gaWdub3JlIGRpcmVjdG9yaWVzLCBqdXN0IGNhcmUgYWJvdXQgaW5kaXZpZHVhbCBmaWxlc1xyXG4gICAgICAvLyBUcnkgY2F0Y2ggYmVjYXVzZSB0aGVyZSBjYW4gc3RpbGwgYmUgYSByYWNlIGNvbmRpdGlvbiBiZXR3ZWVuIGNoZWNraW5nIGFuZCBsc3RhdHRpbmcuIFRoaXMgY292ZXJzIGVub3VnaCBjYXNlc1xyXG4gICAgICAvLyB0aG91Z2ggdG8gc3RpbGwga2VlcCBpdCBpbi5cclxuICAgICAgaWYgKCBmcy5leGlzdHNTeW5jKCBmaWxlUGF0aCApICYmIGZzLmxzdGF0U3luYyggZmlsZVBhdGggKS5pc0RpcmVjdG9yeSgpICkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBjYXRjaCggZSApIHsgLyogaWdub3JlIHBsZWFzZSAqLyB9XHJcblxyXG4gICAgcmV0dXJuIHdpdGhGb3J3YXJkU2xhc2hlcy5pbmNsdWRlcyggJy9ub2RlX21vZHVsZXMnICkgfHxcclxuICAgICAgICAgICB3aXRoRm9yd2FyZFNsYXNoZXMuaW5jbHVkZXMoICcuZ2l0LycgKSB8fFxyXG4gICAgICAgICAgIHdpdGhGb3J3YXJkU2xhc2hlcy5pbmNsdWRlcyggJy9idWlsZC8nICkgfHxcclxuICAgICAgICAgICB3aXRoRm9yd2FyZFNsYXNoZXMuaW5jbHVkZXMoICdjaGlwcGVyL2Rpc3QvJyApIHx8XHJcbiAgICAgICAgICAgd2l0aEZvcndhcmRTbGFzaGVzLmluY2x1ZGVzKCAndHJhbnNwaWxlL2NhY2hlL3N0YXR1cy5qc29uJyApIHx8XHJcblxyXG4gICAgICAgICAgIC8vIFRlbXBvcmFyeSBmaWxlcyBzb21ldGltZXMgc2F2ZWQgYnkgdGhlIElERVxyXG4gICAgICAgICAgIHdpdGhGb3J3YXJkU2xhc2hlcy5lbmRzV2l0aCggJ34nICkgfHxcclxuXHJcbiAgICAgICAgICAgLy8gZXNsaW50IGNhY2hlIGZpbGVzXHJcbiAgICAgICAgICAgd2l0aEZvcndhcmRTbGFzaGVzLmluY2x1ZGVzKCAnL2NoaXBwZXIvZXNsaW50L2NhY2hlLycgKSB8fFxyXG4gICAgICAgICAgIHdpdGhGb3J3YXJkU2xhc2hlcy5pbmNsdWRlcyggJy9wZXJlbm5pYWwtYWxpYXMvbG9ncy8nICkgfHxcclxuICAgICAgICAgICB3aXRoRm9yd2FyZFNsYXNoZXMuZW5kc1dpdGgoICcuZXNsaW50Y2FjaGUnICk7XHJcbiAgfVxyXG5cclxuICAvLyBAcHJpdmF0ZVxyXG4gIHN0YXRpYyBmb3J3YXJkU2xhc2hpZnkoIGZpbGVQYXRoICkge1xyXG4gICAgcmV0dXJuIGZpbGVQYXRoLnNwbGl0KCAnXFxcXCcgKS5qb2luKCAnLycgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyYW5zcGlsZSB0aGUgc3BlY2lmaWVkIHJlcG9zXHJcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gcmVwb3NcclxuICAgKiBAcHVibGljXHJcbiAgICovXHJcbiAgdHJhbnNwaWxlUmVwb3MoIHJlcG9zICkge1xyXG4gICAgYXNzZXJ0KCBBcnJheS5pc0FycmF5KCByZXBvcyApLCAncmVwb3Mgc2hvdWxkIGJlIGFuIGFycmF5JyApO1xyXG4gICAgcmVwb3MuZm9yRWFjaCggcmVwbyA9PiB0aGlzLnRyYW5zcGlsZVJlcG8oIHJlcG8gKSApO1xyXG4gIH1cclxuXHJcbiAgLy8gQHB1YmxpYyAtIFZpc2l0IGFsbCB0aGUgc3ViZGlyZWN0b3JpZXMgaW4gYSByZXBvIHRoYXQgbmVlZCB0cmFuc3BpbGF0aW9uIGZvciB0aGUgc3BlY2lmaWVkIG1vZGVzXHJcbiAgdHJhbnNwaWxlUmVwb1dpdGhNb2RlcyggcmVwbywgbW9kZXMgKSB7XHJcbiAgICBhc3NlcnQoIEFycmF5LmlzQXJyYXkoIG1vZGVzICksICdtb2RlcyBzaG91bGQgYmUgYW4gYXJyYXknICk7XHJcbiAgICBzdWJkaXJzLmZvckVhY2goIHN1YmRpciA9PiB0aGlzLnZpc2l0RGlyZWN0b3J5KCBUcmFuc3BpbGVyLmpvaW4oICcuLicsIHJlcG8sIHN1YmRpciApLCBtb2RlcyApICk7XHJcbiAgICBpZiAoIHJlcG8gPT09ICdzaGVycGEnICkge1xyXG5cclxuICAgICAgLy8gT3VyIHNpbXMgbG9hZCB0aGlzIGFzIGEgbW9kdWxlIHJhdGhlciB0aGFuIGEgcHJlbG9hZCwgc28gd2UgbXVzdCB0cmFuc3BpbGUgaXRcclxuICAgICAgdGhpcy52aXNpdEZpbGUoIFRyYW5zcGlsZXIuam9pbiggJy4uJywgcmVwbywgJ2xpYicsICdnYW1lLXVwLWNhbWVyYS0xLjAuMC5qcycgKSwgbW9kZXMgKTtcclxuICAgICAgdGhpcy52aXNpdEZpbGUoIFRyYW5zcGlsZXIuam9pbiggJy4uJywgcmVwbywgJ2xpYicsICdwYWtvLTIuMC4zLm1pbi5qcycgKSwgbW9kZXMgKTsgLy8gdXNlZCBmb3IgcGhldC1pby13cmFwcGVycyB0ZXN0c1xyXG4gICAgICB0aGlzLnZpc2l0RmlsZSggVHJhbnNwaWxlci5qb2luKCAnLi4nLCByZXBvLCAnbGliJywgJ2JpZy02LjIuMS5tanMnICksIG1vZGVzICk7IC8vIGZvciBjb25zaXN0ZW50LCBjcm9zcy1icm93c2VyIG51bWJlciBvcGVyYXRpb25zICh0aGFua3MgamF2YXNjcmlwdClcclxuICAgICAgT2JqZWN0LmtleXMoIHdlYnBhY2tHbG9iYWxMaWJyYXJpZXMgKS5mb3JFYWNoKCBrZXkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGxpYnJhcnlGaWxlUGF0aCA9IHdlYnBhY2tHbG9iYWxMaWJyYXJpZXNbIGtleSBdO1xyXG4gICAgICAgIHRoaXMudmlzaXRGaWxlKCBUcmFuc3BpbGVyLmpvaW4oICcuLicsIC4uLmxpYnJhcnlGaWxlUGF0aC5zcGxpdCggJy8nICkgKSwgbW9kZXMgKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHJlcG8gPT09ICdicmFuZCcgKSB7XHJcbiAgICAgIHRoaXMudmlzaXREaXJlY3RvcnkoIFRyYW5zcGlsZXIuam9pbiggJy4uJywgcmVwbywgJ3BoZXQnICksIG1vZGVzICk7XHJcbiAgICAgIHRoaXMudmlzaXREaXJlY3RvcnkoIFRyYW5zcGlsZXIuam9pbiggJy4uJywgcmVwbywgJ3BoZXQtaW8nICksIG1vZGVzICk7XHJcbiAgICAgIHRoaXMudmlzaXREaXJlY3RvcnkoIFRyYW5zcGlsZXIuam9pbiggJy4uJywgcmVwbywgJ2FkYXB0ZWQtZnJvbS1waGV0JyApLCBtb2RlcyApO1xyXG5cclxuICAgICAgdGhpcy5icmFuZHMuZm9yRWFjaCggYnJhbmQgPT4gdGhpcy52aXNpdERpcmVjdG9yeSggVHJhbnNwaWxlci5qb2luKCAnLi4nLCByZXBvLCBicmFuZCApLCBtb2RlcyApICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBAcHVibGljIC0gVmlzaXQgYWxsIHRoZSBzdWJkaXJlY3RvcmllcyBpbiBhIHJlcG8gdGhhdCBuZWVkIHRyYW5zcGlsYXRpb25cclxuICB0cmFuc3BpbGVSZXBvKCByZXBvICkge1xyXG4gICAgdGhpcy50cmFuc3BpbGVSZXBvV2l0aE1vZGVzKCByZXBvLCBnZXRNb2Rlc0ZvclJlcG8oIHJlcG8gKSApO1xyXG4gIH1cclxuXHJcbiAgLy8gQHB1YmxpY1xyXG4gIHRyYW5zcGlsZUFsbCgpIHtcclxuICAgIHRoaXMudHJhbnNwaWxlUmVwb3MoIFsgLi4udGhpcy5hY3RpdmVSZXBvcywgLi4udGhpcy5yZXBvcyBdICk7XHJcbiAgfVxyXG5cclxuICAvLyBAcHJpdmF0ZVxyXG4gIHNhdmVDYWNoZSgpIHtcclxuICAgIGZzLndyaXRlRmlsZVN5bmMoIHN0YXR1c1BhdGgsIEpTT04uc3RyaW5naWZ5KCB0aGlzLnN0YXR1cywgbnVsbCwgMiApICk7XHJcbiAgfVxyXG5cclxuICAvLyBAcHVibGljXHJcbiAgd2F0Y2goKSB7XHJcblxyXG4gICAgLy8gSW52YWxpZGF0ZSBjYWNoZXMgd2hlbiB3ZSBzdGFydCB3YXRjaGluZ1xyXG4gICAgQ2FjaGVMYXllci51cGRhdGVMYXN0Q2hhbmdlZFRpbWVzdGFtcCgpO1xyXG5cclxuICAgIC8vIEZvciBjb29yZGluYXRpb24gd2l0aCBDYWNoZUxheWVyLCBjbGVhciB0aGUgY2FjaGUgd2hpbGUgd2UgYXJlIG5vdCB3YXRjaGluZyBmb3IgZmlsZSBjaGFuZ2VzXHJcbiAgICAvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNDAzMTc2My9kb2luZy1hLWNsZWFudXAtYWN0aW9uLWp1c3QtYmVmb3JlLW5vZGUtanMtZXhpdHNcclxuICAgIHByb2Nlc3Muc3RkaW4ucmVzdW1lKCk7Ly9zbyB0aGUgcHJvZ3JhbSB3aWxsIG5vdCBjbG9zZSBpbnN0YW50bHlcclxuXHJcbiAgICBmdW5jdGlvbiBleGl0SGFuZGxlciggb3B0aW9ucyApIHtcclxuXHJcbiAgICAgIC8vIE5PVEU6IHRoaXMgZ2V0cyBjYWxsZWQgMnggb24gY3RybC1jIGZvciB1bmtub3duIHJlYXNvbnNcclxuICAgICAgQ2FjaGVMYXllci5jbGVhckxhc3RDaGFuZ2VkVGltZXN0YW1wKCk7XHJcblxyXG4gICAgICBpZiAoIG9wdGlvbnMgJiYgb3B0aW9ucy5leGl0ICkge1xyXG4gICAgICAgIGlmICggb3B0aW9ucy5hcmcgKSB7XHJcbiAgICAgICAgICB0aHJvdyBvcHRpb25zLmFyZztcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJvY2Vzcy5leGl0KCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBkbyBzb21ldGhpbmcgd2hlbiBhcHAgaXMgY2xvc2luZ1xyXG4gICAgcHJvY2Vzcy5vbiggJ2V4aXQnLCAoKSA9PiBleGl0SGFuZGxlcigpICk7XHJcblxyXG4gICAgLy8gY2F0Y2hlcyBjdHJsK2MgZXZlbnRcclxuICAgIHByb2Nlc3Mub24oICdTSUdJTlQnLCAoKSA9PiBleGl0SGFuZGxlciggeyBleGl0OiB0cnVlIH0gKSApO1xyXG5cclxuICAgIC8vIGNhdGNoZXMgXCJraWxsIHBpZFwiIChmb3IgZXhhbXBsZTogbm9kZW1vbiByZXN0YXJ0KVxyXG4gICAgcHJvY2Vzcy5vbiggJ1NJR1VTUjEnLCAoKSA9PiBleGl0SGFuZGxlciggeyBleGl0OiB0cnVlIH0gKSApO1xyXG4gICAgcHJvY2Vzcy5vbiggJ1NJR1VTUjInLCAoKSA9PiBleGl0SGFuZGxlciggeyBleGl0OiB0cnVlIH0gKSApO1xyXG5cclxuICAgIC8vIGNhdGNoZXMgdW5jYXVnaHQgZXhjZXB0aW9uc1xyXG4gICAgcHJvY2Vzcy5vbiggJ3VuY2F1Z2h0RXhjZXB0aW9uJywgZSA9PiBleGl0SGFuZGxlciggeyBhcmc6IGUsIGV4aXQ6IHRydWUgfSApICk7XHJcblxyXG4gICAgZnMud2F0Y2goICcuLicgKyBwYXRoLnNlcCwgeyByZWN1cnNpdmU6IHRydWUgfSwgKCBldmVudFR5cGUsIGZpbGVuYW1lICkgPT4ge1xyXG5cclxuICAgICAgY29uc3QgY2hhbmdlRGV0ZWN0ZWRUaW1lID0gRGF0ZS5ub3coKTtcclxuICAgICAgY29uc3QgZmlsZVBhdGggPSBUcmFuc3BpbGVyLmZvcndhcmRTbGFzaGlmeSggJy4uJyArIHBhdGguc2VwICsgZmlsZW5hbWUgKTtcclxuXHJcbiAgICAgIC8vIFdlIG9ic2VydmVkIGEgbnVsbCBmaWxlbmFtZSBvbiBXaW5kb3dzIGZvciBhbiB1bmtub3duIHJlYXNvbi5cclxuICAgICAgaWYgKCBmaWxlbmFtZSA9PT0gbnVsbCB8fCB0aGlzLmlzUGF0aElnbm9yZWQoIGZpbGVQYXRoICkgKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJbnZhbGlkYXRlIGNhY2hlIHdoZW4gYW55IHJlbGV2YW50IGZpbGUgaGFzIGNoYW5nZWQuXHJcbiAgICAgIENhY2hlTGF5ZXIudXBkYXRlTGFzdENoYW5nZWRUaW1lc3RhbXAoKTtcclxuXHJcbiAgICAgIGNvbnN0IHBhdGhFeGlzdHMgPSBmcy5leGlzdHNTeW5jKCBmaWxlUGF0aCApO1xyXG5cclxuICAgICAgaWYgKCAhcGF0aEV4aXN0cyApIHtcclxuXHJcbiAgICAgICAgY29uc3QgbW9kZXMgPSBbICdqcycsICdjb21tb25qcycgXTtcclxuXHJcbiAgICAgICAgbW9kZXMuZm9yRWFjaCggbW9kZSA9PiB7XHJcbiAgICAgICAgICBjb25zdCB0YXJnZXRQYXRoID0gVHJhbnNwaWxlci5nZXRUYXJnZXRQYXRoKCBmaWxlUGF0aCwgbW9kZSApO1xyXG4gICAgICAgICAgaWYgKCBmcy5leGlzdHNTeW5jKCB0YXJnZXRQYXRoICkgJiYgZnMubHN0YXRTeW5jKCB0YXJnZXRQYXRoICkuaXNGaWxlKCkgKSB7XHJcbiAgICAgICAgICAgIGZzLnVubGlua1N5bmMoIHRhcmdldFBhdGggKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHN0YXR1c0tleSA9IGdldFN0YXR1c0tleSggZmlsZVBhdGgsIG1vZGUgKTtcclxuXHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnN0YXR1c1sgc3RhdHVzS2V5IF07XHJcbiAgICAgICAgICAgIHRoaXMuc2F2ZUNhY2hlKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlYXNvbiA9ICcgKGRlbGV0ZWQpJztcclxuXHJcbiAgICAgICAgICAgICF0aGlzLnNpbGVudCAmJiBjb25zb2xlLmxvZyggYCR7bmV3IERhdGUoIG5vdyApLnRvTG9jYWxlVGltZVN0cmluZygpfSwgJHsoIG5vdyAtIGNoYW5nZURldGVjdGVkVGltZSApfSBtczogJHtmaWxlUGF0aH0ke21vZGV9JHtyZWFzb259YCApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gKTtcclxuXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIGZpbGVQYXRoLmVuZHNXaXRoKCAncGVyZW5uaWFsLWFsaWFzL2RhdGEvYWN0aXZlLXJlcG9zJyApICkge1xyXG4gICAgICAgIGNvbnN0IG5ld0FjdGl2ZVJlcG9zID0gZ2V0QWN0aXZlUmVwb3MoKTtcclxuICAgICAgICAhdGhpcy5zaWxlbnQgJiYgY29uc29sZS5sb2coICdyZWxvYWRlZCBhY3RpdmUgcmVwb3MnICk7XHJcbiAgICAgICAgY29uc3QgbmV3UmVwb3MgPSBuZXdBY3RpdmVSZXBvcy5maWx0ZXIoIHJlcG8gPT4gIXRoaXMuYWN0aXZlUmVwb3MuaW5jbHVkZXMoIHJlcG8gKSApO1xyXG5cclxuICAgICAgICAvLyBSdW4gYW4gaW5pdGlhbCBzY2FuIG9uIG5ld2x5IGFkZGVkIHJlcG9zXHJcbiAgICAgICAgbmV3UmVwb3MuZm9yRWFjaCggcmVwbyA9PiB7XHJcbiAgICAgICAgICAhdGhpcy5zaWxlbnQgJiYgY29uc29sZS5sb2coICdOZXcgcmVwbyBkZXRlY3RlZCBpbiBhY3RpdmUtcmVwb3MsIHRyYW5zcGlsaW5nOiAnICsgcmVwbyApO1xyXG4gICAgICAgICAgdGhpcy50cmFuc3BpbGVSZXBvKCByZXBvICk7XHJcbiAgICAgICAgfSApO1xyXG4gICAgICAgIHRoaXMuYWN0aXZlUmVwb3MgPSBuZXdBY3RpdmVSZXBvcztcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBjb25zdCB0ZXJtcyA9IGZpbGVuYW1lLnNwbGl0KCBwYXRoLnNlcCApO1xyXG4gICAgICAgIGNvbnN0IG15UmVwbyA9IHRlcm1zWyAwIF07XHJcbiAgICAgICAgaWYgKCAoIHRoaXMuYWN0aXZlUmVwb3MuaW5jbHVkZXMoIG15UmVwbyApIHx8IHRoaXMucmVwb3MuaW5jbHVkZXMoIG15UmVwbyApIClcclxuICAgICAgICAgICAgICYmIHN1YmRpcnMuaW5jbHVkZXMoIHRlcm1zWyAxIF0gKSAmJiBwYXRoRXhpc3RzICkge1xyXG4gICAgICAgICAgdGhpcy52aXNpdEZpbGUoIGZpbGVQYXRoLCBnZXRNb2Rlc0ZvclJlcG8oIG15UmVwbyApICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zcGlsZXI7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBLE1BQU1B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