// Copyright 2019-2023, University of Colorado Boulder

/**
 * Supertype for containers that hold dynamic elements that are PhET-iO instrumented. This type handles common
 * features like creating the archetype for the PhET-iO API, and managing created/disposed data stream events.
 *
 * "Dynamic" is an overloaded term, so allow me to explain what it means in the context of this type. A "dynamic element"
 * is an instrumented PhET-iO Element that is conditionally in the PhET-iO API. Most commonly this is because elements
 * can be created and destroyed during the runtime of the sim. Another "dynamic element" for the PhET-iO project is when
 * an element may or may not be created based on a query parameter. In this case, even if the object then exists for the
 * lifetime of the sim, we may still call this "dynamic" as it pertains to this type, and the PhET-iO API.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Emitter from '../../axon/js/Emitter.js';
import validate from '../../axon/js/validate.js';
import arrayRemove from '../../phet-core/js/arrayRemove.js';
import merge from '../../phet-core/js/merge.js';
import optionize from '../../phet-core/js/optionize.js';
import DynamicTandem from './DynamicTandem.js';
import PhetioObject from './PhetioObject.js';
import Tandem, { DYNAMIC_ARCHETYPE_NAME } from './Tandem.js';
import tandemNamespace from './tandemNamespace.js';
import StringIO from './types/StringIO.js';
import isSettingPhetioStateProperty from './isSettingPhetioStateProperty.js';
import isClearingPhetioDynamicElementsProperty from './isClearingPhetioDynamicElementsProperty.js';
// constants
const DEFAULT_CONTAINER_SUFFIX = 'Container';
function archetypeCast(archetype) {
  if (archetype === null) {
    throw new Error('archetype should exist');
  }
  return archetype;
}
class PhetioDynamicElementContainer extends PhetioObject {
  // (phet-io internal)

  // Arguments passed to the archetype when creating it.

  /**
   * @param createElement - function that creates a dynamic readonly element to be housed in
   * this container. All of this dynamic element container's elements will be created from this function, including the
   * archetype.
   * @param defaultArguments - arguments passed to createElement when creating the archetype
   * @param [providedOptions] - describe the Group itself
   */
  constructor(createElement, defaultArguments, providedOptions) {
    const options = optionize()({
      phetioState: false,
      // elements are included in state, but the container will exist in the downstream sim.

      // Many PhET-iO instrumented types live in common code used by multiple sims, and may only be instrumented in a subset of their usages.
      supportsDynamicState: true,
      containerSuffix: DEFAULT_CONTAINER_SUFFIX,
      // TODO: https://github.com/phetsims/tandem/issues/254
      // @ts-expect-error - this is filled in below
      phetioDynamicElementName: undefined
    }, providedOptions);
    assert && assert(Array.isArray(defaultArguments) || typeof defaultArguments === 'function', 'defaultArguments should be an array or a function');
    if (Array.isArray(defaultArguments)) {
      // createElement expects a Tandem as the first arg
      assert && assert(createElement.length === defaultArguments.length + 1, 'mismatched number of arguments');
    }
    assert && Tandem.VALIDATION && assert(!!options.phetioType, 'phetioType must be supplied');
    assert && Tandem.VALIDATION && assert(Array.isArray(options.phetioType.parameterTypes), 'phetioType must supply its parameter types');
    assert && Tandem.VALIDATION && assert(options.phetioType.parameterTypes.length === 1, 'PhetioDynamicElementContainer\'s phetioType must have exactly one parameter type');
    assert && Tandem.VALIDATION && assert(!!options.phetioType.parameterTypes[0], 'PhetioDynamicElementContainer\'s phetioType\'s parameterType must be truthy');
    if (assert && options.tandem?.supplied) {
      assert && Tandem.VALIDATION && assert(options.tandem.name.endsWith(options.containerSuffix), 'PhetioDynamicElementContainer tandems should end with options.containerSuffix');
    }

    // options that depend on other options for their default
    if (options.tandem && !options.phetioDynamicElementName) {
      options.phetioDynamicElementName = options.tandem.name.slice(0, options.tandem.name.length - options.containerSuffix.length);
    }
    super(options);
    this.supportsDynamicState = options.supportsDynamicState;
    this.phetioDynamicElementName = options.phetioDynamicElementName;
    this.createElement = createElement;
    this.defaultArguments = defaultArguments;

    // Can be used as an argument to create other archetypes, but otherwise
    // access should not be needed. This will only be non-null when generating the PhET-iO API, see createArchetype().
    this._archetype = this.createArchetype();

    // subtypes expected to fire this according to individual implementations
    this.elementCreatedEmitter = new Emitter({
      parameters: [{
        valueType: PhetioObject,
        phetioType: options.phetioType.parameterTypes[0],
        name: 'element'
      }, {
        name: 'phetioID',
        phetioType: StringIO
      }],
      tandem: options.tandem.createTandem('elementCreatedEmitter'),
      phetioDocumentation: 'Emitter that fires whenever a new dynamic element is added to the container.'
    });

    // called on disposal of an element
    this.elementDisposedEmitter = new Emitter({
      parameters: [{
        valueType: PhetioObject,
        phetioType: options.phetioType.parameterTypes[0],
        name: 'element'
      }, {
        name: 'phetioID',
        phetioType: StringIO
      }],
      tandem: options.tandem.createTandem('elementDisposedEmitter'),
      phetioDocumentation: 'Emitter that fires whenever a dynamic element is removed from the container.'
    });

    // Emit to the data stream on element creation/disposal, no need to do this in PhET brand
    if (Tandem.PHET_IO_ENABLED) {
      this.elementCreatedEmitter.addListener(element => this.createdEventListener(element));
      this.elementDisposedEmitter.addListener(element => this.disposedEventListener(element));
    }

    // a way to delay creation notifications to a later time, for phet-io state engine support
    this.notificationsDeferred = false;

    // lists to keep track of the created and disposed elements when notifications are deferred.
    // These are used to then flush notifications when they are set to no longer be deferred.
    this.deferredCreations = [];
    this.deferredDisposals = [];

    // provide a way to opt out of containers clearing dynamic state, useful if group elements exist for the lifetime of
    // the sim, see https://github.com/phetsims/tandem/issues/132
    if (Tandem.PHET_IO_ENABLED && this.supportsDynamicState &&
    // don't clear archetypes because they are static.
    !this.phetioIsArchetype) {
      assert && assert(_.hasIn(window, 'phet.phetio.phetioEngine.phetioStateEngine'), 'PhetioDynamicElementContainers must be created once phetioEngine has been constructed');
      const phetioStateEngine = phet.phetio.phetioEngine.phetioStateEngine;

      // On state start, clear out the container and set to defer notifications.
      phetioStateEngine.clearDynamicElementsEmitter.addListener((state, scopeTandem) => {
        // Only clear if this PhetioDynamicElementContainer is in scope of the state to be set
        if (this.tandem.hasAncestor(scopeTandem)) {
          this.clear({
            phetioState: state
          });
          this.setNotificationsDeferred(true);
        }
      });

      // done with state setting
      phetioStateEngine.undeferEmitter.addListener(() => {
        if (this.notificationsDeferred) {
          this.setNotificationsDeferred(false);
        }
      });
      phetioStateEngine.addSetStateHelper((state, stillToSetIDs) => {
        let creationNotified = false;
        let iterationCount = 0;
        while (this.deferredCreations.length > 0) {
          if (iterationCount > 200) {
            throw new Error('Too many iterations in deferred creations, stillToSetIDs = ' + stillToSetIDs.join(', '));
          }
          const deferredCreatedElement = this.deferredCreations[0];
          if (this.stateSetOnAllChildrenOfDynamicElement(deferredCreatedElement.tandem.phetioID, stillToSetIDs)) {
            this.notifyElementCreatedWhileDeferred(deferredCreatedElement);
            creationNotified = true;
          }
          iterationCount++;
        }
        return creationNotified;
      });
    }
  }

  /**
   * @returns true if all children of a single dynamic element (based on phetioID) have had their state set already.
   */
  stateSetOnAllChildrenOfDynamicElement(dynamicElementID, stillToSetIDs) {
    for (let i = 0; i < stillToSetIDs.length; i++) {
      if (phetio.PhetioIDUtils.isAncestor(dynamicElementID, stillToSetIDs[i])) {
        return false;
      }
    }
    return true; // No elements in state that aren't in the completed list
  }

  /**
   * Archetypes are created to generate the baseline file, or to validate against an existing baseline file.  They are
   * PhetioObjects and registered with the phetioEngine, but not send out via notifications from PhetioEngine.phetioElementAddedEmitter(),
   * because they are intended for internal usage only.  Archetypes should not be created in production code.
   */
  createArchetype() {
    // Once the sim has started, any archetypes being created are likely done so because they are nested PhetioGroups.
    if (_.hasIn(window, 'phet.joist.sim') && phet.joist.sim.isConstructionCompleteProperty.value) {
      assert && assert(false, 'nested DynacmicElementContainers are not currently supported');
      return null;
    }

    // When generating the baseline, output the schema for the archetype
    if (Tandem.PHET_IO_ENABLED && phet.preloads.phetio.createArchetypes) {
      const defaultArgs = Array.isArray(this.defaultArguments) ? this.defaultArguments : this.defaultArguments();

      // The create function takes a tandem plus the default args
      assert && assert(this.createElement.length === defaultArgs.length + 1, 'mismatched number of arguments');
      const archetype = this.createElement(this.tandem.createTandem(DYNAMIC_ARCHETYPE_NAME), ...defaultArgs);

      // Mark the archetype for inclusion in the baseline schema
      if (this.isPhetioInstrumented()) {
        archetype.markDynamicElementArchetype();
      }
      return archetype;
    } else {
      return null;
    }
  }

  /**
   * Create a dynamic PhetioObject element for this container
   * @param componentName
   * @param argsForCreateFunction
   * @param containerParameterType - null in PhET brand
   */
  createDynamicElement(componentName, argsForCreateFunction, containerParameterType) {
    assert && assert(Array.isArray(argsForCreateFunction), 'should be array');

    // create with default state and substructure, details will need to be set by setter methods.

    let createdObjectTandem;
    if (!this.tandem.hasChild(componentName)) {
      createdObjectTandem = new DynamicTandem(this.tandem, componentName, this.tandem.getExtendedOptions());
    } else {
      createdObjectTandem = this.tandem.createTandem(componentName, this.tandem.getExtendedOptions());
      assert && assert(createdObjectTandem instanceof DynamicTandem, 'createdObjectTandem should be an instance of DynamicTandem'); // eslint-disable-line no-simple-type-checking-assertions
    }
    const createdObject = this.createElement(createdObjectTandem, ...argsForCreateFunction);

    // This validation is only needed for PhET-iO brand
    if (Tandem.PHET_IO_ENABLED) {
      assert && assert(containerParameterType !== null, 'containerParameterType must be provided in PhET-iO brand');

      // Make sure the new group element matches the schema for elements.
      validate(createdObject, containerParameterType.validator);
      assert && assert(createdObject.phetioType.extends(containerParameterType), 'dynamic element container expected its created instance\'s phetioType to match its parameterType.');
    }
    assert && this.assertDynamicPhetioObject(createdObject);
    return createdObject;
  }

  /**
   * A dynamic element should be an instrumented PhetioObject with phetioDynamicElement: true
   */
  assertDynamicPhetioObject(phetioObject) {
    if (Tandem.PHET_IO_ENABLED && Tandem.VALIDATION) {
      assert && assert(phetioObject.isPhetioInstrumented(), 'instance should be instrumented');
      assert && assert(phetioObject.phetioDynamicElement, 'instance should be marked as phetioDynamicElement:true');
    }
  }

  /**
   * Emit a created or disposed event.
   */
  emitDataStreamEvent(dynamicElement, eventName, additionalData) {
    this.phetioStartEvent(eventName, {
      data: merge({
        phetioID: dynamicElement.tandem.phetioID
      }, additionalData)
    });
    this.phetioEndEvent();
  }

  /**
   * Emit events when dynamic elements are created.
   */
  createdEventListener(dynamicElement) {
    const additionalData = dynamicElement.phetioState ? {
      state: this.phetioType.parameterTypes[0].toStateObject(dynamicElement)
    } : null;
    this.emitDataStreamEvent(dynamicElement, 'created', additionalData);
  }

  /**
   * Emit events when dynamic elements are disposed.
   */
  disposedEventListener(dynamicElement) {
    this.emitDataStreamEvent(dynamicElement, 'disposed');
  }
  dispose() {
    // If hitting this assertion because of nested dynamic element containers, please discuss with a phet-io team member.
    assert && assert(false, 'PhetioDynamicElementContainers are not intended for disposal');
  }

  /**
   * Dispose a contained element
   */
  disposeElement(element) {
    element.dispose();
    assert && this.supportsDynamicState && _.hasIn(window, 'phet.joist.sim') && assert(
    // We do not want to be disposing dynamic elements when state setting EXCEPT when we are clearing all dynamic
    // elements (which is ok and expected to do at the beginning of setting state).
    !(isSettingPhetioStateProperty.value && !isClearingPhetioDynamicElementsProperty), 'should not dispose a dynamic element while setting phet-io state');
    if (this.notificationsDeferred) {
      this.deferredDisposals.push(element);
    } else {
      this.elementDisposedEmitter.emit(element, element.tandem.phetioID);
    }
  }

  /**
   * Called when clearing the contents of this container to ready things for setting its state. In general, this class
   * is set up to destroy and then recreate all of its elements instead of mutating them.
   */

  /**
   * Flush a single element from the list of deferred disposals that have not yet notified about the disposal. This
   * should never be called publicly, instead see `disposeElement`
   */
  notifyElementDisposedWhileDeferred(disposedElement) {
    assert && assert(this.notificationsDeferred, 'should only be called when notifications are deferred');
    assert && assert(this.deferredDisposals.includes(disposedElement), 'disposedElement should not have been already notified');
    this.elementDisposedEmitter.emit(disposedElement, disposedElement.tandem.phetioID);
    arrayRemove(this.deferredDisposals, disposedElement);
  }

  /**
   * Should be called by subtypes upon element creation, see PhetioGroup as an example.
   */
  notifyElementCreated(createdElement) {
    if (this.notificationsDeferred) {
      this.deferredCreations.push(createdElement);
    } else {
      this.elementCreatedEmitter.emit(createdElement, createdElement.tandem.phetioID);
    }
  }

  /**
   * Flush a single element from the list of deferred creations that have not yet notified about the disposal. This
   * is only public to support specific order dependencies in the PhetioStateEngine, otherwise see `this.notifyElementCreated()`
   * (PhetioGroupTests, phet-io) - only the PhetioStateEngine should notify individual elements created.
   */
  notifyElementCreatedWhileDeferred(createdElement) {
    assert && assert(this.notificationsDeferred, 'should only be called when notifications are deferred');
    assert && assert(this.deferredCreations.includes(createdElement), 'createdElement should not have been already notified');
    this.elementCreatedEmitter.emit(createdElement, createdElement.tandem.phetioID);
    arrayRemove(this.deferredCreations, createdElement);
  }

  /**
   * When set to true, creation and disposal notifications will be deferred until set to false. When set to false,
   * this function will flush all the notifications for created and disposed elements (in that order) that occurred
   * while this container was deferring its notifications.
   */
  setNotificationsDeferred(notificationsDeferred) {
    assert && assert(notificationsDeferred !== this.notificationsDeferred, 'should not be the same as current value');

    // Flush all notifications when setting to be no longer deferred
    if (!notificationsDeferred) {
      while (this.deferredCreations.length > 0) {
        this.notifyElementCreatedWhileDeferred(this.deferredCreations[0]);
      }
      while (this.deferredDisposals.length > 0) {
        this.notifyElementDisposedWhileDeferred(this.deferredDisposals[0]);
      }
    }
    assert && assert(this.deferredCreations.length === 0, 'creations should be clear');
    assert && assert(this.deferredDisposals.length === 0, 'disposals should be clear');
    this.notificationsDeferred = notificationsDeferred;
  }

  /**
   * @throws error if trying to access when archetypes aren't being created.
   */
  get archetype() {
    return archetypeCast(this._archetype);
  }

  /**
   * Add the phetioDynamicElementName for API tracking
   */
  getMetadata(object) {
    const metadata = super.getMetadata(object);
    assert && assert(!metadata.hasOwnProperty('phetioDynamicElementName'), 'PhetioDynamicElementContainer sets the phetioDynamicElementName metadata key');
    return merge({
      phetioDynamicElementName: this.phetioDynamicElementName
    }, metadata);
  }
}
tandemNamespace.register('PhetioDynamicElementContainer', PhetioDynamicElementContainer);
export default PhetioDynamicElementContainer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFbWl0dGVyIiwidmFsaWRhdGUiLCJhcnJheVJlbW92ZSIsIm1lcmdlIiwib3B0aW9uaXplIiwiRHluYW1pY1RhbmRlbSIsIlBoZXRpb09iamVjdCIsIlRhbmRlbSIsIkRZTkFNSUNfQVJDSEVUWVBFX05BTUUiLCJ0YW5kZW1OYW1lc3BhY2UiLCJTdHJpbmdJTyIsImlzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkiLCJpc0NsZWFyaW5nUGhldGlvRHluYW1pY0VsZW1lbnRzUHJvcGVydHkiLCJERUZBVUxUX0NPTlRBSU5FUl9TVUZGSVgiLCJhcmNoZXR5cGVDYXN0IiwiYXJjaGV0eXBlIiwiRXJyb3IiLCJQaGV0aW9EeW5hbWljRWxlbWVudENvbnRhaW5lciIsImNvbnN0cnVjdG9yIiwiY3JlYXRlRWxlbWVudCIsImRlZmF1bHRBcmd1bWVudHMiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwicGhldGlvU3RhdGUiLCJzdXBwb3J0c0R5bmFtaWNTdGF0ZSIsImNvbnRhaW5lclN1ZmZpeCIsInBoZXRpb0R5bmFtaWNFbGVtZW50TmFtZSIsInVuZGVmaW5lZCIsImFzc2VydCIsIkFycmF5IiwiaXNBcnJheSIsImxlbmd0aCIsIlZBTElEQVRJT04iLCJwaGV0aW9UeXBlIiwicGFyYW1ldGVyVHlwZXMiLCJ0YW5kZW0iLCJzdXBwbGllZCIsIm5hbWUiLCJlbmRzV2l0aCIsInNsaWNlIiwiX2FyY2hldHlwZSIsImNyZWF0ZUFyY2hldHlwZSIsImVsZW1lbnRDcmVhdGVkRW1pdHRlciIsInBhcmFtZXRlcnMiLCJ2YWx1ZVR5cGUiLCJjcmVhdGVUYW5kZW0iLCJwaGV0aW9Eb2N1bWVudGF0aW9uIiwiZWxlbWVudERpc3Bvc2VkRW1pdHRlciIsIlBIRVRfSU9fRU5BQkxFRCIsImFkZExpc3RlbmVyIiwiZWxlbWVudCIsImNyZWF0ZWRFdmVudExpc3RlbmVyIiwiZGlzcG9zZWRFdmVudExpc3RlbmVyIiwibm90aWZpY2F0aW9uc0RlZmVycmVkIiwiZGVmZXJyZWRDcmVhdGlvbnMiLCJkZWZlcnJlZERpc3Bvc2FscyIsInBoZXRpb0lzQXJjaGV0eXBlIiwiXyIsImhhc0luIiwid2luZG93IiwicGhldGlvU3RhdGVFbmdpbmUiLCJwaGV0IiwicGhldGlvIiwicGhldGlvRW5naW5lIiwiY2xlYXJEeW5hbWljRWxlbWVudHNFbWl0dGVyIiwic3RhdGUiLCJzY29wZVRhbmRlbSIsImhhc0FuY2VzdG9yIiwiY2xlYXIiLCJzZXROb3RpZmljYXRpb25zRGVmZXJyZWQiLCJ1bmRlZmVyRW1pdHRlciIsImFkZFNldFN0YXRlSGVscGVyIiwic3RpbGxUb1NldElEcyIsImNyZWF0aW9uTm90aWZpZWQiLCJpdGVyYXRpb25Db3VudCIsImpvaW4iLCJkZWZlcnJlZENyZWF0ZWRFbGVtZW50Iiwic3RhdGVTZXRPbkFsbENoaWxkcmVuT2ZEeW5hbWljRWxlbWVudCIsInBoZXRpb0lEIiwibm90aWZ5RWxlbWVudENyZWF0ZWRXaGlsZURlZmVycmVkIiwiZHluYW1pY0VsZW1lbnRJRCIsImkiLCJQaGV0aW9JRFV0aWxzIiwiaXNBbmNlc3RvciIsImpvaXN0Iiwic2ltIiwiaXNDb25zdHJ1Y3Rpb25Db21wbGV0ZVByb3BlcnR5IiwidmFsdWUiLCJwcmVsb2FkcyIsImNyZWF0ZUFyY2hldHlwZXMiLCJkZWZhdWx0QXJncyIsImlzUGhldGlvSW5zdHJ1bWVudGVkIiwibWFya0R5bmFtaWNFbGVtZW50QXJjaGV0eXBlIiwiY3JlYXRlRHluYW1pY0VsZW1lbnQiLCJjb21wb25lbnROYW1lIiwiYXJnc0ZvckNyZWF0ZUZ1bmN0aW9uIiwiY29udGFpbmVyUGFyYW1ldGVyVHlwZSIsImNyZWF0ZWRPYmplY3RUYW5kZW0iLCJoYXNDaGlsZCIsImdldEV4dGVuZGVkT3B0aW9ucyIsImNyZWF0ZWRPYmplY3QiLCJ2YWxpZGF0b3IiLCJleHRlbmRzIiwiYXNzZXJ0RHluYW1pY1BoZXRpb09iamVjdCIsInBoZXRpb09iamVjdCIsInBoZXRpb0R5bmFtaWNFbGVtZW50IiwiZW1pdERhdGFTdHJlYW1FdmVudCIsImR5bmFtaWNFbGVtZW50IiwiZXZlbnROYW1lIiwiYWRkaXRpb25hbERhdGEiLCJwaGV0aW9TdGFydEV2ZW50IiwiZGF0YSIsInBoZXRpb0VuZEV2ZW50IiwidG9TdGF0ZU9iamVjdCIsImRpc3Bvc2UiLCJkaXNwb3NlRWxlbWVudCIsInB1c2giLCJlbWl0Iiwibm90aWZ5RWxlbWVudERpc3Bvc2VkV2hpbGVEZWZlcnJlZCIsImRpc3Bvc2VkRWxlbWVudCIsImluY2x1ZGVzIiwibm90aWZ5RWxlbWVudENyZWF0ZWQiLCJjcmVhdGVkRWxlbWVudCIsImdldE1ldGFkYXRhIiwib2JqZWN0IiwibWV0YWRhdGEiLCJoYXNPd25Qcm9wZXJ0eSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiUGhldGlvRHluYW1pY0VsZW1lbnRDb250YWluZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogU3VwZXJ0eXBlIGZvciBjb250YWluZXJzIHRoYXQgaG9sZCBkeW5hbWljIGVsZW1lbnRzIHRoYXQgYXJlIFBoRVQtaU8gaW5zdHJ1bWVudGVkLiBUaGlzIHR5cGUgaGFuZGxlcyBjb21tb25cclxuICogZmVhdHVyZXMgbGlrZSBjcmVhdGluZyB0aGUgYXJjaGV0eXBlIGZvciB0aGUgUGhFVC1pTyBBUEksIGFuZCBtYW5hZ2luZyBjcmVhdGVkL2Rpc3Bvc2VkIGRhdGEgc3RyZWFtIGV2ZW50cy5cclxuICpcclxuICogXCJEeW5hbWljXCIgaXMgYW4gb3ZlcmxvYWRlZCB0ZXJtLCBzbyBhbGxvdyBtZSB0byBleHBsYWluIHdoYXQgaXQgbWVhbnMgaW4gdGhlIGNvbnRleHQgb2YgdGhpcyB0eXBlLiBBIFwiZHluYW1pYyBlbGVtZW50XCJcclxuICogaXMgYW4gaW5zdHJ1bWVudGVkIFBoRVQtaU8gRWxlbWVudCB0aGF0IGlzIGNvbmRpdGlvbmFsbHkgaW4gdGhlIFBoRVQtaU8gQVBJLiBNb3N0IGNvbW1vbmx5IHRoaXMgaXMgYmVjYXVzZSBlbGVtZW50c1xyXG4gKiBjYW4gYmUgY3JlYXRlZCBhbmQgZGVzdHJveWVkIGR1cmluZyB0aGUgcnVudGltZSBvZiB0aGUgc2ltLiBBbm90aGVyIFwiZHluYW1pYyBlbGVtZW50XCIgZm9yIHRoZSBQaEVULWlPIHByb2plY3QgaXMgd2hlblxyXG4gKiBhbiBlbGVtZW50IG1heSBvciBtYXkgbm90IGJlIGNyZWF0ZWQgYmFzZWQgb24gYSBxdWVyeSBwYXJhbWV0ZXIuIEluIHRoaXMgY2FzZSwgZXZlbiBpZiB0aGUgb2JqZWN0IHRoZW4gZXhpc3RzIGZvciB0aGVcclxuICogbGlmZXRpbWUgb2YgdGhlIHNpbSwgd2UgbWF5IHN0aWxsIGNhbGwgdGhpcyBcImR5bmFtaWNcIiBhcyBpdCBwZXJ0YWlucyB0byB0aGlzIHR5cGUsIGFuZCB0aGUgUGhFVC1pTyBBUEkuXHJcbiAqXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgRW1pdHRlciBmcm9tICcuLi8uLi9heG9uL2pzL0VtaXR0ZXIuanMnO1xyXG5pbXBvcnQgU3RyaWN0T21pdCBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvU3RyaWN0T21pdC5qcyc7XHJcbmltcG9ydCB2YWxpZGF0ZSBmcm9tICcuLi8uLi9heG9uL2pzL3ZhbGlkYXRlLmpzJztcclxuaW1wb3J0IGFycmF5UmVtb3ZlIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9hcnJheVJlbW92ZS5qcyc7XHJcbmltcG9ydCBtZXJnZSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvbWVyZ2UuanMnO1xyXG5pbXBvcnQgUGlja1JlcXVpcmVkIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9QaWNrUmVxdWlyZWQuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgRHluYW1pY1RhbmRlbSBmcm9tICcuL0R5bmFtaWNUYW5kZW0uanMnO1xyXG5pbXBvcnQgUGhldGlvT2JqZWN0LCB7IFBoZXRpb09iamVjdE1ldGFkYXRhSW5wdXQsIFBoZXRpb09iamVjdE9wdGlvbnMgfSBmcm9tICcuL1BoZXRpb09iamVjdC5qcyc7XHJcbmltcG9ydCBUYW5kZW0sIHsgRFlOQU1JQ19BUkNIRVRZUEVfTkFNRSB9IGZyb20gJy4vVGFuZGVtLmpzJztcclxuaW1wb3J0IHRhbmRlbU5hbWVzcGFjZSBmcm9tICcuL3RhbmRlbU5hbWVzcGFjZS5qcyc7XHJcbmltcG9ydCBJT1R5cGUgZnJvbSAnLi90eXBlcy9JT1R5cGUuanMnO1xyXG5pbXBvcnQgeyBQaGV0aW9FbGVtZW50TWV0YWRhdGEsIFBoZXRpb1N0YXRlIH0gZnJvbSAnLi9UYW5kZW1Db25zdGFudHMuanMnO1xyXG5pbXBvcnQgSW50ZW50aW9uYWxBbnkgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL0ludGVudGlvbmFsQW55LmpzJztcclxuaW1wb3J0IFRFbWl0dGVyIGZyb20gJy4uLy4uL2F4b24vanMvVEVtaXR0ZXIuanMnO1xyXG5pbXBvcnQgU3RyaW5nSU8gZnJvbSAnLi90eXBlcy9TdHJpbmdJTy5qcyc7XHJcbmltcG9ydCBpc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5IGZyb20gJy4vaXNTZXR0aW5nUGhldGlvU3RhdGVQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBpc0NsZWFyaW5nUGhldGlvRHluYW1pY0VsZW1lbnRzUHJvcGVydHkgZnJvbSAnLi9pc0NsZWFyaW5nUGhldGlvRHluYW1pY0VsZW1lbnRzUHJvcGVydHkuanMnO1xyXG5cclxuZXhwb3J0IHR5cGUgQ2xlYXJPcHRpb25zID0ge1xyXG4gIHBoZXRpb1N0YXRlPzogUGhldGlvU3RhdGUgfCBudWxsO1xyXG59O1xyXG5cclxuLy8gY29uc3RhbnRzXHJcbmNvbnN0IERFRkFVTFRfQ09OVEFJTkVSX1NVRkZJWCA9ICdDb250YWluZXInO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuXHJcbiAgLy8gQnkgZGVmYXVsdCwgYSBQaGV0aW9EeW5hbWljRWxlbWVudENvbnRhaW5lcidzIGVsZW1lbnRzIGFyZSBpbmNsdWRlZCBpbiBzdGF0ZSBzdWNoIHRoYXQgb24gZXZlcnkgc2V0U3RhdGUgY2FsbCxcclxuICAvLyB0aGUgZWxlbWVudHMgYXJlIGNsZWFyZWQgb3V0IGJ5IHRoZSBwaGV0aW9TdGF0ZUVuZ2luZSBzbyBlbGVtZW50cyBpbiB0aGUgc3RhdGUgY2FuIGJlIGFkZGVkIHRvIHRoZSBlbXB0eSBncm91cC5cclxuICAvLyBUaGlzIG9wdGlvbiBpcyBmb3Igb3B0aW5nIG91dCBvZiB0aGF0IGJlaGF2aW9yLiBXaGVuIGZhbHNlLCB0aGlzIGNvbnRhaW5lciB3aWxsIG5vdCBoYXZlIGl0cyBlbGVtZW50cyBjbGVhcmVkXHJcbiAgLy8gd2hlbiBiZWdpbm5pbmcgdG8gc2V0IFBoRVQtaU8gc3RhdGUuIEZ1cnRoZXJtb3JlLCB2aWV3IGVsZW1lbnRzIGZvbGxvd2luZyB0aGUgXCJvbmx5IHRoZSBtb2RlbHMgYXJlIHN0YXRlZnVsXCJcclxuICAvLyBwYXR0ZXJuIG11c3QgbWFyayB0aGlzIGFzIGZhbHNlLCBvdGhlcndpc2UgdGhlIHN0YXRlIGVuZ2luZSB3aWxsIHRyeSB0byBjcmVhdGUgdGhlc2UgZWxlbWVudHMgaW5zdGVhZCBvZiBsZXR0aW5nXHJcbiAgLy8gdGhlIG1vZGVsIG5vdGlmaWNhdGlvbnMgaGFuZGxlIHRoaXMuXHJcbiAgc3VwcG9ydHNEeW5hbWljU3RhdGU/OiBib29sZWFuO1xyXG5cclxuICAvLyBUaGUgY29udGFpbmVyJ3MgdGFuZGVtIG5hbWUgbXVzdCBoYXZlIHRoaXMgc3VmZml4LCBhbmQgdGhlIGJhc2UgdGFuZGVtIG5hbWUgZm9yIGVsZW1lbnRzIGluXHJcbiAgLy8gdGhlIGNvbnRhaW5lciB3aWxsIGNvbnNpc3Qgb2YgdGhlIGdyb3VwJ3MgdGFuZGVtIG5hbWUgd2l0aCB0aGlzIHN1ZmZpeCBzdHJpcHBlZCBvZmYuXHJcbiAgY29udGFpbmVyU3VmZml4Pzogc3RyaW5nO1xyXG5cclxuICAvLyB0YW5kZW0gbmFtZSBmb3IgZWxlbWVudHMgaW4gdGhlIGNvbnRhaW5lciBpcyB0aGUgY29udGFpbmVyJ3MgdGFuZGVtIG5hbWUgd2l0aG91dCBjb250YWluZXJTdWZmaXhcclxuICBwaGV0aW9EeW5hbWljRWxlbWVudE5hbWU/OiBzdHJpbmc7XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBQaGV0aW9EeW5hbWljRWxlbWVudENvbnRhaW5lck9wdGlvbnMgPVxyXG4gIFNlbGZPcHRpb25zXHJcbiAgJiBTdHJpY3RPbWl0PFBoZXRpb09iamVjdE9wdGlvbnMsICdwaGV0aW9EeW5hbWljRWxlbWVudCc+XHJcbiAgJiBQaWNrUmVxdWlyZWQ8UGhldGlvT2JqZWN0T3B0aW9ucywgJ3BoZXRpb1R5cGUnPjtcclxuXHJcbmZ1bmN0aW9uIGFyY2hldHlwZUNhc3Q8VD4oIGFyY2hldHlwZTogVCB8IG51bGwgKTogVCB7XHJcbiAgaWYgKCBhcmNoZXR5cGUgPT09IG51bGwgKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoICdhcmNoZXR5cGUgc2hvdWxkIGV4aXN0JyApO1xyXG4gIH1cclxuICByZXR1cm4gYXJjaGV0eXBlO1xyXG59XHJcblxyXG5hYnN0cmFjdCBjbGFzcyBQaGV0aW9EeW5hbWljRWxlbWVudENvbnRhaW5lcjxUIGV4dGVuZHMgUGhldGlvT2JqZWN0LCBQIGV4dGVuZHMgSW50ZW50aW9uYWxBbnlbXSA9IFtdPiBleHRlbmRzIFBoZXRpb09iamVjdCB7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBfYXJjaGV0eXBlOiBUIHwgbnVsbDtcclxuICBwdWJsaWMgcmVhZG9ubHkgZWxlbWVudENyZWF0ZWRFbWl0dGVyOiBURW1pdHRlcjxbIFQsIHN0cmluZyBdPjtcclxuICBwdWJsaWMgcmVhZG9ubHkgZWxlbWVudERpc3Bvc2VkRW1pdHRlcjogVEVtaXR0ZXI8WyBULCBzdHJpbmcgXT47XHJcbiAgcHJpdmF0ZSBub3RpZmljYXRpb25zRGVmZXJyZWQ6IGJvb2xlYW47XHJcbiAgcHJpdmF0ZSByZWFkb25seSBkZWZlcnJlZENyZWF0aW9uczogVFtdO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgZGVmZXJyZWREaXNwb3NhbHM6IFRbXTtcclxuICBwdWJsaWMgcmVhZG9ubHkgc3VwcG9ydHNEeW5hbWljU3RhdGU6IGJvb2xlYW47IC8vIChwaGV0LWlvIGludGVybmFsKVxyXG4gIHByb3RlY3RlZCBwaGV0aW9EeW5hbWljRWxlbWVudE5hbWU6IHN0cmluZztcclxuICBwcm90ZWN0ZWQgY3JlYXRlRWxlbWVudDogKCB0OiBUYW5kZW0sIC4uLmFyZ3M6IFAgKSA9PiBUO1xyXG5cclxuICAvLyBBcmd1bWVudHMgcGFzc2VkIHRvIHRoZSBhcmNoZXR5cGUgd2hlbiBjcmVhdGluZyBpdC5cclxuICBwcm90ZWN0ZWQgZGVmYXVsdEFyZ3VtZW50czogUCB8ICggKCkgPT4gUCApO1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gY3JlYXRlRWxlbWVudCAtIGZ1bmN0aW9uIHRoYXQgY3JlYXRlcyBhIGR5bmFtaWMgcmVhZG9ubHkgZWxlbWVudCB0byBiZSBob3VzZWQgaW5cclxuICAgKiB0aGlzIGNvbnRhaW5lci4gQWxsIG9mIHRoaXMgZHluYW1pYyBlbGVtZW50IGNvbnRhaW5lcidzIGVsZW1lbnRzIHdpbGwgYmUgY3JlYXRlZCBmcm9tIHRoaXMgZnVuY3Rpb24sIGluY2x1ZGluZyB0aGVcclxuICAgKiBhcmNoZXR5cGUuXHJcbiAgICogQHBhcmFtIGRlZmF1bHRBcmd1bWVudHMgLSBhcmd1bWVudHMgcGFzc2VkIHRvIGNyZWF0ZUVsZW1lbnQgd2hlbiBjcmVhdGluZyB0aGUgYXJjaGV0eXBlXHJcbiAgICogQHBhcmFtIFtwcm92aWRlZE9wdGlvbnNdIC0gZGVzY3JpYmUgdGhlIEdyb3VwIGl0c2VsZlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggY3JlYXRlRWxlbWVudDogKCB0OiBUYW5kZW0sIC4uLmFyZ3M6IFAgKSA9PiBULCBkZWZhdWx0QXJndW1lbnRzOiBQIHwgKCAoKSA9PiBQICksIHByb3ZpZGVkT3B0aW9ucz86IFBoZXRpb0R5bmFtaWNFbGVtZW50Q29udGFpbmVyT3B0aW9ucyApIHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPFBoZXRpb0R5bmFtaWNFbGVtZW50Q29udGFpbmVyT3B0aW9ucywgU2VsZk9wdGlvbnMsIFBoZXRpb09iamVjdE9wdGlvbnM+KCkoIHtcclxuICAgICAgcGhldGlvU3RhdGU6IGZhbHNlLCAvLyBlbGVtZW50cyBhcmUgaW5jbHVkZWQgaW4gc3RhdGUsIGJ1dCB0aGUgY29udGFpbmVyIHdpbGwgZXhpc3QgaW4gdGhlIGRvd25zdHJlYW0gc2ltLlxyXG5cclxuICAgICAgLy8gTWFueSBQaEVULWlPIGluc3RydW1lbnRlZCB0eXBlcyBsaXZlIGluIGNvbW1vbiBjb2RlIHVzZWQgYnkgbXVsdGlwbGUgc2ltcywgYW5kIG1heSBvbmx5IGJlIGluc3RydW1lbnRlZCBpbiBhIHN1YnNldCBvZiB0aGVpciB1c2FnZXMuXHJcbiAgICAgIHN1cHBvcnRzRHluYW1pY1N0YXRlOiB0cnVlLFxyXG4gICAgICBjb250YWluZXJTdWZmaXg6IERFRkFVTFRfQ09OVEFJTkVSX1NVRkZJWCxcclxuXHJcbiAgICAgIC8vIFRPRE86IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy90YW5kZW0vaXNzdWVzLzI1NFxyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gdGhpcyBpcyBmaWxsZWQgaW4gYmVsb3dcclxuICAgICAgcGhldGlvRHluYW1pY0VsZW1lbnROYW1lOiB1bmRlZmluZWRcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIEFycmF5LmlzQXJyYXkoIGRlZmF1bHRBcmd1bWVudHMgKSB8fCB0eXBlb2YgZGVmYXVsdEFyZ3VtZW50cyA9PT0gJ2Z1bmN0aW9uJywgJ2RlZmF1bHRBcmd1bWVudHMgc2hvdWxkIGJlIGFuIGFycmF5IG9yIGEgZnVuY3Rpb24nICk7XHJcbiAgICBpZiAoIEFycmF5LmlzQXJyYXkoIGRlZmF1bHRBcmd1bWVudHMgKSApIHtcclxuXHJcbiAgICAgIC8vIGNyZWF0ZUVsZW1lbnQgZXhwZWN0cyBhIFRhbmRlbSBhcyB0aGUgZmlyc3QgYXJnXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGNyZWF0ZUVsZW1lbnQubGVuZ3RoID09PSBkZWZhdWx0QXJndW1lbnRzLmxlbmd0aCArIDEsICdtaXNtYXRjaGVkIG51bWJlciBvZiBhcmd1bWVudHMnICk7XHJcbiAgICB9XHJcblxyXG4gICAgYXNzZXJ0ICYmIFRhbmRlbS5WQUxJREFUSU9OICYmIGFzc2VydCggISFvcHRpb25zLnBoZXRpb1R5cGUsICdwaGV0aW9UeXBlIG11c3QgYmUgc3VwcGxpZWQnICk7XHJcbiAgICBhc3NlcnQgJiYgVGFuZGVtLlZBTElEQVRJT04gJiYgYXNzZXJ0KCBBcnJheS5pc0FycmF5KCBvcHRpb25zLnBoZXRpb1R5cGUucGFyYW1ldGVyVHlwZXMgKSxcclxuICAgICAgJ3BoZXRpb1R5cGUgbXVzdCBzdXBwbHkgaXRzIHBhcmFtZXRlciB0eXBlcycgKTtcclxuICAgIGFzc2VydCAmJiBUYW5kZW0uVkFMSURBVElPTiAmJiBhc3NlcnQoIG9wdGlvbnMucGhldGlvVHlwZS5wYXJhbWV0ZXJUeXBlcyEubGVuZ3RoID09PSAxLFxyXG4gICAgICAnUGhldGlvRHluYW1pY0VsZW1lbnRDb250YWluZXJcXCdzIHBoZXRpb1R5cGUgbXVzdCBoYXZlIGV4YWN0bHkgb25lIHBhcmFtZXRlciB0eXBlJyApO1xyXG4gICAgYXNzZXJ0ICYmIFRhbmRlbS5WQUxJREFUSU9OICYmIGFzc2VydCggISFvcHRpb25zLnBoZXRpb1R5cGUucGFyYW1ldGVyVHlwZXMhWyAwIF0sXHJcbiAgICAgICdQaGV0aW9EeW5hbWljRWxlbWVudENvbnRhaW5lclxcJ3MgcGhldGlvVHlwZVxcJ3MgcGFyYW1ldGVyVHlwZSBtdXN0IGJlIHRydXRoeScgKTtcclxuICAgIGlmICggYXNzZXJ0ICYmIG9wdGlvbnMudGFuZGVtPy5zdXBwbGllZCApIHtcclxuICAgICAgYXNzZXJ0ICYmIFRhbmRlbS5WQUxJREFUSU9OICYmIGFzc2VydCggb3B0aW9ucy50YW5kZW0ubmFtZS5lbmRzV2l0aCggb3B0aW9ucy5jb250YWluZXJTdWZmaXggKSxcclxuICAgICAgICAnUGhldGlvRHluYW1pY0VsZW1lbnRDb250YWluZXIgdGFuZGVtcyBzaG91bGQgZW5kIHdpdGggb3B0aW9ucy5jb250YWluZXJTdWZmaXgnICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gb3B0aW9ucyB0aGF0IGRlcGVuZCBvbiBvdGhlciBvcHRpb25zIGZvciB0aGVpciBkZWZhdWx0XHJcbiAgICBpZiAoIG9wdGlvbnMudGFuZGVtICYmICFvcHRpb25zLnBoZXRpb0R5bmFtaWNFbGVtZW50TmFtZSApIHtcclxuICAgICAgb3B0aW9ucy5waGV0aW9EeW5hbWljRWxlbWVudE5hbWUgPSBvcHRpb25zLnRhbmRlbS5uYW1lLnNsaWNlKCAwLCBvcHRpb25zLnRhbmRlbS5uYW1lLmxlbmd0aCAtIG9wdGlvbnMuY29udGFpbmVyU3VmZml4Lmxlbmd0aCApO1xyXG4gICAgfVxyXG5cclxuICAgIHN1cGVyKCBvcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy5zdXBwb3J0c0R5bmFtaWNTdGF0ZSA9IG9wdGlvbnMuc3VwcG9ydHNEeW5hbWljU3RhdGU7XHJcbiAgICB0aGlzLnBoZXRpb0R5bmFtaWNFbGVtZW50TmFtZSA9IG9wdGlvbnMucGhldGlvRHluYW1pY0VsZW1lbnROYW1lO1xyXG5cclxuICAgIHRoaXMuY3JlYXRlRWxlbWVudCA9IGNyZWF0ZUVsZW1lbnQ7XHJcbiAgICB0aGlzLmRlZmF1bHRBcmd1bWVudHMgPSBkZWZhdWx0QXJndW1lbnRzO1xyXG5cclxuICAgIC8vIENhbiBiZSB1c2VkIGFzIGFuIGFyZ3VtZW50IHRvIGNyZWF0ZSBvdGhlciBhcmNoZXR5cGVzLCBidXQgb3RoZXJ3aXNlXHJcbiAgICAvLyBhY2Nlc3Mgc2hvdWxkIG5vdCBiZSBuZWVkZWQuIFRoaXMgd2lsbCBvbmx5IGJlIG5vbi1udWxsIHdoZW4gZ2VuZXJhdGluZyB0aGUgUGhFVC1pTyBBUEksIHNlZSBjcmVhdGVBcmNoZXR5cGUoKS5cclxuICAgIHRoaXMuX2FyY2hldHlwZSA9IHRoaXMuY3JlYXRlQXJjaGV0eXBlKCk7XHJcblxyXG4gICAgLy8gc3VidHlwZXMgZXhwZWN0ZWQgdG8gZmlyZSB0aGlzIGFjY29yZGluZyB0byBpbmRpdmlkdWFsIGltcGxlbWVudGF0aW9uc1xyXG4gICAgdGhpcy5lbGVtZW50Q3JlYXRlZEVtaXR0ZXIgPSBuZXcgRW1pdHRlcjxbIFQsIHN0cmluZyBdPigge1xyXG4gICAgICBwYXJhbWV0ZXJzOiBbXHJcbiAgICAgICAgeyB2YWx1ZVR5cGU6IFBoZXRpb09iamVjdCwgcGhldGlvVHlwZTogb3B0aW9ucy5waGV0aW9UeXBlLnBhcmFtZXRlclR5cGVzIVsgMCBdLCBuYW1lOiAnZWxlbWVudCcgfSxcclxuICAgICAgICB7IG5hbWU6ICdwaGV0aW9JRCcsIHBoZXRpb1R5cGU6IFN0cmluZ0lPIH1cclxuICAgICAgXSxcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdlbGVtZW50Q3JlYXRlZEVtaXR0ZXInICksXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdFbWl0dGVyIHRoYXQgZmlyZXMgd2hlbmV2ZXIgYSBuZXcgZHluYW1pYyBlbGVtZW50IGlzIGFkZGVkIHRvIHRoZSBjb250YWluZXIuJ1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIGNhbGxlZCBvbiBkaXNwb3NhbCBvZiBhbiBlbGVtZW50XHJcbiAgICB0aGlzLmVsZW1lbnREaXNwb3NlZEVtaXR0ZXIgPSBuZXcgRW1pdHRlcjxbIFQsIHN0cmluZyBdPigge1xyXG4gICAgICBwYXJhbWV0ZXJzOiBbXHJcbiAgICAgICAgeyB2YWx1ZVR5cGU6IFBoZXRpb09iamVjdCwgcGhldGlvVHlwZTogb3B0aW9ucy5waGV0aW9UeXBlLnBhcmFtZXRlclR5cGVzIVsgMCBdLCBuYW1lOiAnZWxlbWVudCcgfSxcclxuICAgICAgICB7IG5hbWU6ICdwaGV0aW9JRCcsIHBoZXRpb1R5cGU6IFN0cmluZ0lPIH1cclxuICAgICAgXSxcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdlbGVtZW50RGlzcG9zZWRFbWl0dGVyJyApLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnRW1pdHRlciB0aGF0IGZpcmVzIHdoZW5ldmVyIGEgZHluYW1pYyBlbGVtZW50IGlzIHJlbW92ZWQgZnJvbSB0aGUgY29udGFpbmVyLidcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBFbWl0IHRvIHRoZSBkYXRhIHN0cmVhbSBvbiBlbGVtZW50IGNyZWF0aW9uL2Rpc3Bvc2FsLCBubyBuZWVkIHRvIGRvIHRoaXMgaW4gUGhFVCBicmFuZFxyXG4gICAgaWYgKCBUYW5kZW0uUEhFVF9JT19FTkFCTEVEICkge1xyXG4gICAgICB0aGlzLmVsZW1lbnRDcmVhdGVkRW1pdHRlci5hZGRMaXN0ZW5lciggZWxlbWVudCA9PiB0aGlzLmNyZWF0ZWRFdmVudExpc3RlbmVyKCBlbGVtZW50ICkgKTtcclxuICAgICAgdGhpcy5lbGVtZW50RGlzcG9zZWRFbWl0dGVyLmFkZExpc3RlbmVyKCBlbGVtZW50ID0+IHRoaXMuZGlzcG9zZWRFdmVudExpc3RlbmVyKCBlbGVtZW50ICkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBhIHdheSB0byBkZWxheSBjcmVhdGlvbiBub3RpZmljYXRpb25zIHRvIGEgbGF0ZXIgdGltZSwgZm9yIHBoZXQtaW8gc3RhdGUgZW5naW5lIHN1cHBvcnRcclxuICAgIHRoaXMubm90aWZpY2F0aW9uc0RlZmVycmVkID0gZmFsc2U7XHJcblxyXG4gICAgLy8gbGlzdHMgdG8ga2VlcCB0cmFjayBvZiB0aGUgY3JlYXRlZCBhbmQgZGlzcG9zZWQgZWxlbWVudHMgd2hlbiBub3RpZmljYXRpb25zIGFyZSBkZWZlcnJlZC5cclxuICAgIC8vIFRoZXNlIGFyZSB1c2VkIHRvIHRoZW4gZmx1c2ggbm90aWZpY2F0aW9ucyB3aGVuIHRoZXkgYXJlIHNldCB0byBubyBsb25nZXIgYmUgZGVmZXJyZWQuXHJcbiAgICB0aGlzLmRlZmVycmVkQ3JlYXRpb25zID0gW107XHJcbiAgICB0aGlzLmRlZmVycmVkRGlzcG9zYWxzID0gW107XHJcblxyXG4gICAgLy8gcHJvdmlkZSBhIHdheSB0byBvcHQgb3V0IG9mIGNvbnRhaW5lcnMgY2xlYXJpbmcgZHluYW1pYyBzdGF0ZSwgdXNlZnVsIGlmIGdyb3VwIGVsZW1lbnRzIGV4aXN0IGZvciB0aGUgbGlmZXRpbWUgb2ZcclxuICAgIC8vIHRoZSBzaW0sIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvdGFuZGVtL2lzc3Vlcy8xMzJcclxuICAgIGlmICggVGFuZGVtLlBIRVRfSU9fRU5BQkxFRCAmJiB0aGlzLnN1cHBvcnRzRHluYW1pY1N0YXRlICYmXHJcblxyXG4gICAgICAgICAvLyBkb24ndCBjbGVhciBhcmNoZXR5cGVzIGJlY2F1c2UgdGhleSBhcmUgc3RhdGljLlxyXG4gICAgICAgICAhdGhpcy5waGV0aW9Jc0FyY2hldHlwZSApIHtcclxuXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIF8uaGFzSW4oIHdpbmRvdywgJ3BoZXQucGhldGlvLnBoZXRpb0VuZ2luZS5waGV0aW9TdGF0ZUVuZ2luZScgKSxcclxuICAgICAgICAnUGhldGlvRHluYW1pY0VsZW1lbnRDb250YWluZXJzIG11c3QgYmUgY3JlYXRlZCBvbmNlIHBoZXRpb0VuZ2luZSBoYXMgYmVlbiBjb25zdHJ1Y3RlZCcgKTtcclxuXHJcbiAgICAgIGNvbnN0IHBoZXRpb1N0YXRlRW5naW5lID0gcGhldC5waGV0aW8ucGhldGlvRW5naW5lLnBoZXRpb1N0YXRlRW5naW5lO1xyXG5cclxuICAgICAgLy8gT24gc3RhdGUgc3RhcnQsIGNsZWFyIG91dCB0aGUgY29udGFpbmVyIGFuZCBzZXQgdG8gZGVmZXIgbm90aWZpY2F0aW9ucy5cclxuICAgICAgcGhldGlvU3RhdGVFbmdpbmUuY2xlYXJEeW5hbWljRWxlbWVudHNFbWl0dGVyLmFkZExpc3RlbmVyKCAoIHN0YXRlOiBQaGV0aW9TdGF0ZSwgc2NvcGVUYW5kZW06IFRhbmRlbSApID0+IHtcclxuXHJcbiAgICAgICAgLy8gT25seSBjbGVhciBpZiB0aGlzIFBoZXRpb0R5bmFtaWNFbGVtZW50Q29udGFpbmVyIGlzIGluIHNjb3BlIG9mIHRoZSBzdGF0ZSB0byBiZSBzZXRcclxuICAgICAgICBpZiAoIHRoaXMudGFuZGVtLmhhc0FuY2VzdG9yKCBzY29wZVRhbmRlbSApICkge1xyXG4gICAgICAgICAgdGhpcy5jbGVhcigge1xyXG4gICAgICAgICAgICBwaGV0aW9TdGF0ZTogc3RhdGVcclxuICAgICAgICAgIH0gKTtcclxuICAgICAgICAgIHRoaXMuc2V0Tm90aWZpY2F0aW9uc0RlZmVycmVkKCB0cnVlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICAvLyBkb25lIHdpdGggc3RhdGUgc2V0dGluZ1xyXG4gICAgICBwaGV0aW9TdGF0ZUVuZ2luZS51bmRlZmVyRW1pdHRlci5hZGRMaXN0ZW5lciggKCkgPT4ge1xyXG4gICAgICAgIGlmICggdGhpcy5ub3RpZmljYXRpb25zRGVmZXJyZWQgKSB7XHJcbiAgICAgICAgICB0aGlzLnNldE5vdGlmaWNhdGlvbnNEZWZlcnJlZCggZmFsc2UgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIHBoZXRpb1N0YXRlRW5naW5lLmFkZFNldFN0YXRlSGVscGVyKCAoIHN0YXRlOiBQaGV0aW9TdGF0ZSwgc3RpbGxUb1NldElEczogc3RyaW5nW10gKSA9PiB7XHJcbiAgICAgICAgbGV0IGNyZWF0aW9uTm90aWZpZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgbGV0IGl0ZXJhdGlvbkNvdW50ID0gMDtcclxuXHJcbiAgICAgICAgd2hpbGUgKCB0aGlzLmRlZmVycmVkQ3JlYXRpb25zLmxlbmd0aCA+IDAgKSB7XHJcblxyXG4gICAgICAgICAgaWYgKCBpdGVyYXRpb25Db3VudCA+IDIwMCApIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnVG9vIG1hbnkgaXRlcmF0aW9ucyBpbiBkZWZlcnJlZCBjcmVhdGlvbnMsIHN0aWxsVG9TZXRJRHMgPSAnICsgc3RpbGxUb1NldElEcy5qb2luKCAnLCAnICkgKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBjb25zdCBkZWZlcnJlZENyZWF0ZWRFbGVtZW50ID0gdGhpcy5kZWZlcnJlZENyZWF0aW9uc1sgMCBdO1xyXG4gICAgICAgICAgaWYgKCB0aGlzLnN0YXRlU2V0T25BbGxDaGlsZHJlbk9mRHluYW1pY0VsZW1lbnQoIGRlZmVycmVkQ3JlYXRlZEVsZW1lbnQudGFuZGVtLnBoZXRpb0lELCBzdGlsbFRvU2V0SURzICkgKSB7XHJcbiAgICAgICAgICAgIHRoaXMubm90aWZ5RWxlbWVudENyZWF0ZWRXaGlsZURlZmVycmVkKCBkZWZlcnJlZENyZWF0ZWRFbGVtZW50ICk7XHJcbiAgICAgICAgICAgIGNyZWF0aW9uTm90aWZpZWQgPSB0cnVlO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGl0ZXJhdGlvbkNvdW50Kys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBjcmVhdGlvbk5vdGlmaWVkO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcmV0dXJucyB0cnVlIGlmIGFsbCBjaGlsZHJlbiBvZiBhIHNpbmdsZSBkeW5hbWljIGVsZW1lbnQgKGJhc2VkIG9uIHBoZXRpb0lEKSBoYXZlIGhhZCB0aGVpciBzdGF0ZSBzZXQgYWxyZWFkeS5cclxuICAgKi9cclxuICBwcml2YXRlIHN0YXRlU2V0T25BbGxDaGlsZHJlbk9mRHluYW1pY0VsZW1lbnQoIGR5bmFtaWNFbGVtZW50SUQ6IHN0cmluZywgc3RpbGxUb1NldElEczogc3RyaW5nW10gKTogYm9vbGVhbiB7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzdGlsbFRvU2V0SURzLmxlbmd0aDsgaSsrICkge1xyXG5cclxuICAgICAgaWYgKCBwaGV0aW8uUGhldGlvSURVdGlscy5pc0FuY2VzdG9yKCBkeW5hbWljRWxlbWVudElELCBzdGlsbFRvU2V0SURzWyBpIF0gKSApIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlOyAvLyBObyBlbGVtZW50cyBpbiBzdGF0ZSB0aGF0IGFyZW4ndCBpbiB0aGUgY29tcGxldGVkIGxpc3RcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFyY2hldHlwZXMgYXJlIGNyZWF0ZWQgdG8gZ2VuZXJhdGUgdGhlIGJhc2VsaW5lIGZpbGUsIG9yIHRvIHZhbGlkYXRlIGFnYWluc3QgYW4gZXhpc3RpbmcgYmFzZWxpbmUgZmlsZS4gIFRoZXkgYXJlXHJcbiAgICogUGhldGlvT2JqZWN0cyBhbmQgcmVnaXN0ZXJlZCB3aXRoIHRoZSBwaGV0aW9FbmdpbmUsIGJ1dCBub3Qgc2VuZCBvdXQgdmlhIG5vdGlmaWNhdGlvbnMgZnJvbSBQaGV0aW9FbmdpbmUucGhldGlvRWxlbWVudEFkZGVkRW1pdHRlcigpLFxyXG4gICAqIGJlY2F1c2UgdGhleSBhcmUgaW50ZW5kZWQgZm9yIGludGVybmFsIHVzYWdlIG9ubHkuICBBcmNoZXR5cGVzIHNob3VsZCBub3QgYmUgY3JlYXRlZCBpbiBwcm9kdWN0aW9uIGNvZGUuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBjcmVhdGVBcmNoZXR5cGUoKTogVCB8IG51bGwge1xyXG5cclxuICAgIC8vIE9uY2UgdGhlIHNpbSBoYXMgc3RhcnRlZCwgYW55IGFyY2hldHlwZXMgYmVpbmcgY3JlYXRlZCBhcmUgbGlrZWx5IGRvbmUgc28gYmVjYXVzZSB0aGV5IGFyZSBuZXN0ZWQgUGhldGlvR3JvdXBzLlxyXG4gICAgaWYgKCBfLmhhc0luKCB3aW5kb3csICdwaGV0LmpvaXN0LnNpbScgKSAmJiBwaGV0LmpvaXN0LnNpbS5pc0NvbnN0cnVjdGlvbkNvbXBsZXRlUHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGZhbHNlLCAnbmVzdGVkIER5bmFjbWljRWxlbWVudENvbnRhaW5lcnMgYXJlIG5vdCBjdXJyZW50bHkgc3VwcG9ydGVkJyApO1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBXaGVuIGdlbmVyYXRpbmcgdGhlIGJhc2VsaW5lLCBvdXRwdXQgdGhlIHNjaGVtYSBmb3IgdGhlIGFyY2hldHlwZVxyXG4gICAgaWYgKCBUYW5kZW0uUEhFVF9JT19FTkFCTEVEICYmIHBoZXQucHJlbG9hZHMucGhldGlvLmNyZWF0ZUFyY2hldHlwZXMgKSB7XHJcbiAgICAgIGNvbnN0IGRlZmF1bHRBcmdzID0gQXJyYXkuaXNBcnJheSggdGhpcy5kZWZhdWx0QXJndW1lbnRzICkgPyB0aGlzLmRlZmF1bHRBcmd1bWVudHMgOiB0aGlzLmRlZmF1bHRBcmd1bWVudHMoKTtcclxuXHJcbiAgICAgIC8vIFRoZSBjcmVhdGUgZnVuY3Rpb24gdGFrZXMgYSB0YW5kZW0gcGx1cyB0aGUgZGVmYXVsdCBhcmdzXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuY3JlYXRlRWxlbWVudC5sZW5ndGggPT09IGRlZmF1bHRBcmdzLmxlbmd0aCArIDEsICdtaXNtYXRjaGVkIG51bWJlciBvZiBhcmd1bWVudHMnICk7XHJcblxyXG4gICAgICBjb25zdCBhcmNoZXR5cGUgPSB0aGlzLmNyZWF0ZUVsZW1lbnQoIHRoaXMudGFuZGVtLmNyZWF0ZVRhbmRlbSggRFlOQU1JQ19BUkNIRVRZUEVfTkFNRSApLCAuLi5kZWZhdWx0QXJncyApO1xyXG5cclxuICAgICAgLy8gTWFyayB0aGUgYXJjaGV0eXBlIGZvciBpbmNsdXNpb24gaW4gdGhlIGJhc2VsaW5lIHNjaGVtYVxyXG4gICAgICBpZiAoIHRoaXMuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSApIHtcclxuICAgICAgICBhcmNoZXR5cGUubWFya0R5bmFtaWNFbGVtZW50QXJjaGV0eXBlKCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGFyY2hldHlwZTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZSBhIGR5bmFtaWMgUGhldGlvT2JqZWN0IGVsZW1lbnQgZm9yIHRoaXMgY29udGFpbmVyXHJcbiAgICogQHBhcmFtIGNvbXBvbmVudE5hbWVcclxuICAgKiBAcGFyYW0gYXJnc0ZvckNyZWF0ZUZ1bmN0aW9uXHJcbiAgICogQHBhcmFtIGNvbnRhaW5lclBhcmFtZXRlclR5cGUgLSBudWxsIGluIFBoRVQgYnJhbmRcclxuICAgKi9cclxuICBwdWJsaWMgY3JlYXRlRHluYW1pY0VsZW1lbnQoIGNvbXBvbmVudE5hbWU6IHN0cmluZywgYXJnc0ZvckNyZWF0ZUZ1bmN0aW9uOiBQLCBjb250YWluZXJQYXJhbWV0ZXJUeXBlOiBJT1R5cGUgfCBudWxsICk6IFQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggQXJyYXkuaXNBcnJheSggYXJnc0ZvckNyZWF0ZUZ1bmN0aW9uICksICdzaG91bGQgYmUgYXJyYXknICk7XHJcblxyXG4gICAgLy8gY3JlYXRlIHdpdGggZGVmYXVsdCBzdGF0ZSBhbmQgc3Vic3RydWN0dXJlLCBkZXRhaWxzIHdpbGwgbmVlZCB0byBiZSBzZXQgYnkgc2V0dGVyIG1ldGhvZHMuXHJcblxyXG4gICAgbGV0IGNyZWF0ZWRPYmplY3RUYW5kZW07XHJcbiAgICBpZiAoICF0aGlzLnRhbmRlbS5oYXNDaGlsZCggY29tcG9uZW50TmFtZSApICkge1xyXG4gICAgICBjcmVhdGVkT2JqZWN0VGFuZGVtID0gbmV3IER5bmFtaWNUYW5kZW0oIHRoaXMudGFuZGVtLCBjb21wb25lbnROYW1lLCB0aGlzLnRhbmRlbS5nZXRFeHRlbmRlZE9wdGlvbnMoKSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGNyZWF0ZWRPYmplY3RUYW5kZW0gPSB0aGlzLnRhbmRlbS5jcmVhdGVUYW5kZW0oIGNvbXBvbmVudE5hbWUsIHRoaXMudGFuZGVtLmdldEV4dGVuZGVkT3B0aW9ucygpICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGNyZWF0ZWRPYmplY3RUYW5kZW0gaW5zdGFuY2VvZiBEeW5hbWljVGFuZGVtLCAnY3JlYXRlZE9iamVjdFRhbmRlbSBzaG91bGQgYmUgYW4gaW5zdGFuY2Ugb2YgRHluYW1pY1RhbmRlbScgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zaW1wbGUtdHlwZS1jaGVja2luZy1hc3NlcnRpb25zXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY3JlYXRlZE9iamVjdCA9IHRoaXMuY3JlYXRlRWxlbWVudCggY3JlYXRlZE9iamVjdFRhbmRlbSwgLi4uYXJnc0ZvckNyZWF0ZUZ1bmN0aW9uICk7XHJcblxyXG4gICAgLy8gVGhpcyB2YWxpZGF0aW9uIGlzIG9ubHkgbmVlZGVkIGZvciBQaEVULWlPIGJyYW5kXHJcbiAgICBpZiAoIFRhbmRlbS5QSEVUX0lPX0VOQUJMRUQgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGNvbnRhaW5lclBhcmFtZXRlclR5cGUgIT09IG51bGwsICdjb250YWluZXJQYXJhbWV0ZXJUeXBlIG11c3QgYmUgcHJvdmlkZWQgaW4gUGhFVC1pTyBicmFuZCcgKTtcclxuXHJcbiAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgbmV3IGdyb3VwIGVsZW1lbnQgbWF0Y2hlcyB0aGUgc2NoZW1hIGZvciBlbGVtZW50cy5cclxuICAgICAgdmFsaWRhdGUoIGNyZWF0ZWRPYmplY3QsIGNvbnRhaW5lclBhcmFtZXRlclR5cGUhLnZhbGlkYXRvciApO1xyXG5cclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggY3JlYXRlZE9iamVjdC5waGV0aW9UeXBlLmV4dGVuZHMoIGNvbnRhaW5lclBhcmFtZXRlclR5cGUhICksXHJcbiAgICAgICAgJ2R5bmFtaWMgZWxlbWVudCBjb250YWluZXIgZXhwZWN0ZWQgaXRzIGNyZWF0ZWQgaW5zdGFuY2VcXCdzIHBoZXRpb1R5cGUgdG8gbWF0Y2ggaXRzIHBhcmFtZXRlclR5cGUuJyApO1xyXG4gICAgfVxyXG5cclxuICAgIGFzc2VydCAmJiB0aGlzLmFzc2VydER5bmFtaWNQaGV0aW9PYmplY3QoIGNyZWF0ZWRPYmplY3QgKTtcclxuXHJcbiAgICByZXR1cm4gY3JlYXRlZE9iamVjdDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgZHluYW1pYyBlbGVtZW50IHNob3VsZCBiZSBhbiBpbnN0cnVtZW50ZWQgUGhldGlvT2JqZWN0IHdpdGggcGhldGlvRHluYW1pY0VsZW1lbnQ6IHRydWVcclxuICAgKi9cclxuICBwcml2YXRlIGFzc2VydER5bmFtaWNQaGV0aW9PYmplY3QoIHBoZXRpb09iamVjdDogVCApOiB2b2lkIHtcclxuICAgIGlmICggVGFuZGVtLlBIRVRfSU9fRU5BQkxFRCAmJiBUYW5kZW0uVkFMSURBVElPTiApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggcGhldGlvT2JqZWN0LmlzUGhldGlvSW5zdHJ1bWVudGVkKCksICdpbnN0YW5jZSBzaG91bGQgYmUgaW5zdHJ1bWVudGVkJyApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBwaGV0aW9PYmplY3QucGhldGlvRHluYW1pY0VsZW1lbnQsICdpbnN0YW5jZSBzaG91bGQgYmUgbWFya2VkIGFzIHBoZXRpb0R5bmFtaWNFbGVtZW50OnRydWUnICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFbWl0IGEgY3JlYXRlZCBvciBkaXNwb3NlZCBldmVudC5cclxuICAgKi9cclxuICBwcml2YXRlIGVtaXREYXRhU3RyZWFtRXZlbnQoIGR5bmFtaWNFbGVtZW50OiBULCBldmVudE5hbWU6IHN0cmluZywgYWRkaXRpb25hbERhdGE/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwgKTogdm9pZCB7XHJcbiAgICB0aGlzLnBoZXRpb1N0YXJ0RXZlbnQoIGV2ZW50TmFtZSwge1xyXG4gICAgICBkYXRhOiBtZXJnZSgge1xyXG4gICAgICAgIHBoZXRpb0lEOiBkeW5hbWljRWxlbWVudC50YW5kZW0ucGhldGlvSURcclxuICAgICAgfSwgYWRkaXRpb25hbERhdGEgKVxyXG4gICAgfSApO1xyXG4gICAgdGhpcy5waGV0aW9FbmRFdmVudCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRW1pdCBldmVudHMgd2hlbiBkeW5hbWljIGVsZW1lbnRzIGFyZSBjcmVhdGVkLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgY3JlYXRlZEV2ZW50TGlzdGVuZXIoIGR5bmFtaWNFbGVtZW50OiBUICk6IHZvaWQge1xyXG4gICAgY29uc3QgYWRkaXRpb25hbERhdGEgPSBkeW5hbWljRWxlbWVudC5waGV0aW9TdGF0ZSA/IHtcclxuXHJcbiAgICAgIHN0YXRlOiB0aGlzLnBoZXRpb1R5cGUucGFyYW1ldGVyVHlwZXMhWyAwIF0udG9TdGF0ZU9iamVjdCggZHluYW1pY0VsZW1lbnQgKVxyXG4gICAgfSA6IG51bGw7XHJcbiAgICB0aGlzLmVtaXREYXRhU3RyZWFtRXZlbnQoIGR5bmFtaWNFbGVtZW50LCAnY3JlYXRlZCcsIGFkZGl0aW9uYWxEYXRhICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFbWl0IGV2ZW50cyB3aGVuIGR5bmFtaWMgZWxlbWVudHMgYXJlIGRpc3Bvc2VkLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZGlzcG9zZWRFdmVudExpc3RlbmVyKCBkeW5hbWljRWxlbWVudDogVCApOiB2b2lkIHtcclxuICAgIHRoaXMuZW1pdERhdGFTdHJlYW1FdmVudCggZHluYW1pY0VsZW1lbnQsICdkaXNwb3NlZCcgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSBkaXNwb3NlKCk6IHZvaWQge1xyXG5cclxuICAgIC8vIElmIGhpdHRpbmcgdGhpcyBhc3NlcnRpb24gYmVjYXVzZSBvZiBuZXN0ZWQgZHluYW1pYyBlbGVtZW50IGNvbnRhaW5lcnMsIHBsZWFzZSBkaXNjdXNzIHdpdGggYSBwaGV0LWlvIHRlYW0gbWVtYmVyLlxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggZmFsc2UsICdQaGV0aW9EeW5hbWljRWxlbWVudENvbnRhaW5lcnMgYXJlIG5vdCBpbnRlbmRlZCBmb3IgZGlzcG9zYWwnICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEaXNwb3NlIGEgY29udGFpbmVkIGVsZW1lbnRcclxuICAgKi9cclxuICBwcm90ZWN0ZWQgZGlzcG9zZUVsZW1lbnQoIGVsZW1lbnQ6IFQgKTogdm9pZCB7XHJcbiAgICBlbGVtZW50LmRpc3Bvc2UoKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgdGhpcy5zdXBwb3J0c0R5bmFtaWNTdGF0ZSAmJiBfLmhhc0luKCB3aW5kb3csICdwaGV0LmpvaXN0LnNpbScgKSAmJiBhc3NlcnQoXHJcbiAgICAgIC8vIFdlIGRvIG5vdCB3YW50IHRvIGJlIGRpc3Bvc2luZyBkeW5hbWljIGVsZW1lbnRzIHdoZW4gc3RhdGUgc2V0dGluZyBFWENFUFQgd2hlbiB3ZSBhcmUgY2xlYXJpbmcgYWxsIGR5bmFtaWNcclxuICAgICAgLy8gZWxlbWVudHMgKHdoaWNoIGlzIG9rIGFuZCBleHBlY3RlZCB0byBkbyBhdCB0aGUgYmVnaW5uaW5nIG9mIHNldHRpbmcgc3RhdGUpLlxyXG4gICAgICAhKCBpc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5LnZhbHVlICYmICFpc0NsZWFyaW5nUGhldGlvRHluYW1pY0VsZW1lbnRzUHJvcGVydHkgKSxcclxuICAgICAgJ3Nob3VsZCBub3QgZGlzcG9zZSBhIGR5bmFtaWMgZWxlbWVudCB3aGlsZSBzZXR0aW5nIHBoZXQtaW8gc3RhdGUnICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLm5vdGlmaWNhdGlvbnNEZWZlcnJlZCApIHtcclxuICAgICAgdGhpcy5kZWZlcnJlZERpc3Bvc2Fscy5wdXNoKCBlbGVtZW50ICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy5lbGVtZW50RGlzcG9zZWRFbWl0dGVyLmVtaXQoIGVsZW1lbnQsIGVsZW1lbnQudGFuZGVtLnBoZXRpb0lEICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgd2hlbiBjbGVhcmluZyB0aGUgY29udGVudHMgb2YgdGhpcyBjb250YWluZXIgdG8gcmVhZHkgdGhpbmdzIGZvciBzZXR0aW5nIGl0cyBzdGF0ZS4gSW4gZ2VuZXJhbCwgdGhpcyBjbGFzc1xyXG4gICAqIGlzIHNldCB1cCB0byBkZXN0cm95IGFuZCB0aGVuIHJlY3JlYXRlIGFsbCBvZiBpdHMgZWxlbWVudHMgaW5zdGVhZCBvZiBtdXRhdGluZyB0aGVtLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhYnN0cmFjdCBjbGVhciggY2xlYXJPcHRpb25zPzogQ2xlYXJPcHRpb25zICk6IHZvaWQ7XHJcblxyXG4gIC8qKlxyXG4gICAqIEZsdXNoIGEgc2luZ2xlIGVsZW1lbnQgZnJvbSB0aGUgbGlzdCBvZiBkZWZlcnJlZCBkaXNwb3NhbHMgdGhhdCBoYXZlIG5vdCB5ZXQgbm90aWZpZWQgYWJvdXQgdGhlIGRpc3Bvc2FsLiBUaGlzXHJcbiAgICogc2hvdWxkIG5ldmVyIGJlIGNhbGxlZCBwdWJsaWNseSwgaW5zdGVhZCBzZWUgYGRpc3Bvc2VFbGVtZW50YFxyXG4gICAqL1xyXG4gIHByaXZhdGUgbm90aWZ5RWxlbWVudERpc3Bvc2VkV2hpbGVEZWZlcnJlZCggZGlzcG9zZWRFbGVtZW50OiBUICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5ub3RpZmljYXRpb25zRGVmZXJyZWQsICdzaG91bGQgb25seSBiZSBjYWxsZWQgd2hlbiBub3RpZmljYXRpb25zIGFyZSBkZWZlcnJlZCcgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuZGVmZXJyZWREaXNwb3NhbHMuaW5jbHVkZXMoIGRpc3Bvc2VkRWxlbWVudCApLCAnZGlzcG9zZWRFbGVtZW50IHNob3VsZCBub3QgaGF2ZSBiZWVuIGFscmVhZHkgbm90aWZpZWQnICk7XHJcbiAgICB0aGlzLmVsZW1lbnREaXNwb3NlZEVtaXR0ZXIuZW1pdCggZGlzcG9zZWRFbGVtZW50LCBkaXNwb3NlZEVsZW1lbnQudGFuZGVtLnBoZXRpb0lEICk7XHJcbiAgICBhcnJheVJlbW92ZSggdGhpcy5kZWZlcnJlZERpc3Bvc2FscywgZGlzcG9zZWRFbGVtZW50ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTaG91bGQgYmUgY2FsbGVkIGJ5IHN1YnR5cGVzIHVwb24gZWxlbWVudCBjcmVhdGlvbiwgc2VlIFBoZXRpb0dyb3VwIGFzIGFuIGV4YW1wbGUuXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIG5vdGlmeUVsZW1lbnRDcmVhdGVkKCBjcmVhdGVkRWxlbWVudDogVCApOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy5ub3RpZmljYXRpb25zRGVmZXJyZWQgKSB7XHJcbiAgICAgIHRoaXMuZGVmZXJyZWRDcmVhdGlvbnMucHVzaCggY3JlYXRlZEVsZW1lbnQgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLmVsZW1lbnRDcmVhdGVkRW1pdHRlci5lbWl0KCBjcmVhdGVkRWxlbWVudCwgY3JlYXRlZEVsZW1lbnQudGFuZGVtLnBoZXRpb0lEICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGbHVzaCBhIHNpbmdsZSBlbGVtZW50IGZyb20gdGhlIGxpc3Qgb2YgZGVmZXJyZWQgY3JlYXRpb25zIHRoYXQgaGF2ZSBub3QgeWV0IG5vdGlmaWVkIGFib3V0IHRoZSBkaXNwb3NhbC4gVGhpc1xyXG4gICAqIGlzIG9ubHkgcHVibGljIHRvIHN1cHBvcnQgc3BlY2lmaWMgb3JkZXIgZGVwZW5kZW5jaWVzIGluIHRoZSBQaGV0aW9TdGF0ZUVuZ2luZSwgb3RoZXJ3aXNlIHNlZSBgdGhpcy5ub3RpZnlFbGVtZW50Q3JlYXRlZCgpYFxyXG4gICAqIChQaGV0aW9Hcm91cFRlc3RzLCBwaGV0LWlvKSAtIG9ubHkgdGhlIFBoZXRpb1N0YXRlRW5naW5lIHNob3VsZCBub3RpZnkgaW5kaXZpZHVhbCBlbGVtZW50cyBjcmVhdGVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBub3RpZnlFbGVtZW50Q3JlYXRlZFdoaWxlRGVmZXJyZWQoIGNyZWF0ZWRFbGVtZW50OiBUICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5ub3RpZmljYXRpb25zRGVmZXJyZWQsICdzaG91bGQgb25seSBiZSBjYWxsZWQgd2hlbiBub3RpZmljYXRpb25zIGFyZSBkZWZlcnJlZCcgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuZGVmZXJyZWRDcmVhdGlvbnMuaW5jbHVkZXMoIGNyZWF0ZWRFbGVtZW50ICksICdjcmVhdGVkRWxlbWVudCBzaG91bGQgbm90IGhhdmUgYmVlbiBhbHJlYWR5IG5vdGlmaWVkJyApO1xyXG4gICAgdGhpcy5lbGVtZW50Q3JlYXRlZEVtaXR0ZXIuZW1pdCggY3JlYXRlZEVsZW1lbnQsIGNyZWF0ZWRFbGVtZW50LnRhbmRlbS5waGV0aW9JRCApO1xyXG4gICAgYXJyYXlSZW1vdmUoIHRoaXMuZGVmZXJyZWRDcmVhdGlvbnMsIGNyZWF0ZWRFbGVtZW50ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGVuIHNldCB0byB0cnVlLCBjcmVhdGlvbiBhbmQgZGlzcG9zYWwgbm90aWZpY2F0aW9ucyB3aWxsIGJlIGRlZmVycmVkIHVudGlsIHNldCB0byBmYWxzZS4gV2hlbiBzZXQgdG8gZmFsc2UsXHJcbiAgICogdGhpcyBmdW5jdGlvbiB3aWxsIGZsdXNoIGFsbCB0aGUgbm90aWZpY2F0aW9ucyBmb3IgY3JlYXRlZCBhbmQgZGlzcG9zZWQgZWxlbWVudHMgKGluIHRoYXQgb3JkZXIpIHRoYXQgb2NjdXJyZWRcclxuICAgKiB3aGlsZSB0aGlzIGNvbnRhaW5lciB3YXMgZGVmZXJyaW5nIGl0cyBub3RpZmljYXRpb25zLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXROb3RpZmljYXRpb25zRGVmZXJyZWQoIG5vdGlmaWNhdGlvbnNEZWZlcnJlZDogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG5vdGlmaWNhdGlvbnNEZWZlcnJlZCAhPT0gdGhpcy5ub3RpZmljYXRpb25zRGVmZXJyZWQsICdzaG91bGQgbm90IGJlIHRoZSBzYW1lIGFzIGN1cnJlbnQgdmFsdWUnICk7XHJcblxyXG4gICAgLy8gRmx1c2ggYWxsIG5vdGlmaWNhdGlvbnMgd2hlbiBzZXR0aW5nIHRvIGJlIG5vIGxvbmdlciBkZWZlcnJlZFxyXG4gICAgaWYgKCAhbm90aWZpY2F0aW9uc0RlZmVycmVkICkge1xyXG4gICAgICB3aGlsZSAoIHRoaXMuZGVmZXJyZWRDcmVhdGlvbnMubGVuZ3RoID4gMCApIHtcclxuICAgICAgICB0aGlzLm5vdGlmeUVsZW1lbnRDcmVhdGVkV2hpbGVEZWZlcnJlZCggdGhpcy5kZWZlcnJlZENyZWF0aW9uc1sgMCBdICk7XHJcbiAgICAgIH1cclxuICAgICAgd2hpbGUgKCB0aGlzLmRlZmVycmVkRGlzcG9zYWxzLmxlbmd0aCA+IDAgKSB7XHJcbiAgICAgICAgdGhpcy5ub3RpZnlFbGVtZW50RGlzcG9zZWRXaGlsZURlZmVycmVkKCB0aGlzLmRlZmVycmVkRGlzcG9zYWxzWyAwIF0gKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5kZWZlcnJlZENyZWF0aW9ucy5sZW5ndGggPT09IDAsICdjcmVhdGlvbnMgc2hvdWxkIGJlIGNsZWFyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5kZWZlcnJlZERpc3Bvc2Fscy5sZW5ndGggPT09IDAsICdkaXNwb3NhbHMgc2hvdWxkIGJlIGNsZWFyJyApO1xyXG4gICAgdGhpcy5ub3RpZmljYXRpb25zRGVmZXJyZWQgPSBub3RpZmljYXRpb25zRGVmZXJyZWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAdGhyb3dzIGVycm9yIGlmIHRyeWluZyB0byBhY2Nlc3Mgd2hlbiBhcmNoZXR5cGVzIGFyZW4ndCBiZWluZyBjcmVhdGVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgYXJjaGV0eXBlKCk6IFQge1xyXG4gICAgcmV0dXJuIGFyY2hldHlwZUNhc3QoIHRoaXMuX2FyY2hldHlwZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkIHRoZSBwaGV0aW9EeW5hbWljRWxlbWVudE5hbWUgZm9yIEFQSSB0cmFja2luZ1xyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBnZXRNZXRhZGF0YSggb2JqZWN0OiBQaGV0aW9PYmplY3RNZXRhZGF0YUlucHV0ICk6IFBoZXRpb0VsZW1lbnRNZXRhZGF0YSB7XHJcbiAgICBjb25zdCBtZXRhZGF0YSA9IHN1cGVyLmdldE1ldGFkYXRhKCBvYmplY3QgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoXHJcbiAgICAgICFtZXRhZGF0YS5oYXNPd25Qcm9wZXJ0eSggJ3BoZXRpb0R5bmFtaWNFbGVtZW50TmFtZScgKSxcclxuICAgICAgJ1BoZXRpb0R5bmFtaWNFbGVtZW50Q29udGFpbmVyIHNldHMgdGhlIHBoZXRpb0R5bmFtaWNFbGVtZW50TmFtZSBtZXRhZGF0YSBrZXknXHJcbiAgICApO1xyXG4gICAgcmV0dXJuIG1lcmdlKCB7IHBoZXRpb0R5bmFtaWNFbGVtZW50TmFtZTogdGhpcy5waGV0aW9EeW5hbWljRWxlbWVudE5hbWUgfSwgbWV0YWRhdGEgKTtcclxuICB9XHJcbn1cclxuXHJcbnRhbmRlbU5hbWVzcGFjZS5yZWdpc3RlciggJ1BoZXRpb0R5bmFtaWNFbGVtZW50Q29udGFpbmVyJywgUGhldGlvRHluYW1pY0VsZW1lbnRDb250YWluZXIgKTtcclxuZXhwb3J0IGRlZmF1bHQgUGhldGlvRHluYW1pY0VsZW1lbnRDb250YWluZXI7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFD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