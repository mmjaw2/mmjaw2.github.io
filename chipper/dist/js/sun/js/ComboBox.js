// Copyright 2013-2024, University of Colorado Boulder

/**
 * Scenery-based combo box. Composed of a button and a popup 'list box' of items. ComboBox has no interaction of its
 * own, all interaction is handled by its subcomponents. The list box is displayed when the button is pressed, and
 * dismissed when an item is selected, the user clicks on the button, or the user clicks outside the list. The list
 * can be displayed either above or below the button.
 *
 * The supporting types and classes are:
 *
 * ComboBoxItem - items provided to ComboBox constructor
 * ComboBoxButton - the button
 * ComboBoxListBox - the list box
 * ComboBoxListItemNode - an item in the list box
 *
 * For info on ComboBox UI design, including a11y, see https://github.com/phetsims/sun/blob/main/doc/ComboBox.md
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import BooleanProperty from '../../axon/js/BooleanProperty.js';
import dotRandom from '../../dot/js/dotRandom.js';
import InstanceRegistry from '../../phet-core/js/documentation/InstanceRegistry.js';
import optionize from '../../phet-core/js/optionize.js';
import { extendsWidthSizable, FocusManager, isWidthSizable, MatrixBetweenProperty, Node, PDOMPeer, WidthSizable } from '../../scenery/js/imports.js';
import generalCloseSoundPlayer from '../../tambo/js/shared-sound-players/generalCloseSoundPlayer.js';
import generalOpenSoundPlayer from '../../tambo/js/shared-sound-players/generalOpenSoundPlayer.js';
import EventType from '../../tandem/js/EventType.js';
import Tandem from '../../tandem/js/Tandem.js';
import IOType from '../../tandem/js/types/IOType.js';
import ComboBoxButton from './ComboBoxButton.js';
import ComboBoxListBox from './ComboBoxListBox.js';
import sun from './sun.js';
import SunConstants from './SunConstants.js';
import DerivedProperty from '../../axon/js/DerivedProperty.js';
import { isTReadOnlyProperty } from '../../axon/js/TReadOnlyProperty.js';
import { getGroupItemNodes } from './GroupItemOptions.js';
import Multilink from '../../axon/js/Multilink.js';
import TinyProperty from '../../axon/js/TinyProperty.js';

// const
const LIST_POSITION_VALUES = ['above', 'below']; // where the list pops up relative to the button
const ALIGN_VALUES = ['left', 'right', 'center']; // alignment of item on button and in list

// Tandem names for ComboBoxItem must have this suffix.
const ITEM_TANDEM_NAME_SUFFIX = 'Item';

// Most usages of the items should not be able to create the Node, but rather should use the corresponding `nodes` array,
// hence the type name "No Node".

// The definition for how ComboBox sets its accessibleName and helpText in the PDOM. Forward it onto its button. See
// ComboBox.md for further style guide and documentation on the pattern.
const ACCESSIBLE_NAME_BEHAVIOR = (node, options, accessibleName, otherNodeCallbacks) => {
  otherNodeCallbacks.push(() => {
    node.button.accessibleName = accessibleName;
  });
  return options;
};
const HELP_TEXT_BEHAVIOR = (node, options, helpText, otherNodeCallbacks) => {
  otherNodeCallbacks.push(() => {
    node.button.helpText = helpText;
  });
  return options;
};
export default class ComboBox extends WidthSizable(Node) {
  // List of nodes created from ComboBoxItems to be displayed with their corresponding value. See ComboBoxItem.createNode().

  // A map from values to dynamic a11y names. This is required for correct operation, since we need to be able to
  // modify a11y names dynamically (without requiring all ComboBox clients to do the wiring). Since we can't rely on
  // Properties being passed in, we'll need to create Properties here.

  // button that shows the current selection (internal)

  // the popup list box

  // the display that clickToDismissListener is added to, because the scene may change, see sun#14

  // Clicking anywhere other than the button or list box will hide the list box.

  // (PDOM) when focus leaves the ComboBoxListBox, it should be closed. This could happen from keyboard
  // or from other screen reader controls (like VoiceOver gestures)

  // For use via PhET-iO, see https://github.com/phetsims/sun/issues/451
  // This is not generally controlled by the user, so it is not reset when the Reset All button is pressed.

  /**
   * @param property - must be settable and linkable, but needs to support Property, DerivedProperty and DynamicProperty
   * @param items - items, in the order that they appear in the listbox
   * @param listParent node that will be used as the list's parent, use this to ensure that the list is in front of everything else
   * @param [providedOptions]
   */
  constructor(property, items, listParent, providedOptions) {
    assert && assert(_.uniqBy(items, item => item.value).length === items.length, 'items must have unique values');
    assert && items.forEach(item => {
      assert && assert(!item.tandemName || item.tandemName.endsWith(ITEM_TANDEM_NAME_SUFFIX), `ComboBoxItem tandemName must end with '${ITEM_TANDEM_NAME_SUFFIX}': ${item.tandemName}`);
    });

    // See https://github.com/phetsims/sun/issues/542
    assert && assert(listParent.maxWidth === null, 'ComboBox is responsible for scaling listBox. Setting maxWidth for listParent may result in buggy behavior.');
    const options = optionize()({
      align: 'left',
      listPosition: 'below',
      labelXSpacing: 10,
      disabledOpacity: 0.5,
      cornerRadius: 4,
      highlightFill: 'rgb( 245, 245, 245 )',
      xMargin: 12,
      yMargin: 8,
      // button
      buttonFill: 'white',
      buttonStroke: 'black',
      buttonLineWidth: 1,
      buttonTouchAreaXDilation: 0,
      buttonTouchAreaYDilation: 0,
      buttonMouseAreaXDilation: 0,
      buttonMouseAreaYDilation: 0,
      // list
      listFill: 'white',
      listStroke: 'black',
      listLineWidth: 1,
      openedSoundPlayer: generalOpenSoundPlayer,
      closedNoChangeSoundPlayer: generalCloseSoundPlayer,
      // pdom
      tagName: 'div',
      // must have accessible content to support behavior functions
      buttonLabelTagName: 'p',
      accessibleNameBehavior: ACCESSIBLE_NAME_BEHAVIOR,
      helpTextBehavior: HELP_TEXT_BEHAVIOR,
      comboBoxVoicingNameResponsePattern: SunConstants.VALUE_NAMED_PLACEHOLDER,
      comboBoxVoicingContextResponse: null,
      comboBoxVoicingHintResponse: null,
      // phet-io
      tandem: Tandem.REQUIRED,
      tandemNameSuffix: 'ComboBox',
      phetioType: ComboBox.ComboBoxIO,
      phetioFeatured: true,
      phetioEventType: EventType.USER,
      visiblePropertyOptions: {
        phetioFeatured: true
      },
      phetioEnabledPropertyInstrumented: true // opt into default PhET-iO instrumented enabledProperty
    }, providedOptions);
    const nodes = getGroupItemNodes(items, options.tandem.createTandem('items'));
    assert && nodes.forEach(node => {
      assert && assert(!node.hasPDOMContent, 'Accessibility is provided by ComboBoxItemNode and ' + 'ComboBoxItem.a11yLabel. Additional PDOM content in the provided ' + 'Node could break accessibility.');
    });

    // validate option values
    assert && assert(options.xMargin > 0 && options.yMargin > 0, `margins must be > 0, xMargin=${options.xMargin}, yMargin=${options.yMargin}`);
    assert && assert(_.includes(LIST_POSITION_VALUES, options.listPosition), `invalid listPosition: ${options.listPosition}`);
    assert && assert(_.includes(ALIGN_VALUES, options.align), `invalid align: ${options.align}`);
    super();
    this.nodes = nodes;
    this.a11yNamePropertyMap = ComboBox.getA11yNamePropertyMap(items);
    this.listPosition = options.listPosition;
    this.button = new ComboBoxButton(property, items, nodes, this.a11yNamePropertyMap, {
      align: options.align,
      arrowDirection: options.listPosition === 'below' ? 'down' : 'up',
      cornerRadius: options.cornerRadius,
      xMargin: options.xMargin,
      yMargin: options.yMargin,
      baseColor: options.buttonFill,
      stroke: options.buttonStroke,
      lineWidth: options.buttonLineWidth,
      touchAreaXDilation: options.buttonTouchAreaXDilation,
      touchAreaYDilation: options.buttonTouchAreaYDilation,
      mouseAreaXDilation: options.buttonMouseAreaXDilation,
      mouseAreaYDilation: options.buttonMouseAreaYDilation,
      localPreferredWidthProperty: this.localPreferredWidthProperty,
      localMinimumWidthProperty: this.localMinimumWidthProperty,
      comboBoxVoicingNameResponsePattern: options.comboBoxVoicingNameResponsePattern,
      // pdom - accessibleName and helpText are set via behavior functions on the ComboBox
      labelTagName: options.buttonLabelTagName,
      // phet-io
      tandem: options.tandem.createTandem('button')
    });
    this.addChild(this.button);
    this.listBox = new ComboBoxListBox(property, items, nodes, this.a11yNamePropertyMap, this.hideListBox.bind(this),
    // callback to hide the list box
    () => {
      this.button.blockNextVoicingFocusListener();
      this.button.focus();
    }, this.button, options.tandem.createTandem('listBox'), {
      align: options.align,
      highlightFill: options.highlightFill,
      xMargin: options.xMargin,
      yMargin: options.yMargin,
      cornerRadius: options.cornerRadius,
      fill: options.listFill,
      stroke: options.listStroke,
      lineWidth: options.listLineWidth,
      visible: false,
      comboBoxListItemNodeOptions: {
        comboBoxVoicingNameResponsePattern: options.comboBoxVoicingNameResponsePattern,
        voicingContextResponse: options.comboBoxVoicingContextResponse,
        voicingHintResponse: options.comboBoxVoicingHintResponse
      },
      // sound generation
      openedSoundPlayer: options.openedSoundPlayer,
      closedNoChangeSoundPlayer: options.closedNoChangeSoundPlayer,
      // pdom
      // the list box is aria-labelledby its own label sibling
      ariaLabelledbyAssociations: [{
        otherNode: this.button,
        otherElementName: PDOMPeer.LABEL_SIBLING,
        thisElementName: PDOMPeer.PRIMARY_SIBLING
      }]
    });
    listParent.addChild(this.listBox);
    this.listParent = listParent;
    const listBoxMatrixProperty = new MatrixBetweenProperty(this.button, this.listParent, {
      fromCoordinateFrame: 'parent',
      toCoordinateFrame: 'local'
    });
    Multilink.multilink([listBoxMatrixProperty, this.button.localBoundsProperty, this.listBox.localBoundsProperty], matrix => {
      this.scaleAndPositionListBox(matrix);
    });

    // The listBox is not a child Node of ComboBox and, as a result, listen to opacity of the ComboBox and keep
    // the listBox in sync with them. See https://github.com/phetsims/sun/issues/587
    this.opacityProperty.link(opacity => {
      this.listBox.opacityProperty.value = opacity;
    });
    this.mutate(options);
    if (assert && Tandem.VALIDATION && this.isPhetioInstrumented()) {
      items.forEach(item => {
        assert && assert(item.tandemName !== null, `PhET-iO instrumented ComboBoxes require ComboBoxItems to have tandemName: ${item.value}`);
      });
    }

    // Clicking on the button toggles visibility of the list box
    this.button.addListener(() => {
      this.listBox.visibleProperty.value = !this.listBox.visibleProperty.value;
      this.listBox.visibleProperty.value && this.listBox.focusListItemNode(property.value);
    });
    this.display = null;
    this.clickToDismissListener = {
      down: event => {
        // If fuzzing is enabled, exercise this listener some percentage of the time, so that this listener is tested.
        // The rest of the time, ignore this listener, so that the listbox remains popped up, and we test making
        // choices from the listbox. See https://github.com/phetsims/sun/issues/677 for the initial implementation,
        // and See https://github.com/phetsims/aqua/issues/136 for the probability value chosen.
        if (!phet.chipper.isFuzzEnabled() || dotRandom.nextDouble() < 0.005) {
          // Ignore if we click over the button, since the button will handle hiding the list.
          if (!(event.trail.containsNode(this.button) || event.trail.containsNode(this.listBox))) {
            this.hideListBox();
          }
        }
      }
    };
    this.dismissWithFocusListener = focus => {
      if (focus && !focus.trail.containsNode(this.listBox)) {
        this.hideListBox();
      }
    };
    FocusManager.pdomFocusProperty.link(this.dismissWithFocusListener);
    this.listBox.visibleProperty.link(visible => {
      if (visible) {
        // show the list box
        this.scaleListBox();
        this.listBox.moveToFront();

        // manage clickToDismissListener
        assert && assert(!this.display, 'unexpected display');
        this.display = this.getUniqueTrail().rootNode().getRootedDisplays()[0];
        this.display.addInputListener(this.clickToDismissListener);
      } else {
        // manage clickToDismissListener
        if (this.display && this.display.hasInputListener(this.clickToDismissListener)) {
          this.display.removeInputListener(this.clickToDismissListener);
          this.display = null;
        }
      }
    });
    this.displayOnlyProperty = new BooleanProperty(false, {
      tandem: options.tandem.createTandem('displayOnlyProperty'),
      phetioFeatured: true,
      phetioDocumentation: 'disables interaction with the ComboBox and ' + 'makes it appear like a display that shows the current selection'
    });
    this.displayOnlyProperty.link(displayOnly => {
      this.hideListBox();
      this.button.setDisplayOnly(displayOnly);
      this.pickable = !displayOnly;
    });
    this.addLinkedElement(property, {
      tandemName: 'property'
    });
    this.disposeComboBox = () => {
      listBoxMatrixProperty.dispose();
      if (this.display && this.display.hasInputListener(this.clickToDismissListener)) {
        this.display.removeInputListener(this.clickToDismissListener);
      }
      FocusManager.pdomFocusProperty.unlink(this.dismissWithFocusListener);

      // dispose of subcomponents
      this.displayOnlyProperty.dispose(); // tandems must be cleaned up
      this.listBox.dispose();
      this.button.dispose();
      nodes.forEach(node => node.dispose());
    };

    // support for binder documentation, stripped out in builds and only runs when ?binder is specified
    assert && phet?.chipper?.queryParameters?.binder && InstanceRegistry.registerDataURL('sun', 'ComboBox', this);
  }
  dispose() {
    this.disposeComboBox();
    super.dispose();
  }

  /**
   * Shows the list box.
   */
  showListBox() {
    this.listBox.visibleProperty.value = true;
  }

  /**
   * Hides the list box.
   */
  hideListBox() {
    this.listBox.visibleProperty.value = false;
  }

  /**
   * Because the button and list box have different parents (and therefore different coordinate frames)
   * they may be scaled differently. This method scales the list box so that items on the button and in
   * the list appear to be the same size.
   */
  scaleListBox() {
    // To support an empty list box due to PhET-iO customization, see https://github.com/phetsims/sun/issues/606
    if (!this.listBox.localBounds.isEmpty()) {
      const buttonScale = this.button.localToGlobalBounds(this.button.localBounds).width / this.button.localBounds.width;
      const listBoxScale = this.listBox.localToGlobalBounds(this.listBox.localBounds).width / this.listBox.localBounds.width;
      this.listBox.scale(buttonScale / listBoxScale);
    }
  }
  scaleAndPositionListBox(listBoxMatrix) {
    if (listBoxMatrix) {
      // Scale the box before positioning.
      this.scaleListBox();
      if (this.listPosition === 'above') {
        this.listBox.leftBottom = listBoxMatrix.timesVector2(this.button.leftTop);
      } else {
        this.listBox.leftTop = listBoxMatrix.timesVector2(this.button.leftBottom);
      }
    }
  }

  /**
   * Sets the visibility of items that correspond to a value. If the selected item has this value, it's your
   * responsibility to change the Property value to something else. Otherwise, the combo box button will continue
   * to display this value.
   * @param value - the value associated with the ComboBoxItem
   * @param visible
   */
  setItemVisible(value, visible) {
    this.listBox.setItemVisible(value, visible);
  }

  /**
   * Is the item that corresponds to a value visible when the listbox is popped up?
   * @param value - the value associated with the ComboBoxItem
   */
  isItemVisible(value) {
    return this.listBox.isItemVisible(value);
  }
  static getMaxItemWidthProperty(nodes) {
    const widthProperties = _.flatten(nodes.map(node => {
      const properties = [node.boundsProperty];
      if (extendsWidthSizable(node)) {
        properties.push(node.isWidthResizableProperty);
        properties.push(node.minimumWidthProperty);
      }
      return properties;
    }));
    return DerivedProperty.deriveAny(widthProperties, () => {
      return Math.max(...nodes.map(node => isWidthSizable(node) ? node.minimumWidth || 0 : node.width));
    }, {
      strictAxonDependencies: false //TODO https://github.com/phetsims/sun/issues/870
    });
  }
  static getMaxItemHeightProperty(nodes) {
    const heightProperties = nodes.map(node => node.boundsProperty);
    return DerivedProperty.deriveAny(heightProperties, () => {
      return Math.max(...nodes.map(node => node.height));
    }, {
      strictAxonDependencies: false //TODO https://github.com/phetsims/sun/issues/870
    });
  }
  static getA11yNamePropertyMap(items) {
    const map = new Map();

    // Connect a11yNamePropertyMap, creating Properties as needed.
    items.forEach(item => {
      let property;
      if (isTReadOnlyProperty(item.a11yName)) {
        property = item.a11yName;
      } else if (typeof item.a11yName === 'string') {
        property = new TinyProperty(item.a11yName);
      } else {
        property = new TinyProperty(null);
      }
      map.set(item.value, property);
    });
    return map;
  }
  static ComboBoxIO = new IOType('ComboBoxIO', {
    valueType: ComboBox,
    documentation: 'A combo box is composed of a push button and a listbox. The listbox contains items that represent ' + 'choices. Pressing the button pops up the listbox. Selecting from an item in the listbox sets the ' + 'value of an associated Property. The button shows the item that is currently selected.',
    supertype: Node.NodeIO,
    events: ['listBoxShown', 'listBoxHidden']
  });
}
sun.register('ComboBox', ComboBox);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJkb3RSYW5kb20iLCJJbnN0YW5jZVJlZ2lzdHJ5Iiwib3B0aW9uaXplIiwiZXh0ZW5kc1dpZHRoU2l6YWJsZSIsIkZvY3VzTWFuYWdlciIsImlzV2lkdGhTaXphYmxlIiwiTWF0cml4QmV0d2VlblByb3BlcnR5IiwiTm9kZSIsIlBET01QZWVyIiwiV2lkdGhTaXphYmxlIiwiZ2VuZXJhbENsb3NlU291bmRQbGF5ZXIiLCJnZW5lcmFsT3BlblNvdW5kUGxheWVyIiwiRXZlbnRUeXBlIiwiVGFuZGVtIiwiSU9UeXBlIiwiQ29tYm9Cb3hCdXR0b24iLCJDb21ib0JveExpc3RCb3giLCJzdW4iLCJTdW5Db25zdGFudHMiLCJEZXJpdmVkUHJvcGVydHkiLCJpc1RSZWFkT25seVByb3BlcnR5IiwiZ2V0R3JvdXBJdGVtTm9kZXMiLCJNdWx0aWxpbmsiLCJUaW55UHJvcGVydHkiLCJMSVNUX1BPU0lUSU9OX1ZBTFVFUyIsIkFMSUdOX1ZBTFVFUyIsIklURU1fVEFOREVNX05BTUVfU1VGRklYIiwiQUNDRVNTSUJMRV9OQU1FX0JFSEFWSU9SIiwibm9kZSIsIm9wdGlvbnMiLCJhY2Nlc3NpYmxlTmFtZSIsIm90aGVyTm9kZUNhbGxiYWNrcyIsInB1c2giLCJidXR0b24iLCJIRUxQX1RFWFRfQkVIQVZJT1IiLCJoZWxwVGV4dCIsIkNvbWJvQm94IiwiY29uc3RydWN0b3IiLCJwcm9wZXJ0eSIsIml0ZW1zIiwibGlzdFBhcmVudCIsInByb3ZpZGVkT3B0aW9ucyIsImFzc2VydCIsIl8iLCJ1bmlxQnkiLCJpdGVtIiwidmFsdWUiLCJsZW5ndGgiLCJmb3JFYWNoIiwidGFuZGVtTmFtZSIsImVuZHNXaXRoIiwibWF4V2lkdGgiLCJhbGlnbiIsImxpc3RQb3NpdGlvbiIsImxhYmVsWFNwYWNpbmciLCJkaXNhYmxlZE9wYWNpdHkiLCJjb3JuZXJSYWRpdXMiLCJoaWdobGlnaHRGaWxsIiwieE1hcmdpbiIsInlNYXJnaW4iLCJidXR0b25GaWxsIiwiYnV0dG9uU3Ryb2tlIiwiYnV0dG9uTGluZVdpZHRoIiwiYnV0dG9uVG91Y2hBcmVhWERpbGF0aW9uIiwiYnV0dG9uVG91Y2hBcmVhWURpbGF0aW9uIiwiYnV0dG9uTW91c2VBcmVhWERpbGF0aW9uIiwiYnV0dG9uTW91c2VBcmVhWURpbGF0aW9uIiwibGlzdEZpbGwiLCJsaXN0U3Ryb2tlIiwibGlzdExpbmVXaWR0aCIsIm9wZW5lZFNvdW5kUGxheWVyIiwiY2xvc2VkTm9DaGFuZ2VTb3VuZFBsYXllciIsInRhZ05hbWUiLCJidXR0b25MYWJlbFRhZ05hbWUiLCJhY2Nlc3NpYmxlTmFtZUJlaGF2aW9yIiwiaGVscFRleHRCZWhhdmlvciIsImNvbWJvQm94Vm9pY2luZ05hbWVSZXNwb25zZVBhdHRlcm4iLCJWQUxVRV9OQU1FRF9QTEFDRUhPTERFUiIsImNvbWJvQm94Vm9pY2luZ0NvbnRleHRSZXNwb25zZSIsImNvbWJvQm94Vm9pY2luZ0hpbnRSZXNwb25zZSIsInRhbmRlbSIsIlJFUVVJUkVEIiwidGFuZGVtTmFtZVN1ZmZpeCIsInBoZXRpb1R5cGUiLCJDb21ib0JveElPIiwicGhldGlvRmVhdHVyZWQiLCJwaGV0aW9FdmVudFR5cGUiLCJVU0VSIiwidmlzaWJsZVByb3BlcnR5T3B0aW9ucyIsInBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCIsIm5vZGVzIiwiY3JlYXRlVGFuZGVtIiwiaGFzUERPTUNvbnRlbnQiLCJpbmNsdWRlcyIsImExMXlOYW1lUHJvcGVydHlNYXAiLCJnZXRBMTF5TmFtZVByb3BlcnR5TWFwIiwiYXJyb3dEaXJlY3Rpb24iLCJiYXNlQ29sb3IiLCJzdHJva2UiLCJsaW5lV2lkdGgiLCJ0b3VjaEFyZWFYRGlsYXRpb24iLCJ0b3VjaEFyZWFZRGlsYXRpb24iLCJtb3VzZUFyZWFYRGlsYXRpb24iLCJtb3VzZUFyZWFZRGlsYXRpb24iLCJsb2NhbFByZWZlcnJlZFdpZHRoUHJvcGVydHkiLCJsb2NhbE1pbmltdW1XaWR0aFByb3BlcnR5IiwibGFiZWxUYWdOYW1lIiwiYWRkQ2hpbGQiLCJsaXN0Qm94IiwiaGlkZUxpc3RCb3giLCJiaW5kIiwiYmxvY2tOZXh0Vm9pY2luZ0ZvY3VzTGlzdGVuZXIiLCJmb2N1cyIsImZpbGwiLCJ2aXNpYmxlIiwiY29tYm9Cb3hMaXN0SXRlbU5vZGVPcHRpb25zIiwidm9pY2luZ0NvbnRleHRSZXNwb25zZSIsInZvaWNpbmdIaW50UmVzcG9uc2UiLCJhcmlhTGFiZWxsZWRieUFzc29jaWF0aW9ucyIsIm90aGVyTm9kZSIsIm90aGVyRWxlbWVudE5hbWUiLCJMQUJFTF9TSUJMSU5HIiwidGhpc0VsZW1lbnROYW1lIiwiUFJJTUFSWV9TSUJMSU5HIiwibGlzdEJveE1hdHJpeFByb3BlcnR5IiwiZnJvbUNvb3JkaW5hdGVGcmFtZSIsInRvQ29vcmRpbmF0ZUZyYW1lIiwibXVsdGlsaW5rIiwibG9jYWxCb3VuZHNQcm9wZXJ0eSIsIm1hdHJpeCIsInNjYWxlQW5kUG9zaXRpb25MaXN0Qm94Iiwib3BhY2l0eVByb3BlcnR5IiwibGluayIsIm9wYWNpdHkiLCJtdXRhdGUiLCJWQUxJREFUSU9OIiwiaXNQaGV0aW9JbnN0cnVtZW50ZWQiLCJhZGRMaXN0ZW5lciIsInZpc2libGVQcm9wZXJ0eSIsImZvY3VzTGlzdEl0ZW1Ob2RlIiwiZGlzcGxheSIsImNsaWNrVG9EaXNtaXNzTGlzdGVuZXIiLCJkb3duIiwiZXZlbnQiLCJwaGV0IiwiY2hpcHBlciIsImlzRnV6ekVuYWJsZWQiLCJuZXh0RG91YmxlIiwidHJhaWwiLCJjb250YWluc05vZGUiLCJkaXNtaXNzV2l0aEZvY3VzTGlzdGVuZXIiLCJwZG9tRm9jdXNQcm9wZXJ0eSIsInNjYWxlTGlzdEJveCIsIm1vdmVUb0Zyb250IiwiZ2V0VW5pcXVlVHJhaWwiLCJyb290Tm9kZSIsImdldFJvb3RlZERpc3BsYXlzIiwiYWRkSW5wdXRMaXN0ZW5lciIsImhhc0lucHV0TGlzdGVuZXIiLCJyZW1vdmVJbnB1dExpc3RlbmVyIiwiZGlzcGxheU9ubHlQcm9wZXJ0eSIsInBoZXRpb0RvY3VtZW50YXRpb24iLCJkaXNwbGF5T25seSIsInNldERpc3BsYXlPbmx5IiwicGlja2FibGUiLCJhZGRMaW5rZWRFbGVtZW50IiwiZGlzcG9zZUNvbWJvQm94IiwiZGlzcG9zZSIsInVubGluayIsInF1ZXJ5UGFyYW1ldGVycyIsImJpbmRlciIsInJlZ2lzdGVyRGF0YVVSTCIsInNob3dMaXN0Qm94IiwibG9jYWxCb3VuZHMiLCJpc0VtcHR5IiwiYnV0dG9uU2NhbGUiLCJsb2NhbFRvR2xvYmFsQm91bmRzIiwid2lkdGgiLCJsaXN0Qm94U2NhbGUiLCJzY2FsZSIsImxpc3RCb3hNYXRyaXgiLCJsZWZ0Qm90dG9tIiwidGltZXNWZWN0b3IyIiwibGVmdFRvcCIsInNldEl0ZW1WaXNpYmxlIiwiaXNJdGVtVmlzaWJsZSIsImdldE1heEl0ZW1XaWR0aFByb3BlcnR5Iiwid2lkdGhQcm9wZXJ0aWVzIiwiZmxhdHRlbiIsIm1hcCIsInByb3BlcnRpZXMiLCJib3VuZHNQcm9wZXJ0eSIsImlzV2lkdGhSZXNpemFibGVQcm9wZXJ0eSIsIm1pbmltdW1XaWR0aFByb3BlcnR5IiwiZGVyaXZlQW55IiwiTWF0aCIsIm1heCIsIm1pbmltdW1XaWR0aCIsInN0cmljdEF4b25EZXBlbmRlbmNpZXMiLCJnZXRNYXhJdGVtSGVpZ2h0UHJvcGVydHkiLCJoZWlnaHRQcm9wZXJ0aWVzIiwiaGVpZ2h0IiwiTWFwIiwiYTExeU5hbWUiLCJzZXQiLCJ2YWx1ZVR5cGUiLCJkb2N1bWVudGF0aW9uIiwic3VwZXJ0eXBlIiwiTm9kZUlPIiwiZXZlbnRzIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJDb21ib0JveC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxMy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBTY2VuZXJ5LWJhc2VkIGNvbWJvIGJveC4gQ29tcG9zZWQgb2YgYSBidXR0b24gYW5kIGEgcG9wdXAgJ2xpc3QgYm94JyBvZiBpdGVtcy4gQ29tYm9Cb3ggaGFzIG5vIGludGVyYWN0aW9uIG9mIGl0c1xyXG4gKiBvd24sIGFsbCBpbnRlcmFjdGlvbiBpcyBoYW5kbGVkIGJ5IGl0cyBzdWJjb21wb25lbnRzLiBUaGUgbGlzdCBib3ggaXMgZGlzcGxheWVkIHdoZW4gdGhlIGJ1dHRvbiBpcyBwcmVzc2VkLCBhbmRcclxuICogZGlzbWlzc2VkIHdoZW4gYW4gaXRlbSBpcyBzZWxlY3RlZCwgdGhlIHVzZXIgY2xpY2tzIG9uIHRoZSBidXR0b24sIG9yIHRoZSB1c2VyIGNsaWNrcyBvdXRzaWRlIHRoZSBsaXN0LiBUaGUgbGlzdFxyXG4gKiBjYW4gYmUgZGlzcGxheWVkIGVpdGhlciBhYm92ZSBvciBiZWxvdyB0aGUgYnV0dG9uLlxyXG4gKlxyXG4gKiBUaGUgc3VwcG9ydGluZyB0eXBlcyBhbmQgY2xhc3NlcyBhcmU6XHJcbiAqXHJcbiAqIENvbWJvQm94SXRlbSAtIGl0ZW1zIHByb3ZpZGVkIHRvIENvbWJvQm94IGNvbnN0cnVjdG9yXHJcbiAqIENvbWJvQm94QnV0dG9uIC0gdGhlIGJ1dHRvblxyXG4gKiBDb21ib0JveExpc3RCb3ggLSB0aGUgbGlzdCBib3hcclxuICogQ29tYm9Cb3hMaXN0SXRlbU5vZGUgLSBhbiBpdGVtIGluIHRoZSBsaXN0IGJveFxyXG4gKlxyXG4gKiBGb3IgaW5mbyBvbiBDb21ib0JveCBVSSBkZXNpZ24sIGluY2x1ZGluZyBhMTF5LCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3N1bi9ibG9iL21haW4vZG9jL0NvbWJvQm94Lm1kXHJcbiAqXHJcbiAqIEBhdXRob3IgQ2hyaXMgTWFsbGV5IChQaXhlbFpvb20sIEluYy4pXHJcbiAqL1xyXG5cclxuaW1wb3J0IEJvb2xlYW5Qcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL0Jvb2xlYW5Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IGRvdFJhbmRvbSBmcm9tICcuLi8uLi9kb3QvanMvZG90UmFuZG9tLmpzJztcclxuaW1wb3J0IEluc3RhbmNlUmVnaXN0cnkgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL2RvY3VtZW50YXRpb24vSW5zdGFuY2VSZWdpc3RyeS5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCB7IERpc3BsYXksIGV4dGVuZHNXaWR0aFNpemFibGUsIEZvY3VzLCBGb2N1c01hbmFnZXIsIGlzV2lkdGhTaXphYmxlLCBNYXRyaXhCZXR3ZWVuUHJvcGVydHksIE5vZGUsIE5vZGVPcHRpb25zLCBQRE9NQmVoYXZpb3JGdW5jdGlvbiwgUERPTVBlZXIsIFBET01WYWx1ZVR5cGUsIFRDb2xvciwgVElucHV0TGlzdGVuZXIsIFRQYWludCwgV2lkdGhTaXphYmxlLCBXaWR0aFNpemFibGVPcHRpb25zIH0gZnJvbSAnLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IFRTb3VuZFBsYXllciBmcm9tICcuLi8uLi90YW1iby9qcy9UU291bmRQbGF5ZXIuanMnO1xyXG5pbXBvcnQgZ2VuZXJhbENsb3NlU291bmRQbGF5ZXIgZnJvbSAnLi4vLi4vdGFtYm8vanMvc2hhcmVkLXNvdW5kLXBsYXllcnMvZ2VuZXJhbENsb3NlU291bmRQbGF5ZXIuanMnO1xyXG5pbXBvcnQgZ2VuZXJhbE9wZW5Tb3VuZFBsYXllciBmcm9tICcuLi8uLi90YW1iby9qcy9zaGFyZWQtc291bmQtcGxheWVycy9nZW5lcmFsT3BlblNvdW5kUGxheWVyLmpzJztcclxuaW1wb3J0IEV2ZW50VHlwZSBmcm9tICcuLi8uLi90YW5kZW0vanMvRXZlbnRUeXBlLmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuaW1wb3J0IElPVHlwZSBmcm9tICcuLi8uLi90YW5kZW0vanMvdHlwZXMvSU9UeXBlLmpzJztcclxuaW1wb3J0IENvbWJvQm94QnV0dG9uIGZyb20gJy4vQ29tYm9Cb3hCdXR0b24uanMnO1xyXG5pbXBvcnQgQ29tYm9Cb3hMaXN0Qm94IGZyb20gJy4vQ29tYm9Cb3hMaXN0Qm94LmpzJztcclxuaW1wb3J0IHN1biBmcm9tICcuL3N1bi5qcyc7XHJcbmltcG9ydCBTdW5Db25zdGFudHMgZnJvbSAnLi9TdW5Db25zdGFudHMuanMnO1xyXG5pbXBvcnQgRGVyaXZlZFByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvRGVyaXZlZFByb3BlcnR5LmpzJztcclxuaW1wb3J0IEludGVudGlvbmFsQW55IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9JbnRlbnRpb25hbEFueS5qcyc7XHJcbmltcG9ydCBUUmVhZE9ubHlQcm9wZXJ0eSwgeyBpc1RSZWFkT25seVByb3BlcnR5IH0gZnJvbSAnLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCB7IFNwZWFrYWJsZVJlc29sdmVkUmVzcG9uc2UgfSBmcm9tICcuLi8uLi91dHRlcmFuY2UtcXVldWUvanMvUmVzcG9uc2VQYWNrZXQuanMnO1xyXG5pbXBvcnQgR3JvdXBJdGVtT3B0aW9ucywgeyBnZXRHcm91cEl0ZW1Ob2RlcyB9IGZyb20gJy4vR3JvdXBJdGVtT3B0aW9ucy5qcyc7XHJcbmltcG9ydCBNdWx0aWxpbmsgZnJvbSAnLi4vLi4vYXhvbi9qcy9NdWx0aWxpbmsuanMnO1xyXG5pbXBvcnQgU3RyaWN0T21pdCBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvU3RyaWN0T21pdC5qcyc7XHJcbmltcG9ydCBQaGV0aW9Qcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1BoZXRpb1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IE1hdHJpeDMgZnJvbSAnLi4vLi4vZG90L2pzL01hdHJpeDMuanMnO1xyXG5pbXBvcnQgeyBDb21ib0JveExpc3RJdGVtTm9kZU9wdGlvbnMgfSBmcm9tICcuL0NvbWJvQm94TGlzdEl0ZW1Ob2RlLmpzJztcclxuaW1wb3J0IFRpbnlQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1RpbnlQcm9wZXJ0eS5qcyc7XHJcblxyXG4vLyBjb25zdFxyXG5jb25zdCBMSVNUX1BPU0lUSU9OX1ZBTFVFUyA9IFsgJ2Fib3ZlJywgJ2JlbG93JyBdIGFzIGNvbnN0OyAvLyB3aGVyZSB0aGUgbGlzdCBwb3BzIHVwIHJlbGF0aXZlIHRvIHRoZSBidXR0b25cclxuY29uc3QgQUxJR05fVkFMVUVTID0gWyAnbGVmdCcsICdyaWdodCcsICdjZW50ZXInIF0gYXMgY29uc3Q7IC8vIGFsaWdubWVudCBvZiBpdGVtIG9uIGJ1dHRvbiBhbmQgaW4gbGlzdFxyXG5cclxuLy8gVGFuZGVtIG5hbWVzIGZvciBDb21ib0JveEl0ZW0gbXVzdCBoYXZlIHRoaXMgc3VmZml4LlxyXG5jb25zdCBJVEVNX1RBTkRFTV9OQU1FX1NVRkZJWCA9ICdJdGVtJztcclxuXHJcbmV4cG9ydCB0eXBlIENvbWJvQm94SXRlbTxUPiA9IHtcclxuXHJcbiAgLy8gdGhlIHZhbHVlIGFzc29jaWF0ZWQgd2l0aCB0aGUgaXRlbVxyXG4gIHZhbHVlOiBUO1xyXG5cclxuICAvLyBTb3VuZCB0aGF0IHdpbGwgYmUgcGxheWVkIHdoZW4gdGhpcyBpdGVtIGlzIHNlbGVjdGVkLiAgSWYgc2V0IHRvIGBudWxsYCBhIGRlZmF1bHQgc291bmQgd2lsbCBiZSB1c2VkIHRoYXQgaXMgYmFzZWRcclxuICAvLyBvbiB0aGlzIGl0ZW0ncyBwb3NpdGlvbiBpbiB0aGUgY29tYm8gYm94IGxpc3QuICBBIHZhbHVlIG9mIGBudWxsU291bmRQbGF5ZXJgIGNhbiBiZSB1c2VkIHRvIGRpc2FibGUuXHJcbiAgc291bmRQbGF5ZXI/OiBUU291bmRQbGF5ZXIgfCBudWxsO1xyXG5cclxuICAvLyBwZG9tIC0gdGhlIGxhYmVsIGZvciB0aGlzIGl0ZW0ncyBhc3NvY2lhdGVkIE5vZGUgaW4gdGhlIGNvbWJvIGJveFxyXG4gIGExMXlOYW1lPzogUERPTVZhbHVlVHlwZSB8IG51bGw7XHJcblxyXG4gIC8vIE9wdGlvbnMgcGFzc2VkIHRvIENvbWJvQm94TGlzdEl0ZW1Ob2RlLCB0aGUgTm9kZSB0aGF0IGFwcGVhcnMgaW4gdGhlIGxpc3RCb3hcclxuICBjb21ib0JveExpc3RJdGVtTm9kZU9wdGlvbnM/OiBDb21ib0JveExpc3RJdGVtTm9kZU9wdGlvbnM7XHJcbn0gJiBHcm91cEl0ZW1PcHRpb25zO1xyXG5cclxuLy8gTW9zdCB1c2FnZXMgb2YgdGhlIGl0ZW1zIHNob3VsZCBub3QgYmUgYWJsZSB0byBjcmVhdGUgdGhlIE5vZGUsIGJ1dCByYXRoZXIgc2hvdWxkIHVzZSB0aGUgY29ycmVzcG9uZGluZyBgbm9kZXNgIGFycmF5LFxyXG4vLyBoZW5jZSB0aGUgdHlwZSBuYW1lIFwiTm8gTm9kZVwiLlxyXG5leHBvcnQgdHlwZSBDb21ib0JveEl0ZW1Ob05vZGU8VD4gPSBTdHJpY3RPbWl0PENvbWJvQm94SXRlbTxUPiwgJ2NyZWF0ZU5vZGUnPjtcclxuXHJcbmV4cG9ydCB0eXBlIENvbWJvQm94TGlzdFBvc2l0aW9uID0gdHlwZW9mIExJU1RfUE9TSVRJT05fVkFMVUVTW251bWJlcl07XHJcbmV4cG9ydCB0eXBlIENvbWJvQm94QWxpZ24gPSB0eXBlb2YgQUxJR05fVkFMVUVTW251bWJlcl07XHJcblxyXG5leHBvcnQgdHlwZSBDb21ib0JveEExMXlOYW1lUHJvcGVydHlNYXA8VD4gPSBNYXA8VCwgVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nIHwgbnVsbD4+O1xyXG5cclxuLy8gVGhlIGRlZmluaXRpb24gZm9yIGhvdyBDb21ib0JveCBzZXRzIGl0cyBhY2Nlc3NpYmxlTmFtZSBhbmQgaGVscFRleHQgaW4gdGhlIFBET00uIEZvcndhcmQgaXQgb250byBpdHMgYnV0dG9uLiBTZWVcclxuLy8gQ29tYm9Cb3gubWQgZm9yIGZ1cnRoZXIgc3R5bGUgZ3VpZGUgYW5kIGRvY3VtZW50YXRpb24gb24gdGhlIHBhdHRlcm4uXHJcbmNvbnN0IEFDQ0VTU0lCTEVfTkFNRV9CRUhBVklPUjogUERPTUJlaGF2aW9yRnVuY3Rpb24gPSAoIG5vZGUsIG9wdGlvbnMsIGFjY2Vzc2libGVOYW1lLCBvdGhlck5vZGVDYWxsYmFja3MgKSA9PiB7XHJcbiAgb3RoZXJOb2RlQ2FsbGJhY2tzLnB1c2goICgpID0+IHtcclxuICAgICggbm9kZSBhcyBDb21ib0JveDx1bmtub3duPiApLmJ1dHRvbi5hY2Nlc3NpYmxlTmFtZSA9IGFjY2Vzc2libGVOYW1lO1xyXG4gIH0gKTtcclxuICByZXR1cm4gb3B0aW9ucztcclxufTtcclxuY29uc3QgSEVMUF9URVhUX0JFSEFWSU9SOiBQRE9NQmVoYXZpb3JGdW5jdGlvbiA9ICggbm9kZSwgb3B0aW9ucywgaGVscFRleHQsIG90aGVyTm9kZUNhbGxiYWNrcyApID0+IHtcclxuICBvdGhlck5vZGVDYWxsYmFja3MucHVzaCggKCkgPT4ge1xyXG4gICAgKCBub2RlIGFzIENvbWJvQm94PHVua25vd24+ICkuYnV0dG9uLmhlbHBUZXh0ID0gaGVscFRleHQ7XHJcbiAgfSApO1xyXG4gIHJldHVybiBvcHRpb25zO1xyXG59O1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuICBhbGlnbj86IENvbWJvQm94QWxpZ247XHJcbiAgbGlzdFBvc2l0aW9uPzogQ29tYm9Cb3hMaXN0UG9zaXRpb247XHJcblxyXG4gIC8vIGhvcml6b250YWwgc3BhY2UgYmV0d2VlbiBsYWJlbCBhbmQgY29tYm8gYm94XHJcbiAgbGFiZWxYU3BhY2luZz86IG51bWJlcjtcclxuXHJcbiAgLy8gb3BhY2l0eSB1c2VkIHRvIG1ha2UgdGhlIGNvbnRyb2wgbG9vayBkaXNhYmxlZCwgMC0xXHJcbiAgZGlzYWJsZWRPcGFjaXR5PzogbnVtYmVyO1xyXG5cclxuICAvLyBhcHBsaWVkIHRvIGJ1dHRvbiwgbGlzdEJveCwgYW5kIGl0ZW0gaGlnaGxpZ2h0c1xyXG4gIGNvcm5lclJhZGl1cz86IG51bWJlcjtcclxuXHJcbiAgLy8gaGlnaGxpZ2h0IGJlaGluZCBpdGVtcyBpbiB0aGUgbGlzdFxyXG4gIGhpZ2hsaWdodEZpbGw/OiBUUGFpbnQ7XHJcblxyXG4gIC8vIE1hcmdpbnMgYXJvdW5kIHRoZSBlZGdlcyBvZiB0aGUgYnV0dG9uIGFuZCBsaXN0Ym94IHdoZW4gaGlnaGxpZ2h0IGlzIGludmlzaWJsZS5cclxuICAvLyBIaWdobGlnaHQgbWFyZ2lucyBhcm91bmQgdGhlIGl0ZW1zIGluIHRoZSBsaXN0IGFyZSBzZXQgdG8gMS8yIG9mIHRoZXNlIHZhbHVlcy5cclxuICAvLyBUaGVzZSB2YWx1ZXMgbXVzdCBiZSA+IDAuXHJcbiAgeE1hcmdpbj86IG51bWJlcjtcclxuICB5TWFyZ2luPzogbnVtYmVyO1xyXG5cclxuICAvLyBidXR0b25cclxuICBidXR0b25GaWxsPzogVENvbG9yO1xyXG4gIGJ1dHRvblN0cm9rZT86IFRQYWludDtcclxuICBidXR0b25MaW5lV2lkdGg/OiBudW1iZXI7XHJcbiAgYnV0dG9uVG91Y2hBcmVhWERpbGF0aW9uPzogbnVtYmVyO1xyXG4gIGJ1dHRvblRvdWNoQXJlYVlEaWxhdGlvbj86IG51bWJlcjtcclxuICBidXR0b25Nb3VzZUFyZWFYRGlsYXRpb24/OiBudW1iZXI7XHJcbiAgYnV0dG9uTW91c2VBcmVhWURpbGF0aW9uPzogbnVtYmVyO1xyXG5cclxuICAvLyBsaXN0XHJcbiAgbGlzdEZpbGw/OiBUUGFpbnQ7XHJcbiAgbGlzdFN0cm9rZT86IFRQYWludDtcclxuICBsaXN0TGluZVdpZHRoPzogbnVtYmVyO1xyXG5cclxuICAvLyBTb3VuZCBnZW5lcmF0b3JzIGZvciB3aGVuIGNvbWJvIGJveCBpcyBvcGVuZWQgYW5kIGZvciB3aGVuIGl0IGlzIGNsb3NlZCB3aXRoIG5vIGNoYW5nZSAoY2xvc2luZ1xyXG4gIC8vICp3aXRoKiBhIGNoYW5nZSBpcyBoYW5kbGVkIGVsc2V3aGVyZSkuXHJcbiAgb3BlbmVkU291bmRQbGF5ZXI/OiBUU291bmRQbGF5ZXI7XHJcbiAgY2xvc2VkTm9DaGFuZ2VTb3VuZFBsYXllcj86IFRTb3VuZFBsYXllcjtcclxuXHJcbiAgLy8gcGRvbVxyXG4gIC8vIFRoZSB0YWcgbmFtZSBmb3IgdGhlIGxhYmVsIG9mIHRoZSBDb21ib0JveC4gVGhlIEFjY2Vzc2libGVOYW1lQmVoYXZpb3IgZm9yd2FyZHMgdGhlIG5hbWUgdG8gdGhlIENvbWJvQm94QnV0dG9uLFxyXG4gIC8vIHNvIGlmIHlvdSBuZWVkIGEgZGlmZmVyZW50IHRhZyBuYW1lIGZvciB0aGUgQ29tYm9Cb3gsIHNldCBpdCBoZXJlLiBTZWUgdGhlIEFDQ0VTU0lCTEVfTkFNRV9CRUhBVklPUiBmdW5jdGlvbnNcclxuICAvLyBmb3IgQ29tYm9Cb3ggYW5kIENvbWJvQm94QnV0dG9uLlxyXG4gIGJ1dHRvbkxhYmVsVGFnTmFtZT86IHN0cmluZztcclxuXHJcbiAgLy8gVm9pY2luZ1xyXG4gIC8vIENvbWJvQm94IGRvZXMgbm90IG1peCBWb2ljaW5nLCBzbyBpdCBjcmVhdGVzIGN1c3RvbSBvcHRpb25zIHRvIHBhc3MgdG8gY29tcG9zZWQgVm9pY2luZyBOb2Rlcy5cclxuICAvLyBUaGUgcGF0dGVybiBmb3IgdGhlIG5hbWUgcmVzcG9uc2Ugc3RyaW5nLCBtdXN0IGluY2x1ZGUgYHt7dmFsdWV9fWAgc28gdGhhdCB0aGUgc2VsZWN0ZWQgdmFsdWUgc3RyaW5nIGNhblxyXG4gIC8vIGJlIGZpbGxlZCBpbi5cclxuICBjb21ib0JveFZvaWNpbmdOYW1lUmVzcG9uc2VQYXR0ZXJuPzogVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nPiB8IHN0cmluZztcclxuXHJcbiAgLy8gbW9zdCBjb250ZXh0IHJlc3BvbnNlcyBhcmUgZHluYW1pYyB0byB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgc2ltLCBzbyBsYXppbHkgY3JlYXRlIHRoZW0gd2hlbiBuZWVkZWQuXHJcbiAgY29tYm9Cb3hWb2ljaW5nQ29udGV4dFJlc3BvbnNlPzogKCAoKSA9PiBzdHJpbmcgfCBudWxsICkgfCBudWxsO1xyXG5cclxuICAvLyBzdHJpbmcgZm9yIHRoZSB2b2ljaW5nIHJlc3BvbnNlXHJcbiAgY29tYm9Cb3hWb2ljaW5nSGludFJlc3BvbnNlPzogU3BlYWthYmxlUmVzb2x2ZWRSZXNwb25zZSB8IG51bGw7XHJcbn07XHJcblxyXG50eXBlIFBhcmVudE9wdGlvbnMgPSBOb2RlT3B0aW9ucyAmIFdpZHRoU2l6YWJsZU9wdGlvbnM7XHJcbmV4cG9ydCB0eXBlIENvbWJvQm94T3B0aW9ucyA9IFNlbGZPcHRpb25zICYgUGFyZW50T3B0aW9ucztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbWJvQm94PFQ+IGV4dGVuZHMgV2lkdGhTaXphYmxlKCBOb2RlICkge1xyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IGxpc3RQb3NpdGlvbjogQ29tYm9Cb3hMaXN0UG9zaXRpb247XHJcblxyXG4gIC8vIExpc3Qgb2Ygbm9kZXMgY3JlYXRlZCBmcm9tIENvbWJvQm94SXRlbXMgdG8gYmUgZGlzcGxheWVkIHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyB2YWx1ZS4gU2VlIENvbWJvQm94SXRlbS5jcmVhdGVOb2RlKCkuXHJcbiAgcHVibGljIHJlYWRvbmx5IG5vZGVzOiBOb2RlW107XHJcblxyXG4gIC8vIEEgbWFwIGZyb20gdmFsdWVzIHRvIGR5bmFtaWMgYTExeSBuYW1lcy4gVGhpcyBpcyByZXF1aXJlZCBmb3IgY29ycmVjdCBvcGVyYXRpb24sIHNpbmNlIHdlIG5lZWQgdG8gYmUgYWJsZSB0b1xyXG4gIC8vIG1vZGlmeSBhMTF5IG5hbWVzIGR5bmFtaWNhbGx5ICh3aXRob3V0IHJlcXVpcmluZyBhbGwgQ29tYm9Cb3ggY2xpZW50cyB0byBkbyB0aGUgd2lyaW5nKS4gU2luY2Ugd2UgY2FuJ3QgcmVseSBvblxyXG4gIC8vIFByb3BlcnRpZXMgYmVpbmcgcGFzc2VkIGluLCB3ZSdsbCBuZWVkIHRvIGNyZWF0ZSBQcm9wZXJ0aWVzIGhlcmUuXHJcbiAgcHVibGljIHJlYWRvbmx5IGExMXlOYW1lUHJvcGVydHlNYXA6IENvbWJvQm94QTExeU5hbWVQcm9wZXJ0eU1hcDxUPjtcclxuXHJcbiAgLy8gYnV0dG9uIHRoYXQgc2hvd3MgdGhlIGN1cnJlbnQgc2VsZWN0aW9uIChpbnRlcm5hbClcclxuICBwdWJsaWMgYnV0dG9uOiBDb21ib0JveEJ1dHRvbjxUPjtcclxuXHJcbiAgLy8gdGhlIHBvcHVwIGxpc3QgYm94XHJcbiAgcHJpdmF0ZSByZWFkb25seSBsaXN0Qm94OiBDb21ib0JveExpc3RCb3g8VD47XHJcblxyXG4gIHByaXZhdGUgbGlzdFBhcmVudDogTm9kZTtcclxuXHJcbiAgLy8gdGhlIGRpc3BsYXkgdGhhdCBjbGlja1RvRGlzbWlzc0xpc3RlbmVyIGlzIGFkZGVkIHRvLCBiZWNhdXNlIHRoZSBzY2VuZSBtYXkgY2hhbmdlLCBzZWUgc3VuIzE0XHJcbiAgcHJpdmF0ZSBkaXNwbGF5OiBEaXNwbGF5IHwgbnVsbDtcclxuXHJcbiAgLy8gQ2xpY2tpbmcgYW55d2hlcmUgb3RoZXIgdGhhbiB0aGUgYnV0dG9uIG9yIGxpc3QgYm94IHdpbGwgaGlkZSB0aGUgbGlzdCBib3guXHJcbiAgcHJpdmF0ZSByZWFkb25seSBjbGlja1RvRGlzbWlzc0xpc3RlbmVyOiBUSW5wdXRMaXN0ZW5lcjtcclxuXHJcbiAgLy8gKFBET00pIHdoZW4gZm9jdXMgbGVhdmVzIHRoZSBDb21ib0JveExpc3RCb3gsIGl0IHNob3VsZCBiZSBjbG9zZWQuIFRoaXMgY291bGQgaGFwcGVuIGZyb20ga2V5Ym9hcmRcclxuICAvLyBvciBmcm9tIG90aGVyIHNjcmVlbiByZWFkZXIgY29udHJvbHMgKGxpa2UgVm9pY2VPdmVyIGdlc3R1cmVzKVxyXG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzbWlzc1dpdGhGb2N1c0xpc3RlbmVyOiAoIGZvY3VzOiBGb2N1cyB8IG51bGwgKSA9PiB2b2lkO1xyXG5cclxuICAvLyBGb3IgdXNlIHZpYSBQaEVULWlPLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3N1bi9pc3N1ZXMvNDUxXHJcbiAgLy8gVGhpcyBpcyBub3QgZ2VuZXJhbGx5IGNvbnRyb2xsZWQgYnkgdGhlIHVzZXIsIHNvIGl0IGlzIG5vdCByZXNldCB3aGVuIHRoZSBSZXNldCBBbGwgYnV0dG9uIGlzIHByZXNzZWQuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNwbGF5T25seVByb3BlcnR5OiBQcm9wZXJ0eTxib29sZWFuPjtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNwb3NlQ29tYm9Cb3g6ICgpID0+IHZvaWQ7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBwcm9wZXJ0eSAtIG11c3QgYmUgc2V0dGFibGUgYW5kIGxpbmthYmxlLCBidXQgbmVlZHMgdG8gc3VwcG9ydCBQcm9wZXJ0eSwgRGVyaXZlZFByb3BlcnR5IGFuZCBEeW5hbWljUHJvcGVydHlcclxuICAgKiBAcGFyYW0gaXRlbXMgLSBpdGVtcywgaW4gdGhlIG9yZGVyIHRoYXQgdGhleSBhcHBlYXIgaW4gdGhlIGxpc3Rib3hcclxuICAgKiBAcGFyYW0gbGlzdFBhcmVudCBub2RlIHRoYXQgd2lsbCBiZSB1c2VkIGFzIHRoZSBsaXN0J3MgcGFyZW50LCB1c2UgdGhpcyB0byBlbnN1cmUgdGhhdCB0aGUgbGlzdCBpcyBpbiBmcm9udCBvZiBldmVyeXRoaW5nIGVsc2VcclxuICAgKiBAcGFyYW0gW3Byb3ZpZGVkT3B0aW9uc11cclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHByb3BlcnR5OiBQaGV0aW9Qcm9wZXJ0eTxUPiwgaXRlbXM6IENvbWJvQm94SXRlbTxUPltdLCBsaXN0UGFyZW50OiBOb2RlLCBwcm92aWRlZE9wdGlvbnM/OiBDb21ib0JveE9wdGlvbnMgKSB7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggXy51bmlxQnkoIGl0ZW1zLCAoIGl0ZW06IENvbWJvQm94SXRlbTxUPiApID0+IGl0ZW0udmFsdWUgKS5sZW5ndGggPT09IGl0ZW1zLmxlbmd0aCxcclxuICAgICAgJ2l0ZW1zIG11c3QgaGF2ZSB1bmlxdWUgdmFsdWVzJyApO1xyXG4gICAgYXNzZXJ0ICYmIGl0ZW1zLmZvckVhY2goIGl0ZW0gPT4ge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhaXRlbS50YW5kZW1OYW1lIHx8IGl0ZW0udGFuZGVtTmFtZS5lbmRzV2l0aCggSVRFTV9UQU5ERU1fTkFNRV9TVUZGSVggKSxcclxuICAgICAgICBgQ29tYm9Cb3hJdGVtIHRhbmRlbU5hbWUgbXVzdCBlbmQgd2l0aCAnJHtJVEVNX1RBTkRFTV9OQU1FX1NVRkZJWH0nOiAke2l0ZW0udGFuZGVtTmFtZX1gICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zdW4vaXNzdWVzLzU0MlxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbGlzdFBhcmVudC5tYXhXaWR0aCA9PT0gbnVsbCxcclxuICAgICAgJ0NvbWJvQm94IGlzIHJlc3BvbnNpYmxlIGZvciBzY2FsaW5nIGxpc3RCb3guIFNldHRpbmcgbWF4V2lkdGggZm9yIGxpc3RQYXJlbnQgbWF5IHJlc3VsdCBpbiBidWdneSBiZWhhdmlvci4nICk7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxDb21ib0JveE9wdGlvbnMsIFNlbGZPcHRpb25zLCBQYXJlbnRPcHRpb25zPigpKCB7XHJcblxyXG4gICAgICBhbGlnbjogJ2xlZnQnLFxyXG4gICAgICBsaXN0UG9zaXRpb246ICdiZWxvdycsXHJcbiAgICAgIGxhYmVsWFNwYWNpbmc6IDEwLFxyXG4gICAgICBkaXNhYmxlZE9wYWNpdHk6IDAuNSxcclxuICAgICAgY29ybmVyUmFkaXVzOiA0LFxyXG4gICAgICBoaWdobGlnaHRGaWxsOiAncmdiKCAyNDUsIDI0NSwgMjQ1ICknLFxyXG4gICAgICB4TWFyZ2luOiAxMixcclxuICAgICAgeU1hcmdpbjogOCxcclxuXHJcbiAgICAgIC8vIGJ1dHRvblxyXG4gICAgICBidXR0b25GaWxsOiAnd2hpdGUnLFxyXG4gICAgICBidXR0b25TdHJva2U6ICdibGFjaycsXHJcbiAgICAgIGJ1dHRvbkxpbmVXaWR0aDogMSxcclxuICAgICAgYnV0dG9uVG91Y2hBcmVhWERpbGF0aW9uOiAwLFxyXG4gICAgICBidXR0b25Ub3VjaEFyZWFZRGlsYXRpb246IDAsXHJcbiAgICAgIGJ1dHRvbk1vdXNlQXJlYVhEaWxhdGlvbjogMCxcclxuICAgICAgYnV0dG9uTW91c2VBcmVhWURpbGF0aW9uOiAwLFxyXG5cclxuICAgICAgLy8gbGlzdFxyXG4gICAgICBsaXN0RmlsbDogJ3doaXRlJyxcclxuICAgICAgbGlzdFN0cm9rZTogJ2JsYWNrJyxcclxuICAgICAgbGlzdExpbmVXaWR0aDogMSxcclxuXHJcbiAgICAgIG9wZW5lZFNvdW5kUGxheWVyOiBnZW5lcmFsT3BlblNvdW5kUGxheWVyLFxyXG4gICAgICBjbG9zZWROb0NoYW5nZVNvdW5kUGxheWVyOiBnZW5lcmFsQ2xvc2VTb3VuZFBsYXllcixcclxuXHJcbiAgICAgIC8vIHBkb21cclxuICAgICAgdGFnTmFtZTogJ2RpdicsIC8vIG11c3QgaGF2ZSBhY2Nlc3NpYmxlIGNvbnRlbnQgdG8gc3VwcG9ydCBiZWhhdmlvciBmdW5jdGlvbnNcclxuICAgICAgYnV0dG9uTGFiZWxUYWdOYW1lOiAncCcsXHJcbiAgICAgIGFjY2Vzc2libGVOYW1lQmVoYXZpb3I6IEFDQ0VTU0lCTEVfTkFNRV9CRUhBVklPUixcclxuICAgICAgaGVscFRleHRCZWhhdmlvcjogSEVMUF9URVhUX0JFSEFWSU9SLFxyXG5cclxuICAgICAgY29tYm9Cb3hWb2ljaW5nTmFtZVJlc3BvbnNlUGF0dGVybjogU3VuQ29uc3RhbnRzLlZBTFVFX05BTUVEX1BMQUNFSE9MREVSLFxyXG4gICAgICBjb21ib0JveFZvaWNpbmdDb250ZXh0UmVzcG9uc2U6IG51bGwsXHJcbiAgICAgIGNvbWJvQm94Vm9pY2luZ0hpbnRSZXNwb25zZTogbnVsbCxcclxuXHJcbiAgICAgIC8vIHBoZXQtaW9cclxuICAgICAgdGFuZGVtOiBUYW5kZW0uUkVRVUlSRUQsXHJcbiAgICAgIHRhbmRlbU5hbWVTdWZmaXg6ICdDb21ib0JveCcsXHJcbiAgICAgIHBoZXRpb1R5cGU6IENvbWJvQm94LkNvbWJvQm94SU8sXHJcbiAgICAgIHBoZXRpb0ZlYXR1cmVkOiB0cnVlLFxyXG4gICAgICBwaGV0aW9FdmVudFR5cGU6IEV2ZW50VHlwZS5VU0VSLFxyXG4gICAgICB2aXNpYmxlUHJvcGVydHlPcHRpb25zOiB7IHBoZXRpb0ZlYXR1cmVkOiB0cnVlIH0sXHJcbiAgICAgIHBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZDogdHJ1ZSAvLyBvcHQgaW50byBkZWZhdWx0IFBoRVQtaU8gaW5zdHJ1bWVudGVkIGVuYWJsZWRQcm9wZXJ0eVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgY29uc3Qgbm9kZXMgPSBnZXRHcm91cEl0ZW1Ob2RlcyggaXRlbXMsIG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ2l0ZW1zJyApICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIG5vZGVzLmZvckVhY2goIG5vZGUgPT4ge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhbm9kZS5oYXNQRE9NQ29udGVudCwgJ0FjY2Vzc2liaWxpdHkgaXMgcHJvdmlkZWQgYnkgQ29tYm9Cb3hJdGVtTm9kZSBhbmQgJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnQ29tYm9Cb3hJdGVtLmExMXlMYWJlbC4gQWRkaXRpb25hbCBQRE9NIGNvbnRlbnQgaW4gdGhlIHByb3ZpZGVkICcgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ05vZGUgY291bGQgYnJlYWsgYWNjZXNzaWJpbGl0eS4nICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gdmFsaWRhdGUgb3B0aW9uIHZhbHVlc1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy54TWFyZ2luID4gMCAmJiBvcHRpb25zLnlNYXJnaW4gPiAwLFxyXG4gICAgICBgbWFyZ2lucyBtdXN0IGJlID4gMCwgeE1hcmdpbj0ke29wdGlvbnMueE1hcmdpbn0sIHlNYXJnaW49JHtvcHRpb25zLnlNYXJnaW59YCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggXy5pbmNsdWRlcyggTElTVF9QT1NJVElPTl9WQUxVRVMsIG9wdGlvbnMubGlzdFBvc2l0aW9uICksXHJcbiAgICAgIGBpbnZhbGlkIGxpc3RQb3NpdGlvbjogJHtvcHRpb25zLmxpc3RQb3NpdGlvbn1gICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBfLmluY2x1ZGVzKCBBTElHTl9WQUxVRVMsIG9wdGlvbnMuYWxpZ24gKSxcclxuICAgICAgYGludmFsaWQgYWxpZ246ICR7b3B0aW9ucy5hbGlnbn1gICk7XHJcblxyXG4gICAgc3VwZXIoKTtcclxuXHJcbiAgICB0aGlzLm5vZGVzID0gbm9kZXM7XHJcbiAgICB0aGlzLmExMXlOYW1lUHJvcGVydHlNYXAgPSBDb21ib0JveC5nZXRBMTF5TmFtZVByb3BlcnR5TWFwKCBpdGVtcyApO1xyXG5cclxuICAgIHRoaXMubGlzdFBvc2l0aW9uID0gb3B0aW9ucy5saXN0UG9zaXRpb247XHJcblxyXG4gICAgdGhpcy5idXR0b24gPSBuZXcgQ29tYm9Cb3hCdXR0b24oIHByb3BlcnR5LCBpdGVtcywgbm9kZXMsIHRoaXMuYTExeU5hbWVQcm9wZXJ0eU1hcCwge1xyXG4gICAgICBhbGlnbjogb3B0aW9ucy5hbGlnbixcclxuICAgICAgYXJyb3dEaXJlY3Rpb246ICggb3B0aW9ucy5saXN0UG9zaXRpb24gPT09ICdiZWxvdycgKSA/ICdkb3duJyA6ICd1cCcsXHJcbiAgICAgIGNvcm5lclJhZGl1czogb3B0aW9ucy5jb3JuZXJSYWRpdXMsXHJcbiAgICAgIHhNYXJnaW46IG9wdGlvbnMueE1hcmdpbixcclxuICAgICAgeU1hcmdpbjogb3B0aW9ucy55TWFyZ2luLFxyXG4gICAgICBiYXNlQ29sb3I6IG9wdGlvbnMuYnV0dG9uRmlsbCxcclxuICAgICAgc3Ryb2tlOiBvcHRpb25zLmJ1dHRvblN0cm9rZSxcclxuICAgICAgbGluZVdpZHRoOiBvcHRpb25zLmJ1dHRvbkxpbmVXaWR0aCxcclxuICAgICAgdG91Y2hBcmVhWERpbGF0aW9uOiBvcHRpb25zLmJ1dHRvblRvdWNoQXJlYVhEaWxhdGlvbixcclxuICAgICAgdG91Y2hBcmVhWURpbGF0aW9uOiBvcHRpb25zLmJ1dHRvblRvdWNoQXJlYVlEaWxhdGlvbixcclxuICAgICAgbW91c2VBcmVhWERpbGF0aW9uOiBvcHRpb25zLmJ1dHRvbk1vdXNlQXJlYVhEaWxhdGlvbixcclxuICAgICAgbW91c2VBcmVhWURpbGF0aW9uOiBvcHRpb25zLmJ1dHRvbk1vdXNlQXJlYVlEaWxhdGlvbixcclxuICAgICAgbG9jYWxQcmVmZXJyZWRXaWR0aFByb3BlcnR5OiB0aGlzLmxvY2FsUHJlZmVycmVkV2lkdGhQcm9wZXJ0eSxcclxuICAgICAgbG9jYWxNaW5pbXVtV2lkdGhQcm9wZXJ0eTogdGhpcy5sb2NhbE1pbmltdW1XaWR0aFByb3BlcnR5LFxyXG5cclxuICAgICAgY29tYm9Cb3hWb2ljaW5nTmFtZVJlc3BvbnNlUGF0dGVybjogb3B0aW9ucy5jb21ib0JveFZvaWNpbmdOYW1lUmVzcG9uc2VQYXR0ZXJuLFxyXG5cclxuICAgICAgLy8gcGRvbSAtIGFjY2Vzc2libGVOYW1lIGFuZCBoZWxwVGV4dCBhcmUgc2V0IHZpYSBiZWhhdmlvciBmdW5jdGlvbnMgb24gdGhlIENvbWJvQm94XHJcbiAgICAgIGxhYmVsVGFnTmFtZTogb3B0aW9ucy5idXR0b25MYWJlbFRhZ05hbWUsXHJcblxyXG4gICAgICAvLyBwaGV0LWlvXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAnYnV0dG9uJyApXHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLmFkZENoaWxkKCB0aGlzLmJ1dHRvbiApO1xyXG5cclxuICAgIHRoaXMubGlzdEJveCA9IG5ldyBDb21ib0JveExpc3RCb3goIHByb3BlcnR5LCBpdGVtcywgbm9kZXMsIHRoaXMuYTExeU5hbWVQcm9wZXJ0eU1hcCxcclxuICAgICAgdGhpcy5oaWRlTGlzdEJveC5iaW5kKCB0aGlzICksIC8vIGNhbGxiYWNrIHRvIGhpZGUgdGhlIGxpc3QgYm94XHJcbiAgICAgICgpID0+IHtcclxuICAgICAgICB0aGlzLmJ1dHRvbi5ibG9ja05leHRWb2ljaW5nRm9jdXNMaXN0ZW5lcigpO1xyXG4gICAgICAgIHRoaXMuYnV0dG9uLmZvY3VzKCk7XHJcbiAgICAgIH0sXHJcbiAgICAgIHRoaXMuYnV0dG9uLFxyXG4gICAgICBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdsaXN0Qm94JyApLCB7XHJcbiAgICAgICAgYWxpZ246IG9wdGlvbnMuYWxpZ24sXHJcbiAgICAgICAgaGlnaGxpZ2h0RmlsbDogb3B0aW9ucy5oaWdobGlnaHRGaWxsLFxyXG4gICAgICAgIHhNYXJnaW46IG9wdGlvbnMueE1hcmdpbixcclxuICAgICAgICB5TWFyZ2luOiBvcHRpb25zLnlNYXJnaW4sXHJcbiAgICAgICAgY29ybmVyUmFkaXVzOiBvcHRpb25zLmNvcm5lclJhZGl1cyxcclxuICAgICAgICBmaWxsOiBvcHRpb25zLmxpc3RGaWxsLFxyXG4gICAgICAgIHN0cm9rZTogb3B0aW9ucy5saXN0U3Ryb2tlLFxyXG4gICAgICAgIGxpbmVXaWR0aDogb3B0aW9ucy5saXN0TGluZVdpZHRoLFxyXG4gICAgICAgIHZpc2libGU6IGZhbHNlLFxyXG5cclxuICAgICAgICBjb21ib0JveExpc3RJdGVtTm9kZU9wdGlvbnM6IHtcclxuICAgICAgICAgIGNvbWJvQm94Vm9pY2luZ05hbWVSZXNwb25zZVBhdHRlcm46IG9wdGlvbnMuY29tYm9Cb3hWb2ljaW5nTmFtZVJlc3BvbnNlUGF0dGVybixcclxuICAgICAgICAgIHZvaWNpbmdDb250ZXh0UmVzcG9uc2U6IG9wdGlvbnMuY29tYm9Cb3hWb2ljaW5nQ29udGV4dFJlc3BvbnNlLFxyXG4gICAgICAgICAgdm9pY2luZ0hpbnRSZXNwb25zZTogb3B0aW9ucy5jb21ib0JveFZvaWNpbmdIaW50UmVzcG9uc2VcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLyBzb3VuZCBnZW5lcmF0aW9uXHJcbiAgICAgICAgb3BlbmVkU291bmRQbGF5ZXI6IG9wdGlvbnMub3BlbmVkU291bmRQbGF5ZXIsXHJcbiAgICAgICAgY2xvc2VkTm9DaGFuZ2VTb3VuZFBsYXllcjogb3B0aW9ucy5jbG9zZWROb0NoYW5nZVNvdW5kUGxheWVyLFxyXG5cclxuICAgICAgICAvLyBwZG9tXHJcbiAgICAgICAgLy8gdGhlIGxpc3QgYm94IGlzIGFyaWEtbGFiZWxsZWRieSBpdHMgb3duIGxhYmVsIHNpYmxpbmdcclxuICAgICAgICBhcmlhTGFiZWxsZWRieUFzc29jaWF0aW9uczogWyB7XHJcbiAgICAgICAgICBvdGhlck5vZGU6IHRoaXMuYnV0dG9uLFxyXG4gICAgICAgICAgb3RoZXJFbGVtZW50TmFtZTogUERPTVBlZXIuTEFCRUxfU0lCTElORyxcclxuICAgICAgICAgIHRoaXNFbGVtZW50TmFtZTogUERPTVBlZXIuUFJJTUFSWV9TSUJMSU5HXHJcbiAgICAgICAgfSBdXHJcbiAgICAgIH0gKTtcclxuICAgIGxpc3RQYXJlbnQuYWRkQ2hpbGQoIHRoaXMubGlzdEJveCApO1xyXG4gICAgdGhpcy5saXN0UGFyZW50ID0gbGlzdFBhcmVudDtcclxuXHJcbiAgICBjb25zdCBsaXN0Qm94TWF0cml4UHJvcGVydHkgPSBuZXcgTWF0cml4QmV0d2VlblByb3BlcnR5KCB0aGlzLmJ1dHRvbiwgdGhpcy5saXN0UGFyZW50LCB7XHJcbiAgICAgIGZyb21Db29yZGluYXRlRnJhbWU6ICdwYXJlbnQnLFxyXG4gICAgICB0b0Nvb3JkaW5hdGVGcmFtZTogJ2xvY2FsJ1xyXG4gICAgfSApO1xyXG5cclxuICAgIE11bHRpbGluay5tdWx0aWxpbmsoIFsgbGlzdEJveE1hdHJpeFByb3BlcnR5LCB0aGlzLmJ1dHRvbi5sb2NhbEJvdW5kc1Byb3BlcnR5LCB0aGlzLmxpc3RCb3gubG9jYWxCb3VuZHNQcm9wZXJ0eSBdLFxyXG4gICAgICBtYXRyaXggPT4ge1xyXG4gICAgICAgIHRoaXMuc2NhbGVBbmRQb3NpdGlvbkxpc3RCb3goIG1hdHJpeCApO1xyXG4gICAgICB9ICk7XHJcblxyXG4gICAgLy8gVGhlIGxpc3RCb3ggaXMgbm90IGEgY2hpbGQgTm9kZSBvZiBDb21ib0JveCBhbmQsIGFzIGEgcmVzdWx0LCBsaXN0ZW4gdG8gb3BhY2l0eSBvZiB0aGUgQ29tYm9Cb3ggYW5kIGtlZXBcclxuICAgIC8vIHRoZSBsaXN0Qm94IGluIHN5bmMgd2l0aCB0aGVtLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3N1bi9pc3N1ZXMvNTg3XHJcbiAgICB0aGlzLm9wYWNpdHlQcm9wZXJ0eS5saW5rKCBvcGFjaXR5ID0+IHsgdGhpcy5saXN0Qm94Lm9wYWNpdHlQcm9wZXJ0eS52YWx1ZSA9IG9wYWNpdHk7IH0gKTtcclxuXHJcbiAgICB0aGlzLm11dGF0ZSggb3B0aW9ucyApO1xyXG5cclxuICAgIGlmICggYXNzZXJ0ICYmIFRhbmRlbS5WQUxJREFUSU9OICYmIHRoaXMuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSApIHtcclxuICAgICAgaXRlbXMuZm9yRWFjaCggaXRlbSA9PiB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggaXRlbS50YW5kZW1OYW1lICE9PSBudWxsLCBgUGhFVC1pTyBpbnN0cnVtZW50ZWQgQ29tYm9Cb3hlcyByZXF1aXJlIENvbWJvQm94SXRlbXMgdG8gaGF2ZSB0YW5kZW1OYW1lOiAke2l0ZW0udmFsdWV9YCApO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2xpY2tpbmcgb24gdGhlIGJ1dHRvbiB0b2dnbGVzIHZpc2liaWxpdHkgb2YgdGhlIGxpc3QgYm94XHJcbiAgICB0aGlzLmJ1dHRvbi5hZGRMaXN0ZW5lciggKCkgPT4ge1xyXG4gICAgICB0aGlzLmxpc3RCb3gudmlzaWJsZVByb3BlcnR5LnZhbHVlID0gIXRoaXMubGlzdEJveC52aXNpYmxlUHJvcGVydHkudmFsdWU7XHJcbiAgICAgIHRoaXMubGlzdEJveC52aXNpYmxlUHJvcGVydHkudmFsdWUgJiYgdGhpcy5saXN0Qm94LmZvY3VzTGlzdEl0ZW1Ob2RlKCBwcm9wZXJ0eS52YWx1ZSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuZGlzcGxheSA9IG51bGw7XHJcblxyXG4gICAgdGhpcy5jbGlja1RvRGlzbWlzc0xpc3RlbmVyID0ge1xyXG4gICAgICBkb3duOiBldmVudCA9PiB7XHJcblxyXG4gICAgICAgIC8vIElmIGZ1enppbmcgaXMgZW5hYmxlZCwgZXhlcmNpc2UgdGhpcyBsaXN0ZW5lciBzb21lIHBlcmNlbnRhZ2Ugb2YgdGhlIHRpbWUsIHNvIHRoYXQgdGhpcyBsaXN0ZW5lciBpcyB0ZXN0ZWQuXHJcbiAgICAgICAgLy8gVGhlIHJlc3Qgb2YgdGhlIHRpbWUsIGlnbm9yZSB0aGlzIGxpc3RlbmVyLCBzbyB0aGF0IHRoZSBsaXN0Ym94IHJlbWFpbnMgcG9wcGVkIHVwLCBhbmQgd2UgdGVzdCBtYWtpbmdcclxuICAgICAgICAvLyBjaG9pY2VzIGZyb20gdGhlIGxpc3Rib3guIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc3VuL2lzc3Vlcy82NzcgZm9yIHRoZSBpbml0aWFsIGltcGxlbWVudGF0aW9uLFxyXG4gICAgICAgIC8vIGFuZCBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2FxdWEvaXNzdWVzLzEzNiBmb3IgdGhlIHByb2JhYmlsaXR5IHZhbHVlIGNob3Nlbi5cclxuICAgICAgICBpZiAoICFwaGV0LmNoaXBwZXIuaXNGdXp6RW5hYmxlZCgpIHx8IGRvdFJhbmRvbS5uZXh0RG91YmxlKCkgPCAwLjAwNSApIHtcclxuXHJcbiAgICAgICAgICAvLyBJZ25vcmUgaWYgd2UgY2xpY2sgb3ZlciB0aGUgYnV0dG9uLCBzaW5jZSB0aGUgYnV0dG9uIHdpbGwgaGFuZGxlIGhpZGluZyB0aGUgbGlzdC5cclxuICAgICAgICAgIGlmICggISggZXZlbnQudHJhaWwuY29udGFpbnNOb2RlKCB0aGlzLmJ1dHRvbiApIHx8IGV2ZW50LnRyYWlsLmNvbnRhaW5zTm9kZSggdGhpcy5saXN0Qm94ICkgKSApIHtcclxuICAgICAgICAgICAgdGhpcy5oaWRlTGlzdEJveCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmRpc21pc3NXaXRoRm9jdXNMaXN0ZW5lciA9IGZvY3VzID0+IHtcclxuICAgICAgaWYgKCBmb2N1cyAmJiAhZm9jdXMudHJhaWwuY29udGFpbnNOb2RlKCB0aGlzLmxpc3RCb3ggKSApIHtcclxuICAgICAgICB0aGlzLmhpZGVMaXN0Qm94KCk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgICBGb2N1c01hbmFnZXIucGRvbUZvY3VzUHJvcGVydHkubGluayggdGhpcy5kaXNtaXNzV2l0aEZvY3VzTGlzdGVuZXIgKTtcclxuXHJcbiAgICB0aGlzLmxpc3RCb3gudmlzaWJsZVByb3BlcnR5LmxpbmsoIHZpc2libGUgPT4ge1xyXG4gICAgICBpZiAoIHZpc2libGUgKSB7XHJcblxyXG4gICAgICAgIC8vIHNob3cgdGhlIGxpc3QgYm94XHJcbiAgICAgICAgdGhpcy5zY2FsZUxpc3RCb3goKTtcclxuICAgICAgICB0aGlzLmxpc3RCb3gubW92ZVRvRnJvbnQoKTtcclxuXHJcbiAgICAgICAgLy8gbWFuYWdlIGNsaWNrVG9EaXNtaXNzTGlzdGVuZXJcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5kaXNwbGF5LCAndW5leHBlY3RlZCBkaXNwbGF5JyApO1xyXG4gICAgICAgIHRoaXMuZGlzcGxheSA9IHRoaXMuZ2V0VW5pcXVlVHJhaWwoKS5yb290Tm9kZSgpLmdldFJvb3RlZERpc3BsYXlzKClbIDAgXTtcclxuICAgICAgICB0aGlzLmRpc3BsYXkuYWRkSW5wdXRMaXN0ZW5lciggdGhpcy5jbGlja1RvRGlzbWlzc0xpc3RlbmVyICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgIC8vIG1hbmFnZSBjbGlja1RvRGlzbWlzc0xpc3RlbmVyXHJcbiAgICAgICAgaWYgKCB0aGlzLmRpc3BsYXkgJiYgdGhpcy5kaXNwbGF5Lmhhc0lucHV0TGlzdGVuZXIoIHRoaXMuY2xpY2tUb0Rpc21pc3NMaXN0ZW5lciApICkge1xyXG4gICAgICAgICAgdGhpcy5kaXNwbGF5LnJlbW92ZUlucHV0TGlzdGVuZXIoIHRoaXMuY2xpY2tUb0Rpc21pc3NMaXN0ZW5lciApO1xyXG4gICAgICAgICAgdGhpcy5kaXNwbGF5ID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLmRpc3BsYXlPbmx5UHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCBmYWxzZSwge1xyXG4gICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ2Rpc3BsYXlPbmx5UHJvcGVydHknICksXHJcbiAgICAgIHBoZXRpb0ZlYXR1cmVkOiB0cnVlLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnZGlzYWJsZXMgaW50ZXJhY3Rpb24gd2l0aCB0aGUgQ29tYm9Cb3ggYW5kICcgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAnbWFrZXMgaXQgYXBwZWFyIGxpa2UgYSBkaXNwbGF5IHRoYXQgc2hvd3MgdGhlIGN1cnJlbnQgc2VsZWN0aW9uJ1xyXG4gICAgfSApO1xyXG4gICAgdGhpcy5kaXNwbGF5T25seVByb3BlcnR5LmxpbmsoIGRpc3BsYXlPbmx5ID0+IHtcclxuICAgICAgdGhpcy5oaWRlTGlzdEJveCgpO1xyXG4gICAgICB0aGlzLmJ1dHRvbi5zZXREaXNwbGF5T25seSggZGlzcGxheU9ubHkgKTtcclxuICAgICAgdGhpcy5waWNrYWJsZSA9ICFkaXNwbGF5T25seTtcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLmFkZExpbmtlZEVsZW1lbnQoIHByb3BlcnR5LCB7XHJcbiAgICAgIHRhbmRlbU5hbWU6ICdwcm9wZXJ0eSdcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLmRpc3Bvc2VDb21ib0JveCA9ICgpID0+IHtcclxuICAgICAgbGlzdEJveE1hdHJpeFByb3BlcnR5LmRpc3Bvc2UoKTtcclxuXHJcbiAgICAgIGlmICggdGhpcy5kaXNwbGF5ICYmIHRoaXMuZGlzcGxheS5oYXNJbnB1dExpc3RlbmVyKCB0aGlzLmNsaWNrVG9EaXNtaXNzTGlzdGVuZXIgKSApIHtcclxuICAgICAgICB0aGlzLmRpc3BsYXkucmVtb3ZlSW5wdXRMaXN0ZW5lciggdGhpcy5jbGlja1RvRGlzbWlzc0xpc3RlbmVyICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIEZvY3VzTWFuYWdlci5wZG9tRm9jdXNQcm9wZXJ0eS51bmxpbmsoIHRoaXMuZGlzbWlzc1dpdGhGb2N1c0xpc3RlbmVyICk7XHJcblxyXG4gICAgICAvLyBkaXNwb3NlIG9mIHN1YmNvbXBvbmVudHNcclxuICAgICAgdGhpcy5kaXNwbGF5T25seVByb3BlcnR5LmRpc3Bvc2UoKTsgLy8gdGFuZGVtcyBtdXN0IGJlIGNsZWFuZWQgdXBcclxuICAgICAgdGhpcy5saXN0Qm94LmRpc3Bvc2UoKTtcclxuICAgICAgdGhpcy5idXR0b24uZGlzcG9zZSgpO1xyXG4gICAgICBub2Rlcy5mb3JFYWNoKCBub2RlID0+IG5vZGUuZGlzcG9zZSgpICk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIHN1cHBvcnQgZm9yIGJpbmRlciBkb2N1bWVudGF0aW9uLCBzdHJpcHBlZCBvdXQgaW4gYnVpbGRzIGFuZCBvbmx5IHJ1bnMgd2hlbiA/YmluZGVyIGlzIHNwZWNpZmllZFxyXG4gICAgYXNzZXJ0ICYmIHBoZXQ/LmNoaXBwZXI/LnF1ZXJ5UGFyYW1ldGVycz8uYmluZGVyICYmIEluc3RhbmNlUmVnaXN0cnkucmVnaXN0ZXJEYXRhVVJMKCAnc3VuJywgJ0NvbWJvQm94JywgdGhpcyApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmRpc3Bvc2VDb21ib0JveCgpO1xyXG4gICAgc3VwZXIuZGlzcG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2hvd3MgdGhlIGxpc3QgYm94LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzaG93TGlzdEJveCgpOiB2b2lkIHtcclxuICAgIHRoaXMubGlzdEJveC52aXNpYmxlUHJvcGVydHkudmFsdWUgPSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGlkZXMgdGhlIGxpc3QgYm94LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBoaWRlTGlzdEJveCgpOiB2b2lkIHtcclxuICAgIHRoaXMubGlzdEJveC52aXNpYmxlUHJvcGVydHkudmFsdWUgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEJlY2F1c2UgdGhlIGJ1dHRvbiBhbmQgbGlzdCBib3ggaGF2ZSBkaWZmZXJlbnQgcGFyZW50cyAoYW5kIHRoZXJlZm9yZSBkaWZmZXJlbnQgY29vcmRpbmF0ZSBmcmFtZXMpXHJcbiAgICogdGhleSBtYXkgYmUgc2NhbGVkIGRpZmZlcmVudGx5LiBUaGlzIG1ldGhvZCBzY2FsZXMgdGhlIGxpc3QgYm94IHNvIHRoYXQgaXRlbXMgb24gdGhlIGJ1dHRvbiBhbmQgaW5cclxuICAgKiB0aGUgbGlzdCBhcHBlYXIgdG8gYmUgdGhlIHNhbWUgc2l6ZS5cclxuICAgKi9cclxuICBwcml2YXRlIHNjYWxlTGlzdEJveCgpOiB2b2lkIHtcclxuXHJcbiAgICAvLyBUbyBzdXBwb3J0IGFuIGVtcHR5IGxpc3QgYm94IGR1ZSB0byBQaEVULWlPIGN1c3RvbWl6YXRpb24sIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc3VuL2lzc3Vlcy82MDZcclxuICAgIGlmICggIXRoaXMubGlzdEJveC5sb2NhbEJvdW5kcy5pc0VtcHR5KCkgKSB7XHJcbiAgICAgIGNvbnN0IGJ1dHRvblNjYWxlID0gdGhpcy5idXR0b24ubG9jYWxUb0dsb2JhbEJvdW5kcyggdGhpcy5idXR0b24ubG9jYWxCb3VuZHMgKS53aWR0aCAvIHRoaXMuYnV0dG9uLmxvY2FsQm91bmRzLndpZHRoO1xyXG4gICAgICBjb25zdCBsaXN0Qm94U2NhbGUgPSB0aGlzLmxpc3RCb3gubG9jYWxUb0dsb2JhbEJvdW5kcyggdGhpcy5saXN0Qm94LmxvY2FsQm91bmRzICkud2lkdGggLyB0aGlzLmxpc3RCb3gubG9jYWxCb3VuZHMud2lkdGg7XHJcbiAgICAgIHRoaXMubGlzdEJveC5zY2FsZSggYnV0dG9uU2NhbGUgLyBsaXN0Qm94U2NhbGUgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgc2NhbGVBbmRQb3NpdGlvbkxpc3RCb3goIGxpc3RCb3hNYXRyaXg6IE1hdHJpeDMgfCBudWxsICk6IHZvaWQge1xyXG4gICAgaWYgKCBsaXN0Qm94TWF0cml4ICkge1xyXG5cclxuICAgICAgLy8gU2NhbGUgdGhlIGJveCBiZWZvcmUgcG9zaXRpb25pbmcuXHJcbiAgICAgIHRoaXMuc2NhbGVMaXN0Qm94KCk7XHJcblxyXG4gICAgICBpZiAoIHRoaXMubGlzdFBvc2l0aW9uID09PSAnYWJvdmUnICkge1xyXG4gICAgICAgIHRoaXMubGlzdEJveC5sZWZ0Qm90dG9tID0gbGlzdEJveE1hdHJpeC50aW1lc1ZlY3RvcjIoIHRoaXMuYnV0dG9uLmxlZnRUb3AgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB0aGlzLmxpc3RCb3gubGVmdFRvcCA9IGxpc3RCb3hNYXRyaXgudGltZXNWZWN0b3IyKCB0aGlzLmJ1dHRvbi5sZWZ0Qm90dG9tICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHZpc2liaWxpdHkgb2YgaXRlbXMgdGhhdCBjb3JyZXNwb25kIHRvIGEgdmFsdWUuIElmIHRoZSBzZWxlY3RlZCBpdGVtIGhhcyB0aGlzIHZhbHVlLCBpdCdzIHlvdXJcclxuICAgKiByZXNwb25zaWJpbGl0eSB0byBjaGFuZ2UgdGhlIFByb3BlcnR5IHZhbHVlIHRvIHNvbWV0aGluZyBlbHNlLiBPdGhlcndpc2UsIHRoZSBjb21ibyBib3ggYnV0dG9uIHdpbGwgY29udGludWVcclxuICAgKiB0byBkaXNwbGF5IHRoaXMgdmFsdWUuXHJcbiAgICogQHBhcmFtIHZhbHVlIC0gdGhlIHZhbHVlIGFzc29jaWF0ZWQgd2l0aCB0aGUgQ29tYm9Cb3hJdGVtXHJcbiAgICogQHBhcmFtIHZpc2libGVcclxuICAgKi9cclxuICBwdWJsaWMgc2V0SXRlbVZpc2libGUoIHZhbHVlOiBULCB2aXNpYmxlOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgdGhpcy5saXN0Qm94LnNldEl0ZW1WaXNpYmxlKCB2YWx1ZSwgdmlzaWJsZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSXMgdGhlIGl0ZW0gdGhhdCBjb3JyZXNwb25kcyB0byBhIHZhbHVlIHZpc2libGUgd2hlbiB0aGUgbGlzdGJveCBpcyBwb3BwZWQgdXA/XHJcbiAgICogQHBhcmFtIHZhbHVlIC0gdGhlIHZhbHVlIGFzc29jaWF0ZWQgd2l0aCB0aGUgQ29tYm9Cb3hJdGVtXHJcbiAgICovXHJcbiAgcHVibGljIGlzSXRlbVZpc2libGUoIHZhbHVlOiBUICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMubGlzdEJveC5pc0l0ZW1WaXNpYmxlKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyBnZXRNYXhJdGVtV2lkdGhQcm9wZXJ0eSggbm9kZXM6IE5vZGVbXSApOiBUUmVhZE9ubHlQcm9wZXJ0eTxudW1iZXI+IHtcclxuICAgIGNvbnN0IHdpZHRoUHJvcGVydGllcyA9IF8uZmxhdHRlbiggbm9kZXMubWFwKCBub2RlID0+IHtcclxuICAgICAgY29uc3QgcHJvcGVydGllczogVFJlYWRPbmx5UHJvcGVydHk8SW50ZW50aW9uYWxBbnk+W10gPSBbIG5vZGUuYm91bmRzUHJvcGVydHkgXTtcclxuICAgICAgaWYgKCBleHRlbmRzV2lkdGhTaXphYmxlKCBub2RlICkgKSB7XHJcbiAgICAgICAgcHJvcGVydGllcy5wdXNoKCBub2RlLmlzV2lkdGhSZXNpemFibGVQcm9wZXJ0eSApO1xyXG4gICAgICAgIHByb3BlcnRpZXMucHVzaCggbm9kZS5taW5pbXVtV2lkdGhQcm9wZXJ0eSApO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBwcm9wZXJ0aWVzO1xyXG4gICAgfSApICk7XHJcbiAgICByZXR1cm4gRGVyaXZlZFByb3BlcnR5LmRlcml2ZUFueSggd2lkdGhQcm9wZXJ0aWVzLCAoKSA9PiB7XHJcbiAgICAgIHJldHVybiBNYXRoLm1heCggLi4ubm9kZXMubWFwKCBub2RlID0+IGlzV2lkdGhTaXphYmxlKCBub2RlICkgPyBub2RlLm1pbmltdW1XaWR0aCB8fCAwIDogbm9kZS53aWR0aCApICk7XHJcbiAgICB9LCB7XHJcbiAgICAgIHN0cmljdEF4b25EZXBlbmRlbmNpZXM6IGZhbHNlIC8vVE9ETyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc3VuL2lzc3Vlcy84NzBcclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgZ2V0TWF4SXRlbUhlaWdodFByb3BlcnR5KCBub2RlczogTm9kZVtdICk6IFRSZWFkT25seVByb3BlcnR5PG51bWJlcj4ge1xyXG4gICAgY29uc3QgaGVpZ2h0UHJvcGVydGllcyA9IG5vZGVzLm1hcCggbm9kZSA9PiBub2RlLmJvdW5kc1Byb3BlcnR5ICk7XHJcbiAgICByZXR1cm4gRGVyaXZlZFByb3BlcnR5LmRlcml2ZUFueSggaGVpZ2h0UHJvcGVydGllcywgKCkgPT4ge1xyXG4gICAgICByZXR1cm4gTWF0aC5tYXgoIC4uLm5vZGVzLm1hcCggbm9kZSA9PiBub2RlLmhlaWdodCApICk7XHJcbiAgICB9LCB7XHJcbiAgICAgIHN0cmljdEF4b25EZXBlbmRlbmNpZXM6IGZhbHNlIC8vVE9ETyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc3VuL2lzc3Vlcy84NzBcclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgZ2V0QTExeU5hbWVQcm9wZXJ0eU1hcDxUPiggaXRlbXM6IENvbWJvQm94SXRlbTxUPltdICk6IENvbWJvQm94QTExeU5hbWVQcm9wZXJ0eU1hcDxUPiB7XHJcbiAgICBjb25zdCBtYXAgPSBuZXcgTWFwPFQsIFRSZWFkT25seVByb3BlcnR5PHN0cmluZyB8IG51bGw+PigpO1xyXG5cclxuICAgIC8vIENvbm5lY3QgYTExeU5hbWVQcm9wZXJ0eU1hcCwgY3JlYXRpbmcgUHJvcGVydGllcyBhcyBuZWVkZWQuXHJcbiAgICBpdGVtcy5mb3JFYWNoKCBpdGVtID0+IHtcclxuICAgICAgbGV0IHByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxzdHJpbmcgfCBudWxsPjtcclxuXHJcbiAgICAgIGlmICggaXNUUmVhZE9ubHlQcm9wZXJ0eSggaXRlbS5hMTF5TmFtZSApICkge1xyXG4gICAgICAgIHByb3BlcnR5ID0gaXRlbS5hMTF5TmFtZTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggdHlwZW9mIGl0ZW0uYTExeU5hbWUgPT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgIHByb3BlcnR5ID0gbmV3IFRpbnlQcm9wZXJ0eSggaXRlbS5hMTF5TmFtZSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHByb3BlcnR5ID0gbmV3IFRpbnlQcm9wZXJ0eSggbnVsbCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBtYXAuc2V0KCBpdGVtLnZhbHVlLCBwcm9wZXJ0eSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIHJldHVybiBtYXA7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIENvbWJvQm94SU8gPSBuZXcgSU9UeXBlKCAnQ29tYm9Cb3hJTycsIHtcclxuICAgIHZhbHVlVHlwZTogQ29tYm9Cb3gsXHJcbiAgICBkb2N1bWVudGF0aW9uOiAnQSBjb21ibyBib3ggaXMgY29tcG9zZWQgb2YgYSBwdXNoIGJ1dHRvbiBhbmQgYSBsaXN0Ym94LiBUaGUgbGlzdGJveCBjb250YWlucyBpdGVtcyB0aGF0IHJlcHJlc2VudCAnICtcclxuICAgICAgICAgICAgICAgICAgICdjaG9pY2VzLiBQcmVzc2luZyB0aGUgYnV0dG9uIHBvcHMgdXAgdGhlIGxpc3Rib3guIFNlbGVjdGluZyBmcm9tIGFuIGl0ZW0gaW4gdGhlIGxpc3Rib3ggc2V0cyB0aGUgJyArXHJcbiAgICAgICAgICAgICAgICAgICAndmFsdWUgb2YgYW4gYXNzb2NpYXRlZCBQcm9wZXJ0eS4gVGhlIGJ1dHRvbiBzaG93cyB0aGUgaXRlbSB0aGF0IGlzIGN1cnJlbnRseSBzZWxlY3RlZC4nLFxyXG4gICAgc3VwZXJ0eXBlOiBOb2RlLk5vZGVJTyxcclxuICAgIGV2ZW50czogWyAnbGlzdEJveFNob3duJywgJ2xpc3RCb3hIaWRkZW4nIF1cclxuICB9ICk7XHJcbn1cclxuXHJcbnN1bi5yZWdpc3RlciggJ0NvbWJvQm94JywgQ29tYm9Cb3ggKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsZUFBZSxNQUFNLGtDQUFrQztBQUU5RCxPQUFPQyxTQUFTLE1BQU0sMkJBQTJCO0FBQ2pELE9BQU9DLGdCQUFnQixNQUFNLHNEQUFzRDtBQUNuRixPQUFPQyxTQUFTLE1BQU0saUNBQWlDO0FBQ3ZELFNBQWtCQyxtQkFBbUIsRUFBU0MsWUFBWSxFQUFFQyxjQUFjLEVBQUVDLHFCQUFxQixFQUFFQyxJQUFJLEVBQXFDQyxRQUFRLEVBQWlEQyxZQUFZLFFBQTZCLDZCQUE2QjtBQUUzUSxPQUFPQyx1QkFBdUIsTUFBTSxnRUFBZ0U7QUFDcEcsT0FBT0Msc0JBQXNCLE1BQU0sK0RBQStEO0FBQ2xHLE9BQU9DLFNBQVMsTUFBTSw4QkFBOEI7QUFDcEQsT0FBT0MsTUFBTSxNQUFNLDJCQUEyQjtBQUM5QyxPQUFPQyxNQUFNLE1BQU0saUNBQWlDO0FBQ3BELE9BQU9DLGNBQWMsTUFBTSxxQkFBcUI7QUFDaEQsT0FBT0MsZUFBZSxNQUFNLHNCQUFzQjtB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