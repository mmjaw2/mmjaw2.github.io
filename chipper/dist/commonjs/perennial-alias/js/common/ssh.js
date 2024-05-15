"use strict";

// Copyright 2017, University of Colorado Boulder

/**
 * Executes a command on a remote server.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var execute = require('./execute');
var winston = require('../../../../../../perennial-alias/node_modules/winston');

/**
 * Executes a command on a remote server.
 * @public
 *
 * @param {string} username
 * @param {string} host
 * @param {string} cmd - The process to execute.
 * @returns {Promise.<string>} - Stdout
 * @rejects {ExecuteError}
 */
module.exports = function (username, host, cmd) {
  winston.info("running ".concat(cmd, " remotely on ").concat(host));
  return execute('ssh', ["".concat(username, "@").concat(host), cmd], '.');
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleGVjdXRlIiwicmVxdWlyZSIsIndpbnN0b24iLCJtb2R1bGUiLCJleHBvcnRzIiwidXNlcm5hbWUiLCJob3N0IiwiY21kIiwiaW5mbyIsImNvbmNhdCJdLCJzb3VyY2VzIjpbInNzaC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogRXhlY3V0ZXMgYSBjb21tYW5kIG9uIGEgcmVtb3RlIHNlcnZlci5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmNvbnN0IGV4ZWN1dGUgPSByZXF1aXJlKCAnLi9leGVjdXRlJyApO1xyXG5jb25zdCB3aW5zdG9uID0gcmVxdWlyZSggJ3dpbnN0b24nICk7XHJcblxyXG4vKipcclxuICogRXhlY3V0ZXMgYSBjb21tYW5kIG9uIGEgcmVtb3RlIHNlcnZlci5cclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdXNlcm5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGhvc3RcclxuICogQHBhcmFtIHtzdHJpbmd9IGNtZCAtIFRoZSBwcm9jZXNzIHRvIGV4ZWN1dGUuXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlLjxzdHJpbmc+fSAtIFN0ZG91dFxyXG4gKiBAcmVqZWN0cyB7RXhlY3V0ZUVycm9yfVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggdXNlcm5hbWUsIGhvc3QsIGNtZCApIHtcclxuICB3aW5zdG9uLmluZm8oIGBydW5uaW5nICR7Y21kfSByZW1vdGVseSBvbiAke2hvc3R9YCApO1xyXG5cclxuICByZXR1cm4gZXhlY3V0ZSggJ3NzaCcsIFtcclxuICAgIGAke3VzZXJuYW1lfUAke2hvc3R9YCxcclxuICAgIGNtZFxyXG4gIF0sICcuJyApO1xyXG59OyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLElBQU1BLE9BQU8sR0FBR0MsT0FBTyxDQUFFLFdBQVksQ0FBQztBQUN0QyxJQUFNQyxPQUFPLEdBQUdELE9BQU8sQ0FBRSxTQUFVLENBQUM7O0FBRXBDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FFLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLFVBQVVDLFFBQVEsRUFBRUMsSUFBSSxFQUFFQyxHQUFHLEVBQUc7RUFDL0NMLE9BQU8sQ0FBQ00sSUFBSSxZQUFBQyxNQUFBLENBQWFGLEdBQUcsbUJBQUFFLE1BQUEsQ0FBZ0JILElBQUksQ0FBRyxDQUFDO0VBRXBELE9BQU9OLE9BQU8sQ0FBRSxLQUFLLEVBQUUsSUFBQVMsTUFBQSxDQUNsQkosUUFBUSxPQUFBSSxNQUFBLENBQUlILElBQUksR0FDbkJDLEdBQUcsQ0FDSixFQUFFLEdBQUksQ0FBQztBQUNWLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=