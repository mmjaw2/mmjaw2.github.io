"use strict";

// Copyright 2002-2015, University of Colorado Boulder

var assert = require('assert');

/**
 * Gets configuration information that is related to deploying sims.
 *
 * All fields are @public (read-only).
 * Fields include:
 *
 * Required:
 * {string} buildServerAuthorizationCode - password that verifies if build request comes from phet team members
 * {string} devUsername - username on our dev server
 *
 * Optional:
 * {string} devDeployServer - name of the dev server, defaults to 'bayes.colorado.edu'
 * {string} devDeployPath - path on dev server to deploy to, defaults to '/data/web/htdocs/dev/html/'
 * {string} productionServerURL - production server url, defaults to 'https://phet.colorado.edu', can be over-ridden to 'https://phet-dev.colorado.edu'
 *
 * Include these fields in build-local.json to enable sending emails from build-server on build failure.
 * They are only needed on the production server, not locally. A valid emailUsername and emailPassword are needed to authenticate
 * sending mail from the smtp server, though the actual emails will be sent from 'PhET Build Server <phethelp@colorado.edu>',
 * not from the address you put here.
 * {string} emailUsername - e.g. "[identikey]@colorado.edu"
 * {string} emailPassword
 * {string} emailServer - (optional: defaults to "smtp.colorado.edu")
 * {string} emailTo - e.g. "Me <[identikey]@colorado.edu>, Another Person <person@example.com>"
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Aaron Davis
 */

/**
 * @param fs - the node fs API
 * @returns {Object} deploy configuration information, fields documented above
 *
 * @private
 */
function getDeployConfig(fs) {
  //------------------------------------------------------------------------------------
  // read configuration file
  var BUILD_LOCAL_FILENAME = "".concat(process.env.HOME, "/.phet/build-local.json");
  var buildLocalJSON = JSON.parse(fs.readFileSync(BUILD_LOCAL_FILENAME, {
    encoding: 'utf-8'
  }));
  assert(buildLocalJSON.buildServerAuthorizationCode, "buildServerAuthorizationCode missing from ".concat(BUILD_LOCAL_FILENAME));
  assert(buildLocalJSON.devUsername, "devUsername missing from ".concat(BUILD_LOCAL_FILENAME));

  //------------------------------------------------------------------------------------
  // Assemble the deployConfig

  return {
    babelBranch: buildLocalJSON.babelBranch || 'main',
    buildServerAuthorizationCode: buildLocalJSON.buildServerAuthorizationCode,
    databaseAuthorizationCode: buildLocalJSON.databaseAuthorizationCode,
    devDeployPath: buildLocalJSON.devDeployPath || '/data/web/htdocs/dev/html/',
    devDeployServer: buildLocalJSON.devDeployServer || 'bayes.colorado.edu',
    devUsername: buildLocalJSON.devUsername,
    emailPassword: buildLocalJSON.emailPassword,
    emailServer: buildLocalJSON.emailServer || 'smtp.office365.com',
    emailTo: buildLocalJSON.emailTo,
    emailUsername: buildLocalJSON.emailUsername,
    htmlSimsDirectory: buildLocalJSON.htmlSimsDirectory,
    phetioSimsDirectory: buildLocalJSON.phetioSimsDirectory,
    pgConnectionString: buildLocalJSON.pgConnectionString,
    productionServerURL: buildLocalJSON.productionServerURL || 'https://phet.colorado.edu',
    serverToken: buildLocalJSON.serverToken,
    verbose: buildLocalJSON.verbose || buildLocalJSON.verbose === 'true'
  };
}
module.exports = getDeployConfig;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3NlcnQiLCJyZXF1aXJlIiwiZ2V0RGVwbG95Q29uZmlnIiwiZnMiLCJCVUlMRF9MT0NBTF9GSUxFTkFNRSIsImNvbmNhdCIsInByb2Nlc3MiLCJlbnYiLCJIT01FIiwiYnVpbGRMb2NhbEpTT04iLCJKU09OIiwicGFyc2UiLCJyZWFkRmlsZVN5bmMiLCJlbmNvZGluZyIsImJ1aWxkU2VydmVyQXV0aG9yaXphdGlvbkNvZGUiLCJkZXZVc2VybmFtZSIsImJhYmVsQnJhbmNoIiwiZGF0YWJhc2VBdXRob3JpemF0aW9uQ29kZSIsImRldkRlcGxveVBhdGgiLCJkZXZEZXBsb3lTZXJ2ZXIiLCJlbWFpbFBhc3N3b3JkIiwiZW1haWxTZXJ2ZXIiLCJlbWFpbFRvIiwiZW1haWxVc2VybmFtZSIsImh0bWxTaW1zRGlyZWN0b3J5IiwicGhldGlvU2ltc0RpcmVjdG9yeSIsInBnQ29ubmVjdGlvblN0cmluZyIsInByb2R1Y3Rpb25TZXJ2ZXJVUkwiLCJzZXJ2ZXJUb2tlbiIsInZlcmJvc2UiLCJtb2R1bGUiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsiZ2V0QnVpbGRTZXJ2ZXJDb25maWcuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMDItMjAxNSwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG5cclxuY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSggJ2Fzc2VydCcgKTtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGNvbmZpZ3VyYXRpb24gaW5mb3JtYXRpb24gdGhhdCBpcyByZWxhdGVkIHRvIGRlcGxveWluZyBzaW1zLlxyXG4gKlxyXG4gKiBBbGwgZmllbGRzIGFyZSBAcHVibGljIChyZWFkLW9ubHkpLlxyXG4gKiBGaWVsZHMgaW5jbHVkZTpcclxuICpcclxuICogUmVxdWlyZWQ6XHJcbiAqIHtzdHJpbmd9IGJ1aWxkU2VydmVyQXV0aG9yaXphdGlvbkNvZGUgLSBwYXNzd29yZCB0aGF0IHZlcmlmaWVzIGlmIGJ1aWxkIHJlcXVlc3QgY29tZXMgZnJvbSBwaGV0IHRlYW0gbWVtYmVyc1xyXG4gKiB7c3RyaW5nfSBkZXZVc2VybmFtZSAtIHVzZXJuYW1lIG9uIG91ciBkZXYgc2VydmVyXHJcbiAqXHJcbiAqIE9wdGlvbmFsOlxyXG4gKiB7c3RyaW5nfSBkZXZEZXBsb3lTZXJ2ZXIgLSBuYW1lIG9mIHRoZSBkZXYgc2VydmVyLCBkZWZhdWx0cyB0byAnYmF5ZXMuY29sb3JhZG8uZWR1J1xyXG4gKiB7c3RyaW5nfSBkZXZEZXBsb3lQYXRoIC0gcGF0aCBvbiBkZXYgc2VydmVyIHRvIGRlcGxveSB0bywgZGVmYXVsdHMgdG8gJy9kYXRhL3dlYi9odGRvY3MvZGV2L2h0bWwvJ1xyXG4gKiB7c3RyaW5nfSBwcm9kdWN0aW9uU2VydmVyVVJMIC0gcHJvZHVjdGlvbiBzZXJ2ZXIgdXJsLCBkZWZhdWx0cyB0byAnaHR0cHM6Ly9waGV0LmNvbG9yYWRvLmVkdScsIGNhbiBiZSBvdmVyLXJpZGRlbiB0byAnaHR0cHM6Ly9waGV0LWRldi5jb2xvcmFkby5lZHUnXHJcbiAqXHJcbiAqIEluY2x1ZGUgdGhlc2UgZmllbGRzIGluIGJ1aWxkLWxvY2FsLmpzb24gdG8gZW5hYmxlIHNlbmRpbmcgZW1haWxzIGZyb20gYnVpbGQtc2VydmVyIG9uIGJ1aWxkIGZhaWx1cmUuXHJcbiAqIFRoZXkgYXJlIG9ubHkgbmVlZGVkIG9uIHRoZSBwcm9kdWN0aW9uIHNlcnZlciwgbm90IGxvY2FsbHkuIEEgdmFsaWQgZW1haWxVc2VybmFtZSBhbmQgZW1haWxQYXNzd29yZCBhcmUgbmVlZGVkIHRvIGF1dGhlbnRpY2F0ZVxyXG4gKiBzZW5kaW5nIG1haWwgZnJvbSB0aGUgc210cCBzZXJ2ZXIsIHRob3VnaCB0aGUgYWN0dWFsIGVtYWlscyB3aWxsIGJlIHNlbnQgZnJvbSAnUGhFVCBCdWlsZCBTZXJ2ZXIgPHBoZXRoZWxwQGNvbG9yYWRvLmVkdT4nLFxyXG4gKiBub3QgZnJvbSB0aGUgYWRkcmVzcyB5b3UgcHV0IGhlcmUuXHJcbiAqIHtzdHJpbmd9IGVtYWlsVXNlcm5hbWUgLSBlLmcuIFwiW2lkZW50aWtleV1AY29sb3JhZG8uZWR1XCJcclxuICoge3N0cmluZ30gZW1haWxQYXNzd29yZFxyXG4gKiB7c3RyaW5nfSBlbWFpbFNlcnZlciAtIChvcHRpb25hbDogZGVmYXVsdHMgdG8gXCJzbXRwLmNvbG9yYWRvLmVkdVwiKVxyXG4gKiB7c3RyaW5nfSBlbWFpbFRvIC0gZS5nLiBcIk1lIDxbaWRlbnRpa2V5XUBjb2xvcmFkby5lZHU+LCBBbm90aGVyIFBlcnNvbiA8cGVyc29uQGV4YW1wbGUuY29tPlwiXHJcbiAqXHJcbiAqIEBhdXRob3IgQ2hyaXMgTWFsbGV5IChQaXhlbFpvb20sIEluYy4pXHJcbiAqIEBhdXRob3IgQWFyb24gRGF2aXNcclxuICovXHJcblxyXG4vKipcclxuICogQHBhcmFtIGZzIC0gdGhlIG5vZGUgZnMgQVBJXHJcbiAqIEByZXR1cm5zIHtPYmplY3R9IGRlcGxveSBjb25maWd1cmF0aW9uIGluZm9ybWF0aW9uLCBmaWVsZHMgZG9jdW1lbnRlZCBhYm92ZVxyXG4gKlxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0RGVwbG95Q29uZmlnKCBmcyApIHtcclxuXHJcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAvLyByZWFkIGNvbmZpZ3VyYXRpb24gZmlsZVxyXG4gIGNvbnN0IEJVSUxEX0xPQ0FMX0ZJTEVOQU1FID0gYCR7cHJvY2Vzcy5lbnYuSE9NRX0vLnBoZXQvYnVpbGQtbG9jYWwuanNvbmA7XHJcbiAgY29uc3QgYnVpbGRMb2NhbEpTT04gPSBKU09OLnBhcnNlKCBmcy5yZWFkRmlsZVN5bmMoIEJVSUxEX0xPQ0FMX0ZJTEVOQU1FLCB7IGVuY29kaW5nOiAndXRmLTgnIH0gKSApO1xyXG4gIGFzc2VydCggYnVpbGRMb2NhbEpTT04uYnVpbGRTZXJ2ZXJBdXRob3JpemF0aW9uQ29kZSwgYGJ1aWxkU2VydmVyQXV0aG9yaXphdGlvbkNvZGUgbWlzc2luZyBmcm9tICR7QlVJTERfTE9DQUxfRklMRU5BTUV9YCApO1xyXG4gIGFzc2VydCggYnVpbGRMb2NhbEpTT04uZGV2VXNlcm5hbWUsIGBkZXZVc2VybmFtZSBtaXNzaW5nIGZyb20gJHtCVUlMRF9MT0NBTF9GSUxFTkFNRX1gICk7XHJcblxyXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgLy8gQXNzZW1ibGUgdGhlIGRlcGxveUNvbmZpZ1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgYmFiZWxCcmFuY2g6IGJ1aWxkTG9jYWxKU09OLmJhYmVsQnJhbmNoIHx8ICdtYWluJyxcclxuICAgIGJ1aWxkU2VydmVyQXV0aG9yaXphdGlvbkNvZGU6IGJ1aWxkTG9jYWxKU09OLmJ1aWxkU2VydmVyQXV0aG9yaXphdGlvbkNvZGUsXHJcbiAgICBkYXRhYmFzZUF1dGhvcml6YXRpb25Db2RlOiBidWlsZExvY2FsSlNPTi5kYXRhYmFzZUF1dGhvcml6YXRpb25Db2RlLFxyXG4gICAgZGV2RGVwbG95UGF0aDogYnVpbGRMb2NhbEpTT04uZGV2RGVwbG95UGF0aCB8fCAnL2RhdGEvd2ViL2h0ZG9jcy9kZXYvaHRtbC8nLFxyXG4gICAgZGV2RGVwbG95U2VydmVyOiBidWlsZExvY2FsSlNPTi5kZXZEZXBsb3lTZXJ2ZXIgfHwgJ2JheWVzLmNvbG9yYWRvLmVkdScsXHJcbiAgICBkZXZVc2VybmFtZTogYnVpbGRMb2NhbEpTT04uZGV2VXNlcm5hbWUsXHJcbiAgICBlbWFpbFBhc3N3b3JkOiBidWlsZExvY2FsSlNPTi5lbWFpbFBhc3N3b3JkLFxyXG4gICAgZW1haWxTZXJ2ZXI6IGJ1aWxkTG9jYWxKU09OLmVtYWlsU2VydmVyIHx8ICdzbXRwLm9mZmljZTM2NS5jb20nLFxyXG4gICAgZW1haWxUbzogYnVpbGRMb2NhbEpTT04uZW1haWxUbyxcclxuICAgIGVtYWlsVXNlcm5hbWU6IGJ1aWxkTG9jYWxKU09OLmVtYWlsVXNlcm5hbWUsXHJcbiAgICBodG1sU2ltc0RpcmVjdG9yeTogYnVpbGRMb2NhbEpTT04uaHRtbFNpbXNEaXJlY3RvcnksXHJcbiAgICBwaGV0aW9TaW1zRGlyZWN0b3J5OiBidWlsZExvY2FsSlNPTi5waGV0aW9TaW1zRGlyZWN0b3J5LFxyXG4gICAgcGdDb25uZWN0aW9uU3RyaW5nOiBidWlsZExvY2FsSlNPTi5wZ0Nvbm5lY3Rpb25TdHJpbmcsXHJcbiAgICBwcm9kdWN0aW9uU2VydmVyVVJMOiBidWlsZExvY2FsSlNPTi5wcm9kdWN0aW9uU2VydmVyVVJMIHx8ICdodHRwczovL3BoZXQuY29sb3JhZG8uZWR1JyxcclxuICAgIHNlcnZlclRva2VuOiBidWlsZExvY2FsSlNPTi5zZXJ2ZXJUb2tlbixcclxuICAgIHZlcmJvc2U6IGJ1aWxkTG9jYWxKU09OLnZlcmJvc2UgfHwgYnVpbGRMb2NhbEpTT04udmVyYm9zZSA9PT0gJ3RydWUnXHJcbiAgfTtcclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZ2V0RGVwbG95Q29uZmlnOyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFHQSxJQUFNQSxNQUFNLEdBQUdDLE9BQU8sQ0FBRSxRQUFTLENBQUM7O0FBRWxDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTQyxlQUFlQSxDQUFFQyxFQUFFLEVBQUc7RUFFN0I7RUFDQTtFQUNBLElBQU1DLG9CQUFvQixNQUFBQyxNQUFBLENBQU1DLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDQyxJQUFJLDRCQUF5QjtFQUN6RSxJQUFNQyxjQUFjLEdBQUdDLElBQUksQ0FBQ0MsS0FBSyxDQUFFUixFQUFFLENBQUNTLFlBQVksQ0FBRVIsb0JBQW9CLEVBQUU7SUFBRVMsUUFBUSxFQUFFO0VBQVEsQ0FBRSxDQUFFLENBQUM7RUFDbkdiLE1BQU0sQ0FBRVMsY0FBYyxDQUFDSyw0QkFBNEIsK0NBQUFULE1BQUEsQ0FBK0NELG9CQUFvQixDQUFHLENBQUM7RUFDMUhKLE1BQU0sQ0FBRVMsY0FBYyxDQUFDTSxXQUFXLDhCQUFBVixNQUFBLENBQThCRCxvQkFBb0IsQ0FBRyxDQUFDOztFQUV4RjtFQUNBOztFQUVBLE9BQU87SUFDTFksV0FBVyxFQUFFUCxjQUFjLENBQUNPLFdBQVcsSUFBSSxNQUFNO0lBQ2pERiw0QkFBNEIsRUFBRUwsY0FBYyxDQUFDSyw0QkFBNEI7SUFDekVHLHlCQUF5QixFQUFFUixjQUFjLENBQUNRLHlCQUF5QjtJQUNuRUMsYUFBYSxFQUFFVCxjQUFjLENBQUNTLGFBQWEsSUFBSSw0QkFBNEI7SUFDM0VDLGVBQWUsRUFBRVYsY0FBYyxDQUFDVSxlQUFlLElBQUksb0JBQW9CO0lBQ3ZFSixXQUFXLEVBQUVOLGNBQWMsQ0FBQ00sV0FBVztJQUN2Q0ssYUFBYSxFQUFFWCxjQUFjLENBQUNXLGFBQWE7SUFDM0NDLFdBQVcsRUFBRVosY0FBYyxDQUFDWSxXQUFXLElBQUksb0JBQW9CO0lBQy9EQyxPQUFPLEVBQUViLGNBQWMsQ0FBQ2EsT0FBTztJQUMvQkMsYUFBYSxFQUFFZCxjQUFjLENBQUNjLGFBQWE7SUFDM0NDLGlCQUFpQixFQUFFZixjQUFjLENBQUNlLGlCQUFpQjtJQUNuREMsbUJBQW1CLEVBQUVoQixjQUFjLENBQUNnQixtQkFBbUI7SUFDdkRDLGtCQUFrQixFQUFFakIsY0FBYyxDQUFDaUIsa0JBQWtCO0lBQ3JEQyxtQkFBbUIsRUFBRWxCLGNBQWMsQ0FBQ2tCLG1CQUFtQixJQUFJLDJCQUEyQjtJQUN0RkMsV0FBVyxFQUFFbkIsY0FBYyxDQUFDbUIsV0FBVztJQUN2Q0MsT0FBTyxFQUFFcEIsY0FBYyxDQUFDb0IsT0FBTyxJQUFJcEIsY0FBYyxDQUFDb0IsT0FBTyxLQUFLO0VBQ2hFLENBQUM7QUFFSDtBQUVBQyxNQUFNLENBQUNDLE9BQU8sR0FBRzdCLGVBQWUiLCJpZ25vcmVMaXN0IjpbXX0=