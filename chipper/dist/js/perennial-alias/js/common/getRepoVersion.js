// Copyright 2017, University of Colorado Boulder

/**
 * Returns the version of the current checked-in repo's package.json
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const SimVersion = require('./SimVersion');
const loadJSON = require('./loadJSON');
const winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Returns the version for a current checked-in repo
 * @public
 *
 * @param {string} repo - The repository name
 * @returns {Promise.<SimVersion>}
 */
module.exports = async function (repo) {
  winston.debug(`Reading version from package.json for ${repo}`);
  const packageObject = await loadJSON(`../${repo}/package.json`);
  return SimVersion.parse(packageObject.version);
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTaW1WZXJzaW9uIiwicmVxdWlyZSIsImxvYWRKU09OIiwid2luc3RvbiIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXBvIiwiZGVidWciLCJwYWNrYWdlT2JqZWN0IiwicGFyc2UiLCJ2ZXJzaW9uIl0sInNvdXJjZXMiOlsiZ2V0UmVwb1ZlcnNpb24uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTcsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgdGhlIHZlcnNpb24gb2YgdGhlIGN1cnJlbnQgY2hlY2tlZC1pbiByZXBvJ3MgcGFja2FnZS5qc29uXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBTaW1WZXJzaW9uID0gcmVxdWlyZSggJy4vU2ltVmVyc2lvbicgKTtcclxuY29uc3QgbG9hZEpTT04gPSByZXF1aXJlKCAnLi9sb2FkSlNPTicgKTtcclxuY29uc3Qgd2luc3RvbiA9IHJlcXVpcmUoICd3aW5zdG9uJyApO1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgdGhlIHZlcnNpb24gZm9yIGEgY3VycmVudCBjaGVja2VkLWluIHJlcG9cclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbyAtIFRoZSByZXBvc2l0b3J5IG5hbWVcclxuICogQHJldHVybnMge1Byb21pc2UuPFNpbVZlcnNpb24+fVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiggcmVwbyApIHtcclxuICB3aW5zdG9uLmRlYnVnKCBgUmVhZGluZyB2ZXJzaW9uIGZyb20gcGFja2FnZS5qc29uIGZvciAke3JlcG99YCApO1xyXG5cclxuICBjb25zdCBwYWNrYWdlT2JqZWN0ID0gYXdhaXQgbG9hZEpTT04oIGAuLi8ke3JlcG99L3BhY2thZ2UuanNvbmAgKTtcclxuICByZXR1cm4gU2ltVmVyc2lvbi5wYXJzZSggcGFja2FnZU9iamVjdC52ZXJzaW9uICk7XHJcbn07Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE1BQU1BLFVBQVUsR0FBR0MsT0FBTyxDQUFFLGNBQWUsQ0FBQztBQUM1QyxNQUFNQyxRQUFRLEdBQUdELE9BQU8sQ0FBRSxZQUFhLENBQUM7QUFDeEMsTUFBTUUsT0FBTyxHQUFHRixPQUFPLENBQUUsU0FBVSxDQUFDOztBQUVwQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBRyxNQUFNLENBQUNDLE9BQU8sR0FBRyxnQkFBZ0JDLElBQUksRUFBRztFQUN0Q0gsT0FBTyxDQUFDSSxLQUFLLENBQUcseUNBQXdDRCxJQUFLLEVBQUUsQ0FBQztFQUVoRSxNQUFNRSxhQUFhLEdBQUcsTUFBTU4sUUFBUSxDQUFHLE1BQUtJLElBQUssZUFBZSxDQUFDO0VBQ2pFLE9BQU9OLFVBQVUsQ0FBQ1MsS0FBSyxDQUFFRCxhQUFhLENBQUNFLE9BQVEsQ0FBQztBQUNsRCxDQUFDIiwiaWdub3JlTGlzdCI6W119