"use strict";

// Copyright 2021-2024, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */

var fs = require('fs');
var keyLines = fs.readFileSync('../scenery/js/imports.ts', 'utf-8').split('\n');

// import Node from '../../../../scenery/js/nodes/Node.js';
var mapLine = function mapLine(text) {
  // console.log( text );
  var imported = text.substring(text.indexOf('{') + 1, text.indexOf('}')).trim();
  if (imported.includes(',')) {
    // console.log( imported );
    console.log('multiline: ' + imported);
  } else {
    var found = keyLines.filter(function (key) {
      return key.includes('/' + imported + '.js') && (key.includes('default as ' + imported + ',') || key.includes('default as ' + imported + ' '));
    });
    // console.log( found.length );
    if (found.length === 1) {
      // console.log( found );
    } else {
      console.log('wrong count: ' + imported + ': ' + found.length);
    }
  }
  return text;
};
var visit = function visit(path) {
  var list = fs.readdirSync(path);
  list.forEach(function (filename) {
    var child = path + '/' + filename;
    var stats = fs.statSync(child);
    if (stats && stats.isDirectory()) {
      visit(child);
    } else {
      if (!child.includes('node_modules') && child.includes('js') && !child.includes('build') && !child.includes('dist') && (child.endsWith('.js') || child.endsWith('.ts') && !child.includes('sherpa/'))) {
        var text = fs.readFileSync(child, 'utf-8');
        if (text.includes('scenery/js/imports.js')) {
          // console.log( child );
          var lines = text.split('\n');
          var mapped = lines.map(function (line) {
            // eslint-disable-line no-unused-vars
            line = line.trim();
            if (line.includes('scenery/js/imports.js') && line.endsWith(';')) {
              return mapLine(line);
            } else {
              return line;
            }
          });
        }
      }
    }
  });
};
visit('/Users/samreid/apache-document-root/main');
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJrZXlMaW5lcyIsInJlYWRGaWxlU3luYyIsInNwbGl0IiwibWFwTGluZSIsInRleHQiLCJpbXBvcnRlZCIsInN1YnN0cmluZyIsImluZGV4T2YiLCJ0cmltIiwiaW5jbHVkZXMiLCJjb25zb2xlIiwibG9nIiwiZm91bmQiLCJmaWx0ZXIiLCJrZXkiLCJsZW5ndGgiLCJ2aXNpdCIsInBhdGgiLCJsaXN0IiwicmVhZGRpclN5bmMiLCJmb3JFYWNoIiwiZmlsZW5hbWUiLCJjaGlsZCIsInN0YXRzIiwic3RhdFN5bmMiLCJpc0RpcmVjdG9yeSIsImVuZHNXaXRoIiwibGluZXMiLCJtYXBwZWQiLCJtYXAiLCJsaW5lIl0sInNvdXJjZXMiOlsic2NlbmVyeS1pbXBvcnRzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcblxyXG5jb25zdCBrZXlMaW5lcyA9IGZzLnJlYWRGaWxlU3luYyggJy4uL3NjZW5lcnkvanMvaW1wb3J0cy50cycsICd1dGYtOCcgKS5zcGxpdCggJ1xcbicgKTtcclxuXHJcbi8vIGltcG9ydCBOb2RlIGZyb20gJy4uLy4uLy4uLy4uL3NjZW5lcnkvanMvbm9kZXMvTm9kZS5qcyc7XHJcbmNvbnN0IG1hcExpbmUgPSB0ZXh0ID0+IHtcclxuICAvLyBjb25zb2xlLmxvZyggdGV4dCApO1xyXG4gIGNvbnN0IGltcG9ydGVkID0gdGV4dC5zdWJzdHJpbmcoIHRleHQuaW5kZXhPZiggJ3snICkgKyAxLCB0ZXh0LmluZGV4T2YoICd9JyApICkudHJpbSgpO1xyXG5cclxuICBpZiAoIGltcG9ydGVkLmluY2x1ZGVzKCAnLCcgKSApIHtcclxuICAgIC8vIGNvbnNvbGUubG9nKCBpbXBvcnRlZCApO1xyXG4gICAgY29uc29sZS5sb2coICdtdWx0aWxpbmU6ICcgKyBpbXBvcnRlZCApO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGNvbnN0IGZvdW5kID0ga2V5TGluZXMuZmlsdGVyKCBrZXkgPT4ga2V5LmluY2x1ZGVzKCAnLycgKyBpbXBvcnRlZCArICcuanMnICkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCBrZXkuaW5jbHVkZXMoICdkZWZhdWx0IGFzICcgKyBpbXBvcnRlZCArICcsJyApIHx8IGtleS5pbmNsdWRlcyggJ2RlZmF1bHQgYXMgJyArIGltcG9ydGVkICsgJyAnICkgKVxyXG4gICAgKTtcclxuICAgIC8vIGNvbnNvbGUubG9nKCBmb3VuZC5sZW5ndGggKTtcclxuICAgIGlmICggZm91bmQubGVuZ3RoID09PSAxICkge1xyXG4gICAgICAvLyBjb25zb2xlLmxvZyggZm91bmQgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBjb25zb2xlLmxvZyggJ3dyb25nIGNvdW50OiAnICsgaW1wb3J0ZWQgKyAnOiAnICsgZm91bmQubGVuZ3RoICk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiB0ZXh0O1xyXG59O1xyXG5cclxuY29uc3QgdmlzaXQgPSBwYXRoID0+IHtcclxuICBjb25zdCBsaXN0ID0gZnMucmVhZGRpclN5bmMoIHBhdGggKTtcclxuICBsaXN0LmZvckVhY2goIGZpbGVuYW1lID0+IHtcclxuICAgIGNvbnN0IGNoaWxkID0gcGF0aCArICcvJyArIGZpbGVuYW1lO1xyXG4gICAgY29uc3Qgc3RhdHMgPSBmcy5zdGF0U3luYyggY2hpbGQgKTtcclxuICAgIGlmICggc3RhdHMgJiYgc3RhdHMuaXNEaXJlY3RvcnkoKSApIHtcclxuICAgICAgdmlzaXQoIGNoaWxkICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgaWYgKFxyXG4gICAgICAgICFjaGlsZC5pbmNsdWRlcyggJ25vZGVfbW9kdWxlcycgKSAmJlxyXG4gICAgICAgIGNoaWxkLmluY2x1ZGVzKCAnanMnICkgJiZcclxuICAgICAgICAhY2hpbGQuaW5jbHVkZXMoICdidWlsZCcgKSAmJlxyXG4gICAgICAgICFjaGlsZC5pbmNsdWRlcyggJ2Rpc3QnICkgJiZcclxuICAgICAgICAoIGNoaWxkLmVuZHNXaXRoKCAnLmpzJyApIHx8IGNoaWxkLmVuZHNXaXRoKCAnLnRzJyApICYmXHJcbiAgICAgICAgICAhY2hpbGQuaW5jbHVkZXMoICdzaGVycGEvJyApXHJcbiAgICAgICAgKSApIHtcclxuXHJcblxyXG4gICAgICAgIGNvbnN0IHRleHQgPSBmcy5yZWFkRmlsZVN5bmMoIGNoaWxkLCAndXRmLTgnICk7XHJcbiAgICAgICAgaWYgKCB0ZXh0LmluY2x1ZGVzKCAnc2NlbmVyeS9qcy9pbXBvcnRzLmpzJyApICkge1xyXG4gICAgICAgICAgLy8gY29uc29sZS5sb2coIGNoaWxkICk7XHJcbiAgICAgICAgICBjb25zdCBsaW5lcyA9IHRleHQuc3BsaXQoICdcXG4nICk7XHJcbiAgICAgICAgICBjb25zdCBtYXBwZWQgPSBsaW5lcy5tYXAoIGxpbmUgPT4geyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXHJcbiAgICAgICAgICAgIGxpbmUgPSBsaW5lLnRyaW0oKTtcclxuICAgICAgICAgICAgaWYgKCBsaW5lLmluY2x1ZGVzKCAnc2NlbmVyeS9qcy9pbXBvcnRzLmpzJyApICYmIGxpbmUuZW5kc1dpdGgoICc7JyApICkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBtYXBMaW5lKCBsaW5lICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGxpbmU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9ICk7XHJcbn07XHJc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