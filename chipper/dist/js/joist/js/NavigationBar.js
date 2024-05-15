// Copyright 2013-2024, University of Colorado Boulder

/**
 * The navigation bar at the bottom of the screen.
 * For a single-screen sim, it shows the name of the sim at the far left and the PhET button at the far right.
 * For a multi-screen sim, it additionally shows buttons for each screen, and a home button.
 *
 * Layout of NavigationBar adapts to different text widths, icon widths, and numbers of screens, and attempts to
 * perform an "optimal" layout. The sim title is initially constrained to a max percentage of the bar width,
 * and that's used to compute how much space is available for screen buttons.  After creation and layout of the
 * screen buttons, we then compute how much space is actually available for the sim title, and use that to
 * constrain the title's width.
 *
 * The bar is composed of a background (always pixel-perfect), and expandable content (that gets scaled as one part).
 * If we are width-constrained, the navigation bar is in a 'compact' state where the children of the content (e.g.
 * home button, screen buttons, phet menu, title) do not change positions. If we are height-constrained, the amount
 * available to the bar expands, so we lay out the children to fit. See https://github.com/phetsims/joist/issues/283
 * for more details on how this is done.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */

import DerivedProperty from '../../axon/js/DerivedProperty.js';
import StringProperty from '../../axon/js/StringProperty.js';
import Dimension2 from '../../dot/js/Dimension2.js';
import PhetFont from '../../scenery-phet/js/PhetFont.js';
import { AlignBox, HBox, ManualConstraint, Node, PDOMPeer, Rectangle, RelaxedManualConstraint, Text } from '../../scenery/js/imports.js';
import Tandem from '../../tandem/js/Tandem.js';
import A11yButtonsHBox from './A11yButtonsHBox.js';
import HomeButton from './HomeButton.js';
import HomeScreen from './HomeScreen.js';
import HomeScreenView from './HomeScreenView.js';
import joist from './joist.js';
import JoistStrings from './JoistStrings.js';
import NavigationBarScreenButton from './NavigationBarScreenButton.js';
import PhetButton from './PhetButton.js';
import Bounds2 from '../../dot/js/Bounds2.js';
import BooleanProperty from '../../axon/js/BooleanProperty.js';

// constants
// for layout of the NavigationBar, used in the following way:
// [
//  {TITLE_LEFT_MARGIN}Title{TITLE_RIGHT_MARGIN}
//  {HOME_BUTTON_LEFT_MARGIN}HomeButton{HOME_BUTTON_RIGHT_MARGIN} (if visible)
//  {ScreenButtons centered} (if visible)
//  a11yButtonsHBox (if present){PHET_BUTTON_LEFT_MARGIN}PhetButton{PHET_BUTTON_RIGHT_MARGIN}
// ]
const NAVIGATION_BAR_SIZE = new Dimension2(HomeScreenView.LAYOUT_BOUNDS.width, 40);
const TITLE_LEFT_MARGIN = 10;
const TITLE_RIGHT_MARGIN = 25;
const PHET_BUTTON_LEFT_MARGIN = 6;
const PHET_BUTTON_RIGHT_MARGIN = 10;
const HOME_BUTTON_LEFT_MARGIN = 5;
const HOME_BUTTON_RIGHT_MARGIN = HOME_BUTTON_LEFT_MARGIN;
const SCREEN_BUTTON_SPACING = 0;
const MINIMUM_SCREEN_BUTTON_WIDTH = 60; // Make sure each button is at least a minimum width so they don't get too close together, see #279

class NavigationBar extends Node {
  homeButton = null; // mutated if multiscreen sim

  constructor(sim, tandem) {
    super();

    // The nav bar fill and determining fill for elements on the nav bar (if it's black, the elements are white)
    this.navigationBarFillProperty = new DerivedProperty([sim.selectedScreenProperty, sim.lookAndFeel.navigationBarFillProperty], (screen, simNavigationBarFill) => {
      const showHomeScreen = screen === sim.homeScreen;

      // If the homescreen is showing, the navigation bar should blend into it.  This is done by making it the same color.
      // It cannot be made transparent here, because other code relies on the value of navigationBarFillProperty being
      // 'black' to make the icons show up as white, even when the navigation bar is hidden on the home screen.
      return showHomeScreen ? HomeScreen.BACKGROUND_COLOR : simNavigationBarFill;
    });

    // The bar's background (resized in layout)
    this.background = new Rectangle(0, 0, NAVIGATION_BAR_SIZE.width, NAVIGATION_BAR_SIZE.height, {
      pickable: true,
      fill: this.navigationBarFillProperty
    });
    this.addChild(this.background);

    // Everything else besides the background in the navigation bar (used for scaling)
    this.barContents = new Node();
    this.addChild(this.barContents);
    const titleText = new Text(sim.displayedSimNameProperty, {
      font: new PhetFont(16),
      fill: sim.lookAndFeel.navigationBarTextFillProperty,
      tandem: tandem.createTandem('titleText'),
      phetioFeatured: true,
      phetioDocumentation: 'Displays the title of the simulation in the navigation bar (bottom left)',
      visiblePropertyOptions: {
        phetioFeatured: true
      },
      stringPropertyOptions: {
        phetioReadOnly: true
      },
      phetioVisiblePropertyInstrumented: true
    });

    // Container node so that the visibility of the Navigation Bar title text can be controlled
    // independently by PhET-iO and whether the user is on the homescreen.
    const titleContainerNode = new Node({
      children: [titleText],
      visibleProperty: new DerivedProperty([sim.selectedScreenProperty], screen => screen !== sim.homeScreen)
    });
    this.barContents.addChild(titleContainerNode);

    // PhET button, fill determined by state of navigationBarFillProperty
    const phetButton = new PhetButton(sim, this.navigationBarFillProperty, tandem.createTandem('phetButton'));
    this.barContents.addChild(phetButton);

    // a11y HBox, button fills determined by state of navigationBarFillProperty
    this.a11yButtonsHBox = new A11yButtonsHBox(sim, this.navigationBarFillProperty, {
      tandem: tandem // no need for a container here. If there is a conflict, then it will error loudly.
    });
    this.barContents.addChild(this.a11yButtonsHBox);
    this.localeNode && this.barContents.addChild(this.localeNode);

    // pdom - tell this node that it is aria-labelled by its own labelContent.
    this.addAriaLabelledbyAssociation({
      thisElementName: PDOMPeer.PRIMARY_SIBLING,
      otherNode: this,
      otherElementName: PDOMPeer.LABEL_SIBLING
    });
    let buttons;
    const a11yButtonsWidth = this.a11yButtonsHBox.bounds.isValid() ? this.a11yButtonsHBox.width : 0;

    // No potential for multiple screens if this is true
    if (sim.simScreens.length === 1) {
      /* single-screen sim */

      // title can occupy all space to the left of the PhET button
      titleText.maxWidth = HomeScreenView.LAYOUT_BOUNDS.width - TITLE_LEFT_MARGIN - TITLE_RIGHT_MARGIN - PHET_BUTTON_LEFT_MARGIN - a11yButtonsWidth - (this.localeNode ? this.localeNode.width : 0) - PHET_BUTTON_LEFT_MARGIN - phetButton.width - PHET_BUTTON_RIGHT_MARGIN;
    } else {
      /* multi-screen sim */

      // Start with the assumption that the title can occupy (at most) this percentage of the bar.
      const maxTitleWidth = Math.min(titleText.width, 0.20 * HomeScreenView.LAYOUT_BOUNDS.width);
      const isUserNavigableProperty = new BooleanProperty(true, {
        tandem: Tandem.GENERAL_MODEL.createTandem('screens').createTandem('isUserNavigableProperty'),
        phetioFeatured: true,
        phetioDocumentation: 'If the screens are user navigable, icons are displayed in the navigation bar and the user can switch between screens.'
      });

      // pdom - container for the homeButton and all the screen buttons.
      buttons = new Node({
        tagName: 'ol',
        containerTagName: 'nav',
        labelTagName: 'h2',
        labelContent: JoistStrings.a11y.simScreensStringProperty,
        visibleProperty: new DerivedProperty([sim.activeSimScreensProperty, sim.selectedScreenProperty, isUserNavigableProperty], (screens, screen, isUserNavigable) => {
          return screen !== sim.homeScreen && screens.length > 1 && isUserNavigable;
        })
      });
      buttons.ariaLabelledbyAssociations = [{
        thisElementName: PDOMPeer.CONTAINER_PARENT,
        otherElementName: PDOMPeer.LABEL_SIBLING,
        otherNode: buttons
      }];
      this.barContents.addChild(buttons);

      // Create the home button
      this.homeButton = new HomeButton(NAVIGATION_BAR_SIZE.height, sim.lookAndFeel.navigationBarFillProperty, sim.homeScreen ? sim.homeScreen.pdomDisplayNameProperty : new StringProperty('NO HOME SCREEN'), {
        listener: () => {
          sim.selectedScreenProperty.value = sim.homeScreen;

          // only if fired from a11y
          if (this.homeButton.isPDOMClicking()) {
            sim.homeScreen.view.focusHighlightedScreenButton();
          }
        },
        tandem: tandem.createTandem('homeButton'),
        centerY: NAVIGATION_BAR_SIZE.height / 2
      });

      // Add the home button, but only if the homeScreen exists
      sim.homeScreen && buttons.addChild(this.homeButton);

      /*
       * Allocate remaining horizontal space equally for screen buttons, assuming they will be centered in the navbar.
       * Computations here reflect the left-to-right layout of the navbar.
       */
      // available width left of center
      const availableLeft = HomeScreenView.LAYOUT_BOUNDS.width / 2 - TITLE_LEFT_MARGIN - maxTitleWidth - TITLE_RIGHT_MARGIN - HOME_BUTTON_LEFT_MARGIN - this.homeButton.width - HOME_BUTTON_RIGHT_MARGIN;

      // available width right of center
      const availableRight = HomeScreenView.LAYOUT_BOUNDS.width / 2 - PHET_BUTTON_LEFT_MARGIN - a11yButtonsWidth - (this.localeNode ? this.localeNode.width : 0) - PHET_BUTTON_LEFT_MARGIN - phetButton.width - PHET_BUTTON_RIGHT_MARGIN;

      // total available width for the screen buttons when they are centered
      const availableTotal = 2 * Math.min(availableLeft, availableRight);

      // width per screen button
      const screenButtonWidth = (availableTotal - (sim.simScreens.length - 1) * SCREEN_BUTTON_SPACING) / sim.simScreens.length;

      // Create the screen buttons
      const screenButtons = sim.simScreens.map(screen => {
        return new NavigationBarScreenButton(sim.lookAndFeel.navigationBarFillProperty, sim.selectedScreenProperty, screen, sim.simScreens.indexOf(screen), NAVIGATION_BAR_SIZE.height, {
          maxButtonWidth: screenButtonWidth,
          tandem: screen.tandem.supplied ? tandem.createTandem(`${screen.tandem.name}Button`) : Tandem.REQUIRED
        });
      });
      const allNavBarScreenButtons = [this.homeButton, ...screenButtons];

      // Layout out screen buttons horizontally, with equal distance between their centers
      // Make sure each button is at least a minimum size, so they don't get too close together, see #279
      const maxScreenButtonWidth = Math.max(MINIMUM_SCREEN_BUTTON_WIDTH, _.maxBy(screenButtons, button => {
        return button.width;
      }).width);
      const maxScreenButtonHeight = _.maxBy(screenButtons, button => button.height).height;
      const screenButtonMap = new Map();
      screenButtons.forEach(screenButton => {
        screenButtonMap.set(screenButton.screen, new AlignBox(screenButton, {
          excludeInvisibleChildrenFromBounds: true,
          alignBounds: new Bounds2(0, 0, maxScreenButtonWidth, maxScreenButtonHeight),
          visibleProperty: screenButton.visibleProperty
        }));
      });

      // Put all screen buttons under a parent, to simplify layout
      const screenButtonsContainer = new HBox({
        spacing: SCREEN_BUTTON_SPACING,
        maxWidth: availableTotal // in case we have so many screens that the screen buttons need to be scaled down
      });
      buttons.addChild(screenButtonsContainer);
      sim.activeSimScreensProperty.link(simScreens => {
        screenButtonsContainer.children = simScreens.map(screen => screenButtonMap.get(screen));
      });

      // Screen buttons centered.  These buttons are centered around the origin in the screenButtonsContainer, so the
      // screenButtonsContainer can be put at the center of the navbar.
      ManualConstraint.create(this, [this.background, screenButtonsContainer], (backgroundProxy, screenButtonsContainerProxy) => {
        screenButtonsContainerProxy.center = backgroundProxy.center;
      });

      // home button to the left of screen buttons
      RelaxedManualConstraint.create(this.barContents, [this.homeButton, ...screenButtons], (homeButtonProxy, ...screenButtonProxies) => {
        const visibleScreenButtonProxies = screenButtonProxies.filter(proxy => proxy && proxy.visible);

        // Find the left-most visible button. We don't want the extra padding of the alignbox to be included in this calculation,
        // for backwards compatibility, so it's a lot more complicated.
        if (homeButtonProxy && visibleScreenButtonProxies.length > 0) {
          homeButtonProxy.right = Math.min(...visibleScreenButtonProxies.map(proxy => proxy.left)) - HOME_BUTTON_RIGHT_MARGIN;
        }
      });

      // max width relative to position of home button
      ManualConstraint.create(this.barContents, [this.homeButton, titleText], (homeButtonProxy, titleTextProxy) => {
        titleTextProxy.maxWidth = homeButtonProxy.left - TITLE_LEFT_MARGIN - TITLE_RIGHT_MARGIN;
      });
      sim.simNameProperty.link(simName => {
        allNavBarScreenButtons.forEach(screenButton => {
          screenButton.voicingContextResponse = simName;
        });
      });
    }

    // initial layout (that doesn't need to change when we are re-laid out)
    titleText.left = TITLE_LEFT_MARGIN;
    titleText.centerY = NAVIGATION_BAR_SIZE.height / 2;
    phetButton.centerY = NAVIGATION_BAR_SIZE.height / 2;
    ManualConstraint.create(this, [this.background, phetButton], (backgroundProxy, phetButtonProxy) => {
      phetButtonProxy.right = backgroundProxy.right - PHET_BUTTON_RIGHT_MARGIN;
    });
    ManualConstraint.create(this.barContents, [phetButton, this.a11yButtonsHBox], (phetButtonProxy, a11yButtonsHBoxProxy) => {
      a11yButtonsHBoxProxy.right = phetButtonProxy.left - PHET_BUTTON_LEFT_MARGIN;

      // The icon is vertically adjusted in KeyboardHelpButton, so that the centers can be aligned here
      a11yButtonsHBoxProxy.centerY = phetButtonProxy.centerY;
    });
    if (this.localeNode) {
      ManualConstraint.create(this.barContents, [phetButton, this.a11yButtonsHBox, this.localeNode], (phetButtonProxy, a11yButtonsHBoxProxy, localeNodeProxy) => {
        a11yButtonsHBoxProxy.right = phetButtonProxy.left - PHET_BUTTON_LEFT_MARGIN;

        // The icon is vertically adjusted in KeyboardHelpButton, so that the centers can be aligned here
        a11yButtonsHBoxProxy.centerY = phetButtonProxy.centerY;
        localeNodeProxy.centerY = phetButtonProxy.centerY;
        localeNodeProxy.right = Math.min(a11yButtonsHBoxProxy.left, phetButtonProxy.left) - PHET_BUTTON_LEFT_MARGIN;
      });
    }
    this.layout(1, NAVIGATION_BAR_SIZE.width, NAVIGATION_BAR_SIZE.height);
    const simResourcesContainer = new Node({
      // pdom
      tagName: 'div',
      containerTagName: 'section',
      labelTagName: 'h2',
      labelContent: JoistStrings.a11y.simResourcesStringProperty,
      pdomOrder: [this.a11yButtonsHBox, phetButton].filter(node => node !== undefined)
    });
    simResourcesContainer.ariaLabelledbyAssociations = [{
      thisElementName: PDOMPeer.CONTAINER_PARENT,
      otherElementName: PDOMPeer.LABEL_SIBLING,
      otherNode: simResourcesContainer
    }];
    this.addChild(simResourcesContainer);
  }

  /**
   * Called when the navigation bar layout needs to be updated, typically when the browser window is resized.
   */
  layout(scale, width, height) {
    // resize the background
    this.background.rectWidth = width;
    this.background.rectHeight = height;

    // scale the entire bar contents
    this.barContents.setScaleMagnitude(scale);
  }
  static NAVIGATION_BAR_SIZE = NAVIGATION_BAR_SIZE;
}
joist.register('NavigationBar', NavigationBar);
export default NavigationBar;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJEZXJpdmVkUHJvcGVydHkiLCJTdHJpbmdQcm9wZXJ0eSIsIkRpbWVuc2lvbjIiLCJQaGV0Rm9udCIsIkFsaWduQm94IiwiSEJveCIsIk1hbnVhbENvbnN0cmFpbnQiLCJOb2RlIiwiUERPTVBlZXIiLCJSZWN0YW5nbGUiLCJSZWxheGVkTWFudWFsQ29uc3RyYWludCIsIlRleHQiLCJUYW5kZW0iLCJBMTF5QnV0dG9uc0hCb3giLCJIb21lQnV0dG9uIiwiSG9tZVNjcmVlbiIsIkhvbWVTY3JlZW5WaWV3Iiwiam9pc3QiLCJKb2lzdFN0cmluZ3MiLCJOYXZpZ2F0aW9uQmFyU2NyZWVuQnV0dG9uIiwiUGhldEJ1dHRvbiIsIkJvdW5kczIiLCJCb29sZWFuUHJvcGVydHkiLCJOQVZJR0FUSU9OX0JBUl9TSVpFIiwiTEFZT1VUX0JPVU5EUyIsIndpZHRoIiwiVElUTEVfTEVGVF9NQVJHSU4iLCJUSVRMRV9SSUdIVF9NQVJHSU4iLCJQSEVUX0JVVFRPTl9MRUZUX01BUkdJTiIsIlBIRVRfQlVUVE9OX1JJR0hUX01BUkdJTiIsIkhPTUVfQlVUVE9OX0xFRlRfTUFSR0lOIiwiSE9NRV9CVVRUT05fUklHSFRfTUFSR0lOIiwiU0NSRUVOX0JVVFRPTl9TUEFDSU5HIiwiTUlOSU1VTV9TQ1JFRU5fQlVUVE9OX1dJRFRIIiwiTmF2aWdhdGlvbkJhciIsImhvbWVCdXR0b24iLCJjb25zdHJ1Y3RvciIsInNpbSIsInRhbmRlbSIsIm5hdmlnYXRpb25CYXJGaWxsUHJvcGVydHkiLCJzZWxlY3RlZFNjcmVlblByb3BlcnR5IiwibG9va0FuZEZlZWwiLCJzY3JlZW4iLCJzaW1OYXZpZ2F0aW9uQmFyRmlsbCIsInNob3dIb21lU2NyZWVuIiwiaG9tZVNjcmVlbiIsIkJBQ0tHUk9VTkRfQ09MT1IiLCJiYWNrZ3JvdW5kIiwiaGVpZ2h0IiwicGlja2FibGUiLCJmaWxsIiwiYWRkQ2hpbGQiLCJiYXJDb250ZW50cyIsInRpdGxlVGV4dCIsImRpc3BsYXllZFNpbU5hbWVQcm9wZXJ0eSIsImZvbnQiLCJuYXZpZ2F0aW9uQmFyVGV4dEZpbGxQcm9wZXJ0eSIsImNyZWF0ZVRhbmRlbSIsInBoZXRpb0ZlYXR1cmVkIiwicGhldGlvRG9jdW1lbnRhdGlvbiIsInZpc2libGVQcm9wZXJ0eU9wdGlvbnMiLCJzdHJpbmdQcm9wZXJ0eU9wdGlvbnMiLCJwaGV0aW9SZWFkT25seSIsInBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZCIsInRpdGxlQ29udGFpbmVyTm9kZSIsImNoaWxkcmVuIiwidmlzaWJsZVByb3BlcnR5IiwicGhldEJ1dHRvbiIsImExMXlCdXR0b25zSEJveCIsImxvY2FsZU5vZGUiLCJhZGRBcmlhTGFiZWxsZWRieUFzc29jaWF0aW9uIiwidGhpc0VsZW1lbnROYW1lIiwiUFJJTUFSWV9TSUJMSU5HIiwib3RoZXJOb2RlIiwib3RoZXJFbGVtZW50TmFtZSIsIkxBQkVMX1NJQkxJTkciLCJidXR0b25zIiwiYTExeUJ1dHRvbnNXaWR0aCIsImJvdW5kcyIsImlzVmFsaWQiLCJzaW1TY3JlZW5zIiwibGVuZ3RoIiwibWF4V2lkdGgiLCJtYXhUaXRsZVdpZHRoIiwiTWF0aCIsIm1pbiIsImlzVXNlck5hdmlnYWJsZVByb3BlcnR5IiwiR0VORVJBTF9NT0RFTCIsInRhZ05hbWUiLCJjb250YWluZXJUYWdOYW1lIiwibGFiZWxUYWdOYW1lIiwibGFiZWxDb250ZW50IiwiYTExeSIsInNpbVNjcmVlbnNTdHJpbmdQcm9wZXJ0eSIsImFjdGl2ZVNpbVNjcmVlbnNQcm9wZXJ0eSIsInNjcmVlbnMiLCJpc1VzZXJOYXZpZ2FibGUiLCJhcmlhTGFiZWxsZWRieUFzc29jaWF0aW9ucyIsIkNPTlRBSU5FUl9QQVJFTlQiLCJwZG9tRGlzcGxheU5hbWVQcm9wZXJ0eSIsImxpc3RlbmVyIiwidmFsdWUiLCJpc1BET01DbGlja2luZyIsInZpZXciLCJmb2N1c0hpZ2hsaWdodGVkU2NyZWVuQnV0dG9uIiwiY2VudGVyWSIsImF2YWlsYWJsZUxlZnQiLCJhdmFpbGFibGVSaWdodCIsImF2YWlsYWJsZVRvdGFsIiwic2NyZWVuQnV0dG9uV2lkdGgiLCJzY3JlZW5CdXR0b25zIiwibWFwIiwiaW5kZXhPZiIsIm1heEJ1dHRvbldpZHRoIiwic3VwcGxpZWQiLCJuYW1lIiwiUkVRVUlSRUQiLCJhbGxOYXZCYXJTY3JlZW5CdXR0b25zIiwibWF4U2NyZWVuQnV0dG9uV2lkdGgiLCJtYXgiLCJfIiwibWF4QnkiLCJidXR0b24iLCJtYXhTY3JlZW5CdXR0b25IZWlnaHQiLCJzY3JlZW5CdXR0b25NYXAiLCJNYXAiLCJmb3JFYWNoIiwic2NyZWVuQnV0dG9uIiwic2V0IiwiZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcyIsImFsaWduQm91bmRzIiwic2NyZWVuQnV0dG9uc0NvbnRhaW5lciIsInNwYWNpbmciLCJsaW5rIiwiZ2V0IiwiY3JlYXRlIiwiYmFja2dyb3VuZFByb3h5Iiwic2NyZWVuQnV0dG9uc0NvbnRhaW5lclByb3h5IiwiY2VudGVyIiwiaG9tZUJ1dHRvblByb3h5Iiwic2NyZWVuQnV0dG9uUHJveGllcyIsInZpc2libGVTY3JlZW5CdXR0b25Qcm94aWVzIiwiZmlsdGVyIiwicHJveHkiLCJ2aXNpYmxlIiwicmlnaHQiLCJsZWZ0IiwidGl0bGVUZXh0UHJveHkiLCJzaW1OYW1lUHJvcGVydHkiLCJzaW1OYW1lIiwidm9pY2luZ0NvbnRleHRSZXNwb25zZSIsInBoZXRCdXR0b25Qcm94eSIsImExMXlCdXR0b25zSEJveFByb3h5IiwibG9jYWxlTm9kZVByb3h5IiwibGF5b3V0Iiwic2ltUmVzb3VyY2VzQ29udGFpbmVyIiwic2ltUmVzb3VyY2VzU3RyaW5nUHJvcGVydHkiLCJwZG9tT3JkZXIiLCJub2RlIiwidW5kZWZpbmVkIiwic2NhbGUiLCJyZWN0V2lkdGgiLCJyZWN0SGVpZ2h0Iiwic2V0U2NhbGVNYWduaXR1ZGUiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIk5hdmlnYXRpb25CYXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVGhlIG5hdmlnYXRpb24gYmFyIGF0IHRoZSBib3R0b20gb2YgdGhlIHNjcmVlbi5cclxuICogRm9yIGEgc2luZ2xlLXNjcmVlbiBzaW0sIGl0IHNob3dzIHRoZSBuYW1lIG9mIHRoZSBzaW0gYXQgdGhlIGZhciBsZWZ0IGFuZCB0aGUgUGhFVCBidXR0b24gYXQgdGhlIGZhciByaWdodC5cclxuICogRm9yIGEgbXVsdGktc2NyZWVuIHNpbSwgaXQgYWRkaXRpb25hbGx5IHNob3dzIGJ1dHRvbnMgZm9yIGVhY2ggc2NyZWVuLCBhbmQgYSBob21lIGJ1dHRvbi5cclxuICpcclxuICogTGF5b3V0IG9mIE5hdmlnYXRpb25CYXIgYWRhcHRzIHRvIGRpZmZlcmVudCB0ZXh0IHdpZHRocywgaWNvbiB3aWR0aHMsIGFuZCBudW1iZXJzIG9mIHNjcmVlbnMsIGFuZCBhdHRlbXB0cyB0b1xyXG4gKiBwZXJmb3JtIGFuIFwib3B0aW1hbFwiIGxheW91dC4gVGhlIHNpbSB0aXRsZSBpcyBpbml0aWFsbHkgY29uc3RyYWluZWQgdG8gYSBtYXggcGVyY2VudGFnZSBvZiB0aGUgYmFyIHdpZHRoLFxyXG4gKiBhbmQgdGhhdCdzIHVzZWQgdG8gY29tcHV0ZSBob3cgbXVjaCBzcGFjZSBpcyBhdmFpbGFibGUgZm9yIHNjcmVlbiBidXR0b25zLiAgQWZ0ZXIgY3JlYXRpb24gYW5kIGxheW91dCBvZiB0aGVcclxuICogc2NyZWVuIGJ1dHRvbnMsIHdlIHRoZW4gY29tcHV0ZSBob3cgbXVjaCBzcGFjZSBpcyBhY3R1YWxseSBhdmFpbGFibGUgZm9yIHRoZSBzaW0gdGl0bGUsIGFuZCB1c2UgdGhhdCB0b1xyXG4gKiBjb25zdHJhaW4gdGhlIHRpdGxlJ3Mgd2lkdGguXHJcbiAqXHJcbiAqIFRoZSBiYXIgaXMgY29tcG9zZWQgb2YgYSBiYWNrZ3JvdW5kIChhbHdheXMgcGl4ZWwtcGVyZmVjdCksIGFuZCBleHBhbmRhYmxlIGNvbnRlbnQgKHRoYXQgZ2V0cyBzY2FsZWQgYXMgb25lIHBhcnQpLlxyXG4gKiBJZiB3ZSBhcmUgd2lkdGgtY29uc3RyYWluZWQsIHRoZSBuYXZpZ2F0aW9uIGJhciBpcyBpbiBhICdjb21wYWN0JyBzdGF0ZSB3aGVyZSB0aGUgY2hpbGRyZW4gb2YgdGhlIGNvbnRlbnQgKGUuZy5cclxuICogaG9tZSBidXR0b24sIHNjcmVlbiBidXR0b25zLCBwaGV0IG1lbnUsIHRpdGxlKSBkbyBub3QgY2hhbmdlIHBvc2l0aW9ucy4gSWYgd2UgYXJlIGhlaWdodC1jb25zdHJhaW5lZCwgdGhlIGFtb3VudFxyXG4gKiBhdmFpbGFibGUgdG8gdGhlIGJhciBleHBhbmRzLCBzbyB3ZSBsYXkgb3V0IHRoZSBjaGlsZHJlbiB0byBmaXQuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzI4M1xyXG4gKiBmb3IgbW9yZSBkZXRhaWxzIG9uIGhvdyB0aGlzIGlzIGRvbmUuXHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgQ2hyaXMgTWFsbGV5IChQaXhlbFpvb20sIEluYy4pXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICogQGF1dGhvciBDaHJpcyBLbHVzZW5kb3JmIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBEZXJpdmVkUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9EZXJpdmVkUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgU3RyaW5nUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9TdHJpbmdQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBEaW1lbnNpb24yIGZyb20gJy4uLy4uL2RvdC9qcy9EaW1lbnNpb24yLmpzJztcclxuaW1wb3J0IFBoZXRGb250IGZyb20gJy4uLy4uL3NjZW5lcnktcGhldC9qcy9QaGV0Rm9udC5qcyc7XHJcbmltcG9ydCB7IEFsaWduQm94LCBDb2xvciwgSEJveCwgTWFudWFsQ29uc3RyYWludCwgTm9kZSwgUERPTVBlZXIsIFJlY3RhbmdsZSwgUmVsYXhlZE1hbnVhbENvbnN0cmFpbnQsIFRleHQgfSBmcm9tICcuLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgQTExeUJ1dHRvbnNIQm94IGZyb20gJy4vQTExeUJ1dHRvbnNIQm94LmpzJztcclxuaW1wb3J0IEhvbWVCdXR0b24gZnJvbSAnLi9Ib21lQnV0dG9uLmpzJztcclxuaW1wb3J0IEhvbWVTY3JlZW4gZnJvbSAnLi9Ib21lU2NyZWVuLmpzJztcclxuaW1wb3J0IEhvbWVTY3JlZW5WaWV3IGZyb20gJy4vSG9tZVNjcmVlblZpZXcuanMnO1xyXG5pbXBvcnQgam9pc3QgZnJvbSAnLi9qb2lzdC5qcyc7XHJcbmltcG9ydCBKb2lzdFN0cmluZ3MgZnJvbSAnLi9Kb2lzdFN0cmluZ3MuanMnO1xyXG5pbXBvcnQgTmF2aWdhdGlvbkJhclNjcmVlbkJ1dHRvbiBmcm9tICcuL05hdmlnYXRpb25CYXJTY3JlZW5CdXR0b24uanMnO1xyXG5pbXBvcnQgUGhldEJ1dHRvbiBmcm9tICcuL1BoZXRCdXR0b24uanMnO1xyXG5pbXBvcnQgU2ltIGZyb20gJy4vU2ltLmpzJztcclxuaW1wb3J0IFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9SZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IEJvdW5kczIgZnJvbSAnLi4vLi4vZG90L2pzL0JvdW5kczIuanMnO1xyXG5pbXBvcnQgeyBBbnlTY3JlZW4gfSBmcm9tICcuL1NjcmVlbi5qcyc7XHJcbmltcG9ydCBCb29sZWFuUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9Cb29sZWFuUHJvcGVydHkuanMnO1xyXG5cclxuLy8gY29uc3RhbnRzXHJcbi8vIGZvciBsYXlvdXQgb2YgdGhlIE5hdmlnYXRpb25CYXIsIHVzZWQgaW4gdGhlIGZvbGxvd2luZyB3YXk6XHJcbi8vIFtcclxuLy8gIHtUSVRMRV9MRUZUX01BUkdJTn1UaXRsZXtUSVRMRV9SSUdIVF9NQVJHSU59XHJcbi8vICB7SE9NRV9CVVRUT05fTEVGVF9NQVJHSU59SG9tZUJ1dHRvbntIT01FX0JVVFRPTl9SSUdIVF9NQVJHSU59IChpZiB2aXNpYmxlKVxyXG4vLyAge1NjcmVlbkJ1dHRvbnMgY2VudGVyZWR9IChpZiB2aXNpYmxlKVxyXG4vLyAgYTExeUJ1dHRvbnNIQm94IChpZiBwcmVzZW50KXtQSEVUX0JVVFRPTl9MRUZUX01BUkdJTn1QaGV0QnV0dG9ue1BIRVRfQlVUVE9OX1JJR0hUX01BUkdJTn1cclxuLy8gXVxyXG5jb25zdCBOQVZJR0FUSU9OX0JBUl9TSVpFID0gbmV3IERpbWVuc2lvbjIoIEhvbWVTY3JlZW5WaWV3LkxBWU9VVF9CT1VORFMud2lkdGgsIDQwICk7XHJcbmNvbnN0IFRJVExFX0xFRlRfTUFSR0lOID0gMTA7XHJcbmNvbnN0IFRJVExFX1JJR0hUX01BUkdJTiA9IDI1O1xyXG5jb25zdCBQSEVUX0JVVFRPTl9MRUZUX01BUkdJTiA9IDY7XHJcbmNvbnN0IFBIRVRfQlVUVE9OX1JJR0hUX01BUkdJTiA9IDEwO1xyXG5jb25zdCBIT01FX0JVVFRPTl9MRUZUX01BUkdJTiA9IDU7XHJcbmNvbnN0IEhPTUVfQlVUVE9OX1JJR0hUX01BUkdJTiA9IEhPTUVfQlVUVE9OX0xFRlRfTUFSR0lOO1xyXG5jb25zdCBTQ1JFRU5fQlVUVE9OX1NQQUNJTkcgPSAwO1xyXG5jb25zdCBNSU5JTVVNX1NDUkVFTl9CVVRUT05fV0lEVEggPSA2MDsgLy8gTWFrZSBzdXJlIGVhY2ggYnV0dG9uIGlzIGF0IGxlYXN0IGEgbWluaW11bSB3aWR0aCBzbyB0aGV5IGRvbid0IGdldCB0b28gY2xvc2UgdG9nZXRoZXIsIHNlZSAjMjc5XHJcblxyXG5jbGFzcyBOYXZpZ2F0aW9uQmFyIGV4dGVuZHMgTm9kZSB7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBuYXZpZ2F0aW9uQmFyRmlsbFByb3BlcnR5OiBSZWFkT25seVByb3BlcnR5PENvbG9yPjtcclxuICBwcml2YXRlIHJlYWRvbmx5IGJhY2tncm91bmQ6IFJlY3RhbmdsZTtcclxuICBwcml2YXRlIHJlYWRvbmx5IGJhckNvbnRlbnRzOiBOb2RlO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgYTExeUJ1dHRvbnNIQm94OiBBMTF5QnV0dG9uc0hCb3g7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBsb2NhbGVOb2RlITogTm9kZTtcclxuICBwcml2YXRlIHJlYWRvbmx5IGhvbWVCdXR0b246IEhvbWVCdXR0b24gfCBudWxsID0gbnVsbDsgLy8gbXV0YXRlZCBpZiBtdWx0aXNjcmVlbiBzaW1cclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBzaW06IFNpbSwgdGFuZGVtOiBUYW5kZW0gKSB7XHJcblxyXG4gICAgc3VwZXIoKTtcclxuXHJcbiAgICAvLyBUaGUgbmF2IGJhciBmaWxsIGFuZCBkZXRlcm1pbmluZyBmaWxsIGZvciBlbGVtZW50cyBvbiB0aGUgbmF2IGJhciAoaWYgaXQncyBibGFjaywgdGhlIGVsZW1lbnRzIGFyZSB3aGl0ZSlcclxuICAgIHRoaXMubmF2aWdhdGlvbkJhckZpbGxQcm9wZXJ0eSA9IG5ldyBEZXJpdmVkUHJvcGVydHkoIFtcclxuICAgICAgc2ltLnNlbGVjdGVkU2NyZWVuUHJvcGVydHksXHJcbiAgICAgIHNpbS5sb29rQW5kRmVlbC5uYXZpZ2F0aW9uQmFyRmlsbFByb3BlcnR5XHJcbiAgICBdLCAoIHNjcmVlbiwgc2ltTmF2aWdhdGlvbkJhckZpbGwgKSA9PiB7XHJcblxyXG4gICAgICBjb25zdCBzaG93SG9tZVNjcmVlbiA9IHNjcmVlbiA9PT0gc2ltLmhvbWVTY3JlZW47XHJcblxyXG4gICAgICAvLyBJZiB0aGUgaG9tZXNjcmVlbiBpcyBzaG93aW5nLCB0aGUgbmF2aWdhdGlvbiBiYXIgc2hvdWxkIGJsZW5kIGludG8gaXQuICBUaGlzIGlzIGRvbmUgYnkgbWFraW5nIGl0IHRoZSBzYW1lIGNvbG9yLlxyXG4gICAgICAvLyBJdCBjYW5ub3QgYmUgbWFkZSB0cmFuc3BhcmVudCBoZXJlLCBiZWNhdXNlIG90aGVyIGNvZGUgcmVsaWVzIG9uIHRoZSB2YWx1ZSBvZiBuYXZpZ2F0aW9uQmFyRmlsbFByb3BlcnR5IGJlaW5nXHJcbiAgICAgIC8vICdibGFjaycgdG8gbWFrZSB0aGUgaWNvbnMgc2hvdyB1cCBhcyB3aGl0ZSwgZXZlbiB3aGVuIHRoZSBuYXZpZ2F0aW9uIGJhciBpcyBoaWRkZW4gb24gdGhlIGhvbWUgc2NyZWVuLlxyXG4gICAgICByZXR1cm4gc2hvd0hvbWVTY3JlZW4gPyBIb21lU2NyZWVuLkJBQ0tHUk9VTkRfQ09MT1IgOiBzaW1OYXZpZ2F0aW9uQmFyRmlsbDtcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBUaGUgYmFyJ3MgYmFja2dyb3VuZCAocmVzaXplZCBpbiBsYXlvdXQpXHJcbiAgICB0aGlzLmJhY2tncm91bmQgPSBuZXcgUmVjdGFuZ2xlKCAwLCAwLCBOQVZJR0FUSU9OX0JBUl9TSVpFLndpZHRoLCBOQVZJR0FUSU9OX0JBUl9TSVpFLmhlaWdodCwge1xyXG4gICAgICBwaWNrYWJsZTogdHJ1ZSxcclxuICAgICAgZmlsbDogdGhpcy5uYXZpZ2F0aW9uQmFyRmlsbFByb3BlcnR5XHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLmFkZENoaWxkKCB0aGlzLmJhY2tncm91bmQgKTtcclxuXHJcbiAgICAvLyBFdmVyeXRoaW5nIGVsc2UgYmVzaWRlcyB0aGUgYmFja2dyb3VuZCBpbiB0aGUgbmF2aWdhdGlvbiBiYXIgKHVzZWQgZm9yIHNjYWxpbmcpXHJcbiAgICB0aGlzLmJhckNvbnRlbnRzID0gbmV3IE5vZGUoKTtcclxuICAgIHRoaXMuYWRkQ2hpbGQoIHRoaXMuYmFyQ29udGVudHMgKTtcclxuXHJcbiAgICBjb25zdCB0aXRsZVRleHQgPSBuZXcgVGV4dCggc2ltLmRpc3BsYXllZFNpbU5hbWVQcm9wZXJ0eSwge1xyXG4gICAgICBmb250OiBuZXcgUGhldEZvbnQoIDE2ICksXHJcbiAgICAgIGZpbGw6IHNpbS5sb29rQW5kRmVlbC5uYXZpZ2F0aW9uQmFyVGV4dEZpbGxQcm9wZXJ0eSxcclxuICAgICAgdGFuZGVtOiB0YW5kZW0uY3JlYXRlVGFuZGVtKCAndGl0bGVUZXh0JyApLFxyXG4gICAgICBwaGV0aW9GZWF0dXJlZDogdHJ1ZSxcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ0Rpc3BsYXlzIHRoZSB0aXRsZSBvZiB0aGUgc2ltdWxhdGlvbiBpbiB0aGUgbmF2aWdhdGlvbiBiYXIgKGJvdHRvbSBsZWZ0KScsXHJcbiAgICAgIHZpc2libGVQcm9wZXJ0eU9wdGlvbnM6IHsgcGhldGlvRmVhdHVyZWQ6IHRydWUgfSxcclxuICAgICAgc3RyaW5nUHJvcGVydHlPcHRpb25zOiB7IHBoZXRpb1JlYWRPbmx5OiB0cnVlIH0sXHJcbiAgICAgIHBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZDogdHJ1ZVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIENvbnRhaW5lciBub2RlIHNvIHRoYXQgdGhlIHZpc2liaWxpdHkgb2YgdGhlIE5hdmlnYXRpb24gQmFyIHRpdGxlIHRleHQgY2FuIGJlIGNvbnRyb2xsZWRcclxuICAgIC8vIGluZGVwZW5kZW50bHkgYnkgUGhFVC1pTyBhbmQgd2hldGhlciB0aGUgdXNlciBpcyBvbiB0aGUgaG9tZXNjcmVlbi5cclxuICAgIGNvbnN0IHRpdGxlQ29udGFpbmVyTm9kZSA9IG5ldyBOb2RlKCB7XHJcbiAgICAgIGNoaWxkcmVuOiBbIHRpdGxlVGV4dCBdLFxyXG4gICAgICB2aXNpYmxlUHJvcGVydHk6IG5ldyBEZXJpdmVkUHJvcGVydHkoIFsgc2ltLnNlbGVjdGVkU2NyZWVuUHJvcGVydHkgXSwgc2NyZWVuID0+IHNjcmVlbiAhPT0gc2ltLmhvbWVTY3JlZW4gKVxyXG4gICAgfSApO1xyXG4gICAgdGhpcy5iYXJDb250ZW50cy5hZGRDaGlsZCggdGl0bGVDb250YWluZXJOb2RlICk7XHJcblxyXG4gICAgLy8gUGhFVCBidXR0b24sIGZpbGwgZGV0ZXJtaW5lZCBieSBzdGF0ZSBvZiBuYXZpZ2F0aW9uQmFyRmlsbFByb3BlcnR5XHJcbiAgICBjb25zdCBwaGV0QnV0dG9uID0gbmV3IFBoZXRCdXR0b24oXHJcbiAgICAgIHNpbSxcclxuICAgICAgdGhpcy5uYXZpZ2F0aW9uQmFyRmlsbFByb3BlcnR5LFxyXG4gICAgICB0YW5kZW0uY3JlYXRlVGFuZGVtKCAncGhldEJ1dHRvbicgKVxyXG4gICAgKTtcclxuICAgIHRoaXMuYmFyQ29udGVudHMuYWRkQ2hpbGQoIHBoZXRCdXR0b24gKTtcclxuXHJcbiAgICAvLyBhMTF5IEhCb3gsIGJ1dHRvbiBmaWxscyBkZXRlcm1pbmVkIGJ5IHN0YXRlIG9mIG5hdmlnYXRpb25CYXJGaWxsUHJvcGVydHlcclxuICAgIHRoaXMuYTExeUJ1dHRvbnNIQm94ID0gbmV3IEExMXlCdXR0b25zSEJveChcclxuICAgICAgc2ltLFxyXG4gICAgICB0aGlzLm5hdmlnYXRpb25CYXJGaWxsUHJvcGVydHksIHtcclxuICAgICAgICB0YW5kZW06IHRhbmRlbSAvLyBubyBuZWVkIGZvciBhIGNvbnRhaW5lciBoZXJlLiBJZiB0aGVyZSBpcyBhIGNvbmZsaWN0LCB0aGVuIGl0IHdpbGwgZXJyb3IgbG91ZGx5LlxyXG4gICAgICB9XHJcbiAgICApO1xyXG4gICAgdGhpcy5iYXJDb250ZW50cy5hZGRDaGlsZCggdGhpcy5hMTF5QnV0dG9uc0hCb3ggKTtcclxuICAgIHRoaXMubG9jYWxlTm9kZSAmJiB0aGlzLmJhckNvbnRlbnRzLmFkZENoaWxkKCB0aGlzLmxvY2FsZU5vZGUgKTtcclxuXHJcbiAgICAvLyBwZG9tIC0gdGVsbCB0aGlzIG5vZGUgdGhhdCBpdCBpcyBhcmlhLWxhYmVsbGVkIGJ5IGl0cyBvd24gbGFiZWxDb250ZW50LlxyXG4gICAgdGhpcy5hZGRBcmlhTGFiZWxsZWRieUFzc29jaWF0aW9uKCB7XHJcbiAgICAgIHRoaXNFbGVtZW50TmFtZTogUERPTVBlZXIuUFJJTUFSWV9TSUJMSU5HLFxyXG4gICAgICBvdGhlck5vZGU6IHRoaXMsXHJcbiAgICAgIG90aGVyRWxlbWVudE5hbWU6IFBET01QZWVyLkxBQkVMX1NJQkxJTkdcclxuICAgIH0gKTtcclxuXHJcbiAgICBsZXQgYnV0dG9uczogTm9kZTtcclxuXHJcbiAgICBjb25zdCBhMTF5QnV0dG9uc1dpZHRoID0gKCB0aGlzLmExMXlCdXR0b25zSEJveC5ib3VuZHMuaXNWYWxpZCgpID8gdGhpcy5hMTF5QnV0dG9uc0hCb3gud2lkdGggOiAwICk7XHJcblxyXG4gICAgLy8gTm8gcG90ZW50aWFsIGZvciBtdWx0aXBsZSBzY3JlZW5zIGlmIHRoaXMgaXMgdHJ1ZVxyXG4gICAgaWYgKCBzaW0uc2ltU2NyZWVucy5sZW5ndGggPT09IDEgKSB7XHJcblxyXG4gICAgICAvKiBzaW5nbGUtc2NyZWVuIHNpbSAqL1xyXG5cclxuICAgICAgLy8gdGl0bGUgY2FuIG9jY3VweSBhbGwgc3BhY2UgdG8gdGhlIGxlZnQgb2YgdGhlIFBoRVQgYnV0dG9uXHJcbiAgICAgIHRpdGxlVGV4dC5tYXhXaWR0aCA9IEhvbWVTY3JlZW5WaWV3LkxBWU9VVF9CT1VORFMud2lkdGggLSBUSVRMRV9MRUZUX01BUkdJTiAtIFRJVExFX1JJR0hUX01BUkdJTiAtXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFBIRVRfQlVUVE9OX0xFRlRfTUFSR0lOIC0gYTExeUJ1dHRvbnNXaWR0aCAtICggdGhpcy5sb2NhbGVOb2RlID8gdGhpcy5sb2NhbGVOb2RlLndpZHRoIDogMCApIC0gUEhFVF9CVVRUT05fTEVGVF9NQVJHSU4gLVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBwaGV0QnV0dG9uLndpZHRoIC0gUEhFVF9CVVRUT05fUklHSFRfTUFSR0lOO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcblxyXG4gICAgICAvKiBtdWx0aS1zY3JlZW4gc2ltICovXHJcblxyXG4gICAgICAvLyBTdGFydCB3aXRoIHRoZSBhc3N1bXB0aW9uIHRoYXQgdGhlIHRpdGxlIGNhbiBvY2N1cHkgKGF0IG1vc3QpIHRoaXMgcGVyY2VudGFnZSBvZiB0aGUgYmFyLlxyXG4gICAgICBjb25zdCBtYXhUaXRsZVdpZHRoID0gTWF0aC5taW4oIHRpdGxlVGV4dC53aWR0aCwgMC4yMCAqIEhvbWVTY3JlZW5WaWV3LkxBWU9VVF9CT1VORFMud2lkdGggKTtcclxuXHJcbiAgICAgIGNvbnN0IGlzVXNlck5hdmlnYWJsZVByb3BlcnR5ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggdHJ1ZSwge1xyXG4gICAgICAgIHRhbmRlbTogVGFuZGVtLkdFTkVSQUxfTU9ERUwuY3JlYXRlVGFuZGVtKCAnc2NyZWVucycgKS5jcmVhdGVUYW5kZW0oICdpc1VzZXJOYXZpZ2FibGVQcm9wZXJ0eScgKSxcclxuICAgICAgICBwaGV0aW9GZWF0dXJlZDogdHJ1ZSxcclxuICAgICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnSWYgdGhlIHNjcmVlbnMgYXJlIHVzZXIgbmF2aWdhYmxlLCBpY29ucyBhcmUgZGlzcGxheWVkIGluIHRoZSBuYXZpZ2F0aW9uIGJhciBhbmQgdGhlIHVzZXIgY2FuIHN3aXRjaCBiZXR3ZWVuIHNjcmVlbnMuJ1xyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICAvLyBwZG9tIC0gY29udGFpbmVyIGZvciB0aGUgaG9tZUJ1dHRvbiBhbmQgYWxsIHRoZSBzY3JlZW4gYnV0dG9ucy5cclxuICAgICAgYnV0dG9ucyA9IG5ldyBOb2RlKCB7XHJcbiAgICAgICAgdGFnTmFtZTogJ29sJyxcclxuICAgICAgICBjb250YWluZXJUYWdOYW1lOiAnbmF2JyxcclxuICAgICAgICBsYWJlbFRhZ05hbWU6ICdoMicsXHJcbiAgICAgICAgbGFiZWxDb250ZW50OiBKb2lzdFN0cmluZ3MuYTExeS5zaW1TY3JlZW5zU3RyaW5nUHJvcGVydHksXHJcbiAgICAgICAgdmlzaWJsZVByb3BlcnR5OiBuZXcgRGVyaXZlZFByb3BlcnR5KCBbIHNpbS5hY3RpdmVTaW1TY3JlZW5zUHJvcGVydHksIHNpbS5zZWxlY3RlZFNjcmVlblByb3BlcnR5LCBpc1VzZXJOYXZpZ2FibGVQcm9wZXJ0eSBdLCAoIHNjcmVlbnMsIHNjcmVlbiwgaXNVc2VyTmF2aWdhYmxlICkgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIHNjcmVlbiAhPT0gc2ltLmhvbWVTY3JlZW4gJiYgc2NyZWVucy5sZW5ndGggPiAxICYmIGlzVXNlck5hdmlnYWJsZTtcclxuICAgICAgICB9IClcclxuICAgICAgfSApO1xyXG5cclxuICAgICAgYnV0dG9ucy5hcmlhTGFiZWxsZWRieUFzc29jaWF0aW9ucyA9IFsge1xyXG4gICAgICAgIHRoaXNFbGVtZW50TmFtZTogUERPTVBlZXIuQ09OVEFJTkVSX1BBUkVOVCxcclxuICAgICAgICBvdGhlckVsZW1lbnROYW1lOiBQRE9NUGVlci5MQUJFTF9TSUJMSU5HLFxyXG4gICAgICAgIG90aGVyTm9kZTogYnV0dG9uc1xyXG4gICAgICB9IF07XHJcbiAgICAgIHRoaXMuYmFyQ29udGVudHMuYWRkQ2hpbGQoIGJ1dHRvbnMgKTtcclxuXHJcbiAgICAgIC8vIENyZWF0ZSB0aGUgaG9tZSBidXR0b25cclxuICAgICAgdGhpcy5ob21lQnV0dG9uID0gbmV3IEhvbWVCdXR0b24oXHJcbiAgICAgICAgTkFWSUdBVElPTl9CQVJfU0laRS5oZWlnaHQsXHJcbiAgICAgICAgc2ltLmxvb2tBbmRGZWVsLm5hdmlnYXRpb25CYXJGaWxsUHJvcGVydHksXHJcbiAgICAgICAgc2ltLmhvbWVTY3JlZW4gPyBzaW0uaG9tZVNjcmVlbi5wZG9tRGlzcGxheU5hbWVQcm9wZXJ0eSA6IG5ldyBTdHJpbmdQcm9wZXJ0eSggJ05PIEhPTUUgU0NSRUVOJyApLCB7XHJcbiAgICAgICAgICBsaXN0ZW5lcjogKCkgPT4ge1xyXG4gICAgICAgICAgICBzaW0uc2VsZWN0ZWRTY3JlZW5Qcm9wZXJ0eS52YWx1ZSA9IHNpbS5ob21lU2NyZWVuITtcclxuXHJcbiAgICAgICAgICAgIC8vIG9ubHkgaWYgZmlyZWQgZnJvbSBhMTF5XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5ob21lQnV0dG9uIS5pc1BET01DbGlja2luZygpICkge1xyXG4gICAgICAgICAgICAgIHNpbS5ob21lU2NyZWVuIS52aWV3LmZvY3VzSGlnaGxpZ2h0ZWRTY3JlZW5CdXR0b24oKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHRhbmRlbTogdGFuZGVtLmNyZWF0ZVRhbmRlbSggJ2hvbWVCdXR0b24nICksXHJcbiAgICAgICAgICBjZW50ZXJZOiBOQVZJR0FUSU9OX0JBUl9TSVpFLmhlaWdodCAvIDJcclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgICAvLyBBZGQgdGhlIGhvbWUgYnV0dG9uLCBidXQgb25seSBpZiB0aGUgaG9tZVNjcmVlbiBleGlzdHNcclxuICAgICAgc2ltLmhvbWVTY3JlZW4gJiYgYnV0dG9ucy5hZGRDaGlsZCggdGhpcy5ob21lQnV0dG9uICk7XHJcblxyXG4gICAgICAvKlxyXG4gICAgICAgKiBBbGxvY2F0ZSByZW1haW5pbmcgaG9yaXpvbnRhbCBzcGFjZSBlcXVhbGx5IGZvciBzY3JlZW4gYnV0dG9ucywgYXNzdW1pbmcgdGhleSB3aWxsIGJlIGNlbnRlcmVkIGluIHRoZSBuYXZiYXIuXHJcbiAgICAgICAqIENvbXB1dGF0aW9ucyBoZXJlIHJlZmxlY3QgdGhlIGxlZnQtdG8tcmlnaHQgbGF5b3V0IG9mIHRoZSBuYXZiYXIuXHJcbiAgICAgICAqL1xyXG4gICAgICAvLyBhdmFpbGFibGUgd2lkdGggbGVmdCBvZiBjZW50ZXJcclxuICAgICAgY29uc3QgYXZhaWxhYmxlTGVmdCA9ICggSG9tZVNjcmVlblZpZXcuTEFZT1VUX0JPVU5EUy53aWR0aCAvIDIgKSAtIFRJVExFX0xFRlRfTUFSR0lOIC0gbWF4VGl0bGVXaWR0aCAtIFRJVExFX1JJR0hUX01BUkdJTiAtXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBIT01FX0JVVFRPTl9MRUZUX01BUkdJTiAtIHRoaXMuaG9tZUJ1dHRvbi53aWR0aCAtIEhPTUVfQlVUVE9OX1JJR0hUX01BUkdJTjtcclxuXHJcbiAgICAgIC8vIGF2YWlsYWJsZSB3aWR0aCByaWdodCBvZiBjZW50ZXJcclxuICAgICAgY29uc3QgYXZhaWxhYmxlUmlnaHQgPSAoIEhvbWVTY3JlZW5WaWV3LkxBWU9VVF9CT1VORFMud2lkdGggLyAyICkgLSBQSEVUX0JVVFRPTl9MRUZUX01BUkdJTiAtXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYTExeUJ1dHRvbnNXaWR0aCAtICggdGhpcy5sb2NhbGVOb2RlID8gdGhpcy5sb2NhbGVOb2RlLndpZHRoIDogMCApIC0gUEhFVF9CVVRUT05fTEVGVF9NQVJHSU4gLSBwaGV0QnV0dG9uLndpZHRoIC1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQSEVUX0JVVFRPTl9SSUdIVF9NQVJHSU47XHJcblxyXG4gICAgICAvLyB0b3RhbCBhdmFpbGFibGUgd2lkdGggZm9yIHRoZSBzY3JlZW4gYnV0dG9ucyB3aGVuIHRoZXkgYXJlIGNlbnRlcmVkXHJcbiAgICAgIGNvbnN0IGF2YWlsYWJsZVRvdGFsID0gMiAqIE1hdGgubWluKCBhdmFpbGFibGVMZWZ0LCBhdmFpbGFibGVSaWdodCApO1xyXG5cclxuICAgICAgLy8gd2lkdGggcGVyIHNjcmVlbiBidXR0b25cclxuICAgICAgY29uc3Qgc2NyZWVuQnV0dG9uV2lkdGggPSAoIGF2YWlsYWJsZVRvdGFsIC0gKCBzaW0uc2ltU2NyZWVucy5sZW5ndGggLSAxICkgKiBTQ1JFRU5fQlVUVE9OX1NQQUNJTkcgKSAvIHNpbS5zaW1TY3JlZW5zLmxlbmd0aDtcclxuXHJcbiAgICAgIC8vIENyZWF0ZSB0aGUgc2NyZWVuIGJ1dHRvbnNcclxuICAgICAgY29uc3Qgc2NyZWVuQnV0dG9ucyA9IHNpbS5zaW1TY3JlZW5zLm1hcCggc2NyZWVuID0+IHtcclxuICAgICAgICByZXR1cm4gbmV3IE5hdmlnYXRpb25CYXJTY3JlZW5CdXR0b24oXHJcbiAgICAgICAgICBzaW0ubG9va0FuZEZlZWwubmF2aWdhdGlvbkJhckZpbGxQcm9wZXJ0eSxcclxuICAgICAgICAgIHNpbS5zZWxlY3RlZFNjcmVlblByb3BlcnR5LFxyXG4gICAgICAgICAgc2NyZWVuLFxyXG4gICAgICAgICAgc2ltLnNpbVNjcmVlbnMuaW5kZXhPZiggc2NyZWVuICksXHJcbiAgICAgICAgICBOQVZJR0FUSU9OX0JBUl9TSVpFLmhlaWdodCwge1xyXG4gICAgICAgICAgICBtYXhCdXR0b25XaWR0aDogc2NyZWVuQnV0dG9uV2lkdGgsXHJcbiAgICAgICAgICAgIHRhbmRlbTogc2NyZWVuLnRhbmRlbS5zdXBwbGllZCA/IHRhbmRlbS5jcmVhdGVUYW5kZW0oIGAke3NjcmVlbi50YW5kZW0ubmFtZX1CdXR0b25gICkgOiBUYW5kZW0uUkVRVUlSRURcclxuICAgICAgICAgIH0gKTtcclxuICAgICAgfSApO1xyXG4gICAgICBjb25zdCBhbGxOYXZCYXJTY3JlZW5CdXR0b25zID0gWyB0aGlzLmhvbWVCdXR0b24sIC4uLnNjcmVlbkJ1dHRvbnMgXTtcclxuXHJcbiAgICAgIC8vIExheW91dCBvdXQgc2NyZWVuIGJ1dHRvbnMgaG9yaXpvbnRhbGx5LCB3aXRoIGVxdWFsIGRpc3RhbmNlIGJldHdlZW4gdGhlaXIgY2VudGVyc1xyXG4gICAgICAvLyBNYWtlIHN1cmUgZWFjaCBidXR0b24gaXMgYXQgbGVhc3QgYSBtaW5pbXVtIHNpemUsIHNvIHRoZXkgZG9uJ3QgZ2V0IHRvbyBjbG9zZSB0b2dldGhlciwgc2VlICMyNzlcclxuICAgICAgY29uc3QgbWF4U2NyZWVuQnV0dG9uV2lkdGggPSBNYXRoLm1heCggTUlOSU1VTV9TQ1JFRU5fQlVUVE9OX1dJRFRILCBfLm1heEJ5KCBzY3JlZW5CdXR0b25zLCBidXR0b24gPT4ge1xyXG4gICAgICAgIHJldHVybiBidXR0b24ud2lkdGg7XHJcbiAgICAgIH0gKSEud2lkdGggKTtcclxuICAgICAgY29uc3QgbWF4U2NyZWVuQnV0dG9uSGVpZ2h0ID0gXy5tYXhCeSggc2NyZWVuQnV0dG9ucywgYnV0dG9uID0+IGJ1dHRvbi5oZWlnaHQgKSEuaGVpZ2h0O1xyXG5cclxuICAgICAgY29uc3Qgc2NyZWVuQnV0dG9uTWFwID0gbmV3IE1hcDxBbnlTY3JlZW4sIE5vZGU+KCk7XHJcbiAgICAgIHNjcmVlbkJ1dHRvbnMuZm9yRWFjaCggc2NyZWVuQnV0dG9uID0+IHtcclxuICAgICAgICBzY3JlZW5CdXR0b25NYXAuc2V0KCBzY3JlZW5CdXR0b24uc2NyZWVuLCBuZXcgQWxpZ25Cb3goIHNjcmVlbkJ1dHRvbiwge1xyXG4gICAgICAgICAgZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kczogdHJ1ZSxcclxuICAgICAgICAgIGFsaWduQm91bmRzOiBuZXcgQm91bmRzMiggMCwgMCwgbWF4U2NyZWVuQnV0dG9uV2lkdGgsIG1heFNjcmVlbkJ1dHRvbkhlaWdodCApLFxyXG4gICAgICAgICAgdmlzaWJsZVByb3BlcnR5OiBzY3JlZW5CdXR0b24udmlzaWJsZVByb3BlcnR5XHJcbiAgICAgICAgfSApICk7XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIC8vIFB1dCBhbGwgc2NyZWVuIGJ1dHRvbnMgdW5kZXIgYSBwYXJlbnQsIHRvIHNpbXBsaWZ5IGxheW91dFxyXG4gICAgICBjb25zdCBzY3JlZW5CdXR0b25zQ29udGFpbmVyID0gbmV3IEhCb3goIHtcclxuICAgICAgICBzcGFjaW5nOiBTQ1JFRU5fQlVUVE9OX1NQQUNJTkcsXHJcbiAgICAgICAgbWF4V2lkdGg6IGF2YWlsYWJsZVRvdGFsIC8vIGluIGNhc2Ugd2UgaGF2ZSBzbyBtYW55IHNjcmVlbnMgdGhhdCB0aGUgc2NyZWVuIGJ1dHRvbnMgbmVlZCB0byBiZSBzY2FsZWQgZG93blxyXG4gICAgICB9ICk7XHJcbiAgICAgIGJ1dHRvbnMuYWRkQ2hpbGQoIHNjcmVlbkJ1dHRvbnNDb250YWluZXIgKTtcclxuICAgICAgc2ltLmFjdGl2ZVNpbVNjcmVlbnNQcm9wZXJ0eS5saW5rKCBzaW1TY3JlZW5zID0+IHtcclxuICAgICAgICBzY3JlZW5CdXR0b25zQ29udGFpbmVyLmNoaWxkcmVuID0gc2ltU2NyZWVucy5tYXAoIHNjcmVlbiA9PiBzY3JlZW5CdXR0b25NYXAuZ2V0KCBzY3JlZW4gKSEgKTtcclxuICAgICAgfSApO1xyXG5cclxuICAgICAgLy8gU2NyZWVuIGJ1dHRvbnMgY2VudGVyZWQuICBUaGVzZSBidXR0b25zIGFyZSBjZW50ZXJlZCBhcm91bmQgdGhlIG9yaWdpbiBpbiB0aGUgc2NyZWVuQnV0dG9uc0NvbnRhaW5lciwgc28gdGhlXHJcbiAgICAgIC8vIHNjcmVlbkJ1dHRvbnNDb250YWluZXIgY2FuIGJlIHB1dCBhdCB0aGUgY2VudGVyIG9mIHRoZSBuYXZiYXIuXHJcbiAgICAgIE1hbnVhbENvbnN0cmFpbnQuY3JlYXRlKCB0aGlzLCBbIHRoaXMuYmFja2dyb3VuZCwgc2NyZWVuQnV0dG9uc0NvbnRhaW5lciBdLCAoIGJhY2tncm91bmRQcm94eSwgc2NyZWVuQnV0dG9uc0NvbnRhaW5lclByb3h5ICkgPT4ge1xyXG4gICAgICAgIHNjcmVlbkJ1dHRvbnNDb250YWluZXJQcm94eS5jZW50ZXIgPSBiYWNrZ3JvdW5kUHJveHkuY2VudGVyO1xyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICAvLyBob21lIGJ1dHRvbiB0byB0aGUgbGVmdCBvZiBzY3JlZW4gYnV0dG9uc1xyXG4gICAgICBSZWxheGVkTWFudWFsQ29uc3RyYWludC5jcmVhdGUoIHRoaXMuYmFyQ29udGVudHMsIFsgdGhpcy5ob21lQnV0dG9uLCAuLi5zY3JlZW5CdXR0b25zIF0sICggaG9tZUJ1dHRvblByb3h5LCAuLi5zY3JlZW5CdXR0b25Qcm94aWVzICkgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCB2aXNpYmxlU2NyZWVuQnV0dG9uUHJveGllcyA9IHNjcmVlbkJ1dHRvblByb3hpZXMuZmlsdGVyKCBwcm94eSA9PiBwcm94eSAmJiBwcm94eS52aXNpYmxlICk7XHJcblxyXG4gICAgICAgIC8vIEZpbmQgdGhlIGxlZnQtbW9zdCB2aXNpYmxlIGJ1dHRvbi4gV2UgZG9uJ3Qgd2FudCB0aGUgZXh0cmEgcGFkZGluZyBvZiB0aGUgYWxpZ25ib3ggdG8gYmUgaW5jbHVkZWQgaW4gdGhpcyBjYWxjdWxhdGlvbixcclxuICAgICAgICAvLyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHksIHNvIGl0J3MgYSBsb3QgbW9yZSBjb21wbGljYXRlZC5cclxuICAgICAgICBpZiAoIGhvbWVCdXR0b25Qcm94eSAmJiB2aXNpYmxlU2NyZWVuQnV0dG9uUHJveGllcy5sZW5ndGggPiAwICkge1xyXG4gICAgICAgICAgaG9tZUJ1dHRvblByb3h5LnJpZ2h0ID0gTWF0aC5taW4oIC4uLnZpc2libGVTY3JlZW5CdXR0b25Qcm94aWVzLm1hcCggcHJveHkgPT4gcHJveHkhLmxlZnQgKSApIC0gSE9NRV9CVVRUT05fUklHSFRfTUFSR0lOO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG5cclxuICAgICAgLy8gbWF4IHdpZHRoIHJlbGF0aXZlIHRvIHBvc2l0aW9uIG9mIGhvbWUgYnV0dG9uXHJcbiAgICAgIE1hbnVhbENvbnN0cmFpbnQuY3JlYXRlKCB0aGlzLmJhckNvbnRlbnRzLCBbIHRoaXMuaG9tZUJ1dHRvbiwgdGl0bGVUZXh0IF0sICggaG9tZUJ1dHRvblByb3h5LCB0aXRsZVRleHRQcm94eSApID0+IHtcclxuICAgICAgICB0aXRsZVRleHRQcm94eS5tYXhXaWR0aCA9IGhvbWVCdXR0b25Qcm94eS5sZWZ0IC0gVElUTEVfTEVGVF9NQVJHSU4gLSBUSVRMRV9SSUdIVF9NQVJHSU47XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIHNpbS5zaW1OYW1lUHJvcGVydHkubGluayggc2ltTmFtZSA9PiB7XHJcbiAgICAgICAgYWxsTmF2QmFyU2NyZWVuQnV0dG9ucy5mb3JFYWNoKCBzY3JlZW5CdXR0b24gPT4ge1xyXG4gICAgICAgICAgc2NyZWVuQnV0dG9uLnZvaWNpbmdDb250ZXh0UmVzcG9uc2UgPSBzaW1OYW1lO1xyXG4gICAgICAgIH0gKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGluaXRpYWwgbGF5b3V0ICh0aGF0IGRvZXNuJ3QgbmVlZCB0byBjaGFuZ2Ugd2hlbiB3ZSBhcmUgcmUtbGFpZCBvdXQpXHJcbiAgICB0aXRsZVRleHQubGVmdCA9IFRJVExFX0xFRlRfTUFSR0lOO1xyXG4gICAgdGl0bGVUZXh0LmNlbnRlclkgPSBOQVZJR0FUSU9OX0JBUl9TSVpFLmhlaWdodCAvIDI7XHJcbiAgICBwaGV0QnV0dG9uLmNlbnRlclkgPSBOQVZJR0FUSU9OX0JBUl9TSVpFLmhlaWdodCAvIDI7XHJcblxyXG4gICAgTWFudWFsQ29uc3RyYWludC5jcmVhdGUoIHRoaXMsIFsgdGhpcy5iYWNrZ3JvdW5kLCBwaGV0QnV0dG9uIF0sICggYmFja2dyb3VuZFByb3h5LCBwaGV0QnV0dG9uUHJveHkgKSA9PiB7XHJcbiAgICAgIHBoZXRCdXR0b25Qcm94eS5yaWdodCA9IGJhY2tncm91bmRQcm94eS5yaWdodCAtIFBIRVRfQlVUVE9OX1JJR0hUX01BUkdJTjtcclxuICAgIH0gKTtcclxuXHJcbiAgICBNYW51YWxDb25zdHJhaW50LmNyZWF0ZSggdGhpcy5iYXJDb250ZW50cywgWyBwaGV0QnV0dG9uLCB0aGlzLmExMXlCdXR0b25zSEJveCBdLCAoIHBoZXRCdXR0b25Qcm94eSwgYTExeUJ1dHRvbnNIQm94UHJveHkgKSA9PiB7XHJcbiAgICAgIGExMXlCdXR0b25zSEJveFByb3h5LnJpZ2h0ID0gcGhldEJ1dHRvblByb3h5LmxlZnQgLSBQSEVUX0JVVFRPTl9MRUZUX01BUkdJTjtcclxuXHJcbiAgICAgIC8vIFRoZSBpY29uIGlzIHZlcnRpY2FsbHkgYWRqdXN0ZWQgaW4gS2V5Ym9hcmRIZWxwQnV0dG9uLCBzbyB0aGF0IHRoZSBjZW50ZXJzIGNhbiBiZSBhbGlnbmVkIGhlcmVcclxuICAgICAgYTExeUJ1dHRvbnNIQm94UHJveHkuY2VudGVyWSA9IHBoZXRCdXR0b25Qcm94eS5jZW50ZXJZO1xyXG4gICAgfSApO1xyXG5cclxuICAgIGlmICggdGhpcy5sb2NhbGVOb2RlICkge1xyXG4gICAgICBNYW51YWxDb25zdHJhaW50LmNyZWF0ZSggdGhpcy5iYXJDb250ZW50cywgWyBwaGV0QnV0dG9uLCB0aGlzLmExMXlCdXR0b25zSEJveCwgdGhpcy5sb2NhbGVOb2RlIF0sICggcGhldEJ1dHRvblByb3h5LCBhMTF5QnV0dG9uc0hCb3hQcm94eSwgbG9jYWxlTm9kZVByb3h5ICkgPT4ge1xyXG4gICAgICAgIGExMXlCdXR0b25zSEJveFByb3h5LnJpZ2h0ID0gcGhldEJ1dHRvblByb3h5LmxlZnQgLSBQSEVUX0JVVFRPTl9MRUZUX01BUkdJTjtcclxuXHJcbiAgICAgICAgLy8gVGhlIGljb24gaXMgdmVydGljYWxseSBhZGp1c3RlZCBpbiBLZXlib2FyZEhlbHBCdXR0b24sIHNvIHRoYXQgdGhlIGNlbnRlcnMgY2FuIGJlIGFsaWduZWQgaGVyZVxyXG4gICAgICAgIGExMXlCdXR0b25zSEJveFByb3h5LmNlbnRlclkgPSBwaGV0QnV0dG9uUHJveHkuY2VudGVyWTtcclxuXHJcbiAgICAgICAgbG9jYWxlTm9kZVByb3h5LmNlbnRlclkgPSBwaGV0QnV0dG9uUHJveHkuY2VudGVyWTtcclxuICAgICAgICBsb2NhbGVOb2RlUHJveHkucmlnaHQgPSBNYXRoLm1pbiggYTExeUJ1dHRvbnNIQm94UHJveHkubGVmdCwgcGhldEJ1dHRvblByb3h5LmxlZnQgKSAtIFBIRVRfQlVUVE9OX0xFRlRfTUFSR0lOO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5sYXlvdXQoIDEsIE5BVklHQVRJT05fQkFSX1NJWkUud2lkdGgsIE5BVklHQVRJT05fQkFSX1NJWkUuaGVpZ2h0ICk7XHJcblxyXG4gICAgY29uc3Qgc2ltUmVzb3VyY2VzQ29udGFpbmVyID0gbmV3IE5vZGUoIHtcclxuXHJcbiAgICAgIC8vIHBkb21cclxuICAgICAgdGFnTmFtZTogJ2RpdicsXHJcbiAgICAgIGNvbnRhaW5lclRhZ05hbWU6ICdzZWN0aW9uJyxcclxuICAgICAgbGFiZWxUYWdOYW1lOiAnaDInLFxyXG4gICAgICBsYWJlbENvbnRlbnQ6IEpvaXN0U3RyaW5ncy5hMTF5LnNpbVJlc291cmNlc1N0cmluZ1Byb3BlcnR5LFxyXG4gICAgICBwZG9tT3JkZXI6IFtcclxuICAgICAgICB0aGlzLmExMXlCdXR0b25zSEJveCxcclxuICAgICAgICBwaGV0QnV0dG9uXHJcbiAgICAgIF0uZmlsdGVyKCBub2RlID0+IG5vZGUgIT09IHVuZGVmaW5lZCApXHJcbiAgICB9ICk7XHJcblxyXG4gICAgc2ltUmVzb3VyY2VzQ29udGFpbmVyLmFyaWFMYWJlbGxlZGJ5QXNzb2NpYXRpb25zID0gWyB7XHJcbiAgICAgIHRoaXNFbGVtZW50TmFtZTogUERPTVBlZXIuQ09OVEFJTkVSX1BBUkVOVCxcclxuICAgICAgb3RoZXJFbGVtZW50TmFtZTogUERPTVBlZXIuTEFCRUxfU0lCTElORyxcclxuICAgICAgb3RoZXJOb2RlOiBzaW1SZXNvdXJjZXNDb250YWluZXJcclxuICAgIH0gXTtcclxuICAgIHRoaXMuYWRkQ2hpbGQoIHNpbVJlc291cmNlc0NvbnRhaW5lciApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIHdoZW4gdGhlIG5hdmlnYXRpb24gYmFyIGxheW91dCBuZWVkcyB0byBiZSB1cGRhdGVkLCB0eXBpY2FsbHkgd2hlbiB0aGUgYnJvd3NlciB3aW5kb3cgaXMgcmVzaXplZC5cclxuICAgKi9cclxuICBwdWJsaWMgbGF5b3V0KCBzY2FsZTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciApOiB2b2lkIHtcclxuICAgIC8vIHJlc2l6ZSB0aGUgYmFja2dyb3VuZFxyXG4gICAgdGhpcy5iYWNrZ3JvdW5kLnJlY3RXaWR0aCA9IHdpZHRoO1xyXG4gICAgdGhpcy5iYWNrZ3JvdW5kLnJlY3RIZWlnaHQgPSBoZWlnaHQ7XHJcblxyXG4gICAgLy8gc2NhbGUgdGhlIGVudGlyZSBiYXIgY29udGVudHNcclxuICAgIHRoaXMuYmFyQ29udGVudHMuc2V0U2NhbGVNYWduaXR1ZGUoIHNjYWxlICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IE5BVklHQVRJT05fQkFSX1NJWkUgPSBOQVZJR0FUSU9OX0JBUl9TSVpFO1xyXG59XHJcblxyXG5qb2lzdC5yZWdpc3RlciggJ05hdmlnYXRpb25CYXInLCBOYXZpZ2F0aW9uQmFyICk7XHJcbmV4cG9ydCBkZWZhdWx0IE5hdmlnYXRpb25CYXI7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxlQUFlLE1BQU0sa0NBQWtDO0FBQzlELE9BQU9DLGNBQWMsTUFBTSxpQ0FBaUM7QUFDNUQsT0FBT0MsVUFBVSxNQUFNLDRCQUE0QjtBQUNuRCxPQUFPQyxRQUFRLE1BQU0sbUNBQW1DO0FBQ3hELFNBQVNDLFFBQVEsRUFBU0MsSUFBSSxFQUFFQyxnQkFBZ0IsRUFBRUMsSUFBSSxFQUFFQyxRQUFRLEVBQUVDLFNBQVMsRUFBRUMsdUJBQXVCLEVBQUVDLElBQUksUUFBUSw2QkFBNkI7QUFDL0ksT0FBT0MsTUFBTSxNQUFNLDJCQUEyQjtBQUM5QyxPQUFPQyxlQUFlLE1BQU0sc0JBQXNCO0FBQ2xELE9BQU9DLFVBQVUsTUFBTSxpQkFBaUI7QUFDeEMsT0FBT0MsVUFBVSxNQUFNLGlCQUFpQjtBQUN4QyxPQUFPQyxjQUFjLE1BQU0scUJBQXFCO0FBQ2hELE9BQU9DLEtBQUssTUFBTSxZQUFZO0FBQzlCLE9BQU9DLFlBQVksTUFBTSxtQkFBbUI7QUFDNUMsT0FBT0MseUJBQXlCLE1BQU0sZ0NBQWdDO0FBQ3RFLE9BQU9DLFVBQVUsTUFBTSxpQkFBaUI7QUFHeEMsT0FBT0MsT0FBTyxNQUFNLHlCQUF5QjtBQUU3QyxPQUFPQyxlQUFlLE1BQU0s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