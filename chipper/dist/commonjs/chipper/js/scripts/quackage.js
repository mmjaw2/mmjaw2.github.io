"use strict";

// Copyright 2022-2024, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */

var fs = require('fs');
var path = require('path');
var args = process.argv.slice(2);

/**
 * Work around import problems in WebStorm/IntelliJ by temporarily renaming package.json to another name.
 * @param {string} file - path to start searching for package.json in
 */
function visit(file) {
  var parentDir = path.dirname(file);
  var packageFile = parentDir + path.sep + 'package.json';
  var quackageFile = parentDir + path.sep + 'quackage.json';
  if (fs.existsSync(packageFile) && fs.existsSync(quackageFile)) {
    throw new Error('too many ackages');
  } else if (fs.existsSync(packageFile)) {
    console.log("renaming ".concat(packageFile, " => ").concat(quackageFile));
    fs.renameSync(packageFile, quackageFile);
  } else if (fs.existsSync(quackageFile)) {
    console.log("renaming ".concat(quackageFile, " => ").concat(packageFile));
    fs.renameSync(quackageFile, packageFile);
  } else {
    visit(parentDir);
  }
}
visit(args[0]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJwYXRoIiwiYXJncyIsInByb2Nlc3MiLCJhcmd2Iiwic2xpY2UiLCJ2aXNpdCIsImZpbGUiLCJwYXJlbnREaXIiLCJkaXJuYW1lIiwicGFja2FnZUZpbGUiLCJzZXAiLCJxdWFja2FnZUZpbGUiLCJleGlzdHNTeW5jIiwiRXJyb3IiLCJjb25zb2xlIiwibG9nIiwiY29uY2F0IiwicmVuYW1lU3luYyJdLCJzb3VyY2VzIjpbInF1YWNrYWdlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIyLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCAncGF0aCcgKTtcclxuXHJcbmNvbnN0IGFyZ3MgPSBwcm9jZXNzLmFyZ3Yuc2xpY2UoIDIgKTtcclxuXHJcbi8qKlxyXG4gKiBXb3JrIGFyb3VuZCBpbXBvcnQgcHJvYmxlbXMgaW4gV2ViU3Rvcm0vSW50ZWxsaUogYnkgdGVtcG9yYXJpbHkgcmVuYW1pbmcgcGFja2FnZS5qc29uIHRvIGFub3RoZXIgbmFtZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGUgLSBwYXRoIHRvIHN0YXJ0IHNlYXJjaGluZyBmb3IgcGFja2FnZS5qc29uIGluXHJcbiAqL1xyXG5mdW5jdGlvbiB2aXNpdCggZmlsZSApIHtcclxuXHJcbiAgY29uc3QgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKCBmaWxlICk7XHJcbiAgY29uc3QgcGFja2FnZUZpbGUgPSBwYXJlbnREaXIgKyBwYXRoLnNlcCArICdwYWNrYWdlLmpzb24nO1xyXG4gIGNvbnN0IHF1YWNrYWdlRmlsZSA9IHBhcmVudERpciArIHBhdGguc2VwICsgJ3F1YWNrYWdlLmpzb24nO1xyXG5cclxuICBpZiAoIGZzLmV4aXN0c1N5bmMoIHBhY2thZ2VGaWxlICkgJiYgZnMuZXhpc3RzU3luYyggcXVhY2thZ2VGaWxlICkgKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoICd0b28gbWFueSBhY2thZ2VzJyApO1xyXG4gIH1cclxuICBlbHNlIGlmICggZnMuZXhpc3RzU3luYyggcGFja2FnZUZpbGUgKSApIHtcclxuICAgIGNvbnNvbGUubG9nKCBgcmVuYW1pbmcgJHtwYWNrYWdlRmlsZX0gPT4gJHtxdWFja2FnZUZpbGV9YCApO1xyXG4gICAgZnMucmVuYW1lU3luYyggcGFja2FnZUZpbGUsIHF1YWNrYWdlRmlsZSApO1xyXG4gIH1cclxuICBlbHNlIGlmICggZnMuZXhpc3RzU3luYyggcXVhY2thZ2VGaWxlICkgKSB7XHJcbiAgICBjb25zb2xlLmxvZyggYHJlbmFtaW5nICR7cXVhY2thZ2VGaWxlfSA9PiAke3BhY2thZ2VGaWxlfWAgKTtcclxuICAgIGZzLnJlbmFtZVN5bmMoIHF1YWNrYWdlRmlsZSwgcGFja2FnZUZpbGUgKTtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICB2aXNpdCggcGFyZW50RGlyICk7XHJcbiAgfVxyXG59XHJcblxyXG52aXNpdCggYXJnc1sgMCBdICk7Il0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxJQUFNQSxFQUFFLEdBQUdDLE9BQU8sQ0FBRSxJQUFLLENBQUM7QUFDMUIsSUFBTUMsSUFBSSxHQUFHRCxPQUFPLENBQUUsTUFBTyxDQUFDO0FBRTlCLElBQU1FLElBQUksR0FBR0MsT0FBTyxDQUFDQyxJQUFJLENBQUNDLEtBQUssQ0FBRSxDQUFFLENBQUM7O0FBRXBDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBU0MsS0FBS0EsQ0FBRUMsSUFBSSxFQUFHO0VBRXJCLElBQU1DLFNBQVMsR0FBR1AsSUFBSSxDQUFDUSxPQUFPLENBQUVGLElBQUssQ0FBQztFQUN0QyxJQUFNRyxXQUFXLEdBQUdGLFNBQVMsR0FBR1AsSUFBSSxDQUFDVSxHQUFHLEdBQUcsY0FBYztFQUN6RCxJQUFNQyxZQUFZLEdBQUdKLFNBQVMsR0FBR1AsSUFBSSxDQUFDVSxHQUFHLEdBQUcsZUFBZTtFQUUzRCxJQUFLWixFQUFFLENBQUNjLFVBQVUsQ0FBRUgsV0FBWSxDQUFDLElBQUlYLEVBQUUsQ0FBQ2MsVUFBVSxDQUFFRCxZQUFhLENBQUMsRUFBRztJQUNuRSxNQUFNLElBQUlFLEtBQUssQ0FBRSxrQkFBbUIsQ0FBQztFQUN2QyxDQUFDLE1BQ0ksSUFBS2YsRUFBRSxDQUFDYyxVQUFVLENBQUVILFdBQVksQ0FBQyxFQUFHO0lBQ3ZDSyxPQUFPLENBQUNDLEdBQUcsYUFBQUMsTUFBQSxDQUFjUCxXQUFXLFVBQUFPLE1BQUEsQ0FBT0wsWUFBWSxDQUFHLENBQUM7SUFDM0RiLEVBQUUsQ0FBQ21CLFVBQVUsQ0FBRVIsV0FBVyxFQUFFRSxZQUFhLENBQUM7RUFDNUMsQ0FBQyxNQUNJLElBQUtiLEVBQUUsQ0FBQ2MsVUFBVSxDQUFFRCxZQUFhLENBQUMsRUFBRztJQUN4Q0csT0FBTyxDQUFDQyxHQUFHLGFBQUFDLE1BQUEsQ0FBY0wsWUFBWSxVQUFBSyxNQUFBLENBQU9QLFdBQVcsQ0FBRyxDQUFDO0lBQzNEWCxFQUFFLENBQUNtQixVQUFVLENBQUVOLFlBQVksRUFBRUYsV0FBWSxDQUFDO0VBQzVDLENBQUMsTUFDSTtJQUNISixLQUFLLENBQUVFLFNBQVUsQ0FBQztFQUNwQjtBQUNGO0FBRUFGLEtBQUssQ0FBRUosSUFBSSxDQUFFLENBQUMsQ0FBRyxDQUFDIiwiaWdub3JlTGlzdCI6W119