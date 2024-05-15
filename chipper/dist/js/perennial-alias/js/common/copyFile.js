// Copyright 2017, University of Colorado Boulder

/**
 * Copies a single file.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const fs = require('fs');
const winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Copies a single file.
 * @public
 *
 * @param {string} sourceFilename
 * @param {string} destinationFilename
 * @returns {Promise} - Resolves with no value
 */
module.exports = function (sourceFilename, destinationFilename) {
  return new Promise((resolve, reject) => {
    winston.info(`Copying ${sourceFilename} to ${destinationFilename}`);
    const readStream = fs.createReadStream(sourceFilename);
    const writeStream = fs.createWriteStream(destinationFilename);
    readStream.pipe(writeStream);
    readStream.on('end', () => resolve());
    readStream.on('error', err => reject(new Error(err)));
    writeStream.on('error', err => reject(new Error(err)));
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJ3aW5zdG9uIiwibW9kdWxlIiwiZXhwb3J0cyIsInNvdXJjZUZpbGVuYW1lIiwiZGVzdGluYXRpb25GaWxlbmFtZSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiaW5mbyIsInJlYWRTdHJlYW0iLCJjcmVhdGVSZWFkU3RyZWFtIiwid3JpdGVTdHJlYW0iLCJjcmVhdGVXcml0ZVN0cmVhbSIsInBpcGUiLCJvbiIsImVyciIsIkVycm9yIl0sInNvdXJjZXMiOlsiY29weUZpbGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTcsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIENvcGllcyBhIHNpbmdsZSBmaWxlLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuXHJcbi8qKlxyXG4gKiBDb3BpZXMgYSBzaW5nbGUgZmlsZS5cclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc291cmNlRmlsZW5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGRlc3RpbmF0aW9uRmlsZW5hbWVcclxuICogQHJldHVybnMge1Byb21pc2V9IC0gUmVzb2x2ZXMgd2l0aCBubyB2YWx1ZVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggc291cmNlRmlsZW5hbWUsIGRlc3RpbmF0aW9uRmlsZW5hbWUgKSB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKCAoIHJlc29sdmUsIHJlamVjdCApID0+IHtcclxuICAgIHdpbnN0b24uaW5mbyggYENvcHlpbmcgJHtzb3VyY2VGaWxlbmFtZX0gdG8gJHtkZXN0aW5hdGlvbkZpbGVuYW1lfWAgKTtcclxuXHJcbiAgICBjb25zdCByZWFkU3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbSggc291cmNlRmlsZW5hbWUgKTtcclxuICAgIGNvbnN0IHdyaXRlU3RyZWFtID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0oIGRlc3RpbmF0aW9uRmlsZW5hbWUgKTtcclxuICAgIHJlYWRTdHJlYW0ucGlwZSggd3JpdGVTdHJlYW0gKTtcclxuICAgIHJlYWRTdHJlYW0ub24oICdlbmQnLCAoKSA9PiByZXNvbHZlKCkgKTtcclxuICAgIHJlYWRTdHJlYW0ub24oICdlcnJvcicsIGVyciA9PiByZWplY3QoIG5ldyBFcnJvciggZXJyICkgKSApO1xyXG4gICAgd3JpdGVTdHJlYW0ub24oICdlcnJvcicsIGVyciA9PiByZWplY3QoIG5ldyBFcnJvciggZXJyICkgKSApO1xyXG4gIH0gKTtcclxufTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTUEsRUFBRSxHQUFHQyxPQUFPLENBQUUsSUFBSyxDQUFDO0FBQzFCLE1BQU1DLE9BQU8sR0FBR0QsT0FBTyxDQUFFLFNBQVUsQ0FBQzs7QUFFcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBRSxNQUFNLENBQUNDLE9BQU8sR0FBRyxVQUFVQyxjQUFjLEVBQUVDLG1CQUFtQixFQUFHO0VBQy9ELE9BQU8sSUFBSUMsT0FBTyxDQUFFLENBQUVDLE9BQU8sRUFBRUMsTUFBTSxLQUFNO0lBQ3pDUCxPQUFPLENBQUNRLElBQUksQ0FBRyxXQUFVTCxjQUFlLE9BQU1DLG1CQUFvQixFQUFFLENBQUM7SUFFckUsTUFBTUssVUFBVSxHQUFHWCxFQUFFLENBQUNZLGdCQUFnQixDQUFFUCxjQUFlLENBQUM7SUFDeEQsTUFBTVEsV0FBVyxHQUFHYixFQUFFLENBQUNjLGlCQUFpQixDQUFFUixtQkFBb0IsQ0FBQztJQUMvREssVUFBVSxDQUFDSSxJQUFJLENBQUVGLFdBQVksQ0FBQztJQUM5QkYsVUFBVSxDQUFDSyxFQUFFLENBQUUsS0FBSyxFQUFFLE1BQU1SLE9BQU8sQ0FBQyxDQUFFLENBQUM7SUFDdkNHLFVBQVUsQ0FBQ0ssRUFBRSxDQUFFLE9BQU8sRUFBRUMsR0FBRyxJQUFJUixNQUFNLENBQUUsSUFBSVMsS0FBSyxDQUFFRCxHQUFJLENBQUUsQ0FBRSxDQUFDO0lBQzNESixXQUFXLENBQUNHLEVBQUUsQ0FBRSxPQUFPLEVBQUVDLEdBQUcsSUFBSVIsTUFBTSxDQUFFLElBQUlTLEtBQUssQ0FBRUQsR0FBSSxDQUFFLENBQUUsQ0FBQztFQUM5RCxDQUFFLENBQUM7QUFDTCxDQUFDIiwiaWdub3JlTGlzdCI6W119