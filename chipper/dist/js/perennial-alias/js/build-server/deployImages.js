// Copyright 2020, University of Colorado Boulder
// @author Matt Pennington (PhET Interactive Simulations)

const execute = require('../common/execute');
const gitCheckoutDirectory = require('../common/gitCheckoutDirectory');
const gitCloneOrFetchDirectory = require('../common/gitCloneOrFetchDirectory');
const gitPullDirectory = require('../common/gitPullDirectory');
const constants = require('./constants');
const fs = require('fs');
const axios = require('axios');
const imagesReposDir = '../images-repos';
const chipperDir = `${imagesReposDir}/chipper`;
const perennialAliasDir = `${imagesReposDir}/perennial-alias`;
const processSim = async (simulation, brands, version) => {
  const repoDir = `${imagesReposDir}/${simulation}`;

  // Get main
  await gitCloneOrFetchDirectory(simulation, imagesReposDir);
  await gitCheckoutDirectory('main', repoDir);
  await gitPullDirectory(repoDir);
  let brandsArray;
  let brandsString;
  if (brands) {
    if (brands.split) {
      brandsArray = brands.split(',');
      brandsString = brands;
    } else {
      brandsArray = brands;
      brandsString = brands.join(',');
    }
  } else {
    brandsString = 'phet';
    brandsArray = [brandsString];
  }

  // Build screenshots
  await execute('grunt', [`--brands=${brandsString}`, `--repo=${simulation}`, 'build-images'], chipperDir);

  // Copy into the document root
  for (const brand of brandsArray) {
    if (brand !== 'phet') {
      console.log(`Skipping images for unsupported brand: ${brand}`);
    } else {
      const sourceDir = `${repoDir}/build/${brand}/`;
      const targetDir = `${constants.HTML_SIMS_DIRECTORY}${simulation}/${version}/`;
      const files = fs.readdirSync(sourceDir);
      for (const file of files) {
        if (file.endsWith('png')) {
          console.log(`copying file ${file}`);
          await execute('cp', [`${sourceDir}${file}`, `${targetDir}${file}`], '.');
        }
      }
      console.log(`Done copying files for ${simulation}`);
    }
  }
};
const updateRepoDir = async (repo, dir) => {
  await gitCloneOrFetchDirectory(repo, imagesReposDir);
  await gitCheckoutDirectory('main', dir);
  await gitPullDirectory(dir);
  await execute('npm', ['prune'], dir);
  await execute('npm', ['update'], dir);
};

/**
 * This task deploys all image assets from the main branch to the latest version of all published sims.
 *
 * @param options
 */
const deployImages = async options => {
  console.log(`deploying images with brands ${options.brands}`);
  if (!fs.existsSync(imagesReposDir)) {
    await execute('mkdir', [imagesReposDir], '.');
  }
  await updateRepoDir('chipper', chipperDir);
  await updateRepoDir('perennial-alias', perennialAliasDir);
  if (options.simulation && options.version) {
    await processSim(options.simulation, options.brands, options.version);
  } else {
    // Get all published sims
    let response;
    try {
      response = await axios('https://phet.colorado.edu/services/metadata/1.2/simulations?format=json&summary&locale=en&type=html');
    } catch (e) {
      throw new Error(e);
    }
    if (response.status < 200 || response.status > 299) {
      throw new Error(`Bad Status while fetching metadata: ${response.status}`);
    } else {
      let projects;
      try {
        projects = response.data.projects;
      } catch (e) {
        throw new Error(e);
      }

      // Use for index loop to allow async/await
      for (const project of projects) {
        for (const simulation of project.simulations) {
          await processSim(simulation.name, options.brands, project.version.string);
        }
      }
    }
  }
};
module.exports = deployImages;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsImdpdENoZWNrb3V0RGlyZWN0b3J5IiwiZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5IiwiZ2l0UHVsbERpcmVjdG9yeSIsImNvbnN0YW50cyIsImZzIiwiYXhpb3MiLCJpbWFnZXNSZXBvc0RpciIsImNoaXBwZXJEaXIiLCJwZXJlbm5pYWxBbGlhc0RpciIsInByb2Nlc3NTaW0iLCJzaW11bGF0aW9uIiwiYnJhbmRzIiwidmVyc2lvbiIsInJlcG9EaXIiLCJicmFuZHNBcnJheSIsImJyYW5kc1N0cmluZyIsInNwbGl0Iiwiam9pbiIsImJyYW5kIiwiY29uc29sZSIsImxvZyIsInNvdXJjZURpciIsInRhcmdldERpciIsIkhUTUxfU0lNU19ESVJFQ1RPUlkiLCJmaWxlcyIsInJlYWRkaXJTeW5jIiwiZmlsZSIsImVuZHNXaXRoIiwidXBkYXRlUmVwb0RpciIsInJlcG8iLCJkaXIiLCJkZXBsb3lJbWFnZXMiLCJvcHRpb25zIiwiZXhpc3RzU3luYyIsInJlc3BvbnNlIiwiZSIsIkVycm9yIiwic3RhdHVzIiwicHJvamVjdHMiLCJkYXRhIiwicHJvamVjdCIsInNpbXVsYXRpb25zIiwibmFtZSIsInN0cmluZyIsIm1vZHVsZSIsImV4cG9ydHMiXSwic291cmNlcyI6WyJkZXBsb3lJbWFnZXMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjAsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG4vLyBAYXV0aG9yIE1hdHQgUGVubmluZ3RvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuXHJcbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi4vY29tbW9uL2V4ZWN1dGUnICk7XHJcbmNvbnN0IGdpdENoZWNrb3V0RGlyZWN0b3J5ID0gcmVxdWlyZSggJy4uL2NvbW1vbi9naXRDaGVja291dERpcmVjdG9yeScgKTtcclxuY29uc3QgZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5ID0gcmVxdWlyZSggJy4uL2NvbW1vbi9naXRDbG9uZU9yRmV0Y2hEaXJlY3RvcnknICk7XHJcbmNvbnN0IGdpdFB1bGxEaXJlY3RvcnkgPSByZXF1aXJlKCAnLi4vY29tbW9uL2dpdFB1bGxEaXJlY3RvcnknICk7XHJcbmNvbnN0IGNvbnN0YW50cyA9IHJlcXVpcmUoICcuL2NvbnN0YW50cycgKTtcclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbmNvbnN0IGF4aW9zID0gcmVxdWlyZSggJ2F4aW9zJyApO1xyXG5cclxuY29uc3QgaW1hZ2VzUmVwb3NEaXIgPSAnLi4vaW1hZ2VzLXJlcG9zJztcclxuY29uc3QgY2hpcHBlckRpciA9IGAke2ltYWdlc1JlcG9zRGlyfS9jaGlwcGVyYDtcclxuY29uc3QgcGVyZW5uaWFsQWxpYXNEaXIgPSBgJHtpbWFnZXNSZXBvc0Rpcn0vcGVyZW5uaWFsLWFsaWFzYDtcclxuXHJcbmNvbnN0IHByb2Nlc3NTaW0gPSBhc3luYyAoIHNpbXVsYXRpb24sIGJyYW5kcywgdmVyc2lvbiApID0+IHtcclxuXHJcbiAgY29uc3QgcmVwb0RpciA9IGAke2ltYWdlc1JlcG9zRGlyfS8ke3NpbXVsYXRpb259YDtcclxuXHJcbiAgLy8gR2V0IG1haW5cclxuICBhd2FpdCBnaXRDbG9uZU9yRmV0Y2hEaXJlY3RvcnkoIHNpbXVsYXRpb24sIGltYWdlc1JlcG9zRGlyICk7XHJcbiAgYXdhaXQgZ2l0Q2hlY2tvdXREaXJlY3RvcnkoICdtYWluJywgcmVwb0RpciApO1xyXG4gIGF3YWl0IGdpdFB1bGxEaXJlY3RvcnkoIHJlcG9EaXIgKTtcclxuXHJcbiAgbGV0IGJyYW5kc0FycmF5O1xyXG4gIGxldCBicmFuZHNTdHJpbmc7XHJcbiAgaWYgKCBicmFuZHMgKSB7XHJcbiAgICBpZiAoIGJyYW5kcy5zcGxpdCApIHtcclxuICAgICAgYnJhbmRzQXJyYXkgPSBicmFuZHMuc3BsaXQoICcsJyApO1xyXG4gICAgICBicmFuZHNTdHJpbmcgPSBicmFuZHM7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgYnJhbmRzQXJyYXkgPSBicmFuZHM7XHJcbiAgICAgIGJyYW5kc1N0cmluZyA9IGJyYW5kcy5qb2luKCAnLCcgKTtcclxuICAgIH1cclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICBicmFuZHNTdHJpbmcgPSAncGhldCc7XHJcbiAgICBicmFuZHNBcnJheSA9IFsgYnJhbmRzU3RyaW5nIF07XHJcbiAgfVxyXG5cclxuICAvLyBCdWlsZCBzY3JlZW5zaG90c1xyXG4gIGF3YWl0IGV4ZWN1dGUoICdncnVudCcsIFsgYC0tYnJhbmRzPSR7YnJhbmRzU3RyaW5nfWAsIGAtLXJlcG89JHtzaW11bGF0aW9ufWAsICdidWlsZC1pbWFnZXMnIF0sIGNoaXBwZXJEaXIgKTtcclxuXHJcbiAgLy8gQ29weSBpbnRvIHRoZSBkb2N1bWVudCByb290XHJcbiAgZm9yICggY29uc3QgYnJhbmQgb2YgYnJhbmRzQXJyYXkgKSB7XHJcbiAgICBpZiAoIGJyYW5kICE9PSAncGhldCcgKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCBgU2tpcHBpbmcgaW1hZ2VzIGZvciB1bnN1cHBvcnRlZCBicmFuZDogJHticmFuZH1gICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgY29uc3Qgc291cmNlRGlyID0gYCR7cmVwb0Rpcn0vYnVpbGQvJHticmFuZH0vYDtcclxuICAgICAgY29uc3QgdGFyZ2V0RGlyID0gYCR7Y29uc3RhbnRzLkhUTUxfU0lNU19ESVJFQ1RPUll9JHtzaW11bGF0aW9ufS8ke3ZlcnNpb259L2A7XHJcbiAgICAgIGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmMoIHNvdXJjZURpciApO1xyXG4gICAgICBmb3IgKCBjb25zdCBmaWxlIG9mIGZpbGVzICkge1xyXG4gICAgICAgIGlmICggZmlsZS5lbmRzV2l0aCggJ3BuZycgKSApIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCBgY29weWluZyBmaWxlICR7ZmlsZX1gICk7XHJcbiAgICAgICAgICBhd2FpdCBleGVjdXRlKCAnY3AnLCBbIGAke3NvdXJjZURpcn0ke2ZpbGV9YCwgYCR7dGFyZ2V0RGlyfSR7ZmlsZX1gIF0sICcuJyApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc29sZS5sb2coIGBEb25lIGNvcHlpbmcgZmlsZXMgZm9yICR7c2ltdWxhdGlvbn1gICk7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuY29uc3QgdXBkYXRlUmVwb0RpciA9IGFzeW5jICggcmVwbywgZGlyICkgPT4ge1xyXG4gIGF3YWl0IGdpdENsb25lT3JGZXRjaERpcmVjdG9yeSggcmVwbywgaW1hZ2VzUmVwb3NEaXIgKTtcclxuICBhd2FpdCBnaXRDaGVja291dERpcmVjdG9yeSggJ21haW4nLCBkaXIgKTtcclxuICBhd2FpdCBnaXRQdWxsRGlyZWN0b3J5KCBkaXIgKTtcclxuICBhd2FpdCBleGVjdXRlKCAnbnBtJywgWyAncHJ1bmUnIF0sIGRpciApO1xyXG4gIGF3YWl0IGV4ZWN1dGUoICducG0nLCBbICd1cGRhdGUnIF0sIGRpciApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRoaXMgdGFzayBkZXBsb3lzIGFsbCBpbWFnZSBhc3NldHMgZnJvbSB0aGUgbWFpbiBicmFuY2ggdG8gdGhlIGxhdGVzdCB2ZXJzaW9uIG9mIGFsbCBwdWJsaXNoZWQgc2ltcy5cclxuICpcclxuICogQHBhcmFtIG9wdGlvbnNcclxuICovXHJcbmNvbnN0IGRlcGxveUltYWdlcyA9IGFzeW5jIG9wdGlvbnMgPT4ge1xyXG4gIGNvbnNvbGUubG9nKCBgZGVwbG95aW5nIGltYWdlcyB3aXRoIGJyYW5kcyAke29wdGlvbnMuYnJhbmRzfWAgKTtcclxuICBpZiAoICFmcy5leGlzdHNTeW5jKCBpbWFnZXNSZXBvc0RpciApICkge1xyXG4gICAgYXdhaXQgZXhlY3V0ZSggJ21rZGlyJywgWyBpbWFnZXNSZXBvc0RpciBdLCAnLicgKTtcclxuICB9XHJcblxyXG4gIGF3YWl0IHVwZGF0ZVJlcG9EaXIoICdjaGlwcGVyJywgY2hpcHBlckRpciApO1xyXG4gIGF3YWl0IHVwZGF0ZVJlcG9EaXIoICdwZXJlbm5pYWwtYWxpYXMnLCBwZXJlbm5pYWxBbGlhc0RpciApO1xyXG5cclxuICBpZiAoIG9wdGlvbnMuc2ltdWxhdGlvbiAmJiBvcHRpb25zLnZlcnNpb24gKSB7XHJcbiAgICBhd2FpdCBwcm9jZXNzU2ltKCBvcHRpb25zLnNpbXVsYXRpb24sIG9wdGlvbnMuYnJhbmRzLCBvcHRpb25zLnZlcnNpb24gKTtcclxuICB9XHJcbiAgZWxzZSB7XHJcblxyXG4gICAgLy8gR2V0IGFsbCBwdWJsaXNoZWQgc2ltc1xyXG4gICAgbGV0IHJlc3BvbnNlO1xyXG4gICAgdHJ5IHtcclxuICAgICAgcmVzcG9uc2UgPSBhd2FpdCBheGlvcyggJ2h0dHBzOi8vcGhldC5jb2xvcmFkby5lZHUvc2VydmljZXMvbWV0YWRhdGEvMS4yL3NpbXVsYXRpb25zP2Zvcm1hdD1qc29uJnN1bW1hcnkmbG9jYWxlPWVuJnR5cGU9aHRtbCcgKTtcclxuICAgIH1cclxuICAgIGNhdGNoKCBlICkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoIGUgKTtcclxuICAgIH1cclxuICAgIGlmICggcmVzcG9uc2Uuc3RhdHVzIDwgMjAwIHx8IHJlc3BvbnNlLnN0YXR1cyA+IDI5OSApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCBgQmFkIFN0YXR1cyB3aGlsZSBmZXRjaGluZyBtZXRhZGF0YTogJHtyZXNwb25zZS5zdGF0dXN9YCApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGxldCBwcm9qZWN0cztcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBwcm9qZWN0cyA9IHJlc3BvbnNlLmRhdGEucHJvamVjdHM7XHJcbiAgICAgIH1cclxuICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBlICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFVzZSBmb3IgaW5kZXggbG9vcCB0byBhbGxvdyBhc3luYy9hd2FpdFxyXG4gICAgICBmb3IgKCBjb25zdCBwcm9qZWN0IG9mIHByb2plY3RzICkge1xyXG4gICAgICAgIGZvciAoIGNvbnN0IHNpbXVsYXRpb24gb2YgcHJvamVjdC5zaW11bGF0aW9ucyApIHtcclxuICAgICAgICAgIGF3YWl0IHByb2Nlc3NTaW0oIHNpbXVsYXRpb24ubmFtZSwgb3B0aW9ucy5icmFuZHMsIHByb2plY3QudmVyc2lvbi5zdHJpbmcgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGRlcGxveUltYWdlczsiXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7O0FBRUEsTUFBTUEsT0FBTyxHQUFHQyxPQUFPLENBQUUsbUJBQW9CLENBQUM7QUFDOUMsTUFBTUMsb0JBQW9CLEdBQUdELE9BQU8sQ0FBRSxnQ0FBaUMsQ0FBQztBQUN4RSxNQUFNRSx3QkFBd0IsR0FBR0YsT0FBTyxDQUFFLG9DQUFxQyxDQUFDO0FBQ2hGLE1BQU1HLGdCQUFnQixHQUFHSCxPQUFPLENBQUUsNEJBQTZCLENBQUM7QUFDaEUsTUFBTUksU0FBUyxHQUFHSixPQUFPLENBQUUsYUFBYyxDQUFDO0FBQzFDLE1BQU1LLEVBQUUsR0FBR0wsT0FBTyxDQUFFLElBQUssQ0FBQztBQUMxQixNQUFNTSxLQUFLLEdBQUdOLE9BQU8sQ0FBRSxPQUFRLENBQUM7QUFFaEMsTUFBTU8sY0FBYyxHQUFHLGlCQUFpQjtBQUN4QyxNQUFNQyxVQUFVLEdBQUksR0FBRUQsY0FBZSxVQUFTO0FBQzlDLE1BQU1FLGlCQUFpQixHQUFJLEdBQUVGLGNBQWUsa0JBQWlCO0FBRTdELE1BQU1HLFVBQVUsR0FBRyxNQUFBQSxDQUFRQyxVQUFVLEVBQUVDLE1BQU0sRUFBRUMsT0FBTyxLQUFNO0VBRTFELE1BQU1DLE9BQU8sR0FBSSxHQUFFUCxjQUFlLElBQUdJLFVBQVcsRUFBQzs7RUFFakQ7RUFDQSxNQUFNVCx3QkFBd0IsQ0FBRVMsVUFBVSxFQUFFSixjQUFlLENBQUM7RUFDNUQs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