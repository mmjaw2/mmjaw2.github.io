// Copyright 2018-2024, University of Colorado Boulder

/**
 * General dialog type. Migrated from Joist on 4/10/2018
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrea Lin (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Multilink from '../../axon/js/Multilink.js';
import ScreenView from '../../joist/js/ScreenView.js';
import getGlobal from '../../phet-core/js/getGlobal.js';
import optionize from '../../phet-core/js/optionize.js';
import CloseButton from '../../scenery-phet/js/buttons/CloseButton.js';
import { AlignBox, FocusManager, FullScreen, HBox, KeyboardListener, Node, PDOMPeer, PDOMUtils, VBox, voicingManager } from '../../scenery/js/imports.js';
import generalCloseSoundPlayer from '../../tambo/js/shared-sound-players/generalCloseSoundPlayer.js';
import generalOpenSoundPlayer from '../../tambo/js/shared-sound-players/generalOpenSoundPlayer.js';
import nullSoundPlayer from '../../tambo/js/shared-sound-players/nullSoundPlayer.js';
import Tandem, { DYNAMIC_ARCHETYPE_NAME } from '../../tandem/js/Tandem.js';
import DynamicMarkerIO from '../../tandem/js/types/DynamicMarkerIO.js';
import IOType from '../../tandem/js/types/IOType.js';
import Utterance from '../../utterance-queue/js/Utterance.js';
import ButtonNode from './buttons/ButtonNode.js';
import Panel from './Panel.js';
import Popupable from './Popupable.js';
import sun from './sun.js';
import SunStrings from './SunStrings.js';
import TinyProperty from '../../axon/js/TinyProperty.js';
import PatternStringProperty from '../../axon/js/PatternStringProperty.js';

// see SelfOptions.titleAlign

/**
 * see SelfOptions.layoutStrategy
 * @param dialog
 * @param simBounds - see Sim.boundsProperty
 * @param screenBounds - see Sim.screenBoundsProperty
 * @param scale - see Sim.scaleProperty
 */

export default class Dialog extends Popupable(Panel, 1) {
  /**
   * @param content - The content to display inside the dialog (not including the title)
   * @param providedOptions
   */
  constructor(content, providedOptions) {
    const options = optionize()({
      // DialogOptions
      xSpacing: 10,
      ySpacing: 10,
      topMargin: 15,
      bottomMargin: 15,
      leftMargin: null,
      maxWidthMargin: 12,
      maxHeightMargin: 12,
      closeButtonLength: 18.2,
      closeButtonTopMargin: 10,
      closeButtonRightMargin: 10,
      title: null,
      titleAlign: 'center',
      addAriaLabelledByFromTitle: true,
      layoutStrategy: defaultLayoutStrategy,
      closeButtonListener: () => this.hide(),
      closeButtonColor: 'black',
      closeButtonTouchAreaXDilation: 0,
      closeButtonTouchAreaYDilation: 0,
      closeButtonMouseAreaXDilation: 0,
      closeButtonMouseAreaYDilation: 0,
      closeButtonVoicingDialogTitle: null,
      closeButtonLastInPDOM: false,
      openedSoundPlayer: generalOpenSoundPlayer,
      closedSoundPlayer: generalCloseSoundPlayer,
      sim: getGlobal('phet.joist.sim'),
      showCallback: null,
      hideCallback: null,
      // PopupableOptions
      layoutBounds: ScreenView.DEFAULT_LAYOUT_BOUNDS,
      focusOnShowNode: null,
      // PanelOptions
      cornerRadius: 10,
      // {number} radius of the dialog's corners
      resize: true,
      // {boolean} whether to resize if content's size changes
      fill: 'white',
      // {string|Color}
      stroke: 'black',
      // {string|Color}
      backgroundPickable: true,
      maxHeight: null,
      // if not provided, then dynamically calculate based on the layoutBounds of the current screen, see updateLayoutMultilink
      maxWidth: null,
      // if not provided, then dynamically calculate based on the layoutBounds of the current screen, see updateLayoutMultilink

      // phet-io
      tandemNameSuffix: ['Dialog', DYNAMIC_ARCHETYPE_NAME],
      // DYNAMIC_ARCHETYPE_NAME means that this Dialog is an archetype.
      phetioType: Dialog.DialogIO,
      phetioState: true,
      // Dialog is often a dynamic element, and thus needs to be in state to trigger element creation.
      phetioVisiblePropertyInstrumented: false,
      // visible isn't toggled when showing a Dialog

      // pdom options
      tagName: 'div',
      ariaRole: 'dialog'
    }, providedOptions);
    assert && assert(options.sim, 'sim must be provided, as Dialog needs a Sim instance');
    assert && assert(options.xMargin === undefined, 'Dialog sets xMargin');
    options.xMargin = 0;
    assert && assert(options.yMargin === undefined, 'Dialog sets yMargin');
    options.yMargin = 0;

    // if left margin is specified in options, use it. otherwise, set it to make the left right gutters symmetrical
    if (options.leftMargin === null) {
      options.leftMargin = options.xSpacing + options.closeButtonLength + options.closeButtonRightMargin;
    }
    assert && assert(options.maxHeight === null || typeof options.maxHeight === 'number');
    assert && assert(options.maxWidth === null || typeof options.maxWidth === 'number');

    // Apply maxWidth/maxHeight depending on the margins and layoutBounds
    if (!options.maxWidth && options.layoutBounds) {
      options.maxWidth = applyDoubleMargin(options.layoutBounds.width, options.maxWidthMargin);
    }
    if (!options.maxHeight && options.layoutBounds) {
      options.maxHeight = applyDoubleMargin(options.layoutBounds.height, options.maxHeightMargin);
    }

    // We need an "unattached" utterance so that when the close button fires, hiding the close button, we still hear
    // the context response. But we still should only hear this context response when "Sim Voicing" is enabled.
    const contextResponseUtterance = new Utterance({
      priority: Utterance.MEDIUM_PRIORITY,
      voicingCanAnnounceProperties: [voicingManager.voicingFullyEnabledProperty]
    });

    // create close button - a flat "X"
    const closeButton = new CloseButton({
      iconLength: options.closeButtonLength,
      baseColor: 'transparent',
      buttonAppearanceStrategy: ButtonNode.FlatAppearanceStrategy,
      // no margins since the flat X takes up all the space
      xMargin: 0,
      yMargin: 0,
      listener: () => {
        // Context response first, before potentially changing focus with the callback listener
        closeButton.voicingSpeakContextResponse({
          utterance: contextResponseUtterance
        });
        options.closeButtonListener();
      },
      pathOptions: {
        stroke: options.closeButtonColor
      },
      // phet-io
      tandem: options.tandem?.createTandem('closeButton'),
      phetioState: false,
      // close button should not be in state

      // It is a usability concern to change either of these, also there are other ways to exit a Dialog, so using
      // these is buggy.
      phetioVisiblePropertyInstrumented: false,
      phetioEnabledPropertyInstrumented: false,
      // turn off default sound generation, Dialog will create its own sounds
      soundPlayer: nullSoundPlayer,
      // pdom
      tagName: 'button',
      innerContent: SunStrings.a11y.closeStringProperty,
      // voicing
      voicingContextResponse: SunStrings.a11y.closedStringProperty
    });
    let closeButtonVoicingNameResponseProperty;
    if (options.closeButtonVoicingDialogTitle) {
      const titleProperty = typeof options.closeButtonVoicingDialogTitle === 'string' ? new TinyProperty(options.closeButtonVoicingDialogTitle) : options.closeButtonVoicingDialogTitle;
      closeButtonVoicingNameResponseProperty = closeButton.voicingNameResponse = new PatternStringProperty(SunStrings.a11y.titleClosePatternStringProperty, {
        title: titleProperty
      }, {
        tandem: Tandem.OPT_OUT
      });
    }

    // touch/mouse areas for the close button
    closeButton.touchArea = closeButton.bounds.dilatedXY(options.closeButtonTouchAreaXDilation, options.closeButtonTouchAreaYDilation);
    closeButton.mouseArea = closeButton.bounds.dilatedXY(options.closeButtonMouseAreaXDilation, options.closeButtonMouseAreaYDilation);

    // pdom - set the order of content, close button first so remaining content can be read from top to bottom
    // with virtual cursor
    let pdomOrder = [options.title, content];
    options.closeButtonLastInPDOM ? pdomOrder.push(closeButton) : pdomOrder.unshift(closeButton);
    pdomOrder = pdomOrder.filter(node => node !== undefined && node !== null);

    // pdom - fall back to focusing the closeButton by default if there is no focusOnShowNode or the
    // content is not focusable
    assert && assert(pdomOrder[0]);
    options.focusOnShowNode = options.focusOnShowNode ? options.focusOnShowNode : pdomOrder[0].focusable ? pdomOrder[0] : closeButton;
    assert && assert(options.focusOnShowNode instanceof Node, 'should be non-null and defined');
    assert && assert(options.focusOnShowNode.focusable, 'focusOnShowNode must be focusable.');

    // Align content, title, and close button using spacing and margin options

    // align content and title (if provided) vertically
    const contentAndTitle = new VBox({
      children: options.title ? [options.title, content] : [content],
      spacing: options.ySpacing,
      align: options.titleAlign
    });

    // add topMargin, bottomMargin, and leftMargin
    const contentAndTitleWithMargins = new AlignBox(contentAndTitle, {
      topMargin: options.topMargin,
      bottomMargin: options.bottomMargin,
      leftMargin: options.leftMargin
    });

    // add closeButtonTopMargin and closeButtonRightMargin
    const closeButtonWithMargins = new AlignBox(closeButton, {
      topMargin: options.closeButtonTopMargin,
      rightMargin: options.closeButtonRightMargin
    });

    // create content for Panel
    const dialogContent = new HBox({
      children: [contentAndTitleWithMargins, closeButtonWithMargins],
      spacing: options.xSpacing,
      align: 'top'
    });
    super(dialogContent, options);

    // The Dialog's display runs on this Property, so add the listener that controls show/hide.
    this.isShowingProperty.lazyLink(isShowing => {
      if (isShowing) {
        // sound generation
        options.openedSoundPlayer.play();

        // Do this last
        options.showCallback && options.showCallback();
      } else {
        // sound generation
        options.closedSoundPlayer.play();

        // Do this last
        options.hideCallback && options.hideCallback();
      }
    });
    this.sim = options.sim;
    this.closeButton = closeButton;
    const updateLayoutMultilink = Multilink.multilink([this.sim.boundsProperty, this.sim.screenBoundsProperty, this.sim.scaleProperty, this.sim.selectedScreenProperty, this.isShowingProperty, this.localBoundsProperty], (bounds, screenBounds, scale) => {
      if (bounds && screenBounds && scale) {
        options.layoutStrategy(this, bounds, screenBounds, scale);
      }
    });

    // Setter after the super call
    this.pdomOrder = pdomOrder;

    // pdom - set the aria-labelledby relation so that whenever focus enters the dialog the title is read
    if (options.title && options.title.tagName && options.addAriaLabelledByFromTitle) {
      this.addAriaLabelledbyAssociation({
        thisElementName: PDOMPeer.PRIMARY_SIBLING,
        otherNode: options.title,
        otherElementName: PDOMPeer.PRIMARY_SIBLING
      });
    }

    // pdom - close the dialog when pressing "escape"
    const keyboardListener = new KeyboardListener({
      keys: ['escape', 'tab', 'shift+tab'],
      fire: (event, keysPressed) => {
        assert && assert(event, 'event should be non-null and defined for this listener');
        const domEvent = event;
        if (keysPressed === 'escape') {
          domEvent.preventDefault();
          this.hide();
        } else if ((keysPressed === 'tab' || keysPressed === 'shift+tab') && FullScreen.isFullScreen()) {
          // prevent a particular bug in Windows 7/8.1 Firefox where focus gets trapped in the document
          // when the navigation bar is hidden and there is only one focusable element in the DOM
          // see https://bugzilla.mozilla.org/show_bug.cgi?id=910136
          assert && assert(FocusManager.pdomFocus); // {Focus|null}
          const activeId = FocusManager.pdomFocus.trail.getUniqueId();
          const noNextFocusable = PDOMUtils.getNextFocusable().id === activeId;
          const noPreviousFocusable = PDOMUtils.getPreviousFocusable().id === activeId;
          if (noNextFocusable && noPreviousFocusable) {
            domEvent.preventDefault();
          }
        }
      }
    });
    this.addInputListener(keyboardListener);
    this.disposeDialog = () => {
      updateLayoutMultilink.dispose();
      closeButtonWithMargins.dispose();
      this.removeInputListener(keyboardListener);
      keyboardListener.dispose();
      closeButtonVoicingNameResponseProperty && closeButtonVoicingNameResponseProperty.dispose();
      closeButton.dispose();
      contextResponseUtterance.dispose();
      contentAndTitle.dispose();

      // remove dialog content from scene graph, but don't dispose because Panel
      // needs to remove listeners on the content in its dispose()
      dialogContent.removeAllChildren();
      dialogContent.detach();
    };
  }
  dispose() {
    this.disposeDialog();
    super.dispose();
  }
  static DialogIO = new IOType('DialogIO', {
    valueType: Dialog,
    // Since many Dialogs are dynamic elements, these need to be in the state. The value of the state object doesn't
    // matter, but it instead just serves as a marker to tell the state engine to recreate the Dialog (if dynamic) when
    // setting state.
    supertype: DynamicMarkerIO
  });
}

// Default value for options.layoutStrategy, centers the Dialog in the layoutBounds.
function defaultLayoutStrategy(dialog, simBounds, screenBounds, scale) {
  if (dialog.layoutBounds) {
    dialog.center = dialog.layoutBounds.center;
  }
}

/**
 * @param dimension - width or height dimension
 * @param margin - margin to be applied to the dimension
 */
function applyDoubleMargin(dimension, margin) {
  return dimension > margin * 2 ? dimension - margin * 2 : dimension;
}
sun.register('Dialog', Dialog);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNdWx0aWxpbmsiLCJTY3JlZW5WaWV3IiwiZ2V0R2xvYmFsIiwib3B0aW9uaXplIiwiQ2xvc2VCdXR0b24iLCJBbGlnbkJveCIsIkZvY3VzTWFuYWdlciIsIkZ1bGxTY3JlZW4iLCJIQm94IiwiS2V5Ym9hcmRMaXN0ZW5lciIsIk5vZGUiLCJQRE9NUGVlciIsIlBET01VdGlscyIsIlZCb3giLCJ2b2ljaW5nTWFuYWdlciIsImdlbmVyYWxDbG9zZVNvdW5kUGxheWVyIiwiZ2VuZXJhbE9wZW5Tb3VuZFBsYXllciIsIm51bGxTb3VuZFBsYXllciIsIlRhbmRlbSIsIkRZTkFNSUNfQVJDSEVUWVBFX05BTUUiLCJEeW5hbWljTWFya2VySU8iLCJJT1R5cGUiLCJVdHRlcmFuY2UiLCJCdXR0b25Ob2RlIiwiUGFuZWwiLCJQb3B1cGFibGUiLCJzdW4iLCJTdW5TdHJpbmdzIiwiVGlueVByb3BlcnR5IiwiUGF0dGVyblN0cmluZ1Byb3BlcnR5IiwiRGlhbG9nIiwiY29uc3RydWN0b3IiLCJjb250ZW50IiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsInhTcGFjaW5nIiwieVNwYWNpbmciLCJ0b3BNYXJnaW4iLCJib3R0b21NYXJnaW4iLCJsZWZ0TWFyZ2luIiwibWF4V2lkdGhNYXJnaW4iLCJtYXhIZWlnaHRNYXJnaW4iLCJjbG9zZUJ1dHRvbkxlbmd0aCIsImNsb3NlQnV0dG9uVG9wTWFyZ2luIiwiY2xvc2VCdXR0b25SaWdodE1hcmdpbiIsInRpdGxlIiwidGl0bGVBbGlnbiIsImFkZEFyaWFMYWJlbGxlZEJ5RnJvbVRpdGxlIiwibGF5b3V0U3RyYXRlZ3kiLCJkZWZhdWx0TGF5b3V0U3RyYXRlZ3kiLCJjbG9zZUJ1dHRvbkxpc3RlbmVyIiwiaGlkZSIsImNsb3NlQnV0dG9uQ29sb3IiLCJjbG9zZUJ1dHRvblRvdWNoQXJlYVhEaWxhdGlvbiIsImNsb3NlQnV0dG9uVG91Y2hBcmVhWURpbGF0aW9uIiwiY2xvc2VCdXR0b25Nb3VzZUFyZWFYRGlsYXRpb24iLCJjbG9zZUJ1dHRvbk1vdXNlQXJlYVlEaWxhdGlvbiIsImNsb3NlQnV0dG9uVm9pY2luZ0RpYWxvZ1RpdGxlIiwiY2xvc2VCdXR0b25MYXN0SW5QRE9NIiwib3BlbmVkU291bmRQbGF5ZXIiLCJjbG9zZWRTb3VuZFBsYXllciIsInNpbSIsInNob3dDYWxsYmFjayIsImhpZGVDYWxsYmFjayIsImxheW91dEJvdW5kcyIsIkRFRkFVTFRfTEFZT1VUX0JPVU5EUyIsImZvY3VzT25TaG93Tm9kZSIsImNvcm5lclJhZGl1cyIsInJlc2l6ZSIsImZpbGwiLCJzdHJva2UiLCJiYWNrZ3JvdW5kUGlja2FibGUiLCJtYXhIZWlnaHQiLCJtYXhXaWR0aCIsInRhbmRlbU5hbWVTdWZmaXgiLCJwaGV0aW9UeXBlIiwiRGlhbG9nSU8iLCJwaGV0aW9TdGF0ZSIsInBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZCIsInRhZ05hbWUiLCJhcmlhUm9sZSIsImFzc2VydCIsInhNYXJnaW4iLCJ1bmRlZmluZWQiLCJ5TWFyZ2luIiwiYXBwbHlEb3VibGVNYXJnaW4iLCJ3aWR0aCIsImhlaWdodCIsImNvbnRleHRSZXNwb25zZVV0dGVyYW5jZSIsInByaW9yaXR5IiwiTUVESVVNX1BSSU9SSVRZIiwidm9pY2luZ0NhbkFubm91bmNlUHJvcGVydGllcyIsInZvaWNpbmdGdWxseUVuYWJsZWRQcm9wZXJ0eSIsImNsb3NlQnV0dG9uIiwiaWNvbkxlbmd0aCIsImJhc2VDb2xvciIsImJ1dHRvbkFwcGVhcmFuY2VTdHJhdGVneSIsIkZsYXRBcHBlYXJhbmNlU3RyYXRlZ3kiLCJsaXN0ZW5lciIsInZvaWNpbmdTcGVha0NvbnRleHRSZXNwb25zZSIsInV0dGVyYW5jZSIsInBhdGhPcHRpb25zIiwidGFuZGVtIiwiY3JlYXRlVGFuZGVtIiwicGhldGlvRW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkIiwic291bmRQbGF5ZXIiLCJpbm5lckNvbnRlbnQiLCJhMTF5IiwiY2xvc2VTdHJpbmdQcm9wZXJ0eSIsInZvaWNpbmdDb250ZXh0UmVzcG9uc2UiLCJjbG9zZWRTdHJpbmdQcm9wZXJ0eSIsImNsb3NlQnV0dG9uVm9pY2luZ05hbWVSZXNwb25zZVByb3BlcnR5IiwidGl0bGVQcm9wZXJ0eSIsInZvaWNpbmdOYW1lUmVzcG9uc2UiLCJ0aXRsZUNsb3NlUGF0dGVyblN0cmluZ1Byb3BlcnR5IiwiT1BUX09VVCIsInRvdWNoQXJlYSIsImJvdW5kcyIsImRpbGF0ZWRYWSIsIm1vdXNlQXJlYSIsInBkb21PcmRlciIsInB1c2giLCJ1bnNoaWZ0IiwiZmlsdGVyIiwibm9kZSIsImZvY3VzYWJsZSIsImNvbnRlbnRBbmRUaXRsZSIsImNoaWxkcmVuIiwic3BhY2luZyIsImFsaWduIiwiY29udGVudEFuZFRpdGxlV2l0aE1hcmdpbnMiLCJjbG9zZUJ1dHRvbldpdGhNYXJnaW5zIiwicmlnaHRNYXJnaW4iLCJkaWFsb2dDb250ZW50IiwiaXNTaG93aW5nUHJvcGVydHkiLCJsYXp5TGluayIsImlzU2hvd2luZyIsInBsYXkiLCJ1cGRhdGVMYXlvdXRNdWx0aWxpbmsiLCJtdWx0aWxpbmsiLCJib3VuZHNQcm9wZXJ0eSIsInNjcmVlbkJvdW5kc1Byb3BlcnR5Iiwic2NhbGVQcm9wZXJ0eSIsInNlbGVjdGVkU2NyZWVuUHJvcGVydHkiLCJsb2NhbEJvdW5kc1Byb3BlcnR5Iiwic2NyZWVuQm91bmRzIiwic2NhbGUiLCJhZGRBcmlhTGFiZWxsZWRieUFzc29jaWF0aW9uIiwidGhpc0VsZW1lbnROYW1lIiwiUFJJTUFSWV9TSUJMSU5HIiwib3RoZXJOb2RlIiwib3RoZXJFbGVtZW50TmFtZSIsImtleWJvYXJkTGlzdGVuZXIiLCJrZXlzIiwiZmlyZSIsImV2ZW50Iiwia2V5c1ByZXNzZWQiLCJkb21FdmVudCIsInByZXZlbnREZWZhdWx0IiwiaXNGdWxsU2NyZWVuIiwicGRvbUZvY3VzIiwiYWN0aXZlSWQiLCJ0cmFpbCIsImdldFVuaXF1ZUlkIiwibm9OZXh0Rm9jdXNhYmxlIiwiZ2V0TmV4dEZvY3VzYWJsZSIsImlkIiwibm9QcmV2aW91c0ZvY3VzYWJsZSIsImdldFByZXZpb3VzRm9jdXNhYmxlIiwiYWRkSW5wdXRMaXN0ZW5lciIsImRpc3Bvc2VEaWFsb2ciLCJkaXNwb3NlIiwicmVtb3ZlSW5wdXRMaXN0ZW5lciIsInJlbW92ZUFsbENoaWxkcmVuIiwiZGV0YWNoIiwidmFsdWVUeXBlIiwic3VwZXJ0eXBlIiwiZGlhbG9nIiwic2ltQm91bmRzIiwiY2VudGVyIiwiZGltZW5zaW9uIiwibWFyZ2luIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJEaWFsb2cudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogR2VuZXJhbCBkaWFsb2cgdHlwZS4gTWlncmF0ZWQgZnJvbSBKb2lzdCBvbiA0LzEwLzIwMThcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBBbmRyZWEgTGluIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIENocmlzIE1hbGxleSAoUGl4ZWxab29tLCBJbmMuKVxyXG4gKi9cclxuXHJcbmltcG9ydCBNdWx0aWxpbmsgZnJvbSAnLi4vLi4vYXhvbi9qcy9NdWx0aWxpbmsuanMnO1xyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBTY3JlZW5WaWV3IGZyb20gJy4uLy4uL2pvaXN0L2pzL1NjcmVlblZpZXcuanMnO1xyXG5pbXBvcnQgU2ltIGZyb20gJy4uLy4uL2pvaXN0L2pzL1NpbS5qcyc7XHJcbmltcG9ydCBnZXRHbG9iYWwgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL2dldEdsb2JhbC5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IENsb3NlQnV0dG9uIGZyb20gJy4uLy4uL3NjZW5lcnktcGhldC9qcy9idXR0b25zL0Nsb3NlQnV0dG9uLmpzJztcclxuaW1wb3J0IHsgQWxpZ25Cb3gsIEZvY3VzTWFuYWdlciwgRnVsbFNjcmVlbiwgSEJveCwgS2V5Ym9hcmRMaXN0ZW5lciwgTm9kZSwgUERPTVBlZXIsIFBET01VdGlscywgVENvbG9yLCBWQm94LCB2b2ljaW5nTWFuYWdlciB9IGZyb20gJy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBUU291bmRQbGF5ZXIgZnJvbSAnLi4vLi4vdGFtYm8vanMvVFNvdW5kUGxheWVyLmpzJztcclxuaW1wb3J0IGdlbmVyYWxDbG9zZVNvdW5kUGxheWVyIGZyb20gJy4uLy4uL3RhbWJvL2pzL3NoYXJlZC1zb3VuZC1wbGF5ZXJzL2dlbmVyYWxDbG9zZVNvdW5kUGxheWVyLmpzJztcclxuaW1wb3J0IGdlbmVyYWxPcGVuU291bmRQbGF5ZXIgZnJvbSAnLi4vLi4vdGFtYm8vanMvc2hhcmVkLXNvdW5kLXBsYXllcnMvZ2VuZXJhbE9wZW5Tb3VuZFBsYXllci5qcyc7XHJcbmltcG9ydCBudWxsU291bmRQbGF5ZXIgZnJvbSAnLi4vLi4vdGFtYm8vanMvc2hhcmVkLXNvdW5kLXBsYXllcnMvbnVsbFNvdW5kUGxheWVyLmpzJztcclxuaW1wb3J0IFRhbmRlbSwgeyBEWU5BTUlDX0FSQ0hFVFlQRV9OQU1FIH0gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcbmltcG9ydCBEeW5hbWljTWFya2VySU8gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL3R5cGVzL0R5bmFtaWNNYXJrZXJJTy5qcyc7XHJcbmltcG9ydCBJT1R5cGUgZnJvbSAnLi4vLi4vdGFuZGVtL2pzL3R5cGVzL0lPVHlwZS5qcyc7XHJcbmltcG9ydCBVdHRlcmFuY2UgZnJvbSAnLi4vLi4vdXR0ZXJhbmNlLXF1ZXVlL2pzL1V0dGVyYW5jZS5qcyc7XHJcbmltcG9ydCBCdXR0b25Ob2RlIGZyb20gJy4vYnV0dG9ucy9CdXR0b25Ob2RlLmpzJztcclxuaW1wb3J0IFBhbmVsLCB7IFBhbmVsT3B0aW9ucyB9IGZyb20gJy4vUGFuZWwuanMnO1xyXG5pbXBvcnQgUG9wdXBhYmxlLCB7IFBvcHVwYWJsZU9wdGlvbnMgfSBmcm9tICcuL1BvcHVwYWJsZS5qcyc7XHJcbmltcG9ydCBzdW4gZnJvbSAnLi9zdW4uanMnO1xyXG5pbXBvcnQgU3VuU3RyaW5ncyBmcm9tICcuL1N1blN0cmluZ3MuanMnO1xyXG5pbXBvcnQgVGlueVByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvVGlueVByb3BlcnR5LmpzJztcclxuaW1wb3J0IFRSZWFkT25seVByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgUGF0dGVyblN0cmluZ1Byb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvUGF0dGVyblN0cmluZ1Byb3BlcnR5LmpzJztcclxuXHJcbi8vIHNlZSBTZWxmT3B0aW9ucy50aXRsZUFsaWduXHJcbnR5cGUgRGlhbG9nVGl0bGVBbGlnbiA9ICdsZWZ0JyB8ICdyaWdodCcgfCAnY2VudGVyJztcclxuXHJcbi8qKlxyXG4gKiBzZWUgU2VsZk9wdGlvbnMubGF5b3V0U3RyYXRlZ3lcclxuICogQHBhcmFtIGRpYWxvZ1xyXG4gKiBAcGFyYW0gc2ltQm91bmRzIC0gc2VlIFNpbS5ib3VuZHNQcm9wZXJ0eVxyXG4gKiBAcGFyYW0gc2NyZWVuQm91bmRzIC0gc2VlIFNpbS5zY3JlZW5Cb3VuZHNQcm9wZXJ0eVxyXG4gKiBAcGFyYW0gc2NhbGUgLSBzZWUgU2ltLnNjYWxlUHJvcGVydHlcclxuICovXHJcbnR5cGUgRGlhbG9nTGF5b3V0U3RyYXRlZ3kgPSAoIGRpYWxvZzogRGlhbG9nLCBzaW1Cb3VuZHM6IEJvdW5kczIsIHNjcmVlbkJvdW5kczogQm91bmRzMiwgc2NhbGU6IG51bWJlciApID0+IHZvaWQ7XHJcblxyXG50eXBlIFNlbGZPcHRpb25zID0ge1xyXG5cclxuICAvKiBNYXJnaW5zIGFuZCBzcGFjaW5nOlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4SGVpZ2h0TWFyZ2luXHJcbiAgX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX1xyXG4gIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgfFxyXG4gIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvc2VCdXR0b24gfFxyXG4gIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wTWFyZ2luICAgICAgICAgICAgICAgICAgVG9wTWFyZ2luICAgfFxyXG4gIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICBffF9fXyAgICAgICAgfFxyXG4gIHwgICAgICAgICAgICAgICAgICBfX19fX19fX19fX19fX19fX19ffF9fX19fX19fX19fX19fX19fX19fICAgIHwgICAgIHwgICAgICAgfFxyXG5tIHwtLS0tLS0tLWwtLS0tLS0tLXwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfC14LXwgIFggIHwtLS1jLS0tfCBtXHJcbmEgfCAgICAgICAgZSAgICAgICAgfCAgIFRpdGxlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IFMgfF9fX19ffCAgIGwgICB8IGFcclxueCB8ICAgICAgICBmICAgICAgICB8X19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX3wgUCAgICAgICAgICAgbyAgIHwgeFxyXG5XIHwgICAgICAgIHQgICAgICAgIHwgICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBhICAgICAgICAgICBzICAgfCBXXHJcbmkgfCAgICAgICAgTSAgICAgICAgfCAgIHlTcGFjaW5nICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IGMgICAgICAgICAgIGUgICB8IGlcclxuZCB8ICAgICAgICBhICAgICAgICB8X19ffF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX3wgaSAgICAgICAgICAgQiAgIHwgZFxyXG50IHwgICAgICAgIHIgICAgICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBuICAgICAgICAgICB1ICAgfCB0XHJcbmggfCAgICAgICAgZyAgICAgICAgfCAgIENvbnRlbnQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IGcgICAgICAgICAgIHQgICB8IGhcclxuTSB8ICAgICAgICBpICAgICAgICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgdCAgIHwgTVxyXG5hIHwgICAgICAgIG4gICAgICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICBvICAgfCBhXHJcbnIgfCAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8ICAgICAgICAgICAgIG4gICB8IHJcclxuZyB8ICAgICAgICAgICAgICAgICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgUiAgIHwgZ1xyXG5pIHwgICAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICBpICAgfCBpXHJcbm4gfCAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8ICAgICAgICAgICAgIGcgICB8IG5cclxuICB8ICAgICAgICAgICAgICAgICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgaCAgIHxcclxuICB8ICAgICAgICAgICAgICAgICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgTSAgIHxcclxuICB8ICAgICAgICAgICAgICAgICB8X19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX3wgICAgICAgICAgICAgYSAgIHxcclxuICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgciAgIHxcclxuICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZyAgIHxcclxuICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvdHRvbU1hcmdpbiAgICAgICAgICAgICAgICAgICAgICAgaSAgIHxcclxuICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbiAgIHxcclxuICB8X19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX3xfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX3xcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhIZWlnaHRNYXJnaW5cclxuICovXHJcblxyXG4gIC8vIE1hcmdpbnMgYW5kIHNwYWNpbmdcclxuICB4U3BhY2luZz86IG51bWJlcjsgLy8gaG93IGZhciB0aGUgdGl0bGUgYW5kIGNvbnRlbnQgaXMgcGxhY2VkIHRvIHRoZSBsZWZ0IG9mIHRoZSBjbG9zZSBidXR0b25cclxuICB5U3BhY2luZz86IG51bWJlcjsgLy8gdmVydGljYWwgc3BhY2UgYmV0d2VlbiB0aXRsZSBhbmQgY29udGVudFxyXG4gIHRvcE1hcmdpbj86IG51bWJlcjsgLy8gbWFyZ2luIGFib3ZlIGNvbnRlbnQsIG9yIGFib3ZlIHRpdGxlIGlmIHByb3ZpZGVkXHJcbiAgYm90dG9tTWFyZ2luPzogbnVtYmVyOyAvLyBtYXJnaW4gYmVsb3cgY29udGVudFxyXG4gIGxlZnRNYXJnaW4/OiBudW1iZXIgfCBudWxsOyAvLyBtYXJnaW4gdG8gdGhlIGxlZnQgb2YgdGhlIGNvbnRlbnQuICBJZiBudWxsLCB0aGlzIGlzIGNvbXB1dGVkIHNvIHRoYXQgd2UgaGF2ZSB0aGUgc2FtZSBtYXJnaW5zIG9uIHRoZSBsZWZ0IGFuZCByaWdodCBvZiB0aGUgY29udGVudC5cclxuICBtYXhXaWR0aE1hcmdpbj86IG51bWJlcjsgLy8gdGhlIG1hcmdpbiBiZXR3ZWVuIHRoZSBsZWZ0L3JpZ2h0IG9mIHRoZSBsYXlvdXRCb3VuZHMgYW5kIHRoZSBkaWFsb2csIGlnbm9yZWQgaWYgbWF4V2lkdGggaXMgc3BlY2lmaWVkXHJcbiAgbWF4SGVpZ2h0TWFyZ2luPzogbnVtYmVyOyAvLyB0aGUgbWFyZ2luIGJldHdlZW4gdGhlIHRvcC9ib3R0b20gb2YgdGhlIGxheW91dEJvdW5kcyBhbmQgdGhlIGRpYWxvZywgaWdub3JlZCBpZiBtYXhIZWlnaHQgaXMgc3BlY2lmaWVkXHJcbiAgY2xvc2VCdXR0b25MZW5ndGg/OiBudW1iZXI7IC8vIHdpZHRoIG9mIHRoZSBjbG9zZSBidXR0b25cclxuICBjbG9zZUJ1dHRvblRvcE1hcmdpbj86IG51bWJlcjsgLy8gbWFyZ2luIGFib3ZlIHRoZSBjbG9zZSBidXR0b25cclxuICBjbG9zZUJ1dHRvblJpZ2h0TWFyZ2luPzogbnVtYmVyOyAvLyBtYXJnaW4gdG8gdGhlIHJpZ2h0IG9mIHRoZSBjbG9zZSBidXR0b25cclxuXHJcbiAgLy8gdGl0bGVcclxuICB0aXRsZT86IE5vZGUgfCBudWxsOyAvLyBUaXRsZSB0byBiZSBkaXNwbGF5ZWQgYXQgdG9wLiBGb3IgYTExeSwgaXRzIHByaW1hcnkgc2libGluZyBtdXN0IGhhdmUgYW4gYWNjZXNzaWJsZSBuYW1lLlxyXG4gIHRpdGxlQWxpZ24/OiBEaWFsb2dUaXRsZUFsaWduOyAvLyBob3Jpem9udGFsIGFsaWdubWVudFxyXG5cclxuICAvLyBCeSBkZWZhdWx0LCB0aGUgYWNjZXNzaWJsZSBuYW1lIG9mIHRoaXMgZGlhbG9nIGlzIHRoZSBjb250ZW50IG9mIHRoZSB0aXRsZS4gU29tZSBkaWFsb2dzIHdhbnQgdG8gb3B0IG91dFxyXG4gIC8vIG9mIHByb3ZpZGluZyB0aGUgZGVmYXVsdCBhY2Nlc3NpYmxlIG5hbWUgZm9yIHRoZSBkaWFsb2csIG9wdGluZyB0byBpbnN0ZWFkIG1hbmFnZSB0aGUgYWNjZXNzaWJsZSBuYW1lXHJcbiAgLy8gdGhlbXNlbHZlcywgZm9yIGV4YW1wbGUgc2VlIEtleWJvYXJkSGVscERpYWxvZyBhbmQgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnktcGhldC9pc3N1ZXMvNDk0XHJcbiAgYWRkQXJpYUxhYmVsbGVkQnlGcm9tVGl0bGU/OiBib29sZWFuO1xyXG5cclxuICAvLyBTZXRzIHRoZSBkaWFsb2cncyBwb3NpdGlvbiBpbiBnbG9iYWwgY29vcmRpbmF0ZXMuXHJcbiAgbGF5b3V0U3RyYXRlZ3k/OiBEaWFsb2dMYXlvdXRTdHJhdGVneTtcclxuXHJcbiAgLy8gY2xvc2UgYnV0dG9uIG9wdGlvbnNcclxuICBjbG9zZUJ1dHRvbkxpc3RlbmVyPzogKCkgPT4gdm9pZDtcclxuICBjbG9zZUJ1dHRvbkNvbG9yPzogVENvbG9yO1xyXG4gIGNsb3NlQnV0dG9uVG91Y2hBcmVhWERpbGF0aW9uPzogbnVtYmVyO1xyXG4gIGNsb3NlQnV0dG9uVG91Y2hBcmVhWURpbGF0aW9uPzogbnVtYmVyO1xyXG4gIGNsb3NlQnV0dG9uTW91c2VBcmVhWERpbGF0aW9uPzogbnVtYmVyO1xyXG4gIGNsb3NlQnV0dG9uTW91c2VBcmVhWURpbGF0aW9uPzogbnVtYmVyO1xyXG5cclxuICAvLyBJZiBwcm92aWRlZCB1c2UgdGhpcyBkaWFsb2cgdGl0bGUgaW4gdGhlIENsb3NlIGJ1dHRvbiB2b2ljaW5nTmFtZVJlc3BvbnNlLiBUaGlzIHNob3VsZCBiZSBwcm92aWRlZFxyXG4gIC8vIGZvciBwcm9wZXIgRGlhbG9nIFZvaWNpbmcgZGVzaWduLlxyXG4gIGNsb3NlQnV0dG9uVm9pY2luZ0RpYWxvZ1RpdGxlPzogc3RyaW5nIHwgVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nPiB8IG51bGw7XHJcblxyXG4gIC8vIEJ5IGRlZmF1bHQsIHRoZSBjbG9zZSBidXR0b24gaXMgcGxhY2VkIGZpcnN0IGluIHRoZSBQRE9NT3JkZXIgKGFuZCB0aHVzIHRoZSBmb2N1cyBvcmRlcikuIFNldCB0aGlzIHRvIHRydWVcclxuICAvLyBpZiB5b3Ugd2FudCB0aGUgY2xvc2UgYnV0dG9uIHRvIGJlIHRoZSBsYXN0IGVsZW1lbnQgaW4gdGhlIGZvY3VzIG9yZGVyIGZvciB0aGUgRGlhbG9nLlxyXG4gIGNsb3NlQnV0dG9uTGFzdEluUERPTT86IGJvb2xlYW47XHJcblxyXG4gIC8vIHNvdW5kIGdlbmVyYXRpb25cclxuICBvcGVuZWRTb3VuZFBsYXllcj86IFRTb3VuZFBsYXllcjtcclxuICBjbG9zZWRTb3VuZFBsYXllcj86IFRTb3VuZFBsYXllcjtcclxuXHJcbiAgc2ltPzogU2ltO1xyXG5cclxuICAvLyBDYWxsZWQgYWZ0ZXIgdGhlIGRpYWxvZyBpcyBzaG93biwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9qb2lzdC9pc3N1ZXMvNDc4XHJcbiAgc2hvd0NhbGxiYWNrPzogKCAoKSA9PiB2b2lkICkgfCBudWxsO1xyXG5cclxuICAvLyBDYWxsZWQgYWZ0ZXIgdGhlIGRpYWxvZyBpcyBoaWRkZW4sIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzQ3OFxyXG4gIGhpZGVDYWxsYmFjaz86ICggKCkgPT4gdm9pZCApIHwgbnVsbDtcclxufTtcclxuXHJcbnR5cGUgUGFyZW50T3B0aW9ucyA9IFBhbmVsT3B0aW9ucyAmIFBvcHVwYWJsZU9wdGlvbnM7XHJcblxyXG5leHBvcnQgdHlwZSBEaWFsb2dPcHRpb25zID0gU2VsZk9wdGlvbnMgJiBTdHJpY3RPbWl0PFBhcmVudE9wdGlvbnMsICd4TWFyZ2luJyB8ICd5TWFyZ2luJz47XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEaWFsb2cgZXh0ZW5kcyBQb3B1cGFibGUoIFBhbmVsLCAxICkge1xyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IGNsb3NlQnV0dG9uOiBDbG9zZUJ1dHRvbjtcclxuICBwcml2YXRlIHJlYWRvbmx5IHNpbTogU2ltO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzcG9zZURpYWxvZzogKCkgPT4gdm9pZDtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIGNvbnRlbnQgLSBUaGUgY29udGVudCB0byBkaXNwbGF5IGluc2lkZSB0aGUgZGlhbG9nIChub3QgaW5jbHVkaW5nIHRoZSB0aXRsZSlcclxuICAgKiBAcGFyYW0gcHJvdmlkZWRPcHRpb25zXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBjb250ZW50OiBOb2RlLCBwcm92aWRlZE9wdGlvbnM/OiBEaWFsb2dPcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8RGlhbG9nT3B0aW9ucywgU2VsZk9wdGlvbnMsIFBhcmVudE9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgIC8vIERpYWxvZ09wdGlvbnNcclxuICAgICAgeFNwYWNpbmc6IDEwLFxyXG4gICAgICB5U3BhY2luZzogMTAsXHJcbiAgICAgIHRvcE1hcmdpbjogMTUsXHJcbiAgICAgIGJvdHRvbU1hcmdpbjogMTUsXHJcbiAgICAgIGxlZnRNYXJnaW46IG51bGwsXHJcbiAgICAgIG1heFdpZHRoTWFyZ2luOiAxMixcclxuICAgICAgbWF4SGVpZ2h0TWFyZ2luOiAxMixcclxuICAgICAgY2xvc2VCdXR0b25MZW5ndGg6IDE4LjIsXHJcbiAgICAgIGNsb3NlQnV0dG9uVG9wTWFyZ2luOiAxMCxcclxuICAgICAgY2xvc2VCdXR0b25SaWdodE1hcmdpbjogMTAsXHJcbiAgICAgIHRpdGxlOiBudWxsLFxyXG4gICAgICB0aXRsZUFsaWduOiAnY2VudGVyJyxcclxuICAgICAgYWRkQXJpYUxhYmVsbGVkQnlGcm9tVGl0bGU6IHRydWUsXHJcbiAgICAgIGxheW91dFN0cmF0ZWd5OiBkZWZhdWx0TGF5b3V0U3RyYXRlZ3ksXHJcbiAgICAgIGNsb3NlQnV0dG9uTGlzdGVuZXI6ICgpID0+IHRoaXMuaGlkZSgpLFxyXG4gICAgICBjbG9zZUJ1dHRvbkNvbG9yOiAnYmxhY2snLFxyXG4gICAgICBjbG9zZUJ1dHRvblRvdWNoQXJlYVhEaWxhdGlvbjogMCxcclxuICAgICAgY2xvc2VCdXR0b25Ub3VjaEFyZWFZRGlsYXRpb246IDAsXHJcbiAgICAgIGNsb3NlQnV0dG9uTW91c2VBcmVhWERpbGF0aW9uOiAwLFxyXG4gICAgICBjbG9zZUJ1dHRvbk1vdXNlQXJlYVlEaWxhdGlvbjogMCxcclxuICAgICAgY2xvc2VCdXR0b25Wb2ljaW5nRGlhbG9nVGl0bGU6IG51bGwsXHJcbiAgICAgIGNsb3NlQnV0dG9uTGFzdEluUERPTTogZmFsc2UsXHJcbiAgICAgIG9wZW5lZFNvdW5kUGxheWVyOiBnZW5lcmFsT3BlblNvdW5kUGxheWVyLFxyXG4gICAgICBjbG9zZWRTb3VuZFBsYXllcjogZ2VuZXJhbENsb3NlU291bmRQbGF5ZXIsXHJcbiAgICAgIHNpbTogZ2V0R2xvYmFsKCAncGhldC5qb2lzdC5zaW0nICksXHJcbiAgICAgIHNob3dDYWxsYmFjazogbnVsbCxcclxuICAgICAgaGlkZUNhbGxiYWNrOiBudWxsLFxyXG5cclxuICAgICAgLy8gUG9wdXBhYmxlT3B0aW9uc1xyXG4gICAgICBsYXlvdXRCb3VuZHM6IFNjcmVlblZpZXcuREVGQVVMVF9MQVlPVVRfQk9VTkRTLFxyXG4gICAgICBmb2N1c09uU2hvd05vZGU6IG51bGwsXHJcblxyXG4gICAgICAvLyBQYW5lbE9wdGlvbnNcclxuICAgICAgY29ybmVyUmFkaXVzOiAxMCwgLy8ge251bWJlcn0gcmFkaXVzIG9mIHRoZSBkaWFsb2cncyBjb3JuZXJzXHJcbiAgICAgIHJlc2l6ZTogdHJ1ZSwgLy8ge2Jvb2xlYW59IHdoZXRoZXIgdG8gcmVzaXplIGlmIGNvbnRlbnQncyBzaXplIGNoYW5nZXNcclxuICAgICAgZmlsbDogJ3doaXRlJywgLy8ge3N0cmluZ3xDb2xvcn1cclxuICAgICAgc3Ryb2tlOiAnYmxhY2snLCAvLyB7c3RyaW5nfENvbG9yfVxyXG4gICAgICBiYWNrZ3JvdW5kUGlja2FibGU6IHRydWUsXHJcbiAgICAgIG1heEhlaWdodDogbnVsbCwgLy8gaWYgbm90IHByb3ZpZGVkLCB0aGVuIGR5bmFtaWNhbGx5IGNhbGN1bGF0ZSBiYXNlZCBvbiB0aGUgbGF5b3V0Qm91bmRzIG9mIHRoZSBjdXJyZW50IHNjcmVlbiwgc2VlIHVwZGF0ZUxheW91dE11bHRpbGlua1xyXG4gICAgICBtYXhXaWR0aDogbnVsbCwgLy8gaWYgbm90IHByb3ZpZGVkLCB0aGVuIGR5bmFtaWNhbGx5IGNhbGN1bGF0ZSBiYXNlZCBvbiB0aGUgbGF5b3V0Qm91bmRzIG9mIHRoZSBjdXJyZW50IHNjcmVlbiwgc2VlIHVwZGF0ZUxheW91dE11bHRpbGlua1xyXG5cclxuICAgICAgLy8gcGhldC1pb1xyXG4gICAgICB0YW5kZW1OYW1lU3VmZml4OiBbICdEaWFsb2cnLCBEWU5BTUlDX0FSQ0hFVFlQRV9OQU1FIF0sIC8vIERZTkFNSUNfQVJDSEVUWVBFX05BTUUgbWVhbnMgdGhhdCB0aGlzIERpYWxvZyBpcyBhbiBhcmNoZXR5cGUuXHJcbiAgICAgIHBoZXRpb1R5cGU6IERpYWxvZy5EaWFsb2dJTyxcclxuICAgICAgcGhldGlvU3RhdGU6IHRydWUsIC8vIERpYWxvZyBpcyBvZnRlbiBhIGR5bmFtaWMgZWxlbWVudCwgYW5kIHRodXMgbmVlZHMgdG8gYmUgaW4gc3RhdGUgdG8gdHJpZ2dlciBlbGVtZW50IGNyZWF0aW9uLlxyXG4gICAgICBwaGV0aW9WaXNpYmxlUHJvcGVydHlJbnN0cnVtZW50ZWQ6IGZhbHNlLCAvLyB2aXNpYmxlIGlzbid0IHRvZ2dsZWQgd2hlbiBzaG93aW5nIGEgRGlhbG9nXHJcblxyXG4gICAgICAvLyBwZG9tIG9wdGlvbnNcclxuICAgICAgdGFnTmFtZTogJ2RpdicsXHJcbiAgICAgIGFyaWFSb2xlOiAnZGlhbG9nJ1xyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5zaW0sICdzaW0gbXVzdCBiZSBwcm92aWRlZCwgYXMgRGlhbG9nIG5lZWRzIGEgU2ltIGluc3RhbmNlJyApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG9wdGlvbnMueE1hcmdpbiA9PT0gdW5kZWZpbmVkLCAnRGlhbG9nIHNldHMgeE1hcmdpbicgKTtcclxuICAgIG9wdGlvbnMueE1hcmdpbiA9IDA7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLnlNYXJnaW4gPT09IHVuZGVmaW5lZCwgJ0RpYWxvZyBzZXRzIHlNYXJnaW4nICk7XHJcbiAgICBvcHRpb25zLnlNYXJnaW4gPSAwO1xyXG5cclxuICAgIC8vIGlmIGxlZnQgbWFyZ2luIGlzIHNwZWNpZmllZCBpbiBvcHRpb25zLCB1c2UgaXQuIG90aGVyd2lzZSwgc2V0IGl0IHRvIG1ha2UgdGhlIGxlZnQgcmlnaHQgZ3V0dGVycyBzeW1tZXRyaWNhbFxyXG4gICAgaWYgKCBvcHRpb25zLmxlZnRNYXJnaW4gPT09IG51bGwgKSB7XHJcbiAgICAgIG9wdGlvbnMubGVmdE1hcmdpbiA9IG9wdGlvbnMueFNwYWNpbmcgKyBvcHRpb25zLmNsb3NlQnV0dG9uTGVuZ3RoICsgb3B0aW9ucy5jbG9zZUJ1dHRvblJpZ2h0TWFyZ2luO1xyXG4gICAgfVxyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG9wdGlvbnMubWF4SGVpZ2h0ID09PSBudWxsIHx8IHR5cGVvZiBvcHRpb25zLm1heEhlaWdodCA9PT0gJ251bWJlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG9wdGlvbnMubWF4V2lkdGggPT09IG51bGwgfHwgdHlwZW9mIG9wdGlvbnMubWF4V2lkdGggPT09ICdudW1iZXInICk7XHJcblxyXG4gICAgLy8gQXBwbHkgbWF4V2lkdGgvbWF4SGVpZ2h0IGRlcGVuZGluZyBvbiB0aGUgbWFyZ2lucyBhbmQgbGF5b3V0Qm91bmRzXHJcbiAgICBpZiAoICFvcHRpb25zLm1heFdpZHRoICYmIG9wdGlvbnMubGF5b3V0Qm91bmRzICkge1xyXG4gICAgICBvcHRpb25zLm1heFdpZHRoID0gYXBwbHlEb3VibGVNYXJnaW4oIG9wdGlvbnMubGF5b3V0Qm91bmRzLndpZHRoLCBvcHRpb25zLm1heFdpZHRoTWFyZ2luICk7XHJcbiAgICB9XHJcbiAgICBpZiAoICFvcHRpb25zLm1heEhlaWdodCAmJiBvcHRpb25zLmxheW91dEJvdW5kcyApIHtcclxuICAgICAgb3B0aW9ucy5tYXhIZWlnaHQgPSBhcHBseURvdWJsZU1hcmdpbiggb3B0aW9ucy5sYXlvdXRCb3VuZHMuaGVpZ2h0LCBvcHRpb25zLm1heEhlaWdodE1hcmdpbiApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFdlIG5lZWQgYW4gXCJ1bmF0dGFjaGVkXCIgdXR0ZXJhbmNlIHNvIHRoYXQgd2hlbiB0aGUgY2xvc2UgYnV0dG9uIGZpcmVzLCBoaWRpbmcgdGhlIGNsb3NlIGJ1dHRvbiwgd2Ugc3RpbGwgaGVhclxyXG4gICAgLy8gdGhlIGNvbnRleHQgcmVzcG9uc2UuIEJ1dCB3ZSBzdGlsbCBzaG91bGQgb25seSBoZWFyIHRoaXMgY29udGV4dCByZXNwb25zZSB3aGVuIFwiU2ltIFZvaWNpbmdcIiBpcyBlbmFibGVkLlxyXG4gICAgY29uc3QgY29udGV4dFJlc3BvbnNlVXR0ZXJhbmNlID0gbmV3IFV0dGVyYW5jZSgge1xyXG4gICAgICBwcmlvcml0eTogVXR0ZXJhbmNlLk1FRElVTV9QUklPUklUWSxcclxuICAgICAgdm9pY2luZ0NhbkFubm91bmNlUHJvcGVydGllczogWyB2b2ljaW5nTWFuYWdlci52b2ljaW5nRnVsbHlFbmFibGVkUHJvcGVydHkgXVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIGNyZWF0ZSBjbG9zZSBidXR0b24gLSBhIGZsYXQgXCJYXCJcclxuICAgIGNvbnN0IGNsb3NlQnV0dG9uID0gbmV3IENsb3NlQnV0dG9uKCB7XHJcbiAgICAgIGljb25MZW5ndGg6IG9wdGlvbnMuY2xvc2VCdXR0b25MZW5ndGgsXHJcbiAgICAgIGJhc2VDb2xvcjogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgYnV0dG9uQXBwZWFyYW5jZVN0cmF0ZWd5OiBCdXR0b25Ob2RlLkZsYXRBcHBlYXJhbmNlU3RyYXRlZ3ksXHJcblxyXG4gICAgICAvLyBubyBtYXJnaW5zIHNpbmNlIHRoZSBmbGF0IFggdGFrZXMgdXAgYWxsIHRoZSBzcGFjZVxyXG4gICAgICB4TWFyZ2luOiAwLFxyXG4gICAgICB5TWFyZ2luOiAwLFxyXG5cclxuICAgICAgbGlzdGVuZXI6ICgpID0+IHtcclxuXHJcbiAgICAgICAgLy8gQ29udGV4dCByZXNwb25zZSBmaXJzdCwgYmVmb3JlIHBvdGVudGlhbGx5IGNoYW5naW5nIGZvY3VzIHdpdGggdGhlIGNhbGxiYWNrIGxpc3RlbmVyXHJcbiAgICAgICAgY2xvc2VCdXR0b24udm9pY2luZ1NwZWFrQ29udGV4dFJlc3BvbnNlKCB7XHJcbiAgICAgICAgICB1dHRlcmFuY2U6IGNvbnRleHRSZXNwb25zZVV0dGVyYW5jZVxyXG4gICAgICAgIH0gKTtcclxuXHJcbiAgICAgICAgb3B0aW9ucy5jbG9zZUJ1dHRvbkxpc3RlbmVyKCk7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBwYXRoT3B0aW9uczoge1xyXG4gICAgICAgIHN0cm9rZTogb3B0aW9ucy5jbG9zZUJ1dHRvbkNvbG9yXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBwaGV0LWlvXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0/LmNyZWF0ZVRhbmRlbSggJ2Nsb3NlQnV0dG9uJyApLFxyXG4gICAgICBwaGV0aW9TdGF0ZTogZmFsc2UsIC8vIGNsb3NlIGJ1dHRvbiBzaG91bGQgbm90IGJlIGluIHN0YXRlXHJcblxyXG4gICAgICAvLyBJdCBpcyBhIHVzYWJpbGl0eSBjb25jZXJuIHRvIGNoYW5nZSBlaXRoZXIgb2YgdGhlc2UsIGFsc28gdGhlcmUgYXJlIG90aGVyIHdheXMgdG8gZXhpdCBhIERpYWxvZywgc28gdXNpbmdcclxuICAgICAgLy8gdGhlc2UgaXMgYnVnZ3kuXHJcbiAgICAgIHBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZDogZmFsc2UsXHJcbiAgICAgIHBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZDogZmFsc2UsXHJcblxyXG4gICAgICAvLyB0dXJuIG9mZiBkZWZhdWx0IHNvdW5kIGdlbmVyYXRpb24sIERpYWxvZyB3aWxsIGNyZWF0ZSBpdHMgb3duIHNvdW5kc1xyXG4gICAgICBzb3VuZFBsYXllcjogbnVsbFNvdW5kUGxheWVyLFxyXG5cclxuICAgICAgLy8gcGRvbVxyXG4gICAgICB0YWdOYW1lOiAnYnV0dG9uJyxcclxuICAgICAgaW5uZXJDb250ZW50OiBTdW5TdHJpbmdzLmExMXkuY2xvc2VTdHJpbmdQcm9wZXJ0eSxcclxuXHJcbiAgICAgIC8vIHZvaWNpbmdcclxuICAgICAgdm9pY2luZ0NvbnRleHRSZXNwb25zZTogU3VuU3RyaW5ncy5hMTF5LmNsb3NlZFN0cmluZ1Byb3BlcnR5XHJcbiAgICB9ICk7XHJcblxyXG5cclxuICAgIGxldCBjbG9zZUJ1dHRvblZvaWNpbmdOYW1lUmVzcG9uc2VQcm9wZXJ0eTogUGF0dGVyblN0cmluZ1Byb3BlcnR5PHsgdGl0bGU6IFRSZWFkT25seVByb3BlcnR5PHN0cmluZz4gfT47XHJcbiAgICBpZiAoIG9wdGlvbnMuY2xvc2VCdXR0b25Wb2ljaW5nRGlhbG9nVGl0bGUgKSB7XHJcbiAgICAgIGNvbnN0IHRpdGxlUHJvcGVydHkgPSB0eXBlb2Ygb3B0aW9ucy5jbG9zZUJ1dHRvblZvaWNpbmdEaWFsb2dUaXRsZSA9PT0gJ3N0cmluZycgPyBuZXcgVGlueVByb3BlcnR5KCBvcHRpb25zLmNsb3NlQnV0dG9uVm9pY2luZ0RpYWxvZ1RpdGxlICkgOiBvcHRpb25zLmNsb3NlQnV0dG9uVm9pY2luZ0RpYWxvZ1RpdGxlO1xyXG4gICAgICBjbG9zZUJ1dHRvblZvaWNpbmdOYW1lUmVzcG9uc2VQcm9wZXJ0eSA9IGNsb3NlQnV0dG9uLnZvaWNpbmdOYW1lUmVzcG9uc2UgPSBuZXcgUGF0dGVyblN0cmluZ1Byb3BlcnR5KCBTdW5TdHJpbmdzLmExMXkudGl0bGVDbG9zZVBhdHRlcm5TdHJpbmdQcm9wZXJ0eSwgeyB0aXRsZTogdGl0bGVQcm9wZXJ0eSB9LCB7IHRhbmRlbTogVGFuZGVtLk9QVF9PVVQgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHRvdWNoL21vdXNlIGFyZWFzIGZvciB0aGUgY2xvc2UgYnV0dG9uXHJcbiAgICBjbG9zZUJ1dHRvbi50b3VjaEFyZWEgPSBjbG9zZUJ1dHRvbi5ib3VuZHMuZGlsYXRlZFhZKFxyXG4gICAgICBvcHRpb25zLmNsb3NlQnV0dG9uVG91Y2hBcmVhWERpbGF0aW9uLFxyXG4gICAgICBvcHRpb25zLmNsb3NlQnV0dG9uVG91Y2hBcmVhWURpbGF0aW9uXHJcbiAgICApO1xyXG4gICAgY2xvc2VCdXR0b24ubW91c2VBcmVhID0gY2xvc2VCdXR0b24uYm91bmRzLmRpbGF0ZWRYWShcclxuICAgICAgb3B0aW9ucy5jbG9zZUJ1dHRvbk1vdXNlQXJlYVhEaWxhdGlvbixcclxuICAgICAgb3B0aW9ucy5jbG9zZUJ1dHRvbk1vdXNlQXJlYVlEaWxhdGlvblxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBwZG9tIC0gc2V0IHRoZSBvcmRlciBvZiBjb250ZW50LCBjbG9zZSBidXR0b24gZmlyc3Qgc28gcmVtYWluaW5nIGNvbnRlbnQgY2FuIGJlIHJlYWQgZnJvbSB0b3AgdG8gYm90dG9tXHJcbiAgICAvLyB3aXRoIHZpcnR1YWwgY3Vyc29yXHJcbiAgICBsZXQgcGRvbU9yZGVyID0gWyBvcHRpb25zLnRpdGxlLCBjb250ZW50IF07XHJcbiAgICBvcHRpb25zLmNsb3NlQnV0dG9uTGFzdEluUERPTSA/IHBkb21PcmRlci5wdXNoKCBjbG9zZUJ1dHRvbiApIDogcGRvbU9yZGVyLnVuc2hpZnQoIGNsb3NlQnV0dG9uICk7XHJcbiAgICBwZG9tT3JkZXIgPSBwZG9tT3JkZXIuZmlsdGVyKCBub2RlID0+IG5vZGUgIT09IHVuZGVmaW5lZCAmJiBub2RlICE9PSBudWxsICk7XHJcblxyXG4gICAgLy8gcGRvbSAtIGZhbGwgYmFjayB0byBmb2N1c2luZyB0aGUgY2xvc2VCdXR0b24gYnkgZGVmYXVsdCBpZiB0aGVyZSBpcyBubyBmb2N1c09uU2hvd05vZGUgb3IgdGhlXHJcbiAgICAvLyBjb250ZW50IGlzIG5vdCBmb2N1c2FibGVcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHBkb21PcmRlclsgMCBdICk7XHJcbiAgICBvcHRpb25zLmZvY3VzT25TaG93Tm9kZSA9IG9wdGlvbnMuZm9jdXNPblNob3dOb2RlID8gb3B0aW9ucy5mb2N1c09uU2hvd05vZGUgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZG9tT3JkZXJbIDAgXSEuZm9jdXNhYmxlID8gcGRvbU9yZGVyWyAwIF0gOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9zZUJ1dHRvbjtcclxuXHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5mb2N1c09uU2hvd05vZGUgaW5zdGFuY2VvZiBOb2RlLCAnc2hvdWxkIGJlIG5vbi1udWxsIGFuZCBkZWZpbmVkJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5mb2N1c09uU2hvd05vZGUhLmZvY3VzYWJsZSwgJ2ZvY3VzT25TaG93Tm9kZSBtdXN0IGJlIGZvY3VzYWJsZS4nICk7XHJcblxyXG4gICAgLy8gQWxpZ24gY29udGVudCwgdGl0bGUsIGFuZCBjbG9zZSBidXR0b24gdXNpbmcgc3BhY2luZyBhbmQgbWFyZ2luIG9wdGlvbnNcclxuXHJcbiAgICAvLyBhbGlnbiBjb250ZW50IGFuZCB0aXRsZSAoaWYgcHJvdmlkZWQpIHZlcnRpY2FsbHlcclxuICAgIGNvbnN0IGNvbnRlbnRBbmRUaXRsZSA9IG5ldyBWQm94KCB7XHJcbiAgICAgIGNoaWxkcmVuOiBvcHRpb25zLnRpdGxlID8gWyBvcHRpb25zLnRpdGxlLCBjb250ZW50IF0gOiBbIGNvbnRlbnQgXSxcclxuICAgICAgc3BhY2luZzogb3B0aW9ucy55U3BhY2luZyxcclxuICAgICAgYWxpZ246IG9wdGlvbnMudGl0bGVBbGlnblxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIGFkZCB0b3BNYXJnaW4sIGJvdHRvbU1hcmdpbiwgYW5kIGxlZnRNYXJnaW5cclxuICAgIGNvbnN0IGNvbnRlbnRBbmRUaXRsZVdpdGhNYXJnaW5zID0gbmV3IEFsaWduQm94KCBjb250ZW50QW5kVGl0bGUsIHtcclxuICAgICAgdG9wTWFyZ2luOiBvcHRpb25zLnRvcE1hcmdpbixcclxuICAgICAgYm90dG9tTWFyZ2luOiBvcHRpb25zLmJvdHRvbU1hcmdpbixcclxuICAgICAgbGVmdE1hcmdpbjogb3B0aW9ucy5sZWZ0TWFyZ2luXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gYWRkIGNsb3NlQnV0dG9uVG9wTWFyZ2luIGFuZCBjbG9zZUJ1dHRvblJpZ2h0TWFyZ2luXHJcbiAgICBjb25zdCBjbG9zZUJ1dHRvbldpdGhNYXJnaW5zID0gbmV3IEFsaWduQm94KCBjbG9zZUJ1dHRvbiwge1xyXG4gICAgICB0b3BNYXJnaW46IG9wdGlvbnMuY2xvc2VCdXR0b25Ub3BNYXJnaW4sXHJcbiAgICAgIHJpZ2h0TWFyZ2luOiBvcHRpb25zLmNsb3NlQnV0dG9uUmlnaHRNYXJnaW5cclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBjcmVhdGUgY29udGVudCBmb3IgUGFuZWxcclxuICAgIGNvbnN0IGRpYWxvZ0NvbnRlbnQgPSBuZXcgSEJveCgge1xyXG4gICAgICBjaGlsZHJlbjogWyBjb250ZW50QW5kVGl0bGVXaXRoTWFyZ2lucywgY2xvc2VCdXR0b25XaXRoTWFyZ2lucyBdLFxyXG4gICAgICBzcGFjaW5nOiBvcHRpb25zLnhTcGFjaW5nLFxyXG4gICAgICBhbGlnbjogJ3RvcCdcclxuICAgIH0gKTtcclxuXHJcbiAgICBzdXBlciggZGlhbG9nQ29udGVudCwgb3B0aW9ucyApO1xyXG5cclxuICAgIC8vIFRoZSBEaWFsb2cncyBkaXNwbGF5IHJ1bnMgb24gdGhpcyBQcm9wZXJ0eSwgc28gYWRkIHRoZSBsaXN0ZW5lciB0aGF0IGNvbnRyb2xzIHNob3cvaGlkZS5cclxuICAgIHRoaXMuaXNTaG93aW5nUHJvcGVydHkubGF6eUxpbmsoIGlzU2hvd2luZyA9PiB7XHJcbiAgICAgIGlmICggaXNTaG93aW5nICkge1xyXG4gICAgICAgIC8vIHNvdW5kIGdlbmVyYXRpb25cclxuICAgICAgICBvcHRpb25zLm9wZW5lZFNvdW5kUGxheWVyLnBsYXkoKTtcclxuXHJcbiAgICAgICAgLy8gRG8gdGhpcyBsYXN0XHJcbiAgICAgICAgb3B0aW9ucy5zaG93Q2FsbGJhY2sgJiYgb3B0aW9ucy5zaG93Q2FsbGJhY2soKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICAvLyBzb3VuZCBnZW5lcmF0aW9uXHJcbiAgICAgICAgb3B0aW9ucy5jbG9zZWRTb3VuZFBsYXllci5wbGF5KCk7XHJcblxyXG4gICAgICAgIC8vIERvIHRoaXMgbGFzdFxyXG4gICAgICAgIG9wdGlvbnMuaGlkZUNhbGxiYWNrICYmIG9wdGlvbnMuaGlkZUNhbGxiYWNrKCk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLnNpbSA9IG9wdGlvbnMuc2ltO1xyXG4gICAgdGhpcy5jbG9zZUJ1dHRvbiA9IGNsb3NlQnV0dG9uO1xyXG5cclxuICAgIGNvbnN0IHVwZGF0ZUxheW91dE11bHRpbGluayA9IE11bHRpbGluay5tdWx0aWxpbmsoIFtcclxuICAgICAgdGhpcy5zaW0uYm91bmRzUHJvcGVydHksXHJcbiAgICAgIHRoaXMuc2ltLnNjcmVlbkJvdW5kc1Byb3BlcnR5LFxyXG4gICAgICB0aGlzLnNpbS5zY2FsZVByb3BlcnR5LFxyXG4gICAgICB0aGlzLnNpbS5zZWxlY3RlZFNjcmVlblByb3BlcnR5LFxyXG4gICAgICB0aGlzLmlzU2hvd2luZ1Byb3BlcnR5LFxyXG4gICAgICB0aGlzLmxvY2FsQm91bmRzUHJvcGVydHlcclxuICAgIF0sICggYm91bmRzLCBzY3JlZW5Cb3VuZHMsIHNjYWxlICkgPT4ge1xyXG4gICAgICBpZiAoIGJvdW5kcyAmJiBzY3JlZW5Cb3VuZHMgJiYgc2NhbGUgKSB7XHJcbiAgICAgICAgb3B0aW9ucy5sYXlvdXRTdHJhdGVneSggdGhpcywgYm91bmRzLCBzY3JlZW5Cb3VuZHMsIHNjYWxlICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBTZXR0ZXIgYWZ0ZXIgdGhlIHN1cGVyIGNhbGxcclxuICAgIHRoaXMucGRvbU9yZGVyID0gcGRvbU9yZGVyO1xyXG5cclxuICAgIC8vIHBkb20gLSBzZXQgdGhlIGFyaWEtbGFiZWxsZWRieSByZWxhdGlvbiBzbyB0aGF0IHdoZW5ldmVyIGZvY3VzIGVudGVycyB0aGUgZGlhbG9nIHRoZSB0aXRsZSBpcyByZWFkXHJcbiAgICBpZiAoIG9wdGlvbnMudGl0bGUgJiYgb3B0aW9ucy50aXRsZS50YWdOYW1lICYmIG9wdGlvbnMuYWRkQXJpYUxhYmVsbGVkQnlGcm9tVGl0bGUgKSB7XHJcbiAgICAgIHRoaXMuYWRkQXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbigge1xyXG4gICAgICAgIHRoaXNFbGVtZW50TmFtZTogUERPTVBlZXIuUFJJTUFSWV9TSUJMSU5HLFxyXG4gICAgICAgIG90aGVyTm9kZTogb3B0aW9ucy50aXRsZSxcclxuICAgICAgICBvdGhlckVsZW1lbnROYW1lOiBQRE9NUGVlci5QUklNQVJZX1NJQkxJTkdcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHBkb20gLSBjbG9zZSB0aGUgZGlhbG9nIHdoZW4gcHJlc3NpbmcgXCJlc2NhcGVcIlxyXG4gICAgY29uc3Qga2V5Ym9hcmRMaXN0ZW5lciA9IG5ldyBLZXlib2FyZExpc3RlbmVyKCB7XHJcbiAgICAgIGtleXM6IFsgJ2VzY2FwZScsICd0YWInLCAnc2hpZnQrdGFiJyBdLFxyXG4gICAgICBmaXJlOiAoIGV2ZW50LCBrZXlzUHJlc3NlZCApID0+IHtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBldmVudCwgJ2V2ZW50IHNob3VsZCBiZSBub24tbnVsbCBhbmQgZGVmaW5lZCBmb3IgdGhpcyBsaXN0ZW5lcicgKTtcclxuICAgICAgICBjb25zdCBkb21FdmVudCA9IGV2ZW50ITtcclxuXHJcbiAgICAgICAgaWYgKCBrZXlzUHJlc3NlZCA9PT0gJ2VzY2FwZScgKSB7XHJcbiAgICAgICAgICBkb21FdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgdGhpcy5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCAoIGtleXNQcmVzc2VkID09PSAndGFiJyB8fCBrZXlzUHJlc3NlZCA9PT0gJ3NoaWZ0K3RhYicgKSAmJiBGdWxsU2NyZWVuLmlzRnVsbFNjcmVlbigpICkge1xyXG5cclxuICAgICAgICAgIC8vIHByZXZlbnQgYSBwYXJ0aWN1bGFyIGJ1ZyBpbiBXaW5kb3dzIDcvOC4xIEZpcmVmb3ggd2hlcmUgZm9jdXMgZ2V0cyB0cmFwcGVkIGluIHRoZSBkb2N1bWVudFxyXG4gICAgICAgICAgLy8gd2hlbiB0aGUgbmF2aWdhdGlvbiBiYXIgaXMgaGlkZGVuIGFuZCB0aGVyZSBpcyBvbmx5IG9uZSBmb2N1c2FibGUgZWxlbWVudCBpbiB0aGUgRE9NXHJcbiAgICAgICAgICAvLyBzZWUgaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9OTEwMTM2XHJcbiAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBGb2N1c01hbmFnZXIucGRvbUZvY3VzICk7IC8vIHtGb2N1c3xudWxsfVxyXG4gICAgICAgICAgY29uc3QgYWN0aXZlSWQgPSBGb2N1c01hbmFnZXIucGRvbUZvY3VzIS50cmFpbC5nZXRVbmlxdWVJZCgpO1xyXG4gICAgICAgICAgY29uc3Qgbm9OZXh0Rm9jdXNhYmxlID0gUERPTVV0aWxzLmdldE5leHRGb2N1c2FibGUoKS5pZCA9PT0gYWN0aXZlSWQ7XHJcbiAgICAgICAgICBjb25zdCBub1ByZXZpb3VzRm9jdXNhYmxlID0gUERPTVV0aWxzLmdldFByZXZpb3VzRm9jdXNhYmxlKCkuaWQgPT09IGFjdGl2ZUlkO1xyXG5cclxuICAgICAgICAgIGlmICggbm9OZXh0Rm9jdXNhYmxlICYmIG5vUHJldmlvdXNGb2N1c2FibGUgKSB7XHJcbiAgICAgICAgICAgIGRvbUV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLmFkZElucHV0TGlzdGVuZXIoIGtleWJvYXJkTGlzdGVuZXIgKTtcclxuXHJcbiAgICB0aGlzLmRpc3Bvc2VEaWFsb2cgPSAoKSA9PiB7XHJcbiAgICAgIHVwZGF0ZUxheW91dE11bHRpbGluay5kaXNwb3NlKCk7XHJcbiAgICAgIGNsb3NlQnV0dG9uV2l0aE1hcmdpbnMuZGlzcG9zZSgpO1xyXG4gICAgICB0aGlzLnJlbW92ZUlucHV0TGlzdGVuZXIoIGtleWJvYXJkTGlzdGVuZXIgKTtcclxuICAgICAga2V5Ym9hcmRMaXN0ZW5lci5kaXNwb3NlKCk7XHJcblxyXG4gICAgICBjbG9zZUJ1dHRvblZvaWNpbmdOYW1lUmVzcG9uc2VQcm9wZXJ0eSAmJiBjbG9zZUJ1dHRvblZvaWNpbmdOYW1lUmVzcG9uc2VQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcblxyXG4gICAgICBjbG9zZUJ1dHRvbi5kaXNwb3NlKCk7XHJcblxyXG4gICAgICBjb250ZXh0UmVzcG9uc2VVdHRlcmFuY2UuZGlzcG9zZSgpO1xyXG4gICAgICBjb250ZW50QW5kVGl0bGUuZGlzcG9zZSgpO1xyXG5cclxuICAgICAgLy8gcmVtb3ZlIGRpYWxvZyBjb250ZW50IGZyb20gc2NlbmUgZ3JhcGgsIGJ1dCBkb24ndCBkaXNwb3NlIGJlY2F1c2UgUGFuZWxcclxuICAgICAgLy8gbmVlZHMgdG8gcmVtb3ZlIGxpc3RlbmVycyBvbiB0aGUgY29udGVudCBpbiBpdHMgZGlzcG9zZSgpXHJcbiAgICAgIGRpYWxvZ0NvbnRlbnQucmVtb3ZlQWxsQ2hpbGRyZW4oKTtcclxuICAgICAgZGlhbG9nQ29udGVudC5kZXRhY2goKTtcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuZGlzcG9zZURpYWxvZygpO1xyXG4gICAgc3VwZXIuZGlzcG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyBEaWFsb2dJTyA9IG5ldyBJT1R5cGUoICdEaWFsb2dJTycsIHtcclxuICAgIHZhbHVlVHlwZTogRGlhbG9nLFxyXG5cclxuICAgIC8vIFNpbmNlIG1hbnkgRGlhbG9ncyBhcmUgZHluYW1pYyBlbGVtZW50cywgdGhlc2UgbmVlZCB0byBiZSBpbiB0aGUgc3RhdGUuIFRoZSB2YWx1ZSBvZiB0aGUgc3RhdGUgb2JqZWN0IGRvZXNuJ3RcclxuICAgIC8vIG1hdHRlciwgYnV0IGl0IGluc3RlYWQganVzdCBzZXJ2ZXMgYXMgYSBtYXJrZXIgdG8gdGVsbCB0aGUgc3RhdGUgZW5naW5lIHRvIHJlY3JlYXRlIHRoZSBEaWFsb2cgKGlmIGR5bmFtaWMpIHdoZW5cclxuICAgIC8vIHNldHRpbmcgc3RhdGUuXHJcbiAgICBzdXBlcnR5cGU6IER5bmFtaWNNYXJrZXJJT1xyXG4gIH0gKTtcclxufVxyXG5cclxuLy8gRGVmYXVsdCB2YWx1ZSBmb3Igb3B0aW9ucy5sYXlvdXRTdHJhdGVneSwgY2VudGVycyB0aGUgRGlhbG9nIGluIHRoZSBsYXlvdXRCb3VuZHMuXHJcbmZ1bmN0aW9uIGRlZmF1bHRMYXlvdXRTdHJhdGVneSggZGlhbG9nOiBEaWFsb2csIHNpbUJvdW5kczogQm91bmRzMiwgc2NyZWVuQm91bmRzOiBCb3VuZHMyLCBzY2FsZTogbnVtYmVyICk6IHZvaWQge1xyXG4gIGlmICggZGlhbG9nLmxheW91dEJvdW5kcyApIHtcclxuICAgIGRpYWxvZy5jZW50ZXIgPSBkaWFsb2cubGF5b3V0Qm91bmRzLmNlbnRlcjtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0gZGltZW5zaW9uIC0gd2lkdGggb3IgaGVpZ2h0IGRpbWVuc2lvblxyXG4gKiBAcGFyYW0gbWFyZ2luIC0gbWFyZ2luIHRvIGJlIGFwcGxpZWQgdG8gdGhlIGRpbWVuc2lvblxyXG4gKi9cclxuZnVuY3Rpb24gYXBwbHlEb3VibGVNYXJnaW4oIGRpbWVuc2lvbjogbnVtYmVyLCBtYXJnaW46IG51bWJlciApOiBudW1iZXIge1xyXG4gIHJldHVybiAoIGRpbWVuc2lvbiA+IG1hcmdpbiAqIDIgKSA/ICggZGltZW5zaW9uIC0gbWFyZ2luICogMiApIDogZGltZW5zaW9uO1xyXG59XHJcblxyXG5zdW4ucmVnaXN0ZXIoICdEaWFsb2cnLCBEaWFsb2cgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsU0FBUyxNQUFNLDRCQUE0QjtBQUVsRCxPQUFPQyxVQUFVLE1BQU0sOEJBQThCO0FBRXJELE9BQU9DLFNBQVMsTUFBTSxpQ0FBaUM7QUFDdkQsT0FBT0MsU0FBUyxNQUFNLGlDQUFpQztBQUV2RCxPQUFPQyxXQUFXLE1BQU0sOENBQThDO0FBQ3RFLFNBQVNDLFFBQVEsRUFBRUMsWUFBWSxFQUFFQyxVQUFVLEVBQUVDLElBQUksRUFBRUMsZ0JBQWdCLEVBQUVD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