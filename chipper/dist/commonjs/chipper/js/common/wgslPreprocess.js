"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// Copyright 2023-2024, University of Colorado Boulder

/* eslint-env node */

/**
 * Preprocesses a WGSL string into a conditional form, with minification
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

var _ = require('lodash');
var path = require('path');
var importString = '#import ';
var bindingsString = '#bindings';
var ifdefString = '#ifdef ';
var ifndefString = '#ifndef ';
var elseString = '#else';
var endifString = '#endif';
var optionString = '#option ';
var importStringToName = function importStringToName(str) {
  var bits = str.split('/');
  return bits[bits.length - 1];
};
var importStringToImportName = function importStringToImportName(str) {
  var bits = str.split('/');
  return "i_".concat(bits[bits.length - 1]);
};
var Code = /*#__PURE__*/function () {
  function Code() {
    var isRoot = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    _classCallCheck(this, Code);
    this.beforeBindings = [];
    this.afterBindings = [];
    this.imports = [];
    if (isRoot) {
      this.isRoot = true;
      this.allImports = [];
      this.options = [];
    }
  }

  // @public
  return _createClass(Code, [{
    key: "hasConditionalsOrTemplates",
    value: function hasConditionalsOrTemplates() {
      return this.beforeBindings.length > 1 || this.afterBindings.length > 1 || this.beforeBindings.length === 1 && (typeof this.beforeBindings[0] !== 'string' || this.beforeBindings[0].includes('${')) || this.afterBindings.length === 1 && (typeof this.afterBindings[0] !== 'string' || this.afterBindings[0].includes('${'));
    }

    // @public
  }, {
    key: "isEmpty",
    value: function isEmpty() {
      return this.beforeBindings.length === 0 && this.afterBindings.length === 0 && this.imports.length === 0;
    }

    // @public
  }, {
    key: "finalize",
    value: function finalize(minify) {
      for (var i = 0; i < this.beforeBindings.length; i++) {
        var item = this.beforeBindings[i];
        if (typeof item === 'string') {
          this.beforeBindings[i] = minify(item);
        }
      }
      for (var _i = 0; _i < this.afterBindings.length; _i++) {
        var _item = this.afterBindings[_i];
        if (typeof _item === 'string') {
          this.afterBindings[_i] = minify(_item);
        }
      }
    }

    // @public
  }, {
    key: "toString",
    value: function toString(indent, pathToRoot, moduleName, repoName) {
      var result = '';
      if (this.isRoot) {
        result += "// Copyright ".concat(new Date().getFullYear(), ", University of Colorado Boulder\n\n");
        result += "import { u32, i32, f32, u32Hex, i32Hex, ConsoleLogger, ConsoleLoggedLine, ByteEncoder, U32Type, I32Type, Vec2uType, Vec3uType, Vec4uType, getArrayType, U32Order } from '".concat(pathToRoot, "alpenglow/js/imports.js'\n");
        result += "import { ".concat(repoName, " } from '").concat(pathToRoot).concat(repoName, "/js/imports.js'\n");
        var imports = _.uniq(this.allImports).sort();
        imports.forEach(function (importString) {
          result += "import ".concat(importStringToImportName(importString), " from '").concat(importString, ".js';\n");
        });
        result += '\n';
        result += "const ".concat(moduleName, " = ").concat(this.hasConditionalsOrTemplates() ? 'options' : '()', " => ");
      }
      var run = function run(item, before) {
        if (typeof item === 'string') {
          result += "".concat(indent).concat(before ? 'b' : 'a', " += `").concat(item, "`;\n");
        } else {
          // a Conditional
          result += item.toString(indent, pathToRoot, moduleName, repoName);
        }
      };
      if (this.isRoot) {
        if (!this.hasConditionalsOrTemplates()) {
          result += '( {\n';
          result += "".concat(indent, "before: `").concat(this.beforeBindings.join('\n'), "`,\n");
          result += "".concat(indent, "after: `").concat(this.afterBindings.join('\n'), "`,\n");
          result += "".concat(indent, "imports: [ ").concat(this.imports.map(importStringToImportName).join(', '), " ]\n");
          result += '} )';
        } else {
          result += '{\n';
          result += '  let result = {};\n'; // Might be replaced with a template function!!!
          result += '  const template = f => { result = f; return \'\'; };\n';
          _.uniq(this.allImports).sort().forEach(function (importString) {
            result += "  const ".concat(importStringToName(importString), " = ").concat(importStringToImportName(importString), "( options );\n");
          });
          var options = _.uniq(this.options).sort();
          options.forEach(function (option) {
            result += "  assert && assert( options.".concat(option, " !== undefined );\n");
            result += "  const ".concat(option, " = options.").concat(option, ";\n");
          });
          result += '  let b = \'\';\n';
          result += '  let a = \'\';\n';
          result += "  const i = [ ".concat(this.imports.map(importStringToImportName).join(', '), " ];\n");
          this.beforeBindings.forEach(function (item) {
            return run(item, true);
          });
          this.afterBindings.forEach(function (item) {
            return run(item, false);
          });
          result += '  result.before = b;\n';
          result += '  result.after = a;\n';
          result += '  result.imports = _.uniq( i ).sort();\n';
          result += '  return result;\n';
          result += '}';
        }
        result += ';\n';
        result += "export default ".concat(moduleName, ";\n");
        result += "".concat(repoName, ".register( '").concat(moduleName, "', ").concat(moduleName, " );\n");
      } else {
        if (this.imports.length) {
          result += "".concat(indent, "i.push( ").concat(this.imports.map(importStringToImportName).join(', '), " );\n");
        }
        this.beforeBindings.forEach(function (item) {
          return run(item, true);
        });
        this.afterBindings.forEach(function (item) {
          return run(item, false);
        });
      }
      return result;
    }
  }]);
}();
var Conditional = /*#__PURE__*/function () {
  function Conditional(name) {
    _classCallCheck(this, Conditional);
    this.name = name.trim();
    this.included = new Code();
    this.excluded = new Code();
    if (this.name.includes(' ')) {
      throw new Error('conditionals should not include spaces');
    }
  }

  // @public
  return _createClass(Conditional, [{
    key: "toString",
    value: function toString(indent, pathToRoot, moduleName, repoName) {
      var result = '';
      if (this.included.isEmpty() && this.excluded.isEmpty()) {
        return result;
      }
      if (this.included.isEmpty()) {
        result += "".concat(indent, "if ( !options[ ").concat(JSON.stringify(this.name), " ] ) {\n");
        result += this.excluded.toString(indent + '  ', pathToRoot, moduleName, repoName);
        result += "".concat(indent, "}\n");
      } else {
        result += "".concat(indent, "if ( options[ ").concat(JSON.stringify(this.name), " ] ) {\n");
        result += this.included.toString(indent + '  ', pathToRoot, moduleName, repoName);
        result += "".concat(indent, "}\n");
        if (!this.excluded.isEmpty()) {
          result += "".concat(indent, "else {\n");
          result += this.excluded.toString(indent + '  ', pathToRoot, moduleName, repoName);
          result += "".concat(indent, "}\n");
        }
      }
      return result;
    }
  }]);
}();
var wgslPreprocess = function wgslPreprocess(str, minify, pathToRoot, targetPath) {
  // sanity check
  str = str.replace(/\r\n/g, '\n');
  var repoName = path.basename(path.resolve(targetPath, pathToRoot));
  var moduleName = "wgsl_".concat(path.basename(targetPath).split('.')[0]);
  var lines = str.split('\n');
  var rootCode = new Code(true);
  var conditionalStack = [];
  var stack = [rootCode];
  var afterBindings = false;
  lines.forEach(function (line) {
    var topNode = stack[stack.length - 1];
    var array = afterBindings ? topNode.afterBindings : topNode.beforeBindings;
    if (line.startsWith(importString)) {
      var importName = line.substring(importString.length);
      topNode.imports.push(importName);
      rootCode.allImports.push(importName);
    } else if (line.startsWith(optionString)) {
      var optionName = line.substring(optionString.length);
      rootCode.options.push(optionName);
    } else if (line.startsWith(bindingsString)) {
      afterBindings = true;
    } else if (line.startsWith(ifdefString)) {
      var conditional = new Conditional(line.substring(ifdefString.length));
      array.push(conditional);
      conditionalStack.push(conditional);
      stack.push(conditional.included);
    } else if (line.startsWith(ifndefString)) {
      var _conditional = new Conditional(line.substring(ifndefString.length));
      array.push(_conditional);
      conditionalStack.push(_conditional);
      stack.push(_conditional.excluded);
    } else if (line.startsWith(elseString)) {
      if (conditionalStack.length === 0) {
        throw new Error('unmatched else');
      }
      var _conditional2 = conditionalStack[conditionalStack.length - 1];
      var oldCode = stack.pop();
      oldCode.finalize(minify);
      stack.push(oldCode === _conditional2.excluded ? _conditional2.included : _conditional2.excluded);
    } else if (line.startsWith(endifString)) {
      if (conditionalStack.length === 0) {
        throw new Error('unmatched endif');
      }
      conditionalStack.pop();
      stack.pop().finalize(minify);
    } else {
      if (array.length && typeof array[array.length - 1] === 'string') {
        array[array.length - 1] += '\n' + line;
      } else {
        array.push(line);
      }
    }
  });
  rootCode.finalize(minify);
  if (conditionalStack.length > 0) {
    throw new Error('unterminated conditional');
  }
  return rootCode.toString('  ', pathToRoot, moduleName, repoName);
};
module.exports = wgslPreprocess;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsInBhdGgiLCJpbXBvcnRTdHJpbmciLCJiaW5kaW5nc1N0cmluZyIsImlmZGVmU3RyaW5nIiwiaWZuZGVmU3RyaW5nIiwiZWxzZVN0cmluZyIsImVuZGlmU3RyaW5nIiwib3B0aW9uU3RyaW5nIiwiaW1wb3J0U3RyaW5nVG9OYW1lIiwic3RyIiwiYml0cyIsInNwbGl0IiwibGVuZ3RoIiwiaW1wb3J0U3RyaW5nVG9JbXBvcnROYW1lIiwiY29uY2F0IiwiQ29kZSIsImlzUm9vdCIsImFyZ3VtZW50cyIsInVuZGVmaW5lZCIsIl9jbGFzc0NhbGxDaGVjayIsImJlZm9yZUJpbmRpbmdzIiwiYWZ0ZXJCaW5kaW5ncyIsImltcG9ydHMiLCJhbGxJbXBvcnRzIiwib3B0aW9ucyIsIl9jcmVhdGVDbGFzcyIsImtleSIsInZhbHVlIiwiaGFzQ29uZGl0aW9uYWxzT3JUZW1wbGF0ZXMiLCJpbmNsdWRlcyIsImlzRW1wdHkiLCJmaW5hbGl6ZSIsIm1pbmlmeSIsImkiLCJpdGVtIiwidG9TdHJpbmciLCJpbmRlbnQiLCJwYXRoVG9Sb290IiwibW9kdWxlTmFtZSIsInJlcG9OYW1lIiwicmVzdWx0IiwiRGF0ZSIsImdldEZ1bGxZZWFyIiwidW5pcSIsInNvcnQiLCJmb3JFYWNoIiwicnVuIiwiYmVmb3JlIiwiam9pbiIsIm1hcCIsIm9wdGlvbiIsIkNvbmRpdGlvbmFsIiwibmFtZSIsInRyaW0iLCJpbmNsdWRlZCIsImV4Y2x1ZGVkIiwiRXJyb3IiLCJKU09OIiwic3RyaW5naWZ5Iiwid2dzbFByZXByb2Nlc3MiLCJ0YXJnZXRQYXRoIiwicmVwbGFjZSIsImJhc2VuYW1lIiwicmVzb2x2ZSIsImxpbmVzIiwicm9vdENvZGUiLCJjb25kaXRpb25hbFN0YWNrIiwic3RhY2siLCJsaW5lIiwidG9wTm9kZSIsImFycmF5Iiwic3RhcnRzV2l0aCIsImltcG9ydE5hbWUiLCJzdWJzdHJpbmciLCJwdXNoIiwib3B0aW9uTmFtZSIsImNvbmRpdGlvbmFsIiwib2xkQ29kZSIsInBvcCIsIm1vZHVsZSIsImV4cG9ydHMiXSwic291cmNlcyI6WyJ3Z3NsUHJlcHJvY2Vzcy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qIGVzbGludC1lbnYgbm9kZSAqL1xyXG5cclxuLyoqXHJcbiAqIFByZXByb2Nlc3NlcyBhIFdHU0wgc3RyaW5nIGludG8gYSBjb25kaXRpb25hbCBmb3JtLCB3aXRoIG1pbmlmaWNhdGlvblxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuY29uc3QgXyA9IHJlcXVpcmUoICdsb2Rhc2gnICk7XHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCAncGF0aCcgKTtcclxuXHJcbmNvbnN0IGltcG9ydFN0cmluZyA9ICcjaW1wb3J0ICc7XHJcbmNvbnN0IGJpbmRpbmdzU3RyaW5nID0gJyNiaW5kaW5ncyc7XHJcbmNvbnN0IGlmZGVmU3RyaW5nID0gJyNpZmRlZiAnO1xyXG5jb25zdCBpZm5kZWZTdHJpbmcgPSAnI2lmbmRlZiAnO1xyXG5jb25zdCBlbHNlU3RyaW5nID0gJyNlbHNlJztcclxuY29uc3QgZW5kaWZTdHJpbmcgPSAnI2VuZGlmJztcclxuY29uc3Qgb3B0aW9uU3RyaW5nID0gJyNvcHRpb24gJztcclxuXHJcbmNvbnN0IGltcG9ydFN0cmluZ1RvTmFtZSA9IHN0ciA9PiB7XHJcbiAgY29uc3QgYml0cyA9IHN0ci5zcGxpdCggJy8nICk7XHJcbiAgcmV0dXJuIGJpdHNbIGJpdHMubGVuZ3RoIC0gMSBdO1xyXG59O1xyXG5cclxuY29uc3QgaW1wb3J0U3RyaW5nVG9JbXBvcnROYW1lID0gc3RyID0+IHtcclxuICBjb25zdCBiaXRzID0gc3RyLnNwbGl0KCAnLycgKTtcclxuICByZXR1cm4gYGlfJHtiaXRzWyBiaXRzLmxlbmd0aCAtIDEgXX1gO1xyXG59O1xyXG5cclxuY2xhc3MgQ29kZSB7XHJcbiAgY29uc3RydWN0b3IoIGlzUm9vdCA9IGZhbHNlICkge1xyXG4gICAgdGhpcy5iZWZvcmVCaW5kaW5ncyA9IFtdO1xyXG4gICAgdGhpcy5hZnRlckJpbmRpbmdzID0gW107XHJcbiAgICB0aGlzLmltcG9ydHMgPSBbXTtcclxuXHJcbiAgICBpZiAoIGlzUm9vdCApIHtcclxuICAgICAgdGhpcy5pc1Jvb3QgPSB0cnVlO1xyXG4gICAgICB0aGlzLmFsbEltcG9ydHMgPSBbXTtcclxuICAgICAgdGhpcy5vcHRpb25zID0gW107XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBAcHVibGljXHJcbiAgaGFzQ29uZGl0aW9uYWxzT3JUZW1wbGF0ZXMoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5iZWZvcmVCaW5kaW5ncy5sZW5ndGggPiAxIHx8IHRoaXMuYWZ0ZXJCaW5kaW5ncy5sZW5ndGggPiAxIHx8XHJcbiAgICAgICggdGhpcy5iZWZvcmVCaW5kaW5ncy5sZW5ndGggPT09IDEgJiYgKCB0eXBlb2YgdGhpcy5iZWZvcmVCaW5kaW5nc1sgMCBdICE9PSAnc3RyaW5nJyB8fCB0aGlzLmJlZm9yZUJpbmRpbmdzWyAwIF0uaW5jbHVkZXMoICckeycgKSApICkgfHxcclxuICAgICAgKCB0aGlzLmFmdGVyQmluZGluZ3MubGVuZ3RoID09PSAxICYmICggdHlwZW9mIHRoaXMuYWZ0ZXJCaW5kaW5nc1sgMCBdICE9PSAnc3RyaW5nJyB8fCB0aGlzLmFmdGVyQmluZGluZ3NbIDAgXS5pbmNsdWRlcyggJyR7JyApICkgKTtcclxuICB9XHJcblxyXG4gIC8vIEBwdWJsaWNcclxuICBpc0VtcHR5KCkge1xyXG4gICAgcmV0dXJuIHRoaXMuYmVmb3JlQmluZGluZ3MubGVuZ3RoID09PSAwICYmIHRoaXMuYWZ0ZXJCaW5kaW5ncy5sZW5ndGggPT09IDAgJiYgdGhpcy5pbXBvcnRzLmxlbmd0aCA9PT0gMDtcclxuICB9XHJcblxyXG4gIC8vIEBwdWJsaWNcclxuICBmaW5hbGl6ZSggbWluaWZ5ICkge1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5iZWZvcmVCaW5kaW5ncy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgaXRlbSA9IHRoaXMuYmVmb3JlQmluZGluZ3NbIGkgXTtcclxuICAgICAgaWYgKCB0eXBlb2YgaXRlbSA9PT0gJ3N0cmluZycgKSB7XHJcbiAgICAgICAgdGhpcy5iZWZvcmVCaW5kaW5nc1sgaSBdID0gbWluaWZ5KCBpdGVtICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuYWZ0ZXJCaW5kaW5ncy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgaXRlbSA9IHRoaXMuYWZ0ZXJCaW5kaW5nc1sgaSBdO1xyXG4gICAgICBpZiAoIHR5cGVvZiBpdGVtID09PSAnc3RyaW5nJyApIHtcclxuICAgICAgICB0aGlzLmFmdGVyQmluZGluZ3NbIGkgXSA9IG1pbmlmeSggaXRlbSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBAcHVibGljXHJcbiAgdG9TdHJpbmcoIGluZGVudCwgcGF0aFRvUm9vdCwgbW9kdWxlTmFtZSwgcmVwb05hbWUgKSB7XHJcbiAgICBsZXQgcmVzdWx0ID0gJyc7XHJcblxyXG4gICAgaWYgKCB0aGlzLmlzUm9vdCApIHtcclxuICAgICAgcmVzdWx0ICs9IGAvLyBDb3B5cmlnaHQgJHtuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCl9LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcXG5cXG5gO1xyXG5cclxuICAgICAgcmVzdWx0ICs9IGBpbXBvcnQgeyB1MzIsIGkzMiwgZjMyLCB1MzJIZXgsIGkzMkhleCwgQ29uc29sZUxvZ2dlciwgQ29uc29sZUxvZ2dlZExpbmUsIEJ5dGVFbmNvZGVyLCBVMzJUeXBlLCBJMzJUeXBlLCBWZWMydVR5cGUsIFZlYzN1VHlwZSwgVmVjNHVUeXBlLCBnZXRBcnJheVR5cGUsIFUzMk9yZGVyIH0gZnJvbSAnJHtwYXRoVG9Sb290fWFscGVuZ2xvdy9qcy9pbXBvcnRzLmpzJ1xcbmA7XHJcbiAgICAgIHJlc3VsdCArPSBgaW1wb3J0IHsgJHtyZXBvTmFtZX0gfSBmcm9tICcke3BhdGhUb1Jvb3R9JHtyZXBvTmFtZX0vanMvaW1wb3J0cy5qcydcXG5gO1xyXG4gICAgICBjb25zdCBpbXBvcnRzID0gXy51bmlxKCB0aGlzLmFsbEltcG9ydHMgKS5zb3J0KCk7XHJcbiAgICAgIGltcG9ydHMuZm9yRWFjaCggaW1wb3J0U3RyaW5nID0+IHtcclxuICAgICAgICByZXN1bHQgKz0gYGltcG9ydCAke2ltcG9ydFN0cmluZ1RvSW1wb3J0TmFtZSggaW1wb3J0U3RyaW5nICl9IGZyb20gJyR7aW1wb3J0U3RyaW5nfS5qcyc7XFxuYDtcclxuICAgICAgfSApO1xyXG5cclxuICAgICAgcmVzdWx0ICs9ICdcXG4nO1xyXG4gICAgICByZXN1bHQgKz0gYGNvbnN0ICR7bW9kdWxlTmFtZX0gPSAke3RoaXMuaGFzQ29uZGl0aW9uYWxzT3JUZW1wbGF0ZXMoKSA/ICdvcHRpb25zJyA6ICcoKSd9ID0+IGA7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcnVuID0gKCBpdGVtLCBiZWZvcmUgKSA9PiB7XHJcbiAgICAgIGlmICggdHlwZW9mIGl0ZW0gPT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgIHJlc3VsdCArPSBgJHtpbmRlbnR9JHtiZWZvcmUgPyAnYicgOiAnYSd9ICs9IFxcYCR7aXRlbX1cXGA7XFxuYDtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICAvLyBhIENvbmRpdGlvbmFsXHJcbiAgICAgICAgcmVzdWx0ICs9IGl0ZW0udG9TdHJpbmcoIGluZGVudCwgcGF0aFRvUm9vdCwgbW9kdWxlTmFtZSwgcmVwb05hbWUgKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAoIHRoaXMuaXNSb290ICkge1xyXG4gICAgICBpZiAoICF0aGlzLmhhc0NvbmRpdGlvbmFsc09yVGVtcGxhdGVzKCkgKSB7XHJcbiAgICAgICAgcmVzdWx0ICs9ICcoIHtcXG4nO1xyXG4gICAgICAgIHJlc3VsdCArPSBgJHtpbmRlbnR9YmVmb3JlOiBcXGAke3RoaXMuYmVmb3JlQmluZGluZ3Muam9pbiggJ1xcbicgKX1cXGAsXFxuYDtcclxuICAgICAgICByZXN1bHQgKz0gYCR7aW5kZW50fWFmdGVyOiBcXGAke3RoaXMuYWZ0ZXJCaW5kaW5ncy5qb2luKCAnXFxuJyApfVxcYCxcXG5gO1xyXG4gICAgICAgIHJlc3VsdCArPSBgJHtpbmRlbnR9aW1wb3J0czogWyAke3RoaXMuaW1wb3J0cy5tYXAoIGltcG9ydFN0cmluZ1RvSW1wb3J0TmFtZSApLmpvaW4oICcsICcgKX0gXVxcbmA7XHJcbiAgICAgICAgcmVzdWx0ICs9ICd9ICknO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHJlc3VsdCArPSAne1xcbic7XHJcbiAgICAgICAgcmVzdWx0ICs9ICcgIGxldCByZXN1bHQgPSB7fTtcXG4nOyAvLyBNaWdodCBiZSByZXBsYWNlZCB3aXRoIGEgdGVtcGxhdGUgZnVuY3Rpb24hISFcclxuICAgICAgICByZXN1bHQgKz0gJyAgY29uc3QgdGVtcGxhdGUgPSBmID0+IHsgcmVzdWx0ID0gZjsgcmV0dXJuIFxcJ1xcJzsgfTtcXG4nO1xyXG5cclxuICAgICAgICBfLnVuaXEoIHRoaXMuYWxsSW1wb3J0cyApLnNvcnQoKS5mb3JFYWNoKCBpbXBvcnRTdHJpbmcgPT4ge1xyXG4gICAgICAgICAgcmVzdWx0ICs9IGAgIGNvbnN0ICR7aW1wb3J0U3RyaW5nVG9OYW1lKCBpbXBvcnRTdHJpbmcgKX0gPSAke2ltcG9ydFN0cmluZ1RvSW1wb3J0TmFtZSggaW1wb3J0U3RyaW5nICl9KCBvcHRpb25zICk7XFxuYDtcclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBfLnVuaXEoIHRoaXMub3B0aW9ucyApLnNvcnQoKTtcclxuICAgICAgICBvcHRpb25zLmZvckVhY2goIG9wdGlvbiA9PiB7XHJcbiAgICAgICAgICByZXN1bHQgKz0gYCAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy4ke29wdGlvbn0gIT09IHVuZGVmaW5lZCApO1xcbmA7XHJcbiAgICAgICAgICByZXN1bHQgKz0gYCAgY29uc3QgJHtvcHRpb259ID0gb3B0aW9ucy4ke29wdGlvbn07XFxuYDtcclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgIHJlc3VsdCArPSAnICBsZXQgYiA9IFxcJ1xcJztcXG4nO1xyXG4gICAgICAgIHJlc3VsdCArPSAnICBsZXQgYSA9IFxcJ1xcJztcXG4nO1xyXG4gICAgICAgIHJlc3VsdCArPSBgICBjb25zdCBpID0gWyAke3RoaXMuaW1wb3J0cy5tYXAoIGltcG9ydFN0cmluZ1RvSW1wb3J0TmFtZSApLmpvaW4oICcsICcgKX0gXTtcXG5gO1xyXG5cclxuICAgICAgICB0aGlzLmJlZm9yZUJpbmRpbmdzLmZvckVhY2goIGl0ZW0gPT4gcnVuKCBpdGVtLCB0cnVlICkgKTtcclxuICAgICAgICB0aGlzLmFmdGVyQmluZGluZ3MuZm9yRWFjaCggaXRlbSA9PiBydW4oIGl0ZW0sIGZhbHNlICkgKTtcclxuXHJcbiAgICAgICAgcmVzdWx0ICs9ICcgIHJlc3VsdC5iZWZvcmUgPSBiO1xcbic7XHJcbiAgICAgICAgcmVzdWx0ICs9ICcgIHJlc3VsdC5hZnRlciA9IGE7XFxuJztcclxuICAgICAgICByZXN1bHQgKz0gJyAgcmVzdWx0LmltcG9ydHMgPSBfLnVuaXEoIGkgKS5zb3J0KCk7XFxuJztcclxuICAgICAgICByZXN1bHQgKz0gJyAgcmV0dXJuIHJlc3VsdDtcXG4nO1xyXG4gICAgICAgIHJlc3VsdCArPSAnfSc7XHJcbiAgICAgIH1cclxuICAgICAgcmVzdWx0ICs9ICc7XFxuJztcclxuXHJcbiAgICAgIHJlc3VsdCArPSBgZXhwb3J0IGRlZmF1bHQgJHttb2R1bGVOYW1lfTtcXG5gO1xyXG4gICAgICByZXN1bHQgKz0gYCR7cmVwb05hbWV9LnJlZ2lzdGVyKCAnJHttb2R1bGVOYW1lfScsICR7bW9kdWxlTmFtZX0gKTtcXG5gO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGlmICggdGhpcy5pbXBvcnRzLmxlbmd0aCApIHtcclxuICAgICAgICByZXN1bHQgKz0gYCR7aW5kZW50fWkucHVzaCggJHt0aGlzLmltcG9ydHMubWFwKCBpbXBvcnRTdHJpbmdUb0ltcG9ydE5hbWUgKS5qb2luKCAnLCAnICl9ICk7XFxuYDtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLmJlZm9yZUJpbmRpbmdzLmZvckVhY2goIGl0ZW0gPT4gcnVuKCBpdGVtLCB0cnVlICkgKTtcclxuICAgICAgdGhpcy5hZnRlckJpbmRpbmdzLmZvckVhY2goIGl0ZW0gPT4gcnVuKCBpdGVtLCBmYWxzZSApICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcbn1cclxuXHJcbmNsYXNzIENvbmRpdGlvbmFsIHtcclxuICBjb25zdHJ1Y3RvciggbmFtZSApIHtcclxuICAgIHRoaXMubmFtZSA9IG5hbWUudHJpbSgpO1xyXG4gICAgdGhpcy5pbmNsdWRlZCA9IG5ldyBDb2RlKCk7XHJcbiAgICB0aGlzLmV4Y2x1ZGVkID0gbmV3IENvZGUoKTtcclxuXHJcbiAgICBpZiAoIHRoaXMubmFtZS5pbmNsdWRlcyggJyAnICkgKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggJ2NvbmRpdGlvbmFscyBzaG91bGQgbm90IGluY2x1ZGUgc3BhY2VzJyApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gQHB1YmxpY1xyXG4gIHRvU3RyaW5nKCBpbmRlbnQsIHBhdGhUb1Jvb3QsIG1vZHVsZU5hbWUsIHJlcG9OYW1lICkge1xyXG4gICAgbGV0IHJlc3VsdCA9ICcnO1xyXG5cclxuICAgIGlmICggdGhpcy5pbmNsdWRlZC5pc0VtcHR5KCkgJiYgdGhpcy5leGNsdWRlZC5pc0VtcHR5KCkgKSB7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0aGlzLmluY2x1ZGVkLmlzRW1wdHkoKSApIHtcclxuICAgICAgcmVzdWx0ICs9IGAke2luZGVudH1pZiAoICFvcHRpb25zWyAke0pTT04uc3RyaW5naWZ5KCB0aGlzLm5hbWUgKX0gXSApIHtcXG5gO1xyXG4gICAgICByZXN1bHQgKz0gdGhpcy5leGNsdWRlZC50b1N0cmluZyggaW5kZW50ICsgJyAgJywgcGF0aFRvUm9vdCwgbW9kdWxlTmFtZSwgcmVwb05hbWUgKTtcclxuICAgICAgcmVzdWx0ICs9IGAke2luZGVudH19XFxuYDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXN1bHQgKz0gYCR7aW5kZW50fWlmICggb3B0aW9uc1sgJHtKU09OLnN0cmluZ2lmeSggdGhpcy5uYW1lICl9IF0gKSB7XFxuYDtcclxuICAgICAgcmVzdWx0ICs9IHRoaXMuaW5jbHVkZWQudG9TdHJpbmcoIGluZGVudCArICcgICcsIHBhdGhUb1Jvb3QsIG1vZHVsZU5hbWUsIHJlcG9OYW1lICk7XHJcbiAgICAgIHJlc3VsdCArPSBgJHtpbmRlbnR9fVxcbmA7XHJcbiAgICAgIGlmICggIXRoaXMuZXhjbHVkZWQuaXNFbXB0eSgpICkge1xyXG4gICAgICAgIHJlc3VsdCArPSBgJHtpbmRlbnR9ZWxzZSB7XFxuYDtcclxuICAgICAgICByZXN1bHQgKz0gdGhpcy5leGNsdWRlZC50b1N0cmluZyggaW5kZW50ICsgJyAgJywgcGF0aFRvUm9vdCwgbW9kdWxlTmFtZSwgcmVwb05hbWUgKTtcclxuICAgICAgICByZXN1bHQgKz0gYCR7aW5kZW50fX1cXG5gO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IHdnc2xQcmVwcm9jZXNzID0gKCBzdHIsIG1pbmlmeSwgcGF0aFRvUm9vdCwgdGFyZ2V0UGF0aCApID0+IHtcclxuXHJcbiAgLy8gc2FuaXR5IGNoZWNrXHJcbiAgc3RyID0gc3RyLnJlcGxhY2UoIC9cXHJcXG4vZywgJ1xcbicgKTtcclxuXHJcbiAgY29uc3QgcmVwb05hbWUgPSBwYXRoLmJhc2VuYW1lKCBwYXRoLnJlc29sdmUoIHRhcmdldFBhdGgsIHBhdGhUb1Jvb3QgKSApO1xyXG4gIGNvbnN0IG1vZHVsZU5hbWUgPSBgd2dzbF8ke3BhdGguYmFzZW5hbWUoIHRhcmdldFBhdGggKS5zcGxpdCggJy4nIClbIDAgXX1gO1xyXG5cclxuICBjb25zdCBsaW5lcyA9IHN0ci5zcGxpdCggJ1xcbicgKTtcclxuXHJcbiAgY29uc3Qgcm9vdENvZGUgPSBuZXcgQ29kZSggdHJ1ZSApO1xyXG4gIGNvbnN0IGNvbmRpdGlvbmFsU3RhY2sgPSBbXTtcclxuICBjb25zdCBzdGFjayA9IFsgcm9vdENvZGUgXTtcclxuXHJcbiAgbGV0IGFmdGVyQmluZGluZ3MgPSBmYWxzZTtcclxuXHJcbiAgbGluZXMuZm9yRWFjaCggbGluZSA9PiB7XHJcbiAgICBjb25zdCB0b3BOb2RlID0gc3RhY2tbIHN0YWNrLmxlbmd0aCAtIDEgXTtcclxuICAgIGNvbnN0IGFycmF5ID0gYWZ0ZXJCaW5kaW5ncyA/IHRvcE5vZGUuYWZ0ZXJCaW5kaW5ncyA6IHRvcE5vZGUuYmVmb3JlQmluZGluZ3M7XHJcblxyXG4gICAgaWYgKCBsaW5lLnN0YXJ0c1dpdGgoIGltcG9ydFN0cmluZyApICkge1xyXG4gICAgICBjb25zdCBpbXBvcnROYW1lID0gbGluZS5zdWJzdHJpbmcoIGltcG9ydFN0cmluZy5sZW5ndGggKTtcclxuICAgICAgdG9wTm9kZS5pbXBvcnRzLnB1c2goIGltcG9ydE5hbWUgKTtcclxuICAgICAgcm9vdENvZGUuYWxsSW1wb3J0cy5wdXNoKCBpbXBvcnROYW1lICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggbGluZS5zdGFydHNXaXRoKCBvcHRpb25TdHJpbmcgKSApIHtcclxuICAgICAgY29uc3Qgb3B0aW9uTmFtZSA9IGxpbmUuc3Vic3RyaW5nKCBvcHRpb25TdHJpbmcubGVuZ3RoICk7XHJcbiAgICAgIHJvb3RDb2RlLm9wdGlvbnMucHVzaCggb3B0aW9uTmFtZSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGxpbmUuc3RhcnRzV2l0aCggYmluZGluZ3NTdHJpbmcgKSApIHtcclxuICAgICAgYWZ0ZXJCaW5kaW5ncyA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggbGluZS5zdGFydHNXaXRoKCBpZmRlZlN0cmluZyApICkge1xyXG4gICAgICBjb25zdCBjb25kaXRpb25hbCA9IG5ldyBDb25kaXRpb25hbCggbGluZS5zdWJzdHJpbmcoIGlmZGVmU3RyaW5nLmxlbmd0aCApICk7XHJcbiAgICAgIGFycmF5LnB1c2goIGNvbmRpdGlvbmFsICk7XHJcbiAgICAgIGNvbmRpdGlvbmFsU3RhY2sucHVzaCggY29uZGl0aW9uYWwgKTtcclxuICAgICAgc3RhY2sucHVzaCggY29uZGl0aW9uYWwuaW5jbHVkZWQgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBsaW5lLnN0YXJ0c1dpdGgoIGlmbmRlZlN0cmluZyApICkge1xyXG4gICAgICBjb25zdCBjb25kaXRpb25hbCA9IG5ldyBDb25kaXRpb25hbCggbGluZS5zdWJzdHJpbmcoIGlmbmRlZlN0cmluZy5sZW5ndGggKSApO1xyXG4gICAgICBhcnJheS5wdXNoKCBjb25kaXRpb25hbCApO1xyXG4gICAgICBjb25kaXRpb25hbFN0YWNrLnB1c2goIGNvbmRpdGlvbmFsICk7XHJcbiAgICAgIHN0YWNrLnB1c2goIGNvbmRpdGlvbmFsLmV4Y2x1ZGVkICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggbGluZS5zdGFydHNXaXRoKCBlbHNlU3RyaW5nICkgKSB7XHJcbiAgICAgIGlmICggY29uZGl0aW9uYWxTdGFjay5sZW5ndGggPT09IDAgKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAndW5tYXRjaGVkIGVsc2UnICk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgY29uZGl0aW9uYWwgPSBjb25kaXRpb25hbFN0YWNrWyBjb25kaXRpb25hbFN0YWNrLmxlbmd0aCAtIDEgXTtcclxuICAgICAgY29uc3Qgb2xkQ29kZSA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICBvbGRDb2RlLmZpbmFsaXplKCBtaW5pZnkgKTtcclxuICAgICAgc3RhY2sucHVzaCggb2xkQ29kZSA9PT0gY29uZGl0aW9uYWwuZXhjbHVkZWQgPyBjb25kaXRpb25hbC5pbmNsdWRlZCA6IGNvbmRpdGlvbmFsLmV4Y2x1ZGVkICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggbGluZS5zdGFydHNXaXRoKCBlbmRpZlN0cmluZyApICkge1xyXG4gICAgICBpZiAoIGNvbmRpdGlvbmFsU3RhY2subGVuZ3RoID09PSAwICkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvciggJ3VubWF0Y2hlZCBlbmRpZicgKTtcclxuICAgICAgfVxyXG4gICAgICBjb25kaXRpb25hbFN0YWNrLnBvcCgpO1xyXG4gICAgICBzdGFjay5wb3AoKS5maW5hbGl6ZSggbWluaWZ5ICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgaWYgKCBhcnJheS5sZW5ndGggJiYgdHlwZW9mIGFycmF5WyBhcnJheS5sZW5ndGggLSAxIF0gPT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgIGFycmF5WyBhcnJheS5sZW5ndGggLSAxIF0gKz0gJ1xcbicgKyBsaW5lO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGFycmF5LnB1c2goIGxpbmUgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0gKTtcclxuXHJcbiAgcm9vdENvZGUuZmluYWxpemUoIG1pbmlmeSApO1xyXG5cclxuICBpZiAoIGNvbmRpdGlvbmFsU3RhY2subGVuZ3RoID4gMCApIHtcclxuICAgIHRocm93IG5ldyBFcnJvciggJ3VudGVybWluYXRlZCBjb25kaXRpb25hbCcgKTtcclxuICB9XHJcblxyXG4gIHJldHVybiByb290Q29kZS50b1N0cmluZyggJyAgJywgcGF0aFRvUm9vdCwgbW9kdWxlTmFtZSwgcmVw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QixDQUFDO01BQ3JDO01BQ0EsSUFBTW9CLGFBQVcsR0FBR1YsZ0JBQWdCLENBQUVBLGdCQUFnQixDQUFDdEQsTUFBTSxHQUFHLENBQUMsQ0FBRTtNQUNuRSxJQUFNaUUsT0FBTyxHQUFHVixLQUFLLENBQUNXLEdBQUcsQ0FBQyxDQUFDO01BQzNCRCxPQUFPLENBQUM5QyxRQUFRLENBQUVDLE1BQU8sQ0FBQztNQUMxQm1DLEtBQUssQ0FBQ08sSUFBSSxDQUFFRyxPQUFPLEtBQUtELGFBQVcsQ0FBQ3JCLFFBQVEsR0FBR3FCLGFBQVcsQ0FBQ3RCLFFBQVEsR0FBR3NCLGFBQVcsQ0FBQ3JCLFFBQVMsQ0FBQztJQUM5RixDQUFDLE1BQ0ksSUFBS2EsSUFBSSxDQUFDRyxVQUFVLENBQUVqRSxXQUFZLENBQUMsRUFBRztNQUN6QyxJQUFLNEQsZ0JBQWdCLENBQUN0RCxNQUFNLEtBQUssQ0FBQyxFQUFHO1FBQ25DLE1BQU0sSUFBSTRDLEtBQUssQ0FBRSxpQkFBa0IsQ0FBQztNQUN0QztNQUNBVSxnQkFBZ0IsQ0FBQ1ksR0FBRyxDQUFDLENBQUM7TUFDdEJYLEtBQUssQ0FBQ1csR0FBRyxDQUFDLENBQUMsQ0FBQy9DLFFBQVEsQ0FBRUMsTUFBTyxDQUFDO0lBQ2hDLENBQUMsTUFDSTtNQUNILElBQUtzQyxLQUFLLENBQUMxRCxNQUFNLElBQUksT0FBTzBELEtBQUssQ0FBRUEsS0FBSyxDQUFDMUQsTUFBTSxHQUFHLENBQUMsQ0FBRSxLQUFLLFFBQVEsRUFBRztRQUNuRTBELEtBQUssQ0FBRUEsS0FBSyxDQUFDMUQsTUFBTSxHQUFHLENBQUMsQ0FBRSxJQUFJLElBQUksR0FBR3dELElBQUk7TUFDMUMsQ0FBQyxNQUNJO1FBQ0hFLEtBQUssQ0FBQ0ksSUFBSSxDQUFFTixJQUFLLENBQUM7TUFDcEI7SUFDRjtFQUNGLENBQUUsQ0FBQztFQUVISCxRQUFRLENBQUNsQyxRQUFRLENBQUVDLE1BQU8sQ0FBQztFQUUzQixJQUFLa0MsZ0JBQWdCLENBQUN0RCxNQUFNLEdBQUcsQ0FBQyxFQUFHO0lBQ2pDLE1BQU0sSUFBSTRDLEtBQUssQ0FBRSwwQkFBMkIsQ0FBQztFQUMvQztFQUVBLE9BQU9TLFFBQVEsQ0FBQzlCLFFBQVEsQ0FBRSxJQUFJLEVBQUVFLFVBQVUsRUFBRUMsVUFBVSxFQUFFQyxRQUFTLENBQUM7QUFDcEUsQ0FBQztBQUVEd0MsTUFBTSxDQUFDQyxPQUFPLEdBQUdyQixjQUFjIiwiaWdub3JlTGlzdCI6W119