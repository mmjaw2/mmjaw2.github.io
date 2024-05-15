// Copyright 2024, University of Colorado Boulder

/**
 * Checking yotta=false (https://github.com/phetsims/phetcommon/issues/65) and yotta*=*
 * (https://github.com/phetsims/phetcommon/issues/66) behavior on non-refreshed release branches.
 *
 * NOTE: refresh release branches if not doing an active MR.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const puppeteerLoad = require('../../common/puppeteerLoad');
const Maintenance = require('../../common/Maintenance');
const winston = require('../../../../../../perennial-alias/node_modules/winston');
const puppeteer = require('puppeteer');
const fs = require('fs');
winston.default.transports.console.level = 'error';
const TEST_LOCALES = true;
const TEST_ANALYTICS = false;
const localeData = fs.readFileSync('../babel/localeData.json', 'utf8');
(async () => {
  const browser = await puppeteer.launch({
    args: ['--disable-gpu']
  });
  const getBaseURLs = async releaseBranch => {
    const buildDir = `http://localhost/release-branches/${releaseBranch.repo}-${releaseBranch.branch}/${releaseBranch.repo}/build`;
    const urls = [];
    const usesChipper2 = await releaseBranch.usesChipper2();
    if (releaseBranch.brands.includes('phet')) {
      urls.push(`${buildDir}/${usesChipper2 ? 'phet/' : ''}${releaseBranch.repo}_all${usesChipper2 ? '_phet' : ''}.html?webgl=false`);
    }
    if (releaseBranch.brands.includes('phet-io')) {
      const standaloneParams = await releaseBranch.getPhetioStandaloneQueryParameter();
      const phetioSuffix = usesChipper2 ? '_all_phet-io' : '_en-phetio';
      urls.push(`${buildDir}/${usesChipper2 ? 'phet-io/' : ''}${releaseBranch.repo}${phetioSuffix}.html?${standaloneParams}&webgl=false`);
    }
    return urls;
  };
  const getLoadedURLs = async url => {
    const urls = [];
    await puppeteerLoad(url, {
      onPageCreation: page => page.on('request', request => {
        const url = request.url();
        if (!url.startsWith('data:')) {
          urls.push(url);
        }
      }),
      gotoTimeout: 60000,
      waitAfterLoad: 2000,
      browser: browser
    });
    return urls;
  };
  const demoYottaQueryParameterKey = 'yottaSomeFlag';
  const demoYottaQueryParameterValue = 'someValue';
  const analyzeURLs = urls => {
    return {
      sentGoogleAnalytics: urls.some(url => url.includes('collect?')),
      sentYotta: urls.some(url => url.includes('yotta/immediate.gif')),
      sentExternalRequest: urls.some(url => !url.startsWith('http://localhost')),
      hasDemoYottaQueryParameter: urls.some(url => {
        return new URLSearchParams(new URL(url).search).get(demoYottaQueryParameterKey) === demoYottaQueryParameterValue;
      })
    };
  };
  for (const releaseBranch of await Maintenance.loadAllMaintenanceBranches()) {
    console.log(releaseBranch.toString());
    const urls = await getBaseURLs(releaseBranch);
    for (const url of urls) {
      if (TEST_LOCALES) {
        // TODO: test unbuilt locales (https://github.com/phetsims/joist/issues/963)

        // Check locale MR. es_PY should always be in localeData
        const localeValues = await puppeteerLoad(url, {
          evaluate: () => {
            return [!!phet.chipper.localeData, !!phet.chipper.localeData?.es_PY];
          },
          gotoTimeout: 60000,
          waitAfterLoad: 2000,
          browser: browser
        });
        if (!localeValues[0]) {
          console.log('  no localeData');
        }
        if (!localeValues[1]) {
          console.log('  no es_PY localeData');
        }
        const getRunningLocale = async locale => {
          try {
            return await puppeteerLoad(url.includes('?') ? `${url}&locale=${locale}` : `${url}?locale=${locale}`, {
              evaluate: () => {
                return phet.chipper.locale;
              },
              gotoTimeout: 60000,
              waitAfterLoad: 2000,
              browser: browser
            });
          } catch (e) {
            console.log(`  error running with locale=${locale}`);
            return 'error';
          }
        };
        const esLocale = await getRunningLocale('es');
        if (esLocale !== 'es') {
          console.log('  es locale not es');
        }
        const spaLocale = await getRunningLocale('spa');
        if (spaLocale !== 'es') {
          console.log('  spa locale not es');
        }
        const espyLocale = await getRunningLocale('ES_PY');
        if (espyLocale !== 'es' && espyLocale !== 'es_PY') {
          console.log('  ES_PY locale not es/es_PY');
        }
        const invalidLocale = await getRunningLocale('aenrtpyarntSRTS');
        if (invalidLocale !== 'en') {
          console.log('  invalid locale issue, not en');
        }
        const repoPackageObject = JSON.parse(fs.readFileSync(`../${releaseBranch.repo}/package.json`, 'utf8'));
        const partialPotentialTitleStringKey = `${repoPackageObject.phet.requirejsNamespace}/${releaseBranch.repo}.title`;
        const fullPotentialTitleStringKey = `${repoPackageObject.phet.requirejsNamespace}/${partialPotentialTitleStringKey}`;
        const hasTitleKey = await puppeteerLoad(url, {
          evaluate: `!!phet.chipper.strings.en[ "${fullPotentialTitleStringKey}" ]`,
          gotoTimeout: 60000,
          waitAfterLoad: 2000,
          browser: browser
        });
        if (hasTitleKey) {
          const getTitle = async locale => {
            try {
              return await puppeteerLoad(url.includes('?') ? `${url}&locale=${locale}` : `${url}?locale=${locale}`, {
                evaluate: () => {
                  return document.title;
                },
                gotoTimeout: 60000,
                waitAfterLoad: 2000,
                browser: browser
              });
            } catch (e) {
              console.log(`  error running with locale=${locale}`);
              return 'error';
            }
          };

          // null if could not be found
          const lookupSpecificTitleTranslation = locale => {
            let json;
            if (locale === 'en') {
              json = JSON.parse(fs.readFileSync(`../${releaseBranch.repo}/${releaseBranch.repo}-strings_en.json`, 'utf8'));
            } else {
              try {
                json = JSON.parse(fs.readFileSync(`../babel/${releaseBranch.repo}/${releaseBranch.repo}-strings_${locale}.json`, 'utf8'));
              } catch (e) {
                return null;
              }
            }
            return json[partialPotentialTitleStringKey]?.value ?? null;
          };
          const lookupFallbackTitle = locale => {
            const locales = [locale, ...(localeData[locale]?.fallbackLocales || []), 'en'];
            for (const testLocale of locales) {
              const title = lookupSpecificTitleTranslation(testLocale);
              if (title) {
                return title;
              }
            }
            throw new Error(`could not compute fallback title for locale ${locale}`);
          };
          const checkTitle = async (locale, lookupLocale) => {
            const actualTitle = await getTitle(locale);
            const expectedTitle = lookupFallbackTitle(lookupLocale);
            if (actualTitle.includes(expectedTitle)) {
              return null;
            } else {
              return `Actual title ${JSON.stringify(actualTitle)} does not match expected title ${JSON.stringify(expectedTitle)} for locale ${locale} / ${lookupLocale}`;
            }
          };
          const esTitleError = await checkTitle('es');
          if (esTitleError) {
            console.log(`  es title error: ${esTitleError}`);
          }
          const spaTitleError = await checkTitle('spa', 'es');
          if (spaTitleError) {
            console.log(`  spa title error: ${spaTitleError}`);
          }
          const espyTitleError = await checkTitle('ES_PY', 'es_PY');
          if (espyTitleError) {
            console.log(`  ES_PY title error: ${espyTitleError}`);
          }
        } else {
          console.log('    (could not find title string key)');
        }
      }
      if (TEST_ANALYTICS) {
        const plainURL = url;
        const plainAnalysis = analyzeURLs(await getLoadedURLs(plainURL));
        if (!plainAnalysis.sentGoogleAnalytics) {
          console.log('  No Google Analytics sent', plainURL);
        }
        if (!plainAnalysis.sentYotta) {
          console.log('  No yotta sent', plainURL);
        }
        const yottaFalseURL = `${url}&yotta=false`;
        const yottaFalseAnalysis = analyzeURLs(await getLoadedURLs(yottaFalseURL));
        if (yottaFalseAnalysis.sentExternalRequest || yottaFalseAnalysis.sentGoogleAnalytics || yottaFalseAnalysis.sentYotta) {
          console.log('  yotta=false sent something', yottaFalseAnalysis);
        }
        const yottaSomeFlagURL = `${url}&${demoYottaQueryParameterKey}=${demoYottaQueryParameterValue}`;
        const yottaSomeFlagAnalysis = analyzeURLs(await getLoadedURLs(yottaSomeFlagURL));
        if (!yottaSomeFlagAnalysis.hasDemoYottaQueryParameter) {
          console.log(`  No ${demoYottaQueryParameterKey}=${demoYottaQueryParameterValue} sent`, yottaSomeFlagAnalysis);
        }
      }

      // Consider adding fuzzing in the future, it seems like we're unable to get things to run after a fuzz failure though
      // const fuzzURL = `${url}&fuzz&fuzzMouse&fuzzTouch&fuzzBoard`;
      // try {
      //   await puppeteerLoad( fuzzURL, {
      //     waitForFunction: 'window.phet.joist.sim',
      //     gotoTimeout: 60000,
      //     waitAfterLoad: 5000,
      //     browser: browser
      //   } );
      // }
      // catch( e ) {
      //   console.log( `fuzz failure on ${fuzzURL}:\n${e}` );
      // }
    }
  }
  browser.close();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwdXBwZXRlZXJMb2FkIiwicmVxdWlyZSIsIk1haW50ZW5hbmNlIiwid2luc3RvbiIsInB1cHBldGVlciIsImZzIiwiZGVmYXVsdCIsInRyYW5zcG9ydHMiLCJjb25zb2xlIiwibGV2ZWwiLCJURVNUX0xPQ0FMRVMiLCJURVNUX0FOQUxZVElDUyIsImxvY2FsZURhdGEiLCJyZWFkRmlsZVN5bmMiLCJicm93c2VyIiwibGF1bmNoIiwiYXJncyIsImdldEJhc2VVUkxzIiwicmVsZWFzZUJyYW5jaCIsImJ1aWxkRGlyIiwicmVwbyIsImJyYW5jaCIsInVybHMiLCJ1c2VzQ2hpcHBlcjIiLCJicmFuZHMiLCJpbmNsdWRlcyIsInB1c2giLCJzdGFuZGFsb25lUGFyYW1zIiwiZ2V0UGhldGlvU3RhbmRhbG9uZVF1ZXJ5UGFyYW1ldGVyIiwicGhldGlvU3VmZml4IiwiZ2V0TG9hZGVkVVJMcyIsInVybCIsIm9uUGFnZUNyZWF0aW9uIiwicGFnZSIsIm9uIiwicmVxdWVzdCIsInN0YXJ0c1dpdGgiLCJnb3RvVGltZW91dCIsIndhaXRBZnRlckxvYWQiLCJkZW1vWW90dGFRdWVyeVBhcmFtZXRlcktleSIsImRlbW9Zb3R0YVF1ZXJ5UGFyYW1ldGVyVmFsdWUiLCJhbmFseXplVVJMcyIsInNlbnRHb29nbGVBbmFseXRpY3MiLCJzb21lIiwic2VudFlvdHRhIiwic2VudEV4dGVybmFsUmVxdWVzdCIsImhhc0RlbW9Zb3R0YVF1ZXJ5UGFyYW1ldGVyIiwiVVJMU2VhcmNoUGFyYW1zIiwiVVJMIiwic2VhcmNoIiwiZ2V0IiwibG9hZEFsbE1haW50ZW5hbmNlQnJhbmNoZXMiLCJsb2ciLCJ0b1N0cmluZyIsImxvY2FsZVZhbHVlcyIsImV2YWx1YXRlIiwicGhldCIsImNoaXBwZXIiLCJlc19QWSIsImdldFJ1bm5pbmdMb2NhbGUiLCJsb2NhbGUiLCJlIiwiZXNMb2NhbGUiLCJzcGFMb2NhbGUiLCJlc3B5TG9jYWxlIiwiaW52YWxpZExvY2FsZSIsInJlcG9QYWNrYWdlT2JqZWN0IiwiSlNPTiIsInBhcnNlIiwicGFydGlhbFBvdGVudGlhbFRpdGxlU3RyaW5nS2V5IiwicmVxdWlyZWpzTmFtZXNwYWNlIiwiZnVsbFBvdGVudGlhbFRpdGxlU3RyaW5nS2V5IiwiaGFzVGl0bGVLZXkiLCJnZXRUaXRsZSIsImRvY3VtZW50IiwidGl0bGUiLCJsb29rdXBTcGVjaWZpY1RpdGxlVHJhbnNsYXRpb24iLCJqc29uIiwidmFsdWUiLCJsb29rdXBGYWxsYmFja1RpdGxlIiwibG9jYWxlcyIsImZhbGxiYWNrTG9jYWxlcyIsInRlc3RMb2NhbGUiLCJFcnJvciIsImNoZWNrVGl0bGUiLCJsb29rdXBMb2NhbGUiLCJhY3R1YWxUaXRsZSIsImV4cGVjdGVkVGl0bGUiLCJzdHJpbmdpZnkiLCJlc1RpdGxlRXJyb3IiLCJzcGFUaXRsZUVycm9yIiwiZXNweVRpdGxlRXJyb3IiLCJwbGFpblVSTCIsInBsYWluQW5hbHlzaXMiLCJ5b3R0YUZhbHNlVVJMIiwieW90dGFGYWxzZUFuYWx5c2lzIiwieW90dGFTb21lRmxhZ1VSTCIsInlvdHRhU29tZUZsYWdBbmFseXNpcyIsImNsb3NlIl0sInNvdXJjZXMiOlsicmVsZWFzZS1icmFuY2gtY2hlY2tzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBDaGVja2luZyB5b3R0YT1mYWxzZSAoaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXRjb21tb24vaXNzdWVzLzY1KSBhbmQgeW90dGEqPSpcclxuICogKGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0Y29tbW9uL2lzc3Vlcy82NikgYmVoYXZpb3Igb24gbm9uLXJlZnJlc2hlZCByZWxlYXNlIGJyYW5jaGVzLlxyXG4gKlxyXG4gKiBOT1RFOiByZWZyZXNoIHJlbGVhc2UgYnJhbmNoZXMgaWYgbm90IGRvaW5nIGFuIGFjdGl2ZSBNUi5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmNvbnN0IHB1cHBldGVlckxvYWQgPSByZXF1aXJlKCAnLi4vLi4vY29tbW9uL3B1cHBldGVlckxvYWQnICk7XHJcbmNvbnN0IE1haW50ZW5hbmNlID0gcmVxdWlyZSggJy4uLy4uL2NvbW1vbi9NYWludGVuYW5jZScgKTtcclxuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xyXG5jb25zdCBwdXBwZXRlZXIgPSByZXF1aXJlKCAncHVwcGV0ZWVyJyApO1xyXG5jb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcclxuXHJcbndpbnN0b24uZGVmYXVsdC50cmFuc3BvcnRzLmNvbnNvbGUubGV2ZWwgPSAnZXJyb3InO1xyXG5cclxuY29uc3QgVEVTVF9MT0NBTEVTID0gdHJ1ZTtcclxuY29uc3QgVEVTVF9BTkFMWVRJQ1MgPSBmYWxzZTtcclxuXHJcbmNvbnN0IGxvY2FsZURhdGEgPSBmcy5yZWFkRmlsZVN5bmMoICcuLi9iYWJlbC9sb2NhbGVEYXRhLmpzb24nLCAndXRmOCcgKTtcclxuXHJcbiggYXN5bmMgKCkgPT4ge1xyXG4gIGNvbnN0IGJyb3dzZXIgPSBhd2FpdCBwdXBwZXRlZXIubGF1bmNoKCB7XHJcbiAgICBhcmdzOiBbXHJcbiAgICAgICctLWRpc2FibGUtZ3B1J1xyXG4gICAgXVxyXG4gIH0gKTtcclxuXHJcbiAgY29uc3QgZ2V0QmFzZVVSTHMgPSBhc3luYyByZWxlYXNlQnJhbmNoID0+IHtcclxuICAgIGNvbnN0IGJ1aWxkRGlyID0gYGh0dHA6Ly9sb2NhbGhvc3QvcmVsZWFzZS1icmFuY2hlcy8ke3JlbGVhc2VCcmFuY2gucmVwb30tJHtyZWxlYXNlQnJhbmNoLmJyYW5jaH0vJHtyZWxlYXNlQnJhbmNoLnJlcG99L2J1aWxkYDtcclxuXHJcbiAgICBjb25zdCB1cmxzID0gW107XHJcblxyXG4gICAgY29uc3QgdXNlc0NoaXBwZXIyID0gYXdhaXQgcmVsZWFzZUJyYW5jaC51c2VzQ2hpcHBlcjIoKTtcclxuXHJcbiAgICBpZiAoIHJlbGVhc2VCcmFuY2guYnJhbmRzLmluY2x1ZGVzKCAncGhldCcgKSApIHtcclxuICAgICAgdXJscy5wdXNoKCBgJHtidWlsZERpcn0vJHt1c2VzQ2hpcHBlcjIgPyAncGhldC8nIDogJyd9JHtyZWxlYXNlQnJhbmNoLnJlcG99X2FsbCR7dXNlc0NoaXBwZXIyID8gJ19waGV0JyA6ICcnfS5odG1sP3dlYmdsPWZhbHNlYCApO1xyXG4gICAgfVxyXG4gICAgaWYgKCByZWxlYXNlQnJhbmNoLmJyYW5kcy5pbmNsdWRlcyggJ3BoZXQtaW8nICkgKSB7XHJcbiAgICAgIGNvbnN0IHN0YW5kYWxvbmVQYXJhbXMgPSBhd2FpdCByZWxlYXNlQnJhbmNoLmdldFBoZXRpb1N0YW5kYWxvbmVRdWVyeVBhcmFtZXRlcigpO1xyXG5cclxuICAgICAgY29uc3QgcGhldGlvU3VmZml4ID0gdXNlc0NoaXBwZXIyID8gJ19hbGxfcGhldC1pbycgOiAnX2VuLXBoZXRpbyc7XHJcblxyXG4gICAgICB1cmxzLnB1c2goIGAke2J1aWxkRGlyfS8ke3VzZXNDaGlwcGVyMiA/ICdwaGV0LWlvLycgOiAnJ30ke3JlbGVhc2VCcmFuY2gucmVwb30ke3BoZXRpb1N1ZmZpeH0uaHRtbD8ke3N0YW5kYWxvbmVQYXJhbXN9JndlYmdsPWZhbHNlYCApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB1cmxzO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IGdldExvYWRlZFVSTHMgPSBhc3luYyB1cmwgPT4ge1xyXG4gICAgY29uc3QgdXJscyA9IFtdO1xyXG5cclxuICAgIGF3YWl0IHB1cHBldGVlckxvYWQoIHVybCwge1xyXG4gICAgICBvblBhZ2VDcmVhdGlvbjogcGFnZSA9PiBwYWdlLm9uKCAncmVxdWVzdCcsIHJlcXVlc3QgPT4ge1xyXG4gICAgICAgIGNvbnN0IHVybCA9IHJlcXVlc3QudXJsKCk7XHJcblxyXG4gICAgICAgIGlmICggIXVybC5zdGFydHNXaXRoKCAnZGF0YTonICkgKSB7XHJcbiAgICAgICAgICB1cmxzLnB1c2goIHVybCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApLFxyXG4gICAgICBnb3RvVGltZW91dDogNjAwMDAsXHJcbiAgICAgIHdhaXRBZnRlckxvYWQ6IDIwMDAsXHJcbiAgICAgIGJyb3dzZXI6IGJyb3dzZXJcclxuICAgIH0gKTtcclxuXHJcbiAgICByZXR1cm4gdXJscztcclxuICB9O1xyXG5cclxuICBjb25zdCBkZW1vWW90dGFRdWVyeVBhcmFtZXRlcktleSA9ICd5b3R0YVNvbWVGbGFnJztcclxuICBjb25zdCBkZW1vWW90dGFRdWVyeVBhcmFtZXRlclZhbHVlID0gJ3NvbWVWYWx1ZSc7XHJcblxyXG4gIGNvbnN0IGFuYWx5emVVUkxzID0gdXJscyA9PiB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzZW50R29vZ2xlQW5hbHl0aWNzOiB1cmxzLnNvbWUoIHVybCA9PiB1cmwuaW5jbHVkZXMoICdjb2xsZWN0PycgKSApLFxyXG4gICAgICBzZW50WW90dGE6IHVybHMuc29tZSggdXJsID0+IHVybC5pbmNsdWRlcyggJ3lvdHRhL2ltbWVkaWF0ZS5naWYnICkgKSxcclxuICAgICAgc2VudEV4dGVybmFsUmVxdWVzdDogdXJscy5zb21lKCB1cmwgPT4gIXVybC5zdGFydHNXaXRoKCAnaHR0cDovL2xvY2FsaG9zdCcgKSApLFxyXG4gICAgICBoYXNEZW1vWW90dGFRdWVyeVBhcmFtZXRlcjogdXJscy5zb21lKCB1cmwgPT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgVVJMU2VhcmNoUGFyYW1zKCBuZXcgVVJMKCB1cmwgKS5zZWFyY2ggKS5nZXQoIGRlbW9Zb3R0YVF1ZXJ5UGFyYW1ldGVyS2V5ICkgPT09IGRlbW9Zb3R0YVF1ZXJ5UGFyYW1ldGVyVmFsdWU7XHJcbiAgICAgIH0gKVxyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBmb3IgKCBjb25zdCByZWxlYXNlQnJhbmNoIG9mIGF3YWl0IE1haW50ZW5hbmNlLmxvYWRBbGxNYWludGVuYW5jZUJyYW5jaGVzKCkgKSB7XHJcbiAgICBjb25zb2xlLmxvZyggcmVsZWFzZUJyYW5jaC50b1N0cmluZygpICk7XHJcblxyXG4gICAgY29uc3QgdXJscyA9IGF3YWl0IGdldEJhc2VVUkxzKCByZWxlYXNlQnJhbmNoICk7XHJcblxyXG4gICAgZm9yICggY29uc3QgdXJsIG9mIHVybHMgKSB7XHJcblxyXG4gICAgICBpZiAoIFRFU1RfTE9DQUxFUyApIHtcclxuICAgICAgICAvLyBUT0RPOiB0ZXN0IHVuYnVpbHQgbG9jYWxlcyAoaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2pvaXN0L2lzc3Vlcy85NjMpXHJcblxyXG4gICAgICAgIC8vIENoZWNrIGxvY2FsZSBNUi4gZXNfUFkgc2hvdWxkIGFsd2F5cyBiZSBpbiBsb2NhbGVEYXRhXHJcbiAgICAgICAgY29uc3QgbG9jYWxlVmFsdWVzID0gYXdhaXQgcHVwcGV0ZWVyTG9hZCggdXJsLCB7XHJcbiAgICAgICAgICBldmFsdWF0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gWyAhIXBoZXQuY2hpcHBlci5sb2NhbGVEYXRhLCAhISggcGhldC5jaGlwcGVyLmxvY2FsZURhdGE/LmVzX1BZICkgXTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBnb3RvVGltZW91dDogNjAwMDAsXHJcbiAgICAgICAgICB3YWl0QWZ0ZXJMb2FkOiAyMDAwLFxyXG4gICAgICAgICAgYnJvd3NlcjogYnJvd3NlclxyXG4gICAgICAgIH0gKTtcclxuICAgICAgICBpZiAoICFsb2NhbGVWYWx1ZXNbIDAgXSApIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCAnICBubyBsb2NhbGVEYXRhJyApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoICFsb2NhbGVWYWx1ZXNbIDEgXSApIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCAnICBubyBlc19QWSBsb2NhbGVEYXRhJyApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZ2V0UnVubmluZ0xvY2FsZSA9IGFzeW5jIGxvY2FsZSA9PiB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgcHVwcGV0ZWVyTG9hZCggdXJsLmluY2x1ZGVzKCAnPycgKSA/IGAke3VybH0mbG9jYWxlPSR7bG9jYWxlfWAgOiBgJHt1cmx9P2xvY2FsZT0ke2xvY2FsZX1gLCB7XHJcbiAgICAgICAgICAgICAgZXZhbHVhdGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwaGV0LmNoaXBwZXIubG9jYWxlO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgZ290b1RpbWVvdXQ6IDYwMDAwLFxyXG4gICAgICAgICAgICAgIHdhaXRBZnRlckxvYWQ6IDIwMDAsXHJcbiAgICAgICAgICAgICAgYnJvd3NlcjogYnJvd3NlclxyXG4gICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjYXRjaCAoIGUgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCBgICBlcnJvciBydW5uaW5nIHdpdGggbG9jYWxlPSR7bG9jYWxlfWApO1xyXG4gICAgICAgICAgICByZXR1cm4gJ2Vycm9yJztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zdCBlc0xvY2FsZSA9IGF3YWl0IGdldFJ1bm5pbmdMb2NhbGUoICdlcycgKTtcclxuICAgICAgICBpZiAoIGVzTG9jYWxlICE9PSAnZXMnICkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coICcgIGVzIGxvY2FsZSBub3QgZXMnICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzcGFMb2NhbGUgPSBhd2FpdCBnZXRSdW5uaW5nTG9jYWxlKCAnc3BhJyApO1xyXG4gICAgICAgIGlmICggc3BhTG9jYWxlICE9PSAnZXMnICkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coICcgIHNwYSBsb2NhbGUgbm90IGVzJyApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZXNweUxvY2FsZSA9IGF3YWl0IGdldFJ1bm5pbmdMb2NhbGUoICdFU19QWScgKTtcclxuICAgICAgICBpZiAoIGVzcHlMb2NhbGUgIT09ICdlcycgJiYgZXNweUxvY2FsZSAhPT0gJ2VzX1BZJyApIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCAnICBFU19QWSBsb2NhbGUgbm90IGVzL2VzX1BZJyApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgaW52YWxpZExvY2FsZSA9IGF3YWl0IGdldFJ1bm5pbmdMb2NhbGUoICdhZW5ydHB5YXJudFNSVFMnICk7XHJcbiAgICAgICAgaWYgKCBpbnZhbGlkTG9jYWxlICE9PSAnZW4nICkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coICcgIGludmFsaWQgbG9jYWxlIGlzc3VlLCBub3QgZW4nICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCByZXBvUGFja2FnZU9iamVjdCA9IEpTT04ucGFyc2UoIGZzLnJlYWRGaWxlU3luYyggYC4uLyR7cmVsZWFzZUJyYW5jaC5yZXBvfS9wYWNrYWdlLmpzb25gLCAndXRmOCcgKSApO1xyXG5cclxuICAgICAgICBjb25zdCBwYXJ0aWFsUG90ZW50aWFsVGl0bGVTdHJpbmdLZXkgPSBgJHtyZXBvUGFja2FnZU9iamVjdC5waGV0LnJlcXVpcmVqc05hbWVzcGFjZX0vJHtyZWxlYXNlQnJhbmNoLnJlcG99LnRpdGxlYDtcclxuICAgICAgICBjb25zdCBmdWxsUG90ZW50aWFsVGl0bGVTdHJpbmdLZXkgPSBgJHtyZXBvUGFja2FnZU9iamVjdC5waGV0LnJlcXVpcmVqc05hbWVzcGFjZX0vJHtwYXJ0aWFsUG90ZW50aWFsVGl0bGVTdHJpbmdLZXl9YDtcclxuXHJcbiAgICAgICAgY29uc3QgaGFzVGl0bGVLZXkgPSBhd2FpdCBwdXBwZXRlZXJMb2FkKCB1cmwsIHtcclxuICAgICAgICAgIGV2YWx1YXRlOiBgISFwaGV0LmNoaXBwZXIuc3RyaW5ncy5lblsgXCIke2Z1bGxQb3RlbnRpYWxUaXRsZVN0cmluZ0tleX1cIiBdYCxcclxuICAgICAgICAgIGdvdG9UaW1lb3V0OiA2MDAwMCxcclxuICAgICAgICAgIHdhaXRBZnRlckxvYWQ6IDIwMDAsXHJcbiAgICAgICAgICBicm93c2VyOiBicm93c2VyXHJcbiAgICAgICAgfSApO1xyXG5cclxuICAgICAgICBpZiAoIGhhc1RpdGxlS2V5ICkge1xyXG4gICAgICAgICAgY29uc3QgZ2V0VGl0bGUgPSBhc3luYyBsb2NhbGUgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBhd2FpdCBwdXBwZXRlZXJMb2FkKCB1cmwuaW5jbHVkZXMoICc/JyApID8gYCR7dXJsfSZsb2NhbGU9JHtsb2NhbGV9YCA6IGAke3VybH0/bG9jYWxlPSR7bG9jYWxlfWAsIHtcclxuICAgICAgICAgICAgICAgIGV2YWx1YXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBkb2N1bWVudC50aXRsZTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBnb3RvVGltZW91dDogNjAwMDAsXHJcbiAgICAgICAgICAgICAgICB3YWl0QWZ0ZXJMb2FkOiAyMDAwLFxyXG4gICAgICAgICAgICAgICAgYnJvd3NlcjogYnJvd3NlclxyXG4gICAgICAgICAgICAgIH0gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXRjaCAoIGUgKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coIGAgIGVycm9yIHJ1bm5pbmcgd2l0aCBsb2NhbGU9JHtsb2NhbGV9YCk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuICdlcnJvcic7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgLy8gbnVsbCBpZiBjb3VsZCBub3QgYmUgZm91bmRcclxuICAgICAgICAgIGNvbnN0IGxvb2t1cFNwZWNpZmljVGl0bGVUcmFuc2xhdGlvbiA9IGxvY2FsZSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBqc29uO1xyXG4gICAgICAgICAgICBpZiAoIGxvY2FsZSA9PT0gJ2VuJyApIHtcclxuICAgICAgICAgICAgICBqc29uID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBgLi4vJHtyZWxlYXNlQnJhbmNoLnJlcG99LyR7cmVsZWFzZUJyYW5jaC5yZXBvfS1zdHJpbmdzX2VuLmpzb25gLCAndXRmOCcgKSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBqc29uID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBgLi4vYmFiZWwvJHtyZWxlYXNlQnJhbmNoLnJlcG99LyR7cmVsZWFzZUJyYW5jaC5yZXBvfS1zdHJpbmdzXyR7bG9jYWxlfS5qc29uYCwgJ3V0ZjgnICkgKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgY2F0Y2ggKCBlICkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBqc29uWyBwYXJ0aWFsUG90ZW50aWFsVGl0bGVTdHJpbmdLZXkgXT8udmFsdWUgPz8gbnVsbDtcclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgY29uc3QgbG9va3VwRmFsbGJhY2tUaXRsZSA9IGxvY2FsZSA9PiB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBsb2NhbGVzID0gW1xyXG4gICAgICAgICAgICAgIGxvY2FsZSxcclxuICAgICAgICAgICAgICAuLi4oIGxvY2FsZURhdGFbIGxvY2FsZSBdPy5mYWxsYmFja0xvY2FsZXMgfHwgW10gKSxcclxuICAgICAgICAgICAgICAnZW4nXHJcbiAgICAgICAgICAgIF07XHJcblxyXG4gICAgICAgICAgICBmb3IgKCBjb25zdCB0ZXN0TG9jYWxlIG9mIGxvY2FsZXMgKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgdGl0bGUgPSBsb29rdXBTcGVjaWZpY1RpdGxlVHJhbnNsYXRpb24oIHRlc3RMb2NhbGUgKTtcclxuICAgICAgICAgICAgICBpZiAoIHRpdGxlICkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRpdGxlO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBgY291bGQgbm90IGNvbXB1dGUgZmFsbGJhY2sgdGl0bGUgZm9yIGxvY2FsZSAke2xvY2FsZX1gICk7XHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIGNvbnN0IGNoZWNrVGl0bGUgPSBhc3luYyAoIGxvY2FsZSwgbG9va3VwTG9jYWxlICkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBhY3R1YWxUaXRsZSA9IGF3YWl0IGdldFRpdGxlKCBsb2NhbGUgKTtcclxuICAgICAgICAgICAgY29uc3QgZXhwZWN0ZWRUaXRsZSA9IGxvb2t1cEZhbGxiYWNrVGl0bGUoIGxvb2t1cExvY2FsZSApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBhY3R1YWxUaXRsZS5pbmNsdWRlcyggZXhwZWN0ZWRUaXRsZSApICkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgIHJldHVybiBgQWN0dWFsIHRpdGxlICR7SlNPTi5zdHJpbmdpZnkoIGFjdHVhbFRpdGxlICl9IGRvZXMgbm90IG1hdGNoIGV4cGVjdGVkIHRpdGxlICR7SlNPTi5zdHJpbmdpZnkoIGV4cGVjdGVkVGl0bGUgKX0gZm9yIGxvY2FsZSAke2xvY2FsZX0gLyAke2xvb2t1cExvY2FsZX1gO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIGNvbnN0IGVzVGl0bGVFcnJvciA9IGF3YWl0IGNoZWNrVGl0bGUoICdlcycgKTtcclxuICAgICAgICAgIGlmICggZXNUaXRsZUVycm9yICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyggYCAgZXMgdGl0bGUgZXJyb3I6ICR7ZXNUaXRsZUVycm9yfWAgKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBjb25zdCBzcGFUaXRsZUVycm9yID0gYXdhaXQgY2hlY2tUaXRsZSggJ3NwYScsICdlcycgKTtcclxuICAgICAgICAgIGlmICggc3BhVGl0bGVFcnJvciApIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coIGAgIHNwYSB0aXRsZSBlcnJvcjogJHtzcGFUaXRsZUVycm9yfWAgKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBjb25zdCBlc3B5VGl0bGVFcnJvciA9IGF3YWl0IGNoZWNrVGl0bGUoICdFU19QWScsICdlc19QWScgKTtcclxuICAgICAgICAgIGlmICggZXNweVRpdGxlRXJyb3IgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCBgICBFU19QWSB0aXRsZSBlcnJvcjogJHtlc3B5VGl0bGVFcnJvcn1gICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coICcgICAgKGNvdWxkIG5vdCBmaW5kIHRpdGxlIHN0cmluZyBrZXkpJyApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCBURVNUX0FOQUxZVElDUyApIHtcclxuICAgICAgICBjb25zdCBwbGFpblVSTCA9IHVybDtcclxuICAgICAgICBjb25zdCBwbGFpbkFuYWx5c2lzID0gYW5hbHl6ZVVSTHMoIGF3YWl0IGdldExvYWRlZFVSTHMoIHBsYWluVVJMICkgKTtcclxuICAgICAgICBpZiAoICFwbGFpbkFuYWx5c2lzLnNlbnRHb29nbGVBbmFseXRpY3MgKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggJyAgTm8gR29vZ2xlIEFuYWx5dGljcyBzZW50JywgcGxhaW5VUkwgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCAhcGxhaW5BbmFseXNpcy5zZW50WW90dGEgKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggJyAgTm8geW90dGEgc2VudCcsIHBsYWluVVJMICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB5b3R0YUZhbHNlVVJMID0gYCR7dXJsfSZ5b3R0YT1mYWxzZWA7XHJcbiAgICAgICAgY29uc3QgeW90dGFGYWxzZUFuYWx5c2lzID0gYW5hbHl6ZVVSTHMoIGF3YWl0IGdldExvYWRlZFVSTHMoIHlvdHRhRmFsc2VVUkwgKSApO1xyXG4gICAgICAgIGlmICggeW90dGFGYWxzZUFuYWx5c2lzLnNlbnRFeHRlcm5hbFJlcXVlc3QgfHwgeW90dGFGYWxzZUFuYWx5c2lzLnNlbnRHb29nbGVBbmFseXRpY3MgfHwgeW90dGFGYWxzZUFuYWx5c2lzLnNlbnRZb3R0YSApIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCAnICB5b3R0YT1mYWxzZSBzZW50IHNvbWV0aGluZycsIHlvdHRhRmFsc2VBbmFseXNpcyApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgeW90dGFTb21lRmxhZ1VSTCA9IGAke3VybH0mJHtkZW1vWW90dGFRdWVyeVBhcmFtZXRlcktleX09JHtkZW1vWW90dGFRdWVyeVBhcmFtZXRlclZhbHVlfWA7XHJcbiAgICAgICAgY29uc3QgeW90dGFTb21lRmxhZ0FuYWx5c2lzID0gYW5hbHl6ZVVSTHMoIGF3YWl0IGdldExvYWRlZFVSTHMoIHlvdHRhU29tZUZsYWdVUkwgKSApO1xyXG4gICAgICAgIGlmICggIXlvdHRhU29tZUZsYWdBbmFseXNpcy5oYXNEZW1vWW90dGFRdWVyeVBhcmFtZXRlciApIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCBgICBObyAke2RlbW9Zb3R0YVF1ZXJ5UGFyYW1ldGVyS2V5fT0ke2RlbW9Zb3R0YVF1ZXJ5UGFyYW1ldGVyVmFsdWV9IHNlbnRgLCB5b3R0YVNvbWVGbGFnQW5hbHlzaXMgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIENvbnNpZGVyIGFkZGluZyBmdXp6aW5nIGluIHRoZSBmdXR1cmUsIGl0IHNlZW1zIGxpa2Ugd2UncmUgdW5hYmxlIHRvIGdldCB0aGluZ3MgdG8gcnVuIGFmdGVyIGEgZnV6eiBmYWlsdXJlIHRob3VnaFxyXG4gICAgICAvLyBjb25zdCBmdXp6VVJMID0gYCR7dXJsfSZmdXp6JmZ1enpNb3VzZSZmdXp6VG91Y2gmZnV6ekJvYXJkYDtcclxuICAgICAgLy8gdHJ5IHtcclxuICAgICAgLy8gICBhd2FpdCBwdXBwZXRlZXJMb2FkKCBmdXp6VVJMLCB7XHJcbiAgICAgIC8vICAgICB3YWl0Rm9yRnVuY3Rpb246ICd3aW5kb3cucGhldC5qb2lzdC5zaW0nLFxyXG4gICAgICAvLyAgICAgZ290b1RpbWVvdXQ6IDYwMDAwLFxyXG4gICAgICAvLyAgICAgd2FpdEFmdGVyTG9hZDogNTAwMCxcclxuICAgICAgLy8gICAgIGJyb3dzZXI6IGJyb3dzZXJcclxuICAgICAgLy8gICB9ICk7XHJcbiAgICAgIC8vIH1cclxuICAgICAgLy8gY2F0Y2goIGUgKSB7XHJcbiAgICAgIC8vICAgY29uc29sZS5sb2coIGBmdXp6IGZhaWx1cmUgb24gJHtmdXp6VVJMfTpcXG4ke2V9YCApO1xyXG4gICAgICAvLyB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBicm93c2VyLmNsb3NlKCk7XHJcbn0gKSgpOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxNQUFNQSxhQUFhLEdBQUdDLE9BQU8sQ0FBRSw0QkFBNkIsQ0FBQztBQUM3RCxNQUFNQyxXQUFXLEdBQUdELE9BQU8sQ0FBRSwwQkFBMkIsQ0FBQztBQUN6RCxNQUFNRSxPQUFPLEdBQUdGLE9BQU8sQ0FBRSxTQUFVLENBQUM7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