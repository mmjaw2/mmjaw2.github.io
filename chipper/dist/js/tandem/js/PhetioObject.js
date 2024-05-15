// Copyright 2017-2024, University of Colorado Boulder

/**
 * Base type that provides PhET-iO features. An instrumented PhetioObject is referred to on the wrapper side/design side
 * as a "PhET-iO Element".  Note that sims may have hundreds or thousands of PhetioObjects, so performance and memory
 * considerations are important.  For this reason, initializePhetioObject is only called in PhET-iO brand, which means
 * many of the getters such as `phetioState` and `phetioDocumentation` will not work in other brands. We have opted
 * to have these getters throw assertion errors in other brands to help identify problems if these are called
 * unexpectedly.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import animationFrameTimer from '../../axon/js/animationFrameTimer.js';
import validate from '../../axon/js/validate.js';
import arrayRemove from '../../phet-core/js/arrayRemove.js';
import assertMutuallyExclusiveOptions from '../../phet-core/js/assertMutuallyExclusiveOptions.js';
import merge from '../../phet-core/js/merge.js';
import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
import EventType from './EventType.js';
import LinkedElementIO from './LinkedElementIO.js';
import phetioAPIValidation from './phetioAPIValidation.js';
import Tandem from './Tandem.js';
import TandemConstants from './TandemConstants.js';
import tandemNamespace from './tandemNamespace.js';
import IOType from './types/IOType.js';
import Disposable from '../../axon/js/Disposable.js';
import DescriptionRegistry from './DescriptionRegistry.js';

// constants
const PHET_IO_ENABLED = Tandem.PHET_IO_ENABLED;
const IO_TYPE_VALIDATOR = {
  valueType: IOType,
  validationMessage: 'phetioType must be an IOType'
};
const BOOLEAN_VALIDATOR = {
  valueType: 'boolean'
};

// use "<br>" instead of newlines
const PHET_IO_DOCUMENTATION_VALIDATOR = {
  valueType: 'string',
  isValidValue: doc => !doc.includes('\n'),
  validationMessage: 'phetioDocumentation must be provided in the right format'
};
const PHET_IO_EVENT_TYPE_VALIDATOR = {
  valueType: EventType,
  validationMessage: 'invalid phetioEventType'
};
const OBJECT_VALIDATOR = {
  valueType: [Object, null]
};
const objectToPhetioID = phetioObject => phetioObject.tandem.phetioID;
// When an event is suppressed from the data stream, we keep track of it with this token.
const SKIPPING_MESSAGE = -1;
const ENABLE_DESCRIPTION_REGISTRY = !!window.phet?.chipper?.queryParameters?.supportsDescriptionPlugin;
const DEFAULTS = {
  // Subtypes can use `Tandem.REQUIRED` to require a named tandem passed in
  tandem: Tandem.OPTIONAL,
  // Defines description-specific tandems that do NOT affect the phet-io system.
  descriptionTandem: Tandem.OPTIONAL,
  // Defines API methods, events and serialization
  phetioType: IOType.ObjectIO,
  // Useful notes about an instrumented PhetioObject, shown in the PhET-iO Studio Wrapper. It's an html
  // string, so "<br>" tags are required instead of "\n" characters for proper rendering in Studio
  phetioDocumentation: TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioDocumentation,
  // When true, includes the PhetioObject in the PhET-iO state (not automatically recursive, must be specified for
  // children explicitly)
  phetioState: TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioState,
  // This option controls how PhET-iO wrappers can interface with this PhetioObject. Predominately this occurs via
  // public methods defined on this PhetioObject's phetioType, in which some method are not executable when this flag
  // is true. See `ObjectIO.methods` for further documentation, especially regarding `invocableForReadOnlyElements`.
  // NOTE: PhetioObjects with {phetioState: true} AND {phetioReadOnly: true} are restored during via setState.
  phetioReadOnly: TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioReadOnly,
  // Category of event type, can be overridden in phetioStartEvent options.  Cannot be supplied through TandemConstants because
  // that would create an import loop
  phetioEventType: EventType.MODEL,
  // High frequency events such as mouse moves can be omitted from data stream, see ?phetioEmitHighFrequencyEvents
  // and PhetioClient.launchSimulation option
  // @deprecated - see https://github.com/phetsims/phet-io/issues/1629#issuecomment-608002410
  phetioHighFrequency: TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioHighFrequency,
  // When true, emits events for data streams for playback, see handlePlaybackEvent.js
  phetioPlayback: TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioPlayback,
  // When true, this is categorized as an important "featured" element in Studio.
  phetioFeatured: TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioFeatured,
  // indicates that an object may or may not have been created. Applies recursively automatically
  // and should only be set manually on the root dynamic element. Dynamic archetypes will have this overwritten to
  // false even if explicitly provided as true, as archetypes cannot be dynamic.
  phetioDynamicElement: TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioDynamicElement,
  // Marking phetioDesigned: true opts-in to API change detection tooling that can be used to catch inadvertent
  // changes to a designed API.  A phetioDesigned:true PhetioObject (or any of its tandem descendants) will throw
  // assertion errors on CT (or when running with ?phetioCompareAPI) when the following are true:
  // (a) its package.json lists compareDesignedAPIChanges:true in the "phet-io" section
  // (b) the simulation is listed in perennial/data/phet-io-api-stable
  // (c) any of its metadata values deviate from the reference API
  phetioDesigned: TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioDesigned,
  // delivered with each event, if specified. phetioPlayback is appended here, if true.
  // Note: unlike other options, this option can be mutated downstream, and hence should be created newly for each instance.
  phetioEventMetadata: null,
  // null means no constraint on tandem name.
  tandemNameSuffix: null
};

// If you run into a type error here, feel free to add any type that is supported by the browsers "structured cloning algorithm" https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm

assert && assert(EventType.phetioType.toStateObject(DEFAULTS.phetioEventType) === TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioEventType, 'phetioEventType must have the same default as the default metadata values.');

// Options for creating a PhetioObject

// A type that is used for the structural typing when gathering metadata. We just need a "PhetioObject-like" entity
// to pull the API metadata from. Thus, this is the "input" to logic that would pull the metadata keys into an object
// for the PhetioAPI.
// eslint-disable-next-line phet-io-object-options-should-not-pick-from-phet-io-object

class PhetioObject extends Disposable {
  // assigned in initializePhetioObject - see docs at DEFAULTS declaration

  // track whether the object has been initialized.  This is necessary because initialization can happen in the
  // constructor or in a subsequent call to initializePhetioObject (to support scenery Node)

  // See documentation in DEFAULTS

  // Public only for PhetioObjectMetadataInput

  static DEFAULT_OPTIONS = DEFAULTS;
  constructor(options) {
    super();
    this.tandem = DEFAULTS.tandem;
    this.phetioID = this.tandem.phetioID;
    this.phetioObjectInitialized = false;
    if (options) {
      this.initializePhetioObject({}, options);
    }
  }

  /**
   * Like SCENERY/Node, PhetioObject can be configured during construction or later with a mutate call.
   * Noop if provided options keys don't intersect with any key in DEFAULTS; baseOptions are ignored for this calculation.
   */
  initializePhetioObject(baseOptions, providedOptions) {
    assert && assert(!baseOptions.hasOwnProperty('isDisposable'), 'baseOptions should not contain isDisposable');
    this.initializeDisposable(providedOptions);
    assert && assert(providedOptions, 'initializePhetioObject must be called with providedOptions');

    // call before we exit early to support logging unsupplied Tandems.
    providedOptions.tandem && Tandem.onMissingTandem(providedOptions.tandem);

    // Make sure that required tandems are supplied
    if (assert && Tandem.VALIDATION && providedOptions.tandem && providedOptions.tandem.required) {
      assert(providedOptions.tandem.supplied, 'required tandems must be supplied');
    }
    if (ENABLE_DESCRIPTION_REGISTRY && providedOptions.tandem && providedOptions.tandem.supplied) {
      DescriptionRegistry.add(providedOptions.tandem, this);
    }

    // The presence of `tandem` indicates if this PhetioObject can be initialized. If not yet initialized, perhaps
    // it will be initialized later on, as in Node.mutate().
    if (!(PHET_IO_ENABLED && providedOptions.tandem && providedOptions.tandem.supplied)) {
      // In this case, the PhetioObject is not initialized, but still set tandem to maintain a consistent API for
      // creating the Tandem tree.
      if (providedOptions.tandem) {
        this.tandem = providedOptions.tandem;
        this.phetioID = this.tandem.phetioID;
      }
      return;
    }
    assert && assert(!this.phetioObjectInitialized, 'cannot initialize twice');

    // Guard validation on assert to avoid calling a large number of no-ops when assertions are disabled, see https://github.com/phetsims/tandem/issues/200
    assert && validate(providedOptions.tandem, {
      valueType: Tandem
    });
    const defaults = combineOptions({}, DEFAULTS, baseOptions);
    let options = optionize()(defaults, providedOptions);

    // validate options before assigning to properties
    assert && validate(options.phetioType, IO_TYPE_VALIDATOR);
    assert && validate(options.phetioState, merge({}, BOOLEAN_VALIDATOR, {
      validationMessage: 'phetioState must be a boolean'
    }));
    assert && validate(options.phetioReadOnly, merge({}, BOOLEAN_VALIDATOR, {
      validationMessage: 'phetioReadOnly must be a boolean'
    }));
    assert && validate(options.phetioEventType, PHET_IO_EVENT_TYPE_VALIDATOR);
    assert && validate(options.phetioDocumentation, PHET_IO_DOCUMENTATION_VALIDATOR);
    assert && validate(options.phetioHighFrequency, merge({}, BOOLEAN_VALIDATOR, {
      validationMessage: 'phetioHighFrequency must be a boolean'
    }));
    assert && validate(options.phetioPlayback, merge({}, BOOLEAN_VALIDATOR, {
      validationMessage: 'phetioPlayback must be a boolean'
    }));
    assert && validate(options.phetioFeatured, merge({}, BOOLEAN_VALIDATOR, {
      validationMessage: 'phetioFeatured must be a boolean'
    }));
    assert && validate(options.phetioEventMetadata, merge({}, OBJECT_VALIDATOR, {
      validationMessage: 'object literal expected'
    }));
    assert && validate(options.phetioDynamicElement, merge({}, BOOLEAN_VALIDATOR, {
      validationMessage: 'phetioDynamicElement must be a boolean'
    }));
    assert && validate(options.phetioDesigned, merge({}, BOOLEAN_VALIDATOR, {
      validationMessage: 'phetioDesigned must be a boolean'
    }));
    assert && assert(this.linkedElements !== null, 'this means addLinkedElement was called before instrumentation of this PhetioObject');

    // optional - Indicates that an object is a archetype for a dynamic class. Settable only by
    // PhetioEngine and by classes that create dynamic elements when creating their archetype (like PhetioGroup) through
    // PhetioObject.markDynamicElementArchetype().
    // if true, items will be excluded from phetioState. This applies recursively automatically.
    this.phetioIsArchetype = false;

    // (phetioEngine)
    // Store the full baseline for usage in validation or for usage in studio.  Do this before applying overrides. The
    // baseline is created when a sim is run with assertions to assist in phetioAPIValidation.  However, even when
    // assertions are disabled, some wrappers such as studio need to generate the baseline anyway.
    // not all metadata are passed through via options, so store baseline for these additional properties
    this.phetioBaselineMetadata = phetioAPIValidation.enabled || phet.preloads.phetio.queryParameters.phetioEmitAPIBaseline ? this.getMetadata(merge({
      phetioIsArchetype: this.phetioIsArchetype,
      phetioArchetypePhetioID: this.phetioArchetypePhetioID
    }, options)) : null;

    // Dynamic elements should compare to their "archetypal" counterparts.  For example, this means that a Particle
    // in a PhetioGroup will take its overrides from the PhetioGroup archetype.
    const archetypalPhetioID = options.tandem.getArchetypalPhetioID();

    // Overrides are only defined for simulations, not for unit tests.  See https://github.com/phetsims/phet-io/issues/1461
    // Patch in the desired values from overrides, if any.
    if (window.phet.preloads.phetio.phetioElementsOverrides) {
      const overrides = window.phet.preloads.phetio.phetioElementsOverrides[archetypalPhetioID];
      if (overrides) {
        // No need to make a new object, since this "options" variable was created in the previous merge call above.
        options = optionize()(options, overrides);
      }
    }

    // (read-only) see docs at DEFAULTS declaration
    this.tandem = options.tandem;
    this.phetioID = this.tandem.phetioID;

    // (read-only) see docs at DEFAULTS declaration
    this._phetioType = options.phetioType;

    // (read-only) see docs at DEFAULTS declaration
    this._phetioState = options.phetioState;

    // (read-only) see docs at DEFAULTS declaration
    this._phetioReadOnly = options.phetioReadOnly;

    // (read-only) see docs at DEFAULTS declaration
    this._phetioDocumentation = options.phetioDocumentation;

    // see docs at DEFAULTS declaration
    this._phetioEventType = options.phetioEventType;

    // see docs at DEFAULTS declaration
    this._phetioHighFrequency = options.phetioHighFrequency;

    // see docs at DEFAULTS declaration
    this._phetioPlayback = options.phetioPlayback;

    // (PhetioEngine) see docs at DEFAULTS declaration - in order to recursively pass this value to
    // children, the setPhetioDynamicElement() function must be used instead of setting this attribute directly
    this._phetioDynamicElement = options.phetioDynamicElement;

    // (read-only) see docs at DEFAULTS declaration
    this._phetioFeatured = options.phetioFeatured;
    this._phetioEventMetadata = options.phetioEventMetadata;
    this._phetioDesigned = options.phetioDesigned;

    // for phetioDynamicElements, the corresponding phetioID for the element in the archetype subtree
    this.phetioArchetypePhetioID = null;

    //keep track of LinkedElements for disposal. Null out to support asserting on
    // edge error cases, see this.addLinkedElement()
    this.linkedElements = [];

    // (phet-io) set to true when this PhetioObject has been sent over to the parent.
    this.phetioNotifiedObjectCreated = false;

    // tracks the indices of started messages so that dataStream can check that ends match starts.
    this.phetioMessageStack = [];

    // Make sure playback shows in the phetioEventMetadata
    if (this._phetioPlayback) {
      this._phetioEventMetadata = this._phetioEventMetadata || {};
      assert && assert(!this._phetioEventMetadata.hasOwnProperty('playback'), 'phetioEventMetadata.playback should not already exist');
      this._phetioEventMetadata.playback = true;
    }

    // Alert that this PhetioObject is ready for cross-frame communication (thus becoming a "PhET-iO Element" on the wrapper side.
    this.tandem.addPhetioObject(this);
    this.phetioObjectInitialized = true;
    if (assert && Tandem.VALIDATION && this.isPhetioInstrumented() && options.tandemNameSuffix) {
      const suffixArray = Array.isArray(options.tandemNameSuffix) ? options.tandemNameSuffix : [options.tandemNameSuffix];
      const matches = suffixArray.filter(suffix => {
        return this.tandem.name.endsWith(suffix) || this.tandem.name.endsWith(PhetioObject.swapCaseOfFirstCharacter(suffix));
      });
      assert && assert(matches.length > 0, 'Incorrect Tandem suffix, expected = ' + suffixArray.join(', ') + '. actual = ' + this.tandem.phetioID);
    }
  }
  static swapCaseOfFirstCharacter(string) {
    const firstChar = string[0];
    const newFirstChar = firstChar === firstChar.toLowerCase() ? firstChar.toUpperCase() : firstChar.toLowerCase();
    return newFirstChar + string.substring(1);
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioType() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioType only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioType;
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioState() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioState only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioState;
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioReadOnly() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioReadOnly only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioReadOnly;
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioDocumentation() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioDocumentation only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioDocumentation;
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioEventType() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioEventType only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioEventType;
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioHighFrequency() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioHighFrequency only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioHighFrequency;
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioPlayback() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioPlayback only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioPlayback;
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioDynamicElement() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioDynamicElement only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioDynamicElement;
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioFeatured() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioFeatured only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioFeatured;
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioEventMetadata() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioEventMetadata only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioEventMetadata;
  }

  // throws an assertion error in brands other than PhET-iO
  get phetioDesigned() {
    assert && assert(PHET_IO_ENABLED && this.isPhetioInstrumented(), 'phetioDesigned only accessible for instrumented objects in PhET-iO brand.');
    return this._phetioDesigned;
  }

  /**
   * Start an event for the nested PhET-iO data stream.
   *
   * @param event - the name of the event
   * @param [providedOptions]
   */
  phetioStartEvent(event, providedOptions) {
    if (PHET_IO_ENABLED && this.isPhetioInstrumented()) {
      // only one or the other can be provided
      assert && assertMutuallyExclusiveOptions(providedOptions, ['data'], ['getData']);
      const options = optionize()({
        data: null,
        // function that, when called gets the data.
        getData: null
      }, providedOptions);
      assert && assert(this.phetioObjectInitialized, 'phetioObject should be initialized');
      assert && options.data && assert(typeof options.data === 'object');
      assert && options.getData && assert(typeof options.getData === 'function');
      assert && assert(arguments.length === 1 || arguments.length === 2, 'Prevent usage of incorrect signature');

      // TODO: don't drop PhET-iO events if they are created before we have a dataStream global. https://github.com/phetsims/phet-io/issues/1875
      if (!_.hasIn(window, 'phet.phetio.dataStream')) {
        // If you hit this, then it is likely related to https://github.com/phetsims/scenery/issues/1124 and we would like to know about it!
        // assert && assert( false, 'trying to create an event before the data stream exists' );

        this.phetioMessageStack.push(SKIPPING_MESSAGE);
        return;
      }

      // Opt out of certain events if queryParameter override is provided. Even for a low frequency data stream, high
      // frequency events can still be emitted when they have a low frequency ancestor.
      const skipHighFrequencyEvent = this.phetioHighFrequency && _.hasIn(window, 'phet.preloads.phetio.queryParameters') && !window.phet.preloads.phetio.queryParameters.phetioEmitHighFrequencyEvents && !phet.phetio.dataStream.isEmittingLowFrequencyEvent();

      // TODO: If there is no dataStream global defined, then we should handle this differently as to not drop the event that is triggered, see https://github.com/phetsims/phet-io/issues/1846
      const skipFromUndefinedDatastream = !assert && !_.hasIn(window, 'phet.phetio.dataStream');
      if (skipHighFrequencyEvent || this.phetioEventType === EventType.OPT_OUT || skipFromUndefinedDatastream) {
        this.phetioMessageStack.push(SKIPPING_MESSAGE);
        return;
      }

      // Only get the args if we are actually going to send the event.
      const data = options.getData ? options.getData() : options.data;
      this.phetioMessageStack.push(phet.phetio.dataStream.start(this.phetioEventType, this.tandem.phetioID, this.phetioType, event, data, this.phetioEventMetadata, this.phetioHighFrequency));

      // To support PhET-iO playback, any potential playback events downstream of this playback event must be marked as
      // non playback events. This is to prevent the PhET-iO playback engine from repeating those events. See
      // https://github.com/phetsims/phet-io/issues/1693
      this.phetioPlayback && phet.phetio.dataStream.pushNonPlaybackable();
    }
  }

  /**
   * End an event on the nested PhET-iO data stream. It this object was disposed or dataStream.start was not called,
   * this is a no-op.
   */
  phetioEndEvent(assertCorrectIndices = false) {
    if (PHET_IO_ENABLED && this.isPhetioInstrumented()) {
      assert && assert(this.phetioMessageStack.length > 0, 'Must have messages to pop');
      const topMessageIndex = this.phetioMessageStack.pop();

      // The message was started as a high frequency event to be skipped, so the end is a no-op
      if (topMessageIndex === SKIPPING_MESSAGE) {
        return;
      }
      this.phetioPlayback && phet.phetio.dataStream.popNonPlaybackable();
      phet.phetio.dataStream.end(topMessageIndex, assertCorrectIndices);
    }
  }

  /**
   * Set any instrumented descendants of this PhetioObject to the same value as this.phetioDynamicElement.
   */
  propagateDynamicFlagsToDescendants() {
    assert && assert(Tandem.PHET_IO_ENABLED, 'phet-io should be enabled');
    assert && assert(phet.phetio && phet.phetio.phetioEngine, 'Dynamic elements cannot be created statically before phetioEngine exists.');
    const phetioEngine = phet.phetio.phetioEngine;

    // in the same order as bufferedPhetioObjects
    const unlaunchedPhetioIDs = !Tandem.launched ? Tandem.bufferedPhetioObjects.map(objectToPhetioID) : [];
    this.tandem.iterateDescendants(tandem => {
      const phetioID = tandem.phetioID;
      if (phetioEngine.hasPhetioObject(phetioID) || !Tandem.launched && unlaunchedPhetioIDs.includes(phetioID)) {
        assert && assert(this.isPhetioInstrumented());
        const phetioObject = phetioEngine.hasPhetioObject(phetioID) ? phetioEngine.getPhetioElement(phetioID) : Tandem.bufferedPhetioObjects[unlaunchedPhetioIDs.indexOf(phetioID)];
        assert && assert(phetioObject, 'should have a phetioObject here');

        // Order matters here! The phetioIsArchetype needs to be first to ensure that the setPhetioDynamicElement
        // setter can opt out for archetypes.
        phetioObject.phetioIsArchetype = this.phetioIsArchetype;
        phetioObject.setPhetioDynamicElement(this.phetioDynamicElement);
        if (phetioObject.phetioBaselineMetadata) {
          phetioObject.phetioBaselineMetadata.phetioIsArchetype = this.phetioIsArchetype;
        }
      }
    });
  }

  /**
   * Used in PhetioEngine
   */
  setPhetioDynamicElement(phetioDynamicElement) {
    assert && assert(!this.phetioNotifiedObjectCreated, 'should not change dynamic element flags after notifying this PhetioObject\'s creation.');
    assert && assert(this.isPhetioInstrumented());

    // All archetypes are static (non-dynamic)
    this._phetioDynamicElement = this.phetioIsArchetype ? false : phetioDynamicElement;

    // For dynamic elements, indicate the corresponding archetype element so that clients like Studio can leverage
    // the archetype metadata. Static elements don't have archetypes.
    this.phetioArchetypePhetioID = phetioDynamicElement ? this.tandem.getArchetypalPhetioID() : null;

    // Keep the baseline metadata in sync.
    if (this.phetioBaselineMetadata) {
      this.phetioBaselineMetadata.phetioDynamicElement = this.phetioDynamicElement;
    }
  }

  /**
   * Mark this PhetioObject as an archetype for dynamic elements.
   */
  markDynamicElementArchetype() {
    assert && assert(!this.phetioNotifiedObjectCreated, 'should not change dynamic element flags after notifying this PhetioObject\'s creation.');
    this.phetioIsArchetype = true;
    this.setPhetioDynamicElement(false); // because archetypes aren't dynamic elements

    if (this.phetioBaselineMetadata) {
      this.phetioBaselineMetadata.phetioIsArchetype = this.phetioIsArchetype;
    }

    // recompute for children also, but only if phet-io is enabled
    Tandem.PHET_IO_ENABLED && this.propagateDynamicFlagsToDescendants();
  }

  /**
   * A PhetioObject will only be instrumented if the tandem that was passed in was "supplied". See Tandem.supplied
   * for more info.
   */
  isPhetioInstrumented() {
    return this.tandem && this.tandem.supplied;
  }

  /**
   * When an instrumented PhetioObject is linked with another instrumented PhetioObject, this creates a one-way
   * association which is rendered in Studio as a "symbolic" link or hyperlink. Many common code UI elements use this
   * automatically. To keep client sites simple, this has a graceful opt-out mechanism which makes this function a
   * no-op if either this PhetioObject or the target PhetioObject is not instrumented.
   *
   * You can specify the tandem one of three ways:
   * 1. Without specifying tandemName or tandem, it will pluck the tandem.name from the target element
   * 2. If tandemName is specified in the options, it will use that tandem name and nest the tandem under this PhetioObject's tandem
   * 3. If tandem is specified in the options (not recommended), it will use that tandem and nest it anywhere that tandem exists.
   *    Use this option with caution since it allows you to nest the tandem anywhere in the tree.
   *
   * @param element - the target element. Must be instrumented for a LinkedElement to be created-- otherwise gracefully opts out
   * @param [providedOptions]
   */
  addLinkedElement(element, providedOptions) {
    if (!this.isPhetioInstrumented()) {
      // set this to null so that you can't addLinkedElement on an uninitialized PhetioObject and then instrument
      // it afterward.
      this.linkedElements = null;
      return;
    }

    // In some cases, UI components need to be wired up to a private (internal) Property which should neither be
    // instrumented nor linked.
    if (PHET_IO_ENABLED && element.isPhetioInstrumented()) {
      const options = optionize()({
        // The linkage is only featured if the parent and the element are both also featured
        phetioFeatured: this.phetioFeatured && element.phetioFeatured
      }, providedOptions);
      assert && assert(Array.isArray(this.linkedElements), 'linkedElements should be an array');
      let tandem = null;
      if (providedOptions && providedOptions.tandem) {
        tandem = providedOptions.tandem;
      } else if (providedOptions && providedOptions.tandemName) {
        tandem = this.tandem.createTandem(providedOptions.tandemName);
      } else if (!providedOptions && element.tandem) {
        tandem = this.tandem.createTandem(element.tandem.name);
      }
      if (tandem) {
        options.tandem = tandem;
      }
      this.linkedElements.push(new LinkedElement(element, options));
    }
  }

  /**
   * Remove all linked elements linking to the provided PhetioObject. This will dispose all removed LinkedElements. This
   * will be graceful, and doesn't assume or assert that the provided PhetioObject has LinkedElement(s), it will just
   * remove them if they are there.
   */
  removeLinkedElements(potentiallyLinkedElement) {
    if (this.isPhetioInstrumented() && this.linkedElements) {
      assert && assert(potentiallyLinkedElement.isPhetioInstrumented());
      const toRemove = this.linkedElements.filter(linkedElement => linkedElement.element === potentiallyLinkedElement);
      toRemove.forEach(linkedElement => {
        linkedElement.dispose();
        arrayRemove(this.linkedElements, linkedElement);
      });
    }
  }

  /**
   * Performs cleanup after the sim's construction has finished.
   */
  onSimulationConstructionCompleted() {
    // deletes the phetioBaselineMetadata, as it's no longer needed since validation is complete.
    this.phetioBaselineMetadata = null;
  }

  /**
   * Overrideable so that subclasses can return a different PhetioObject for studio autoselect. This method is called
   * when there is a scene graph hit. Return the corresponding target that matches the PhET-iO filters.  Note this means
   * that if PhET-iO Studio is looking for a featured item and this is not featured, it will return 'phetioNotSelectable'.
   * Something is 'phetioNotSelectable' if it is not instrumented or if it does not match the "featured" filtering.
   *
   * The `fromLinking` flag allows a cutoff to prevent recursive linking chains in 'linked' mode. Given these linked elements:
   * cardNode -> card -> cardValueProperty
   * We don't want 'linked' mode to map from cardNode all the way to cardValueProperty (at least automatically), see https://github.com/phetsims/tandem/issues/300
   */
  getPhetioMouseHitTarget(fromLinking = false) {
    assert && assert(phet.tandem.phetioElementSelectionProperty.value !== 'none', 'getPhetioMouseHitTarget should not be called when phetioElementSelectionProperty is none');

    // Don't get a linked element for a linked element (recursive link element searching)
    if (!fromLinking && phet.tandem.phetioElementSelectionProperty.value === 'linked') {
      const linkedElement = this.getCorrespondingLinkedElement();
      if (linkedElement !== 'noCorrespondingLinkedElement') {
        return linkedElement.getPhetioMouseHitTarget(true);
      } else if (this.tandem.parentTandem) {
        // Look for a sibling linkedElement if there are no child linkages, see https://github.com/phetsims/studio/issues/246#issuecomment-1018733408

        const parent = phet.phetio.phetioEngine.phetioElementMap[this.tandem.parentTandem.phetioID];
        if (parent) {
          const linkedParentElement = parent.getCorrespondingLinkedElement();
          if (linkedParentElement !== 'noCorrespondingLinkedElement') {
            return linkedParentElement.getPhetioMouseHitTarget(true);
          }
        }
      }

      // Otherwise fall back to the view element, don't return here
    }
    if (phet.tandem.phetioElementSelectionProperty.value === 'string') {
      return 'phetioNotSelectable';
    }
    return this.getPhetioMouseHitTargetSelf();
  }

  /**
   * Determine if this instance should be selectable
   */
  getPhetioMouseHitTargetSelf() {
    return this.isPhetioMouseHitSelectable() ? this : 'phetioNotSelectable';
  }

  /**
   * Factored out function returning if this instance is phetio selectable
   */
  isPhetioMouseHitSelectable() {
    // We are not selectable if we are unfeatured and we are only displaying featured elements.
    // To prevent a circular dependency. We need to have a Property (which is a PhetioObject) in order to use it.
    // This should remain a hard failure if we have not loaded this display Property by the time we want a mouse-hit target.
    const featuredFilterCorrect = phet.tandem.phetioElementsDisplayProperty.value !== 'featured' || this.isDisplayedInFeaturedTree();
    return this.isPhetioInstrumented() && featuredFilterCorrect;
  }

  /**
   * This function determines not only if this PhetioObject is phetioFeatured, but if any descendant of this
   * PhetioObject is phetioFeatured, this will influence if this instance is displayed while showing phetioFeatured,
   * since featured children will cause the parent to be displayed as well.
   */
  isDisplayedInFeaturedTree() {
    if (this.isPhetioInstrumented() && this.phetioFeatured) {
      return true;
    }
    let displayed = false;
    this.tandem.iterateDescendants(descendantTandem => {
      const parent = phet.phetio.phetioEngine.phetioElementMap[descendantTandem.phetioID];
      if (parent && parent.isPhetioInstrumented() && parent.phetioFeatured) {
        displayed = true;
      }
    });
    return displayed;
  }

  /**
   * Acquire the linkedElement that most closely relates to this PhetioObject, given some heuristics. First, if there is
   * only a single LinkedElement child, use that. Otherwise, select hard coded names that are likely to be most important.
   */
  getCorrespondingLinkedElement() {
    const children = Object.keys(this.tandem.children);
    const linkedChildren = [];
    children.forEach(childName => {
      const childPhetioID = phetio.PhetioIDUtils.append(this.tandem.phetioID, childName);

      // Note that if it doesn't find a phetioID, that may be a synthetic node with children but not itself instrumented.
      const phetioObject = phet.phetio.phetioEngine.phetioElementMap[childPhetioID];
      if (phetioObject instanceof LinkedElement) {
        linkedChildren.push(phetioObject);
      }
    });
    const linkedTandemNames = linkedChildren.map(linkedElement => {
      return phetio.PhetioIDUtils.getComponentName(linkedElement.phetioID);
    });
    let linkedChild = null;
    if (linkedChildren.length === 1) {
      linkedChild = linkedChildren[0];
    } else if (linkedTandemNames.includes('property')) {
      // Prioritize a linked child named "property"
      linkedChild = linkedChildren[linkedTandemNames.indexOf('property')];
    } else if (linkedTandemNames.includes('valueProperty')) {
      // Next prioritize "valueProperty", a common name for the controlling Property of a view component
      linkedChild = linkedChildren[linkedTandemNames.indexOf('valueProperty')];
    } else {
      // Either there are no linked children, or too many to know which one to select.
      return 'noCorrespondingLinkedElement';
    }
    assert && assert(linkedChild, 'phetioElement is needed');
    return linkedChild.element;
  }

  /**
   * Remove this phetioObject from PhET-iO. After disposal, this object is no longer interoperable. Also release any
   * other references created during its lifetime.
   *
   * In order to support the structured data stream, PhetioObjects must end the messages in the correct
   * sequence, without being interrupted by dispose() calls.  Therefore, we do not clear out any of the state
   * related to the endEvent.  Note this means it is acceptable (and expected) for endEvent() to be called on
   * disposed PhetioObjects.
   */
  dispose() {
    // The phetioEvent stack should resolve by the next frame, so that's when we check it.
    if (assert && Tandem.PHET_IO_ENABLED && this.tandem.supplied) {
      const descendants = [];
      this.tandem.iterateDescendants(tandem => {
        if (phet.phetio.phetioEngine.hasPhetioObject(tandem.phetioID)) {
          descendants.push(phet.phetio.phetioEngine.getPhetioElement(tandem.phetioID));
        }
      });
      animationFrameTimer.runOnNextTick(() => {
        // Uninstrumented PhetioObjects don't have a phetioMessageStack attribute.
        assert && assert(!this.hasOwnProperty('phetioMessageStack') || this.phetioMessageStack.length === 0, 'phetioMessageStack should be clear');
        descendants.forEach(descendant => {
          assert && assert(descendant.isDisposed, `All descendants must be disposed by the next frame: ${descendant.tandem.phetioID}`);
        });
      });
    }
    if (ENABLE_DESCRIPTION_REGISTRY && this.tandem && this.tandem.supplied) {
      DescriptionRegistry.remove(this);
    }

    // Detach from listeners and dispose the corresponding tandem. This must happen in PhET-iO brand and PhET brand
    // because in PhET brand, PhetioDynamicElementContainer dynamic elements would memory leak tandems (parent tandems
    // would retain references to their children).
    this.tandem.removePhetioObject(this);

    // Dispose LinkedElements
    if (this.linkedElements) {
      this.linkedElements.forEach(linkedElement => linkedElement.dispose());
      this.linkedElements.length = 0;
    }
    super.dispose();
  }

  /**
   * JSONifiable metadata that describes the nature of the PhetioObject.  We must be able to read this
   * for baseline (before object fully constructed we use object) and after fully constructed
   * which includes overrides.
   * @param [object] - used to get metadata keys, can be a PhetioObject, or an options object
   *                          (see usage initializePhetioObject). If not provided, will instead use the value of "this"
   * @returns - metadata plucked from the passed in parameter
   */
  getMetadata(object) {
    object = object || this;
    const metadata = {
      phetioTypeName: object.phetioType.typeName,
      phetioDocumentation: object.phetioDocumentation,
      phetioState: object.phetioState,
      phetioReadOnly: object.phetioReadOnly,
      phetioEventType: EventType.phetioType.toStateObject(object.phetioEventType),
      phetioHighFrequency: object.phetioHighFrequency,
      phetioPlayback: object.phetioPlayback,
      phetioDynamicElement: object.phetioDynamicElement,
      phetioIsArchetype: object.phetioIsArchetype,
      phetioFeatured: object.phetioFeatured,
      phetioDesigned: object.phetioDesigned
    };
    if (object.phetioArchetypePhetioID) {
      metadata.phetioArchetypePhetioID = object.phetioArchetypePhetioID;
    }
    return metadata;
  }

  // Public facing documentation, no need to include metadata that may we don't want clients knowing about
  static METADATA_DOCUMENTATION = 'Get metadata about the PhET-iO Element. This includes the following keys:<ul>' + '<li><strong>phetioTypeName:</strong> The name of the PhET-iO Type\n</li>' + '<li><strong>phetioDocumentation:</strong> default - null. Useful notes about a PhET-iO Element, shown in the PhET-iO Studio Wrapper</li>' + '<li><strong>phetioState:</strong> default - true. When true, includes the PhET-iO Element in the PhET-iO state\n</li>' + '<li><strong>phetioReadOnly:</strong> default - false. When true, you can only get values from the PhET-iO Element; no setting allowed.\n</li>' + '<li><strong>phetioEventType:</strong> default - MODEL. The category of event that this element emits to the PhET-iO Data Stream.\n</li>' + '<li><strong>phetioDynamicElement:</strong> default - false. If this element is a "dynamic element" that can be created and destroyed throughout the lifetime of the sim (as opposed to existing forever).\n</li>' + '<li><strong>phetioIsArchetype:</strong> default - false. If this element is an archetype for a dynamic element.\n</li>' + '<li><strong>phetioFeatured:</strong> default - false. If this is a featured PhET-iO Element.\n</li>' + '<li><strong>phetioArchetypePhetioID:</strong> default - \'\'. If an applicable dynamic element, this is the phetioID of its archetype.\n</li></ul>';
  static create(options) {
    return new PhetioObject(options);
  }
}

// See documentation for addLinkedElement() to describe how to instrument LinkedElements. No other metadata is needed
// for LinkedElements, and should instead be provided to the coreElement. If you find a case where you want to pass
// another option through, please discuss with your friendly, neighborhood PhET-iO developer.

/**
 * Internal class to avoid cyclic dependencies.
 */
class LinkedElement extends PhetioObject {
  constructor(coreElement, providedOptions) {
    assert && assert(!!coreElement, 'coreElement should be defined');
    const options = optionize()({
      phetioType: LinkedElementIO,
      phetioState: true,
      // By default, LinkedElements are as featured as their coreElements are.
      phetioFeatured: coreElement.phetioFeatured
    }, providedOptions);

    // References cannot be changed by PhET-iO
    assert && assert(!options.hasOwnProperty('phetioReadOnly'), 'phetioReadOnly set by LinkedElement');
    options.phetioReadOnly = true;
    super(options);
    this.element = coreElement;
  }
}
tandemNamespace.register('PhetioObject', PhetioObject);
export { PhetioObject as default, LinkedElement };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhbmltYXRpb25GcmFtZVRpbWVyIiwidmFsaWRhdGUiLCJhcnJheVJlbW92ZSIsImFzc2VydE11dHVhbGx5RXhjbHVzaXZlT3B0aW9ucyIsIm1lcmdlIiwib3B0aW9uaXplIiwiY29tYmluZU9wdGlvbnMiLCJFdmVudFR5cGUiLCJMaW5rZWRFbGVtZW50SU8iLCJwaGV0aW9BUElWYWxpZGF0aW9uIiwiVGFuZGVtIiwiVGFuZGVtQ29uc3RhbnRzIiwidGFuZGVtTmFtZXNwYWNlIiwiSU9UeXBlIiwiRGlzcG9zYWJsZSIsIkRlc2NyaXB0aW9uUmVnaXN0cnkiLCJQSEVUX0lPX0VOQUJMRUQiLCJJT19UWVBFX1ZBTElEQVRPUiIsInZhbHVlVHlwZSIsInZhbGlkYXRpb25NZXNzYWdlIiwiQk9PTEVBTl9WQUxJREFUT1IiLCJQSEVUX0lPX0RPQ1VNRU5UQVRJT05fVkFMSURBVE9SIiwiaXNWYWxpZFZhbHVlIiwiZG9jIiwiaW5jbHVkZXMiLCJQSEVUX0lPX0VWRU5UX1RZUEVfVkFMSURBVE9SIiwiT0JKRUNUX1ZBTElEQVRPUiIsIk9iamVjdCIsIm9iamVjdFRvUGhldGlvSUQiLCJwaGV0aW9PYmplY3QiLCJ0YW5kZW0iLCJwaGV0aW9JRCIsIlNLSVBQSU5HX01FU1NBR0UiLCJFTkFCTEVfREVTQ1JJUFRJT05fUkVHSVNUUlkiLCJ3aW5kb3ciLCJwaGV0IiwiY2hpcHBlciIsInF1ZXJ5UGFyYW1ldGVycyIsInN1cHBvcnRzRGVzY3JpcHRpb25QbHVnaW4iLCJERUZBVUxUUyIsIk9QVElPTkFMIiwiZGVzY3JpcHRpb25UYW5kZW0iLCJwaGV0aW9UeXBlIiwiT2JqZWN0SU8iLCJwaGV0aW9Eb2N1bWVudGF0aW9uIiwiUEhFVF9JT19PQkpFQ1RfTUVUQURBVEFfREVGQVVMVFMiLCJwaGV0aW9TdGF0ZSIsInBoZXRpb1JlYWRPbmx5IiwicGhldGlvRXZlbnRUeXBlIiwiTU9ERUwiLCJwaGV0aW9IaWdoRnJlcXVlbmN5IiwicGhldGlvUGxheWJhY2siLCJwaGV0aW9GZWF0dXJlZCIsInBoZXRpb0R5bmFtaWNFbGVtZW50IiwicGhldGlvRGVzaWduZWQiLCJwaGV0aW9FdmVudE1ldGFkYXRhIiwidGFuZGVtTmFtZVN1ZmZpeCIsImFzc2VydCIsInRvU3RhdGVPYmplY3QiLCJQaGV0aW9PYmplY3QiLCJERUZBVUxUX09QVElPTlMiLCJjb25zdHJ1Y3RvciIsIm9wdGlvbnMiLCJwaGV0aW9PYmplY3RJbml0aWFsaXplZCIsImluaXRpYWxpemVQaGV0aW9PYmplY3QiLCJiYXNlT3B0aW9ucyIsInByb3ZpZGVkT3B0aW9ucyIsImhhc093blByb3BlcnR5IiwiaW5pdGlhbGl6ZURpc3Bvc2FibGUiLCJvbk1pc3NpbmdUYW5kZW0iLCJWQUxJREFUSU9OIiwicmVxdWlyZWQiLCJzdXBwbGllZCIsImFkZCIsImRlZmF1bHRzIiwibGlua2VkRWxlbWVudHMiLCJwaGV0aW9Jc0FyY2hldHlwZSIsInBoZXRpb0Jhc2VsaW5lTWV0YWRhdGEiLCJlbmFibGVkIiwicHJlbG9hZHMiLCJwaGV0aW8iLCJwaGV0aW9FbWl0QVBJQmFzZWxpbmUiLCJnZXRNZXRhZGF0YSIsInBoZXRpb0FyY2hldHlwZVBoZXRpb0lEIiwiYXJjaGV0eXBhbFBoZXRpb0lEIiwiZ2V0QXJjaGV0eXBhbFBoZXRpb0lEIiwicGhldGlvRWxlbWVudHNPdmVycmlkZXMiLCJvdmVycmlkZXMiLCJfcGhldGlvVHlwZSIsIl9waGV0aW9TdGF0ZSIsIl9waGV0aW9SZWFkT25seSIsIl9waGV0aW9Eb2N1bWVudGF0aW9uIiwiX3BoZXRpb0V2ZW50VHlwZSIsIl9waGV0aW9IaWdoRnJlcXVlbmN5IiwiX3BoZXRpb1BsYXliYWNrIiwiX3BoZXRpb0R5bmFtaWNFbGVtZW50IiwiX3BoZXRpb0ZlYXR1cmVkIiwiX3BoZXRpb0V2ZW50TWV0YWRhdGEiLCJfcGhldGlvRGVzaWduZWQiLCJwaGV0aW9Ob3RpZmllZE9iamVjdENyZWF0ZWQiLCJwaGV0aW9NZXNzYWdlU3RhY2siLCJwbGF5YmFjayIsImFkZFBoZXRpb09iamVjdCIsImlzUGhldGlvSW5zdHJ1bWVudGVkIiwic3VmZml4QXJyYXkiLCJBcnJheSIsImlzQXJyYXkiLCJtYXRjaGVzIiwiZmlsdGVyIiwic3VmZml4IiwibmFtZSIsImVuZHNXaXRoIiwic3dhcENhc2VPZkZpcnN0Q2hhcmFjdGVyIiwibGVuZ3RoIiwiam9pbiIsInN0cmluZyIsImZpcnN0Q2hhciIsIm5ld0ZpcnN0Q2hhciIsInRvTG93ZXJDYXNlIiwidG9VcHBlckNhc2UiLCJzdWJzdHJpbmciLCJwaGV0aW9TdGFydEV2ZW50IiwiZXZlbnQiLCJkYXRhIiwiZ2V0RGF0YSIsImFyZ3VtZW50cyIsIl8iLCJoYXNJbiIsInB1c2giLCJza2lwSGlnaEZyZXF1ZW5jeUV2ZW50IiwicGhldGlvRW1pdEhpZ2hGcmVxdWVuY3lFdmVudHMiLCJkYXRhU3RyZWFtIiwiaXNFbWl0dGluZ0xvd0ZyZXF1ZW5jeUV2ZW50Iiwic2tpcEZyb21VbmRlZmluZWREYXRhc3RyZWFtIiwiT1BUX09VVCIsInN0YXJ0IiwicHVzaE5vblBsYXliYWNrYWJsZSIsInBoZXRpb0VuZEV2ZW50IiwiYXNzZXJ0Q29ycmVjdEluZGljZXMiLCJ0b3BNZXNzYWdlSW5kZXgiLCJwb3AiLCJwb3BOb25QbGF5YmFja2FibGUiLCJlbmQiLCJwcm9wYWdhdGVEeW5hbWljRmxhZ3NUb0Rlc2NlbmRhbnRzIiwicGhldGlvRW5naW5lIiwidW5sYXVuY2hlZFBoZXRpb0lEcyIsImxhdW5jaGVkIiwiYnVmZmVyZWRQaGV0aW9PYmplY3RzIiwibWFwIiwiaXRlcmF0ZURlc2NlbmRhbnRzIiwiaGFzUGhldGlvT2JqZWN0IiwiZ2V0UGhldGlvRWxlbWVudCIsImluZGV4T2YiLCJzZXRQaGV0aW9EeW5hbWljRWxlbWVudCIsIm1hcmtEeW5hbWljRWxlbWVudEFyY2hldHlwZSIsImFkZExpbmtlZEVsZW1lbnQiLCJlbGVtZW50IiwidGFuZGVtTmFtZSIsImNyZWF0ZVRhbmRlbSIsIkxpbmtlZEVsZW1lbnQiLCJyZW1vdmVMaW5rZWRFbGVtZW50cyIsInBvdGVudGlhbGx5TGlua2VkRWxlbWVudCIsInRvUmVtb3ZlIiwibGlua2VkRWxlbWVudCIsImZvckVhY2giLCJkaXNwb3NlIiwib25TaW11bGF0aW9uQ29uc3RydWN0aW9uQ29tcGxldGVkIiwiZ2V0UGhldGlvTW91c2VIaXRUYXJnZXQiLCJmcm9tTGlua2luZyIsInBoZXRpb0VsZW1lbnRTZWxlY3Rpb25Qcm9wZXJ0eSIsInZhbHVlIiwiZ2V0Q29ycmVzcG9uZGluZ0xpbmtlZEVsZW1lbnQiLCJwYXJlbnRUYW5kZW0iLCJwYXJlbnQiLCJwaGV0aW9FbGVtZW50TWFwIiwibGlua2VkUGFyZW50RWxlbWVudCIsImdldFBoZXRpb01vdXNlSGl0VGFyZ2V0U2VsZiIsImlzUGhldGlvTW91c2VIaXRTZWxlY3RhYmxlIiwiZmVhdHVyZWRGaWx0ZXJDb3JyZWN0IiwicGhldGlvRWxlbWVudHNEaXNwbGF5UHJvcGVydHkiLCJpc0Rpc3BsYXllZEluRmVhdHVyZWRUcmVlIiwiZGlzcGxheWVkIiwiZGVzY2VuZGFudFRhbmRlbSIsImNoaWxkcmVuIiwia2V5cyIsImxpbmtlZENoaWxkcmVuIiwiY2hpbGROYW1lIiwiY2hpbGRQaGV0aW9JRCIsIlBoZXRpb0lEVXRpbHMiLCJhcHBlbmQiLCJsaW5rZWRUYW5kZW1OYW1lcyIsImdldENvbXBvbmVudE5hbWUiLCJsaW5rZWRDaGlsZCIsImRlc2NlbmRhbnRzIiwicnVuT25OZXh0VGljayIsImRlc2NlbmRhbnQiLCJpc0Rpc3Bvc2VkIiwicmVtb3ZlIiwicmVtb3ZlUGhldGlvT2JqZWN0Iiwib2JqZWN0IiwibWV0YWRhdGEiLCJwaGV0aW9UeXBlTmFtZSIsInR5cGVOYW1lIiwiTUVUQURBVEFfRE9DVU1FTlRBVElPTiIsImNyZWF0ZSIsImNvcmVFbGVtZW50IiwicmVnaXN0ZXIiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiUGhldGlvT2JqZWN0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEJhc2UgdHlwZSB0aGF0IHByb3ZpZGVzIFBoRVQtaU8gZmVhdHVyZXMuIEFuIGluc3RydW1lbnRlZCBQaGV0aW9PYmplY3QgaXMgcmVmZXJyZWQgdG8gb24gdGhlIHdyYXBwZXIgc2lkZS9kZXNpZ24gc2lkZVxyXG4gKiBhcyBhIFwiUGhFVC1pTyBFbGVtZW50XCIuICBOb3RlIHRoYXQgc2ltcyBtYXkgaGF2ZSBodW5kcmVkcyBvciB0aG91c2FuZHMgb2YgUGhldGlvT2JqZWN0cywgc28gcGVyZm9ybWFuY2UgYW5kIG1lbW9yeVxyXG4gKiBjb25zaWRlcmF0aW9ucyBhcmUgaW1wb3J0YW50LiAgRm9yIHRoaXMgcmVhc29uLCBpbml0aWFsaXplUGhldGlvT2JqZWN0IGlzIG9ubHkgY2FsbGVkIGluIFBoRVQtaU8gYnJhbmQsIHdoaWNoIG1lYW5zXHJcbiAqIG1hbnkgb2YgdGhlIGdldHRlcnMgc3VjaCBhcyBgcGhldGlvU3RhdGVgIGFuZCBgcGhldGlvRG9jdW1lbnRhdGlvbmAgd2lsbCBub3Qgd29yayBpbiBvdGhlciBicmFuZHMuIFdlIGhhdmUgb3B0ZWRcclxuICogdG8gaGF2ZSB0aGVzZSBnZXR0ZXJzIHRocm93IGFzc2VydGlvbiBlcnJvcnMgaW4gb3RoZXIgYnJhbmRzIHRvIGhlbHAgaWRlbnRpZnkgcHJvYmxlbXMgaWYgdGhlc2UgYXJlIGNhbGxlZFxyXG4gKiB1bmV4cGVjdGVkbHkuXHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgYW5pbWF0aW9uRnJhbWVUaW1lciBmcm9tICcuLi8uLi9heG9uL2pzL2FuaW1hdGlvbkZyYW1lVGltZXIuanMnO1xyXG5pbXBvcnQgU3RyaWN0T21pdCBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvU3RyaWN0T21pdC5qcyc7XHJcbmltcG9ydCB2YWxpZGF0ZSBmcm9tICcuLi8uLi9heG9uL2pzL3ZhbGlkYXRlLmpzJztcclxuaW1wb3J0IGFycmF5UmVtb3ZlIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9hcnJheVJlbW92ZS5qcyc7XHJcbmltcG9ydCBhc3NlcnRNdXR1YWxseUV4Y2x1c2l2ZU9wdGlvbnMgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL2Fzc2VydE11dHVhbGx5RXhjbHVzaXZlT3B0aW9ucy5qcyc7XHJcbmltcG9ydCBtZXJnZSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvbWVyZ2UuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplLCB7IGNvbWJpbmVPcHRpb25zLCBFbXB0eVNlbGZPcHRpb25zLCBPcHRpb25pemVEZWZhdWx0cyB9IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgRXZlbnRUeXBlIGZyb20gJy4vRXZlbnRUeXBlLmpzJztcclxuaW1wb3J0IExpbmtlZEVsZW1lbnRJTyBmcm9tICcuL0xpbmtlZEVsZW1lbnRJTy5qcyc7XHJcbmltcG9ydCBwaGV0aW9BUElWYWxpZGF0aW9uIGZyb20gJy4vcGhldGlvQVBJVmFsaWRhdGlvbi5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi9UYW5kZW0uanMnO1xyXG5pbXBvcnQgVGFuZGVtQ29uc3RhbnRzLCB7IFBoZXRpb0VsZW1lbnRNZXRhZGF0YSwgUGhldGlvSUQgfSBmcm9tICcuL1RhbmRlbUNvbnN0YW50cy5qcyc7XHJcbmltcG9ydCB0YW5kZW1OYW1lc3BhY2UgZnJvbSAnLi90YW5kZW1OYW1lc3BhY2UuanMnO1xyXG5pbXBvcnQgSU9UeXBlIGZyb20gJy4vdHlwZXMvSU9UeXBlLmpzJztcclxuaW1wb3J0IEludGVudGlvbmFsQW55IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9JbnRlbnRpb25hbEFueS5qcyc7XHJcbmltcG9ydCBEaXNwb3NhYmxlLCB7IERpc3Bvc2FibGVPcHRpb25zIH0gZnJvbSAnLi4vLi4vYXhvbi9qcy9EaXNwb3NhYmxlLmpzJztcclxuaW1wb3J0IERlc2NyaXB0aW9uUmVnaXN0cnkgZnJvbSAnLi9EZXNjcmlwdGlvblJlZ2lzdHJ5LmpzJztcclxuXHJcbi8vIGNvbnN0YW50c1xyXG5jb25zdCBQSEVUX0lPX0VOQUJMRUQgPSBUYW5kZW0uUEhFVF9JT19FTkFCTEVEO1xyXG5jb25zdCBJT19UWVBFX1ZBTElEQVRPUiA9IHsgdmFsdWVUeXBlOiBJT1R5cGUsIHZhbGlkYXRpb25NZXNzYWdlOiAncGhldGlvVHlwZSBtdXN0IGJlIGFuIElPVHlwZScgfTtcclxuY29uc3QgQk9PTEVBTl9WQUxJREFUT1IgPSB7IHZhbHVlVHlwZTogJ2Jvb2xlYW4nIH07XHJcblxyXG4vLyB1c2UgXCI8YnI+XCIgaW5zdGVhZCBvZiBuZXdsaW5lc1xyXG5jb25zdCBQSEVUX0lPX0RPQ1VNRU5UQVRJT05fVkFMSURBVE9SID0ge1xyXG4gIHZhbHVlVHlwZTogJ3N0cmluZycsXHJcbiAgaXNWYWxpZFZhbHVlOiAoIGRvYzogc3RyaW5nICkgPT4gIWRvYy5pbmNsdWRlcyggJ1xcbicgKSxcclxuICB2YWxpZGF0aW9uTWVzc2FnZTogJ3BoZXRpb0RvY3VtZW50YXRpb24gbXVzdCBiZSBwcm92aWRlZCBpbiB0aGUgcmlnaHQgZm9ybWF0J1xyXG59O1xyXG5jb25zdCBQSEVUX0lPX0VWRU5UX1RZUEVfVkFMSURBVE9SID0ge1xyXG4gIHZhbHVlVHlwZTogRXZlbnRUeXBlLFxyXG4gIHZhbGlkYXRpb25NZXNzYWdlOiAnaW52YWxpZCBwaGV0aW9FdmVudFR5cGUnXHJcbn07XHJcbmNvbnN0IE9CSkVDVF9WQUxJREFUT1IgPSB7IHZhbHVlVHlwZTogWyBPYmplY3QsIG51bGwgXSB9O1xyXG5cclxuY29uc3Qgb2JqZWN0VG9QaGV0aW9JRCA9ICggcGhldGlvT2JqZWN0OiBQaGV0aW9PYmplY3QgKSA9PiBwaGV0aW9PYmplY3QudGFuZGVtLnBoZXRpb0lEO1xyXG5cclxudHlwZSBTdGFydEV2ZW50T3B0aW9ucyA9IHtcclxuICBkYXRhPzogUmVjb3JkPHN0cmluZywgSW50ZW50aW9uYWxBbnk+IHwgbnVsbDtcclxuICBnZXREYXRhPzogKCAoKSA9PiBSZWNvcmQ8c3RyaW5nLCBJbnRlbnRpb25hbEFueT4gKSB8IG51bGw7XHJcbn07XHJcblxyXG4vLyBXaGVuIGFuIGV2ZW50IGlzIHN1cHByZXNzZWQgZnJvbSB0aGUgZGF0YSBzdHJlYW0sIHdlIGtlZXAgdHJhY2sgb2YgaXQgd2l0aCB0aGlzIHRva2VuLlxyXG5jb25zdCBTS0lQUElOR19NRVNTQUdFID0gLTE7XHJcblxyXG5jb25zdCBFTkFCTEVfREVTQ1JJUFRJT05fUkVHSVNUUlkgPSAhIXdpbmRvdy5waGV0Py5jaGlwcGVyPy5xdWVyeVBhcmFtZXRlcnM/LnN1cHBvcnRzRGVzY3JpcHRpb25QbHVnaW47XHJcblxyXG5jb25zdCBERUZBVUxUUzogT3B0aW9uaXplRGVmYXVsdHM8U3RyaWN0T21pdDxTZWxmT3B0aW9ucywgJ3BoZXRpb0R5bmFtaWNFbGVtZW50TmFtZSc+PiA9IHtcclxuXHJcbiAgLy8gU3VidHlwZXMgY2FuIHVzZSBgVGFuZGVtLlJFUVVJUkVEYCB0byByZXF1aXJlIGEgbmFtZWQgdGFuZGVtIHBhc3NlZCBpblxyXG4gIHRhbmRlbTogVGFuZGVtLk9QVElPTkFMLFxyXG5cclxuICAvLyBEZWZpbmVzIGRlc2NyaXB0aW9uLXNwZWNpZmljIHRhbmRlbXMgdGhhdCBkbyBOT1QgYWZmZWN0IHRoZSBwaGV0LWlvIHN5c3RlbS5cclxuICBkZXNjcmlwdGlvblRhbmRlbTogVGFuZGVtLk9QVElPTkFMLFxyXG5cclxuICAvLyBEZWZpbmVzIEFQSSBtZXRob2RzLCBldmVudHMgYW5kIHNlcmlhbGl6YXRpb25cclxuICBwaGV0aW9UeXBlOiBJT1R5cGUuT2JqZWN0SU8sXHJcblxyXG4gIC8vIFVzZWZ1bCBub3RlcyBhYm91dCBhbiBpbnN0cnVtZW50ZWQgUGhldGlvT2JqZWN0LCBzaG93biBpbiB0aGUgUGhFVC1pTyBTdHVkaW8gV3JhcHBlci4gSXQncyBhbiBodG1sXHJcbiAgLy8gc3RyaW5nLCBzbyBcIjxicj5cIiB0YWdzIGFyZSByZXF1aXJlZCBpbnN0ZWFkIG9mIFwiXFxuXCIgY2hhcmFjdGVycyBmb3IgcHJvcGVyIHJlbmRlcmluZyBpbiBTdHVkaW9cclxuICBwaGV0aW9Eb2N1bWVudGF0aW9uOiBUYW5kZW1Db25zdGFudHMuUEhFVF9JT19PQkpFQ1RfTUVUQURBVEFfREVGQVVMVFMucGhldGlvRG9jdW1lbnRhdGlvbixcclxuXHJcbiAgLy8gV2hlbiB0cnVlLCBpbmNsdWRlcyB0aGUgUGhldGlvT2JqZWN0IGluIHRoZSBQaEVULWlPIHN0YXRlIChub3QgYXV0b21hdGljYWxseSByZWN1cnNpdmUsIG11c3QgYmUgc3BlY2lmaWVkIGZvclxyXG4gIC8vIGNoaWxkcmVuIGV4cGxpY2l0bHkpXHJcbiAgcGhldGlvU3RhdGU6IFRhbmRlbUNvbnN0YW50cy5QSEVUX0lPX09CSkVDVF9NRVRBREFUQV9ERUZBVUxUUy5waGV0aW9TdGF0ZSxcclxuXHJcbiAgLy8gVGhpcyBvcHRpb24gY29udHJvbHMgaG93IFBoRVQtaU8gd3JhcHBlcnMgY2FuIGludGVyZmFjZSB3aXRoIHRoaXMgUGhldGlvT2JqZWN0LiBQcmVkb21pbmF0ZWx5IHRoaXMgb2NjdXJzIHZpYVxyXG4gIC8vIHB1YmxpYyBtZXRob2RzIGRlZmluZWQgb24gdGhpcyBQaGV0aW9PYmplY3QncyBwaGV0aW9UeXBlLCBpbiB3aGljaCBzb21lIG1ldGhvZCBhcmUgbm90IGV4ZWN1dGFibGUgd2hlbiB0aGlzIGZsYWdcclxuICAvLyBpcyB0cnVlLiBTZWUgYE9iamVjdElPLm1ldGhvZHNgIGZvciBmdXJ0aGVyIGRvY3VtZW50YXRpb24sIGVzcGVjaWFsbHkgcmVnYXJkaW5nIGBpbnZvY2FibGVGb3JSZWFkT25seUVsZW1lbnRzYC5cclxuICAvLyBOT1RFOiBQaGV0aW9PYmplY3RzIHdpdGgge3BoZXRpb1N0YXRlOiB0cnVlfSBBTkQge3BoZXRpb1JlYWRPbmx5OiB0cnVlfSBhcmUgcmVzdG9yZWQgZHVyaW5nIHZpYSBzZXRTdGF0ZS5cclxuICBwaGV0aW9SZWFkT25seTogVGFuZGVtQ29uc3RhbnRzLlBIRVRfSU9fT0JKRUNUX01FVEFEQVRBX0RFRkFVTFRTLnBoZXRpb1JlYWRPbmx5LFxyXG5cclxuICAvLyBDYXRlZ29yeSBvZiBldmVudCB0eXBlLCBjYW4gYmUgb3ZlcnJpZGRlbiBpbiBwaGV0aW9TdGFydEV2ZW50IG9wdGlvbnMuICBDYW5ub3QgYmUgc3VwcGxpZWQgdGhyb3VnaCBUYW5kZW1Db25zdGFudHMgYmVjYXVzZVxyXG4gIC8vIHRoYXQgd291bGQgY3JlYXRlIGFuIGltcG9ydCBsb29wXHJcbiAgcGhldGlvRXZlbnRUeXBlOiBFdmVudFR5cGUuTU9ERUwsXHJcblxyXG4gIC8vIEhpZ2ggZnJlcXVlbmN5IGV2ZW50cyBzdWNoIGFzIG1vdXNlIG1vdmVzIGNhbiBiZSBvbWl0dGVkIGZyb20gZGF0YSBzdHJlYW0sIHNlZSA/cGhldGlvRW1pdEhpZ2hGcmVxdWVuY3lFdmVudHNcclxuICAvLyBhbmQgUGhldGlvQ2xpZW50LmxhdW5jaFNpbXVsYXRpb24gb3B0aW9uXHJcbiAgLy8gQGRlcHJlY2F0ZWQgLSBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXQtaW8vaXNzdWVzLzE2MjkjaXNzdWVjb21tZW50LTYwODAwMjQxMFxyXG4gIHBoZXRpb0hpZ2hGcmVxdWVuY3k6IFRhbmRlbUNvbnN0YW50cy5QSEVUX0lPX09CSkVDVF9NRVRBREFUQV9ERUZBVUxUUy5waGV0aW9IaWdoRnJlcXVlbmN5LFxyXG5cclxuICAvLyBXaGVuIHRydWUsIGVtaXRzIGV2ZW50cyBmb3IgZGF0YSBzdHJlYW1zIGZvciBwbGF5YmFjaywgc2VlIGhhbmRsZVBsYXliYWNrRXZlbnQuanNcclxuICBwaGV0aW9QbGF5YmFjazogVGFuZGVtQ29uc3RhbnRzLlBIRVRfSU9fT0JKRUNUX01FVEFEQVRBX0RFRkFVTFRTLnBoZXRpb1BsYXliYWNrLFxyXG5cclxuICAvLyBXaGVuIHRydWUsIHRoaXMgaXMgY2F0ZWdvcml6ZWQgYXMgYW4gaW1wb3J0YW50IFwiZmVhdHVyZWRcIiBlbGVtZW50IGluIFN0dWRpby5cclxuICBwaGV0aW9GZWF0dXJlZDogVGFuZGVtQ29uc3RhbnRzLlBIRVRfSU9fT0JKRUNUX01FVEFEQVRBX0RFRkFVTFRTLnBoZXRpb0ZlYXR1cmVkLFxyXG5cclxuICAvLyBpbmRpY2F0ZXMgdGhhdCBhbiBvYmplY3QgbWF5IG9yIG1heSBub3QgaGF2ZSBiZWVuIGNyZWF0ZWQuIEFwcGxpZXMgcmVjdXJzaXZlbHkgYXV0b21hdGljYWxseVxyXG4gIC8vIGFuZCBzaG91bGQgb25seSBiZSBzZXQgbWFudWFsbHkgb24gdGhlIHJvb3QgZHluYW1pYyBlbGVtZW50LiBEeW5hbWljIGFyY2hldHlwZXMgd2lsbCBoYXZlIHRoaXMgb3ZlcndyaXR0ZW4gdG9cclxuICAvLyBmYWxzZSBldmVuIGlmIGV4cGxpY2l0bHkgcHJvdmlkZWQgYXMgdHJ1ZSwgYXMgYXJjaGV0eXBlcyBjYW5ub3QgYmUgZHluYW1pYy5cclxuICBwaGV0aW9EeW5hbWljRWxlbWVudDogVGFuZGVtQ29uc3RhbnRzLlBIRVRfSU9fT0JKRUNUX01FVEFEQVRBX0RFRkFVTFRTLnBoZXRpb0R5bmFtaWNFbGVtZW50LFxyXG5cclxuICAvLyBNYXJraW5nIHBoZXRpb0Rlc2lnbmVkOiB0cnVlIG9wdHMtaW4gdG8gQVBJIGNoYW5nZSBkZXRlY3Rpb24gdG9vbGluZyB0aGF0IGNhbiBiZSB1c2VkIHRvIGNhdGNoIGluYWR2ZXJ0ZW50XHJcbiAgLy8gY2hhbmdlcyB0byBhIGRlc2lnbmVkIEFQSS4gIEEgcGhldGlvRGVzaWduZWQ6dHJ1ZSBQaGV0aW9PYmplY3QgKG9yIGFueSBvZiBpdHMgdGFuZGVtIGRlc2NlbmRhbnRzKSB3aWxsIHRocm93XHJcbiAgLy8gYXNzZXJ0aW9uIGVycm9ycyBvbiBDVCAob3Igd2hlbiBydW5uaW5nIHdpdGggP3BoZXRpb0NvbXBhcmVBUEkpIHdoZW4gdGhlIGZvbGxvd2luZyBhcmUgdHJ1ZTpcclxuICAvLyAoYSkgaXRzIHBhY2thZ2UuanNvbiBsaXN0cyBjb21wYXJlRGVzaWduZWRBUElDaGFuZ2VzOnRydWUgaW4gdGhlIFwicGhldC1pb1wiIHNlY3Rpb25cclxuICAvLyAoYikgdGhlIHNpbXVsYXRpb24gaXMgbGlzdGVkIGluIHBlcmVubmlhbC9kYXRhL3BoZXQtaW8tYXBpLXN0YWJsZVxyXG4gIC8vIChjKSBhbnkgb2YgaXRzIG1ldGFkYXRhIHZhbHVlcyBkZXZpYXRlIGZyb20gdGhlIHJlZmVyZW5jZSBBUElcclxuICBwaGV0aW9EZXNpZ25lZDogVGFuZGVtQ29uc3RhbnRzLlBIRVRfSU9fT0JKRUNUX01FVEFEQVRBX0RFRkFVTFRTLnBoZXRpb0Rlc2lnbmVkLFxyXG5cclxuICAvLyBkZWxpdmVyZWQgd2l0aCBlYWNoIGV2ZW50LCBpZiBzcGVjaWZpZWQuIHBoZXRpb1BsYXliYWNrIGlzIGFwcGVuZGVkIGhlcmUsIGlmIHRydWUuXHJcbiAgLy8gTm90ZTogdW5saWtlIG90aGVyIG9wdGlvbnMsIHRoaXMgb3B0aW9uIGNhbiBiZSBtdXRhdGVkIGRvd25zdHJlYW0sIGFuZCBoZW5jZSBzaG91bGQgYmUgY3JlYXRlZCBuZXdseSBmb3IgZWFjaCBpbnN0YW5jZS5cclxuICBwaGV0aW9FdmVudE1ldGFkYXRhOiBudWxsLFxyXG5cclxuICAvLyBudWxsIG1lYW5zIG5vIGNvbnN0cmFpbnQgb24gdGFuZGVtIG5hbWUuXHJcbiAgdGFuZGVtTmFtZVN1ZmZpeDogbnVsbFxyXG59O1xyXG5cclxuLy8gSWYgeW91IHJ1biBpbnRvIGEgdHlwZSBlcnJvciBoZXJlLCBmZWVsIGZyZWUgdG8gYWRkIGFueSB0eXBlIHRoYXQgaXMgc3VwcG9ydGVkIGJ5IHRoZSBicm93c2VycyBcInN0cnVjdHVyZWQgY2xvbmluZyBhbGdvcml0aG1cIiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2ViX1dvcmtlcnNfQVBJL1N0cnVjdHVyZWRfY2xvbmVfYWxnb3JpdGhtXHJcbnR5cGUgRXZlbnRNZXRhZGF0YSA9IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IGJvb2xlYW4gfCBudW1iZXIgfCBBcnJheTxzdHJpbmcgfCBib29sZWFuIHwgbnVtYmVyPj47XHJcblxyXG5hc3NlcnQgJiYgYXNzZXJ0KCBFdmVudFR5cGUucGhldGlvVHlwZS50b1N0YXRlT2JqZWN0KCBERUZBVUxUUy5waGV0aW9FdmVudFR5cGUgKSA9PT0gVGFuZGVtQ29uc3RhbnRzLlBIRVRfSU9fT0JKRUNUX01FVEFEQVRBX0RFRkFVTFRTLnBoZXRpb0V2ZW50VHlwZSxcclxuICAncGhldGlvRXZlbnRUeXBlIG11c3QgaGF2ZSB0aGUgc2FtZSBkZWZhdWx0IGFzIHRoZSBkZWZhdWx0IG1ldGFkYXRhIHZhbHVlcy4nICk7XHJcblxyXG4vLyBPcHRpb25zIGZvciBjcmVhdGluZyBhIFBoZXRpb09iamVjdFxyXG50eXBlIFNlbGZPcHRpb25zID0gU3RyaWN0T21pdDxQYXJ0aWFsPFBoZXRpb0VsZW1lbnRNZXRhZGF0YT4sICdwaGV0aW9UeXBlTmFtZScgfCAncGhldGlvQXJjaGV0eXBlUGhldGlvSUQnIHxcclxuICAncGhldGlvSXNBcmNoZXR5cGUnIHwgJ3BoZXRpb0V2ZW50VHlwZSc+ICYge1xyXG5cclxuICAvLyBUaGlzIGlzIHRoZSBvbmx5IHBsYWNlIGluIHRoZSBwcm9qZWN0IHdoZXJlIHRoaXMgaXMgYWxsb3dlZFxyXG4gIHRhbmRlbT86IFRhbmRlbTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBiYWQtc2ltLXRleHRcclxuICBkZXNjcmlwdGlvblRhbmRlbT86IFRhbmRlbTtcclxuICBwaGV0aW9UeXBlPzogSU9UeXBlO1xyXG4gIHBoZXRpb0V2ZW50VHlwZT86IEV2ZW50VHlwZTtcclxuICBwaGV0aW9FdmVudE1ldGFkYXRhPzogRXZlbnRNZXRhZGF0YSB8IG51bGw7XHJcblxyXG4gIC8vIFRoZSBlbGVtZW50J3MgdGFuZGVtIG5hbWUgbXVzdCBoYXZlIGEgc3BlY2lmaWVkIHN1ZmZpeC4gVGhpcyBpcyB0byBlbmZvcmNlIG5hbWluZyBjb252ZW50aW9ucyBmb3IgUGhFVC1pTy5cclxuICAvLyBJZiBzdHJpbmdbXSBpcyBwcm92aWRlZCwgdGhlIHRhbmRlbSBuYW1lIG11c3QgaGF2ZSBhIHN1ZmZpeCB0aGF0IG1hdGNoZXMgb25lIG9mIHRoZSBzdHJpbmdzIGluIHRoZSBhcnJheS5cclxuICAvLyBudWxsIG1lYW5zIHRoYXQgdGhlcmUgaXMgbm8gY29uc3RyYWludCBvbiB0YW5kZW0gbmFtZS4gVGhlIGZpcnN0IGNoYXJhY3RlciBpcyBub3QgY2FzZS1zZW5zaXRpdmUsIHRvIHN1cHBvcnRcclxuICAvLyB1c2VzIGxpa2UgJ3RoZXJtb21ldGVyTm9kZScgdmVyc3VzICd1cHBlclRoZXJtb21ldGVyTm9kZScuXHJcbiAgdGFuZGVtTmFtZVN1ZmZpeD86IHN0cmluZyB8IHN0cmluZ1tdIHwgbnVsbDtcclxufTtcclxuZXhwb3J0IHR5cGUgUGhldGlvT2JqZWN0T3B0aW9ucyA9IFNlbGZPcHRpb25zICYgRGlzcG9zYWJsZU9wdGlvbnM7XHJcblxyXG50eXBlIFBoZXRpb09iamVjdE1ldGFkYXRhS2V5cyA9IGtleW9mICggU3RyaWN0T21pdDxQaGV0aW9FbGVtZW50TWV0YWRhdGEsICdwaGV0aW9UeXBlTmFtZScgfCAncGhldGlvRHluYW1pY0VsZW1lbnROYW1lJz4gKSB8ICdwaGV0aW9UeXBlJztcclxuXHJcbi8vIEEgdHlwZSB0aGF0IGlzIHVzZWQgZm9yIHRoZSBzdHJ1Y3R1cmFsIHR5cGluZyB3aGVuIGdhdGhlcmluZyBtZXRhZGF0YS4gV2UganVzdCBuZWVkIGEgXCJQaGV0aW9PYmplY3QtbGlrZVwiIGVudGl0eVxyXG4vLyB0byBwdWxsIHRoZSBBUEkgbWV0YWRhdGEgZnJvbS4gVGh1cywgdGhpcyBpcyB0aGUgXCJpbnB1dFwiIHRvIGxvZ2ljIHRoYXQgd291bGQgcHVsbCB0aGUgbWV0YWRhdGEga2V5cyBpbnRvIGFuIG9iamVjdFxyXG4vLyBmb3IgdGhlIFBoZXRpb0FQSS5cclxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHBoZXQtaW8tb2JqZWN0LW9wdGlvbnMtc2hvdWxkLW5vdC1waWNrLWZyb20tcGhldC1pby1vYmplY3RcclxuZXhwb3J0IHR5cGUgUGhldGlvT2JqZWN0TWV0YWRhdGFJbnB1dCA9IFBpY2s8UGhldGlvT2JqZWN0LCBQaGV0aW9PYmplY3RNZXRhZGF0YUtleXM+O1xyXG5cclxuY2xhc3MgUGhldGlvT2JqZWN0IGV4dGVuZHMgRGlzcG9zYWJsZSB7XHJcblxyXG4gIC8vIGFzc2lnbmVkIGluIGluaXRpYWxpemVQaGV0aW9PYmplY3QgLSBzZWUgZG9jcyBhdCBERUZBVUxUUyBkZWNsYXJhdGlvblxyXG4gIHB1YmxpYyB0YW5kZW06IFRhbmRlbTtcclxuXHJcbiAgLy8gdHJhY2sgd2hldGhlciB0aGUgb2JqZWN0IGhhcyBiZWVuIGluaXRpYWxpemVkLiAgVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBpbml0aWFsaXphdGlvbiBjYW4gaGFwcGVuIGluIHRoZVxyXG4gIC8vIGNvbnN0cnVjdG9yIG9yIGluIGEgc3Vic2VxdWVudCBjYWxsIHRvIGluaXRpYWxpemVQaGV0aW9PYmplY3QgKHRvIHN1cHBvcnQgc2NlbmVyeSBOb2RlKVxyXG4gIHByaXZhdGUgcGhldGlvT2JqZWN0SW5pdGlhbGl6ZWQ6IGJvb2xlYW47XHJcblxyXG4gIC8vIFNlZSBkb2N1bWVudGF0aW9uIGluIERFRkFVTFRTXHJcbiAgcHVibGljIHBoZXRpb0lzQXJjaGV0eXBlITogYm9vbGVhbjtcclxuICBwdWJsaWMgcGhldGlvQmFzZWxpbmVNZXRhZGF0YSE6IFBoZXRpb0VsZW1lbnRNZXRhZGF0YSB8IG51bGw7XHJcbiAgcHJpdmF0ZSBfcGhldGlvVHlwZSE6IElPVHlwZTtcclxuICBwcml2YXRlIF9waGV0aW9TdGF0ZSE6IGJvb2xlYW47XHJcbiAgcHJpdmF0ZSBfcGhldGlvUmVhZE9ubHkhOiBib29sZWFuO1xyXG4gIHByaXZhdGUgX3BoZXRpb0RvY3VtZW50YXRpb24hOiBzdHJpbmc7XHJcbiAgcHJpdmF0ZSBfcGhldGlvRXZlbnRUeXBlITogRXZlbnRUeXBlO1xyXG4gIHByaXZhdGUgX3BoZXRpb0hpZ2hGcmVxdWVuY3khOiBib29sZWFuO1xyXG4gIHByaXZhdGUgX3BoZXRpb1BsYXliYWNrITogYm9vbGVhbjtcclxuICBwcml2YXRlIF9waGV0aW9EeW5hbWljRWxlbWVudCE6IGJvb2xlYW47XHJcbiAgcHJpdmF0ZSBfcGhldGlvRmVhdHVyZWQhOiBib29sZWFuO1xyXG4gIHByaXZhdGUgX3BoZXRpb0V2ZW50TWV0YWRhdGEhOiBFdmVudE1ldGFkYXRhIHwgbnVsbDtcclxuICBwcml2YXRlIF9waGV0aW9EZXNpZ25lZCE6IGJvb2xlYW47XHJcblxyXG4gIC8vIFB1YmxpYyBvbmx5IGZvciBQaGV0aW9PYmplY3RNZXRhZGF0YUlucHV0XHJcbiAgcHVibGljIHBoZXRpb0FyY2hldHlwZVBoZXRpb0lEITogc3RyaW5nIHwgbnVsbDtcclxuICBwcml2YXRlIGxpbmtlZEVsZW1lbnRzITogTGlua2VkRWxlbWVudFtdIHwgbnVsbDtcclxuICBwdWJsaWMgcGhldGlvTm90aWZpZWRPYmplY3RDcmVhdGVkITogYm9vbGVhbjtcclxuICBwcml2YXRlIHBoZXRpb01lc3NhZ2VTdGFjayE6IG51bWJlcltdO1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9PUFRJT05TID0gREVGQVVMVFM7XHJcbiAgcHVibGljIHBoZXRpb0lEOiBQaGV0aW9JRDtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBvcHRpb25zPzogUGhldGlvT2JqZWN0T3B0aW9ucyApIHtcclxuICAgIHN1cGVyKCk7XHJcblxyXG4gICAgdGhpcy50YW5kZW0gPSBERUZBVUxUUy50YW5kZW07XHJcbiAgICB0aGlzLnBoZXRpb0lEID0gdGhpcy50YW5kZW0ucGhldGlvSUQ7XHJcbiAgICB0aGlzLnBoZXRpb09iamVjdEluaXRpYWxpemVkID0gZmFsc2U7XHJcblxyXG4gICAgaWYgKCBvcHRpb25zICkge1xyXG4gICAgICB0aGlzLmluaXRpYWxpemVQaGV0aW9PYmplY3QoIHt9LCBvcHRpb25zICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBMaWtlIFNDRU5FUlkvTm9kZSwgUGhldGlvT2JqZWN0IGNhbiBiZSBjb25maWd1cmVkIGR1cmluZyBjb25zdHJ1Y3Rpb24gb3IgbGF0ZXIgd2l0aCBhIG11dGF0ZSBjYWxsLlxyXG4gICAqIE5vb3AgaWYgcHJvdmlkZWQgb3B0aW9ucyBrZXlzIGRvbid0IGludGVyc2VjdCB3aXRoIGFueSBrZXkgaW4gREVGQVVMVFM7IGJhc2VPcHRpb25zIGFyZSBpZ25vcmVkIGZvciB0aGlzIGNhbGN1bGF0aW9uLlxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBpbml0aWFsaXplUGhldGlvT2JqZWN0KCBiYXNlT3B0aW9uczogUGFydGlhbDxQaGV0aW9PYmplY3RPcHRpb25zPiwgcHJvdmlkZWRPcHRpb25zOiBQaGV0aW9PYmplY3RPcHRpb25zICk6IHZvaWQge1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFiYXNlT3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSggJ2lzRGlzcG9zYWJsZScgKSwgJ2Jhc2VPcHRpb25zIHNob3VsZCBub3QgY29udGFpbiBpc0Rpc3Bvc2FibGUnICk7XHJcbiAgICB0aGlzLmluaXRpYWxpemVEaXNwb3NhYmxlKCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBwcm92aWRlZE9wdGlvbnMsICdpbml0aWFsaXplUGhldGlvT2JqZWN0IG11c3QgYmUgY2FsbGVkIHdpdGggcHJvdmlkZWRPcHRpb25zJyApO1xyXG5cclxuICAgIC8vIGNhbGwgYmVmb3JlIHdlIGV4aXQgZWFybHkgdG8gc3VwcG9ydCBsb2dnaW5nIHVuc3VwcGxpZWQgVGFuZGVtcy5cclxuICAgIHByb3ZpZGVkT3B0aW9ucy50YW5kZW0gJiYgVGFuZGVtLm9uTWlzc2luZ1RhbmRlbSggcHJvdmlkZWRPcHRpb25zLnRhbmRlbSApO1xyXG5cclxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IHJlcXVpcmVkIHRhbmRlbXMgYXJlIHN1cHBsaWVkXHJcbiAgICBpZiAoIGFzc2VydCAmJiBUYW5kZW0uVkFMSURBVElPTiAmJiBwcm92aWRlZE9wdGlvbnMudGFuZGVtICYmIHByb3ZpZGVkT3B0aW9ucy50YW5kZW0ucmVxdWlyZWQgKSB7XHJcbiAgICAgIGFzc2VydCggcHJvdmlkZWRPcHRpb25zLnRhbmRlbS5zdXBwbGllZCwgJ3JlcXVpcmVkIHRhbmRlbXMgbXVzdCBiZSBzdXBwbGllZCcgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIEVOQUJMRV9ERVNDUklQVElPTl9SRUdJU1RSWSAmJiBwcm92aWRlZE9wdGlvbnMudGFuZGVtICYmIHByb3ZpZGVkT3B0aW9ucy50YW5kZW0uc3VwcGxpZWQgKSB7XHJcbiAgICAgIERlc2NyaXB0aW9uUmVnaXN0cnkuYWRkKCBwcm92aWRlZE9wdGlvbnMudGFuZGVtLCB0aGlzICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVGhlIHByZXNlbmNlIG9mIGB0YW5kZW1gIGluZGljYXRlcyBpZiB0aGlzIFBoZXRpb09iamVjdCBjYW4gYmUgaW5pdGlhbGl6ZWQuIElmIG5vdCB5ZXQgaW5pdGlhbGl6ZWQsIHBlcmhhcHNcclxuICAgIC8vIGl0IHdpbGwgYmUgaW5pdGlhbGl6ZWQgbGF0ZXIgb24sIGFzIGluIE5vZGUubXV0YXRlKCkuXHJcbiAgICBpZiAoICEoIFBIRVRfSU9fRU5BQkxFRCAmJiBwcm92aWRlZE9wdGlvbnMudGFuZGVtICYmIHByb3ZpZGVkT3B0aW9ucy50YW5kZW0uc3VwcGxpZWQgKSApIHtcclxuXHJcbiAgICAgIC8vIEluIHRoaXMgY2FzZSwgdGhlIFBoZXRpb09iamVjdCBpcyBub3QgaW5pdGlhbGl6ZWQsIGJ1dCBzdGlsbCBzZXQgdGFuZGVtIHRvIG1haW50YWluIGEgY29uc2lzdGVudCBBUEkgZm9yXHJcbiAgICAgIC8vIGNyZWF0aW5nIHRoZSBUYW5kZW0gdHJlZS5cclxuICAgICAgaWYgKCBwcm92aWRlZE9wdGlvbnMudGFuZGVtICkge1xyXG4gICAgICAgIHRoaXMudGFuZGVtID0gcHJvdmlkZWRPcHRpb25zLnRhbmRlbTtcclxuICAgICAgICB0aGlzLnBoZXRpb0lEID0gdGhpcy50YW5kZW0ucGhldGlvSUQ7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLnBoZXRpb09iamVjdEluaXRpYWxpemVkLCAnY2Fubm90IGluaXRpYWxpemUgdHdpY2UnICk7XHJcblxyXG4gICAgLy8gR3VhcmQgdmFsaWRhdGlvbiBvbiBhc3NlcnQgdG8gYXZvaWQgY2FsbGluZyBhIGxhcmdlIG51bWJlciBvZiBuby1vcHMgd2hlbiBhc3NlcnRpb25zIGFyZSBkaXNhYmxlZCwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy90YW5kZW0vaXNzdWVzLzIwMFxyXG4gICAgYXNzZXJ0ICYmIHZhbGlkYXRlKCBwcm92aWRlZE9wdGlvbnMudGFuZGVtLCB7IHZhbHVlVHlwZTogVGFuZGVtIH0gKTtcclxuXHJcbiAgICBjb25zdCBkZWZhdWx0cyA9IGNvbWJpbmVPcHRpb25zPE9wdGlvbml6ZURlZmF1bHRzPFBoZXRpb09iamVjdE9wdGlvbnM+Pigge30sIERFRkFVTFRTLCBiYXNlT3B0aW9ucyApO1xyXG5cclxuICAgIGxldCBvcHRpb25zID0gb3B0aW9uaXplPFBoZXRpb09iamVjdE9wdGlvbnM+KCkoIGRlZmF1bHRzLCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyB2YWxpZGF0ZSBvcHRpb25zIGJlZm9yZSBhc3NpZ25pbmcgdG8gcHJvcGVydGllc1xyXG4gICAgYXNzZXJ0ICYmIHZhbGlkYXRlKCBvcHRpb25zLnBoZXRpb1R5cGUsIElPX1RZUEVfVkFMSURBVE9SICk7XHJcbiAgICBhc3NlcnQgJiYgdmFsaWRhdGUoIG9wdGlvbnMucGhldGlvU3RhdGUsIG1lcmdlKCB7fSwgQk9PTEVBTl9WQUxJREFUT1IsIHsgdmFsaWRhdGlvbk1lc3NhZ2U6ICdwaGV0aW9TdGF0ZSBtdXN0IGJlIGEgYm9vbGVhbicgfSApICk7XHJcbiAgICBhc3NlcnQgJiYgdmFsaWRhdGUoIG9wdGlvbnMucGhldGlvUmVhZE9ubHksIG1lcmdlKCB7fSwgQk9PTEVBTl9WQUxJREFUT1IsIHsgdmFsaWRhdGlvbk1lc3NhZ2U6ICdwaGV0aW9SZWFkT25seSBtdXN0IGJlIGEgYm9vbGVhbicgfSApICk7XHJcbiAgICBhc3NlcnQgJiYgdmFsaWRhdGUoIG9wdGlvbnMucGhldGlvRXZlbnRUeXBlLCBQSEVUX0lPX0VWRU5UX1RZUEVfVkFMSURBVE9SICk7XHJcbiAgICBhc3NlcnQgJiYgdmFsaWRhdGUoIG9wdGlvbnMucGhldGlvRG9jdW1lbnRhdGlvbiwgUEhFVF9JT19ET0NVTUVOVEFUSU9OX1ZBTElEQVRPUiApO1xyXG4gICAgYXNzZXJ0ICYmIHZhbGlkYXRlKCBvcHRpb25zLnBoZXRpb0hpZ2hGcmVxdWVuY3ksIG1lcmdlKCB7fSwgQk9PTEVBTl9WQUxJREFUT1IsIHsgdmFsaWRhdGlvbk1lc3NhZ2U6ICdwaGV0aW9IaWdoRnJlcXVlbmN5IG11c3QgYmUgYSBib29sZWFuJyB9ICkgKTtcclxuICAgIGFzc2VydCAmJiB2YWxpZGF0ZSggb3B0aW9ucy5waGV0aW9QbGF5YmFjaywgbWVyZ2UoIHt9LCBCT09MRUFOX1ZBTElEQVRPUiwgeyB2YWxpZGF0aW9uTWVzc2FnZTogJ3BoZXRpb1BsYXliYWNrIG11c3QgYmUgYSBib29sZWFuJyB9ICkgKTtcclxuICAgIGFzc2VydCAmJiB2YWxpZGF0ZSggb3B0aW9ucy5waGV0aW9GZWF0dXJlZCwgbWVyZ2UoIHt9LCBCT09MRUFOX1ZBTElEQVRPUiwgeyB2YWxpZGF0aW9uTWVzc2FnZTogJ3BoZXRpb0ZlYXR1cmVkIG11c3QgYmUgYSBib29sZWFuJyB9ICkgKTtcclxuICAgIGFzc2VydCAmJiB2YWxpZGF0ZSggb3B0aW9ucy5waGV0aW9FdmVudE1ldGFkYXRhLCBtZXJnZSgge30sIE9CSkVDVF9WQUxJREFUT1IsIHsgdmFsaWRhdGlvbk1lc3NhZ2U6ICdvYmplY3QgbGl0ZXJhbCBleHBlY3RlZCcgfSApICk7XHJcbiAgICBhc3NlcnQgJiYgdmFsaWRhdGUoIG9wdGlvbnMucGhldGlvRHluYW1pY0VsZW1lbnQsIG1lcmdlKCB7fSwgQk9PTEVBTl9WQUxJREFUT1IsIHsgdmFsaWRhdGlvbk1lc3NhZ2U6ICdwaGV0aW9EeW5hbWljRWxlbWVudCBtdXN0IGJlIGEgYm9vbGVhbicgfSApICk7XHJcbiAgICBhc3NlcnQgJiYgdmFsaWRhdGUoIG9wdGlvbnMucGhldGlvRGVzaWduZWQsIG1lcmdlKCB7fSwgQk9PTEVBTl9WQUxJREFUT1IsIHsgdmFsaWRhdGlvbk1lc3NhZ2U6ICdwaGV0aW9EZXNpZ25lZCBtdXN0IGJlIGEgYm9vbGVhbicgfSApICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5saW5rZWRFbGVtZW50cyAhPT0gbnVsbCwgJ3RoaXMgbWVhbnMgYWRkTGlua2VkRWxlbWVudCB3YXMgY2FsbGVkIGJlZm9yZSBpbnN0cnVtZW50YXRpb24gb2YgdGhpcyBQaGV0aW9PYmplY3QnICk7XHJcblxyXG4gICAgLy8gb3B0aW9uYWwgLSBJbmRpY2F0ZXMgdGhhdCBhbiBvYmplY3QgaXMgYSBhcmNoZXR5cGUgZm9yIGEgZHluYW1pYyBjbGFzcy4gU2V0dGFibGUgb25seSBieVxyXG4gICAgLy8gUGhldGlvRW5naW5lIGFuZCBieSBjbGFzc2VzIHRoYXQgY3JlYXRlIGR5bmFtaWMgZWxlbWVudHMgd2hlbiBjcmVhdGluZyB0aGVpciBhcmNoZXR5cGUgKGxpa2UgUGhldGlvR3JvdXApIHRocm91Z2hcclxuICAgIC8vIFBoZXRpb09iamVjdC5tYXJrRHluYW1pY0VsZW1lbnRBcmNoZXR5cGUoKS5cclxuICAgIC8vIGlmIHRydWUsIGl0ZW1zIHdpbGwgYmUgZXhjbHVkZWQgZnJvbSBwaGV0aW9TdGF0ZS4gVGhpcyBhcHBsaWVzIHJlY3Vyc2l2ZWx5IGF1dG9tYXRpY2FsbHkuXHJcbiAgICB0aGlzLnBoZXRpb0lzQXJjaGV0eXBlID0gZmFsc2U7XHJcblxyXG4gICAgLy8gKHBoZXRpb0VuZ2luZSlcclxuICAgIC8vIFN0b3JlIHRoZSBmdWxsIGJhc2VsaW5lIGZvciB1c2FnZSBpbiB2YWxpZGF0aW9uIG9yIGZvciB1c2FnZSBpbiBzdHVkaW8uICBEbyB0aGlzIGJlZm9yZSBhcHBseWluZyBvdmVycmlkZXMuIFRoZVxyXG4gICAgLy8gYmFzZWxpbmUgaXMgY3JlYXRlZCB3aGVuIGEgc2ltIGlzIHJ1biB3aXRoIGFzc2VydGlvbnMgdG8gYXNzaXN0IGluIHBoZXRpb0FQSVZhbGlkYXRpb24uICBIb3dldmVyLCBldmVuIHdoZW5cclxuICAgIC8vIGFzc2VydGlvbnMgYXJlIGRpc2FibGVkLCBzb21lIHdyYXBwZXJzIHN1Y2ggYXMgc3R1ZGlvIG5lZWQgdG8gZ2VuZXJhdGUgdGhlIGJhc2VsaW5lIGFueXdheS5cclxuICAgIC8vIG5vdCBhbGwgbWV0YWRhdGEgYXJlIHBhc3NlZCB0aHJvdWdoIHZpYSBvcHRpb25zLCBzbyBzdG9yZSBiYXNlbGluZSBmb3IgdGhlc2UgYWRkaXRpb25hbCBwcm9wZXJ0aWVzXHJcbiAgICB0aGlzLnBoZXRpb0Jhc2VsaW5lTWV0YWRhdGEgPSAoIHBoZXRpb0FQSVZhbGlkYXRpb24uZW5hYmxlZCB8fCBwaGV0LnByZWxvYWRzLnBoZXRpby5xdWVyeVBhcmFtZXRlcnMucGhldGlvRW1pdEFQSUJhc2VsaW5lICkgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRNZXRhZGF0YSggbWVyZ2UoIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGhldGlvSXNBcmNoZXR5cGU6IHRoaXMucGhldGlvSXNBcmNoZXR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBoZXRpb0FyY2hldHlwZVBoZXRpb0lEOiB0aGlzLnBoZXRpb0FyY2hldHlwZVBoZXRpb0lEXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBvcHRpb25zICkgKSA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsO1xyXG5cclxuICAgIC8vIER5bmFtaWMgZWxlbWVudHMgc2hvdWxkIGNvbXBhcmUgdG8gdGhlaXIgXCJhcmNoZXR5cGFsXCIgY291bnRlcnBhcnRzLiAgRm9yIGV4YW1wbGUsIHRoaXMgbWVhbnMgdGhhdCBhIFBhcnRpY2xlXHJcbiAgICAvLyBpbiBhIFBoZXRpb0dyb3VwIHdpbGwgdGFrZSBpdHMgb3ZlcnJpZGVzIGZyb20gdGhlIFBoZXRpb0dyb3VwIGFyY2hldHlwZS5cclxuICAgIGNvbnN0IGFyY2hldHlwYWxQaGV0aW9JRCA9IG9wdGlvbnMudGFuZGVtLmdldEFyY2hldHlwYWxQaGV0aW9JRCgpO1xyXG5cclxuICAgIC8vIE92ZXJyaWRlcyBhcmUgb25seSBkZWZpbmVkIGZvciBzaW11bGF0aW9ucywgbm90IGZvciB1bml0IHRlc3RzLiAgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvL2lzc3Vlcy8xNDYxXHJcbiAgICAvLyBQYXRjaCBpbiB0aGUgZGVzaXJlZCB2YWx1ZXMgZnJvbSBvdmVycmlkZXMsIGlmIGFueS5cclxuICAgIGlmICggd2luZG93LnBoZXQucHJlbG9hZHMucGhldGlvLnBoZXRpb0VsZW1lbnRzT3ZlcnJpZGVzICkge1xyXG4gICAgICBjb25zdCBvdmVycmlkZXMgPSB3aW5kb3cucGhldC5wcmVsb2Fkcy5waGV0aW8ucGhldGlvRWxlbWVudHNPdmVycmlkZXNbIGFyY2hldHlwYWxQaGV0aW9JRCBdO1xyXG4gICAgICBpZiAoIG92ZXJyaWRlcyApIHtcclxuXHJcbiAgICAgICAgLy8gTm8gbmVlZCB0byBtYWtlIGEgbmV3IG9iamVjdCwgc2luY2UgdGhpcyBcIm9wdGlvbnNcIiB2YXJpYWJsZSB3YXMgY3JlYXRlZCBpbiB0aGUgcHJldmlvdXMgbWVyZ2UgY2FsbCBhYm92ZS5cclxuICAgICAgICBvcHRpb25zID0gb3B0aW9uaXplPFBoZXRpb09iamVjdE9wdGlvbnM+KCkoIG9wdGlvbnMsIG92ZXJyaWRlcyApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gKHJlYWQtb25seSkgc2VlIGRvY3MgYXQgREVGQVVMVFMgZGVjbGFyYXRpb25cclxuICAgIHRoaXMudGFuZGVtID0gb3B0aW9ucy50YW5kZW0hO1xyXG4gICAgdGhpcy5waGV0aW9JRCA9IHRoaXMudGFuZGVtLnBoZXRpb0lEO1xyXG5cclxuICAgIC8vIChyZWFkLW9ubHkpIHNlZSBkb2NzIGF0IERFRkFVTFRTIGRlY2xhcmF0aW9uXHJcbiAgICB0aGlzLl9waGV0aW9UeXBlID0gb3B0aW9ucy5waGV0aW9UeXBlO1xyXG5cclxuICAgIC8vIChyZWFkLW9ubHkpIHNlZSBkb2NzIGF0IERFRkFVTFRTIGRlY2xhcmF0aW9uXHJcbiAgICB0aGlzLl9waGV0aW9TdGF0ZSA9IG9wdGlvbnMucGhldGlvU3RhdGU7XHJcblxyXG4gICAgLy8gKHJlYWQtb25seSkgc2VlIGRvY3MgYXQgREVGQVVMVFMgZGVjbGFyYXRpb25cclxuICAgIHRoaXMuX3BoZXRpb1JlYWRPbmx5ID0gb3B0aW9ucy5waGV0aW9SZWFkT25seTtcclxuXHJcbiAgICAvLyAocmVhZC1vbmx5KSBzZWUgZG9jcyBhdCBERUZBVUxUUyBkZWNsYXJhdGlvblxyXG4gICAgdGhpcy5fcGhldGlvRG9jdW1lbnRhdGlvbiA9IG9wdGlvbnMucGhldGlvRG9jdW1lbnRhdGlvbjtcclxuXHJcbiAgICAvLyBzZWUgZG9jcyBhdCBERUZBVUxUUyBkZWNsYXJhdGlvblxyXG4gICAgdGhpcy5fcGhldGlvRXZlbnRUeXBlID0gb3B0aW9ucy5waGV0aW9FdmVudFR5cGU7XHJcblxyXG4gICAgLy8gc2VlIGRvY3MgYXQgREVGQVVMVFMgZGVjbGFyYXRpb25cclxuICAgIHRoaXMuX3BoZXRpb0hpZ2hGcmVxdWVuY3kgPSBvcHRpb25zLnBoZXRpb0hpZ2hGcmVxdWVuY3k7XHJcblxyXG4gICAgLy8gc2VlIGRvY3MgYXQgREVGQVVMVFMgZGVjbGFyYXRpb25cclxuICAgIHRoaXMuX3BoZXRpb1BsYXliYWNrID0gb3B0aW9ucy5waGV0aW9QbGF5YmFjaztcclxuXHJcbiAgICAvLyAoUGhldGlvRW5naW5lKSBzZWUgZG9jcyBhdCBERUZBVUxUUyBkZWNsYXJhdGlvbiAtIGluIG9yZGVyIHRvIHJlY3Vyc2l2ZWx5IHBhc3MgdGhpcyB2YWx1ZSB0b1xyXG4gICAgLy8gY2hpbGRyZW4sIHRoZSBzZXRQaGV0aW9EeW5hbWljRWxlbWVudCgpIGZ1bmN0aW9uIG11c3QgYmUgdXNlZCBpbnN0ZWFkIG9mIHNldHRpbmcgdGhpcyBhdHRyaWJ1dGUgZGlyZWN0bHlcclxuICAgIHRoaXMuX3BoZXRpb0R5bmFtaWNFbGVtZW50ID0gb3B0aW9ucy5waGV0aW9EeW5hbWljRWxlbWVudDtcclxuXHJcbiAgICAvLyAocmVhZC1vbmx5KSBzZWUgZG9jcyBhdCBERUZBVUxUUyBkZWNsYXJhdGlvblxyXG4gICAgdGhpcy5fcGhldGlvRmVhdHVyZWQgPSBvcHRpb25zLnBoZXRpb0ZlYXR1cmVkO1xyXG5cclxuICAgIHRoaXMuX3BoZXRpb0V2ZW50TWV0YWRhdGEgPSBvcHRpb25zLnBoZXRpb0V2ZW50TWV0YWRhdGE7XHJcblxyXG4gICAgdGhpcy5fcGhldGlvRGVzaWduZWQgPSBvcHRpb25zLnBoZXRpb0Rlc2lnbmVkO1xyXG5cclxuICAgIC8vIGZvciBwaGV0aW9EeW5hbWljRWxlbWVudHMsIHRoZSBjb3JyZXNwb25kaW5nIHBoZXRpb0lEIGZvciB0aGUgZWxlbWVudCBpbiB0aGUgYXJjaGV0eXBlIHN1YnRyZWVcclxuICAgIHRoaXMucGhldGlvQXJjaGV0eXBlUGhldGlvSUQgPSBudWxsO1xyXG5cclxuICAgIC8va2VlcCB0cmFjayBvZiBMaW5rZWRFbGVtZW50cyBmb3IgZGlzcG9zYWwuIE51bGwgb3V0IHRvIHN1cHBvcnQgYXNzZXJ0aW5nIG9uXHJcbiAgICAvLyBlZGdlIGVycm9yIGNhc2VzLCBzZWUgdGhpcy5hZGRMaW5rZWRFbGVtZW50KClcclxuICAgIHRoaXMubGlua2VkRWxlbWVudHMgPSBbXTtcclxuXHJcbiAgICAvLyAocGhldC1pbykgc2V0IHRvIHRydWUgd2hlbiB0aGlzIFBoZXRpb09iamVjdCBoYXMgYmVlbiBzZW50IG92ZXIgdG8gdGhlIHBhcmVudC5cclxuICAgIHRoaXMucGhldGlvTm90aWZpZWRPYmplY3RDcmVhdGVkID0gZmFsc2U7XHJcblxyXG4gICAgLy8gdHJhY2tzIHRoZSBpbmRpY2VzIG9mIHN0YXJ0ZWQgbWVzc2FnZXMgc28gdGhhdCBkYXRhU3RyZWFtIGNhbiBjaGVjayB0aGF0IGVuZHMgbWF0Y2ggc3RhcnRzLlxyXG4gICAgdGhpcy5waGV0aW9NZXNzYWdlU3RhY2sgPSBbXTtcclxuXHJcbiAgICAvLyBNYWtlIHN1cmUgcGxheWJhY2sgc2hvd3MgaW4gdGhlIHBoZXRpb0V2ZW50TWV0YWRhdGFcclxuICAgIGlmICggdGhpcy5fcGhldGlvUGxheWJhY2sgKSB7XHJcbiAgICAgIHRoaXMuX3BoZXRpb0V2ZW50TWV0YWRhdGEgPSB0aGlzLl9waGV0aW9FdmVudE1ldGFkYXRhIHx8IHt9O1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5fcGhldGlvRXZlbnRNZXRhZGF0YS5oYXNPd25Qcm9wZXJ0eSggJ3BsYXliYWNrJyApLCAncGhldGlvRXZlbnRNZXRhZGF0YS5wbGF5YmFjayBzaG91bGQgbm90IGFscmVhZHkgZXhpc3QnICk7XHJcbiAgICAgIHRoaXMuX3BoZXRpb0V2ZW50TWV0YWRhdGEucGxheWJhY2sgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFsZXJ0IHRoYXQgdGhpcyBQaGV0aW9PYmplY3QgaXMgcmVhZHkgZm9yIGNyb3NzLWZyYW1lIGNvbW11bmljYXRpb24gKHRodXMgYmVjb21pbmcgYSBcIlBoRVQtaU8gRWxlbWVudFwiIG9uIHRoZSB3cmFwcGVyIHNpZGUuXHJcbiAgICB0aGlzLnRhbmRlbS5hZGRQaGV0aW9PYmplY3QoIHRoaXMgKTtcclxuICAgIHRoaXMucGhldGlvT2JqZWN0SW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG5cclxuICAgIGlmICggYXNzZXJ0ICYmIFRhbmRlbS5WQUxJREFUSU9OICYmIHRoaXMuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSAmJiBvcHRpb25zLnRhbmRlbU5hbWVTdWZmaXggKSB7XHJcblxyXG4gICAgICBjb25zdCBzdWZmaXhBcnJheSA9IEFycmF5LmlzQXJyYXkoIG9wdGlvbnMudGFuZGVtTmFtZVN1ZmZpeCApID8gb3B0aW9ucy50YW5kZW1OYW1lU3VmZml4IDogWyBvcHRpb25zLnRhbmRlbU5hbWVTdWZmaXggXTtcclxuICAgICAgY29uc3QgbWF0Y2hlcyA9IHN1ZmZpeEFycmF5LmZpbHRlciggc3VmZml4ID0+IHtcclxuICAgICAgICByZXR1cm4gdGhpcy50YW5kZW0ubmFtZS5lbmRzV2l0aCggc3VmZml4ICkgfHxcclxuICAgICAgICAgICAgICAgdGhpcy50YW5kZW0ubmFtZS5lbmRzV2l0aCggUGhldGlvT2JqZWN0LnN3YXBDYXNlT2ZGaXJzdENoYXJhY3Rlciggc3VmZml4ICkgKTtcclxuICAgICAgfSApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBtYXRjaGVzLmxlbmd0aCA+IDAsICdJbmNvcnJlY3QgVGFuZGVtIHN1ZmZpeCwgZXhwZWN0ZWQgPSAnICsgc3VmZml4QXJyYXkuam9pbiggJywgJyApICsgJy4gYWN0dWFsID0gJyArIHRoaXMudGFuZGVtLnBoZXRpb0lEICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIHN3YXBDYXNlT2ZGaXJzdENoYXJhY3Rlciggc3RyaW5nOiBzdHJpbmcgKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IGZpcnN0Q2hhciA9IHN0cmluZ1sgMCBdO1xyXG4gICAgY29uc3QgbmV3Rmlyc3RDaGFyID0gZmlyc3RDaGFyID09PSBmaXJzdENoYXIudG9Mb3dlckNhc2UoKSA/IGZpcnN0Q2hhci50b1VwcGVyQ2FzZSgpIDogZmlyc3RDaGFyLnRvTG93ZXJDYXNlKCk7XHJcbiAgICByZXR1cm4gbmV3Rmlyc3RDaGFyICsgc3RyaW5nLnN1YnN0cmluZyggMSApO1xyXG4gIH1cclxuXHJcbiAgLy8gdGhyb3dzIGFuIGFzc2VydGlvbiBlcnJvciBpbiBicmFuZHMgb3RoZXIgdGhhbiBQaEVULWlPXHJcbiAgcHVibGljIGdldCBwaGV0aW9UeXBlKCk6IElPVHlwZSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBQSEVUX0lPX0VOQUJMRUQgJiYgdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpLCAncGhldGlvVHlwZSBvbmx5IGFjY2Vzc2libGUgZm9yIGluc3RydW1lbnRlZCBvYmplY3RzIGluIFBoRVQtaU8gYnJhbmQuJyApO1xyXG4gICAgcmV0dXJuIHRoaXMuX3BoZXRpb1R5cGU7XHJcbiAgfVxyXG5cclxuICAvLyB0aHJvd3MgYW4gYXNzZXJ0aW9uIGVycm9yIGluIGJyYW5kcyBvdGhlciB0aGFuIFBoRVQtaU9cclxuICBwdWJsaWMgZ2V0IHBoZXRpb1N0YXRlKCk6IGJvb2xlYW4ge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggUEhFVF9JT19FTkFCTEVEICYmIHRoaXMuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSwgJ3BoZXRpb1N0YXRlIG9ubHkgYWNjZXNzaWJsZSBmb3IgaW5zdHJ1bWVudGVkIG9iamVjdHMgaW4gUGhFVC1pTyBicmFuZC4nICk7XHJcbiAgICByZXR1cm4gdGhpcy5fcGhldGlvU3RhdGU7XHJcbiAgfVxyXG5cclxuICAvLyB0aHJvd3MgYW4gYXNzZXJ0aW9uIGVycm9yIGluIGJyYW5kcyBvdGhlciB0aGFuIFBoRVQtaU9cclxuICBwdWJsaWMgZ2V0IHBoZXRpb1JlYWRPbmx5KCk6IGJvb2xlYW4ge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggUEhFVF9JT19FTkFCTEVEICYmIHRoaXMuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSwgJ3BoZXRpb1JlYWRPbmx5IG9ubHkgYWNjZXNzaWJsZSBmb3IgaW5zdHJ1bWVudGVkIG9iamVjdHMgaW4gUGhFVC1pTyBicmFuZC4nICk7XHJcbiAgICByZXR1cm4gdGhpcy5fcGhldGlvUmVhZE9ubHk7XHJcbiAgfVxyXG5cclxuICAvLyB0aHJvd3MgYW4gYXNzZXJ0aW9uIGVycm9yIGluIGJyYW5kcyBvdGhlciB0aGFuIFBoRVQtaU9cclxuICBwdWJsaWMgZ2V0IHBoZXRpb0RvY3VtZW50YXRpb24oKTogc3RyaW5nIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIFBIRVRfSU9fRU5BQkxFRCAmJiB0aGlzLmlzUGhldGlvSW5zdHJ1bWVudGVkKCksICdwaGV0aW9Eb2N1bWVudGF0aW9uIG9ubHkgYWNjZXNzaWJsZSBmb3IgaW5zdHJ1bWVudGVkIG9iamVjdHMgaW4gUGhFVC1pTyBicmFuZC4nICk7XHJcbiAgICByZXR1cm4gdGhpcy5fcGhldGlvRG9jdW1lbnRhdGlvbjtcclxuICB9XHJcblxyXG4gIC8vIHRocm93cyBhbiBhc3NlcnRpb24gZXJyb3IgaW4gYnJhbmRzIG90aGVyIHRoYW4gUGhFVC1pT1xyXG4gIHB1YmxpYyBnZXQgcGhldGlvRXZlbnRUeXBlKCk6IEV2ZW50VHlwZSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBQSEVUX0lPX0VOQUJMRUQgJiYgdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpLCAncGhldGlvRXZlbnRUeXBlIG9ubHkgYWNjZXNzaWJsZSBmb3IgaW5zdHJ1bWVudGVkIG9iamVjdHMgaW4gUGhFVC1pTyBicmFuZC4nICk7XHJcbiAgICByZXR1cm4gdGhpcy5fcGhldGlvRXZlbnRUeXBlO1xyXG4gIH1cclxuXHJcbiAgLy8gdGhyb3dzIGFuIGFzc2VydGlvbiBlcnJvciBpbiBicmFuZHMgb3RoZXIgdGhhbiBQaEVULWlPXHJcbiAgcHVibGljIGdldCBwaGV0aW9IaWdoRnJlcXVlbmN5KCk6IGJvb2xlYW4ge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggUEhFVF9JT19FTkFCTEVEICYmIHRoaXMuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSwgJ3BoZXRpb0hpZ2hGcmVxdWVuY3kgb25seSBhY2Nlc3NpYmxlIGZvciBpbnN0cnVtZW50ZWQgb2JqZWN0cyBpbiBQaEVULWlPIGJyYW5kLicgKTtcclxuICAgIHJldHVybiB0aGlzLl9waGV0aW9IaWdoRnJlcXVlbmN5O1xyXG4gIH1cclxuXHJcbiAgLy8gdGhyb3dzIGFuIGFzc2VydGlvbiBlcnJvciBpbiBicmFuZHMgb3RoZXIgdGhhbiBQaEVULWlPXHJcbiAgcHVibGljIGdldCBwaGV0aW9QbGF5YmFjaygpOiBib29sZWFuIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIFBIRVRfSU9fRU5BQkxFRCAmJiB0aGlzLmlzUGhldGlvSW5zdHJ1bWVudGVkKCksICdwaGV0aW9QbGF5YmFjayBvbmx5IGFjY2Vzc2libGUgZm9yIGluc3RydW1lbnRlZCBvYmplY3RzIGluIFBoRVQtaU8gYnJhbmQuJyApO1xyXG4gICAgcmV0dXJuIHRoaXMuX3BoZXRpb1BsYXliYWNrO1xyXG4gIH1cclxuXHJcbiAgLy8gdGhyb3dzIGFuIGFzc2VydGlvbiBlcnJvciBpbiBicmFuZHMgb3RoZXIgdGhhbiBQaEVULWlPXHJcbiAgcHVibGljIGdldCBwaGV0aW9EeW5hbWljRWxlbWVudCgpOiBib29sZWFuIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIFBIRVRfSU9fRU5BQkxFRCAmJiB0aGlzLmlzUGhldGlvSW5zdHJ1bWVudGVkKCksICdwaGV0aW9EeW5hbWljRWxlbWVudCBvbmx5IGFjY2Vzc2libGUgZm9yIGluc3RydW1lbnRlZCBvYmplY3RzIGluIFBoRVQtaU8gYnJhbmQuJyApO1xyXG4gICAgcmV0dXJuIHRoaXMuX3BoZXRpb0R5bmFtaWNFbGVtZW50O1xyXG4gIH1cclxuXHJcbiAgLy8gdGhyb3dzIGFuIGFzc2VydGlvbiBlcnJvciBpbiBicmFuZHMgb3RoZXIgdGhhbiBQaEVULWlPXHJcbiAgcHVibGljIGdldCBwaGV0aW9GZWF0dXJlZCgpOiBib29sZWFuIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIFBIRVRfSU9fRU5BQkxFRCAmJiB0aGlzLmlzUGhldGlvSW5zdHJ1bWVudGVkKCksICdwaGV0aW9GZWF0dXJlZCBvbmx5IGFjY2Vzc2libGUgZm9yIGluc3RydW1lbnRlZCBvYmplY3RzIGluIFBoRVQtaU8gYnJhbmQuJyApO1xyXG4gICAgcmV0dXJuIHRoaXMuX3BoZXRpb0ZlYXR1cmVkO1xyXG4gIH1cclxuXHJcbiAgLy8gdGhyb3dzIGFuIGFzc2VydGlvbiBlcnJvciBpbiBicmFuZHMgb3RoZXIgdGhhbiBQaEVULWlPXHJcbiAgcHVibGljIGdldCBwaGV0aW9FdmVudE1ldGFkYXRhKCk6IEV2ZW50TWV0YWRhdGEgfCBudWxsIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIFBIRVRfSU9fRU5BQkxFRCAmJiB0aGlzLmlzUGhldGlvSW5zdHJ1bWVudGVkKCksICdwaGV0aW9FdmVudE1ldGFkYXRhIG9ubHkgYWNjZXNzaWJsZSBmb3IgaW5zdHJ1bWVudGVkIG9iamVjdHMgaW4gUGhFVC1pTyBicmFuZC4nICk7XHJcbiAgICByZXR1cm4gdGhpcy5fcGhldGlvRXZlbnRNZXRhZGF0YTtcclxuICB9XHJcblxyXG4gIC8vIHRocm93cyBhbiBhc3NlcnRpb24gZXJyb3IgaW4gYnJhbmRzIG90aGVyIHRoYW4gUGhFVC1pT1xyXG4gIHB1YmxpYyBnZXQgcGhldGlvRGVzaWduZWQoKTogYm9vbGVhbiB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBQSEVUX0lPX0VOQUJMRUQgJiYgdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpLCAncGhldGlvRGVzaWduZWQgb25seSBhY2Nlc3NpYmxlIGZvciBpbnN0cnVtZW50ZWQgb2JqZWN0cyBpbiBQaEVULWlPIGJyYW5kLicgKTtcclxuICAgIHJldHVybiB0aGlzLl9waGV0aW9EZXNpZ25lZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN0YXJ0IGFuIGV2ZW50IGZvciB0aGUgbmVzdGVkIFBoRVQtaU8gZGF0YSBzdHJlYW0uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gZXZlbnQgLSB0aGUgbmFtZSBvZiB0aGUgZXZlbnRcclxuICAgKiBAcGFyYW0gW3Byb3ZpZGVkT3B0aW9uc11cclxuICAgKi9cclxuICBwdWJsaWMgcGhldGlvU3RhcnRFdmVudCggZXZlbnQ6IHN0cmluZywgcHJvdmlkZWRPcHRpb25zPzogU3RhcnRFdmVudE9wdGlvbnMgKTogdm9pZCB7XHJcbiAgICBpZiAoIFBIRVRfSU9fRU5BQkxFRCAmJiB0aGlzLmlzUGhldGlvSW5zdHJ1bWVudGVkKCkgKSB7XHJcblxyXG4gICAgICAvLyBvbmx5IG9uZSBvciB0aGUgb3RoZXIgY2FuIGJlIHByb3ZpZGVkXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnRNdXR1YWxseUV4Y2x1c2l2ZU9wdGlvbnMoIHByb3ZpZGVkT3B0aW9ucywgWyAnZGF0YScgXSwgWyAnZ2V0RGF0YScgXSApO1xyXG4gICAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPFN0YXJ0RXZlbnRPcHRpb25zPigpKCB7XHJcblxyXG4gICAgICAgIGRhdGE6IG51bGwsXHJcblxyXG4gICAgICAgIC8vIGZ1bmN0aW9uIHRoYXQsIHdoZW4gY2FsbGVkIGdldHMgdGhlIGRhdGEuXHJcbiAgICAgICAgZ2V0RGF0YTogbnVsbFxyXG4gICAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMucGhldGlvT2JqZWN0SW5pdGlhbGl6ZWQsICdwaGV0aW9PYmplY3Qgc2hvdWxkIGJlIGluaXRpYWxpemVkJyApO1xyXG4gICAgICBhc3NlcnQgJiYgb3B0aW9ucy5kYXRhICYmIGFzc2VydCggdHlwZW9mIG9wdGlvbnMuZGF0YSA9PT0gJ29iamVjdCcgKTtcclxuICAgICAgYXNzZXJ0ICYmIG9wdGlvbnMuZ2V0RGF0YSAmJiBhc3NlcnQoIHR5cGVvZiBvcHRpb25zLmdldERhdGEgPT09ICdmdW5jdGlvbicgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggYXJndW1lbnRzLmxlbmd0aCA9PT0gMSB8fCBhcmd1bWVudHMubGVuZ3RoID09PSAyLCAnUHJldmVudCB1c2FnZSBvZiBpbmNvcnJlY3Qgc2lnbmF0dXJlJyApO1xyXG5cclxuICAgICAgLy8gVE9ETzogZG9uJ3QgZHJvcCBQaEVULWlPIGV2ZW50cyBpZiB0aGV5IGFyZSBjcmVhdGVkIGJlZm9yZSB3ZSBoYXZlIGEgZGF0YVN0cmVhbSBnbG9iYWwuIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvL2lzc3Vlcy8xODc1XHJcbiAgICAgIGlmICggIV8uaGFzSW4oIHdpbmRvdywgJ3BoZXQucGhldGlvLmRhdGFTdHJlYW0nICkgKSB7XHJcblxyXG4gICAgICAgIC8vIElmIHlvdSBoaXQgdGhpcywgdGhlbiBpdCBpcyBsaWtlbHkgcmVsYXRlZCB0byBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTEyNCBhbmQgd2Ugd291bGQgbGlrZSB0byBrbm93IGFib3V0IGl0IVxyXG4gICAgICAgIC8vIGFzc2VydCAmJiBhc3NlcnQoIGZhbHNlLCAndHJ5aW5nIHRvIGNyZWF0ZSBhbiBldmVudCBiZWZvcmUgdGhlIGRhdGEgc3RyZWFtIGV4aXN0cycgKTtcclxuXHJcbiAgICAgICAgdGhpcy5waGV0aW9NZXNzYWdlU3RhY2sucHVzaCggU0tJUFBJTkdfTUVTU0FHRSApO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gT3B0IG91dCBvZiBjZXJ0YWluIGV2ZW50cyBpZiBxdWVyeVBhcmFtZXRlciBvdmVycmlkZSBpcyBwcm92aWRlZC4gRXZlbiBmb3IgYSBsb3cgZnJlcXVlbmN5IGRhdGEgc3RyZWFtLCBoaWdoXHJcbiAgICAgIC8vIGZyZXF1ZW5jeSBldmVudHMgY2FuIHN0aWxsIGJlIGVtaXR0ZWQgd2hlbiB0aGV5IGhhdmUgYSBsb3cgZnJlcXVlbmN5IGFuY2VzdG9yLlxyXG4gICAgICBjb25zdCBza2lwSGlnaEZyZXF1ZW5jeUV2ZW50ID0gdGhpcy5waGV0aW9IaWdoRnJlcXVlbmN5ICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmhhc0luKCB3aW5kb3csICdwaGV0LnByZWxvYWRzLnBoZXRpby5xdWVyeVBhcmFtZXRlcnMnICkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICF3aW5kb3cucGhldC5wcmVsb2Fkcy5waGV0aW8ucXVlcnlQYXJhbWV0ZXJzLnBoZXRpb0VtaXRIaWdoRnJlcXVlbmN5RXZlbnRzICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcGhldC5waGV0aW8uZGF0YVN0cmVhbS5pc0VtaXR0aW5nTG93RnJlcXVlbmN5RXZlbnQoKTtcclxuXHJcbiAgICAgIC8vIFRPRE86IElmIHRoZXJlIGlzIG5vIGRhdGFTdHJlYW0gZ2xvYmFsIGRlZmluZWQsIHRoZW4gd2Ugc2hvdWxkIGhhbmRsZSB0aGlzIGRpZmZlcmVudGx5IGFzIHRvIG5vdCBkcm9wIHRoZSBldmVudCB0aGF0IGlzIHRyaWdnZXJlZCwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvL2lzc3Vlcy8xODQ2XHJcbiAgICAgIGNvbnN0IHNraXBGcm9tVW5kZWZpbmVkRGF0YXN0cmVhbSA9ICFhc3NlcnQgJiYgIV8uaGFzSW4oIHdpbmRvdywgJ3BoZXQucGhldGlvLmRhdGFTdHJlYW0nICk7XHJcblxyXG4gICAgICBpZiAoIHNraXBIaWdoRnJlcXVlbmN5RXZlbnQgfHwgdGhpcy5waGV0aW9FdmVudFR5cGUgPT09IEV2ZW50VHlwZS5PUFRfT1VUIHx8IHNraXBGcm9tVW5kZWZpbmVkRGF0YXN0cmVhbSApIHtcclxuICAgICAgICB0aGlzLnBoZXRpb01lc3NhZ2VTdGFjay5wdXNoKCBTS0lQUElOR19NRVNTQUdFICk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBPbmx5IGdldCB0aGUgYXJncyBpZiB3ZSBhcmUgYWN0dWFsbHkgZ29pbmcgdG8gc2VuZCB0aGUgZXZlbnQuXHJcbiAgICAgIGNvbnN0IGRhdGEgPSBvcHRpb25zLmdldERhdGEgPyBvcHRpb25zLmdldERhdGEoKSA6IG9wdGlvbnMuZGF0YTtcclxuXHJcbiAgICAgIHRoaXMucGhldGlvTWVzc2FnZVN0YWNrLnB1c2goXHJcbiAgICAgICAgcGhldC5waGV0aW8uZGF0YVN0cmVhbS5zdGFydCggdGhpcy5waGV0aW9FdmVudFR5cGUsIHRoaXMudGFuZGVtLnBoZXRpb0lELCB0aGlzLnBoZXRpb1R5cGUsIGV2ZW50LCBkYXRhLCB0aGlzLnBoZXRpb0V2ZW50TWV0YWRhdGEsIHRoaXMucGhldGlvSGlnaEZyZXF1ZW5jeSApXHJcbiAgICAgICk7XHJcblxyXG4gICAgICAvLyBUbyBzdXBwb3J0IFBoRVQtaU8gcGxheWJhY2ssIGFueSBwb3RlbnRpYWwgcGxheWJhY2sgZXZlbnRzIGRvd25zdHJlYW0gb2YgdGhpcyBwbGF5YmFjayBldmVudCBtdXN0IGJlIG1hcmtlZCBhc1xyXG4gICAgICAvLyBub24gcGxheWJhY2sgZXZlbnRzLiBUaGlzIGlzIHRvIHByZXZlbnQgdGhlIFBoRVQtaU8gcGxheWJhY2sgZW5naW5lIGZyb20gcmVwZWF0aW5nIHRob3NlIGV2ZW50cy4gU2VlXHJcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvL2lzc3Vlcy8xNjkzXHJcbiAgICAgIHRoaXMucGhldGlvUGxheWJhY2sgJiYgcGhldC5waGV0aW8uZGF0YVN0cmVhbS5wdXNoTm9uUGxheWJhY2thYmxlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFbmQgYW4gZXZlbnQgb24gdGhlIG5lc3RlZCBQaEVULWlPIGRhdGEgc3RyZWFtLiBJdCB0aGlzIG9iamVjdCB3YXMgZGlzcG9zZWQgb3IgZGF0YVN0cmVhbS5zdGFydCB3YXMgbm90IGNhbGxlZCxcclxuICAgKiB0aGlzIGlzIGEgbm8tb3AuXHJcbiAgICovXHJcbiAgcHVibGljIHBoZXRpb0VuZEV2ZW50KCBhc3NlcnRDb3JyZWN0SW5kaWNlcyA9IGZhbHNlICk6IHZvaWQge1xyXG4gICAgaWYgKCBQSEVUX0lPX0VOQUJMRUQgJiYgdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpICkge1xyXG5cclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5waGV0aW9NZXNzYWdlU3RhY2subGVuZ3RoID4gMCwgJ011c3QgaGF2ZSBtZXNzYWdlcyB0byBwb3AnICk7XHJcbiAgICAgIGNvbnN0IHRvcE1lc3NhZ2VJbmRleCA9IHRoaXMucGhldGlvTWVzc2FnZVN0YWNrLnBvcCgpO1xyXG5cclxuICAgICAgLy8gVGhlIG1lc3NhZ2Ugd2FzIHN0YXJ0ZWQgYXMgYSBoaWdoIGZyZXF1ZW5jeSBldmVudCB0byBiZSBza2lwcGVkLCBzbyB0aGUgZW5kIGlzIGEgbm8tb3BcclxuICAgICAgaWYgKCB0b3BNZXNzYWdlSW5kZXggPT09IFNLSVBQSU5HX01FU1NBR0UgKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMucGhldGlvUGxheWJhY2sgJiYgcGhldC5waGV0aW8uZGF0YVN0cmVhbS5wb3BOb25QbGF5YmFja2FibGUoKTtcclxuICAgICAgcGhldC5waGV0aW8uZGF0YVN0cmVhbS5lbmQoIHRvcE1lc3NhZ2VJbmRleCwgYXNzZXJ0Q29ycmVjdEluZGljZXMgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCBhbnkgaW5zdHJ1bWVudGVkIGRlc2NlbmRhbnRzIG9mIHRoaXMgUGhldGlvT2JqZWN0IHRvIHRoZSBzYW1lIHZhbHVlIGFzIHRoaXMucGhldGlvRHluYW1pY0VsZW1lbnQuXHJcbiAgICovXHJcbiAgcHVibGljIHByb3BhZ2F0ZUR5bmFtaWNGbGFnc1RvRGVzY2VuZGFudHMoKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBUYW5kZW0uUEhFVF9JT19FTkFCTEVELCAncGhldC1pbyBzaG91bGQgYmUgZW5hYmxlZCcgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHBoZXQucGhldGlvICYmIHBoZXQucGhldGlvLnBoZXRpb0VuZ2luZSwgJ0R5bmFtaWMgZWxlbWVudHMgY2Fubm90IGJlIGNyZWF0ZWQgc3RhdGljYWxseSBiZWZvcmUgcGhldGlvRW5naW5lIGV4aXN0cy4nICk7XHJcbiAgICBjb25zdCBwaGV0aW9FbmdpbmUgPSBwaGV0LnBoZXRpby5waGV0aW9FbmdpbmU7XHJcblxyXG4gICAgLy8gaW4gdGhlIHNhbWUgb3JkZXIgYXMgYnVmZmVyZWRQaGV0aW9PYmplY3RzXHJcbiAgICBjb25zdCB1bmxhdW5jaGVkUGhldGlvSURzID0gIVRhbmRlbS5sYXVuY2hlZCA/IFRhbmRlbS5idWZmZXJlZFBoZXRpb09iamVjdHMubWFwKCBvYmplY3RUb1BoZXRpb0lEICkgOiBbXTtcclxuXHJcbiAgICB0aGlzLnRhbmRlbS5pdGVyYXRlRGVzY2VuZGFudHMoIHRhbmRlbSA9PiB7XHJcbiAgICAgIGNvbnN0IHBoZXRpb0lEID0gdGFuZGVtLnBoZXRpb0lEO1xyXG5cclxuICAgICAgaWYgKCBwaGV0aW9FbmdpbmUuaGFzUGhldGlvT2JqZWN0KCBwaGV0aW9JRCApIHx8ICggIVRhbmRlbS5sYXVuY2hlZCAmJiB1bmxhdW5jaGVkUGhldGlvSURzLmluY2x1ZGVzKCBwaGV0aW9JRCApICkgKSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpICk7XHJcbiAgICAgICAgY29uc3QgcGhldGlvT2JqZWN0ID0gcGhldGlvRW5naW5lLmhhc1BoZXRpb09iamVjdCggcGhldGlvSUQgKSA/IHBoZXRpb0VuZ2luZS5nZXRQaGV0aW9FbGVtZW50KCBwaGV0aW9JRCApIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUYW5kZW0uYnVmZmVyZWRQaGV0aW9PYmplY3RzWyB1bmxhdW5jaGVkUGhldGlvSURzLmluZGV4T2YoIHBoZXRpb0lEICkgXTtcclxuXHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggcGhldGlvT2JqZWN0LCAnc2hvdWxkIGhhdmUgYSBwaGV0aW9PYmplY3QgaGVyZScgKTtcclxuXHJcbiAgICAgICAgLy8gT3JkZXIgbWF0dGVycyBoZXJlISBUaGUgcGhldGlvSXNBcmNoZXR5cGUgbmVlZHMgdG8gYmUgZmlyc3QgdG8gZW5zdXJlIHRoYXQgdGhlIHNldFBoZXRpb0R5bmFtaWNFbGVtZW50XHJcbiAgICAgICAgLy8gc2V0dGVyIGNhbiBvcHQgb3V0IGZvciBhcmNoZXR5cGVzLlxyXG4gICAgICAgIHBoZXRpb09iamVjdC5waGV0aW9Jc0FyY2hldHlwZSA9IHRoaXMucGhldGlvSXNBcmNoZXR5cGU7XHJcbiAgICAgICAgcGhldGlvT2JqZWN0LnNldFBoZXRpb0R5bmFtaWNFbGVtZW50KCB0aGlzLnBoZXRpb0R5bmFtaWNFbGVtZW50ICk7XHJcblxyXG4gICAgICAgIGlmICggcGhldGlvT2JqZWN0LnBoZXRpb0Jhc2VsaW5lTWV0YWRhdGEgKSB7XHJcbiAgICAgICAgICBwaGV0aW9PYmplY3QucGhldGlvQmFzZWxpbmVNZXRhZGF0YS5waGV0aW9Jc0FyY2hldHlwZSA9IHRoaXMucGhldGlvSXNBcmNoZXR5cGU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVc2VkIGluIFBoZXRpb0VuZ2luZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRQaGV0aW9EeW5hbWljRWxlbWVudCggcGhldGlvRHluYW1pY0VsZW1lbnQ6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5waGV0aW9Ob3RpZmllZE9iamVjdENyZWF0ZWQsICdzaG91bGQgbm90IGNoYW5nZSBkeW5hbWljIGVsZW1lbnQgZmxhZ3MgYWZ0ZXIgbm90aWZ5aW5nIHRoaXMgUGhldGlvT2JqZWN0XFwncyBjcmVhdGlvbi4nICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmlzUGhldGlvSW5zdHJ1bWVudGVkKCkgKTtcclxuXHJcbiAgICAvLyBBbGwgYXJjaGV0eXBlcyBhcmUgc3RhdGljIChub24tZHluYW1pYylcclxuICAgIHRoaXMuX3BoZXRpb0R5bmFtaWNFbGVtZW50ID0gdGhpcy5waGV0aW9Jc0FyY2hldHlwZSA/IGZhbHNlIDogcGhldGlvRHluYW1pY0VsZW1lbnQ7XHJcblxyXG4gICAgLy8gRm9yIGR5bmFtaWMgZWxlbWVudHMsIGluZGljYXRlIHRoZSBjb3JyZXNwb25kaW5nIGFyY2hldHlwZSBlbGVtZW50IHNvIHRoYXQgY2xpZW50cyBsaWtlIFN0dWRpbyBjYW4gbGV2ZXJhZ2VcclxuICAgIC8vIHRoZSBhcmNoZXR5cGUgbWV0YWRhdGEuIFN0YXRpYyBlbGVtZW50cyBkb24ndCBoYXZlIGFyY2hldHlwZXMuXHJcbiAgICB0aGlzLnBoZXRpb0FyY2hldHlwZVBoZXRpb0lEID0gcGhldGlvRHluYW1pY0VsZW1lbnQgPyB0aGlzLnRhbmRlbS5nZXRBcmNoZXR5cGFsUGhldGlvSUQoKSA6IG51bGw7XHJcblxyXG4gICAgLy8gS2VlcCB0aGUgYmFzZWxpbmUgbWV0YWRhdGEgaW4gc3luYy5cclxuICAgIGlmICggdGhpcy5waGV0aW9CYXNlbGluZU1ldGFkYXRhICkge1xyXG4gICAgICB0aGlzLnBoZXRpb0Jhc2VsaW5lTWV0YWRhdGEucGhldGlvRHluYW1pY0VsZW1lbnQgPSB0aGlzLnBoZXRpb0R5bmFtaWNFbGVtZW50O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFyayB0aGlzIFBoZXRpb09iamVjdCBhcyBhbiBhcmNoZXR5cGUgZm9yIGR5bmFtaWMgZWxlbWVudHMuXHJcbiAgICovXHJcbiAgcHVibGljIG1hcmtEeW5hbWljRWxlbWVudEFyY2hldHlwZSgpOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLnBoZXRpb05vdGlmaWVkT2JqZWN0Q3JlYXRlZCwgJ3Nob3VsZCBub3QgY2hhbmdlIGR5bmFtaWMgZWxlbWVudCBmbGFncyBhZnRlciBub3RpZnlpbmcgdGhpcyBQaGV0aW9PYmplY3RcXCdzIGNyZWF0aW9uLicgKTtcclxuXHJcbiAgICB0aGlzLnBoZXRpb0lzQXJjaGV0eXBlID0gdHJ1ZTtcclxuICAgIHRoaXMuc2V0UGhldGlvRHluYW1pY0VsZW1lbnQoIGZhbHNlICk7IC8vIGJlY2F1c2UgYXJjaGV0eXBlcyBhcmVuJ3QgZHluYW1pYyBlbGVtZW50c1xyXG5cclxuICAgIGlmICggdGhpcy5waGV0aW9CYXNlbGluZU1ldGFkYXRhICkge1xyXG4gICAgICB0aGlzLnBoZXRpb0Jhc2VsaW5lTWV0YWRhdGEucGhldGlvSXNBcmNoZXR5cGUgPSB0aGlzLnBoZXRpb0lzQXJjaGV0eXBlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHJlY29tcHV0ZSBmb3IgY2hpbGRyZW4gYWxzbywgYnV0IG9ubHkgaWYgcGhldC1pbyBpcyBlbmFibGVkXHJcbiAgICBUYW5kZW0uUEhFVF9JT19FTkFCTEVEICYmIHRoaXMucHJvcGFnYXRlRHluYW1pY0ZsYWdzVG9EZXNjZW5kYW50cygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBQaGV0aW9PYmplY3Qgd2lsbCBvbmx5IGJlIGluc3RydW1lbnRlZCBpZiB0aGUgdGFuZGVtIHRoYXQgd2FzIHBhc3NlZCBpbiB3YXMgXCJzdXBwbGllZFwiLiBTZWUgVGFuZGVtLnN1cHBsaWVkXHJcbiAgICogZm9yIG1vcmUgaW5mby5cclxuICAgKi9cclxuICBwdWJsaWMgaXNQaGV0aW9JbnN0cnVtZW50ZWQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy50YW5kZW0gJiYgdGhpcy50YW5kZW0uc3VwcGxpZWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGVuIGFuIGluc3RydW1lbnRlZCBQaGV0aW9PYmplY3QgaXMgbGlua2VkIHdpdGggYW5vdGhlciBpbnN0cnVtZW50ZWQgUGhldGlvT2JqZWN0LCB0aGlzIGNyZWF0ZXMgYSBvbmUtd2F5XHJcbiAgICogYXNzb2NpYXRpb24gd2hpY2ggaXMgcmVuZGVyZWQgaW4gU3R1ZGlvIGFzIGEgXCJzeW1ib2xpY1wiIGxpbmsgb3IgaHlwZXJsaW5rLiBNYW55IGNvbW1vbiBjb2RlIFVJIGVsZW1lbnRzIHVzZSB0aGlzXHJcbiAgICogYXV0b21hdGljYWxseS4gVG8ga2VlcCBjbGllbnQgc2l0ZXMgc2ltcGxlLCB0aGlzIGhhcyBhIGdyYWNlZnVsIG9wdC1vdXQgbWVjaGFuaXNtIHdoaWNoIG1ha2VzIHRoaXMgZnVuY3Rpb24gYVxyXG4gICAqIG5vLW9wIGlmIGVpdGhlciB0aGlzIFBoZXRpb09iamVjdCBvciB0aGUgdGFyZ2V0IFBoZXRpb09iamVjdCBpcyBub3QgaW5zdHJ1bWVudGVkLlxyXG4gICAqXHJcbiAgICogWW91IGNhbiBzcGVjaWZ5IHRoZSB0YW5kZW0gb25lIG9mIHRocmVlIHdheXM6XHJcbiAgICogMS4gV2l0aG91dCBzcGVjaWZ5aW5nIHRhbmRlbU5hbWUgb3IgdGFuZGVtLCBpdCB3aWxsIHBsdWNrIHRoZSB0YW5kZW0ubmFtZSBmcm9tIHRoZSB0YXJnZXQgZWxlbWVudFxyXG4gICAqIDIuIElmIHRhbmRlbU5hbWUgaXMgc3BlY2lmaWVkIGluIHRoZSBvcHRpb25zLCBpdCB3aWxsIHVzZSB0aGF0IHRhbmRlbSBuYW1lIGFuZCBuZXN0IHRoZSB0YW5kZW0gdW5kZXIgdGhpcyBQaGV0aW9PYmplY3QncyB0YW5kZW1cclxuICAgKiAzLiBJZiB0YW5kZW0gaXMgc3BlY2lmaWVkIGluIHRoZSBvcHRpb25zIChub3QgcmVjb21tZW5kZWQpLCBpdCB3aWxsIHVzZSB0aGF0IHRhbmRlbSBhbmQgbmVzdCBpdCBhbnl3aGVyZSB0aGF0IHRhbmRlbSBleGlzdHMuXHJcbiAgICogICAgVXNlIHRoaXMgb3B0aW9uIHdpdGggY2F1dGlvbiBzaW5jZSBpdCBhbGxvd3MgeW91IHRvIG5lc3QgdGhlIHRhbmRlbSBhbnl3aGVyZSBpbiB0aGUgdHJlZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBlbGVtZW50IC0gdGhlIHRhcmdldCBlbGVtZW50LiBNdXN0IGJlIGluc3RydW1lbnRlZCBmb3IgYSBMaW5rZWRFbGVtZW50IHRvIGJlIGNyZWF0ZWQtLSBvdGhlcndpc2UgZ3JhY2VmdWxseSBvcHRzIG91dFxyXG4gICAqIEBwYXJhbSBbcHJvdmlkZWRPcHRpb25zXVxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGRMaW5rZWRFbGVtZW50KCBlbGVtZW50OiBQaGV0aW9PYmplY3QsIHByb3ZpZGVkT3B0aW9ucz86IExpbmtlZEVsZW1lbnRPcHRpb25zICk6IHZvaWQge1xyXG4gICAgaWYgKCAhdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpICkge1xyXG5cclxuICAgICAgLy8gc2V0IHRoaXMgdG8gbnVsbCBzbyB0aGF0IHlvdSBjYW4ndCBhZGRMaW5rZWRFbGVtZW50IG9uIGFuIHVuaW5pdGlhbGl6ZWQgUGhldGlvT2JqZWN0IGFuZCB0aGVuIGluc3RydW1lbnRcclxuICAgICAgLy8gaXQgYWZ0ZXJ3YXJkLlxyXG4gICAgICB0aGlzLmxpbmtlZEVsZW1lbnRzID0gbnVsbDtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEluIHNvbWUgY2FzZXMsIFVJIGNvbXBvbmVudHMgbmVlZCB0byBiZSB3aXJlZCB1cCB0byBhIHByaXZhdGUgKGludGVybmFsKSBQcm9wZXJ0eSB3aGljaCBzaG91bGQgbmVpdGhlciBiZVxyXG4gICAgLy8gaW5zdHJ1bWVudGVkIG5vciBsaW5rZWQuXHJcbiAgICBpZiAoIFBIRVRfSU9fRU5BQkxFRCAmJiBlbGVtZW50LmlzUGhldGlvSW5zdHJ1bWVudGVkKCkgKSB7XHJcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8TGlua2VkRWxlbWVudE9wdGlvbnMsIEVtcHR5U2VsZk9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgICAgLy8gVGhlIGxpbmthZ2UgaXMgb25seSBmZWF0dXJlZCBpZiB0aGUgcGFyZW50IGFuZCB0aGUgZWxlbWVudCBhcmUgYm90aCBhbHNvIGZlYXR1cmVkXHJcbiAgICAgICAgcGhldGlvRmVhdHVyZWQ6IHRoaXMucGhldGlvRmVhdHVyZWQgJiYgZWxlbWVudC5waGV0aW9GZWF0dXJlZFxyXG4gICAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggQXJyYXkuaXNBcnJheSggdGhpcy5saW5rZWRFbGVtZW50cyApLCAnbGlua2VkRWxlbWVudHMgc2hvdWxkIGJlIGFuIGFycmF5JyApO1xyXG5cclxuICAgICAgbGV0IHRhbmRlbTogVGFuZGVtIHwgbnVsbCA9IG51bGw7XHJcbiAgICAgIGlmICggcHJvdmlkZWRPcHRpb25zICYmIHByb3ZpZGVkT3B0aW9ucy50YW5kZW0gKSB7XHJcbiAgICAgICAgdGFuZGVtID0gcHJvdmlkZWRPcHRpb25zLnRhbmRlbTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggcHJvdmlkZWRPcHRpb25zICYmIHByb3ZpZGVkT3B0aW9ucy50YW5kZW1OYW1lICkge1xyXG4gICAgICAgIHRhbmRlbSA9IHRoaXMudGFuZGVtLmNyZWF0ZVRhbmRlbSggcHJvdmlkZWRPcHRpb25zLnRhbmRlbU5hbWUgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggIXByb3ZpZGVkT3B0aW9ucyAmJiBlbGVtZW50LnRhbmRlbSApIHtcclxuICAgICAgICB0YW5kZW0gPSB0aGlzLnRhbmRlbS5jcmVhdGVUYW5kZW0oIGVsZW1lbnQudGFuZGVtLm5hbWUgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCB0YW5kZW0gKSB7XHJcbiAgICAgICAgb3B0aW9ucy50YW5kZW0gPSB0YW5kZW07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMubGlua2VkRWxlbWVudHMhLnB1c2goIG5ldyBMaW5rZWRFbGVtZW50KCBlbGVtZW50LCBvcHRpb25zICkgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZSBhbGwgbGlua2VkIGVsZW1lbnRzIGxpbmtpbmcgdG8gdGhlIHByb3ZpZGVkIFBoZXRpb09iamVjdC4gVGhpcyB3aWxsIGRpc3Bvc2UgYWxsIHJlbW92ZWQgTGlua2VkRWxlbWVudHMuIFRoaXNcclxuICAgKiB3aWxsIGJlIGdyYWNlZnVsLCBhbmQgZG9lc24ndCBhc3N1bWUgb3IgYXNzZXJ0IHRoYXQgdGhlIHByb3ZpZGVkIFBoZXRpb09iamVjdCBoYXMgTGlua2VkRWxlbWVudChzKSwgaXQgd2lsbCBqdXN0XHJcbiAgICogcmVtb3ZlIHRoZW0gaWYgdGhleSBhcmUgdGhlcmUuXHJcbiAgICovXHJcbiAgcHVibGljIHJlbW92ZUxpbmtlZEVsZW1lbnRzKCBwb3RlbnRpYWxseUxpbmtlZEVsZW1lbnQ6IFBoZXRpb09iamVjdCApOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpICYmIHRoaXMubGlua2VkRWxlbWVudHMgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHBvdGVudGlhbGx5TGlua2VkRWxlbWVudC5pc1BoZXRpb0luc3RydW1lbnRlZCgpICk7XHJcblxyXG4gICAgICBjb25zdCB0b1JlbW92ZSA9IHRoaXMubGlua2VkRWxlbWVudHMuZmlsdGVyKCBsaW5rZWRFbGVtZW50ID0+IGxpbmtlZEVsZW1lbnQuZWxlbWVudCA9PT0gcG90ZW50aWFsbHlMaW5rZWRFbGVtZW50ICk7XHJcbiAgICAgIHRvUmVtb3ZlLmZvckVhY2goIGxpbmtlZEVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGxpbmtlZEVsZW1lbnQuZGlzcG9zZSgpO1xyXG4gICAgICAgIGFycmF5UmVtb3ZlKCB0aGlzLmxpbmtlZEVsZW1lbnRzISwgbGlua2VkRWxlbWVudCApO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQZXJmb3JtcyBjbGVhbnVwIGFmdGVyIHRoZSBzaW0ncyBjb25zdHJ1Y3Rpb24gaGFzIGZpbmlzaGVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBvblNpbXVsYXRpb25Db25zdHJ1Y3Rpb25Db21wbGV0ZWQoKTogdm9pZCB7XHJcblxyXG4gICAgLy8gZGVsZXRlcyB0aGUgcGhldGlvQmFzZWxpbmVNZXRhZGF0YSwgYXMgaXQncyBubyBsb25nZXIgbmVlZGVkIHNpbmNlIHZhbGlkYXRpb24gaXMgY29tcGxldGUuXHJcbiAgICB0aGlzLnBoZXRpb0Jhc2VsaW5lTWV0YWRhdGEgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT3ZlcnJpZGVhYmxlIHNvIHRoYXQgc3ViY2xhc3NlcyBjYW4gcmV0dXJuIGEgZGlmZmVyZW50IFBoZXRpb09iamVjdCBmb3Igc3R1ZGlvIGF1dG9zZWxlY3QuIFRoaXMgbWV0aG9kIGlzIGNhbGxlZFxyXG4gICAqIHdoZW4gdGhlcmUgaXMgYSBzY2VuZSBncmFwaCBoaXQuIFJldHVybiB0aGUgY29ycmVzcG9uZGluZyB0YXJnZXQgdGhhdCBtYXRjaGVzIHRoZSBQaEVULWlPIGZpbHRlcnMuICBOb3RlIHRoaXMgbWVhbnNcclxuICAgKiB0aGF0IGlmIFBoRVQtaU8gU3R1ZGlvIGlzIGxvb2tpbmcgZm9yIGEgZmVhdHVyZWQgaXRlbSBhbmQgdGhpcyBpcyBub3QgZmVhdHVyZWQsIGl0IHdpbGwgcmV0dXJuICdwaGV0aW9Ob3RTZWxlY3RhYmxlJy5cclxuICAgKiBTb21ldGhpbmcgaXMgJ3BoZXRpb05vdFNlbGVjdGFibGUnIGlmIGl0IGlzIG5vdCBpbnN0cnVtZW50ZWQgb3IgaWYgaXQgZG9lcyBub3QgbWF0Y2ggdGhlIFwiZmVhdHVyZWRcIiBmaWx0ZXJpbmcuXHJcbiAgICpcclxuICAgKiBUaGUgYGZyb21MaW5raW5nYCBmbGFnIGFsbG93cyBhIGN1dG9mZiB0byBwcmV2ZW50IHJlY3Vyc2l2ZSBsaW5raW5nIGNoYWlucyBpbiAnbGlua2VkJyBtb2RlLiBHaXZlbiB0aGVzZSBsaW5rZWQgZWxlbWVudHM6XHJcbiAgICogY2FyZE5vZGUgLT4gY2FyZCAtPiBjYXJkVmFsdWVQcm9wZXJ0eVxyXG4gICAqIFdlIGRvbid0IHdhbnQgJ2xpbmtlZCcgbW9kZSB0byBtYXAgZnJvbSBjYXJkTm9kZSBhbGwgdGhlIHdheSB0byBjYXJkVmFsdWVQcm9wZXJ0eSAoYXQgbGVhc3QgYXV0b21hdGljYWxseSksIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvdGFuZGVtL2lzc3Vlcy8zMDBcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0UGhldGlvTW91c2VIaXRUYXJnZXQoIGZyb21MaW5raW5nID0gZmFsc2UgKTogUGhldGlvT2JqZWN0IHwgJ3BoZXRpb05vdFNlbGVjdGFibGUnIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHBoZXQudGFuZGVtLnBoZXRpb0VsZW1lbnRTZWxlY3Rpb25Qcm9wZXJ0eS52YWx1ZSAhPT0gJ25vbmUnLCAnZ2V0UGhldGlvTW91c2VIaXRUYXJnZXQgc2hvdWxkIG5vdCBiZSBjYWxsZWQgd2hlbiBwaGV0aW9FbGVtZW50U2VsZWN0aW9uUHJvcGVydHkgaXMgbm9uZScgKTtcclxuXHJcbiAgICAvLyBEb24ndCBnZXQgYSBsaW5rZWQgZWxlbWVudCBmb3IgYSBsaW5rZWQgZWxlbWVudCAocmVjdXJzaXZlIGxpbmsgZWxlbWVudCBzZWFyY2hpbmcpXHJcbiAgICBpZiAoICFmcm9tTGlua2luZyAmJiBwaGV0LnRhbmRlbS5waGV0aW9FbGVtZW50U2VsZWN0aW9uUHJvcGVydHkudmFsdWUgPT09ICdsaW5rZWQnICkge1xyXG4gICAgICBjb25zdCBsaW5rZWRFbGVtZW50ID0gdGhpcy5nZXRDb3JyZXNwb25kaW5nTGlua2VkRWxlbWVudCgpO1xyXG4gICAgICBpZiAoIGxpbmtlZEVsZW1lbnQgIT09ICdub0NvcnJlc3BvbmRpbmdMaW5rZWRFbGVtZW50JyApIHtcclxuICAgICAgICByZXR1cm4gbGlua2VkRWxlbWVudC5nZXRQaGV0aW9Nb3VzZUhpdFRhcmdldCggdHJ1ZSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCB0aGlzLnRhbmRlbS5wYXJlbnRUYW5kZW0gKSB7XHJcbiAgICAgICAgLy8gTG9vayBmb3IgYSBzaWJsaW5nIGxpbmtlZEVsZW1lbnQgaWYgdGhlcmUgYXJlIG5vIGNoaWxkIGxpbmthZ2VzLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3N0dWRpby9pc3N1ZXMvMjQ2I2lzc3VlY29tbWVudC0xMDE4NzMzNDA4XHJcblxyXG4gICAgICAgIGNvbnN0IHBhcmVudDogUGhldGlvT2JqZWN0IHwgdW5kZWZpbmVkID0gcGhldC5waGV0aW8ucGhldGlvRW5naW5lLnBoZXRpb0VsZW1lbnRNYXBbIHRoaXMudGFuZGVtLnBhcmVudFRhbmRlbS5waGV0aW9JRCBdO1xyXG4gICAgICAgIGlmICggcGFyZW50ICkge1xyXG4gICAgICAgICAgY29uc3QgbGlua2VkUGFyZW50RWxlbWVudCA9IHBhcmVudC5nZXRDb3JyZXNwb25kaW5nTGlua2VkRWxlbWVudCgpO1xyXG4gICAgICAgICAgaWYgKCBsaW5rZWRQYXJlbnRFbGVtZW50ICE9PSAnbm9Db3JyZXNwb25kaW5nTGlua2VkRWxlbWVudCcgKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBsaW5rZWRQYXJlbnRFbGVtZW50LmdldFBoZXRpb01vdXNlSGl0VGFyZ2V0KCB0cnVlICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBPdGhlcndpc2UgZmFsbCBiYWNrIHRvIHRoZSB2aWV3IGVsZW1lbnQsIGRvbid0IHJldHVybiBoZXJlXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBwaGV0LnRhbmRlbS5waGV0aW9FbGVtZW50U2VsZWN0aW9uUHJvcGVydHkudmFsdWUgPT09ICdzdHJpbmcnICkge1xyXG4gICAgICByZXR1cm4gJ3BoZXRpb05vdFNlbGVjdGFibGUnO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzLmdldFBoZXRpb01vdXNlSGl0VGFyZ2V0U2VsZigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGV0ZXJtaW5lIGlmIHRoaXMgaW5zdGFuY2Ugc2hvdWxkIGJlIHNlbGVjdGFibGVcclxuICAgKi9cclxuICBwcm90ZWN0ZWQgZ2V0UGhldGlvTW91c2VIaXRUYXJnZXRTZWxmKCk6IFBoZXRpb09iamVjdCB8ICdwaGV0aW9Ob3RTZWxlY3RhYmxlJyB7XHJcbiAgICByZXR1cm4gdGhpcy5pc1BoZXRpb01vdXNlSGl0U2VsZWN0YWJsZSgpID8gdGhpcyA6ICdwaGV0aW9Ob3RTZWxlY3RhYmxlJztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZhY3RvcmVkIG91dCBmdW5jdGlvbiByZXR1cm5pbmcgaWYgdGhpcyBpbnN0YW5jZSBpcyBwaGV0aW8gc2VsZWN0YWJsZVxyXG4gICAqL1xyXG4gIHByaXZhdGUgaXNQaGV0aW9Nb3VzZUhpdFNlbGVjdGFibGUoKTogYm9vbGVhbiB7XHJcblxyXG4gICAgLy8gV2UgYXJlIG5vdCBzZWxlY3RhYmxlIGlmIHdlIGFyZSB1bmZlYXR1cmVkIGFuZCB3ZSBhcmUgb25seSBkaXNwbGF5aW5nIGZlYXR1cmVkIGVsZW1lbnRzLlxyXG4gICAgLy8gVG8gcHJldmVudCBhIGNpcmN1bGFyIGRlcGVuZGVuY3kuIFdlIG5lZWQgdG8gaGF2ZSBhIFByb3BlcnR5ICh3aGljaCBpcyBhIFBoZXRpb09iamVjdCkgaW4gb3JkZXIgdG8gdXNlIGl0LlxyXG4gICAgLy8gVGhpcyBzaG91bGQgcmVtYWluIGEgaGFyZCBmYWlsdXJlIGlmIHdlIGhhdmUgbm90IGxvYWRlZCB0aGlzIGRpc3BsYXkgUHJvcGVydHkgYnkgdGhlIHRpbWUgd2Ugd2FudCBhIG1vdXNlLWhpdCB0YXJnZXQuXHJcbiAgICBjb25zdCBmZWF0dXJlZEZpbHRlckNvcnJlY3QgPSBwaGV0LnRhbmRlbS5waGV0aW9FbGVtZW50c0Rpc3BsYXlQcm9wZXJ0eS52YWx1ZSAhPT0gJ2ZlYXR1cmVkJyB8fCB0aGlzLmlzRGlzcGxheWVkSW5GZWF0dXJlZFRyZWUoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpICYmIGZlYXR1cmVkRmlsdGVyQ29ycmVjdDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoaXMgZnVuY3Rpb24gZGV0ZXJtaW5lcyBub3Qgb25seSBpZiB0aGlzIFBoZXRpb09iamVjdCBpcyBwaGV0aW9GZWF0dXJlZCwgYnV0IGlmIGFueSBkZXNjZW5kYW50IG9mIHRoaXNcclxuICAgKiBQaGV0aW9PYmplY3QgaXMgcGhldGlvRmVhdHVyZWQsIHRoaXMgd2lsbCBpbmZsdWVuY2UgaWYgdGhpcyBpbnN0YW5jZSBpcyBkaXNwbGF5ZWQgd2hpbGUgc2hvd2luZyBwaGV0aW9GZWF0dXJlZCxcclxuICAgKiBzaW5jZSBmZWF0dXJlZCBjaGlsZHJlbiB3aWxsIGNhdXNlIHRoZSBwYXJlbnQgdG8gYmUgZGlzcGxheWVkIGFzIHdlbGwuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBpc0Rpc3BsYXllZEluRmVhdHVyZWRUcmVlKCk6IGJvb2xlYW4ge1xyXG4gICAgaWYgKCB0aGlzLmlzUGhldGlvSW5zdHJ1bWVudGVkKCkgJiYgdGhpcy5waGV0aW9GZWF0dXJlZCApIHtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBsZXQgZGlzcGxheWVkID0gZmFsc2U7XHJcbiAgICB0aGlzLnRhbmRlbS5pdGVyYXRlRGVzY2VuZGFudHMoIGRlc2NlbmRhbnRUYW5kZW0gPT4ge1xyXG4gICAgICBjb25zdCBwYXJlbnQ6IFBoZXRpb09iamVjdCB8IHVuZGVmaW5lZCA9IHBoZXQucGhldGlvLnBoZXRpb0VuZ2luZS5waGV0aW9FbGVtZW50TWFwWyBkZXNjZW5kYW50VGFuZGVtLnBoZXRpb0lEIF07XHJcbiAgICAgIGlmICggcGFyZW50ICYmIHBhcmVudC5pc1BoZXRpb0luc3RydW1lbnRlZCgpICYmIHBhcmVudC5waGV0aW9GZWF0dXJlZCApIHtcclxuICAgICAgICBkaXNwbGF5ZWQgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgICByZXR1cm4gZGlzcGxheWVkO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWNxdWlyZSB0aGUgbGlua2VkRWxlbWVudCB0aGF0IG1vc3QgY2xvc2VseSByZWxhdGVzIHRvIHRoaXMgUGhldGlvT2JqZWN0LCBnaXZlbiBzb21lIGhldXJpc3RpY3MuIEZpcnN0LCBpZiB0aGVyZSBpc1xyXG4gICAqIG9ubHkgYSBzaW5nbGUgTGlua2VkRWxlbWVudCBjaGlsZCwgdXNlIHRoYXQuIE90aGVyd2lzZSwgc2VsZWN0IGhhcmQgY29kZWQgbmFtZXMgdGhhdCBhcmUgbGlrZWx5IHRvIGJlIG1vc3QgaW1wb3J0YW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDb3JyZXNwb25kaW5nTGlua2VkRWxlbWVudCgpOiBQaGV0aW9PYmplY3QgfCAnbm9Db3JyZXNwb25kaW5nTGlua2VkRWxlbWVudCcge1xyXG4gICAgY29uc3QgY2hpbGRyZW4gPSBPYmplY3Qua2V5cyggdGhpcy50YW5kZW0uY2hpbGRyZW4gKTtcclxuICAgIGNvbnN0IGxpbmtlZENoaWxkcmVuOiBMaW5rZWRFbGVtZW50W10gPSBbXTtcclxuICAgIGNoaWxkcmVuLmZvckVhY2goIGNoaWxkTmFtZSA9PiB7XHJcbiAgICAgIGNvbnN0IGNoaWxkUGhldGlvSUQgPSBwaGV0aW8uUGhldGlvSURVdGlscy5hcHBlbmQoIHRoaXMudGFuZGVtLnBoZXRpb0lELCBjaGlsZE5hbWUgKTtcclxuXHJcbiAgICAgIC8vIE5vdGUgdGhhdCBpZiBpdCBkb2Vzbid0IGZpbmQgYSBwaGV0aW9JRCwgdGhhdCBtYXkgYmUgYSBzeW50aGV0aWMgbm9kZSB3aXRoIGNoaWxkcmVuIGJ1dCBub3QgaXRzZWxmIGluc3RydW1lbnRlZC5cclxuICAgICAgY29uc3QgcGhldGlvT2JqZWN0OiBQaGV0aW9PYmplY3QgfCB1bmRlZmluZWQgPSBwaGV0LnBoZXRpby5waGV0aW9FbmdpbmUucGhldGlvRWxlbWVudE1hcFsgY2hpbGRQaGV0aW9JRCBdO1xyXG4gICAgICBpZiAoIHBoZXRpb09iamVjdCBpbnN0YW5jZW9mIExpbmtlZEVsZW1lbnQgKSB7XHJcbiAgICAgICAgbGlua2VkQ2hpbGRyZW4ucHVzaCggcGhldGlvT2JqZWN0ICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICAgIGNvbnN0IGxpbmtlZFRhbmRlbU5hbWVzID0gbGlua2VkQ2hpbGRyZW4ubWFwKCAoIGxpbmtlZEVsZW1lbnQ6IExpbmtlZEVsZW1lbnQgKTogc3RyaW5nID0+IHtcclxuICAgICAgcmV0dXJuIHBoZXRpby5QaGV0aW9JRFV0aWxzLmdldENvbXBvbmVudE5hbWUoIGxpbmtlZEVsZW1lbnQucGhldGlvSUQgKTtcclxuICAgIH0gKTtcclxuICAgIGxldCBsaW5rZWRDaGlsZDogTGlua2VkRWxlbWVudCB8IG51bGwgPSBudWxsO1xyXG4gICAgaWYgKCBsaW5rZWRDaGlsZHJlbi5sZW5ndGggPT09IDEgKSB7XHJcbiAgICAgIGxpbmtlZENoaWxkID0gbGlua2VkQ2hpbGRyZW5bIDAgXTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBsaW5rZWRUYW5kZW1OYW1lcy5pbmNsdWRlcyggJ3Byb3BlcnR5JyApICkge1xyXG5cclxuICAgICAgLy8gUHJpb3JpdGl6ZSBhIGxpbmtlZCBjaGlsZCBuYW1lZCBcInByb3BlcnR5XCJcclxuICAgICAgbGlua2VkQ2hpbGQgPSBsaW5rZWRDaGlsZHJlblsgbGlua2VkVGFuZGVtTmFtZXMuaW5kZXhPZiggJ3Byb3BlcnR5JyApIF07XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggbGlua2VkVGFuZGVtTmFtZXMuaW5jbHVkZXMoICd2YWx1ZVByb3BlcnR5JyApICkge1xyXG5cclxuICAgICAgLy8gTmV4dCBwcmlvcml0aXplIFwidmFsdWVQcm9wZXJ0eVwiLCBhIGNvbW1vbiBuYW1lIGZvciB0aGUgY29udHJvbGxpbmcgUHJvcGVydHkgb2YgYSB2aWV3IGNvbXBvbmVudFxyXG4gICAgICBsaW5rZWRDaGlsZCA9IGxpbmtlZENoaWxkcmVuWyBsaW5rZWRUYW5kZW1OYW1lcy5pbmRleE9mKCAndmFsdWVQcm9wZXJ0eScgKSBdO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcblxyXG4gICAgICAvLyBFaXRoZXIgdGhlcmUgYXJlIG5vIGxpbmtlZCBjaGlsZHJlbiwgb3IgdG9vIG1hbnkgdG8ga25vdyB3aGljaCBvbmUgdG8gc2VsZWN0LlxyXG4gICAgICByZXR1cm4gJ25vQ29ycmVzcG9uZGluZ0xpbmtlZEVsZW1lbnQnO1xyXG4gICAgfVxyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGxpbmtlZENoaWxkLCAncGhldGlvRWxlbWVudCBpcyBuZWVkZWQnICk7XHJcbiAgICByZXR1cm4gbGlua2VkQ2hpbGQuZWxlbWVudDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZSB0aGlzIHBoZXRpb09iamVjdCBmcm9tIFBoRVQtaU8uIEFmdGVyIGRpc3Bvc2FsLCB0aGlzIG9iamVjdCBpcyBubyBsb25nZXIgaW50ZXJvcGVyYWJsZS4gQWxzbyByZWxlYXNlIGFueVxyXG4gICAqIG90aGVyIHJlZmVyZW5jZXMgY3JlYXRlZCBkdXJpbmcgaXRzIGxpZmV0aW1lLlxyXG4gICAqXHJcbiAgICogSW4gb3JkZXIgdG8gc3VwcG9ydCB0aGUgc3RydWN0dXJlZCBkYXRhIHN0cmVhbSwgUGhldGlvT2JqZWN0cyBtdXN0IGVuZCB0aGUgbWVzc2FnZXMgaW4gdGhlIGNvcnJlY3RcclxuICAgKiBzZXF1ZW5jZSwgd2l0aG91dCBiZWluZyBpbnRlcnJ1cHRlZCBieSBkaXNwb3NlKCkgY2FsbHMuICBUaGVyZWZvcmUsIHdlIGRvIG5vdCBjbGVhciBvdXQgYW55IG9mIHRoZSBzdGF0ZVxyXG4gICAqIHJlbGF0ZWQgdG8gdGhlIGVuZEV2ZW50LiAgTm90ZSB0aGlzIG1lYW5zIGl0IGlzIGFjY2VwdGFibGUgKGFuZCBleHBlY3RlZCkgZm9yIGVuZEV2ZW50KCkgdG8gYmUgY2FsbGVkIG9uXHJcbiAgICogZGlzcG9zZWQgUGhldGlvT2JqZWN0cy5cclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuXHJcbiAgICAvLyBUaGUgcGhldGlvRXZlbnQgc3RhY2sgc2hvdWxkIHJlc29sdmUgYnkgdGhlIG5leHQgZnJhbWUsIHNvIHRoYXQncyB3aGVuIHdlIGNoZWNrIGl0LlxyXG4gICAgaWYgKCBhc3NlcnQgJiYgVGFuZGVtLlBIRVRfSU9fRU5BQkxFRCAmJiB0aGlzLnRhbmRlbS5zdXBwbGllZCApIHtcclxuXHJcbiAgICAgIGNvbnN0IGRlc2NlbmRhbnRzOiBQaGV0aW9PYmplY3RbXSA9IFtdO1xyXG4gICAgICB0aGlzLnRhbmRlbS5pdGVyYXRlRGVzY2VuZGFudHMoIHRhbmRlbSA9PiB7XHJcbiAgICAgICAgaWYgKCBwaGV0LnBoZXRpby5waGV0aW9FbmdpbmUuaGFzUGhldGlvT2JqZWN0KCB0YW5kZW0ucGhldGlvSUQgKSApIHtcclxuICAgICAgICAgIGRlc2NlbmRhbnRzLnB1c2goIHBoZXQucGhldGlvLnBoZXRpb0VuZ2luZS5nZXRQaGV0aW9FbGVtZW50KCB0YW5kZW0ucGhldGlvSUQgKSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG5cclxuICAgICAgYW5pbWF0aW9uRnJhbWVUaW1lci5ydW5Pbk5leHRUaWNrKCAoKSA9PiB7XHJcblxyXG4gICAgICAgIC8vIFVuaW5zdHJ1bWVudGVkIFBoZXRpb09iamVjdHMgZG9uJ3QgaGF2ZSBhIHBoZXRpb01lc3NhZ2VTdGFjayBhdHRyaWJ1dGUuXHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMuaGFzT3duUHJvcGVydHkoICdwaGV0aW9NZXNzYWdlU3RhY2snICkgfHwgdGhpcy5waGV0aW9NZXNzYWdlU3RhY2subGVuZ3RoID09PSAwLFxyXG4gICAgICAgICAgJ3BoZXRpb01lc3NhZ2VTdGFjayBzaG91bGQgYmUgY2xlYXInICk7XHJcblxyXG4gICAgICAgIGRlc2NlbmRhbnRzLmZvckVhY2goIGRlc2NlbmRhbnQgPT4ge1xyXG4gICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggZGVzY2VuZGFudC5pc0Rpc3Bvc2VkLCBgQWxsIGRlc2NlbmRhbnRzIG11c3QgYmUgZGlzcG9zZWQgYnkgdGhlIG5leHQgZnJhbWU6ICR7ZGVzY2VuZGFudC50YW5kZW0ucGhldGlvSUR9YCApO1xyXG4gICAgICAgIH0gKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggRU5BQkxFX0RFU0NSSVBUSU9OX1JFR0lTVFJZICYmIHRoaXMudGFuZGVtICYmIHRoaXMudGFuZGVtLnN1cHBsaWVkICkge1xyXG4gICAgICBEZXNjcmlwdGlvblJlZ2lzdHJ5LnJlbW92ZSggdGhpcyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERldGFjaCBmcm9tIGxpc3RlbmVycyBhbmQgZGlzcG9zZSB0aGUgY29ycmVzcG9uZGluZyB0YW5kZW0uIFRoaXMgbXVzdCBoYXBwZW4gaW4gUGhFVC1pTyBicmFuZCBhbmQgUGhFVCBicmFuZFxyXG4gICAgLy8gYmVjYXVzZSBpbiBQaEVUIGJyYW5kLCBQaGV0aW9EeW5hbWljRWxlbWVudENvbnRhaW5lciBkeW5hbWljIGVsZW1lbnRzIHdvdWxkIG1lbW9yeSBsZWFrIHRhbmRlbXMgKHBhcmVudCB0YW5kZW1zXHJcbiAgICAvLyB3b3VsZCByZXRhaW4gcmVmZXJlbmNlcyB0byB0aGVpciBjaGlsZHJlbikuXHJcbiAgICB0aGlzLnRhbmRlbS5yZW1vdmVQaGV0aW9PYmplY3QoIHRoaXMgKTtcclxuXHJcbiAgICAvLyBEaXNwb3NlIExpbmtlZEVsZW1lbnRzXHJcbiAgICBpZiAoIHRoaXMubGlua2VkRWxlbWVudHMgKSB7XHJcbiAgICAgIHRoaXMubGlua2VkRWxlbWVudHMuZm9yRWFjaCggbGlua2VkRWxlbWVudCA9PiBsaW5rZWRFbGVtZW50LmRpc3Bvc2UoKSApO1xyXG4gICAgICB0aGlzLmxpbmtlZEVsZW1lbnRzLmxlbmd0aCA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgc3VwZXIuZGlzcG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSlNPTmlmaWFibGUgbWV0YWRhdGEgdGhhdCBkZXNjcmliZXMgdGhlIG5hdHVyZSBvZiB0aGUgUGhldGlvT2JqZWN0LiAgV2UgbXVzdCBiZSBhYmxlIHRvIHJlYWQgdGhpc1xyXG4gICAqIGZvciBiYXNlbGluZSAoYmVmb3JlIG9iamVjdCBmdWxseSBjb25zdHJ1Y3RlZCB3ZSB1c2Ugb2JqZWN0KSBhbmQgYWZ0ZXIgZnVsbHkgY29uc3RydWN0ZWRcclxuICAgKiB3aGljaCBpbmNsdWRlcyBvdmVycmlkZXMuXHJcbiAgICogQHBhcmFtIFtvYmplY3RdIC0gdXNlZCB0byBnZXQgbWV0YWRhdGEga2V5cywgY2FuIGJlIGEgUGhldGlvT2JqZWN0LCBvciBhbiBvcHRpb25zIG9iamVjdFxyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAoc2VlIHVzYWdlIGluaXRpYWxpemVQaGV0aW9PYmplY3QpLiBJZiBub3QgcHJvdmlkZWQsIHdpbGwgaW5zdGVhZCB1c2UgdGhlIHZhbHVlIG9mIFwidGhpc1wiXHJcbiAgICogQHJldHVybnMgLSBtZXRhZGF0YSBwbHVja2VkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TWV0YWRhdGEoIG9iamVjdD86IFBoZXRpb09iamVjdE1ldGFkYXRhSW5wdXQgKTogUGhldGlvRWxlbWVudE1ldGFkYXRhIHtcclxuICAgIG9iamVjdCA9IG9iamVjdCB8fCB0aGlzO1xyXG4gICAgY29uc3QgbWV0YWRhdGE6IFBoZXRpb0VsZW1lbnRNZXRhZGF0YSA9IHtcclxuICAgICAgcGhldGlvVHlwZU5hbWU6IG9iamVjdC5waGV0aW9UeXBlLnR5cGVOYW1lLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiBvYmplY3QucGhldGlvRG9jdW1lbnRhdGlvbixcclxuICAgICAgcGhldGlvU3RhdGU6IG9iamVjdC5waGV0aW9TdGF0ZSxcclxuICAgICAgcGhldGlvUmVhZE9ubHk6IG9iamVjdC5waGV0aW9SZWFkT25seSxcclxuICAgICAgcGhldGlvRXZlbnRUeXBlOiBFdmVudFR5cGUucGhldGlvVHlwZS50b1N0YXRlT2JqZWN0KCBvYmplY3QucGhldGlvRXZlbnRUeXBlICksXHJcbiAgICAgIHBoZXRpb0hpZ2hGcmVxdWVuY3k6IG9iamVjdC5waGV0aW9IaWdoRnJlcXVlbmN5LFxyXG4gICAgICBwaGV0aW9QbGF5YmFjazogb2JqZWN0LnBoZXRpb1BsYXliYWNrLFxyXG4gICAgICBwaGV0aW9EeW5hbWljRWxlbWVudDogb2JqZWN0LnBoZXRpb0R5bmFtaWNFbGVtZW50LFxyXG4gICAgICBwaGV0aW9Jc0FyY2hldHlwZTogb2JqZWN0LnBoZXRpb0lzQXJjaGV0eXBlLFxyXG4gICAgICBwaGV0aW9GZWF0dXJlZDogb2JqZWN0LnBoZXRpb0ZlYXR1cmVkLFxyXG4gICAgICBwaGV0aW9EZXNpZ25lZDogb2JqZWN0LnBoZXRpb0Rlc2lnbmVkXHJcbiAgICB9O1xyXG4gICAgaWYgKCBvYmplY3QucGhldGlvQXJjaGV0eXBlUGhldGlvSUQgKSB7XHJcblxyXG4gICAgICBtZXRhZGF0YS5waGV0aW9BcmNoZXR5cGVQaGV0aW9JRCA9IG9iamVjdC5waGV0aW9BcmNoZXR5cGVQaGV0aW9JRDtcclxuICAgIH1cclxuICAgIHJldHVybiBtZXRhZGF0YTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYyBmYWNpbmcgZG9jdW1lbnRhdGlvbiwgbm8gbmVlZCB0byBpbmNsdWRlIG1ldGFkYXRhIHRoYXQgbWF5IHdlIGRvbid0IHdhbnQgY2xpZW50cyBrbm93aW5nIGFib3V0XHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBNRVRBREFUQV9ET0NVTUVOVEFUSU9OID0gJ0dldCBtZXRhZGF0YSBhYm91dCB0aGUgUGhFVC1pTyBFbGVtZW50LiBUaGlzIGluY2x1ZGVzIHRoZSBmb2xsb3dpbmcga2V5czo8dWw+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxsaT48c3Ryb25nPnBoZXRpb1R5cGVOYW1lOjwvc3Ryb25nPiBUaGUgbmFtZSBvZiB0aGUgUGhFVC1pTyBUeXBlXFxuPC9saT4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGxpPjxzdHJvbmc+cGhldGlvRG9jdW1lbnRhdGlvbjo8L3N0cm9uZz4gZGVmYXVsdCAtIG51bGwuIFVzZWZ1bCBub3RlcyBhYm91dCBhIFBoRVQtaU8gRWxlbWVudCwgc2hvd24gaW4gdGhlIFBoRVQtaU8gU3R1ZGlvIFdyYXBwZXI8L2xpPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8bGk+PHN0cm9uZz5waGV0aW9TdGF0ZTo8L3N0cm9uZz4gZGVmYXVsdCAtIHRydWUuIFdoZW4gdHJ1ZSwgaW5jbHVkZXMgdGhlIFBoRVQtaU8gRWxlbWVudCBpbiB0aGUgUGhFVC1pTyBzdGF0ZVxcbjwvbGk+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxsaT48c3Ryb25nPnBoZXRpb1JlYWRPbmx5Ojwvc3Ryb25nPiBkZWZhdWx0IC0gZmFsc2UuIFdoZW4gdHJ1ZSwgeW91IGNhbiBvbmx5IGdldCB2YWx1ZXMgZnJvbSB0aGUgUGhFVC1pTyBFbGVtZW50OyBubyBzZXR0aW5nIGFsbG93ZWQuXFxuPC9saT4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGxpPjxzdHJvbmc+cGhldGlvRXZlbnRUeXBlOjwvc3Ryb25nPiBkZWZhdWx0IC0gTU9ERUwuIFRoZSBjYXRlZ29yeSBvZiBldmVudCB0aGF0IHRoaXMgZWxlbWVudCBlbWl0cyB0byB0aGUgUGhFVC1pTyBEYXRhIFN0cmVhbS5cXG48L2xpPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8bGk+PHN0cm9uZz5waGV0aW9EeW5hbWljRWxlbWVudDo8L3N0cm9uZz4gZGVmYXVsdCAtIGZhbHNlLiBJZiB0aGlzIGVsZW1lbnQgaXMgYSBcImR5bmFtaWMgZWxlbWVudFwiIHRoYXQgY2FuIGJlIGNyZWF0ZWQgYW5kIGRlc3Ryb3llZCB0aHJvdWdob3V0IHRoZSBsaWZldGltZSBvZiB0aGUgc2ltIChhcyBvcHBvc2VkIHRvIGV4aXN0aW5nIGZvcmV2ZXIpLlxcbjwvbGk+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxsaT48c3Ryb25nPnBoZXRpb0lzQXJjaGV0eXBlOjwvc3Ryb25nPiBkZWZhdWx0IC0gZmFsc2UuIElmIHRoaXMgZWxlbWVudCBpcyBhbiBhcmNoZXR5cGUgZm9yIGEgZHluYW1pYyBlbGVtZW50LlxcbjwvbGk+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxsaT48c3Ryb25nPnBoZXRpb0ZlYXR1cmVkOjwvc3Ryb25nPiBkZWZhdWx0IC0gZmFsc2UuIElmIHRoaXMgaXMgYSBmZWF0dXJlZCBQaEVULWlPIEVsZW1lbnQuXFxuPC9saT4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGxpPjxzdHJvbmc+cGhldGlvQXJjaGV0eXBlUGhldGlvSUQ6PC9zdHJvbmc+IGRlZmF1bHQgLSBcXCdcXCcuIElmIGFuIGFwcGxpY2FibGUgZHluYW1pYyBlbGVtZW50LCB0aGlzIGlzIHRoZSBwaGV0aW9JRCBvZiBpdHMgYXJjaGV0eXBlLlxcbjwvbGk+PC91bD4nO1xyXG5cclxuXHJcbiAgcHVibGljIHN0YXRpYyBjcmVhdGUoIG9wdGlvbnM/OiBQaGV0aW9PYmplY3RPcHRpb25zICk6IFBoZXRpb09iamVjdCB7XHJcbiAgICByZXR1cm4gbmV3IFBoZXRpb09iamVjdCggb3B0aW9ucyApO1xyXG4gIH1cclxufVxyXG5cclxuLy8gU2VlIGRvY3VtZW50YXRpb24gZm9yIGFkZExpbmtlZEVsZW1lbnQoKSB0byBkZXNjcmliZSBob3cgdG8gaW5zdHJ1bWVudCBMaW5rZWRFbGVtZW50cy4gTm8gb3RoZXIgbWV0YWRhdGEgaXMgbmVlZGVkXHJcbi8vIGZvciBMaW5rZWRFbGVtZW50cywgYW5kIHNob3VsZCBpbnN0ZWFkIGJlIHByb3ZpZGVkIHRvIHRoZSBjb3JlRWxlbWVudC4gSWYgeW91IGZpbmQgYSBjYXNlIHdoZXJlIHlvdSB3YW50IHRvIHBhc3NcclxuLy8gYW5vdGhlciBvcHRpb24gdGhyb3VnaCwgcGxlYXNlIGRpc2N1c3Mgd2l0aCB5b3VyIGZyaWVuZGx5LCBuZWlnaGJvcmhvb2QgUGhFVC1pTyBkZXZlbG9wZXIuXHJcbnR5cGUgTGlua2VkRWxlbWVudE9wdGlvbnMgPSAoIHsgdGFuZGVtTmFtZT86IHN0cmluZzsgdGFuZGVtPzogbmV2ZXIgfSB8IHsgdGFuZGVtTmFtZT86IG5ldmVyOyB0YW5kZW0/OiBUYW5kZW0gfSApO1xyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGNsYXNzIHRvIGF2b2lkIGN5Y2xpYyBkZXBlbmRlbmNpZXMuXHJcbiAqL1xyXG5jbGFzcyBMaW5rZWRFbGVtZW50IGV4dGVuZHMgUGhldGlvT2JqZWN0IHtcclxuICBwdWJsaWMgcmVhZG9ubHkgZWxlbWVudDogUGhldGlvT2JqZWN0O1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIGNvcmVFbGVtZW50OiBQaGV0aW9PYmplY3QsIHByb3ZpZGVkT3B0aW9ucz86IExpbmtlZEVsZW1lbnRPcHRpb25zICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggISFjb3JlRWxlbWVudCwgJ2NvcmVFbGVtZW50IHNob3VsZCBiZSBkZWZpbmVkJyApO1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8TGlua2VkRWxlbWVudE9wdGlvbnMsIEVtcHR5U2VsZk9wdGlvbnMsIFBoZXRpb09iamVjdE9wdGlvbnM+KCkoIHtcclxuICAgICAgcGhldGlvVHlwZTogTGlua2VkRWxlbWVudElPLFxyXG4gICAgICBwaGV0aW9TdGF0ZTogdHJ1ZSxcclxuXHJcbiAgICAgIC8vIEJ5IGRlZmF1bHQsIExpbmtlZEVsZW1lbnRzIGFyZSBhcyBmZWF0dXJlZCBhcyB0aGVpciBjb3JlRWxlbWVudHMgYXJlLlxyXG4gICAgICBwaGV0aW9GZWF0dXJlZDogY29yZUVsZW1lbnQucGhldGlvRmVhdHVyZWRcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIC8vIFJlZmVyZW5jZXMgY2Fubm90IGJlIGNoYW5nZWQgYnkgUGhFVC1pT1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIW9wdGlvbnMuaGFzT3duUHJvcGVydHkoICdwaGV0aW9SZWFkT25seScgKSwgJ3BoZXRpb1JlYWRPbmx5IHNldCBieSBMaW5rZWRFbGVtZW50JyApO1xyXG4gICAgb3B0aW9ucy5waGV0aW9SZWFkT25seSA9IHRydWU7XHJcblxyXG4gICAgc3VwZXIoIG9wdGlvbnMgKTtcclxuXHJcbiAgICB0aGlzLmVsZW1lbnQgPSBjb3JlRWxlbWVudDtcclxuICB9XHJcbn1cclxuXHJcbnRhbmRlbU5hbWVzcGFjZS5yZWdpc3RlciggJ1BoZXRpb09iamVjdCcsIFBoZXRpb09iamVjdCApO1xyXG5leHBvcnQgeyBQaGV0aW9PYmplY3QgYXMgZGVmYXVsdCwgTGlua2VkRWxlbWVudCB9OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxtQkFBbUIsTUFBTSxzQ0FBc0M7QUFFdEUsT0FBT0MsUUFBUSxNQUFNLDJCQUEyQjtBQUNoRCxPQUFPQyxXQUFXLE1BQU0sbUNBQW1DO0FBQzNELE9BQU9DLDhCQUE4QixNQUFNLHNEQUFzRDtBQUNqRyxPQUFPQyxLQUFLLE1BQU0sNkJBQTZCO0FBQy9DLE9BQU9DLFNBQVMsSUFBSUMsY0FBYyxRQUE2QyxpQ0FBaUM7QUFDaEgsT0FBT0MsU0FBUyxNQUFNLGdCQUFnQjtBQUN0QyxPQUFPQyxlQUFlLE1BQU0sc0JBQXNCO0FBQ2xELE9BQU9DLG1CQUFtQixNQUFNLDBCQUEwQjtBQUMxRCxPQUFPQyxNQUFNLE1BQU0sYUFBYTtBQUNoQyxPQUFPQyxlQUFlLE1BQTJDLHNCQUFzQjtBQUN2RixPQUFPQyxlQUFlLE1BQU0sc0JBQXNCO0FB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