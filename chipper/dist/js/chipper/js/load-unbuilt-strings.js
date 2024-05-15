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

(() => {
  // Namespace verification
  window.phet = window.phet || {};
  window.phet.chipper = window.phet.chipper || {};

  // Constructing the string map
  window.phet.chipper.strings = {};
  window.phet.chipper.stringMetadata = {};

  // Will be initialized after we have loaded localeData (below)
  let rtlLocales;
  const localesQueryParam = new window.URLSearchParams(window.location.search).get('locales');
  let remainingFilesToProcess = 0;
  const FALLBACK_LOCALE = 'en';

  /**
   * Takes the string-file object for a given locale/requirejsNamespace, and fills in the phet.chipper.strings inside
   * that locale with any recognized strings inside.
   *
   * @param {Object} stringObject - In general, an object where if it has a `value: {string}` key then it represents
   *                                a string key with a value, otherwise each level represents a grouping.
   * @param {string} requirejsNamespace - e.g. 'JOIST'
   * @param {string} locale
   */
  const processStringFile = (stringObject, requirejsNamespace, locale) => {
    // See if we are in an RTL locale (lodash is unavailable at this point)
    let isRTL = false;
    rtlLocales.forEach(rtlLocale => {
      if (locale.startsWith(rtlLocale)) {
        isRTL = true;
      }
    });
    const stringKeyPrefix = `${requirejsNamespace}/`;

    // Ensure a locale-specific sub-object
    phet.chipper.strings[locale] = phet.chipper.strings[locale] || {};
    const localeStringMap = phet.chipper.strings[locale];
    const recurse = (path, object) => {
      Object.keys(object).forEach(key => {
        if (key === 'value') {
          let value = object.value;

          // Add directional marks
          if (value.length > 0) {
            value = `${isRTL ? '\u202b' : '\u202a'}${value}\u202c`;
          }
          const stringKey = `${stringKeyPrefix}${path}`;
          localeStringMap[stringKey] = value;
          if (locale === FALLBACK_LOCALE && object.metadata) {
            phet.chipper.stringMetadata[stringKey] = object.metadata;
          }
        } else if (object[key] && typeof object[key] === 'object') {
          recurse(`${path}${path.length ? '.' : ''}${key}`, object[key]);
        }
      });
    };
    recurse('', stringObject);
  };

  /**
   * Load a conglomerate string file with many locales. Only used in locales=*
   */
  const processConglomerateStringFile = (stringObject, requirejsNamespace) => {
    const locales = Object.keys(stringObject);
    locales.forEach(locale => {
      // See if we are in an RTL locale (lodash is unavailable at this point)
      let isRTL = false;
      rtlLocales.forEach(rtlLocale => {
        if (locale.startsWith(rtlLocale)) {
          isRTL = true;
        }
      });
      const stringKeyPrefix = `${requirejsNamespace}/`;

      // Ensure a locale-specific sub-object
      phet.chipper.strings[locale] = phet.chipper.strings[locale] || {};
      const localeStringMap = phet.chipper.strings[locale];
      const recurse = (path, object) => {
        Object.keys(object).forEach(key => {
          if (key === 'value') {
            let value = object.value;

            // Add directional marks
            if (value.length > 0) {
              value = `${isRTL ? '\u202b' : '\u202a'}${value}\u202c`;
            }
            localeStringMap[`${stringKeyPrefix}${path}`] = value;
          } else if (object[key] && typeof object[key] === 'object') {
            recurse(`${path}${path.length ? '.' : ''}${key}`, object[key]);
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
  const requestJSONFile = (path, callback) => {
    remainingFilesToProcess++;
    const request = new XMLHttpRequest();
    request.addEventListener('load', () => {
      if (request.status === 200) {
        let json;
        try {
          json = JSON.parse(request.responseText);
        } catch (e) {
          throw new Error(`Could load file ${path}, perhaps that translation does not exist yet?`);
        }
        callback && callback(json);
      }
      if (--remainingFilesToProcess === 0) {
        finishProcessing();
      }
    });
    request.addEventListener('error', () => {
      if (!(localesQueryParam === '*')) {
        console.log(`Could not load ${path}`);
      }
      if (--remainingFilesToProcess === 0) {
        finishProcessing();
      }
    });
    request.open('GET', path, true);
    request.send();
  };

  // The callback to execute when all string files are processed.
  const finishProcessing = () => {
    // Progress with loading modules
    window.phet.chipper.loadModules();
  };

  // Check for phet.chipper.stringPath. This should be set to ADJUST the path to the strings directory, in cases
  // where we're running this case NOT from a repo's top level (e.g. sandbox.html)
  const getStringPath = (repo, locale) => `${phet.chipper.stringPath ? phet.chipper.stringPath : ''}../${locale === FALLBACK_LOCALE ? '' : 'babel/'}${repo}/${repo}-strings_${locale}.json`;

  // See if our request for the sim-specific strings file works. If so, only then will we load the common repos files
  // for that locale.
  const ourRepo = phet.chipper.packageObject.name;
  let ourRequirejsNamespace;
  phet.chipper.stringRepos.forEach(data => {
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
  requestJSONFile('../babel/localeData.json', json => {
    phet.chipper.localeData = json;

    // Because load-unbuilt-strings' "loading" of the locale data might not have happened BEFORE initialize-globals
    // runs (and sets phet.chipper.locale), we'll attempt to handle the case where it hasn't been set yet.
    phet.chipper.checkAndRemapLocale && phet.chipper.checkAndRemapLocale();
    rtlLocales = Object.keys(phet.chipper.localeData).filter(locale => {
      return phet.chipper.localeData[locale].direction === 'rtl';
    });

    // Load the conglomerate files
    requestJSONFile(`../babel/_generated_development_strings/${ourRepo}_all.json`, json => {
      processConglomerateStringFile(json, ourRequirejsNamespace);
      phet.chipper.stringRepos.forEach(stringRepoData => {
        const repo = stringRepoData.repo;
        if (repo !== ourRepo) {
          requestJSONFile(`../babel/_generated_development_strings/${repo}_all.json`, json => {
            processConglomerateStringFile(json, stringRepoData.requirejsNamespace);
          });
        }
      });
    });

    // Even though the English strings are included in the conglomerate file, load the english file directly so that
    // you can change _en strings without having to run 'grunt generate-unbuilt-strings' before seeing changes.
    requestJSONFile(getStringPath(ourRepo, 'en'), json => {
      processStringFile(json, ourRequirejsNamespace, 'en');
      phet.chipper.stringRepos.forEach(stringRepoData => {
        const repo = stringRepoData.repo;
        if (repo !== ourRepo) {
          requestJSONFile(getStringPath(repo, 'en'), json => {
            processStringFile(json, stringRepoData.requirejsNamespace, 'en');
          });
        }
      });
    });
    remainingFilesToProcess--;
  });
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ3aW5kb3ciLCJwaGV0IiwiY2hpcHBlciIsInN0cmluZ3MiLCJzdHJpbmdNZXRhZGF0YSIsInJ0bExvY2FsZXMiLCJsb2NhbGVzUXVlcnlQYXJhbSIsIlVSTFNlYXJjaFBhcmFtcyIsImxvY2F0aW9uIiwic2VhcmNoIiwiZ2V0IiwicmVtYWluaW5nRmlsZXNUb1Byb2Nlc3MiLCJGQUxMQkFDS19MT0NBTEUiLCJwcm9jZXNzU3RyaW5nRmlsZSIsInN0cmluZ09iamVjdCIsInJlcXVpcmVqc05hbWVzcGFjZSIsImxvY2FsZSIsImlzUlRMIiwiZm9yRWFjaCIsInJ0bExvY2FsZSIsInN0YXJ0c1dpdGgiLCJzdHJpbmdLZXlQcmVmaXgiLCJsb2NhbGVTdHJpbmdNYXAiLCJyZWN1cnNlIiwicGF0aCIsIm9iamVjdCIsIk9iamVjdCIsImtleXMiLCJrZXkiLCJ2YWx1ZSIsImxlbmd0aCIsInN0cmluZ0tleSIsIm1ldGFkYXRhIiwicHJvY2Vzc0Nvbmdsb21lcmF0ZVN0cmluZ0ZpbGUiLCJsb2NhbGVzIiwicmVxdWVzdEpTT05GaWxlIiwiY2FsbGJhY2siLCJyZXF1ZXN0IiwiWE1MSHR0cFJlcXVlc3QiLCJhZGRFdmVudExpc3RlbmVyIiwic3RhdHVzIiwianNvbiIsIkpTT04iLCJwYXJzZSIsInJlc3BvbnNlVGV4dCIsImUiLCJFcnJvciIsImZpbmlzaFByb2Nlc3NpbmciLCJjb25zb2xlIiwibG9nIiwib3BlbiIsInNlbmQiLCJsb2FkTW9kdWxlcyIsImdldFN0cmluZ1BhdGgiLCJyZXBvIiwic3RyaW5nUGF0aCIsIm91clJlcG8iLCJwYWNrYWdlT2JqZWN0IiwibmFtZSIsIm91clJlcXVpcmVqc05hbWVzcGFjZSIsInN0cmluZ1JlcG9zIiwiZGF0YSIsImxvY2FsZURhdGEiLCJjaGVja0FuZFJlbWFwTG9jYWxlIiwiZmlsdGVyIiwiZGlyZWN0aW9uIiwic3RyaW5nUmVwb0RhdGEiXSwic291cmNlcyI6WyJsb2FkLXVuYnVpbHQtc3RyaW5ncy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMC0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBOT1RFOiBUaGlzIGlzIG9ubHkgZm9yIGxvYWRpbmcgc3RyaW5ncyBpbiB0aGUgdW5idWlsdCBtb2RlLlxyXG4gKlxyXG4gKiBOT1RFOiBUaGlzIHdpbGwgY2hlY2sgdGhlIHF1ZXJ5IHN0cmluZyB2YWx1ZSBmb3IgP2xvY2FsZSBkaXJlY3RseS4gU2VlIGluaXRpYWxpemUtZ2xvYmFscy5qcyBmb3IgcmVmZXJlbmNlLlxyXG4gKlxyXG4gKiBLaWNrcyBvZmYgdGhlIGxvYWRpbmcgb2YgcnVudGltZSBzdHJpbmdzIHZlcnkgZWFybHkgaW4gdGhlIHVuYnVpbHQgbG9hZGluZyBwcm9jZXNzLCBpZGVhbGx5IHNvIHRoYXQgaXRcclxuICogZG9lc24ndCBibG9jayB0aGUgbG9hZGluZyBvZiBtb2R1bGVzLiBUaGlzIGlzIGJlY2F1c2Ugd2UgbmVlZCB0aGUgc3RyaW5nIGluZm9ybWF0aW9uIHRvIGJlIGxvYWRlZCBiZWZvcmUgd2UgY2FuXHJcbiAqIGtpY2sgb2ZmIHRoZSBtb2R1bGUgcHJvY2Vzcy5cclxuICpcclxuICogSXQgd2lsbCBmaWxsIHVwIHBoZXQuY2hpcHBlci5zdHJpbmdzIHdpdGggdGhlIG5lZWRlZCB2YWx1ZXMsIGZvciB1c2UgYnkgc2ltdWxhdGlvbiBjb2RlIGFuZCBpbiBwYXJ0aWN1bGFyXHJcbiAqIGdldFN0cmluZ01vZHVsZS4gSXQgd2lsbCB0aGVuIGNhbGwgd2luZG93LnBoZXQuY2hpcHBlci5sb2FkTW9kdWxlcygpIG9uY2UgY29tcGxldGUsIHRvIHByb2dyZXNzIHdpdGggdGhlIG1vZHVsZVxyXG4gKiBwcm9jZXNzLlxyXG4gKlxyXG4gKiBUbyBmdW5jdGlvbiBwcm9wZXJseSwgcGhldC5jaGlwcGVyLnN0cmluZ1JlcG9zIHdpbGwgbmVlZCB0byBiZSBkZWZpbmVkIGJlZm9yZSB0aGlzIGV4ZWN1dGVzIChnZW5lcmFsbHkgaW4gdGhlXHJcbiAqIGluaXRpYWxpemF0aW9uIHNjcmlwdCwgb3IgaW4gdGhlIGRldiAuaHRtbCkuXHJcbiAqXHJcbiAqIEEgc3RyaW5nIFwia2V5XCIgaXMgaW4gdGhlIGZvcm0gb2YgXCJOQU1FU1BBQ0Uva2V5LmZyb20uc3RyaW5ncy5qc29uXCJcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbiggKCkgPT4ge1xyXG4gIC8vIE5hbWVzcGFjZSB2ZXJpZmljYXRpb25cclxuICB3aW5kb3cucGhldCA9IHdpbmRvdy5waGV0IHx8IHt9O1xyXG4gIHdpbmRvdy5waGV0LmNoaXBwZXIgPSB3aW5kb3cucGhldC5jaGlwcGVyIHx8IHt9O1xyXG5cclxuICAvLyBDb25zdHJ1Y3RpbmcgdGhlIHN0cmluZyBtYXBcclxuICB3aW5kb3cucGhldC5jaGlwcGVyLnN0cmluZ3MgPSB7fTtcclxuICB3aW5kb3cucGhldC5jaGlwcGVyLnN0cmluZ01ldGFkYXRhID0ge307XHJcblxyXG4gIC8vIFdpbGwgYmUgaW5pdGlhbGl6ZWQgYWZ0ZXIgd2UgaGF2ZSBsb2FkZWQgbG9jYWxlRGF0YSAoYmVsb3cpXHJcbiAgbGV0IHJ0bExvY2FsZXM7XHJcblxyXG4gIGNvbnN0IGxvY2FsZXNRdWVyeVBhcmFtID0gbmV3IHdpbmRvdy5VUkxTZWFyY2hQYXJhbXMoIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2ggKS5nZXQoICdsb2NhbGVzJyApO1xyXG5cclxuICBsZXQgcmVtYWluaW5nRmlsZXNUb1Byb2Nlc3MgPSAwO1xyXG5cclxuICBjb25zdCBGQUxMQkFDS19MT0NBTEUgPSAnZW4nO1xyXG5cclxuICAvKipcclxuICAgKiBUYWtlcyB0aGUgc3RyaW5nLWZpbGUgb2JqZWN0IGZvciBhIGdpdmVuIGxvY2FsZS9yZXF1aXJlanNOYW1lc3BhY2UsIGFuZCBmaWxscyBpbiB0aGUgcGhldC5jaGlwcGVyLnN0cmluZ3MgaW5zaWRlXHJcbiAgICogdGhhdCBsb2NhbGUgd2l0aCBhbnkgcmVjb2duaXplZCBzdHJpbmdzIGluc2lkZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzdHJpbmdPYmplY3QgLSBJbiBnZW5lcmFsLCBhbiBvYmplY3Qgd2hlcmUgaWYgaXQgaGFzIGEgYHZhbHVlOiB7c3RyaW5nfWAga2V5IHRoZW4gaXQgcmVwcmVzZW50c1xyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhIHN0cmluZyBrZXkgd2l0aCBhIHZhbHVlLCBvdGhlcndpc2UgZWFjaCBsZXZlbCByZXByZXNlbnRzIGEgZ3JvdXBpbmcuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlcXVpcmVqc05hbWVzcGFjZSAtIGUuZy4gJ0pPSVNUJ1xyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBsb2NhbGVcclxuICAgKi9cclxuICBjb25zdCBwcm9jZXNzU3RyaW5nRmlsZSA9ICggc3RyaW5nT2JqZWN0LCByZXF1aXJlanNOYW1lc3BhY2UsIGxvY2FsZSApID0+IHtcclxuICAgIC8vIFNlZSBpZiB3ZSBhcmUgaW4gYW4gUlRMIGxvY2FsZSAobG9kYXNoIGlzIHVuYXZhaWxhYmxlIGF0IHRoaXMgcG9pbnQpXHJcbiAgICBsZXQgaXNSVEwgPSBmYWxzZTtcclxuICAgIHJ0bExvY2FsZXMuZm9yRWFjaCggcnRsTG9jYWxlID0+IHtcclxuICAgICAgaWYgKCBsb2NhbGUuc3RhcnRzV2l0aCggcnRsTG9jYWxlICkgKSB7XHJcbiAgICAgICAgaXNSVEwgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3Qgc3RyaW5nS2V5UHJlZml4ID0gYCR7cmVxdWlyZWpzTmFtZXNwYWNlfS9gO1xyXG5cclxuICAgIC8vIEVuc3VyZSBhIGxvY2FsZS1zcGVjaWZpYyBzdWItb2JqZWN0XHJcbiAgICBwaGV0LmNoaXBwZXIuc3RyaW5nc1sgbG9jYWxlIF0gPSBwaGV0LmNoaXBwZXIuc3RyaW5nc1sgbG9jYWxlIF0gfHwge307XHJcbiAgICBjb25zdCBsb2NhbGVTdHJpbmdNYXAgPSBwaGV0LmNoaXBwZXIuc3RyaW5nc1sgbG9jYWxlIF07XHJcblxyXG4gICAgY29uc3QgcmVjdXJzZSA9ICggcGF0aCwgb2JqZWN0ICkgPT4ge1xyXG4gICAgICBPYmplY3Qua2V5cyggb2JqZWN0ICkuZm9yRWFjaCgga2V5ID0+IHtcclxuICAgICAgICBpZiAoIGtleSA9PT0gJ3ZhbHVlJyApIHtcclxuICAgICAgICAgIGxldCB2YWx1ZSA9IG9iamVjdC52YWx1ZTtcclxuXHJcbiAgICAgICAgICAvLyBBZGQgZGlyZWN0aW9uYWwgbWFya3NcclxuICAgICAgICAgIGlmICggdmFsdWUubGVuZ3RoID4gMCApIHtcclxuICAgICAgICAgICAgdmFsdWUgPSBgJHsoIGlzUlRMID8gJ1xcdTIwMmInIDogJ1xcdTIwMmEnICl9JHt2YWx1ZX1cXHUyMDJjYDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBjb25zdCBzdHJpbmdLZXkgPSBgJHtzdHJpbmdLZXlQcmVmaXh9JHtwYXRofWA7XHJcblxyXG4gICAgICAgICAgbG9jYWxlU3RyaW5nTWFwWyBzdHJpbmdLZXkgXSA9IHZhbHVlO1xyXG5cclxuICAgICAgICAgIGlmICggbG9jYWxlID09PSBGQUxMQkFDS19MT0NBTEUgJiYgb2JqZWN0Lm1ldGFkYXRhICkge1xyXG4gICAgICAgICAgICBwaGV0LmNoaXBwZXIuc3RyaW5nTWV0YWRhdGFbIHN0cmluZ0tleSBdID0gb2JqZWN0Lm1ldGFkYXRhO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggb2JqZWN0WyBrZXkgXSAmJiB0eXBlb2Ygb2JqZWN0WyBrZXkgXSA9PT0gJ29iamVjdCcgKSB7XHJcbiAgICAgICAgICByZWN1cnNlKCBgJHtwYXRofSR7cGF0aC5sZW5ndGggPyAnLicgOiAnJ30ke2tleX1gLCBvYmplY3RbIGtleSBdICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICB9O1xyXG4gICAgcmVjdXJzZSggJycsIHN0cmluZ09iamVjdCApO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIExvYWQgYSBjb25nbG9tZXJhdGUgc3RyaW5nIGZpbGUgd2l0aCBtYW55IGxvY2FsZXMuIE9ubHkgdXNlZCBpbiBsb2NhbGVzPSpcclxuICAgKi9cclxuICBjb25zdCBwcm9jZXNzQ29uZ2xvbWVyYXRlU3RyaW5nRmlsZSA9ICggc3RyaW5nT2JqZWN0LCByZXF1aXJlanNOYW1lc3BhY2UgKSA9PiB7XHJcblxyXG4gICAgY29uc3QgbG9jYWxlcyA9IE9iamVjdC5rZXlzKCBzdHJpbmdPYmplY3QgKTtcclxuXHJcbiAgICBsb2NhbGVzLmZvckVhY2goIGxvY2FsZSA9PiB7XHJcblxyXG4gICAgICAvLyBTZWUgaWYgd2UgYXJlIGluIGFuIFJUTCBsb2NhbGUgKGxvZGFzaCBpcyB1bmF2YWlsYWJsZSBhdCB0aGlzIHBvaW50KVxyXG4gICAgICBsZXQgaXNSVEwgPSBmYWxzZTtcclxuICAgICAgcnRsTG9jYWxlcy5mb3JFYWNoKCBydGxMb2NhbGUgPT4ge1xyXG4gICAgICAgIGlmICggbG9jYWxlLnN0YXJ0c1dpdGgoIHJ0bExvY2FsZSApICkge1xyXG4gICAgICAgICAgaXNSVEwgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG5cclxuICAgICAgY29uc3Qgc3RyaW5nS2V5UHJlZml4ID0gYCR7cmVxdWlyZWpzTmFtZXNwYWNlfS9gO1xyXG5cclxuICAgICAgLy8gRW5zdXJlIGEgbG9jYWxlLXNwZWNpZmljIHN1Yi1vYmplY3RcclxuICAgICAgcGhldC5jaGlwcGVyLnN0cmluZ3NbIGxvY2FsZSBdID0gcGhldC5jaGlwcGVyLnN0cmluZ3NbIGxvY2FsZSBdIHx8IHt9O1xyXG4gICAgICBjb25zdCBsb2NhbGVTdHJpbmdNYXAgPSBwaGV0LmNoaXBwZXIuc3RyaW5nc1sgbG9jYWxlIF07XHJcblxyXG4gICAgICBjb25zdCByZWN1cnNlID0gKCBwYXRoLCBvYmplY3QgKSA9PiB7XHJcbiAgICAgICAgT2JqZWN0LmtleXMoIG9iamVjdCApLmZvckVhY2goIGtleSA9PiB7XHJcbiAgICAgICAgICBpZiAoIGtleSA9PT0gJ3ZhbHVlJyApIHtcclxuICAgICAgICAgICAgbGV0IHZhbHVlID0gb2JqZWN0LnZhbHVlO1xyXG5cclxuICAgICAgICAgICAgLy8gQWRkIGRpcmVjdGlvbmFsIG1hcmtzXHJcbiAgICAgICAgICAgIGlmICggdmFsdWUubGVuZ3RoID4gMCApIHtcclxuICAgICAgICAgICAgICB2YWx1ZSA9IGAkeyggaXNSVEwgPyAnXFx1MjAyYicgOiAnXFx1MjAyYScgKX0ke3ZhbHVlfVxcdTIwMmNgO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsb2NhbGVTdHJpbmdNYXBbIGAke3N0cmluZ0tleVByZWZpeH0ke3BhdGh9YCBdID0gdmFsdWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIGlmICggb2JqZWN0WyBrZXkgXSAmJiB0eXBlb2Ygb2JqZWN0WyBrZXkgXSA9PT0gJ29iamVjdCcgKSB7XHJcbiAgICAgICAgICAgIHJlY3Vyc2UoIGAke3BhdGh9JHtwYXRoLmxlbmd0aCA/ICcuJyA6ICcnfSR7a2V5fWAsIG9iamVjdFsga2V5IF0gKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9ICk7XHJcbiAgICAgIH07XHJcbiAgICAgIHJlY3Vyc2UoICcnLCBzdHJpbmdPYmplY3RbIGxvY2FsZSBdICk7XHJcbiAgICB9ICk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogRmlyZXMgb2ZmIGEgcmVxdWVzdCBmb3IgYSBKU09OIGZpbGUsIGVpdGhlciBpbiBiYWJlbCAoZm9yIG5vbi1FbmdsaXNoKSBzdHJpbmdzLCBvciBpbiB0aGUgYWN0dWFsIHJlcG9cclxuICAgKiAoZm9yIEVuZ2xpc2gpIHN0cmluZ3MsIG9yIGZvciB0aGUgdW5idWlsdF9lbiBzdHJpbmdzIGZpbGUuIFdoZW4gaXQgaXMgbG9hZGVkLCBpdCB3aWxsIHRyeSB0byBwYXJzZSB0aGUgcmVzcG9uc2VcclxuICAgKiBhbmQgdGhlbiBwYXNzIHRoZSBvYmplY3QgZm9yIHByb2Nlc3NpbmcuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIFJlbGF0aXZlIHBhdGggdG8gbG9hZCBKU09OIGZpbGUgZnJvbVxyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb258bnVsbH0gY2FsbGJhY2tcclxuICAgKi9cclxuICBjb25zdCByZXF1ZXN0SlNPTkZpbGUgPSAoIHBhdGgsIGNhbGxiYWNrICkgPT4ge1xyXG4gICAgcmVtYWluaW5nRmlsZXNUb1Byb2Nlc3MrKztcclxuXHJcbiAgICBjb25zdCByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICByZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoICdsb2FkJywgKCkgPT4ge1xyXG4gICAgICBpZiAoIHJlcXVlc3Quc3RhdHVzID09PSAyMDAgKSB7XHJcbiAgICAgICAgbGV0IGpzb247XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGpzb24gPSBKU09OLnBhcnNlKCByZXF1ZXN0LnJlc3BvbnNlVGV4dCApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCggZSApIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciggYENvdWxkIGxvYWQgZmlsZSAke3BhdGh9LCBwZXJoYXBzIHRoYXQgdHJhbnNsYXRpb24gZG9lcyBub3QgZXhpc3QgeWV0P2AgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soIGpzb24gKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIC0tcmVtYWluaW5nRmlsZXNUb1Byb2Nlc3MgPT09IDAgKSB7XHJcbiAgICAgICAgZmluaXNoUHJvY2Vzc2luZygpO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgcmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKCAnZXJyb3InLCAoKSA9PiB7XHJcbiAgICAgIGlmICggISggbG9jYWxlc1F1ZXJ5UGFyYW0gPT09ICcqJyApICkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCBgQ291bGQgbm90IGxvYWQgJHtwYXRofWAgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIC0tcmVtYWluaW5nRmlsZXNUb1Byb2Nlc3MgPT09IDAgKSB7XHJcbiAgICAgICAgZmluaXNoUHJvY2Vzc2luZygpO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgcmVxdWVzdC5vcGVuKCAnR0VUJywgcGF0aCwgdHJ1ZSApO1xyXG4gICAgcmVxdWVzdC5zZW5kKCk7XHJcbiAgfTtcclxuXHJcbiAgLy8gVGhlIGNhbGxiYWNrIHRvIGV4ZWN1dGUgd2hlbiBhbGwgc3RyaW5nIGZpbGVzIGFyZSBwcm9jZXNzZWQuXHJcbiAgY29uc3QgZmluaXNoUHJvY2Vzc2luZyA9ICgpID0+IHtcclxuXHJcbiAgICAvLyBQcm9ncmVzcyB3aXRoIGxvYWRpbmcgbW9kdWxlc1xyXG4gICAgd2luZG93LnBoZXQuY2hpcHBlci5sb2FkTW9kdWxlcygpO1xyXG4gIH07XHJcblxyXG4gIC8vIENoZWNrIGZvciBwaGV0LmNoaXBwZXIuc3RyaW5nUGF0aC4gVGhpcyBzaG91bGQgYmUgc2V0IHRvIEFESlVTVCB0aGUgcGF0aCB0byB0aGUgc3RyaW5ncyBkaXJlY3RvcnksIGluIGNhc2VzXHJcbiAgLy8gd2hlcmUgd2UncmUgcnVubmluZyB0aGlzIGNhc2UgTk9UIGZyb20gYSByZXBvJ3MgdG9wIGxldmVsIChlLmcuIHNhbmRib3guaHRtbClcclxuICBjb25zdCBnZXRTdHJpbmdQYXRoID0gKCByZXBvLCBsb2NhbGUgKSA9PiBgJHtwaGV0LmNoaXBwZXIuc3RyaW5nUGF0aCA/IHBoZXQuY2hpcHBlci5zdHJpbmdQYXRoIDogJyd9Li4vJHtsb2NhbGUgPT09IEZBTExCQUNLX0xPQ0FMRSA/ICcnIDogJ2JhYmVsLyd9JHtyZXBvfS8ke3JlcG99LXN0cmluZ3NfJHtsb2NhbGV9Lmpzb25gO1xyXG5cclxuICAvLyBTZWUgaWYgb3VyIHJlcXVlc3QgZm9yIHRoZSBzaW0tc3BlY2lmaWMgc3RyaW5ncyBmaWxlIHdvcmtzLiBJZiBzbywgb25seSB0aGVuIHdpbGwgd2UgbG9hZCB0aGUgY29tbW9uIHJlcG9zIGZpbGVzXHJcbiAgLy8gZm9yIHRoYXQgbG9jYWxlLlxyXG4gIGNvbnN0IG91clJlcG8gPSBwaGV0LmNoaXBwZXIucGFja2FnZU9iamVjdC5uYW1lO1xyXG4gIGxldCBvdXJSZXF1aXJlanNOYW1lc3BhY2U7XHJcbiAgcGhldC5jaGlwcGVyLnN0cmluZ1JlcG9zLmZvckVhY2goIGRhdGEgPT4ge1xyXG4gICAgaWYgKCBkYXRhLnJlcG8gPT09IG91clJlcG8gKSB7XHJcbiAgICAgIG91clJlcXVpcmVqc05hbWVzcGFjZSA9IGRhdGEucmVxdWlyZWpzTmFtZXNwYWNlO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuXHJcbiAgLy8gVE9ETyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvMTg3NyBVbmNvbW1lbnQgdGhpcyB0byBsb2FkIHRoZSB1c2VkIHN0cmluZyBsaXN0XHJcbiAgLy8gcmVxdWVzdEpTT05GaWxlKCBgLi4vcGhldC1pby1zaW0tc3BlY2lmaWMvcmVwb3MvJHtvdXJSZXBvfS91c2VkLXN0cmluZ3NfZW4uanNvbmAsIGpzb24gPT4ge1xyXG4gIC8vXHJcbiAgLy8gICAvLyBTdG9yZSBmb3IgcnVudGltZSB1c2FnZVxyXG4gIC8vICAgcGhldC5jaGlwcGVyLnVzZWRTdHJpbmdzRU4gPSBqc29uO1xyXG4gIC8vIH0gKTtcclxuXHJcbiAgLy8gTG9hZCBsb2NhbGUgZGF0YVxyXG4gIHJlbWFpbmluZ0ZpbGVzVG9Qcm9jZXNzKys7XHJcbiAgcmVxdWVzdEpTT05GaWxlKCAnLi4vYmFiZWwvbG9jYWxlRGF0YS5qc29uJywganNvbiA9PiB7XHJcbiAgICBwaGV0LmNoaXBwZXIubG9jYWxlRGF0YSA9IGpzb247XHJcblxyXG4gICAgLy8gQmVjYXVzZSBsb2FkLXVuYnVpbHQtc3RyaW5ncycgXCJsb2FkaW5nXCIgb2YgdGhlIGxvY2FsZSBkYXRhIG1pZ2h0IG5vdCBoYXZlIGhhcHBlbmVkIEJFRk9SRSBpbml0aWFsaXplLWdsb2JhbHNcclxuICAgIC8vIHJ1bnMgKGFuZCBzZXRzIHBoZXQuY2hpcHBlci5sb2NhbGUpLCB3ZSdsbCBhdHRlbXB0IHRvIGhhbmRsZSB0aGUgY2FzZSB3aGVyZSBpdCBoYXNuJ3QgYmVlbiBzZXQgeWV0LlxyXG4gICAgcGhldC5jaGlwcGVyLmNoZWNrQW5kUmVtYXBMb2NhbGUgJiYgcGhldC5jaGlwcGVyLmNoZWNrQW5kUmVtYXBMb2NhbGUoKTtcclxuXHJcbiAgICBydGxMb2NhbGVzID0gT2JqZWN0LmtleXMoIHBoZXQuY2hpcHBlci5sb2NhbGVEYXRhICkuZmlsdGVyKCBsb2NhbGUgPT4ge1xyXG4gICAgICByZXR1cm4gcGhldC5jaGlwcGVyLmxvY2FsZURhdGFbIGxvY2FsZSBdLmRpcmVjdGlvbiA9PT0gJ3J0bCc7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gTG9hZCB0aGUgY29uZ2xvbWVyYXRlIGZpbGVzXHJcbiAgICByZXF1ZXN0SlNPTkZpbGUoIGAuLi9iYWJlbC9fZ2VuZXJhdGVkX2RldmVsb3BtZW50X3N0cmluZ3MvJHtvdXJSZXBvfV9hbGwuanNvbmAsIGpzb24gPT4ge1xyXG4gICAgICBwcm9jZXNzQ29uZ2xvbWVyYXRlU3RyaW5nRmlsZSgganNvbiwgb3VyUmVxdWlyZWpzTmFtZXNwYWNlICk7XHJcbiAgICAgIHBoZXQuY2hpcHBlci5zdHJpbmdSZXBvcy5mb3JFYWNoKCBzdHJpbmdSZXBvRGF0YSA9PiB7XHJcbiAgICAgICAgY29uc3QgcmVwbyA9IHN0cmluZ1JlcG9EYXRhLnJlcG87XHJcbiAgICAgICAgaWYgKCByZXBvICE9PSBvdXJSZXBvICkge1xyXG4gICAgICAgICAgcmVxdWVzdEpTT05GaWxlKCBgLi4vYmFiZWwvX2dlbmVyYXRlZF9kZXZlbG9wbWVudF9zdHJpbmdzLyR7cmVwb31fYWxsLmpzb25gLCBqc29uID0+IHtcclxuICAgICAgICAgICAgcHJvY2Vzc0Nvbmdsb21lcmF0ZVN0cmluZ0ZpbGUoIGpzb24sIHN0cmluZ1JlcG9EYXRhLnJlcXVpcmVqc05hbWVzcGFjZSApO1xyXG4gICAgICAgICAgfSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIEV2ZW4gdGhvdWdoIHRoZSBFbmdsaXNoIHN0cmluZ3MgYXJlIGluY2x1ZGVkIGluIHRoZSBjb25nbG9tZXJhdGUgZmlsZSwgbG9hZCB0aGUgZW5nbGlzaCBmaWxlIGRpcmVjdGx5IHNvIHRoYXRcclxuICAgIC8vIHlvdSBjYW4gY2hhbmdlIF9lbiBzdHJpbmdzIHdpdGhvdXQgaGF2aW5nIHRvIHJ1biAnZ3J1bnQgZ2VuZXJhdGUtdW5idWlsdC1zdHJpbmdzJyBiZWZvcmUgc2VlaW5nIGNoYW5nZXMuXHJcbiAgICByZXF1ZXN0SlNPTkZpbGUoIGdldFN0cmluZ1BhdGgoIG91clJlcG8sICdlbicgKSwganNvbiA9PiB7XHJcbiAgICAgIHByb2Nlc3NTdHJpbmdGaWxlKCBqc29uLCBvdXJSZXF1aXJlanNOYW1lc3BhY2UsICdlbicgKTtcclxuICAgICAgcGhldC5jaGlwcGVyLnN0cmluZ1JlcG9zLmZvckVhY2goIHN0cmluZ1JlcG9EYXRhID0+IHtcclxuICAgICAgICBjb25zdCByZXBvID0gc3RyaW5nUmVwb0RhdGEucmVwbztcclxuICAgICAgICBpZiAoIHJlcG8gIT09IG91clJlcG8gKSB7XHJcbiAgICAgICAgICByZXF1ZXN0SlNPTkZpbGUoIGdldFN0cmluZ1BhdGgoIHJlcG8sICdlbicgKSwganNvbiA9PiB7XHJcbiAgICAgICAgICAgIHByb2Nlc3NTdHJpbmdGaWxlKCBqc29uLCBzdHJpbmdSZXBvRGF0YS5yZXF1aXJlanNOYW1lc3BhY2UsICdlbicgKTtcclxuICAgICAgICAgIH0gKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICByZW1haW5pbmdGaWxlc1RvUHJvY2Vzcy0tO1xyXG4gIH0gKTtcclxufSAp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