// Copyright 2013-2024, University of Colorado Boulder

/**
 * Main class that represents one simulation.
 * Provides default initialization, such as polyfills as well.
 * If the simulation has only one screen, then there is no homescreen, home icon or screen icon in the navigation bar.
 *
 * The type for the contained Screen instances is Screen<any,any> since we do not want to parameterize Sim<[{M1,V1},{M2,V2}]
 * etc.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import animationFrameTimer from '../../axon/js/animationFrameTimer.js';
import BooleanProperty from '../../axon/js/BooleanProperty.js';
import createObservableArray from '../../axon/js/createObservableArray.js';
import DerivedProperty from '../../axon/js/DerivedProperty.js';
import Emitter from '../../axon/js/Emitter.js';
import NumberProperty from '../../axon/js/NumberProperty.js';
import Property from '../../axon/js/Property.js';
import stepTimer from '../../axon/js/stepTimer.js';
import LocalizedStringProperty from '../../chipper/js/LocalizedStringProperty.js';
import Bounds2 from '../../dot/js/Bounds2.js';
import Dimension2 from '../../dot/js/Dimension2.js';
import Random from '../../dot/js/Random.js';
import DotUtils from '../../dot/js/Utils.js'; // eslint-disable-line default-import-match-filename
import platform from '../../phet-core/js/platform.js';
import optionize from '../../phet-core/js/optionize.js';
import StringUtils from '../../phetcommon/js/util/StringUtils.js';
import BarrierRectangle from '../../scenery-phet/js/BarrierRectangle.js';
import { animatedPanZoomSingleton, Color, globalKeyStateTracker, HighlightPath, Node, Utils, voicingManager, voicingUtteranceQueue } from '../../scenery/js/imports.js';
import '../../sherpa/lib/game-up-camera-1.0.0.js';
import soundManager from '../../tambo/js/soundManager.js';
import PhetioAction from '../../tandem/js/PhetioAction.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';
import Tandem from '../../tandem/js/Tandem.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import audioManager from './audioManager.js';
import Heartbeat from './Heartbeat.js';
import Helper from './Helper.js';
import HomeScreen from './HomeScreen.js';
import HomeScreenView from './HomeScreenView.js';
import joist from './joist.js';
import JoistStrings from './JoistStrings.js';
import LookAndFeel from './LookAndFeel.js';
import MemoryMonitor from './MemoryMonitor.js';
import NavigationBar from './NavigationBar.js';
import packageJSON from './packageJSON.js';
import PreferencesModel from './preferences/PreferencesModel.js';
import Profiler from './Profiler.js';
import QueryParametersWarningDialog from './QueryParametersWarningDialog.js';
import Screen from './Screen.js';
import ScreenSelectionSoundGenerator from './ScreenSelectionSoundGenerator.js';
import ScreenshotGenerator from './ScreenshotGenerator.js';
import selectScreens from './selectScreens.js';
import SimDisplay from './SimDisplay.js';
import SimInfo from './SimInfo.js';
import LegendsOfLearningSupport from './thirdPartySupport/LegendsOfLearningSupport.js';
import Toolbar from './toolbar/Toolbar.js';
import updateCheck from './updateCheck.js';
import Multilink from '../../axon/js/Multilink.js';
import Combination from '../../dot/js/Combination.js';
import Permutation from '../../dot/js/Permutation.js';
import ArrayIO from '../../tandem/js/types/ArrayIO.js';
import isSettingPhetioStateProperty from '../../tandem/js/isSettingPhetioStateProperty.js';
import StringIO from '../../tandem/js/types/StringIO.js';

// constants
const PROGRESS_BAR_WIDTH = 273;
const SUPPORTS_GESTURE_DESCRIPTION = platform.android || platform.mobileSafari;

// globals
phet.joist.elapsedTime = 0; // in milliseconds, use this in Tween.start for replicable playbacks

// When the simulation is going to be used to play back a recorded session, the simulation must be put into a special
// mode in which it will only update the model + view based on the playback clock events rather than the system clock.
// This must be set before the simulation is launched in order to ensure that no errant stepSimulation steps are called
// before the playback events begin.  This value is overridden for playback by PhetioEngineIO.
// (phet-io)
phet.joist.playbackModeEnabledProperty = new BooleanProperty(phet.chipper.queryParameters.playbackMode);
assert && assert(typeof phet.chipper.brand === 'string', 'phet.chipper.brand is required to run a sim');
export default class Sim extends PhetioObject {
  // (joist-internal)

  // Indicates sim construction completed, and that all screen models and views have been created.
  // This was added for PhET-iO but can be used by any client. This does not coincide with the end of the Sim
  // constructor (because Sim has asynchronous steps that finish after the constructor is completed)
  _isConstructionCompleteProperty = new Property(false);
  isConstructionCompleteProperty = this._isConstructionCompleteProperty;

  // Stores the effective window dimensions that the simulation will be taking up

  // Indicates when the sim resized.  This Action is implemented so it can be automatically played back.

  // (joist-internal)

  // Sim screens normally update by implementing model.step(dt) or view.step(dt).  When that is impossible or
  // relatively awkward, it is possible to listen for a callback when a frame begins, when a frame is being processed
  // or after the frame is complete.  See https://github.com/phetsims/joist/issues/534

  // Indicates when a frame starts.  Listen to this Emitter if you have an action that must be
  // performed before the step begins.
  frameStartedEmitter = new Emitter();
  frameEndedEmitter = new Emitter({
    tandem: Tandem.GENERAL_MODEL.createTandem('frameEndedEmitter'),
    phetioHighFrequency: true,
    phetioDocumentation: 'Indicates when a frame ends. Listen to this Emitter if you have an action that must be ' + 'performed after the model and view step completes.'
  });

  // Steps the simulation. This Action is implemented so it can be automatically
  // played back for PhET-iO record/playback.  Listen to this Action if you have an action that happens during the
  // simulation step.

  // the ordered list of sim-specific screens that appear in this runtime of the sim

  // all screens that appear in the runtime of this sim, with the homeScreen first if it was created

  // the displayed name in the sim. This depends on what screens are shown this runtime (effected by query parameters).

  // true if all possible screens are present (order-independent)

  // When the sim is active, scenery processes inputs and stepSimulation(dt) runs from the system clock.
  // Set to false for when the sim will be paused.
  activeProperty = new BooleanProperty(true, {
    tandem: Tandem.GENERAL_MODEL.createTandem('activeProperty'),
    phetioFeatured: true,
    phetioDocumentation: 'Determines whether the entire simulation is running and processing user input. ' + 'Setting this property to false pauses the simulation, and prevents user interaction.'
  });

  // indicates whether the browser tab containing the simulation is currently visible

  // (joist-internal) - How the home screen and navbar are scaled. This scale is based on the
  // HomeScreen's layout bounds to support a consistently sized nav bar and menu. If this scale was based on the
  // layout bounds of the current screen, there could be differences in the nav bar across screens.
  scaleProperty = new NumberProperty(1);

  // (joist-internal) global bounds for the entire simulation. null before first resize
  boundsProperty = new Property(null);

  // (joist-internal) global bounds for the screen-specific part (excludes the navigation bar), null before first resize
  screenBoundsProperty = new Property(null);
  lookAndFeel = new LookAndFeel();
  memoryMonitor = new MemoryMonitor();

  // public (read-only) {boolean} - if true, add support specific to accessible technology that work with touch devices.

  // If any sim screen has keyboard help content, trigger creation of a keyboard help button.

  // (joist-internal)
  version = packageJSON.version;

  // number of animation frames that have occurred
  frameCounter = 0;

  // Whether the window has resized since our last updateDisplay()
  resizePending = true;

  // Make our locale available
  locale = phet.chipper.locale || 'en';

  // create this only after all other members have been set on Sim

  // The Toolbar is not created unless requested with a PreferencesModel.
  toolbar = null;

  // Manages state related to preferences. Enabled features for preferences are provided through the
  // PreferencesModel.

  // list of nodes that are "modal" and hence block input with the barrierRectangle.  Used by modal dialogs
  // and the PhetMenu
  modalNodeStack = createObservableArray();

  // (joist-internal) Semi-transparent black barrier used to block input events when a dialog (or other popup)
  // is present, and fade out the background.
  barrierRectangle = new BarrierRectangle(this.modalNodeStack);

  // layer for popups, dialogs, and their backgrounds and barriers
  // TODO: How should we handle the popup for navigation? Can we set this to private? https://github.com/phetsims/joist/issues/841
  topLayer = new Node({
    children: [this.barrierRectangle]
  });

  // root node for the Display

  // Keep track of the previous time for computing dt, and initially signify that time hasn't been recorded yet.
  lastStepTime = -1;
  lastAnimationFrameTime = -1;

  // (joist-internal) Bind the animation loop so it can be called from requestAnimationFrame with the right this.

  // Stored option to control whether screen views are removed when not active

  /**
   * @param simNameProperty - the name of the simulation, to be displayed in the navbar and homescreen
   * @param allSimScreens - the possible screens for the sim in order of declaration (does not include the home screen)
   * @param [providedOptions] - see below for options
   */
  constructor(simNameProperty, allSimScreens, providedOptions) {
    window.phetSplashScreenDownloadComplete();
    assert && assert(allSimScreens.length >= 1, 'at least one screen is required');
    const options = optionize()({
      credits: {},
      // a {Node} placed onto the home screen (if available)
      homeScreenWarningNode: null,
      // If a PreferencesModel supports any preferences, the sim will include the PreferencesDialog and a
      // button in the NavigationBar to open it. Simulation conditions (like what locales are available) might enable
      // a PreferencesDialog by default. But PreferencesModel has many options you can provide.
      preferencesModel: null,
      // Passed to SimDisplay, but a top level option for API ease.
      webgl: SimDisplay.DEFAULT_WEBGL,
      detachInactiveScreenViews: false,
      // phet-io
      phetioState: false,
      phetioReadOnly: true,
      tandem: Tandem.ROOT
    }, providedOptions);
    if (!options.preferencesModel) {
      options.preferencesModel = new PreferencesModel();
    }

    // Some options are used by sim and SimDisplay. Promote webgl to top level sim option out of API ease, but it is
    // passed to the SimDisplay.
    const simDisplayOptions = {
      webgl: options.webgl,
      tandem: Tandem.GENERAL_VIEW.createTandem('display'),
      preferencesModel: options.preferencesModel
    };
    super(options);
    this.credits = options.credits;
    this.detachInactiveScreenViews = options.detachInactiveScreenViews;
    this.simNameProperty = simNameProperty;

    // playbackModeEnabledProperty cannot be changed after Sim construction has begun, hence this listener is added before
    // anything else is done, see https://github.com/phetsims/phet-io/issues/1146
    phet.joist.playbackModeEnabledProperty.lazyLink(() => {
      throw new Error('playbackModeEnabledProperty cannot be changed after Sim construction has begun');
    });
    assert && this.isConstructionCompleteProperty.lazyLink(isConstructionComplete => {
      assert && assert(isConstructionComplete, 'Sim construction should never uncomplete');
    });
    const dimensionProperty = new Property(new Dimension2(0, 0), {
      valueComparisonStrategy: 'equalsFunction'
    });

    // Note: the public API is TReadOnlyProperty
    this.dimensionProperty = dimensionProperty;
    this.resizeAction = new PhetioAction((width, height) => {
      assert && assert(width > 0 && height > 0, 'sim should have a nonzero area');
      dimensionProperty.value = new Dimension2(width, height);

      // Gracefully support bad dimensions, see https://github.com/phetsims/joist/issues/472
      if (width === 0 || height === 0) {
        return;
      }
      const scale = Math.min(width / HomeScreenView.LAYOUT_BOUNDS.width, height / HomeScreenView.LAYOUT_BOUNDS.height);

      // 40 px high on iPad Mobile Safari
      const navBarHeight = scale * NavigationBar.NAVIGATION_BAR_SIZE.height;
      this.navigationBar.layout(scale, width, navBarHeight);
      this.navigationBar.y = height - navBarHeight;
      this.display.setSize(new Dimension2(width, height));
      const screenHeight = height - this.navigationBar.height;
      if (this.toolbar) {
        this.toolbar.layout(scale, screenHeight);
      }

      // The available bounds for screens and top layer children - though currently provided
      // full width and height, will soon be reduced when menus (specifically the Preferences
      // Toolbar) takes up screen space.
      const screenMinX = this.toolbar ? this.toolbar.getDisplayedWidth() : 0;
      const availableScreenBounds = new Bounds2(screenMinX, 0, width, screenHeight);

      // Layout each of the screens
      _.each(this.screens, m => m.view.layout(availableScreenBounds));
      this.topLayer.children.forEach(child => {
        child.layout && child.layout(availableScreenBounds);
      });

      // Fixes problems where the div would be way off center on iOS7
      if (platform.mobileSafari) {
        window.scrollTo(0, 0);
      }

      // update our scale and bounds properties after other changes (so listeners can be fired after screens are resized)
      this.scaleProperty.value = scale;
      this.boundsProperty.value = new Bounds2(0, 0, width, height);
      this.screenBoundsProperty.value = availableScreenBounds.copy();

      // set the scale describing the target Node, since scale from window resize is applied to each ScreenView,
      // (children of the PanZoomListener targetNode)
      animatedPanZoomSingleton.listener.setTargetScale(scale);

      // set the bounds which accurately describe the panZoomListener targetNode, since it would otherwise be
      // inaccurate with the very large BarrierRectangle
      animatedPanZoomSingleton.listener.setTargetBounds(this.boundsProperty.value);

      // constrain the simulation pan bounds so that it cannot be moved off screen
      animatedPanZoomSingleton.listener.setPanBounds(this.boundsProperty.value);

      // Set a corrective scaling for all HighlightPaths, so that focus highlight line widths
      // scale and look the same in view coordinates for all layout scales.
      HighlightPath.layoutScale = scale;
    }, {
      tandem: Tandem.GENERAL_MODEL.createTandem('resizeAction'),
      parameters: [{
        name: 'width',
        phetioType: NumberIO
      }, {
        name: 'height',
        phetioType: NumberIO
      }],
      phetioPlayback: true,
      phetioEventMetadata: {
        // resizeAction needs to always be playbackable because it acts independently of any other playback event.
        // Because of its unique nature, it should be a "top-level" `playback: true` event so that it is never marked as
        // `playback: false`. There are cases where it is nested under another `playback: true` event, like when the
        // wrapper launches the simulation, that cannot be avoided. For this reason, we use this override.
        alwaysPlaybackableOverride: true
      },
      phetioDocumentation: 'Executes when the sim is resized. Values are the sim dimensions in CSS pixels.'
    });
    this.stepSimulationAction = new PhetioAction(dt => {
      this.frameStartedEmitter.emit();

      // increment this before we can have an exception thrown, to see if we are missing frames
      this.frameCounter++;

      // Apply time scale effects here before usage
      dt *= phet.chipper.queryParameters.speed;
      if (this.resizePending) {
        this.resizeToWindow();
      }

      // If the user is on the home screen, we won't have a Screen that we'll want to step.  This must be done after
      // fuzz mouse, because fuzzing could change the selected screen, see #130
      const screen = this.selectedScreenProperty.value;

      // cap dt based on the current screen, see https://github.com/phetsims/joist/issues/130
      dt = Math.min(dt, screen.maxDT);

      // TODO: we are /1000 just to *1000?  Seems wasteful and like opportunity for error. See https://github.com/phetsims/joist/issues/387
      // Store the elapsed time in milliseconds for usage by Tween clients
      phet.joist.elapsedTime += dt * 1000;

      // timer step before model/view steps, see https://github.com/phetsims/joist/issues/401
      // Note that this is vital to support Interactive Description and the utterance queue.
      stepTimer.emit(dt);

      // If the dt is 0, we will skip the model step (see https://github.com/phetsims/joist/issues/171)
      if (screen.model.step && dt) {
        screen.model.step(dt);
      }

      // If using the TWEEN animation library, then update tweens before rendering the scene.
      // Update the tweens after the model is updated but before the view step.
      // See https://github.com/phetsims/joist/issues/401.
      //TODO https://github.com/phetsims/joist/issues/404 run TWEENs for the selected screen only
      if (window.TWEEN) {
        window.TWEEN.update(phet.joist.elapsedTime);
      }
      this.display.step(dt);

      // View step is the last thing before updateDisplay(), so we can do paint updates there.
      // See https://github.com/phetsims/joist/issues/401.
      screen.view.step(dt);

      // Do not update the display while PhET-iO is customizing, or it could show the sim before it is fully ready for display.
      if (!(Tandem.PHET_IO_ENABLED && !phet.phetio.phetioEngine.isReadyForDisplay)) {
        this.display.updateDisplay();
      }
      if (phet.chipper.queryParameters.memoryLimit) {
        this.memoryMonitor.measure();
      }
      this.frameEndedEmitter.emit();
    }, {
      tandem: Tandem.GENERAL_MODEL.createTandem('stepSimulationAction'),
      parameters: [{
        name: 'dt',
        phetioType: NumberIO,
        phetioDocumentation: 'The amount of time stepped in each call, in seconds.'
      }],
      phetioHighFrequency: true,
      phetioPlayback: true,
      phetioDocumentation: 'A function that steps time forward.'
    });
    const screensTandem = Tandem.GENERAL_MODEL.createTandem('screens');
    const screenData = selectScreens(allSimScreens, phet.chipper.queryParameters.homeScreen, QueryStringMachine.containsKey('homeScreen'), phet.chipper.queryParameters.initialScreen, QueryStringMachine.containsKey('initialScreen'), phet.chipper.queryParameters.screens, QueryStringMachine.containsKey('screens'), selectedSimScreens => {
      const possibleScreenIndices = selectedSimScreens.map(screen => {
        return allSimScreens.indexOf(screen) + 1;
      });
      const validValues = _.flatten(Combination.combinationsOf(possibleScreenIndices).map(subset => Permutation.permutationsOf(subset))).filter(array => array.length > 0).sort();

      // Controls the subset (and order) of screens that appear to the user. Separate from the ?screens query parameter
      // for phet-io purposes. See https://github.com/phetsims/joist/issues/827
      this.availableScreensProperty = new Property(possibleScreenIndices, {
        tandem: screensTandem.createTandem('availableScreensProperty'),
        isValidValue: value => _.some(validValues, validValue => _.isEqual(value, validValue)),
        phetioFeatured: true,
        phetioValueType: ArrayIO(NumberIO),
        phetioDocumentation: 'Controls which screens are available, and the order they are displayed.'
      });
      this.activeSimScreensProperty = new DerivedProperty([this.availableScreensProperty], screenIndices => {
        return screenIndices.map(index => allSimScreens[index - 1]);
      });
    }, selectedSimScreens => {
      return new HomeScreen(this.simNameProperty, () => this.selectedScreenProperty, selectedSimScreens, this.activeSimScreensProperty, {
        tandem: options.tandem.createTandem(window.phetio.PhetioIDUtils.HOME_SCREEN_COMPONENT_NAME),
        warningNode: options.homeScreenWarningNode
      });
    });
    this.homeScreen = screenData.homeScreen;
    this.simScreens = screenData.selectedSimScreens;
    this.screens = screenData.screens;
    this.allScreensCreated = screenData.allScreensCreated;
    this.selectedScreenProperty = new Property(screenData.initialScreen, {
      tandem: screensTandem.createTandem('selectedScreenProperty'),
      phetioFeatured: true,
      phetioDocumentation: 'Determines which screen is selected in the simulation',
      validValues: this.screens,
      phetioValueType: Screen.ScreenIO
    });

    // If the activeSimScreens changes, we'll want to update what the active screen (or selected screen) is for specific
    // cases.
    this.activeSimScreensProperty.lazyLink(screens => {
      const screen = this.selectedScreenProperty.value;
      if (screen === this.homeScreen) {
        if (screens.length === 1) {
          // If we're on the home screen and it switches to a 1-screen sim, go to that screen
          this.selectedScreenProperty.value = screens[0];
        } else if (!screens.includes(this.homeScreen.model.selectedScreenProperty.value)) {
          // If we're on the home screen and our "selected" screen disappears, select the first sim screen
          this.homeScreen.model.selectedScreenProperty.value = screens[0];
        }
      } else if (!screens.includes(screen)) {
        // If we're on a screen that "disappears", go to the first screen
        this.selectedScreenProperty.value = screens[0];
      }
    });
    this.displayedSimNameProperty = DerivedProperty.deriveAny([this.availableScreensProperty, this.simNameProperty, this.selectedScreenProperty, JoistStrings.simTitleWithScreenNamePatternStringProperty, ...this.screens.map(screen => screen.nameProperty)

    // We just need notifications on any of these changing, return args as a unique value to make sure listeners fire.
    ], () => {
      const availableScreens = this.availableScreensProperty.value;
      const simName = this.simNameProperty.value;
      const selectedScreen = this.selectedScreenProperty.value;
      const titleWithScreenPattern = JoistStrings.simTitleWithScreenNamePatternStringProperty.value;
      const screenName = selectedScreen.nameProperty.value;
      const isMultiScreenSimDisplayingSingleScreen = availableScreens.length === 1 && allSimScreens.length > 1;

      // update the titleText based on values of the sim name and screen name
      if (isMultiScreenSimDisplayingSingleScreen && simName && screenName) {
        // If the 'screens' query parameter selects only 1 screen and both the sim and screen name are not the empty
        // string, then update the nav bar title to include a hyphen and the screen name after the sim name.
        return StringUtils.fillIn(titleWithScreenPattern, {
          simName: simName,
          screenName: screenName
        });
      } else if (isMultiScreenSimDisplayingSingleScreen && screenName) {
        return screenName;
      } else {
        return simName;
      }
    }, {
      tandem: Tandem.GENERAL_MODEL.createTandem('displayedSimNameProperty'),
      tandemNameSuffix: 'NameProperty',
      phetioDocumentation: 'Customize this string by editing its dependencies.',
      phetioFeatured: true,
      phetioValueType: StringIO
    });

    // Local variable is settable...
    const browserTabVisibleProperty = new BooleanProperty(true, {
      tandem: Tandem.GENERAL_MODEL.createTandem('browserTabVisibleProperty'),
      phetioDocumentation: 'Indicates whether the browser tab containing the simulation is currently visible',
      phetioReadOnly: true,
      phetioFeatured: true
    });

    // ... but the public class attribute is read-only
    this.browserTabVisibleProperty = browserTabVisibleProperty;

    // set the state of the property that indicates if the browser tab is visible
    document.addEventListener('visibilitychange', () => {
      browserTabVisibleProperty.set(document.visibilityState === 'visible');
    }, false);
    assert && assert(window.phet.joist.launchCalled, 'Sim must be launched using simLauncher, ' + 'see https://github.com/phetsims/joist/issues/142');
    this.supportsGestureDescription = phet.chipper.queryParameters.supportsInteractiveDescription && SUPPORTS_GESTURE_DESCRIPTION;
    this.hasKeyboardHelpContent = _.some(this.simScreens, simScreen => !!simScreen.createKeyboardHelpNode);
    assert && assert(!window.phet.joist.sim, 'Only supports one sim at a time');
    window.phet.joist.sim = this;

    // commented out because https://github.com/phetsims/joist/issues/553 is deferred for after GQIO-oneone
    // if ( PHET_IO_ENABLED ) {
    //   this.engagementMetrics = new EngagementMetrics( this );
    // }

    this.preferencesModel = options.preferencesModel;

    // initialize audio and audio subcomponents
    audioManager.initialize(this);

    // hook up sound generation for screen changes
    if (this.preferencesModel.audioModel.supportsSound) {
      soundManager.addSoundGenerator(new ScreenSelectionSoundGenerator(this.selectedScreenProperty, this.homeScreen, {
        initialOutputLevel: 0.5
      }), {
        categoryName: 'user-interface'
      });
    }

    // Make ScreenshotGenerator available globally so it can be used in preload files such as PhET-iO.
    window.phet.joist.ScreenshotGenerator = ScreenshotGenerator;

    // If the locale query parameter was specified, then we may be running the all.html file, so adjust the title.
    // See https://github.com/phetsims/chipper/issues/510
    this.simNameProperty.link(simName => {
      document.title = simName;
    });

    // For now the Toolbar only includes controls for Voicing and is only constructed when that feature is supported.
    if (this.preferencesModel.audioModel.supportsVoicing) {
      this.toolbar = new Toolbar(this.preferencesModel.audioModel.toolbarEnabledProperty, this.selectedScreenProperty, this.lookAndFeel);

      // when the Toolbar positions update, resize the sim to fit in the available space
      this.toolbar.rightPositionProperty.lazyLink(() => {
        this.resize(this.boundsProperty.value.width, this.boundsProperty.value.height);
      });
    }
    this.display = new SimDisplay(simDisplayOptions);
    this.rootNode = this.display.rootNode;
    Helper.initialize(this, this.display);
    Multilink.multilink([this.activeProperty, phet.joist.playbackModeEnabledProperty], (active, playbackModeEnabled) => {
      // If in playbackMode is enabled, then the display must be interactive to support PDOM event listeners during
      // playback (which often come directly from sim code and not from user input).
      if (playbackModeEnabled) {
        this.display.interactive = true;
        globalKeyStateTracker.enabled = true;
      } else {
        // When the sim is inactive, make it non-interactive, see https://github.com/phetsims/scenery/issues/414
        this.display.interactive = active;
        globalKeyStateTracker.enabled = active;
      }
    });
    document.body.appendChild(this.display.domElement);
    Heartbeat.start(this);
    this.navigationBar = new NavigationBar(this, Tandem.GENERAL_VIEW.createTandem('navigationBar'));
    this.updateBackground = () => {
      this.lookAndFeel.backgroundColorProperty.value = Color.toColor(this.selectedScreenProperty.value.backgroundColorProperty.value);
    };
    this.lookAndFeel.backgroundColorProperty.link(backgroundColor => {
      this.display.backgroundColor = backgroundColor;
    });
    this.selectedScreenProperty.link(() => this.updateBackground());

    // When the user switches screens, interrupt the input on the previous screen.
    // See https://github.com/phetsims/scenery/issues/218
    this.selectedScreenProperty.lazyLink((newScreen, oldScreen) => oldScreen.view.interruptSubtreeInput());
    this.simInfo = new SimInfo(this);

    // Set up PhET-iO, must be done after phet.joist.sim is assigned
    Tandem.PHET_IO_ENABLED && phet.phetio.phetioEngine.onSimConstructionStarted(this.simInfo, this.isConstructionCompleteProperty, this.frameEndedEmitter, this.display);
    isSettingPhetioStateProperty.lazyLink(isSettingState => {
      if (!isSettingState) {
        this.updateViews();
      }
    });
    this.boundRunAnimationLoop = this.runAnimationLoop.bind(this);

    // Third party support
    phet.chipper.queryParameters.legendsOfLearning && new LegendsOfLearningSupport(this).start();
    assert && this.auditScreenNameKeys();
  }

  /**
   * Update the views of the sim. This is meant to run after the state has been set to make sure that all view
   * elements are in sync with the new, current state of the sim. (even when the sim is inactive, as in the state
   * wrapper).
   */
  updateViews() {
    // Trigger layout code
    this.resizeToWindow();
    this.selectedScreenProperty.value.view.step && this.selectedScreenProperty.value.view.step(0);

    // Clear all UtteranceQueue outputs that may have collected Utterances while state-setting logic occurred.
    // This is transient. https://github.com/phetsims/utterance-queue/issues/22 and https://github.com/phetsims/scenery/issues/1397
    this.display.descriptionUtteranceQueue.clear();
    voicingUtteranceQueue.clear();

    // Update the display asynchronously since it can trigger events on pointer validation, see https://github.com/phetsims/ph-scale/issues/212
    animationFrameTimer.runOnNextTick(() => phet.joist.display.updateDisplay());
  }
  finishInit(screens) {
    _.each(screens, screen => {
      screen.view.layerSplit = true;
      if (!this.detachInactiveScreenViews) {
        this.display.simulationRoot.addChild(screen.view);
      }
    });
    this.display.simulationRoot.addChild(this.navigationBar);
    if (this.preferencesModel.audioModel.supportsVoicing) {
      assert && assert(this.toolbar, 'toolbar should exist for voicing');
      this.display.simulationRoot.addChild(this.toolbar);
      this.display.simulationRoot.pdomOrder = [this.toolbar];

      // If Voicing is not "fully" enabled, only the toolbar is able to produce Voicing output.
      // All other simulation components should not voice anything. This must be called only after
      // all ScreenViews have been constructed.
      voicingManager.voicingFullyEnabledProperty.link(fullyEnabled => {
        this.setSimVoicingVisible(fullyEnabled);
      });
    }
    this.selectedScreenProperty.link(currentScreen => {
      screens.forEach(screen => {
        const visible = screen === currentScreen;

        // Make the selected screen visible and active, other screens invisible and inactive.
        // screen.isActiveProperty should change only while the screen is invisible, https://github.com/phetsims/joist/issues/418
        if (visible) {
          screen.activeProperty.set(visible);
          if (this.detachInactiveScreenViews && !this.display.simulationRoot.hasChild(screen.view)) {
            this.display.simulationRoot.insertChild(0, screen.view);
          }
        }
        screen.view.setVisible(visible);
        if (!visible) {
          if (this.detachInactiveScreenViews && this.display.simulationRoot.hasChild(screen.view)) {
            this.display.simulationRoot.removeChild(screen.view);
          }
          screen.activeProperty.set(visible);
        }
      });
      this.updateBackground();
      if (!isSettingPhetioStateProperty.value) {
        // Zoom out again after changing screens so we don't pan to the center of the focused ScreenView,
        // and so user has an overview of the new screen, see https://github.com/phetsims/joist/issues/682.
        animatedPanZoomSingleton.listener.resetTransform();
      }
    });
    this.display.simulationRoot.addChild(this.topLayer);

    // Fit to the window and render the initial scene
    // Can't synchronously do this in Firefox, see https://github.com/phetsims/vegas/issues/55 and
    // https://bugzilla.mozilla.org/show_bug.cgi?id=840412.
    const resizeListener = () => {
      // Don't resize on window size changes if we are playing back input events.
      // See https://github.com/phetsims/joist/issues/37
      if (!phet.joist.playbackModeEnabledProperty.value) {
        this.resizePending = true;
      }
    };
    $(window).resize(resizeListener);
    window.addEventListener('resize', resizeListener);
    window.addEventListener('orientationchange', resizeListener);
    window.visualViewport && window.visualViewport.addEventListener('resize', resizeListener);
    this.resizeToWindow();

    // Kick off checking for updates, if that is enabled
    updateCheck.check();

    // If there are warnings, show them in a dialog
    if (QueryStringMachine.warnings.length) {
      const warningDialog = new QueryParametersWarningDialog(QueryStringMachine.warnings, {
        closeButtonListener: () => {
          warningDialog.hide();
          warningDialog.dispose();
        }
      });
      warningDialog.show();
    }
  }

  /*
   * Adds a popup in the global coordinate frame. If the popup is model, it displays a semi-transparent black input
   * barrier behind it. A modal popup prevent the user from interacting with the reset of the application until the
   * popup is hidden. Use hidePopup() to hide the popup.
   * @param popup - the popup, must implemented node.hide(), called by hidePopup
   * @param isModal - whether popup is modal
   */
  showPopup(popup, isModal) {
    assert && assert(popup);
    assert && assert(!!popup.hide, 'Missing popup.hide() for showPopup');
    assert && assert(!this.topLayer.hasChild(popup), 'popup already shown');
    if (isModal) {
      this.rootNode.interruptSubtreeInput();
      this.modalNodeStack.push(popup);

      // pdom - modal dialogs should be the only readable content in the sim
      this.setPDOMViewsVisible(false);

      // voicing - responses from Nodes hidden by the modal dialog should not voice.
      this.setNonModalVoicingVisible(false);
    }
    if (popup.layout) {
      popup.layout(this.screenBoundsProperty.value);
    }
    this.topLayer.addChild(popup);
  }

  /*
   * Hides a popup that was previously displayed with showPopup()
   * @param popup
   * @param isModal - whether popup is modal
   */
  hidePopup(popup, isModal) {
    assert && assert(popup && this.modalNodeStack.includes(popup));
    assert && assert(this.topLayer.hasChild(popup), 'popup was not shown');
    if (isModal) {
      this.modalNodeStack.remove(popup);
      if (this.modalNodeStack.length === 0) {
        // After hiding all popups, Voicing becomes enabled for components in the simulation window only if
        // "Sim Voicing" switch is on.
        this.setNonModalVoicingVisible(voicingManager.voicingFullyEnabledProperty.value);

        // pdom - when the dialog is hidden, make all ScreenView content visible to assistive technology
        this.setPDOMViewsVisible(true);
      }
    }
    this.topLayer.removeChild(popup);
  }
  resizeToWindow() {
    this.resizePending = false;
    this.resize(window.innerWidth, window.innerHeight); // eslint-disable-line bad-sim-text
  }
  resize(width, height) {
    this.resizeAction.execute(width, height);
  }
  start() {
    // In order to animate the loading progress bar, we must schedule work with setTimeout
    // This array of {function} is the work that must be completed to launch the sim.
    const workItems = [];

    // Schedule instantiation of the screens
    this.screens.forEach(screen => {
      workItems.push(() => {
        // Screens may share the same instance of backgroundProperty, see joist#441
        if (!screen.backgroundColorProperty.hasListener(this.updateBackground)) {
          screen.backgroundColorProperty.link(this.updateBackground);
        }
        screen.initializeModel();
      });
      workItems.push(() => {
        screen.initializeView(this.simNameProperty, this.displayedSimNameProperty, this.screens.length, this.homeScreen === screen);
      });
    });

    // loop to run startup items asynchronously so the DOM can be updated to show animation on the progress bar
    const runItem = i => {
      setTimeout(
      // eslint-disable-line bad-sim-text
      () => {
        workItems[i]();

        // Move the progress ahead by one so we show the full progress bar for a moment before the sim starts up

        const progress = DotUtils.linear(0, workItems.length - 1, 0.25, 1.0, i);

        // Support iOS Reading Mode, which saves a DOM snapshot after the progressBarForeground has already been
        // removed from the document, see https://github.com/phetsims/joist/issues/389
        if (document.getElementById('progressBarForeground')) {
          // Grow the progress bar foreground to the right based on the progress so far.
          document.getElementById('progressBarForeground').setAttribute('width', `${progress * PROGRESS_BAR_WIDTH}`);
        }
        if (i + 1 < workItems.length) {
          runItem(i + 1);
        } else {
          setTimeout(() => {
            // eslint-disable-line bad-sim-text
            this.finishInit(this.screens);

            // Make sure requestAnimationFrame is defined
            Utils.polyfillRequestAnimationFrame();

            // Option for profiling
            // if true, prints screen initialization time (total, model, view) to the console and displays
            // profiling information on the screen
            if (phet.chipper.queryParameters.profiler) {
              Profiler.start(this);
            }

            // Notify listeners that all models and views have been constructed, and the Sim is ready to be shown.
            // Used by PhET-iO. This does not coincide with the end of the Sim constructor (because Sim has
            // asynchronous steps that finish after the constructor is completed )
            this._isConstructionCompleteProperty.value = true;

            // place the requestAnimationFrame *before* rendering to assure as close to 60fps with the setTimeout fallback.
            // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
            // Launch the bound version so it can easily be swapped out for debugging.
            // Schedules animation updates and runs the first step()
            this.boundRunAnimationLoop();

            // If the sim is in playback mode, then flush the timer's listeners. This makes sure that anything kicked
            // to the next frame with `timer.runOnNextTick` during startup (like every notification about a PhET-iO
            // instrumented element in phetioEngine.phetioObjectAdded()) can clear out before beginning playback.
            if (phet.joist.playbackModeEnabledProperty.value) {
              let beforeCounts = null;
              if (assert) {
                beforeCounts = Array.from(Random.allRandomInstances).map(n => n.numberOfCalls);
              }
              stepTimer.emit(0);
              if (assert) {
                const afterCounts = Array.from(Random.allRandomInstances).map(n => n.numberOfCalls);
                assert && assert(_.isEqual(beforeCounts, afterCounts), `Random was called more times in the playback sim on startup, before: ${beforeCounts}, after: ${afterCounts}`);
              }
            }

            // After the application is ready to go, remove the splash screen and progress bar.  Note the splash
            // screen is removed after one step(), so the rendering is ready to go when the progress bar is hidden.
            // no-op otherwise and will be disposed by phetioEngine.
            if (!Tandem.PHET_IO_ENABLED || phet.preloads.phetio.queryParameters.phetioStandalone) {
              window.phetSplashScreen.dispose();
            }
            // Sanity check that there is no phetio object in phet brand, see https://github.com/phetsims/phet-io/issues/1229
            phet.chipper.brand === 'phet' && assert && assert(!Tandem.PHET_IO_ENABLED, 'window.phet.preloads.phetio should not exist for phet brand');

            // Communicate sim load (successfully) to CT or other listening parent frames
            if (phet.chipper.queryParameters.continuousTest) {
              phet.chipper.reportContinuousTestResult({
                type: 'continuous-test-load'
              });
            }
            if (phet.chipper.queryParameters.postMessageOnLoad) {
              window.parent && window.parent.postMessage(JSON.stringify({
                type: 'load',
                url: window.location.href
              }), '*');
            }
          }, 25); // pause for a few milliseconds with the progress bar filled in before going to the home screen
        }
      },
      // The following sets the amount of delay between each work item to make it easier to see the changes to the
      // progress bar.  A total value is divided by the number of work items.  This makes it possible to see the
      // progress bar when few work items exist, such as for a single screen sim, but allows things to move
      // reasonably quickly when more work items exist, such as for a four-screen sim.
      30 / workItems.length);
    };
    runItem(0);
  }

  // Bound to this.boundRunAnimationLoop so it can be run in window.requestAnimationFrame
  runAnimationLoop() {
    window.requestAnimationFrame(this.boundRunAnimationLoop);

    // Only run animation frames for an active sim. If in playbackMode, playback logic will handle animation frame
    // stepping manually.
    if (this.activeProperty.value && !phet.joist.playbackModeEnabledProperty.value) {
      // Handle Input fuzzing before stepping the sim because input events occur outside of sim steps, but not before the
      // first sim step (to prevent issues like https://github.com/phetsims/equality-explorer/issues/161).
      this.frameCounter > 0 && this.display.fuzzInputEvents();
      this.stepOneFrame();
    }

    // The animation frame timer runs every frame
    const currentTime = Date.now();
    animationFrameTimer.emit(getDT(this.lastAnimationFrameTime, currentTime));
    this.lastAnimationFrameTime = currentTime;
    if (Tandem.PHET_IO_ENABLED) {
      // PhET-iO batches messages to be sent to other frames, messages must be sent whether the sim is active or not
      phet.phetio.phetioCommandProcessor.onAnimationLoop(this);
    }
  }

  // Run a single frame including model, view and display updates, used by Legends of Learning
  stepOneFrame() {
    // Compute the elapsed time since the last frame, or guess 1/60th of a second if it is the first frame
    const currentTime = Date.now();
    const dt = getDT(this.lastStepTime, currentTime);
    this.lastStepTime = currentTime;

    // Don't run the simulation on steps back in time (see https://github.com/phetsims/joist/issues/409)
    if (dt > 0) {
      this.stepSimulation(dt);
    }
  }

  /**
   * Update the simulation model, view, scenery display with an elapsed time of dt.
   * @param dt - in seconds
   * (phet-io)
   */
  stepSimulation(dt) {
    this.stepSimulationAction.execute(dt);
  }

  /**
   * Hide or show all accessible content related to the sim ScreenViews, and navigation bar. This content will
   * remain visible, but not be tab navigable or readable with a screen reader. This is generally useful when
   * displaying a pop up or modal dialog.
   */
  setPDOMViewsVisible(visible) {
    for (let i = 0; i < this.screens.length; i++) {
      this.screens[i].view.pdomVisible = visible;
    }
    this.navigationBar.pdomVisible = visible;
    this.homeScreen && this.homeScreen.view.setPDOMVisible(visible);
    this.toolbar && this.toolbar.setPDOMVisible(visible);
  }

  /**
   * Set the voicingVisible state of simulation components. When false, ONLY the Toolbar
   * and its buttons will be able to announce Voicing utterances. This is used by the
   * "Sim Voicing" switch in the toolbar which will disable all Voicing in the sim so that
   * only Toolbar content is announced.
   */
  setSimVoicingVisible(visible) {
    this.setNonModalVoicingVisible(visible);
    this.topLayer && this.topLayer.setVoicingVisible(visible);
  }

  /**
   * Sets voicingVisible on all elements "behind" the modal node stack. In this case, voicing should not work for those
   * components when set to false.
   * @param visible
   */
  setNonModalVoicingVisible(visible) {
    for (let i = 0; i < this.screens.length; i++) {
      this.screens[i].view.voicingVisible = visible; // home screen is the first item, if created
    }
    this.navigationBar.voicingVisible = visible;
  }

  /**
   * Checks for whether multi-screen sims have screen names that are in phet.screenNameKeys within package.json,
   * see https://github.com/phetsims/chipper/issues/1367
   */
  auditScreenNameKeys() {
    if (this.screens.length >= 2) {
      this.screens.forEach(screen => {
        if (!(screen instanceof HomeScreen) && screen.nameProperty instanceof LocalizedStringProperty) {
          const stringKey = screen.nameProperty.stringKey;
          assert && assert(packageJSON.phet.screenNameKeys.includes(stringKey), `For a multi-screen sim, the string key (${JSON.stringify(stringKey)}) should be in phet.screenNameKeys within package.json`);
        }
      });
    }
  }
}

// This Node supports children that have layout.

/**
 * Compute the dt since the last event
 * @param lastTime - milliseconds, time of the last event
 * @param currentTime - milliseconds, current time.  Passed in instead of computed so there is no "slack" between measurements
 */
function getDT(lastTime, currentTime) {
  // Compute the elapsed time since the last frame, or guess 1/60th of a second if it is the first frame
  return lastTime === -1 ? 1 / 60 : (currentTime - lastTime) / 1000.0;
}
joist.register('Sim', Sim);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhbmltYXRpb25GcmFtZVRpbWVyIiwiQm9vbGVhblByb3BlcnR5IiwiY3JlYXRlT2JzZXJ2YWJsZUFycmF5IiwiRGVyaXZlZFByb3BlcnR5IiwiRW1pdHRlciIsIk51bWJlclByb3BlcnR5IiwiUHJvcGVydHkiLCJzdGVwVGltZXIiLCJMb2NhbGl6ZWRTdHJpbmdQcm9wZXJ0eSIsIkJvdW5kczIiLCJEaW1lbnNpb24yIiwiUmFuZG9tIiwiRG90VXRpbHMiLCJwbGF0Zm9ybSIsIm9wdGlvbml6ZSIsIlN0cmluZ1V0aWxzIiwiQmFycmllclJlY3RhbmdsZSIsImFuaW1hdGVkUGFuWm9vbVNpbmdsZXRvbiIsIkNvbG9yIiwiZ2xvYmFsS2V5U3RhdGVUcmFja2VyIiwiSGlnaGxpZ2h0UGF0aCIsIk5vZGUiLCJVdGlscyIsInZvaWNpbmdNYW5hZ2VyIiwidm9pY2luZ1V0dGVyYW5jZVF1ZXVlIiwic291bmRNYW5hZ2VyIiwiUGhldGlvQWN0aW9uIiwiUGhldGlvT2JqZWN0IiwiVGFuZGVtIiwiTnVtYmVySU8iLCJhdWRpb01hbmFnZXIiLCJIZWFydGJlYXQiLCJIZWxwZXIiLCJIb21lU2NyZWVuIiwiSG9tZVNjcmVlblZpZXciLCJqb2lzdCIsIkpvaXN0U3RyaW5ncyIsIkxvb2tBbmRGZWVsIiwiTWVtb3J5TW9uaXRvciIsIk5hdmlnYXRpb25CYXIiLCJwYWNrYWdlSlNPTiIsIlByZWZlcmVuY2VzTW9kZWwiLCJQcm9maWxlciIsIlF1ZXJ5UGFyYW1ldGVyc1dhcm5pbmdEaWFsb2ciLCJTY3JlZW4iLCJTY3JlZW5TZWxlY3Rpb25Tb3VuZEdlbmVyYXRvciIsIlNjcmVlbnNob3RHZW5lcmF0b3IiLCJzZWxlY3RTY3JlZW5zIiwiU2ltRGlzcGxheSIsIlNpbUluZm8iLCJMZWdlbmRzT2ZMZWFybmluZ1N1cHBvcnQiLCJUb29sYmFyIiwidXBkYXRlQ2hlY2siLCJNdWx0aWxpbmsiLCJDb21iaW5hdGlvbiIsIlBlcm11dGF0aW9uIiwiQXJyYXlJTyIsImlzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkiLCJTdHJpbmdJTyIsIlBST0dSRVNTX0JBUl9XSURUSCIsIlNVUFBPUlRTX0dFU1RVUkVfREVTQ1JJUFRJT04iLCJhbmRyb2lkIiwibW9iaWxlU2FmYXJpIiwicGhldCIsImVsYXBzZWRUaW1lIiwicGxheWJhY2tNb2RlRW5hYmxlZFByb3BlcnR5IiwiY2hpcHBlciIsInF1ZXJ5UGFyYW1ldGVycyIsInBsYXliYWNrTW9kZSIsImFzc2VydCIsImJyYW5kIiwiU2ltIiwiX2lzQ29uc3RydWN0aW9uQ29tcGxldGVQcm9wZXJ0eSIsImlzQ29uc3RydWN0aW9uQ29tcGxldGVQcm9wZXJ0eSIsImZyYW1lU3RhcnRlZEVtaXR0ZXIiLCJmcmFtZUVuZGVkRW1pdHRlciIsInRhbmRlbSIsIkdFTkVSQUxfTU9ERUwiLCJjcmVhdGVUYW5kZW0iLCJwaGV0aW9IaWdoRnJlcXVlbmN5IiwicGhldGlvRG9jdW1lbnRhdGlvbiIsImFjdGl2ZVByb3BlcnR5IiwicGhldGlvRmVhdHVyZWQiLCJzY2FsZVByb3BlcnR5IiwiYm91bmRzUHJvcGVydHkiLCJzY3JlZW5Cb3VuZHNQcm9wZXJ0eSIsImxvb2tBbmRGZWVsIiwibWVtb3J5TW9uaXRvciIsInZlcnNpb24iLCJmcmFtZUNvdW50ZXIiLCJyZXNpemVQZW5kaW5nIiwibG9jYWxlIiwidG9vbGJhciIsIm1vZGFsTm9kZVN0YWNrIiwiYmFycmllclJlY3RhbmdsZSIsInRvcExheWVyIiwiY2hpbGRyZW4iLCJsYXN0U3RlcFRpbWUiLCJsYXN0QW5pbWF0aW9uRnJhbWVUaW1lIiwiY29uc3RydWN0b3IiLCJzaW1OYW1lUHJvcGVydHkiLCJhbGxTaW1TY3JlZW5zIiwicHJvdmlkZWRPcHRpb25zIiwid2luZG93IiwicGhldFNwbGFzaFNjcmVlbkRvd25sb2FkQ29tcGxldGUiLCJsZW5ndGgiLCJvcHRpb25zIiwiY3JlZGl0cyIsImhvbWVTY3JlZW5XYXJuaW5nTm9kZSIsInByZWZlcmVuY2VzTW9kZWwiLCJ3ZWJnbCIsIkRFRkFVTFRfV0VCR0wiLCJkZXRhY2hJbmFjdGl2ZVNjcmVlblZpZXdzIiwicGhldGlvU3RhdGUiLCJwaGV0aW9SZWFkT25seSIsIlJPT1QiLCJzaW1EaXNwbGF5T3B0aW9ucyIsIkdFTkVSQUxfVklFVyIsImxhenlMaW5rIiwiRXJyb3IiLCJpc0NvbnN0cnVjdGlvbkNvbXBsZXRlIiwiZGltZW5zaW9uUHJvcGVydHkiLCJ2YWx1ZUNvbXBhcmlzb25TdHJhdGVneSIsInJlc2l6ZUFjdGlvbiIsIndpZHRoIiwiaGVpZ2h0IiwidmFsdWUiLCJzY2FsZSIsIk1hdGgiLCJtaW4iLCJMQVlPVVRfQk9VTkRTIiwibmF2QmFySGVpZ2h0IiwiTkFWSUdBVElPTl9CQVJfU0laRSIsIm5hdmlnYXRpb25CYXIiLCJsYXlvdXQiLCJ5IiwiZGlzcGxheSIsInNldFNpemUiLCJzY3JlZW5IZWlnaHQiLCJzY3JlZW5NaW5YIiwiZ2V0RGlzcGxheWVkV2lkdGgiLCJhdmFpbGFibGVTY3JlZW5Cb3VuZHMiLCJfIiwiZWFjaCIsInNjcmVlbnMiLCJtIiwidmlldyIsImZvckVhY2giLCJjaGlsZCIsInNjcm9sbFRvIiwiY29weSIsImxpc3RlbmVyIiwic2V0VGFyZ2V0U2NhbGUiLCJzZXRUYXJnZXRCb3VuZHMiLCJzZXRQYW5Cb3VuZHMiLCJsYXlvdXRTY2FsZSIsInBhcmFtZXRlcnMiLCJuYW1lIiwicGhldGlvVHlwZSIsInBoZXRpb1BsYXliYWNrIiwicGhldGlvRXZlbnRNZXRhZGF0YSIsImFsd2F5c1BsYXliYWNrYWJsZU92ZXJyaWRlIiwic3RlcFNpbXVsYXRpb25BY3Rpb24iLCJkdCIsImVtaXQiLCJzcGVlZCIsInJlc2l6ZVRvV2luZG93Iiwic2NyZWVuIiwic2VsZWN0ZWRTY3JlZW5Qcm9wZXJ0eSIsIm1heERUIiwibW9kZWwiLCJzdGVwIiwiVFdFRU4iLCJ1cGRhdGUiLCJQSEVUX0lPX0VOQUJMRUQiLCJwaGV0aW8iLCJwaGV0aW9FbmdpbmUiLCJpc1JlYWR5Rm9yRGlzcGxheSIsInVwZGF0ZURpc3BsYXkiLCJtZW1vcnlMaW1pdCIsIm1lYXN1cmUiLCJzY3JlZW5zVGFuZGVtIiwic2NyZWVuRGF0YSIsImhvbWVTY3JlZW4iLCJRdWVyeVN0cmluZ01hY2hpbmUiLCJjb250YWluc0tleSIsImluaXRpYWxTY3JlZW4iLCJzZWxlY3RlZFNpbVNjcmVlbnMiLCJwb3NzaWJsZVNjcmVlbkluZGljZXMiLCJtYXAiLCJpbmRleE9mIiwidmFsaWRWYWx1ZXMiLCJmbGF0dGVuIiwiY29tYmluYXRpb25zT2YiLCJzdWJzZXQiLCJwZXJtdXRhdGlvbnNPZiIsImZpbHRlciIsImFycmF5Iiwic29ydCIsImF2YWlsYWJsZVNjcmVlbnNQcm9wZXJ0eSIsImlzVmFsaWRWYWx1ZSIsInNvbWUiLCJ2YWxpZFZhbHVlIiwiaXNFcXVhbCIsInBoZXRpb1ZhbHVlVHlwZSIsImFjdGl2ZVNpbVNjcmVlbnNQcm9wZXJ0eSIsInNjcmVlbkluZGljZXMiLCJpbmRleCIsIlBoZXRpb0lEVXRpbHMiLCJIT01FX1NDUkVFTl9DT01QT05FTlRfTkFNRSIsIndhcm5pbmdOb2RlIiwic2ltU2NyZWVucyIsImFsbFNjcmVlbnNDcmVhdGVkIiwiU2NyZWVuSU8iLCJpbmNsdWRlcyIsImRpc3BsYXllZFNpbU5hbWVQcm9wZXJ0eSIsImRlcml2ZUFueSIsInNpbVRpdGxlV2l0aFNjcmVlbk5hbWVQYXR0ZXJuU3RyaW5nUHJvcGVydHkiLCJuYW1lUHJvcGVydHkiLCJhdmFpbGFibGVTY3JlZW5zIiwic2ltTmFtZSIsInNlbGVjdGVkU2NyZWVuIiwidGl0bGVXaXRoU2NyZWVuUGF0dGVybiIsInNjcmVlbk5hbWUiLCJpc011bHRpU2NyZWVuU2ltRGlzcGxheWluZ1NpbmdsZVNjcmVlbiIsImZpbGxJbiIsInRhbmRlbU5hbWVTdWZmaXgiLCJicm93c2VyVGFiVmlzaWJsZVByb3BlcnR5IiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwic2V0IiwidmlzaWJpbGl0eVN0YXRlIiwibGF1bmNoQ2FsbGVkIiwic3VwcG9ydHNHZXN0dXJlRGVzY3JpcHRpb24iLCJzdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb24iLCJoYXNLZXlib2FyZEhlbHBDb250ZW50Iiwic2ltU2NyZWVuIiwiY3JlYXRlS2V5Ym9hcmRIZWxwTm9kZSIsInNpbSIsImluaXRpYWxpemUiLCJhdWRpb01vZGVsIiwic3VwcG9ydHNTb3VuZCIsImFkZFNvdW5kR2VuZXJhdG9yIiwiaW5pdGlhbE91dHB1dExldmVsIiwiY2F0ZWdvcnlOYW1lIiwibGluayIsInRpdGxlIiwic3VwcG9ydHNWb2ljaW5nIiwidG9vbGJhckVuYWJsZWRQcm9wZXJ0eSIsInJpZ2h0UG9zaXRpb25Qcm9wZXJ0eSIsInJlc2l6ZSIsInJvb3ROb2RlIiwibXVsdGlsaW5rIiwiYWN0aXZlIiwicGxheWJhY2tNb2RlRW5hYmxlZCIsImludGVyYWN0aXZlIiwiZW5hYmxlZCIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImRvbUVsZW1lbnQiLCJzdGFydCIsInVwZGF0ZUJhY2tncm91bmQiLCJiYWNrZ3JvdW5kQ29sb3JQcm9wZXJ0eSIsInRvQ29sb3IiLCJiYWNrZ3JvdW5kQ29sb3IiLCJuZXdTY3JlZW4iLCJvbGRTY3JlZW4iLCJpbnRlcnJ1cHRTdWJ0cmVlSW5wdXQiLCJzaW1JbmZvIiwib25TaW1Db25zdHJ1Y3Rpb25TdGFydGVkIiwiaXNTZXR0aW5nU3RhdGUiLCJ1cGRhdGVWaWV3cyIsImJvdW5kUnVuQW5pbWF0aW9uTG9vcCIsInJ1bkFuaW1hdGlvbkxvb3AiLCJiaW5kIiwibGVnZW5kc09mTGVhcm5pbmciLCJhdWRpdFNjcmVlbk5hbWVLZXlzIiwiZGVzY3JpcHRpb25VdHRlcmFuY2VRdWV1ZSIsImNsZWFyIiwicnVuT25OZXh0VGljayIsImZpbmlzaEluaXQiLCJsYXllclNwbGl0Iiwic2ltdWxhdGlvblJvb3QiLCJhZGRDaGlsZCIsInBkb21PcmRlciIsInZvaWNpbmdGdWxseUVuYWJsZWRQcm9wZXJ0eSIsImZ1bGx5RW5hYmxlZCIsInNldFNpbVZvaWNpbmdWaXNpYmxlIiwiY3VycmVudFNjcmVlbiIsInZpc2libGUiLCJoYXNDaGlsZCIsImluc2VydENoaWxkIiwic2V0VmlzaWJsZSIsInJlbW92ZUNoaWxkIiwicmVzZXRUcmFuc2Zvcm0iLCJyZXNpemVMaXN0ZW5lciIsIiQiLCJ2aXN1YWxWaWV3cG9ydCIsImNoZWNrIiwid2FybmluZ3MiLCJ3YXJuaW5nRGlhbG9nIiwiY2xvc2VCdXR0b25MaXN0ZW5lciIsImhpZGUiLCJkaXNwb3NlIiwic2hvdyIsInNob3dQb3B1cCIsInBvcHVwIiwiaXNNb2RhbCIsInB1c2giLCJzZXRQRE9NVmlld3NWaXNpYmxlIiwic2V0Tm9uTW9kYWxWb2ljaW5nVmlzaWJsZSIsImhpZGVQb3B1cCIsInJlbW92ZSIsImlubmVyV2lkdGgiLCJpbm5lckhlaWdodCIsImV4ZWN1dGUiLCJ3b3JrSXRlbXMiLCJoYXNMaXN0ZW5lciIsImluaXRpYWxpemVNb2RlbCIsImluaXRpYWxpemVWaWV3IiwicnVuSXRlbSIsImkiLCJzZXRUaW1lb3V0IiwicHJvZ3Jlc3MiLCJsaW5lYXIiLCJnZXRFbGVtZW50QnlJZCIsInNldEF0dHJpYnV0ZSIsInBvbHlmaWxsUmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwicHJvZmlsZXIiLCJiZWZvcmVDb3VudHMiLCJBcnJheSIsImZyb20iLCJhbGxSYW5kb21JbnN0YW5jZXMiLCJuIiwibnVtYmVyT2ZDYWxscyIsImFmdGVyQ291bnRzIiwicHJlbG9hZHMiLCJwaGV0aW9TdGFuZGFsb25lIiwicGhldFNwbGFzaFNjcmVlbiIsImNvbnRpbnVvdXNUZXN0IiwicmVwb3J0Q29udGludW91c1Rlc3RSZXN1bHQiLCJ0eXBlIiwicG9zdE1lc3NhZ2VPbkxvYWQiLCJwYXJlbnQiLCJwb3N0TWVzc2FnZSIsIkpTT04iLCJzdHJpbmdpZnkiLCJ1cmwiLCJsb2NhdGlvbiIsImhyZWYiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJmdXp6SW5wdXRFdmVudHMiLCJzdGVwT25lRnJhbWUiLCJjdXJyZW50VGltZSIsIkRhdGUiLCJub3ciLCJnZXREVCIsInBoZXRpb0NvbW1hbmRQcm9jZXNzb3IiLCJvbkFuaW1hdGlvbkxvb3AiLCJzdGVwU2ltdWxhdGlvbiIsInBkb21WaXNpYmxlIiwic2V0UERPTVZpc2libGUiLCJzZXRWb2ljaW5nVmlzaWJsZSIsInZvaWNpbmdWaXNpYmxlIiwic3RyaW5nS2V5Iiwic2NyZWVuTmFtZUtleXMiLCJsYXN0VGltZSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiU2ltLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIE1haW4gY2xhc3MgdGhhdCByZXByZXNlbnRzIG9uZSBzaW11bGF0aW9uLlxyXG4gKiBQcm92aWRlcyBkZWZhdWx0IGluaXRpYWxpemF0aW9uLCBzdWNoIGFzIHBvbHlmaWxscyBhcyB3ZWxsLlxyXG4gKiBJZiB0aGUgc2ltdWxhdGlvbiBoYXMgb25seSBvbmUgc2NyZWVuLCB0aGVuIHRoZXJlIGlzIG5vIGhvbWVzY3JlZW4sIGhvbWUgaWNvbiBvciBzY3JlZW4gaWNvbiBpbiB0aGUgbmF2aWdhdGlvbiBiYXIuXHJcbiAqXHJcbiAqIFRoZSB0eXBlIGZvciB0aGUgY29udGFpbmVkIFNjcmVlbiBpbnN0YW5jZXMgaXMgU2NyZWVuPGFueSxhbnk+IHNpbmNlIHdlIGRvIG5vdCB3YW50IHRvIHBhcmFtZXRlcml6ZSBTaW08W3tNMSxWMX0se00yLFYyfV1cclxuICogZXRjLlxyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIENocmlzIE1hbGxleSAoUGl4ZWxab29tLCBJbmMuKVxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IGFuaW1hdGlvbkZyYW1lVGltZXIgZnJvbSAnLi4vLi4vYXhvbi9qcy9hbmltYXRpb25GcmFtZVRpbWVyLmpzJztcclxuaW1wb3J0IEJvb2xlYW5Qcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL0Jvb2xlYW5Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBjcmVhdGVPYnNlcnZhYmxlQXJyYXkgZnJvbSAnLi4vLi4vYXhvbi9qcy9jcmVhdGVPYnNlcnZhYmxlQXJyYXkuanMnO1xyXG5pbXBvcnQgRGVyaXZlZFByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvRGVyaXZlZFByb3BlcnR5LmpzJztcclxuaW1wb3J0IEVtaXR0ZXIgZnJvbSAnLi4vLi4vYXhvbi9qcy9FbWl0dGVyLmpzJztcclxuaW1wb3J0IE51bWJlclByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvTnVtYmVyUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBzdGVwVGltZXIgZnJvbSAnLi4vLi4vYXhvbi9qcy9zdGVwVGltZXIuanMnO1xyXG5pbXBvcnQgTG9jYWxpemVkU3RyaW5nUHJvcGVydHkgZnJvbSAnLi4vLi4vY2hpcHBlci9qcy9Mb2NhbGl6ZWRTdHJpbmdQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBCb3VuZHMyIGZyb20gJy4uLy4uL2RvdC9qcy9Cb3VuZHMyLmpzJztcclxuaW1wb3J0IERpbWVuc2lvbjIgZnJvbSAnLi4vLi4vZG90L2pzL0RpbWVuc2lvbjIuanMnO1xyXG5pbXBvcnQgUmFuZG9tIGZyb20gJy4uLy4uL2RvdC9qcy9SYW5kb20uanMnO1xyXG5pbXBvcnQgRG90VXRpbHMgZnJvbSAnLi4vLi4vZG90L2pzL1V0aWxzLmpzJzsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBkZWZhdWx0LWltcG9ydC1tYXRjaC1maWxlbmFtZVxyXG5pbXBvcnQgcGxhdGZvcm0gZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL3BsYXRmb3JtLmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IFN0cmluZ1V0aWxzIGZyb20gJy4uLy4uL3BoZXRjb21tb24vanMvdXRpbC9TdHJpbmdVdGlscy5qcyc7XHJcbmltcG9ydCBCYXJyaWVyUmVjdGFuZ2xlIGZyb20gJy4uLy4uL3NjZW5lcnktcGhldC9qcy9CYXJyaWVyUmVjdGFuZ2xlLmpzJztcclxuaW1wb3J0IHsgYW5pbWF0ZWRQYW5ab29tU2luZ2xldG9uLCBDb2xvciwgZ2xvYmFsS2V5U3RhdGVUcmFja2VyLCBIaWdobGlnaHRQYXRoLCBOb2RlLCBVdGlscywgdm9pY2luZ01hbmFnZXIsIHZvaWNpbmdVdHRlcmFuY2VRdWV1ZSB9IGZyb20gJy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCAnLi4vLi4vc2hlcnBhL2xpYi9nYW1lLXVwLWNhbWVyYS0xLjAuMC5qcyc7XHJcbmltcG9ydCBzb3VuZE1hbmFnZXIgZnJvbSAnLi4vLi4vdGFtYm8vanMvc291bmRNYW5hZ2VyLmpzJztcclxuaW1wb3J0IFBoZXRpb0FjdGlvbiBmcm9tICcuLi8uLi90YW5kZW0vanMvUGhldGlvQWN0aW9uLmpzJztcclxuaW1wb3J0IFBoZXRpb09iamVjdCwgeyBQaGV0aW9PYmplY3RPcHRpb25zIH0gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL1BoZXRpb09iamVjdC5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcbmltcG9ydCBOdW1iZXJJTyBmcm9tICcuLi8uLi90YW5kZW0vanMvdHlwZXMvTnVtYmVySU8uanMnO1xyXG5pbXBvcnQgYXVkaW9NYW5hZ2VyIGZyb20gJy4vYXVkaW9NYW5hZ2VyLmpzJztcclxuaW1wb3J0IEhlYXJ0YmVhdCBmcm9tICcuL0hlYXJ0YmVhdC5qcyc7XHJcbmltcG9ydCBIZWxwZXIgZnJvbSAnLi9IZWxwZXIuanMnO1xyXG5pbXBvcnQgSG9tZVNjcmVlbiBmcm9tICcuL0hvbWVTY3JlZW4uanMnO1xyXG5pbXBvcnQgSG9tZVNjcmVlblZpZXcgZnJvbSAnLi9Ib21lU2NyZWVuVmlldy5qcyc7XHJcbmltcG9ydCBqb2lzdCBmcm9tICcuL2pvaXN0LmpzJztcclxuaW1wb3J0IEpvaXN0U3RyaW5ncyBmcm9tICcuL0pvaXN0U3RyaW5ncy5qcyc7XHJcbmltcG9ydCBMb29rQW5kRmVlbCBmcm9tICcuL0xvb2tBbmRGZWVsLmpzJztcclxuaW1wb3J0IE1lbW9yeU1vbml0b3IgZnJvbSAnLi9NZW1vcnlNb25pdG9yLmpzJztcclxuaW1wb3J0IE5hdmlnYXRpb25CYXIgZnJvbSAnLi9OYXZpZ2F0aW9uQmFyLmpzJztcclxuaW1wb3J0IHBhY2thZ2VKU09OIGZyb20gJy4vcGFja2FnZUpTT04uanMnO1xyXG5pbXBvcnQgUHJlZmVyZW5jZXNNb2RlbCBmcm9tICcuL3ByZWZlcmVuY2VzL1ByZWZlcmVuY2VzTW9kZWwuanMnO1xyXG5pbXBvcnQgUHJvZmlsZXIgZnJvbSAnLi9Qcm9maWxlci5qcyc7XHJcbmltcG9ydCBRdWVyeVBhcmFtZXRlcnNXYXJuaW5nRGlhbG9nIGZyb20gJy4vUXVlcnlQYXJhbWV0ZXJzV2FybmluZ0RpYWxvZy5qcyc7XHJcbmltcG9ydCBTY3JlZW4sIHsgQW55U2NyZWVuIH0gZnJvbSAnLi9TY3JlZW4uanMnO1xyXG5pbXBvcnQgU2NyZWVuU2VsZWN0aW9uU291bmRHZW5lcmF0b3IgZnJvbSAnLi9TY3JlZW5TZWxlY3Rpb25Tb3VuZEdlbmVyYXRvci5qcyc7XHJcbmltcG9ydCBTY3JlZW5zaG90R2VuZXJhdG9yIGZyb20gJy4vU2NyZWVuc2hvdEdlbmVyYXRvci5qcyc7XHJcbmltcG9ydCBzZWxlY3RTY3JlZW5zIGZyb20gJy4vc2VsZWN0U2NyZWVucy5qcyc7XHJcbmltcG9ydCBTaW1EaXNwbGF5LCB7IFNpbURpc3BsYXlPcHRpb25zIH0gZnJvbSAnLi9TaW1EaXNwbGF5LmpzJztcclxuaW1wb3J0IFNpbUluZm8gZnJvbSAnLi9TaW1JbmZvLmpzJztcclxuaW1wb3J0IExlZ2VuZHNPZkxlYXJuaW5nU3VwcG9ydCBmcm9tICcuL3RoaXJkUGFydHlTdXBwb3J0L0xlZ2VuZHNPZkxlYXJuaW5nU3VwcG9ydC5qcyc7XHJcbmltcG9ydCBUb29sYmFyIGZyb20gJy4vdG9vbGJhci9Ub29sYmFyLmpzJztcclxuaW1wb3J0IHVwZGF0ZUNoZWNrIGZyb20gJy4vdXBkYXRlQ2hlY2suanMnO1xyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCB7IENyZWRpdHNEYXRhIH0gZnJvbSAnLi9DcmVkaXRzTm9kZS5qcyc7XHJcbmltcG9ydCB7IFBvcHVwYWJsZU5vZGUgfSBmcm9tICcuLi8uLi9zdW4vanMvUG9wdXBhYmxlLmpzJztcclxuaW1wb3J0IFBpY2tPcHRpb25hbCBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvUGlja09wdGlvbmFsLmpzJztcclxuaW1wb3J0IE11bHRpbGluayBmcm9tICcuLi8uLi9heG9uL2pzL011bHRpbGluay5qcyc7XHJcbmltcG9ydCBSZWFkT25seVByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBDb21iaW5hdGlvbiBmcm9tICcuLi8uLi9kb3QvanMvQ29tYmluYXRpb24uanMnO1xyXG5pbXBvcnQgUGVybXV0YXRpb24gZnJvbSAnLi4vLi4vZG90L2pzL1Blcm11dGF0aW9uLmpzJztcclxuaW1wb3J0IEFycmF5SU8gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL3R5cGVzL0FycmF5SU8uanMnO1xyXG5pbXBvcnQgeyBMb2NhbGUgfSBmcm9tICcuL2kxOG4vbG9jYWxlUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgaXNTZXR0aW5nUGhldGlvU3RhdGVQcm9wZXJ0eSBmcm9tICcuLi8uLi90YW5kZW0vanMvaXNTZXR0aW5nUGhldGlvU3RhdGVQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBTdHJpbmdJTyBmcm9tICcuLi8uLi90YW5kZW0vanMvdHlwZXMvU3RyaW5nSU8uanMnO1xyXG5cclxuLy8gY29uc3RhbnRzXHJcbmNvbnN0IFBST0dSRVNTX0JBUl9XSURUSCA9IDI3MztcclxuY29uc3QgU1VQUE9SVFNfR0VTVFVSRV9ERVNDUklQVElPTiA9IHBsYXRmb3JtLmFuZHJvaWQgfHwgcGxhdGZvcm0ubW9iaWxlU2FmYXJpO1xyXG5cclxuLy8gZ2xvYmFsc1xyXG5waGV0LmpvaXN0LmVsYXBzZWRUaW1lID0gMDsgLy8gaW4gbWlsbGlzZWNvbmRzLCB1c2UgdGhpcyBpbiBUd2Vlbi5zdGFydCBmb3IgcmVwbGljYWJsZSBwbGF5YmFja3NcclxuXHJcbi8vIFdoZW4gdGhlIHNpbXVsYXRpb24gaXMgZ29pbmcgdG8gYmUgdXNlZCB0byBwbGF5IGJhY2sgYSByZWNvcmRlZCBzZXNzaW9uLCB0aGUgc2ltdWxhdGlvbiBtdXN0IGJlIHB1dCBpbnRvIGEgc3BlY2lhbFxyXG4vLyBtb2RlIGluIHdoaWNoIGl0IHdpbGwgb25seSB1cGRhdGUgdGhlIG1vZGVsICsgdmlldyBiYXNlZCBvbiB0aGUgcGxheWJhY2sgY2xvY2sgZXZlbnRzIHJhdGhlciB0aGFuIHRoZSBzeXN0ZW0gY2xvY2suXHJcbi8vIFRoaXMgbXVzdCBiZSBzZXQgYmVmb3JlIHRoZSBzaW11bGF0aW9uIGlzIGxhdW5jaGVkIGluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IG5vIGVycmFudCBzdGVwU2ltdWxhdGlvbiBzdGVwcyBhcmUgY2FsbGVkXHJcbi8vIGJlZm9yZSB0aGUgcGxheWJhY2sgZXZlbnRzIGJlZ2luLiAgVGhpcyB2YWx1ZSBpcyBvdmVycmlkZGVuIGZvciBwbGF5YmFjayBieSBQaGV0aW9FbmdpbmVJTy5cclxuLy8gKHBoZXQtaW8pXHJcbnBoZXQuam9pc3QucGxheWJhY2tNb2RlRW5hYmxlZFByb3BlcnR5ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5wbGF5YmFja01vZGUgKTtcclxuXHJcbmFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiBwaGV0LmNoaXBwZXIuYnJhbmQgPT09ICdzdHJpbmcnLCAncGhldC5jaGlwcGVyLmJyYW5kIGlzIHJlcXVpcmVkIHRvIHJ1biBhIHNpbScgKTtcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcblxyXG4gIGNyZWRpdHM/OiBDcmVkaXRzRGF0YTtcclxuXHJcbiAgLy8gYSB7Tm9kZX0gcGxhY2VkIG9udG8gdGhlIGhvbWUgc2NyZWVuIChpZiBhdmFpbGFibGUpXHJcbiAgaG9tZVNjcmVlbldhcm5pbmdOb2RlPzogbnVsbCB8IE5vZGU7XHJcblxyXG4gIC8vIFRoZSBQcmVmZXJlbmNlc01vZGVsIGRlZmluZXMgdGhlIGF2YWlsYWJsZSBmZWF0dXJlcyBmb3IgdGhlIHNpbXVsYXRpb24gdGhhdCBhcmUgY29udHJvbGxhYmxlXHJcbiAgLy8gdGhyb3VnaCB0aGUgUHJlZmVyZW5jZXMgRGlhbG9nLiBXaWxsIG5vdCBiZSBudWxsISBUaGlzIGlzIGEgd29ya2Fyb3VuZCB0byBwcmV2ZW50IGNyZWF0aW5nIGEgXCJkZWZhdWx0XCIgUHJlZmVyZW5jZXNNb2RlbFxyXG4gIHByZWZlcmVuY2VzTW9kZWw/OiBQcmVmZXJlbmNlc01vZGVsIHwgbnVsbDtcclxuXHJcbiAgLy8gUGFzc2VkIHRvIFNpbURpc3BsYXksIGJ1dCBhIHRvcCBsZXZlbCBvcHRpb24gZm9yIEFQSSBlYXNlLlxyXG4gIHdlYmdsPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gV2hlbiBmYWxzZSAoZGVmYXVsdCksIGFsbCBTY3JlZW5WaWV3cyB3aWxsIGJlIGNoaWxkcmVuIChidXQgb25seSBvbmUgd2lsbCBiZSB2aXNpYmxlKS4gV2hlbiB0cnVlLCBvbmx5IHRoZSBzZWxlY3RlZFxyXG4gIC8vIFNjcmVlblZpZXcgd2lsbCBiZSBhIGNoaWxkLiBUaGlzIGlzIHVzZWZ1bCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucywgZS5nLiB3aGVuIHVzaW5nIFdlYkdMIG9yIHdpc2ggdG8gcmVkdWNlIG1lbW9yeVxyXG4gIC8vIGNvc3RzLiBTZXR0aW5nIHRoaXMgdG8gdHJ1ZSBNQVkgaW5jcmVhc2UgdGhlIGFtb3VudCBvZiB0aW1lIG5lZWRlZCB0byBzd2l0Y2ggc2NyZWVucy5cclxuICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2ZhcmFkYXlzLWVsZWN0cm9tYWduZXRpYy1sYWIvaXNzdWVzLzE1M1xyXG4gIGRldGFjaEluYWN0aXZlU2NyZWVuVmlld3M/OiBib29sZWFuO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgU2ltT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgUGlja09wdGlvbmFsPFBoZXRpb09iamVjdE9wdGlvbnMsICdwaGV0aW9EZXNpZ25lZCc+O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2ltIGV4dGVuZHMgUGhldGlvT2JqZWN0IHtcclxuXHJcbiAgLy8gKGpvaXN0LWludGVybmFsKVxyXG4gIHB1YmxpYyByZWFkb25seSBzaW1OYW1lUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PHN0cmluZz47XHJcblxyXG4gIC8vIEluZGljYXRlcyBzaW0gY29uc3RydWN0aW9uIGNvbXBsZXRlZCwgYW5kIHRoYXQgYWxsIHNjcmVlbiBtb2RlbHMgYW5kIHZpZXdzIGhhdmUgYmVlbiBjcmVhdGVkLlxyXG4gIC8vIFRoaXMgd2FzIGFkZGVkIGZvciBQaEVULWlPIGJ1dCBjYW4gYmUgdXNlZCBieSBhbnkgY2xpZW50LiBUaGlzIGRvZXMgbm90IGNvaW5jaWRlIHdpdGggdGhlIGVuZCBvZiB0aGUgU2ltXHJcbiAgLy8gY29uc3RydWN0b3IgKGJlY2F1c2UgU2ltIGhhcyBhc3luY2hyb25vdXMgc3RlcHMgdGhhdCBmaW5pc2ggYWZ0ZXIgdGhlIGNvbnN0cnVjdG9yIGlzIGNvbXBsZXRlZClcclxuICBwcml2YXRlIHJlYWRvbmx5IF9pc0NvbnN0cnVjdGlvbkNvbXBsZXRlUHJvcGVydHkgPSBuZXcgUHJvcGVydHk8Ym9vbGVhbj4oIGZhbHNlICk7XHJcbiAgcHVibGljIHJlYWRvbmx5IGlzQ29uc3RydWN0aW9uQ29tcGxldGVQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj4gPSB0aGlzLl9pc0NvbnN0cnVjdGlvbkNvbXBsZXRlUHJvcGVydHk7XHJcblxyXG4gIC8vIFN0b3JlcyB0aGUgZWZmZWN0aXZlIHdpbmRvdyBkaW1lbnNpb25zIHRoYXQgdGhlIHNpbXVsYXRpb24gd2lsbCBiZSB0YWtpbmcgdXBcclxuICBwdWJsaWMgcmVhZG9ubHkgZGltZW5zaW9uUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PERpbWVuc2lvbjI+O1xyXG5cclxuICAvLyBJbmRpY2F0ZXMgd2hlbiB0aGUgc2ltIHJlc2l6ZWQuICBUaGlzIEFjdGlvbiBpcyBpbXBsZW1lbnRlZCBzbyBpdCBjYW4gYmUgYXV0b21hdGljYWxseSBwbGF5ZWQgYmFjay5cclxuICBwcml2YXRlIHJlYWRvbmx5IHJlc2l6ZUFjdGlvbjogUGhldGlvQWN0aW9uPFsgbnVtYmVyLCBudW1iZXIgXT47XHJcblxyXG4gIC8vIChqb2lzdC1pbnRlcm5hbClcclxuICBwcml2YXRlIHJlYWRvbmx5IG5hdmlnYXRpb25CYXI6IE5hdmlnYXRpb25CYXI7XHJcbiAgcHVibGljIHJlYWRvbmx5IGhvbWVTY3JlZW46IEhvbWVTY3JlZW4gfCBudWxsO1xyXG5cclxuICAvLyBTaW0gc2NyZWVucyBub3JtYWxseSB1cGRhdGUgYnkgaW1wbGVtZW50aW5nIG1vZGVsLnN0ZXAoZHQpIG9yIHZpZXcuc3RlcChkdCkuICBXaGVuIHRoYXQgaXMgaW1wb3NzaWJsZSBvclxyXG4gIC8vIHJlbGF0aXZlbHkgYXdrd2FyZCwgaXQgaXMgcG9zc2libGUgdG8gbGlzdGVuIGZvciBhIGNhbGxiYWNrIHdoZW4gYSBmcmFtZSBiZWdpbnMsIHdoZW4gYSBmcmFtZSBpcyBiZWluZyBwcm9jZXNzZWRcclxuICAvLyBvciBhZnRlciB0aGUgZnJhbWUgaXMgY29tcGxldGUuICBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2pvaXN0L2lzc3Vlcy81MzRcclxuXHJcbiAgLy8gSW5kaWNhdGVzIHdoZW4gYSBmcmFtZSBzdGFydHMuICBMaXN0ZW4gdG8gdGhpcyBFbWl0dGVyIGlmIHlvdSBoYXZlIGFuIGFjdGlvbiB0aGF0IG11c3QgYmVcclxuICAvLyBwZXJmb3JtZWQgYmVmb3JlIHRoZSBzdGVwIGJlZ2lucy5cclxuICBwdWJsaWMgcmVhZG9ubHkgZnJhbWVTdGFydGVkRW1pdHRlciA9IG5ldyBFbWl0dGVyKCk7XHJcblxyXG4gIHB1YmxpYyByZWFkb25seSBmcmFtZUVuZGVkRW1pdHRlciA9IG5ldyBFbWl0dGVyKCB7XHJcbiAgICB0YW5kZW06IFRhbmRlbS5HRU5FUkFMX01PREVMLmNyZWF0ZVRhbmRlbSggJ2ZyYW1lRW5kZWRFbWl0dGVyJyApLFxyXG4gICAgcGhldGlvSGlnaEZyZXF1ZW5jeTogdHJ1ZSxcclxuICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdJbmRpY2F0ZXMgd2hlbiBhIGZyYW1lIGVuZHMuIExpc3RlbiB0byB0aGlzIEVtaXR0ZXIgaWYgeW91IGhhdmUgYW4gYWN0aW9uIHRoYXQgbXVzdCBiZSAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICdwZXJmb3JtZWQgYWZ0ZXIgdGhlIG1vZGVsIGFuZCB2aWV3IHN0ZXAgY29tcGxldGVzLidcclxuICB9ICk7XHJcblxyXG4gIC8vIFN0ZXBzIHRoZSBzaW11bGF0aW9uLiBUaGlzIEFjdGlvbiBpcyBpbXBsZW1lbnRlZCBzbyBpdCBjYW4gYmUgYXV0b21hdGljYWxseVxyXG4gIC8vIHBsYXllZCBiYWNrIGZvciBQaEVULWlPIHJlY29yZC9wbGF5YmFjay4gIExpc3RlbiB0byB0aGlzIEFjdGlvbiBpZiB5b3UgaGF2ZSBhbiBhY3Rpb24gdGhhdCBoYXBwZW5zIGR1cmluZyB0aGVcclxuICAvLyBzaW11bGF0aW9uIHN0ZXAuXHJcbiAgcHVibGljIHJlYWRvbmx5IHN0ZXBTaW11bGF0aW9uQWN0aW9uOiBQaGV0aW9BY3Rpb248WyBudW1iZXIgXT47XHJcblxyXG4gIC8vIHRoZSBvcmRlcmVkIGxpc3Qgb2Ygc2ltLXNwZWNpZmljIHNjcmVlbnMgdGhhdCBhcHBlYXIgaW4gdGhpcyBydW50aW1lIG9mIHRoZSBzaW1cclxuICBwdWJsaWMgcmVhZG9ubHkgc2ltU2NyZWVuczogQW55U2NyZWVuW107XHJcblxyXG4gIC8vIGFsbCBzY3JlZW5zIHRoYXQgYXBwZWFyIGluIHRoZSBydW50aW1lIG9mIHRoaXMgc2ltLCB3aXRoIHRoZSBob21lU2NyZWVuIGZpcnN0IGlmIGl0IHdhcyBjcmVhdGVkXHJcbiAgcHVibGljIHJlYWRvbmx5IHNjcmVlbnM6IEFueVNjcmVlbltdO1xyXG5cclxuICAvLyB0aGUgZGlzcGxheWVkIG5hbWUgaW4gdGhlIHNpbS4gVGhpcyBkZXBlbmRzIG9uIHdoYXQgc2NyZWVucyBhcmUgc2hvd24gdGhpcyBydW50aW1lIChlZmZlY3RlZCBieSBxdWVyeSBwYXJhbWV0ZXJzKS5cclxuICBwdWJsaWMgcmVhZG9ubHkgZGlzcGxheWVkU2ltTmFtZVByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxzdHJpbmc+O1xyXG4gIHB1YmxpYyByZWFkb25seSBzZWxlY3RlZFNjcmVlblByb3BlcnR5OiBQcm9wZXJ0eTxBbnlTY3JlZW4+O1xyXG5cclxuICAvLyB0cnVlIGlmIGFsbCBwb3NzaWJsZSBzY3JlZW5zIGFyZSBwcmVzZW50IChvcmRlci1pbmRlcGVuZGVudClcclxuICBwcml2YXRlIHJlYWRvbmx5IGFsbFNjcmVlbnNDcmVhdGVkOiBib29sZWFuO1xyXG5cclxuICBwcml2YXRlIGF2YWlsYWJsZVNjcmVlbnNQcm9wZXJ0eSE6IFByb3BlcnR5PG51bWJlcltdPjtcclxuICBwdWJsaWMgYWN0aXZlU2ltU2NyZWVuc1Byb3BlcnR5ITogUmVhZE9ubHlQcm9wZXJ0eTxBbnlTY3JlZW5bXT47XHJcblxyXG4gIC8vIFdoZW4gdGhlIHNpbSBpcyBhY3RpdmUsIHNjZW5lcnkgcHJvY2Vzc2VzIGlucHV0cyBhbmQgc3RlcFNpbXVsYXRpb24oZHQpIHJ1bnMgZnJvbSB0aGUgc3lzdGVtIGNsb2NrLlxyXG4gIC8vIFNldCB0byBmYWxzZSBmb3Igd2hlbiB0aGUgc2ltIHdpbGwgYmUgcGF1c2VkLlxyXG4gIHB1YmxpYyByZWFkb25seSBhY3RpdmVQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIHRydWUsIHtcclxuICAgIHRhbmRlbTogVGFuZGVtLkdFTkVSQUxfTU9ERUwuY3JlYXRlVGFuZGVtKCAnYWN0aXZlUHJvcGVydHknICksXHJcbiAgICBwaGV0aW9GZWF0dXJlZDogdHJ1ZSxcclxuICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIGVudGlyZSBzaW11bGF0aW9uIGlzIHJ1bm5pbmcgYW5kIHByb2Nlc3NpbmcgdXNlciBpbnB1dC4gJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAnU2V0dGluZyB0aGlzIHByb3BlcnR5IHRvIGZhbHNlIHBhdXNlcyB0aGUgc2ltdWxhdGlvbiwgYW5kIHByZXZlbnRzIHVzZXIgaW50ZXJhY3Rpb24uJ1xyXG4gIH0gKTtcclxuXHJcbiAgLy8gaW5kaWNhdGVzIHdoZXRoZXIgdGhlIGJyb3dzZXIgdGFiIGNvbnRhaW5pbmcgdGhlIHNpbXVsYXRpb24gaXMgY3VycmVudGx5IHZpc2libGVcclxuICBwdWJsaWMgcmVhZG9ubHkgYnJvd3NlclRhYlZpc2libGVQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8vIChqb2lzdC1pbnRlcm5hbCkgLSBIb3cgdGhlIGhvbWUgc2NyZWVuIGFuZCBuYXZiYXIgYXJlIHNjYWxlZC4gVGhpcyBzY2FsZSBpcyBiYXNlZCBvbiB0aGVcclxuICAvLyBIb21lU2NyZWVuJ3MgbGF5b3V0IGJvdW5kcyB0byBzdXBwb3J0IGEgY29uc2lzdGVudGx5IHNpemVkIG5hdiBiYXIgYW5kIG1lbnUuIElmIHRoaXMgc2NhbGUgd2FzIGJhc2VkIG9uIHRoZVxyXG4gIC8vIGxheW91dCBib3VuZHMgb2YgdGhlIGN1cnJlbnQgc2NyZWVuLCB0aGVyZSBjb3VsZCBiZSBkaWZmZXJlbmNlcyBpbiB0aGUgbmF2IGJhciBhY3Jvc3Mgc2NyZWVucy5cclxuICBwdWJsaWMgcmVhZG9ubHkgc2NhbGVQcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggMSApO1xyXG5cclxuICAvLyAoam9pc3QtaW50ZXJuYWwpIGdsb2JhbCBib3VuZHMgZm9yIHRoZSBlbnRpcmUgc2ltdWxhdGlvbi4gbnVsbCBiZWZvcmUgZmlyc3QgcmVzaXplXHJcbiAgcHVibGljIHJlYWRvbmx5IGJvdW5kc1Byb3BlcnR5ID0gbmV3IFByb3BlcnR5PEJvdW5kczIgfCBudWxsPiggbnVsbCApO1xyXG5cclxuICAvLyAoam9pc3QtaW50ZXJuYWwpIGdsb2JhbCBib3VuZHMgZm9yIHRoZSBzY3JlZW4tc3BlY2lmaWMgcGFydCAoZXhjbHVkZXMgdGhlIG5hdmlnYXRpb24gYmFyKSwgbnVsbCBiZWZvcmUgZmlyc3QgcmVzaXplXHJcbiAgcHVibGljIHJlYWRvbmx5IHNjcmVlbkJvdW5kc1Byb3BlcnR5ID0gbmV3IFByb3BlcnR5PEJvdW5kczIgfCBudWxsPiggbnVsbCApO1xyXG5cclxuICBwdWJsaWMgcmVhZG9ubHkgbG9va0FuZEZlZWwgPSBuZXcgTG9va0FuZEZlZWwoKTtcclxuICBwcml2YXRlIHJlYWRvbmx5IG1lbW9yeU1vbml0b3IgPSBuZXcgTWVtb3J5TW9uaXRvcigpO1xyXG5cclxuICAvLyBwdWJsaWMgKHJlYWQtb25seSkge2Jvb2xlYW59IC0gaWYgdHJ1ZSwgYWRkIHN1cHBvcnQgc3BlY2lmaWMgdG8gYWNjZXNzaWJsZSB0ZWNobm9sb2d5IHRoYXQgd29yayB3aXRoIHRvdWNoIGRldmljZXMuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBzdXBwb3J0c0dlc3R1cmVEZXNjcmlwdGlvbjogYm9vbGVhbjtcclxuXHJcbiAgLy8gSWYgYW55IHNpbSBzY3JlZW4gaGFzIGtleWJvYXJkIGhlbHAgY29udGVudCwgdHJpZ2dlciBjcmVhdGlvbiBvZiBhIGtleWJvYXJkIGhlbHAgYnV0dG9uLlxyXG4gIHB1YmxpYyByZWFkb25seSBoYXNLZXlib2FyZEhlbHBDb250ZW50OiBib29sZWFuO1xyXG5cclxuICAvLyAoam9pc3QtaW50ZXJuYWwpXHJcbiAgcHVibGljIHJlYWRvbmx5IHZlcnNpb246IHN0cmluZyA9IHBhY2thZ2VKU09OLnZlcnNpb247XHJcblxyXG4gIC8vIG51bWJlciBvZiBhbmltYXRpb24gZnJhbWVzIHRoYXQgaGF2ZSBvY2N1cnJlZFxyXG4gIHB1YmxpYyBmcmFtZUNvdW50ZXIgPSAwO1xyXG5cclxuICAvLyBXaGV0aGVyIHRoZSB3aW5kb3cgaGFzIHJlc2l6ZWQgc2luY2Ugb3VyIGxhc3QgdXBkYXRlRGlzcGxheSgpXHJcbiAgcHJpdmF0ZSByZXNpemVQZW5kaW5nID0gdHJ1ZTtcclxuXHJcbiAgLy8gTWFrZSBvdXIgbG9jYWxlIGF2YWlsYWJsZVxyXG4gIHB1YmxpYyByZWFkb25seSBsb2NhbGU6IExvY2FsZSA9IHBoZXQuY2hpcHBlci5sb2NhbGUgfHwgJ2VuJztcclxuXHJcbiAgLy8gY3JlYXRlIHRoaXMgb25seSBhZnRlciBhbGwgb3RoZXIgbWVtYmVycyBoYXZlIGJlZW4gc2V0IG9uIFNpbVxyXG4gIHByaXZhdGUgcmVhZG9ubHkgc2ltSW5mbzogU2ltSW5mbztcclxuICBwdWJsaWMgcmVhZG9ubHkgZGlzcGxheTogU2ltRGlzcGxheTtcclxuXHJcbiAgLy8gVGhlIFRvb2xiYXIgaXMgbm90IGNyZWF0ZWQgdW5sZXNzIHJlcXVlc3RlZCB3aXRoIGEgUHJlZmVyZW5jZXNNb2RlbC5cclxuICBwcml2YXRlIHJlYWRvbmx5IHRvb2xiYXI6IFRvb2xiYXIgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgLy8gTWFuYWdlcyBzdGF0ZSByZWxhdGVkIHRvIHByZWZlcmVuY2VzLiBFbmFibGVkIGZlYXR1cmVzIGZvciBwcmVmZXJlbmNlcyBhcmUgcHJvdmlkZWQgdGhyb3VnaCB0aGVcclxuICAvLyBQcmVmZXJlbmNlc01vZGVsLlxyXG4gIHB1YmxpYyByZWFkb25seSBwcmVmZXJlbmNlc01vZGVsOiBQcmVmZXJlbmNlc01vZGVsO1xyXG5cclxuICAvLyBsaXN0IG9mIG5vZGVzIHRoYXQgYXJlIFwibW9kYWxcIiBhbmQgaGVuY2UgYmxvY2sgaW5wdXQgd2l0aCB0aGUgYmFycmllclJlY3RhbmdsZS4gIFVzZWQgYnkgbW9kYWwgZGlhbG9nc1xyXG4gIC8vIGFuZCB0aGUgUGhldE1lbnVcclxuICBwcml2YXRlIG1vZGFsTm9kZVN0YWNrID0gY3JlYXRlT2JzZXJ2YWJsZUFycmF5PFBvcHVwYWJsZU5vZGU+KCk7XHJcblxyXG4gIC8vIChqb2lzdC1pbnRlcm5hbCkgU2VtaS10cmFuc3BhcmVudCBibGFjayBiYXJyaWVyIHVzZWQgdG8gYmxvY2sgaW5wdXQgZXZlbnRzIHdoZW4gYSBkaWFsb2cgKG9yIG90aGVyIHBvcHVwKVxyXG4gIC8vIGlzIHByZXNlbnQsIGFuZCBmYWRlIG91dCB0aGUgYmFja2dyb3VuZC5cclxuICBwcml2YXRlIHJlYWRvbmx5IGJhcnJpZXJSZWN0YW5nbGUgPSBuZXcgQmFycmllclJlY3RhbmdsZSggdGhpcy5tb2RhbE5vZGVTdGFjayApO1xyXG5cclxuICAvLyBsYXllciBmb3IgcG9wdXBzLCBkaWFsb2dzLCBhbmQgdGhlaXIgYmFja2dyb3VuZHMgYW5kIGJhcnJpZXJzXHJcbiAgLy8gVE9ETzogSG93IHNob3VsZCB3ZSBoYW5kbGUgdGhlIHBvcHVwIGZvciBuYXZpZ2F0aW9uPyBDYW4gd2Ugc2V0IHRoaXMgdG8gcHJpdmF0ZT8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2pvaXN0L2lzc3Vlcy84NDFcclxuICBwdWJsaWMgcmVhZG9ubHkgdG9wTGF5ZXIgPSBuZXcgTm9kZSgge1xyXG4gICAgY2hpbGRyZW46IFsgdGhpcy5iYXJyaWVyUmVjdGFuZ2xlIF1cclxuICB9ICkgYXMgVG9wTGF5ZXJOb2RlO1xyXG5cclxuICAvLyByb290IG5vZGUgZm9yIHRoZSBEaXNwbGF5XHJcbiAgcHVibGljIHJlYWRvbmx5IHJvb3ROb2RlOiBOb2RlO1xyXG5cclxuICAvLyBLZWVwIHRyYWNrIG9mIHRoZSBwcmV2aW91cyB0aW1lIGZvciBjb21wdXRpbmcgZHQsIGFuZCBpbml0aWFsbHkgc2lnbmlmeSB0aGF0IHRpbWUgaGFzbid0IGJlZW4gcmVjb3JkZWQgeWV0LlxyXG4gIHByaXZhdGUgbGFzdFN0ZXBUaW1lID0gLTE7XHJcbiAgcHJpdmF0ZSBsYXN0QW5pbWF0aW9uRnJhbWVUaW1lID0gLTE7XHJcblxyXG4gIC8vIChqb2lzdC1pbnRlcm5hbCkgQmluZCB0aGUgYW5pbWF0aW9uIGxvb3Agc28gaXQgY2FuIGJlIGNhbGxlZCBmcm9tIHJlcXVlc3RBbmltYXRpb25GcmFtZSB3aXRoIHRoZSByaWdodCB0aGlzLlxyXG4gIHByaXZhdGUgcmVhZG9ubHkgYm91bmRSdW5BbmltYXRpb25Mb29wOiAoKSA9PiB2b2lkO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgdXBkYXRlQmFja2dyb3VuZDogKCkgPT4gdm9pZDtcclxuICBwdWJsaWMgcmVhZG9ubHkgY3JlZGl0czogQ3JlZGl0c0RhdGE7XHJcblxyXG4gIC8vIFN0b3JlZCBvcHRpb24gdG8gY29udHJvbCB3aGV0aGVyIHNjcmVlbiB2aWV3cyBhcmUgcmVtb3ZlZCB3aGVuIG5vdCBhY3RpdmVcclxuICBwcml2YXRlIHJlYWRvbmx5IGRldGFjaEluYWN0aXZlU2NyZWVuVmlld3M6IGJvb2xlYW47XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBzaW1OYW1lUHJvcGVydHkgLSB0aGUgbmFtZSBvZiB0aGUgc2ltdWxhdGlvbiwgdG8gYmUgZGlzcGxheWVkIGluIHRoZSBuYXZiYXIgYW5kIGhvbWVzY3JlZW5cclxuICAgKiBAcGFyYW0gYWxsU2ltU2NyZWVucyAtIHRoZSBwb3NzaWJsZSBzY3JlZW5zIGZvciB0aGUgc2ltIGluIG9yZGVyIG9mIGRlY2xhcmF0aW9uIChkb2VzIG5vdCBpbmNsdWRlIHRoZSBob21lIHNjcmVlbilcclxuICAgKiBAcGFyYW0gW3Byb3ZpZGVkT3B0aW9uc10gLSBzZWUgYmVsb3cgZm9yIG9wdGlvbnNcclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHNpbU5hbWVQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nPiwgYWxsU2ltU2NyZWVuczogQW55U2NyZWVuW10sIHByb3ZpZGVkT3B0aW9ucz86IFNpbU9wdGlvbnMgKSB7XHJcblxyXG4gICAgd2luZG93LnBoZXRTcGxhc2hTY3JlZW5Eb3dubG9hZENvbXBsZXRlKCk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggYWxsU2ltU2NyZWVucy5sZW5ndGggPj0gMSwgJ2F0IGxlYXN0IG9uZSBzY3JlZW4gaXMgcmVxdWlyZWQnICk7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxTaW1PcHRpb25zLCBTZWxmT3B0aW9ucywgUGhldGlvT2JqZWN0T3B0aW9ucz4oKSgge1xyXG5cclxuICAgICAgY3JlZGl0czoge30sXHJcblxyXG4gICAgICAvLyBhIHtOb2RlfSBwbGFjZWQgb250byB0aGUgaG9tZSBzY3JlZW4gKGlmIGF2YWlsYWJsZSlcclxuICAgICAgaG9tZVNjcmVlbldhcm5pbmdOb2RlOiBudWxsLFxyXG5cclxuICAgICAgLy8gSWYgYSBQcmVmZXJlbmNlc01vZGVsIHN1cHBvcnRzIGFueSBwcmVmZXJlbmNlcywgdGhlIHNpbSB3aWxsIGluY2x1ZGUgdGhlIFByZWZlcmVuY2VzRGlhbG9nIGFuZCBhXHJcbiAgICAgIC8vIGJ1dHRvbiBpbiB0aGUgTmF2aWdhdGlvbkJhciB0byBvcGVuIGl0LiBTaW11bGF0aW9uIGNvbmRpdGlvbnMgKGxpa2Ugd2hhdCBsb2NhbGVzIGFyZSBhdmFpbGFibGUpIG1pZ2h0IGVuYWJsZVxyXG4gICAgICAvLyBhIFByZWZlcmVuY2VzRGlhbG9nIGJ5IGRlZmF1bHQuIEJ1dCBQcmVmZXJlbmNlc01vZGVsIGhhcyBtYW55IG9wdGlvbnMgeW91IGNhbiBwcm92aWRlLlxyXG4gICAgICBwcmVmZXJlbmNlc01vZGVsOiBudWxsLFxyXG5cclxuICAgICAgLy8gUGFzc2VkIHRvIFNpbURpc3BsYXksIGJ1dCBhIHRvcCBsZXZlbCBvcHRpb24gZm9yIEFQSSBlYXNlLlxyXG4gICAgICB3ZWJnbDogU2ltRGlzcGxheS5ERUZBVUxUX1dFQkdMLFxyXG4gICAgICBkZXRhY2hJbmFjdGl2ZVNjcmVlblZpZXdzOiBmYWxzZSxcclxuXHJcbiAgICAgIC8vIHBoZXQtaW9cclxuICAgICAgcGhldGlvU3RhdGU6IGZhbHNlLFxyXG4gICAgICBwaGV0aW9SZWFkT25seTogdHJ1ZSxcclxuICAgICAgdGFuZGVtOiBUYW5kZW0uUk9PVFxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgaWYgKCAhb3B0aW9ucy5wcmVmZXJlbmNlc01vZGVsICkge1xyXG4gICAgICBvcHRpb25zLnByZWZlcmVuY2VzTW9kZWwgPSBuZXcgUHJlZmVyZW5jZXNNb2RlbCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFNvbWUgb3B0aW9ucyBhcmUgdXNlZCBieSBzaW0gYW5kIFNpbURpc3BsYXkuIFByb21vdGUgd2ViZ2wgdG8gdG9wIGxldmVsIHNpbSBvcHRpb24gb3V0IG9mIEFQSSBlYXNlLCBidXQgaXQgaXNcclxuICAgIC8vIHBhc3NlZCB0byB0aGUgU2ltRGlzcGxheS5cclxuICAgIGNvbnN0IHNpbURpc3BsYXlPcHRpb25zOiBTaW1EaXNwbGF5T3B0aW9ucyA9IHtcclxuICAgICAgd2ViZ2w6IG9wdGlvbnMud2ViZ2wsXHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLkdFTkVSQUxfVklFVy5jcmVhdGVUYW5kZW0oICdkaXNwbGF5JyApLFxyXG4gICAgICBwcmVmZXJlbmNlc01vZGVsOiBvcHRpb25zLnByZWZlcmVuY2VzTW9kZWxcclxuICAgIH07XHJcblxyXG4gICAgc3VwZXIoIG9wdGlvbnMgKTtcclxuXHJcbiAgICB0aGlzLmNyZWRpdHMgPSBvcHRpb25zLmNyZWRpdHM7XHJcbiAgICB0aGlzLmRldGFjaEluYWN0aXZlU2NyZWVuVmlld3MgPSBvcHRpb25zLmRldGFjaEluYWN0aXZlU2NyZWVuVmlld3M7XHJcblxyXG4gICAgdGhpcy5zaW1OYW1lUHJvcGVydHkgPSBzaW1OYW1lUHJvcGVydHk7XHJcblxyXG4gICAgLy8gcGxheWJhY2tNb2RlRW5hYmxlZFByb3BlcnR5IGNhbm5vdCBiZSBjaGFuZ2VkIGFmdGVyIFNpbSBjb25zdHJ1Y3Rpb24gaGFzIGJlZ3VuLCBoZW5jZSB0aGlzIGxpc3RlbmVyIGlzIGFkZGVkIGJlZm9yZVxyXG4gICAgLy8gYW55dGhpbmcgZWxzZSBpcyBkb25lLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXQtaW8vaXNzdWVzLzExNDZcclxuICAgIHBoZXQuam9pc3QucGxheWJhY2tNb2RlRW5hYmxlZFByb3BlcnR5LmxhenlMaW5rKCAoKSA9PiB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggJ3BsYXliYWNrTW9kZUVuYWJsZWRQcm9wZXJ0eSBjYW5ub3QgYmUgY2hhbmdlZCBhZnRlciBTaW0gY29uc3RydWN0aW9uIGhhcyBiZWd1bicgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgdGhpcy5pc0NvbnN0cnVjdGlvbkNvbXBsZXRlUHJvcGVydHkubGF6eUxpbmsoIGlzQ29uc3RydWN0aW9uQ29tcGxldGUgPT4ge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0NvbnN0cnVjdGlvbkNvbXBsZXRlLCAnU2ltIGNvbnN0cnVjdGlvbiBzaG91bGQgbmV2ZXIgdW5jb21wbGV0ZScgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICBjb25zdCBkaW1lbnNpb25Qcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSggbmV3IERpbWVuc2lvbjIoIDAsIDAgKSwge1xyXG4gICAgICB2YWx1ZUNvbXBhcmlzb25TdHJhdGVneTogJ2VxdWFsc0Z1bmN0aW9uJ1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIE5vdGU6IHRoZSBwdWJsaWMgQVBJIGlzIFRSZWFkT25seVByb3BlcnR5XHJcbiAgICB0aGlzLmRpbWVuc2lvblByb3BlcnR5ID0gZGltZW5zaW9uUHJvcGVydHk7XHJcblxyXG4gICAgdGhpcy5yZXNpemVBY3Rpb24gPSBuZXcgUGhldGlvQWN0aW9uPFsgbnVtYmVyLCBudW1iZXIgXT4oICggd2lkdGgsIGhlaWdodCApID0+IHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggd2lkdGggPiAwICYmIGhlaWdodCA+IDAsICdzaW0gc2hvdWxkIGhhdmUgYSBub256ZXJvIGFyZWEnICk7XHJcblxyXG4gICAgICBkaW1lbnNpb25Qcm9wZXJ0eS52YWx1ZSA9IG5ldyBEaW1lbnNpb24yKCB3aWR0aCwgaGVpZ2h0ICk7XHJcblxyXG4gICAgICAvLyBHcmFjZWZ1bGx5IHN1cHBvcnQgYmFkIGRpbWVuc2lvbnMsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzQ3MlxyXG4gICAgICBpZiAoIHdpZHRoID09PSAwIHx8IGhlaWdodCA9PT0gMCApIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY29uc3Qgc2NhbGUgPSBNYXRoLm1pbiggd2lkdGggLyBIb21lU2NyZWVuVmlldy5MQVlPVVRfQk9VTkRTLndpZHRoLCBoZWlnaHQgLyBIb21lU2NyZWVuVmlldy5MQVlPVVRfQk9VTkRTLmhlaWdodCApO1xyXG5cclxuICAgICAgLy8gNDAgcHggaGlnaCBvbiBpUGFkIE1vYmlsZSBTYWZhcmlcclxuICAgICAgY29uc3QgbmF2QmFySGVpZ2h0ID0gc2NhbGUgKiBOYXZpZ2F0aW9uQmFyLk5BVklHQVRJT05fQkFSX1NJWkUuaGVpZ2h0O1xyXG4gICAgICB0aGlzLm5hdmlnYXRpb25CYXIubGF5b3V0KCBzY2FsZSwgd2lkdGgsIG5hdkJhckhlaWdodCApO1xyXG4gICAgICB0aGlzLm5hdmlnYXRpb25CYXIueSA9IGhlaWdodCAtIG5hdkJhckhlaWdodDtcclxuICAgICAgdGhpcy5kaXNwbGF5LnNldFNpemUoIG5ldyBEaW1lbnNpb24yKCB3aWR0aCwgaGVpZ2h0ICkgKTtcclxuICAgICAgY29uc3Qgc2NyZWVuSGVpZ2h0ID0gaGVpZ2h0IC0gdGhpcy5uYXZpZ2F0aW9uQmFyLmhlaWdodDtcclxuXHJcbiAgICAgIGlmICggdGhpcy50b29sYmFyICkge1xyXG4gICAgICAgIHRoaXMudG9vbGJhci5sYXlvdXQoIHNjYWxlLCBzY3JlZW5IZWlnaHQgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gVGhlIGF2YWlsYWJsZSBib3VuZHMgZm9yIHNjcmVlbnMgYW5kIHRvcCBsYXllciBjaGlsZHJlbiAtIHRob3VnaCBjdXJyZW50bHkgcHJvdmlkZWRcclxuICAgICAgLy8gZnVsbCB3aWR0aCBhbmQgaGVpZ2h0LCB3aWxsIHNvb24gYmUgcmVkdWNlZCB3aGVuIG1lbnVzIChzcGVjaWZpY2FsbHkgdGhlIFByZWZlcmVuY2VzXHJcbiAgICAgIC8vIFRvb2xiYXIpIHRha2VzIHVwIHNjcmVlbiBzcGFjZS5cclxuICAgICAgY29uc3Qgc2NyZWVuTWluWCA9IHRoaXMudG9vbGJhciA/IHRoaXMudG9vbGJhci5nZXREaXNwbGF5ZWRXaWR0aCgpIDogMDtcclxuICAgICAgY29uc3QgYXZhaWxhYmxlU2NyZWVuQm91bmRzID0gbmV3IEJvdW5kczIoIHNjcmVlbk1pblgsIDAsIHdpZHRoLCBzY3JlZW5IZWlnaHQgKTtcclxuXHJcbiAgICAgIC8vIExheW91dCBlYWNoIG9mIHRoZSBzY3JlZW5zXHJcbiAgICAgIF8uZWFjaCggdGhpcy5zY3JlZW5zLCBtID0+IG0udmlldy5sYXlvdXQoIGF2YWlsYWJsZVNjcmVlbkJvdW5kcyApICk7XHJcblxyXG4gICAgICB0aGlzLnRvcExheWVyLmNoaWxkcmVuLmZvckVhY2goIGNoaWxkID0+IHtcclxuICAgICAgICBjaGlsZC5sYXlvdXQgJiYgY2hpbGQubGF5b3V0KCBhdmFpbGFibGVTY3JlZW5Cb3VuZHMgKTtcclxuICAgICAgfSApO1xyXG5cclxuICAgICAgLy8gRml4ZXMgcHJvYmxlbXMgd2hlcmUgdGhlIGRpdiB3b3VsZCBiZSB3YXkgb2ZmIGNlbnRlciBvbiBpT1M3XHJcbiAgICAgIGlmICggcGxhdGZvcm0ubW9iaWxlU2FmYXJpICkge1xyXG4gICAgICAgIHdpbmRvdy5zY3JvbGxUbyggMCwgMCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyB1cGRhdGUgb3VyIHNjYWxlIGFuZCBib3VuZHMgcHJvcGVydGllcyBhZnRlciBvdGhlciBjaGFuZ2VzIChzbyBsaXN0ZW5lcnMgY2FuIGJlIGZpcmVkIGFmdGVyIHNjcmVlbnMgYXJlIHJlc2l6ZWQpXHJcbiAgICAgIHRoaXMuc2NhbGVQcm9wZXJ0eS52YWx1ZSA9IHNjYWxlO1xyXG4gICAgICB0aGlzLmJvdW5kc1Byb3BlcnR5LnZhbHVlID0gbmV3IEJvdW5kczIoIDAsIDAsIHdpZHRoLCBoZWlnaHQgKTtcclxuICAgICAgdGhpcy5zY3JlZW5Cb3VuZHNQcm9wZXJ0eS52YWx1ZSA9IGF2YWlsYWJsZVNjcmVlbkJvdW5kcy5jb3B5KCk7XHJcblxyXG4gICAgICAvLyBzZXQgdGhlIHNjYWxlIGRlc2NyaWJpbmcgdGhlIHRhcmdldCBOb2RlLCBzaW5jZSBzY2FsZSBmcm9tIHdpbmRvdyByZXNpemUgaXMgYXBwbGllZCB0byBlYWNoIFNjcmVlblZpZXcsXHJcbiAgICAgIC8vIChjaGlsZHJlbiBvZiB0aGUgUGFuWm9vbUxpc3RlbmVyIHRhcmdldE5vZGUpXHJcbiAgICAgIGFuaW1hdGVkUGFuWm9vbVNpbmdsZXRvbi5saXN0ZW5lci5zZXRUYXJnZXRTY2FsZSggc2NhbGUgKTtcclxuXHJcbiAgICAgIC8vIHNldCB0aGUgYm91bmRzIHdoaWNoIGFjY3VyYXRlbHkgZGVzY3JpYmUgdGhlIHBhblpvb21MaXN0ZW5lciB0YXJnZXROb2RlLCBzaW5jZSBpdCB3b3VsZCBvdGhlcndpc2UgYmVcclxuICAgICAgLy8gaW5hY2N1cmF0ZSB3aXRoIHRoZSB2ZXJ5IGxhcmdlIEJhcnJpZXJSZWN0YW5nbGVcclxuICAgICAgYW5pbWF0ZWRQYW5ab29tU2luZ2xldG9uLmxpc3RlbmVyLnNldFRhcmdldEJvdW5kcyggdGhpcy5ib3VuZHNQcm9wZXJ0eS52YWx1ZSApO1xyXG5cclxuICAgICAgLy8gY29uc3RyYWluIHRoZSBzaW11bGF0aW9uIHBhbiBib3VuZHMgc28gdGhhdCBpdCBjYW5ub3QgYmUgbW92ZWQgb2ZmIHNjcmVlblxyXG4gICAgICBhbmltYXRlZFBhblpvb21TaW5nbGV0b24ubGlzdGVuZXIuc2V0UGFuQm91bmRzKCB0aGlzLmJvdW5kc1Byb3BlcnR5LnZhbHVlICk7XHJcblxyXG4gICAgICAvLyBTZXQgYSBjb3JyZWN0aXZlIHNjYWxpbmcgZm9yIGFsbCBIaWdobGlnaHRQYXRocywgc28gdGhhdCBmb2N1cyBoaWdobGlnaHQgbGluZSB3aWR0aHNcclxuICAgICAgLy8gc2NhbGUgYW5kIGxvb2sgdGhlIHNhbWUgaW4gdmlldyBjb29yZGluYXRlcyBmb3IgYWxsIGxheW91dCBzY2FsZXMuXHJcbiAgICAgIEhpZ2hsaWdodFBhdGgubGF5b3V0U2NhbGUgPSBzY2FsZTtcclxuICAgIH0sIHtcclxuICAgICAgdGFuZGVtOiBUYW5kZW0uR0VORVJBTF9NT0RFTC5jcmVhdGVUYW5kZW0oICdyZXNpemVBY3Rpb24nICksXHJcbiAgICAgIHBhcmFtZXRlcnM6IFtcclxuICAgICAgICB7IG5hbWU6ICd3aWR0aCcsIHBoZXRpb1R5cGU6IE51bWJlcklPIH0sXHJcbiAgICAgICAgeyBuYW1lOiAnaGVpZ2h0JywgcGhldGlvVHlwZTogTnVtYmVySU8gfVxyXG4gICAgICBdLFxyXG4gICAgICBwaGV0aW9QbGF5YmFjazogdHJ1ZSxcclxuICAgICAgcGhldGlvRXZlbnRNZXRhZGF0YToge1xyXG5cclxuICAgICAgICAvLyByZXNpemVBY3Rpb24gbmVlZHMgdG8gYWx3YXlzIGJlIHBsYXliYWNrYWJsZSBiZWNhdXNlIGl0IGFjdHMgaW5kZXBlbmRlbnRseSBvZiBhbnkgb3RoZXIgcGxheWJhY2sgZXZlbnQuXHJcbiAgICAgICAgLy8gQmVjYXVzZSBvZiBpdHMgdW5pcXVlIG5hdHVyZSwgaXQgc2hvdWxkIGJlIGEgXCJ0b3AtbGV2ZWxcIiBgcGxheWJhY2s6IHRydWVgIGV2ZW50IHNvIHRoYXQgaXQgaXMgbmV2ZXIgbWFya2VkIGFzXHJcbiAgICAgICAgLy8gYHBsYXliYWNrOiBmYWxzZWAuIFRoZXJlIGFyZSBjYXNlcyB3aGVyZSBpdCBpcyBuZXN0ZWQgdW5kZXIgYW5vdGhlciBgcGxheWJhY2s6IHRydWVgIGV2ZW50LCBsaWtlIHdoZW4gdGhlXHJcbiAgICAgICAgLy8gd3JhcHBlciBsYXVuY2hlcyB0aGUgc2ltdWxhdGlvbiwgdGhhdCBjYW5ub3QgYmUgYXZvaWRlZC4gRm9yIHRoaXMgcmVhc29uLCB3ZSB1c2UgdGhpcyBvdmVycmlkZS5cclxuICAgICAgICBhbHdheXNQbGF5YmFja2FibGVPdmVycmlkZTogdHJ1ZVxyXG4gICAgICB9LFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnRXhlY3V0ZXMgd2hlbiB0aGUgc2ltIGlzIHJlc2l6ZWQuIFZhbHVlcyBhcmUgdGhlIHNpbSBkaW1lbnNpb25zIGluIENTUyBwaXhlbHMuJ1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuc3RlcFNpbXVsYXRpb25BY3Rpb24gPSBuZXcgUGhldGlvQWN0aW9uKCBkdCA9PiB7XHJcbiAgICAgIHRoaXMuZnJhbWVTdGFydGVkRW1pdHRlci5lbWl0KCk7XHJcblxyXG4gICAgICAvLyBpbmNyZW1lbnQgdGhpcyBiZWZvcmUgd2UgY2FuIGhhdmUgYW4gZXhjZXB0aW9uIHRocm93biwgdG8gc2VlIGlmIHdlIGFyZSBtaXNzaW5nIGZyYW1lc1xyXG4gICAgICB0aGlzLmZyYW1lQ291bnRlcisrO1xyXG5cclxuICAgICAgLy8gQXBwbHkgdGltZSBzY2FsZSBlZmZlY3RzIGhlcmUgYmVmb3JlIHVzYWdlXHJcbiAgICAgIGR0ICo9IHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuc3BlZWQ7XHJcblxyXG4gICAgICBpZiAoIHRoaXMucmVzaXplUGVuZGluZyApIHtcclxuICAgICAgICB0aGlzLnJlc2l6ZVRvV2luZG93KCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIElmIHRoZSB1c2VyIGlzIG9uIHRoZSBob21lIHNjcmVlbiwgd2Ugd29uJ3QgaGF2ZSBhIFNjcmVlbiB0aGF0IHdlJ2xsIHdhbnQgdG8gc3RlcC4gIFRoaXMgbXVzdCBiZSBkb25lIGFmdGVyXHJcbiAgICAgIC8vIGZ1enogbW91c2UsIGJlY2F1c2UgZnV6emluZyBjb3VsZCBjaGFuZ2UgdGhlIHNlbGVjdGVkIHNjcmVlbiwgc2VlICMxMzBcclxuICAgICAgY29uc3Qgc2NyZWVuID0gdGhpcy5zZWxlY3RlZFNjcmVlblByb3BlcnR5LnZhbHVlO1xyXG5cclxuICAgICAgLy8gY2FwIGR0IGJhc2VkIG9uIHRoZSBjdXJyZW50IHNjcmVlbiwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9qb2lzdC9pc3N1ZXMvMTMwXHJcbiAgICAgIGR0ID0gTWF0aC5taW4oIGR0LCBzY3JlZW4ubWF4RFQgKTtcclxuXHJcbiAgICAgIC8vIFRPRE86IHdlIGFyZSAvMTAwMCBqdXN0IHRvICoxMDAwPyAgU2VlbXMgd2FzdGVmdWwgYW5kIGxpa2Ugb3Bwb3J0dW5pdHkgZm9yIGVycm9yLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2pvaXN0L2lzc3Vlcy8zODdcclxuICAgICAgLy8gU3RvcmUgdGhlIGVsYXBzZWQgdGltZSBpbiBtaWxsaXNlY29uZHMgZm9yIHVzYWdlIGJ5IFR3ZWVuIGNsaWVudHNcclxuICAgICAgcGhldC5qb2lzdC5lbGFwc2VkVGltZSArPSBkdCAqIDEwMDA7XHJcblxyXG4gICAgICAvLyB0aW1lciBzdGVwIGJlZm9yZSBtb2RlbC92aWV3IHN0ZXBzLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2pvaXN0L2lzc3Vlcy80MDFcclxuICAgICAgLy8gTm90ZSB0aGF0IHRoaXMgaXMgdml0YWwgdG8gc3VwcG9ydCBJbnRlcmFjdGl2ZSBEZXNjcmlwdGlvbiBhbmQgdGhlIHV0dGVyYW5jZSBxdWV1ZS5cclxuICAgICAgc3RlcFRpbWVyLmVtaXQoIGR0ICk7XHJcblxyXG4gICAgICAvLyBJZiB0aGUgZHQgaXMgMCwgd2Ugd2lsbCBza2lwIHRoZSBtb2RlbCBzdGVwIChzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2pvaXN0L2lzc3Vlcy8xNzEpXHJcbiAgICAgIGlmICggc2NyZWVuLm1vZGVsLnN0ZXAgJiYgZHQgKSB7XHJcbiAgICAgICAgc2NyZWVuLm1vZGVsLnN0ZXAoIGR0ICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIElmIHVzaW5nIHRoZSBUV0VFTiBhbmltYXRpb24gbGlicmFyeSwgdGhlbiB1cGRhdGUgdHdlZW5zIGJlZm9yZSByZW5kZXJpbmcgdGhlIHNjZW5lLlxyXG4gICAgICAvLyBVcGRhdGUgdGhlIHR3ZWVucyBhZnRlciB0aGUgbW9kZWwgaXMgdXBkYXRlZCBidXQgYmVmb3JlIHRoZSB2aWV3IHN0ZXAuXHJcbiAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzQwMS5cclxuICAgICAgLy9UT0RPIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9qb2lzdC9pc3N1ZXMvNDA0IHJ1biBUV0VFTnMgZm9yIHRoZSBzZWxlY3RlZCBzY3JlZW4gb25seVxyXG4gICAgICBpZiAoIHdpbmRvdy5UV0VFTiApIHtcclxuICAgICAgICB3aW5kb3cuVFdFRU4udXBkYXRlKCBwaGV0LmpvaXN0LmVsYXBzZWRUaW1lICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuZGlzcGxheS5zdGVwKCBkdCApO1xyXG5cclxuICAgICAgLy8gVmlldyBzdGVwIGlzIHRoZSBsYXN0IHRoaW5nIGJlZm9yZSB1cGRhdGVEaXNwbGF5KCksIHNvIHdlIGNhbiBkbyBwYWludCB1cGRhdGVzIHRoZXJlLlxyXG4gICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2pvaXN0L2lzc3Vlcy80MDEuXHJcbiAgICAgIHNjcmVlbi52aWV3LnN0ZXAoIGR0ICk7XHJcblxyXG4gICAgICAvLyBEbyBub3QgdXBkYXRlIHRoZSBkaXNwbGF5IHdoaWxlIFBoRVQtaU8gaXMgY3VzdG9taXppbmcsIG9yIGl0IGNvdWxkIHNob3cgdGhlIHNpbSBiZWZvcmUgaXQgaXMgZnVsbHkgcmVhZHkgZm9yIGRpc3BsYXkuXHJcbiAgICAgIGlmICggISggVGFuZGVtLlBIRVRfSU9fRU5BQkxFRCAmJiAhcGhldC5waGV0aW8ucGhldGlvRW5naW5lLmlzUmVhZHlGb3JEaXNwbGF5ICkgKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwbGF5LnVwZGF0ZURpc3BsYXkoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLm1lbW9yeUxpbWl0ICkge1xyXG4gICAgICAgIHRoaXMubWVtb3J5TW9uaXRvci5tZWFzdXJlKCk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5mcmFtZUVuZGVkRW1pdHRlci5lbWl0KCk7XHJcbiAgICB9LCB7XHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLkdFTkVSQUxfTU9ERUwuY3JlYXRlVGFuZGVtKCAnc3RlcFNpbXVsYXRpb25BY3Rpb24nICksXHJcbiAgICAgIHBhcmFtZXRlcnM6IFsge1xyXG4gICAgICAgIG5hbWU6ICdkdCcsXHJcbiAgICAgICAgcGhldGlvVHlwZTogTnVtYmVySU8sXHJcbiAgICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ1RoZSBhbW91bnQgb2YgdGltZSBzdGVwcGVkIGluIGVhY2ggY2FsbCwgaW4gc2Vjb25kcy4nXHJcbiAgICAgIH0gXSxcclxuICAgICAgcGhldGlvSGlnaEZyZXF1ZW5jeTogdHJ1ZSxcclxuICAgICAgcGhldGlvUGxheWJhY2s6IHRydWUsXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdBIGZ1bmN0aW9uIHRoYXQgc3RlcHMgdGltZSBmb3J3YXJkLidcclxuICAgIH0gKTtcclxuXHJcbiAgICBjb25zdCBzY3JlZW5zVGFuZGVtID0gVGFuZGVtLkdFTkVSQUxfTU9ERUwuY3JlYXRlVGFuZGVtKCAnc2NyZWVucycgKTtcclxuXHJcbiAgICBjb25zdCBzY3JlZW5EYXRhID0gc2VsZWN0U2NyZWVucyhcclxuICAgICAgYWxsU2ltU2NyZWVucyxcclxuICAgICAgcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5ob21lU2NyZWVuLFxyXG4gICAgICBRdWVyeVN0cmluZ01hY2hpbmUuY29udGFpbnNLZXkoICdob21lU2NyZWVuJyApLFxyXG4gICAgICBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmluaXRpYWxTY3JlZW4sXHJcbiAgICAgIFF1ZXJ5U3RyaW5nTWFjaGluZS5jb250YWluc0tleSggJ2luaXRpYWxTY3JlZW4nICksXHJcbiAgICAgIHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuc2NyZWVucyxcclxuICAgICAgUXVlcnlTdHJpbmdNYWNoaW5lLmNvbnRhaW5zS2V5KCAnc2NyZWVucycgKSxcclxuICAgICAgc2VsZWN0ZWRTaW1TY3JlZW5zID0+IHtcclxuICAgICAgICBjb25zdCBwb3NzaWJsZVNjcmVlbkluZGljZXMgPSBzZWxlY3RlZFNpbVNjcmVlbnMubWFwKCBzY3JlZW4gPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIGFsbFNpbVNjcmVlbnMuaW5kZXhPZiggc2NyZWVuICkgKyAxO1xyXG4gICAgICAgIH0gKTtcclxuICAgICAgICBjb25zdCB2YWxpZFZhbHVlcyA9IF8uZmxhdHRlbiggQ29tYmluYXRpb24uY29tYmluYXRpb25zT2YoIHBvc3NpYmxlU2NyZWVuSW5kaWNlcyApLm1hcCggc3Vic2V0ID0+IFBlcm11dGF0aW9uLnBlcm11dGF0aW9uc09mKCBzdWJzZXQgKSApIClcclxuICAgICAgICAgIC5maWx0ZXIoIGFycmF5ID0+IGFycmF5Lmxlbmd0aCA+IDAgKS5zb3J0KCk7XHJcblxyXG4gICAgICAgIC8vIENvbnRyb2xzIHRoZSBzdWJzZXQgKGFuZCBvcmRlcikgb2Ygc2NyZWVucyB0aGF0IGFwcGVhciB0byB0aGUgdXNlci4gU2VwYXJhdGUgZnJvbSB0aGUgP3NjcmVlbnMgcXVlcnkgcGFyYW1ldGVyXHJcbiAgICAgICAgLy8gZm9yIHBoZXQtaW8gcHVycG9zZXMuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzgyN1xyXG4gICAgICAgIHRoaXMuYXZhaWxhYmxlU2NyZWVuc1Byb3BlcnR5ID0gbmV3IFByb3BlcnR5KCBwb3NzaWJsZVNjcmVlbkluZGljZXMsIHtcclxuICAgICAgICAgIHRhbmRlbTogc2NyZWVuc1RhbmRlbS5jcmVhdGVUYW5kZW0oICdhdmFpbGFibGVTY3JlZW5zUHJvcGVydHknICksXHJcbiAgICAgICAgICBpc1ZhbGlkVmFsdWU6IHZhbHVlID0+IF8uc29tZSggdmFsaWRWYWx1ZXMsIHZhbGlkVmFsdWUgPT4gXy5pc0VxdWFsKCB2YWx1ZSwgdmFsaWRWYWx1ZSApICksXHJcbiAgICAgICAgICBwaGV0aW9GZWF0dXJlZDogdHJ1ZSxcclxuICAgICAgICAgIHBoZXRpb1ZhbHVlVHlwZTogQXJyYXlJTyggTnVtYmVySU8gKSxcclxuICAgICAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdDb250cm9scyB3aGljaCBzY3JlZW5zIGFyZSBhdmFpbGFibGUsIGFuZCB0aGUgb3JkZXIgdGhleSBhcmUgZGlzcGxheWVkLidcclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgIHRoaXMuYWN0aXZlU2ltU2NyZWVuc1Byb3BlcnR5ID0gbmV3IERlcml2ZWRQcm9wZXJ0eSggWyB0aGlzLmF2YWlsYWJsZVNjcmVlbnNQcm9wZXJ0eSBdLCBzY3JlZW5JbmRpY2VzID0+IHtcclxuICAgICAgICAgIHJldHVybiBzY3JlZW5JbmRpY2VzLm1hcCggaW5kZXggPT4gYWxsU2ltU2NyZWVuc1sgaW5kZXggLSAxIF0gKTtcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH0sXHJcbiAgICAgIHNlbGVjdGVkU2ltU2NyZWVucyA9PiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBIb21lU2NyZWVuKCB0aGlzLnNpbU5hbWVQcm9wZXJ0eSwgKCkgPT4gdGhpcy5zZWxlY3RlZFNjcmVlblByb3BlcnR5LCBzZWxlY3RlZFNpbVNjcmVlbnMsIHRoaXMuYWN0aXZlU2ltU2NyZWVuc1Byb3BlcnR5LCB7XHJcbiAgICAgICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggd2luZG93LnBoZXRpby5QaGV0aW9JRFV0aWxzLkhPTUVfU0NSRUVOX0NPTVBPTkVOVF9OQU1FICksXHJcbiAgICAgICAgICB3YXJuaW5nTm9kZTogb3B0aW9ucy5ob21lU2NyZWVuV2FybmluZ05vZGVcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgdGhpcy5ob21lU2NyZWVuID0gc2NyZWVuRGF0YS5ob21lU2NyZWVuO1xyXG4gICAgdGhpcy5zaW1TY3JlZW5zID0gc2NyZWVuRGF0YS5zZWxlY3RlZFNpbVNjcmVlbnM7XHJcbiAgICB0aGlzLnNjcmVlbnMgPSBzY3JlZW5EYXRhLnNjcmVlbnM7XHJcbiAgICB0aGlzLmFsbFNjcmVlbnNDcmVhdGVkID0gc2NyZWVuRGF0YS5hbGxTY3JlZW5zQ3JlYXRlZDtcclxuXHJcbiAgICB0aGlzLnNlbGVjdGVkU2NyZWVuUHJvcGVydHkgPSBuZXcgUHJvcGVydHk8QW55U2NyZWVuPiggc2NyZWVuRGF0YS5pbml0aWFsU2NyZWVuLCB7XHJcbiAgICAgIHRhbmRlbTogc2NyZWVuc1RhbmRlbS5jcmVhdGVUYW5kZW0oICdzZWxlY3RlZFNjcmVlblByb3BlcnR5JyApLFxyXG4gICAgICBwaGV0aW9GZWF0dXJlZDogdHJ1ZSxcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ0RldGVybWluZXMgd2hpY2ggc2NyZWVuIGlzIHNlbGVjdGVkIGluIHRoZSBzaW11bGF0aW9uJyxcclxuICAgICAgdmFsaWRWYWx1ZXM6IHRoaXMuc2NyZWVucyxcclxuICAgICAgcGhldGlvVmFsdWVUeXBlOiBTY3JlZW4uU2NyZWVuSU9cclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBJZiB0aGUgYWN0aXZlU2ltU2NyZWVucyBjaGFuZ2VzLCB3ZSdsbCB3YW50IHRvIHVwZGF0ZSB3aGF0IHRoZSBhY3RpdmUgc2NyZWVuIChvciBzZWxlY3RlZCBzY3JlZW4pIGlzIGZvciBzcGVjaWZpY1xyXG4gICAgLy8gY2FzZXMuXHJcbiAgICB0aGlzLmFjdGl2ZVNpbVNjcmVlbnNQcm9wZXJ0eS5sYXp5TGluayggc2NyZWVucyA9PiB7XHJcbiAgICAgIGNvbnN0IHNjcmVlbiA9IHRoaXMuc2VsZWN0ZWRTY3JlZW5Qcm9wZXJ0eS52YWx1ZTtcclxuICAgICAgaWYgKCBzY3JlZW4gPT09IHRoaXMuaG9tZVNjcmVlbiApIHtcclxuICAgICAgICBpZiAoIHNjcmVlbnMubGVuZ3RoID09PSAxICkge1xyXG4gICAgICAgICAgLy8gSWYgd2UncmUgb24gdGhlIGhvbWUgc2NyZWVuIGFuZCBpdCBzd2l0Y2hlcyB0byBhIDEtc2NyZWVuIHNpbSwgZ28gdG8gdGhhdCBzY3JlZW5cclxuICAgICAgICAgIHRoaXMuc2VsZWN0ZWRTY3JlZW5Qcm9wZXJ0eS52YWx1ZSA9IHNjcmVlbnNbIDAgXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoICFzY3JlZW5zLmluY2x1ZGVzKCB0aGlzLmhvbWVTY3JlZW4ubW9kZWwuc2VsZWN0ZWRTY3JlZW5Qcm9wZXJ0eS52YWx1ZSApICkge1xyXG4gICAgICAgICAgLy8gSWYgd2UncmUgb24gdGhlIGhvbWUgc2NyZWVuIGFuZCBvdXIgXCJzZWxlY3RlZFwiIHNjcmVlbiBkaXNhcHBlYXJzLCBzZWxlY3QgdGhlIGZpcnN0IHNpbSBzY3JlZW5cclxuICAgICAgICAgIHRoaXMuaG9tZVNjcmVlbi5tb2RlbC5zZWxlY3RlZFNjcmVlblByb3BlcnR5LnZhbHVlID0gc2NyZWVuc1sgMCBdO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggIXNjcmVlbnMuaW5jbHVkZXMoIHNjcmVlbiApICkge1xyXG4gICAgICAgIC8vIElmIHdlJ3JlIG9uIGEgc2NyZWVuIHRoYXQgXCJkaXNhcHBlYXJzXCIsIGdvIHRvIHRoZSBmaXJzdCBzY3JlZW5cclxuICAgICAgICB0aGlzLnNlbGVjdGVkU2NyZWVuUHJvcGVydHkudmFsdWUgPSBzY3JlZW5zWyAwIF07XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLmRpc3BsYXllZFNpbU5hbWVQcm9wZXJ0eSA9IERlcml2ZWRQcm9wZXJ0eS5kZXJpdmVBbnkoIFtcclxuICAgICAgdGhpcy5hdmFpbGFibGVTY3JlZW5zUHJvcGVydHksXHJcbiAgICAgIHRoaXMuc2ltTmFtZVByb3BlcnR5LFxyXG4gICAgICB0aGlzLnNlbGVjdGVkU2NyZWVuUHJvcGVydHksXHJcbiAgICAgIEpvaXN0U3RyaW5ncy5zaW1UaXRsZVdpdGhTY3JlZW5OYW1lUGF0dGVyblN0cmluZ1Byb3BlcnR5LFxyXG4gICAgICAuLi50aGlzLnNjcmVlbnMubWFwKCBzY3JlZW4gPT4gc2NyZWVuLm5hbWVQcm9wZXJ0eSApXHJcblxyXG4gICAgICAvLyBXZSBqdXN0IG5lZWQgbm90aWZpY2F0aW9ucyBvbiBhbnkgb2YgdGhlc2UgY2hhbmdpbmcsIHJldHVybiBhcmdzIGFzIGEgdW5pcXVlIHZhbHVlIHRvIG1ha2Ugc3VyZSBsaXN0ZW5lcnMgZmlyZS5cclxuICAgIF0sICgpID0+IHtcclxuICAgICAgY29uc3QgYXZhaWxhYmxlU2NyZWVucyA9IHRoaXMuYXZhaWxhYmxlU2NyZWVuc1Byb3BlcnR5LnZhbHVlO1xyXG4gICAgICBjb25zdCBzaW1OYW1lID0gdGhpcy5zaW1OYW1lUHJvcGVydHkudmFsdWU7XHJcbiAgICAgIGNvbnN0IHNlbGVjdGVkU2NyZWVuID0gdGhpcy5zZWxlY3RlZFNjcmVlblByb3BlcnR5LnZhbHVlO1xyXG4gICAgICBjb25zdCB0aXRsZVdpdGhTY3JlZW5QYXR0ZXJuID0gSm9pc3RTdHJpbmdzLnNpbVRpdGxlV2l0aFNjcmVlbk5hbWVQYXR0ZXJuU3RyaW5nUHJvcGVydHkudmFsdWU7XHJcbiAgICAgIGNvbnN0IHNjcmVlbk5hbWUgPSBzZWxlY3RlZFNjcmVlbi5uYW1lUHJvcGVydHkudmFsdWU7XHJcblxyXG4gICAgICBjb25zdCBpc011bHRpU2NyZWVuU2ltRGlzcGxheWluZ1NpbmdsZVNjcmVlbiA9IGF2YWlsYWJsZVNjcmVlbnMubGVuZ3RoID09PSAxICYmIGFsbFNpbVNjcmVlbnMubGVuZ3RoID4gMTtcclxuXHJcbiAgICAgIC8vIHVwZGF0ZSB0aGUgdGl0bGVUZXh0IGJhc2VkIG9uIHZhbHVlcyBvZiB0aGUgc2ltIG5hbWUgYW5kIHNjcmVlbiBuYW1lXHJcbiAgICAgIGlmICggaXNNdWx0aVNjcmVlblNpbURpc3BsYXlpbmdTaW5nbGVTY3JlZW4gJiYgc2ltTmFtZSAmJiBzY3JlZW5OYW1lICkge1xyXG5cclxuICAgICAgICAvLyBJZiB0aGUgJ3NjcmVlbnMnIHF1ZXJ5IHBhcmFtZXRlciBzZWxlY3RzIG9ubHkgMSBzY3JlZW4gYW5kIGJvdGggdGhlIHNpbSBhbmQgc2NyZWVuIG5hbWUgYXJlIG5vdCB0aGUgZW1wdHlcclxuICAgICAgICAvLyBzdHJpbmcsIHRoZW4gdXBkYXRlIHRoZSBuYXYgYmFyIHRpdGxlIHRvIGluY2x1ZGUgYSBoeXBoZW4gYW5kIHRoZSBzY3JlZW4gbmFtZSBhZnRlciB0aGUgc2ltIG5hbWUuXHJcbiAgICAgICAgcmV0dXJuIFN0cmluZ1V0aWxzLmZpbGxJbiggdGl0bGVXaXRoU2NyZWVuUGF0dGVybiwge1xyXG4gICAgICAgICAgc2ltTmFtZTogc2ltTmFtZSxcclxuICAgICAgICAgIHNjcmVlbk5hbWU6IHNjcmVlbk5hbWVcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIGlzTXVsdGlTY3JlZW5TaW1EaXNwbGF5aW5nU2luZ2xlU2NyZWVuICYmIHNjcmVlbk5hbWUgKSB7XHJcbiAgICAgICAgcmV0dXJuIHNjcmVlbk5hbWU7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHNpbU5hbWU7XHJcbiAgICAgIH1cclxuICAgIH0sIHtcclxuICAgICAgdGFuZGVtOiBUYW5kZW0uR0VORVJBTF9NT0RFTC5jcmVhdGVUYW5kZW0oICdkaXNwbGF5ZWRTaW1OYW1lUHJvcGVydHknICksXHJcbiAgICAgIHRhbmRlbU5hbWVTdWZmaXg6ICdOYW1lUHJvcGVydHknLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnQ3VzdG9taXplIHRoaXMgc3RyaW5nIGJ5IGVkaXRpbmcgaXRzIGRlcGVuZGVuY2llcy4nLFxyXG4gICAgICBwaGV0aW9GZWF0dXJlZDogdHJ1ZSxcclxuICAgICAgcGhldGlvVmFsdWVUeXBlOiBTdHJpbmdJT1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIExvY2FsIHZhcmlhYmxlIGlzIHNldHRhYmxlLi4uXHJcbiAgICBjb25zdCBicm93c2VyVGFiVmlzaWJsZVByb3BlcnR5ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggdHJ1ZSwge1xyXG4gICAgICB0YW5kZW06IFRhbmRlbS5HRU5FUkFMX01PREVMLmNyZWF0ZVRhbmRlbSggJ2Jyb3dzZXJUYWJWaXNpYmxlUHJvcGVydHknICksXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdJbmRpY2F0ZXMgd2hldGhlciB0aGUgYnJvd3NlciB0YWIgY29udGFpbmluZyB0aGUgc2ltdWxhdGlvbiBpcyBjdXJyZW50bHkgdmlzaWJsZScsXHJcbiAgICAgIHBoZXRpb1JlYWRPbmx5OiB0cnVlLFxyXG4gICAgICBwaGV0aW9GZWF0dXJlZDogdHJ1ZVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIC4uLiBidXQgdGhlIHB1YmxpYyBjbGFzcyBhdHRyaWJ1dGUgaXMgcmVhZC1vbmx5XHJcbiAgICB0aGlzLmJyb3dzZXJUYWJWaXNpYmxlUHJvcGVydHkgPSBicm93c2VyVGFiVmlzaWJsZVByb3BlcnR5O1xyXG5cclxuICAgIC8vIHNldCB0aGUgc3RhdGUgb2YgdGhlIHByb3BlcnR5IHRoYXQgaW5kaWNhdGVzIGlmIHRoZSBicm93c2VyIHRhYiBpcyB2aXNpYmxlXHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCAndmlzaWJpbGl0eWNoYW5nZScsICgpID0+IHtcclxuICAgICAgYnJvd3NlclRhYlZpc2libGVQcm9wZXJ0eS5zZXQoIGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gJ3Zpc2libGUnICk7XHJcbiAgICB9LCBmYWxzZSApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHdpbmRvdy5waGV0LmpvaXN0LmxhdW5jaENhbGxlZCwgJ1NpbSBtdXN0IGJlIGxhdW5jaGVkIHVzaW5nIHNpbUxhdW5jaGVyLCAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3NlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzE0MicgKTtcclxuXHJcbiAgICB0aGlzLnN1cHBvcnRzR2VzdHVyZURlc2NyaXB0aW9uID0gcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5zdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb24gJiYgU1VQUE9SVFNfR0VTVFVSRV9ERVNDUklQVElPTjtcclxuICAgIHRoaXMuaGFzS2V5Ym9hcmRIZWxwQ29udGVudCA9IF8uc29tZSggdGhpcy5zaW1TY3JlZW5zLCBzaW1TY3JlZW4gPT4gISFzaW1TY3JlZW4uY3JlYXRlS2V5Ym9hcmRIZWxwTm9kZSApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF3aW5kb3cucGhldC5qb2lzdC5zaW0sICdPbmx5IHN1cHBvcnRzIG9uZSBzaW0gYXQgYSB0aW1lJyApO1xyXG4gICAgd2luZG93LnBoZXQuam9pc3Quc2ltID0gdGhpcztcclxuXHJcbiAgICAvLyBjb21tZW50ZWQgb3V0IGJlY2F1c2UgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2pvaXN0L2lzc3Vlcy81NTMgaXMgZGVmZXJyZWQgZm9yIGFmdGVyIEdRSU8tb25lb25lXHJcbiAgICAvLyBpZiAoIFBIRVRfSU9fRU5BQkxFRCApIHtcclxuICAgIC8vICAgdGhpcy5lbmdhZ2VtZW50TWV0cmljcyA9IG5ldyBFbmdhZ2VtZW50TWV0cmljcyggdGhpcyApO1xyXG4gICAgLy8gfVxyXG5cclxuICAgIHRoaXMucHJlZmVyZW5jZXNNb2RlbCA9IG9wdGlvbnMucHJlZmVyZW5jZXNNb2RlbDtcclxuXHJcbiAgICAvLyBpbml0aWFsaXplIGF1ZGlvIGFuZCBhdWRpbyBzdWJjb21wb25lbnRzXHJcbiAgICBhdWRpb01hbmFnZXIuaW5pdGlhbGl6ZSggdGhpcyApO1xyXG5cclxuICAgIC8vIGhvb2sgdXAgc291bmQgZ2VuZXJhdGlvbiBmb3Igc2NyZWVuIGNoYW5nZXNcclxuICAgIGlmICggdGhpcy5wcmVmZXJlbmNlc01vZGVsLmF1ZGlvTW9kZWwuc3VwcG9ydHNTb3VuZCApIHtcclxuICAgICAgc291bmRNYW5hZ2VyLmFkZFNvdW5kR2VuZXJhdG9yKFxyXG4gICAgICAgIG5ldyBTY3JlZW5TZWxlY3Rpb25Tb3VuZEdlbmVyYXRvciggdGhpcy5zZWxlY3RlZFNjcmVlblByb3BlcnR5LCB0aGlzLmhvbWVTY3JlZW4sIHsgaW5pdGlhbE91dHB1dExldmVsOiAwLjUgfSApLFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGNhdGVnb3J5TmFtZTogJ3VzZXItaW50ZXJmYWNlJ1xyXG4gICAgICAgIH1cclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBNYWtlIFNjcmVlbnNob3RHZW5lcmF0b3IgYXZhaWxhYmxlIGdsb2JhbGx5IHNvIGl0IGNhbiBiZSB1c2VkIGluIHByZWxvYWQgZmlsZXMgc3VjaCBhcyBQaEVULWlPLlxyXG4gICAgd2luZG93LnBoZXQuam9pc3QuU2NyZWVuc2hvdEdlbmVyYXRvciA9IFNjcmVlbnNob3RHZW5lcmF0b3I7XHJcblxyXG4gICAgLy8gSWYgdGhlIGxvY2FsZSBxdWVyeSBwYXJhbWV0ZXIgd2FzIHNwZWNpZmllZCwgdGhlbiB3ZSBtYXkgYmUgcnVubmluZyB0aGUgYWxsLmh0bWwgZmlsZSwgc28gYWRqdXN0IHRoZSB0aXRsZS5cclxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2hpcHBlci9pc3N1ZXMvNTEwXHJcbiAgICB0aGlzLnNpbU5hbWVQcm9wZXJ0eS5saW5rKCBzaW1OYW1lID0+IHtcclxuICAgICAgZG9jdW1lbnQudGl0bGUgPSBzaW1OYW1lO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIEZvciBub3cgdGhlIFRvb2xiYXIgb25seSBpbmNsdWRlcyBjb250cm9scyBmb3IgVm9pY2luZyBhbmQgaXMgb25seSBjb25zdHJ1Y3RlZCB3aGVuIHRoYXQgZmVhdHVyZSBpcyBzdXBwb3J0ZWQuXHJcbiAgICBpZiAoIHRoaXMucHJlZmVyZW5jZXNNb2RlbC5hdWRpb01vZGVsLnN1cHBvcnRzVm9pY2luZyApIHtcclxuICAgICAgdGhpcy50b29sYmFyID0gbmV3IFRvb2xiYXIoIHRoaXMucHJlZmVyZW5jZXNNb2RlbC5hdWRpb01vZGVsLnRvb2xiYXJFbmFibGVkUHJvcGVydHksIHRoaXMuc2VsZWN0ZWRTY3JlZW5Qcm9wZXJ0eSxcclxuICAgICAgICB0aGlzLmxvb2tBbmRGZWVsICk7XHJcblxyXG4gICAgICAvLyB3aGVuIHRoZSBUb29sYmFyIHBvc2l0aW9ucyB1cGRhdGUsIHJlc2l6ZSB0aGUgc2ltIHRvIGZpdCBpbiB0aGUgYXZhaWxhYmxlIHNwYWNlXHJcbiAgICAgIHRoaXMudG9vbGJhci5yaWdodFBvc2l0aW9uUHJvcGVydHkubGF6eUxpbmsoICgpID0+IHtcclxuICAgICAgICB0aGlzLnJlc2l6ZSggdGhpcy5ib3VuZHNQcm9wZXJ0eS52YWx1ZSEud2lkdGgsIHRoaXMuYm91bmRzUHJvcGVydHkudmFsdWUhLmhlaWdodCApO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5kaXNwbGF5ID0gbmV3IFNpbURpc3BsYXkoIHNpbURpc3BsYXlPcHRpb25zICk7XHJcbiAgICB0aGlzLnJvb3ROb2RlID0gdGhpcy5kaXNwbGF5LnJvb3ROb2RlO1xyXG5cclxuICAgIEhlbHBlci5pbml0aWFsaXplKCB0aGlzLCB0aGlzLmRpc3BsYXkgKTtcclxuXHJcbiAgICBNdWx0aWxpbmsubXVsdGlsaW5rKCBbIHRoaXMuYWN0aXZlUHJvcGVydHksIHBoZXQuam9pc3QucGxheWJhY2tNb2RlRW5hYmxlZFByb3BlcnR5IF0sICggYWN0aXZlLCBwbGF5YmFja01vZGVFbmFibGVkOiBib29sZWFuICkgPT4ge1xyXG5cclxuICAgICAgLy8gSWYgaW4gcGxheWJhY2tNb2RlIGlzIGVuYWJsZWQsIHRoZW4gdGhlIGRpc3BsYXkgbXVzdCBiZSBpbnRlcmFjdGl2ZSB0byBzdXBwb3J0IFBET00gZXZlbnQgbGlzdGVuZXJzIGR1cmluZ1xyXG4gICAgICAvLyBwbGF5YmFjayAod2hpY2ggb2Z0ZW4gY29tZSBkaXJlY3RseSBmcm9tIHNpbSBjb2RlIGFuZCBub3QgZnJvbSB1c2VyIGlucHV0KS5cclxuICAgICAgaWYgKCBwbGF5YmFja01vZGVFbmFibGVkICkge1xyXG4gICAgICAgIHRoaXMuZGlzcGxheS5pbnRlcmFjdGl2ZSA9IHRydWU7XHJcbiAgICAgICAgZ2xvYmFsS2V5U3RhdGVUcmFja2VyLmVuYWJsZWQgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICAvLyBXaGVuIHRoZSBzaW0gaXMgaW5hY3RpdmUsIG1ha2UgaXQgbm9uLWludGVyYWN0aXZlLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzQxNFxyXG4gICAgICAgIHRoaXMuZGlzcGxheS5pbnRlcmFjdGl2ZSA9IGFjdGl2ZTtcclxuICAgICAgICBnbG9iYWxLZXlTdGF0ZVRyYWNrZXIuZW5hYmxlZCA9IGFjdGl2ZTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIHRoaXMuZGlzcGxheS5kb21FbGVtZW50ICk7XHJcblxyXG4gICAgSGVhcnRiZWF0LnN0YXJ0KCB0aGlzICk7XHJcblxyXG4gICAgdGhpcy5uYXZpZ2F0aW9uQmFyID0gbmV3IE5hdmlnYXRpb25CYXIoIHRoaXMsIFRhbmRlbS5HRU5FUkFMX1ZJRVcuY3JlYXRlVGFuZGVtKCAnbmF2aWdhdGlvbkJhcicgKSApO1xyXG5cclxuICAgIHRoaXMudXBkYXRlQmFja2dyb3VuZCA9ICgpID0+IHtcclxuICAgICAgdGhpcy5sb29rQW5kRmVlbC5iYWNrZ3JvdW5kQ29sb3JQcm9wZXJ0eS52YWx1ZSA9IENvbG9yLnRvQ29sb3IoIHRoaXMuc2VsZWN0ZWRTY3JlZW5Qcm9wZXJ0eS52YWx1ZS5iYWNrZ3JvdW5kQ29sb3JQcm9wZXJ0eS52YWx1ZSApO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmxvb2tBbmRGZWVsLmJhY2tncm91bmRDb2xvclByb3BlcnR5LmxpbmsoIGJhY2tncm91bmRDb2xvciA9PiB7XHJcbiAgICAgIHRoaXMuZGlzcGxheS5iYWNrZ3JvdW5kQ29sb3IgPSBiYWNrZ3JvdW5kQ29sb3I7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5zZWxlY3RlZFNjcmVlblByb3BlcnR5LmxpbmsoICgpID0+IHRoaXMudXBkYXRlQmFja2dyb3VuZCgpICk7XHJcblxyXG4gICAgLy8gV2hlbiB0aGUgdXNlciBzd2l0Y2hlcyBzY3JlZW5zLCBpbnRlcnJ1cHQgdGhlIGlucHV0IG9uIHRoZSBwcmV2aW91cyBzY3JlZW4uXHJcbiAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzIxOFxyXG4gICAgdGhpcy5zZWxlY3RlZFNjcmVlblByb3BlcnR5LmxhenlMaW5rKCAoIG5ld1NjcmVlbiwgb2xkU2NyZWVuICkgPT4gb2xkU2NyZWVuLnZpZXcuaW50ZXJydXB0U3VidHJlZUlucHV0KCkgKTtcclxuXHJcbiAgICB0aGlzLnNpbUluZm8gPSBuZXcgU2ltSW5mbyggdGhpcyApO1xyXG5cclxuICAgIC8vIFNldCB1cCBQaEVULWlPLCBtdXN0IGJlIGRvbmUgYWZ0ZXIgcGhldC5qb2lzdC5zaW0gaXMgYXNzaWduZWRcclxuICAgIFRhbmRlbS5QSEVUX0lPX0VOQUJMRUQgJiYgcGhldC5waGV0aW8ucGhldGlvRW5naW5lLm9uU2ltQ29uc3RydWN0aW9uU3RhcnRlZChcclxuICAgICAgdGhpcy5zaW1JbmZvLFxyXG4gICAgICB0aGlzLmlzQ29uc3RydWN0aW9uQ29tcGxldGVQcm9wZXJ0eSxcclxuICAgICAgdGhpcy5mcmFtZUVuZGVkRW1pdHRlcixcclxuICAgICAgdGhpcy5kaXNwbGF5XHJcbiAgICApO1xyXG5cclxuICAgIGlzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkubGF6eUxpbmsoIGlzU2V0dGluZ1N0YXRlID0+IHtcclxuICAgICAgaWYgKCAhaXNTZXR0aW5nU3RhdGUgKSB7XHJcbiAgICAgICAgdGhpcy51cGRhdGVWaWV3cygpO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5ib3VuZFJ1bkFuaW1hdGlvbkxvb3AgPSB0aGlzLnJ1bkFuaW1hdGlvbkxvb3AuYmluZCggdGhpcyApO1xyXG5cclxuICAgIC8vIFRoaXJkIHBhcnR5IHN1cHBvcnRcclxuICAgIHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMubGVnZW5kc09mTGVhcm5pbmcgJiYgbmV3IExlZ2VuZHNPZkxlYXJuaW5nU3VwcG9ydCggdGhpcyApLnN0YXJ0KCk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIHRoaXMuYXVkaXRTY3JlZW5OYW1lS2V5cygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXBkYXRlIHRoZSB2aWV3cyBvZiB0aGUgc2ltLiBUaGlzIGlzIG1lYW50IHRvIHJ1biBhZnRlciB0aGUgc3RhdGUgaGFzIGJlZW4gc2V0IHRvIG1ha2Ugc3VyZSB0aGF0IGFsbCB2aWV3XHJcbiAgICogZWxlbWVudHMgYXJlIGluIHN5bmMgd2l0aCB0aGUgbmV3LCBjdXJyZW50IHN0YXRlIG9mIHRoZSBzaW0uIChldmVuIHdoZW4gdGhlIHNpbSBpcyBpbmFjdGl2ZSwgYXMgaW4gdGhlIHN0YXRlXHJcbiAgICogd3JhcHBlcikuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSB1cGRhdGVWaWV3cygpOiB2b2lkIHtcclxuXHJcbiAgICAvLyBUcmlnZ2VyIGxheW91dCBjb2RlXHJcbiAgICB0aGlzLnJlc2l6ZVRvV2luZG93KCk7XHJcblxyXG4gICAgdGhpcy5zZWxlY3RlZFNjcmVlblByb3BlcnR5LnZhbHVlLnZpZXcuc3RlcCAmJiB0aGlzLnNlbGVjdGVkU2NyZWVuUHJvcGVydHkudmFsdWUudmlldy5zdGVwKCAwICk7XHJcblxyXG4gICAgLy8gQ2xlYXIgYWxsIFV0dGVyYW5jZVF1ZXVlIG91dHB1dHMgdGhhdCBtYXkgaGF2ZSBjb2xsZWN0ZWQgVXR0ZXJhbmNlcyB3aGlsZSBzdGF0ZS1zZXR0aW5nIGxvZ2ljIG9jY3VycmVkLlxyXG4gICAgLy8gVGhpcyBpcyB0cmFuc2llbnQuIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy91dHRlcmFuY2UtcXVldWUvaXNzdWVzLzIyIGFuZCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTM5N1xyXG4gICAgdGhpcy5kaXNwbGF5LmRlc2NyaXB0aW9uVXR0ZXJhbmNlUXVldWUuY2xlYXIoKTtcclxuICAgIHZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5jbGVhcigpO1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0aGUgZGlzcGxheSBhc3luY2hyb25vdXNseSBzaW5jZSBpdCBjYW4gdHJpZ2dlciBldmVudHMgb24gcG9pbnRlciB2YWxpZGF0aW9uLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoLXNjYWxlL2lzc3Vlcy8yMTJcclxuICAgIGFuaW1hdGlvbkZyYW1lVGltZXIucnVuT25OZXh0VGljayggKCkgPT4gcGhldC5qb2lzdC5kaXNwbGF5LnVwZGF0ZURpc3BsYXkoKSApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBmaW5pc2hJbml0KCBzY3JlZW5zOiBBbnlTY3JlZW5bXSApOiB2b2lkIHtcclxuXHJcbiAgICBfLmVhY2goIHNjcmVlbnMsIHNjcmVlbiA9PiB7XHJcbiAgICAgIHNjcmVlbi52aWV3LmxheWVyU3BsaXQgPSB0cnVlO1xyXG4gICAgICBpZiAoICF0aGlzLmRldGFjaEluYWN0aXZlU2NyZWVuVmlld3MgKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwbGF5LnNpbXVsYXRpb25Sb290LmFkZENoaWxkKCBzY3JlZW4udmlldyApO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLmRpc3BsYXkuc2ltdWxhdGlvblJvb3QuYWRkQ2hpbGQoIHRoaXMubmF2aWdhdGlvbkJhciApO1xyXG5cclxuICAgIGlmICggdGhpcy5wcmVmZXJlbmNlc01vZGVsLmF1ZGlvTW9kZWwuc3VwcG9ydHNWb2ljaW5nICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLnRvb2xiYXIsICd0b29sYmFyIHNob3VsZCBleGlzdCBmb3Igdm9pY2luZycgKTtcclxuICAgICAgdGhpcy5kaXNwbGF5LnNpbXVsYXRpb25Sb290LmFkZENoaWxkKCB0aGlzLnRvb2xiYXIhICk7XHJcbiAgICAgIHRoaXMuZGlzcGxheS5zaW11bGF0aW9uUm9vdC5wZG9tT3JkZXIgPSBbIHRoaXMudG9vbGJhciEgXTtcclxuXHJcbiAgICAgIC8vIElmIFZvaWNpbmcgaXMgbm90IFwiZnVsbHlcIiBlbmFibGVkLCBvbmx5IHRoZSB0b29sYmFyIGlzIGFibGUgdG8gcHJvZHVjZSBWb2ljaW5nIG91dHB1dC5cclxuICAgICAgLy8gQWxsIG90aGVyIHNpbXVsYXRpb24gY29tcG9uZW50cyBzaG91bGQgbm90IHZvaWNlIGFueXRoaW5nLiBUaGlzIG11c3QgYmUgY2FsbGVkIG9ubHkgYWZ0ZXJcclxuICAgICAgLy8gYWxsIFNjcmVlblZpZXdzIGhhdmUgYmVlbiBjb25zdHJ1Y3RlZC5cclxuICAgICAgdm9pY2luZ01hbmFnZXIudm9pY2luZ0Z1bGx5RW5hYmxlZFByb3BlcnR5LmxpbmsoIGZ1bGx5RW5hYmxlZCA9PiB7XHJcbiAgICAgICAgdGhpcy5zZXRTaW1Wb2ljaW5nVmlzaWJsZSggZnVsbHlFbmFibGVkICk7XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnNlbGVjdGVkU2NyZWVuUHJvcGVydHkubGluayggY3VycmVudFNjcmVlbiA9PiB7XHJcbiAgICAgIHNjcmVlbnMuZm9yRWFjaCggc2NyZWVuID0+IHtcclxuICAgICAgICBjb25zdCB2aXNpYmxlID0gc2NyZWVuID09PSBjdXJyZW50U2NyZWVuO1xyXG5cclxuICAgICAgICAvLyBNYWtlIHRoZSBzZWxlY3RlZCBzY3JlZW4gdmlzaWJsZSBhbmQgYWN0aXZlLCBvdGhlciBzY3JlZW5zIGludmlzaWJsZSBhbmQgaW5hY3RpdmUuXHJcbiAgICAgICAgLy8gc2NyZWVuLmlzQWN0aXZlUHJvcGVydHkgc2hvdWxkIGNoYW5nZSBvbmx5IHdoaWxlIHRoZSBzY3JlZW4gaXMgaW52aXNpYmxlLCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzQxOFxyXG4gICAgICAgIGlmICggdmlzaWJsZSApIHtcclxuICAgICAgICAgIHNjcmVlbi5hY3RpdmVQcm9wZXJ0eS5zZXQoIHZpc2libGUgKTtcclxuXHJcbiAgICAgICAgICBpZiAoIHRoaXMuZGV0YWNoSW5hY3RpdmVTY3JlZW5WaWV3cyAmJiAhdGhpcy5kaXNwbGF5LnNpbXVsYXRpb25Sb290Lmhhc0NoaWxkKCBzY3JlZW4udmlldyApICkge1xyXG4gICAgICAgICAgICB0aGlzLmRpc3BsYXkuc2ltdWxhdGlvblJvb3QuaW5zZXJ0Q2hpbGQoIDAsIHNjcmVlbi52aWV3ICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNjcmVlbi52aWV3LnNldFZpc2libGUoIHZpc2libGUgKTtcclxuICAgICAgICBpZiAoICF2aXNpYmxlICkge1xyXG4gICAgICAgICAgaWYgKCB0aGlzLmRldGFjaEluYWN0aXZlU2NyZWVuVmlld3MgJiYgdGhpcy5kaXNwbGF5LnNpbXVsYXRpb25Sb290Lmhhc0NoaWxkKCBzY3JlZW4udmlldyApICkge1xyXG4gICAgICAgICAgICB0aGlzLmRpc3BsYXkuc2ltdWxhdGlvblJvb3QucmVtb3ZlQ2hpbGQoIHNjcmVlbi52aWV3ICk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgc2NyZWVuLmFjdGl2ZVByb3BlcnR5LnNldCggdmlzaWJsZSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG4gICAgICB0aGlzLnVwZGF0ZUJhY2tncm91bmQoKTtcclxuXHJcbiAgICAgIGlmICggIWlzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkudmFsdWUgKSB7XHJcblxyXG4gICAgICAgIC8vIFpvb20gb3V0IGFnYWluIGFmdGVyIGNoYW5naW5nIHNjcmVlbnMgc28gd2UgZG9uJ3QgcGFuIHRvIHRoZSBjZW50ZXIgb2YgdGhlIGZvY3VzZWQgU2NyZWVuVmlldyxcclxuICAgICAgICAvLyBhbmQgc28gdXNlciBoYXMgYW4gb3ZlcnZpZXcgb2YgdGhlIG5ldyBzY3JlZW4sIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzY4Mi5cclxuICAgICAgICBhbmltYXRlZFBhblpvb21TaW5nbGV0b24ubGlzdGVuZXIucmVzZXRUcmFuc2Zvcm0oKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuZGlzcGxheS5zaW11bGF0aW9uUm9vdC5hZGRDaGlsZCggdGhpcy50b3BMYXllciApO1xyXG5cclxuICAgIC8vIEZpdCB0byB0aGUgd2luZG93IGFuZCByZW5kZXIgdGhlIGluaXRpYWwgc2NlbmVcclxuICAgIC8vIENhbid0IHN5bmNocm9ub3VzbHkgZG8gdGhpcyBpbiBGaXJlZm94LCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3ZlZ2FzL2lzc3Vlcy81NSBhbmRcclxuICAgIC8vIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTg0MDQxMi5cclxuICAgIGNvbnN0IHJlc2l6ZUxpc3RlbmVyID0gKCkgPT4ge1xyXG5cclxuICAgICAgLy8gRG9uJ3QgcmVzaXplIG9uIHdpbmRvdyBzaXplIGNoYW5nZXMgaWYgd2UgYXJlIHBsYXlpbmcgYmFjayBpbnB1dCBldmVudHMuXHJcbiAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzM3XHJcbiAgICAgIGlmICggIXBoZXQuam9pc3QucGxheWJhY2tNb2RlRW5hYmxlZFByb3BlcnR5LnZhbHVlICkge1xyXG4gICAgICAgIHRoaXMucmVzaXplUGVuZGluZyA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgICAkKCB3aW5kb3cgKS5yZXNpemUoIHJlc2l6ZUxpc3RlbmVyICk7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ3Jlc2l6ZScsIHJlc2l6ZUxpc3RlbmVyICk7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ29yaWVudGF0aW9uY2hhbmdlJywgcmVzaXplTGlzdGVuZXIgKTtcclxuICAgIHdpbmRvdy52aXN1YWxWaWV3cG9ydCAmJiB3aW5kb3cudmlzdWFsVmlld3BvcnQuYWRkRXZlbnRMaXN0ZW5lciggJ3Jlc2l6ZScsIHJlc2l6ZUxpc3RlbmVyICk7XHJcbiAgICB0aGlzLnJlc2l6ZVRvV2luZG93KCk7XHJcblxyXG4gICAgLy8gS2ljayBvZmYgY2hlY2tpbmcgZm9yIHVwZGF0ZXMsIGlmIHRoYXQgaXMgZW5hYmxlZFxyXG4gICAgdXBkYXRlQ2hlY2suY2hlY2soKTtcclxuXHJcbiAgICAvLyBJZiB0aGVyZSBhcmUgd2FybmluZ3MsIHNob3cgdGhlbSBpbiBhIGRpYWxvZ1xyXG4gICAgaWYgKCBRdWVyeVN0cmluZ01hY2hpbmUud2FybmluZ3MubGVuZ3RoICkge1xyXG4gICAgICBjb25zdCB3YXJuaW5nRGlhbG9nID0gbmV3IFF1ZXJ5UGFyYW1ldGVyc1dhcm5pbmdEaWFsb2coIFF1ZXJ5U3RyaW5nTWFjaGluZS53YXJuaW5ncywge1xyXG4gICAgICAgIGNsb3NlQnV0dG9uTGlzdGVuZXI6ICgpID0+IHtcclxuICAgICAgICAgIHdhcm5pbmdEaWFsb2cuaGlkZSgpO1xyXG4gICAgICAgICAgd2FybmluZ0RpYWxvZy5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICAgIHdhcm5pbmdEaWFsb2cuc2hvdygpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLypcclxuICAgKiBBZGRzIGEgcG9wdXAgaW4gdGhlIGdsb2JhbCBjb29yZGluYXRlIGZyYW1lLiBJZiB0aGUgcG9wdXAgaXMgbW9kZWwsIGl0IGRpc3BsYXlzIGEgc2VtaS10cmFuc3BhcmVudCBibGFjayBpbnB1dFxyXG4gICAqIGJhcnJpZXIgYmVoaW5kIGl0LiBBIG1vZGFsIHBvcHVwIHByZXZlbnQgdGhlIHVzZXIgZnJvbSBpbnRlcmFjdGluZyB3aXRoIHRoZSByZXNldCBvZiB0aGUgYXBwbGljYXRpb24gdW50aWwgdGhlXHJcbiAgICogcG9wdXAgaXMgaGlkZGVuLiBVc2UgaGlkZVBvcHVwKCkgdG8gaGlkZSB0aGUgcG9wdXAuXHJcbiAgICogQHBhcmFtIHBvcHVwIC0gdGhlIHBvcHVwLCBtdXN0IGltcGxlbWVudGVkIG5vZGUuaGlkZSgpLCBjYWxsZWQgYnkgaGlkZVBvcHVwXHJcbiAgICogQHBhcmFtIGlzTW9kYWwgLSB3aGV0aGVyIHBvcHVwIGlzIG1vZGFsXHJcbiAgICovXHJcbiAgcHVibGljIHNob3dQb3B1cCggcG9wdXA6IFBvcHVwYWJsZU5vZGUsIGlzTW9kYWw6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBwb3B1cCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggISFwb3B1cC5oaWRlLCAnTWlzc2luZyBwb3B1cC5oaWRlKCkgZm9yIHNob3dQb3B1cCcgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLnRvcExheWVyLmhhc0NoaWxkKCBwb3B1cCApLCAncG9wdXAgYWxyZWFkeSBzaG93bicgKTtcclxuICAgIGlmICggaXNNb2RhbCApIHtcclxuICAgICAgdGhpcy5yb290Tm9kZS5pbnRlcnJ1cHRTdWJ0cmVlSW5wdXQoKTtcclxuICAgICAgdGhpcy5tb2RhbE5vZGVTdGFjay5wdXNoKCBwb3B1cCApO1xyXG5cclxuICAgICAgLy8gcGRvbSAtIG1vZGFsIGRpYWxvZ3Mgc2hvdWxkIGJlIHRoZSBvbmx5IHJlYWRhYmxlIGNvbnRlbnQgaW4gdGhlIHNpbVxyXG4gICAgICB0aGlzLnNldFBET01WaWV3c1Zpc2libGUoIGZhbHNlICk7XHJcblxyXG4gICAgICAvLyB2b2ljaW5nIC0gcmVzcG9uc2VzIGZyb20gTm9kZXMgaGlkZGVuIGJ5IHRoZSBtb2RhbCBkaWFsb2cgc2hvdWxkIG5vdCB2b2ljZS5cclxuICAgICAgdGhpcy5zZXROb25Nb2RhbFZvaWNpbmdWaXNpYmxlKCBmYWxzZSApO1xyXG4gICAgfVxyXG4gICAgaWYgKCBwb3B1cC5sYXlvdXQgKSB7XHJcbiAgICAgIHBvcHVwLmxheW91dCggdGhpcy5zY3JlZW5Cb3VuZHNQcm9wZXJ0eS52YWx1ZSEgKTtcclxuICAgIH1cclxuICAgIHRoaXMudG9wTGF5ZXIuYWRkQ2hpbGQoIHBvcHVwICk7XHJcbiAgfVxyXG5cclxuICAvKlxyXG4gICAqIEhpZGVzIGEgcG9wdXAgdGhhdCB3YXMgcHJldmlvdXNseSBkaXNwbGF5ZWQgd2l0aCBzaG93UG9wdXAoKVxyXG4gICAqIEBwYXJhbSBwb3B1cFxyXG4gICAqIEBwYXJhbSBpc01vZGFsIC0gd2hldGhlciBwb3B1cCBpcyBtb2RhbFxyXG4gICAqL1xyXG4gIHB1YmxpYyBoaWRlUG9wdXAoIHBvcHVwOiBQb3B1cGFibGVOb2RlLCBpc01vZGFsOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcG9wdXAgJiYgdGhpcy5tb2RhbE5vZGVTdGFjay5pbmNsdWRlcyggcG9wdXAgKSApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy50b3BMYXllci5oYXNDaGlsZCggcG9wdXAgKSwgJ3BvcHVwIHdhcyBub3Qgc2hvd24nICk7XHJcbiAgICBpZiAoIGlzTW9kYWwgKSB7XHJcbiAgICAgIHRoaXMubW9kYWxOb2RlU3RhY2sucmVtb3ZlKCBwb3B1cCApO1xyXG4gICAgICBpZiAoIHRoaXMubW9kYWxOb2RlU3RhY2subGVuZ3RoID09PSAwICkge1xyXG5cclxuICAgICAgICAvLyBBZnRlciBoaWRpbmcgYWxsIHBvcHVwcywgVm9pY2luZyBiZWNvbWVzIGVuYWJsZWQgZm9yIGNvbXBvbmVudHMgaW4gdGhlIHNpbXVsYXRpb24gd2luZG93IG9ubHkgaWZcclxuICAgICAgICAvLyBcIlNpbSBWb2ljaW5nXCIgc3dpdGNoIGlzIG9uLlxyXG4gICAgICAgIHRoaXMuc2V0Tm9uTW9kYWxWb2ljaW5nVmlzaWJsZSggdm9pY2luZ01hbmFnZXIudm9pY2luZ0Z1bGx5RW5hYmxlZFByb3BlcnR5LnZhbHVlICk7XHJcblxyXG4gICAgICAgIC8vIHBkb20gLSB3aGVuIHRoZSBkaWFsb2cgaXMgaGlkZGVuLCBtYWtlIGFsbCBTY3JlZW5WaWV3IGNvbnRlbnQgdmlzaWJsZSB0byBhc3Npc3RpdmUgdGVjaG5vbG9neVxyXG4gICAgICAgIHRoaXMuc2V0UERPTVZpZXdzVmlzaWJsZSggdHJ1ZSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnRvcExheWVyLnJlbW92ZUNoaWxkKCBwb3B1cCApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZXNpemVUb1dpbmRvdygpOiB2b2lkIHtcclxuICAgIHRoaXMucmVzaXplUGVuZGluZyA9IGZhbHNlO1xyXG4gICAgdGhpcy5yZXNpemUoIHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBiYWQtc2ltLXRleHRcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVzaXplKCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciApOiB2b2lkIHtcclxuICAgIHRoaXMucmVzaXplQWN0aW9uLmV4ZWN1dGUoIHdpZHRoLCBoZWlnaHQgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzdGFydCgpOiB2b2lkIHtcclxuXHJcbiAgICAvLyBJbiBvcmRlciB0byBhbmltYXRlIHRoZSBsb2FkaW5nIHByb2dyZXNzIGJhciwgd2UgbXVzdCBzY2hlZHVsZSB3b3JrIHdpdGggc2V0VGltZW91dFxyXG4gICAgLy8gVGhpcyBhcnJheSBvZiB7ZnVuY3Rpb259IGlzIHRoZSB3b3JrIHRoYXQgbXVzdCBiZSBjb21wbGV0ZWQgdG8gbGF1bmNoIHRoZSBzaW0uXHJcbiAgICBjb25zdCB3b3JrSXRlbXM6IEFycmF5PCgpID0+IHZvaWQ+ID0gW107XHJcblxyXG4gICAgLy8gU2NoZWR1bGUgaW5zdGFudGlhdGlvbiBvZiB0aGUgc2NyZWVuc1xyXG4gICAgdGhpcy5zY3JlZW5zLmZvckVhY2goIHNjcmVlbiA9PiB7XHJcbiAgICAgIHdvcmtJdGVtcy5wdXNoKCAoKSA9PiB7XHJcblxyXG4gICAgICAgIC8vIFNjcmVlbnMgbWF5IHNoYXJlIHRoZSBzYW1lIGluc3RhbmNlIG9mIGJhY2tncm91bmRQcm9wZXJ0eSwgc2VlIGpvaXN0IzQ0MVxyXG4gICAgICAgIGlmICggIXNjcmVlbi5iYWNrZ3JvdW5kQ29sb3JQcm9wZXJ0eS5oYXNMaXN0ZW5lciggdGhpcy51cGRhdGVCYWNrZ3JvdW5kICkgKSB7XHJcbiAgICAgICAgICBzY3JlZW4uYmFja2dyb3VuZENvbG9yUHJvcGVydHkubGluayggdGhpcy51cGRhdGVCYWNrZ3JvdW5kICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNjcmVlbi5pbml0aWFsaXplTW9kZWwoKTtcclxuICAgICAgfSApO1xyXG4gICAgICB3b3JrSXRlbXMucHVzaCggKCkgPT4ge1xyXG4gICAgICAgIHNjcmVlbi5pbml0aWFsaXplVmlldyggdGhpcy5zaW1OYW1lUHJvcGVydHksIHRoaXMuZGlzcGxheWVkU2ltTmFtZVByb3BlcnR5LCB0aGlzLnNjcmVlbnMubGVuZ3RoLCB0aGlzLmhvbWVTY3JlZW4gPT09IHNjcmVlbiApO1xyXG4gICAgICB9ICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gbG9vcCB0byBydW4gc3RhcnR1cCBpdGVtcyBhc3luY2hyb25vdXNseSBzbyB0aGUgRE9NIGNhbiBiZSB1cGRhdGVkIHRvIHNob3cgYW5pbWF0aW9uIG9uIHRoZSBwcm9ncmVzcyBiYXJcclxuICAgIGNvbnN0IHJ1bkl0ZW0gPSAoIGk6IG51bWJlciApID0+IHtcclxuICAgICAgc2V0VGltZW91dCggLy8gZXNsaW50LWRpc2FibGUtbGluZSBiYWQtc2ltLXRleHRcclxuICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICB3b3JrSXRlbXNbIGkgXSgpO1xyXG5cclxuICAgICAgICAgIC8vIE1vdmUgdGhlIHByb2dyZXNzIGFoZWFkIGJ5IG9uZSBzbyB3ZSBzaG93IHRoZSBmdWxsIHByb2dyZXNzIGJhciBmb3IgYSBtb21lbnQgYmVmb3JlIHRoZSBzaW0gc3RhcnRzIHVwXHJcblxyXG4gICAgICAgICAgY29uc3QgcHJvZ3Jlc3MgPSBEb3RVdGlscy5saW5lYXIoIDAsIHdvcmtJdGVtcy5sZW5ndGggLSAxLCAwLjI1LCAxLjAsIGkgKTtcclxuXHJcbiAgICAgICAgICAvLyBTdXBwb3J0IGlPUyBSZWFkaW5nIE1vZGUsIHdoaWNoIHNhdmVzIGEgRE9NIHNuYXBzaG90IGFmdGVyIHRoZSBwcm9ncmVzc0JhckZvcmVncm91bmQgaGFzIGFscmVhZHkgYmVlblxyXG4gICAgICAgICAgLy8gcmVtb3ZlZCBmcm9tIHRoZSBkb2N1bWVudCwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9qb2lzdC9pc3N1ZXMvMzg5XHJcbiAgICAgICAgICBpZiAoIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCAncHJvZ3Jlc3NCYXJGb3JlZ3JvdW5kJyApICkge1xyXG5cclxuICAgICAgICAgICAgLy8gR3JvdyB0aGUgcHJvZ3Jlc3MgYmFyIGZvcmVncm91bmQgdG8gdGhlIHJpZ2h0IGJhc2VkIG9uIHRoZSBwcm9ncmVzcyBzbyBmYXIuXHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCAncHJvZ3Jlc3NCYXJGb3JlZ3JvdW5kJyApIS5zZXRBdHRyaWJ1dGUoICd3aWR0aCcsIGAke3Byb2dyZXNzICogUFJPR1JFU1NfQkFSX1dJRFRIfWAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICggaSArIDEgPCB3b3JrSXRlbXMubGVuZ3RoICkge1xyXG4gICAgICAgICAgICBydW5JdGVtKCBpICsgMSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBiYWQtc2ltLXRleHRcclxuICAgICAgICAgICAgICB0aGlzLmZpbmlzaEluaXQoIHRoaXMuc2NyZWVucyApO1xyXG5cclxuICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIGlzIGRlZmluZWRcclxuICAgICAgICAgICAgICBVdGlscy5wb2x5ZmlsbFJlcXVlc3RBbmltYXRpb25GcmFtZSgpO1xyXG5cclxuICAgICAgICAgICAgICAvLyBPcHRpb24gZm9yIHByb2ZpbGluZ1xyXG4gICAgICAgICAgICAgIC8vIGlmIHRydWUsIHByaW50cyBzY3JlZW4gaW5pdGlhbGl6YXRpb24gdGltZSAodG90YWwsIG1vZGVsLCB2aWV3KSB0byB0aGUgY29uc29sZSBhbmQgZGlzcGxheXNcclxuICAgICAgICAgICAgICAvLyBwcm9maWxpbmcgaW5mb3JtYXRpb24gb24gdGhlIHNjcmVlblxyXG4gICAgICAgICAgICAgIGlmICggcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5wcm9maWxlciApIHtcclxuICAgICAgICAgICAgICAgIFByb2ZpbGVyLnN0YXJ0KCB0aGlzICk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAvLyBOb3RpZnkgbGlzdGVuZXJzIHRoYXQgYWxsIG1vZGVscyBhbmQgdmlld3MgaGF2ZSBiZWVuIGNvbnN0cnVjdGVkLCBhbmQgdGhlIFNpbSBpcyByZWFkeSB0byBiZSBzaG93bi5cclxuICAgICAgICAgICAgICAvLyBVc2VkIGJ5IFBoRVQtaU8uIFRoaXMgZG9lcyBub3QgY29pbmNpZGUgd2l0aCB0aGUgZW5kIG9mIHRoZSBTaW0gY29uc3RydWN0b3IgKGJlY2F1c2UgU2ltIGhhc1xyXG4gICAgICAgICAgICAgIC8vIGFzeW5jaHJvbm91cyBzdGVwcyB0aGF0IGZpbmlzaCBhZnRlciB0aGUgY29uc3RydWN0b3IgaXMgY29tcGxldGVkIClcclxuICAgICAgICAgICAgICB0aGlzLl9pc0NvbnN0cnVjdGlvbkNvbXBsZXRlUHJvcGVydHkudmFsdWUgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAvLyBwbGFjZSB0aGUgcmVxdWVzdEFuaW1hdGlvbkZyYW1lICpiZWZvcmUqIHJlbmRlcmluZyB0byBhc3N1cmUgYXMgY2xvc2UgdG8gNjBmcHMgd2l0aCB0aGUgc2V0VGltZW91dCBmYWxsYmFjay5cclxuICAgICAgICAgICAgICAvLyBodHRwOi8vcGF1bGlyaXNoLmNvbS8yMDExL3JlcXVlc3RhbmltYXRpb25mcmFtZS1mb3Itc21hcnQtYW5pbWF0aW5nL1xyXG4gICAgICAgICAgICAgIC8vIExhdW5jaCB0aGUgYm91bmQgdmVyc2lvbiBzbyBpdCBjYW4gZWFzaWx5IGJlIHN3YXBwZWQgb3V0IGZvciBkZWJ1Z2dpbmcuXHJcbiAgICAgICAgICAgICAgLy8gU2NoZWR1bGVzIGFuaW1hdGlvbiB1cGRhdGVzIGFuZCBydW5zIHRoZSBmaXJzdCBzdGVwKClcclxuICAgICAgICAgICAgICB0aGlzLmJvdW5kUnVuQW5pbWF0aW9uTG9vcCgpO1xyXG5cclxuICAgICAgICAgICAgICAvLyBJZiB0aGUgc2ltIGlzIGluIHBsYXliYWNrIG1vZGUsIHRoZW4gZmx1c2ggdGhlIHRpbWVyJ3MgbGlzdGVuZXJzLiBUaGlzIG1ha2VzIHN1cmUgdGhhdCBhbnl0aGluZyBraWNrZWRcclxuICAgICAgICAgICAgICAvLyB0byB0aGUgbmV4dCBmcmFtZSB3aXRoIGB0aW1lci5ydW5Pbk5leHRUaWNrYCBkdXJpbmcgc3RhcnR1cCAobGlrZSBldmVyeSBub3RpZmljYXRpb24gYWJvdXQgYSBQaEVULWlPXHJcbiAgICAgICAgICAgICAgLy8gaW5zdHJ1bWVudGVkIGVsZW1lbnQgaW4gcGhldGlvRW5naW5lLnBoZXRpb09iamVjdEFkZGVkKCkpIGNhbiBjbGVhciBvdXQgYmVmb3JlIGJlZ2lubmluZyBwbGF5YmFjay5cclxuICAgICAgICAgICAgICBpZiAoIHBoZXQuam9pc3QucGxheWJhY2tNb2RlRW5hYmxlZFByb3BlcnR5LnZhbHVlICkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGJlZm9yZUNvdW50cyA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGFzc2VydCApIHtcclxuICAgICAgICAgICAgICAgICAgYmVmb3JlQ291bnRzID0gQXJyYXkuZnJvbSggUmFuZG9tLmFsbFJhbmRvbUluc3RhbmNlcyApLm1hcCggbiA9PiBuLm51bWJlck9mQ2FsbHMgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBzdGVwVGltZXIuZW1pdCggMCApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCBhZnRlckNvdW50cyA9IEFycmF5LmZyb20oIFJhbmRvbS5hbGxSYW5kb21JbnN0YW5jZXMgKS5tYXAoIG4gPT4gbi5udW1iZXJPZkNhbGxzICk7XHJcbiAgICAgICAgICAgICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIF8uaXNFcXVhbCggYmVmb3JlQ291bnRzLCBhZnRlckNvdW50cyApLFxyXG4gICAgICAgICAgICAgICAgICAgIGBSYW5kb20gd2FzIGNhbGxlZCBtb3JlIHRpbWVzIGluIHRoZSBwbGF5YmFjayBzaW0gb24gc3RhcnR1cCwgYmVmb3JlOiAke2JlZm9yZUNvdW50c30sIGFmdGVyOiAke2FmdGVyQ291bnRzfWAgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIC8vIEFmdGVyIHRoZSBhcHBsaWNhdGlvbiBpcyByZWFkeSB0byBnbywgcmVtb3ZlIHRoZSBzcGxhc2ggc2NyZWVuIGFuZCBwcm9ncmVzcyBiYXIuICBOb3RlIHRoZSBzcGxhc2hcclxuICAgICAgICAgICAgICAvLyBzY3JlZW4gaXMgcmVtb3ZlZCBhZnRlciBvbmUgc3RlcCgpLCBzbyB0aGUgcmVuZGVyaW5nIGlzIHJlYWR5IHRvIGdvIHdoZW4gdGhlIHByb2dyZXNzIGJhciBpcyBoaWRkZW4uXHJcbiAgICAgICAgICAgICAgLy8gbm8tb3Agb3RoZXJ3aXNlIGFuZCB3aWxsIGJlIGRpc3Bvc2VkIGJ5IHBoZXRpb0VuZ2luZS5cclxuICAgICAgICAgICAgICBpZiAoICFUYW5kZW0uUEhFVF9JT19FTkFCTEVEIHx8IHBoZXQucHJlbG9hZHMucGhldGlvLnF1ZXJ5UGFyYW1ldGVycy5waGV0aW9TdGFuZGFsb25lICkge1xyXG4gICAgICAgICAgICAgICAgd2luZG93LnBoZXRTcGxhc2hTY3JlZW4uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAvLyBTYW5pdHkgY2hlY2sgdGhhdCB0aGVyZSBpcyBubyBwaGV0aW8gb2JqZWN0IGluIHBoZXQgYnJhbmQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvMTIyOVxyXG4gICAgICAgICAgICAgIHBoZXQuY2hpcHBlci5icmFuZCA9PT0gJ3BoZXQnICYmIGFzc2VydCAmJiBhc3NlcnQoICFUYW5kZW0uUEhFVF9JT19FTkFCTEVELCAnd2luZG93LnBoZXQucHJlbG9hZHMucGhldGlvIHNob3VsZCBub3QgZXhpc3QgZm9yIHBoZXQgYnJhbmQnICk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIENvbW11bmljYXRlIHNpbSBsb2FkIChzdWNjZXNzZnVsbHkpIHRvIENUIG9yIG90aGVyIGxpc3RlbmluZyBwYXJlbnQgZnJhbWVzXHJcbiAgICAgICAgICAgICAgaWYgKCBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmNvbnRpbnVvdXNUZXN0ICkge1xyXG4gICAgICAgICAgICAgICAgcGhldC5jaGlwcGVyLnJlcG9ydENvbnRpbnVvdXNUZXN0UmVzdWx0KCB7XHJcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdjb250aW51b3VzLXRlc3QtbG9hZCdcclxuICAgICAgICAgICAgICAgIH0gKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgaWYgKCBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLnBvc3RNZXNzYWdlT25Mb2FkICkge1xyXG4gICAgICAgICAgICAgICAgd2luZG93LnBhcmVudCAmJiB3aW5kb3cucGFyZW50LnBvc3RNZXNzYWdlKCBKU09OLnN0cmluZ2lmeSgge1xyXG4gICAgICAgICAgICAgICAgICB0eXBlOiAnbG9hZCcsXHJcbiAgICAgICAgICAgICAgICAgIHVybDogd2luZG93LmxvY2F0aW9uLmhyZWZcclxuICAgICAgICAgICAgICAgIH0gKSwgJyonICk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCAyNSApOyAvLyBwYXVzZSBmb3IgYSBmZXcgbWlsbGlzZWNvbmRzIHdpdGggdGhlIHByb2dyZXNzIGJhciBmaWxsZWQgaW4gYmVmb3JlIGdvaW5nIHRvIHRoZSBob21lIHNjcmVlblxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgc2V0cyB0aGUgYW1vdW50IG9mIGRlbGF5IGJldHdlZW4gZWFjaCB3b3JrIGl0ZW0gdG8gbWFrZSBpdCBlYXNpZXIgdG8gc2VlIHRoZSBjaGFuZ2VzIHRvIHRoZVxyXG4gICAgICAgIC8vIHByb2dyZXNzIGJhci4gIEEgdG90YWwgdmFsdWUgaXMgZGl2aWRlZCBieSB0aGUgbnVtYmVyIG9mIHdvcmsgaXRlbXMuICBUaGlzIG1ha2VzIGl0IHBvc3NpYmxlIHRvIHNlZSB0aGVcclxuICAgICAgICAvLyBwcm9ncmVzcyBiYXIgd2hlbiBmZXcgd29yayBpdGVtcyBleGlzdCwgc3VjaCBhcyBmb3IgYSBzaW5nbGUgc2NyZWVuIHNpbSwgYnV0IGFsbG93cyB0aGluZ3MgdG8gbW92ZVxyXG4gICAgICAgIC8vIHJlYXNvbmFibHkgcXVpY2tseSB3aGVuIG1vcmUgd29yayBpdGVtcyBleGlzdCwgc3VjaCBhcyBmb3IgYSBmb3VyLXNjcmVlbiBzaW0uXHJcbiAgICAgICAgMzAgLyB3b3JrSXRlbXMubGVuZ3RoXHJcbiAgICAgICk7XHJcbiAgICB9O1xyXG4gICAgcnVuSXRlbSggMCApO1xyXG4gIH1cclxuXHJcbiAgLy8gQm91bmQgdG8gdGhpcy5ib3VuZFJ1bkFuaW1hdGlvbkxvb3Agc28gaXQgY2FuIGJlIHJ1biBpbiB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lXHJcbiAgcHJpdmF0ZSBydW5BbmltYXRpb25Mb29wKCk6IHZvaWQge1xyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSggdGhpcy5ib3VuZFJ1bkFuaW1hdGlvbkxvb3AgKTtcclxuXHJcbiAgICAvLyBPbmx5IHJ1biBhbmltYXRpb24gZnJhbWVzIGZvciBhbiBhY3RpdmUgc2ltLiBJZiBpbiBwbGF5YmFja01vZGUsIHBsYXliYWNrIGxvZ2ljIHdpbGwgaGFuZGxlIGFuaW1hdGlvbiBmcmFtZVxyXG4gICAgLy8gc3RlcHBpbmcgbWFudWFsbHkuXHJcbiAgICBpZiAoIHRoaXMuYWN0aXZlUHJvcGVydHkudmFsdWUgJiYgIXBoZXQuam9pc3QucGxheWJhY2tNb2RlRW5hYmxlZFByb3BlcnR5LnZhbHVlICkge1xyXG5cclxuICAgICAgLy8gSGFuZGxlIElucHV0IGZ1enppbmcgYmVmb3JlIHN0ZXBwaW5nIHRoZSBzaW0gYmVjYXVzZSBpbnB1dCBldmVudHMgb2NjdXIgb3V0c2lkZSBvZiBzaW0gc3RlcHMsIGJ1dCBub3QgYmVmb3JlIHRoZVxyXG4gICAgICAvLyBmaXJzdCBzaW0gc3RlcCAodG8gcHJldmVudCBpc3N1ZXMgbGlrZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZXF1YWxpdHktZXhwbG9yZXIvaXNzdWVzLzE2MSkuXHJcbiAgICAgIHRoaXMuZnJhbWVDb3VudGVyID4gMCAmJiB0aGlzLmRpc3BsYXkuZnV6eklucHV0RXZlbnRzKCk7XHJcblxyXG4gICAgICB0aGlzLnN0ZXBPbmVGcmFtZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFRoZSBhbmltYXRpb24gZnJhbWUgdGltZXIgcnVucyBldmVyeSBmcmFtZVxyXG4gICAgY29uc3QgY3VycmVudFRpbWUgPSBEYXRlLm5vdygpO1xyXG4gICAgYW5pbWF0aW9uRnJhbWVUaW1lci5lbWl0KCBnZXREVCggdGhpcy5sYXN0QW5pbWF0aW9uRnJhbWVUaW1lLCBjdXJyZW50VGltZSApICk7XHJcbiAgICB0aGlzLmxhc3RBbmltYXRpb25GcmFtZVRpbWUgPSBjdXJyZW50VGltZTtcclxuXHJcbiAgICBpZiAoIFRhbmRlbS5QSEVUX0lPX0VOQUJMRUQgKSB7XHJcblxyXG4gICAgICAvLyBQaEVULWlPIGJhdGNoZXMgbWVzc2FnZXMgdG8gYmUgc2VudCB0byBvdGhlciBmcmFtZXMsIG1lc3NhZ2VzIG11c3QgYmUgc2VudCB3aGV0aGVyIHRoZSBzaW0gaXMgYWN0aXZlIG9yIG5vdFxyXG4gICAgICBwaGV0LnBoZXRpby5waGV0aW9Db21tYW5kUHJvY2Vzc29yLm9uQW5pbWF0aW9uTG9vcCggdGhpcyApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gUnVuIGEgc2luZ2xlIGZyYW1lIGluY2x1ZGluZyBtb2RlbCwgdmlldyBhbmQgZGlzcGxheSB1cGRhdGVzLCB1c2VkIGJ5IExlZ2VuZHMgb2YgTGVhcm5pbmdcclxuICBwdWJsaWMgc3RlcE9uZUZyYW1lKCk6IHZvaWQge1xyXG5cclxuICAgIC8vIENvbXB1dGUgdGhlIGVsYXBzZWQgdGltZSBzaW5jZSB0aGUgbGFzdCBmcmFtZSwgb3IgZ3Vlc3MgMS82MHRoIG9mIGEgc2Vjb25kIGlmIGl0IGlzIHRoZSBmaXJzdCBmcmFtZVxyXG4gICAgY29uc3QgY3VycmVudFRpbWUgPSBEYXRlLm5vdygpO1xyXG4gICAgY29uc3QgZHQgPSBnZXREVCggdGhpcy5sYXN0U3RlcFRpbWUsIGN1cnJlbnRUaW1lICk7XHJcbiAgICB0aGlzLmxhc3RTdGVwVGltZSA9IGN1cnJlbnRUaW1lO1xyXG5cclxuICAgIC8vIERvbid0IHJ1biB0aGUgc2ltdWxhdGlvbiBvbiBzdGVwcyBiYWNrIGluIHRpbWUgKHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzQwOSlcclxuICAgIGlmICggZHQgPiAwICkge1xyXG4gICAgICB0aGlzLnN0ZXBTaW11bGF0aW9uKCBkdCApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXBkYXRlIHRoZSBzaW11bGF0aW9uIG1vZGVsLCB2aWV3LCBzY2VuZXJ5IGRpc3BsYXkgd2l0aCBhbiBlbGFwc2VkIHRpbWUgb2YgZHQuXHJcbiAgICogQHBhcmFtIGR0IC0gaW4gc2Vjb25kc1xyXG4gICAqIChwaGV0LWlvKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGVwU2ltdWxhdGlvbiggZHQ6IG51bWJlciApOiB2b2lkIHtcclxuICAgIHRoaXMuc3RlcFNpbXVsYXRpb25BY3Rpb24uZXhlY3V0ZSggZHQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhpZGUgb3Igc2hvdyBhbGwgYWNjZXNzaWJsZSBjb250ZW50IHJlbGF0ZWQgdG8gdGhlIHNpbSBTY3JlZW5WaWV3cywgYW5kIG5hdmlnYXRpb24gYmFyLiBUaGlzIGNvbnRlbnQgd2lsbFxyXG4gICAqIHJlbWFpbiB2aXNpYmxlLCBidXQgbm90IGJlIHRhYiBuYXZpZ2FibGUgb3IgcmVhZGFibGUgd2l0aCBhIHNjcmVlbiByZWFkZXIuIFRoaXMgaXMgZ2VuZXJhbGx5IHVzZWZ1bCB3aGVuXHJcbiAgICogZGlzcGxheWluZyBhIHBvcCB1cCBvciBtb2RhbCBkaWFsb2cuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFBET01WaWV3c1Zpc2libGUoIHZpc2libGU6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLnNjcmVlbnMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIHRoaXMuc2NyZWVuc1sgaSBdLnZpZXcucGRvbVZpc2libGUgPSB2aXNpYmxlO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMubmF2aWdhdGlvbkJhci5wZG9tVmlzaWJsZSA9IHZpc2libGU7XHJcbiAgICB0aGlzLmhvbWVTY3JlZW4gJiYgdGhpcy5ob21lU2NyZWVuLnZpZXcuc2V0UERPTVZpc2libGUoIHZpc2libGUgKTtcclxuICAgIHRoaXMudG9vbGJhciAmJiB0aGlzLnRvb2xiYXIuc2V0UERPTVZpc2libGUoIHZpc2libGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgdm9pY2luZ1Zpc2libGUgc3RhdGUgb2Ygc2ltdWxhdGlvbiBjb21wb25lbnRzLiBXaGVuIGZhbHNlLCBPTkxZIHRoZSBUb29sYmFyXHJcbiAgICogYW5kIGl0cyBidXR0b25zIHdpbGwgYmUgYWJsZSB0byBhbm5vdW5jZSBWb2ljaW5nIHV0dGVyYW5jZXMuIFRoaXMgaXMgdXNlZCBieSB0aGVcclxuICAgKiBcIlNpbSBWb2ljaW5nXCIgc3dpdGNoIGluIHRoZSB0b29sYmFyIHdoaWNoIHdpbGwgZGlzYWJsZSBhbGwgVm9pY2luZyBpbiB0aGUgc2ltIHNvIHRoYXRcclxuICAgKiBvbmx5IFRvb2xiYXIgY29udGVudCBpcyBhbm5vdW5jZWQuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFNpbVZvaWNpbmdWaXNpYmxlKCB2aXNpYmxlOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgdGhpcy5zZXROb25Nb2RhbFZvaWNpbmdWaXNpYmxlKCB2aXNpYmxlICk7XHJcbiAgICB0aGlzLnRvcExheWVyICYmIHRoaXMudG9wTGF5ZXIuc2V0Vm9pY2luZ1Zpc2libGUoIHZpc2libGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdm9pY2luZ1Zpc2libGUgb24gYWxsIGVsZW1lbnRzIFwiYmVoaW5kXCIgdGhlIG1vZGFsIG5vZGUgc3RhY2suIEluIHRoaXMgY2FzZSwgdm9pY2luZyBzaG91bGQgbm90IHdvcmsgZm9yIHRob3NlXHJcbiAgICogY29tcG9uZW50cyB3aGVuIHNldCB0byBmYWxzZS5cclxuICAgKiBAcGFyYW0gdmlzaWJsZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXROb25Nb2RhbFZvaWNpbmdWaXNpYmxlKCB2aXNpYmxlOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5zY3JlZW5zLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICB0aGlzLnNjcmVlbnNbIGkgXS52aWV3LnZvaWNpbmdWaXNpYmxlID0gdmlzaWJsZTsgLy8gaG9tZSBzY3JlZW4gaXMgdGhlIGZpcnN0IGl0ZW0sIGlmIGNyZWF0ZWRcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLm5hdmlnYXRpb25CYXIudm9pY2luZ1Zpc2libGUgPSB2aXNpYmxlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2hlY2tzIGZvciB3aGV0aGVyIG11bHRpLXNjcmVlbiBzaW1zIGhhdmUgc2NyZWVuIG5hbWVzIHRoYXQgYXJlIGluIHBoZXQuc2NyZWVuTmFtZUtleXMgd2l0aGluIHBhY2thZ2UuanNvbixcclxuICAgKiBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzEzNjdcclxuICAgKi9cclxuICBwcml2YXRlIGF1ZGl0U2NyZWVuTmFtZUtleXMoKTogdm9pZCB7XHJcbiAgICBpZiAoIHRoaXMuc2NyZWVucy5sZW5ndGggPj0gMiApIHtcclxuICAgICAgdGhpcy5zY3JlZW5zLmZvckVhY2goIHNjcmVlbiA9PiB7XHJcbiAgICAgICAgaWYgKCAhKCBzY3JlZW4gaW5zdGFuY2VvZiBIb21lU2NyZWVuICkgJiYgc2NyZWVuLm5hbWVQcm9wZXJ0eSBpbnN0YW5jZW9mIExvY2FsaXplZFN0cmluZ1Byb3BlcnR5ICkge1xyXG4gICAgICAgICAgY29uc3Qgc3RyaW5nS2V5ID0gc2NyZWVuLm5hbWVQcm9wZXJ0eS5zdHJpbmdLZXk7XHJcbiAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBwYWNrYWdlSlNPTi5waGV0LnNjcmVlbk5hbWVLZXlzLmluY2x1ZGVzKCBzdHJpbmdLZXkgKSxcclxuICAgICAgICAgICAgYEZvciBhIG11bHRpLXNjcmVlbiBzaW0sIHRoZSBzdHJpbmcga2V5ICgke0pTT04uc3RyaW5naWZ5KCBzdHJpbmdLZXkgKX0pIHNob3VsZCBiZSBpbiBwaGV0LnNjcmVlbk5hbWVLZXlzIHdpdGhpbiBwYWNrYWdlLmpzb25gICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG50eXBlIExheW91dE5vZGUgPSBOb2RlICYge1xyXG4gIGxheW91dD86ICggbGF5b3V0Qm91bmRzOiBCb3VuZHMyICkgPT4gdm9pZDtcclxufTtcclxuXHJcbi8vIFRoaXMgTm9kZSBzdXBwb3J0cyBjaGlsZHJlbiB0aGF0IGhhdmUgbGF5b3V0LlxyXG50eXBlIFRvcExheWVyTm9kZSA9IHtcclxuICBhZGRDaGlsZCggY2hpbGQ6IExheW91dE5vZGUgKTogdm9pZDtcclxuICBjaGlsZHJlbjogTGF5b3V0Tm9kZVtdO1xyXG59ICYgTm9kZTtcclxuXHJcbi8qKlxyXG4gKiBDb21wdXRlIHRoZSBkdCBzaW5jZSB0aGUgbGFzdCBldmVudFxyXG4gKiBAcGFyYW0gbGFzdFRpbWUgLSBtaWxsaXNlY29uZHMsIHRpbWUgb2YgdGhlIGxhc3QgZXZlbnRcclxuICogQHBhcmFtIGN1cnJlbnRUaW1lIC0gbWlsbGlzZWNvbmRzLCBjdXJyZW50IHRpbWUuICBQYXNzZWQgaW4gaW5zdGVhZCBvZiBjb21wdXRlZCBzbyB0aGVyZSBpcyBubyBcInNsYWNrXCIgYmV0d2VlbiBtZWFzdXJlbWVudHNcclxuICovXHJcbmZ1bmN0aW9uIGdldERUKCBsYXN0VGltZTogbnVtYmVyLCBjdXJyZW50VGltZTogbnVtYmVyICk6IG51bWJlciB7XHJcblxyXG4gIC8vIENvbXB1dGUgdGhlIGVsYXBzZWQgdGltZSBzaW5jZSB0aGUgbGFzdCBmcmFtZSwgb3IgZ3Vlc3MgMS82MHRoIG9mIGEgc2Vjb25kIGlmIGl0IGlzIHRoZSBmaXJzdCBmcmFtZVxyXG4gIHJldHVybiAoIGxhc3RUaW1lID09PSAtMSApID8gMSAvIDYwIDpcclxuICAgICAgICAgKCBjdXJyZW50VGltZSAtIGxhc3RUaW1lICkgLyAxMDAwLjA7XHJcbn1cclxuXHJcbmpvaXN0LnJlZ2lzdGVyKCAnU2ltJywgU2ltICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsbUJBQW1CLE1BQU0sc0NBQXNDO0FBQ3RFLE9BQU9DLGVBQWUsTUFBTSxrQ0FBa0M7QUFDOUQsT0FBT0MscUJBQXFCLE1BQU0sd0NBQXdDO0FBQzFFLE9BQU9DLGVBQWUsTUFBTSxrQ0FBa0M7QUFDOUQsT0FBT0MsT0FBTyxNQUFNLDBCQUEwQjtBQUM5QyxPQUFPQyxjQUFjLE1BQU0saUNBQWlDO0FBQzVELE9BQU9DLFFBQVEsTUFBTSwyQkFBMkI7QUFDaEQsT0FBT0MsU0FBUyxNQUFNLDRCQUE0QjtBQUNsRCxPQUFPQyx1QkFBdUIsTUFBTSw2Q0FBNkM7QUFDakYsT0FBT0MsT0FBTyxNQUFNLHlCQUF5QjtBQUM3QyxPQUFPQyxVQUFVLE1BQU0sNEJBQTRCO0FBQ25ELE9BQU9DLE1BQU0sTUFBTSx3QkFBd0I7QUFDM0MsT0FBT0MsUUFBUSxNQUFNLHVCQUF1QixDQUFDLENBQUM7QUFDOUMsT0FBT0MsUUFBUSxNQUFNLGdDQUFnQztBQUNyRCxPQUFPQyxTQUFTLE1BQU0saUNBQWlDO0FBQ3ZELE9BQU9DLFdBQVcsTUFBTSx5Q0FBeUM7QUFDakUsT0FB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Q3BELElBQUksQ0FBQ3FCLHlCQUF5QixDQUFFckIsT0FBUSxDQUFDO0lBQ3pDLElBQUksQ0FBQ2xNLFFBQVEsSUFBSSxJQUFJLENBQUNBLFFBQVEsQ0FBQzJRLGlCQUFpQixDQUFFekUsT0FBUSxDQUFDO0VBQzdEOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDU3FCLHlCQUF5QkEsQ0FBRXJCLE9BQWdCLEVBQVM7SUFDekQsS0FBTSxJQUFJZ0MsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHLElBQUksQ0FBQ2pMLE9BQU8sQ0FBQ3ZDLE1BQU0sRUFBRXdOLENBQUMsRUFBRSxFQUFHO01BQzlDLElBQUksQ0FBQ2pMLE9BQU8sQ0FBRWlMLENBQUMsQ0FBRSxDQUFDL0ssSUFBSSxDQUFDeU4sY0FBYyxHQUFHMUUsT0FBTyxDQUFDLENBQUM7SUFDbkQ7SUFFQSxJQUFJLENBQUM1SixhQUFhLENBQUNzTyxjQUFjLEdBQUcxRSxPQUFPO0VBQzdDOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0VBQ1ViLG1CQUFtQkEsQ0FBQSxFQUFTO0lBQ2xDLElBQUssSUFBSSxDQUFDcEksT0FBTyxDQUFDdkMsTUFBTSxJQUFJLENBQUMsRUFBRztNQUM5QixJQUFJLENBQUN1QyxPQUFPLENBQUNHLE9BQU8sQ0FBRW9CLE1BQU0sSUFBSTtRQUM5QixJQUFLLEVBQUdBLE1BQU0sWUFBWXRJLFVBQVUsQ0FBRSxJQUFJc0ksTUFBTSxDQUFDbUQsWUFBWSxZQUFZbE4sdUJBQXVCLEVBQUc7VUFDakcsTUFBTW9XLFNBQVMsR0FBR3JNLE1BQU0sQ0FBQ21ELFlBQVksQ0FBQ2tKLFNBQVM7VUFDL0N2UyxNQUFNLElBQUlBLE1BQU0sQ0FBRTdCLFdBQVcsQ0FBQ3VCLElBQUksQ0FBQzhTLGNBQWMsQ0FBQ3ZKLFFBQVEsQ0FBRXNKLFNBQVUsQ0FBQyxFQUNwRSwyQ0FBMENuQixJQUFJLENBQUNDLFNBQVMsQ0FBRWtCLFNBQVUsQ0FBRSx3REFBd0QsQ0FBQztRQUNwSTtNQUNGLENBQUUsQ0FBQztJQUNMO0VBQ0Y7QUFDRjs7QUFNQTs7QUFNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBU1IsS0FBS0EsQ0FBRVUsUUFBZ0IsRUFBRWIsV0FBbUIsRUFBVztFQUU5RDtFQUNBLE9BQVNhLFFBQVEsS0FBSyxDQUFDLENBQUMsR0FBSyxDQUFDLEdBQUcsRUFBRSxHQUM1QixDQUFFYixXQUFXLEdBQUdhLFFBQVEsSUFBSyxNQUFNO0FBQzVDO0FBRUEzVSxLQUFLLENBQUM0VSxRQUFRLENBQUUsS0FBSyxFQUFFeFMsR0FBSSxDQUFDIiwiaWdub3JlTGlzdCI6W119