// Copyright 2019-2023, University of Colorado Boulder

/**
 * This singleton is responsible for ensuring that the PhET-iO API is correct through the lifetime of the simulation.
 * The PhET-iO API is defined through multiple preloaded files. The "elements baseline" API holds an exact match of
 * what PhetioObject instances/metadata the sim should create on startup, where the "elements overrides" file is a
 * sparse list that can overwrite metadata without changing the code. See `grunt generate-phet-io-api` for
 * more information. The complete list of checks was decided on in https://github.com/phetsims/phet-io/issues/1453
 * (and later trimmed down) and is as follows:
 *
 * 1. After startup, only dynamic instances prescribed by the baseline API can be registered.
 * 2. Any static, registered PhetioObject can never be deregistered.
 * 3. Any schema entries in the overrides file must exist in the baseline API
 * 4. Any schema entries in the overrides file must be different from its baseline counterpart
 * 5. Dynamic element metadata should match the archetype in the API.
 *
 * Terminology:
 * schema: specified through preloads. The full schema is the baseline plus the overrides, but those parts can be
 *         referred to separately.
 * registered: the process of instrumenting a PhetioObject and it "becoming" a PhET-iO Element on the wrapper side.
 * static PhetioObject: A registered PhetioObject that exists for the lifetime of the sim. It should not be removed
 *                      (even intermittently) and must be created during startup so that it is immediately interoperable.
 * dynamic PhetioObject: A registered PhetioObject that can be created and/or destroyed at any point. Only dynamic
 *                       PhetioObjects can be created after startup.
 *
 * See https://github.com/phetsims/phet-io/issues/1443#issuecomment-484306552 for an explanation of how to maintain the
 * PhET-iO API for a simulation.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */

import Tandem, { DYNAMIC_ARCHETYPE_NAME } from './Tandem.js';
import tandemNamespace from './tandemNamespace.js';
import { LinkedElement } from './PhetioObject.js';
// constants
// The API-tracked and validated metadata keys
const KEYS_TO_CHECK = ['phetioDynamicElement', 'phetioEventType', 'phetioIsArchetype', 'phetioPlayback', 'phetioReadOnly', 'phetioState', 'phetioTypeName'];

// Feel free to add any other JSONifyable keys to this to make the error more clear! All mismatches are printed
// at once for clarity, see PhetioEngine.

class PhetioAPIValidation {
  apiMismatches = [];

  // keep track of when the sim has started.
  simHasStarted = false;

  // settable by qunitStart.js. Validation is only enabled when all screens are present.
  enabled = !!assert && Tandem.VALIDATION;

  // this must be all phet-io types so that the
  // following would fail: add a phetioType, then remove it, then add a different one under the same typeName.
  // A Note about memory: Every IOType that is loaded as a module is already loaded on the namespace. Therefore
  // this map doesn't add any memory by storing these. The exception to this is parametric IOTypes. It should be
  // double checked that anything being passed into a parametric type is memory safe. As of this writing, only IOTypes
  // are passed to parametric IOTypes, so this pattern remains memory leak free. Furthermore, this list is only
  // populated when `this.enabled`.
  everyPhetioType = {};

  /**
   * Callback when the simulation is ready to go, and all static PhetioObjects have been created.
   */
  onSimStarted() {
    if (this.enabled && phet.joist.sim.allScreensCreated) {
      this.validateOverridesFile();
      this.validatePreferencesModel();
    }
    if (phet.preloads.phetio.queryParameters.phetioPrintAPIProblems && this.apiMismatches) {
      console.log('PhET-iO API problems detected: ', this.apiMismatches);
    }

    // After the overrides validation to support ?phetioPrintAPIProblems on errors with overrides.
    this.simHasStarted = true;
  }

  /**
   * All core elements in the preferencesModel should be phetioReadOnly: false so they can be set over the API
   * or from within studio, but phetioState: false so they are not captured with save states.
   */
  validatePreferencesModel() {
    Object.keys(phet.phetio.phetioEngine.phetioElementMap).filter(key => key.includes('.preferencesModel.')).forEach(preferencesKey => {
      let phetioObject = phet.phetio.phetioEngine.phetioElementMap[preferencesKey];
      while (phetioObject instanceof LinkedElement) {
        phetioObject = phetioObject.element;
      }
      assert && assert(!phetioObject.phetioReadOnly, 'preferences model and its descendants should be phetioReadOnly: false, key=' + preferencesKey);

      // Audio manager, color profile property and localeProperty are supposed to be stateful. All other preferences
      // should be phetioState: false so they are not captured in the state
      assert && assert(phetioObject.phetioState === (phetioObject.phetioID.endsWith('.colorProfileProperty') || phetioObject.phetioID.endsWith('.audioEnabledProperty') || phetioObject.phetioID.endsWith('.localeProperty') ||
      // Sim preferences should also be stateful
      preferencesKey.includes('.simulationModel.')), 'most preferences should be phetioState: false, key=' + preferencesKey);
    });
  }

  /**
   * Checks if a removed phetioObject is part of a Group
   */
  onPhetioObjectRemoved(phetioObject) {
    if (!this.enabled) {
      return;
    }
    const phetioID = phetioObject.tandem.phetioID;

    // if it isn't dynamic, then it shouldn't be removed during the lifetime of the sim.
    if (!phetioObject.phetioDynamicElement) {
      this.assertAPIError({
        phetioID: phetioID,
        ruleInViolation: '2. Any static, registered PhetioObject can never be deregistered.'
      });
    }
  }

  /**
   * Should be called from phetioEngine when a PhetioObject is added to the PhET-iO
   */
  onPhetioObjectAdded(phetioObject) {
    if (!this.enabled) {
      return;
    }
    const newPhetioType = phetioObject.phetioType;
    const oldPhetioType = this.everyPhetioType[newPhetioType.typeName];
    if (!oldPhetioType) {
      // This may not be necessary, but may be helpful so that we don't overwrite if rule 10 is in violation
      this.everyPhetioType[newPhetioType.typeName] = newPhetioType;
    }
    if (this.simHasStarted) {
      // Here we need to kick this validation to the next frame to support construction in any order. Parent first, or
      // child first. Use namespace to avoid because timer is a PhetioObject.
      phet.axon.animationFrameTimer.runOnNextTick(() => {
        // The only instances that it's OK to create after startup are "dynamic instances" which are marked as such.
        if (!phetioObject.phetioDynamicElement) {
          this.assertAPIError({
            phetioID: phetioObject.tandem.phetioID,
            ruleInViolation: '1. After startup, only dynamic instances prescribed by the baseline file can be registered.'
          });
        } else {
          // Compare the dynamic element to the archetype if creating them this runtime. Don't check this if it has
          // already been disposed.
          if (phet.preloads.phetio.createArchetypes && !phetioObject.isDisposed) {
            const archetypeID = phetioObject.tandem.getArchetypalPhetioID();
            const archetypeMetadata = phet.phetio.phetioEngine.getPhetioElement(archetypeID).getMetadata();

            // Compare to the simulation-defined archetype
            this.checkDynamicInstanceAgainstArchetype(phetioObject, archetypeMetadata, 'simulation archetype');
          }
        }
      });
    }
  }
  validateOverridesFile() {
    // import phetioEngine causes a cycle and cannot be used, hence we must use the namespace
    const entireBaseline = phet.phetio.phetioEngine.getPhetioElementsBaseline();
    for (const phetioID in window.phet.preloads.phetio.phetioElementsOverrides) {
      const isArchetype = phetioID.includes(DYNAMIC_ARCHETYPE_NAME);
      if (!phet.preloads.phetio.createArchetypes && !entireBaseline.hasOwnProperty(phetioID)) {
        assert && assert(isArchetype, `phetioID missing from the baseline that was not an archetype: ${phetioID}`);
      } else {
        if (!entireBaseline.hasOwnProperty(phetioID)) {
          this.assertAPIError({
            phetioID: phetioID,
            ruleInViolation: '3. Any schema entries in the overrides file must exist in the baseline file.',
            message: 'phetioID expected in the baseline file but does not exist'
          });
        } else {
          const override = window.phet.preloads.phetio.phetioElementsOverrides[phetioID];
          const baseline = entireBaseline[phetioID];
          if (Object.keys(override).length === 0) {
            this.assertAPIError({
              phetioID: phetioID,
              ruleInViolation: '4. Any schema entries in the overrides file must be different from its baseline counterpart.',
              message: 'no metadata keys found for this override.'
            });
          }
          for (const metadataKey in override) {
            if (!baseline.hasOwnProperty(metadataKey)) {
              this.assertAPIError({
                phetioID: phetioID,
                ruleInViolation: '8. Any schema entries in the overrides file must be different from its baseline counterpart.',
                message: `phetioID metadata key not found in the baseline: ${metadataKey}`
              });
            }
            if (override[metadataKey] === baseline[metadataKey]) {
              this.assertAPIError({
                phetioID: phetioID,
                ruleInViolation: '8. Any schema entries in the overrides file must be different from its baseline counterpart.',
                message: 'phetioID metadata override value is the same as the corresponding metadata value in the baseline.'
              });
            }
          }
        }
      }
    }
  }

  /**
   * Assert out the failed API validation rule.
   */
  assertAPIError(apiErrorObject) {
    const mismatchMessage = apiErrorObject.phetioID ? `${apiErrorObject.phetioID}:  ${apiErrorObject.ruleInViolation}` : `${apiErrorObject.ruleInViolation}`;
    this.apiMismatches.push(apiErrorObject);

    // If ?phetioPrintAPIProblems is present, then ignore assertions until the sim has started up.
    if (this.simHasStarted || !phet.preloads.phetio.queryParameters.phetioPrintAPIProblems) {
      assert && assert(false, `PhET-iO API error:\n${mismatchMessage}`);
    }
  }

  /**
   * Compare a dynamic phetioObject's metadata to the expected metadata
   */
  checkDynamicInstanceAgainstArchetype(phetioObject, archetypeMetadata, source) {
    const actualMetadata = phetioObject.getMetadata();
    KEYS_TO_CHECK.forEach(key => {
      // These attributes are different for archetype vs actual
      if (key !== 'phetioDynamicElement' && key !== 'phetioArchetypePhetioID' && key !== 'phetioIsArchetype') {
        // @ts-expect-error - not sure how to be typesafe in the API files
        if (archetypeMetadata[key] !== actualMetadata[key] && phetioObject.tandem) {
          this.assertAPIError({
            phetioID: phetioObject.tandem.phetioID,
            ruleInViolation: '5. Dynamic element metadata should match the archetype in the API.',
            source: source,
            message: `mismatched metadata: ${key}`
          });
        }
      }
    });
  }
}
const phetioAPIValidation = new PhetioAPIValidation();
tandemNamespace.register('phetioAPIValidation', phetioAPIValidation);
export default phetioAPIValidation;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUYW5kZW0iLCJEWU5BTUlDX0FSQ0hFVFlQRV9OQU1FIiwidGFuZGVtTmFtZXNwYWNlIiwiTGlua2VkRWxlbWVudCIsIktFWVNfVE9fQ0hFQ0siLCJQaGV0aW9BUElWYWxpZGF0aW9uIiwiYXBpTWlzbWF0Y2hlcyIsInNpbUhhc1N0YXJ0ZWQiLCJlbmFibGVkIiwiYXNzZXJ0IiwiVkFMSURBVElPTiIsImV2ZXJ5UGhldGlvVHlwZSIsIm9uU2ltU3RhcnRlZCIsInBoZXQiLCJqb2lzdCIsInNpbSIsImFsbFNjcmVlbnNDcmVhdGVkIiwidmFsaWRhdGVPdmVycmlkZXNGaWxlIiwidmFsaWRhdGVQcmVmZXJlbmNlc01vZGVsIiwicHJlbG9hZHMiLCJwaGV0aW8iLCJxdWVyeVBhcmFtZXRlcnMiLCJwaGV0aW9QcmludEFQSVByb2JsZW1zIiwiY29uc29sZSIsImxvZyIsIk9iamVjdCIsImtleXMiLCJwaGV0aW9FbmdpbmUiLCJwaGV0aW9FbGVtZW50TWFwIiwiZmlsdGVyIiwia2V5IiwiaW5jbHVkZXMiLCJmb3JFYWNoIiwicHJlZmVyZW5jZXNLZXkiLCJwaGV0aW9PYmplY3QiLCJlbGVtZW50IiwicGhldGlvUmVhZE9ubHkiLCJwaGV0aW9TdGF0ZSIsInBoZXRpb0lEIiwiZW5kc1dpdGgiLCJvblBoZXRpb09iamVjdFJlbW92ZWQiLCJ0YW5kZW0iLCJwaGV0aW9EeW5hbWljRWxlbWVudCIsImFzc2VydEFQSUVycm9yIiwicnVsZUluVmlvbGF0aW9uIiwib25QaGV0aW9PYmplY3RBZGRlZCIsIm5ld1BoZXRpb1R5cGUiLCJwaGV0aW9UeXBlIiwib2xkUGhldGlvVHlwZSIsInR5cGVOYW1lIiwiYXhvbiIsImFuaW1hdGlvbkZyYW1lVGltZXIiLCJydW5Pbk5leHRUaWNrIiwiY3JlYXRlQXJjaGV0eXBlcyIsImlzRGlzcG9zZWQiLCJhcmNoZXR5cGVJRCIsImdldEFyY2hldHlwYWxQaGV0aW9JRCIsImFyY2hldHlwZU1ldGFkYXRhIiwiZ2V0UGhldGlvRWxlbWVudCIsImdldE1ldGFkYXRhIiwiY2hlY2tEeW5hbWljSW5zdGFuY2VBZ2FpbnN0QXJjaGV0eXBlIiwiZW50aXJlQmFzZWxpbmUiLCJnZXRQaGV0aW9FbGVtZW50c0Jhc2VsaW5lIiwid2luZG93IiwicGhldGlvRWxlbWVudHNPdmVycmlkZXMiLCJpc0FyY2hldHlwZSIsImhhc093blByb3BlcnR5IiwibWVzc2FnZSIsIm92ZXJyaWRlIiwiYmFzZWxpbmUiLCJsZW5ndGgiLCJtZXRhZGF0YUtleSIsImFwaUVycm9yT2JqZWN0IiwibWlzbWF0Y2hNZXNzYWdlIiwicHVzaCIsInNvdXJjZSIsImFjdHVhbE1ldGFkYXRhIiwicGhldGlvQVBJVmFsaWRhdGlvbiIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsicGhldGlvQVBJVmFsaWRhdGlvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOS0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBUaGlzIHNpbmdsZXRvbiBpcyByZXNwb25zaWJsZSBmb3IgZW5zdXJpbmcgdGhhdCB0aGUgUGhFVC1pTyBBUEkgaXMgY29ycmVjdCB0aHJvdWdoIHRoZSBsaWZldGltZSBvZiB0aGUgc2ltdWxhdGlvbi5cclxuICogVGhlIFBoRVQtaU8gQVBJIGlzIGRlZmluZWQgdGhyb3VnaCBtdWx0aXBsZSBwcmVsb2FkZWQgZmlsZXMuIFRoZSBcImVsZW1lbnRzIGJhc2VsaW5lXCIgQVBJIGhvbGRzIGFuIGV4YWN0IG1hdGNoIG9mXHJcbiAqIHdoYXQgUGhldGlvT2JqZWN0IGluc3RhbmNlcy9tZXRhZGF0YSB0aGUgc2ltIHNob3VsZCBjcmVhdGUgb24gc3RhcnR1cCwgd2hlcmUgdGhlIFwiZWxlbWVudHMgb3ZlcnJpZGVzXCIgZmlsZSBpcyBhXHJcbiAqIHNwYXJzZSBsaXN0IHRoYXQgY2FuIG92ZXJ3cml0ZSBtZXRhZGF0YSB3aXRob3V0IGNoYW5naW5nIHRoZSBjb2RlLiBTZWUgYGdydW50IGdlbmVyYXRlLXBoZXQtaW8tYXBpYCBmb3JcclxuICogbW9yZSBpbmZvcm1hdGlvbi4gVGhlIGNvbXBsZXRlIGxpc3Qgb2YgY2hlY2tzIHdhcyBkZWNpZGVkIG9uIGluIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvL2lzc3Vlcy8xNDUzXHJcbiAqIChhbmQgbGF0ZXIgdHJpbW1lZCBkb3duKSBhbmQgaXMgYXMgZm9sbG93czpcclxuICpcclxuICogMS4gQWZ0ZXIgc3RhcnR1cCwgb25seSBkeW5hbWljIGluc3RhbmNlcyBwcmVzY3JpYmVkIGJ5IHRoZSBiYXNlbGluZSBBUEkgY2FuIGJlIHJlZ2lzdGVyZWQuXHJcbiAqIDIuIEFueSBzdGF0aWMsIHJlZ2lzdGVyZWQgUGhldGlvT2JqZWN0IGNhbiBuZXZlciBiZSBkZXJlZ2lzdGVyZWQuXHJcbiAqIDMuIEFueSBzY2hlbWEgZW50cmllcyBpbiB0aGUgb3ZlcnJpZGVzIGZpbGUgbXVzdCBleGlzdCBpbiB0aGUgYmFzZWxpbmUgQVBJXHJcbiAqIDQuIEFueSBzY2hlbWEgZW50cmllcyBpbiB0aGUgb3ZlcnJpZGVzIGZpbGUgbXVzdCBiZSBkaWZmZXJlbnQgZnJvbSBpdHMgYmFzZWxpbmUgY291bnRlcnBhcnRcclxuICogNS4gRHluYW1pYyBlbGVtZW50IG1ldGFkYXRhIHNob3VsZCBtYXRjaCB0aGUgYXJjaGV0eXBlIGluIHRoZSBBUEkuXHJcbiAqXHJcbiAqIFRlcm1pbm9sb2d5OlxyXG4gKiBzY2hlbWE6IHNwZWNpZmllZCB0aHJvdWdoIHByZWxvYWRzLiBUaGUgZnVsbCBzY2hlbWEgaXMgdGhlIGJhc2VsaW5lIHBsdXMgdGhlIG92ZXJyaWRlcywgYnV0IHRob3NlIHBhcnRzIGNhbiBiZVxyXG4gKiAgICAgICAgIHJlZmVycmVkIHRvIHNlcGFyYXRlbHkuXHJcbiAqIHJlZ2lzdGVyZWQ6IHRoZSBwcm9jZXNzIG9mIGluc3RydW1lbnRpbmcgYSBQaGV0aW9PYmplY3QgYW5kIGl0IFwiYmVjb21pbmdcIiBhIFBoRVQtaU8gRWxlbWVudCBvbiB0aGUgd3JhcHBlciBzaWRlLlxyXG4gKiBzdGF0aWMgUGhldGlvT2JqZWN0OiBBIHJlZ2lzdGVyZWQgUGhldGlvT2JqZWN0IHRoYXQgZXhpc3RzIGZvciB0aGUgbGlmZXRpbWUgb2YgdGhlIHNpbS4gSXQgc2hvdWxkIG5vdCBiZSByZW1vdmVkXHJcbiAqICAgICAgICAgICAgICAgICAgICAgIChldmVuIGludGVybWl0dGVudGx5KSBhbmQgbXVzdCBiZSBjcmVhdGVkIGR1cmluZyBzdGFydHVwIHNvIHRoYXQgaXQgaXMgaW1tZWRpYXRlbHkgaW50ZXJvcGVyYWJsZS5cclxuICogZHluYW1pYyBQaGV0aW9PYmplY3Q6IEEgcmVnaXN0ZXJlZCBQaGV0aW9PYmplY3QgdGhhdCBjYW4gYmUgY3JlYXRlZCBhbmQvb3IgZGVzdHJveWVkIGF0IGFueSBwb2ludC4gT25seSBkeW5hbWljXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICBQaGV0aW9PYmplY3RzIGNhbiBiZSBjcmVhdGVkIGFmdGVyIHN0YXJ0dXAuXHJcbiAqXHJcbiAqIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvMTQ0MyNpc3N1ZWNvbW1lbnQtNDg0MzA2NTUyIGZvciBhbiBleHBsYW5hdGlvbiBvZiBob3cgdG8gbWFpbnRhaW4gdGhlXHJcbiAqIFBoRVQtaU8gQVBJIGZvciBhIHNpbXVsYXRpb24uXHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBDaHJpcyBLbHVzZW5kb3JmIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBUYW5kZW0sIHsgRFlOQU1JQ19BUkNIRVRZUEVfTkFNRSB9IGZyb20gJy4vVGFuZGVtLmpzJztcclxuaW1wb3J0IHRhbmRlbU5hbWVzcGFjZSBmcm9tICcuL3RhbmRlbU5hbWVzcGFjZS5qcyc7XHJcbmltcG9ydCBJT1R5cGUgZnJvbSAnLi90eXBlcy9JT1R5cGUuanMnO1xyXG5pbXBvcnQgUGhldGlvT2JqZWN0LCB7IExpbmtlZEVsZW1lbnQgfSBmcm9tICcuL1BoZXRpb09iamVjdC5qcyc7XHJcbmltcG9ydCB7IFBoZXRpb0VsZW1lbnRNZXRhZGF0YSwgUGhldGlvSUQgfSBmcm9tICcuL1RhbmRlbUNvbnN0YW50cy5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuLy8gVGhlIEFQSS10cmFja2VkIGFuZCB2YWxpZGF0ZWQgbWV0YWRhdGEga2V5c1xyXG5jb25zdCBLRVlTX1RPX0NIRUNLID0gW1xyXG4gICdwaGV0aW9EeW5hbWljRWxlbWVudCcsXHJcbiAgJ3BoZXRpb0V2ZW50VHlwZScsXHJcbiAgJ3BoZXRpb0lzQXJjaGV0eXBlJyxcclxuICAncGhldGlvUGxheWJhY2snLFxyXG4gICdwaGV0aW9SZWFkT25seScsXHJcbiAgJ3BoZXRpb1N0YXRlJyxcclxuICAncGhldGlvVHlwZU5hbWUnXHJcbl07XHJcblxyXG4vLyBGZWVsIGZyZWUgdG8gYWRkIGFueSBvdGhlciBKU09OaWZ5YWJsZSBrZXlzIHRvIHRoaXMgdG8gbWFrZSB0aGUgZXJyb3IgbW9yZSBjbGVhciEgQWxsIG1pc21hdGNoZXMgYXJlIHByaW50ZWRcclxuLy8gYXQgb25jZSBmb3IgY2xhcml0eSwgc2VlIFBoZXRpb0VuZ2luZS5cclxudHlwZSBBUElNaXNtYXRjaCA9IHtcclxuICBwaGV0aW9JRDogUGhldGlvSUQ7XHJcbiAgcnVsZUluVmlvbGF0aW9uOiBzdHJpbmc7IC8vIG9uZSBvZiB0aGUgbnVtYmVyZWQgbGlzdCBpbiB0aGUgaGVhZGVyIGRvYy5cclxuICBtZXNzYWdlPzogc3RyaW5nOyAvLyBzcGVjaWZpYyBwcm9ibGVtXHJcbiAgc291cmNlPzogc3RyaW5nO1xyXG59O1xyXG5cclxuY2xhc3MgUGhldGlvQVBJVmFsaWRhdGlvbiB7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBhcGlNaXNtYXRjaGVzOiBBUElNaXNtYXRjaFtdID0gW107XHJcblxyXG4gIC8vIGtlZXAgdHJhY2sgb2Ygd2hlbiB0aGUgc2ltIGhhcyBzdGFydGVkLlxyXG4gIHByaXZhdGUgc2ltSGFzU3RhcnRlZCA9IGZhbHNlO1xyXG5cclxuICAvLyBzZXR0YWJsZSBieSBxdW5pdFN0YXJ0LmpzLiBWYWxpZGF0aW9uIGlzIG9ubHkgZW5hYmxlZCB3aGVuIGFsbCBzY3JlZW5zIGFyZSBwcmVzZW50LlxyXG4gIHB1YmxpYyBlbmFibGVkOiBib29sZWFuID0gISFhc3NlcnQgJiYgVGFuZGVtLlZBTElEQVRJT047XHJcblxyXG5cclxuICAvLyB0aGlzIG11c3QgYmUgYWxsIHBoZXQtaW8gdHlwZXMgc28gdGhhdCB0aGVcclxuICAvLyBmb2xsb3dpbmcgd291bGQgZmFpbDogYWRkIGEgcGhldGlvVHlwZSwgdGhlbiByZW1vdmUgaXQsIHRoZW4gYWRkIGEgZGlmZmVyZW50IG9uZSB1bmRlciB0aGUgc2FtZSB0eXBlTmFtZS5cclxuICAvLyBBIE5vdGUgYWJvdXQgbWVtb3J5OiBFdmVyeSBJT1R5cGUgdGhhdCBpcyBsb2FkZWQgYXMgYSBtb2R1bGUgaXMgYWxyZWFkeSBsb2FkZWQgb24gdGhlIG5hbWVzcGFjZS4gVGhlcmVmb3JlXHJcbiAgLy8gdGhpcyBtYXAgZG9lc24ndCBhZGQgYW55IG1lbW9yeSBieSBzdG9yaW5nIHRoZXNlLiBUaGUgZXhjZXB0aW9uIHRvIHRoaXMgaXMgcGFyYW1ldHJpYyBJT1R5cGVzLiBJdCBzaG91bGQgYmVcclxuICAvLyBkb3VibGUgY2hlY2tlZCB0aGF0IGFueXRoaW5nIGJlaW5nIHBhc3NlZCBpbnRvIGEgcGFyYW1ldHJpYyB0eXBlIGlzIG1lbW9yeSBzYWZlLiBBcyBvZiB0aGlzIHdyaXRpbmcsIG9ubHkgSU9UeXBlc1xyXG4gIC8vIGFyZSBwYXNzZWQgdG8gcGFyYW1ldHJpYyBJT1R5cGVzLCBzbyB0aGlzIHBhdHRlcm4gcmVtYWlucyBtZW1vcnkgbGVhayBmcmVlLiBGdXJ0aGVybW9yZSwgdGhpcyBsaXN0IGlzIG9ubHlcclxuICAvLyBwb3B1bGF0ZWQgd2hlbiBgdGhpcy5lbmFibGVkYC5cclxuICBwcml2YXRlIGV2ZXJ5UGhldGlvVHlwZTogUmVjb3JkPHN0cmluZywgSU9UeXBlPiA9IHt9O1xyXG5cclxuICAvKipcclxuICAgKiBDYWxsYmFjayB3aGVuIHRoZSBzaW11bGF0aW9uIGlzIHJlYWR5IHRvIGdvLCBhbmQgYWxsIHN0YXRpYyBQaGV0aW9PYmplY3RzIGhhdmUgYmVlbiBjcmVhdGVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBvblNpbVN0YXJ0ZWQoKTogdm9pZCB7XHJcbiAgICBpZiAoIHRoaXMuZW5hYmxlZCAmJiBwaGV0LmpvaXN0LnNpbS5hbGxTY3JlZW5zQ3JlYXRlZCApIHtcclxuICAgICAgdGhpcy52YWxpZGF0ZU92ZXJyaWRlc0ZpbGUoKTtcclxuICAgICAgdGhpcy52YWxpZGF0ZVByZWZlcmVuY2VzTW9kZWwoKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHBoZXQucHJlbG9hZHMucGhldGlvLnF1ZXJ5UGFyYW1ldGVycy5waGV0aW9QcmludEFQSVByb2JsZW1zICYmIHRoaXMuYXBpTWlzbWF0Y2hlcyApIHtcclxuICAgICAgY29uc29sZS5sb2coICdQaEVULWlPIEFQSSBwcm9ibGVtcyBkZXRlY3RlZDogJywgdGhpcy5hcGlNaXNtYXRjaGVzICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWZ0ZXIgdGhlIG92ZXJyaWRlcyB2YWxpZGF0aW9uIHRvIHN1cHBvcnQgP3BoZXRpb1ByaW50QVBJUHJvYmxlbXMgb24gZXJyb3JzIHdpdGggb3ZlcnJpZGVzLlxyXG4gICAgdGhpcy5zaW1IYXNTdGFydGVkID0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFsbCBjb3JlIGVsZW1lbnRzIGluIHRoZSBwcmVmZXJlbmNlc01vZGVsIHNob3VsZCBiZSBwaGV0aW9SZWFkT25seTogZmFsc2Ugc28gdGhleSBjYW4gYmUgc2V0IG92ZXIgdGhlIEFQSVxyXG4gICAqIG9yIGZyb20gd2l0aGluIHN0dWRpbywgYnV0IHBoZXRpb1N0YXRlOiBmYWxzZSBzbyB0aGV5IGFyZSBub3QgY2FwdHVyZWQgd2l0aCBzYXZlIHN0YXRlcy5cclxuICAgKi9cclxuICBwdWJsaWMgdmFsaWRhdGVQcmVmZXJlbmNlc01vZGVsKCk6IHZvaWQge1xyXG4gICAgT2JqZWN0LmtleXMoIHBoZXQucGhldGlvLnBoZXRpb0VuZ2luZS5waGV0aW9FbGVtZW50TWFwICkuZmlsdGVyKCBrZXkgPT4ga2V5LmluY2x1ZGVzKCAnLnByZWZlcmVuY2VzTW9kZWwuJyApIClcclxuICAgICAgLmZvckVhY2goIHByZWZlcmVuY2VzS2V5ID0+IHtcclxuXHJcbiAgICAgICAgbGV0IHBoZXRpb09iamVjdCA9IHBoZXQucGhldGlvLnBoZXRpb0VuZ2luZS5waGV0aW9FbGVtZW50TWFwWyBwcmVmZXJlbmNlc0tleSBdO1xyXG5cclxuICAgICAgICB3aGlsZSAoIHBoZXRpb09iamVjdCBpbnN0YW5jZW9mIExpbmtlZEVsZW1lbnQgKSB7XHJcbiAgICAgICAgICBwaGV0aW9PYmplY3QgPSBwaGV0aW9PYmplY3QuZWxlbWVudDtcclxuICAgICAgICB9XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggIXBoZXRpb09iamVjdC5waGV0aW9SZWFkT25seSwgJ3ByZWZlcmVuY2VzIG1vZGVsIGFuZCBpdHMgZGVzY2VuZGFudHMgc2hvdWxkIGJlIHBoZXRpb1JlYWRPbmx5OiBmYWxzZSwga2V5PScgKyBwcmVmZXJlbmNlc0tleSApO1xyXG5cclxuICAgICAgICAvLyBBdWRpbyBtYW5hZ2VyLCBjb2xvciBwcm9maWxlIHByb3BlcnR5IGFuZCBsb2NhbGVQcm9wZXJ0eSBhcmUgc3VwcG9zZWQgdG8gYmUgc3RhdGVmdWwuIEFsbCBvdGhlciBwcmVmZXJlbmNlc1xyXG4gICAgICAgIC8vIHNob3VsZCBiZSBwaGV0aW9TdGF0ZTogZmFsc2Ugc28gdGhleSBhcmUgbm90IGNhcHR1cmVkIGluIHRoZSBzdGF0ZVxyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHBoZXRpb09iamVjdC5waGV0aW9TdGF0ZSA9PT1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAoIHBoZXRpb09iamVjdC5waGV0aW9JRC5lbmRzV2l0aCggJy5jb2xvclByb2ZpbGVQcm9wZXJ0eScgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGhldGlvT2JqZWN0LnBoZXRpb0lELmVuZHNXaXRoKCAnLmF1ZGlvRW5hYmxlZFByb3BlcnR5JyApIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaGV0aW9PYmplY3QucGhldGlvSUQuZW5kc1dpdGgoICcubG9jYWxlUHJvcGVydHknICkgfHxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTaW0gcHJlZmVyZW5jZXMgc2hvdWxkIGFsc28gYmUgc3RhdGVmdWxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZWZlcmVuY2VzS2V5LmluY2x1ZGVzKCAnLnNpbXVsYXRpb25Nb2RlbC4nICkgKSxcclxuICAgICAgICAgICdtb3N0IHByZWZlcmVuY2VzIHNob3VsZCBiZSBwaGV0aW9TdGF0ZTogZmFsc2UsIGtleT0nICsgcHJlZmVyZW5jZXNLZXkgKTtcclxuICAgICAgfSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2hlY2tzIGlmIGEgcmVtb3ZlZCBwaGV0aW9PYmplY3QgaXMgcGFydCBvZiBhIEdyb3VwXHJcbiAgICovXHJcbiAgcHVibGljIG9uUGhldGlvT2JqZWN0UmVtb3ZlZCggcGhldGlvT2JqZWN0OiBQaGV0aW9PYmplY3QgKTogdm9pZCB7XHJcbiAgICBpZiAoICF0aGlzLmVuYWJsZWQgKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwaGV0aW9JRCA9IHBoZXRpb09iamVjdC50YW5kZW0ucGhldGlvSUQ7XHJcblxyXG4gICAgLy8gaWYgaXQgaXNuJ3QgZHluYW1pYywgdGhlbiBpdCBzaG91bGRuJ3QgYmUgcmVtb3ZlZCBkdXJpbmcgdGhlIGxpZmV0aW1lIG9mIHRoZSBzaW0uXHJcbiAgICBpZiAoICFwaGV0aW9PYmplY3QucGhldGlvRHluYW1pY0VsZW1lbnQgKSB7XHJcbiAgICAgIHRoaXMuYXNzZXJ0QVBJRXJyb3IoIHtcclxuICAgICAgICBwaGV0aW9JRDogcGhldGlvSUQsXHJcbiAgICAgICAgcnVsZUluVmlvbGF0aW9uOiAnMi4gQW55IHN0YXRpYywgcmVnaXN0ZXJlZCBQaGV0aW9PYmplY3QgY2FuIG5ldmVyIGJlIGRlcmVnaXN0ZXJlZC4nXHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNob3VsZCBiZSBjYWxsZWQgZnJvbSBwaGV0aW9FbmdpbmUgd2hlbiBhIFBoZXRpb09iamVjdCBpcyBhZGRlZCB0byB0aGUgUGhFVC1pT1xyXG4gICAqL1xyXG4gIHB1YmxpYyBvblBoZXRpb09iamVjdEFkZGVkKCBwaGV0aW9PYmplY3Q6IFBoZXRpb09iamVjdCApOiB2b2lkIHtcclxuICAgIGlmICggIXRoaXMuZW5hYmxlZCApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG5ld1BoZXRpb1R5cGUgPSBwaGV0aW9PYmplY3QucGhldGlvVHlwZTtcclxuICAgIGNvbnN0IG9sZFBoZXRpb1R5cGUgPSB0aGlzLmV2ZXJ5UGhldGlvVHlwZVsgbmV3UGhldGlvVHlwZS50eXBlTmFtZSBdO1xyXG5cclxuICAgIGlmICggIW9sZFBoZXRpb1R5cGUgKSB7IC8vIFRoaXMgbWF5IG5vdCBiZSBuZWNlc3NhcnksIGJ1dCBtYXkgYmUgaGVscGZ1bCBzbyB0aGF0IHdlIGRvbid0IG92ZXJ3cml0ZSBpZiBydWxlIDEwIGlzIGluIHZpb2xhdGlvblxyXG4gICAgICB0aGlzLmV2ZXJ5UGhldGlvVHlwZVsgbmV3UGhldGlvVHlwZS50eXBlTmFtZSBdID0gbmV3UGhldGlvVHlwZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHRoaXMuc2ltSGFzU3RhcnRlZCApIHtcclxuXHJcbiAgICAgIC8vIEhlcmUgd2UgbmVlZCB0byBraWNrIHRoaXMgdmFsaWRhdGlvbiB0byB0aGUgbmV4dCBmcmFtZSB0byBzdXBwb3J0IGNvbnN0cnVjdGlvbiBpbiBhbnkgb3JkZXIuIFBhcmVudCBmaXJzdCwgb3JcclxuICAgICAgLy8gY2hpbGQgZmlyc3QuIFVzZSBuYW1lc3BhY2UgdG8gYXZvaWQgYmVjYXVzZSB0aW1lciBpcyBhIFBoZXRpb09iamVjdC5cclxuICAgICAgcGhldC5heG9uLmFuaW1hdGlvbkZyYW1lVGltZXIucnVuT25OZXh0VGljayggKCkgPT4ge1xyXG5cclxuICAgICAgICAvLyBUaGUgb25seSBpbnN0YW5jZXMgdGhhdCBpdCdzIE9LIHRvIGNyZWF0ZSBhZnRlciBzdGFydHVwIGFyZSBcImR5bmFtaWMgaW5zdGFuY2VzXCIgd2hpY2ggYXJlIG1hcmtlZCBhcyBzdWNoLlxyXG4gICAgICAgIGlmICggIXBoZXRpb09iamVjdC5waGV0aW9EeW5hbWljRWxlbWVudCApIHtcclxuICAgICAgICAgIHRoaXMuYXNzZXJ0QVBJRXJyb3IoIHtcclxuICAgICAgICAgICAgcGhldGlvSUQ6IHBoZXRpb09iamVjdC50YW5kZW0ucGhldGlvSUQsXHJcbiAgICAgICAgICAgIHJ1bGVJblZpb2xhdGlvbjogJzEuIEFmdGVyIHN0YXJ0dXAsIG9ubHkgZHluYW1pYyBpbnN0YW5jZXMgcHJlc2NyaWJlZCBieSB0aGUgYmFzZWxpbmUgZmlsZSBjYW4gYmUgcmVnaXN0ZXJlZC4nXHJcbiAgICAgICAgICB9ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICAgIC8vIENvbXBhcmUgdGhlIGR5bmFtaWMgZWxlbWVudCB0byB0aGUgYXJjaGV0eXBlIGlmIGNyZWF0aW5nIHRoZW0gdGhpcyBydW50aW1lLiBEb24ndCBjaGVjayB0aGlzIGlmIGl0IGhhc1xyXG4gICAgICAgICAgLy8gYWxyZWFkeSBiZWVuIGRpc3Bvc2VkLlxyXG4gICAgICAgICAgaWYgKCBwaGV0LnByZWxvYWRzLnBoZXRpby5jcmVhdGVBcmNoZXR5cGVzICYmICFwaGV0aW9PYmplY3QuaXNEaXNwb3NlZCApIHtcclxuICAgICAgICAgICAgY29uc3QgYXJjaGV0eXBlSUQgPSBwaGV0aW9PYmplY3QudGFuZGVtLmdldEFyY2hldHlwYWxQaGV0aW9JRCgpO1xyXG4gICAgICAgICAgICBjb25zdCBhcmNoZXR5cGVNZXRhZGF0YSA9IHBoZXQucGhldGlvLnBoZXRpb0VuZ2luZS5nZXRQaGV0aW9FbGVtZW50KCBhcmNoZXR5cGVJRCApLmdldE1ldGFkYXRhKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBDb21wYXJlIHRvIHRoZSBzaW11bGF0aW9uLWRlZmluZWQgYXJjaGV0eXBlXHJcbiAgICAgICAgICAgIHRoaXMuY2hlY2tEeW5hbWljSW5zdGFuY2VBZ2FpbnN0QXJjaGV0eXBlKCBwaGV0aW9PYmplY3QsIGFyY2hldHlwZU1ldGFkYXRhLCAnc2ltdWxhdGlvbiBhcmNoZXR5cGUnICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHZhbGlkYXRlT3ZlcnJpZGVzRmlsZSgpOiB2b2lkIHtcclxuXHJcbiAgICAvLyBpbXBvcnQgcGhldGlvRW5naW5lIGNhdXNlcyBhIGN5Y2xlIGFuZCBjYW5ub3QgYmUgdXNlZCwgaGVuY2Ugd2UgbXVzdCB1c2UgdGhlIG5hbWVzcGFjZVxyXG4gICAgY29uc3QgZW50aXJlQmFzZWxpbmUgPSBwaGV0LnBoZXRpby5waGV0aW9FbmdpbmUuZ2V0UGhldGlvRWxlbWVudHNCYXNlbGluZSgpO1xyXG5cclxuICAgIGZvciAoIGNvbnN0IHBoZXRpb0lEIGluIHdpbmRvdy5waGV0LnByZWxvYWRzLnBoZXRpby5waGV0aW9FbGVtZW50c092ZXJyaWRlcyApIHtcclxuICAgICAgY29uc3QgaXNBcmNoZXR5cGUgPSBwaGV0aW9JRC5pbmNsdWRlcyggRFlOQU1JQ19BUkNIRVRZUEVfTkFNRSApO1xyXG4gICAgICBpZiAoICFwaGV0LnByZWxvYWRzLnBoZXRpby5jcmVhdGVBcmNoZXR5cGVzICYmICFlbnRpcmVCYXNlbGluZS5oYXNPd25Qcm9wZXJ0eSggcGhldGlvSUQgKSApIHtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0FyY2hldHlwZSwgYHBoZXRpb0lEIG1pc3NpbmcgZnJvbSB0aGUgYmFzZWxpbmUgdGhhdCB3YXMgbm90IGFuIGFyY2hldHlwZTogJHtwaGV0aW9JRH1gICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgaWYgKCAhZW50aXJlQmFzZWxpbmUuaGFzT3duUHJvcGVydHkoIHBoZXRpb0lEICkgKSB7XHJcbiAgICAgICAgICB0aGlzLmFzc2VydEFQSUVycm9yKCB7XHJcbiAgICAgICAgICAgIHBoZXRpb0lEOiBwaGV0aW9JRCxcclxuICAgICAgICAgICAgcnVsZUluVmlvbGF0aW9uOiAnMy4gQW55IHNjaGVtYSBlbnRyaWVzIGluIHRoZSBvdmVycmlkZXMgZmlsZSBtdXN0IGV4aXN0IGluIHRoZSBiYXNlbGluZSBmaWxlLicsXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdwaGV0aW9JRCBleHBlY3RlZCBpbiB0aGUgYmFzZWxpbmUgZmlsZSBidXQgZG9lcyBub3QgZXhpc3QnXHJcbiAgICAgICAgICB9ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICAgIGNvbnN0IG92ZXJyaWRlID0gd2luZG93LnBoZXQucHJlbG9hZHMucGhldGlvLnBoZXRpb0VsZW1lbnRzT3ZlcnJpZGVzWyBwaGV0aW9JRCBdO1xyXG4gICAgICAgICAgY29uc3QgYmFzZWxpbmUgPSBlbnRpcmVCYXNlbGluZVsgcGhldGlvSUQgXTtcclxuXHJcbiAgICAgICAgICBpZiAoIE9iamVjdC5rZXlzKCBvdmVycmlkZSApLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgICAgICAgdGhpcy5hc3NlcnRBUElFcnJvcigge1xyXG4gICAgICAgICAgICAgIHBoZXRpb0lEOiBwaGV0aW9JRCxcclxuICAgICAgICAgICAgICBydWxlSW5WaW9sYXRpb246ICc0LiBBbnkgc2NoZW1hIGVudHJpZXMgaW4gdGhlIG92ZXJyaWRlcyBmaWxlIG11c3QgYmUgZGlmZmVyZW50IGZyb20gaXRzIGJhc2VsaW5lIGNvdW50ZXJwYXJ0LicsXHJcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ25vIG1ldGFkYXRhIGtleXMgZm91bmQgZm9yIHRoaXMgb3ZlcnJpZGUuJ1xyXG4gICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgZm9yICggY29uc3QgbWV0YWRhdGFLZXkgaW4gb3ZlcnJpZGUgKSB7XHJcbiAgICAgICAgICAgIGlmICggIWJhc2VsaW5lLmhhc093blByb3BlcnR5KCBtZXRhZGF0YUtleSApICkge1xyXG4gICAgICAgICAgICAgIHRoaXMuYXNzZXJ0QVBJRXJyb3IoIHtcclxuICAgICAgICAgICAgICAgIHBoZXRpb0lEOiBwaGV0aW9JRCxcclxuICAgICAgICAgICAgICAgIHJ1bGVJblZpb2xhdGlvbjogJzguIEFueSBzY2hlbWEgZW50cmllcyBpbiB0aGUgb3ZlcnJpZGVzIGZpbGUgbXVzdCBiZSBkaWZmZXJlbnQgZnJvbSBpdHMgYmFzZWxpbmUgY291bnRlcnBhcnQuJyxcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBwaGV0aW9JRCBtZXRhZGF0YSBrZXkgbm90IGZvdW5kIGluIHRoZSBiYXNlbGluZTogJHttZXRhZGF0YUtleX1gXHJcbiAgICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIG92ZXJyaWRlWyBtZXRhZGF0YUtleSBdID09PSBiYXNlbGluZVsgbWV0YWRhdGFLZXkgXSApIHtcclxuICAgICAgICAgICAgICB0aGlzLmFzc2VydEFQSUVycm9yKCB7XHJcbiAgICAgICAgICAgICAgICBwaGV0aW9JRDogcGhldGlvSUQsXHJcbiAgICAgICAgICAgICAgICBydWxlSW5WaW9sYXRpb246ICc4LiBBbnkgc2NoZW1hIGVudHJpZXMgaW4gdGhlIG92ZXJyaWRlcyBmaWxlIG11c3QgYmUgZGlmZmVyZW50IGZyb20gaXRzIGJhc2VsaW5lIGNvdW50ZXJwYXJ0LicsXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAncGhldGlvSUQgbWV0YWRhdGEgb3ZlcnJpZGUgdmFsdWUgaXMgdGhlIHNhbWUgYXMgdGhlIGNvcnJlc3BvbmRpbmcgbWV0YWRhdGEgdmFsdWUgaW4gdGhlIGJhc2VsaW5lLidcclxuICAgICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFzc2VydCBvdXQgdGhlIGZhaWxlZCBBUEkgdmFsaWRhdGlvbiBydWxlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgYXNzZXJ0QVBJRXJyb3IoIGFwaUVycm9yT2JqZWN0OiBBUElNaXNtYXRjaCApOiB2b2lkIHtcclxuXHJcbiAgICBjb25zdCBtaXNtYXRjaE1lc3NhZ2UgPSBhcGlFcnJvck9iamVjdC5waGV0aW9JRCA/IGAke2FwaUVycm9yT2JqZWN0LnBoZXRpb0lEfTogICR7YXBpRXJyb3JPYmplY3QucnVsZUluVmlvbGF0aW9ufWAgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYCR7YXBpRXJyb3JPYmplY3QucnVsZUluVmlvbGF0aW9ufWA7XHJcblxyXG4gICAgdGhpcy5hcGlNaXNtYXRjaGVzLnB1c2goIGFwaUVycm9yT2JqZWN0ICk7XHJcblxyXG4gICAgLy8gSWYgP3BoZXRpb1ByaW50QVBJUHJvYmxlbXMgaXMgcHJlc2VudCwgdGhlbiBpZ25vcmUgYXNzZXJ0aW9ucyB1bnRpbCB0aGUgc2ltIGhhcyBzdGFydGVkIHVwLlxyXG4gICAgaWYgKCB0aGlzLnNpbUhhc1N0YXJ0ZWQgfHwgIXBoZXQucHJlbG9hZHMucGhldGlvLnF1ZXJ5UGFyYW1ldGVycy5waGV0aW9QcmludEFQSVByb2JsZW1zICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBmYWxzZSwgYFBoRVQtaU8gQVBJIGVycm9yOlxcbiR7bWlzbWF0Y2hNZXNzYWdlfWAgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBDb21wYXJlIGEgZHluYW1pYyBwaGV0aW9PYmplY3QncyBtZXRhZGF0YSB0byB0aGUgZXhwZWN0ZWQgbWV0YWRhdGFcclxuICAgKi9cclxuICBwcml2YXRlIGNoZWNrRHluYW1pY0luc3RhbmNlQWdhaW5zdEFyY2hldHlwZSggcGhldGlvT2JqZWN0OiBQaGV0aW9PYmplY3QsIGFyY2hldHlwZU1ldGFkYXRhOiBQaGV0aW9FbGVtZW50TWV0YWRhdGEsIHNvdXJjZTogc3RyaW5nICk6IHZvaWQge1xyXG4gICAgY29uc3QgYWN0dWFsTWV0YWRhdGEgPSBwaGV0aW9PYmplY3QuZ2V0TWV0YWRhdGEoKTtcclxuICAgIEtFWVNfVE9fQ0hFQ0suZm9yRWFjaCgga2V5ID0+IHtcclxuXHJcbiAgICAgIC8vIFRoZXNlIGF0dHJpYnV0ZXMgYXJlIGRpZmZlcmVudCBmb3IgYXJjaGV0eXBlIHZzIGFjdHVhbFxyXG4gICAgICBpZiAoIGtleSAhPT0gJ3BoZXRpb0R5bmFtaWNFbGVtZW50JyAmJiBrZXkgIT09ICdwaGV0aW9BcmNoZXR5cGVQaGV0aW9JRCcgJiYga2V5ICE9PSAncGhldGlvSXNBcmNoZXR5cGUnICkge1xyXG5cclxuICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gbm90IHN1cmUgaG93IHRvIGJlIHR5cGVzYWZlIGluIHRoZSBBUEkgZmlsZXNcclxuICAgICAgICBpZiAoIGFyY2hldHlwZU1ldGFkYXRhWyBrZXkgXSAhPT0gYWN0dWFsTWV0YWRhdGFbIGtleSBdICYmIHBoZXRpb09iamVjdC50YW5kZW0gKSB7XHJcbiAgICAgICAgICB0aGlzLmFzc2VydEFQSUVycm9yKCB7XHJcbiAgICAgICAgICAgIHBoZXRpb0lEOiBwaGV0aW9PYmplY3QudGFuZGVtLnBoZXRpb0lELFxyXG4gICAgICAgICAgICBydWxlSW5WaW9sYXRpb246ICc1LiBEeW5hbWljIGVsZW1lbnQgbWV0YWRhdGEgc2hvdWxkIG1hdGNoIHRoZSBhcmNoZXR5cGUgaW4gdGhlIEFQSS4nLFxyXG4gICAgICAgICAgICBzb3VyY2U6IHNvdXJjZSxcclxuICAgICAgICAgICAgbWVzc2FnZTogYG1pc21hdGNoZWQgbWV0YWRhdGE6ICR7a2V5fWBcclxuICAgICAgICAgIH0gKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICB9XHJcbn1cclxuXHJcblxyXG5jb25zdCBwaGV0aW9BUElWYWxpZGF0aW9uID0gbmV3IFBoZXRpb0FQSVZhbGlkYXRpb24oKTtcclxudGFuZGVtTmFtZXNwYWNlLnJlZ2lzdGVyKCAncGhldGlvQVBJVmFsaWRhdGlvbicsIHBoZXRpb0FQSVZhbGlkYXRpb24gKTtcclxuZXhwb3J0IGRlZmF1bHQgcGhldGlvQVBJVmFsaWRhdGlvbjsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxNQUFNLElBQUlDLHNCQUFzQixRQUFRLGFBQWE7QUFDNUQsT0FBT0MsZUFBZSxNQUFNLHNCQUFzQjtBQUVsRCxTQUF1QkMsYUFBYSxRQUFRLG1CQUFtQjtBQUcvRDtBQUNBO0FBQ0EsTUFBTUMsYUFBYSxHQUFHLENBQ3BCLHNCQUFzQixFQUN0QixpQkFBaUIsRUFDakIsbUJBQW1CLEVBQ25CLGdCQUFnQixFQUNoQixnQkFBZ0IsRUFDaEIsYUFBYSxFQUNiLGdCQUFnQixDQUNqQjs7QUFFRDtBQUNBOztBQVFBLE1BQU1DLG1C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