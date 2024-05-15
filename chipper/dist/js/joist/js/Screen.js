// Copyright 2013-2024, University of Colorado Boulder

/**
 * A Screen is the largest chunk of a simulation. (Java sims used the term Module, but that term
 * is too overloaded to use with JavaScript and Git.)
 *
 * When creating a Sim, Screens are supplied as the arguments. They can be specified as object literals or through
 * instances of this class. This class may centralize default behavior or state for Screens in the future, but right
 * now it only allows you to create Sims without using named parameter object literals.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import BooleanProperty from '../../axon/js/BooleanProperty.js';
import DerivedProperty from '../../axon/js/DerivedProperty.js';
import Property from '../../axon/js/Property.js';
import Dimension2 from '../../dot/js/Dimension2.js';
import { Shape } from '../../kite/js/imports.js';
import optionize from '../../phet-core/js/optionize.js';
import StringUtils from '../../phetcommon/js/util/StringUtils.js';
import { Path, Rectangle } from '../../scenery/js/imports.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';
import Tandem from '../../tandem/js/Tandem.js';
import IOType from '../../tandem/js/types/IOType.js';
import ReferenceIO from '../../tandem/js/types/ReferenceIO.js';
import joist from './joist.js';
import JoistStrings from './JoistStrings.js';
import ScreenIcon from './ScreenIcon.js';
import Multilink from '../../axon/js/Multilink.js';
import PatternStringProperty from '../../axon/js/PatternStringProperty.js';
const screenNamePatternStringProperty = JoistStrings.a11y.screenNamePatternStringProperty;
const screenSimPatternStringProperty = JoistStrings.a11y.screenSimPatternStringProperty;
const simScreenStringProperty = JoistStrings.a11y.simScreenStringProperty;

// constants
const MINIMUM_HOME_SCREEN_ICON_SIZE = new Dimension2(548, 373);
const MINIMUM_NAVBAR_ICON_SIZE = new Dimension2(147, 100);
const NAVBAR_ICON_ASPECT_RATIO = MINIMUM_NAVBAR_ICON_SIZE.width / MINIMUM_NAVBAR_ICON_SIZE.height;
const HOME_SCREEN_ICON_ASPECT_RATIO = MINIMUM_HOME_SCREEN_ICON_SIZE.width / MINIMUM_HOME_SCREEN_ICON_SIZE.height;
const ICON_ASPECT_RATIO_TOLERANCE = 5E-3; // how close to the ideal aspect ratio an icon must be

// Home screen and navigation bar icons must have the same aspect ratio, see https://github.com/phetsims/joist/issues/76
assert && assert(Math.abs(HOME_SCREEN_ICON_ASPECT_RATIO - HOME_SCREEN_ICON_ASPECT_RATIO) < ICON_ASPECT_RATIO_TOLERANCE, 'MINIMUM_HOME_SCREEN_ICON_SIZE and MINIMUM_NAVBAR_ICON_SIZE must have the same aspect ratio');

// Documentation is by the defaults

// @joist-internal - This type is uses IntentionalAny to break the contravariance dependency that the createView function
// has on Screen. Ideally we could use TModel instead, but that would involve a rewrite of how we pass closures into
// Screen instead of the already created Model/View themselves. See https://github.com/phetsims/joist/issues/783#issuecomment-1231017213

// Parameterized on M=Model and V=View
class Screen extends PhetioObject {
  // joist-internal

  static HOME_SCREEN_ICON_ASPECT_RATIO = HOME_SCREEN_ICON_ASPECT_RATIO;
  static MINIMUM_HOME_SCREEN_ICON_SIZE = MINIMUM_HOME_SCREEN_ICON_SIZE;
  static MINIMUM_NAVBAR_ICON_SIZE = MINIMUM_NAVBAR_ICON_SIZE;
  static ScreenIO = new IOType('ScreenIO', {
    valueType: Screen,
    supertype: ReferenceIO(IOType.ObjectIO),
    documentation: 'Section of a simulation which has its own model and view.'
  });
  constructor(createModel, createView, providedOptions) {
    const options = optionize()({
      // {TProperty<string>|null} name of the sim, as displayed to the user.
      // For single-screen sims, there is no home screen or navigation bar, and null is OK.
      // For multi-screen sims, this must be provided.
      name: null,
      // {boolean} whether nameProperty should be instrumented. see usage for explanation of its necessity.
      instrumentNameProperty: true,
      backgroundColorProperty: new Property('white'),
      // {Node|null} icon shown on the home screen. If null, then a default is created.
      // For single-screen sims, there is no home screen and the default is OK.
      homeScreenIcon: null,
      // {boolean} whether to draw a frame around the small icons on home screen
      showUnselectedHomeScreenIconFrame: false,
      // {Node|null} icon shown in the navigation bar. If null, then the home screen icon will be used, scaled to fit.
      navigationBarIcon: null,
      // {string|null} show a frame around the screen icon when the navbar's background fill is this color
      // 'black', 'white', or null (no frame)
      showScreenIconFrameForNavigationBarFill: null,
      // dt cap in seconds, see https://github.com/phetsims/joist/issues/130
      maxDT: 0.5,
      // a {null|function():Node} placed into the keyboard help dialog that can be opened from the navigation bar when this
      // screen is selected
      createKeyboardHelpNode: null,
      // pdom/voicing - The description that is used when interacting with screen icons/buttons in joist (and home screen).
      // This is often a full but short sentence with a period at the end of it. This is also used for voicing this screen
      // in the home screen.
      descriptionContent: null,
      // phet-io
      // @ts-expect-error include a default for un-instrumented, JavaScript sims
      tandem: Tandem.REQUIRED,
      tandemNameSuffix: Tandem.SCREEN_TANDEM_NAME_SUFFIX,
      phetioType: Screen.ScreenIO,
      phetioState: false,
      phetioFeatured: true
    }, providedOptions);
    assert && assert(_.includes(['black', 'white', null], options.showScreenIconFrameForNavigationBarFill), `invalid showScreenIconFrameForNavigationBarFill: ${options.showScreenIconFrameForNavigationBarFill}`);
    assert && assert(typeof options.name !== 'string', 'Screen no longer supports a name string, instead it should be a Property<string>');
    super(options);

    // Create a default homeScreenIcon, using the Screen's background color
    if (!options.homeScreenIcon) {
      const iconNode = new Rectangle(0, 0, MINIMUM_HOME_SCREEN_ICON_SIZE.width, MINIMUM_HOME_SCREEN_ICON_SIZE.height);
      options.homeScreenIcon = new ScreenIcon(iconNode, {
        fill: options.backgroundColorProperty.value,
        maxIconWidthProportion: 1,
        maxIconHeightProportion: 1
      });
    }

    // navigationBarIcon defaults to homeScreenIcon, and will be scaled down
    if (!options.navigationBarIcon) {
      options.navigationBarIcon = options.homeScreenIcon;
    }

    // Validate icon sizes
    validateIconSize(options.homeScreenIcon, MINIMUM_HOME_SCREEN_ICON_SIZE, HOME_SCREEN_ICON_ASPECT_RATIO, 'homeScreenIcon');
    validateIconSize(options.navigationBarIcon, MINIMUM_NAVBAR_ICON_SIZE, NAVBAR_ICON_ASPECT_RATIO, 'navigationBarIcon');
    this.backgroundColorProperty = options.backgroundColorProperty;
    if (options.name) {
      this.nameProperty = options.name;

      // Don't instrument this.nameProperty if options.instrumentNameProperty is false or if options.name is not provided.
      // This additional option is needed because designers requested the ability to not instrument a screen's nameProperty
      // even if it has a name, see https://github.com/phetsims/joist/issues/627 and https://github.com/phetsims/joist/issues/629.
      options.instrumentNameProperty && this.addLinkedElement(options.name, {
        tandemName: 'nameProperty'
      });
    } else {
      // may be null for single-screen simulations, just make it blank
      this.nameProperty = new Property('');
    }
    this.homeScreenIcon = options.homeScreenIcon;
    this.navigationBarIcon = options.navigationBarIcon;
    this.showUnselectedHomeScreenIconFrame = options.showUnselectedHomeScreenIconFrame;
    this.showScreenIconFrameForNavigationBarFill = options.showScreenIconFrameForNavigationBarFill;
    this.createKeyboardHelpNode = options.createKeyboardHelpNode;

    // may be null for single-screen simulations
    this.pdomDisplayNameProperty = new DerivedProperty([this.nameProperty, screenNamePatternStringProperty], name => {
      return name === null ? '' : StringUtils.fillIn(screenNamePatternStringProperty, {
        name: name
      });
    });
    this.maxDT = options.maxDT;
    this.createModel = createModel;
    this.createView = createView;

    // Construction of the model and view are delayed and controlled to enable features like
    // a) faster loading when only loading certain screens
    // b) showing a loading progress bar <not implemented>
    this._model = null;
    this._view = null;

    // Indicates whether the Screen is active. Clients can read this, joist sets it.
    // To prevent potential visual glitches, the value should change only while the screen's view is invisible.
    // That is: transitions from false to true before a Screen becomes visible, and from true to false after a Screen becomes invisible.
    this.activeProperty = new BooleanProperty(true, {
      tandem: options.tandem.createTandem('activeProperty'),
      phetioReadOnly: true,
      phetioDocumentation: 'Indicates whether the screen is currently displayed in the simulation.  For single-screen ' + 'simulations, there is only one screen and it is always active.'
    });

    // Used to set the ScreenView's descriptionContent. This is a bit of a misnomer because Screen is not a Node
    // subtype, so this is a value property rather than a setter.
    this.descriptionContent = '';
    if (options.descriptionContent) {
      this.descriptionContent = options.descriptionContent;
    } else if (this.nameProperty.value) {
      this.descriptionContent = new PatternStringProperty(screenNamePatternStringProperty, {
        name: this.nameProperty
      }, {
        tandem: Tandem.OPT_OUT
      });
    } else {
      this.descriptionContent = simScreenStringProperty; // fall back on generic name
    }
    assert && this.activeProperty.lazyLink(() => {
      assert && assert(this._view, 'isActive should not change before the Screen view has been initialized');

      // In phet-io mode, the state of a sim can be set without a deterministic order. The activeProperty could be
      // changed before the view's visibility is set.
      if (!Tandem.PHET_IO_ENABLED) {
        assert && assert(!this._view.isVisible(), 'isActive should not change while the Screen view is visible');
      }
    });
  }

  // Returns the model (if it has been constructed)
  get model() {
    assert && assert(this._model, 'Model has not yet been constructed');
    return this._model;
  }

  // Returns the view (if it has been constructed)
  get view() {
    assert && assert(this._view, 'View has not yet been constructed');
    return this._view;
  }
  hasModel() {
    return !!this._model;
  }
  hasView() {
    return !!this._view;
  }
  reset() {

    // Background color not reset, as it's a responsibility of the code that changes the property
  }

  /**
   * Initialize the model.
   * (joist-internal)
   */
  initializeModel() {
    assert && assert(this._model === null, 'there was already a model');
    this._model = this.createModel();
  }

  /**
   * Initialize the view.
   * (joist-internal)
   * @param simNameProperty - The Property of the name of the sim, used for a11y.
   * @param displayedSimNameProperty - The Property of the display name of the sim, used for a11y. Could change based on screen.
   * @param numberOfScreens - the number of screens in the sim this runtime (could change with `?screens=...`.
   * @param isHomeScreen - if this screen is the home screen.
   */
  initializeView(simNameProperty, displayedSimNameProperty, numberOfScreens, isHomeScreen) {
    assert && assert(this._view === null, 'there was already a view');
    this._view = this.createView(this.model);
    this._view.setVisible(false); // a Screen is invisible until selected

    // Show the home screen's layoutBounds
    if (phet.chipper.queryParameters.dev) {
      this._view.addChild(devCreateLayoutBoundsNode(this._view.layoutBounds));
    }

    // For debugging, make it possible to see the visibleBounds.  This is not included with ?dev since
    // it should just be equal to what you see.
    if (phet.chipper.queryParameters.showVisibleBounds) {
      this._view.addChild(devCreateVisibleBoundsNode(this._view));
    }

    // Set the accessible label for the screen.
    Multilink.multilink([displayedSimNameProperty, simNameProperty, this.pdomDisplayNameProperty], (displayedName, simName, pdomDisplayName) => {
      let titleString;

      // Single screen sims don't need screen names, instead just show the title of the sim.
      // Using total screens for sim breaks modularity a bit, but it also is needed as that parameter changes the
      // labelling of this screen, see https://github.com/phetsims/joist/issues/496
      if (numberOfScreens === 1) {
        titleString = displayedName; // for multiscreen sims, like "Ratio and Proportion -- Create"
      } else if (isHomeScreen) {
        titleString = simName; // Like "Ratio and Propotion"
      } else {
        // initialize proper PDOM labelling for ScreenView
        titleString = StringUtils.fillIn(screenSimPatternStringProperty, {
          screenName: pdomDisplayName,
          simName: simName
        });
      }

      // if there is a screenSummaryNode, then set its intro string now
      this._view.setScreenSummaryIntroAndTitle(simName, pdomDisplayName, titleString, numberOfScreens > 1);
    });
    assert && this._view.pdomAudit();
  }
}

/**
 * Validates the sizes for the home screen icon and navigation bar icon.
 * @param icon - the icon to validate
 * @param minimumSize - the minimum allowed size for the icon
 * @param aspectRatio - the required aspect ratio
 * @param name - the name of the icon type (for assert messages)
 */
function validateIconSize(icon, minimumSize, aspectRatio, name) {
  assert && assert(icon.width >= minimumSize.width, `${name} width is too small: ${icon.width} < ${minimumSize.width}`);
  assert && assert(icon.height >= minimumSize.height, `${name} height is too small: ${icon.height} < ${minimumSize.height}`);

  // Validate home screen aspect ratio
  const actualAspectRatio = icon.width / icon.height;
  assert && assert(Math.abs(aspectRatio - actualAspectRatio) < ICON_ASPECT_RATIO_TOLERANCE, `${name} has invalid aspect ratio: ${actualAspectRatio}`);
}

/**
 * Creates a Node for visualizing the ScreenView layoutBounds with 'dev' query parameter.
 */
function devCreateLayoutBoundsNode(layoutBounds) {
  return new Path(Shape.bounds(layoutBounds), {
    stroke: 'red',
    lineWidth: 3,
    pickable: false
  });
}

/**
 * Creates a Node for visualizing the ScreenView visibleBoundsProperty with 'showVisibleBounds' query parameter.
 */
function devCreateVisibleBoundsNode(screenView) {
  const path = new Path(Shape.bounds(screenView.visibleBoundsProperty.value), {
    stroke: 'blue',
    lineWidth: 6,
    pickable: false
  });
  screenView.visibleBoundsProperty.link(visibleBounds => {
    path.shape = Shape.bounds(visibleBounds);
  });
  return path;
}
joist.register('Screen', Screen);
export default Screen;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJEZXJpdmVkUHJvcGVydHkiLCJQcm9wZXJ0eSIsIkRpbWVuc2lvbjIiLCJTaGFwZSIsIm9wdGlvbml6ZSIsIlN0cmluZ1V0aWxzIiwiUGF0aCIsIlJlY3RhbmdsZSIsIlBoZXRpb09iamVjdCIsIlRhbmRlbSIsIklPVHlwZSIsIlJlZmVyZW5jZUlPIiwiam9pc3QiLCJKb2lzdFN0cmluZ3MiLCJTY3JlZW5JY29uIiwiTXVsdGlsaW5rIiwiUGF0dGVyblN0cmluZ1Byb3BlcnR5Iiwic2NyZWVuTmFtZVBhdHRlcm5TdHJpbmdQcm9wZXJ0eSIsImExMXkiLCJzY3JlZW5TaW1QYXR0ZXJuU3RyaW5nUHJvcGVydHkiLCJzaW1TY3JlZW5TdHJpbmdQcm9wZXJ0eSIsIk1JTklNVU1fSE9NRV9TQ1JFRU5fSUNPTl9TSVpFIiwiTUlOSU1VTV9OQVZCQVJfSUNPTl9TSVpFIiwiTkFWQkFSX0lDT05fQVNQRUNUX1JBVElPIiwid2lkdGgiLCJoZWlnaHQiLCJIT01FX1NDUkVFTl9JQ09OX0FTUEVDVF9SQVRJTyIsIklDT05fQVNQRUNUX1JBVElPX1RPTEVSQU5DRSIsImFzc2VydCIsIk1hdGgiLCJhYnMiLCJTY3JlZW4iLCJTY3JlZW5JTyIsInZhbHVlVHlwZSIsInN1cGVydHlwZSIsIk9iamVjdElPIiwiZG9jdW1lbnRhdGlvbiIsImNvbnN0cnVjdG9yIiwiY3JlYXRlTW9kZWwiLCJjcmVhdGVWaWV3IiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsIm5hbWUiLCJpbnN0cnVtZW50TmFtZVByb3BlcnR5IiwiYmFja2dyb3VuZENvbG9yUHJvcGVydHkiLCJob21lU2NyZWVuSWNvbiIsInNob3dVbnNlbGVjdGVkSG9tZVNjcmVlbkljb25GcmFtZSIsIm5hdmlnYXRpb25CYXJJY29uIiwic2hvd1NjcmVlbkljb25GcmFtZUZvck5hdmlnYXRpb25CYXJGaWxsIiwibWF4RFQiLCJjcmVhdGVLZXlib2FyZEhlbHBOb2RlIiwiZGVzY3JpcHRpb25Db250ZW50IiwidGFuZGVtIiwiUkVRVUlSRUQiLCJ0YW5kZW1OYW1lU3VmZml4IiwiU0NSRUVOX1RBTkRFTV9OQU1FX1NVRkZJWCIsInBoZXRpb1R5cGUiLCJwaGV0aW9TdGF0ZSIsInBoZXRpb0ZlYXR1cmVkIiwiXyIsImluY2x1ZGVzIiwiaWNvbk5vZGUiLCJmaWxsIiwidmFsdWUiLCJtYXhJY29uV2lkdGhQcm9wb3J0aW9uIiwibWF4SWNvbkhlaWdodFByb3BvcnRpb24iLCJ2YWxpZGF0ZUljb25TaXplIiwibmFtZVByb3BlcnR5IiwiYWRkTGlua2VkRWxlbWVudCIsInRhbmRlbU5hbWUiLCJwZG9tRGlzcGxheU5hbWVQcm9wZXJ0eSIsImZpbGxJbiIsIl9tb2RlbCIsIl92aWV3IiwiYWN0aXZlUHJvcGVydHkiLCJjcmVhdGVUYW5kZW0iLCJwaGV0aW9SZWFkT25seSIsInBoZXRpb0RvY3VtZW50YXRpb24iLCJPUFRfT1VUIiwibGF6eUxpbmsiLCJQSEVUX0lPX0VOQUJMRUQiLCJpc1Zpc2libGUiLCJtb2RlbCIsInZpZXciLCJoYXNNb2RlbCIsImhhc1ZpZXciLCJyZXNldCIsImluaXRpYWxpemVNb2RlbCIsImluaXRpYWxpemVWaWV3Iiwic2ltTmFtZVByb3BlcnR5IiwiZGlzcGxheWVkU2ltTmFtZVByb3BlcnR5IiwibnVtYmVyT2ZTY3JlZW5zIiwiaXNIb21lU2NyZWVuIiwic2V0VmlzaWJsZSIsInBoZXQiLCJjaGlwcGVyIiwicXVlcnlQYXJhbWV0ZXJzIiwiZGV2IiwiYWRkQ2hpbGQiLCJkZXZDcmVhdGVMYXlvdXRCb3VuZHNOb2RlIiwibGF5b3V0Qm91bmRzIiwic2hvd1Zpc2libGVCb3VuZHMiLCJkZXZDcmVhdGVWaXNpYmxlQm91bmRzTm9kZSIsIm11bHRpbGluayIsImRpc3BsYXllZE5hbWUiLCJzaW1OYW1lIiwicGRvbURpc3BsYXlOYW1lIiwidGl0bGVTdHJpbmciLCJzY3JlZW5OYW1lIiwic2V0U2NyZWVuU3VtbWFyeUludHJvQW5kVGl0bGUiLCJwZG9tQXVkaXQiLCJpY29uIiwibWluaW11bVNpemUiLCJhc3BlY3RSYXRpbyIsImFjdHVhbEFzcGVjdFJhdGlvIiwiYm91bmRzIiwic3Ryb2tlIiwibGluZVdpZHRoIiwicGlja2FibGUiLCJzY3JlZW5WaWV3IiwicGF0aCIsInZpc2libGVCb3VuZHNQcm9wZXJ0eSIsImxpbmsiLCJ2aXNpYmxlQm91bmRzIiwic2hhcGUiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlNjcmVlbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxMy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBIFNjcmVlbiBpcyB0aGUgbGFyZ2VzdCBjaHVuayBvZiBhIHNpbXVsYXRpb24uIChKYXZhIHNpbXMgdXNlZCB0aGUgdGVybSBNb2R1bGUsIGJ1dCB0aGF0IHRlcm1cclxuICogaXMgdG9vIG92ZXJsb2FkZWQgdG8gdXNlIHdpdGggSmF2YVNjcmlwdCBhbmQgR2l0LilcclxuICpcclxuICogV2hlbiBjcmVhdGluZyBhIFNpbSwgU2NyZWVucyBhcmUgc3VwcGxpZWQgYXMgdGhlIGFyZ3VtZW50cy4gVGhleSBjYW4gYmUgc3BlY2lmaWVkIGFzIG9iamVjdCBsaXRlcmFscyBvciB0aHJvdWdoXHJcbiAqIGluc3RhbmNlcyBvZiB0aGlzIGNsYXNzLiBUaGlzIGNsYXNzIG1heSBjZW50cmFsaXplIGRlZmF1bHQgYmVoYXZpb3Igb3Igc3RhdGUgZm9yIFNjcmVlbnMgaW4gdGhlIGZ1dHVyZSwgYnV0IHJpZ2h0XHJcbiAqIG5vdyBpdCBvbmx5IGFsbG93cyB5b3UgdG8gY3JlYXRlIFNpbXMgd2l0aG91dCB1c2luZyBuYW1lZCBwYXJhbWV0ZXIgb2JqZWN0IGxpdGVyYWxzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBCb29sZWFuUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9Cb29sZWFuUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgRGVyaXZlZFByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvRGVyaXZlZFByb3BlcnR5LmpzJztcclxuaW1wb3J0IFRSZWFkT25seVByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBCb3VuZHMyIGZyb20gJy4uLy4uL2RvdC9qcy9Cb3VuZHMyLmpzJztcclxuaW1wb3J0IERpbWVuc2lvbjIgZnJvbSAnLi4vLi4vZG90L2pzL0RpbWVuc2lvbjIuanMnO1xyXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gJy4uLy4uL2tpdGUvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBTdHJpbmdVdGlscyBmcm9tICcuLi8uLi9waGV0Y29tbW9uL2pzL3V0aWwvU3RyaW5nVXRpbHMuanMnO1xyXG5pbXBvcnQgeyBDb2xvciwgTm9kZSwgUGF0aCwgUERPTVZhbHVlVHlwZSwgUHJvZmlsZUNvbG9yUHJvcGVydHksIFJlY3RhbmdsZSB9IGZyb20gJy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBQaGV0aW9PYmplY3QsIHsgUGhldGlvT2JqZWN0T3B0aW9ucyB9IGZyb20gJy4uLy4uL3RhbmRlbS9qcy9QaGV0aW9PYmplY3QuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgSU9UeXBlIGZyb20gJy4uLy4uL3RhbmRlbS9qcy90eXBlcy9JT1R5cGUuanMnO1xyXG5pbXBvcnQgUmVmZXJlbmNlSU8gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL3R5cGVzL1JlZmVyZW5jZUlPLmpzJztcclxuaW1wb3J0IGpvaXN0IGZyb20gJy4vam9pc3QuanMnO1xyXG5pbXBvcnQgSm9pc3RTdHJpbmdzIGZyb20gJy4vSm9pc3RTdHJpbmdzLmpzJztcclxuaW1wb3J0IFNjcmVlbkljb24gZnJvbSAnLi9TY3JlZW5JY29uLmpzJztcclxuaW1wb3J0IFNjcmVlblZpZXcgZnJvbSAnLi9TY3JlZW5WaWV3LmpzJztcclxuaW1wb3J0IFBpY2tSZXF1aXJlZCBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvUGlja1JlcXVpcmVkLmpzJztcclxuaW1wb3J0IEludGVudGlvbmFsQW55IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9JbnRlbnRpb25hbEFueS5qcyc7XHJcbmltcG9ydCBNdWx0aWxpbmsgZnJvbSAnLi4vLi4vYXhvbi9qcy9NdWx0aWxpbmsuanMnO1xyXG5pbXBvcnQgVE1vZGVsIGZyb20gJy4vVE1vZGVsLmpzJztcclxuaW1wb3J0IFBhdHRlcm5TdHJpbmdQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1BhdHRlcm5TdHJpbmdQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBQaGV0aW9Qcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1BoZXRpb1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IFN0cmljdE9taXQgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1N0cmljdE9taXQuanMnO1xyXG5cclxuY29uc3Qgc2NyZWVuTmFtZVBhdHRlcm5TdHJpbmdQcm9wZXJ0eSA9IEpvaXN0U3RyaW5ncy5hMTF5LnNjcmVlbk5hbWVQYXR0ZXJuU3RyaW5nUHJvcGVydHk7XHJcbmNvbnN0IHNjcmVlblNpbVBhdHRlcm5TdHJpbmdQcm9wZXJ0eSA9IEpvaXN0U3RyaW5ncy5hMTF5LnNjcmVlblNpbVBhdHRlcm5TdHJpbmdQcm9wZXJ0eTtcclxuY29uc3Qgc2ltU2NyZWVuU3RyaW5nUHJvcGVydHkgPSBKb2lzdFN0cmluZ3MuYTExeS5zaW1TY3JlZW5TdHJpbmdQcm9wZXJ0eTtcclxuXHJcbi8vIGNvbnN0YW50c1xyXG5jb25zdCBNSU5JTVVNX0hPTUVfU0NSRUVOX0lDT05fU0laRSA9IG5ldyBEaW1lbnNpb24yKCA1NDgsIDM3MyApO1xyXG5jb25zdCBNSU5JTVVNX05BVkJBUl9JQ09OX1NJWkUgPSBuZXcgRGltZW5zaW9uMiggMTQ3LCAxMDAgKTtcclxuY29uc3QgTkFWQkFSX0lDT05fQVNQRUNUX1JBVElPID0gTUlOSU1VTV9OQVZCQVJfSUNPTl9TSVpFLndpZHRoIC8gTUlOSU1VTV9OQVZCQVJfSUNPTl9TSVpFLmhlaWdodDtcclxuY29uc3QgSE9NRV9TQ1JFRU5fSUNPTl9BU1BFQ1RfUkFUSU8gPSBNSU5JTVVNX0hPTUVfU0NSRUVOX0lDT05fU0laRS53aWR0aCAvIE1JTklNVU1fSE9NRV9TQ1JFRU5fSUNPTl9TSVpFLmhlaWdodDtcclxuY29uc3QgSUNPTl9BU1BFQ1RfUkFUSU9fVE9MRVJBTkNFID0gNUUtMzsgLy8gaG93IGNsb3NlIHRvIHRoZSBpZGVhbCBhc3BlY3QgcmF0aW8gYW4gaWNvbiBtdXN0IGJlXHJcblxyXG4vLyBIb21lIHNjcmVlbiBhbmQgbmF2aWdhdGlvbiBiYXIgaWNvbnMgbXVzdCBoYXZlIHRoZSBzYW1lIGFzcGVjdCByYXRpbywgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9qb2lzdC9pc3N1ZXMvNzZcclxuYXNzZXJ0ICYmIGFzc2VydCggTWF0aC5hYnMoIEhPTUVfU0NSRUVOX0lDT05fQVNQRUNUX1JBVElPIC0gSE9NRV9TQ1JFRU5fSUNPTl9BU1BFQ1RfUkFUSU8gKSA8IElDT05fQVNQRUNUX1JBVElPX1RPTEVSQU5DRSxcclxuICAnTUlOSU1VTV9IT01FX1NDUkVFTl9JQ09OX1NJWkUgYW5kIE1JTklNVU1fTkFWQkFSX0lDT05fU0laRSBtdXN0IGhhdmUgdGhlIHNhbWUgYXNwZWN0IHJhdGlvJyApO1xyXG5cclxuLy8gRG9jdW1lbnRhdGlvbiBpcyBieSB0aGUgZGVmYXVsdHNcclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuICBuYW1lPzogUGhldGlvUHJvcGVydHk8c3RyaW5nPiB8IG51bGw7XHJcbiAgaW5zdHJ1bWVudE5hbWVQcm9wZXJ0eT86IGJvb2xlYW47XHJcblxyXG4gIC8vIEl0IHdvdWxkIGJlIHByZWZlcmFibGUgdG8gc3VwcG9ydCBQcm9wZXJ0eTxDb2xvciB8IHN0cmluZz4gc29sZWx5LCBidXQgbWFueSBzdWJ0eXBlcyBhcmUgaGFyZGNvZGVkIHRvIGJlIENvbG9yIG9ubHlcclxuICAvLyBvciBzdHJpbmcgb25seSwgc28gd2Ugc3VwcG9ydCB0aGlzIHBvbHltb3JwaGljIGZvcm1cclxuICBiYWNrZ3JvdW5kQ29sb3JQcm9wZXJ0eT86IFByb3BlcnR5PENvbG9yIHwgc3RyaW5nPiB8IFByb3BlcnR5PENvbG9yPiB8IFByb3BlcnR5PHN0cmluZz4gfCBQcm9maWxlQ29sb3JQcm9wZXJ0eTtcclxuICBob21lU2NyZWVuSWNvbj86IFNjcmVlbkljb24gfCBudWxsO1xyXG4gIHNob3dVbnNlbGVjdGVkSG9tZVNjcmVlbkljb25GcmFtZT86IGJvb2xlYW47XHJcbiAgbmF2aWdhdGlvbkJhckljb24/OiBTY3JlZW5JY29uIHwgbnVsbDtcclxuICBzaG93U2NyZWVuSWNvbkZyYW1lRm9yTmF2aWdhdGlvbkJhckZpbGw/OiBzdHJpbmcgfCBudWxsO1xyXG4gIG1heERUPzogbnVtYmVyO1xyXG4gIGNyZWF0ZUtleWJvYXJkSGVscE5vZGU/OiBudWxsIHwgKCAoIHRhbmRlbTogVGFuZGVtICkgPT4gTm9kZSApO1xyXG4gIGRlc2NyaXB0aW9uQ29udGVudD86IFBET01WYWx1ZVR5cGUgfCBudWxsO1xyXG59O1xyXG5leHBvcnQgdHlwZSBTY3JlZW5PcHRpb25zID0gU2VsZk9wdGlvbnMgJlxyXG4gIFN0cmljdE9taXQ8UGhldGlvT2JqZWN0T3B0aW9ucywgJ3RhbmRlbU5hbWVTdWZmaXgnPiAmIC8vIFRhbmRlbS5Sb290VGFuZGVtLmNyZWF0ZVRhbmRlbSByZXF1aXJlcyB0aGF0IHRoZSBzdWZmaXggaXMgVGFuZGVtLlNDUkVFTl9UQU5ERU1fTkFNRV9TVUZGSVguXHJcbiAgUGlja1JlcXVpcmVkPFBoZXRpb09iamVjdE9wdGlvbnMsICd0YW5kZW0nPjtcclxuXHJcbi8vIEBqb2lzdC1pbnRlcm5hbCAtIFRoaXMgdHlwZSBpcyB1c2VzIEludGVudGlvbmFsQW55IHRvIGJyZWFrIHRoZSBjb250cmF2YXJpYW5jZSBkZXBlbmRlbmN5IHRoYXQgdGhlIGNyZWF0ZVZpZXcgZnVuY3Rpb25cclxuLy8gaGFzIG9uIFNjcmVlbi4gSWRlYWxseSB3ZSBjb3VsZCB1c2UgVE1vZGVsIGluc3RlYWQsIGJ1dCB0aGF0IHdvdWxkIGludm9sdmUgYSByZXdyaXRlIG9mIGhvdyB3ZSBwYXNzIGNsb3N1cmVzIGludG9cclxuLy8gU2NyZWVuIGluc3RlYWQgb2YgdGhlIGFscmVhZHkgY3JlYXRlZCBNb2RlbC9WaWV3IHRoZW1zZWx2ZXMuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzc4MyNpc3N1ZWNvbW1lbnQtMTIzMTAxNzIxM1xyXG5leHBvcnQgdHlwZSBBbnlTY3JlZW4gPSBTY3JlZW48SW50ZW50aW9uYWxBbnksIFNjcmVlblZpZXc+O1xyXG5cclxuLy8gUGFyYW1ldGVyaXplZCBvbiBNPU1vZGVsIGFuZCBWPVZpZXdcclxuY2xhc3MgU2NyZWVuPE0gZXh0ZW5kcyBUTW9kZWwsIFYgZXh0ZW5kcyBTY3JlZW5WaWV3PiBleHRlbmRzIFBoZXRpb09iamVjdCB7XHJcblxyXG4gIHB1YmxpYyBiYWNrZ3JvdW5kQ29sb3JQcm9wZXJ0eTogUHJvcGVydHk8Q29sb3I+IHwgUHJvcGVydHk8c3RyaW5nPiB8IFByb3BlcnR5PENvbG9yIHwgc3RyaW5nPjtcclxuXHJcbiAgcHVibGljIHJlYWRvbmx5IG1heERUOiBudW1iZXI7XHJcbiAgcHVibGljIHJlYWRvbmx5IGFjdGl2ZVByb3BlcnR5OiBCb29sZWFuUHJvcGVydHk7XHJcbiAgcHVibGljIHJlYWRvbmx5IGRlc2NyaXB0aW9uQ29udGVudDogUERPTVZhbHVlVHlwZTtcclxuICBwdWJsaWMgcmVhZG9ubHkgbmFtZVByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxzdHJpbmc+O1xyXG5cclxuICBwdWJsaWMgcmVhZG9ubHkgc2hvd1NjcmVlbkljb25GcmFtZUZvck5hdmlnYXRpb25CYXJGaWxsOiBzdHJpbmcgfCBudWxsO1xyXG4gIHB1YmxpYyByZWFkb25seSBob21lU2NyZWVuSWNvbjogU2NyZWVuSWNvbiB8IG51bGw7XHJcbiAgcHVibGljIG5hdmlnYXRpb25CYXJJY29uOiBTY3JlZW5JY29uIHwgbnVsbDtcclxuICBwdWJsaWMgcmVhZG9ubHkgc2hvd1Vuc2VsZWN0ZWRIb21lU2NyZWVuSWNvbkZyYW1lOiBib29sZWFuO1xyXG4gIHB1YmxpYyByZWFkb25seSBjcmVhdGVLZXlib2FyZEhlbHBOb2RlOiBudWxsIHwgKCAoIHRhbmRlbTogVGFuZGVtICkgPT4gTm9kZSApOyAvLyBqb2lzdC1pbnRlcm5hbFxyXG4gIHB1YmxpYyByZWFkb25seSBwZG9tRGlzcGxheU5hbWVQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nPjtcclxuICBwcml2YXRlIHJlYWRvbmx5IGNyZWF0ZU1vZGVsOiAoKSA9PiBNO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgY3JlYXRlVmlldzogKCBtb2RlbDogTSApID0+IFY7XHJcbiAgcHJpdmF0ZSBfbW9kZWw6IE0gfCBudWxsO1xyXG4gIHByaXZhdGUgX3ZpZXc6IFYgfCBudWxsO1xyXG5cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IEhPTUVfU0NSRUVOX0lDT05fQVNQRUNUX1JBVElPID0gSE9NRV9TQ1JFRU5fSUNPTl9BU1BFQ1RfUkFUSU87XHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBNSU5JTVVNX0hPTUVfU0NSRUVOX0lDT05fU0laRSA9IE1JTklNVU1fSE9NRV9TQ1JFRU5fSUNPTl9TSVpFO1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgTUlOSU1VTV9OQVZCQVJfSUNPTl9TSVpFID0gTUlOSU1VTV9OQVZCQVJfSUNPTl9TSVpFO1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgU2NyZWVuSU8gPSBuZXcgSU9UeXBlKCAnU2NyZWVuSU8nLCB7XHJcbiAgICB2YWx1ZVR5cGU6IFNjcmVlbixcclxuICAgIHN1cGVydHlwZTogUmVmZXJlbmNlSU8oIElPVHlwZS5PYmplY3RJTyApLFxyXG4gICAgZG9jdW1lbnRhdGlvbjogJ1NlY3Rpb24gb2YgYSBzaW11bGF0aW9uIHdoaWNoIGhhcyBpdHMgb3duIG1vZGVsIGFuZCB2aWV3LidcclxuICB9ICk7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggY3JlYXRlTW9kZWw6ICgpID0+IE0sIGNyZWF0ZVZpZXc6ICggbW9kZWw6IE0gKSA9PiBWLCBwcm92aWRlZE9wdGlvbnM6IFNjcmVlbk9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxTY3JlZW5PcHRpb25zLCBTZWxmT3B0aW9ucywgUGhldGlvT2JqZWN0T3B0aW9ucz4oKSgge1xyXG5cclxuICAgICAgLy8ge1RQcm9wZXJ0eTxzdHJpbmc+fG51bGx9IG5hbWUgb2YgdGhlIHNpbSwgYXMgZGlzcGxheWVkIHRvIHRoZSB1c2VyLlxyXG4gICAgICAvLyBGb3Igc2luZ2xlLXNjcmVlbiBzaW1zLCB0aGVyZSBpcyBubyBob21lIHNjcmVlbiBvciBuYXZpZ2F0aW9uIGJhciwgYW5kIG51bGwgaXMgT0suXHJcbiAgICAgIC8vIEZvciBtdWx0aS1zY3JlZW4gc2ltcywgdGhpcyBtdXN0IGJlIHByb3ZpZGVkLlxyXG4gICAgICBuYW1lOiBudWxsLFxyXG5cclxuICAgICAgLy8ge2Jvb2xlYW59IHdoZXRoZXIgbmFtZVByb3BlcnR5IHNob3VsZCBiZSBpbnN0cnVtZW50ZWQuIHNlZSB1c2FnZSBmb3IgZXhwbGFuYXRpb24gb2YgaXRzIG5lY2Vzc2l0eS5cclxuICAgICAgaW5zdHJ1bWVudE5hbWVQcm9wZXJ0eTogdHJ1ZSxcclxuXHJcbiAgICAgIGJhY2tncm91bmRDb2xvclByb3BlcnR5OiBuZXcgUHJvcGVydHk8Q29sb3IgfCBzdHJpbmc+KCAnd2hpdGUnICksXHJcblxyXG4gICAgICAvLyB7Tm9kZXxudWxsfSBpY29uIHNob3duIG9uIHRoZSBob21lIHNjcmVlbi4gSWYgbnVsbCwgdGhlbiBhIGRlZmF1bHQgaXMgY3JlYXRlZC5cclxuICAgICAgLy8gRm9yIHNpbmdsZS1zY3JlZW4gc2ltcywgdGhlcmUgaXMgbm8gaG9tZSBzY3JlZW4gYW5kIHRoZSBkZWZhdWx0IGlzIE9LLlxyXG4gICAgICBob21lU2NyZWVuSWNvbjogbnVsbCxcclxuXHJcbiAgICAgIC8vIHtib29sZWFufSB3aGV0aGVyIHRvIGRyYXcgYSBmcmFtZSBhcm91bmQgdGhlIHNtYWxsIGljb25zIG9uIGhvbWUgc2NyZWVuXHJcbiAgICAgIHNob3dVbnNlbGVjdGVkSG9tZVNjcmVlbkljb25GcmFtZTogZmFsc2UsXHJcblxyXG4gICAgICAvLyB7Tm9kZXxudWxsfSBpY29uIHNob3duIGluIHRoZSBuYXZpZ2F0aW9uIGJhci4gSWYgbnVsbCwgdGhlbiB0aGUgaG9tZSBzY3JlZW4gaWNvbiB3aWxsIGJlIHVzZWQsIHNjYWxlZCB0byBmaXQuXHJcbiAgICAgIG5hdmlnYXRpb25CYXJJY29uOiBudWxsLFxyXG5cclxuICAgICAgLy8ge3N0cmluZ3xudWxsfSBzaG93IGEgZnJhbWUgYXJvdW5kIHRoZSBzY3JlZW4gaWNvbiB3aGVuIHRoZSBuYXZiYXIncyBiYWNrZ3JvdW5kIGZpbGwgaXMgdGhpcyBjb2xvclxyXG4gICAgICAvLyAnYmxhY2snLCAnd2hpdGUnLCBvciBudWxsIChubyBmcmFtZSlcclxuICAgICAgc2hvd1NjcmVlbkljb25GcmFtZUZvck5hdmlnYXRpb25CYXJGaWxsOiBudWxsLFxyXG5cclxuICAgICAgLy8gZHQgY2FwIGluIHNlY29uZHMsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzEzMFxyXG4gICAgICBtYXhEVDogMC41LFxyXG5cclxuICAgICAgLy8gYSB7bnVsbHxmdW5jdGlvbigpOk5vZGV9IHBsYWNlZCBpbnRvIHRoZSBrZXlib2FyZCBoZWxwIGRpYWxvZyB0aGF0IGNhbiBiZSBvcGVuZWQgZnJvbSB0aGUgbmF2aWdhdGlvbiBiYXIgd2hlbiB0aGlzXHJcbiAgICAgIC8vIHNjcmVlbiBpcyBzZWxlY3RlZFxyXG4gICAgICBjcmVhdGVLZXlib2FyZEhlbHBOb2RlOiBudWxsLFxyXG5cclxuICAgICAgLy8gcGRvbS92b2ljaW5nIC0gVGhlIGRlc2NyaXB0aW9uIHRoYXQgaXMgdXNlZCB3aGVuIGludGVyYWN0aW5nIHdpdGggc2NyZWVuIGljb25zL2J1dHRvbnMgaW4gam9pc3QgKGFuZCBob21lIHNjcmVlbikuXHJcbiAgICAgIC8vIFRoaXMgaXMgb2Z0ZW4gYSBmdWxsIGJ1dCBzaG9ydCBzZW50ZW5jZSB3aXRoIGEgcGVyaW9kIGF0IHRoZSBlbmQgb2YgaXQuIFRoaXMgaXMgYWxzbyB1c2VkIGZvciB2b2ljaW5nIHRoaXMgc2NyZWVuXHJcbiAgICAgIC8vIGluIHRoZSBob21lIHNjcmVlbi5cclxuICAgICAgZGVzY3JpcHRpb25Db250ZW50OiBudWxsLFxyXG5cclxuICAgICAgLy8gcGhldC1pb1xyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIGluY2x1ZGUgYSBkZWZhdWx0IGZvciB1bi1pbnN0cnVtZW50ZWQsIEphdmFTY3JpcHQgc2ltc1xyXG4gICAgICB0YW5kZW06IFRhbmRlbS5SRVFVSVJFRCxcclxuICAgICAgdGFuZGVtTmFtZVN1ZmZpeDogVGFuZGVtLlNDUkVFTl9UQU5ERU1fTkFNRV9TVUZGSVgsXHJcbiAgICAgIHBoZXRpb1R5cGU6IFNjcmVlbi5TY3JlZW5JTyxcclxuICAgICAgcGhldGlvU3RhdGU6IGZhbHNlLFxyXG4gICAgICBwaGV0aW9GZWF0dXJlZDogdHJ1ZVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggXy5pbmNsdWRlcyggWyAnYmxhY2snLCAnd2hpdGUnLCBudWxsIF0sIG9wdGlvbnMuc2hvd1NjcmVlbkljb25GcmFtZUZvck5hdmlnYXRpb25CYXJGaWxsICksXHJcbiAgICAgIGBpbnZhbGlkIHNob3dTY3JlZW5JY29uRnJhbWVGb3JOYXZpZ2F0aW9uQmFyRmlsbDogJHtvcHRpb25zLnNob3dTY3JlZW5JY29uRnJhbWVGb3JOYXZpZ2F0aW9uQmFyRmlsbH1gICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIG9wdGlvbnMubmFtZSAhPT0gJ3N0cmluZycsICdTY3JlZW4gbm8gbG9uZ2VyIHN1cHBvcnRzIGEgbmFtZSBzdHJpbmcsIGluc3RlYWQgaXQgc2hvdWxkIGJlIGEgUHJvcGVydHk8c3RyaW5nPicgKTtcclxuXHJcbiAgICBzdXBlciggb3B0aW9ucyApO1xyXG5cclxuICAgIC8vIENyZWF0ZSBhIGRlZmF1bHQgaG9tZVNjcmVlbkljb24sIHVzaW5nIHRoZSBTY3JlZW4ncyBiYWNrZ3JvdW5kIGNvbG9yXHJcbiAgICBpZiAoICFvcHRpb25zLmhvbWVTY3JlZW5JY29uICkge1xyXG4gICAgICBjb25zdCBpY29uTm9kZSA9IG5ldyBSZWN0YW5nbGUoIDAsIDAsIE1JTklNVU1fSE9NRV9TQ1JFRU5fSUNPTl9TSVpFLndpZHRoLCBNSU5JTVVNX0hPTUVfU0NSRUVOX0lDT05fU0laRS5oZWlnaHQgKTtcclxuICAgICAgb3B0aW9ucy5ob21lU2NyZWVuSWNvbiA9IG5ldyBTY3JlZW5JY29uKCBpY29uTm9kZSwge1xyXG4gICAgICAgIGZpbGw6IG9wdGlvbnMuYmFja2dyb3VuZENvbG9yUHJvcGVydHkudmFsdWUsXHJcbiAgICAgICAgbWF4SWNvbldpZHRoUHJvcG9ydGlvbjogMSxcclxuICAgICAgICBtYXhJY29uSGVpZ2h0UHJvcG9ydGlvbjogMVxyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gbmF2aWdhdGlvbkJhckljb24gZGVmYXVsdHMgdG8gaG9tZVNjcmVlbkljb24sIGFuZCB3aWxsIGJlIHNjYWxlZCBkb3duXHJcbiAgICBpZiAoICFvcHRpb25zLm5hdmlnYXRpb25CYXJJY29uICkge1xyXG4gICAgICBvcHRpb25zLm5hdmlnYXRpb25CYXJJY29uID0gb3B0aW9ucy5ob21lU2NyZWVuSWNvbjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBWYWxpZGF0ZSBpY29uIHNpemVzXHJcbiAgICB2YWxpZGF0ZUljb25TaXplKCBvcHRpb25zLmhvbWVTY3JlZW5JY29uLCBNSU5JTVVNX0hPTUVfU0NSRUVOX0lDT05fU0laRSwgSE9NRV9TQ1JFRU5fSUNPTl9BU1BFQ1RfUkFUSU8sICdob21lU2NyZWVuSWNvbicgKTtcclxuICAgIHZhbGlkYXRlSWNvblNpemUoIG9wdGlvbnMubmF2aWdhdGlvbkJhckljb24sIE1JTklNVU1fTkFWQkFSX0lDT05fU0laRSwgTkFWQkFSX0lDT05fQVNQRUNUX1JBVElPLCAnbmF2aWdhdGlvbkJhckljb24nICk7XHJcblxyXG4gICAgdGhpcy5iYWNrZ3JvdW5kQ29sb3JQcm9wZXJ0eSA9IG9wdGlvbnMuYmFja2dyb3VuZENvbG9yUHJvcGVydHk7XHJcblxyXG4gICAgaWYgKCBvcHRpb25zLm5hbWUgKSB7XHJcbiAgICAgIHRoaXMubmFtZVByb3BlcnR5ID0gb3B0aW9ucy5uYW1lO1xyXG5cclxuICAgICAgLy8gRG9uJ3QgaW5zdHJ1bWVudCB0aGlzLm5hbWVQcm9wZXJ0eSBpZiBvcHRpb25zLmluc3RydW1lbnROYW1lUHJvcGVydHkgaXMgZmFsc2Ugb3IgaWYgb3B0aW9ucy5uYW1lIGlzIG5vdCBwcm92aWRlZC5cclxuICAgICAgLy8gVGhpcyBhZGRpdGlvbmFsIG9wdGlvbiBpcyBuZWVkZWQgYmVjYXVzZSBkZXNpZ25lcnMgcmVxdWVzdGVkIHRoZSBhYmlsaXR5IHRvIG5vdCBpbnN0cnVtZW50IGEgc2NyZWVuJ3MgbmFtZVByb3BlcnR5XHJcbiAgICAgIC8vIGV2ZW4gaWYgaXQgaGFzIGEgbmFtZSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9qb2lzdC9pc3N1ZXMvNjI3IGFuZCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzYyOS5cclxuICAgICAgb3B0aW9ucy5pbnN0cnVtZW50TmFtZVByb3BlcnR5ICYmIHRoaXMuYWRkTGlua2VkRWxlbWVudCggb3B0aW9ucy5uYW1lLCB7XHJcbiAgICAgICAgdGFuZGVtTmFtZTogJ25hbWVQcm9wZXJ0eSdcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcblxyXG4gICAgICAvLyBtYXkgYmUgbnVsbCBmb3Igc2luZ2xlLXNjcmVlbiBzaW11bGF0aW9ucywganVzdCBtYWtlIGl0IGJsYW5rXHJcbiAgICAgIHRoaXMubmFtZVByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCAnJyApO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuaG9tZVNjcmVlbkljb24gPSBvcHRpb25zLmhvbWVTY3JlZW5JY29uO1xyXG4gICAgdGhpcy5uYXZpZ2F0aW9uQmFySWNvbiA9IG9wdGlvbnMubmF2aWdhdGlvbkJhckljb247XHJcbiAgICB0aGlzLnNob3dVbnNlbGVjdGVkSG9tZVNjcmVlbkljb25GcmFtZSA9IG9wdGlvbnMuc2hvd1Vuc2VsZWN0ZWRIb21lU2NyZWVuSWNvbkZyYW1lO1xyXG4gICAgdGhpcy5zaG93U2NyZWVuSWNvbkZyYW1lRm9yTmF2aWdhdGlvbkJhckZpbGwgPSBvcHRpb25zLnNob3dTY3JlZW5JY29uRnJhbWVGb3JOYXZpZ2F0aW9uQmFyRmlsbDtcclxuICAgIHRoaXMuY3JlYXRlS2V5Ym9hcmRIZWxwTm9kZSA9IG9wdGlvbnMuY3JlYXRlS2V5Ym9hcmRIZWxwTm9kZTtcclxuXHJcbiAgICAvLyBtYXkgYmUgbnVsbCBmb3Igc2luZ2xlLXNjcmVlbiBzaW11bGF0aW9uc1xyXG4gICAgdGhpcy5wZG9tRGlzcGxheU5hbWVQcm9wZXJ0eSA9IG5ldyBEZXJpdmVkUHJvcGVydHkoIFsgdGhpcy5uYW1lUHJvcGVydHksIHNjcmVlbk5hbWVQYXR0ZXJuU3RyaW5nUHJvcGVydHkgXSwgbmFtZSA9PiB7XHJcbiAgICAgIHJldHVybiBuYW1lID09PSBudWxsID8gJycgOiBTdHJpbmdVdGlscy5maWxsSW4oIHNjcmVlbk5hbWVQYXR0ZXJuU3RyaW5nUHJvcGVydHksIHtcclxuICAgICAgICBuYW1lOiBuYW1lXHJcbiAgICAgIH0gKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLm1heERUID0gb3B0aW9ucy5tYXhEVDtcclxuXHJcbiAgICB0aGlzLmNyZWF0ZU1vZGVsID0gY3JlYXRlTW9kZWw7XHJcbiAgICB0aGlzLmNyZWF0ZVZpZXcgPSBjcmVhdGVWaWV3O1xyXG5cclxuICAgIC8vIENvbnN0cnVjdGlvbiBvZiB0aGUgbW9kZWwgYW5kIHZpZXcgYXJlIGRlbGF5ZWQgYW5kIGNvbnRyb2xsZWQgdG8gZW5hYmxlIGZlYXR1cmVzIGxpa2VcclxuICAgIC8vIGEpIGZhc3RlciBsb2FkaW5nIHdoZW4gb25seSBsb2FkaW5nIGNlcnRhaW4gc2NyZWVuc1xyXG4gICAgLy8gYikgc2hvd2luZyBhIGxvYWRpbmcgcHJvZ3Jlc3MgYmFyIDxub3QgaW1wbGVtZW50ZWQ+XHJcbiAgICB0aGlzLl9tb2RlbCA9IG51bGw7XHJcbiAgICB0aGlzLl92aWV3ID0gbnVsbDtcclxuXHJcbiAgICAvLyBJbmRpY2F0ZXMgd2hldGhlciB0aGUgU2NyZWVuIGlzIGFjdGl2ZS4gQ2xpZW50cyBjYW4gcmVhZCB0aGlzLCBqb2lzdCBzZXRzIGl0LlxyXG4gICAgLy8gVG8gcHJldmVudCBwb3RlbnRpYWwgdmlzdWFsIGdsaXRjaGVzLCB0aGUgdmFsdWUgc2hvdWxkIGNoYW5nZSBvbmx5IHdoaWxlIHRoZSBzY3JlZW4ncyB2aWV3IGlzIGludmlzaWJsZS5cclxuICAgIC8vIFRoYXQgaXM6IHRyYW5zaXRpb25zIGZyb20gZmFsc2UgdG8gdHJ1ZSBiZWZvcmUgYSBTY3JlZW4gYmVjb21lcyB2aXNpYmxlLCBhbmQgZnJvbSB0cnVlIHRvIGZhbHNlIGFmdGVyIGEgU2NyZWVuIGJlY29tZXMgaW52aXNpYmxlLlxyXG4gICAgdGhpcy5hY3RpdmVQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIHRydWUsIHtcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdhY3RpdmVQcm9wZXJ0eScgKSxcclxuICAgICAgcGhldGlvUmVhZE9ubHk6IHRydWUsXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdJbmRpY2F0ZXMgd2hldGhlciB0aGUgc2NyZWVuIGlzIGN1cnJlbnRseSBkaXNwbGF5ZWQgaW4gdGhlIHNpbXVsYXRpb24uICBGb3Igc2luZ2xlLXNjcmVlbiAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3NpbXVsYXRpb25zLCB0aGVyZSBpcyBvbmx5IG9uZSBzY3JlZW4gYW5kIGl0IGlzIGFsd2F5cyBhY3RpdmUuJ1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIFVzZWQgdG8gc2V0IHRoZSBTY3JlZW5WaWV3J3MgZGVzY3JpcHRpb25Db250ZW50LiBUaGlzIGlzIGEgYml0IG9mIGEgbWlzbm9tZXIgYmVjYXVzZSBTY3JlZW4gaXMgbm90IGEgTm9kZVxyXG4gICAgLy8gc3VidHlwZSwgc28gdGhpcyBpcyBhIHZhbHVlIHByb3BlcnR5IHJhdGhlciB0aGFuIGEgc2V0dGVyLlxyXG4gICAgdGhpcy5kZXNjcmlwdGlvbkNvbnRlbnQgPSAnJztcclxuICAgIGlmICggb3B0aW9ucy5kZXNjcmlwdGlvbkNvbnRlbnQgKSB7XHJcbiAgICAgIHRoaXMuZGVzY3JpcHRpb25Db250ZW50ID0gb3B0aW9ucy5kZXNjcmlwdGlvbkNvbnRlbnQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggdGhpcy5uYW1lUHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgIHRoaXMuZGVzY3JpcHRpb25Db250ZW50ID0gbmV3IFBhdHRlcm5TdHJpbmdQcm9wZXJ0eSggc2NyZWVuTmFtZVBhdHRlcm5TdHJpbmdQcm9wZXJ0eSwge1xyXG4gICAgICAgIG5hbWU6IHRoaXMubmFtZVByb3BlcnR5XHJcbiAgICAgIH0sIHsgdGFuZGVtOiBUYW5kZW0uT1BUX09VVCB9ICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy5kZXNjcmlwdGlvbkNvbnRlbnQgPSBzaW1TY3JlZW5TdHJpbmdQcm9wZXJ0eTsgLy8gZmFsbCBiYWNrIG9uIGdlbmVyaWMgbmFtZVxyXG4gICAgfVxyXG5cclxuICAgIGFzc2VydCAmJiB0aGlzLmFjdGl2ZVByb3BlcnR5LmxhenlMaW5rKCAoKSA9PiB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX3ZpZXcsICdpc0FjdGl2ZSBzaG91bGQgbm90IGNoYW5nZSBiZWZvcmUgdGhlIFNjcmVlbiB2aWV3IGhhcyBiZWVuIGluaXRpYWxpemVkJyApO1xyXG5cclxuICAgICAgLy8gSW4gcGhldC1pbyBtb2RlLCB0aGUgc3RhdGUgb2YgYSBzaW0gY2FuIGJlIHNldCB3aXRob3V0IGEgZGV0ZXJtaW5pc3RpYyBvcmRlci4gVGhlIGFjdGl2ZVByb3BlcnR5IGNvdWxkIGJlXHJcbiAgICAgIC8vIGNoYW5nZWQgYmVmb3JlIHRoZSB2aWV3J3MgdmlzaWJpbGl0eSBpcyBzZXQuXHJcbiAgICAgIGlmICggIVRhbmRlbS5QSEVUX0lPX0VOQUJMRUQgKSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMuX3ZpZXchLmlzVmlzaWJsZSgpLCAnaXNBY3RpdmUgc2hvdWxkIG5vdCBjaGFuZ2Ugd2hpbGUgdGhlIFNjcmVlbiB2aWV3IGlzIHZpc2libGUnICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIC8vIFJldHVybnMgdGhlIG1vZGVsIChpZiBpdCBoYXMgYmVlbiBjb25zdHJ1Y3RlZClcclxuICBwdWJsaWMgZ2V0IG1vZGVsKCk6IE0ge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fbW9kZWwsICdNb2RlbCBoYXMgbm90IHlldCBiZWVuIGNvbnN0cnVjdGVkJyApO1xyXG4gICAgcmV0dXJuIHRoaXMuX21vZGVsITtcclxuICB9XHJcblxyXG4gIC8vIFJldHVybnMgdGhlIHZpZXcgKGlmIGl0IGhhcyBiZWVuIGNvbnN0cnVjdGVkKVxyXG4gIHB1YmxpYyBnZXQgdmlldygpOiBWIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX3ZpZXcsICdWaWV3IGhhcyBub3QgeWV0IGJlZW4gY29uc3RydWN0ZWQnICk7XHJcbiAgICByZXR1cm4gdGhpcy5fdmlldyE7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaGFzTW9kZWwoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gISF0aGlzLl9tb2RlbDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBoYXNWaWV3KCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuICEhdGhpcy5fdmlldztcclxuICB9XHJcblxyXG4gIHB1YmxpYyByZXNldCgpOiB2b2lkIHtcclxuXHJcbiAgICAvLyBCYWNrZ3JvdW5kIGNvbG9yIG5vdCByZXNldCwgYXMgaXQncyBhIHJlc3BvbnNpYmlsaXR5IG9mIHRoZSBjb2RlIHRoYXQgY2hhbmdlcyB0aGUgcHJvcGVydHlcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemUgdGhlIG1vZGVsLlxyXG4gICAqIChqb2lzdC1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgaW5pdGlhbGl6ZU1vZGVsKCk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fbW9kZWwgPT09IG51bGwsICd0aGVyZSB3YXMgYWxyZWFkeSBhIG1vZGVsJyApO1xyXG4gICAgdGhpcy5fbW9kZWwgPSB0aGlzLmNyZWF0ZU1vZGVsKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplIHRoZSB2aWV3LlxyXG4gICAqIChqb2lzdC1pbnRlcm5hbClcclxuICAgKiBAcGFyYW0gc2ltTmFtZVByb3BlcnR5IC0gVGhlIFByb3BlcnR5IG9mIHRoZSBuYW1lIG9mIHRoZSBzaW0sIHVzZWQgZm9yIGExMXkuXHJcbiAgICogQHBhcmFtIGRpc3BsYXllZFNpbU5hbWVQcm9wZXJ0eSAtIFRoZSBQcm9wZXJ0eSBvZiB0aGUgZGlzcGxheSBuYW1lIG9mIHRoZSBzaW0sIHVzZWQgZm9yIGExMXkuIENvdWxkIGNoYW5nZSBiYXNlZCBvbiBzY3JlZW4uXHJcbiAgICogQHBhcmFtIG51bWJlck9mU2NyZWVucyAtIHRoZSBudW1iZXIgb2Ygc2NyZWVucyBpbiB0aGUgc2ltIHRoaXMgcnVudGltZSAoY291bGQgY2hhbmdlIHdpdGggYD9zY3JlZW5zPS4uLmAuXHJcbiAgICogQHBhcmFtIGlzSG9tZVNjcmVlbiAtIGlmIHRoaXMgc2NyZWVuIGlzIHRoZSBob21lIHNjcmVlbi5cclxuICAgKi9cclxuICBwdWJsaWMgaW5pdGlhbGl6ZVZpZXcoIHNpbU5hbWVQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nPiwgZGlzcGxheWVkU2ltTmFtZVByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxzdHJpbmc+LCBudW1iZXJPZlNjcmVlbnM6IG51bWJlciwgaXNIb21lU2NyZWVuOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fdmlldyA9PT0gbnVsbCwgJ3RoZXJlIHdhcyBhbHJlYWR5IGEgdmlldycgKTtcclxuICAgIHRoaXMuX3ZpZXcgPSB0aGlzLmNyZWF0ZVZpZXcoIHRoaXMubW9kZWwgKTtcclxuICAgIHRoaXMuX3ZpZXcuc2V0VmlzaWJsZSggZmFsc2UgKTsgLy8gYSBTY3JlZW4gaXMgaW52aXNpYmxlIHVudGlsIHNlbGVjdGVkXHJcblxyXG4gICAgLy8gU2hvdyB0aGUgaG9tZSBzY3JlZW4ncyBsYXlvdXRCb3VuZHNcclxuICAgIGlmICggcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5kZXYgKSB7XHJcbiAgICAgIHRoaXMuX3ZpZXcuYWRkQ2hpbGQoIGRldkNyZWF0ZUxheW91dEJvdW5kc05vZGUoIHRoaXMuX3ZpZXcubGF5b3V0Qm91bmRzICkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGb3IgZGVidWdnaW5nLCBtYWtlIGl0IHBvc3NpYmxlIHRvIHNlZSB0aGUgdmlzaWJsZUJvdW5kcy4gIFRoaXMgaXMgbm90IGluY2x1ZGVkIHdpdGggP2RldiBzaW5jZVxyXG4gICAgLy8gaXQgc2hvdWxkIGp1c3QgYmUgZXF1YWwgdG8gd2hhdCB5b3Ugc2VlLlxyXG4gICAgaWYgKCBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLnNob3dWaXNpYmxlQm91bmRzICkge1xyXG4gICAgICB0aGlzLl92aWV3LmFkZENoaWxkKCBkZXZDcmVhdGVWaXNpYmxlQm91bmRzTm9kZSggdGhpcy5fdmlldyApICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2V0IHRoZSBhY2Nlc3NpYmxlIGxhYmVsIGZvciB0aGUgc2NyZWVuLlxyXG4gICAgTXVsdGlsaW5rLm11bHRpbGluayggWyBkaXNwbGF5ZWRTaW1OYW1lUHJvcGVydHksIHNpbU5hbWVQcm9wZXJ0eSwgdGhpcy5wZG9tRGlzcGxheU5hbWVQcm9wZXJ0eSBdLFxyXG4gICAgICAoIGRpc3BsYXllZE5hbWUsIHNpbU5hbWUsIHBkb21EaXNwbGF5TmFtZSApID0+IHtcclxuXHJcbiAgICAgICAgbGV0IHRpdGxlU3RyaW5nO1xyXG5cclxuICAgICAgICAvLyBTaW5nbGUgc2NyZWVuIHNpbXMgZG9uJ3QgbmVlZCBzY3JlZW4gbmFtZXMsIGluc3RlYWQganVzdCBzaG93IHRoZSB0aXRsZSBvZiB0aGUgc2ltLlxyXG4gICAgICAgIC8vIFVzaW5nIHRvdGFsIHNjcmVlbnMgZm9yIHNpbSBicmVha3MgbW9kdWxhcml0eSBhIGJpdCwgYnV0IGl0IGFsc28gaXMgbmVlZGVkIGFzIHRoYXQgcGFyYW1ldGVyIGNoYW5nZXMgdGhlXHJcbiAgICAgICAgLy8gbGFiZWxsaW5nIG9mIHRoaXMgc2NyZWVuLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2pvaXN0L2lzc3Vlcy80OTZcclxuICAgICAgICBpZiAoIG51bWJlck9mU2NyZWVucyA9PT0gMSApIHtcclxuICAgICAgICAgIHRpdGxlU3RyaW5nID0gZGlzcGxheWVkTmFtZTsgLy8gZm9yIG11bHRpc2NyZWVuIHNpbXMsIGxpa2UgXCJSYXRpbyBhbmQgUHJvcG9ydGlvbiAtLSBDcmVhdGVcIlxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggaXNIb21lU2NyZWVuICkge1xyXG4gICAgICAgICAgdGl0bGVTdHJpbmcgPSBzaW1OYW1lOyAvLyBMaWtlIFwiUmF0aW8gYW5kIFByb3BvdGlvblwiXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICAgIC8vIGluaXRpYWxpemUgcHJvcGVyIFBET00gbGFiZWxsaW5nIGZvciBTY3JlZW5WaWV3XHJcbiAgICAgICAgICB0aXRsZVN0cmluZyA9IFN0cmluZ1V0aWxzLmZpbGxJbiggc2NyZWVuU2ltUGF0dGVyblN0cmluZ1Byb3BlcnR5LCB7XHJcbiAgICAgICAgICAgIHNjcmVlbk5hbWU6IHBkb21EaXNwbGF5TmFtZSxcclxuICAgICAgICAgICAgc2ltTmFtZTogc2ltTmFtZVxyXG4gICAgICAgICAgfSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgYSBzY3JlZW5TdW1tYXJ5Tm9kZSwgdGhlbiBzZXQgaXRzIGludHJvIHN0cmluZyBub3dcclxuICAgICAgICB0aGlzLl92aWV3IS5zZXRTY3JlZW5TdW1tYXJ5SW50cm9BbmRUaXRsZSggc2ltTmFtZSwgcGRvbURpc3BsYXlOYW1lLCB0aXRsZVN0cmluZywgbnVtYmVyT2ZTY3JlZW5zID4gMSApO1xyXG4gICAgICB9ICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIHRoaXMuX3ZpZXcucGRvbUF1ZGl0KCk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogVmFsaWRhdGVzIHRoZSBzaXplcyBmb3IgdGhlIGhvbWUgc2NyZWVuIGljb24gYW5kIG5hdmlnYXRpb24gYmFyIGljb24uXHJcbiAqIEBwYXJhbSBpY29uIC0gdGhlIGljb24gdG8gdmFsaWRhdGVcclxuICogQHBhcmFtIG1pbmltdW1TaXplIC0gdGhlIG1pbmltdW0gYWxsb3dlZCBzaXplIGZvciB0aGUgaWNvblxyXG4gKiBAcGFyYW0gYXNwZWN0UmF0aW8gLSB0aGUgcmVxdWlyZWQgYXNwZWN0IHJhdGlvXHJcbiAqIEBwYXJhbSBuYW1lIC0gdGhlIG5hbWUgb2YgdGhlIGljb24gdHlwZSAoZm9yIGFzc2VydCBtZXNzYWdlcylcclxuICovXHJcbmZ1bmN0aW9uIHZhbGlkYXRlSWNvblNpemUoIGljb246IE5vZGUsIG1pbmltdW1TaXplOiBEaW1lbnNpb24yLCBhc3BlY3RSYXRpbzogbnVtYmVyLCBuYW1lOiBzdHJpbmcgKTogdm9pZCB7XHJcbiAgYXNzZXJ0ICYmIGFzc2VydCggaWNvbi53aWR0aCA+PSBtaW5pbXVtU2l6ZS53aWR0aCwgYCR7bmFtZX0gd2lkdGggaXMgdG9vIHNtYWxsOiAke2ljb24ud2lkdGh9IDwgJHttaW5pbXVtU2l6ZS53aWR0aH1gICk7XHJcbiAgYXNzZXJ0ICYmIGFzc2VydCggaWNvbi5oZWlnaHQgPj0gbWluaW11bVNpemUuaGVpZ2h0LCBgJHtuYW1lfSBoZWlnaHQgaXMgdG9vIHNtYWxsOiAke2ljb24uaGVpZ2h0fSA8ICR7bWluaW11bVNpemUuaGVpZ2h0fWAgKTtcclxuXHJcbiAgLy8gVmFsaWRhdGUgaG9tZSBzY3JlZW4gYXNwZWN0IHJhdGlvXHJcbiAgY29uc3QgYWN0dWFsQXNwZWN0UmF0aW8gPSBpY29uLndpZHRoIC8gaWNvbi5oZWlnaHQ7XHJcbiAgYXNzZXJ0ICYmIGFzc2VydChcclxuICAgIE1hdGguYWJzKCBhc3BlY3RSYXRpbyAtIGFjdHVhbEFzcGVjdFJhdGlvICkgPCBJQ09OX0FTUEVDVF9SQVRJT19UT0xFUkFOQ0UsXHJcbiAgICBgJHtuYW1lfSBoYXMgaW52YWxpZCBhc3BlY3QgcmF0aW86ICR7YWN0dWFsQXNwZWN0UmF0aW99YFxyXG4gICk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgTm9kZSBmb3IgdmlzdWFsaXppbmcgdGhlIFNjcmVlblZpZXcgbGF5b3V0Qm91bmRzIHdpdGggJ2RldicgcXVlcnkgcGFyYW1ldGVyLlxyXG4gKi9cclxuZnVuY3Rpb24gZGV2Q3JlYXRlTGF5b3V0Qm91bmRzTm9kZSggbGF5b3V0Qm91bmRzOiBCb3VuZHMyICk6IE5vZGUge1xyXG4gIHJldHVybiBuZXcgUGF0aCggU2hhcGUuYm91bmRzKCBsYXlvdXRCb3VuZHMgKSwge1xyXG4gICAgc3Ryb2tlOiAncmVkJyxcclxuICAgIGxpbmVXaWR0aDogMyxcclxuICAgIHBpY2thYmxlOiBmYWxzZVxyXG4gIH0gKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBOb2RlIGZvciB2aXN1YWxpemluZyB0aGUgU2NyZWVuVmlldyB2aXNpYmxlQm91bmRzUHJvcGVydHkgd2l0aCAnc2hvd1Zpc2libGVCb3VuZHMnIHF1ZXJ5IHBhcmFtZXRlci5cclxuICovXHJcbmZ1bmN0aW9uIGRldkNyZWF0ZVZpc2libGVCb3VuZHNOb2RlKCBzY3JlZW5WaWV3OiBTY3JlZW5WaWV3ICk6IE5vZGUge1xyXG4gIGNvbnN0IHBhdGggPSBuZXcgUGF0aCggU2hhcGUuYm91bmRzKCBzY3JlZW5WaWV3LnZpc2libGVCb3VuZHNQcm9wZXJ0eS52YWx1ZSApLCB7XHJcbiAgICBzdHJva2U6ICdibHVlJyxcclxuICAgIGxpbmVXaWR0aDogNixcclxuICAgIHBpY2thYmxlOiBmYWxzZVxyXG4gIH0gKTtcclxuICBzY3JlZW5WaWV3LnZpc2libGVCb3VuZHNQcm9wZXJ0eS5saW5rKCB2aXNpYmxlQm91bmRzID0+IHtcclxuICAgIHBhdGguc2hhcGUgPSBTaGFwZS5ib3VuZHMoIHZpc2libGVCb3VuZHMgKTtcclxuICB9ICk7XHJcbiAgcmV0dXJuIHBhdGg7XHJcbn1cclxuXHJcbmpvaXN0LnJlZ2lzdGVyKCAnU2NyZWVuJywgU2NyZWVuICk7XHJcbmV4cG9ydCBkZWZhdWx0IFNjcmVlbjsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLGVBQWUsTUFBTSxr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