"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _phetCore = _interopRequireDefault(require("../phetCore.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } // Copyright 2018-2024, University of Colorado Boulder
/**
 * Tracks object allocations for reporting using binder.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
function registerImplementation(instance, key, map) {
  instance.toDataURL(function (dataURL) {
    map[key].push(dataURL);
  });
}
var InstanceRegistry = /*#__PURE__*/function () {
  function InstanceRegistry() {
    _classCallCheck(this, InstanceRegistry);
  }
  return _createClass(InstanceRegistry, null, [{
    key: "registerDataURL",
    value:
    /**
     * Adds a screenshot of the given scenery Node
     */
    function registerDataURL(repoName, typeName, instance) {
      if (phet.chipper.queryParameters.binder) {
        // Create the map if we haven't seen that component type before
        var key = "".concat(repoName, "/").concat(typeName);
        InstanceRegistry.componentMap[key] = InstanceRegistry.componentMap[key] || [];
        try {
          if (instance.boundsProperty.value.isFinite()) {
            registerImplementation(instance, key, InstanceRegistry.componentMap);
          } else {
            var boundsListener = function boundsListener(bounds) {
              if (bounds.isFinite()) {
                registerImplementation(instance, key, InstanceRegistry.componentMap);
                instance.boundsProperty.unlink(boundsListener); // less for memory, and more to not double add
              }
            };
            instance.boundsProperty.lazyLink(boundsListener);
          }
        } catch (e) {

          // Ignore nodes that don't draw anything
          // TODO https://github.com/phetsims/phet-core/issues/80 is this masking a problem?
        }
      }
    }

    /**
     * Register a toolbox pattern node. There is no strict class for this, so this factored out method can be used by any constructor
     */
  }, {
    key: "registerToolbox",
    value: function registerToolbox(instance) {
      if (phet.chipper.queryParameters.binder) {
        InstanceRegistry.registerDataURL('sun', 'ToolboxPattern', instance);
      }
    }
  }]);
}();
// Per named component, store image URIs of what their usages look like
_defineProperty(InstanceRegistry, "componentMap", {});
_phetCore["default"].register('InstanceRegistry', InstanceRegistry);
var _default = exports["default"] = InstanceRegistry;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcGhldENvcmUiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJfdHlwZW9mIiwibyIsIlN5bWJvbCIsIml0ZXJhdG9yIiwiY29uc3RydWN0b3IiLCJwcm90b3R5cGUiLCJfY2xhc3NDYWxsQ2hlY2siLCJpbnN0YW5jZSIsIkNvbnN0cnVjdG9yIiwiVHlwZUVycm9yIiwiX2RlZmluZVByb3BlcnRpZXMiLCJ0YXJnZXQiLCJwcm9wcyIsImkiLCJsZW5ndGgiLCJkZXNjcmlwdG9yIiwiZW51bWVyYWJsZSIsImNvbmZpZ3VyYWJsZSIsIndyaXRhYmxlIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJfdG9Qcm9wZXJ0eUtleSIsImtleSIsIl9jcmVhdGVDbGFzcyIsInByb3RvUHJvcHMiLCJzdGF0aWNQcm9wcyIsIl9kZWZpbmVQcm9wZXJ0eSIsInZhbHVlIiwidCIsIl90b1ByaW1pdGl2ZSIsInIiLCJlIiwidG9QcmltaXRpdmUiLCJjYWxsIiwiU3RyaW5nIiwiTnVtYmVyIiwicmVnaXN0ZXJJbXBsZW1lbnRhdGlvbiIsIm1hcCIsInRvRGF0YVVSTCIsImRhdGFVUkwiLCJwdXNoIiwiSW5zdGFuY2VSZWdpc3RyeSIsInJlZ2lzdGVyRGF0YVVSTCIsInJlcG9OYW1lIiwidHlwZU5hbWUiLCJwaGV0IiwiY2hpcHBlciIsInF1ZXJ5UGFyYW1ldGVycyIsImJpbmRlciIsImNvbmNhdCIsImNvbXBvbmVudE1hcCIsImJvdW5kc1Byb3BlcnR5IiwiaXNGaW5pdGUiLCJib3VuZHNMaXN0ZW5lciIsImJvdW5kcyIsInVubGluayIsImxhenlMaW5rIiwicmVnaXN0ZXJUb29sYm94IiwicGhldENvcmUiLCJyZWdpc3RlciIsIl9kZWZhdWx0IiwiZXhwb3J0cyJdLCJzb3VyY2VzIjpbIkluc3RhbmNlUmVnaXN0cnkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVHJhY2tzIG9iamVjdCBhbGxvY2F0aW9ucyBmb3IgcmVwb3J0aW5nIHVzaW5nIGJpbmRlci5cclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBwaGV0Q29yZSBmcm9tICcuLi9waGV0Q29yZS5qcyc7XHJcbmltcG9ydCBCb3VuZHMyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9Cb3VuZHMyLmpzJztcclxuaW1wb3J0IFRSZWFkT25seVByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5cclxudHlwZSBOb2RlTGlrZSA9IHtcclxuICB0b0RhdGFVUkw6ICggY2FsbGJhY2s6ICggZGF0YTogc3RyaW5nICkgPT4gdm9pZCApID0+IHZvaWQ7XHJcbiAgYm91bmRzUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PEJvdW5kczI+O1xyXG59O1xyXG5cclxudHlwZSBDb21wb25lbnRNYXAgPSBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT47XHJcblxyXG5mdW5jdGlvbiByZWdpc3RlckltcGxlbWVudGF0aW9uKCBpbnN0YW5jZTogTm9kZUxpa2UsIGtleTogc3RyaW5nLCBtYXA6IENvbXBvbmVudE1hcCApOiB2b2lkIHtcclxuICBpbnN0YW5jZS50b0RhdGFVUkwoIGRhdGFVUkwgPT4ge1xyXG4gICAgbWFwWyBrZXkgXS5wdXNoKCBkYXRhVVJMICk7XHJcbiAgfSApO1xyXG59XHJcblxyXG5jbGFzcyBJbnN0YW5jZVJlZ2lzdHJ5IHtcclxuXHJcbiAgLy8gUGVyIG5hbWVkIGNvbXBvbmVudCwgc3RvcmUgaW1hZ2UgVVJJcyBvZiB3aGF0IHRoZWlyIHVzYWdlcyBsb29rIGxpa2VcclxuICBwdWJsaWMgc3RhdGljIGNvbXBvbmVudE1hcDogQ29tcG9uZW50TWFwID0ge307XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYSBzY3JlZW5zaG90IG9mIHRoZSBnaXZlbiBzY2VuZXJ5IE5vZGVcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJlZ2lzdGVyRGF0YVVSTCggcmVwb05hbWU6IHN0cmluZywgdHlwZU5hbWU6IHN0cmluZywgaW5zdGFuY2U6IE5vZGVMaWtlICk6IHZvaWQge1xyXG4gICAgaWYgKCBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmJpbmRlciApIHtcclxuXHJcbiAgICAgIC8vIENyZWF0ZSB0aGUgbWFwIGlmIHdlIGhhdmVuJ3Qgc2VlbiB0aGF0IGNvbXBvbmVudCB0eXBlIGJlZm9yZVxyXG4gICAgICBjb25zdCBrZXkgPSBgJHtyZXBvTmFtZX0vJHt0eXBlTmFtZX1gO1xyXG4gICAgICBJbnN0YW5jZVJlZ2lzdHJ5LmNvbXBvbmVudE1hcFsga2V5IF0gPSBJbnN0YW5jZVJlZ2lzdHJ5LmNvbXBvbmVudE1hcFsga2V5IF0gfHwgW107XHJcblxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGlmICggaW5zdGFuY2UuYm91bmRzUHJvcGVydHkudmFsdWUuaXNGaW5pdGUoKSApIHtcclxuICAgICAgICAgIHJlZ2lzdGVySW1wbGVtZW50YXRpb24oIGluc3RhbmNlLCBrZXksIEluc3RhbmNlUmVnaXN0cnkuY29tcG9uZW50TWFwICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgY29uc3QgYm91bmRzTGlzdGVuZXIgPSAoIGJvdW5kczogQm91bmRzMiApID0+IHtcclxuICAgICAgICAgICAgaWYgKCBib3VuZHMuaXNGaW5pdGUoKSApIHtcclxuICAgICAgICAgICAgICByZWdpc3RlckltcGxlbWVudGF0aW9uKCBpbnN0YW5jZSwga2V5LCBJbnN0YW5jZVJlZ2lzdHJ5LmNvbXBvbmVudE1hcCApO1xyXG4gICAgICAgICAgICAgIGluc3RhbmNlLmJvdW5kc1Byb3BlcnR5LnVubGluayggYm91bmRzTGlzdGVuZXIgKTsgLy8gbGVzcyBmb3IgbWVtb3J5LCBhbmQgbW9yZSB0byBub3QgZG91YmxlIGFkZFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgaW5zdGFuY2UuYm91bmRzUHJvcGVydHkubGF6eUxpbmsoIGJvdW5kc0xpc3RlbmVyICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGNhdGNoKCBlICkge1xyXG5cclxuICAgICAgICAvLyBJZ25vcmUgbm9kZXMgdGhhdCBkb24ndCBkcmF3IGFueXRoaW5nXHJcbiAgICAgICAgLy8gVE9ETyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1jb3JlL2lzc3Vlcy84MCBpcyB0aGlzIG1hc2tpbmcgYSBwcm9ibGVtP1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWdpc3RlciBhIHRvb2xib3ggcGF0dGVybiBub2RlLiBUaGVyZSBpcyBubyBzdHJpY3QgY2xhc3MgZm9yIHRoaXMsIHNvIHRoaXMgZmFjdG9yZWQgb3V0IG1ldGhvZCBjYW4gYmUgdXNlZCBieSBhbnkgY29uc3RydWN0b3JcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJlZ2lzdGVyVG9vbGJveCggaW5zdGFuY2U6IE5vZGVMaWtlICk6IHZvaWQge1xyXG4gICAgaWYgKCBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmJpbmRlciApIHtcclxuICAgICAgSW5zdGFuY2VSZWdpc3RyeS5yZWdpc3RlckRhdGFVUkwoICdzdW4nLCAnVG9vbGJveFBhdHRlcm4nLCBpbnN0YW5jZSApO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxucGhldENvcmUucmVnaXN0ZXIoICdJbnN0YW5jZVJlZ2lzdHJ5JywgSW5zdGFuY2VSZWdpc3RyeSApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgSW5zdGFuY2VSZWdpc3RyeTsiXSwibWFwcGlu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