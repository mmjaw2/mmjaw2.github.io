"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// Copyright 2021-2024, University of Colorado Boulder

/**
 * Compare PhET-iO APIs for two versions of the same sim. This function treats the first API as the "ground truth"
 * and compares the second API to see if it has any breaking changes against the first API. This function returns a
 * list of "problems".
 *
 * This file runs in node (command line API comparison), in the diff wrapper (client-facing API comparison) and
 * in simulations in phetioEngine when ?ea&phetioCompareAPI is specified (for CT).
 *
 * Note that even though it is a preload, it uses a different global/namespacing pattern than phet-io-initialize-globals.js
 * in order to simplify usage in all these sites.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

/**
 * @typedef API
 * @property {boolean} phetioFullAPI
 * @property {Object} phetioElements - phetioElements for version >=1.0 this will be a sparse, tree like structure with
 *                    metadata in key: `_metadata`. For version<1 this will be a flat list with phetioIDs as keys,
 *                    and values as metadata.
 * @property {Object} phetioTypes
 */

/**
 * See phetioEngine.js for where this is generated in main. Keep in mind that we support different versions, including
 * APIs that don't have a version attribute.
 * @typedef API_1_0
 * @extends API
 * @property {{major:number, minor:number}} version
 * @property {string} sim
 */
(function () {
  var METADATA_KEY_NAME = '_metadata';
  var DATA_KEY_NAME = '_data';

  // Is not the reserved keys to store data/metadata on PhET-iO Elements.
  var isChildKey = function isChildKey(key) {
    return key !== METADATA_KEY_NAME && key !== DATA_KEY_NAME;
  };

  /**
   * "up-convert" an API to be in the format of API version >=1.0. This generally is thought of as a "sparse, tree-like" API.
   * @param {API} api
   * @param _
   * @returns {API} - In this version, phetioElements will be structured as a tree, but will have a verbose and complete
   *                  set of all metadata keys for each element. There will not be `metadataDefaults` in each type.
   */
  var toStructuredTree = function toStructuredTree(api, _) {
    var sparseAPI = _.cloneDeep(api);

    // DUPLICATED with phetioEngine.js
    var sparseElements = {};
    Object.keys(api.phetioElements).forEach(function (phetioID) {
      var entry = api.phetioElements[phetioID];

      // API versions < 1.0, use a tandem separator of '.'  If we ever change this separator in main (hopefully not!)
      // this value wouldn't change since it reflects the prior committed versions which do use '.'
      var chain = phetioID.split('.');

      // Fill in each level
      var level = sparseElements;
      chain.forEach(function (componentName) {
        level[componentName] = level[componentName] || {};
        level = level[componentName];
      });
      level[METADATA_KEY_NAME] = {};
      Object.keys(entry).forEach(function (key) {
        // write all values without trying to factor out defaults
        level[METADATA_KEY_NAME][key] = entry[key];
      });
    });
    sparseAPI.phetioElements = sparseElements;
    return sparseAPI;
  };

  /**
   * @param {Object} phetioElement
   * @param {API} api
   * @param {Object} _ - lodash
   * @param {function|undefined} assert - optional assert
   * @returns {Object}
   */
  var getMetadataValues = function getMetadataValues(phetioElement, api, _, assert) {
    var ioTypeName = phetioElement[METADATA_KEY_NAME] ? phetioElement[METADATA_KEY_NAME].phetioTypeName || 'ObjectIO' : 'ObjectIO';
    if (api.version) {
      var defaults = getMetadataDefaults(ioTypeName, api, _, assert);
      return _.merge(defaults, phetioElement[METADATA_KEY_NAME]);
    } else {
      // Dense version supplies all metadata values
      return phetioElement[METADATA_KEY_NAME];
    }
  };

  /**
   * @param {string} typeName
   * @param {API} api
   * @param {Object} _ - lodash
   * @param {function|undefined} assert - optional assert
   * @returns {Object} - defensive copy, non-mutating
   */
  var getMetadataDefaults = function getMetadataDefaults(typeName, api, _, assert) {
    var entry = api.phetioTypes[typeName];
    assert && assert(entry, "entry missing: ".concat(typeName));
    if (entry.supertype) {
      return _.merge(getMetadataDefaults(entry.supertype, api, _), entry.metadataDefaults);
    } else {
      return _.merge({}, entry.metadataDefaults);
    }
  };

  /**
   * @param {API} api
   * @returns {boolean} - whether or not the API is of type API_1_0
   */
  var isOldAPIVersion = function isOldAPIVersion(api) {
    return !api.hasOwnProperty('version');
  };

  /**
   * Compare two APIs for breaking or design changes.
   *
   * NOTE: Named with an underscore to avoid automatically defining `window.phetioCompareAPIs` as a global
   *
   * @param {API} referenceAPI - the "ground truth" or reference API
   * @param {API} proposedAPI - the proposed API for comparison with referenceAPI
   * @param _ - lodash, so this can be used from different contexts.
   * @param {function|undefined} assert - so this can be used from different contexts
   * @param {Object} [options]
   * @returns {{breakingProblems:string[], designedProblems:string[]}}
   */
  var _phetioCompareAPIs = function _phetioCompareAPIs(referenceAPI, proposedAPI, _, assert, options) {
    // If the proposed version predates 1.0, then bring it forward to the structured tree with metadata under `_metadata`.
    if (isOldAPIVersion(proposedAPI)) {
      proposedAPI = toStructuredTree(proposedAPI, _);
    }
    if (isOldAPIVersion(referenceAPI)) {
      referenceAPI = toStructuredTree(referenceAPI, _);
    }
    options = _.merge({
      compareDesignedAPIChanges: true,
      compareBreakingAPIChanges: true
    }, options);
    var breakingProblems = [];
    var designedProblems = [];
    var appendProblem = function appendProblem(problemString) {
      var isDesignedProblem = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      if (isDesignedProblem && options.compareDesignedAPIChanges) {
        designedProblems.push(problemString);
      } else if (!isDesignedProblem && options.compareBreakingAPIChanges) {
        breakingProblems.push(problemString);
      }
    };

    /**
     * Visit one element along the APIs.
     * @param {string[]} trail - the path of tandem componentNames
     * @param {Object} reference - current value in the referenceAPI
     * @param {Object} proposed - current value in the proposedAPI
     * @param {boolean} isDesigned
     */
    var visit = function visit(trail, reference, proposed, isDesigned) {
      var phetioID = trail.join('.');

      // Detect an instrumented instance
      if (reference.hasOwnProperty(METADATA_KEY_NAME)) {
        // Override isDesigned, if specified
        isDesigned = isDesigned || reference[METADATA_KEY_NAME].phetioDesigned;
        var referenceCompleteMetadata = getMetadataValues(reference, referenceAPI, _, assert);
        var proposedCompleteMetadata = getMetadataValues(proposed, proposedAPI, _, assert);

        /**
         * Push any problems that may exist for the provided metadataKey.
         * @param {string} metadataKey - See PhetioObject.getMetadata()
         * @param {boolean} isDesignedChange - if the difference is from a design change, and not from a breaking change test
         * @param {*} [invalidProposedValue] - an optional new value that would signify a breaking change. Any other value would be acceptable.
         */
        var reportDifferences = function reportDifferences(metadataKey, isDesignedChange, invalidProposedValue) {
          var referenceValue = referenceCompleteMetadata[metadataKey];

          // Gracefully handle missing metadata from the <1.0 API format
          var proposedValue = proposedCompleteMetadata ? proposedCompleteMetadata[metadataKey] : {};
          if (referenceValue !== proposedValue) {
            // if proposed API is older (no version specified), ignore phetioArchetypePhetioID changed from null to undefined
            // because it used to be sparse, and in version 1.0 it became a default.
            var ignoreBrokenProposed = isOldAPIVersion(proposedAPI) && metadataKey === 'phetioArchetypePhetioID' && referenceValue === null && proposedValue === undefined;
            var ignoreBrokenReference = isOldAPIVersion(referenceAPI) && metadataKey === 'phetioArchetypePhetioID' && proposedValue === null && referenceValue === undefined;
            var ignore = ignoreBrokenProposed || ignoreBrokenReference;
            if (!ignore) {
              if (invalidProposedValue === undefined || isDesignedChange) {
                appendProblem("".concat(phetioID, ".").concat(metadataKey, " changed from \"").concat(referenceValue, "\" to \"").concat(proposedValue, "\""), isDesignedChange);
              } else if (!isDesignedChange) {
                if (proposedValue === invalidProposedValue) {
                  appendProblem("".concat(phetioID, ".").concat(metadataKey, " changed from \"").concat(referenceValue, "\" to \"").concat(proposedValue, "\""));
                } else {

                  // value changed, but it was a widening API (adding something to state, or making something read/write)
                }
              }
            }
          }
        };

        // Check for breaking changes
        reportDifferences('phetioTypeName', false);
        reportDifferences('phetioEventType', false);
        reportDifferences('phetioPlayback', false);
        reportDifferences('phetioDynamicElement', false);
        reportDifferences('phetioIsArchetype', false);
        reportDifferences('phetioArchetypePhetioID', false);
        reportDifferences('phetioState', false, false); // Only report if something became non-stateful
        reportDifferences('phetioReadOnly', false, true); // Only need to report if something became readOnly

        // The following metadata keys are non-breaking:
        // 'phetioDocumentation'
        // 'phetioFeatured'
        // 'phetioHighFrequency', non-breaking, assuming clients with data have the full data stream

        // Check for design changes
        if (isDesigned) {
          Object.keys(referenceCompleteMetadata).forEach(function (metadataKey) {
            reportDifferences(metadataKey, true);
          });
        }

        // If the reference file declares an initial state, check that it hasn't changed
        if (reference._data && reference._data.initialState) {
          // Detect missing expected state
          if (!proposed._data || !proposed._data.initialState) {
            var problemString = "".concat(phetioID, "._data.initialState is missing");

            // Missing but expected state is a breaking problem
            appendProblem(problemString, false);

            // It is also a designed problem if we expected state in a designed subtree
            isDesigned && appendProblem(problemString, true);
          } else {
            var referencesInitialState = reference._data.initialState;
            var proposedInitialState = proposed._data.initialState;
            var matches = _.isEqualWith(referencesInitialState, proposedInitialState, function (referenceState, proposedState) {
              // Top level object comparison of the entire state (not a component piece)
              if (referencesInitialState === referenceState && proposedInitialState === proposedState) {
                // The validValues of the localeProperty changes each time a new translation is submitted for a sim.
                if (phetioID === trail[0] + '.general.model.localeProperty') {
                  // The sim must have all expected locales, but it is acceptable to add new ones without API error.
                  return referenceState.validValues.every(function (validValue) {
                    return proposedState.validValues.includes(validValue);
                  });
                }

                // Ignore any pointers, because they won't occur when generating the actual api, but may if a mouse is over a testing browser.
                if (phetioID === trail[0] + '.general.controller.input') {
                  return _.isEqual(_objectSpread(_objectSpread({}, referenceState), {}, {
                    pointers: null
                  }), _objectSpread(_objectSpread({}, proposedState), {}, {
                    pointers: null
                  }));
                }

                // Ignore the scale's state, because it will be different at startup, depending on the user's window's
                // aspect ratio. TODO: Workaround for https://github.com/phetsims/density/issues/161
                if (phetioID === 'density.mysteryScreen.model.scale') {
                  return true;
                }

                // Ignore the wireMeterAttachmentPositionProperty because on it's starting position can change based on
                // the browser running the sim. TODO: Root cause is https://github.com/phetsims/phet-io/issues/1951.
                if (phetioID === 'greenhouseEffect.layerModelScreen.model.fluxMeter.wireMeterAttachmentPositionProperty' || phetioID === 'greenhouseEffect.photonsScreen.model.fluxMeter.wireMeterAttachmentPositionProperty') {
                  return true;
                }
              }

              // When comparing numbers, don't trigger an error based on floating point inaccuracies. https://github.com/phetsims/aqua/issues/200
              else if (typeof referenceState === 'number' && typeof proposedState === 'number') {
                var numberPlaces = 10;

                // toPrecision is better for larger numbers, since toFixed will result in adjusting many more sig figs than needed.
                if (referenceState > 10000) {
                  return referenceState.toPrecision(numberPlaces) === proposedState.toPrecision(numberPlaces);
                } else {
                  return referenceState.toFixed(numberPlaces) === proposedState.toFixed(numberPlaces);
                }
              }
              return undefined; // Meaning use the default lodash algorithm for comparison.
            });
            if (!matches) {
              var _problemString = "".concat(phetioID, "._data.initialState differs. \nExpected:\n").concat(JSON.stringify(reference._data.initialState), "\n actual:\n").concat(JSON.stringify(proposed._data.initialState), "\n");

              // A changed state value could break a client wrapper, so identify it with breaking changes.
              appendProblem(_problemString, false);

              // It is also a designed problem if the proposed values deviate from the specified designed values
              isDesigned && appendProblem(_problemString, true);
            }
          }
        }
      }

      // Recurse to children
      for (var componentName in reference) {
        if (reference.hasOwnProperty(componentName) && isChildKey(componentName)) {
          if (!proposed.hasOwnProperty(componentName)) {
            var _problemString2 = "PhET-iO Element missing: ".concat(phetioID, ".").concat(componentName);
            appendProblem(_problemString2, false);
            if (isDesigned) {
              appendProblem(_problemString2, true);
            }
          } else {
            visit(trail.concat(componentName), reference[componentName], proposed[componentName], isDesigned);
          }
        }
      }
      for (var _componentName in proposed) {
        if (isDesigned && proposed.hasOwnProperty(_componentName) && isChildKey(_componentName) && !reference.hasOwnProperty(_componentName)) {
          appendProblem("New PhET-iO Element not in reference: ".concat(phetioID, ".").concat(_componentName), true);
        }
      }
    };
    visit([], referenceAPI.phetioElements, proposedAPI.phetioElements, false);

    // Check for: missing IOTypes, missing methods, or differing parameter types or return types
    var _loop = function _loop(typeName) {
      if (referenceAPI.phetioTypes.hasOwnProperty(typeName)) {
        // make sure we have the desired type
        if (!proposedAPI.phetioTypes.hasOwnProperty(typeName)) {
          appendProblem("Type missing: ".concat(typeName));
        } else {
          var referenceType = referenceAPI.phetioTypes[typeName];
          var proposedType = proposedAPI.phetioTypes[typeName];

          // make sure we have all of the methods
          var referenceMethods = referenceType.methods;
          var proposedMethods = proposedType.methods;
          for (var referenceMethod in referenceMethods) {
            if (referenceMethods.hasOwnProperty(referenceMethod)) {
              if (!proposedMethods.hasOwnProperty(referenceMethod)) {
                appendProblem("Method missing, type=".concat(typeName, ", method=").concat(referenceMethod));
              } else {
                // check parameter types (exact match)
                var referenceParams = referenceMethods[referenceMethod].parameterTypes;
                var proposedParams = proposedMethods[referenceMethod].parameterTypes;
                if (referenceParams.join(',') !== proposedParams.join(',')) {
                  appendProblem("".concat(typeName, ".").concat(referenceMethod, " has different parameter types: [").concat(referenceParams.join(', '), "] => [").concat(proposedParams.join(', '), "]"));
                }
                var referenceReturnType = referenceMethods[referenceMethod].returnType;
                var proposedReturnType = proposedMethods[referenceMethod].returnType;
                if (referenceReturnType !== proposedReturnType) {
                  appendProblem("".concat(typeName, ".").concat(referenceMethod, " has a different return type ").concat(referenceReturnType, " => ").concat(proposedReturnType));
                }
              }
            }
          }

          // make sure we have all of the events (OK to add more)
          var referenceEvents = referenceType.events;
          var proposedEvents = proposedType.events;
          referenceEvents.forEach(function (event) {
            if (!proposedEvents.includes(event)) {
              appendProblem("".concat(typeName, " is missing event: ").concat(event));
            }
          });

          // make sure we have matching supertype names
          var referenceSupertypeName = referenceType.supertype;
          var proposedSupertypeName = proposedType.supertype;
          if (referenceSupertypeName !== proposedSupertypeName) {
            appendProblem("".concat(typeName, " supertype changed from \"").concat(referenceSupertypeName, "\" to \"").concat(proposedSupertypeName, "\". This may or may not \n          be a breaking change, but we are reporting it just in case."));
          }

          // make sure we have matching parameter types
          var referenceParameterTypes = referenceType.parameterTypes || [];
          var proposedParameterTypes = proposedType.parameterTypes;
          if (!_.isEqual(referenceParameterTypes, proposedParameterTypes)) {
            appendProblem("".concat(typeName, " parameter types changed from [").concat(referenceParameterTypes.join(', '), "] to [").concat(proposedParameterTypes.join(', '), "]. This may or may not \n          be a breaking change, but we are reporting it just in case."));
          }

          // This check assumes that each API will be of a version that has metadataDefaults
          if (referenceAPI.version && proposedAPI.version) {
            // Check whether the default values have changed. See https://github.com/phetsims/phet-io/issues/1753
            var referenceDefaults = referenceAPI.phetioTypes[typeName].metadataDefaults;
            var proposedDefaults = proposedAPI.phetioTypes[typeName].metadataDefaults;
            Object.keys(referenceDefaults).forEach(function (key) {
              if (referenceDefaults[key] !== proposedDefaults[key]) {
                appendProblem("".concat(typeName, " metadata value ").concat(key, " changed from \"").concat(referenceDefaults[key], "\" to \"").concat(proposedDefaults[key], "\". This may or may not be a breaking change, but we are reporting it just in case."));
              }
            });
          }
        }
      }
    };
    for (var typeName in referenceAPI.phetioTypes) {
      _loop(typeName);
    }
    return {
      breakingProblems: breakingProblems,
      designedProblems: designedProblems
    };
  };

  // @public - used to "up-convert" an old versioned API to the new (version >=1), structured tree API.
  _phetioCompareAPIs.toStructuredTree = toStructuredTree;
  if (typeof window === 'undefined') {
    // running in node
    module.exports = _phetioCompareAPIs;
  } else {
    window.phetio = window.phetio || {};
    window.phetio.phetioCompareAPIs = _phetioCompareAPIs;
  }
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNRVRBREFUQV9LRVlfTkFNRSIsIkRBVEFfS0VZX05BTUUiLCJpc0NoaWxkS2V5Iiwia2V5IiwidG9TdHJ1Y3R1cmVkVHJlZSIsImFwaSIsIl8iLCJzcGFyc2VBUEkiLCJjbG9uZURlZXAiLCJzcGFyc2VFbGVtZW50cyIsIk9iamVjdCIsImtleXMiLCJwaGV0aW9FbGVtZW50cyIsImZvckVhY2giLCJwaGV0aW9JRCIsImVudHJ5IiwiY2hhaW4iLCJzcGxpdCIsImxldmVsIiwiY29tcG9uZW50TmFtZSIsImdldE1ldGFkYXRhVmFsdWVzIiwicGhldGlvRWxlbWVudCIsImFzc2VydCIsImlvVHlwZU5hbWUiLCJwaGV0aW9UeXBlTmFtZSIsInZlcnNpb24iLCJkZWZhdWx0cyIsImdldE1ldGFkYXRhRGVmYXVsdHMiLCJtZXJnZSIsInR5cGVOYW1lIiwicGhldGlvVHlwZXMiLCJjb25jYXQiLCJzdXBlcnR5cGUiLCJtZXRhZGF0YURlZmF1bHRzIiwiaXNPbGRBUElWZXJzaW9uIiwiaGFzT3duUHJvcGVydHkiLCJfcGhldGlvQ29tcGFyZUFQSXMiLCJyZWZlcmVuY2VBUEkiLCJwcm9wb3NlZEFQSSIsIm9wdGlvbnMiLCJjb21wYXJlRGVzaWduZWRBUElDaGFuZ2VzIiwiY29tcGFyZUJyZWFraW5nQVBJQ2hhbmdlcyIsImJyZWFraW5nUHJvYmxlbXMiLCJkZXNpZ25lZFByb2JsZW1zIiwiYXBwZW5kUHJvYmxlbSIsInByb2JsZW1TdHJpbmciLCJpc0Rlc2lnbmVkUHJvYmxlbSIsImFyZ3VtZW50cyIsImxlbmd0aCIsInVuZGVmaW5lZCIsInB1c2giLCJ2aXNpdCIsInRyYWlsIiwicmVmZXJlbmNlIiwicHJvcG9zZWQiLCJpc0Rlc2lnbmVkIiwiam9pbiIsInBoZXRpb0Rlc2lnbmVkIiwicmVmZXJlbmNlQ29tcGxldGVNZXRhZGF0YSIsInByb3Bvc2VkQ29tcGxldGVNZXRhZGF0YSIsInJlcG9ydERpZmZlcmVuY2VzIiwibWV0YWRhdGFLZXkiLCJpc0Rlc2lnbmVkQ2hhbmdlIiwiaW52YWxpZFByb3Bvc2VkVmFsdWUiLCJyZWZlcmVuY2VWYWx1ZSIsInByb3Bvc2VkVmFsdWUiLCJpZ25vcmVCcm9rZW5Qcm9wb3NlZCIsImlnbm9yZUJyb2tlblJlZmVyZW5jZSIsImlnbm9yZSIsIl9kYXRhIiwiaW5pdGlhbFN0YXRlIiwicmVmZXJlbmNlc0luaXRpYWxTdGF0ZSIsInByb3Bvc2VkSW5pdGlhbFN0YXRlIiwibWF0Y2hlcyIsImlzRXF1YWxXaXRoIiwicmVmZXJlbmNlU3RhdGUiLCJwcm9wb3NlZFN0YXRlIiwidmFsaWRWYWx1ZXMiLCJldmVyeSIsInZhbGlkVmFsdWUiLCJpbmNsdWRlcyIsImlzRXF1YWwiLCJfb2JqZWN0U3ByZWFkIiwicG9pbnRlcnMiLCJudW1iZXJQbGFjZXMiLCJ0b1ByZWNpc2lvbiIsInRvRml4ZWQiLCJKU09OIiwic3RyaW5naWZ5IiwiX2xvb3AiLCJyZWZlcmVuY2VUeXBlIiwicHJvcG9zZWRUeXBlIiwicmVmZXJlbmNlTWV0aG9kcyIsIm1ldGhvZHMiLCJwcm9wb3NlZE1ldGhvZHMiLCJyZWZlcmVuY2VNZXRob2QiLCJyZWZlcmVuY2VQYXJhbXMiLCJwYXJhbWV0ZXJUeXBlcyIsInByb3Bvc2VkUGFyYW1zIiwicmVmZXJlbmNlUmV0dXJuVHlwZSIsInJldHVyblR5cGUiLCJwcm9wb3NlZFJldHVyblR5cGUiLCJyZWZlcmVuY2VFdmVudHMiLCJldmVudHMiLCJwcm9wb3NlZEV2ZW50cyIsImV2ZW50IiwicmVmZXJlbmNlU3VwZXJ0eXBlTmFtZSIsInByb3Bvc2VkU3VwZXJ0eXBlTmFtZSIsInJlZmVyZW5jZVBhcmFtZXRlclR5cGVzIiwicHJvcG9zZWRQYXJhbWV0ZXJUeXBlcyIsInJlZmVyZW5jZURlZmF1bHRzIiwicHJvcG9zZWREZWZhdWx0cyIsIndpbmRvdyIsIm1vZHVsZSIsImV4cG9ydHMiLCJwaGV0aW8iLCJwaGV0aW9Db21wYXJlQVBJcyJdLCJzb3VyY2VzIjpbInBoZXRpb0NvbXBhcmVBUElzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIENvbXBhcmUgUGhFVC1pTyBBUElzIGZvciB0d28gdmVyc2lvbnMgb2YgdGhlIHNhbWUgc2ltLiBUaGlzIGZ1bmN0aW9uIHRyZWF0cyB0aGUgZmlyc3QgQVBJIGFzIHRoZSBcImdyb3VuZCB0cnV0aFwiXHJcbiAqIGFuZCBjb21wYXJlcyB0aGUgc2Vjb25kIEFQSSB0byBzZWUgaWYgaXQgaGFzIGFueSBicmVha2luZyBjaGFuZ2VzIGFnYWluc3QgdGhlIGZpcnN0IEFQSS4gVGhpcyBmdW5jdGlvbiByZXR1cm5zIGFcclxuICogbGlzdCBvZiBcInByb2JsZW1zXCIuXHJcbiAqXHJcbiAqIFRoaXMgZmlsZSBydW5zIGluIG5vZGUgKGNvbW1hbmQgbGluZSBBUEkgY29tcGFyaXNvbiksIGluIHRoZSBkaWZmIHdyYXBwZXIgKGNsaWVudC1mYWNpbmcgQVBJIGNvbXBhcmlzb24pIGFuZFxyXG4gKiBpbiBzaW11bGF0aW9ucyBpbiBwaGV0aW9FbmdpbmUgd2hlbiA/ZWEmcGhldGlvQ29tcGFyZUFQSSBpcyBzcGVjaWZpZWQgKGZvciBDVCkuXHJcbiAqXHJcbiAqIE5vdGUgdGhhdCBldmVuIHRob3VnaCBpdCBpcyBhIHByZWxvYWQsIGl0IHVzZXMgYSBkaWZmZXJlbnQgZ2xvYmFsL25hbWVzcGFjaW5nIHBhdHRlcm4gdGhhbiBwaGV0LWlvLWluaXRpYWxpemUtZ2xvYmFscy5qc1xyXG4gKiBpbiBvcmRlciB0byBzaW1wbGlmeSB1c2FnZSBpbiBhbGwgdGhlc2Ugc2l0ZXMuXHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5cclxuLyoqXHJcbiAqIEB0eXBlZGVmIEFQSVxyXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IHBoZXRpb0Z1bGxBUElcclxuICogQHByb3BlcnR5IHtPYmplY3R9IHBoZXRpb0VsZW1lbnRzIC0gcGhldGlvRWxlbWVudHMgZm9yIHZlcnNpb24gPj0xLjAgdGhpcyB3aWxsIGJlIGEgc3BhcnNlLCB0cmVlIGxpa2Ugc3RydWN0dXJlIHdpdGhcclxuICogICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhIGluIGtleTogYF9tZXRhZGF0YWAuIEZvciB2ZXJzaW9uPDEgdGhpcyB3aWxsIGJlIGEgZmxhdCBsaXN0IHdpdGggcGhldGlvSURzIGFzIGtleXMsXHJcbiAqICAgICAgICAgICAgICAgICAgICBhbmQgdmFsdWVzIGFzIG1ldGFkYXRhLlxyXG4gKiBAcHJvcGVydHkge09iamVjdH0gcGhldGlvVHlwZXNcclxuICovXHJcblxyXG4vKipcclxuICogU2VlIHBoZXRpb0VuZ2luZS5qcyBmb3Igd2hlcmUgdGhpcyBpcyBnZW5lcmF0ZWQgaW4gbWFpbi4gS2VlcCBpbiBtaW5kIHRoYXQgd2Ugc3VwcG9ydCBkaWZmZXJlbnQgdmVyc2lvbnMsIGluY2x1ZGluZ1xyXG4gKiBBUElzIHRoYXQgZG9uJ3QgaGF2ZSBhIHZlcnNpb24gYXR0cmlidXRlLlxyXG4gKiBAdHlwZWRlZiBBUElfMV8wXHJcbiAqIEBleHRlbmRzIEFQSVxyXG4gKiBAcHJvcGVydHkge3ttYWpvcjpudW1iZXIsIG1pbm9yOm51bWJlcn19IHZlcnNpb25cclxuICogQHByb3BlcnR5IHtzdHJpbmd9IHNpbVxyXG4gKi9cclxuKCAoKSA9PiB7XHJcblxyXG4gIGNvbnN0IE1FVEFEQVRBX0tFWV9OQU1FID0gJ19tZXRhZGF0YSc7XHJcbiAgY29uc3QgREFUQV9LRVlfTkFNRSA9ICdfZGF0YSc7XHJcblxyXG4gIC8vIElzIG5vdCB0aGUgcmVzZXJ2ZWQga2V5cyB0byBzdG9yZSBkYXRhL21ldGFkYXRhIG9uIFBoRVQtaU8gRWxlbWVudHMuXHJcbiAgY29uc3QgaXNDaGlsZEtleSA9IGtleSA9PiBrZXkgIT09IE1FVEFEQVRBX0tFWV9OQU1FICYmIGtleSAhPT0gREFUQV9LRVlfTkFNRTtcclxuXHJcbiAgLyoqXHJcbiAgICogXCJ1cC1jb252ZXJ0XCIgYW4gQVBJIHRvIGJlIGluIHRoZSBmb3JtYXQgb2YgQVBJIHZlcnNpb24gPj0xLjAuIFRoaXMgZ2VuZXJhbGx5IGlzIHRob3VnaHQgb2YgYXMgYSBcInNwYXJzZSwgdHJlZS1saWtlXCIgQVBJLlxyXG4gICAqIEBwYXJhbSB7QVBJfSBhcGlcclxuICAgKiBAcGFyYW0gX1xyXG4gICAqIEByZXR1cm5zIHtBUEl9IC0gSW4gdGhpcyB2ZXJzaW9uLCBwaGV0aW9FbGVtZW50cyB3aWxsIGJlIHN0cnVjdHVyZWQgYXMgYSB0cmVlLCBidXQgd2lsbCBoYXZlIGEgdmVyYm9zZSBhbmQgY29tcGxldGVcclxuICAgKiAgICAgICAgICAgICAgICAgIHNldCBvZiBhbGwgbWV0YWRhdGEga2V5cyBmb3IgZWFjaCBlbGVtZW50LiBUaGVyZSB3aWxsIG5vdCBiZSBgbWV0YWRhdGFEZWZhdWx0c2AgaW4gZWFjaCB0eXBlLlxyXG4gICAqL1xyXG4gIGNvbnN0IHRvU3RydWN0dXJlZFRyZWUgPSAoIGFwaSwgXyApID0+IHtcclxuICAgIGNvbnN0IHNwYXJzZUFQSSA9IF8uY2xvbmVEZWVwKCBhcGkgKTtcclxuXHJcbiAgICAvLyBEVVBMSUNBVEVEIHdpdGggcGhldGlvRW5naW5lLmpzXHJcbiAgICBjb25zdCBzcGFyc2VFbGVtZW50cyA9IHt9O1xyXG4gICAgT2JqZWN0LmtleXMoIGFwaS5waGV0aW9FbGVtZW50cyApLmZvckVhY2goIHBoZXRpb0lEID0+IHtcclxuICAgICAgY29uc3QgZW50cnkgPSBhcGkucGhldGlvRWxlbWVudHNbIHBoZXRpb0lEIF07XHJcblxyXG4gICAgICAvLyBBUEkgdmVyc2lvbnMgPCAxLjAsIHVzZSBhIHRhbmRlbSBzZXBhcmF0b3Igb2YgJy4nICBJZiB3ZSBldmVyIGNoYW5nZSB0aGlzIHNlcGFyYXRvciBpbiBtYWluIChob3BlZnVsbHkgbm90ISlcclxuICAgICAgLy8gdGhpcyB2YWx1ZSB3b3VsZG4ndCBjaGFuZ2Ugc2luY2UgaXQgcmVmbGVjdHMgdGhlIHByaW9yIGNvbW1pdHRlZCB2ZXJzaW9ucyB3aGljaCBkbyB1c2UgJy4nXHJcbiAgICAgIGNvbnN0IGNoYWluID0gcGhldGlvSUQuc3BsaXQoICcuJyApO1xyXG5cclxuICAgICAgLy8gRmlsbCBpbiBlYWNoIGxldmVsXHJcbiAgICAgIGxldCBsZXZlbCA9IHNwYXJzZUVsZW1lbnRzO1xyXG4gICAgICBjaGFpbi5mb3JFYWNoKCBjb21wb25lbnROYW1lID0+IHtcclxuICAgICAgICBsZXZlbFsgY29tcG9uZW50TmFtZSBdID0gbGV2ZWxbIGNvbXBvbmVudE5hbWUgXSB8fCB7fTtcclxuICAgICAgICBsZXZlbCA9IGxldmVsWyBjb21wb25lbnROYW1lIF07XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGxldmVsWyBNRVRBREFUQV9LRVlfTkFNRSBdID0ge307XHJcblxyXG4gICAgICBPYmplY3Qua2V5cyggZW50cnkgKS5mb3JFYWNoKCBrZXkgPT4ge1xyXG5cclxuICAgICAgICAgIC8vIHdyaXRlIGFsbCB2YWx1ZXMgd2l0aG91dCB0cnlpbmcgdG8gZmFjdG9yIG91dCBkZWZhdWx0c1xyXG4gICAgICAgICAgbGV2ZWxbIE1FVEFEQVRBX0tFWV9OQU1FIF1bIGtleSBdID0gZW50cnlbIGtleSBdO1xyXG4gICAgICAgIH1cclxuICAgICAgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICBzcGFyc2VBUEkucGhldGlvRWxlbWVudHMgPSBzcGFyc2VFbGVtZW50cztcclxuICAgIHJldHVybiBzcGFyc2VBUEk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IHBoZXRpb0VsZW1lbnRcclxuICAgKiBAcGFyYW0ge0FQSX0gYXBpXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IF8gLSBsb2Rhc2hcclxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufHVuZGVmaW5lZH0gYXNzZXJ0IC0gb3B0aW9uYWwgYXNzZXJ0XHJcbiAgICogQHJldHVybnMge09iamVjdH1cclxuICAgKi9cclxuICBjb25zdCBnZXRNZXRhZGF0YVZhbHVlcyA9ICggcGhldGlvRWxlbWVudCwgYXBpLCBfLCBhc3NlcnQgKSA9PiB7XHJcbiAgICBjb25zdCBpb1R5cGVOYW1lID0gcGhldGlvRWxlbWVudFsgTUVUQURBVEFfS0VZX05BTUUgXSA/ICggcGhldGlvRWxlbWVudFsgTUVUQURBVEFfS0VZX05BTUUgXS5waGV0aW9UeXBlTmFtZSB8fCAnT2JqZWN0SU8nICkgOiAnT2JqZWN0SU8nO1xyXG5cclxuICAgIGlmICggYXBpLnZlcnNpb24gKSB7XHJcbiAgICAgIGNvbnN0IGRlZmF1bHRzID0gZ2V0TWV0YWRhdGFEZWZhdWx0cyggaW9UeXBlTmFtZSwgYXBpLCBfLCBhc3NlcnQgKTtcclxuICAgICAgcmV0dXJuIF8ubWVyZ2UoIGRlZmF1bHRzLCBwaGV0aW9FbGVtZW50WyBNRVRBREFUQV9LRVlfTkFNRSBdICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuXHJcbiAgICAgIC8vIERlbnNlIHZlcnNpb24gc3VwcGxpZXMgYWxsIG1ldGFkYXRhIHZhbHVlc1xyXG4gICAgICByZXR1cm4gcGhldGlvRWxlbWVudFsgTUVUQURBVEFfS0VZX05BTUUgXTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZU5hbWVcclxuICAgKiBAcGFyYW0ge0FQSX0gYXBpXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IF8gLSBsb2Rhc2hcclxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufHVuZGVmaW5lZH0gYXNzZXJ0IC0gb3B0aW9uYWwgYXNzZXJ0XHJcbiAgICogQHJldHVybnMge09iamVjdH0gLSBkZWZlbnNpdmUgY29weSwgbm9uLW11dGF0aW5nXHJcbiAgICovXHJcbiAgY29uc3QgZ2V0TWV0YWRhdGFEZWZhdWx0cyA9ICggdHlwZU5hbWUsIGFwaSwgXywgYXNzZXJ0ICkgPT4ge1xyXG4gICAgY29uc3QgZW50cnkgPSBhcGkucGhldGlvVHlwZXNbIHR5cGVOYW1lIF07XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBlbnRyeSwgYGVudHJ5IG1pc3Npbmc6ICR7dHlwZU5hbWV9YCApO1xyXG4gICAgaWYgKCBlbnRyeS5zdXBlcnR5cGUgKSB7XHJcbiAgICAgIHJldHVybiBfLm1lcmdlKCBnZXRNZXRhZGF0YURlZmF1bHRzKCBlbnRyeS5zdXBlcnR5cGUsIGFwaSwgXyApLCBlbnRyeS5tZXRhZGF0YURlZmF1bHRzICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIF8ubWVyZ2UoIHt9LCBlbnRyeS5tZXRhZGF0YURlZmF1bHRzICk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHtBUEl9IGFwaVxyXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIHdoZXRoZXIgb3Igbm90IHRoZSBBUEkgaXMgb2YgdHlwZSBBUElfMV8wXHJcbiAgICovXHJcbiAgY29uc3QgaXNPbGRBUElWZXJzaW9uID0gYXBpID0+IHtcclxuICAgIHJldHVybiAhYXBpLmhhc093blByb3BlcnR5KCAndmVyc2lvbicgKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBDb21wYXJlIHR3byBBUElzIGZvciBicmVha2luZyBvciBkZXNpZ24gY2hhbmdlcy5cclxuICAgKlxyXG4gICAqIE5PVEU6IE5hbWVkIHdpdGggYW4gdW5kZXJzY29yZSB0byBhdm9pZCBhdXRvbWF0aWNhbGx5IGRlZmluaW5nIGB3aW5kb3cucGhldGlvQ29tcGFyZUFQSXNgIGFzIGEgZ2xvYmFsXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0FQSX0gcmVmZXJlbmNlQVBJIC0gdGhlIFwiZ3JvdW5kIHRydXRoXCIgb3IgcmVmZXJlbmNlIEFQSVxyXG4gICAqIEBwYXJhbSB7QVBJfSBwcm9wb3NlZEFQSSAtIHRoZSBwcm9wb3NlZCBBUEkgZm9yIGNvbXBhcmlzb24gd2l0aCByZWZlcmVuY2VBUElcclxuICAgKiBAcGFyYW0gXyAtIGxvZGFzaCwgc28gdGhpcyBjYW4gYmUgdXNlZCBmcm9tIGRpZmZlcmVudCBjb250ZXh0cy5cclxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufHVuZGVmaW5lZH0gYXNzZXJ0IC0gc28gdGhpcyBjYW4gYmUgdXNlZCBmcm9tIGRpZmZlcmVudCBjb250ZXh0c1xyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cclxuICAgKiBAcmV0dXJucyB7e2JyZWFraW5nUHJvYmxlbXM6c3RyaW5nW10sIGRlc2lnbmVkUHJvYmxlbXM6c3RyaW5nW119fVxyXG4gICAqL1xyXG4gIGNvbnN0IF9waGV0aW9Db21wYXJlQVBJcyA9ICggcmVmZXJlbmNlQVBJLCBwcm9wb3NlZEFQSSwgXywgYXNzZXJ0LCBvcHRpb25zICkgPT4ge1xyXG5cclxuICAgIC8vIElmIHRoZSBwcm9wb3NlZCB2ZXJzaW9uIHByZWRhdGVzIDEuMCwgdGhlbiBicmluZyBpdCBmb3J3YXJkIHRvIHRoZSBzdHJ1Y3R1cmVkIHRyZWUgd2l0aCBtZXRhZGF0YSB1bmRlciBgX21ldGFkYXRhYC5cclxuICAgIGlmICggaXNPbGRBUElWZXJzaW9uKCBwcm9wb3NlZEFQSSApICkge1xyXG4gICAgICBwcm9wb3NlZEFQSSA9IHRvU3RydWN0dXJlZFRyZWUoIHByb3Bvc2VkQVBJLCBfICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBpc09sZEFQSVZlcnNpb24oIHJlZmVyZW5jZUFQSSApICkge1xyXG4gICAgICByZWZlcmVuY2VBUEkgPSB0b1N0cnVjdHVyZWRUcmVlKCByZWZlcmVuY2VBUEksIF8gKTtcclxuICAgIH1cclxuXHJcbiAgICBvcHRpb25zID0gXy5tZXJnZSgge1xyXG4gICAgICBjb21wYXJlRGVzaWduZWRBUElDaGFuZ2VzOiB0cnVlLFxyXG4gICAgICBjb21wYXJlQnJlYWtpbmdBUElDaGFuZ2VzOiB0cnVlXHJcbiAgICB9LCBvcHRpb25zICk7XHJcblxyXG4gICAgY29uc3QgYnJlYWtpbmdQcm9ibGVtcyA9IFtdO1xyXG4gICAgY29uc3QgZGVzaWduZWRQcm9ibGVtcyA9IFtdO1xyXG5cclxuICAgIGNvbnN0IGFwcGVuZFByb2JsZW0gPSAoIHByb2JsZW1TdHJpbmcsIGlzRGVzaWduZWRQcm9ibGVtID0gZmFsc2UgKSA9PiB7XHJcbiAgICAgIGlmICggaXNEZXNpZ25lZFByb2JsZW0gJiYgb3B0aW9ucy5jb21wYXJlRGVzaWduZWRBUElDaGFuZ2VzICkge1xyXG4gICAgICAgIGRlc2lnbmVkUHJvYmxlbXMucHVzaCggcHJvYmxlbVN0cmluZyApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCAhaXNEZXNpZ25lZFByb2JsZW0gJiYgb3B0aW9ucy5jb21wYXJlQnJlYWtpbmdBUElDaGFuZ2VzICkge1xyXG4gICAgICAgIGJyZWFraW5nUHJvYmxlbXMucHVzaCggcHJvYmxlbVN0cmluZyApO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVmlzaXQgb25lIGVsZW1lbnQgYWxvbmcgdGhlIEFQSXMuXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ1tdfSB0cmFpbCAtIHRoZSBwYXRoIG9mIHRhbmRlbSBjb21wb25lbnROYW1lc1xyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJlZmVyZW5jZSAtIGN1cnJlbnQgdmFsdWUgaW4gdGhlIHJlZmVyZW5jZUFQSVxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHByb3Bvc2VkIC0gY3VycmVudCB2YWx1ZSBpbiB0aGUgcHJvcG9zZWRBUElcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNEZXNpZ25lZFxyXG4gICAgICovXHJcbiAgICBjb25zdCB2aXNpdCA9ICggdHJhaWwsIHJlZmVyZW5jZSwgcHJvcG9zZWQsIGlzRGVzaWduZWQgKSA9PiB7XHJcbiAgICAgIGNvbnN0IHBoZXRpb0lEID0gdHJhaWwuam9pbiggJy4nICk7XHJcblxyXG4gICAgICAvLyBEZXRlY3QgYW4gaW5zdHJ1bWVudGVkIGluc3RhbmNlXHJcbiAgICAgIGlmICggcmVmZXJlbmNlLmhhc093blByb3BlcnR5KCBNRVRBREFUQV9LRVlfTkFNRSApICkge1xyXG5cclxuICAgICAgICAvLyBPdmVycmlkZSBpc0Rlc2lnbmVkLCBpZiBzcGVjaWZpZWRcclxuICAgICAgICBpc0Rlc2lnbmVkID0gaXNEZXNpZ25lZCB8fCByZWZlcmVuY2VbIE1FVEFEQVRBX0tFWV9OQU1FIF0ucGhldGlvRGVzaWduZWQ7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlZmVyZW5jZUNvbXBsZXRlTWV0YWRhdGEgPSBnZXRNZXRhZGF0YVZhbHVlcyggcmVmZXJlbmNlLCByZWZlcmVuY2VBUEksIF8sIGFzc2VydCApO1xyXG4gICAgICAgIGNvbnN0IHByb3Bvc2VkQ29tcGxldGVNZXRhZGF0YSA9IGdldE1ldGFkYXRhVmFsdWVzKCBwcm9wb3NlZCwgcHJvcG9zZWRBUEksIF8sIGFzc2VydCApO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBQdXNoIGFueSBwcm9ibGVtcyB0aGF0IG1heSBleGlzdCBmb3IgdGhlIHByb3ZpZGVkIG1ldGFkYXRhS2V5LlxyXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtZXRhZGF0YUtleSAtIFNlZSBQaGV0aW9PYmplY3QuZ2V0TWV0YWRhdGEoKVxyXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNEZXNpZ25lZENoYW5nZSAtIGlmIHRoZSBkaWZmZXJlbmNlIGlzIGZyb20gYSBkZXNpZ24gY2hhbmdlLCBhbmQgbm90IGZyb20gYSBicmVha2luZyBjaGFuZ2UgdGVzdFxyXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW2ludmFsaWRQcm9wb3NlZFZhbHVlXSAtIGFuIG9wdGlvbmFsIG5ldyB2YWx1ZSB0aGF0IHdvdWxkIHNpZ25pZnkgYSBicmVha2luZyBjaGFuZ2UuIEFueSBvdGhlciB2YWx1ZSB3b3VsZCBiZSBhY2NlcHRhYmxlLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGNvbnN0IHJlcG9ydERpZmZlcmVuY2VzID0gKCBtZXRhZGF0YUtleSwgaXNEZXNpZ25lZENoYW5nZSwgaW52YWxpZFByb3Bvc2VkVmFsdWUgKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCByZWZlcmVuY2VWYWx1ZSA9IHJlZmVyZW5jZUNvbXBsZXRlTWV0YWRhdGFbIG1ldGFkYXRhS2V5IF07XHJcblxyXG4gICAgICAgICAgLy8gR3JhY2VmdWxseSBoYW5kbGUgbWlzc2luZyBtZXRhZGF0YSBmcm9tIHRoZSA8MS4wIEFQSSBmb3JtYXRcclxuICAgICAgICAgIGNvbnN0IHByb3Bvc2VkVmFsdWUgPSBwcm9wb3NlZENvbXBsZXRlTWV0YWRhdGEgPyBwcm9wb3NlZENvbXBsZXRlTWV0YWRhdGFbIG1ldGFkYXRhS2V5IF0gOiB7fTtcclxuXHJcbiAgICAgICAgICBpZiAoIHJlZmVyZW5jZVZhbHVlICE9PSBwcm9wb3NlZFZhbHVlICkge1xyXG5cclxuICAgICAgICAgICAgLy8gaWYgcHJvcG9zZWQgQVBJIGlzIG9sZGVyIChubyB2ZXJzaW9uIHNwZWNpZmllZCksIGlnbm9yZSBwaGV0aW9BcmNoZXR5cGVQaGV0aW9JRCBjaGFuZ2VkIGZyb20gbnVsbCB0byB1bmRlZmluZWRcclxuICAgICAgICAgICAgLy8gYmVjYXVzZSBpdCB1c2VkIHRvIGJlIHNwYXJzZSwgYW5kIGluIHZlcnNpb24gMS4wIGl0IGJlY2FtZSBhIGRlZmF1bHQuXHJcbiAgICAgICAgICAgIGNvbnN0IGlnbm9yZUJyb2tlblByb3Bvc2VkID0gaXNPbGRBUElWZXJzaW9uKCBwcm9wb3NlZEFQSSApICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGFLZXkgPT09ICdwaGV0aW9BcmNoZXR5cGVQaGV0aW9JRCcgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2VWYWx1ZSA9PT0gbnVsbCAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3Bvc2VkVmFsdWUgPT09IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGlnbm9yZUJyb2tlblJlZmVyZW5jZSA9IGlzT2xkQVBJVmVyc2lvbiggcmVmZXJlbmNlQVBJICkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGFLZXkgPT09ICdwaGV0aW9BcmNoZXR5cGVQaGV0aW9JRCcgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcG9zZWRWYWx1ZSA9PT0gbnVsbCAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2VWYWx1ZSA9PT0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgaWdub3JlID0gaWdub3JlQnJva2VuUHJvcG9zZWQgfHwgaWdub3JlQnJva2VuUmVmZXJlbmNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCAhaWdub3JlICkge1xyXG5cclxuICAgICAgICAgICAgICBpZiAoIGludmFsaWRQcm9wb3NlZFZhbHVlID09PSB1bmRlZmluZWQgfHwgaXNEZXNpZ25lZENoYW5nZSApIHtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByb2JsZW0oIGAke3BoZXRpb0lEfS4ke21ldGFkYXRhS2V5fSBjaGFuZ2VkIGZyb20gXCIke3JlZmVyZW5jZVZhbHVlfVwiIHRvIFwiJHtwcm9wb3NlZFZhbHVlfVwiYCwgaXNEZXNpZ25lZENoYW5nZSApO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIGlmICggIWlzRGVzaWduZWRDaGFuZ2UgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHByb3Bvc2VkVmFsdWUgPT09IGludmFsaWRQcm9wb3NlZFZhbHVlICkge1xyXG4gICAgICAgICAgICAgICAgICBhcHBlbmRQcm9ibGVtKCBgJHtwaGV0aW9JRH0uJHttZXRhZGF0YUtleX0gY2hhbmdlZCBmcm9tIFwiJHtyZWZlcmVuY2VWYWx1ZX1cIiB0byBcIiR7cHJvcG9zZWRWYWx1ZX1cImAgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgICAgLy8gdmFsdWUgY2hhbmdlZCwgYnV0IGl0IHdhcyBhIHdpZGVuaW5nIEFQSSAoYWRkaW5nIHNvbWV0aGluZyB0byBzdGF0ZSwgb3IgbWFraW5nIHNvbWV0aGluZyByZWFkL3dyaXRlKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIENoZWNrIGZvciBicmVha2luZyBjaGFuZ2VzXHJcbiAgICAgICAgcmVwb3J0RGlmZmVyZW5jZXMoICdwaGV0aW9UeXBlTmFtZScsIGZhbHNlICk7XHJcbiAgICAgICAgcmVwb3J0RGlmZmVyZW5jZXMoICdwaGV0aW9FdmVudFR5cGUnLCBmYWxzZSApO1xyXG4gICAgICAgIHJlcG9ydERpZmZlcmVuY2VzKCAncGhldGlvUGxheWJhY2snLCBmYWxzZSApO1xyXG4gICAgICAgIHJlcG9ydERpZmZlcmVuY2VzKCAncGhldGlvRHluYW1pY0VsZW1lbnQnLCBmYWxzZSApO1xyXG4gICAgICAgIHJlcG9ydERpZmZlcmVuY2VzKCAncGhldGlvSXNBcmNoZXR5cGUnLCBmYWxzZSApO1xyXG4gICAgICAgIHJlcG9ydERpZmZlcmVuY2VzKCAncGhldGlvQXJjaGV0eXBlUGhldGlvSUQnLCBmYWxzZSApO1xyXG4gICAgICAgIHJlcG9ydERpZmZlcmVuY2VzKCAncGhldGlvU3RhdGUnLCBmYWxzZSwgZmFsc2UgKTsgLy8gT25seSByZXBvcnQgaWYgc29tZXRoaW5nIGJlY2FtZSBub24tc3RhdGVmdWxcclxuICAgICAgICByZXBvcnREaWZmZXJlbmNlcyggJ3BoZXRpb1JlYWRPbmx5JywgZmFsc2UsIHRydWUgKTsgLy8gT25seSBuZWVkIHRvIHJlcG9ydCBpZiBzb21ldGhpbmcgYmVjYW1lIHJlYWRPbmx5XHJcblxyXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgbWV0YWRhdGEga2V5cyBhcmUgbm9uLWJyZWFraW5nOlxyXG4gICAgICAgIC8vICdwaGV0aW9Eb2N1bWVudGF0aW9uJ1xyXG4gICAgICAgIC8vICdwaGV0aW9GZWF0dXJlZCdcclxuICAgICAgICAvLyAncGhldGlvSGlnaEZyZXF1ZW5jeScsIG5vbi1icmVha2luZywgYXNzdW1pbmcgY2xpZW50cyB3aXRoIGRhdGEgaGF2ZSB0aGUgZnVsbCBkYXRhIHN0cmVhbVxyXG5cclxuICAgICAgICAvLyBDaGVjayBmb3IgZGVzaWduIGNoYW5nZXNcclxuICAgICAgICBpZiAoIGlzRGVzaWduZWQgKSB7XHJcbiAgICAgICAgICBPYmplY3Qua2V5cyggcmVmZXJlbmNlQ29tcGxldGVNZXRhZGF0YSApLmZvckVhY2goIG1ldGFkYXRhS2V5ID0+IHtcclxuICAgICAgICAgICAgcmVwb3J0RGlmZmVyZW5jZXMoIG1ldGFkYXRhS2V5LCB0cnVlICk7XHJcbiAgICAgICAgICB9ICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiB0aGUgcmVmZXJlbmNlIGZpbGUgZGVjbGFyZXMgYW4gaW5pdGlhbCBzdGF0ZSwgY2hlY2sgdGhhdCBpdCBoYXNuJ3QgY2hhbmdlZFxyXG4gICAgICAgIGlmICggcmVmZXJlbmNlLl9kYXRhICYmIHJlZmVyZW5jZS5fZGF0YS5pbml0aWFsU3RhdGUgKSB7XHJcblxyXG4gICAgICAgICAgLy8gRGV0ZWN0IG1pc3NpbmcgZXhwZWN0ZWQgc3RhdGVcclxuICAgICAgICAgIGlmICggIXByb3Bvc2VkLl9kYXRhIHx8ICFwcm9wb3NlZC5fZGF0YS5pbml0aWFsU3RhdGUgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHByb2JsZW1TdHJpbmcgPSBgJHtwaGV0aW9JRH0uX2RhdGEuaW5pdGlhbFN0YXRlIGlzIG1pc3NpbmdgO1xyXG5cclxuICAgICAgICAgICAgLy8gTWlzc2luZyBidXQgZXhwZWN0ZWQgc3RhdGUgaXMgYSBicmVha2luZyBwcm9ibGVtXHJcbiAgICAgICAgICAgIGFwcGVuZFByb2JsZW0oIHByb2JsZW1TdHJpbmcsIGZhbHNlICk7XHJcblxyXG4gICAgICAgICAgICAvLyBJdCBpcyBhbHNvIGEgZGVzaWduZWQgcHJvYmxlbSBpZiB3ZSBleHBlY3RlZCBzdGF0ZSBpbiBhIGRlc2lnbmVkIHN1YnRyZWVcclxuICAgICAgICAgICAgaXNEZXNpZ25lZCAmJiBhcHBlbmRQcm9ibGVtKCBwcm9ibGVtU3RyaW5nLCB0cnVlICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHJlZmVyZW5jZXNJbml0aWFsU3RhdGUgPSByZWZlcmVuY2UuX2RhdGEuaW5pdGlhbFN0YXRlO1xyXG4gICAgICAgICAgICBjb25zdCBwcm9wb3NlZEluaXRpYWxTdGF0ZSA9IHByb3Bvc2VkLl9kYXRhLmluaXRpYWxTdGF0ZTtcclxuICAgICAgICAgICAgY29uc3QgbWF0Y2hlcyA9IF8uaXNFcXVhbFdpdGgoIHJlZmVyZW5jZXNJbml0aWFsU3RhdGUsIHByb3Bvc2VkSW5pdGlhbFN0YXRlLFxyXG4gICAgICAgICAgICAgICggcmVmZXJlbmNlU3RhdGUsIHByb3Bvc2VkU3RhdGUgKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gVG9wIGxldmVsIG9iamVjdCBjb21wYXJpc29uIG9mIHRoZSBlbnRpcmUgc3RhdGUgKG5vdCBhIGNvbXBvbmVudCBwaWVjZSlcclxuICAgICAgICAgICAgICAgIGlmICggcmVmZXJlbmNlc0luaXRpYWxTdGF0ZSA9PT0gcmVmZXJlbmNlU3RhdGUgJiYgcHJvcG9zZWRJbml0aWFsU3RhdGUgPT09IHByb3Bvc2VkU3RhdGUgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAvLyBUaGUgdmFsaWRWYWx1ZXMgb2YgdGhlIGxvY2FsZVByb3BlcnR5IGNoYW5nZXMgZWFjaCB0aW1lIGEgbmV3IHRyYW5zbGF0aW9uIGlzIHN1Ym1pdHRlZCBmb3IgYSBzaW0uXHJcbiAgICAgICAgICAgICAgICAgIGlmICggcGhldGlvSUQgPT09IHRyYWlsWyAwIF0gKyAnLmdlbmVyYWwubW9kZWwubG9jYWxlUHJvcGVydHknICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgc2ltIG11c3QgaGF2ZSBhbGwgZXhwZWN0ZWQgbG9jYWxlcywgYnV0IGl0IGlzIGFjY2VwdGFibGUgdG8gYWRkIG5ldyBvbmVzIHdpdGhvdXQgQVBJIGVycm9yLlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWZlcmVuY2VTdGF0ZS52YWxpZFZhbHVlcy5ldmVyeSggdmFsaWRWYWx1ZSA9PiBwcm9wb3NlZFN0YXRlLnZhbGlkVmFsdWVzLmluY2x1ZGVzKCB2YWxpZFZhbHVlICkgKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgLy8gSWdub3JlIGFueSBwb2ludGVycywgYmVjYXVzZSB0aGV5IHdvbid0IG9jY3VyIHdoZW4gZ2VuZXJhdGluZyB0aGUgYWN0dWFsIGFwaSwgYnV0IG1heSBpZiBhIG1vdXNlIGlzIG92ZXIgYSB0ZXN0aW5nIGJyb3dzZXIuXHJcbiAgICAgICAgICAgICAgICAgIGlmICggcGhldGlvSUQgPT09ICggdHJhaWxbIDAgXSArICcuZ2VuZXJhbC5jb250cm9sbGVyLmlucHV0JyApICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfLmlzRXF1YWwoIHsgLi4ucmVmZXJlbmNlU3RhdGUsIHBvaW50ZXJzOiBudWxsIH0sIHsgLi4ucHJvcG9zZWRTdGF0ZSwgcG9pbnRlcnM6IG51bGwgfSApO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAvLyBJZ25vcmUgdGhlIHNjYWxlJ3Mgc3RhdGUsIGJlY2F1c2UgaXQgd2lsbCBiZSBkaWZmZXJlbnQgYXQgc3RhcnR1cCwgZGVwZW5kaW5nIG9uIHRoZSB1c2VyJ3Mgd2luZG93J3NcclxuICAgICAgICAgICAgICAgICAgLy8gYXNwZWN0IHJhdGlvLiBUT0RPOiBXb3JrYXJvdW5kIGZvciBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZGVuc2l0eS9pc3N1ZXMvMTYxXHJcbiAgICAgICAgICAgICAgICAgIGlmICggcGhldGlvSUQgPT09ICdkZW5zaXR5Lm15c3RlcnlTY3JlZW4ubW9kZWwuc2NhbGUnICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAvLyBJZ25vcmUgdGhlIHdpcmVNZXRlckF0dGFjaG1lbnRQb3NpdGlvblByb3BlcnR5IGJlY2F1c2Ugb24gaXQncyBzdGFydGluZyBwb3NpdGlvbiBjYW4gY2hhbmdlIGJhc2VkIG9uXHJcbiAgICAgICAgICAgICAgICAgIC8vIHRoZSBicm93c2VyIHJ1bm5pbmcgdGhlIHNpbS4gVE9ETzogUm9vdCBjYXVzZSBpcyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvMTk1MS5cclxuICAgICAgICAgICAgICAgICAgaWYgKCBwaGV0aW9JRCA9PT0gJ2dyZWVuaG91c2VFZmZlY3QubGF5ZXJNb2RlbFNjcmVlbi5tb2RlbC5mbHV4TWV0ZXIud2lyZU1ldGVyQXR0YWNobWVudFBvc2l0aW9uUHJvcGVydHknIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgcGhldGlvSUQgPT09ICdncmVlbmhvdXNlRWZmZWN0LnBob3RvbnNTY3JlZW4ubW9kZWwuZmx1eE1ldGVyLndpcmVNZXRlckF0dGFjaG1lbnRQb3NpdGlvblByb3BlcnR5JyApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIFdoZW4gY29tcGFyaW5nIG51bWJlcnMsIGRvbid0IHRyaWdnZXIgYW4gZXJyb3IgYmFzZWQgb24gZmxvYXRpbmcgcG9pbnQgaW5hY2N1cmFjaWVzLiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYXF1YS9pc3N1ZXMvMjAwXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICggdHlwZW9mIHJlZmVyZW5jZVN0YXRlID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgcHJvcG9zZWRTdGF0ZSA9PT0gJ251bWJlcicgKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IG51bWJlclBsYWNlcyA9IDEwO1xyXG5cclxuICAgICAgICAgICAgICAgICAgLy8gdG9QcmVjaXNpb24gaXMgYmV0dGVyIGZvciBsYXJnZXIgbnVtYmVycywgc2luY2UgdG9GaXhlZCB3aWxsIHJlc3VsdCBpbiBhZGp1c3RpbmcgbWFueSBtb3JlIHNpZyBmaWdzIHRoYW4gbmVlZGVkLlxyXG4gICAgICAgICAgICAgICAgICBpZiAoIHJlZmVyZW5jZVN0YXRlID4gMTAwMDAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlZmVyZW5jZVN0YXRlLnRvUHJlY2lzaW9uKCBudW1iZXJQbGFjZXMgKSA9PT0gcHJvcG9zZWRTdGF0ZS50b1ByZWNpc2lvbiggbnVtYmVyUGxhY2VzICk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlZmVyZW5jZVN0YXRlLnRvRml4ZWQoIG51bWJlclBsYWNlcyApID09PSBwcm9wb3NlZFN0YXRlLnRvRml4ZWQoIG51bWJlclBsYWNlcyApO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDsgLy8gTWVhbmluZyB1c2UgdGhlIGRlZmF1bHQgbG9kYXNoIGFsZ29yaXRobSBmb3IgY29tcGFyaXNvbi5cclxuICAgICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICAgIGlmICggIW1hdGNoZXMgKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgcHJvYmxlbVN0cmluZyA9IGAke3BoZXRpb0lEfS5fZGF0YS5pbml0aWFsU3RhdGUgZGlmZmVycy4gXFxuRXhwZWN0ZWQ6XFxuJHtKU09OLnN0cmluZ2lmeSggcmVmZXJlbmNlLl9kYXRhLmluaXRpYWxTdGF0ZSApfVxcbiBhY3R1YWw6XFxuJHtKU09OLnN0cmluZ2lmeSggcHJvcG9zZWQuX2RhdGEuaW5pdGlhbFN0YXRlICl9XFxuYDtcclxuXHJcbiAgICAgICAgICAgICAgLy8gQSBjaGFuZ2VkIHN0YXRlIHZhbHVlIGNvdWxkIGJyZWFrIGEgY2xpZW50IHdyYXBwZXIsIHNvIGlkZW50aWZ5IGl0IHdpdGggYnJlYWtpbmcgY2hhbmdlcy5cclxuICAgICAgICAgICAgICBhcHBlbmRQcm9ibGVtKCBwcm9ibGVtU3RyaW5nLCBmYWxzZSApO1xyXG5cclxuICAgICAgICAgICAgICAvLyBJdCBpcyBhbHNvIGEgZGVzaWduZWQgcHJvYmxlbSBpZiB0aGUgcHJvcG9zZWQgdmFsdWVzIGRldmlhdGUgZnJvbSB0aGUgc3BlY2lmaWVkIGRlc2lnbmVkIHZhbHVlc1xyXG4gICAgICAgICAgICAgIGlzRGVzaWduZWQgJiYgYXBwZW5kUHJvYmxlbSggcHJvYmxlbVN0cmluZywgdHJ1ZSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBSZWN1cnNlIHRvIGNoaWxkcmVuXHJcbiAgICAgIGZvciAoIGNvbnN0IGNvbXBvbmVudE5hbWUgaW4gcmVmZXJlbmNlICkge1xyXG4gICAgICAgIGlmICggcmVmZXJlbmNlLmhhc093blByb3BlcnR5KCBjb21wb25lbnROYW1lICkgJiYgaXNDaGlsZEtleSggY29tcG9uZW50TmFtZSApICkge1xyXG5cclxuICAgICAgICAgIGlmICggIXByb3Bvc2VkLmhhc093blByb3BlcnR5KCBjb21wb25lbnROYW1lICkgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHByb2JsZW1TdHJpbmcgPSBgUGhFVC1pTyBFbGVtZW50IG1pc3Npbmc6ICR7cGhldGlvSUR9LiR7Y29tcG9uZW50TmFtZX1gO1xyXG4gICAgICAgICAgICBhcHBlbmRQcm9ibGVtKCBwcm9ibGVtU3RyaW5nLCBmYWxzZSApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBpc0Rlc2lnbmVkICkge1xyXG4gICAgICAgICAgICAgIGFwcGVuZFByb2JsZW0oIHByb2JsZW1TdHJpbmcsIHRydWUgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHZpc2l0KFxyXG4gICAgICAgICAgICAgIHRyYWlsLmNvbmNhdCggY29tcG9uZW50TmFtZSApLFxyXG4gICAgICAgICAgICAgIHJlZmVyZW5jZVsgY29tcG9uZW50TmFtZSBdLFxyXG4gICAgICAgICAgICAgIHByb3Bvc2VkWyBjb21wb25lbnROYW1lIF0sXHJcbiAgICAgICAgICAgICAgaXNEZXNpZ25lZFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgZm9yICggY29uc3QgY29tcG9uZW50TmFtZSBpbiBwcm9wb3NlZCApIHtcclxuICAgICAgICBpZiAoIGlzRGVzaWduZWQgJiYgcHJvcG9zZWQuaGFzT3duUHJvcGVydHkoIGNvbXBvbmVudE5hbWUgKSAmJiBpc0NoaWxkS2V5KCBjb21wb25lbnROYW1lICkgJiYgIXJlZmVyZW5jZS5oYXNPd25Qcm9wZXJ0eSggY29tcG9uZW50TmFtZSApICkge1xyXG4gICAgICAgICAgYXBwZW5kUHJvYmxlbSggYE5ldyBQaEVULWlPIEVsZW1lbnQgbm90IGluIHJlZmVyZW5jZTogJHtwaGV0aW9JRH0uJHtjb21wb25lbnROYW1lfWAsIHRydWUgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdmlzaXQoIFtdLCByZWZlcmVuY2VBUEkucGhldGlvRWxlbWVudHMsIHByb3Bvc2VkQVBJLnBoZXRpb0VsZW1lbnRzLCBmYWxzZSApO1xyXG5cclxuICAgIC8vIENoZWNrIGZvcjogbWlzc2luZyBJT1R5cGVzLCBtaXNzaW5nIG1ldGhvZHMsIG9yIGRpZmZlcmluZyBwYXJhbWV0ZXIgdHlwZXMgb3IgcmV0dXJuIHR5cGVzXHJcbiAgICBmb3IgKCBjb25zdCB0eXBlTmFtZSBpbiByZWZlcmVuY2VBUEkucGhldGlvVHlwZXMgKSB7XHJcbiAgICAgIGlmICggcmVmZXJlbmNlQVBJLnBoZXRpb1R5cGVzLmhhc093blByb3BlcnR5KCB0eXBlTmFtZSApICkge1xyXG5cclxuICAgICAgICAvLyBtYWtlIHN1cmUgd2UgaGF2ZSB0aGUgZGVzaXJlZCB0eXBlXHJcbiAgICAgICAgaWYgKCAhcHJvcG9zZWRBUEkucGhldGlvVHlwZXMuaGFzT3duUHJvcGVydHkoIHR5cGVOYW1lICkgKSB7XHJcbiAgICAgICAgICBhcHBlbmRQcm9ibGVtKCBgVHlwZSBtaXNzaW5nOiAke3R5cGVOYW1lfWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBjb25zdCByZWZlcmVuY2VUeXBlID0gcmVmZXJlbmNlQVBJLnBoZXRpb1R5cGVzWyB0eXBlTmFtZSBdO1xyXG4gICAgICAgICAgY29uc3QgcHJvcG9zZWRUeXBlID0gcHJvcG9zZWRBUEkucGhldGlvVHlwZXNbIHR5cGVOYW1lIF07XHJcblxyXG4gICAgICAgICAgLy8gbWFrZSBzdXJlIHdlIGhhdmUgYWxsIG9mIHRoZSBtZXRob2RzXHJcbiAgICAgICAgICBjb25zdCByZWZlcmVuY2VNZXRob2RzID0gcmVmZXJlbmNlVHlwZS5tZXRob2RzO1xyXG4gICAgICAgICAgY29uc3QgcHJvcG9zZWRNZXRob2RzID0gcHJvcG9zZWRUeXBlLm1ldGhvZHM7XHJcbiAgICAgICAgICBmb3IgKCBjb25zdCByZWZlcmVuY2VNZXRob2QgaW4gcmVmZXJlbmNlTWV0aG9kcyApIHtcclxuICAgICAgICAgICAgaWYgKCByZWZlcmVuY2VNZXRob2RzLmhhc093blByb3BlcnR5KCByZWZlcmVuY2VNZXRob2QgKSApIHtcclxuICAgICAgICAgICAgICBpZiAoICFwcm9wb3NlZE1ldGhvZHMuaGFzT3duUHJvcGVydHkoIHJlZmVyZW5jZU1ldGhvZCApICkge1xyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJvYmxlbSggYE1ldGhvZCBtaXNzaW5nLCB0eXBlPSR7dHlwZU5hbWV9LCBtZXRob2Q9JHtyZWZlcmVuY2VNZXRob2R9YCApO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBwYXJhbWV0ZXIgdHlwZXMgKGV4YWN0IG1hdGNoKVxyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVmZXJlbmNlUGFyYW1zID0gcmVmZXJlbmNlTWV0aG9kc1sgcmVmZXJlbmNlTWV0aG9kIF0ucGFyYW1ldGVyVHlwZXM7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wb3NlZFBhcmFtcyA9IHByb3Bvc2VkTWV0aG9kc1sgcmVmZXJlbmNlTWV0aG9kIF0ucGFyYW1ldGVyVHlwZXM7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCByZWZlcmVuY2VQYXJhbXMuam9pbiggJywnICkgIT09IHByb3Bvc2VkUGFyYW1zLmpvaW4oICcsJyApICkge1xyXG4gICAgICAgICAgICAgICAgICBhcHBlbmRQcm9ibGVtKCBgJHt0eXBlTmFtZX0uJHtyZWZlcmVuY2VNZXRob2R9IGhhcyBkaWZmZXJlbnQgcGFyYW1ldGVyIHR5cGVzOiBbJHtyZWZlcmVuY2VQYXJhbXMuam9pbiggJywgJyApfV0gPT4gWyR7cHJvcG9zZWRQYXJhbXMuam9pbiggJywgJyApfV1gICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVmZXJlbmNlUmV0dXJuVHlwZSA9IHJlZmVyZW5jZU1ldGhvZHNbIHJlZmVyZW5jZU1ldGhvZCBdLnJldHVyblR5cGU7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wb3NlZFJldHVyblR5cGUgPSBwcm9wb3NlZE1ldGhvZHNbIHJlZmVyZW5jZU1ldGhvZCBdLnJldHVyblR5cGU7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHJlZmVyZW5jZVJldHVyblR5cGUgIT09IHByb3Bvc2VkUmV0dXJuVHlwZSApIHtcclxuICAgICAgICAgICAgICAgICAgYXBwZW5kUHJvYmxlbSggYCR7dHlwZU5hbWV9LiR7cmVmZXJlbmNlTWV0aG9kfSBoYXMgYSBkaWZmZXJlbnQgcmV0dXJuIHR5cGUgJHtyZWZlcmVuY2VSZXR1cm5UeXBlfSA9PiAke3Byb3Bvc2VkUmV0dXJuVHlwZX1gICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gbWFrZSBzdXJlIHdlIGhhdmUgYWxsIG9mIHRoZSBldmVudHMgKE9LIHRvIGFkZCBtb3JlKVxyXG4gICAgICAgICAgY29uc3QgcmVmZXJlbmNlRXZlbnRzID0gcmVmZXJlbmNlVHlwZS5ldmVudHM7XHJcbiAgICAgICAgICBjb25zdCBwcm9wb3NlZEV2ZW50cyA9IHByb3Bvc2VkVHlwZS5ldmVudHM7XHJcbiAgICAgICAgICByZWZlcmVuY2VFdmVudHMuZm9yRWFjaCggZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICBpZiAoICFwcm9wb3NlZEV2ZW50cy5pbmNsdWRlcyggZXZlbnQgKSApIHtcclxuICAgICAgICAgICAgICBhcHBlbmRQcm9ibGVtKCBgJHt0eXBlTmFtZX0gaXMgbWlzc2luZyBldmVudDogJHtldmVudH1gICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gKTtcclxuXHJcbiAgICAgICAgICAvLyBtYWtlIHN1cmUgd2UgaGF2ZSBtYXRjaGluZyBzdXBlcnR5cGUgbmFtZXNcclxuICAgICAgICAgIGNvbnN0IHJlZmVyZW5jZVN1cGVydHlwZU5hbWUgPSByZWZlcmVuY2VUeXBlLnN1cGVydHlwZTtcclxuICAgICAgICAgIGNvbnN0IHByb3Bvc2VkU3VwZXJ0eXBlTmFtZSA9IHByb3Bvc2VkVHlwZS5zdXBlcnR5cGU7XHJcbiAgICAgICAgICBpZiAoIHJlZmVyZW5jZVN1cGVydHlwZU5hbWUgIT09IHByb3Bvc2VkU3VwZXJ0eXBlTmFtZSApIHtcclxuICAgICAgICAgICAgYXBwZW5kUHJvYmxlbSggYCR7dHlwZU5hbWV9IHN1cGVydHlwZSBjaGFuZ2VkIGZyb20gXCIke3JlZmVyZW5jZVN1cGVydHlwZU5hbWV9XCIgdG8gXCIke3Byb3Bvc2VkU3VwZXJ0eXBlTmFtZX1cIi4gVGhpcyBtYXkgb3IgbWF5IG5vdCBcclxuICAgICAgICAgIGJlIGEgYnJlYWtpbmcgY2hhbmdlLCBidXQgd2UgYXJlIHJlcG9ydGluZyBpdCBqdXN0IGluIGNhc2UuYCApO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIG1ha2Ugc3VyZSB3ZSBoYXZlIG1hdGNoaW5nIHBhcmFtZXRlciB0eXBlc1xyXG4gICAgICAgICAgY29uc3QgcmVmZXJlbmNlUGFyYW1ldGVyVHlwZXMgPSByZWZlcmVuY2VUeXBlLnBhcmFtZXRlclR5cGVzIHx8IFtdO1xyXG4gICAgICAgICAgY29uc3QgcHJvcG9zZWRQYXJhbWV0ZXJUeXBlcyA9IHByb3Bvc2VkVHlwZS5wYXJhbWV0ZXJUeXBlcztcclxuICAgICAgICAgIGlmICggIV8uaXNFcXVhbCggcmVmZXJlbmNlUGFyYW1ldGVyVHlwZXMsIHByb3Bvc2VkUGFyYW1ldGVyVHlwZXMgKSApIHtcclxuICAgICAgICAgICAgYXBwZW5kUHJvYmxlbSggYCR7dHlwZU5hbWV9IHBhcmFtZXRlciB0eXBlcyBjaGFuZ2VkIGZyb20gWyR7cmVmZXJlbmNlUGFyYW1ldGVyVHlwZXMuam9pbiggJywgJyApfV0gdG8gWyR7cHJvcG9zZWRQYXJhbWV0ZXJUeXBlcy5qb2luKCAnLCAnICl9XS4gVGhpcyBtYXkgb3IgbWF5IG5vdCBcclxuICAgICAgICAgIGJlIGEgYnJlYWtpbmcgY2hhbmdlLCBidXQgd2UgYXJlIHJlcG9ydGluZyBpdCBqdXN0IGluIGNhc2UuYCApO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFRoaXMgY2hlY2sgYXNzdW1lcyB0aGF0IGVhY2ggQVBJIHdpbGwgYmUgb2YgYSB2ZXJzaW9uIHRoYXQgaGFzIG1ldGFkYXRhRGVmYXVsdHNcclxuICAgICAgICAgIGlmICggcmVmZXJlbmNlQVBJLnZlcnNpb24gJiYgcHJvcG9zZWRBUEkudmVyc2lvbiApIHtcclxuXHJcbiAgICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlIGRlZmF1bHQgdmFsdWVzIGhhdmUgY2hhbmdlZC4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvL2lzc3Vlcy8xNzUzXHJcbiAgICAgICAgICAgIGNvbnN0IHJlZmVyZW5jZURlZmF1bHRzID0gcmVmZXJlbmNlQVBJLnBoZXRpb1R5cGVzWyB0eXBlTmFtZSBdLm1ldGFkYXRhRGVmYXVsdHM7XHJcbiAgICAgICAgICAgIGNvbnN0IHByb3Bvc2VkRGVmYXVsdHMgPSBwcm9wb3NlZEFQSS5waGV0aW9UeXBlc1sgdHlwZU5hbWUgXS5tZXRhZGF0YURlZmF1bHRzO1xyXG5cclxuICAgICAgICAgICAgT2JqZWN0LmtleXMoIHJlZmVyZW5jZURlZmF1bHRzICkuZm9yRWFjaCgga2V5ID0+IHtcclxuICAgICAgICAgICAgICBpZiAoIHJlZmVyZW5jZURlZmF1bHRzWyBrZXkgXSAhPT0gcHJvcG9zZWREZWZhdWx0c1sga2V5IF0gKSB7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcm9ibGVtKCBgJHt0eXBlTmFtZX0gbWV0YWRhdGEgdmFsdWUgJHtrZXl9IGNoYW5nZWQgZnJvbSBcIiR7cmVmZXJlbmNlRGVmYXVsdHNbIGtleSBdfVwiIHRvIFwiJHtwcm9wb3NlZERlZmF1bHRzWyBrZXkgXX1cIi4gVGhpcyBtYXkgb3IgbWF5IG5vdCBiZSBhIGJyZWFraW5nIGNoYW5nZSwgYnV0IHdlIGFyZSByZXBvcnRpbmcgaXQganVzdCBpbiBjYXNlLmAgKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBicmVha2luZ1Byb2JsZW1zOiBicmVha2luZ1Byb2JsZW1zLFxyXG4gICAgICBkZXNpZ25lZFByb2JsZW1zOiBkZXNpZ25lZFByb2JsZW1zXHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4vLyBAcHVibGljIC0gdXNlZCB0byBcInVwLWNvbnZlcnRcIiBhbiBvbGQgdmVyc2lvbmVkIEFQSSB0byB0aGUgbmV3ICh2ZXJzaW9uID49MSksIHN0cnVjdHVyZWQgdHJlZSBBUEkuXHJcbiAgX3BoZXRpb0NvbXBhcmVBUElzLnRvU3RydWN0dXJlZFRyZWUgPSB0b1N0cnVjdHVyZWRUcmVlO1xyXG5cclxuICBpZiAoIHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnICkge1xyXG5cclxuICAgIC8vIHJ1bm5pbmcgaW4gbm9kZVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBfcGhldGlvQ29tcGFyZUFQSXM7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG5cclxuICAgIHdpbmRvdy5waGV0aW8gPSB3aW5kb3cucGhldGlvIHx8IHt9O1xyXG4gICAgd2luZG93LnBoZXRpby5waGV0aW9Db21wYXJlQVBJcyA9IF9waGV0aW9Db21wYXJlQVBJcztcclxuICB9XHJcbn0gKSgpOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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