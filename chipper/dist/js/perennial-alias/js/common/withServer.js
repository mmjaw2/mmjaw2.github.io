// Copyright 2017, University of Colorado Boulder

/**
 * A simple webserver that will serve the git root on a specific port for the duration of an async callback
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

const http = require('http');
const fs = require('fs');
const _ = require('lodash');
const winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * A simple webserver that will serve the git root on a specific port for the duration of an async callback
 * @public
 *
 * @param {async function(port:number):*} asyncCallback
 * @param {Object} [options]
 * @returns {Promise<*>} - Returns the result of the asyncCallback
 */
module.exports = function (asyncCallback, options) {
  options = _.merge({
    path: '../',
    port: 0 // 0 means it will find an open port
  }, options);
  return new Promise((resolve, reject) => {
    // Consider using https://github.com/cloudhead/node-static or reading https://nodejs.org/en/knowledge/HTTP/servers/how-to-serve-static-files/
    const server = http.createServer((req, res) => {
      // Trim query string
      const tail = req.url.indexOf('?') >= 0 ? req.url.substring(0, req.url.indexOf('?')) : req.url;
      const fullPath = `${process.cwd()}/${options.path}${tail}`;

      // See https://gist.github.com/aolde/8104861
      const mimeTypes = {
        html: 'text/html',
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        png: 'image/png',
        js: 'text/javascript',
        mjs: 'text/javascript',
        css: 'text/css',
        gif: 'image/gif',
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        // needed to be added to support PhET sims.
        svg: 'image/svg+xml',
        json: 'application/json',
        ico: 'image/x-icon'
      };
      const fileExtension = fullPath.split('.').pop();
      let mimeType = mimeTypes[fileExtension];
      if (!mimeType && (fullPath.includes('active-runnables') || fullPath.includes('active-repos'))) {
        mimeType = 'text/plain';
      }
      if (!mimeType) {
        throw new Error(`unsupported mime type, please add above: ${fileExtension}`);
      }
      fs.readFile(fullPath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end(JSON.stringify(err));
        } else {
          res.writeHead(200, {
            'Content-Type': mimeType
          });
          res.end(data);
        }
      });
    });
    server.on('listening', async () => {
      const port = server.address().port;
      winston.debug('info', `Server listening on port ${port}`);
      let result;
      try {
        result = await asyncCallback(port);
      } catch (e) {
        reject(e);
      }
      server.close(() => {
        winston.debug('info', `Express stopped listening on port ${port}`);
        resolve(result);
      });
    });
    server.listen(options.port);
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJodHRwIiwicmVxdWlyZSIsImZzIiwiXyIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwiYXN5bmNDYWxsYmFjayIsIm9wdGlvbnMiLCJtZXJnZSIsInBhdGgiLCJwb3J0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJzZXJ2ZXIiLCJjcmVhdGVTZXJ2ZXIiLCJyZXEiLCJyZXMiLCJ0YWlsIiwidXJsIiwiaW5kZXhPZiIsInN1YnN0cmluZyIsImZ1bGxQYXRoIiwicHJvY2VzcyIsImN3ZCIsIm1pbWVUeXBlcyIsImh0bWwiLCJqcGVnIiwianBnIiwicG5nIiwianMiLCJtanMiLCJjc3MiLCJnaWYiLCJtcDMiLCJ3YXYiLCJzdmciLCJqc29uIiwiaWNvIiwiZmlsZUV4dGVuc2lvbiIsInNwbGl0IiwicG9wIiwibWltZVR5cGUiLCJpbmNsdWRlcyIsIkVycm9yIiwicmVhZEZpbGUiLCJlcnIiLCJkYXRhIiwid3JpdGVIZWFkIiwiZW5kIiwiSlNPTiIsInN0cmluZ2lmeSIsIm9uIiwiYWRkcmVzcyIsImRlYnVnIiwicmVzdWx0IiwiZSIsImNsb3NlIiwibGlzdGVuIl0sInNvdXJjZXMiOlsid2l0aFNlcnZlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBzaW1wbGUgd2Vic2VydmVyIHRoYXQgd2lsbCBzZXJ2ZSB0aGUgZ2l0IHJvb3Qgb24gYSBzcGVjaWZpYyBwb3J0IGZvciB0aGUgZHVyYXRpb24gb2YgYW4gYXN5bmMgY2FsbGJhY2tcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKiBAYXV0aG9yIE1pY2hhZWwgS2F1em1hbm4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuY29uc3QgaHR0cCA9IHJlcXVpcmUoICdodHRwJyApO1xyXG5jb25zdCBmcyA9IHJlcXVpcmUoICdmcycgKTtcclxuY29uc3QgXyA9IHJlcXVpcmUoICdsb2Rhc2gnICk7XHJcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuXHJcbi8qKlxyXG4gKiBBIHNpbXBsZSB3ZWJzZXJ2ZXIgdGhhdCB3aWxsIHNlcnZlIHRoZSBnaXQgcm9vdCBvbiBhIHNwZWNpZmljIHBvcnQgZm9yIHRoZSBkdXJhdGlvbiBvZiBhbiBhc3luYyBjYWxsYmFja1xyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIEBwYXJhbSB7YXN5bmMgZnVuY3Rpb24ocG9ydDpudW1iZXIpOip9IGFzeW5jQ2FsbGJhY2tcclxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZTwqPn0gLSBSZXR1cm5zIHRoZSByZXN1bHQgb2YgdGhlIGFzeW5jQ2FsbGJhY2tcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIGFzeW5jQ2FsbGJhY2ssIG9wdGlvbnMgKSB7XHJcblxyXG4gIG9wdGlvbnMgPSBfLm1lcmdlKCB7XHJcbiAgICBwYXRoOiAnLi4vJyxcclxuICAgIHBvcnQ6IDAgLy8gMCBtZWFucyBpdCB3aWxsIGZpbmQgYW4gb3BlbiBwb3J0XHJcbiAgfSwgb3B0aW9ucyApO1xyXG5cclxuICByZXR1cm4gbmV3IFByb21pc2UoICggcmVzb2x2ZSwgcmVqZWN0ICkgPT4ge1xyXG5cclxuXHJcbiAgICAvLyBDb25zaWRlciB1c2luZyBodHRwczovL2dpdGh1Yi5jb20vY2xvdWRoZWFkL25vZGUtc3RhdGljIG9yIHJlYWRpbmcgaHR0cHM6Ly9ub2RlanMub3JnL2VuL2tub3dsZWRnZS9IVFRQL3NlcnZlcnMvaG93LXRvLXNlcnZlLXN0YXRpYy1maWxlcy9cclxuICAgIGNvbnN0IHNlcnZlciA9IGh0dHAuY3JlYXRlU2VydmVyKCAoIHJlcSwgcmVzICkgPT4ge1xyXG5cclxuICAgICAgLy8gVHJpbSBxdWVyeSBzdHJpbmdcclxuICAgICAgY29uc3QgdGFpbCA9IHJlcS51cmwuaW5kZXhPZiggJz8nICkgPj0gMCA/IHJlcS51cmwuc3Vic3RyaW5nKCAwLCByZXEudXJsLmluZGV4T2YoICc/JyApICkgOiByZXEudXJsO1xyXG4gICAgICBjb25zdCBmdWxsUGF0aCA9IGAke3Byb2Nlc3MuY3dkKCl9LyR7b3B0aW9ucy5wYXRofSR7dGFpbH1gO1xyXG5cclxuICAgICAgLy8gU2VlIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL2FvbGRlLzgxMDQ4NjFcclxuICAgICAgY29uc3QgbWltZVR5cGVzID0ge1xyXG4gICAgICAgIGh0bWw6ICd0ZXh0L2h0bWwnLFxyXG4gICAgICAgIGpwZWc6ICdpbWFnZS9qcGVnJyxcclxuICAgICAgICBqcGc6ICdpbWFnZS9qcGVnJyxcclxuICAgICAgICBwbmc6ICdpbWFnZS9wbmcnLFxyXG4gICAgICAgIGpzOiAndGV4dC9qYXZhc2NyaXB0JyxcclxuICAgICAgICBtanM6ICd0ZXh0L2phdmFzY3JpcHQnLFxyXG4gICAgICAgIGNzczogJ3RleHQvY3NzJyxcclxuICAgICAgICBnaWY6ICdpbWFnZS9naWYnLFxyXG4gICAgICAgIG1wMzogJ2F1ZGlvL21wZWcnLFxyXG4gICAgICAgIHdhdjogJ2F1ZGlvL3dhdicsXHJcblxyXG4gICAgICAgIC8vIG5lZWRlZCB0byBiZSBhZGRlZCB0byBzdXBwb3J0IFBoRVQgc2ltcy5cclxuICAgICAgICBzdmc6ICdpbWFnZS9zdmcreG1sJyxcclxuICAgICAgICBqc29uOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgaWNvOiAnaW1hZ2UveC1pY29uJ1xyXG4gICAgICB9O1xyXG4gICAgICBjb25zdCBmaWxlRXh0ZW5zaW9uID0gZnVsbFBhdGguc3BsaXQoICcuJyApLnBvcCgpO1xyXG4gICAgICBsZXQgbWltZVR5cGUgPSBtaW1lVHlwZXNbIGZpbGVFeHRlbnNpb24gXTtcclxuXHJcbiAgICAgIGlmICggIW1pbWVUeXBlICYmICggZnVsbFBhdGguaW5jbHVkZXMoICdhY3RpdmUtcnVubmFibGVzJyApIHx8IGZ1bGxQYXRoLmluY2x1ZGVzKCAnYWN0aXZlLXJlcG9zJyApICkgKSB7XHJcbiAgICAgICAgbWltZVR5cGUgPSAndGV4dC9wbGFpbic7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggIW1pbWVUeXBlICkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvciggYHVuc3VwcG9ydGVkIG1pbWUgdHlwZSwgcGxlYXNlIGFkZCBhYm92ZTogJHtmaWxlRXh0ZW5zaW9ufWAgKTtcclxuICAgICAgfVxyXG4gICAgICBmcy5yZWFkRmlsZSggZnVsbFBhdGgsICggZXJyLCBkYXRhICkgPT4ge1xyXG4gICAgICAgIGlmICggZXJyICkge1xyXG4gICAgICAgICAgcmVzLndyaXRlSGVhZCggNDA0ICk7XHJcbiAgICAgICAgICByZXMuZW5kKCBKU09OLnN0cmluZ2lmeSggZXJyICkgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICByZXMud3JpdGVIZWFkKCAyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6IG1pbWVUeXBlIH0gKTtcclxuICAgICAgICAgIHJlcy5lbmQoIGRhdGEgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuICAgIH0gKTtcclxuICAgIHNlcnZlci5vbiggJ2xpc3RlbmluZycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcG9ydCA9IHNlcnZlci5hZGRyZXNzKCkucG9ydDtcclxuICAgICAgd2luc3Rvbi5kZWJ1ZyggJ2luZm8nLCBgU2VydmVyIGxpc3RlbmluZyBvbiBwb3J0ICR7cG9ydH1gICk7XHJcblxyXG4gICAgICBsZXQgcmVzdWx0O1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICByZXN1bHQgPSBhd2FpdCBhc3luY0NhbGxiYWNrKCBwb3J0ICk7XHJcbiAgICAgIH1cclxuICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgcmVqZWN0KCBlICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHNlcnZlci5jbG9zZSggKCkgPT4ge1xyXG4gICAgICAgIHdpbnN0b24uZGVidWcoICdpbmZvJywgYEV4cHJlc3Mgc3RvcHBlZCBsaXN0ZW5pbmcgb24gcG9ydCAke3BvcnR9YCApO1xyXG5cclxuICAgICAgICByZXNvbHZlKCByZXN1bHQgKTtcclxuICAgICAgfSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIHNlcnZlci5saXN0ZW4oIG9wdGlvbnMucG9ydCApO1xyXG4gIH0gKTtcclxufTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxNQUFNQSxJQUFJLEdBQUdDLE9BQU8sQ0FBRSxNQUFPLENBQUM7QUFDOUIsTUFBTUMsRUFBRSxHQUFHRCxPQUFPLENBQUUsSUFBSyxDQUFDO0FBQzFCLE1BQU1FLENBQUMsR0FBR0YsT0FBTyxDQUFFLFFBQVMsQ0FBQztBQUM3QixNQUFNRyxPQUFPLEdBQUdILE9BQU8sQ0FBRSxTQUFVLENBQUM7O0FBRXBDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQUksTUFBTSxDQUFDQyxPQUFPLEdBQUcsVUFBVUMsYUFBYSxFQUFFQyxPQUFPLEVBQUc7RUFFbERBLE9BQU8sR0FBR0wsQ0FBQyxDQUFDTSxLQUFLLENBQUU7SUFDakJDLElBQUksRUFBRSxLQUFLO0lBQ1hDLElBQUksRUFBRSxDQUFDLENBQUM7RUFDVixDQUFDLEVBQUVILE9BQVEsQ0FBQztFQUVaLE9BQU8sSUFBSUksT0FBTyxDQUFFLENBQUVDLE9BQU8sRUFBRUMsTUFBTSxLQUFNO0lBR3pDO0lBQ0EsTUFBTUMsTUFBTSxHQUFHZixJQUFJLENBQUNnQixZQUFZLENBQUUsQ0FBRUMsR0FBRyxFQUFFQyxHQUFHLEtBQU07TUFFaEQ7TUFDQSxNQUFNQyxJQUFJLEdBQUdGLEdBQUcsQ0FBQ0csR0FBRyxDQUFDQyxPQUFPLENBQUUsR0FBSSxDQUFDLElBQUksQ0FBQyxHQUFHSixHQUFHLENBQUNHLEdB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