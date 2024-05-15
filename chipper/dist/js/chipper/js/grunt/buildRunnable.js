// Copyright 2017-2024, University of Colorado Boulder

/**
 * Builds a runnable (something that builds like a simulation)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// modules
const _ = require('lodash');
const assert = require('assert');
const ChipperConstants = require('../common/ChipperConstants');
const ChipperStringUtils = require('../common/ChipperStringUtils');
const getLicenseEntry = require('../common/getLicenseEntry');
const copyDirectory = require('./copyDirectory');
const copySupplementalPhetioFiles = require('./copySupplementalPhetioFiles');
const generateThumbnails = require('./generateThumbnails');
const generateTwitterCard = require('./generateTwitterCard');
const getA11yViewHTMLFromTemplate = require('./getA11yViewHTMLFromTemplate');
const getAllThirdPartyEntries = require('./getAllThirdPartyEntries');
const getDependencies = require('./getDependencies');
const getInitializationScript = require('./getInitializationScript');
const getLocalesFromRepository = require('./getLocalesFromRepository');
const getPhetLibs = require('./getPhetLibs');
const getPreloads = require('./getPreloads');
const getStringMap = require('./getStringMap');
const getTitleStringKey = require('./getTitleStringKey');
const grunt = require('grunt');
const path = require('path');
const jimp = require('jimp');
const loadFileAsDataURI = require('../common/loadFileAsDataURI');
const minify = require('./minify');
const nodeHTMLEncoder = require('node-html-encoder'); // eslint-disable-line require-statement-match
const packageRunnable = require('./packageRunnable');
const packageXHTML = require('./packageXHTML');
const reportUnusedMedia = require('./reportUnusedMedia');
const reportUnusedStrings = require('./reportUnusedStrings');
const webpackBuild = require('./webpackBuild');
const zlib = require('zlib');
const phetTimingLog = require('../../../perennial-alias/js/common/phetTimingLog');
const recordTime = async (name, asyncCallback, timeCallback) => {
  const beforeTime = Date.now();
  const result = await phetTimingLog.startAsync(name, async () => {
    const result = await asyncCallback();
    return result;
  });
  const afterTime = Date.now();
  timeCallback(afterTime - beforeTime, result);
  return result;
};

/**
 * Builds a runnable (e.g. a simulation).
 * @public
 *
 * @param {string} repo
 * @param {Object} minifyOptions - see minify.js
 * @param {boolean} allHTML - If the _all.html file should be generated
 * @param {string} brand
 * @param {string} localesOption - e.g,. '*', 'en,es', etc.
 * @param {boolean} buildLocal
 * @param {boolean} encodeStringMap
 * @param {boolean} compressScripts
 * @param {boolean} profileFileSize
 * @returns {Promise} - Does not resolve a value
 */
module.exports = async function (repo, minifyOptions, allHTML, brand, localesOption, buildLocal, encodeStringMap, compressScripts, profileFileSize) {
  assert(typeof repo === 'string');
  assert(typeof minifyOptions === 'object');
  if (brand === 'phet-io') {
    assert(grunt.file.exists('../phet-io'), 'Aborting the build of phet-io brand since proprietary repositories are not checked out.\nPlease use --brands=={{BRAND}} in the future to avoid this.');
  }
  const packageObject = grunt.file.readJSON(`../${repo}/package.json`);
  const encoder = new nodeHTMLEncoder.Encoder('entity');

  // All html files share the same build timestamp
  let timestamp = new Date().toISOString().split('T').join(' ');
  timestamp = `${timestamp.substring(0, timestamp.indexOf('.'))} UTC`;

  // Start running webpack
  const webpackResult = await recordTime('webpack', async () => webpackBuild(repo, brand, {
    profileFileSize: profileFileSize
  }), time => {
    grunt.log.ok(`Webpack build complete: ${time}ms`);
  });

  // NOTE: This build currently (due to the string/mipmap plugins) modifies globals. Some operations need to be done after this.
  const webpackJS = wrapProfileFileSize(`phet.chipper.runWebpack = function() {${webpackResult.js}};`, profileFileSize, 'WEBPACK');

  // Debug version is independent of passed in minifyOptions.  PhET-iO brand is minified, but leaves assertions & logging.
  const debugMinifyOptions = brand === 'phet-io' ? {
    stripAssertions: false,
    stripLogging: false
  } : {
    minify: false
  };

  // If turning off minification for the main build, don't minify the debug version also
  if (minifyOptions.minify === false) {
    debugMinifyOptions.minify = false;
  }
  const usedModules = webpackResult.usedModules;
  reportUnusedMedia(repo, usedModules);
  const licenseEntries = {};
  ChipperConstants.MEDIA_TYPES.forEach(mediaType => {
    licenseEntries[mediaType] = {};
  });
  usedModules.forEach(module => {
    ChipperConstants.MEDIA_TYPES.forEach(mediaType => {
      if (module.split('/')[1] === mediaType) {
        // The file suffix is stripped and restored to its non-js extension. This is because getLicenseEntry doesn't
        // handle modulified media files.
        const index = module.lastIndexOf('_');
        const path = `${module.slice(0, index)}.${module.slice(index + 1, -3)}`;
        licenseEntries[mediaType][module] = getLicenseEntry(`../${path}`);
      }
    });
  });
  const phetLibs = getPhetLibs(repo, brand);
  const allLocales = [ChipperConstants.FALLBACK_LOCALE, ...getLocalesFromRepository(repo)];
  const locales = localesOption === '*' ? allLocales : localesOption.split(',');
  const dependencies = await getDependencies(repo);
  webpackResult.usedModules.forEach(moduleDependency => {
    // The first part of the path is the repo.  Or if no directory is specified, the file is in the sim repo.
    const pathSeparatorIndex = moduleDependency.indexOf(path.sep);
    const moduleRepo = pathSeparatorIndex >= 0 ? moduleDependency.slice(0, pathSeparatorIndex) : repo;
    assert(Object.keys(dependencies).includes(moduleRepo), `repo ${moduleRepo} missing from package.json's phetLibs for ${moduleDependency}`);
  });
  const version = packageObject.version; // Include the one-off name in the version
  const thirdPartyEntries = getAllThirdPartyEntries(repo, brand, licenseEntries);
  const simTitleStringKey = getTitleStringKey(repo);
  const {
    stringMap,
    stringMetadata
  } = getStringMap(repo, allLocales, phetLibs, webpackResult.usedModules);

  // After our string map is constructed, report which of the translatable strings are unused.
  reportUnusedStrings(repo, packageObject.phet.requirejsNamespace, stringMap[ChipperConstants.FALLBACK_LOCALE]);

  // If we have NO strings for a given locale that we want, we'll need to fill it in with all English strings, see
  // https://github.com/phetsims/perennial/issues/83
  for (const locale of locales) {
    if (!stringMap[locale]) {
      stringMap[locale] = stringMap[ChipperConstants.FALLBACK_LOCALE];
    }
  }
  const englishTitle = stringMap[ChipperConstants.FALLBACK_LOCALE][simTitleStringKey];
  assert(englishTitle, `missing entry for sim title, key = ${simTitleStringKey}`);

  // Select the HTML comment header based on the brand, see https://github.com/phetsims/chipper/issues/156
  let htmlHeader;
  if (brand === 'phet-io') {
    // License text provided by @kathy-phet in https://github.com/phetsims/chipper/issues/148#issuecomment-112584773
    htmlHeader = `${englishTitle} ${version}\n` + `Copyright 2002-${grunt.template.today('yyyy')}, Regents of the University of Colorado\n` + 'PhET Interactive Simulations, University of Colorado Boulder\n' + '\n' + 'This Interoperable PhET Simulation file requires a license.\n' + 'USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.\n' + 'Contact phethelp@colorado.edu regarding licensing.\n' + 'https://phet.colorado.edu/en/licensing';
  } else {
    htmlHeader = `${englishTitle} ${version}\n` + `Copyright 2002-${grunt.template.today('yyyy')}, Regents of the University of Colorado\n` + 'PhET Interactive Simulations, University of Colorado Boulder\n' + '\n' + 'This file is licensed under Creative Commons Attribution 4.0\n' + 'For alternate source code licensing, see https://github.com/phetsims\n' + 'For licenses for third-party software used by this simulation, see below\n' + 'For more information, see https://phet.colorado.edu/en/licensing/html\n' + '\n' + 'The PhET name and PhET logo are registered trademarks of The Regents of the\n' + 'University of Colorado. Permission is granted to use the PhET name and PhET logo\n' + 'only for attribution purposes. Use of the PhET name and/or PhET logo for promotional,\n' + 'marketing, or advertising purposes requires a separate license agreement from the\n' + 'University of Colorado. Contact phethelp@colorado.edu regarding licensing.';
  }

  // Scripts that are run before our main minifiable content
  const startupScripts = [
  // Splash image
  wrapProfileFileSize(`window.PHET_SPLASH_DATA_URI="${loadFileAsDataURI(`../brand/${brand}/images/splash.svg`)}";`, profileFileSize, 'SPLASH')];
  const minifiableScripts = [
  // Preloads
  ...getPreloads(repo, brand, true).map(filename => wrapProfileFileSize(grunt.file.read(filename), profileFileSize, 'PRELOAD', filename)),
  // Our main module content, wrapped in a function called in the startup below
  webpackJS,
  // Main startup
  wrapProfileFileSize(grunt.file.read('../chipper/templates/chipper-startup.js'), profileFileSize, 'STARTUP')];
  const productionScripts = await recordTime('minify-production', async () => {
    return [...startupScripts, ...minifiableScripts.map(js => minify(js, minifyOptions))];
  }, (time, scripts) => {
    grunt.log.ok(`Production minification complete: ${time}ms (${_.sum(scripts.map(js => js.length))} bytes)`);
  });
  const debugScripts = await recordTime('minify-debug', async () => {
    return [...startupScripts, ...minifiableScripts.map(js => minify(js, debugMinifyOptions))];
  }, (time, scripts) => {
    grunt.log.ok(`Debug minification complete: ${time}ms (${_.sum(scripts.map(js => js.length))} bytes)`);
  });
  const licenseScript = wrapProfileFileSize(ChipperStringUtils.replacePlaceholders(grunt.file.read('../chipper/templates/license-initialization.js'), {
    PHET_START_THIRD_PARTY_LICENSE_ENTRIES: ChipperConstants.START_THIRD_PARTY_LICENSE_ENTRIES,
    PHET_THIRD_PARTY_LICENSE_ENTRIES: JSON.stringify(thirdPartyEntries, null, 2),
    PHET_END_THIRD_PARTY_LICENSE_ENTRIES: ChipperConstants.END_THIRD_PARTY_LICENSE_ENTRIES
  }), profileFileSize, 'LICENSE');
  const commonInitializationOptions = {
    brand: brand,
    repo: repo,
    allLocales: allLocales,
    stringMap: stringMap,
    stringMetadata: stringMetadata,
    dependencies: dependencies,
    timestamp: timestamp,
    version: version,
    packageObject: packageObject,
    allowLocaleSwitching: false,
    encodeStringMap: encodeStringMap,
    profileFileSize: profileFileSize,
    wrapStringsJS: stringsJS => wrapProfileFileSize(stringsJS, profileFileSize, 'STRINGS')
  };

  // Create the build-specific directory
  const buildDir = `../${repo}/build/${brand}`;
  grunt.file.mkdir(buildDir);

  // {{locale}}.html
  if (brand !== 'phet-io') {
    for (const locale of locales) {
      const initializationScript = getInitializationScript(_.assignIn({
        locale: locale,
        includeAllLocales: false,
        isDebugBuild: false
      }, commonInitializationOptions));
      grunt.file.write(`${buildDir}/${repo}_${locale}_${brand}.html`, packageRunnable({
        repo: repo,
        stringMap: stringMap,
        htmlHeader: htmlHeader,
        locale: locale,
        compressScripts: compressScripts,
        licenseScript: licenseScript,
        scripts: [initializationScript, ...productionScripts]
      }));
    }
  }

  // _all.html (forced for phet-io)
  if (allHTML || brand === 'phet-io') {
    const initializationScript = getInitializationScript(_.assignIn({
      locale: ChipperConstants.FALLBACK_LOCALE,
      includeAllLocales: true,
      isDebugBuild: false
    }, commonInitializationOptions, {
      allowLocaleSwitching: true
    }));
    const allHTMLFilename = `${buildDir}/${repo}_all_${brand}.html`;
    const allHTMLContents = packageRunnable({
      repo: repo,
      stringMap: stringMap,
      htmlHeader: htmlHeader,
      locale: ChipperConstants.FALLBACK_LOCALE,
      compressScripts: compressScripts,
      licenseScript: licenseScript,
      scripts: [initializationScript, ...productionScripts]
    });
    grunt.file.write(allHTMLFilename, allHTMLContents);

    // Add a compressed file to improve performance in the iOS app, see https://github.com/phetsims/chipper/issues/746
    grunt.file.write(`${allHTMLFilename}.gz`, zlib.gzipSync(allHTMLContents));
  }

  // Debug build (always included)
  const debugInitializationScript = getInitializationScript(_.assignIn({
    locale: ChipperConstants.FALLBACK_LOCALE,
    includeAllLocales: true,
    isDebugBuild: true
  }, commonInitializationOptions, {
    allowLocaleSwitching: true
  }));
  grunt.file.write(`${buildDir}/${repo}_all_${brand}_debug.html`, packageRunnable({
    repo: repo,
    stringMap: stringMap,
    htmlHeader: htmlHeader,
    locale: ChipperConstants.FALLBACK_LOCALE,
    compressScripts: compressScripts,
    licenseScript: licenseScript,
    scripts: [debugInitializationScript, ...debugScripts]
  }));

  // XHTML build (ePub compatibility, etc.)
  const xhtmlDir = `${buildDir}/xhtml`;
  grunt.file.mkdir(xhtmlDir);
  const xhtmlInitializationScript = getInitializationScript(_.assignIn({
    locale: ChipperConstants.FALLBACK_LOCALE,
    includeAllLocales: true,
    isDebugBuild: false
  }, commonInitializationOptions, {
    allowLocaleSwitching: true
  }));
  packageXHTML(xhtmlDir, {
    repo: repo,
    brand: brand,
    stringMap: stringMap,
    htmlHeader: htmlHeader,
    initializationScript: xhtmlInitializationScript,
    licenseScript: licenseScript,
    scripts: productionScripts
  });

  // dependencies.json
  grunt.file.write(`${buildDir}/dependencies.json`, JSON.stringify(dependencies, null, 2));

  // string-map.json and english-string-map.json, for things like Rosetta that need to know what strings are used
  grunt.file.write(`${buildDir}/string-map.json`, JSON.stringify(stringMap, null, 2));
  grunt.file.write(`${buildDir}/english-string-map.json`, JSON.stringify(stringMap.en, null, 2));

  // -iframe.html (English is assumed as the locale).
  if (_.includes(locales, ChipperConstants.FALLBACK_LOCALE) && brand === 'phet') {
    const englishTitle = stringMap[ChipperConstants.FALLBACK_LOCALE][getTitleStringKey(repo)];
    grunt.log.debug('Constructing HTML for iframe testing from template');
    let iframeTestHtml = grunt.file.read('../chipper/templates/sim-iframe.html');
    iframeTestHtml = ChipperStringUtils.replaceFirst(iframeTestHtml, '{{PHET_SIM_TITLE}}', encoder.htmlEncode(`${englishTitle} iframe test`));
    iframeTestHtml = ChipperStringUtils.replaceFirst(iframeTestHtml, '{{PHET_REPOSITORY}}', repo);
    const iframeLocales = ['en'].concat(allHTML ? ['all'] : []);
    iframeLocales.forEach(locale => {
      const iframeHtml = ChipperStringUtils.replaceFirst(iframeTestHtml, '{{PHET_LOCALE}}', locale);
      grunt.file.write(`${buildDir}/${repo}_${locale}_iframe_phet.html`, iframeHtml);
    });
  }

  // If the sim is a11y outfitted, then add the a11y pdom viewer to the build dir. NOTE: Not for phet-io builds.
  if (packageObject.phet.simFeatures && packageObject.phet.simFeatures.supportsInteractiveDescription && brand === 'phet') {
    // (a11y) Create the a11y-view HTML file for PDOM viewing.
    let a11yHTML = getA11yViewHTMLFromTemplate(repo);

    // this replaceAll is outside of the getA11yViewHTMLFromTemplate because we only want it filled in during the build
    a11yHTML = ChipperStringUtils.replaceAll(a11yHTML, '{{IS_BUILT}}', 'true');
    grunt.file.write(`${buildDir}/${repo}${ChipperConstants.A11Y_VIEW_HTML_SUFFIX}`, a11yHTML);
  }

  // copy over supplemental files or dirs to package with the build. Only supported in phet brand
  if (packageObject.phet && packageObject.phet.packageWithBuild) {
    assert(Array.isArray(packageObject.phet.packageWithBuild));
    packageObject.phet.packageWithBuild.forEach(path => {
      assert(typeof path === 'string', 'path should be a string');
      assert(grunt.file.exists(path), `path does not exist: ${path}`);
      if (grunt.file.isDir(path)) {
        copyDirectory(path, `${buildDir}/${path}`);
      } else {
        grunt.file.copy(path, `${buildDir}/${path}`);
      }
    });
  }
  if (brand === 'phet-io') {
    await copySupplementalPhetioFiles(repo, version, englishTitle, packageObject, buildLocal, true);
  }

  // Thumbnails and twitter card
  if (grunt.file.exists(`../${repo}/assets/${repo}-screenshot.png`)) {
    const thumbnailSizes = [{
      width: 128,
      height: 84
    }, {
      width: 600,
      height: 394
    }];
    for (const size of thumbnailSizes) {
      grunt.file.write(`${buildDir}/${repo}-${size.width}.png`, await generateThumbnails(repo, size.width, size.height, 100, jimp.MIME_PNG));
    }
    if (brand === 'phet') {
      grunt.file.write(`${buildDir}/${repo}-ios.png`, await generateThumbnails(repo, 420, 276, 90, jimp.MIME_JPEG));
      grunt.file.write(`${buildDir}/${repo}-twitter-card.png`, await generateTwitterCard(repo));
    }
  }
};

// For profiling file size. Name is optional
const wrapProfileFileSize = (string, profileFileSize, type, name) => {
  if (profileFileSize) {
    const conditionalName = name ? `,"${name}"` : '';
    return `console.log("START_${type.toUpperCase()}"${conditionalName});\n${string}\nconsole.log("END_${type.toUpperCase()}"${conditionalName});\n\n`;
  } else {
    return string;
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsImFzc2VydCIsIkNoaXBwZXJDb25zdGFudHMiLCJDaGlwcGVyU3RyaW5nVXRpbHMiLCJnZXRMaWNlbnNlRW50cnkiLCJjb3B5RGlyZWN0b3J5IiwiY29weVN1cHBsZW1lbnRhbFBoZXRpb0ZpbGVzIiwiZ2VuZXJhdGVUaHVtYm5haWxzIiwiZ2VuZXJhdGVUd2l0dGVyQ2FyZCIsImdldEExMXlWaWV3SFRNTEZyb21UZW1wbGF0ZSIsImdldEFsbFRoaXJkUGFydHlFbnRyaWVzIiwiZ2V0RGVwZW5kZW5jaWVzIiwiZ2V0SW5pdGlhbGl6YXRpb25TY3JpcHQiLCJnZXRMb2NhbGVzRnJvbVJlcG9zaXRvcnkiLCJnZXRQaGV0TGlicyIsImdldFByZWxvYWRzIiwiZ2V0U3RyaW5nTWFwIiwiZ2V0VGl0bGVTdHJpbmdLZXkiLCJncnVudCIsInBhdGgiLCJqaW1wIiwibG9hZEZpbGVBc0RhdGFVUkkiLCJtaW5pZnkiLCJub2RlSFRNTEVuY29kZXIiLCJwYWNrYWdlUnVubmFibGUiLCJwYWNrYWdlWEhUTUwiLCJyZXBvcnRVbnVzZWRNZWRpYSIsInJlcG9ydFVudXNlZFN0cmluZ3MiLCJ3ZWJwYWNrQnVpbGQiLCJ6bGliIiwicGhldFRpbWluZ0xvZyIsInJlY29yZFRpbWUiLCJuYW1lIiwiYXN5bmNDYWxsYmFjayIsInRpbWVDYWxsYmFjayIsImJlZm9yZVRpbWUiLCJEYXRlIiwibm93IiwicmVzdWx0Iiwic3RhcnRBc3luYyIsImFmdGVyVGltZSIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXBvIiwibWluaWZ5T3B0aW9ucyIsImFsbEhUTUwiLCJicmFuZCIsImxvY2FsZXNPcHRpb24iLCJidWlsZExvY2FsIiwiZW5jb2RlU3RyaW5nTWFwIiwiY29tcHJlc3NTY3JpcHRzIiwicHJvZmlsZUZpbGVTaXplIiwiZmlsZSIsImV4aXN0cyIsInBhY2thZ2VPYmplY3QiLCJyZWFkSlNPTiIsImVuY29kZXIiLCJFbmNvZGVyIiwidGltZXN0YW1wIiwidG9JU09TdHJpbmciLCJzcGxpdCIsImpvaW4iLCJzdWJzdHJpbmciLCJpbmRleE9mIiwid2VicGFja1Jlc3VsdCIsInRpbWUiLCJsb2ciLCJvayIsIndlYnBhY2tKUyIsIndyYXBQcm9maWxlRmlsZVNpemUiLCJqcyIsImRlYnVnTWluaWZ5T3B0aW9ucyIsInN0cmlwQXNzZXJ0aW9ucyIsInN0cmlwTG9nZ2luZyIsInVzZWRNb2R1bGVzIiwibGljZW5zZUVudHJpZXMiLCJNRURJQV9UWVBFUyIsImZvckVhY2giLCJtZWRpYVR5cGUiLCJpbmRleCIsImxhc3RJbmRleE9mIiwic2xpY2UiLCJwaGV0TGlicyIsImFsbExvY2FsZXMiLCJGQUxMQkFDS19MT0NBTEUiLCJsb2NhbGVzIiwiZGVwZW5kZW5jaWVzIiwibW9kdWxlRGVwZW5kZW5jeSIsInBhdGhTZXBhcmF0b3JJbmRleCIsInNlcCIsIm1vZHVsZVJlcG8iLCJPYmplY3QiLCJrZXlzIiwiaW5jbHVkZXMiLCJ2ZXJzaW9uIiwidGhpcmRQYXJ0eUVudHJpZXMiLCJzaW1UaXRsZVN0cmluZ0tleSIsInN0cmluZ01hcCIsInN0cmluZ01ldGFkYXRhIiwicGhldCIsInJlcXVpcmVqc05hbWVzcGFjZSIsImxvY2FsZSIsImVuZ2xpc2hUaXRsZSIsImh0bWxIZWFkZXIiLCJ0ZW1wbGF0ZSIsInRvZGF5Iiwic3RhcnR1cFNjcmlwdHMiLCJtaW5pZmlhYmxlU2NyaXB0cyIsIm1hcCIsImZpbGVuYW1lIiwicmVhZCIsInByb2R1Y3Rpb25TY3JpcHRzIiwic2NyaXB0cyIsInN1bSIsImxlbmd0aCIsImRlYnVnU2NyaXB0cyIsImxpY2Vuc2VTY3JpcHQiLCJyZXBsYWNlUGxhY2Vob2xkZXJzIiwiUEhFVF9TVEFSVF9USElSRF9QQVJUWV9MSUNFTlNFX0VOVFJJRVMiLCJTVEFSVF9USElSRF9QQVJUWV9MSUNFTlNFX0VOVFJJRVMiLCJQSEVUX1RISVJEX1BBUlRZX0xJQ0VOU0VfRU5UUklFUyIsIkpTT04iLCJzdHJpbmdpZnkiLCJQSEVUX0VORF9USElSRF9QQVJUWV9MSUNFTlNFX0VOVFJJRVMiLCJFTkRfVEhJUkRfUEFSVFlfTElDRU5TRV9FTlRSSUVTIiwiY29tbW9uSW5pdGlhbGl6YXRpb25PcHRpb25zIiwiYWxsb3dMb2NhbGVTd2l0Y2hpbmciLCJ3cmFwU3RyaW5nc0pTIiwic3RyaW5nc0pTIiwiYnVpbGREaXIiLCJta2RpciIsImluaXRpYWxpemF0aW9uU2NyaXB0IiwiYXNzaWduSW4iLCJpbmNsdWRlQWxsTG9jYWxlcyIsImlzRGVidWdCdWlsZCIsIndyaXRlIiwiYWxsSFRNTEZpbGVuYW1lIiwiYWxsSFRNTENvbnRlbnRzIiwiZ3ppcFN5bmMiLCJkZWJ1Z0luaXRpYWxpemF0aW9uU2NyaXB0IiwieGh0bWxEaXIiLCJ4aHRtbEluaXRpYWxpemF0aW9uU2NyaXB0IiwiZW4iLCJkZWJ1ZyIsImlmcmFtZVRlc3RIdG1sIiwicmVwbGFjZUZpcnN0IiwiaHRtbEVuY29kZSIsImlmcmFtZUxvY2FsZXMiLCJjb25jYXQiLCJpZnJhbWVIdG1sIiwic2ltRmVhdHVyZXMiLCJzdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb24iLCJhMTF5SFRNTCIsInJlcGxhY2VBbGwiLCJBMTFZX1ZJRVdfSFRNTF9TVUZGSVgiLCJwYWNrYWdlV2l0aEJ1aWxkIiwiQXJyYXkiLCJpc0FycmF5IiwiaXNEaXIiLCJjb3B5IiwidGh1bWJuYWlsU2l6ZXMiLCJ3aWR0aCIsImhlaWdodCIsInNpemUiLCJNSU1FX1BORyIsIk1JTUVfSlBFRyIsInN0cmluZyIsInR5cGUiLCJjb25kaXRpb25hbE5hbWUiLCJ0b1VwcGVyQ2FzZSJdLCJzb3VyY2VzIjpbImJ1aWxkUnVubmFibGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQnVpbGRzIGEgcnVubmFibGUgKHNvbWV0aGluZyB0aGF0IGJ1aWxkcyBsaWtlIGEgc2ltdWxhdGlvbilcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcblxyXG4vLyBtb2R1bGVzXHJcbmNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xyXG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCAnYXNzZXJ0JyApO1xyXG5jb25zdCBDaGlwcGVyQ29uc3RhbnRzID0gcmVxdWlyZSggJy4uL2NvbW1vbi9DaGlwcGVyQ29uc3RhbnRzJyApO1xyXG5jb25zdCBDaGlwcGVyU3RyaW5nVXRpbHMgPSByZXF1aXJlKCAnLi4vY29tbW9uL0NoaXBwZXJTdHJpbmdVdGlscycgKTtcclxuY29uc3QgZ2V0TGljZW5zZUVudHJ5ID0gcmVxdWlyZSggJy4uL2NvbW1vbi9nZXRMaWNlbnNlRW50cnknICk7XHJcbmNvbnN0IGNvcHlEaXJlY3RvcnkgPSByZXF1aXJlKCAnLi9jb3B5RGlyZWN0b3J5JyApO1xyXG5jb25zdCBjb3B5U3VwcGxlbWVudGFsUGhldGlvRmlsZXMgPSByZXF1aXJlKCAnLi9jb3B5U3VwcGxlbWVudGFsUGhldGlvRmlsZXMnICk7XHJcbmNvbnN0IGdlbmVyYXRlVGh1bWJuYWlscyA9IHJlcXVpcmUoICcuL2dlbmVyYXRlVGh1bWJuYWlscycgKTtcclxuY29uc3QgZ2VuZXJhdGVUd2l0dGVyQ2FyZCA9IHJlcXVpcmUoICcuL2dlbmVyYXRlVHdpdHRlckNhcmQnICk7XHJcbmNvbnN0IGdldEExMXlWaWV3SFRNTEZyb21UZW1wbGF0ZSA9IHJlcXVpcmUoICcuL2dldEExMXlWaWV3SFRNTEZyb21UZW1wbGF0ZScgKTtcclxuY29uc3QgZ2V0QWxsVGhpcmRQYXJ0eUVudHJpZXMgPSByZXF1aXJlKCAnLi9nZXRBbGxUaGlyZFBhcnR5RW50cmllcycgKTtcclxuY29uc3QgZ2V0RGVwZW5kZW5jaWVzID0gcmVxdWlyZSggJy4vZ2V0RGVwZW5kZW5jaWVzJyApO1xyXG5jb25zdCBnZXRJbml0aWFsaXphdGlvblNjcmlwdCA9IHJlcXVpcmUoICcuL2dldEluaXRpYWxpemF0aW9uU2NyaXB0JyApO1xyXG5jb25zdCBnZXRMb2NhbGVzRnJvbVJlcG9zaXRvcnkgPSByZXF1aXJlKCAnLi9nZXRMb2NhbGVzRnJvbVJlcG9zaXRvcnknICk7XHJcbmNvbnN0IGdldFBoZXRMaWJzID0gcmVxdWlyZSggJy4vZ2V0UGhldExpYnMnICk7XHJcbmNvbnN0IGdldFByZWxvYWRzID0gcmVxdWlyZSggJy4vZ2V0UHJlbG9hZHMnICk7XHJcbmNvbnN0IGdldFN0cmluZ01hcCA9IHJlcXVpcmUoICcuL2dldFN0cmluZ01hcCcgKTtcclxuY29uc3QgZ2V0VGl0bGVTdHJpbmdLZXkgPSByZXF1aXJlKCAnLi9nZXRUaXRsZVN0cmluZ0tleScgKTtcclxuY29uc3QgZ3J1bnQgPSByZXF1aXJlKCAnZ3J1bnQnICk7XHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCAncGF0aCcgKTtcclxuY29uc3QgamltcCA9IHJlcXVpcmUoICdqaW1wJyApO1xyXG5jb25zdCBsb2FkRmlsZUFzRGF0YVVSSSA9IHJlcXVpcmUoICcuLi9jb21tb24vbG9hZEZpbGVBc0RhdGFVUkknICk7XHJcbmNvbnN0IG1pbmlmeSA9IHJlcXVpcmUoICcuL21pbmlmeScgKTtcclxuY29uc3Qgbm9kZUhUTUxFbmNvZGVyID0gcmVxdWlyZSggJ25vZGUtaHRtbC1lbmNvZGVyJyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHJlcXVpcmUtc3RhdGVtZW50LW1hdGNoXHJcbmNvbnN0IHBhY2thZ2VSdW5uYWJsZSA9IHJlcXVpcmUoICcuL3BhY2thZ2VSdW5uYWJsZScgKTtcclxuY29uc3QgcGFja2FnZVhIVE1MID0gcmVxdWlyZSggJy4vcGFja2FnZVhIVE1MJyApO1xyXG5jb25zdCByZXBvcnRVbnVzZWRNZWRpYSA9IHJlcXVpcmUoICcuL3JlcG9ydFVudXNlZE1lZGlhJyApO1xyXG5jb25zdCByZXBvcnRVbnVzZWRTdHJpbmdzID0gcmVxdWlyZSggJy4vcmVwb3J0VW51c2VkU3RyaW5ncycgKTtcclxuY29uc3Qgd2VicGFja0J1aWxkID0gcmVxdWlyZSggJy4vd2VicGFja0J1aWxkJyApO1xyXG5jb25zdCB6bGliID0gcmVxdWlyZSggJ3psaWInICk7XHJcbmNvbnN0IHBoZXRUaW1pbmdMb2cgPSByZXF1aXJlKCAnLi4vLi4vLi4vcGVyZW5uaWFsLWFsaWFzL2pzL2NvbW1vbi9waGV0VGltaW5nTG9nJyApO1xyXG5cclxuY29uc3QgcmVjb3JkVGltZSA9IGFzeW5jICggbmFtZSwgYXN5bmNDYWxsYmFjaywgdGltZUNhbGxiYWNrICkgPT4ge1xyXG4gIGNvbnN0IGJlZm9yZVRpbWUgPSBEYXRlLm5vdygpO1xyXG5cclxuICBjb25zdCByZXN1bHQgPSBhd2FpdCBwaGV0VGltaW5nTG9nLnN0YXJ0QXN5bmMoIG5hbWUsIGFzeW5jICgpID0+IHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGFzeW5jQ2FsbGJhY2soKTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfSApO1xyXG5cclxuICBjb25zdCBhZnRlclRpbWUgPSBEYXRlLm5vdygpO1xyXG4gIHRpbWVDYWxsYmFjayggYWZ0ZXJUaW1lIC0gYmVmb3JlVGltZSwgcmVzdWx0ICk7XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBCdWlsZHMgYSBydW5uYWJsZSAoZS5nLiBhIHNpbXVsYXRpb24pLlxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBtaW5pZnlPcHRpb25zIC0gc2VlIG1pbmlmeS5qc1xyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGFsbEhUTUwgLSBJZiB0aGUgX2FsbC5odG1sIGZpbGUgc2hvdWxkIGJlIGdlbmVyYXRlZFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gYnJhbmRcclxuICogQHBhcmFtIHtzdHJpbmd9IGxvY2FsZXNPcHRpb24gLSBlLmcsLiAnKicsICdlbixlcycsIGV0Yy5cclxuICogQHBhcmFtIHtib29sZWFufSBidWlsZExvY2FsXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gZW5jb2RlU3RyaW5nTWFwXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gY29tcHJlc3NTY3JpcHRzXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gcHJvZmlsZUZpbGVTaXplXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlfSAtIERvZXMgbm90IHJlc29sdmUgYSB2YWx1ZVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiggcmVwbywgbWluaWZ5T3B0aW9ucywgYWxsSFRNTCwgYnJhbmQsIGxvY2FsZXNPcHRpb24sIGJ1aWxkTG9jYWwsIGVuY29kZVN0cmluZ01hcCwgY29tcHJlc3NTY3JpcHRzLCBwcm9maWxlRmlsZVNpemUgKSB7XHJcbiAgYXNzZXJ0KCB0eXBlb2YgcmVwbyA9PT0gJ3N0cmluZycgKTtcclxuICBhc3NlcnQoIHR5cGVvZiBtaW5pZnlPcHRpb25zID09PSAnb2JqZWN0JyApO1xyXG5cclxuICBpZiAoIGJyYW5kID09PSAncGhldC1pbycgKSB7XHJcbiAgICBhc3NlcnQoIGdydW50LmZpbGUuZXhpc3RzKCAnLi4vcGhldC1pbycgKSwgJ0Fib3J0aW5nIHRoZSBidWlsZCBvZiBwaGV0LWlvIGJyYW5kIHNpbmNlIHByb3ByaWV0YXJ5IHJlcG9zaXRvcmllcyBhcmUgbm90IGNoZWNrZWQgb3V0LlxcblBsZWFzZSB1c2UgLS1icmFuZHM9PXt7QlJBTkR9fSBpbiB0aGUgZnV0dXJlIHRvIGF2b2lkIHRoaXMuJyApO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgcGFja2FnZU9iamVjdCA9IGdydW50LmZpbGUucmVhZEpTT04oIGAuLi8ke3JlcG99L3BhY2thZ2UuanNvbmAgKTtcclxuICBjb25zdCBlbmNvZGVyID0gbmV3IG5vZGVIVE1MRW5jb2Rlci5FbmNvZGVyKCAnZW50aXR5JyApO1xyXG5cclxuICAvLyBBbGwgaHRtbCBmaWxlcyBzaGFyZSB0aGUgc2FtZSBidWlsZCB0aW1lc3RhbXBcclxuICBsZXQgdGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KCAnVCcgKS5qb2luKCAnICcgKTtcclxuICB0aW1lc3RhbXAgPSBgJHt0aW1lc3RhbXAuc3Vic3RyaW5nKCAwLCB0aW1lc3RhbXAuaW5kZXhPZiggJy4nICkgKX0gVVRDYDtcclxuXHJcbiAgLy8gU3RhcnQgcnVubmluZyB3ZWJwYWNrXHJcbiAgY29uc3Qgd2VicGFja1Jlc3VsdCA9IGF3YWl0IHJlY29yZFRpbWUoICd3ZWJwYWNrJywgYXN5bmMgKCkgPT4gd2VicGFja0J1aWxkKCByZXBvLCBicmFuZCwge1xyXG4gICAgcHJvZmlsZUZpbGVTaXplOiBwcm9maWxlRmlsZVNpemVcclxuICB9ICksIHRpbWUgPT4ge1xyXG4gICAgZ3J1bnQubG9nLm9rKCBgV2VicGFjayBidWlsZCBjb21wbGV0ZTogJHt0aW1lfW1zYCApO1xyXG4gIH0gKTtcclxuXHJcbiAgLy8gTk9URTogVGhpcyBidWlsZCBjdXJyZW50bHkgKGR1ZSB0byB0aGUgc3RyaW5nL21pcG1hcCBwbHVnaW5zKSBtb2RpZmllcyBnbG9iYWxzLiBTb21lIG9wZXJhdGlvbnMgbmVlZCB0byBiZSBkb25lIGFmdGVyIHRoaXMuXHJcbiAgY29uc3Qgd2VicGFja0pTID0gd3JhcFByb2ZpbGVGaWxlU2l6ZSggYHBoZXQuY2hpcHBlci5ydW5XZWJwYWNrID0gZnVuY3Rpb24oKSB7JHt3ZWJwYWNrUmVzdWx0LmpzfX07YCwgcHJvZmlsZUZpbGVTaXplLCAnV0VCUEFDSycgKTtcclxuXHJcbiAgLy8gRGVidWcgdmVyc2lvbiBpcyBpbmRlcGVuZGVudCBvZiBwYXNzZWQgaW4gbWluaWZ5T3B0aW9ucy4gIFBoRVQtaU8gYnJhbmQgaXMgbWluaWZpZWQsIGJ1dCBsZWF2ZXMgYXNzZXJ0aW9ucyAmIGxvZ2dpbmcuXHJcbiAgY29uc3QgZGVidWdNaW5pZnlPcHRpb25zID0gYnJhbmQgPT09ICdwaGV0LWlvJyA/IHtcclxuICAgIHN0cmlwQXNzZXJ0aW9uczogZmFsc2UsXHJcbiAgICBzdHJpcExvZ2dpbmc6IGZhbHNlXHJcbiAgfSA6IHtcclxuICAgIG1pbmlmeTogZmFsc2VcclxuICB9O1xyXG5cclxuICAvLyBJZiB0dXJuaW5nIG9mZiBtaW5pZmljYXRpb24gZm9yIHRoZSBtYWluIGJ1aWxkLCBkb24ndCBtaW5pZnkgdGhlIGRlYnVnIHZlcnNpb24gYWxzb1xyXG4gIGlmICggbWluaWZ5T3B0aW9ucy5taW5pZnkgPT09IGZhbHNlICkge1xyXG4gICAgZGVidWdNaW5pZnlPcHRpb25zLm1pbmlmeSA9IGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgdXNlZE1vZHVsZXMgPSB3ZWJwYWNrUmVzdWx0LnVzZWRNb2R1bGVzO1xyXG4gIHJlcG9ydFVudXNlZE1lZGlhKCByZXBvLCB1c2VkTW9kdWxlcyApO1xyXG5cclxuICBjb25zdCBsaWNlbnNlRW50cmllcyA9IHt9O1xyXG4gIENoaXBwZXJDb25zdGFudHMuTUVESUFfVFlQRVMuZm9yRWFjaCggbWVkaWFUeXBlID0+IHtcclxuICAgIGxpY2Vuc2VFbnRyaWVzWyBtZWRpYVR5cGUgXSA9IHt9O1xyXG4gIH0gKTtcclxuXHJcbiAgdXNlZE1vZHVsZXMuZm9yRWFjaCggbW9kdWxlID0+IHtcclxuICAgIENoaXBwZXJDb25zdGFudHMuTUVESUFfVFlQRVMuZm9yRWFjaCggbWVkaWFUeXBlID0+IHtcclxuICAgICAgaWYgKCBtb2R1bGUuc3BsaXQoICcvJyApWyAxIF0gPT09IG1lZGlhVHlwZSApIHtcclxuXHJcbiAgICAgICAgLy8gVGhlIGZpbGUgc3VmZml4IGlzIHN0cmlwcGVkIGFuZCByZXN0b3JlZCB0byBpdHMgbm9uLWpzIGV4dGVuc2lvbi4gVGhpcyBpcyBiZWNhdXNlIGdldExpY2Vuc2VFbnRyeSBkb2Vzbid0XHJcbiAgICAgICAgLy8gaGFuZGxlIG1vZHVsaWZpZWQgbWVkaWEgZmlsZXMuXHJcbiAgICAgICAgY29uc3QgaW5kZXggPSBtb2R1bGUubGFzdEluZGV4T2YoICdfJyApO1xyXG4gICAgICAgIGNvbnN0IHBhdGggPSBgJHttb2R1bGUuc2xpY2UoIDAsIGluZGV4ICl9LiR7bW9kdWxlLnNsaWNlKCBpbmRleCArIDEsIC0zICl9YDtcclxuICAgICAgICBsaWNlbnNlRW50cmllc1sgbWVkaWFUeXBlIF1bIG1vZHVsZSBdID0gZ2V0TGljZW5zZUVudHJ5KCBgLi4vJHtwYXRofWAgKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gIH0gKTtcclxuXHJcbiAgY29uc3QgcGhldExpYnMgPSBnZXRQaGV0TGlicyggcmVwbywgYnJhbmQgKTtcclxuICBjb25zdCBhbGxMb2NhbGVzID0gWyBDaGlwcGVyQ29uc3RhbnRzLkZBTExCQUNLX0xPQ0FMRSwgLi4uZ2V0TG9jYWxlc0Zyb21SZXBvc2l0b3J5KCByZXBvICkgXTtcclxuICBjb25zdCBsb2NhbGVzID0gbG9jYWxlc09wdGlvbiA9PT0gJyonID8gYWxsTG9jYWxlcyA6IGxvY2FsZXNPcHRpb24uc3BsaXQoICcsJyApO1xyXG4gIGNvbnN0IGRlcGVuZGVuY2llcyA9IGF3YWl0IGdldERlcGVuZGVuY2llcyggcmVwbyApO1xyXG5cclxuICB3ZWJwYWNrUmVzdWx0LnVzZWRNb2R1bGVzLmZvckVhY2goIG1vZHVsZURlcGVuZGVuY3kgPT4ge1xyXG5cclxuICAgIC8vIFRoZSBmaXJzdCBwYXJ0IG9mIHRoZSBwYXRoIGlzIHRoZSByZXBvLiAgT3IgaWYgbm8gZGlyZWN0b3J5IGlzIHNwZWNpZmllZCwgdGhlIGZpbGUgaXMgaW4gdGhlIHNpbSByZXBvLlxyXG4gICAgY29uc3QgcGF0aFNlcGFyYXRvckluZGV4ID0gbW9kdWxlRGVwZW5kZW5jeS5pbmRleE9mKCBwYXRoLnNlcCApO1xyXG4gICAgY29uc3QgbW9kdWxlUmVwbyA9IHBhdGhTZXBhcmF0b3JJbmRleCA+PSAwID8gbW9kdWxlRGVwZW5kZW5jeS5zbGljZSggMCwgcGF0aFNlcGFyYXRvckluZGV4ICkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgIHJlcG87XHJcbiAgICBhc3NlcnQoIE9iamVjdC5rZXlzKCBkZXBlbmRlbmNpZXMgKS5pbmNsdWRlcyggbW9kdWxlUmVwbyApLCBgcmVwbyAke21vZHVsZVJlcG99IG1pc3NpbmcgZnJvbSBwYWNrYWdlLmpzb24ncyBwaGV0TGlicyBmb3IgJHttb2R1bGVEZXBlbmRlbmN5fWAgKTtcclxuICB9ICk7XHJcblxyXG4gIGNvbnN0IHZlcnNpb24gPSBwYWNrYWdlT2JqZWN0LnZlcnNpb247IC8vIEluY2x1ZGUgdGhlIG9uZS1vZmYgbmFtZSBpbiB0aGUgdmVyc2lvblxyXG4gIGNvbnN0IHRoaXJkUGFydHlFbnRyaWVzID0gZ2V0QWxsVGhpcmRQYXJ0eUVudHJpZXMoIHJlcG8sIGJyYW5kLCBsaWNlbnNlRW50cmllcyApO1xyXG4gIGNvbnN0IHNpbVRpdGxlU3RyaW5nS2V5ID0gZ2V0VGl0bGVTdHJpbmdLZXkoIHJlcG8gKTtcclxuXHJcbiAgY29uc3QgeyBzdHJpbmdNYXAsIHN0cmluZ01ldGFkYXRhIH0gPSBnZXRTdHJpbmdNYXAoIHJlcG8sIGFsbExvY2FsZXMsIHBoZXRMaWJzLCB3ZWJwYWNrUmVzdWx0LnVzZWRNb2R1bGVzICk7XHJcblxyXG4gIC8vIEFmdGVyIG91ciBzdHJpbmcgbWFwIGlzIGNvbnN0cnVjdGVkLCByZXBvcnQgd2hpY2ggb2YgdGhlIHRyYW5zbGF0YWJsZSBzdHJpbmdzIGFyZSB1bnVzZWQuXHJcbiAgcmVwb3J0VW51c2VkU3RyaW5ncyggcmVwbywgcGFja2FnZU9iamVjdC5waGV0LnJlcXVpcmVqc05hbWVzcGFjZSwgc3RyaW5nTWFwWyBDaGlwcGVyQ29uc3RhbnRzLkZBTExCQUNLX0xPQ0FMRSBdICk7XHJcblxyXG4gIC8vIElmIHdlIGhhdmUgTk8gc3RyaW5ncyBmb3IgYSBnaXZlbiBsb2NhbGUgdGhhdCB3ZSB3YW50LCB3ZSdsbCBuZWVkIHRvIGZpbGwgaXQgaW4gd2l0aCBhbGwgRW5nbGlzaCBzdHJpbmdzLCBzZWVcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGVyZW5uaWFsL2lzc3Vlcy84M1xyXG4gIGZvciAoIGNvbnN0IGxvY2FsZSBvZiBsb2NhbGVzICkge1xyXG4gICAgaWYgKCAhc3RyaW5nTWFwWyBsb2NhbGUgXSApIHtcclxuICAgICAgc3RyaW5nTWFwWyBsb2NhbGUgXSA9IHN0cmluZ01hcFsgQ2hpcHBlckNvbnN0YW50cy5GQUxMQkFDS19MT0NBTEUgXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IGVuZ2xpc2hUaXRsZSA9IHN0cmluZ01hcFsgQ2hpcHBlckNvbnN0YW50cy5GQUxMQkFDS19MT0NBTEUgXVsgc2ltVGl0bGVTdHJpbmdLZXkgXTtcclxuICBhc3NlcnQoIGVuZ2xpc2hUaXRsZSwgYG1pc3NpbmcgZW50cnkgZm9yIHNpbSB0aXRsZSwga2V5ID0gJHtzaW1UaXRsZVN0cmluZ0tleX1gICk7XHJcblxyXG4gIC8vIFNlbGVjdCB0aGUgSFRNTCBjb21tZW50IGhlYWRlciBiYXNlZCBvbiB0aGUgYnJhbmQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvMTU2XHJcbiAgbGV0IGh0bWxIZWFkZXI7XHJcbiAgaWYgKCBicmFuZCA9PT0gJ3BoZXQtaW8nICkge1xyXG5cclxuICAgIC8vIExpY2Vuc2UgdGV4dCBwcm92aWRlZCBieSBAa2F0aHktcGhldCBpbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvMTQ4I2lzc3VlY29tbWVudC0xMTI1ODQ3NzNcclxuICAgIGh0bWxIZWFkZXIgPSBgJHtlbmdsaXNoVGl0bGV9ICR7dmVyc2lvbn1cXG5gICtcclxuICAgICAgICAgICAgICAgICBgQ29weXJpZ2h0IDIwMDItJHtncnVudC50ZW1wbGF0ZS50b2RheSggJ3l5eXknICl9LCBSZWdlbnRzIG9mIHRoZSBVbml2ZXJzaXR5IG9mIENvbG9yYWRvXFxuYCArXHJcbiAgICAgICAgICAgICAgICAgJ1BoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxcbicgK1xyXG4gICAgICAgICAgICAgICAgICdcXG4nICtcclxuICAgICAgICAgICAgICAgICAnVGhpcyBJbnRlcm9wZXJhYmxlIFBoRVQgU2ltdWxhdGlvbiBmaWxlIHJlcXVpcmVzIGEgbGljZW5zZS5cXG4nICtcclxuICAgICAgICAgICAgICAgICAnVVNFIFdJVEhPVVQgQSBMSUNFTlNFIEFHUkVFTUVOVCBJUyBTVFJJQ1RMWSBQUk9ISUJJVEVELlxcbicgK1xyXG4gICAgICAgICAgICAgICAgICdDb250YWN0IHBoZXRoZWxwQGNvbG9yYWRvLmVkdSByZWdhcmRpbmcgbGljZW5zaW5nLlxcbicgK1xyXG4gICAgICAgICAgICAgICAgICdodHRwczovL3BoZXQuY29sb3JhZG8uZWR1L2VuL2xpY2Vuc2luZyc7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgaHRtbEhlYWRlciA9IGAke2VuZ2xpc2hUaXRsZX0gJHt2ZXJzaW9ufVxcbmAgK1xyXG4gICAgICAgICAgICAgICAgIGBDb3B5cmlnaHQgMjAwMi0ke2dydW50LnRlbXBsYXRlLnRvZGF5KCAneXl5eScgKX0sIFJlZ2VudHMgb2YgdGhlIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG9cXG5gICtcclxuICAgICAgICAgICAgICAgICAnUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXFxuJyArXHJcbiAgICAgICAgICAgICAgICAgJ1xcbicgK1xyXG4gICAgICAgICAgICAgICAgICdUaGlzIGZpbGUgaXMgbGljZW5zZWQgdW5kZXIgQ3JlYXRpdmUgQ29tbW9ucyBBdHRyaWJ1dGlvbiA0LjBcXG4nICtcclxuICAgICAgICAgICAgICAgICAnRm9yIGFsdGVybmF0ZSBzb3VyY2UgY29kZSBsaWNlbnNpbmcsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXNcXG4nICtcclxuICAgICAgICAgICAgICAgICAnRm9yIGxpY2Vuc2VzIGZvciB0aGlyZC1wYXJ0eSBzb2Z0d2FyZSB1c2VkIGJ5IHRoaXMgc2ltdWxhdGlvbiwgc2VlIGJlbG93XFxuJyArXHJcbiAgICAgICAgICAgICAgICAgJ0ZvciBtb3JlIGluZm9ybWF0aW9uLCBzZWUgaHR0cHM6Ly9waGV0LmNvbG9yYWRvLmVkdS9lbi9saWNlbnNpbmcvaHRtbFxcbicgK1xyXG4gICAgICAgICAgICAgICAgICdcXG4nICtcclxuICAgICAgICAgICAgICAgICAnVGhlIFBoRVQgbmFtZSBhbmQgUGhFVCBsb2dvIGFyZSByZWdpc3RlcmVkIHRyYWRlbWFya3Mgb2YgVGhlIFJlZ2VudHMgb2YgdGhlXFxuJyArXHJcbiAgICAgICAgICAgICAgICAgJ1VuaXZlcnNpdHkgb2YgQ29sb3JhZG8uIFBlcm1pc3Npb24gaXMgZ3JhbnRlZCB0byB1c2UgdGhlIFBoRVQgbmFtZSBhbmQgUGhFVCBsb2dvXFxuJyArXHJcbiAgICAgICAgICAgICAgICAgJ29ubHkgZm9yIGF0dHJpYnV0aW9uIHB1cnBvc2VzLiBVc2Ugb2YgdGhlIFBoRVQgbmFtZSBhbmQvb3IgUGhFVCBsb2dvIGZvciBwcm9tb3Rpb25hbCxcXG4nICtcclxuICAgICAgICAgICAgICAgICAnbWFya2V0aW5nLCBvciBhZHZlcnRpc2luZyBwdXJwb3NlcyByZXF1aXJlcyBhIHNlcGFyYXRlIGxpY2Vuc2UgYWdyZWVtZW50IGZyb20gdGhlXFxuJyArXHJcbiAgICAgICAgICAgICAgICAgJ1VuaXZlcnNpdHkgb2YgQ29sb3JhZG8uIENvbnRhY3QgcGhldGhlbHBAY29sb3JhZG8uZWR1IHJlZ2FyZGluZyBsaWNlbnNpbmcuJztcclxuICB9XHJcblxyXG4gIC8vIFNjcmlwdHMgdGhhdCBhcmUgcnVuIGJlZm9yZSBvdXIgbWFpbiBtaW5pZmlhYmxlIGNvbnRlbnRcclxuICBjb25zdCBzdGFydHVwU2NyaXB0cyA9IFtcclxuICAgIC8vIFNwbGFzaCBpbWFnZVxyXG4gICAgd3JhcFByb2ZpbGVGaWxlU2l6ZSggYHdpbmRvdy5QSEVUX1NQTEFTSF9EQVRBX1VSST1cIiR7bG9hZEZpbGVBc0RhdGFVUkkoIGAuLi9icmFuZC8ke2JyYW5kfS9pbWFnZXMvc3BsYXNoLnN2Z2AgKX1cIjtgLCBwcm9maWxlRmlsZVNpemUsICdTUExBU0gnIClcclxuICBdO1xyXG5cclxuICBjb25zdCBtaW5pZmlhYmxlU2NyaXB0cyA9IFtcclxuICAgIC8vIFByZWxvYWRzXHJcbiAgICAuLi5nZXRQcmVsb2FkcyggcmVwbywgYnJhbmQsIHRydWUgKS5tYXAoIGZpbGVuYW1lID0+IHdyYXBQcm9maWxlRmlsZVNpemUoIGdydW50LmZpbGUucmVhZCggZmlsZW5hbWUgKSwgcHJvZmlsZUZpbGVTaXplLCAnUFJFTE9BRCcsIGZpbGVuYW1lICkgKSxcclxuXHJcbiAgICAvLyBPdXIgbWFpbiBtb2R1bGUgY29udGVudCwgd3JhcHBlZCBpbiBhIGZ1bmN0aW9uIGNhbGxlZCBpbiB0aGUgc3RhcnR1cCBiZWxvd1xyXG4gICAgd2VicGFja0pTLFxyXG5cclxuICAgIC8vIE1haW4gc3RhcnR1cFxyXG4gICAgd3JhcFByb2ZpbGVGaWxlU2l6ZSggZ3J1bnQuZmlsZS5yZWFkKCAnLi4vY2hpcHBlci90ZW1wbGF0ZXMvY2hpcHBlci1zdGFydHVwLmpzJyApLCBwcm9maWxlRmlsZVNpemUsICdTVEFSVFVQJyApXHJcbiAgXTtcclxuXHJcbiAgY29uc3QgcHJvZHVjdGlvblNjcmlwdHMgPSBhd2FpdCByZWNvcmRUaW1lKCAnbWluaWZ5LXByb2R1Y3Rpb24nLCBhc3luYyAoKSA9PiB7XHJcbiAgICByZXR1cm4gW1xyXG4gICAgICAuLi5zdGFydHVwU2NyaXB0cyxcclxuICAgICAgLi4ubWluaWZpYWJsZVNjcmlwdHMubWFwKCBqcyA9PiBtaW5pZnkoIGpzLCBtaW5pZnlPcHRpb25zICkgKVxyXG4gICAgXTtcclxuICB9LCAoIHRpbWUsIHNjcmlwdHMgKSA9PiB7XHJcbiAgICBncnVudC5sb2cub2soIGBQcm9kdWN0aW9uIG1pbmlmaWNhdGlvbiBjb21wbGV0ZTogJHt0aW1lfW1zICgke18uc3VtKCBzY3JpcHRzLm1hcCgganMgPT4ganMubGVuZ3RoICkgKX0gYnl0ZXMpYCApO1xyXG4gIH0gKTtcclxuICBjb25zdCBkZWJ1Z1NjcmlwdHMgPSBhd2FpdCByZWNvcmRUaW1lKCAnbWluaWZ5LWRlYnVnJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgLi4uc3RhcnR1cFNjcmlwdHMsXHJcbiAgICAgIC4uLm1pbmlmaWFibGVTY3JpcHRzLm1hcCgganMgPT4gbWluaWZ5KCBqcywgZGVidWdNaW5pZnlPcHRpb25zICkgKVxyXG4gICAgXTtcclxuICB9LCAoIHRpbWUsIHNjcmlwdHMgKSA9PiB7XHJcbiAgICBncnVudC5sb2cub2soIGBEZWJ1ZyBtaW5pZmljYXRpb24gY29tcGxldGU6ICR7dGltZX1tcyAoJHtfLnN1bSggc2NyaXB0cy5tYXAoIGpzID0+IGpzLmxlbmd0aCApICl9IGJ5dGVzKWAgKTtcclxuICB9ICk7XHJcblxyXG4gIGNvbnN0IGxpY2Vuc2VTY3JpcHQgPSB3cmFwUHJvZmlsZUZpbGVTaXplKCBDaGlwcGVyU3RyaW5nVXRpbHMucmVwbGFjZVBsYWNlaG9sZGVycyggZ3J1bnQuZmlsZS5yZWFkKCAnLi4vY2hpcHBlci90ZW1wbGF0ZXMvbGljZW5zZS1pbml0aWFsaXphdGlvbi5qcycgKSwge1xyXG4gICAgUEhFVF9TVEFSVF9USElSRF9QQVJUWV9MSUNFTlNFX0VOVFJJRVM6IENoaXBwZXJDb25zdGFudHMuU1RBUlRfVEhJUkRfUEFSVFlfTElDRU5TRV9FTlRSSUVTLFxyXG4gICAgUEhFVF9USElSRF9QQVJUWV9MSUNFTlNFX0VOVFJJRVM6IEpTT04uc3RyaW5naWZ5KCB0aGlyZFBhcnR5RW50cmllcywgbnVsbCwgMiApLFxyXG4gICAgUEhFVF9FTkRfVEhJUkRfUEFSVFlfTElDRU5TRV9FTlRSSUVTOiBDaGlwcGVyQ29uc3RhbnRzLkVORF9USElSRF9QQVJUWV9MSUNFTlNFX0VOVFJJRVNcclxuICB9ICksIHByb2ZpbGVGaWxlU2l6ZSwgJ0xJQ0VOU0UnICk7XHJcblxyXG4gIGNvbnN0IGNvbW1vbkluaXRpYWxpemF0aW9uT3B0aW9ucyA9IHtcclxuICAgIGJyYW5kOiBicmFuZCxcclxuICAgIHJlcG86IHJlcG8sXHJcbiAgICBhbGxMb2NhbGVzOiBhbGxMb2NhbGVzLFxyXG4gICAgc3RyaW5nTWFwOiBzdHJpbmdNYXAsXHJcbiAgICBzdHJpbmdNZXRhZGF0YTogc3RyaW5nTWV0YWRhdGEsXHJcbiAgICBkZXBlbmRlbmNpZXM6IGRlcGVuZGVuY2llcyxcclxuICAgIHRpbWVzdGFtcDogdGltZXN0YW1wLFxyXG4gICAgdmVyc2lvbjogdmVyc2lvbixcclxuICAgIHBhY2thZ2VPYmplY3Q6IHBhY2thZ2VPYmplY3QsXHJcbiAgICBhbGxvd0xvY2FsZVN3aXRjaGluZzogZmFsc2UsXHJcbiAgICBlbmNvZGVTdHJpbmdNYXA6IGVuY29kZVN0cmluZ01hcCxcclxuICAgIHByb2ZpbGVGaWxlU2l6ZTogcHJvZmlsZUZpbGVTaXplLFxyXG4gICAgd3JhcFN0cmluZ3NKUzogc3RyaW5nc0pTID0+IHdyYXBQcm9maWxlRmlsZVNpemUoIHN0cmluZ3NKUywgcHJvZmlsZUZpbGVTaXplLCAnU1RSSU5HUycgKVxyXG4gIH07XHJcblxyXG4gIC8vIENyZWF0ZSB0aGUgYnVpbGQtc3BlY2lmaWMgZGlyZWN0b3J5XHJcbiAgY29uc3QgYnVpbGREaXIgPSBgLi4vJHtyZXBvfS9idWlsZC8ke2JyYW5kfWA7XHJcbiAgZ3J1bnQuZmlsZS5ta2RpciggYnVpbGREaXIgKTtcclxuXHJcbiAgLy8ge3tsb2NhbGV9fS5odG1sXHJcbiAgaWYgKCBicmFuZCAhPT0gJ3BoZXQtaW8nICkge1xyXG4gICAgZm9yICggY29uc3QgbG9jYWxlIG9mIGxvY2FsZXMgKSB7XHJcbiAgICAgIGNvbnN0IGluaXRpYWxpemF0aW9uU2NyaXB0ID0gZ2V0SW5pdGlhbGl6YXRpb25TY3JpcHQoIF8uYXNzaWduSW4oIHtcclxuICAgICAgICBsb2NhbGU6IGxvY2FsZSxcclxuICAgICAgICBpbmNsdWRlQWxsTG9jYWxlczogZmFsc2UsXHJcbiAgICAgICAgaXNEZWJ1Z0J1aWxkOiBmYWxzZVxyXG4gICAgICB9LCBjb21tb25Jbml0aWFsaXphdGlvbk9wdGlvbnMgKSApO1xyXG5cclxuICAgICAgZ3J1bnQuZmlsZS53cml0ZSggYCR7YnVpbGREaXJ9LyR7cmVwb31fJHtsb2NhbGV9XyR7YnJhbmR9Lmh0bWxgLCBwYWNrYWdlUnVubmFibGUoIHtcclxuICAgICAgICByZXBvOiByZXBvLFxyXG4gICAgICAgIHN0cmluZ01hcDogc3RyaW5nTWFwLFxyXG4gICAgICAgIGh0bWxIZWFkZXI6IGh0bWxIZWFkZXIsXHJcbiAgICAgICAgbG9jYWxlOiBsb2NhbGUsXHJcbiAgICAgICAgY29tcHJlc3NTY3JpcHRzOiBjb21wcmVzc1NjcmlwdHMsXHJcbiAgICAgICAgbGljZW5zZVNjcmlwdDogbGljZW5zZVNjcmlwdCxcclxuICAgICAgICBzY3JpcHRzOiBbIGluaXRpYWxpemF0aW9uU2NyaXB0LCAuLi5wcm9kdWN0aW9uU2NyaXB0cyBdXHJcbiAgICAgIH0gKSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gX2FsbC5odG1sIChmb3JjZWQgZm9yIHBoZXQtaW8pXHJcbiAgaWYgKCBhbGxIVE1MIHx8IGJyYW5kID09PSAncGhldC1pbycgKSB7XHJcbiAgICBjb25zdCBpbml0aWFsaXphdGlvblNjcmlwdCA9IGdldEluaXRpYWxpemF0aW9uU2NyaXB0KCBfLmFzc2lnbkluKCB7XHJcbiAgICAgIGxvY2FsZTogQ2hpcHBlckNvbnN0YW50cy5GQUxMQkFDS19MT0NBTEUsXHJcbiAgICAgIGluY2x1ZGVBbGxMb2NhbGVzOiB0cnVlLFxyXG4gICAgICBpc0RlYnVnQnVpbGQ6IGZhbHNlXHJcbiAgICB9LCBjb21tb25Jbml0aWFsaXphdGlvbk9wdGlvbnMsIHtcclxuICAgICAgYWxsb3dMb2NhbGVTd2l0Y2hpbmc6IHRydWVcclxuICAgIH0gKSApO1xyXG5cclxuICAgIGNvbnN0IGFsbEhUTUxGaWxlbmFtZSA9IGAke2J1aWxkRGlyfS8ke3JlcG99X2FsbF8ke2JyYW5kfS5odG1sYDtcclxuICAgIGNvbnN0IGFsbEhUTUxDb250ZW50cyA9IHBhY2thZ2VSdW5uYWJsZSgge1xyXG4gICAgICByZXBvOiByZXBvLFxyXG4gICAgICBzdHJpbmdNYXA6IHN0cmluZ01hcCxcclxuICAgICAgaHRtbEhlYWRlcjogaHRtbEhlYWRlcixcclxuICAgICAgbG9jYWxlOiBDaGlwcGVyQ29uc3RhbnRzLkZBTExCQUNLX0xPQ0FMRSxcclxuICAgICAgY29tcHJlc3NTY3JpcHRzOiBjb21wcmVzc1NjcmlwdHMsXHJcbiAgICAgIGxpY2Vuc2VTY3JpcHQ6IGxpY2Vuc2VTY3JpcHQsXHJcbiAgICAgIHNjcmlwdHM6IFsgaW5pdGlhbGl6YXRpb25TY3JpcHQsIC4uLnByb2R1Y3Rpb25TY3JpcHRzIF1cclxuICAgIH0gKTtcclxuXHJcbiAgICBncnVudC5maWxlLndyaXRlKCBhbGxIVE1MRmlsZW5hbWUsIGFsbEhUTUxDb250ZW50cyApO1xyXG5cclxuICAgIC8vIEFkZCBhIGNvbXByZXNzZWQgZmlsZSB0byBpbXByb3ZlIHBlcmZvcm1hbmNlIGluIHRoZSBpT1MgYXBwLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzc0NlxyXG4gICAgZ3J1bnQuZmlsZS53cml0ZSggYCR7YWxsSFRNTEZpbGVuYW1lfS5nemAsIHpsaWIuZ3ppcFN5bmMoIGFsbEhUTUxDb250ZW50cyApICk7XHJcbiAgfVxyXG5cclxuICAvLyBEZWJ1ZyBidWlsZCAoYWx3YXlzIGluY2x1ZGVkKVxyXG4gIGNvbnN0IGRlYnVnSW5pdGlhbGl6YXRpb25TY3JpcHQgPSBnZXRJbml0aWFsaXphdGlvblNjcmlwdCggXy5hc3NpZ25Jbigge1xyXG4gICAgbG9jYWxlOiBDaGlwcGVyQ29uc3RhbnRzLkZBTExCQUNLX0xPQ0FMRSxcclxuICAgIGluY2x1ZGVBbGxMb2NhbGVzOiB0cnVlLFxyXG4gICAgaXNEZWJ1Z0J1aWxkOiB0cnVlXHJcbiAgfSwgY29tbW9uSW5pdGlhbGl6YXRpb25PcHRpb25zLCB7XHJcbiAgICBhbGxvd0xvY2FsZVN3aXRjaGluZzogdHJ1ZVxyXG4gIH0gKSApO1xyXG5cclxuICBncnVudC5maWxlLndyaXRlKCBgJHtidWlsZERpcn0vJHtyZXBvfV9hbGxfJHticmFuZH1fZGVidWcuaHRtbGAsIHBhY2thZ2VSdW5uYWJsZSgge1xyXG4gICAgcmVwbzogcmVwbyxcclxuICAgIHN0cmluZ01hcDogc3RyaW5nTWFwLFxyXG4gICAgaHRtbEhlYWRlcjogaHRtbEhlYWRlcixcclxuICAgIGxvY2FsZTogQ2hpcHBlckNvbnN0YW50cy5GQUxMQkFDS19MT0NBTEUsXHJcbiAgICBjb21wcmVzc1NjcmlwdHM6IGNvbXByZXNzU2NyaXB0cyxcclxuICAgIGxpY2Vuc2VTY3JpcHQ6IGxpY2Vuc2VTY3JpcHQsXHJcbiAgICBzY3JpcHRzOiBbIGRlYnVnSW5pdGlhbGl6YXRpb25TY3JpcHQsIC4uLmRlYnVnU2NyaXB0cyBdXHJcbiAgfSApICk7XHJcblxyXG4gIC8vIFhIVE1MIGJ1aWxkIChlUHViIGNvbXBhdGliaWxpdHksIGV0Yy4pXHJcbiAgY29uc3QgeGh0bWxEaXIgPSBgJHtidWlsZERpcn0veGh0bWxgO1xyXG4gIGdydW50LmZpbGUubWtkaXIoIHhodG1sRGlyICk7XHJcbiAgY29uc3QgeGh0bWxJbml0aWFsaXphdGlvblNjcmlwdCA9IGdldEluaXRpYWxpemF0aW9uU2NyaXB0KCBfLmFzc2lnbkluKCB7XHJcbiAgICBsb2NhbGU6IENoaXBwZXJDb25zdGFudHMuRkFMTEJBQ0tfTE9DQUxFLFxyXG4gICAgaW5jbHVkZUFsbExvY2FsZXM6IHRydWUsXHJcbiAgICBpc0RlYnVnQnVpbGQ6IGZhbHNlXHJcbiAgfSwgY29tbW9uSW5pdGlhbGl6YXRpb25PcHRpb25zLCB7XHJcbiAgICBhbGxvd0xvY2FsZVN3aXRjaGluZzogdHJ1ZVxyXG4gIH0gKSApO1xyXG5cclxuICBwYWNrYWdlWEhUTUwoIHhodG1sRGlyLCB7XHJcbiAgICByZXBvOiByZXBvLFxyXG4gICAgYnJhbmQ6IGJyYW5kLFxyXG4gICAgc3RyaW5nTWFwOiBzdHJpbmdNYXAsXHJcbiAgICBodG1sSGVhZGVyOiBodG1sSGVhZGVyLFxyXG4gICAgaW5pdGlhbGl6YXRpb25TY3JpcHQ6IHhodG1sSW5pdGlhbGl6YXRpb25TY3JpcHQsXHJcbiAgICBsaWNlbnNlU2NyaXB0OiBsaWNlbnNlU2NyaXB0LFxyXG4gICAgc2NyaXB0czogcHJvZHVjdGlvblNjcmlwdHNcclxuICB9ICk7XHJcblxyXG4gIC8vIGRlcGVuZGVuY2llcy5qc29uXHJcbiAgZ3J1bnQuZmlsZS53cml0ZSggYCR7YnVpbGREaXJ9L2RlcGVuZGVuY2llcy5qc29uYCwgSlNPTi5zdHJpbmdpZnkoIGRlcGVuZGVuY2llcywgbnVsbCwgMiApICk7XHJcblxyXG4gIC8vIHN0cmluZy1tYXAuanNvbiBhbmQgZW5nbGlzaC1zdHJpbmctbWFwLmpzb24sIGZvciB0aGluZ3MgbGlrZSBSb3NldHRhIHRoYXQgbmVlZCB0byBrbm93IHdoYXQgc3RyaW5ncyBhcmUgdXNlZFxyXG4gIGdydW50LmZpbGUud3JpdGUoIGAke2J1aWxkRGlyfS9zdHJpbmctbWFwLmpzb25gLCBKU09OLnN0cmluZ2lmeSggc3RyaW5nTWFwLCBudWxsLCAyICkgKTtcclxuICBncnVudC5maWxlLndyaXRlKCBgJHtidWlsZERpcn0vZW5nbGlzaC1zdHJpbmctbWFwLmpzb25gLCBKU09OLnN0cmluZ2lmeSggc3RyaW5nTWFwLmVuLCBudWxsLCAyICkgKTtcclxuXHJcbiAgLy8gLWlmcmFtZS5odG1sIChFbmdsaXNoIGlzIGFzc3VtZWQgYXMgdGhlIGxvY2FsZSkuXHJcbiAgaWYgKCBfLmluY2x1ZGVzKCBsb2NhbGVzLCBDaGlwcGVyQ29uc3RhbnRzLkZBTExCQUNLX0xPQ0FMRSApICYmIGJyYW5kID09PSAncGhldCcgKSB7XHJcbiAgICBjb25zdCBlbmdsaXNoVGl0bGUgPSBzdHJpbmdNYXBbIENoaXBwZXJDb25zdGFudHMuRkFMTEJBQ0tfTE9DQUxFIF1bIGdldFRpdGxlU3RyaW5nS2V5KCByZXBvICkgXTtcclxuXHJcbiAgICBncnVudC5sb2cuZGVidWcoICdDb25zdHJ1Y3RpbmcgSFRNTCBmb3IgaWZyYW1lIHRlc3RpbmcgZnJvbSB0ZW1wbGF0ZScgKTtcclxuICAgIGxldCBpZnJhbWVUZXN0SHRtbCA9IGdydW50LmZpbGUucmVhZCggJy4uL2NoaXBwZXIvdGVtcGxhdGVzL3NpbS1pZnJhbWUuaHRtbCcgKTtcclxuICAgIGlmcmFtZVRlc3RIdG1sID0gQ2hpcHBlclN0cmluZ1V0aWxzLnJlcGxhY2VGaXJzdCggaWZyYW1lVGVzdEh0bWwsICd7e1BIRVRfU0lNX1RJVExFfX0nLCBlbmNvZGVyLmh0bWxFbmNvZGUoIGAke2VuZ2xpc2hUaXRsZX0gaWZyYW1lIHRlc3RgICkgKTtcclxuICAgIGlmcmFtZVRlc3RIdG1sID0gQ2hpcHBlclN0cmluZ1V0aWxzLnJlcGxhY2VGaXJzdCggaWZyYW1lVGVzdEh0bWwsICd7e1BIRVRfUkVQT1NJVE9SWX19JywgcmVwbyApO1xyXG5cclxuICAgIGNvbnN0IGlmcmFtZUxvY2FsZXMgPSBbICdlbicgXS5jb25jYXQoIGFsbEhUTUwgPyBbICdhbGwnIF0gOiBbXSApO1xyXG4gICAgaWZyYW1lTG9jYWxlcy5mb3JFYWNoKCBsb2NhbGUgPT4ge1xyXG4gICAgICBjb25zdCBpZnJhbWVIdG1sID0gQ2hpcHBlclN0cmluZ1V0aWxzLnJlcGxhY2VGaXJzdCggaWZyYW1lVGVzdEh0bWwsICd7e1BIRVRfTE9DQUxFfX0nLCBsb2NhbGUgKTtcclxuICAgICAgZ3J1bnQuZmlsZS53cml0ZSggYCR7YnVpbGREaXJ9LyR7cmVwb31fJHtsb2NhbGV9X2lmcmFtZV9waGV0Lmh0bWxgLCBpZnJhbWVIdG1sICk7XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICAvLyBJZiB0aGUgc2ltIGlzIGExMXkgb3V0Zml0dGVkLCB0aGVuIGFkZCB0aGUgYTExeSBwZG9tIHZpZXdlciB0byB0aGUgYnVpbGQgZGlyLiBOT1RFOiBOb3QgZm9yIHBoZXQtaW8gYnVpbGRzLlxyXG4gIGlmICggcGFja2FnZU9iamVjdC5waGV0LnNpbUZlYXR1cmVzICYmIHBhY2thZ2VPYmplY3QucGhldC5zaW1GZWF0dXJlcy5zdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb24gJiYgYnJhbmQgPT09ICdwaGV0JyApIHtcclxuICAgIC8vIChhMTF5KSBDcmVhdGUgdGhlIGExMXktdmlldyBIVE1MIGZpbGUgZm9yIFBET00gdmlld2luZy5cclxuICAgIGxldCBhMTF5SFRNTCA9IGdldEExMXlWaWV3SFRNTEZyb21UZW1wbGF0ZSggcmVwbyApO1xyXG5cclxuICAgIC8vIHRoaXMgcmVwbGFjZUFsbCBpcyBvdXRzaWRlIG9mIHRoZSBnZXRBMTF5Vmlld0hUTUxGcm9tVGVtcGxhdGUgYmVjYXVzZSB3ZSBvbmx5IHdhbnQgaXQgZmlsbGVkIGluIGR1cmluZyB0aGUgYnVpbGRcclxuICAgIGExMXlIVE1MID0gQ2hpcHBlclN0cmluZ1V0aWxzLnJlcGxhY2VBbGwoIGExMXlIVE1MLCAne3tJU19CVUlMVH19JywgJ3RydWUnICk7XHJcblxyXG4gICAgZ3J1bnQuZmlsZS53cml0ZSggYCR7YnVpbGREaXJ9LyR7cmVwb30ke0NoaXBwZXJDb25zdGFudHMuQTExWV9WSUVXX0hUTUxfU1VGRklYfWAsIGExMXlIVE1MICk7XHJcbiAgfVxyXG5cclxuICAvLyBjb3B5IG92ZXIgc3VwcGxlbWVudGFsIGZpbGVzIG9yIGRpcnMgdG8gcGFja2FnZSB3aXRoIHRoZSBidWlsZC4gT25seSBzdXBwb3J0ZWQgaW4gcGhldCBicmFuZFxyXG4gIGlmICggcGFja2FnZU9iamVjdC5waGV0ICYmIHBhY2thZ2VPYmplY3QucGhldC5wYWNrYWdlV2l0aEJ1aWxkICkge1xyXG5cclxuICAgIGFzc2VydCggQXJyYXkuaXNBcnJheSggcGFja2FnZU9iamVjdC5waGV0LnBhY2thZ2VXaXRoQnVpbGQgKSApO1xyXG4gICAgcGFja2FnZU9iamVjdC5waGV0LnBhY2thZ2VXaXRoQnVpbGQuZm9yRWFjaCggcGF0aCA9PiB7XHJcblxyXG4gICAgICBhc3NlcnQoIHR5cGVvZiBwYXRoID09PSAnc3RyaW5nJywgJ3BhdGggc2hvdWxkIGJlIGEgc3RyaW5nJyApO1xyXG4gICAgICBhc3NlcnQoIGdydW50LmZpbGUuZXhpc3RzKCBwYXRoICksIGBwYXRoIGRvZXMgbm90IGV4aXN0OiAke3BhdGh9YCApO1xyXG4gICAgICBpZiAoIGdydW50LmZpbGUuaXNEaXIoIHBhdGggKSApIHtcclxuICAgICAgICBjb3B5RGlyZWN0b3J5KCBwYXRoLCBgJHtidWlsZERpcn0vJHtwYXRofWAgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBncnVudC5maWxlLmNvcHkoIHBhdGgsIGAke2J1aWxkRGlyfS8ke3BhdGh9YCApO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICBpZiAoIGJyYW5kID09PSAncGhldC1pbycgKSB7XHJcbiAgICBhd2FpdCBjb3B5U3VwcGxlbWVudGFsUGhldGlvRmlsZXMoIHJlcG8sIHZlcnNpb24sIGVuZ2xpc2hUaXRsZSwgcGFja2FnZU9iamVjdCwgYnVpbGRMb2NhbCwgdHJ1ZSApO1xyXG4gIH1cclxuXHJcbiAgLy8gVGh1bWJuYWlscyBhbmQgdHdpdHRlciBjYXJkXHJcbiAgaWYgKCBncnVudC5maWxlLmV4aXN0cyggYC4uLyR7cmVwb30vYXNzZXRzLyR7cmVwb30tc2NyZWVuc2hvdC5wbmdgICkgKSB7XHJcbiAgICBjb25zdCB0aHVtYm5haWxTaXplcyA9IFtcclxuICAgICAgeyB3aWR0aDogMTI4LCBoZWlnaHQ6IDg0IH0sXHJcbiAgICAgIHsgd2lkdGg6IDYwMCwgaGVpZ2h0OiAzOTQgfVxyXG4gICAgXTtcclxuICAgIGZvciAoIGNvbnN0IHNpemUgb2YgdGh1bWJuYWlsU2l6ZXMgKSB7XHJcbiAgICAgIGdydW50LmZpbGUud3JpdGUoIGAke2J1aWxkRGlyfS8ke3JlcG99LSR7c2l6ZS53aWR0aH0ucG5nYCwgYXdhaXQgZ2VuZXJhdGVUaHVtYm5haWxzKCByZXBvLCBzaXplLndpZHRoLCBzaXplLmhlaWdodCwgMTAwLCBqaW1wLk1JTUVfUE5HICkgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIGJyYW5kID09PSAncGhldCcgKSB7XHJcbiAgICAgIGdydW50LmZpbGUud3JpdGUoIGAke2J1aWxkRGlyfS8ke3JlcG99LWlvcy5wbmdgLCBhd2FpdCBnZW5lcmF0ZVRodW1ibmFpbHMoIHJlcG8sIDQyMCwgMjc2LCA5MCwgamltcC5NSU1FX0pQRUcgKSApO1xyXG4gICAgICBncnVudC5maWxlLndyaXRlKCBgJHtidWlsZERpcn0vJHtyZXBvfS10d2l0dGVyLWNhcmQucG5nYCwgYXdhaXQgZ2VuZXJhdGVUd2l0dGVyQ2FyZCggcmVwbyApICk7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gRm9yIHByb2ZpbGluZyBmaWxlIHNpemUuIE5hbWUgaXMgb3B0aW9uYWxcclxuY29uc3Qgd3JhcFByb2ZpbGVGaWxlU2l6ZSA9ICggc3RyaW5nLCBwcm9maWxlRmlsZVNpemUsIHR5cGUsIG5hbWUgKSA9PiB7XHJcbiAgaWYgKCBwcm9maWxlRmlsZVNpemUgKSB7XHJcbiAgICBjb25zdCBjb25kaXRpb25hbE5hbWUgPSBuYW1lID8gYCxcIiR7bmFtZX1cImAgOiAnJztcclxuICAgIHJldHVybiBgY29uc29sZS5sb2coXCJTVEFSVF8ke3R5cGUudG9VcHBlckNhc2UoKX1cIiR7Y29uZGl0aW9uYWxOYW1lfSk7XFxuJHtzdHJpbmd9XFxuY29uc29sZS5sb2coXCJFTkRfJHt0eXBlLnRvVXBwZXJDYXNlKCl9XCIke2NvbmRpdGlvbmFsTmFtZX0pO1xcblxcbmA7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgcmV0dXJuIHN0cmluZztcclxuICB9XHJcbn07Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUdBO0FBQ0EsTUFBTUEsQ0FBQyxHQUFHQyxPQUFPLENBQUUsUUFBUyxDQUFDO0FBQzdCLE1BQU1DLE1BQU0sR0FBR0QsT0FBTyxDQUFFLFFBQVMsQ0FBQztBQUNsQyxNQUFNRSxnQkFBZ0IsR0FBR0YsT0FBTyxDQUFFLDRCQUE2QixDQUFDO0FBQ2hFLE1BQU1HLGtCQUFrQixHQUFH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