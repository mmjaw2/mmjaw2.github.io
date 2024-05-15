// Copyright 2017-2018, University of Colorado Boulder
// @author Matt Pennington (PhET Interactive Simulations)

const fs = require('graceful-fs'); // eslint-disable-line require-statement-match
const winston = require('../../../../../../perennial-alias/node_modules/winston');
module.exports = async function (filepath, contents) {
  return new Promise((resolve, reject) => {
    let tries = 0;
    winston.info(`Writing file to path: ${filepath}`);
    const writeFileInterval = setInterval(() => {
      fs.writeFile(filepath, contents, err => {
        if (err) {
          tries += 1;
          if (err.code === 'ENOENT') {
            winston.error('Write operation failed. The target directory did not exist.');
            reject(err);
          } else if (tries >= 10) {
            winston.error(`Write operation failed ${tries} time(s). I'm giving up, all hope is lost.`);
            clearInterval(writeFileInterval);
            reject(err);
          } else {
            winston.error(`Write failed with error: ${JSON.stringify(err)}, trying again`);
          }
        } else {
          winston.debug('Write success.');
          clearInterval(writeFileInterval);
          resolve();
        }
      });
    }, 1000);
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJ3aW5zdG9uIiwibW9kdWxlIiwiZXhwb3J0cyIsImZpbGVwYXRoIiwiY29udGVudHMiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInRyaWVzIiwiaW5mbyIsIndyaXRlRmlsZUludGVydmFsIiwic2V0SW50ZXJ2YWwiLCJ3cml0ZUZpbGUiLCJlcnIiLCJjb2RlIiwiZXJyb3IiLCJjbGVhckludGVydmFsIiwiSlNPTiIsInN0cmluZ2lmeSIsImRlYnVnIl0sInNvdXJjZXMiOlsid3JpdGVGaWxlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMTgsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG4vLyBAYXV0aG9yIE1hdHQgUGVubmluZ3RvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuXHJcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2dyYWNlZnVsLWZzJyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHJlcXVpcmUtc3RhdGVtZW50LW1hdGNoXHJcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24oIGZpbGVwYXRoLCBjb250ZW50cyApIHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoICggcmVzb2x2ZSwgcmVqZWN0ICkgPT4ge1xyXG4gICAgbGV0IHRyaWVzID0gMDtcclxuICAgIHdpbnN0b24uaW5mbyggYFdyaXRpbmcgZmlsZSB0byBwYXRoOiAke2ZpbGVwYXRofWAgKTtcclxuICAgIGNvbnN0IHdyaXRlRmlsZUludGVydmFsID0gc2V0SW50ZXJ2YWwoICgpID0+IHtcclxuICAgICAgZnMud3JpdGVGaWxlKCBmaWxlcGF0aCwgY29udGVudHMsIGVyciA9PiB7XHJcbiAgICAgICAgaWYgKCBlcnIgKSB7XHJcbiAgICAgICAgICB0cmllcyArPSAxO1xyXG4gICAgICAgICAgaWYgKCBlcnIuY29kZSA9PT0gJ0VOT0VOVCcgKSB7XHJcbiAgICAgICAgICAgIHdpbnN0b24uZXJyb3IoICdXcml0ZSBvcGVyYXRpb24gZmFpbGVkLiBUaGUgdGFyZ2V0IGRpcmVjdG9yeSBkaWQgbm90IGV4aXN0LicgKTtcclxuICAgICAgICAgICAgcmVqZWN0KCBlcnIgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2UgaWYgKCB0cmllcyA+PSAxMCApIHtcclxuICAgICAgICAgICAgd2luc3Rvbi5lcnJvciggYFdyaXRlIG9wZXJhdGlvbiBmYWlsZWQgJHt0cmllc30gdGltZShzKS4gSSdtIGdpdmluZyB1cCwgYWxsIGhvcGUgaXMgbG9zdC5gICk7XHJcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoIHdyaXRlRmlsZUludGVydmFsICk7XHJcbiAgICAgICAgICAgIHJlamVjdCggZXJyICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgd2luc3Rvbi5lcnJvciggYFdyaXRlIGZhaWxlZCB3aXRoIGVycm9yOiAke0pTT04uc3RyaW5naWZ5KCBlcnIgKX0sIHRyeWluZyBhZ2FpbmAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICB3aW5zdG9uLmRlYnVnKCAnV3JpdGUgc3VjY2Vzcy4nICk7XHJcbiAgICAgICAgICBjbGVhckludGVydmFsKCB3cml0ZUZpbGVJbnRlcnZhbCApO1xyXG4gICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG4gICAgfSwgMTAwMCApO1xyXG4gIH0gKTtcclxufTsiXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7O0FBRUEsTUFBTUEsRUFBRSxHQUFHQyxPQUFPLENBQUUsYUFBYyxDQUFDLENBQUMsQ0FBQztBQUNyQyxNQUFNQyxPQUFPLEdBQUdELE9BQU8sQ0FBRSxTQUFVLENBQUM7QUFFcENFLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLGdCQUFnQkMsUUFBUSxFQUFFQyxRQUFRLEVBQUc7RUFDcEQsT0FBTyxJQUFJQyxPQUFPLENBQUUsQ0FBRUMsT0FBTyxFQUFFQyxNQUFNLEtBQU07SUFDekMsSUFBSUMsS0FBSyxHQUFHLENBQUM7SUFDYlIsT0FBTyxDQUFDUyxJQUFJLENBQUcseUJBQXdCTixRQUFTLEVBQUUsQ0FBQztJQUNuRCxNQUFNTyxpQkFBaUIsR0FBR0MsV0FBVyxDQUFFLE1BQU07TUFDM0NiLEVBQUUsQ0FBQ2MsU0FBUyxDQUFFVCxRQUFRLEVBQUVDLFFBQVEsRUFBRVMsR0FBRyxJQUFJO1FBQ3ZDLElBQUtBLEdBQUcsRUFBRztVQUNUTCxLQUFLLElBQUksQ0FBQztVQUNWLElBQUtLLEdBQUcsQ0FBQ0MsSUFBSSxLQUFLLFFBQVEsRUFBRztZQUMzQmQsT0FBTyxDQUFDZSxLQUFLLENBQUUsNkRBQThELENBQUM7WUFDOUVSLE1BQU0sQ0FBRU0sR0FBSSxDQUFDO1VBQ2YsQ0FBQyxNQUNJLElBQUtMLEtBQUssSUFBSSxFQUFFLEVBQUc7WUFDdEJSLE9BQU8sQ0FBQ2UsS0FBSyxDQUFHLDBCQUF5QlAsS0FBTSw0Q0FBNEMsQ0FBQztZQUM1RlEsYUFBYSxDQUFFTixpQkFBa0IsQ0FBQztZQUNsQ0gsTUFBTSxDQUFFTSxHQUFJLENBQUM7VUFDZixDQUFDLE1BQ0k7WUFDSGIsT0FBTyxDQUFDZSxLQUFLLENBQUcsNEJBQTJCRSxJQUFJLENBQUNDLFNBQVMsQ0FBRUwsR0FBSSxDQUFFLGdCQUFnQixDQUFDO1VBQ3BGO1FBQ0YsQ0FBQyxNQUNJO1VBQ0hiLE9BQU8sQ0FBQ21CLEtBQUssQ0FBRSxnQkFBaUIsQ0FBQztVQUNqQ0gsYUFBYSxDQUFFTixpQkFBa0IsQ0FBQztVQUNsQ0osT0FBTyxDQUFDLENBQUM7UUFDWDtNQUNGLENBQUUsQ0FBQztJQUNMLENBQUMsRUFBRSxJQUFLLENBQUM7RUFDWCxDQUFFLENBQUM7QUFDTCxDQUFDIiwiaWdub3JlTGlzdCI6W119