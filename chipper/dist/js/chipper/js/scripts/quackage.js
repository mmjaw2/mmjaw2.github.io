// Copyright 2022-2024, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */

const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);

/**
 * Work around import problems in WebStorm/IntelliJ by temporarily renaming package.json to another name.
 * @param {string} file - path to start searching for package.json in
 */
function visit(file) {
  const parentDir = path.dirname(file);
  const packageFile = parentDir + path.sep + 'package.json';
  const quackageFile = parentDir + path.sep + 'quackage.json';
  if (fs.existsSync(packageFile) && fs.existsSync(quackageFile)) {
    throw new Error('too many ackages');
  } else if (fs.existsSync(packageFile)) {
    console.log(`renaming ${packageFile} => ${quackageFile}`);
    fs.renameSync(packageFile, quackageFile);
  } else if (fs.existsSync(quackageFile)) {
    console.log(`renaming ${quackageFile} => ${packageFile}`);
    fs.renameSync(quackageFile, packageFile);
  } else {
    visit(parentDir);
  }
}
visit(args[0]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJwYXRoIiwiYXJncyIsInByb2Nlc3MiLCJhcmd2Iiwic2xpY2UiLCJ2aXNpdCIsImZpbGUiLCJwYXJlbnREaXIiLCJkaXJuYW1lIiwicGFja2FnZUZpbGUiLCJzZXAiLCJxdWFja2FnZUZpbGUiLCJleGlzdHNTeW5jIiwiRXJyb3IiLCJjb25zb2xlIiwibG9nIiwicmVuYW1lU3luYyJdLCJzb3VyY2VzIjpbInF1YWNrYWdlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIyLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCAncGF0aCcgKTtcclxuXHJcbmNvbnN0IGFyZ3MgPSBwcm9jZXNzLmFyZ3Yuc2xpY2UoIDIgKTtcclxuXHJcbi8qKlxyXG4gKiBXb3JrIGFyb3VuZCBpbXBvcnQgcHJvYmxlbXMgaW4gV2ViU3Rvcm0vSW50ZWxsaUogYnkgdGVtcG9yYXJpbHkgcmVuYW1pbmcgcGFja2FnZS5qc29uIHRvIGFub3RoZXIgbmFtZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGUgLSBwYXRoIHRvIHN0YXJ0IHNlYXJjaGluZyBmb3IgcGFja2FnZS5qc29uIGluXHJcbiAqL1xyXG5mdW5jdGlvbiB2aXNpdCggZmlsZSApIHtcclxuXHJcbiAgY29uc3QgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKCBmaWxlICk7XHJcbiAgY29uc3QgcGFja2FnZUZpbGUgPSBwYXJlbnREaXIgKyBwYXRoLnNlcCArICdwYWNrYWdlLmpzb24nO1xyXG4gIGNvbnN0IHF1YWNrYWdlRmlsZSA9IHBhcmVudERpciArIHBhdGguc2VwICsgJ3F1YWNrYWdlLmpzb24nO1xyXG5cclxuICBpZiAoIGZzLmV4aXN0c1N5bmMoIHBhY2thZ2VGaWxlICkgJiYgZnMuZXhpc3RzU3luYyggcXVhY2thZ2VGaWxlICkgKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoICd0b28gbWFueSBhY2thZ2VzJyApO1xyXG4gIH1cclxuICBlbHNlIGlmICggZnMuZXhpc3RzU3luYyggcGFja2FnZUZpbGUgKSApIHtcclxuICAgIGNvbnNvbGUubG9nKCBgcmVuYW1pbmcgJHtwYWNrYWdlRmlsZX0gPT4gJHtxdWFja2FnZUZpbGV9YCApO1xyXG4gICAgZnMucmVuYW1lU3luYyggcGFja2FnZUZpbGUsIHF1YWNrYWdlRmlsZSApO1xyXG4gIH1cclxuICBlbHNlIGlmICggZnMuZXhpc3RzU3luYyggcXVhY2thZ2VGaWxlICkgKSB7XHJcbiAgICBjb25zb2xlLmxvZyggYHJlbmFtaW5nICR7cXVhY2thZ2VGaWxlfSA9PiAke3BhY2thZ2VGaWxlfWAgKTtcclxuICAgIGZzLnJlbmFtZVN5bmMoIHF1YWNrYWdlRmlsZSwgcGFja2FnZUZpbGUgKTtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICB2aXNpdCggcGFyZW50RGlyICk7XHJcbiAgfVxyXG59XHJcblxyXG52aXNpdCggYXJnc1sgMCBdICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTUEsRUFBRSxHQUFHQyxPQUFPLENBQUUsSUFBSyxDQUFDO0FBQzFCLE1BQU1DLElBQUksR0FBR0QsT0FBTyxDQUFFLE1BQU8sQ0FBQztBQUU5QixNQUFNRSxJQUFJLEdBQUdDLE9BQU8sQ0FBQ0MsSUFBSSxDQUFDQyxLQUFLLENBQUUsQ0FBRSxDQUFDOztBQUVwQztBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVNDLEtBQUtBLENBQUVDLElBQUksRUFBRztFQUVyQixNQUFNQyxTQUFTLEdBQUdQLElBQUksQ0FBQ1EsT0FBTyxDQUFFRixJQUFLLENBQUM7RUFDdEMsTUFBTUcsV0FBVyxHQUFHRixTQUFTLEdBQUdQLElBQUksQ0FBQ1UsR0FBRyxHQUFHLGNBQWM7RUFDekQsTUFBTUMsWUFBWSxHQUFHSixTQUFTLEdBQUdQLElBQUksQ0FBQ1UsR0FBRyxHQUFHLGVBQWU7RUFFM0QsSUFBS1osRUFBRSxDQUFDYyxVQUFVLENBQUVILFdBQVksQ0FBQyxJQUFJWCxFQUFFLENBQUNjLFVBQVUsQ0FBRUQsWUFBYSxDQUFDLEVBQUc7SUFDbkUsTUFBTSxJQUFJRSxLQUFLLENBQUUsa0JBQW1CLENBQUM7RUFDdkMsQ0FBQyxNQUNJLElBQUtmLEVBQUUsQ0FBQ2MsVUFBVSxDQUFFSCxXQUFZLENBQUMsRUFBRztJQUN2Q0ssT0FBTyxDQUFDQyxHQUFHLENBQUcsWUFBV04sV0FBWSxPQUFNRSxZQUFhLEVBQUUsQ0FBQztJQUMzRGIsRUFBRSxDQUFDa0IsVUFBVSxDQUFFUCxXQUFXLEVBQUVFLFlBQWEsQ0FBQztFQUM1QyxDQUFDLE1BQ0ksSUFBS2IsRUFBRSxDQUFDYyxVQUFVLENBQUVELFlBQWEsQ0FBQyxFQUFHO0lBQ3hDRyxPQUFPLENBQUNDLEdBQUcsQ0FBRyxZQUFXSixZQUFhLE9BQU1GLFdBQVksRUFBRSxDQUFDO0lBQzNEWCxFQUFFLENBQUNrQixVQUFVLENBQUVMLFlBQVksRUFBRUYsV0FBWSxDQUFDO0VBQzVDLENBQUMsTUFDSTtJQUNISixLQUFLLENBQUVFLFNBQVUsQ0FBQztFQUNwQjtBQUNGO0FBRUFGLEtBQUssQ0FBRUosSUFBSSxDQUFFLENBQUMsQ0FBRyxDQUFDIiwiaWdub3JlTGlzdCI6W119