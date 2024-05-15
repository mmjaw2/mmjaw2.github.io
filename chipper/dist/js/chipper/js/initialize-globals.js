// Copyright 2015-2024, University of Colorado Boulder

/**
 * Initializes phet globals that are used by all simulations, including assertions and query-parameters.
 * See https://github.com/phetsims/phetcommon/issues/23
 * This file must be loaded before the simulation is started up, and this file cannot be loaded as an AMD module.
 * The easiest way to do this is via a <script> tag in your HTML file.
 *
 * PhET Simulations can be launched with query parameters which enable certain features.  To use a query parameter,
 * provide the full URL of the simulation and append a question mark (?) then the query parameter (and optionally its
 * value assignment).  For instance:
 * https://phet-dev.colorado.edu/html/reactants-products-and-leftovers/1.0.0-dev.13/reactants-products-and-leftovers_en.html?dev
 *
 * Here is an example of a value assignment:
 * https://phet-dev.colorado.edu/html/reactants-products-and-leftovers/1.0.0-dev.13/reactants-products-and-leftovers_en.html?webgl=false
 *
 * To use multiple query parameters, specify the question mark before the first query parameter, then ampersands (&)
 * between other query parameters.  Here is an example of multiple query parameters:
 * https://phet-dev.colorado.edu/html/reactants-products-and-leftovers/1.0.0-dev.13/reactants-products-and-leftovers_en.html?dev&showPointerAreas&webgl=false
 *
 * For more on query parameters in general, see http://en.wikipedia.org/wiki/Query_string
 * For details on common-code query parameters, see QUERY_PARAMETERS_SCHEMA below.
 * For sim-specific query parameters (if there are any), see *QueryParameters.js in the simulation's repository.
 *
 * Many of these query parameters' jsdoc is rendered and visible publicly to PhET-iO client. Those sections should be
 * marked, see top level comment in PhetioClient.js about private vs public documentation
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Chris Malley (PixelZoom, Inc.)
 */
(function () {
  assert && assert(window.QueryStringMachine, 'QueryStringMachine is used, and should be loaded before this code runs');

  // packageObject may not always be available if initialize-globals used without chipper-initialization.js
  const packageObject = _.hasIn(window, 'phet.chipper.packageObject') ? phet.chipper.packageObject : {};
  const packagePhet = packageObject.phet || {};

  // Not all runtimes will have this flag, so be graceful
  const allowLocaleSwitching = _.hasIn(window, 'phet.chipper.allowLocaleSwitching') ? phet.chipper.allowLocaleSwitching : true;

  // duck type defaults so that not all package.json files need to have a phet.simFeatures section.
  const packageSimFeatures = packagePhet.simFeatures || {};

  // The color profile used by default, if no colorProfiles are specified in package.json.
  // NOTE: Duplicated in SceneryConstants.js since scenery does not include initialize-globals.js
  const DEFAULT_COLOR_PROFILE = 'default';

  // The possible color profiles for the current simulation.
  const colorProfiles = packageSimFeatures.colorProfiles || [DEFAULT_COLOR_PROFILE];

  // Private Doc: Note: the following jsdoc is for the public facing PhET-iO API. In addition, all query parameters in the schema
  // that are a "memberOf" the "PhetQueryParameters" namespace are used in the jsdoc that is public (client facing)
  // phet-io documentation. Private comments about implementation details will be in comments above the jsdoc, and
  // marked as such.
  // Note: this had to be jsdoc directly for QUERY_PARAMETERS_SCHEMA to support the correct auto formatting.

  /**
   * Query parameters that manipulate the startup state of the PhET simulation. This is not
   * an object defined in the global scope, but rather it serves as documentation about available query parameters.
   * Note: The "flag" type for query parameters does not expect a value for the key, but rather just the presence of
   * the key itself.
   * @namespace {Object} PhetQueryParameters
   */
  const QUERY_PARAMETERS_SCHEMA = {
    // Schema that describes query parameters for PhET common code.
    // These query parameters are available via global phet.chipper.queryParameters.

    /**
     * In environments where users should not be able to navigate hyperlinks away from the simulation, clients can use
     * ?allowLinks=false.  In this case, links are displayed and not clickable. This query parameter is public facing.
     * @memberOf PhetQueryParameters
     * @type {boolean}
     */
    allowLinks: {
      type: 'boolean',
      defaultValue: true,
      public: true
    },
    /**
     * Allows setting of the sound state, possible values are 'enabled' (default), 'muted', and 'disabled'.  Sound
     * must be supported by the sim for this to have any effect.
     * @memberOf PhetQueryParameters
     * @type {string}
     */
    audio: {
      type: 'string',
      defaultValue: 'enabled',
      validValues: ['enabled', 'disabled', 'muted'],
      public: true
    },
    /**
     * Generates object reports that can be used by binder. For internal use.
     * See InstanceRegistry.js and binder repo (specifically getFromSimInMain.js) for more details.
     */
    binder: {
      type: 'flag'
    },
    /**
     * specifies the brand that should be used in unbuilt mode
     */
    brand: {
      type: 'string',
      defaultValue: 'adapted-from-phet'
    },
    /**
     * When present, will trigger changes that are more similar to the build environment.
     * Right now, this includes computing higher-resolution mipmaps for the mipmap plugin.
     */
    buildCompatible: {
      type: 'flag'
    },
    /**
     * If this is a finite number AND assertions are enabled, it will track maximum Node child counts, and
     * will assert that the number of children on a single Node is not greater than the limit.
     */
    childLimit: {
      type: 'number',
      defaultValue: Number.POSITIVE_INFINITY,
      public: false
    },
    /**
     * When provided a non-zero-length value, the sim will send out assorted events meant for continuous testing
     * integration (see sim-test.js).
     */
    continuousTest: {
      type: 'string',
      defaultValue: ''
    },
    // Private Doc:  For external use. The below jsdoc is public to the PhET-iO API documentation. Change wisely.
    /**
     * The color profile used at startup, relevant only for sims that support multiple color profiles. 'default' and
     * 'projector' are implemented in several sims, other profile names are not currently standardized.
     * @memberOf PhetQueryParameters
     * @type {string}
     */
    colorProfile: {
      type: 'string',
      defaultValue: colorProfiles[0],
      // usually "default", but some sims like masses-and-springs-basics do not use default at all
      validValues: colorProfiles,
      public: true
    },
    /**
     * enables debugger commands in certain cases like thrown errors and failed tests.
     */
    debugger: {
      type: 'flag'
    },
    // Output deprecation warnings via console.warn, see https://github.com/phetsims/chipper/issues/882. For internal
    // use only.
    deprecationWarnings: {
      type: 'flag'
    },
    /**
     * enables developer-only features, such as showing the layout bounds
     */
    dev: {
      type: 'flag'
    },
    /**
     * sets all modal features of the sim as disabled. This is a development-only parameter that can be useful in
     * combination with fuzz testing. This was created to limit the amount of time fuzz testing spends on unimportant
     * features of the sim like the PhET Menu, Keyboard Help, and Preferences popups.
     */
    disableModals: {
      type: 'flag'
    },
    /**
     * enables assertions
     */
    ea: {
      type: 'flag'
    },
    /**
     * Enables all assertions, as above but with more time-consuming checks
     */
    eall: {
      type: 'flag'
    },
    /**
     * Controls whether extra sound is on or off at startup (user can change later).  This query parameter is public
     * facing.
     * @type {boolean}
     */
    extraSoundInitiallyEnabled: {
      type: 'flag',
      public: true
    },
    /**
     * Force Scenery to refresh SVG contents every frame (to help detect rendering/browser-repaint issues with SVG).
     */
    forceSVGRefresh: {
      type: 'flag'
    },
    /**
     * Randomly sends mouse events and touch events to sim.
     */
    fuzz: {
      type: 'flag'
    },
    /**
     * Randomly sends keyboard events to the sim. Must have accessibility enabled.
     */
    fuzzBoard: {
      type: 'flag'
    },
    /**
     * Randomly sends mouse events to sim.
     */
    fuzzMouse: {
      type: 'flag'
    },
    /**
     * The maximum number of concurrent pointers allowed for fuzzing. Using a value larger than 1 will test multitouch
     * behavior (with ?fuzz, ?fuzzMouse, ?fuzzTouch, etc.)
     */
    fuzzPointers: {
      type: 'number',
      defaultValue: 1
    },
    /**
     * Randomly sends touch events to sim.
     */
    fuzzTouch: {
      type: 'flag'
    },
    /**
     * if fuzzMouse=true or fuzzTouch=true, this is the average number of mouse/touch events to synthesize per frame.
     */
    fuzzRate: {
      type: 'number',
      defaultValue: 100,
      isValidValue: function (value) {
        return value > 0;
      }
    },
    /**
     * Used for providing an external Google Analytics 4 (gtag.js) property for tracking, see
     * https://github.com/phetsims/phetcommon/issues/46 for more information.
     *
     * Generally, this string will start with 'G-' for GA4 trackers
     *
     * This is useful for various users/clients that want to embed simulations, or direct users to simulations. For
     * example, if a sim is included in an epub, the sim HTML won't have to be modified to include page tracking.
     */
    ga4: {
      type: 'string',
      defaultValue: null,
      public: true
    },
    /**
     * Launches the game-up-camera code which delivers images to requests in BrainPOP/Game Up/SnapThought
     */
    gameUp: {
      type: 'flag'
    },
    /**
     * Enables the game-up-camera code to respond to messages from any origin
     */
    gameUpTestHarness: {
      type: 'flag'
    },
    /**
     * Enables logging for game-up-camera, see gameUp
     */
    gameUpLogging: {
      type: 'flag'
    },
    /**
     * Used for providing a Google Analytics page ID for tracking, see
     * https://github.com/phetsims/phetcommon/issues/46 for more information.
     *
     * This is given as the 3rd parameter to a pageview send when provided
     */
    gaPage: {
      type: 'string',
      defaultValue: null
    },
    // Private Doc:  For external use. The below jsdoc is public to the PhET-iO API documentation. Change wisely.
    /**
     * Indicates whether to display the home screen.
     * For multiscreen sims only, throws an assertion error if supplied for a single-screen sim.
     * @memberOf PhetQueryParameters
     * @type {boolean}
     */
    homeScreen: {
      type: 'boolean',
      defaultValue: true,
      public: true
    },
    // Private Doc: For external use. The below jsdoc is public to the PhET-iO API documentation. Change wisely.
    // The value is one of the values in the screens array, not an index into the screens array.
    /**
     * Specifies the initial screen that will be visible when the sim starts.
     * See `?screens` query parameter for screen numbering.
     * For multiscreen sims only, throws an assertion error if applied in a single-screen sims.
     * The default value of 0 is the home screen.
     * @memberOf PhetQueryParameters
     * @type {number}
     */
    initialScreen: {
      type: 'number',
      defaultValue: 0,
      // the home screen
      public: true
    },
    /**
     * Enables support for Legends of Learning platform, including broadcasting 'init' and responding to pause/resume.
     */
    legendsOfLearning: {
      type: 'flag'
    },
    /**
     * If this is a finite number AND assertions are enabled, it will track maximum (TinyEmitter) listener counts, and
     * will assert that the count is not greater than the limit.
     */
    listenerLimit: {
      type: 'number',
      defaultValue: Number.POSITIVE_INFINITY,
      public: false
    },
    /**
     * Select the language of the sim to the specific locale. Default to "en".
     * @memberOf PhetQueryParameters
     * @type {string}
     */
    locale: {
      type: 'string',
      defaultValue: 'en'
      // Do NOT add the `public` key here. We want invalid values to fall back to en.
    },
    /**
     * Provides the locales to load during startup for an un-built simulation (will automatically load the ?locale, or
     * English if provided).
     *
     * If the only provided value is '*', then it will load all the locales.
     */
    locales: {
      type: 'array',
      elementSchema: {
        type: 'string'
      },
      defaultValue: []
    },
    /**
     * Specify supports for dynamic locale switching in the runtime of the sim. By default, the value will be the support
     * in the runnable's package.json. Use this to turn off things like the locale switcher preference.
     * The package flag for this means very specific things depending on its presence and value.
     * - By default, with no entry in the package.json, we will still try to support locale switching if multiple locales
     * are available.
     * - If you add the truthy flag (supportsDynamicLocale:true), then it will ensure that strings use StringProperties
     * in your sim.
     * - If you do not want to support this, then you can opt out in the package.json with supportsDynamicLocale:false
     *
     * For more information about supporting dynamic locale, see the "Dynamic Strings Layout Quickstart Guide": https://github.com/phetsims/phet-info/blob/main/doc/dynamic-string-layout-quickstart.md
     */
    supportsDynamicLocale: {
      type: 'boolean',
      defaultValue: allowLocaleSwitching && (!packageSimFeatures.hasOwnProperty('supportsDynamicLocale') || packageSimFeatures.supportsDynamicLocale)
    },
    /**
     * Enables basic logging to the console.
     * Usage in code: phet.log && phet.log( 'your message' );
     */
    log: {
      type: 'flag'
    },
    /**
     * Sets a maximum "memory" limit (in MB). If the simulation's running average of memory usage goes over this amount
     * in operation (as determined currently by using Chrome's window.performance), then an error will be thrown.
     *
     * This is useful for continuous testing, to ensure we aren't leaking huge amounts of memory, and can also be used
     * with the Chrome command-line flag --enable-precise-memory-info to make the determination more accurate.
     *
     * The value 0 will be ignored, since our sims are likely to use more than that much memory.
     */
    memoryLimit: {
      type: 'number',
      defaultValue: 0
    },
    /**
     * Enables transforming the PDOM for accessibility on mobile devices. This work is experimental, and still hidden
     * in a scenery branch pdom-transform. Must be used in combination with the accessibility query parameter, or
     * on a sim that has accessibility enabled by default. This query parameter is not intended to be long-lived,
     * in the future these features should be always enabled in the scenery a11y framework.
     * See https://github.com/phetsims/scenery/issues/852
     *
     * For internal use and testing only, though links with this may be shared with collaborators.
     *
     * @a11y
     */
    mobileA11yTest: {
      type: 'flag'
    },
    /**p
     * If this is a finite number AND assertions are enabled, it will track maximum Node parent counts, and
     * will assert that the count is not greater than the limit.
     */
    parentLimit: {
      type: 'number',
      defaultValue: Number.POSITIVE_INFINITY,
      public: false
    },
    /**
     * When a simulation is run from the PhET Android app, it should set this flag. It alters statistics that the sim sends
     * to Google Analytics and potentially other sources in the future.
     *
     * Also removes the following items from the "PhET Menu":
     * Report a Problem
     * Check for Updates
     * Screenshot
     * Full Screen
     */
    'phet-android-app': {
      type: 'flag'
    },
    /**
     * When a simulation is run from the PhET iOS app, it should set this flag. It alters statistics that the sim sends
     * to Google Analytics and potentially other sources in the future.
     *
     * Also removes the following items from the "PhET Menu":
     * Report a Problem
     * Check for Updates
     * Screenshot
     * Full Screen
     */
    'phet-app': {
      type: 'flag'
    },
    /**
     * If true, puts the simulation in a special mode where it will wait for manual control of the sim playback.
     */
    playbackMode: {
      type: 'boolean',
      defaultValue: false
    },
    /**
     * Fires a post-message when the sim is about to change to another URL
     */
    postMessageOnBeforeUnload: {
      type: 'flag'
    },
    /**
     * passes errors to parent frame (like fuzz-lightyear)
     */
    postMessageOnError: {
      type: 'flag'
    },
    /**
     * triggers a post-message that fires when the sim finishes loading, currently used by aqua fuzz-lightyear
     */
    postMessageOnLoad: {
      type: 'flag'
    },
    /**
     * triggers a post-message that fires when the simulation is ready to start.
     */
    postMessageOnReady: {
      type: 'flag'
    },
    /**
     * Controls whether the preserveDrawingBuffer:true is set on WebGL Canvases. This allows canvas.toDataURL() to work
     * (used for certain methods that require screenshot generation using foreign object rasterization, etc.).
     * Generally reduces WebGL performance, so it should not always be on (thus the query parameter).
     */
    preserveDrawingBuffer: {
      type: 'flag'
    },
    /**
     * If true, the full screen button won't be shown in the phet menu
     */
    preventFullScreen: {
      type: 'flag'
    },
    /**
     * shows profiling information for the sim
     */
    profiler: {
      type: 'flag'
    },
    /**
     * adds a menu item that will open a window with a QR code with the URL of the simulation
     */
    qrCode: {
      type: 'flag'
    },
    /**
     * Random seed in the preload code that can be used to make sure playback simulations use the same seed (and thus
     * the simulation state, given the input events and frames, can be exactly reproduced)
     * See Random.js
     */
    randomSeed: {
      type: 'number',
      defaultValue: Math.random() // eslint-disable-line bad-sim-text
    },
    /*
     * Sets the default for the Region and Culture feature. The set of valid values is determined by
     * "supportedRegionsAndCulturesValues" in package.json. If not provided in the URL, the default can
     * be set via "defaultRegionAndCulture" in package.json, which defaults to 'usa'.
     */
    regionAndCulture: {
      public: true,
      type: 'string',
      defaultValue: packagePhet?.simFeatures?.defaultRegionAndCulture ?? 'usa',
      validValues: packagePhet?.simFeatures?.supportedRegionsAndCultures ?? ['usa'] // default value must be in validValues
    },
    /**
     * Specify a renderer for the Sim's rootNode to use.
     */
    rootRenderer: {
      type: 'string',
      defaultValue: null,
      validValues: [null, 'canvas', 'svg', 'dom', 'webgl', 'vello'] // see Node.setRenderer
    },
    /**
     * Array of one or more logs to enable in scenery 0.2+, delimited with commas.
     * For example: ?sceneryLog=Display,Drawable,WebGLBlock results in [ 'Display', 'Drawable', 'WebGLBlock' ]
     * Don't change this without updating the signature in scenery unit tests too.
     *
     * The entire supported list is in scenery.js in the logProperties object.
     */
    sceneryLog: {
      type: 'array',
      elementSchema: {
        type: 'string'
      },
      defaultValue: null
    },
    /**
     * Scenery logs will be output to a string instead of the window
     */
    sceneryStringLog: {
      type: 'flag'
    },
    /**
     * Specifies the set of screens that appear in the sim, and their order.
     * Uses 1-based (not zero-based) and "," delimited string such as "1,3,4" to get the 1st, 3rd and 4th screen.
     * @type {Array.<number>}
     */
    screens: {
      type: 'array',
      elementSchema: {
        type: 'number',
        isValidValue: Number.isInteger
      },
      defaultValue: null,
      isValidValue: function (value) {
        // screen indices cannot be duplicated
        return value === null || value.length === _.uniq(value).length && value.length > 0;
      },
      public: true
    },
    /**
     * Typically used to show answers (or hidden controls that show answers) to challenges in sim games.
     * For internal use by PhET team members only.
     */
    showAnswers: {
      type: 'flag',
      private: true
    },
    /**
     * Displays an overlay of the current bounds of each CanvasNode
     */
    showCanvasNodeBounds: {
      type: 'flag'
    },
    /**
     * Displays an overlay of the current bounds of each phet.scenery.FittedBlock
     */
    showFittedBlockBounds: {
      type: 'flag'
    },
    /**
     * Shows hit areas as dashed lines.
     */
    showHitAreas: {
      type: 'flag'
    },
    /**
     * Shows pointer areas as dashed lines. touchAreas are red, mouseAreas are blue.
     */
    showPointerAreas: {
      type: 'flag'
    },
    /**
     * Displays a semi-transparent cursor indicator for the position of each active pointer on the screen.
     */
    showPointers: {
      type: 'flag'
    },
    /**
     * Shows the visible bounds in ScreenView.js, for debugging the layout outside the "dev" bounds
     */
    showVisibleBounds: {
      type: 'flag'
    },
    /**
     * Adds a runtime check while computing the derivation of a DerivedProperty, that asserts that all queried Property
     * instances are listed in the dependencies. See https://github.com/phetsims/axon/issues/441
     */
    strictAxonDependencies: {
      type: 'boolean',
      defaultValue: packageSimFeatures.hasOwnProperty('strictAxonDependencies') ? !!packageSimFeatures.strictAxonDependencies : true
    },
    /**
     * Shuffles listeners each time they are notified, to help us test order dependency, see https://github.com/phetsims/axon/issues/215
     *
     * 'default' - no shuffling
     * 'random' - chooses a seed for you
     * 'random(123)' - specify a seed
     * 'reverse' - reverse the order of listeners
     */
    listenerOrder: {
      type: 'string',
      defaultValue: 'default',
      isValidValue: function (value) {
        // NOTE: this regular expression must be maintained in TinyEmitter.ts as well.
        const regex = /random(?:%28|\()(\d+)(?:%29|\))/;
        return value === 'default' || value === 'random' || value === 'reverse' || value.match(regex);
      }
    },
    /**
     * When true, use SpeechSynthesisParentPolyfill to assign an implementation of SpeechSynthesis
     * to the window so that it can be used in platforms where it otherwise would not be available.
     * Assumes that an implementation of SpeechSynthesis is available from a parent iframe window.
     * See SpeechSynthesisParentPolyfill in utterance-queue for more information.
     *
     * This cannot be a query parameter in utterance-queue because utterance-queue (a dependency of scenery)
     * can not use QueryStringMachine. See https://github.com/phetsims/scenery/issues/1366.
     *
     * For more information about the motivation for this see https://github.com/phetsims/fenster/issues/3
     *
     * For internal use only.
     */
    speechSynthesisFromParent: {
      type: 'flag'
    },
    /**
     * Speed multiplier for everything in the sim. This scales the value of dt for AXON/timer,
     * model.step, view.step, and anything else that is controlled from Sim.stepSimulation.
     * Normal speed is 1. Larger values make time go faster, smaller values make time go slower.
     * For example, ?speed=0.5 is half the normal speed.
     * Useful for testing multitouch, so that objects are easier to grab while they're moving.
     * For internal use only, not public facing.
     */
    speed: {
      type: 'number',
      defaultValue: 1,
      isValidValue: function (value) {
        return value > 0;
      }
    },
    /**
     * Override translated strings.
     * The value is encoded JSON of the form { "namespace.key":"value", "namespace.key":"value", ... }
     * Example: { "PH_SCALE/logarithmic":"foo", "PH_SCALE/linear":"bar" }
     * Encode the JSON in a browser console using: encodeURIComponent( JSON.stringify( value ) )
     */
    strings: {
      type: 'string',
      defaultValue: null
    },
    /**
     * Sets a string used for various i18n test.  The values are:
     *
     * double: duplicates all of the translated strings which will allow to see (a) if all strings
     *   are translated and (b) whether the layout can accommodate longer strings from other languages.
     *   Note this is a heuristic rule that does not cover all cases.
     *
     * long: an exceptionally long string will be substituted for all strings. Use this to test for layout problems.
     *
     * rtl: a string that tests RTL (right-to-left) capabilities will be substituted for all strings
     *
     * xss: tests for security issues related to https://github.com/phetsims/special-ops/issues/18,
     *   and running a sim should NOT redirect to another page. Preferably should be used for built versions or
     *   other versions where assertions are not enabled.
     *
     * none|null: the normal translated string will be shown
     *
     * dynamic: adds global hotkey listeners to change the strings, see https://github.com/phetsims/chipper/issues/1319
     *   right arrow - doubles a string, like string = string+string
     *   left arrow - halves a string
     *   up arrow - cycles to next stride in random word list
     *   down arrow - cycles to previous stride in random word list
     *   spacebar - resets to initial English strings, and resets the stride
     *
     * {string}: if any other string provided, that string will be substituted everywhere. This facilitates testing
     *   specific cases, like whether the word 'vitesse' would substitute for 'speed' well.  Also, using "/u20" it
     *   will show whitespace for all of the strings, making it easy to identify non-translated strings.
     */
    stringTest: {
      type: 'string',
      defaultValue: null
    },
    /**
     * adds keyboard shortcuts. ctrl+i (forward) or ctrl+u (backward). Also, the same physical keys on the
     * dvorak keyboard (c=forward and g=backwards)
     *
     * NOTE: DUPLICATION ALERT. Don't change this without looking at parameter in PHET_IO_WRAPPERS/PhetioClient.ts
     */
    keyboardLocaleSwitcher: {
      type: 'flag'
    },
    /**
     * Enables support for the accessible description plugin feature.
     */
    supportsDescriptionPlugin: {
      type: 'boolean',
      defaultValue: !!packageSimFeatures.supportsDescriptionPlugin
    },
    /**
     *
     * Enables interactive description in the simulation. Use this option to render the Parallel DOM for keyboard
     * navigation and screen-reader-based auditory descriptions. Can be permanently enabled if
     * `supportsInteractiveDescription: true` is added under the `phet.simFeatures` entry of package.json. Query parameter
     * value will always override package.json entry.
     */
    supportsInteractiveDescription: {
      type: 'boolean',
      defaultValue: !!packageSimFeatures.supportsInteractiveDescription
    },
    /**
     * Enables support for the "Interactive Highlights" feature, where highlights appear around interactive
     * UI components. This is most useful for users with low vision and makes it easier to identify interactive
     * components. Though enabled here, the feature will be turned off until enabled by the user from the Preferences
     * dialog.
     *
     * This feature is enabled by default whenever supportsInteractiveDescription is true in package.json, since PhET
     * wants to scale out this feature with all sims that support alternative input. The feature can be DISABLED when
     * supportsInteractiveDescription is true by setting `supportsInteractiveHighlights: false` under
     * `phet.simFeatures` in package.json.
     *
     * The query parameter will always override the package.json entry.
     */
    supportsInteractiveHighlights: {
      type: 'boolean',
      // If supportsInteractiveHighlights is explicitly provided in package.json, use that value. Otherwise, enable
      // Interactive Highlights when Interactive Description is supported.
      defaultValue: packageSimFeatures.hasOwnProperty('supportsInteractiveHighlights') ? !!packageSimFeatures.supportsInteractiveHighlights : !!packageSimFeatures.supportsInteractiveDescription
    },
    /**
     * By default, Interactive Highlights are disabled on startup. Provide this flag to have the feature enabled on
     * startup. Has no effect if supportsInteractiveHighlights is false.
     */
    interactiveHighlightsInitiallyEnabled: {
      type: 'flag',
      public: true
    },
    /**
     * Indicates whether custom gesture control is enabled by default in the simulation.
     * This input method is still in development, mostly to be used in combination with the voicing
     * feature. It allows you to swipe the screen to move focus, double tap the screen to activate
     * components, and tap and hold to initiate custom gestures.
     *
     * For internal use, though may be used in shared links with collaborators.
     */
    supportsGestureControl: {
      type: 'boolean',
      defaultValue: !!packageSimFeatures.supportsGestureControl
    },
    /**
     * Controls whether the "Voicing" feature is enabled.
     *
     * This feature is enabled by default when supportsVoicing is true in package.json. The query parameter will always
     * override the package.json entry.
     */
    supportsVoicing: {
      type: 'boolean',
      defaultValue: !!packageSimFeatures.supportsVoicing
    },
    /**
     * Switches the Vello rendering of Text to use Swash (with embedded fonts), instead of Canvas.
     *
     * For internal use only. This is currently only used in prototypes.
     */
    swashText: {
      type: 'boolean',
      defaultValue: true
    },
    /**
     * If non-empty, Swash-rendered text will show up in the given color (useful for debugging)
     *
     * For internal use only. This is currently only used in prototypes.
     */
    swashTextColor: {
      type: 'string',
      defaultValue: ''
    },
    /**
     * By default, voicing is not enabled on startup. Add this flag to start the sim with voicing enabled.
     */
    voicingInitiallyEnabled: {
      type: 'flag'
    },
    /**
     * A debug query parameter that will save and load you preferences (from the Preferences Dialog) through multiple runtimes.
     * See PreferencesStorage.register to see what Properties support this save/load feature.
     */
    preferencesStorage: {
      type: 'flag'
    },
    /**
     * Console log the voicing responses that are spoken by SpeechSynthesis
     */
    printVoicingResponses: {
      type: 'flag'
    },
    /**
     * Enables panning and zooming of the simulation. Can be permanently disabled if supportsPanAndZoom: false is
     * added under the `phet.simFeatures` entry of package.json. Query parameter value will always override package.json entry.
     *
     * Public, so that users can disable this feature if they need to.
     */
    supportsPanAndZoom: {
      type: 'boolean',
      public: true,
      // even if not provided in package.json, this defaults to being true
      defaultValue: !packageSimFeatures.hasOwnProperty('supportsPanAndZoom') || packageSimFeatures.supportsPanAndZoom
    },
    /**
     * Indicates whether the sound library should be enabled.  If true, an icon is added to the nav bar icon to enable
     * the user to turn sound on/off.  There is also a Sim option for enabling sound which can override this.
     * Primarily for internal use, though we may share links with collaborates that use this parameter.
     */
    supportsSound: {
      type: 'boolean',
      defaultValue: !!packageSimFeatures.supportsSound
    },
    /**
     * Indicates whether extra sounds are used in addition to basic sounds as part of the sound design.  If true, the
     * PhET menu will have an option for enabling extra sounds.  This will be ignored if sound is not generally
     * enabled (see ?supportsSound).
     *
     * Primarily for internal use, though we may share links with collaborates that use this parameter.
     */
    supportsExtraSound: {
      type: 'boolean',
      defaultValue: !!packageSimFeatures.supportsExtraSound
    },
    /**
     * Indicates whether or not vibration is enabled, and which paradigm is enabled for testing. There
     * are several "paradigms", which are different vibration output designs.  For temporary use
     * while we investigate use of this feature. In the long run there will probably be only
     * one design and it can be enabled/disabled with something more like `supportsVibration`.
     *
     * These are numbered, but type is string so default can be null, where all vibration is disabled.
     *
     * Used internally, though links are shared with collaborators and possibly in paper publications.
     */
    vibrationParadigm: {
      type: 'string',
      defaultValue: null
    },
    /**
     * Enables WebGL rendering. See https://github.com/phetsims/scenery/issues/289.
     * Note that simulations can opt-in to webgl via new Sim({webgl:true}), but using ?webgl=true takes
     * precedence.  If no webgl query parameter is supplied, then simulations take the Sim option value, which
     * defaults to false.  See see https://github.com/phetsims/scenery/issues/621
     */
    webgl: {
      type: 'boolean',
      defaultValue: true
    },
    /**
     * Indicates whether yotta analytics are enabled.
     */
    yotta: {
      type: 'boolean',
      defaultValue: true,
      public: true
    }
  };

  // Initialize query parameters, see docs above
  (function () {
    // Create the attachment point for all PhET globals
    window.phet = window.phet || {};
    window.phet.chipper = window.phet.chipper || {};

    // Read query parameters
    window.phet.chipper.queryParameters = QueryStringMachine.getAll(QUERY_PARAMETERS_SCHEMA);
    window.phet.chipper.colorProfiles = colorProfiles;

    /**
     * Determines whether any type of fuzzing is enabled. This is a function so that the associated query parameters
     * can be changed from the console while the sim is running. See https://github.com/phetsims/sun/issues/677.
     * @returns {boolean}
     */
    window.phet.chipper.isFuzzEnabled = () => window.phet.chipper.queryParameters.fuzz || window.phet.chipper.queryParameters.fuzzMouse || window.phet.chipper.queryParameters.fuzzTouch || window.phet.chipper.queryParameters.fuzzBoard;

    // Add a log function that displays messages to the console. Examples:
    // phet.log && phet.log( 'You win!' );
    // phet.log && phet.log( 'You lose', { color: 'red' } );
    if (window.phet.chipper.queryParameters.log) {
      window.phet.log = function (message, options) {
        options = _.assignIn({
          color: '#009900' // green
        }, options);
        console.log(`%c${message}`, `color: ${options.color}`); // green
      };
    }

    /**
     * Gets the name of brand to use, which determines which logo to show in the navbar as well as what options
     * to show in the PhET menu and what text to show in the About dialog.
     * See https://github.com/phetsims/brand/issues/11
     * @returns {string}
     */
    window.phet.chipper.brand = window.phet.chipper.brand || phet.chipper.queryParameters.brand || 'adapted-from-phet';

    // {string|null} - See documentation of stringTest query parameter - we need to support this during build, where
    //                 there aren't any query parameters.
    const stringTest = typeof window !== 'undefined' && phet.chipper.queryParameters.stringTest ? phet.chipper.queryParameters.stringTest : null;

    /**
     * Maps an input string to a final string, accommodating tricks like doubleStrings.
     * This function is used to modify all strings in a sim when the stringTest query parameter is used.
     * The stringTest query parameter and its options are documented in the query parameter docs above.
     * It is used in string.js and sim.html.
     * @param string - the string to be mapped
     * @returns {string}
     */
    window.phet.chipper.mapString = function (string) {
      const script = 'script';
      return stringTest === null ? string : stringTest === 'double' ? `${string}:${string}` : stringTest === 'long' ? '12345678901234567890123456789012345678901234567890' : stringTest === 'rtl' ? '\u202b\u062a\u0633\u062a (\u0632\u0628\u0627\u0646)\u202c' : stringTest === 'xss' ? `${string}<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2NkYGD4DwABCQEBtxmN7wAAAABJRU5ErkJggg==" onload="window.location.href=atob('aHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1kUXc0dzlXZ1hjUQ==')" />` : stringTest === 'xss2' ? `${string}<${script}>alert('XSS')</${script}>` : stringTest === 'none' ? string : stringTest === 'dynamic' ? string :
      // In the fallback case, supply whatever string was given in the query parameter value
      stringTest;
    };

    // We will need to check for locale validity (once we have localeData loaded, if running unbuilt), and potentially
    // either fall back to `en`, or remap from 3-character locales to our locale keys.
    phet.chipper.checkAndRemapLocale = () => {
      // We need both to proceed. Provided as a global, so we can call it from load-unbuilt-strings
      // (IF initialize-globals loads first)
      if (!phet.chipper.localeData || !phet.chipper.locale) {
        return;
      }
      let locale = phet.chipper.locale;
      if (locale) {
        if (locale.length < 5) {
          locale = locale.toLowerCase();
        } else {
          locale = locale.replace(/-/, '_');
          const parts = locale.split('_');
          if (parts.length === 2) {
            locale = parts[0].toLowerCase() + '_' + parts[1].toUpperCase();
          }
        }
        if (locale.length === 3) {
          for (const candidateLocale of Object.keys(phet.chipper.localeData)) {
            if (phet.chipper.localeData[candidateLocale].locale3 === locale) {
              locale = candidateLocale;
              break;
            }
          }
        }
      }
      if (!phet.chipper.localeData[locale]) {
        const badLocale = phet.chipper.queryParameters.locale;
        const isPair = /^[a-z]{2}$/.test(badLocale);
        const isTriple = /^[a-z]{3}$/.test(badLocale);
        const isPair_PAIR = /^[a-z]{2}_[A-Z]{2}$/.test(badLocale);
        if (!isPair && !isTriple && !isPair_PAIR) {
          QueryStringMachine.addWarning('locale', phet.chipper.queryParameters.locale, `Invalid locale format received: ${badLocale}. ?locale query parameter accepts the following formats: "xx" for ISO-639-1, "xx_XX" for ISO-639-1 and a 2-letter country code, "xxx" for ISO-639-2`);
        }
        locale = 'en';
      }
      phet.chipper.locale = locale;
    };

    // If locale was provided as a query parameter, then change the locale used by Google Analytics.
    if (QueryStringMachine.containsKey('locale')) {
      phet.chipper.locale = phet.chipper.queryParameters.locale;

      // NOTE: If we are loading in unbuilt mode, this may execute BEFORE we have loaded localeData. We have a similar
      // remapping in load-unbuilt-strings when this happens.
      phet.chipper.checkAndRemapLocale();
    } else if (!window.phet.chipper.locale) {
      // Fill in a default
      window.phet.chipper.locale = 'en';
    }
    const stringOverrides = JSON.parse(phet.chipper.queryParameters.strings || '{}');

    /**
     * Get a string given the key. This implementation is meant for use only in the build sim. For more info see the
     * string plugin.
     * @param {string} key - like "REPO/string.key.here" which includes the requirejsNamespace, which is specified in package.json
     * @returns {string}
     */
    phet.chipper.getStringForBuiltSim = key => {
      assert && assert(!!phet.chipper.isProduction, 'expected to be running a built sim');
      assert && assert(!!phet.chipper.strings, 'phet.chipper.strings should be filled out by initialization script');
      assert && assert(!!phet.chipper.locale, 'locale is required to look up the correct strings');

      // override strings via the 'strings' query parameter
      if (stringOverrides[key]) {
        return stringOverrides[key];
      }

      // Get a list of locales in the order they should be searched
      const fallbackLocales = [phet.chipper.locale, ...(phet.chipper.localeData[phet.chipper.locale]?.fallbackLocales || []), phet.chipper.locale !== 'en' ? ['en'] : []];
      let stringMap = null;
      for (const locale of fallbackLocales) {
        stringMap = phet.chipper.strings[locale];
        if (stringMap) {
          break;
        }
      }
      return phet.chipper.mapString(stringMap[key]);
    };
  })();

  /**
   * Utility function to pause synchronously for the given number of milliseconds.
   * @param {number} millis - amount of time to pause synchronously
   */
  function sleep(millis) {
    const date = new Date();
    let curDate;
    do {
      curDate = new Date();
    } while (curDate - date < millis);
  }

  /*
   * These are used to make sure our sims still behave properly with an artificially higher load (so we can test what happens
   * at 30fps, 5fps, etc). There tend to be bugs that only happen on less-powerful devices, and these functions facilitate
   * testing a sim for robustness, and allowing others to reproduce slow-behavior bugs.
   */
  window.phet.chipper.makeEverythingSlow = function () {
    window.setInterval(() => {
      sleep(64);
    }, 16); // eslint-disable-line bad-sim-text
  };
  window.phet.chipper.makeRandomSlowness = function () {
    window.setInterval(() => {
      sleep(Math.ceil(100 + Math.random() * 200));
    }, Math.ceil(100 + Math.random() * 200)); // eslint-disable-line bad-sim-text
  };

  // Are we running a built html file?
  window.phet.chipper.isProduction = $('meta[name=phet-sim-level]').attr('content') === 'production';

  // Are we running in an app?
  window.phet.chipper.isApp = phet.chipper.queryParameters['phet-app'] || phet.chipper.queryParameters['phet-android-app'];

  /**
   * An IIFE here helps capture variables in final logic needed in the global, preload scope for the phetsim environment.
   *
   * Enables or disables assertions in common libraries using query parameters.
   * There are two types of assertions: basic and slow. Enabling slow assertions will adversely impact performance.
   * 'ea' enables basic assertions, 'eall' enables basic and slow assertions.
   * Must be run before the main modules, and assumes that assert.js and query-parameters.js has been run.
   */
  (function () {
    // enables all assertions (basic and slow)
    const enableAllAssertions = !phet.chipper.isProduction && phet.chipper.queryParameters.eall;

    // enables basic assertions
    const enableBasicAssertions = enableAllAssertions || !phet.chipper.isProduction && phet.chipper.queryParameters.ea || phet.chipper.isDebugBuild;
    if (enableBasicAssertions) {
      window.assertions.enableAssert();
    }
    if (enableAllAssertions) {
      window.assertions.enableAssertSlow();
    }

    /**
     * Sends a message to a continuous testing container.
     * @public
     *
     * @param {Object} [options] - Specific object results sent to CT.
     */
    window.phet.chipper.reportContinuousTestResult = options => {
      window.parent && window.parent.postMessage(JSON.stringify(_.assignIn({
        continuousTest: JSON.parse(phet.chipper.queryParameters.continuousTest),
        url: window.location.href
      }, options)), '*');
    };
    if (phet.chipper.queryParameters.continuousTest) {
      window.addEventListener('error', a => {
        let message = '';
        let stack = '';
        if (a && a.message) {
          message = a.message;
        }
        if (a && a.error && a.error.stack) {
          stack = a.error.stack;
        }
        phet.chipper.reportContinuousTestResult({
          type: 'continuous-test-error',
          message: message,
          stack: stack
        });
      });
      window.addEventListener('beforeunload', e => {
        phet.chipper.reportContinuousTestResult({
          type: 'continuous-test-unload'
        });
      });
      // window.open stub. otherwise we get tons of "Report Problem..." popups that stall
      window.open = () => {
        return {
          focus: () => {},
          blur: () => {}
        };
      };
    }

    // Communicate sim errors to CT or other listening parent frames
    if (phet.chipper.queryParameters.postMessageOnError) {
      window.addEventListener('error', a => {
        let message = '';
        let stack = '';
        if (a && a.message) {
          message = a.message;
        }
        if (a && a.error && a.error.stack) {
          stack = a.error.stack;
        }
        window.parent && window.parent.postMessage(JSON.stringify({
          type: 'error',
          url: window.location.href,
          message: message,
          stack: stack
        }), '*');
      });
    }
    if (phet.chipper.queryParameters.postMessageOnBeforeUnload) {
      window.addEventListener('beforeunload', e => {
        window.parent && window.parent.postMessage(JSON.stringify({
          type: 'beforeUnload'
        }), '*');
      });
    }
  })();
  (() => {
    // Validation logic on the simFeatures section of the packageJSON, many of which are used in sims, and should be
    // defined correctly for the sim to run.

    const simFeaturesSchema = {
      supportsInteractiveDescription: {
        type: 'boolean'
      },
      supportsVoicing: {
        type: 'boolean'
      },
      supportsInteractiveHighlights: {
        type: 'boolean'
      },
      supportsDescriptionPlugin: {
        type: 'boolean'
      },
      supportsSound: {
        type: 'boolean'
      },
      supportsExtraSound: {
        type: 'boolean'
      },
      supportsDynamicLocale: {
        type: 'boolean'
      },
      colorProfiles: {
        type: 'array'
      },
      supportedRegionsAndCultures: {
        type: 'array'
      },
      defaultRegionAndCulture: {
        type: 'string'
      },
      strictAxonDependencies: {
        type: 'boolean'
      }
    };
    Object.keys(simFeaturesSchema).forEach(schemaKey => {
      assert && assert(!packagePhet.hasOwnProperty(schemaKey), `${schemaKey} is a sim feature and should be in "simFeatures" in the package.json`);
    });
    assert && assert(!packageObject.hasOwnProperty('simFeatures'), 'simFeatures must be nested under \'phet\'');
    if (packagePhet.hasOwnProperty('simFeatures')) {
      const simFeatures = packagePhet.simFeatures;
      Object.keys(simFeatures).forEach(simFeatureName => {
        const simFeatureValue = simFeatures[simFeatureName];
        assert && assert(simFeaturesSchema.hasOwnProperty(simFeatureName), `unsupported sim feature: ${simFeatureName}`);
        if (simFeaturesSchema[simFeatureName]) {
          if (simFeaturesSchema[simFeatureName.type] === 'boolean') {
            assert && assert(typeof simFeatureValue === 'boolean', `boolean value expected for ${simFeatureName}`);
          } else if (simFeaturesSchema[simFeatureName.type] === 'array') {
            assert && assert(Array.isArray(simFeatureValue), `array value expected for ${simFeatureName}`);

            // At this time, all arrays are assumed to only support strings
            assert && assert(_.every(simFeatureValue, value => typeof value === 'string'), `string entry expected for ${simFeatureName}`);
          }
        }
      });
    }
  })();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3NlcnQiLCJ3aW5kb3ciLCJRdWVyeVN0cmluZ01hY2hpbmUiLCJwYWNrYWdlT2JqZWN0IiwiXyIsImhhc0luIiwicGhldCIsImNoaXBwZXIiLCJwYWNrYWdlUGhldCIsImFsbG93TG9jYWxlU3dpdGNoaW5nIiwicGFja2FnZVNpbUZlYXR1cmVzIiwic2ltRmVhdHVyZXMiLCJERUZBVUxUX0NPTE9SX1BST0ZJTEUiLCJjb2xvclByb2ZpbGVzIiwiUVVFUllfUEFSQU1FVEVSU19TQ0hFTUEiLCJhbGxvd0xpbmtzIiwidHlwZSIsImRlZmF1bHRWYWx1ZSIsInB1YmxpYyIsImF1ZGlvIiwidmFsaWRWYWx1ZXMiLCJiaW5kZXIiLCJicmFuZCIsImJ1aWxkQ29tcGF0aWJsZSIsImNoaWxkTGltaXQiLCJOdW1iZXIiLCJQT1NJVElWRV9JTkZJTklUWSIsImNvbnRpbnVvdXNUZXN0IiwiY29sb3JQcm9maWxlIiwiZGVidWdnZXIiLCJkZXByZWNhdGlvbldhcm5pbmdzIiwiZGV2IiwiZGlzYWJsZU1vZGFscyIsImVhIiwiZWFsbCIsImV4dHJhU291bmRJbml0aWFsbHlFbmFibGVkIiwiZm9yY2VTVkdSZWZyZXNoIiwiZnV6eiIsImZ1enpCb2FyZCIsImZ1enpNb3VzZSIsImZ1enpQb2ludGVycyIsImZ1enpUb3VjaCIsImZ1enpSYXRlIiwiaXNWYWxpZFZhbHVlIiwidmFsdWUiLCJnYTQiLCJnYW1lVXAiLCJnYW1lVXBUZXN0SGFybmVzcyIsImdhbWVVcExvZ2dpbmciLCJnYVBhZ2UiLCJob21lU2NyZWVuIiwiaW5pdGlhbFNjcmVlbiIsImxlZ2VuZHNPZkxlYXJuaW5nIiwibGlzdGVuZXJMaW1pdCIsImxvY2FsZSIsImxvY2FsZXMiLCJlbGVtZW50U2NoZW1hIiwic3VwcG9ydHNEeW5hbWljTG9jYWxlIiwiaGFzT3duUHJvcGVydHkiLCJsb2ciLCJtZW1vcnlMaW1pdCIsIm1vYmlsZUExMXlUZXN0IiwicGFyZW50TGltaXQiLCJwbGF5YmFja01vZGUiLCJwb3N0TWVzc2FnZU9uQmVmb3JlVW5sb2FkIiwicG9zdE1lc3NhZ2VPbkVycm9yIiwicG9zdE1lc3NhZ2VPbkxvYWQiLCJwb3N0TWVzc2FnZU9uUmVhZHkiLCJwcmVzZXJ2ZURyYXdpbmdCdWZmZXIiLCJwcmV2ZW50RnVsbFNjcmVlbiIsInByb2ZpbGVyIiwicXJDb2RlIiwicmFuZG9tU2VlZCIsIk1hdGgiLCJyYW5kb20iLCJyZWdpb25BbmRDdWx0dXJlIiwiZGVmYXVsdFJlZ2lvbkFuZEN1bHR1cmUiLCJzdXBwb3J0ZWRSZWdpb25zQW5kQ3VsdHVyZXMiLCJyb290UmVuZGVyZXIiLCJzY2VuZXJ5TG9nIiwic2NlbmVyeVN0cmluZ0xvZyIsInNjcmVlbnMiLCJpc0ludGVnZXIiLCJsZW5ndGgiLCJ1bmlxIiwic2hvd0Fuc3dlcnMiLCJwcml2YXRlIiwic2hvd0NhbnZhc05vZGVCb3VuZHMiLCJzaG93Rml0dGVkQmxvY2tCb3VuZHMiLCJzaG93SGl0QXJlYXMiLCJzaG93UG9pbnRlckFyZWFzIiwic2hvd1BvaW50ZXJzIiwic2hvd1Zpc2libGVCb3VuZHMiLCJzdHJpY3RBeG9uRGVwZW5kZW5jaWVzIiwibGlzdGVuZXJPcmRlciIsInJlZ2V4IiwibWF0Y2giLCJzcGVlY2hTeW50aGVzaXNGcm9tUGFyZW50Iiwic3BlZWQiLCJzdHJpbmdzIiwic3RyaW5nVGVzdCIsImtleWJvYXJkTG9jYWxlU3dpdGNoZXIiLCJzdXBwb3J0c0Rlc2NyaXB0aW9uUGx1Z2luIiwic3VwcG9ydHNJbnRlcmFjdGl2ZURlc2NyaXB0aW9uIiwic3VwcG9ydHNJbnRlcmFjdGl2ZUhpZ2hsaWdodHMiLCJpbnRlcmFjdGl2ZUhpZ2hsaWdodHNJbml0aWFsbHlFbmFibGVkIiwic3VwcG9ydHNHZXN0dXJlQ29udHJvbCIsInN1cHBvcnRzVm9pY2luZyIsInN3YXNoVGV4dCIsInN3YXNoVGV4dENvbG9yIiwidm9pY2luZ0luaXRpYWxseUVuYWJsZWQiLCJwcmVmZXJlbmNlc1N0b3JhZ2UiLCJwcmludFZvaWNpbmdSZXNwb25zZXMiLCJzdXBwb3J0c1BhbkFuZFpvb20iLCJzdXBwb3J0c1NvdW5kIiwic3VwcG9ydHNFeHRyYVNvdW5kIiwidmlicmF0aW9uUGFyYWRpZ20iLCJ3ZWJnbCIsInlvdHRhIiwicXVlcnlQYXJhbWV0ZXJzIiwiZ2V0QWxsIiwiaXNGdXp6RW5hYmxlZCIsIm1lc3NhZ2UiLCJvcHRpb25zIiwiYXNzaWduSW4iLCJjb2xvciIsImNvbnNvbGUiLCJtYXBTdHJpbmciLCJzdHJpbmciLCJzY3JpcHQiLCJjaGVja0FuZFJlbWFwTG9jYWxlIiwibG9jYWxlRGF0YSIsInRvTG93ZXJDYXNlIiwicmVwbGFjZSIsInBhcnRzIiwic3BsaXQiLCJ0b1VwcGVyQ2FzZSIsImNhbmRpZGF0ZUxvY2FsZSIsIk9iamVjdCIsImtleXMiLCJsb2NhbGUzIiwiYmFkTG9jYWxlIiwiaXNQYWlyIiwidGVzdCIsImlzVHJpcGxlIiwiaXNQYWlyX1BBSVIiLCJhZGRXYXJuaW5nIiwiY29udGFpbnNLZXkiLCJzdHJpbmdPdmVycmlkZXMiLCJKU09OIiwicGFyc2UiLCJnZXRTdHJpbmdGb3JCdWlsdFNpbSIsImtleSIsImlzUHJvZHVjdGlvbiIsImZhbGxiYWNrTG9jYWxlcyIsInN0cmluZ01hcCIsInNsZWVwIiwibWlsbGlzIiwiZGF0ZSIsIkRhdGUiLCJjdXJEYXRlIiwibWFrZUV2ZXJ5dGhpbmdTbG93Iiwic2V0SW50ZXJ2YWwiLCJtYWtlUmFuZG9tU2xvd25lc3MiLCJjZWlsIiwiJCIsImF0dHIiLCJpc0FwcCIsImVuYWJsZUFsbEFzc2VydGlvbnMiLCJlbmFibGVCYXNpY0Fzc2VydGlvbnMiLCJpc0RlYnVnQnVpbGQiLCJhc3NlcnRpb25zIiwiZW5hYmxlQXNzZXJ0IiwiZW5hYmxlQXNzZXJ0U2xvdyIsInJlcG9ydENvbnRpbnVvdXNUZXN0UmVzdWx0IiwicGFyZW50IiwicG9zdE1lc3NhZ2UiLCJzdHJpbmdpZnkiLCJ1cmwiLCJsb2NhdGlvbiIsImhyZWYiLCJhZGRFdmVudExpc3RlbmVyIiwiYSIsInN0YWNrIiwiZXJyb3IiLCJlIiwib3BlbiIsImZvY3VzIiwiYmx1ciIsInNpbUZlYXR1cmVzU2NoZW1hIiwiZm9yRWFjaCIsInNjaGVtYUtleSIsInNpbUZlYXR1cmVOYW1lIiwic2ltRmVhdHVyZVZhbHVlIiwiQXJyYXkiLCJpc0FycmF5IiwiZXZlcnkiXSwic291cmNlcyI6WyJpbml0aWFsaXplLWdsb2JhbHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTUtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogSW5pdGlhbGl6ZXMgcGhldCBnbG9iYWxzIHRoYXQgYXJlIHVzZWQgYnkgYWxsIHNpbXVsYXRpb25zLCBpbmNsdWRpbmcgYXNzZXJ0aW9ucyBhbmQgcXVlcnktcGFyYW1ldGVycy5cclxuICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0Y29tbW9uL2lzc3Vlcy8yM1xyXG4gKiBUaGlzIGZpbGUgbXVzdCBiZSBsb2FkZWQgYmVmb3JlIHRoZSBzaW11bGF0aW9uIGlzIHN0YXJ0ZWQgdXAsIGFuZCB0aGlzIGZpbGUgY2Fubm90IGJlIGxvYWRlZCBhcyBhbiBBTUQgbW9kdWxlLlxyXG4gKiBUaGUgZWFzaWVzdCB3YXkgdG8gZG8gdGhpcyBpcyB2aWEgYSA8c2NyaXB0PiB0YWcgaW4geW91ciBIVE1MIGZpbGUuXHJcbiAqXHJcbiAqIFBoRVQgU2ltdWxhdGlvbnMgY2FuIGJlIGxhdW5jaGVkIHdpdGggcXVlcnkgcGFyYW1ldGVycyB3aGljaCBlbmFibGUgY2VydGFpbiBmZWF0dXJlcy4gIFRvIHVzZSBhIHF1ZXJ5IHBhcmFtZXRlcixcclxuICogcHJvdmlkZSB0aGUgZnVsbCBVUkwgb2YgdGhlIHNpbXVsYXRpb24gYW5kIGFwcGVuZCBhIHF1ZXN0aW9uIG1hcmsgKD8pIHRoZW4gdGhlIHF1ZXJ5IHBhcmFtZXRlciAoYW5kIG9wdGlvbmFsbHkgaXRzXHJcbiAqIHZhbHVlIGFzc2lnbm1lbnQpLiAgRm9yIGluc3RhbmNlOlxyXG4gKiBodHRwczovL3BoZXQtZGV2LmNvbG9yYWRvLmVkdS9odG1sL3JlYWN0YW50cy1wcm9kdWN0cy1hbmQtbGVmdG92ZXJzLzEuMC4wLWRldi4xMy9yZWFjdGFudHMtcHJvZHVjdHMtYW5kLWxlZnRvdmVyc19lbi5odG1sP2RldlxyXG4gKlxyXG4gKiBIZXJlIGlzIGFuIGV4YW1wbGUgb2YgYSB2YWx1ZSBhc3NpZ25tZW50OlxyXG4gKiBodHRwczovL3BoZXQtZGV2LmNvbG9yYWRvLmVkdS9odG1sL3JlYWN0YW50cy1wcm9kdWN0cy1hbmQtbGVmdG92ZXJzLzEuMC4wLWRldi4xMy9yZWFjdGFudHMtcHJvZHVjdHMtYW5kLWxlZnRvdmVyc19lbi5odG1sP3dlYmdsPWZhbHNlXHJcbiAqXHJcbiAqIFRvIHVzZSBtdWx0aXBsZSBxdWVyeSBwYXJhbWV0ZXJzLCBzcGVjaWZ5IHRoZSBxdWVzdGlvbiBtYXJrIGJlZm9yZSB0aGUgZmlyc3QgcXVlcnkgcGFyYW1ldGVyLCB0aGVuIGFtcGVyc2FuZHMgKCYpXHJcbiAqIGJldHdlZW4gb3RoZXIgcXVlcnkgcGFyYW1ldGVycy4gIEhlcmUgaXMgYW4gZXhhbXBsZSBvZiBtdWx0aXBsZSBxdWVyeSBwYXJhbWV0ZXJzOlxyXG4gKiBodHRwczovL3BoZXQtZGV2LmNvbG9yYWRvLmVkdS9odG1sL3JlYWN0YW50cy1wcm9kdWN0cy1hbmQtbGVmdG92ZXJzLzEuMC4wLWRldi4xMy9yZWFjdGFudHMtcHJvZHVjdHMtYW5kLWxlZnRvdmVyc19lbi5odG1sP2RldiZzaG93UG9pbnRlckFyZWFzJndlYmdsPWZhbHNlXHJcbiAqXHJcbiAqIEZvciBtb3JlIG9uIHF1ZXJ5IHBhcmFtZXRlcnMgaW4gZ2VuZXJhbCwgc2VlIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvUXVlcnlfc3RyaW5nXHJcbiAqIEZvciBkZXRhaWxzIG9uIGNvbW1vbi1jb2RlIHF1ZXJ5IHBhcmFtZXRlcnMsIHNlZSBRVUVSWV9QQVJBTUVURVJTX1NDSEVNQSBiZWxvdy5cclxuICogRm9yIHNpbS1zcGVjaWZpYyBxdWVyeSBwYXJhbWV0ZXJzIChpZiB0aGVyZSBhcmUgYW55KSwgc2VlICpRdWVyeVBhcmFtZXRlcnMuanMgaW4gdGhlIHNpbXVsYXRpb24ncyByZXBvc2l0b3J5LlxyXG4gKlxyXG4gKiBNYW55IG9mIHRoZXNlIHF1ZXJ5IHBhcmFtZXRlcnMnIGpzZG9jIGlzIHJlbmRlcmVkIGFuZCB2aXNpYmxlIHB1YmxpY2x5IHRvIFBoRVQtaU8gY2xpZW50LiBUaG9zZSBzZWN0aW9ucyBzaG91bGQgYmVcclxuICogbWFya2VkLCBzZWUgdG9wIGxldmVsIGNvbW1lbnQgaW4gUGhldGlvQ2xpZW50LmpzIGFib3V0IHByaXZhdGUgdnMgcHVibGljIGRvY3VtZW50YXRpb25cclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKiBAYXV0aG9yIENocmlzIE1hbGxleSAoUGl4ZWxab29tLCBJbmMuKVxyXG4gKi9cclxuKCBmdW5jdGlvbigpIHtcclxuXHJcblxyXG4gIGFzc2VydCAmJiBhc3NlcnQoIHdpbmRvdy5RdWVyeVN0cmluZ01hY2hpbmUsICdRdWVyeVN0cmluZ01hY2hpbmUgaXMgdXNlZCwgYW5kIHNob3VsZCBiZSBsb2FkZWQgYmVmb3JlIHRoaXMgY29kZSBydW5zJyApO1xyXG5cclxuICAvLyBwYWNrYWdlT2JqZWN0IG1heSBub3QgYWx3YXlzIGJlIGF2YWlsYWJsZSBpZiBpbml0aWFsaXplLWdsb2JhbHMgdXNlZCB3aXRob3V0IGNoaXBwZXItaW5pdGlhbGl6YXRpb24uanNcclxuICBjb25zdCBwYWNrYWdlT2JqZWN0ID0gXy5oYXNJbiggd2luZG93LCAncGhldC5jaGlwcGVyLnBhY2thZ2VPYmplY3QnICkgPyBwaGV0LmNoaXBwZXIucGFja2FnZU9iamVjdCA6IHt9O1xyXG4gIGNvbnN0IHBhY2thZ2VQaGV0ID0gcGFja2FnZU9iamVjdC5waGV0IHx8IHt9O1xyXG5cclxuICAvLyBOb3QgYWxsIHJ1bnRpbWVzIHdpbGwgaGF2ZSB0aGlzIGZsYWcsIHNvIGJlIGdyYWNlZnVsXHJcbiAgY29uc3QgYWxsb3dMb2NhbGVTd2l0Y2hpbmcgPSBfLmhhc0luKCB3aW5kb3csICdwaGV0LmNoaXBwZXIuYWxsb3dMb2NhbGVTd2l0Y2hpbmcnICkgPyBwaGV0LmNoaXBwZXIuYWxsb3dMb2NhbGVTd2l0Y2hpbmcgOiB0cnVlO1xyXG5cclxuICAvLyBkdWNrIHR5cGUgZGVmYXVsdHMgc28gdGhhdCBub3QgYWxsIHBhY2thZ2UuanNvbiBmaWxlcyBuZWVkIHRvIGhhdmUgYSBwaGV0LnNpbUZlYXR1cmVzIHNlY3Rpb24uXHJcbiAgY29uc3QgcGFja2FnZVNpbUZlYXR1cmVzID0gcGFja2FnZVBoZXQuc2ltRmVhdHVyZXMgfHwge307XHJcblxyXG4gIC8vIFRoZSBjb2xvciBwcm9maWxlIHVzZWQgYnkgZGVmYXVsdCwgaWYgbm8gY29sb3JQcm9maWxlcyBhcmUgc3BlY2lmaWVkIGluIHBhY2thZ2UuanNvbi5cclxuICAvLyBOT1RFOiBEdXBsaWNhdGVkIGluIFNjZW5lcnlDb25zdGFudHMuanMgc2luY2Ugc2NlbmVyeSBkb2VzIG5vdCBpbmNsdWRlIGluaXRpYWxpemUtZ2xvYmFscy5qc1xyXG4gIGNvbnN0IERFRkFVTFRfQ09MT1JfUFJPRklMRSA9ICdkZWZhdWx0JztcclxuXHJcbiAgLy8gVGhlIHBvc3NpYmxlIGNvbG9yIHByb2ZpbGVzIGZvciB0aGUgY3VycmVudCBzaW11bGF0aW9uLlxyXG4gIGNvbnN0IGNvbG9yUHJvZmlsZXMgPSBwYWNrYWdlU2ltRmVhdHVyZXMuY29sb3JQcm9maWxlcyB8fCBbIERFRkFVTFRfQ09MT1JfUFJPRklMRSBdO1xyXG5cclxuICAvLyBQcml2YXRlIERvYzogTm90ZTogdGhlIGZvbGxvd2luZyBqc2RvYyBpcyBmb3IgdGhlIHB1YmxpYyBmYWNpbmcgUGhFVC1pTyBBUEkuIEluIGFkZGl0aW9uLCBhbGwgcXVlcnkgcGFyYW1ldGVycyBpbiB0aGUgc2NoZW1hXHJcbiAgLy8gdGhhdCBhcmUgYSBcIm1lbWJlck9mXCIgdGhlIFwiUGhldFF1ZXJ5UGFyYW1ldGVyc1wiIG5hbWVzcGFjZSBhcmUgdXNlZCBpbiB0aGUganNkb2MgdGhhdCBpcyBwdWJsaWMgKGNsaWVudCBmYWNpbmcpXHJcbiAgLy8gcGhldC1pbyBkb2N1bWVudGF0aW9uLiBQcml2YXRlIGNvbW1lbnRzIGFib3V0IGltcGxlbWVudGF0aW9uIGRldGFpbHMgd2lsbCBiZSBpbiBjb21tZW50cyBhYm92ZSB0aGUganNkb2MsIGFuZFxyXG4gIC8vIG1hcmtlZCBhcyBzdWNoLlxyXG4gIC8vIE5vdGU6IHRoaXMgaGFkIHRvIGJlIGpzZG9jIGRpcmVjdGx5IGZvciBRVUVSWV9QQVJBTUVURVJTX1NDSEVNQSB0byBzdXBwb3J0IHRoZSBjb3JyZWN0IGF1dG8gZm9ybWF0dGluZy5cclxuXHJcbiAgLyoqXHJcbiAgICogUXVlcnkgcGFyYW1ldGVycyB0aGF0IG1hbmlwdWxhdGUgdGhlIHN0YXJ0dXAgc3RhdGUgb2YgdGhlIFBoRVQgc2ltdWxhdGlvbi4gVGhpcyBpcyBub3RcclxuICAgKiBhbiBvYmplY3QgZGVmaW5lZCBpbiB0aGUgZ2xvYmFsIHNjb3BlLCBidXQgcmF0aGVyIGl0IHNlcnZlcyBhcyBkb2N1bWVudGF0aW9uIGFib3V0IGF2YWlsYWJsZSBxdWVyeSBwYXJhbWV0ZXJzLlxyXG4gICAqIE5vdGU6IFRoZSBcImZsYWdcIiB0eXBlIGZvciBxdWVyeSBwYXJhbWV0ZXJzIGRvZXMgbm90IGV4cGVjdCBhIHZhbHVlIGZvciB0aGUga2V5LCBidXQgcmF0aGVyIGp1c3QgdGhlIHByZXNlbmNlIG9mXHJcbiAgICogdGhlIGtleSBpdHNlbGYuXHJcbiAgICogQG5hbWVzcGFjZSB7T2JqZWN0fSBQaGV0UXVlcnlQYXJhbWV0ZXJzXHJcbiAgICovXHJcbiAgY29uc3QgUVVFUllfUEFSQU1FVEVSU19TQ0hFTUEgPSB7XHJcbiAgICAvLyBTY2hlbWEgdGhhdCBkZXNjcmliZXMgcXVlcnkgcGFyYW1ldGVycyBmb3IgUGhFVCBjb21tb24gY29kZS5cclxuICAgIC8vIFRoZXNlIHF1ZXJ5IHBhcmFtZXRlcnMgYXJlIGF2YWlsYWJsZSB2aWEgZ2xvYmFsIHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbiBlbnZpcm9ubWVudHMgd2hlcmUgdXNlcnMgc2hvdWxkIG5vdCBiZSBhYmxlIHRvIG5hdmlnYXRlIGh5cGVybGlua3MgYXdheSBmcm9tIHRoZSBzaW11bGF0aW9uLCBjbGllbnRzIGNhbiB1c2VcclxuICAgICAqID9hbGxvd0xpbmtzPWZhbHNlLiAgSW4gdGhpcyBjYXNlLCBsaW5rcyBhcmUgZGlzcGxheWVkIGFuZCBub3QgY2xpY2thYmxlLiBUaGlzIHF1ZXJ5IHBhcmFtZXRlciBpcyBwdWJsaWMgZmFjaW5nLlxyXG4gICAgICogQG1lbWJlck9mIFBoZXRRdWVyeVBhcmFtZXRlcnNcclxuICAgICAqIEB0eXBlIHtib29sZWFufVxyXG4gICAgICovXHJcbiAgICBhbGxvd0xpbmtzOiB7XHJcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiB0cnVlLFxyXG4gICAgICBwdWJsaWM6IHRydWVcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBbGxvd3Mgc2V0dGluZyBvZiB0aGUgc291bmQgc3RhdGUsIHBvc3NpYmxlIHZhbHVlcyBhcmUgJ2VuYWJsZWQnIChkZWZhdWx0KSwgJ211dGVkJywgYW5kICdkaXNhYmxlZCcuICBTb3VuZFxyXG4gICAgICogbXVzdCBiZSBzdXBwb3J0ZWQgYnkgdGhlIHNpbSBmb3IgdGhpcyB0byBoYXZlIGFueSBlZmZlY3QuXHJcbiAgICAgKiBAbWVtYmVyT2YgUGhldFF1ZXJ5UGFyYW1ldGVyc1xyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgYXVkaW86IHtcclxuICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogJ2VuYWJsZWQnLFxyXG4gICAgICB2YWxpZFZhbHVlczogWyAnZW5hYmxlZCcsICdkaXNhYmxlZCcsICdtdXRlZCcgXSxcclxuICAgICAgcHVibGljOiB0cnVlXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2VuZXJhdGVzIG9iamVjdCByZXBvcnRzIHRoYXQgY2FuIGJlIHVzZWQgYnkgYmluZGVyLiBGb3IgaW50ZXJuYWwgdXNlLlxyXG4gICAgICogU2VlIEluc3RhbmNlUmVnaXN0cnkuanMgYW5kIGJpbmRlciByZXBvIChzcGVjaWZpY2FsbHkgZ2V0RnJvbVNpbUluTWFpbi5qcykgZm9yIG1vcmUgZGV0YWlscy5cclxuICAgICAqL1xyXG4gICAgYmluZGVyOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc3BlY2lmaWVzIHRoZSBicmFuZCB0aGF0IHNob3VsZCBiZSB1c2VkIGluIHVuYnVpbHQgbW9kZVxyXG4gICAgICovXHJcbiAgICBicmFuZDoge1xyXG4gICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiAnYWRhcHRlZC1mcm9tLXBoZXQnXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hlbiBwcmVzZW50LCB3aWxsIHRyaWdnZXIgY2hhbmdlcyB0aGF0IGFyZSBtb3JlIHNpbWlsYXIgdG8gdGhlIGJ1aWxkIGVudmlyb25tZW50LlxyXG4gICAgICogUmlnaHQgbm93LCB0aGlzIGluY2x1ZGVzIGNvbXB1dGluZyBoaWdoZXItcmVzb2x1dGlvbiBtaXBtYXBzIGZvciB0aGUgbWlwbWFwIHBsdWdpbi5cclxuICAgICAqL1xyXG4gICAgYnVpbGRDb21wYXRpYmxlOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSWYgdGhpcyBpcyBhIGZpbml0ZSBudW1iZXIgQU5EIGFzc2VydGlvbnMgYXJlIGVuYWJsZWQsIGl0IHdpbGwgdHJhY2sgbWF4aW11bSBOb2RlIGNoaWxkIGNvdW50cywgYW5kXHJcbiAgICAgKiB3aWxsIGFzc2VydCB0aGF0IHRoZSBudW1iZXIgb2YgY2hpbGRyZW4gb24gYSBzaW5nbGUgTm9kZSBpcyBub3QgZ3JlYXRlciB0aGFuIHRoZSBsaW1pdC5cclxuICAgICAqL1xyXG4gICAgY2hpbGRMaW1pdDoge1xyXG4gICAgICB0eXBlOiAnbnVtYmVyJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXHJcbiAgICAgIHB1YmxpYzogZmFsc2VcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXaGVuIHByb3ZpZGVkIGEgbm9uLXplcm8tbGVuZ3RoIHZhbHVlLCB0aGUgc2ltIHdpbGwgc2VuZCBvdXQgYXNzb3J0ZWQgZXZlbnRzIG1lYW50IGZvciBjb250aW51b3VzIHRlc3RpbmdcclxuICAgICAqIGludGVncmF0aW9uIChzZWUgc2ltLXRlc3QuanMpLlxyXG4gICAgICovXHJcbiAgICBjb250aW51b3VzVGVzdDoge1xyXG4gICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiAnJ1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBQcml2YXRlIERvYzogIEZvciBleHRlcm5hbCB1c2UuIFRoZSBiZWxvdyBqc2RvYyBpcyBwdWJsaWMgdG8gdGhlIFBoRVQtaU8gQVBJIGRvY3VtZW50YXRpb24uIENoYW5nZSB3aXNlbHkuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBjb2xvciBwcm9maWxlIHVzZWQgYXQgc3RhcnR1cCwgcmVsZXZhbnQgb25seSBmb3Igc2ltcyB0aGF0IHN1cHBvcnQgbXVsdGlwbGUgY29sb3IgcHJvZmlsZXMuICdkZWZhdWx0JyBhbmRcclxuICAgICAqICdwcm9qZWN0b3InIGFyZSBpbXBsZW1lbnRlZCBpbiBzZXZlcmFsIHNpbXMsIG90aGVyIHByb2ZpbGUgbmFtZXMgYXJlIG5vdCBjdXJyZW50bHkgc3RhbmRhcmRpemVkLlxyXG4gICAgICogQG1lbWJlck9mIFBoZXRRdWVyeVBhcmFtZXRlcnNcclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIGNvbG9yUHJvZmlsZToge1xyXG4gICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiBjb2xvclByb2ZpbGVzWyAwIF0sIC8vIHVzdWFsbHkgXCJkZWZhdWx0XCIsIGJ1dCBzb21lIHNpbXMgbGlrZSBtYXNzZXMtYW5kLXNwcmluZ3MtYmFzaWNzIGRvIG5vdCB1c2UgZGVmYXVsdCBhdCBhbGxcclxuICAgICAgdmFsaWRWYWx1ZXM6IGNvbG9yUHJvZmlsZXMsXHJcbiAgICAgIHB1YmxpYzogdHJ1ZVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIGVuYWJsZXMgZGVidWdnZXIgY29tbWFuZHMgaW4gY2VydGFpbiBjYXNlcyBsaWtlIHRocm93biBlcnJvcnMgYW5kIGZhaWxlZCB0ZXN0cy5cclxuICAgICAqL1xyXG4gICAgZGVidWdnZXI6IHsgdHlwZTogJ2ZsYWcnIH0sXHJcblxyXG4gICAgLy8gT3V0cHV0IGRlcHJlY2F0aW9uIHdhcm5pbmdzIHZpYSBjb25zb2xlLndhcm4sIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvODgyLiBGb3IgaW50ZXJuYWxcclxuICAgIC8vIHVzZSBvbmx5LlxyXG4gICAgZGVwcmVjYXRpb25XYXJuaW5nczogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIGVuYWJsZXMgZGV2ZWxvcGVyLW9ubHkgZmVhdHVyZXMsIHN1Y2ggYXMgc2hvd2luZyB0aGUgbGF5b3V0IGJvdW5kc1xyXG4gICAgICovXHJcbiAgICBkZXY6IHsgdHlwZTogJ2ZsYWcnIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2V0cyBhbGwgbW9kYWwgZmVhdHVyZXMgb2YgdGhlIHNpbSBhcyBkaXNhYmxlZC4gVGhpcyBpcyBhIGRldmVsb3BtZW50LW9ubHkgcGFyYW1ldGVyIHRoYXQgY2FuIGJlIHVzZWZ1bCBpblxyXG4gICAgICogY29tYmluYXRpb24gd2l0aCBmdXp6IHRlc3RpbmcuIFRoaXMgd2FzIGNyZWF0ZWQgdG8gbGltaXQgdGhlIGFtb3VudCBvZiB0aW1lIGZ1enogdGVzdGluZyBzcGVuZHMgb24gdW5pbXBvcnRhbnRcclxuICAgICAqIGZlYXR1cmVzIG9mIHRoZSBzaW0gbGlrZSB0aGUgUGhFVCBNZW51LCBLZXlib2FyZCBIZWxwLCBhbmQgUHJlZmVyZW5jZXMgcG9wdXBzLlxyXG4gICAgICovXHJcbiAgICBkaXNhYmxlTW9kYWxzOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZW5hYmxlcyBhc3NlcnRpb25zXHJcbiAgICAgKi9cclxuICAgIGVhOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW5hYmxlcyBhbGwgYXNzZXJ0aW9ucywgYXMgYWJvdmUgYnV0IHdpdGggbW9yZSB0aW1lLWNvbnN1bWluZyBjaGVja3NcclxuICAgICAqL1xyXG4gICAgZWFsbDogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnRyb2xzIHdoZXRoZXIgZXh0cmEgc291bmQgaXMgb24gb3Igb2ZmIGF0IHN0YXJ0dXAgKHVzZXIgY2FuIGNoYW5nZSBsYXRlcikuICBUaGlzIHF1ZXJ5IHBhcmFtZXRlciBpcyBwdWJsaWNcclxuICAgICAqIGZhY2luZy5cclxuICAgICAqIEB0eXBlIHtib29sZWFufVxyXG4gICAgICovXHJcbiAgICBleHRyYVNvdW5kSW5pdGlhbGx5RW5hYmxlZDoge1xyXG4gICAgICB0eXBlOiAnZmxhZycsXHJcbiAgICAgIHB1YmxpYzogdHJ1ZVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZvcmNlIFNjZW5lcnkgdG8gcmVmcmVzaCBTVkcgY29udGVudHMgZXZlcnkgZnJhbWUgKHRvIGhlbHAgZGV0ZWN0IHJlbmRlcmluZy9icm93c2VyLXJlcGFpbnQgaXNzdWVzIHdpdGggU1ZHKS5cclxuICAgICAqL1xyXG4gICAgZm9yY2VTVkdSZWZyZXNoOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmFuZG9tbHkgc2VuZHMgbW91c2UgZXZlbnRzIGFuZCB0b3VjaCBldmVudHMgdG8gc2ltLlxyXG4gICAgICovXHJcbiAgICBmdXp6OiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmFuZG9tbHkgc2VuZHMga2V5Ym9hcmQgZXZlbnRzIHRvIHRoZSBzaW0uIE11c3QgaGF2ZSBhY2Nlc3NpYmlsaXR5IGVuYWJsZWQuXHJcbiAgICAgKi9cclxuICAgIGZ1enpCb2FyZDogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJhbmRvbWx5IHNlbmRzIG1vdXNlIGV2ZW50cyB0byBzaW0uXHJcbiAgICAgKi9cclxuICAgIGZ1enpNb3VzZTogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBtYXhpbXVtIG51bWJlciBvZiBjb25jdXJyZW50IHBvaW50ZXJzIGFsbG93ZWQgZm9yIGZ1enppbmcuIFVzaW5nIGEgdmFsdWUgbGFyZ2VyIHRoYW4gMSB3aWxsIHRlc3QgbXVsdGl0b3VjaFxyXG4gICAgICogYmVoYXZpb3IgKHdpdGggP2Z1enosID9mdXp6TW91c2UsID9mdXp6VG91Y2gsIGV0Yy4pXHJcbiAgICAgKi9cclxuICAgIGZ1enpQb2ludGVyczoge1xyXG4gICAgICB0eXBlOiAnbnVtYmVyJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiAxXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmFuZG9tbHkgc2VuZHMgdG91Y2ggZXZlbnRzIHRvIHNpbS5cclxuICAgICAqL1xyXG4gICAgZnV6elRvdWNoOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogaWYgZnV6ek1vdXNlPXRydWUgb3IgZnV6elRvdWNoPXRydWUsIHRoaXMgaXMgdGhlIGF2ZXJhZ2UgbnVtYmVyIG9mIG1vdXNlL3RvdWNoIGV2ZW50cyB0byBzeW50aGVzaXplIHBlciBmcmFtZS5cclxuICAgICAqL1xyXG4gICAgZnV6elJhdGU6IHtcclxuICAgICAgdHlwZTogJ251bWJlcicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogMTAwLFxyXG4gICAgICBpc1ZhbGlkVmFsdWU6IGZ1bmN0aW9uKCB2YWx1ZSApIHsgcmV0dXJuIHZhbHVlID4gMDsgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVzZWQgZm9yIHByb3ZpZGluZyBhbiBleHRlcm5hbCBHb29nbGUgQW5hbHl0aWNzIDQgKGd0YWcuanMpIHByb3BlcnR5IGZvciB0cmFja2luZywgc2VlXHJcbiAgICAgKiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldGNvbW1vbi9pc3N1ZXMvNDYgZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgICAgKlxyXG4gICAgICogR2VuZXJhbGx5LCB0aGlzIHN0cmluZyB3aWxsIHN0YXJ0IHdpdGggJ0ctJyBmb3IgR0E0IHRyYWNrZXJzXHJcbiAgICAgKlxyXG4gICAgICogVGhpcyBpcyB1c2VmdWwgZm9yIHZhcmlvdXMgdXNlcnMvY2xpZW50cyB0aGF0IHdhbnQgdG8gZW1iZWQgc2ltdWxhdGlvbnMsIG9yIGRpcmVjdCB1c2VycyB0byBzaW11bGF0aW9ucy4gRm9yXHJcbiAgICAgKiBleGFtcGxlLCBpZiBhIHNpbSBpcyBpbmNsdWRlZCBpbiBhbiBlcHViLCB0aGUgc2ltIEhUTUwgd29uJ3QgaGF2ZSB0byBiZSBtb2RpZmllZCB0byBpbmNsdWRlIHBhZ2UgdHJhY2tpbmcuXHJcbiAgICAgKi9cclxuICAgIGdhNDoge1xyXG4gICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiBudWxsLFxyXG4gICAgICBwdWJsaWM6IHRydWVcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMYXVuY2hlcyB0aGUgZ2FtZS11cC1jYW1lcmEgY29kZSB3aGljaCBkZWxpdmVycyBpbWFnZXMgdG8gcmVxdWVzdHMgaW4gQnJhaW5QT1AvR2FtZSBVcC9TbmFwVGhvdWdodFxyXG4gICAgICovXHJcbiAgICBnYW1lVXA6IHsgdHlwZTogJ2ZsYWcnIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbmFibGVzIHRoZSBnYW1lLXVwLWNhbWVyYSBjb2RlIHRvIHJlc3BvbmQgdG8gbWVzc2FnZXMgZnJvbSBhbnkgb3JpZ2luXHJcbiAgICAgKi9cclxuICAgIGdhbWVVcFRlc3RIYXJuZXNzOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW5hYmxlcyBsb2dnaW5nIGZvciBnYW1lLXVwLWNhbWVyYSwgc2VlIGdhbWVVcFxyXG4gICAgICovXHJcbiAgICBnYW1lVXBMb2dnaW5nOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVXNlZCBmb3IgcHJvdmlkaW5nIGEgR29vZ2xlIEFuYWx5dGljcyBwYWdlIElEIGZvciB0cmFja2luZywgc2VlXHJcbiAgICAgKiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldGNvbW1vbi9pc3N1ZXMvNDYgZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgICAgKlxyXG4gICAgICogVGhpcyBpcyBnaXZlbiBhcyB0aGUgM3JkIHBhcmFtZXRlciB0byBhIHBhZ2V2aWV3IHNlbmQgd2hlbiBwcm92aWRlZFxyXG4gICAgICovXHJcbiAgICBnYVBhZ2U6IHtcclxuICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogbnVsbFxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBQcml2YXRlIERvYzogIEZvciBleHRlcm5hbCB1c2UuIFRoZSBiZWxvdyBqc2RvYyBpcyBwdWJsaWMgdG8gdGhlIFBoRVQtaU8gQVBJIGRvY3VtZW50YXRpb24uIENoYW5nZSB3aXNlbHkuXHJcbiAgICAvKipcclxuICAgICAqIEluZGljYXRlcyB3aGV0aGVyIHRvIGRpc3BsYXkgdGhlIGhvbWUgc2NyZWVuLlxyXG4gICAgICogRm9yIG11bHRpc2NyZWVuIHNpbXMgb25seSwgdGhyb3dzIGFuIGFzc2VydGlvbiBlcnJvciBpZiBzdXBwbGllZCBmb3IgYSBzaW5nbGUtc2NyZWVuIHNpbS5cclxuICAgICAqIEBtZW1iZXJPZiBQaGV0UXVlcnlQYXJhbWV0ZXJzXHJcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgaG9tZVNjcmVlbjoge1xyXG4gICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogdHJ1ZSxcclxuICAgICAgcHVibGljOiB0cnVlXHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFByaXZhdGUgRG9jOiBGb3IgZXh0ZXJuYWwgdXNlLiBUaGUgYmVsb3cganNkb2MgaXMgcHVibGljIHRvIHRoZSBQaEVULWlPIEFQSSBkb2N1bWVudGF0aW9uLiBDaGFuZ2Ugd2lzZWx5LlxyXG4gICAgLy8gVGhlIHZhbHVlIGlzIG9uZSBvZiB0aGUgdmFsdWVzIGluIHRoZSBzY3JlZW5zIGFycmF5LCBub3QgYW4gaW5kZXggaW50byB0aGUgc2NyZWVucyBhcnJheS5cclxuICAgIC8qKlxyXG4gICAgICogU3BlY2lmaWVzIHRoZSBpbml0aWFsIHNjcmVlbiB0aGF0IHdpbGwgYmUgdmlzaWJsZSB3aGVuIHRoZSBzaW0gc3RhcnRzLlxyXG4gICAgICogU2VlIGA/c2NyZWVuc2AgcXVlcnkgcGFyYW1ldGVyIGZvciBzY3JlZW4gbnVtYmVyaW5nLlxyXG4gICAgICogRm9yIG11bHRpc2NyZWVuIHNpbXMgb25seSwgdGhyb3dzIGFuIGFzc2VydGlvbiBlcnJvciBpZiBhcHBsaWVkIGluIGEgc2luZ2xlLXNjcmVlbiBzaW1zLlxyXG4gICAgICogVGhlIGRlZmF1bHQgdmFsdWUgb2YgMCBpcyB0aGUgaG9tZSBzY3JlZW4uXHJcbiAgICAgKiBAbWVtYmVyT2YgUGhldFF1ZXJ5UGFyYW1ldGVyc1xyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgaW5pdGlhbFNjcmVlbjoge1xyXG4gICAgICB0eXBlOiAnbnVtYmVyJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiAwLCAvLyB0aGUgaG9tZSBzY3JlZW5cclxuICAgICAgcHVibGljOiB0cnVlXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW5hYmxlcyBzdXBwb3J0IGZvciBMZWdlbmRzIG9mIExlYXJuaW5nIHBsYXRmb3JtLCBpbmNsdWRpbmcgYnJvYWRjYXN0aW5nICdpbml0JyBhbmQgcmVzcG9uZGluZyB0byBwYXVzZS9yZXN1bWUuXHJcbiAgICAgKi9cclxuICAgIGxlZ2VuZHNPZkxlYXJuaW5nOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSWYgdGhpcyBpcyBhIGZpbml0ZSBudW1iZXIgQU5EIGFzc2VydGlvbnMgYXJlIGVuYWJsZWQsIGl0IHdpbGwgdHJhY2sgbWF4aW11bSAoVGlueUVtaXR0ZXIpIGxpc3RlbmVyIGNvdW50cywgYW5kXHJcbiAgICAgKiB3aWxsIGFzc2VydCB0aGF0IHRoZSBjb3VudCBpcyBub3QgZ3JlYXRlciB0aGFuIHRoZSBsaW1pdC5cclxuICAgICAqL1xyXG4gICAgbGlzdGVuZXJMaW1pdDoge1xyXG4gICAgICB0eXBlOiAnbnVtYmVyJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXHJcbiAgICAgIHB1YmxpYzogZmFsc2VcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZWxlY3QgdGhlIGxhbmd1YWdlIG9mIHRoZSBzaW0gdG8gdGhlIHNwZWNpZmljIGxvY2FsZS4gRGVmYXVsdCB0byBcImVuXCIuXHJcbiAgICAgKiBAbWVtYmVyT2YgUGhldFF1ZXJ5UGFyYW1ldGVyc1xyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgbG9jYWxlOiB7XHJcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICBkZWZhdWx0VmFsdWU6ICdlbidcclxuICAgICAgLy8gRG8gTk9UIGFkZCB0aGUgYHB1YmxpY2Aga2V5IGhlcmUuIFdlIHdhbnQgaW52YWxpZCB2YWx1ZXMgdG8gZmFsbCBiYWNrIHRvIGVuLlxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFByb3ZpZGVzIHRoZSBsb2NhbGVzIHRvIGxvYWQgZHVyaW5nIHN0YXJ0dXAgZm9yIGFuIHVuLWJ1aWx0IHNpbXVsYXRpb24gKHdpbGwgYXV0b21hdGljYWxseSBsb2FkIHRoZSA/bG9jYWxlLCBvclxyXG4gICAgICogRW5nbGlzaCBpZiBwcm92aWRlZCkuXHJcbiAgICAgKlxyXG4gICAgICogSWYgdGhlIG9ubHkgcHJvdmlkZWQgdmFsdWUgaXMgJyonLCB0aGVuIGl0IHdpbGwgbG9hZCBhbGwgdGhlIGxvY2FsZXMuXHJcbiAgICAgKi9cclxuICAgIGxvY2FsZXM6IHtcclxuICAgICAgdHlwZTogJ2FycmF5JyxcclxuICAgICAgZWxlbWVudFNjaGVtYToge1xyXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnXHJcbiAgICAgIH0sXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogW11cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTcGVjaWZ5IHN1cHBvcnRzIGZvciBkeW5hbWljIGxvY2FsZSBzd2l0Y2hpbmcgaW4gdGhlIHJ1bnRpbWUgb2YgdGhlIHNpbS4gQnkgZGVmYXVsdCwgdGhlIHZhbHVlIHdpbGwgYmUgdGhlIHN1cHBvcnRcclxuICAgICAqIGluIHRoZSBydW5uYWJsZSdzIHBhY2thZ2UuanNvbi4gVXNlIHRoaXMgdG8gdHVybiBvZmYgdGhpbmdzIGxpa2UgdGhlIGxvY2FsZSBzd2l0Y2hlciBwcmVmZXJlbmNlLlxyXG4gICAgICogVGhlIHBhY2thZ2UgZmxhZyBmb3IgdGhpcyBtZWFucyB2ZXJ5IHNwZWNpZmljIHRoaW5ncyBkZXBlbmRpbmcgb24gaXRzIHByZXNlbmNlIGFuZCB2YWx1ZS5cclxuICAgICAqIC0gQnkgZGVmYXVsdCwgd2l0aCBubyBlbnRyeSBpbiB0aGUgcGFja2FnZS5qc29uLCB3ZSB3aWxsIHN0aWxsIHRyeSB0byBzdXBwb3J0IGxvY2FsZSBzd2l0Y2hpbmcgaWYgbXVsdGlwbGUgbG9jYWxlc1xyXG4gICAgICogYXJlIGF2YWlsYWJsZS5cclxuICAgICAqIC0gSWYgeW91IGFkZCB0aGUgdHJ1dGh5IGZsYWcgKHN1cHBvcnRzRHluYW1pY0xvY2FsZTp0cnVlKSwgdGhlbiBpdCB3aWxsIGVuc3VyZSB0aGF0IHN0cmluZ3MgdXNlIFN0cmluZ1Byb3BlcnRpZXNcclxuICAgICAqIGluIHlvdXIgc2ltLlxyXG4gICAgICogLSBJZiB5b3UgZG8gbm90IHdhbnQgdG8gc3VwcG9ydCB0aGlzLCB0aGVuIHlvdSBjYW4gb3B0IG91dCBpbiB0aGUgcGFja2FnZS5qc29uIHdpdGggc3VwcG9ydHNEeW5hbWljTG9jYWxlOmZhbHNlXHJcbiAgICAgKlxyXG4gICAgICogRm9yIG1vcmUgaW5mb3JtYXRpb24gYWJvdXQgc3VwcG9ydGluZyBkeW5hbWljIGxvY2FsZSwgc2VlIHRoZSBcIkR5bmFtaWMgU3RyaW5ncyBMYXlvdXQgUXVpY2tzdGFydCBHdWlkZVwiOiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pbmZvL2Jsb2IvbWFpbi9kb2MvZHluYW1pYy1zdHJpbmctbGF5b3V0LXF1aWNrc3RhcnQubWRcclxuICAgICAqL1xyXG4gICAgc3VwcG9ydHNEeW5hbWljTG9jYWxlOiB7XHJcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiBhbGxvd0xvY2FsZVN3aXRjaGluZyAmJlxyXG4gICAgICAgICAgICAgICAgICAgICggIXBhY2thZ2VTaW1GZWF0dXJlcy5oYXNPd25Qcm9wZXJ0eSggJ3N1cHBvcnRzRHluYW1pY0xvY2FsZScgKSB8fCBwYWNrYWdlU2ltRmVhdHVyZXMuc3VwcG9ydHNEeW5hbWljTG9jYWxlIClcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbmFibGVzIGJhc2ljIGxvZ2dpbmcgdG8gdGhlIGNvbnNvbGUuXHJcbiAgICAgKiBVc2FnZSBpbiBjb2RlOiBwaGV0LmxvZyAmJiBwaGV0LmxvZyggJ3lvdXIgbWVzc2FnZScgKTtcclxuICAgICAqL1xyXG4gICAgbG9nOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0cyBhIG1heGltdW0gXCJtZW1vcnlcIiBsaW1pdCAoaW4gTUIpLiBJZiB0aGUgc2ltdWxhdGlvbidzIHJ1bm5pbmcgYXZlcmFnZSBvZiBtZW1vcnkgdXNhZ2UgZ29lcyBvdmVyIHRoaXMgYW1vdW50XHJcbiAgICAgKiBpbiBvcGVyYXRpb24gKGFzIGRldGVybWluZWQgY3VycmVudGx5IGJ5IHVzaW5nIENocm9tZSdzIHdpbmRvdy5wZXJmb3JtYW5jZSksIHRoZW4gYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24uXHJcbiAgICAgKlxyXG4gICAgICogVGhpcyBpcyB1c2VmdWwgZm9yIGNvbnRpbnVvdXMgdGVzdGluZywgdG8gZW5zdXJlIHdlIGFyZW4ndCBsZWFraW5nIGh1Z2UgYW1vdW50cyBvZiBtZW1vcnksIGFuZCBjYW4gYWxzbyBiZSB1c2VkXHJcbiAgICAgKiB3aXRoIHRoZSBDaHJvbWUgY29tbWFuZC1saW5lIGZsYWcgLS1lbmFibGUtcHJlY2lzZS1tZW1vcnktaW5mbyB0byBtYWtlIHRoZSBkZXRlcm1pbmF0aW9uIG1vcmUgYWNjdXJhdGUuXHJcbiAgICAgKlxyXG4gICAgICogVGhlIHZhbHVlIDAgd2lsbCBiZSBpZ25vcmVkLCBzaW5jZSBvdXIgc2ltcyBhcmUgbGlrZWx5IHRvIHVzZSBtb3JlIHRoYW4gdGhhdCBtdWNoIG1lbW9yeS5cclxuICAgICAqL1xyXG4gICAgbWVtb3J5TGltaXQ6IHtcclxuICAgICAgdHlwZTogJ251bWJlcicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogMFxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEVuYWJsZXMgdHJhbnNmb3JtaW5nIHRoZSBQRE9NIGZvciBhY2Nlc3NpYmlsaXR5IG9uIG1vYmlsZSBkZXZpY2VzLiBUaGlzIHdvcmsgaXMgZXhwZXJpbWVudGFsLCBhbmQgc3RpbGwgaGlkZGVuXHJcbiAgICAgKiBpbiBhIHNjZW5lcnkgYnJhbmNoIHBkb20tdHJhbnNmb3JtLiBNdXN0IGJlIHVzZWQgaW4gY29tYmluYXRpb24gd2l0aCB0aGUgYWNjZXNzaWJpbGl0eSBxdWVyeSBwYXJhbWV0ZXIsIG9yXHJcbiAgICAgKiBvbiBhIHNpbSB0aGF0IGhhcyBhY2Nlc3NpYmlsaXR5IGVuYWJsZWQgYnkgZGVmYXVsdC4gVGhpcyBxdWVyeSBwYXJhbWV0ZXIgaXMgbm90IGludGVuZGVkIHRvIGJlIGxvbmctbGl2ZWQsXHJcbiAgICAgKiBpbiB0aGUgZnV0dXJlIHRoZXNlIGZlYXR1cmVzIHNob3VsZCBiZSBhbHdheXMgZW5hYmxlZCBpbiB0aGUgc2NlbmVyeSBhMTF5IGZyYW1ld29yay5cclxuICAgICAqIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvODUyXHJcbiAgICAgKlxyXG4gICAgICogRm9yIGludGVybmFsIHVzZSBhbmQgdGVzdGluZyBvbmx5LCB0aG91Z2ggbGlua3Mgd2l0aCB0aGlzIG1heSBiZSBzaGFyZWQgd2l0aCBjb2xsYWJvcmF0b3JzLlxyXG4gICAgICpcclxuICAgICAqIEBhMTF5XHJcbiAgICAgKi9cclxuICAgIG1vYmlsZUExMXlUZXN0OiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKnBcclxuICAgICAqIElmIHRoaXMgaXMgYSBmaW5pdGUgbnVtYmVyIEFORCBhc3NlcnRpb25zIGFyZSBlbmFibGVkLCBpdCB3aWxsIHRyYWNrIG1heGltdW0gTm9kZSBwYXJlbnQgY291bnRzLCBhbmRcclxuICAgICAqIHdpbGwgYXNzZXJ0IHRoYXQgdGhlIGNvdW50IGlzIG5vdCBncmVhdGVyIHRoYW4gdGhlIGxpbWl0LlxyXG4gICAgICovXHJcbiAgICBwYXJlbnRMaW1pdDoge1xyXG4gICAgICB0eXBlOiAnbnVtYmVyJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXHJcbiAgICAgIHB1YmxpYzogZmFsc2VcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXaGVuIGEgc2ltdWxhdGlvbiBpcyBydW4gZnJvbSB0aGUgUGhFVCBBbmRyb2lkIGFwcCwgaXQgc2hvdWxkIHNldCB0aGlzIGZsYWcuIEl0IGFsdGVycyBzdGF0aXN0aWNzIHRoYXQgdGhlIHNpbSBzZW5kc1xyXG4gICAgICogdG8gR29vZ2xlIEFuYWx5dGljcyBhbmQgcG90ZW50aWFsbHkgb3RoZXIgc291cmNlcyBpbiB0aGUgZnV0dXJlLlxyXG4gICAgICpcclxuICAgICAqIEFsc28gcmVtb3ZlcyB0aGUgZm9sbG93aW5nIGl0ZW1zIGZyb20gdGhlIFwiUGhFVCBNZW51XCI6XHJcbiAgICAgKiBSZXBvcnQgYSBQcm9ibGVtXHJcbiAgICAgKiBDaGVjayBmb3IgVXBkYXRlc1xyXG4gICAgICogU2NyZWVuc2hvdFxyXG4gICAgICogRnVsbCBTY3JlZW5cclxuICAgICAqL1xyXG4gICAgJ3BoZXQtYW5kcm9pZC1hcHAnOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hlbiBhIHNpbXVsYXRpb24gaXMgcnVuIGZyb20gdGhlIFBoRVQgaU9TIGFwcCwgaXQgc2hvdWxkIHNldCB0aGlzIGZsYWcuIEl0IGFsdGVycyBzdGF0aXN0aWNzIHRoYXQgdGhlIHNpbSBzZW5kc1xyXG4gICAgICogdG8gR29vZ2xlIEFuYWx5dGljcyBhbmQgcG90ZW50aWFsbHkgb3RoZXIgc291cmNlcyBpbiB0aGUgZnV0dXJlLlxyXG4gICAgICpcclxuICAgICAqIEFsc28gcmVtb3ZlcyB0aGUgZm9sbG93aW5nIGl0ZW1zIGZyb20gdGhlIFwiUGhFVCBNZW51XCI6XHJcbiAgICAgKiBSZXBvcnQgYSBQcm9ibGVtXHJcbiAgICAgKiBDaGVjayBmb3IgVXBkYXRlc1xyXG4gICAgICogU2NyZWVuc2hvdFxyXG4gICAgICogRnVsbCBTY3JlZW5cclxuICAgICAqL1xyXG4gICAgJ3BoZXQtYXBwJzogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIElmIHRydWUsIHB1dHMgdGhlIHNpbXVsYXRpb24gaW4gYSBzcGVjaWFsIG1vZGUgd2hlcmUgaXQgd2lsbCB3YWl0IGZvciBtYW51YWwgY29udHJvbCBvZiB0aGUgc2ltIHBsYXliYWNrLlxyXG4gICAgICovXHJcbiAgICBwbGF5YmFja01vZGU6IHtcclxuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICBkZWZhdWx0VmFsdWU6IGZhbHNlXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgYSBwb3N0LW1lc3NhZ2Ugd2hlbiB0aGUgc2ltIGlzIGFib3V0IHRvIGNoYW5nZSB0byBhbm90aGVyIFVSTFxyXG4gICAgICovXHJcbiAgICBwb3N0TWVzc2FnZU9uQmVmb3JlVW5sb2FkOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcGFzc2VzIGVycm9ycyB0byBwYXJlbnQgZnJhbWUgKGxpa2UgZnV6ei1saWdodHllYXIpXHJcbiAgICAgKi9cclxuICAgIHBvc3RNZXNzYWdlT25FcnJvcjogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIHRyaWdnZXJzIGEgcG9zdC1tZXNzYWdlIHRoYXQgZmlyZXMgd2hlbiB0aGUgc2ltIGZpbmlzaGVzIGxvYWRpbmcsIGN1cnJlbnRseSB1c2VkIGJ5IGFxdWEgZnV6ei1saWdodHllYXJcclxuICAgICAqL1xyXG4gICAgcG9zdE1lc3NhZ2VPbkxvYWQ6IHsgdHlwZTogJ2ZsYWcnIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB0cmlnZ2VycyBhIHBvc3QtbWVzc2FnZSB0aGF0IGZpcmVzIHdoZW4gdGhlIHNpbXVsYXRpb24gaXMgcmVhZHkgdG8gc3RhcnQuXHJcbiAgICAgKi9cclxuICAgIHBvc3RNZXNzYWdlT25SZWFkeTogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnRyb2xzIHdoZXRoZXIgdGhlIHByZXNlcnZlRHJhd2luZ0J1ZmZlcjp0cnVlIGlzIHNldCBvbiBXZWJHTCBDYW52YXNlcy4gVGhpcyBhbGxvd3MgY2FudmFzLnRvRGF0YVVSTCgpIHRvIHdvcmtcclxuICAgICAqICh1c2VkIGZvciBjZXJ0YWluIG1ldGhvZHMgdGhhdCByZXF1aXJlIHNjcmVlbnNob3QgZ2VuZXJhdGlvbiB1c2luZyBmb3JlaWduIG9iamVjdCByYXN0ZXJpemF0aW9uLCBldGMuKS5cclxuICAgICAqIEdlbmVyYWxseSByZWR1Y2VzIFdlYkdMIHBlcmZvcm1hbmNlLCBzbyBpdCBzaG91bGQgbm90IGFsd2F5cyBiZSBvbiAodGh1cyB0aGUgcXVlcnkgcGFyYW1ldGVyKS5cclxuICAgICAqL1xyXG4gICAgcHJlc2VydmVEcmF3aW5nQnVmZmVyOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSWYgdHJ1ZSwgdGhlIGZ1bGwgc2NyZWVuIGJ1dHRvbiB3b24ndCBiZSBzaG93biBpbiB0aGUgcGhldCBtZW51XHJcbiAgICAgKi9cclxuICAgIHByZXZlbnRGdWxsU2NyZWVuOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2hvd3MgcHJvZmlsaW5nIGluZm9ybWF0aW9uIGZvciB0aGUgc2ltXHJcbiAgICAgKi9cclxuICAgIHByb2ZpbGVyOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYWRkcyBhIG1lbnUgaXRlbSB0aGF0IHdpbGwgb3BlbiBhIHdpbmRvdyB3aXRoIGEgUVIgY29kZSB3aXRoIHRoZSBVUkwgb2YgdGhlIHNpbXVsYXRpb25cclxuICAgICAqL1xyXG4gICAgcXJDb2RlOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmFuZG9tIHNlZWQgaW4gdGhlIHByZWxvYWQgY29kZSB0aGF0IGNhbiBiZSB1c2VkIHRvIG1ha2Ugc3VyZSBwbGF5YmFjayBzaW11bGF0aW9ucyB1c2UgdGhlIHNhbWUgc2VlZCAoYW5kIHRodXNcclxuICAgICAqIHRoZSBzaW11bGF0aW9uIHN0YXRlLCBnaXZlbiB0aGUgaW5wdXQgZXZlbnRzIGFuZCBmcmFtZXMsIGNhbiBiZSBleGFjdGx5IHJlcHJvZHVjZWQpXHJcbiAgICAgKiBTZWUgUmFuZG9tLmpzXHJcbiAgICAgKi9cclxuICAgIHJhbmRvbVNlZWQ6IHtcclxuICAgICAgdHlwZTogJ251bWJlcicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogTWF0aC5yYW5kb20oKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJhZC1zaW0tdGV4dFxyXG4gICAgfSxcclxuXHJcbiAgICAvKlxyXG4gICAgICogU2V0cyB0aGUgZGVmYXVsdCBmb3IgdGhlIFJlZ2lvbiBhbmQgQ3VsdHVyZSBmZWF0dXJlLiBUaGUgc2V0IG9mIHZhbGlkIHZhbHVlcyBpcyBkZXRlcm1pbmVkIGJ5XHJcbiAgICAgKiBcInN1cHBvcnRlZFJlZ2lvbnNBbmRDdWx0dXJlc1ZhbHVlc1wiIGluIHBhY2thZ2UuanNvbi4gSWYgbm90IHByb3ZpZGVkIGluIHRoZSBVUkwsIHRoZSBkZWZhdWx0IGNhblxyXG4gICAgICogYmUgc2V0IHZpYSBcImRlZmF1bHRSZWdpb25BbmRDdWx0dXJlXCIgaW4gcGFja2FnZS5qc29uLCB3aGljaCBkZWZhdWx0cyB0byAndXNhJy5cclxuICAgICAqL1xyXG4gICAgcmVnaW9uQW5kQ3VsdHVyZToge1xyXG4gICAgICBwdWJsaWM6IHRydWUsXHJcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICBkZWZhdWx0VmFsdWU6IHBhY2thZ2VQaGV0Py5zaW1GZWF0dXJlcz8uZGVmYXVsdFJlZ2lvbkFuZEN1bHR1cmUgPz8gJ3VzYScsXHJcbiAgICAgIHZhbGlkVmFsdWVzOiBwYWNrYWdlUGhldD8uc2ltRmVhdHVyZXM/LnN1cHBvcnRlZFJlZ2lvbnNBbmRDdWx0dXJlcyA/PyBbICd1c2EnIF0gLy8gZGVmYXVsdCB2YWx1ZSBtdXN0IGJlIGluIHZhbGlkVmFsdWVzXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU3BlY2lmeSBhIHJlbmRlcmVyIGZvciB0aGUgU2ltJ3Mgcm9vdE5vZGUgdG8gdXNlLlxyXG4gICAgICovXHJcbiAgICByb290UmVuZGVyZXI6IHtcclxuICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogbnVsbCxcclxuICAgICAgdmFsaWRWYWx1ZXM6IFsgbnVsbCwgJ2NhbnZhcycsICdzdmcnLCAnZG9tJywgJ3dlYmdsJywgJ3ZlbGxvJyBdIC8vIHNlZSBOb2RlLnNldFJlbmRlcmVyXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXJyYXkgb2Ygb25lIG9yIG1vcmUgbG9ncyB0byBlbmFibGUgaW4gc2NlbmVyeSAwLjIrLCBkZWxpbWl0ZWQgd2l0aCBjb21tYXMuXHJcbiAgICAgKiBGb3IgZXhhbXBsZTogP3NjZW5lcnlMb2c9RGlzcGxheSxEcmF3YWJsZSxXZWJHTEJsb2NrIHJlc3VsdHMgaW4gWyAnRGlzcGxheScsICdEcmF3YWJsZScsICdXZWJHTEJsb2NrJyBdXHJcbiAgICAgKiBEb24ndCBjaGFuZ2UgdGhpcyB3aXRob3V0IHVwZGF0aW5nIHRoZSBzaWduYXR1cmUgaW4gc2NlbmVyeSB1bml0IHRlc3RzIHRvby5cclxuICAgICAqXHJcbiAgICAgKiBUaGUgZW50aXJlIHN1cHBvcnRlZCBsaXN0IGlzIGluIHNjZW5lcnkuanMgaW4gdGhlIGxvZ1Byb3BlcnRpZXMgb2JqZWN0LlxyXG4gICAgICovXHJcbiAgICBzY2VuZXJ5TG9nOiB7XHJcbiAgICAgIHR5cGU6ICdhcnJheScsXHJcbiAgICAgIGVsZW1lbnRTY2hlbWE6IHtcclxuICAgICAgICB0eXBlOiAnc3RyaW5nJ1xyXG4gICAgICB9LFxyXG4gICAgICBkZWZhdWx0VmFsdWU6IG51bGxcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTY2VuZXJ5IGxvZ3Mgd2lsbCBiZSBvdXRwdXQgdG8gYSBzdHJpbmcgaW5zdGVhZCBvZiB0aGUgd2luZG93XHJcbiAgICAgKi9cclxuICAgIHNjZW5lcnlTdHJpbmdMb2c6IHsgdHlwZTogJ2ZsYWcnIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTcGVjaWZpZXMgdGhlIHNldCBvZiBzY3JlZW5zIHRoYXQgYXBwZWFyIGluIHRoZSBzaW0sIGFuZCB0aGVpciBvcmRlci5cclxuICAgICAqIFVzZXMgMS1iYXNlZCAobm90IHplcm8tYmFzZWQpIGFuZCBcIixcIiBkZWxpbWl0ZWQgc3RyaW5nIHN1Y2ggYXMgXCIxLDMsNFwiIHRvIGdldCB0aGUgMXN0LCAzcmQgYW5kIDR0aCBzY3JlZW4uXHJcbiAgICAgKiBAdHlwZSB7QXJyYXkuPG51bWJlcj59XHJcbiAgICAgKi9cclxuICAgIHNjcmVlbnM6IHtcclxuICAgICAgdHlwZTogJ2FycmF5JyxcclxuICAgICAgZWxlbWVudFNjaGVtYToge1xyXG4gICAgICAgIHR5cGU6ICdudW1iZXInLFxyXG4gICAgICAgIGlzVmFsaWRWYWx1ZTogTnVtYmVyLmlzSW50ZWdlclxyXG4gICAgICB9LFxyXG4gICAgICBkZWZhdWx0VmFsdWU6IG51bGwsXHJcbiAgICAgIGlzVmFsaWRWYWx1ZTogZnVuY3Rpb24oIHZhbHVlICkge1xyXG5cclxuICAgICAgICAvLyBzY3JlZW4gaW5kaWNlcyBjYW5ub3QgYmUgZHVwbGljYXRlZFxyXG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gbnVsbCB8fCAoIHZhbHVlLmxlbmd0aCA9PT0gXy51bmlxKCB2YWx1ZSApLmxlbmd0aCAmJiB2YWx1ZS5sZW5ndGggPiAwICk7XHJcbiAgICAgIH0sXHJcbiAgICAgIHB1YmxpYzogdHJ1ZVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFR5cGljYWxseSB1c2VkIHRvIHNob3cgYW5zd2VycyAob3IgaGlkZGVuIGNvbnRyb2xzIHRoYXQgc2hvdyBhbnN3ZXJzKSB0byBjaGFsbGVuZ2VzIGluIHNpbSBnYW1lcy5cclxuICAgICAqIEZvciBpbnRlcm5hbCB1c2UgYnkgUGhFVCB0ZWFtIG1lbWJlcnMgb25seS5cclxuICAgICAqL1xyXG4gICAgc2hvd0Fuc3dlcnM6IHtcclxuICAgICAgdHlwZTogJ2ZsYWcnLFxyXG4gICAgICBwcml2YXRlOiB0cnVlXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGlzcGxheXMgYW4gb3ZlcmxheSBvZiB0aGUgY3VycmVudCBib3VuZHMgb2YgZWFjaCBDYW52YXNOb2RlXHJcbiAgICAgKi9cclxuICAgIHNob3dDYW52YXNOb2RlQm91bmRzOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGlzcGxheXMgYW4gb3ZlcmxheSBvZiB0aGUgY3VycmVudCBib3VuZHMgb2YgZWFjaCBwaGV0LnNjZW5lcnkuRml0dGVkQmxvY2tcclxuICAgICAqL1xyXG4gICAgc2hvd0ZpdHRlZEJsb2NrQm91bmRzOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2hvd3MgaGl0IGFyZWFzIGFzIGRhc2hlZCBsaW5lcy5cclxuICAgICAqL1xyXG4gICAgc2hvd0hpdEFyZWFzOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2hvd3MgcG9pbnRlciBhcmVhcyBhcyBkYXNoZWQgbGluZXMuIHRvdWNoQXJlYXMgYXJlIHJlZCwgbW91c2VBcmVhcyBhcmUgYmx1ZS5cclxuICAgICAqL1xyXG4gICAgc2hvd1BvaW50ZXJBcmVhczogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIERpc3BsYXlzIGEgc2VtaS10cmFuc3BhcmVudCBjdXJzb3IgaW5kaWNhdG9yIGZvciB0aGUgcG9zaXRpb24gb2YgZWFjaCBhY3RpdmUgcG9pbnRlciBvbiB0aGUgc2NyZWVuLlxyXG4gICAgICovXHJcbiAgICBzaG93UG9pbnRlcnM6IHsgdHlwZTogJ2ZsYWcnIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTaG93cyB0aGUgdmlzaWJsZSBib3VuZHMgaW4gU2NyZWVuVmlldy5qcywgZm9yIGRlYnVnZ2luZyB0aGUgbGF5b3V0IG91dHNpZGUgdGhlIFwiZGV2XCIgYm91bmRzXHJcbiAgICAgKi9cclxuICAgIHNob3dWaXNpYmxlQm91bmRzOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkcyBhIHJ1bnRpbWUgY2hlY2sgd2hpbGUgY29tcHV0aW5nIHRoZSBkZXJpdmF0aW9uIG9mIGEgRGVyaXZlZFByb3BlcnR5LCB0aGF0IGFzc2VydHMgdGhhdCBhbGwgcXVlcmllZCBQcm9wZXJ0eVxyXG4gICAgICogaW5zdGFuY2VzIGFyZSBsaXN0ZWQgaW4gdGhlIGRlcGVuZGVuY2llcy4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9heG9uL2lzc3Vlcy80NDFcclxuICAgICAqL1xyXG4gICAgc3RyaWN0QXhvbkRlcGVuZGVuY2llczoge1xyXG4gICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogcGFja2FnZVNpbUZlYXR1cmVzLmhhc093blByb3BlcnR5KCAnc3RyaWN0QXhvbkRlcGVuZGVuY2llcycgKSA/ICEhcGFja2FnZVNpbUZlYXR1cmVzLnN0cmljdEF4b25EZXBlbmRlbmNpZXMgOiB0cnVlXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2h1ZmZsZXMgbGlzdGVuZXJzIGVhY2ggdGltZSB0aGV5IGFyZSBub3RpZmllZCwgdG8gaGVscCB1cyB0ZXN0IG9yZGVyIGRlcGVuZGVuY3ksIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYXhvbi9pc3N1ZXMvMjE1XHJcbiAgICAgKlxyXG4gICAgICogJ2RlZmF1bHQnIC0gbm8gc2h1ZmZsaW5nXHJcbiAgICAgKiAncmFuZG9tJyAtIGNob29zZXMgYSBzZWVkIGZvciB5b3VcclxuICAgICAqICdyYW5kb20oMTIzKScgLSBzcGVjaWZ5IGEgc2VlZFxyXG4gICAgICogJ3JldmVyc2UnIC0gcmV2ZXJzZSB0aGUgb3JkZXIgb2YgbGlzdGVuZXJzXHJcbiAgICAgKi9cclxuICAgIGxpc3RlbmVyT3JkZXI6IHtcclxuICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogJ2RlZmF1bHQnLFxyXG4gICAgICBpc1ZhbGlkVmFsdWU6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcclxuXHJcbiAgICAgICAgLy8gTk9URTogdGhpcyByZWd1bGFyIGV4cHJlc3Npb24gbXVzdCBiZSBtYWludGFpbmVkIGluIFRpbnlFbWl0dGVyLnRzIGFzIHdlbGwuXHJcbiAgICAgICAgY29uc3QgcmVnZXggPSAvcmFuZG9tKD86JTI4fFxcKCkoXFxkKykoPzolMjl8XFwpKS87XHJcblxyXG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gJ2RlZmF1bHQnIHx8IHZhbHVlID09PSAncmFuZG9tJyB8fCB2YWx1ZSA9PT0gJ3JldmVyc2UnIHx8IHZhbHVlLm1hdGNoKCByZWdleCApO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hlbiB0cnVlLCB1c2UgU3BlZWNoU3ludGhlc2lzUGFyZW50UG9seWZpbGwgdG8gYXNzaWduIGFuIGltcGxlbWVudGF0aW9uIG9mIFNwZWVjaFN5bnRoZXNpc1xyXG4gICAgICogdG8gdGhlIHdpbmRvdyBzbyB0aGF0IGl0IGNhbiBiZSB1c2VkIGluIHBsYXRmb3JtcyB3aGVyZSBpdCBvdGhlcndpc2Ugd291bGQgbm90IGJlIGF2YWlsYWJsZS5cclxuICAgICAqIEFzc3VtZXMgdGhhdCBhbiBpbXBsZW1lbnRhdGlvbiBvZiBTcGVlY2hTeW50aGVzaXMgaXMgYXZhaWxhYmxlIGZyb20gYSBwYXJlbnQgaWZyYW1lIHdpbmRvdy5cclxuICAgICAqIFNlZSBTcGVlY2hTeW50aGVzaXNQYXJlbnRQb2x5ZmlsbCBpbiB1dHRlcmFuY2UtcXVldWUgZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgICAgKlxyXG4gICAgICogVGhpcyBjYW5ub3QgYmUgYSBxdWVyeSBwYXJhbWV0ZXIgaW4gdXR0ZXJhbmNlLXF1ZXVlIGJlY2F1c2UgdXR0ZXJhbmNlLXF1ZXVlIChhIGRlcGVuZGVuY3kgb2Ygc2NlbmVyeSlcclxuICAgICAqIGNhbiBub3QgdXNlIFF1ZXJ5U3RyaW5nTWFjaGluZS4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xMzY2LlxyXG4gICAgICpcclxuICAgICAqIEZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IHRoZSBtb3RpdmF0aW9uIGZvciB0aGlzIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZmVuc3Rlci9pc3N1ZXMvM1xyXG4gICAgICpcclxuICAgICAqIEZvciBpbnRlcm5hbCB1c2Ugb25seS5cclxuICAgICAqL1xyXG4gICAgc3BlZWNoU3ludGhlc2lzRnJvbVBhcmVudDoge1xyXG4gICAgICB0eXBlOiAnZmxhZydcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTcGVlZCBtdWx0aXBsaWVyIGZvciBldmVyeXRoaW5nIGluIHRoZSBzaW0uIFRoaXMgc2NhbGVzIHRoZSB2YWx1ZSBvZiBkdCBmb3IgQVhPTi90aW1lcixcclxuICAgICAqIG1vZGVsLnN0ZXAsIHZpZXcuc3RlcCwgYW5kIGFueXRoaW5nIGVsc2UgdGhhdCBpcyBjb250cm9sbGVkIGZyb20gU2ltLnN0ZXBTaW11bGF0aW9uLlxyXG4gICAgICogTm9ybWFsIHNwZWVkIGlzIDEuIExhcmdlciB2YWx1ZXMgbWFrZSB0aW1lIGdvIGZhc3Rlciwgc21hbGxlciB2YWx1ZXMgbWFrZSB0aW1lIGdvIHNsb3dlci5cclxuICAgICAqIEZvciBleGFtcGxlLCA/c3BlZWQ9MC41IGlzIGhhbGYgdGhlIG5vcm1hbCBzcGVlZC5cclxuICAgICAqIFVzZWZ1bCBmb3IgdGVzdGluZyBtdWx0aXRvdWNoLCBzbyB0aGF0IG9iamVjdHMgYXJlIGVhc2llciB0byBncmFiIHdoaWxlIHRoZXkncmUgbW92aW5nLlxyXG4gICAgICogRm9yIGludGVybmFsIHVzZSBvbmx5LCBub3QgcHVibGljIGZhY2luZy5cclxuICAgICAqL1xyXG4gICAgc3BlZWQ6IHtcclxuICAgICAgdHlwZTogJ251bWJlcicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogMSxcclxuICAgICAgaXNWYWxpZFZhbHVlOiBmdW5jdGlvbiggdmFsdWUgKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlID4gMDtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE92ZXJyaWRlIHRyYW5zbGF0ZWQgc3RyaW5ncy5cclxuICAgICAqIFRoZSB2YWx1ZSBpcyBlbmNvZGVkIEpTT04gb2YgdGhlIGZvcm0geyBcIm5hbWVzcGFjZS5rZXlcIjpcInZhbHVlXCIsIFwibmFtZXNwYWNlLmtleVwiOlwidmFsdWVcIiwgLi4uIH1cclxuICAgICAqIEV4YW1wbGU6IHsgXCJQSF9TQ0FMRS9sb2dhcml0aG1pY1wiOlwiZm9vXCIsIFwiUEhfU0NBTEUvbGluZWFyXCI6XCJiYXJcIiB9XHJcbiAgICAgKiBFbmNvZGUgdGhlIEpTT04gaW4gYSBicm93c2VyIGNvbnNvbGUgdXNpbmc6IGVuY29kZVVSSUNvbXBvbmVudCggSlNPTi5zdHJpbmdpZnkoIHZhbHVlICkgKVxyXG4gICAgICovXHJcbiAgICBzdHJpbmdzOiB7XHJcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICBkZWZhdWx0VmFsdWU6IG51bGxcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXRzIGEgc3RyaW5nIHVzZWQgZm9yIHZhcmlvdXMgaTE4biB0ZXN0LiAgVGhlIHZhbHVlcyBhcmU6XHJcbiAgICAgKlxyXG4gICAgICogZG91YmxlOiBkdXBsaWNhdGVzIGFsbCBvZiB0aGUgdHJhbnNsYXRlZCBzdHJpbmdzIHdoaWNoIHdpbGwgYWxsb3cgdG8gc2VlIChhKSBpZiBhbGwgc3RyaW5nc1xyXG4gICAgICogICBhcmUgdHJhbnNsYXRlZCBhbmQgKGIpIHdoZXRoZXIgdGhlIGxheW91dCBjYW4gYWNjb21tb2RhdGUgbG9uZ2VyIHN0cmluZ3MgZnJvbSBvdGhlciBsYW5ndWFnZXMuXHJcbiAgICAgKiAgIE5vdGUgdGhpcyBpcyBhIGhldXJpc3RpYyBydWxlIHRoYXQgZG9lcyBub3QgY292ZXIgYWxsIGNhc2VzLlxyXG4gICAgICpcclxuICAgICAqIGxvbmc6IGFuIGV4Y2VwdGlvbmFsbHkgbG9uZyBzdHJpbmcgd2lsbCBiZSBzdWJzdGl0dXRlZCBmb3IgYWxsIHN0cmluZ3MuIFVzZSB0aGlzIHRvIHRlc3QgZm9yIGxheW91dCBwcm9ibGVtcy5cclxuICAgICAqXHJcbiAgICAgKiBydGw6IGEgc3RyaW5nIHRoYXQgdGVzdHMgUlRMIChyaWdodC10by1sZWZ0KSBjYXBhYmlsaXRpZXMgd2lsbCBiZSBzdWJzdGl0dXRlZCBmb3IgYWxsIHN0cmluZ3NcclxuICAgICAqXHJcbiAgICAgKiB4c3M6IHRlc3RzIGZvciBzZWN1cml0eSBpc3N1ZXMgcmVsYXRlZCB0byBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc3BlY2lhbC1vcHMvaXNzdWVzLzE4LFxyXG4gICAgICogICBhbmQgcnVubmluZyBhIHNpbSBzaG91bGQgTk9UIHJlZGlyZWN0IHRvIGFub3RoZXIgcGFnZS4gUHJlZmVyYWJseSBzaG91bGQgYmUgdXNlZCBmb3IgYnVpbHQgdmVyc2lvbnMgb3JcclxuICAgICAqICAgb3RoZXIgdmVyc2lvbnMgd2hlcmUgYXNzZXJ0aW9ucyBhcmUgbm90IGVuYWJsZWQuXHJcbiAgICAgKlxyXG4gICAgICogbm9uZXxudWxsOiB0aGUgbm9ybWFsIHRyYW5zbGF0ZWQgc3RyaW5nIHdpbGwgYmUgc2hvd25cclxuICAgICAqXHJcbiAgICAgKiBkeW5hbWljOiBhZGRzIGdsb2JhbCBob3RrZXkgbGlzdGVuZXJzIHRvIGNoYW5nZSB0aGUgc3RyaW5ncywgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9jaGlwcGVyL2lzc3Vlcy8xMzE5XHJcbiAgICAgKiAgIHJpZ2h0IGFycm93IC0gZG91YmxlcyBhIHN0cmluZywgbGlrZSBzdHJpbmcgPSBzdHJpbmcrc3RyaW5nXHJcbiAgICAgKiAgIGxlZnQgYXJyb3cgLSBoYWx2ZXMgYSBzdHJpbmdcclxuICAgICAqICAgdXAgYXJyb3cgLSBjeWNsZXMgdG8gbmV4dCBzdHJpZGUgaW4gcmFuZG9tIHdvcmQgbGlzdFxyXG4gICAgICogICBkb3duIGFycm93IC0gY3ljbGVzIHRvIHByZXZpb3VzIHN0cmlkZSBpbiByYW5kb20gd29yZCBsaXN0XHJcbiAgICAgKiAgIHNwYWNlYmFyIC0gcmVzZXRzIHRvIGluaXRpYWwgRW5nbGlzaCBzdHJpbmdzLCBhbmQgcmVzZXRzIHRoZSBzdHJpZGVcclxuICAgICAqXHJcbiAgICAgKiB7c3RyaW5nfTogaWYgYW55IG90aGVyIHN0cmluZyBwcm92aWRlZCwgdGhhdCBzdHJpbmcgd2lsbCBiZSBzdWJzdGl0dXRlZCBldmVyeXdoZXJlLiBUaGlzIGZhY2lsaXRhdGVzIHRlc3RpbmdcclxuICAgICAqICAgc3BlY2lmaWMgY2FzZXMsIGxpa2Ugd2hldGhlciB0aGUgd29yZCAndml0ZXNzZScgd291bGQgc3Vic3RpdHV0ZSBmb3IgJ3NwZWVkJyB3ZWxsLiAgQWxzbywgdXNpbmcgXCIvdTIwXCIgaXRcclxuICAgICAqICAgd2lsbCBzaG93IHdoaXRlc3BhY2UgZm9yIGFsbCBvZiB0aGUgc3RyaW5ncywgbWFraW5nIGl0IGVhc3kgdG8gaWRlbnRpZnkgbm9uLXRyYW5zbGF0ZWQgc3RyaW5ncy5cclxuICAgICAqL1xyXG4gICAgc3RyaW5nVGVzdDoge1xyXG4gICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiBudWxsXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYWRkcyBrZXlib2FyZCBzaG9ydGN1dHMuIGN0cmwraSAoZm9yd2FyZCkgb3IgY3RybCt1IChiYWNrd2FyZCkuIEFsc28sIHRoZSBzYW1lIHBoeXNpY2FsIGtleXMgb24gdGhlXHJcbiAgICAgKiBkdm9yYWsga2V5Ym9hcmQgKGM9Zm9yd2FyZCBhbmQgZz1iYWNrd2FyZHMpXHJcbiAgICAgKlxyXG4gICAgICogTk9URTogRFVQTElDQVRJT04gQUxFUlQuIERvbid0IGNoYW5nZSB0aGlzIHdpdGhvdXQgbG9va2luZyBhdCBwYXJhbWV0ZXIgaW4gUEhFVF9JT19XUkFQUEVSUy9QaGV0aW9DbGllbnQudHNcclxuICAgICAqL1xyXG4gICAga2V5Ym9hcmRMb2NhbGVTd2l0Y2hlcjoge1xyXG4gICAgICB0eXBlOiAnZmxhZydcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbmFibGVzIHN1cHBvcnQgZm9yIHRoZSBhY2Nlc3NpYmxlIGRlc2NyaXB0aW9uIHBsdWdpbiBmZWF0dXJlLlxyXG4gICAgICovXHJcbiAgICBzdXBwb3J0c0Rlc2NyaXB0aW9uUGx1Z2luOiB7XHJcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiAhIXBhY2thZ2VTaW1GZWF0dXJlcy5zdXBwb3J0c0Rlc2NyaXB0aW9uUGx1Z2luXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICpcclxuICAgICAqIEVuYWJsZXMgaW50ZXJhY3RpdmUgZGVzY3JpcHRpb24gaW4gdGhlIHNpbXVsYXRpb24uIFVzZSB0aGlzIG9wdGlvbiB0byByZW5kZXIgdGhlIFBhcmFsbGVsIERPTSBmb3Iga2V5Ym9hcmRcclxuICAgICAqIG5hdmlnYXRpb24gYW5kIHNjcmVlbi1yZWFkZXItYmFzZWQgYXVkaXRvcnkgZGVzY3JpcHRpb25zLiBDYW4gYmUgcGVybWFuZW50bHkgZW5hYmxlZCBpZlxyXG4gICAgICogYHN1cHBvcnRzSW50ZXJhY3RpdmVEZXNjcmlwdGlvbjogdHJ1ZWAgaXMgYWRkZWQgdW5kZXIgdGhlIGBwaGV0LnNpbUZlYXR1cmVzYCBlbnRyeSBvZiBwYWNrYWdlLmpzb24uIFF1ZXJ5IHBhcmFtZXRlclxyXG4gICAgICogdmFsdWUgd2lsbCBhbHdheXMgb3ZlcnJpZGUgcGFja2FnZS5qc29uIGVudHJ5LlxyXG4gICAgICovXHJcbiAgICBzdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb246IHtcclxuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICBkZWZhdWx0VmFsdWU6ICEhcGFja2FnZVNpbUZlYXR1cmVzLnN1cHBvcnRzSW50ZXJhY3RpdmVEZXNjcmlwdGlvblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEVuYWJsZXMgc3VwcG9ydCBmb3IgdGhlIFwiSW50ZXJhY3RpdmUgSGlnaGxpZ2h0c1wiIGZlYXR1cmUsIHdoZXJlIGhpZ2hsaWdodHMgYXBwZWFyIGFyb3VuZCBpbnRlcmFjdGl2ZVxyXG4gICAgICogVUkgY29tcG9uZW50cy4gVGhpcyBpcyBtb3N0IHVzZWZ1bCBmb3IgdXNlcnMgd2l0aCBsb3cgdmlzaW9uIGFuZCBtYWtlcyBpdCBlYXNpZXIgdG8gaWRlbnRpZnkgaW50ZXJhY3RpdmVcclxuICAgICAqIGNvbXBvbmVudHMuIFRob3VnaCBlbmFibGVkIGhlcmUsIHRoZSBmZWF0dXJlIHdpbGwgYmUgdHVybmVkIG9mZiB1bnRpbCBlbmFibGVkIGJ5IHRoZSB1c2VyIGZyb20gdGhlIFByZWZlcmVuY2VzXHJcbiAgICAgKiBkaWFsb2cuXHJcbiAgICAgKlxyXG4gICAgICogVGhpcyBmZWF0dXJlIGlzIGVuYWJsZWQgYnkgZGVmYXVsdCB3aGVuZXZlciBzdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb24gaXMgdHJ1ZSBpbiBwYWNrYWdlLmpzb24sIHNpbmNlIFBoRVRcclxuICAgICAqIHdhbnRzIHRvIHNjYWxlIG91dCB0aGlzIGZlYXR1cmUgd2l0aCBhbGwgc2ltcyB0aGF0IHN1cHBvcnQgYWx0ZXJuYXRpdmUgaW5wdXQuIFRoZSBmZWF0dXJlIGNhbiBiZSBESVNBQkxFRCB3aGVuXHJcbiAgICAgKiBzdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb24gaXMgdHJ1ZSBieSBzZXR0aW5nIGBzdXBwb3J0c0ludGVyYWN0aXZlSGlnaGxpZ2h0czogZmFsc2VgIHVuZGVyXHJcbiAgICAgKiBgcGhldC5zaW1GZWF0dXJlc2AgaW4gcGFja2FnZS5qc29uLlxyXG4gICAgICpcclxuICAgICAqIFRoZSBxdWVyeSBwYXJhbWV0ZXIgd2lsbCBhbHdheXMgb3ZlcnJpZGUgdGhlIHBhY2thZ2UuanNvbiBlbnRyeS5cclxuICAgICAqL1xyXG4gICAgc3VwcG9ydHNJbnRlcmFjdGl2ZUhpZ2hsaWdodHM6IHtcclxuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG5cclxuICAgICAgLy8gSWYgc3VwcG9ydHNJbnRlcmFjdGl2ZUhpZ2hsaWdodHMgaXMgZXhwbGljaXRseSBwcm92aWRlZCBpbiBwYWNrYWdlLmpzb24sIHVzZSB0aGF0IHZhbHVlLiBPdGhlcndpc2UsIGVuYWJsZVxyXG4gICAgICAvLyBJbnRlcmFjdGl2ZSBIaWdobGlnaHRzIHdoZW4gSW50ZXJhY3RpdmUgRGVzY3JpcHRpb24gaXMgc3VwcG9ydGVkLlxyXG4gICAgICBkZWZhdWx0VmFsdWU6IHBhY2thZ2VTaW1GZWF0dXJlcy5oYXNPd25Qcm9wZXJ0eSggJ3N1cHBvcnRzSW50ZXJhY3RpdmVIaWdobGlnaHRzJyApID9cclxuICAgICAgICAgICAgICAgICAgICAhIXBhY2thZ2VTaW1GZWF0dXJlcy5zdXBwb3J0c0ludGVyYWN0aXZlSGlnaGxpZ2h0cyA6ICEhcGFja2FnZVNpbUZlYXR1cmVzLnN1cHBvcnRzSW50ZXJhY3RpdmVEZXNjcmlwdGlvblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEJ5IGRlZmF1bHQsIEludGVyYWN0aXZlIEhpZ2hsaWdodHMgYXJlIGRpc2FibGVkIG9uIHN0YXJ0dXAuIFByb3ZpZGUgdGhpcyBmbGFnIHRvIGhhdmUgdGhlIGZlYXR1cmUgZW5hYmxlZCBvblxyXG4gICAgICogc3RhcnR1cC4gSGFzIG5vIGVmZmVjdCBpZiBzdXBwb3J0c0ludGVyYWN0aXZlSGlnaGxpZ2h0cyBpcyBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgaW50ZXJhY3RpdmVIaWdobGlnaHRzSW5pdGlhbGx5RW5hYmxlZDoge1xyXG4gICAgICB0eXBlOiAnZmxhZycsXHJcbiAgICAgIHB1YmxpYzogdHJ1ZVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluZGljYXRlcyB3aGV0aGVyIGN1c3RvbSBnZXN0dXJlIGNvbnRyb2wgaXMgZW5hYmxlZCBieSBkZWZhdWx0IGluIHRoZSBzaW11bGF0aW9uLlxyXG4gICAgICogVGhpcyBpbnB1dCBtZXRob2QgaXMgc3RpbGwgaW4gZGV2ZWxvcG1lbnQsIG1vc3RseSB0byBiZSB1c2VkIGluIGNvbWJpbmF0aW9uIHdpdGggdGhlIHZvaWNpbmdcclxuICAgICAqIGZlYXR1cmUuIEl0IGFsbG93cyB5b3UgdG8gc3dpcGUgdGhlIHNjcmVlbiB0byBtb3ZlIGZvY3VzLCBkb3VibGUgdGFwIHRoZSBzY3JlZW4gdG8gYWN0aXZhdGVcclxuICAgICAqIGNvbXBvbmVudHMsIGFuZCB0YXAgYW5kIGhvbGQgdG8gaW5pdGlhdGUgY3VzdG9tIGdlc3R1cmVzLlxyXG4gICAgICpcclxuICAgICAqIEZvciBpbnRlcm5hbCB1c2UsIHRob3VnaCBtYXkgYmUgdXNlZCBpbiBzaGFyZWQgbGlua3Mgd2l0aCBjb2xsYWJvcmF0b3JzLlxyXG4gICAgICovXHJcbiAgICBzdXBwb3J0c0dlc3R1cmVDb250cm9sOiB7XHJcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiAhIXBhY2thZ2VTaW1GZWF0dXJlcy5zdXBwb3J0c0dlc3R1cmVDb250cm9sXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29udHJvbHMgd2hldGhlciB0aGUgXCJWb2ljaW5nXCIgZmVhdHVyZSBpcyBlbmFibGVkLlxyXG4gICAgICpcclxuICAgICAqIFRoaXMgZmVhdHVyZSBpcyBlbmFibGVkIGJ5IGRlZmF1bHQgd2hlbiBzdXBwb3J0c1ZvaWNpbmcgaXMgdHJ1ZSBpbiBwYWNrYWdlLmpzb24uIFRoZSBxdWVyeSBwYXJhbWV0ZXIgd2lsbCBhbHdheXNcclxuICAgICAqIG92ZXJyaWRlIHRoZSBwYWNrYWdlLmpzb24gZW50cnkuXHJcbiAgICAgKi9cclxuICAgIHN1cHBvcnRzVm9pY2luZzoge1xyXG4gICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogISFwYWNrYWdlU2ltRmVhdHVyZXMuc3VwcG9ydHNWb2ljaW5nXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU3dpdGNoZXMgdGhlIFZlbGxvIHJlbmRlcmluZyBvZiBUZXh0IHRvIHVzZSBTd2FzaCAod2l0aCBlbWJlZGRlZCBmb250cyksIGluc3RlYWQgb2YgQ2FudmFzLlxyXG4gICAgICpcclxuICAgICAqIEZvciBpbnRlcm5hbCB1c2Ugb25seS4gVGhpcyBpcyBjdXJyZW50bHkgb25seSB1c2VkIGluIHByb3RvdHlwZXMuXHJcbiAgICAgKi9cclxuICAgIHN3YXNoVGV4dDoge1xyXG4gICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogdHJ1ZVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIElmIG5vbi1lbXB0eSwgU3dhc2gtcmVuZGVyZWQgdGV4dCB3aWxsIHNob3cgdXAgaW4gdGhlIGdpdmVuIGNvbG9yICh1c2VmdWwgZm9yIGRlYnVnZ2luZylcclxuICAgICAqXHJcbiAgICAgKiBGb3IgaW50ZXJuYWwgdXNlIG9ubHkuIFRoaXMgaXMgY3VycmVudGx5IG9ubHkgdXNlZCBpbiBwcm90b3R5cGVzLlxyXG4gICAgICovXHJcbiAgICBzd2FzaFRleHRDb2xvcjoge1xyXG4gICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiAnJ1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEJ5IGRlZmF1bHQsIHZvaWNpbmcgaXMgbm90IGVuYWJsZWQgb24gc3RhcnR1cC4gQWRkIHRoaXMgZmxhZyB0byBzdGFydCB0aGUgc2ltIHdpdGggdm9pY2luZyBlbmFibGVkLlxyXG4gICAgICovXHJcbiAgICB2b2ljaW5nSW5pdGlhbGx5RW5hYmxlZDoge1xyXG4gICAgICB0eXBlOiAnZmxhZydcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBIGRlYnVnIHF1ZXJ5IHBhcmFtZXRlciB0aGF0IHdpbGwgc2F2ZSBhbmQgbG9hZCB5b3UgcHJlZmVyZW5jZXMgKGZyb20gdGhlIFByZWZlcmVuY2VzIERpYWxvZykgdGhyb3VnaCBtdWx0aXBsZSBydW50aW1lcy5cclxuICAgICAqIFNlZSBQcmVmZXJlbmNlc1N0b3JhZ2UucmVnaXN0ZXIgdG8gc2VlIHdoYXQgUHJvcGVydGllcyBzdXBwb3J0IHRoaXMgc2F2ZS9sb2FkIGZlYXR1cmUuXHJcbiAgICAgKi9cclxuICAgIHByZWZlcmVuY2VzU3RvcmFnZToge1xyXG4gICAgICB0eXBlOiAnZmxhZydcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb25zb2xlIGxvZyB0aGUgdm9pY2luZyByZXNwb25zZXMgdGhhdCBhcmUgc3Bva2VuIGJ5IFNwZWVjaFN5bnRoZXNpc1xyXG4gICAgICovXHJcbiAgICBwcmludFZvaWNpbmdSZXNwb25zZXM6IHtcclxuICAgICAgdHlwZTogJ2ZsYWcnXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW5hYmxlcyBwYW5uaW5nIGFuZCB6b29taW5nIG9mIHRoZSBzaW11bGF0aW9uLiBDYW4gYmUgcGVybWFuZW50bHkgZGlzYWJsZWQgaWYgc3VwcG9ydHNQYW5BbmRab29tOiBmYWxzZSBpc1xyXG4gICAgICogYWRkZWQgdW5kZXIgdGhlIGBwaGV0LnNpbUZlYXR1cmVzYCBlbnRyeSBvZiBwYWNrYWdlLmpzb24uIFF1ZXJ5IHBhcmFtZXRlciB2YWx1ZSB3aWxsIGFsd2F5cyBvdmVycmlkZSBwYWNrYWdlLmpzb24gZW50cnkuXHJcbiAgICAgKlxyXG4gICAgICogUHVibGljLCBzbyB0aGF0IHVzZXJzIGNhbiBkaXNhYmxlIHRoaXMgZmVhdHVyZSBpZiB0aGV5IG5lZWQgdG8uXHJcbiAgICAgKi9cclxuICAgIHN1cHBvcnRzUGFuQW5kWm9vbToge1xyXG4gICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgIHB1YmxpYzogdHJ1ZSxcclxuXHJcbiAgICAgIC8vIGV2ZW4gaWYgbm90IHByb3ZpZGVkIGluIHBhY2thZ2UuanNvbiwgdGhpcyBkZWZhdWx0cyB0byBiZWluZyB0cnVlXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogIXBhY2thZ2VTaW1GZWF0dXJlcy5oYXNPd25Qcm9wZXJ0eSggJ3N1cHBvcnRzUGFuQW5kWm9vbScgKSB8fCBwYWNrYWdlU2ltRmVhdHVyZXMuc3VwcG9ydHNQYW5BbmRab29tXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5kaWNhdGVzIHdoZXRoZXIgdGhlIHNvdW5kIGxpYnJhcnkgc2hvdWxkIGJlIGVuYWJsZWQuICBJZiB0cnVlLCBhbiBpY29uIGlzIGFkZGVkIHRvIHRoZSBuYXYgYmFyIGljb24gdG8gZW5hYmxlXHJcbiAgICAgKiB0aGUgdXNlciB0byB0dXJuIHNvdW5kIG9uL29mZi4gIFRoZXJlIGlzIGFsc28gYSBTaW0gb3B0aW9uIGZvciBlbmFibGluZyBzb3VuZCB3aGljaCBjYW4gb3ZlcnJpZGUgdGhpcy5cclxuICAgICAqIFByaW1hcmlseSBmb3IgaW50ZXJuYWwgdXNlLCB0aG91Z2ggd2UgbWF5IHNoYXJlIGxpbmtzIHdpdGggY29sbGFib3JhdGVzIHRoYXQgdXNlIHRoaXMgcGFyYW1ldGVyLlxyXG4gICAgICovXHJcbiAgICBzdXBwb3J0c1NvdW5kOiB7XHJcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiAhIXBhY2thZ2VTaW1GZWF0dXJlcy5zdXBwb3J0c1NvdW5kXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5kaWNhdGVzIHdoZXRoZXIgZXh0cmEgc291bmRzIGFyZSB1c2VkIGluIGFkZGl0aW9uIHRvIGJhc2ljIHNvdW5kcyBhcyBwYXJ0IG9mIHRoZSBzb3VuZCBkZXNpZ24uICBJZiB0cnVlLCB0aGVcclxuICAgICAqIFBoRVQgbWVudSB3aWxsIGhhdmUgYW4gb3B0aW9uIGZvciBlbmFibGluZyBleHRyYSBzb3VuZHMuICBUaGlzIHdpbGwgYmUgaWdub3JlZCBpZiBzb3VuZCBpcyBub3QgZ2VuZXJhbGx5XHJcbiAgICAgKiBlbmFibGVkIChzZWUgP3N1cHBvcnRzU291bmQpLlxyXG4gICAgICpcclxuICAgICAqIFByaW1hcmlseSBmb3IgaW50ZXJuYWwgdXNlLCB0aG91Z2ggd2UgbWF5IHNoYXJlIGxpbmtzIHdpdGggY29sbGFib3JhdGVzIHRoYXQgdXNlIHRoaXMgcGFyYW1ldGVyLlxyXG4gICAgICovXHJcbiAgICBzdXBwb3J0c0V4dHJhU291bmQ6IHtcclxuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICBkZWZhdWx0VmFsdWU6ICEhcGFja2FnZVNpbUZlYXR1cmVzLnN1cHBvcnRzRXh0cmFTb3VuZFxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluZGljYXRlcyB3aGV0aGVyIG9yIG5vdCB2aWJyYXRpb24gaXMgZW5hYmxlZCwgYW5kIHdoaWNoIHBhcmFkaWdtIGlzIGVuYWJsZWQgZm9yIHRlc3RpbmcuIFRoZXJlXHJcbiAgICAgKiBhcmUgc2V2ZXJhbCBcInBhcmFkaWdtc1wiLCB3aGljaCBhcmUgZGlmZmVyZW50IHZpYnJhdGlvbiBvdXRwdXQgZGVzaWducy4gIEZvciB0ZW1wb3JhcnkgdXNlXHJcbiAgICAgKiB3aGlsZSB3ZSBpbnZlc3RpZ2F0ZSB1c2Ugb2YgdGhpcyBmZWF0dXJlLiBJbiB0aGUgbG9uZyBydW4gdGhlcmUgd2lsbCBwcm9iYWJseSBiZSBvbmx5XHJcbiAgICAgKiBvbmUgZGVzaWduIGFuZCBpdCBjYW4gYmUgZW5hYmxlZC9kaXNhYmxlZCB3aXRoIHNvbWV0aGluZyBtb3JlIGxpa2UgYHN1cHBvcnRzVmlicmF0aW9uYC5cclxuICAgICAqXHJcbiAgICAgKiBUaGVzZSBhcmUgbnVtYmVyZWQsIGJ1dCB0eXBlIGlzIHN0cmluZyBzbyBkZWZhdWx0IGNhbiBiZSBudWxsLCB3aGVyZSBhbGwgdmlicmF0aW9uIGlzIGRpc2FibGVkLlxyXG4gICAgICpcclxuICAgICAqIFVzZWQgaW50ZXJuYWxseSwgdGhvdWdoIGxpbmtzIGFyZSBzaGFyZWQgd2l0aCBjb2xsYWJvcmF0b3JzIGFuZCBwb3NzaWJseSBpbiBwYXBlciBwdWJsaWNhdGlvbnMuXHJcbiAgICAgKi9cclxuICAgIHZpYnJhdGlvblBhcmFkaWdtOiB7XHJcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICBkZWZhdWx0VmFsdWU6IG51bGxcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbmFibGVzIFdlYkdMIHJlbmRlcmluZy4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8yODkuXHJcbiAgICAgKiBOb3RlIHRoYXQgc2ltdWxhdGlvbnMgY2FuIG9wdC1pbiB0byB3ZWJnbCB2aWEgbmV3IFNpbSh7d2ViZ2w6dHJ1ZX0pLCBidXQgdXNpbmcgP3dlYmdsPXRydWUgdGFrZXNcclxuICAgICAqIHByZWNlZGVuY2UuICBJZiBubyB3ZWJnbCBxdWVyeSBwYXJhbWV0ZXIgaXMgc3VwcGxpZWQsIHRoZW4gc2ltdWxhdGlvbnMgdGFrZSB0aGUgU2ltIG9wdGlvbiB2YWx1ZSwgd2hpY2hcclxuICAgICAqIGRlZmF1bHRzIHRvIGZhbHNlLiAgU2VlIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvNjIxXHJcbiAgICAgKi9cclxuICAgIHdlYmdsOiB7XHJcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiB0cnVlXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5kaWNhdGVzIHdoZXRoZXIgeW90dGEgYW5hbHl0aWNzIGFyZSBlbmFibGVkLlxyXG4gICAgICovXHJcbiAgICB5b3R0YToge1xyXG4gICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogdHJ1ZSxcclxuICAgICAgcHVibGljOiB0cnVlXHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLy8gSW5pdGlhbGl6ZSBxdWVyeSBwYXJhbWV0ZXJzLCBzZWUgZG9jcyBhYm92ZVxyXG4gICggZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgLy8gQ3JlYXRlIHRoZSBhdHRhY2htZW50IHBvaW50IGZvciBhbGwgUGhFVCBnbG9iYWxzXHJcbiAgICB3aW5kb3cucGhldCA9IHdpbmRvdy5waGV0IHx8IHt9O1xyXG4gICAgd2luZG93LnBoZXQuY2hpcHBlciA9IHdpbmRvdy5waGV0LmNoaXBwZXIgfHwge307XHJcblxyXG4gICAgLy8gUmVhZCBxdWVyeSBwYXJhbWV0ZXJzXHJcbiAgICB3aW5kb3cucGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycyA9IFF1ZXJ5U3RyaW5nTWFjaGluZS5nZXRBbGwoIFFVRVJZX1BBUkFNRVRFUlNfU0NIRU1BICk7XHJcbiAgICB3aW5kb3cucGhldC5jaGlwcGVyLmNvbG9yUHJvZmlsZXMgPSBjb2xvclByb2ZpbGVzO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIGFueSB0eXBlIG9mIGZ1enppbmcgaXMgZW5hYmxlZC4gVGhpcyBpcyBhIGZ1bmN0aW9uIHNvIHRoYXQgdGhlIGFzc29jaWF0ZWQgcXVlcnkgcGFyYW1ldGVyc1xyXG4gICAgICogY2FuIGJlIGNoYW5nZWQgZnJvbSB0aGUgY29uc29sZSB3aGlsZSB0aGUgc2ltIGlzIHJ1bm5pbmcuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc3VuL2lzc3Vlcy82NzcuXHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgd2luZG93LnBoZXQuY2hpcHBlci5pc0Z1enpFbmFibGVkID0gKCkgPT5cclxuICAgICAgKCB3aW5kb3cucGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5mdXp6IHx8XHJcbiAgICAgICAgd2luZG93LnBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuZnV6ek1vdXNlIHx8XHJcbiAgICAgICAgd2luZG93LnBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuZnV6elRvdWNoIHx8XHJcbiAgICAgICAgd2luZG93LnBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuZnV6ekJvYXJkXHJcbiAgICAgICk7XHJcblxyXG4gICAgLy8gQWRkIGEgbG9nIGZ1bmN0aW9uIHRoYXQgZGlzcGxheXMgbWVzc2FnZXMgdG8gdGhlIGNvbnNvbGUuIEV4YW1wbGVzOlxyXG4gICAgLy8gcGhldC5sb2cgJiYgcGhldC5sb2coICdZb3Ugd2luIScgKTtcclxuICAgIC8vIHBoZXQubG9nICYmIHBoZXQubG9nKCAnWW91IGxvc2UnLCB7IGNvbG9yOiAncmVkJyB9ICk7XHJcbiAgICBpZiAoIHdpbmRvdy5waGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmxvZyApIHtcclxuICAgICAgd2luZG93LnBoZXQubG9nID0gZnVuY3Rpb24oIG1lc3NhZ2UsIG9wdGlvbnMgKSB7XHJcbiAgICAgICAgb3B0aW9ucyA9IF8uYXNzaWduSW4oIHtcclxuICAgICAgICAgIGNvbG9yOiAnIzAwOTkwMCcgLy8gZ3JlZW5cclxuICAgICAgICB9LCBvcHRpb25zICk7XHJcbiAgICAgICAgY29uc29sZS5sb2coIGAlYyR7bWVzc2FnZX1gLCBgY29sb3I6ICR7b3B0aW9ucy5jb2xvcn1gICk7IC8vIGdyZWVuXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXRzIHRoZSBuYW1lIG9mIGJyYW5kIHRvIHVzZSwgd2hpY2ggZGV0ZXJtaW5lcyB3aGljaCBsb2dvIHRvIHNob3cgaW4gdGhlIG5hdmJhciBhcyB3ZWxsIGFzIHdoYXQgb3B0aW9uc1xyXG4gICAgICogdG8gc2hvdyBpbiB0aGUgUGhFVCBtZW51IGFuZCB3aGF0IHRleHQgdG8gc2hvdyBpbiB0aGUgQWJvdXQgZGlhbG9nLlxyXG4gICAgICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9icmFuZC9pc3N1ZXMvMTFcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIHdpbmRvdy5waGV0LmNoaXBwZXIuYnJhbmQgPSB3aW5kb3cucGhldC5jaGlwcGVyLmJyYW5kIHx8IHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuYnJhbmQgfHwgJ2FkYXB0ZWQtZnJvbS1waGV0JztcclxuXHJcbiAgICAvLyB7c3RyaW5nfG51bGx9IC0gU2VlIGRvY3VtZW50YXRpb24gb2Ygc3RyaW5nVGVzdCBxdWVyeSBwYXJhbWV0ZXIgLSB3ZSBuZWVkIHRvIHN1cHBvcnQgdGhpcyBkdXJpbmcgYnVpbGQsIHdoZXJlXHJcbiAgICAvLyAgICAgICAgICAgICAgICAgdGhlcmUgYXJlbid0IGFueSBxdWVyeSBwYXJhbWV0ZXJzLlxyXG4gICAgY29uc3Qgc3RyaW5nVGVzdCA9ICggdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5zdHJpbmdUZXN0ICkgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgIHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuc3RyaW5nVGVzdCA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgbnVsbDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1hcHMgYW4gaW5wdXQgc3RyaW5nIHRvIGEgZmluYWwgc3RyaW5nLCBhY2NvbW1vZGF0aW5nIHRyaWNrcyBsaWtlIGRvdWJsZVN0cmluZ3MuXHJcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgdG8gbW9kaWZ5IGFsbCBzdHJpbmdzIGluIGEgc2ltIHdoZW4gdGhlIHN0cmluZ1Rlc3QgcXVlcnkgcGFyYW1ldGVyIGlzIHVzZWQuXHJcbiAgICAgKiBUaGUgc3RyaW5nVGVzdCBxdWVyeSBwYXJhbWV0ZXIgYW5kIGl0cyBvcHRpb25zIGFyZSBkb2N1bWVudGVkIGluIHRoZSBxdWVyeSBwYXJhbWV0ZXIgZG9jcyBhYm92ZS5cclxuICAgICAqIEl0IGlzIHVzZWQgaW4gc3RyaW5nLmpzIGFuZCBzaW0uaHRtbC5cclxuICAgICAqIEBwYXJhbSBzdHJpbmcgLSB0aGUgc3RyaW5nIHRvIGJlIG1hcHBlZFxyXG4gICAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgd2luZG93LnBoZXQuY2hpcHBlci5tYXBTdHJpbmcgPSBmdW5jdGlvbiggc3RyaW5nICkge1xyXG4gICAgICBjb25zdCBzY3JpcHQgPSAnc2NyaXB0JztcclxuICAgICAgcmV0dXJuIHN0cmluZ1Rlc3QgPT09IG51bGwgPyBzdHJpbmcgOlxyXG4gICAgICAgICAgICAgc3RyaW5nVGVzdCA9PT0gJ2RvdWJsZScgPyBgJHtzdHJpbmd9OiR7c3RyaW5nfWAgOlxyXG4gICAgICAgICAgICAgc3RyaW5nVGVzdCA9PT0gJ2xvbmcnID8gJzEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwJyA6XHJcbiAgICAgICAgICAgICBzdHJpbmdUZXN0ID09PSAncnRsJyA/ICdcXHUyMDJiXFx1MDYyYVxcdTA2MzNcXHUwNjJhIChcXHUwNjMyXFx1MDYyOFxcdTA2MjdcXHUwNjQ2KVxcdTIwMmMnIDpcclxuICAgICAgICAgICAgIHN0cmluZ1Rlc3QgPT09ICd4c3MnID8gYCR7c3RyaW5nfTxpbWcgc3JjPVwiZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFBRUFBQUFCQ0FZQUFBQWZGY1NKQUFBQURVbEVRVlFJVzJOa1lHRDREd0FCQ1FFQnR4bU43d0FBQUFCSlJVNUVya0pnZ2c9PVwiIG9ubG9hZD1cIndpbmRvdy5sb2NhdGlvbi5ocmVmPWF0b2IoJ2FIUjBjSE02THk5M2QzY3VlVzkxZEhWaVpTNWpiMjB2ZDJGMFkyZy9kajFrVVhjMGR6bFhaMWhqVVE9PScpXCIgLz5gIDpcclxuICAgICAgICAgICAgIHN0cmluZ1Rlc3QgPT09ICd4c3MyJyA/IGAke3N0cmluZ308JHtzY3JpcHR9PmFsZXJ0KCdYU1MnKTwvJHtzY3JpcHR9PmAgOlxyXG4gICAgICAgICAgICAgc3RyaW5nVGVzdCA9PT0gJ25vbmUnID8gc3RyaW5nIDpcclxuICAgICAgICAgICAgIHN0cmluZ1Rlc3QgPT09ICdkeW5hbWljJyA/IHN0cmluZyA6XHJcblxyXG4gICAgICAgICAgICAgICAvLyBJbiB0aGUgZmFsbGJhY2sgY2FzZSwgc3VwcGx5IHdoYXRldmVyIHN0cmluZyB3YXMgZ2l2ZW4gaW4gdGhlIHF1ZXJ5IHBhcmFtZXRlciB2YWx1ZVxyXG4gICAgICAgICAgICAgc3RyaW5nVGVzdDtcclxuICAgIH07XHJcblxyXG4gICAgLy8gV2Ugd2lsbCBuZWVkIHRvIGNoZWNrIGZvciBsb2NhbGUgdmFsaWRpdHkgKG9uY2Ugd2UgaGF2ZSBsb2NhbGVEYXRhIGxvYWRlZCwgaWYgcnVubmluZyB1bmJ1aWx0KSwgYW5kIHBvdGVudGlhbGx5XHJcbiAgICAvLyBlaXRoZXIgZmFsbCBiYWNrIHRvIGBlbmAsIG9yIHJlbWFwIGZyb20gMy1jaGFyYWN0ZXIgbG9jYWxlcyB0byBvdXIgbG9jYWxlIGtleXMuXHJcbiAgICBwaGV0LmNoaXBwZXIuY2hlY2tBbmRSZW1hcExvY2FsZSA9ICgpID0+IHtcclxuICAgICAgLy8gV2UgbmVlZCBib3RoIHRvIHByb2NlZWQuIFByb3ZpZGVkIGFzIGEgZ2xvYmFsLCBzbyB3ZSBjYW4gY2FsbCBpdCBmcm9tIGxvYWQtdW5idWlsdC1zdHJpbmdzXHJcbiAgICAgIC8vIChJRiBpbml0aWFsaXplLWdsb2JhbHMgbG9hZHMgZmlyc3QpXHJcbiAgICAgIGlmICggIXBoZXQuY2hpcHBlci5sb2NhbGVEYXRhIHx8ICFwaGV0LmNoaXBwZXIubG9jYWxlICkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgbGV0IGxvY2FsZSA9IHBoZXQuY2hpcHBlci5sb2NhbGU7XHJcblxyXG4gICAgICBpZiAoIGxvY2FsZSApIHtcclxuICAgICAgICBpZiAoIGxvY2FsZS5sZW5ndGggPCA1ICkge1xyXG4gICAgICAgICAgbG9jYWxlID0gbG9jYWxlLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgbG9jYWxlID0gbG9jYWxlLnJlcGxhY2UoIC8tLywgJ18nICk7XHJcblxyXG4gICAgICAgICAgY29uc3QgcGFydHMgPSBsb2NhbGUuc3BsaXQoICdfJyApO1xyXG4gICAgICAgICAgaWYgKCBwYXJ0cy5sZW5ndGggPT09IDIgKSB7XHJcbiAgICAgICAgICAgIGxvY2FsZSA9IHBhcnRzWyAwIF0udG9Mb3dlckNhc2UoKSArICdfJyArIHBhcnRzWyAxIF0udG9VcHBlckNhc2UoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICggbG9jYWxlLmxlbmd0aCA9PT0gMyApIHtcclxuICAgICAgICAgIGZvciAoIGNvbnN0IGNhbmRpZGF0ZUxvY2FsZSBvZiBPYmplY3Qua2V5cyggcGhldC5jaGlwcGVyLmxvY2FsZURhdGEgKSApIHtcclxuICAgICAgICAgICAgaWYgKCBwaGV0LmNoaXBwZXIubG9jYWxlRGF0YVsgY2FuZGlkYXRlTG9jYWxlIF0ubG9jYWxlMyA9PT0gbG9jYWxlICkge1xyXG4gICAgICAgICAgICAgIGxvY2FsZSA9IGNhbmRpZGF0ZUxvY2FsZTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCAhcGhldC5jaGlwcGVyLmxvY2FsZURhdGFbIGxvY2FsZSBdICkge1xyXG4gICAgICAgIGNvbnN0IGJhZExvY2FsZSA9IHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMubG9jYWxlO1xyXG5cclxuICAgICAgICBjb25zdCBpc1BhaXIgPSAvXlthLXpdezJ9JC8udGVzdCggYmFkTG9jYWxlICk7XHJcbiAgICAgICAgY29uc3QgaXNUcmlwbGUgPSAvXlthLXpdezN9JC8udGVzdCggYmFkTG9jYWxlICk7XHJcbiAgICAgICAgY29uc3QgaXNQYWlyX1BBSVIgPSAvXlthLXpdezJ9X1tBLVpdezJ9JC8udGVzdCggYmFkTG9jYWxlICk7XHJcblxyXG4gICAgICAgIGlmICggIWlzUGFpciAmJiAhaXNUcmlwbGUgJiYgIWlzUGFpcl9QQUlSICkge1xyXG4gICAgICAgICAgUXVlcnlTdHJpbmdNYWNoaW5lLmFkZFdhcm5pbmcoICdsb2NhbGUnLCBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmxvY2FsZSwgYEludmFsaWQgbG9jYWxlIGZvcm1hdCByZWNlaXZlZDogJHtiYWRMb2NhbGV9LiA/bG9jYWxlIHF1ZXJ5IHBhcmFtZXRlciBhY2NlcHRzIHRoZSBmb2xsb3dpbmcgZm9ybWF0czogXCJ4eFwiIGZvciBJU08tNjM5LTEsIFwieHhfWFhcIiBmb3IgSVNPLTYzOS0xIGFuZCBhIDItbGV0dGVyIGNvdW50cnkgY29kZSwgXCJ4eHhcIiBmb3IgSVNPLTYzOS0yYCApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbG9jYWxlID0gJ2VuJztcclxuICAgICAgfVxyXG5cclxuICAgICAgcGhldC5jaGlwcGVyLmxvY2FsZSA9IGxvY2FsZTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gSWYgbG9jYWxlIHdhcyBwcm92aWRlZCBhcyBhIHF1ZXJ5IHBhcmFtZXRlciwgdGhlbiBjaGFuZ2UgdGhlIGxvY2FsZSB1c2VkIGJ5IEdvb2dsZSBBbmFseXRpY3MuXHJcbiAgICBpZiAoIFF1ZXJ5U3RyaW5nTWFjaGluZS5jb250YWluc0tleSggJ2xvY2FsZScgKSApIHtcclxuICAgICAgcGhldC5jaGlwcGVyLmxvY2FsZSA9IHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMubG9jYWxlO1xyXG5cclxuICAgICAgLy8gTk9URTogSWYgd2UgYXJlIGxvYWRpbmcgaW4gdW5idWlsdCBtb2RlLCB0aGlzIG1heSBleGVjdXRlIEJFRk9SRSB3ZSBoYXZlIGxvYWRlZCBsb2NhbGVEYXRhLiBXZSBoYXZlIGEgc2ltaWxhclxyXG4gICAgICAvLyByZW1hcHBpbmcgaW4gbG9hZC11bmJ1aWx0LXN0cmluZ3Mgd2hlbiB0aGlzIGhhcHBlbnMuXHJcbiAgICAgIHBoZXQuY2hpcHBlci5jaGVja0FuZFJlbWFwTG9jYWxlKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggIXdpbmRvdy5waGV0LmNoaXBwZXIubG9jYWxlICkge1xyXG4gICAgICAvLyBGaWxsIGluIGEgZGVmYXVsdFxyXG4gICAgICB3aW5kb3cucGhldC5jaGlwcGVyLmxvY2FsZSA9ICdlbic7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc3RyaW5nT3ZlcnJpZGVzID0gSlNPTi5wYXJzZSggcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5zdHJpbmdzIHx8ICd7fScgKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBhIHN0cmluZyBnaXZlbiB0aGUga2V5LiBUaGlzIGltcGxlbWVudGF0aW9uIGlzIG1lYW50IGZvciB1c2Ugb25seSBpbiB0aGUgYnVpbGQgc2ltLiBGb3IgbW9yZSBpbmZvIHNlZSB0aGVcclxuICAgICAqIHN0cmluZyBwbHVnaW4uXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IC0gbGlrZSBcIlJFUE8vc3RyaW5nLmtleS5oZXJlXCIgd2hpY2ggaW5jbHVkZXMgdGhlIHJlcXVpcmVqc05hbWVzcGFjZSwgd2hpY2ggaXMgc3BlY2lmaWVkIGluIHBhY2thZ2UuanNvblxyXG4gICAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgcGhldC5jaGlwcGVyLmdldFN0cmluZ0ZvckJ1aWx0U2ltID0ga2V5ID0+IHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggISFwaGV0LmNoaXBwZXIuaXNQcm9kdWN0aW9uLCAnZXhwZWN0ZWQgdG8gYmUgcnVubmluZyBhIGJ1aWx0IHNpbScgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggISFwaGV0LmNoaXBwZXIuc3RyaW5ncywgJ3BoZXQuY2hpcHBlci5zdHJpbmdzIHNob3VsZCBiZSBmaWxsZWQgb3V0IGJ5IGluaXRpYWxpemF0aW9uIHNjcmlwdCcgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggISFwaGV0LmNoaXBwZXIubG9jYWxlLCAnbG9jYWxlIGlzIHJlcXVpcmVkIHRvIGxvb2sgdXAgdGhlIGNvcnJlY3Qgc3RyaW5ncycgKTtcclxuXHJcbiAgICAgIC8vIG92ZXJyaWRlIHN0cmluZ3MgdmlhIHRoZSAnc3RyaW5ncycgcXVlcnkgcGFyYW1ldGVyXHJcbiAgICAgIGlmICggc3RyaW5nT3ZlcnJpZGVzWyBrZXkgXSApIHtcclxuICAgICAgICByZXR1cm4gc3RyaW5nT3ZlcnJpZGVzWyBrZXkgXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gR2V0IGEgbGlzdCBvZiBsb2NhbGVzIGluIHRoZSBvcmRlciB0aGV5IHNob3VsZCBiZSBzZWFyY2hlZFxyXG4gICAgICBjb25zdCBmYWxsYmFja0xvY2FsZXMgPSBbXHJcbiAgICAgICAgcGhldC5jaGlwcGVyLmxvY2FsZSxcclxuICAgICAgICAuLi4oIHBoZXQuY2hpcHBlci5sb2NhbGVEYXRhWyBwaGV0LmNoaXBwZXIubG9jYWxlIF0/LmZhbGxiYWNrTG9jYWxlcyB8fCBbXSApLFxyXG4gICAgICAgICggcGhldC5jaGlwcGVyLmxvY2FsZSAhPT0gJ2VuJyA/IFsgJ2VuJyBdIDogW10gKVxyXG4gICAgICBdO1xyXG5cclxuICAgICAgbGV0IHN0cmluZ01hcCA9IG51bGw7XHJcblxyXG4gICAgICBmb3IgKCBjb25zdCBsb2NhbGUgb2YgZmFsbGJhY2tMb2NhbGVzICkge1xyXG4gICAgICAgIHN0cmluZ01hcCA9IHBoZXQuY2hpcHBlci5zdHJpbmdzWyBsb2NhbGUgXTtcclxuICAgICAgICBpZiAoIHN0cmluZ01hcCApIHtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHBoZXQuY2hpcHBlci5tYXBTdHJpbmcoIHN0cmluZ01hcFsga2V5IF0gKTtcclxuICAgIH07XHJcbiAgfSgpICk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFV0aWxpdHkgZnVuY3Rpb24gdG8gcGF1c2Ugc3luY2hyb25vdXNseSBmb3IgdGhlIGdpdmVuIG51bWJlciBvZiBtaWxsaXNlY29uZHMuXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1pbGxpcyAtIGFtb3VudCBvZiB0aW1lIHRvIHBhdXNlIHN5bmNocm9ub3VzbHlcclxuICAgKi9cclxuICBmdW5jdGlvbiBzbGVlcCggbWlsbGlzICkge1xyXG4gICAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICBsZXQgY3VyRGF0ZTtcclxuICAgIGRvIHtcclxuICAgICAgY3VyRGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICB9IHdoaWxlICggY3VyRGF0ZSAtIGRhdGUgPCBtaWxsaXMgKTtcclxuICB9XHJcblxyXG4gIC8qXHJcbiAgICogVGhlc2UgYXJlIHVzZWQgdG8gbWFrZSBzdXJlIG91ciBzaW1zIHN0aWxsIGJlaGF2ZSBwcm9wZXJseSB3aXRoIGFuIGFydGlmaWNpYWxseSBoaWdoZXIgbG9hZCAoc28gd2UgY2FuIHRlc3Qgd2hhdCBoYXBwZW5zXHJcbiAgICogYXQgMzBmcHMsIDVmcHMsIGV0YykuIFRoZXJlIHRlbmQgdG8gYmUgYnVncyB0aGF0IG9ubHkgaGFwcGVuIG9uIGxlc3MtcG93ZXJmdWwgZGV2aWNlcywgYW5kIHRoZXNlIGZ1bmN0aW9ucyBmYWNpbGl0YXRlXHJcbiAgICogdGVzdGluZyBhIHNpbSBmb3Igcm9idXN0bmVzcywgYW5kIGFsbG93aW5nIG90aGVycyB0byByZXByb2R1Y2Ugc2xvdy1iZWhhdmlvciBidWdzLlxyXG4gICAqL1xyXG4gIHdpbmRvdy5waGV0LmNoaXBwZXIubWFrZUV2ZXJ5dGhpbmdTbG93ID0gZnVuY3Rpb24oKSB7XHJcbiAgICB3aW5kb3cuc2V0SW50ZXJ2YWwoICgpID0+IHsgc2xlZXAoIDY0ICk7IH0sIDE2ICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYmFkLXNpbS10ZXh0XHJcbiAgfTtcclxuICB3aW5kb3cucGhldC5jaGlwcGVyLm1ha2VSYW5kb21TbG93bmVzcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgd2luZG93LnNldEludGVydmFsKCAoKSA9PiB7IHNsZWVwKCBNYXRoLmNlaWwoIDEwMCArIE1hdGgucmFuZG9tKCkgKiAyMDAgKSApOyB9LCBNYXRoLmNlaWwoIDEwMCArIE1hdGgucmFuZG9tKCkgKiAyMDAgKSApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJhZC1zaW0tdGV4dFxyXG4gIH07XHJcblxyXG4gIC8vIEFyZSB3ZSBydW5uaW5nIGEgYnVpbHQgaHRtbCBmaWxlP1xyXG4gIHdpbmRvdy5waGV0LmNoaXBwZXIuaXNQcm9kdWN0aW9uID0gJCggJ21ldGFbbmFtZT1waGV0LXNpbS1sZXZlbF0nICkuYXR0ciggJ2NvbnRlbnQnICkgPT09ICdwcm9kdWN0aW9uJztcclxuXHJcbiAgLy8gQXJlIHdlIHJ1bm5pbmcgaW4gYW4gYXBwP1xyXG4gIHdpbmRvdy5waGV0LmNoaXBwZXIuaXNBcHAgPSBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzWyAncGhldC1hcHAnIF0gfHwgcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVyc1sgJ3BoZXQtYW5kcm9pZC1hcHAnIF07XHJcblxyXG4gIC8qKlxyXG4gICAqIEFuIElJRkUgaGVyZSBoZWxwcyBjYXB0dXJlIHZhcmlhYmxlcyBpbiBmaW5hbCBsb2dpYyBuZWVkZWQgaW4gdGhlIGdsb2JhbCwgcHJlbG9hZCBzY29wZSBmb3IgdGhlIHBoZXRzaW0gZW52aXJvbm1lbnQuXHJcbiAgICpcclxuICAgKiBFbmFibGVzIG9yIGRpc2FibGVzIGFzc2VydGlvbnMgaW4gY29tbW9uIGxpYnJhcmllcyB1c2luZyBxdWVyeSBwYXJhbWV0ZXJzLlxyXG4gICAqIFRoZXJlIGFyZSB0d28gdHlwZXMgb2YgYXNzZXJ0aW9uczogYmFzaWMgYW5kIHNsb3cuIEVuYWJsaW5nIHNsb3cgYXNzZXJ0aW9ucyB3aWxsIGFkdmVyc2VseSBpbXBhY3QgcGVyZm9ybWFuY2UuXHJcbiAgICogJ2VhJyBlbmFibGVzIGJhc2ljIGFzc2VydGlvbnMsICdlYWxsJyBlbmFibGVzIGJhc2ljIGFuZCBzbG93IGFzc2VydGlvbnMuXHJcbiAgICogTXVzdCBiZSBydW4gYmVmb3JlIHRoZSBtYWluIG1vZHVsZXMsIGFuZCBhc3N1bWVzIHRoYXQgYXNzZXJ0LmpzIGFuZCBxdWVyeS1wYXJhbWV0ZXJzLmpzIGhhcyBiZWVuIHJ1bi5cclxuICAgKi9cclxuICAoIGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIC8vIGVuYWJsZXMgYWxsIGFzc2VydGlvbnMgKGJhc2ljIGFuZCBzbG93KVxyXG4gICAgY29uc3QgZW5hYmxlQWxsQXNzZXJ0aW9ucyA9ICFwaGV0LmNoaXBwZXIuaXNQcm9kdWN0aW9uICYmIHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuZWFsbDtcclxuXHJcbiAgICAvLyBlbmFibGVzIGJhc2ljIGFzc2VydGlvbnNcclxuICAgIGNvbnN0IGVuYWJsZUJhc2ljQXNzZXJ0aW9ucyA9IGVuYWJsZUFsbEFzc2VydGlvbnMgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICggIXBoZXQuY2hpcHBlci5pc1Byb2R1Y3Rpb24gJiYgcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5lYSApIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaGV0LmNoaXBwZXIuaXNEZWJ1Z0J1aWxkO1xyXG5cclxuICAgIGlmICggZW5hYmxlQmFzaWNBc3NlcnRpb25zICkge1xyXG4gICAgICB3aW5kb3cuYXNzZXJ0aW9ucy5lbmFibGVBc3NlcnQoKTtcclxuICAgIH1cclxuICAgIGlmICggZW5hYmxlQWxsQXNzZXJ0aW9ucyApIHtcclxuICAgICAgd2luZG93LmFzc2VydGlvbnMuZW5hYmxlQXNzZXJ0U2xvdygpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2VuZHMgYSBtZXNzYWdlIHRvIGEgY29udGludW91cyB0ZXN0aW5nIGNvbnRhaW5lci5cclxuICAgICAqIEBwdWJsaWNcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gU3BlY2lmaWMgb2JqZWN0IHJlc3VsdHMgc2VudCB0byBDVC5cclxuICAgICAqL1xyXG4gICAgd2luZG93LnBoZXQuY2hpcHBlci5yZXBvcnRDb250aW51b3VzVGVzdFJlc3VsdCA9IG9wdGlvbnMgPT4ge1xyXG4gICAgICB3aW5kb3cucGFyZW50ICYmIHdpbmRvdy5wYXJlbnQucG9zdE1lc3NhZ2UoIEpTT04uc3RyaW5naWZ5KCBfLmFzc2lnbkluKCB7XHJcbiAgICAgICAgY29udGludW91c1Rlc3Q6IEpTT04ucGFyc2UoIHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuY29udGludW91c1Rlc3QgKSxcclxuICAgICAgICB1cmw6IHdpbmRvdy5sb2NhdGlvbi5ocmVmXHJcbiAgICAgIH0sIG9wdGlvbnMgKSApLCAnKicgKTtcclxuICAgIH07XHJcblxyXG4gICAgaWYgKCBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmNvbnRpbnVvdXNUZXN0ICkge1xyXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ2Vycm9yJywgYSA9PiB7XHJcbiAgICAgICAgbGV0IG1lc3NhZ2UgPSAnJztcclxuICAgICAgICBsZXQgc3RhY2sgPSAnJztcclxuICAgICAgICBpZiAoIGEgJiYgYS5tZXNzYWdlICkge1xyXG4gICAgICAgICAgbWVzc2FnZSA9IGEubWVzc2FnZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBhICYmIGEuZXJyb3IgJiYgYS5lcnJvci5zdGFjayApIHtcclxuICAgICAgICAgIHN0YWNrID0gYS5lcnJvci5zdGFjaztcclxuICAgICAgICB9XHJcbiAgICAgICAgcGhldC5jaGlwcGVyLnJlcG9ydENvbnRpbnVvdXNUZXN0UmVzdWx0KCB7XHJcbiAgICAgICAgICB0eXBlOiAnY29udGludW91cy10ZXN0LWVycm9yJyxcclxuICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXHJcbiAgICAgICAgICBzdGFjazogc3RhY2tcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH0gKTtcclxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdiZWZvcmV1bmxvYWQnLCBlID0+IHtcclxuICAgICAgICBwaGV0LmNoaXBwZXIucmVwb3J0Q29udGludW91c1Rlc3RSZXN1bHQoIHtcclxuICAgICAgICAgIHR5cGU6ICdjb250aW51b3VzLXRlc3QtdW5sb2FkJ1xyXG4gICAgICAgIH0gKTtcclxuICAgICAgfSApO1xyXG4gICAgICAvLyB3aW5kb3cub3BlbiBzdHViLiBvdGhlcndpc2Ugd2UgZ2V0IHRvbnMgb2YgXCJSZXBvcnQgUHJvYmxlbS4uLlwiIHBvcHVwcyB0aGF0IHN0YWxsXHJcbiAgICAgIHdpbmRvdy5vcGVuID0gKCkgPT4ge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBmb2N1czogKCkgPT4ge30sXHJcbiAgICAgICAgICBibHVyOiAoKSA9PiB7fVxyXG4gICAgICAgIH07XHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ29tbXVuaWNhdGUgc2ltIGVycm9ycyB0byBDVCBvciBvdGhlciBsaXN0ZW5pbmcgcGFyZW50IGZyYW1lc1xyXG4gICAgaWYgKCBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLnBvc3RNZXNzYWdlT25FcnJvciApIHtcclxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdlcnJvcicsIGEgPT4ge1xyXG4gICAgICAgIGxldCBtZXNzYWdlID0gJyc7XHJcbiAgICAgICAgbGV0IHN0YWNrID0gJyc7XHJcbiAgICAgICAgaWYgKCBhICYmIGEubWVzc2FnZSApIHtcclxuICAgICAgICAgIG1lc3NhZ2UgPSBhLm1lc3NhZ2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggYSAmJiBhLmVycm9yICYmIGEuZXJyb3Iuc3RhY2sgKSB7XHJcbiAgICAgICAgICBzdGFjayA9IGEuZXJyb3Iuc3RhY2s7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdpbmRvdy5wYXJlbnQgJiYgd2luZG93LnBhcmVudC5wb3N0TWVzc2FnZSggSlNPTi5zdHJpbmdpZnkoIHtcclxuICAgICAgICAgIHR5cGU6ICdlcnJvcicsXHJcbiAgICAgICAgICB1cmw6IHdpbmRvdy5sb2NhdGlvbi5ocmVmLFxyXG4gICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcclxuICAgICAgICAgIHN0YWNrOiBzdGFja1xyXG4gICAgICAgIH0gKSwgJyonICk7XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMucG9zdE1lc3NhZ2VPbkJlZm9yZVVubG9hZCApIHtcclxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdiZWZvcmV1bmxvYWQnLCBlID0+IHtcclxuICAgICAgICB3aW5kb3cucGFyZW50ICYmIHdpbmRvdy5wYXJlbnQucG9zdE1lc3NhZ2UoIEpTT04uc3RyaW5naWZ5KCB7XHJcbiAgICAgICAgICB0eXBlOiAnYmVmb3JlVW5sb2FkJ1xyXG4gICAgICAgIH0gKSwgJyonICk7XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuICB9KCkgKTtcclxuXHJcbiAgKCAoKSA9PiB7XHJcbiAgICAvLyBWYWxpZGF0aW9uIGxvZ2ljIG9uIHRoZSBzaW1GZWF0dXJlcyBzZWN0aW9uIG9mIHRoZSBwYWNrYWdlSlNPTiwgbWFueSBvZiB3aGljaCBhcmUgdXNlZCBpbiBzaW1zLCBhbmQgc2hvdWxkIGJlXHJcbiAgICAvLyBkZWZpbmVkIGNvcnJlY3RseSBmb3IgdGhlIHNpbSB0byBydW4uXHJcblxyXG4gICAgY29uc3Qgc2ltRmVhdHVyZXNTY2hlbWEgPSB7XHJcbiAgICAgIHN1cHBvcnRzSW50ZXJhY3RpdmVEZXNjcmlwdGlvbjogeyB0eXBlOiAnYm9vbGVhbicgfSxcclxuICAgICAgc3VwcG9ydHNWb2ljaW5nOiB7IHR5cGU6ICdib29sZWFuJyB9LFxyXG4gICAgICBzdXBwb3J0c0ludGVyYWN0aXZlSGlnaGxpZ2h0czogeyB0eXBlOiAnYm9vbGVhbicgfSxcclxuICAgICAgc3VwcG9ydHNEZXNjcmlwdGlvblBsdWdpbjogeyB0eXBlOiAnYm9vbGVhbicgfSxcclxuICAgICAgc3VwcG9ydHNTb3VuZDogeyB0eXBlOiAnYm9vbGVhbicgfSxcclxuICAgICAgc3VwcG9ydHNFeHRyYVNvdW5kOiB7IHR5cGU6ICdib29sZWFuJyB9LFxyXG4gICAgICBzdXBwb3J0c0R5bmFtaWNMb2NhbGU6IHsgdHlwZTogJ2Jvb2xlYW4nIH0sXHJcbiAgICAgIGNvbG9yUHJvZmlsZXM6IHsgdHlwZTogJ2FycmF5JyB9LFxyXG4gICAgICBzdXBwb3J0ZWRSZWdpb25zQW5kQ3VsdHVyZXM6IHsgdHlwZTogJ2FycmF5JyB9LFxyXG4gICAgICBkZWZhdWx0UmVnaW9uQW5kQ3VsdHVyZTogeyB0eXBlOiAnc3RyaW5nJyB9LFxyXG4gICAgICBzdHJpY3RBeG9uRGVwZW5kZW5jaWVzOiB7IHR5cGU6ICdib29sZWFuJyB9XHJcbiAgICB9O1xyXG5cclxuICAgIE9iamVjdC5rZXlzKCBzaW1GZWF0dXJlc1NjaGVtYSApLmZvckVhY2goIHNjaGVtYUtleSA9PiB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoICFwYWNrYWdlUGhldC5oYXNPd25Qcm9wZXJ0eSggc2NoZW1hS2V5ICksXHJcbiAgICAgICAgYCR7c2NoZW1hS2V5fSBpcyBhIHNpbSBmZWF0dXJlIGFuZCBzaG91bGQgYmUgaW4gXCJzaW1GZWF0dXJlc1wiIGluIHRoZSBwYWNrYWdlLmpzb25gICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIXBhY2thZ2VPYmplY3QuaGFzT3duUHJvcGVydHkoICdzaW1GZWF0dXJlcycgKSwgJ3NpbUZlYXR1cmVzIG11c3QgYmUgbmVzdGVkIHVuZGVyIFxcJ3BoZXRcXCcnICk7XHJcbiAgICBpZiAoIHBhY2thZ2VQaGV0Lmhhc093blByb3BlcnR5KCAnc2ltRmVhdHVyZXMnICkgKSB7XHJcbiAgICAgIGNvbnN0IHNpbUZlYXR1cmVzID0gcGFja2FnZVBoZXQuc2ltRmVhdHVyZXM7XHJcbiAgICAgIE9iamVjdC5rZXlzKCBzaW1GZWF0dXJlcyApLmZvckVhY2goIHNpbUZlYXR1cmVOYW1lID0+IHtcclxuICAgICAgICBjb25zdCBzaW1GZWF0dXJlVmFsdWUgPSBzaW1GZWF0dXJlc1sgc2ltRmVhdHVyZU5hbWUgXTtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBzaW1GZWF0dXJlc1NjaGVtYS5oYXNPd25Qcm9wZXJ0eSggc2ltRmVhdHVyZU5hbWUgKSwgYHVuc3VwcG9ydGVkIHNpbSBmZWF0dXJlOiAke3NpbUZlYXR1cmVOYW1lfWAgKTtcclxuICAgICAgICBpZiAoIHNpbUZlYXR1cmVzU2NoZW1hWyBzaW1GZWF0dXJlTmFtZSBdICkge1xyXG5cclxuICAgICAgICAgIGlmICggc2ltRmVhdHVyZXNTY2hlbWFbIHNpbUZlYXR1cmVOYW1lLnR5cGUgXSA9PT0gJ2Jvb2xlYW4nICkge1xyXG4gICAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2Ygc2ltRmVhdHVyZVZhbHVlID09PSAnYm9vbGVhbicsIGBib29sZWFuIHZhbHVlIGV4cGVjdGVkIGZvciAke3NpbUZlYXR1cmVOYW1lfWAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2UgaWYgKCBzaW1GZWF0dXJlc1NjaGVtYVsgc2ltRmVhdHVyZU5hbWUudHlwZSBdID09PSAnYXJyYXknICkge1xyXG4gICAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBBcnJheS5pc0FycmF5KCBzaW1GZWF0dXJlVmFsdWUgKSwgYGFycmF5IHZhbHVlIGV4cGVjdGVkIGZvciAke3NpbUZlYXR1cmVOYW1lfWAgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEF0IHRoaXMgdGltZSwgYWxsIGFycmF5cyBhcmUgYXNzdW1lZCB0byBvbmx5IHN1cHBvcnQgc3RyaW5nc1xyXG4gICAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBfLmV2ZXJ5KCBzaW1GZWF0dXJlVmFsdWUsIHZhbHVlID0+IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgKSwgYHN0cmluZyBlbnRyeSBleHBlY3RlZCBmb3IgJHtzaW1GZWF0dXJlTmFtZX1gICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcbiAgfSApKCk7XHJcbn0oKSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNFLGFBQVc7RUFHWEEsTUFBTSxJQUFJQSxNQUFNLENBQUVDLE1BQU0sQ0FBQ0Msa0JBQWtCLEVBQUUsd0VBQXlFLENBQUM7O0VBRXZIO0VBQ0EsTUFBTUMsYUFBYSxHQUFHQyxDQUFDLENBQUNDLEtBQUssQ0FBRUosTUFBTSxFQUFFLDRCQUE2QixDQUFDLEdBQUdLLElBQUksQ0FBQ0MsT0FBTyxDQUFDSixhQUFhLEdBQUcsQ0FBQyxDQUFDO0VBQ3ZHLE1BQU1LLFdBQVcsR0FBR0wsYUFBYSxDQUFDRyxJQUFJLElBQUksQ0FBQyxDQUFDOztFQUU1QztFQUNBLE1BQU1HLG9CQUFvQixHQUFHTCxDQUFDLENBQUNDLEtBQUssQ0FBRUosTUFBTSxFQUFFLG1DQUFvQyxDQUFDLEdBQUdLLElBQUksQ0FBQ0MsT0FBTyxDQUFDRSxvQkFBb0IsR0FBRyxJQUFJOztFQUU5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