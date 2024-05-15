// Copyright 2013-2024, University of Colorado Boulder

/**
 * Grunt configuration file for PhET projects. In general when possible, modules are imported lazily in their task
 * declaration to save on overall load time of this file. The pattern is to require all modules needed at the top of the
 * grunt task registration. If a module is used in multiple tasks, it is best to lazily require in each
 * task.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

///////////////////////////
// NOTE: to improve performance, the vast majority of modules are lazily imported in task registrations. Even duplicating
// require statements improves the load time of this file noticeably. For details, see https://github.com/phetsims/chipper/issues/1107
const assert = require('assert');
require('./checkNodeVersion');
///////////////////////////

// Allow other Gruntfiles to potentially handle exiting and errors differently`
if (!global.processEventOptOut) {
  // See https://medium.com/@dtinth/making-unhandled-promise-rejections-crash-the-node-js-process-ffc27cfcc9dd for how
  // to get unhandled promise rejections to fail out the node process.
  // Relevant for https://github.com/phetsims/wave-interference/issues/491
  process.on('unhandledRejection', up => {
    throw up;
  });

  // Exit on Ctrl + C case
  process.on('SIGINT', () => {
    console.log('\n\nCaught interrupt signal, exiting');
    process.exit();
  });
}
const Transpiler = require('../common/Transpiler');
const transpiler = new Transpiler({
  silent: true
});
module.exports = function (grunt) {
  const packageObject = grunt.file.readJSON('package.json');

  // Handle the lack of build.json
  let buildLocal;
  try {
    buildLocal = grunt.file.readJSON(`${process.env.HOME}/.phet/build-local.json`);
  } catch (e) {
    buildLocal = {};
  }
  const repo = grunt.option('repo') || packageObject.name;
  assert(typeof repo === 'string' && /^[a-z]+(-[a-z]+)*$/u.test(repo), 'repo name should be composed of lower-case characters, optionally with dashes used as separators');

  /**
   * Wraps a promise's completion with grunt's asynchronous handling, with added helpful failure messages (including
   * stack traces, regardless of whether --stack was provided).
   * @public
   *
   * @param {Promise} promise
   */
  async function wrap(promise) {
    const done = grunt.task.current.async();
    try {
      await promise;
    } catch (e) {
      if (e.stack) {
        grunt.fail.fatal(`Perennial task failed:\n${e.stack}\nFull Error details:\n${e}`);
      }

      // The toString check handles a weird case found from an Error object from puppeteer that doesn't stringify with
      // JSON or have a stack, JSON.stringifies to "{}", but has a `toString` method
      else if (typeof e === 'string' || JSON.stringify(e).length === 2 && e.toString) {
        grunt.fail.fatal(`Perennial task failed: ${e}`);
      } else {
        grunt.fail.fatal(`Perennial task failed with unknown error: ${JSON.stringify(e, null, 2)}`);
      }
    }
    done();
  }

  /**
   * Wraps an async function for a grunt task. Will run the async function when the task should be executed. Will
   * properly handle grunt's async handling, and provides improved error reporting.
   * @public
   *
   * @param {async function} asyncTaskFunction
   */
  function wrapTask(asyncTaskFunction) {
    return () => {
      wrap(asyncTaskFunction());
    };
  }
  grunt.registerTask('default', 'Builds the repository', [...(grunt.option('lint') === false ? [] : ['lint-all']), ...(grunt.option('report-media') === false ? [] : ['report-media']), 'clean', 'build']);
  grunt.registerTask('clean', 'Erases the build/ directory and all its contents, and recreates the build/ directory', wrapTask(async () => {
    const buildDirectory = `../${repo}/build`;
    if (grunt.file.exists(buildDirectory)) {
      grunt.file.delete(buildDirectory);
    }
    grunt.file.mkdir(buildDirectory);
  }));
  grunt.registerTask('build-images', 'Build images only', wrapTask(async () => {
    const jimp = require('jimp');
    const generateThumbnails = require('./generateThumbnails');
    const generateTwitterCard = require('./generateTwitterCard');
    const brand = 'phet';
    grunt.log.writeln(`Building images for brand: ${brand}`);
    const buildDir = `../${repo}/build/${brand}`;
    // Thumbnails and twitter card
    if (grunt.file.exists(`../${repo}/assets/${repo}-screenshot.png`)) {
      const thumbnailSizes = [{
        width: 900,
        height: 591
      }, {
        width: 600,
        height: 394
      }, {
        width: 420,
        height: 276
      }, {
        width: 128,
        height: 84
      }, {
        width: 15,
        height: 10
      }];
      for (const size of thumbnailSizes) {
        grunt.file.write(`${buildDir}/${repo}-${size.width}.png`, await generateThumbnails(repo, size.width, size.height, 100, jimp.MIME_PNG));
      }
      const altScreenshots = grunt.file.expand({
        filter: 'isFile',
        cwd: `../${repo}/assets`
      }, [`./${repo}-screenshot-alt[0123456789].png`]);
      for (const altScreenshot of altScreenshots) {
        const imageNumber = Number(altScreenshot.substr(`./${repo}-screenshot-alt`.length, 1));
        grunt.file.write(`${buildDir}/${repo}-${600}-alt${imageNumber}.png`, await generateThumbnails(repo, 600, 394, 100, jimp.MIME_PNG, `-alt${imageNumber}`));
        grunt.file.write(`${buildDir}/${repo}-${900}-alt${imageNumber}.png`, await generateThumbnails(repo, 900, 591, 100, jimp.MIME_PNG, `-alt${imageNumber}`));
      }
      if (brand === 'phet') {
        grunt.file.write(`${buildDir}/${repo}-ios.png`, await generateThumbnails(repo, 420, 276, 90, jimp.MIME_JPEG));
        grunt.file.write(`${buildDir}/${repo}-twitter-card.png`, await generateTwitterCard(repo));
      }
    }
  }));
  grunt.registerTask('output-js', 'Outputs JS just for the specified repo', wrapTask(async () => {
    transpiler.transpileRepo(repo);
  }));
  grunt.registerTask('output-js-project', 'Outputs JS for the specified repo and its dependencies', wrapTask(async () => {
    const getPhetLibs = require('./getPhetLibs');
    transpiler.transpileRepos(getPhetLibs(repo));
  }));
  grunt.registerTask('output-js-all', 'Outputs JS for all repos', wrapTask(async () => {
    transpiler.transpileAll();
  }));
  grunt.registerTask('build', `Builds the repository. Depending on the repository type (runnable/wrapper/standalone), the result may vary.
Runnable build options:
 --report-media - Will iterate over all of the license.json files and reports any media files, set to false to opt out.
 --brands={{BRANDS} - Can be * (build all supported brands), or a comma-separated list of brand names. Will fall back to using
                      build-local.json's brands (or adapted-from-phet if that does not exist)
 --allHTML - If provided, will include the _all.html file (if it would not otherwise be built, e.g. phet brand)
 --XHTML - Includes an xhtml/ directory in the build output that contains a runnable XHTML form of the sim (with
           a separated-out JS file).
 --locales={{LOCALES}} - Can be * (build all available locales, "en" and everything in babel), or a comma-separated list of locales
 --noTranspile - Flag to opt out of transpiling repos before build. This should only be used if you are confident that chipper/dist is already correct (to save time).
 --noTSC - Flag to opt out of type checking before build. This should only be used if you are confident that TypeScript is already errorless (to save time).
 --encodeStringMap=false - Disables the encoding of the string map in the built file. This is useful for debugging.
 
Minify-specific options: 
 --minify.babelTranspile=false - Disables babel transpilation phase.
 --minify.uglify=false - Disables uglification, so the built file will include (essentially) concatenated source files.
 --minify.mangle=false - During uglification, it will not "mangle" variable names (where they get renamed to short constants to reduce file size.)
 --minify.beautify=true - After uglification, the source code will be syntax formatted nicely
 --minify.stripAssertions=false - During uglification, it will strip assertions.
 --minify.stripLogging=false - During uglification, it will not strip logging statements.
 `, wrapTask(async () => {
    const buildStandalone = require('./buildStandalone');
    const buildRunnable = require('./buildRunnable');
    const minify = require('./minify');
    const tsc = require('./tsc');
    const reportTscResults = require('./reportTscResults');
    const path = require('path');
    const fs = require('fs');
    const getPhetLibs = require('./getPhetLibs');
    const phetTimingLog = require('../../../perennial-alias/js/common/phetTimingLog');
    await phetTimingLog.startAsync('grunt-build', async () => {
      // Parse minification keys
      const minifyKeys = Object.keys(minify.MINIFY_DEFAULTS);
      const minifyOptions = {};
      minifyKeys.forEach(minifyKey => {
        const option = grunt.option(`minify.${minifyKey}`);
        if (option === true || option === false) {
          minifyOptions[minifyKey] = option;
        }
      });
      const repoPackageObject = grunt.file.readJSON(`../${repo}/package.json`);

      // Run the type checker first.
      const brands = getBrands(grunt, repo, buildLocal);
      !grunt.option('noTSC') && (await phetTimingLog.startAsync('tsc', async () => {
        // We must have phet-io code checked out to type check, since simLauncher imports phetioEngine
        if (brands.includes('phet-io') || brands.includes('phet')) {
          const results = await tsc(`../${repo}`);
          reportTscResults(results, grunt);
        } else {
          grunt.log.writeln('skipping type checking');
        }
      }));
      !grunt.option('noTranspile') && (await phetTimingLog.startAsync('transpile', () => {
        // If that succeeds, then convert the code to JS
        transpiler.transpileRepos(getPhetLibs(repo));
      }));

      // standalone
      if (repoPackageObject.phet.buildStandalone) {
        grunt.log.writeln('Building standalone repository');
        const parentDir = `../${repo}/build/`;
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir);
        }
        fs.writeFileSync(`${parentDir}/${repo}.min.js`, await buildStandalone(repo, minifyOptions));

        // Build a debug version
        minifyOptions.minify = false;
        minifyOptions.babelTranspile = false;
        minifyOptions.uglify = false;
        minifyOptions.isDebug = true;
        fs.writeFileSync(`${parentDir}/${repo}.debug.js`, await buildStandalone(repo, minifyOptions, true));
        if (repoPackageObject.phet.standaloneTranspiles) {
          for (const file of repoPackageObject.phet.standaloneTranspiles) {
            fs.writeFileSync(`../${repo}/build/${path.basename(file)}`, minify(grunt.file.read(file)));
          }
        }
      } else {
        const localPackageObject = grunt.file.readJSON(`../${repo}/package.json`);
        assert(localPackageObject.phet.runnable, `${repo} does not appear to be runnable`);
        grunt.log.writeln(`Building runnable repository (${repo}, brands: ${brands.join(', ')})`);

        // Other options
        const allHTML = !!grunt.option('allHTML');
        const encodeStringMap = grunt.option('encodeStringMap') !== false;
        const compressScripts = !!grunt.option('compressScripts');
        const profileFileSize = !!grunt.option('profileFileSize');
        const localesOption = grunt.option('locales') || 'en'; // Default back to English for now

        for (const brand of brands) {
          grunt.log.writeln(`Building brand: ${brand}`);
          await phetTimingLog.startAsync('build-brand-' + brand, async () => {
            await buildRunnable(repo, minifyOptions, allHTML, brand, localesOption, buildLocal, encodeStringMap, compressScripts, profileFileSize);
          });
        }
      }
    });
  }));
  grunt.registerTask('generate-used-strings-file', 'Writes used strings to phet-io-sim-specific/ so that PhET-iO sims only output relevant strings to the API in unbuilt mode', wrapTask(async () => {
    const getPhetLibs = require('./getPhetLibs');
    const fs = require('fs');
    const webpackBuild = require('./webpackBuild');
    const ChipperConstants = require('../common/ChipperConstants');
    const getLocalesFromRepository = require('./getLocalesFromRepository');
    const getStringMap = require('./getStringMap');
    transpiler.transpileRepos(getPhetLibs(repo));
    const webpackResult = await webpackBuild(repo, 'phet');
    const phetLibs = getPhetLibs(repo, 'phet');
    const allLocales = [ChipperConstants.FALLBACK_LOCALE, ...getLocalesFromRepository(repo)];
    const {
      stringMap
    } = getStringMap(repo, allLocales, phetLibs, webpackResult.usedModules);

    // TODO: https://github.com/phetsims/phet-io/issues/1877 This is only pertinent for phet-io, so I'm outputting
    // it to phet-io-sim-specific.  But none of intrinsic data is phet-io-specific.
    // Do we want a different path for it?
    // TODO: https://github.com/phetsims/phet-io/issues/1877 How do we indicate that it is a build artifact, and
    // should not be manually updated?
    fs.writeFileSync(`../phet-io-sim-specific/repos/${repo}/used-strings_en.json`, JSON.stringify(stringMap.en, null, 2));
  }));
  grunt.registerTask('build-for-server', 'meant for use by build-server only', ['build']);
  grunt.registerTask('lint', `lint js files. Options:
--disable-eslint-cache: cache will not be read from, and cache will be cleared for next run.
--fix: autofixable changes will be written to disk
--chip-away: output a list of responsible devs for each repo with lint problems
--repos: comma separated list of repos to lint in addition to the repo from running`, wrapTask(async () => {
    const lint = require('./lint');

    // --disable-eslint-cache disables the cache, useful for developing rules
    const cache = !grunt.option('disable-eslint-cache');
    const fix = grunt.option('fix');
    const chipAway = grunt.option('chip-away');
    const extraRepos = grunt.option('repos') ? grunt.option('repos').split(',') : [];
    const lintReturnValue = await lint([repo, ...extraRepos], {
      cache: cache,
      fix: fix,
      chipAway: chipAway
    });
    if (!lintReturnValue.ok) {
      grunt.fail.fatal('Lint failed');
    }
  }));
  grunt.registerTask('lint-all', 'lint all js files that are required to build this repository (for the specified brands)', wrapTask(async () => {
    const lint = require('./lint');

    // --disable-eslint-cache disables the cache, useful for developing rules
    const cache = !grunt.option('disable-eslint-cache');
    const fix = grunt.option('fix');
    const chipAway = grunt.option('chip-away');
    assert && assert(!grunt.option('patterns'), 'patterns not support for lint-all');
    const getPhetLibs = require('./getPhetLibs');
    const brands = getBrands(grunt, repo, buildLocal);
    const lintReturnValue = await lint(getPhetLibs(repo, brands), {
      cache: cache,
      fix: fix,
      chipAway: chipAway
    });

    // Output results on errors.
    if (!lintReturnValue.ok) {
      grunt.fail.fatal('Lint failed');
    }
  }));
  grunt.registerTask('generate-development-html', 'Generates top-level SIM_en.html file based on the preloads in package.json.', wrapTask(async () => {
    const generateDevelopmentHTML = require('./generateDevelopmentHTML');
    await generateDevelopmentHTML(repo);
  }));
  grunt.registerTask('generate-test-html', 'Generates top-level SIM-tests.html file based on the preloads in package.json.  See https://github.com/phetsims/aqua/blob/main/doc/adding-unit-tests.md ' + 'for more information on automated testing. Usually you should ' + 'set the "generatedUnitTests":true flag in the sim package.json and run `grunt update` instead of manually generating this.', wrapTask(async () => {
    const generateTestHTML = require('./generateTestHTML');
    await generateTestHTML(repo);
  }));
  grunt.registerTask('generate-a11y-view-html', 'Generates top-level SIM-a11y-view.html file used for visualizing accessible content. Usually you should ' + 'set the "phet.simFeatures.supportsInteractiveDescription":true flag in the sim package.json and run `grunt update` ' + 'instead of manually generating this.', wrapTask(async () => {
    const generateA11yViewHTML = require('./generateA11yViewHTML');
    await generateA11yViewHTML(repo);
  }));
  grunt.registerTask('update', `
Updates the normal automatically-generated files for this repository. Includes:
  * runnables: generate-development-html and modulify
  * accessible runnables: generate-a11y-view-html
  * unit tests: generate-test-html
  * simulations: generateREADME()
  * phet-io simulations: generate overrides file if needed
  * create the conglomerate string files for unbuilt mode, for this repo and its dependencies`, wrapTask(async () => {
    const generateREADME = require('./generateREADME');
    const fs = require('fs');
    const _ = require('lodash');

    // support repos that don't have a phet object
    if (!packageObject.phet) {
      return;
    }

    // modulify is graceful if there are no files that need modulifying.
    grunt.task.run('modulify');

    // update README.md only for simulations
    if (packageObject.phet.simulation && !packageObject.phet.readmeCreatedManually) {
      await generateREADME(repo, !!packageObject.phet.published);
    }
    if (packageObject.phet.supportedBrands && packageObject.phet.supportedBrands.includes('phet-io')) {
      // Copied from build.json and used as a preload for phet-io brand
      const overridesFile = `js/${repo}-phet-io-overrides.js`;

      // If there is already an overrides file, don't overwrite it with an empty one
      if (!fs.existsSync(`../${repo}/${overridesFile}`)) {
        const writeFileAndGitAdd = require('../../../perennial-alias/js/common/writeFileAndGitAdd');
        const overridesContent = '/* eslint-disable */\nwindow.phet.preloads.phetio.phetioElementsOverrides = {};';
        await writeFileAndGitAdd(repo, overridesFile, overridesContent);
      }
      let simSpecificWrappers;
      try {
        // Populate sim-specific wrappers into the package.json
        simSpecificWrappers = fs.readdirSync(`../phet-io-sim-specific/repos/${repo}/wrappers/`, {
          withFileTypes: true
        }).filter(dirent => dirent.isDirectory()).map(dirent => `phet-io-sim-specific/repos/${repo}/wrappers/${dirent.name}`);
        if (simSpecificWrappers.length > 0) {
          packageObject.phet['phet-io'] = packageObject.phet['phet-io'] || {};
          packageObject.phet['phet-io'].wrappers = _.uniq(simSpecificWrappers.concat(packageObject.phet['phet-io'].wrappers || []));
          grunt.file.write('package.json', JSON.stringify(packageObject, null, 2));
        }
      } catch (e) {
        if (!e.message.includes('no such file or directory')) {
          throw e;
        }
      }
    }

    // The above code can mutate the package.json, so do these after
    if (packageObject.phet.runnable) {
      grunt.task.run('generate-development-html');
      if (packageObject.phet.simFeatures && packageObject.phet.simFeatures.supportsInteractiveDescription) {
        grunt.task.run('generate-a11y-view-html');
      }
    }
    if (packageObject.phet.generatedUnitTests) {
      grunt.task.run('generate-test-html');
    }
  }));

  // This is not run in grunt update because it affects dependencies and outputs files outside of the repo.
  grunt.registerTask('generate-development-strings', 'To support locales=* in unbuilt mode, generate a conglomerate JSON file for each repo with translations in babel. Run on all repos via:\n' + '* for-each.sh perennial-alias/data/active-repos npm install\n' + '* for-each.sh perennial-alias/data/active-repos grunt generate-development-strings', wrapTask(async () => {
    const generateDevelopmentStrings = require('../scripts/generateDevelopmentStrings');
    const fs = require('fs');
    if (fs.existsSync(`../${repo}/${repo}-strings_en.json`)) {
      generateDevelopmentStrings(repo);
    }
  }));
  grunt.registerTask('published-README', 'Generates README.md file for a published simulation.', wrapTask(async () => {
    const generateREADME = require('./generateREADME'); // used by multiple tasks
    await generateREADME(repo, true /* published */);
  }));
  grunt.registerTask('unpublished-README', 'Generates README.md file for an unpublished simulation.', wrapTask(async () => {
    const generateREADME = require('./generateREADME'); // used by multiple tasks
    await generateREADME(repo, false /* published */);
  }));
  grunt.registerTask('sort-imports', 'Sort the import statements for a single file (if --file={{FILE}} is provided), or does so for all JS files if not specified', wrapTask(async () => {
    const sortImports = require('./sortImports');
    const file = grunt.option('file');
    if (file) {
      sortImports(file);
    } else {
      grunt.file.recurse(`../${repo}/js`, absfile => sortImports(absfile));
    }
  }));
  grunt.registerTask('commits-since', 'Shows commits since a specified date. Use --date=<date> to specify the date.', wrapTask(async () => {
    const dateString = grunt.option('date');
    assert(dateString, 'missing required option: --date={{DATE}}');
    const commitsSince = require('./commitsSince');
    await commitsSince(repo, dateString);
  }));

  // See reportMedia.js
  grunt.registerTask('report-media', '(project-wide) Report on license.json files throughout all working copies. ' + 'Reports any media (such as images or sound) files that have any of the following problems:\n' + '(1) incompatible-license (resource license not approved)\n' + '(2) not-annotated (license.json missing or entry missing from license.json)\n' + '(3) missing-file (entry in the license.json but not on the file system)', wrapTask(async () => {
    const reportMedia = require('./reportMedia');
    await reportMedia(repo);
  }));

  // see reportThirdParty.js
  grunt.registerTask('report-third-party', 'Creates a report of third-party resources (code, images, sound, etc) used in the published PhET simulations by ' + 'reading the license information in published HTML files on the PhET website. This task must be run from main.  ' + 'After running this task, you must push sherpa/third-party-licenses.md.', wrapTask(async () => {
    const reportThirdParty = require('./reportThirdParty');
    await reportThirdParty();
  }));
  grunt.registerTask('modulify', 'Creates *.js modules for all images/strings/audio/etc in a repo', wrapTask(async () => {
    const modulify = require('./modulify');
    const reportMedia = require('./reportMedia');
    const generateDevelopmentStrings = require('../scripts/generateDevelopmentStrings');
    const fs = require('fs');
    await modulify(repo);
    if (fs.existsSync(`../${repo}/${repo}-strings_en.json`)) {
      generateDevelopmentStrings(repo);
    }

    // Do this last to help with prototyping before commit (it would be frustrating if this errored out before giving
    // you the asset you could use in the sim).
    await reportMedia(repo);
  }));

  // Grunt task that determines created and last modified dates from git, and
  // updates copyright statements accordingly, see #403
  grunt.registerTask('update-copyright-dates', 'Update the copyright dates in JS source files based on Github dates', wrapTask(async () => {
    const updateCopyrightDates = require('./updateCopyrightDates');
    await updateCopyrightDates(repo);
  }));
  grunt.registerTask('webpack-dev-server', `Runs a webpack server for a given list of simulations.
--repos=REPOS for a comma-separated list of repos (defaults to current repo)
--port=9000 to adjust the running port
--devtool=string value for sourcemap generation specified at https://webpack.js.org/configuration/devtool or undefined for (none)
--chrome: open the sims in Chrome tabs (Mac)`, () => {
    // We don't finish! Don't tell grunt this...
    grunt.task.current.async();
    const repos = grunt.option('repos') ? grunt.option('repos').split(',') : [repo];
    const port = grunt.option('port') || 9000;
    let devtool = grunt.option('devtool') || 'inline-source-map';
    if (devtool === 'none' || devtool === 'undefined') {
      devtool = undefined;
    }
    const openChrome = grunt.option('chrome') || false;
    const webpackDevServer = require('./webpackDevServer');

    // NOTE: We don't care about the promise that is returned here, because we are going to keep this task running
    // until the user manually kills it.
    webpackDevServer(repos, port, devtool, openChrome);
  });
  grunt.registerTask('generate-phet-io-api', 'Output the PhET-iO API as JSON to phet-io-sim-specific/api.\n' + 'Options\n:' + '--sims=... a list of sims to compare (defaults to the sim in the current dir)\n' + '--simList=... a file with a list of sims to compare (defaults to the sim in the current dir)\n' + '--stable - regenerate for all "stable sims" (see perennial/data/phet-io-api-stable/)\n' + '--temporary - outputs to the temporary directory\n' + '--transpile=false - skips the transpilation step. You can skip transpilation if a watch process is handling it.', wrapTask(async () => {
    const formatPhetioAPI = require('../phet-io/formatPhetioAPI');
    const getSimList = require('../common/getSimList');
    const generatePhetioMacroAPI = require('../phet-io/generatePhetioMacroAPI');
    const fs = require('fs');
    const sims = getSimList().length === 0 ? [repo] : getSimList();

    // Ideally transpilation would be a no-op if the watch process is running. However, it can take 2+ seconds on
    // macOS to check all files, and sometimes much longer (50+ seconds) if the cache mechanism is failing.
    // So this "skip" is a band-aid until we reduce those other problems.
    const skipTranspile = grunt.option('transpile') === false;
    if (!skipTranspile) {
      const startTime = Date.now();
      transpiler.transpileAll();
      const transpileTimeMS = Date.now() - startTime;

      // Notify about long transpile times, in case more people need to skip
      if (transpileTimeMS >= 5000) {
        grunt.log.writeln(`generate-phet-io-api transpilation took ${transpileTimeMS} ms`);
      }
    } else {
      grunt.log.writeln('Skipping transpilation');
    }
    const results = await generatePhetioMacroAPI(sims, {
      showProgressBar: sims.length > 1,
      throwAPIGenerationErrors: false // Write as many as we can, and print what we didn't write
    });
    sims.forEach(sim => {
      const dir = `../phet-io-sim-specific/repos/${sim}`;
      try {
        fs.mkdirSync(dir);
      } catch (e) {
        // Directory exists
      }
      const filePath = `${dir}/${sim}-phet-io-api${grunt.option('temporary') ? '-temporary' : ''}.json`;
      const api = results[sim];
      api && fs.writeFileSync(filePath, formatPhetioAPI(api));
    });
  }));
  grunt.registerTask('compare-phet-io-api', 'Compares the phet-io-api against the reference version(s) if this sim\'s package.json marks compareDesignedAPIChanges.  ' + 'This will by default compare designed changes only. Options:\n' + '--sims=... a list of sims to compare (defaults to the sim in the current dir)\n' + '--simList=... a file with a list of sims to compare (defaults to the sim in the current dir)\n' + '--stable, generate the phet-io-apis for each phet-io sim considered to have a stable API (see perennial-alias/data/phet-io-api-stable)\n' + '--delta, by default a breaking-compatibility comparison is done, but --delta shows all changes\n' + '--temporary, compares API files in the temporary directory (otherwise compares to freshly generated APIs)\n' + '--compareBreakingAPIChanges - add this flag to compare breaking changes in addition to designed changes', wrapTask(async () => {
    const getSimList = require('../common/getSimList');
    const generatePhetioMacroAPI = require('../phet-io/generatePhetioMacroAPI');
    const fs = require('fs');
    const sims = getSimList().length === 0 ? [repo] : getSimList();
    const temporary = grunt.option('temporary');
    let proposedAPIs = null;
    if (temporary) {
      proposedAPIs = {};
      sims.forEach(sim => {
        proposedAPIs[sim] = JSON.parse(fs.readFileSync(`../phet-io-sim-specific/repos/${repo}/${repo}-phet-io-api-temporary.json`, 'utf8'));
      });
    } else {
      transpiler.transpileAll();
      proposedAPIs = await generatePhetioMacroAPI(sims, {
        showProgressBar: sims.length > 1,
        showMessagesFromSim: false
      });
    }

    // Don't add to options object if values are `undefined` (as _.extend will keep those entries and not mix in defaults
    const options = {};
    if (grunt.option('delta')) {
      options.delta = grunt.option('delta');
    }
    if (grunt.option('compareBreakingAPIChanges')) {
      options.compareBreakingAPIChanges = grunt.option('compareBreakingAPIChanges');
    }
    const ok = await require('../phet-io/phetioCompareAPISets')(sims, proposedAPIs, options);
    !ok && grunt.fail.fatal('PhET-iO API comparison failed');
  }));
  grunt.registerTask('profile-file-size', 'Profiles the file size of the built JS file for a given repo', wrapTask(async () => {
    const profileFileSize = require('../grunt/profileFileSize');
    await profileFileSize(repo);
  }));

  /**
   * Creates grunt tasks that effectively get forwarded to perennial. It will execute a grunt process running from
   * perennial's directory with the same options (but with --repo={{REPO}} added, so that perennial is aware of what
   * repository is the target).
   * @public
   *
   * @param {string} task - The name of the task
   */
  function forwardToPerennialGrunt(task) {
    grunt.registerTask(task, 'Run grunt --help in perennial to see documentation', () => {
      grunt.log.writeln('(Forwarding task to perennial)');
      const child_process = require('child_process');
      const done = grunt.task.current.async();

      // Include the --repo flag
      const args = [`--repo=${repo}`, ...process.argv.slice(2)];
      const argsString = args.map(arg => `"${arg}"`).join(' ');
      const spawned = child_process.spawn(/^win/.test(process.platform) ? 'grunt.cmd' : 'grunt', args, {
        cwd: '../perennial'
      });
      grunt.log.debug(`running grunt ${argsString} in ../${repo}`);
      spawned.stderr.on('data', data => grunt.log.error(data.toString()));
      spawned.stdout.on('data', data => grunt.log.write(data.toString()));
      process.stdin.pipe(spawned.stdin);
      spawned.on('close', code => {
        if (code !== 0) {
          throw new Error(`perennial grunt ${argsString} failed with code ${code}`);
        } else {
          done();
        }
      });
    });
  }
  ['checkout-shas', 'checkout-target', 'checkout-release', 'checkout-main', 'checkout-main-all', 'create-one-off', 'sha-check', 'sim-list', 'npm-update', 'create-release', 'cherry-pick', 'wrapper', 'dev', 'one-off', 'rc', 'production', 'prototype', 'create-sim', 'insert-require-statement', 'lint-everything', 'generate-data', 'pdom-comparison', 'release-branch-list'].forEach(forwardToPerennialGrunt);
};
const getBrands = (grunt, repo, buildLocal) => {
  // Determine what brands we want to build
  assert(!grunt.option('brand'), 'Use --brands={{BRANDS}} instead of brand');
  const localPackageObject = grunt.file.readJSON(`../${repo}/package.json`);
  const supportedBrands = localPackageObject.phet.supportedBrands || [];
  let brands;
  if (grunt.option('brands')) {
    if (grunt.option('brands') === '*') {
      brands = supportedBrands;
    } else {
      brands = grunt.option('brands').split(',');
    }
  } else if (buildLocal.brands) {
    // Extra check, see https://github.com/phetsims/chipper/issues/640
    assert(Array.isArray(buildLocal.brands), 'If brands exists in build-local.json, it should be an array');
    brands = buildLocal.brands.filter(brand => supportedBrands.includes(brand));
  } else {
    brands = ['adapted-from-phet'];
  }

  // Ensure all listed brands are valid
  brands.forEach(brand => assert(supportedBrands.includes(brand), `Unsupported brand: ${brand}`));
  return brands;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3NlcnQiLCJyZXF1aXJlIiwiZ2xvYmFsIiwicHJvY2Vzc0V2ZW50T3B0T3V0IiwicHJvY2VzcyIsIm9uIiwidXAiLCJjb25zb2xlIiwibG9nIiwiZXhpdCIsIlRyYW5zcGlsZXIiLCJ0cmFuc3BpbGVyIiwic2lsZW50IiwibW9kdWxlIiwiZXhwb3J0cyIsImdydW50IiwicGFja2FnZU9iamVjdCIsImZpbGUiLCJyZWFkSlNPTiIsImJ1aWxkTG9jYWwiLCJlbnYiLCJIT01FIiwiZSIsInJlcG8iLCJvcHRpb24iLCJuYW1lIiwidGVzdCIsIndyYXAiLCJwcm9taXNlIiwiZG9uZSIsInRhc2siLCJjdXJyZW50IiwiYXN5bmMiLCJzdGFjayIsImZhaWwiLCJmYXRhbCIsIkpTT04iLCJzdHJpbmdpZnkiLCJsZW5ndGgiLCJ0b1N0cmluZyIsIndyYXBUYXNrIiwiYXN5bmNUYXNrRnVuY3Rpb24iLCJyZWdpc3RlclRhc2siLCJidWlsZERpcmVjdG9yeSIsImV4aXN0cyIsImRlbGV0ZSIsIm1rZGlyIiwiamltcCIsImdlbmVyYXRlVGh1bWJuYWlscyIsImdlbmVyYXRlVHdpdHRlckNhcmQiLCJicmFuZCIsIndyaXRlbG4iLCJidWlsZERpciIsInRodW1ibmFpbFNpemVzIiwid2lkdGgiLCJoZWlnaHQiLCJzaXplIiwid3JpdGUiLCJNSU1FX1BORyIsImFsdFNjcmVlbnNob3RzIiwiZXhwYW5kIiwiZmlsdGVyIiwiY3dkIiwiYWx0U2NyZWVuc2hvdCIsImltYWdlTnVtYmVyIiwiTnVtYmVyIiwic3Vic3RyIiwiTUlNRV9KUEVHIiwidHJhbnNwaWxlUmVwbyIsImdldFBoZXRMaWJzIiwidHJhbnNwaWxlUmVwb3MiLCJ0cmFuc3BpbGVBbGwiLCJidWlsZFN0YW5kYWxvbmUiLCJidWlsZFJ1bm5hYmxlIiwibWluaWZ5IiwidHNjIiwicmVwb3J0VHNjUmVzdWx0cyIsInBhdGgiLCJmcyIsInBoZXRUaW1pbmdMb2ciLCJzdGFydEFzeW5jIiwibWluaWZ5S2V5cyIsIk9iamVjdCIsImtleXMiLCJNSU5JRllfREVGQVVMVFMiLCJtaW5pZnlPcHRpb25zIiwiZm9yRWFjaCIsIm1pbmlmeUtleSIsInJlcG9QYWNrYWdlT2JqZWN0IiwiYnJhbmRzIiwiZ2V0QnJhbmRzIiwiaW5jbHVkZXMiLCJyZXN1bHRzIiwicGhldCIsInBhcmVudERpciIsImV4aXN0c1N5bmMiLCJta2RpclN5bmMiLCJ3cml0ZUZpbGVTeW5jIiwiYmFiZWxUcmFuc3BpbGUiLCJ1Z2xpZnkiLCJpc0RlYnVnIiwic3RhbmRhbG9uZVRyYW5zcGlsZXMiLCJiYXNlbmFtZSIsInJlYWQiLCJsb2NhbFBhY2thZ2VPYmplY3QiLCJydW5uYWJsZSIsImpvaW4iLCJhbGxIVE1MIiwiZW5jb2RlU3RyaW5nTWFwIiwiY29tcHJlc3NTY3JpcHRzIiwicHJvZmlsZUZpbGVTaXplIiwibG9jYWxlc09wdGlvbiIsIndlYnBhY2tCdWlsZCIsIkNoaXBwZXJDb25zdGFudHMiLCJnZXRMb2NhbGVzRnJvbVJlcG9zaXRvcnkiLCJnZXRTdHJpbmdNYXAiLCJ3ZWJwYWNrUmVzdWx0IiwicGhldExpYnMiLCJhbGxMb2NhbGVzIiwiRkFMTEJBQ0tfTE9DQUxFIiwic3RyaW5nTWFwIiwidXNlZE1vZHVsZXMiLCJlbiIsImxpbnQiLCJjYWNoZSIsImZpeCIsImNoaXBBd2F5IiwiZXh0cmFSZXBvcyIsInNwbGl0IiwibGludFJldHVyblZhbHVlIiwib2siLCJnZW5lcmF0ZURldmVsb3BtZW50SFRNTCIsImdlbmVyYXRlVGVzdEhUTUwiLCJnZW5lcmF0ZUExMXlWaWV3SFRNTCIsImdlbmVyYXRlUkVBRE1FIiwiXyIsInJ1biIsInNpbXVsYXRpb24iLCJyZWFkbWVDcmVhdGVkTWFudWFsbHkiLCJwdWJsaXNoZWQiLCJzdXBwb3J0ZWRCcmFuZHMiLCJvdmVycmlkZXNGaWxlIiwid3JpdGVGaWxlQW5kR2l0QWRkIiwib3ZlcnJpZGVzQ29udGVudCIsInNpbVNwZWNpZmljV3JhcHBlcnMiLCJyZWFkZGlyU3luYyIsIndpdGhGaWxlVHlwZXMiLCJkaXJlbnQiLCJpc0RpcmVjdG9yeSIsIm1hcCIsIndyYXBwZXJzIiwidW5pcSIsImNvbmNhdCIsIm1lc3NhZ2UiLCJzaW1GZWF0dXJlcyIsInN1cHBvcnRzSW50ZXJhY3RpdmVEZXNjcmlwdGlvbiIsImdlbmVyYXRlZFVuaXRUZXN0cyIsImdlbmVyYXRlRGV2ZWxvcG1lbnRTdHJpbmdzIiwic29ydEltcG9ydHMiLCJyZWN1cnNlIiwiYWJzZmlsZSIsImRhdGVTdHJpbmciLCJjb21taXRzU2luY2UiLCJyZXBvcnRNZWRpYSIsInJlcG9ydFRoaXJkUGFydHkiLCJtb2R1bGlmeSIsInVwZGF0ZUNvcHlyaWdodERhdGVzIiwicmVwb3MiLCJwb3J0IiwiZGV2dG9vbCIsInVuZGVmaW5lZCIsIm9wZW5DaHJvbWUiLCJ3ZWJwYWNrRGV2U2VydmVyIiwiZm9ybWF0UGhldGlvQVBJIiwiZ2V0U2ltTGlzdCIsImdlbmVyYXRlUGhldGlvTWFjcm9BUEkiLCJzaW1zIiwic2tpcFRyYW5zcGlsZSIsInN0YXJ0VGltZSIsIkRhdGUiLCJub3ciLCJ0cmFuc3BpbGVUaW1lTVMiLCJzaG93UHJvZ3Jlc3NCYXIiLCJ0aHJvd0FQSUdlbmVyYXRpb25FcnJvcnMiLCJzaW0iLCJkaXIiLCJmaWxlUGF0aCIsImFwaSIsInRlbXBvcmFyeSIsInByb3Bvc2VkQVBJcyIsInBhcnNlIiwicmVhZEZpbGVTeW5jIiwic2hvd01lc3NhZ2VzRnJvbVNpbSIsIm9wdGlvbnMiLCJkZWx0YSIsImNvbXBhcmVCcmVha2luZ0FQSUNoYW5nZXMiLCJmb3J3YXJkVG9QZXJlbm5pYWxHcnVudCIsImNoaWxkX3Byb2Nlc3MiLCJhcmdzIiwiYXJndiIsInNsaWNlIiwiYXJnc1N0cmluZyIsImFyZyIsInNwYXduZWQiLCJzcGF3biIsInBsYXRmb3JtIiwiZGVidWciLCJzdGRlcnIiLCJkYXRhIiwiZXJyb3IiLCJzdGRvdXQiLCJzdGRpbiIsInBpcGUiLCJjb2RlIiwiRXJyb3IiLCJBcnJheSIsImlzQXJyYXkiXSwic291cmNlcyI6WyJHcnVudGZpbGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogR3J1bnQgY29uZmlndXJhdGlvbiBmaWxlIGZvciBQaEVUIHByb2plY3RzLiBJbiBnZW5lcmFsIHdoZW4gcG9zc2libGUsIG1vZHVsZXMgYXJlIGltcG9ydGVkIGxhemlseSBpbiB0aGVpciB0YXNrXHJcbiAqIGRlY2xhcmF0aW9uIHRvIHNhdmUgb24gb3ZlcmFsbCBsb2FkIHRpbWUgb2YgdGhpcyBmaWxlLiBUaGUgcGF0dGVybiBpcyB0byByZXF1aXJlIGFsbCBtb2R1bGVzIG5lZWRlZCBhdCB0aGUgdG9wIG9mIHRoZVxyXG4gKiBncnVudCB0YXNrIHJlZ2lzdHJhdGlvbi4gSWYgYSBtb2R1bGUgaXMgdXNlZCBpbiBtdWx0aXBsZSB0YXNrcywgaXQgaXMgYmVzdCB0byBsYXppbHkgcmVxdWlyZSBpbiBlYWNoXHJcbiAqIHRhc2suXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8gTk9URTogdG8gaW1wcm92ZSBwZXJmb3JtYW5jZSwgdGhlIHZhc3QgbWFqb3JpdHkgb2YgbW9kdWxlcyBhcmUgbGF6aWx5IGltcG9ydGVkIGluIHRhc2sgcmVnaXN0cmF0aW9ucy4gRXZlbiBkdXBsaWNhdGluZ1xyXG4vLyByZXF1aXJlIHN0YXRlbWVudHMgaW1wcm92ZXMgdGhlIGxvYWQgdGltZSBvZiB0aGlzIGZpbGUgbm90aWNlYWJseS4gRm9yIGRldGFpbHMsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvMTEwN1xyXG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCAnYXNzZXJ0JyApO1xyXG5yZXF1aXJlKCAnLi9jaGVja05vZGVWZXJzaW9uJyApO1xyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbi8vIEFsbG93IG90aGVyIEdydW50ZmlsZXMgdG8gcG90ZW50aWFsbHkgaGFuZGxlIGV4aXRpbmcgYW5kIGVycm9ycyBkaWZmZXJlbnRseWBcclxuaWYgKCAhZ2xvYmFsLnByb2Nlc3NFdmVudE9wdE91dCApIHtcclxuXHJcbi8vIFNlZSBodHRwczovL21lZGl1bS5jb20vQGR0aW50aC9tYWtpbmctdW5oYW5kbGVkLXByb21pc2UtcmVqZWN0aW9ucy1jcmFzaC10aGUtbm9kZS1qcy1wcm9jZXNzLWZmYzI3Y2ZjYzlkZCBmb3IgaG93XHJcbi8vIHRvIGdldCB1bmhhbmRsZWQgcHJvbWlzZSByZWplY3Rpb25zIHRvIGZhaWwgb3V0IHRoZSBub2RlIHByb2Nlc3MuXHJcbi8vIFJlbGV2YW50IGZvciBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvd2F2ZS1pbnRlcmZlcmVuY2UvaXNzdWVzLzQ5MVxyXG4gIHByb2Nlc3Mub24oICd1bmhhbmRsZWRSZWplY3Rpb24nLCB1cCA9PiB7IHRocm93IHVwOyB9ICk7XHJcblxyXG4vLyBFeGl0IG9uIEN0cmwgKyBDIGNhc2VcclxuICBwcm9jZXNzLm9uKCAnU0lHSU5UJywgKCkgPT4ge1xyXG4gICAgY29uc29sZS5sb2coICdcXG5cXG5DYXVnaHQgaW50ZXJydXB0IHNpZ25hbCwgZXhpdGluZycgKTtcclxuICAgIHByb2Nlc3MuZXhpdCgpO1xyXG4gIH0gKTtcclxufVxyXG5cclxuY29uc3QgVHJhbnNwaWxlciA9IHJlcXVpcmUoICcuLi9jb21tb24vVHJhbnNwaWxlcicgKTtcclxuY29uc3QgdHJhbnNwaWxlciA9IG5ldyBUcmFuc3BpbGVyKCB7IHNpbGVudDogdHJ1ZSB9ICk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBncnVudCApIHtcclxuICBjb25zdCBwYWNrYWdlT2JqZWN0ID0gZ3J1bnQuZmlsZS5yZWFkSlNPTiggJ3BhY2thZ2UuanNvbicgKTtcclxuXHJcbiAgLy8gSGFuZGxlIHRoZSBsYWNrIG9mIGJ1aWxkLmpzb25cclxuICBsZXQgYnVpbGRMb2NhbDtcclxuICB0cnkge1xyXG4gICAgYnVpbGRMb2NhbCA9IGdydW50LmZpbGUucmVhZEpTT04oIGAke3Byb2Nlc3MuZW52LkhPTUV9Ly5waGV0L2J1aWxkLWxvY2FsLmpzb25gICk7XHJcbiAgfVxyXG4gIGNhdGNoKCBlICkge1xyXG4gICAgYnVpbGRMb2NhbCA9IHt9O1xyXG4gIH1cclxuXHJcbiAgY29uc3QgcmVwbyA9IGdydW50Lm9wdGlvbiggJ3JlcG8nICkgfHwgcGFja2FnZU9iamVjdC5uYW1lO1xyXG4gIGFzc2VydCggdHlwZW9mIHJlcG8gPT09ICdzdHJpbmcnICYmIC9eW2Etel0rKC1bYS16XSspKiQvdS50ZXN0KCByZXBvICksICdyZXBvIG5hbWUgc2hvdWxkIGJlIGNvbXBvc2VkIG9mIGxvd2VyLWNhc2UgY2hhcmFjdGVycywgb3B0aW9uYWxseSB3aXRoIGRhc2hlcyB1c2VkIGFzIHNlcGFyYXRvcnMnICk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFdyYXBzIGEgcHJvbWlzZSdzIGNvbXBsZXRpb24gd2l0aCBncnVudCdzIGFzeW5jaHJvbm91cyBoYW5kbGluZywgd2l0aCBhZGRlZCBoZWxwZnVsIGZhaWx1cmUgbWVzc2FnZXMgKGluY2x1ZGluZ1xyXG4gICAqIHN0YWNrIHRyYWNlcywgcmVnYXJkbGVzcyBvZiB3aGV0aGVyIC0tc3RhY2sgd2FzIHByb3ZpZGVkKS5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1Byb21pc2V9IHByb21pc2VcclxuICAgKi9cclxuICBhc3luYyBmdW5jdGlvbiB3cmFwKCBwcm9taXNlICkge1xyXG4gICAgY29uc3QgZG9uZSA9IGdydW50LnRhc2suY3VycmVudC5hc3luYygpO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IHByb21pc2U7XHJcbiAgICB9XHJcbiAgICBjYXRjaCggZSApIHtcclxuICAgICAgaWYgKCBlLnN0YWNrICkge1xyXG4gICAgICAgIGdydW50LmZhaWwuZmF0YWwoIGBQZXJlbm5pYWwgdGFzayBmYWlsZWQ6XFxuJHtlLnN0YWNrfVxcbkZ1bGwgRXJyb3IgZGV0YWlsczpcXG4ke2V9YCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAgIC8vIFRoZSB0b1N0cmluZyBjaGVjayBoYW5kbGVzIGEgd2VpcmQgY2FzZSBmb3VuZCBmcm9tIGFuIEVycm9yIG9iamVjdCBmcm9tIHB1cHBldGVlciB0aGF0IGRvZXNuJ3Qgc3RyaW5naWZ5IHdpdGhcclxuICAgICAgLy8gSlNPTiBvciBoYXZlIGEgc3RhY2ssIEpTT04uc3RyaW5naWZpZXMgdG8gXCJ7fVwiLCBidXQgaGFzIGEgYHRvU3RyaW5nYCBtZXRob2RcclxuICAgICAgZWxzZSBpZiAoIHR5cGVvZiBlID09PSAnc3RyaW5nJyB8fCAoIEpTT04uc3RyaW5naWZ5KCBlICkubGVuZ3RoID09PSAyICYmIGUudG9TdHJpbmcgKSApIHtcclxuICAgICAgICBncnVudC5mYWlsLmZhdGFsKCBgUGVyZW5uaWFsIHRhc2sgZmFpbGVkOiAke2V9YCApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGdydW50LmZhaWwuZmF0YWwoIGBQZXJlbm5pYWwgdGFzayBmYWlsZWQgd2l0aCB1bmtub3duIGVycm9yOiAke0pTT04uc3RyaW5naWZ5KCBlLCBudWxsLCAyICl9YCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZG9uZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV3JhcHMgYW4gYXN5bmMgZnVuY3Rpb24gZm9yIGEgZ3J1bnQgdGFzay4gV2lsbCBydW4gdGhlIGFzeW5jIGZ1bmN0aW9uIHdoZW4gdGhlIHRhc2sgc2hvdWxkIGJlIGV4ZWN1dGVkLiBXaWxsXHJcbiAgICogcHJvcGVybHkgaGFuZGxlIGdydW50J3MgYXN5bmMgaGFuZGxpbmcsIGFuZCBwcm92aWRlcyBpbXByb3ZlZCBlcnJvciByZXBvcnRpbmcuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHthc3luYyBmdW5jdGlvbn0gYXN5bmNUYXNrRnVuY3Rpb25cclxuICAgKi9cclxuICBmdW5jdGlvbiB3cmFwVGFzayggYXN5bmNUYXNrRnVuY3Rpb24gKSB7XHJcbiAgICByZXR1cm4gKCkgPT4ge1xyXG4gICAgICB3cmFwKCBhc3luY1Rhc2tGdW5jdGlvbigpICk7XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnZGVmYXVsdCcsICdCdWlsZHMgdGhlIHJlcG9zaXRvcnknLCBbXHJcbiAgICAuLi4oIGdydW50Lm9wdGlvbiggJ2xpbnQnICkgPT09IGZhbHNlID8gW10gOiBbICdsaW50LWFsbCcgXSApLFxyXG4gICAgLi4uKCBncnVudC5vcHRpb24oICdyZXBvcnQtbWVkaWEnICkgPT09IGZhbHNlID8gW10gOiBbICdyZXBvcnQtbWVkaWEnIF0gKSxcclxuICAgICdjbGVhbicsXHJcbiAgICAnYnVpbGQnXHJcbiAgXSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdjbGVhbicsXHJcbiAgICAnRXJhc2VzIHRoZSBidWlsZC8gZGlyZWN0b3J5IGFuZCBhbGwgaXRzIGNvbnRlbnRzLCBhbmQgcmVjcmVhdGVzIHRoZSBidWlsZC8gZGlyZWN0b3J5JyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGJ1aWxkRGlyZWN0b3J5ID0gYC4uLyR7cmVwb30vYnVpbGRgO1xyXG4gICAgICBpZiAoIGdydW50LmZpbGUuZXhpc3RzKCBidWlsZERpcmVjdG9yeSApICkge1xyXG4gICAgICAgIGdydW50LmZpbGUuZGVsZXRlKCBidWlsZERpcmVjdG9yeSApO1xyXG4gICAgICB9XHJcbiAgICAgIGdydW50LmZpbGUubWtkaXIoIGJ1aWxkRGlyZWN0b3J5ICk7XHJcbiAgICB9ICkgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnYnVpbGQtaW1hZ2VzJyxcclxuICAgICdCdWlsZCBpbWFnZXMgb25seScsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBqaW1wID0gcmVxdWlyZSggJ2ppbXAnICk7XHJcbiAgICAgIGNvbnN0IGdlbmVyYXRlVGh1bWJuYWlscyA9IHJlcXVpcmUoICcuL2dlbmVyYXRlVGh1bWJuYWlscycgKTtcclxuICAgICAgY29uc3QgZ2VuZXJhdGVUd2l0dGVyQ2FyZCA9IHJlcXVpcmUoICcuL2dlbmVyYXRlVHdpdHRlckNhcmQnICk7XHJcblxyXG4gICAgICBjb25zdCBicmFuZCA9ICdwaGV0JztcclxuICAgICAgZ3J1bnQubG9nLndyaXRlbG4oIGBCdWlsZGluZyBpbWFnZXMgZm9yIGJyYW5kOiAke2JyYW5kfWAgKTtcclxuXHJcbiAgICAgIGNvbnN0IGJ1aWxkRGlyID0gYC4uLyR7cmVwb30vYnVpbGQvJHticmFuZH1gO1xyXG4gICAgICAvLyBUaHVtYm5haWxzIGFuZCB0d2l0dGVyIGNhcmRcclxuICAgICAgaWYgKCBncnVudC5maWxlLmV4aXN0cyggYC4uLyR7cmVwb30vYXNzZXRzLyR7cmVwb30tc2NyZWVuc2hvdC5wbmdgICkgKSB7XHJcbiAgICAgICAgY29uc3QgdGh1bWJuYWlsU2l6ZXMgPSBbXHJcbiAgICAgICAgICB7IHdpZHRoOiA5MDAsIGhlaWdodDogNTkxIH0sXHJcbiAgICAgICAgICB7IHdpZHRoOiA2MDAsIGhlaWdodDogMzk0IH0sXHJcbiAgICAgICAgICB7IHdpZHRoOiA0MjAsIGhlaWdodDogMjc2IH0sXHJcbiAgICAgICAgICB7IHdpZHRoOiAxMjgsIGhlaWdodDogODQgfSxcclxuICAgICAgICAgIHsgd2lkdGg6IDE1LCBoZWlnaHQ6IDEwIH1cclxuICAgICAgICBdO1xyXG4gICAgICAgIGZvciAoIGNvbnN0IHNpemUgb2YgdGh1bWJuYWlsU2l6ZXMgKSB7XHJcbiAgICAgICAgICBncnVudC5maWxlLndyaXRlKCBgJHtidWlsZERpcn0vJHtyZXBvfS0ke3NpemUud2lkdGh9LnBuZ2AsIGF3YWl0IGdlbmVyYXRlVGh1bWJuYWlscyggcmVwbywgc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHQsIDEwMCwgamltcC5NSU1FX1BORyApICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBhbHRTY3JlZW5zaG90cyA9IGdydW50LmZpbGUuZXhwYW5kKCB7IGZpbHRlcjogJ2lzRmlsZScsIGN3ZDogYC4uLyR7cmVwb30vYXNzZXRzYCB9LCBbIGAuLyR7cmVwb30tc2NyZWVuc2hvdC1hbHRbMDEyMzQ1Njc4OV0ucG5nYCBdICk7XHJcbiAgICAgICAgZm9yICggY29uc3QgYWx0U2NyZWVuc2hvdCBvZiBhbHRTY3JlZW5zaG90cyApIHtcclxuICAgICAgICAgIGNvbnN0IGltYWdlTnVtYmVyID0gTnVtYmVyKCBhbHRTY3JlZW5zaG90LnN1YnN0ciggYC4vJHtyZXBvfS1zY3JlZW5zaG90LWFsdGAubGVuZ3RoLCAxICkgKTtcclxuICAgICAgICAgIGdydW50LmZpbGUud3JpdGUoIGAke2J1aWxkRGlyfS8ke3JlcG99LSR7NjAwfS1hbHQke2ltYWdlTnVtYmVyfS5wbmdgLCBhd2FpdCBnZW5lcmF0ZVRodW1ibmFpbHMoIHJlcG8sIDYwMCwgMzk0LCAxMDAsIGppbXAuTUlNRV9QTkcsIGAtYWx0JHtpbWFnZU51bWJlcn1gICkgKTtcclxuICAgICAgICAgIGdydW50LmZpbGUud3JpdGUoIGAke2J1aWxkRGlyfS8ke3JlcG99LSR7OTAwfS1hbHQke2ltYWdlTnVtYmVyfS5wbmdgLCBhd2FpdCBnZW5lcmF0ZVRodW1ibmFpbHMoIHJlcG8sIDkwMCwgNTkxLCAxMDAsIGppbXAuTUlNRV9QTkcsIGAtYWx0JHtpbWFnZU51bWJlcn1gICkgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICggYnJhbmQgPT09ICdwaGV0JyApIHtcclxuICAgICAgICAgIGdydW50LmZpbGUud3JpdGUoIGAke2J1aWxkRGlyfS8ke3JlcG99LWlvcy5wbmdgLCBhd2FpdCBnZW5lcmF0ZVRodW1ibmFpbHMoIHJlcG8sIDQyMCwgMjc2LCA5MCwgamltcC5NSU1FX0pQRUcgKSApO1xyXG4gICAgICAgICAgZ3J1bnQuZmlsZS53cml0ZSggYCR7YnVpbGREaXJ9LyR7cmVwb30tdHdpdHRlci1jYXJkLnBuZ2AsIGF3YWl0IGdlbmVyYXRlVHdpdHRlckNhcmQoIHJlcG8gKSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ291dHB1dC1qcycsICdPdXRwdXRzIEpTIGp1c3QgZm9yIHRoZSBzcGVjaWZpZWQgcmVwbycsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICB0cmFuc3BpbGVyLnRyYW5zcGlsZVJlcG8oIHJlcG8gKTtcclxuICAgIH0gKVxyXG4gICk7XHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnb3V0cHV0LWpzLXByb2plY3QnLCAnT3V0cHV0cyBKUyBmb3IgdGhlIHNwZWNpZmllZCByZXBvIGFuZCBpdHMgZGVwZW5kZW5jaWVzJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGdldFBoZXRMaWJzID0gcmVxdWlyZSggJy4vZ2V0UGhldExpYnMnICk7XHJcblxyXG4gICAgICB0cmFuc3BpbGVyLnRyYW5zcGlsZVJlcG9zKCBnZXRQaGV0TGlicyggcmVwbyApICk7XHJcbiAgICB9IClcclxuICApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdvdXRwdXQtanMtYWxsJywgJ091dHB1dHMgSlMgZm9yIGFsbCByZXBvcycsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICB0cmFuc3BpbGVyLnRyYW5zcGlsZUFsbCgpO1xyXG4gICAgfSApXHJcbiAgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnYnVpbGQnLFxyXG4gICAgYEJ1aWxkcyB0aGUgcmVwb3NpdG9yeS4gRGVwZW5kaW5nIG9uIHRoZSByZXBvc2l0b3J5IHR5cGUgKHJ1bm5hYmxlL3dyYXBwZXIvc3RhbmRhbG9uZSksIHRoZSByZXN1bHQgbWF5IHZhcnkuXHJcblJ1bm5hYmxlIGJ1aWxkIG9wdGlvbnM6XHJcbiAtLXJlcG9ydC1tZWRpYSAtIFdpbGwgaXRlcmF0ZSBvdmVyIGFsbCBvZiB0aGUgbGljZW5zZS5qc29uIGZpbGVzIGFuZCByZXBvcnRzIGFueSBtZWRpYSBmaWxlcywgc2V0IHRvIGZhbHNlIHRvIG9wdCBvdXQuXHJcbiAtLWJyYW5kcz17e0JSQU5EU30gLSBDYW4gYmUgKiAoYnVpbGQgYWxsIHN1cHBvcnRlZCBicmFuZHMpLCBvciBhIGNvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIGJyYW5kIG5hbWVzLiBXaWxsIGZhbGwgYmFjayB0byB1c2luZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgYnVpbGQtbG9jYWwuanNvbidzIGJyYW5kcyAob3IgYWRhcHRlZC1mcm9tLXBoZXQgaWYgdGhhdCBkb2VzIG5vdCBleGlzdClcclxuIC0tYWxsSFRNTCAtIElmIHByb3ZpZGVkLCB3aWxsIGluY2x1ZGUgdGhlIF9hbGwuaHRtbCBmaWxlIChpZiBpdCB3b3VsZCBub3Qgb3RoZXJ3aXNlIGJlIGJ1aWx0LCBlLmcuIHBoZXQgYnJhbmQpXHJcbiAtLVhIVE1MIC0gSW5jbHVkZXMgYW4geGh0bWwvIGRpcmVjdG9yeSBpbiB0aGUgYnVpbGQgb3V0cHV0IHRoYXQgY29udGFpbnMgYSBydW5uYWJsZSBYSFRNTCBmb3JtIG9mIHRoZSBzaW0gKHdpdGhcclxuICAgICAgICAgICBhIHNlcGFyYXRlZC1vdXQgSlMgZmlsZSkuXHJcbiAtLWxvY2FsZXM9e3tMT0NBTEVTfX0gLSBDYW4gYmUgKiAoYnVpbGQgYWxsIGF2YWlsYWJsZSBsb2NhbGVzLCBcImVuXCIgYW5kIGV2ZXJ5dGhpbmcgaW4gYmFiZWwpLCBvciBhIGNvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIGxvY2FsZXNcclxuIC0tbm9UcmFuc3BpbGUgLSBGbGFnIHRvIG9wdCBvdXQgb2YgdHJhbnNwaWxpbmcgcmVwb3MgYmVmb3JlIGJ1aWxkLiBUaGlzIHNob3VsZCBvbmx5IGJlIHVzZWQgaWYgeW91IGFyZSBjb25maWRlbnQgdGhhdCBjaGlwcGVyL2Rpc3QgaXMgYWxyZWFkeSBjb3JyZWN0ICh0byBzYXZlIHRpbWUpLlxyXG4gLS1ub1RTQyAtIEZsYWcgdG8gb3B0IG91dCBvZiB0eXBlIGNoZWNraW5nIGJlZm9yZSBidWlsZC4gVGhpcyBzaG91bGQgb25seSBiZSB1c2VkIGlmIHlvdSBhcmUgY29uZmlkZW50IHRoYXQgVHlwZVNjcmlwdCBpcyBhbHJlYWR5IGVycm9ybGVzcyAodG8gc2F2ZSB0aW1lKS5cclxuIC0tZW5jb2RlU3RyaW5nTWFwPWZhbHNlIC0gRGlzYWJsZXMgdGhlIGVuY29kaW5nIG9mIHRoZSBzdHJpbmcgbWFwIGluIHRoZSBidWlsdCBmaWxlLiBUaGlzIGlzIHVzZWZ1bCBmb3IgZGVidWdnaW5nLlxyXG4gXHJcbk1pbmlmeS1zcGVjaWZpYyBvcHRpb25zOiBcclxuIC0tbWluaWZ5LmJhYmVsVHJhbnNwaWxlPWZhbHNlIC0gRGlzYWJsZXMgYmFiZWwgdHJhbnNwaWxhdGlvbiBwaGFzZS5cclxuIC0tbWluaWZ5LnVnbGlmeT1mYWxzZSAtIERpc2FibGVzIHVnbGlmaWNhdGlvbiwgc28gdGhlIGJ1aWx0IGZpbGUgd2lsbCBpbmNsdWRlIChlc3NlbnRpYWxseSkgY29uY2F0ZW5hdGVkIHNvdXJjZSBmaWxlcy5cclxuIC0tbWluaWZ5Lm1hbmdsZT1mYWxzZSAtIER1cmluZyB1Z2xpZmljYXRpb24sIGl0IHdpbGwgbm90IFwibWFuZ2xlXCIgdmFyaWFibGUgbmFtZXMgKHdoZXJlIHRoZXkgZ2V0IHJlbmFtZWQgdG8gc2hvcnQgY29uc3RhbnRzIHRvIHJlZHVjZSBmaWxlIHNpemUuKVxyXG4gLS1taW5pZnkuYmVhdXRpZnk9dHJ1ZSAtIEFmdGVyIHVnbGlmaWNhdGlvbiwgdGhlIHNvdXJjZSBjb2RlIHdpbGwgYmUgc3ludGF4IGZvcm1hdHRlZCBuaWNlbHlcclxuIC0tbWluaWZ5LnN0cmlwQXNzZXJ0aW9ucz1mYWxzZSAtIER1cmluZyB1Z2xpZmljYXRpb24sIGl0IHdpbGwgc3RyaXAgYXNzZXJ0aW9ucy5cclxuIC0tbWluaWZ5LnN0cmlwTG9nZ2luZz1mYWxzZSAtIER1cmluZyB1Z2xpZmljYXRpb24sIGl0IHdpbGwgbm90IHN0cmlwIGxvZ2dpbmcgc3RhdGVtZW50cy5cclxuIGAsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBidWlsZFN0YW5kYWxvbmUgPSByZXF1aXJlKCAnLi9idWlsZFN0YW5kYWxvbmUnICk7XHJcbiAgICAgIGNvbnN0IGJ1aWxkUnVubmFibGUgPSByZXF1aXJlKCAnLi9idWlsZFJ1bm5hYmxlJyApO1xyXG4gICAgICBjb25zdCBtaW5pZnkgPSByZXF1aXJlKCAnLi9taW5pZnknICk7XHJcbiAgICAgIGNvbnN0IHRzYyA9IHJlcXVpcmUoICcuL3RzYycgKTtcclxuICAgICAgY29uc3QgcmVwb3J0VHNjUmVzdWx0cyA9IHJlcXVpcmUoICcuL3JlcG9ydFRzY1Jlc3VsdHMnICk7XHJcbiAgICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKCAncGF0aCcgKTtcclxuICAgICAgY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbiAgICAgIGNvbnN0IGdldFBoZXRMaWJzID0gcmVxdWlyZSggJy4vZ2V0UGhldExpYnMnICk7XHJcbiAgICAgIGNvbnN0IHBoZXRUaW1pbmdMb2cgPSByZXF1aXJlKCAnLi4vLi4vLi4vcGVyZW5uaWFsLWFsaWFzL2pzL2NvbW1vbi9waGV0VGltaW5nTG9nJyApO1xyXG5cclxuICAgICAgYXdhaXQgcGhldFRpbWluZ0xvZy5zdGFydEFzeW5jKCAnZ3J1bnQtYnVpbGQnLCBhc3luYyAoKSA9PiB7XHJcblxyXG4gICAgICAgIC8vIFBhcnNlIG1pbmlmaWNhdGlvbiBrZXlzXHJcbiAgICAgICAgY29uc3QgbWluaWZ5S2V5cyA9IE9iamVjdC5rZXlzKCBtaW5pZnkuTUlOSUZZX0RFRkFVTFRTICk7XHJcbiAgICAgICAgY29uc3QgbWluaWZ5T3B0aW9ucyA9IHt9O1xyXG4gICAgICAgIG1pbmlmeUtleXMuZm9yRWFjaCggbWluaWZ5S2V5ID0+IHtcclxuICAgICAgICAgIGNvbnN0IG9wdGlvbiA9IGdydW50Lm9wdGlvbiggYG1pbmlmeS4ke21pbmlmeUtleX1gICk7XHJcbiAgICAgICAgICBpZiAoIG9wdGlvbiA9PT0gdHJ1ZSB8fCBvcHRpb24gPT09IGZhbHNlICkge1xyXG4gICAgICAgICAgICBtaW5pZnlPcHRpb25zWyBtaW5pZnlLZXkgXSA9IG9wdGlvbjtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlcG9QYWNrYWdlT2JqZWN0ID0gZ3J1bnQuZmlsZS5yZWFkSlNPTiggYC4uLyR7cmVwb30vcGFja2FnZS5qc29uYCApO1xyXG5cclxuICAgICAgICAvLyBSdW4gdGhlIHR5cGUgY2hlY2tlciBmaXJzdC5cclxuICAgICAgICBjb25zdCBicmFuZHMgPSBnZXRCcmFuZHMoIGdydW50LCByZXBvLCBidWlsZExvY2FsICk7XHJcblxyXG4gICAgICAgICFncnVudC5vcHRpb24oICdub1RTQycgKSAmJiBhd2FpdCBwaGV0VGltaW5nTG9nLnN0YXJ0QXN5bmMoICd0c2MnLCBhc3luYyAoKSA9PiB7XHJcblxyXG4gICAgICAgICAgLy8gV2UgbXVzdCBoYXZlIHBoZXQtaW8gY29kZSBjaGVja2VkIG91dCB0byB0eXBlIGNoZWNrLCBzaW5jZSBzaW1MYXVuY2hlciBpbXBvcnRzIHBoZXRpb0VuZ2luZVxyXG4gICAgICAgICAgaWYgKCBicmFuZHMuaW5jbHVkZXMoICdwaGV0LWlvJyApIHx8IGJyYW5kcy5pbmNsdWRlcyggJ3BoZXQnICkgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB0c2MoIGAuLi8ke3JlcG99YCApO1xyXG4gICAgICAgICAgICByZXBvcnRUc2NSZXN1bHRzKCByZXN1bHRzLCBncnVudCApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGdydW50LmxvZy53cml0ZWxuKCAnc2tpcHBpbmcgdHlwZSBjaGVja2luZycgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgICFncnVudC5vcHRpb24oICdub1RyYW5zcGlsZScgKSAmJiBhd2FpdCBwaGV0VGltaW5nTG9nLnN0YXJ0QXN5bmMoICd0cmFuc3BpbGUnLCAoKSA9PiB7XHJcbiAgICAgICAgICAvLyBJZiB0aGF0IHN1Y2NlZWRzLCB0aGVuIGNvbnZlcnQgdGhlIGNvZGUgdG8gSlNcclxuICAgICAgICAgIHRyYW5zcGlsZXIudHJhbnNwaWxlUmVwb3MoIGdldFBoZXRMaWJzKCByZXBvICkgKTtcclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgIC8vIHN0YW5kYWxvbmVcclxuICAgICAgICBpZiAoIHJlcG9QYWNrYWdlT2JqZWN0LnBoZXQuYnVpbGRTdGFuZGFsb25lICkge1xyXG4gICAgICAgICAgZ3J1bnQubG9nLndyaXRlbG4oICdCdWlsZGluZyBzdGFuZGFsb25lIHJlcG9zaXRvcnknICk7XHJcblxyXG4gICAgICAgICAgY29uc3QgcGFyZW50RGlyID0gYC4uLyR7cmVwb30vYnVpbGQvYDtcclxuICAgICAgICAgIGlmICggIWZzLmV4aXN0c1N5bmMoIHBhcmVudERpciApICkge1xyXG4gICAgICAgICAgICBmcy5ta2RpclN5bmMoIHBhcmVudERpciApO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoIGAke3BhcmVudERpcn0vJHtyZXBvfS5taW4uanNgLCBhd2FpdCBidWlsZFN0YW5kYWxvbmUoIHJlcG8sIG1pbmlmeU9wdGlvbnMgKSApO1xyXG5cclxuICAgICAgICAgIC8vIEJ1aWxkIGEgZGVidWcgdmVyc2lvblxyXG4gICAgICAgICAgbWluaWZ5T3B0aW9ucy5taW5pZnkgPSBmYWxzZTtcclxuICAgICAgICAgIG1pbmlmeU9wdGlvbnMuYmFiZWxUcmFuc3BpbGUgPSBmYWxzZTtcclxuICAgICAgICAgIG1pbmlmeU9wdGlvbnMudWdsaWZ5ID0gZmFsc2U7XHJcbiAgICAgICAgICBtaW5pZnlPcHRpb25zLmlzRGVidWcgPSB0cnVlO1xyXG4gICAgICAgICAgZnMud3JpdGVGaWxlU3luYyggYCR7cGFyZW50RGlyfS8ke3JlcG99LmRlYnVnLmpzYCwgYXdhaXQgYnVpbGRTdGFuZGFsb25lKCByZXBvLCBtaW5pZnlPcHRpb25zLCB0cnVlICkgKTtcclxuXHJcbiAgICAgICAgICBpZiAoIHJlcG9QYWNrYWdlT2JqZWN0LnBoZXQuc3RhbmRhbG9uZVRyYW5zcGlsZXMgKSB7XHJcbiAgICAgICAgICAgIGZvciAoIGNvbnN0IGZpbGUgb2YgcmVwb1BhY2thZ2VPYmplY3QucGhldC5zdGFuZGFsb25lVHJhbnNwaWxlcyApIHtcclxuICAgICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKCBgLi4vJHtyZXBvfS9idWlsZC8ke3BhdGguYmFzZW5hbWUoIGZpbGUgKX1gLCBtaW5pZnkoIGdydW50LmZpbGUucmVhZCggZmlsZSApICkgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuXHJcbiAgICAgICAgICBjb25zdCBsb2NhbFBhY2thZ2VPYmplY3QgPSBncnVudC5maWxlLnJlYWRKU09OKCBgLi4vJHtyZXBvfS9wYWNrYWdlLmpzb25gICk7XHJcbiAgICAgICAgICBhc3NlcnQoIGxvY2FsUGFja2FnZU9iamVjdC5waGV0LnJ1bm5hYmxlLCBgJHtyZXBvfSBkb2VzIG5vdCBhcHBlYXIgdG8gYmUgcnVubmFibGVgICk7XHJcbiAgICAgICAgICBncnVudC5sb2cud3JpdGVsbiggYEJ1aWxkaW5nIHJ1bm5hYmxlIHJlcG9zaXRvcnkgKCR7cmVwb30sIGJyYW5kczogJHticmFuZHMuam9pbiggJywgJyApfSlgICk7XHJcblxyXG4gICAgICAgICAgLy8gT3RoZXIgb3B0aW9uc1xyXG4gICAgICAgICAgY29uc3QgYWxsSFRNTCA9ICEhZ3J1bnQub3B0aW9uKCAnYWxsSFRNTCcgKTtcclxuICAgICAgICAgIGNvbnN0IGVuY29kZVN0cmluZ01hcCA9IGdydW50Lm9wdGlvbiggJ2VuY29kZVN0cmluZ01hcCcgKSAhPT0gZmFsc2U7XHJcbiAgICAgICAgICBjb25zdCBjb21wcmVzc1NjcmlwdHMgPSAhIWdydW50Lm9wdGlvbiggJ2NvbXByZXNzU2NyaXB0cycgKTtcclxuICAgICAgICAgIGNvbnN0IHByb2ZpbGVGaWxlU2l6ZSA9ICEhZ3J1bnQub3B0aW9uKCAncHJvZmlsZUZpbGVTaXplJyApO1xyXG4gICAgICAgICAgY29uc3QgbG9jYWxlc09wdGlvbiA9IGdydW50Lm9wdGlvbiggJ2xvY2FsZXMnICkgfHwgJ2VuJzsgLy8gRGVmYXVsdCBiYWNrIHRvIEVuZ2xpc2ggZm9yIG5vd1xyXG5cclxuICAgICAgICAgIGZvciAoIGNvbnN0IGJyYW5kIG9mIGJyYW5kcyApIHtcclxuICAgICAgICAgICAgZ3J1bnQubG9nLndyaXRlbG4oIGBCdWlsZGluZyBicmFuZDogJHticmFuZH1gICk7XHJcblxyXG4gICAgICAgICAgICBhd2FpdCBwaGV0VGltaW5nTG9nLnN0YXJ0QXN5bmMoICdidWlsZC1icmFuZC0nICsgYnJhbmQsIGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICBhd2FpdCBidWlsZFJ1bm5hYmxlKCByZXBvLCBtaW5pZnlPcHRpb25zLCBhbGxIVE1MLCBicmFuZCwgbG9jYWxlc09wdGlvbiwgYnVpbGRMb2NhbCwgZW5jb2RlU3RyaW5nTWFwLCBjb21wcmVzc1NjcmlwdHMsIHByb2ZpbGVGaWxlU2l6ZSApO1xyXG4gICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICB9IClcclxuICApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdnZW5lcmF0ZS11c2VkLXN0cmluZ3MtZmlsZScsXHJcbiAgICAnV3JpdGVzIHVzZWQgc3RyaW5ncyB0byBwaGV0LWlvLXNpbS1zcGVjaWZpYy8gc28gdGhhdCBQaEVULWlPIHNpbXMgb25seSBvdXRwdXQgcmVsZXZhbnQgc3RyaW5ncyB0byB0aGUgQVBJIGluIHVuYnVpbHQgbW9kZScsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBnZXRQaGV0TGlicyA9IHJlcXVpcmUoICcuL2dldFBoZXRMaWJzJyApO1xyXG4gICAgICBjb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcclxuICAgICAgY29uc3Qgd2VicGFja0J1aWxkID0gcmVxdWlyZSggJy4vd2VicGFja0J1aWxkJyApO1xyXG4gICAgICBjb25zdCBDaGlwcGVyQ29uc3RhbnRzID0gcmVxdWlyZSggJy4uL2NvbW1vbi9DaGlwcGVyQ29uc3RhbnRzJyApO1xyXG4gICAgICBjb25zdCBnZXRMb2NhbGVzRnJvbVJlcG9zaXRvcnkgPSByZXF1aXJlKCAnLi9nZXRMb2NhbGVzRnJvbVJlcG9zaXRvcnknICk7XHJcbiAgICAgIGNvbnN0IGdldFN0cmluZ01hcCA9IHJlcXVpcmUoICcuL2dldFN0cmluZ01hcCcgKTtcclxuXHJcbiAgICAgIHRyYW5zcGlsZXIudHJhbnNwaWxlUmVwb3MoIGdldFBoZXRMaWJzKCByZXBvICkgKTtcclxuICAgICAgY29uc3Qgd2VicGFja1Jlc3VsdCA9IGF3YWl0IHdlYnBhY2tCdWlsZCggcmVwbywgJ3BoZXQnICk7XHJcblxyXG4gICAgICBjb25zdCBwaGV0TGlicyA9IGdldFBoZXRMaWJzKCByZXBvLCAncGhldCcgKTtcclxuICAgICAgY29uc3QgYWxsTG9jYWxlcyA9IFsgQ2hpcHBlckNvbnN0YW50cy5GQUxMQkFDS19MT0NBTEUsIC4uLmdldExvY2FsZXNGcm9tUmVwb3NpdG9yeSggcmVwbyApIF07XHJcbiAgICAgIGNvbnN0IHsgc3RyaW5nTWFwIH0gPSBnZXRTdHJpbmdNYXAoIHJlcG8sIGFsbExvY2FsZXMsIHBoZXRMaWJzLCB3ZWJwYWNrUmVzdWx0LnVzZWRNb2R1bGVzICk7XHJcblxyXG4gICAgICAvLyBUT0RPOiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvMTg3NyBUaGlzIGlzIG9ubHkgcGVydGluZW50IGZvciBwaGV0LWlvLCBzbyBJJ20gb3V0cHV0dGluZ1xyXG4gICAgICAvLyBpdCB0byBwaGV0LWlvLXNpbS1zcGVjaWZpYy4gIEJ1dCBub25lIG9mIGludHJpbnNpYyBkYXRhIGlzIHBoZXQtaW8tc3BlY2lmaWMuXHJcbiAgICAgIC8vIERvIHdlIHdhbnQgYSBkaWZmZXJlbnQgcGF0aCBmb3IgaXQ/XHJcbiAgICAgIC8vIFRPRE86IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvL2lzc3Vlcy8xODc3IEhvdyBkbyB3ZSBpbmRpY2F0ZSB0aGF0IGl0IGlzIGEgYnVpbGQgYXJ0aWZhY3QsIGFuZFxyXG4gICAgICAvLyBzaG91bGQgbm90IGJlIG1hbnVhbGx5IHVwZGF0ZWQ/XHJcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMoIGAuLi9waGV0LWlvLXNpbS1zcGVjaWZpYy9yZXBvcy8ke3JlcG99L3VzZWQtc3RyaW5nc19lbi5qc29uYCwgSlNPTi5zdHJpbmdpZnkoIHN0cmluZ01hcC5lbiwgbnVsbCwgMiApICk7XHJcbiAgICB9IClcclxuICApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdidWlsZC1mb3Itc2VydmVyJywgJ21lYW50IGZvciB1c2UgYnkgYnVpbGQtc2VydmVyIG9ubHknLFxyXG4gICAgWyAnYnVpbGQnIF1cclxuICApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdsaW50JyxcclxuICAgIGBsaW50IGpzIGZpbGVzLiBPcHRpb25zOlxyXG4tLWRpc2FibGUtZXNsaW50LWNhY2hlOiBjYWNoZSB3aWxsIG5vdCBiZSByZWFkIGZyb20sIGFuZCBjYWNoZSB3aWxsIGJlIGNsZWFyZWQgZm9yIG5leHQgcnVuLlxyXG4tLWZpeDogYXV0b2ZpeGFibGUgY2hhbmdlcyB3aWxsIGJlIHdyaXR0ZW4gdG8gZGlza1xyXG4tLWNoaXAtYXdheTogb3V0cHV0IGEgbGlzdCBvZiByZXNwb25zaWJsZSBkZXZzIGZvciBlYWNoIHJlcG8gd2l0aCBsaW50IHByb2JsZW1zXHJcbi0tcmVwb3M6IGNvbW1hIHNlcGFyYXRlZCBsaXN0IG9mIHJlcG9zIHRvIGxpbnQgaW4gYWRkaXRpb24gdG8gdGhlIHJlcG8gZnJvbSBydW5uaW5nYCxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGxpbnQgPSByZXF1aXJlKCAnLi9saW50JyApO1xyXG5cclxuICAgICAgLy8gLS1kaXNhYmxlLWVzbGludC1jYWNoZSBkaXNhYmxlcyB0aGUgY2FjaGUsIHVzZWZ1bCBmb3IgZGV2ZWxvcGluZyBydWxlc1xyXG4gICAgICBjb25zdCBjYWNoZSA9ICFncnVudC5vcHRpb24oICdkaXNhYmxlLWVzbGludC1jYWNoZScgKTtcclxuICAgICAgY29uc3QgZml4ID0gZ3J1bnQub3B0aW9uKCAnZml4JyApO1xyXG4gICAgICBjb25zdCBjaGlwQXdheSA9IGdydW50Lm9wdGlvbiggJ2NoaXAtYXdheScgKTtcclxuXHJcbiAgICAgIGNvbnN0IGV4dHJhUmVwb3MgPSBncnVudC5vcHRpb24oICdyZXBvcycgKSA/IGdydW50Lm9wdGlvbiggJ3JlcG9zJyApLnNwbGl0KCAnLCcgKSA6IFtdO1xyXG5cclxuICAgICAgY29uc3QgbGludFJldHVyblZhbHVlID0gYXdhaXQgbGludCggWyByZXBvLCAuLi5leHRyYVJlcG9zIF0sIHtcclxuICAgICAgICBjYWNoZTogY2FjaGUsXHJcbiAgICAgICAgZml4OiBmaXgsXHJcbiAgICAgICAgY2hpcEF3YXk6IGNoaXBBd2F5XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGlmICggIWxpbnRSZXR1cm5WYWx1ZS5vayApIHtcclxuICAgICAgICBncnVudC5mYWlsLmZhdGFsKCAnTGludCBmYWlsZWQnICk7XHJcbiAgICAgIH1cclxuICAgIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdsaW50LWFsbCcsICdsaW50IGFsbCBqcyBmaWxlcyB0aGF0IGFyZSByZXF1aXJlZCB0byBidWlsZCB0aGlzIHJlcG9zaXRvcnkgKGZvciB0aGUgc3BlY2lmaWVkIGJyYW5kcyknLCB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgY29uc3QgbGludCA9IHJlcXVpcmUoICcuL2xpbnQnICk7XHJcblxyXG4gICAgLy8gLS1kaXNhYmxlLWVzbGludC1jYWNoZSBkaXNhYmxlcyB0aGUgY2FjaGUsIHVzZWZ1bCBmb3IgZGV2ZWxvcGluZyBydWxlc1xyXG4gICAgY29uc3QgY2FjaGUgPSAhZ3J1bnQub3B0aW9uKCAnZGlzYWJsZS1lc2xpbnQtY2FjaGUnICk7XHJcbiAgICBjb25zdCBmaXggPSBncnVudC5vcHRpb24oICdmaXgnICk7XHJcbiAgICBjb25zdCBjaGlwQXdheSA9IGdydW50Lm9wdGlvbiggJ2NoaXAtYXdheScgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFncnVudC5vcHRpb24oICdwYXR0ZXJucycgKSwgJ3BhdHRlcm5zIG5vdCBzdXBwb3J0IGZvciBsaW50LWFsbCcgKTtcclxuXHJcbiAgICBjb25zdCBnZXRQaGV0TGlicyA9IHJlcXVpcmUoICcuL2dldFBoZXRMaWJzJyApO1xyXG5cclxuICAgIGNvbnN0IGJyYW5kcyA9IGdldEJyYW5kcyggZ3J1bnQsIHJlcG8sIGJ1aWxkTG9jYWwgKTtcclxuXHJcbiAgICBjb25zdCBsaW50UmV0dXJuVmFsdWUgPSBhd2FpdCBsaW50KCBnZXRQaGV0TGlicyggcmVwbywgYnJhbmRzICksIHtcclxuICAgICAgY2FjaGU6IGNhY2hlLFxyXG4gICAgICBmaXg6IGZpeCxcclxuICAgICAgY2hpcEF3YXk6IGNoaXBBd2F5XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gT3V0cHV0IHJlc3VsdHMgb24gZXJyb3JzLlxyXG4gICAgaWYgKCAhbGludFJldHVyblZhbHVlLm9rICkge1xyXG4gICAgICBncnVudC5mYWlsLmZhdGFsKCAnTGludCBmYWlsZWQnICk7XHJcbiAgICB9XHJcbiAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ2dlbmVyYXRlLWRldmVsb3BtZW50LWh0bWwnLFxyXG4gICAgJ0dlbmVyYXRlcyB0b3AtbGV2ZWwgU0lNX2VuLmh0bWwgZmlsZSBiYXNlZCBvbiB0aGUgcHJlbG9hZHMgaW4gcGFja2FnZS5qc29uLicsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBnZW5lcmF0ZURldmVsb3BtZW50SFRNTCA9IHJlcXVpcmUoICcuL2dlbmVyYXRlRGV2ZWxvcG1lbnRIVE1MJyApO1xyXG5cclxuICAgICAgYXdhaXQgZ2VuZXJhdGVEZXZlbG9wbWVudEhUTUwoIHJlcG8gKTtcclxuICAgIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdnZW5lcmF0ZS10ZXN0LWh0bWwnLFxyXG4gICAgJ0dlbmVyYXRlcyB0b3AtbGV2ZWwgU0lNLXRlc3RzLmh0bWwgZmlsZSBiYXNlZCBvbiB0aGUgcHJlbG9hZHMgaW4gcGFja2FnZS5qc29uLiAgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9hcXVhL2Jsb2IvbWFpbi9kb2MvYWRkaW5nLXVuaXQtdGVzdHMubWQgJyArXHJcbiAgICAnZm9yIG1vcmUgaW5mb3JtYXRpb24gb24gYXV0b21hdGVkIHRlc3RpbmcuIFVzdWFsbHkgeW91IHNob3VsZCAnICtcclxuICAgICdzZXQgdGhlIFwiZ2VuZXJhdGVkVW5pdFRlc3RzXCI6dHJ1ZSBmbGFnIGluIHRoZSBzaW0gcGFja2FnZS5qc29uIGFuZCBydW4gYGdydW50IHVwZGF0ZWAgaW5zdGVhZCBvZiBtYW51YWxseSBnZW5lcmF0aW5nIHRoaXMuJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGdlbmVyYXRlVGVzdEhUTUwgPSByZXF1aXJlKCAnLi9nZW5lcmF0ZVRlc3RIVE1MJyApO1xyXG5cclxuICAgICAgYXdhaXQgZ2VuZXJhdGVUZXN0SFRNTCggcmVwbyApO1xyXG4gICAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ2dlbmVyYXRlLWExMXktdmlldy1odG1sJyxcclxuICAgICdHZW5lcmF0ZXMgdG9wLWxldmVsIFNJTS1hMTF5LXZpZXcuaHRtbCBmaWxlIHVzZWQgZm9yIHZpc3VhbGl6aW5nIGFjY2Vzc2libGUgY29udGVudC4gVXN1YWxseSB5b3Ugc2hvdWxkICcgK1xyXG4gICAgJ3NldCB0aGUgXCJwaGV0LnNpbUZlYXR1cmVzLnN1cHBvcnRzSW50ZXJhY3RpdmVEZXNjcmlwdGlvblwiOnRydWUgZmxhZyBpbiB0aGUgc2ltIHBhY2thZ2UuanNvbiBhbmQgcnVuIGBncnVudCB1cGRhdGVgICcgK1xyXG4gICAgJ2luc3RlYWQgb2YgbWFudWFsbHkgZ2VuZXJhdGluZyB0aGlzLicsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG5cclxuICAgICAgY29uc3QgZ2VuZXJhdGVBMTF5Vmlld0hUTUwgPSByZXF1aXJlKCAnLi9nZW5lcmF0ZUExMXlWaWV3SFRNTCcgKTtcclxuICAgICAgYXdhaXQgZ2VuZXJhdGVBMTF5Vmlld0hUTUwoIHJlcG8gKTtcclxuICAgIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICd1cGRhdGUnLCBgXHJcblVwZGF0ZXMgdGhlIG5vcm1hbCBhdXRvbWF0aWNhbGx5LWdlbmVyYXRlZCBmaWxlcyBmb3IgdGhpcyByZXBvc2l0b3J5LiBJbmNsdWRlczpcclxuICAqIHJ1bm5hYmxlczogZ2VuZXJhdGUtZGV2ZWxvcG1lbnQtaHRtbCBhbmQgbW9kdWxpZnlcclxuICAqIGFjY2Vzc2libGUgcnVubmFibGVzOiBnZW5lcmF0ZS1hMTF5LXZpZXctaHRtbFxyXG4gICogdW5pdCB0ZXN0czogZ2VuZXJhdGUtdGVzdC1odG1sXHJcbiAgKiBzaW11bGF0aW9uczogZ2VuZXJhdGVSRUFETUUoKVxyXG4gICogcGhldC1pbyBzaW11bGF0aW9uczogZ2VuZXJhdGUgb3ZlcnJpZGVzIGZpbGUgaWYgbmVlZGVkXHJcbiAgKiBjcmVhdGUgdGhlIGNvbmdsb21lcmF0ZSBzdHJpbmcgZmlsZXMgZm9yIHVuYnVpbHQgbW9kZSwgZm9yIHRoaXMgcmVwbyBhbmQgaXRzIGRlcGVuZGVuY2llc2AsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBnZW5lcmF0ZVJFQURNRSA9IHJlcXVpcmUoICcuL2dlbmVyYXRlUkVBRE1FJyApO1xyXG4gICAgICBjb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcclxuICAgICAgY29uc3QgXyA9IHJlcXVpcmUoICdsb2Rhc2gnICk7XHJcblxyXG4gICAgICAvLyBzdXBwb3J0IHJlcG9zIHRoYXQgZG9uJ3QgaGF2ZSBhIHBoZXQgb2JqZWN0XHJcbiAgICAgIGlmICggIXBhY2thZ2VPYmplY3QucGhldCApIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIG1vZHVsaWZ5IGlzIGdyYWNlZnVsIGlmIHRoZXJlIGFyZSBubyBmaWxlcyB0aGF0IG5lZWQgbW9kdWxpZnlpbmcuXHJcbiAgICAgIGdydW50LnRhc2sucnVuKCAnbW9kdWxpZnknICk7XHJcblxyXG4gICAgICAvLyB1cGRhdGUgUkVBRE1FLm1kIG9ubHkgZm9yIHNpbXVsYXRpb25zXHJcbiAgICAgIGlmICggcGFja2FnZU9iamVjdC5waGV0LnNpbXVsYXRpb24gJiYgIXBhY2thZ2VPYmplY3QucGhldC5yZWFkbWVDcmVhdGVkTWFudWFsbHkgKSB7XHJcbiAgICAgICAgYXdhaXQgZ2VuZXJhdGVSRUFETUUoIHJlcG8sICEhcGFja2FnZU9iamVjdC5waGV0LnB1Ymxpc2hlZCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIHBhY2thZ2VPYmplY3QucGhldC5zdXBwb3J0ZWRCcmFuZHMgJiYgcGFja2FnZU9iamVjdC5waGV0LnN1cHBvcnRlZEJyYW5kcy5pbmNsdWRlcyggJ3BoZXQtaW8nICkgKSB7XHJcblxyXG4gICAgICAgIC8vIENvcGllZCBmcm9tIGJ1aWxkLmpzb24gYW5kIHVzZWQgYXMgYSBwcmVsb2FkIGZvciBwaGV0LWlvIGJyYW5kXHJcbiAgICAgICAgY29uc3Qgb3ZlcnJpZGVzRmlsZSA9IGBqcy8ke3JlcG99LXBoZXQtaW8tb3ZlcnJpZGVzLmpzYDtcclxuXHJcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgYWxyZWFkeSBhbiBvdmVycmlkZXMgZmlsZSwgZG9uJ3Qgb3ZlcndyaXRlIGl0IHdpdGggYW4gZW1wdHkgb25lXHJcbiAgICAgICAgaWYgKCAhZnMuZXhpc3RzU3luYyggYC4uLyR7cmVwb30vJHtvdmVycmlkZXNGaWxlfWAgKSApIHtcclxuICAgICAgICAgIGNvbnN0IHdyaXRlRmlsZUFuZEdpdEFkZCA9IHJlcXVpcmUoICcuLi8uLi8uLi9wZXJlbm5pYWwtYWxpYXMvanMvY29tbW9uL3dyaXRlRmlsZUFuZEdpdEFkZCcgKTtcclxuXHJcbiAgICAgICAgICBjb25zdCBvdmVycmlkZXNDb250ZW50ID0gJy8qIGVzbGludC1kaXNhYmxlICovXFxud2luZG93LnBoZXQucHJlbG9hZHMucGhldGlvLnBoZXRpb0VsZW1lbnRzT3ZlcnJpZGVzID0ge307JztcclxuICAgICAgICAgIGF3YWl0IHdyaXRlRmlsZUFuZEdpdEFkZCggcmVwbywgb3ZlcnJpZGVzRmlsZSwgb3ZlcnJpZGVzQ29udGVudCApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHNpbVNwZWNpZmljV3JhcHBlcnM7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIC8vIFBvcHVsYXRlIHNpbS1zcGVjaWZpYyB3cmFwcGVycyBpbnRvIHRoZSBwYWNrYWdlLmpzb25cclxuICAgICAgICAgIHNpbVNwZWNpZmljV3JhcHBlcnMgPSBmcy5yZWFkZGlyU3luYyggYC4uL3BoZXQtaW8tc2ltLXNwZWNpZmljL3JlcG9zLyR7cmVwb30vd3JhcHBlcnMvYCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0gKVxyXG4gICAgICAgICAgICAuZmlsdGVyKCBkaXJlbnQgPT4gZGlyZW50LmlzRGlyZWN0b3J5KCkgKVxyXG4gICAgICAgICAgICAubWFwKCBkaXJlbnQgPT4gYHBoZXQtaW8tc2ltLXNwZWNpZmljL3JlcG9zLyR7cmVwb30vd3JhcHBlcnMvJHtkaXJlbnQubmFtZX1gICk7XHJcbiAgICAgICAgICBpZiAoIHNpbVNwZWNpZmljV3JhcHBlcnMubGVuZ3RoID4gMCApIHtcclxuXHJcbiAgICAgICAgICAgIHBhY2thZ2VPYmplY3QucGhldFsgJ3BoZXQtaW8nIF0gPSBwYWNrYWdlT2JqZWN0LnBoZXRbICdwaGV0LWlvJyBdIHx8IHt9O1xyXG4gICAgICAgICAgICBwYWNrYWdlT2JqZWN0LnBoZXRbICdwaGV0LWlvJyBdLndyYXBwZXJzID0gXy51bmlxKCBzaW1TcGVjaWZpY1dyYXBwZXJzLmNvbmNhdCggcGFja2FnZU9iamVjdC5waGV0WyAncGhldC1pbycgXS53cmFwcGVycyB8fCBbXSApICk7XHJcbiAgICAgICAgICAgIGdydW50LmZpbGUud3JpdGUoICdwYWNrYWdlLmpzb24nLCBKU09OLnN0cmluZ2lmeSggcGFja2FnZU9iamVjdCwgbnVsbCwgMiApICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoKCBlICkge1xyXG4gICAgICAgICAgaWYgKCAhZS5tZXNzYWdlLmluY2x1ZGVzKCAnbm8gc3VjaCBmaWxlIG9yIGRpcmVjdG9yeScgKSApIHtcclxuICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFRoZSBhYm92ZSBjb2RlIGNhbiBtdXRhdGUgdGhlIHBhY2thZ2UuanNvbiwgc28gZG8gdGhlc2UgYWZ0ZXJcclxuICAgICAgaWYgKCBwYWNrYWdlT2JqZWN0LnBoZXQucnVubmFibGUgKSB7XHJcbiAgICAgICAgZ3J1bnQudGFzay5ydW4oICdnZW5lcmF0ZS1kZXZlbG9wbWVudC1odG1sJyApO1xyXG5cclxuICAgICAgICBpZiAoIHBhY2thZ2VPYmplY3QucGhldC5zaW1GZWF0dXJlcyAmJiBwYWNrYWdlT2JqZWN0LnBoZXQuc2ltRmVhdHVyZXMuc3VwcG9ydHNJbnRlcmFjdGl2ZURlc2NyaXB0aW9uICkge1xyXG4gICAgICAgICAgZ3J1bnQudGFzay5ydW4oICdnZW5lcmF0ZS1hMTF5LXZpZXctaHRtbCcgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBwYWNrYWdlT2JqZWN0LnBoZXQuZ2VuZXJhdGVkVW5pdFRlc3RzICkge1xyXG4gICAgICAgIGdydW50LnRhc2sucnVuKCAnZ2VuZXJhdGUtdGVzdC1odG1sJyApO1xyXG4gICAgICB9XHJcbiAgICB9ICkgKTtcclxuXHJcbiAgLy8gVGhpcyBpcyBub3QgcnVuIGluIGdydW50IHVwZGF0ZSBiZWNhdXNlIGl0IGFmZmVjdHMgZGVwZW5kZW5jaWVzIGFuZCBvdXRwdXRzIGZpbGVzIG91dHNpZGUgb2YgdGhlIHJlcG8uXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAnZ2VuZXJhdGUtZGV2ZWxvcG1lbnQtc3RyaW5ncycsXHJcbiAgICAnVG8gc3VwcG9ydCBsb2NhbGVzPSogaW4gdW5idWlsdCBtb2RlLCBnZW5lcmF0ZSBhIGNvbmdsb21lcmF0ZSBKU09OIGZpbGUgZm9yIGVhY2ggcmVwbyB3aXRoIHRyYW5zbGF0aW9ucyBpbiBiYWJlbC4gUnVuIG9uIGFsbCByZXBvcyB2aWE6XFxuJyArXHJcbiAgICAnKiBmb3ItZWFjaC5zaCBwZXJlbm5pYWwtYWxpYXMvZGF0YS9hY3RpdmUtcmVwb3MgbnBtIGluc3RhbGxcXG4nICtcclxuICAgICcqIGZvci1lYWNoLnNoIHBlcmVubmlhbC1hbGlhcy9kYXRhL2FjdGl2ZS1yZXBvcyBncnVudCBnZW5lcmF0ZS1kZXZlbG9wbWVudC1zdHJpbmdzJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGdlbmVyYXRlRGV2ZWxvcG1lbnRTdHJpbmdzID0gcmVxdWlyZSggJy4uL3NjcmlwdHMvZ2VuZXJhdGVEZXZlbG9wbWVudFN0cmluZ3MnICk7XHJcbiAgICAgIGNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG5cclxuICAgICAgaWYgKCBmcy5leGlzdHNTeW5jKCBgLi4vJHtyZXBvfS8ke3JlcG99LXN0cmluZ3NfZW4uanNvbmAgKSApIHtcclxuICAgICAgICBnZW5lcmF0ZURldmVsb3BtZW50U3RyaW5ncyggcmVwbyApO1xyXG4gICAgICB9XHJcbiAgICB9IClcclxuICApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdwdWJsaXNoZWQtUkVBRE1FJyxcclxuICAgICdHZW5lcmF0ZXMgUkVBRE1FLm1kIGZpbGUgZm9yIGEgcHVibGlzaGVkIHNpbXVsYXRpb24uJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGdlbmVyYXRlUkVBRE1FID0gcmVxdWlyZSggJy4vZ2VuZXJhdGVSRUFETUUnICk7IC8vIHVzZWQgYnkgbXVsdGlwbGUgdGFza3NcclxuICAgICAgYXdhaXQgZ2VuZXJhdGVSRUFETUUoIHJlcG8sIHRydWUgLyogcHVibGlzaGVkICovICk7XHJcbiAgICB9ICkgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAndW5wdWJsaXNoZWQtUkVBRE1FJyxcclxuICAgICdHZW5lcmF0ZXMgUkVBRE1FLm1kIGZpbGUgZm9yIGFuIHVucHVibGlzaGVkIHNpbXVsYXRpb24uJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGdlbmVyYXRlUkVBRE1FID0gcmVxdWlyZSggJy4vZ2VuZXJhdGVSRUFETUUnICk7IC8vIHVzZWQgYnkgbXVsdGlwbGUgdGFza3NcclxuICAgICAgYXdhaXQgZ2VuZXJhdGVSRUFETUUoIHJlcG8sIGZhbHNlIC8qIHB1Ymxpc2hlZCAqLyApO1xyXG4gICAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ3NvcnQtaW1wb3J0cycsICdTb3J0IHRoZSBpbXBvcnQgc3RhdGVtZW50cyBmb3IgYSBzaW5nbGUgZmlsZSAoaWYgLS1maWxlPXt7RklMRX19IGlzIHByb3ZpZGVkKSwgb3IgZG9lcyBzbyBmb3IgYWxsIEpTIGZpbGVzIGlmIG5vdCBzcGVjaWZpZWQnLCB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgY29uc3Qgc29ydEltcG9ydHMgPSByZXF1aXJlKCAnLi9zb3J0SW1wb3J0cycgKTtcclxuXHJcbiAgICBjb25zdCBmaWxlID0gZ3J1bnQub3B0aW9uKCAnZmlsZScgKTtcclxuXHJcbiAgICBpZiAoIGZpbGUgKSB7XHJcbiAgICAgIHNvcnRJbXBvcnRzKCBmaWxlICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgZ3J1bnQuZmlsZS5yZWN1cnNlKCBgLi4vJHtyZXBvfS9qc2AsIGFic2ZpbGUgPT4gc29ydEltcG9ydHMoIGFic2ZpbGUgKSApO1xyXG4gICAgfVxyXG4gIH0gKSApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soICdjb21taXRzLXNpbmNlJyxcclxuICAgICdTaG93cyBjb21taXRzIHNpbmNlIGEgc3BlY2lmaWVkIGRhdGUuIFVzZSAtLWRhdGU9PGRhdGU+IHRvIHNwZWNpZnkgdGhlIGRhdGUuJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGRhdGVTdHJpbmcgPSBncnVudC5vcHRpb24oICdkYXRlJyApO1xyXG4gICAgICBhc3NlcnQoIGRhdGVTdHJpbmcsICdtaXNzaW5nIHJlcXVpcmVkIG9wdGlvbjogLS1kYXRlPXt7REFURX19JyApO1xyXG5cclxuICAgICAgY29uc3QgY29tbWl0c1NpbmNlID0gcmVxdWlyZSggJy4vY29tbWl0c1NpbmNlJyApO1xyXG5cclxuICAgICAgYXdhaXQgY29tbWl0c1NpbmNlKCByZXBvLCBkYXRlU3RyaW5nICk7XHJcbiAgICB9ICkgKTtcclxuXHJcbiAgLy8gU2VlIHJlcG9ydE1lZGlhLmpzXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAncmVwb3J0LW1lZGlhJyxcclxuICAgICcocHJvamVjdC13aWRlKSBSZXBvcnQgb24gbGljZW5zZS5qc29uIGZpbGVzIHRocm91Z2hvdXQgYWxsIHdvcmtpbmcgY29waWVzLiAnICtcclxuICAgICdSZXBvcnRzIGFueSBtZWRpYSAoc3VjaCBhcyBpbWFnZXMgb3Igc291bmQpIGZpbGVzIHRoYXQgaGF2ZSBhbnkgb2YgdGhlIGZvbGxvd2luZyBwcm9ibGVtczpcXG4nICtcclxuICAgICcoMSkgaW5jb21wYXRpYmxlLWxpY2Vuc2UgKHJlc291cmNlIGxpY2Vuc2Ugbm90IGFwcHJvdmVkKVxcbicgK1xyXG4gICAgJygyKSBub3QtYW5ub3RhdGVkIChsaWNlbnNlLmpzb24gbWlzc2luZyBvciBlbnRyeSBtaXNzaW5nIGZyb20gbGljZW5zZS5qc29uKVxcbicgK1xyXG4gICAgJygzKSBtaXNzaW5nLWZpbGUgKGVudHJ5IGluIHRoZSBsaWNlbnNlLmpzb24gYnV0IG5vdCBvbiB0aGUgZmlsZSBzeXN0ZW0pJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlcG9ydE1lZGlhID0gcmVxdWlyZSggJy4vcmVwb3J0TWVkaWEnICk7XHJcblxyXG4gICAgICBhd2FpdCByZXBvcnRNZWRpYSggcmVwbyApO1xyXG4gICAgfSApICk7XHJcblxyXG4gIC8vIHNlZSByZXBvcnRUaGlyZFBhcnR5LmpzXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKCAncmVwb3J0LXRoaXJkLXBhcnR5JyxcclxuICAgICdDcmVhdGVzIGEgcmVwb3J0IG9mIHRoaXJkLXBhcnR5IHJlc291cmNlcyAoY29kZSwgaW1hZ2VzLCBzb3VuZCwgZXRjKSB1c2VkIGluIHRoZSBwdWJsaXNoZWQgUGhFVCBzaW11bGF0aW9ucyBieSAnICtcclxuICAgICdyZWFkaW5nIHRoZSBsaWNlbnNlIGluZm9ybWF0aW9uIGluIHB1Ymxpc2hlZCBIVE1MIGZpbGVzIG9uIHRoZSBQaEVUIHdlYnNpdGUuIFRoaXMgdGFzayBtdXN0IGJlIHJ1biBmcm9tIG1haW4uICAnICtcclxuICAgICdBZnRlciBydW5uaW5nIHRoaXMgdGFzaywgeW91IG11c3QgcHVzaCBzaGVycGEvdGhpcmQtcGFydHktbGljZW5zZXMubWQuJyxcclxuICAgIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlcG9ydFRoaXJkUGFydHkgPSByZXF1aXJlKCAnLi9yZXBvcnRUaGlyZFBhcnR5JyApO1xyXG5cclxuICAgICAgYXdhaXQgcmVwb3J0VGhpcmRQYXJ0eSgpO1xyXG4gICAgfSApICk7XHJcblxyXG4gIGdydW50LnJlZ2lzdGVyVGFzayggJ21vZHVsaWZ5JywgJ0NyZWF0ZXMgKi5qcyBtb2R1bGVzIGZvciBhbGwgaW1hZ2VzL3N0cmluZ3MvYXVkaW8vZXRjIGluIGEgcmVwbycsIHdyYXBUYXNrKCBhc3luYyAoKSA9PiB7XHJcbiAgICBjb25zdCBtb2R1bGlmeSA9IHJlcXVpcmUoICcuL21vZHVsaWZ5JyApO1xyXG4gICAgY29uc3QgcmVwb3J0TWVkaWEgPSByZXF1aXJlKCAnLi9yZXBvcnRNZWRpYScgKTtcclxuICAgIGNvbnN0IGdlbmVyYXRlRGV2ZWxvcG1lbnRTdHJpbmdzID0gcmVxdWlyZSggJy4uL3NjcmlwdHMvZ2VuZXJhdGVEZXZlbG9wbWVudFN0cmluZ3MnICk7XHJcbiAgICBjb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcclxuXHJcbiAgICBhd2FpdCBtb2R1bGlmeSggcmVwbyApO1xyXG5cclxuICAgIGlmICggZnMuZXhpc3RzU3luYyggYC4uLyR7cmVwb30vJHtyZXBvfS1zdHJpbmdzX2VuLmpzb25gICkgKSB7XHJcbiAgICAgIGdlbmVyYXRlRGV2ZWxvcG1lbnRTdHJpbmdzKCByZXBvICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRG8gdGhpcyBsYXN0IHRvIGhlbHAgd2l0aCBwcm90b3R5cGluZyBiZWZvcmUgY29tbWl0IChpdCB3b3VsZCBiZSBmcnVzdHJhdGluZyBpZiB0aGlzIGVycm9yZWQgb3V0IGJlZm9yZSBnaXZpbmdcclxuICAgIC8vIHlvdSB0aGUgYXNzZXQgeW91IGNvdWxkIHVzZSBpbiB0aGUgc2ltKS5cclxuICAgIGF3YWl0IHJlcG9ydE1lZGlhKCByZXBvICk7XHJcbiAgfSApICk7XHJcblxyXG4gIC8vIEdydW50IHRhc2sgdGhhdCBkZXRlcm1pbmVzIGNyZWF0ZWQgYW5kIGxhc3QgbW9kaWZpZWQgZGF0ZXMgZnJvbSBnaXQsIGFuZFxyXG4gIC8vIHVwZGF0ZXMgY29weXJpZ2h0IHN0YXRlbWVudHMgYWNjb3JkaW5nbHksIHNlZSAjNDAzXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKFxyXG4gICAgJ3VwZGF0ZS1jb3B5cmlnaHQtZGF0ZXMnLFxyXG4gICAgJ1VwZGF0ZSB0aGUgY29weXJpZ2h0IGRhdGVzIGluIEpTIHNvdXJjZSBmaWxlcyBiYXNlZCBvbiBHaXRodWIgZGF0ZXMnLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgdXBkYXRlQ29weXJpZ2h0RGF0ZXMgPSByZXF1aXJlKCAnLi91cGRhdGVDb3B5cmlnaHREYXRlcycgKTtcclxuXHJcbiAgICAgIGF3YWl0IHVwZGF0ZUNvcHlyaWdodERhdGVzKCByZXBvICk7XHJcbiAgICB9IClcclxuICApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soXHJcbiAgICAnd2VicGFjay1kZXYtc2VydmVyJywgYFJ1bnMgYSB3ZWJwYWNrIHNlcnZlciBmb3IgYSBnaXZlbiBsaXN0IG9mIHNpbXVsYXRpb25zLlxyXG4tLXJlcG9zPVJFUE9TIGZvciBhIGNvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIHJlcG9zIChkZWZhdWx0cyB0byBjdXJyZW50IHJlcG8pXHJcbi0tcG9ydD05MDAwIHRvIGFkanVzdCB0aGUgcnVubmluZyBwb3J0XHJcbi0tZGV2dG9vbD1zdHJpbmcgdmFsdWUgZm9yIHNvdXJjZW1hcCBnZW5lcmF0aW9uIHNwZWNpZmllZCBhdCBodHRwczovL3dlYnBhY2suanMub3JnL2NvbmZpZ3VyYXRpb24vZGV2dG9vbCBvciB1bmRlZmluZWQgZm9yIChub25lKVxyXG4tLWNocm9tZTogb3BlbiB0aGUgc2ltcyBpbiBDaHJvbWUgdGFicyAoTWFjKWAsXHJcbiAgICAoKSA9PiB7XHJcbiAgICAgIC8vIFdlIGRvbid0IGZpbmlzaCEgRG9uJ3QgdGVsbCBncnVudCB0aGlzLi4uXHJcbiAgICAgIGdydW50LnRhc2suY3VycmVudC5hc3luYygpO1xyXG5cclxuICAgICAgY29uc3QgcmVwb3MgPSBncnVudC5vcHRpb24oICdyZXBvcycgKSA/IGdydW50Lm9wdGlvbiggJ3JlcG9zJyApLnNwbGl0KCAnLCcgKSA6IFsgcmVwbyBdO1xyXG4gICAgICBjb25zdCBwb3J0ID0gZ3J1bnQub3B0aW9uKCAncG9ydCcgKSB8fCA5MDAwO1xyXG4gICAgICBsZXQgZGV2dG9vbCA9IGdydW50Lm9wdGlvbiggJ2RldnRvb2wnICkgfHwgJ2lubGluZS1zb3VyY2UtbWFwJztcclxuICAgICAgaWYgKCBkZXZ0b29sID09PSAnbm9uZScgfHwgZGV2dG9vbCA9PT0gJ3VuZGVmaW5lZCcgKSB7XHJcbiAgICAgICAgZGV2dG9vbCA9IHVuZGVmaW5lZDtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBvcGVuQ2hyb21lID0gZ3J1bnQub3B0aW9uKCAnY2hyb21lJyApIHx8IGZhbHNlO1xyXG5cclxuICAgICAgY29uc3Qgd2VicGFja0RldlNlcnZlciA9IHJlcXVpcmUoICcuL3dlYnBhY2tEZXZTZXJ2ZXInICk7XHJcblxyXG4gICAgICAvLyBOT1RFOiBXZSBkb24ndCBjYXJlIGFib3V0IHRoZSBwcm9taXNlIHRoYXQgaXMgcmV0dXJuZWQgaGVyZSwgYmVjYXVzZSB3ZSBhcmUgZ29pbmcgdG8ga2VlcCB0aGlzIHRhc2sgcnVubmluZ1xyXG4gICAgICAvLyB1bnRpbCB0aGUgdXNlciBtYW51YWxseSBraWxscyBpdC5cclxuICAgICAgd2VicGFja0RldlNlcnZlciggcmVwb3MsIHBvcnQsIGRldnRvb2wsIG9wZW5DaHJvbWUgKTtcclxuICAgIH1cclxuICApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soXHJcbiAgICAnZ2VuZXJhdGUtcGhldC1pby1hcGknLFxyXG4gICAgJ091dHB1dCB0aGUgUGhFVC1pTyBBUEkgYXMgSlNPTiB0byBwaGV0LWlvLXNpbS1zcGVjaWZpYy9hcGkuXFxuJyArXHJcbiAgICAnT3B0aW9uc1xcbjonICtcclxuICAgICctLXNpbXM9Li4uIGEgbGlzdCBvZiBzaW1zIHRvIGNvbXBhcmUgKGRlZmF1bHRzIHRvIHRoZSBzaW0gaW4gdGhlIGN1cnJlbnQgZGlyKVxcbicgK1xyXG4gICAgJy0tc2ltTGlzdD0uLi4gYSBmaWxlIHdpdGggYSBsaXN0IG9mIHNpbXMgdG8gY29tcGFyZSAoZGVmYXVsdHMgdG8gdGhlIHNpbSBpbiB0aGUgY3VycmVudCBkaXIpXFxuJyArXHJcbiAgICAnLS1zdGFibGUgLSByZWdlbmVyYXRlIGZvciBhbGwgXCJzdGFibGUgc2ltc1wiIChzZWUgcGVyZW5uaWFsL2RhdGEvcGhldC1pby1hcGktc3RhYmxlLylcXG4nICtcclxuICAgICctLXRlbXBvcmFyeSAtIG91dHB1dHMgdG8gdGhlIHRlbXBvcmFyeSBkaXJlY3RvcnlcXG4nICtcclxuICAgICctLXRyYW5zcGlsZT1mYWxzZSAtIHNraXBzIHRoZSB0cmFuc3BpbGF0aW9uIHN0ZXAuIFlvdSBjYW4gc2tpcCB0cmFuc3BpbGF0aW9uIGlmIGEgd2F0Y2ggcHJvY2VzcyBpcyBoYW5kbGluZyBpdC4nLFxyXG4gICAgd3JhcFRhc2soIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgZm9ybWF0UGhldGlvQVBJID0gcmVxdWlyZSggJy4uL3BoZXQtaW8vZm9ybWF0UGhldGlvQVBJJyApO1xyXG4gICAgICBjb25zdCBnZXRTaW1MaXN0ID0gcmVxdWlyZSggJy4uL2NvbW1vbi9nZXRTaW1MaXN0JyApO1xyXG4gICAgICBjb25zdCBnZW5lcmF0ZVBoZXRpb01hY3JvQVBJID0gcmVxdWlyZSggJy4uL3BoZXQtaW8vZ2VuZXJhdGVQaGV0aW9NYWNyb0FQSScgKTtcclxuICAgICAgY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcblxyXG4gICAgICBjb25zdCBzaW1zID0gZ2V0U2ltTGlzdCgpLmxlbmd0aCA9PT0gMCA/IFsgcmVwbyBdIDogZ2V0U2ltTGlzdCgpO1xyXG5cclxuICAgICAgLy8gSWRlYWxseSB0cmFuc3BpbGF0aW9uIHdvdWxkIGJlIGEgbm8tb3AgaWYgdGhlIHdhdGNoIHByb2Nlc3MgaXMgcnVubmluZy4gSG93ZXZlciwgaXQgY2FuIHRha2UgMisgc2Vjb25kcyBvblxyXG4gICAgICAvLyBtYWNPUyB0byBjaGVjayBhbGwgZmlsZXMsIGFuZCBzb21ldGltZXMgbXVjaCBsb25nZXIgKDUwKyBzZWNvbmRzKSBpZiB0aGUgY2FjaGUgbWVjaGFuaXNtIGlzIGZhaWxpbmcuXHJcbiAgICAgIC8vIFNvIHRoaXMgXCJza2lwXCIgaXMgYSBiYW5kLWFpZCB1bnRpbCB3ZSByZWR1Y2UgdGhvc2Ugb3RoZXIgcHJvYmxlbXMuXHJcbiAgICAgIGNvbnN0IHNraXBUcmFuc3BpbGUgPSBncnVudC5vcHRpb24oICd0cmFuc3BpbGUnICkgPT09IGZhbHNlO1xyXG4gICAgICBpZiAoICFza2lwVHJhbnNwaWxlICkge1xyXG4gICAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XHJcbiAgICAgICAgdHJhbnNwaWxlci50cmFuc3BpbGVBbGwoKTtcclxuICAgICAgICBjb25zdCB0cmFuc3BpbGVUaW1lTVMgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xyXG5cclxuICAgICAgICAvLyBOb3RpZnkgYWJvdXQgbG9uZyB0cmFuc3BpbGUgdGltZXMsIGluIGNhc2UgbW9yZSBwZW9wbGUgbmVlZCB0byBza2lwXHJcbiAgICAgICAgaWYgKCB0cmFuc3BpbGVUaW1lTVMgPj0gNTAwMCApIHtcclxuICAgICAgICAgIGdydW50LmxvZy53cml0ZWxuKCBgZ2VuZXJhdGUtcGhldC1pby1hcGkgdHJhbnNwaWxhdGlvbiB0b29rICR7dHJhbnNwaWxlVGltZU1TfSBtc2AgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgZ3J1bnQubG9nLndyaXRlbG4oICdTa2lwcGluZyB0cmFuc3BpbGF0aW9uJyApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgZ2VuZXJhdGVQaGV0aW9NYWNyb0FQSSggc2ltcywge1xyXG4gICAgICAgIHNob3dQcm9ncmVzc0Jhcjogc2ltcy5sZW5ndGggPiAxLFxyXG4gICAgICAgIHRocm93QVBJR2VuZXJhdGlvbkVycm9yczogZmFsc2UgLy8gV3JpdGUgYXMgbWFueSBhcyB3ZSBjYW4sIGFuZCBwcmludCB3aGF0IHdlIGRpZG4ndCB3cml0ZVxyXG4gICAgICB9ICk7XHJcbiAgICAgIHNpbXMuZm9yRWFjaCggc2ltID0+IHtcclxuICAgICAgICBjb25zdCBkaXIgPSBgLi4vcGhldC1pby1zaW0tc3BlY2lmaWMvcmVwb3MvJHtzaW19YDtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgZnMubWtkaXJTeW5jKCBkaXIgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgICAvLyBEaXJlY3RvcnkgZXhpc3RzXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gYCR7ZGlyfS8ke3NpbX0tcGhldC1pby1hcGkke2dydW50Lm9wdGlvbiggJ3RlbXBvcmFyeScgKSA/ICctdGVtcG9yYXJ5JyA6ICcnfS5qc29uYDtcclxuICAgICAgICBjb25zdCBhcGkgPSByZXN1bHRzWyBzaW0gXTtcclxuICAgICAgICBhcGkgJiYgZnMud3JpdGVGaWxlU3luYyggZmlsZVBhdGgsIGZvcm1hdFBoZXRpb0FQSSggYXBpICkgKTtcclxuICAgICAgfSApO1xyXG4gICAgfSApXHJcbiAgKTtcclxuXHJcbiAgZ3J1bnQucmVnaXN0ZXJUYXNrKFxyXG4gICAgJ2NvbXBhcmUtcGhldC1pby1hcGknLFxyXG4gICAgJ0NvbXBhcmVzIHRoZSBwaGV0LWlvLWFwaSBhZ2FpbnN0IHRoZSByZWZlcmVuY2UgdmVyc2lvbihzKSBpZiB0aGlzIHNpbVxcJ3MgcGFja2FnZS5qc29uIG1hcmtzIGNvbXBhcmVEZXNpZ25lZEFQSUNoYW5nZXMuICAnICtcclxuICAgICdUaGlzIHdpbGwgYnkgZGVmYXVsdCBjb21wYXJlIGRlc2lnbmVkIGNoYW5nZXMgb25seS4gT3B0aW9uczpcXG4nICtcclxuICAgICctLXNpbXM9Li4uIGEgbGlzdCBvZiBzaW1zIHRvIGNvbXBhcmUgKGRlZmF1bHRzIHRvIHRoZSBzaW0gaW4gdGhlIGN1cnJlbnQgZGlyKVxcbicgK1xyXG4gICAgJy0tc2ltTGlzdD0uLi4gYSBmaWxlIHdpdGggYSBsaXN0IG9mIHNpbXMgdG8gY29tcGFyZSAoZGVmYXVsdHMgdG8gdGhlIHNpbSBpbiB0aGUgY3VycmVudCBkaXIpXFxuJyArXHJcbiAgICAnLS1zdGFibGUsIGdlbmVyYXRlIHRoZSBwaGV0LWlvLWFwaXMgZm9yIGVhY2ggcGhldC1pbyBzaW0gY29uc2lkZXJlZCB0byBoYXZlIGEgc3RhYmxlIEFQSSAoc2VlIHBlcmVubmlhbC1hbGlhcy9kYXRhL3BoZXQtaW8tYXBpLXN0YWJsZSlcXG4nICtcclxuICAgICctLWRlbHRhLCBieSBkZWZhdWx0IGEgYnJlYWtpbmctY29tcGF0aWJpbGl0eSBjb21wYXJpc29uIGlzIGRvbmUsIGJ1dCAtLWRlbHRhIHNob3dzIGFsbCBjaGFuZ2VzXFxuJyArXHJcbiAgICAnLS10ZW1wb3JhcnksIGNvbXBhcmVzIEFQSSBmaWxlcyBpbiB0aGUgdGVtcG9yYXJ5IGRpcmVjdG9yeSAob3RoZXJ3aXNlIGNvbXBhcmVzIHRvIGZyZXNobHkgZ2VuZXJhdGVkIEFQSXMpXFxuJyArXHJcbiAgICAnLS1jb21wYXJlQnJlYWtpbmdBUElDaGFuZ2VzIC0gYWRkIHRoaXMgZmxhZyB0byBjb21wYXJlIGJyZWFraW5nIGNoYW5nZXMgaW4gYWRkaXRpb24gdG8gZGVzaWduZWQgY2hhbmdlcycsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBnZXRTaW1MaXN0ID0gcmVxdWlyZSggJy4uL2NvbW1vbi9nZXRTaW1MaXN0JyApO1xyXG4gICAgICBjb25zdCBnZW5lcmF0ZVBoZXRpb01hY3JvQVBJID0gcmVxdWlyZSggJy4uL3BoZXQtaW8vZ2VuZXJhdGVQaGV0aW9NYWNyb0FQSScgKTtcclxuICAgICAgY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcblxyXG4gICAgICBjb25zdCBzaW1zID0gZ2V0U2ltTGlzdCgpLmxlbmd0aCA9PT0gMCA/IFsgcmVwbyBdIDogZ2V0U2ltTGlzdCgpO1xyXG4gICAgICBjb25zdCB0ZW1wb3JhcnkgPSBncnVudC5vcHRpb24oICd0ZW1wb3JhcnknICk7XHJcbiAgICAgIGxldCBwcm9wb3NlZEFQSXMgPSBudWxsO1xyXG4gICAgICBpZiAoIHRlbXBvcmFyeSApIHtcclxuICAgICAgICBwcm9wb3NlZEFQSXMgPSB7fTtcclxuICAgICAgICBzaW1zLmZvckVhY2goIHNpbSA9PiB7XHJcbiAgICAgICAgICBwcm9wb3NlZEFQSXNbIHNpbSBdID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBgLi4vcGhldC1pby1zaW0tc3BlY2lmaWMvcmVwb3MvJHtyZXBvfS8ke3JlcG99LXBoZXQtaW8tYXBpLXRlbXBvcmFyeS5qc29uYCwgJ3V0ZjgnICkgKTtcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgIHRyYW5zcGlsZXIudHJhbnNwaWxlQWxsKCk7XHJcbiAgICAgICAgcHJvcG9zZWRBUElzID0gYXdhaXQgZ2VuZXJhdGVQaGV0aW9NYWNyb0FQSSggc2ltcywge1xyXG4gICAgICAgICAgc2hvd1Byb2dyZXNzQmFyOiBzaW1zLmxlbmd0aCA+IDEsXHJcbiAgICAgICAgICBzaG93TWVzc2FnZXNGcm9tU2ltOiBmYWxzZVxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gRG9uJ3QgYWRkIHRvIG9wdGlvbnMgb2JqZWN0IGlmIHZhbHVlcyBhcmUgYHVuZGVmaW5lZGAgKGFzIF8uZXh0ZW5kIHdpbGwga2VlcCB0aG9zZSBlbnRyaWVzIGFuZCBub3QgbWl4IGluIGRlZmF1bHRzXHJcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7fTtcclxuICAgICAgaWYgKCBncnVudC5vcHRpb24oICdkZWx0YScgKSApIHtcclxuICAgICAgICBvcHRpb25zLmRlbHRhID0gZ3J1bnQub3B0aW9uKCAnZGVsdGEnICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBncnVudC5vcHRpb24oICdjb21wYXJlQnJlYWtpbmdBUElDaGFuZ2VzJyApICkge1xyXG4gICAgICAgIG9wdGlvbnMuY29tcGFyZUJyZWFraW5nQVBJQ2hhbmdlcyA9IGdydW50Lm9wdGlvbiggJ2NvbXBhcmVCcmVha2luZ0FQSUNoYW5nZXMnICk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3Qgb2sgPSBhd2FpdCByZXF1aXJlKCAnLi4vcGhldC1pby9waGV0aW9Db21wYXJlQVBJU2V0cycgKSggc2ltcywgcHJvcG9zZWRBUElzLCBvcHRpb25zICk7XHJcbiAgICAgICFvayAmJiBncnVudC5mYWlsLmZhdGFsKCAnUGhFVC1pTyBBUEkgY29tcGFyaXNvbiBmYWlsZWQnICk7XHJcbiAgICB9IClcclxuICApO1xyXG5cclxuICBncnVudC5yZWdpc3RlclRhc2soXHJcbiAgICAncHJvZmlsZS1maWxlLXNpemUnLFxyXG4gICAgJ1Byb2ZpbGVzIHRoZSBmaWxlIHNpemUgb2YgdGhlIGJ1aWx0IEpTIGZpbGUgZm9yIGEgZ2l2ZW4gcmVwbycsXHJcbiAgICB3cmFwVGFzayggYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBwcm9maWxlRmlsZVNpemUgPSByZXF1aXJlKCAnLi4vZ3J1bnQvcHJvZmlsZUZpbGVTaXplJyApO1xyXG5cclxuICAgICAgYXdhaXQgcHJvZmlsZUZpbGVTaXplKCByZXBvICk7XHJcbiAgICB9IClcclxuICApO1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGdydW50IHRhc2tzIHRoYXQgZWZmZWN0aXZlbHkgZ2V0IGZvcndhcmRlZCB0byBwZXJlbm5pYWwuIEl0IHdpbGwgZXhlY3V0ZSBhIGdydW50IHByb2Nlc3MgcnVubmluZyBmcm9tXHJcbiAgICogcGVyZW5uaWFsJ3MgZGlyZWN0b3J5IHdpdGggdGhlIHNhbWUgb3B0aW9ucyAoYnV0IHdpdGggLS1yZXBvPXt7UkVQT319IGFkZGVkLCBzbyB0aGF0IHBlcmVubmlhbCBpcyBhd2FyZSBvZiB3aGF0XHJcbiAgICogcmVwb3NpdG9yeSBpcyB0aGUgdGFyZ2V0KS5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFzayAtIFRoZSBuYW1lIG9mIHRoZSB0YXNrXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gZm9yd2FyZFRvUGVyZW5uaWFsR3J1bnQoIHRhc2sgKSB7XHJcbiAgICBncnVudC5yZWdpc3RlclRhc2soIHRhc2ssICdSdW4gZ3J1bnQgLS1oZWxwIGluIHBlcmVubmlhbCB0byBzZWUgZG9jdW1lbnRhdGlvbicsICgpID0+IHtcclxuICAgICAgZ3J1bnQubG9nLndyaXRlbG4oICcoRm9yd2FyZGluZyB0YXNrIHRvIHBlcmVubmlhbCknICk7XHJcblxyXG4gICAgICBjb25zdCBjaGlsZF9wcm9jZXNzID0gcmVxdWlyZSggJ2NoaWxkX3Byb2Nlc3MnICk7XHJcblxyXG5cclxuICAgICAgY29uc3QgZG9uZSA9IGdydW50LnRhc2suY3VycmVudC5hc3luYygpO1xyXG5cclxuICAgICAgLy8gSW5jbHVkZSB0aGUgLS1yZXBvIGZsYWdcclxuICAgICAgY29uc3QgYXJncyA9IFsgYC0tcmVwbz0ke3JlcG99YCwgLi4ucHJvY2Vzcy5hcmd2LnNsaWNlKCAyICkgXTtcclxuICAgICAgY29uc3QgYXJnc1N0cmluZyA9IGFyZ3MubWFwKCBhcmcgPT4gYFwiJHthcmd9XCJgICkuam9pbiggJyAnICk7XHJcbiAgICAgIGNvbnN0IHNwYXduZWQgPSBjaGlsZF9wcm9jZXNzLnNwYXduKCAvXndpbi8udGVzdCggcHJvY2Vzcy5wbGF0Zm9ybSApID8gJ2dydW50LmNtZCcgOiAnZ3J1bnQnLCBhcmdzLCB7XHJcbiAgICAgICAgY3dkOiAnLi4vcGVyZW5uaWFsJ1xyXG4gICAgICB9ICk7XHJcbiAgICAgIGdydW50LmxvZy5kZWJ1ZyggYHJ1bm5pbmcgZ3J1bnQgJHthcmdzU3RyaW5nfSBpbiAuLi8ke3JlcG99YCApO1xyXG5cclxuICAgICAgc3Bhd25lZC5zdGRlcnIub24oICdkYXRhJywgZGF0YSA9PiBncnVudC5sb2cuZXJyb3IoIGRhdGEudG9TdHJpbmcoKSApICk7XHJcbiAgICAgIHNwYXduZWQuc3Rkb3V0Lm9uKCAnZGF0YScsIGRhdGEgPT4gZ3J1bnQubG9nLndyaXRlKCBkYXRhLnRvU3RyaW5nKCkgKSApO1xyXG4gICAgICBwcm9jZXNzLnN0ZGluLnBpcGUoIHNwYXduZWQuc3RkaW4gKTtcclxuXHJcbiAgICAgIHNwYXduZWQub24oICdjbG9zZScsIGNvZGUgPT4ge1xyXG4gICAgICAgIGlmICggY29kZSAhPT0gMCApIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciggYHBlcmVubmlhbCBncnVudCAke2FyZ3NTdHJpbmd9IGZhaWxlZCB3aXRoIGNvZGUgJHtjb2RlfWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBkb25lKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICBbXHJcbiAgICAnY2hlY2tvdXQtc2hhcycsXHJcbiAgICAnY2hlY2tvdXQtdGFyZ2V0JyxcclxuICAgICdjaGVja291dC1yZWxlYXNlJyxcclxuICAgICdjaGVja291dC1tYWluJyxcclxuICAgICdjaGVja291dC1tYWluLWFsbCcsXHJcbiAgICAnY3JlYXRlLW9uZS1vZmYnLFxyXG4gICAgJ3NoYS1jaGVjaycsXHJcbiAgICAnc2ltLWxpc3QnLFxyXG4gICAgJ25wbS11cGRhdGUnLFxyXG4gICAgJ2NyZWF0ZS1yZWxlYXNlJyxcclxuICAgICdjaGVycnktcGljaycsXHJcbiAgICAnd3JhcHBlcicsXHJcbiAgICAnZGV2JyxcclxuICAgICdvbmUtb2ZmJyxcclxuICAgICdyYycsXHJcbiAgICAncHJvZHVjdGlvbicsXHJcbiAgICAncHJvdG90eXBlJyxcclxuICAgICdjcmVhdGUtc2ltJyxcclxuICAgICdpbnNlcnQtcmVxdWlyZS1zdGF0ZW1lbnQnLFxyXG4gICAgJ2xpbnQtZXZlcnl0aGluZycsXHJcbiAgICAnZ2VuZXJhdGUtZGF0YScsXHJcbiAgICAncGRvbS1jb21wYXJpc29uJyxcclxuICAgICdyZWxlYXNlLWJyYW5jaC1saXN0J1xyXG4gIF0uZm9yRWFjaCggZm9yd2FyZFRvUGVyZW5uaWFsR3J1bnQgKTtcclxufTtcclxuXHJcbmNvbnN0IGdldEJyYW5kcyA9ICggZ3J1bnQsIHJlcG8sIGJ1aWxkTG9jYWwgKSA9PiB7XHJcblxyXG4gIC8vIERldGVybWluZSB3aGF0IGJyYW5kcyB3ZSB3YW50IHRvIGJ1aWxkXHJcbiAgYXNzZXJ0KCAhZ3J1bnQub3B0aW9uKCAnYnJhbmQnICksICdVc2UgLS1icmFuZHM9e3tCUkFORFN9fSBpbnN0ZWFkIG9mIGJyYW5kJyApO1xyXG5cclxuICBjb25zdCBsb2NhbFBhY2thZ2VPYmplY3QgPSBncnVudC5maWxlLnJlYWRKU09OKCBgLi4vJHtyZXBvfS9wYWNrYWdlLmpzb25gICk7XHJcbiAgY29uc3Qgc3VwcG9ydGVkQnJhbmRzID0gbG9jYWxQYWNrYWdlT2JqZWN0LnBoZXQuc3VwcG9ydGVkQnJhbmRzIHx8IFtdO1xyXG5cclxuICBsZXQgYnJhbmRzO1xyXG4gIGlmICggZ3J1bnQub3B0aW9uKCAnYnJhbmRzJyApICkge1xyXG4gICAgaWYgKCBncnVudC5vcHRpb24oICdicmFuZHMnICkgPT09ICcqJyApIHtcclxuICAgICAgYnJhbmRzID0gc3VwcG9ydGVkQnJhbmRzO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGJyYW5kcyA9IGdydW50Lm9wdGlvbiggJ2JyYW5kcycgKS5zcGxpdCggJywnICk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGVsc2UgaWYgKCBidWlsZExvY2FsLmJyYW5kcyApIHtcclxuICAgIC8vIEV4dHJhIGNoZWNrLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzY0MFxyXG4gICAgYXNzZXJ0KCBBcnJheS5pc0FycmF5KCBidWlsZExvY2FsLmJyYW5kcyApLCAnSWYgYnJhbmRzIGV4aXN0cyBpbiBidWlsZC1sb2NhbC5qc29uLCBpdCBzaG91bGQgYmUgYW4gYXJyYXknICk7XHJcbiAgICBicmFuZHMgPSBidWlsZExvY2FsLmJyYW5kcy5maWx0ZXIoIGJyYW5kID0+IHN1cHBvcnRlZEJyYW5kcy5pbmNsdWRlcyggYnJhbmQgKSApO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGJyYW5kcyA9IFsgJ2FkYXB0ZWQtZnJvbS1waGV0JyBdO1xyXG4gIH1cclxuXHJcbiAgLy8gRW5zdXJlIGFsbCBsaXN0ZWQgYnJhbmRzIGFyZSB2YWxpZFxyXG4gIGJyYW5kcy5mb3JFYWNoKCBicmFuZCA9PiBhc3NlcnQoIHN1cHBvcnRlZEJyYW5kcy5pbmNsdWRlcyggYnJhbmQgKSwgYFVuc3VwcG9ydGVkIGJyYW5kOiAke2JyYW5kfWAgKSApO1xyXG5cclxuICByZXR1cm4gYnJhbmRzO1xyXG59OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxNQUFNQSxNQUFNLEdBQUdDLE9BQU8sQ0FBRSxRQUFTLENBQUM7QUFDbENBLE9BQU8sQ0FBRSxvQkFBcUIsQ0FBQztBQUMvQjs7QUFFQTtBQUNBLElBQUssQ0FBQ0MsTUFBTSxDQUFDQyxrQkFBa0IsRUFBRztFQUVsQztFQUNBO0VBQ0E7RUFDRUMsT0FBTyxDQUFDQyxFQUFFLENBQUUsb0JBQW9CLEVBQUVDLEVBQUUsSUFBSTtJQUFFLE1BQU1BLEVBQUU7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