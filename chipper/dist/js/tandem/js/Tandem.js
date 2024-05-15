// Copyright 2015-2024, University of Colorado Boulder

/**
 * Tandem defines a set of trees that are used to assign unique identifiers to PhetioObjects in PhET simulations and
 * notify listeners when the associated PhetioObjects have been added/removed. It is used to support PhET-iO.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import arrayRemove from '../../phet-core/js/arrayRemove.js';
import merge from '../../phet-core/js/merge.js';
import optionize from '../../phet-core/js/optionize.js';
import TandemConstants from './TandemConstants.js';
import tandemNamespace from './tandemNamespace.js';

// constants
// Tandem can't depend on joist, so cannot use packageJSON module
const packageJSON = _.hasIn(window, 'phet.chipper.packageObject') ? phet.chipper.packageObject : {
  name: 'placeholder'
};
const PHET_IO_ENABLED = _.hasIn(window, 'phet.preloads.phetio');
const PRINT_MISSING_TANDEMS = PHET_IO_ENABLED && phet.preloads.phetio.queryParameters.phetioPrintMissingTandems;

// Validation defaults to true, but can be overridden to be false in package.json.
const IS_VALIDATION_DEFAULT = _.hasIn(packageJSON, 'phet.phet-io.validation') ? !!packageJSON.phet['phet-io'].validation : true;

// The default value for validation can be overridden with a query parameter ?phetioValidation={true|false}.
const IS_VALIDATION_QUERY_PARAMETER_SPECIFIED = window.QueryStringMachine && QueryStringMachine.containsKey('phetioValidation');
const IS_VALIDATION_SPECIFIED = PHET_IO_ENABLED && IS_VALIDATION_QUERY_PARAMETER_SPECIFIED ? !!phet.preloads.phetio.queryParameters.phetioValidation : PHET_IO_ENABLED && IS_VALIDATION_DEFAULT;
const VALIDATION = PHET_IO_ENABLED && IS_VALIDATION_SPECIFIED && !PRINT_MISSING_TANDEMS;
const UNALLOWED_TANDEM_NAMES = ['pickableProperty',
// use inputEnabled instead

// in https://github.com/phetsims/phet-io/issues/1915 we decided to prefer the scenery listener types
// ('dragListener' etc). If you encounter this and feel like inputListener is preferable, let's discuss!
'inputListener', 'dragHandler' // prefer dragListener
];
const REQUIRED_TANDEM_NAME = 'requiredTandem';
const OPTIONAL_TANDEM_NAME = 'optionalTandem';
const FORBIDDEN_SUPPLIED_TANDEM_NAMES = [REQUIRED_TANDEM_NAME, OPTIONAL_TANDEM_NAME];
const TEST_TANDEM_NAME = 'test';
const INTER_TERM_SEPARATOR = phetio.PhetioIDUtils.INTER_TERM_SEPARATOR;
export const DYNAMIC_ARCHETYPE_NAME = phetio.PhetioIDUtils.ARCHETYPE;

// used to keep track of missing tandems
const missingTandems = {
  required: [],
  optional: []
};
// Listeners that will be notified when items are registered/deregistered. See doc in addPhetioObjectListener
const phetioObjectListeners = [];

// keep track of listeners to fire when Tandem.launch() is called.
const launchListeners = [];
class Tandem {
  // Treat as readonly.  Only marked as writable so it can be eliminated on dispose

  // the last part of the tandem (after the last .), used e.g., in Joist for creating button
  // names dynamically based on screen names

  // phet-io internal, please don't use this. Please.
  children = {};
  isDisposed = false;
  static SCREEN_TANDEM_NAME_SUFFIX = 'Screen';

  /**
   * Typically, sims will create tandems using `tandem.createTandem`.  This constructor is used internally or when
   * a tandem must be created from scratch.
   *
   * @param parentTandem - parent for a child tandem, or null for a root tandem
   * @param name - component name for this level, like 'resetAllButton'
   * @param [providedOptions]
   */
  constructor(parentTandem, name, providedOptions) {
    assert && assert(parentTandem === null || parentTandem instanceof Tandem, 'parentTandem should be null or Tandem');
    assert && assert(name !== Tandem.METADATA_KEY, 'name cannot match Tandem.METADATA_KEY');
    this.parentTandem = parentTandem;
    this.name = name;
    this.phetioID = this.parentTandem ? window.phetio.PhetioIDUtils.append(this.parentTandem.phetioID, this.name) : this.name;

    // options (even subtype options) must be stored so they can be passed through to children
    // Note: Make sure that added options here are also added to options for inheritance and/or for composition
    // (createTandem/parentTandem/getExtendedOptions) as appropriate.
    const options = optionize()({
      // required === false means it is an optional tandem
      required: true,
      // if the tandem is required but not supplied, an error will be thrown.
      supplied: true,
      isValidTandemName: name => Tandem.getRegexFromCharacterClass().test(name)
    }, providedOptions);
    assert && assert(options.isValidTandemName(name), `invalid tandem name: ${name}`);
    assert && assert(!options.supplied || FORBIDDEN_SUPPLIED_TANDEM_NAMES.every(forbiddenName => !name.includes(forbiddenName)), `forbidden supplied tandem name: ${name}. If a tandem is not supplied, its name should not be used to create a supplied tandem.`);
    this.children = {};
    if (this.parentTandem) {
      assert && assert(!this.parentTandem.hasChild(name), `parent should not have child: ${name}`);
      this.parentTandem.addChild(name, this);
    }
    this.required = options.required;
    this.supplied = options.supplied;
  }

  // Get the regex to test for a valid tandem name, given the char class for your specific tandem. In the regex
  // language. In this function we will wrap it in `[]+` brackets forming the actual "class".
  static getRegexFromCharacterClass(tandemCharacterClass = TandemConstants.BASE_TANDEM_CHARACTER_CLASS) {
    return new RegExp(`^[${tandemCharacterClass}]+$`);
  }

  /**
   * If the provided tandem is not supplied, support the ?printMissingTandems query parameter for extra logging during
   * initial instrumentation.
   */
  static onMissingTandem(tandem) {
    // When the query parameter phetioPrintMissingTandems is true, report tandems that are required but not supplied
    if (PRINT_MISSING_TANDEMS && !tandem.supplied) {
      const stackTrace = Tandem.captureStackTrace();
      if (tandem.required) {
        missingTandems.required.push({
          phetioID: tandem.phetioID,
          stack: stackTrace
        });
      } else {
        // When the query parameter phetioPrintMissingTandems is true, report tandems that are optional but not
        // supplied, but not for Fonts because they are too numerous.
        if (!stackTrace.includes('Font')) {
          missingTandems.optional.push({
            phetioID: tandem.phetioID,
            stack: stackTrace
          });
        }
      }
    }
  }

  /**
   * Get a stack trace from a new instance of an Error(). This also uses window.Error.stackTraceLimit to expand the
   * length of the stack trace. This can be useful in spots where the stack is the only information we have about
   * where we are in common code (like for knowing where to provide a Tandem  for PhET-iO instrumentation).
   * @param limit - set to Error.stackTraceLimit just for a single stack trace, then return to the previous value after.
   */
  static captureStackTrace(limit = Infinity) {
    // Check if Error.stackTraceLimit exists and is writable
    const descriptor = Object.getOwnPropertyDescriptor(Error, 'stackTraceLimit');
    const stackTraceWritable = descriptor && (descriptor.writable || descriptor.set && typeof descriptor.set === 'function');
    if (stackTraceWritable) {
      // Save the original stackTraceLimit before changing it
      // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
      // @ts-ignore
      const originalStackTraceLimit = Error.stackTraceLimit;

      // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
      // @ts-ignore
      Error.stackTraceLimit = limit;
      const stackTrace = new Error().stack;

      // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
      // @ts-ignore
      Error.stackTraceLimit = originalStackTraceLimit;
      return stackTrace;
    } else {
      return new Error().stack;
    }
  }

  /**
   * Adds a PhetioObject.  For example, it could be an axon Property, SCENERY/Node or SUN/RoundPushButton.
   * phetioEngine listens for when PhetioObjects are added and removed to keep track of them for PhET-iO.
   */
  addPhetioObject(phetioObject) {
    if (PHET_IO_ENABLED) {
      // Throw an error if the tandem is required but not supplied
      assert && Tandem.VALIDATION && assert(!(this.required && !this.supplied), 'Tandem was required but not supplied');

      // If tandem is optional and not supplied, then ignore it.
      if (!this.required && !this.supplied) {
        // Optionally instrumented types without tandems are not added.
        return;
      }
      if (!Tandem.launched) {
        Tandem.bufferedPhetioObjects.push(phetioObject);
      } else {
        for (let i = 0; i < phetioObjectListeners.length; i++) {
          phetioObjectListeners[i].addPhetioObject(phetioObject);
        }
      }
    }
  }

  /**
   * Returns true if this Tandem has the specified ancestor Tandem.
   */
  hasAncestor(ancestor) {
    return this.parentTandem === ancestor || !!(this.parentTandem && this.parentTandem.hasAncestor(ancestor));
  }

  /**
   * Removes a PhetioObject and signifies to listeners that it has been removed.
   */
  removePhetioObject(phetioObject) {
    // No need to handle this case for uninstrumented objects being removed
    if (!this.supplied) {
      return;
    }

    // Only active when running as phet-io
    if (PHET_IO_ENABLED) {
      if (!Tandem.launched) {
        assert && assert(Tandem.bufferedPhetioObjects.includes(phetioObject), 'should contain item');
        arrayRemove(Tandem.bufferedPhetioObjects, phetioObject);
      } else {
        for (let i = 0; i < phetioObjectListeners.length; i++) {
          phetioObjectListeners[i].removePhetioObject(phetioObject);
        }
      }
    }
    phetioObject.tandem.dispose();
  }

  /**
   * Used for creating new tandems, extends this Tandem's options with the passed-in options.
   */
  getExtendedOptions(options) {
    // Any child of something should be passed all inherited options. Make sure that this extend call includes all
    // that make sense from the constructor's extend call.
    return merge({
      supplied: this.supplied,
      required: this.required
    }, options);
  }

  /**
   * Create a new Tandem by appending the given id, or if the child Tandem already exists, return it instead.
   */
  createTandem(name, options) {
    assert && Tandem.VALIDATION && assert(!UNALLOWED_TANDEM_NAMES.includes(name), 'tandem name is not allowed: ' + name);
    options = this.getExtendedOptions(options);

    // re-use the child if it already exists, but make sure it behaves the same.
    if (this.hasChild(name)) {
      const currentChild = this.children[name];
      assert && assert(currentChild.required === options.required);
      assert && assert(currentChild.supplied === options.supplied);
      return currentChild;
    } else {
      return new Tandem(this, name, options); // eslint-disable-line bad-sim-text
    }
  }

  /**
   * Create a new Tandem by indexing with the specified index.  Note that it increments by 1 so that index 0 is
   * "1" in the tandem name.
   * For example:
   * - createTandem( 'foo', 0 ) => 'foo1'
   */
  createTandem1Indexed(name, index, options) {
    return this.createTandem(`${name}${index + 1}`, options);
  }
  hasChild(name) {
    return this.children.hasOwnProperty(name);
  }
  addChild(name, tandem) {
    assert && assert(!this.hasChild(name));
    this.children[name] = tandem;
  }

  /**
   * Fire a callback on all descendants of this Tandem
   */
  iterateDescendants(callback) {
    for (const childName in this.children) {
      if (this.children.hasOwnProperty(childName)) {
        callback(this.children[childName]);
        this.children[childName].iterateDescendants(callback);
      }
    }
  }
  removeChild(childName) {
    assert && assert(this.hasChild(childName));
    delete this.children[childName];
  }
  dispose() {
    assert && assert(!this.isDisposed, 'already disposed');
    this.parentTandem.removeChild(this.name);
    this.parentTandem = null;
    this.isDisposed = true;
  }

  /**
   * For API validation, each PhetioObject has a corresponding archetype PhetioObject for comparison. Non-dynamic
   * PhetioObjects have the trivial case where its archetypal phetioID is the same as its phetioID.
   */
  getArchetypalPhetioID() {
    return window.phetio.PhetioIDUtils.getArchetypalPhetioID(this.phetioID);
  }

  /**
   * Creates a group tandem for creating multiple indexed child tandems, such as:
   * sim.screen.model.electron0
   * sim.screen.model.electron1
   *
   * In this case, 'sim.screen.model.electron' is the string passed to createGroupTandem.
   *
   * Used for arrays, observable arrays, or when many elements of the same type are created and they do not otherwise
   * have unique identifiers.
   */
  createGroupTandem(name) {
    if (this.children[name]) {
      return this.children[name];
    }
    return new GroupTandem(this, name);
  }
  equals(tandem) {
    return this.phetioID === tandem.phetioID;
  }

  /**
   * Adds a listener that will be notified when items are registered/deregistered
   */
  static addPhetioObjectListener(phetioObjectListener) {
    phetioObjectListeners.push(phetioObjectListener);
  }

  /**
   * After all listeners have been added, then Tandem can be launched.  This registers all of the buffered PhetioObjects
   * and subsequent PhetioObjects will be registered directly.
   */
  static launch() {
    assert && assert(!Tandem.launched, 'Tandem cannot be launched twice');
    Tandem.launched = true;
    while (launchListeners.length > 0) {
      launchListeners.shift()();
    }
    assert && assert(launchListeners.length === 0);
  }

  /**
   * ONLY FOR TESTING!!!!
   * This was created to "undo" launch so that tests can better expose cases around calling Tandem.launch()
   */
  static unlaunch() {
    Tandem.launched = false;
    Tandem.bufferedPhetioObjects.length = 0;
    launchListeners.length = 0;
  }

  /**
   * Add a listener that will fire when Tandem is launched
   */
  static addLaunchListener(listener) {
    assert && assert(!Tandem.launched, 'tandem has already been launched, cannot add listener for that hook.');
    launchListeners.push(listener);
  }

  /**
   * Expose collected missing tandems only populated from specific query parameter, see phetioPrintMissingTandems
   * (phet-io internal)
   */
  static missingTandems = missingTandems;

  /**
   * If PhET-iO is enabled in this runtime.
   */
  static PHET_IO_ENABLED = PHET_IO_ENABLED;

  /**
   * When generating an API (whether to output a file or for in-memory comparison), this is marked as true.
   */
  static API_GENERATION = Tandem.PHET_IO_ENABLED && (phet.preloads.phetio.queryParameters.phetioPrintAPI || phet.preloads.phetio.queryParameters.phetioCompareAPI);

  /**
   * If PhET-iO is running with validation enabled.
   */
  static VALIDATION = VALIDATION;

  /**
   * For the API file, the key name for the metadata section.
   */
  static METADATA_KEY = '_metadata';

  /**
   * For the API file, the key name for the data section.
   */
  static DATA_KEY = '_data';

  // Before listeners are wired up, tandems are buffered.  When listeners are wired up, Tandem.launch() is called and
  // buffered tandems are flushed, then subsequent tandems are delivered to listeners directly
  static launched = false;

  // a list of PhetioObjects ready to be sent out to listeners, but can't because Tandem hasn't been launched yet.
  static bufferedPhetioObjects = [];
  createTandemFromPhetioID(phetioID) {
    return this.createTandem(phetioID.split(window.phetio.PhetioIDUtils.SEPARATOR).join(INTER_TERM_SEPARATOR), {
      isValidTandemName: name => Tandem.getRegexFromCharacterClass(TandemConstants.BASE_DERIVED_TANDEM_CHARACTER_CLASS).test(name)
    });
  }
  static RootTandem = class RootTandem extends Tandem {
    /**
     * RootTandems only accept specifically named children.
     */
    createTandem(name, options) {
      if (Tandem.VALIDATION) {
        const allowedOnRoot = name === window.phetio.PhetioIDUtils.GLOBAL_COMPONENT_NAME || name === REQUIRED_TANDEM_NAME || name === OPTIONAL_TANDEM_NAME || name === TEST_TANDEM_NAME || name === window.phetio.PhetioIDUtils.GENERAL_COMPONENT_NAME || _.endsWith(name, Tandem.SCREEN_TANDEM_NAME_SUFFIX);
        assert && assert(allowedOnRoot, `tandem name not allowed on root: "${name}"; perhaps try putting it under general or global`);
      }
      return super.createTandem(name, options);
    }
  };

  /**
   * The root tandem for a simulation
   */
  static ROOT = new Tandem.RootTandem(null, _.camelCase(packageJSON.name));

  /**
   * Many simulation elements are nested under "general". This tandem is for elements that exists in all sims. For a
   * place to put simulation specific globals, see `GLOBAL`
   *
   * @constant
   * @type {Tandem}
   */
  static GENERAL = Tandem.ROOT.createTandem(window.phetio.PhetioIDUtils.GENERAL_COMPONENT_NAME);

  /**
   * Used in unit tests
   */
  static ROOT_TEST = Tandem.ROOT.createTandem(TEST_TANDEM_NAME);

  /**
   * Tandem for model simulation elements that are general to all sims.
   */
  static GENERAL_MODEL = Tandem.GENERAL.createTandem(window.phetio.PhetioIDUtils.MODEL_COMPONENT_NAME);

  /**
   * Tandem for view simulation elements that are general to all sims.
   */
  static GENERAL_VIEW = Tandem.GENERAL.createTandem(window.phetio.PhetioIDUtils.VIEW_COMPONENT_NAME);

  /**
   * Tandem for controller simulation elements that are general to all sims.
   */
  static GENERAL_CONTROLLER = Tandem.GENERAL.createTandem(window.phetio.PhetioIDUtils.CONTROLLER_COMPONENT_NAME);

  /**
   * Simulation elements that don't belong in screens should be nested under "global". Note that this tandem should only
   * have simulation specific elements in them. Instrument items used by all sims under `Tandem.GENERAL`. Most
   * likely simulations elements should not be directly under this, but instead either under the model or view sub
   * tandems.
   *
   * @constant
   * @type {Tandem}
   */
  static GLOBAL = Tandem.ROOT.createTandem(window.phetio.PhetioIDUtils.GLOBAL_COMPONENT_NAME);

  /**
   * Model simulation elements that don't belong in specific screens should be nested under this Tandem. Note that this
   * tandem should only have simulation specific elements in them.
   */
  static GLOBAL_MODEL = Tandem.GLOBAL.createTandem(window.phetio.PhetioIDUtils.MODEL_COMPONENT_NAME);

  /**
   * View simulation elements that don't belong in specific screens should be nested under this Tandem. Note that this
   * tandem should only have simulation specific elements in them.
   */
  static GLOBAL_VIEW = Tandem.GLOBAL.createTandem(window.phetio.PhetioIDUtils.VIEW_COMPONENT_NAME);

  /**
   * Colors used in the simulation.
   */
  static COLORS = Tandem.GLOBAL_VIEW.createTandem(window.phetio.PhetioIDUtils.COLORS_COMPONENT_NAME);

  /**
   * Colors used in the simulation.
   */

  static STRINGS = Tandem.GENERAL_MODEL.createTandem(window.phetio.PhetioIDUtils.STRINGS_COMPONENT_NAME);

  /**
   * Get the Tandem location for model strings. Provide the camelCased repo name for where the string should be
   * organized. This will default to the sim's name. See https://github.com/phetsims/tandem/issues/298
   */
  static getStringsTandem(moduleName = Tandem.ROOT.name) {
    return Tandem.STRINGS.createTandem(moduleName);
  }

  /**
   * Get the Tandem location for derived model strings. Provide the camelCased repo name for where the string should be
   * organized. This will default to the sim's name. See https://github.com/phetsims/tandem/issues/298
   */
  static getDerivedStringsTandem(moduleName = Tandem.ROOT.name) {
    return Tandem.getStringsTandem(moduleName).createTandem('derivedStrings');
  }

  /**
   * In TypeScript, optionize already knows that `tandem` may be undefined, just use `options.tandem?` See https://github.com/phetsims/tandem/issues/289
   * Used to indicate a common code component that supports tandem, but doesn't require it.  If a tandem is not
   * passed in, then it will not be instrumented.
   */
  static OPTIONAL = Tandem.ROOT.createTandem(OPTIONAL_TANDEM_NAME, {
    required: false,
    supplied: false
  });

  /**
   * To be used exclusively to opt out of situations where a tandem is required, see https://github.com/phetsims/tandem/issues/97.
   */
  static OPT_OUT = Tandem.OPTIONAL;

  /**
   * Some common code (such as Checkbox or RadioButton) must always be instrumented.
   */
  static REQUIRED = Tandem.ROOT.createTandem(REQUIRED_TANDEM_NAME, {
    // let phetioPrintMissingTandems bypass this
    required: VALIDATION || PRINT_MISSING_TANDEMS,
    supplied: false
  });

  /**
   * Use this as the parent tandem for Properties that are related to sim-specific preferences.
   */
  static PREFERENCES = Tandem.GLOBAL_MODEL.createTandem('preferences');
}
Tandem.addLaunchListener(() => {
  while (Tandem.bufferedPhetioObjects.length > 0) {
    const phetioObject = Tandem.bufferedPhetioObjects.shift();
    phetioObject.tandem.addPhetioObject(phetioObject);
  }
  assert && assert(Tandem.bufferedPhetioObjects.length === 0, 'bufferedPhetioObjects should be empty');
});

/**
 * Group Tandem -- Declared in the same file to avoid circular reference errors in module loading.
 */
class GroupTandem extends Tandem {
  // for generating indices from a pool

  /**
   * create with Tandem.createGroupTandem
   */
  constructor(parentTandem, name) {
    super(parentTandem, name);
    this.groupName = name;
    this.groupMemberIndex = 0;
  }

  /**
   * Creates the next tandem in the group.
   */
  createNextTandem() {
    const tandem = this.parentTandem.createTandem(`${this.groupName}${this.groupMemberIndex}`);
    this.groupMemberIndex++;
    return tandem;
  }
}
tandemNamespace.register('Tandem', Tandem);
export default Tandem;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhcnJheVJlbW92ZSIsIm1lcmdlIiwib3B0aW9uaXplIiwiVGFuZGVtQ29uc3RhbnRzIiwidGFuZGVtTmFtZXNwYWNlIiwicGFja2FnZUpTT04iLCJfIiwiaGFzSW4iLCJ3aW5kb3ciLCJwaGV0IiwiY2hpcHBlciIsInBhY2thZ2VPYmplY3QiLCJuYW1lIiwiUEhFVF9JT19FTkFCTEVEIiwiUFJJTlRfTUlTU0lOR19UQU5ERU1TIiwicHJlbG9hZHMiLCJwaGV0aW8iLCJxdWVyeVBhcmFtZXRlcnMiLCJwaGV0aW9QcmludE1pc3NpbmdUYW5kZW1zIiwiSVNfVkFMSURBVElPTl9ERUZBVUxUIiwidmFsaWRhdGlvbiIsIklTX1ZBTElEQVRJT05fUVVFUllfUEFSQU1FVEVSX1NQRUNJRklFRCIsIlF1ZXJ5U3RyaW5nTWFjaGluZSIsImNvbnRhaW5zS2V5IiwiSVNfVkFMSURBVElPTl9TUEVDSUZJRUQiLCJwaGV0aW9WYWxpZGF0aW9uIiwiVkFMSURBVElPTiIsIlVOQUxMT1dFRF9UQU5ERU1fTkFNRVMiLCJSRVFVSVJFRF9UQU5ERU1fTkFNRSIsIk9QVElPTkFMX1RBTkRFTV9OQU1FIiwiRk9SQklEREVOX1NVUFBMSUVEX1RBTkRFTV9OQU1FUyIsIlRFU1RfVEFOREVNX05BTUUiLCJJTlRFUl9URVJNX1NFUEFSQVRPUiIsIlBoZXRpb0lEVXRpbHMiLCJEWU5BTUlDX0FSQ0hFVFlQRV9OQU1FIiwiQVJDSEVUWVBFIiwibWlzc2luZ1RhbmRlbXMiLCJyZXF1aXJlZCIsIm9wdGlvbmFsIiwicGhldGlvT2JqZWN0TGlzdGVuZXJzIiwibGF1bmNoTGlzdGVuZXJzIiwiVGFuZGVtIiwiY2hpbGRyZW4iLCJpc0Rpc3Bvc2VkIiwiU0NSRUVOX1RBTkRFTV9OQU1FX1NVRkZJWCIsImNvbnN0cnVjdG9yIiwicGFyZW50VGFuZGVtIiwicHJvdmlkZWRPcHRpb25zIiwiYXNzZXJ0IiwiTUVUQURBVEFfS0VZIiwicGhldGlvSUQiLCJhcHBlbmQiLCJvcHRpb25zIiwic3VwcGxpZWQiLCJpc1ZhbGlkVGFuZGVtTmFtZSIsImdldFJlZ2V4RnJvbUNoYXJhY3RlckNsYXNzIiwidGVzdCIsImV2ZXJ5IiwiZm9yYmlkZGVuTmFtZSIsImluY2x1ZGVzIiwiaGFzQ2hpbGQiLCJhZGRDaGlsZCIsInRhbmRlbUNoYXJhY3RlckNsYXNzIiwiQkFTRV9UQU5ERU1fQ0hBUkFDVEVSX0NMQVNTIiwiUmVnRXhwIiwib25NaXNzaW5nVGFuZGVtIiwidGFuZGVtIiwic3RhY2tUcmFjZSIsImNhcHR1cmVTdGFja1RyYWNlIiwicHVzaCIsInN0YWNrIiwibGltaXQiLCJJbmZpbml0eSIsImRlc2NyaXB0b3IiLCJPYmplY3QiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJFcnJvciIsInN0YWNrVHJhY2VXcml0YWJsZSIsIndyaXRhYmxlIiwic2V0Iiwib3JpZ2luYWxTdGFja1RyYWNlTGltaXQiLCJzdGFja1RyYWNlTGltaXQiLCJhZGRQaGV0aW9PYmplY3QiLCJwaGV0aW9PYmplY3QiLCJsYXVuY2hlZCIsImJ1ZmZlcmVkUGhldGlvT2JqZWN0cyIsImkiLCJsZW5ndGgiLCJoYXNBbmNlc3RvciIsImFuY2VzdG9yIiwicmVtb3ZlUGhldGlvT2JqZWN0IiwiZGlzcG9zZSIsImdldEV4dGVuZGVkT3B0aW9ucyIsImNyZWF0ZVRhbmRlbSIsImN1cnJlbnRDaGlsZCIsImNyZWF0ZVRhbmRlbTFJbmRleGVkIiwiaW5kZXgiLCJoYXNPd25Qcm9wZXJ0eSIsIml0ZXJhdGVEZXNjZW5kYW50cyIsImNhbGxiYWNrIiwiY2hpbGROYW1lIiwicmVtb3ZlQ2hpbGQiLCJnZXRBcmNoZXR5cGFsUGhldGlvSUQiLCJjcmVhdGVHcm91cFRhbmRlbSIsIkdyb3VwVGFuZGVtIiwiZXF1YWxzIiwiYWRkUGhldGlvT2JqZWN0TGlzdGVuZXIiLCJwaGV0aW9PYmplY3RMaXN0ZW5lciIsImxhdW5jaCIsInNoaWZ0IiwidW5sYXVuY2giLCJhZGRMYXVuY2hMaXN0ZW5lciIsImxpc3RlbmVyIiwiQVBJX0dFTkVSQVRJT04iLCJwaGV0aW9QcmludEFQSSIsInBoZXRpb0NvbXBhcmVBUEkiLCJEQVRBX0tFWSIsImNyZWF0ZVRhbmRlbUZyb21QaGV0aW9JRCIsInNwbGl0IiwiU0VQQVJBVE9SIiwiam9pbiIsIkJBU0VfREVSSVZFRF9UQU5ERU1fQ0hBUkFDVEVSX0NMQVNTIiwiUm9vdFRhbmRlbSIsImFsbG93ZWRPblJvb3QiLCJHTE9CQUxfQ09NUE9ORU5UX05BTUUiLCJHRU5FUkFMX0NPTVBPTkVOVF9OQU1FIiwiZW5kc1dpdGgiLCJST09UIiwiY2FtZWxDYXNlIiwiR0VORVJBTCIsIlJPT1RfVEVTVCIsIkdFTkVSQUxfTU9ERUwiLCJNT0RFTF9DT01QT05FTlRfTkFNRSIsIkdFTkVSQUxfVklFVyIsIlZJRVdfQ09NUE9ORU5UX05BTUUiLCJHRU5FUkFMX0NPTlRST0xMRVIiLCJDT05UUk9MTEVSX0NPTVBPTkVOVF9OQU1FIiwiR0xPQkFMIiwiR0xPQkFMX01PREVMIiwiR0xPQkFMX1ZJRVciLCJDT0xPUlMiLCJDT0xPUlNfQ09NUE9ORU5UX05BTUUiLCJTVFJJTkdTIiwiU1RSSU5HU19DT01QT05FTlRfTkFNRSIsImdldFN0cmluZ3NUYW5kZW0iLCJtb2R1bGVOYW1lIiwiZ2V0RGVyaXZlZFN0cmluZ3NUYW5kZW0iLCJPUFRJT05BTCIsIk9QVF9PVVQiLCJSRVFVSVJFRCIsIlBSRUZFUkVOQ0VTIiwiZ3JvdXBOYW1lIiwiZ3JvdXBNZW1iZXJJbmRleCIsImNyZWF0ZU5leHRUYW5kZW0iLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlRhbmRlbS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNS0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBUYW5kZW0gZGVmaW5lcyBhIHNldCBvZiB0cmVlcyB0aGF0IGFyZSB1c2VkIHRvIGFzc2lnbiB1bmlxdWUgaWRlbnRpZmllcnMgdG8gUGhldGlvT2JqZWN0cyBpbiBQaEVUIHNpbXVsYXRpb25zIGFuZFxyXG4gKiBub3RpZnkgbGlzdGVuZXJzIHdoZW4gdGhlIGFzc29jaWF0ZWQgUGhldGlvT2JqZWN0cyBoYXZlIGJlZW4gYWRkZWQvcmVtb3ZlZC4gSXQgaXMgdXNlZCB0byBzdXBwb3J0IFBoRVQtaU8uXHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgYXJyYXlSZW1vdmUgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL2FycmF5UmVtb3ZlLmpzJztcclxuaW1wb3J0IG1lcmdlIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9tZXJnZS5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBQaGV0aW9PYmplY3QgZnJvbSAnLi9QaGV0aW9PYmplY3QuanMnO1xyXG5pbXBvcnQgVGFuZGVtQ29uc3RhbnRzLCB7IFBoZXRpb0lEIH0gZnJvbSAnLi9UYW5kZW1Db25zdGFudHMuanMnO1xyXG5pbXBvcnQgdGFuZGVtTmFtZXNwYWNlIGZyb20gJy4vdGFuZGVtTmFtZXNwYWNlLmpzJztcclxuXHJcbi8vIGNvbnN0YW50c1xyXG4vLyBUYW5kZW0gY2FuJ3QgZGVwZW5kIG9uIGpvaXN0LCBzbyBjYW5ub3QgdXNlIHBhY2thZ2VKU09OIG1vZHVsZVxyXG5jb25zdCBwYWNrYWdlSlNPTiA9IF8uaGFzSW4oIHdpbmRvdywgJ3BoZXQuY2hpcHBlci5wYWNrYWdlT2JqZWN0JyApID8gcGhldC5jaGlwcGVyLnBhY2thZ2VPYmplY3QgOiB7IG5hbWU6ICdwbGFjZWhvbGRlcicgfTtcclxuXHJcbmNvbnN0IFBIRVRfSU9fRU5BQkxFRCA9IF8uaGFzSW4oIHdpbmRvdywgJ3BoZXQucHJlbG9hZHMucGhldGlvJyApO1xyXG5jb25zdCBQUklOVF9NSVNTSU5HX1RBTkRFTVMgPSBQSEVUX0lPX0VOQUJMRUQgJiYgcGhldC5wcmVsb2Fkcy5waGV0aW8ucXVlcnlQYXJhbWV0ZXJzLnBoZXRpb1ByaW50TWlzc2luZ1RhbmRlbXM7XHJcblxyXG4vLyBWYWxpZGF0aW9uIGRlZmF1bHRzIHRvIHRydWUsIGJ1dCBjYW4gYmUgb3ZlcnJpZGRlbiB0byBiZSBmYWxzZSBpbiBwYWNrYWdlLmpzb24uXHJcbmNvbnN0IElTX1ZBTElEQVRJT05fREVGQVVMVCA9IF8uaGFzSW4oIHBhY2thZ2VKU09OLCAncGhldC5waGV0LWlvLnZhbGlkYXRpb24nICkgPyAhIXBhY2thZ2VKU09OLnBoZXRbICdwaGV0LWlvJyBdLnZhbGlkYXRpb24gOiB0cnVlO1xyXG5cclxuLy8gVGhlIGRlZmF1bHQgdmFsdWUgZm9yIHZhbGlkYXRpb24gY2FuIGJlIG92ZXJyaWRkZW4gd2l0aCBhIHF1ZXJ5IHBhcmFtZXRlciA/cGhldGlvVmFsaWRhdGlvbj17dHJ1ZXxmYWxzZX0uXHJcbmNvbnN0IElTX1ZBTElEQVRJT05fUVVFUllfUEFSQU1FVEVSX1NQRUNJRklFRCA9IHdpbmRvdy5RdWVyeVN0cmluZ01hY2hpbmUgJiYgUXVlcnlTdHJpbmdNYWNoaW5lLmNvbnRhaW5zS2V5KCAncGhldGlvVmFsaWRhdGlvbicgKTtcclxuY29uc3QgSVNfVkFMSURBVElPTl9TUEVDSUZJRUQgPSAoIFBIRVRfSU9fRU5BQkxFRCAmJiBJU19WQUxJREFUSU9OX1FVRVJZX1BBUkFNRVRFUl9TUEVDSUZJRUQgKSA/ICEhcGhldC5wcmVsb2Fkcy5waGV0aW8ucXVlcnlQYXJhbWV0ZXJzLnBoZXRpb1ZhbGlkYXRpb24gOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICggUEhFVF9JT19FTkFCTEVEICYmIElTX1ZBTElEQVRJT05fREVGQVVMVCApO1xyXG5cclxuY29uc3QgVkFMSURBVElPTiA9IFBIRVRfSU9fRU5BQkxFRCAmJiBJU19WQUxJREFUSU9OX1NQRUNJRklFRCAmJiAhUFJJTlRfTUlTU0lOR19UQU5ERU1TO1xyXG5cclxuY29uc3QgVU5BTExPV0VEX1RBTkRFTV9OQU1FUyA9IFtcclxuICAncGlja2FibGVQcm9wZXJ0eScsIC8vIHVzZSBpbnB1dEVuYWJsZWQgaW5zdGVhZFxyXG5cclxuICAvLyBpbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvMTkxNSB3ZSBkZWNpZGVkIHRvIHByZWZlciB0aGUgc2NlbmVyeSBsaXN0ZW5lciB0eXBlc1xyXG4gIC8vICgnZHJhZ0xpc3RlbmVyJyBldGMpLiBJZiB5b3UgZW5jb3VudGVyIHRoaXMgYW5kIGZlZWwgbGlrZSBpbnB1dExpc3RlbmVyIGlzIHByZWZlcmFibGUsIGxldCdzIGRpc2N1c3MhXHJcbiAgJ2lucHV0TGlzdGVuZXInLFxyXG4gICdkcmFnSGFuZGxlcicgLy8gcHJlZmVyIGRyYWdMaXN0ZW5lclxyXG5dO1xyXG5cclxuY29uc3QgUkVRVUlSRURfVEFOREVNX05BTUUgPSAncmVxdWlyZWRUYW5kZW0nO1xyXG5jb25zdCBPUFRJT05BTF9UQU5ERU1fTkFNRSA9ICdvcHRpb25hbFRhbmRlbSc7XHJcblxyXG5jb25zdCBGT1JCSURERU5fU1VQUExJRURfVEFOREVNX05BTUVTID0gW1xyXG4gIFJFUVVJUkVEX1RBTkRFTV9OQU1FLFxyXG4gIE9QVElPTkFMX1RBTkRFTV9OQU1FXHJcbl07XHJcblxyXG5jb25zdCBURVNUX1RBTkRFTV9OQU1FID0gJ3Rlc3QnO1xyXG5jb25zdCBJTlRFUl9URVJNX1NFUEFSQVRPUiA9IHBoZXRpby5QaGV0aW9JRFV0aWxzLklOVEVSX1RFUk1fU0VQQVJBVE9SO1xyXG5leHBvcnQgY29uc3QgRFlOQU1JQ19BUkNIRVRZUEVfTkFNRSA9IHBoZXRpby5QaGV0aW9JRFV0aWxzLkFSQ0hFVFlQRTtcclxuXHJcbi8vIHVzZWQgdG8ga2VlcCB0cmFjayBvZiBtaXNzaW5nIHRhbmRlbXNcclxuY29uc3QgbWlzc2luZ1RhbmRlbXM6IHtcclxuICByZXF1aXJlZDogQXJyYXk8eyBwaGV0aW9JRDogUGhldGlvSUQ7IHN0YWNrOiBzdHJpbmcgfT47XHJcbiAgb3B0aW9uYWw6IEFycmF5PHsgcGhldGlvSUQ6IFBoZXRpb0lEOyBzdGFjazogc3RyaW5nIH0+O1xyXG59ID0ge1xyXG4gIHJlcXVpcmVkOiBbXSxcclxuICBvcHRpb25hbDogW11cclxufTtcclxuXHJcbnR5cGUgUGhldGlvT2JqZWN0TGlzdGVuZXIgPSB7XHJcbiAgYWRkUGhldGlvT2JqZWN0OiAoIHBoZXRpb09iamVjdDogUGhldGlvT2JqZWN0ICkgPT4gdm9pZDtcclxuICByZW1vdmVQaGV0aW9PYmplY3Q6ICggcGhldGlvT2JqZWN0OiBQaGV0aW9PYmplY3QgKSA9PiB2b2lkO1xyXG59O1xyXG5cclxuLy8gTGlzdGVuZXJzIHRoYXQgd2lsbCBiZSBub3RpZmllZCB3aGVuIGl0ZW1zIGFyZSByZWdpc3RlcmVkL2RlcmVnaXN0ZXJlZC4gU2VlIGRvYyBpbiBhZGRQaGV0aW9PYmplY3RMaXN0ZW5lclxyXG5jb25zdCBwaGV0aW9PYmplY3RMaXN0ZW5lcnM6IEFycmF5PFBoZXRpb09iamVjdExpc3RlbmVyPiA9IFtdO1xyXG5cclxuLy8ga2VlcCB0cmFjayBvZiBsaXN0ZW5lcnMgdG8gZmlyZSB3aGVuIFRhbmRlbS5sYXVuY2goKSBpcyBjYWxsZWQuXHJcbmNvbnN0IGxhdW5jaExpc3RlbmVyczogQXJyYXk8KCkgPT4gdm9pZD4gPSBbXTtcclxuXHJcbmV4cG9ydCB0eXBlIFRhbmRlbU9wdGlvbnMgPSB7XHJcbiAgcmVxdWlyZWQ/OiBib29sZWFuO1xyXG4gIHN1cHBsaWVkPzogYm9vbGVhbjtcclxuICBpc1ZhbGlkVGFuZGVtTmFtZT86ICggbmFtZTogc3RyaW5nICkgPT4gYm9vbGVhbjtcclxufTtcclxuXHJcbmNsYXNzIFRhbmRlbSB7XHJcblxyXG4gIC8vIFRyZWF0IGFzIHJlYWRvbmx5LiAgT25seSBtYXJrZWQgYXMgd3JpdGFibGUgc28gaXQgY2FuIGJlIGVsaW1pbmF0ZWQgb24gZGlzcG9zZVxyXG4gIHB1YmxpYyBwYXJlbnRUYW5kZW06IFRhbmRlbSB8IG51bGw7XHJcblxyXG4gIC8vIHRoZSBsYXN0IHBhcnQgb2YgdGhlIHRhbmRlbSAoYWZ0ZXIgdGhlIGxhc3QgLiksIHVzZWQgZS5nLiwgaW4gSm9pc3QgZm9yIGNyZWF0aW5nIGJ1dHRvblxyXG4gIC8vIG5hbWVzIGR5bmFtaWNhbGx5IGJhc2VkIG9uIHNjcmVlbiBuYW1lc1xyXG4gIHB1YmxpYyByZWFkb25seSBuYW1lOiBzdHJpbmc7XHJcbiAgcHVibGljIHJlYWRvbmx5IHBoZXRpb0lEOiBQaGV0aW9JRDtcclxuXHJcbiAgLy8gcGhldC1pbyBpbnRlcm5hbCwgcGxlYXNlIGRvbid0IHVzZSB0aGlzLiBQbGVhc2UuXHJcbiAgcHVibGljIHJlYWRvbmx5IGNoaWxkcmVuOiBSZWNvcmQ8c3RyaW5nLCBUYW5kZW0+ID0ge307XHJcbiAgcHVibGljIHJlYWRvbmx5IHJlcXVpcmVkOiBib29sZWFuO1xyXG4gIHB1YmxpYyByZWFkb25seSBzdXBwbGllZDogYm9vbGVhbjtcclxuICBwcml2YXRlIGlzRGlzcG9zZWQgPSBmYWxzZTtcclxuXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBTQ1JFRU5fVEFOREVNX05BTUVfU1VGRklYID0gJ1NjcmVlbic7XHJcblxyXG4gIC8qKlxyXG4gICAqIFR5cGljYWxseSwgc2ltcyB3aWxsIGNyZWF0ZSB0YW5kZW1zIHVzaW5nIGB0YW5kZW0uY3JlYXRlVGFuZGVtYC4gIFRoaXMgY29uc3RydWN0b3IgaXMgdXNlZCBpbnRlcm5hbGx5IG9yIHdoZW5cclxuICAgKiBhIHRhbmRlbSBtdXN0IGJlIGNyZWF0ZWQgZnJvbSBzY3JhdGNoLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHBhcmVudFRhbmRlbSAtIHBhcmVudCBmb3IgYSBjaGlsZCB0YW5kZW0sIG9yIG51bGwgZm9yIGEgcm9vdCB0YW5kZW1cclxuICAgKiBAcGFyYW0gbmFtZSAtIGNvbXBvbmVudCBuYW1lIGZvciB0aGlzIGxldmVsLCBsaWtlICdyZXNldEFsbEJ1dHRvbidcclxuICAgKiBAcGFyYW0gW3Byb3ZpZGVkT3B0aW9uc11cclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHBhcmVudFRhbmRlbTogVGFuZGVtIHwgbnVsbCwgbmFtZTogc3RyaW5nLCBwcm92aWRlZE9wdGlvbnM/OiBUYW5kZW1PcHRpb25zICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcGFyZW50VGFuZGVtID09PSBudWxsIHx8IHBhcmVudFRhbmRlbSBpbnN0YW5jZW9mIFRhbmRlbSwgJ3BhcmVudFRhbmRlbSBzaG91bGQgYmUgbnVsbCBvciBUYW5kZW0nICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBuYW1lICE9PSBUYW5kZW0uTUVUQURBVEFfS0VZLCAnbmFtZSBjYW5ub3QgbWF0Y2ggVGFuZGVtLk1FVEFEQVRBX0tFWScgKTtcclxuXHJcbiAgICB0aGlzLnBhcmVudFRhbmRlbSA9IHBhcmVudFRhbmRlbTtcclxuICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcblxyXG4gICAgdGhpcy5waGV0aW9JRCA9IHRoaXMucGFyZW50VGFuZGVtID8gd2luZG93LnBoZXRpby5QaGV0aW9JRFV0aWxzLmFwcGVuZCggdGhpcy5wYXJlbnRUYW5kZW0ucGhldGlvSUQsIHRoaXMubmFtZSApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLm5hbWU7XHJcblxyXG4gICAgLy8gb3B0aW9ucyAoZXZlbiBzdWJ0eXBlIG9wdGlvbnMpIG11c3QgYmUgc3RvcmVkIHNvIHRoZXkgY2FuIGJlIHBhc3NlZCB0aHJvdWdoIHRvIGNoaWxkcmVuXHJcbiAgICAvLyBOb3RlOiBNYWtlIHN1cmUgdGhhdCBhZGRlZCBvcHRpb25zIGhlcmUgYXJlIGFsc28gYWRkZWQgdG8gb3B0aW9ucyBmb3IgaW5oZXJpdGFuY2UgYW5kL29yIGZvciBjb21wb3NpdGlvblxyXG4gICAgLy8gKGNyZWF0ZVRhbmRlbS9wYXJlbnRUYW5kZW0vZ2V0RXh0ZW5kZWRPcHRpb25zKSBhcyBhcHByb3ByaWF0ZS5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8VGFuZGVtT3B0aW9ucz4oKSgge1xyXG5cclxuICAgICAgLy8gcmVxdWlyZWQgPT09IGZhbHNlIG1lYW5zIGl0IGlzIGFuIG9wdGlvbmFsIHRhbmRlbVxyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuXHJcbiAgICAgIC8vIGlmIHRoZSB0YW5kZW0gaXMgcmVxdWlyZWQgYnV0IG5vdCBzdXBwbGllZCwgYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24uXHJcbiAgICAgIHN1cHBsaWVkOiB0cnVlLFxyXG5cclxuICAgICAgaXNWYWxpZFRhbmRlbU5hbWU6ICggbmFtZTogc3RyaW5nICkgPT4gVGFuZGVtLmdldFJlZ2V4RnJvbUNoYXJhY3RlckNsYXNzKCkudGVzdCggbmFtZSApXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLmlzVmFsaWRUYW5kZW1OYW1lKCBuYW1lICksIGBpbnZhbGlkIHRhbmRlbSBuYW1lOiAke25hbWV9YCApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFvcHRpb25zLnN1cHBsaWVkIHx8IEZPUkJJRERFTl9TVVBQTElFRF9UQU5ERU1fTkFNRVMuZXZlcnkoIGZvcmJpZGRlbk5hbWUgPT4gIW5hbWUuaW5jbHVkZXMoIGZvcmJpZGRlbk5hbWUgKSApLFxyXG4gICAgICBgZm9yYmlkZGVuIHN1cHBsaWVkIHRhbmRlbSBuYW1lOiAke25hbWV9LiBJZiBhIHRhbmRlbSBpcyBub3Qgc3VwcGxpZWQsIGl0cyBuYW1lIHNob3VsZCBub3QgYmUgdXNlZCB0byBjcmVhdGUgYSBzdXBwbGllZCB0YW5kZW0uYCApO1xyXG5cclxuICAgIHRoaXMuY2hpbGRyZW4gPSB7fTtcclxuXHJcbiAgICBpZiAoIHRoaXMucGFyZW50VGFuZGVtICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5wYXJlbnRUYW5kZW0uaGFzQ2hpbGQoIG5hbWUgKSwgYHBhcmVudCBzaG91bGQgbm90IGhhdmUgY2hpbGQ6ICR7bmFtZX1gICk7XHJcbiAgICAgIHRoaXMucGFyZW50VGFuZGVtLmFkZENoaWxkKCBuYW1lLCB0aGlzICk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5yZXF1aXJlZCA9IG9wdGlvbnMucmVxdWlyZWQ7XHJcbiAgICB0aGlzLnN1cHBsaWVkID0gb3B0aW9ucy5zdXBwbGllZDtcclxuXHJcbiAgfVxyXG5cclxuICAvLyBHZXQgdGhlIHJlZ2V4IHRvIHRlc3QgZm9yIGEgdmFsaWQgdGFuZGVtIG5hbWUsIGdpdmVuIHRoZSBjaGFyIGNsYXNzIGZvciB5b3VyIHNwZWNpZmljIHRhbmRlbS4gSW4gdGhlIHJlZ2V4XHJcbiAgLy8gbGFuZ3VhZ2UuIEluIHRoaXMgZnVuY3Rpb24gd2Ugd2lsbCB3cmFwIGl0IGluIGBbXStgIGJyYWNrZXRzIGZvcm1pbmcgdGhlIGFjdHVhbCBcImNsYXNzXCIuXHJcbiAgcHJvdGVjdGVkIHN0YXRpYyBnZXRSZWdleEZyb21DaGFyYWN0ZXJDbGFzcyggdGFuZGVtQ2hhcmFjdGVyQ2xhc3M6IHN0cmluZyA9IFRhbmRlbUNvbnN0YW50cy5CQVNFX1RBTkRFTV9DSEFSQUNURVJfQ0xBU1MgKTogUmVnRXhwIHtcclxuICAgIHJldHVybiBuZXcgUmVnRXhwKCBgXlske3RhbmRlbUNoYXJhY3RlckNsYXNzfV0rJGAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIElmIHRoZSBwcm92aWRlZCB0YW5kZW0gaXMgbm90IHN1cHBsaWVkLCBzdXBwb3J0IHRoZSA/cHJpbnRNaXNzaW5nVGFuZGVtcyBxdWVyeSBwYXJhbWV0ZXIgZm9yIGV4dHJhIGxvZ2dpbmcgZHVyaW5nXHJcbiAgICogaW5pdGlhbCBpbnN0cnVtZW50YXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBvbk1pc3NpbmdUYW5kZW0oIHRhbmRlbTogVGFuZGVtICk6IHZvaWQge1xyXG5cclxuICAgIC8vIFdoZW4gdGhlIHF1ZXJ5IHBhcmFtZXRlciBwaGV0aW9QcmludE1pc3NpbmdUYW5kZW1zIGlzIHRydWUsIHJlcG9ydCB0YW5kZW1zIHRoYXQgYXJlIHJlcXVpcmVkIGJ1dCBub3Qgc3VwcGxpZWRcclxuICAgIGlmICggUFJJTlRfTUlTU0lOR19UQU5ERU1TICYmICF0YW5kZW0uc3VwcGxpZWQgKSB7XHJcblxyXG4gICAgICBjb25zdCBzdGFja1RyYWNlID0gVGFuZGVtLmNhcHR1cmVTdGFja1RyYWNlKCk7XHJcblxyXG4gICAgICBpZiAoIHRhbmRlbS5yZXF1aXJlZCApIHtcclxuICAgICAgICBtaXNzaW5nVGFuZGVtcy5yZXF1aXJlZC5wdXNoKCB7IHBoZXRpb0lEOiB0YW5kZW0ucGhldGlvSUQsIHN0YWNrOiBzdGFja1RyYWNlIH0gKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuXHJcbiAgICAgICAgLy8gV2hlbiB0aGUgcXVlcnkgcGFyYW1ldGVyIHBoZXRpb1ByaW50TWlzc2luZ1RhbmRlbXMgaXMgdHJ1ZSwgcmVwb3J0IHRhbmRlbXMgdGhhdCBhcmUgb3B0aW9uYWwgYnV0IG5vdFxyXG4gICAgICAgIC8vIHN1cHBsaWVkLCBidXQgbm90IGZvciBGb250cyBiZWNhdXNlIHRoZXkgYXJlIHRvbyBudW1lcm91cy5cclxuICAgICAgICBpZiAoICFzdGFja1RyYWNlLmluY2x1ZGVzKCAnRm9udCcgKSApIHtcclxuICAgICAgICAgIG1pc3NpbmdUYW5kZW1zLm9wdGlvbmFsLnB1c2goIHsgcGhldGlvSUQ6IHRhbmRlbS5waGV0aW9JRCwgc3RhY2s6IHN0YWNrVHJhY2UgfSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IGEgc3RhY2sgdHJhY2UgZnJvbSBhIG5ldyBpbnN0YW5jZSBvZiBhbiBFcnJvcigpLiBUaGlzIGFsc28gdXNlcyB3aW5kb3cuRXJyb3Iuc3RhY2tUcmFjZUxpbWl0IHRvIGV4cGFuZCB0aGVcclxuICAgKiBsZW5ndGggb2YgdGhlIHN0YWNrIHRyYWNlLiBUaGlzIGNhbiBiZSB1c2VmdWwgaW4gc3BvdHMgd2hlcmUgdGhlIHN0YWNrIGlzIHRoZSBvbmx5IGluZm9ybWF0aW9uIHdlIGhhdmUgYWJvdXRcclxuICAgKiB3aGVyZSB3ZSBhcmUgaW4gY29tbW9uIGNvZGUgKGxpa2UgZm9yIGtub3dpbmcgd2hlcmUgdG8gcHJvdmlkZSBhIFRhbmRlbSAgZm9yIFBoRVQtaU8gaW5zdHJ1bWVudGF0aW9uKS5cclxuICAgKiBAcGFyYW0gbGltaXQgLSBzZXQgdG8gRXJyb3Iuc3RhY2tUcmFjZUxpbWl0IGp1c3QgZm9yIGEgc2luZ2xlIHN0YWNrIHRyYWNlLCB0aGVuIHJldHVybiB0byB0aGUgcHJldmlvdXMgdmFsdWUgYWZ0ZXIuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBzdGF0aWMgY2FwdHVyZVN0YWNrVHJhY2UoIGxpbWl0ID0gSW5maW5pdHkgKTogc3RyaW5nIHtcclxuXHJcbiAgICAvLyBDaGVjayBpZiBFcnJvci5zdGFja1RyYWNlTGltaXQgZXhpc3RzIGFuZCBpcyB3cml0YWJsZVxyXG4gICAgY29uc3QgZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoIEVycm9yLCAnc3RhY2tUcmFjZUxpbWl0JyApO1xyXG4gICAgY29uc3Qgc3RhY2tUcmFjZVdyaXRhYmxlID0gZGVzY3JpcHRvciAmJiAoIGRlc2NyaXB0b3Iud3JpdGFibGUgfHwgKCBkZXNjcmlwdG9yLnNldCAmJiB0eXBlb2YgZGVzY3JpcHRvci5zZXQgPT09ICdmdW5jdGlvbicgKSApO1xyXG5cclxuICAgIGlmICggc3RhY2tUcmFjZVdyaXRhYmxlICkge1xyXG5cclxuICAgICAgLy8gU2F2ZSB0aGUgb3JpZ2luYWwgc3RhY2tUcmFjZUxpbWl0IGJlZm9yZSBjaGFuZ2luZyBpdFxyXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L3ByZWZlci10cy1leHBlY3QtZXJyb3JcclxuICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICBjb25zdCBvcmlnaW5hbFN0YWNrVHJhY2VMaW1pdCA9IEVycm9yLnN0YWNrVHJhY2VMaW1pdDtcclxuXHJcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvcHJlZmVyLXRzLWV4cGVjdC1lcnJvclxyXG4gICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgIEVycm9yLnN0YWNrVHJhY2VMaW1pdCA9IGxpbWl0O1xyXG4gICAgICBjb25zdCBzdGFja1RyYWNlID0gbmV3IEVycm9yKCkuc3RhY2shO1xyXG5cclxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9wcmVmZXItdHMtZXhwZWN0LWVycm9yXHJcbiAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgRXJyb3Iuc3RhY2tUcmFjZUxpbWl0ID0gb3JpZ2luYWxTdGFja1RyYWNlTGltaXQ7XHJcbiAgICAgIHJldHVybiBzdGFja1RyYWNlO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBuZXcgRXJyb3IoKS5zdGFjayE7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGEgUGhldGlvT2JqZWN0LiAgRm9yIGV4YW1wbGUsIGl0IGNvdWxkIGJlIGFuIGF4b24gUHJvcGVydHksIFNDRU5FUlkvTm9kZSBvciBTVU4vUm91bmRQdXNoQnV0dG9uLlxyXG4gICAqIHBoZXRpb0VuZ2luZSBsaXN0ZW5zIGZvciB3aGVuIFBoZXRpb09iamVjdHMgYXJlIGFkZGVkIGFuZCByZW1vdmVkIHRvIGtlZXAgdHJhY2sgb2YgdGhlbSBmb3IgUGhFVC1pTy5cclxuICAgKi9cclxuICBwdWJsaWMgYWRkUGhldGlvT2JqZWN0KCBwaGV0aW9PYmplY3Q6IFBoZXRpb09iamVjdCApOiB2b2lkIHtcclxuXHJcbiAgICBpZiAoIFBIRVRfSU9fRU5BQkxFRCApIHtcclxuXHJcbiAgICAgIC8vIFRocm93IGFuIGVycm9yIGlmIHRoZSB0YW5kZW0gaXMgcmVxdWlyZWQgYnV0IG5vdCBzdXBwbGllZFxyXG4gICAgICBhc3NlcnQgJiYgVGFuZGVtLlZBTElEQVRJT04gJiYgYXNzZXJ0KCAhKCB0aGlzLnJlcXVpcmVkICYmICF0aGlzLnN1cHBsaWVkICksICdUYW5kZW0gd2FzIHJlcXVpcmVkIGJ1dCBub3Qgc3VwcGxpZWQnICk7XHJcblxyXG4gICAgICAvLyBJZiB0YW5kZW0gaXMgb3B0aW9uYWwgYW5kIG5vdCBzdXBwbGllZCwgdGhlbiBpZ25vcmUgaXQuXHJcbiAgICAgIGlmICggIXRoaXMucmVxdWlyZWQgJiYgIXRoaXMuc3VwcGxpZWQgKSB7XHJcblxyXG4gICAgICAgIC8vIE9wdGlvbmFsbHkgaW5zdHJ1bWVudGVkIHR5cGVzIHdpdGhvdXQgdGFuZGVtcyBhcmUgbm90IGFkZGVkLlxyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCAhVGFuZGVtLmxhdW5jaGVkICkge1xyXG4gICAgICAgIFRhbmRlbS5idWZmZXJlZFBoZXRpb09iamVjdHMucHVzaCggcGhldGlvT2JqZWN0ICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgcGhldGlvT2JqZWN0TGlzdGVuZXJzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgcGhldGlvT2JqZWN0TGlzdGVuZXJzWyBpIF0uYWRkUGhldGlvT2JqZWN0KCBwaGV0aW9PYmplY3QgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGlzIFRhbmRlbSBoYXMgdGhlIHNwZWNpZmllZCBhbmNlc3RvciBUYW5kZW0uXHJcbiAgICovXHJcbiAgcHVibGljIGhhc0FuY2VzdG9yKCBhbmNlc3RvcjogVGFuZGVtICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMucGFyZW50VGFuZGVtID09PSBhbmNlc3RvciB8fCAhISggdGhpcy5wYXJlbnRUYW5kZW0gJiYgdGhpcy5wYXJlbnRUYW5kZW0uaGFzQW5jZXN0b3IoIGFuY2VzdG9yICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgYSBQaGV0aW9PYmplY3QgYW5kIHNpZ25pZmllcyB0byBsaXN0ZW5lcnMgdGhhdCBpdCBoYXMgYmVlbiByZW1vdmVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyByZW1vdmVQaGV0aW9PYmplY3QoIHBoZXRpb09iamVjdDogUGhldGlvT2JqZWN0ICk6IHZvaWQge1xyXG5cclxuICAgIC8vIE5vIG5lZWQgdG8gaGFuZGxlIHRoaXMgY2FzZSBmb3IgdW5pbnN0cnVtZW50ZWQgb2JqZWN0cyBiZWluZyByZW1vdmVkXHJcbiAgICBpZiAoICF0aGlzLnN1cHBsaWVkICkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT25seSBhY3RpdmUgd2hlbiBydW5uaW5nIGFzIHBoZXQtaW9cclxuICAgIGlmICggUEhFVF9JT19FTkFCTEVEICkge1xyXG4gICAgICBpZiAoICFUYW5kZW0ubGF1bmNoZWQgKSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggVGFuZGVtLmJ1ZmZlcmVkUGhldGlvT2JqZWN0cy5pbmNsdWRlcyggcGhldGlvT2JqZWN0ICksICdzaG91bGQgY29udGFpbiBpdGVtJyApO1xyXG4gICAgICAgIGFycmF5UmVtb3ZlKCBUYW5kZW0uYnVmZmVyZWRQaGV0aW9PYmplY3RzLCBwaGV0aW9PYmplY3QgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBwaGV0aW9PYmplY3RMaXN0ZW5lcnMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICBwaGV0aW9PYmplY3RMaXN0ZW5lcnNbIGkgXS5yZW1vdmVQaGV0aW9PYmplY3QoIHBoZXRpb09iamVjdCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHBoZXRpb09iamVjdC50YW5kZW0uZGlzcG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXNlZCBmb3IgY3JlYXRpbmcgbmV3IHRhbmRlbXMsIGV4dGVuZHMgdGhpcyBUYW5kZW0ncyBvcHRpb25zIHdpdGggdGhlIHBhc3NlZC1pbiBvcHRpb25zLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRFeHRlbmRlZE9wdGlvbnMoIG9wdGlvbnM/OiBUYW5kZW1PcHRpb25zICk6IFRhbmRlbU9wdGlvbnMge1xyXG5cclxuICAgIC8vIEFueSBjaGlsZCBvZiBzb21ldGhpbmcgc2hvdWxkIGJlIHBhc3NlZCBhbGwgaW5oZXJpdGVkIG9wdGlvbnMuIE1ha2Ugc3VyZSB0aGF0IHRoaXMgZXh0ZW5kIGNhbGwgaW5jbHVkZXMgYWxsXHJcbiAgICAvLyB0aGF0IG1ha2Ugc2Vuc2UgZnJvbSB0aGUgY29uc3RydWN0b3IncyBleHRlbmQgY2FsbC5cclxuICAgIHJldHVybiBtZXJnZSgge1xyXG4gICAgICBzdXBwbGllZDogdGhpcy5zdXBwbGllZCxcclxuICAgICAgcmVxdWlyZWQ6IHRoaXMucmVxdWlyZWRcclxuICAgIH0sIG9wdGlvbnMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZSBhIG5ldyBUYW5kZW0gYnkgYXBwZW5kaW5nIHRoZSBnaXZlbiBpZCwgb3IgaWYgdGhlIGNoaWxkIFRhbmRlbSBhbHJlYWR5IGV4aXN0cywgcmV0dXJuIGl0IGluc3RlYWQuXHJcbiAgICovXHJcbiAgcHVibGljIGNyZWF0ZVRhbmRlbSggbmFtZTogc3RyaW5nLCBvcHRpb25zPzogVGFuZGVtT3B0aW9ucyApOiBUYW5kZW0ge1xyXG4gICAgYXNzZXJ0ICYmIFRhbmRlbS5WQUxJREFUSU9OICYmIGFzc2VydCggIVVOQUxMT1dFRF9UQU5ERU1fTkFNRVMuaW5jbHVkZXMoIG5hbWUgKSwgJ3RhbmRlbSBuYW1lIGlzIG5vdCBhbGxvd2VkOiAnICsgbmFtZSApO1xyXG5cclxuICAgIG9wdGlvbnMgPSB0aGlzLmdldEV4dGVuZGVkT3B0aW9ucyggb3B0aW9ucyApO1xyXG5cclxuICAgIC8vIHJlLXVzZSB0aGUgY2hpbGQgaWYgaXQgYWxyZWFkeSBleGlzdHMsIGJ1dCBtYWtlIHN1cmUgaXQgYmVoYXZlcyB0aGUgc2FtZS5cclxuICAgIGlmICggdGhpcy5oYXNDaGlsZCggbmFtZSApICkge1xyXG4gICAgICBjb25zdCBjdXJyZW50Q2hpbGQgPSB0aGlzLmNoaWxkcmVuWyBuYW1lIF07XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGN1cnJlbnRDaGlsZC5yZXF1aXJlZCA9PT0gb3B0aW9ucy5yZXF1aXJlZCApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBjdXJyZW50Q2hpbGQuc3VwcGxpZWQgPT09IG9wdGlvbnMuc3VwcGxpZWQgKTtcclxuICAgICAgcmV0dXJuIGN1cnJlbnRDaGlsZDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gbmV3IFRhbmRlbSggdGhpcywgbmFtZSwgb3B0aW9ucyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJhZC1zaW0tdGV4dFxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlIGEgbmV3IFRhbmRlbSBieSBpbmRleGluZyB3aXRoIHRoZSBzcGVjaWZpZWQgaW5kZXguICBOb3RlIHRoYXQgaXQgaW5jcmVtZW50cyBieSAxIHNvIHRoYXQgaW5kZXggMCBpc1xyXG4gICAqIFwiMVwiIGluIHRoZSB0YW5kZW0gbmFtZS5cclxuICAgKiBGb3IgZXhhbXBsZTpcclxuICAgKiAtIGNyZWF0ZVRhbmRlbSggJ2ZvbycsIDAgKSA9PiAnZm9vMSdcclxuICAgKi9cclxuICBwdWJsaWMgY3JlYXRlVGFuZGVtMUluZGV4ZWQoIG5hbWU6IHN0cmluZywgaW5kZXg6IG51bWJlciwgb3B0aW9ucz86IFRhbmRlbU9wdGlvbnMgKTogVGFuZGVtIHtcclxuICAgIHJldHVybiB0aGlzLmNyZWF0ZVRhbmRlbSggYCR7bmFtZX0ke2luZGV4ICsgMX1gLCBvcHRpb25zICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaGFzQ2hpbGQoIG5hbWU6IHN0cmluZyApOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmNoaWxkcmVuLmhhc093blByb3BlcnR5KCBuYW1lICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYWRkQ2hpbGQoIG5hbWU6IHN0cmluZywgdGFuZGVtOiBUYW5kZW0gKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5oYXNDaGlsZCggbmFtZSApICk7XHJcbiAgICB0aGlzLmNoaWxkcmVuWyBuYW1lIF0gPSB0YW5kZW07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGaXJlIGEgY2FsbGJhY2sgb24gYWxsIGRlc2NlbmRhbnRzIG9mIHRoaXMgVGFuZGVtXHJcbiAgICovXHJcbiAgcHVibGljIGl0ZXJhdGVEZXNjZW5kYW50cyggY2FsbGJhY2s6ICggdDogVGFuZGVtICkgPT4gdm9pZCApOiB2b2lkIHtcclxuICAgIGZvciAoIGNvbnN0IGNoaWxkTmFtZSBpbiB0aGlzLmNoaWxkcmVuICkge1xyXG4gICAgICBpZiAoIHRoaXMuY2hpbGRyZW4uaGFzT3duUHJvcGVydHkoIGNoaWxkTmFtZSApICkge1xyXG4gICAgICAgIGNhbGxiYWNrKCB0aGlzLmNoaWxkcmVuWyBjaGlsZE5hbWUgXSApO1xyXG4gICAgICAgIHRoaXMuY2hpbGRyZW5bIGNoaWxkTmFtZSBdLml0ZXJhdGVEZXNjZW5kYW50cyggY2FsbGJhY2sgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZW1vdmVDaGlsZCggY2hpbGROYW1lOiBzdHJpbmcgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmhhc0NoaWxkKCBjaGlsZE5hbWUgKSApO1xyXG4gICAgZGVsZXRlIHRoaXMuY2hpbGRyZW5bIGNoaWxkTmFtZSBdO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMuaXNEaXNwb3NlZCwgJ2FscmVhZHkgZGlzcG9zZWQnICk7XHJcblxyXG4gICAgdGhpcy5wYXJlbnRUYW5kZW0hLnJlbW92ZUNoaWxkKCB0aGlzLm5hbWUgKTtcclxuICAgIHRoaXMucGFyZW50VGFuZGVtID0gbnVsbDtcclxuXHJcbiAgICB0aGlzLmlzRGlzcG9zZWQgPSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRm9yIEFQSSB2YWxpZGF0aW9uLCBlYWNoIFBoZXRpb09iamVjdCBoYXMgYSBjb3JyZXNwb25kaW5nIGFyY2hldHlwZSBQaGV0aW9PYmplY3QgZm9yIGNvbXBhcmlzb24uIE5vbi1keW5hbWljXHJcbiAgICogUGhldGlvT2JqZWN0cyBoYXZlIHRoZSB0cml2aWFsIGNhc2Ugd2hlcmUgaXRzIGFyY2hldHlwYWwgcGhldGlvSUQgaXMgdGhlIHNhbWUgYXMgaXRzIHBoZXRpb0lELlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRBcmNoZXR5cGFsUGhldGlvSUQoKTogUGhldGlvSUQge1xyXG4gICAgcmV0dXJuIHdpbmRvdy5waGV0aW8uUGhldGlvSURVdGlscy5nZXRBcmNoZXR5cGFsUGhldGlvSUQoIHRoaXMucGhldGlvSUQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBncm91cCB0YW5kZW0gZm9yIGNyZWF0aW5nIG11bHRpcGxlIGluZGV4ZWQgY2hpbGQgdGFuZGVtcywgc3VjaCBhczpcclxuICAgKiBzaW0uc2NyZWVuLm1vZGVsLmVsZWN0cm9uMFxyXG4gICAqIHNpbS5zY3JlZW4ubW9kZWwuZWxlY3Ryb24xXHJcbiAgICpcclxuICAgKiBJbiB0aGlzIGNhc2UsICdzaW0uc2NyZWVuLm1vZGVsLmVsZWN0cm9uJyBpcyB0aGUgc3RyaW5nIHBhc3NlZCB0byBjcmVhdGVHcm91cFRhbmRlbS5cclxuICAgKlxyXG4gICAqIFVzZWQgZm9yIGFycmF5cywgb2JzZXJ2YWJsZSBhcnJheXMsIG9yIHdoZW4gbWFueSBlbGVtZW50cyBvZiB0aGUgc2FtZSB0eXBlIGFyZSBjcmVhdGVkIGFuZCB0aGV5IGRvIG5vdCBvdGhlcndpc2VcclxuICAgKiBoYXZlIHVuaXF1ZSBpZGVudGlmaWVycy5cclxuICAgKi9cclxuICBwdWJsaWMgY3JlYXRlR3JvdXBUYW5kZW0oIG5hbWU6IHN0cmluZyApOiBHcm91cFRhbmRlbSB7XHJcbiAgICBpZiAoIHRoaXMuY2hpbGRyZW5bIG5hbWUgXSApIHtcclxuICAgICAgcmV0dXJuIHRoaXMuY2hpbGRyZW5bIG5hbWUgXSBhcyBHcm91cFRhbmRlbTtcclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgR3JvdXBUYW5kZW0oIHRoaXMsIG5hbWUgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBlcXVhbHMoIHRhbmRlbTogVGFuZGVtICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMucGhldGlvSUQgPT09IHRhbmRlbS5waGV0aW9JRDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYSBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgbm90aWZpZWQgd2hlbiBpdGVtcyBhcmUgcmVnaXN0ZXJlZC9kZXJlZ2lzdGVyZWRcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGFkZFBoZXRpb09iamVjdExpc3RlbmVyKCBwaGV0aW9PYmplY3RMaXN0ZW5lcjogUGhldGlvT2JqZWN0TGlzdGVuZXIgKTogdm9pZCB7XHJcbiAgICBwaGV0aW9PYmplY3RMaXN0ZW5lcnMucHVzaCggcGhldGlvT2JqZWN0TGlzdGVuZXIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFmdGVyIGFsbCBsaXN0ZW5lcnMgaGF2ZSBiZWVuIGFkZGVkLCB0aGVuIFRhbmRlbSBjYW4gYmUgbGF1bmNoZWQuICBUaGlzIHJlZ2lzdGVycyBhbGwgb2YgdGhlIGJ1ZmZlcmVkIFBoZXRpb09iamVjdHNcclxuICAgKiBhbmQgc3Vic2VxdWVudCBQaGV0aW9PYmplY3RzIHdpbGwgYmUgcmVnaXN0ZXJlZCBkaXJlY3RseS5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGxhdW5jaCgpOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFUYW5kZW0ubGF1bmNoZWQsICdUYW5kZW0gY2Fubm90IGJlIGxhdW5jaGVkIHR3aWNlJyApO1xyXG4gICAgVGFuZGVtLmxhdW5jaGVkID0gdHJ1ZTtcclxuXHJcbiAgICB3aGlsZSAoIGxhdW5jaExpc3RlbmVycy5sZW5ndGggPiAwICkge1xyXG4gICAgICBsYXVuY2hMaXN0ZW5lcnMuc2hpZnQoKSEoKTtcclxuICAgIH1cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGxhdW5jaExpc3RlbmVycy5sZW5ndGggPT09IDAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE9OTFkgRk9SIFRFU1RJTkchISEhXHJcbiAgICogVGhpcyB3YXMgY3JlYXRlZCB0byBcInVuZG9cIiBsYXVuY2ggc28gdGhhdCB0ZXN0cyBjYW4gYmV0dGVyIGV4cG9zZSBjYXNlcyBhcm91bmQgY2FsbGluZyBUYW5kZW0ubGF1bmNoKClcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHVubGF1bmNoKCk6IHZvaWQge1xyXG4gICAgVGFuZGVtLmxhdW5jaGVkID0gZmFsc2U7XHJcbiAgICBUYW5kZW0uYnVmZmVyZWRQaGV0aW9PYmplY3RzLmxlbmd0aCA9IDA7XHJcbiAgICBsYXVuY2hMaXN0ZW5lcnMubGVuZ3RoID0gMDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZCBhIGxpc3RlbmVyIHRoYXQgd2lsbCBmaXJlIHdoZW4gVGFuZGVtIGlzIGxhdW5jaGVkXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBhZGRMYXVuY2hMaXN0ZW5lciggbGlzdGVuZXI6ICgpID0+IHZvaWQgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhVGFuZGVtLmxhdW5jaGVkLCAndGFuZGVtIGhhcyBhbHJlYWR5IGJlZW4gbGF1bmNoZWQsIGNhbm5vdCBhZGQgbGlzdGVuZXIgZm9yIHRoYXQgaG9vay4nICk7XHJcbiAgICBsYXVuY2hMaXN0ZW5lcnMucHVzaCggbGlzdGVuZXIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEV4cG9zZSBjb2xsZWN0ZWQgbWlzc2luZyB0YW5kZW1zIG9ubHkgcG9wdWxhdGVkIGZyb20gc3BlY2lmaWMgcXVlcnkgcGFyYW1ldGVyLCBzZWUgcGhldGlvUHJpbnRNaXNzaW5nVGFuZGVtc1xyXG4gICAqIChwaGV0LWlvIGludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgbWlzc2luZ1RhbmRlbXMgPSBtaXNzaW5nVGFuZGVtcztcclxuXHJcbiAgLyoqXHJcbiAgICogSWYgUGhFVC1pTyBpcyBlbmFibGVkIGluIHRoaXMgcnVudGltZS5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFBIRVRfSU9fRU5BQkxFRCA9IFBIRVRfSU9fRU5BQkxFRDtcclxuXHJcbiAgLyoqXHJcbiAgICogV2hlbiBnZW5lcmF0aW5nIGFuIEFQSSAod2hldGhlciB0byBvdXRwdXQgYSBmaWxlIG9yIGZvciBpbi1tZW1vcnkgY29tcGFyaXNvbiksIHRoaXMgaXMgbWFya2VkIGFzIHRydWUuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBBUElfR0VORVJBVElPTiA9IFRhbmRlbS5QSEVUX0lPX0VOQUJMRUQgJiYgKCBwaGV0LnByZWxvYWRzLnBoZXRpby5xdWVyeVBhcmFtZXRlcnMucGhldGlvUHJpbnRBUEkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBoZXQucHJlbG9hZHMucGhldGlvLnF1ZXJ5UGFyYW1ldGVycy5waGV0aW9Db21wYXJlQVBJICk7XHJcblxyXG4gIC8qKlxyXG4gICAqIElmIFBoRVQtaU8gaXMgcnVubmluZyB3aXRoIHZhbGlkYXRpb24gZW5hYmxlZC5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFZBTElEQVRJT04gPSBWQUxJREFUSU9OO1xyXG5cclxuICAvKipcclxuICAgKiBGb3IgdGhlIEFQSSBmaWxlLCB0aGUga2V5IG5hbWUgZm9yIHRoZSBtZXRhZGF0YSBzZWN0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgTUVUQURBVEFfS0VZID0gJ19tZXRhZGF0YSc7XHJcblxyXG4gIC8qKlxyXG4gICAqIEZvciB0aGUgQVBJIGZpbGUsIHRoZSBrZXkgbmFtZSBmb3IgdGhlIGRhdGEgc2VjdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IERBVEFfS0VZID0gJ19kYXRhJztcclxuXHJcbiAgLy8gQmVmb3JlIGxpc3RlbmVycyBhcmUgd2lyZWQgdXAsIHRhbmRlbXMgYXJlIGJ1ZmZlcmVkLiAgV2hlbiBsaXN0ZW5lcnMgYXJlIHdpcmVkIHVwLCBUYW5kZW0ubGF1bmNoKCkgaXMgY2FsbGVkIGFuZFxyXG4gIC8vIGJ1ZmZlcmVkIHRhbmRlbXMgYXJlIGZsdXNoZWQsIHRoZW4gc3Vic2VxdWVudCB0YW5kZW1zIGFyZSBkZWxpdmVyZWQgdG8gbGlzdGVuZXJzIGRpcmVjdGx5XHJcbiAgcHVibGljIHN0YXRpYyBsYXVuY2hlZCA9IGZhbHNlO1xyXG5cclxuICAvLyBhIGxpc3Qgb2YgUGhldGlvT2JqZWN0cyByZWFkeSB0byBiZSBzZW50IG91dCB0byBsaXN0ZW5lcnMsIGJ1dCBjYW4ndCBiZWNhdXNlIFRhbmRlbSBoYXNuJ3QgYmVlbiBsYXVuY2hlZCB5ZXQuXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBidWZmZXJlZFBoZXRpb09iamVjdHM6IFBoZXRpb09iamVjdFtdID0gW107XHJcblxyXG4gIHB1YmxpYyBjcmVhdGVUYW5kZW1Gcm9tUGhldGlvSUQoIHBoZXRpb0lEOiBQaGV0aW9JRCApOiBUYW5kZW0ge1xyXG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlVGFuZGVtKCBwaGV0aW9JRC5zcGxpdCggd2luZG93LnBoZXRpby5QaGV0aW9JRFV0aWxzLlNFUEFSQVRPUiApLmpvaW4oIElOVEVSX1RFUk1fU0VQQVJBVE9SICksIHtcclxuICAgICAgaXNWYWxpZFRhbmRlbU5hbWU6ICggbmFtZTogc3RyaW5nICkgPT4gVGFuZGVtLmdldFJlZ2V4RnJvbUNoYXJhY3RlckNsYXNzKCBUYW5kZW1Db25zdGFudHMuQkFTRV9ERVJJVkVEX1RBTkRFTV9DSEFSQUNURVJfQ0xBU1MgKS50ZXN0KCBuYW1lIClcclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IFJvb3RUYW5kZW0gPSBjbGFzcyBSb290VGFuZGVtIGV4dGVuZHMgVGFuZGVtIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJvb3RUYW5kZW1zIG9ubHkgYWNjZXB0IHNwZWNpZmljYWxseSBuYW1lZCBjaGlsZHJlbi5cclxuICAgICAqL1xyXG4gICAgcHVibGljIG92ZXJyaWRlIGNyZWF0ZVRhbmRlbSggbmFtZTogc3RyaW5nLCBvcHRpb25zPzogVGFuZGVtT3B0aW9ucyApOiBUYW5kZW0ge1xyXG4gICAgICBpZiAoIFRhbmRlbS5WQUxJREFUSU9OICkge1xyXG4gICAgICAgIGNvbnN0IGFsbG93ZWRPblJvb3QgPSBuYW1lID09PSB3aW5kb3cucGhldGlvLlBoZXRpb0lEVXRpbHMuR0xPQkFMX0NPTVBPTkVOVF9OQU1FIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUgPT09IFJFUVVJUkVEX1RBTkRFTV9OQU1FIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUgPT09IE9QVElPTkFMX1RBTkRFTV9OQU1FIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUgPT09IFRFU1RfVEFOREVNX05BTUUgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSA9PT0gd2luZG93LnBoZXRpby5QaGV0aW9JRFV0aWxzLkdFTkVSQUxfQ09NUE9ORU5UX05BTUUgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5lbmRzV2l0aCggbmFtZSwgVGFuZGVtLlNDUkVFTl9UQU5ERU1fTkFNRV9TVUZGSVggKTtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhbGxvd2VkT25Sb290LCBgdGFuZGVtIG5hbWUgbm90IGFsbG93ZWQgb24gcm9vdDogXCIke25hbWV9XCI7IHBlcmhhcHMgdHJ5IHB1dHRpbmcgaXQgdW5kZXIgZ2VuZXJhbCBvciBnbG9iYWxgICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBzdXBlci5jcmVhdGVUYW5kZW0oIG5hbWUsIG9wdGlvbnMgKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBUaGUgcm9vdCB0YW5kZW0gZm9yIGEgc2ltdWxhdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgUk9PVDogVGFuZGVtID0gbmV3IFRhbmRlbS5Sb290VGFuZGVtKCBudWxsLCBfLmNhbWVsQ2FzZSggcGFja2FnZUpTT04ubmFtZSApICk7XHJcblxyXG4gIC8qKlxyXG4gICAqIE1hbnkgc2ltdWxhdGlvbiBlbGVtZW50cyBhcmUgbmVzdGVkIHVuZGVyIFwiZ2VuZXJhbFwiLiBUaGlzIHRhbmRlbSBpcyBmb3IgZWxlbWVudHMgdGhhdCBleGlzdHMgaW4gYWxsIHNpbXMuIEZvciBhXHJcbiAgICogcGxhY2UgdG8gcHV0IHNpbXVsYXRpb24gc3BlY2lmaWMgZ2xvYmFscywgc2VlIGBHTE9CQUxgXHJcbiAgICpcclxuICAgKiBAY29uc3RhbnRcclxuICAgKiBAdHlwZSB7VGFuZGVtfVxyXG4gICAqL1xyXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IEdFTkVSQUwgPSBUYW5kZW0uUk9PVC5jcmVhdGVUYW5kZW0oIHdpbmRvdy5waGV0aW8uUGhldGlvSURVdGlscy5HRU5FUkFMX0NPTVBPTkVOVF9OQU1FICk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFVzZWQgaW4gdW5pdCB0ZXN0c1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgUk9PVF9URVNUID0gVGFuZGVtLlJPT1QuY3JlYXRlVGFuZGVtKCBURVNUX1RBTkRFTV9OQU1FICk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRhbmRlbSBmb3IgbW9kZWwgc2ltdWxhdGlvbiBlbGVtZW50cyB0aGF0IGFyZSBnZW5lcmFsIHRvIGFsbCBzaW1zLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgR0VORVJBTF9NT0RFTCA9IFRhbmRlbS5HRU5FUkFMLmNyZWF0ZVRhbmRlbSggd2luZG93LnBoZXRpby5QaGV0aW9JRFV0aWxzLk1PREVMX0NPTVBPTkVOVF9OQU1FICk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRhbmRlbSBmb3IgdmlldyBzaW11bGF0aW9uIGVsZW1lbnRzIHRoYXQgYXJlIGdlbmVyYWwgdG8gYWxsIHNpbXMuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBHRU5FUkFMX1ZJRVcgPSBUYW5kZW0uR0VORVJBTC5jcmVhdGVUYW5kZW0oIHdpbmRvdy5waGV0aW8uUGhldGlvSURVdGlscy5WSUVXX0NPTVBPTkVOVF9OQU1FICk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRhbmRlbSBmb3IgY29udHJvbGxlciBzaW11bGF0aW9uIGVsZW1lbnRzIHRoYXQgYXJlIGdlbmVyYWwgdG8gYWxsIHNpbXMuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBHRU5FUkFMX0NPTlRST0xMRVIgPSBUYW5kZW0uR0VORVJBTC5jcmVhdGVUYW5kZW0oIHdpbmRvdy5waGV0aW8uUGhldGlvSURVdGlscy5DT05UUk9MTEVSX0NPTVBPTkVOVF9OQU1FICk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFNpbXVsYXRpb24gZWxlbWVudHMgdGhhdCBkb24ndCBiZWxvbmcgaW4gc2NyZWVucyBzaG91bGQgYmUgbmVzdGVkIHVuZGVyIFwiZ2xvYmFsXCIuIE5vdGUgdGhhdCB0aGlzIHRhbmRlbSBzaG91bGQgb25seVxyXG4gICAqIGhhdmUgc2ltdWxhdGlvbiBzcGVjaWZpYyBlbGVtZW50cyBpbiB0aGVtLiBJbnN0cnVtZW50IGl0ZW1zIHVzZWQgYnkgYWxsIHNpbXMgdW5kZXIgYFRhbmRlbS5HRU5FUkFMYC4gTW9zdFxyXG4gICAqIGxpa2VseSBzaW11bGF0aW9ucyBlbGVtZW50cyBzaG91bGQgbm90IGJlIGRpcmVjdGx5IHVuZGVyIHRoaXMsIGJ1dCBpbnN0ZWFkIGVpdGhlciB1bmRlciB0aGUgbW9kZWwgb3IgdmlldyBzdWJcclxuICAgKiB0YW5kZW1zLlxyXG4gICAqXHJcbiAgICogQGNvbnN0YW50XHJcbiAgICogQHR5cGUge1RhbmRlbX1cclxuICAgKi9cclxuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBHTE9CQUwgPSBUYW5kZW0uUk9PVC5jcmVhdGVUYW5kZW0oIHdpbmRvdy5waGV0aW8uUGhldGlvSURVdGlscy5HTE9CQUxfQ09NUE9ORU5UX05BTUUgKTtcclxuXHJcbiAgLyoqXHJcbiAgICogTW9kZWwgc2ltdWxhdGlvbiBlbGVtZW50cyB0aGF0IGRvbid0IGJlbG9uZyBpbiBzcGVjaWZpYyBzY3JlZW5zIHNob3VsZCBiZSBuZXN0ZWQgdW5kZXIgdGhpcyBUYW5kZW0uIE5vdGUgdGhhdCB0aGlzXHJcbiAgICogdGFuZGVtIHNob3VsZCBvbmx5IGhhdmUgc2ltdWxhdGlvbiBzcGVjaWZpYyBlbGVtZW50cyBpbiB0aGVtLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgR0xPQkFMX01PREVMID0gVGFuZGVtLkdMT0JBTC5jcmVhdGVUYW5kZW0oIHdpbmRvdy5waGV0aW8uUGhldGlvSURVdGlscy5NT0RFTF9DT01QT05FTlRfTkFNRSApO1xyXG5cclxuICAvKipcclxuICAgKiBWaWV3IHNpbXVsYXRpb24gZWxlbWVudHMgdGhhdCBkb24ndCBiZWxvbmcgaW4gc3BlY2lmaWMgc2NyZWVucyBzaG91bGQgYmUgbmVzdGVkIHVuZGVyIHRoaXMgVGFuZGVtLiBOb3RlIHRoYXQgdGhpc1xyXG4gICAqIHRhbmRlbSBzaG91bGQgb25seSBoYXZlIHNpbXVsYXRpb24gc3BlY2lmaWMgZWxlbWVudHMgaW4gdGhlbS5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IEdMT0JBTF9WSUVXID0gVGFuZGVtLkdMT0JBTC5jcmVhdGVUYW5kZW0oIHdpbmRvdy5waGV0aW8uUGhldGlvSURVdGlscy5WSUVXX0NPTVBPTkVOVF9OQU1FICk7XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbG9ycyB1c2VkIGluIHRoZSBzaW11bGF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgQ09MT1JTID0gVGFuZGVtLkdMT0JBTF9WSUVXLmNyZWF0ZVRhbmRlbSggd2luZG93LnBoZXRpby5QaGV0aW9JRFV0aWxzLkNPTE9SU19DT01QT05FTlRfTkFNRSApO1xyXG5cclxuICAvKipcclxuICAgKiBDb2xvcnMgdXNlZCBpbiB0aGUgc2ltdWxhdGlvbi5cclxuICAgKi9cclxuXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBTVFJJTkdTID0gVGFuZGVtLkdFTkVSQUxfTU9ERUwuY3JlYXRlVGFuZGVtKCB3aW5kb3cucGhldGlvLlBoZXRpb0lEVXRpbHMuU1RSSU5HU19DT01QT05FTlRfTkFNRSApO1xyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIFRhbmRlbSBsb2NhdGlvbiBmb3IgbW9kZWwgc3RyaW5ncy4gUHJvdmlkZSB0aGUgY2FtZWxDYXNlZCByZXBvIG5hbWUgZm9yIHdoZXJlIHRoZSBzdHJpbmcgc2hvdWxkIGJlXHJcbiAgICogb3JnYW5pemVkLiBUaGlzIHdpbGwgZGVmYXVsdCB0byB0aGUgc2ltJ3MgbmFtZS4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy90YW5kZW0vaXNzdWVzLzI5OFxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgZ2V0U3RyaW5nc1RhbmRlbSggbW9kdWxlTmFtZTogc3RyaW5nID0gVGFuZGVtLlJPT1QubmFtZSApOiBUYW5kZW0ge1xyXG4gICAgcmV0dXJuIFRhbmRlbS5TVFJJTkdTLmNyZWF0ZVRhbmRlbSggbW9kdWxlTmFtZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBUYW5kZW0gbG9jYXRpb24gZm9yIGRlcml2ZWQgbW9kZWwgc3RyaW5ncy4gUHJvdmlkZSB0aGUgY2FtZWxDYXNlZCByZXBvIG5hbWUgZm9yIHdoZXJlIHRoZSBzdHJpbmcgc2hvdWxkIGJlXHJcbiAgICogb3JnYW5pemVkLiBUaGlzIHdpbGwgZGVmYXVsdCB0byB0aGUgc2ltJ3MgbmFtZS4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy90YW5kZW0vaXNzdWVzLzI5OFxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgZ2V0RGVyaXZlZFN0cmluZ3NUYW5kZW0oIG1vZHVsZU5hbWU6IHN0cmluZyA9IFRhbmRlbS5ST09ULm5hbWUgKTogVGFuZGVtIHtcclxuICAgIHJldHVybiBUYW5kZW0uZ2V0U3RyaW5nc1RhbmRlbSggbW9kdWxlTmFtZSApLmNyZWF0ZVRhbmRlbSggJ2Rlcml2ZWRTdHJpbmdzJyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW4gVHlwZVNjcmlwdCwgb3B0aW9uaXplIGFscmVhZHkga25vd3MgdGhhdCBgdGFuZGVtYCBtYXkgYmUgdW5kZWZpbmVkLCBqdXN0IHVzZSBgb3B0aW9ucy50YW5kZW0/YCBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3RhbmRlbS9pc3N1ZXMvMjg5XHJcbiAgICogVXNlZCB0byBpbmRpY2F0ZSBhIGNvbW1vbiBjb2RlIGNvbXBvbmVudCB0aGF0IHN1cHBvcnRzIHRhbmRlbSwgYnV0IGRvZXNuJ3QgcmVxdWlyZSBpdC4gIElmIGEgdGFuZGVtIGlzIG5vdFxyXG4gICAqIHBhc3NlZCBpbiwgdGhlbiBpdCB3aWxsIG5vdCBiZSBpbnN0cnVtZW50ZWQuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBPUFRJT05BTCA9IFRhbmRlbS5ST09ULmNyZWF0ZVRhbmRlbSggT1BUSU9OQUxfVEFOREVNX05BTUUsIHtcclxuICAgIHJlcXVpcmVkOiBmYWxzZSxcclxuICAgIHN1cHBsaWVkOiBmYWxzZVxyXG4gIH0gKTtcclxuXHJcbiAgLyoqXHJcbiAgICogVG8gYmUgdXNlZCBleGNsdXNpdmVseSB0byBvcHQgb3V0IG9mIHNpdHVhdGlvbnMgd2hlcmUgYSB0YW5kZW0gaXMgcmVxdWlyZWQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvdGFuZGVtL2lzc3Vlcy85Ny5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IE9QVF9PVVQgPSBUYW5kZW0uT1BUSU9OQUw7XHJcblxyXG4gIC8qKlxyXG4gICAqIFNvbWUgY29tbW9uIGNvZGUgKHN1Y2ggYXMgQ2hlY2tib3ggb3IgUmFkaW9CdXR0b24pIG11c3QgYWx3YXlzIGJlIGluc3RydW1lbnRlZC5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFJFUVVJUkVEID0gVGFuZGVtLlJPT1QuY3JlYXRlVGFuZGVtKCBSRVFVSVJFRF9UQU5ERU1fTkFNRSwge1xyXG5cclxuICAgIC8vIGxldCBwaGV0aW9QcmludE1pc3NpbmdUYW5kZW1zIGJ5cGFzcyB0aGlzXHJcbiAgICByZXF1aXJlZDogVkFMSURBVElPTiB8fCBQUklOVF9NSVNTSU5HX1RBTkRFTVMsXHJcbiAgICBzdXBwbGllZDogZmFsc2VcclxuICB9ICk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFVzZSB0aGlzIGFzIHRoZSBwYXJlbnQgdGFuZGVtIGZvciBQcm9wZXJ0aWVzIHRoYXQgYXJlIHJlbGF0ZWQgdG8gc2ltLXNwZWNpZmljIHByZWZlcmVuY2VzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgUFJFRkVSRU5DRVMgPSBUYW5kZW0uR0xPQkFMX01PREVMLmNyZWF0ZVRhbmRlbSggJ3ByZWZlcmVuY2VzJyApO1xyXG59XHJcblxyXG5UYW5kZW0uYWRkTGF1bmNoTGlzdGVuZXIoICgpID0+IHtcclxuICB3aGlsZSAoIFRhbmRlbS5idWZmZXJlZFBoZXRpb09iamVjdHMubGVuZ3RoID4gMCApIHtcclxuICAgIGNvbnN0IHBoZXRpb09iamVjdCA9IFRhbmRlbS5idWZmZXJlZFBoZXRpb09iamVjdHMuc2hpZnQoKTtcclxuICAgIHBoZXRpb09iamVjdCEudGFuZGVtLmFkZFBoZXRpb09iamVjdCggcGhldGlvT2JqZWN0ISApO1xyXG4gIH1cclxuICBhc3NlcnQgJiYgYXNzZXJ0KCBUYW5kZW0uYnVmZmVyZWRQaGV0aW9PYmplY3RzLmxlbmd0aCA9PT0gMCwgJ2J1ZmZlcmVkUGhldGlvT2JqZWN0cyBzaG91bGQgYmUgZW1wdHknICk7XHJcbn0gKTtcclxuXHJcbi8qKlxyXG4gKiBHcm91cCBUYW5kZW0gLS0gRGVjbGFyZWQgaW4gdGhlIHNhbWUgZmlsZSB0byBhdm9pZCBjaXJjdWxhciByZWZlcmVuY2UgZXJyb3JzIGluIG1vZHVsZSBsb2FkaW5nLlxyXG4gKi9cclxuY2xhc3MgR3JvdXBUYW5kZW0gZXh0ZW5kcyBUYW5kZW0ge1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgZ3JvdXBOYW1lOiBzdHJpbmc7XHJcblxyXG4gIC8vIGZvciBnZW5lcmF0aW5nIGluZGljZXMgZnJvbSBhIHBvb2xcclxuICBwcml2YXRlIGdyb3VwTWVtYmVySW5kZXg6IG51bWJlcjtcclxuXHJcbiAgLyoqXHJcbiAgICogY3JlYXRlIHdpdGggVGFuZGVtLmNyZWF0ZUdyb3VwVGFuZGVtXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBwYXJlbnRUYW5kZW06IFRhbmRlbSwgbmFtZTogc3RyaW5nICkge1xyXG4gICAgc3VwZXIoIHBhcmVudFRhbmRlbSwgbmFtZSApO1xyXG5cclxuICAgIHRoaXMuZ3JvdXBOYW1lID0gbmFtZTtcclxuICAgIHRoaXMuZ3JvdXBNZW1iZXJJbmRleCA9IDA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIHRoZSBuZXh0IHRhbmRlbSBpbiB0aGUgZ3JvdXAuXHJcbiAgICovXHJcbiAgcHVibGljIGNyZWF0ZU5leHRUYW5kZW0oKTogVGFuZGVtIHtcclxuICAgIGNvbnN0IHRhbmRlbSA9IHRoaXMucGFyZW50VGFuZGVtIS5jcmVhdGVUYW5kZW0oIGAke3RoaXMuZ3JvdXBOYW1lfSR7dGhpcy5ncm91cE1lbWJlckluZGV4fWAgKTtcclxuICAgIHRoaXMuZ3JvdXBNZW1iZXJJbmRleCsrO1xyXG4gICAgcmV0dXJuIHRhbmRlbTtcclxuICB9XHJcbn1cclxuXHJcbnRhbmRlbU5hbWVzcGFjZS5yZWdpc3RlciggJ1RhbmRlbScsIFRhbmRlbSApO1xyXG5leHBvcnQgZGVmYXVsdCBUYW5kZW07Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxXQUFXLE1BQU0sbUNBQW1DO0FBQzNELE9BQU9DLEtBQUssTUFBTSw2QkFBNkI7QUFDL0MsT0FBT0MsU0FBUyxNQUFNLGlDQUFpQztBQUV2RCxPQUFPQyxlQUFlLE1BQW9CLHNCQUFzQjtBQUNoRSxPQUFPQyxlQUFlLE1BQU0sc0JBQXNCOztBQUVsRDtBQUNBO0FBQ0EsTUFBTUMsV0FBVyxHQUFHQyxDQUFDLENBQUNDLEtBQUssQ0FBRUMsTUFBTSxFQUFFLDRCQUE2QixDQUFDLEdBQUdDLElBQUksQ0FBQ0MsT0FBTyxDQUFDQyxhQUFhLEdBQUc7RUFBRUMsSUFBSSxFQUFFO0FBQWMsQ0FBQztBQUUxSCxNQUFNQyxlQUFlLEdBQUdQLENBQUMsQ0FBQ0MsS0FBSyxDQUFFQyxNQUFNLEVBQUUsc0JBQXVCLENBQUM7QUFDakUsTUFBTU0scUJBQXFCLEdBQUdELGVBQWUsSUFBSUosSUFBSSxDQUFDTSxRQUFRLENBQUNDLE1BQU0sQ0FBQ0MsZUFBZSxDQUFDQyx5QkFBeUI7O0FBRS9HO0FBQ0EsTUFBTUMscUJBQXFCLEdBQUdiLENBQUMsQ0FBQ0MsS0FBSyxDQUFFRixXQUFXLEVBQUUseUJBQTBC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