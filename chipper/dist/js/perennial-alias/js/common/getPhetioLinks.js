// Copyright 2019-2023, University of Colorado Boulder

/**
 * Print the list of production sims for clients.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */

const _ = require('lodash');
const getDependencies = require('./getDependencies');
const gitCheckout = require('./gitCheckout');
const gitIsAncestor = require('./gitIsAncestor');
const simPhetioMetadata = require('./simPhetioMetadata');
module.exports = async () => {
  // {Array.<Object>} get sim metadata via metadata API, here is an example of what an entry might look like:
  /*
  {
    "versionMaintenance": 12,
    "name": "molarity",
    "active": true,
    "versionMajor": 1,
    "versionMinor": 4,
    "versionSuffix": "",
    "latest": true,
    "timestamp": "2019-10-25"
  }
   */
  const allSimsData = await simPhetioMetadata({
    active: true,
    latest: true
  });

  // Get a list of sim versions where the highest versions of each sim are first.
  const sortedAndReversed = _.sortBy(allSimsData, simData => `${simData.name}${getVersion(simData)}`).reverse();

  // Get rid of all lower versions, then reverse back to alphabetical sorting.
  const oneVersionPerSimList = _.uniqBy(sortedAndReversed, simData => simData.name).reverse();
  const phetioLinks = [];
  for (const simData of oneVersionPerSimList) {
    const useTopLevelIndex = await usesTopLevelIndex(simData.name, getBranch(simData));
    phetioLinks.push(`https://phet-io.colorado.edu/sims/${simData.name}/${getVersion(simData)}/${useTopLevelIndex ? '' : 'wrappers/index/'}`);
  }
  return phetioLinks;
};

/**
 * Returns whether phet-io Studio is being used instead of deprecated instance proxies wrapper.
 *
 * @param {string} repo
 * @param {string} branch
 * @returns {Promise.<boolean>}
 */
async function usesTopLevelIndex(repo, branch) {
  await gitCheckout(repo, branch);
  const dependencies = await getDependencies(repo);
  const sha = dependencies.chipper.sha;
  await gitCheckout(repo, 'main');
  return gitIsAncestor('chipper', '8db0653ee0cbb6ed716fa3b4d4759bcb75d8118a', sha);
}

// {Object} metadata -> version string
const getVersion = simData => `${simData.versionMajor}.${simData.versionMinor}`;

// {Object} metadata -> branch name
const getBranch = simData => {
  let branch = `${simData.versionMajor}.${simData.versionMinor}`;
  if (simData.versionSuffix.length) {
    branch += `-${simData.versionSuffix}`; // additional dash required
  }
  return branch;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsImdldERlcGVuZGVuY2llcyIsImdpdENoZWNrb3V0IiwiZ2l0SXNBbmNlc3RvciIsInNpbVBoZXRpb01ldGFkYXRhIiwibW9kdWxlIiwiZXhwb3J0cyIsImFsbFNpbXNEYXRhIiwiYWN0aXZlIiwibGF0ZXN0Iiwic29ydGVkQW5kUmV2ZXJzZWQiLCJzb3J0QnkiLCJzaW1EYXRhIiwibmFtZSIsImdldFZlcnNpb24iLCJyZXZlcnNlIiwib25lVmVyc2lvblBlclNpbUxpc3QiLCJ1bmlxQnkiLCJwaGV0aW9MaW5rcyIsInVzZVRvcExldmVsSW5kZXgiLCJ1c2VzVG9wTGV2ZWxJbmRleCIsImdldEJyYW5jaCIsInB1c2giLCJyZXBvIiwiYnJhbmNoIiwiZGVwZW5kZW5jaWVzIiwic2hhIiwiY2hpcHBlciIsInZlcnNpb25NYWpvciIsInZlcnNpb25NaW5vciIsInZlcnNpb25TdWZmaXgiLCJsZW5ndGgiXSwic291cmNlcyI6WyJnZXRQaGV0aW9MaW5rcy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOS0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBQcmludCB0aGUgbGlzdCBvZiBwcm9kdWN0aW9uIHNpbXMgZm9yIGNsaWVudHMuXHJcbiAqXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBDaHJpcyBLbHVzZW5kb3JmIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmNvbnN0IF8gPSByZXF1aXJlKCAnbG9kYXNoJyApO1xyXG5jb25zdCBnZXREZXBlbmRlbmNpZXMgPSByZXF1aXJlKCAnLi9nZXREZXBlbmRlbmNpZXMnICk7XHJcbmNvbnN0IGdpdENoZWNrb3V0ID0gcmVxdWlyZSggJy4vZ2l0Q2hlY2tvdXQnICk7XHJcbmNvbnN0IGdpdElzQW5jZXN0b3IgPSByZXF1aXJlKCAnLi9naXRJc0FuY2VzdG9yJyApO1xyXG5jb25zdCBzaW1QaGV0aW9NZXRhZGF0YSA9IHJlcXVpcmUoICcuL3NpbVBoZXRpb01ldGFkYXRhJyApO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyAoKSA9PiB7XHJcblxyXG4gIC8vIHtBcnJheS48T2JqZWN0Pn0gZ2V0IHNpbSBtZXRhZGF0YSB2aWEgbWV0YWRhdGEgQVBJLCBoZXJlIGlzIGFuIGV4YW1wbGUgb2Ygd2hhdCBhbiBlbnRyeSBtaWdodCBsb29rIGxpa2U6XHJcbiAgLypcclxuICB7XHJcbiAgICBcInZlcnNpb25NYWludGVuYW5jZVwiOiAxMixcclxuICAgIFwibmFtZVwiOiBcIm1vbGFyaXR5XCIsXHJcbiAgICBcImFjdGl2ZVwiOiB0cnVlLFxyXG4gICAgXCJ2ZXJzaW9uTWFqb3JcIjogMSxcclxuICAgIFwidmVyc2lvbk1pbm9yXCI6IDQsXHJcbiAgICBcInZlcnNpb25TdWZmaXhcIjogXCJcIixcclxuICAgIFwibGF0ZXN0XCI6IHRydWUsXHJcbiAgICBcInRpbWVzdGFtcFwiOiBcIjIwMTktMTAtMjVcIlxyXG4gIH1cclxuICAgKi9cclxuICBjb25zdCBhbGxTaW1zRGF0YSA9IGF3YWl0IHNpbVBoZXRpb01ldGFkYXRhKCB7XHJcbiAgICBhY3RpdmU6IHRydWUsXHJcbiAgICBsYXRlc3Q6IHRydWVcclxuICB9ICk7XHJcblxyXG4gIC8vIEdldCBhIGxpc3Qgb2Ygc2ltIHZlcnNpb25zIHdoZXJlIHRoZSBoaWdoZXN0IHZlcnNpb25zIG9mIGVhY2ggc2ltIGFyZSBmaXJzdC5cclxuICBjb25zdCBzb3J0ZWRBbmRSZXZlcnNlZCA9IF8uc29ydEJ5KCBhbGxTaW1zRGF0YSwgc2ltRGF0YSA9PiBgJHtzaW1EYXRhLm5hbWV9JHtnZXRWZXJzaW9uKCBzaW1EYXRhICl9YCApLnJldmVyc2UoKTtcclxuXHJcbiAgLy8gR2V0IHJpZCBvZiBhbGwgbG93ZXIgdmVyc2lvbnMsIHRoZW4gcmV2ZXJzZSBiYWNrIHRvIGFscGhhYmV0aWNhbCBzb3J0aW5nLlxyXG4gIGNvbnN0IG9uZVZlcnNpb25QZXJTaW1MaXN0ID0gXy51bmlxQnkoIHNvcnRlZEFuZFJldmVyc2VkLCBzaW1EYXRhID0+IHNpbURhdGEubmFtZSApLnJldmVyc2UoKTtcclxuXHJcbiAgY29uc3QgcGhldGlvTGlua3MgPSBbXTtcclxuICBmb3IgKCBjb25zdCBzaW1EYXRhIG9mIG9uZVZlcnNpb25QZXJTaW1MaXN0ICkge1xyXG5cclxuICAgIGNvbnN0IHVzZVRvcExldmVsSW5kZXggPSBhd2FpdCB1c2VzVG9wTGV2ZWxJbmRleCggc2ltRGF0YS5uYW1lLCBnZXRCcmFuY2goIHNpbURhdGEgKSApO1xyXG5cclxuICAgIHBoZXRpb0xpbmtzLnB1c2goIGBodHRwczovL3BoZXQtaW8uY29sb3JhZG8uZWR1L3NpbXMvJHtzaW1EYXRhLm5hbWV9LyR7Z2V0VmVyc2lvbiggc2ltRGF0YSApfS8ke3VzZVRvcExldmVsSW5kZXggPyAnJyA6ICd3cmFwcGVycy9pbmRleC8nfWAgKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBwaGV0aW9MaW5rcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHdoZXRoZXIgcGhldC1pbyBTdHVkaW8gaXMgYmVpbmcgdXNlZCBpbnN0ZWFkIG9mIGRlcHJlY2F0ZWQgaW5zdGFuY2UgcHJveGllcyB3cmFwcGVyLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gYnJhbmNoXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxib29sZWFuPn1cclxuICovXHJcbmFzeW5jIGZ1bmN0aW9uIHVzZXNUb3BMZXZlbEluZGV4KCByZXBvLCBicmFuY2ggKSB7XHJcbiAgYXdhaXQgZ2l0Q2hlY2tvdXQoIHJlcG8sIGJyYW5jaCApO1xyXG4gIGNvbnN0IGRlcGVuZGVuY2llcyA9IGF3YWl0IGdldERlcGVuZGVuY2llcyggcmVwbyApO1xyXG4gIGNvbnN0IHNoYSA9IGRlcGVuZGVuY2llcy5jaGlwcGVyLnNoYTtcclxuICBhd2FpdCBnaXRDaGVja291dCggcmVwbywgJ21haW4nICk7XHJcblxyXG4gIHJldHVybiBnaXRJc0FuY2VzdG9yKCAnY2hpcHBlcicsICc4ZGIwNjUzZWUwY2JiNmVkNzE2ZmEzYjRkNDc1OWJjYjc1ZDgxMThhJywgc2hhICk7XHJcbn1cclxuXHJcbi8vIHtPYmplY3R9IG1ldGFkYXRhIC0+IHZlcnNpb24gc3RyaW5nXHJcbmNvbnN0IGdldFZlcnNpb24gPSBzaW1EYXRhID0+IGAke3NpbURhdGEudmVyc2lvbk1ham9yfS4ke3NpbURhdGEudmVyc2lvbk1pbm9yfWA7XHJcblxyXG4vLyB7T2JqZWN0fSBtZXRhZGF0YSAtPiBicmFuY2ggbmFtZVxyXG5jb25zdCBnZXRCcmFuY2ggPSBzaW1EYXRhID0+IHtcclxuICBsZXQgYnJhbmNoID0gYCR7c2ltRGF0YS52ZXJzaW9uTWFqb3J9LiR7c2ltRGF0YS52ZXJzaW9uTWlub3J9YDtcclxuICBpZiAoIHNpbURhdGEudmVyc2lvblN1ZmZpeC5sZW5ndGggKSB7XHJcbiAgICBicmFuY2ggKz0gYC0ke3NpbURhdGEudmVyc2lvblN1ZmZpeH1gOyAvLyBhZGRpdGlvbmFsIGRhc2ggcmVxdWlyZWRcclxuICB9XHJcbiAgcmV0dXJuIGJyYW5jaDtcclxufTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE1BQU1BLENBQUMsR0FBR0MsT0FBTyxDQUFFLFFBQVMsQ0FBQztBQUM3QixNQUFNQyxlQUFlLEdBQUdELE9BQU8sQ0FBRSxtQkFBb0IsQ0FBQztBQUN0RCxNQUFNRSxXQUFXLEdBQUdGLE9BQU8sQ0FBRSxlQUFnQixDQUFDO0FBQzlDLE1BQU1HLGFBQWEsR0FBR0gsT0FBTyxDQUFFLGlCQUFrQixDQUFDO0FBQ2xELE1BQU1JLGlCQUFpQixHQUFHSixPQUFPLENBQUUscUJBQXNCLENBQUM7QUFFMURLLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLFlBQVk7RUFFM0I7RUFDQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNQyxXQUFXLEdBQUcsTUFBTUgsaUJBQWlCLENBQUU7SUFDM0NJLE1BQU0sRUFBRSxJQUFJO0lBQ1pDLE1BQU0sRUFBRTtFQUNWLENBQUUsQ0FBQzs7RUFFSDtFQUNBLE1BQU1DLGlCQUFpQixHQUFHWCxDQUFDLENBQUNZLE1BQU0sQ0FBRUosV0FBVyxFQUFFSyxPQUFPLElBQUssR0FBRUEsT0FBTyxDQUFDQyxJQUFLLEdBQUVDLFVBQVUsQ0FBRUYsT0FBUSxDQUFFLEVBQUUsQ0FBQyxDQUFDRyxPQUFPLENBQUMsQ0FBQzs7RUFFakg7RUFDQSxNQUFNQyxvQkFBb0IsR0FBR2pCLENBQUMsQ0FBQ2tCLE1BQU0sQ0FBRVAsaUJBQWlCLEVBQUVFLE9BQU8sSUFBSUEsT0FBTyxDQUFDQyxJQUFLLENBQUMsQ0FBQ0UsT0FBTyxDQUFDLENBQUM7RUFFN0YsTUFBTUcsV0FBVyxHQUFHLEVBQUU7RUFDdEIsS0FBTSxNQUFNTixPQUFPLElBQUlJLG9CQUFvQixFQUFHO0lBRTVDLE1BQU1HLGdCQUFnQixHQUFHLE1BQU1DLGlCQUFpQixDQUFFUixPQUFPLENBQUNDLElBQUksRUFBRVEsU0FBUyxDQUFFVCxPQUFRLENBQUUsQ0FBQztJQUV0Rk0sV0FBVyxDQUFDSSxJQUFJLENBQUcscUNBQW9DVixPQUFPLENBQUNDLElBQUssSUFBR0MsVUFBVSxDQUFFRixPQUFRLENBQUUsSUFBR08sZ0JBQWdCLEdBQUcsRUFBRSxHQUFHLGlCQUFrQixFQUFFLENBQUM7RUFDL0k7RUFFQSxPQUFPRCxXQUFXO0FBQ3BCLENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxlQUFlRSxpQkFBaUJBLENBQUVHLElBQUksRUFBRUMsTUFBTSxFQUFHO0VBQy9DLE1BQU10QixXQUFXLENBQUVxQixJQUFJLEVBQUVDLE1BQU8sQ0FBQztFQUNqQyxNQUFNQyxZQUFZLEdBQUcsTUFBTXhCLGVBQWUsQ0FBRXNCLElBQUssQ0FBQztFQUNsRCxNQUFNRyxHQUFHLEdBQUdELFlBQVksQ0FBQ0UsT0FBTyxDQUFDRCxHQUFHO0VBQ3BDLE1BQU14QixXQUFXLENBQUVxQixJQUFJLEVBQUUsTUFBTyxDQUFDO0VBRWpDLE9BQU9wQixhQUFhLENBQUUsU0FBUyxFQUFFLDBDQUEwQyxFQUFFdUIsR0FBSSxDQUFDO0FBQ3BGOztBQUVBO0FBQ0EsTUFBTVosVUFBVSxHQUFHRixPQUFPLElBQUssR0FBRUEsT0FBTyxDQUFDZ0IsWUFBYSxJQUFHaEIsT0FBTyxDQUFDaUIsWUFBYSxFQUFDOztBQUUvRTtBQUNBLE1BQU1SLFNBQVMsR0FBR1QsT0FBTyxJQUFJO0VBQzNCLElBQUlZLE1BQU0sR0FBSSxHQUFFWixPQUFPLENBQUNnQixZQUFhLElBQUdoQixPQUFPLENBQUNpQixZQUFhLEVBQUM7RUFDOUQsSUFBS2pCLE9BQU8sQ0FBQ2tCLGFBQWEsQ0FBQ0MsTUFBTSxFQUFHO0lBQ2xDUCxNQUFNLElBQUssSUFBR1osT0FBTyxDQUFDa0IsYUFBYyxFQUFDLENBQUMsQ0FBQztFQUN6QztFQUNBLE9BQU9OLE1BQU07QUFDZixDQUFDIiwiaWdub3JlTGlzdCI6W119