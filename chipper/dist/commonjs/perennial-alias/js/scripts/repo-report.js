"use strict";

// Copyright 2018, University of Colorado Boulder

/**
 * usage:
 * cd {{repo}}
 * node ../perennial/js/scripts/repo-report.js > out.txt
 * then import in Excel
 *
 * @author Sam Reid (PhET Interactive Simulations)
 *
 * TODO https://github.com/phetsims/tasks/issues/942 This is a "quick" version which could benefit from documentation, better command line hygiene, more options, etc.
 */

var _require = require('child_process'),
  exec = _require.exec; // eslint-disable-line require-statement-match

exec('git rev-list main', function (error, stdout, stderr) {
  if (error) {
    console.error("exec error: ".concat(error));
    return;
  }
  if (stderr.length === 0 && stdout.length !== 0) {
    var lines = stdout.trim().split(/\n/).reverse();
    console.log('sha\tdate\tLOC\tTODO\tREVIEW');
    var visit = function visit(index) {
      exec("git checkout ".concat(lines[index]), function (error, stdout, stderr) {
        exec('grep -ro "TODO" ./js/ | wc -l', function (error, stdout, stderr) {
          var todoCount = stdout.trim();
          exec('grep -ro "REVIEW" ./js/ | wc -l', function (error, stdout, stderr) {
            var reviewCount = stdout.trim();
            exec('git log -1 --format=format:\'%ai\'', function (error, stdout, stderr) {
              var date = stdout.trim();
              exec('( find ./js/ -name \'*.js\' -print0 | xargs -0 cat ) | wc -l', function (error, stdout, stderr) {
                var lineCount = stdout.trim();

                // console.log( 'hello ' + lines[ index ] );
                // console.log( stdout.trim() );
                // console.log( stdout.trim() );
                console.log("".concat(lines[index], "\t").concat(date, "\t").concat(lineCount, "\t").concat(todoCount, "\t").concat(reviewCount));
                if (index < lines.length - 1) {
                  visit(index + 1);
                } else {
                  // done
                  exec('git checkout main', function (error, stdout, stderr) {
                    // console.log( 'checked out main' );
                  });
                }
              });
            });
          });
        });
      });
    };
    visit(0);
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcmVxdWlyZSIsInJlcXVpcmUiLCJleGVjIiwiZXJyb3IiLCJzdGRvdXQiLCJzdGRlcnIiLCJjb25zb2xlIiwiY29uY2F0IiwibGVuZ3RoIiwibGluZXMiLCJ0cmltIiwic3BsaXQiLCJyZXZlcnNlIiwibG9nIiwidmlzaXQiLCJpbmRleCIsInRvZG9Db3VudCIsInJldmlld0NvdW50IiwiZGF0ZSIsImxpbmVDb3VudCJdLCJzb3VyY2VzIjpbInJlcG8tcmVwb3J0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiB1c2FnZTpcclxuICogY2Qge3tyZXBvfX1cclxuICogbm9kZSAuLi9wZXJlbm5pYWwvanMvc2NyaXB0cy9yZXBvLXJlcG9ydC5qcyA+IG91dC50eHRcclxuICogdGhlbiBpbXBvcnQgaW4gRXhjZWxcclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICpcclxuICogVE9ETyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvdGFza3MvaXNzdWVzLzk0MiBUaGlzIGlzIGEgXCJxdWlja1wiIHZlcnNpb24gd2hpY2ggY291bGQgYmVuZWZpdCBmcm9tIGRvY3VtZW50YXRpb24sIGJldHRlciBjb21tYW5kIGxpbmUgaHlnaWVuZSwgbW9yZSBvcHRpb25zLCBldGMuXHJcbiAqL1xyXG5cclxuY29uc3QgeyBleGVjIH0gPSByZXF1aXJlKCAnY2hpbGRfcHJvY2VzcycgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSByZXF1aXJlLXN0YXRlbWVudC1tYXRjaFxyXG5cclxuZXhlYyggJ2dpdCByZXYtbGlzdCBtYWluJywgKCBlcnJvciwgc3Rkb3V0LCBzdGRlcnIgKSA9PiB7XHJcbiAgaWYgKCBlcnJvciApIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoIGBleGVjIGVycm9yOiAke2Vycm9yfWAgKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGlmICggc3RkZXJyLmxlbmd0aCA9PT0gMCAmJiBzdGRvdXQubGVuZ3RoICE9PSAwICkge1xyXG4gICAgY29uc3QgbGluZXMgPSBzdGRvdXQudHJpbSgpLnNwbGl0KCAvXFxuLyApLnJldmVyc2UoKTtcclxuICAgIGNvbnNvbGUubG9nKCAnc2hhXFx0ZGF0ZVxcdExPQ1xcdFRPRE9cXHRSRVZJRVcnICk7XHJcbiAgICBjb25zdCB2aXNpdCA9IGZ1bmN0aW9uKCBpbmRleCApIHtcclxuXHJcbiAgICAgIGV4ZWMoIGBnaXQgY2hlY2tvdXQgJHtsaW5lc1sgaW5kZXggXX1gLCAoIGVycm9yLCBzdGRvdXQsIHN0ZGVyciApID0+IHtcclxuXHJcbiAgICAgICAgZXhlYyggJ2dyZXAgLXJvIFwiVE9ET1wiIC4vanMvIHwgd2MgLWwnLCAoIGVycm9yLCBzdGRvdXQsIHN0ZGVyciApID0+IHtcclxuICAgICAgICAgIGNvbnN0IHRvZG9Db3VudCA9IHN0ZG91dC50cmltKCk7XHJcblxyXG4gICAgICAgICAgZXhlYyggJ2dyZXAgLXJvIFwiUkVWSUVXXCIgLi9qcy8gfCB3YyAtbCcsICggZXJyb3IsIHN0ZG91dCwgc3RkZXJyICkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCByZXZpZXdDb3VudCA9IHN0ZG91dC50cmltKCk7XHJcblxyXG4gICAgICAgICAgICBleGVjKCAnZ2l0IGxvZyAtMSAtLWZvcm1hdD1mb3JtYXQ6XFwnJWFpXFwnJywgKCBlcnJvciwgc3Rkb3V0LCBzdGRlcnIgKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc3QgZGF0ZSA9IHN0ZG91dC50cmltKCk7XHJcblxyXG4gICAgICAgICAgICAgIGV4ZWMoICcoIGZpbmQgLi9qcy8gLW5hbWUgXFwnKi5qc1xcJyAtcHJpbnQwIHwgeGFyZ3MgLTAgY2F0ICkgfCB3YyAtbCcsICggZXJyb3IsIHN0ZG91dCwgc3RkZXJyICkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbGluZUNvdW50ID0gc3Rkb3V0LnRyaW0oKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyggJ2hlbGxvICcgKyBsaW5lc1sgaW5kZXggXSApO1xyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coIHN0ZG91dC50cmltKCkgKTtcclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCBzdGRvdXQudHJpbSgpICk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggYCR7bGluZXNbIGluZGV4IF19XFx0JHtkYXRlfVxcdCR7bGluZUNvdW50fVxcdCR7dG9kb0NvdW50fVxcdCR7cmV2aWV3Q291bnR9YCApO1xyXG4gICAgICAgICAgICAgICAgaWYgKCBpbmRleCA8IGxpbmVzLmxlbmd0aCAtIDEgKSB7XHJcbiAgICAgICAgICAgICAgICAgIHZpc2l0KCBpbmRleCArIDEgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgICAgLy8gZG9uZVxyXG4gICAgICAgICAgICAgICAgICBleGVjKCAnZ2l0IGNoZWNrb3V0IG1haW4nLCAoIGVycm9yLCBzdGRvdXQsIHN0ZGVyciApID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyggJ2NoZWNrZWQgb3V0IG1haW4nICk7XHJcbiAgICAgICAgICAgICAgICAgIH0gKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICB9ICk7XHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9ICk7XHJcbiAgICB9O1xyXG4gICAgdmlzaXQoIDAgKTtcclxuICB9XHJcbn0gKTsiXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBQUEsUUFBQSxH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