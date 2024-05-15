"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
// Copyright 2020-2024, University of Colorado Boulder

/**
 * NOTE: This is only for loading strings in the unbuilt mode.
 *
 * NOTE: This will check the query string value for ?locale directly. See initialize-globals.js for reference.
 *
 * Kicks off the loading of runtime strings very early in the unbuilt loading process, ideally so that it
 * doesn't block the loading of modules. This is because we need the string information to be loaded before we can
 * kick off the module process.
 *
 * It will fill up phet.chipper.strings with the needed values, for use by simulation code and in particular
 * getStringModule. It will then call window.phet.chipper.loadModules() once complete, to progress with the module
 * process.
 *
 * To function properly, phet.chipper.stringRepos will need to be defined before this executes (generally in the
 * initialization script, or in the dev .html).
 *
 * A string "key" is in the form of "NAMESPACE/key.from.strings.json"
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

(function () {
  // Namespace verification
  window.phet = window.phet || {};
  window.phet.chipper = window.phet.chipper || {};

  // Constructing the string map
  window.phet.chipper.strings = {};
  window.phet.chipper.stringMetadata = {};

  // Will be initialized after we have loaded localeData (below)
  var rtlLocales;
  var localesQueryParam = new window.URLSearchParams(window.location.search).get('locales');
  var remainingFilesToProcess = 0;
  var FALLBACK_LOCALE = 'en';

  /**
   * Takes the string-file object for a given locale/requirejsNamespace, and fills in the phet.chipper.strings inside
   * that locale with any recognized strings inside.
   *
   * @param {Object} stringObject - In general, an object where if it has a `value: {string}` key then it represents
   *                                a string key with a value, otherwise each level represents a grouping.
   * @param {string} requirejsNamespace - e.g. 'JOIST'
   * @param {string} locale
   */
  var processStringFile = function processStringFile(stringObject, requirejsNamespace, locale) {
    // See if we are in an RTL locale (lodash is unavailable at this point)
    var isRTL = false;
    rtlLocales.forEach(function (rtlLocale) {
      if (locale.startsWith(rtlLocale)) {
        isRTL = true;
      }
    });
    var stringKeyPrefix = "".concat(requirejsNamespace, "/");

    // Ensure a locale-specific sub-object
    phet.chipper.strings[locale] = phet.chipper.strings[locale] || {};
    var localeStringMap = phet.chipper.strings[locale];
    var recurse = function recurse(path, object) {
      Object.keys(object).forEach(function (key) {
        if (key === 'value') {
          var value = object.value;

          // Add directional marks
          if (value.length > 0) {
            value = "".concat(isRTL ? "\u202B" : "\u202A").concat(value, "\u202C");
          }
          var stringKey = "".concat(stringKeyPrefix).concat(path);
          localeStringMap[stringKey] = value;
          if (locale === FALLBACK_LOCALE && object.metadata) {
            phet.chipper.stringMetadata[stringKey] = object.metadata;
          }
        } else if (object[key] && _typeof(object[key]) === 'object') {
          recurse("".concat(path).concat(path.length ? '.' : '').concat(key), object[key]);
        }
      });
    };
    recurse('', stringObject);
  };

  /**
   * Load a conglomerate string file with many locales. Only used in locales=*
   */
  var processConglomerateStringFile = function processConglomerateStringFile(stringObject, requirejsNamespace) {
    var locales = Object.keys(stringObject);
    locales.forEach(function (locale) {
      // See if we are in an RTL locale (lodash is unavailable at this point)
      var isRTL = false;
      rtlLocales.forEach(function (rtlLocale) {
        if (locale.startsWith(rtlLocale)) {
          isRTL = true;
        }
      });
      var stringKeyPrefix = "".concat(requirejsNamespace, "/");

      // Ensure a locale-specific sub-object
      phet.chipper.strings[locale] = phet.chipper.strings[locale] || {};
      var localeStringMap = phet.chipper.strings[locale];
      var recurse = function recurse(path, object) {
        Object.keys(object).forEach(function (key) {
          if (key === 'value') {
            var value = object.value;

            // Add directional marks
            if (value.length > 0) {
              value = "".concat(isRTL ? "\u202B" : "\u202A").concat(value, "\u202C");
            }
            localeStringMap["".concat(stringKeyPrefix).concat(path)] = value;
          } else if (object[key] && _typeof(object[key]) === 'object') {
            recurse("".concat(path).concat(path.length ? '.' : '').concat(key), object[key]);
          }
        });
      };
      recurse('', stringObject[locale]);
    });
  };

  /**
   * Fires off a request for a JSON file, either in babel (for non-English) strings, or in the actual repo
   * (for English) strings, or for the unbuilt_en strings file. When it is loaded, it will try to parse the response
   * and then pass the object for processing.
   *
   * @param {string} path - Relative path to load JSON file from
   * @param {Function|null} callback
   */
  var requestJSONFile = function requestJSONFile(path, callback) {
    remainingFilesToProcess++;
    var request = new XMLHttpRequest();
    request.addEventListener('load', function () {
      if (request.status === 200) {
        var json;
        try {
          json = JSON.parse(request.responseText);
        } catch (e) {
          throw new Error("Could load file ".concat(path, ", perhaps that translation does not exist yet?"));
        }
        callback && callback(json);
      }
      if (--remainingFilesToProcess === 0) {
        finishProcessing();
      }
    });
    request.addEventListener('error', function () {
      if (!(localesQueryParam === '*')) {
        console.log("Could not load ".concat(path));
      }
      if (--remainingFilesToProcess === 0) {
        finishProcessing();
      }
    });
    request.open('GET', path, true);
    request.send();
  };

  // The callback to execute when all string files are processed.
  var finishProcessing = function finishProcessing() {
    // Progress with loading modules
    window.phet.chipper.loadModules();
  };

  // Check for phet.chipper.stringPath. This should be set to ADJUST the path to the strings directory, in cases
  // where we're running this case NOT from a repo's top level (e.g. sandbox.html)
  var getStringPath = function getStringPath(repo, locale) {
    return "".concat(phet.chipper.stringPath ? phet.chipper.stringPath : '', "../").concat(locale === FALLBACK_LOCALE ? '' : 'babel/').concat(repo, "/").concat(repo, "-strings_").concat(locale, ".json");
  };

  // See if our request for the sim-specific strings file works. If so, only then will we load the common repos files
  // for that locale.
  var ourRepo = phet.chipper.packageObject.name;
  var ourRequirejsNamespace;
  phet.chipper.stringRepos.forEach(function (data) {
    if (data.repo === ourRepo) {
      ourRequirejsNamespace = data.requirejsNamespace;
    }
  });

  // TODO https://github.com/phetsims/phet-io/issues/1877 Uncomment this to load the used string list
  // requestJSONFile( `../phet-io-sim-specific/repos/${ourRepo}/used-strings_en.json`, json => {
  //
  //   // Store for runtime usage
  //   phet.chipper.usedStringsEN = json;
  // } );

  // Load locale data
  remainingFilesToProcess++;
  requestJSONFile('../babel/localeData.json', function (json) {
    phet.chipper.localeData = json;

    // Because load-unbuilt-strings' "loading" of the locale data might not have happened BEFORE initialize-globals
    // runs (and sets phet.chipper.locale), we'll attempt to handle the case where it hasn't been set yet.
    phet.chipper.checkAndRemapLocale && phet.chipper.checkAndRemapLocale();
    rtlLocales = Object.keys(phet.chipper.localeData).filter(function (locale) {
      return phet.chipper.localeData[locale].direction === 'rtl';
    });

    // Load the conglomerate files
    requestJSONFile("../babel/_generated_development_strings/".concat(ourRepo, "_all.json"), function (json) {
      processConglomerateStringFile(json, ourRequirejsNamespace);
      phet.chipper.stringRepos.forEach(function (stringRepoData) {
        var repo = stringRepoData.repo;
        if (repo !== ourRepo) {
          requestJSONFile("../babel/_generated_development_strings/".concat(repo, "_all.json"), function (json) {
            processConglomerateStringFile(json, stringRepoData.requirejsNamespace);
          });
        }
      });
    });

    // Even though the English strings are included in the conglomerate file, load the english file directly so that
    // you can change _en strings without having to run 'grunt generate-unbuilt-strings' before seeing changes.
    requestJSONFile(getStringPath(ourRepo, 'en'), function (json) {
      processStringFile(json, ourRequirejsNamespace, 'en');
      phet.chipper.stringRepos.forEach(function (stringRepoData) {
        var repo = stringRepoData.repo;
        if (repo !== ourRepo) {
          requestJSONFile(getStringPath(repo, 'en'), function (json) {
            processStringFile(json, stringRepoData.requirejsNamespace, 'en');
          });
        }
      });
    });
    remainingFilesToProcess--;
  });
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ3aW5kb3ciLCJwaGV0IiwiY2hpcHBlciIsInN0cmluZ3MiLCJzdHJpbmdNZXRhZGF0YSIsInJ0bExvY2FsZXMiLCJsb2NhbGVzUXVlcnlQYXJhbSIsIlVSTFNlYXJjaFBhcmFtcyIsImxvY2F0aW9uIiwic2VhcmNoIiwiZ2V0IiwicmVtYWluaW5nRmlsZXNUb1Byb2Nlc3MiLCJGQUxMQkFDS19MT0NBTEUiLCJwcm9jZXNzU3RyaW5nRmlsZSIsInN0cmluZ09iamVjdCIsInJlcXVpcmVqc05hbWVzcGFjZSIsImxvY2FsZSIsImlzUlRMIiwiZm9yRWFjaCIsInJ0bExvY2FsZSIsInN0YXJ0c1dpdGgiLCJzdHJpbmdLZXlQcmVmaXgiLCJjb25jYXQiLCJsb2NhbGVTdHJpbmdNYXAiLCJyZWN1cnNlIiwicGF0aCIsIm9iamVjdCIsIk9iamVjdCIsImtleXMiLCJrZXkiLCJ2YWx1ZSIsImxlbmd0aCIsInN0cmluZ0tleSIsIm1ldGFkYXRhIiwiX3R5cGVvZiIsInByb2Nlc3NDb25nbG9tZXJhdGVTdHJpbmdGaWxlIiwibG9jYWxlcyIsInJlcXVlc3RKU09ORmlsZSIsImNhbGxiYWNrIiwicmVxdWVzdCIsIlhNTEh0dHBSZXF1ZXN0IiwiYWRkRXZlbnRMaXN0ZW5lciIsInN0YXR1cyIsImpzb24iLCJKU09OIiwicGFyc2UiLCJyZXNwb25zZVRleHQiLCJlIiwiRXJyb3IiLCJmaW5pc2hQcm9jZXNzaW5nIiwiY29uc29sZSIsImxvZyIsIm9wZW4iLCJzZW5kIiwibG9hZE1vZHVsZXMiLCJnZXRTdHJpbmdQYXRoIiwicmVwbyIsInN0cmluZ1BhdGgiLCJvdXJSZXBvIiwicGFja2FnZU9iamVjdCIsIm5hbWUiLCJvdXJSZXF1aXJlanNOYW1lc3BhY2UiLCJzdHJpbmdSZXBvcyIsImRhdGEiLCJsb2NhbGVEYXRhIiwiY2hlY2tBbmRSZW1hcExvY2FsZSIsImZpbHRlciIsImRpcmVjdGlvbiIsInN0cmluZ1JlcG9EYXRhIl0sInNvdXJjZXMiOlsibG9hZC11bmJ1aWx0LXN0cmluZ3MuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjAtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogTk9URTogVGhpcyBpcyBvbmx5IGZvciBsb2FkaW5nIHN0cmluZ3MgaW4gdGhlIHVuYnVpbHQgbW9kZS5cclxuICpcclxuICogTk9URTogVGhpcyB3aWxsIGNoZWNrIHRoZSBxdWVyeSBzdHJpbmcgdmFsdWUgZm9yID9sb2NhbGUgZGlyZWN0bHkuIFNlZSBpbml0aWFsaXplLWdsb2JhbHMuanMgZm9yIHJlZmVyZW5jZS5cclxuICpcclxuICogS2lja3Mgb2ZmIHRoZSBsb2FkaW5nIG9mIHJ1bnRpbWUgc3RyaW5ncyB2ZXJ5IGVhcmx5IGluIHRoZSB1bmJ1aWx0IGxvYWRpbmcgcHJvY2VzcywgaWRlYWxseSBzbyB0aGF0IGl0XHJcbiAqIGRvZXNuJ3QgYmxvY2sgdGhlIGxvYWRpbmcgb2YgbW9kdWxlcy4gVGhpcyBpcyBiZWNhdXNlIHdlIG5lZWQgdGhlIHN0cmluZyBpbmZvcm1hdGlvbiB0byBiZSBsb2FkZWQgYmVmb3JlIHdlIGNhblxyXG4gKiBraWNrIG9mZiB0aGUgbW9kdWxlIHByb2Nlc3MuXHJcbiAqXHJcbiAqIEl0IHdpbGwgZmlsbCB1cCBwaGV0LmNoaXBwZXIuc3RyaW5ncyB3aXRoIHRoZSBuZWVkZWQgdmFsdWVzLCBmb3IgdXNlIGJ5IHNpbXVsYXRpb24gY29kZSBhbmQgaW4gcGFydGljdWxhclxyXG4gKiBnZXRTdHJpbmdNb2R1bGUuIEl0IHdpbGwgdGhlbiBjYWxsIHdpbmRvdy5waGV0LmNoaXBwZXIubG9hZE1vZHVsZXMoKSBvbmNlIGNvbXBsZXRlLCB0byBwcm9ncmVzcyB3aXRoIHRoZSBtb2R1bGVcclxuICogcHJvY2Vzcy5cclxuICpcclxuICogVG8gZnVuY3Rpb24gcHJvcGVybHksIHBoZXQuY2hpcHBlci5zdHJpbmdSZXBvcyB3aWxsIG5lZWQgdG8gYmUgZGVmaW5lZCBiZWZvcmUgdGhpcyBleGVjdXRlcyAoZ2VuZXJhbGx5IGluIHRoZVxyXG4gKiBpbml0aWFsaXphdGlvbiBzY3JpcHQsIG9yIGluIHRoZSBkZXYgLmh0bWwpLlxyXG4gKlxyXG4gKiBBIHN0cmluZyBcImtleVwiIGlzIGluIHRoZSBmb3JtIG9mIFwiTkFNRVNQQUNFL2tleS5mcm9tLnN0cmluZ3MuanNvblwiXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG4oICgpID0+IHtcclxuICAvLyBOYW1lc3BhY2UgdmVyaWZpY2F0aW9uXHJcbiAgd2luZG93LnBoZXQgPSB3aW5kb3cucGhldCB8fCB7fTtcclxuICB3aW5kb3cucGhldC5jaGlwcGVyID0gd2luZG93LnBoZXQuY2hpcHBlciB8fCB7fTtcclxuXHJcbiAgLy8gQ29uc3RydWN0aW5nIHRoZSBzdHJpbmcgbWFwXHJcbiAgd2luZG93LnBoZXQuY2hpcHBlci5zdHJpbmdzID0ge307XHJcbiAgd2luZG93LnBoZXQuY2hpcHBlci5zdHJpbmdNZXRhZGF0YSA9IHt9O1xyXG5cclxuICAvLyBXaWxsIGJlIGluaXRpYWxpemVkIGFmdGVyIHdlIGhhdmUgbG9hZGVkIGxvY2FsZURhdGEgKGJlbG93KVxyXG4gIGxldCBydGxMb2NhbGVzO1xyXG5cclxuICBjb25zdCBsb2NhbGVzUXVlcnlQYXJhbSA9IG5ldyB3aW5kb3cuVVJMU2VhcmNoUGFyYW1zKCB3aW5kb3cubG9jYXRpb24uc2VhcmNoICkuZ2V0KCAnbG9jYWxlcycgKTtcclxuXHJcbiAgbGV0IHJlbWFpbmluZ0ZpbGVzVG9Qcm9jZXNzID0gMDtcclxuXHJcbiAgY29uc3QgRkFMTEJBQ0tfTE9DQUxFID0gJ2VuJztcclxuXHJcbiAgLyoqXHJcbiAgICogVGFrZXMgdGhlIHN0cmluZy1maWxlIG9iamVjdCBmb3IgYSBnaXZlbiBsb2NhbGUvcmVxdWlyZWpzTmFtZXNwYWNlLCBhbmQgZmlsbHMgaW4gdGhlIHBoZXQuY2hpcHBlci5zdHJpbmdzIGluc2lkZVxyXG4gICAqIHRoYXQgbG9jYWxlIHdpdGggYW55IHJlY29nbml6ZWQgc3RyaW5ncyBpbnNpZGUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gc3RyaW5nT2JqZWN0IC0gSW4gZ2VuZXJhbCwgYW4gb2JqZWN0IHdoZXJlIGlmIGl0IGhhcyBhIGB2YWx1ZToge3N0cmluZ31gIGtleSB0aGVuIGl0IHJlcHJlc2VudHNcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYSBzdHJpbmcga2V5IHdpdGggYSB2YWx1ZSwgb3RoZXJ3aXNlIGVhY2ggbGV2ZWwgcmVwcmVzZW50cyBhIGdyb3VwaW5nLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZXF1aXJlanNOYW1lc3BhY2UgLSBlLmcuICdKT0lTVCdcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbG9jYWxlXHJcbiAgICovXHJcbiAgY29uc3QgcHJvY2Vzc1N0cmluZ0ZpbGUgPSAoIHN0cmluZ09iamVjdCwgcmVxdWlyZWpzTmFtZXNwYWNlLCBsb2NhbGUgKSA9PiB7XHJcbiAgICAvLyBTZWUgaWYgd2UgYXJlIGluIGFuIFJUTCBsb2NhbGUgKGxvZGFzaCBpcyB1bmF2YWlsYWJsZSBhdCB0aGlzIHBvaW50KVxyXG4gICAgbGV0IGlzUlRMID0gZmFsc2U7XHJcbiAgICBydGxMb2NhbGVzLmZvckVhY2goIHJ0bExvY2FsZSA9PiB7XHJcbiAgICAgIGlmICggbG9jYWxlLnN0YXJ0c1dpdGgoIHJ0bExvY2FsZSApICkge1xyXG4gICAgICAgIGlzUlRMID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IHN0cmluZ0tleVByZWZpeCA9IGAke3JlcXVpcmVqc05hbWVzcGFjZX0vYDtcclxuXHJcbiAgICAvLyBFbnN1cmUgYSBsb2NhbGUtc3BlY2lmaWMgc3ViLW9iamVjdFxyXG4gICAgcGhldC5jaGlwcGVyLnN0cmluZ3NbIGxvY2FsZSBdID0gcGhldC5jaGlwcGVyLnN0cmluZ3NbIGxvY2FsZSBdIHx8IHt9O1xyXG4gICAgY29uc3QgbG9jYWxlU3RyaW5nTWFwID0gcGhldC5jaGlwcGVyLnN0cmluZ3NbIGxvY2FsZSBdO1xyXG5cclxuICAgIGNvbnN0IHJlY3Vyc2UgPSAoIHBhdGgsIG9iamVjdCApID0+IHtcclxuICAgICAgT2JqZWN0LmtleXMoIG9iamVjdCApLmZvckVhY2goIGtleSA9PiB7XHJcbiAgICAgICAgaWYgKCBrZXkgPT09ICd2YWx1ZScgKSB7XHJcbiAgICAgICAgICBsZXQgdmFsdWUgPSBvYmplY3QudmFsdWU7XHJcblxyXG4gICAgICAgICAgLy8gQWRkIGRpcmVjdGlvbmFsIG1hcmtzXHJcbiAgICAgICAgICBpZiAoIHZhbHVlLmxlbmd0aCA+IDAgKSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gYCR7KCBpc1JUTCA/ICdcXHUyMDJiJyA6ICdcXHUyMDJhJyApfSR7dmFsdWV9XFx1MjAyY2A7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY29uc3Qgc3RyaW5nS2V5ID0gYCR7c3RyaW5nS2V5UHJlZml4fSR7cGF0aH1gO1xyXG5cclxuICAgICAgICAgIGxvY2FsZVN0cmluZ01hcFsgc3RyaW5nS2V5IF0gPSB2YWx1ZTtcclxuXHJcbiAgICAgICAgICBpZiAoIGxvY2FsZSA9PT0gRkFMTEJBQ0tfTE9DQUxFICYmIG9iamVjdC5tZXRhZGF0YSApIHtcclxuICAgICAgICAgICAgcGhldC5jaGlwcGVyLnN0cmluZ01ldGFkYXRhWyBzdHJpbmdLZXkgXSA9IG9iamVjdC5tZXRhZGF0YTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIG9iamVjdFsga2V5IF0gJiYgdHlwZW9mIG9iamVjdFsga2V5IF0gPT09ICdvYmplY3QnICkge1xyXG4gICAgICAgICAgcmVjdXJzZSggYCR7cGF0aH0ke3BhdGgubGVuZ3RoID8gJy4nIDogJyd9JHtrZXl9YCwgb2JqZWN0WyBrZXkgXSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG4gICAgfTtcclxuICAgIHJlY3Vyc2UoICcnLCBzdHJpbmdPYmplY3QgKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBMb2FkIGEgY29uZ2xvbWVyYXRlIHN0cmluZyBmaWxlIHdpdGggbWFueSBsb2NhbGVzLiBPbmx5IHVzZWQgaW4gbG9jYWxlcz0qXHJcbiAgICovXHJcbiAgY29uc3QgcHJvY2Vzc0Nvbmdsb21lcmF0ZVN0cmluZ0ZpbGUgPSAoIHN0cmluZ09iamVjdCwgcmVxdWlyZWpzTmFtZXNwYWNlICkgPT4ge1xyXG5cclxuICAgIGNvbnN0IGxvY2FsZXMgPSBPYmplY3Qua2V5cyggc3RyaW5nT2JqZWN0ICk7XHJcblxyXG4gICAgbG9jYWxlcy5mb3JFYWNoKCBsb2NhbGUgPT4ge1xyXG5cclxuICAgICAgLy8gU2VlIGlmIHdlIGFyZSBpbiBhbiBSVEwgbG9jYWxlIChsb2Rhc2ggaXMgdW5hdmFpbGFibGUgYXQgdGhpcyBwb2ludClcclxuICAgICAgbGV0IGlzUlRMID0gZmFsc2U7XHJcbiAgICAgIHJ0bExvY2FsZXMuZm9yRWFjaCggcnRsTG9jYWxlID0+IHtcclxuICAgICAgICBpZiAoIGxvY2FsZS5zdGFydHNXaXRoKCBydGxMb2NhbGUgKSApIHtcclxuICAgICAgICAgIGlzUlRMID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGNvbnN0IHN0cmluZ0tleVByZWZpeCA9IGAke3JlcXVpcmVqc05hbWVzcGFjZX0vYDtcclxuXHJcbiAgICAgIC8vIEVuc3VyZSBhIGxvY2FsZS1zcGVjaWZpYyBzdWItb2JqZWN0XHJcbiAgICAgIHBoZXQuY2hpcHBlci5zdHJpbmdzWyBsb2NhbGUgXSA9IHBoZXQuY2hpcHBlci5zdHJpbmdzWyBsb2NhbGUgXSB8fCB7fTtcclxuICAgICAgY29uc3QgbG9jYWxlU3RyaW5nTWFwID0gcGhldC5jaGlwcGVyLnN0cmluZ3NbIGxvY2FsZSBdO1xyXG5cclxuICAgICAgY29uc3QgcmVjdXJzZSA9ICggcGF0aCwgb2JqZWN0ICkgPT4ge1xyXG4gICAgICAgIE9iamVjdC5rZXlzKCBvYmplY3QgKS5mb3JFYWNoKCBrZXkgPT4ge1xyXG4gICAgICAgICAgaWYgKCBrZXkgPT09ICd2YWx1ZScgKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IG9iamVjdC52YWx1ZTtcclxuXHJcbiAgICAgICAgICAgIC8vIEFkZCBkaXJlY3Rpb25hbCBtYXJrc1xyXG4gICAgICAgICAgICBpZiAoIHZhbHVlLmxlbmd0aCA+IDAgKSB7XHJcbiAgICAgICAgICAgICAgdmFsdWUgPSBgJHsoIGlzUlRMID8gJ1xcdTIwMmInIDogJ1xcdTIwMmEnICl9JHt2YWx1ZX1cXHUyMDJjYDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbG9jYWxlU3RyaW5nTWFwWyBgJHtzdHJpbmdLZXlQcmVmaXh9JHtwYXRofWAgXSA9IHZhbHVlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSBpZiAoIG9iamVjdFsga2V5IF0gJiYgdHlwZW9mIG9iamVjdFsga2V5IF0gPT09ICdvYmplY3QnICkge1xyXG4gICAgICAgICAgICByZWN1cnNlKCBgJHtwYXRofSR7cGF0aC5sZW5ndGggPyAnLicgOiAnJ30ke2tleX1gLCBvYmplY3RbIGtleSBdICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9O1xyXG4gICAgICByZWN1cnNlKCAnJywgc3RyaW5nT2JqZWN0WyBsb2NhbGUgXSApO1xyXG4gICAgfSApO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEZpcmVzIG9mZiBhIHJlcXVlc3QgZm9yIGEgSlNPTiBmaWxlLCBlaXRoZXIgaW4gYmFiZWwgKGZvciBub24tRW5nbGlzaCkgc3RyaW5ncywgb3IgaW4gdGhlIGFjdHVhbCByZXBvXHJcbiAgICogKGZvciBFbmdsaXNoKSBzdHJpbmdzLCBvciBmb3IgdGhlIHVuYnVpbHRfZW4gc3RyaW5ncyBmaWxlLiBXaGVuIGl0IGlzIGxvYWRlZCwgaXQgd2lsbCB0cnkgdG8gcGFyc2UgdGhlIHJlc3BvbnNlXHJcbiAgICogYW5kIHRoZW4gcGFzcyB0aGUgb2JqZWN0IGZvciBwcm9jZXNzaW5nLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBSZWxhdGl2ZSBwYXRoIHRvIGxvYWQgSlNPTiBmaWxlIGZyb21cclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufG51bGx9IGNhbGxiYWNrXHJcbiAgICovXHJcbiAgY29uc3QgcmVxdWVzdEpTT05GaWxlID0gKCBwYXRoLCBjYWxsYmFjayApID0+IHtcclxuICAgIHJlbWFpbmluZ0ZpbGVzVG9Qcm9jZXNzKys7XHJcblxyXG4gICAgY29uc3QgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG4gICAgcmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKCAnbG9hZCcsICgpID0+IHtcclxuICAgICAgaWYgKCByZXF1ZXN0LnN0YXR1cyA9PT0gMjAwICkge1xyXG4gICAgICAgIGxldCBqc29uO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBqc29uID0gSlNPTi5wYXJzZSggcmVxdWVzdC5yZXNwb25zZVRleHQgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIGBDb3VsZCBsb2FkIGZpbGUgJHtwYXRofSwgcGVyaGFwcyB0aGF0IHRyYW5zbGF0aW9uIGRvZXMgbm90IGV4aXN0IHlldD9gICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKCBqc29uICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCAtLXJlbWFpbmluZ0ZpbGVzVG9Qcm9jZXNzID09PSAwICkge1xyXG4gICAgICAgIGZpbmlzaFByb2Nlc3NpbmcoKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lciggJ2Vycm9yJywgKCkgPT4ge1xyXG4gICAgICBpZiAoICEoIGxvY2FsZXNRdWVyeVBhcmFtID09PSAnKicgKSApIHtcclxuICAgICAgICBjb25zb2xlLmxvZyggYENvdWxkIG5vdCBsb2FkICR7cGF0aH1gICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCAtLXJlbWFpbmluZ0ZpbGVzVG9Qcm9jZXNzID09PSAwICkge1xyXG4gICAgICAgIGZpbmlzaFByb2Nlc3NpbmcoKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIHJlcXVlc3Qub3BlbiggJ0dFVCcsIHBhdGgsIHRydWUgKTtcclxuICAgIHJlcXVlc3Quc2VuZCgpO1xyXG4gIH07XHJcblxyXG4gIC8vIFRoZSBjYWxsYmFjayB0byBleGVjdXRlIHdoZW4gYWxsIHN0cmluZyBmaWxlcyBhcmUgcHJvY2Vzc2VkLlxyXG4gIGNvbnN0IGZpbmlzaFByb2Nlc3NpbmcgPSAoKSA9PiB7XHJcblxyXG4gICAgLy8gUHJvZ3Jlc3Mgd2l0aCBsb2FkaW5nIG1vZHVsZXNcclxuICAgIHdpbmRvdy5waGV0LmNoaXBwZXIubG9hZE1vZHVsZXMoKTtcclxuICB9O1xyXG5cclxuICAvLyBDaGVjayBmb3IgcGhldC5jaGlwcGVyLnN0cmluZ1BhdGguIFRoaXMgc2hvdWxkIGJlIHNldCB0byBBREpVU1QgdGhlIHBhdGggdG8gdGhlIHN0cmluZ3MgZGlyZWN0b3J5LCBpbiBjYXNlc1xyXG4gIC8vIHdoZXJlIHdlJ3JlIHJ1bm5pbmcgdGhpcyBjYXNlIE5PVCBmcm9tIGEgcmVwbydzIHRvcCBsZXZlbCAoZS5nLiBzYW5kYm94Lmh0bWwpXHJcbiAgY29uc3QgZ2V0U3RyaW5nUGF0aCA9ICggcmVwbywgbG9jYWxlICkgPT4gYCR7cGhldC5jaGlwcGVyLnN0cmluZ1BhdGggPyBwaGV0LmNoaXBwZXIuc3RyaW5nUGF0aCA6ICcnfS4uLyR7bG9jYWxlID09PSBGQUxMQkFDS19MT0NBTEUgPyAnJyA6ICdiYWJlbC8nfSR7cmVwb30vJHtyZXBvfS1zdHJpbmdzXyR7bG9jYWxlfS5qc29uYDtcclxuXHJcbiAgLy8gU2VlIGlmIG91ciByZXF1ZXN0IGZvciB0aGUgc2ltLXNwZWNpZmljIHN0cmluZ3MgZmlsZSB3b3Jrcy4gSWYgc28sIG9ubHkgdGhlbiB3aWxsIHdlIGxvYWQgdGhlIGNvbW1vbiByZXBvcyBmaWxlc1xyXG4gIC8vIGZvciB0aGF0IGxvY2FsZS5cclxuICBjb25zdCBvdXJSZXBvID0gcGhldC5jaGlwcGVyLnBhY2thZ2VPYmplY3QubmFtZTtcclxuICBsZXQgb3VyUmVxdWlyZWpzTmFtZXNwYWNlO1xyXG4gIHBoZXQuY2hpcHBlci5zdHJpbmdSZXBvcy5mb3JFYWNoKCBkYXRhID0+IHtcclxuICAgIGlmICggZGF0YS5yZXBvID09PSBvdXJSZXBvICkge1xyXG4gICAgICBvdXJSZXF1aXJlanNOYW1lc3BhY2UgPSBkYXRhLnJlcXVpcmVqc05hbWVzcGFjZTtcclxuICAgIH1cclxuICB9ICk7XHJcblxyXG4gIC8vIFRPRE8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXQtaW8vaXNzdWVzLzE4NzcgVW5jb21tZW50IHRoaXMgdG8gbG9hZCB0aGUgdXNlZCBzdHJpbmcgbGlzdFxyXG4gIC8vIHJlcXVlc3RKU09ORmlsZSggYC4uL3BoZXQtaW8tc2ltLXNwZWNpZmljL3JlcG9zLyR7b3VyUmVwb30vdXNlZC1zdHJpbmdzX2VuLmpzb25gLCBqc29uID0+IHtcclxuICAvL1xyXG4gIC8vICAgLy8gU3RvcmUgZm9yIHJ1bnRpbWUgdXNhZ2VcclxuICAvLyAgIHBoZXQuY2hpcHBlci51c2VkU3RyaW5nc0VOID0ganNvbjtcclxuICAvLyB9ICk7XHJcblxyXG4gIC8vIExvYWQgbG9jYWxlIGRhdGFcclxuICByZW1haW5pbmdGaWxlc1RvUHJvY2VzcysrO1xyXG4gIHJlcXVlc3RKU09ORmlsZSggJy4uL2JhYmVsL2xvY2FsZURhdGEuanNvbicsIGpzb24gPT4ge1xyXG4gICAgcGhldC5jaGlwcGVyLmxvY2FsZURhdGEgPSBqc29uO1xyXG5cclxuICAgIC8vIEJlY2F1c2UgbG9hZC11bmJ1aWx0LXN0cmluZ3MnIFwibG9hZGluZ1wiIG9mIHRoZSBsb2NhbGUgZGF0YSBtaWdodCBub3QgaGF2ZSBoYXBwZW5lZCBCRUZPUkUgaW5pdGlhbGl6ZS1nbG9iYWxzXHJcbiAgICAvLyBydW5zIChhbmQgc2V0cyBwaGV0LmNoaXBwZXIubG9jYWxlKSwgd2UnbGwgYXR0ZW1wdCB0byBoYW5kbGUgdGhlIGNhc2Ugd2hlcmUgaXQgaGFzbid0IGJlZW4gc2V0IHlldC5cclxuICAgIHBoZXQuY2hpcHBlci5jaGVja0FuZFJlbWFwTG9jYWxlICYmIHBoZXQuY2hpcHBlci5jaGVja0FuZFJlbWFwTG9jYWxlKCk7XHJcblxyXG4gICAgcnRsTG9jYWxlcyA9IE9iamVjdC5rZXlzKCBwaGV0LmNoaXBwZXIubG9jYWxlRGF0YSApLmZpbHRlciggbG9jYWxlID0+IHtcclxuICAgICAgcmV0dXJuIHBoZXQuY2hpcHBlci5sb2NhbGVEYXRhWyBsb2NhbGUgXS5kaXJlY3Rpb24gPT09ICdydGwnO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIExvYWQgdGhlIGNvbmdsb21lcmF0ZSBmaWxlc1xyXG4gICAgcmVxdWVzdEpTT05GaWxlKCBgLi4vYmFiZWwvX2dlbmVyYXRlZF9kZXZlbG9wbWVudF9zdHJpbmdzLyR7b3VyUmVwb31fYWxsLmpzb25gLCBqc29uID0+IHtcclxuICAgICAgcHJvY2Vzc0Nvbmdsb21lcmF0ZVN0cmluZ0ZpbGUoIGpzb24sIG91clJlcXVpcmVqc05hbWVzcGFjZSApO1xyXG4gICAgICBwaGV0LmNoaXBwZXIuc3RyaW5nUmVwb3MuZm9yRWFjaCggc3RyaW5nUmVwb0RhdGEgPT4ge1xyXG4gICAgICAgIGNvbnN0IHJlcG8gPSBzdHJpbmdSZXBvRGF0YS5yZXBvO1xyXG4gICAgICAgIGlmICggcmVwbyAhPT0gb3VyUmVwbyApIHtcclxuICAgICAgICAgIHJlcXVlc3RKU09ORmlsZSggYC4uL2JhYmVsL19nZW5lcmF0ZWRfZGV2ZWxvcG1lbnRfc3RyaW5ncy8ke3JlcG99X2FsbC5qc29uYCwganNvbiA9PiB7XHJcbiAgICAgICAgICAgIHByb2Nlc3NDb25nbG9tZXJhdGVTdHJpbmdGaWxlKCBqc29uLCBzdHJpbmdSZXBvRGF0YS5yZXF1aXJlanNOYW1lc3BhY2UgKTtcclxuICAgICAgICAgIH0gKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBFdmVuIHRob3VnaCB0aGUgRW5nbGlzaCBzdHJpbmdzIGFyZSBpbmNsdWRlZCBpbiB0aGUgY29uZ2xvbWVyYXRlIGZpbGUsIGxvYWQgdGhlIGVuZ2xpc2ggZmlsZSBkaXJlY3RseSBzbyB0aGF0XHJcbiAgICAvLyB5b3UgY2FuIGNoYW5nZSBfZW4gc3RyaW5ncyB3aXRob3V0IGhhdmluZyB0byBydW4gJ2dydW50IGdlbmVyYXRlLXVuYnVpbHQtc3RyaW5ncycgYmVmb3JlIHNlZWluZyBjaGFuZ2VzLlxyXG4gICAgcmVxdWVzdEpTT05GaWxlKCBnZXRTdHJpbmdQYXRoKCBvdXJSZXBvLCAnZW4nICksIGpzb24gPT4ge1xyXG4gICAgICBwcm9jZXNzU3RyaW5nRmlsZSgganNvbiwgb3VyUmVxdWlyZWpzTmFtZXNwYWNlLCAnZW4nICk7XHJcbiAgICAgIHBoZXQuY2hpcHBlci5zdHJpbmdSZXBvcy5mb3JFYWNoKCBzdHJpbmdSZXBvRGF0YSA9PiB7XHJcbiAgICAgICAgY29uc3QgcmVwbyA9IHN0cmluZ1JlcG9EYXRhLnJlcG87XHJcbiAgICAgICAgaWYgKCByZXBvICE9PSBvdXJSZXBvICkge1xyXG4gICAgICAgICAgcmVxdWVzdEpTT05GaWxlKCBnZXRTdHJpbmdQYXRoKCByZXBvLCAnZW4nICksIGpzb24gPT4ge1xyXG4gICAgICAgICAgICBwcm9jZXNzU3RyaW5nRmlsZSgganNvbiwgc3RyaW5nUmVwb0RhdGEucmVxdWlyZWpzTmFtZXNwYWNlLCAnZW4nICk7XHJcbiAgICAgICAgICB9ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgcmVtYWluaW5nRmlsZXNUb1Byb2Nlc3MtLTtcclxuICB9ICk7XHJcbn0gKSgpOyJdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxDQUFFLFlBQU07RUFDTjtFQUNBQSxNQUFNLENBQUNDLElBQUksR0FBR0QsTUFBTSxDQUFDQyxJQUFJLElBQUksQ0FBQyxDQUFDO0VBQy9CRCxNQUFNLENBQUNDLElBQUksQ0FBQ0MsT0FBTyxHQUFHRixNQUFNLENBQUNDLElBQUksQ0FBQ0MsT0FBTyxJQUFJLENBQUMsQ0FBQzs7RUFFL0M7RUFDQUYsTUFBTSxDQUFDQyxJQUFJLENBQUNDLE9BQU8sQ0FBQ0MsT0FBTyxHQUFHLENBQUMsQ0FBQztFQUNoQ0gsTUFBTSxDQUFDQyxJQUFJLENBQUNDLE9BQU8sQ0FBQ0UsY0FBYyxHQUFHLENBQUMsQ0FBQzs7RUFFdkM7RUFDQSxJQUFJQyxVQUFVO0VBRWQsSUFBTUMsaUJBQWlCLEdBQUcsSUFBSU4sTUFBTSxDQUFDTyxlQUFlLENBQUVQLE1BQU0sQ0FBQ1EsUUFBUSxDQUFDQyxNQUFPLENBQUMsQ0FBQ0MsR0FBRyxDQUFFLFNBQVUsQ0FBQztFQUUvRixJQUFJQyx1QkFBdUIsR0FBRyxDQUFDO0VBRS9CLElBQU1DLGVBQWUsR0FBRyxJQUFJOztFQUU1QjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxJQUFNQyxpQkFBaUIsR0FBRyxTQUFwQkEsaUJBQWlCQSxDQUFLQyxZQUFZLEVBQUVDLGtCQUFrQixFQUFFQyxNQUFNLEVBQU07SUFDeEU7SUFDQSxJQUFJQyxLQUFLLEdBQUcsS0FBSztJQUNqQlosVUFBVSxDQUFDYSxPQUFPLENBQUUsVUFBQUMsU0FBUyxFQUFJO01BQy9CLElBQUtILE1BQU0sQ0FBQ0ksVUFBVSxDQUFFRCxTQUFVLENBQUMsRUFBRztRQUNwQ0YsS0FBSyxHQUFHLElBQUk7TUFDZDtJQUNGLENBQUUsQ0FBQztJQUVILElBQU1JLGVBQWUsTUFBQUMsTUFBQSxDQUFNUCxrQkFBa0IsTUFBRzs7SUFFaEQ7SUFDQWQsSUFBSSxDQUFDQyxPQUFPLENBQUNDLE9BQU8sQ0FBRWEsTUFBTSxDQUFFLEdBQUdmLElBQUksQ0FBQ0MsT0FBTyxDQUFDQyxPQUFPLENBQUVhLE1BQU0sQ0FBRSxJQUFJLENBQUMsQ0FBQztJQUNyRSxJQUFNTyxlQUFlLEdBQUd0QixJQUFJLENBQUNDLE9BQU8sQ0FBQ0MsT0FBTyxDQUFFYSxNQUFNLENBQUU7SUFFdEQsSUFBTVEsT0FBTyxHQUFHLFNBQVZBLE9BQU9BLENBQUtDLElBQUksRUFBRUMsTUFBTSxFQUFNO01BQ2xDQyxNQUFNLENBQUNDLElBQUksQ0FBRUYsTUFBTyxDQUFDLENBQUNSLE9BQU8sQ0FBRSxVQUFBVyxHQUFHLEVBQUk7UUFDcEMsSUFBS0EsR0FBRyxLQUFLLE9BQU8sRUFBRztVQUNyQixJQUFJQyxLQUFLLEdBQUdKLE1BQU0sQ0FBQ0ksS0FBSzs7VUFFeEI7VUFDQSxJQUFLQSxLQUFLLENBQUNDLE1BQU0sR0FBRyxDQUFDLEVBQUc7WUFDdEJELEtBQUssTUFBQVIsTUFBQSxDQUFRTCxLQUFLLEdBQUcsUUFBUSxHQUFHLFFBQVEsRUFBQUssTUFBQSxDQUFLUSxLQUFLLFdBQVE7VUFDNUQ7VUFFQSxJQUFNRSxTQUFTLE1BQUFWLE1BQUEsQ0FBTUQsZUFBZSxFQUFBQyxNQUFBLENBQUdHLElBQUksQ0FBRTtVQUU3Q0YsZUFBZSxDQUFFUyxTQUFTLENBQUUsR0FBR0YsS0FBSztVQUVwQyxJQUFLZCxNQUFNLEtBQUtKLGVBQWUsSUFBSWMsTUFBTSxDQUFDTyxRQUFRLEVBQUc7WUFDbkRoQyxJQUFJLENBQUNDLE9BQU8sQ0FBQ0UsY0FBYyxDQUFFNEIsU0FBUyxDQUFFLEdBQUdOLE1BQU0sQ0FBQ08sUUFBUTtVQUM1RDtRQUNGLENBQUMsTUFDSSxJQUFLUCxNQUFNLENBQUVHLEdBQUcsQ0FBRSxJQUFJSyxPQUFBLENBQU9SLE1BQU0sQ0FBRUcsR0FBRyxDQUFFLE1BQUssUUFBUSxFQUFHO1VBQzdETCxPQUFPLElBQUFGLE1BQUEsQ0FBS0csSUFBSSxFQUFBSCxNQUFBLENBQUdHLElBQUksQ0FBQ00sTUFBTSxHQUFHLEdBQUcsR0FBRyxFQUFFLEVBQUFULE1BQUEsQ0FBR08sR0FBRyxHQUFJSCxNQUFNLENBQUVHLEdBQUcsQ0FBRyxDQUFDO1FBQ3BFO01BQ0YsQ0FBRSxDQUFDO0lBQ0wsQ0FBQztJQUNETCxPQUFPLENBQUUsRUFBRSxFQUFFVixZQUFhLENBQUM7RUFDN0IsQ0FBQzs7RUFFRDtBQUNGO0FBQ0E7RUFDRSxJQUFNcUIsNkJBQTZCLEdBQUcsU0FBaENBLDZCQUE2QkEsQ0FBS3JCLFlBQVksRUFBRUMsa0JBQWtCLEVBQU07SUFFNUUsSUFBTXFCLE9BQU8sR0FBR1QsTUFBTSxDQUFDQyxJQUFJLENBQUVkLFlBQWEsQ0FBQztJQUUzQ3NCLE9BQU8sQ0FBQ2xCLE9BQU8sQ0FBRSxVQUFBRixNQUFNLEVBQUk7TUFFekI7TUFDQSxJQUFJQyxLQUFLLEdBQUcsS0FBSztNQUNqQlosVUFBVSxDQUFDYSxPQUFPLENBQUUsVUFBQUMsU0FBUyxFQUFJO1FBQy9CLElBQUtILE1BQU0sQ0FBQ0ksVUFBVSxDQUFFRCxTQUFVLENBQUMsRUFBRztVQUNwQ0YsS0FBSyxHQUFHLElBQUk7UUFDZDtNQUNGLENBQUUsQ0FBQztNQUVILElBQU1JLGVBQWUsTUFBQUMsTUFBQSxDQUFNUCxrQkFBa0IsTUFBRzs7TUFFaEQ7TUFDQWQsSUFBSSxDQUFDQyxPQUFPLENBQUNDLE9BQU8sQ0FBRWEsTUFBTSxDQUFFLEdBQUdmLElBQUksQ0FBQ0MsT0FBTyxDQUFDQyxPQUFPLENBQUVhLE1BQU0sQ0FBRSxJQUFJLENBQUMsQ0FBQztNQUNyRSxJQUFNTyxlQUFlLEdBQUd0QixJQUFJLENBQUNDLE9BQU8sQ0FBQ0MsT0FBTyxDQUFFYSxNQUFNLENBQUU7TUFFdEQsSUFBTVEsT0FBTyxHQUFHLFNBQVZBLE9BQU9BLENBQUtDLElBQUksRUFBRUMsTUFBTSxFQUFNO1FBQ2xDQyxNQUFNLENBQUNDLElBQUksQ0FBRUYsTUFBTyxDQUFDLENBQUNSLE9BQU8sQ0FBRSxVQUFBVyxHQUFHLEVBQUk7VUFDcEMsSUFBS0EsR0FBRyxLQUFLLE9BQU8sRUFBRztZQUNyQixJQUFJQyxLQUFLLEdBQUdKLE1BQU0sQ0FBQ0ksS0FBSzs7WUFFeEI7WUFDQSxJQUFLQSxLQUFLLENBQUNDLE1BQU0sR0FBRyxDQUFDLEVBQUc7Y0FDdEJELEtBQUssTUFBQVIsTUFBQSxDQUFRTCxLQUFLLEdBQUcsUUFBUSxHQUFHLFFBQVEsRUFBQUssTUFBQSxDQUFLUSxLQUFLLFdBQVE7WUFDNUQ7WUFFQVAsZUFBZSxJQUFBRCxNQUFBLENBQUtELGVBQWUsRUFBQUMsTUFBQSxDQUFHRyxJQUFJLEVBQUksR0FBR0ssS0FBSztVQUN4RCxDQUFDLE1BQ0ksSUFBS0osTUFBTSxDQUFFRyxHQUFHLENBQUUsSUFBSUssT0FBQSxDQUFPUixNQUFNLENBQUVHLEdBQUcsQ0FBRSxNQUFLLFFBQVEsRUFBRztZQUM3REwsT0FBTyxJQUFBRixNQUFBLENBQUtHLElBQUksRUFBQUgsTUFBQSxDQUFHRyxJQUFJLENBQUNNLE1BQU0sR0FBRyxHQUFHLEdBQUcsRUFBRSxFQUFBVCxNQUFBLENBQUdPLEdBQUcsR0FBSUgsTUFBTSxDQUFFRyxHQUFHLENBQUcsQ0FBQztVQUNwRTtRQUNGLENBQUUsQ0FBQztNQUNMLENBQUM7TUFDREwsT0FBTyxDQUFFLEVBQUUsRUFBRVYsWUFBWSxDQUFFRSxNQUFNLENBQUcsQ0FBQztJQUN2QyxDQUFFLENBQUM7RUFDTCxDQUFDOztFQUVEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxJQUFNcUIsZUFBZSxHQUFHLFNBQWxCQSxlQUFlQSxDQUFLWixJQUFJLEVBQUVhLFFBQVEsRUFBTTtJQUM1QzNCLHVCQUF1QixFQUFFO0lBRXpCLElBQU00QixPQUFPLEdBQUcsSUFBSUMsY0FBYyxDQUFDLENBQUM7SUFDcENELE9BQU8sQ0FBQ0UsZ0JBQWdCLENBQUUsTUFBTSxFQUFFLFlBQU07TUFDdEMsSUFBS0YsT0FBTyxDQUFDRyxNQUFNLEtBQUssR0FBRyxFQUFHO1FBQzVCLElBQUlDLElBQUk7UUFDUixJQUFJO1VBQ0ZBLElBQUksR0FBR0MsSUFBSSxDQUFDQyxLQUFLLENBQUVOLE9BQU8sQ0FBQ08sWUFBYSxDQUFDO1FBQzNDLENBQUMsQ0FDRCxPQUFPQyxDQUFDLEVBQUc7VUFDVCxNQUFNLElBQUlDLEtBQUssb0JBQUExQixNQUFBLENBQXFCRyxJQUFJLG1EQUFpRCxDQUFDO1FBQzVGO1FBQ0FhLFFBQVEsSUFBSUEsUUFBUSxDQUFFSyxJQUFLLENBQUM7TUFDOUI7TUFDQSxJQUFLLEVBQUVoQyx1QkFBdUIsS0FBSyxDQUFDLEVBQUc7UUFDckNzQyxnQkFBZ0IsQ0FBQyxDQUFDO01BQ3BCO0lBQ0YsQ0FBRSxDQUFDO0lBRUhWLE9BQU8sQ0FBQ0UsZ0JBQWdCLENBQUUsT0FBTyxFQUFFLFlBQU07TUFDdkMsSUFBSyxFQUFHbkMsaUJBQWlCLEtBQUssR0FBRyxDQUFFLEVBQUc7UUFDcEM0QyxPQUFPLENBQUNDLEdBQUcsbUJBQUE3QixNQUFBLENBQW9CRyxJQUFJLENBQUcsQ0FBQztNQUN6QztNQUNBLElBQUssRUFBRWQsdUJBQXVCLEtBQUssQ0FBQyxFQUFHO1FBQ3JDc0MsZ0JBQWdCLENBQUMsQ0FBQztNQUNwQjtJQUNGLENBQUUsQ0FBQztJQUVIVixPQUFPLENBQUNhLElBQUksQ0FBRSxLQUFLLEVBQUUzQixJQUFJLEVBQUUsSUFBSyxDQUFDO0lBQ2pDYyxPQUFPLENBQUNjLElBQUksQ0FBQyxDQUFDO0VBQ2hCLENBQUM7O0VBRUQ7RUFDQSxJQUFNSixnQkFBZ0IsR0FBRyxTQUFuQkEsZ0JBQWdCQSxDQUFBLEVBQVM7SUFFN0I7SUFDQWpELE1BQU0sQ0FBQ0MsSUFBSSxDQUFDQyxPQUFPLENBQUNvRCxXQUFXLENBQUMsQ0FBQztFQUNuQyxDQUFDOztFQUVEO0VBQ0E7RUFDQSxJQUFNQyxhQUFhLEdBQUcsU0FBaEJBLGFBQWFBLENBQUtDLElBQUksRUFBRXhDLE1BQU07SUFBQSxVQUFBTSxNQUFBLENBQVNyQixJQUFJLENBQUNDLE9BQU8sQ0FBQ3VELFVBQVUsR0FBR3hELElBQUksQ0FBQ0MsT0FBTyxDQUFDdUQsVUFBVSxHQUFHLEVBQUUsU0FBQW5DLE1BQUEsQ0FBTU4sTUFBTSxLQUFLSixlQUFlLEdBQUcsRUFBRSxHQUFHLFFBQVEsRUFBQVUsTUFBQSxDQUFHa0MsSUFBSSxPQUFBbEMsTUFBQSxDQUFJa0MsSUFBSSxlQUFBbEMsTUFBQSxDQUFZTixNQUFNO0VBQUEsQ0FBTzs7RUFFM0w7RUFDQTtFQUNBLElBQU0wQyxPQUFPLEdBQUd6RCxJQUFJLENBQUNDLE9BQU8sQ0FBQ3lELGFBQWEsQ0FBQ0MsSUFBSTtFQUMvQyxJQUFJQyxxQkFBcUI7RUFDekI1RCxJQUFJLENBQUNDLE9BQU8sQ0FBQzRELFdBQVcsQ0FBQzVDLE9BQU8sQ0FBRSxVQUFBNkMsSUFBSSxFQUFJO0lBQ3hDLElBQUtBLElBQUksQ0FBQ1AsSUFBSSxLQUFLRSxPQUFPLEVBQUc7TUFDM0JHLHFCQUFxQixHQUFHRSxJQUFJLENBQUNoRCxrQkFBa0I7SUFDakQ7RUFDRixDQUFFLENBQUM7O0VBRUg7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBOztFQUVBO0VBQ0FKLHVCQUF1QixFQUFFO0VBQ3pCMEIsZUFBZSxDQUFFLDBCQUEwQixFQUFFLFVBQUFNLElBQUksRUFBSTtJQUNuRDFDLElBQUksQ0FBQ0MsT0FBTyxDQUFDOEQsVUFBVSxHQUFHckIsSUFBSTs7SUFFOUI7SUFDQTtJQUNBMUMsSUFBSSxDQUFDQyxPQUFPLENBQUMrRCxtQkFBbUIsSUFBSWhFLElBQUksQ0FBQ0MsT0FBTyxDQUFDK0QsbUJBQW1CLENBQUMsQ0FBQztJQUV0RTVELFVBQVUsR0FBR3NCLE1BQU0sQ0FBQ0MsSUFBSSxDQUFFM0IsSUFBSSxDQUFDQyxPQUFPLENBQUM4RCxVQUFXLENBQUMsQ0FBQ0UsTUFBTSxDQUFFLFVBQUFsRCxNQUFNLEVBQUk7TUFDcEUsT0FBT2YsSUFBSSxDQUFDQyxPQUFPLENBQUM4RCxVQUFVLENBQUVoRCxNQUFNLENBQUUsQ0FBQ21ELFNBQVMsS0FBSyxLQUFLO0lBQzlELENBQUUsQ0FBQzs7SUFFSDtJQUNBOUIsZUFBZSw0Q0FBQWYsTUFBQSxDQUE2Q29DLE9BQU8sZ0JBQWEsVUFBQWYsSUFBSSxFQUFJO01BQ3RGUiw2QkFBNkIsQ0FBRVEsSUFBSSxFQUFFa0IscUJBQXNCLENBQUM7TUFDNUQ1RCxJQUFJLENBQUNDLE9BQU8sQ0FBQzRELFdBQVcsQ0FBQzVDLE9BQU8sQ0FBRSxVQUFBa0QsY0FBYyxFQUFJO1FBQ2xELElBQU1aLElBQUksR0FBR1ksY0FBYyxDQUFDWixJQUFJO1FBQ2hDLElBQUtBLElBQUksS0FBS0UsT0FBTyxFQUFHO1VBQ3RCckIsZUFBZSw0Q0FBQWYsTUFBQSxDQUE2Q2tDLElBQUksZ0JBQWEsVUFBQWIsSUFBSSxFQUFJO1lBQ25GUiw2QkFBNkIsQ0FBRVEsSUFBSSxFQUFFeUIsY0FBYyxDQUFDckQsa0JBQW1CLENBQUM7VUFDMUUsQ0FBRSxDQUFDO1FBQ0w7TUFDRixDQUFFLENBQUM7SUFDTCxDQUFFLENBQUM7O0lBRUg7SUFDQTtJQUNBc0IsZUFBZSxDQUFFa0IsYUFBYSxDQUFFRyxPQUFPLEVBQUUsSUFBSyxDQUFDLEVBQUUsVUFBQWYsSUFBSSxFQUFJO01BQ3ZEOUIsaUJBQWlCLENBQUU4QixJQUFJLEVBQUVrQixxQkFBcUIsRUFBRSxJQUFLLENBQUM7TUFDdEQ1RCxJQUFJLENBQUNDLE9BQU8sQ0FBQzRELFdBQVcsQ0FBQzVDLE9BQU8sQ0FBRSxVQUFBa0QsY0FBYyxFQUFJO1FBQ2xELElBQU1aLElBQUksR0FBR1ksY0FBYyxDQUFDWixJQUFJO1FBQ2hDLElBQUtBLElBQUksS0FBS0UsT0FBTyxFQUFHO1VBQ3RCckIsZUFBZSxDQUFFa0IsYUFBYSxDQUFFQyxJQUFJLEVBQUUsSUFBSyxDQUFDLEVBQUUsVUFBQWIsSUFBSSxFQUFJO1lBQ3BEOUIsaUJBQWlCLENBQUU4QixJQUFJLEVBQUV5QixjQUFjLENBQUNyRCxrQkFBa0IsRUFBRSxJQUFLLENBQUM7VUFDcEUsQ0FBRSxDQUFDO1FBQ0w7TUFDRixDQUFFLENBQUM7SUFDTCxDQUFFLENBQUM7SUFFSEosdUJBQXVCLEVBQUU7RUFDM0IsQ0FBRSxDQUFDO0FBQ0wsQ0FBQyxFQUFHLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=