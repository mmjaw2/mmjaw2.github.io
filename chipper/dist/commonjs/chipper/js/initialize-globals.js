"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
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
(function (_packagePhet$simFeatu, _packagePhet$simFeatu2, _packagePhet$simFeatu3, _packagePhet$simFeatu4) {
  assert && assert(window.QueryStringMachine, 'QueryStringMachine is used, and should be loaded before this code runs');

  // packageObject may not always be available if initialize-globals used without chipper-initialization.js
  var packageObject = _.hasIn(window, 'phet.chipper.packageObject') ? phet.chipper.packageObject : {};
  var packagePhet = packageObject.phet || {};

  // Not all runtimes will have this flag, so be graceful
  var allowLocaleSwitching = _.hasIn(window, 'phet.chipper.allowLocaleSwitching') ? phet.chipper.allowLocaleSwitching : true;

  // duck type defaults so that not all package.json files need to have a phet.simFeatures section.
  var packageSimFeatures = packagePhet.simFeatures || {};

  // The color profile used by default, if no colorProfiles are specified in package.json.
  // NOTE: Duplicated in SceneryConstants.js since scenery does not include initialize-globals.js
  var DEFAULT_COLOR_PROFILE = 'default';

  // The possible color profiles for the current simulation.
  var colorProfiles = packageSimFeatures.colorProfiles || [DEFAULT_COLOR_PROFILE];

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
  var QUERY_PARAMETERS_SCHEMA = {
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
      "public": true
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
      "public": true
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
      "public": false
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
      "public": true
    },
    /**
     * enables debugger commands in certain cases like thrown errors and failed tests.
     */
    "debugger": {
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
      "public": true
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
      isValidValue: function isValidValue(value) {
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
      "public": true
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
      "public": true
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
      "public": true
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
      "public": false
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
      "public": false
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
      "public": true,
      type: 'string',
      defaultValue: (_packagePhet$simFeatu = packagePhet === null || packagePhet === void 0 ? void 0 : (_packagePhet$simFeatu2 = packagePhet.simFeatures) === null || _packagePhet$simFeatu2 === void 0 ? void 0 : _packagePhet$simFeatu2.defaultRegionAndCulture) !== null && _packagePhet$simFeatu !== void 0 ? _packagePhet$simFeatu : 'usa',
      validValues: (_packagePhet$simFeatu3 = packagePhet === null || packagePhet === void 0 ? void 0 : (_packagePhet$simFeatu4 = packagePhet.simFeatures) === null || _packagePhet$simFeatu4 === void 0 ? void 0 : _packagePhet$simFeatu4.supportedRegionsAndCultures) !== null && _packagePhet$simFeatu3 !== void 0 ? _packagePhet$simFeatu3 : ['usa'] // default value must be in validValues
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
      isValidValue: function isValidValue(value) {
        // screen indices cannot be duplicated
        return value === null || value.length === _.uniq(value).length && value.length > 0;
      },
      "public": true
    },
    /**
     * Typically used to show answers (or hidden controls that show answers) to challenges in sim games.
     * For internal use by PhET team members only.
     */
    showAnswers: {
      type: 'flag',
      "private": true
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
      isValidValue: function isValidValue(value) {
        // NOTE: this regular expression must be maintained in TinyEmitter.ts as well.
        var regex = /random(?:%28|\()(\d+)(?:%29|\))/;
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
      isValidValue: function isValidValue(value) {
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
      "public": true
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
      "public": true,
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
      "public": true
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
    window.phet.chipper.isFuzzEnabled = function () {
      return window.phet.chipper.queryParameters.fuzz || window.phet.chipper.queryParameters.fuzzMouse || window.phet.chipper.queryParameters.fuzzTouch || window.phet.chipper.queryParameters.fuzzBoard;
    };

    // Add a log function that displays messages to the console. Examples:
    // phet.log && phet.log( 'You win!' );
    // phet.log && phet.log( 'You lose', { color: 'red' } );
    if (window.phet.chipper.queryParameters.log) {
      window.phet.log = function (message, options) {
        options = _.assignIn({
          color: '#009900' // green
        }, options);
        console.log("%c".concat(message), "color: ".concat(options.color)); // green
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
    var stringTest = typeof window !== 'undefined' && phet.chipper.queryParameters.stringTest ? phet.chipper.queryParameters.stringTest : null;

    /**
     * Maps an input string to a final string, accommodating tricks like doubleStrings.
     * This function is used to modify all strings in a sim when the stringTest query parameter is used.
     * The stringTest query parameter and its options are documented in the query parameter docs above.
     * It is used in string.js and sim.html.
     * @param string - the string to be mapped
     * @returns {string}
     */
    window.phet.chipper.mapString = function (string) {
      var script = 'script';
      return stringTest === null ? string : stringTest === 'double' ? "".concat(string, ":").concat(string) : stringTest === 'long' ? '12345678901234567890123456789012345678901234567890' : stringTest === 'rtl' ? "\u202B\u062A\u0633\u062A (\u0632\u0628\u0627\u0646)\u202C" : stringTest === 'xss' ? "".concat(string, "<img src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2NkYGD4DwABCQEBtxmN7wAAAABJRU5ErkJggg==\" onload=\"window.location.href=atob('aHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1kUXc0dzlXZ1hjUQ==')\" />") : stringTest === 'xss2' ? "".concat(string, "<").concat(script, ">alert('XSS')</").concat(script, ">") : stringTest === 'none' ? string : stringTest === 'dynamic' ? string :
      // In the fallback case, supply whatever string was given in the query parameter value
      stringTest;
    };

    // We will need to check for locale validity (once we have localeData loaded, if running unbuilt), and potentially
    // either fall back to `en`, or remap from 3-character locales to our locale keys.
    phet.chipper.checkAndRemapLocale = function () {
      // We need both to proceed. Provided as a global, so we can call it from load-unbuilt-strings
      // (IF initialize-globals loads first)
      if (!phet.chipper.localeData || !phet.chipper.locale) {
        return;
      }
      var locale = phet.chipper.locale;
      if (locale) {
        if (locale.length < 5) {
          locale = locale.toLowerCase();
        } else {
          locale = locale.replace(/-/, '_');
          var parts = locale.split('_');
          if (parts.length === 2) {
            locale = parts[0].toLowerCase() + '_' + parts[1].toUpperCase();
          }
        }
        if (locale.length === 3) {
          for (var _i = 0, _Object$keys = Object.keys(phet.chipper.localeData); _i < _Object$keys.length; _i++) {
            var candidateLocale = _Object$keys[_i];
            if (phet.chipper.localeData[candidateLocale].locale3 === locale) {
              locale = candidateLocale;
              break;
            }
          }
        }
      }
      if (!phet.chipper.localeData[locale]) {
        var badLocale = phet.chipper.queryParameters.locale;
        var isPair = /^[a-z]{2}$/.test(badLocale);
        var isTriple = /^[a-z]{3}$/.test(badLocale);
        var isPair_PAIR = /^[a-z]{2}_[A-Z]{2}$/.test(badLocale);
        if (!isPair && !isTriple && !isPair_PAIR) {
          QueryStringMachine.addWarning('locale', phet.chipper.queryParameters.locale, "Invalid locale format received: ".concat(badLocale, ". ?locale query parameter accepts the following formats: \"xx\" for ISO-639-1, \"xx_XX\" for ISO-639-1 and a 2-letter country code, \"xxx\" for ISO-639-2"));
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
    var stringOverrides = JSON.parse(phet.chipper.queryParameters.strings || '{}');

    /**
     * Get a string given the key. This implementation is meant for use only in the build sim. For more info see the
     * string plugin.
     * @param {string} key - like "REPO/string.key.here" which includes the requirejsNamespace, which is specified in package.json
     * @returns {string}
     */
    phet.chipper.getStringForBuiltSim = function (key) {
      var _phet$chipper$localeD;
      assert && assert(!!phet.chipper.isProduction, 'expected to be running a built sim');
      assert && assert(!!phet.chipper.strings, 'phet.chipper.strings should be filled out by initialization script');
      assert && assert(!!phet.chipper.locale, 'locale is required to look up the correct strings');

      // override strings via the 'strings' query parameter
      if (stringOverrides[key]) {
        return stringOverrides[key];
      }

      // Get a list of locales in the order they should be searched
      var fallbackLocales = [phet.chipper.locale].concat(_toConsumableArray(((_phet$chipper$localeD = phet.chipper.localeData[phet.chipper.locale]) === null || _phet$chipper$localeD === void 0 ? void 0 : _phet$chipper$localeD.fallbackLocales) || []), [phet.chipper.locale !== 'en' ? ['en'] : []]);
      var stringMap = null;
      var _iterator = _createForOfIteratorHelper(fallbackLocales),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var locale = _step.value;
          stringMap = phet.chipper.strings[locale];
          if (stringMap) {
            break;
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      return phet.chipper.mapString(stringMap[key]);
    };
  })();

  /**
   * Utility function to pause synchronously for the given number of milliseconds.
   * @param {number} millis - amount of time to pause synchronously
   */
  function sleep(millis) {
    var date = new Date();
    var curDate;
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
    window.setInterval(function () {
      sleep(64);
    }, 16); // eslint-disable-line bad-sim-text
  };
  window.phet.chipper.makeRandomSlowness = function () {
    window.setInterval(function () {
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
    var enableAllAssertions = !phet.chipper.isProduction && phet.chipper.queryParameters.eall;

    // enables basic assertions
    var enableBasicAssertions = enableAllAssertions || !phet.chipper.isProduction && phet.chipper.queryParameters.ea || phet.chipper.isDebugBuild;
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
    window.phet.chipper.reportContinuousTestResult = function (options) {
      window.parent && window.parent.postMessage(JSON.stringify(_.assignIn({
        continuousTest: JSON.parse(phet.chipper.queryParameters.continuousTest),
        url: window.location.href
      }, options)), '*');
    };
    if (phet.chipper.queryParameters.continuousTest) {
      window.addEventListener('error', function (a) {
        var message = '';
        var stack = '';
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
      window.addEventListener('beforeunload', function (e) {
        phet.chipper.reportContinuousTestResult({
          type: 'continuous-test-unload'
        });
      });
      // window.open stub. otherwise we get tons of "Report Problem..." popups that stall
      window.open = function () {
        return {
          focus: function focus() {},
          blur: function blur() {}
        };
      };
    }

    // Communicate sim errors to CT or other listening parent frames
    if (phet.chipper.queryParameters.postMessageOnError) {
      window.addEventListener('error', function (a) {
        var message = '';
        var stack = '';
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
      window.addEventListener('beforeunload', function (e) {
        window.parent && window.parent.postMessage(JSON.stringify({
          type: 'beforeUnload'
        }), '*');
      });
    }
  })();
  (function () {
    // Validation logic on the simFeatures section of the packageJSON, many of which are used in sims, and should be
    // defined correctly for the sim to run.

    var simFeaturesSchema = {
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
    Object.keys(simFeaturesSchema).forEach(function (schemaKey) {
      assert && assert(!packagePhet.hasOwnProperty(schemaKey), "".concat(schemaKey, " is a sim feature and should be in \"simFeatures\" in the package.json"));
    });
    assert && assert(!packageObject.hasOwnProperty('simFeatures'), 'simFeatures must be nested under \'phet\'');
    if (packagePhet.hasOwnProperty('simFeatures')) {
      var simFeatures = packagePhet.simFeatures;
      Object.keys(simFeatures).forEach(function (simFeatureName) {
        var simFeatureValue = simFeatures[simFeatureName];
        assert && assert(simFeaturesSchema.hasOwnProperty(simFeatureName), "unsupported sim feature: ".concat(simFeatureName));
        if (simFeaturesSchema[simFeatureName]) {
          if (simFeaturesSchema[simFeatureName.type] === 'boolean') {
            assert && assert(typeof simFeatureValue === 'boolean', "boolean value expected for ".concat(simFeatureName));
          } else if (simFeaturesSchema[simFeatureName.type] === 'array') {
            assert && assert(Array.isArray(simFeatureValue), "array value expected for ".concat(simFeatureName));

            // At this time, all arrays are assumed to only support strings
            assert && assert(_.every(simFeatureValue, function (value) {
              return typeof value === 'string';
            }), "string entry expected for ".concat(simFeatureName));
          }
        }
      });
    }
  })();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcGFja2FnZVBoZXQkc2ltRmVhdHUiLCJfcGFja2FnZVBoZXQkc2ltRmVhdHUyIiwiX3BhY2thZ2VQaGV0JHNpbUZlYXR1MyIsIl9wYWNrYWdlUGhldCRzaW1GZWF0dTQiLCJhc3NlcnQiLCJ3aW5kb3ciLCJRdWVyeVN0cmluZ01hY2hpbmUiLCJwYWNrYWdlT2JqZWN0IiwiXyIsImhhc0luIiwicGhldCIsImNoaXBwZXIiLCJwYWNrYWdlUGhldCIsImFsbG93TG9jYWxlU3dpdGNoaW5nIiwicGFja2FnZVNpbUZlYXR1cmVzIiwic2ltRmVhdHVyZXMiLCJERUZBVUxUX0NPTE9SX1BST0ZJTEUiLCJjb2xvclByb2ZpbGVzIiwiUVVFUllfUEFSQU1FVEVSU19TQ0hFTUEiLCJhbGxvd0xpbmtzIiwidHlwZSIsImRlZmF1bHRWYWx1ZSIsImF1ZGlvIiwidmFsaWRWYWx1ZXMiLCJiaW5kZXIiLCJicmFuZCIsImJ1aWxkQ29tcGF0aWJsZSIsImNoaWxkTGltaXQiLCJOdW1iZXIiLCJQT1NJVElWRV9JTkZJTklUWSIsImNvbnRpbnVvdXNUZXN0IiwiY29sb3JQcm9maWxlIiwiZGVwcmVjYXRpb25XYXJuaW5ncyIsImRldiIsImRpc2FibGVNb2RhbHMiLCJlYSIsImVhbGwiLCJleHRyYVNvdW5kSW5pdGlhbGx5RW5hYmxlZCIsImZvcmNlU1ZHUmVmcmVzaCIsImZ1enoiLCJmdXp6Qm9hcmQiLCJmdXp6TW91c2UiLCJmdXp6UG9pbnRlcnMiLCJmdXp6VG91Y2giLCJmdXp6UmF0ZSIsImlzVmFsaWRWYWx1ZSIsInZhbHVlIiwiZ2E0IiwiZ2FtZVVwIiwiZ2FtZVVwVGVzdEhhcm5lc3MiLCJnYW1lVXBMb2dnaW5nIiwiZ2FQYWdlIiwiaG9tZVNjcmVlbiIsImluaXRpYWxTY3JlZW4iLCJsZWdlbmRzT2ZMZWFybmluZyIsImxpc3RlbmVyTGltaXQiLCJsb2NhbGUiLCJsb2NhbGVzIiwiZWxlbWVudFNjaGVtYSIsInN1cHBvcnRzRHluYW1pY0xvY2FsZSIsImhhc093blByb3BlcnR5IiwibG9nIiwibWVtb3J5TGltaXQiLCJtb2JpbGVBMTF5VGVzdCIsInBhcmVudExpbWl0IiwicGxheWJhY2tNb2RlIiwicG9zdE1lc3NhZ2VPbkJlZm9yZVVubG9hZCIsInBvc3RNZXNzYWdlT25FcnJvciIsInBvc3RNZXNzYWdlT25Mb2FkIiwicG9zdE1lc3NhZ2VPblJlYWR5IiwicHJlc2VydmVEcmF3aW5nQnVmZmVyIiwicHJldmVudEZ1bGxTY3JlZW4iLCJwcm9maWxlciIsInFyQ29kZSIsInJhbmRvbVNlZWQiLCJNYXRoIiwicmFuZG9tIiwicmVnaW9uQW5kQ3VsdHVyZSIsImRlZmF1bHRSZWdpb25BbmRDdWx0dXJlIiwic3VwcG9ydGVkUmVnaW9uc0FuZEN1bHR1cmVzIiwicm9vdFJlbmRlcmVyIiwic2NlbmVyeUxvZyIsInNjZW5lcnlTdHJpbmdMb2ciLCJzY3JlZW5zIiwiaXNJbnRlZ2VyIiwibGVuZ3RoIiwidW5pcSIsInNob3dBbnN3ZXJzIiwic2hvd0NhbnZhc05vZGVCb3VuZHMiLCJzaG93Rml0dGVkQmxvY2tCb3VuZHMiLCJzaG93SGl0QXJlYXMiLCJzaG93UG9pbnRlckFyZWFzIiwic2hvd1BvaW50ZXJzIiwic2hvd1Zpc2libGVCb3VuZHMiLCJzdHJpY3RBeG9uRGVwZW5kZW5jaWVzIiwibGlzdGVuZXJPcmRlciIsInJlZ2V4IiwibWF0Y2giLCJzcGVlY2hTeW50aGVzaXNGcm9tUGFyZW50Iiwic3BlZWQiLCJzdHJpbmdzIiwic3RyaW5nVGVzdCIsImtleWJvYXJkTG9jYWxlU3dpdGNoZXIiLCJzdXBwb3J0c0Rlc2NyaXB0aW9uUGx1Z2luIiwic3VwcG9ydHNJbnRlcmFjdGl2ZURlc2NyaXB0aW9uIiwic3VwcG9ydHNJbnRlcmFjdGl2ZUhpZ2hsaWdodHMiLCJpbnRlcmFjdGl2ZUhpZ2hsaWdodHNJbml0aWFsbHlFbmFibGVkIiwic3VwcG9ydHNHZXN0dXJlQ29udHJvbCIsInN1cHBvcnRzVm9pY2luZyIsInN3YXNoVGV4dCIsInN3YXNoVGV4dENvbG9yIiwidm9pY2luZ0luaXRpYWxseUVuYWJsZWQiLCJwcmVmZXJlbmNlc1N0b3JhZ2UiLCJwcmludFZvaWNpbmdSZXNwb25zZXMiLCJzdXBwb3J0c1BhbkFuZFpvb20iLCJzdXBwb3J0c1NvdW5kIiwic3VwcG9ydHNFeHRyYVNvdW5kIiwidmlicmF0aW9uUGFyYWRpZ20iLCJ3ZWJnbCIsInlvdHRhIiwicXVlcnlQYXJhbWV0ZXJzIiwiZ2V0QWxsIiwiaXNGdXp6RW5hYmxlZCIsIm1lc3NhZ2UiLCJvcHRpb25zIiwiYXNzaWduSW4iLCJjb2xvciIsImNvbnNvbGUiLCJjb25jYXQiLCJtYXBTdHJpbmciLCJzdHJpbmciLCJzY3JpcHQiLCJjaGVja0FuZFJlbWFwTG9jYWxlIiwibG9jYWxlRGF0YSIsInRvTG93ZXJDYXNlIiwicmVwbGFjZSIsInBhcnRzIiwic3BsaXQiLCJ0b1VwcGVyQ2FzZSIsIl9pIiwiX09iamVjdCRrZXlzIiwiT2JqZWN0Iiwia2V5cyIsImNhbmRpZGF0ZUxvY2FsZSIsImxvY2FsZTMiLCJiYWRMb2NhbGUiLCJpc1BhaXIiLCJ0ZXN0IiwiaXNUcmlwbGUiLCJpc1BhaXJfUEFJUiIsImFkZFdhcm5pbmciLCJjb250YWluc0tleSIsInN0cmluZ092ZXJyaWRlcyIsIkpTT04iLCJwYXJzZSIsImdldFN0cmluZ0ZvckJ1aWx0U2ltIiwia2V5IiwiX3BoZXQkY2hpcHBlciRsb2NhbGVEIiwiaXNQcm9kdWN0aW9uIiwiZmFsbGJhY2tMb2NhbGVzIiwiX3RvQ29uc3VtYWJsZUFycmF5Iiwic3RyaW5nTWFwIiwiX2l0ZXJhdG9yIiwiX2NyZWF0ZUZvck9mSXRlcmF0b3JIZWxwZXIiLCJfc3RlcCIsInMiLCJuIiwiZG9uZSIsImVyciIsImUiLCJmIiwic2xlZXAiLCJtaWxsaXMiLCJkYXRlIiwiRGF0ZSIsImN1ckRhdGUiLCJtYWtlRXZlcnl0aGluZ1Nsb3ciLCJzZXRJbnRlcnZhbCIsIm1ha2VSYW5kb21TbG93bmVzcyIsImNlaWwiLCIkIiwiYXR0ciIsImlzQXBwIiwiZW5hYmxlQWxsQXNzZXJ0aW9ucyIsImVuYWJsZUJhc2ljQXNzZXJ0aW9ucyIsImlzRGVidWdCdWlsZCIsImFzc2VydGlvbnMiLCJlbmFibGVBc3NlcnQiLCJlbmFibGVBc3NlcnRTbG93IiwicmVwb3J0Q29udGludW91c1Rlc3RSZXN1bHQiLCJwYXJlbnQiLCJwb3N0TWVzc2FnZSIsInN0cmluZ2lmeSIsInVybCIsImxvY2F0aW9uIiwiaHJlZiIsImFkZEV2ZW50TGlzdGVuZXIiLCJhIiwic3RhY2siLCJlcnJvciIsIm9wZW4iLCJmb2N1cyIsImJsdXIiLCJzaW1GZWF0dXJlc1NjaGVtYSIsImZvckVhY2giLCJzY2hlbWFLZXkiLCJzaW1GZWF0dXJlTmFtZSIsInNpbUZlYXR1cmVWYWx1ZSIsIkFycmF5IiwiaXNBcnJheSIsImV2ZXJ5Il0sInNvdXJjZXMiOlsiaW5pdGlhbGl6ZS1nbG9iYWxzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE1LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEluaXRpYWxpemVzIHBoZXQgZ2xvYmFscyB0aGF0IGFyZSB1c2VkIGJ5IGFsbCBzaW11bGF0aW9ucywgaW5jbHVkaW5nIGFzc2VydGlvbnMgYW5kIHF1ZXJ5LXBhcmFtZXRlcnMuXHJcbiAqIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldGNvbW1vbi9pc3N1ZXMvMjNcclxuICogVGhpcyBmaWxlIG11c3QgYmUgbG9hZGVkIGJlZm9yZSB0aGUgc2ltdWxhdGlvbiBpcyBzdGFydGVkIHVwLCBhbmQgdGhpcyBmaWxlIGNhbm5vdCBiZSBsb2FkZWQgYXMgYW4gQU1EIG1vZHVsZS5cclxuICogVGhlIGVhc2llc3Qgd2F5IHRvIGRvIHRoaXMgaXMgdmlhIGEgPHNjcmlwdD4gdGFnIGluIHlvdXIgSFRNTCBmaWxlLlxyXG4gKlxyXG4gKiBQaEVUIFNpbXVsYXRpb25zIGNhbiBiZSBsYXVuY2hlZCB3aXRoIHF1ZXJ5IHBhcmFtZXRlcnMgd2hpY2ggZW5hYmxlIGNlcnRhaW4gZmVhdHVyZXMuICBUbyB1c2UgYSBxdWVyeSBwYXJhbWV0ZXIsXHJcbiAqIHByb3ZpZGUgdGhlIGZ1bGwgVVJMIG9mIHRoZSBzaW11bGF0aW9uIGFuZCBhcHBlbmQgYSBxdWVzdGlvbiBtYXJrICg/KSB0aGVuIHRoZSBxdWVyeSBwYXJhbWV0ZXIgKGFuZCBvcHRpb25hbGx5IGl0c1xyXG4gKiB2YWx1ZSBhc3NpZ25tZW50KS4gIEZvciBpbnN0YW5jZTpcclxuICogaHR0cHM6Ly9waGV0LWRldi5jb2xvcmFkby5lZHUvaHRtbC9yZWFjdGFudHMtcHJvZHVjdHMtYW5kLWxlZnRvdmVycy8xLjAuMC1kZXYuMTMvcmVhY3RhbnRzLXByb2R1Y3RzLWFuZC1sZWZ0b3ZlcnNfZW4uaHRtbD9kZXZcclxuICpcclxuICogSGVyZSBpcyBhbiBleGFtcGxlIG9mIGEgdmFsdWUgYXNzaWdubWVudDpcclxuICogaHR0cHM6Ly9waGV0LWRldi5jb2xvcmFkby5lZHUvaHRtbC9yZWFjdGFudHMtcHJvZHVjdHMtYW5kLWxlZnRvdmVycy8xLjAuMC1kZXYuMTMvcmVhY3RhbnRzLXByb2R1Y3RzLWFuZC1sZWZ0b3ZlcnNfZW4uaHRtbD93ZWJnbD1mYWxzZVxyXG4gKlxyXG4gKiBUbyB1c2UgbXVsdGlwbGUgcXVlcnkgcGFyYW1ldGVycywgc3BlY2lmeSB0aGUgcXVlc3Rpb24gbWFyayBiZWZvcmUgdGhlIGZpcnN0IHF1ZXJ5IHBhcmFtZXRlciwgdGhlbiBhbXBlcnNhbmRzICgmKVxyXG4gKiBiZXR3ZWVuIG90aGVyIHF1ZXJ5IHBhcmFtZXRlcnMuICBIZXJlIGlzIGFuIGV4YW1wbGUgb2YgbXVsdGlwbGUgcXVlcnkgcGFyYW1ldGVyczpcclxuICogaHR0cHM6Ly9waGV0LWRldi5jb2xvcmFkby5lZHUvaHRtbC9yZWFjdGFudHMtcHJvZHVjdHMtYW5kLWxlZnRvdmVycy8xLjAuMC1kZXYuMTMvcmVhY3RhbnRzLXByb2R1Y3RzLWFuZC1sZWZ0b3ZlcnNfZW4uaHRtbD9kZXYmc2hvd1BvaW50ZXJBcmVhcyZ3ZWJnbD1mYWxzZVxyXG4gKlxyXG4gKiBGb3IgbW9yZSBvbiBxdWVyeSBwYXJhbWV0ZXJzIGluIGdlbmVyYWwsIHNlZSBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1F1ZXJ5X3N0cmluZ1xyXG4gKiBGb3IgZGV0YWlscyBvbiBjb21tb24tY29kZSBxdWVyeSBwYXJhbWV0ZXJzLCBzZWUgUVVFUllfUEFSQU1FVEVSU19TQ0hFTUEgYmVsb3cuXHJcbiAqIEZvciBzaW0tc3BlY2lmaWMgcXVlcnkgcGFyYW1ldGVycyAoaWYgdGhlcmUgYXJlIGFueSksIHNlZSAqUXVlcnlQYXJhbWV0ZXJzLmpzIGluIHRoZSBzaW11bGF0aW9uJ3MgcmVwb3NpdG9yeS5cclxuICpcclxuICogTWFueSBvZiB0aGVzZSBxdWVyeSBwYXJhbWV0ZXJzJyBqc2RvYyBpcyByZW5kZXJlZCBhbmQgdmlzaWJsZSBwdWJsaWNseSB0byBQaEVULWlPIGNsaWVudC4gVGhvc2Ugc2VjdGlvbnMgc2hvdWxkIGJlXHJcbiAqIG1hcmtlZCwgc2VlIHRvcCBsZXZlbCBjb21tZW50IGluIFBoZXRpb0NsaWVudC5qcyBhYm91dCBwcml2YXRlIHZzIHB1YmxpYyBkb2N1bWVudGF0aW9uXHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICovXHJcbiggZnVuY3Rpb24oKSB7XHJcblxyXG5cclxuICBhc3NlcnQgJiYgYXNzZXJ0KCB3aW5kb3cuUXVlcnlTdHJpbmdNYWNoaW5lLCAnUXVlcnlTdHJpbmdNYWNoaW5lIGlzIHVzZWQsIGFuZCBzaG91bGQgYmUgbG9hZGVkIGJlZm9yZSB0aGlzIGNvZGUgcnVucycgKTtcclxuXHJcbiAgLy8gcGFja2FnZU9iamVjdCBtYXkgbm90IGFsd2F5cyBiZSBhdmFpbGFibGUgaWYgaW5pdGlhbGl6ZS1nbG9iYWxzIHVzZWQgd2l0aG91dCBjaGlwcGVyLWluaXRpYWxpemF0aW9uLmpzXHJcbiAgY29uc3QgcGFja2FnZU9iamVjdCA9IF8uaGFzSW4oIHdpbmRvdywgJ3BoZXQuY2hpcHBlci5wYWNrYWdlT2JqZWN0JyApID8gcGhldC5jaGlwcGVyLnBhY2thZ2VPYmplY3QgOiB7fTtcclxuICBjb25zdCBwYWNrYWdlUGhldCA9IHBhY2thZ2VPYmplY3QucGhldCB8fCB7fTtcclxuXHJcbiAgLy8gTm90IGFsbCBydW50aW1lcyB3aWxsIGhhdmUgdGhpcyBmbGFnLCBzbyBiZSBncmFjZWZ1bFxyXG4gIGNvbnN0IGFsbG93TG9jYWxlU3dpdGNoaW5nID0gXy5oYXNJbiggd2luZG93LCAncGhldC5jaGlwcGVyLmFsbG93TG9jYWxlU3dpdGNoaW5nJyApID8gcGhldC5jaGlwcGVyLmFsbG93TG9jYWxlU3dpdGNoaW5nIDogdHJ1ZTtcclxuXHJcbiAgLy8gZHVjayB0eXBlIGRlZmF1bHRzIHNvIHRoYXQgbm90IGFsbCBwYWNrYWdlLmpzb24gZmlsZXMgbmVlZCB0byBoYXZlIGEgcGhldC5zaW1GZWF0dXJlcyBzZWN0aW9uLlxyXG4gIGNvbnN0IHBhY2thZ2VTaW1GZWF0dXJlcyA9IHBhY2thZ2VQaGV0LnNpbUZlYXR1cmVzIHx8IHt9O1xyXG5cclxuICAvLyBUaGUgY29sb3IgcHJvZmlsZSB1c2VkIGJ5IGRlZmF1bHQsIGlmIG5vIGNvbG9yUHJvZmlsZXMgYXJlIHNwZWNpZmllZCBpbiBwYWNrYWdlLmpzb24uXHJcbiAgLy8gTk9URTogRHVwbGljYXRlZCBpbiBTY2VuZXJ5Q29uc3RhbnRzLmpzIHNpbmNlIHNjZW5lcnkgZG9lcyBub3QgaW5jbHVkZSBpbml0aWFsaXplLWdsb2JhbHMuanNcclxuICBjb25zdCBERUZBVUxUX0NPTE9SX1BST0ZJTEUgPSAnZGVmYXVsdCc7XHJcblxyXG4gIC8vIFRoZSBwb3NzaWJsZSBjb2xvciBwcm9maWxlcyBmb3IgdGhlIGN1cnJlbnQgc2ltdWxhdGlvbi5cclxuICBjb25zdCBjb2xvclByb2ZpbGVzID0gcGFja2FnZVNpbUZlYXR1cmVzLmNvbG9yUHJvZmlsZXMgfHwgWyBERUZBVUxUX0NPTE9SX1BST0ZJTEUgXTtcclxuXHJcbiAgLy8gUHJpdmF0ZSBEb2M6IE5vdGU6IHRoZSBmb2xsb3dpbmcganNkb2MgaXMgZm9yIHRoZSBwdWJsaWMgZmFjaW5nIFBoRVQtaU8gQVBJLiBJbiBhZGRpdGlvbiwgYWxsIHF1ZXJ5IHBhcmFtZXRlcnMgaW4gdGhlIHNjaGVtYVxyXG4gIC8vIHRoYXQgYXJlIGEgXCJtZW1iZXJPZlwiIHRoZSBcIlBoZXRRdWVyeVBhcmFtZXRlcnNcIiBuYW1lc3BhY2UgYXJlIHVzZWQgaW4gdGhlIGpzZG9jIHRoYXQgaXMgcHVibGljIChjbGllbnQgZmFjaW5nKVxyXG4gIC8vIHBoZXQtaW8gZG9jdW1lbnRhdGlvbi4gUHJpdmF0ZSBjb21tZW50cyBhYm91dCBpbXBsZW1lbnRhdGlvbiBkZXRhaWxzIHdpbGwgYmUgaW4gY29tbWVudHMgYWJvdmUgdGhlIGpzZG9jLCBhbmRcclxuICAvLyBtYXJrZWQgYXMgc3VjaC5cclxuICAvLyBOb3RlOiB0aGlzIGhhZCB0byBiZSBqc2RvYyBkaXJlY3RseSBmb3IgUVVFUllfUEFSQU1FVEVSU19TQ0hFTUEgdG8gc3VwcG9ydCB0aGUgY29ycmVjdCBhdXRvIGZvcm1hdHRpbmcuXHJcblxyXG4gIC8qKlxyXG4gICAqIFF1ZXJ5IHBhcmFtZXRlcnMgdGhhdCBtYW5pcHVsYXRlIHRoZSBzdGFydHVwIHN0YXRlIG9mIHRoZSBQaEVUIHNpbXVsYXRpb24uIFRoaXMgaXMgbm90XHJcbiAgICogYW4gb2JqZWN0IGRlZmluZWQgaW4gdGhlIGdsb2JhbCBzY29wZSwgYnV0IHJhdGhlciBpdCBzZXJ2ZXMgYXMgZG9jdW1lbnRhdGlvbiBhYm91dCBhdmFpbGFibGUgcXVlcnkgcGFyYW1ldGVycy5cclxuICAgKiBOb3RlOiBUaGUgXCJmbGFnXCIgdHlwZSBmb3IgcXVlcnkgcGFyYW1ldGVycyBkb2VzIG5vdCBleHBlY3QgYSB2YWx1ZSBmb3IgdGhlIGtleSwgYnV0IHJhdGhlciBqdXN0IHRoZSBwcmVzZW5jZSBvZlxyXG4gICAqIHRoZSBrZXkgaXRzZWxmLlxyXG4gICAqIEBuYW1lc3BhY2Uge09iamVjdH0gUGhldFF1ZXJ5UGFyYW1ldGVyc1xyXG4gICAqL1xyXG4gIGNvbnN0IFFVRVJZX1BBUkFNRVRFUlNfU0NIRU1BID0ge1xyXG4gICAgLy8gU2NoZW1hIHRoYXQgZGVzY3JpYmVzIHF1ZXJ5IHBhcmFtZXRlcnMgZm9yIFBoRVQgY29tbW9uIGNvZGUuXHJcbiAgICAvLyBUaGVzZSBxdWVyeSBwYXJhbWV0ZXJzIGFyZSBhdmFpbGFibGUgdmlhIGdsb2JhbCBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLlxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW4gZW52aXJvbm1lbnRzIHdoZXJlIHVzZXJzIHNob3VsZCBub3QgYmUgYWJsZSB0byBuYXZpZ2F0ZSBoeXBlcmxpbmtzIGF3YXkgZnJvbSB0aGUgc2ltdWxhdGlvbiwgY2xpZW50cyBjYW4gdXNlXHJcbiAgICAgKiA/YWxsb3dMaW5rcz1mYWxzZS4gIEluIHRoaXMgY2FzZSwgbGlua3MgYXJlIGRpc3BsYXllZCBhbmQgbm90IGNsaWNrYWJsZS4gVGhpcyBxdWVyeSBwYXJhbWV0ZXIgaXMgcHVibGljIGZhY2luZy5cclxuICAgICAqIEBtZW1iZXJPZiBQaGV0UXVlcnlQYXJhbWV0ZXJzXHJcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgYWxsb3dMaW5rczoge1xyXG4gICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogdHJ1ZSxcclxuICAgICAgcHVibGljOiB0cnVlXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWxsb3dzIHNldHRpbmcgb2YgdGhlIHNvdW5kIHN0YXRlLCBwb3NzaWJsZSB2YWx1ZXMgYXJlICdlbmFibGVkJyAoZGVmYXVsdCksICdtdXRlZCcsIGFuZCAnZGlzYWJsZWQnLiAgU291bmRcclxuICAgICAqIG11c3QgYmUgc3VwcG9ydGVkIGJ5IHRoZSBzaW0gZm9yIHRoaXMgdG8gaGF2ZSBhbnkgZWZmZWN0LlxyXG4gICAgICogQG1lbWJlck9mIFBoZXRRdWVyeVBhcmFtZXRlcnNcclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIGF1ZGlvOiB7XHJcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICBkZWZhdWx0VmFsdWU6ICdlbmFibGVkJyxcclxuICAgICAgdmFsaWRWYWx1ZXM6IFsgJ2VuYWJsZWQnLCAnZGlzYWJsZWQnLCAnbXV0ZWQnIF0sXHJcbiAgICAgIHB1YmxpYzogdHJ1ZVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdlbmVyYXRlcyBvYmplY3QgcmVwb3J0cyB0aGF0IGNhbiBiZSB1c2VkIGJ5IGJpbmRlci4gRm9yIGludGVybmFsIHVzZS5cclxuICAgICAqIFNlZSBJbnN0YW5jZVJlZ2lzdHJ5LmpzIGFuZCBiaW5kZXIgcmVwbyAoc3BlY2lmaWNhbGx5IGdldEZyb21TaW1Jbk1haW4uanMpIGZvciBtb3JlIGRldGFpbHMuXHJcbiAgICAgKi9cclxuICAgIGJpbmRlcjogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIHNwZWNpZmllcyB0aGUgYnJhbmQgdGhhdCBzaG91bGQgYmUgdXNlZCBpbiB1bmJ1aWx0IG1vZGVcclxuICAgICAqL1xyXG4gICAgYnJhbmQ6IHtcclxuICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogJ2FkYXB0ZWQtZnJvbS1waGV0J1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFdoZW4gcHJlc2VudCwgd2lsbCB0cmlnZ2VyIGNoYW5nZXMgdGhhdCBhcmUgbW9yZSBzaW1pbGFyIHRvIHRoZSBidWlsZCBlbnZpcm9ubWVudC5cclxuICAgICAqIFJpZ2h0IG5vdywgdGhpcyBpbmNsdWRlcyBjb21wdXRpbmcgaGlnaGVyLXJlc29sdXRpb24gbWlwbWFwcyBmb3IgdGhlIG1pcG1hcCBwbHVnaW4uXHJcbiAgICAgKi9cclxuICAgIGJ1aWxkQ29tcGF0aWJsZTogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIElmIHRoaXMgaXMgYSBmaW5pdGUgbnVtYmVyIEFORCBhc3NlcnRpb25zIGFyZSBlbmFibGVkLCBpdCB3aWxsIHRyYWNrIG1heGltdW0gTm9kZSBjaGlsZCBjb3VudHMsIGFuZFxyXG4gICAgICogd2lsbCBhc3NlcnQgdGhhdCB0aGUgbnVtYmVyIG9mIGNoaWxkcmVuIG9uIGEgc2luZ2xlIE5vZGUgaXMgbm90IGdyZWF0ZXIgdGhhbiB0aGUgbGltaXQuXHJcbiAgICAgKi9cclxuICAgIGNoaWxkTGltaXQ6IHtcclxuICAgICAgdHlwZTogJ251bWJlcicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLFxyXG4gICAgICBwdWJsaWM6IGZhbHNlXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hlbiBwcm92aWRlZCBhIG5vbi16ZXJvLWxlbmd0aCB2YWx1ZSwgdGhlIHNpbSB3aWxsIHNlbmQgb3V0IGFzc29ydGVkIGV2ZW50cyBtZWFudCBmb3IgY29udGludW91cyB0ZXN0aW5nXHJcbiAgICAgKiBpbnRlZ3JhdGlvbiAoc2VlIHNpbS10ZXN0LmpzKS5cclxuICAgICAqL1xyXG4gICAgY29udGludW91c1Rlc3Q6IHtcclxuICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogJydcclxuICAgIH0sXHJcblxyXG4gICAgLy8gUHJpdmF0ZSBEb2M6ICBGb3IgZXh0ZXJuYWwgdXNlLiBUaGUgYmVsb3cganNkb2MgaXMgcHVibGljIHRvIHRoZSBQaEVULWlPIEFQSSBkb2N1bWVudGF0aW9uLiBDaGFuZ2Ugd2lzZWx5LlxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY29sb3IgcHJvZmlsZSB1c2VkIGF0IHN0YXJ0dXAsIHJlbGV2YW50IG9ubHkgZm9yIHNpbXMgdGhhdCBzdXBwb3J0IG11bHRpcGxlIGNvbG9yIHByb2ZpbGVzLiAnZGVmYXVsdCcgYW5kXHJcbiAgICAgKiAncHJvamVjdG9yJyBhcmUgaW1wbGVtZW50ZWQgaW4gc2V2ZXJhbCBzaW1zLCBvdGhlciBwcm9maWxlIG5hbWVzIGFyZSBub3QgY3VycmVudGx5IHN0YW5kYXJkaXplZC5cclxuICAgICAqIEBtZW1iZXJPZiBQaGV0UXVlcnlQYXJhbWV0ZXJzXHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBjb2xvclByb2ZpbGU6IHtcclxuICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogY29sb3JQcm9maWxlc1sgMCBdLCAvLyB1c3VhbGx5IFwiZGVmYXVsdFwiLCBidXQgc29tZSBzaW1zIGxpa2UgbWFzc2VzLWFuZC1zcHJpbmdzLWJhc2ljcyBkbyBub3QgdXNlIGRlZmF1bHQgYXQgYWxsXHJcbiAgICAgIHZhbGlkVmFsdWVzOiBjb2xvclByb2ZpbGVzLFxyXG4gICAgICBwdWJsaWM6IHRydWVcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBlbmFibGVzIGRlYnVnZ2VyIGNvbW1hbmRzIGluIGNlcnRhaW4gY2FzZXMgbGlrZSB0aHJvd24gZXJyb3JzIGFuZCBmYWlsZWQgdGVzdHMuXHJcbiAgICAgKi9cclxuICAgIGRlYnVnZ2VyOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8vIE91dHB1dCBkZXByZWNhdGlvbiB3YXJuaW5ncyB2aWEgY29uc29sZS53YXJuLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzg4Mi4gRm9yIGludGVybmFsXHJcbiAgICAvLyB1c2Ugb25seS5cclxuICAgIGRlcHJlY2F0aW9uV2FybmluZ3M6IHsgdHlwZTogJ2ZsYWcnIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBlbmFibGVzIGRldmVsb3Blci1vbmx5IGZlYXR1cmVzLCBzdWNoIGFzIHNob3dpbmcgdGhlIGxheW91dCBib3VuZHNcclxuICAgICAqL1xyXG4gICAgZGV2OiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNldHMgYWxsIG1vZGFsIGZlYXR1cmVzIG9mIHRoZSBzaW0gYXMgZGlzYWJsZWQuIFRoaXMgaXMgYSBkZXZlbG9wbWVudC1vbmx5IHBhcmFtZXRlciB0aGF0IGNhbiBiZSB1c2VmdWwgaW5cclxuICAgICAqIGNvbWJpbmF0aW9uIHdpdGggZnV6eiB0ZXN0aW5nLiBUaGlzIHdhcyBjcmVhdGVkIHRvIGxpbWl0IHRoZSBhbW91bnQgb2YgdGltZSBmdXp6IHRlc3Rpbmcgc3BlbmRzIG9uIHVuaW1wb3J0YW50XHJcbiAgICAgKiBmZWF0dXJlcyBvZiB0aGUgc2ltIGxpa2UgdGhlIFBoRVQgTWVudSwgS2V5Ym9hcmQgSGVscCwgYW5kIFByZWZlcmVuY2VzIHBvcHVwcy5cclxuICAgICAqL1xyXG4gICAgZGlzYWJsZU1vZGFsczogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIGVuYWJsZXMgYXNzZXJ0aW9uc1xyXG4gICAgICovXHJcbiAgICBlYTogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEVuYWJsZXMgYWxsIGFzc2VydGlvbnMsIGFzIGFib3ZlIGJ1dCB3aXRoIG1vcmUgdGltZS1jb25zdW1pbmcgY2hlY2tzXHJcbiAgICAgKi9cclxuICAgIGVhbGw6IHsgdHlwZTogJ2ZsYWcnIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb250cm9scyB3aGV0aGVyIGV4dHJhIHNvdW5kIGlzIG9uIG9yIG9mZiBhdCBzdGFydHVwICh1c2VyIGNhbiBjaGFuZ2UgbGF0ZXIpLiAgVGhpcyBxdWVyeSBwYXJhbWV0ZXIgaXMgcHVibGljXHJcbiAgICAgKiBmYWNpbmcuXHJcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgZXh0cmFTb3VuZEluaXRpYWxseUVuYWJsZWQ6IHtcclxuICAgICAgdHlwZTogJ2ZsYWcnLFxyXG4gICAgICBwdWJsaWM6IHRydWVcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGb3JjZSBTY2VuZXJ5IHRvIHJlZnJlc2ggU1ZHIGNvbnRlbnRzIGV2ZXJ5IGZyYW1lICh0byBoZWxwIGRldGVjdCByZW5kZXJpbmcvYnJvd3Nlci1yZXBhaW50IGlzc3VlcyB3aXRoIFNWRykuXHJcbiAgICAgKi9cclxuICAgIGZvcmNlU1ZHUmVmcmVzaDogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJhbmRvbWx5IHNlbmRzIG1vdXNlIGV2ZW50cyBhbmQgdG91Y2ggZXZlbnRzIHRvIHNpbS5cclxuICAgICAqL1xyXG4gICAgZnV6ejogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJhbmRvbWx5IHNlbmRzIGtleWJvYXJkIGV2ZW50cyB0byB0aGUgc2ltLiBNdXN0IGhhdmUgYWNjZXNzaWJpbGl0eSBlbmFibGVkLlxyXG4gICAgICovXHJcbiAgICBmdXp6Qm9hcmQ6IHsgdHlwZTogJ2ZsYWcnIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSYW5kb21seSBzZW5kcyBtb3VzZSBldmVudHMgdG8gc2ltLlxyXG4gICAgICovXHJcbiAgICBmdXp6TW91c2U6IHsgdHlwZTogJ2ZsYWcnIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgbWF4aW11bSBudW1iZXIgb2YgY29uY3VycmVudCBwb2ludGVycyBhbGxvd2VkIGZvciBmdXp6aW5nLiBVc2luZyBhIHZhbHVlIGxhcmdlciB0aGFuIDEgd2lsbCB0ZXN0IG11bHRpdG91Y2hcclxuICAgICAqIGJlaGF2aW9yICh3aXRoID9mdXp6LCA/ZnV6ek1vdXNlLCA/ZnV6elRvdWNoLCBldGMuKVxyXG4gICAgICovXHJcbiAgICBmdXp6UG9pbnRlcnM6IHtcclxuICAgICAgdHlwZTogJ251bWJlcicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogMVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJhbmRvbWx5IHNlbmRzIHRvdWNoIGV2ZW50cyB0byBzaW0uXHJcbiAgICAgKi9cclxuICAgIGZ1enpUb3VjaDogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIGlmIGZ1enpNb3VzZT10cnVlIG9yIGZ1enpUb3VjaD10cnVlLCB0aGlzIGlzIHRoZSBhdmVyYWdlIG51bWJlciBvZiBtb3VzZS90b3VjaCBldmVudHMgdG8gc3ludGhlc2l6ZSBwZXIgZnJhbWUuXHJcbiAgICAgKi9cclxuICAgIGZ1enpSYXRlOiB7XHJcbiAgICAgIHR5cGU6ICdudW1iZXInLFxyXG4gICAgICBkZWZhdWx0VmFsdWU6IDEwMCxcclxuICAgICAgaXNWYWxpZFZhbHVlOiBmdW5jdGlvbiggdmFsdWUgKSB7IHJldHVybiB2YWx1ZSA+IDA7IH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVc2VkIGZvciBwcm92aWRpbmcgYW4gZXh0ZXJuYWwgR29vZ2xlIEFuYWx5dGljcyA0IChndGFnLmpzKSBwcm9wZXJ0eSBmb3IgdHJhY2tpbmcsIHNlZVxyXG4gICAgICogaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXRjb21tb24vaXNzdWVzLzQ2IGZvciBtb3JlIGluZm9ybWF0aW9uLlxyXG4gICAgICpcclxuICAgICAqIEdlbmVyYWxseSwgdGhpcyBzdHJpbmcgd2lsbCBzdGFydCB3aXRoICdHLScgZm9yIEdBNCB0cmFja2Vyc1xyXG4gICAgICpcclxuICAgICAqIFRoaXMgaXMgdXNlZnVsIGZvciB2YXJpb3VzIHVzZXJzL2NsaWVudHMgdGhhdCB3YW50IHRvIGVtYmVkIHNpbXVsYXRpb25zLCBvciBkaXJlY3QgdXNlcnMgdG8gc2ltdWxhdGlvbnMuIEZvclxyXG4gICAgICogZXhhbXBsZSwgaWYgYSBzaW0gaXMgaW5jbHVkZWQgaW4gYW4gZXB1YiwgdGhlIHNpbSBIVE1MIHdvbid0IGhhdmUgdG8gYmUgbW9kaWZpZWQgdG8gaW5jbHVkZSBwYWdlIHRyYWNraW5nLlxyXG4gICAgICovXHJcbiAgICBnYTQ6IHtcclxuICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogbnVsbCxcclxuICAgICAgcHVibGljOiB0cnVlXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTGF1bmNoZXMgdGhlIGdhbWUtdXAtY2FtZXJhIGNvZGUgd2hpY2ggZGVsaXZlcnMgaW1hZ2VzIHRvIHJlcXVlc3RzIGluIEJyYWluUE9QL0dhbWUgVXAvU25hcFRob3VnaHRcclxuICAgICAqL1xyXG4gICAgZ2FtZVVwOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW5hYmxlcyB0aGUgZ2FtZS11cC1jYW1lcmEgY29kZSB0byByZXNwb25kIHRvIG1lc3NhZ2VzIGZyb20gYW55IG9yaWdpblxyXG4gICAgICovXHJcbiAgICBnYW1lVXBUZXN0SGFybmVzczogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEVuYWJsZXMgbG9nZ2luZyBmb3IgZ2FtZS11cC1jYW1lcmEsIHNlZSBnYW1lVXBcclxuICAgICAqL1xyXG4gICAgZ2FtZVVwTG9nZ2luZzogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVzZWQgZm9yIHByb3ZpZGluZyBhIEdvb2dsZSBBbmFseXRpY3MgcGFnZSBJRCBmb3IgdHJhY2tpbmcsIHNlZVxyXG4gICAgICogaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXRjb21tb24vaXNzdWVzLzQ2IGZvciBtb3JlIGluZm9ybWF0aW9uLlxyXG4gICAgICpcclxuICAgICAqIFRoaXMgaXMgZ2l2ZW4gYXMgdGhlIDNyZCBwYXJhbWV0ZXIgdG8gYSBwYWdldmlldyBzZW5kIHdoZW4gcHJvdmlkZWRcclxuICAgICAqL1xyXG4gICAgZ2FQYWdlOiB7XHJcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICBkZWZhdWx0VmFsdWU6IG51bGxcclxuICAgIH0sXHJcblxyXG4gICAgLy8gUHJpdmF0ZSBEb2M6ICBGb3IgZXh0ZXJuYWwgdXNlLiBUaGUgYmVsb3cganNkb2MgaXMgcHVibGljIHRvIHRoZSBQaEVULWlPIEFQSSBkb2N1bWVudGF0aW9uLiBDaGFuZ2Ugd2lzZWx5LlxyXG4gICAgLyoqXHJcbiAgICAgKiBJbmRpY2F0ZXMgd2hldGhlciB0byBkaXNwbGF5IHRoZSBob21lIHNjcmVlbi5cclxuICAgICAqIEZvciBtdWx0aXNjcmVlbiBzaW1zIG9ubHksIHRocm93cyBhbiBhc3NlcnRpb24gZXJyb3IgaWYgc3VwcGxpZWQgZm9yIGEgc2luZ2xlLXNjcmVlbiBzaW0uXHJcbiAgICAgKiBAbWVtYmVyT2YgUGhldFF1ZXJ5UGFyYW1ldGVyc1xyXG4gICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIGhvbWVTY3JlZW46IHtcclxuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICBkZWZhdWx0VmFsdWU6IHRydWUsXHJcbiAgICAgIHB1YmxpYzogdHJ1ZVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBQcml2YXRlIERvYzogRm9yIGV4dGVybmFsIHVzZS4gVGhlIGJlbG93IGpzZG9jIGlzIHB1YmxpYyB0byB0aGUgUGhFVC1pTyBBUEkgZG9jdW1lbnRhdGlvbi4gQ2hhbmdlIHdpc2VseS5cclxuICAgIC8vIFRoZSB2YWx1ZSBpcyBvbmUgb2YgdGhlIHZhbHVlcyBpbiB0aGUgc2NyZWVucyBhcnJheSwgbm90IGFuIGluZGV4IGludG8gdGhlIHNjcmVlbnMgYXJyYXkuXHJcbiAgICAvKipcclxuICAgICAqIFNwZWNpZmllcyB0aGUgaW5pdGlhbCBzY3JlZW4gdGhhdCB3aWxsIGJlIHZpc2libGUgd2hlbiB0aGUgc2ltIHN0YXJ0cy5cclxuICAgICAqIFNlZSBgP3NjcmVlbnNgIHF1ZXJ5IHBhcmFtZXRlciBmb3Igc2NyZWVuIG51bWJlcmluZy5cclxuICAgICAqIEZvciBtdWx0aXNjcmVlbiBzaW1zIG9ubHksIHRocm93cyBhbiBhc3NlcnRpb24gZXJyb3IgaWYgYXBwbGllZCBpbiBhIHNpbmdsZS1zY3JlZW4gc2ltcy5cclxuICAgICAqIFRoZSBkZWZhdWx0IHZhbHVlIG9mIDAgaXMgdGhlIGhvbWUgc2NyZWVuLlxyXG4gICAgICogQG1lbWJlck9mIFBoZXRRdWVyeVBhcmFtZXRlcnNcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGluaXRpYWxTY3JlZW46IHtcclxuICAgICAgdHlwZTogJ251bWJlcicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogMCwgLy8gdGhlIGhvbWUgc2NyZWVuXHJcbiAgICAgIHB1YmxpYzogdHJ1ZVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEVuYWJsZXMgc3VwcG9ydCBmb3IgTGVnZW5kcyBvZiBMZWFybmluZyBwbGF0Zm9ybSwgaW5jbHVkaW5nIGJyb2FkY2FzdGluZyAnaW5pdCcgYW5kIHJlc3BvbmRpbmcgdG8gcGF1c2UvcmVzdW1lLlxyXG4gICAgICovXHJcbiAgICBsZWdlbmRzT2ZMZWFybmluZzogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIElmIHRoaXMgaXMgYSBmaW5pdGUgbnVtYmVyIEFORCBhc3NlcnRpb25zIGFyZSBlbmFibGVkLCBpdCB3aWxsIHRyYWNrIG1heGltdW0gKFRpbnlFbWl0dGVyKSBsaXN0ZW5lciBjb3VudHMsIGFuZFxyXG4gICAgICogd2lsbCBhc3NlcnQgdGhhdCB0aGUgY291bnQgaXMgbm90IGdyZWF0ZXIgdGhhbiB0aGUgbGltaXQuXHJcbiAgICAgKi9cclxuICAgIGxpc3RlbmVyTGltaXQ6IHtcclxuICAgICAgdHlwZTogJ251bWJlcicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLFxyXG4gICAgICBwdWJsaWM6IGZhbHNlXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2VsZWN0IHRoZSBsYW5ndWFnZSBvZiB0aGUgc2ltIHRvIHRoZSBzcGVjaWZpYyBsb2NhbGUuIERlZmF1bHQgdG8gXCJlblwiLlxyXG4gICAgICogQG1lbWJlck9mIFBoZXRRdWVyeVBhcmFtZXRlcnNcclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIGxvY2FsZToge1xyXG4gICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiAnZW4nXHJcbiAgICAgIC8vIERvIE5PVCBhZGQgdGhlIGBwdWJsaWNgIGtleSBoZXJlLiBXZSB3YW50IGludmFsaWQgdmFsdWVzIHRvIGZhbGwgYmFjayB0byBlbi5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQcm92aWRlcyB0aGUgbG9jYWxlcyB0byBsb2FkIGR1cmluZyBzdGFydHVwIGZvciBhbiB1bi1idWlsdCBzaW11bGF0aW9uICh3aWxsIGF1dG9tYXRpY2FsbHkgbG9hZCB0aGUgP2xvY2FsZSwgb3JcclxuICAgICAqIEVuZ2xpc2ggaWYgcHJvdmlkZWQpLlxyXG4gICAgICpcclxuICAgICAqIElmIHRoZSBvbmx5IHByb3ZpZGVkIHZhbHVlIGlzICcqJywgdGhlbiBpdCB3aWxsIGxvYWQgYWxsIHRoZSBsb2NhbGVzLlxyXG4gICAgICovXHJcbiAgICBsb2NhbGVzOiB7XHJcbiAgICAgIHR5cGU6ICdhcnJheScsXHJcbiAgICAgIGVsZW1lbnRTY2hlbWE6IHtcclxuICAgICAgICB0eXBlOiAnc3RyaW5nJ1xyXG4gICAgICB9LFxyXG4gICAgICBkZWZhdWx0VmFsdWU6IFtdXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU3BlY2lmeSBzdXBwb3J0cyBmb3IgZHluYW1pYyBsb2NhbGUgc3dpdGNoaW5nIGluIHRoZSBydW50aW1lIG9mIHRoZSBzaW0uIEJ5IGRlZmF1bHQsIHRoZSB2YWx1ZSB3aWxsIGJlIHRoZSBzdXBwb3J0XHJcbiAgICAgKiBpbiB0aGUgcnVubmFibGUncyBwYWNrYWdlLmpzb24uIFVzZSB0aGlzIHRvIHR1cm4gb2ZmIHRoaW5ncyBsaWtlIHRoZSBsb2NhbGUgc3dpdGNoZXIgcHJlZmVyZW5jZS5cclxuICAgICAqIFRoZSBwYWNrYWdlIGZsYWcgZm9yIHRoaXMgbWVhbnMgdmVyeSBzcGVjaWZpYyB0aGluZ3MgZGVwZW5kaW5nIG9uIGl0cyBwcmVzZW5jZSBhbmQgdmFsdWUuXHJcbiAgICAgKiAtIEJ5IGRlZmF1bHQsIHdpdGggbm8gZW50cnkgaW4gdGhlIHBhY2thZ2UuanNvbiwgd2Ugd2lsbCBzdGlsbCB0cnkgdG8gc3VwcG9ydCBsb2NhbGUgc3dpdGNoaW5nIGlmIG11bHRpcGxlIGxvY2FsZXNcclxuICAgICAqIGFyZSBhdmFpbGFibGUuXHJcbiAgICAgKiAtIElmIHlvdSBhZGQgdGhlIHRydXRoeSBmbGFnIChzdXBwb3J0c0R5bmFtaWNMb2NhbGU6dHJ1ZSksIHRoZW4gaXQgd2lsbCBlbnN1cmUgdGhhdCBzdHJpbmdzIHVzZSBTdHJpbmdQcm9wZXJ0aWVzXHJcbiAgICAgKiBpbiB5b3VyIHNpbS5cclxuICAgICAqIC0gSWYgeW91IGRvIG5vdCB3YW50IHRvIHN1cHBvcnQgdGhpcywgdGhlbiB5b3UgY2FuIG9wdCBvdXQgaW4gdGhlIHBhY2thZ2UuanNvbiB3aXRoIHN1cHBvcnRzRHluYW1pY0xvY2FsZTpmYWxzZVxyXG4gICAgICpcclxuICAgICAqIEZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IHN1cHBvcnRpbmcgZHluYW1pYyBsb2NhbGUsIHNlZSB0aGUgXCJEeW5hbWljIFN0cmluZ3MgTGF5b3V0IFF1aWNrc3RhcnQgR3VpZGVcIjogaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXQtaW5mby9ibG9iL21haW4vZG9jL2R5bmFtaWMtc3RyaW5nLWxheW91dC1xdWlja3N0YXJ0Lm1kXHJcbiAgICAgKi9cclxuICAgIHN1cHBvcnRzRHluYW1pY0xvY2FsZToge1xyXG4gICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogYWxsb3dMb2NhbGVTd2l0Y2hpbmcgJiZcclxuICAgICAgICAgICAgICAgICAgICAoICFwYWNrYWdlU2ltRmVhdHVyZXMuaGFzT3duUHJvcGVydHkoICdzdXBwb3J0c0R5bmFtaWNMb2NhbGUnICkgfHwgcGFja2FnZVNpbUZlYXR1cmVzLnN1cHBvcnRzRHluYW1pY0xvY2FsZSApXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW5hYmxlcyBiYXNpYyBsb2dnaW5nIHRvIHRoZSBjb25zb2xlLlxyXG4gICAgICogVXNhZ2UgaW4gY29kZTogcGhldC5sb2cgJiYgcGhldC5sb2coICd5b3VyIG1lc3NhZ2UnICk7XHJcbiAgICAgKi9cclxuICAgIGxvZzogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgYSBtYXhpbXVtIFwibWVtb3J5XCIgbGltaXQgKGluIE1CKS4gSWYgdGhlIHNpbXVsYXRpb24ncyBydW5uaW5nIGF2ZXJhZ2Ugb2YgbWVtb3J5IHVzYWdlIGdvZXMgb3ZlciB0aGlzIGFtb3VudFxyXG4gICAgICogaW4gb3BlcmF0aW9uIChhcyBkZXRlcm1pbmVkIGN1cnJlbnRseSBieSB1c2luZyBDaHJvbWUncyB3aW5kb3cucGVyZm9ybWFuY2UpLCB0aGVuIGFuIGVycm9yIHdpbGwgYmUgdGhyb3duLlxyXG4gICAgICpcclxuICAgICAqIFRoaXMgaXMgdXNlZnVsIGZvciBjb250aW51b3VzIHRlc3RpbmcsIHRvIGVuc3VyZSB3ZSBhcmVuJ3QgbGVha2luZyBodWdlIGFtb3VudHMgb2YgbWVtb3J5LCBhbmQgY2FuIGFsc28gYmUgdXNlZFxyXG4gICAgICogd2l0aCB0aGUgQ2hyb21lIGNvbW1hbmQtbGluZSBmbGFnIC0tZW5hYmxlLXByZWNpc2UtbWVtb3J5LWluZm8gdG8gbWFrZSB0aGUgZGV0ZXJtaW5hdGlvbiBtb3JlIGFjY3VyYXRlLlxyXG4gICAgICpcclxuICAgICAqIFRoZSB2YWx1ZSAwIHdpbGwgYmUgaWdub3JlZCwgc2luY2Ugb3VyIHNpbXMgYXJlIGxpa2VseSB0byB1c2UgbW9yZSB0aGFuIHRoYXQgbXVjaCBtZW1vcnkuXHJcbiAgICAgKi9cclxuICAgIG1lbW9yeUxpbWl0OiB7XHJcbiAgICAgIHR5cGU6ICdudW1iZXInLFxyXG4gICAgICBkZWZhdWx0VmFsdWU6IDBcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbmFibGVzIHRyYW5zZm9ybWluZyB0aGUgUERPTSBmb3IgYWNjZXNzaWJpbGl0eSBvbiBtb2JpbGUgZGV2aWNlcy4gVGhpcyB3b3JrIGlzIGV4cGVyaW1lbnRhbCwgYW5kIHN0aWxsIGhpZGRlblxyXG4gICAgICogaW4gYSBzY2VuZXJ5IGJyYW5jaCBwZG9tLXRyYW5zZm9ybS4gTXVzdCBiZSB1c2VkIGluIGNvbWJpbmF0aW9uIHdpdGggdGhlIGFjY2Vzc2liaWxpdHkgcXVlcnkgcGFyYW1ldGVyLCBvclxyXG4gICAgICogb24gYSBzaW0gdGhhdCBoYXMgYWNjZXNzaWJpbGl0eSBlbmFibGVkIGJ5IGRlZmF1bHQuIFRoaXMgcXVlcnkgcGFyYW1ldGVyIGlzIG5vdCBpbnRlbmRlZCB0byBiZSBsb25nLWxpdmVkLFxyXG4gICAgICogaW4gdGhlIGZ1dHVyZSB0aGVzZSBmZWF0dXJlcyBzaG91bGQgYmUgYWx3YXlzIGVuYWJsZWQgaW4gdGhlIHNjZW5lcnkgYTExeSBmcmFtZXdvcmsuXHJcbiAgICAgKiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzg1MlxyXG4gICAgICpcclxuICAgICAqIEZvciBpbnRlcm5hbCB1c2UgYW5kIHRlc3Rpbmcgb25seSwgdGhvdWdoIGxpbmtzIHdpdGggdGhpcyBtYXkgYmUgc2hhcmVkIHdpdGggY29sbGFib3JhdG9ycy5cclxuICAgICAqXHJcbiAgICAgKiBAYTExeVxyXG4gICAgICovXHJcbiAgICBtb2JpbGVBMTF5VGVzdDogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipwXHJcbiAgICAgKiBJZiB0aGlzIGlzIGEgZmluaXRlIG51bWJlciBBTkQgYXNzZXJ0aW9ucyBhcmUgZW5hYmxlZCwgaXQgd2lsbCB0cmFjayBtYXhpbXVtIE5vZGUgcGFyZW50IGNvdW50cywgYW5kXHJcbiAgICAgKiB3aWxsIGFzc2VydCB0aGF0IHRoZSBjb3VudCBpcyBub3QgZ3JlYXRlciB0aGFuIHRoZSBsaW1pdC5cclxuICAgICAqL1xyXG4gICAgcGFyZW50TGltaXQ6IHtcclxuICAgICAgdHlwZTogJ251bWJlcicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLFxyXG4gICAgICBwdWJsaWM6IGZhbHNlXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hlbiBhIHNpbXVsYXRpb24gaXMgcnVuIGZyb20gdGhlIFBoRVQgQW5kcm9pZCBhcHAsIGl0IHNob3VsZCBzZXQgdGhpcyBmbGFnLiBJdCBhbHRlcnMgc3RhdGlzdGljcyB0aGF0IHRoZSBzaW0gc2VuZHNcclxuICAgICAqIHRvIEdvb2dsZSBBbmFseXRpY3MgYW5kIHBvdGVudGlhbGx5IG90aGVyIHNvdXJjZXMgaW4gdGhlIGZ1dHVyZS5cclxuICAgICAqXHJcbiAgICAgKiBBbHNvIHJlbW92ZXMgdGhlIGZvbGxvd2luZyBpdGVtcyBmcm9tIHRoZSBcIlBoRVQgTWVudVwiOlxyXG4gICAgICogUmVwb3J0IGEgUHJvYmxlbVxyXG4gICAgICogQ2hlY2sgZm9yIFVwZGF0ZXNcclxuICAgICAqIFNjcmVlbnNob3RcclxuICAgICAqIEZ1bGwgU2NyZWVuXHJcbiAgICAgKi9cclxuICAgICdwaGV0LWFuZHJvaWQtYXBwJzogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFdoZW4gYSBzaW11bGF0aW9uIGlzIHJ1biBmcm9tIHRoZSBQaEVUIGlPUyBhcHAsIGl0IHNob3VsZCBzZXQgdGhpcyBmbGFnLiBJdCBhbHRlcnMgc3RhdGlzdGljcyB0aGF0IHRoZSBzaW0gc2VuZHNcclxuICAgICAqIHRvIEdvb2dsZSBBbmFseXRpY3MgYW5kIHBvdGVudGlhbGx5IG90aGVyIHNvdXJjZXMgaW4gdGhlIGZ1dHVyZS5cclxuICAgICAqXHJcbiAgICAgKiBBbHNvIHJlbW92ZXMgdGhlIGZvbGxvd2luZyBpdGVtcyBmcm9tIHRoZSBcIlBoRVQgTWVudVwiOlxyXG4gICAgICogUmVwb3J0IGEgUHJvYmxlbVxyXG4gICAgICogQ2hlY2sgZm9yIFVwZGF0ZXNcclxuICAgICAqIFNjcmVlbnNob3RcclxuICAgICAqIEZ1bGwgU2NyZWVuXHJcbiAgICAgKi9cclxuICAgICdwaGV0LWFwcCc6IHsgdHlwZTogJ2ZsYWcnIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJZiB0cnVlLCBwdXRzIHRoZSBzaW11bGF0aW9uIGluIGEgc3BlY2lhbCBtb2RlIHdoZXJlIGl0IHdpbGwgd2FpdCBmb3IgbWFudWFsIGNvbnRyb2wgb2YgdGhlIHNpbSBwbGF5YmFjay5cclxuICAgICAqL1xyXG4gICAgcGxheWJhY2tNb2RlOiB7XHJcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiBmYWxzZVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGEgcG9zdC1tZXNzYWdlIHdoZW4gdGhlIHNpbSBpcyBhYm91dCB0byBjaGFuZ2UgdG8gYW5vdGhlciBVUkxcclxuICAgICAqL1xyXG4gICAgcG9zdE1lc3NhZ2VPbkJlZm9yZVVubG9hZDogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIHBhc3NlcyBlcnJvcnMgdG8gcGFyZW50IGZyYW1lIChsaWtlIGZ1enotbGlnaHR5ZWFyKVxyXG4gICAgICovXHJcbiAgICBwb3N0TWVzc2FnZU9uRXJyb3I6IHsgdHlwZTogJ2ZsYWcnIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB0cmlnZ2VycyBhIHBvc3QtbWVzc2FnZSB0aGF0IGZpcmVzIHdoZW4gdGhlIHNpbSBmaW5pc2hlcyBsb2FkaW5nLCBjdXJyZW50bHkgdXNlZCBieSBhcXVhIGZ1enotbGlnaHR5ZWFyXHJcbiAgICAgKi9cclxuICAgIHBvc3RNZXNzYWdlT25Mb2FkOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogdHJpZ2dlcnMgYSBwb3N0LW1lc3NhZ2UgdGhhdCBmaXJlcyB3aGVuIHRoZSBzaW11bGF0aW9uIGlzIHJlYWR5IHRvIHN0YXJ0LlxyXG4gICAgICovXHJcbiAgICBwb3N0TWVzc2FnZU9uUmVhZHk6IHsgdHlwZTogJ2ZsYWcnIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb250cm9scyB3aGV0aGVyIHRoZSBwcmVzZXJ2ZURyYXdpbmdCdWZmZXI6dHJ1ZSBpcyBzZXQgb24gV2ViR0wgQ2FudmFzZXMuIFRoaXMgYWxsb3dzIGNhbnZhcy50b0RhdGFVUkwoKSB0byB3b3JrXHJcbiAgICAgKiAodXNlZCBmb3IgY2VydGFpbiBtZXRob2RzIHRoYXQgcmVxdWlyZSBzY3JlZW5zaG90IGdlbmVyYXRpb24gdXNpbmcgZm9yZWlnbiBvYmplY3QgcmFzdGVyaXphdGlvbiwgZXRjLikuXHJcbiAgICAgKiBHZW5lcmFsbHkgcmVkdWNlcyBXZWJHTCBwZXJmb3JtYW5jZSwgc28gaXQgc2hvdWxkIG5vdCBhbHdheXMgYmUgb24gKHRodXMgdGhlIHF1ZXJ5IHBhcmFtZXRlcikuXHJcbiAgICAgKi9cclxuICAgIHByZXNlcnZlRHJhd2luZ0J1ZmZlcjogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIElmIHRydWUsIHRoZSBmdWxsIHNjcmVlbiBidXR0b24gd29uJ3QgYmUgc2hvd24gaW4gdGhlIHBoZXQgbWVudVxyXG4gICAgICovXHJcbiAgICBwcmV2ZW50RnVsbFNjcmVlbjogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIHNob3dzIHByb2ZpbGluZyBpbmZvcm1hdGlvbiBmb3IgdGhlIHNpbVxyXG4gICAgICovXHJcbiAgICBwcm9maWxlcjogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIGFkZHMgYSBtZW51IGl0ZW0gdGhhdCB3aWxsIG9wZW4gYSB3aW5kb3cgd2l0aCBhIFFSIGNvZGUgd2l0aCB0aGUgVVJMIG9mIHRoZSBzaW11bGF0aW9uXHJcbiAgICAgKi9cclxuICAgIHFyQ29kZTogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJhbmRvbSBzZWVkIGluIHRoZSBwcmVsb2FkIGNvZGUgdGhhdCBjYW4gYmUgdXNlZCB0byBtYWtlIHN1cmUgcGxheWJhY2sgc2ltdWxhdGlvbnMgdXNlIHRoZSBzYW1lIHNlZWQgKGFuZCB0aHVzXHJcbiAgICAgKiB0aGUgc2ltdWxhdGlvbiBzdGF0ZSwgZ2l2ZW4gdGhlIGlucHV0IGV2ZW50cyBhbmQgZnJhbWVzLCBjYW4gYmUgZXhhY3RseSByZXByb2R1Y2VkKVxyXG4gICAgICogU2VlIFJhbmRvbS5qc1xyXG4gICAgICovXHJcbiAgICByYW5kb21TZWVkOiB7XHJcbiAgICAgIHR5cGU6ICdudW1iZXInLFxyXG4gICAgICBkZWZhdWx0VmFsdWU6IE1hdGgucmFuZG9tKCkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBiYWQtc2ltLXRleHRcclxuICAgIH0sXHJcblxyXG4gICAgLypcclxuICAgICAqIFNldHMgdGhlIGRlZmF1bHQgZm9yIHRoZSBSZWdpb24gYW5kIEN1bHR1cmUgZmVhdHVyZS4gVGhlIHNldCBvZiB2YWxpZCB2YWx1ZXMgaXMgZGV0ZXJtaW5lZCBieVxyXG4gICAgICogXCJzdXBwb3J0ZWRSZWdpb25zQW5kQ3VsdHVyZXNWYWx1ZXNcIiBpbiBwYWNrYWdlLmpzb24uIElmIG5vdCBwcm92aWRlZCBpbiB0aGUgVVJMLCB0aGUgZGVmYXVsdCBjYW5cclxuICAgICAqIGJlIHNldCB2aWEgXCJkZWZhdWx0UmVnaW9uQW5kQ3VsdHVyZVwiIGluIHBhY2thZ2UuanNvbiwgd2hpY2ggZGVmYXVsdHMgdG8gJ3VzYScuXHJcbiAgICAgKi9cclxuICAgIHJlZ2lvbkFuZEN1bHR1cmU6IHtcclxuICAgICAgcHVibGljOiB0cnVlLFxyXG4gICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiBwYWNrYWdlUGhldD8uc2ltRmVhdHVyZXM/LmRlZmF1bHRSZWdpb25BbmRDdWx0dXJlID8/ICd1c2EnLFxyXG4gICAgICB2YWxpZFZhbHVlczogcGFja2FnZVBoZXQ/LnNpbUZlYXR1cmVzPy5zdXBwb3J0ZWRSZWdpb25zQW5kQ3VsdHVyZXMgPz8gWyAndXNhJyBdIC8vIGRlZmF1bHQgdmFsdWUgbXVzdCBiZSBpbiB2YWxpZFZhbHVlc1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNwZWNpZnkgYSByZW5kZXJlciBmb3IgdGhlIFNpbSdzIHJvb3ROb2RlIHRvIHVzZS5cclxuICAgICAqL1xyXG4gICAgcm9vdFJlbmRlcmVyOiB7XHJcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICBkZWZhdWx0VmFsdWU6IG51bGwsXHJcbiAgICAgIHZhbGlkVmFsdWVzOiBbIG51bGwsICdjYW52YXMnLCAnc3ZnJywgJ2RvbScsICd3ZWJnbCcsICd2ZWxsbycgXSAvLyBzZWUgTm9kZS5zZXRSZW5kZXJlclxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFycmF5IG9mIG9uZSBvciBtb3JlIGxvZ3MgdG8gZW5hYmxlIGluIHNjZW5lcnkgMC4yKywgZGVsaW1pdGVkIHdpdGggY29tbWFzLlxyXG4gICAgICogRm9yIGV4YW1wbGU6ID9zY2VuZXJ5TG9nPURpc3BsYXksRHJhd2FibGUsV2ViR0xCbG9jayByZXN1bHRzIGluIFsgJ0Rpc3BsYXknLCAnRHJhd2FibGUnLCAnV2ViR0xCbG9jaycgXVxyXG4gICAgICogRG9uJ3QgY2hhbmdlIHRoaXMgd2l0aG91dCB1cGRhdGluZyB0aGUgc2lnbmF0dXJlIGluIHNjZW5lcnkgdW5pdCB0ZXN0cyB0b28uXHJcbiAgICAgKlxyXG4gICAgICogVGhlIGVudGlyZSBzdXBwb3J0ZWQgbGlzdCBpcyBpbiBzY2VuZXJ5LmpzIGluIHRoZSBsb2dQcm9wZXJ0aWVzIG9iamVjdC5cclxuICAgICAqL1xyXG4gICAgc2NlbmVyeUxvZzoge1xyXG4gICAgICB0eXBlOiAnYXJyYXknLFxyXG4gICAgICBlbGVtZW50U2NoZW1hOiB7XHJcbiAgICAgICAgdHlwZTogJ3N0cmluZydcclxuICAgICAgfSxcclxuICAgICAgZGVmYXVsdFZhbHVlOiBudWxsXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2NlbmVyeSBsb2dzIHdpbGwgYmUgb3V0cHV0IHRvIGEgc3RyaW5nIGluc3RlYWQgb2YgdGhlIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBzY2VuZXJ5U3RyaW5nTG9nOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU3BlY2lmaWVzIHRoZSBzZXQgb2Ygc2NyZWVucyB0aGF0IGFwcGVhciBpbiB0aGUgc2ltLCBhbmQgdGhlaXIgb3JkZXIuXHJcbiAgICAgKiBVc2VzIDEtYmFzZWQgKG5vdCB6ZXJvLWJhc2VkKSBhbmQgXCIsXCIgZGVsaW1pdGVkIHN0cmluZyBzdWNoIGFzIFwiMSwzLDRcIiB0byBnZXQgdGhlIDFzdCwgM3JkIGFuZCA0dGggc2NyZWVuLlxyXG4gICAgICogQHR5cGUge0FycmF5LjxudW1iZXI+fVxyXG4gICAgICovXHJcbiAgICBzY3JlZW5zOiB7XHJcbiAgICAgIHR5cGU6ICdhcnJheScsXHJcbiAgICAgIGVsZW1lbnRTY2hlbWE6IHtcclxuICAgICAgICB0eXBlOiAnbnVtYmVyJyxcclxuICAgICAgICBpc1ZhbGlkVmFsdWU6IE51bWJlci5pc0ludGVnZXJcclxuICAgICAgfSxcclxuICAgICAgZGVmYXVsdFZhbHVlOiBudWxsLFxyXG4gICAgICBpc1ZhbGlkVmFsdWU6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcclxuXHJcbiAgICAgICAgLy8gc2NyZWVuIGluZGljZXMgY2Fubm90IGJlIGR1cGxpY2F0ZWRcclxuICAgICAgICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgKCB2YWx1ZS5sZW5ndGggPT09IF8udW5pcSggdmFsdWUgKS5sZW5ndGggJiYgdmFsdWUubGVuZ3RoID4gMCApO1xyXG4gICAgICB9LFxyXG4gICAgICBwdWJsaWM6IHRydWVcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUeXBpY2FsbHkgdXNlZCB0byBzaG93IGFuc3dlcnMgKG9yIGhpZGRlbiBjb250cm9scyB0aGF0IHNob3cgYW5zd2VycykgdG8gY2hhbGxlbmdlcyBpbiBzaW0gZ2FtZXMuXHJcbiAgICAgKiBGb3IgaW50ZXJuYWwgdXNlIGJ5IFBoRVQgdGVhbSBtZW1iZXJzIG9ubHkuXHJcbiAgICAgKi9cclxuICAgIHNob3dBbnN3ZXJzOiB7XHJcbiAgICAgIHR5cGU6ICdmbGFnJyxcclxuICAgICAgcHJpdmF0ZTogdHJ1ZVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIERpc3BsYXlzIGFuIG92ZXJsYXkgb2YgdGhlIGN1cnJlbnQgYm91bmRzIG9mIGVhY2ggQ2FudmFzTm9kZVxyXG4gICAgICovXHJcbiAgICBzaG93Q2FudmFzTm9kZUJvdW5kczogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIERpc3BsYXlzIGFuIG92ZXJsYXkgb2YgdGhlIGN1cnJlbnQgYm91bmRzIG9mIGVhY2ggcGhldC5zY2VuZXJ5LkZpdHRlZEJsb2NrXHJcbiAgICAgKi9cclxuICAgIHNob3dGaXR0ZWRCbG9ja0JvdW5kczogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNob3dzIGhpdCBhcmVhcyBhcyBkYXNoZWQgbGluZXMuXHJcbiAgICAgKi9cclxuICAgIHNob3dIaXRBcmVhczogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNob3dzIHBvaW50ZXIgYXJlYXMgYXMgZGFzaGVkIGxpbmVzLiB0b3VjaEFyZWFzIGFyZSByZWQsIG1vdXNlQXJlYXMgYXJlIGJsdWUuXHJcbiAgICAgKi9cclxuICAgIHNob3dQb2ludGVyQXJlYXM6IHsgdHlwZTogJ2ZsYWcnIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEaXNwbGF5cyBhIHNlbWktdHJhbnNwYXJlbnQgY3Vyc29yIGluZGljYXRvciBmb3IgdGhlIHBvc2l0aW9uIG9mIGVhY2ggYWN0aXZlIHBvaW50ZXIgb24gdGhlIHNjcmVlbi5cclxuICAgICAqL1xyXG4gICAgc2hvd1BvaW50ZXJzOiB7IHR5cGU6ICdmbGFnJyB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2hvd3MgdGhlIHZpc2libGUgYm91bmRzIGluIFNjcmVlblZpZXcuanMsIGZvciBkZWJ1Z2dpbmcgdGhlIGxheW91dCBvdXRzaWRlIHRoZSBcImRldlwiIGJvdW5kc1xyXG4gICAgICovXHJcbiAgICBzaG93VmlzaWJsZUJvdW5kczogeyB0eXBlOiAnZmxhZycgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZHMgYSBydW50aW1lIGNoZWNrIHdoaWxlIGNvbXB1dGluZyB0aGUgZGVyaXZhdGlvbiBvZiBhIERlcml2ZWRQcm9wZXJ0eSwgdGhhdCBhc3NlcnRzIHRoYXQgYWxsIHF1ZXJpZWQgUHJvcGVydHlcclxuICAgICAqIGluc3RhbmNlcyBhcmUgbGlzdGVkIGluIHRoZSBkZXBlbmRlbmNpZXMuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYXhvbi9pc3N1ZXMvNDQxXHJcbiAgICAgKi9cclxuICAgIHN0cmljdEF4b25EZXBlbmRlbmNpZXM6IHtcclxuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICBkZWZhdWx0VmFsdWU6IHBhY2thZ2VTaW1GZWF0dXJlcy5oYXNPd25Qcm9wZXJ0eSggJ3N0cmljdEF4b25EZXBlbmRlbmNpZXMnICkgPyAhIXBhY2thZ2VTaW1GZWF0dXJlcy5zdHJpY3RBeG9uRGVwZW5kZW5jaWVzIDogdHJ1ZVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNodWZmbGVzIGxpc3RlbmVycyBlYWNoIHRpbWUgdGhleSBhcmUgbm90aWZpZWQsIHRvIGhlbHAgdXMgdGVzdCBvcmRlciBkZXBlbmRlbmN5LCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2F4b24vaXNzdWVzLzIxNVxyXG4gICAgICpcclxuICAgICAqICdkZWZhdWx0JyAtIG5vIHNodWZmbGluZ1xyXG4gICAgICogJ3JhbmRvbScgLSBjaG9vc2VzIGEgc2VlZCBmb3IgeW91XHJcbiAgICAgKiAncmFuZG9tKDEyMyknIC0gc3BlY2lmeSBhIHNlZWRcclxuICAgICAqICdyZXZlcnNlJyAtIHJldmVyc2UgdGhlIG9yZGVyIG9mIGxpc3RlbmVyc1xyXG4gICAgICovXHJcbiAgICBsaXN0ZW5lck9yZGVyOiB7XHJcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICBkZWZhdWx0VmFsdWU6ICdkZWZhdWx0JyxcclxuICAgICAgaXNWYWxpZFZhbHVlOiBmdW5jdGlvbiggdmFsdWUgKSB7XHJcblxyXG4gICAgICAgIC8vIE5PVEU6IHRoaXMgcmVndWxhciBleHByZXNzaW9uIG11c3QgYmUgbWFpbnRhaW5lZCBpbiBUaW55RW1pdHRlci50cyBhcyB3ZWxsLlxyXG4gICAgICAgIGNvbnN0IHJlZ2V4ID0gL3JhbmRvbSg/OiUyOHxcXCgpKFxcZCspKD86JTI5fFxcKSkvO1xyXG5cclxuICAgICAgICByZXR1cm4gdmFsdWUgPT09ICdkZWZhdWx0JyB8fCB2YWx1ZSA9PT0gJ3JhbmRvbScgfHwgdmFsdWUgPT09ICdyZXZlcnNlJyB8fCB2YWx1ZS5tYXRjaCggcmVnZXggKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFdoZW4gdHJ1ZSwgdXNlIFNwZWVjaFN5bnRoZXNpc1BhcmVudFBvbHlmaWxsIHRvIGFzc2lnbiBhbiBpbXBsZW1lbnRhdGlvbiBvZiBTcGVlY2hTeW50aGVzaXNcclxuICAgICAqIHRvIHRoZSB3aW5kb3cgc28gdGhhdCBpdCBjYW4gYmUgdXNlZCBpbiBwbGF0Zm9ybXMgd2hlcmUgaXQgb3RoZXJ3aXNlIHdvdWxkIG5vdCBiZSBhdmFpbGFibGUuXHJcbiAgICAgKiBBc3N1bWVzIHRoYXQgYW4gaW1wbGVtZW50YXRpb24gb2YgU3BlZWNoU3ludGhlc2lzIGlzIGF2YWlsYWJsZSBmcm9tIGEgcGFyZW50IGlmcmFtZSB3aW5kb3cuXHJcbiAgICAgKiBTZWUgU3BlZWNoU3ludGhlc2lzUGFyZW50UG9seWZpbGwgaW4gdXR0ZXJhbmNlLXF1ZXVlIGZvciBtb3JlIGluZm9ybWF0aW9uLlxyXG4gICAgICpcclxuICAgICAqIFRoaXMgY2Fubm90IGJlIGEgcXVlcnkgcGFyYW1ldGVyIGluIHV0dGVyYW5jZS1xdWV1ZSBiZWNhdXNlIHV0dGVyYW5jZS1xdWV1ZSAoYSBkZXBlbmRlbmN5IG9mIHNjZW5lcnkpXHJcbiAgICAgKiBjYW4gbm90IHVzZSBRdWVyeVN0cmluZ01hY2hpbmUuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTM2Ni5cclxuICAgICAqXHJcbiAgICAgKiBGb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgbW90aXZhdGlvbiBmb3IgdGhpcyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2ZlbnN0ZXIvaXNzdWVzLzNcclxuICAgICAqXHJcbiAgICAgKiBGb3IgaW50ZXJuYWwgdXNlIG9ubHkuXHJcbiAgICAgKi9cclxuICAgIHNwZWVjaFN5bnRoZXNpc0Zyb21QYXJlbnQ6IHtcclxuICAgICAgdHlwZTogJ2ZsYWcnXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU3BlZWQgbXVsdGlwbGllciBmb3IgZXZlcnl0aGluZyBpbiB0aGUgc2ltLiBUaGlzIHNjYWxlcyB0aGUgdmFsdWUgb2YgZHQgZm9yIEFYT04vdGltZXIsXHJcbiAgICAgKiBtb2RlbC5zdGVwLCB2aWV3LnN0ZXAsIGFuZCBhbnl0aGluZyBlbHNlIHRoYXQgaXMgY29udHJvbGxlZCBmcm9tIFNpbS5zdGVwU2ltdWxhdGlvbi5cclxuICAgICAqIE5vcm1hbCBzcGVlZCBpcyAxLiBMYXJnZXIgdmFsdWVzIG1ha2UgdGltZSBnbyBmYXN0ZXIsIHNtYWxsZXIgdmFsdWVzIG1ha2UgdGltZSBnbyBzbG93ZXIuXHJcbiAgICAgKiBGb3IgZXhhbXBsZSwgP3NwZWVkPTAuNSBpcyBoYWxmIHRoZSBub3JtYWwgc3BlZWQuXHJcbiAgICAgKiBVc2VmdWwgZm9yIHRlc3RpbmcgbXVsdGl0b3VjaCwgc28gdGhhdCBvYmplY3RzIGFyZSBlYXNpZXIgdG8gZ3JhYiB3aGlsZSB0aGV5J3JlIG1vdmluZy5cclxuICAgICAqIEZvciBpbnRlcm5hbCB1c2Ugb25seSwgbm90IHB1YmxpYyBmYWNpbmcuXHJcbiAgICAgKi9cclxuICAgIHNwZWVkOiB7XHJcbiAgICAgIHR5cGU6ICdudW1iZXInLFxyXG4gICAgICBkZWZhdWx0VmFsdWU6IDEsXHJcbiAgICAgIGlzVmFsaWRWYWx1ZTogZnVuY3Rpb24oIHZhbHVlICkge1xyXG4gICAgICAgIHJldHVybiB2YWx1ZSA+IDA7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPdmVycmlkZSB0cmFuc2xhdGVkIHN0cmluZ3MuXHJcbiAgICAgKiBUaGUgdmFsdWUgaXMgZW5jb2RlZCBKU09OIG9mIHRoZSBmb3JtIHsgXCJuYW1lc3BhY2Uua2V5XCI6XCJ2YWx1ZVwiLCBcIm5hbWVzcGFjZS5rZXlcIjpcInZhbHVlXCIsIC4uLiB9XHJcbiAgICAgKiBFeGFtcGxlOiB7IFwiUEhfU0NBTEUvbG9nYXJpdGhtaWNcIjpcImZvb1wiLCBcIlBIX1NDQUxFL2xpbmVhclwiOlwiYmFyXCIgfVxyXG4gICAgICogRW5jb2RlIHRoZSBKU09OIGluIGEgYnJvd3NlciBjb25zb2xlIHVzaW5nOiBlbmNvZGVVUklDb21wb25lbnQoIEpTT04uc3RyaW5naWZ5KCB2YWx1ZSApIClcclxuICAgICAqL1xyXG4gICAgc3RyaW5nczoge1xyXG4gICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiBudWxsXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0cyBhIHN0cmluZyB1c2VkIGZvciB2YXJpb3VzIGkxOG4gdGVzdC4gIFRoZSB2YWx1ZXMgYXJlOlxyXG4gICAgICpcclxuICAgICAqIGRvdWJsZTogZHVwbGljYXRlcyBhbGwgb2YgdGhlIHRyYW5zbGF0ZWQgc3RyaW5ncyB3aGljaCB3aWxsIGFsbG93IHRvIHNlZSAoYSkgaWYgYWxsIHN0cmluZ3NcclxuICAgICAqICAgYXJlIHRyYW5zbGF0ZWQgYW5kIChiKSB3aGV0aGVyIHRoZSBsYXlvdXQgY2FuIGFjY29tbW9kYXRlIGxvbmdlciBzdHJpbmdzIGZyb20gb3RoZXIgbGFuZ3VhZ2VzLlxyXG4gICAgICogICBOb3RlIHRoaXMgaXMgYSBoZXVyaXN0aWMgcnVsZSB0aGF0IGRvZXMgbm90IGNvdmVyIGFsbCBjYXNlcy5cclxuICAgICAqXHJcbiAgICAgKiBsb25nOiBhbiBleGNlcHRpb25hbGx5IGxvbmcgc3RyaW5nIHdpbGwgYmUgc3Vic3RpdHV0ZWQgZm9yIGFsbCBzdHJpbmdzLiBVc2UgdGhpcyB0byB0ZXN0IGZvciBsYXlvdXQgcHJvYmxlbXMuXHJcbiAgICAgKlxyXG4gICAgICogcnRsOiBhIHN0cmluZyB0aGF0IHRlc3RzIFJUTCAocmlnaHQtdG8tbGVmdCkgY2FwYWJpbGl0aWVzIHdpbGwgYmUgc3Vic3RpdHV0ZWQgZm9yIGFsbCBzdHJpbmdzXHJcbiAgICAgKlxyXG4gICAgICogeHNzOiB0ZXN0cyBmb3Igc2VjdXJpdHkgaXNzdWVzIHJlbGF0ZWQgdG8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NwZWNpYWwtb3BzL2lzc3Vlcy8xOCxcclxuICAgICAqICAgYW5kIHJ1bm5pbmcgYSBzaW0gc2hvdWxkIE5PVCByZWRpcmVjdCB0byBhbm90aGVyIHBhZ2UuIFByZWZlcmFibHkgc2hvdWxkIGJlIHVzZWQgZm9yIGJ1aWx0IHZlcnNpb25zIG9yXHJcbiAgICAgKiAgIG90aGVyIHZlcnNpb25zIHdoZXJlIGFzc2VydGlvbnMgYXJlIG5vdCBlbmFibGVkLlxyXG4gICAgICpcclxuICAgICAqIG5vbmV8bnVsbDogdGhlIG5vcm1hbCB0cmFuc2xhdGVkIHN0cmluZyB3aWxsIGJlIHNob3duXHJcbiAgICAgKlxyXG4gICAgICogZHluYW1pYzogYWRkcyBnbG9iYWwgaG90a2V5IGxpc3RlbmVycyB0byBjaGFuZ2UgdGhlIHN0cmluZ3MsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvMTMxOVxyXG4gICAgICogICByaWdodCBhcnJvdyAtIGRvdWJsZXMgYSBzdHJpbmcsIGxpa2Ugc3RyaW5nID0gc3RyaW5nK3N0cmluZ1xyXG4gICAgICogICBsZWZ0IGFycm93IC0gaGFsdmVzIGEgc3RyaW5nXHJcbiAgICAgKiAgIHVwIGFycm93IC0gY3ljbGVzIHRvIG5leHQgc3RyaWRlIGluIHJhbmRvbSB3b3JkIGxpc3RcclxuICAgICAqICAgZG93biBhcnJvdyAtIGN5Y2xlcyB0byBwcmV2aW91cyBzdHJpZGUgaW4gcmFuZG9tIHdvcmQgbGlzdFxyXG4gICAgICogICBzcGFjZWJhciAtIHJlc2V0cyB0byBpbml0aWFsIEVuZ2xpc2ggc3RyaW5ncywgYW5kIHJlc2V0cyB0aGUgc3RyaWRlXHJcbiAgICAgKlxyXG4gICAgICoge3N0cmluZ306IGlmIGFueSBvdGhlciBzdHJpbmcgcHJvdmlkZWQsIHRoYXQgc3RyaW5nIHdpbGwgYmUgc3Vic3RpdHV0ZWQgZXZlcnl3aGVyZS4gVGhpcyBmYWNpbGl0YXRlcyB0ZXN0aW5nXHJcbiAgICAgKiAgIHNwZWNpZmljIGNhc2VzLCBsaWtlIHdoZXRoZXIgdGhlIHdvcmQgJ3ZpdGVzc2UnIHdvdWxkIHN1YnN0aXR1dGUgZm9yICdzcGVlZCcgd2VsbC4gIEFsc28sIHVzaW5nIFwiL3UyMFwiIGl0XHJcbiAgICAgKiAgIHdpbGwgc2hvdyB3aGl0ZXNwYWNlIGZvciBhbGwgb2YgdGhlIHN0cmluZ3MsIG1ha2luZyBpdCBlYXN5IHRvIGlkZW50aWZ5IG5vbi10cmFuc2xhdGVkIHN0cmluZ3MuXHJcbiAgICAgKi9cclxuICAgIHN0cmluZ1Rlc3Q6IHtcclxuICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogbnVsbFxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIGFkZHMga2V5Ym9hcmQgc2hvcnRjdXRzLiBjdHJsK2kgKGZvcndhcmQpIG9yIGN0cmwrdSAoYmFja3dhcmQpLiBBbHNvLCB0aGUgc2FtZSBwaHlzaWNhbCBrZXlzIG9uIHRoZVxyXG4gICAgICogZHZvcmFrIGtleWJvYXJkIChjPWZvcndhcmQgYW5kIGc9YmFja3dhcmRzKVxyXG4gICAgICpcclxuICAgICAqIE5PVEU6IERVUExJQ0FUSU9OIEFMRVJULiBEb24ndCBjaGFuZ2UgdGhpcyB3aXRob3V0IGxvb2tpbmcgYXQgcGFyYW1ldGVyIGluIFBIRVRfSU9fV1JBUFBFUlMvUGhldGlvQ2xpZW50LnRzXHJcbiAgICAgKi9cclxuICAgIGtleWJvYXJkTG9jYWxlU3dpdGNoZXI6IHtcclxuICAgICAgdHlwZTogJ2ZsYWcnXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW5hYmxlcyBzdXBwb3J0IGZvciB0aGUgYWNjZXNzaWJsZSBkZXNjcmlwdGlvbiBwbHVnaW4gZmVhdHVyZS5cclxuICAgICAqL1xyXG4gICAgc3VwcG9ydHNEZXNjcmlwdGlvblBsdWdpbjoge1xyXG4gICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogISFwYWNrYWdlU2ltRmVhdHVyZXMuc3VwcG9ydHNEZXNjcmlwdGlvblBsdWdpblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqXHJcbiAgICAgKiBFbmFibGVzIGludGVyYWN0aXZlIGRlc2NyaXB0aW9uIGluIHRoZSBzaW11bGF0aW9uLiBVc2UgdGhpcyBvcHRpb24gdG8gcmVuZGVyIHRoZSBQYXJhbGxlbCBET00gZm9yIGtleWJvYXJkXHJcbiAgICAgKiBuYXZpZ2F0aW9uIGFuZCBzY3JlZW4tcmVhZGVyLWJhc2VkIGF1ZGl0b3J5IGRlc2NyaXB0aW9ucy4gQ2FuIGJlIHBlcm1hbmVudGx5IGVuYWJsZWQgaWZcclxuICAgICAqIGBzdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb246IHRydWVgIGlzIGFkZGVkIHVuZGVyIHRoZSBgcGhldC5zaW1GZWF0dXJlc2AgZW50cnkgb2YgcGFja2FnZS5qc29uLiBRdWVyeSBwYXJhbWV0ZXJcclxuICAgICAqIHZhbHVlIHdpbGwgYWx3YXlzIG92ZXJyaWRlIHBhY2thZ2UuanNvbiBlbnRyeS5cclxuICAgICAqL1xyXG4gICAgc3VwcG9ydHNJbnRlcmFjdGl2ZURlc2NyaXB0aW9uOiB7XHJcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiAhIXBhY2thZ2VTaW1GZWF0dXJlcy5zdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb25cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbmFibGVzIHN1cHBvcnQgZm9yIHRoZSBcIkludGVyYWN0aXZlIEhpZ2hsaWdodHNcIiBmZWF0dXJlLCB3aGVyZSBoaWdobGlnaHRzIGFwcGVhciBhcm91bmQgaW50ZXJhY3RpdmVcclxuICAgICAqIFVJIGNvbXBvbmVudHMuIFRoaXMgaXMgbW9zdCB1c2VmdWwgZm9yIHVzZXJzIHdpdGggbG93IHZpc2lvbiBhbmQgbWFrZXMgaXQgZWFzaWVyIHRvIGlkZW50aWZ5IGludGVyYWN0aXZlXHJcbiAgICAgKiBjb21wb25lbnRzLiBUaG91Z2ggZW5hYmxlZCBoZXJlLCB0aGUgZmVhdHVyZSB3aWxsIGJlIHR1cm5lZCBvZmYgdW50aWwgZW5hYmxlZCBieSB0aGUgdXNlciBmcm9tIHRoZSBQcmVmZXJlbmNlc1xyXG4gICAgICogZGlhbG9nLlxyXG4gICAgICpcclxuICAgICAqIFRoaXMgZmVhdHVyZSBpcyBlbmFibGVkIGJ5IGRlZmF1bHQgd2hlbmV2ZXIgc3VwcG9ydHNJbnRlcmFjdGl2ZURlc2NyaXB0aW9uIGlzIHRydWUgaW4gcGFja2FnZS5qc29uLCBzaW5jZSBQaEVUXHJcbiAgICAgKiB3YW50cyB0byBzY2FsZSBvdXQgdGhpcyBmZWF0dXJlIHdpdGggYWxsIHNpbXMgdGhhdCBzdXBwb3J0IGFsdGVybmF0aXZlIGlucHV0LiBUaGUgZmVhdHVyZSBjYW4gYmUgRElTQUJMRUQgd2hlblxyXG4gICAgICogc3VwcG9ydHNJbnRlcmFjdGl2ZURlc2NyaXB0aW9uIGlzIHRydWUgYnkgc2V0dGluZyBgc3VwcG9ydHNJbnRlcmFjdGl2ZUhpZ2hsaWdodHM6IGZhbHNlYCB1bmRlclxyXG4gICAgICogYHBoZXQuc2ltRmVhdHVyZXNgIGluIHBhY2thZ2UuanNvbi5cclxuICAgICAqXHJcbiAgICAgKiBUaGUgcXVlcnkgcGFyYW1ldGVyIHdpbGwgYWx3YXlzIG92ZXJyaWRlIHRoZSBwYWNrYWdlLmpzb24gZW50cnkuXHJcbiAgICAgKi9cclxuICAgIHN1cHBvcnRzSW50ZXJhY3RpdmVIaWdobGlnaHRzOiB7XHJcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuXHJcbiAgICAgIC8vIElmIHN1cHBvcnRzSW50ZXJhY3RpdmVIaWdobGlnaHRzIGlzIGV4cGxpY2l0bHkgcHJvdmlkZWQgaW4gcGFja2FnZS5qc29uLCB1c2UgdGhhdCB2YWx1ZS4gT3RoZXJ3aXNlLCBlbmFibGVcclxuICAgICAgLy8gSW50ZXJhY3RpdmUgSGlnaGxpZ2h0cyB3aGVuIEludGVyYWN0aXZlIERlc2NyaXB0aW9uIGlzIHN1cHBvcnRlZC5cclxuICAgICAgZGVmYXVsdFZhbHVlOiBwYWNrYWdlU2ltRmVhdHVyZXMuaGFzT3duUHJvcGVydHkoICdzdXBwb3J0c0ludGVyYWN0aXZlSGlnaGxpZ2h0cycgKSA/XHJcbiAgICAgICAgICAgICAgICAgICAgISFwYWNrYWdlU2ltRmVhdHVyZXMuc3VwcG9ydHNJbnRlcmFjdGl2ZUhpZ2hsaWdodHMgOiAhIXBhY2thZ2VTaW1GZWF0dXJlcy5zdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb25cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCeSBkZWZhdWx0LCBJbnRlcmFjdGl2ZSBIaWdobGlnaHRzIGFyZSBkaXNhYmxlZCBvbiBzdGFydHVwLiBQcm92aWRlIHRoaXMgZmxhZyB0byBoYXZlIHRoZSBmZWF0dXJlIGVuYWJsZWQgb25cclxuICAgICAqIHN0YXJ0dXAuIEhhcyBubyBlZmZlY3QgaWYgc3VwcG9ydHNJbnRlcmFjdGl2ZUhpZ2hsaWdodHMgaXMgZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIGludGVyYWN0aXZlSGlnaGxpZ2h0c0luaXRpYWxseUVuYWJsZWQ6IHtcclxuICAgICAgdHlwZTogJ2ZsYWcnLFxyXG4gICAgICBwdWJsaWM6IHRydWVcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbmRpY2F0ZXMgd2hldGhlciBjdXN0b20gZ2VzdHVyZSBjb250cm9sIGlzIGVuYWJsZWQgYnkgZGVmYXVsdCBpbiB0aGUgc2ltdWxhdGlvbi5cclxuICAgICAqIFRoaXMgaW5wdXQgbWV0aG9kIGlzIHN0aWxsIGluIGRldmVsb3BtZW50LCBtb3N0bHkgdG8gYmUgdXNlZCBpbiBjb21iaW5hdGlvbiB3aXRoIHRoZSB2b2ljaW5nXHJcbiAgICAgKiBmZWF0dXJlLiBJdCBhbGxvd3MgeW91IHRvIHN3aXBlIHRoZSBzY3JlZW4gdG8gbW92ZSBmb2N1cywgZG91YmxlIHRhcCB0aGUgc2NyZWVuIHRvIGFjdGl2YXRlXHJcbiAgICAgKiBjb21wb25lbnRzLCBhbmQgdGFwIGFuZCBob2xkIHRvIGluaXRpYXRlIGN1c3RvbSBnZXN0dXJlcy5cclxuICAgICAqXHJcbiAgICAgKiBGb3IgaW50ZXJuYWwgdXNlLCB0aG91Z2ggbWF5IGJlIHVzZWQgaW4gc2hhcmVkIGxpbmtzIHdpdGggY29sbGFib3JhdG9ycy5cclxuICAgICAqL1xyXG4gICAgc3VwcG9ydHNHZXN0dXJlQ29udHJvbDoge1xyXG4gICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogISFwYWNrYWdlU2ltRmVhdHVyZXMuc3VwcG9ydHNHZXN0dXJlQ29udHJvbFxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnRyb2xzIHdoZXRoZXIgdGhlIFwiVm9pY2luZ1wiIGZlYXR1cmUgaXMgZW5hYmxlZC5cclxuICAgICAqXHJcbiAgICAgKiBUaGlzIGZlYXR1cmUgaXMgZW5hYmxlZCBieSBkZWZhdWx0IHdoZW4gc3VwcG9ydHNWb2ljaW5nIGlzIHRydWUgaW4gcGFja2FnZS5qc29uLiBUaGUgcXVlcnkgcGFyYW1ldGVyIHdpbGwgYWx3YXlzXHJcbiAgICAgKiBvdmVycmlkZSB0aGUgcGFja2FnZS5qc29uIGVudHJ5LlxyXG4gICAgICovXHJcbiAgICBzdXBwb3J0c1ZvaWNpbmc6IHtcclxuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICBkZWZhdWx0VmFsdWU6ICEhcGFja2FnZVNpbUZlYXR1cmVzLnN1cHBvcnRzVm9pY2luZ1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFN3aXRjaGVzIHRoZSBWZWxsbyByZW5kZXJpbmcgb2YgVGV4dCB0byB1c2UgU3dhc2ggKHdpdGggZW1iZWRkZWQgZm9udHMpLCBpbnN0ZWFkIG9mIENhbnZhcy5cclxuICAgICAqXHJcbiAgICAgKiBGb3IgaW50ZXJuYWwgdXNlIG9ubHkuIFRoaXMgaXMgY3VycmVudGx5IG9ubHkgdXNlZCBpbiBwcm90b3R5cGVzLlxyXG4gICAgICovXHJcbiAgICBzd2FzaFRleHQ6IHtcclxuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICBkZWZhdWx0VmFsdWU6IHRydWVcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJZiBub24tZW1wdHksIFN3YXNoLXJlbmRlcmVkIHRleHQgd2lsbCBzaG93IHVwIGluIHRoZSBnaXZlbiBjb2xvciAodXNlZnVsIGZvciBkZWJ1Z2dpbmcpXHJcbiAgICAgKlxyXG4gICAgICogRm9yIGludGVybmFsIHVzZSBvbmx5LiBUaGlzIGlzIGN1cnJlbnRseSBvbmx5IHVzZWQgaW4gcHJvdG90eXBlcy5cclxuICAgICAqL1xyXG4gICAgc3dhc2hUZXh0Q29sb3I6IHtcclxuICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogJydcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCeSBkZWZhdWx0LCB2b2ljaW5nIGlzIG5vdCBlbmFibGVkIG9uIHN0YXJ0dXAuIEFkZCB0aGlzIGZsYWcgdG8gc3RhcnQgdGhlIHNpbSB3aXRoIHZvaWNpbmcgZW5hYmxlZC5cclxuICAgICAqL1xyXG4gICAgdm9pY2luZ0luaXRpYWxseUVuYWJsZWQ6IHtcclxuICAgICAgdHlwZTogJ2ZsYWcnXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQSBkZWJ1ZyBxdWVyeSBwYXJhbWV0ZXIgdGhhdCB3aWxsIHNhdmUgYW5kIGxvYWQgeW91IHByZWZlcmVuY2VzIChmcm9tIHRoZSBQcmVmZXJlbmNlcyBEaWFsb2cpIHRocm91Z2ggbXVsdGlwbGUgcnVudGltZXMuXHJcbiAgICAgKiBTZWUgUHJlZmVyZW5jZXNTdG9yYWdlLnJlZ2lzdGVyIHRvIHNlZSB3aGF0IFByb3BlcnRpZXMgc3VwcG9ydCB0aGlzIHNhdmUvbG9hZCBmZWF0dXJlLlxyXG4gICAgICovXHJcbiAgICBwcmVmZXJlbmNlc1N0b3JhZ2U6IHtcclxuICAgICAgdHlwZTogJ2ZsYWcnXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29uc29sZSBsb2cgdGhlIHZvaWNpbmcgcmVzcG9uc2VzIHRoYXQgYXJlIHNwb2tlbiBieSBTcGVlY2hTeW50aGVzaXNcclxuICAgICAqL1xyXG4gICAgcHJpbnRWb2ljaW5nUmVzcG9uc2VzOiB7XHJcbiAgICAgIHR5cGU6ICdmbGFnJ1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEVuYWJsZXMgcGFubmluZyBhbmQgem9vbWluZyBvZiB0aGUgc2ltdWxhdGlvbi4gQ2FuIGJlIHBlcm1hbmVudGx5IGRpc2FibGVkIGlmIHN1cHBvcnRzUGFuQW5kWm9vbTogZmFsc2UgaXNcclxuICAgICAqIGFkZGVkIHVuZGVyIHRoZSBgcGhldC5zaW1GZWF0dXJlc2AgZW50cnkgb2YgcGFja2FnZS5qc29uLiBRdWVyeSBwYXJhbWV0ZXIgdmFsdWUgd2lsbCBhbHdheXMgb3ZlcnJpZGUgcGFja2FnZS5qc29uIGVudHJ5LlxyXG4gICAgICpcclxuICAgICAqIFB1YmxpYywgc28gdGhhdCB1c2VycyBjYW4gZGlzYWJsZSB0aGlzIGZlYXR1cmUgaWYgdGhleSBuZWVkIHRvLlxyXG4gICAgICovXHJcbiAgICBzdXBwb3J0c1BhbkFuZFpvb206IHtcclxuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICBwdWJsaWM6IHRydWUsXHJcblxyXG4gICAgICAvLyBldmVuIGlmIG5vdCBwcm92aWRlZCBpbiBwYWNrYWdlLmpzb24sIHRoaXMgZGVmYXVsdHMgdG8gYmVpbmcgdHJ1ZVxyXG4gICAgICBkZWZhdWx0VmFsdWU6ICFwYWNrYWdlU2ltRmVhdHVyZXMuaGFzT3duUHJvcGVydHkoICdzdXBwb3J0c1BhbkFuZFpvb20nICkgfHwgcGFja2FnZVNpbUZlYXR1cmVzLnN1cHBvcnRzUGFuQW5kWm9vbVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluZGljYXRlcyB3aGV0aGVyIHRoZSBzb3VuZCBsaWJyYXJ5IHNob3VsZCBiZSBlbmFibGVkLiAgSWYgdHJ1ZSwgYW4gaWNvbiBpcyBhZGRlZCB0byB0aGUgbmF2IGJhciBpY29uIHRvIGVuYWJsZVxyXG4gICAgICogdGhlIHVzZXIgdG8gdHVybiBzb3VuZCBvbi9vZmYuICBUaGVyZSBpcyBhbHNvIGEgU2ltIG9wdGlvbiBmb3IgZW5hYmxpbmcgc291bmQgd2hpY2ggY2FuIG92ZXJyaWRlIHRoaXMuXHJcbiAgICAgKiBQcmltYXJpbHkgZm9yIGludGVybmFsIHVzZSwgdGhvdWdoIHdlIG1heSBzaGFyZSBsaW5rcyB3aXRoIGNvbGxhYm9yYXRlcyB0aGF0IHVzZSB0aGlzIHBhcmFtZXRlci5cclxuICAgICAqL1xyXG4gICAgc3VwcG9ydHNTb3VuZDoge1xyXG4gICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogISFwYWNrYWdlU2ltRmVhdHVyZXMuc3VwcG9ydHNTb3VuZFxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluZGljYXRlcyB3aGV0aGVyIGV4dHJhIHNvdW5kcyBhcmUgdXNlZCBpbiBhZGRpdGlvbiB0byBiYXNpYyBzb3VuZHMgYXMgcGFydCBvZiB0aGUgc291bmQgZGVzaWduLiAgSWYgdHJ1ZSwgdGhlXHJcbiAgICAgKiBQaEVUIG1lbnUgd2lsbCBoYXZlIGFuIG9wdGlvbiBmb3IgZW5hYmxpbmcgZXh0cmEgc291bmRzLiAgVGhpcyB3aWxsIGJlIGlnbm9yZWQgaWYgc291bmQgaXMgbm90IGdlbmVyYWxseVxyXG4gICAgICogZW5hYmxlZCAoc2VlID9zdXBwb3J0c1NvdW5kKS5cclxuICAgICAqXHJcbiAgICAgKiBQcmltYXJpbHkgZm9yIGludGVybmFsIHVzZSwgdGhvdWdoIHdlIG1heSBzaGFyZSBsaW5rcyB3aXRoIGNvbGxhYm9yYXRlcyB0aGF0IHVzZSB0aGlzIHBhcmFtZXRlci5cclxuICAgICAqL1xyXG4gICAgc3VwcG9ydHNFeHRyYVNvdW5kOiB7XHJcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiAhIXBhY2thZ2VTaW1GZWF0dXJlcy5zdXBwb3J0c0V4dHJhU291bmRcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbmRpY2F0ZXMgd2hldGhlciBvciBub3QgdmlicmF0aW9uIGlzIGVuYWJsZWQsIGFuZCB3aGljaCBwYXJhZGlnbSBpcyBlbmFibGVkIGZvciB0ZXN0aW5nLiBUaGVyZVxyXG4gICAgICogYXJlIHNldmVyYWwgXCJwYXJhZGlnbXNcIiwgd2hpY2ggYXJlIGRpZmZlcmVudCB2aWJyYXRpb24gb3V0cHV0IGRlc2lnbnMuICBGb3IgdGVtcG9yYXJ5IHVzZVxyXG4gICAgICogd2hpbGUgd2UgaW52ZXN0aWdhdGUgdXNlIG9mIHRoaXMgZmVhdHVyZS4gSW4gdGhlIGxvbmcgcnVuIHRoZXJlIHdpbGwgcHJvYmFibHkgYmUgb25seVxyXG4gICAgICogb25lIGRlc2lnbiBhbmQgaXQgY2FuIGJlIGVuYWJsZWQvZGlzYWJsZWQgd2l0aCBzb21ldGhpbmcgbW9yZSBsaWtlIGBzdXBwb3J0c1ZpYnJhdGlvbmAuXHJcbiAgICAgKlxyXG4gICAgICogVGhlc2UgYXJlIG51bWJlcmVkLCBidXQgdHlwZSBpcyBzdHJpbmcgc28gZGVmYXVsdCBjYW4gYmUgbnVsbCwgd2hlcmUgYWxsIHZpYnJhdGlvbiBpcyBkaXNhYmxlZC5cclxuICAgICAqXHJcbiAgICAgKiBVc2VkIGludGVybmFsbHksIHRob3VnaCBsaW5rcyBhcmUgc2hhcmVkIHdpdGggY29sbGFib3JhdG9ycyBhbmQgcG9zc2libHkgaW4gcGFwZXIgcHVibGljYXRpb25zLlxyXG4gICAgICovXHJcbiAgICB2aWJyYXRpb25QYXJhZGlnbToge1xyXG4gICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiBudWxsXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW5hYmxlcyBXZWJHTCByZW5kZXJpbmcuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMjg5LlxyXG4gICAgICogTm90ZSB0aGF0IHNpbXVsYXRpb25zIGNhbiBvcHQtaW4gdG8gd2ViZ2wgdmlhIG5ldyBTaW0oe3dlYmdsOnRydWV9KSwgYnV0IHVzaW5nID93ZWJnbD10cnVlIHRha2VzXHJcbiAgICAgKiBwcmVjZWRlbmNlLiAgSWYgbm8gd2ViZ2wgcXVlcnkgcGFyYW1ldGVyIGlzIHN1cHBsaWVkLCB0aGVuIHNpbXVsYXRpb25zIHRha2UgdGhlIFNpbSBvcHRpb24gdmFsdWUsIHdoaWNoXHJcbiAgICAgKiBkZWZhdWx0cyB0byBmYWxzZS4gIFNlZSBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzYyMVxyXG4gICAgICovXHJcbiAgICB3ZWJnbDoge1xyXG4gICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogdHJ1ZVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluZGljYXRlcyB3aGV0aGVyIHlvdHRhIGFuYWx5dGljcyBhcmUgZW5hYmxlZC5cclxuICAgICAqL1xyXG4gICAgeW90dGE6IHtcclxuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICBkZWZhdWx0VmFsdWU6IHRydWUsXHJcbiAgICAgIHB1YmxpYzogdHJ1ZVxyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8vIEluaXRpYWxpemUgcXVlcnkgcGFyYW1ldGVycywgc2VlIGRvY3MgYWJvdmVcclxuICAoIGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIC8vIENyZWF0ZSB0aGUgYXR0YWNobWVudCBwb2ludCBmb3IgYWxsIFBoRVQgZ2xvYmFsc1xyXG4gICAgd2luZG93LnBoZXQgPSB3aW5kb3cucGhldCB8fCB7fTtcclxuICAgIHdpbmRvdy5waGV0LmNoaXBwZXIgPSB3aW5kb3cucGhldC5jaGlwcGVyIHx8IHt9O1xyXG5cclxuICAgIC8vIFJlYWQgcXVlcnkgcGFyYW1ldGVyc1xyXG4gICAgd2luZG93LnBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMgPSBRdWVyeVN0cmluZ01hY2hpbmUuZ2V0QWxsKCBRVUVSWV9QQVJBTUVURVJTX1NDSEVNQSApO1xyXG4gICAgd2luZG93LnBoZXQuY2hpcHBlci5jb2xvclByb2ZpbGVzID0gY29sb3JQcm9maWxlcztcclxuXHJcbiAgICAvKipcclxuICAgICAqIERldGVybWluZXMgd2hldGhlciBhbnkgdHlwZSBvZiBmdXp6aW5nIGlzIGVuYWJsZWQuIFRoaXMgaXMgYSBmdW5jdGlvbiBzbyB0aGF0IHRoZSBhc3NvY2lhdGVkIHF1ZXJ5IHBhcmFtZXRlcnNcclxuICAgICAqIGNhbiBiZSBjaGFuZ2VkIGZyb20gdGhlIGNvbnNvbGUgd2hpbGUgdGhlIHNpbSBpcyBydW5uaW5nLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3N1bi9pc3N1ZXMvNjc3LlxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIHdpbmRvdy5waGV0LmNoaXBwZXIuaXNGdXp6RW5hYmxlZCA9ICgpID0+XHJcbiAgICAgICggd2luZG93LnBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuZnV6eiB8fFxyXG4gICAgICAgIHdpbmRvdy5waGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmZ1enpNb3VzZSB8fFxyXG4gICAgICAgIHdpbmRvdy5waGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmZ1enpUb3VjaCB8fFxyXG4gICAgICAgIHdpbmRvdy5waGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmZ1enpCb2FyZFxyXG4gICAgICApO1xyXG5cclxuICAgIC8vIEFkZCBhIGxvZyBmdW5jdGlvbiB0aGF0IGRpc3BsYXlzIG1lc3NhZ2VzIHRvIHRoZSBjb25zb2xlLiBFeGFtcGxlczpcclxuICAgIC8vIHBoZXQubG9nICYmIHBoZXQubG9nKCAnWW91IHdpbiEnICk7XHJcbiAgICAvLyBwaGV0LmxvZyAmJiBwaGV0LmxvZyggJ1lvdSBsb3NlJywgeyBjb2xvcjogJ3JlZCcgfSApO1xyXG4gICAgaWYgKCB3aW5kb3cucGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5sb2cgKSB7XHJcbiAgICAgIHdpbmRvdy5waGV0LmxvZyA9IGZ1bmN0aW9uKCBtZXNzYWdlLCBvcHRpb25zICkge1xyXG4gICAgICAgIG9wdGlvbnMgPSBfLmFzc2lnbkluKCB7XHJcbiAgICAgICAgICBjb2xvcjogJyMwMDk5MDAnIC8vIGdyZWVuXHJcbiAgICAgICAgfSwgb3B0aW9ucyApO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCBgJWMke21lc3NhZ2V9YCwgYGNvbG9yOiAke29wdGlvbnMuY29sb3J9YCApOyAvLyBncmVlblxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0cyB0aGUgbmFtZSBvZiBicmFuZCB0byB1c2UsIHdoaWNoIGRldGVybWluZXMgd2hpY2ggbG9nbyB0byBzaG93IGluIHRoZSBuYXZiYXIgYXMgd2VsbCBhcyB3aGF0IG9wdGlvbnNcclxuICAgICAqIHRvIHNob3cgaW4gdGhlIFBoRVQgbWVudSBhbmQgd2hhdCB0ZXh0IHRvIHNob3cgaW4gdGhlIEFib3V0IGRpYWxvZy5cclxuICAgICAqIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYnJhbmQvaXNzdWVzLzExXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICB3aW5kb3cucGhldC5jaGlwcGVyLmJyYW5kID0gd2luZG93LnBoZXQuY2hpcHBlci5icmFuZCB8fCBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmJyYW5kIHx8ICdhZGFwdGVkLWZyb20tcGhldCc7XHJcblxyXG4gICAgLy8ge3N0cmluZ3xudWxsfSAtIFNlZSBkb2N1bWVudGF0aW9uIG9mIHN0cmluZ1Rlc3QgcXVlcnkgcGFyYW1ldGVyIC0gd2UgbmVlZCB0byBzdXBwb3J0IHRoaXMgZHVyaW5nIGJ1aWxkLCB3aGVyZVxyXG4gICAgLy8gICAgICAgICAgICAgICAgIHRoZXJlIGFyZW4ndCBhbnkgcXVlcnkgcGFyYW1ldGVycy5cclxuICAgIGNvbnN0IHN0cmluZ1Rlc3QgPSAoIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuc3RyaW5nVGVzdCApID9cclxuICAgICAgICAgICAgICAgICAgICAgICBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLnN0cmluZ1Rlc3QgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgIG51bGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNYXBzIGFuIGlucHV0IHN0cmluZyB0byBhIGZpbmFsIHN0cmluZywgYWNjb21tb2RhdGluZyB0cmlja3MgbGlrZSBkb3VibGVTdHJpbmdzLlxyXG4gICAgICogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIHRvIG1vZGlmeSBhbGwgc3RyaW5ncyBpbiBhIHNpbSB3aGVuIHRoZSBzdHJpbmdUZXN0IHF1ZXJ5IHBhcmFtZXRlciBpcyB1c2VkLlxyXG4gICAgICogVGhlIHN0cmluZ1Rlc3QgcXVlcnkgcGFyYW1ldGVyIGFuZCBpdHMgb3B0aW9ucyBhcmUgZG9jdW1lbnRlZCBpbiB0aGUgcXVlcnkgcGFyYW1ldGVyIGRvY3MgYWJvdmUuXHJcbiAgICAgKiBJdCBpcyB1c2VkIGluIHN0cmluZy5qcyBhbmQgc2ltLmh0bWwuXHJcbiAgICAgKiBAcGFyYW0gc3RyaW5nIC0gdGhlIHN0cmluZyB0byBiZSBtYXBwZWRcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIHdpbmRvdy5waGV0LmNoaXBwZXIubWFwU3RyaW5nID0gZnVuY3Rpb24oIHN0cmluZyApIHtcclxuICAgICAgY29uc3Qgc2NyaXB0ID0gJ3NjcmlwdCc7XHJcbiAgICAgIHJldHVybiBzdHJpbmdUZXN0ID09PSBudWxsID8gc3RyaW5nIDpcclxuICAgICAgICAgICAgIHN0cmluZ1Rlc3QgPT09ICdkb3VibGUnID8gYCR7c3RyaW5nfToke3N0cmluZ31gIDpcclxuICAgICAgICAgICAgIHN0cmluZ1Rlc3QgPT09ICdsb25nJyA/ICcxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MCcgOlxyXG4gICAgICAgICAgICAgc3RyaW5nVGVzdCA9PT0gJ3J0bCcgPyAnXFx1MjAyYlxcdTA2MmFcXHUwNjMzXFx1MDYyYSAoXFx1MDYzMlxcdTA2MjhcXHUwNjI3XFx1MDY0NilcXHUyMDJjJyA6XHJcbiAgICAgICAgICAgICBzdHJpbmdUZXN0ID09PSAneHNzJyA/IGAke3N0cmluZ308aW1nIHNyYz1cImRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQUVBQUFBQkNBWUFBQUFmRmNTSkFBQUFEVWxFUVZRSVcyTmtZR0Q0RHdBQkNRRUJ0eG1ON3dBQUFBQkpSVTVFcmtKZ2dnPT1cIiBvbmxvYWQ9XCJ3aW5kb3cubG9jYXRpb24uaHJlZj1hdG9iKCdhSFIwY0hNNkx5OTNkM2N1ZVc5MWRIVmlaUzVqYjIwdmQyRjBZMmcvZGoxa1VYYzBkemxYWjFoalVRPT0nKVwiIC8+YCA6XHJcbiAgICAgICAgICAgICBzdHJpbmdUZXN0ID09PSAneHNzMicgPyBgJHtzdHJpbmd9PCR7c2NyaXB0fT5hbGVydCgnWFNTJyk8LyR7c2NyaXB0fT5gIDpcclxuICAgICAgICAgICAgIHN0cmluZ1Rlc3QgPT09ICdub25lJyA/IHN0cmluZyA6XHJcbiAgICAgICAgICAgICBzdHJpbmdUZXN0ID09PSAnZHluYW1pYycgPyBzdHJpbmcgOlxyXG5cclxuICAgICAgICAgICAgICAgLy8gSW4gdGhlIGZhbGxiYWNrIGNhc2UsIHN1cHBseSB3aGF0ZXZlciBzdHJpbmcgd2FzIGdpdmVuIGluIHRoZSBxdWVyeSBwYXJhbWV0ZXIgdmFsdWVcclxuICAgICAgICAgICAgIHN0cmluZ1Rlc3Q7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIFdlIHdpbGwgbmVlZCB0byBjaGVjayBmb3IgbG9jYWxlIHZhbGlkaXR5IChvbmNlIHdlIGhhdmUgbG9jYWxlRGF0YSBsb2FkZWQsIGlmIHJ1bm5pbmcgdW5idWlsdCksIGFuZCBwb3RlbnRpYWxseVxyXG4gICAgLy8gZWl0aGVyIGZhbGwgYmFjayB0byBgZW5gLCBvciByZW1hcCBmcm9tIDMtY2hhcmFjdGVyIGxvY2FsZXMgdG8gb3VyIGxvY2FsZSBrZXlzLlxyXG4gICAgcGhldC5jaGlwcGVyLmNoZWNrQW5kUmVtYXBMb2NhbGUgPSAoKSA9PiB7XHJcbiAgICAgIC8vIFdlIG5lZWQgYm90aCB0byBwcm9jZWVkLiBQcm92aWRlZCBhcyBhIGdsb2JhbCwgc28gd2UgY2FuIGNhbGwgaXQgZnJvbSBsb2FkLXVuYnVpbHQtc3RyaW5nc1xyXG4gICAgICAvLyAoSUYgaW5pdGlhbGl6ZS1nbG9iYWxzIGxvYWRzIGZpcnN0KVxyXG4gICAgICBpZiAoICFwaGV0LmNoaXBwZXIubG9jYWxlRGF0YSB8fCAhcGhldC5jaGlwcGVyLmxvY2FsZSApIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGxldCBsb2NhbGUgPSBwaGV0LmNoaXBwZXIubG9jYWxlO1xyXG5cclxuICAgICAgaWYgKCBsb2NhbGUgKSB7XHJcbiAgICAgICAgaWYgKCBsb2NhbGUubGVuZ3RoIDwgNSApIHtcclxuICAgICAgICAgIGxvY2FsZSA9IGxvY2FsZS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGxvY2FsZSA9IGxvY2FsZS5yZXBsYWNlKCAvLS8sICdfJyApO1xyXG5cclxuICAgICAgICAgIGNvbnN0IHBhcnRzID0gbG9jYWxlLnNwbGl0KCAnXycgKTtcclxuICAgICAgICAgIGlmICggcGFydHMubGVuZ3RoID09PSAyICkge1xyXG4gICAgICAgICAgICBsb2NhbGUgPSBwYXJ0c1sgMCBdLnRvTG93ZXJDYXNlKCkgKyAnXycgKyBwYXJ0c1sgMSBdLnRvVXBwZXJDYXNlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIGxvY2FsZS5sZW5ndGggPT09IDMgKSB7XHJcbiAgICAgICAgICBmb3IgKCBjb25zdCBjYW5kaWRhdGVMb2NhbGUgb2YgT2JqZWN0LmtleXMoIHBoZXQuY2hpcHBlci5sb2NhbGVEYXRhICkgKSB7XHJcbiAgICAgICAgICAgIGlmICggcGhldC5jaGlwcGVyLmxvY2FsZURhdGFbIGNhbmRpZGF0ZUxvY2FsZSBdLmxvY2FsZTMgPT09IGxvY2FsZSApIHtcclxuICAgICAgICAgICAgICBsb2NhbGUgPSBjYW5kaWRhdGVMb2NhbGU7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggIXBoZXQuY2hpcHBlci5sb2NhbGVEYXRhWyBsb2NhbGUgXSApIHtcclxuICAgICAgICBjb25zdCBiYWRMb2NhbGUgPSBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmxvY2FsZTtcclxuXHJcbiAgICAgICAgY29uc3QgaXNQYWlyID0gL15bYS16XXsyfSQvLnRlc3QoIGJhZExvY2FsZSApO1xyXG4gICAgICAgIGNvbnN0IGlzVHJpcGxlID0gL15bYS16XXszfSQvLnRlc3QoIGJhZExvY2FsZSApO1xyXG4gICAgICAgIGNvbnN0IGlzUGFpcl9QQUlSID0gL15bYS16XXsyfV9bQS1aXXsyfSQvLnRlc3QoIGJhZExvY2FsZSApO1xyXG5cclxuICAgICAgICBpZiAoICFpc1BhaXIgJiYgIWlzVHJpcGxlICYmICFpc1BhaXJfUEFJUiApIHtcclxuICAgICAgICAgIFF1ZXJ5U3RyaW5nTWFjaGluZS5hZGRXYXJuaW5nKCAnbG9jYWxlJywgcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5sb2NhbGUsIGBJbnZhbGlkIGxvY2FsZSBmb3JtYXQgcmVjZWl2ZWQ6ICR7YmFkTG9jYWxlfS4gP2xvY2FsZSBxdWVyeSBwYXJhbWV0ZXIgYWNjZXB0cyB0aGUgZm9sbG93aW5nIGZvcm1hdHM6IFwieHhcIiBmb3IgSVNPLTYzOS0xLCBcInh4X1hYXCIgZm9yIElTTy02MzktMSBhbmQgYSAyLWxldHRlciBjb3VudHJ5IGNvZGUsIFwieHh4XCIgZm9yIElTTy02MzktMmAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxvY2FsZSA9ICdlbic7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHBoZXQuY2hpcHBlci5sb2NhbGUgPSBsb2NhbGU7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIElmIGxvY2FsZSB3YXMgcHJvdmlkZWQgYXMgYSBxdWVyeSBwYXJhbWV0ZXIsIHRoZW4gY2hhbmdlIHRoZSBsb2NhbGUgdXNlZCBieSBHb29nbGUgQW5hbHl0aWNzLlxyXG4gICAgaWYgKCBRdWVyeVN0cmluZ01hY2hpbmUuY29udGFpbnNLZXkoICdsb2NhbGUnICkgKSB7XHJcbiAgICAgIHBoZXQuY2hpcHBlci5sb2NhbGUgPSBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmxvY2FsZTtcclxuXHJcbiAgICAgIC8vIE5PVEU6IElmIHdlIGFyZSBsb2FkaW5nIGluIHVuYnVpbHQgbW9kZSwgdGhpcyBtYXkgZXhlY3V0ZSBCRUZPUkUgd2UgaGF2ZSBsb2FkZWQgbG9jYWxlRGF0YS4gV2UgaGF2ZSBhIHNpbWlsYXJcclxuICAgICAgLy8gcmVtYXBwaW5nIGluIGxvYWQtdW5idWlsdC1zdHJpbmdzIHdoZW4gdGhpcyBoYXBwZW5zLlxyXG4gICAgICBwaGV0LmNoaXBwZXIuY2hlY2tBbmRSZW1hcExvY2FsZSgpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoICF3aW5kb3cucGhldC5jaGlwcGVyLmxvY2FsZSApIHtcclxuICAgICAgLy8gRmlsbCBpbiBhIGRlZmF1bHRcclxuICAgICAgd2luZG93LnBoZXQuY2hpcHBlci5sb2NhbGUgPSAnZW4nO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHN0cmluZ092ZXJyaWRlcyA9IEpTT04ucGFyc2UoIHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuc3RyaW5ncyB8fCAne30nICk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgYSBzdHJpbmcgZ2l2ZW4gdGhlIGtleS4gVGhpcyBpbXBsZW1lbnRhdGlvbiBpcyBtZWFudCBmb3IgdXNlIG9ubHkgaW4gdGhlIGJ1aWxkIHNpbS4gRm9yIG1vcmUgaW5mbyBzZWUgdGhlXHJcbiAgICAgKiBzdHJpbmcgcGx1Z2luLlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleSAtIGxpa2UgXCJSRVBPL3N0cmluZy5rZXkuaGVyZVwiIHdoaWNoIGluY2x1ZGVzIHRoZSByZXF1aXJlanNOYW1lc3BhY2UsIHdoaWNoIGlzIHNwZWNpZmllZCBpbiBwYWNrYWdlLmpzb25cclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIHBoZXQuY2hpcHBlci5nZXRTdHJpbmdGb3JCdWlsdFNpbSA9IGtleSA9PiB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoICEhcGhldC5jaGlwcGVyLmlzUHJvZHVjdGlvbiwgJ2V4cGVjdGVkIHRvIGJlIHJ1bm5pbmcgYSBidWlsdCBzaW0nICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoICEhcGhldC5jaGlwcGVyLnN0cmluZ3MsICdwaGV0LmNoaXBwZXIuc3RyaW5ncyBzaG91bGQgYmUgZmlsbGVkIG91dCBieSBpbml0aWFsaXphdGlvbiBzY3JpcHQnICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoICEhcGhldC5jaGlwcGVyLmxvY2FsZSwgJ2xvY2FsZSBpcyByZXF1aXJlZCB0byBsb29rIHVwIHRoZSBjb3JyZWN0IHN0cmluZ3MnICk7XHJcblxyXG4gICAgICAvLyBvdmVycmlkZSBzdHJpbmdzIHZpYSB0aGUgJ3N0cmluZ3MnIHF1ZXJ5IHBhcmFtZXRlclxyXG4gICAgICBpZiAoIHN0cmluZ092ZXJyaWRlc1sga2V5IF0gKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0cmluZ092ZXJyaWRlc1sga2V5IF07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEdldCBhIGxpc3Qgb2YgbG9jYWxlcyBpbiB0aGUgb3JkZXIgdGhleSBzaG91bGQgYmUgc2VhcmNoZWRcclxuICAgICAgY29uc3QgZmFsbGJhY2tMb2NhbGVzID0gW1xyXG4gICAgICAgIHBoZXQuY2hpcHBlci5sb2NhbGUsXHJcbiAgICAgICAgLi4uKCBwaGV0LmNoaXBwZXIubG9jYWxlRGF0YVsgcGhldC5jaGlwcGVyLmxvY2FsZSBdPy5mYWxsYmFja0xvY2FsZXMgfHwgW10gKSxcclxuICAgICAgICAoIHBoZXQuY2hpcHBlci5sb2NhbGUgIT09ICdlbicgPyBbICdlbicgXSA6IFtdIClcclxuICAgICAgXTtcclxuXHJcbiAgICAgIGxldCBzdHJpbmdNYXAgPSBudWxsO1xyXG5cclxuICAgICAgZm9yICggY29uc3QgbG9jYWxlIG9mIGZhbGxiYWNrTG9jYWxlcyApIHtcclxuICAgICAgICBzdHJpbmdNYXAgPSBwaGV0LmNoaXBwZXIuc3RyaW5nc1sgbG9jYWxlIF07XHJcbiAgICAgICAgaWYgKCBzdHJpbmdNYXAgKSB7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBwaGV0LmNoaXBwZXIubWFwU3RyaW5nKCBzdHJpbmdNYXBbIGtleSBdICk7XHJcbiAgICB9O1xyXG4gIH0oKSApO1xyXG5cclxuICAvKipcclxuICAgKiBVdGlsaXR5IGZ1bmN0aW9uIHRvIHBhdXNlIHN5bmNocm9ub3VzbHkgZm9yIHRoZSBnaXZlbiBudW1iZXIgb2YgbWlsbGlzZWNvbmRzLlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtaWxsaXMgLSBhbW91bnQgb2YgdGltZSB0byBwYXVzZSBzeW5jaHJvbm91c2x5XHJcbiAgICovXHJcbiAgZnVuY3Rpb24gc2xlZXAoIG1pbGxpcyApIHtcclxuICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgbGV0IGN1ckRhdGU7XHJcbiAgICBkbyB7XHJcbiAgICAgIGN1ckRhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgfSB3aGlsZSAoIGN1ckRhdGUgLSBkYXRlIDwgbWlsbGlzICk7XHJcbiAgfVxyXG5cclxuICAvKlxyXG4gICAqIFRoZXNlIGFyZSB1c2VkIHRvIG1ha2Ugc3VyZSBvdXIgc2ltcyBzdGlsbCBiZWhhdmUgcHJvcGVybHkgd2l0aCBhbiBhcnRpZmljaWFsbHkgaGlnaGVyIGxvYWQgKHNvIHdlIGNhbiB0ZXN0IHdoYXQgaGFwcGVuc1xyXG4gICAqIGF0IDMwZnBzLCA1ZnBzLCBldGMpLiBUaGVyZSB0ZW5kIHRvIGJlIGJ1Z3MgdGhhdCBvbmx5IGhhcHBlbiBvbiBsZXNzLXBvd2VyZnVsIGRldmljZXMsIGFuZCB0aGVzZSBmdW5jdGlvbnMgZmFjaWxpdGF0ZVxyXG4gICAqIHRlc3RpbmcgYSBzaW0gZm9yIHJvYnVzdG5lc3MsIGFuZCBhbGxvd2luZyBvdGhlcnMgdG8gcmVwcm9kdWNlIHNsb3ctYmVoYXZpb3IgYnVncy5cclxuICAgKi9cclxuICB3aW5kb3cucGhldC5jaGlwcGVyLm1ha2VFdmVyeXRoaW5nU2xvdyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgd2luZG93LnNldEludGVydmFsKCAoKSA9PiB7IHNsZWVwKCA2NCApOyB9LCAxNiApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJhZC1zaW0tdGV4dFxyXG4gIH07XHJcbiAgd2luZG93LnBoZXQuY2hpcHBlci5tYWtlUmFuZG9tU2xvd25lc3MgPSBmdW5jdGlvbigpIHtcclxuICAgIHdpbmRvdy5zZXRJbnRlcnZhbCggKCkgPT4geyBzbGVlcCggTWF0aC5jZWlsKCAxMDAgKyBNYXRoLnJhbmRvbSgpICogMjAwICkgKTsgfSwgTWF0aC5jZWlsKCAxMDAgKyBNYXRoLnJhbmRvbSgpICogMjAwICkgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBiYWQtc2ltLXRleHRcclxuICB9O1xyXG5cclxuICAvLyBBcmUgd2UgcnVubmluZyBhIGJ1aWx0IGh0bWwgZmlsZT9cclxuICB3aW5kb3cucGhldC5jaGlwcGVyLmlzUHJvZHVjdGlvbiA9ICQoICdtZXRhW25hbWU9cGhldC1zaW0tbGV2ZWxdJyApLmF0dHIoICdjb250ZW50JyApID09PSAncHJvZHVjdGlvbic7XHJcblxyXG4gIC8vIEFyZSB3ZSBydW5uaW5nIGluIGFuIGFwcD9cclxuICB3aW5kb3cucGhldC5jaGlwcGVyLmlzQXBwID0gcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVyc1sgJ3BoZXQtYXBwJyBdIHx8IHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnNbICdwaGV0LWFuZHJvaWQtYXBwJyBdO1xyXG5cclxuICAvKipcclxuICAgKiBBbiBJSUZFIGhlcmUgaGVscHMgY2FwdHVyZSB2YXJpYWJsZXMgaW4gZmluYWwgbG9naWMgbmVlZGVkIGluIHRoZSBnbG9iYWwsIHByZWxvYWQgc2NvcGUgZm9yIHRoZSBwaGV0c2ltIGVudmlyb25tZW50LlxyXG4gICAqXHJcbiAgICogRW5hYmxlcyBvciBkaXNhYmxlcyBhc3NlcnRpb25zIGluIGNvbW1vbiBsaWJyYXJpZXMgdXNpbmcgcXVlcnkgcGFyYW1ldGVycy5cclxuICAgKiBUaGVyZSBhcmUgdHdvIHR5cGVzIG9mIGFzc2VydGlvbnM6IGJhc2ljIGFuZCBzbG93LiBFbmFibGluZyBzbG93IGFzc2VydGlvbnMgd2lsbCBhZHZlcnNlbHkgaW1wYWN0IHBlcmZvcm1hbmNlLlxyXG4gICAqICdlYScgZW5hYmxlcyBiYXNpYyBhc3NlcnRpb25zLCAnZWFsbCcgZW5hYmxlcyBiYXNpYyBhbmQgc2xvdyBhc3NlcnRpb25zLlxyXG4gICAqIE11c3QgYmUgcnVuIGJlZm9yZSB0aGUgbWFpbiBtb2R1bGVzLCBhbmQgYXNzdW1lcyB0aGF0IGFzc2VydC5qcyBhbmQgcXVlcnktcGFyYW1ldGVycy5qcyBoYXMgYmVlbiBydW4uXHJcbiAgICovXHJcbiAgKCBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAvLyBlbmFibGVzIGFsbCBhc3NlcnRpb25zIChiYXNpYyBhbmQgc2xvdylcclxuICAgIGNvbnN0IGVuYWJsZUFsbEFzc2VydGlvbnMgPSAhcGhldC5jaGlwcGVyLmlzUHJvZHVjdGlvbiAmJiBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmVhbGw7XHJcblxyXG4gICAgLy8gZW5hYmxlcyBiYXNpYyBhc3NlcnRpb25zXHJcbiAgICBjb25zdCBlbmFibGVCYXNpY0Fzc2VydGlvbnMgPSBlbmFibGVBbGxBc3NlcnRpb25zIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoICFwaGV0LmNoaXBwZXIuaXNQcm9kdWN0aW9uICYmIHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuZWEgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGhldC5jaGlwcGVyLmlzRGVidWdCdWlsZDtcclxuXHJcbiAgICBpZiAoIGVuYWJsZUJhc2ljQXNzZXJ0aW9ucyApIHtcclxuICAgICAgd2luZG93LmFzc2VydGlvbnMuZW5hYmxlQXNzZXJ0KCk7XHJcbiAgICB9XHJcbiAgICBpZiAoIGVuYWJsZUFsbEFzc2VydGlvbnMgKSB7XHJcbiAgICAgIHdpbmRvdy5hc3NlcnRpb25zLmVuYWJsZUFzc2VydFNsb3coKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNlbmRzIGEgbWVzc2FnZSB0byBhIGNvbnRpbnVvdXMgdGVzdGluZyBjb250YWluZXIuXHJcbiAgICAgKiBAcHVibGljXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIFNwZWNpZmljIG9iamVjdCByZXN1bHRzIHNlbnQgdG8gQ1QuXHJcbiAgICAgKi9cclxuICAgIHdpbmRvdy5waGV0LmNoaXBwZXIucmVwb3J0Q29udGludW91c1Rlc3RSZXN1bHQgPSBvcHRpb25zID0+IHtcclxuICAgICAgd2luZG93LnBhcmVudCAmJiB3aW5kb3cucGFyZW50LnBvc3RNZXNzYWdlKCBKU09OLnN0cmluZ2lmeSggXy5hc3NpZ25Jbigge1xyXG4gICAgICAgIGNvbnRpbnVvdXNUZXN0OiBKU09OLnBhcnNlKCBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmNvbnRpbnVvdXNUZXN0ICksXHJcbiAgICAgICAgdXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZlxyXG4gICAgICB9LCBvcHRpb25zICkgKSwgJyonICk7XHJcbiAgICB9O1xyXG5cclxuICAgIGlmICggcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5jb250aW51b3VzVGVzdCApIHtcclxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdlcnJvcicsIGEgPT4ge1xyXG4gICAgICAgIGxldCBtZXNzYWdlID0gJyc7XHJcbiAgICAgICAgbGV0IHN0YWNrID0gJyc7XHJcbiAgICAgICAgaWYgKCBhICYmIGEubWVzc2FnZSApIHtcclxuICAgICAgICAgIG1lc3NhZ2UgPSBhLm1lc3NhZ2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggYSAmJiBhLmVycm9yICYmIGEuZXJyb3Iuc3RhY2sgKSB7XHJcbiAgICAgICAgICBzdGFjayA9IGEuZXJyb3Iuc3RhY2s7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHBoZXQuY2hpcHBlci5yZXBvcnRDb250aW51b3VzVGVzdFJlc3VsdCgge1xyXG4gICAgICAgICAgdHlwZTogJ2NvbnRpbnVvdXMtdGVzdC1lcnJvcicsXHJcbiAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxyXG4gICAgICAgICAgc3RhY2s6IHN0YWNrXHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9ICk7XHJcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAnYmVmb3JldW5sb2FkJywgZSA9PiB7XHJcbiAgICAgICAgcGhldC5jaGlwcGVyLnJlcG9ydENvbnRpbnVvdXNUZXN0UmVzdWx0KCB7XHJcbiAgICAgICAgICB0eXBlOiAnY29udGludW91cy10ZXN0LXVubG9hZCdcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH0gKTtcclxuICAgICAgLy8gd2luZG93Lm9wZW4gc3R1Yi4gb3RoZXJ3aXNlIHdlIGdldCB0b25zIG9mIFwiUmVwb3J0IFByb2JsZW0uLi5cIiBwb3B1cHMgdGhhdCBzdGFsbFxyXG4gICAgICB3aW5kb3cub3BlbiA9ICgpID0+IHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgZm9jdXM6ICgpID0+IHt9LFxyXG4gICAgICAgICAgYmx1cjogKCkgPT4ge31cclxuICAgICAgICB9O1xyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENvbW11bmljYXRlIHNpbSBlcnJvcnMgdG8gQ1Qgb3Igb3RoZXIgbGlzdGVuaW5nIHBhcmVudCBmcmFtZXNcclxuICAgIGlmICggcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5wb3N0TWVzc2FnZU9uRXJyb3IgKSB7XHJcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAnZXJyb3InLCBhID0+IHtcclxuICAgICAgICBsZXQgbWVzc2FnZSA9ICcnO1xyXG4gICAgICAgIGxldCBzdGFjayA9ICcnO1xyXG4gICAgICAgIGlmICggYSAmJiBhLm1lc3NhZ2UgKSB7XHJcbiAgICAgICAgICBtZXNzYWdlID0gYS5tZXNzYWdlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIGEgJiYgYS5lcnJvciAmJiBhLmVycm9yLnN0YWNrICkge1xyXG4gICAgICAgICAgc3RhY2sgPSBhLmVycm9yLnN0YWNrO1xyXG4gICAgICAgIH1cclxuICAgICAgICB3aW5kb3cucGFyZW50ICYmIHdpbmRvdy5wYXJlbnQucG9zdE1lc3NhZ2UoIEpTT04uc3RyaW5naWZ5KCB7XHJcbiAgICAgICAgICB0eXBlOiAnZXJyb3InLFxyXG4gICAgICAgICAgdXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZixcclxuICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXHJcbiAgICAgICAgICBzdGFjazogc3RhY2tcclxuICAgICAgICB9ICksICcqJyApO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLnBvc3RNZXNzYWdlT25CZWZvcmVVbmxvYWQgKSB7XHJcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAnYmVmb3JldW5sb2FkJywgZSA9PiB7XHJcbiAgICAgICAgd2luZG93LnBhcmVudCAmJiB3aW5kb3cucGFyZW50LnBvc3RNZXNzYWdlKCBKU09OLnN0cmluZ2lmeSgge1xyXG4gICAgICAgICAgdHlwZTogJ2JlZm9yZVVubG9hZCdcclxuICAgICAgICB9ICksICcqJyApO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcbiAgfSgpICk7XHJcblxyXG4gICggKCkgPT4ge1xyXG4gICAgLy8gVmFsaWRhdGlvbiBsb2dpYyBvbiB0aGUgc2ltRmVhdHVyZXMgc2VjdGlvbiBvZiB0aGUgcGFja2FnZUpTT04sIG1hbnkgb2Ygd2hpY2ggYXJlIHVzZWQgaW4gc2ltcywgYW5kIHNob3VsZCBiZVxyXG4gICAgLy8gZGVmaW5lZCBjb3JyZWN0bHkgZm9yIHRoZSBzaW0gdG8gcnVuLlxyXG5cclxuICAgIGNvbnN0IHNpbUZlYXR1cmVzU2NoZW1hID0ge1xyXG4gICAgICBzdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb246IHsgdHlwZTogJ2Jvb2xlYW4nIH0sXHJcbiAgICAgIHN1cHBvcnRzVm9pY2luZzogeyB0eXBlOiAnYm9vbGVhbicgfSxcclxuICAgICAgc3VwcG9ydHNJbnRlcmFjdGl2ZUhpZ2hsaWdodHM6IHsgdHlwZTogJ2Jvb2xlYW4nIH0sXHJcbiAgICAgIHN1cHBvcnRzRGVzY3JpcHRpb25QbHVnaW46IHsgdHlwZTogJ2Jvb2xlYW4nIH0sXHJcbiAgICAgIHN1cHBvcnRzU291bmQ6IHsgdHlwZTogJ2Jvb2xlYW4nIH0sXHJcbiAgICAgIHN1cHBvcnRzRXh0cmFTb3VuZDogeyB0eXBlOiAnYm9vbGVhbicgfSxcclxuICAgICAgc3VwcG9ydHNEeW5hbWljTG9jYWxlOiB7IHR5cGU6ICdib29sZWFuJyB9LFxyXG4gICAgICBjb2xvclByb2ZpbGVzOiB7IHR5cGU6ICdhcnJheScgfSxcclxuICAgICAgc3VwcG9ydGVkUmVnaW9uc0FuZEN1bHR1cmVzOiB7IHR5cGU6ICdhcnJheScgfSxcclxuICAgICAgZGVmYXVsdFJlZ2lvbkFuZEN1bHR1cmU6IHsgdHlwZTogJ3N0cmluZycgfSxcclxuICAgICAgc3RyaWN0QXhvbkRlcGVuZGVuY2llczogeyB0eXBlOiAnYm9vbGVhbicgfVxyXG4gICAgfTtcclxuXHJcbiAgICBPYmplY3Qua2V5cyggc2ltRmVhdHVyZXNTY2hlbWEgKS5mb3JFYWNoKCBzY2hlbWFLZXkgPT4ge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhcGFja2FnZVBoZXQuaGFzT3duUHJvcGVydHkoIHNjaGVtYUtleSApLFxyXG4gICAgICAgIGAke3NjaGVtYUtleX0gaXMgYSBzaW0gZmVhdHVyZSBhbmQgc2hvdWxkIGJlIGluIFwic2ltRmVhdHVyZXNcIiBpbiB0aGUgcGFja2FnZS5qc29uYCApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFwYWNrYWdlT2JqZWN0Lmhhc093blByb3BlcnR5KCAnc2ltRmVhdHVyZXMnICksICdzaW1GZWF0dXJlcyBtdXN0IGJlIG5lc3RlZCB1bmRlciBcXCdwaGV0XFwnJyApO1xyXG4gICAgaWYgKCBwYWNrYWdlUGhldC5oYXNPd25Qcm9wZXJ0eSggJ3NpbUZlYXR1cmVzJyApICkge1xyXG4gICAgICBjb25zdCBzaW1GZWF0dXJlcyA9IHBhY2thZ2VQaGV0LnNpbUZlYXR1cmVzO1xyXG4gICAgICBPYmplY3Qua2V5cyggc2ltRmVhdHVyZXMgKS5mb3JFYWNoKCBzaW1GZWF0dXJlTmFtZSA9PiB7XHJcbiAgICAgICAgY29uc3Qgc2ltRmVhdHVyZVZhbHVlID0gc2ltRmVhdHVyZXNbIHNpbUZlYXR1cmVOYW1lIF07XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggc2ltRmVhdHVyZXNTY2hlbWEuaGFzT3duUHJvcGVydHkoIHNpbUZlYXR1cmVOYW1lICksIGB1bnN1cHBvcnRlZCBzaW0gZmVhdHVyZTogJHtzaW1GZWF0dXJlTmFtZX1gICk7XHJcbiAgICAgICAgaWYgKCBzaW1GZWF0dXJlc1NjaGVtYVsgc2ltRmVhdHVyZU5hbWUgXSApIHtcclxuXHJcbiAgICAgICAgICBpZiAoIHNpbUZlYXR1cmVzU2NoZW1hWyBzaW1GZWF0dXJlTmFtZS50eXBlIF0gPT09ICdib29sZWFuJyApIHtcclxuICAgICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIHNpbUZlYXR1cmVWYWx1ZSA9PT0gJ2Jvb2xlYW4nLCBgYm9vbGVhbiB2YWx1ZSBleHBlY3RlZCBmb3IgJHtzaW1GZWF0dXJlTmFtZX1gICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIGlmICggc2ltRmVhdHVyZXNTY2hlbWFbIHNpbUZlYXR1cmVOYW1lLnR5cGUgXSA9PT0gJ2FycmF5JyApIHtcclxuICAgICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggQXJyYXkuaXNBcnJheSggc2ltRmVhdHVyZVZhbHVlICksIGBhcnJheSB2YWx1ZSBleHBlY3RlZCBmb3IgJHtzaW1GZWF0dXJlTmFtZX1gICk7XHJcblxyXG4gICAgICAgICAgICAvLyBBdCB0aGlzIHRpbWUsIGFsbCBhcnJheXMgYXJlIGFzc3VtZWQgdG8gb25seSBzdXBwb3J0IHN0cmluZ3NcclxuICAgICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggXy5ldmVyeSggc2ltRmVhdHVyZVZhbHVlLCB2YWx1ZSA9PiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICksIGBzdHJpbmcgZW50cnkgZXhwZWN0ZWQgZm9yICR7c2ltRmVhdHVyZU5hbWV9YCApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG4gICAgfVxyXG4gIH0gKSgpO1xyXG59KCkgKTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDRSxXQUFBQSxxQkFBQSxFQUFBQyxzQkFBQSxFQUFBQyxzQkFBQSxFQUFBQyxzQkFBQSxFQUFXO0VBR1hDLE1BQU0sSUFBSUEsTUFBTSxDQUFFQyxNQUFNLENBQUNDLGtCQUFrQixFQUFFLHdFQUF5RSxDQUFDOztFQUV2SDtFQUNBLElBQU1DLGFBQWEsR0FB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