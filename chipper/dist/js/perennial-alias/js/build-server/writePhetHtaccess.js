// Copyright 2017-2018, University of Colorado Boulder
// @author Matt Pennington (PhET Interactive Simulations)

const constants = require('./constants');
const SimVersion = require('../common/SimVersion');
const writeFile = require('../common/writeFile');
const axios = require('axios');

/**
 * Write the .htaccess file to make "latest" point to the version being deployed and allow "download" links to work on Safari
 * @param simName
 * @param version
 */
module.exports = async function writePhetHtaccess(simName, version) {
  const metadataURL = `${constants.BUILD_SERVER_CONFIG.productionServerURL}/services/metadata/1.2/simulations?format=json&type=html&summary&include-unpublished=true&simulation=${simName}`;
  const pass = constants.BUILD_SERVER_CONFIG.serverToken;
  let response;
  try {
    response = await axios({
      url: metadataURL,
      auth: {
        username: 'token',
        password: pass
      }
    });
  } catch (e) {
    throw new Error(e);
  }
  const body = response.data;

  // We got an error and the simulation has already been deployed to the website, bail!
  if (body.error && body.error[0] !== 'No sims found with the criteria provided') {
    throw new Error(body.error);
  }
  // We did not get an error, compare the deploy request version with the website, if the request is for a later version, update it.
  else if (!body.error) {
    const thisVersion = SimVersion.parse(version);
    const latestVersion = SimVersion.parse(body.projects[0].version.string);
    // The requested deploy is earlier than the latest version, exit without updating the .htacess
    if (thisVersion.compareNumber(latestVersion) < 0) {
      return;
    }
  }

  // We either got an error indicating that the simulation has not yet been deployed, or the requested version is later than the latest version
  // Update the .htaccess file that controls the /latest/ rewrite
  const contents = `${'RewriteEngine on\n' + 'RewriteBase /sims/html/'}${simName}/\n` + `RewriteRule ^latest(.*) ${version}$1\n` + 'Header always set Access-Control-Allow-Origin "*"\n\n' + 'RewriteCond %{QUERY_STRING} =download\n' + 'RewriteRule ([^/]*)$ - [L,E=download:$1]\n' + 'Header onsuccess set Content-disposition "attachment; filename=%{download}e" env=download\n';
  await writeFile(`${constants.HTML_SIMS_DIRECTORY + simName}/.htaccess`, contents);
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb25zdGFudHMiLCJyZXF1aXJlIiwiU2ltVmVyc2lvbiIsIndyaXRlRmlsZSIsImF4aW9zIiwibW9kdWxlIiwiZXhwb3J0cyIsIndyaXRlUGhldEh0YWNjZXNzIiwic2ltTmFtZSIsInZlcnNpb24iLCJtZXRhZGF0YVVSTCIsIkJVSUxEX1NFUlZFUl9DT05GSUciLCJwcm9kdWN0aW9uU2VydmVyVVJMIiwicGFzcyIsInNlcnZlclRva2VuIiwicmVzcG9uc2UiLCJ1cmwiLCJhdXRoIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsImUiLCJFcnJvciIsImJvZHkiLCJkYXRhIiwiZXJyb3IiLCJ0aGlzVmVyc2lvbiIsInBhcnNlIiwibGF0ZXN0VmVyc2lvbiIsInByb2plY3RzIiwic3RyaW5nIiwiY29tcGFyZU51bWJlciIsImNvbnRlbnRzIiwiSFRNTF9TSU1TX0RJUkVDVE9SWSJdLCJzb3VyY2VzIjpbIndyaXRlUGhldEh0YWNjZXNzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMTgsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG4vLyBAYXV0aG9yIE1hdHQgUGVubmluZ3RvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuXHJcblxyXG5jb25zdCBjb25zdGFudHMgPSByZXF1aXJlKCAnLi9jb25zdGFudHMnICk7XHJcbmNvbnN0IFNpbVZlcnNpb24gPSByZXF1aXJlKCAnLi4vY29tbW9uL1NpbVZlcnNpb24nICk7XHJcbmNvbnN0IHdyaXRlRmlsZSA9IHJlcXVpcmUoICcuLi9jb21tb24vd3JpdGVGaWxlJyApO1xyXG5jb25zdCBheGlvcyA9IHJlcXVpcmUoICdheGlvcycgKTtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZSB0aGUgLmh0YWNjZXNzIGZpbGUgdG8gbWFrZSBcImxhdGVzdFwiIHBvaW50IHRvIHRoZSB2ZXJzaW9uIGJlaW5nIGRlcGxveWVkIGFuZCBhbGxvdyBcImRvd25sb2FkXCIgbGlua3MgdG8gd29yayBvbiBTYWZhcmlcclxuICogQHBhcmFtIHNpbU5hbWVcclxuICogQHBhcmFtIHZlcnNpb25cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gd3JpdGVQaGV0SHRhY2Nlc3MoIHNpbU5hbWUsIHZlcnNpb24gKSB7XHJcbiAgY29uc3QgbWV0YWRhdGFVUkwgPSBgJHtjb25zdGFudHMuQlVJTERfU0VSVkVSX0NPTkZJRy5wcm9kdWN0aW9uU2VydmVyVVJMfS9zZXJ2aWNlcy9tZXRhZGF0YS8xLjIvc2ltdWxhdGlvbnM/Zm9ybWF0PWpzb24mdHlwZT1odG1sJnN1bW1hcnkmaW5jbHVkZS11bnB1Ymxpc2hlZD10cnVlJnNpbXVsYXRpb249JHtzaW1OYW1lfWA7XHJcbiAgY29uc3QgcGFzcyA9IGNvbnN0YW50cy5CVUlMRF9TRVJWRVJfQ09ORklHLnNlcnZlclRva2VuO1xyXG4gIGxldCByZXNwb25zZTtcclxuICB0cnkge1xyXG4gICAgcmVzcG9uc2UgPSBhd2FpdCBheGlvcygge1xyXG4gICAgICB1cmw6IG1ldGFkYXRhVVJMLFxyXG4gICAgICBhdXRoOiB7XHJcbiAgICAgICAgdXNlcm5hbWU6ICd0b2tlbicsXHJcbiAgICAgICAgcGFzc3dvcmQ6IHBhc3NcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gIH1cclxuICBjYXRjaCggZSApIHtcclxuICAgIHRocm93IG5ldyBFcnJvciggZSApO1xyXG4gIH1cclxuICBjb25zdCBib2R5ID0gcmVzcG9uc2UuZGF0YTtcclxuXHJcblxyXG4gIC8vIFdlIGdvdCBhbiBlcnJvciBhbmQgdGhlIHNpbXVsYXRpb24gaGFzIGFscmVhZHkgYmVlbiBkZXBsb3llZCB0byB0aGUgd2Vic2l0ZSwgYmFpbCFcclxuICBpZiAoIGJvZHkuZXJyb3IgJiYgYm9keS5lcnJvclsgMCBdICE9PSAnTm8gc2ltcyBmb3VuZCB3aXRoIHRoZSBjcml0ZXJpYSBwcm92aWRlZCcgKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoIGJvZHkuZXJyb3IgKTtcclxuICB9XHJcbiAgLy8gV2UgZGlkIG5vdCBnZXQgYW4gZXJyb3IsIGNvbXBhcmUgdGhlIGRlcGxveSByZXF1ZXN0IHZlcnNpb24gd2l0aCB0aGUgd2Vic2l0ZSwgaWYgdGhlIHJlcXVlc3QgaXMgZm9yIGEgbGF0ZXIgdmVyc2lvbiwgdXBkYXRlIGl0LlxyXG4gIGVsc2UgaWYgKCAhYm9keS5lcnJvciApIHtcclxuICAgIGNvbnN0IHRoaXNWZXJzaW9uID0gU2ltVmVyc2lvbi5wYXJzZSggdmVyc2lvbiApO1xyXG4gICAgY29uc3QgbGF0ZXN0VmVyc2lvbiA9IFNpbVZlcnNpb24ucGFyc2UoIGJvZHkucHJvamVjdHNbIDAgXS52ZXJzaW9uLnN0cmluZyApO1xyXG4gICAgLy8gVGhlIHJlcXVlc3RlZCBkZXBsb3kgaXMgZWFybGllciB0aGFuIHRoZSBsYXRlc3QgdmVyc2lvbiwgZXhpdCB3aXRob3V0IHVwZGF0aW5nIHRoZSAuaHRhY2Vzc1xyXG4gICAgaWYgKCB0aGlzVmVyc2lvbi5jb21wYXJlTnVtYmVyKCBsYXRlc3RWZXJzaW9uICkgPCAwICkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBXZSBlaXRoZXIgZ290IGFuIGVycm9yIGluZGljYXRpbmcgdGhhdCB0aGUgc2ltdWxhdGlvbiBoYXMgbm90IHlldCBiZWVuIGRlcGxveWVkLCBvciB0aGUgcmVxdWVzdGVkIHZlcnNpb24gaXMgbGF0ZXIgdGhhbiB0aGUgbGF0ZXN0IHZlcnNpb25cclxuICAvLyBVcGRhdGUgdGhlIC5odGFjY2VzcyBmaWxlIHRoYXQgY29udHJvbHMgdGhlIC9sYXRlc3QvIHJld3JpdGVcclxuICBjb25zdCBjb250ZW50cyA9IGAkeydSZXdyaXRlRW5naW5lIG9uXFxuJyArXHJcbiAgICAgICAgICAgICAgICAgICAnUmV3cml0ZUJhc2UgL3NpbXMvaHRtbC8nfSR7c2ltTmFtZX0vXFxuYCArXHJcbiAgICAgICAgICAgICAgICAgICBgUmV3cml0ZVJ1bGUgXmxhdGVzdCguKikgJHt2ZXJzaW9ufSQxXFxuYCArXHJcbiAgICAgICAgICAgICAgICAgICAnSGVhZGVyIGFsd2F5cyBzZXQgQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luIFwiKlwiXFxuXFxuJyArXHJcbiAgICAgICAgICAgICAgICAgICAnUmV3cml0ZUNvbmQgJXtRVUVSWV9TVFJJTkd9ID1kb3dubG9hZFxcbicgK1xyXG4gICAgICAgICAgICAgICAgICAgJ1Jld3JpdGVSdWxlIChbXi9dKikkIC0gW0wsRT1kb3dubG9hZDokMV1cXG4nICtcclxuICAgICAgICAgICAgICAgICAgICdIZWFkZXIgb25zdWNjZXNzIHNldCBDb250ZW50LWRpc3Bvc2l0aW9uIFwiYXR0YWNobWVudDsgZmlsZW5hbWU9JXtkb3dubG9hZH1lXCIgZW52PWRvd25sb2FkXFxuJztcclxuICBhd2FpdCB3cml0ZUZpbGUoIGAke2NvbnN0YW50cy5IVE1MX1NJTVNfRElSRUNUT1JZICsgc2ltTmFtZX0vLmh0YWNjZXNzYCwgY29udGVudHMgKTtcclxufTsiXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7O0FBR0EsTUFBTUEsU0FBUyxHQUFHQyxPQUFPLENBQUUsYUFBYyxDQUFDO0FBQzFDLE1BQU1DLFVBQVUsR0FBR0QsT0FBTyxDQUFFLHNCQUF1QixDQUFDO0FBQ3BELE1BQU1FLFNBQVMsR0FBR0YsT0FBTyxDQUFFLHFCQUFzQixDQUFDO0FBQ2xELE1BQU1HLEtBQUssR0FBR0gsT0FBTyxDQUFFLE9BQVEsQ0FBQzs7QUFFaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBSSxNQUFNLENBQUNDLE9BQU8sR0FBRyxlQUFlQyxpQkFBaUJBLENBQUVDLE9BQU8sRUFBRUMsT0FBTyxFQUFHO0VBQ3BFLE1BQU1DLFdBQVcsR0FBSSxHQUFFVixTQUFTLENBQUNXLG1CQUFtQixDQUFDQyxtQkFBb0Isd0dBQXVHSixPQUFRLEVBQUM7RUFDekwsTUFBTUssSUFBSSxHQUFHYixTQUFTLENBQUNXLG1CQUFtQixDQUFDRyxXQUFXO0VBQ3RELElBQUlDLFFBQVE7RUFDWixJQUFJO0lBQ0ZBLFFBQVEsR0FBRyxNQUFNWCxLQUFLLENBQUU7TUFDdEJZLEdBQUcsRUFBRU4sV0FBVztNQUNoQk8sSUFBSSxFQUFFO1FBQ0pDLFFBQVEsRUFBRSxPQUFPO1FBQ2pCQyxRQUFRLEVBQUVOO01BQ1o7SUFDRixDQUFFLENBQUM7RUFDTCxDQUFDLENBQ0QsT0FBT08sQ0FBQyxFQUFHO0lBQ1QsTUFBTSxJQUFJQyxLQUFLLENBQUVELENBQUUsQ0FBQztFQUN0QjtFQUNBLE1BQU1FLElBQUksR0FBR1AsUUFBUSxDQUFDUSxJQUFJOztFQUcxQjtFQUNBLElBQUtELElBQUksQ0FBQ0UsS0FBSyxJQUFJRixJQUFJLENBQUNFLEtBQUssQ0FBRSxDQUFDLENBQUUsS0FBSywwQ0FBMEMsRUFBRztJQUNsRixNQUFNLElBQUlILEtBQUssQ0FBRUMsSUFBSSxDQUFDRSxLQUFNLENBQUM7RUFDL0I7RUFDQTtFQUFBLEtBQ0ssSUFBSyxDQUFDRixJQUFJLENBQUNFLEtBQUssRUFBRztJQUN0QixNQUFNQyxXQUFXLEdBQUd2QixVQUFVLENBQUN3QixLQUFLLENBQUVqQixPQUFRLENBQUM7SUFDL0MsTUFBTWtCLGFBQWEsR0FBR3pCLFVBQVUsQ0FBQ3dCLEtBQUssQ0FBRUosSUFBSSxDQUFDTSxRQUFRLENBQUUsQ0FBQyxDQUFFLENBQUNuQixPQUFPLENBQUNvQixNQUFPLENBQUM7SUFDM0U7SUFDQSxJQUFLSixXQUFXLENBQUNLLGFBQWEsQ0FBRUgsYUFBYyxDQUFDLEdBQUcsQ0FBQyxFQUFHO01BQ3BEO0lBQ0Y7RUFDRjs7RUFFQTtFQUNBO0VBQ0EsTUFBTUksUUFBUSxHQUFJLEdBQUUsb0JBQW9CLEdBQ3ZCLHlCQUEwQixHQUFFdkIsT0FBUSxLQUFJLEdBQ3ZDLDJCQUEwQkMsT0FBUSxNQUFLLEdBQ3hDLHVEQUF1RCxHQUN2RCx5Q0FBeUMsR0FDekMsNENBQTRDLEdBQzVDLDZGQUE2RjtFQUM5RyxNQUFNTixTQUFTLENBQUcsR0FBRUgsU0FBUyxDQUFDZ0MsbUJBQW1CLEdBQUd4QixPQUFRLFlBQVcsRUFBRXVCLFFBQVMsQ0FBQztBQUNyRixDQUFDIiwiaWdub3JlTGlzdCI6W119