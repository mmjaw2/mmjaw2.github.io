"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
// Copyright 2021-2024, University of Colorado Boulder

/**
 * Command Line Interface (CLI) for TypeScript transpilation via babel.  Transpiles *.ts and copies all *.js files to
 * chipper/dist/js. Does not do type checking. Filters based on active-repos and subsets of directories within repos
 * (such as js/, images/, and sounds/)
 *
 * Usage:
 * cd chipper
 * node js/scripts/transpile.js --watch
 *
 * OPTIONS:
 * --watch                Continue watching all directories and transpile on detected changes.
 * --clean                Dispose of the cache that tracks file status on startup, can be combined with other commands.
 *                        You would need to run --clean if the files in chipper/dist/js or chipper/dist/js-cache-status.json
 *                        are modified externally.  For example if you edit a file in chipper/dist/js or if you edit
 *                        chipper/dist/js-cache-status.json, they would be out of sync.  If you `rm -rf chipper/dist`
 *                        that does not require --clean, because that erases the cache file and the js files together.
 * --repos                Additional repos to compile (not listed in perennial-alias/data/active-repos). The names of the repos,
 *                        separated by commas, like --repos=myrepo1,myrepo2. Directory names only, not paths
 * --skipMinifyWGSL       Do not minify WGSL files
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// constants
var start = Date.now();
var args = process.argv.slice(2);

// imports
var Transpiler = require('../common/Transpiler');
var repos = [];
var reposKey = '--repos=';
args.filter(function (arg) {
  return arg.startsWith(reposKey);
}).forEach(function (arg) {
  repos.push.apply(repos, _toConsumableArray(arg.substring(reposKey.length).split(',')));
});
var brands = [];
var brandsKey = '--brands=';
args.filter(function (arg) {
  return arg.startsWith(brandsKey);
}).forEach(function (arg) {
  brands.push.apply(brands, _toConsumableArray(arg.substring(brandsKey.length).split(',')));
});
var transpiler = new Transpiler({
  clean: args.includes('--clean'),
  verbose: args.includes('--verbose'),
  repos: repos,
  brands: brands,
  minifyWGSL: !args.includes('--skipMinifyWGSL')
});
transpiler.pruneStaleDistFiles('js');
transpiler.pruneStaleDistFiles('commonjs');

// Watch process
if (args.includes('--watch')) {
  transpiler.watch();
}

// Initial pass
transpiler.transpileAll();
console.log('Finished initial transpilation in ' + (Date.now() - start) + 'ms');
if (args.includes('--watch')) {
  console.log('Watching...');
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJzdGFydCIsIkRhdGUiLCJub3ciLCJhcmdzIiwicHJvY2VzcyIsImFyZ3YiLCJzbGljZSIsIlRyYW5zcGlsZXIiLCJyZXF1aXJlIiwicmVwb3MiLCJyZXBvc0tleSIsImZpbHRlciIsImFyZyIsInN0YXJ0c1dpdGgiLCJmb3JFYWNoIiwicHVzaCIsImFwcGx5IiwiX3RvQ29uc3VtYWJsZUFycmF5Iiwic3Vic3RyaW5nIiwibGVuZ3RoIiwic3BsaXQiLCJicmFuZHMiLCJicmFuZHNLZXkiLCJ0cmFuc3BpbGVyIiwiY2xlYW4iLCJpbmNsdWRlcyIsInZlcmJvc2UiLCJtaW5pZnlXR1NMIiwicHJ1bmVTdGFsZURpc3RGaWxlcyIsIndhdGNoIiwidHJhbnNwaWxlQWxsIiwiY29uc29sZSIsImxvZyJdLCJzb3VyY2VzIjpbInRyYW5zcGlsZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMS0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBDb21tYW5kIExpbmUgSW50ZXJmYWNlIChDTEkpIGZvciBUeXBlU2NyaXB0IHRyYW5zcGlsYXRpb24gdmlhIGJhYmVsLiAgVHJhbnNwaWxlcyAqLnRzIGFuZCBjb3BpZXMgYWxsICouanMgZmlsZXMgdG9cclxuICogY2hpcHBlci9kaXN0L2pzLiBEb2VzIG5vdCBkbyB0eXBlIGNoZWNraW5nLiBGaWx0ZXJzIGJhc2VkIG9uIGFjdGl2ZS1yZXBvcyBhbmQgc3Vic2V0cyBvZiBkaXJlY3RvcmllcyB3aXRoaW4gcmVwb3NcclxuICogKHN1Y2ggYXMganMvLCBpbWFnZXMvLCBhbmQgc291bmRzLylcclxuICpcclxuICogVXNhZ2U6XHJcbiAqIGNkIGNoaXBwZXJcclxuICogbm9kZSBqcy9zY3JpcHRzL3RyYW5zcGlsZS5qcyAtLXdhdGNoXHJcbiAqXHJcbiAqIE9QVElPTlM6XHJcbiAqIC0td2F0Y2ggICAgICAgICAgICAgICAgQ29udGludWUgd2F0Y2hpbmcgYWxsIGRpcmVjdG9yaWVzIGFuZCB0cmFuc3BpbGUgb24gZGV0ZWN0ZWQgY2hhbmdlcy5cclxuICogLS1jbGVhbiAgICAgICAgICAgICAgICBEaXNwb3NlIG9mIHRoZSBjYWNoZSB0aGF0IHRyYWNrcyBmaWxlIHN0YXR1cyBvbiBzdGFydHVwLCBjYW4gYmUgY29tYmluZWQgd2l0aCBvdGhlciBjb21tYW5kcy5cclxuICogICAgICAgICAgICAgICAgICAgICAgICBZb3Ugd291bGQgbmVlZCB0byBydW4gLS1jbGVhbiBpZiB0aGUgZmlsZXMgaW4gY2hpcHBlci9kaXN0L2pzIG9yIGNoaXBwZXIvZGlzdC9qcy1jYWNoZS1zdGF0dXMuanNvblxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgIGFyZSBtb2RpZmllZCBleHRlcm5hbGx5LiAgRm9yIGV4YW1wbGUgaWYgeW91IGVkaXQgYSBmaWxlIGluIGNoaXBwZXIvZGlzdC9qcyBvciBpZiB5b3UgZWRpdFxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgIGNoaXBwZXIvZGlzdC9qcy1jYWNoZS1zdGF0dXMuanNvbiwgdGhleSB3b3VsZCBiZSBvdXQgb2Ygc3luYy4gIElmIHlvdSBgcm0gLXJmIGNoaXBwZXIvZGlzdGBcclxuICogICAgICAgICAgICAgICAgICAgICAgICB0aGF0IGRvZXMgbm90IHJlcXVpcmUgLS1jbGVhbiwgYmVjYXVzZSB0aGF0IGVyYXNlcyB0aGUgY2FjaGUgZmlsZSBhbmQgdGhlIGpzIGZpbGVzIHRvZ2V0aGVyLlxyXG4gKiAtLXJlcG9zICAgICAgICAgICAgICAgIEFkZGl0aW9uYWwgcmVwb3MgdG8gY29tcGlsZSAobm90IGxpc3RlZCBpbiBwZXJlbm5pYWwtYWxpYXMvZGF0YS9hY3RpdmUtcmVwb3MpLiBUaGUgbmFtZXMgb2YgdGhlIHJlcG9zLFxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgIHNlcGFyYXRlZCBieSBjb21tYXMsIGxpa2UgLS1yZXBvcz1teXJlcG8xLG15cmVwbzIuIERpcmVjdG9yeSBuYW1lcyBvbmx5LCBub3QgcGF0aHNcclxuICogLS1za2lwTWluaWZ5V0dTTCAgICAgICBEbyBub3QgbWluaWZ5IFdHU0wgZmlsZXNcclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xyXG5jb25zdCBhcmdzID0gcHJvY2Vzcy5hcmd2LnNsaWNlKCAyICk7XHJcblxyXG4vLyBpbXBvcnRzXHJcbmNvbnN0IFRyYW5zcGlsZXIgPSByZXF1aXJlKCAnLi4vY29tbW9uL1RyYW5zcGlsZXInICk7XHJcblxyXG5jb25zdCByZXBvcyA9IFtdO1xyXG5cclxuY29uc3QgcmVwb3NLZXkgPSAnLS1yZXBvcz0nO1xyXG5hcmdzLmZpbHRlciggYXJnID0+IGFyZy5zdGFydHNXaXRoKCByZXBvc0tleSApICkuZm9yRWFjaCggYXJnID0+IHtcclxuICByZXBvcy5wdXNoKCAuLi5hcmcuc3Vic3RyaW5nKCByZXBvc0tleS5sZW5ndGggKS5zcGxpdCggJywnICkgKTtcclxufSApO1xyXG5cclxuY29uc3QgYnJhbmRzID0gW107XHJcblxyXG5jb25zdCBicmFuZHNLZXkgPSAnLS1icmFuZHM9JztcclxuYXJncy5maWx0ZXIoIGFyZyA9PiBhcmcuc3RhcnRzV2l0aCggYnJhbmRzS2V5ICkgKS5mb3JFYWNoKCBhcmcgPT4ge1xyXG4gIGJyYW5kcy5wdXNoKCAuLi5hcmcuc3Vic3RyaW5nKCBicmFuZHNLZXkubGVuZ3RoICkuc3BsaXQoICcsJyApICk7XHJcbn0gKTtcclxuXHJcbmNvbnN0IHRyYW5zcGlsZXIgPSBuZXcgVHJhbnNwaWxlcigge1xyXG4gIGNsZWFuOiBhcmdzLmluY2x1ZGVzKCAnLS1jbGVhbicgKSxcclxuICB2ZXJib3NlOiBhcmdzLmluY2x1ZGVzKCAnLS12ZXJib3NlJyApLFxyXG4gIHJlcG9zOiByZXBvcyxcclxuICBicmFuZHM6IGJyYW5kcyxcclxuICBtaW5pZnlXR1NMOiAhYXJncy5pbmNsdWRlcyggJy0tc2tpcE1pbmlmeVdHU0wnIClcclxufSApO1xyXG5cclxudHJhbnNwaWxlci5wcnVuZVN0YWxlRGlzdEZpbGVzKCAnanMnICk7XHJcbnRyYW5zcGlsZXIucHJ1bmVTdGFsZURpc3RGaWxlcyggJ2NvbW1vbmpzJyApO1xyXG5cclxuLy8gV2F0Y2ggcHJvY2Vzc1xyXG5pZiAoIGFyZ3MuaW5jbHVkZXMoICctLXdhdGNoJyApICkge1xyXG4gIHRyYW5zcGlsZXIud2F0Y2goKTtcclxufVxyXG5cclxuLy8gSW5pdGlhbCBwYXNzXHJcbnRyYW5zcGlsZXIudHJhbnNwaWxlQWxsKCk7XHJcbmNvbnNvbGUubG9nKCAnRmluaXNoZWQgaW5pdGlhbCB0cmFuc3BpbGF0aW9uIGluICcgKyAoIERhdGUubm93KCkgLSBzdGFydCApICsgJ21zJyApO1xyXG5cclxuaWYgKCBhcmdzLmluY2x1ZGVzKCAnLS13YXRjaCcgKSApIHtcclxuICBjb25zb2xlLmxvZyggJ1dhdGNoaW5nLi4uJyApO1xyXG59Il0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsSUFBTUEsS0FBSyxHQUFHQyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFDO0FBQ3hCLElBQU1DLElBQUksR0FBR0MsT0FBTyxDQUFDQyxJQUFJLENBQUNDLEtBQUssQ0FBRSxDQUFFLENBQUM7O0FBRXBDO0FBQ0EsSUFBTUMsVUFBVSxHQUFHQyxPQUFPLENBQUUsc0JBQXVCLENBQUM7QUFFcEQsSUFBTUMsS0FBSyxHQUFHLEVBQUU7QUFFaEIsSUFBTUMsUUFBUSxHQUFHLFVBQVU7QUFDM0JQLElBQUksQ0FBQ1EsTUFBTSxDQUFFLFVBQUFDLEdBQUc7RUFBQSxPQUFJQSxHQUFHLENBQUNDLFVBQVUsQ0FBRUgsUUFBUyxDQUFDO0FBQUEsQ0FBQyxDQUFDLENBQUNJLE9BQU8sQ0FBRSxVQUFBRixHQUFHLEVBQUk7RUFDL0RILEtBQUssQ0FBQ00sSUFBSSxDQUFBQyxLQUFBLENBQVZQLEtBQUssRUFBQVEsa0JBQUEsQ0FBVUwsR0FBRyxDQUFDTSxTQUFTLENBQUVSLFFBQVEsQ0FBQ1MsTUFBTyxDQUFDLENBQUNDLEtBQUssQ0FBRSxHQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ2hFLENBQUUsQ0FBQztBQUVILElBQU1DLE1BQU0sR0FBRyxFQUFFO0FBRWpCLElBQU1DLFNBQVMsR0FBRyxXQUFXO0FBQzdCbkIsSUFBSSxDQUFDUSxNQUFNLENBQUUsVUFBQUMsR0FBRztFQUFBLE9BQUlBLEdBQUcsQ0FBQ0MsVUFBVSxDQUFFUyxTQUFVLENBQUM7QUFBQSxDQUFDLENBQUMsQ0FBQ1IsT0FBTyxDQUFFLFVBQUFGLEdBQUcsRUFBSTtFQUNoRVMsTUFBTSxDQUFDTixJQUFJLENBQUFDLEtBQUEsQ0FBWEssTUFBTSxFQUFBSixrQkFBQSxDQUFVTCxHQUFHLENBQUNNLFNBQVMsQ0FBRUksU0FBUyxDQUFDSCxNQUFPLENBQUMsQ0FBQ0MsS0FBSyxDQUFFLEdBQUksQ0FBQyxDQUFDLENBQUM7QUFDbEUsQ0FBRSxDQUFDO0FBRUgsSUFBTUcsVUFBVSxHQUFHLElBQUloQixVQUFVLENBQUU7RUFDakNpQixLQUFLLEVBQUVyQixJQUFJLENBQUNzQixRQUFRLENBQUUsU0FBVSxDQUFDO0VBQ2pDQyxPQUFPLEVBQUV2QixJQUFJLENBQUNzQixRQUFRLENBQUUsV0FBWSxDQUFDO0VBQ3JDaEIsS0FBSyxFQUFFQSxLQUFLO0VBQ1pZLE1BQU0sRUFBRUEsTUFBTTtFQUNkTSxVQUFVLEVBQUUsQ0FBQ3hCLElBQUksQ0FBQ3NCLFFBQVEsQ0FBRSxrQkFBbUI7QUFDakQsQ0FBRSxDQUFDO0FBRUhGLFVBQVUsQ0FBQ0ssbUJBQW1CLENBQUUsSUFBSyxDQUFDO0FBQ3RDTCxVQUFVLENBQUNLLG1CQUFtQixDQUFFLFVBQVcsQ0FBQzs7QUFFNUM7QUFDQSxJQUFLekIsSUFBSSxDQUFDc0IsUUFBUSxDQUFFLFNBQVUsQ0FBQyxFQUFHO0VBQ2hDRixVQUFVLENBQUNNLEtBQUssQ0FBQyxDQUFDO0FBQ3BCOztBQUVBO0FBQ0FOLFVBQVUsQ0FBQ08sWUFBWSxDQUFDLENBQUM7QUFDekJDLE9BQU8sQ0FBQ0MsR0FBRyxDQUFFLG9DQUFvQyxJQUFLL0IsSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBQyxHQUFHRixLQUFLLENBQUUsR0FBRyxJQUFLLENBQUM7QUFFbkYsSUFBS0csSUFBSSxDQUFDc0IsUUFBUSxDQUFFLFNBQVUsQ0FBQyxFQUFHO0VBQ2hDTSxPQUFPLENBQUNDLEdBQUcsQ0FBRSxhQUFjLENBQUM7QUFDOUIiLCJpZ25vcmVMaXN0IjpbXX0=