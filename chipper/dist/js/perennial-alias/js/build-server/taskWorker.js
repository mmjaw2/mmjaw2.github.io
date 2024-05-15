// Copyright 2017-2019, University of Colorado Boulder
// @author Matt Pennington (PhET Interactive Simulations)

const constants = require('./constants');
const createTranslationsXML = require('./createTranslationsXML');
const devDeploy = require('./devDeploy');
const execute = require('../common/execute');
const fs = require('fs');
const getLocales = require('./getLocales');
const notifyServer = require('./notifyServer');
const rsync = require('rsync');
const SimVersion = require('../common/SimVersion');
const winston = require('../../../../../../perennial-alias/node_modules/winston');
const writePhetHtaccess = require('./writePhetHtaccess');
const writePhetioHtaccess = require('../common/writePhetioHtaccess');
const deployImages = require('./deployImages');
const persistentQueue = require('./persistentQueue');
const ReleaseBranch = require('../common/ReleaseBranch');
const loadJSON = require('../common/loadJSON');

/**
 * Abort build with err
 * @param {String|Error} err - error logged and sent via email
 */
const abortBuild = async err => {
  winston.log('error', `BUILD ABORTED! ${err}`);
  err.stack && winston.log('error', err.stack);
  throw new Error(`Build aborted, ${err}`);
};

/**
 * Clean up after deploy. Remove tmp dir.
 */
const afterDeploy = async buildDir => {
  try {
    await execute('rm', ['-rf', buildDir], '.');
  } catch (err) {
    await abortBuild(err);
  }
};

/**
 * taskQueue ensures that only one build/deploy process will be happening at the same time.  The main build/deploy logic is here.
 *
 * @property {JSON} repos
 * @property {String} api
 * @property {String} locales - comma separated list of locale codes
 * @property {String} simName - lower case simulation name used for creating files/directories
 * @property {String} version - sim version identifier string
 * @property {String} servers - deployment targets, subset of [ 'dev', 'production' ]
 * @property {string[]} brands - deployment brands
 * @property {String} email - used for sending notifications about success/failure
 * @property {String} translatorId - rosetta user id for adding translators to the website
 * @property {winston} winston - logger
 * @param options
 */
async function runTask(options) {
  persistentQueue.startTask(options);
  if (options.deployImages) {
    try {
      await deployImages(options);
      return;
    } catch (e) {
      winston.error(e);
      winston.error('Deploy images failed. See previous logs for details.');
      throw e;
    }
  }
  try {
    //-------------------------------------------------------------------------------------
    // Parse and validate parameters
    //-------------------------------------------------------------------------------------
    const api = options.api;
    const dependencies = options.repos;
    let locales = options.locales;
    const simName = options.simName;
    let version = options.version;
    const email = options.email;
    const brands = options.brands;
    const servers = options.servers;
    const userId = options.userId;
    const branch = options.branch || version.match(/^(\d+\.\d+)/)[0];
    if (userId) {
      winston.log('info', `setting userId = ${userId}`);
    }
    if (branch === null) {
      await abortBuild('Branch must be provided.');
    }

    // validate simName
    const simNameRegex = /^[a-z-]+$/;
    if (!simNameRegex.test(simName)) {
      await abortBuild(`invalid simName ${simName}`);
    }

    // make sure the repos passed in validates
    for (const key in dependencies) {
      if (dependencies.hasOwnProperty(key)) {
        winston.log('info', `Validating repo: ${key}`);

        // make sure all keys in dependencies object are valid sim names
        if (!simNameRegex.test(key)) {
          await abortBuild(`invalid simName in dependencies: ${simName}`);
        }
        const value = dependencies[key];
        if (key === 'comment') {
          if (typeof value !== 'string') {
            await abortBuild('invalid comment in dependencies: should be a string');
          }
        } else if (value instanceof Object && value.hasOwnProperty('sha')) {
          if (!/^[a-f0-9]{40}$/.test(value.sha)) {
            await abortBuild(`invalid sha in dependencies. key: ${key} value: ${value} sha: ${value.sha}`);
          }
        } else {
          await abortBuild(`invalid item in dependencies. key: ${key} value: ${value}`);
        }
      }
    }

    // Infer brand from version string and keep unstripped version for phet-io
    const originalVersion = version;
    if (api === '1.0') {
      // validate version and strip suffixes since just the numbers are used in the directory name on dev and production servers
      const versionMatch = version.match(/^(\d+\.\d+\.\d+)(?:-.*)?$/);
      if (versionMatch && versionMatch.length === 2) {
        if (servers.includes('dev')) {
          // if deploying an rc version use the -rc.[number] suffix
          version = versionMatch[0];
        } else {
          // otherwise strip any suffix
          version = versionMatch[1];
        }
        winston.log('info', `detecting version number: ${version}`);
      } else {
        await abortBuild(`invalid version number: ${version}`);
      }
    }
    if (api === '1.0') {
      locales = await getLocales(locales, simName);
    }

    // Git pull, git checkout, npm prune & update, etc. in parallel directory
    const releaseBranch = new ReleaseBranch(simName, branch, brands, true);
    await releaseBranch.updateCheckout(dependencies);
    const chipperVersion = releaseBranch.getChipperVersion();
    winston.debug(`Chipper version detected: ${chipperVersion.toString()}`);
    if (!(chipperVersion.major === 2 && chipperVersion.minor === 0) && !(chipperVersion.major === 0 && chipperVersion.minor === 0)) {
      await abortBuild('Unsupported chipper version');
    }
    if (chipperVersion.major !== 1) {
      const checkoutDirectory = ReleaseBranch.getCheckoutDirectory(simName, branch);
      const packageJSON = JSON.parse(fs.readFileSync(`${checkoutDirectory}/${simName}/package.json`, 'utf8'));
      const packageVersion = packageJSON.version;
      if (packageVersion !== version) {
        await abortBuild(`Version mismatch between package.json and build request: ${packageVersion} vs ${version}`);
      }
    }
    await releaseBranch.build({
      clean: false,
      locales: locales,
      buildForServer: true,
      lint: false,
      allHTML: !(chipperVersion.major === 0 && chipperVersion.minor === 0 && brands[0] !== constants.PHET_BRAND)
    });
    winston.debug('Build finished.');
    winston.debug(`Deploying to servers: ${JSON.stringify(servers)}`);
    const checkoutDir = ReleaseBranch.getCheckoutDirectory(simName, branch);
    const simRepoDir = `${checkoutDir}/${simName}`;
    const buildDir = `${simRepoDir}/build`;
    if (servers.indexOf(constants.DEV_SERVER) >= 0) {
      winston.info('deploying to dev');
      if (brands.indexOf(constants.PHET_IO_BRAND) >= 0) {
        const htaccessLocation = chipperVersion.major === 2 && chipperVersion.minor === 0 ? `${buildDir}/phet-io` : buildDir;
        await writePhetioHtaccess(htaccessLocation, {
          checkoutDir: checkoutDir,
          isProductionDeploy: false
        });
      }
      await devDeploy(checkoutDir, simName, version, chipperVersion, brands, buildDir);
    }
    const localesArray = typeof locales === 'string' ? locales.split(',') : locales;

    // if this build request comes from rosetta it will have a userId field and only one locale
    const isTranslationRequest = userId && localesArray.length === 1 && localesArray[0] !== '*';
    if (servers.indexOf(constants.PRODUCTION_SERVER) >= 0) {
      winston.info('deploying to production');
      let targetVersionDir;
      let targetSimDir;

      // Loop over all brands
      for (const i in brands) {
        if (brands.hasOwnProperty(i)) {
          const brand = brands[i];
          winston.info(`deploying brand: ${brand}`);
          // Pre-copy steps
          if (brand === constants.PHET_BRAND) {
            targetSimDir = constants.HTML_SIMS_DIRECTORY + simName;
            targetVersionDir = `${targetSimDir}/${version}/`;
            if (chipperVersion.major === 2 && chipperVersion.minor === 0) {
              // Remove _phet from all filenames in the phet directory
              const phetBuildDir = `${buildDir}/phet`;
              const files = fs.readdirSync(phetBuildDir);
              for (const i in files) {
                if (files.hasOwnProperty(i)) {
                  const filename = files[i];
                  if (filename.indexOf('_phet') >= 0) {
                    const newFilename = filename.replace('_phet', '');
                    await execute('mv', [filename, newFilename], phetBuildDir);
                  }
                }
              }
            }
          } else if (brand === constants.PHET_IO_BRAND) {
            targetSimDir = constants.PHET_IO_SIMS_DIRECTORY + simName;
            targetVersionDir = `${targetSimDir}/${originalVersion}`;

            // Chipper 1.0 has -phetio in the version schema for PhET-iO branded sims
            if (chipperVersion.major === 0 && !originalVersion.match('-phetio')) {
              targetVersionDir += '-phetio';
            }
            targetVersionDir += '/';
          }

          // Copy steps - allow EEXIST errors but reject anything else
          winston.debug(`Creating version dir: ${targetVersionDir}`);
          try {
            await fs.promises.mkdir(targetVersionDir, {
              recursive: true
            });
            winston.debug('Success creating sim dir');
          } catch (err) {
            if (err.code !== 'EEXIST') {
              winston.error('Failure creating version dir');
              winston.error(err);
              throw err;
            }
          }
          let sourceDir = buildDir;
          if (chipperVersion.major === 2 && chipperVersion.minor === 0) {
            sourceDir += `/${brand}`;
          }
          await new Promise((resolve, reject) => {
            winston.debug(`Copying recursive ${sourceDir} to ${targetVersionDir}`);
            new rsync().flags('razpO').set('no-perms').set('exclude', '.rsync-filter').source(`${sourceDir}/`).destination(targetVersionDir).output(stdout => {
              winston.debug(stdout.toString());
            }, stderr => {
              winston.error(stderr.toString());
            }).execute((err, code, cmd) => {
              if (err && code !== 23) {
                winston.debug(code);
                winston.debug(cmd);
                reject(err);
              } else {
                resolve();
              }
            });
          });
          winston.debug('Copy finished');

          // Post-copy steps
          if (brand === constants.PHET_BRAND) {
            if (!isTranslationRequest) {
              await deployImages({
                simulation: options.simName,
                brands: options.brands,
                version: options.version
              });
            }
            await writePhetHtaccess(simName, version);
            await createTranslationsXML(simName, version, checkoutDir);

            // This should be the last function called for the phet brand.
            // This triggers an asyncronous task on the tomcat/wicket application and only waits for a response that the request was received.
            // Do not assume that this task is complete because we use await.
            await notifyServer({
              simName: simName,
              email: email,
              brand: brand,
              locales: locales,
              translatorId: isTranslationRequest ? userId : undefined
            });
          } else if (brand === constants.PHET_IO_BRAND) {
            const suffix = originalVersion.split('-').length >= 2 ? originalVersion.split('-')[1] : chipperVersion.major < 2 ? 'phetio' : '';
            const parsedVersion = SimVersion.parse(version, '');
            const simPackage = await loadJSON(`${simRepoDir}/package.json`);
            const ignoreForAutomatedMaintenanceReleases = !!(simPackage && simPackage.phet && simPackage.phet.ignoreForAutomatedMaintenanceReleases);

            // This triggers an asyncronous task on the tomcat/wicket application and only waits for a response that the request was received.
            // Do not assume that this task is complete because we use await.
            await notifyServer({
              simName: simName,
              email: email,
              brand: brand,
              phetioOptions: {
                branch: branch,
                suffix: suffix,
                version: parsedVersion,
                ignoreForAutomatedMaintenanceReleases: ignoreForAutomatedMaintenanceReleases
              }
            });
            winston.debug('server notified');
            await writePhetioHtaccess(targetVersionDir, {
              simName: simName,
              version: originalVersion,
              directory: constants.PHET_IO_SIMS_DIRECTORY,
              checkoutDir: checkoutDir,
              isProductionDeploy: true
            });
          }
        }
      }
    }
    await afterDeploy(`${buildDir}`);
  } catch (err) {
    await abortBuild(err);
  }
}
module.exports = function taskWorker(task, taskCallback) {
  runTask(task).then(() => {
    taskCallback();
  }).catch(reason => {
    taskCallback(reason);
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb25zdGFudHMiLCJyZXF1aXJlIiwiY3JlYXRlVHJhbnNsYXRpb25zWE1MIiwiZGV2RGVwbG95IiwiZXhlY3V0ZSIsImZzIiwiZ2V0TG9jYWxlcyIsIm5vdGlmeVNlcnZlciIsInJzeW5jIiwiU2ltVmVyc2lvbiIsIndpbnN0b24iLCJ3cml0ZVBoZXRIdGFjY2VzcyIsIndyaXRlUGhldGlvSHRhY2Nlc3MiLCJkZXBsb3lJbWFnZXMiLCJwZXJzaXN0ZW50UXVldWUiLCJSZWxlYXNlQnJhbmNoIiwibG9hZEpTT04iLCJhYm9ydEJ1aWxkIiwiZXJyIiwibG9nIiwic3RhY2siLCJFcnJvciIsImFmdGVyRGVwbG95IiwiYnVpbGREaXIiLCJydW5UYXNrIiwib3B0aW9ucyIsInN0YXJ0VGFzayIsImUiLCJlcnJvciIsImFwaSIsImRlcGVuZGVuY2llcyIsInJlcG9zIiwibG9jYWxlcyIsInNpbU5hbWUiLCJ2ZXJzaW9uIiwiZW1haWwiLCJicmFuZHMiLCJzZXJ2ZXJzIiwidXNlcklkIiwiYnJhbmNoIiwibWF0Y2giLCJzaW1OYW1lUmVnZXgiLCJ0ZXN0Iiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJ2YWx1ZSIsIk9iamVjdCIsInNoYSIsIm9yaWdpbmFsVmVyc2lvbiIsInZlcnNpb25NYXRjaCIsImxlbmd0aCIsImluY2x1ZGVzIiwicmVsZWFzZUJyYW5jaCIsInVwZGF0ZUNoZWNrb3V0IiwiY2hpcHBlclZlcnNpb24iLCJnZXRDaGlwcGVyVmVyc2lvbiIsImRlYnVnIiwidG9TdHJpbmciLCJtYWpvciIsIm1pbm9yIiwiY2hlY2tvdXREaXJlY3RvcnkiLCJnZXRDaGVja291dERpcmVjdG9yeSIsInBhY2thZ2VKU09OIiwiSlNPTiIsInBhcnNlIiwicmVhZEZpbGVTeW5jIiwicGFja2FnZVZlcnNpb24iLCJidWlsZCIsImNsZWFuIiwiYnVpbGRGb3JTZXJ2ZXIiLCJsaW50IiwiYWxsSFRNTCIsIlBIRVRfQlJBTkQiLCJzdHJpbmdpZnkiLCJjaGVja291dERpciIsInNpbVJlcG9EaXIiLCJpbmRleE9mIiwiREVWX1NFUlZFUiIsImluZm8iLCJQSEVUX0lPX0JSQU5EIiwiaHRhY2Nlc3NMb2NhdGlvbiIsImlzUHJvZHVjdGlvbkRlcGxveSIsImxvY2FsZXNBcnJheSIsInNwbGl0IiwiaXNUcmFuc2xhdGlvblJlcXVlc3QiLCJQUk9EVUNUSU9OX1NFUlZFUiIsInRhcmdldFZlcnNpb25EaXIiLCJ0YXJnZXRTaW1EaXIiLCJpIiwiYnJhbmQiLCJIVE1MX1NJTVNfRElSRUNUT1JZIiwicGhldEJ1aWxkRGlyIiwiZmlsZXMiLCJyZWFkZGlyU3luYyIsImZpbGVuYW1lIiwibmV3RmlsZW5hbWUiLCJyZXBsYWNlIiwiUEhFVF9JT19TSU1TX0RJUkVDVE9SWSIsInByb21pc2VzIiwibWtkaXIiLCJyZWN1cnNpdmUiLCJjb2RlIiwic291cmNlRGlyIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJmbGFncyIsInNldCIsInNvdXJjZSIsImRlc3RpbmF0aW9uIiwib3V0cHV0Iiwic3Rkb3V0Iiwic3RkZXJyIiwiY21kIiwic2ltdWxhdGlvbiIsInRyYW5zbGF0b3JJZCIsInVuZGVmaW5lZCIsInN1ZmZpeCIsInBhcnNlZFZlcnNpb24iLCJzaW1QYWNrYWdlIiwiaWdub3JlRm9yQXV0b21hdGVkTWFpbnRlbmFuY2VSZWxlYXNlcyIsInBoZXQiLCJwaGV0aW9PcHRpb25zIiwiZGlyZWN0b3J5IiwibW9kdWxlIiwiZXhwb3J0cyIsInRhc2tXb3JrZXIiLCJ0YXNrIiwidGFza0NhbGxiYWNrIiwidGhlbiIsImNhdGNoIiwicmVhc29uIl0sInNvdXJjZXMiOlsidGFza1dvcmtlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDE5LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuLy8gQGF1dGhvciBNYXR0IFBlbm5pbmd0b24gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcblxyXG5cclxuY29uc3QgY29uc3RhbnRzID0gcmVxdWlyZSggJy4vY29uc3RhbnRzJyApO1xyXG5jb25zdCBjcmVhdGVUcmFuc2xhdGlvbnNYTUwgPSByZXF1aXJlKCAnLi9jcmVhdGVUcmFuc2xhdGlvbnNYTUwnICk7XHJcbmNvbnN0IGRldkRlcGxveSA9IHJlcXVpcmUoICcuL2RldkRlcGxveScgKTtcclxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuLi9jb21tb24vZXhlY3V0ZScgKTtcclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbmNvbnN0IGdldExvY2FsZXMgPSByZXF1aXJlKCAnLi9nZXRMb2NhbGVzJyApO1xyXG5jb25zdCBub3RpZnlTZXJ2ZXIgPSByZXF1aXJlKCAnLi9ub3RpZnlTZXJ2ZXInICk7XHJcbmNvbnN0IHJzeW5jID0gcmVxdWlyZSggJ3JzeW5jJyApO1xyXG5jb25zdCBTaW1WZXJzaW9uID0gcmVxdWlyZSggJy4uL2NvbW1vbi9TaW1WZXJzaW9uJyApO1xyXG5jb25zdCB3aW5zdG9uID0gcmVxdWlyZSggJ3dpbnN0b24nICk7XHJcbmNvbnN0IHdyaXRlUGhldEh0YWNjZXNzID0gcmVxdWlyZSggJy4vd3JpdGVQaGV0SHRhY2Nlc3MnICk7XHJcbmNvbnN0IHdyaXRlUGhldGlvSHRhY2Nlc3MgPSByZXF1aXJlKCAnLi4vY29tbW9uL3dyaXRlUGhldGlvSHRhY2Nlc3MnICk7XHJcbmNvbnN0IGRlcGxveUltYWdlcyA9IHJlcXVpcmUoICcuL2RlcGxveUltYWdlcycgKTtcclxuY29uc3QgcGVyc2lzdGVudFF1ZXVlID0gcmVxdWlyZSggJy4vcGVyc2lzdGVudFF1ZXVlJyApO1xyXG5jb25zdCBSZWxlYXNlQnJhbmNoID0gcmVxdWlyZSggJy4uL2NvbW1vbi9SZWxlYXNlQnJhbmNoJyApO1xyXG5jb25zdCBsb2FkSlNPTiA9IHJlcXVpcmUoICcuLi9jb21tb24vbG9hZEpTT04nICk7XHJcblxyXG4vKipcclxuICogQWJvcnQgYnVpbGQgd2l0aCBlcnJcclxuICogQHBhcmFtIHtTdHJpbmd8RXJyb3J9IGVyciAtIGVycm9yIGxvZ2dlZCBhbmQgc2VudCB2aWEgZW1haWxcclxuICovXHJcbmNvbnN0IGFib3J0QnVpbGQgPSBhc3luYyBlcnIgPT4ge1xyXG4gIHdpbnN0b24ubG9nKCAnZXJyb3InLCBgQlVJTEQgQUJPUlRFRCEgJHtlcnJ9YCApO1xyXG4gIGVyci5zdGFjayAmJiB3aW5zdG9uLmxvZyggJ2Vycm9yJywgZXJyLnN0YWNrICk7XHJcblxyXG4gIHRocm93IG5ldyBFcnJvciggYEJ1aWxkIGFib3J0ZWQsICR7ZXJyfWAgKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDbGVhbiB1cCBhZnRlciBkZXBsb3kuIFJlbW92ZSB0bXAgZGlyLlxyXG4gKi9cclxuY29uc3QgYWZ0ZXJEZXBsb3kgPSBhc3luYyBidWlsZERpciA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGV4ZWN1dGUoICdybScsIFsgJy1yZicsIGJ1aWxkRGlyIF0sICcuJyApO1xyXG4gIH1cclxuICBjYXRjaCggZXJyICkge1xyXG4gICAgYXdhaXQgYWJvcnRCdWlsZCggZXJyICk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIHRhc2tRdWV1ZSBlbnN1cmVzIHRoYXQgb25seSBvbmUgYnVpbGQvZGVwbG95IHByb2Nlc3Mgd2lsbCBiZSBoYXBwZW5pbmcgYXQgdGhlIHNhbWUgdGltZS4gIFRoZSBtYWluIGJ1aWxkL2RlcGxveSBsb2dpYyBpcyBoZXJlLlxyXG4gKlxyXG4gKiBAcHJvcGVydHkge0pTT059IHJlcG9zXHJcbiAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBhcGlcclxuICogQHByb3BlcnR5IHtTdHJpbmd9IGxvY2FsZXMgLSBjb21tYSBzZXBhcmF0ZWQgbGlzdCBvZiBsb2NhbGUgY29kZXNcclxuICogQHByb3BlcnR5IHtTdHJpbmd9IHNpbU5hbWUgLSBsb3dlciBjYXNlIHNpbXVsYXRpb24gbmFtZSB1c2VkIGZvciBjcmVhdGluZyBmaWxlcy9kaXJlY3Rvcmllc1xyXG4gKiBAcHJvcGVydHkge1N0cmluZ30gdmVyc2lvbiAtIHNpbSB2ZXJzaW9uIGlkZW50aWZpZXIgc3RyaW5nXHJcbiAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBzZXJ2ZXJzIC0gZGVwbG95bWVudCB0YXJnZXRzLCBzdWJzZXQgb2YgWyAnZGV2JywgJ3Byb2R1Y3Rpb24nIF1cclxuICogQHByb3BlcnR5IHtzdHJpbmdbXX0gYnJhbmRzIC0gZGVwbG95bWVudCBicmFuZHNcclxuICogQHByb3BlcnR5IHtTdHJpbmd9IGVtYWlsIC0gdXNlZCBmb3Igc2VuZGluZyBub3RpZmljYXRpb25zIGFib3V0IHN1Y2Nlc3MvZmFpbHVyZVxyXG4gKiBAcHJvcGVydHkge1N0cmluZ30gdHJhbnNsYXRvcklkIC0gcm9zZXR0YSB1c2VyIGlkIGZvciBhZGRpbmcgdHJhbnNsYXRvcnMgdG8gdGhlIHdlYnNpdGVcclxuICogQHByb3BlcnR5IHt3aW5zdG9ufSB3aW5zdG9uIC0gbG9nZ2VyXHJcbiAqIEBwYXJhbSBvcHRpb25zXHJcbiAqL1xyXG5hc3luYyBmdW5jdGlvbiBydW5UYXNrKCBvcHRpb25zICkge1xyXG4gIHBlcnNpc3RlbnRRdWV1ZS5zdGFydFRhc2soIG9wdGlvbnMgKTtcclxuICBpZiAoIG9wdGlvbnMuZGVwbG95SW1hZ2VzICkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgZGVwbG95SW1hZ2VzKCBvcHRpb25zICk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNhdGNoKCBlICkge1xyXG4gICAgICB3aW5zdG9uLmVycm9yKCBlICk7XHJcbiAgICAgIHdpbnN0b24uZXJyb3IoICdEZXBsb3kgaW1hZ2VzIGZhaWxlZC4gU2VlIHByZXZpb3VzIGxvZ3MgZm9yIGRldGFpbHMuJyApO1xyXG4gICAgICB0aHJvdyBlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG4gIHRyeSB7XHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIFBhcnNlIGFuZCB2YWxpZGF0ZSBwYXJhbWV0ZXJzXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIGNvbnN0IGFwaSA9IG9wdGlvbnMuYXBpO1xyXG4gICAgY29uc3QgZGVwZW5kZW5jaWVzID0gb3B0aW9ucy5yZXBvcztcclxuICAgIGxldCBsb2NhbGVzID0gb3B0aW9ucy5sb2NhbGVzO1xyXG4gICAgY29uc3Qgc2ltTmFtZSA9IG9wdGlvbnMuc2ltTmFtZTtcclxuICAgIGxldCB2ZXJzaW9uID0gb3B0aW9ucy52ZXJzaW9uO1xyXG4gICAgY29uc3QgZW1haWwgPSBvcHRpb25zLmVtYWlsO1xyXG4gICAgY29uc3QgYnJhbmRzID0gb3B0aW9ucy5icmFuZHM7XHJcbiAgICBjb25zdCBzZXJ2ZXJzID0gb3B0aW9ucy5zZXJ2ZXJzO1xyXG4gICAgY29uc3QgdXNlcklkID0gb3B0aW9ucy51c2VySWQ7XHJcbiAgICBjb25zdCBicmFuY2ggPSBvcHRpb25zLmJyYW5jaCB8fCB2ZXJzaW9uLm1hdGNoKCAvXihcXGQrXFwuXFxkKykvIClbIDAgXTtcclxuXHJcbiAgICBpZiAoIHVzZXJJZCApIHtcclxuICAgICAgd2luc3Rvbi5sb2coICdpbmZvJywgYHNldHRpbmcgdXNlcklkID0gJHt1c2VySWR9YCApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggYnJhbmNoID09PSBudWxsICkge1xyXG4gICAgICBhd2FpdCBhYm9ydEJ1aWxkKCAnQnJhbmNoIG11c3QgYmUgcHJvdmlkZWQuJyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHZhbGlkYXRlIHNpbU5hbWVcclxuICAgIGNvbnN0IHNpbU5hbWVSZWdleCA9IC9eW2Etei1dKyQvO1xyXG4gICAgaWYgKCAhc2ltTmFtZVJlZ2V4LnRlc3QoIHNpbU5hbWUgKSApIHtcclxuICAgICAgYXdhaXQgYWJvcnRCdWlsZCggYGludmFsaWQgc2ltTmFtZSAke3NpbU5hbWV9YCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIG1ha2Ugc3VyZSB0aGUgcmVwb3MgcGFzc2VkIGluIHZhbGlkYXRlc1xyXG4gICAgZm9yICggY29uc3Qga2V5IGluIGRlcGVuZGVuY2llcyApIHtcclxuICAgICAgaWYgKCBkZXBlbmRlbmNpZXMuaGFzT3duUHJvcGVydHkoIGtleSApICkge1xyXG4gICAgICAgIHdpbnN0b24ubG9nKCAnaW5mbycsIGBWYWxpZGF0aW5nIHJlcG86ICR7a2V5fWAgKTtcclxuXHJcbiAgICAgICAgLy8gbWFrZSBzdXJlIGFsbCBrZXlzIGluIGRlcGVuZGVuY2llcyBvYmplY3QgYXJlIHZhbGlkIHNpbSBuYW1lc1xyXG4gICAgICAgIGlmICggIXNpbU5hbWVSZWdleC50ZXN0KCBrZXkgKSApIHtcclxuICAgICAgICAgIGF3YWl0IGFib3J0QnVpbGQoIGBpbnZhbGlkIHNpbU5hbWUgaW4gZGVwZW5kZW5jaWVzOiAke3NpbU5hbWV9YCApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBkZXBlbmRlbmNpZXNbIGtleSBdO1xyXG4gICAgICAgIGlmICgga2V5ID09PSAnY29tbWVudCcgKSB7XHJcbiAgICAgICAgICBpZiAoIHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IGFib3J0QnVpbGQoICdpbnZhbGlkIGNvbW1lbnQgaW4gZGVwZW5kZW5jaWVzOiBzaG91bGQgYmUgYSBzdHJpbmcnICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCB2YWx1ZSBpbnN0YW5jZW9mIE9iamVjdCAmJiB2YWx1ZS5oYXNPd25Qcm9wZXJ0eSggJ3NoYScgKSApIHtcclxuICAgICAgICAgIGlmICggIS9eW2EtZjAtOV17NDB9JC8udGVzdCggdmFsdWUuc2hhICkgKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IGFib3J0QnVpbGQoIGBpbnZhbGlkIHNoYSBpbiBkZXBlbmRlbmNpZXMuIGtleTogJHtrZXl9IHZhbHVlOiAke3ZhbHVlfSBzaGE6ICR7dmFsdWUuc2hhfWAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBhd2FpdCBhYm9ydEJ1aWxkKCBgaW52YWxpZCBpdGVtIGluIGRlcGVuZGVuY2llcy4ga2V5OiAke2tleX0gdmFsdWU6ICR7dmFsdWV9YCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEluZmVyIGJyYW5kIGZyb20gdmVyc2lvbiBzdHJpbmcgYW5kIGtlZXAgdW5zdHJpcHBlZCB2ZXJzaW9uIGZvciBwaGV0LWlvXHJcbiAgICBjb25zdCBvcmlnaW5hbFZlcnNpb24gPSB2ZXJzaW9uO1xyXG4gICAgaWYgKCBhcGkgPT09ICcxLjAnICkge1xyXG4gICAgICAvLyB2YWxpZGF0ZSB2ZXJzaW9uIGFuZCBzdHJpcCBzdWZmaXhlcyBzaW5jZSBqdXN0IHRoZSBudW1iZXJzIGFyZSB1c2VkIGluIHRoZSBkaXJlY3RvcnkgbmFtZSBvbiBkZXYgYW5kIHByb2R1Y3Rpb24gc2VydmVyc1xyXG4gICAgICBjb25zdCB2ZXJzaW9uTWF0Y2ggPSB2ZXJzaW9uLm1hdGNoKCAvXihcXGQrXFwuXFxkK1xcLlxcZCspKD86LS4qKT8kLyApO1xyXG4gICAgICBpZiAoIHZlcnNpb25NYXRjaCAmJiB2ZXJzaW9uTWF0Y2gubGVuZ3RoID09PSAyICkge1xyXG5cclxuICAgICAgICBpZiAoIHNlcnZlcnMuaW5jbHVkZXMoICdkZXYnICkgKSB7XHJcbiAgICAgICAgICAvLyBpZiBkZXBsb3lpbmcgYW4gcmMgdmVyc2lvbiB1c2UgdGhlIC1yYy5bbnVtYmVyXSBzdWZmaXhcclxuICAgICAgICAgIHZlcnNpb24gPSB2ZXJzaW9uTWF0Y2hbIDAgXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAvLyBvdGhlcndpc2Ugc3RyaXAgYW55IHN1ZmZpeFxyXG4gICAgICAgICAgdmVyc2lvbiA9IHZlcnNpb25NYXRjaFsgMSBdO1xyXG4gICAgICAgIH1cclxuICAgICAgICB3aW5zdG9uLmxvZyggJ2luZm8nLCBgZGV0ZWN0aW5nIHZlcnNpb24gbnVtYmVyOiAke3ZlcnNpb259YCApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGF3YWl0IGFib3J0QnVpbGQoIGBpbnZhbGlkIHZlcnNpb24gbnVtYmVyOiAke3ZlcnNpb259YCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBhcGkgPT09ICcxLjAnICkge1xyXG4gICAgICBsb2NhbGVzID0gYXdhaXQgZ2V0TG9jYWxlcyggbG9jYWxlcywgc2ltTmFtZSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdpdCBwdWxsLCBnaXQgY2hlY2tvdXQsIG5wbSBwcnVuZSAmIHVwZGF0ZSwgZXRjLiBpbiBwYXJhbGxlbCBkaXJlY3RvcnlcclxuICAgIGNvbnN0IHJlbGVhc2VCcmFuY2ggPSBuZXcgUmVsZWFzZUJyYW5jaCggc2ltTmFtZSwgYnJhbmNoLCBicmFuZHMsIHRydWUgKTtcclxuICAgIGF3YWl0IHJlbGVhc2VCcmFuY2gudXBkYXRlQ2hlY2tvdXQoIGRlcGVuZGVuY2llcyApO1xyXG5cclxuICAgIGNvbnN0IGNoaXBwZXJWZXJzaW9uID0gcmVsZWFzZUJyYW5jaC5nZXRDaGlwcGVyVmVyc2lvbigpO1xyXG4gICAgd2luc3Rvbi5kZWJ1ZyggYENoaXBwZXIgdmVyc2lvbiBkZXRlY3RlZDogJHtjaGlwcGVyVmVyc2lvbi50b1N0cmluZygpfWAgKTtcclxuICAgIGlmICggISggY2hpcHBlclZlcnNpb24ubWFqb3IgPT09IDIgJiYgY2hpcHBlclZlcnNpb24ubWlub3IgPT09IDAgKSAmJiAhKCBjaGlwcGVyVmVyc2lvbi5tYWpvciA9PT0gMCAmJiBjaGlwcGVyVmVyc2lvbi5taW5vciA9PT0gMCApICkge1xyXG4gICAgICBhd2FpdCBhYm9ydEJ1aWxkKCAnVW5zdXBwb3J0ZWQgY2hpcHBlciB2ZXJzaW9uJyApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggY2hpcHBlclZlcnNpb24ubWFqb3IgIT09IDEgKSB7XHJcbiAgICAgIGNvbnN0IGNoZWNrb3V0RGlyZWN0b3J5ID0gUmVsZWFzZUJyYW5jaC5nZXRDaGVja291dERpcmVjdG9yeSggc2ltTmFtZSwgYnJhbmNoICk7XHJcbiAgICAgIGNvbnN0IHBhY2thZ2VKU09OID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBgJHtjaGVja291dERpcmVjdG9yeX0vJHtzaW1OYW1lfS9wYWNrYWdlLmpzb25gLCAndXRmOCcgKSApO1xyXG4gICAgICBjb25zdCBwYWNrYWdlVmVyc2lvbiA9IHBhY2thZ2VKU09OLnZlcnNpb247XHJcblxyXG4gICAgICBpZiAoIHBhY2thZ2VWZXJzaW9uICE9PSB2ZXJzaW9uICkge1xyXG4gICAgICAgIGF3YWl0IGFib3J0QnVpbGQoIGBWZXJzaW9uIG1pc21hdGNoIGJldHdlZW4gcGFja2FnZS5qc29uIGFuZCBidWlsZCByZXF1ZXN0OiAke3BhY2thZ2VWZXJzaW9ufSB2cyAke3ZlcnNpb259YCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXdhaXQgcmVsZWFzZUJyYW5jaC5idWlsZCgge1xyXG4gICAgICBjbGVhbjogZmFsc2UsXHJcbiAgICAgIGxvY2FsZXM6IGxvY2FsZXMsXHJcbiAgICAgIGJ1aWxkRm9yU2VydmVyOiB0cnVlLFxyXG4gICAgICBsaW50OiBmYWxzZSxcclxuICAgICAgYWxsSFRNTDogISggY2hpcHBlclZlcnNpb24ubWFqb3IgPT09IDAgJiYgY2hpcHBlclZlcnNpb24ubWlub3IgPT09IDAgJiYgYnJhbmRzWyAwIF0gIT09IGNvbnN0YW50cy5QSEVUX0JSQU5EIClcclxuICAgIH0gKTtcclxuICAgIHdpbnN0b24uZGVidWcoICdCdWlsZCBmaW5pc2hlZC4nICk7XHJcblxyXG4gICAgd2luc3Rvbi5kZWJ1ZyggYERlcGxveWluZyB0byBzZXJ2ZXJzOiAke0pTT04uc3RyaW5naWZ5KCBzZXJ2ZXJzICl9YCApO1xyXG5cclxuICAgIGNvbnN0IGNoZWNrb3V0RGlyID0gUmVsZWFzZUJyYW5jaC5nZXRDaGVja291dERpcmVjdG9yeSggc2ltTmFtZSwgYnJhbmNoICk7XHJcbiAgICBjb25zdCBzaW1SZXBvRGlyID0gYCR7Y2hlY2tvdXREaXJ9LyR7c2ltTmFtZX1gO1xyXG4gICAgY29uc3QgYnVpbGREaXIgPSBgJHtzaW1SZXBvRGlyfS9idWlsZGA7XHJcblxyXG4gICAgaWYgKCBzZXJ2ZXJzLmluZGV4T2YoIGNvbnN0YW50cy5ERVZfU0VSVkVSICkgPj0gMCApIHtcclxuICAgICAgd2luc3Rvbi5pbmZvKCAnZGVwbG95aW5nIHRvIGRldicgKTtcclxuICAgICAgaWYgKCBicmFuZHMuaW5kZXhPZiggY29uc3RhbnRzLlBIRVRfSU9fQlJBTkQgKSA+PSAwICkge1xyXG4gICAgICAgIGNvbnN0IGh0YWNjZXNzTG9jYXRpb24gPSAoIGNoaXBwZXJWZXJzaW9uLm1ham9yID09PSAyICYmIGNoaXBwZXJWZXJzaW9uLm1pbm9yID09PSAwICkgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgJHtidWlsZERpcn0vcGhldC1pb2AgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWlsZERpcjtcclxuICAgICAgICBhd2FpdCB3cml0ZVBoZXRpb0h0YWNjZXNzKCBodGFjY2Vzc0xvY2F0aW9uLCB7XHJcbiAgICAgICAgICBjaGVja291dERpcjogY2hlY2tvdXREaXIsXHJcbiAgICAgICAgICBpc1Byb2R1Y3Rpb25EZXBsb3k6IGZhbHNlXHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9XHJcbiAgICAgIGF3YWl0IGRldkRlcGxveSggY2hlY2tvdXREaXIsIHNpbU5hbWUsIHZlcnNpb24sIGNoaXBwZXJWZXJzaW9uLCBicmFuZHMsIGJ1aWxkRGlyICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbG9jYWxlc0FycmF5ID0gdHlwZW9mICggbG9jYWxlcyApID09PSAnc3RyaW5nJyA/IGxvY2FsZXMuc3BsaXQoICcsJyApIDogbG9jYWxlcztcclxuXHJcbiAgICAvLyBpZiB0aGlzIGJ1aWxkIHJlcXVlc3QgY29tZXMgZnJvbSByb3NldHRhIGl0IHdpbGwgaGF2ZSBhIHVzZXJJZCBmaWVsZCBhbmQgb25seSBvbmUgbG9jYWxlXHJcbiAgICBjb25zdCBpc1RyYW5zbGF0aW9uUmVxdWVzdCA9IHVzZXJJZCAmJiBsb2NhbGVzQXJyYXkubGVuZ3RoID09PSAxICYmIGxvY2FsZXNBcnJheVsgMCBdICE9PSAnKic7XHJcblxyXG4gICAgaWYgKCBzZXJ2ZXJzLmluZGV4T2YoIGNvbnN0YW50cy5QUk9EVUNUSU9OX1NFUlZFUiApID49IDAgKSB7XHJcbiAgICAgIHdpbnN0b24uaW5mbyggJ2RlcGxveWluZyB0byBwcm9kdWN0aW9uJyApO1xyXG4gICAgICBsZXQgdGFyZ2V0VmVyc2lvbkRpcjtcclxuICAgICAgbGV0IHRhcmdldFNpbURpcjtcclxuXHJcbiAgICAgIC8vIExvb3Agb3ZlciBhbGwgYnJhbmRzXHJcbiAgICAgIGZvciAoIGNvbnN0IGkgaW4gYnJhbmRzICkge1xyXG4gICAgICAgIGlmICggYnJhbmRzLmhhc093blByb3BlcnR5KCBpICkgKSB7XHJcbiAgICAgICAgICBjb25zdCBicmFuZCA9IGJyYW5kc1sgaSBdO1xyXG4gICAgICAgICAgd2luc3Rvbi5pbmZvKCBgZGVwbG95aW5nIGJyYW5kOiAke2JyYW5kfWAgKTtcclxuICAgICAgICAgIC8vIFByZS1jb3B5IHN0ZXBzXHJcbiAgICAgICAgICBpZiAoIGJyYW5kID09PSBjb25zdGFudHMuUEhFVF9CUkFORCApIHtcclxuICAgICAgICAgICAgdGFyZ2V0U2ltRGlyID0gY29uc3RhbnRzLkhUTUxfU0lNU19ESVJFQ1RPUlkgKyBzaW1OYW1lO1xyXG4gICAgICAgICAgICB0YXJnZXRWZXJzaW9uRGlyID0gYCR7dGFyZ2V0U2ltRGlyfS8ke3ZlcnNpb259L2A7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGNoaXBwZXJWZXJzaW9uLm1ham9yID09PSAyICYmIGNoaXBwZXJWZXJzaW9uLm1pbm9yID09PSAwICkge1xyXG4gICAgICAgICAgICAgIC8vIFJlbW92ZSBfcGhldCBmcm9tIGFsbCBmaWxlbmFtZXMgaW4gdGhlIHBoZXQgZGlyZWN0b3J5XHJcbiAgICAgICAgICAgICAgY29uc3QgcGhldEJ1aWxkRGlyID0gYCR7YnVpbGREaXJ9L3BoZXRgO1xyXG4gICAgICAgICAgICAgIGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmMoIHBoZXRCdWlsZERpciApO1xyXG4gICAgICAgICAgICAgIGZvciAoIGNvbnN0IGkgaW4gZmlsZXMgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGZpbGVzLmhhc093blByb3BlcnR5KCBpICkgKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVuYW1lID0gZmlsZXNbIGkgXTtcclxuICAgICAgICAgICAgICAgICAgaWYgKCBmaWxlbmFtZS5pbmRleE9mKCAnX3BoZXQnICkgPj0gMCApIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdGaWxlbmFtZSA9IGZpbGVuYW1lLnJlcGxhY2UoICdfcGhldCcsICcnICk7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZXhlY3V0ZSggJ212JywgWyBmaWxlbmFtZSwgbmV3RmlsZW5hbWUgXSwgcGhldEJ1aWxkRGlyICk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2UgaWYgKCBicmFuZCA9PT0gY29uc3RhbnRzLlBIRVRfSU9fQlJBTkQgKSB7XHJcbiAgICAgICAgICAgIHRhcmdldFNpbURpciA9IGNvbnN0YW50cy5QSEVUX0lPX1NJTVNfRElSRUNUT1JZICsgc2ltTmFtZTtcclxuICAgICAgICAgICAgdGFyZ2V0VmVyc2lvbkRpciA9IGAke3RhcmdldFNpbURpcn0vJHtvcmlnaW5hbFZlcnNpb259YDtcclxuXHJcbiAgICAgICAgICAgIC8vIENoaXBwZXIgMS4wIGhhcyAtcGhldGlvIGluIHRoZSB2ZXJzaW9uIHNjaGVtYSBmb3IgUGhFVC1pTyBicmFuZGVkIHNpbXNcclxuICAgICAgICAgICAgaWYgKCBjaGlwcGVyVmVyc2lvbi5tYWpvciA9PT0gMCAmJiAhb3JpZ2luYWxWZXJzaW9uLm1hdGNoKCAnLXBoZXRpbycgKSApIHtcclxuICAgICAgICAgICAgICB0YXJnZXRWZXJzaW9uRGlyICs9ICctcGhldGlvJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0YXJnZXRWZXJzaW9uRGlyICs9ICcvJztcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBDb3B5IHN0ZXBzIC0gYWxsb3cgRUVYSVNUIGVycm9ycyBidXQgcmVqZWN0IGFueXRoaW5nIGVsc2VcclxuICAgICAgICAgIHdpbnN0b24uZGVidWcoIGBDcmVhdGluZyB2ZXJzaW9uIGRpcjogJHt0YXJnZXRWZXJzaW9uRGlyfWAgKTtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IGZzLnByb21pc2VzLm1rZGlyKCB0YXJnZXRWZXJzaW9uRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9ICk7XHJcbiAgICAgICAgICAgIHdpbnN0b24uZGVidWcoICdTdWNjZXNzIGNyZWF0aW5nIHNpbSBkaXInICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjYXRjaCggZXJyICkge1xyXG4gICAgICAgICAgICBpZiAoIGVyci5jb2RlICE9PSAnRUVYSVNUJyApIHtcclxuICAgICAgICAgICAgICB3aW5zdG9uLmVycm9yKCAnRmFpbHVyZSBjcmVhdGluZyB2ZXJzaW9uIGRpcicgKTtcclxuICAgICAgICAgICAgICB3aW5zdG9uLmVycm9yKCBlcnIgKTtcclxuICAgICAgICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGxldCBzb3VyY2VEaXIgPSBidWlsZERpcjtcclxuICAgICAgICAgIGlmICggY2hpcHBlclZlcnNpb24ubWFqb3IgPT09IDIgJiYgY2hpcHBlclZlcnNpb24ubWlub3IgPT09IDAgKSB7XHJcbiAgICAgICAgICAgIHNvdXJjZURpciArPSBgLyR7YnJhbmR9YDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKCAoIHJlc29sdmUsIHJlamVjdCApID0+IHtcclxuICAgICAgICAgICAgd2luc3Rvbi5kZWJ1ZyggYENvcHlpbmcgcmVjdXJzaXZlICR7c291cmNlRGlyfSB0byAke3RhcmdldFZlcnNpb25EaXJ9YCApO1xyXG4gICAgICAgICAgICBuZXcgcnN5bmMoKVxyXG4gICAgICAgICAgICAgIC5mbGFncyggJ3JhenBPJyApXHJcbiAgICAgICAgICAgICAgLnNldCggJ25vLXBlcm1zJyApXHJcbiAgICAgICAgICAgICAgLnNldCggJ2V4Y2x1ZGUnLCAnLnJzeW5jLWZpbHRlcicgKVxyXG4gICAgICAgICAgICAgIC5zb3VyY2UoIGAke3NvdXJjZURpcn0vYCApXHJcbiAgICAgICAgICAgICAgLmRlc3RpbmF0aW9uKCB0YXJnZXRWZXJzaW9uRGlyIClcclxuICAgICAgICAgICAgICAub3V0cHV0KCBzdGRvdXQgPT4geyB3aW5zdG9uLmRlYnVnKCBzdGRvdXQudG9TdHJpbmcoKSApOyB9LFxyXG4gICAgICAgICAgICAgICAgc3RkZXJyID0+IHsgd2luc3Rvbi5lcnJvciggc3RkZXJyLnRvU3RyaW5nKCkgKTsgfSApXHJcbiAgICAgICAgICAgICAgLmV4ZWN1dGUoICggZXJyLCBjb2RlLCBjbWQgKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGVyciAmJiBjb2RlICE9PSAyMyApIHtcclxuICAgICAgICAgICAgICAgICAgd2luc3Rvbi5kZWJ1ZyggY29kZSApO1xyXG4gICAgICAgICAgICAgICAgICB3aW5zdG9uLmRlYnVnKCBjbWQgKTtcclxuICAgICAgICAgICAgICAgICAgcmVqZWN0KCBlcnIgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgeyByZXNvbHZlKCk7IH1cclxuICAgICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgICAgd2luc3Rvbi5kZWJ1ZyggJ0NvcHkgZmluaXNoZWQnICk7XHJcblxyXG4gICAgICAgICAgLy8gUG9zdC1jb3B5IHN0ZXBzXHJcbiAgICAgICAgICBpZiAoIGJyYW5kID09PSBjb25zdGFudHMuUEhFVF9CUkFORCApIHtcclxuICAgICAgICAgICAgaWYgKCAhaXNUcmFuc2xhdGlvblJlcXVlc3QgKSB7XHJcbiAgICAgICAgICAgICAgYXdhaXQgZGVwbG95SW1hZ2VzKCB7XHJcbiAgICAgICAgICAgICAgICBzaW11bGF0aW9uOiBvcHRpb25zLnNpbU5hbWUsXHJcbiAgICAgICAgICAgICAgICBicmFuZHM6IG9wdGlvbnMuYnJhbmRzLFxyXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogb3B0aW9ucy52ZXJzaW9uXHJcbiAgICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGF3YWl0IHdyaXRlUGhldEh0YWNjZXNzKCBzaW1OYW1lLCB2ZXJzaW9uICk7XHJcbiAgICAgICAgICAgIGF3YWl0IGNyZWF0ZVRyYW5zbGF0aW9uc1hNTCggc2ltTmFtZSwgdmVyc2lvbiwgY2hlY2tvdXREaXIgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFRoaXMgc2hvdWxkIGJlIHRoZSBsYXN0IGZ1bmN0aW9uIGNhbGxlZCBmb3IgdGhlIHBoZXQgYnJhbmQuXHJcbiAgICAgICAgICAgIC8vIFRoaXMgdHJpZ2dlcnMgYW4gYXN5bmNyb25vdXMgdGFzayBvbiB0aGUgdG9tY2F0L3dpY2tldCBhcHBsaWNhdGlvbiBhbmQgb25seSB3YWl0cyBmb3IgYSByZXNwb25zZSB0aGF0IHRoZSByZXF1ZXN0IHdhcyByZWNlaXZlZC5cclxuICAgICAgICAgICAgLy8gRG8gbm90IGFzc3VtZSB0aGF0IHRoaXMgdGFzayBpcyBjb21wbGV0ZSBiZWNhdXNlIHdlIHVzZSBhd2FpdC5cclxuICAgICAgICAgICAgYXdhaXQgbm90aWZ5U2VydmVyKCB7XHJcbiAgICAgICAgICAgICAgc2ltTmFtZTogc2ltTmFtZSxcclxuICAgICAgICAgICAgICBlbWFpbDogZW1haWwsXHJcbiAgICAgICAgICAgICAgYnJhbmQ6IGJyYW5kLFxyXG4gICAgICAgICAgICAgIGxvY2FsZXM6IGxvY2FsZXMsXHJcbiAgICAgICAgICAgICAgdHJhbnNsYXRvcklkOiBpc1RyYW5zbGF0aW9uUmVxdWVzdCA/IHVzZXJJZCA6IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIGlmICggYnJhbmQgPT09IGNvbnN0YW50cy5QSEVUX0lPX0JSQU5EICkge1xyXG4gICAgICAgICAgICBjb25zdCBzdWZmaXggPSBvcmlnaW5hbFZlcnNpb24uc3BsaXQoICctJyApLmxlbmd0aCA+PSAyID8gb3JpZ2luYWxWZXJzaW9uLnNwbGl0KCAnLScgKVsgMSBdIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgKCBjaGlwcGVyVmVyc2lvbi5tYWpvciA8IDIgPyAncGhldGlvJyA6ICcnICk7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZFZlcnNpb24gPSBTaW1WZXJzaW9uLnBhcnNlKCB2ZXJzaW9uLCAnJyApO1xyXG4gICAgICAgICAgICBjb25zdCBzaW1QYWNrYWdlID0gYXdhaXQgbG9hZEpTT04oIGAke3NpbVJlcG9EaXJ9L3BhY2thZ2UuanNvbmAgKTtcclxuICAgICAgICAgICAgY29uc3QgaWdub3JlRm9yQXV0b21hdGVkTWFpbnRlbmFuY2VSZWxlYXNlcyA9ICEhKCBzaW1QYWNrYWdlICYmIHNpbVBhY2thZ2UucGhldCAmJiBzaW1QYWNrYWdlLnBoZXQuaWdub3JlRm9yQXV0b21hdGVkTWFpbnRlbmFuY2VSZWxlYXNlcyApO1xyXG5cclxuICAgICAgICAgICAgLy8gVGhpcyB0cmlnZ2VycyBhbiBhc3luY3Jvbm91cyB0YXNrIG9uIHRoZSB0b21jYXQvd2lja2V0IGFwcGxpY2F0aW9uIGFuZCBvbmx5IHdhaXRzIGZvciBhIHJlc3BvbnNlIHRoYXQgdGhlIHJlcXVlc3Qgd2FzIHJlY2VpdmVkLlxyXG4gICAgICAgICAgICAvLyBEbyBub3QgYXNzdW1lIHRoYXQgdGhpcyB0YXNrIGlzIGNvbXBsZXRlIGJlY2F1c2Ugd2UgdXNlIGF3YWl0LlxyXG4gICAgICAgICAgICBhd2FpdCBub3RpZnlTZXJ2ZXIoIHtcclxuICAgICAgICAgICAgICBzaW1OYW1lOiBzaW1OYW1lLFxyXG4gICAgICAgICAgICAgIGVtYWlsOiBlbWFpbCxcclxuICAgICAgICAgICAgICBicmFuZDogYnJhbmQsXHJcbiAgICAgICAgICAgICAgcGhldGlvT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgYnJhbmNoOiBicmFuY2gsXHJcbiAgICAgICAgICAgICAgICBzdWZmaXg6IHN1ZmZpeCxcclxuICAgICAgICAgICAgICAgIHZlcnNpb246IHBhcnNlZFZlcnNpb24sXHJcbiAgICAgICAgICAgICAgICBpZ25vcmVGb3JBdXRvbWF0ZWRNYWludGVuYW5jZVJlbGVhc2VzOiBpZ25vcmVGb3JBdXRvbWF0ZWRNYWludGVuYW5jZVJlbGVhc2VzXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgICAgICB3aW5zdG9uLmRlYnVnKCAnc2VydmVyIG5vdGlmaWVkJyApO1xyXG4gICAgICAgICAgICBhd2FpdCB3cml0ZVBoZXRpb0h0YWNjZXNzKCB0YXJnZXRWZXJzaW9uRGlyLCB7XHJcbiAgICAgICAgICAgICAgc2ltTmFtZTogc2ltTmFtZSxcclxuICAgICAgICAgICAgICB2ZXJzaW9uOiBvcmlnaW5hbFZlcnNpb24sXHJcbiAgICAgICAgICAgICAgZGlyZWN0b3J5OiBjb25zdGFudHMuUEhFVF9JT19TSU1TX0RJUkVDVE9SWSxcclxuICAgICAgICAgICAgICBjaGVja291dERpcjogY2hlY2tvdXREaXIsXHJcbiAgICAgICAgICAgICAgaXNQcm9kdWN0aW9uRGVwbG95OiB0cnVlXHJcbiAgICAgICAgICAgIH0gKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGF3YWl0IGFmdGVyRGVwbG95KCBgJHtidWlsZERpcn1gICk7XHJcbiAgfVxyXG4gIGNhdGNoKCBlcnIgKSB7XHJcbiAgICBhd2FpdCBhYm9ydEJ1aWxkKCBlcnIgKTtcclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdGFza1dvcmtlciggdGFzaywgdGFza0NhbGxiYWNrICkge1xyXG4gIHJ1blRhc2soIHRhc2sgKVxyXG4gICAgLnRoZW4oICgpID0+IHtcclxuICAgICAgICB0YXNrQ2FsbGJhY2soKTtcclxuICAgICAgfVxyXG4gICAgKS5jYXRjaCggcmVhc29uID0+IHtcclxuICAgIHRhc2tDYWxsYmFjayggcmVhc29uICk7XHJcbiAgfSApO1xyXG59OyJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTs7QUFHQSxNQUFNQSxTQUFTLEdBQUdDLE9BQU8sQ0FBRSxhQUFjLENBQUM7QUFDMUMsTUFBTUMscUJBQXFCLEdBQUdELE9BQU8sQ0FBRSx5QkFBMEIsQ0FBQztBQUNsRSxNQUFNRSxTQUFTLEdBQUdGLE9BQU8sQ0FBRSxhQUFjLENBQUM7QUFDMUMsTUFBTUcsT0FBTyxHQUFHSCxPQUFPLENBQUUsbUJBQW9CLENBQUM7QUFDOUMsTUFBTUksRUFBRSxHQUFHSixPQUFPLENBQUUsSUFBSyxDQUFDO0FBQzFCLE1BQU1LLFVBQVUsR0FBR0wsT0FBTyxDQUFFLGNBQWUsQ0FBQztBQUM1QyxNQUFNTSxZQUFZLEdBQUdOLE9BQU8sQ0FBRSxnQkFBaUIsQ0FBQztBQUNoRCxNQUFNTyxLQUFLLEdBQUdQLE9BQU8s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