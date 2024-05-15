// Copyright 2017, University of Colorado Boulder

/**
 * Checks out main for a repository and all of its dependencies.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const getDependencies = require('./getDependencies');
const gitCheckout = require('./gitCheckout');
const npmUpdate = require('./npmUpdate');
const winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Checks out main for a repository and all of its dependencies.
 * @public
 *
 * @param {string} repo - The repository name
 * @param {boolean} includeNpmUpdate - Whether npm updates should be done to repositories.
 * @returns {Promise}
 */
module.exports = async function (repo, includeNpmUpdate) {
  winston.info(`checking out main for ${repo}`);
  const dependencies = await getDependencies(repo);

  // Ignore the comment
  const repoNames = Object.keys(dependencies).filter(key => key !== 'comment');
  for (const repoName of repoNames) {
    await gitCheckout(repoName, 'main');
  }
  if (includeNpmUpdate) {
    await npmUpdate(repo);
    await npmUpdate('chipper');
    await npmUpdate('perennial-alias');
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJnZXREZXBlbmRlbmNpZXMiLCJyZXF1aXJlIiwiZ2l0Q2hlY2tvdXQiLCJucG1VcGRhdGUiLCJ3aW5zdG9uIiwibW9kdWxlIiwiZXhwb3J0cyIsInJlcG8iLCJpbmNsdWRlTnBtVXBkYXRlIiwiaW5mbyIsImRlcGVuZGVuY2llcyIsInJlcG9OYW1lcyIsIk9iamVjdCIsImtleXMiLCJmaWx0ZXIiLCJrZXkiLCJyZXBvTmFtZSJdLCJzb3VyY2VzIjpbImNoZWNrb3V0TWFpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQ2hlY2tzIG91dCBtYWluIGZvciBhIHJlcG9zaXRvcnkgYW5kIGFsbCBvZiBpdHMgZGVwZW5kZW5jaWVzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgZ2V0RGVwZW5kZW5jaWVzID0gcmVxdWlyZSggJy4vZ2V0RGVwZW5kZW5jaWVzJyApO1xyXG5jb25zdCBnaXRDaGVja291dCA9IHJlcXVpcmUoICcuL2dpdENoZWNrb3V0JyApO1xyXG5jb25zdCBucG1VcGRhdGUgPSByZXF1aXJlKCAnLi9ucG1VcGRhdGUnICk7XHJcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuXHJcbi8qKlxyXG4gKiBDaGVja3Mgb3V0IG1haW4gZm9yIGEgcmVwb3NpdG9yeSBhbmQgYWxsIG9mIGl0cyBkZXBlbmRlbmNpZXMuXHJcbiAqIEBwdWJsaWNcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSBUaGUgcmVwb3NpdG9yeSBuYW1lXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gaW5jbHVkZU5wbVVwZGF0ZSAtIFdoZXRoZXIgbnBtIHVwZGF0ZXMgc2hvdWxkIGJlIGRvbmUgdG8gcmVwb3NpdG9yaWVzLlxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24oIHJlcG8sIGluY2x1ZGVOcG1VcGRhdGUgKSB7XHJcbiAgd2luc3Rvbi5pbmZvKCBgY2hlY2tpbmcgb3V0IG1haW4gZm9yICR7cmVwb31gICk7XHJcblxyXG4gIGNvbnN0IGRlcGVuZGVuY2llcyA9IGF3YWl0IGdldERlcGVuZGVuY2llcyggcmVwbyApO1xyXG5cclxuICAvLyBJZ25vcmUgdGhlIGNvbW1lbnRcclxuICBjb25zdCByZXBvTmFtZXMgPSBPYmplY3Qua2V5cyggZGVwZW5kZW5jaWVzICkuZmlsdGVyKCBrZXkgPT4ga2V5ICE9PSAnY29tbWVudCcgKTtcclxuXHJcbiAgZm9yICggY29uc3QgcmVwb05hbWUgb2YgcmVwb05hbWVzICkge1xyXG4gICAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHJlcG9OYW1lLCAnbWFpbicgKTtcclxuICB9XHJcblxyXG4gIGlmICggaW5jbHVkZU5wbVVwZGF0ZSApIHtcclxuICAgIGF3YWl0IG5wbVVwZGF0ZSggcmVwbyApO1xyXG4gICAgYXdhaXQgbnBtVXBkYXRlKCAnY2hpcHBlcicgKTtcclxuICAgIGF3YWl0IG5wbVVwZGF0ZSggJ3BlcmVubmlhbC1hbGlhcycgKTtcclxuICB9XHJcbn07Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE1BQU1BLGVBQWUsR0FBR0MsT0FBTyxDQUFFLG1CQUFvQixDQUFDO0FBQ3RELE1BQU1DLFdBQVcsR0FBR0QsT0FBTyxDQUFFLGVBQWdCLENBQUM7QUFDOUMsTUFBTUUsU0FBUyxHQUFHRixPQUFPLENBQUUsYUFBYyxDQUFDO0FBQzFDLE1BQU1HLE9BQU8sR0FBR0gsT0FBTyxDQUFFLFNBQVUsQ0FBQzs7QUFFcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBSSxNQUFNLENBQUNDLE9BQU8sR0FBRyxnQkFBZ0JDLElBQUksRUFBRUMsZ0JBQWdCLEVBQUc7RUFDeERKLE9BQU8sQ0FBQ0ssSUFBSSxDQUFHLHlCQUF3QkYsSUFBSyxFQUFFLENBQUM7RUFFL0MsTUFBTUcsWUFBWSxHQUFHLE1BQU1WLGVBQWUsQ0FBRU8sSUFBSyxDQUFDOztFQUVsRDtFQUNBLE1BQU1JLFNBQVMsR0FBR0MsTUFBTSxDQUFDQyxJQUFJLENBQUVILFlBQWEsQ0FBQyxDQUFDSSxNQUFNLENBQUVDLEdBQUcsSUFBSUEsR0FBRyxLQUFLLFNBQVUsQ0FBQztFQUVoRixLQUFNLE1BQU1DLFFBQVEsSUFBSUwsU0FBUyxFQUFHO0lBQ2xDLE1BQU1ULFdBQVcsQ0FBRWMsUUFBUSxFQUFFLE1BQU8sQ0FBQztFQUN2QztFQUVBLElBQUtSLGdCQUFnQixFQUFHO0lBQ3RCLE1BQU1MLFNBQVMsQ0FBRUksSUFBSyxDQUFDO0lBQ3ZCLE1BQU1KLFNBQVMsQ0FBRSxTQUFVLENBQUM7SUFDNUIsTUFBTUEsU0FBUyxDQUFFLGlCQUFrQixDQUFDO0VBQ3RDO0FBQ0YsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==