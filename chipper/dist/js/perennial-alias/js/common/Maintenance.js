// Copyright 2018, University of Colorado Boulder

/**
 * The main persistent state-bearing object for maintenance releases. Can be loaded from or saved to a dedicated file.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const production = require('../grunt/production');
const rc = require('../grunt/rc');
const ChipperVersion = require('./ChipperVersion');
const ModifiedBranch = require('./ModifiedBranch');
const Patch = require('./Patch');
const ReleaseBranch = require('./ReleaseBranch');
const build = require('./build');
const checkoutMain = require('./checkoutMain');
const checkoutTarget = require('./checkoutTarget');
const execute = require('./execute');
const getActiveRepos = require('./getActiveRepos');
const getBranches = require('./getBranches');
const getBranchMap = require('./getBranchMap');
const getDependencies = require('./getDependencies');
const gitAdd = require('./gitAdd');
const gitCheckout = require('./gitCheckout');
const gitCherryPick = require('./gitCherryPick');
const gitCommit = require('./gitCommit');
const gitCreateBranch = require('./gitCreateBranch');
const gitIsClean = require('./gitIsClean');
const gitPull = require('./gitPull');
const gitPush = require('./gitPush');
const gitRevParse = require('./gitRevParse');
const assert = require('assert');
const asyncq = require('async-q'); // eslint-disable-line require-statement-match
const _ = require('lodash');
const fs = require('fs');
const repl = require('repl');
const winston = require('../../../../../../perennial-alias/node_modules/winston');
const gruntCommand = require('./gruntCommand');
const chipperSupportsOutputJSGruntTasks = require('./chipperSupportsOutputJSGruntTasks');

// constants
const MAINTENANCE_FILE = '.maintenance.json';

// const PUBLIC_FUNCTIONS = [
//   'addAllNeededPatches',
//   'addNeededPatch',
//   'addNeededPatches',
//   'addNeededPatchesAfter',
//   'addNeededPatchesBefore',
//   'addNeededPatchesBuildFilter',
//   'addNeededPatchReleaseBranch',
//   'addPatchSHA',
//   'applyPatches',
//   'buildAll',
//   'checkBranchStatus',
//   'checkoutBranch',
//   'createPatch',
//   'deployProduction',
//   'deployReleaseCandidates',
//   'list',
//   'listLinks',
//   'removeNeededPatch',
//   'removeNeededPatches',
//   'removeNeededPatchesAfter',
//   'removeNeededPatchesBefore',
//   'removePatch',
//   'removePatchSHA',
//   'reset',
//   'updateDependencies'
//   'getAllMaintenanceBranches'
// ];

/**
 * @typedef SerializedMaintenance - see Maintenance.serialize()
 * @property {Array.<Object>} patches
 * @property {Array.<Object>} modifiedBranches
 * @property {Array.<Object>} allReleaseBranches
 */

module.exports = function () {
  class Maintenance {
    /**
     * @public
     * @constructor
     *
     * @param {Array.<Patch>} [patches]
     * @param {Array.<ModifiedBranch>} [modifiedBranches]
     * @param  {Array.<ReleaseBranch>} [allReleaseBranches]
     */
    constructor(patches = [], modifiedBranches = [], allReleaseBranches = []) {
      assert(Array.isArray(patches));
      patches.forEach(patch => assert(patch instanceof Patch));
      assert(Array.isArray(modifiedBranches));
      modifiedBranches.forEach(branch => assert(branch instanceof ModifiedBranch));

      // @public {Array.<Patch>}
      this.patches = patches;

      // @public {Array.<ModifiedBranch>}
      this.modifiedBranches = modifiedBranches;

      // @public {Array.<ReleaseBranch>}
      this.allReleaseBranches = allReleaseBranches;
    }

    /**
     * Resets ALL the maintenance state to a default "blank" state.
     * @public
     * @param keepCachedReleaseBranches {boolean} - allReleaseBranches take a while to populate, and have little to do
     *                                              with the current MR, so optionally keep them in storage.
     *
     * CAUTION: This will remove any information about any ongoing/complete maintenance release from your
     * .maintenance.json. Generally this should be done before any new maintenance release.
     */
    static reset(keepCachedReleaseBranches = false) {
      console.log('Make sure to check on the active PhET-iO Deploy Status on phet.colorado.edu to ensure that the ' + 'right PhET-iO sims are included in this maintenance release.');
      const allReleaseBranches = [];
      if (keepCachedReleaseBranches) {
        const maintenance = Maintenance.load();
        allReleaseBranches.push(...maintenance.allReleaseBranches);
      }
      new Maintenance([], [], allReleaseBranches).save();
    }

    /**
     * Runs a number of checks through every release branch.
     * @public
     *
     * @param {function(ReleaseBranch):Promise.<boolean>} [filter] - Optional filter, release branches will be skipped
     *                                                               if this resolves to false
     * @returns {Promise}
     */
    static async checkBranchStatus(filter) {
      for (const repo of getActiveRepos()) {
        if (repo !== 'perennial' && !(await gitIsClean(repo))) {
          console.log(`Unclean repository: ${repo}, please resolve this and then run checkBranchStatus again`);
          return;
        }
      }
      const releaseBranches = await Maintenance.getMaintenanceBranches(filter);

      // Set up a cache of branchMaps so that we don't make multiple requests
      const branchMaps = {};
      const getBranchMapAsyncCallback = async repo => {
        if (!branchMaps[repo]) {
          branchMaps[repo] = await getBranchMap(repo);
        }
        return branchMaps[repo];
      };
      for (const releaseBranch of releaseBranches) {
        if (!filter || (await filter(releaseBranch))) {
          console.log(`${releaseBranch.repo} ${releaseBranch.branch}`);
          for (const line of await releaseBranch.getStatus(getBranchMapAsyncCallback)) {
            console.log(`  ${line}`);
          }
        } else {
          console.log(`${releaseBranch.repo} ${releaseBranch.branch} (skipping due to filter)`);
        }
      }
    }

    /**
     * Builds all release branches (so that the state of things can be checked). Puts in in perennial/build.
     * @public
     */
    static async buildAll() {
      const releaseBranches = await Maintenance.getMaintenanceBranches();
      const failed = [];
      for (const releaseBranch of releaseBranches) {
        console.log(`building ${releaseBranch.repo} ${releaseBranch.branch}`);
        try {
          await checkoutTarget(releaseBranch.repo, releaseBranch.branch, true); // include npm update
          await build(releaseBranch.repo, {
            brands: releaseBranch.brands
          });
          throw new Error('UNIMPLEMENTED, copy over');
        } catch (e) {
          failed.push(`${releaseBranch.repo} ${releaseBranch.brand}`);
        }
      }
      if (failed.length) {
        console.log(`Failed builds:\n${failed.join('\n')}`);
      } else {
        console.log('Builds complete');
      }
    }

    /**
     * Displays a listing of the current maintenance status.
     * @public
     *
     * @returns {Promise}
     */
    static async list() {
      const maintenance = Maintenance.load();

      // At the top so that the important items are right above your cursor after calling the function
      if (maintenance.allReleaseBranches.length > 0) {
        console.log(`Total recognized ReleaseBranches: ${maintenance.allReleaseBranches.length}`);
      }
      console.log('\nRelease Branches in MR:', maintenance.patches.length === 0 ? 'None' : '');
      for (const modifiedBranch of maintenance.modifiedBranches) {
        const count = maintenance.modifiedBranches.indexOf(modifiedBranch) + 1;
        console.log(`${count}. ${modifiedBranch.repo} ${modifiedBranch.branch} ${modifiedBranch.brands.join(',')}${modifiedBranch.releaseBranch.isReleased ? '' : ' (unreleased)'}`);
        if (modifiedBranch.deployedVersion) {
          console.log(`    deployed: ${modifiedBranch.deployedVersion.toString()}`);
        }
        if (modifiedBranch.neededPatches.length) {
          console.log(`    needs: ${modifiedBranch.neededPatches.map(patch => patch.name).join(',')}`);
        }
        if (modifiedBranch.pushedMessages.length) {
          console.log(`    pushedMessages: \n      ${modifiedBranch.pushedMessages.join('\n      ')}`);
        }
        if (modifiedBranch.pendingMessages.length) {
          console.log(`    pendingMessages: \n      ${modifiedBranch.pendingMessages.join('\n      ')}`);
        }
        if (Object.keys(modifiedBranch.changedDependencies).length > 0) {
          console.log('    deps:');
          for (const key of Object.keys(modifiedBranch.changedDependencies)) {
            console.log(`      ${key}: ${modifiedBranch.changedDependencies[key]}`);
          }
        }
      }
      console.log('\nMaintenance Patches in MR:', maintenance.patches.length === 0 ? 'None' : '');
      for (const patch of maintenance.patches) {
        const count = maintenance.patches.indexOf(patch) + 1;
        const indexAndSpacing = `${count}. ` + (count > 9 ? '' : ' ');
        console.log(`${indexAndSpacing}[${patch.name}]${patch.name !== patch.repo ? ` (${patch.repo})` : ''} ${patch.message}`);
        for (const sha of patch.shas) {
          console.log(`      ${sha}`);
        }
        for (const modifiedBranch of maintenance.modifiedBranches) {
          if (modifiedBranch.neededPatches.includes(patch)) {
            console.log(`        ${modifiedBranch.repo} ${modifiedBranch.branch} ${modifiedBranch.brands.join(',')}`);
          }
        }
      }
    }

    /**
     * Shows any required testing links for the simulations.
     * @public
     *
     * @param {function(ModifiedBranch):boolean} [filter] - Control which branches are shown
     */
    static async listLinks(filter = () => true) {
      const maintenance = Maintenance.load();
      const deployedBranches = maintenance.modifiedBranches.filter(modifiedBranch => !!modifiedBranch.deployedVersion && filter(modifiedBranch));
      const productionBranches = deployedBranches.filter(modifiedBranch => modifiedBranch.deployedVersion.testType === null);
      const releaseCandidateBranches = deployedBranches.filter(modifiedBranch => modifiedBranch.deployedVersion.testType === 'rc');
      if (productionBranches.length) {
        console.log('\nProduction links\n');
        for (const modifiedBranch of productionBranches) {
          const links = await modifiedBranch.getDeployedLinkLines();
          for (const link of links) {
            console.log(link);
          }
        }
      }
      if (releaseCandidateBranches.length) {
        console.log('\nRelease Candidate links\n');
        for (const modifiedBranch of releaseCandidateBranches) {
          const links = await modifiedBranch.getDeployedLinkLines();
          for (const link of links) {
            console.log(link);
          }
        }
      }
    }

    /**
     * Creates an issue to note patches on all unreleased branches that include a pushed message.
     * @public
     *
     * @param {string} [additionalNotes]
     */
    static async createUnreleasedIssues(additionalNotes = '') {
      const maintenance = Maintenance.load();
      for (const modifiedBranch of maintenance.modifiedBranches) {
        if (!modifiedBranch.releaseBranch.isReleased && modifiedBranch.pushedMessages.length > 0) {
          console.log(`Creating issue for ${modifiedBranch.releaseBranch.toString()}`);
          await modifiedBranch.createUnreleasedIssue(additionalNotes);
        }
      }
      console.log('Finished creating unreleased issues');
    }

    /**
     * Creates a patch
     * @public
     *
     * @param {string} repo
     * @param {string} message
     * @param {string} [patchName] - If no name is provided, the repo string will be used.
     * @returns {Promise}
     */
    static async createPatch(repo, message, patchName) {
      const maintenance = Maintenance.load();
      patchName = patchName || repo;
      for (const patch of maintenance.patches) {
        if (patch.name === patchName) {
          throw new Error('Multiple patches with the same name are not concurrently supported');
        }
      }
      maintenance.patches.push(new Patch(repo, patchName, message));
      maintenance.save();
      console.log(`Created patch for ${repo} with message: ${message}`);
    }

    /**
     * Removes a patch
     * @public
     *
     * @param {string} patchName
     * @returns {Promise}
     */
    static async removePatch(patchName) {
      const maintenance = Maintenance.load();
      const patch = maintenance.findPatch(patchName);
      for (const branch of maintenance.modifiedBranches) {
        if (branch.neededPatches.includes(patch)) {
          throw new Error('Patch is marked as needed by at least one branch');
        }
      }
      maintenance.patches.splice(maintenance.patches.indexOf(patch), 1);
      maintenance.save();
      console.log(`Removed patch for ${patchName}`);
    }

    /**
     * Adds a particular SHA (to cherry-pick) to a patch.
     * @public
     *
     * @param {string} patchName
     * @param {string} [sha]
     * @returns {Promise}
     */
    static async addPatchSHA(patchName, sha) {
      const maintenance = Maintenance.load();
      const patch = maintenance.findPatch(patchName);
      if (!sha) {
        sha = await gitRevParse(patch.repo, 'HEAD');
        console.log(`SHA not provided, detecting SHA: ${sha}`);
      }
      patch.shas.push(sha);
      maintenance.save();
      console.log(`Added SHA ${sha} to patch ${patchName}`);
    }

    /**
     * Removes a particular SHA (to cherry-pick) from a patch.
     * @public
     *
     * @param {string} patchName
     * @param {string} sha
     * @returns {Promise}
     */
    static async removePatchSHA(patchName, sha) {
      const maintenance = Maintenance.load();
      const patch = maintenance.findPatch(patchName);
      const index = patch.shas.indexOf(sha);
      assert(index >= 0, 'SHA not found');
      patch.shas.splice(index, 1);
      maintenance.save();
      console.log(`Removed SHA ${sha} from patch ${patchName}`);
    }

    /**
     * Removes all patch SHAs for a particular patch.
     * @public
     *
     * @param {string} patchName
     * @returns {Promise}
     */
    static async removeAllPatchSHAs(patchName) {
      const maintenance = Maintenance.load();
      const patch = maintenance.findPatch(patchName);
      for (const sha of patch.shas) {
        console.log(`Removing SHA ${sha} from patch ${patchName}`);
      }
      patch.shas = [];
      maintenance.save();
    }

    /**
     * Adds a needed patch to a given modified branch.
     * @public
     *
     * @param {string} repo
     * @param {string} branch
     * @param {string} patchName
     */
    static async addNeededPatch(repo, branch, patchName) {
      const maintenance = Maintenance.load();
      const patch = maintenance.findPatch(patchName);
      const modifiedBranch = await maintenance.ensureModifiedBranch(repo, branch);
      modifiedBranch.neededPatches.push(patch);
      maintenance.save();
      console.log(`Added patch ${patchName} as needed for ${repo} ${branch}`);
    }

    /**
     * Adds a needed patch to a given release branch
     * @public
     *
     * @param {ReleaseBranch} releaseBranch
     * @param {string} patchName
     */
    static async addNeededPatchReleaseBranch(releaseBranch, patchName) {
      const maintenance = Maintenance.load();
      const patch = maintenance.findPatch(patchName);
      const modifiedBranch = new ModifiedBranch(releaseBranch);
      maintenance.modifiedBranches.push(modifiedBranch);
      modifiedBranch.neededPatches.push(patch);
      maintenance.save();
      console.log(`Added patch ${patchName} as needed for ${releaseBranch.repo} ${releaseBranch.branch}`);
    }

    /**
     * Adds a needed patch to whatever subset of release branches match the filter.
     * @public
     *
     * @param {string} patchName
     * @param {function(ReleaseBranch):Promise.<boolean>} filter
     */
    static async addNeededPatches(patchName, filter) {
      // getMaintenanceBranches needs to cache its branches and maintenance.save() them, so do it before loading
      // Maintenance for this function.
      const releaseBranches = await Maintenance.getMaintenanceBranches();
      const maintenance = Maintenance.load();
      const patch = maintenance.findPatch(patchName);
      let count = 0;
      for (const releaseBranch of releaseBranches) {
        const needsPatch = await filter(releaseBranch);
        if (!needsPatch) {
          console.log(`  skipping ${releaseBranch.repo} ${releaseBranch.branch}`);
          continue;
        }
        const modifiedBranch = await maintenance.ensureModifiedBranch(releaseBranch.repo, releaseBranch.branch, false, releaseBranches);
        if (!modifiedBranch.neededPatches.includes(patch)) {
          modifiedBranch.neededPatches.push(patch);
          console.log(`Added needed patch ${patchName} to ${releaseBranch.repo} ${releaseBranch.branch}`);
          count++;
          maintenance.save(); // save here in case a future failure would "revert" things
        } else {
          console.log(`Patch ${patchName} already included in ${releaseBranch.repo} ${releaseBranch.branch}`);
        }
      }
      console.log(`Added ${count} releaseBranches to patch: ${patchName}`);
      maintenance.save();
    }

    /**
     * Adds a needed patch to all release branches.
     * @public
     *
     * @param {string} patchName
     */
    static async addAllNeededPatches(patchName) {
      await Maintenance.addNeededPatches(patchName, async () => true);
    }

    /**
     * Adds a needed patch to all release branches that do NOT include the given commit on the repo
     * @public
     *
     * @param {string} patchName
     * @param {string} sha
     */
    static async addNeededPatchesBefore(patchName, sha) {
      const maintenance = Maintenance.load();
      const patch = maintenance.findPatch(patchName);
      await Maintenance.addNeededPatches(patchName, async releaseBranch => {
        return releaseBranch.isMissingSHA(patch.repo, sha);
      });
    }

    /**
     * Adds a needed patch to all release branches that DO include the given commit on the repo
     * @public
     *
     * @param {string} patchName
     * @param {string} sha
     */
    static async addNeededPatchesAfter(patchName, sha) {
      const maintenance = Maintenance.load();
      const patch = maintenance.findPatch(patchName);
      await Maintenance.addNeededPatches(patchName, async releaseBranch => {
        return releaseBranch.includesSHA(patch.repo, sha);
      });
    }

    /**
     * Adds a needed patch to all release branches that satisfy the given filter( releaseBranch, builtFileString )
     * where it builds the simulation with the defaults (brand=phet) and provides it as a string.
     * @public
     *
     * @param {string} patchName
     * @param {function(ReleaseBranch, builtFile:string): Promise.<boolean>} filter
     */
    static async addNeededPatchesBuildFilter(patchName, filter) {
      await Maintenance.addNeededPatches(patchName, async releaseBranch => {
        await checkoutTarget(releaseBranch.repo, releaseBranch.branch, true);
        await gitPull(releaseBranch.repo);
        await build(releaseBranch.repo);
        const chipperVersion = ChipperVersion.getFromRepository();
        let filename;
        if (chipperVersion.major !== 0) {
          filename = `../${releaseBranch.repo}/build/phet/${releaseBranch.repo}_en_phet.html`;
        } else {
          filename = `../${releaseBranch.repo}/build/${releaseBranch.repo}_en.html`;
        }
        return filter(releaseBranch, fs.readFileSync(filename, 'utf8'));
      });
    }

    /**
     * Removes a needed patch from a given modified branch.
     * @public
     *
     * @param {string} repo
     * @param {string} branch
     * @param {string} patchName
     */
    static async removeNeededPatch(repo, branch, patchName) {
      const maintenance = Maintenance.load();
      const patch = maintenance.findPatch(patchName);
      const modifiedBranch = await maintenance.ensureModifiedBranch(repo, branch);
      const index = modifiedBranch.neededPatches.indexOf(patch);
      assert(index >= 0, 'Could not find needed patch on the modified branch');
      modifiedBranch.neededPatches.splice(index, 1);
      maintenance.tryRemovingModifiedBranch(modifiedBranch);
      maintenance.save();
      console.log(`Removed patch ${patchName} from ${repo} ${branch}`);
    }

    /**
     * Removes a needed patch from whatever subset of (current) release branches match the filter.
     * @public
     *
     * @param {string} patchName
     * @param {function(ReleaseBranch): Promise.<boolean>} filter
     */
    static async removeNeededPatches(patchName, filter) {
      const maintenance = Maintenance.load();
      const patch = maintenance.findPatch(patchName);
      let count = 0;
      for (const modifiedBranch of maintenance.modifiedBranches) {
        const needsRemoval = await filter(modifiedBranch.releaseBranch);
        if (!needsRemoval) {
          console.log(`  skipping ${modifiedBranch.repo} ${modifiedBranch.branch}`);
          continue;
        }

        // Check if there's actually something to remove
        const index = modifiedBranch.neededPatches.indexOf(patch);
        if (index < 0) {
          continue;
        }
        modifiedBranch.neededPatches.splice(index, 1);
        maintenance.tryRemovingModifiedBranch(modifiedBranch);
        count++;
        console.log(`Removed needed patch ${patchName} from ${modifiedBranch.repo} ${modifiedBranch.branch}`);
      }
      console.log(`Removed ${count} releaseBranches from patch: ${patchName}`);
      maintenance.save();
    }

    /**
     * Removes a needed patch from all release branches that do NOT include the given commit on the repo
     * @public
     *
     * @param {string} patchName
     * @param {string} sha
     */
    static async removeNeededPatchesBefore(patchName, sha) {
      const maintenance = Maintenance.load();
      const patch = maintenance.findPatch(patchName);
      await Maintenance.removeNeededPatches(patchName, async releaseBranch => {
        return releaseBranch.isMissingSHA(patch.repo, sha);
      });
    }

    /**
     * Removes a needed patch from all release branches that DO include the given commit on the repo
     * @public
     *
     * @param {string} patchName
     * @param {string} sha
     */
    static async removeNeededPatchesAfter(patchName, sha) {
      const maintenance = Maintenance.load();
      const patch = maintenance.findPatch(patchName);
      await Maintenance.removeNeededPatches(patchName, async releaseBranch => {
        return releaseBranch.includesSHA(patch.repo, sha);
      });
    }

    /**
     * Helper for adding patches based on specific patterns, e.g.:
     * Maintenance.addNeededPatches( 'phetmarks', Maintenance.singleFileReleaseBranchFilter( '../phetmarks/js/phetmarks.ts' ), content => content.includes( 'data/wrappers' ) );
     * @public
     *
     * @param {string} file
     * @param {function(string):boolean}
     * @returns {function}
     */
    static singleFileReleaseBranchFilter(file, predicate) {
      return async releaseBranch => {
        await releaseBranch.checkout(false);
        if (fs.existsSync(file)) {
          const contents = fs.readFileSync(file, 'utf-8');
          return predicate(contents);
        }
        return false;
      };
    }

    /**
     * Checks out a specific Release Branch (using local commit data as necessary).
     * @public
     *
     * @param {string} repo
     * @param {string} branch
     * @param {boolean} outputJS=false - if true, once checked out this will also run `grunt output-js-project`
     */
    static async checkoutBranch(repo, branch, outputJS = false) {
      const maintenance = Maintenance.load();
      const modifiedBranch = await maintenance.ensureModifiedBranch(repo, branch, true);
      await modifiedBranch.checkout();
      if (outputJS && chipperSupportsOutputJSGruntTasks()) {
        console.log('Running output-js-project');

        // We might not be able to run this command!
        await execute(gruntCommand, ['output-js-project'], `../${repo}`, {
          errors: 'resolve'
        });
      }

      // No need to save, shouldn't be changing things
      console.log(`Checked out ${repo} ${branch}`);
    }

    /**
     * Attempts to apply patches to the modified branches that are marked as needed.
     * @public
     */
    static async applyPatches() {
      const maintenance = Maintenance.load();
      let numApplied = 0;
      for (const modifiedBranch of maintenance.modifiedBranches) {
        if (modifiedBranch.neededPatches.length === 0) {
          continue;
        }
        const repo = modifiedBranch.repo;
        const branch = modifiedBranch.branch;

        // Defensive copy, since we modify it during iteration
        for (const patch of modifiedBranch.neededPatches.slice()) {
          if (patch.shas.length === 0) {
            continue;
          }
          const patchRepo = patch.repo;
          try {
            // Checkout whatever the latest patched SHA is (if we've patched it)
            if (modifiedBranch.changedDependencies[patchRepo]) {
              await gitCheckout(patchRepo, modifiedBranch.changedDependencies[patchRepo]);
            } else {
              // Look up the SHA to check out
              await gitCheckout(repo, branch);
              await gitPull(repo);
              const dependencies = await getDependencies(repo);
              const sha = dependencies[patchRepo].sha;
              await gitCheckout(repo, 'main');

              // Then check it out
              await gitCheckout(patchRepo, sha);
            }
            console.log(`Checked out ${patchRepo} SHA for ${repo} ${branch}`);
            for (const sha of patch.shas) {
              // If the sha doesn't exist in the repo, then give a specific error for that.
              const hasSha = (await execute('git', ['cat-file', '-e', sha], `../${patchRepo}`, {
                errors: 'resolve'
              })).code === 0;
              if (!hasSha) {
                throw new Error(`SHA not found in ${patchRepo}: ${sha}`);
              }
              const cherryPickSuccess = await gitCherryPick(patchRepo, sha);
              if (cherryPickSuccess) {
                const currentSHA = await gitRevParse(patchRepo, 'HEAD');
                console.log(`Cherry-pick success for ${sha}, result is ${currentSHA}`);
                modifiedBranch.changedDependencies[patchRepo] = currentSHA;
                modifiedBranch.neededPatches.splice(modifiedBranch.neededPatches.indexOf(patch), 1);
                numApplied++;

                // Don't include duplicate messages, since multiple patches might be for a single issue
                if (!modifiedBranch.pendingMessages.includes(patch.message)) {
                  modifiedBranch.pendingMessages.push(patch.message);
                }
                break;
              } else {
                console.log(`Could not cherry-pick ${sha}`);
              }
            }
          } catch (e) {
            maintenance.save();
            throw new Error(`Failure applying patch ${patchRepo} to ${repo} ${branch}: ${e}`);
          }
        }
        await gitCheckout(modifiedBranch.repo, 'main');
      }
      maintenance.save();
      console.log(`${numApplied} patches applied`);
    }

    /**
     * Pushes local changes up to GitHub.
     * @public
     *
     * @param {function(ModifiedBranch):Promise.<boolean>} [filter] - Optional filter, modified branches will be skipped
     *                                                                if this resolves to false
     */
    static async updateDependencies(filter) {
      const maintenance = Maintenance.load();
      for (const modifiedBranch of maintenance.modifiedBranches) {
        const changedRepos = Object.keys(modifiedBranch.changedDependencies);
        if (changedRepos.length === 0) {
          continue;
        }
        if (filter && !(await filter(modifiedBranch))) {
          console.log(`Skipping dependency update for ${modifiedBranch.repo} ${modifiedBranch.branch}`);
          continue;
        }
        try {
          // No NPM needed
          await checkoutTarget(modifiedBranch.repo, modifiedBranch.branch, false);
          console.log(`Checked out ${modifiedBranch.repo} ${modifiedBranch.branch}`);
          const dependenciesJSONFile = `../${modifiedBranch.repo}/dependencies.json`;
          const dependenciesJSON = JSON.parse(fs.readFileSync(dependenciesJSONFile, 'utf-8'));

          // Modify the "self" in the dependencies.json as expected
          dependenciesJSON[modifiedBranch.repo].sha = await gitRevParse(modifiedBranch.repo, modifiedBranch.branch);
          for (const dependency of changedRepos) {
            const dependencyBranch = modifiedBranch.dependencyBranch;
            const branches = await getBranches(dependency);
            const sha = modifiedBranch.changedDependencies[dependency];
            dependenciesJSON[dependency].sha = sha;
            if (branches.includes(dependencyBranch)) {
              console.log(`Branch ${dependencyBranch} already exists in ${dependency}`);
              await gitCheckout(dependency, dependencyBranch);
              await gitPull(dependency);
              const currentSHA = await gitRevParse(dependency, 'HEAD');
              if (sha !== currentSHA) {
                console.log(`Attempting to (hopefully fast-forward) merge ${sha}`);
                await execute('git', ['merge', sha], `../${dependency}`);
                await gitPush(dependency, dependencyBranch);
              }
            } else {
              console.log(`Branch ${dependencyBranch} does not exist in ${dependency}, creating.`);
              await gitCheckout(dependency, sha);
              await gitCreateBranch(dependency, dependencyBranch);
              await gitPush(dependency, dependencyBranch);
            }
            delete modifiedBranch.changedDependencies[dependency];
            modifiedBranch.deployedVersion = null;
            maintenance.save(); // save here in case a future failure would "revert" things
          }
          const message = modifiedBranch.pendingMessages.join(' and ');
          fs.writeFileSync(dependenciesJSONFile, JSON.stringify(dependenciesJSON, null, 2));
          await gitAdd(modifiedBranch.repo, 'dependencies.json');
          await gitCommit(modifiedBranch.repo, `updated dependencies.json for ${message}`);
          await gitPush(modifiedBranch.repo, modifiedBranch.branch);

          // Move messages from pending to pushed
          for (const message of modifiedBranch.pendingMessages) {
            if (!modifiedBranch.pushedMessages.includes(message)) {
              modifiedBranch.pushedMessages.push(message);
            }
          }
          modifiedBranch.pendingMessages = [];
          maintenance.save(); // save here in case a future failure would "revert" things

          await checkoutMain(modifiedBranch.repo, false);
        } catch (e) {
          maintenance.save();
          throw new Error(`Failure updating dependencies for ${modifiedBranch.repo} to ${modifiedBranch.branch}: ${e}`);
        }
      }
      maintenance.save();
      console.log('Dependencies updated');
    }

    /**
     * Deploys RC versions of the modified branches that need it.
     * @public
     *
     * @param {function(ModifiedBranch):Promise.<boolean>} [filter] - Optional filter, modified branches will be skipped
     *                                                                if this resolves to false
     */
    static async deployReleaseCandidates(filter) {
      const maintenance = Maintenance.load();
      for (const modifiedBranch of maintenance.modifiedBranches) {
        if (!modifiedBranch.isReadyForReleaseCandidate || !modifiedBranch.releaseBranch.isReleased) {
          continue;
        }
        console.log('================================================');
        if (filter && !(await filter(modifiedBranch))) {
          console.log(`Skipping RC deploy for ${modifiedBranch.repo} ${modifiedBranch.branch}`);
          continue;
        }
        try {
          console.log(`Running RC deploy for ${modifiedBranch.repo} ${modifiedBranch.branch}`);
          const version = await rc(modifiedBranch.repo, modifiedBranch.branch, modifiedBranch.brands, true, modifiedBranch.pushedMessages.join(', '));
          modifiedBranch.deployedVersion = version;
          maintenance.save(); // save here in case a future failure would "revert" things
        } catch (e) {
          maintenance.save();
          throw new Error(`Failure with RC deploy for ${modifiedBranch.repo} to ${modifiedBranch.branch}: ${e}`);
        }
      }
      maintenance.save();
      console.log('RC versions deployed');
    }

    /**
     * Deploys production versions of the modified branches that need it.
     * @public
     *
     * @param {function(ModifiedBranch):Promise.<boolean>} [filter] - Optional filter, modified branches will be skipped
     *                                                                if this resolves to false
     */
    static async deployProduction(filter) {
      const maintenance = Maintenance.load();
      for (const modifiedBranch of maintenance.modifiedBranches) {
        if (!modifiedBranch.isReadyForProduction || !modifiedBranch.releaseBranch.isReleased) {
          continue;
        }
        if (filter && !(await filter(modifiedBranch))) {
          console.log(`Skipping production deploy for ${modifiedBranch.repo} ${modifiedBranch.branch}`);
          continue;
        }
        try {
          console.log(`Running production deploy for ${modifiedBranch.repo} ${modifiedBranch.branch}`);
          const version = await production(modifiedBranch.repo, modifiedBranch.branch, modifiedBranch.brands, true, false, modifiedBranch.pushedMessages.join(', '));
          modifiedBranch.deployedVersion = version;
          modifiedBranch.pushedMessages = [];
          maintenance.save(); // save here in case a future failure would "revert" things
        } catch (e) {
          maintenance.save();
          throw new Error(`Failure with production deploy for ${modifiedBranch.repo} to ${modifiedBranch.branch}: ${e}`);
        }
      }
      maintenance.save();
      console.log('production versions deployed');
    }

    /**
     * Create a separate directory for each release branch. This does not interface with the saved maintenance state at
     * all, and instead just looks at the committed dependencies.json when updating.
     * @public
     *
     * @param {function(ReleaseBranch):Promise.<boolean>} [filter] - Optional filter, release branches will be skipped
     *                                                               if this resolves to false
     * @param {Object} [options] - build=false - to opt out of building, set to false.
     *                             transpile=false - to opt out of transpiling, set to false.
     */
    static async updateCheckouts(filter, options) {
      options = _.merge({
        concurrent: 5,
        build: true,
        transpile: true,
        buildOptions: {
          lint: true
        }
      }, options);
      console.log(`Updating checkouts (running in parallel with ${options.concurrent} threads)`);
      const releaseBranches = await Maintenance.getMaintenanceBranches();
      const filteredBranches = [];

      // Run all filtering in a step before the parallel step. This way the filter has full access to repos and git commands without race conditions, https://github.com/phetsims/perennial/issues/341
      for (const releaseBranch of releaseBranches) {
        if (!filter || (await filter(releaseBranch))) {
          filteredBranches.push(releaseBranch);
        }
      }
      console.log(`Filter applied. Updating ${filteredBranches.length}:`, filteredBranches.map(x => x.toString()));
      const asyncFunctions = filteredBranches.map(releaseBranch => async () => {
        console.log('Beginning: ', releaseBranch.toString());
        try {
          await releaseBranch.updateCheckout();
          options.transpile && (await releaseBranch.transpile());
          try {
            options.build && (await releaseBranch.build(options.buildOptions));
          } catch (e) {
            console.log(`failed to build ${releaseBranch.toString()}: ${e}`);
          }
        } catch (e) {
          console.log(`failed to update releaseBranch ${releaseBranch.toString()}: ${e}`);
        }
      });
      await asyncq.parallelLimit(asyncFunctions, options.concurrent);
      console.log('Done');
    }

    /**
     * @public
     *
     * @param {function(ReleaseBranch):Promise.<boolean>} [filter] - Optional filter, release branches will be skipped
     *                                                               if this resolves to false
     */
    static async checkUnbuiltCheckouts(filter) {
      console.log('Checking unbuilt checkouts');
      const releaseBranches = await Maintenance.getMaintenanceBranches();
      for (const releaseBranch of releaseBranches) {
        if (!filter || (await filter(releaseBranch))) {
          console.log(releaseBranch.toString());
          const unbuiltResult = await releaseBranch.checkUnbuilt();
          if (unbuiltResult) {
            console.log(unbuiltResult);
          }
        }
      }
    }

    /**
     * @public
     *
     * @param {function(ReleaseBranch):Promise.<boolean>} [filter] - Optional filter, release branches will be skipped
     *                                                               if this resolves to false
     */
    static async checkBuiltCheckouts(filter) {
      console.log('Checking built checkouts');
      const releaseBranches = await Maintenance.getMaintenanceBranches();
      for (const releaseBranch of releaseBranches) {
        if (!filter || (await filter(releaseBranch))) {
          console.log(releaseBranch.toString());
          const builtResult = await releaseBranch.checkBuilt();
          if (builtResult) {
            console.log(builtResult);
          }
        }
      }
    }

    /**
     * Redeploys production versions of all release branches (or those matching a specific filter
     * @public
     *
     * NOTE: This does not use the current maintenance state!
     *
     * @param {string} message - Generally an issue to reference
     * @param {function(ReleaseBranch):Promise.<boolean>} [filter] - Optional filter, release branches will be skipped
     *                                                                if this resolves to false
     */
    static async redeployAllProduction(message, filter) {
      // Ignore unreleased branches!
      const releaseBranches = await Maintenance.getMaintenanceBranches(() => true, false);
      for (const releaseBranch of releaseBranches) {
        if (filter && !(await filter(releaseBranch))) {
          continue;
        }
        console.log(releaseBranch.toString());
        await rc(releaseBranch.repo, releaseBranch.branch, releaseBranch.brands, true, message);
        await production(releaseBranch.repo, releaseBranch.branch, releaseBranch.brands, true, false, message);
      }
      console.log('Finished redeploying');
    }

    /**
     * The prototype copy of Maintenance.getMaintenanceBranches(), in which we will mutate the class's allReleaseBranches
     * to ensure there is no save/load order dependency problems.
     *
     * @public
     * @param {function(ReleaseBranch):boolean} filterRepo - return false if the ReleaseBranch should be excluded.
     * @param {function} checkUnreleasedBranches - If false, will skip checking for unreleased branches. This checking needs all repos checked out
     * @param {boolean} forceCacheBreak=false - true if you want to force a recalculation of all ReleaseBranches
     * @returns {Promise.<Array.<ReleaseBranch>>}
     * @rejects {ExecuteError}
     */
    async getMaintenanceBranches(filterRepo = () => true, checkUnreleasedBranches = true, forceCacheBreak = false) {
      return Maintenance.getMaintenanceBranches(filterRepo, checkUnreleasedBranches, forceCacheBreak, this);
    }

    /**
     * @public
     * @param {function(ReleaseBranch):boolean} filterRepo - return false if the ReleaseBranch should be excluded.
     * @param {function} checkUnreleasedBranches - If false, will skip checking for unreleased branches. This checking needs all repos checked out
     * @param {boolean} forceCacheBreak=false - true if you want to force a recalculation of all ReleaseBranches
     @param {Maintenance} maintenance=Maintenance.load() - by default load from saved file the current maintenance instance.
     * @returns {Promise.<Array.<ReleaseBranch>>}
     * @rejects {ExecuteError}
     */
    static async getMaintenanceBranches(filterRepo = () => true, checkUnreleasedBranches = true, forceCacheBreak = false, maintenance = Maintenance.load()) {
      const releaseBranches = await Maintenance.loadAllMaintenanceBranches(forceCacheBreak, maintenance);
      return releaseBranches.filter(releaseBranch => {
        if (!checkUnreleasedBranches && !releaseBranch.isReleased) {
          return false;
        }
        return filterRepo(releaseBranch);
      });
    }

    /**
     * Loads every potential ReleaseBranch (published phet and phet-io brands, as well as unreleased branches), and
     * saves it to the maintenance state.
     * @public
     *
     * Call this with true to break the cache and force a recalculation of all ReleaseBranches
     *
     * @param {boolean} forceCacheBreak=false - true if you want to force a recalculation of all ReleaseBranches
     * @param {Maintenance} maintenance=Maintenance.load() - by default load from saved file the current maintenance instance.     * @returns {Promise<ReleaseBranch[]>}
     */
    static async loadAllMaintenanceBranches(forceCacheBreak = false, maintenance = Maintenance.load()) {
      let releaseBranches = null;
      if (maintenance.allReleaseBranches.length > 0 && !forceCacheBreak) {
        assert(maintenance.allReleaseBranches[0] instanceof ReleaseBranch, 'deserialization check');
        releaseBranches = maintenance.allReleaseBranches;
      } else {
        // cache miss
        releaseBranches = await ReleaseBranch.getAllMaintenanceBranches();
        maintenance.allReleaseBranches = releaseBranches;
        maintenance.save();
      }
      return releaseBranches;
    }

    /**
     * Convert into a plain JS object meant for JSON serialization.
     * @public
     *
     * @returns {SerializedMaintenance} - see Patch.serialize() and ModifiedBranch.serialize()
     */
    serialize() {
      return {
        patches: this.patches.map(patch => patch.serialize()),
        modifiedBranches: this.modifiedBranches.map(modifiedBranch => modifiedBranch.serialize()),
        allReleaseBranches: this.allReleaseBranches.map(releaseBranch => releaseBranch.serialize())
      };
    }

    /**
     * Takes a serialized form of the Maintenance and returns an actual instance.
     * @public
     *
     * @param {SerializedMaintenance} - see Maintenance.serialize()
     * @returns {Maintenance}
     */
    static deserialize({
      patches = [],
      modifiedBranches = [],
      allReleaseBranches = []
    }) {
      // Pass in patch references to branch deserialization
      const deserializedPatches = patches.map(Patch.deserialize);
      modifiedBranches = modifiedBranches.map(modifiedBranch => ModifiedBranch.deserialize(modifiedBranch, deserializedPatches));
      modifiedBranches.sort((a, b) => {
        if (a.repo !== b.repo) {
          return a.repo < b.repo ? -1 : 1;
        }
        if (a.branch !== b.branch) {
          return a.branch < b.branch ? -1 : 1;
        }
        return 0;
      });
      const deserializedReleaseBranches = allReleaseBranches.map(releaseBranch => ReleaseBranch.deserialize(releaseBranch));
      return new Maintenance(deserializedPatches, modifiedBranches, deserializedReleaseBranches);
    }

    /**
     * Saves the state of this object into the maintenance file.
     * @public
     */
    save() {
      return fs.writeFileSync(MAINTENANCE_FILE, JSON.stringify(this.serialize(), null, 2));
    }

    /**
     * Loads a new Maintenance object (if possible) from the maintenance file.
     * @public
     *
     * @returns {Maintenance}
     */
    static load() {
      if (fs.existsSync(MAINTENANCE_FILE)) {
        return Maintenance.deserialize(JSON.parse(fs.readFileSync(MAINTENANCE_FILE, 'utf8')));
      } else {
        return new Maintenance();
      }
    }

    /**
     * Starts a command-line REPL with features loaded.
     * @public
     *
     * @returns {Promise}
     */
    static startREPL() {
      return new Promise((resolve, reject) => {
        winston.default.transports.console.level = 'error';
        const session = repl.start({
          prompt: 'maintenance> ',
          useColors: true,
          replMode: repl.REPL_MODE_STRICT,
          ignoreUndefined: true
        });

        // Wait for promises before being ready for input
        const nodeEval = session.eval;
        session.eval = async (cmd, context, filename, callback) => {
          nodeEval(cmd, context, filename, (_, result) => {
            if (result instanceof Promise) {
              result.then(val => callback(_, val)).catch(e => {
                if (e.stack) {
                  console.error(`Maintenance task failed:\n${e.stack}\nFull Error details:\n${JSON.stringify(e, null, 2)}`);
                } else if (typeof e === 'string') {
                  console.error(`Maintenance task failed: ${e}`);
                } else {
                  console.error(`Maintenance task failed with unknown error: ${JSON.stringify(e, null, 2)}`);
                }
              });
            } else {
              callback(_, result);
            }
          });
        };

        // Only autocomplete "public" API functions for Maintenance.
        // const nodeCompleter = session.completer;
        // session.completer = function( text, cb ) {
        //   nodeCompleter( text, ( _, [ completions, completed ] ) => {
        //     const match = completed.match( /^Maintenance\.(\w*)+/ );
        //     if ( match ) {
        //       const funcStart = match[ 1 ];
        //       cb( null, [ PUBLIC_FUNCTIONS.filter( f => f.startsWith( funcStart ) ).map( f => `Maintenance.${f}` ), completed ] );
        //     }
        //     else {
        //       cb( null, [ completions, completed ] );
        //     }
        //   } );
        // };

        // Allow controlling verbosity
        Object.defineProperty(global, 'verbose', {
          get() {
            return winston.default.transports.console.level === 'info';
          },
          set(value) {
            winston.default.transports.console.level = value ? 'info' : 'error';
          }
        });
        session.context.Maintenance = Maintenance;
        session.context.m = Maintenance;
        session.context.M = Maintenance;
        session.context.ReleaseBranch = ReleaseBranch;
        session.context.rb = ReleaseBranch;
        session.on('exit', resolve);
      });
    }

    /**
     * Looks up a patch by its name.
     * @public
     *
     * @param {string} patchName
     * @returns {Patch}
     */
    findPatch(patchName) {
      const patch = this.patches.find(p => p.name === patchName);
      assert(patch, `Patch not found for ${patchName}`);
      return patch;
    }

    /**
     * Looks up (or adds) a ModifiedBranch by its identifying information.
     * @private
     *
     * @param {string} repo
     * @param {string} branch
     * @param {boolean} [errorIfMissing]
     * @param {Array.<ReleaseBranch>} [releaseBranches] - If provided, it will speed up the process
     * @returns {Promise.<ModifiedBranch>}
     */
    async ensureModifiedBranch(repo, branch, errorIfMissing = false, releaseBranches = null) {
      let modifiedBranch = this.modifiedBranches.find(modifiedBranch => modifiedBranch.repo === repo && modifiedBranch.branch === branch);
      if (!modifiedBranch) {
        if (errorIfMissing) {
          throw new Error(`Could not find a tracked modified branch for ${repo} ${branch}`);
        }

        // Use the instance version of getMaintenanceBranches to make sure that this Maintenance instance is updated with new ReleaseBranches.
        releaseBranches = releaseBranches || (await this.getMaintenanceBranches(releaseBranch => releaseBranch.repo === repo));
        const releaseBranch = releaseBranches.find(release => release.repo === repo && release.branch === branch);
        assert(releaseBranch, `Could not find a release branch for repo=${repo} branch=${branch}`);
        modifiedBranch = new ModifiedBranch(releaseBranch);

        // If we are creating it, add it to our list.
        this.modifiedBranches.push(modifiedBranch);
      }
      return modifiedBranch;
    }

    /**
     * Attempts to remove a modified branch (if it doesn't need to be kept around).
     * @public
     *
     * @param {ModifiedBranch} modifiedBranch
     */
    tryRemovingModifiedBranch(modifiedBranch) {
      if (modifiedBranch.isUnused) {
        const index = this.modifiedBranches.indexOf(modifiedBranch);
        assert(index >= 0);
        this.modifiedBranches.splice(index, 1);
      }
    }
  }
  return Maintenance;
}();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwcm9kdWN0aW9uIiwicmVxdWlyZSIsInJjIiwiQ2hpcHBlclZlcnNpb24iLCJNb2RpZmllZEJyYW5jaCIsIlBhdGNoIiwiUmVsZWFzZUJyYW5jaCIsImJ1aWxkIiwiY2hlY2tvdXRNYWluIiwiY2hlY2tvdXRUYXJnZXQiLCJleGVjdXRlIiwiZ2V0QWN0aXZlUmVwb3MiLCJnZXRCcmFuY2hlcyIsImdldEJyYW5jaE1hcCIsImdldERlcGVuZGVuY2llcyIsImdpdEFkZCIsImdpdENoZWNrb3V0IiwiZ2l0Q2hlcnJ5UGljayIsImdpdENvbW1pdCIsImdpdENyZWF0ZUJyYW5jaCIsImdpdElzQ2xlYW4iLCJnaXRQdWxsIiwiZ2l0UHVzaCIsImdpdFJldlBhcnNlIiwiYXNzZXJ0IiwiYXN5bmNxIiwiXyIsImZzIiwicmVwbCIsIndpbnN0b24iLCJncnVudENvbW1hbmQiLCJjaGlwcGVyU3VwcG9ydHNPdXRwdXRKU0dydW50VGFza3MiLCJNQUlOVEVOQU5DRV9GSUxFIiwibW9kdWxlIiwiZXhwb3J0cyIsIk1haW50ZW5hbmNlIiwiY29uc3RydWN0b3IiLCJwYXRjaGVzIiwibW9kaWZpZWRCcmFuY2hlcyIsImFsbFJlbGVhc2VCcmFuY2hlcyIsIkFycmF5IiwiaXNBcnJheSIsImZvckVhY2giLCJwYXRjaCIsImJyYW5jaCIsInJlc2V0Iiwia2VlcENhY2hlZFJlbGVhc2VCcmFuY2hlcyIsImNvbnNvbGUiLCJsb2ciLCJtYWludGVuYW5jZSIsImxvYWQiLCJwdXNoIiwic2F2ZSIsImNoZWNrQnJhbmNoU3RhdHVzIiwiZmlsdGVyIiwicmVwbyIsInJlbGVhc2VCcmFuY2hlcyIsImdldE1haW50ZW5hbmNlQnJhbmNoZXMiLCJicmFuY2hNYXBzIiwiZ2V0QnJhbmNoTWFwQXN5bmNDYWxsYmFjayIsInJlbGVhc2VCcmFuY2giLCJsaW5lIiwiZ2V0U3RhdHVzIiwiYnVpbGRBbGwiLCJmYWlsZWQiLCJicmFuZHMiLCJFcnJvciIsImUiLCJicmFuZCIsImxlbmd0aCIsImpvaW4iLCJsaXN0IiwibW9kaWZpZWRCcmFuY2giLCJjb3VudCIsImluZGV4T2YiLCJpc1JlbGVhc2VkIiwiZGVwbG95ZWRWZXJzaW9uIiwidG9TdHJpbmciLCJuZWVkZWRQYXRjaGVzIiwibWFwIiwibmFtZSIsInB1c2hlZE1lc3NhZ2VzIiwicGVuZGluZ01lc3NhZ2VzIiwiT2JqZWN0Iiwia2V5cyIsImNoYW5nZWREZXBlbmRlbmNpZXMiLCJrZXkiLCJpbmRleEFuZFNwYWNpbmciLCJtZXNzYWdlIiwic2hhIiwic2hhcyIsImluY2x1ZGVzIiwibGlzdExpbmtzIiwiZGVwbG95ZWRCcmFuY2hlcyIsInByb2R1Y3Rpb25CcmFuY2hlcyIsInRlc3RUeXBlIiwicmVsZWFzZUNhbmRpZGF0ZUJyYW5jaGVzIiwibGlua3MiLCJnZXREZXBsb3llZExpbmtMaW5lcyIsImxpbmsiLCJjcmVhdGVVbnJlbGVhc2VkSXNzdWVzIiwiYWRkaXRpb25hbE5vdGVzIiwiY3JlYXRlVW5yZWxlYXNlZElzc3VlIiwiY3JlYXRlUGF0Y2giLCJwYXRjaE5hbWUiLCJyZW1vdmVQYXRjaCIsImZpbmRQYXRjaCIsInNwbGljZSIsImFkZFBhdGNoU0hBIiwicmVtb3ZlUGF0Y2hTSEEiLCJpbmRleCIsInJlbW92ZUFsbFBhdGNoU0hBcyIsImFkZE5lZWRlZFBhdGNoIiwiZW5zdXJlTW9kaWZpZWRCcmFuY2giLCJhZGROZWVkZWRQYXRjaFJlbGVhc2VCcmFuY2giLCJhZGROZWVkZWRQYXRjaGVzIiwibmVlZHNQYXRjaCIsImFkZEFsbE5lZWRlZFBhdGNoZXMiLCJhZGROZWVkZWRQYXRjaGVzQmVmb3JlIiwiaXNNaXNzaW5nU0hBIiwiYWRkTmVlZGVkUGF0Y2hlc0FmdGVyIiwiaW5jbHVkZXNTSEEiLCJhZGROZWVkZWRQYXRjaGVzQnVpbGRGaWx0ZXIiLCJjaGlwcGVyVmVyc2lvbiIsImdldEZyb21SZXBvc2l0b3J5IiwiZmlsZW5hbWUiLCJtYWpvciIsInJlYWRGaWxlU3luYyIsInJlbW92ZU5lZWRlZFBhdGNoIiwidHJ5UmVtb3ZpbmdNb2RpZmllZEJyYW5jaCIsInJlbW92ZU5lZWRlZFBhdGNoZXMiLCJuZWVkc1JlbW92YWwiLCJyZW1vdmVOZWVkZWRQYXRjaGVzQmVmb3JlIiwicmVtb3ZlTmVlZGVkUGF0Y2hlc0FmdGVyIiwic2luZ2xlRmlsZVJlbGVhc2VCcmFuY2hGaWx0ZXIiLCJmaWxlIiwicHJlZGljYXRlIiwiY2hlY2tvdXQiLCJleGlzdHNTeW5jIiwiY29udGVudHMiLCJjaGVja291dEJyYW5jaCIsIm91dHB1dEpTIiwiZXJyb3JzIiwiYXBwbHlQYXRjaGVzIiwibnVtQXBwbGllZCIsInNsaWNlIiwicGF0Y2hSZXBvIiwiZGVwZW5kZW5jaWVzIiwiaGFzU2hhIiwiY29kZSIsImNoZXJyeVBpY2tTdWNjZXNzIiwiY3VycmVudFNIQSIsInVwZGF0ZURlcGVuZGVuY2llcyIsImNoYW5nZWRSZXBvcyIsImRlcGVuZGVuY2llc0pTT05GaWxlIiwiZGVwZW5kZW5jaWVzSlNPTiIsIkpTT04iLCJwYXJzZSIsImRlcGVuZGVuY3kiLCJkZXBlbmRlbmN5QnJhbmNoIiwiYnJhbmNoZXMiLCJ3cml0ZUZpbGVTeW5jIiwic3RyaW5naWZ5IiwiZGVwbG95UmVsZWFzZUNhbmRpZGF0ZXMiLCJpc1JlYWR5Rm9yUmVsZWFzZUNhbmRpZGF0ZSIsInZlcnNpb24iLCJkZXBsb3lQcm9kdWN0aW9uIiwiaXNSZWFkeUZvclByb2R1Y3Rpb24iLCJ1cGRhdGVDaGVja291dHMiLCJvcHRpb25zIiwibWVyZ2UiLCJjb25jdXJyZW50IiwidHJhbnNwaWxlIiwiYnVpbGRPcHRpb25zIiwibGludCIsImZpbHRlcmVkQnJhbmNoZXMiLCJ4IiwiYXN5bmNGdW5jdGlvbnMiLCJ1cGRhdGVDaGVja291dCIsInBhcmFsbGVsTGltaXQiLCJjaGVja1VuYnVpbHRDaGVja291dHMiLCJ1bmJ1aWx0UmVzdWx0IiwiY2hlY2tVbmJ1aWx0IiwiY2hlY2tCdWlsdENoZWNrb3V0cyIsImJ1aWx0UmVzdWx0IiwiY2hlY2tCdWlsdCIsInJlZGVwbG95QWxsUHJvZHVjdGlvbiIsImZpbHRlclJlcG8iLCJjaGVja1VucmVsZWFzZWRCcmFuY2hlcyIsImZvcmNlQ2FjaGVCcmVhayIsImxvYWRBbGxNYWludGVuYW5jZUJyYW5jaGVzIiwiZ2V0QWxsTWFpbnRlbmFuY2VCcmFuY2hlcyIsInNlcmlhbGl6ZSIsImRlc2VyaWFsaXplIiwiZGVzZXJpYWxpemVkUGF0Y2hlcyIsInNvcnQiLCJhIiwiYiIsImRlc2VyaWFsaXplZFJlbGVhc2VCcmFuY2hlcyIsInN0YXJ0UkVQTCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiZGVmYXVsdCIsInRyYW5zcG9ydHMiLCJsZXZlbCIsInNlc3Npb24iLCJzdGFydCIsInByb21wdCIsInVzZUNvbG9ycyIsInJlcGxNb2RlIiwiUkVQTF9NT0RFX1NUUklDVCIsImlnbm9yZVVuZGVmaW5lZCIsIm5vZGVFdmFsIiwiZXZhbCIsImNtZCIsImNvbnRleHQiLCJjYWxsYmFjayIsInJlc3VsdCIsInRoZW4iLCJ2YWwiLCJjYXRjaCIsInN0YWNrIiwiZXJyb3IiLCJkZWZpbmVQcm9wZXJ0eSIsImdsb2JhbCIsImdldCIsInNldCIsInZhbHVlIiwibSIsIk0iLCJyYiIsIm9uIiwiZmluZCIsInAiLCJlcnJvcklmTWlzc2luZyIsInJlbGVhc2UiLCJpc1VudXNlZCJdLCJzb3VyY2VzIjpbIk1haW50ZW5hbmNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBUaGUgbWFpbiBwZXJzaXN0ZW50IHN0YXRlLWJlYXJpbmcgb2JqZWN0IGZvciBtYWludGVuYW5jZSByZWxlYXNlcy4gQ2FuIGJlIGxvYWRlZCBmcm9tIG9yIHNhdmVkIHRvIGEgZGVkaWNhdGVkIGZpbGUuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBwcm9kdWN0aW9uID0gcmVxdWlyZSggJy4uL2dydW50L3Byb2R1Y3Rpb24nICk7XHJcbmNvbnN0IHJjID0gcmVxdWlyZSggJy4uL2dydW50L3JjJyApO1xyXG5jb25zdCBDaGlwcGVyVmVyc2lvbiA9IHJlcXVpcmUoICcuL0NoaXBwZXJWZXJzaW9uJyApO1xyXG5jb25zdCBNb2RpZmllZEJyYW5jaCA9IHJlcXVpcmUoICcuL01vZGlmaWVkQnJhbmNoJyApO1xyXG5jb25zdCBQYXRjaCA9IHJlcXVpcmUoICcuL1BhdGNoJyApO1xyXG5jb25zdCBSZWxlYXNlQnJhbmNoID0gcmVxdWlyZSggJy4vUmVsZWFzZUJyYW5jaCcgKTtcclxuY29uc3QgYnVpbGQgPSByZXF1aXJlKCAnLi9idWlsZCcgKTtcclxuY29uc3QgY2hlY2tvdXRNYWluID0gcmVxdWlyZSggJy4vY2hlY2tvdXRNYWluJyApO1xyXG5jb25zdCBjaGVja291dFRhcmdldCA9IHJlcXVpcmUoICcuL2NoZWNrb3V0VGFyZ2V0JyApO1xyXG5jb25zdCBleGVjdXRlID0gcmVxdWlyZSggJy4vZXhlY3V0ZScgKTtcclxuY29uc3QgZ2V0QWN0aXZlUmVwb3MgPSByZXF1aXJlKCAnLi9nZXRBY3RpdmVSZXBvcycgKTtcclxuY29uc3QgZ2V0QnJhbmNoZXMgPSByZXF1aXJlKCAnLi9nZXRCcmFuY2hlcycgKTtcclxuY29uc3QgZ2V0QnJhbmNoTWFwID0gcmVxdWlyZSggJy4vZ2V0QnJhbmNoTWFwJyApO1xyXG5jb25zdCBnZXREZXBlbmRlbmNpZXMgPSByZXF1aXJlKCAnLi9nZXREZXBlbmRlbmNpZXMnICk7XHJcbmNvbnN0IGdpdEFkZCA9IHJlcXVpcmUoICcuL2dpdEFkZCcgKTtcclxuY29uc3QgZ2l0Q2hlY2tvdXQgPSByZXF1aXJlKCAnLi9naXRDaGVja291dCcgKTtcclxuY29uc3QgZ2l0Q2hlcnJ5UGljayA9IHJlcXVpcmUoICcuL2dpdENoZXJyeVBpY2snICk7XHJcbmNvbnN0IGdpdENvbW1pdCA9IHJlcXVpcmUoICcuL2dpdENvbW1pdCcgKTtcclxuY29uc3QgZ2l0Q3JlYXRlQnJhbmNoID0gcmVxdWlyZSggJy4vZ2l0Q3JlYXRlQnJhbmNoJyApO1xyXG5jb25zdCBnaXRJc0NsZWFuID0gcmVxdWlyZSggJy4vZ2l0SXNDbGVhbicgKTtcclxuY29uc3QgZ2l0UHVsbCA9IHJlcXVpcmUoICcuL2dpdFB1bGwnICk7XHJcbmNvbnN0IGdpdFB1c2ggPSByZXF1aXJlKCAnLi9naXRQdXNoJyApO1xyXG5jb25zdCBnaXRSZXZQYXJzZSA9IHJlcXVpcmUoICcuL2dpdFJldlBhcnNlJyApO1xyXG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCAnYXNzZXJ0JyApO1xyXG5jb25zdCBhc3luY3EgPSByZXF1aXJlKCAnYXN5bmMtcScgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSByZXF1aXJlLXN0YXRlbWVudC1tYXRjaFxyXG5jb25zdCBfID0gcmVxdWlyZSggJ2xvZGFzaCcgKTtcclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbmNvbnN0IHJlcGwgPSByZXF1aXJlKCAncmVwbCcgKTtcclxuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xyXG5jb25zdCBncnVudENvbW1hbmQgPSByZXF1aXJlKCAnLi9ncnVudENvbW1hbmQnICk7XHJcbmNvbnN0IGNoaXBwZXJTdXBwb3J0c091dHB1dEpTR3J1bnRUYXNrcyA9IHJlcXVpcmUoICcuL2NoaXBwZXJTdXBwb3J0c091dHB1dEpTR3J1bnRUYXNrcycgKTtcclxuXHJcbi8vIGNvbnN0YW50c1xyXG5jb25zdCBNQUlOVEVOQU5DRV9GSUxFID0gJy5tYWludGVuYW5jZS5qc29uJztcclxuXHJcbi8vIGNvbnN0IFBVQkxJQ19GVU5DVElPTlMgPSBbXHJcbi8vICAgJ2FkZEFsbE5lZWRlZFBhdGNoZXMnLFxyXG4vLyAgICdhZGROZWVkZWRQYXRjaCcsXHJcbi8vICAgJ2FkZE5lZWRlZFBhdGNoZXMnLFxyXG4vLyAgICdhZGROZWVkZWRQYXRjaGVzQWZ0ZXInLFxyXG4vLyAgICdhZGROZWVkZWRQYXRjaGVzQmVmb3JlJyxcclxuLy8gICAnYWRkTmVlZGVkUGF0Y2hlc0J1aWxkRmlsdGVyJyxcclxuLy8gICAnYWRkTmVlZGVkUGF0Y2hSZWxlYXNlQnJhbmNoJyxcclxuLy8gICAnYWRkUGF0Y2hTSEEnLFxyXG4vLyAgICdhcHBseVBhdGNoZXMnLFxyXG4vLyAgICdidWlsZEFsbCcsXHJcbi8vICAgJ2NoZWNrQnJhbmNoU3RhdHVzJyxcclxuLy8gICAnY2hlY2tvdXRCcmFuY2gnLFxyXG4vLyAgICdjcmVhdGVQYXRjaCcsXHJcbi8vICAgJ2RlcGxveVByb2R1Y3Rpb24nLFxyXG4vLyAgICdkZXBsb3lSZWxlYXNlQ2FuZGlkYXRlcycsXHJcbi8vICAgJ2xpc3QnLFxyXG4vLyAgICdsaXN0TGlua3MnLFxyXG4vLyAgICdyZW1vdmVOZWVkZWRQYXRjaCcsXHJcbi8vICAgJ3JlbW92ZU5lZWRlZFBhdGNoZXMnLFxyXG4vLyAgICdyZW1vdmVOZWVkZWRQYXRjaGVzQWZ0ZXInLFxyXG4vLyAgICdyZW1vdmVOZWVkZWRQYXRjaGVzQmVmb3JlJyxcclxuLy8gICAncmVtb3ZlUGF0Y2gnLFxyXG4vLyAgICdyZW1vdmVQYXRjaFNIQScsXHJcbi8vICAgJ3Jlc2V0JyxcclxuLy8gICAndXBkYXRlRGVwZW5kZW5jaWVzJ1xyXG4vLyAgICdnZXRBbGxNYWludGVuYW5jZUJyYW5jaGVzJ1xyXG4vLyBdO1xyXG5cclxuLyoqXHJcbiAqIEB0eXBlZGVmIFNlcmlhbGl6ZWRNYWludGVuYW5jZSAtIHNlZSBNYWludGVuYW5jZS5zZXJpYWxpemUoKVxyXG4gKiBAcHJvcGVydHkge0FycmF5LjxPYmplY3Q+fSBwYXRjaGVzXHJcbiAqIEBwcm9wZXJ0eSB7QXJyYXkuPE9iamVjdD59IG1vZGlmaWVkQnJhbmNoZXNcclxuICogQHByb3BlcnR5IHtBcnJheS48T2JqZWN0Pn0gYWxsUmVsZWFzZUJyYW5jaGVzXHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoIGZ1bmN0aW9uKCkge1xyXG5cclxuICBjbGFzcyBNYWludGVuYW5jZSB7XHJcbiAgICAvKipcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqIEBjb25zdHJ1Y3RvclxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPFBhdGNoPn0gW3BhdGNoZXNdXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxNb2RpZmllZEJyYW5jaD59IFttb2RpZmllZEJyYW5jaGVzXVxyXG4gICAgICogQHBhcmFtICB7QXJyYXkuPFJlbGVhc2VCcmFuY2g+fSBbYWxsUmVsZWFzZUJyYW5jaGVzXVxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvciggcGF0Y2hlcyA9IFtdLCBtb2RpZmllZEJyYW5jaGVzID0gW10sIGFsbFJlbGVhc2VCcmFuY2hlcyA9IFtdICkge1xyXG4gICAgICBhc3NlcnQoIEFycmF5LmlzQXJyYXkoIHBhdGNoZXMgKSApO1xyXG4gICAgICBwYXRjaGVzLmZvckVhY2goIHBhdGNoID0+IGFzc2VydCggcGF0Y2ggaW5zdGFuY2VvZiBQYXRjaCApICk7XHJcbiAgICAgIGFzc2VydCggQXJyYXkuaXNBcnJheSggbW9kaWZpZWRCcmFuY2hlcyApICk7XHJcbiAgICAgIG1vZGlmaWVkQnJhbmNoZXMuZm9yRWFjaCggYnJhbmNoID0+IGFzc2VydCggYnJhbmNoIGluc3RhbmNlb2YgTW9kaWZpZWRCcmFuY2ggKSApO1xyXG5cclxuICAgICAgLy8gQHB1YmxpYyB7QXJyYXkuPFBhdGNoPn1cclxuICAgICAgdGhpcy5wYXRjaGVzID0gcGF0Y2hlcztcclxuXHJcbiAgICAgIC8vIEBwdWJsaWMge0FycmF5LjxNb2RpZmllZEJyYW5jaD59XHJcbiAgICAgIHRoaXMubW9kaWZpZWRCcmFuY2hlcyA9IG1vZGlmaWVkQnJhbmNoZXM7XHJcblxyXG4gICAgICAvLyBAcHVibGljIHtBcnJheS48UmVsZWFzZUJyYW5jaD59XHJcbiAgICAgIHRoaXMuYWxsUmVsZWFzZUJyYW5jaGVzID0gYWxsUmVsZWFzZUJyYW5jaGVzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVzZXRzIEFMTCB0aGUgbWFpbnRlbmFuY2Ugc3RhdGUgdG8gYSBkZWZhdWx0IFwiYmxhbmtcIiBzdGF0ZS5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqIEBwYXJhbSBrZWVwQ2FjaGVkUmVsZWFzZUJyYW5jaGVzIHtib29sZWFufSAtIGFsbFJlbGVhc2VCcmFuY2hlcyB0YWtlIGEgd2hpbGUgdG8gcG9wdWxhdGUsIGFuZCBoYXZlIGxpdHRsZSB0byBkb1xyXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2l0aCB0aGUgY3VycmVudCBNUiwgc28gb3B0aW9uYWxseSBrZWVwIHRoZW0gaW4gc3RvcmFnZS5cclxuICAgICAqXHJcbiAgICAgKiBDQVVUSU9OOiBUaGlzIHdpbGwgcmVtb3ZlIGFueSBpbmZvcm1hdGlvbiBhYm91dCBhbnkgb25nb2luZy9jb21wbGV0ZSBtYWludGVuYW5jZSByZWxlYXNlIGZyb20geW91clxyXG4gICAgICogLm1haW50ZW5hbmNlLmpzb24uIEdlbmVyYWxseSB0aGlzIHNob3VsZCBiZSBkb25lIGJlZm9yZSBhbnkgbmV3IG1haW50ZW5hbmNlIHJlbGVhc2UuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyByZXNldCgga2VlcENhY2hlZFJlbGVhc2VCcmFuY2hlcyA9IGZhbHNlICkge1xyXG4gICAgICBjb25zb2xlLmxvZyggJ01ha2Ugc3VyZSB0byBjaGVjayBvbiB0aGUgYWN0aXZlIFBoRVQtaU8gRGVwbG95IFN0YXR1cyBvbiBwaGV0LmNvbG9yYWRvLmVkdSB0byBlbnN1cmUgdGhhdCB0aGUgJyArXHJcbiAgICAgICAgICAgICAgICAgICAncmlnaHQgUGhFVC1pTyBzaW1zIGFyZSBpbmNsdWRlZCBpbiB0aGlzIG1haW50ZW5hbmNlIHJlbGVhc2UuJyApO1xyXG5cclxuICAgICAgY29uc3QgYWxsUmVsZWFzZUJyYW5jaGVzID0gW107XHJcbiAgICAgIGlmICgga2VlcENhY2hlZFJlbGVhc2VCcmFuY2hlcyApIHtcclxuICAgICAgICBjb25zdCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKTtcclxuICAgICAgICBhbGxSZWxlYXNlQnJhbmNoZXMucHVzaCggLi4ubWFpbnRlbmFuY2UuYWxsUmVsZWFzZUJyYW5jaGVzICk7XHJcbiAgICAgIH1cclxuICAgICAgbmV3IE1haW50ZW5hbmNlKCBbXSwgW10sIGFsbFJlbGVhc2VCcmFuY2hlcyApLnNhdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJ1bnMgYSBudW1iZXIgb2YgY2hlY2tzIHRocm91Z2ggZXZlcnkgcmVsZWFzZSBicmFuY2guXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbihSZWxlYXNlQnJhbmNoKTpQcm9taXNlLjxib29sZWFuPn0gW2ZpbHRlcl0gLSBPcHRpb25hbCBmaWx0ZXIsIHJlbGVhc2UgYnJhbmNoZXMgd2lsbCBiZSBza2lwcGVkXHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHRoaXMgcmVzb2x2ZXMgdG8gZmFsc2VcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYXN5bmMgY2hlY2tCcmFuY2hTdGF0dXMoIGZpbHRlciApIHtcclxuICAgICAgZm9yICggY29uc3QgcmVwbyBvZiBnZXRBY3RpdmVSZXBvcygpICkge1xyXG4gICAgICAgIGlmICggcmVwbyAhPT0gJ3BlcmVubmlhbCcgJiYgISggYXdhaXQgZ2l0SXNDbGVhbiggcmVwbyApICkgKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggYFVuY2xlYW4gcmVwb3NpdG9yeTogJHtyZXBvfSwgcGxlYXNlIHJlc29sdmUgdGhpcyBhbmQgdGhlbiBydW4gY2hlY2tCcmFuY2hTdGF0dXMgYWdhaW5gICk7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCByZWxlYXNlQnJhbmNoZXMgPSBhd2FpdCBNYWludGVuYW5jZS5nZXRNYWludGVuYW5jZUJyYW5jaGVzKCBmaWx0ZXIgKTtcclxuXHJcbiAgICAgIC8vIFNldCB1cCBhIGNhY2hlIG9mIGJyYW5jaE1hcHMgc28gdGhhdCB3ZSBkb24ndCBtYWtlIG11bHRpcGxlIHJlcXVlc3RzXHJcbiAgICAgIGNvbnN0IGJyYW5jaE1hcHMgPSB7fTtcclxuICAgICAgY29uc3QgZ2V0QnJhbmNoTWFwQXN5bmNDYWxsYmFjayA9IGFzeW5jIHJlcG8gPT4ge1xyXG4gICAgICAgIGlmICggIWJyYW5jaE1hcHNbIHJlcG8gXSApIHtcclxuICAgICAgICAgIGJyYW5jaE1hcHNbIHJlcG8gXSA9IGF3YWl0IGdldEJyYW5jaE1hcCggcmVwbyApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYnJhbmNoTWFwc1sgcmVwbyBdO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgZm9yICggY29uc3QgcmVsZWFzZUJyYW5jaCBvZiByZWxlYXNlQnJhbmNoZXMgKSB7XHJcbiAgICAgICAgaWYgKCAhZmlsdGVyIHx8IGF3YWl0IGZpbHRlciggcmVsZWFzZUJyYW5jaCApICkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coIGAke3JlbGVhc2VCcmFuY2gucmVwb30gJHtyZWxlYXNlQnJhbmNoLmJyYW5jaH1gICk7XHJcbiAgICAgICAgICBmb3IgKCBjb25zdCBsaW5lIG9mIGF3YWl0IHJlbGVhc2VCcmFuY2guZ2V0U3RhdHVzKCBnZXRCcmFuY2hNYXBBc3luY0NhbGxiYWNrICkgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCBgICAke2xpbmV9YCApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCBgJHtyZWxlYXNlQnJhbmNoLnJlcG99ICR7cmVsZWFzZUJyYW5jaC5icmFuY2h9IChza2lwcGluZyBkdWUgdG8gZmlsdGVyKWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEJ1aWxkcyBhbGwgcmVsZWFzZSBicmFuY2hlcyAoc28gdGhhdCB0aGUgc3RhdGUgb2YgdGhpbmdzIGNhbiBiZSBjaGVja2VkKS4gUHV0cyBpbiBpbiBwZXJlbm5pYWwvYnVpbGQuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyBidWlsZEFsbCgpIHtcclxuICAgICAgY29uc3QgcmVsZWFzZUJyYW5jaGVzID0gYXdhaXQgTWFpbnRlbmFuY2UuZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcygpO1xyXG5cclxuICAgICAgY29uc3QgZmFpbGVkID0gW107XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCByZWxlYXNlQnJhbmNoIG9mIHJlbGVhc2VCcmFuY2hlcyApIHtcclxuICAgICAgICBjb25zb2xlLmxvZyggYGJ1aWxkaW5nICR7cmVsZWFzZUJyYW5jaC5yZXBvfSAke3JlbGVhc2VCcmFuY2guYnJhbmNofWAgKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgYXdhaXQgY2hlY2tvdXRUYXJnZXQoIHJlbGVhc2VCcmFuY2gucmVwbywgcmVsZWFzZUJyYW5jaC5icmFuY2gsIHRydWUgKTsgLy8gaW5jbHVkZSBucG0gdXBkYXRlXHJcbiAgICAgICAgICBhd2FpdCBidWlsZCggcmVsZWFzZUJyYW5jaC5yZXBvLCB7XHJcbiAgICAgICAgICAgIGJyYW5kczogcmVsZWFzZUJyYW5jaC5icmFuZHNcclxuICAgICAgICAgIH0gKTtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciggJ1VOSU1QTEVNRU5URUQsIGNvcHkgb3ZlcicgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgICBmYWlsZWQucHVzaCggYCR7cmVsZWFzZUJyYW5jaC5yZXBvfSAke3JlbGVhc2VCcmFuY2guYnJhbmR9YCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCBmYWlsZWQubGVuZ3RoICkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCBgRmFpbGVkIGJ1aWxkczpcXG4ke2ZhaWxlZC5qb2luKCAnXFxuJyApfWAgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBjb25zb2xlLmxvZyggJ0J1aWxkcyBjb21wbGV0ZScgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGlzcGxheXMgYSBsaXN0aW5nIG9mIHRoZSBjdXJyZW50IG1haW50ZW5hbmNlIHN0YXR1cy5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIGxpc3QoKSB7XHJcbiAgICAgIGNvbnN0IG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpO1xyXG5cclxuICAgICAgLy8gQXQgdGhlIHRvcCBzbyB0aGF0IHRoZSBpbXBvcnRhbnQgaXRlbXMgYXJlIHJpZ2h0IGFib3ZlIHlvdXIgY3Vyc29yIGFmdGVyIGNhbGxpbmcgdGhlIGZ1bmN0aW9uXHJcbiAgICAgIGlmICggbWFpbnRlbmFuY2UuYWxsUmVsZWFzZUJyYW5jaGVzLmxlbmd0aCA+IDAgKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coIGBUb3RhbCByZWNvZ25pemVkIFJlbGVhc2VCcmFuY2hlczogJHttYWludGVuYW5jZS5hbGxSZWxlYXNlQnJhbmNoZXMubGVuZ3RofWAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc29sZS5sb2coICdcXG5SZWxlYXNlIEJyYW5jaGVzIGluIE1SOicsIG1haW50ZW5hbmNlLnBhdGNoZXMubGVuZ3RoID09PSAwID8gJ05vbmUnIDogJycgKTtcclxuICAgICAgZm9yICggY29uc3QgbW9kaWZpZWRCcmFuY2ggb2YgbWFpbnRlbmFuY2UubW9kaWZpZWRCcmFuY2hlcyApIHtcclxuICAgICAgICBjb25zdCBjb3VudCA9IG1haW50ZW5hbmNlLm1vZGlmaWVkQnJhbmNoZXMuaW5kZXhPZiggbW9kaWZpZWRCcmFuY2ggKSArIDE7XHJcbiAgICAgICAgY29uc29sZS5sb2coIGAke2NvdW50fS4gJHttb2RpZmllZEJyYW5jaC5yZXBvfSAke21vZGlmaWVkQnJhbmNoLmJyYW5jaH0gJHttb2RpZmllZEJyYW5jaC5icmFuZHMuam9pbiggJywnICl9JHttb2RpZmllZEJyYW5jaC5yZWxlYXNlQnJhbmNoLmlzUmVsZWFzZWQgPyAnJyA6ICcgKHVucmVsZWFzZWQpJ31gICk7XHJcbiAgICAgICAgaWYgKCBtb2RpZmllZEJyYW5jaC5kZXBsb3llZFZlcnNpb24gKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggYCAgICBkZXBsb3llZDogJHttb2RpZmllZEJyYW5jaC5kZXBsb3llZFZlcnNpb24udG9TdHJpbmcoKX1gICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggbW9kaWZpZWRCcmFuY2gubmVlZGVkUGF0Y2hlcy5sZW5ndGggKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggYCAgICBuZWVkczogJHttb2RpZmllZEJyYW5jaC5uZWVkZWRQYXRjaGVzLm1hcCggcGF0Y2ggPT4gcGF0Y2gubmFtZSApLmpvaW4oICcsJyApfWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBtb2RpZmllZEJyYW5jaC5wdXNoZWRNZXNzYWdlcy5sZW5ndGggKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggYCAgICBwdXNoZWRNZXNzYWdlczogXFxuICAgICAgJHttb2RpZmllZEJyYW5jaC5wdXNoZWRNZXNzYWdlcy5qb2luKCAnXFxuICAgICAgJyApfWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBtb2RpZmllZEJyYW5jaC5wZW5kaW5nTWVzc2FnZXMubGVuZ3RoICkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coIGAgICAgcGVuZGluZ01lc3NhZ2VzOiBcXG4gICAgICAke21vZGlmaWVkQnJhbmNoLnBlbmRpbmdNZXNzYWdlcy5qb2luKCAnXFxuICAgICAgJyApfWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBPYmplY3Qua2V5cyggbW9kaWZpZWRCcmFuY2guY2hhbmdlZERlcGVuZGVuY2llcyApLmxlbmd0aCA+IDAgKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggJyAgICBkZXBzOicgKTtcclxuICAgICAgICAgIGZvciAoIGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyggbW9kaWZpZWRCcmFuY2guY2hhbmdlZERlcGVuZGVuY2llcyApICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyggYCAgICAgICR7a2V5fTogJHttb2RpZmllZEJyYW5jaC5jaGFuZ2VkRGVwZW5kZW5jaWVzWyBrZXkgXX1gICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyggJ1xcbk1haW50ZW5hbmNlIFBhdGNoZXMgaW4gTVI6JywgbWFpbnRlbmFuY2UucGF0Y2hlcy5sZW5ndGggPT09IDAgPyAnTm9uZScgOiAnJyApO1xyXG4gICAgICBmb3IgKCBjb25zdCBwYXRjaCBvZiBtYWludGVuYW5jZS5wYXRjaGVzICkge1xyXG4gICAgICAgIGNvbnN0IGNvdW50ID0gbWFpbnRlbmFuY2UucGF0Y2hlcy5pbmRleE9mKCBwYXRjaCApICsgMTtcclxuICAgICAgICBjb25zdCBpbmRleEFuZFNwYWNpbmcgPSBgJHtjb3VudH0uIGAgKyAoIGNvdW50ID4gOSA/ICcnIDogJyAnICk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKCBgJHtpbmRleEFuZFNwYWNpbmd9WyR7cGF0Y2gubmFtZX1dJHtwYXRjaC5uYW1lICE9PSBwYXRjaC5yZXBvID8gYCAoJHtwYXRjaC5yZXBvfSlgIDogJyd9ICR7cGF0Y2gubWVzc2FnZX1gICk7XHJcbiAgICAgICAgZm9yICggY29uc3Qgc2hhIG9mIHBhdGNoLnNoYXMgKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggYCAgICAgICR7c2hhfWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yICggY29uc3QgbW9kaWZpZWRCcmFuY2ggb2YgbWFpbnRlbmFuY2UubW9kaWZpZWRCcmFuY2hlcyApIHtcclxuICAgICAgICAgIGlmICggbW9kaWZpZWRCcmFuY2gubmVlZGVkUGF0Y2hlcy5pbmNsdWRlcyggcGF0Y2ggKSApIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coIGAgICAgICAgICR7bW9kaWZpZWRCcmFuY2gucmVwb30gJHttb2RpZmllZEJyYW5jaC5icmFuY2h9ICR7bW9kaWZpZWRCcmFuY2guYnJhbmRzLmpvaW4oICcsJyApfWAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNob3dzIGFueSByZXF1aXJlZCB0ZXN0aW5nIGxpbmtzIGZvciB0aGUgc2ltdWxhdGlvbnMuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbihNb2RpZmllZEJyYW5jaCk6Ym9vbGVhbn0gW2ZpbHRlcl0gLSBDb250cm9sIHdoaWNoIGJyYW5jaGVzIGFyZSBzaG93blxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYXN5bmMgbGlzdExpbmtzKCBmaWx0ZXIgPSAoKSA9PiB0cnVlICkge1xyXG4gICAgICBjb25zdCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKTtcclxuXHJcbiAgICAgIGNvbnN0IGRlcGxveWVkQnJhbmNoZXMgPSBtYWludGVuYW5jZS5tb2RpZmllZEJyYW5jaGVzLmZpbHRlciggbW9kaWZpZWRCcmFuY2ggPT4gISFtb2RpZmllZEJyYW5jaC5kZXBsb3llZFZlcnNpb24gJiYgZmlsdGVyKCBtb2RpZmllZEJyYW5jaCApICk7XHJcbiAgICAgIGNvbnN0IHByb2R1Y3Rpb25CcmFuY2hlcyA9IGRlcGxveWVkQnJhbmNoZXMuZmlsdGVyKCBtb2RpZmllZEJyYW5jaCA9PiBtb2RpZmllZEJyYW5jaC5kZXBsb3llZFZlcnNpb24udGVzdFR5cGUgPT09IG51bGwgKTtcclxuICAgICAgY29uc3QgcmVsZWFzZUNhbmRpZGF0ZUJyYW5jaGVzID0gZGVwbG95ZWRCcmFuY2hlcy5maWx0ZXIoIG1vZGlmaWVkQnJhbmNoID0+IG1vZGlmaWVkQnJhbmNoLmRlcGxveWVkVmVyc2lvbi50ZXN0VHlwZSA9PT0gJ3JjJyApO1xyXG5cclxuICAgICAgaWYgKCBwcm9kdWN0aW9uQnJhbmNoZXMubGVuZ3RoICkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCAnXFxuUHJvZHVjdGlvbiBsaW5rc1xcbicgKTtcclxuXHJcbiAgICAgICAgZm9yICggY29uc3QgbW9kaWZpZWRCcmFuY2ggb2YgcHJvZHVjdGlvbkJyYW5jaGVzICkge1xyXG4gICAgICAgICAgY29uc3QgbGlua3MgPSBhd2FpdCBtb2RpZmllZEJyYW5jaC5nZXREZXBsb3llZExpbmtMaW5lcygpO1xyXG4gICAgICAgICAgZm9yICggY29uc3QgbGluayBvZiBsaW5rcyApIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coIGxpbmsgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggcmVsZWFzZUNhbmRpZGF0ZUJyYW5jaGVzLmxlbmd0aCApIHtcclxuICAgICAgICBjb25zb2xlLmxvZyggJ1xcblJlbGVhc2UgQ2FuZGlkYXRlIGxpbmtzXFxuJyApO1xyXG5cclxuICAgICAgICBmb3IgKCBjb25zdCBtb2RpZmllZEJyYW5jaCBvZiByZWxlYXNlQ2FuZGlkYXRlQnJhbmNoZXMgKSB7XHJcbiAgICAgICAgICBjb25zdCBsaW5rcyA9IGF3YWl0IG1vZGlmaWVkQnJhbmNoLmdldERlcGxveWVkTGlua0xpbmVzKCk7XHJcbiAgICAgICAgICBmb3IgKCBjb25zdCBsaW5rIG9mIGxpbmtzICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyggbGluayApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhbiBpc3N1ZSB0byBub3RlIHBhdGNoZXMgb24gYWxsIHVucmVsZWFzZWQgYnJhbmNoZXMgdGhhdCBpbmNsdWRlIGEgcHVzaGVkIG1lc3NhZ2UuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFthZGRpdGlvbmFsTm90ZXNdXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyBjcmVhdGVVbnJlbGVhc2VkSXNzdWVzKCBhZGRpdGlvbmFsTm90ZXMgPSAnJyApIHtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCBtb2RpZmllZEJyYW5jaCBvZiBtYWludGVuYW5jZS5tb2RpZmllZEJyYW5jaGVzICkge1xyXG4gICAgICAgIGlmICggIW1vZGlmaWVkQnJhbmNoLnJlbGVhc2VCcmFuY2guaXNSZWxlYXNlZCAmJiBtb2RpZmllZEJyYW5jaC5wdXNoZWRNZXNzYWdlcy5sZW5ndGggPiAwICkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coIGBDcmVhdGluZyBpc3N1ZSBmb3IgJHttb2RpZmllZEJyYW5jaC5yZWxlYXNlQnJhbmNoLnRvU3RyaW5nKCl9YCApO1xyXG4gICAgICAgICAgYXdhaXQgbW9kaWZpZWRCcmFuY2guY3JlYXRlVW5yZWxlYXNlZElzc3VlKCBhZGRpdGlvbmFsTm90ZXMgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKCAnRmluaXNoZWQgY3JlYXRpbmcgdW5yZWxlYXNlZCBpc3N1ZXMnICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIGEgcGF0Y2hcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbcGF0Y2hOYW1lXSAtIElmIG5vIG5hbWUgaXMgcHJvdmlkZWQsIHRoZSByZXBvIHN0cmluZyB3aWxsIGJlIHVzZWQuXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIGNyZWF0ZVBhdGNoKCByZXBvLCBtZXNzYWdlLCBwYXRjaE5hbWUgKSB7XHJcbiAgICAgIGNvbnN0IG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpO1xyXG5cclxuICAgICAgcGF0Y2hOYW1lID0gcGF0Y2hOYW1lIHx8IHJlcG87XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCBwYXRjaCBvZiBtYWludGVuYW5jZS5wYXRjaGVzICkge1xyXG4gICAgICAgIGlmICggcGF0Y2gubmFtZSA9PT0gcGF0Y2hOYW1lICkge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnTXVsdGlwbGUgcGF0Y2hlcyB3aXRoIHRoZSBzYW1lIG5hbWUgYXJlIG5vdCBjb25jdXJyZW50bHkgc3VwcG9ydGVkJyApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgbWFpbnRlbmFuY2UucGF0Y2hlcy5wdXNoKCBuZXcgUGF0Y2goIHJlcG8sIHBhdGNoTmFtZSwgbWVzc2FnZSApICk7XHJcblxyXG4gICAgICBtYWludGVuYW5jZS5zYXZlKCk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyggYENyZWF0ZWQgcGF0Y2ggZm9yICR7cmVwb30gd2l0aCBtZXNzYWdlOiAke21lc3NhZ2V9YCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlcyBhIHBhdGNoXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGNoTmFtZVxyXG4gICAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyByZW1vdmVQYXRjaCggcGF0Y2hOYW1lICkge1xyXG4gICAgICBjb25zdCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKTtcclxuXHJcbiAgICAgIGNvbnN0IHBhdGNoID0gbWFpbnRlbmFuY2UuZmluZFBhdGNoKCBwYXRjaE5hbWUgKTtcclxuXHJcbiAgICAgIGZvciAoIGNvbnN0IGJyYW5jaCBvZiBtYWludGVuYW5jZS5tb2RpZmllZEJyYW5jaGVzICkge1xyXG4gICAgICAgIGlmICggYnJhbmNoLm5lZWRlZFBhdGNoZXMuaW5jbHVkZXMoIHBhdGNoICkgKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdQYXRjaCBpcyBtYXJrZWQgYXMgbmVlZGVkIGJ5IGF0IGxlYXN0IG9uZSBicmFuY2gnICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBtYWludGVuYW5jZS5wYXRjaGVzLnNwbGljZSggbWFpbnRlbmFuY2UucGF0Y2hlcy5pbmRleE9mKCBwYXRjaCApLCAxICk7XHJcblxyXG4gICAgICBtYWludGVuYW5jZS5zYXZlKCk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyggYFJlbW92ZWQgcGF0Y2ggZm9yICR7cGF0Y2hOYW1lfWAgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZHMgYSBwYXJ0aWN1bGFyIFNIQSAodG8gY2hlcnJ5LXBpY2spIHRvIGEgcGF0Y2guXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGNoTmFtZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtzaGFdXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIGFkZFBhdGNoU0hBKCBwYXRjaE5hbWUsIHNoYSApIHtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XHJcblxyXG4gICAgICBjb25zdCBwYXRjaCA9IG1haW50ZW5hbmNlLmZpbmRQYXRjaCggcGF0Y2hOYW1lICk7XHJcblxyXG4gICAgICBpZiAoICFzaGEgKSB7XHJcbiAgICAgICAgc2hhID0gYXdhaXQgZ2l0UmV2UGFyc2UoIHBhdGNoLnJlcG8sICdIRUFEJyApO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCBgU0hBIG5vdCBwcm92aWRlZCwgZGV0ZWN0aW5nIFNIQTogJHtzaGF9YCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwYXRjaC5zaGFzLnB1c2goIHNoYSApO1xyXG5cclxuICAgICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coIGBBZGRlZCBTSEEgJHtzaGF9IHRvIHBhdGNoICR7cGF0Y2hOYW1lfWAgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZXMgYSBwYXJ0aWN1bGFyIFNIQSAodG8gY2hlcnJ5LXBpY2spIGZyb20gYSBwYXRjaC5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0Y2hOYW1lXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2hhXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIHJlbW92ZVBhdGNoU0hBKCBwYXRjaE5hbWUsIHNoYSApIHtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XHJcblxyXG4gICAgICBjb25zdCBwYXRjaCA9IG1haW50ZW5hbmNlLmZpbmRQYXRjaCggcGF0Y2hOYW1lICk7XHJcblxyXG4gICAgICBjb25zdCBpbmRleCA9IHBhdGNoLnNoYXMuaW5kZXhPZiggc2hhICk7XHJcbiAgICAgIGFzc2VydCggaW5kZXggPj0gMCwgJ1NIQSBub3QgZm91bmQnICk7XHJcblxyXG4gICAgICBwYXRjaC5zaGFzLnNwbGljZSggaW5kZXgsIDEgKTtcclxuXHJcbiAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKCBgUmVtb3ZlZCBTSEEgJHtzaGF9IGZyb20gcGF0Y2ggJHtwYXRjaE5hbWV9YCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlcyBhbGwgcGF0Y2ggU0hBcyBmb3IgYSBwYXJ0aWN1bGFyIHBhdGNoLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRjaE5hbWVcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYXN5bmMgcmVtb3ZlQWxsUGF0Y2hTSEFzKCBwYXRjaE5hbWUgKSB7XHJcbiAgICAgIGNvbnN0IG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpO1xyXG5cclxuICAgICAgY29uc3QgcGF0Y2ggPSBtYWludGVuYW5jZS5maW5kUGF0Y2goIHBhdGNoTmFtZSApO1xyXG5cclxuICAgICAgZm9yICggY29uc3Qgc2hhIG9mIHBhdGNoLnNoYXMgKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coIGBSZW1vdmluZyBTSEEgJHtzaGF9IGZyb20gcGF0Y2ggJHtwYXRjaE5hbWV9YCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwYXRjaC5zaGFzID0gW107XHJcblxyXG4gICAgICBtYWludGVuYW5jZS5zYXZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGRzIGEgbmVlZGVkIHBhdGNoIHRvIGEgZ2l2ZW4gbW9kaWZpZWQgYnJhbmNoLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYnJhbmNoXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0Y2hOYW1lXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyBhZGROZWVkZWRQYXRjaCggcmVwbywgYnJhbmNoLCBwYXRjaE5hbWUgKSB7XHJcbiAgICAgIGNvbnN0IG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpO1xyXG5cclxuICAgICAgY29uc3QgcGF0Y2ggPSBtYWludGVuYW5jZS5maW5kUGF0Y2goIHBhdGNoTmFtZSApO1xyXG5cclxuICAgICAgY29uc3QgbW9kaWZpZWRCcmFuY2ggPSBhd2FpdCBtYWludGVuYW5jZS5lbnN1cmVNb2RpZmllZEJyYW5jaCggcmVwbywgYnJhbmNoICk7XHJcbiAgICAgIG1vZGlmaWVkQnJhbmNoLm5lZWRlZFBhdGNoZXMucHVzaCggcGF0Y2ggKTtcclxuXHJcbiAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKCBgQWRkZWQgcGF0Y2ggJHtwYXRjaE5hbWV9IGFzIG5lZWRlZCBmb3IgJHtyZXBvfSAke2JyYW5jaH1gICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGRzIGEgbmVlZGVkIHBhdGNoIHRvIGEgZ2l2ZW4gcmVsZWFzZSBicmFuY2hcclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1JlbGVhc2VCcmFuY2h9IHJlbGVhc2VCcmFuY2hcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRjaE5hbWVcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIGFkZE5lZWRlZFBhdGNoUmVsZWFzZUJyYW5jaCggcmVsZWFzZUJyYW5jaCwgcGF0Y2hOYW1lICkge1xyXG4gICAgICBjb25zdCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKTtcclxuXHJcbiAgICAgIGNvbnN0IHBhdGNoID0gbWFpbnRlbmFuY2UuZmluZFBhdGNoKCBwYXRjaE5hbWUgKTtcclxuXHJcbiAgICAgIGNvbnN0IG1vZGlmaWVkQnJhbmNoID0gbmV3IE1vZGlmaWVkQnJhbmNoKCByZWxlYXNlQnJhbmNoICk7XHJcbiAgICAgIG1haW50ZW5hbmNlLm1vZGlmaWVkQnJhbmNoZXMucHVzaCggbW9kaWZpZWRCcmFuY2ggKTtcclxuICAgICAgbW9kaWZpZWRCcmFuY2gubmVlZGVkUGF0Y2hlcy5wdXNoKCBwYXRjaCApO1xyXG4gICAgICBtYWludGVuYW5jZS5zYXZlKCk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyggYEFkZGVkIHBhdGNoICR7cGF0Y2hOYW1lfSBhcyBuZWVkZWQgZm9yICR7cmVsZWFzZUJyYW5jaC5yZXBvfSAke3JlbGVhc2VCcmFuY2guYnJhbmNofWAgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZHMgYSBuZWVkZWQgcGF0Y2ggdG8gd2hhdGV2ZXIgc3Vic2V0IG9mIHJlbGVhc2UgYnJhbmNoZXMgbWF0Y2ggdGhlIGZpbHRlci5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0Y2hOYW1lXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKFJlbGVhc2VCcmFuY2gpOlByb21pc2UuPGJvb2xlYW4+fSBmaWx0ZXJcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIGFkZE5lZWRlZFBhdGNoZXMoIHBhdGNoTmFtZSwgZmlsdGVyICkge1xyXG5cclxuICAgICAgLy8gZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcyBuZWVkcyB0byBjYWNoZSBpdHMgYnJhbmNoZXMgYW5kIG1haW50ZW5hbmNlLnNhdmUoKSB0aGVtLCBzbyBkbyBpdCBiZWZvcmUgbG9hZGluZ1xyXG4gICAgICAvLyBNYWludGVuYW5jZSBmb3IgdGhpcyBmdW5jdGlvbi5cclxuICAgICAgY29uc3QgcmVsZWFzZUJyYW5jaGVzID0gYXdhaXQgTWFpbnRlbmFuY2UuZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcygpO1xyXG4gICAgICBjb25zdCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKTtcclxuXHJcbiAgICAgIGNvbnN0IHBhdGNoID0gbWFpbnRlbmFuY2UuZmluZFBhdGNoKCBwYXRjaE5hbWUgKTtcclxuXHJcbiAgICAgIGxldCBjb3VudCA9IDA7XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCByZWxlYXNlQnJhbmNoIG9mIHJlbGVhc2VCcmFuY2hlcyApIHtcclxuICAgICAgICBjb25zdCBuZWVkc1BhdGNoID0gYXdhaXQgZmlsdGVyKCByZWxlYXNlQnJhbmNoICk7XHJcblxyXG4gICAgICAgIGlmICggIW5lZWRzUGF0Y2ggKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggYCAgc2tpcHBpbmcgJHtyZWxlYXNlQnJhbmNoLnJlcG99ICR7cmVsZWFzZUJyYW5jaC5icmFuY2h9YCApO1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBtb2RpZmllZEJyYW5jaCA9IGF3YWl0IG1haW50ZW5hbmNlLmVuc3VyZU1vZGlmaWVkQnJhbmNoKCByZWxlYXNlQnJhbmNoLnJlcG8sIHJlbGVhc2VCcmFuY2guYnJhbmNoLCBmYWxzZSwgcmVsZWFzZUJyYW5jaGVzICk7XHJcbiAgICAgICAgaWYgKCAhbW9kaWZpZWRCcmFuY2gubmVlZGVkUGF0Y2hlcy5pbmNsdWRlcyggcGF0Y2ggKSApIHtcclxuICAgICAgICAgIG1vZGlmaWVkQnJhbmNoLm5lZWRlZFBhdGNoZXMucHVzaCggcGF0Y2ggKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCBgQWRkZWQgbmVlZGVkIHBhdGNoICR7cGF0Y2hOYW1lfSB0byAke3JlbGVhc2VCcmFuY2gucmVwb30gJHtyZWxlYXNlQnJhbmNoLmJyYW5jaH1gICk7XHJcbiAgICAgICAgICBjb3VudCsrO1xyXG4gICAgICAgICAgbWFpbnRlbmFuY2Uuc2F2ZSgpOyAvLyBzYXZlIGhlcmUgaW4gY2FzZSBhIGZ1dHVyZSBmYWlsdXJlIHdvdWxkIFwicmV2ZXJ0XCIgdGhpbmdzXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coIGBQYXRjaCAke3BhdGNoTmFtZX0gYWxyZWFkeSBpbmNsdWRlZCBpbiAke3JlbGVhc2VCcmFuY2gucmVwb30gJHtyZWxlYXNlQnJhbmNoLmJyYW5jaH1gICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyggYEFkZGVkICR7Y291bnR9IHJlbGVhc2VCcmFuY2hlcyB0byBwYXRjaDogJHtwYXRjaE5hbWV9YCApO1xyXG5cclxuICAgICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkcyBhIG5lZWRlZCBwYXRjaCB0byBhbGwgcmVsZWFzZSBicmFuY2hlcy5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0Y2hOYW1lXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyBhZGRBbGxOZWVkZWRQYXRjaGVzKCBwYXRjaE5hbWUgKSB7XHJcbiAgICAgIGF3YWl0IE1haW50ZW5hbmNlLmFkZE5lZWRlZFBhdGNoZXMoIHBhdGNoTmFtZSwgYXN5bmMgKCkgPT4gdHJ1ZSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkcyBhIG5lZWRlZCBwYXRjaCB0byBhbGwgcmVsZWFzZSBicmFuY2hlcyB0aGF0IGRvIE5PVCBpbmNsdWRlIHRoZSBnaXZlbiBjb21taXQgb24gdGhlIHJlcG9cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0Y2hOYW1lXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2hhXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyBhZGROZWVkZWRQYXRjaGVzQmVmb3JlKCBwYXRjaE5hbWUsIHNoYSApIHtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XHJcbiAgICAgIGNvbnN0IHBhdGNoID0gbWFpbnRlbmFuY2UuZmluZFBhdGNoKCBwYXRjaE5hbWUgKTtcclxuXHJcbiAgICAgIGF3YWl0IE1haW50ZW5hbmNlLmFkZE5lZWRlZFBhdGNoZXMoIHBhdGNoTmFtZSwgYXN5bmMgcmVsZWFzZUJyYW5jaCA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHJlbGVhc2VCcmFuY2guaXNNaXNzaW5nU0hBKCBwYXRjaC5yZXBvLCBzaGEgKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkcyBhIG5lZWRlZCBwYXRjaCB0byBhbGwgcmVsZWFzZSBicmFuY2hlcyB0aGF0IERPIGluY2x1ZGUgdGhlIGdpdmVuIGNvbW1pdCBvbiB0aGUgcmVwb1xyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRjaE5hbWVcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzaGFcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIGFkZE5lZWRlZFBhdGNoZXNBZnRlciggcGF0Y2hOYW1lLCBzaGEgKSB7XHJcbiAgICAgIGNvbnN0IG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpO1xyXG4gICAgICBjb25zdCBwYXRjaCA9IG1haW50ZW5hbmNlLmZpbmRQYXRjaCggcGF0Y2hOYW1lICk7XHJcblxyXG4gICAgICBhd2FpdCBNYWludGVuYW5jZS5hZGROZWVkZWRQYXRjaGVzKCBwYXRjaE5hbWUsIGFzeW5jIHJlbGVhc2VCcmFuY2ggPT4ge1xyXG4gICAgICAgIHJldHVybiByZWxlYXNlQnJhbmNoLmluY2x1ZGVzU0hBKCBwYXRjaC5yZXBvLCBzaGEgKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkcyBhIG5lZWRlZCBwYXRjaCB0byBhbGwgcmVsZWFzZSBicmFuY2hlcyB0aGF0IHNhdGlzZnkgdGhlIGdpdmVuIGZpbHRlciggcmVsZWFzZUJyYW5jaCwgYnVpbHRGaWxlU3RyaW5nIClcclxuICAgICAqIHdoZXJlIGl0IGJ1aWxkcyB0aGUgc2ltdWxhdGlvbiB3aXRoIHRoZSBkZWZhdWx0cyAoYnJhbmQ9cGhldCkgYW5kIHByb3ZpZGVzIGl0IGFzIGEgc3RyaW5nLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRjaE5hbWVcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oUmVsZWFzZUJyYW5jaCwgYnVpbHRGaWxlOnN0cmluZyk6IFByb21pc2UuPGJvb2xlYW4+fSBmaWx0ZXJcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIGFkZE5lZWRlZFBhdGNoZXNCdWlsZEZpbHRlciggcGF0Y2hOYW1lLCBmaWx0ZXIgKSB7XHJcbiAgICAgIGF3YWl0IE1haW50ZW5hbmNlLmFkZE5lZWRlZFBhdGNoZXMoIHBhdGNoTmFtZSwgYXN5bmMgcmVsZWFzZUJyYW5jaCA9PiB7XHJcbiAgICAgICAgYXdhaXQgY2hlY2tvdXRUYXJnZXQoIHJlbGVhc2VCcmFuY2gucmVwbywgcmVsZWFzZUJyYW5jaC5icmFuY2gsIHRydWUgKTtcclxuICAgICAgICBhd2FpdCBnaXRQdWxsKCByZWxlYXNlQnJhbmNoLnJlcG8gKTtcclxuICAgICAgICBhd2FpdCBidWlsZCggcmVsZWFzZUJyYW5jaC5yZXBvICk7XHJcbiAgICAgICAgY29uc3QgY2hpcHBlclZlcnNpb24gPSBDaGlwcGVyVmVyc2lvbi5nZXRGcm9tUmVwb3NpdG9yeSgpO1xyXG4gICAgICAgIGxldCBmaWxlbmFtZTtcclxuICAgICAgICBpZiAoIGNoaXBwZXJWZXJzaW9uLm1ham9yICE9PSAwICkge1xyXG4gICAgICAgICAgZmlsZW5hbWUgPSBgLi4vJHtyZWxlYXNlQnJhbmNoLnJlcG99L2J1aWxkL3BoZXQvJHtyZWxlYXNlQnJhbmNoLnJlcG99X2VuX3BoZXQuaHRtbGA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgZmlsZW5hbWUgPSBgLi4vJHtyZWxlYXNlQnJhbmNoLnJlcG99L2J1aWxkLyR7cmVsZWFzZUJyYW5jaC5yZXBvfV9lbi5odG1sYDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZpbHRlciggcmVsZWFzZUJyYW5jaCwgZnMucmVhZEZpbGVTeW5jKCBmaWxlbmFtZSwgJ3V0ZjgnICkgKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlcyBhIG5lZWRlZCBwYXRjaCBmcm9tIGEgZ2l2ZW4gbW9kaWZpZWQgYnJhbmNoLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYnJhbmNoXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0Y2hOYW1lXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyByZW1vdmVOZWVkZWRQYXRjaCggcmVwbywgYnJhbmNoLCBwYXRjaE5hbWUgKSB7XHJcbiAgICAgIGNvbnN0IG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpO1xyXG5cclxuICAgICAgY29uc3QgcGF0Y2ggPSBtYWludGVuYW5jZS5maW5kUGF0Y2goIHBhdGNoTmFtZSApO1xyXG5cclxuICAgICAgY29uc3QgbW9kaWZpZWRCcmFuY2ggPSBhd2FpdCBtYWludGVuYW5jZS5lbnN1cmVNb2RpZmllZEJyYW5jaCggcmVwbywgYnJhbmNoICk7XHJcbiAgICAgIGNvbnN0IGluZGV4ID0gbW9kaWZpZWRCcmFuY2gubmVlZGVkUGF0Y2hlcy5pbmRleE9mKCBwYXRjaCApO1xyXG4gICAgICBhc3NlcnQoIGluZGV4ID49IDAsICdDb3VsZCBub3QgZmluZCBuZWVkZWQgcGF0Y2ggb24gdGhlIG1vZGlmaWVkIGJyYW5jaCcgKTtcclxuXHJcbiAgICAgIG1vZGlmaWVkQnJhbmNoLm5lZWRlZFBhdGNoZXMuc3BsaWNlKCBpbmRleCwgMSApO1xyXG4gICAgICBtYWludGVuYW5jZS50cnlSZW1vdmluZ01vZGlmaWVkQnJhbmNoKCBtb2RpZmllZEJyYW5jaCApO1xyXG5cclxuICAgICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coIGBSZW1vdmVkIHBhdGNoICR7cGF0Y2hOYW1lfSBmcm9tICR7cmVwb30gJHticmFuY2h9YCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlcyBhIG5lZWRlZCBwYXRjaCBmcm9tIHdoYXRldmVyIHN1YnNldCBvZiAoY3VycmVudCkgcmVsZWFzZSBicmFuY2hlcyBtYXRjaCB0aGUgZmlsdGVyLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRjaE5hbWVcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oUmVsZWFzZUJyYW5jaCk6IFByb21pc2UuPGJvb2xlYW4+fSBmaWx0ZXJcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIHJlbW92ZU5lZWRlZFBhdGNoZXMoIHBhdGNoTmFtZSwgZmlsdGVyICkge1xyXG4gICAgICBjb25zdCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKTtcclxuXHJcbiAgICAgIGNvbnN0IHBhdGNoID0gbWFpbnRlbmFuY2UuZmluZFBhdGNoKCBwYXRjaE5hbWUgKTtcclxuXHJcbiAgICAgIGxldCBjb3VudCA9IDA7XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCBtb2RpZmllZEJyYW5jaCBvZiBtYWludGVuYW5jZS5tb2RpZmllZEJyYW5jaGVzICkge1xyXG4gICAgICAgIGNvbnN0IG5lZWRzUmVtb3ZhbCA9IGF3YWl0IGZpbHRlciggbW9kaWZpZWRCcmFuY2gucmVsZWFzZUJyYW5jaCApO1xyXG5cclxuICAgICAgICBpZiAoICFuZWVkc1JlbW92YWwgKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggYCAgc2tpcHBpbmcgJHttb2RpZmllZEJyYW5jaC5yZXBvfSAke21vZGlmaWVkQnJhbmNoLmJyYW5jaH1gICk7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZXJlJ3MgYWN0dWFsbHkgc29tZXRoaW5nIHRvIHJlbW92ZVxyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gbW9kaWZpZWRCcmFuY2gubmVlZGVkUGF0Y2hlcy5pbmRleE9mKCBwYXRjaCApO1xyXG4gICAgICAgIGlmICggaW5kZXggPCAwICkge1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtb2RpZmllZEJyYW5jaC5uZWVkZWRQYXRjaGVzLnNwbGljZSggaW5kZXgsIDEgKTtcclxuICAgICAgICBtYWludGVuYW5jZS50cnlSZW1vdmluZ01vZGlmaWVkQnJhbmNoKCBtb2RpZmllZEJyYW5jaCApO1xyXG4gICAgICAgIGNvdW50Kys7XHJcbiAgICAgICAgY29uc29sZS5sb2coIGBSZW1vdmVkIG5lZWRlZCBwYXRjaCAke3BhdGNoTmFtZX0gZnJvbSAke21vZGlmaWVkQnJhbmNoLnJlcG99ICR7bW9kaWZpZWRCcmFuY2guYnJhbmNofWAgKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zb2xlLmxvZyggYFJlbW92ZWQgJHtjb3VudH0gcmVsZWFzZUJyYW5jaGVzIGZyb20gcGF0Y2g6ICR7cGF0Y2hOYW1lfWAgKTtcclxuXHJcbiAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZXMgYSBuZWVkZWQgcGF0Y2ggZnJvbSBhbGwgcmVsZWFzZSBicmFuY2hlcyB0aGF0IGRvIE5PVCBpbmNsdWRlIHRoZSBnaXZlbiBjb21taXQgb24gdGhlIHJlcG9cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0Y2hOYW1lXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2hhXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyByZW1vdmVOZWVkZWRQYXRjaGVzQmVmb3JlKCBwYXRjaE5hbWUsIHNoYSApIHtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XHJcbiAgICAgIGNvbnN0IHBhdGNoID0gbWFpbnRlbmFuY2UuZmluZFBhdGNoKCBwYXRjaE5hbWUgKTtcclxuXHJcbiAgICAgIGF3YWl0IE1haW50ZW5hbmNlLnJlbW92ZU5lZWRlZFBhdGNoZXMoIHBhdGNoTmFtZSwgYXN5bmMgcmVsZWFzZUJyYW5jaCA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHJlbGVhc2VCcmFuY2guaXNNaXNzaW5nU0hBKCBwYXRjaC5yZXBvLCBzaGEgKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlcyBhIG5lZWRlZCBwYXRjaCBmcm9tIGFsbCByZWxlYXNlIGJyYW5jaGVzIHRoYXQgRE8gaW5jbHVkZSB0aGUgZ2l2ZW4gY29tbWl0IG9uIHRoZSByZXBvXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGNoTmFtZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNoYVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYXN5bmMgcmVtb3ZlTmVlZGVkUGF0Y2hlc0FmdGVyKCBwYXRjaE5hbWUsIHNoYSApIHtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XHJcbiAgICAgIGNvbnN0IHBhdGNoID0gbWFpbnRlbmFuY2UuZmluZFBhdGNoKCBwYXRjaE5hbWUgKTtcclxuXHJcbiAgICAgIGF3YWl0IE1haW50ZW5hbmNlLnJlbW92ZU5lZWRlZFBhdGNoZXMoIHBhdGNoTmFtZSwgYXN5bmMgcmVsZWFzZUJyYW5jaCA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHJlbGVhc2VCcmFuY2guaW5jbHVkZXNTSEEoIHBhdGNoLnJlcG8sIHNoYSApO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBIZWxwZXIgZm9yIGFkZGluZyBwYXRjaGVzIGJhc2VkIG9uIHNwZWNpZmljIHBhdHRlcm5zLCBlLmcuOlxyXG4gICAgICogTWFpbnRlbmFuY2UuYWRkTmVlZGVkUGF0Y2hlcyggJ3BoZXRtYXJrcycsIE1haW50ZW5hbmNlLnNpbmdsZUZpbGVSZWxlYXNlQnJhbmNoRmlsdGVyKCAnLi4vcGhldG1hcmtzL2pzL3BoZXRtYXJrcy50cycgKSwgY29udGVudCA9PiBjb250ZW50LmluY2x1ZGVzKCAnZGF0YS93cmFwcGVycycgKSApO1xyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKHN0cmluZyk6Ym9vbGVhbn1cclxuICAgICAqIEByZXR1cm5zIHtmdW5jdGlvbn1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIHNpbmdsZUZpbGVSZWxlYXNlQnJhbmNoRmlsdGVyKCBmaWxlLCBwcmVkaWNhdGUgKSB7XHJcbiAgICAgIHJldHVybiBhc3luYyByZWxlYXNlQnJhbmNoID0+IHtcclxuICAgICAgICBhd2FpdCByZWxlYXNlQnJhbmNoLmNoZWNrb3V0KCBmYWxzZSApO1xyXG5cclxuICAgICAgICBpZiAoIGZzLmV4aXN0c1N5bmMoIGZpbGUgKSApIHtcclxuICAgICAgICAgIGNvbnN0IGNvbnRlbnRzID0gZnMucmVhZEZpbGVTeW5jKCBmaWxlLCAndXRmLTgnICk7XHJcbiAgICAgICAgICByZXR1cm4gcHJlZGljYXRlKCBjb250ZW50cyApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2tzIG91dCBhIHNwZWNpZmljIFJlbGVhc2UgQnJhbmNoICh1c2luZyBsb2NhbCBjb21taXQgZGF0YSBhcyBuZWNlc3NhcnkpLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYnJhbmNoXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IG91dHB1dEpTPWZhbHNlIC0gaWYgdHJ1ZSwgb25jZSBjaGVja2VkIG91dCB0aGlzIHdpbGwgYWxzbyBydW4gYGdydW50IG91dHB1dC1qcy1wcm9qZWN0YFxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYXN5bmMgY2hlY2tvdXRCcmFuY2goIHJlcG8sIGJyYW5jaCwgb3V0cHV0SlMgPSBmYWxzZSApIHtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XHJcblxyXG4gICAgICBjb25zdCBtb2RpZmllZEJyYW5jaCA9IGF3YWl0IG1haW50ZW5hbmNlLmVuc3VyZU1vZGlmaWVkQnJhbmNoKCByZXBvLCBicmFuY2gsIHRydWUgKTtcclxuICAgICAgYXdhaXQgbW9kaWZpZWRCcmFuY2guY2hlY2tvdXQoKTtcclxuXHJcbiAgICAgIGlmICggb3V0cHV0SlMgJiYgY2hpcHBlclN1cHBvcnRzT3V0cHV0SlNHcnVudFRhc2tzKCkgKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coICdSdW5uaW5nIG91dHB1dC1qcy1wcm9qZWN0JyApO1xyXG5cclxuICAgICAgICAvLyBXZSBtaWdodCBub3QgYmUgYWJsZSB0byBydW4gdGhpcyBjb21tYW5kIVxyXG4gICAgICAgIGF3YWl0IGV4ZWN1dGUoIGdydW50Q29tbWFuZCwgWyAnb3V0cHV0LWpzLXByb2plY3QnIF0sIGAuLi8ke3JlcG99YCwge1xyXG4gICAgICAgICAgZXJyb3JzOiAncmVzb2x2ZSdcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIE5vIG5lZWQgdG8gc2F2ZSwgc2hvdWxkbid0IGJlIGNoYW5naW5nIHRoaW5nc1xyXG4gICAgICBjb25zb2xlLmxvZyggYENoZWNrZWQgb3V0ICR7cmVwb30gJHticmFuY2h9YCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXR0ZW1wdHMgdG8gYXBwbHkgcGF0Y2hlcyB0byB0aGUgbW9kaWZpZWQgYnJhbmNoZXMgdGhhdCBhcmUgbWFya2VkIGFzIG5lZWRlZC5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIGFwcGx5UGF0Y2hlcygpIHtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XHJcbiAgICAgIGxldCBudW1BcHBsaWVkID0gMDtcclxuXHJcbiAgICAgIGZvciAoIGNvbnN0IG1vZGlmaWVkQnJhbmNoIG9mIG1haW50ZW5hbmNlLm1vZGlmaWVkQnJhbmNoZXMgKSB7XHJcbiAgICAgICAgaWYgKCBtb2RpZmllZEJyYW5jaC5uZWVkZWRQYXRjaGVzLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcmVwbyA9IG1vZGlmaWVkQnJhbmNoLnJlcG87XHJcbiAgICAgICAgY29uc3QgYnJhbmNoID0gbW9kaWZpZWRCcmFuY2guYnJhbmNoO1xyXG5cclxuICAgICAgICAvLyBEZWZlbnNpdmUgY29weSwgc2luY2Ugd2UgbW9kaWZ5IGl0IGR1cmluZyBpdGVyYXRpb25cclxuICAgICAgICBmb3IgKCBjb25zdCBwYXRjaCBvZiBtb2RpZmllZEJyYW5jaC5uZWVkZWRQYXRjaGVzLnNsaWNlKCkgKSB7XHJcbiAgICAgICAgICBpZiAoIHBhdGNoLnNoYXMubGVuZ3RoID09PSAwICkge1xyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBjb25zdCBwYXRjaFJlcG8gPSBwYXRjaC5yZXBvO1xyXG5cclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIENoZWNrb3V0IHdoYXRldmVyIHRoZSBsYXRlc3QgcGF0Y2hlZCBTSEEgaXMgKGlmIHdlJ3ZlIHBhdGNoZWQgaXQpXHJcbiAgICAgICAgICAgIGlmICggbW9kaWZpZWRCcmFuY2guY2hhbmdlZERlcGVuZGVuY2llc1sgcGF0Y2hSZXBvIF0gKSB7XHJcbiAgICAgICAgICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHBhdGNoUmVwbywgbW9kaWZpZWRCcmFuY2guY2hhbmdlZERlcGVuZGVuY2llc1sgcGF0Y2hSZXBvIF0gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAvLyBMb29rIHVwIHRoZSBTSEEgdG8gY2hlY2sgb3V0XHJcbiAgICAgICAgICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHJlcG8sIGJyYW5jaCApO1xyXG4gICAgICAgICAgICAgIGF3YWl0IGdpdFB1bGwoIHJlcG8gKTtcclxuICAgICAgICAgICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCBnZXREZXBlbmRlbmNpZXMoIHJlcG8gKTtcclxuICAgICAgICAgICAgICBjb25zdCBzaGEgPSBkZXBlbmRlbmNpZXNbIHBhdGNoUmVwbyBdLnNoYTtcclxuICAgICAgICAgICAgICBhd2FpdCBnaXRDaGVja291dCggcmVwbywgJ21haW4nICk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIFRoZW4gY2hlY2sgaXQgb3V0XHJcbiAgICAgICAgICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHBhdGNoUmVwbywgc2hhICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCBgQ2hlY2tlZCBvdXQgJHtwYXRjaFJlcG99IFNIQSBmb3IgJHtyZXBvfSAke2JyYW5jaH1gICk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKCBjb25zdCBzaGEgb2YgcGF0Y2guc2hhcyApIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gSWYgdGhlIHNoYSBkb2Vzbid0IGV4aXN0IGluIHRoZSByZXBvLCB0aGVuIGdpdmUgYSBzcGVjaWZpYyBlcnJvciBmb3IgdGhhdC5cclxuICAgICAgICAgICAgICBjb25zdCBoYXNTaGEgPSAoIGF3YWl0IGV4ZWN1dGUoICdnaXQnLCBbICdjYXQtZmlsZScsICctZScsIHNoYSBdLCBgLi4vJHtwYXRjaFJlcG99YCwgeyBlcnJvcnM6ICdyZXNvbHZlJyB9ICkgKS5jb2RlID09PSAwO1xyXG4gICAgICAgICAgICAgIGlmICggIWhhc1NoYSApIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggYFNIQSBub3QgZm91bmQgaW4gJHtwYXRjaFJlcG99OiAke3NoYX1gICk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBjb25zdCBjaGVycnlQaWNrU3VjY2VzcyA9IGF3YWl0IGdpdENoZXJyeVBpY2soIHBhdGNoUmVwbywgc2hhICk7XHJcblxyXG4gICAgICAgICAgICAgIGlmICggY2hlcnJ5UGlja1N1Y2Nlc3MgKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50U0hBID0gYXdhaXQgZ2l0UmV2UGFyc2UoIHBhdGNoUmVwbywgJ0hFQUQnICk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggYENoZXJyeS1waWNrIHN1Y2Nlc3MgZm9yICR7c2hhfSwgcmVzdWx0IGlzICR7Y3VycmVudFNIQX1gICk7XHJcblxyXG4gICAgICAgICAgICAgICAgbW9kaWZpZWRCcmFuY2guY2hhbmdlZERlcGVuZGVuY2llc1sgcGF0Y2hSZXBvIF0gPSBjdXJyZW50U0hBO1xyXG4gICAgICAgICAgICAgICAgbW9kaWZpZWRCcmFuY2gubmVlZGVkUGF0Y2hlcy5zcGxpY2UoIG1vZGlmaWVkQnJhbmNoLm5lZWRlZFBhdGNoZXMuaW5kZXhPZiggcGF0Y2ggKSwgMSApO1xyXG4gICAgICAgICAgICAgICAgbnVtQXBwbGllZCsrO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIERvbid0IGluY2x1ZGUgZHVwbGljYXRlIG1lc3NhZ2VzLCBzaW5jZSBtdWx0aXBsZSBwYXRjaGVzIG1pZ2h0IGJlIGZvciBhIHNpbmdsZSBpc3N1ZVxyXG4gICAgICAgICAgICAgICAgaWYgKCAhbW9kaWZpZWRCcmFuY2gucGVuZGluZ01lc3NhZ2VzLmluY2x1ZGVzKCBwYXRjaC5tZXNzYWdlICkgKSB7XHJcbiAgICAgICAgICAgICAgICAgIG1vZGlmaWVkQnJhbmNoLnBlbmRpbmdNZXNzYWdlcy5wdXNoKCBwYXRjaC5tZXNzYWdlICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coIGBDb3VsZCBub3QgY2hlcnJ5LXBpY2sgJHtzaGF9YCApO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciggYEZhaWx1cmUgYXBwbHlpbmcgcGF0Y2ggJHtwYXRjaFJlcG99IHRvICR7cmVwb30gJHticmFuY2h9OiAke2V9YCApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIG1vZGlmaWVkQnJhbmNoLnJlcG8sICdtYWluJyApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBtYWludGVuYW5jZS5zYXZlKCk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyggYCR7bnVtQXBwbGllZH0gcGF0Y2hlcyBhcHBsaWVkYCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUHVzaGVzIGxvY2FsIGNoYW5nZXMgdXAgdG8gR2l0SHViLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oTW9kaWZpZWRCcmFuY2gpOlByb21pc2UuPGJvb2xlYW4+fSBbZmlsdGVyXSAtIE9wdGlvbmFsIGZpbHRlciwgbW9kaWZpZWQgYnJhbmNoZXMgd2lsbCBiZSBza2lwcGVkXHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiB0aGlzIHJlc29sdmVzIHRvIGZhbHNlXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyB1cGRhdGVEZXBlbmRlbmNpZXMoIGZpbHRlciApIHtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCBtb2RpZmllZEJyYW5jaCBvZiBtYWludGVuYW5jZS5tb2RpZmllZEJyYW5jaGVzICkge1xyXG4gICAgICAgIGNvbnN0IGNoYW5nZWRSZXBvcyA9IE9iamVjdC5rZXlzKCBtb2RpZmllZEJyYW5jaC5jaGFuZ2VkRGVwZW5kZW5jaWVzICk7XHJcbiAgICAgICAgaWYgKCBjaGFuZ2VkUmVwb3MubGVuZ3RoID09PSAwICkge1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIGZpbHRlciAmJiAhKCBhd2FpdCBmaWx0ZXIoIG1vZGlmaWVkQnJhbmNoICkgKSApIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCBgU2tpcHBpbmcgZGVwZW5kZW5jeSB1cGRhdGUgZm9yICR7bW9kaWZpZWRCcmFuY2gucmVwb30gJHttb2RpZmllZEJyYW5jaC5icmFuY2h9YCApO1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgLy8gTm8gTlBNIG5lZWRlZFxyXG4gICAgICAgICAgYXdhaXQgY2hlY2tvdXRUYXJnZXQoIG1vZGlmaWVkQnJhbmNoLnJlcG8sIG1vZGlmaWVkQnJhbmNoLmJyYW5jaCwgZmFsc2UgKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCBgQ2hlY2tlZCBvdXQgJHttb2RpZmllZEJyYW5jaC5yZXBvfSAke21vZGlmaWVkQnJhbmNoLmJyYW5jaH1gICk7XHJcblxyXG4gICAgICAgICAgY29uc3QgZGVwZW5kZW5jaWVzSlNPTkZpbGUgPSBgLi4vJHttb2RpZmllZEJyYW5jaC5yZXBvfS9kZXBlbmRlbmNpZXMuanNvbmA7XHJcbiAgICAgICAgICBjb25zdCBkZXBlbmRlbmNpZXNKU09OID0gSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBkZXBlbmRlbmNpZXNKU09ORmlsZSwgJ3V0Zi04JyApICk7XHJcblxyXG4gICAgICAgICAgLy8gTW9kaWZ5IHRoZSBcInNlbGZcIiBpbiB0aGUgZGVwZW5kZW5jaWVzLmpzb24gYXMgZXhwZWN0ZWRcclxuICAgICAgICAgIGRlcGVuZGVuY2llc0pTT05bIG1vZGlmaWVkQnJhbmNoLnJlcG8gXS5zaGEgPSBhd2FpdCBnaXRSZXZQYXJzZSggbW9kaWZpZWRCcmFuY2gucmVwbywgbW9kaWZpZWRCcmFuY2guYnJhbmNoICk7XHJcblxyXG4gICAgICAgICAgZm9yICggY29uc3QgZGVwZW5kZW5jeSBvZiBjaGFuZ2VkUmVwb3MgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRlcGVuZGVuY3lCcmFuY2ggPSBtb2RpZmllZEJyYW5jaC5kZXBlbmRlbmN5QnJhbmNoO1xyXG4gICAgICAgICAgICBjb25zdCBicmFuY2hlcyA9IGF3YWl0IGdldEJyYW5jaGVzKCBkZXBlbmRlbmN5ICk7XHJcbiAgICAgICAgICAgIGNvbnN0IHNoYSA9IG1vZGlmaWVkQnJhbmNoLmNoYW5nZWREZXBlbmRlbmNpZXNbIGRlcGVuZGVuY3kgXTtcclxuXHJcbiAgICAgICAgICAgIGRlcGVuZGVuY2llc0pTT05bIGRlcGVuZGVuY3kgXS5zaGEgPSBzaGE7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGJyYW5jaGVzLmluY2x1ZGVzKCBkZXBlbmRlbmN5QnJhbmNoICkgKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coIGBCcmFuY2ggJHtkZXBlbmRlbmN5QnJhbmNofSBhbHJlYWR5IGV4aXN0cyBpbiAke2RlcGVuZGVuY3l9YCApO1xyXG4gICAgICAgICAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCBkZXBlbmRlbmN5LCBkZXBlbmRlbmN5QnJhbmNoICk7XHJcbiAgICAgICAgICAgICAgYXdhaXQgZ2l0UHVsbCggZGVwZW5kZW5jeSApO1xyXG4gICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRTSEEgPSBhd2FpdCBnaXRSZXZQYXJzZSggZGVwZW5kZW5jeSwgJ0hFQUQnICk7XHJcblxyXG4gICAgICAgICAgICAgIGlmICggc2hhICE9PSBjdXJyZW50U0hBICkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coIGBBdHRlbXB0aW5nIHRvIChob3BlZnVsbHkgZmFzdC1mb3J3YXJkKSBtZXJnZSAke3NoYX1gICk7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBleGVjdXRlKCAnZ2l0JywgWyAnbWVyZ2UnLCBzaGEgXSwgYC4uLyR7ZGVwZW5kZW5jeX1gICk7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBnaXRQdXNoKCBkZXBlbmRlbmN5LCBkZXBlbmRlbmN5QnJhbmNoICk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBgQnJhbmNoICR7ZGVwZW5kZW5jeUJyYW5jaH0gZG9lcyBub3QgZXhpc3QgaW4gJHtkZXBlbmRlbmN5fSwgY3JlYXRpbmcuYCApO1xyXG4gICAgICAgICAgICAgIGF3YWl0IGdpdENoZWNrb3V0KCBkZXBlbmRlbmN5LCBzaGEgKTtcclxuICAgICAgICAgICAgICBhd2FpdCBnaXRDcmVhdGVCcmFuY2goIGRlcGVuZGVuY3ksIGRlcGVuZGVuY3lCcmFuY2ggKTtcclxuICAgICAgICAgICAgICBhd2FpdCBnaXRQdXNoKCBkZXBlbmRlbmN5LCBkZXBlbmRlbmN5QnJhbmNoICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGRlbGV0ZSBtb2RpZmllZEJyYW5jaC5jaGFuZ2VkRGVwZW5kZW5jaWVzWyBkZXBlbmRlbmN5IF07XHJcbiAgICAgICAgICAgIG1vZGlmaWVkQnJhbmNoLmRlcGxveWVkVmVyc2lvbiA9IG51bGw7XHJcbiAgICAgICAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTsgLy8gc2F2ZSBoZXJlIGluIGNhc2UgYSBmdXR1cmUgZmFpbHVyZSB3b3VsZCBcInJldmVydFwiIHRoaW5nc1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBtb2RpZmllZEJyYW5jaC5wZW5kaW5nTWVzc2FnZXMuam9pbiggJyBhbmQgJyApO1xyXG4gICAgICAgICAgZnMud3JpdGVGaWxlU3luYyggZGVwZW5kZW5jaWVzSlNPTkZpbGUsIEpTT04uc3RyaW5naWZ5KCBkZXBlbmRlbmNpZXNKU09OLCBudWxsLCAyICkgKTtcclxuICAgICAgICAgIGF3YWl0IGdpdEFkZCggbW9kaWZpZWRCcmFuY2gucmVwbywgJ2RlcGVuZGVuY2llcy5qc29uJyApO1xyXG4gICAgICAgICAgYXdhaXQgZ2l0Q29tbWl0KCBtb2RpZmllZEJyYW5jaC5yZXBvLCBgdXBkYXRlZCBkZXBlbmRlbmNpZXMuanNvbiBmb3IgJHttZXNzYWdlfWAgKTtcclxuICAgICAgICAgIGF3YWl0IGdpdFB1c2goIG1vZGlmaWVkQnJhbmNoLnJlcG8sIG1vZGlmaWVkQnJhbmNoLmJyYW5jaCApO1xyXG5cclxuICAgICAgICAgIC8vIE1vdmUgbWVzc2FnZXMgZnJvbSBwZW5kaW5nIHRvIHB1c2hlZFxyXG4gICAgICAgICAgZm9yICggY29uc3QgbWVzc2FnZSBvZiBtb2RpZmllZEJyYW5jaC5wZW5kaW5nTWVzc2FnZXMgKSB7XHJcbiAgICAgICAgICAgIGlmICggIW1vZGlmaWVkQnJhbmNoLnB1c2hlZE1lc3NhZ2VzLmluY2x1ZGVzKCBtZXNzYWdlICkgKSB7XHJcbiAgICAgICAgICAgICAgbW9kaWZpZWRCcmFuY2gucHVzaGVkTWVzc2FnZXMucHVzaCggbWVzc2FnZSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBtb2RpZmllZEJyYW5jaC5wZW5kaW5nTWVzc2FnZXMgPSBbXTtcclxuICAgICAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTsgLy8gc2F2ZSBoZXJlIGluIGNhc2UgYSBmdXR1cmUgZmFpbHVyZSB3b3VsZCBcInJldmVydFwiIHRoaW5nc1xyXG5cclxuICAgICAgICAgIGF3YWl0IGNoZWNrb3V0TWFpbiggbW9kaWZpZWRCcmFuY2gucmVwbywgZmFsc2UgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgICBtYWludGVuYW5jZS5zYXZlKCk7XHJcblxyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBgRmFpbHVyZSB1cGRhdGluZyBkZXBlbmRlbmNpZXMgZm9yICR7bW9kaWZpZWRCcmFuY2gucmVwb30gdG8gJHttb2RpZmllZEJyYW5jaC5icmFuY2h9OiAke2V9YCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coICdEZXBlbmRlbmNpZXMgdXBkYXRlZCcgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIERlcGxveXMgUkMgdmVyc2lvbnMgb2YgdGhlIG1vZGlmaWVkIGJyYW5jaGVzIHRoYXQgbmVlZCBpdC5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE1vZGlmaWVkQnJhbmNoKTpQcm9taXNlLjxib29sZWFuPn0gW2ZpbHRlcl0gLSBPcHRpb25hbCBmaWx0ZXIsIG1vZGlmaWVkIGJyYW5jaGVzIHdpbGwgYmUgc2tpcHBlZFxyXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgdGhpcyByZXNvbHZlcyB0byBmYWxzZVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYXN5bmMgZGVwbG95UmVsZWFzZUNhbmRpZGF0ZXMoIGZpbHRlciApIHtcclxuICAgICAgY29uc3QgbWFpbnRlbmFuY2UgPSBNYWludGVuYW5jZS5sb2FkKCk7XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCBtb2RpZmllZEJyYW5jaCBvZiBtYWludGVuYW5jZS5tb2RpZmllZEJyYW5jaGVzICkge1xyXG4gICAgICAgIGlmICggIW1vZGlmaWVkQnJhbmNoLmlzUmVhZHlGb3JSZWxlYXNlQ2FuZGlkYXRlIHx8ICFtb2RpZmllZEJyYW5jaC5yZWxlYXNlQnJhbmNoLmlzUmVsZWFzZWQgKSB7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKCAnPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09JyApO1xyXG5cclxuICAgICAgICBpZiAoIGZpbHRlciAmJiAhKCBhd2FpdCBmaWx0ZXIoIG1vZGlmaWVkQnJhbmNoICkgKSApIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCBgU2tpcHBpbmcgUkMgZGVwbG95IGZvciAke21vZGlmaWVkQnJhbmNoLnJlcG99ICR7bW9kaWZpZWRCcmFuY2guYnJhbmNofWAgKTtcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCBgUnVubmluZyBSQyBkZXBsb3kgZm9yICR7bW9kaWZpZWRCcmFuY2gucmVwb30gJHttb2RpZmllZEJyYW5jaC5icmFuY2h9YCApO1xyXG5cclxuICAgICAgICAgIGNvbnN0IHZlcnNpb24gPSBhd2FpdCByYyggbW9kaWZpZWRCcmFuY2gucmVwbywgbW9kaWZpZWRCcmFuY2guYnJhbmNoLCBtb2RpZmllZEJyYW5jaC5icmFuZHMsIHRydWUsIG1vZGlmaWVkQnJhbmNoLnB1c2hlZE1lc3NhZ2VzLmpvaW4oICcsICcgKSApO1xyXG4gICAgICAgICAgbW9kaWZpZWRCcmFuY2guZGVwbG95ZWRWZXJzaW9uID0gdmVyc2lvbjtcclxuICAgICAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTsgLy8gc2F2ZSBoZXJlIGluIGNhc2UgYSBmdXR1cmUgZmFpbHVyZSB3b3VsZCBcInJldmVydFwiIHRoaW5nc1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCggZSApIHtcclxuICAgICAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTtcclxuXHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIGBGYWlsdXJlIHdpdGggUkMgZGVwbG95IGZvciAke21vZGlmaWVkQnJhbmNoLnJlcG99IHRvICR7bW9kaWZpZWRCcmFuY2guYnJhbmNofTogJHtlfWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKCAnUkMgdmVyc2lvbnMgZGVwbG95ZWQnICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEZXBsb3lzIHByb2R1Y3Rpb24gdmVyc2lvbnMgb2YgdGhlIG1vZGlmaWVkIGJyYW5jaGVzIHRoYXQgbmVlZCBpdC5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKE1vZGlmaWVkQnJhbmNoKTpQcm9taXNlLjxib29sZWFuPn0gW2ZpbHRlcl0gLSBPcHRpb25hbCBmaWx0ZXIsIG1vZGlmaWVkIGJyYW5jaGVzIHdpbGwgYmUgc2tpcHBlZFxyXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgdGhpcyByZXNvbHZlcyB0byBmYWxzZVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYXN5bmMgZGVwbG95UHJvZHVjdGlvbiggZmlsdGVyICkge1xyXG4gICAgICBjb25zdCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKTtcclxuXHJcbiAgICAgIGZvciAoIGNvbnN0IG1vZGlmaWVkQnJhbmNoIG9mIG1haW50ZW5hbmNlLm1vZGlmaWVkQnJhbmNoZXMgKSB7XHJcbiAgICAgICAgaWYgKCAhbW9kaWZpZWRCcmFuY2guaXNSZWFkeUZvclByb2R1Y3Rpb24gfHwgIW1vZGlmaWVkQnJhbmNoLnJlbGVhc2VCcmFuY2guaXNSZWxlYXNlZCApIHtcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCBmaWx0ZXIgJiYgISggYXdhaXQgZmlsdGVyKCBtb2RpZmllZEJyYW5jaCApICkgKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggYFNraXBwaW5nIHByb2R1Y3Rpb24gZGVwbG95IGZvciAke21vZGlmaWVkQnJhbmNoLnJlcG99ICR7bW9kaWZpZWRCcmFuY2guYnJhbmNofWAgKTtcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCBgUnVubmluZyBwcm9kdWN0aW9uIGRlcGxveSBmb3IgJHttb2RpZmllZEJyYW5jaC5yZXBvfSAke21vZGlmaWVkQnJhbmNoLmJyYW5jaH1gICk7XHJcblxyXG4gICAgICAgICAgY29uc3QgdmVyc2lvbiA9IGF3YWl0IHByb2R1Y3Rpb24oIG1vZGlmaWVkQnJhbmNoLnJlcG8sIG1vZGlmaWVkQnJhbmNoLmJyYW5jaCwgbW9kaWZpZWRCcmFuY2guYnJhbmRzLCB0cnVlLCBmYWxzZSwgbW9kaWZpZWRCcmFuY2gucHVzaGVkTWVzc2FnZXMuam9pbiggJywgJyApICk7XHJcbiAgICAgICAgICBtb2RpZmllZEJyYW5jaC5kZXBsb3llZFZlcnNpb24gPSB2ZXJzaW9uO1xyXG4gICAgICAgICAgbW9kaWZpZWRCcmFuY2gucHVzaGVkTWVzc2FnZXMgPSBbXTtcclxuICAgICAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTsgLy8gc2F2ZSBoZXJlIGluIGNhc2UgYSBmdXR1cmUgZmFpbHVyZSB3b3VsZCBcInJldmVydFwiIHRoaW5nc1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCggZSApIHtcclxuICAgICAgICAgIG1haW50ZW5hbmNlLnNhdmUoKTtcclxuXHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIGBGYWlsdXJlIHdpdGggcHJvZHVjdGlvbiBkZXBsb3kgZm9yICR7bW9kaWZpZWRCcmFuY2gucmVwb30gdG8gJHttb2RpZmllZEJyYW5jaC5icmFuY2h9OiAke2V9YCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coICdwcm9kdWN0aW9uIHZlcnNpb25zIGRlcGxveWVkJyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlIGEgc2VwYXJhdGUgZGlyZWN0b3J5IGZvciBlYWNoIHJlbGVhc2UgYnJhbmNoLiBUaGlzIGRvZXMgbm90IGludGVyZmFjZSB3aXRoIHRoZSBzYXZlZCBtYWludGVuYW5jZSBzdGF0ZSBhdFxyXG4gICAgICogYWxsLCBhbmQgaW5zdGVhZCBqdXN0IGxvb2tzIGF0IHRoZSBjb21taXR0ZWQgZGVwZW5kZW5jaWVzLmpzb24gd2hlbiB1cGRhdGluZy5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKFJlbGVhc2VCcmFuY2gpOlByb21pc2UuPGJvb2xlYW4+fSBbZmlsdGVyXSAtIE9wdGlvbmFsIGZpbHRlciwgcmVsZWFzZSBicmFuY2hlcyB3aWxsIGJlIHNraXBwZWRcclxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgdGhpcyByZXNvbHZlcyB0byBmYWxzZVxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIGJ1aWxkPWZhbHNlIC0gdG8gb3B0IG91dCBvZiBidWlsZGluZywgc2V0IHRvIGZhbHNlLlxyXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zcGlsZT1mYWxzZSAtIHRvIG9wdCBvdXQgb2YgdHJhbnNwaWxpbmcsIHNldCB0byBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIHVwZGF0ZUNoZWNrb3V0cyggZmlsdGVyLCBvcHRpb25zICkge1xyXG4gICAgICBvcHRpb25zID0gXy5tZXJnZSgge1xyXG4gICAgICAgIGNvbmN1cnJlbnQ6IDUsXHJcbiAgICAgICAgYnVpbGQ6IHRydWUsXHJcbiAgICAgICAgdHJhbnNwaWxlOiB0cnVlLFxyXG4gICAgICAgIGJ1aWxkT3B0aW9uczogeyBsaW50OiB0cnVlIH1cclxuICAgICAgfSwgb3B0aW9ucyApO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coIGBVcGRhdGluZyBjaGVja291dHMgKHJ1bm5pbmcgaW4gcGFyYWxsZWwgd2l0aCAke29wdGlvbnMuY29uY3VycmVudH0gdGhyZWFkcylgICk7XHJcblxyXG4gICAgICBjb25zdCByZWxlYXNlQnJhbmNoZXMgPSBhd2FpdCBNYWludGVuYW5jZS5nZXRNYWludGVuYW5jZUJyYW5jaGVzKCk7XHJcblxyXG4gICAgICBjb25zdCBmaWx0ZXJlZEJyYW5jaGVzID0gW107XHJcblxyXG4gICAgICAvLyBSdW4gYWxsIGZpbHRlcmluZyBpbiBhIHN0ZXAgYmVmb3JlIHRoZSBwYXJhbGxlbCBzdGVwLiBUaGlzIHdheSB0aGUgZmlsdGVyIGhhcyBmdWxsIGFjY2VzcyB0byByZXBvcyBhbmQgZ2l0IGNvbW1hbmRzIHdpdGhvdXQgcmFjZSBjb25kaXRpb25zLCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGVyZW5uaWFsL2lzc3Vlcy8zNDFcclxuICAgICAgZm9yICggY29uc3QgcmVsZWFzZUJyYW5jaCBvZiByZWxlYXNlQnJhbmNoZXMgKSB7XHJcbiAgICAgICAgaWYgKCAhZmlsdGVyIHx8IGF3YWl0IGZpbHRlciggcmVsZWFzZUJyYW5jaCApICkge1xyXG4gICAgICAgICAgZmlsdGVyZWRCcmFuY2hlcy5wdXNoKCByZWxlYXNlQnJhbmNoICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyggYEZpbHRlciBhcHBsaWVkLiBVcGRhdGluZyAke2ZpbHRlcmVkQnJhbmNoZXMubGVuZ3RofTpgLCBmaWx0ZXJlZEJyYW5jaGVzLm1hcCggeCA9PiB4LnRvU3RyaW5nKCkgKSApO1xyXG5cclxuICAgICAgY29uc3QgYXN5bmNGdW5jdGlvbnMgPSBmaWx0ZXJlZEJyYW5jaGVzLm1hcCggcmVsZWFzZUJyYW5jaCA9PiAoIGFzeW5jICgpID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyggJ0JlZ2lubmluZzogJywgcmVsZWFzZUJyYW5jaC50b1N0cmluZygpICk7XHJcbiAgICAgICAgdHJ5IHtcclxuXHJcbiAgICAgICAgICBhd2FpdCByZWxlYXNlQnJhbmNoLnVwZGF0ZUNoZWNrb3V0KCk7XHJcblxyXG4gICAgICAgICAgb3B0aW9ucy50cmFuc3BpbGUgJiYgYXdhaXQgcmVsZWFzZUJyYW5jaC50cmFuc3BpbGUoKTtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIG9wdGlvbnMuYnVpbGQgJiYgYXdhaXQgcmVsZWFzZUJyYW5jaC5idWlsZCggb3B0aW9ucy5idWlsZE9wdGlvbnMgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNhdGNoKCBlICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyggYGZhaWxlZCB0byBidWlsZCAke3JlbGVhc2VCcmFuY2gudG9TdHJpbmcoKX06ICR7ZX1gICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoKCBlICkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coIGBmYWlsZWQgdG8gdXBkYXRlIHJlbGVhc2VCcmFuY2ggJHtyZWxlYXNlQnJhbmNoLnRvU3RyaW5nKCl9OiAke2V9YCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApICk7XHJcblxyXG4gICAgICBhd2FpdCBhc3luY3EucGFyYWxsZWxMaW1pdCggYXN5bmNGdW5jdGlvbnMsIG9wdGlvbnMuY29uY3VycmVudCApO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coICdEb25lJyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb24oUmVsZWFzZUJyYW5jaCk6UHJvbWlzZS48Ym9vbGVhbj59IFtmaWx0ZXJdIC0gT3B0aW9uYWwgZmlsdGVyLCByZWxlYXNlIGJyYW5jaGVzIHdpbGwgYmUgc2tpcHBlZFxyXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiB0aGlzIHJlc29sdmVzIHRvIGZhbHNlXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyBjaGVja1VuYnVpbHRDaGVja291dHMoIGZpbHRlciApIHtcclxuICAgICAgY29uc29sZS5sb2coICdDaGVja2luZyB1bmJ1aWx0IGNoZWNrb3V0cycgKTtcclxuXHJcbiAgICAgIGNvbnN0IHJlbGVhc2VCcmFuY2hlcyA9IGF3YWl0IE1haW50ZW5hbmNlLmdldE1haW50ZW5hbmNlQnJhbmNoZXMoKTtcclxuICAgICAgZm9yICggY29uc3QgcmVsZWFzZUJyYW5jaCBvZiByZWxlYXNlQnJhbmNoZXMgKSB7XHJcbiAgICAgICAgaWYgKCAhZmlsdGVyIHx8IGF3YWl0IGZpbHRlciggcmVsZWFzZUJyYW5jaCApICkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coIHJlbGVhc2VCcmFuY2gudG9TdHJpbmcoKSApO1xyXG4gICAgICAgICAgY29uc3QgdW5idWlsdFJlc3VsdCA9IGF3YWl0IHJlbGVhc2VCcmFuY2guY2hlY2tVbmJ1aWx0KCk7XHJcbiAgICAgICAgICBpZiAoIHVuYnVpbHRSZXN1bHQgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCB1bmJ1aWx0UmVzdWx0ICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbihSZWxlYXNlQnJhbmNoKTpQcm9taXNlLjxib29sZWFuPn0gW2ZpbHRlcl0gLSBPcHRpb25hbCBmaWx0ZXIsIHJlbGVhc2UgYnJhbmNoZXMgd2lsbCBiZSBza2lwcGVkXHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHRoaXMgcmVzb2x2ZXMgdG8gZmFsc2VcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIGNoZWNrQnVpbHRDaGVja291dHMoIGZpbHRlciApIHtcclxuICAgICAgY29uc29sZS5sb2coICdDaGVja2luZyBidWlsdCBjaGVja291dHMnICk7XHJcblxyXG4gICAgICBjb25zdCByZWxlYXNlQnJhbmNoZXMgPSBhd2FpdCBNYWludGVuYW5jZS5nZXRNYWludGVuYW5jZUJyYW5jaGVzKCk7XHJcbiAgICAgIGZvciAoIGNvbnN0IHJlbGVhc2VCcmFuY2ggb2YgcmVsZWFzZUJyYW5jaGVzICkge1xyXG4gICAgICAgIGlmICggIWZpbHRlciB8fCBhd2FpdCBmaWx0ZXIoIHJlbGVhc2VCcmFuY2ggKSApIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCByZWxlYXNlQnJhbmNoLnRvU3RyaW5nKCkgKTtcclxuICAgICAgICAgIGNvbnN0IGJ1aWx0UmVzdWx0ID0gYXdhaXQgcmVsZWFzZUJyYW5jaC5jaGVja0J1aWx0KCk7XHJcbiAgICAgICAgICBpZiAoIGJ1aWx0UmVzdWx0ICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyggYnVpbHRSZXN1bHQgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlZGVwbG95cyBwcm9kdWN0aW9uIHZlcnNpb25zIG9mIGFsbCByZWxlYXNlIGJyYW5jaGVzIChvciB0aG9zZSBtYXRjaGluZyBhIHNwZWNpZmljIGZpbHRlclxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIE5PVEU6IFRoaXMgZG9lcyBub3QgdXNlIHRoZSBjdXJyZW50IG1haW50ZW5hbmNlIHN0YXRlIVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIC0gR2VuZXJhbGx5IGFuIGlzc3VlIHRvIHJlZmVyZW5jZVxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbihSZWxlYXNlQnJhbmNoKTpQcm9taXNlLjxib29sZWFuPn0gW2ZpbHRlcl0gLSBPcHRpb25hbCBmaWx0ZXIsIHJlbGVhc2UgYnJhbmNoZXMgd2lsbCBiZSBza2lwcGVkXHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiB0aGlzIHJlc29sdmVzIHRvIGZhbHNlXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyByZWRlcGxveUFsbFByb2R1Y3Rpb24oIG1lc3NhZ2UsIGZpbHRlciApIHtcclxuICAgICAgLy8gSWdub3JlIHVucmVsZWFzZWQgYnJhbmNoZXMhXHJcbiAgICAgIGNvbnN0IHJlbGVhc2VCcmFuY2hlcyA9IGF3YWl0IE1haW50ZW5hbmNlLmdldE1haW50ZW5hbmNlQnJhbmNoZXMoICgpID0+IHRydWUsIGZhbHNlICk7XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCByZWxlYXNlQnJhbmNoIG9mIHJlbGVhc2VCcmFuY2hlcyApIHtcclxuICAgICAgICBpZiAoIGZpbHRlciAmJiAhKCBhd2FpdCBmaWx0ZXIoIHJlbGVhc2VCcmFuY2ggKSApICkge1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyggcmVsZWFzZUJyYW5jaC50b1N0cmluZygpICk7XHJcbiAgICAgICAgYXdhaXQgcmMoIHJlbGVhc2VCcmFuY2gucmVwbywgcmVsZWFzZUJyYW5jaC5icmFuY2gsIHJlbGVhc2VCcmFuY2guYnJhbmRzLCB0cnVlLCBtZXNzYWdlICk7XHJcbiAgICAgICAgYXdhaXQgcHJvZHVjdGlvbiggcmVsZWFzZUJyYW5jaC5yZXBvLCByZWxlYXNlQnJhbmNoLmJyYW5jaCwgcmVsZWFzZUJyYW5jaC5icmFuZHMsIHRydWUsIGZhbHNlLCBtZXNzYWdlICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKCAnRmluaXNoZWQgcmVkZXBsb3lpbmcnICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgcHJvdG90eXBlIGNvcHkgb2YgTWFpbnRlbmFuY2UuZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcygpLCBpbiB3aGljaCB3ZSB3aWxsIG11dGF0ZSB0aGUgY2xhc3MncyBhbGxSZWxlYXNlQnJhbmNoZXNcclxuICAgICAqIHRvIGVuc3VyZSB0aGVyZSBpcyBubyBzYXZlL2xvYWQgb3JkZXIgZGVwZW5kZW5jeSBwcm9ibGVtcy5cclxuICAgICAqXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9uKFJlbGVhc2VCcmFuY2gpOmJvb2xlYW59IGZpbHRlclJlcG8gLSByZXR1cm4gZmFsc2UgaWYgdGhlIFJlbGVhc2VCcmFuY2ggc2hvdWxkIGJlIGV4Y2x1ZGVkLlxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2hlY2tVbnJlbGVhc2VkQnJhbmNoZXMgLSBJZiBmYWxzZSwgd2lsbCBza2lwIGNoZWNraW5nIGZvciB1bnJlbGVhc2VkIGJyYW5jaGVzLiBUaGlzIGNoZWNraW5nIG5lZWRzIGFsbCByZXBvcyBjaGVja2VkIG91dFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBmb3JjZUNhY2hlQnJlYWs9ZmFsc2UgLSB0cnVlIGlmIHlvdSB3YW50IHRvIGZvcmNlIGEgcmVjYWxjdWxhdGlvbiBvZiBhbGwgUmVsZWFzZUJyYW5jaGVzXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48QXJyYXkuPFJlbGVhc2VCcmFuY2g+Pn1cclxuICAgICAqIEByZWplY3RzIHtFeGVjdXRlRXJyb3J9XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGdldE1haW50ZW5hbmNlQnJhbmNoZXMoIGZpbHRlclJlcG8gPSAoKSA9PiB0cnVlLCBjaGVja1VucmVsZWFzZWRCcmFuY2hlcyA9IHRydWUsIGZvcmNlQ2FjaGVCcmVhayA9IGZhbHNlICkge1xyXG4gICAgICByZXR1cm4gTWFpbnRlbmFuY2UuZ2V0TWFpbnRlbmFuY2VCcmFuY2hlcyggZmlsdGVyUmVwbywgY2hlY2tVbnJlbGVhc2VkQnJhbmNoZXMsIGZvcmNlQ2FjaGVCcmVhaywgdGhpcyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbihSZWxlYXNlQnJhbmNoKTpib29sZWFufSBmaWx0ZXJSZXBvIC0gcmV0dXJuIGZhbHNlIGlmIHRoZSBSZWxlYXNlQnJhbmNoIHNob3VsZCBiZSBleGNsdWRlZC5cclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNoZWNrVW5yZWxlYXNlZEJyYW5jaGVzIC0gSWYgZmFsc2UsIHdpbGwgc2tpcCBjaGVja2luZyBmb3IgdW5yZWxlYXNlZCBicmFuY2hlcy4gVGhpcyBjaGVja2luZyBuZWVkcyBhbGwgcmVwb3MgY2hlY2tlZCBvdXRcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gZm9yY2VDYWNoZUJyZWFrPWZhbHNlIC0gdHJ1ZSBpZiB5b3Ugd2FudCB0byBmb3JjZSBhIHJlY2FsY3VsYXRpb24gb2YgYWxsIFJlbGVhc2VCcmFuY2hlc1xyXG4gICAgIEBwYXJhbSB7TWFpbnRlbmFuY2V9IG1haW50ZW5hbmNlPU1haW50ZW5hbmNlLmxvYWQoKSAtIGJ5IGRlZmF1bHQgbG9hZCBmcm9tIHNhdmVkIGZpbGUgdGhlIGN1cnJlbnQgbWFpbnRlbmFuY2UgaW5zdGFuY2UuXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48QXJyYXkuPFJlbGVhc2VCcmFuY2g+Pn1cclxuICAgICAqIEByZWplY3RzIHtFeGVjdXRlRXJyb3J9XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyBnZXRNYWludGVuYW5jZUJyYW5jaGVzKCBmaWx0ZXJSZXBvID0gKCkgPT4gdHJ1ZSwgY2hlY2tVbnJlbGVhc2VkQnJhbmNoZXMgPSB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlQ2FjaGVCcmVhayA9IGZhbHNlLCBtYWludGVuYW5jZSA9IE1haW50ZW5hbmNlLmxvYWQoKSApIHtcclxuICAgICAgY29uc3QgcmVsZWFzZUJyYW5jaGVzID0gYXdhaXQgTWFpbnRlbmFuY2UubG9hZEFsbE1haW50ZW5hbmNlQnJhbmNoZXMoIGZvcmNlQ2FjaGVCcmVhaywgbWFpbnRlbmFuY2UgKTtcclxuXHJcbiAgICAgIHJldHVybiByZWxlYXNlQnJhbmNoZXMuZmlsdGVyKCByZWxlYXNlQnJhbmNoID0+IHtcclxuICAgICAgICBpZiAoICFjaGVja1VucmVsZWFzZWRCcmFuY2hlcyAmJiAhcmVsZWFzZUJyYW5jaC5pc1JlbGVhc2VkICkge1xyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmlsdGVyUmVwbyggcmVsZWFzZUJyYW5jaCApO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMb2FkcyBldmVyeSBwb3RlbnRpYWwgUmVsZWFzZUJyYW5jaCAocHVibGlzaGVkIHBoZXQgYW5kIHBoZXQtaW8gYnJhbmRzLCBhcyB3ZWxsIGFzIHVucmVsZWFzZWQgYnJhbmNoZXMpLCBhbmRcclxuICAgICAqIHNhdmVzIGl0IHRvIHRoZSBtYWludGVuYW5jZSBzdGF0ZS5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBDYWxsIHRoaXMgd2l0aCB0cnVlIHRvIGJyZWFrIHRoZSBjYWNoZSBhbmQgZm9yY2UgYSByZWNhbGN1bGF0aW9uIG9mIGFsbCBSZWxlYXNlQnJhbmNoZXNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGZvcmNlQ2FjaGVCcmVhaz1mYWxzZSAtIHRydWUgaWYgeW91IHdhbnQgdG8gZm9yY2UgYSByZWNhbGN1bGF0aW9uIG9mIGFsbCBSZWxlYXNlQnJhbmNoZXNcclxuICAgICAqIEBwYXJhbSB7TWFpbnRlbmFuY2V9IG1haW50ZW5hbmNlPU1haW50ZW5hbmNlLmxvYWQoKSAtIGJ5IGRlZmF1bHQgbG9hZCBmcm9tIHNhdmVkIGZpbGUgdGhlIGN1cnJlbnQgbWFpbnRlbmFuY2UgaW5zdGFuY2UuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlbGVhc2VCcmFuY2hbXT59XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyBsb2FkQWxsTWFpbnRlbmFuY2VCcmFuY2hlcyggZm9yY2VDYWNoZUJyZWFrID0gZmFsc2UsIG1haW50ZW5hbmNlID0gTWFpbnRlbmFuY2UubG9hZCgpICkge1xyXG5cclxuICAgICAgbGV0IHJlbGVhc2VCcmFuY2hlcyA9IG51bGw7XHJcbiAgICAgIGlmICggbWFpbnRlbmFuY2UuYWxsUmVsZWFzZUJyYW5jaGVzLmxlbmd0aCA+IDAgJiYgIWZvcmNlQ2FjaGVCcmVhayApIHtcclxuICAgICAgICBhc3NlcnQoIG1haW50ZW5hbmNlLmFsbFJlbGVhc2VCcmFuY2hlc1sgMCBdIGluc3RhbmNlb2YgUmVsZWFzZUJyYW5jaCwgJ2Rlc2VyaWFsaXphdGlvbiBjaGVjaycgKTtcclxuICAgICAgICByZWxlYXNlQnJhbmNoZXMgPSBtYWludGVuYW5jZS5hbGxSZWxlYXNlQnJhbmNoZXM7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgIC8vIGNhY2hlIG1pc3NcclxuICAgICAgICByZWxlYXNlQnJhbmNoZXMgPSBhd2FpdCBSZWxlYXNlQnJhbmNoLmdldEFsbE1haW50ZW5hbmNlQnJhbmNoZXMoKTtcclxuICAgICAgICBtYWludGVuYW5jZS5hbGxSZWxlYXNlQnJhbmNoZXMgPSByZWxlYXNlQnJhbmNoZXM7XHJcbiAgICAgICAgbWFpbnRlbmFuY2Uuc2F2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcmVsZWFzZUJyYW5jaGVzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29udmVydCBpbnRvIGEgcGxhaW4gSlMgb2JqZWN0IG1lYW50IGZvciBKU09OIHNlcmlhbGl6YXRpb24uXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1NlcmlhbGl6ZWRNYWludGVuYW5jZX0gLSBzZWUgUGF0Y2guc2VyaWFsaXplKCkgYW5kIE1vZGlmaWVkQnJhbmNoLnNlcmlhbGl6ZSgpXHJcbiAgICAgKi9cclxuICAgIHNlcmlhbGl6ZSgpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBwYXRjaGVzOiB0aGlzLnBhdGNoZXMubWFwKCBwYXRjaCA9PiBwYXRjaC5zZXJpYWxpemUoKSApLFxyXG4gICAgICAgIG1vZGlmaWVkQnJhbmNoZXM6IHRoaXMubW9kaWZpZWRCcmFuY2hlcy5tYXAoIG1vZGlmaWVkQnJhbmNoID0+IG1vZGlmaWVkQnJhbmNoLnNlcmlhbGl6ZSgpICksXHJcbiAgICAgICAgYWxsUmVsZWFzZUJyYW5jaGVzOiB0aGlzLmFsbFJlbGVhc2VCcmFuY2hlcy5tYXAoIHJlbGVhc2VCcmFuY2ggPT4gcmVsZWFzZUJyYW5jaC5zZXJpYWxpemUoKSApXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUYWtlcyBhIHNlcmlhbGl6ZWQgZm9ybSBvZiB0aGUgTWFpbnRlbmFuY2UgYW5kIHJldHVybnMgYW4gYWN0dWFsIGluc3RhbmNlLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U2VyaWFsaXplZE1haW50ZW5hbmNlfSAtIHNlZSBNYWludGVuYW5jZS5zZXJpYWxpemUoKVxyXG4gICAgICogQHJldHVybnMge01haW50ZW5hbmNlfVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZGVzZXJpYWxpemUoIHsgcGF0Y2hlcyA9IFtdLCBtb2RpZmllZEJyYW5jaGVzID0gW10sIGFsbFJlbGVhc2VCcmFuY2hlcyA9IFtdIH0gKSB7XHJcbiAgICAgIC8vIFBhc3MgaW4gcGF0Y2ggcmVmZXJlbmNlcyB0byBicmFuY2ggZGVzZXJpYWxpemF0aW9uXHJcbiAgICAgIGNvbnN0IGRlc2VyaWFsaXplZFBhdGNoZXMgPSBwYXRjaGVzLm1hcCggUGF0Y2guZGVzZXJpYWxpemUgKTtcclxuICAgICAgbW9kaWZpZWRCcmFuY2hlcyA9IG1vZGlmaWVkQnJhbmNoZXMubWFwKCBtb2RpZmllZEJyYW5jaCA9PiBNb2RpZmllZEJyYW5jaC5kZXNlcmlhbGl6ZSggbW9kaWZpZWRCcmFuY2gsIGRlc2VyaWFsaXplZFBhdGNoZXMgKSApO1xyXG4gICAgICBtb2RpZmllZEJyYW5jaGVzLnNvcnQoICggYSwgYiApID0+IHtcclxuICAgICAgICBpZiAoIGEucmVwbyAhPT0gYi5yZXBvICkge1xyXG4gICAgICAgICAgcmV0dXJuIGEucmVwbyA8IGIucmVwbyA/IC0xIDogMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBhLmJyYW5jaCAhPT0gYi5icmFuY2ggKSB7XHJcbiAgICAgICAgICByZXR1cm4gYS5icmFuY2ggPCBiLmJyYW5jaCA/IC0xIDogMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgIH0gKTtcclxuICAgICAgY29uc3QgZGVzZXJpYWxpemVkUmVsZWFzZUJyYW5jaGVzID0gYWxsUmVsZWFzZUJyYW5jaGVzLm1hcCggcmVsZWFzZUJyYW5jaCA9PiBSZWxlYXNlQnJhbmNoLmRlc2VyaWFsaXplKCByZWxlYXNlQnJhbmNoICkgKTtcclxuXHJcbiAgICAgIHJldHVybiBuZXcgTWFpbnRlbmFuY2UoIGRlc2VyaWFsaXplZFBhdGNoZXMsIG1vZGlmaWVkQnJhbmNoZXMsIGRlc2VyaWFsaXplZFJlbGVhc2VCcmFuY2hlcyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2F2ZXMgdGhlIHN0YXRlIG9mIHRoaXMgb2JqZWN0IGludG8gdGhlIG1haW50ZW5hbmNlIGZpbGUuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKi9cclxuICAgIHNhdmUoKSB7XHJcbiAgICAgIHJldHVybiBmcy53cml0ZUZpbGVTeW5jKCBNQUlOVEVOQU5DRV9GSUxFLCBKU09OLnN0cmluZ2lmeSggdGhpcy5zZXJpYWxpemUoKSwgbnVsbCwgMiApICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMb2FkcyBhIG5ldyBNYWludGVuYW5jZSBvYmplY3QgKGlmIHBvc3NpYmxlKSBmcm9tIHRoZSBtYWludGVuYW5jZSBmaWxlLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtNYWludGVuYW5jZX1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGxvYWQoKSB7XHJcbiAgICAgIGlmICggZnMuZXhpc3RzU3luYyggTUFJTlRFTkFOQ0VfRklMRSApICkge1xyXG4gICAgICAgIHJldHVybiBNYWludGVuYW5jZS5kZXNlcmlhbGl6ZSggSlNPTi5wYXJzZSggZnMucmVhZEZpbGVTeW5jKCBNQUlOVEVOQU5DRV9GSUxFLCAndXRmOCcgKSApICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBNYWludGVuYW5jZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTdGFydHMgYSBjb21tYW5kLWxpbmUgUkVQTCB3aXRoIGZlYXR1cmVzIGxvYWRlZC5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIHN0YXJ0UkVQTCgpIHtcclxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKCAoIHJlc29sdmUsIHJlamVjdCApID0+IHtcclxuICAgICAgICB3aW5zdG9uLmRlZmF1bHQudHJhbnNwb3J0cy5jb25zb2xlLmxldmVsID0gJ2Vycm9yJztcclxuXHJcbiAgICAgICAgY29uc3Qgc2Vzc2lvbiA9IHJlcGwuc3RhcnQoIHtcclxuICAgICAgICAgIHByb21wdDogJ21haW50ZW5hbmNlPiAnLFxyXG4gICAgICAgICAgdXNlQ29sb3JzOiB0cnVlLFxyXG4gICAgICAgICAgcmVwbE1vZGU6IHJlcGwuUkVQTF9NT0RFX1NUUklDVCxcclxuICAgICAgICAgIGlnbm9yZVVuZGVmaW5lZDogdHJ1ZVxyXG4gICAgICAgIH0gKTtcclxuXHJcbiAgICAgICAgLy8gV2FpdCBmb3IgcHJvbWlzZXMgYmVmb3JlIGJlaW5nIHJlYWR5IGZvciBpbnB1dFxyXG4gICAgICAgIGNvbnN0IG5vZGVFdmFsID0gc2Vzc2lvbi5ldmFsO1xyXG4gICAgICAgIHNlc3Npb24uZXZhbCA9IGFzeW5jICggY21kLCBjb250ZXh0LCBmaWxlbmFtZSwgY2FsbGJhY2sgKSA9PiB7XHJcbiAgICAgICAgICBub2RlRXZhbCggY21kLCBjb250ZXh0LCBmaWxlbmFtZSwgKCBfLCByZXN1bHQgKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICggcmVzdWx0IGluc3RhbmNlb2YgUHJvbWlzZSApIHtcclxuICAgICAgICAgICAgICByZXN1bHQudGhlbiggdmFsID0+IGNhbGxiYWNrKCBfLCB2YWwgKSApLmNhdGNoKCBlID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICggZS5zdGFjayApIHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvciggYE1haW50ZW5hbmNlIHRhc2sgZmFpbGVkOlxcbiR7ZS5zdGFja31cXG5GdWxsIEVycm9yIGRldGFpbHM6XFxuJHtKU09OLnN0cmluZ2lmeSggZSwgbnVsbCwgMiApfWAgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCB0eXBlb2YgZSA9PT0gJ3N0cmluZycgKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoIGBNYWludGVuYW5jZSB0YXNrIGZhaWxlZDogJHtlfWAgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCBgTWFpbnRlbmFuY2UgdGFzayBmYWlsZWQgd2l0aCB1bmtub3duIGVycm9yOiAke0pTT04uc3RyaW5naWZ5KCBlLCBudWxsLCAyICl9YCApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICBjYWxsYmFjayggXywgcmVzdWx0ICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBPbmx5IGF1dG9jb21wbGV0ZSBcInB1YmxpY1wiIEFQSSBmdW5jdGlvbnMgZm9yIE1haW50ZW5hbmNlLlxyXG4gICAgICAgIC8vIGNvbnN0IG5vZGVDb21wbGV0ZXIgPSBzZXNzaW9uLmNvbXBsZXRlcjtcclxuICAgICAgICAvLyBzZXNzaW9uLmNvbXBsZXRlciA9IGZ1bmN0aW9uKCB0ZXh0LCBjYiApIHtcclxuICAgICAgICAvLyAgIG5vZGVDb21wbGV0ZXIoIHRleHQsICggXywgWyBjb21wbGV0aW9ucywgY29tcGxldGVkIF0gKSA9PiB7XHJcbiAgICAgICAgLy8gICAgIGNvbnN0IG1hdGNoID0gY29tcGxldGVkLm1hdGNoKCAvXk1haW50ZW5hbmNlXFwuKFxcdyopKy8gKTtcclxuICAgICAgICAvLyAgICAgaWYgKCBtYXRjaCApIHtcclxuICAgICAgICAvLyAgICAgICBjb25zdCBmdW5jU3RhcnQgPSBtYXRjaFsgMSBdO1xyXG4gICAgICAgIC8vICAgICAgIGNiKCBudWxsLCBbIFBVQkxJQ19GVU5DVElPTlMuZmlsdGVyKCBmID0+IGYuc3RhcnRzV2l0aCggZnVuY1N0YXJ0ICkgKS5tYXAoIGYgPT4gYE1haW50ZW5hbmNlLiR7Zn1gICksIGNvbXBsZXRlZCBdICk7XHJcbiAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAvLyAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gICAgICAgY2IoIG51bGwsIFsgY29tcGxldGlvbnMsIGNvbXBsZXRlZCBdICk7XHJcbiAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAvLyAgIH0gKTtcclxuICAgICAgICAvLyB9O1xyXG5cclxuICAgICAgICAvLyBBbGxvdyBjb250cm9sbGluZyB2ZXJib3NpdHlcclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIGdsb2JhbCwgJ3ZlcmJvc2UnLCB7XHJcbiAgICAgICAgICBnZXQoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB3aW5zdG9uLmRlZmF1bHQudHJhbnNwb3J0cy5jb25zb2xlLmxldmVsID09PSAnaW5mbyc7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgc2V0KCB2YWx1ZSApIHtcclxuICAgICAgICAgICAgd2luc3Rvbi5kZWZhdWx0LnRyYW5zcG9ydHMuY29uc29sZS5sZXZlbCA9IHZhbHVlID8gJ2luZm8nIDogJ2Vycm9yJztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgIHNlc3Npb24uY29udGV4dC5NYWludGVuYW5jZSA9IE1haW50ZW5hbmNlO1xyXG4gICAgICAgIHNlc3Npb24uY29udGV4dC5tID0gTWFpbnRlbmFuY2U7XHJcbiAgICAgICAgc2Vzc2lvbi5jb250ZXh0Lk0gPSBNYWludGVuYW5jZTtcclxuICAgICAgICBzZXNzaW9uLmNvbnRleHQuUmVsZWFzZUJyYW5jaCA9IFJlbGVhc2VCcmFuY2g7XHJcbiAgICAgICAgc2Vzc2lvbi5jb250ZXh0LnJiID0gUmVsZWFzZUJyYW5jaDtcclxuXHJcbiAgICAgICAgc2Vzc2lvbi5vbiggJ2V4aXQnLCByZXNvbHZlICk7XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIExvb2tzIHVwIGEgcGF0Y2ggYnkgaXRzIG5hbWUuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGNoTmFtZVxyXG4gICAgICogQHJldHVybnMge1BhdGNofVxyXG4gICAgICovXHJcbiAgICBmaW5kUGF0Y2goIHBhdGNoTmFtZSApIHtcclxuICAgICAgY29uc3QgcGF0Y2ggPSB0aGlzLnBhdGNoZXMuZmluZCggcCA9PiBwLm5hbWUgPT09IHBhdGNoTmFtZSApO1xyXG4gICAgICBhc3NlcnQoIHBhdGNoLCBgUGF0Y2ggbm90IGZvdW5kIGZvciAke3BhdGNoTmFtZX1gICk7XHJcblxyXG4gICAgICByZXR1cm4gcGF0Y2g7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMb29rcyB1cCAob3IgYWRkcykgYSBNb2RpZmllZEJyYW5jaCBieSBpdHMgaWRlbnRpZnlpbmcgaW5mb3JtYXRpb24uXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYnJhbmNoXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtlcnJvcklmTWlzc2luZ11cclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPFJlbGVhc2VCcmFuY2g+fSBbcmVsZWFzZUJyYW5jaGVzXSAtIElmIHByb3ZpZGVkLCBpdCB3aWxsIHNwZWVkIHVwIHRoZSBwcm9jZXNzXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZS48TW9kaWZpZWRCcmFuY2g+fVxyXG4gICAgICovXHJcbiAgICBhc3luYyBlbnN1cmVNb2RpZmllZEJyYW5jaCggcmVwbywgYnJhbmNoLCBlcnJvcklmTWlzc2luZyA9IGZhbHNlLCByZWxlYXNlQnJhbmNoZXMgPSBudWxsICkge1xyXG4gICAgICBsZXQgbW9kaWZpZWRCcmFuY2ggPSB0aGlzLm1vZGlmaWVkQnJhbmNoZXMuZmluZCggbW9kaWZpZWRCcmFuY2ggPT4gbW9kaWZpZWRCcmFuY2gucmVwbyA9PT0gcmVwbyAmJiBtb2RpZmllZEJyYW5jaC5icmFuY2ggPT09IGJyYW5jaCApO1xyXG5cclxuICAgICAgaWYgKCAhbW9kaWZpZWRCcmFuY2ggKSB7XHJcbiAgICAgICAgaWYgKCBlcnJvcklmTWlzc2luZyApIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciggYENvdWxkIG5vdCBmaW5kIGEgdHJhY2tlZCBtb2RpZmllZCBicmFuY2ggZm9yICR7cmVwb30gJHticmFuY2h9YCApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVXNlIHRoZSBpbnN0YW5jZSB2ZXJzaW9uIG9mIGdldE1haW50ZW5hbmNlQnJhbmNoZXMgdG8gbWFrZSBzdXJlIHRoYXQgdGhpcyBNYWludGVuYW5jZSBpbnN0YW5jZSBpcyB1cGRhdGVkIHdpdGggbmV3IFJlbGVhc2VCcmFuY2hlcy5cclxuICAgICAgICByZWxlYXNlQnJhbmNoZXMgPSByZWxlYXNlQnJhbmNoZXMgfHwgYXdhaXQgdGhpcy5nZXRNYWludGVuYW5jZUJyYW5jaGVzKCByZWxlYXNlQnJhbmNoID0+IHJlbGVhc2VCcmFuY2gucmVwbyA9PT0gcmVwbyApO1xyXG4gICAgICAgIGNvbnN0IHJlbGVhc2VCcmFuY2ggPSByZWxlYXNlQnJhbmNoZXMuZmluZCggcmVsZWFzZSA9PiByZWxlYXNlLnJlcG8gPT09IHJlcG8gJiYgcmVsZWFzZS5icmFuY2ggPT09IGJyYW5jaCApO1xyXG4gICAgICAgIGFzc2VydCggcmVsZWFzZUJyYW5jaCwgYENvdWxkIG5vdCBmaW5kIGEgcmVsZWFzZSBicmFuY2ggZm9yIHJlcG89JHtyZXBvfSBicmFuY2g9JHticmFuY2h9YCApO1xyXG5cclxuICAgICAgICBtb2RpZmllZEJyYW5jaCA9IG5ldyBNb2RpZmllZEJyYW5jaCggcmVsZWFzZUJyYW5jaCApO1xyXG5cclxuICAgICAgICAvLyBJZiB3ZSBhcmUgY3JlYXRpbmcgaXQsIGFkZCBpdCB0byBvdXIgbGlzdC5cclxuICAgICAgICB0aGlzLm1vZGlmaWVkQnJhbmNoZXMucHVzaCggbW9kaWZpZWRCcmFuY2ggKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG1vZGlmaWVkQnJhbmNoO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXR0ZW1wdHMgdG8gcmVtb3ZlIGEgbW9kaWZpZWQgYnJhbmNoIChpZiBpdCBkb2Vzbid0IG5lZWQgdG8gYmUga2VwdCBhcm91bmQpLlxyXG4gICAgICogQHB1YmxpY1xyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7TW9kaWZpZWRCcmFuY2h9IG1vZGlmaWVkQnJhbmNoXHJcbiAgICAgKi9cclxuICAgIHRyeVJlbW92aW5nTW9kaWZpZWRCcmFuY2goIG1vZGlmaWVkQnJhbmNoICkge1xyXG4gICAgICBpZiAoIG1vZGlmaWVkQnJhbmNoLmlzVW51c2VkICkge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5tb2RpZmllZEJyYW5jaGVzLmluZGV4T2YoIG1vZGlmaWVkQnJhbmNoICk7XHJcbiAgICAgICAgYXNzZXJ0KCBpbmRleCA+PSAwICk7XHJcblxyXG4gICAgICAgIHRoaXMubW9kaWZpZWRCcmFuY2hlcy5zcGxpY2UoIGluZGV4LCAxICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBNYWludGVuYW5jZTtcclxufSApKCk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE1BQU1BLFVBQVUsR0FBR0MsT0FBTyxDQUFFLHFCQUFzQixDQUFDO0FBQ25ELE1BQU1DLEVB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