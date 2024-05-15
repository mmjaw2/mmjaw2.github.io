// Copyright 2015-2024, University of Colorado Boulder

/**
 * Returns a map such that map["locale"]["REPO/stringKey"] will be the string value (with fallbacks to English where needed).
 * Loads each string file only once, and only loads the repository/locale combinations necessary.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const _ = require('lodash');
const assert = require('assert');
const ChipperConstants = require('../common/ChipperConstants');
const pascalCase = require('../common/pascalCase');
const ChipperStringUtils = require('../common/ChipperStringUtils');
const fs = require('fs');
const grunt = require('grunt');
const path = require('path');
const localeData = JSON.parse(fs.readFileSync('../babel/localeData.json', 'utf8'));

/**
 * For a given locale, return an array of specific locales that we'll use as fallbacks, e.g.
 * 'ar_AE' => [ 'ar_AE', 'ar', 'ar_MA', 'en' ]   (note, changed from zh_CN example, which does NOT use 'zh' as a fallback anymore)
 * 'es' => [ 'es', 'en' ]
 * 'en' => [ 'en' ]
 *
 * @param {string} locale
 * @returns {Array.<string>}
 */
const localeFallbacks = locale => {
  return [...(locale !== ChipperConstants.FALLBACK_LOCALE ? [locale] : []), ...(localeData[locale].fallbackLocales || []), ChipperConstants.FALLBACK_LOCALE // e.g. 'en'
  ];
};

/**
 * Load all the required string files into memory, so we don't load them multiple times (for each usage).
 *
 * @param {Array.<string>} reposWithUsedStrings - All of the repos that have 1+ used strings
 * @param {Array.<string>} locales - All supported locales for this build
 * @returns {Object} - maps {locale:string} => Another map with: {stringKey:string} => {stringValue:string}
 */
const getStringFilesContents = (reposWithUsedStrings, locales) => {
  const stringFilesContents = {}; // maps [repositoryName][locale] => contents of locale string file

  reposWithUsedStrings.forEach(repo => {
    stringFilesContents[repo] = {};

    /**
     * Adds a locale into our stringFilesContents map.
     *
     * @param {string} locale
     * @param {boolean} isRTL
     */
    const addLocale = (locale, isRTL) => {
      // Read optional string file
      const stringsFilename = path.normalize(`../${locale === ChipperConstants.FALLBACK_LOCALE ? '' : 'babel/'}${repo}/${repo}-strings_${locale}.json`);
      let fileContents;
      try {
        fileContents = grunt.file.readJSON(stringsFilename);
      } catch (error) {
        grunt.log.debug(`missing string file: ${stringsFilename}`);
        fileContents = {};
      }

      // Format the string values
      ChipperStringUtils.formatStringValues(fileContents, isRTL);
      stringFilesContents[repo][locale] = fileContents;
    };

    // Include fallback locales (they may have duplicates)
    const includedLocales = _.sortBy(_.uniq(locales.flatMap(locale => {
      assert(localeData[locale], `unsupported locale: ${locale}`);
      return localeFallbacks(locale);
    })));
    includedLocales.forEach(locale => addLocale(locale, localeData[locale].direction === 'rtl'));
  });
  return stringFilesContents;
};

/**
 * @param {string} mainRepo
 * @param {Array.<string>} locales
 * @param {Array.<string>} phetLibs - Used to check for bad string dependencies
 * @param {Array.<string>} usedModules - relative file path of the module (filename) from the repos root
 *
 * @returns {Object} - map[locale][stringKey] => {string}
 */
module.exports = function (mainRepo, locales, phetLibs, usedModules) {
  assert(locales.indexOf(ChipperConstants.FALLBACK_LOCALE) !== -1, 'fallback locale is required');

  // Load the file contents of every single JS module that used any strings
  const usedFileContents = usedModules.map(usedModule => fs.readFileSync(`../${usedModule}`, 'utf-8'));

  // Compute which repositories contain one more more used strings (since we'll need to load string files for those
  // repositories).
  let reposWithUsedStrings = [];
  usedFileContents.forEach(fileContent => {
    // [a-zA-Z_$][a-zA-Z0-9_$] ---- general JS identifiers, first character can't be a number
    // [^\n\r] ---- grab everything except for newlines here, so we get everything
    const allImportStatements = fileContent.match(/import [a-zA-Z_$][a-zA-Z0-9_$]*Strings from '[^\n\r]+Strings.js';/g);
    if (allImportStatements) {
      reposWithUsedStrings.push(...allImportStatements.map(importStatement => {
        // Grabs out the prefix before `Strings.js` (without the leading slash too)
        const importName = importStatement.match(/\/([\w-]+)Strings\.js/)[1];

        // kebab case the repo
        return _.kebabCase(importName);
      }));
    }
  });
  reposWithUsedStrings = _.uniq(reposWithUsedStrings).filter(repo => {
    return fs.existsSync(`../${repo}/package.json`);
  });

  // Compute a map of {repo:string} => {requirejsNamepsace:string}, so we can construct full string keys from strings
  // that would be accessing them, e.g. `JoistStrings.ResetAllButton.name` => `JOIST/ResetAllButton.name`.
  const requirejsNamespaceMap = {};
  reposWithUsedStrings.forEach(repo => {
    const packageObject = JSON.parse(fs.readFileSync(`../${repo}/package.json`, 'utf-8'));
    requirejsNamespaceMap[repo] = packageObject.phet.requirejsNamespace;
  });

  // Load all the required string files into memory, so we don't load them multiple times (for each usage)
  // maps [repositoryName][locale] => contents of locale string file
  const stringFilesContents = getStringFilesContents(reposWithUsedStrings, locales);

  // Initialize our full stringMap object (which will be filled with results and then returned as our string map).
  const stringMap = {};
  const stringMetadata = {};
  locales.forEach(locale => {
    stringMap[locale] = {};
  });

  // combine our strings into [locale][stringKey] map, using the fallback locale where necessary. In regards to nested
  // strings, this data structure doesn't nest. Instead it gets nested string values, and then sets them with the
  // flat key string like `"FRICTION/a11y.some.string.here": { value: 'My Some String' }`
  reposWithUsedStrings.forEach(repo => {
    // Scan all of the files with string module references, scanning for anything that looks like a string access for
    // our repo. This will include the string module reference, e.g. `JoistStrings.ResetAllButton.name`, but could also
    // include slightly more (since we're string parsing), e.g. `JoistStrings.ResetAllButton.name.length` would be
    // included, even though only part of that is a string access.
    let stringAccesses = [];
    const prefix = `${pascalCase(repo)}Strings`; // e.g. JoistStrings
    usedFileContents.forEach((fileContent, i) => {
      // Only scan files where we can identify an import for it
      if (fileContent.includes(`import ${prefix} from`)) {
        // Look for normal matches, e.g. `JoistStrings.` followed by one or more chunks like:
        // .somethingVaguely_alphaNum3r1c
        // [ 'aStringInBracketsBecauseOfSpecialCharacters' ]
        //
        // It will also then end on anything that doesn't look like another one of those chunks
        // [a-zA-Z_$][a-zA-Z0-9_$]* ---- this grabs things that looks like valid JS identifiers
        // \\[ '[^']+' \\])+ ---- this grabs things like our second case above
        // [^\\.\\[] ---- matches something at the end that is NOT either of those other two cases
        // It is also generalized to support arbitrary whitespace and requires that ' match ' or " match ", since
        // this must support JS code and minified TypeScript code
        // Matches one final character that is not '.' or '[', since any valid string accesses should NOT have that
        // after. NOTE: there are some degenerate cases that will break this, e.g.:
        // - JoistStrings.someStringProperty[ 0 ]
        // - JoistStrings.something[ 0 ]
        // - JoistStrings.something[ 'length' ]
        const matches = fileContent.match(new RegExp(`${prefix}(\\.[a-zA-Z_$][a-zA-Z0-9_$]*|\\[\\s*['"][^'"]+['"]\\s*\\])+[^\\.\\[]`, 'g'));
        if (matches) {
          stringAccesses.push(...matches.map(match => {
            return match
            // We always have to strip off the last character - it's a character that shouldn't be in a string access
            .slice(0, match.length - 1)
            // Handle JoistStrings[ 'some-thingStringProperty' ].value => JoistStrings[ 'some-thing' ]
            // -- Anything after StringProperty should go
            // away, but we need to add the final '] to maintain the format
            .replace(/StringProperty'].*/, '\']')
            // Handle JoistStrings.somethingStringProperty.value => JoistStrings.something
            .replace(/StringProperty.*/, '');
          }));
        }
      }
    });

    // Strip off our prefixes, so our stringAccesses will have things like `'ResetAllButton.name'` inside.
    stringAccesses = _.uniq(stringAccesses).map(str => str.slice(prefix.length));

    // The JS outputted by TS is minified and missing the whitespace
    const depth = 2;

    // Turn each string access into an array of parts, e.g. '.ResetAllButton.name' => [ 'ResetAllButton', 'name' ]
    // or '[ \'A\' ].B[ \'C\' ]' => [ 'A', 'B', 'C' ]
    // Regex grabs either `.identifier` or `[ 'text' ]`.
    const stringKeysByParts = stringAccesses.map(access => access.match(/\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[\s*['"][^'"]+['"]\s*\]/g).map(token => {
      return token.startsWith('.') ? token.slice(1) : token.slice(depth, token.length - depth);
    }));

    // Concatenate the string parts for each access into something that looks like a partial string key, e.g.
    // [ 'ResetAllButton', 'name' ] => 'ResetAllButton.name'
    const partialStringKeys = _.uniq(stringKeysByParts.map(parts => parts.join('.'))).filter(key => key !== 'js');

    // For each string key and locale, we'll look up the string entry and fill it into the stringMap
    partialStringKeys.forEach(partialStringKey => {
      locales.forEach(locale => {
        let stringEntry = null;
        for (const fallbackLocale of localeFallbacks(locale)) {
          const stringFileContents = stringFilesContents[repo][fallbackLocale];
          if (stringFileContents) {
            stringEntry = ChipperStringUtils.getStringEntryFromMap(stringFileContents, partialStringKey);
            if (stringEntry) {
              break;
            }
          }
        }
        if (!partialStringKey.endsWith('StringProperty')) {
          assert(stringEntry !== null, `Missing string information for ${repo} ${partialStringKey}`);
          const stringKey = `${requirejsNamespaceMap[repo]}/${partialStringKey}`;
          stringMap[locale][stringKey] = stringEntry.value;
          if (stringEntry.metadata && locale === ChipperConstants.FALLBACK_LOCALE) {
            stringMetadata[stringKey] = stringEntry.metadata;
          }
        }
      });
    });
  });
  return {
    stringMap: stringMap,
    stringMetadata: stringMetadata
  };
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsImFzc2VydCIsIkNoaXBwZXJDb25zdGFudHMiLCJwYXNjYWxDYXNlIiwiQ2hpcHBlclN0cmluZ1V0aWxzIiwiZnMiLCJncnVudCIsInBhdGgiLCJsb2NhbGVEYXRhIiwiSlNPTiIsInBhcnNlIiwicmVhZEZpbGVTeW5jIiwibG9jYWxlRmFsbGJhY2tzIiwibG9jYWxlIiwiRkFMTEJBQ0tfTE9DQUxFIiwiZmFsbGJhY2tMb2NhbGVzIiwiZ2V0U3RyaW5nRmlsZXNDb250ZW50cyIsInJlcG9zV2l0aFVzZWRTdHJpbmdzIiwibG9jYWxlcyIsInN0cmluZ0ZpbGVzQ29udGVudHMiLCJmb3JFYWNoIiwicmVwbyIsImFkZExvY2FsZSIsImlzUlRMIiwic3RyaW5nc0ZpbGVuYW1lIiwibm9ybWFsaXplIiwiZmlsZUNvbnRlbnRzIiwiZmlsZSIsInJlYWRKU09OIiwiZXJyb3IiLCJsb2ciLCJkZWJ1ZyIsImZvcm1hdFN0cmluZ1ZhbHVlcyIsImluY2x1ZGVkTG9jYWxlcyIsInNvcnRCeSIsInVuaXEiLCJmbGF0TWFwIiwiZGlyZWN0aW9uIiwibW9kdWxlIiwiZXhwb3J0cyIsIm1haW5SZXBvIiwicGhldExpYnMiLCJ1c2VkTW9kdWxlcyIsImluZGV4T2YiLCJ1c2VkRmlsZUNvbnRlbnRzIiwibWFwIiwidXNlZE1vZHVsZSIsImZpbGVDb250ZW50IiwiYWxsSW1wb3J0U3RhdGVtZW50cyIsIm1hdGNoIiwicHVzaCIsImltcG9ydFN0YXRlbWVudCIsImltcG9ydE5hbWUiLCJrZWJhYkNhc2UiLCJmaWx0ZXIiLCJleGlzdHNTeW5jIiwicmVxdWlyZWpzTmFtZXNwYWNlTWFwIiwicGFja2FnZU9iamVjdCIsInBoZXQiLCJyZXF1aXJlanNOYW1lc3BhY2UiLCJzdHJpbmdNYXAiLCJzdHJpbmdNZXRhZGF0YSIsInN0cmluZ0FjY2Vzc2VzIiwicHJlZml4IiwiaSIsImluY2x1ZGVzIiwibWF0Y2hlcyIsIlJlZ0V4cCIsInNsaWNlIiwibGVuZ3RoIiwicmVwbGFjZSIsInN0ciIsImRlcHRoIiwic3RyaW5nS2V5c0J5UGFydHMiLCJhY2Nlc3MiLCJ0b2tlbiIsInN0YXJ0c1dpdGgiLCJwYXJ0aWFsU3RyaW5nS2V5cyIsInBhcnRzIiwiam9pbiIsImtleSIsInBhcnRpYWxTdHJpbmdLZXkiLCJzdHJpbmdFbnRyeSIsImZhbGxiYWNrTG9jYWxlIiwic3RyaW5nRmlsZUNvbnRlbnRzIiwiZ2V0U3RyaW5nRW50cnlGcm9tTWFwIiwiZW5kc1dpdGgiLCJzdHJpbmdLZXkiLCJ2YWx1ZSIsIm1ldGFkYXRhIl0sInNvdXJjZXMiOlsiZ2V0U3RyaW5nTWFwLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE1LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgYSBtYXAgc3VjaCB0aGF0IG1hcFtcImxvY2FsZVwiXVtcIlJFUE8vc3RyaW5nS2V5XCJdIHdpbGwgYmUgdGhlIHN0cmluZyB2YWx1ZSAod2l0aCBmYWxsYmFja3MgdG8gRW5nbGlzaCB3aGVyZSBuZWVkZWQpLlxyXG4gKiBMb2FkcyBlYWNoIHN0cmluZyBmaWxlIG9ubHkgb25jZSwgYW5kIG9ubHkgbG9hZHMgdGhlIHJlcG9zaXRvcnkvbG9jYWxlIGNvbWJpbmF0aW9ucyBuZWNlc3NhcnkuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5cclxuY29uc3QgXyA9IHJlcXVpcmUoICdsb2Rhc2gnICk7XHJcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoICdhc3NlcnQnICk7XHJcbmNvbnN0IENoaXBwZXJDb25zdGFudHMgPSByZXF1aXJlKCAnLi4vY29tbW9uL0NoaXBwZXJDb25zdGFudHMnICk7XHJcbmNvbnN0IHBhc2NhbENhc2UgPSByZXF1aXJlKCAnLi4vY29tbW9uL3Bhc2NhbENhc2UnICk7XHJcbmNvbnN0IENoaXBwZXJTdHJpbmdVdGlscyA9IHJlcXVpcmUoICcuLi9jb21tb24vQ2hpcHBlclN0cmluZ1V0aWxzJyApO1xyXG5jb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcclxuY29uc3QgZ3J1bnQgPSByZXF1aXJlKCAnZ3J1bnQnICk7XHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCAncGF0aCcgKTtcclxuXHJcbmNvbnN0IGxvY2FsZURhdGEgPSBKU09OLnBhcnNlKCBmcy5yZWFkRmlsZVN5bmMoICcuLi9iYWJlbC9sb2NhbGVEYXRhLmpzb24nLCAndXRmOCcgKSApO1xyXG5cclxuLyoqXHJcbiAqIEZvciBhIGdpdmVuIGxvY2FsZSwgcmV0dXJuIGFuIGFycmF5IG9mIHNwZWNpZmljIGxvY2FsZXMgdGhhdCB3ZSdsbCB1c2UgYXMgZmFsbGJhY2tzLCBlLmcuXHJcbiAqICdhcl9BRScgPT4gWyAnYXJfQUUnLCAnYXInLCAnYXJfTUEnLCAnZW4nIF0gICAobm90ZSwgY2hhbmdlZCBmcm9tIHpoX0NOIGV4YW1wbGUsIHdoaWNoIGRvZXMgTk9UIHVzZSAnemgnIGFzIGEgZmFsbGJhY2sgYW55bW9yZSlcclxuICogJ2VzJyA9PiBbICdlcycsICdlbicgXVxyXG4gKiAnZW4nID0+IFsgJ2VuJyBdXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBsb2NhbGVcclxuICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fVxyXG4gKi9cclxuY29uc3QgbG9jYWxlRmFsbGJhY2tzID0gbG9jYWxlID0+IHtcclxuICByZXR1cm4gW1xyXG4gICAgLi4uKCBsb2NhbGUgIT09IENoaXBwZXJDb25zdGFudHMuRkFMTEJBQ0tfTE9DQUxFID8gWyBsb2NhbGUgXSA6IFtdICksXHJcbiAgICAuLi4oIGxvY2FsZURhdGFbIGxvY2FsZSBdLmZhbGxiYWNrTG9jYWxlcyB8fCBbXSApLFxyXG4gICAgQ2hpcHBlckNvbnN0YW50cy5GQUxMQkFDS19MT0NBTEUgLy8gZS5nLiAnZW4nXHJcbiAgXTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBMb2FkIGFsbCB0aGUgcmVxdWlyZWQgc3RyaW5nIGZpbGVzIGludG8gbWVtb3J5LCBzbyB3ZSBkb24ndCBsb2FkIHRoZW0gbXVsdGlwbGUgdGltZXMgKGZvciBlYWNoIHVzYWdlKS5cclxuICpcclxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gcmVwb3NXaXRoVXNlZFN0cmluZ3MgLSBBbGwgb2YgdGhlIHJlcG9zIHRoYXQgaGF2ZSAxKyB1c2VkIHN0cmluZ3NcclxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gbG9jYWxlcyAtIEFsbCBzdXBwb3J0ZWQgbG9jYWxlcyBmb3IgdGhpcyBidWlsZFxyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSAtIG1hcHMge2xvY2FsZTpzdHJpbmd9ID0+IEFub3RoZXIgbWFwIHdpdGg6IHtzdHJpbmdLZXk6c3RyaW5nfSA9PiB7c3RyaW5nVmFsdWU6c3RyaW5nfVxyXG4gKi9cclxuY29uc3QgZ2V0U3RyaW5nRmlsZXNDb250ZW50cyA9ICggcmVwb3NXaXRoVXNlZFN0cmluZ3MsIGxvY2FsZXMgKSA9PiB7XHJcbiAgY29uc3Qgc3RyaW5nRmlsZXNDb250ZW50cyA9IHt9OyAvLyBtYXBzIFtyZXBvc2l0b3J5TmFtZV1bbG9jYWxlXSA9PiBjb250ZW50cyBvZiBsb2NhbGUgc3RyaW5nIGZpbGVcclxuXHJcbiAgcmVwb3NXaXRoVXNlZFN0cmluZ3MuZm9yRWFjaCggcmVwbyA9PiB7XHJcbiAgICBzdHJpbmdGaWxlc0NvbnRlbnRzWyByZXBvIF0gPSB7fTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZHMgYSBsb2NhbGUgaW50byBvdXIgc3RyaW5nRmlsZXNDb250ZW50cyBtYXAuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGxvY2FsZVxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc1JUTFxyXG4gICAgICovXHJcbiAgICBjb25zdCBhZGRMb2NhbGUgPSAoIGxvY2FsZSwgaXNSVEwgKSA9PiB7XHJcbiAgICAgIC8vIFJlYWQgb3B0aW9uYWwgc3RyaW5nIGZpbGVcclxuICAgICAgY29uc3Qgc3RyaW5nc0ZpbGVuYW1lID0gcGF0aC5ub3JtYWxpemUoIGAuLi8ke2xvY2FsZSA9PT0gQ2hpcHBlckNvbnN0YW50cy5GQUxMQkFDS19MT0NBTEUgPyAnJyA6ICdiYWJlbC8nfSR7cmVwb30vJHtyZXBvfS1zdHJpbmdzXyR7bG9jYWxlfS5qc29uYCApO1xyXG4gICAgICBsZXQgZmlsZUNvbnRlbnRzO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGZpbGVDb250ZW50cyA9IGdydW50LmZpbGUucmVhZEpTT04oIHN0cmluZ3NGaWxlbmFtZSApO1xyXG4gICAgICB9XHJcbiAgICAgIGNhdGNoKCBlcnJvciApIHtcclxuICAgICAgICBncnVudC5sb2cuZGVidWcoIGBtaXNzaW5nIHN0cmluZyBmaWxlOiAke3N0cmluZ3NGaWxlbmFtZX1gICk7XHJcbiAgICAgICAgZmlsZUNvbnRlbnRzID0ge307XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEZvcm1hdCB0aGUgc3RyaW5nIHZhbHVlc1xyXG4gICAgICBDaGlwcGVyU3RyaW5nVXRpbHMuZm9ybWF0U3RyaW5nVmFsdWVzKCBmaWxlQ29udGVudHMsIGlzUlRMICk7XHJcblxyXG4gICAgICBzdHJpbmdGaWxlc0NvbnRlbnRzWyByZXBvIF1bIGxvY2FsZSBdID0gZmlsZUNvbnRlbnRzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBJbmNsdWRlIGZhbGxiYWNrIGxvY2FsZXMgKHRoZXkgbWF5IGhhdmUgZHVwbGljYXRlcylcclxuICAgIGNvbnN0IGluY2x1ZGVkTG9jYWxlcyA9IF8uc29ydEJ5KCBfLnVuaXEoIGxvY2FsZXMuZmxhdE1hcCggbG9jYWxlID0+IHtcclxuICAgICAgYXNzZXJ0KCBsb2NhbGVEYXRhWyBsb2NhbGUgXSwgYHVuc3VwcG9ydGVkIGxvY2FsZTogJHtsb2NhbGV9YCApO1xyXG5cclxuICAgICAgcmV0dXJuIGxvY2FsZUZhbGxiYWNrcyggbG9jYWxlICk7XHJcbiAgICB9ICkgKSApO1xyXG5cclxuICAgIGluY2x1ZGVkTG9jYWxlcy5mb3JFYWNoKCBsb2NhbGUgPT4gYWRkTG9jYWxlKCBsb2NhbGUsIGxvY2FsZURhdGFbIGxvY2FsZSBdLmRpcmVjdGlvbiA9PT0gJ3J0bCcgKSApO1xyXG4gIH0gKTtcclxuXHJcbiAgcmV0dXJuIHN0cmluZ0ZpbGVzQ29udGVudHM7XHJcbn07XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtzdHJpbmd9IG1haW5SZXBvXHJcbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IGxvY2FsZXNcclxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gcGhldExpYnMgLSBVc2VkIHRvIGNoZWNrIGZvciBiYWQgc3RyaW5nIGRlcGVuZGVuY2llc1xyXG4gKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSB1c2VkTW9kdWxlcyAtIHJlbGF0aXZlIGZpbGUgcGF0aCBvZiB0aGUgbW9kdWxlIChmaWxlbmFtZSkgZnJvbSB0aGUgcmVwb3Mgcm9vdFxyXG4gKlxyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSAtIG1hcFtsb2NhbGVdW3N0cmluZ0tleV0gPT4ge3N0cmluZ31cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIG1haW5SZXBvLCBsb2NhbGVzLCBwaGV0TGlicywgdXNlZE1vZHVsZXMgKSB7XHJcblxyXG4gIGFzc2VydCggbG9jYWxlcy5pbmRleE9mKCBDaGlwcGVyQ29uc3RhbnRzLkZBTExCQUNLX0xPQ0FMRSApICE9PSAtMSwgJ2ZhbGxiYWNrIGxvY2FsZSBpcyByZXF1aXJlZCcgKTtcclxuXHJcbiAgLy8gTG9hZCB0aGUgZmlsZSBjb250ZW50cyBvZiBldmVyeSBzaW5nbGUgSlMgbW9kdWxlIHRoYXQgdXNlZCBhbnkgc3RyaW5nc1xyXG4gIGNvbnN0IHVzZWRGaWxlQ29udGVudHMgPSB1c2VkTW9kdWxlcy5tYXAoIHVzZWRNb2R1bGUgPT4gZnMucmVhZEZpbGVTeW5jKCBgLi4vJHt1c2VkTW9kdWxlfWAsICd1dGYtOCcgKSApO1xyXG5cclxuICAvLyBDb21wdXRlIHdoaWNoIHJlcG9zaXRvcmllcyBjb250YWluIG9uZSBtb3JlIG1vcmUgdXNlZCBzdHJpbmdzIChzaW5jZSB3ZSdsbCBuZWVkIHRvIGxvYWQgc3RyaW5nIGZpbGVzIGZvciB0aG9zZVxyXG4gIC8vIHJlcG9zaXRvcmllcykuXHJcbiAgbGV0IHJlcG9zV2l0aFVzZWRTdHJpbmdzID0gW107XHJcbiAgdXNlZEZpbGVDb250ZW50cy5mb3JFYWNoKCBmaWxlQ29udGVudCA9PiB7XHJcbiAgICAvLyBbYS16QS1aXyRdW2EtekEtWjAtOV8kXSAtLS0tIGdlbmVyYWwgSlMgaWRlbnRpZmllcnMsIGZpcnN0IGNoYXJhY3RlciBjYW4ndCBiZSBhIG51bWJlclxyXG4gICAgLy8gW15cXG5cXHJdIC0tLS0gZ3JhYiBldmVyeXRoaW5nIGV4Y2VwdCBmb3IgbmV3bGluZXMgaGVyZSwgc28gd2UgZ2V0IGV2ZXJ5dGhpbmdcclxuICAgIGNvbnN0IGFsbEltcG9ydFN0YXRlbWVudHMgPSBmaWxlQ29udGVudC5tYXRjaCggL2ltcG9ydCBbYS16QS1aXyRdW2EtekEtWjAtOV8kXSpTdHJpbmdzIGZyb20gJ1teXFxuXFxyXStTdHJpbmdzLmpzJzsvZyApO1xyXG4gICAgaWYgKCBhbGxJbXBvcnRTdGF0ZW1lbnRzICkge1xyXG4gICAgICByZXBvc1dpdGhVc2VkU3RyaW5ncy5wdXNoKCAuLi5hbGxJbXBvcnRTdGF0ZW1lbnRzLm1hcCggaW1wb3J0U3RhdGVtZW50ID0+IHtcclxuICAgICAgICAvLyBHcmFicyBvdXQgdGhlIHByZWZpeCBiZWZvcmUgYFN0cmluZ3MuanNgICh3aXRob3V0IHRoZSBsZWFkaW5nIHNsYXNoIHRvbylcclxuICAgICAgICBjb25zdCBpbXBvcnROYW1lID0gaW1wb3J0U3RhdGVtZW50Lm1hdGNoKCAvXFwvKFtcXHctXSspU3RyaW5nc1xcLmpzLyApWyAxIF07XHJcblxyXG4gICAgICAgIC8vIGtlYmFiIGNhc2UgdGhlIHJlcG9cclxuICAgICAgICByZXR1cm4gXy5rZWJhYkNhc2UoIGltcG9ydE5hbWUgKTtcclxuICAgICAgfSApICk7XHJcbiAgICB9XHJcbiAgfSApO1xyXG4gIHJlcG9zV2l0aFVzZWRTdHJpbmdzID0gXy51bmlxKCByZXBvc1dpdGhVc2VkU3RyaW5ncyApLmZpbHRlciggcmVwbyA9PiB7XHJcbiAgICByZXR1cm4gZnMuZXhpc3RzU3luYyggYC4uLyR7cmVwb30vcGFja2FnZS5qc29uYCApO1xyXG4gIH0gKTtcclxuXHJcbiAgLy8gQ29tcHV0ZSBhIG1hcCBvZiB7cmVwbzpzdHJpbmd9ID0+IHtyZXF1aXJlanNOYW1lcHNhY2U6c3RyaW5nfSwgc28gd2UgY2FuIGNvbnN0cnVjdCBmdWxsIHN0cmluZyBrZXlzIGZyb20gc3RyaW5nc1xyXG4gIC8vIHRoYXQgd291bGQgYmUgYWNjZXNzaW5nIHRoZW0sIGUuZy4gYEpvaXN0U3RyaW5ncy5SZXNldEFsbEJ1dHRvbi5uYW1lYCA9PiBgSk9JU1QvUmVzZXRBbGxCdXR0b24ubmFtZWAuXHJcbiAgY29uc3QgcmVxdWlyZWpzTmFtZXNwYWNlTWFwID0ge307XHJcbiAgcmVwb3NXaXRoVXNlZFN0cmluZ3MuZm9yRWFjaCggcmVwbyA9PiB7XHJcbiAgICBjb25zdCBwYWNrYWdlT2JqZWN0ID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBgLi4vJHtyZXBvfS9wYWNrYWdlLmpzb25gLCAndXRmLTgnICkgKTtcclxuICAgIHJlcXVpcmVqc05hbWVzcGFjZU1hcFsgcmVwbyBdID0gcGFja2FnZU9iamVjdC5waGV0LnJlcXVpcmVqc05hbWVzcGFjZTtcclxuICB9ICk7XHJcblxyXG4gIC8vIExvYWQgYWxsIHRoZSByZXF1aXJlZCBzdHJpbmcgZmlsZXMgaW50byBtZW1vcnksIHNvIHdlIGRvbid0IGxvYWQgdGhlbSBtdWx0aXBsZSB0aW1lcyAoZm9yIGVhY2ggdXNhZ2UpXHJcbiAgLy8gbWFwcyBbcmVwb3NpdG9yeU5hbWVdW2xvY2FsZV0gPT4gY29udGVudHMgb2YgbG9jYWxlIHN0cmluZyBmaWxlXHJcbiAgY29uc3Qgc3RyaW5nRmlsZXNDb250ZW50cyA9IGdldFN0cmluZ0ZpbGVzQ29udGVudHMoIHJlcG9zV2l0aFVzZWRTdHJpbmdzLCBsb2NhbGVzICk7XHJcblxyXG4gIC8vIEluaXRpYWxpemUgb3VyIGZ1bGwgc3RyaW5nTWFwIG9iamVjdCAod2hpY2ggd2lsbCBiZSBmaWxsZWQgd2l0aCByZXN1bHRzIGFuZCB0aGVuIHJldHVybmVkIGFzIG91ciBzdHJpbmcgbWFwKS5cclxuICBjb25zdCBzdHJpbmdNYXAgPSB7fTtcclxuICBjb25zdCBzdHJpbmdNZXRhZGF0YSA9IHt9O1xyXG4gIGxvY2FsZXMuZm9yRWFjaCggbG9jYWxlID0+IHtcclxuICAgIHN0cmluZ01hcFsgbG9jYWxlIF0gPSB7fTtcclxuICB9ICk7XHJcblxyXG4gIC8vIGNvbWJpbmUgb3VyIHN0cmluZ3MgaW50byBbbG9jYWxlXVtzdHJpbmdLZXldIG1hcCwgdXNpbmcgdGhlIGZhbGxiYWNrIGxvY2FsZSB3aGVyZSBuZWNlc3NhcnkuIEluIHJlZ2FyZHMgdG8gbmVzdGVkXHJcbiAgLy8gc3RyaW5ncywgdGhpcyBkYXRhIHN0cnVjdHVyZSBkb2Vzbid0IG5lc3QuIEluc3RlYWQgaXQgZ2V0cyBuZXN0ZWQgc3RyaW5nIHZhbHVlcywgYW5kIHRoZW4gc2V0cyB0aGVtIHdpdGggdGhlXHJcbiAgLy8gZmxhdCBrZXkgc3RyaW5nIGxpa2UgYFwiRlJJQ1RJT04vYTExeS5zb21lLnN0cmluZy5oZXJlXCI6IHsgdmFsdWU6ICdNeSBTb21lIFN0cmluZycgfWBcclxuICByZXBvc1dpdGhVc2VkU3RyaW5ncy5mb3JFYWNoKCByZXBvID0+IHtcclxuXHJcbiAgICAvLyBTY2FuIGFsbCBvZiB0aGUgZmlsZXMgd2l0aCBzdHJpbmcgbW9kdWxlIHJlZmVyZW5jZXMsIHNjYW5uaW5nIGZvciBhbnl0aGluZyB0aGF0IGxvb2tzIGxpa2UgYSBzdHJpbmcgYWNjZXNzIGZvclxyXG4gICAgLy8gb3VyIHJlcG8uIFRoaXMgd2lsbCBpbmNsdWRlIHRoZSBzdHJpbmcgbW9kdWxlIHJlZmVyZW5jZSwgZS5nLiBgSm9pc3RTdHJpbmdzLlJlc2V0QWxsQnV0dG9uLm5hbWVgLCBidXQgY291bGQgYWxzb1xyXG4gICAgLy8gaW5jbHVkZSBzbGlnaHRseSBtb3JlIChzaW5jZSB3ZSdyZSBzdHJpbmcgcGFyc2luZyksIGUuZy4gYEpvaXN0U3RyaW5ncy5SZXNldEFsbEJ1dHRvbi5uYW1lLmxlbmd0aGAgd291bGQgYmVcclxuICAgIC8vIGluY2x1ZGVkLCBldmVuIHRob3VnaCBvbmx5IHBhcnQgb2YgdGhhdCBpcyBhIHN0cmluZyBhY2Nlc3MuXHJcbiAgICBsZXQgc3RyaW5nQWNjZXNzZXMgPSBbXTtcclxuXHJcbiAgICBjb25zdCBwcmVmaXggPSBgJHtwYXNjYWxDYXNlKCByZXBvICl9U3RyaW5nc2A7IC8vIGUuZy4gSm9pc3RTdHJpbmdzXHJcbiAgICB1c2VkRmlsZUNvbnRlbnRzLmZvckVhY2goICggZmlsZUNvbnRlbnQsIGkgKSA9PiB7XHJcbiAgICAgIC8vIE9ubHkgc2NhbiBmaWxlcyB3aGVyZSB3ZSBjYW4gaWRlbnRpZnkgYW4gaW1wb3J0IGZvciBpdFxyXG4gICAgICBpZiAoIGZpbGVDb250ZW50LmluY2x1ZGVzKCBgaW1wb3J0ICR7cHJlZml4fSBmcm9tYCApICkge1xyXG5cclxuICAgICAgICAvLyBMb29rIGZvciBub3JtYWwgbWF0Y2hlcywgZS5nLiBgSm9pc3RTdHJpbmdzLmAgZm9sbG93ZWQgYnkgb25lIG9yIG1vcmUgY2h1bmtzIGxpa2U6XHJcbiAgICAgICAgLy8gLnNvbWV0aGluZ1ZhZ3VlbHlfYWxwaGFOdW0zcjFjXHJcbiAgICAgICAgLy8gWyAnYVN0cmluZ0luQnJhY2tldHNCZWNhdXNlT2ZTcGVjaWFsQ2hhcmFjdGVycycgXVxyXG4gICAgICAgIC8vXHJcbiAgICAgICAgLy8gSXQgd2lsbCBhbHNvIHRoZW4gZW5kIG9uIGFueXRoaW5nIHRoYXQgZG9lc24ndCBsb29rIGxpa2UgYW5vdGhlciBvbmUgb2YgdGhvc2UgY2h1bmtzXHJcbiAgICAgICAgLy8gW2EtekEtWl8kXVthLXpBLVowLTlfJF0qIC0tLS0gdGhpcyBncmFicyB0aGluZ3MgdGhhdCBsb29rcyBsaWtlIHZhbGlkIEpTIGlkZW50aWZpZXJzXHJcbiAgICAgICAgLy8gXFxcXFsgJ1teJ10rJyBcXFxcXSkrIC0tLS0gdGhpcyBncmFicyB0aGluZ3MgbGlrZSBvdXIgc2Vjb25kIGNhc2UgYWJvdmVcclxuICAgICAgICAvLyBbXlxcXFwuXFxcXFtdIC0tLS0gbWF0Y2hlcyBzb21ldGhpbmcgYXQgdGhlIGVuZCB0aGF0IGlzIE5PVCBlaXRoZXIgb2YgdGhvc2Ugb3RoZXIgdHdvIGNhc2VzXHJcbiAgICAgICAgLy8gSXQgaXMgYWxzbyBnZW5lcmFsaXplZCB0byBzdXBwb3J0IGFyYml0cmFyeSB3aGl0ZXNwYWNlIGFuZCByZXF1aXJlcyB0aGF0ICcgbWF0Y2ggJyBvciBcIiBtYXRjaCBcIiwgc2luY2VcclxuICAgICAgICAvLyB0aGlzIG11c3Qgc3VwcG9ydCBKUyBjb2RlIGFuZCBtaW5pZmllZCBUeXBlU2NyaXB0IGNvZGVcclxuICAgICAgICAvLyBNYXRjaGVzIG9uZSBmaW5hbCBjaGFyYWN0ZXIgdGhhdCBpcyBub3QgJy4nIG9yICdbJywgc2luY2UgYW55IHZhbGlkIHN0cmluZyBhY2Nlc3NlcyBzaG91bGQgTk9UIGhhdmUgdGhhdFxyXG4gICAgICAgIC8vIGFmdGVyLiBOT1RFOiB0aGVyZSBhcmUgc29tZSBkZWdlbmVyYXRlIGNhc2VzIHRoYXQgd2lsbCBicmVhayB0aGlzLCBlLmcuOlxyXG4gICAgICAgIC8vIC0gSm9pc3RTdHJpbmdzLnNvbWVTdHJpbmdQcm9wZXJ0eVsgMCBdXHJcbiAgICAgICAgLy8gLSBKb2lzdFN0cmluZ3Muc29tZXRoaW5nWyAwIF1cclxuICAgICAgICAvLyAtIEpvaXN0U3RyaW5ncy5zb21ldGhpbmdbICdsZW5ndGgnIF1cclxuICAgICAgICBjb25zdCBtYXRjaGVzID0gZmlsZUNvbnRlbnQubWF0Y2goIG5ldyBSZWdFeHAoIGAke3ByZWZpeH0oXFxcXC5bYS16QS1aXyRdW2EtekEtWjAtOV8kXSp8XFxcXFtcXFxccypbJ1wiXVteJ1wiXStbJ1wiXVxcXFxzKlxcXFxdKStbXlxcXFwuXFxcXFtdYCwgJ2cnICkgKTtcclxuICAgICAgICBpZiAoIG1hdGNoZXMgKSB7XHJcbiAgICAgICAgICBzdHJpbmdBY2Nlc3Nlcy5wdXNoKCAuLi5tYXRjaGVzLm1hcCggbWF0Y2ggPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hcclxuICAgICAgICAgICAgICAvLyBXZSBhbHdheXMgaGF2ZSB0byBzdHJpcCBvZmYgdGhlIGxhc3QgY2hhcmFjdGVyIC0gaXQncyBhIGNoYXJhY3RlciB0aGF0IHNob3VsZG4ndCBiZSBpbiBhIHN0cmluZyBhY2Nlc3NcclxuICAgICAgICAgICAgICAuc2xpY2UoIDAsIG1hdGNoLmxlbmd0aCAtIDEgKVxyXG4gICAgICAgICAgICAgIC8vIEhhbmRsZSBKb2lzdFN0cmluZ3NbICdzb21lLXRoaW5nU3RyaW5nUHJvcGVydHknIF0udmFsdWUgPT4gSm9pc3RTdHJpbmdzWyAnc29tZS10aGluZycgXVxyXG4gICAgICAgICAgICAgIC8vIC0tIEFueXRoaW5nIGFmdGVyIFN0cmluZ1Byb3BlcnR5IHNob3VsZCBnb1xyXG4gICAgICAgICAgICAgIC8vIGF3YXksIGJ1dCB3ZSBuZWVkIHRvIGFkZCB0aGUgZmluYWwgJ10gdG8gbWFpbnRhaW4gdGhlIGZvcm1hdFxyXG4gICAgICAgICAgICAgIC5yZXBsYWNlKCAvU3RyaW5nUHJvcGVydHknXS4qLywgJ1xcJ10nIClcclxuICAgICAgICAgICAgICAvLyBIYW5kbGUgSm9pc3RTdHJpbmdzLnNvbWV0aGluZ1N0cmluZ1Byb3BlcnR5LnZhbHVlID0+IEpvaXN0U3RyaW5ncy5zb21ldGhpbmdcclxuICAgICAgICAgICAgICAucmVwbGFjZSggL1N0cmluZ1Byb3BlcnR5LiovLCAnJyApO1xyXG4gICAgICAgICAgfSApICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gU3RyaXAgb2ZmIG91ciBwcmVmaXhlcywgc28gb3VyIHN0cmluZ0FjY2Vzc2VzIHdpbGwgaGF2ZSB0aGluZ3MgbGlrZSBgJ1Jlc2V0QWxsQnV0dG9uLm5hbWUnYCBpbnNpZGUuXHJcbiAgICBzdHJpbmdBY2Nlc3NlcyA9IF8udW5pcSggc3RyaW5nQWNjZXNzZXMgKS5tYXAoIHN0ciA9PiBzdHIuc2xpY2UoIHByZWZpeC5sZW5ndGggKSApO1xyXG5cclxuICAgIC8vIFRoZSBKUyBvdXRwdXR0ZWQgYnkgVFMgaXMgbWluaWZpZWQgYW5kIG1pc3NpbmcgdGhlIHdoaXRlc3BhY2VcclxuICAgIGNvbnN0IGRlcHRoID0gMjtcclxuXHJcbiAgICAvLyBUdXJuIGVhY2ggc3RyaW5nIGFjY2VzcyBpbnRvIGFuIGFycmF5IG9mIHBhcnRzLCBlLmcuICcuUmVzZXRBbGxCdXR0b24ubmFtZScgPT4gWyAnUmVzZXRBbGxCdXR0b24nLCAnbmFtZScgXVxyXG4gICAgLy8gb3IgJ1sgXFwnQVxcJyBdLkJbIFxcJ0NcXCcgXScgPT4gWyAnQScsICdCJywgJ0MnIF1cclxuICAgIC8vIFJlZ2V4IGdyYWJzIGVpdGhlciBgLmlkZW50aWZpZXJgIG9yIGBbICd0ZXh0JyBdYC5cclxuICAgIGNvbnN0IHN0cmluZ0tleXNCeVBhcnRzID0gc3RyaW5nQWNjZXNzZXMubWFwKCBhY2Nlc3MgPT4gYWNjZXNzLm1hdGNoKCAvXFwuW2EtekEtWl8kXVthLXpBLVowLTlfJF0qfFxcW1xccypbJ1wiXVteJ1wiXStbJ1wiXVxccypcXF0vZyApLm1hcCggdG9rZW4gPT4ge1xyXG4gICAgICByZXR1cm4gdG9rZW4uc3RhcnRzV2l0aCggJy4nICkgPyB0b2tlbi5zbGljZSggMSApIDogdG9rZW4uc2xpY2UoIGRlcHRoLCB0b2tlbi5sZW5ndGggLSBkZXB0aCApO1xyXG4gICAgfSApICk7XHJcblxyXG4gICAgLy8gQ29uY2F0ZW5hdGUgdGhlIHN0cmluZyBwYXJ0cyBmb3IgZWFjaCBhY2Nlc3MgaW50byBzb21ldGhpbmcgdGhhdCBsb29rcyBsaWtlIGEgcGFydGlhbCBzdHJpbmcga2V5LCBlLmcuXHJcbiAgICAvLyBbICdSZXNldEFsbEJ1dHRvbicsICduYW1lJyBdID0+ICdSZXNldEFsbEJ1dHRvbi5uYW1lJ1xyXG4gICAgY29uc3QgcGFydGlhbFN0cmluZ0tleXMgPSBfLnVuaXEoIHN0cmluZ0tleXNCeVBhcnRzLm1hcCggcGFydHMgPT4gcGFydHMuam9pbiggJy4nICkgKSApLmZpbHRlcigga2V5ID0+IGtleSAhPT0gJ2pzJyApO1xyXG5cclxuICAgIC8vIEZvciBlYWNoIHN0cmluZyBrZXkgYW5kIGxvY2FsZSwgd2UnbGwgbG9vayB1cCB0aGUgc3RyaW5nIGVudHJ5IGFuZCBmaWxsIGl0IGludG8gdGhlIHN0cmluZ01hcFxyXG4gICAgcGFydGlhbFN0cmluZ0tleXMuZm9yRWFjaCggcGFydGlhbFN0cmluZ0tleSA9PiB7XHJcbiAgICAgIGxvY2FsZXMuZm9yRWFjaCggbG9jYWxlID0+IHtcclxuICAgICAgICBsZXQgc3RyaW5nRW50cnkgPSBudWxsO1xyXG4gICAgICAgIGZvciAoIGNvbnN0IGZhbGxiYWNrTG9jYWxlIG9mIGxvY2FsZUZhbGxiYWNrcyggbG9jYWxlICkgKSB7XHJcbiAgICAgICAgICBjb25zdCBzdHJpbmdGaWxlQ29udGVudHMgPSBzdHJpbmdGaWxlc0NvbnRlbnRzWyByZXBvIF1bIGZhbGxiYWNrTG9jYWxlIF07XHJcbiAgICAgICAgICBpZiAoIHN0cmluZ0ZpbGVDb250ZW50cyApIHtcclxuICAgICAgICAgICAgc3RyaW5nRW50cnkgPSBDaGlwcGVyU3RyaW5nVXRpbHMuZ2V0U3RyaW5nRW50cnlGcm9tTWFwKCBzdHJpbmdGaWxlQ29udGVudHMsIHBhcnRpYWxTdHJpbmdLZXkgKTtcclxuICAgICAgICAgICAgaWYgKCBzdHJpbmdFbnRyeSApIHtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoICFwYXJ0aWFsU3RyaW5nS2V5LmVuZHNXaXRoKCAnU3RyaW5nUHJvcGVydHknICkgKSB7XHJcbiAgICAgICAgICBhc3NlcnQoIHN0cmluZ0VudHJ5ICE9PSBudWxsLCBgTWlzc2luZyBzdHJpbmcgaW5mb3JtYXRpb24gZm9yICR7cmVwb30gJHtwYXJ0aWFsU3RyaW5nS2V5fWAgKTtcclxuXHJcbiAgICAgICAgICBjb25zdCBzdHJpbmdLZXkgPSBgJHtyZXF1aXJlanNOYW1lc3BhY2VNYXBbIHJlcG8gXX0vJHtwYXJ0aWFsU3RyaW5nS2V5fWA7XHJcbiAgICAgICAgICBzdHJpbmdNYXBbIGxvY2FsZSBdWyBzdHJpbmdLZXkgXSA9IHN0cmluZ0VudHJ5LnZhbHVlO1xyXG4gICAgICAgICAgaWYgKCBzdHJpbmdFbnRyeS5tZXRhZGF0YSAmJiBsb2NhbGUgPT09IENoaXBwZXJDb25zdGFudHMuRkFMTEJBQ0tfTE9DQUxFICkge1xyXG4gICAgICAgICAgICBzdHJpbmdNZXRhZGF0YVsgc3RyaW5nS2V5IF0gPSBzdHJpbmdFbnRyeS5tZXRhZGF0YTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuICAgIH0gKTtcclxuICB9ICk7XHJcblxyXG4gIHJldHVybiB7IHN0cmluZ01hcDogc3RyaW5nTWFwLCBzdHJpbmdNZXRhZGF0YTogc3RyaW5nTWV0YWRhdGEgfTtcclxufTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQSxNQUFNQSxDQUFDLEdBQUdDLE9BQU8sQ0FBRSxRQUFTLENBQUM7QUFDN0IsTUFBTUMsTUFBTSxHQUFHRCxPQUFPLENBQUUsUUFBUyxDQUFDO0FBQ2xDLE1BQU1FLGdCQUFnQixHQUFHRixPQUFPLENBQUUsNEJBQTZCLENBQUM7QUFDaEUsTUFBTUcsVUFBVSxHQUFHSCxPQUFPLENBQUUsc0JBQXVCLENBQUM7QUFDcEQsTUFBTUksa0JBQWtCLEdBQUdKLE9BQU8sQ0FBRSw4QkFBK0IsQ0FBQztBQUNwRSxNQUFNSyxFQUFFLEdBQUdMLE9BQU8sQ0FBRSxJQUFLLENBQUM7QUFDMUIsTUFBTU0sS0FBSyxHQUFHTixPQUFPLENBQUUsT0FBUSxDQUFDO0FBQ2hDLE1BQU1PLElBQUksR0FBR1AsT0FBTyxDQUFFLE1BQU8sQ0FBQztBQUU5QixNQUFNUSxVQUFVLEdBQUdDLElBQUksQ0FBQ0MsS0FBSyxDQUFFTCxFQUFFLENBQUNNLFlBQVksQ0FBRSwwQkFBMEIsRUFBRSxNQUFPLENBQUUsQ0FBQzs7QUFFdEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTUMsZUFBZSxHQUFHQyxNQUFNLElBQUk7RUFDaEMsT0FBTyxDQUNMLElBQUtBLE1BQU0sS0FBS1gsZ0JBQWdCLENBQUNZLGVBQWUsR0FBRyxDQUFFRCxNQUFNLENBQUUsR0FBRyxFQUFFLENBQUUsRUFDcEUsSUFBS0wsVUFBVSxDQUFFSyxNQUFNLENBQUUsQ0FBQ0UsZUFBZSxJQUFJLEVBQUUsQ0FBRSxFQUNqRGIsZ0JBQWdCLENBQUNZLGVBQWUsQ0FBQztFQUFBLENBQ2xDO0FBQ0gsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU1FLHNCQUFzQixHQUFHQSxDQUFFQyxvQkFBb0IsRUFBRUMsT0FBTyxLQUFNO0VBQ2xFLE1BQU1DLG1CQUFtQixHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7O0VBRWhDRixvQkFBb0IsQ0FBQ0csT0FBTyxDQUFFQyxJQUFJLElBQUk7SUFDcENGLG1CQUFtQixDQUFFRSxJQUFJLENBQUUsR0FBRyxDQUFDLENBQUM7O0lBRWhDO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNJLE1BQU1DLFNBQVMsR0FBR0EsQ0FBRVQsTUFBTSxFQUFFVSxLQUFLLEtBQU07TUFDckM7TUFDQSxNQUFNQyxlQUFlLEdBQUdqQixJQUFJLENBQUNrQixTQUFTLENBQUcsTUFBS1osTUFBTSxLQUFLWCxnQkFBZ0IsQ0FBQ1ksZUFBZSxHQUFHLEVBQUUsR0FBRyxRQUFTLEdBQUVPLElBQUssSUFBR0EsSUFBSyxZQUFXUixNQUFPLE9BQU8sQ0FBQztNQUNuSixJQUFJYSxZQUFZO01BQ2hCLElBQUk7UUFDRkEsWUFBWSxHQUFHcEIsS0FBSyxDQUFDcUIsSUFBSSxDQUFDQyxRQUFRLENBQUVKLGVBQWdCLENBQUM7TUFDdkQsQ0FBQyxDQUNELE9BQU9LLEtBQUssRUFBRztRQUNidkIsS0FBSyxDQUFDd0IsR0FBRyxDQUFDQyxLQUFLLENBQUcsd0JBQXVCUCxlQUFnQixFQUFFLENBQUM7UUFDNURFLFlBQVksR0FBRyxDQUFDLENBQUM7TUFDbkI7O01BRUE7TUFDQXRCLGtCQUFrQixDQUFDNEIsa0JBQWtCLENBQUVOLFlBQVksRUFBRUgsS0FBTSxDQUFDO01BRTVESixtQkFBbUIsQ0FBRUUsSUFBSSxDQUFFLENBQUVSLE1BQU0sQ0FBRSxHQUFHYSxZQUFZO0lBQ3RELENBQUM7O0lBRUQ7SUFDQSxNQUFNTyxlQUFlLEdBQUdsQyxDQUFDLENBQUNtQyxNQUFNLENBQUVuQyxDQUFDLENBQUNvQyxJQUFJLENBQUVqQixPQUFPLENBQUNrQixPQUFPLENBQUV2QixNQUFNLElBQUk7TUFDbkVaLE1BQU0sQ0FBRU8sVUFBVSxDQUFFSyxNQUFNLENBQUUsRUFBRyx1QkFBc0JBLE1BQU8sRUFBRSxDQUFDO01BRS9ELE9BQU9ELGVBQWUsQ0FBRUMsTUFBTyxDQUFDO0lBQ2xDLENBQUUsQ0FBRSxDQUFFLENBQUM7SUFFUG9CLGVBQWUsQ0FBQ2IsT0FBTyxDQUFFUCxNQUFNLElBQUlTLFNBQVMsQ0FBRVQsTUFBTSxFQUFFTCxVQUFVLENBQUVLLE1BQU0sQ0FBRSxDQUFDd0IsU0FBUyxLQUFLLEtBQU0sQ0FBRSxDQUFDO0VBQ3BHLENBQUUsQ0FBQztFQUVILE9BQU9sQixtQkFBbUI7QUFDNUIsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FtQixNQUFNLENBQUNDLE9BQU8sR0FBRyxVQUFVQyxRQUFRLEVBQUV0QixPQUFPLEVBQUV1QixRQUFRLEVBQUVDLFdBQVcsRUFBRztFQUVwRXpDLE1BQU0sQ0FBRWlCLE9BQU8sQ0FBQ3lCLE9BQU8sQ0FBRXpDLGdCQUFnQixDQUFDWSxlQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsNkJBQThCLENBQUM7O0VBRW5HO0VBQ0EsTUFBTThCLGdCQUFnQixHQUFHRixXQUFXLENBQUNHLEdBQUcsQ0FBRUMsVUFBVSxJQUFJekMsRUFBRSxDQUFDTSxZQUFZLENBQUcsTUFBS21DLFVBQVcsRUFBQyxFQUFFLE9BQVEsQ0FBRSxDQUFDOztFQUV4RztFQUNBO0VBQ0EsSUFBSTdCLG9CQUFvQixHQUFHLEVBQUU7RUFDN0IyQixnQkFBZ0IsQ0FBQ3hCLE9BQU8sQ0FBRTJCLFdBQVcsSUFBSTtJQUN2QztJQUNBO0lBQ0EsTUFBTUMsbUJBQW1CLEdBQUdELFdBQVcsQ0FBQ0UsS0FBSyxDQUFFLG9FQUFxRSxDQUFDO0lBQ3JILElBQUtELG1CQUFtQixFQUFHO01BQ3pCL0Isb0JBQW9CLENBQUNpQyxJQUFJLENBQUUsR0FBR0YsbUJBQW1CLENBQUNILEdBQUcsQ0FBRU0sZUFBZSxJQUFJO1FBQ3hFO1FBQ0EsTUFBTUMsVUFBVSxHQUFHRCxlQUFlLENBQUNGLEtBQUssQ0FBRSx1QkFBd0IsQ0FBQyxDQUFFLENBQUMsQ0FBRTs7UUFFeEU7UUFDQSxPQUFPbEQsQ0FBQyxDQUFDc0QsU0FBUyxDQUFFRCxVQUFXLENBQUM7TUFDbEMsQ0FBRSxDQUFFLENBQUM7SUFDUDtFQUNGLENBQUUsQ0FBQztFQUNIbkMsb0JBQW9CLEdBQUdsQixDQUFDLENBQUNvQyxJQUFJLENBQUVsQixvQkFBcUIsQ0FBQyxDQUFDcUMsTUFBTSxDQUFFakMsSUFBSSxJQUFJO0lBQ3BFLE9BQU9oQixFQUFFLENBQUNrRCxVQUFVLENBQUcsTUFBS2xDLElBQUssZUFBZSxDQUFDO0VBQ25ELENBQUUsQ0FBQzs7RUFFSDtFQUNBO0VBQ0EsTUFBTW1DLHFCQUFxQixHQUFHLENBQUMsQ0FBQztFQUNoQ3ZDLG9CQUFvQixDQUFDRyxPQUFPLENBQUVDLElBQUksSUFBSTtJQUNwQyxNQUFNb0MsYUFBYSxHQUFHaEQsSUFBSSxDQUFDQyxLQUFLLENBQUVMLEVBQUUsQ0FBQ00sWUFBWSxDQUFHLE1BQUtVLElBQUssZUFBYyxFQUFFLE9BQVEsQ0FBRSxDQUFDO0lBQ3pGbUMscUJBQXFCLENBQUVuQyxJQUFJLENBQUUsR0FBR29DLGFBQWEsQ0FBQ0MsSUFBSSxDQUFDQyxrQkFBa0I7RUFDdkUsQ0FBRSxDQUFDOztFQUVIO0VBQ0E7RUFDQSxNQUFNeEMsbUJBQW1CLEdBQUdILHNCQUFzQixDQUFFQyxvQkFBb0IsRUFBRUMsT0FBUSxDQUFDOztFQUVuRjtFQUNBLE1BQU0wQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO0VBQ3BCLE1BQU1DLGNBQWMsR0FBRyxDQUFDLENBQUM7RUFDekIzQyxPQUFPLENBQUNFLE9BQU8sQ0FBRVAsTUFBTSxJQUFJO0lBQ3pCK0MsU0FBUyxDQUFFL0MsTUFBTSxDQUFFLEdBQUcsQ0FBQyxDQUFDO0VBQzFCLENBQUUsQ0FBQzs7RUFFSDtFQUNBO0VBQ0E7RUFDQUksb0JBQW9CLENBQUNHLE9BQU8sQ0FBRUMsSUFBSSxJQUFJO0lBRXBDO0lBQ0E7SUFDQTtJQUNBO0lBQ0EsSUFBSXlDLGNBQWMsR0FBRyxFQUFFO0lBRXZCLE1BQU1DLE1BQU0sR0FBSSxHQUFFNUQsVUFBVSxDQUFFa0IsSUFBSyxDQUFFLFNBQVEsQ0FBQyxDQUFDO0lBQy9DdUIsZ0JBQWdCLENBQUN4QixPQUFPLENBQUUsQ0FBRTJCLFdBQVcsRUFBRWlCLENBQUMsS0FBTTtNQUM5QztNQUNBLElBQUtqQixXQUFXLENBQUNrQixRQUFRLENBQUcsVUFBU0YsTUFBTyxPQUFPLENBQUMsRUFBRztRQUVyRDtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQSxNQUFNRyxPQUFPLEdBQUduQixXQUFXLENBQUNFLEtBQUssQ0FBRSxJQUFJa0IsTUFBTSxDQUFHLEdBQUVKLE1BQU8sc0VBQXFFLEVBQUUsR0FBSSxDQUFFLENBQUM7UUFDdkksSUFBS0csT0FBTyxFQUFHO1VBQ2JKLGNBQWMsQ0FBQ1osSUFBSSxDQUFFLEdBQUdnQixPQUFPLENBQUNyQixHQUFHLENBQUVJLEtBQUssSUFBSTtZQUM1QyxPQUFPQTtZQUNMO1lBQUEsQ0FDQ21CLEtBQUssQ0FBRSxDQUFDLEVBQUVuQixLQUFLLENBQUNvQixNQUFNLEdBQUcsQ0FBRTtZQUM1QjtZQUNBO1lBQ0E7WUFBQSxDQUNDQyxPQUFPLENBQUUsb0JBQW9CLEVBQUUsS0FBTTtZQUN0QztZQUFBLENBQ0NBLE9BQU8sQ0FBRSxrQkFBa0IsRUFBRSxFQUFHLENBQUM7VUFDdEMsQ0FBRSxDQUFFLENBQUM7UUFDUDtNQUNGO0lBQ0YsQ0FBRSxDQUFDOztJQUVIO0lBQ0FSLGNBQWMsR0FBRy9ELENBQUMsQ0FBQ29DLElBQUksQ0FBRTJCLGNBQWUsQ0FBQyxDQUFDakIsR0FBRyxDQUFFMEIsR0FBRyxJQUFJQSxHQUFHLENBQUNILEtBQUssQ0FBRUwsTUFBTSxDQUFDTSxNQUFPLENBQUUsQ0FBQzs7SUFFbEY7SUFDQSxNQUFNRyxLQUFLLEdBQUcsQ0FBQzs7SUFFZjtJQUNBO0lBQ0E7SUFDQSxNQUFNQyxpQkFBaUIsR0FBR1gsY0FBYyxDQUFDakIsR0FBRyxDQUFFNkIsTUFBTSxJQUFJQSxNQUFNLENBQUN6QixLQUFLLENBQUUsc0RBQXVELENBQUMsQ0FBQ0osR0FBRyxDQUFFOEIsS0FBSyxJQUFJO01BQzNJLE9BQU9BLEtBQUssQ0FBQ0MsVUFBVSxDQUFFLEdBQUksQ0FBQyxHQUFHRCxLQUFLLENBQUNQLEtBQUssQ0FBRSxDQUFFLENBQUMsR0FBR08sS0FBSyxDQUFDUCxLQUFLLENBQUVJLEtBQUssRUFBRUcsS0FBSyxDQUFDTixNQUFNLEdBQUdHLEtBQU0sQ0FBQztJQUNoRyxDQUFFLENBQUUsQ0FBQzs7SUFFTDtJQUNBO0lBQ0EsTUFBTUssaUJBQWlCLEdBQUc5RSxDQUFDLENBQUNvQyxJQUFJLENBQUVzQyxpQkFBaUIsQ0FBQzVCLEdBQUcsQ0FBRWlDLEtBQUssSUFBSUEsS0FBSyxDQUFDQyxJQUFJLENBQUUsR0FBSSxDQUFFLENBQUUsQ0FBQyxDQUFDekIsTUFBTSxDQUFFMEIsR0FBRyxJQUFJQSxHQUFHLEtBQUssSUFBSyxDQUFDOztJQUVySDtJQUNBSCxpQkFBaUIsQ0FBQ3pELE9BQU8sQ0FBRTZELGdCQUFnQixJQUFJO01BQzdDL0QsT0FBTyxDQUFDRSxPQUFPLENBQUVQLE1BQU0sSUFBSTtRQUN6QixJQUFJcUUsV0FBVyxHQUFHLElBQUk7UUFDdEIsS0FBTSxNQUFNQyxjQUFjLElBQUl2RSxlQUFlLENBQUVDLE1BQU8sQ0FBQyxFQUFHO1VBQ3hELE1BQU11RSxrQkFBa0IsR0FBR2pFLG1CQUFtQixDQUFFRSxJQUFJLENBQUUsQ0FBRThELGNBQWMsQ0FBRTtVQUN4RSxJQUFLQyxrQkFBa0IsRUFBRztZQUN4QkYsV0FBVyxHQUFHOUUsa0JBQWtCLENBQUNpRixxQkFBcUIsQ0FBRUQsa0JBQWtCLEVBQUVILGdCQUFpQixDQUFDO1lBQzlGLElBQUtDLFdBQVcsRUFBRztjQUNqQjtZQUNGO1VBQ0Y7UUFDRjtRQUNBLElBQUssQ0FBQ0QsZ0JBQWdCLENBQUNLLFFBQVEsQ0FBRSxnQkFBaUIsQ0FBQyxFQUFHO1VBQ3BEckYsTUFBTSxDQUFFaUYsV0FBVyxLQUFLLElBQUksRUFBRyxrQ0FBaUM3RCxJQUFLLElBQUc0RCxnQkFBaUIsRUFBRSxDQUFDO1VBRTVGLE1BQU1NLFNBQVMsR0FBSSxHQUFFL0IscUJBQXFCLENBQUVuQyxJQUFJLENBQUcsSUFBRzRELGdCQUFpQixFQUFDO1VBQ3hFckIsU0FBUyxDQUFFL0MsTUFBTSxDQUFFLENBQUUwRSxTQUFTLENBQUUsR0FBR0wsV0FBVyxDQUFDTSxLQUFLO1VBQ3BELElBQUtOLFdBQVcsQ0FBQ08sUUFBUSxJQUFJNUUsTUFBTSxLQUFLWCxnQkFBZ0IsQ0FBQ1ksZUFBZSxFQUFHO1lBQ3pFK0MsY0FBYyxDQUFFMEIsU0FBUyxDQUFFLEdBQUdMLFdBQVcsQ0FBQ08sUUFBUTtVQUNwRDtRQUNGO01BQ0YsQ0FBRSxDQUFDO0lBQ0wsQ0FBRSxDQUFDO0VBQ0wsQ0FBRSxDQUFDO0VBRUgsT0FBTztJQUFFN0IsU0FBUyxFQUFFQSxTQUFTO0lBQUVDLGNBQWMsRUFBRUE7RUFBZSxDQUFDO0FBQ2pFLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=