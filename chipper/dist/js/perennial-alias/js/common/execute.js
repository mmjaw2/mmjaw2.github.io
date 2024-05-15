// Copyright 2017, University of Colorado Boulder

/**
 * Command execution wrapper (with common settings)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const child_process = require('child_process');
const winston = require('../../../../../../perennial-alias/node_modules/winston');
const _ = require('lodash');
const assert = require('assert');
const grunt = require('grunt');

/**
 * Executes a command, with specific arguments and in a specific directory (cwd).
 * @public
 *
 * Resolves with the stdout: {string}
 * Rejects with { code: {number}, stdout: {string} } -- Happens if the exit code is non-zero.
 *
 * @param {string} cmd - The process to execute. Should be on the current path.
 * @param {Array.<string>} args - Array of arguments. No need to extra-quote things.
 * @param {string} cwd - The working directory where the process should be run from
 * @param {Object} [options]
 * @returns {Promise.<string>} - Stdout
 * @rejects {ExecuteError}
 */
module.exports = function (cmd, args, cwd, options) {
  const startTime = Date.now();
  options = _.merge({
    // {'reject'|'resolve'} - whether errors should be rejected or resolved.  If errors are resolved, then an object
    //                      - of the form {code:number,stdout:string,stderr:string} is returned. 'resolve' allows usage
    //                      - in Promise.all without exiting on the 1st failure
    errors: 'reject',
    // Provide additional env variables, and they will be merged with the existing defaults.
    childProcessEnv: {
      ...process.env
    }
  }, options);
  assert(options.errors === 'reject' || options.errors === 'resolve', 'Errors must reject or resolve');
  return new Promise((resolve, reject) => {
    let rejectedByError = false;
    let stdout = ''; // to be appended to
    let stderr = '';
    const childProcess = child_process.spawn(cmd, args, {
      cwd: cwd,
      env: options.childProcessEnv
    });
    childProcess.on('error', error => {
      rejectedByError = true;
      if (options.errors === 'resolve') {
        resolve({
          code: 1,
          stdout: stdout,
          stderr: stderr,
          cwd: cwd,
          error: error,
          time: Date.now() - startTime
        });
      } else {
        reject(new ExecuteError(cmd, args, cwd, stdout, stderr, -1, Date.now() - startTime));
      }
    });
    winston.debug(`Running ${cmd} ${args.join(' ')} from ${cwd}`);
    childProcess.stderr.on('data', data => {
      stderr += data;
      grunt.log.debug(`stderr: ${data}`);
      winston.debug(`stderr: ${data}`);
    });
    childProcess.stdout.on('data', data => {
      stdout += data;
      grunt.log.debug(`stdout: ${data}`);
      winston.debug(`stdout: ${data}`);
    });
    childProcess.on('close', code => {
      winston.debug(`Command ${cmd} finished. Output is below.`);
      winston.debug(stderr && `stderr: ${stderr}` || 'stderr is empty.');
      winston.debug(stdout && `stdout: ${stdout}` || 'stdout is empty.');
      if (!rejectedByError) {
        if (options.errors === 'resolve') {
          resolve({
            code: code,
            stdout: stdout,
            stderr: stderr,
            cwd: cwd,
            time: Date.now() - startTime
          });
        } else {
          if (code !== 0) {
            reject(new ExecuteError(cmd, args, cwd, stdout, stderr, code, Date.now() - startTime));
          } else {
            resolve(stdout);
          }
        }
      }
    });
  });
};
class ExecuteError extends Error {
  /**
   * @param {string} cmd
   * @param {Array.<string>} args
   * @param {string} cwd
   * @param {string} stdout
   * @param {string} stderr
   * @param {number} code - exit code
   * @param {number} time - ms
   */
  constructor(cmd, args, cwd, stdout, stderr, code, time) {
    super(`${cmd} ${args.join(' ')} in ${cwd} failed with exit code ${code}${stdout ? `\nstdout:\n${stdout}` : ''}${stderr ? `\nstderr:\n${stderr}` : ''}`);

    // @public
    this.cmd = cmd;
    this.args = args;
    this.cwd = cwd;
    this.stdout = stdout;
    this.stderr = stderr;
    this.code = code;
    this.time = time;
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjaGlsZF9wcm9jZXNzIiwicmVxdWlyZSIsIndpbnN0b24iLCJfIiwiYXNzZXJ0IiwiZ3J1bnQiLCJtb2R1bGUiLCJleHBvcnRzIiwiY21kIiwiYXJncyIsImN3ZCIsIm9wdGlvbnMiLCJzdGFydFRpbWUiLCJEYXRlIiwibm93IiwibWVyZ2UiLCJlcnJvcnMiLCJjaGlsZFByb2Nlc3NFbnYiLCJwcm9jZXNzIiwiZW52IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJyZWplY3RlZEJ5RXJyb3IiLCJzdGRvdXQiLCJzdGRlcnIiLCJjaGlsZFByb2Nlc3MiLCJzcGF3biIsIm9uIiwiZXJyb3IiLCJjb2RlIiwidGltZSIsIkV4ZWN1dGVFcnJvciIsImRlYnVnIiwiam9pbiIsImRhdGEiLCJsb2ciLCJFcnJvciIsImNvbnN0cnVjdG9yIl0sInNvdXJjZXMiOlsiZXhlY3V0ZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQ29tbWFuZCBleGVjdXRpb24gd3JhcHBlciAod2l0aCBjb21tb24gc2V0dGluZ3MpXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5jb25zdCBjaGlsZF9wcm9jZXNzID0gcmVxdWlyZSggJ2NoaWxkX3Byb2Nlc3MnICk7XHJcbmNvbnN0IHdpbnN0b24gPSByZXF1aXJlKCAnd2luc3RvbicgKTtcclxuY29uc3QgXyA9IHJlcXVpcmUoICdsb2Rhc2gnICk7XHJcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoICdhc3NlcnQnICk7XHJcbmNvbnN0IGdydW50ID0gcmVxdWlyZSggJ2dydW50JyApO1xyXG5cclxuLyoqXHJcbiAqIEV4ZWN1dGVzIGEgY29tbWFuZCwgd2l0aCBzcGVjaWZpYyBhcmd1bWVudHMgYW5kIGluIGEgc3BlY2lmaWMgZGlyZWN0b3J5IChjd2QpLlxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIFJlc29sdmVzIHdpdGggdGhlIHN0ZG91dDoge3N0cmluZ31cclxuICogUmVqZWN0cyB3aXRoIHsgY29kZToge251bWJlcn0sIHN0ZG91dDoge3N0cmluZ30gfSAtLSBIYXBwZW5zIGlmIHRoZSBleGl0IGNvZGUgaXMgbm9uLXplcm8uXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBjbWQgLSBUaGUgcHJvY2VzcyB0byBleGVjdXRlLiBTaG91bGQgYmUgb24gdGhlIGN1cnJlbnQgcGF0aC5cclxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gYXJncyAtIEFycmF5IG9mIGFyZ3VtZW50cy4gTm8gbmVlZCB0byBleHRyYS1xdW90ZSB0aGluZ3MuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBjd2QgLSBUaGUgd29ya2luZyBkaXJlY3Rvcnkgd2hlcmUgdGhlIHByb2Nlc3Mgc2hvdWxkIGJlIHJ1biBmcm9tXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cclxuICogQHJldHVybnMge1Byb21pc2UuPHN0cmluZz59IC0gU3Rkb3V0XHJcbiAqIEByZWplY3RzIHtFeGVjdXRlRXJyb3J9XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBjbWQsIGFyZ3MsIGN3ZCwgb3B0aW9ucyApIHtcclxuXHJcbiAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcclxuXHJcbiAgb3B0aW9ucyA9IF8ubWVyZ2UoIHtcclxuXHJcbiAgICAvLyB7J3JlamVjdCd8J3Jlc29sdmUnfSAtIHdoZXRoZXIgZXJyb3JzIHNob3VsZCBiZSByZWplY3RlZCBvciByZXNvbHZlZC4gIElmIGVycm9ycyBhcmUgcmVzb2x2ZWQsIHRoZW4gYW4gb2JqZWN0XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAtIG9mIHRoZSBmb3JtIHtjb2RlOm51bWJlcixzdGRvdXQ6c3RyaW5nLHN0ZGVycjpzdHJpbmd9IGlzIHJldHVybmVkLiAncmVzb2x2ZScgYWxsb3dzIHVzYWdlXHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAtIGluIFByb21pc2UuYWxsIHdpdGhvdXQgZXhpdGluZyBvbiB0aGUgMXN0IGZhaWx1cmVcclxuICAgIGVycm9yczogJ3JlamVjdCcsXHJcblxyXG4gICAgLy8gUHJvdmlkZSBhZGRpdGlvbmFsIGVudiB2YXJpYWJsZXMsIGFuZCB0aGV5IHdpbGwgYmUgbWVyZ2VkIHdpdGggdGhlIGV4aXN0aW5nIGRlZmF1bHRzLlxyXG4gICAgY2hpbGRQcm9jZXNzRW52OiB7IC4uLnByb2Nlc3MuZW52IH1cclxuICB9LCBvcHRpb25zICk7XHJcbiAgYXNzZXJ0KCBvcHRpb25zLmVycm9ycyA9PT0gJ3JlamVjdCcgfHwgb3B0aW9ucy5lcnJvcnMgPT09ICdyZXNvbHZlJywgJ0Vycm9ycyBtdXN0IHJlamVjdCBvciByZXNvbHZlJyApO1xyXG5cclxuICByZXR1cm4gbmV3IFByb21pc2UoICggcmVzb2x2ZSwgcmVqZWN0ICkgPT4ge1xyXG5cclxuICAgIGxldCByZWplY3RlZEJ5RXJyb3IgPSBmYWxzZTtcclxuXHJcbiAgICBsZXQgc3Rkb3V0ID0gJyc7IC8vIHRvIGJlIGFwcGVuZGVkIHRvXHJcbiAgICBsZXQgc3RkZXJyID0gJyc7XHJcblxyXG4gICAgY29uc3QgY2hpbGRQcm9jZXNzID0gY2hpbGRfcHJvY2Vzcy5zcGF3biggY21kLCBhcmdzLCB7XHJcbiAgICAgIGN3ZDogY3dkLFxyXG4gICAgICBlbnY6IG9wdGlvbnMuY2hpbGRQcm9jZXNzRW52XHJcbiAgICB9ICk7XHJcblxyXG4gICAgY2hpbGRQcm9jZXNzLm9uKCAnZXJyb3InLCBlcnJvciA9PiB7XHJcbiAgICAgIHJlamVjdGVkQnlFcnJvciA9IHRydWU7XHJcblxyXG4gICAgICBpZiAoIG9wdGlvbnMuZXJyb3JzID09PSAncmVzb2x2ZScgKSB7XHJcbiAgICAgICAgcmVzb2x2ZSggeyBjb2RlOiAxLCBzdGRvdXQ6IHN0ZG91dCwgc3RkZXJyOiBzdGRlcnIsIGN3ZDogY3dkLCBlcnJvcjogZXJyb3IsIHRpbWU6IERhdGUubm93KCkgLSBzdGFydFRpbWUgfSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICByZWplY3QoIG5ldyBFeGVjdXRlRXJyb3IoIGNtZCwgYXJncywgY3dkLCBzdGRvdXQsIHN0ZGVyciwgLTEsIERhdGUubm93KCkgLSBzdGFydFRpbWUgKSApO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgICB3aW5zdG9uLmRlYnVnKCBgUnVubmluZyAke2NtZH0gJHthcmdzLmpvaW4oICcgJyApfSBmcm9tICR7Y3dkfWAgKTtcclxuXHJcbiAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLm9uKCAnZGF0YScsIGRhdGEgPT4ge1xyXG4gICAgICBzdGRlcnIgKz0gZGF0YTtcclxuICAgICAgZ3J1bnQubG9nLmRlYnVnKCBgc3RkZXJyOiAke2RhdGF9YCApO1xyXG4gICAgICB3aW5zdG9uLmRlYnVnKCBgc3RkZXJyOiAke2RhdGF9YCApO1xyXG4gICAgfSApO1xyXG4gICAgY2hpbGRQcm9jZXNzLnN0ZG91dC5vbiggJ2RhdGEnLCBkYXRhID0+IHtcclxuICAgICAgc3Rkb3V0ICs9IGRhdGE7XHJcbiAgICAgIGdydW50LmxvZy5kZWJ1ZyggYHN0ZG91dDogJHtkYXRhfWAgKTtcclxuICAgICAgd2luc3Rvbi5kZWJ1ZyggYHN0ZG91dDogJHtkYXRhfWAgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICBjaGlsZFByb2Nlc3Mub24oICdjbG9zZScsIGNvZGUgPT4ge1xyXG4gICAgICB3aW5zdG9uLmRlYnVnKCBgQ29tbWFuZCAke2NtZH0gZmluaXNoZWQuIE91dHB1dCBpcyBiZWxvdy5gICk7XHJcblxyXG4gICAgICB3aW5zdG9uLmRlYnVnKCBzdGRlcnIgJiYgYHN0ZGVycjogJHtzdGRlcnJ9YCB8fCAnc3RkZXJyIGlzIGVtcHR5LicgKTtcclxuICAgICAgd2luc3Rvbi5kZWJ1Zyggc3Rkb3V0ICYmIGBzdGRvdXQ6ICR7c3Rkb3V0fWAgfHwgJ3N0ZG91dCBpcyBlbXB0eS4nICk7XHJcblxyXG4gICAgICBpZiAoICFyZWplY3RlZEJ5RXJyb3IgKSB7XHJcbiAgICAgICAgaWYgKCBvcHRpb25zLmVycm9ycyA9PT0gJ3Jlc29sdmUnICkge1xyXG4gICAgICAgICAgcmVzb2x2ZSggeyBjb2RlOiBjb2RlLCBzdGRvdXQ6IHN0ZG91dCwgc3RkZXJyOiBzdGRlcnIsIGN3ZDogY3dkLCB0aW1lOiBEYXRlLm5vdygpIC0gc3RhcnRUaW1lIH0gKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBpZiAoIGNvZGUgIT09IDAgKSB7XHJcbiAgICAgICAgICAgIHJlamVjdCggbmV3IEV4ZWN1dGVFcnJvciggY21kLCBhcmdzLCBjd2QsIHN0ZG91dCwgc3RkZXJyLCBjb2RlLCBEYXRlLm5vdygpIC0gc3RhcnRUaW1lICkgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICByZXNvbHZlKCBzdGRvdXQgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICB9ICk7XHJcbn07XHJcblxyXG5jbGFzcyBFeGVjdXRlRXJyb3IgZXh0ZW5kcyBFcnJvciB7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjbWRcclxuICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBhcmdzXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGN3ZFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdGRvdXRcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RkZXJyXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNvZGUgLSBleGl0IGNvZGVcclxuICAgKiBAcGFyYW0ge251bWJlcn0gdGltZSAtIG1zXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoIGNtZCwgYXJncywgY3dkLCBzdGRvdXQsIHN0ZGVyciwgY29kZSwgdGltZSApIHtcclxuICAgIHN1cGVyKCBgJHtjbWR9ICR7YXJncy5qb2luKCAnICcgKX0gaW4gJHtjd2R9IGZhaWxlZCB3aXRoIGV4aXQgY29kZSAke2NvZGV9JHtzdGRvdXQgPyBgXFxuc3Rkb3V0OlxcbiR7c3Rkb3V0fWAgOiAnJ30ke3N0ZGVyciA/IGBcXG5zdGRlcnI6XFxuJHtzdGRlcnJ9YCA6ICcnfWAgKTtcclxuXHJcbiAgICAvLyBAcHVibGljXHJcbiAgICB0aGlzLmNtZCA9IGNtZDtcclxuICAgIHRoaXMuYXJncyA9IGFyZ3M7XHJcbiAgICB0aGlzLmN3ZCA9IGN3ZDtcclxuICAgIHRoaXMuc3Rkb3V0ID0gc3Rkb3V0O1xyXG4gICAgdGhpcy5zdGRlcnIgPSBzdGRlcnI7XHJcbiAgICB0aGlzLmNvZGUgPSBjb2RlO1xyXG4gICAgdGhpcy50aW1lID0gdGltZTtcclxuICB9XHJcbn0iXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTUEsYUFBYSxHQUFHQyxPQUFPLENBQUUsZUFBZ0IsQ0FBQztBQUNoRCxNQUFNQyxPQUFPLEdBQUdELE9BQU8sQ0FBRSxTQUFVLENBQUM7QUFDcEMsTUFBTUUsQ0FBQyxHQUFHRixPQUFPLENBQUUsUUFBUyxDQUFDO0FBQzdCLE1BQU1HLE1BQU0sR0FBR0gsT0FBTyxDQUFFLFFBQVMsQ0FBQztBQUNsQyxNQUFNSSxLQUFLLEdBQUdKLE9BQU8sQ0FBRSxPQUFRLENBQUM7O0FBRWhDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQUssTUFBTSxDQUFDQyxPQUFPLEdBQUcsVUFBVUMsR0FBRyxFQUFFQyxJQUFJLEVBQUVDLEdBQUcsRUFBRUMsT0FBTyxFQUFHO0VBRW5ELE1BQU1DLFNBQVMsR0FBR0MsSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBQztFQUU1QkgsT0FBTyxHQUFHUixDQUFDLENBQUNZLEtBQUssQ0FBRTtJQUVqQjtJQUNBO0lBQ0E7SUFDQUMsTUFBTSxFQUFFLFFBQVE7SUFFaEI7SUFDQUMsZUFBZSxFQUFFO01BQUUsR0FBR0MsT0FBTyxDQUFDQztJQUFJO0VBQ3BDLENBQUMsRUFBRVIsT0FBUSxDQUFDO0VBQ1pQLE1BQU0sQ0FBRU8sT0FBTyxDQUFDSyxNQUFNLEtBQUssUUFBUSxJQUFJTCxPQUFPLENBQUNLLE1BQU0sS0FBSyxTQUFTLEVBQUUsK0JBQWdDLENBQUM7RUFFdEcsT0FBTyxJQUFJSSxPQUFPLENBQUUsQ0FBRUMsT0FBTyxFQUFFQyxNQUFNLEtBQU07SUFFekMsSUFBSUMsZUFBZSxHQUFHLEtBQUs7SUFFM0IsSUFBSUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQ2pCLElBQUlDLE1BQU0sR0FBRyxFQUFFO0lBRWYsTUFBTUMsWUFBWSxHQUFHMUIsYUFBYSxDQUFDMkIsS0FBSyxDQUFFbkIsR0FBRyxFQUFFQyxJQUFJLEVBQUU7TUFDbkRDLEdBQUcsRUFBRUEsR0FBRztNQUNSUyxHQUFHLEVBQUVSLE9BQU8sQ0FBQ007SUFDZixDQUFFLENBQUM7SUFFSFMsWUFBWSxDQUFDRSxFQUFFLENBQUUsT0FBTyxFQUFFQyxLQUFLLElBQUk7TUFDakNOLGVBQWUsR0FBRyxJQUFJO01BRXRCLElBQUtaLE9BQU8sQ0FBQ0ssTUFBTSxLQUFLLFNBQVMsRUFBRztRQUNsQ0ssT0FBTyxDQUFFO1VBQUVTLElBQUksRUFBRSxDQUFDO1VBQUVOLE1BQU0sRUFBRUEsTUFBTTtVQUFFQyxNQUFNLEVBQUVBLE1BQU07VUFBRWYsR0FBRyxFQUFFQSxHQUFHO1VBQUVtQixLQUFLLEVBQUVBLEtBQUs7VUFBRUUsSUFBSSxFQUFFbEIsSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBQyxHQUFHRjtRQUFVLENBQUUsQ0FBQztNQUM5RyxDQUFDLE1BQ0k7UUFFSFUsTUFBTSxDQUFFLElBQUlVLFlBQVksQ0FBRXhCLEdBQUcsRUFBRUMsSUFBSSxFQUFFQyxHQUFHLEVBQUVjLE1BQU0sRUFBRUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFFWixJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFDLEdBQUdGLFNBQVUsQ0FBRSxDQUFDO01BQzFGO0lBQ0YsQ0FBRSxDQUFDO0lBQ0hWLE9BQU8sQ0FBQytCLEtBQUssQ0FBRyxXQUFVekIsR0FBSSxJQUFHQyxJQUFJLENBQUN5QixJQUFJLENBQUUsR0FBSSxDQUFFLFNBQVF4QixHQUFJLEVBQUUsQ0FBQztJQUVqRWdCLFlBQVksQ0FBQ0QsTUFBTSxDQUFDRyxFQUFFLENBQUUsTUFBTSxFQUFFTyxJQUFJLElBQUk7TUFDdENWLE1BQU0sSUFBSVUsSUFBSTtNQUNkOUIsS0FBSyxDQUFDK0IsR0FBRyxDQUFDSCxLQUFLLENBQUcsV0FBVUUsSUFBSyxFQUFFLENBQUM7TUFDcENqQyxPQUFPLENBQUMrQixLQUFLLENBQUcsV0FBVUUsSUFBSyxFQUFFLENBQUM7SUFDcEMsQ0FBRSxDQUFDO0lBQ0hULFlBQVksQ0FBQ0YsTUFBTSxDQUFDSSxFQUFFLENBQUUsTUFBTSxFQUFFTyxJQUFJLElBQUk7TUFDdENYLE1BQU0sSUFBSVcsSUFBSTtNQUNkOUIsS0FBSyxDQUFDK0IsR0FBRyxDQUFDSCxLQUFLLENBQUcsV0FBVUUsSUFBSyxFQUFFLENBQUM7TUFDcENqQyxPQUFPLENBQUMrQixLQUFLLENBQUcsV0FBVUUsSUFBSyxFQUFFLENBQUM7SUFDcEMsQ0FBRSxDQUFDO0lBRUhULFlBQVksQ0FBQ0UsRUFBRSxDQUFFLE9BQU8sRUFBRUUsSUFBSSxJQUFJO01BQ2hDNUIsT0FBTyxDQUFDK0IsS0FBSyxDQUFHLFdBQVV6QixHQUFJLDZCQUE2QixDQUFDO01BRTVETixPQUFPLENBQUMrQixLQUFLLENBQUVSLE1BQU0sSUFBSyxXQUFVQSxNQUFPLEVBQUMsSUFBSSxrQkFBbUIsQ0FBQztNQUNwRXZCLE9BQU8sQ0FBQytCLEtBQUssQ0FBRVQsTUFBTSxJQUFLLFdBQVVBLE1BQU8sRUFBQyxJQUFJLGtCQUFtQixDQUFDO01BRXBFLElBQUssQ0FBQ0QsZUFBZSxFQUFHO1FBQ3RCLElBQUtaLE9BQU8sQ0FBQ0ssTUFBTSxLQUFLLFNBQVMsRUFBRztVQUNsQ0ssT0FBTyxDQUFFO1lBQUVTLElBQUksRUFBRUEsSUFBSTtZQUFFTixNQUFNLEVBQUVBLE1BQU07WUFBRUMsTUFBTSxFQUFFQSxNQUFNO1lBQUVmLEdBQUcsRUFBRUEsR0FBRztZQUFFcUIsSUFBSSxFQUFFbEIsSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBQyxHQUFHRjtVQUFVLENBQUUsQ0FBQztRQUNuRyxDQUFDLE1BQ0k7VUFDSCxJQUFLa0IsSUFBSSxLQUFLLENBQUMsRUFBRztZQUNoQlIsTUFBTSxDQUFFLElBQUlVLFlBQVksQ0FBRXhCLEdBQUcsRUFBRUMsSUFBSSxFQUFFQyxHQUFHLEVBQUVjLE1BQU0sRUFBRUMsTUFBTSxFQUFFSyxJQUFJLEVBQUVqQixJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFDLEdBQUdGLFNBQVUsQ0FBRSxDQUFDO1VBQzVGLENBQUMsTUFDSTtZQUNIUyxPQUFPLENBQUVHLE1BQU8sQ0FBQztVQUNuQjtRQUNGO01BQ0Y7SUFDRixDQUFFLENBQUM7RUFDTCxDQUFFLENBQUM7QUFDTCxDQUFDO0FBRUQsTUFBTVEsWUFBWSxTQUFTSyxLQUFLLENBQUM7RUFFL0I7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0VDLFdBQVdBLENBQUU5QixHQUFHLEVBQUVDLElBQUksRUFBRUMsR0FBRyxFQUFFYyxNQUFNLEVBQUVDLE1BQU0sRUFBRUssSUFBSSxFQUFFQyxJQUFJLEVBQUc7SUFDeEQsS0FBSyxDQUFHLEdBQUV2QixHQUFJLElBQUdDLElBQUksQ0FBQ3lCLElBQUksQ0FBRSxHQUFJLENBQUUsT0FBTXhCLEdBQUksMEJBQXlCb0IsSUFBSyxHQUFFTixNQUFNLEdBQUksY0FBYUEsTUFBTyxFQUFDLEdBQUcsRUFBRyxHQUFFQyxNQUFNLEdBQUksY0FBYUEsTUFBTyxFQUFDLEdBQUcsRUFBRyxFQUFFLENBQUM7O0lBRTNKO0lBQ0EsSUFBSSxDQUFDakIsR0FBRyxHQUFHQSxHQUFHO0lBQ2QsSUFBSSxDQUFDQyxJQUFJLEdBQUdBLElBQUk7SUFDaEIsSUFBSSxDQUFDQyxHQUFHLEdBQUdBLEdBQUc7SUFDZCxJQUFJLENBQUNjLE1BQU0sR0FBR0EsTUFBTTtJQUNwQixJQUFJLENBQUNDLE1BQU0sR0FBR0EsTUFBTTtJQUNwQixJQUFJLENBQUNLLElBQUksR0FBR0EsSUFBSTtJQUNoQixJQUFJLENBQUNDLElBQUksR0FBR0EsSUFBSTtFQUNsQjtBQUNGIiwiaWdub3JlTGlzdCI6W119