// Copyright 2017, University of Colorado Boulder

/**
 * Deploys a production version after incrementing the test version number.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const SimVersion = require('../common/SimVersion');
const booleanPrompt = require('../common/booleanPrompt');
const build = require('../common/build');
const buildServerRequest = require('../common/buildServerRequest');
const checkoutMain = require('../common/checkoutMain');
const checkoutTarget = require('../common/checkoutTarget');
const execute = require('../common/execute');
const getDependencies = require('../common/getDependencies');
const getRepoVersion = require('../common/getRepoVersion');
const gitAdd = require('../common/gitAdd');
const gitCommit = require('../common/gitCommit');
const gitIsClean = require('../common/gitIsClean');
const gitPush = require('../common/gitPush');
const grunt = require('grunt');
const gruntCommand = require('../common/gruntCommand');
const hasRemoteBranch = require('../common/hasRemoteBranch');
const isPublished = require('../common/isPublished');
const npmUpdate = require('../common/npmUpdate');
const setRepoVersion = require('../common/setRepoVersion');
const simMetadata = require('../common/simMetadata');
const updateDependenciesJSON = require('../common/updateDependenciesJSON');
const vpnCheck = require('../common/vpnCheck');
const buildLocal = require('../common/buildLocal');
const assert = require('assert');

/**
 * Deploys a production version after incrementing the test version number.
 * @public
 *
 * @param {string} repo
 * @param {string} branch
 * @param {Array.<string>} brands
 * @param {boolean} noninteractive
 * @param {boolean} redeploy
 * @param {string} [message] - Optional message to append to the version-increment commit.
 * @returns {Promise.<SimVersion>}
 */
module.exports = async function production(repo, branch, brands, noninteractive, redeploy, message) {
  SimVersion.ensureReleaseBranch(branch);
  if (!(await vpnCheck())) {
    grunt.fail.fatal('VPN or being on campus is required for this build. Ensure VPN is enabled, or that you have access to phet-server2.int.colorado.edu');
  }
  const isClean = await gitIsClean(repo);
  if (!isClean) {
    throw new Error(`Unclean status in ${repo}, cannot create release branch`);
  }
  if (!(await hasRemoteBranch(repo, branch))) {
    throw new Error(`Cannot find release branch ${branch} for ${repo}`);
  }
  if (!grunt.file.exists(`../${repo}/assets/${repo}-screenshot.png`) && brands.includes('phet')) {
    throw new Error(`Missing screenshot file (${repo}/assets/${repo}-screenshot.png), aborting production deployment`);
  }
  if (!(await booleanPrompt('Are QA credits up-to-date?', noninteractive))) {
    throw new Error('Aborted production deployment');
  }
  if (!(await booleanPrompt('Have all maintenance patches that need spot checks been tested? (An issue would be created in the sim repo)', noninteractive))) {
    throw new Error('Aborted production deployment');
  }
  redeploy && assert(noninteractive, 'redeploy can only be specified with noninteractive:true');
  const published = await isPublished(repo);
  await checkoutTarget(repo, branch, true); // include npm update

  try {
    const previousVersion = await getRepoVersion(repo);
    let version;
    let versionChanged;
    if (previousVersion.testType === null) {
      // redeploy flag can bypass this prompt and error
      if (!redeploy && (noninteractive || !(await booleanPrompt(`The last deployment was a production deployment (${previousVersion.toString()}) and an RC version is required between production versions. Would you like to redeploy ${previousVersion.toString()} (y) or cancel this process and revert to main (N)`, false)))) {
        throw new Error('Aborted production deployment: It appears that the last deployment was for production.');
      }
      version = previousVersion;
      versionChanged = false;
    } else if (previousVersion.testType === 'rc') {
      version = new SimVersion(previousVersion.major, previousVersion.minor, previousVersion.maintenance);
      versionChanged = true;
    } else {
      throw new Error('Aborted production deployment since the version number cannot be incremented safely');
    }
    const isFirstVersion = !(await simMetadata({
      simulation: repo
    })).projects;

    // Initial deployment nags
    if (isFirstVersion) {
      if (!(await booleanPrompt('Is the main checklist complete (e.g. are screenshots added to assets, etc.)', noninteractive))) {
        throw new Error('Aborted production deployment');
      }
    }
    const versionString = version.toString();

    // caps-lock should hopefully shout this at people. do we have a text-to-speech synthesizer we can shout out of their speakers?
    // SECOND THOUGHT: this would be horrible during automated maintenance releases.
    if (!(await booleanPrompt(`DEPLOY ${repo} ${versionString} (brands: ${brands.join(',')}) to PRODUCTION`, noninteractive))) {
      throw new Error('Aborted production deployment');
    }
    if (versionChanged) {
      await setRepoVersion(repo, version, message);
      await gitPush(repo, branch);
    }

    // Make sure our correct npm dependencies are set
    await npmUpdate(repo);
    await npmUpdate('chipper');
    await npmUpdate('perennial-alias');

    // Update the README on the branch
    if (published) {
      grunt.log.writeln('Updating branch README');
      try {
        await execute(gruntCommand, ['published-README'], `../${repo}`);
      } catch (e) {
        grunt.log.writeln('published-README error, may not exist, will try generate-published-README');
        try {
          await execute(gruntCommand, ['generate-published-README'], `../${repo}`);
        } catch (e) {
          grunt.log.writeln('No published README generation found');
        }
      }
      await gitAdd(repo, 'README.md');
      try {
        await gitCommit(repo, `Generated published README.md as part of a production deploy for ${versionString}`);
        await gitPush(repo, branch);
      } catch (e) {
        grunt.log.writeln('Production README is already up-to-date');
      }
    }

    // No special options required here, as we send the main request to the build server
    grunt.log.writeln(await build(repo, {
      brands: brands,
      minify: !noninteractive
    }));

    /**
     * The necessary clean up steps to do if aborting after the build
     * @param {string} message - message to error out with
     * @returns {Promise.<void>}
     */
    const postBuildAbort = async message => {
      // Abort version update
      if (versionChanged) {
        await setRepoVersion(repo, previousVersion, message);
        await gitPush(repo, branch);
      }

      // Abort checkout, (will be caught and main will be checked out
      throw new Error(message);
    };
    if (!(await booleanPrompt(`Please test the built version of ${repo}.\nIs it ready to deploy?`, noninteractive))) {
      await postBuildAbort('Aborted production deployment (aborted version change too).');
    }

    // Move over dependencies.json and commit/push
    await updateDependenciesJSON(repo, brands, versionString, branch);

    // Send the build request
    await buildServerRequest(repo, version, branch, await getDependencies(repo), {
      locales: '*',
      brands: brands,
      servers: ['dev', 'production']
    });

    // Move back to main
    await checkoutMain(repo, true);
    if (brands.includes('phet')) {
      grunt.log.writeln(`Deployed: https://phet.colorado.edu/sims/html/${repo}/latest/${repo}_all.html`);
    }
    if (brands.includes('phet-io')) {
      grunt.log.writeln(`Deployed: https://phet-io.colorado.edu/sims/${repo}/${versionString}/`);
    }
    grunt.log.writeln('Please wait for the build-server to complete the deployment, and then test!');
    grunt.log.writeln(`To view the current build status, visit ${buildLocal.productionServerURL}/deploy-status`);
    if (isFirstVersion && brands.includes('phet')) {
      grunt.log.writeln('After testing, let the simulation lead know it has been deployed, so they can edit metadata on the website');

      // Update the README on main
      if (published) {
        grunt.log.writeln('Updating main README');
        await execute(gruntCommand, ['published-README'], `../${repo}`);
        await gitAdd(repo, 'README.md');
        try {
          await gitCommit(repo, `Generated published README.md as part of a production deploy for ${versionString}`);
          await gitPush(repo, 'main');
        } catch (e) {
          grunt.log.writeln('Production README is already up-to-date');
        }
      }
    }

    // phet-io nags from the checklist
    if (brands.includes('phet-io')) {
      const phetioLogText = `
PhET-iO deploys involve a couple of extra steps after production. Please ensure the following are accomplished:
1. Make sure the sim is listed in perennial/data/phet-io-api-stable if it has had a designed production release (and that the API is up to date).
2. Make sure the sim is listed in perennial/data/phet-io-hydrogen.json. It is almost certainly part of this featureset. 
3. Create an issue in the phet-io repo using the "New PhET-iO Simulation Publication" issue template.
      `;
      grunt.log.writeln(phetioLogText);
    }
    return version;
  } catch (e) {
    grunt.log.warn('Detected failure during deploy, reverting to main');
    await checkoutMain(repo, true);
    throw e;
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTaW1WZXJzaW9uIiwicmVxdWlyZSIsImJvb2xlYW5Qcm9tcHQiLCJidWlsZCIsImJ1aWxkU2VydmVyUmVxdWVzdCIsImNoZWNrb3V0TWFpbiIsImNoZWNrb3V0VGFyZ2V0IiwiZXhlY3V0ZSIsImdldERlcGVuZGVuY2llcyIsImdldFJlcG9WZXJzaW9uIiwiZ2l0QWRkIiwiZ2l0Q29tbWl0IiwiZ2l0SXNDbGVhbiIsImdpdFB1c2giLCJncnVudCIsImdydW50Q29tbWFuZCIsImhhc1JlbW90ZUJyYW5jaCIsImlzUHVibGlzaGVkIiwibnBtVXBkYXRlIiwic2V0UmVwb1ZlcnNpb24iLCJzaW1NZXRhZGF0YSIsInVwZGF0ZURlcGVuZGVuY2llc0pTT04iLCJ2cG5DaGVjayIsImJ1aWxkTG9jYWwiLCJhc3NlcnQiLCJtb2R1bGUiLCJleHBvcnRzIiwicHJvZHVjdGlvbiIsInJlcG8iLCJicmFuY2giLCJicmFuZHMiLCJub25pbnRlcmFjdGl2ZSIsInJlZGVwbG95IiwibWVzc2FnZSIsImVuc3VyZVJlbGVhc2VCcmFuY2giLCJmYWlsIiwiZmF0YWwiLCJpc0NsZWFuIiwiRXJyb3IiLCJmaWxlIiwiZXhpc3RzIiwiaW5jbHVkZXMiLCJwdWJsaXNoZWQiLCJwcmV2aW91c1ZlcnNpb24iLCJ2ZXJzaW9uIiwidmVyc2lvbkNoYW5nZWQiLCJ0ZXN0VHlwZSIsInRvU3RyaW5nIiwibWFqb3IiLCJtaW5vciIsIm1haW50ZW5hbmNlIiwiaXNGaXJzdFZlcnNpb24iLCJzaW11bGF0aW9uIiwicHJvamVjdHMiLCJ2ZXJzaW9uU3RyaW5nIiwiam9pbiIsImxvZyIsIndyaXRlbG4iLCJlIiwibWluaWZ5IiwicG9zdEJ1aWxkQWJvcnQiLCJsb2NhbGVzIiwic2VydmVycyIsInByb2R1Y3Rpb25TZXJ2ZXJVUkwiLCJwaGV0aW9Mb2dUZXh0Iiwid2FybiJdLCJzb3VyY2VzIjpbInByb2R1Y3Rpb24uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTcsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIERlcGxveXMgYSBwcm9kdWN0aW9uIHZlcnNpb24gYWZ0ZXIgaW5jcmVtZW50aW5nIHRoZSB0ZXN0IHZlcnNpb24gbnVtYmVyLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgU2ltVmVyc2lvbiA9IHJlcXVpcmUoICcuLi9jb21tb24vU2ltVmVyc2lvbicgKTtcclxuY29uc3QgYm9vbGVhblByb21wdCA9IHJlcXVpcmUoICcuLi9jb21tb24vYm9vbGVhblByb21wdCcgKTtcclxuY29uc3QgYnVpbGQgPSByZXF1aXJlKCAnLi4vY29tbW9uL2J1aWxkJyApO1xyXG5jb25zdCBidWlsZFNlcnZlclJlcXVlc3QgPSByZXF1aXJlKCAnLi4vY29tbW9uL2J1aWxkU2VydmVyUmVxdWVzdCcgKTtcclxuY29uc3QgY2hlY2tvdXRNYWluID0gcmVxdWlyZSggJy4uL2NvbW1vbi9jaGVja291dE1haW4nICk7XHJcbmNvbnN0IGNoZWNrb3V0VGFyZ2V0ID0gcmVxdWlyZSggJy4uL2NvbW1vbi9jaGVja291dFRhcmdldCcgKTtcclxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuLi9jb21tb24vZXhlY3V0ZScgKTtcclxuY29uc3QgZ2V0RGVwZW5kZW5jaWVzID0gcmVxdWlyZSggJy4uL2NvbW1vbi9nZXREZXBlbmRlbmNpZXMnICk7XHJcbmNvbnN0IGdldFJlcG9WZXJzaW9uID0gcmVxdWlyZSggJy4uL2NvbW1vbi9nZXRSZXBvVmVyc2lvbicgKTtcclxuY29uc3QgZ2l0QWRkID0gcmVxdWlyZSggJy4uL2NvbW1vbi9naXRBZGQnICk7XHJcbmNvbnN0IGdpdENvbW1pdCA9IHJlcXVpcmUoICcuLi9jb21tb24vZ2l0Q29tbWl0JyApO1xyXG5jb25zdCBnaXRJc0NsZWFuID0gcmVxdWlyZSggJy4uL2NvbW1vbi9naXRJc0NsZWFuJyApO1xyXG5jb25zdCBnaXRQdXNoID0gcmVxdWlyZSggJy4uL2NvbW1vbi9naXRQdXNoJyApO1xyXG5jb25zdCBncnVudCA9IHJlcXVpcmUoICdncnVudCcgKTtcclxuY29uc3QgZ3J1bnRDb21tYW5kID0gcmVxdWlyZSggJy4uL2NvbW1vbi9ncnVudENvbW1hbmQnICk7XHJcbmNvbnN0IGhhc1JlbW90ZUJyYW5jaCA9IHJlcXVpcmUoICcuLi9jb21tb24vaGFzUmVtb3RlQnJhbmNoJyApO1xyXG5jb25zdCBpc1B1Ymxpc2hlZCA9IHJlcXVpcmUoICcuLi9jb21tb24vaXNQdWJsaXNoZWQnICk7XHJcbmNvbnN0IG5wbVVwZGF0ZSA9IHJlcXVpcmUoICcuLi9jb21tb24vbnBtVXBkYXRlJyApO1xyXG5jb25zdCBzZXRSZXBvVmVyc2lvbiA9IHJlcXVpcmUoICcuLi9jb21tb24vc2V0UmVwb1ZlcnNpb24nICk7XHJcbmNvbnN0IHNpbU1ldGFkYXRhID0gcmVxdWlyZSggJy4uL2NvbW1vbi9zaW1NZXRhZGF0YScgKTtcclxuY29uc3QgdXBkYXRlRGVwZW5kZW5jaWVzSlNPTiA9IHJlcXVpcmUoICcuLi9jb21tb24vdXBkYXRlRGVwZW5kZW5jaWVzSlNPTicgKTtcclxuY29uc3QgdnBuQ2hlY2sgPSByZXF1aXJlKCAnLi4vY29tbW9uL3ZwbkNoZWNrJyApO1xyXG5jb25zdCBidWlsZExvY2FsID0gcmVxdWlyZSggJy4uL2NvbW1vbi9idWlsZExvY2FsJyApO1xyXG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCAnYXNzZXJ0JyApO1xyXG5cclxuLyoqXHJcbiAqIERlcGxveXMgYSBwcm9kdWN0aW9uIHZlcnNpb24gYWZ0ZXIgaW5jcmVtZW50aW5nIHRoZSB0ZXN0IHZlcnNpb24gbnVtYmVyLlxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBicmFuY2hcclxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gYnJhbmRzXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gbm9uaW50ZXJhY3RpdmVcclxuICogQHBhcmFtIHtib29sZWFufSByZWRlcGxveVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gW21lc3NhZ2VdIC0gT3B0aW9uYWwgbWVzc2FnZSB0byBhcHBlbmQgdG8gdGhlIHZlcnNpb24taW5jcmVtZW50IGNvbW1pdC5cclxuICogQHJldHVybnMge1Byb21pc2UuPFNpbVZlcnNpb24+fVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiBwcm9kdWN0aW9uKCByZXBvLCBicmFuY2gsIGJyYW5kcywgbm9uaW50ZXJhY3RpdmUsIHJlZGVwbG95LCBtZXNzYWdlICkge1xyXG4gIFNpbVZlcnNpb24uZW5zdXJlUmVsZWFzZUJyYW5jaCggYnJhbmNoICk7XHJcblxyXG4gIGlmICggISggYXdhaXQgdnBuQ2hlY2soKSApICkge1xyXG4gICAgZ3J1bnQuZmFpbC5mYXRhbCggJ1ZQTiBvciBiZWluZyBvbiBjYW1wdXMgaXMgcmVxdWlyZWQgZm9yIHRoaXMgYnVpbGQuIEVuc3VyZSBWUE4gaXMgZW5hYmxlZCwgb3IgdGhhdCB5b3UgaGF2ZSBhY2Nlc3MgdG8gcGhldC1zZXJ2ZXIyLmludC5jb2xvcmFkby5lZHUnICk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBpc0NsZWFuID0gYXdhaXQgZ2l0SXNDbGVhbiggcmVwbyApO1xyXG4gIGlmICggIWlzQ2xlYW4gKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoIGBVbmNsZWFuIHN0YXR1cyBpbiAke3JlcG99LCBjYW5ub3QgY3JlYXRlIHJlbGVhc2UgYnJhbmNoYCApO1xyXG4gIH1cclxuXHJcbiAgaWYgKCAhKCBhd2FpdCBoYXNSZW1vdGVCcmFuY2goIHJlcG8sIGJyYW5jaCApICkgKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoIGBDYW5ub3QgZmluZCByZWxlYXNlIGJyYW5jaCAke2JyYW5jaH0gZm9yICR7cmVwb31gICk7XHJcbiAgfVxyXG5cclxuICBpZiAoICFncnVudC5maWxlLmV4aXN0cyggYC4uLyR7cmVwb30vYXNzZXRzLyR7cmVwb30tc2NyZWVuc2hvdC5wbmdgICkgJiYgYnJhbmRzLmluY2x1ZGVzKCAncGhldCcgKSApIHtcclxuICAgIHRocm93IG5ldyBFcnJvciggYE1pc3Npbmcgc2NyZWVuc2hvdCBmaWxlICgke3JlcG99L2Fzc2V0cy8ke3JlcG99LXNjcmVlbnNob3QucG5nKSwgYWJvcnRpbmcgcHJvZHVjdGlvbiBkZXBsb3ltZW50YCApO1xyXG4gIH1cclxuXHJcbiAgaWYgKCAhYXdhaXQgYm9vbGVhblByb21wdCggJ0FyZSBRQSBjcmVkaXRzIHVwLXRvLWRhdGU/Jywgbm9uaW50ZXJhY3RpdmUgKSApIHtcclxuICAgIHRocm93IG5ldyBFcnJvciggJ0Fib3J0ZWQgcHJvZHVjdGlvbiBkZXBsb3ltZW50JyApO1xyXG4gIH1cclxuXHJcbiAgaWYgKCAhYXdhaXQgYm9vbGVhblByb21wdCggJ0hhdmUgYWxsIG1haW50ZW5hbmNlIHBhdGNoZXMgdGhhdCBuZWVkIHNwb3QgY2hlY2tzIGJlZW4gdGVzdGVkPyAoQW4gaXNzdWUgd291bGQgYmUgY3JlYXRlZCBpbiB0aGUgc2ltIHJlcG8pJywgbm9uaW50ZXJhY3RpdmUgKSApIHtcclxuICAgIHRocm93IG5ldyBFcnJvciggJ0Fib3J0ZWQgcHJvZHVjdGlvbiBkZXBsb3ltZW50JyApO1xyXG4gIH1cclxuXHJcbiAgcmVkZXBsb3kgJiYgYXNzZXJ0KCBub25pbnRlcmFjdGl2ZSwgJ3JlZGVwbG95IGNhbiBvbmx5IGJlIHNwZWNpZmllZCB3aXRoIG5vbmludGVyYWN0aXZlOnRydWUnICk7XHJcblxyXG4gIGNvbnN0IHB1Ymxpc2hlZCA9IGF3YWl0IGlzUHVibGlzaGVkKCByZXBvICk7XHJcblxyXG4gIGF3YWl0IGNoZWNrb3V0VGFyZ2V0KCByZXBvLCBicmFuY2gsIHRydWUgKTsgLy8gaW5jbHVkZSBucG0gdXBkYXRlXHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBwcmV2aW91c1ZlcnNpb24gPSBhd2FpdCBnZXRSZXBvVmVyc2lvbiggcmVwbyApO1xyXG4gICAgbGV0IHZlcnNpb247XHJcbiAgICBsZXQgdmVyc2lvbkNoYW5nZWQ7XHJcblxyXG4gICAgaWYgKCBwcmV2aW91c1ZlcnNpb24udGVzdFR5cGUgPT09IG51bGwgKSB7XHJcblxyXG4gICAgICAvLyByZWRlcGxveSBmbGFnIGNhbiBieXBhc3MgdGhpcyBwcm9tcHQgYW5kIGVycm9yXHJcbiAgICAgIGlmICggIXJlZGVwbG95ICYmICggbm9uaW50ZXJhY3RpdmUgfHwgIWF3YWl0IGJvb2xlYW5Qcm9tcHQoIGBUaGUgbGFzdCBkZXBsb3ltZW50IHdhcyBhIHByb2R1Y3Rpb24gZGVwbG95bWVudCAoJHtwcmV2aW91c1ZlcnNpb24udG9TdHJpbmcoKX0pIGFuZCBhbiBSQyB2ZXJzaW9uIGlzIHJlcXVpcmVkIGJldHdlZW4gcHJvZHVjdGlvbiB2ZXJzaW9ucy4gV291bGQgeW91IGxpa2UgdG8gcmVkZXBsb3kgJHtwcmV2aW91c1ZlcnNpb24udG9TdHJpbmcoKX0gKHkpIG9yIGNhbmNlbCB0aGlzIHByb2Nlc3MgYW5kIHJldmVydCB0byBtYWluIChOKWAsIGZhbHNlICkgKSApIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdBYm9ydGVkIHByb2R1Y3Rpb24gZGVwbG95bWVudDogSXQgYXBwZWFycyB0aGF0IHRoZSBsYXN0IGRlcGxveW1lbnQgd2FzIGZvciBwcm9kdWN0aW9uLicgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmVyc2lvbiA9IHByZXZpb3VzVmVyc2lvbjtcclxuICAgICAgdmVyc2lvbkNoYW5nZWQgPSBmYWxzZTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBwcmV2aW91c1ZlcnNpb24udGVzdFR5cGUgPT09ICdyYycgKSB7XHJcbiAgICAgIHZlcnNpb24gPSBuZXcgU2ltVmVyc2lvbiggcHJldmlvdXNWZXJzaW9uLm1ham9yLCBwcmV2aW91c1ZlcnNpb24ubWlub3IsIHByZXZpb3VzVmVyc2lvbi5tYWludGVuYW5jZSApO1xyXG4gICAgICB2ZXJzaW9uQ2hhbmdlZCA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCAnQWJvcnRlZCBwcm9kdWN0aW9uIGRlcGxveW1lbnQgc2luY2UgdGhlIHZlcnNpb24gbnVtYmVyIGNhbm5vdCBiZSBpbmNyZW1lbnRlZCBzYWZlbHknICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgaXNGaXJzdFZlcnNpb24gPSAhKCBhd2FpdCBzaW1NZXRhZGF0YSgge1xyXG4gICAgICBzaW11bGF0aW9uOiByZXBvXHJcbiAgICB9ICkgKS5wcm9qZWN0cztcclxuXHJcbiAgICAvLyBJbml0aWFsIGRlcGxveW1lbnQgbmFnc1xyXG4gICAgaWYgKCBpc0ZpcnN0VmVyc2lvbiApIHtcclxuICAgICAgaWYgKCAhYXdhaXQgYm9vbGVhblByb21wdCggJ0lzIHRoZSBtYWluIGNoZWNrbGlzdCBjb21wbGV0ZSAoZS5nLiBhcmUgc2NyZWVuc2hvdHMgYWRkZWQgdG8gYXNzZXRzLCBldGMuKScsIG5vbmludGVyYWN0aXZlICkgKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnQWJvcnRlZCBwcm9kdWN0aW9uIGRlcGxveW1lbnQnICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB2ZXJzaW9uU3RyaW5nID0gdmVyc2lvbi50b1N0cmluZygpO1xyXG5cclxuICAgIC8vIGNhcHMtbG9jayBzaG91bGQgaG9wZWZ1bGx5IHNob3V0IHRoaXMgYXQgcGVvcGxlLiBkbyB3ZSBoYXZlIGEgdGV4dC10by1zcGVlY2ggc3ludGhlc2l6ZXIgd2UgY2FuIHNob3V0IG91dCBvZiB0aGVpciBzcGVha2Vycz9cclxuICAgIC8vIFNFQ09ORCBUSE9VR0hUOiB0aGlzIHdvdWxkIGJlIGhvcnJpYmxlIGR1cmluZyBhdXRvbWF0ZWQgbWFpbnRlbmFuY2UgcmVsZWFzZXMuXHJcbiAgICBpZiAoICFhd2FpdCBib29sZWFuUHJvbXB0KCBgREVQTE9ZICR7cmVwb30gJHt2ZXJzaW9uU3RyaW5nfSAoYnJhbmRzOiAke2JyYW5kcy5qb2luKCAnLCcgKX0pIHRvIFBST0RVQ1RJT05gLCBub25pbnRlcmFjdGl2ZSApICkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoICdBYm9ydGVkIHByb2R1Y3Rpb24gZGVwbG95bWVudCcgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHZlcnNpb25DaGFuZ2VkICkge1xyXG4gICAgICBhd2FpdCBzZXRSZXBvVmVyc2lvbiggcmVwbywgdmVyc2lvbiwgbWVzc2FnZSApO1xyXG4gICAgICBhd2FpdCBnaXRQdXNoKCByZXBvLCBicmFuY2ggKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBNYWtlIHN1cmUgb3VyIGNvcnJlY3QgbnBtIGRlcGVuZGVuY2llcyBhcmUgc2V0XHJcbiAgICBhd2FpdCBucG1VcGRhdGUoIHJlcG8gKTtcclxuICAgIGF3YWl0IG5wbVVwZGF0ZSggJ2NoaXBwZXInICk7XHJcbiAgICBhd2FpdCBucG1VcGRhdGUoICdwZXJlbm5pYWwtYWxpYXMnICk7XHJcblxyXG4gICAgLy8gVXBkYXRlIHRoZSBSRUFETUUgb24gdGhlIGJyYW5jaFxyXG4gICAgaWYgKCBwdWJsaXNoZWQgKSB7XHJcbiAgICAgIGdydW50LmxvZy53cml0ZWxuKCAnVXBkYXRpbmcgYnJhbmNoIFJFQURNRScgKTtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBleGVjdXRlKCBncnVudENvbW1hbmQsIFsgJ3B1Ymxpc2hlZC1SRUFETUUnIF0sIGAuLi8ke3JlcG99YCApO1xyXG4gICAgICB9XHJcbiAgICAgIGNhdGNoKCBlICkge1xyXG4gICAgICAgIGdydW50LmxvZy53cml0ZWxuKCAncHVibGlzaGVkLVJFQURNRSBlcnJvciwgbWF5IG5vdCBleGlzdCwgd2lsbCB0cnkgZ2VuZXJhdGUtcHVibGlzaGVkLVJFQURNRScgKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgYXdhaXQgZXhlY3V0ZSggZ3J1bnRDb21tYW5kLCBbICdnZW5lcmF0ZS1wdWJsaXNoZWQtUkVBRE1FJyBdLCBgLi4vJHtyZXBvfWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgICBncnVudC5sb2cud3JpdGVsbiggJ05vIHB1Ymxpc2hlZCBSRUFETUUgZ2VuZXJhdGlvbiBmb3VuZCcgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgYXdhaXQgZ2l0QWRkKCByZXBvLCAnUkVBRE1FLm1kJyApO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IGdpdENvbW1pdCggcmVwbywgYEdlbmVyYXRlZCBwdWJsaXNoZWQgUkVBRE1FLm1kIGFzIHBhcnQgb2YgYSBwcm9kdWN0aW9uIGRlcGxveSBmb3IgJHt2ZXJzaW9uU3RyaW5nfWAgKTtcclxuICAgICAgICBhd2FpdCBnaXRQdXNoKCByZXBvLCBicmFuY2ggKTtcclxuICAgICAgfVxyXG4gICAgICBjYXRjaCggZSApIHtcclxuICAgICAgICBncnVudC5sb2cud3JpdGVsbiggJ1Byb2R1Y3Rpb24gUkVBRE1FIGlzIGFscmVhZHkgdXAtdG8tZGF0ZScgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIE5vIHNwZWNpYWwgb3B0aW9ucyByZXF1aXJlZCBoZXJlLCBhcyB3ZSBzZW5kIHRoZSBtYWluIHJlcXVlc3QgdG8gdGhlIGJ1aWxkIHNlcnZlclxyXG4gICAgZ3J1bnQubG9nLndyaXRlbG4oIGF3YWl0IGJ1aWxkKCByZXBvLCB7XHJcbiAgICAgIGJyYW5kczogYnJhbmRzLFxyXG4gICAgICBtaW5pZnk6ICFub25pbnRlcmFjdGl2ZVxyXG4gICAgfSApICk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgbmVjZXNzYXJ5IGNsZWFuIHVwIHN0ZXBzIHRvIGRvIGlmIGFib3J0aW5nIGFmdGVyIHRoZSBidWlsZFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSBtZXNzYWdlIHRvIGVycm9yIG91dCB3aXRoXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48dm9pZD59XHJcbiAgICAgKi9cclxuICAgIGNvbnN0IHBvc3RCdWlsZEFib3J0ID0gYXN5bmMgbWVzc2FnZSA9PiB7XHJcblxyXG4gICAgICAvLyBBYm9ydCB2ZXJzaW9uIHVwZGF0ZVxyXG4gICAgICBpZiAoIHZlcnNpb25DaGFuZ2VkICkge1xyXG4gICAgICAgIGF3YWl0IHNldFJlcG9WZXJzaW9uKCByZXBvLCBwcmV2aW91c1ZlcnNpb24sIG1lc3NhZ2UgKTtcclxuICAgICAgICBhd2FpdCBnaXRQdXNoKCByZXBvLCBicmFuY2ggKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQWJvcnQgY2hlY2tvdXQsICh3aWxsIGJlIGNhdWdodCBhbmQgbWFpbiB3aWxsIGJlIGNoZWNrZWQgb3V0XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggbWVzc2FnZSApO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgaWYgKCAhYXdhaXQgYm9vbGVhblByb21wdCggYFBsZWFzZSB0ZXN0IHRoZSBidWlsdCB2ZXJzaW9uIG9mICR7cmVwb30uXFxuSXMgaXQgcmVhZHkgdG8gZGVwbG95P2AsIG5vbmludGVyYWN0aXZlICkgKSB7XHJcbiAgICAgIGF3YWl0IHBvc3RCdWlsZEFib3J0KCAnQWJvcnRlZCBwcm9kdWN0aW9uIGRlcGxveW1lbnQgKGFib3J0ZWQgdmVyc2lvbiBjaGFuZ2UgdG9vKS4nICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTW92ZSBvdmVyIGRlcGVuZGVuY2llcy5qc29uIGFuZCBjb21taXQvcHVzaFxyXG4gICAgYXdhaXQgdXBkYXRlRGVwZW5kZW5jaWVzSlNPTiggcmVwbywgYnJhbmRzLCB2ZXJzaW9uU3RyaW5nLCBicmFuY2ggKTtcclxuXHJcbiAgICAvLyBTZW5kIHRoZSBidWlsZCByZXF1ZXN0XHJcbiAgICBhd2FpdCBidWlsZFNlcnZlclJlcXVlc3QoIHJlcG8sIHZlcnNpb24sIGJyYW5jaCwgYXdhaXQgZ2V0RGVwZW5kZW5jaWVzKCByZXBvICksIHtcclxuICAgICAgbG9jYWxlczogJyonLFxyXG4gICAgICBicmFuZHM6IGJyYW5kcyxcclxuICAgICAgc2VydmVyczogWyAnZGV2JywgJ3Byb2R1Y3Rpb24nIF1cclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBNb3ZlIGJhY2sgdG8gbWFpblxyXG4gICAgYXdhaXQgY2hlY2tvdXRNYWluKCByZXBvLCB0cnVlICk7XHJcblxyXG4gICAgaWYgKCBicmFuZHMuaW5jbHVkZXMoICdwaGV0JyApICkge1xyXG4gICAgICBncnVudC5sb2cud3JpdGVsbiggYERlcGxveWVkOiBodHRwczovL3BoZXQuY29sb3JhZG8uZWR1L3NpbXMvaHRtbC8ke3JlcG99L2xhdGVzdC8ke3JlcG99X2FsbC5odG1sYCApO1xyXG4gICAgfVxyXG4gICAgaWYgKCBicmFuZHMuaW5jbHVkZXMoICdwaGV0LWlvJyApICkge1xyXG4gICAgICBncnVudC5sb2cud3JpdGVsbiggYERlcGxveWVkOiBodHRwczovL3BoZXQtaW8uY29sb3JhZG8uZWR1L3NpbXMvJHtyZXBvfS8ke3ZlcnNpb25TdHJpbmd9L2AgKTtcclxuICAgIH1cclxuXHJcbiAgICBncnVudC5sb2cud3JpdGVsbiggJ1BsZWFzZSB3YWl0IGZvciB0aGUgYnVpbGQtc2VydmVyIHRvIGNvbXBsZXRlIHRoZSBkZXBsb3ltZW50LCBhbmQgdGhlbiB0ZXN0IScgKTtcclxuICAgIGdydW50LmxvZy53cml0ZWxuKCBgVG8gdmlldyB0aGUgY3VycmVudCBidWlsZCBzdGF0dXMsIHZpc2l0ICR7YnVpbGRMb2NhbC5wcm9kdWN0aW9uU2VydmVyVVJMfS9kZXBsb3ktc3RhdHVzYCApO1xyXG5cclxuICAgIGlmICggaXNGaXJzdFZlcnNpb24gJiYgYnJhbmRzLmluY2x1ZGVzKCAncGhldCcgKSApIHtcclxuICAgICAgZ3J1bnQubG9nLndyaXRlbG4oICdBZnRlciB0ZXN0aW5nLCBsZXQgdGhlIHNpbXVsYXRpb24gbGVhZCBrbm93IGl0IGhhcyBiZWVuIGRlcGxveWVkLCBzbyB0aGV5IGNhbiBlZGl0IG1ldGFkYXRhIG9uIHRoZSB3ZWJzaXRlJyApO1xyXG5cclxuICAgICAgLy8gVXBkYXRlIHRoZSBSRUFETUUgb24gbWFpblxyXG4gICAgICBpZiAoIHB1Ymxpc2hlZCApIHtcclxuICAgICAgICBncnVudC5sb2cud3JpdGVsbiggJ1VwZGF0aW5nIG1haW4gUkVBRE1FJyApO1xyXG4gICAgICAgIGF3YWl0IGV4ZWN1dGUoIGdydW50Q29tbWFuZCwgWyAncHVibGlzaGVkLVJFQURNRScgXSwgYC4uLyR7cmVwb31gICk7XHJcbiAgICAgICAgYXdhaXQgZ2l0QWRkKCByZXBvLCAnUkVBRE1FLm1kJyApO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBhd2FpdCBnaXRDb21taXQoIHJlcG8sIGBHZW5lcmF0ZWQgcHVibGlzaGVkIFJFQURNRS5tZCBhcyBwYXJ0IG9mIGEgcHJvZHVjdGlvbiBkZXBsb3kgZm9yICR7dmVyc2lvblN0cmluZ31gICk7XHJcbiAgICAgICAgICBhd2FpdCBnaXRQdXNoKCByZXBvLCAnbWFpbicgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgICBncnVudC5sb2cud3JpdGVsbiggJ1Byb2R1Y3Rpb24gUkVBRE1FIGlzIGFscmVhZHkgdXAtdG8tZGF0ZScgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBwaGV0LWlvIG5hZ3MgZnJvbSB0aGUgY2hlY2tsaXN0XHJcbiAgICBpZiAoIGJyYW5kcy5pbmNsdWRlcyggJ3BoZXQtaW8nICkgKSB7XHJcbiAgICAgIGNvbnN0IHBoZXRpb0xvZ1RleHQgPSBgXHJcblBoRVQtaU8gZGVwbG95cyBpbnZvbHZlIGEgY291cGxlIG9mIGV4dHJhIHN0ZXBzIGFmdGVyIHByb2R1Y3Rpb24uIFBsZWFzZSBlbnN1cmUgdGhlIGZvbGxvd2luZyBhcmUgYWNjb21wbGlzaGVkOlxyXG4xLiBNYWtlIHN1cmUgdGhlIHNpbSBpcyBsaXN0ZWQgaW4gcGVyZW5uaWFsL2RhdGEvcGhldC1pby1hcGktc3RhYmxlIGlmIGl0IGhhcyBoYWQgYSBkZXNpZ25lZCBwcm9kdWN0aW9uIHJlbGVhc2UgKGFuZCB0aGF0IHRoZSBBUEkgaXMgdXAgdG8gZGF0ZSkuXHJcbjIuIE1ha2Ugc3VyZSB0aGUgc2ltIGlzIGxpc3RlZCBpbiBwZXJlbm5pYWwvZGF0YS9waGV0LWlvLWh5ZHJvZ2VuLmpzb24uIEl0IGlzIGFsbW9zdCBjZXJ0YWlubHkgcGFydCBvZiB0aGlzIGZlYXR1cmVzZXQuIFxyXG4zLiBDcmVhdGUgYW4gaXNzdWUgaW4gdGhlIHBoZXQtaW8gcmVwbyB1c2luZyB0aGUgXCJOZXcgUGhFVC1pTyBTaW11bGF0aW9uIFB1YmxpY2F0aW9uXCIgaXNzdWUgdGVtcGxhdGUuXHJcbiAgICAgIGA7XHJcbiAgICAgIGdydW50LmxvZy53cml0ZWxuKCBwaGV0aW9Mb2dUZXh0ICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHZlcnNpb247XHJcbiAgfVxyXG4gIGNhdGNoKCBlICkge1xyXG4gICAgZ3J1bnQubG9nLndhcm4oICdEZXRlY3RlZCBmYWlsdXJlIGR1cmluZyBkZXBsb3ksIHJldmVydGluZyB0byBtYWluJyApO1xyXG4gICAgYXdhaXQgY2hlY2tvdXRNYWluKCByZXBvLCB0cnVlICk7XHJcbiAgICB0aHJvdyBlO1xyXG4gIH1cclxufTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTUEsVUFBVSxHQUFHQyxPQUFPLENBQUUsc0JBQXVCLENBQUM7QUFDcEQsTUFBTUMsYUFBYSxHQUFHRCxPQUFPLENBQUUseUJBQTBCLENBQUM7QUFDMUQsTUFBTUUsS0FBSyxHQUFHRixPQUFPLENBQUUsaUJBQWtCLENBQUM7QUFDMUMsTUFBTUcsa0JBQWtCLEdBQUdILE9BQU8sQ0FBRSw4QkFBK0IsQ0FBQztBQUNwRSxNQUFNSSxZQUFZLEdBQUdKLE9BQU8sQ0FBRSx3QkFBeUIsQ0FBQztBQUN4RCxNQUFNSyxjQUFjLEdBQUdMLE9BQU8sQ0FB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