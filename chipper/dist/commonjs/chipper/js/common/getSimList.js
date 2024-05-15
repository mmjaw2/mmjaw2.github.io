"use strict";

// Copyright 2021-2022, University of Colorado Boulder

/**
 * Parses command line arguments--sims=sim1,sim2,... or --simList=path/to/filename to get a list of sims.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

var fs = require('fs');
'use strict';
module.exports = function () {
  var args = process.argv.slice(2);

  // if the arg is just a flag, then the callback will be called with a null parameter
  var processKey = function processKey(key, callback) {
    var prefix = "--".concat(key);
    var values = args.filter(function (arg) {
      return arg.startsWith(prefix);
    });
    if (values.length === 1) {
      if (values[0].startsWith("".concat(prefix, "="))) {
        callback(values[0].substring(prefix.length + 1));
      } else {
        callback(null);
      }
    } else if (values.length > 1) {
      console.log("Too many --".concat(prefix, "... specified"));
      process.exit(1);
    }
  };
  var repos = [];
  processKey('simList', function (value) {
    var contents = fs.readFileSync(value, 'utf8').trim();
    repos = contents.split('\n').map(function (sim) {
      return sim.trim();
    });
  });
  processKey('stable', function () {
    var contents = fs.readFileSync('../perennial-alias/data/phet-io-api-stable', 'utf8').trim();
    repos = contents.split('\n').map(function (sim) {
      return sim.trim();
    });
  });
  processKey('sims', function (value) {
    repos = value.split(',');
  });
  return repos;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJtb2R1bGUiLCJleHBvcnRzIiwiYXJncyIsInByb2Nlc3MiLCJhcmd2Iiwic2xpY2UiLCJwcm9jZXNzS2V5Iiwia2V5IiwiY2FsbGJhY2siLCJwcmVmaXgiLCJjb25jYXQiLCJ2YWx1ZXMiLCJmaWx0ZXIiLCJhcmciLCJzdGFydHNXaXRoIiwibGVuZ3RoIiwic3Vic3RyaW5nIiwiY29uc29sZSIsImxvZyIsImV4aXQiLCJyZXBvcyIsInZhbHVlIiwiY29udGVudHMiLCJyZWFkRmlsZVN5bmMiLCJ0cmltIiwic3BsaXQiLCJtYXAiLCJzaW0iXSwic291cmNlcyI6WyJnZXRTaW1MaXN0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjIsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFBhcnNlcyBjb21tYW5kIGxpbmUgYXJndW1lbnRzLS1zaW1zPXNpbTEsc2ltMiwuLi4gb3IgLS1zaW1MaXN0PXBhdGgvdG8vZmlsZW5hbWUgdG8gZ2V0IGEgbGlzdCBvZiBzaW1zLlxyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG5cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgYXJncyA9IHByb2Nlc3MuYXJndi5zbGljZSggMiApO1xyXG5cclxuICAvLyBpZiB0aGUgYXJnIGlzIGp1c3QgYSBmbGFnLCB0aGVuIHRoZSBjYWxsYmFjayB3aWxsIGJlIGNhbGxlZCB3aXRoIGEgbnVsbCBwYXJhbWV0ZXJcclxuICBjb25zdCBwcm9jZXNzS2V5ID0gKCBrZXksIGNhbGxiYWNrICkgPT4ge1xyXG4gICAgY29uc3QgcHJlZml4ID0gYC0tJHtrZXl9YDtcclxuICAgIGNvbnN0IHZhbHVlcyA9IGFyZ3MuZmlsdGVyKCBhcmcgPT4gYXJnLnN0YXJ0c1dpdGgoIHByZWZpeCApICk7XHJcbiAgICBpZiAoIHZhbHVlcy5sZW5ndGggPT09IDEgKSB7XHJcbiAgICAgIGlmICggdmFsdWVzWyAwIF0uc3RhcnRzV2l0aCggYCR7cHJlZml4fT1gICkgKSB7XHJcbiAgICAgICAgY2FsbGJhY2soIHZhbHVlc1sgMCBdLnN1YnN0cmluZyggcHJlZml4Lmxlbmd0aCArIDEgKSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGNhbGxiYWNrKCBudWxsICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB2YWx1ZXMubGVuZ3RoID4gMSApIHtcclxuICAgICAgY29uc29sZS5sb2coIGBUb28gbWFueSAtLSR7cHJlZml4fS4uLiBzcGVjaWZpZWRgICk7XHJcbiAgICAgIHByb2Nlc3MuZXhpdCggMSApO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGxldCByZXBvcyA9IFtdO1xyXG4gIHByb2Nlc3NLZXkoICdzaW1MaXN0JywgdmFsdWUgPT4ge1xyXG4gICAgY29uc3QgY29udGVudHMgPSBmcy5yZWFkRmlsZVN5bmMoIHZhbHVlLCAndXRmOCcgKS50cmltKCk7XHJcbiAgICByZXBvcyA9IGNvbnRlbnRzLnNwbGl0KCAnXFxuJyApLm1hcCggc2ltID0+IHNpbS50cmltKCkgKTtcclxuICB9ICk7XHJcbiAgcHJvY2Vzc0tleSggJ3N0YWJsZScsICgpID0+IHtcclxuICAgIGNvbnN0IGNvbnRlbnRzID0gZnMucmVhZEZpbGVTeW5jKCAnLi4vcGVyZW5uaWFsLWFsaWFzL2RhdGEvcGhldC1pby1hcGktc3RhYmxlJywgJ3V0ZjgnICkudHJpbSgpO1xyXG4gICAgcmVwb3MgPSBjb250ZW50cy5zcGxpdCggJ1xcbicgKS5tYXAoIHNpbSA9PiBzaW0udHJpbSgpICk7XHJcbiAgfSApO1xyXG4gIHByb2Nlc3NLZXkoICdzaW1zJywgdmFsdWUgPT4ge1xyXG4gICAgcmVwb3MgPSB2YWx1ZS5zcGxpdCggJywnICk7XHJcbiAgfSApO1xyXG5cclxuICByZXR1cm4gcmVwb3M7XHJcbn07Il0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBTUEsRUFBRSxHQUFHQyxPQUFPLENBQUUsSUFBSyxDQUFDO0FBRTFCLFlBQVk7QUFFWkMsTUFBTSxDQUFDQyxPQUFPLEdBQUcsWUFBTTtFQUNyQixJQUFNQyxJQUFJLEdBQUdDLE9BQU8sQ0FBQ0MsSUFBSSxDQUFDQyxLQUFLLENBQUUsQ0FBRSxDQUFDOztFQUVwQztFQUNBLElBQU1DLFVBQVUsR0FBRyxTQUFiQSxVQUFVQSxDQUFLQyxHQUFHLEVBQUVDLFFBQVEsRUFBTTtJQUN0QyxJQUFNQyxNQUFNLFFBQUFDLE1BQUEsQ0FBUUgsR0FBRyxDQUFFO0lBQ3pCLElBQU1JLE1BQU0sR0FBR1QsSUFBSSxDQUFDVSxNQUFNLENBQUUsVUFBQUMsR0FBRztNQUFBLE9BQUlBLEdBQUcsQ0FBQ0MsVUFBVSxDQUFFTCxNQUFPLENBQUM7SUFBQSxDQUFDLENBQUM7SUFDN0QsSUFBS0UsTUFBTSxDQUFDSSxNQUFNLEtBQUssQ0FBQyxFQUFHO01BQ3pCLElBQUtKLE1BQU0sQ0FBRSxDQUFDLENBQUUsQ0FBQ0csVUFBVSxJQUFBSixNQUFBLENBQUtELE1BQU0sTUFBSSxDQUFDLEVBQUc7UUFDNUNELFFBQVEsQ0FBRUcsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDSyxTQUFTLENBQUVQLE1BQU0sQ0FBQ00sTUFBTSxHQUFHLENBQUUsQ0FBRSxDQUFDO01BQ3hELENBQUMsTUFDSTtRQUNIUCxRQUFRLENBQUUsSUFBSyxDQUFDO01BQ2xCO0lBQ0YsQ0FBQyxNQUNJLElBQUtHLE1BQU0sQ0FBQ0ksTUFBTSxHQUFHLENBQUMsRUFBRztNQUM1QkUsT0FBTyxDQUFDQyxHQUFHLGVBQUFSLE1BQUEsQ0FBZ0JELE1BQU0sa0JBQWdCLENBQUM7TUFDbEROLE9BQU8sQ0FBQ2dCLElBQUksQ0FBRSxDQUFFLENBQUM7SUFDbkI7RUFDRixDQUFDO0VBRUQsSUFBSUMsS0FBSyxHQUFHLEVBQUU7RUFDZGQsVUFBVSxDQUFFLFNBQVMsRUFBRSxVQUFBZSxLQUFLLEVBQUk7SUFDOUIsSUFBTUMsUUFBUSxHQUFHeEIsRUFBRSxDQUFDeUIsWUFBWSxDQUFFRixLQUFLLEVBQUUsTUFBTyxDQUFDLENBQUNHLElBQUksQ0FBQyxDQUFDO0lBQ3hESixLQUFLLEdBQUdFLFFBQVEsQ0FBQ0csS0FBSyxDQUFFLElBQUssQ0FBQyxDQUFDQyxHQUFHLENBQUUsVUFBQUMsR0FBRztNQUFBLE9BQUlBLEdBQUcsQ0FBQ0gsSUFBSSxDQUFDLENBQUM7SUFBQSxDQUFDLENBQUM7RUFDekQsQ0FBRSxDQUFDO0VBQ0hsQixVQUFVLENBQUUsUUFBUSxFQUFFLFlBQU07SUFDMUIsSUFBTWdCLFFBQVEsR0FBR3hCLEVBQUUsQ0FBQ3lCLFlBQVksQ0FBRSw0Q0FBNEMsRUFBRSxNQUFPLENBQUMsQ0FBQ0MsSUFBSSxDQUFDLENBQUM7SUFDL0ZKLEtBQUssR0FBR0UsUUFBUSxDQUFDRyxLQUFLLENBQUUsSUFBSyxDQUFDLENBQUNDLEdBQUcsQ0FBRSxVQUFBQyxHQUFHO01BQUEsT0FBSUEsR0FBRyxDQUFDSCxJQUFJLENBQUMsQ0FBQztJQUFBLENBQUMsQ0FBQztFQUN6RCxDQUFFLENBQUM7RUFDSGxCLFVBQVUsQ0FBRSxNQUFNLEVBQUUsVUFBQWUsS0FBSyxFQUFJO0lBQzNCRCxLQUFLLEdBQUdDLEtBQUssQ0FBQ0ksS0FBSyxDQUFFLEdBQUksQ0FBQztFQUM1QixDQUFFLENBQUM7RUFFSCxPQUFPTCxLQUFLO0FBQ2QsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==