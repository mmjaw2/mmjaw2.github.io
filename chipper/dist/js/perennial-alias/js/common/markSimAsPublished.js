// Copyright 2022, University of Colorado Boulder

/**
 * Ensures that a simulation is marked as published in its package.json
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const gitAdd = require('./gitAdd');
const gitCommit = require('./gitCommit');
const gitPush = require('./gitPush');
const fs = require('fs');

/**
 * Ensures that a simulation is marked as published in its package.json
 * @public
 *
 * @param {string} repo
 *
 * @returns {Promise<void>}
 */
module.exports = async function (repo) {
  const packageObject = JSON.parse(fs.readFileSync(`../${repo}/package.json`, 'utf8'));
  if (!packageObject.phet.published) {
    packageObject.phet.published = true;
    fs.writeFileSync(`../${repo}/package.json`, JSON.stringify(packageObject, null, 2));
    await gitAdd(repo, 'package.json');
    await gitCommit(repo, 'Marking repository as published');
    await gitPush(repo, 'main');
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJnaXRBZGQiLCJyZXF1aXJlIiwiZ2l0Q29tbWl0IiwiZ2l0UHVzaCIsImZzIiwibW9kdWxlIiwiZXhwb3J0cyIsInJlcG8iLCJwYWNrYWdlT2JqZWN0IiwiSlNPTiIsInBhcnNlIiwicmVhZEZpbGVTeW5jIiwicGhldCIsInB1Ymxpc2hlZCIsIndyaXRlRmlsZVN5bmMiLCJzdHJpbmdpZnkiXSwic291cmNlcyI6WyJtYXJrU2ltQXNQdWJsaXNoZWQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjIsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEVuc3VyZXMgdGhhdCBhIHNpbXVsYXRpb24gaXMgbWFya2VkIGFzIHB1Ymxpc2hlZCBpbiBpdHMgcGFja2FnZS5qc29uXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBnaXRBZGQgPSByZXF1aXJlKCAnLi9naXRBZGQnICk7XHJcbmNvbnN0IGdpdENvbW1pdCA9IHJlcXVpcmUoICcuL2dpdENvbW1pdCcgKTtcclxuY29uc3QgZ2l0UHVzaCA9IHJlcXVpcmUoICcuL2dpdFB1c2gnICk7XHJcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG5cclxuLyoqXHJcbiAqIEVuc3VyZXMgdGhhdCBhIHNpbXVsYXRpb24gaXMgbWFya2VkIGFzIHB1Ymxpc2hlZCBpbiBpdHMgcGFja2FnZS5qc29uXHJcbiAqIEBwdWJsaWNcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG9cclxuICpcclxuICogQHJldHVybnMge1Byb21pc2U8dm9pZD59XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uKCByZXBvICkge1xyXG4gIGNvbnN0IHBhY2thZ2VPYmplY3QgPSBKU09OLnBhcnNlKCBmcy5yZWFkRmlsZVN5bmMoIGAuLi8ke3JlcG99L3BhY2thZ2UuanNvbmAsICd1dGY4JyApICk7XHJcblxyXG4gIGlmICggIXBhY2thZ2VPYmplY3QucGhldC5wdWJsaXNoZWQgKSB7XHJcbiAgICBwYWNrYWdlT2JqZWN0LnBoZXQucHVibGlzaGVkID0gdHJ1ZTtcclxuICAgIGZzLndyaXRlRmlsZVN5bmMoIGAuLi8ke3JlcG99L3BhY2thZ2UuanNvbmAsIEpTT04uc3RyaW5naWZ5KCBwYWNrYWdlT2JqZWN0LCBudWxsLCAyICkgKTtcclxuXHJcbiAgICBhd2FpdCBnaXRBZGQoIHJlcG8sICdwYWNrYWdlLmpzb24nICk7XHJcbiAgICBhd2FpdCBnaXRDb21taXQoIHJlcG8sICdNYXJraW5nIHJlcG9zaXRvcnkgYXMgcHVibGlzaGVkJyApO1xyXG4gICAgYXdhaXQgZ2l0UHVzaCggcmVwbywgJ21haW4nICk7XHJcbiAgfVxyXG59OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxNQUFNQSxNQUFNLEdBQUdDLE9BQU8sQ0FBRSxVQUFXLENBQUM7QUFDcEMsTUFBTUMsU0FBUyxHQUFHRCxPQUFPLENBQUUsYUFBYyxDQUFDO0FBQzFDLE1BQU1FLE9BQU8sR0FBR0YsT0FBTyxDQUFFLFdBQVksQ0FBQztBQUN0QyxNQUFNRyxFQUFFLEdBQUdILE9BQU8sQ0FBRSxJQUFLLENBQUM7O0FBRTFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQUksTUFBTSxDQUFDQyxPQUFPLEdBQUcsZ0JBQWdCQyxJQUFJLEVBQUc7RUFDdEMsTUFBTUMsYUFBYSxHQUFHQyxJQUFJLENBQUNDLEtBQUssQ0FBRU4sRUFBRSxDQUFDTyxZQUFZLENBQUcsTUFBS0osSUFBSyxlQUFjLEVBQUUsTUFBTyxDQUFFLENBQUM7RUFFeEYsSUFBSyxDQUFDQyxhQUFhLENBQUNJLElBQUksQ0FBQ0MsU0FBUyxFQUFHO0lBQ25DTCxhQUFhLENBQUNJLElBQUksQ0FBQ0MsU0FBUyxHQUFHLElBQUk7SUFDbkNULEVBQUUsQ0FBQ1UsYUFBYSxDQUFHLE1BQUtQLElBQUssZUFBYyxFQUFFRSxJQUFJLENBQUNNLFNBQVMsQ0FBRVAsYUFBYSxFQUFFLElBQUksRUFBRSxDQUFFLENBQUUsQ0FBQztJQUV2RixNQUFNUixNQUFNLENBQUVPLElBQUksRUFBRSxjQUFlLENBQUM7SUFDcEMsTUFBTUwsU0FBUyxDQUFFSyxJQUFJLEVBQUUsaUNBQWtDLENBQUM7SUFDMUQsTUFBTUosT0FBTyxDQUFFSSxJQUFJLEVBQUUsTUFBTyxDQUFDO0VBQy9CO0FBQ0YsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==