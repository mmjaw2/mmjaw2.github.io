// Copyright 2017-2019, University of Colorado Boulder

/**
 * Deploys a decaf simulation after incrementing the test version number.  This file ported from dev.js
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

const assert = require('assert');
const SimVersion = require('../../common/SimVersion');
const buildLocal = require('../../common/buildLocal');
const devDirectoryExists = require('../../common/devDirectoryExists');
const devScp = require('../../common/devScp');
const devSsh = require('../../common/devSsh');
const getBranch = require('../../common/getBranch');
const getRemoteBranchSHAs = require('../../common/getRemoteBranchSHAs');
const gitIsClean = require('../../common/gitIsClean');
const gitRevParse = require('../../common/gitRevParse');
const loadJSON = require('../../common/loadJSON');
const vpnCheck = require('../../common/vpnCheck');
const grunt = require('grunt');
const fs = require('fs');

// constants
const BUILD_LOCAL_FILENAME = `${process.env.HOME}/.phet/build-local.json`;

/**
 * Deploys a dev version after incrementing the test version number.
 * @public
 *
 * @param {string} project
 * @param {boolean} dev
 * @param {boolean} production
 * @returns {Promise}
 */
module.exports = async function (project, dev, production) {
  const buildLocalJSON = JSON.parse(fs.readFileSync(BUILD_LOCAL_FILENAME, {
    encoding: 'utf-8'
  }));
  const gitRoot = buildLocalJSON.gitRoot;
  const trunkPath = buildLocalJSON.decafTrunkPath;
  assert && assert(gitRoot !== undefined, 'buildLocal.gitRoot is undefined');
  assert && assert(trunkPath !== undefined, 'buildLocal.decafTrunkPath is undefined');
  const stringFiles = fs.readdirSync(`${trunkPath}/simulations-java/simulations/${project}/data/${project}/localization`);
  const locales = stringFiles.filter(stringFile => stringFile.indexOf('_') >= 0).map(file => file.substring(file.indexOf('_') + 1, file.lastIndexOf('.')));
  console.log(locales.join('\n'));

  // Output the flavors and locales
  const javaProperties = fs.readFileSync(`${trunkPath}/simulations-java/simulations/${project}/${project}-build.properties`, 'utf-8');
  // console.log(javaProperties);

  // like  project.flavor.moving-man.mainclass=edu.colorado.phet.movingman.MovingManApplication

  const flavorLines = javaProperties.split('\n').filter(line => line.startsWith('project.flavor'));
  const flavors = flavorLines.length > 0 ? flavorLines.map(line => line.split('.')[2]) : [`${project}`];
  console.log(flavors.join('\n'));
  if (!(await vpnCheck())) {
    grunt.fail.fatal('VPN or being on campus is required for this build. Ensure VPN is enabled, or that you have access to phet-server2.int.colorado.edu');
  }
  const currentBranch = await getBranch('decaf');
  if (currentBranch !== 'main') {
    grunt.fail.fatal(`deployment should be on the branch main, not: ${currentBranch ? currentBranch : '(detached head)'}`);
  }
  const packageFileRelative = `projects/${project}/package.json`;
  const packageFile = `../decaf/${packageFileRelative}`;
  const packageObject = await loadJSON(packageFile);
  const version = SimVersion.parse(packageObject.version);
  const isClean = await gitIsClean('decaf');
  if (!isClean) {
    throw new Error(`Unclean status in ${project}, cannot deploy`);
  }
  const currentSHA = await gitRevParse('decaf', 'HEAD');
  const latestSHA = (await getRemoteBranchSHAs('decaf')).main;
  if (currentSHA !== latestSHA) {
    // See https://github.com/phetsims/chipper/issues/699
    grunt.fail.fatal(`Out of date with remote, please push or pull repo. Current SHA: ${currentSHA}, latest SHA: ${latestSHA}`);
  }
  const versionString = version.toString();

  // await gitAdd( 'decaf', packageFileRelative );
  // await gitCommit( 'decaf', `Bumping version to ${version.toString()}` );
  // await gitPush( 'decaf', 'main' );

  // Create (and fix permissions for) the main simulation directory, if it didn't already exist
  if (dev) {
    const simPath = buildLocal.decafDeployPath + project;
    const versionPath = `${simPath}/${versionString}`;
    const simPathExists = await devDirectoryExists(simPath);
    const versionPathExists = await devDirectoryExists(versionPath);
    if (versionPathExists) {
      grunt.fail.fatal(`Directory ${versionPath} already exists.  If you intend to replace the content then remove the directory manually from ${buildLocal.devDeployServer}.`);
    }
    if (!simPathExists) {
      await devSsh(`mkdir -p "${simPath}" && echo "IndexOrderDefault Descending Date\n" > "${simPath}/.htaccess"`);
    }

    // Create the version-specific directory
    await devSsh(`mkdir -p "${versionPath}"`);

    // Copy the build contents into the version-specific directory
    console.log(`../decaf/projects/${project}`);
    console.log(`${versionPath}/`);
    await devScp(`../decaf/projects/${project}/build/${project}_all.jar`, `${versionPath}/`);
    await devScp(`../decaf/projects/${project}/build/${project}_all.jar.js`, `${versionPath}/`);
    await devScp(`../decaf/projects/${project}/build/${project}.html`, `${versionPath}/`);
    await devScp(`../decaf/projects/${project}/build/splash.gif`, `${versionPath}/`);
    await devScp(`../decaf/projects/${project}/build/style.css`, `${versionPath}/`);
    await devScp(`../decaf/projects/${project}/build/dependencies.json`, `${versionPath}/`);
    await devScp(`../decaf/projects/${project}/build/locales.txt`, `${versionPath}/`);
    await devScp(`../decaf/projects/${project}/build/simulations.txt`, `${versionPath}/`);
    const versionURL = `https://phet-dev.colorado.edu/decaf/${project}/${versionString}`;
    console.log('DEPLOYED');
    if (!fs.existsSync(`${gitRoot}/decaf/build/log.txt`)) {
      fs.mkdirSync(`${gitRoot}/decaf/build`);
    }
    flavors.forEach(flavor => {
      const url = `${versionURL}/${project}.html?simulation=${flavor}`;
      grunt.log.writeln(url);
      fs.appendFileSync(`${gitRoot}/decaf/build/log.txt`, `${url}\n`);
    });
    if (flavors.length === 0) {
      const URL = `${versionURL}/${project}.html`;
      grunt.log.writeln(URL);
      fs.appendFileSync(`${gitRoot}/decaf/build/log.txt`, `${URL}\n`);
    }
  }
  console.log('FLAVORS');
  console.log(flavors.join(', '));
  console.log('LOCALES');
  console.log(locales.join(', '));
  if (production) {
    const productionServerURL = buildLocal.productionServerURL || 'https://phet.colorado.edu';
    // await devSsh( `mkdir -p "/data/web/static/phetsims/sims/cheerpj/${project}"` );
    const template = `cd /data/web/static/phetsims/sims/cheerpj/
sudo -u phet-admin mkdir -p ${project}
cd ${project}
sudo -u phet-admin scp -r bayes.colorado.edu:/data/web/htdocs/dev/decaf/${project}/${version} .

sudo chmod g+w *
printf "RewriteEngine on\\nRewriteBase /sims/cheerpj/${project}/\\nRewriteRule ^latest(.*) ${version}\\$1\\nHeader set Access-Control-Allow-Origin \\"*\\"\\n" > .htaccess

cd ${version}
sudo chmod g+w *

token=$(grep serverToken ~/.phet/build-local.json | sed -r 's/ *"serverToken": "(.*)",/\\1/') && \\
curl -u "token:$\{token}" '${productionServerURL}/services/deploy-cheerpj?project=${project}&version=${version}&locales=${locales.join(',')}&simulations=${flavors.join(',')}'
`;
    console.log('SERVER SCRIPT TO PROMOTE DEV VERSION TO PRODUCTION VERSION');
    console.log(template);
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3NlcnQiLCJyZXF1aXJlIiwiU2ltVmVyc2lvbiIsImJ1aWxkTG9jYWwiLCJkZXZEaXJlY3RvcnlFeGlzdHMiLCJkZXZTY3AiLCJkZXZTc2giLCJnZXRCcmFuY2giLCJnZXRSZW1vdGVCcmFuY2hTSEFzIiwiZ2l0SXNDbGVhbiIsImdpdFJldlBhcnNlIiwibG9hZEpTT04iLCJ2cG5DaGVjayIsImdydW50IiwiZnMiLCJCVUlMRF9MT0NBTF9GSUxFTkFNRSIsInByb2Nlc3MiLCJlbnYiLCJIT01FIiwibW9kdWxlIiwiZXhwb3J0cyIsInByb2plY3QiLCJkZXYiLCJwcm9kdWN0aW9uIiwiYnVpbGRMb2NhbEpTT04iLCJKU09OIiwicGFyc2UiLCJyZWFkRmlsZVN5bmMiLCJlbmNvZGluZyIsImdpdFJvb3QiLCJ0cnVua1BhdGgiLCJkZWNhZlRydW5rUGF0aCIsInVuZGVmaW5lZCIsInN0cmluZ0ZpbGVzIiwicmVhZGRpclN5bmMiLCJsb2NhbGVzIiwiZmlsdGVyIiwic3RyaW5nRmlsZSIsImluZGV4T2YiLCJtYXAiLCJmaWxlIiwic3Vic3RyaW5nIiwibGFzdEluZGV4T2YiLCJjb25zb2xlIiwibG9nIiwiam9pbiIsImphdmFQcm9wZXJ0aWVzIiwiZmxhdm9yTGluZXMiLCJzcGxpdCIsImxpbmUiLCJzdGFydHNXaXRoIiwiZmxhdm9ycyIsImxlbmd0aCIsImZhaWwiLCJmYXRhbCIsImN1cnJlbnRCcmFuY2giLCJwYWNrYWdlRmlsZVJlbGF0aXZlIiwicGFja2FnZUZpbGUiLCJwYWNrYWdlT2JqZWN0IiwidmVyc2lvbiIsImlzQ2xlYW4iLCJFcnJvciIsImN1cnJlbnRTSEEiLCJsYXRlc3RTSEEiLCJtYWluIiwidmVyc2lvblN0cmluZyIsInRvU3RyaW5nIiwic2ltUGF0aCIsImRlY2FmRGVwbG95UGF0aCIsInZlcnNpb25QYXRoIiwic2ltUGF0aEV4aXN0cyIsInZlcnNpb25QYXRoRXhpc3RzIiwiZGV2RGVwbG95U2VydmVyIiwidmVyc2lvblVSTCIsImV4aXN0c1N5bmMiLCJta2RpclN5bmMiLCJmb3JFYWNoIiwiZmxhdm9yIiwidXJsIiwid3JpdGVsbiIsImFwcGVuZEZpbGVTeW5jIiwiVVJMIiwicHJvZHVjdGlvblNlcnZlclVSTCIsInRlbXBsYXRlIl0sInNvdXJjZXMiOlsiZGVwbG95RGVjYWYuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAxOSwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogRGVwbG95cyBhIGRlY2FmIHNpbXVsYXRpb24gYWZ0ZXIgaW5jcmVtZW50aW5nIHRoZSB0ZXN0IHZlcnNpb24gbnVtYmVyLiAgVGhpcyBmaWxlIHBvcnRlZCBmcm9tIGRldi5qc1xyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcblxyXG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCAnYXNzZXJ0JyApO1xyXG5jb25zdCBTaW1WZXJzaW9uID0gcmVxdWlyZSggJy4uLy4uL2NvbW1vbi9TaW1WZXJzaW9uJyApO1xyXG5jb25zdCBidWlsZExvY2FsID0gcmVxdWlyZSggJy4uLy4uL2NvbW1vbi9idWlsZExvY2FsJyApO1xyXG5jb25zdCBkZXZEaXJlY3RvcnlFeGlzdHMgPSByZXF1aXJlKCAnLi4vLi4vY29tbW9uL2RldkRpcmVjdG9yeUV4aXN0cycgKTtcclxuY29uc3QgZGV2U2NwID0gcmVxdWlyZSggJy4uLy4uL2NvbW1vbi9kZXZTY3AnICk7XHJcbmNvbnN0IGRldlNzaCA9IHJlcXVpcmUoICcuLi8uLi9jb21tb24vZGV2U3NoJyApO1xyXG5jb25zdCBnZXRCcmFuY2ggPSByZXF1aXJlKCAnLi4vLi4vY29tbW9uL2dldEJyYW5jaCcgKTtcclxuY29uc3QgZ2V0UmVtb3RlQnJhbmNoU0hBcyA9IHJlcXVpcmUoICcuLi8uLi9jb21tb24vZ2V0UmVtb3RlQnJhbmNoU0hBcycgKTtcclxuY29uc3QgZ2l0SXNDbGVhbiA9IHJlcXVpcmUoICcuLi8uLi9jb21tb24vZ2l0SXNDbGVhbicgKTtcclxuY29uc3QgZ2l0UmV2UGFyc2UgPSByZXF1aXJlKCAnLi4vLi4vY29tbW9uL2dpdFJldlBhcnNlJyApO1xyXG5jb25zdCBsb2FkSlNPTiA9IHJlcXVpcmUoICcuLi8uLi9jb21tb24vbG9hZEpTT04nICk7XHJcbmNvbnN0IHZwbkNoZWNrID0gcmVxdWlyZSggJy4uLy4uL2NvbW1vbi92cG5DaGVjaycgKTtcclxuY29uc3QgZ3J1bnQgPSByZXF1aXJlKCAnZ3J1bnQnICk7XHJcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG5cclxuLy8gY29uc3RhbnRzXHJcbmNvbnN0IEJVSUxEX0xPQ0FMX0ZJTEVOQU1FID0gYCR7cHJvY2Vzcy5lbnYuSE9NRX0vLnBoZXQvYnVpbGQtbG9jYWwuanNvbmA7XHJcblxyXG4vKipcclxuICogRGVwbG95cyBhIGRldiB2ZXJzaW9uIGFmdGVyIGluY3JlbWVudGluZyB0aGUgdGVzdCB2ZXJzaW9uIG51bWJlci5cclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvamVjdFxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGRldlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHByb2R1Y3Rpb25cclxuICogQHJldHVybnMge1Byb21pc2V9XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uKCBwcm9qZWN0LCBkZXYsIHByb2R1Y3Rpb24gKSB7XHJcblxyXG4gIGNvbnN0IGJ1aWxkTG9jYWxKU09OID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBCVUlMRF9MT0NBTF9GSUxFTkFNRSwgeyBlbmNvZGluZzogJ3V0Zi04JyB9ICkgKTtcclxuICBjb25zdCBnaXRSb290ID0gYnVpbGRMb2NhbEpTT04uZ2l0Um9vdDtcclxuICBjb25zdCB0cnVua1BhdGggPSBidWlsZExvY2FsSlNPTi5kZWNhZlRydW5rUGF0aDtcclxuXHJcbiAgYXNzZXJ0ICYmIGFzc2VydCggZ2l0Um9vdCAhPT0gdW5kZWZpbmVkLCAnYnVpbGRMb2NhbC5naXRSb290IGlzIHVuZGVmaW5lZCcgKTtcclxuICBhc3NlcnQgJiYgYXNzZXJ0KCB0cnVua1BhdGggIT09IHVuZGVmaW5lZCwgJ2J1aWxkTG9jYWwuZGVjYWZUcnVua1BhdGggaXMgdW5kZWZpbmVkJyApO1xyXG5cclxuICBjb25zdCBzdHJpbmdGaWxlcyA9IGZzLnJlYWRkaXJTeW5jKCBgJHt0cnVua1BhdGh9L3NpbXVsYXRpb25zLWphdmEvc2ltdWxhdGlvbnMvJHtwcm9qZWN0fS9kYXRhLyR7cHJvamVjdH0vbG9jYWxpemF0aW9uYCApO1xyXG4gIGNvbnN0IGxvY2FsZXMgPSBzdHJpbmdGaWxlcy5maWx0ZXIoIHN0cmluZ0ZpbGUgPT4gc3RyaW5nRmlsZS5pbmRleE9mKCAnXycgKSA+PSAwICkubWFwKCBmaWxlID0+IGZpbGUuc3Vic3RyaW5nKCBmaWxlLmluZGV4T2YoICdfJyApICsgMSwgZmlsZS5sYXN0SW5kZXhPZiggJy4nICkgKSApO1xyXG4gIGNvbnNvbGUubG9nKCBsb2NhbGVzLmpvaW4oICdcXG4nICkgKTtcclxuXHJcbiAgLy8gT3V0cHV0IHRoZSBmbGF2b3JzIGFuZCBsb2NhbGVzXHJcbiAgY29uc3QgamF2YVByb3BlcnRpZXMgPSBmcy5yZWFkRmlsZVN5bmMoIGAke3RydW5rUGF0aH0vc2ltdWxhdGlvbnMtamF2YS9zaW11bGF0aW9ucy8ke3Byb2plY3R9LyR7cHJvamVjdH0tYnVpbGQucHJvcGVydGllc2AsICd1dGYtOCcgKTtcclxuICAvLyBjb25zb2xlLmxvZyhqYXZhUHJvcGVydGllcyk7XHJcblxyXG4vLyBsaWtlICBwcm9qZWN0LmZsYXZvci5tb3ZpbmctbWFuLm1haW5jbGFzcz1lZHUuY29sb3JhZG8ucGhldC5tb3ZpbmdtYW4uTW92aW5nTWFuQXBwbGljYXRpb25cclxuXHJcbiAgY29uc3QgZmxhdm9yTGluZXMgPSBqYXZhUHJvcGVydGllcy5zcGxpdCggJ1xcbicgKS5maWx0ZXIoIGxpbmUgPT4gbGluZS5zdGFydHNXaXRoKCAncHJvamVjdC5mbGF2b3InICkgKTtcclxuICBjb25zdCBmbGF2b3JzID0gZmxhdm9yTGluZXMubGVuZ3RoID4gMCA/IGZsYXZvckxpbmVzLm1hcCggbGluZSA9PiBsaW5lLnNwbGl0KCAnLicgKVsgMiBdICkgOiBbIGAke3Byb2plY3R9YCBdO1xyXG4gIGNvbnNvbGUubG9nKCBmbGF2b3JzLmpvaW4oICdcXG4nICkgKTtcclxuXHJcbiAgaWYgKCAhKCBhd2FpdCB2cG5DaGVjaygpICkgKSB7XHJcbiAgICBncnVudC5mYWlsLmZhdGFsKCAnVlBOIG9yIGJlaW5nIG9uIGNhbXB1cyBpcyByZXF1aXJlZCBmb3IgdGhpcyBidWlsZC4gRW5zdXJlIFZQTiBpcyBlbmFibGVkLCBvciB0aGF0IHlvdSBoYXZlIGFjY2VzcyB0byBwaGV0LXNlcnZlcjIuaW50LmNvbG9yYWRvLmVkdScgKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGN1cnJlbnRCcmFuY2ggPSBhd2FpdCBnZXRCcmFuY2goICdkZWNhZicgKTtcclxuICBpZiAoIGN1cnJlbnRCcmFuY2ggIT09ICdtYWluJyApIHtcclxuICAgIGdydW50LmZhaWwuZmF0YWwoIGBkZXBsb3ltZW50IHNob3VsZCBiZSBvbiB0aGUgYnJhbmNoIG1haW4sIG5vdDogJHtjdXJyZW50QnJhbmNoID8gY3VycmVudEJyYW5jaCA6ICcoZGV0YWNoZWQgaGVhZCknfWAgKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHBhY2thZ2VGaWxlUmVsYXRpdmUgPSBgcHJvamVjdHMvJHtwcm9qZWN0fS9wYWNrYWdlLmpzb25gO1xyXG4gIGNvbnN0IHBhY2thZ2VGaWxlID0gYC4uL2RlY2FmLyR7cGFja2FnZUZpbGVSZWxhdGl2ZX1gO1xyXG4gIGNvbnN0IHBhY2thZ2VPYmplY3QgPSBhd2FpdCBsb2FkSlNPTiggcGFja2FnZUZpbGUgKTtcclxuICBjb25zdCB2ZXJzaW9uID0gU2ltVmVyc2lvbi5wYXJzZSggcGFja2FnZU9iamVjdC52ZXJzaW9uICk7XHJcblxyXG4gIGNvbnN0IGlzQ2xlYW4gPSBhd2FpdCBnaXRJc0NsZWFuKCAnZGVjYWYnICk7XHJcbiAgaWYgKCAhaXNDbGVhbiApIHtcclxuICAgIHRocm93IG5ldyBFcnJvciggYFVuY2xlYW4gc3RhdHVzIGluICR7cHJvamVjdH0sIGNhbm5vdCBkZXBsb3lgICk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBjdXJyZW50U0hBID0gYXdhaXQgZ2l0UmV2UGFyc2UoICdkZWNhZicsICdIRUFEJyApO1xyXG5cclxuICBjb25zdCBsYXRlc3RTSEEgPSAoIGF3YWl0IGdldFJlbW90ZUJyYW5jaFNIQXMoICdkZWNhZicgKSApLm1haW47XHJcbiAgaWYgKCBjdXJyZW50U0hBICE9PSBsYXRlc3RTSEEgKSB7XHJcbiAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzY5OVxyXG4gICAgZ3J1bnQuZmFpbC5mYXRhbCggYE91dCBvZiBkYXRlIHdpdGggcmVtb3RlLCBwbGVhc2UgcHVzaCBvciBwdWxsIHJlcG8uIEN1cnJlbnQgU0hBOiAke2N1cnJlbnRTSEF9LCBsYXRlc3QgU0hBOiAke2xhdGVzdFNIQX1gICk7XHJcbiAgfVxyXG5cclxuICBjb25zdCB2ZXJzaW9uU3RyaW5nID0gdmVyc2lvbi50b1N0cmluZygpO1xyXG5cclxuXHJcbiAgLy8gYXdhaXQgZ2l0QWRkKCAnZGVjYWYnLCBwYWNrYWdlRmlsZVJlbGF0aXZlICk7XHJcbiAgLy8gYXdhaXQgZ2l0Q29tbWl0KCAnZGVjYWYnLCBgQnVtcGluZyB2ZXJzaW9uIHRvICR7dmVyc2lvbi50b1N0cmluZygpfWAgKTtcclxuICAvLyBhd2FpdCBnaXRQdXNoKCAnZGVjYWYnLCAnbWFpbicgKTtcclxuXHJcbiAgLy8gQ3JlYXRlIChhbmQgZml4IHBlcm1pc3Npb25zIGZvcikgdGhlIG1haW4gc2ltdWxhdGlvbiBkaXJlY3RvcnksIGlmIGl0IGRpZG4ndCBhbHJlYWR5IGV4aXN0XHJcbiAgaWYgKCBkZXYgKSB7XHJcblxyXG4gICAgY29uc3Qgc2ltUGF0aCA9IGJ1aWxkTG9jYWwuZGVjYWZEZXBsb3lQYXRoICsgcHJvamVjdDtcclxuICAgIGNvbnN0IHZlcnNpb25QYXRoID0gYCR7c2ltUGF0aH0vJHt2ZXJzaW9uU3RyaW5nfWA7XHJcblxyXG4gICAgY29uc3Qgc2ltUGF0aEV4aXN0cyA9IGF3YWl0IGRldkRpcmVjdG9yeUV4aXN0cyggc2ltUGF0aCApO1xyXG4gICAgY29uc3QgdmVyc2lvblBhdGhFeGlzdHMgPSBhd2FpdCBkZXZEaXJlY3RvcnlFeGlzdHMoIHZlcnNpb25QYXRoICk7XHJcblxyXG4gICAgaWYgKCB2ZXJzaW9uUGF0aEV4aXN0cyApIHtcclxuICAgICAgZ3J1bnQuZmFpbC5mYXRhbCggYERpcmVjdG9yeSAke3ZlcnNpb25QYXRofSBhbHJlYWR5IGV4aXN0cy4gIElmIHlvdSBpbnRlbmQgdG8gcmVwbGFjZSB0aGUgY29udGVudCB0aGVuIHJlbW92ZSB0aGUgZGlyZWN0b3J5IG1hbnVhbGx5IGZyb20gJHtidWlsZExvY2FsLmRldkRlcGxveVNlcnZlcn0uYCApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggIXNpbVBhdGhFeGlzdHMgKSB7XHJcbiAgICAgIGF3YWl0IGRldlNzaCggYG1rZGlyIC1wIFwiJHtzaW1QYXRofVwiICYmIGVjaG8gXCJJbmRleE9yZGVyRGVmYXVsdCBEZXNjZW5kaW5nIERhdGVcXG5cIiA+IFwiJHtzaW1QYXRofS8uaHRhY2Nlc3NcImAgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDcmVhdGUgdGhlIHZlcnNpb24tc3BlY2lmaWMgZGlyZWN0b3J5XHJcbiAgICBhd2FpdCBkZXZTc2goIGBta2RpciAtcCBcIiR7dmVyc2lvblBhdGh9XCJgICk7XHJcblxyXG4gICAgLy8gQ29weSB0aGUgYnVpbGQgY29udGVudHMgaW50byB0aGUgdmVyc2lvbi1zcGVjaWZpYyBkaXJlY3RvcnlcclxuICAgIGNvbnNvbGUubG9nKCBgLi4vZGVjYWYvcHJvamVjdHMvJHtwcm9qZWN0fWAgKTtcclxuICAgIGNvbnNvbGUubG9nKCBgJHt2ZXJzaW9uUGF0aH0vYCApO1xyXG4gICAgYXdhaXQgZGV2U2NwKCBgLi4vZGVjYWYvcHJvamVjdHMvJHtwcm9qZWN0fS9idWlsZC8ke3Byb2plY3R9X2FsbC5qYXJgLCBgJHt2ZXJzaW9uUGF0aH0vYCApO1xyXG4gICAgYXdhaXQgZGV2U2NwKCBgLi4vZGVjYWYvcHJvamVjdHMvJHtwcm9qZWN0fS9idWlsZC8ke3Byb2plY3R9X2FsbC5qYXIuanNgLCBgJHt2ZXJzaW9uUGF0aH0vYCApO1xyXG4gICAgYXdhaXQgZGV2U2NwKCBgLi4vZGVjYWYvcHJvamVjdHMvJHtwcm9qZWN0fS9idWlsZC8ke3Byb2plY3R9Lmh0bWxgLCBgJHt2ZXJzaW9uUGF0aH0vYCApO1xyXG4gICAgYXdhaXQgZGV2U2NwKCBgLi4vZGVjYWYvcHJvamVjdHMvJHtwcm9qZWN0fS9idWlsZC9zcGxhc2guZ2lmYCwgYCR7dmVyc2lvblBhdGh9L2AgKTtcclxuICAgIGF3YWl0IGRldlNjcCggYC4uL2RlY2FmL3Byb2plY3RzLyR7cHJvamVjdH0vYnVpbGQvc3R5bGUuY3NzYCwgYCR7dmVyc2lvblBhdGh9L2AgKTtcclxuICAgIGF3YWl0IGRldlNjcCggYC4uL2RlY2FmL3Byb2plY3RzLyR7cHJvamVjdH0vYnVpbGQvZGVwZW5kZW5jaWVzLmpzb25gLCBgJHt2ZXJzaW9uUGF0aH0vYCApO1xyXG4gICAgYXdhaXQgZGV2U2NwKCBgLi4vZGVjYWYvcHJvamVjdHMvJHtwcm9qZWN0fS9idWlsZC9sb2NhbGVzLnR4dGAsIGAke3ZlcnNpb25QYXRofS9gICk7XHJcbiAgICBhd2FpdCBkZXZTY3AoIGAuLi9kZWNhZi9wcm9qZWN0cy8ke3Byb2plY3R9L2J1aWxkL3NpbXVsYXRpb25zLnR4dGAsIGAke3ZlcnNpb25QYXRofS9gICk7XHJcblxyXG4gICAgY29uc3QgdmVyc2lvblVSTCA9IGBodHRwczovL3BoZXQtZGV2LmNvbG9yYWRvLmVkdS9kZWNhZi8ke3Byb2plY3R9LyR7dmVyc2lvblN0cmluZ31gO1xyXG4gICAgY29uc29sZS5sb2coICdERVBMT1lFRCcgKTtcclxuXHJcbiAgICBpZiAoICFmcy5leGlzdHNTeW5jKCBgJHtnaXRSb290fS9kZWNhZi9idWlsZC9sb2cudHh0YCApICkge1xyXG4gICAgICBmcy5ta2RpclN5bmMoIGAke2dpdFJvb3R9L2RlY2FmL2J1aWxkYCApO1xyXG4gICAgfVxyXG5cclxuICAgIGZsYXZvcnMuZm9yRWFjaCggZmxhdm9yID0+IHtcclxuICAgICAgY29uc3QgdXJsID0gYCR7dmVyc2lvblVSTH0vJHtwcm9qZWN0fS5odG1sP3NpbXVsYXRpb249JHtmbGF2b3J9YDtcclxuICAgICAgZ3J1bnQubG9nLndyaXRlbG4oIHVybCApO1xyXG4gICAgICBmcy5hcHBlbmRGaWxlU3luYyggYCR7Z2l0Um9vdH0vZGVjYWYvYnVpbGQvbG9nLnR4dGAsIGAke3VybH1cXG5gICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgaWYgKCBmbGF2b3JzLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgY29uc3QgVVJMID0gYCR7dmVyc2lvblVSTH0vJHtwcm9qZWN0fS5odG1sYDtcclxuICAgICAgZ3J1bnQubG9nLndyaXRlbG4oIFVSTCApO1xyXG4gICAgICBmcy5hcHBlbmRGaWxlU3luYyggYCR7Z2l0Um9vdH0vZGVjYWYvYnVpbGQvbG9nLnR4dGAsIGAke1VSTH1cXG5gICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zb2xlLmxvZyggJ0ZMQVZPUlMnICk7XHJcbiAgY29uc29sZS5sb2coIGZsYXZvcnMuam9pbiggJywgJyApICk7XHJcblxyXG4gIGNvbnNvbGUubG9nKCAnTE9DQUxFUycgKTtcclxuICBjb25zb2xlLmxvZyggbG9jYWxlcy5qb2luKCAnLCAnICkgKTtcclxuXHJcbiAgaWYgKCBwcm9kdWN0aW9uICkge1xyXG4gICAgY29uc3QgcHJvZHVjdGlvblNlcnZlclVSTCA9IGJ1aWxkTG9jYWwucHJvZHVjdGlvblNlcnZlclVSTCB8fCAnaHR0cHM6Ly9waGV0LmNvbG9yYWRvLmVkdSc7XHJcbiAgICAvLyBhd2FpdCBkZXZTc2goIGBta2RpciAtcCBcIi9kYXRhL3dlYi9zdGF0aWMvcGhldHNpbXMvc2ltcy9jaGVlcnBqLyR7cHJvamVjdH1cImAgKTtcclxuICAgIGNvbnN0IHRlbXBsYXRlID0gYGNkIC9kYXRhL3dlYi9zdGF0aWMvcGhldHNpbXMvc2ltcy9jaGVlcnBqL1xyXG5zdWRvIC11IHBoZXQtYWRtaW4gbWtkaXIgLXAgJHtwcm9qZWN0fVxyXG5jZCAke3Byb2plY3R9XHJcbnN1ZG8gLXUgcGhldC1hZG1pbiBzY3AgLXIgYmF5ZXMuY29sb3JhZG8uZWR1Oi9kYXRhL3dlYi9odGRvY3MvZGV2L2RlY2FmLyR7cHJvamVjdH0vJHt2ZXJzaW9ufSAuXHJcblxyXG5zdWRvIGNobW9kIGcrdyAqXHJcbnByaW50ZiBcIlJld3JpdGVFbmdpbmUgb25cXFxcblJld3JpdGVCYXNlIC9zaW1zL2NoZWVycGovJHtwcm9qZWN0fS9cXFxcblJld3JpdGVSdWxlIF5sYXRlc3QoLiopICR7dmVyc2lvbn1cXFxcJDFcXFxcbkhlYWRlciBzZXQgQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luIFxcXFxcIipcXFxcXCJcXFxcblwiID4gLmh0YWNjZXNzXHJcblxyXG5jZCAke3ZlcnNpb259XHJcbnN1ZG8gY2htb2QgZyt3ICpcclxuXHJcbnRva2VuPSQoZ3JlcCBzZXJ2ZXJUb2tlbiB+Ly5waGV0L2J1aWxkLWxvY2FsLmpzb24gfCBzZWQgLXIgJ3MvICpcInNlcnZlclRva2VuXCI6IFwiKC4qKVwiLC9cXFxcMS8nKSAmJiBcXFxcXHJcbmN1cmwgLXUgXCJ0b2tlbjokXFx7dG9rZW59XCIgJyR7cHJvZHVjdGlvblNlcnZlclVSTH0vc2VydmljZXMvZGVwbG95LWNoZWVycGo/cHJvamVjdD0ke3Byb2plY3R9JnZlcnNpb249JHt2ZXJzaW9ufSZsb2NhbGVzPSR7bG9jYWxlcy5qb2luKCAnLCcgKX0mc2ltdWxhdGlvbnM9JHtmbGF2b3JzLmpvaW4oICcsJyApfSdcclxuYDtcclxuICAgIGNvbnNvbGUubG9nKCAnU0VSVkVSIFNDUklQVCBUTyBQUk9NT1RFIERFViBWRVJTSU9OIFRPIFBST0RVQ1RJT04gVkVSU0lPTicgKTtcclxuICAgIGNvbnNvbGUubG9nKCB0ZW1wbGF0ZSApO1xyXG4gIH1cclxufTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBR0EsTUFBTUEsTUFBTSxHQUFHQyxPQUFPLENBQUUsUUFBUyxDQUFDO0FBQ2xDLE1BQU1DLFVBQVUsR0FBR0QsT0FBTyxDQUFFLHlCQUEwQixDQUFDO0FBQ3ZELE1BQU1FLFVBQVUsR0FBR0YsT0FBTyxDQUFFLHlCQUEwQixDQUFDO0FBQ3ZELE1BQU1HLGtCQUFrQixHQUFHSCxPQUFPLENBQUUsaUNBQWtDLENBQUM7QUFDdkUsTUFBTUksTUFBTSxHQUFHSixPQUFPLENBQUUscUJBQXNCLENBQUM7QUFDL0MsTUFBTUssTUFBTSxHQUFHTCxPQUFPLENBQUUscUJBQXNCLENBQUM7QUFDL0MsTUFBTU0sU0FBUyxHQUFHTixPQUFPLENBQUUsd0JBQXlCLENBQUM7QUFDckQsTUFBTU8sbUJBQW1CLEdBQUdQLE9BQU8sQ0FBRSxrQ0FBbUMsQ0FBQztBQUN6RSxNQUFNUSxVQUFVLEdBQUdSLE9BQU8sQ0FBRSx5QkFBMEIsQ0FBQztBQUN2RCxNQUFNUyxXQUFXLEdBQUdULE9BQU8sQ0FBRSwwQkFBMkIsQ0FBQztBQUN6RCxNQUFNVSxRQUFRLEdBQUdWLE9BQU8sQ0FBRSx1QkFBd0IsQ0FBQztBQUNuRCxNQUFNVyxRQUFRLEdBQUdYLE9BQU8sQ0FBRSx1QkFBd0IsQ0FBQztBQUNuRCxNQUFNWSxLQUFLLEdBQUdaLE9BQU8sQ0FBRSxPQUFRLENBQUM7QUFDaEMsTUFBTWEsRUFBRSxHQUFHYixPQUFPLENBQUUsSUFBSyxDQUFDOztBQUUxQjtBQUNBLE1BQU1jLG9CQUFvQixHQUFJLEdBQUVDLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDQyxJQUFLLHlCQUF3Qjs7QUFFekU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FDLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLGdCQUFnQkMsT0FBTyxFQUFFQyxHQUFHLEVBQUVDLFVBQVUsRUFBRztFQUUxRCxNQUFNQyxjQUFjLEdBQUdDLElBQUksQ0FBQ0MsS0FBSyxDQUFFWixFQUFFLENBQUNhLFlBQVksQ0FBRVosb0JBQW9CLEVBQUU7SUFBRWEsUUFBUSxFQUFFO0VBQVEsQ0FBRSxDQUFFLENBQUM7RUFDbkcsTUFBTUMsT0FBTyxHQUFHTCxjQUFjLENBQUNLLE9BQU87RUFDdEMsTUFBTUMsU0FBUyxHQUFHTixjQUFjLENBQUNPLGNBQWM7RUFFL0MvQixNQUFNLElBQUlBLE1BQU0sQ0FBRTZCLE9BQU8sS0FBS0csU0FBUyxFQUFFLGlDQUFrQyxDQUFDO0VBQzVFaEMsTUFBTSxJQUFJQSxNQUFNLENBQUU4QixTQUFTLEtBQUtFLFNBQVMsRUFBRSx3Q0FBeUMsQ0FBQztFQUVyRixNQUFNQyxXQUFXLEdBQUduQixFQUFFLENBQUNvQixXQUFXLENBQUcsR0FBRUosU0FBVSxpQ0FBZ0NULE9BQVEsU0FBUUEsT0FBUSxlQUFlLENBQUM7RUFDekgsTUFBTWMsT0FBTyxHQUFHRixXQUFXLENBQUNHLE1BQU0sQ0FBRUMsVUFBVSxJQUFJQSxVQUFVLENBQUNDLE9BQU8sQ0FBRSxHQUFJLENBQUMsSUFBSSxDQUFFLENBQUMsQ0FBQ0MsR0FBRyxDQUFFQyxJQUFJLElBQUlBLElBQUksQ0FBQ0MsU0FBUyxDQUFFRCxJQUFJLENBQUNGLE9BQU8sQ0FBRSxHQUFJLENBQUMsR0FBRyxDQUFDLEVBQUVFLElBQUksQ0FBQ0UsV0FBVyxDQUFFLEdBQUksQ0FBRSxDQUFFLENBQUM7RUFDcEtDLE9BQU8sQ0FBQ0MsR0FBRyxDQUFFVCxPQUFPLENBQUNVLElBQUksQ0FBRSxJQUFLLENBQUUsQ0FBQzs7RUFFbkM7RUFDQSxNQUFNQyxjQUFjLEdBQUdoQyxFQUFFLENBQUNhLFlBQVksQ0FBRyxHQUFFRyxTQUFVLGlDQUFnQ1QsT0FBUSxJQUFHQSxPQUFRLG1CQUFrQixFQUFFLE9BQVEsQ0FBQztFQUNySTs7RUFFRjs7RUFFRSxNQUFNMEIsV0FBVyxHQUFHRCxjQUFjLENBQUNFLEtBQUssQ0FBRSxJQUFLLENBQUMsQ0FBQ1osTUFBTSxDQUFFYSxJQUFJLElBQUlBLElBQUksQ0FBQ0MsVUFBVSxDQUFFLGdCQUFpQixDQUFFLENBQUM7RUFDdEcsTUFBTUMsT0FBTyxHQUFHSixXQUFXLENBQUNLLE1BQU0sR0FBRyxDQUFDLEdBQUdMLFdBQVcsQ0FBQ1IsR0FBRyxDQUFFVSxJQUFJLElBQUlBLElBQUksQ0FBQ0QsS0FBSyxDQUFFLEdBQUksQ0FBQyxDQUFFLENBQUMsQ0FBRyxDQUFDLEdBQUcsQ0FBRyxHQUFFM0IsT0FBUSxFQUFDLENBQUU7RUFDN0dzQixPQUFPLENBQUNDLEdBQUcsQ0FBRU8sT0FBTyxDQUFDTixJQUFJLENBQUUsSUFBSyxDQUFFLENBQUM7RUFFbkMsSUFBSyxFQUFHLE1BQU1qQyxRQUFRLENBQUMsQ0FBQyxDQUFFLEVBQUc7SUFDM0JDLEtBQUssQ0FBQ3dDLElBQUksQ0FBQ0MsS0FBSyxDQUFFLG9JQUFxSSxDQUFDO0VBQzFKO0VBRUEsTUFBTUMsYUFBYSxHQUFHLE1BQU1oRCxTQUFTLENBQUUsT0FBUSxDQUFDO0VBQ2hELElBQUtnRCxhQUFhLEtBQUssTUFBTSxFQUFHO0lBQzlCMUMsS0FBSyxDQUFDd0MsSUFBSSxDQUFDQyxLQUFLLENBQUcsaURBQWdEQyxhQUFhLEdBQUdBLGFBQWEsR0FBRyxpQkFBa0IsRUFBRSxDQUFDO0VBQzFIO0VBRUEsTUFBTUMsbUJBQW1CLEdBQUksWUFBV25DLE9BQVEsZUFBYztFQUM5RCxNQUFNb0MsV0FBVyxHQUFJLFlBQVdELG1CQUFvQixFQUFDO0VBQ3JELE1BQU1FLGFBQWEsR0FBRyxNQUFNL0MsUUFBUSxDQUFFOEMsV0FBWSxDQUFDO0VBQ25ELE1BQU1FLE9BQU8sR0FBR3pELFVBQVUsQ0FBQ3dCLEtBQUssQ0FBRWdDLGFBQWEsQ0FBQ0MsT0FBUSxDQUFDO0VBRXpELE1BQU1DLE9BQU8sR0FBRyxNQUFNbkQsVUFBVSxDQUFFLE9BQVEsQ0FBQztFQUMzQyxJQUFLLENBQUNtRCxPQUFPLEVBQUc7SUFDZCxNQUFNLElBQUlDLEtBQUssQ0FBRyxxQkFBb0J4QyxPQUFRLGlCQUFpQixDQUFDO0VBQ2xFO0VBRUEsTUFBTXlDLFVBQVUsR0FBRyxNQUFNcEQsV0FBVyxDQUFFLE9BQU8sRUFBRSxNQUFPLENBQUM7RUFFdkQsTUFBTXFELFNBQVMsR0FBRyxDQUFFLE1BQU12RCxtQkFBbUIsQ0FBRSxPQUFRLENBQUMsRUFBR3dELElBQUk7RUFDL0QsSUFBS0YsVUFBVSxLQUFLQyxTQUFTLEVBQUc7SUFDOUI7SUFDQWxELEtBQUssQ0FBQ3dDLElBQUksQ0FBQ0MsS0FBSyxDQUFHLG1FQUFrRVEsVUFBVyxpQkFBZ0JDLFNBQVUsRUFBRSxDQUFDO0VBQy9IO0VBRUEsTUFBTUUsYUFBYSxHQUFHTixPQUFPLENBQUNPLFFBQVEsQ0FBQyxDQUFDOztFQUd4QztFQUNBO0VBQ0E7O0VBRUE7RUFDQSxJQUFLNUMsR0FBRyxFQUFHO0lBRVQsTUFBTTZDLE9BQU8sR0FBR2hFLFVBQVUsQ0FBQ2lFLGVBQWUsR0FBRy9DLE9BQU87SUFDcEQsTUFBTWdELFdBQVcsR0FBSSxHQUFFRixPQUFRLElBQUdGLGFBQWMsRUFBQztJQUVqRCxNQUFNSyxhQUFhLEdBQUcsTUFBTWxFLGtCQUFrQixDQUFFK0QsT0FBUSxDQUFDO0lBQ3pELE1BQU1JLGlCQUFpQixHQUFHLE1BQU1uRSxrQkFBa0IsQ0FBRWlFLFdBQVksQ0FBQztJQUVqRSxJQUFLRSxpQkFBaUIsRUFBRztNQUN2QjFELEtBQUssQ0FBQ3dDLElBQUksQ0FBQ0MsS0FBSyxDQUFHLGFBQVllLFdBQVksa0dBQWlHbEUsVUFBVSxDQUFDcUUsZUFBZ0IsR0FBRyxDQUFDO0lBQzdLO0lBRUEsSUFBSyxDQUFDRixhQUFhLEVBQUc7TUFDcEIsTUFBTWhFLE1BQU0sQ0FBRyxhQUFZNkQsT0FBUSxzREFBcURBLE9BQVEsYUFBYSxDQUFDO0lBQ2hIOztJQUVBO0lBQ0EsTUFBTTdELE1BQU0sQ0FBRyxhQUFZK0QsV0FBWSxHQUFHLENBQUM7O0lBRTNDO0lBQ0ExQixPQUFPLENBQUNDLEdBQUcsQ0FBRyxxQkFBb0J2QixPQUFRLEVBQUUsQ0FBQztJQUM3Q3NCLE9BQU8sQ0FBQ0MsR0FBRyxDQUFHLEdBQUV5QixXQUFZLEdBQUcsQ0FBQztJQUNoQyxNQUFNaEUsTUFBTSxDQUFHLHFCQUFvQmdCLE9BQVEsVUFBU0EsT0FBUSxVQUFTLEVBQUcsR0FBRWdELFdBQVksR0FBRyxDQUFDO0lBQzFGLE1BQU1oRSxNQUFNLENBQUcscUJBQW9CZ0IsT0FBUSxVQUFTQSxPQUFRLGFBQVksRUFBRyxHQUFFZ0QsV0FBWSxHQUFHLENBQUM7SUFDN0YsTUFBTWhFLE1BQU0sQ0FBRyxxQkFBb0JnQixPQUFRLFVBQVNBLE9BQVEsT0FBTSxFQUFHLEdBQUVnRCxXQUFZLEdBQUcsQ0FBQztJQUN2RixNQUFNaEUsTUFBTSxDQUFHLHFCQUFvQmdCLE9BQVEsbUJBQWtCLEVBQUcsR0FBRWdELFdBQVksR0FBRyxDQUFDO0lBQ2xGLE1BQU1oRSxNQUFNLENBQUcscUJBQW9CZ0IsT0FBUSxrQkFBaUIsRUFBRyxHQUFFZ0QsV0FBWSxHQUFHLENBQUM7SUFDakYsTUFBTWhFLE1BQU0sQ0FBRyxxQkFBb0JnQixPQUFRLDBCQUF5QixFQUFHLEdBQUVnRCxXQUFZLEdBQUcsQ0FBQztJQUN6RixNQUFNaEUsTUFBTSxDQUFHLHFCQUFvQmdCLE9BQVEsb0JBQW1CLEVBQUcsR0FBRWdELFdBQVksR0FBRyxDQUFDO0lBQ25GLE1BQU1oRSxNQUFNLENBQUcscUJBQW9CZ0IsT0FBUSx3QkFBdUIsRUFBRyxHQUFFZ0QsV0FBWSxHQUFHLENBQUM7SUFFdkYsTUFBTUksVUFBVSxHQUFJLHVDQUFzQ3BELE9BQVEsSUFBRzRDLGFBQWMsRUFBQztJQUNwRnRCLE9BQU8sQ0FBQ0MsR0FBRyxDQUFFLFVBQVcsQ0FBQztJQUV6QixJQUFLLENBQUM5QixFQUFFLENBQUM0RCxVQUFVLENBQUcsR0FBRTdDLE9BQVEsc0JBQXNCLENBQUMsRUFBRztNQUN4RGYsRUFBRSxDQUFDNkQsU0FBUyxDQUFHLEdBQUU5QyxPQUFRLGNBQWMsQ0FBQztJQUMxQztJQUVBc0IsT0FBTyxDQUFDeUIsT0FBTyxDQUFFQyxNQUFNLElBQUk7TUFDekIsTUFBTUMsR0FBRyxHQUFJLEdBQUVMLFVBQVcsSUFBR3BELE9BQVEsb0JBQW1Cd0QsTUFBTyxFQUFDO01BQ2hFaEUsS0FBSyxDQUFDK0IsR0FBRyxDQUFDbUMsT0FBTyxDQUFFRCxHQUFJLENBQUM7TUFDeEJoRSxFQUFFLENBQUNrRSxjQUFjLENBQUcsR0FBRW5ELE9BQVEsc0JBQXFCLEVBQUcsR0FBRWlELEdBQUksSUFBSSxDQUFDO0lBQ25FLENBQUUsQ0FBQztJQUVILElBQUszQixPQUFPLENBQUNDLE1BQU0sS0FBSyxDQUFDLEVBQUc7TUFDMUIsTUFBTTZCLEdBQUcsR0FBSSxHQUFFUixVQUFXLElBQUdwRCxPQUFRLE9BQU07TUFDM0NSLEtBQUssQ0FBQytCLEdBQUcsQ0FBQ21DLE9BQU8sQ0FBRUUsR0FBSSxDQUFDO01BQ3hCbkUsRUFBRSxDQUFDa0UsY0FBYyxDQUFHLEdBQUVuRCxPQUFRLHNCQUFxQixFQUFHLEdBQUVvRCxHQUFJLElBQUksQ0FBQztJQUNuRTtFQUNGO0VBRUF0QyxPQUFPLENBQUNDLEdBQUcsQ0FBRSxTQUFVLENBQUM7RUFDeEJELE9BQU8sQ0FBQ0MsR0FBRyxDQUFFTyxPQUFPLENBQUNOLElBQUksQ0FBRSxJQUFLLENBQUUsQ0FBQztFQUVuQ0YsT0FBTyxDQUFDQyxHQUFHLENBQUUsU0FBVSxDQUFDO0VBQ3hCRCxPQUFPLENBQUNDLEdBQUcsQ0FBRVQsT0FBTyxDQUFDVSxJQUFJLENBQUUsSUFBSyxDQUFFLENBQUM7RUFFbkMsSUFBS3RCLFVBQVUsRUFBRztJQUNoQixNQUFNMkQsbUJBQW1CLEdBQUcvRSxVQUFVLENBQUMrRSxtQkFBbUIsSUFBSSwyQkFBMkI7SUFDekY7SUFDQSxNQUFNQyxRQUFRLEdBQUk7QUFDdEIsOEJBQThCOUQsT0FBUTtBQUN0QyxLQUFLQSxPQUFRO0FBQ2IsMEVBQTBFQSxPQUFRLElBQUdzQyxPQUFRO0FBQzdGO0FBQ0E7QUFDQSx1REFBdUR0QyxPQUFRLCtCQUE4QnNDLE9BQVE7QUFDckc7QUFDQSxLQUFLQSxPQUFRO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCdUIsbUJBQW9CLG9DQUFtQzdELE9BQVEsWUFBV3NDLE9BQVEsWUFBV3hCLE9BQU8sQ0FBQ1UsSUFBSSxDQUFFLEdBQUksQ0FBRSxnQkFBZU0sT0FBTyxDQUFDTixJQUFJLENBQUUsR0FBSSxDQUFFO0FBQ2pMLENBQUM7SUFDR0YsT0FBTyxDQUFDQyxHQUFHLENBQUUsNERBQTZELENBQUM7SUFDM0VELE9BQU8sQ0FBQ0MsR0FBRyxDQUFFdUMsUUFBUyxDQUFDO0VBQ3pCO0FBQ0YsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==