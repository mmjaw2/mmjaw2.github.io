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
(() => {
  const METADATA_KEY_NAME = '_metadata';
  const DATA_KEY_NAME = '_data';

  // Is not the reserved keys to store data/metadata on PhET-iO Elements.
  const isChildKey = key => key !== METADATA_KEY_NAME && key !== DATA_KEY_NAME;

  /**
   * "up-convert" an API to be in the format of API version >=1.0. This generally is thought of as a "sparse, tree-like" API.
   * @param {API} api
   * @param _
   * @returns {API} - In this version, phetioElements will be structured as a tree, but will have a verbose and complete
   *                  set of all metadata keys for each element. There will not be `metadataDefaults` in each type.
   */
  const toStructuredTree = (api, _) => {
    const sparseAPI = _.cloneDeep(api);

    // DUPLICATED with phetioEngine.js
    const sparseElements = {};
    Object.keys(api.phetioElements).forEach(phetioID => {
      const entry = api.phetioElements[phetioID];

      // API versions < 1.0, use a tandem separator of '.'  If we ever change this separator in main (hopefully not!)
      // this value wouldn't change since it reflects the prior committed versions which do use '.'
      const chain = phetioID.split('.');

      // Fill in each level
      let level = sparseElements;
      chain.forEach(componentName => {
        level[componentName] = level[componentName] || {};
        level = level[componentName];
      });
      level[METADATA_KEY_NAME] = {};
      Object.keys(entry).forEach(key => {
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
  const getMetadataValues = (phetioElement, api, _, assert) => {
    const ioTypeName = phetioElement[METADATA_KEY_NAME] ? phetioElement[METADATA_KEY_NAME].phetioTypeName || 'ObjectIO' : 'ObjectIO';
    if (api.version) {
      const defaults = getMetadataDefaults(ioTypeName, api, _, assert);
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
  const getMetadataDefaults = (typeName, api, _, assert) => {
    const entry = api.phetioTypes[typeName];
    assert && assert(entry, `entry missing: ${typeName}`);
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
  const isOldAPIVersion = api => {
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
  const _phetioCompareAPIs = (referenceAPI, proposedAPI, _, assert, options) => {
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
    const breakingProblems = [];
    const designedProblems = [];
    const appendProblem = (problemString, isDesignedProblem = false) => {
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
    const visit = (trail, reference, proposed, isDesigned) => {
      const phetioID = trail.join('.');

      // Detect an instrumented instance
      if (reference.hasOwnProperty(METADATA_KEY_NAME)) {
        // Override isDesigned, if specified
        isDesigned = isDesigned || reference[METADATA_KEY_NAME].phetioDesigned;
        const referenceCompleteMetadata = getMetadataValues(reference, referenceAPI, _, assert);
        const proposedCompleteMetadata = getMetadataValues(proposed, proposedAPI, _, assert);

        /**
         * Push any problems that may exist for the provided metadataKey.
         * @param {string} metadataKey - See PhetioObject.getMetadata()
         * @param {boolean} isDesignedChange - if the difference is from a design change, and not from a breaking change test
         * @param {*} [invalidProposedValue] - an optional new value that would signify a breaking change. Any other value would be acceptable.
         */
        const reportDifferences = (metadataKey, isDesignedChange, invalidProposedValue) => {
          const referenceValue = referenceCompleteMetadata[metadataKey];

          // Gracefully handle missing metadata from the <1.0 API format
          const proposedValue = proposedCompleteMetadata ? proposedCompleteMetadata[metadataKey] : {};
          if (referenceValue !== proposedValue) {
            // if proposed API is older (no version specified), ignore phetioArchetypePhetioID changed from null to undefined
            // because it used to be sparse, and in version 1.0 it became a default.
            const ignoreBrokenProposed = isOldAPIVersion(proposedAPI) && metadataKey === 'phetioArchetypePhetioID' && referenceValue === null && proposedValue === undefined;
            const ignoreBrokenReference = isOldAPIVersion(referenceAPI) && metadataKey === 'phetioArchetypePhetioID' && proposedValue === null && referenceValue === undefined;
            const ignore = ignoreBrokenProposed || ignoreBrokenReference;
            if (!ignore) {
              if (invalidProposedValue === undefined || isDesignedChange) {
                appendProblem(`${phetioID}.${metadataKey} changed from "${referenceValue}" to "${proposedValue}"`, isDesignedChange);
              } else if (!isDesignedChange) {
                if (proposedValue === invalidProposedValue) {
                  appendProblem(`${phetioID}.${metadataKey} changed from "${referenceValue}" to "${proposedValue}"`);
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
          Object.keys(referenceCompleteMetadata).forEach(metadataKey => {
            reportDifferences(metadataKey, true);
          });
        }

        // If the reference file declares an initial state, check that it hasn't changed
        if (reference._data && reference._data.initialState) {
          // Detect missing expected state
          if (!proposed._data || !proposed._data.initialState) {
            const problemString = `${phetioID}._data.initialState is missing`;

            // Missing but expected state is a breaking problem
            appendProblem(problemString, false);

            // It is also a designed problem if we expected state in a designed subtree
            isDesigned && appendProblem(problemString, true);
          } else {
            const referencesInitialState = reference._data.initialState;
            const proposedInitialState = proposed._data.initialState;
            const matches = _.isEqualWith(referencesInitialState, proposedInitialState, (referenceState, proposedState) => {
              // Top level object comparison of the entire state (not a component piece)
              if (referencesInitialState === referenceState && proposedInitialState === proposedState) {
                // The validValues of the localeProperty changes each time a new translation is submitted for a sim.
                if (phetioID === trail[0] + '.general.model.localeProperty') {
                  // The sim must have all expected locales, but it is acceptable to add new ones without API error.
                  return referenceState.validValues.every(validValue => proposedState.validValues.includes(validValue));
                }

                // Ignore any pointers, because they won't occur when generating the actual api, but may if a mouse is over a testing browser.
                if (phetioID === trail[0] + '.general.controller.input') {
                  return _.isEqual({
                    ...referenceState,
                    pointers: null
                  }, {
                    ...proposedState,
                    pointers: null
                  });
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
                const numberPlaces = 10;

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
              const problemString = `${phetioID}._data.initialState differs. \nExpected:\n${JSON.stringify(reference._data.initialState)}\n actual:\n${JSON.stringify(proposed._data.initialState)}\n`;

              // A changed state value could break a client wrapper, so identify it with breaking changes.
              appendProblem(problemString, false);

              // It is also a designed problem if the proposed values deviate from the specified designed values
              isDesigned && appendProblem(problemString, true);
            }
          }
        }
      }

      // Recurse to children
      for (const componentName in reference) {
        if (reference.hasOwnProperty(componentName) && isChildKey(componentName)) {
          if (!proposed.hasOwnProperty(componentName)) {
            const problemString = `PhET-iO Element missing: ${phetioID}.${componentName}`;
            appendProblem(problemString, false);
            if (isDesigned) {
              appendProblem(problemString, true);
            }
          } else {
            visit(trail.concat(componentName), reference[componentName], proposed[componentName], isDesigned);
          }
        }
      }
      for (const componentName in proposed) {
        if (isDesigned && proposed.hasOwnProperty(componentName) && isChildKey(componentName) && !reference.hasOwnProperty(componentName)) {
          appendProblem(`New PhET-iO Element not in reference: ${phetioID}.${componentName}`, true);
        }
      }
    };
    visit([], referenceAPI.phetioElements, proposedAPI.phetioElements, false);

    // Check for: missing IOTypes, missing methods, or differing parameter types or return types
    for (const typeName in referenceAPI.phetioTypes) {
      if (referenceAPI.phetioTypes.hasOwnProperty(typeName)) {
        // make sure we have the desired type
        if (!proposedAPI.phetioTypes.hasOwnProperty(typeName)) {
          appendProblem(`Type missing: ${typeName}`);
        } else {
          const referenceType = referenceAPI.phetioTypes[typeName];
          const proposedType = proposedAPI.phetioTypes[typeName];

          // make sure we have all of the methods
          const referenceMethods = referenceType.methods;
          const proposedMethods = proposedType.methods;
          for (const referenceMethod in referenceMethods) {
            if (referenceMethods.hasOwnProperty(referenceMethod)) {
              if (!proposedMethods.hasOwnProperty(referenceMethod)) {
                appendProblem(`Method missing, type=${typeName}, method=${referenceMethod}`);
              } else {
                // check parameter types (exact match)
                const referenceParams = referenceMethods[referenceMethod].parameterTypes;
                const proposedParams = proposedMethods[referenceMethod].parameterTypes;
                if (referenceParams.join(',') !== proposedParams.join(',')) {
                  appendProblem(`${typeName}.${referenceMethod} has different parameter types: [${referenceParams.join(', ')}] => [${proposedParams.join(', ')}]`);
                }
                const referenceReturnType = referenceMethods[referenceMethod].returnType;
                const proposedReturnType = proposedMethods[referenceMethod].returnType;
                if (referenceReturnType !== proposedReturnType) {
                  appendProblem(`${typeName}.${referenceMethod} has a different return type ${referenceReturnType} => ${proposedReturnType}`);
                }
              }
            }
          }

          // make sure we have all of the events (OK to add more)
          const referenceEvents = referenceType.events;
          const proposedEvents = proposedType.events;
          referenceEvents.forEach(event => {
            if (!proposedEvents.includes(event)) {
              appendProblem(`${typeName} is missing event: ${event}`);
            }
          });

          // make sure we have matching supertype names
          const referenceSupertypeName = referenceType.supertype;
          const proposedSupertypeName = proposedType.supertype;
          if (referenceSupertypeName !== proposedSupertypeName) {
            appendProblem(`${typeName} supertype changed from "${referenceSupertypeName}" to "${proposedSupertypeName}". This may or may not 
          be a breaking change, but we are reporting it just in case.`);
          }

          // make sure we have matching parameter types
          const referenceParameterTypes = referenceType.parameterTypes || [];
          const proposedParameterTypes = proposedType.parameterTypes;
          if (!_.isEqual(referenceParameterTypes, proposedParameterTypes)) {
            appendProblem(`${typeName} parameter types changed from [${referenceParameterTypes.join(', ')}] to [${proposedParameterTypes.join(', ')}]. This may or may not 
          be a breaking change, but we are reporting it just in case.`);
          }

          // This check assumes that each API will be of a version that has metadataDefaults
          if (referenceAPI.version && proposedAPI.version) {
            // Check whether the default values have changed. See https://github.com/phetsims/phet-io/issues/1753
            const referenceDefaults = referenceAPI.phetioTypes[typeName].metadataDefaults;
            const proposedDefaults = proposedAPI.phetioTypes[typeName].metadataDefaults;
            Object.keys(referenceDefaults).forEach(key => {
              if (referenceDefaults[key] !== proposedDefaults[key]) {
                appendProblem(`${typeName} metadata value ${key} changed from "${referenceDefaults[key]}" to "${proposedDefaults[key]}". This may or may not be a breaking change, but we are reporting it just in case.`);
              }
            });
          }
        }
      }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNRVRBREFUQV9LRVlfTkFNRSIsIkRBVEFfS0VZX05BTUUiLCJpc0NoaWxkS2V5Iiwia2V5IiwidG9TdHJ1Y3R1cmVkVHJlZSIsImFwaSIsIl8iLCJzcGFyc2VBUEkiLCJjbG9uZURlZXAiLCJzcGFyc2VFbGVtZW50cyIsIk9iamVjdCIsImtleXMiLCJwaGV0aW9FbGVtZW50cyIsImZvckVhY2giLCJwaGV0aW9JRCIsImVudHJ5IiwiY2hhaW4iLCJzcGxpdCIsImxldmVsIiwiY29tcG9uZW50TmFtZSIsImdldE1ldGFkYXRhVmFsdWVzIiwicGhldGlvRWxlbWVudCIsImFzc2VydCIsImlvVHlwZU5hbWUiLCJwaGV0aW9UeXBlTmFtZSIsInZlcnNpb24iLCJkZWZhdWx0cyIsImdldE1ldGFkYXRhRGVmYXVsdHMiLCJtZXJnZSIsInR5cGVOYW1lIiwicGhldGlvVHlwZXMiLCJzdXBlcnR5cGUiLCJtZXRhZGF0YURlZmF1bHRzIiwiaXNPbGRBUElWZXJzaW9uIiwiaGFzT3duUHJvcGVydHkiLCJfcGhldGlvQ29tcGFyZUFQSXMiLCJyZWZlcmVuY2VBUEkiLCJwcm9wb3NlZEFQSSIsIm9wdGlvbnMiLCJjb21wYXJlRGVzaWduZWRBUElDaGFuZ2VzIiwiY29tcGFyZUJyZWFraW5nQVBJQ2hhbmdlcyIsImJyZWFraW5nUHJvYmxlbXMiLCJkZXNpZ25lZFByb2JsZW1zIiwiYXBwZW5kUHJvYmxlbSIsInByb2JsZW1TdHJpbmciLCJpc0Rlc2lnbmVkUHJvYmxlbSIsInB1c2giLCJ2aXNpdCIsInRyYWlsIiwicmVmZXJlbmNlIiwicHJvcG9zZWQiLCJpc0Rlc2lnbmVkIiwiam9pbiIsInBoZXRpb0Rlc2lnbmVkIiwicmVmZXJlbmNlQ29tcGxldGVNZXRhZGF0YSIsInByb3Bvc2VkQ29tcGxldGVNZXRhZGF0YSIsInJlcG9ydERpZmZlcmVuY2VzIiwibWV0YWRhdGFLZXkiLCJpc0Rlc2lnbmVkQ2hhbmdlIiwiaW52YWxpZFByb3Bvc2VkVmFsdWUiLCJyZWZlcmVuY2VWYWx1ZSIsInByb3Bvc2VkVmFsdWUiLCJpZ25vcmVCcm9rZW5Qcm9wb3NlZCIsInVuZGVmaW5lZCIsImlnbm9yZUJyb2tlblJlZmVyZW5jZSIsImlnbm9yZSIsIl9kYXRhIiwiaW5pdGlhbFN0YXRlIiwicmVmZXJlbmNlc0luaXRpYWxTdGF0ZSIsInByb3Bvc2VkSW5pdGlhbFN0YXRlIiwibWF0Y2hlcyIsImlzRXF1YWxXaXRoIiwicmVmZXJlbmNlU3RhdGUiLCJwcm9wb3NlZFN0YXRlIiwidmFsaWRWYWx1ZXMiLCJldmVyeSIsInZhbGlkVmFsdWUiLCJpbmNsdWRlcyIsImlzRXF1YWwiLCJwb2ludGVycyIsIm51bWJlclBsYWNlcyIsInRvUHJlY2lzaW9uIiwidG9GaXhlZCIsIkpTT04iLCJzdHJpbmdpZnkiLCJjb25jYXQiLCJyZWZlcmVuY2VUeXBlIiwicHJvcG9zZWRUeXBlIiwicmVmZXJlbmNlTWV0aG9kcyIsIm1ldGhvZHMiLCJwcm9wb3NlZE1ldGhvZHMiLCJyZWZlcmVuY2VNZXRob2QiLCJyZWZlcmVuY2VQYXJhbXMiLCJwYXJhbWV0ZXJUeXBlcyIsInByb3Bvc2VkUGFyYW1zIiwicmVmZXJlbmNlUmV0dXJuVHlwZSIsInJldHVyblR5cGUiLCJwcm9wb3NlZFJldHVyblR5cGUiLCJyZWZlcmVuY2VFdmVudHMiLCJldmVudHMiLCJwcm9wb3NlZEV2ZW50cyIsImV2ZW50IiwicmVmZXJlbmNlU3VwZXJ0eXBlTmFtZSIsInByb3Bvc2VkU3VwZXJ0eXBlTmFtZSIsInJlZmVyZW5jZVBhcmFtZXRlclR5cGVzIiwicHJvcG9zZWRQYXJhbWV0ZXJUeXBlcyIsInJlZmVyZW5jZURlZmF1bHRzIiwicHJvcG9zZWREZWZhdWx0cyIsIndpbmRvdyIsIm1vZHVsZSIsImV4cG9ydHMiLCJwaGV0aW8iLCJwaGV0aW9Db21wYXJlQVBJcyJdLCJzb3VyY2VzIjpbInBoZXRpb0NvbXBhcmVBUElzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIENvbXBhcmUgUGhFVC1pTyBBUElzIGZvciB0d28gdmVyc2lvbnMgb2YgdGhlIHNhbWUgc2ltLiBUaGlzIGZ1bmN0aW9uIHRyZWF0cyB0aGUgZmlyc3QgQVBJIGFzIHRoZSBcImdyb3VuZCB0cnV0aFwiXHJcbiAqIGFuZCBjb21wYXJlcyB0aGUgc2Vjb25kIEFQSSB0byBzZWUgaWYgaXQgaGFzIGFueSBicmVha2luZyBjaGFuZ2VzIGFnYWluc3QgdGhlIGZpcnN0IEFQSS4gVGhpcyBmdW5jdGlvbiByZXR1cm5zIGFcclxuICogbGlzdCBvZiBcInByb2JsZW1zXCIuXHJcbiAqXHJcbiAqIFRoaXMgZmlsZSBydW5zIGluIG5vZGUgKGNvbW1hbmQgbGluZSBBUEkgY29tcGFyaXNvbiksIGluIHRoZSBkaWZmIHdyYXBwZXIgKGNsaWVudC1mYWNpbmcgQVBJIGNvbXBhcmlzb24pIGFuZFxyXG4gKiBpbiBzaW11bGF0aW9ucyBpbiBwaGV0aW9FbmdpbmUgd2hlbiA/ZWEmcGhldGlvQ29tcGFyZUFQSSBpcyBzcGVjaWZpZWQgKGZvciBDVCkuXHJcbiAqXHJcbiAqIE5vdGUgdGhhdCBldmVuIHRob3VnaCBpdCBpcyBhIHByZWxvYWQsIGl0IHVzZXMgYSBkaWZmZXJlbnQgZ2xvYmFsL25hbWVzcGFjaW5nIHBhdHRlcm4gdGhhbiBwaGV0LWlvLWluaXRpYWxpemUtZ2xvYmFscy5qc1xyXG4gKiBpbiBvcmRlciB0byBzaW1wbGlmeSB1c2FnZSBpbiBhbGwgdGhlc2Ugc2l0ZXMuXHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5cclxuLyoqXHJcbiAqIEB0eXBlZGVmIEFQSVxyXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IHBoZXRpb0Z1bGxBUElcclxuICogQHByb3BlcnR5IHtPYmplY3R9IHBoZXRpb0VsZW1lbnRzIC0gcGhldGlvRWxlbWVudHMgZm9yIHZlcnNpb24gPj0xLjAgdGhpcyB3aWxsIGJlIGEgc3BhcnNlLCB0cmVlIGxpa2Ugc3RydWN0dXJlIHdpdGhcclxuICogICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhIGluIGtleTogYF9tZXRhZGF0YWAuIEZvciB2ZXJzaW9uPDEgdGhpcyB3aWxsIGJlIGEgZmxhdCBsaXN0IHdpdGggcGhldGlvSURzIGFzIGtleXMsXHJcbiAqICAgICAgICAgICAgICAgICAgICBhbmQgdmFsdWVzIGFzIG1ldGFkYXRhLlxyXG4gKiBAcHJvcGVydHkge09iamVjdH0gcGhldGlvVHlwZXNcclxuICovXHJcblxyXG4vKipcclxuICogU2VlIHBoZXRpb0VuZ2luZS5qcyBmb3Igd2hlcmUgdGhpcyBpcyBnZW5lcmF0ZWQgaW4gbWFpbi4gS2VlcCBpbiBtaW5kIHRoYXQgd2Ugc3VwcG9ydCBkaWZmZXJlbnQgdmVyc2lvbnMsIGluY2x1ZGluZ1xyXG4gKiBBUElzIHRoYXQgZG9uJ3QgaGF2ZSBhIHZlcnNpb24gYXR0cmlidXRlLlxyXG4gKiBAdHlwZWRlZiBBUElfMV8wXHJcbiAqIEBleHRlbmRzIEFQSVxyXG4gKiBAcHJvcGVydHkge3ttYWpvcjpudW1iZXIsIG1pbm9yOm51bWJlcn19IHZlcnNpb25cclxuICogQHByb3BlcnR5IHtzdHJpbmd9IHNpbVxyXG4gKi9cclxuKCAoKSA9PiB7XHJcblxyXG4gIGNvbnN0IE1FVEFEQVRBX0tFWV9OQU1FID0gJ19tZXRhZGF0YSc7XHJcbiAgY29uc3QgREFUQV9LRVlfTkFNRSA9ICdfZGF0YSc7XHJcblxyXG4gIC8vIElzIG5vdCB0aGUgcmVzZXJ2ZWQga2V5cyB0byBzdG9yZSBkYXRhL21ldGFkYXRhIG9uIFBoRVQtaU8gRWxlbWVudHMuXHJcbiAgY29uc3QgaXNDaGlsZEtleSA9IGtleSA9PiBrZXkgIT09IE1FVEFEQVRBX0tFWV9OQU1FICYmIGtleSAhPT0gREFUQV9LRVlfTkFNRTtcclxuXHJcbiAgLyoqXHJcbiAgICogXCJ1cC1jb252ZXJ0XCIgYW4gQVBJIHRvIGJlIGluIHRoZSBmb3JtYXQgb2YgQVBJIHZlcnNpb24gPj0xLjAuIFRoaXMgZ2VuZXJhbGx5IGlzIHRob3VnaHQgb2YgYXMgYSBcInNwYXJzZSwgdHJlZS1saWtlXCIgQVBJLlxyXG4gICAqIEBwYXJhbSB7QVBJfSBhcGlcclxuICAgKiBAcGFyYW0gX1xyXG4gICAqIEByZXR1cm5zIHtBUEl9IC0gSW4gdGhpcyB2ZXJzaW9uLCBwaGV0aW9FbGVtZW50cyB3aWxsIGJlIHN0cnVjdHVyZWQgYXMgYSB0cmVlLCBidXQgd2lsbCBoYXZlIGEgdmVyYm9zZSBhbmQgY29tcGxldGVcclxuICAgKiAgICAgICAgICAgICAgICAgIHNldCBvZiBhbGwgbWV0YWRhdGEga2V5cyBmb3IgZWFjaCBlbGVtZW50LiBUaGVyZSB3aWxsIG5vdCBiZSBgbWV0YWRhdGFEZWZhdWx0c2AgaW4gZWFjaCB0eXBlLlxyXG4gICAqL1xyXG4gIGNvbnN0IHRvU3RydWN0dXJlZFRyZWUgPSAoIGFwaSwgXyApID0+IHtcclxuICAgIGNvbnN0IHNwYXJzZUFQSSA9IF8uY2xvbmVEZWVwKCBhcGkgKTtcclxuXHJcbiAgICAvLyBEVVBMSUNBVEVEIHdpdGggcGhldGlvRW5naW5lLmpzXHJcbiAgICBjb25zdCBzcGFyc2VFbGVtZW50cyA9IHt9O1xyXG4gICAgT2JqZWN0LmtleXMoIGFwaS5waGV0aW9FbGVtZW50cyApLmZvckVhY2goIHBoZXRpb0lEID0+IHtcclxuICAgICAgY29uc3QgZW50cnkgPSBhcGkucGhldGlvRWxlbWVudHNbIHBoZXRpb0lEIF07XHJcblxyXG4gICAgICAvLyBBUEkgdmVyc2lvbnMgPCAxLjAsIHVzZSBhIHRhbmRlbSBzZXBhcmF0b3Igb2YgJy4nICBJZiB3ZSBldmVyIGNoYW5nZSB0aGlzIHNlcGFyYXRvciBpbiBtYWluIChob3BlZnVsbHkgbm90ISlcclxuICAgICAgLy8gdGhpcyB2YWx1ZSB3b3VsZG4ndCBjaGFuZ2Ugc2luY2UgaXQgcmVmbGVjdHMgdGhlIHByaW9yIGNvbW1pdHRlZCB2ZXJzaW9ucyB3aGljaCBkbyB1c2UgJy4nXHJcbiAgICAgIGNvbnN0IGNoYWluID0gcGhldGlvSUQuc3BsaXQoICcuJyApO1xyXG5cclxuICAgICAgLy8gRmlsbCBpbiBlYWNoIGxldmVsXHJcbiAgICAgIGxldCBsZXZlbCA9IHNwYXJzZUVsZW1lbnRzO1xyXG4gICAgICBjaGFpbi5mb3JFYWNoKCBjb21wb25lbnROYW1lID0+IHtcclxuICAgICAgICBsZXZlbFsgY29tcG9uZW50TmFtZSBdID0gbGV2ZWxbIGNvbXBvbmVudE5hbWUgXSB8fCB7fTtcclxuICAgICAgICBsZXZlbCA9IGxldmVsWyBjb21wb25lbnROYW1lIF07XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGxldmVsWyBNRVRBREFUQV9LRVlfTkFNRSBdID0ge307XHJcblxyXG4gICAgICBPYmplY3Qua2V5cyggZW50cnkgKS5mb3JFYWNoKCBrZXkgPT4ge1xyXG5cclxuICAgICAgICAgIC8vIHdyaXRlIGFsbCB2YWx1ZXMgd2l0aG91dCB0cnlpbmcgdG8gZmFjdG9yIG91dCBkZWZhdWx0c1xyXG4gICAgICAgICAgbGV2ZWxbIE1FVEFEQVRBX0tFWV9OQU1FIF1bIGtleSBdID0gZW50cnlbIGtleSBdO1xyXG4gICAgICAgIH1cclxuICAgICAgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICBzcGFyc2VBUEkucGhldGlvRWxlbWVudHMgPSBzcGFyc2VFbGVtZW50cztcclxuICAgIHJldHVybiBzcGFyc2VBUEk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IHBoZXRpb0VsZW1lbnRcclxuICAgKiBAcGFyYW0ge0FQSX0gYXBpXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IF8gLSBsb2Rhc2hcclxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufHVuZGVmaW5lZH0gYXNzZXJ0IC0gb3B0aW9uYWwgYXNzZXJ0XHJcbiAgICogQHJldHVybnMge09iamVjdH1cclxuICAgKi9cclxuICBjb25zdCBnZXRNZXRhZGF0YVZhbHVlcyA9ICggcGhldGlvRWxlbWVudCwgYXBpLCBfLCBhc3NlcnQgKSA9PiB7XHJcbiAgICBjb25zdCBpb1R5cGVOYW1lID0gcGhldGlvRWxlbWVudFsgTUVUQURBVEFfS0VZX05BTUUgXSA/ICggcGhldGlvRWxlbWVudFsgTUVUQURBVEFfS0VZX05BTUUgXS5waGV0aW9UeXBlTmFtZSB8fCAnT2JqZWN0SU8nICkgOiAnT2JqZWN0SU8nO1xyXG5cclxuICAgIGlmICggYXBpLnZlcnNpb24gKSB7XHJcbiAgICAgIGNvbnN0IGRlZmF1bHRzID0gZ2V0TWV0YWRhdGFEZWZhdWx0cyggaW9UeXBlTmFtZSwgYXBpLCBfLCBhc3NlcnQgKTtcclxuICAgICAgcmV0dXJuIF8ubWVyZ2UoIGRlZmF1bHRzLCBwaGV0aW9FbGVtZW50WyBNRVRBREFUQV9LRVlfTkFNRSBdICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuXHJcbiAgICAgIC8vIERlbnNlIHZlcnNpb24gc3VwcGxpZXMgYWxsIG1ldGFkYXRhIHZhbHVlc1xyXG4gICAgICByZXR1cm4gcGhldGlvRWxlbWVudFsgTUVUQURBVEFfS0VZX05BTUUgXTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZU5hbWVcclxuICAgKiBAcGFyYW0ge0FQSX0gYXBpXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IF8gLSBsb2Rhc2hcclxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufHVuZGVmaW5lZH0gYXNzZXJ0IC0gb3B0aW9uYWwgYXNzZXJ0XHJcbiAgICogQHJldHVybnMge09iamVjdH0gLSBkZWZlbnNpdmUgY29weSwgbm9uLW11dGF0aW5nXHJcbiAgICovXHJcbiAgY29uc3QgZ2V0TWV0YWRhdGFEZWZhdWx0cyA9ICggdHlwZU5hbWUsIGFwaSwgXywgYXNzZXJ0ICkgPT4ge1xyXG4gICAgY29uc3QgZW50cnkgPSBhcGkucGhldGlvVHlwZXNbIHR5cGVOYW1lIF07XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBlbnRyeSwgYGVudHJ5IG1pc3Npbmc6ICR7dHlwZU5hbWV9YCApO1xyXG4gICAgaWYgKCBlbnRyeS5zdXBlcnR5cGUgKSB7XHJcbiAgICAgIHJldHVybiBfLm1lcmdlKCBnZXRNZXRhZGF0YURlZmF1bHRzKCBlbnRyeS5zdXBlcnR5cGUsIGFwaSwgXyApLCBlbnRyeS5tZXRhZGF0YURlZmF1bHRzICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIF8ubWVyZ2UoIHt9LCBlbnRyeS5tZXRhZGF0YURlZmF1bHRzICk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHtBUEl9IGFwaVxyXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIHdoZXRoZXIgb3Igbm90IHRoZSBBUEkgaXMgb2YgdHlwZSBBUElfMV8wXHJcbiAgICovXHJcbiAgY29uc3QgaXNPbGRBUElWZXJzaW9uID0gYXBpID0+IHtcclxuICAgIHJldHVybiAhYXBpLmhhc093blByb3BlcnR5KCAndmVyc2lvbicgKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBDb21wYXJlIHR3byBBUElzIGZvciBicmVha2luZyBvciBkZXNpZ24gY2hhbmdlcy5cclxuICAgKlxyXG4gICAqIE5PVEU6IE5hbWVkIHdpdGggYW4gdW5kZXJzY29yZSB0byBhdm9pZCBhdXRvbWF0aWNhbGx5IGRlZmluaW5nIGB3aW5kb3cucGhldGlvQ29tcGFyZUFQSXNgIGFzIGEgZ2xvYmFsXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0FQSX0gcmVmZXJlbmNlQVBJIC0gdGhlIFwiZ3JvdW5kIHRydXRoXCIgb3IgcmVmZXJlbmNlIEFQSVxyXG4gICAqIEBwYXJhbSB7QVBJfSBwcm9wb3NlZEFQSSAtIHRoZSBwcm9wb3NlZCBBUEkgZm9yIGNvbXBhcmlzb24gd2l0aCByZWZlcmVuY2VBUElcclxuICAgKiBAcGFyYW0gXyAtIGxvZGFzaCwgc28gdGhpcyBjYW4gYmUgdXNlZCBmcm9tIGRpZmZlcmVudCBjb250ZXh0cy5cclxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufHVuZGVmaW5lZH0gYXNzZXJ0IC0gc28gdGhpcyBjYW4gYmUgdXNlZCBmcm9tIGRpZmZlcmVudCBjb250ZXh0c1xyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cclxuICAgKiBAcmV0dXJucyB7e2JyZWFraW5nUHJvYmxlbXM6c3RyaW5nW10sIGRlc2lnbmVkUHJvYmxlbXM6c3RyaW5nW119fVxyXG4gICAqL1xyXG4gIGNvbnN0IF9waGV0aW9Db21wYXJlQVBJcyA9ICggcmVmZXJlbmNlQVBJLCBwcm9wb3NlZEFQSSwgXywgYXNzZXJ0LCBvcHRpb25zICkgPT4ge1xyXG5cclxuICAgIC8vIElmIHRoZSBwcm9wb3NlZCB2ZXJzaW9uIHByZWRhdGVzIDEuMCwgdGhlbiBicmluZyBpdCBmb3J3YXJkIHRvIHRoZSBzdHJ1Y3R1cmVkIHRyZWUgd2l0aCBtZXRhZGF0YSB1bmRlciBgX21ldGFkYXRhYC5cclxuICAgIGlmICggaXNPbGRBUElWZXJzaW9uKCBwcm9wb3NlZEFQSSApICkge1xyXG4gICAgICBwcm9wb3NlZEFQSSA9IHRvU3RydWN0dXJlZFRyZWUoIHByb3Bvc2VkQVBJLCBfICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBpc09sZEFQSVZlcnNpb24oIHJlZmVyZW5jZUFQSSApICkge1xyXG4gICAgICByZWZlcmVuY2VBUEkgPSB0b1N0cnVjdHVyZWRUcmVlKCByZWZlcmVuY2VBUEksIF8gKTtcclxuICAgIH1cclxuXHJcbiAgICBvcHRpb25zID0gXy5tZXJnZSgge1xyXG4gICAgICBjb21wYXJlRGVzaWduZWRBUElDaGFuZ2VzOiB0cnVlLFxyXG4gICAgICBjb21wYXJlQnJlYWtpbmdBUElDaGFuZ2VzOiB0cnVlXHJcbiAgICB9LCBvcHRpb25zICk7XHJcblxyXG4gICAgY29uc3QgYnJlYWtpbmdQcm9ibGVtcyA9IFtdO1xyXG4gICAgY29uc3QgZGVzaWduZWRQcm9ibGVtcyA9IFtdO1xyXG5cclxuICAgIGNvbnN0IGFwcGVuZFByb2JsZW0gPSAoIHByb2JsZW1TdHJpbmcsIGlzRGVzaWduZWRQcm9ibGVtID0gZmFsc2UgKSA9PiB7XHJcbiAgICAgIGlmICggaXNEZXNpZ25lZFByb2JsZW0gJiYgb3B0aW9ucy5jb21wYXJlRGVzaWduZWRBUElDaGFuZ2VzICkge1xyXG4gICAgICAgIGRlc2lnbmVkUHJvYmxlbXMucHVzaCggcHJvYmxlbVN0cmluZyApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCAhaXNEZXNpZ25lZFByb2JsZW0gJiYgb3B0aW9ucy5jb21wYXJlQnJlYWtpbmdBUElDaGFuZ2VzICkge1xyXG4gICAgICAgIGJyZWFraW5nUHJvYmxlbXMucHVzaCggcHJvYmxlbVN0cmluZyApO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVmlzaXQgb25lIGVsZW1lbnQgYWxvbmcgdGhlIEFQSXMuXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ1tdfSB0cmFpbCAtIHRoZSBwYXRoIG9mIHRhbmRlbSBjb21wb25lbnROYW1lc1xyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJlZmVyZW5jZSAtIGN1cnJlbnQgdmFsdWUgaW4gdGhlIHJlZmVyZW5jZUFQSVxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHByb3Bvc2VkIC0gY3VycmVudCB2YWx1ZSBpbiB0aGUgcHJvcG9zZWRBUElcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNEZXNpZ25lZFxyXG4gICAgICovXHJcbiAgICBjb25zdCB2aXNpdCA9ICggdHJhaWwsIHJlZmVyZW5jZSwgcHJvcG9zZWQsIGlzRGVzaWduZWQgKSA9PiB7XHJcbiAgICAgIGNvbnN0IHBoZXRpb0lEID0gdHJhaWwuam9pbiggJy4nICk7XHJcblxyXG4gICAgICAvLyBEZXRlY3QgYW4gaW5zdHJ1bWVudGVkIGluc3RhbmNlXHJcbiAgICAgIGlmICggcmVmZXJlbmNlLmhhc093blByb3BlcnR5KCBNRVRBREFUQV9LRVlfTkFNRSApICkge1xyXG5cclxuICAgICAgICAvLyBPdmVycmlkZSBpc0Rlc2lnbmVkLCBpZiBzcGVjaWZpZWRcclxuICAgICAgICBpc0Rlc2lnbmVkID0gaXNEZXNpZ25lZCB8fCByZWZlcmVuY2VbIE1FVEFEQVRBX0tFWV9OQU1FIF0ucGhldGlvRGVzaWduZWQ7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlZmVyZW5jZUNvbXBsZXRlTWV0YWRhdGEgPSBnZXRNZXRhZGF0YVZhbHVlcyggcmVmZXJlbmNlLCByZWZlcmVuY2VBUEksIF8sIGFzc2VydCApO1xyXG4gICAgICAgIGNvbnN0IHByb3Bvc2VkQ29tcGxldGVNZXRhZGF0YSA9IGdldE1ldGFkYXRhVmFsdWVzKCBwcm9wb3NlZCwgcHJvcG9zZWRBUEksIF8sIGFzc2VydCApO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBQdXNoIGFueSBwcm9ibGVtcyB0aGF0IG1heSBleGlzdCBmb3IgdGhlIHByb3ZpZGVkIG1ldGFkYXRhS2V5LlxyXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtZXRhZGF0YUtleSAtIFNlZSBQaGV0aW9PYmplY3QuZ2V0TWV0YWRhdGEoKVxyXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNEZXNpZ25lZENoYW5nZSAtIGlmIHRoZSBkaWZmZXJlbmNlIGlzIGZyb20gYSBkZXNpZ24gY2hhbmdlLCBhbmQgbm90IGZyb20gYSBicmVha2luZyBjaGFuZ2UgdGVzdFxyXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW2ludmFsaWRQcm9wb3NlZFZhbHVlXSAtIGFuIG9wdGlvbmFsIG5ldyB2YWx1ZSB0aGF0IHdvdWxkIHNpZ25pZnkgYSBicmVha2luZyBjaGFuZ2UuIEFueSBvdGhlciB2YWx1ZSB3b3VsZCBiZSBhY2NlcHRhYmxlLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGNvbnN0IHJlcG9ydERpZmZlcmVuY2VzID0gKCBtZXRhZGF0YUtleSwgaXNEZXNpZ25lZENoYW5nZSwgaW52YWxpZFByb3Bvc2VkVmFsdWUgKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCByZWZlcmVuY2VWYWx1ZSA9IHJlZmVyZW5jZUNvbXBsZXRlTWV0YWRhdGFbIG1ldGFkYXRhS2V5IF07XHJcblxyXG4gICAgICAgICAgLy8gR3JhY2VmdWxseSBoYW5kbGUgbWlzc2luZyBtZXRhZGF0YSBmcm9tIHRoZSA8MS4wIEFQSSBmb3JtYXRcclxuICAgICAgICAgIGNvbnN0IHByb3Bvc2VkVmFsdWUgPSBwcm9wb3NlZENvbXBsZXRlTWV0YWRhdGEgPyBwcm9wb3NlZENvbXBsZXRlTWV0YWRhdGFbIG1ldGFkYXRhS2V5IF0gOiB7fTtcclxuXHJcbiAgICAgICAgICBpZiAoIHJlZmVyZW5jZVZhbHVlICE9PSBwcm9wb3NlZFZhbHVlICkge1xyXG5cclxuICAgICAgICAgICAgLy8gaWYgcHJvcG9zZWQgQVBJIGlzIG9sZGVyIChubyB2ZXJzaW9uIHNwZWNpZmllZCksIGlnbm9yZSBwaGV0aW9BcmNoZXR5cGVQaGV0aW9JRCBjaGFuZ2VkIGZyb20gbnVsbCB0byB1bmRlZmluZWRcclxuICAgICAgICAgICAgLy8gYmVjYXVzZSBpdCB1c2VkIHRvIGJlIHNwYXJzZSwgYW5kIGluIHZlcnNpb24gMS4wIGl0IGJlY2FtZSBhIGRlZmF1bHQuXHJcbiAgICAgICAgICAgIGNvbnN0IGlnbm9yZUJyb2tlblByb3Bvc2VkID0gaXNPbGRBUElWZXJzaW9uKCBwcm9wb3NlZEFQSSApICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGFLZXkgPT09ICdwaGV0aW9BcmNoZXR5cGVQaGV0aW9JRCcgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2VWYWx1ZSA9PT0gbnVsbCAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3Bvc2VkVmFsdWUgPT09IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGlnbm9yZUJyb2tlblJlZmVyZW5jZSA9IGlzT2xkQVBJVmVyc2lvbiggcmVmZXJlbmNlQVBJICkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGFLZXkgPT09ICdwaGV0aW9BcmNoZXR5cGVQaGV0aW9JRCcgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcG9zZWRWYWx1ZSA9PT0gbnVsbCAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2VWYWx1ZSA9PT0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgaWdub3JlID0gaWdub3JlQnJva2VuUHJvcG9zZWQgfHwgaWdub3JlQnJva2VuUmVmZXJlbmNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCAhaWdub3JlICkge1xyXG5cclxuICAgICAgICAgICAgICBpZiAoIGludmFsaWRQcm9wb3NlZFZhbHVlID09PSB1bmRlZmluZWQgfHwgaXNEZXNpZ25lZENoYW5nZSApIHtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByb2JsZW0oIGAke3BoZXRpb0lEfS4ke21ldGFkYXRhS2V5fSBjaGFuZ2VkIGZyb20gXCIke3JlZmVyZW5jZVZhbHVlfVwiIHRvIFwiJHtwcm9wb3NlZFZhbHVlfVwiYCwgaXNEZXNpZ25lZENoYW5nZSApO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIGlmICggIWlzRGVzaWduZWRDaGFuZ2UgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHByb3Bvc2VkVmFsdWUgPT09IGludmFsaWRQcm9wb3NlZFZhbHVlICkge1xyXG4gICAgICAgICAgICAgICAgICBhcHBlbmRQcm9ibGVtKCBgJHtwaGV0aW9JRH0uJHttZXRhZGF0YUtleX0gY2hhbmdlZCBmcm9tIFwiJHtyZWZlcmVuY2VWYWx1ZX1cIiB0byBcIiR7cHJvcG9zZWRWYWx1ZX1cImAgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgICAgLy8gdmFsdWUgY2hhbmdlZCwgYnV0IGl0IHdhcyBhIHdpZGVuaW5nIEFQSSAoYWRkaW5nIHNvbWV0aGluZyB0byBzdGF0ZSwgb3IgbWFraW5nIHNvbWV0aGluZyByZWFkL3dyaXRlKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIENoZWNrIGZvciBicmVha2luZyBjaGFuZ2VzXHJcbiAgICAgICAgcmVwb3J0RGlmZmVyZW5jZXMoICdwaGV0aW9UeXBlTmFtZScsIGZhbHNlICk7XHJcbiAgICAgICAgcmVwb3J0RGlmZmVyZW5jZXMoICdwaGV0aW9FdmVudFR5cGUnLCBmYWxzZSApO1xyXG4gICAgICAgIHJlcG9ydERpZmZlcmVuY2VzKCAncGhldGlvUGxheWJhY2snLCBmYWxzZSApO1xyXG4gICAgICAgIHJlcG9ydERpZmZlcmVuY2VzKCAncGhldGlvRHluYW1pY0VsZW1lbnQnLCBmYWxzZSApO1xyXG4gICAgICAgIHJlcG9ydERpZmZlcmVuY2VzKCAncGhldGlvSXNBcmNoZXR5cGUnLCBmYWxzZSApO1xyXG4gICAgICAgIHJlcG9ydERpZmZlcmVuY2VzKCAncGhldGlvQXJjaGV0eXBlUGhldGlvSUQnLCBmYWxzZSApO1xyXG4gICAgICAgIHJlcG9ydERpZmZlcmVuY2VzKCAncGhldGlvU3RhdGUnLCBmYWxzZSwgZmFsc2UgKTsgLy8gT25seSByZXBvcnQgaWYgc29tZXRoaW5nIGJlY2FtZSBub24tc3RhdGVmdWxcclxuICAgICAgICByZXBvcnREaWZmZXJlbmNlcyggJ3BoZXRpb1JlYWRPbmx5JywgZmFsc2UsIHRydWUgKTsgLy8gT25seSBuZWVkIHRvIHJlcG9ydCBpZiBzb21ldGhpbmcgYmVjYW1lIHJlYWRPbmx5XHJcblxyXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgbWV0YWRhdGEga2V5cyBhcmUgbm9uLWJyZWFraW5nOlxyXG4gICAgICAgIC8vICdwaGV0aW9Eb2N1bWVudGF0aW9uJ1xyXG4gICAgICAgIC8vICdwaGV0aW9GZWF0dXJlZCdcclxuICAgICAgICAvLyAncGhldGlvSGlnaEZyZXF1ZW5jeScsIG5vbi1icmVha2luZywgYXNzdW1pbmcgY2xpZW50cyB3aXRoIGRhdGEgaGF2ZSB0aGUgZnVsbCBkYXRhIHN0cmVhbVxyXG5cclxuICAgICAgICAvLyBDaGVjayBmb3IgZGVzaWduIGNoYW5nZXNcclxuICAgICAgICBpZiAoIGlzRGVzaWduZWQgKSB7XHJcbiAgICAgICAgICBPYmplY3Qua2V5cyggcmVmZXJlbmNlQ29tcGxldGVNZXRhZGF0YSApLmZvckVhY2goIG1ldGFkYXRhS2V5ID0+IHtcclxuICAgICAgICAgICAgcmVwb3J0RGlmZmVyZW5jZXMoIG1ldGFkYXRhS2V5LCB0cnVlICk7XHJcbiAgICAgICAgICB9ICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiB0aGUgcmVmZXJlbmNlIGZpbGUgZGVjbGFyZXMgYW4gaW5pdGlhbCBzdGF0ZSwgY2hlY2sgdGhhdCBpdCBoYXNuJ3QgY2hhbmdlZFxyXG4gICAgICAgIGlmICggcmVmZXJlbmNlLl9kYXRhICYmIHJlZmVyZW5jZS5fZGF0YS5pbml0aWFsU3RhdGUgKSB7XHJcblxyXG4gICAgICAgICAgLy8gRGV0ZWN0IG1pc3NpbmcgZXhwZWN0ZWQgc3RhdGVcclxuICAgICAgICAgIGlmICggIXByb3Bvc2VkLl9kYXRhIHx8ICFwcm9wb3NlZC5fZGF0YS5pbml0aWFsU3RhdGUgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHByb2JsZW1TdHJpbmcgPSBgJHtwaGV0aW9JRH0uX2RhdGEuaW5pdGlhbFN0YXRlIGlzIG1pc3NpbmdgO1xyXG5cclxuICAgICAgICAgICAgLy8gTWlzc2luZyBidXQgZXhwZWN0ZWQgc3RhdGUgaXMgYSBicmVha2luZyBwcm9ibGVtXHJcbiAgICAgICAgICAgIGFwcGVuZFByb2JsZW0oIHByb2JsZW1TdHJpbmcsIGZhbHNlICk7XHJcblxyXG4gICAgICAgICAgICAvLyBJdCBpcyBhbHNvIGEgZGVzaWduZWQgcHJvYmxlbSBpZiB3ZSBleHBlY3RlZCBzdGF0ZSBpbiBhIGRlc2lnbmVkIHN1YnRyZWVcclxuICAgICAgICAgICAgaXNEZXNpZ25lZCAmJiBhcHBlbmRQcm9ibGVtKCBwcm9ibGVtU3RyaW5nLCB0cnVlICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHJlZmVyZW5jZXNJbml0aWFsU3RhdGUgPSByZWZlcmVuY2UuX2RhdGEuaW5pdGlhbFN0YXRlO1xyXG4gICAgICAgICAgICBjb25zdCBwcm9wb3NlZEluaXRpYWxTdGF0ZSA9IHByb3Bvc2VkLl9kYXRhLmluaXRpYWxTdGF0ZTtcclxuICAgICAgICAgICAgY29uc3QgbWF0Y2hlcyA9IF8uaXNFcXVhbFdpdGgoIHJlZmVyZW5jZXNJbml0aWFsU3RhdGUsIHByb3Bvc2VkSW5pdGlhbFN0YXRlLFxyXG4gICAgICAgICAgICAgICggcmVmZXJlbmNlU3RhdGUsIHByb3Bvc2VkU3RhdGUgKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gVG9wIGxldmVsIG9iamVjdCBjb21wYXJpc29uIG9mIHRoZSBlbnRpcmUgc3RhdGUgKG5vdCBhIGNvbXBvbmVudCBwaWVjZSlcclxuICAgICAgICAgICAgICAgIGlmICggcmVmZXJlbmNlc0luaXRpYWxTdGF0ZSA9PT0gcmVmZXJlbmNlU3RhdGUgJiYgcHJvcG9zZWRJbml0aWFsU3RhdGUgPT09IHByb3Bvc2VkU3RhdGUgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAvLyBUaGUgdmFsaWRWYWx1ZXMgb2YgdGhlIGxvY2FsZVByb3BlcnR5IGNoYW5nZXMgZWFjaCB0aW1lIGEgbmV3IHRyYW5zbGF0aW9uIGlzIHN1Ym1pdHRlZCBmb3IgYSBzaW0uXHJcbiAgICAgICAgICAgICAgICAgIGlmICggcGhldGlvSUQgPT09IHRyYWlsWyAwIF0gKyAnLmdlbmVyYWwubW9kZWwubG9jYWxlUHJvcGVydHknICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgc2ltIG11c3QgaGF2ZSBhbGwgZXhwZWN0ZWQgbG9jYWxlcywgYnV0IGl0IGlzIGFjY2VwdGFibGUgdG8gYWRkIG5ldyBvbmVzIHdpdGhvdXQgQVBJIGVycm9yLlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWZlcmVuY2VTdGF0ZS52YWxpZFZhbHVlcy5ldmVyeSggdmFsaWRWYWx1ZSA9PiBwcm9wb3NlZFN0YXRlLnZhbGlkVmFsdWVzLmluY2x1ZGVzKCB2YWxpZFZhbHVlICkgKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgLy8gSWdub3JlIGFueSBwb2ludGVycywgYmVjYXVzZSB0aGV5IHdvbid0IG9jY3VyIHdoZW4gZ2VuZXJhdGluZyB0aGUgYWN0dWFsIGFwaSwgYnV0IG1heSBpZiBhIG1vdXNlIGlzIG92ZXIgYSB0ZXN0aW5nIGJyb3dzZXIuXHJcbiAgICAgICAgICAgICAgICAgIGlmICggcGhldGlvSUQgPT09ICggdHJhaWxbIDAgXSArICcuZ2VuZXJhbC5jb250cm9sbGVyLmlucHV0JyApICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfLmlzRXF1YWwoIHsgLi4ucmVmZXJlbmNlU3RhdGUsIHBvaW50ZXJzOiBudWxsIH0sIHsgLi4ucHJvcG9zZWRTdGF0ZSwgcG9pbnRlcnM6IG51bGwgfSApO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAvLyBJZ25vcmUgdGhlIHNjYWxlJ3Mgc3RhdGUsIGJlY2F1c2UgaXQgd2lsbCBiZSBkaWZmZXJlbnQgYXQgc3RhcnR1cCwgZGVwZW5kaW5nIG9uIHRoZSB1c2VyJ3Mgd2luZG93J3NcclxuICAgICAgICAgICAgICAgICAgLy8gYXNwZWN0IHJhdGlvLiBUT0RPOiBXb3JrYXJvdW5kIGZvciBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZGVuc2l0eS9pc3N1ZXMvMTYxXHJcbiAgICAgICAgICAgICAgICAgIGlmICggcGhldGlvSUQgPT09ICdkZW5zaXR5Lm15c3RlcnlTY3JlZW4ubW9kZWwuc2NhbGUnICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAvLyBJZ25vcmUgdGhlIHdpcmVNZXRlckF0dGFjaG1lbnRQb3NpdGlvblByb3BlcnR5IGJlY2F1c2Ugb24gaXQncyBzdGFydGluZyBwb3NpdGlvbiBjYW4gY2hhbmdlIGJhc2VkIG9uXHJcbiAgICAgICAgICAgICAgICAgIC8vIHRoZSBicm93c2VyIHJ1bm5pbmcgdGhlIHNpbS4gVE9ETzogUm9vdCBjYXVzZSBpcyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvMTk1MS5cclxuICAgICAgICAgICAgICAgICAgaWYgKCBwaGV0aW9JRCA9PT0gJ2dyZWVuaG91c2VFZmZlY3QubGF5ZXJNb2RlbFNjcmVlbi5tb2RlbC5mbHV4TWV0ZXIud2lyZU1ldGVyQXR0YWNobWVudFBvc2l0aW9uUHJvcGVydHknIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgcGhldGlvSUQgPT09ICdncmVlbmhvdXNlRWZmZWN0LnBob3RvbnNTY3JlZW4ubW9kZWwuZmx1eE1ldGVyLndpcmVNZXRlckF0dGFjaG1lbnRQb3NpdGlvblByb3BlcnR5JyApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIFdoZW4gY29tcGFyaW5nIG51bWJlcnMsIGRvbid0IHRyaWdnZXIgYW4gZXJyb3IgYmFzZWQgb24gZmxvYXRpbmcgcG9pbnQgaW5hY2N1cmFjaWVzLiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYXF1YS9pc3N1ZXMvMjAwXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICggdHlwZW9mIHJlZmVyZW5jZVN0YXRlID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgcHJvcG9zZWRTdGF0ZSA9PT0gJ251bWJlcicgKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IG51bWJlclBsYWNlcyA9IDEwO1xyXG5cclxuICAgICAgICAgICAgICAgICAgLy8gdG9QcmVjaXNpb24gaXMgYmV0dGVyIGZvciBsYXJnZXIgbnVtYmVycywgc2luY2UgdG9GaXhlZCB3aWxsIHJlc3VsdCBpbiBhZGp1c3RpbmcgbWFueSBtb3JlIHNpZyBmaWdzIHRoYW4gbmVlZGVkLlxyXG4gICAgICAgICAgICAgICAgICBpZiAoIHJlZmVyZW5jZVN0YXRlID4gMTAwMDAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlZmVyZW5jZVN0YXRlLnRvUHJlY2lzaW9uKCBudW1iZXJQbGFjZXMgKSA9PT0gcHJvcG9zZWRTdGF0ZS50b1ByZWNpc2lvbiggbnVtYmVyUGxhY2VzICk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlZmVyZW5jZVN0YXRlLnRvRml4ZWQoIG51bWJlclBsYWNlcyApID09PSBwcm9wb3NlZFN0YXRlLnRvRml4ZWQoIG51bWJlclBsYWNlcyApO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDsgLy8gTWVhbmluZyB1c2UgdGhlIGRlZmF1bHQgbG9kYXNoIGFsZ29yaXRobSBmb3IgY29tcGFyaXNvbi5cclxuICAgICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICAgIGlmICggIW1hdGNoZXMgKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgcHJvYmxlbVN0cmluZyA9IGAke3BoZXRpb0lEfS5fZGF0YS5pbml0aWFsU3RhdGUgZGlmZmVycy4gXFxuRXhwZWN0ZWQ6XFxuJHtKU09OLnN0cmluZ2lmeSggcmVmZXJlbmNlLl9kYXRhLmluaXRpYWxTdGF0ZSApfVxcbiBhY3R1YWw6XFxuJHtKU09OLnN0cmluZ2lmeSggcHJvcG9zZWQuX2RhdGEuaW5pdGlhbFN0YXRlICl9XFxuYDtcclxuXHJcbiAgICAgICAgICAgICAgLy8gQSBjaGFuZ2VkIHN0YXRlIHZhbHVlIGNvdWxkIGJyZWFrIGEgY2xpZW50IHdyYXBwZXIsIHNvIGlkZW50aWZ5IGl0IHdpdGggYnJlYWtpbmcgY2hhbmdlcy5cclxuICAgICAgICAgICAgICBhcHBlbmRQcm9ibGVtKCBwcm9ibGVtU3RyaW5nLCBmYWxzZSApO1xyXG5cclxuICAgICAgICAgICAgICAvLyBJdCBpcyBhbHNvIGEgZGVzaWduZWQgcHJvYmxlbSBpZiB0aGUgcHJvcG9zZWQgdmFsdWVzIGRldmlhdGUgZnJvbSB0aGUgc3BlY2lmaWVkIGRlc2lnbmVkIHZhbHVlc1xyXG4gICAgICAgICAgICAgIGlzRGVzaWduZWQgJiYgYXBwZW5kUHJvYmxlbSggcHJvYmxlbVN0cmluZywgdHJ1ZSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBSZWN1cnNlIHRvIGNoaWxkcmVuXHJcbiAgICAgIGZvciAoIGNvbnN0IGNvbXBvbmVudE5hbWUgaW4gcmVmZXJlbmNlICkge1xyXG4gICAgICAgIGlmICggcmVmZXJlbmNlLmhhc093blByb3BlcnR5KCBjb21wb25lbnROYW1lICkgJiYgaXNDaGlsZEtleSggY29tcG9uZW50TmFtZSApICkge1xyXG5cclxuICAgICAgICAgIGlmICggIXByb3Bvc2VkLmhhc093blByb3BlcnR5KCBjb21wb25lbnROYW1lICkgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHByb2JsZW1TdHJpbmcgPSBgUGhFVC1pTyBFbGVtZW50IG1pc3Npbmc6ICR7cGhldGlvSUR9LiR7Y29tcG9uZW50TmFtZX1gO1xyXG4gICAgICAgICAgICBhcHBlbmRQcm9ibGVtKCBwcm9ibGVtU3RyaW5nLCBmYWxzZSApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBpc0Rlc2lnbmVkICkge1xyXG4gICAgICAgICAgICAgIGFwcGVuZFByb2JsZW0oIHByb2JsZW1TdHJpbmcsIHRydWUgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHZpc2l0KFxyXG4gICAgICAgICAgICAgIHRyYWlsLmNvbmNhdCggY29tcG9uZW50TmFtZSApLFxyXG4gICAgICAgICAgICAgIHJlZmVyZW5jZVsgY29tcG9uZW50TmFtZSBdLFxyXG4gICAgICAgICAgICAgIHByb3Bvc2VkWyBjb21wb25lbnROYW1lIF0sXHJcbiAgICAgICAgICAgICAgaXNEZXNpZ25lZFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgZm9yICggY29uc3QgY29tcG9uZW50TmFtZSBpbiBwcm9wb3NlZCApIHtcclxuICAgICAgICBpZiAoIGlzRGVzaWduZWQgJiYgcHJvcG9zZWQuaGFzT3duUHJvcGVydHkoIGNvbXBvbmVudE5hbWUgKSAmJiBpc0NoaWxkS2V5KCBjb21wb25lbnROYW1lICkgJiYgIXJlZmVyZW5jZS5oYXNPd25Qcm9wZXJ0eSggY29tcG9uZW50TmFtZSApICkge1xyXG4gICAgICAgICAgYXBwZW5kUHJvYmxlbSggYE5ldyBQaEVULWlPIEVsZW1lbnQgbm90IGluIHJlZmVyZW5jZTogJHtwaGV0aW9JRH0uJHtjb21wb25lbnROYW1lfWAsIHRydWUgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdmlzaXQoIFtdLCByZWZlcmVuY2VBUEkucGhldGlvRWxlbWVudHMsIHByb3Bvc2VkQVBJLnBoZXRpb0VsZW1lbnRzLCBmYWxzZSApO1xyXG5cclxuICAgIC8vIENoZWNrIGZvcjogbWlzc2luZyBJT1R5cGVzLCBtaXNzaW5nIG1ldGhvZHMsIG9yIGRpZmZlcmluZyBwYXJhbWV0ZXIgdHlwZXMgb3IgcmV0dXJuIHR5cGVzXHJcbiAgICBmb3IgKCBjb25zdCB0eXBlTmFtZSBpbiByZWZlcmVuY2VBUEkucGhldGlvVHlwZXMgKSB7XHJcbiAgICAgIGlmICggcmVmZXJlbmNlQVBJLnBoZXRpb1R5cGVzLmhhc093blByb3BlcnR5KCB0eXBlTmFtZSApICkge1xyXG5cclxuICAgICAgICAvLyBtYWtlIHN1cmUgd2UgaGF2ZSB0aGUgZGVzaXJlZCB0eXBlXHJcbiAgICAgICAgaWYgKCAhcHJvcG9zZWRBUEkucGhldGlvVHlwZXMuaGFzT3duUHJvcGVydHkoIHR5cGVOYW1lICkgKSB7XHJcbiAgICAgICAgICBhcHBlbmRQcm9ibGVtKCBgVHlwZSBtaXNzaW5nOiAke3R5cGVOYW1lfWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBjb25zdCByZWZlcmVuY2VUeXBlID0gcmVmZXJlbmNlQVBJLnBoZXRpb1R5cGVzWyB0eXBlTmFtZSBdO1xyXG4gICAgICAgICAgY29uc3QgcHJvcG9zZWRUeXBlID0gcHJvcG9zZWRBUEkucGhldGlvVHlwZXNbIHR5cGVOYW1lIF07XHJcblxyXG4gICAgICAgICAgLy8gbWFrZSBzdXJlIHdlIGhhdmUgYWxsIG9mIHRoZSBtZXRob2RzXHJcbiAgICAgICAgICBjb25zdCByZWZlcmVuY2VNZXRob2RzID0gcmVmZXJlbmNlVHlwZS5tZXRob2RzO1xyXG4gICAgICAgICAgY29uc3QgcHJvcG9zZWRNZXRob2RzID0gcHJvcG9zZWRUeXBlLm1ldGhvZHM7XHJcbiAgICAgICAgICBmb3IgKCBjb25zdCByZWZlcmVuY2VNZXRob2QgaW4gcmVmZXJlbmNlTWV0aG9kcyApIHtcclxuICAgICAgICAgICAgaWYgKCByZWZlcmVuY2VNZXRob2RzLmhhc093blByb3BlcnR5KCByZWZlcmVuY2VNZXRob2QgKSApIHtcclxuICAgICAgICAgICAgICBpZiAoICFwcm9wb3NlZE1ldGhvZHMuaGFzT3duUHJvcGVydHkoIHJlZmVyZW5jZU1ldGhvZCApICkge1xyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJvYmxlbSggYE1ldGhvZCBtaXNzaW5nLCB0eXBlPSR7dHlwZU5hbWV9LCBtZXRob2Q9JHtyZWZlcmVuY2VNZXRob2R9YCApO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBwYXJhbWV0ZXIgdHlwZXMgKGV4YWN0IG1hdGNoKVxyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVmZXJlbmNlUGFyYW1zID0gcmVmZXJlbmNlTWV0aG9kc1sgcmVmZXJlbmNlTWV0aG9kIF0ucGFyYW1ldGVyVHlwZXM7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wb3NlZFBhcmFtcyA9IHByb3Bvc2VkTWV0aG9kc1sgcmVmZXJlbmNlTWV0aG9kIF0ucGFyYW1ldGVyVHlwZXM7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCByZWZlcmVuY2VQYXJhbXMuam9pbiggJywnICkgIT09IHByb3Bvc2VkUGFyYW1zLmpvaW4oICcsJyApICkge1xyXG4gICAgICAgICAgICAgICAgICBhcHBlbmRQcm9ibGVtKCBgJHt0eXBlTmFtZX0uJHtyZWZlcmVuY2VNZXRob2R9IGhhcyBkaWZmZXJlbnQgcGFyYW1ldGVyIHR5cGVzOiBbJHtyZWZlcmVuY2VQYXJhbXMuam9pbiggJywgJyApfV0gPT4gWyR7cHJvcG9zZWRQYXJhbXMuam9pbiggJywgJyApfV1gICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVmZXJlbmNlUmV0dXJuVHlwZSA9IHJlZmVyZW5jZU1ldGhvZHNbIHJlZmVyZW5jZU1ldGhvZCBdLnJldHVyblR5cGU7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wb3NlZFJldHVyblR5cGUgPSBwcm9wb3NlZE1ldGhvZHNbIHJlZmVyZW5jZU1ldGhvZCBdLnJldHVyblR5cGU7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHJlZmVyZW5jZVJldHVyblR5cGUgIT09IHByb3Bvc2VkUmV0dXJuVHlwZSApIHtcclxuICAgICAgICAgICAgICAgICAgYXBwZW5kUHJvYmxlbSggYCR7dHlwZU5hbWV9LiR7cmVmZXJlbmNlTWV0aG9kfSBoYXMgYSBkaWZmZXJlbnQgcmV0dXJuIHR5cGUgJHtyZWZlcmVuY2VSZXR1cm5UeXBlfSA9PiAke3Byb3Bvc2VkUmV0dXJuVHlwZX1gICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gbWFrZSBzdXJlIHdlIGhhdmUgYWxsIG9mIHRoZSBldmVudHMgKE9LIHRvIGFkZCBtb3JlKVxyXG4gICAgICAgICAgY29uc3QgcmVmZXJlbmNlRXZlbnRzID0gcmVmZXJlbmNlVHlwZS5ldmVudHM7XHJcbiAgICAgICAgICBjb25zdCBwcm9wb3NlZEV2ZW50cyA9IHByb3Bvc2VkVHlwZS5ldmVudHM7XHJcbiAgICAgICAgICByZWZlcmVuY2VFdmVudHMuZm9yRWFjaCggZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICBpZiAoICFwcm9wb3NlZEV2ZW50cy5pbmNsdWRlcyggZXZlbnQgKSApIHtcclxuICAgICAgICAgICAgICBhcHBlbmRQcm9ibGVtKCBgJHt0eXBlTmFtZX0gaXMgbWlzc2luZyBldmVudDogJHtldmVudH1gICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gKTtcclxuXHJcbiAgICAgICAgICAvLyBtYWtlIHN1cmUgd2UgaGF2ZSBtYXRjaGluZyBzdXBlcnR5cGUgbmFtZXNcclxuICAgICAgICAgIGNvbnN0IHJlZmVyZW5jZVN1cGVydHlwZU5hbWUgPSByZWZlcmVuY2VUeXBlLnN1cGVydHlwZTtcclxuICAgICAgICAgIGNvbnN0IHByb3Bvc2VkU3VwZXJ0eXBlTmFtZSA9IHByb3Bvc2VkVHlwZS5zdXBlcnR5cGU7XHJcbiAgICAgICAgICBpZiAoIHJlZmVyZW5jZVN1cGVydHlwZU5hbWUgIT09IHByb3Bvc2VkU3VwZXJ0eXBlTmFtZSApIHtcclxuICAgICAgICAgICAgYXBwZW5kUHJvYmxlbSggYCR7dHlwZU5hbWV9IHN1cGVydHlwZSBjaGFuZ2VkIGZyb20gXCIke3JlZmVyZW5jZVN1cGVydHlwZU5hbWV9XCIgdG8gXCIke3Byb3Bvc2VkU3VwZXJ0eXBlTmFtZX1cIi4gVGhpcyBtYXkgb3IgbWF5IG5vdCBcclxuICAgICAgICAgIGJlIGEgYnJlYWtpbmcgY2hhbmdlLCBidXQgd2UgYXJlIHJlcG9ydGluZyBpdCBqdXN0IGluIGNhc2UuYCApO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIG1ha2Ugc3VyZSB3ZSBoYXZlIG1hdGNoaW5nIHBhcmFtZXRlciB0eXBlc1xyXG4gICAgICAgICAgY29uc3QgcmVmZXJlbmNlUGFyYW1ldGVyVHlwZXMgPSByZWZlcmVuY2VUeXBlLnBhcmFtZXRlclR5cGVzIHx8IFtdO1xyXG4gICAgICAgICAgY29uc3QgcHJvcG9zZWRQYXJhbWV0ZXJUeXBlcyA9IHByb3Bvc2VkVHlwZS5wYXJhbWV0ZXJUeXBlcztcclxuICAgICAgICAgIGlmICggIV8uaXNFcXVhbCggcmVmZXJlbmNlUGFyYW1ldGVyVHlwZXMsIHByb3Bvc2VkUGFyYW1ldGVyVHlwZXMgKSApIHtcclxuICAgICAgICAgICAgYXBwZW5kUHJvYmxlbSggYCR7dHlwZU5hbWV9IHBhcmFtZXRlciB0eXBlcyBjaGFuZ2VkIGZyb20gWyR7cmVmZXJlbmNlUGFyYW1ldGVyVHlwZXMuam9pbiggJywgJyApfV0gdG8gWyR7cHJvcG9zZWRQYXJhbWV0ZXJUeXBlcy5qb2luKCAnLCAnICl9XS4gVGhpcyBtYXkgb3IgbWF5IG5vdCBcclxuICAgICAgICAgIGJlIGEgYnJlYWtpbmcgY2hhbmdlLCBidXQgd2UgYXJlIHJlcG9ydGluZyBpdCBqdXN0IGluIGNhc2UuYCApO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFRoaXMgY2hlY2sgYXNzdW1lcyB0aGF0IGVhY2ggQVBJIHdpbGwgYmUgb2YgYSB2ZXJzaW9uIHRoYXQgaGFzIG1ldGFkYXRhRGVmYXVsdHNcclxuICAgICAgICAgIGlmICggcmVmZXJlbmNlQVBJLnZlcnNpb24gJiYgcHJvcG9zZWRBUEkudmVyc2lvbiApIHtcclxuXHJcbiAgICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlIGRlZmF1bHQgdmFsdWVzIGhhdmUgY2hhbmdlZC4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvL2lzc3Vlcy8xNzUzXHJcbiAgICAgICAgICAgIGNvbnN0IHJlZmVyZW5jZURlZmF1bHRzID0gcmVmZXJlbmNlQVBJLnBoZXRpb1R5cGVzWyB0eXBlTmFtZSBdLm1ldGFkYXRhRGVmYXVsdHM7XHJcbiAgICAgICAgICAgIGNvbnN0IHByb3Bvc2VkRGVmYXVsdHMgPSBwcm9wb3NlZEFQSS5waGV0aW9UeXBlc1sgdHlwZU5hbWUgXS5tZXRhZGF0YURlZmF1bHRzO1xyXG5cclxuICAgICAgICAgICAgT2JqZWN0LmtleXMoIHJlZmVyZW5jZURlZmF1bHRzICkuZm9yRWFjaCgga2V5ID0+IHtcclxuICAgICAgICAgICAgICBpZiAoIHJlZmVyZW5jZURlZmF1bHRzWyBrZXkgXSAhPT0gcHJvcG9zZWREZWZhdWx0c1sga2V5IF0gKSB7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcm9ibGVtKCBgJHt0eXBlTmFtZX0gbWV0YWRhdGEgdmFsdWUgJHtrZXl9IGNoYW5nZWQgZnJvbSBcIiR7cmVmZXJlbmNlRGVmYXVsdHNbIGtleSBdfVwiIHRvIFwiJHtwcm9wb3NlZERlZmF1bHRzWyBrZXkgXX1cIi4gVGhpcyBtYXkgb3IgbWF5IG5vdCBiZSBhIGJyZWFraW5nIGNoYW5nZSwgYnV0IHdlIGFyZSByZXBvcnRpbmcgaXQganVzdCBpbiBjYXNlLmAgKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBicmVha2luZ1Byb2JsZW1zOiBicmVha2luZ1Byb2JsZW1zLFxyXG4gICAgICBkZXNpZ25lZFByb2JsZW1zOiBkZXNpZ25lZFByb2JsZW1zXHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4vLyBAcHVibGljIC0gdXNlZCB0byBcInVwLWNvbnZlcnRcIiBhbiBvbGQgdmVyc2lvbmVkIEFQSSB0byB0aGUgbmV3ICh2ZXJzaW9uID49MSksIHN0cnVjdHVyZWQgdHJlZSBBUEkuXHJcbiAgX3BoZXRpb0NvbXBhcmVBUElzLnRvU3RydWN0dXJlZFRyZWUgPSB0b1N0cnVjdHVyZWRUcmVlO1xyXG5cclxuICBpZiAoIHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnICkge1xyXG5cclxuICAgIC8vIHJ1bm5pbmcgaW4gbm9kZVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBfcGhldGlvQ29tcGFyZUFQSXM7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG5cclxuICAgIHdpbmRvdy5waGV0aW8gPSB3aW5kb3cucGhldGlvIHx8IHt9O1xyXG4gICAgd2luZG93LnBoZXRpby5waGV0aW9Db21wYXJlQVBJcyA9IF9waGV0aW9Db21wYXJlQVBJcztcclxuICB9XHJcbn0gKSgpOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFFLE1BQU07RUFFTixNQUFNQSxpQkFBaUIsR0FBRyxX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