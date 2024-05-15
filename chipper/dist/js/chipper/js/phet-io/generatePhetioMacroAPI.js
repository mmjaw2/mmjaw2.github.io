// Copyright 2019-2024, University of Colorado Boulder

/**
 * Launch an instance of the simulation using puppeteer, gather the PhET-iO API of the simulation,
 * see phetioEngine.getPhetioElementsBaseline
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

const puppeteer = require('puppeteer');
const _ = require('lodash');
const assert = require('assert');
const showCommandLineProgress = require('../common/showCommandLineProgress');
const withServer = require('../../../perennial-alias/js/common/withServer');

/**
 * Load each sim provided and get the
 * @param {string[]} repos
 * @param {Object} [options]
 * @returns {Promise.<Object.<string, Object>>} - keys are the repos, values are the APIs for each repo. If there was a problem with getting the API with throwAPIGenerationErrors:false, then it will return null for that repo.
 */
const generatePhetioMacroAPI = async (repos, options) => {
  assert(repos.length === _.uniq(repos).length, 'repos should be unique');
  options = _.assignIn({
    fromBuiltVersion: false,
    // if the built file should be used to generate the API (otherwise uses unbuilt)
    chunkSize: 4,
    // split into chunks with (at most) this many elements per chunk
    showProgressBar: false,
    showMessagesFromSim: true,
    // If false, allow individual repos return null if they encountered problems
    throwAPIGenerationErrors: true
  }, options);
  repos.length > 1 && console.log('Generating PhET-iO API for repos:', repos.join(', '));
  return withServer(async port => {
    const browser = await puppeteer.launch({
      timeout: 120000,
      args: ['--disable-gpu',
      // Fork child processes directly to prevent orphaned chrome instances from lingering on sparky, https://github.com/phetsims/aqua/issues/150#issuecomment-1170140994
      '--no-zygote', '--no-sandbox']
    });
    const chunks = _.chunk(repos, options.chunkSize);
    const macroAPI = {}; // if throwAPIGenerationErrors:false, a repo will be null if it encountered errors.
    const errors = {};
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      options.showProgressBar && showCommandLineProgress(i / chunks.length, false);
      const promises = chunk.map(async repo => {
        const page = await browser.newPage();
        return new Promise(async (resolve, reject) => {
          // eslint-disable-line no-async-promise-executor

          let cleaned = false;
          // Returns whether we closed the page
          const cleanup = async () => {
            if (cleaned) {
              return false;
            }
            cleaned = true; // must be before the close to prevent cleaning from being done twice if errors occur from page close.

            clearTimeout(id);
            await page.close();
            return true;
          };

          // This is likely to occur in the middle of page.goto, so we need to be graceful to the fact that resolving
          // and closing the page will then cause an error in the page.goto call, see https://github.com/phetsims/perennial/issues/268#issuecomment-1382374092
          const cleanupAndResolve = async value => {
            if (await cleanup()) {
              resolve(value);
            }
          };
          const cleanupAndReject = async e => {
            if (await cleanup()) {
              resolve({
                repo: repo,
                error: e
              });
            }
          };

          // Fail if this takes too long.  Doesn't need to be cleared since only the first resolve/reject is used
          const id = setTimeout(() => cleanupAndReject(new Error(`Timeout in generatePhetioMacroAPI for ${repo}`)), 120000);
          page.on('console', async msg => {
            const messageText = msg.text();
            if (messageText.indexOf('"phetioFullAPI": true,') >= 0) {
              const fullAPI = messageText;
              cleanupAndResolve({
                // to keep track of which repo this is for
                repo: repo,
                // For machine readability
                api: JSON.parse(fullAPI)
              });
            }
          });
          page.on('error', cleanupAndReject);
          page.on('pageerror', cleanupAndReject);
          const relativePath = options.fromBuiltVersion ? `build/phet-io/${repo}_all_phet-io.html` : `${repo}_en.html`;

          // NOTE: DUPLICATION ALERT: This random seed is copied wherever API comparison is done against the generated API. Don't change this
          // without looking for other usages of this random seed value.
          const url = `http://localhost:${port}/${repo}/${relativePath}?ea&brand=phet-io&phetioStandalone&phetioPrintAPI&randomSeed=332211&locales=*&webgl=false`;
          try {
            await page.goto(url, {
              timeout: 120000
            });
          } catch (e) {
            await cleanupAndReject(new Error(`page.goto failure: ${e}`));
          }
        });
      });
      const chunkResults = await Promise.allSettled(promises);
      chunkResults.forEach(chunkResult => {
        const repo = chunkResult.value.repo;
        macroAPI[repo] = chunkResult.value.api || null;
        const error = chunkResult.value.error;
        if (error) {
          if (options.throwAPIGenerationErrors) {
            console.error(`Error in ${repo}:`);
            throw error;
          } else {
            errors[repo] = error;
          }
        }
      });
    }
    options.showProgressBar && showCommandLineProgress(1, true);
    await browser.close();
    if (Object.keys(errors).length > 0) {
      console.error('Errors while generating PhET-iO APIs:', errors);
    }
    return macroAPI;
  });
};

// @public (read-only)
generatePhetioMacroAPI.apiVersion = '1.0.0-dev.0';

/**
 * @param {string[]} repos
 * @param {Object} [options]
 */
module.exports = generatePhetioMacroAPI;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwdXBwZXRlZXIiLCJyZXF1aXJlIiwiXyIsImFzc2VydCIsInNob3dDb21tYW5kTGluZVByb2dyZXNzIiwid2l0aFNlcnZlciIsImdlbmVyYXRlUGhldGlvTWFjcm9BUEkiLCJyZXBvcyIsIm9wdGlvbnMiLCJsZW5ndGgiLCJ1bmlxIiwiYXNzaWduSW4iLCJmcm9tQnVpbHRWZXJzaW9uIiwiY2h1bmtTaXplIiwic2hvd1Byb2dyZXNzQmFyIiwic2hvd01lc3NhZ2VzRnJvbVNpbSIsInRocm93QVBJR2VuZXJhdGlvbkVycm9ycyIsImNvbnNvbGUiLCJsb2ciLCJqb2luIiwicG9ydCIsImJyb3dzZXIiLCJsYXVuY2giLCJ0aW1lb3V0IiwiYXJncyIsImNodW5rcyIsImNodW5rIiwibWFjcm9BUEkiLCJlcnJvcnMiLCJpIiwicHJvbWlzZXMiLCJtYXAiLCJyZXBvIiwicGFnZSIsIm5ld1BhZ2UiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImNsZWFuZWQiLCJjbGVhbnVwIiwiY2xlYXJUaW1lb3V0IiwiaWQiLCJjbG9zZSIsImNsZWFudXBBbmRSZXNvbHZlIiwidmFsdWUiLCJjbGVhbnVwQW5kUmVqZWN0IiwiZSIsImVycm9yIiwic2V0VGltZW91dCIsIkVycm9yIiwib24iLCJtc2ciLCJtZXNzYWdlVGV4dCIsInRleHQiLCJpbmRleE9mIiwiZnVsbEFQSSIsImFwaSIsIkpTT04iLCJwYXJzZSIsInJlbGF0aXZlUGF0aCIsInVybCIsImdvdG8iLCJjaHVua1Jlc3VsdHMiLCJhbGxTZXR0bGVkIiwiZm9yRWFjaCIsImNodW5rUmVzdWx0IiwiT2JqZWN0Iiwia2V5cyIsImFwaVZlcnNpb24iLCJtb2R1bGUiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsiZ2VuZXJhdGVQaGV0aW9NYWNyb0FQSS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOS0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBMYXVuY2ggYW4gaW5zdGFuY2Ugb2YgdGhlIHNpbXVsYXRpb24gdXNpbmcgcHVwcGV0ZWVyLCBnYXRoZXIgdGhlIFBoRVQtaU8gQVBJIG9mIHRoZSBzaW11bGF0aW9uLFxyXG4gKiBzZWUgcGhldGlvRW5naW5lLmdldFBoZXRpb0VsZW1lbnRzQmFzZWxpbmVcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIENocmlzIEtsdXNlbmRvcmYgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuXHJcbmNvbnN0IHB1cHBldGVlciA9IHJlcXVpcmUoICdwdXBwZXRlZXInICk7XHJcbmNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xyXG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCAnYXNzZXJ0JyApO1xyXG5jb25zdCBzaG93Q29tbWFuZExpbmVQcm9ncmVzcyA9IHJlcXVpcmUoICcuLi9jb21tb24vc2hvd0NvbW1hbmRMaW5lUHJvZ3Jlc3MnICk7XHJcbmNvbnN0IHdpdGhTZXJ2ZXIgPSByZXF1aXJlKCAnLi4vLi4vLi4vcGVyZW5uaWFsLWFsaWFzL2pzL2NvbW1vbi93aXRoU2VydmVyJyApO1xyXG5cclxuLyoqXHJcbiAqIExvYWQgZWFjaCBzaW0gcHJvdmlkZWQgYW5kIGdldCB0aGVcclxuICogQHBhcmFtIHtzdHJpbmdbXX0gcmVwb3NcclxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48T2JqZWN0LjxzdHJpbmcsIE9iamVjdD4+fSAtIGtleXMgYXJlIHRoZSByZXBvcywgdmFsdWVzIGFyZSB0aGUgQVBJcyBmb3IgZWFjaCByZXBvLiBJZiB0aGVyZSB3YXMgYSBwcm9ibGVtIHdpdGggZ2V0dGluZyB0aGUgQVBJIHdpdGggdGhyb3dBUElHZW5lcmF0aW9uRXJyb3JzOmZhbHNlLCB0aGVuIGl0IHdpbGwgcmV0dXJuIG51bGwgZm9yIHRoYXQgcmVwby5cclxuICovXHJcbmNvbnN0IGdlbmVyYXRlUGhldGlvTWFjcm9BUEkgPSBhc3luYyAoIHJlcG9zLCBvcHRpb25zICkgPT4ge1xyXG5cclxuICBhc3NlcnQoIHJlcG9zLmxlbmd0aCA9PT0gXy51bmlxKCByZXBvcyApLmxlbmd0aCwgJ3JlcG9zIHNob3VsZCBiZSB1bmlxdWUnICk7XHJcblxyXG4gIG9wdGlvbnMgPSBfLmFzc2lnbkluKCB7XHJcbiAgICBmcm9tQnVpbHRWZXJzaW9uOiBmYWxzZSwgLy8gaWYgdGhlIGJ1aWx0IGZpbGUgc2hvdWxkIGJlIHVzZWQgdG8gZ2VuZXJhdGUgdGhlIEFQSSAob3RoZXJ3aXNlIHVzZXMgdW5idWlsdClcclxuICAgIGNodW5rU2l6ZTogNCwgLy8gc3BsaXQgaW50byBjaHVua3Mgd2l0aCAoYXQgbW9zdCkgdGhpcyBtYW55IGVsZW1lbnRzIHBlciBjaHVua1xyXG4gICAgc2hvd1Byb2dyZXNzQmFyOiBmYWxzZSxcclxuICAgIHNob3dNZXNzYWdlc0Zyb21TaW06IHRydWUsXHJcblxyXG4gICAgLy8gSWYgZmFsc2UsIGFsbG93IGluZGl2aWR1YWwgcmVwb3MgcmV0dXJuIG51bGwgaWYgdGhleSBlbmNvdW50ZXJlZCBwcm9ibGVtc1xyXG4gICAgdGhyb3dBUElHZW5lcmF0aW9uRXJyb3JzOiB0cnVlXHJcbiAgfSwgb3B0aW9ucyApO1xyXG5cclxuICByZXBvcy5sZW5ndGggPiAxICYmIGNvbnNvbGUubG9nKCAnR2VuZXJhdGluZyBQaEVULWlPIEFQSSBmb3IgcmVwb3M6JywgcmVwb3Muam9pbiggJywgJyApICk7XHJcblxyXG4gIHJldHVybiB3aXRoU2VydmVyKCBhc3luYyBwb3J0ID0+IHtcclxuICAgIGNvbnN0IGJyb3dzZXIgPSBhd2FpdCBwdXBwZXRlZXIubGF1bmNoKCB7XHJcbiAgICAgIHRpbWVvdXQ6IDEyMDAwMCxcclxuICAgICAgYXJnczogW1xyXG4gICAgICAgICctLWRpc2FibGUtZ3B1JyxcclxuXHJcbiAgICAgICAgLy8gRm9yayBjaGlsZCBwcm9jZXNzZXMgZGlyZWN0bHkgdG8gcHJldmVudCBvcnBoYW5lZCBjaHJvbWUgaW5zdGFuY2VzIGZyb20gbGluZ2VyaW5nIG9uIHNwYXJreSwgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2FxdWEvaXNzdWVzLzE1MCNpc3N1ZWNvbW1lbnQtMTE3MDE0MDk5NFxyXG4gICAgICAgICctLW5vLXp5Z290ZScsXHJcbiAgICAgICAgJy0tbm8tc2FuZGJveCdcclxuICAgICAgXVxyXG4gICAgfSApO1xyXG4gICAgY29uc3QgY2h1bmtzID0gXy5jaHVuayggcmVwb3MsIG9wdGlvbnMuY2h1bmtTaXplICk7XHJcblxyXG4gICAgY29uc3QgbWFjcm9BUEkgPSB7fTsgLy8gaWYgdGhyb3dBUElHZW5lcmF0aW9uRXJyb3JzOmZhbHNlLCBhIHJlcG8gd2lsbCBiZSBudWxsIGlmIGl0IGVuY291bnRlcmVkIGVycm9ycy5cclxuICAgIGNvbnN0IGVycm9ycyA9IHt9O1xyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGNodW5rcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgY2h1bmsgPSBjaHVua3NbIGkgXTtcclxuICAgICAgb3B0aW9ucy5zaG93UHJvZ3Jlc3NCYXIgJiYgc2hvd0NvbW1hbmRMaW5lUHJvZ3Jlc3MoIGkgLyBjaHVua3MubGVuZ3RoLCBmYWxzZSApO1xyXG5cclxuICAgICAgY29uc3QgcHJvbWlzZXMgPSBjaHVuay5tYXAoIGFzeW5jIHJlcG8gPT4ge1xyXG4gICAgICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCBicm93c2VyLm5ld1BhZ2UoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKCBhc3luYyAoIHJlc29sdmUsIHJlamVjdCApID0+IHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1hc3luYy1wcm9taXNlLWV4ZWN1dG9yXHJcblxyXG4gICAgICAgICAgbGV0IGNsZWFuZWQgPSBmYWxzZTtcclxuICAgICAgICAgIC8vIFJldHVybnMgd2hldGhlciB3ZSBjbG9zZWQgdGhlIHBhZ2VcclxuICAgICAgICAgIGNvbnN0IGNsZWFudXAgPSBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICggY2xlYW5lZCApIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICAgICAgICAgIGNsZWFuZWQgPSB0cnVlOyAvLyBtdXN0IGJlIGJlZm9yZSB0aGUgY2xvc2UgdG8gcHJldmVudCBjbGVhbmluZyBmcm9tIGJlaW5nIGRvbmUgdHdpY2UgaWYgZXJyb3JzIG9jY3VyIGZyb20gcGFnZSBjbG9zZS5cclxuXHJcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCggaWQgKTtcclxuICAgICAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIC8vIFRoaXMgaXMgbGlrZWx5IHRvIG9jY3VyIGluIHRoZSBtaWRkbGUgb2YgcGFnZS5nb3RvLCBzbyB3ZSBuZWVkIHRvIGJlIGdyYWNlZnVsIHRvIHRoZSBmYWN0IHRoYXQgcmVzb2x2aW5nXHJcbiAgICAgICAgICAvLyBhbmQgY2xvc2luZyB0aGUgcGFnZSB3aWxsIHRoZW4gY2F1c2UgYW4gZXJyb3IgaW4gdGhlIHBhZ2UuZ290byBjYWxsLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BlcmVubmlhbC9pc3N1ZXMvMjY4I2lzc3VlY29tbWVudC0xMzgyMzc0MDkyXHJcbiAgICAgICAgICBjb25zdCBjbGVhbnVwQW5kUmVzb2x2ZSA9IGFzeW5jIHZhbHVlID0+IHtcclxuICAgICAgICAgICAgaWYgKCBhd2FpdCBjbGVhbnVwKCkgKSB7XHJcbiAgICAgICAgICAgICAgcmVzb2x2ZSggdmFsdWUgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIGNvbnN0IGNsZWFudXBBbmRSZWplY3QgPSBhc3luYyBlID0+IHtcclxuICAgICAgICAgICAgaWYgKCBhd2FpdCBjbGVhbnVwKCkgKSB7XHJcbiAgICAgICAgICAgICAgcmVzb2x2ZSgge1xyXG4gICAgICAgICAgICAgICAgcmVwbzogcmVwbyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlXHJcbiAgICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIC8vIEZhaWwgaWYgdGhpcyB0YWtlcyB0b28gbG9uZy4gIERvZXNuJ3QgbmVlZCB0byBiZSBjbGVhcmVkIHNpbmNlIG9ubHkgdGhlIGZpcnN0IHJlc29sdmUvcmVqZWN0IGlzIHVzZWRcclxuICAgICAgICAgIGNvbnN0IGlkID0gc2V0VGltZW91dCggKCkgPT4gY2xlYW51cEFuZFJlamVjdCggbmV3IEVycm9yKCBgVGltZW91dCBpbiBnZW5lcmF0ZVBoZXRpb01hY3JvQVBJIGZvciAke3JlcG99YCApICksIDEyMDAwMCApO1xyXG5cclxuICAgICAgICAgIHBhZ2Uub24oICdjb25zb2xlJywgYXN5bmMgbXNnID0+IHtcclxuICAgICAgICAgICAgY29uc3QgbWVzc2FnZVRleHQgPSBtc2cudGV4dCgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBtZXNzYWdlVGV4dC5pbmRleE9mKCAnXCJwaGV0aW9GdWxsQVBJXCI6IHRydWUsJyApID49IDAgKSB7XHJcblxyXG4gICAgICAgICAgICAgIGNvbnN0IGZ1bGxBUEkgPSBtZXNzYWdlVGV4dDtcclxuXHJcbiAgICAgICAgICAgICAgY2xlYW51cEFuZFJlc29sdmUoIHtcclxuICAgICAgICAgICAgICAgIC8vIHRvIGtlZXAgdHJhY2sgb2Ygd2hpY2ggcmVwbyB0aGlzIGlzIGZvclxyXG4gICAgICAgICAgICAgICAgcmVwbzogcmVwbyxcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBGb3IgbWFjaGluZSByZWFkYWJpbGl0eVxyXG4gICAgICAgICAgICAgICAgYXBpOiBKU09OLnBhcnNlKCBmdWxsQVBJIClcclxuICAgICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gKTtcclxuXHJcbiAgICAgICAgICBwYWdlLm9uKCAnZXJyb3InLCBjbGVhbnVwQW5kUmVqZWN0ICk7XHJcbiAgICAgICAgICBwYWdlLm9uKCAncGFnZWVycm9yJywgY2xlYW51cEFuZFJlamVjdCApO1xyXG5cclxuICAgICAgICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IG9wdGlvbnMuZnJvbUJ1aWx0VmVyc2lvbiA/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgYnVpbGQvcGhldC1pby8ke3JlcG99X2FsbF9waGV0LWlvLmh0bWxgIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAke3JlcG99X2VuLmh0bWxgO1xyXG5cclxuICAgICAgICAgIC8vIE5PVEU6IERVUExJQ0FUSU9OIEFMRVJUOiBUaGlzIHJhbmRvbSBzZWVkIGlzIGNvcGllZCB3aGVyZXZlciBBUEkgY29tcGFyaXNvbiBpcyBkb25lIGFnYWluc3QgdGhlIGdlbmVyYXRlZCBBUEkuIERvbid0IGNoYW5nZSB0aGlzXHJcbiAgICAgICAgICAvLyB3aXRob3V0IGxvb2tpbmcgZm9yIG90aGVyIHVzYWdlcyBvZiB0aGlzIHJhbmRvbSBzZWVkIHZhbHVlLlxyXG4gICAgICAgICAgY29uc3QgdXJsID0gYGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fS8ke3JlcG99LyR7cmVsYXRpdmVQYXRofT9lYSZicmFuZD1waGV0LWlvJnBoZXRpb1N0YW5kYWxvbmUmcGhldGlvUHJpbnRBUEkmcmFuZG9tU2VlZD0zMzIyMTEmbG9jYWxlcz0qJndlYmdsPWZhbHNlYDtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHBhZ2UuZ290byggdXJsLCB7XHJcbiAgICAgICAgICAgICAgdGltZW91dDogMTIwMDAwXHJcbiAgICAgICAgICAgIH0gKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNhdGNoKCBlICkge1xyXG4gICAgICAgICAgICBhd2FpdCBjbGVhbnVwQW5kUmVqZWN0KCBuZXcgRXJyb3IoIGBwYWdlLmdvdG8gZmFpbHVyZTogJHtlfWAgKSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfSApO1xyXG5cclxuICAgICAgY29uc3QgY2h1bmtSZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGxTZXR0bGVkKCBwcm9taXNlcyApO1xyXG5cclxuICAgICAgY2h1bmtSZXN1bHRzLmZvckVhY2goIGNodW5rUmVzdWx0ID0+IHtcclxuICAgICAgICBjb25zdCByZXBvID0gY2h1bmtSZXN1bHQudmFsdWUucmVwbztcclxuICAgICAgICBtYWNyb0FQSVsgcmVwbyBdID0gY2h1bmtSZXN1bHQudmFsdWUuYXBpIHx8IG51bGw7XHJcbiAgICAgICAgY29uc3QgZXJyb3IgPSBjaHVua1Jlc3VsdC52YWx1ZS5lcnJvcjtcclxuICAgICAgICBpZiAoIGVycm9yICkge1xyXG4gICAgICAgICAgaWYgKCBvcHRpb25zLnRocm93QVBJR2VuZXJhdGlvbkVycm9ycyApIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvciggYEVycm9yIGluICR7cmVwb306YCApO1xyXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBlcnJvcnNbIHJlcG8gXSA9IGVycm9yO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIG9wdGlvbnMuc2hvd1Byb2dyZXNzQmFyICYmIHNob3dDb21tYW5kTGluZVByb2dyZXNzKCAxLCB0cnVlICk7XHJcblxyXG4gICAgYXdhaXQgYnJvd3Nlci5jbG9zZSgpO1xyXG4gICAgaWYgKCBPYmplY3Qua2V5cyggZXJyb3JzICkubGVuZ3RoID4gMCApIHtcclxuICAgICAgY29uc29sZS5lcnJvciggJ0Vycm9ycyB3aGlsZSBnZW5lcmF0aW5nIFBoRVQtaU8gQVBJczonLCBlcnJvcnMgKTtcclxuICAgIH1cclxuICAgIHJldHVybiBtYWNyb0FQSTtcclxuICB9ICk7XHJcbn07XHJcblxyXG4vLyBAcHVibGljIChyZWFkLW9ubHkpXHJcbmdlbmVyYXRlUGhldGlvTWFjcm9BUEkuYXBpVmVyc2lvbiA9ICcxLjAuMC1kZXYuMCc7XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtzdHJpbmdbXX0gcmVwb3NcclxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBnZW5lcmF0ZVBoZXRpb01hY3JvQVBJOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBR0EsTUFBTUEsU0FBUyxHQUFHQyxPQUFPLENBQUUsV0FBWSxDQUFDO0FBQ3hDLE1BQU1DLENBQUMsR0FBR0QsT0FBTyxDQUFFLFFBQVMsQ0FBQztBQUM3QixNQUFNRSxNQUFNLEdBQUdGLE9BQU8sQ0FBRSxRQUFTLENBQUM7QUFDbEMsTUFBTUcsdUJBQXVCLEdBQUdILE9BQU8sQ0FBRSxtQ0FBb0MsQ0FBQztBQUM5RSxNQUFNSSxVQUFVLEdBQUdKLE9BQU8sQ0FBRSwrQ0FBZ0QsQ0FBQzs7QUFFN0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTUssc0JBQXNCLEdBQUcsTUFBQUEsQ0FBUUMsS0FBSyxFQUFFQyxPQUFPLEtBQU07RUFFekRMLE1BQU0sQ0FBRUksS0FBSyxDQUFDRSxNQUFNLEtBQUtQLENBQUMsQ0FBQ1EsSUFBSSxDQUFFSCxLQUFNLENBQUMsQ0FBQ0UsTUFBTSxFQUFFLHdCQUF5QixDQUFDO0VBRTNFRCxPQUFPLEdBQUdOLENBQUMsQ0FBQ1MsUUFBUSxDQUFFO0lBQ3BCQyxnQkFBZ0IsRUFBRSxLQUFLO0lBQUU7SUFDekJDLFNBQVMsRUFBRSxDQUFDO0lBQUU7SUFDZEMsZUFBZSxFQUFFLEtBQUs7SUFDdEJD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