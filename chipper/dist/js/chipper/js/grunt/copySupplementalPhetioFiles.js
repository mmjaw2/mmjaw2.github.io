// Copyright 2016-2024, University of Colorado Boulder

/**
 * Copies all supporting PhET-iO files, including wrappers, indices, lib files, etc.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Matt Pennington (PhET Interactive Simulations)
 */

// modules
const _ = require('lodash');
const assert = require('assert');
const archiver = require('archiver');
const ChipperStringUtils = require('../common/ChipperStringUtils');
const copyDirectory = require('../grunt/copyDirectory');
const execute = require('../../../perennial-alias/js/common/execute');
const fs = require('fs');
const grunt = require('grunt');
const generatePhetioMacroAPI = require('../phet-io/generatePhetioMacroAPI');
const formatPhetioAPI = require('../phet-io/formatPhetioAPI');
const buildStandalone = require('../grunt/buildStandalone');
const minify = require('../grunt/minify');
const marked = require('marked');
const tsc = require('./tsc');
const reportTscResults = require('./reportTscResults');
const getPhetLibs = require('./getPhetLibs');
const path = require('path');
const webpack = require('webpack');
const webpackBuild = require('../grunt/webpackBuild');

// constants
const DEDICATED_REPO_WRAPPER_PREFIX = 'phet-io-wrapper-';
const WRAPPER_COMMON_FOLDER = 'phet-io-wrappers/common';
const WRAPPERS_FOLDER = 'wrappers/'; // The wrapper index assumes this constant, please see phet-io-wrappers/index/index.js before changing

// For PhET-iO Client Guides
const PHET_IO_SIM_SPECIFIC = '../phet-io-sim-specific';
const GUIDES_COMMON_DIR = 'client-guide-common/client-guide';
const EXAMPLES_FILENAME = 'examples';
const PHET_IO_GUIDE_FILENAME = 'phet-io-guide';
const LIB_OUTPUT_FILE = 'phet-io.js';

// These files are bundled into the lib/phet-io.js file before PhET's phet-io code, and can be used by any wrapper
const THIRD_PARTY_LIB_PRELOADS = ['../sherpa/lib/react-18.1.0.production.min.js', '../sherpa/lib/react-dom-18.1.0.production.min.js', '../sherpa/lib/pako-2.0.3.min.js', '../sherpa/lib/lodash-4.17.4.min.js'];

// phet-io internal files to be consolidated into 1 file and publicly served as a minified phet-io library.
// Make sure to add new files to the jsdoc generation list below also
const PHET_IO_LIB_PRELOADS = ['../query-string-machine/js/QueryStringMachine.js',
// must be first, other types use this
'../assert/js/assert.js', '../chipper/js/phet-io/phetioCompareAPIs.js', '../tandem/js/PhetioIDUtils.js', '../perennial-alias/js/common/SimVersion.js'];
const LIB_PRELOADS = THIRD_PARTY_LIB_PRELOADS.concat(PHET_IO_LIB_PRELOADS);

// Additional libraries and third party files that are used by some phet-io wrappers, copied to a contrib/ directory.
// These are not bundled with the lib file to reduce the size of the central dependency of PhET-iO wrappers.
const CONTRIB_FILES = ['../sherpa/lib/ua-parser-0.7.21.min.js', '../sherpa/lib/bootstrap-2.2.2.js', '../sherpa/lib/font-awesome-4.5.0', '../sherpa/lib/jquery-2.1.0.min.js', '../sherpa/lib/jquery-ui-1.8.24.min.js', '../sherpa/lib/d3-4.2.2.js', '../sherpa/lib/jsondiffpatch-v0.3.11.umd.js', '../sherpa/lib/jsondiffpatch-v0.3.11-annotated.css', '../sherpa/lib/jsondiffpatch-v0.3.11-html.css', '../sherpa/lib/prism-1.23.0.js', '../sherpa/lib/prism-okaidia-1.23.0.css', '../sherpa/lib/clarinet-0.12.4.js'];

// This path is used for jsdoc. Transpilation happens before we get to this point. SR and MK recognize that this feels
// a bit risky, even though comments are currently preserved in the babel transpile step. See https://stackoverflow.com/questions/51720894/is-there-any-way-to-use-jsdoc-with-ts-files-maybe-transpile-with-babel-the
const transpiledClientPath = `../chipper/dist/js/${WRAPPER_COMMON_FOLDER}/js/Client.js`;

// List of files to run jsdoc generation with. This list is manual to keep files from sneaking into the public documentation.
const JSDOC_FILES = [`../chipper/dist/js/${WRAPPER_COMMON_FOLDER}/js/PhetioClient.js`, transpiledClientPath, '../tandem/js/PhetioIDUtils.js', '../phet-io/js/phet-io-initialize-globals.js', '../chipper/js/initialize-globals.js', '../perennial-alias/js/common/SimVersion.js'];
const JSDOC_README_FILE = '../phet-io/doc/wrapper/phet-io-documentation_README.md';
const STUDIO_BUILT_FILENAME = 'studio.min.js';

/**
 * @param {string} repo
 * @param {string} version
 * @param {string} simulationDisplayName
 * @param {Object} packageObject
 * @param {Object} buildLocal
 * @param {boolean} [generateMacroAPIFile]
 */
module.exports = async (repo, version, simulationDisplayName, packageObject, buildLocal, generateMacroAPIFile = false) => {
  const repoPhetLibs = getPhetLibs(repo, 'phet-io');
  assert(_.every(getPhetLibs('phet-io-wrappers'), repo => repoPhetLibs.includes(repo)), 'every dependency of phet-io-wrappers is not included in phetLibs of ' + repo + ' ' + repoPhetLibs + ' ' + getPhetLibs('phet-io-wrappers'));
  assert(_.every(getPhetLibs('studio'), repo => repoPhetLibs.includes(repo)), 'every dependency of studio is not included in phetLibs of ' + repo + ' ' + repoPhetLibs + ' ' + getPhetLibs('studio'));

  // This must be checked after copySupplementalPhetioFiles is called, since all the imports and outer code is run in
  // every brand. Developers without phet-io checked out still need to be able to build.
  assert(fs.readFileSync(transpiledClientPath).toString().indexOf('/**') >= 0, 'babel should not strip comments from transpiling');
  const simRepoSHA = (await execute('git', ['rev-parse', 'HEAD'], `../${repo}`)).trim();
  const buildDir = `../${repo}/build/phet-io/`;
  const wrappersLocation = `${buildDir}${WRAPPERS_FOLDER}`;

  // This regex was copied from perennial's `SimVersion.parse()` consult that code before changing things here.
  const matches = version.match(/^(\d+)\.(\d+)\.(\d+)(-(([^.-]+)\.(\d+)))?(-([^.-]+))?$/);
  if (!matches) {
    throw new Error(`could not parse version: ${version}`);
  }
  const major = Number(matches[1]);
  const minor = Number(matches[2]);
  const latestVersion = `${major}.${minor}`;
  const standardPhetioWrapperTemplateSkeleton = fs.readFileSync('../phet-io-wrappers/common/html/standardPhetioWrapperTemplateSkeleton.html', 'utf8');
  const customPhetioWrapperTemplateSkeleton = fs.readFileSync('../phet-io-wrappers/common/html/customPhetioWrapperTemplateSkeleton.html', 'utf8');
  assert(!standardPhetioWrapperTemplateSkeleton.includes('`'), 'The templates cannot contain backticks due to how the templates are passed through below');
  assert(!customPhetioWrapperTemplateSkeleton.includes('`'), 'The templates cannot contain backticks due to how the templates are passed through below');

  // The filter that we run every phet-io wrapper file through to transform dev content into built content. This mainly
  // involves lots of hard coded copy replace of template strings and marker values.
  const filterWrapper = (absPath, contents) => {
    const originalContents = `${contents}`;
    const isWrapperIndex = absPath.indexOf('index/index.html') >= 0;

    // For info about LIB_OUTPUT_FILE, see handleLib()
    const pathToLib = `lib/${LIB_OUTPUT_FILE}`;
    if (absPath.indexOf('.html') >= 0) {
      // change the paths of sherpa files to point to the contrib/ folder
      CONTRIB_FILES.forEach(filePath => {
        // No need to do this is this file doesn't have this contrib import in it.
        if (contents.indexOf(filePath) >= 0) {
          const filePathParts = filePath.split('/');

          // If the file is in a dedicated wrapper repo, then it is one level higher in the dir tree, and needs 1 less set of dots.
          // see https://github.com/phetsims/phet-io-wrappers/issues/17 for more info. This is hopefully a temporary workaround
          const needsExtraDots = absPath.indexOf(DEDICATED_REPO_WRAPPER_PREFIX) >= 0;
          const fileName = filePathParts[filePathParts.length - 1];
          const contribFileName = `contrib/${fileName}`;
          let pathToContrib = needsExtraDots ? `../../${contribFileName}` : `../${contribFileName}`;

          // The wrapper index is a different case because it is placed at the top level of the build dir.
          if (isWrapperIndex) {
            pathToContrib = contribFileName;
            filePath = `../${filePath}`; // filePath has one less set of relative than are actually in the index.html file.
          }
          contents = ChipperStringUtils.replaceAll(contents, filePath, pathToContrib);
        }
      });
      const includesElement = (line, array) => !!array.find(element => line.includes(element));

      // Remove files listed as preloads to the phet-io lib file.
      contents = contents.split(/\r?\n/).filter(line => !includesElement(line, LIB_PRELOADS)).join('\n');

      // Delete the imports the phet-io-wrappers-main, as it will be bundled with the phet-io.js lib file.
      // MUST GO BEFORE BELOW REPLACE: 'phet-io-wrappers/' -> '/'
      contents = contents.replace(/<script type="module" src="(..\/)+chipper\/dist\/js\/phet-io-wrappers\/js\/phet-io-wrappers-main.js"><\/script>/g,
      // '.*' is to support `data-phet-io-client-name` in wrappers like "multi"
      '');

      // Support wrappers that use code from phet-io-wrappers
      contents = ChipperStringUtils.replaceAll(contents, '/phet-io-wrappers/', '/');

      // Don't use ChipperStringUtils because we want to capture the relative path and transfer it to the new script.
      // This is to support providing the relative path through the build instead of just hard coding it.
      contents = contents.replace(/<!--(<script src="[./]*\{\{PATH_TO_LIB_FILE}}".*><\/script>)-->/g,
      // '.*' is to support `data-phet-io-client-name` in wrappers like "multi"
      '$1' // just uncomment, don't fill it in yet
      );
      contents = ChipperStringUtils.replaceAll(contents, '<!--{{GOOGLE_ANALYTICS.js}}-->', '<script src="/assets/js/phet-io-ga.js"></script>');
      contents = ChipperStringUtils.replaceAll(contents, '<!--{{FAVICON.ico}}-->', '<link rel="shortcut icon" href="/assets/favicon.ico"/>');

      // There should not be any imports of PhetioClient directly except using the "multi-wrapper" functionality of
      // providing a ?clientName, for unbuilt only, so we remove it here.
      contents = contents.replace(/^.*\/common\/js\/PhetioClient.js.*$/mg, '');
    }
    if (absPath.indexOf('.js') >= 0 || absPath.indexOf('.html') >= 0) {
      // Fill these in first so the following lines will also hit the content in these template vars
      contents = ChipperStringUtils.replaceAll(contents, '{{CUSTOM_WRAPPER_SKELETON}}', customPhetioWrapperTemplateSkeleton);
      contents = ChipperStringUtils.replaceAll(contents, '{{STANDARD_WRAPPER_SKELETON}}', standardPhetioWrapperTemplateSkeleton);

      // The rest
      contents = ChipperStringUtils.replaceAll(contents, '{{PATH_TO_LIB_FILE}}', pathToLib); // This must be after the script replacement that uses this variable above.
      contents = ChipperStringUtils.replaceAll(contents, '{{SIMULATION_NAME}}', repo);
      contents = ChipperStringUtils.replaceAll(contents, '{{SIMULATION_DISPLAY_NAME}}', simulationDisplayName);
      contents = ChipperStringUtils.replaceAll(contents, '{{SIMULATION_DISPLAY_NAME_ESCAPED}}', simulationDisplayName.replace(/'/g, '\\\''));
      contents = ChipperStringUtils.replaceAll(contents, '{{SIMULATION_VERSION_STRING}}', version);
      contents = ChipperStringUtils.replaceAll(contents, '{{SIMULATION_LATEST_VERSION}}', latestVersion);
      contents = ChipperStringUtils.replaceAll(contents, '{{SIMULATION_IS_BUILT}}', 'true');
      contents = ChipperStringUtils.replaceAll(contents, '{{PHET_IO_LIB_RELATIVE_PATH}}', pathToLib);
      contents = ChipperStringUtils.replaceAll(contents, '{{Built API Docs not available in unbuilt mode}}', 'API Docs');

      // phet-io-wrappers/common will be in the top level of wrappers/ in the build directory
      contents = ChipperStringUtils.replaceAll(contents, `${WRAPPER_COMMON_FOLDER}/`, 'common/');
    }
    if (isWrapperIndex) {
      const getGuideRowText = (fileName, linkText, description) => {
        return `<tr>
        <td><a href="doc/guides/${fileName}.html">${linkText}</a>
        </td>
        <td>${description}</td>
      </tr>`;
      };

      // The phet-io-guide is not sim-specific, so always create it.
      contents = ChipperStringUtils.replaceAll(contents, '{{PHET_IO_GUIDE_ROW}}', getGuideRowText(PHET_IO_GUIDE_FILENAME, 'PhET-iO Guide', 'Documentation for instructional designers about best practices for simulation customization with PhET-iO Studio.'));
      const exampleRowContents = fs.existsSync(`${PHET_IO_SIM_SPECIFIC}/repos/${repo}/${EXAMPLES_FILENAME}.md`) ? getGuideRowText(EXAMPLES_FILENAME, 'Examples', 'Provides instructions and the specific phetioIDs for customizing the simulation.') : '';
      contents = ChipperStringUtils.replaceAll(contents, '{{EXAMPLES_ROW}}', exampleRowContents);
    }

    // Special handling for studio paths since it is not nested under phet-io-wrappers
    if (absPath.indexOf('studio/index.html') >= 0) {
      contents = ChipperStringUtils.replaceAll(contents, '<script src="../contrib/', '<script src="../../contrib/');
      contents = ChipperStringUtils.replaceAll(contents, '<script type="module" src="../chipper/dist/js/studio/js/studio-main.js"></script>', `<script src="./${STUDIO_BUILT_FILENAME}"></script>`);
      contents = ChipperStringUtils.replaceAll(contents, '{{PHET_IO_GUIDE_LINK}}', `../../doc/guides/${PHET_IO_GUIDE_FILENAME}.html`);
      contents = ChipperStringUtils.replaceAll(contents, '{{EXAMPLES_LINK}}', `../../doc/guides/${EXAMPLES_FILENAME}.html`);
    }

    // Collapse >1 blank lines in html files.  This helps as a postprocessing step after removing lines with <script> tags
    if (absPath.endsWith('.html')) {
      const lines = contents.split(/\r?\n/);
      const pruned = [];
      for (let i = 0; i < lines.length; i++) {
        if (i >= 1 && lines[i - 1].trim().length === 0 && lines[i].trim().length === 0) {

          // skip redundant blank line
        } else {
          pruned.push(lines[i]);
        }
      }
      contents = pruned.join('\n');
    }
    if (contents !== originalContents) {
      return contents;
    } else {
      return null; // signify no change (helps for images)
    }
  };

  // a list of the phet-io wrappers that are built with the phet-io sim
  const wrappers = fs.readFileSync('../perennial-alias/data/wrappers', 'utf-8').trim().split('\n').map(wrappers => wrappers.trim());

  // Files and directories from wrapper folders that we don't want to copy
  const wrappersUnallowed = ['.git', 'README.md', '.gitignore', 'node_modules', 'package.json', 'build'];
  const libFileNames = PHET_IO_LIB_PRELOADS.map(filePath => {
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  });

  // Don't copy over the files that are in the lib file, this way we can catch wrapper bugs that are not pointing to the lib.
  const fullUnallowedList = wrappersUnallowed.concat(libFileNames);

  // wrapping function for copying the wrappers to the build dir
  const copyWrapper = (src, dest, wrapper, wrapperName) => {
    const wrapperFilterWithNameFilter = (absPath, contents) => {
      const result = filterWrapper(absPath, contents);

      // Support loading relative-path resources, like
      //{ url: '../phet-io-wrapper-hookes-law-energy/sounds/precipitate-chimes-v1-shorter.mp3' }
      // -->
      //{ url: 'wrappers/hookes-law-energy/sounds/precipitate-chimes-v1-shorter.mp3' }
      if (wrapper && wrapperName && result) {
        return ChipperStringUtils.replaceAll(result, `../${wrapper}/`, `wrappers/${wrapperName}/`);
      }
      return result;
    };
    copyDirectory(src, dest, wrapperFilterWithNameFilter, {
      exclude: fullUnallowedList,
      minifyJS: true,
      minifyOptions: {
        stripAssertions: false
      }
    });
  };

  // Make sure to copy the phet-io-wrappers common wrapper code too.
  wrappers.push(WRAPPER_COMMON_FOLDER);

  // Add sim-specific wrappers
  let simSpecificWrappers;
  try {
    simSpecificWrappers = fs.readdirSync(`../phet-io-sim-specific/repos/${repo}/wrappers/`, {
      withFileTypes: true
    }).filter(dirent => dirent.isDirectory()).map(dirent => `phet-io-sim-specific/repos/${repo}/wrappers/${dirent.name}`);
  } catch (e) {
    simSpecificWrappers = [];
  }
  wrappers.push(...simSpecificWrappers);
  const additionalWrappers = packageObject.phet && packageObject.phet['phet-io'] && packageObject.phet['phet-io'].wrappers ? packageObject.phet['phet-io'].wrappers : [];

  // phet-io-sim-specific wrappers are automatically added above
  wrappers.push(...additionalWrappers.filter(x => !x.includes('phet-io-sim-specific')));
  wrappers.forEach(wrapper => {
    const wrapperParts = wrapper.split('/');

    // either take the last path part, or take the first (repo name) and remove the wrapper prefix
    const wrapperName = wrapperParts.length > 1 ? wrapperParts[wrapperParts.length - 1] : wrapperParts[0].replace(DEDICATED_REPO_WRAPPER_PREFIX, '');

    // Copy the wrapper into the build dir /wrappers/, exclude the excluded list
    copyWrapper(`../${wrapper}`, `${wrappersLocation}${wrapperName}`, wrapper, wrapperName);
  });

  // Copy the wrapper index into the top level of the build dir, exclude the excluded list
  copyWrapper('../phet-io-wrappers/index', `${buildDir}`, null, null);

  // Create the lib file that is minified and publicly available under the /lib folder of the build
  await handleLib(repo, buildDir, filterWrapper);

  // Create the zipped file that holds all needed items to run PhET-iO offline. NOTE: this must happen after copying wrapper
  await handleOfflineArtifact(buildDir, repo, version);

  // Create the contrib folder and add to it third party libraries used by wrappers.
  handleContrib(buildDir);

  // Create the rendered jsdoc in the `doc` folder
  await handleJSDOC(buildDir);

  // create the client guides
  handleClientGuides(repo, simulationDisplayName, buildDir, version, simRepoSHA);
  await handleStudio(repo, wrappersLocation);
  if (generateMacroAPIFile) {
    const fullAPI = (await generatePhetioMacroAPI([repo], {
      fromBuiltVersion: true
    }))[repo];
    assert(fullAPI, 'Full API expected but not created from puppeteer step, likely caused by https://github.com/phetsims/chipper/issues/1022.');
    grunt.file.write(`${buildDir}${repo}-phet-io-api.json`, formatPhetioAPI(fullAPI));
  }

  // The nested index wrapper will be broken on build, so get rid of it for clarity
  fs.rmSync(`${wrappersLocation}index/`, {
    recursive: true
  });
};

/**
 * Given the list of lib files, apply a filter function to them. Then minify them and consolidate into a single string.
 * Finally, write them to the build dir with a license prepended. See https://github.com/phetsims/phet-io/issues/353

 * @param {string} repo
 * @param {string} buildDir
 * @param {Function} filter - the filter function used when copying over wrapper files to fix relative paths and such.
 *                            Has arguments like "function(absPath, contents)"
 */
const handleLib = async (repo, buildDir, filter) => {
  grunt.log.debug('Creating phet-io lib file from: ', PHET_IO_LIB_PRELOADS);
  grunt.file.mkdir(`${buildDir}lib`);

  // phet-written preloads
  const phetioLibCode = PHET_IO_LIB_PRELOADS.map(libFile => {
    const contents = grunt.file.read(libFile);
    const filteredContents = filter(libFile, contents);

    // The filter returns null if nothing changes
    return filteredContents || contents;
  }).join('');
  const migrationProcessorsCode = await getCompiledMigrationProcessors(repo, buildDir);
  const minifiedPhetioCode = minify(`${phetioLibCode}\n${migrationProcessorsCode}`, {
    stripAssertions: false
  });
  const results = await tsc('../phet-io-wrappers');
  reportTscResults(results, grunt);
  let wrappersMain = await buildStandalone('phet-io-wrappers', {
    stripAssertions: false,
    stripLogging: false,
    tempOutputDir: repo,
    // Avoid getting a 2nd copy of the files that are already bundled into the lib file
    omitPreloads: THIRD_PARTY_LIB_PRELOADS
  });

  // In loadWrapperTemplate in unbuilt mode, it uses readFile to dynamically load the templates at runtime.
  // In built mode, we must inline the templates into the build artifact. See loadWrapperTemplate.js
  assert(wrappersMain.includes('"{{STANDARD_WRAPPER_SKELETON}}"') || wrappersMain.includes('\'{{STANDARD_WRAPPER_SKELETON}}\''), 'Template variable is missing: STANDARD_WRAPPER_SKELETON');
  assert(wrappersMain.includes('"{{CUSTOM_WRAPPER_SKELETON}}"') || wrappersMain.includes('\'{{CUSTOM_WRAPPER_SKELETON}}\''), 'Template variable is missing: CUSTOM_WRAPPER_SKELETON');

  // Robustly handle double or single quotes.  At the moment it is double quotes.
  // buildStandalone will mangle a template string into "" because it hasn't been filled in yet, bring it back here (with
  // support for it changing in the future from double to single quotes).
  wrappersMain = wrappersMain.replace('"{{STANDARD_WRAPPER_SKELETON}}"', '`{{STANDARD_WRAPPER_SKELETON}}`');
  wrappersMain = wrappersMain.replace('\'{{STANDARD_WRAPPER_SKELETON}}\'', '`{{STANDARD_WRAPPER_SKELETON}}`');
  wrappersMain = wrappersMain.replace('"{{CUSTOM_WRAPPER_SKELETON}}"', '`{{CUSTOM_WRAPPER_SKELETON}}`');
  wrappersMain = wrappersMain.replace('\'{{CUSTOM_WRAPPER_SKELETON}}\'', '`{{CUSTOM_WRAPPER_SKELETON}}`');
  const filteredMain = filter(LIB_OUTPUT_FILE, wrappersMain);
  const mainCopyright = `// Copyright 2002-${new Date().getFullYear()}, University of Colorado Boulder
// This PhET-iO file requires a license
// USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.
// For licensing, please contact phethelp@colorado.edu`;
  grunt.file.write(`${buildDir}lib/${LIB_OUTPUT_FILE}`, `${mainCopyright}
// 
// Contains additional code under the specified licenses:

${THIRD_PARTY_LIB_PRELOADS.map(contribFile => grunt.file.read(contribFile)).join('\n\n')}

${mainCopyright}

${minifiedPhetioCode}\n${filteredMain}`);
};

/**
 * Copy all the third party libraries from sherpa to the build directory under the 'contrib' folder.
 * @param {string} buildDir
 */
const handleContrib = buildDir => {
  grunt.log.debug('Creating phet-io contrib folder');
  CONTRIB_FILES.forEach(filePath => {
    const filePathParts = filePath.split('/');
    const filename = filePathParts[filePathParts.length - 1];
    grunt.file.copy(filePath, `${buildDir}contrib/${filename}`);
  });
};

/**
 * Combine the files necessary to run and host PhET-iO locally into a zip that can be easily downloaded by the client.
 * This does not include any documentation, or wrapper suite wrapper examples.
 * @param {string} buildDir
 * @param {string} repo
 * @param {string} version
 * @returns {Promise.<void>}
 */
const handleOfflineArtifact = async (buildDir, repo, version) => {
  const output = fs.createWriteStream(`${buildDir}${repo}-phet-io-${version}.zip`);
  const archive = archiver('zip');
  archive.on('error', err => grunt.fail.fatal(`error creating archive: ${err}`));
  archive.pipe(output);

  // copy over the lib directory and its contents, and an index to test. Note that these use the files from the buildDir
  // because they have been post-processed and contain filled in template vars.
  archive.directory(`${buildDir}lib`, 'lib');

  // Take from build directory so that it has been filtered/mapped to correct paths.
  archive.file(`${buildDir}${WRAPPERS_FOLDER}/common/html/offline-example.html`, {
    name: 'index.html'
  });

  // get the all html and the debug version too, use `cwd` so that they are at the top level of the zip.
  archive.glob(`${repo}*all*.html`, {
    cwd: `${buildDir}`
  });
  archive.finalize();
  return new Promise(resolve => output.on('close', resolve));
};

/**
 * Generate jsdoc and put it in "build/phet-io/doc"
 * @param {string} buildDir
 * @returns {Promise.<void>}
 */
const handleJSDOC = async buildDir => {
  // Make sure each file exists
  for (let i = 0; i < JSDOC_FILES.length; i++) {
    if (!fs.existsSync(JSDOC_FILES[i])) {
      throw new Error(`file doesnt exist: ${JSDOC_FILES[i]}`);
    }
  }
  const getArgs = explain => ['../chipper/node_modules/jsdoc/jsdoc.js', ...(explain ? ['-X'] : []), ...JSDOC_FILES, '-c', '../phet-io/doc/wrapper/jsdoc-config.json', '-d', `${buildDir}doc/api`, '-t', '../chipper/node_modules/docdash', '--readme', JSDOC_README_FILE];

  // FOR DEBUGGING JSDOC:
  // uncomment this line, and run it from the top level of a sim directory
  // console.log( 'node', getArgs( false ).join( ' ' ) );

  // First we tried to run the jsdoc binary as the cmd, but that wasn't working, and was quite finicky. Then @samreid
  // found https://stackoverflow.com/questions/33664843/how-to-use-jsdoc-with-gulp which recommends the following method
  // (node executable with jsdoc js file)
  await execute('node', getArgs(false), process.cwd(), {
    shell: true
  });

  // Running with explanation -X appears to not output the files, so we have to run it twice.
  const explanation = (await execute('node', getArgs(true), process.cwd(), {
    shell: true
  })).trim();

  // Copy the logo file
  const imageDir = `${buildDir}doc/images`;
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir);
  }
  fs.copyFileSync('../brand/phet-io/images/logoOnWhite.png', `${imageDir}/logo.png`);
  const json = explanation.substring(explanation.indexOf('['), explanation.lastIndexOf(']') + 1);

  // basic sanity checks
  assert(json.length > 5000, 'JSON seems odd');
  try {
    JSON.parse(json);
  } catch (e) {
    assert(false, 'JSON parsing failed');
  }
  fs.writeFileSync(`${buildDir}doc/jsdoc-explanation.json`, json);
};

/**
 * Generates the phet-io client guides and puts them in `build/phet-io/doc/guides/`
 * @param {string} repoName
 * @param {string} simulationDisplayName
 * @param {string} buildDir
 * @param {string} version
 * @param {string} simRepoSHA
 */
const handleClientGuides = (repoName, simulationDisplayName, buildDir, version, simRepoSHA) => {
  const builtClientGuidesOutputDir = `${buildDir}doc/guides/`;
  const clientGuidesSourceRoot = `${PHET_IO_SIM_SPECIFIC}/repos/${repoName}/`;
  const commonDir = `${PHET_IO_SIM_SPECIFIC}/${GUIDES_COMMON_DIR}`;

  // copy over common images and styles
  copyDirectory(commonDir, `${builtClientGuidesOutputDir}`);

  // handle generating and writing the html file for each client guide
  generateAndWriteClientGuide(repoName, `${simulationDisplayName} PhET-iO Guide`, simulationDisplayName, `${commonDir}/${PHET_IO_GUIDE_FILENAME}.md`, `${builtClientGuidesOutputDir}${PHET_IO_GUIDE_FILENAME}.html`, version, simRepoSHA, false);
  generateAndWriteClientGuide(repoName, `${simulationDisplayName} Examples`, simulationDisplayName, `${clientGuidesSourceRoot}${EXAMPLES_FILENAME}.md`, `${builtClientGuidesOutputDir}${EXAMPLES_FILENAME}.html`, version, simRepoSHA, true);
};

/**
 * Takes a markdown client guides, fills in the links, and then generates and writes it as html
 * @param {string} repoName
 * @param {string} title
 * @param {string} simulationDisplayName
 * @param {string} mdFilePath - to get the source md file
 * @param {string} destinationPath - to write to
 * @param {string} version
 * @param {string} simRepoSHA
 * @param {boolean} assertNoConstAwait - handle asserting for "const X = await ..." in examples, see https://github.com/phetsims/phet-io-sim-specific/issues/34
 */
const generateAndWriteClientGuide = (repoName, title, simulationDisplayName, mdFilePath, destinationPath, version, simRepoSHA, assertNoConstAwait) => {
  // make sure the source markdown file exists
  if (!fs.existsSync(mdFilePath)) {
    grunt.log.warn(`no client guide found at ${mdFilePath}, no guide being built.`);
    return;
  }
  const simCamelCaseName = _.camelCase(repoName);
  let modelDocumentationLine = '';
  if (fs.existsSync(`../${repoName}/doc/model.md`)) {
    modelDocumentationLine = `* [Model Documentation](https://github.com/phetsims/${repoName}/blob/${simRepoSHA}/doc/model.md)`;
  }

  // fill in links
  let clientGuideSource = grunt.file.read(mdFilePath);

  ///////////////////////////////////////////
  // DO NOT UPDATE OR ADD TO THESE WITHOUT ALSO UPDATING THE LIST IN phet-io-sim-specific/client-guide-common/README.md
  clientGuideSource = ChipperStringUtils.replaceAll(clientGuideSource, '{{WRAPPER_INDEX_PATH}}', '../../');
  clientGuideSource = ChipperStringUtils.replaceAll(clientGuideSource, '{{SIMULATION_DISPLAY_NAME}}', simulationDisplayName);
  clientGuideSource = ChipperStringUtils.replaceAll(clientGuideSource, '{{SIM_PATH}}', `../../${repoName}_all_phet-io.html?postMessageOnError&phetioStandalone`);
  clientGuideSource = ChipperStringUtils.replaceAll(clientGuideSource, '{{STUDIO_PATH}}', '../../wrappers/studio/');
  clientGuideSource = ChipperStringUtils.replaceAll(clientGuideSource, '{{PHET_IO_GUIDE_PATH}}', `./${PHET_IO_GUIDE_FILENAME}.html`);
  clientGuideSource = ChipperStringUtils.replaceAll(clientGuideSource, '{{DATE}}', new Date().toString());
  clientGuideSource = ChipperStringUtils.replaceAll(clientGuideSource, '{{simCamelCaseName}}', simCamelCaseName);
  clientGuideSource = ChipperStringUtils.replaceAll(clientGuideSource, '{{simKebabName}}', repoName);
  clientGuideSource = ChipperStringUtils.replaceAll(clientGuideSource, '{{SIMULATION_VERSION_STRING}}', version);
  clientGuideSource = ChipperStringUtils.replaceAll(clientGuideSource, '{{MODEL_DOCUMENTATION_LINE}}', modelDocumentationLine);
  ///////////////////////////////////////////

  // support relative and absolute paths for unbuilt common image previews by replacing them with the correct relative path. Order matters!
  clientGuideSource = ChipperStringUtils.replaceAll(clientGuideSource, `../../../${GUIDES_COMMON_DIR}`, '');
  clientGuideSource = ChipperStringUtils.replaceAll(clientGuideSource, `../../${GUIDES_COMMON_DIR}`, '');
  clientGuideSource = ChipperStringUtils.replaceAll(clientGuideSource, `../${GUIDES_COMMON_DIR}`, '');
  clientGuideSource = ChipperStringUtils.replaceAll(clientGuideSource, `/${GUIDES_COMMON_DIR}`, '');

  // Since we don't have a bad-text lint rule for md files, see https://github.com/phetsims/phet-io-sim-specific/issues/34
  assertNoConstAwait && assert(!/^.*const.*await.*$/gm.test(clientGuideSource), `use let instead of const when awaiting values in PhET-iO "${EXAMPLES_FILENAME}" files`);
  const renderedClientGuide = marked.parse(clientGuideSource);

  // link a stylesheet
  const clientGuideHTML = `<head>
                   <link rel='stylesheet' href='css/github-markdown.css' type='text/css'>
                   <title>${title}</title>
                 </head>
                 <body>
                 <div class="markdown-body">
                   ${renderedClientGuide}
                 </div>
                 </body>`;

  // write the output to the build directory
  grunt.file.write(destinationPath, clientGuideHTML);
};

/**
 * Support building studio. This compiles the studio modules into a runnable, and copies that over to the expected spot
 * on build.
 * @param {string} repo
 * @param {string} wrappersLocation
 * @returns {Promise.<void>}
 */
const handleStudio = async (repo, wrappersLocation) => {
  grunt.log.debug('building studio');
  const results = await tsc('../studio');
  reportTscResults(results, grunt);
  fs.writeFileSync(`${wrappersLocation}studio/${STUDIO_BUILT_FILENAME}`, await buildStandalone('studio', {
    stripAssertions: false,
    stripLogging: false,
    tempOutputDir: repo
  }));
};

/**
 * Use webpack to bundle the migration processors into a compiled code string, for use in phet-io lib file.
 * @param {string} repo
 * @param {string} buildDir
 * @returns {Promise.<string>}
 */
const getCompiledMigrationProcessors = async (repo, buildDir) => {
  return new Promise((resolve, reject) => {
    const migrationProcessorsFilename = `${repo}-migration-processors.js`;
    const entryPointFilename = `../chipper/dist/js/phet-io-sim-specific/repos/${repo}/js/${migrationProcessorsFilename}`;
    if (!fs.existsSync(entryPointFilename)) {
      grunt.log.debug(`No migration processors found at ${entryPointFilename}, no processors to be bundled with ${LIB_OUTPUT_FILE}.`);
      resolve(''); // blank string because there are no processors to add.
    } else {
      // output dir must be an absolute path
      const outputDir = path.resolve(__dirname, `../../${repo}/${buildDir}`);
      const compiler = webpack({
        module: {
          rules: webpackBuild.getModuleRules() // Support preload-like library globals used via `import`
        },
        // We uglify as a step after this, with many custom rules. So we do NOT optimize or uglify in this step.
        optimization: {
          minimize: false
        },
        // Simulations or runnables will have a single entry point
        entry: {
          repo: entryPointFilename
        },
        // We output our builds to the following dir
        output: {
          path: outputDir,
          filename: migrationProcessorsFilename
        }
      });
      compiler.run((err, stats) => {
        if (err || stats.hasErrors()) {
          console.error('Migration processors webpack build errors:', stats.compilation.errors);
          reject(err || stats.compilation.errors[0]);
        } else {
          const jsFile = `${outputDir}/${migrationProcessorsFilename}`;
          const js = fs.readFileSync(jsFile, 'utf-8');
          fs.unlinkSync(jsFile);
          resolve(js);
        }
      });
    }
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsImFzc2VydCIsImFyY2hpdmVyIiwiQ2hpcHBlclN0cmluZ1V0aWxzIiwiY29weURpcmVjdG9yeSIsImV4ZWN1dGUiLCJmcyIsImdydW50IiwiZ2VuZXJhdGVQaGV0aW9NYWNyb0FQSSIsImZvcm1hdFBoZXRpb0FQSSIsImJ1aWxkU3RhbmRhbG9uZSIsIm1pbmlmeSIsIm1hcmtlZCIsInRzYyIsInJlcG9ydFRzY1Jlc3VsdHMiLCJnZXRQaGV0TGlicyIsInBhdGgiLCJ3ZWJwYWNrIiwid2VicGFja0J1aWxkIiwiREVESUNBVEVEX1JFUE9fV1JBUFBFUl9QUkVGSVgiLCJXUkFQUEVSX0NPTU1PTl9GT0xERVIiLCJXUkFQUEVSU19GT0xERVIiLCJQSEVUX0lPX1NJTV9TUEVDSUZJQyIsIkdVSURFU19DT01NT05fRElSIiwiRVhBTVBMRVNfRklMRU5BTUUiLCJQSEVUX0lPX0dVSURFX0ZJTEVOQU1FIiwiTElCX09VVFBVVF9GSUxFIiwiVEhJUkRfUEFSVFlfTElCX1BSRUxPQURTIiwiUEhFVF9JT19MSUJfUFJFTE9BRFMiLCJMSUJfUFJFTE9BRFMiLCJjb25jYXQiLCJDT05UUklCX0ZJTEVTIiwidHJhbnNwaWxlZENsaWVudFBhdGgiLCJKU0RPQ19GSUxFUyIsIkpTRE9DX1JFQURNRV9GSUxFIiwiU1RVRElPX0JVSUxUX0ZJTEVOQU1FIiwibW9kdWxlIiwiZXhwb3J0cyIsInJlcG8iLCJ2ZXJzaW9uIiwic2ltdWxhdGlvbkRpc3BsYXlOYW1lIiwicGFja2FnZU9iamVjdCIsImJ1aWxkTG9jYWwiLCJnZW5lcmF0ZU1hY3JvQVBJRmlsZSIsInJlcG9QaGV0TGlicyIsImV2ZXJ5IiwiaW5jbHVkZXMiLCJyZWFkRmlsZVN5bmMiLCJ0b1N0cmluZyIsImluZGV4T2YiLCJzaW1SZXBvU0hBIiwidHJpbSIsImJ1aWxkRGlyIiwid3JhcHBlcnNMb2NhdGlvbiIsIm1hdGNoZXMiLCJtYXRjaCIsIkVycm9yIiwibWFqb3IiLCJOdW1iZXIiLCJtaW5vciIsImxhdGVzdFZlcnNpb24iLCJzdGFuZGFyZFBoZXRpb1dyYXBwZXJUZW1wbGF0ZVNrZWxldG9uIiwiY3VzdG9tUGhldGlvV3JhcHBlclRlbXBsYXRlU2tlbGV0b24iLCJmaWx0ZXJXcmFwcGVyIiwiYWJzUGF0aCIsImNvbnRlbnRzIiwib3JpZ2luYWxDb250ZW50cyIsImlzV3JhcHBlckluZGV4IiwicGF0aFRvTGliIiwiZm9yRWFjaCIsImZpbGVQYXRoIiwiZmlsZVBhdGhQYXJ0cyIsInNwbGl0IiwibmVlZHNFeHRyYURvdHMiLCJmaWxlTmFtZSIsImxlbmd0aCIsImNvbnRyaWJGaWxlTmFtZSIsInBhdGhUb0NvbnRyaWIiLCJyZXBsYWNlQWxsIiwiaW5jbHVkZXNFbGVtZW50IiwibGluZSIsImFycmF5IiwiZmluZCIsImVsZW1lbnQiLCJmaWx0ZXIiLCJqb2luIiwicmVwbGFjZSIsImdldEd1aWRlUm93VGV4dCIsImxpbmtUZXh0IiwiZGVzY3JpcHRpb24iLCJleGFtcGxlUm93Q29udGVudHMiLCJleGlzdHNTeW5jIiwiZW5kc1dpdGgiLCJsaW5lcyIsInBydW5lZCIsImkiLCJwdXNoIiwid3JhcHBlcnMiLCJtYXAiLCJ3cmFwcGVyc1VuYWxsb3dlZCIsImxpYkZpbGVOYW1lcyIsInBhcnRzIiwiZnVsbFVuYWxsb3dlZExpc3QiLCJjb3B5V3JhcHBlciIsInNyYyIsImRlc3QiLCJ3cmFwcGVyIiwid3JhcHBlck5hbWUiLCJ3cmFwcGVyRmlsdGVyV2l0aE5hbWVGaWx0ZXIiLCJyZXN1bHQiLCJleGNsdWRlIiwibWluaWZ5SlMiLCJtaW5pZnlPcHRpb25zIiwic3RyaXBBc3NlcnRpb25zIiwic2ltU3BlY2lmaWNXcmFwcGVycyIsInJlYWRkaXJTeW5jIiwid2l0aEZpbGVUeXBlcyIsImRpcmVudCIsImlzRGlyZWN0b3J5IiwibmFtZSIsImUiLCJhZGRpdGlvbmFsV3JhcHBlcnMiLCJwaGV0IiwieCIsIndyYXBwZXJQYXJ0cyIsImhhbmRsZUxpYiIsImhhbmRsZU9mZmxpbmVBcnRpZmFjdCIsImhhbmRsZUNvbnRyaWIiLCJoYW5kbGVKU0RPQyIsImhhbmRsZUNsaWVudEd1aWRlcyIsImhhbmRsZVN0dWRpbyIsImZ1bGxBUEkiLCJmcm9tQnVpbHRWZXJzaW9uIiwiZmlsZSIsIndyaXRlIiwicm1TeW5jIiwicmVjdXJzaXZlIiwibG9nIiwiZGVidWciLCJta2RpciIsInBoZXRpb0xpYkNvZGUiLCJsaWJGaWxlIiwicmVhZCIsImZpbHRlcmVkQ29udGVudHMiLCJtaWdyYXRpb25Qcm9jZXNzb3JzQ29kZSIsImdldENvbXBpbGVkTWlncmF0aW9uUHJvY2Vzc29ycyIsIm1pbmlmaWVkUGhldGlvQ29kZSIsInJlc3VsdHMiLCJ3cmFwcGVyc01haW4iLCJzdHJpcExvZ2dpbmciLCJ0ZW1wT3V0cHV0RGlyIiwib21pdFByZWxvYWRzIiwiZmlsdGVyZWRNYWluIiwibWFpbkNvcHlyaWdodCIsIkRhdGUiLCJnZXRGdWxsWWVhciIsImNvbnRyaWJGaWxlIiwiZmlsZW5hbWUiLCJjb3B5Iiwib3V0cHV0IiwiY3JlYXRlV3JpdGVTdHJlYW0iLCJhcmNoaXZlIiwib24iLCJlcnIiLCJmYWlsIiwiZmF0YWwiLCJwaXBlIiwiZGlyZWN0b3J5IiwiZ2xvYiIsImN3ZCIsImZpbmFsaXplIiwiUHJvbWlzZSIsInJlc29sdmUiLCJnZXRBcmdzIiwiZXhwbGFpbiIsInByb2Nlc3MiLCJzaGVsbCIsImV4cGxhbmF0aW9uIiwiaW1hZ2VEaXIiLCJta2RpclN5bmMiLCJjb3B5RmlsZVN5bmMiLCJqc29uIiwic3Vic3RyaW5nIiwibGFzdEluZGV4T2YiLCJKU09OIiwicGFyc2UiLCJ3cml0ZUZpbGVTeW5jIiwicmVwb05hbWUiLCJidWlsdENsaWVudEd1aWRlc091dHB1dERpciIsImNsaWVudEd1aWRlc1NvdXJjZVJvb3QiLCJjb21tb25EaXIiLCJnZW5lcmF0ZUFuZFdyaXRlQ2xpZW50R3VpZGUiLCJ0aXRsZSIsIm1kRmlsZVBhdGgiLCJkZXN0aW5hdGlvblBhdGgiLCJhc3NlcnROb0NvbnN0QXdhaXQiLCJ3YXJuIiwic2ltQ2FtZWxDYXNlTmFtZSIsImNhbWVsQ2FzZSIsIm1vZGVsRG9jdW1lbnRhdGlvbkxpbmUiLCJjbGllbnRHdWlkZVNvdXJjZSIsInRlc3QiLCJyZW5kZXJlZENsaWVudEd1aWRlIiwiY2xpZW50R3VpZGVIVE1MIiwicmVqZWN0IiwibWlncmF0aW9uUHJvY2Vzc29yc0ZpbGVuYW1lIiwiZW50cnlQb2ludEZpbGVuYW1lIiwib3V0cHV0RGlyIiwiX19kaXJuYW1lIiwiY29tcGlsZXIiLCJydWxlcyIsImdldE1vZHVsZVJ1bGVzIiwib3B0aW1pemF0aW9uIiwibWluaW1pemUiLCJlbnRyeSIsInJ1biIsInN0YXRzIiwiaGFzRXJyb3JzIiwiY29uc29sZSIsImVycm9yIiwiY29tcGlsYXRpb24iLCJlcnJvcnMiLCJqc0ZpbGUiLCJqcyIsInVubGlua1N5bmMiXSwic291cmNlcyI6WyJjb3B5U3VwcGxlbWVudGFsUGhldGlvRmlsZXMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTYtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQ29waWVzIGFsbCBzdXBwb3J0aW5nIFBoRVQtaU8gZmlsZXMsIGluY2x1ZGluZyB3cmFwcGVycywgaW5kaWNlcywgbGliIGZpbGVzLCBldGMuXHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBNYXR0IFBlbm5pbmd0b24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuXHJcbi8vIG1vZHVsZXNcclxuY29uc3QgXyA9IHJlcXVpcmUoICdsb2Rhc2gnICk7XHJcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoICdhc3NlcnQnICk7XHJcbmNvbnN0IGFyY2hpdmVyID0gcmVxdWlyZSggJ2FyY2hpdmVyJyApO1xyXG5jb25zdCBDaGlwcGVyU3RyaW5nVXRpbHMgPSByZXF1aXJlKCAnLi4vY29tbW9uL0NoaXBwZXJTdHJpbmdVdGlscycgKTtcclxuY29uc3QgY29weURpcmVjdG9yeSA9IHJlcXVpcmUoICcuLi9ncnVudC9jb3B5RGlyZWN0b3J5JyApO1xyXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4uLy4uLy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vZXhlY3V0ZScgKTtcclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbmNvbnN0IGdydW50ID0gcmVxdWlyZSggJ2dydW50JyApO1xyXG5jb25zdCBnZW5lcmF0ZVBoZXRpb01hY3JvQVBJID0gcmVxdWlyZSggJy4uL3BoZXQtaW8vZ2VuZXJhdGVQaGV0aW9NYWNyb0FQSScgKTtcclxuY29uc3QgZm9ybWF0UGhldGlvQVBJID0gcmVxdWlyZSggJy4uL3BoZXQtaW8vZm9ybWF0UGhldGlvQVBJJyApO1xyXG5jb25zdCBidWlsZFN0YW5kYWxvbmUgPSByZXF1aXJlKCAnLi4vZ3J1bnQvYnVpbGRTdGFuZGFsb25lJyApO1xyXG5jb25zdCBtaW5pZnkgPSByZXF1aXJlKCAnLi4vZ3J1bnQvbWluaWZ5JyApO1xyXG5jb25zdCBtYXJrZWQgPSByZXF1aXJlKCAnbWFya2VkJyApO1xyXG5jb25zdCB0c2MgPSByZXF1aXJlKCAnLi90c2MnICk7XHJcbmNvbnN0IHJlcG9ydFRzY1Jlc3VsdHMgPSByZXF1aXJlKCAnLi9yZXBvcnRUc2NSZXN1bHRzJyApO1xyXG5jb25zdCBnZXRQaGV0TGlicyA9IHJlcXVpcmUoICcuL2dldFBoZXRMaWJzJyApO1xyXG5jb25zdCBwYXRoID0gcmVxdWlyZSggJ3BhdGgnICk7XHJcbmNvbnN0IHdlYnBhY2sgPSByZXF1aXJlKCAnd2VicGFjaycgKTtcclxuY29uc3Qgd2VicGFja0J1aWxkID0gcmVxdWlyZSggJy4uL2dydW50L3dlYnBhY2tCdWlsZCcgKTtcclxuXHJcbi8vIGNvbnN0YW50c1xyXG5jb25zdCBERURJQ0FURURfUkVQT19XUkFQUEVSX1BSRUZJWCA9ICdwaGV0LWlvLXdyYXBwZXItJztcclxuY29uc3QgV1JBUFBFUl9DT01NT05fRk9MREVSID0gJ3BoZXQtaW8td3JhcHBlcnMvY29tbW9uJztcclxuY29uc3QgV1JBUFBFUlNfRk9MREVSID0gJ3dyYXBwZXJzLyc7IC8vIFRoZSB3cmFwcGVyIGluZGV4IGFzc3VtZXMgdGhpcyBjb25zdGFudCwgcGxlYXNlIHNlZSBwaGV0LWlvLXdyYXBwZXJzL2luZGV4L2luZGV4LmpzIGJlZm9yZSBjaGFuZ2luZ1xyXG5cclxuLy8gRm9yIFBoRVQtaU8gQ2xpZW50IEd1aWRlc1xyXG5jb25zdCBQSEVUX0lPX1NJTV9TUEVDSUZJQyA9ICcuLi9waGV0LWlvLXNpbS1zcGVjaWZpYyc7XHJcbmNvbnN0IEdVSURFU19DT01NT05fRElSID0gJ2NsaWVudC1ndWlkZS1jb21tb24vY2xpZW50LWd1aWRlJztcclxuXHJcbmNvbnN0IEVYQU1QTEVTX0ZJTEVOQU1FID0gJ2V4YW1wbGVzJztcclxuY29uc3QgUEhFVF9JT19HVUlERV9GSUxFTkFNRSA9ICdwaGV0LWlvLWd1aWRlJztcclxuXHJcbmNvbnN0IExJQl9PVVRQVVRfRklMRSA9ICdwaGV0LWlvLmpzJztcclxuXHJcbi8vIFRoZXNlIGZpbGVzIGFyZSBidW5kbGVkIGludG8gdGhlIGxpYi9waGV0LWlvLmpzIGZpbGUgYmVmb3JlIFBoRVQncyBwaGV0LWlvIGNvZGUsIGFuZCBjYW4gYmUgdXNlZCBieSBhbnkgd3JhcHBlclxyXG5jb25zdCBUSElSRF9QQVJUWV9MSUJfUFJFTE9BRFMgPSBbXHJcbiAgJy4uL3NoZXJwYS9saWIvcmVhY3QtMTguMS4wLnByb2R1Y3Rpb24ubWluLmpzJyxcclxuICAnLi4vc2hlcnBhL2xpYi9yZWFjdC1kb20tMTguMS4wLnByb2R1Y3Rpb24ubWluLmpzJyxcclxuICAnLi4vc2hlcnBhL2xpYi9wYWtvLTIuMC4zLm1pbi5qcycsXHJcbiAgJy4uL3NoZXJwYS9saWIvbG9kYXNoLTQuMTcuNC5taW4uanMnXHJcbl07XHJcblxyXG4vLyBwaGV0LWlvIGludGVybmFsIGZpbGVzIHRvIGJlIGNvbnNvbGlkYXRlZCBpbnRvIDEgZmlsZSBhbmQgcHVibGljbHkgc2VydmVkIGFzIGEgbWluaWZpZWQgcGhldC1pbyBsaWJyYXJ5LlxyXG4vLyBNYWtlIHN1cmUgdG8gYWRkIG5ldyBmaWxlcyB0byB0aGUganNkb2MgZ2VuZXJhdGlvbiBsaXN0IGJlbG93IGFsc29cclxuY29uc3QgUEhFVF9JT19MSUJfUFJFTE9BRFMgPSBbXHJcbiAgJy4uL3F1ZXJ5LXN0cmluZy1tYWNoaW5lL2pzL1F1ZXJ5U3RyaW5nTWFjaGluZS5qcycsIC8vIG11c3QgYmUgZmlyc3QsIG90aGVyIHR5cGVzIHVzZSB0aGlzXHJcbiAgJy4uL2Fzc2VydC9qcy9hc3NlcnQuanMnLFxyXG4gICcuLi9jaGlwcGVyL2pzL3BoZXQtaW8vcGhldGlvQ29tcGFyZUFQSXMuanMnLFxyXG4gICcuLi90YW5kZW0vanMvUGhldGlvSURVdGlscy5qcycsXHJcbiAgJy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vU2ltVmVyc2lvbi5qcydcclxuXTtcclxuXHJcbmNvbnN0IExJQl9QUkVMT0FEUyA9IFRISVJEX1BBUlRZX0xJQl9QUkVMT0FEUy5jb25jYXQoIFBIRVRfSU9fTElCX1BSRUxPQURTICk7XHJcblxyXG4vLyBBZGRpdGlvbmFsIGxpYnJhcmllcyBhbmQgdGhpcmQgcGFydHkgZmlsZXMgdGhhdCBhcmUgdXNlZCBieSBzb21lIHBoZXQtaW8gd3JhcHBlcnMsIGNvcGllZCB0byBhIGNvbnRyaWIvIGRpcmVjdG9yeS5cclxuLy8gVGhlc2UgYXJlIG5vdCBidW5kbGVkIHdpdGggdGhlIGxpYiBmaWxlIHRvIHJlZHVjZSB0aGUgc2l6ZSBvZiB0aGUgY2VudHJhbCBkZXBlbmRlbmN5IG9mIFBoRVQtaU8gd3JhcHBlcnMuXHJcbmNvbnN0IENPTlRSSUJfRklMRVMgPSBbXHJcbiAgJy4uL3NoZXJwYS9saWIvdWEtcGFyc2VyLTAuNy4yMS5taW4uanMnLFxyXG4gICcuLi9zaGVycGEvbGliL2Jvb3RzdHJhcC0yLjIuMi5qcycsXHJcbiAgJy4uL3NoZXJwYS9saWIvZm9udC1hd2Vzb21lLTQuNS4wJyxcclxuICAnLi4vc2hlcnBhL2xpYi9qcXVlcnktMi4xLjAubWluLmpzJyxcclxuICAnLi4vc2hlcnBhL2xpYi9qcXVlcnktdWktMS44LjI0Lm1pbi5qcycsXHJcbiAgJy4uL3NoZXJwYS9saWIvZDMtNC4yLjIuanMnLFxyXG4gICcuLi9zaGVycGEvbGliL2pzb25kaWZmcGF0Y2gtdjAuMy4xMS51bWQuanMnLFxyXG4gICcuLi9zaGVycGEvbGliL2pzb25kaWZmcGF0Y2gtdjAuMy4xMS1hbm5vdGF0ZWQuY3NzJyxcclxuICAnLi4vc2hlcnBhL2xpYi9qc29uZGlmZnBhdGNoLXYwLjMuMTEtaHRtbC5jc3MnLFxyXG4gICcuLi9zaGVycGEvbGliL3ByaXNtLTEuMjMuMC5qcycsXHJcbiAgJy4uL3NoZXJwYS9saWIvcHJpc20tb2thaWRpYS0xLjIzLjAuY3NzJyxcclxuICAnLi4vc2hlcnBhL2xpYi9jbGFyaW5ldC0wLjEyLjQuanMnXHJcbl07XHJcblxyXG4vLyBUaGlzIHBhdGggaXMgdXNlZCBmb3IganNkb2MuIFRyYW5zcGlsYXRpb24gaGFwcGVucyBiZWZvcmUgd2UgZ2V0IHRvIHRoaXMgcG9pbnQuIFNSIGFuZCBNSyByZWNvZ25pemUgdGhhdCB0aGlzIGZlZWxzXHJcbi8vIGEgYml0IHJpc2t5LCBldmVuIHRob3VnaCBjb21tZW50cyBhcmUgY3VycmVudGx5IHByZXNlcnZlZCBpbiB0aGUgYmFiZWwgdHJhbnNwaWxlIHN0ZXAuIFNlZSBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy81MTcyMDg5NC9pcy10aGVyZS1hbnktd2F5LXRvLXVzZS1qc2RvYy13aXRoLXRzLWZpbGVzLW1heWJlLXRyYW5zcGlsZS13aXRoLWJhYmVsLXRoZVxyXG5jb25zdCB0cmFuc3BpbGVkQ2xpZW50UGF0aCA9IGAuLi9jaGlwcGVyL2Rpc3QvanMvJHtXUkFQUEVSX0NPTU1PTl9GT0xERVJ9L2pzL0NsaWVudC5qc2A7XHJcblxyXG4vLyBMaXN0IG9mIGZpbGVzIHRvIHJ1biBqc2RvYyBnZW5lcmF0aW9uIHdpdGguIFRoaXMgbGlzdCBpcyBtYW51YWwgdG8ga2VlcCBmaWxlcyBmcm9tIHNuZWFraW5nIGludG8gdGhlIHB1YmxpYyBkb2N1bWVudGF0aW9uLlxyXG5jb25zdCBKU0RPQ19GSUxFUyA9IFtcclxuICBgLi4vY2hpcHBlci9kaXN0L2pzLyR7V1JBUFBFUl9DT01NT05fRk9MREVSfS9qcy9QaGV0aW9DbGllbnQuanNgLFxyXG4gIHRyYW5zcGlsZWRDbGllbnRQYXRoLFxyXG4gICcuLi90YW5kZW0vanMvUGhldGlvSURVdGlscy5qcycsXHJcbiAgJy4uL3BoZXQtaW8vanMvcGhldC1pby1pbml0aWFsaXplLWdsb2JhbHMuanMnLFxyXG4gICcuLi9jaGlwcGVyL2pzL2luaXRpYWxpemUtZ2xvYmFscy5qcycsXHJcbiAgJy4uL3BlcmVubmlhbC1hbGlhcy9qcy9jb21tb24vU2ltVmVyc2lvbi5qcydcclxuXTtcclxuY29uc3QgSlNET0NfUkVBRE1FX0ZJTEUgPSAnLi4vcGhldC1pby9kb2Mvd3JhcHBlci9waGV0LWlvLWRvY3VtZW50YXRpb25fUkVBRE1FLm1kJztcclxuXHJcbmNvbnN0IFNUVURJT19CVUlMVF9GSUxFTkFNRSA9ICdzdHVkaW8ubWluLmpzJztcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gdmVyc2lvblxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc2ltdWxhdGlvbkRpc3BsYXlOYW1lXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYWNrYWdlT2JqZWN0XHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBidWlsZExvY2FsXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2dlbmVyYXRlTWFjcm9BUElGaWxlXVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyAoIHJlcG8sIHZlcnNpb24sIHNpbXVsYXRpb25EaXNwbGF5TmFtZSwgcGFja2FnZU9iamVjdCwgYnVpbGRMb2NhbCwgZ2VuZXJhdGVNYWNyb0FQSUZpbGUgPSBmYWxzZSApID0+IHtcclxuXHJcbiAgY29uc3QgcmVwb1BoZXRMaWJzID0gZ2V0UGhldExpYnMoIHJlcG8sICdwaGV0LWlvJyApO1xyXG4gIGFzc2VydCggXy5ldmVyeSggZ2V0UGhldExpYnMoICdwaGV0LWlvLXdyYXBwZXJzJyApLCByZXBvID0+IHJlcG9QaGV0TGlicy5pbmNsdWRlcyggcmVwbyApICksXHJcbiAgICAnZXZlcnkgZGVwZW5kZW5jeSBvZiBwaGV0LWlvLXdyYXBwZXJzIGlzIG5vdCBpbmNsdWRlZCBpbiBwaGV0TGlicyBvZiAnICsgcmVwbyArICcgJyArIHJlcG9QaGV0TGlicyArICcgJyArIGdldFBoZXRMaWJzKCAncGhldC1pby13cmFwcGVycycgKSApO1xyXG4gIGFzc2VydCggXy5ldmVyeSggZ2V0UGhldExpYnMoICdzdHVkaW8nICksIHJlcG8gPT4gcmVwb1BoZXRMaWJzLmluY2x1ZGVzKCByZXBvICkgKSxcclxuICAgICdldmVyeSBkZXBlbmRlbmN5IG9mIHN0dWRpbyBpcyBub3QgaW5jbHVkZWQgaW4gcGhldExpYnMgb2YgJyArIHJlcG8gKyAnICcgKyByZXBvUGhldExpYnMgKyAnICcgKyBnZXRQaGV0TGlicyggJ3N0dWRpbycgKSApO1xyXG5cclxuICAvLyBUaGlzIG11c3QgYmUgY2hlY2tlZCBhZnRlciBjb3B5U3VwcGxlbWVudGFsUGhldGlvRmlsZXMgaXMgY2FsbGVkLCBzaW5jZSBhbGwgdGhlIGltcG9ydHMgYW5kIG91dGVyIGNvZGUgaXMgcnVuIGluXHJcbiAgLy8gZXZlcnkgYnJhbmQuIERldmVsb3BlcnMgd2l0aG91dCBwaGV0LWlvIGNoZWNrZWQgb3V0IHN0aWxsIG5lZWQgdG8gYmUgYWJsZSB0byBidWlsZC5cclxuICBhc3NlcnQoIGZzLnJlYWRGaWxlU3luYyggdHJhbnNwaWxlZENsaWVudFBhdGggKS50b1N0cmluZygpLmluZGV4T2YoICcvKionICkgPj0gMCwgJ2JhYmVsIHNob3VsZCBub3Qgc3RyaXAgY29tbWVudHMgZnJvbSB0cmFuc3BpbGluZycgKTtcclxuXHJcbiAgY29uc3Qgc2ltUmVwb1NIQSA9ICggYXdhaXQgZXhlY3V0ZSggJ2dpdCcsIFsgJ3Jldi1wYXJzZScsICdIRUFEJyBdLCBgLi4vJHtyZXBvfWAgKSApLnRyaW0oKTtcclxuXHJcbiAgY29uc3QgYnVpbGREaXIgPSBgLi4vJHtyZXBvfS9idWlsZC9waGV0LWlvL2A7XHJcbiAgY29uc3Qgd3JhcHBlcnNMb2NhdGlvbiA9IGAke2J1aWxkRGlyfSR7V1JBUFBFUlNfRk9MREVSfWA7XHJcblxyXG4gIC8vIFRoaXMgcmVnZXggd2FzIGNvcGllZCBmcm9tIHBlcmVubmlhbCdzIGBTaW1WZXJzaW9uLnBhcnNlKClgIGNvbnN1bHQgdGhhdCBjb2RlIGJlZm9yZSBjaGFuZ2luZyB0aGluZ3MgaGVyZS5cclxuICBjb25zdCBtYXRjaGVzID0gdmVyc2lvbi5tYXRjaCggL14oXFxkKylcXC4oXFxkKylcXC4oXFxkKykoLSgoW14uLV0rKVxcLihcXGQrKSkpPygtKFteLi1dKykpPyQvICk7XHJcbiAgaWYgKCAhbWF0Y2hlcyApIHtcclxuICAgIHRocm93IG5ldyBFcnJvciggYGNvdWxkIG5vdCBwYXJzZSB2ZXJzaW9uOiAke3ZlcnNpb259YCApO1xyXG4gIH1cclxuICBjb25zdCBtYWpvciA9IE51bWJlciggbWF0Y2hlc1sgMSBdICk7XHJcbiAgY29uc3QgbWlub3IgPSBOdW1iZXIoIG1hdGNoZXNbIDIgXSApO1xyXG4gIGNvbnN0IGxhdGVzdFZlcnNpb24gPSBgJHttYWpvcn0uJHttaW5vcn1gO1xyXG5cclxuICBjb25zdCBzdGFuZGFyZFBoZXRpb1dyYXBwZXJUZW1wbGF0ZVNrZWxldG9uID0gZnMucmVhZEZpbGVTeW5jKCAnLi4vcGhldC1pby13cmFwcGVycy9jb21tb24vaHRtbC9zdGFuZGFyZFBoZXRpb1dyYXBwZXJUZW1wbGF0ZVNrZWxldG9uLmh0bWwnLCAndXRmOCcgKTtcclxuICBjb25zdCBjdXN0b21QaGV0aW9XcmFwcGVyVGVtcGxhdGVTa2VsZXRvbiA9IGZzLnJlYWRGaWxlU3luYyggJy4uL3BoZXQtaW8td3JhcHBlcnMvY29tbW9uL2h0bWwvY3VzdG9tUGhldGlvV3JhcHBlclRlbXBsYXRlU2tlbGV0b24uaHRtbCcsICd1dGY4JyApO1xyXG5cclxuICBhc3NlcnQoICFzdGFuZGFyZFBoZXRpb1dyYXBwZXJUZW1wbGF0ZVNrZWxldG9uLmluY2x1ZGVzKCAnYCcgKSwgJ1RoZSB0ZW1wbGF0ZXMgY2Fubm90IGNvbnRhaW4gYmFja3RpY2tzIGR1ZSB0byBob3cgdGhlIHRlbXBsYXRlcyBhcmUgcGFzc2VkIHRocm91Z2ggYmVsb3cnICk7XHJcbiAgYXNzZXJ0KCAhY3VzdG9tUGhldGlvV3JhcHBlclRlbXBsYXRlU2tlbGV0b24uaW5jbHVkZXMoICdgJyApLCAnVGhlIHRlbXBsYXRlcyBjYW5ub3QgY29udGFpbiBiYWNrdGlja3MgZHVlIHRvIGhvdyB0aGUgdGVtcGxhdGVzIGFyZSBwYXNzZWQgdGhyb3VnaCBiZWxvdycgKTtcclxuXHJcbiAgLy8gVGhlIGZpbHRlciB0aGF0IHdlIHJ1biBldmVyeSBwaGV0LWlvIHdyYXBwZXIgZmlsZSB0aHJvdWdoIHRvIHRyYW5zZm9ybSBkZXYgY29udGVudCBpbnRvIGJ1aWx0IGNvbnRlbnQuIFRoaXMgbWFpbmx5XHJcbiAgLy8gaW52b2x2ZXMgbG90cyBvZiBoYXJkIGNvZGVkIGNvcHkgcmVwbGFjZSBvZiB0ZW1wbGF0ZSBzdHJpbmdzIGFuZCBtYXJrZXIgdmFsdWVzLlxyXG4gIGNvbnN0IGZpbHRlcldyYXBwZXIgPSAoIGFic1BhdGgsIGNvbnRlbnRzICkgPT4ge1xyXG4gICAgY29uc3Qgb3JpZ2luYWxDb250ZW50cyA9IGAke2NvbnRlbnRzfWA7XHJcblxyXG4gICAgY29uc3QgaXNXcmFwcGVySW5kZXggPSBhYnNQYXRoLmluZGV4T2YoICdpbmRleC9pbmRleC5odG1sJyApID49IDA7XHJcblxyXG4gICAgLy8gRm9yIGluZm8gYWJvdXQgTElCX09VVFBVVF9GSUxFLCBzZWUgaGFuZGxlTGliKClcclxuICAgIGNvbnN0IHBhdGhUb0xpYiA9IGBsaWIvJHtMSUJfT1VUUFVUX0ZJTEV9YDtcclxuXHJcbiAgICBpZiAoIGFic1BhdGguaW5kZXhPZiggJy5odG1sJyApID49IDAgKSB7XHJcblxyXG4gICAgICAvLyBjaGFuZ2UgdGhlIHBhdGhzIG9mIHNoZXJwYSBmaWxlcyB0byBwb2ludCB0byB0aGUgY29udHJpYi8gZm9sZGVyXHJcbiAgICAgIENPTlRSSUJfRklMRVMuZm9yRWFjaCggZmlsZVBhdGggPT4ge1xyXG5cclxuICAgICAgICAvLyBObyBuZWVkIHRvIGRvIHRoaXMgaXMgdGhpcyBmaWxlIGRvZXNuJ3QgaGF2ZSB0aGlzIGNvbnRyaWIgaW1wb3J0IGluIGl0LlxyXG4gICAgICAgIGlmICggY29udGVudHMuaW5kZXhPZiggZmlsZVBhdGggKSA+PSAwICkge1xyXG5cclxuICAgICAgICAgIGNvbnN0IGZpbGVQYXRoUGFydHMgPSBmaWxlUGF0aC5zcGxpdCggJy8nICk7XHJcblxyXG4gICAgICAgICAgLy8gSWYgdGhlIGZpbGUgaXMgaW4gYSBkZWRpY2F0ZWQgd3JhcHBlciByZXBvLCB0aGVuIGl0IGlzIG9uZSBsZXZlbCBoaWdoZXIgaW4gdGhlIGRpciB0cmVlLCBhbmQgbmVlZHMgMSBsZXNzIHNldCBvZiBkb3RzLlxyXG4gICAgICAgICAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvLXdyYXBwZXJzL2lzc3Vlcy8xNyBmb3IgbW9yZSBpbmZvLiBUaGlzIGlzIGhvcGVmdWxseSBhIHRlbXBvcmFyeSB3b3JrYXJvdW5kXHJcbiAgICAgICAgICBjb25zdCBuZWVkc0V4dHJhRG90cyA9IGFic1BhdGguaW5kZXhPZiggREVESUNBVEVEX1JFUE9fV1JBUFBFUl9QUkVGSVggKSA+PSAwO1xyXG4gICAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBmaWxlUGF0aFBhcnRzWyBmaWxlUGF0aFBhcnRzLmxlbmd0aCAtIDEgXTtcclxuICAgICAgICAgIGNvbnN0IGNvbnRyaWJGaWxlTmFtZSA9IGBjb250cmliLyR7ZmlsZU5hbWV9YDtcclxuICAgICAgICAgIGxldCBwYXRoVG9Db250cmliID0gbmVlZHNFeHRyYURvdHMgPyBgLi4vLi4vJHtjb250cmliRmlsZU5hbWV9YCA6IGAuLi8ke2NvbnRyaWJGaWxlTmFtZX1gO1xyXG5cclxuICAgICAgICAgIC8vIFRoZSB3cmFwcGVyIGluZGV4IGlzIGEgZGlmZmVyZW50IGNhc2UgYmVjYXVzZSBpdCBpcyBwbGFjZWQgYXQgdGhlIHRvcCBsZXZlbCBvZiB0aGUgYnVpbGQgZGlyLlxyXG4gICAgICAgICAgaWYgKCBpc1dyYXBwZXJJbmRleCApIHtcclxuXHJcbiAgICAgICAgICAgIHBhdGhUb0NvbnRyaWIgPSBjb250cmliRmlsZU5hbWU7XHJcbiAgICAgICAgICAgIGZpbGVQYXRoID0gYC4uLyR7ZmlsZVBhdGh9YDsgLy8gZmlsZVBhdGggaGFzIG9uZSBsZXNzIHNldCBvZiByZWxhdGl2ZSB0aGFuIGFyZSBhY3R1YWxseSBpbiB0aGUgaW5kZXguaHRtbCBmaWxlLlxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY29udGVudHMgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUFsbCggY29udGVudHMsIGZpbGVQYXRoLCBwYXRoVG9Db250cmliICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICBjb25zdCBpbmNsdWRlc0VsZW1lbnQgPSAoIGxpbmUsIGFycmF5ICkgPT4gISFhcnJheS5maW5kKCBlbGVtZW50ID0+IGxpbmUuaW5jbHVkZXMoIGVsZW1lbnQgKSApO1xyXG5cclxuICAgICAgLy8gUmVtb3ZlIGZpbGVzIGxpc3RlZCBhcyBwcmVsb2FkcyB0byB0aGUgcGhldC1pbyBsaWIgZmlsZS5cclxuICAgICAgY29udGVudHMgPSBjb250ZW50cy5zcGxpdCggL1xccj9cXG4vICkuZmlsdGVyKCBsaW5lID0+ICFpbmNsdWRlc0VsZW1lbnQoIGxpbmUsIExJQl9QUkVMT0FEUyApICkuam9pbiggJ1xcbicgKTtcclxuXHJcbiAgICAgIC8vIERlbGV0ZSB0aGUgaW1wb3J0cyB0aGUgcGhldC1pby13cmFwcGVycy1tYWluLCBhcyBpdCB3aWxsIGJlIGJ1bmRsZWQgd2l0aCB0aGUgcGhldC1pby5qcyBsaWIgZmlsZS5cclxuICAgICAgLy8gTVVTVCBHTyBCRUZPUkUgQkVMT1cgUkVQTEFDRTogJ3BoZXQtaW8td3JhcHBlcnMvJyAtPiAnLydcclxuICAgICAgY29udGVudHMgPSBjb250ZW50cy5yZXBsYWNlKFxyXG4gICAgICAgIC88c2NyaXB0IHR5cGU9XCJtb2R1bGVcIiBzcmM9XCIoLi5cXC8pK2NoaXBwZXJcXC9kaXN0XFwvanNcXC9waGV0LWlvLXdyYXBwZXJzXFwvanNcXC9waGV0LWlvLXdyYXBwZXJzLW1haW4uanNcIj48XFwvc2NyaXB0Pi9nLCAvLyAnLionIGlzIHRvIHN1cHBvcnQgYGRhdGEtcGhldC1pby1jbGllbnQtbmFtZWAgaW4gd3JhcHBlcnMgbGlrZSBcIm11bHRpXCJcclxuICAgICAgICAnJyApO1xyXG5cclxuICAgICAgLy8gU3VwcG9ydCB3cmFwcGVycyB0aGF0IHVzZSBjb2RlIGZyb20gcGhldC1pby13cmFwcGVyc1xyXG4gICAgICBjb250ZW50cyA9IENoaXBwZXJTdHJpbmdVdGlscy5yZXBsYWNlQWxsKCBjb250ZW50cywgJy9waGV0LWlvLXdyYXBwZXJzLycsICcvJyApO1xyXG5cclxuICAgICAgLy8gRG9uJ3QgdXNlIENoaXBwZXJTdHJpbmdVdGlscyBiZWNhdXNlIHdlIHdhbnQgdG8gY2FwdHVyZSB0aGUgcmVsYXRpdmUgcGF0aCBhbmQgdHJhbnNmZXIgaXQgdG8gdGhlIG5ldyBzY3JpcHQuXHJcbiAgICAgIC8vIFRoaXMgaXMgdG8gc3VwcG9ydCBwcm92aWRpbmcgdGhlIHJlbGF0aXZlIHBhdGggdGhyb3VnaCB0aGUgYnVpbGQgaW5zdGVhZCBvZiBqdXN0IGhhcmQgY29kaW5nIGl0LlxyXG4gICAgICBjb250ZW50cyA9IGNvbnRlbnRzLnJlcGxhY2UoXHJcbiAgICAgICAgLzwhLS0oPHNjcmlwdCBzcmM9XCJbLi9dKlxce1xce1BBVEhfVE9fTElCX0ZJTEV9fVwiLio+PFxcL3NjcmlwdD4pLS0+L2csIC8vICcuKicgaXMgdG8gc3VwcG9ydCBgZGF0YS1waGV0LWlvLWNsaWVudC1uYW1lYCBpbiB3cmFwcGVycyBsaWtlIFwibXVsdGlcIlxyXG4gICAgICAgICckMScgLy8ganVzdCB1bmNvbW1lbnQsIGRvbid0IGZpbGwgaXQgaW4geWV0XHJcbiAgICAgICk7XHJcblxyXG4gICAgICBjb250ZW50cyA9IENoaXBwZXJTdHJpbmdVdGlscy5yZXBsYWNlQWxsKCBjb250ZW50cyxcclxuICAgICAgICAnPCEtLXt7R09PR0xFX0FOQUxZVElDUy5qc319LS0+JyxcclxuICAgICAgICAnPHNjcmlwdCBzcmM9XCIvYXNzZXRzL2pzL3BoZXQtaW8tZ2EuanNcIj48L3NjcmlwdD4nXHJcbiAgICAgICk7XHJcbiAgICAgIGNvbnRlbnRzID0gQ2hpcHBlclN0cmluZ1V0aWxzLnJlcGxhY2VBbGwoIGNvbnRlbnRzLFxyXG4gICAgICAgICc8IS0te3tGQVZJQ09OLmljb319LS0+JyxcclxuICAgICAgICAnPGxpbmsgcmVsPVwic2hvcnRjdXQgaWNvblwiIGhyZWY9XCIvYXNzZXRzL2Zhdmljb24uaWNvXCIvPidcclxuICAgICAgKTtcclxuXHJcbiAgICAgIC8vIFRoZXJlIHNob3VsZCBub3QgYmUgYW55IGltcG9ydHMgb2YgUGhldGlvQ2xpZW50IGRpcmVjdGx5IGV4Y2VwdCB1c2luZyB0aGUgXCJtdWx0aS13cmFwcGVyXCIgZnVuY3Rpb25hbGl0eSBvZlxyXG4gICAgICAvLyBwcm92aWRpbmcgYSA/Y2xpZW50TmFtZSwgZm9yIHVuYnVpbHQgb25seSwgc28gd2UgcmVtb3ZlIGl0IGhlcmUuXHJcbiAgICAgIGNvbnRlbnRzID0gY29udGVudHMucmVwbGFjZShcclxuICAgICAgICAvXi4qXFwvY29tbW9uXFwvanNcXC9QaGV0aW9DbGllbnQuanMuKiQvbWcsXHJcbiAgICAgICAgJydcclxuICAgICAgKTtcclxuICAgIH1cclxuICAgIGlmICggYWJzUGF0aC5pbmRleE9mKCAnLmpzJyApID49IDAgfHwgYWJzUGF0aC5pbmRleE9mKCAnLmh0bWwnICkgPj0gMCApIHtcclxuXHJcbiAgICAgIC8vIEZpbGwgdGhlc2UgaW4gZmlyc3Qgc28gdGhlIGZvbGxvd2luZyBsaW5lcyB3aWxsIGFsc28gaGl0IHRoZSBjb250ZW50IGluIHRoZXNlIHRlbXBsYXRlIHZhcnNcclxuICAgICAgY29udGVudHMgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUFsbCggY29udGVudHMsICd7e0NVU1RPTV9XUkFQUEVSX1NLRUxFVE9OfX0nLCBjdXN0b21QaGV0aW9XcmFwcGVyVGVtcGxhdGVTa2VsZXRvbiApO1xyXG4gICAgICBjb250ZW50cyA9IENoaXBwZXJTdHJpbmdVdGlscy5yZXBsYWNlQWxsKCBjb250ZW50cywgJ3t7U1RBTkRBUkRfV1JBUFBFUl9TS0VMRVRPTn19Jywgc3RhbmRhcmRQaGV0aW9XcmFwcGVyVGVtcGxhdGVTa2VsZXRvbiApO1xyXG5cclxuICAgICAgLy8gVGhlIHJlc3RcclxuICAgICAgY29udGVudHMgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUFsbCggY29udGVudHMsICd7e1BBVEhfVE9fTElCX0ZJTEV9fScsIHBhdGhUb0xpYiApOyAvLyBUaGlzIG11c3QgYmUgYWZ0ZXIgdGhlIHNjcmlwdCByZXBsYWNlbWVudCB0aGF0IHVzZXMgdGhpcyB2YXJpYWJsZSBhYm92ZS5cclxuICAgICAgY29udGVudHMgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUFsbCggY29udGVudHMsICd7e1NJTVVMQVRJT05fTkFNRX19JywgcmVwbyApO1xyXG4gICAgICBjb250ZW50cyA9IENoaXBwZXJTdHJpbmdVdGlscy5yZXBsYWNlQWxsKCBjb250ZW50cywgJ3t7U0lNVUxBVElPTl9ESVNQTEFZX05BTUV9fScsIHNpbXVsYXRpb25EaXNwbGF5TmFtZSApO1xyXG4gICAgICBjb250ZW50cyA9IENoaXBwZXJTdHJpbmdVdGlscy5yZXBsYWNlQWxsKCBjb250ZW50cywgJ3t7U0lNVUxBVElPTl9ESVNQTEFZX05BTUVfRVNDQVBFRH19Jywgc2ltdWxhdGlvbkRpc3BsYXlOYW1lLnJlcGxhY2UoIC8nL2csICdcXFxcXFwnJyApICk7XHJcbiAgICAgIGNvbnRlbnRzID0gQ2hpcHBlclN0cmluZ1V0aWxzLnJlcGxhY2VBbGwoIGNvbnRlbnRzLCAne3tTSU1VTEFUSU9OX1ZFUlNJT05fU1RSSU5HfX0nLCB2ZXJzaW9uICk7XHJcbiAgICAgIGNvbnRlbnRzID0gQ2hpcHBlclN0cmluZ1V0aWxzLnJlcGxhY2VBbGwoIGNvbnRlbnRzLCAne3tTSU1VTEFUSU9OX0xBVEVTVF9WRVJTSU9OfX0nLCBsYXRlc3RWZXJzaW9uICk7XHJcbiAgICAgIGNvbnRlbnRzID0gQ2hpcHBlclN0cmluZ1V0aWxzLnJlcGxhY2VBbGwoIGNvbnRlbnRzLCAne3tTSU1VTEFUSU9OX0lTX0JVSUxUfX0nLCAndHJ1ZScgKTtcclxuICAgICAgY29udGVudHMgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUFsbCggY29udGVudHMsICd7e1BIRVRfSU9fTElCX1JFTEFUSVZFX1BBVEh9fScsIHBhdGhUb0xpYiApO1xyXG4gICAgICBjb250ZW50cyA9IENoaXBwZXJTdHJpbmdVdGlscy5yZXBsYWNlQWxsKCBjb250ZW50cywgJ3t7QnVpbHQgQVBJIERvY3Mgbm90IGF2YWlsYWJsZSBpbiB1bmJ1aWx0IG1vZGV9fScsICdBUEkgRG9jcycgKTtcclxuXHJcbiAgICAgIC8vIHBoZXQtaW8td3JhcHBlcnMvY29tbW9uIHdpbGwgYmUgaW4gdGhlIHRvcCBsZXZlbCBvZiB3cmFwcGVycy8gaW4gdGhlIGJ1aWxkIGRpcmVjdG9yeVxyXG4gICAgICBjb250ZW50cyA9IENoaXBwZXJTdHJpbmdVdGlscy5yZXBsYWNlQWxsKCBjb250ZW50cywgYCR7V1JBUFBFUl9DT01NT05fRk9MREVSfS9gLCAnY29tbW9uLycgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIGlzV3JhcHBlckluZGV4ICkge1xyXG4gICAgICBjb25zdCBnZXRHdWlkZVJvd1RleHQgPSAoIGZpbGVOYW1lLCBsaW5rVGV4dCwgZGVzY3JpcHRpb24gKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIGA8dHI+XHJcbiAgICAgICAgPHRkPjxhIGhyZWY9XCJkb2MvZ3VpZGVzLyR7ZmlsZU5hbWV9Lmh0bWxcIj4ke2xpbmtUZXh0fTwvYT5cclxuICAgICAgICA8L3RkPlxyXG4gICAgICAgIDx0ZD4ke2Rlc2NyaXB0aW9ufTwvdGQ+XHJcbiAgICAgIDwvdHI+YDtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIC8vIFRoZSBwaGV0LWlvLWd1aWRlIGlzIG5vdCBzaW0tc3BlY2lmaWMsIHNvIGFsd2F5cyBjcmVhdGUgaXQuXHJcbiAgICAgIGNvbnRlbnRzID0gQ2hpcHBlclN0cmluZ1V0aWxzLnJlcGxhY2VBbGwoIGNvbnRlbnRzLCAne3tQSEVUX0lPX0dVSURFX1JPV319JyxcclxuICAgICAgICBnZXRHdWlkZVJvd1RleHQoIFBIRVRfSU9fR1VJREVfRklMRU5BTUUsICdQaEVULWlPIEd1aWRlJyxcclxuICAgICAgICAgICdEb2N1bWVudGF0aW9uIGZvciBpbnN0cnVjdGlvbmFsIGRlc2lnbmVycyBhYm91dCBiZXN0IHByYWN0aWNlcyBmb3Igc2ltdWxhdGlvbiBjdXN0b21pemF0aW9uIHdpdGggUGhFVC1pTyBTdHVkaW8uJyApICk7XHJcblxyXG5cclxuICAgICAgY29uc3QgZXhhbXBsZVJvd0NvbnRlbnRzID0gZnMuZXhpc3RzU3luYyggYCR7UEhFVF9JT19TSU1fU1BFQ0lGSUN9L3JlcG9zLyR7cmVwb30vJHtFWEFNUExFU19GSUxFTkFNRX0ubWRgICkgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRHdWlkZVJvd1RleHQoIEVYQU1QTEVTX0ZJTEVOQU1FLCAnRXhhbXBsZXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdQcm92aWRlcyBpbnN0cnVjdGlvbnMgYW5kIHRoZSBzcGVjaWZpYyBwaGV0aW9JRHMgZm9yIGN1c3RvbWl6aW5nIHRoZSBzaW11bGF0aW9uLicgKSA6ICcnO1xyXG4gICAgICBjb250ZW50cyA9IENoaXBwZXJTdHJpbmdVdGlscy5yZXBsYWNlQWxsKCBjb250ZW50cywgJ3t7RVhBTVBMRVNfUk9XfX0nLCBleGFtcGxlUm93Q29udGVudHMgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTcGVjaWFsIGhhbmRsaW5nIGZvciBzdHVkaW8gcGF0aHMgc2luY2UgaXQgaXMgbm90IG5lc3RlZCB1bmRlciBwaGV0LWlvLXdyYXBwZXJzXHJcbiAgICBpZiAoIGFic1BhdGguaW5kZXhPZiggJ3N0dWRpby9pbmRleC5odG1sJyApID49IDAgKSB7XHJcbiAgICAgIGNvbnRlbnRzID0gQ2hpcHBlclN0cmluZ1V0aWxzLnJlcGxhY2VBbGwoIGNvbnRlbnRzLCAnPHNjcmlwdCBzcmM9XCIuLi9jb250cmliLycsICc8c2NyaXB0IHNyYz1cIi4uLy4uL2NvbnRyaWIvJyApO1xyXG4gICAgICBjb250ZW50cyA9IENoaXBwZXJTdHJpbmdVdGlscy5yZXBsYWNlQWxsKCBjb250ZW50cywgJzxzY3JpcHQgdHlwZT1cIm1vZHVsZVwiIHNyYz1cIi4uL2NoaXBwZXIvZGlzdC9qcy9zdHVkaW8vanMvc3R1ZGlvLW1haW4uanNcIj48L3NjcmlwdD4nLFxyXG4gICAgICAgIGA8c2NyaXB0IHNyYz1cIi4vJHtTVFVESU9fQlVJTFRfRklMRU5BTUV9XCI+PC9zY3JpcHQ+YCApO1xyXG5cclxuICAgICAgY29udGVudHMgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUFsbCggY29udGVudHMsICd7e1BIRVRfSU9fR1VJREVfTElOS319JywgYC4uLy4uL2RvYy9ndWlkZXMvJHtQSEVUX0lPX0dVSURFX0ZJTEVOQU1FfS5odG1sYCApO1xyXG4gICAgICBjb250ZW50cyA9IENoaXBwZXJTdHJpbmdVdGlscy5yZXBsYWNlQWxsKCBjb250ZW50cywgJ3t7RVhBTVBMRVNfTElOS319JywgYC4uLy4uL2RvYy9ndWlkZXMvJHtFWEFNUExFU19GSUxFTkFNRX0uaHRtbGAgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDb2xsYXBzZSA+MSBibGFuayBsaW5lcyBpbiBodG1sIGZpbGVzLiAgVGhpcyBoZWxwcyBhcyBhIHBvc3Rwcm9jZXNzaW5nIHN0ZXAgYWZ0ZXIgcmVtb3ZpbmcgbGluZXMgd2l0aCA8c2NyaXB0PiB0YWdzXHJcbiAgICBpZiAoIGFic1BhdGguZW5kc1dpdGgoICcuaHRtbCcgKSApIHtcclxuICAgICAgY29uc3QgbGluZXMgPSBjb250ZW50cy5zcGxpdCggL1xccj9cXG4vICk7XHJcbiAgICAgIGNvbnN0IHBydW5lZCA9IFtdO1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICBpZiAoIGkgPj0gMSAmJlxyXG4gICAgICAgICAgICAgbGluZXNbIGkgLSAxIF0udHJpbSgpLmxlbmd0aCA9PT0gMCAmJlxyXG4gICAgICAgICAgICAgbGluZXNbIGkgXS50cmltKCkubGVuZ3RoID09PSAwICkge1xyXG5cclxuICAgICAgICAgIC8vIHNraXAgcmVkdW5kYW50IGJsYW5rIGxpbmVcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBwcnVuZWQucHVzaCggbGluZXNbIGkgXSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBjb250ZW50cyA9IHBydW5lZC5qb2luKCAnXFxuJyApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggY29udGVudHMgIT09IG9yaWdpbmFsQ29udGVudHMgKSB7XHJcbiAgICAgIHJldHVybiBjb250ZW50cztcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gbnVsbDsgLy8gc2lnbmlmeSBubyBjaGFuZ2UgKGhlbHBzIGZvciBpbWFnZXMpXHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLy8gYSBsaXN0IG9mIHRoZSBwaGV0LWlvIHdyYXBwZXJzIHRoYXQgYXJlIGJ1aWx0IHdpdGggdGhlIHBoZXQtaW8gc2ltXHJcbiAgY29uc3Qgd3JhcHBlcnMgPSBmcy5yZWFkRmlsZVN5bmMoICcuLi9wZXJlbm5pYWwtYWxpYXMvZGF0YS93cmFwcGVycycsICd1dGYtOCcgKS50cmltKCkuc3BsaXQoICdcXG4nICkubWFwKCB3cmFwcGVycyA9PiB3cmFwcGVycy50cmltKCkgKTtcclxuXHJcbiAgLy8gRmlsZXMgYW5kIGRpcmVjdG9yaWVzIGZyb20gd3JhcHBlciBmb2xkZXJzIHRoYXQgd2UgZG9uJ3Qgd2FudCB0byBjb3B5XHJcbiAgY29uc3Qgd3JhcHBlcnNVbmFsbG93ZWQgPSBbICcuZ2l0JywgJ1JFQURNRS5tZCcsICcuZ2l0aWdub3JlJywgJ25vZGVfbW9kdWxlcycsICdwYWNrYWdlLmpzb24nLCAnYnVpbGQnIF07XHJcblxyXG4gIGNvbnN0IGxpYkZpbGVOYW1lcyA9IFBIRVRfSU9fTElCX1BSRUxPQURTLm1hcCggZmlsZVBhdGggPT4ge1xyXG4gICAgY29uc3QgcGFydHMgPSBmaWxlUGF0aC5zcGxpdCggJy8nICk7XHJcbiAgICByZXR1cm4gcGFydHNbIHBhcnRzLmxlbmd0aCAtIDEgXTtcclxuICB9ICk7XHJcblxyXG4gIC8vIERvbid0IGNvcHkgb3ZlciB0aGUgZmlsZXMgdGhhdCBhcmUgaW4gdGhlIGxpYiBmaWxlLCB0aGlzIHdheSB3ZSBjYW4gY2F0Y2ggd3JhcHBlciBidWdzIHRoYXQgYXJlIG5vdCBwb2ludGluZyB0byB0aGUgbGliLlxyXG4gIGNvbnN0IGZ1bGxVbmFsbG93ZWRMaXN0ID0gd3JhcHBlcnNVbmFsbG93ZWQuY29uY2F0KCBsaWJGaWxlTmFtZXMgKTtcclxuXHJcbiAgLy8gd3JhcHBpbmcgZnVuY3Rpb24gZm9yIGNvcHlpbmcgdGhlIHdyYXBwZXJzIHRvIHRoZSBidWlsZCBkaXJcclxuICBjb25zdCBjb3B5V3JhcHBlciA9ICggc3JjLCBkZXN0LCB3cmFwcGVyLCB3cmFwcGVyTmFtZSApID0+IHtcclxuXHJcbiAgICBjb25zdCB3cmFwcGVyRmlsdGVyV2l0aE5hbWVGaWx0ZXIgPSAoIGFic1BhdGgsIGNvbnRlbnRzICkgPT4ge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBmaWx0ZXJXcmFwcGVyKCBhYnNQYXRoLCBjb250ZW50cyApO1xyXG5cclxuICAgICAgLy8gU3VwcG9ydCBsb2FkaW5nIHJlbGF0aXZlLXBhdGggcmVzb3VyY2VzLCBsaWtlXHJcbiAgICAgIC8veyB1cmw6ICcuLi9waGV0LWlvLXdyYXBwZXItaG9va2VzLWxhdy1lbmVyZ3kvc291bmRzL3ByZWNpcGl0YXRlLWNoaW1lcy12MS1zaG9ydGVyLm1wMycgfVxyXG4gICAgICAvLyAtLT5cclxuICAgICAgLy97IHVybDogJ3dyYXBwZXJzL2hvb2tlcy1sYXctZW5lcmd5L3NvdW5kcy9wcmVjaXBpdGF0ZS1jaGltZXMtdjEtc2hvcnRlci5tcDMnIH1cclxuICAgICAgaWYgKCB3cmFwcGVyICYmIHdyYXBwZXJOYW1lICYmIHJlc3VsdCApIHtcclxuICAgICAgICByZXR1cm4gQ2hpcHBlclN0cmluZ1V0aWxzLnJlcGxhY2VBbGwoIHJlc3VsdCwgYC4uLyR7d3JhcHBlcn0vYCwgYHdyYXBwZXJzLyR7d3JhcHBlck5hbWV9L2AgKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfTtcclxuICAgIGNvcHlEaXJlY3RvcnkoIHNyYywgZGVzdCwgd3JhcHBlckZpbHRlcldpdGhOYW1lRmlsdGVyLCB7XHJcbiAgICAgIGV4Y2x1ZGU6IGZ1bGxVbmFsbG93ZWRMaXN0LFxyXG4gICAgICBtaW5pZnlKUzogdHJ1ZSxcclxuICAgICAgbWluaWZ5T3B0aW9uczoge1xyXG4gICAgICAgIHN0cmlwQXNzZXJ0aW9uczogZmFsc2VcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gIH07XHJcblxyXG4gIC8vIE1ha2Ugc3VyZSB0byBjb3B5IHRoZSBwaGV0LWlvLXdyYXBwZXJzIGNvbW1vbiB3cmFwcGVyIGNvZGUgdG9vLlxyXG4gIHdyYXBwZXJzLnB1c2goIFdSQVBQRVJfQ09NTU9OX0ZPTERFUiApO1xyXG5cclxuICAvLyBBZGQgc2ltLXNwZWNpZmljIHdyYXBwZXJzXHJcbiAgbGV0IHNpbVNwZWNpZmljV3JhcHBlcnM7XHJcbiAgdHJ5IHtcclxuICAgIHNpbVNwZWNpZmljV3JhcHBlcnMgPSBmcy5yZWFkZGlyU3luYyggYC4uL3BoZXQtaW8tc2ltLXNwZWNpZmljL3JlcG9zLyR7cmVwb30vd3JhcHBlcnMvYCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0gKVxyXG4gICAgICAuZmlsdGVyKCBkaXJlbnQgPT4gZGlyZW50LmlzRGlyZWN0b3J5KCkgKVxyXG4gICAgICAubWFwKCBkaXJlbnQgPT4gYHBoZXQtaW8tc2ltLXNwZWNpZmljL3JlcG9zLyR7cmVwb30vd3JhcHBlcnMvJHtkaXJlbnQubmFtZX1gICk7XHJcbiAgfVxyXG4gIGNhdGNoKCBlICkge1xyXG4gICAgc2ltU3BlY2lmaWNXcmFwcGVycyA9IFtdO1xyXG4gIH1cclxuXHJcbiAgd3JhcHBlcnMucHVzaCggLi4uc2ltU3BlY2lmaWNXcmFwcGVycyApO1xyXG5cclxuXHJcbiAgY29uc3QgYWRkaXRpb25hbFdyYXBwZXJzID0gcGFja2FnZU9iamVjdC5waGV0ICYmIHBhY2thZ2VPYmplY3QucGhldFsgJ3BoZXQtaW8nIF0gJiYgcGFja2FnZU9iamVjdC5waGV0WyAncGhldC1pbycgXS53cmFwcGVycyA/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFja2FnZU9iamVjdC5waGV0WyAncGhldC1pbycgXS53cmFwcGVycyA6IFtdO1xyXG5cclxuICAvLyBwaGV0LWlvLXNpbS1zcGVjaWZpYyB3cmFwcGVycyBhcmUgYXV0b21hdGljYWxseSBhZGRlZCBhYm92ZVxyXG4gIHdyYXBwZXJzLnB1c2goIC4uLmFkZGl0aW9uYWxXcmFwcGVycy5maWx0ZXIoIHggPT4gIXguaW5jbHVkZXMoICdwaGV0LWlvLXNpbS1zcGVjaWZpYycgKSApICk7XHJcblxyXG4gIHdyYXBwZXJzLmZvckVhY2goIHdyYXBwZXIgPT4ge1xyXG5cclxuICAgIGNvbnN0IHdyYXBwZXJQYXJ0cyA9IHdyYXBwZXIuc3BsaXQoICcvJyApO1xyXG5cclxuICAgIC8vIGVpdGhlciB0YWtlIHRoZSBsYXN0IHBhdGggcGFydCwgb3IgdGFrZSB0aGUgZmlyc3QgKHJlcG8gbmFtZSkgYW5kIHJlbW92ZSB0aGUgd3JhcHBlciBwcmVmaXhcclxuICAgIGNvbnN0IHdyYXBwZXJOYW1lID0gd3JhcHBlclBhcnRzLmxlbmd0aCA+IDEgPyB3cmFwcGVyUGFydHNbIHdyYXBwZXJQYXJ0cy5sZW5ndGggLSAxIF0gOiB3cmFwcGVyUGFydHNbIDAgXS5yZXBsYWNlKCBERURJQ0FURURfUkVQT19XUkFQUEVSX1BSRUZJWCwgJycgKTtcclxuXHJcbiAgICAvLyBDb3B5IHRoZSB3cmFwcGVyIGludG8gdGhlIGJ1aWxkIGRpciAvd3JhcHBlcnMvLCBleGNsdWRlIHRoZSBleGNsdWRlZCBsaXN0XHJcbiAgICBjb3B5V3JhcHBlciggYC4uLyR7d3JhcHBlcn1gLCBgJHt3cmFwcGVyc0xvY2F0aW9ufSR7d3JhcHBlck5hbWV9YCwgd3JhcHBlciwgd3JhcHBlck5hbWUgKTtcclxuICB9ICk7XHJcblxyXG4gIC8vIENvcHkgdGhlIHdyYXBwZXIgaW5kZXggaW50byB0aGUgdG9wIGxldmVsIG9mIHRoZSBidWlsZCBkaXIsIGV4Y2x1ZGUgdGhlIGV4Y2x1ZGVkIGxpc3RcclxuICBjb3B5V3JhcHBlciggJy4uL3BoZXQtaW8td3JhcHBlcnMvaW5kZXgnLCBgJHtidWlsZERpcn1gLCBudWxsLCBudWxsICk7XHJcblxyXG4gIC8vIENyZWF0ZSB0aGUgbGliIGZpbGUgdGhhdCBpcyBtaW5pZmllZCBhbmQgcHVibGljbHkgYXZhaWxhYmxlIHVuZGVyIHRoZSAvbGliIGZvbGRlciBvZiB0aGUgYnVpbGRcclxuICBhd2FpdCBoYW5kbGVMaWIoIHJlcG8sIGJ1aWxkRGlyLCBmaWx0ZXJXcmFwcGVyICk7XHJcblxyXG4gIC8vIENyZWF0ZSB0aGUgemlwcGVkIGZpbGUgdGhhdCBob2xkcyBhbGwgbmVlZGVkIGl0ZW1zIHRvIHJ1biBQaEVULWlPIG9mZmxpbmUuIE5PVEU6IHRoaXMgbXVzdCBoYXBwZW4gYWZ0ZXIgY29weWluZyB3cmFwcGVyXHJcbiAgYXdhaXQgaGFuZGxlT2ZmbGluZUFydGlmYWN0KCBidWlsZERpciwgcmVwbywgdmVyc2lvbiApO1xyXG5cclxuICAvLyBDcmVhdGUgdGhlIGNvbnRyaWIgZm9sZGVyIGFuZCBhZGQgdG8gaXQgdGhpcmQgcGFydHkgbGlicmFyaWVzIHVzZWQgYnkgd3JhcHBlcnMuXHJcbiAgaGFuZGxlQ29udHJpYiggYnVpbGREaXIgKTtcclxuXHJcbiAgLy8gQ3JlYXRlIHRoZSByZW5kZXJlZCBqc2RvYyBpbiB0aGUgYGRvY2AgZm9sZGVyXHJcbiAgYXdhaXQgaGFuZGxlSlNET0MoIGJ1aWxkRGlyICk7XHJcblxyXG4gIC8vIGNyZWF0ZSB0aGUgY2xpZW50IGd1aWRlc1xyXG4gIGhhbmRsZUNsaWVudEd1aWRlcyggcmVwbywgc2ltdWxhdGlvbkRpc3BsYXlOYW1lLCBidWlsZERpciwgdmVyc2lvbiwgc2ltUmVwb1NIQSApO1xyXG5cclxuICBhd2FpdCBoYW5kbGVTdHVkaW8oIHJlcG8sIHdyYXBwZXJzTG9jYXRpb24gKTtcclxuXHJcbiAgaWYgKCBnZW5lcmF0ZU1hY3JvQVBJRmlsZSApIHtcclxuICAgIGNvbnN0IGZ1bGxBUEkgPSAoIGF3YWl0IGdlbmVyYXRlUGhldGlvTWFjcm9BUEkoIFsgcmVwbyBdLCB7XHJcbiAgICAgIGZyb21CdWlsdFZlcnNpb246IHRydWVcclxuICAgIH0gKSApWyByZXBvIF07XHJcbiAgICBhc3NlcnQoIGZ1bGxBUEksICdGdWxsIEFQSSBleHBlY3RlZCBidXQgbm90IGNyZWF0ZWQgZnJvbSBwdXBwZXRlZXIgc3RlcCwgbGlrZWx5IGNhdXNlZCBieSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvMTAyMi4nICk7XHJcbiAgICBncnVudC5maWxlLndyaXRlKCBgJHtidWlsZERpcn0ke3JlcG99LXBoZXQtaW8tYXBpLmpzb25gLCBmb3JtYXRQaGV0aW9BUEkoIGZ1bGxBUEkgKSApO1xyXG4gIH1cclxuXHJcbiAgLy8gVGhlIG5lc3RlZCBpbmRleCB3cmFwcGVyIHdpbGwgYmUgYnJva2VuIG9uIGJ1aWxkLCBzbyBnZXQgcmlkIG9mIGl0IGZvciBjbGFyaXR5XHJcbiAgZnMucm1TeW5jKCBgJHt3cmFwcGVyc0xvY2F0aW9ufWluZGV4L2AsIHsgcmVjdXJzaXZlOiB0cnVlIH0gKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHaXZlbiB0aGUgbGlzdCBvZiBsaWIgZmlsZXMsIGFwcGx5IGEgZmlsdGVyIGZ1bmN0aW9uIHRvIHRoZW0uIFRoZW4gbWluaWZ5IHRoZW0gYW5kIGNvbnNvbGlkYXRlIGludG8gYSBzaW5nbGUgc3RyaW5nLlxyXG4gKiBGaW5hbGx5LCB3cml0ZSB0aGVtIHRvIHRoZSBidWlsZCBkaXIgd2l0aCBhIGxpY2Vuc2UgcHJlcGVuZGVkLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXQtaW8vaXNzdWVzLzM1M1xyXG5cclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG9cclxuICogQHBhcmFtIHtzdHJpbmd9IGJ1aWxkRGlyXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZpbHRlciAtIHRoZSBmaWx0ZXIgZnVuY3Rpb24gdXNlZCB3aGVuIGNvcHlpbmcgb3ZlciB3cmFwcGVyIGZpbGVzIHRvIGZpeCByZWxhdGl2ZSBwYXRocyBhbmQgc3VjaC5cclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgSGFzIGFyZ3VtZW50cyBsaWtlIFwiZnVuY3Rpb24oYWJzUGF0aCwgY29udGVudHMpXCJcclxuICovXHJcbmNvbnN0IGhhbmRsZUxpYiA9IGFzeW5jICggcmVwbywgYnVpbGREaXIsIGZpbHRlciApID0+IHtcclxuICBncnVudC5sb2cuZGVidWcoICdDcmVhdGluZyBwaGV0LWlvIGxpYiBmaWxlIGZyb206ICcsIFBIRVRfSU9fTElCX1BSRUxPQURTICk7XHJcbiAgZ3J1bnQuZmlsZS5ta2RpciggYCR7YnVpbGREaXJ9bGliYCApO1xyXG5cclxuICAvLyBwaGV0LXdyaXR0ZW4gcHJlbG9hZHNcclxuICBjb25zdCBwaGV0aW9MaWJDb2RlID0gUEhFVF9JT19MSUJfUFJFTE9BRFMubWFwKCBsaWJGaWxlID0+IHtcclxuICAgIGNvbnN0IGNvbnRlbnRzID0gZ3J1bnQuZmlsZS5yZWFkKCBsaWJGaWxlICk7XHJcbiAgICBjb25zdCBmaWx0ZXJlZENvbnRlbnRzID0gZmlsdGVyKCBsaWJGaWxlLCBjb250ZW50cyApO1xyXG5cclxuICAgIC8vIFRoZSBmaWx0ZXIgcmV0dXJucyBudWxsIGlmIG5vdGhpbmcgY2hhbmdlc1xyXG4gICAgcmV0dXJuIGZpbHRlcmVkQ29udGVudHMgfHwgY29udGVudHM7XHJcbiAgfSApLmpvaW4oICcnICk7XHJcblxyXG4gIGNvbnN0IG1pZ3JhdGlvblByb2Nlc3NvcnNDb2RlID0gYXdhaXQgZ2V0Q29tcGlsZWRNaWdyYXRpb25Qcm9jZXNzb3JzKCByZXBvLCBidWlsZERpciApO1xyXG4gIGNvbnN0IG1pbmlmaWVkUGhldGlvQ29kZSA9IG1pbmlmeSggYCR7cGhldGlvTGliQ29kZX1cXG4ke21pZ3JhdGlvblByb2Nlc3NvcnNDb2RlfWAsIHsgc3RyaXBBc3NlcnRpb25zOiBmYWxzZSB9ICk7XHJcblxyXG4gIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB0c2MoICcuLi9waGV0LWlvLXdyYXBwZXJzJyApO1xyXG4gIHJlcG9ydFRzY1Jlc3VsdHMoIHJlc3VsdHMsIGdydW50ICk7XHJcblxyXG4gIGxldCB3cmFwcGVyc01haW4gPSBhd2FpdCBidWlsZFN0YW5kYWxvbmUoICdwaGV0LWlvLXdyYXBwZXJzJywge1xyXG4gICAgc3RyaXBBc3NlcnRpb25zOiBmYWxzZSxcclxuICAgIHN0cmlwTG9nZ2luZzogZmFsc2UsXHJcbiAgICB0ZW1wT3V0cHV0RGlyOiByZXBvLFxyXG5cclxuICAgIC8vIEF2b2lkIGdldHRpbmcgYSAybmQgY29weSBvZiB0aGUgZmlsZXMgdGhhdCBhcmUgYWxyZWFkeSBidW5kbGVkIGludG8gdGhlIGxpYiBmaWxlXHJcbiAgICBvbWl0UHJlbG9hZHM6IFRISVJEX1BBUlRZX0xJQl9QUkVMT0FEU1xyXG4gIH0gKTtcclxuXHJcbiAgLy8gSW4gbG9hZFdyYXBwZXJUZW1wbGF0ZSBpbiB1bmJ1aWx0IG1vZGUsIGl0IHVzZXMgcmVhZEZpbGUgdG8gZHluYW1pY2FsbHkgbG9hZCB0aGUgdGVtcGxhdGVzIGF0IHJ1bnRpbWUuXHJcbiAgLy8gSW4gYnVpbHQgbW9kZSwgd2UgbXVzdCBpbmxpbmUgdGhlIHRlbXBsYXRlcyBpbnRvIHRoZSBidWlsZCBhcnRpZmFjdC4gU2VlIGxvYWRXcmFwcGVyVGVtcGxhdGUuanNcclxuICBhc3NlcnQoIHdyYXBwZXJzTWFpbi5pbmNsdWRlcyggJ1wie3tTVEFOREFSRF9XUkFQUEVSX1NLRUxFVE9OfX1cIicgKSB8fCB3cmFwcGVyc01haW4uaW5jbHVkZXMoICdcXCd7e1NUQU5EQVJEX1dSQVBQRVJfU0tFTEVUT059fVxcJycgKSwgJ1RlbXBsYXRlIHZhcmlhYmxlIGlzIG1pc3Npbmc6IFNUQU5EQVJEX1dSQVBQRVJfU0tFTEVUT04nICk7XHJcbiAgYXNzZXJ0KCB3cmFwcGVyc01haW4uaW5jbHVkZXMoICdcInt7Q1VTVE9NX1dSQVBQRVJfU0tFTEVUT059fVwiJyApIHx8IHdyYXBwZXJzTWFpbi5pbmNsdWRlcyggJ1xcJ3t7Q1VTVE9NX1dSQVBQRVJfU0tFTEVUT059fVxcJycgKSwgJ1RlbXBsYXRlIHZhcmlhYmxlIGlzIG1pc3Npbmc6IENVU1RPTV9XUkFQUEVSX1NLRUxFVE9OJyApO1xyXG5cclxuICAvLyBSb2J1c3RseSBoYW5kbGUgZG91YmxlIG9yIHNpbmdsZSBxdW90ZXMuICBBdCB0aGUgbW9tZW50IGl0IGlzIGRvdWJsZSBxdW90ZXMuXHJcbiAgLy8gYnVpbGRTdGFuZGFsb25lIHdpbGwgbWFuZ2xlIGEgdGVtcGxhdGUgc3RyaW5nIGludG8gXCJcIiBiZWNhdXNlIGl0IGhhc24ndCBiZWVuIGZpbGxlZCBpbiB5ZXQsIGJyaW5nIGl0IGJhY2sgaGVyZSAod2l0aFxyXG4gIC8vIHN1cHBvcnQgZm9yIGl0IGNoYW5naW5nIGluIHRoZSBmdXR1cmUgZnJvbSBkb3VibGUgdG8gc2luZ2xlIHF1b3RlcykuXHJcbiAgd3JhcHBlcnNNYWluID0gd3JhcHBlcnNNYWluLnJlcGxhY2UoICdcInt7U1RBTkRBUkRfV1JBUFBFUl9TS0VMRVRPTn19XCInLCAnYHt7U1RBTkRBUkRfV1JBUFBFUl9TS0VMRVRPTn19YCcgKTtcclxuICB3cmFwcGVyc01haW4gPSB3cmFwcGVyc01haW4ucmVwbGFjZSggJ1xcJ3t7U1RBTkRBUkRfV1JBUFBFUl9TS0VMRVRPTn19XFwnJywgJ2B7e1NUQU5EQVJEX1dSQVBQRVJfU0tFTEVUT059fWAnICk7XHJcbiAgd3JhcHBlcnNNYWluID0gd3JhcHBlcnNNYWluLnJlcGxhY2UoICdcInt7Q1VTVE9NX1dSQVBQRVJfU0tFTEVUT059fVwiJywgJ2B7e0NVU1RPTV9XUkFQUEVSX1NLRUxFVE9OfX1gJyApO1xyXG4gIHdyYXBwZXJzTWFpbiA9IHdyYXBwZXJzTWFpbi5yZXBsYWNlKCAnXFwne3tDVVNUT01fV1JBUFBFUl9TS0VMRVRPTn19XFwnJywgJ2B7e0NVU1RPTV9XUkFQUEVSX1NLRUxFVE9OfX1gJyApO1xyXG5cclxuICBjb25zdCBmaWx0ZXJlZE1haW4gPSBmaWx0ZXIoIExJQl9PVVRQVVRfRklMRSwgd3JhcHBlcnNNYWluICk7XHJcblxyXG4gIGNvbnN0IG1haW5Db3B5cmlnaHQgPSBgLy8gQ29weXJpZ2h0IDIwMDItJHtuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCl9LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuLy8gVGhpcyBQaEVULWlPIGZpbGUgcmVxdWlyZXMgYSBsaWNlbnNlXHJcbi8vIFVTRSBXSVRIT1VUIEEgTElDRU5TRSBBR1JFRU1FTlQgSVMgU1RSSUNUTFkgUFJPSElCSVRFRC5cclxuLy8gRm9yIGxpY2Vuc2luZywgcGxlYXNlIGNvbnRhY3QgcGhldGhlbHBAY29sb3JhZG8uZWR1YDtcclxuXHJcbiAgZ3J1bnQuZmlsZS53cml0ZSggYCR7YnVpbGREaXJ9bGliLyR7TElCX09VVFBVVF9GSUxFfWAsXHJcbiAgICBgJHttYWluQ29weXJpZ2h0fVxyXG4vLyBcclxuLy8gQ29udGFpbnMgYWRkaXRpb25hbCBjb2RlIHVuZGVyIHRoZSBzcGVjaWZpZWQgbGljZW5zZXM6XHJcblxyXG4ke1RISVJEX1BBUlRZX0xJQl9QUkVMT0FEUy5tYXAoIGNvbnRyaWJGaWxlID0+IGdydW50LmZpbGUucmVhZCggY29udHJpYkZpbGUgKSApLmpvaW4oICdcXG5cXG4nICl9XHJcblxyXG4ke21haW5Db3B5cmlnaHR9XHJcblxyXG4ke21pbmlmaWVkUGhldGlvQ29kZX1cXG4ke2ZpbHRlcmVkTWFpbn1gICk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29weSBhbGwgdGhlIHRoaXJkIHBhcnR5IGxpYnJhcmllcyBmcm9tIHNoZXJwYSB0byB0aGUgYnVpbGQgZGlyZWN0b3J5IHVuZGVyIHRoZSAnY29udHJpYicgZm9sZGVyLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gYnVpbGREaXJcclxuICovXHJcbmNvbnN0IGhhbmRsZUNvbnRyaWIgPSBidWlsZERpciA9PiB7XHJcbiAgZ3J1bnQubG9nLmRlYnVnKCAnQ3JlYXRpbmcgcGhldC1pbyBjb250cmliIGZvbGRlcicgKTtcclxuXHJcbiAgQ09OVFJJQl9GSUxFUy5mb3JFYWNoKCBmaWxlUGF0aCA9PiB7XHJcbiAgICBjb25zdCBmaWxlUGF0aFBhcnRzID0gZmlsZVBhdGguc3BsaXQoICcvJyApO1xyXG4gICAgY29uc3QgZmlsZW5hbWUgPSBmaWxlUGF0aFBhcnRzWyBmaWxlUGF0aFBhcnRzLmxlbmd0aCAtIDEgXTtcclxuXHJcbiAgICBncnVudC5maWxlLmNvcHkoIGZpbGVQYXRoLCBgJHtidWlsZERpcn1jb250cmliLyR7ZmlsZW5hbWV9YCApO1xyXG4gIH0gKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb21iaW5lIHRoZSBmaWxlcyBuZWNlc3NhcnkgdG8gcnVuIGFuZCBob3N0IFBoRVQtaU8gbG9jYWxseSBpbnRvIGEgemlwIHRoYXQgY2FuIGJlIGVhc2lseSBkb3dubG9hZGVkIGJ5IHRoZSBjbGllbnQuXHJcbiAqIFRoaXMgZG9lcyBub3QgaW5jbHVkZSBhbnkgZG9jdW1lbnRhdGlvbiwgb3Igd3JhcHBlciBzdWl0ZSB3cmFwcGVyIGV4YW1wbGVzLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gYnVpbGREaXJcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG9cclxuICogQHBhcmFtIHtzdHJpbmd9IHZlcnNpb25cclxuICogQHJldHVybnMge1Byb21pc2UuPHZvaWQ+fVxyXG4gKi9cclxuY29uc3QgaGFuZGxlT2ZmbGluZUFydGlmYWN0ID0gYXN5bmMgKCBidWlsZERpciwgcmVwbywgdmVyc2lvbiApID0+IHtcclxuXHJcbiAgY29uc3Qgb3V0cHV0ID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0oIGAke2J1aWxkRGlyfSR7cmVwb30tcGhldC1pby0ke3ZlcnNpb259LnppcGAgKTtcclxuICBjb25zdCBhcmNoaXZlID0gYXJjaGl2ZXIoICd6aXAnICk7XHJcblxyXG4gIGFyY2hpdmUub24oICdlcnJvcicsIGVyciA9PiBncnVudC5mYWlsLmZhdGFsKCBgZXJyb3IgY3JlYXRpbmcgYXJjaGl2ZTogJHtlcnJ9YCApICk7XHJcblxyXG4gIGFyY2hpdmUucGlwZSggb3V0cHV0ICk7XHJcblxyXG4gIC8vIGNvcHkgb3ZlciB0aGUgbGliIGRpcmVjdG9yeSBhbmQgaXRzIGNvbnRlbnRzLCBhbmQgYW4gaW5kZXggdG8gdGVzdC4gTm90ZSB0aGF0IHRoZXNlIHVzZSB0aGUgZmlsZXMgZnJvbSB0aGUgYnVpbGREaXJcclxuICAvLyBiZWNhdXNlIHRoZXkgaGF2ZSBiZWVuIHBvc3QtcHJvY2Vzc2VkIGFuZCBjb250YWluIGZpbGxlZCBpbiB0ZW1wbGF0ZSB2YXJzLlxyXG4gIGFyY2hpdmUuZGlyZWN0b3J5KCBgJHtidWlsZERpcn1saWJgLCAnbGliJyApO1xyXG5cclxuICAvLyBUYWtlIGZyb20gYnVpbGQgZGlyZWN0b3J5IHNvIHRoYXQgaXQgaGFzIGJlZW4gZmlsdGVyZWQvbWFwcGVkIHRvIGNvcnJlY3QgcGF0aHMuXHJcbiAgYXJjaGl2ZS5maWxlKCBgJHtidWlsZERpcn0ke1dSQVBQRVJTX0ZPTERFUn0vY29tbW9uL2h0bWwvb2ZmbGluZS1leGFtcGxlLmh0bWxgLCB7IG5hbWU6ICdpbmRleC5odG1sJyB9ICk7XHJcblxyXG4gIC8vIGdldCB0aGUgYWxsIGh0bWwgYW5kIHRoZSBkZWJ1ZyB2ZXJzaW9uIHRvbywgdXNlIGBjd2RgIHNvIHRoYXQgdGhleSBhcmUgYXQgdGhlIHRvcCBsZXZlbCBvZiB0aGUgemlwLlxyXG4gIGFyY2hpdmUuZ2xvYiggYCR7cmVwb30qYWxsKi5odG1sYCwgeyBjd2Q6IGAke2J1aWxkRGlyfWAgfSApO1xyXG4gIGFyY2hpdmUuZmluYWxpemUoKTtcclxuXHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKCByZXNvbHZlID0+IG91dHB1dC5vbiggJ2Nsb3NlJywgcmVzb2x2ZSApICk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2VuZXJhdGUganNkb2MgYW5kIHB1dCBpdCBpbiBcImJ1aWxkL3BoZXQtaW8vZG9jXCJcclxuICogQHBhcmFtIHtzdHJpbmd9IGJ1aWxkRGlyXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlLjx2b2lkPn1cclxuICovXHJcbmNvbnN0IGhhbmRsZUpTRE9DID0gYXN5bmMgYnVpbGREaXIgPT4ge1xyXG5cclxuICAvLyBNYWtlIHN1cmUgZWFjaCBmaWxlIGV4aXN0c1xyXG4gIGZvciAoIGxldCBpID0gMDsgaSA8IEpTRE9DX0ZJTEVTLmxlbmd0aDsgaSsrICkge1xyXG4gICAgaWYgKCAhZnMuZXhpc3RzU3luYyggSlNET0NfRklMRVNbIGkgXSApICkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoIGBmaWxlIGRvZXNudCBleGlzdDogJHtKU0RPQ19GSUxFU1sgaSBdfWAgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IGdldEFyZ3MgPSBleHBsYWluID0+IFtcclxuICAgICcuLi9jaGlwcGVyL25vZGVfbW9kdWxlcy9qc2RvYy9qc2RvYy5qcycsXHJcbiAgICAuLi4oIGV4cGxhaW4gPyBbICctWCcgXSA6IFtdICksXHJcbiAgICAuLi5KU0RPQ19GSUxFUyxcclxuICAgICctYycsICcuLi9waGV0LWlvL2RvYy93cmFwcGVyL2pzZG9jLWNvbmZpZy5qc29uJyxcclxuICAgICctZCcsIGAke2J1aWxkRGlyfWRvYy9hcGlgLFxyXG4gICAgJy10JywgJy4uL2NoaXBwZXIvbm9kZV9tb2R1bGVzL2RvY2Rhc2gnLFxyXG4gICAgJy0tcmVhZG1lJywgSlNET0NfUkVBRE1FX0ZJTEVcclxuICBdO1xyXG5cclxuICAvLyBGT1IgREVCVUdHSU5HIEpTRE9DOlxyXG4gIC8vIHVuY29tbWVudCB0aGlzIGxpbmUsIGFuZCBydW4gaXQgZnJvbSB0aGUgdG9wIGxldmVsIG9mIGEgc2ltIGRpcmVjdG9yeVxyXG4gIC8vIGNvbnNvbGUubG9nKCAnbm9kZScsIGdldEFyZ3MoIGZhbHNlICkuam9pbiggJyAnICkgKTtcclxuXHJcbiAgLy8gRmlyc3Qgd2UgdHJpZWQgdG8gcnVuIHRoZSBqc2RvYyBiaW5hcnkgYXMgdGhlIGNtZCwgYnV0IHRoYXQgd2Fzbid0IHdvcmtpbmcsIGFuZCB3YXMgcXVpdGUgZmluaWNreS4gVGhlbiBAc2FtcmVpZFxyXG4gIC8vIGZvdW5kIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzMzNjY0ODQzL2hvdy10by11c2UtanNkb2Mtd2l0aC1ndWxwIHdoaWNoIHJlY29tbWVuZHMgdGhlIGZvbGxvd2luZyBtZXRob2RcclxuICAvLyAobm9kZSBleGVjdXRhYmxlIHdpdGgganNkb2MganMgZmlsZSlcclxuICBhd2FpdCBleGVjdXRlKCAnbm9kZScsIGdldEFyZ3MoIGZhbHNlICksIHByb2Nlc3MuY3dkKCksIHtcclxuICAgIHNoZWxsOiB0cnVlXHJcbiAgfSApO1xyXG5cclxuICAvLyBSdW5uaW5nIHdpdGggZXhwbGFuYXRpb24gLVggYXBwZWFycyB0byBub3Qgb3V0cHV0IHRoZSBmaWxlcywgc28gd2UgaGF2ZSB0byBydW4gaXQgdHdpY2UuXHJcbiAgY29uc3QgZXhwbGFuYXRpb24gPSAoIGF3YWl0IGV4ZWN1dGUoICdub2RlJywgZ2V0QXJncyggdHJ1ZSApLCBwcm9jZXNzLmN3ZCgpLCB7XHJcbiAgICBzaGVsbDogdHJ1ZVxyXG4gIH0gKSApLnRyaW0oKTtcclxuXHJcbiAgLy8gQ29weSB0aGUgbG9nbyBmaWxlXHJcbiAgY29uc3QgaW1hZ2VEaXIgPSBgJHtidWlsZERpcn1kb2MvaW1hZ2VzYDtcclxuICBpZiAoICFmcy5leGlzdHNTeW5jKCBpbWFnZURpciApICkge1xyXG4gICAgZnMubWtkaXJTeW5jKCBpbWFnZURpciApO1xyXG4gIH1cclxuICBmcy5jb3B5RmlsZVN5bmMoICcuLi9icmFuZC9waGV0LWlvL2ltYWdlcy9sb2dvT25XaGl0ZS5wbmcnLCBgJHtpbWFnZURpcn0vbG9nby5wbmdgICk7XHJcblxyXG4gIGNvbnN0IGpzb24gPSBleHBsYW5hdGlvbi5zdWJzdHJpbmcoIGV4cGxhbmF0aW9uLmluZGV4T2YoICdbJyApLCBleHBsYW5hdGlvbi5sYXN0SW5kZXhPZiggJ10nICkgKyAxICk7XHJcblxyXG4gIC8vIGJhc2ljIHNhbml0eSBjaGVja3NcclxuICBhc3NlcnQoIGpzb24ubGVuZ3RoID4gNTAwMCwgJ0pTT04gc2VlbXMgb2RkJyApO1xyXG4gIHRyeSB7XHJcbiAgICBKU09OLnBhcnNlKCBqc29uICk7XHJcbiAgfVxyXG4gIGNhdGNoKCBlICkge1xyXG4gICAgYXNzZXJ0KCBmYWxzZSwgJ0pTT04gcGFyc2luZyBmYWlsZWQnICk7XHJcbiAgfVxyXG5cclxuICBmcy53cml0ZUZpbGVTeW5jKCBgJHtidWlsZERpcn1kb2MvanNkb2MtZXhwbGFuYXRpb24uanNvbmAsIGpzb24gKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZW5lcmF0ZXMgdGhlIHBoZXQtaW8gY2xpZW50IGd1aWRlcyBhbmQgcHV0cyB0aGVtIGluIGBidWlsZC9waGV0LWlvL2RvYy9ndWlkZXMvYFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwb05hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IHNpbXVsYXRpb25EaXNwbGF5TmFtZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gYnVpbGREaXJcclxuICogQHBhcmFtIHtzdHJpbmd9IHZlcnNpb25cclxuICogQHBhcmFtIHtzdHJpbmd9IHNpbVJlcG9TSEFcclxuICovXHJcbmNvbnN0IGhhbmRsZUNsaWVudEd1aWRlcyA9ICggcmVwb05hbWUsIHNpbXVsYXRpb25EaXNwbGF5TmFtZSwgYnVpbGREaXIsIHZlcnNpb24sIHNpbVJlcG9TSEEgKSA9PiB7XHJcbiAgY29uc3QgYnVpbHRDbGllbnRHdWlkZXNPdXRwdXREaXIgPSBgJHtidWlsZERpcn1kb2MvZ3VpZGVzL2A7XHJcbiAgY29uc3QgY2xpZW50R3VpZGVzU291cmNlUm9vdCA9IGAke1BIRVRfSU9fU0lNX1NQRUNJRklDfS9yZXBvcy8ke3JlcG9OYW1lfS9gO1xyXG4gIGNvbnN0IGNvbW1vbkRpciA9IGAke1BIRVRfSU9fU0lNX1NQRUNJRklDfS8ke0dVSURFU19DT01NT05fRElSfWA7XHJcblxyXG4gIC8vIGNvcHkgb3ZlciBjb21tb24gaW1hZ2VzIGFuZCBzdHlsZXNcclxuICBjb3B5RGlyZWN0b3J5KCBjb21tb25EaXIsIGAke2J1aWx0Q2xpZW50R3VpZGVzT3V0cHV0RGlyfWAgKTtcclxuXHJcbiAgLy8gaGFuZGxlIGdlbmVyYXRpbmcgYW5kIHdyaXRpbmcgdGhlIGh0bWwgZmlsZSBmb3IgZWFjaCBjbGllbnQgZ3VpZGVcclxuICBnZW5lcmF0ZUFuZFdyaXRlQ2xpZW50R3VpZGUoIHJlcG9OYW1lLFxyXG4gICAgYCR7c2ltdWxhdGlvbkRpc3BsYXlOYW1lfSBQaEVULWlPIEd1aWRlYCxcclxuICAgIHNpbXVsYXRpb25EaXNwbGF5TmFtZSxcclxuICAgIGAke2NvbW1vbkRpcn0vJHtQSEVUX0lPX0dVSURFX0ZJTEVOQU1FfS5tZGAsXHJcbiAgICBgJHtidWlsdENsaWVudEd1aWRlc091dHB1dERpcn0ke1BIRVRfSU9fR1VJREVfRklMRU5BTUV9Lmh0bWxgLFxyXG4gICAgdmVyc2lvbiwgc2ltUmVwb1NIQSwgZmFsc2UgKTtcclxuICBnZW5lcmF0ZUFuZFdyaXRlQ2xpZW50R3VpZGUoIHJlcG9OYW1lLFxyXG4gICAgYCR7c2ltdWxhdGlvbkRpc3BsYXlOYW1lfSBFeGFtcGxlc2AsXHJcbiAgICBzaW11bGF0aW9uRGlzcGxheU5hbWUsXHJcbiAgICBgJHtjbGllbnRHdWlkZXNTb3VyY2VSb290fSR7RVhBTVBMRVNfRklMRU5BTUV9Lm1kYCxcclxuICAgIGAke2J1aWx0Q2xpZW50R3VpZGVzT3V0cHV0RGlyfSR7RVhBTVBMRVNfRklMRU5BTUV9Lmh0bWxgLFxyXG4gICAgdmVyc2lvbiwgc2ltUmVwb1NIQSwgdHJ1ZSApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRha2VzIGEgbWFya2Rvd24gY2xpZW50IGd1aWRlcywgZmlsbHMgaW4gdGhlIGxpbmtzLCBhbmQgdGhlbiBnZW5lcmF0ZXMgYW5kIHdyaXRlcyBpdCBhcyBodG1sXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvTmFtZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdGl0bGVcclxuICogQHBhcmFtIHtzdHJpbmd9IHNpbXVsYXRpb25EaXNwbGF5TmFtZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWRGaWxlUGF0aCAtIHRvIGdldCB0aGUgc291cmNlIG1kIGZpbGVcclxuICogQHBhcmFtIHtzdHJpbmd9IGRlc3RpbmF0aW9uUGF0aCAtIHRvIHdyaXRlIHRvXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB2ZXJzaW9uXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzaW1SZXBvU0hBXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gYXNzZXJ0Tm9Db25zdEF3YWl0IC0gaGFuZGxlIGFzc2VydGluZyBmb3IgXCJjb25zdCBYID0gYXdhaXQgLi4uXCIgaW4gZXhhbXBsZXMsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby1zaW0tc3BlY2lmaWMvaXNzdWVzLzM0XHJcbiAqL1xyXG5jb25zdCBnZW5lcmF0ZUFuZFdyaXRlQ2xpZW50R3VpZGUgPSAoIHJlcG9OYW1lLCB0aXRsZSwgc2ltdWxhdGlvbkRpc3BsYXlOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1kRmlsZVBhdGgsIGRlc3RpbmF0aW9uUGF0aCwgdmVyc2lvbiwgc2ltUmVwb1NIQSwgYXNzZXJ0Tm9Db25zdEF3YWl0ICkgPT4ge1xyXG5cclxuICAvLyBtYWtlIHN1cmUgdGhlIHNvdXJjZSBtYXJrZG93biBmaWxlIGV4aXN0c1xyXG4gIGlmICggIWZzLmV4aXN0c1N5bmMoIG1kRmlsZVBhdGggKSApIHtcclxuICAgIGdydW50LmxvZy53YXJuKCBgbm8gY2xpZW50IGd1aWRlIGZvdW5kIGF0ICR7bWRGaWxlUGF0aH0sIG5vIGd1aWRlIGJlaW5nIGJ1aWx0LmAgKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHNpbUNhbWVsQ2FzZU5hbWUgPSBfLmNhbWVsQ2FzZSggcmVwb05hbWUgKTtcclxuXHJcbiAgbGV0IG1vZGVsRG9jdW1lbnRhdGlvbkxpbmUgPSAnJztcclxuXHJcbiAgaWYgKCBmcy5leGlzdHNTeW5jKCBgLi4vJHtyZXBvTmFtZX0vZG9jL21vZGVsLm1kYCApICkge1xyXG4gICAgbW9kZWxEb2N1bWVudGF0aW9uTGluZSA9IGAqIFtNb2RlbCBEb2N1bWVudGF0aW9uXShodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvJHtyZXBvTmFtZX0vYmxvYi8ke3NpbVJlcG9TSEF9L2RvYy9tb2RlbC5tZClgO1xyXG4gIH1cclxuXHJcbiAgLy8gZmlsbCBpbiBsaW5rc1xyXG4gIGxldCBjbGllbnRHdWlkZVNvdXJjZSA9IGdydW50LmZpbGUucmVhZCggbWRGaWxlUGF0aCApO1xyXG5cclxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgLy8gRE8gTk9UIFVQREFURSBPUiBBREQgVE8gVEhFU0UgV0lUSE9VVCBBTFNPIFVQREFUSU5HIFRIRSBMSVNUIElOIHBoZXQtaW8tc2ltLXNwZWNpZmljL2NsaWVudC1ndWlkZS1jb21tb24vUkVBRE1FLm1kXHJcbiAgY2xpZW50R3VpZGVTb3VyY2UgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUFsbCggY2xpZW50R3VpZGVTb3VyY2UsICd7e1dSQVBQRVJfSU5ERVhfUEFUSH19JywgJy4uLy4uLycgKTtcclxuICBjbGllbnRHdWlkZVNvdXJjZSA9IENoaXBwZXJTdHJpbmdVdGlscy5yZXBsYWNlQWxsKCBjbGllbnRHdWlkZVNvdXJjZSwgJ3t7U0lNVUxBVElPTl9ESVNQTEFZX05BTUV9fScsIHNpbXVsYXRpb25EaXNwbGF5TmFtZSApO1xyXG4gIGNsaWVudEd1aWRlU291cmNlID0gQ2hpcHBlclN0cmluZ1V0aWxzLnJlcGxhY2VBbGwoIGNsaWVudEd1aWRlU291cmNlLCAne3tTSU1fUEFUSH19JywgYC4uLy4uLyR7cmVwb05hbWV9X2FsbF9waGV0LWlvLmh0bWw/cG9zdE1lc3NhZ2VPbkVycm9yJnBoZXRpb1N0YW5kYWxvbmVgICk7XHJcbiAgY2xpZW50R3VpZGVTb3VyY2UgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUFsbCggY2xpZW50R3VpZGVTb3VyY2UsICd7e1NUVURJT19QQVRIfX0nLCAnLi4vLi4vd3JhcHBlcnMvc3R1ZGlvLycgKTtcclxuICBjbGllbnRHdWlkZVNvdXJjZSA9IENoaXBwZXJTdHJpbmdVdGlscy5yZXBsYWNlQWxsKCBjbGllbnRHdWlkZVNvdXJjZSwgJ3t7UEhFVF9JT19HVUlERV9QQVRIfX0nLCBgLi8ke1BIRVRfSU9fR1VJREVfRklMRU5BTUV9Lmh0bWxgICk7XHJcbiAgY2xpZW50R3VpZGVTb3VyY2UgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUFsbCggY2xpZW50R3VpZGVTb3VyY2UsICd7e0RBVEV9fScsIG5ldyBEYXRlKCkudG9TdHJpbmcoKSApO1xyXG4gIGNsaWVudEd1aWRlU291cmNlID0gQ2hpcHBlclN0cmluZ1V0aWxzLnJlcGxhY2VBbGwoIGNsaWVudEd1aWRlU291cmNlLCAne3tzaW1DYW1lbENhc2VOYW1lfX0nLCBzaW1DYW1lbENhc2VOYW1lICk7XHJcbiAgY2xpZW50R3VpZGVTb3VyY2UgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUFsbCggY2xpZW50R3VpZGVTb3VyY2UsICd7e3NpbUtlYmFiTmFtZX19JywgcmVwb05hbWUgKTtcclxuICBjbGllbnRHdWlkZVNvdXJjZSA9IENoaXBwZXJTdHJpbmdVdGlscy5yZXBsYWNlQWxsKCBjbGllbnRHdWlkZVNvdXJjZSwgJ3t7U0lNVUxBVElPTl9WRVJTSU9OX1NUUklOR319JywgdmVyc2lvbiApO1xyXG4gIGNsaWVudEd1aWRlU291cmNlID0gQ2hpcHBlclN0cmluZ1V0aWxzLnJlcGxhY2VBbGwoIGNsaWVudEd1aWRlU291cmNlLCAne3tNT0RFTF9ET0NVTUVOVEFUSU9OX0xJTkV9fScsIG1vZGVsRG9jdW1lbnRhdGlvbkxpbmUgKTtcclxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG4gIC8vIHN1cHBvcnQgcmVsYXRpdmUgYW5kIGFic29sdXRlIHBhdGhzIGZvciB1bmJ1aWx0IGNvbW1vbiBpbWFnZSBwcmV2aWV3cyBieSByZXBsYWNpbmcgdGhlbSB3aXRoIHRoZSBjb3JyZWN0IHJlbGF0aXZlIHBhdGguIE9yZGVyIG1hdHRlcnMhXHJcbiAgY2xpZW50R3VpZGVTb3VyY2UgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUFsbCggY2xpZW50R3VpZGVTb3VyY2UsIGAuLi8uLi8uLi8ke0dVSURFU19DT01NT05fRElSfWAsICcnICk7XHJcbiAgY2xpZW50R3VpZGVTb3VyY2UgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUFsbCggY2xpZW50R3VpZGVTb3VyY2UsIGAuLi8uLi8ke0dVSURFU19DT01NT05fRElSfWAsICcnICk7XHJcbiAgY2xpZW50R3VpZGVTb3VyY2UgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUFsbCggY2xpZW50R3VpZGVTb3VyY2UsIGAuLi8ke0dVSURFU19DT01NT05fRElSfWAsICcnICk7XHJcbiAgY2xpZW50R3VpZGVTb3VyY2UgPSBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZUFsbCggY2xpZW50R3VpZGVTb3VyY2UsIGAvJHtHVUlERVNfQ09NTU9OX0RJUn1gLCAnJyApO1xyXG5cclxuICAvLyBTaW5jZSB3ZSBkb24ndCBoYXZlIGEgYmFkLXRleHQgbGludCBydWxlIGZvciBtZCBmaWxlcywgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvLXNpbS1zcGVjaWZpYy9pc3N1ZXMvMzRcclxuICBhc3NlcnROb0NvbnN0QXdhaXQgJiYgYXNzZXJ0KCAhL14uKmNvbnN0Liphd2FpdC4qJC9nbS50ZXN0KCBjbGllbnRHdWlkZVNvdXJjZSApLFxyXG4gICAgYHVzZSBsZXQgaW5zdGVhZCBvZiBjb25zdCB3aGVuIGF3YWl0aW5nIHZhbHVlcyBpbiBQaEVULWlPIFwiJHtFWEFNUExFU19GSUxFTkFNRX1cIiBmaWxlc2AgKTtcclxuXHJcbiAgY29uc3QgcmVuZGVyZWRDbGllbnRHdWlkZSA9IG1hcmtlZC5wYXJzZSggY2xpZW50R3VpZGVTb3VyY2UgKTtcclxuXHJcbiAgLy8gbGluayBhIHN0eWxlc2hlZXRcclxuICBjb25zdCBjbGllbnRHdWlkZUhUTUwgPSBgPGhlYWQ+XHJcbiAgICAgICAgICAgICAgICAgICA8bGluayByZWw9J3N0eWxlc2hlZXQnIGhyZWY9J2Nzcy9naXRodWItbWFya2Rvd24uY3NzJyB0eXBlPSd0ZXh0L2Nzcyc+XHJcbiAgICAgICAgICAgICAgICAgICA8dGl0bGU+JHt0aXRsZX08L3RpdGxlPlxyXG4gICAgICAgICAgICAgICAgIDwvaGVhZD5cclxuICAgICAgICAgICAgICAgICA8Ym9keT5cclxuICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibWFya2Rvd24tYm9keVwiPlxyXG4gICAgICAgICAgICAgICAgICAgJHtyZW5kZXJlZENsaWVudEd1aWRlfVxyXG4gICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgIDwvYm9keT5gO1xyXG5cclxuICAvLyB3cml0ZSB0aGUgb3V0cHV0IHRvIHRoZSBidWlsZCBkaXJlY3RvcnlcclxuICBncnVudC5maWxlLndyaXRlKCBkZXN0aW5hdGlvblBhdGgsIGNsaWVudEd1aWRlSFRNTCApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN1cHBvcnQgYnVpbGRpbmcgc3R1ZGlvLiBUaGlzIGNvbXBpbGVzIHRoZSBzdHVkaW8gbW9kdWxlcyBpbnRvIGEgcnVubmFibGUsIGFuZCBjb3BpZXMgdGhhdCBvdmVyIHRvIHRoZSBleHBlY3RlZCBzcG90XHJcbiAqIG9uIGJ1aWxkLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gd3JhcHBlcnNMb2NhdGlvblxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48dm9pZD59XHJcbiAqL1xyXG5jb25zdCBoYW5kbGVTdHVkaW8gPSBhc3luYyAoIHJlcG8sIHdyYXBwZXJzTG9jYXRpb24gKSA9PiB7XHJcblxyXG4gIGdydW50LmxvZy5kZWJ1ZyggJ2J1aWxkaW5nIHN0dWRpbycgKTtcclxuXHJcbiAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHRzYyggJy4uL3N0dWRpbycgKTtcclxuICByZXBvcnRUc2NSZXN1bHRzKCByZXN1bHRzLCBncnVudCApO1xyXG5cclxuICBmcy53cml0ZUZpbGVTeW5jKCBgJHt3cmFwcGVyc0xvY2F0aW9ufXN0dWRpby8ke1NUVURJT19CVUlMVF9GSUxFTkFNRX1gLCBhd2FpdCBidWlsZFN0YW5kYWxvbmUoICdzdHVkaW8nLCB7XHJcbiAgICBzdHJpcEFzc2VydGlvbnM6IGZhbHNlLFxyXG4gICAgc3RyaXBMb2dnaW5nOiBmYWxzZSxcclxuICAgIHRlbXBPdXRwdXREaXI6IHJlcG9cclxuICB9ICkgKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBVc2Ugd2VicGFjayB0byBidW5kbGUgdGhlIG1pZ3JhdGlvbiBwcm9jZXNzb3JzIGludG8gYSBjb21waWxlZCBjb2RlIHN0cmluZywgZm9yIHVzZSBpbiBwaGV0LWlvIGxpYiBmaWxlLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gYnVpbGREaXJcclxuICogQHJldHVybnMge1Byb21pc2UuPHN0cmluZz59XHJcbiAqL1xyXG5jb25zdCBnZXRDb21waWxlZE1pZ3JhdGlvblByb2Nlc3NvcnMgPSBhc3luYyAoIHJlcG8sIGJ1aWxkRGlyICkgPT4ge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSggKCByZXNvbHZlLCByZWplY3QgKSA9PiB7XHJcblxyXG4gICAgY29uc3QgbWlncmF0aW9uUHJvY2Vzc29yc0ZpbGVuYW1lID0gYCR7cmVwb30tbWlncmF0aW9uLXByb2Nlc3NvcnMuanNgO1xyXG4gICAgY29uc3QgZW50cnlQb2ludEZpbGVuYW1lID0gYC4uL2NoaXBwZXIvZGlzdC9qcy9waGV0LWlvLXNpbS1zcGVjaWZpYy9yZXBvcy8ke3JlcG99L2pzLyR7bWlncmF0aW9uUHJvY2Vzc29yc0ZpbGVuYW1lfWA7XHJcbiAgICBpZiAoICFmcy5leGlzdHNTeW5jKCBlbnRyeVBvaW50RmlsZW5hbWUgKSApIHtcclxuICAgICAgZ3J1bnQubG9nLmRlYnVnKCBgTm8gbWlncmF0aW9uIHByb2Nlc3NvcnMgZm91bmQgYXQgJHtlbnRyeVBvaW50RmlsZW5hbWV9LCBubyBwcm9jZXNzb3JzIHRvIGJlIGJ1bmRsZWQgd2l0aCAke0xJQl9PVVRQVVRfRklMRX0uYCApO1xyXG4gICAgICByZXNvbHZlKCAnJyApOyAvLyBibGFuayBzdHJpbmcgYmVjYXVzZSB0aGVyZSBhcmUgbm8gcHJvY2Vzc29ycyB0byBhZGQuXHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuXHJcbiAgICAgIC8vIG91dHB1dCBkaXIgbXVzdCBiZSBhbiBhYnNvbHV0ZSBwYXRoXHJcbiAgICAgIGNvbnN0IG91dHB1dERpciA9IHBhdGgucmVzb2x2ZSggX19kaXJuYW1lLCBgLi4vLi4vJHtyZXBvfS8ke2J1aWxkRGlyfWAgKTtcclxuXHJcbiAgICAgIGNvbnN0IGNvbXBpbGVyID0gd2VicGFjaygge1xyXG4gICAgICAgIG1vZHVsZToge1xyXG4gICAgICAgICAgcnVsZXM6IHdlYnBhY2tCdWlsZC5nZXRNb2R1bGVSdWxlcygpIC8vIFN1cHBvcnQgcHJlbG9hZC1saWtlIGxpYnJhcnkgZ2xvYmFscyB1c2VkIHZpYSBgaW1wb3J0YFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLy8gV2UgdWdsaWZ5IGFzIGEgc3RlcCBhZnRlciB0aGlzLCB3aXRoIG1hbnkgY3VzdG9tIHJ1bGVzLiBTbyB3ZSBkbyBOT1Qgb3B0aW1pemUgb3IgdWdsaWZ5IGluIHRoaXMgc3RlcC5cclxuICAgICAgICBvcHRpbWl6YXRpb246IHtcclxuICAgICAgICAgIG1pbmltaXplOiBmYWxzZVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vIFNpbXVsYXRpb25zIG9yIHJ1bm5hYmxlcyB3aWxsIGhhdmUgYSBzaW5nbGUgZW50cnkgcG9pbnRcclxuICAgICAgICBlbnRyeToge1xyXG4gICAgICAgICAgcmVwbzogZW50cnlQb2ludEZpbGVuYW1lXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8gV2Ugb3V0cHV0IG91ciBidWlsZHMgdG8gdGhlIGZvbGxvd2luZyBkaXJcclxuICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgIHBhdGg6IG91dHB1dERpcixcclxuICAgICAgICAgIGZpbGVuYW1lOiBtaWdyYXRpb25Qcm9jZXNzb3JzRmlsZW5hbWVcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGNvbXBpbGVyLnJ1biggKCBlcnIsIHN0YXRzICkgPT4ge1xyXG4gICAgICAgIGlmICggZXJyIHx8IHN0YXRzLmhhc0Vycm9ycygpICkge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvciggJ01pZ3JhdGlvbiBwcm9jZXNzb3JzIHdlYnBhY2sgYnVpbGQgZXJyb3JzOicsIHN0YXRzLmNvbXBpbGF0aW9uLmVycm9ycyApO1xyXG4gICAgICAgICAgcmVqZWN0KCBlcnIgfHwgc3RhdHMuY29tcGlsYXRpb24uZXJyb3JzWyAwIF0gKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBjb25zdCBqc0ZpbGUgPSBgJHtvdXRwdXREaXJ9LyR7bWlncmF0aW9uUHJvY2Vzc29yc0ZpbGVuYW1lfWA7XHJcbiAgICAgICAgICBjb25zdCBqcyA9IGZzLnJlYWRGaWxlU3luYygganNGaWxlLCAndXRmLTgnICk7XHJcblxyXG4gICAgICAgICAgZnMudW5saW5rU3luYygganNGaWxlICk7XHJcblxyXG4gICAgICAgICAgcmVzb2x2ZSgganMgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuICB9ICk7XHJcbn07Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQTtBQUNBLE1BQU1BLENBQUMsR0FBR0MsT0FBTyxDQUFFLFFBQVMsQ0FBQztBQUM3QixNQUFNQyxNQUFNLEdBQUdELE9BQU8sQ0FBRSxRQUFTLENBQUM7QUFDbEMsTUFBTUUsUUFBUSxHQUFHRixPQUFPLENBQUUsVUFBVyxDQUFDO0FBQ3RDLE1BQU1HLGtCQUFrQixHQUFHSCxPQUFPLENBQUUsOEJBQStCLENBQUM7QUFDcEUsTUFBTUksYUFBYSxHQUFHSixPQUFPLENBQUUsd0JBQXlCLENBQUM7QUFDekQsTUFBTUssT0FBTyxHQUFHTCxPQUFPLENBQUUsNENBQTZDLENBQUM7QUFDdkUsTUFBTU0sRUFBRSxHQUFHTixPQUFPLENBQUUsSUFBSyxDQUFDO0FBQzFC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