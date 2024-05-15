// Copyright 2020-2024, University of Colorado Boulder

/**
 * Responsible for handling Property-specific logic associated with setting PhET-iO state. This file will defer Properties
 * from taking their final value, and notifying on that value until after state has been set on every Property. It is
 * also responsible for keeping track of order dependencies between different Properties, and making sure that undeferral
 * and notifications go out in the appropriate orders. See https://github.com/phetsims/axon/issues/276 for implementation details.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Tandem from '../../tandem/js/Tandem.js';
import axon from './axon.js';
import PropertyStatePhase from './PropertyStatePhase.js';
import ReadOnlyProperty from './ReadOnlyProperty.js';
class PropertyStateHandler {
  initialized = false;
  constructor() {
    // Properties support setDeferred(). We defer setting their values so all changes take effect
    // at once. This keeps track of finalization actions (embodied in a PhaseCallback) that must take place after all
    // Property values have changed. This keeps track of both types of PropertyStatePhase: undeferring and notification.
    this.phaseCallbackSets = new PhaseCallbackSets();

    // each pair has a Map optimized for looking up based on the "before phetioID" and the "after phetioID"
    // of the dependency. Having a data structure set up for both directions of look-up makes each operation O(1). See https://github.com/phetsims/axon/issues/316
    this.undeferBeforeUndeferMapPair = new OrderDependencyMapPair(PropertyStatePhase.UNDEFER, PropertyStatePhase.UNDEFER);
    this.undeferBeforeNotifyMapPair = new OrderDependencyMapPair(PropertyStatePhase.UNDEFER, PropertyStatePhase.NOTIFY);
    this.notifyBeforeUndeferMapPair = new OrderDependencyMapPair(PropertyStatePhase.NOTIFY, PropertyStatePhase.UNDEFER);
    this.notifyBeforeNotifyMapPair = new OrderDependencyMapPair(PropertyStatePhase.NOTIFY, PropertyStatePhase.NOTIFY);

    // keep a list of all map pairs for easier iteration
    this.mapPairs = [this.undeferBeforeUndeferMapPair, this.undeferBeforeNotifyMapPair, this.notifyBeforeUndeferMapPair, this.notifyBeforeNotifyMapPair];
  }
  initialize(phetioStateEngine) {
    assert && assert(!this.initialized, 'cannot initialize twice');
    phetioStateEngine.onBeforeApplyStateEmitter.addListener(phetioObject => {
      // withhold AXON/Property notifications until all values have been set to avoid inconsistent intermediate states,
      // see https://github.com/phetsims/phet-io-wrappers/issues/229
      // only do this if the PhetioObject is already not deferred
      if (phetioObject instanceof ReadOnlyProperty && !phetioObject.isDeferred) {
        phetioObject.setDeferred(true);
        const phetioID = phetioObject.tandem.phetioID;
        const listener = () => {
          const potentialListener = phetioObject.setDeferred(false);

          // Always add a PhaseCallback so that we can track the order dependency, even though setDeferred can return null.
          this.phaseCallbackSets.addNotifyPhaseCallback(new PhaseCallback(phetioID, PropertyStatePhase.NOTIFY, potentialListener || _.noop));
        };
        this.phaseCallbackSets.addUndeferPhaseCallback(new PhaseCallback(phetioID, PropertyStatePhase.UNDEFER, listener));
      }
    });

    // It is important that nothing else adds listeners at import time before this. Properties take precedent.
    assert && assert(!phetioStateEngine.undeferEmitter.hasListeners(), 'At this time, we rely on Properties undeferring first.');
    phetioStateEngine.undeferEmitter.addListener(state => {
      // Properties set to final values and notify of any value changes.
      this.undeferAndNotifyProperties(new Set(Object.keys(state)));
    });
    phetioStateEngine.isSettingStateProperty.lazyLink(isSettingState => {
      assert && !isSettingState && assert(this.phaseCallbackSets.size === 0, 'PhaseCallbacks should have all been applied');
    });
    this.initialized = true;
  }
  static validateInstrumentedProperty(property) {
    assert && Tandem.VALIDATION && assert(property instanceof ReadOnlyProperty && property.isPhetioInstrumented(), `must be an instrumented Property: ${property}`);
  }
  validatePropertyPhasePair(property, phase) {
    PropertyStateHandler.validateInstrumentedProperty(property);
  }

  /**
   * Get the MapPair associated with the proved PropertyStatePhases
   */
  getMapPairFromPhases(beforePhase, afterPhase) {
    const matchedPairs = this.mapPairs.filter(mapPair => beforePhase === mapPair.beforePhase && afterPhase === mapPair.afterPhase);
    assert && assert(matchedPairs.length === 1, 'one and only one map should match the provided phases');
    return matchedPairs[0];
  }

  /**
   * Register that one Property must have a "Phase" applied for PhET-iO state before another Property's Phase. A Phase
   * is an ending state in PhET-iO state set where Property values solidify, notifications for value changes are called.
   * The PhET-iO state engine will always undefer a Property before it notifies its listeners. This is for registering
   * two different Properties.
   *
   * @param beforeProperty - the Property that needs to be set before the second; must be instrumented for PhET-iO
   * @param beforePhase
   * @param afterProperty - must be instrumented for PhET-iO
   * @param afterPhase
   */
  registerPhetioOrderDependency(beforeProperty, beforePhase, afterProperty, afterPhase) {
    if (Tandem.PHET_IO_ENABLED) {
      assert && assert(!(beforePhase === PropertyStatePhase.NOTIFY && afterPhase === PropertyStatePhase.UNDEFER), 'It is PhET-iO policy at this time to have all notifications occur after all state values have been applied.');
      this.validatePropertyPhasePair(beforeProperty, beforePhase);
      this.validatePropertyPhasePair(afterProperty, afterPhase);
      assert && beforeProperty === afterProperty && assert(beforePhase !== afterPhase, 'cannot set same Property to same phase');
      const mapPair = this.getMapPairFromPhases(beforePhase, afterPhase);
      mapPair.addOrderDependency(beforeProperty.tandem.phetioID, afterProperty.tandem.phetioID);
    }
  }

  /**
   * {Property} property - must be instrumented for PhET-iO
   * {boolean} - true if Property is in any order dependency
   */
  propertyInAnOrderDependency(property) {
    PropertyStateHandler.validateInstrumentedProperty(property);
    return _.some(this.mapPairs, mapPair => mapPair.usesPhetioID(property.tandem.phetioID));
  }

  /**
   * Unregisters all order dependencies for the given Property
   * {ReadOnlyProperty} property - must be instrumented for PhET-iO
   */
  unregisterOrderDependenciesForProperty(property) {
    if (Tandem.PHET_IO_ENABLED) {
      PropertyStateHandler.validateInstrumentedProperty(property);

      // Be graceful if given a Property that is not registered in an order dependency.
      if (this.propertyInAnOrderDependency(property)) {
        assert && assert(this.propertyInAnOrderDependency(property), 'Property must be registered in an order dependency to be unregistered');
        this.mapPairs.forEach(mapPair => mapPair.unregisterOrderDependenciesForProperty(property));
      }
    }
  }

  /**
   * Given registered Property Phase order dependencies, undefer all AXON/Property PhET-iO Elements to take their
   * correct values and have each notify their listeners.
   * {Set.<string>} phetioIDsInState - set of phetioIDs that were set in state
   */
  undeferAndNotifyProperties(phetioIDsInState) {
    assert && assert(this.initialized, 'must be initialized before getting called');

    // {Object.<string,boolean>} - true if a phetioID + phase pair has been applied, keys are the combination of
    // phetioIDs and phase, see PhaseCallback.getTerm()
    const completedPhases = {};

    // to support failing out instead of infinite loop
    let numberOfIterations = 0;

    // Normally we would like to undefer things before notify, but make sure this is done in accordance with the order dependencies.
    while (this.phaseCallbackSets.size > 0) {
      numberOfIterations++;

      // Error case logging
      if (numberOfIterations > 5000) {
        this.errorInUndeferAndNotifyStep(completedPhases);
      }

      // Try to undefer as much as possible before notifying
      this.attemptToApplyPhases(PropertyStatePhase.UNDEFER, completedPhases, phetioIDsInState);
      this.attemptToApplyPhases(PropertyStatePhase.NOTIFY, completedPhases, phetioIDsInState);
    }
  }
  errorInUndeferAndNotifyStep(completedPhases) {
    // combine phetioID and Phase into a single string to keep this process specific.
    const stillToDoIDPhasePairs = [];
    this.phaseCallbackSets.forEach(phaseCallback => stillToDoIDPhasePairs.push(phaseCallback.getTerm()));
    const relevantOrderDependencies = [];
    this.mapPairs.forEach(mapPair => {
      const beforeMap = mapPair.beforeMap;
      for (const [beforePhetioID, afterPhetioIDs] of beforeMap) {
        afterPhetioIDs.forEach(afterPhetioID => {
          const beforeTerm = beforePhetioID + beforeMap.beforePhase;
          const afterTerm = afterPhetioID + beforeMap.afterPhase;
          if (stillToDoIDPhasePairs.includes(beforeTerm) || stillToDoIDPhasePairs.includes(afterTerm)) {
            relevantOrderDependencies.push({
              beforeTerm: beforeTerm,
              afterTerm: afterTerm
            });
          }
        });
      }
    });
    let string = '';
    console.log('still to be undeferred', this.phaseCallbackSets.undeferSet);
    console.log('still to be notified', this.phaseCallbackSets.notifySet);
    console.log('order dependencies that apply to the still todos', relevantOrderDependencies);
    relevantOrderDependencies.forEach(orderDependency => {
      string += `${orderDependency.beforeTerm}\t${orderDependency.afterTerm}\n`;
    });
    console.log('\n\nin graphable form:\n\n', string);
    const assertMessage = 'Impossible set state: from undeferAndNotifyProperties; ordering constraints cannot be satisfied';
    assert && assert(false, assertMessage);

    // We must exit here even if assertions are disabled so it wouldn't lock up the browser.
    if (!assert) {
      throw new Error(assertMessage);
    }
  }

  /**
   * Only for Testing!
   * Get the number of order dependencies registered in this class
   *
   */
  getNumberOfOrderDependencies() {
    let count = 0;
    this.mapPairs.forEach(mapPair => {
      mapPair.afterMap.forEach(valueSet => {
        count += valueSet.size;
      });
    });
    return count;
  }

  /**
   * Go through all phases still to be applied, and apply them if the order dependencies allow it. Only apply for the
   * particular phase provided. In general UNDEFER must occur before the same phetioID gets NOTIFY.
   *
   * @param phase - only apply PhaseCallbacks for this particular PropertyStatePhase
   * @param completedPhases - map that keeps track of completed phases
   * @param phetioIDsInState - set of phetioIDs that were set in state
   */
  attemptToApplyPhases(phase, completedPhases, phetioIDsInState) {
    const phaseCallbackSet = this.phaseCallbackSets.getSetFromPhase(phase);
    for (const phaseCallbackToPotentiallyApply of phaseCallbackSet) {
      assert && assert(phaseCallbackToPotentiallyApply.phase === phase, 'phaseCallbackSet should only include callbacks for provided phase');

      // only try to check the order dependencies to see if this has to be after something that is incomplete.
      if (this.phetioIDCanApplyPhase(phaseCallbackToPotentiallyApply.phetioID, phase, completedPhases, phetioIDsInState)) {
        // Fire the listener;
        phaseCallbackToPotentiallyApply.listener();

        // Remove it from the main list so that it doesn't get called again.
        phaseCallbackSet.delete(phaseCallbackToPotentiallyApply);

        // Keep track of all completed PhaseCallbacks
        completedPhases[phaseCallbackToPotentiallyApply.getTerm()] = true;
      }
    }
  }

  /**
   * @param phetioID - think of this as the "afterPhetioID" since there may be some phases that need to be applied before it has this phase done.
   * @param phase
   * @param completedPhases - map that keeps track of completed phases
   * @param phetioIDsInState - set of phetioIDs that were set in state
   * @param - if the provided phase can be applied given the dependency order dependencies of the state engine.
   */
  phetioIDCanApplyPhase(phetioID, phase, completedPhases, phetioIDsInState) {
    // Undefer must happen before notify
    if (phase === PropertyStatePhase.NOTIFY && !completedPhases[phetioID + PropertyStatePhase.UNDEFER]) {
      return false;
    }

    // Get a list of the maps for this phase being applies.
    const mapsToCheck = [];
    this.mapPairs.forEach(mapPair => {
      if (mapPair.afterPhase === phase) {
        // Use the "afterMap" because below looks up what needs to come before.
        mapsToCheck.push(mapPair.afterMap);
      }
    });

    // O(2)
    for (let i = 0; i < mapsToCheck.length; i++) {
      const mapToCheck = mapsToCheck[i];
      if (!mapToCheck.has(phetioID)) {
        return true;
      }
      const setOfThingsThatShouldComeFirst = mapToCheck.get(phetioID);
      assert && assert(setOfThingsThatShouldComeFirst, 'must have this set');

      // O(K) where K is the number of elements that should come before Property X
      for (const beforePhetioID of setOfThingsThatShouldComeFirst) {
        // check if the before phase for this order dependency has already been completed
        // Make sure that we only care about elements that were actually set during this state set
        if (!completedPhases[beforePhetioID + mapToCheck.beforePhase] && phetioIDsInState.has(beforePhetioID) && phetioIDsInState.has(phetioID)) {
          return false;
        }
      }
    }
    return true;
  }
}

// POJSO for a callback for a specific Phase in a Property's state set lifecycle. See undeferAndNotifyProperties()
class PhaseCallback {
  constructor(phetioID, phase, listener = _.noop) {
    this.phetioID = phetioID;
    this.phase = phase;
    this.listener = listener;
  }

  /**
   * {string} - unique term for the id/phase pair
   */
  getTerm() {
    return this.phetioID + this.phase;
  }
}
class OrderDependencyMapPair {
  constructor(beforePhase, afterPhase) {
    // @ts-expect-error, it is easiest to fudge here since we are adding the PhaseMap properties just below here.
    this.beforeMap = new Map();
    this.beforeMap.beforePhase = beforePhase;
    this.beforeMap.afterPhase = afterPhase;

    // @ts-expect-error, it is easiest to fudge here since we are adding the PhaseMap properties just below here.
    this.afterMap = new Map();
    this.afterMap.beforePhase = beforePhase;
    this.afterMap.afterPhase = afterPhase;
    this.beforeMap.otherMap = this.afterMap;
    this.afterMap.otherMap = this.beforeMap;
    this.beforePhase = beforePhase;
    this.afterPhase = afterPhase;
  }

  /**
   * Register an order dependency between two phetioIDs. This will add data to maps in "both direction". If accessing
   * with just the beforePhetioID, or with the afterPhetioID.
   */
  addOrderDependency(beforePhetioID, afterPhetioID) {
    if (!this.beforeMap.has(beforePhetioID)) {
      this.beforeMap.set(beforePhetioID, new Set());
    }
    this.beforeMap.get(beforePhetioID).add(afterPhetioID);
    if (!this.afterMap.has(afterPhetioID)) {
      this.afterMap.set(afterPhetioID, new Set());
    }
    this.afterMap.get(afterPhetioID).add(beforePhetioID);
  }

  /**
   * Unregister all order dependencies for the provided Property
   */
  unregisterOrderDependenciesForProperty(property) {
    const phetioIDToRemove = property.tandem.phetioID;
    [this.beforeMap, this.afterMap].forEach(map => {
      map.has(phetioIDToRemove) && map.get(phetioIDToRemove).forEach(phetioID => {
        const setOfAfterMapIDs = map.otherMap.get(phetioID);
        setOfAfterMapIDs && setOfAfterMapIDs.delete(phetioIDToRemove);

        // Clear out empty entries to avoid having lots of empty Sets sitting around
        setOfAfterMapIDs.size === 0 && map.otherMap.delete(phetioID);
      });
      map.delete(phetioIDToRemove);
    });

    // Look through every dependency and make sure the phetioID to remove has been completely removed.
    assertSlow && [this.beforeMap, this.afterMap].forEach(map => {
      map.forEach((valuePhetioIDs, key) => {
        assertSlow && assertSlow(key !== phetioIDToRemove, 'should not be a key');
        assertSlow && assertSlow(!valuePhetioIDs.has(phetioIDToRemove), 'should not be in a value list');
      });
    });
  }
  usesPhetioID(phetioID) {
    return this.beforeMap.has(phetioID) || this.afterMap.has(phetioID);
  }
}

// POJSO to keep track of PhaseCallbacks while providing O(1) lookup time because it is built on Set
class PhaseCallbackSets {
  undeferSet = new Set();
  notifySet = new Set();
  get size() {
    return this.undeferSet.size + this.notifySet.size;
  }
  forEach(callback) {
    this.undeferSet.forEach(callback);
    this.notifySet.forEach(callback);
  }
  addUndeferPhaseCallback(phaseCallback) {
    this.undeferSet.add(phaseCallback);
  }
  addNotifyPhaseCallback(phaseCallback) {
    this.notifySet.add(phaseCallback);
  }
  getSetFromPhase(phase) {
    return phase === PropertyStatePhase.NOTIFY ? this.notifySet : this.undeferSet;
  }
}
axon.register('PropertyStateHandler', PropertyStateHandler);
export default PropertyStateHandler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUYW5kZW0iLCJheG9uIiwiUHJvcGVydHlTdGF0ZVBoYXNlIiwiUmVhZE9ubHlQcm9wZXJ0eSIsIlByb3BlcnR5U3RhdGVIYW5kbGVyIiwiaW5pdGlhbGl6ZWQiLCJjb25zdHJ1Y3RvciIsInBoYXNlQ2FsbGJhY2tTZXRzIiwiUGhhc2VDYWxsYmFja1NldHMiLCJ1bmRlZmVyQmVmb3JlVW5kZWZlck1hcFBhaXIiLCJPcmRlckRlcGVuZGVuY3lNYXBQYWlyIiwiVU5ERUZFUiIsInVuZGVmZXJCZWZvcmVOb3RpZnlNYXBQYWlyIiwiTk9USUZZIiwibm90aWZ5QmVmb3JlVW5kZWZlck1hcFBhaXIiLCJub3RpZnlCZWZvcmVOb3RpZnlNYXBQYWlyIiwibWFwUGFpcnMiLCJpbml0aWFsaXplIiwicGhldGlvU3RhdGVFbmdpbmUiLCJhc3NlcnQiLCJvbkJlZm9yZUFwcGx5U3RhdGVFbWl0dGVyIiwiYWRkTGlzdGVuZXIiLCJwaGV0aW9PYmplY3QiLCJpc0RlZmVycmVkIiwic2V0RGVmZXJyZWQiLCJwaGV0aW9JRCIsInRhbmRlbSIsImxpc3RlbmVyIiwicG90ZW50aWFsTGlzdGVuZXIiLCJhZGROb3RpZnlQaGFzZUNhbGxiYWNrIiwiUGhhc2VDYWxsYmFjayIsIl8iLCJub29wIiwiYWRkVW5kZWZlclBoYXNlQ2FsbGJhY2siLCJ1bmRlZmVyRW1pdHRlciIsImhhc0xpc3RlbmVycyIsInN0YXRlIiwidW5kZWZlckFuZE5vdGlmeVByb3BlcnRpZXMiLCJTZXQiLCJPYmplY3QiLCJrZXlzIiwiaXNTZXR0aW5nU3RhdGVQcm9wZXJ0eSIsImxhenlMaW5rIiwiaXNTZXR0aW5nU3RhdGUiLCJzaXplIiwidmFsaWRhdGVJbnN0cnVtZW50ZWRQcm9wZXJ0eSIsInByb3BlcnR5IiwiVkFMSURBVElPTiIsImlzUGhldGlvSW5zdHJ1bWVudGVkIiwidmFsaWRhdGVQcm9wZXJ0eVBoYXNlUGFpciIsInBoYXNlIiwiZ2V0TWFwUGFpckZyb21QaGFzZXMiLCJiZWZvcmVQaGFzZSIsImFmdGVyUGhhc2UiLCJtYXRjaGVkUGFpcnMiLCJmaWx0ZXIiLCJtYXBQYWlyIiwibGVuZ3RoIiwicmVnaXN0ZXJQaGV0aW9PcmRlckRlcGVuZGVuY3kiLCJiZWZvcmVQcm9wZXJ0eSIsImFmdGVyUHJvcGVydHkiLCJQSEVUX0lPX0VOQUJMRUQiLCJhZGRPcmRlckRlcGVuZGVuY3kiLCJwcm9wZXJ0eUluQW5PcmRlckRlcGVuZGVuY3kiLCJzb21lIiwidXNlc1BoZXRpb0lEIiwidW5yZWdpc3Rlck9yZGVyRGVwZW5kZW5jaWVzRm9yUHJvcGVydHkiLCJmb3JFYWNoIiwicGhldGlvSURzSW5TdGF0ZSIsImNvbXBsZXRlZFBoYXNlcyIsIm51bWJlck9mSXRlcmF0aW9ucyIsImVycm9ySW5VbmRlZmVyQW5kTm90aWZ5U3RlcCIsImF0dGVtcHRUb0FwcGx5UGhhc2VzIiwic3RpbGxUb0RvSURQaGFzZVBhaXJzIiwicGhhc2VDYWxsYmFjayIsInB1c2giLCJnZXRUZXJtIiwicmVsZXZhbnRPcmRlckRlcGVuZGVuY2llcyIsImJlZm9yZU1hcCIsImJlZm9yZVBoZXRpb0lEIiwiYWZ0ZXJQaGV0aW9JRHMiLCJhZnRlclBoZXRpb0lEIiwiYmVmb3JlVGVybSIsImFmdGVyVGVybSIsImluY2x1ZGVzIiwic3RyaW5nIiwiY29uc29sZSIsImxvZyIsInVuZGVmZXJTZXQiLCJub3RpZnlTZXQiLCJvcmRlckRlcGVuZGVuY3kiLCJhc3NlcnRNZXNzYWdlIiwiRXJyb3IiLCJnZXROdW1iZXJPZk9yZGVyRGVwZW5kZW5jaWVzIiwiY291bnQiLCJhZnRlck1hcCIsInZhbHVlU2V0IiwicGhhc2VDYWxsYmFja1NldCIsImdldFNldEZyb21QaGFzZSIsInBoYXNlQ2FsbGJhY2tUb1BvdGVudGlhbGx5QXBwbHkiLCJwaGV0aW9JRENhbkFwcGx5UGhhc2UiLCJkZWxldGUiLCJtYXBzVG9DaGVjayIsImkiLCJtYXBUb0NoZWNrIiwiaGFzIiwic2V0T2ZUaGluZ3NUaGF0U2hvdWxkQ29tZUZpcnN0IiwiZ2V0IiwiTWFwIiwib3RoZXJNYXAiLCJzZXQiLCJhZGQiLCJwaGV0aW9JRFRvUmVtb3ZlIiwibWFwIiwic2V0T2ZBZnRlck1hcElEcyIsImFzc2VydFNsb3ciLCJ2YWx1ZVBoZXRpb0lEcyIsImtleSIsImNhbGxiYWNrIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJQcm9wZXJ0eVN0YXRlSGFuZGxlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMC0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBSZXNwb25zaWJsZSBmb3IgaGFuZGxpbmcgUHJvcGVydHktc3BlY2lmaWMgbG9naWMgYXNzb2NpYXRlZCB3aXRoIHNldHRpbmcgUGhFVC1pTyBzdGF0ZS4gVGhpcyBmaWxlIHdpbGwgZGVmZXIgUHJvcGVydGllc1xyXG4gKiBmcm9tIHRha2luZyB0aGVpciBmaW5hbCB2YWx1ZSwgYW5kIG5vdGlmeWluZyBvbiB0aGF0IHZhbHVlIHVudGlsIGFmdGVyIHN0YXRlIGhhcyBiZWVuIHNldCBvbiBldmVyeSBQcm9wZXJ0eS4gSXQgaXNcclxuICogYWxzbyByZXNwb25zaWJsZSBmb3Iga2VlcGluZyB0cmFjayBvZiBvcmRlciBkZXBlbmRlbmNpZXMgYmV0d2VlbiBkaWZmZXJlbnQgUHJvcGVydGllcywgYW5kIG1ha2luZyBzdXJlIHRoYXQgdW5kZWZlcnJhbFxyXG4gKiBhbmQgbm90aWZpY2F0aW9ucyBnbyBvdXQgaW4gdGhlIGFwcHJvcHJpYXRlIG9yZGVycy4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9heG9uL2lzc3Vlcy8yNzYgZm9yIGltcGxlbWVudGF0aW9uIGRldGFpbHMuXHJcbiAqXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgSW50ZW50aW9uYWxBbnkgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL0ludGVudGlvbmFsQW55LmpzJztcclxuaW1wb3J0IGF4b24gZnJvbSAnLi9heG9uLmpzJztcclxuaW1wb3J0IFByb3BlcnR5U3RhdGVQaGFzZSBmcm9tICcuL1Byb3BlcnR5U3RhdGVQaGFzZS5qcyc7XHJcbmltcG9ydCBSZWFkT25seVByb3BlcnR5IGZyb20gJy4vUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCB7IFBoZXRpb0lEIH0gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL1RhbmRlbUNvbnN0YW50cy5qcyc7XHJcbmltcG9ydCB7IFRQaGV0aW9TdGF0ZUVuZ2luZSB9IGZyb20gJy4uLy4uL3RhbmRlbS9qcy9UUGhldGlvU3RhdGVFbmdpbmUuanMnO1xyXG5cclxudHlwZSBQaGFzZU1hcCA9IHtcclxuICBiZWZvcmVQaGFzZTogUHJvcGVydHlTdGF0ZVBoYXNlO1xyXG4gIGFmdGVyUGhhc2U6IFByb3BlcnR5U3RhdGVQaGFzZTtcclxuICBvdGhlck1hcDogUGhhc2VNYXA7XHJcbn0gJiBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj47XHJcblxyXG50eXBlIE9yZGVyRGVwZW5kZW5jeSA9IHtcclxuICBiZWZvcmVUZXJtOiBzdHJpbmc7XHJcbiAgYWZ0ZXJUZXJtOiBzdHJpbmc7XHJcbn07XHJcblxyXG5jbGFzcyBQcm9wZXJ0eVN0YXRlSGFuZGxlciB7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBwaGFzZUNhbGxiYWNrU2V0czogUGhhc2VDYWxsYmFja1NldHM7XHJcbiAgcHJpdmF0ZSByZWFkb25seSB1bmRlZmVyQmVmb3JlVW5kZWZlck1hcFBhaXI6IE9yZGVyRGVwZW5kZW5jeU1hcFBhaXI7XHJcbiAgcHJpdmF0ZSByZWFkb25seSB1bmRlZmVyQmVmb3JlTm90aWZ5TWFwUGFpcjogT3JkZXJEZXBlbmRlbmN5TWFwUGFpcjtcclxuICBwcml2YXRlIHJlYWRvbmx5IG5vdGlmeUJlZm9yZVVuZGVmZXJNYXBQYWlyOiBPcmRlckRlcGVuZGVuY3lNYXBQYWlyO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgbm90aWZ5QmVmb3JlTm90aWZ5TWFwUGFpcjogT3JkZXJEZXBlbmRlbmN5TWFwUGFpcjtcclxuICBwcml2YXRlIHJlYWRvbmx5IG1hcFBhaXJzOiBPcmRlckRlcGVuZGVuY3lNYXBQYWlyW107XHJcbiAgcHJpdmF0ZSBpbml0aWFsaXplZCA9IGZhbHNlO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XHJcblxyXG4gICAgLy8gUHJvcGVydGllcyBzdXBwb3J0IHNldERlZmVycmVkKCkuIFdlIGRlZmVyIHNldHRpbmcgdGhlaXIgdmFsdWVzIHNvIGFsbCBjaGFuZ2VzIHRha2UgZWZmZWN0XHJcbiAgICAvLyBhdCBvbmNlLiBUaGlzIGtlZXBzIHRyYWNrIG9mIGZpbmFsaXphdGlvbiBhY3Rpb25zIChlbWJvZGllZCBpbiBhIFBoYXNlQ2FsbGJhY2spIHRoYXQgbXVzdCB0YWtlIHBsYWNlIGFmdGVyIGFsbFxyXG4gICAgLy8gUHJvcGVydHkgdmFsdWVzIGhhdmUgY2hhbmdlZC4gVGhpcyBrZWVwcyB0cmFjayBvZiBib3RoIHR5cGVzIG9mIFByb3BlcnR5U3RhdGVQaGFzZTogdW5kZWZlcnJpbmcgYW5kIG5vdGlmaWNhdGlvbi5cclxuICAgIHRoaXMucGhhc2VDYWxsYmFja1NldHMgPSBuZXcgUGhhc2VDYWxsYmFja1NldHMoKTtcclxuXHJcbiAgICAvLyBlYWNoIHBhaXIgaGFzIGEgTWFwIG9wdGltaXplZCBmb3IgbG9va2luZyB1cCBiYXNlZCBvbiB0aGUgXCJiZWZvcmUgcGhldGlvSURcIiBhbmQgdGhlIFwiYWZ0ZXIgcGhldGlvSURcIlxyXG4gICAgLy8gb2YgdGhlIGRlcGVuZGVuY3kuIEhhdmluZyBhIGRhdGEgc3RydWN0dXJlIHNldCB1cCBmb3IgYm90aCBkaXJlY3Rpb25zIG9mIGxvb2stdXAgbWFrZXMgZWFjaCBvcGVyYXRpb24gTygxKS4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9heG9uL2lzc3Vlcy8zMTZcclxuICAgIHRoaXMudW5kZWZlckJlZm9yZVVuZGVmZXJNYXBQYWlyID0gbmV3IE9yZGVyRGVwZW5kZW5jeU1hcFBhaXIoIFByb3BlcnR5U3RhdGVQaGFzZS5VTkRFRkVSLCBQcm9wZXJ0eVN0YXRlUGhhc2UuVU5ERUZFUiApO1xyXG4gICAgdGhpcy51bmRlZmVyQmVmb3JlTm90aWZ5TWFwUGFpciA9IG5ldyBPcmRlckRlcGVuZGVuY3lNYXBQYWlyKCBQcm9wZXJ0eVN0YXRlUGhhc2UuVU5ERUZFUiwgUHJvcGVydHlTdGF0ZVBoYXNlLk5PVElGWSApO1xyXG4gICAgdGhpcy5ub3RpZnlCZWZvcmVVbmRlZmVyTWFwUGFpciA9IG5ldyBPcmRlckRlcGVuZGVuY3lNYXBQYWlyKCBQcm9wZXJ0eVN0YXRlUGhhc2UuTk9USUZZLCBQcm9wZXJ0eVN0YXRlUGhhc2UuVU5ERUZFUiApO1xyXG4gICAgdGhpcy5ub3RpZnlCZWZvcmVOb3RpZnlNYXBQYWlyID0gbmV3IE9yZGVyRGVwZW5kZW5jeU1hcFBhaXIoIFByb3BlcnR5U3RhdGVQaGFzZS5OT1RJRlksIFByb3BlcnR5U3RhdGVQaGFzZS5OT1RJRlkgKTtcclxuXHJcbiAgICAvLyBrZWVwIGEgbGlzdCBvZiBhbGwgbWFwIHBhaXJzIGZvciBlYXNpZXIgaXRlcmF0aW9uXHJcbiAgICB0aGlzLm1hcFBhaXJzID0gW1xyXG4gICAgICB0aGlzLnVuZGVmZXJCZWZvcmVVbmRlZmVyTWFwUGFpcixcclxuICAgICAgdGhpcy51bmRlZmVyQmVmb3JlTm90aWZ5TWFwUGFpcixcclxuICAgICAgdGhpcy5ub3RpZnlCZWZvcmVVbmRlZmVyTWFwUGFpcixcclxuICAgICAgdGhpcy5ub3RpZnlCZWZvcmVOb3RpZnlNYXBQYWlyXHJcbiAgICBdO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGluaXRpYWxpemUoIHBoZXRpb1N0YXRlRW5naW5lOiBUUGhldGlvU3RhdGVFbmdpbmUgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5pbml0aWFsaXplZCwgJ2Nhbm5vdCBpbml0aWFsaXplIHR3aWNlJyApO1xyXG5cclxuICAgIHBoZXRpb1N0YXRlRW5naW5lLm9uQmVmb3JlQXBwbHlTdGF0ZUVtaXR0ZXIuYWRkTGlzdGVuZXIoIHBoZXRpb09iamVjdCA9PiB7XHJcblxyXG4gICAgICAvLyB3aXRoaG9sZCBBWE9OL1Byb3BlcnR5IG5vdGlmaWNhdGlvbnMgdW50aWwgYWxsIHZhbHVlcyBoYXZlIGJlZW4gc2V0IHRvIGF2b2lkIGluY29uc2lzdGVudCBpbnRlcm1lZGlhdGUgc3RhdGVzLFxyXG4gICAgICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXQtaW8td3JhcHBlcnMvaXNzdWVzLzIyOVxyXG4gICAgICAvLyBvbmx5IGRvIHRoaXMgaWYgdGhlIFBoZXRpb09iamVjdCBpcyBhbHJlYWR5IG5vdCBkZWZlcnJlZFxyXG4gICAgICBpZiAoIHBoZXRpb09iamVjdCBpbnN0YW5jZW9mIFJlYWRPbmx5UHJvcGVydHkgJiYgIXBoZXRpb09iamVjdC5pc0RlZmVycmVkICkge1xyXG4gICAgICAgIHBoZXRpb09iamVjdC5zZXREZWZlcnJlZCggdHJ1ZSApO1xyXG4gICAgICAgIGNvbnN0IHBoZXRpb0lEID0gcGhldGlvT2JqZWN0LnRhbmRlbS5waGV0aW9JRDtcclxuXHJcbiAgICAgICAgY29uc3QgbGlzdGVuZXIgPSAoKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBwb3RlbnRpYWxMaXN0ZW5lciA9IHBoZXRpb09iamVjdC5zZXREZWZlcnJlZCggZmFsc2UgKTtcclxuXHJcbiAgICAgICAgICAvLyBBbHdheXMgYWRkIGEgUGhhc2VDYWxsYmFjayBzbyB0aGF0IHdlIGNhbiB0cmFjayB0aGUgb3JkZXIgZGVwZW5kZW5jeSwgZXZlbiB0aG91Z2ggc2V0RGVmZXJyZWQgY2FuIHJldHVybiBudWxsLlxyXG4gICAgICAgICAgdGhpcy5waGFzZUNhbGxiYWNrU2V0cy5hZGROb3RpZnlQaGFzZUNhbGxiYWNrKCBuZXcgUGhhc2VDYWxsYmFjayggcGhldGlvSUQsIFByb3BlcnR5U3RhdGVQaGFzZS5OT1RJRlksIHBvdGVudGlhbExpc3RlbmVyIHx8IF8ubm9vcCApICk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLnBoYXNlQ2FsbGJhY2tTZXRzLmFkZFVuZGVmZXJQaGFzZUNhbGxiYWNrKCBuZXcgUGhhc2VDYWxsYmFjayggcGhldGlvSUQsIFByb3BlcnR5U3RhdGVQaGFzZS5VTkRFRkVSLCBsaXN0ZW5lciApICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBJdCBpcyBpbXBvcnRhbnQgdGhhdCBub3RoaW5nIGVsc2UgYWRkcyBsaXN0ZW5lcnMgYXQgaW1wb3J0IHRpbWUgYmVmb3JlIHRoaXMuIFByb3BlcnRpZXMgdGFrZSBwcmVjZWRlbnQuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhcGhldGlvU3RhdGVFbmdpbmUudW5kZWZlckVtaXR0ZXIuaGFzTGlzdGVuZXJzKCksICdBdCB0aGlzIHRpbWUsIHdlIHJlbHkgb24gUHJvcGVydGllcyB1bmRlZmVycmluZyBmaXJzdC4nICk7XHJcblxyXG4gICAgcGhldGlvU3RhdGVFbmdpbmUudW5kZWZlckVtaXR0ZXIuYWRkTGlzdGVuZXIoIHN0YXRlID0+IHtcclxuXHJcbiAgICAgIC8vIFByb3BlcnRpZXMgc2V0IHRvIGZpbmFsIHZhbHVlcyBhbmQgbm90aWZ5IG9mIGFueSB2YWx1ZSBjaGFuZ2VzLlxyXG4gICAgICB0aGlzLnVuZGVmZXJBbmROb3RpZnlQcm9wZXJ0aWVzKCBuZXcgU2V0KCBPYmplY3Qua2V5cyggc3RhdGUgKSApICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgcGhldGlvU3RhdGVFbmdpbmUuaXNTZXR0aW5nU3RhdGVQcm9wZXJ0eS5sYXp5TGluayggaXNTZXR0aW5nU3RhdGUgPT4ge1xyXG4gICAgICBhc3NlcnQgJiYgIWlzU2V0dGluZ1N0YXRlICYmIGFzc2VydCggdGhpcy5waGFzZUNhbGxiYWNrU2V0cy5zaXplID09PSAwLCAnUGhhc2VDYWxsYmFja3Mgc2hvdWxkIGhhdmUgYWxsIGJlZW4gYXBwbGllZCcgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgc3RhdGljIHZhbGlkYXRlSW5zdHJ1bWVudGVkUHJvcGVydHkoIHByb3BlcnR5OiBSZWFkT25seVByb3BlcnR5PHVua25vd24+ICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIFRhbmRlbS5WQUxJREFUSU9OICYmIGFzc2VydCggcHJvcGVydHkgaW5zdGFuY2VvZiBSZWFkT25seVByb3BlcnR5ICYmIHByb3BlcnR5LmlzUGhldGlvSW5zdHJ1bWVudGVkKCksIGBtdXN0IGJlIGFuIGluc3RydW1lbnRlZCBQcm9wZXJ0eTogJHtwcm9wZXJ0eX1gICk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHZhbGlkYXRlUHJvcGVydHlQaGFzZVBhaXIoIHByb3BlcnR5OiBSZWFkT25seVByb3BlcnR5PHVua25vd24+LCBwaGFzZTogUHJvcGVydHlTdGF0ZVBoYXNlICk6IHZvaWQge1xyXG4gICAgUHJvcGVydHlTdGF0ZUhhbmRsZXIudmFsaWRhdGVJbnN0cnVtZW50ZWRQcm9wZXJ0eSggcHJvcGVydHkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgTWFwUGFpciBhc3NvY2lhdGVkIHdpdGggdGhlIHByb3ZlZCBQcm9wZXJ0eVN0YXRlUGhhc2VzXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRNYXBQYWlyRnJvbVBoYXNlcyggYmVmb3JlUGhhc2U6IFByb3BlcnR5U3RhdGVQaGFzZSwgYWZ0ZXJQaGFzZTogUHJvcGVydHlTdGF0ZVBoYXNlICk6IE9yZGVyRGVwZW5kZW5jeU1hcFBhaXIge1xyXG4gICAgY29uc3QgbWF0Y2hlZFBhaXJzID0gdGhpcy5tYXBQYWlycy5maWx0ZXIoIG1hcFBhaXIgPT4gYmVmb3JlUGhhc2UgPT09IG1hcFBhaXIuYmVmb3JlUGhhc2UgJiYgYWZ0ZXJQaGFzZSA9PT0gbWFwUGFpci5hZnRlclBoYXNlICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBtYXRjaGVkUGFpcnMubGVuZ3RoID09PSAxLCAnb25lIGFuZCBvbmx5IG9uZSBtYXAgc2hvdWxkIG1hdGNoIHRoZSBwcm92aWRlZCBwaGFzZXMnICk7XHJcbiAgICByZXR1cm4gbWF0Y2hlZFBhaXJzWyAwIF07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWdpc3RlciB0aGF0IG9uZSBQcm9wZXJ0eSBtdXN0IGhhdmUgYSBcIlBoYXNlXCIgYXBwbGllZCBmb3IgUGhFVC1pTyBzdGF0ZSBiZWZvcmUgYW5vdGhlciBQcm9wZXJ0eSdzIFBoYXNlLiBBIFBoYXNlXHJcbiAgICogaXMgYW4gZW5kaW5nIHN0YXRlIGluIFBoRVQtaU8gc3RhdGUgc2V0IHdoZXJlIFByb3BlcnR5IHZhbHVlcyBzb2xpZGlmeSwgbm90aWZpY2F0aW9ucyBmb3IgdmFsdWUgY2hhbmdlcyBhcmUgY2FsbGVkLlxyXG4gICAqIFRoZSBQaEVULWlPIHN0YXRlIGVuZ2luZSB3aWxsIGFsd2F5cyB1bmRlZmVyIGEgUHJvcGVydHkgYmVmb3JlIGl0IG5vdGlmaWVzIGl0cyBsaXN0ZW5lcnMuIFRoaXMgaXMgZm9yIHJlZ2lzdGVyaW5nXHJcbiAgICogdHdvIGRpZmZlcmVudCBQcm9wZXJ0aWVzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGJlZm9yZVByb3BlcnR5IC0gdGhlIFByb3BlcnR5IHRoYXQgbmVlZHMgdG8gYmUgc2V0IGJlZm9yZSB0aGUgc2Vjb25kOyBtdXN0IGJlIGluc3RydW1lbnRlZCBmb3IgUGhFVC1pT1xyXG4gICAqIEBwYXJhbSBiZWZvcmVQaGFzZVxyXG4gICAqIEBwYXJhbSBhZnRlclByb3BlcnR5IC0gbXVzdCBiZSBpbnN0cnVtZW50ZWQgZm9yIFBoRVQtaU9cclxuICAgKiBAcGFyYW0gYWZ0ZXJQaGFzZVxyXG4gICAqL1xyXG4gIHB1YmxpYyByZWdpc3RlclBoZXRpb09yZGVyRGVwZW5kZW5jeSggYmVmb3JlUHJvcGVydHk6IFJlYWRPbmx5UHJvcGVydHk8SW50ZW50aW9uYWxBbnk+LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmVmb3JlUGhhc2U6IFByb3BlcnR5U3RhdGVQaGFzZSwgYWZ0ZXJQcm9wZXJ0eTogUmVhZE9ubHlQcm9wZXJ0eTxJbnRlbnRpb25hbEFueT4sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZnRlclBoYXNlOiBQcm9wZXJ0eVN0YXRlUGhhc2UgKTogdm9pZCB7XHJcbiAgICBpZiAoIFRhbmRlbS5QSEVUX0lPX0VOQUJMRUQgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoICEoIGJlZm9yZVBoYXNlID09PSBQcm9wZXJ0eVN0YXRlUGhhc2UuTk9USUZZICYmIGFmdGVyUGhhc2UgPT09IFByb3BlcnR5U3RhdGVQaGFzZS5VTkRFRkVSICksXHJcbiAgICAgICAgJ0l0IGlzIFBoRVQtaU8gcG9saWN5IGF0IHRoaXMgdGltZSB0byBoYXZlIGFsbCBub3RpZmljYXRpb25zIG9jY3VyIGFmdGVyIGFsbCBzdGF0ZSB2YWx1ZXMgaGF2ZSBiZWVuIGFwcGxpZWQuJyApO1xyXG5cclxuICAgICAgdGhpcy52YWxpZGF0ZVByb3BlcnR5UGhhc2VQYWlyKCBiZWZvcmVQcm9wZXJ0eSwgYmVmb3JlUGhhc2UgKTtcclxuICAgICAgdGhpcy52YWxpZGF0ZVByb3BlcnR5UGhhc2VQYWlyKCBhZnRlclByb3BlcnR5LCBhZnRlclBoYXNlICk7XHJcbiAgICAgIGFzc2VydCAmJiBiZWZvcmVQcm9wZXJ0eSA9PT0gYWZ0ZXJQcm9wZXJ0eSAmJiBhc3NlcnQoIGJlZm9yZVBoYXNlICE9PSBhZnRlclBoYXNlLCAnY2Fubm90IHNldCBzYW1lIFByb3BlcnR5IHRvIHNhbWUgcGhhc2UnICk7XHJcblxyXG4gICAgICBjb25zdCBtYXBQYWlyID0gdGhpcy5nZXRNYXBQYWlyRnJvbVBoYXNlcyggYmVmb3JlUGhhc2UsIGFmdGVyUGhhc2UgKTtcclxuXHJcbiAgICAgIG1hcFBhaXIuYWRkT3JkZXJEZXBlbmRlbmN5KCBiZWZvcmVQcm9wZXJ0eS50YW5kZW0ucGhldGlvSUQsIGFmdGVyUHJvcGVydHkudGFuZGVtLnBoZXRpb0lEICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiB7UHJvcGVydHl9IHByb3BlcnR5IC0gbXVzdCBiZSBpbnN0cnVtZW50ZWQgZm9yIFBoRVQtaU9cclxuICAgKiB7Ym9vbGVhbn0gLSB0cnVlIGlmIFByb3BlcnR5IGlzIGluIGFueSBvcmRlciBkZXBlbmRlbmN5XHJcbiAgICovXHJcbiAgcHJpdmF0ZSBwcm9wZXJ0eUluQW5PcmRlckRlcGVuZGVuY3koIHByb3BlcnR5OiBSZWFkT25seVByb3BlcnR5PHVua25vd24+ICk6IGJvb2xlYW4ge1xyXG4gICAgUHJvcGVydHlTdGF0ZUhhbmRsZXIudmFsaWRhdGVJbnN0cnVtZW50ZWRQcm9wZXJ0eSggcHJvcGVydHkgKTtcclxuICAgIHJldHVybiBfLnNvbWUoIHRoaXMubWFwUGFpcnMsIG1hcFBhaXIgPT4gbWFwUGFpci51c2VzUGhldGlvSUQoIHByb3BlcnR5LnRhbmRlbS5waGV0aW9JRCApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVbnJlZ2lzdGVycyBhbGwgb3JkZXIgZGVwZW5kZW5jaWVzIGZvciB0aGUgZ2l2ZW4gUHJvcGVydHlcclxuICAgKiB7UmVhZE9ubHlQcm9wZXJ0eX0gcHJvcGVydHkgLSBtdXN0IGJlIGluc3RydW1lbnRlZCBmb3IgUGhFVC1pT1xyXG4gICAqL1xyXG4gIHB1YmxpYyB1bnJlZ2lzdGVyT3JkZXJEZXBlbmRlbmNpZXNGb3JQcm9wZXJ0eSggcHJvcGVydHk6IFJlYWRPbmx5UHJvcGVydHk8SW50ZW50aW9uYWxBbnk+ICk6IHZvaWQge1xyXG4gICAgaWYgKCBUYW5kZW0uUEhFVF9JT19FTkFCTEVEICkge1xyXG4gICAgICBQcm9wZXJ0eVN0YXRlSGFuZGxlci52YWxpZGF0ZUluc3RydW1lbnRlZFByb3BlcnR5KCBwcm9wZXJ0eSApO1xyXG5cclxuICAgICAgLy8gQmUgZ3JhY2VmdWwgaWYgZ2l2ZW4gYSBQcm9wZXJ0eSB0aGF0IGlzIG5vdCByZWdpc3RlcmVkIGluIGFuIG9yZGVyIGRlcGVuZGVuY3kuXHJcbiAgICAgIGlmICggdGhpcy5wcm9wZXJ0eUluQW5PcmRlckRlcGVuZGVuY3koIHByb3BlcnR5ICkgKSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5wcm9wZXJ0eUluQW5PcmRlckRlcGVuZGVuY3koIHByb3BlcnR5ICksICdQcm9wZXJ0eSBtdXN0IGJlIHJlZ2lzdGVyZWQgaW4gYW4gb3JkZXIgZGVwZW5kZW5jeSB0byBiZSB1bnJlZ2lzdGVyZWQnICk7XHJcblxyXG4gICAgICAgIHRoaXMubWFwUGFpcnMuZm9yRWFjaCggbWFwUGFpciA9PiBtYXBQYWlyLnVucmVnaXN0ZXJPcmRlckRlcGVuZGVuY2llc0ZvclByb3BlcnR5KCBwcm9wZXJ0eSApICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIHJlZ2lzdGVyZWQgUHJvcGVydHkgUGhhc2Ugb3JkZXIgZGVwZW5kZW5jaWVzLCB1bmRlZmVyIGFsbCBBWE9OL1Byb3BlcnR5IFBoRVQtaU8gRWxlbWVudHMgdG8gdGFrZSB0aGVpclxyXG4gICAqIGNvcnJlY3QgdmFsdWVzIGFuZCBoYXZlIGVhY2ggbm90aWZ5IHRoZWlyIGxpc3RlbmVycy5cclxuICAgKiB7U2V0LjxzdHJpbmc+fSBwaGV0aW9JRHNJblN0YXRlIC0gc2V0IG9mIHBoZXRpb0lEcyB0aGF0IHdlcmUgc2V0IGluIHN0YXRlXHJcbiAgICovXHJcbiAgcHJpdmF0ZSB1bmRlZmVyQW5kTm90aWZ5UHJvcGVydGllcyggcGhldGlvSURzSW5TdGF0ZTogU2V0PHN0cmluZz4gKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmluaXRpYWxpemVkLCAnbXVzdCBiZSBpbml0aWFsaXplZCBiZWZvcmUgZ2V0dGluZyBjYWxsZWQnICk7XHJcblxyXG4gICAgLy8ge09iamVjdC48c3RyaW5nLGJvb2xlYW4+fSAtIHRydWUgaWYgYSBwaGV0aW9JRCArIHBoYXNlIHBhaXIgaGFzIGJlZW4gYXBwbGllZCwga2V5cyBhcmUgdGhlIGNvbWJpbmF0aW9uIG9mXHJcbiAgICAvLyBwaGV0aW9JRHMgYW5kIHBoYXNlLCBzZWUgUGhhc2VDYWxsYmFjay5nZXRUZXJtKClcclxuICAgIGNvbnN0IGNvbXBsZXRlZFBoYXNlcyA9IHt9O1xyXG5cclxuICAgIC8vIHRvIHN1cHBvcnQgZmFpbGluZyBvdXQgaW5zdGVhZCBvZiBpbmZpbml0ZSBsb29wXHJcbiAgICBsZXQgbnVtYmVyT2ZJdGVyYXRpb25zID0gMDtcclxuXHJcbiAgICAvLyBOb3JtYWxseSB3ZSB3b3VsZCBsaWtlIHRvIHVuZGVmZXIgdGhpbmdzIGJlZm9yZSBub3RpZnksIGJ1dCBtYWtlIHN1cmUgdGhpcyBpcyBkb25lIGluIGFjY29yZGFuY2Ugd2l0aCB0aGUgb3JkZXIgZGVwZW5kZW5jaWVzLlxyXG4gICAgd2hpbGUgKCB0aGlzLnBoYXNlQ2FsbGJhY2tTZXRzLnNpemUgPiAwICkge1xyXG4gICAgICBudW1iZXJPZkl0ZXJhdGlvbnMrKztcclxuXHJcbiAgICAgIC8vIEVycm9yIGNhc2UgbG9nZ2luZ1xyXG4gICAgICBpZiAoIG51bWJlck9mSXRlcmF0aW9ucyA+IDUwMDAgKSB7XHJcbiAgICAgICAgdGhpcy5lcnJvckluVW5kZWZlckFuZE5vdGlmeVN0ZXAoIGNvbXBsZXRlZFBoYXNlcyApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBUcnkgdG8gdW5kZWZlciBhcyBtdWNoIGFzIHBvc3NpYmxlIGJlZm9yZSBub3RpZnlpbmdcclxuICAgICAgdGhpcy5hdHRlbXB0VG9BcHBseVBoYXNlcyggUHJvcGVydHlTdGF0ZVBoYXNlLlVOREVGRVIsIGNvbXBsZXRlZFBoYXNlcywgcGhldGlvSURzSW5TdGF0ZSApO1xyXG4gICAgICB0aGlzLmF0dGVtcHRUb0FwcGx5UGhhc2VzKCBQcm9wZXJ0eVN0YXRlUGhhc2UuTk9USUZZLCBjb21wbGV0ZWRQaGFzZXMsIHBoZXRpb0lEc0luU3RhdGUgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG5cclxuICBwcml2YXRlIGVycm9ySW5VbmRlZmVyQW5kTm90aWZ5U3RlcCggY29tcGxldGVkUGhhc2VzOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiApOiB2b2lkIHtcclxuXHJcbiAgICAvLyBjb21iaW5lIHBoZXRpb0lEIGFuZCBQaGFzZSBpbnRvIGEgc2luZ2xlIHN0cmluZyB0byBrZWVwIHRoaXMgcHJvY2VzcyBzcGVjaWZpYy5cclxuICAgIGNvbnN0IHN0aWxsVG9Eb0lEUGhhc2VQYWlyczogQXJyYXk8c3RyaW5nPiA9IFtdO1xyXG4gICAgdGhpcy5waGFzZUNhbGxiYWNrU2V0cy5mb3JFYWNoKCBwaGFzZUNhbGxiYWNrID0+IHN0aWxsVG9Eb0lEUGhhc2VQYWlycy5wdXNoKCBwaGFzZUNhbGxiYWNrLmdldFRlcm0oKSApICk7XHJcblxyXG4gICAgY29uc3QgcmVsZXZhbnRPcmRlckRlcGVuZGVuY2llczogQXJyYXk8T3JkZXJEZXBlbmRlbmN5PiA9IFtdO1xyXG5cclxuICAgIHRoaXMubWFwUGFpcnMuZm9yRWFjaCggbWFwUGFpciA9PiB7XHJcbiAgICAgIGNvbnN0IGJlZm9yZU1hcCA9IG1hcFBhaXIuYmVmb3JlTWFwO1xyXG4gICAgICBmb3IgKCBjb25zdCBbIGJlZm9yZVBoZXRpb0lELCBhZnRlclBoZXRpb0lEcyBdIG9mIGJlZm9yZU1hcCApIHtcclxuICAgICAgICBhZnRlclBoZXRpb0lEcy5mb3JFYWNoKCBhZnRlclBoZXRpb0lEID0+IHtcclxuICAgICAgICAgIGNvbnN0IGJlZm9yZVRlcm0gPSBiZWZvcmVQaGV0aW9JRCArIGJlZm9yZU1hcC5iZWZvcmVQaGFzZTtcclxuICAgICAgICAgIGNvbnN0IGFmdGVyVGVybSA9IGFmdGVyUGhldGlvSUQgKyBiZWZvcmVNYXAuYWZ0ZXJQaGFzZTtcclxuICAgICAgICAgIGlmICggc3RpbGxUb0RvSURQaGFzZVBhaXJzLmluY2x1ZGVzKCBiZWZvcmVUZXJtICkgfHwgc3RpbGxUb0RvSURQaGFzZVBhaXJzLmluY2x1ZGVzKCBhZnRlclRlcm0gKSApIHtcclxuICAgICAgICAgICAgcmVsZXZhbnRPcmRlckRlcGVuZGVuY2llcy5wdXNoKCB7XHJcbiAgICAgICAgICAgICAgYmVmb3JlVGVybTogYmVmb3JlVGVybSxcclxuICAgICAgICAgICAgICBhZnRlclRlcm06IGFmdGVyVGVybVxyXG4gICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgbGV0IHN0cmluZyA9ICcnO1xyXG4gICAgY29uc29sZS5sb2coICdzdGlsbCB0byBiZSB1bmRlZmVycmVkJywgdGhpcy5waGFzZUNhbGxiYWNrU2V0cy51bmRlZmVyU2V0ICk7XHJcbiAgICBjb25zb2xlLmxvZyggJ3N0aWxsIHRvIGJlIG5vdGlmaWVkJywgdGhpcy5waGFzZUNhbGxiYWNrU2V0cy5ub3RpZnlTZXQgKTtcclxuICAgIGNvbnNvbGUubG9nKCAnb3JkZXIgZGVwZW5kZW5jaWVzIHRoYXQgYXBwbHkgdG8gdGhlIHN0aWxsIHRvZG9zJywgcmVsZXZhbnRPcmRlckRlcGVuZGVuY2llcyApO1xyXG4gICAgcmVsZXZhbnRPcmRlckRlcGVuZGVuY2llcy5mb3JFYWNoKCBvcmRlckRlcGVuZGVuY3kgPT4ge1xyXG4gICAgICBzdHJpbmcgKz0gYCR7b3JkZXJEZXBlbmRlbmN5LmJlZm9yZVRlcm19XFx0JHtvcmRlckRlcGVuZGVuY3kuYWZ0ZXJUZXJtfVxcbmA7XHJcbiAgICB9ICk7XHJcbiAgICBjb25zb2xlLmxvZyggJ1xcblxcbmluIGdyYXBoYWJsZSBmb3JtOlxcblxcbicsIHN0cmluZyApO1xyXG5cclxuICAgIGNvbnN0IGFzc2VydE1lc3NhZ2UgPSAnSW1wb3NzaWJsZSBzZXQgc3RhdGU6IGZyb20gdW5kZWZlckFuZE5vdGlmeVByb3BlcnRpZXM7IG9yZGVyaW5nIGNvbnN0cmFpbnRzIGNhbm5vdCBiZSBzYXRpc2ZpZWQnO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggZmFsc2UsIGFzc2VydE1lc3NhZ2UgKTtcclxuXHJcbiAgICAvLyBXZSBtdXN0IGV4aXQgaGVyZSBldmVuIGlmIGFzc2VydGlvbnMgYXJlIGRpc2FibGVkIHNvIGl0IHdvdWxkbid0IGxvY2sgdXAgdGhlIGJyb3dzZXIuXHJcbiAgICBpZiAoICFhc3NlcnQgKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggYXNzZXJ0TWVzc2FnZSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT25seSBmb3IgVGVzdGluZyFcclxuICAgKiBHZXQgdGhlIG51bWJlciBvZiBvcmRlciBkZXBlbmRlbmNpZXMgcmVnaXN0ZXJlZCBpbiB0aGlzIGNsYXNzXHJcbiAgICpcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TnVtYmVyT2ZPcmRlckRlcGVuZGVuY2llcygpOiBudW1iZXIge1xyXG4gICAgbGV0IGNvdW50ID0gMDtcclxuICAgIHRoaXMubWFwUGFpcnMuZm9yRWFjaCggbWFwUGFpciA9PiB7XHJcbiAgICAgIG1hcFBhaXIuYWZ0ZXJNYXAuZm9yRWFjaCggdmFsdWVTZXQgPT4geyBjb3VudCArPSB2YWx1ZVNldC5zaXplOyB9ICk7XHJcbiAgICB9ICk7XHJcbiAgICByZXR1cm4gY291bnQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHbyB0aHJvdWdoIGFsbCBwaGFzZXMgc3RpbGwgdG8gYmUgYXBwbGllZCwgYW5kIGFwcGx5IHRoZW0gaWYgdGhlIG9yZGVyIGRlcGVuZGVuY2llcyBhbGxvdyBpdC4gT25seSBhcHBseSBmb3IgdGhlXHJcbiAgICogcGFydGljdWxhciBwaGFzZSBwcm92aWRlZC4gSW4gZ2VuZXJhbCBVTkRFRkVSIG11c3Qgb2NjdXIgYmVmb3JlIHRoZSBzYW1lIHBoZXRpb0lEIGdldHMgTk9USUZZLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHBoYXNlIC0gb25seSBhcHBseSBQaGFzZUNhbGxiYWNrcyBmb3IgdGhpcyBwYXJ0aWN1bGFyIFByb3BlcnR5U3RhdGVQaGFzZVxyXG4gICAqIEBwYXJhbSBjb21wbGV0ZWRQaGFzZXMgLSBtYXAgdGhhdCBrZWVwcyB0cmFjayBvZiBjb21wbGV0ZWQgcGhhc2VzXHJcbiAgICogQHBhcmFtIHBoZXRpb0lEc0luU3RhdGUgLSBzZXQgb2YgcGhldGlvSURzIHRoYXQgd2VyZSBzZXQgaW4gc3RhdGVcclxuICAgKi9cclxuICBwcml2YXRlIGF0dGVtcHRUb0FwcGx5UGhhc2VzKCBwaGFzZTogUHJvcGVydHlTdGF0ZVBoYXNlLCBjb21wbGV0ZWRQaGFzZXM6IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+LCBwaGV0aW9JRHNJblN0YXRlOiBTZXQ8c3RyaW5nPiApOiB2b2lkIHtcclxuXHJcbiAgICBjb25zdCBwaGFzZUNhbGxiYWNrU2V0ID0gdGhpcy5waGFzZUNhbGxiYWNrU2V0cy5nZXRTZXRGcm9tUGhhc2UoIHBoYXNlICk7XHJcblxyXG4gICAgZm9yICggY29uc3QgcGhhc2VDYWxsYmFja1RvUG90ZW50aWFsbHlBcHBseSBvZiBwaGFzZUNhbGxiYWNrU2V0ICkge1xyXG5cclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggcGhhc2VDYWxsYmFja1RvUG90ZW50aWFsbHlBcHBseS5waGFzZSA9PT0gcGhhc2UsICdwaGFzZUNhbGxiYWNrU2V0IHNob3VsZCBvbmx5IGluY2x1ZGUgY2FsbGJhY2tzIGZvciBwcm92aWRlZCBwaGFzZScgKTtcclxuXHJcbiAgICAgIC8vIG9ubHkgdHJ5IHRvIGNoZWNrIHRoZSBvcmRlciBkZXBlbmRlbmNpZXMgdG8gc2VlIGlmIHRoaXMgaGFzIHRvIGJlIGFmdGVyIHNvbWV0aGluZyB0aGF0IGlzIGluY29tcGxldGUuXHJcbiAgICAgIGlmICggdGhpcy5waGV0aW9JRENhbkFwcGx5UGhhc2UoIHBoYXNlQ2FsbGJhY2tUb1BvdGVudGlhbGx5QXBwbHkucGhldGlvSUQsIHBoYXNlLCBjb21wbGV0ZWRQaGFzZXMsIHBoZXRpb0lEc0luU3RhdGUgKSApIHtcclxuXHJcbiAgICAgICAgLy8gRmlyZSB0aGUgbGlzdGVuZXI7XHJcbiAgICAgICAgcGhhc2VDYWxsYmFja1RvUG90ZW50aWFsbHlBcHBseS5saXN0ZW5lcigpO1xyXG5cclxuICAgICAgICAvLyBSZW1vdmUgaXQgZnJvbSB0aGUgbWFpbiBsaXN0IHNvIHRoYXQgaXQgZG9lc24ndCBnZXQgY2FsbGVkIGFnYWluLlxyXG4gICAgICAgIHBoYXNlQ2FsbGJhY2tTZXQuZGVsZXRlKCBwaGFzZUNhbGxiYWNrVG9Qb3RlbnRpYWxseUFwcGx5ICk7XHJcblxyXG4gICAgICAgIC8vIEtlZXAgdHJhY2sgb2YgYWxsIGNvbXBsZXRlZCBQaGFzZUNhbGxiYWNrc1xyXG4gICAgICAgIGNvbXBsZXRlZFBoYXNlc1sgcGhhc2VDYWxsYmFja1RvUG90ZW50aWFsbHlBcHBseS5nZXRUZXJtKCkgXSA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBwaGV0aW9JRCAtIHRoaW5rIG9mIHRoaXMgYXMgdGhlIFwiYWZ0ZXJQaGV0aW9JRFwiIHNpbmNlIHRoZXJlIG1heSBiZSBzb21lIHBoYXNlcyB0aGF0IG5lZWQgdG8gYmUgYXBwbGllZCBiZWZvcmUgaXQgaGFzIHRoaXMgcGhhc2UgZG9uZS5cclxuICAgKiBAcGFyYW0gcGhhc2VcclxuICAgKiBAcGFyYW0gY29tcGxldGVkUGhhc2VzIC0gbWFwIHRoYXQga2VlcHMgdHJhY2sgb2YgY29tcGxldGVkIHBoYXNlc1xyXG4gICAqIEBwYXJhbSBwaGV0aW9JRHNJblN0YXRlIC0gc2V0IG9mIHBoZXRpb0lEcyB0aGF0IHdlcmUgc2V0IGluIHN0YXRlXHJcbiAgICogQHBhcmFtIC0gaWYgdGhlIHByb3ZpZGVkIHBoYXNlIGNhbiBiZSBhcHBsaWVkIGdpdmVuIHRoZSBkZXBlbmRlbmN5IG9yZGVyIGRlcGVuZGVuY2llcyBvZiB0aGUgc3RhdGUgZW5naW5lLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgcGhldGlvSURDYW5BcHBseVBoYXNlKCBwaGV0aW9JRDogUGhldGlvSUQsIHBoYXNlOiBQcm9wZXJ0eVN0YXRlUGhhc2UsIGNvbXBsZXRlZFBoYXNlczogUmVjb3JkPHN0cmluZywgYm9vbGVhbj4sIHBoZXRpb0lEc0luU3RhdGU6IFNldDxzdHJpbmc+ICk6IGJvb2xlYW4ge1xyXG5cclxuICAgIC8vIFVuZGVmZXIgbXVzdCBoYXBwZW4gYmVmb3JlIG5vdGlmeVxyXG4gICAgaWYgKCBwaGFzZSA9PT0gUHJvcGVydHlTdGF0ZVBoYXNlLk5PVElGWSAmJiAhY29tcGxldGVkUGhhc2VzWyBwaGV0aW9JRCArIFByb3BlcnR5U3RhdGVQaGFzZS5VTkRFRkVSIF0gKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBHZXQgYSBsaXN0IG9mIHRoZSBtYXBzIGZvciB0aGlzIHBoYXNlIGJlaW5nIGFwcGxpZXMuXHJcbiAgICBjb25zdCBtYXBzVG9DaGVjazogQXJyYXk8UGhhc2VNYXA+ID0gW107XHJcbiAgICB0aGlzLm1hcFBhaXJzLmZvckVhY2goIG1hcFBhaXIgPT4ge1xyXG4gICAgICBpZiAoIG1hcFBhaXIuYWZ0ZXJQaGFzZSA9PT0gcGhhc2UgKSB7XHJcblxyXG4gICAgICAgIC8vIFVzZSB0aGUgXCJhZnRlck1hcFwiIGJlY2F1c2UgYmVsb3cgbG9va3MgdXAgd2hhdCBuZWVkcyB0byBjb21lIGJlZm9yZS5cclxuICAgICAgICBtYXBzVG9DaGVjay5wdXNoKCBtYXBQYWlyLmFmdGVyTWFwICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBPKDIpXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBtYXBzVG9DaGVjay5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgbWFwVG9DaGVjayA9IG1hcHNUb0NoZWNrWyBpIF07XHJcbiAgICAgIGlmICggIW1hcFRvQ2hlY2suaGFzKCBwaGV0aW9JRCApICkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHNldE9mVGhpbmdzVGhhdFNob3VsZENvbWVGaXJzdCA9IG1hcFRvQ2hlY2suZ2V0KCBwaGV0aW9JRCApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBzZXRPZlRoaW5nc1RoYXRTaG91bGRDb21lRmlyc3QsICdtdXN0IGhhdmUgdGhpcyBzZXQnICk7XHJcblxyXG4gICAgICAvLyBPKEspIHdoZXJlIEsgaXMgdGhlIG51bWJlciBvZiBlbGVtZW50cyB0aGF0IHNob3VsZCBjb21lIGJlZm9yZSBQcm9wZXJ0eSBYXHJcbiAgICAgIGZvciAoIGNvbnN0IGJlZm9yZVBoZXRpb0lEIG9mIHNldE9mVGhpbmdzVGhhdFNob3VsZENvbWVGaXJzdCEgKSB7XHJcblxyXG4gICAgICAgIC8vIGNoZWNrIGlmIHRoZSBiZWZvcmUgcGhhc2UgZm9yIHRoaXMgb3JkZXIgZGVwZW5kZW5jeSBoYXMgYWxyZWFkeSBiZWVuIGNvbXBsZXRlZFxyXG4gICAgICAgIC8vIE1ha2Ugc3VyZSB0aGF0IHdlIG9ubHkgY2FyZSBhYm91dCBlbGVtZW50cyB0aGF0IHdlcmUgYWN0dWFsbHkgc2V0IGR1cmluZyB0aGlzIHN0YXRlIHNldFxyXG4gICAgICAgIGlmICggIWNvbXBsZXRlZFBoYXNlc1sgYmVmb3JlUGhldGlvSUQgKyBtYXBUb0NoZWNrLmJlZm9yZVBoYXNlIF0gJiZcclxuICAgICAgICAgICAgIHBoZXRpb0lEc0luU3RhdGUuaGFzKCBiZWZvcmVQaGV0aW9JRCApICYmIHBoZXRpb0lEc0luU3RhdGUuaGFzKCBwaGV0aW9JRCApICkge1xyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBQT0pTTyBmb3IgYSBjYWxsYmFjayBmb3IgYSBzcGVjaWZpYyBQaGFzZSBpbiBhIFByb3BlcnR5J3Mgc3RhdGUgc2V0IGxpZmVjeWNsZS4gU2VlIHVuZGVmZXJBbmROb3RpZnlQcm9wZXJ0aWVzKClcclxuY2xhc3MgUGhhc2VDYWxsYmFjayB7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKFxyXG4gICAgcHVibGljIHJlYWRvbmx5IHBoZXRpb0lEOiBQaGV0aW9JRCxcclxuICAgIHB1YmxpYyByZWFkb25seSBwaGFzZTogUHJvcGVydHlTdGF0ZVBoYXNlLFxyXG4gICAgcHVibGljIHJlYWRvbmx5IGxpc3RlbmVyOiAoICgpID0+IHZvaWQgKSA9IF8ubm9vcCApIHtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIHtzdHJpbmd9IC0gdW5pcXVlIHRlcm0gZm9yIHRoZSBpZC9waGFzZSBwYWlyXHJcbiAgICovXHJcbiAgcHVibGljIGdldFRlcm0oKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0aGlzLnBoZXRpb0lEICsgdGhpcy5waGFzZTtcclxuICB9XHJcbn1cclxuXHJcbmNsYXNzIE9yZGVyRGVwZW5kZW5jeU1hcFBhaXIge1xyXG5cclxuICBwdWJsaWMgcmVhZG9ubHkgYmVmb3JlTWFwOiBQaGFzZU1hcDtcclxuICBwdWJsaWMgcmVhZG9ubHkgYWZ0ZXJNYXA6IFBoYXNlTWFwO1xyXG4gIHB1YmxpYyByZWFkb25seSBiZWZvcmVQaGFzZTogUHJvcGVydHlTdGF0ZVBoYXNlO1xyXG4gIHB1YmxpYyByZWFkb25seSBhZnRlclBoYXNlOiBQcm9wZXJ0eVN0YXRlUGhhc2U7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggYmVmb3JlUGhhc2U6IFByb3BlcnR5U3RhdGVQaGFzZSwgYWZ0ZXJQaGFzZTogUHJvcGVydHlTdGF0ZVBoYXNlICkge1xyXG5cclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IsIGl0IGlzIGVhc2llc3QgdG8gZnVkZ2UgaGVyZSBzaW5jZSB3ZSBhcmUgYWRkaW5nIHRoZSBQaGFzZU1hcCBwcm9wZXJ0aWVzIGp1c3QgYmVsb3cgaGVyZS5cclxuICAgIHRoaXMuYmVmb3JlTWFwID0gbmV3IE1hcCgpO1xyXG4gICAgdGhpcy5iZWZvcmVNYXAuYmVmb3JlUGhhc2UgPSBiZWZvcmVQaGFzZTtcclxuICAgIHRoaXMuYmVmb3JlTWFwLmFmdGVyUGhhc2UgPSBhZnRlclBoYXNlO1xyXG5cclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IsIGl0IGlzIGVhc2llc3QgdG8gZnVkZ2UgaGVyZSBzaW5jZSB3ZSBhcmUgYWRkaW5nIHRoZSBQaGFzZU1hcCBwcm9wZXJ0aWVzIGp1c3QgYmVsb3cgaGVyZS5cclxuICAgIHRoaXMuYWZ0ZXJNYXAgPSBuZXcgTWFwKCk7XHJcbiAgICB0aGlzLmFmdGVyTWFwLmJlZm9yZVBoYXNlID0gYmVmb3JlUGhhc2U7XHJcbiAgICB0aGlzLmFmdGVyTWFwLmFmdGVyUGhhc2UgPSBhZnRlclBoYXNlO1xyXG5cclxuICAgIHRoaXMuYmVmb3JlTWFwLm90aGVyTWFwID0gdGhpcy5hZnRlck1hcDtcclxuICAgIHRoaXMuYWZ0ZXJNYXAub3RoZXJNYXAgPSB0aGlzLmJlZm9yZU1hcDtcclxuXHJcbiAgICB0aGlzLmJlZm9yZVBoYXNlID0gYmVmb3JlUGhhc2U7XHJcbiAgICB0aGlzLmFmdGVyUGhhc2UgPSBhZnRlclBoYXNlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVnaXN0ZXIgYW4gb3JkZXIgZGVwZW5kZW5jeSBiZXR3ZWVuIHR3byBwaGV0aW9JRHMuIFRoaXMgd2lsbCBhZGQgZGF0YSB0byBtYXBzIGluIFwiYm90aCBkaXJlY3Rpb25cIi4gSWYgYWNjZXNzaW5nXHJcbiAgICogd2l0aCBqdXN0IHRoZSBiZWZvcmVQaGV0aW9JRCwgb3Igd2l0aCB0aGUgYWZ0ZXJQaGV0aW9JRC5cclxuICAgKi9cclxuICBwdWJsaWMgYWRkT3JkZXJEZXBlbmRlbmN5KCBiZWZvcmVQaGV0aW9JRDogUGhldGlvSUQsIGFmdGVyUGhldGlvSUQ6IFBoZXRpb0lEICk6IHZvaWQge1xyXG4gICAgaWYgKCAhdGhpcy5iZWZvcmVNYXAuaGFzKCBiZWZvcmVQaGV0aW9JRCApICkge1xyXG4gICAgICB0aGlzLmJlZm9yZU1hcC5zZXQoIGJlZm9yZVBoZXRpb0lELCBuZXcgU2V0PHN0cmluZz4oKSApO1xyXG4gICAgfVxyXG4gICAgdGhpcy5iZWZvcmVNYXAuZ2V0KCBiZWZvcmVQaGV0aW9JRCApIS5hZGQoIGFmdGVyUGhldGlvSUQgKTtcclxuXHJcbiAgICBpZiAoICF0aGlzLmFmdGVyTWFwLmhhcyggYWZ0ZXJQaGV0aW9JRCApICkge1xyXG4gICAgICB0aGlzLmFmdGVyTWFwLnNldCggYWZ0ZXJQaGV0aW9JRCwgbmV3IFNldCgpICk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmFmdGVyTWFwLmdldCggYWZ0ZXJQaGV0aW9JRCApIS5hZGQoIGJlZm9yZVBoZXRpb0lEICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVbnJlZ2lzdGVyIGFsbCBvcmRlciBkZXBlbmRlbmNpZXMgZm9yIHRoZSBwcm92aWRlZCBQcm9wZXJ0eVxyXG4gICAqL1xyXG4gIHB1YmxpYyB1bnJlZ2lzdGVyT3JkZXJEZXBlbmRlbmNpZXNGb3JQcm9wZXJ0eSggcHJvcGVydHk6IFJlYWRPbmx5UHJvcGVydHk8dW5rbm93bj4gKTogdm9pZCB7XHJcbiAgICBjb25zdCBwaGV0aW9JRFRvUmVtb3ZlID0gcHJvcGVydHkudGFuZGVtLnBoZXRpb0lEO1xyXG5cclxuICAgIFsgdGhpcy5iZWZvcmVNYXAsIHRoaXMuYWZ0ZXJNYXAgXS5mb3JFYWNoKCBtYXAgPT4ge1xyXG4gICAgICBtYXAuaGFzKCBwaGV0aW9JRFRvUmVtb3ZlICkgJiYgbWFwLmdldCggcGhldGlvSURUb1JlbW92ZSApIS5mb3JFYWNoKCBwaGV0aW9JRCA9PiB7XHJcbiAgICAgICAgY29uc3Qgc2V0T2ZBZnRlck1hcElEcyA9IG1hcC5vdGhlck1hcC5nZXQoIHBoZXRpb0lEICk7XHJcbiAgICAgICAgc2V0T2ZBZnRlck1hcElEcyAmJiBzZXRPZkFmdGVyTWFwSURzLmRlbGV0ZSggcGhldGlvSURUb1JlbW92ZSApO1xyXG5cclxuICAgICAgICAvLyBDbGVhciBvdXQgZW1wdHkgZW50cmllcyB0byBhdm9pZCBoYXZpbmcgbG90cyBvZiBlbXB0eSBTZXRzIHNpdHRpbmcgYXJvdW5kXHJcbiAgICAgICAgc2V0T2ZBZnRlck1hcElEcyEuc2l6ZSA9PT0gMCAmJiBtYXAub3RoZXJNYXAuZGVsZXRlKCBwaGV0aW9JRCApO1xyXG4gICAgICB9ICk7XHJcbiAgICAgIG1hcC5kZWxldGUoIHBoZXRpb0lEVG9SZW1vdmUgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBMb29rIHRocm91Z2ggZXZlcnkgZGVwZW5kZW5jeSBhbmQgbWFrZSBzdXJlIHRoZSBwaGV0aW9JRCB0byByZW1vdmUgaGFzIGJlZW4gY29tcGxldGVseSByZW1vdmVkLlxyXG4gICAgYXNzZXJ0U2xvdyAmJiBbIHRoaXMuYmVmb3JlTWFwLCB0aGlzLmFmdGVyTWFwIF0uZm9yRWFjaCggbWFwID0+IHtcclxuICAgICAgbWFwLmZvckVhY2goICggdmFsdWVQaGV0aW9JRHMsIGtleSApID0+IHtcclxuICAgICAgICBhc3NlcnRTbG93ICYmIGFzc2VydFNsb3coIGtleSAhPT0gcGhldGlvSURUb1JlbW92ZSwgJ3Nob3VsZCBub3QgYmUgYSBrZXknICk7XHJcbiAgICAgICAgYXNzZXJ0U2xvdyAmJiBhc3NlcnRTbG93KCAhdmFsdWVQaGV0aW9JRHMuaGFzKCBwaGV0aW9JRFRvUmVtb3ZlICksICdzaG91bGQgbm90IGJlIGluIGEgdmFsdWUgbGlzdCcgKTtcclxuICAgICAgfSApO1xyXG4gICAgfSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHVzZXNQaGV0aW9JRCggcGhldGlvSUQ6IFBoZXRpb0lEICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuYmVmb3JlTWFwLmhhcyggcGhldGlvSUQgKSB8fCB0aGlzLmFmdGVyTWFwLmhhcyggcGhldGlvSUQgKTtcclxuICB9XHJcbn1cclxuXHJcbi8vIFBPSlNPIHRvIGtlZXAgdHJhY2sgb2YgUGhhc2VDYWxsYmFja3Mgd2hpbGUgcHJvdmlkaW5nIE8oMSkgbG9va3VwIHRpbWUgYmVjYXVzZSBpdCBpcyBidWlsdCBvbiBTZXRcclxuY2xhc3MgUGhhc2VDYWxsYmFja1NldHMge1xyXG4gIHB1YmxpYyByZWFkb25seSB1bmRlZmVyU2V0ID0gbmV3IFNldDxQaGFzZUNhbGxiYWNrPigpO1xyXG4gIHB1YmxpYyByZWFkb25seSBub3RpZnlTZXQgPSBuZXcgU2V0PFBoYXNlQ2FsbGJhY2s+KCk7XHJcblxyXG4gIHB1YmxpYyBnZXQgc2l6ZSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMudW5kZWZlclNldC5zaXplICsgdGhpcy5ub3RpZnlTZXQuc2l6ZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBmb3JFYWNoKCBjYWxsYmFjazogKCBwaGFzZUNhbGxiYWNrOiBQaGFzZUNhbGxiYWNrICkgPT4gbnVtYmVyICk6IHZvaWQge1xyXG4gICAgdGhpcy51bmRlZmVyU2V0LmZvckVhY2goIGNhbGxiYWNrICk7XHJcbiAgICB0aGlzLm5vdGlmeVNldC5mb3JFYWNoKCBjYWxsYmFjayApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFkZFVuZGVmZXJQaGFzZUNhbGxiYWNrKCBwaGFzZUNhbGxiYWNrOiBQaGFzZUNhbGxiYWNrICk6IHZvaWQge1xyXG4gICAgdGhpcy51bmRlZmVyU2V0LmFkZCggcGhhc2VDYWxsYmFjayApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFkZE5vdGlmeVBoYXNlQ2FsbGJhY2soIHBoYXNlQ2FsbGJhY2s6IFBoYXNlQ2FsbGJhY2sgKTogdm9pZCB7XHJcbiAgICB0aGlzLm5vdGlmeVNldC5hZGQoIHBoYXNlQ2FsbGJhY2sgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXRTZXRGcm9tUGhhc2UoIHBoYXNlOiBQcm9wZXJ0eVN0YXRlUGhhc2UgKTogU2V0PFBoYXNlQ2FsbGJhY2s+IHtcclxuICAgIHJldHVybiBwaGFzZSA9PT0gUHJvcGVydHlTdGF0ZVBoYXNlLk5PVElGWSA/IHRoaXMubm90aWZ5U2V0IDogdGhpcy51bmRlZmVyU2V0O1xyXG4gIH1cclxufVxyXG5cclxuYXhvbi5yZWdpc3RlciggJ1Byb3BlcnR5U3RhdGVIYW5kbGVyJywgUHJvcGVydHlTdGF0ZUhhbmRsZXIgKTtcclxuZXhwb3J0IGRlZmF1bHQgUHJvcGVydHlTdGF0ZUhhbmRsZXI7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLE1BQU0sTUFBTSwyQkFBMkI7QUFFOUMsT0FBT0MsSUFBSSxNQUFNLFdBQVc7QUFDNUIsT0FBT0Msa0JBQWtCLE1BQU0seUJBQXlCO0FBQ3hELE9BQU9DLGdCQUFnQixNQUFNLHVCQUF1QjtBQWVwRCxNQUFNQyxvQkFBb0IsQ0FBQztFQU9qQkMsV0FBVyxHQUFHLEtBQUs7RUFFcEJDLFdBQVdBLENBQUEsRUFBRztJQUVuQjtJQUNBO0lBQ0E7SUFDQSxJQUFJLENBQUNDLGlCQUFpQixHQUFHLElBQUlDLGlCQUFpQixDQUFDLENBQUM7O0lBRWhEO0lBQ0E7SUFDQSxJQUFJLENBQUNDLDJCQUEyQixHQUFHLElBQUlDLHNCQUFzQixDQUFFUixrQkFBa0IsQ0FBQ1MsT0FBTyxFQUFFVCxrQkFBa0IsQ0FBQ1MsT0FBUSxDQUFDO0lBQ3ZILElBQUksQ0FBQ0MsMEJBQTBCLEdBQUcsSUFBSUYsc0JBQXNCLENBQUVSLGtCQUFrQixDQUFDUyxPQUFPLEVBQUVULGtCQUFrQixDQUFDVyxNQUFPLENBQUM7SUFDckgsSUFBSSxDQUFDQywwQkFBMEIsR0FBRyxJQUFJSixzQkFBc0IsQ0FBRVIsa0JBQWtCLENBQUNXLE1BQU0sRUFBRVgsa0JBQWtCLENBQUNTLE9BQVEsQ0FBQztJQUNySCxJQUFJLENBQUNJLHlCQUF5QixHQUFHLElBQUlMLHNCQUFzQixDQUFFUixrQkFBa0IsQ0FBQ1csTUFBTSxFQUFFWCxrQkFBa0IsQ0FBQ1csTUFBTyxDQUFDOztJQUVuSDtJQUNBLElBQUksQ0FBQ0csUUFBUSxHQUFHLENBQ2QsSUFBSSxDQUFDUCwyQkFBMkIsRUFDaEMsSUFBSSxDQUFDRywwQkFBMEIsRUFD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