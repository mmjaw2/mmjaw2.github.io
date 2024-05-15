// Copyright 2018, University of Colorado Boulder

/**
 * Represents a simulation release branch for deployment
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const buildLocal = require('./buildLocal');
const buildServerRequest = require('./buildServerRequest');
const ChipperVersion = require('./ChipperVersion');
const checkoutMain = require('./checkoutMain');
const checkoutTarget = require('./checkoutTarget');
const createDirectory = require('./createDirectory');
const execute = require('./execute');
const getActiveSims = require('./getActiveSims');
const getBranchDependencies = require('./getBranchDependencies');
const getBranches = require('./getBranches');
const getBuildArguments = require('./getBuildArguments');
const getDependencies = require('./getDependencies');
const getBranchMap = require('./getBranchMap');
const getBranchVersion = require('./getBranchVersion');
const getFileAtBranch = require('./getFileAtBranch');
const getRepoVersion = require('./getRepoVersion');
const gitCheckout = require('./gitCheckout');
const gitCheckoutDirectory = require('./gitCheckoutDirectory');
const gitCloneOrFetchDirectory = require('./gitCloneOrFetchDirectory');
const gitFirstDivergingCommit = require('./gitFirstDivergingCommit');
const gitIsAncestor = require('./gitIsAncestor');
const gitPull = require('./gitPull');
const gitPullDirectory = require('./gitPullDirectory');
const gitRevParse = require('./gitRevParse');
const gitTimestamp = require('./gitTimestamp');
const gruntCommand = require('./gruntCommand');
const loadJSON = require('./loadJSON');
const npmUpdateDirectory = require('./npmUpdateDirectory');
const puppeteerLoad = require('./puppeteerLoad');
const simMetadata = require('./simMetadata');
const simPhetioMetadata = require('./simPhetioMetadata');
const withServer = require('./withServer');
const assert = require('assert');
const fs = require('fs');
const winston = require('../../../../../../perennial-alias/node_modules/winston');
const _ = require('lodash');
module.exports = function () {
  const MAINTENANCE_DIRECTORY = '../release-branches';
  class ReleaseBranch {
    /**
     * @public
     * @constructor
     *
     * @param {string} repo
     * @param {string} branch
     * @param {Array.<string>} brands
     * @param {boolean} isReleased
     */
    constructor(repo, branch, brands, isReleased) {
      assert(typeof repo === 'string');
      assert(typeof branch === 'string');
      assert(Array.isArray(brands));
      assert(typeof isReleased === 'boolean');

      // @public {string}
      this.repo = repo;
      this.branch = branch;

      // @public {Array.<string>}
      this.brands = brands;

      // @public {boolean}
      this.isReleased = isReleased;
    }

    /**
     * Convert into a plain JS object meant for JSON serialization.
     * @public
     *
     * @returns {Object}
     */
    serialize() {
      return {
        repo: this.repo,
        branch: this.branch,
        brands: this.brands,
        isReleased: this.isReleased
      };
    }

    /**
     * Takes a serialized form of the ReleaseBranch and returns an actual instance.
     * @public
     *
     * @param {Object}
     * @returns {ReleaseBranch}
     */
    static deserialize({
      repo,
      branch,
      brands,
      isReleased
    }) {
      return new ReleaseBranch(repo, branch, brands, isReleased);
    }

    /**
     * Returns whether the two release branches contain identical information.
     * @public
     *
     * @param {ReleaseBranch} releaseBranch
     * @returns {boolean}
     */
    equals(releaseBranch) {
      return this.repo === releaseBranch.repo && this.branch === releaseBranch.branch && this.brands.join(',') === releaseBranch.brands.join(',') && this.isReleased === releaseBranch.isReleased;
    }

    /**
     * Converts it to a (debuggable) string form.
     * @public
     *
     * @returns {string}
     */
    toString() {
      return `${this.repo} ${this.branch} ${this.brands.join(',')}${this.isReleased ? '' : ' (unpublished)'}`;
    }

    /**
     * @public
     *
     * @param repo {string}
     * @param branch {string}
     * @returns {string}
     */
    static getCheckoutDirectory(repo, branch) {
      return `${MAINTENANCE_DIRECTORY}/${repo}-${branch}`;
    }

    /**
     * Returns the maintenance directory, for things that want to use it directly.
     * @public
     *
     * @returns {string}
     */
    static getMaintenanceDirectory() {
      return MAINTENANCE_DIRECTORY;
    }

    /**
     * Returns the path (relative to the repo) to the built phet-brand HTML file
     * @public
     *
     * @returns {Promise<string>}
     */
    async getLocalPhetBuiltHTMLPath() {
      const usesChipper2 = await this.usesChipper2();
      return `build/${usesChipper2 ? 'phet/' : ''}${this.repo}_en${usesChipper2 ? '_phet' : ''}.html`;
    }

    /**
     * Returns the path (relative to the repo) to the built phet-io-brand HTML file
     * @public
     *
     * @returns {Promise<string>}
     */
    async getLocalPhetIOBuiltHTMLPath() {
      const usesChipper2 = await this.usesChipper2();
      return `build/${usesChipper2 ? 'phet-io/' : ''}${this.repo}${usesChipper2 ? '_all_phet-io' : '_en-phetio'}.html`;
    }

    /**
     * Returns the query parameter to use for activating phet-io standalone mode
     * @public
     *
     * @returns {Promise<string>}
     */
    async getPhetioStandaloneQueryParameter() {
      return (await this.usesOldPhetioStandalone()) ? 'phet-io.standalone' : 'phetioStandalone';
    }

    /**
     * @public
     *
     * @returns {ChipperVersion}
     */
    getChipperVersion() {
      const checkoutDirectory = ReleaseBranch.getCheckoutDirectory(this.repo, this.branch);
      return ChipperVersion.getFromPackageJSON(JSON.parse(fs.readFileSync(`${checkoutDirectory}/chipper/package.json`, 'utf8')));
    }

    /**
     * @public
     */
    async updateCheckout(overrideDependencies = {}) {
      winston.info(`updating checkout for ${this.toString()}`);
      if (!fs.existsSync(MAINTENANCE_DIRECTORY)) {
        winston.info(`creating directory ${MAINTENANCE_DIRECTORY}`);
        await createDirectory(MAINTENANCE_DIRECTORY);
      }
      const checkoutDirectory = ReleaseBranch.getCheckoutDirectory(this.repo, this.branch);
      if (!fs.existsSync(checkoutDirectory)) {
        winston.info(`creating directory ${checkoutDirectory}`);
        await createDirectory(checkoutDirectory);
      }
      await gitCloneOrFetchDirectory(this.repo, checkoutDirectory);
      await gitCheckoutDirectory(this.branch, `${checkoutDirectory}/${this.repo}`);
      await gitPullDirectory(`${checkoutDirectory}/${this.repo}`);
      const dependenciesOnBranchTip = await loadJSON(`${checkoutDirectory}/${this.repo}/dependencies.json`);
      dependenciesOnBranchTip.babel = {
        sha: buildLocal.babelBranch,
        branch: buildLocal.babelBranch
      };
      const dependencyRepos = _.uniq([...Object.keys(dependenciesOnBranchTip), ...Object.keys(overrideDependencies)].filter(repo => repo !== 'comment'));
      await Promise.all(dependencyRepos.map(async repo => {
        const repoPwd = `${checkoutDirectory}/${repo}`;
        await gitCloneOrFetchDirectory(repo, checkoutDirectory);
        const sha = overrideDependencies[repo] ? overrideDependencies[repo].sha : dependenciesOnBranchTip[repo].sha;
        await gitCheckoutDirectory(sha, repoPwd);

        // Pull babel, since we don't give it a specific SHA (just a branch),
        // see https://github.com/phetsims/perennial/issues/326
        if (repo === 'babel') {
          await gitPullDirectory(repoPwd);
        }
        if (repo === 'chipper' || repo === 'perennial-alias' || repo === this.repo) {
          winston.info(`npm ${repo} in ${checkoutDirectory}`);
          await npmUpdateDirectory(repoPwd);
        }
      }));

      // Perennial can be a nice manual addition in each dir, in case you need to go in and run commands to these
      // branches manually (like build or checkout or update). No need to npm install, you can do that yourself if needed.
      await gitCloneOrFetchDirectory('perennial', checkoutDirectory);
    }

    /**
     * @public
     *
     * @param {Object} [options] - optional parameters for getBuildArguments
     */
    async build(options) {
      const checkoutDirectory = ReleaseBranch.getCheckoutDirectory(this.repo, this.branch);
      const repoDirectory = `${checkoutDirectory}/${this.repo}`;
      const args = getBuildArguments(this.getChipperVersion(), _.merge({
        brands: this.brands,
        allHTML: true,
        debugHTML: true,
        lint: false,
        locales: '*'
      }, options));
      winston.info(`building ${checkoutDirectory} with grunt ${args.join(' ')}`);
      await execute(gruntCommand, args, repoDirectory);
    }

    /**
     * @public
     */
    async transpile() {
      const checkoutDirectory = ReleaseBranch.getCheckoutDirectory(this.repo, this.branch);
      const repoDirectory = `${checkoutDirectory}/${this.repo}`;
      winston.info(`transpiling ${checkoutDirectory}`);

      // We might not be able to run this command!
      await execute(gruntCommand, ['output-js-project'], repoDirectory, {
        errors: 'resolve'
      });
    }

    /**
     * @public
     *
     * @returns {Promise<string|null>} - Error string, or null if no error
     */
    async checkUnbuilt() {
      try {
        return await withServer(async port => {
          const url = `http://localhost:${port}/${this.repo}/${this.repo}_en.html?brand=phet&ea&fuzzMouse&fuzzTouch`;
          try {
            return await puppeteerLoad(url, {
              waitAfterLoad: 20000
            });
          } catch (e) {
            return `Failure for ${url}: ${e}`;
          }
        }, {
          path: ReleaseBranch.getCheckoutDirectory(this.repo, this.branch)
        });
      } catch (e) {
        return `[ERROR] Failure to check: ${e}`;
      }
    }

    /**
     * @public
     *
     * @returns {Promise<string|null>} - Error string, or null if no error
     */
    async checkBuilt() {
      try {
        const usesChipper2 = await this.usesChipper2();
        return await withServer(async port => {
          const url = `http://localhost:${port}/${this.repo}/build/${usesChipper2 ? 'phet/' : ''}${this.repo}_en${usesChipper2 ? '_phet' : ''}.html?fuzzMouse&fuzzTouch`;
          try {
            return puppeteerLoad(url, {
              waitAfterLoad: 20000
            });
          } catch (error) {
            return `Failure for ${url}: ${error}`;
          }
        }, {
          path: ReleaseBranch.getCheckoutDirectory(this.repo, this.branch)
        });
      } catch (e) {
        return `[ERROR] Failure to check: ${e}`;
      }
    }

    /**
     * Checks this release branch out.
     * @public
     *
     * @param {boolean} includeNpmUpdate
     */
    async checkout(includeNpmUpdate) {
      await checkoutTarget(this.repo, this.branch, includeNpmUpdate);
    }

    /**
     * Whether this release branch includes the given SHA for the given repo dependency. Will be false if it doesn't
     * depend on this repository.
     * @public
     *
     * @param {string} repo
     * @param {string} sha
     * @returns {Promise.<boolean>}
     */
    async includesSHA(repo, sha) {
      let result = false;
      await gitCheckout(this.repo, this.branch);
      const dependencies = await getDependencies(this.repo);
      if (dependencies[repo]) {
        const currentSHA = dependencies[repo].sha;
        result = sha === currentSHA || (await gitIsAncestor(repo, sha, currentSHA));
      }
      await gitCheckout(this.repo, 'main');
      return result;
    }

    /**
     * Whether this release branch does NOT include the given SHA for the given repo dependency. Will be false if it doesn't
     * depend on this repository.
     * @public
     *
     * @param {string} repo
     * @param {string} sha
     * @returns {Promise.<boolean>}
     */
    async isMissingSHA(repo, sha) {
      let result = false;
      await gitCheckout(this.repo, this.branch);
      const dependencies = await getDependencies(this.repo);
      if (dependencies[repo]) {
        const currentSHA = dependencies[repo].sha;
        result = sha !== currentSHA && !(await gitIsAncestor(repo, sha, currentSHA));
      }
      await gitCheckout(this.repo, 'main');
      return result;
    }

    /**
     * The SHA at which this release branch's main repository diverged from main.
     * @public
     *
     * @returns {Promise.<string>}
     */
    async getDivergingSHA() {
      await gitCheckout(this.repo, this.branch);
      await gitPull(this.repo);
      await gitCheckout(this.repo, 'main');
      return gitFirstDivergingCommit(this.repo, this.branch, 'main');
    }

    /**
     * The timestamp at which this release branch's main repository diverged from main.
     * @public
     *
     * @returns {Promise.<number>}
     */
    async getDivergingTimestamp() {
      return gitTimestamp(this.repo, await this.getDivergingSHA());
    }

    /**
     * Returns the dependencies.json for this release branch
     * @public
     *
     * @returns {Promise}
     */
    async getDependencies() {
      return getBranchDependencies(this.repo, this.branch);
    }

    /**
     * Returns the SimVersion for this release branch
     * @public
     *
     * @returns {Promise<SimVersion>}
     */
    async getSimVersion() {
      return getBranchVersion(this.repo, this.branch);
    }

    /**
     * Returns a list of status messages of anything out-of-the-ordinary
     * @public
     *
     * @returns {Promise.<Array.<string>>}
     */
    async getStatus(getBranchMapAsyncCallback = getBranchMap) {
      const results = [];
      const dependencies = await this.getDependencies();
      const dependencyNames = Object.keys(dependencies).filter(key => {
        return key !== 'comment' && key !== this.repo && key !== 'phet-io-wrapper-sonification';
      });

      // Check our own dependency
      if (dependencies[this.repo]) {
        try {
          const currentCommit = await gitRevParse(this.repo, this.branch);
          const previousCommit = await gitRevParse(this.repo, `${currentCommit}^`);
          if (dependencies[this.repo].sha !== previousCommit) {
            results.push('[INFO] Potential changes (dependency is not previous commit)');
            results.push(`[INFO] ${currentCommit} ${previousCommit} ${dependencies[this.repo].sha}`);
          }
          if ((await this.getSimVersion()).testType === 'rc' && this.isReleased) {
            results.push('[INFO] Release candidate version detected (see if there is a QA issue)');
          }
        } catch (e) {
          results.push(`[ERROR] Failure to check current/previous commit: ${e.message}`);
        }
      } else {
        results.push('[WARNING] Own repository not included in dependencies');
      }
      for (const dependency of dependencyNames) {
        const potentialReleaseBranch = `${this.repo}-${this.branch}`;
        const branchMap = await getBranchMapAsyncCallback(dependency);
        if (Object.keys(branchMap).includes(potentialReleaseBranch)) {
          if (dependencies[dependency].sha !== branchMap[potentialReleaseBranch]) {
            results.push(`[WARNING] Dependency mismatch for ${dependency} on branch ${potentialReleaseBranch}`);
          }
        }
      }
      return results;
    }

    /**
     * Returns whether the sim is compatible with ES6 features
     * @public
     *
     * @returns {Promise<boolean>}
     */
    async usesES6() {
      await gitCheckout(this.repo, this.branch);
      const dependencies = await getDependencies(this.repo);
      const sha = dependencies.chipper.sha;
      await gitCheckout(this.repo, 'main');
      return gitIsAncestor('chipper', '80b4ad62cd8f2057b844f18d3c00cf5c0c89ed8d', sha);
    }

    /**
     * Returns whether this sim uses initialize-globals based query parameters
     * @public
     *
     * If true:
     *   phet.chipper.queryParameters.WHATEVER
     *   AND it needs to be in the schema
     *
     * If false:
     *   phet.chipper.getQueryParameter( 'WHATEVER' )
     *   FLAGS should use !!phet.chipper.getQueryParameter( 'WHATEVER' )
     *
     * @returns {Promise<boolean>}
     */
    async usesInitializeGlobalsQueryParameters() {
      await gitCheckout(this.repo, this.branch);
      const dependencies = await getDependencies(this.repo);
      const sha = dependencies.chipper.sha;
      await gitCheckout(this.repo, 'main');
      return gitIsAncestor('chipper', 'e454f88ff51d1e3fabdb3a076d7407a2a9e9133c', sha);
    }

    /**
     * Returns whether phet-io.standalone is the correct phet-io query parameter (otherwise it's the newer
     * phetioStandalone).
     * Looks for the presence of https://github.com/phetsims/chipper/commit/4814d6966c54f250b1c0f3909b71f2b9cfcc7665.
     * @public
     *
     * @returns {Promise.<boolean>}
     */
    async usesOldPhetioStandalone() {
      await gitCheckout(this.repo, this.branch);
      const dependencies = await getDependencies(this.repo);
      const sha = dependencies.chipper.sha;
      await gitCheckout(this.repo, 'main');
      return !(await gitIsAncestor('chipper', '4814d6966c54f250b1c0f3909b71f2b9cfcc7665', sha));
    }

    /**
     * Returns whether the relativeSimPath query parameter is used for wrappers (instead of launchLocalVersion).
     * Looks for the presence of https://github.com/phetsims/phet-io/commit/e3fc26079358d86074358a6db3ebaf1af9725632
     * @public
     *
     * @returns {Promise.<boolean>}
     */
    async usesRelativeSimPath() {
      await gitCheckout(this.repo, this.branch);
      const dependencies = await getDependencies(this.repo);
      if (!dependencies['phet-io']) {
        return true; // Doesn't really matter now, does it?
      }
      const sha = dependencies['phet-io'].sha;
      await gitCheckout(this.repo, 'main');
      return gitIsAncestor('phet-io', 'e3fc26079358d86074358a6db3ebaf1af9725632', sha);
    }

    /**
     * Returns whether phet-io Studio is being used instead of deprecated instance proxies wrapper.
     * @public
     *
     * @returns {Promise.<boolean>}
     */
    async usesPhetioStudio() {
      await gitCheckout(this.repo, this.branch);
      const dependencies = await getDependencies(this.repo);
      const sha = dependencies.chipper.sha;
      await gitCheckout(this.repo, 'main');
      return gitIsAncestor('chipper', '7375f6a57b5874b6bbf97a54c9a908f19f88d38f', sha);
    }

    /**
     * Returns whether phet-io Studio top-level (index.html) is used instead of studio.html.
     * @public
     *
     * @returns {Promise.<boolean>}
     */
    async usesPhetioStudioIndex() {
      await gitCheckout(this.repo, this.branch);
      const dependencies = await getDependencies(this.repo);
      const dependency = dependencies['phet-io-wrappers'];
      if (!dependency) {
        return false;
      }
      const sha = dependency.sha;
      await gitCheckout(this.repo, 'main');
      return gitIsAncestor('phet-io-wrappers', '7ec1a04a70fb9707b381b8bcab3ad070815ef7fe', sha);
    }

    /**
     * Returns whether an additional folder exists in the build directory of the sim based on the brand.
     * @public
     *
     * @returns {Promise.<boolean>}
     */
    async usesChipper2() {
      await gitCheckout(this.repo, this.branch);
      const dependencies = await getDependencies(this.repo);
      await gitCheckout('chipper', dependencies.chipper.sha);
      const chipperVersion = ChipperVersion.getFromRepository();
      const result = chipperVersion.major !== 0 || chipperVersion.minor !== 0;
      await gitCheckout(this.repo, 'main');
      await gitCheckout('chipper', 'main');
      return result;
    }

    /**
     * Runs a predicate function with the contents of a specific file's contents in the release branch (with false if
     * it doesn't exist).
     * @public
     *
     * @param {string} file
     * @param {function(contents:string):boolean} predicate
     * @returns {Promise.<boolean>}
     */
    async withFile(file, predicate) {
      await this.checkout(false);
      if (fs.existsSync(file)) {
        const contents = fs.readFileSync(file, 'utf-8');
        return predicate(contents);
      }
      return false;
    }

    /**
     * Re-runs a production deploy for a specific branch.
     * @public
     */
    async redeployProduction(locales = '*') {
      if (this.isReleased) {
        await checkoutTarget(this.repo, this.branch, false);
        const version = await getRepoVersion(this.repo);
        const dependencies = await getDependencies(this.repo);
        await checkoutMain(this.repo, false);
        await buildServerRequest(this.repo, version, this.branch, dependencies, {
          locales: locales,
          brands: this.brands,
          servers: ['production']
        });
      } else {
        throw new Error('Should not redeploy a non-released branch');
      }
    }

    /**
     * Gets a list of ReleaseBranches which would be potential candidates for a maintenance release. This includes:
     * - All published phet brand release branches (from metadata)
     * - All published phet-io brand release branches (from metadata)
     * - All unpublished local release branches
     *
     * @public
     * @returns {Promise.<ReleaseBranch[]>}
     * @rejects {ExecuteError}
     */
    static async getAllMaintenanceBranches() {
      winston.debug('retrieving available sim branches');
      console.log('loading phet brand ReleaseBranches');
      const simMetadataResult = await simMetadata({
        type: 'html'
      });

      // Released phet branches
      const phetBranches = simMetadataResult.projects.map(simData => {
        const repo = simData.name.slice(simData.name.indexOf('/') + 1);
        const branch = `${simData.version.major}.${simData.version.minor}`;
        return new ReleaseBranch(repo, branch, ['phet'], true);
      });
      console.log('loading phet-io brand ReleaseBranches');
      const phetioBranches = (await simPhetioMetadata({
        active: true,
        latest: true
      })).filter(simData => simData.active && simData.latest).map(simData => {
        let branch = `${simData.versionMajor}.${simData.versionMinor}`;
        if (simData.versionSuffix.length) {
          branch += `-${simData.versionSuffix}`; // additional dash required
        }
        return new ReleaseBranch(simData.name, branch, ['phet-io'], true);
      });
      console.log('loading unreleased ReleaseBranches');
      const unreleasedBranches = [];
      for (const repo of getActiveSims()) {
        // Exclude explicitly excluded repos
        if (JSON.parse(fs.readFileSync(`../${repo}/package.json`, 'utf8')).phet.ignoreForAutomatedMaintenanceReleases) {
          continue;
        }
        const branches = await getBranches(repo);
        const releasedBranches = phetBranches.concat(phetioBranches);
        for (const branch of branches) {
          // We aren't unreleased if we're included in either phet or phet-io metadata.
          // See https://github.com/phetsims/balancing-act/issues/118
          if (releasedBranches.filter(releaseBranch => releaseBranch.repo === repo && releaseBranch.branch === branch).length) {
            continue;
          }
          const match = branch.match(/^(\d+)\.(\d+)$/);
          if (match) {
            const major = Number(match[1]);
            const minor = Number(match[2]);

            // Assumption that there is no phet-io brand sim that isn't also released with phet brand
            const projectMetadata = simMetadataResult.projects.find(project => project.name === `html/${repo}`) || null;
            const productionVersion = projectMetadata ? projectMetadata.version : null;
            if (!productionVersion || major > productionVersion.major || major === productionVersion.major && minor > productionVersion.minor) {
              // Do a checkout so we can determine supported brands
              const packageObject = JSON.parse(await getFileAtBranch(repo, branch, 'package.json'));
              const includesPhetio = packageObject.phet && packageObject.phet.supportedBrands && packageObject.phet.supportedBrands.includes('phet-io');
              const brands = ['phet',
              // Assumption that there is no phet-io brand sim that isn't also released with phet brand
              ...(includesPhetio ? ['phet-io'] : [])];
              if (!packageObject.phet.ignoreForAutomatedMaintenanceReleases) {
                unreleasedBranches.push(new ReleaseBranch(repo, branch, brands, false));
              }
            }
          }
        }
      }
      const allReleaseBranches = ReleaseBranch.combineLists([...phetBranches, ...phetioBranches, ...unreleasedBranches]);

      // FAMB 2.3-phetio keeps ending up in the MR list when we don't want it to, see https://github.com/phetsims/phet-io/issues/1957.
      return allReleaseBranches.filter(rb => !(rb.repo === 'forces-and-motion-basics' && rb.branch === '2.3-phetio'));
    }

    /**
     * Combines multiple matching ReleaseBranches into one where appropriate, and sorts. For example, two ReleaseBranches
     * of the same repo but for different brands are combined into a single ReleaseBranch with multiple brands.
     * @public
     *
     * @param {Array.<ReleaseBranch>} simBranches
     * @returns {Array.<ReleaseBranch>}
     */
    static combineLists(simBranches) {
      const resultBranches = [];
      for (const simBranch of simBranches) {
        let foundBranch = false;
        for (const resultBranch of resultBranches) {
          if (simBranch.repo === resultBranch.repo && simBranch.branch === resultBranch.branch) {
            foundBranch = true;
            resultBranch.brands = [...resultBranch.brands, ...simBranch.brands];
            break;
          }
        }
        if (!foundBranch) {
          resultBranches.push(simBranch);
        }
      }
      resultBranches.sort((a, b) => {
        if (a.repo !== b.repo) {
          return a.repo < b.repo ? -1 : 1;
        }
        if (a.branch !== b.branch) {
          return a.branch < b.branch ? -1 : 1;
        }
        return 0;
      });
      return resultBranches;
    }
  }
  return ReleaseBranch;
}();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJidWlsZExvY2FsIiwicmVxdWlyZSIsImJ1aWxkU2VydmVyUmVxdWVzdCIsIkNoaXBwZXJWZXJzaW9uIiwiY2hlY2tvdXRNYWluIiwiY2hlY2tvdXRUYXJnZXQiLCJjcmVhdGVEaXJlY3RvcnkiLCJleGVjdXRlIiwiZ2V0QWN0aXZlU2ltcyIsImdldEJyYW5jaERlcGVuZGVuY2llcyIsImdldEJyYW5jaGVzIiwiZ2V0QnVpbGRBcmd1bWVudHMiLCJnZXREZXBlbmRlbmNpZXMiLCJnZXRCcmFuY2hNYXAiLCJnZXRCcmFuY2hWZXJzaW9uIiwiZ2V0RmlsZUF0QnJhbmNoIiwiZ2V0UmVwb1ZlcnNpb24iLCJnaXRDaGVja291dCIsImdpdENoZWNrb3V0RGlyZWN0b3J5IiwiZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5IiwiZ2l0Rmlyc3REaXZlcmdpbmdDb21taXQiLCJnaXRJc0FuY2VzdG9yIiwiZ2l0UHVsbCIsImdpdFB1bGxEaXJlY3RvcnkiLCJnaXRSZXZQYXJzZSIsImdpdFRpbWVzdGFtcCIsImdydW50Q29tbWFuZCIsImxvYWRKU09OIiwibnBtVXBkYXRlRGlyZWN0b3J5IiwicHVwcGV0ZWVyTG9hZCIsInNpbU1ldGFkYXRhIiwic2ltUGhldGlvTWV0YWRhdGEiLCJ3aXRoU2VydmVyIiwiYXNzZXJ0IiwiZnMiLCJ3aW5zdG9uIiwiXyIsIm1vZHVsZSIsImV4cG9ydHMiLCJNQUlOVEVOQU5DRV9ESVJFQ1RPUlkiLCJSZWxlYXNlQnJhbmNoIiwiY29uc3RydWN0b3IiLCJyZXBvIiwiYnJhbmNoIiwiYnJhbmRzIiwiaXNSZWxlYXNlZCIsIkFycmF5IiwiaXNBcnJheSIsInNlcmlhbGl6ZSIsImRlc2VyaWFsaXplIiwiZXF1YWxzIiwicmVsZWFzZUJyYW5jaCIsImpvaW4iLCJ0b1N0cmluZyIsImdldENoZWNrb3V0RGlyZWN0b3J5IiwiZ2V0TWFpbnRlbmFuY2VEaXJlY3RvcnkiLCJnZXRMb2NhbFBoZXRCdWlsdEhUTUxQYXRoIiwidXNlc0NoaXBwZXIyIiwiZ2V0TG9jYWxQaGV0SU9CdWlsdEhUTUxQYXRoIiwiZ2V0UGhldGlvU3RhbmRhbG9uZVF1ZXJ5UGFyYW1ldGVyIiwidXNlc09sZFBoZXRpb1N0YW5kYWxvbmUiLCJnZXRDaGlwcGVyVmVyc2lvbiIsImNoZWNrb3V0RGlyZWN0b3J5IiwiZ2V0RnJvbVBhY2thZ2VKU09OIiwiSlNPTiIsInBhcnNlIiwicmVhZEZpbGVTeW5jIiwidXBkYXRlQ2hlY2tvdXQiLCJvdmVycmlkZURlcGVuZGVuY2llcyIsImluZm8iLCJleGlzdHNTeW5jIiwiZGVwZW5kZW5jaWVzT25CcmFuY2hUaXAiLCJiYWJlbCIsInNoYSIsImJhYmVsQnJhbmNoIiwiZGVwZW5kZW5jeVJlcG9zIiwidW5pcSIsIk9iamVjdCIsImtleXMiLCJmaWx0ZXIiLCJQcm9taXNlIiwiYWxsIiwibWFwIiwicmVwb1B3ZCIsImJ1aWxkIiwib3B0aW9ucyIsInJlcG9EaXJlY3RvcnkiLCJhcmdzIiwibWVyZ2UiLCJhbGxIVE1MIiwiZGVidWdIVE1MIiwibGludCIsImxvY2FsZXMiLCJ0cmFuc3BpbGUiLCJlcnJvcnMiLCJjaGVja1VuYnVpbHQiLCJwb3J0IiwidXJsIiwid2FpdEFmdGVyTG9hZCIsImUiLCJwYXRoIiwiY2hlY2tCdWlsdCIsImVycm9yIiwiY2hlY2tvdXQiLCJpbmNsdWRlTnBtVXBkYXRlIiwiaW5jbHVkZXNTSEEiLCJyZXN1bHQiLCJkZXBlbmRlbmNpZXMiLCJjdXJyZW50U0hBIiwiaXNNaXNzaW5nU0hBIiwiZ2V0RGl2ZXJnaW5nU0hBIiwiZ2V0RGl2ZXJnaW5nVGltZXN0YW1wIiwiZ2V0U2ltVmVyc2lvbiIsImdldFN0YXR1cyIsImdldEJyYW5jaE1hcEFzeW5jQ2FsbGJhY2siLCJyZXN1bHRzIiwiZGVwZW5kZW5jeU5hbWVzIiwia2V5IiwiY3VycmVudENvbW1pdCIsInByZXZpb3VzQ29tbWl0IiwicHVzaCIsInRlc3RUeXBlIiwibWVzc2FnZSIsImRlcGVuZGVuY3kiLCJwb3RlbnRpYWxSZWxlYXNlQnJhbmNoIiwiYnJhbmNoTWFwIiwiaW5jbHVkZXMiLCJ1c2VzRVM2IiwiY2hpcHBlciIsInVzZXNJbml0aWFsaXplR2xvYmFsc1F1ZXJ5UGFyYW1ldGVycyIsInVzZXNSZWxhdGl2ZVNpbVBhdGgiLCJ1c2VzUGhldGlvU3R1ZGlvIiwidXNlc1BoZXRpb1N0dWRpb0luZGV4IiwiY2hpcHBlclZlcnNpb24iLCJnZXRGcm9tUmVwb3NpdG9yeSIsIm1ham9yIiwibWlub3IiLCJ3aXRoRmlsZSIsImZpbGUiLCJwcmVkaWNhdGUiLCJjb250ZW50cyIsInJlZGVwbG95UHJvZHVjdGlvbiIsInZlcnNpb24iLCJzZXJ2ZXJzIiwiRXJyb3IiLCJnZXRBbGxNYWludGVuYW5jZUJyYW5jaGVzIiwiZGVidWciLCJjb25zb2xlIiwibG9nIiwic2ltTWV0YWRhdGFSZXN1bHQiLCJ0eXBlIiwicGhldEJyYW5jaGVzIiwicHJvamVjdHMiLCJzaW1EYXRhIiwibmFtZSIsInNsaWNlIiwiaW5kZXhPZiIsInBoZXRpb0JyYW5jaGVzIiwiYWN0aXZlIiwibGF0ZXN0IiwidmVyc2lvbk1ham9yIiwidmVyc2lvbk1pbm9yIiwidmVyc2lvblN1ZmZpeCIsImxlbmd0aCIsInVucmVsZWFzZWRCcmFuY2hlcyIsInBoZXQiLCJpZ25vcmVGb3JBdXRvbWF0ZWRNYWludGVuYW5jZVJlbGVhc2VzIiwiYnJhbmNoZXMiLCJyZWxlYXNlZEJyYW5jaGVzIiwiY29uY2F0IiwibWF0Y2giLCJOdW1iZXIiLCJwcm9qZWN0TWV0YWRhdGEiLCJmaW5kIiwicHJvamVjdCIsInByb2R1Y3Rpb25WZXJzaW9uIiwicGFja2FnZU9iamVjdCIsImluY2x1ZGVzUGhldGlvIiwic3VwcG9ydGVkQnJhbmRzIiwiYWxsUmVsZWFzZUJyYW5jaGVzIiwiY29tYmluZUxpc3RzIiwicmIiLCJzaW1CcmFuY2hlcyIsInJlc3VsdEJyYW5jaGVzIiwic2ltQnJhbmNoIiwiZm91bmRCcmFuY2giLCJyZXN1bHRCcmFuY2giLCJzb3J0IiwiYSIsImIiXSwic291cmNlcyI6WyJSZWxlYXNlQnJhbmNoLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBSZXByZXNlbnRzIGEgc2ltdWxhdGlvbiByZWxlYXNlIGJyYW5jaCBmb3IgZGVwbG95bWVudFxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgYnVpbGRMb2NhbCA9IHJlcXVpcmUoICcuL2J1aWxkTG9jYWwnICk7XHJcbmNvbnN0IGJ1aWxkU2VydmVyUmVxdWVzdCA9IHJlcXVpcmUoICcuL2J1aWxkU2VydmVyUmVxdWVzdCcgKTtcclxuY29uc3QgQ2hpcHBlclZlcnNpb24gPSByZXF1aXJlKCAnLi9DaGlwcGVyVmVyc2lvbicgKTtcclxuY29uc3QgY2hlY2tvdXRNYWluID0gcmVxdWlyZSggJy4vY2hlY2tvdXRNYWluJyApO1xyXG5jb25zdCBjaGVja291dFRhcmdldCA9IHJlcXVpcmUoICcuL2NoZWNrb3V0VGFyZ2V0JyApO1xyXG5jb25zdCBjcmVhdGVEaXJlY3RvcnkgPSByZXF1aXJlKCAnLi9jcmVhdGVEaXJlY3RvcnknICk7XHJcbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi9leGVjdXRlJyApO1xyXG5jb25zdCBnZXRBY3RpdmVTaW1zID0gcmVxdWlyZSggJy4vZ2V0QWN0aXZlU2ltcycgKTtcclxuY29uc3QgZ2V0QnJhbmNoRGVwZW5kZW5jaWVzID0gcmVxdWlyZSggJy4vZ2V0QnJhbmNoRGVwZW5kZW5jaWVzJyApO1xyXG5jb25zdCBnZXRCcmFuY2hlcyA9IHJlcXVpcmUoICcuL2dldEJyYW5jaGVzJyApO1xyXG5jb25zdCBnZXRCdWlsZEFyZ3VtZW50cyA9IHJlcXVpcmUoICcuL2dldEJ1aWxkQXJndW1lbnRzJyApO1xyXG5jb25zdCBnZXREZXBlbmRlbmNpZXMgPSByZXF1aXJlKCAnLi9nZXREZXBlbmRlbmNpZXMnICk7XHJcbmNvbnN0IGdldEJyYW5jaE1hcCA9IHJlcXVpcmUoICcuL2dldEJyYW5jaE1hcCcgKTtcclxuY29uc3QgZ2V0QnJhbmNoVmVyc2lvbiA9IHJlcXVpcmUoICcuL2dldEJyYW5jaFZlcnNpb24nICk7XHJcbmNvbnN0IGdldEZpbGVBdEJyYW5jaCA9IHJlcXVpcmUoICcuL2dldEZpbGVBdEJyYW5jaCcgKTtcclxuY29uc3QgZ2V0UmVwb1ZlcnNpb24gPSByZXF1aXJlKCAnLi9nZXRSZXBvVmVyc2lvbicgKTtcclxuY29uc3QgZ2l0Q2hlY2tvdXQgPSByZXF1aXJlKCAnLi9naXRDaGVja291dCcgKTtcclxuY29uc3QgZ2l0Q2hlY2tvdXREaXJlY3RvcnkgPSByZXF1aXJlKCAnLi9naXRDaGVja291dERpcmVjdG9yeScgKTtcclxuY29uc3QgZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5ID0gcmVxdWlyZSggJy4vZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5JyApO1xyXG5jb25zdCBnaXRGaXJzdERpdmVyZ2luZ0NvbW1pdCA9IHJlcXVpcmUoICcuL2dpdEZpcnN0RGl2ZXJnaW5nQ29tbWl0JyApO1xyXG5jb25zdCBnaXRJc0FuY2VzdG9yID0gcmVxdWlyZSggJy4vZ2l0SXNBbmNlc3RvcicgKTtcclxuY29uc3QgZ2l0UHVsbCA9IHJlcXVpcmUoICcuL2dpdFB1bGwnICk7XHJcbmNvbnN0IGdpdFB1bGxEaXJlY3RvcnkgPSByZXF1aXJlKCAnLi9naXRQdWxsRGlyZWN0b3J5JyApO1xyXG5jb25zdCBnaXRSZXZQYXJzZSA9IHJlcXVpcmUoICcuL2dpdFJldlBhcnNlJyApO1xyXG5jb25zdCBnaXRUaW1lc3RhbXAgPSByZXF1aXJlKCAnLi9naXRUaW1lc3RhbXAnICk7XHJcbmNvbnN0IGdydW50Q29tbWFuZCA9IHJlcXVpcmUoICcuL2dydW50Q29tbWFuZCcgKTtcclxuY29uc3QgbG9hZEpTT04gPSByZXF1aXJlKCAnLi9sb2FkSlNPTicgKTtcclxuY29uc3QgbnBtVXBkYXRlRGlyZWN0b3J5ID0gcmVxdWlyZSggJy4vbnBtVXBkYXRlRGlyZWN0b3J5JyApO1xyXG5jb25zdCBwdXBwZXRlZXJMb2FkID0gcmVxdWlyZSggJy4vcHVwcGV0ZWVyTG9hZCcgKTtcclxuY29uc3Qgc2ltTWV0YWRhdGEgPSByZXF1aXJlKCAnLi9zaW1NZXRhZGF0YScgKTtcclxuY29uc3Qgc2ltUGhldGlvTWV0YWRhdGEgPSByZXF1aXJlKCAnLi9zaW1QaGV0aW9NZXRhZGF0YScgKTtcclxuY29uc3Qgd2l0aFNlcnZlciA9IHJlcXVpcmUoICcuL3dpdGhTZXJ2ZXInICk7XHJcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoICdhc3NlcnQnICk7XHJcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG5jb25zdCB3aW5zdG9uID0gcmVxdWlyZSggJ3dpbnN0b24nICk7XHJcbmNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoIGZ1bmN0aW9uKCkge1xyXG5cclxuICBjb25zdCBNQUlOVEVOQU5DRV9ESVJFQ1RPUlkgPSAnLi4vcmVsZWFzZS1icmFuY2hlcyc7XHJcblxyXG4gIGNsYXNzIFJlbGVhc2VCcmFuY2gge1xyXG4gICAgLyoqXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKiBAY29uc3RydWN0b3JcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGJyYW5jaFxyXG4gICAgICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gYnJhbmRzXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzUmVsZWFzZWRcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoIHJlcG8sIGJyYW5jaCwgYnJhbmRzLCBpc1JlbGVhc2VkICkge1xyXG4gICAgICBhc3NlcnQoIHR5cGVvZiByZXBvID09PSAnc3RyaW5nJyApO1xyXG4gICAgICBhc3NlcnQoIHR5cGVvZiBicmFuY2ggPT09ICdzdHJpbmcnICk7XHJcbiAgICAgIGFzc2VydCggQXJyYXkuaXNBcnJheSggYnJhbmRzICkgKTtcclxuICAgICAgYXNzZXJ0KCB0eXBlb2YgaXNSZWxlYXNlZCA9PT0gJ2Jvb2xlYW4nICk7XHJcblxyXG4gICAgICAvLyBAcHVibGljIHtzdHJpbmd9XHJcbiAgICAgIHRoaXMucmVwbyA9IHJlcG87XHJcbiAgICAgIHRoaXMuYnJhbmNoID0gYnJhbmNoO1xyXG5cclxuICAgICAgLy8gQHB1YmxpYyB7QXJyYXkuPHN0cmluZz59XHJcbiAgICAgIHRoaXMuYnJhbmRzID0gYnJhbmRzO1xyXG5cclxuICAgICAgLy8gQHB1YmxpYyB7Ym9vbGVhbn1cclxuICAgICAgdGhpcy5pc1JlbGVhc2VkID0gaXNSZWxlYXNlZDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnZlcnQgaW50byBhIHBsYWluIEpTIG9iamVjdCBtZWFudCBmb3IgSlNPTiBzZXJpYWxpemF0aW9uLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9XHJcbiAgICAgKi9cclxuICAgIHNlcmlhbGl6ZSgpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICByZXBvOiB0aGlzLnJlcG8sXHJcbiAgICAgICAgYnJhbmNoOiB0aGlzLmJyYW5jaCxcclxuICAgICAgICBicmFuZHM6IHRoaXMuYnJhbmRzLFxyXG4gICAgICAgIGlzUmVsZWFzZWQ6IHRoaXMuaXNSZWxlYXNlZFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGFrZXMgYSBzZXJpYWxpemVkIGZvcm0gb2YgdGhlIFJlbGVhc2VCcmFuY2ggYW5kIHJldHVybnMgYW4gYWN0dWFsIGluc3RhbmNlLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fVxyXG4gICAgICogQHJldHVybnMge1JlbGVhc2VCcmFuY2h9XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBkZXNlcmlhbGl6ZSggeyByZXBvLCBicmFuY2gsIGJyYW5kcywgaXNSZWxlYXNlZCB9ICkge1xyXG4gICAgICByZXR1cm4gbmV3IFJlbGVhc2VCcmFuY2goIHJlcG8sIGJyYW5jaCwgYnJhbmRzLCBpc1JlbGVhc2VkICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIHR3byByZWxlYXNlIGJyYW5jaGVzIGNvbnRhaW4gaWRlbnRpY2FsIGluZm9ybWF0aW9uLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7UmVsZWFzZUJyYW5jaH0gcmVsZWFzZUJyYW5jaFxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIGVxdWFscyggcmVsZWFzZUJyYW5jaCApIHtcclxuICAgICAgcmV0dXJuIHRoaXMucmVwbyA9PT0gcmVsZWFzZUJyYW5jaC5yZXBvICYmXHJcbiAgICAgICAgICAgICB0aGlzLmJyYW5jaCA9PT0gcmVsZWFzZUJyYW5jaC5icmFuY2ggJiZcclxuICAgICAgICAgICAgIHRoaXMuYnJhbmRzLmpvaW4oICcsJyApID09PSByZWxlYXNlQnJhbmNoLmJyYW5kcy5qb2luKCAnLCcgKSAmJlxyXG4gICAgICAgICAgICAgdGhpcy5pc1JlbGVhc2VkID09PSByZWxlYXNlQnJhbmNoLmlzUmVsZWFzZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb252ZXJ0cyBpdCB0byBhIChkZWJ1Z2dhYmxlKSBzdHJpbmcgZm9ybS5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICB0b1N0cmluZygpIHtcclxuICAgICAgcmV0dXJuIGAke3RoaXMucmVwb30gJHt0aGlzLmJyYW5jaH0gJHt0aGlzLmJyYW5kcy5qb2luKCAnLCcgKX0ke3RoaXMuaXNSZWxlYXNlZCA/ICcnIDogJyAodW5wdWJsaXNoZWQpJ31gO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSByZXBvIHtzdHJpbmd9XHJcbiAgICAgKiBAcGFyYW0gYnJhbmNoIHtzdHJpbmd9XHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZ2V0Q2hlY2tvdXREaXJlY3RvcnkoIHJlcG8sIGJyYW5jaCApIHtcclxuICAgICAgcmV0dXJuIGAke01BSU5URU5BTkNFX0RJUkVDVE9SWX0vJHtyZXBvfS0ke2JyYW5jaH1gO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgbWFpbnRlbmFuY2UgZGlyZWN0b3J5LCBmb3IgdGhpbmdzIHRoYXQgd2FudCB0byB1c2UgaXQgZGlyZWN0bHkuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGdldE1haW50ZW5hbmNlRGlyZWN0b3J5KCkge1xyXG4gICAgICByZXR1cm4gTUFJTlRFTkFOQ0VfRElSRUNUT1JZO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgcGF0aCAocmVsYXRpdmUgdG8gdGhlIHJlcG8pIHRvIHRoZSBidWlsdCBwaGV0LWJyYW5kIEhUTUwgZmlsZVxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHN0cmluZz59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGdldExvY2FsUGhldEJ1aWx0SFRNTFBhdGgoKSB7XHJcbiAgICAgIGNvbnN0IHVzZXNDaGlwcGVyMiA9IGF3YWl0IHRoaXMudXNlc0NoaXBwZXIyKCk7XHJcblxyXG4gICAgICByZXR1cm4gYGJ1aWxkLyR7dXNlc0NoaXBwZXIyID8gJ3BoZXQvJyA6ICcnfSR7dGhpcy5yZXBvfV9lbiR7dXNlc0NoaXBwZXIyID8gJ19waGV0JyA6ICcnfS5odG1sYDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIHBhdGggKHJlbGF0aXZlIHRvIHRoZSByZXBvKSB0byB0aGUgYnVpbHQgcGhldC1pby1icmFuZCBIVE1MIGZpbGVcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxzdHJpbmc+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyBnZXRMb2NhbFBoZXRJT0J1aWx0SFRNTFBhdGgoKSB7XHJcbiAgICAgIGNvbnN0IHVzZXNDaGlwcGVyMiA9IGF3YWl0IHRoaXMudXNlc0NoaXBwZXIyKCk7XHJcblxyXG4gICAgICByZXR1cm4gYGJ1aWxkLyR7dXNlc0NoaXBwZXIyID8gJ3BoZXQtaW8vJyA6ICcnfSR7dGhpcy5yZXBvfSR7dXNlc0NoaXBwZXIyID8gJ19hbGxfcGhldC1pbycgOiAnX2VuLXBoZXRpbyd9Lmh0bWxgO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgcXVlcnkgcGFyYW1ldGVyIHRvIHVzZSBmb3IgYWN0aXZhdGluZyBwaGV0LWlvIHN0YW5kYWxvbmUgbW9kZVxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHN0cmluZz59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGdldFBoZXRpb1N0YW5kYWxvbmVRdWVyeVBhcmFtZXRlcigpIHtcclxuICAgICAgcmV0dXJuICggYXdhaXQgdGhpcy51c2VzT2xkUGhldGlvU3RhbmRhbG9uZSgpICkgPyAncGhldC1pby5zdGFuZGFsb25lJyA6ICdwaGV0aW9TdGFuZGFsb25lJztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7Q2hpcHBlclZlcnNpb259XHJcbiAgICAgKi9cclxuICAgIGdldENoaXBwZXJWZXJzaW9uKCkge1xyXG4gICAgICBjb25zdCBjaGVja291dERpcmVjdG9yeSA9IFJlbGVhc2VCcmFuY2guZ2V0Q2hlY2tvdXREaXJlY3RvcnkoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuXHJcbiAgICAgIHJldHVybiBDaGlwcGVyVmVyc2lvbi5nZXRGcm9tUGFja2FnZUpTT04oXHJcbiAgICAgICAgSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBgJHtjaGVja291dERpcmVjdG9yeX0vY2hpcHBlci9wYWNrYWdlLmpzb25gLCAndXRmOCcgKSApXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHVwZGF0ZUNoZWNrb3V0KCBvdmVycmlkZURlcGVuZGVuY2llcyA9IHt9ICkge1xyXG4gICAgICB3aW5zdG9uLmluZm8oIGB1cGRhdGluZyBjaGVja291dCBmb3IgJHt0aGlzLnRvU3RyaW5nKCl9YCApO1xyXG5cclxuICAgICAgaWYgKCAhZnMuZXhpc3RzU3luYyggTUFJTlRFTkFOQ0VfRElSRUNUT1JZICkgKSB7XHJcbiAgICAgICAgd2luc3Rvbi5pbmZvKCBgY3JlYXRpbmcgZGlyZWN0b3J5ICR7TUFJTlRFTkFOQ0VfRElSRUNUT1JZfWAgKTtcclxuICAgICAgICBhd2FpdCBjcmVhdGVEaXJlY3RvcnkoIE1BSU5URU5BTkNFX0RJUkVDVE9SWSApO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGNoZWNrb3V0RGlyZWN0b3J5ID0gUmVsZWFzZUJyYW5jaC5nZXRDaGVja291dERpcmVjdG9yeSggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBpZiAoICFmcy5leGlzdHNTeW5jKCBjaGVja291dERpcmVjdG9yeSApICkge1xyXG4gICAgICAgIHdpbnN0b24uaW5mbyggYGNyZWF0aW5nIGRpcmVjdG9yeSAke2NoZWNrb3V0RGlyZWN0b3J5fWAgKTtcclxuICAgICAgICBhd2FpdCBjcmVhdGVEaXJlY3RvcnkoIGNoZWNrb3V0RGlyZWN0b3J5ICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGF3YWl0IGdpdENsb25lT3JGZXRjaERpcmVjdG9yeSggdGhpcy5yZXBvLCBjaGVja291dERpcmVjdG9yeSApO1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dERpcmVjdG9yeSggdGhpcy5icmFuY2gsIGAke2NoZWNrb3V0RGlyZWN0b3J5fS8ke3RoaXMucmVwb31gICk7XHJcbiAgICAgIGF3YWl0IGdpdFB1bGxEaXJlY3RvcnkoIGAke2NoZWNrb3V0RGlyZWN0b3J5fS8ke3RoaXMucmVwb31gICk7XHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llc09uQnJhbmNoVGlwID0gYXdhaXQgbG9hZEpTT04oIGAke2NoZWNrb3V0RGlyZWN0b3J5fS8ke3RoaXMucmVwb30vZGVwZW5kZW5jaWVzLmpzb25gICk7XHJcblxyXG4gICAgICBkZXBlbmRlbmNpZXNPbkJyYW5jaFRpcC5iYWJlbCA9IHsgc2hhOiBidWlsZExvY2FsLmJhYmVsQnJhbmNoLCBicmFuY2g6IGJ1aWxkTG9jYWwuYmFiZWxCcmFuY2ggfTtcclxuXHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY3lSZXBvcyA9IF8udW5pcSggW1xyXG4gICAgICAgIC4uLk9iamVjdC5rZXlzKCBkZXBlbmRlbmNpZXNPbkJyYW5jaFRpcCApLFxyXG4gICAgICAgIC4uLk9iamVjdC5rZXlzKCBvdmVycmlkZURlcGVuZGVuY2llcyApXHJcbiAgICAgIF0uZmlsdGVyKCByZXBvID0+IHJlcG8gIT09ICdjb21tZW50JyApICk7XHJcblxyXG4gICAgICBhd2FpdCBQcm9taXNlLmFsbCggZGVwZW5kZW5jeVJlcG9zLm1hcCggYXN5bmMgcmVwbyA9PiB7XHJcbiAgICAgICAgY29uc3QgcmVwb1B3ZCA9IGAke2NoZWNrb3V0RGlyZWN0b3J5fS8ke3JlcG99YDtcclxuXHJcbiAgICAgICAgYXdhaXQgZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5KCByZXBvLCBjaGVja291dERpcmVjdG9yeSApO1xyXG5cclxuICAgICAgICBjb25zdCBzaGEgPSBvdmVycmlkZURlcGVuZGVuY2llc1sgcmVwbyBdID8gb3ZlcnJpZGVEZXBlbmRlbmNpZXNbIHJlcG8gXS5zaGEgOiBkZXBlbmRlbmNpZXNPbkJyYW5jaFRpcFsgcmVwbyBdLnNoYTtcclxuICAgICAgICBhd2FpdCBnaXRDaGVja291dERpcmVjdG9yeSggc2hhLCByZXBvUHdkICk7XHJcblxyXG4gICAgICAgIC8vIFB1bGwgYmFiZWwsIHNpbmNlIHdlIGRvbid0IGdpdmUgaXQgYSBzcGVjaWZpYyBTSEEgKGp1c3QgYSBicmFuY2gpLFxyXG4gICAgICAgIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGVyZW5uaWFsL2lzc3Vlcy8zMjZcclxuICAgICAgICBpZiAoIHJlcG8gPT09ICdiYWJlbCcgKSB7XHJcbiAgICAgICAgICBhd2FpdCBnaXRQdWxsRGlyZWN0b3J5KCByZXBvUHdkICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIHJlcG8gPT09ICdjaGlwcGVyJyB8fCByZXBvID09PSAncGVyZW5uaWFsLWFsaWFzJyB8fCByZXBvID09PSB0aGlzLnJlcG8gKSB7XHJcbiAgICAgICAgICB3aW5zdG9uLmluZm8oIGBucG0gJHtyZXBvfSBpbiAke2NoZWNrb3V0RGlyZWN0b3J5fWAgKTtcclxuXHJcbiAgICAgICAgICBhd2FpdCBucG1VcGRhdGVEaXJlY3RvcnkoIHJlcG9Qd2QgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKSApO1xyXG5cclxuICAgICAgLy8gUGVyZW5uaWFsIGNhbiBiZSBhIG5pY2UgbWFudWFsIGFkZGl0aW9uIGluIGVhY2ggZGlyLCBpbiBjYXNlIHlvdSBuZWVkIHRvIGdvIGluIGFuZCBydW4gY29tbWFuZHMgdG8gdGhlc2VcclxuICAgICAgLy8gYnJhbmNoZXMgbWFudWFsbHkgKGxpa2UgYnVpbGQgb3IgY2hlY2tvdXQgb3IgdXBkYXRlKS4gTm8gbmVlZCB0byBucG0gaW5zdGFsbCwgeW91IGNhbiBkbyB0aGF0IHlvdXJzZWxmIGlmIG5lZWRlZC5cclxuICAgICAgYXdhaXQgZ2l0Q2xvbmVPckZldGNoRGlyZWN0b3J5KCAncGVyZW5uaWFsJywgY2hlY2tvdXREaXJlY3RvcnkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gb3B0aW9uYWwgcGFyYW1ldGVycyBmb3IgZ2V0QnVpbGRBcmd1bWVudHNcclxuICAgICAqL1xyXG4gICAgYXN5bmMgYnVpbGQoIG9wdGlvbnMgKSB7XHJcbiAgICAgIGNvbnN0IGNoZWNrb3V0RGlyZWN0b3J5ID0gUmVsZWFzZUJyYW5jaC5nZXRDaGVja291dERpcmVjdG9yeSggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBjb25zdCByZXBvRGlyZWN0b3J5ID0gYCR7Y2hlY2tvdXREaXJlY3Rvcnl9LyR7dGhpcy5yZXBvfWA7XHJcblxyXG4gICAgICBjb25zdCBhcmdzID0gZ2V0QnVpbGRBcmd1bWVudHMoIHRoaXMuZ2V0Q2hpcHBlclZlcnNpb24oKSwgXy5tZXJnZSgge1xyXG4gICAgICAgIGJyYW5kczogdGhpcy5icmFuZHMsXHJcbiAgICAgICAgYWxsSFRNTDogdHJ1ZSxcclxuICAgICAgICBkZWJ1Z0hUTUw6IHRydWUsXHJcbiAgICAgICAgbGludDogZmFsc2UsXHJcbiAgICAgICAgbG9jYWxlczogJyonXHJcbiAgICAgIH0sIG9wdGlvbnMgKSApO1xyXG5cclxuICAgICAgd2luc3Rvbi5pbmZvKCBgYnVpbGRpbmcgJHtjaGVja291dERpcmVjdG9yeX0gd2l0aCBncnVudCAke2FyZ3Muam9pbiggJyAnICl9YCApO1xyXG4gICAgICBhd2FpdCBleGVjdXRlKCBncnVudENvbW1hbmQsIGFyZ3MsIHJlcG9EaXJlY3RvcnkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqL1xyXG4gICAgYXN5bmMgdHJhbnNwaWxlKCkge1xyXG4gICAgICBjb25zdCBjaGVja291dERpcmVjdG9yeSA9IFJlbGVhc2VCcmFuY2guZ2V0Q2hlY2tvdXREaXJlY3RvcnkoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuICAgICAgY29uc3QgcmVwb0RpcmVjdG9yeSA9IGAke2NoZWNrb3V0RGlyZWN0b3J5fS8ke3RoaXMucmVwb31gO1xyXG5cclxuICAgICAgd2luc3Rvbi5pbmZvKCBgdHJhbnNwaWxpbmcgJHtjaGVja291dERpcmVjdG9yeX1gICk7XHJcblxyXG4gICAgICAvLyBXZSBtaWdodCBub3QgYmUgYWJsZSB0byBydW4gdGhpcyBjb21tYW5kIVxyXG4gICAgICBhd2FpdCBleGVjdXRlKCBncnVudENvbW1hbmQsIFsgJ291dHB1dC1qcy1wcm9qZWN0JyBdLCByZXBvRGlyZWN0b3J5LCB7XHJcbiAgICAgICAgZXJyb3JzOiAncmVzb2x2ZSdcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHN0cmluZ3xudWxsPn0gLSBFcnJvciBzdHJpbmcsIG9yIG51bGwgaWYgbm8gZXJyb3JcclxuICAgICAqL1xyXG4gICAgYXN5bmMgY2hlY2tVbmJ1aWx0KCkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHJldHVybiBhd2FpdCB3aXRoU2VydmVyKCBhc3luYyBwb3J0ID0+IHtcclxuICAgICAgICAgIGNvbnN0IHVybCA9IGBodHRwOi8vbG9jYWxob3N0OiR7cG9ydH0vJHt0aGlzLnJlcG99LyR7dGhpcy5yZXBvfV9lbi5odG1sP2JyYW5kPXBoZXQmZWEmZnV6ek1vdXNlJmZ1enpUb3VjaGA7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgcHVwcGV0ZWVyTG9hZCggdXJsLCB7XHJcbiAgICAgICAgICAgICAgd2FpdEFmdGVyTG9hZDogMjAwMDBcclxuICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBgRmFpbHVyZSBmb3IgJHt1cmx9OiAke2V9YDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICBwYXRoOiBSZWxlYXNlQnJhbmNoLmdldENoZWNrb3V0RGlyZWN0b3J5KCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoIClcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgcmV0dXJuIGBbRVJST1JdIEZhaWx1cmUgdG8gY2hlY2s6ICR7ZX1gO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2U8c3RyaW5nfG51bGw+fSAtIEVycm9yIHN0cmluZywgb3IgbnVsbCBpZiBubyBlcnJvclxyXG4gICAgICovXHJcbiAgICBhc3luYyBjaGVja0J1aWx0KCkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHVzZXNDaGlwcGVyMiA9IGF3YWl0IHRoaXMudXNlc0NoaXBwZXIyKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBhd2FpdCB3aXRoU2VydmVyKCBhc3luYyBwb3J0ID0+IHtcclxuICAgICAgICAgIGNvbnN0IHVybCA9IGBodHRwOi8vbG9jYWxob3N0OiR7cG9ydH0vJHt0aGlzLnJlcG99L2J1aWxkLyR7dXNlc0NoaXBwZXIyID8gJ3BoZXQvJyA6ICcnfSR7dGhpcy5yZXBvfV9lbiR7dXNlc0NoaXBwZXIyID8gJ19waGV0JyA6ICcnfS5odG1sP2Z1enpNb3VzZSZmdXp6VG91Y2hgO1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmV0dXJuIHB1cHBldGVlckxvYWQoIHVybCwge1xyXG4gICAgICAgICAgICAgIHdhaXRBZnRlckxvYWQ6IDIwMDAwXHJcbiAgICAgICAgICAgIH0gKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNhdGNoKCBlcnJvciApIHtcclxuICAgICAgICAgICAgcmV0dXJuIGBGYWlsdXJlIGZvciAke3VybH06ICR7ZXJyb3J9YDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICBwYXRoOiBSZWxlYXNlQnJhbmNoLmdldENoZWNrb3V0RGlyZWN0b3J5KCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoIClcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgcmV0dXJuIGBbRVJST1JdIEZhaWx1cmUgdG8gY2hlY2s6ICR7ZX1gO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVja3MgdGhpcyByZWxlYXNlIGJyYW5jaCBvdXQuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpbmNsdWRlTnBtVXBkYXRlXHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGNoZWNrb3V0KCBpbmNsdWRlTnBtVXBkYXRlICkge1xyXG4gICAgICBhd2FpdCBjaGVja291dFRhcmdldCggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCwgaW5jbHVkZU5wbVVwZGF0ZSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hldGhlciB0aGlzIHJlbGVhc2UgYnJhbmNoIGluY2x1ZGVzIHRoZSBnaXZlbiBTSEEgZm9yIHRoZSBnaXZlbiByZXBvIGRlcGVuZGVuY3kuIFdpbGwgYmUgZmFsc2UgaWYgaXQgZG9lc24ndFxyXG4gICAgICogZGVwZW5kIG9uIHRoaXMgcmVwb3NpdG9yeS5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNoYVxyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPGJvb2xlYW4+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyBpbmNsdWRlc1NIQSggcmVwbywgc2hhICkge1xyXG4gICAgICBsZXQgcmVzdWx0ID0gZmFsc2U7XHJcblxyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG5cclxuICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gYXdhaXQgZ2V0RGVwZW5kZW5jaWVzKCB0aGlzLnJlcG8gKTtcclxuXHJcbiAgICAgIGlmICggZGVwZW5kZW5jaWVzWyByZXBvIF0gKSB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudFNIQSA9IGRlcGVuZGVuY2llc1sgcmVwbyBdLnNoYTtcclxuICAgICAgICByZXN1bHQgPSBzaGEgPT09IGN1cnJlbnRTSEEgfHwgYXdhaXQgZ2l0SXNBbmNlc3RvciggcmVwbywgc2hhLCBjdXJyZW50U0hBICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sICdtYWluJyApO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFdoZXRoZXIgdGhpcyByZWxlYXNlIGJyYW5jaCBkb2VzIE5PVCBpbmNsdWRlIHRoZSBnaXZlbiBTSEEgZm9yIHRoZSBnaXZlbiByZXBvIGRlcGVuZGVuY3kuIFdpbGwgYmUgZmFsc2UgaWYgaXQgZG9lc24ndFxyXG4gICAgICogZGVwZW5kIG9uIHRoaXMgcmVwb3NpdG9yeS5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNoYVxyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPGJvb2xlYW4+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyBpc01pc3NpbmdTSEEoIHJlcG8sIHNoYSApIHtcclxuICAgICAgbGV0IHJlc3VsdCA9IGZhbHNlO1xyXG5cclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuXHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IGF3YWl0IGdldERlcGVuZGVuY2llcyggdGhpcy5yZXBvICk7XHJcblxyXG4gICAgICBpZiAoIGRlcGVuZGVuY2llc1sgcmVwbyBdICkge1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRTSEEgPSBkZXBlbmRlbmNpZXNbIHJlcG8gXS5zaGE7XHJcbiAgICAgICAgcmVzdWx0ID0gc2hhICE9PSBjdXJyZW50U0hBICYmICEoIGF3YWl0IGdpdElzQW5jZXN0b3IoIHJlcG8sIHNoYSwgY3VycmVudFNIQSApICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sICdtYWluJyApO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBTSEEgYXQgd2hpY2ggdGhpcyByZWxlYXNlIGJyYW5jaCdzIG1haW4gcmVwb3NpdG9yeSBkaXZlcmdlZCBmcm9tIG1haW4uXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPHN0cmluZz59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGdldERpdmVyZ2luZ1NIQSgpIHtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuICAgICAgYXdhaXQgZ2l0UHVsbCggdGhpcy5yZXBvICk7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sICdtYWluJyApO1xyXG5cclxuICAgICAgcmV0dXJuIGdpdEZpcnN0RGl2ZXJnaW5nQ29tbWl0KCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoLCAnbWFpbicgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSB0aW1lc3RhbXAgYXQgd2hpY2ggdGhpcyByZWxlYXNlIGJyYW5jaCdzIG1haW4gcmVwb3NpdG9yeSBkaXZlcmdlZCBmcm9tIG1haW4uXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPG51bWJlcj59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGdldERpdmVyZ2luZ1RpbWVzdGFtcCgpIHtcclxuICAgICAgcmV0dXJuIGdpdFRpbWVzdGFtcCggdGhpcy5yZXBvLCBhd2FpdCB0aGlzLmdldERpdmVyZ2luZ1NIQSgpICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBkZXBlbmRlbmNpZXMuanNvbiBmb3IgdGhpcyByZWxlYXNlIGJyYW5jaFxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAgICovXHJcbiAgICBhc3luYyBnZXREZXBlbmRlbmNpZXMoKSB7XHJcbiAgICAgIHJldHVybiBnZXRCcmFuY2hEZXBlbmRlbmNpZXMoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIFNpbVZlcnNpb24gZm9yIHRoaXMgcmVsZWFzZSBicmFuY2hcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxTaW1WZXJzaW9uPn1cclxuICAgICAqL1xyXG4gICAgYXN5bmMgZ2V0U2ltVmVyc2lvbigpIHtcclxuICAgICAgcmV0dXJuIGdldEJyYW5jaFZlcnNpb24oIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgYSBsaXN0IG9mIHN0YXR1cyBtZXNzYWdlcyBvZiBhbnl0aGluZyBvdXQtb2YtdGhlLW9yZGluYXJ5XHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPEFycmF5LjxzdHJpbmc+Pn1cclxuICAgICAqL1xyXG4gICAgYXN5bmMgZ2V0U3RhdHVzKCBnZXRCcmFuY2hNYXBBc3luY0NhbGxiYWNrID0gZ2V0QnJhbmNoTWFwICkge1xyXG4gICAgICBjb25zdCByZXN1bHRzID0gW107XHJcblxyXG4gICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCB0aGlzLmdldERlcGVuZGVuY2llcygpO1xyXG4gICAgICBjb25zdCBkZXBlbmRlbmN5TmFtZXMgPSBPYmplY3Qua2V5cyggZGVwZW5kZW5jaWVzICkuZmlsdGVyKCBrZXkgPT4ge1xyXG4gICAgICAgIHJldHVybiBrZXkgIT09ICdjb21tZW50JyAmJiBrZXkgIT09IHRoaXMucmVwbyAmJiBrZXkgIT09ICdwaGV0LWlvLXdyYXBwZXItc29uaWZpY2F0aW9uJztcclxuICAgICAgfSApO1xyXG5cclxuICAgICAgLy8gQ2hlY2sgb3VyIG93biBkZXBlbmRlbmN5XHJcbiAgICAgIGlmICggZGVwZW5kZW5jaWVzWyB0aGlzLnJlcG8gXSApIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgY3VycmVudENvbW1pdCA9IGF3YWl0IGdpdFJldlBhcnNlKCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoICk7XHJcbiAgICAgICAgICBjb25zdCBwcmV2aW91c0NvbW1pdCA9IGF3YWl0IGdpdFJldlBhcnNlKCB0aGlzLnJlcG8sIGAke2N1cnJlbnRDb21taXR9XmAgKTtcclxuICAgICAgICAgIGlmICggZGVwZW5kZW5jaWVzWyB0aGlzLnJlcG8gXS5zaGEgIT09IHByZXZpb3VzQ29tbWl0ICkge1xyXG4gICAgICAgICAgICByZXN1bHRzLnB1c2goICdbSU5GT10gUG90ZW50aWFsIGNoYW5nZXMgKGRlcGVuZGVuY3kgaXMgbm90IHByZXZpb3VzIGNvbW1pdCknICk7XHJcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaCggYFtJTkZPXSAke2N1cnJlbnRDb21taXR9ICR7cHJldmlvdXNDb21taXR9ICR7ZGVwZW5kZW5jaWVzWyB0aGlzLnJlcG8gXS5zaGF9YCApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKCAoIGF3YWl0IHRoaXMuZ2V0U2ltVmVyc2lvbigpICkudGVzdFR5cGUgPT09ICdyYycgJiYgdGhpcy5pc1JlbGVhc2VkICkge1xyXG4gICAgICAgICAgICByZXN1bHRzLnB1c2goICdbSU5GT10gUmVsZWFzZSBjYW5kaWRhdGUgdmVyc2lvbiBkZXRlY3RlZCAoc2VlIGlmIHRoZXJlIGlzIGEgUUEgaXNzdWUpJyApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCggZSApIHtcclxuICAgICAgICAgIHJlc3VsdHMucHVzaCggYFtFUlJPUl0gRmFpbHVyZSB0byBjaGVjayBjdXJyZW50L3ByZXZpb3VzIGNvbW1pdDogJHtlLm1lc3NhZ2V9YCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByZXN1bHRzLnB1c2goICdbV0FSTklOR10gT3duIHJlcG9zaXRvcnkgbm90IGluY2x1ZGVkIGluIGRlcGVuZGVuY2llcycgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZm9yICggY29uc3QgZGVwZW5kZW5jeSBvZiBkZXBlbmRlbmN5TmFtZXMgKSB7XHJcbiAgICAgICAgY29uc3QgcG90ZW50aWFsUmVsZWFzZUJyYW5jaCA9IGAke3RoaXMucmVwb30tJHt0aGlzLmJyYW5jaH1gO1xyXG4gICAgICAgIGNvbnN0IGJyYW5jaE1hcCA9IGF3YWl0IGdldEJyYW5jaE1hcEFzeW5jQ2FsbGJhY2soIGRlcGVuZGVuY3kgKTtcclxuXHJcbiAgICAgICAgaWYgKCBPYmplY3Qua2V5cyggYnJhbmNoTWFwICkuaW5jbHVkZXMoIHBvdGVudGlhbFJlbGVhc2VCcmFuY2ggKSApIHtcclxuICAgICAgICAgIGlmICggZGVwZW5kZW5jaWVzWyBkZXBlbmRlbmN5IF0uc2hhICE9PSBicmFuY2hNYXBbIHBvdGVudGlhbFJlbGVhc2VCcmFuY2ggXSApIHtcclxuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKCBgW1dBUk5JTkddIERlcGVuZGVuY3kgbWlzbWF0Y2ggZm9yICR7ZGVwZW5kZW5jeX0gb24gYnJhbmNoICR7cG90ZW50aWFsUmVsZWFzZUJyYW5jaH1gICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgd2hldGhlciB0aGUgc2ltIGlzIGNvbXBhdGlibGUgd2l0aCBFUzYgZmVhdHVyZXNcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxib29sZWFuPn1cclxuICAgICAqL1xyXG4gICAgYXN5bmMgdXNlc0VTNigpIHtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gYXdhaXQgZ2V0RGVwZW5kZW5jaWVzKCB0aGlzLnJlcG8gKTtcclxuICAgICAgY29uc3Qgc2hhID0gZGVwZW5kZW5jaWVzLmNoaXBwZXIuc2hhO1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCAnbWFpbicgKTtcclxuXHJcbiAgICAgIHJldHVybiBnaXRJc0FuY2VzdG9yKCAnY2hpcHBlcicsICc4MGI0YWQ2MmNkOGYyMDU3Yjg0NGYxOGQzYzAwY2Y1YzBjODllZDhkJywgc2hhICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhpcyBzaW0gdXNlcyBpbml0aWFsaXplLWdsb2JhbHMgYmFzZWQgcXVlcnkgcGFyYW1ldGVyc1xyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIElmIHRydWU6XHJcbiAgICAgKiAgIHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuV0hBVEVWRVJcclxuICAgICAqICAgQU5EIGl0IG5lZWRzIHRvIGJlIGluIHRoZSBzY2hlbWFcclxuICAgICAqXHJcbiAgICAgKiBJZiBmYWxzZTpcclxuICAgICAqICAgcGhldC5jaGlwcGVyLmdldFF1ZXJ5UGFyYW1ldGVyKCAnV0hBVEVWRVInIClcclxuICAgICAqICAgRkxBR1Mgc2hvdWxkIHVzZSAhIXBoZXQuY2hpcHBlci5nZXRRdWVyeVBhcmFtZXRlciggJ1dIQVRFVkVSJyApXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2U8Ym9vbGVhbj59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHVzZXNJbml0aWFsaXplR2xvYmFsc1F1ZXJ5UGFyYW1ldGVycygpIHtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHRoaXMucmVwbywgdGhpcy5icmFuY2ggKTtcclxuICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gYXdhaXQgZ2V0RGVwZW5kZW5jaWVzKCB0aGlzLnJlcG8gKTtcclxuICAgICAgY29uc3Qgc2hhID0gZGVwZW5kZW5jaWVzLmNoaXBwZXIuc2hhO1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCAnbWFpbicgKTtcclxuXHJcbiAgICAgIHJldHVybiBnaXRJc0FuY2VzdG9yKCAnY2hpcHBlcicsICdlNDU0Zjg4ZmY1MWQxZTNmYWJkYjNhMDc2ZDc0MDdhMmE5ZTkxMzNjJywgc2hhICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgcGhldC1pby5zdGFuZGFsb25lIGlzIHRoZSBjb3JyZWN0IHBoZXQtaW8gcXVlcnkgcGFyYW1ldGVyIChvdGhlcndpc2UgaXQncyB0aGUgbmV3ZXJcclxuICAgICAqIHBoZXRpb1N0YW5kYWxvbmUpLlxyXG4gICAgICogTG9va3MgZm9yIHRoZSBwcmVzZW5jZSBvZiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9jb21taXQvNDgxNGQ2OTY2YzU0ZjI1MGIxYzBmMzkwOWI3MWYyYjljZmNjNzY2NS5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48Ym9vbGVhbj59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHVzZXNPbGRQaGV0aW9TdGFuZGFsb25lKCkge1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCBnZXREZXBlbmRlbmNpZXMoIHRoaXMucmVwbyApO1xyXG4gICAgICBjb25zdCBzaGEgPSBkZXBlbmRlbmNpZXMuY2hpcHBlci5zaGE7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sICdtYWluJyApO1xyXG5cclxuICAgICAgcmV0dXJuICEoIGF3YWl0IGdpdElzQW5jZXN0b3IoICdjaGlwcGVyJywgJzQ4MTRkNjk2NmM1NGYyNTBiMWMwZjM5MDliNzFmMmI5Y2ZjYzc2NjUnLCBzaGEgKSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB3aGV0aGVyIHRoZSByZWxhdGl2ZVNpbVBhdGggcXVlcnkgcGFyYW1ldGVyIGlzIHVzZWQgZm9yIHdyYXBwZXJzIChpbnN0ZWFkIG9mIGxhdW5jaExvY2FsVmVyc2lvbikuXHJcbiAgICAgKiBMb29rcyBmb3IgdGhlIHByZXNlbmNlIG9mIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvL2NvbW1pdC9lM2ZjMjYwNzkzNThkODYwNzQzNThhNmRiM2ViYWYxYWY5NzI1NjMyXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPGJvb2xlYW4+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyB1c2VzUmVsYXRpdmVTaW1QYXRoKCkge1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCBnZXREZXBlbmRlbmNpZXMoIHRoaXMucmVwbyApO1xyXG5cclxuICAgICAgaWYgKCAhZGVwZW5kZW5jaWVzWyAncGhldC1pbycgXSApIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gRG9lc24ndCByZWFsbHkgbWF0dGVyIG5vdywgZG9lcyBpdD9cclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3Qgc2hhID0gZGVwZW5kZW5jaWVzWyAncGhldC1pbycgXS5zaGE7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sICdtYWluJyApO1xyXG5cclxuICAgICAgcmV0dXJuIGdpdElzQW5jZXN0b3IoICdwaGV0LWlvJywgJ2UzZmMyNjA3OTM1OGQ4NjA3NDM1OGE2ZGIzZWJhZjFhZjk3MjU2MzInLCBzaGEgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgd2hldGhlciBwaGV0LWlvIFN0dWRpbyBpcyBiZWluZyB1c2VkIGluc3RlYWQgb2YgZGVwcmVjYXRlZCBpbnN0YW5jZSBwcm94aWVzIHdyYXBwZXIuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPGJvb2xlYW4+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyB1c2VzUGhldGlvU3R1ZGlvKCkge1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCB0aGlzLmJyYW5jaCApO1xyXG4gICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCBnZXREZXBlbmRlbmNpZXMoIHRoaXMucmVwbyApO1xyXG5cclxuICAgICAgY29uc3Qgc2hhID0gZGVwZW5kZW5jaWVzLmNoaXBwZXIuc2hhO1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCAnbWFpbicgKTtcclxuXHJcbiAgICAgIHJldHVybiBnaXRJc0FuY2VzdG9yKCAnY2hpcHBlcicsICc3Mzc1ZjZhNTdiNTg3NGI2YmJmOTdhNTRjOWE5MDhmMTlmODhkMzhmJywgc2hhICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgcGhldC1pbyBTdHVkaW8gdG9wLWxldmVsIChpbmRleC5odG1sKSBpcyB1c2VkIGluc3RlYWQgb2Ygc3R1ZGlvLmh0bWwuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPGJvb2xlYW4+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyB1c2VzUGhldGlvU3R1ZGlvSW5kZXgoKSB7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoICk7XHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IGF3YWl0IGdldERlcGVuZGVuY2llcyggdGhpcy5yZXBvICk7XHJcblxyXG4gICAgICBjb25zdCBkZXBlbmRlbmN5ID0gZGVwZW5kZW5jaWVzWyAncGhldC1pby13cmFwcGVycycgXTtcclxuICAgICAgaWYgKCAhZGVwZW5kZW5jeSApIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHNoYSA9IGRlcGVuZGVuY3kuc2hhO1xyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCAnbWFpbicgKTtcclxuXHJcbiAgICAgIHJldHVybiBnaXRJc0FuY2VzdG9yKCAncGhldC1pby13cmFwcGVycycsICc3ZWMxYTA0YTcwZmI5NzA3YjM4MWI4YmNhYjNhZDA3MDgxNWVmN2ZlJywgc2hhICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgYW4gYWRkaXRpb25hbCBmb2xkZXIgZXhpc3RzIGluIHRoZSBidWlsZCBkaXJlY3Rvcnkgb2YgdGhlIHNpbSBiYXNlZCBvbiB0aGUgYnJhbmQuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPGJvb2xlYW4+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyB1c2VzQ2hpcHBlcjIoKSB7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCB0aGlzLnJlcG8sIHRoaXMuYnJhbmNoICk7XHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IGF3YWl0IGdldERlcGVuZGVuY2llcyggdGhpcy5yZXBvICk7XHJcbiAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCAnY2hpcHBlcicsIGRlcGVuZGVuY2llcy5jaGlwcGVyLnNoYSApO1xyXG5cclxuICAgICAgY29uc3QgY2hpcHBlclZlcnNpb24gPSBDaGlwcGVyVmVyc2lvbi5nZXRGcm9tUmVwb3NpdG9yeSgpO1xyXG5cclxuICAgICAgY29uc3QgcmVzdWx0ID0gY2hpcHBlclZlcnNpb24ubWFqb3IgIT09IDAgfHwgY2hpcHBlclZlcnNpb24ubWlub3IgIT09IDA7XHJcblxyXG4gICAgICBhd2FpdCBnaXRDaGVja291dCggdGhpcy5yZXBvLCAnbWFpbicgKTtcclxuICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoICdjaGlwcGVyJywgJ21haW4nICk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUnVucyBhIHByZWRpY2F0ZSBmdW5jdGlvbiB3aXRoIHRoZSBjb250ZW50cyBvZiBhIHNwZWNpZmljIGZpbGUncyBjb250ZW50cyBpbiB0aGUgcmVsZWFzZSBicmFuY2ggKHdpdGggZmFsc2UgaWZcclxuICAgICAqIGl0IGRvZXNuJ3QgZXhpc3QpLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKGNvbnRlbnRzOnN0cmluZyk6Ym9vbGVhbn0gcHJlZGljYXRlXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48Ym9vbGVhbj59XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHdpdGhGaWxlKCBmaWxlLCBwcmVkaWNhdGUgKSB7XHJcbiAgICAgIGF3YWl0IHRoaXMuY2hlY2tvdXQoIGZhbHNlICk7XHJcblxyXG4gICAgICBpZiAoIGZzLmV4aXN0c1N5bmMoIGZpbGUgKSApIHtcclxuICAgICAgICBjb25zdCBjb250ZW50cyA9IGZzLnJlYWRGaWxlU3luYyggZmlsZSwgJ3V0Zi04JyApO1xyXG4gICAgICAgIHJldHVybiBwcmVkaWNhdGUoIGNvbnRlbnRzICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlLXJ1bnMgYSBwcm9kdWN0aW9uIGRlcGxveSBmb3IgYSBzcGVjaWZpYyBicmFuY2guXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKi9cclxuICAgIGFzeW5jIHJlZGVwbG95UHJvZHVjdGlvbiggbG9jYWxlcyA9ICcqJyApIHtcclxuICAgICAgaWYgKCB0aGlzLmlzUmVsZWFzZWQgKSB7XHJcbiAgICAgICAgYXdhaXQgY2hlY2tvdXRUYXJnZXQoIHRoaXMucmVwbywgdGhpcy5icmFuY2gsIGZhbHNlICk7XHJcblxyXG4gICAgICAgIGNvbnN0IHZlcnNpb24gPSBhd2FpdCBnZXRSZXBvVmVyc2lvbiggdGhpcy5yZXBvICk7XHJcbiAgICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gYXdhaXQgZ2V0RGVwZW5kZW5jaWVzKCB0aGlzLnJlcG8gKTtcclxuXHJcbiAgICAgICAgYXdhaXQgY2hlY2tvdXRNYWluKCB0aGlzLnJlcG8sIGZhbHNlICk7XHJcblxyXG4gICAgICAgIGF3YWl0IGJ1aWxkU2VydmVyUmVxdWVzdCggdGhpcy5yZXBvLCB2ZXJzaW9uLCB0aGlzLmJyYW5jaCwgZGVwZW5kZW5jaWVzLCB7XHJcbiAgICAgICAgICBsb2NhbGVzOiBsb2NhbGVzLFxyXG4gICAgICAgICAgYnJhbmRzOiB0aGlzLmJyYW5kcyxcclxuICAgICAgICAgIHNlcnZlcnM6IFsgJ3Byb2R1Y3Rpb24nIF1cclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnU2hvdWxkIG5vdCByZWRlcGxveSBhIG5vbi1yZWxlYXNlZCBicmFuY2gnICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldHMgYSBsaXN0IG9mIFJlbGVhc2VCcmFuY2hlcyB3aGljaCB3b3VsZCBiZSBwb3RlbnRpYWwgY2FuZGlkYXRlcyBmb3IgYSBtYWludGVuYW5jZSByZWxlYXNlLiBUaGlzIGluY2x1ZGVzOlxyXG4gICAgICogLSBBbGwgcHVibGlzaGVkIHBoZXQgYnJhbmQgcmVsZWFzZSBicmFuY2hlcyAoZnJvbSBtZXRhZGF0YSlcclxuICAgICAqIC0gQWxsIHB1Ymxpc2hlZCBwaGV0LWlvIGJyYW5kIHJlbGVhc2UgYnJhbmNoZXMgKGZyb20gbWV0YWRhdGEpXHJcbiAgICAgKiAtIEFsbCB1bnB1Ymxpc2hlZCBsb2NhbCByZWxlYXNlIGJyYW5jaGVzXHJcbiAgICAgKlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICogQHJldHVybnMge1Byb21pc2UuPFJlbGVhc2VCcmFuY2hbXT59XHJcbiAgICAgKiBAcmVqZWN0cyB7RXhlY3V0ZUVycm9yfVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYXN5bmMgZ2V0QWxsTWFpbnRlbmFuY2VCcmFuY2hlcygpIHtcclxuICAgICAgd2luc3Rvbi5kZWJ1ZyggJ3JldHJpZXZpbmcgYXZhaWxhYmxlIHNpbSBicmFuY2hlcycgKTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKCAnbG9hZGluZyBwaGV0IGJyYW5kIFJlbGVhc2VCcmFuY2hlcycgKTtcclxuICAgICAgY29uc3Qgc2ltTWV0YWRhdGFSZXN1bHQgPSBhd2FpdCBzaW1NZXRhZGF0YSgge1xyXG4gICAgICAgIHR5cGU6ICdodG1sJ1xyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICAvLyBSZWxlYXNlZCBwaGV0IGJyYW5jaGVzXHJcbiAgICAgIGNvbnN0IHBoZXRCcmFuY2hlcyA9IHNpbU1ldGFkYXRhUmVzdWx0LnByb2plY3RzLm1hcCggc2ltRGF0YSA9PiB7XHJcbiAgICAgICAgY29uc3QgcmVwbyA9IHNpbURhdGEubmFtZS5zbGljZSggc2ltRGF0YS5uYW1lLmluZGV4T2YoICcvJyApICsgMSApO1xyXG4gICAgICAgIGNvbnN0IGJyYW5jaCA9IGAke3NpbURhdGEudmVyc2lvbi5tYWpvcn0uJHtzaW1EYXRhLnZlcnNpb24ubWlub3J9YDtcclxuICAgICAgICByZXR1cm4gbmV3IFJlbGVhc2VCcmFuY2goIHJlcG8sIGJyYW5jaCwgWyAncGhldCcgXSwgdHJ1ZSApO1xyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyggJ2xvYWRpbmcgcGhldC1pbyBicmFuZCBSZWxlYXNlQnJhbmNoZXMnICk7XHJcbiAgICAgIGNvbnN0IHBoZXRpb0JyYW5jaGVzID0gKCBhd2FpdCBzaW1QaGV0aW9NZXRhZGF0YSgge1xyXG4gICAgICAgIGFjdGl2ZTogdHJ1ZSxcclxuICAgICAgICBsYXRlc3Q6IHRydWVcclxuICAgICAgfSApICkuZmlsdGVyKCBzaW1EYXRhID0+IHNpbURhdGEuYWN0aXZlICYmIHNpbURhdGEubGF0ZXN0ICkubWFwKCBzaW1EYXRhID0+IHtcclxuICAgICAgICBsZXQgYnJhbmNoID0gYCR7c2ltRGF0YS52ZXJzaW9uTWFqb3J9LiR7c2ltRGF0YS52ZXJzaW9uTWlub3J9YDtcclxuICAgICAgICBpZiAoIHNpbURhdGEudmVyc2lvblN1ZmZpeC5sZW5ndGggKSB7XHJcbiAgICAgICAgICBicmFuY2ggKz0gYC0ke3NpbURhdGEudmVyc2lvblN1ZmZpeH1gOyAvLyBhZGRpdGlvbmFsIGRhc2ggcmVxdWlyZWRcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZWxlYXNlQnJhbmNoKCBzaW1EYXRhLm5hbWUsIGJyYW5jaCwgWyAncGhldC1pbycgXSwgdHJ1ZSApO1xyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyggJ2xvYWRpbmcgdW5yZWxlYXNlZCBSZWxlYXNlQnJhbmNoZXMnICk7XHJcbiAgICAgIGNvbnN0IHVucmVsZWFzZWRCcmFuY2hlcyA9IFtdO1xyXG4gICAgICBmb3IgKCBjb25zdCByZXBvIG9mIGdldEFjdGl2ZVNpbXMoKSApIHtcclxuXHJcbiAgICAgICAgLy8gRXhjbHVkZSBleHBsaWNpdGx5IGV4Y2x1ZGVkIHJlcG9zXHJcbiAgICAgICAgaWYgKCBKU09OLnBhcnNlKCBmcy5yZWFkRmlsZVN5bmMoIGAuLi8ke3JlcG99L3BhY2thZ2UuanNvbmAsICd1dGY4JyApICkucGhldC5pZ25vcmVGb3JBdXRvbWF0ZWRNYWludGVuYW5jZVJlbGVhc2VzICkge1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBicmFuY2hlcyA9IGF3YWl0IGdldEJyYW5jaGVzKCByZXBvICk7XHJcbiAgICAgICAgY29uc3QgcmVsZWFzZWRCcmFuY2hlcyA9IHBoZXRCcmFuY2hlcy5jb25jYXQoIHBoZXRpb0JyYW5jaGVzICk7XHJcblxyXG4gICAgICAgIGZvciAoIGNvbnN0IGJyYW5jaCBvZiBicmFuY2hlcyApIHtcclxuICAgICAgICAgIC8vIFdlIGFyZW4ndCB1bnJlbGVhc2VkIGlmIHdlJ3JlIGluY2x1ZGVkIGluIGVpdGhlciBwaGV0IG9yIHBoZXQtaW8gbWV0YWRhdGEuXHJcbiAgICAgICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2JhbGFuY2luZy1hY3QvaXNzdWVzLzExOFxyXG4gICAgICAgICAgaWYgKCByZWxlYXNlZEJyYW5jaGVzLmZpbHRlciggcmVsZWFzZUJyYW5jaCA9PiByZWxlYXNlQnJhbmNoLnJlcG8gPT09IHJlcG8gJiYgcmVsZWFzZUJyYW5jaC5icmFuY2ggPT09IGJyYW5jaCApLmxlbmd0aCApIHtcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSBicmFuY2gubWF0Y2goIC9eKFxcZCspXFwuKFxcZCspJC8gKTtcclxuXHJcbiAgICAgICAgICBpZiAoIG1hdGNoICkge1xyXG4gICAgICAgICAgICBjb25zdCBtYWpvciA9IE51bWJlciggbWF0Y2hbIDEgXSApO1xyXG4gICAgICAgICAgICBjb25zdCBtaW5vciA9IE51bWJlciggbWF0Y2hbIDIgXSApO1xyXG5cclxuICAgICAgICAgICAgLy8gQXNzdW1wdGlvbiB0aGF0IHRoZXJlIGlzIG5vIHBoZXQtaW8gYnJhbmQgc2ltIHRoYXQgaXNuJ3QgYWxzbyByZWxlYXNlZCB3aXRoIHBoZXQgYnJhbmRcclxuICAgICAgICAgICAgY29uc3QgcHJvamVjdE1ldGFkYXRhID0gc2ltTWV0YWRhdGFSZXN1bHQucHJvamVjdHMuZmluZCggcHJvamVjdCA9PiBwcm9qZWN0Lm5hbWUgPT09IGBodG1sLyR7cmVwb31gICkgfHwgbnVsbDtcclxuICAgICAgICAgICAgY29uc3QgcHJvZHVjdGlvblZlcnNpb24gPSBwcm9qZWN0TWV0YWRhdGEgPyBwcm9qZWN0TWV0YWRhdGEudmVyc2lvbiA6IG51bGw7XHJcblxyXG4gICAgICAgICAgICBpZiAoICFwcm9kdWN0aW9uVmVyc2lvbiB8fFxyXG4gICAgICAgICAgICAgICAgIG1ham9yID4gcHJvZHVjdGlvblZlcnNpb24ubWFqb3IgfHxcclxuICAgICAgICAgICAgICAgICAoIG1ham9yID09PSBwcm9kdWN0aW9uVmVyc2lvbi5tYWpvciAmJiBtaW5vciA+IHByb2R1Y3Rpb25WZXJzaW9uLm1pbm9yICkgKSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIERvIGEgY2hlY2tvdXQgc28gd2UgY2FuIGRldGVybWluZSBzdXBwb3J0ZWQgYnJhbmRzXHJcbiAgICAgICAgICAgICAgY29uc3QgcGFja2FnZU9iamVjdCA9IEpTT04ucGFyc2UoIGF3YWl0IGdldEZpbGVBdEJyYW5jaCggcmVwbywgYnJhbmNoLCAncGFja2FnZS5qc29uJyApICk7XHJcbiAgICAgICAgICAgICAgY29uc3QgaW5jbHVkZXNQaGV0aW8gPSBwYWNrYWdlT2JqZWN0LnBoZXQgJiYgcGFja2FnZU9iamVjdC5waGV0LnN1cHBvcnRlZEJyYW5kcyAmJiBwYWNrYWdlT2JqZWN0LnBoZXQuc3VwcG9ydGVkQnJhbmRzLmluY2x1ZGVzKCAncGhldC1pbycgKTtcclxuXHJcbiAgICAgICAgICAgICAgY29uc3QgYnJhbmRzID0gW1xyXG4gICAgICAgICAgICAgICAgJ3BoZXQnLCAvLyBBc3N1bXB0aW9uIHRoYXQgdGhlcmUgaXMgbm8gcGhldC1pbyBicmFuZCBzaW0gdGhhdCBpc24ndCBhbHNvIHJlbGVhc2VkIHdpdGggcGhldCBicmFuZFxyXG4gICAgICAgICAgICAgICAgLi4uKCBpbmNsdWRlc1BoZXRpbyA/IFsgJ3BoZXQtaW8nIF0gOiBbXSApXHJcbiAgICAgICAgICAgICAgXTtcclxuXHJcbiAgICAgICAgICAgICAgaWYgKCAhcGFja2FnZU9iamVjdC5waGV0Lmlnbm9yZUZvckF1dG9tYXRlZE1haW50ZW5hbmNlUmVsZWFzZXMgKSB7XHJcbiAgICAgICAgICAgICAgICB1bnJlbGVhc2VkQnJhbmNoZXMucHVzaCggbmV3IFJlbGVhc2VCcmFuY2goIHJlcG8sIGJyYW5jaCwgYnJhbmRzLCBmYWxzZSApICk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBhbGxSZWxlYXNlQnJhbmNoZXMgPSBSZWxlYXNlQnJhbmNoLmNvbWJpbmVMaXN0cyggWyAuLi5waGV0QnJhbmNoZXMsIC4uLnBoZXRpb0JyYW5jaGVzLCAuLi51bnJlbGVhc2VkQnJhbmNoZXMgXSApO1xyXG5cclxuICAgICAgLy8gRkFNQiAyLjMtcGhldGlvIGtlZXBzIGVuZGluZyB1cCBpbiB0aGUgTVIgbGlzdCB3aGVuIHdlIGRvbid0IHdhbnQgaXQgdG8sIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvMTk1Ny5cclxuICAgICAgcmV0dXJuIGFsbFJlbGVhc2VCcmFuY2hlcy5maWx0ZXIoIHJiID0+ICEoIHJiLnJlcG8gPT09ICdmb3JjZXMtYW5kLW1vdGlvbi1iYXNpY3MnICYmIHJiLmJyYW5jaCA9PT0gJzIuMy1waGV0aW8nICkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbWJpbmVzIG11bHRpcGxlIG1hdGNoaW5nIFJlbGVhc2VCcmFuY2hlcyBpbnRvIG9uZSB3aGVyZSBhcHByb3ByaWF0ZSwgYW5kIHNvcnRzLiBGb3IgZXhhbXBsZSwgdHdvIFJlbGVhc2VCcmFuY2hlc1xyXG4gICAgICogb2YgdGhlIHNhbWUgcmVwbyBidXQgZm9yIGRpZmZlcmVudCBicmFuZHMgYXJlIGNvbWJpbmVkIGludG8gYSBzaW5nbGUgUmVsZWFzZUJyYW5jaCB3aXRoIG11bHRpcGxlIGJyYW5kcy5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxSZWxlYXNlQnJhbmNoPn0gc2ltQnJhbmNoZXNcclxuICAgICAqIEByZXR1cm5zIHtBcnJheS48UmVsZWFzZUJyYW5jaD59XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBjb21iaW5lTGlzdHMoIHNpbUJyYW5jaGVzICkge1xyXG4gICAgICBjb25zdCByZXN1bHRCcmFuY2hlcyA9IFtdO1xyXG5cclxuICAgICAgZm9yICggY29uc3Qgc2ltQnJhbmNoIG9mIHNpbUJyYW5jaGVzICkge1xyXG4gICAgICAgIGxldCBmb3VuZEJyYW5jaCA9IGZhbHNlO1xyXG4gICAgICAgIGZvciAoIGNvbnN0IHJlc3VsdEJyYW5jaCBvZiByZXN1bHRCcmFuY2hlcyApIHtcclxuICAgICAgICAgIGlmICggc2ltQnJhbmNoLnJlcG8gPT09IHJlc3VsdEJyYW5jaC5yZXBvICYmIHNpbUJyYW5jaC5icmFuY2ggPT09IHJlc3VsdEJyYW5jaC5icmFuY2ggKSB7XHJcbiAgICAgICAgICAgIGZvdW5kQnJhbmNoID0gdHJ1ZTtcclxuICAgICAgICAgICAgcmVzdWx0QnJhbmNoLmJyYW5kcyA9IFsgLi4ucmVzdWx0QnJhbmNoLmJyYW5kcywgLi4uc2ltQnJhbmNoLmJyYW5kcyBdO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCAhZm91bmRCcmFuY2ggKSB7XHJcbiAgICAgICAgICByZXN1bHRCcmFuY2hlcy5wdXNoKCBzaW1CcmFuY2ggKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJlc3VsdEJyYW5jaGVzLnNvcnQoICggYSwgYiApID0+IHtcclxuICAgICAgICBpZiAoIGEucmVwbyAhPT0gYi5yZXBvICkge1xyXG4gICAgICAgICAgcmV0dXJuIGEucmVwbyA8IGIucmVwbyA/IC0xIDogMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBhLmJyYW5jaCAhPT0gYi5icmFuY2ggKSB7XHJcbiAgICAgICAgICByZXR1cm4gYS5icmFuY2ggPCBiLmJyYW5jaCA/IC0xIDogMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIHJldHVybiByZXN1bHRCcmFuY2hlcztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBSZWxlYXNlQnJhbmNoO1xyXG59ICkoKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTUEsVUFBVSxHQUFHQyxPQUFPLENBQUUsY0FBZSxDQUFDO0FBQzVDLE1BQU1DLGtCQUFrQixHQUFHRCxPQUFPLENBQUUsc0JBQXVCLENBQUM7QUFDNUQsTUFBTUUsY0FBYyxHQUFHRixPQUFPLENBQUUsa0JBQW1CLENBQUM7QUFDcEQsTUFBTUcsWUFBWSxHQUFHSCxPQUFPLENBQUUsZ0JBQWlCLENBQUM7QUFDaEQsTUFBTUksY0FBYyxH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