// Copyright 2018, University of Colorado Boulder

/**
 * Updates our github-pages branches (shows up at e.g. https://phetsims.github.io/scenery)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const execute = require('./execute');
const gitAdd = require('./gitAdd');
const gitCheckout = require('./gitCheckout');
const gitCommit = require('./gitCommit');
const gitIsClean = require('./gitIsClean');
const gitPull = require('./gitPull');
const gitPush = require('./gitPush');
const gruntCommand = require('./gruntCommand');
const npmUpdate = require('./npmUpdate');
const winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Checks to see if the git state/status is clean
 * @public
 *
 * @returns {Promise}
 * @rejects {ExecuteError}
 */
module.exports = async function () {
  winston.info('Updating GitHub pages');
  const taggedRepos = [{
    repo: 'assert'
  }, {
    repo: 'aqua'
  }, {
    repo: 'tandem'
  }, {
    repo: 'query-string-machine'
  }, {
    repo: 'phet-core'
  }, {
    repo: 'chipper'
  }, {
    repo: 'sherpa'
  }, {
    repo: 'axon'
  }, {
    repo: 'dot',
    build: true
  }, {
    repo: 'kite',
    build: true
  }, {
    repo: 'scenery',
    build: true
  }];
  for (const taggedRepo of taggedRepos) {
    const repo = taggedRepo.repo;
    winston.info(`Updating ${repo}`);
    await gitCheckout(repo, 'gh-pages');
    await gitPull(repo);
    await execute('git', ['merge', 'main', '-m', 'Update for gh-pages'], `../${repo}`);
    if (taggedRepo.build) {
      await npmUpdate(repo);
      winston.info(`Building ${repo}`);
      await execute(gruntCommand, [], `../${repo}`);
      if (!(await gitIsClean(repo))) {
        await gitAdd(repo, 'build');
        await gitCommit(repo, 'Updating for gh-pages build');
      }
    }
    await gitPush(repo, 'gh-pages');
    await gitCheckout(repo, 'main');
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsImdpdEFkZCIsImdpdENoZWNrb3V0IiwiZ2l0Q29tbWl0IiwiZ2l0SXNDbGVhbiIsImdpdFB1bGwiLCJnaXRQdXNoIiwiZ3J1bnRDb21tYW5kIiwibnBtVXBkYXRlIiwid2luc3RvbiIsIm1vZHVsZSIsImV4cG9ydHMiLCJpbmZvIiwidGFnZ2VkUmVwb3MiLCJyZXBvIiwiYnVpbGQiLCJ0YWdnZWRSZXBvIl0sInNvdXJjZXMiOlsidXBkYXRlR2l0aHViUGFnZXMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFVwZGF0ZXMgb3VyIGdpdGh1Yi1wYWdlcyBicmFuY2hlcyAoc2hvd3MgdXAgYXQgZS5nLiBodHRwczovL3BoZXRzaW1zLmdpdGh1Yi5pby9zY2VuZXJ5KVxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgZXhlY3V0ZSA9IHJlcXVpcmUoICcuL2V4ZWN1dGUnICk7XHJcbmNvbnN0IGdpdEFkZCA9IHJlcXVpcmUoICcuL2dpdEFkZCcgKTtcclxuY29uc3QgZ2l0Q2hlY2tvdXQgPSByZXF1aXJlKCAnLi9naXRDaGVja291dCcgKTtcclxuY29uc3QgZ2l0Q29tbWl0ID0gcmVxdWlyZSggJy4vZ2l0Q29tbWl0JyApO1xyXG5jb25zdCBnaXRJc0NsZWFuID0gcmVxdWlyZSggJy4vZ2l0SXNDbGVhbicgKTtcclxuY29uc3QgZ2l0UHVsbCA9IHJlcXVpcmUoICcuL2dpdFB1bGwnICk7XHJcbmNvbnN0IGdpdFB1c2ggPSByZXF1aXJlKCAnLi9naXRQdXNoJyApO1xyXG5jb25zdCBncnVudENvbW1hbmQgPSByZXF1aXJlKCAnLi9ncnVudENvbW1hbmQnICk7XHJcbmNvbnN0IG5wbVVwZGF0ZSA9IHJlcXVpcmUoICcuL25wbVVwZGF0ZScgKTtcclxuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xyXG5cclxuLyoqXHJcbiAqIENoZWNrcyB0byBzZWUgaWYgdGhlIGdpdCBzdGF0ZS9zdGF0dXMgaXMgY2xlYW5cclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICogQHJlamVjdHMge0V4ZWN1dGVFcnJvcn1cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24oKSB7XHJcbiAgd2luc3Rvbi5pbmZvKCAnVXBkYXRpbmcgR2l0SHViIHBhZ2VzJyApO1xyXG5cclxuICBjb25zdCB0YWdnZWRSZXBvcyA9IFtcclxuICAgIHsgcmVwbzogJ2Fzc2VydCcgfSxcclxuICAgIHsgcmVwbzogJ2FxdWEnIH0sXHJcbiAgICB7IHJlcG86ICd0YW5kZW0nIH0sXHJcbiAgICB7IHJlcG86ICdxdWVyeS1zdHJpbmctbWFjaGluZScgfSxcclxuICAgIHsgcmVwbzogJ3BoZXQtY29yZScgfSxcclxuICAgIHsgcmVwbzogJ2NoaXBwZXInIH0sXHJcbiAgICB7IHJlcG86ICdzaGVycGEnIH0sXHJcbiAgICB7IHJlcG86ICdheG9uJyB9LFxyXG4gICAgeyByZXBvOiAnZG90JywgYnVpbGQ6IHRydWUgfSxcclxuICAgIHsgcmVwbzogJ2tpdGUnLCBidWlsZDogdHJ1ZSB9LFxyXG4gICAgeyByZXBvOiAnc2NlbmVyeScsIGJ1aWxkOiB0cnVlIH1cclxuICBdO1xyXG5cclxuICBmb3IgKCBjb25zdCB0YWdnZWRSZXBvIG9mIHRhZ2dlZFJlcG9zICkge1xyXG4gICAgY29uc3QgcmVwbyA9IHRhZ2dlZFJlcG8ucmVwbztcclxuXHJcbiAgICB3aW5zdG9uLmluZm8oIGBVcGRhdGluZyAke3JlcG99YCApO1xyXG5cclxuICAgIGF3YWl0IGdpdENoZWNrb3V0KCByZXBvLCAnZ2gtcGFnZXMnICk7XHJcbiAgICBhd2FpdCBnaXRQdWxsKCByZXBvICk7XHJcbiAgICBhd2FpdCBleGVjdXRlKCAnZ2l0JywgWyAnbWVyZ2UnLCAnbWFpbicsICctbScsICdVcGRhdGUgZm9yIGdoLXBhZ2VzJyBdLCBgLi4vJHtyZXBvfWAgKTtcclxuXHJcbiAgICBpZiAoIHRhZ2dlZFJlcG8uYnVpbGQgKSB7XHJcbiAgICAgIGF3YWl0IG5wbVVwZGF0ZSggcmVwbyApO1xyXG4gICAgICB3aW5zdG9uLmluZm8oIGBCdWlsZGluZyAke3JlcG99YCApO1xyXG4gICAgICBhd2FpdCBleGVjdXRlKCBncnVudENvbW1hbmQsIFtdLCBgLi4vJHtyZXBvfWAgKTtcclxuXHJcbiAgICAgIGlmICggIWF3YWl0IGdpdElzQ2xlYW4oIHJlcG8gKSApIHtcclxuICAgICAgICBhd2FpdCBnaXRBZGQoIHJlcG8sICdidWlsZCcgKTtcclxuICAgICAgICBhd2FpdCBnaXRDb21taXQoIHJlcG8sICdVcGRhdGluZyBmb3IgZ2gtcGFnZXMgYnVpbGQnICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhd2FpdCBnaXRQdXNoKCByZXBvLCAnZ2gtcGFnZXMnICk7XHJcbiAgICBhd2FpdCBnaXRDaGVja291dCggcmVwbywgJ21haW4nICk7XHJcbiAgfVxyXG59OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxNQUFNQSxPQUFPLEdBQUdDLE9BQU8sQ0FBRSxXQUFZLENBQUM7QUFDdEMsTUFBTUMsTUFBTSxHQUFHRCxPQUFPLENBQUUsVUFBVyxDQUFDO0FBQ3BDLE1BQU1FLFdBQVcsR0FBR0YsT0FBTyxDQUFFLGVBQWdCLENBQUM7QUFDOUMsTUFBTUcsU0FBUyxHQUFHSCxPQUFPLENBQUUsYUFBYyxDQUFDO0FBQzFDLE1BQU1JLFVBQVUsR0FBR0osT0FBTyxDQUFFLGNBQWUsQ0FBQztBQUM1QyxNQUFNSyxPQUFPLEdBQUdMLE9BQU8sQ0FBRSxXQUFZLENBQUM7QUFDdEMsTUFBTU0sT0FBTyxHQUFHTixPQUFPLENBQUUsV0FBWSxDQUFDO0FBQ3RDLE1BQU1PLFlBQVksR0FBR1AsT0FBTyxDQUFFLGdCQUFpQixDQUFDO0FBQ2hELE1BQU1RLFNBQVMsR0FBR1IsT0FBTyxDQUFFLGFBQWMsQ0FBQztBQUMxQyxNQUFNUyxPQUFPLEdBQUdULE9BQU8sQ0FBRSxTQUFVLENBQUM7O0FBRXBDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FVLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLGtCQUFpQjtFQUNoQ0YsT0FBTyxDQUFDRyxJQUFJLENBQUUsdUJBQXdCLENBQUM7RUFFdkMsTUFBTUMsV0FBVyxHQUFHLENBQ2xCO0lBQUVDLElBQUksRUFBRTtFQUFTLENBQUMsRUFDbEI7SUFBRUEsSUFBSSxFQUFFO0VBQU8sQ0FBQyxFQUNoQjtJQUFFQSxJQUFJLEVBQUU7RUFBUyxDQUFDLEVBQ2xCO0lBQUVBLElBQUksRUFBRTtFQUF1QixDQUFDLEVBQ2hDO0lBQUVBLElBQUksRUFBRTtFQUFZLENBQUMsRUFDckI7SUFBRUEsSUFBSSxFQUFFO0VBQVUsQ0FBQyxFQUNuQjtJQUFFQSxJQUFJLEVBQUU7RUFBUyxDQUFDLEVBQ2xCO0lBQUVBLElBQUksRUFBRTtFQUFPLENBQUMsRUFDaEI7SUFBRUEsSUFBSSxFQUFFLEtBQUs7SUFBRUMsS0FBSyxFQUFFO0VBQUssQ0FBQyxFQUM1QjtJQUFFRCxJQUFJLEVBQUUsTUFBTTtJQUFFQyxLQUFLLEVBQUU7RUFBSyxDQUFDLEVBQzdCO0lBQUVELElBQUksRUFBRSxTQUFTO0lBQUVDLEtBQUssRUFBRTtFQUFLLENBQUMsQ0FDakM7RUFFRCxLQUFNLE1BQU1DLFVBQVUsSUFBSUgsV0FBVyxFQUFHO0lBQ3RDLE1BQU1DLElBQUksR0FBR0UsVUFBVSxDQUFDRixJQUFJO0lBRTVCTCxPQUFPLENBQUNHLElBQUksQ0FBRyxZQUFXRSxJQUFLLEVBQUUsQ0FBQztJQUVsQyxNQUFNWixXQUFXLENBQUVZLElBQUksRUFBRSxVQUFXLENBQUM7SUFDckMsTUFBTVQsT0FBTyxDQUFFUyxJQUFLLENBQUM7SUFDckIsTUFBTWYsT0FBTyxDQUFFLEtBQUssRUFBRSxDQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLHFCQUFxQixDQUFFLEVBQUcsTUFBS2UsSUFBSyxFQUFFLENBQUM7SUFFdEYsSUFBS0UsVUFBVSxDQUFDRCxLQUFLLEVBQUc7TUFDdEIsTUFBTVAsU0FBUyxDQUFFTSxJQUFLLENBQUM7TUFDdkJMLE9BQU8sQ0FBQ0csSUFBSSxDQUFHLFlBQVdFLElBQUssRUFBRSxDQUFDO01BQ2xDLE1BQU1mLE9BQU8sQ0FBRVEsWUFBWSxFQUFFLEVBQUUsRUFBRyxNQUFLTyxJQUFLLEVBQUUsQ0FBQztNQUUvQyxJQUFLLEVBQUMsTUFBTVYsVUFBVSxDQUFFVSxJQUFLLENBQUMsR0FBRztRQUMvQixNQUFNYixNQUFNLENBQUVhLElBQUksRUFBRSxPQUFRLENBQUM7UUFDN0IsTUFBTVgsU0FBUyxDQUFFVyxJQUFJLEVBQUUsNkJBQThCLENBQUM7TUFDeEQ7SUFDRjtJQUVBLE1BQU1SLE9BQU8sQ0FBRVEsSUFBSSxFQUFFLFVBQVcsQ0FBQztJQUNqQyxNQUFNWixXQUFXLENBQUVZLElBQUksRUFBRSxNQUFPLENBQUM7RUFDbkM7QUFDRixDQUFDIiwiaWdub3JlTGlzdCI6W119