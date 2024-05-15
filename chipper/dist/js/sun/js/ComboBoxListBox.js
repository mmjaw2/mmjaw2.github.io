// Copyright 2019-2024, University of Colorado Boulder

/**
 * The popup list box for a ComboBox.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import PhetioAction from '../../tandem/js/PhetioAction.js';
import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
import { KeyboardListener, KeyboardUtils, SceneryEvent, VBox } from '../../scenery/js/imports.js';
import multiSelectionSoundPlayerFactory from '../../tambo/js/multiSelectionSoundPlayerFactory.js';
import generalCloseSoundPlayer from '../../tambo/js/shared-sound-players/generalCloseSoundPlayer.js';
import generalOpenSoundPlayer from '../../tambo/js/shared-sound-players/generalOpenSoundPlayer.js';
import EventType from '../../tandem/js/EventType.js';
import Tandem from '../../tandem/js/Tandem.js';
import ComboBoxListItemNode from './ComboBoxListItemNode.js';
import Panel from './Panel.js';
import sun from './sun.js';
import DerivedProperty from '../../axon/js/DerivedProperty.js';
import ComboBox from './ComboBox.js';
export default class ComboBoxListBox extends Panel {
  // The container for list items which will be provided to the panel.

  // We need a separate node to voice through because when a selection occurs, the list box is hidden, silencing any
  // voicing responses occurring through Nodes within this class. This selection node should be visible when a combo
  // box selection occurs, see https://github.com/phetsims/ratio-and-proportion/issues/474

  // The selected list item node from the list box at the start of the fire action.  This is needed for sound generation
  // because the managed Property isn't always updated when the list box is closed.

  /**
   * @param property
   * @param items
   * @param nodes
   * @param hideListBoxCallback - called to hide the list box
   * @param focusButtonCallback - called to transfer focus to the combo box's button
   * @param voiceOnSelectionNode - Node to voice the response when selecting a combo box item.
   * @param tandem
   * @param providedOptions
   */
  constructor(property, items, nodes, a11yNamePropertyMap, hideListBoxCallback, focusButtonCallback, voiceOnSelectionNode, tandem, providedOptions) {
    assert && assert(items.length > 0, 'empty list box is not supported');
    const options = optionize()({
      highlightFill: 'rgb( 245, 245, 245 )',
      comboBoxListItemNodeOptions: {},
      // Panel options
      xMargin: 12,
      yMargin: 8,
      backgroundPickable: true,
      // pdom
      tagName: 'ul',
      ariaRole: 'listbox',
      groupFocusHighlight: true,
      openedSoundPlayer: generalOpenSoundPlayer,
      closedNoChangeSoundPlayer: generalCloseSoundPlayer,
      visiblePropertyOptions: {
        phetioReadOnly: true
      }

      // Not instrumented for PhET-iO because the list's position isn't valid until it has been popped up.
      // See https://github.com/phetsims/phet-io/issues/1102
    }, providedOptions);
    assert && assert(options.xMargin > 0 && options.yMargin > 0, `margins must be > 0, xMargin=${options.xMargin}, yMargin=${options.yMargin}`);

    //TODO sun#462 replace fireEmitter and selectionListener with a standard scenery listener
    // Pops down the list box and sets the property.value to match the chosen item.
    const fireAction = new PhetioAction(event => {
      const listItemNode = event.currentTarget;
      assert && assert(listItemNode instanceof ComboBoxListItemNode, 'expected a ComboBoxListItemNode'); // eslint-disable-line no-simple-type-checking-assertions

      // Update the internal state to reflect the selected Node, but don't update the Property value yet because the
      // focus needs to be shifted first.
      this.selectionOnFireAction = listItemNode;
      const oldValue = property.value;

      // So that something related to the ComboBox has focus before changing Property value.
      // See https://github.com/phetsims/sun/issues/721
      focusButtonCallback();

      // It is now safe to set the value based on which item was chosen in the list box.
      property.value = this.selectionOnFireAction.item.value;

      // hide the list
      hideListBoxCallback();
      this.voiceOnNewSelection(property.value, oldValue, listItemNode);

      // prevent nodes (eg, controls) behind the list from receiving the event
      event.abort();
    }, {
      parameters: [{
        phetioPrivate: true,
        valueType: SceneryEvent
      }],
      // phet-io
      tandem: tandem.createTandem('fireAction'),
      phetioEventType: EventType.USER
    });

    //TODO sun#462 replace fireEmitter and selectionListener with a standard scenery listener
    // Handles selection from the list box.
    const selectionListener = {
      up(event) {
        fireAction.execute(event);
      },
      // Handle keyup on each item in the list box, for a11y.
      keyup: event => {
        if (event.domEvent && KeyboardUtils.isAnyKeyEvent(event.domEvent, [KeyboardUtils.KEY_ENTER, KeyboardUtils.KEY_SPACE])) {
          fireAction.execute(event);
        }
      },
      // handle activation from an assistive device that may not use a keyboard (such as mobile VoiceOver)
      click: event => {
        fireAction.execute(event);
      }
    };

    // Compute max item size
    const maxItemWidthProperty = ComboBox.getMaxItemWidthProperty(nodes);
    const maxItemHeightProperty = ComboBox.getMaxItemHeightProperty(nodes);

    // Uniform dimensions for all highlighted items in the list, highlight overlaps margin by 50%
    const highlightWidthProperty = new DerivedProperty([maxItemWidthProperty], width => width + options.xMargin);
    const highlightHeightProperty = new DerivedProperty([maxItemHeightProperty], width => width + options.yMargin);

    // Create a node for each item in the list, and attach a listener.
    const listItemNodes = [];
    items.forEach((item, index) => {
      const a11yNameProperty = a11yNamePropertyMap.get(item.value);
      assert && assert(a11yNameProperty);

      // Create the list item node
      const listItemNode = new ComboBoxListItemNode(item, nodes[index], a11yNameProperty, highlightWidthProperty, highlightHeightProperty, combineOptions({
        align: options.align,
        highlightFill: options.highlightFill,
        highlightCornerRadius: options.cornerRadius,
        // highlight overlaps half of margins
        xMargin: 0.5 * options.xMargin,
        tandem: item.tandemName ? tandem.createTandem(item.tandemName) : Tandem.OPTIONAL
      }, options.comboBoxListItemNodeOptions, item.comboBoxListItemNodeOptions));
      listItemNodes.push(listItemNode);
      listItemNode.addInputListener(selectionListener);
    });
    const content = new VBox({
      spacing: 0,
      excludeInvisibleChildrenFromBounds: true,
      children: listItemNodes
    });
    super(content, combineOptions({}, options, {
      // Adjust margins to account for highlight overlap
      xMargin: options.xMargin / 2,
      yMargin: options.yMargin / 2
    }));
    this.content = content;
    this.voiceOnSelectionNode = voiceOnSelectionNode;
    this.selectionOnFireAction = this.getListItemNode(property.value);

    // Create a set of default sound generators, one for each item, to use if the item doesn't provide its own.
    const defaultItemSelectedSoundPlayers = items.map(item => multiSelectionSoundPlayerFactory.getSelectionSoundPlayer(items.indexOf(item)));

    // variable for tracking whether the selected value was changed by the user
    let selectionWhenListBoxOpened;

    // sound generation
    this.visibleProperty.lazyLink(visible => {
      if (visible) {
        // Play the 'opened' sound when the list box becomes visible.
        options.openedSoundPlayer.play();

        // Keep track of what was selected when the list box was presented.
        selectionWhenListBoxOpened = this.getListItemNode(property.value);
      } else {
        // Verify that the list box became visible before going invisible and the selected value was saved at that time.
        assert && assert(selectionWhenListBoxOpened, 'no Node for when list box was opened');

        // Did the user change the selection in the list box?
        if (selectionWhenListBoxOpened === this.selectionOnFireAction) {
          // No change.  Play the sound that indicates this.
          options.closedNoChangeSoundPlayer.play();
        } else {
          // Play a sound for the selected item.
          const selectedItem = this.selectionOnFireAction.item;
          if (selectedItem.soundPlayer) {
            selectedItem.soundPlayer.play();
          } else {
            // The selected item didn't provide a sound player, so use a default based on its position within the list
            // of visible selections.  With multitouch, it's possible that the selected item may become invisible before
            // we attempt to play its sound, so play only if it's still visible.
            // See https://github.com/phetsims/fourier-making-waves/issues/244
            const selectionIndex = this.getVisibleListItemNodes().indexOf(this.selectionOnFireAction);
            if (selectionIndex !== -1) {
              defaultItemSelectedSoundPlayers[selectionIndex].play();
            }
          }
        }
      }
    });

    // pdom - listener that navigates listbox items and closes the box from keyboard input
    const keyboardListener = new KeyboardListener({
      keys: ['escape', 'tab', 'shift+tab', 'arrowUp', 'arrowDown', 'home', 'end'],
      fire: (event, keysPressed) => {
        const sceneryEvent = event;
        assert && assert(sceneryEvent, 'event is required for this listener');

        // Only visible item nodes can receive focus - using content children directly because PhET-iO may change their
        // order.
        const visibleItemNodes = this.getVisibleListItemNodes();
        if (keysPressed === 'escape' || keysPressed === 'tab' || keysPressed === 'shift+tab') {
          // Escape and Tab hide the list box and return focus to the button
          hideListBoxCallback();
          focusButtonCallback();
        } else if (keysPressed === 'arrowUp' || keysPressed === 'arrowDown') {
          const domEvent = event;
          assert && assert(domEvent, 'domEvent is required for this listener');

          // prevent "native" behavior so that Safari doesn't make an error sound with arrow keys in
          // full screen mode, see #210
          domEvent.preventDefault();

          // Up/down arrow keys move the focus between items in the list box
          const direction = keysPressed === 'arrowDown' ? 1 : -1;
          const focusedItemIndex = visibleItemNodes.indexOf(this.getFocusedItemNode());
          assert && assert(focusedItemIndex > -1, 'how could we receive keydown without a focused list item?');
          const nextIndex = focusedItemIndex + direction;
          visibleItemNodes[nextIndex] && visibleItemNodes[nextIndex].focus();
        } else if (keysPressed === 'home') {
          visibleItemNodes[0].focus();
        } else if (keysPressed === 'end') {
          visibleItemNodes[visibleItemNodes.length - 1].focus();
        }
      }
    });
    this.addInputListener(keyboardListener);
    this.disposeComboBoxListBox = () => {
      for (let i = 0; i < listItemNodes.length; i++) {
        listItemNodes[i].dispose(); // to unregister tandem
      }
      this.removeInputListener(keyboardListener);
      keyboardListener.dispose();

      // Private to ComboBoxListBox, but we need to clean up tandem.
      fireAction.dispose();
      maxItemWidthProperty.dispose();
      maxItemHeightProperty.dispose();
    };
  }
  dispose() {
    this.disposeComboBoxListBox();
    super.dispose();
  }

  /**
   * Sets the visibility of one or more items in the listbox that correspond to a value. Assumes that each item
   * in the listbox has a unique value.
   * @param value - the value associated with the ComboBoxItem
   * @param visible
   */
  setItemVisible(value, visible) {
    this.getListItemNode(value).visible = visible;
  }

  /**
   * Is the item that corresponds to a value visible when the listbox is popped up?
   * @param value - the value associated with the ComboBoxItem
   */
  isItemVisible(value) {
    return this.getListItemNode(value).visible;
  }

  /**
   * Returns all list item Nodes, as children of the list box content in the correct order which may have changed
   * from PhET-iO.
   */
  getAllListItemNodes() {
    return this.content.children;
  }

  /**
   * Returns an array containing all the visible list item Nodes in top-to-bottom order.
   */
  getVisibleListItemNodes() {
    return this.getAllListItemNodes().filter(child => child.visible);
  }

  /**
   * Gets the ComboBoxListItemNode that corresponds to a specified value. Assumes that values are unique.
   */
  getListItemNode(value) {
    const listItemNode = _.find(this.getAllListItemNodes(), listItemNode => listItemNode.item.value === value);
    assert && assert(listItemNode, `no item found for value: ${value}`);
    assert && assert(listItemNode instanceof ComboBoxListItemNode, 'invalid listItemNode'); // eslint-disable-line no-simple-type-checking-assertions
    return listItemNode;
  }

  /**
   * Gets the item in the ComboBox that currently has focus.
   */
  getFocusedItemNode() {
    const listItemNode = _.find(this.getAllListItemNodes(), listItemNode => listItemNode.focused);
    assert && assert(listItemNode, 'no item found that has focus');
    assert && assert(listItemNode instanceof ComboBoxListItemNode, 'invalid listItemNode'); // eslint-disable-line no-simple-type-checking-assertions
    return listItemNode;
  }

  /**
   * Focuses the ComboBoxListItemNode that corresponds to a specified value. If the item for that value is not
   * visible, focus is placed on the first visible item.
   */
  focusListItemNode(value) {
    let listItemNode = this.getListItemNode(value);

    // If the item Node is not visible, just place focus on the first available item.
    if (!listItemNode.visible) {
      listItemNode = _.find(this.getAllListItemNodes(), listItemNode => listItemNode.visible);
    }
    if (listItemNode) {
      listItemNode.supplyOpenResponseOnNextFocus();
      listItemNode.focus();
    }
  }

  /**
   * voice the response from selecting a new item Node. The response will differ depending on if the selection
   * changed the Property.
   */
  voiceOnNewSelection(newValue, oldValue, listItemNode) {
    const responseOptions = {
      nameResponse: listItemNode.voicingNameResponse,
      objectResponse: null,
      contextResponse: listItemNode.voicingContextResponse,
      hintResponse: null
    };
    if (oldValue === newValue) {
      // If there is no change in value, then there is no context response
      responseOptions.contextResponse = null;
    }

    // Voice through this node since the listItemNode is about to be hidden (setting it to voicingVisible:false). See https://github.com/phetsims/ratio-and-proportion/issues/474
    this.voiceOnSelectionNode.voicingSpeakResponse(responseOptions);
  }
}
sun.register('ComboBoxListBox', ComboBoxListBox);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQaGV0aW9BY3Rpb24iLCJvcHRpb25pemUiLCJjb21iaW5lT3B0aW9ucyIsIktleWJvYXJkTGlzdGVuZXIiLCJLZXlib2FyZFV0aWxzIiwiU2NlbmVyeUV2ZW50IiwiVkJveCIsIm11bHRpU2VsZWN0aW9uU291bmRQbGF5ZXJGYWN0b3J5IiwiZ2VuZXJhbENsb3NlU291bmRQbGF5ZXIiLCJnZW5lcmFsT3BlblNvdW5kUGxheWVyIiwiRXZlbnRUeXBlIiwiVGFuZGVtIiwiQ29tYm9Cb3hMaXN0SXRlbU5vZGUiLCJQYW5lbCIsInN1biIsIkRlcml2ZWRQcm9wZXJ0eSIsIkNvbWJvQm94IiwiQ29tYm9Cb3hMaXN0Qm94IiwiY29uc3RydWN0b3IiLCJwcm9wZXJ0eSIsIml0ZW1zIiwibm9kZXMiLCJhMTF5TmFtZVByb3BlcnR5TWFwIiwiaGlkZUxpc3RCb3hDYWxsYmFjayIsImZvY3VzQnV0dG9uQ2FsbGJhY2siLCJ2b2ljZU9uU2VsZWN0aW9uTm9kZSIsInRhbmRlbSIsInByb3ZpZGVkT3B0aW9ucyIsImFzc2VydCIsImxlbmd0aCIsIm9wdGlvbnMiLCJoaWdobGlnaHRGaWxsIiwiY29tYm9Cb3hMaXN0SXRlbU5vZGVPcHRpb25zIiwieE1hcmdpbiIsInlNYXJnaW4iLCJiYWNrZ3JvdW5kUGlja2FibGUiLCJ0YWdOYW1lIiwiYXJpYVJvbGUiLCJncm91cEZvY3VzSGlnaGxpZ2h0Iiwib3BlbmVkU291bmRQbGF5ZXIiLCJjbG9zZWROb0NoYW5nZVNvdW5kUGxheWVyIiwidmlzaWJsZVByb3BlcnR5T3B0aW9ucyIsInBoZXRpb1JlYWRPbmx5IiwiZmlyZUFjdGlvbiIsImV2ZW50IiwibGlzdEl0ZW1Ob2RlIiwiY3VycmVudFRhcmdldCIsInNlbGVjdGlvbk9uRmlyZUFjdGlvbiIsIm9sZFZhbHVlIiwidmFsdWUiLCJpdGVtIiwidm9pY2VPbk5ld1NlbGVjdGlvbiIsImFib3J0IiwicGFyYW1ldGVycyIsInBoZXRpb1ByaXZhdGUiLCJ2YWx1ZVR5cGUiLCJjcmVhdGVUYW5kZW0iLCJwaGV0aW9FdmVudFR5cGUiLCJVU0VSIiwic2VsZWN0aW9uTGlzdGVuZXIiLCJ1cCIsImV4ZWN1dGUiLCJrZXl1cCIsImRvbUV2ZW50IiwiaXNBbnlLZXlFdmVudCIsIktFWV9FTlRFUiIsIktFWV9TUEFDRSIsImNsaWNrIiwibWF4SXRlbVdpZHRoUHJvcGVydHkiLCJnZXRNYXhJdGVtV2lkdGhQcm9wZXJ0eSIsIm1heEl0ZW1IZWlnaHRQcm9wZXJ0eSIsImdldE1heEl0ZW1IZWlnaHRQcm9wZXJ0eSIsImhpZ2hsaWdodFdpZHRoUHJvcGVydHkiLCJ3aWR0aCIsImhpZ2hsaWdodEhlaWdodFByb3BlcnR5IiwibGlzdEl0ZW1Ob2RlcyIsImZvckVhY2giLCJpbmRleCIsImExMXlOYW1lUHJvcGVydHkiLCJnZXQiLCJhbGlnbiIsImhpZ2hsaWdodENvcm5lclJhZGl1cyIsImNvcm5lclJhZGl1cyIsInRhbmRlbU5hbWUiLCJPUFRJT05BTCIsInB1c2giLCJhZGRJbnB1dExpc3RlbmVyIiwiY29udGVudCIsInNwYWNpbmciLCJleGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzIiwiY2hpbGRyZW4iLCJnZXRMaXN0SXRlbU5vZGUiLCJkZWZhdWx0SXRlbVNlbGVjdGVkU291bmRQbGF5ZXJzIiwibWFwIiwiZ2V0U2VsZWN0aW9uU291bmRQbGF5ZXIiLCJpbmRleE9mIiwic2VsZWN0aW9uV2hlbkxpc3RCb3hPcGVuZWQiLCJ2aXNpYmxlUHJvcGVydHkiLCJsYXp5TGluayIsInZpc2libGUiLCJwbGF5Iiwic2VsZWN0ZWRJdGVtIiwic291bmRQbGF5ZXIiLCJzZWxlY3Rpb25JbmRleCIsImdldFZpc2libGVMaXN0SXRlbU5vZGVzIiwia2V5Ym9hcmRMaXN0ZW5lciIsImtleXMiLCJmaXJlIiwia2V5c1ByZXNzZWQiLCJzY2VuZXJ5RXZlbnQiLCJ2aXNpYmxlSXRlbU5vZGVzIiwicHJldmVudERlZmF1bHQiLCJkaXJlY3Rpb24iLCJmb2N1c2VkSXRlbUluZGV4IiwiZ2V0Rm9jdXNlZEl0ZW1Ob2RlIiwibmV4dEluZGV4IiwiZm9jdXMiLCJkaXNwb3NlQ29tYm9Cb3hMaXN0Qm94IiwiaSIsImRpc3Bvc2UiLCJyZW1vdmVJbnB1dExpc3RlbmVyIiwic2V0SXRlbVZpc2libGUiLCJpc0l0ZW1WaXNpYmxlIiwiZ2V0QWxsTGlzdEl0ZW1Ob2RlcyIsImZpbHRlciIsImNoaWxkIiwiXyIsImZpbmQiLCJmb2N1c2VkIiwiZm9jdXNMaXN0SXRlbU5vZGUiLCJzdXBwbHlPcGVuUmVzcG9uc2VPbk5leHRGb2N1cyIsIm5ld1ZhbHVlIiwicmVzcG9uc2VPcHRpb25zIiwibmFtZVJlc3BvbnNlIiwidm9pY2luZ05hbWVSZXNwb25zZSIsIm9iamVjdFJlc3BvbnNlIiwiY29udGV4dFJlc3BvbnNlIiwidm9pY2luZ0NvbnRleHRSZXNwb25zZSIsImhpbnRSZXNwb25zZSIsInZvaWNpbmdTcGVha1Jlc3BvbnNlIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJDb21ib0JveExpc3RCb3gudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVGhlIHBvcHVwIGxpc3QgYm94IGZvciBhIENvbWJvQm94LlxyXG4gKlxyXG4gKiBAYXV0aG9yIENocmlzIE1hbGxleSAoUGl4ZWxab29tLCBJbmMuKVxyXG4gKi9cclxuXHJcbmltcG9ydCBQaGV0aW9BY3Rpb24gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL1BoZXRpb0FjdGlvbi5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUsIHsgY29tYmluZU9wdGlvbnMgfSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IHsgS2V5Ym9hcmRMaXN0ZW5lciwgS2V5Ym9hcmRVdGlscywgTm9kZSwgU2NlbmVyeUV2ZW50LCBTcGVha2luZ09wdGlvbnMsIFRJbnB1dExpc3RlbmVyLCBUUGFpbnQsIFZCb3gsIFZvaWNpbmdOb2RlIH0gZnJvbSAnLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IG11bHRpU2VsZWN0aW9uU291bmRQbGF5ZXJGYWN0b3J5IGZyb20gJy4uLy4uL3RhbWJvL2pzL211bHRpU2VsZWN0aW9uU291bmRQbGF5ZXJGYWN0b3J5LmpzJztcclxuaW1wb3J0IGdlbmVyYWxDbG9zZVNvdW5kUGxheWVyIGZyb20gJy4uLy4uL3RhbWJvL2pzL3NoYXJlZC1zb3VuZC1wbGF5ZXJzL2dlbmVyYWxDbG9zZVNvdW5kUGxheWVyLmpzJztcclxuaW1wb3J0IGdlbmVyYWxPcGVuU291bmRQbGF5ZXIgZnJvbSAnLi4vLi4vdGFtYm8vanMvc2hhcmVkLXNvdW5kLXBsYXllcnMvZ2VuZXJhbE9wZW5Tb3VuZFBsYXllci5qcyc7XHJcbmltcG9ydCBFdmVudFR5cGUgZnJvbSAnLi4vLi4vdGFuZGVtL2pzL0V2ZW50VHlwZS5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcbmltcG9ydCBDb21ib0JveExpc3RJdGVtTm9kZSwgeyBDb21ib0JveExpc3RJdGVtTm9kZU9wdGlvbnMgfSBmcm9tICcuL0NvbWJvQm94TGlzdEl0ZW1Ob2RlLmpzJztcclxuaW1wb3J0IFBhbmVsLCB7IFBhbmVsT3B0aW9ucyB9IGZyb20gJy4vUGFuZWwuanMnO1xyXG5pbXBvcnQgc3VuIGZyb20gJy4vc3VuLmpzJztcclxuaW1wb3J0IFRTb3VuZFBsYXllciBmcm9tICcuLi8uLi90YW1iby9qcy9UU291bmRQbGF5ZXIuanMnO1xyXG5pbXBvcnQgRGVyaXZlZFByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvRGVyaXZlZFByb3BlcnR5LmpzJztcclxuaW1wb3J0IFRQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1RQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBDb21ib0JveCwgeyBDb21ib0JveEExMXlOYW1lUHJvcGVydHlNYXAsIENvbWJvQm94SXRlbU5vTm9kZSB9IGZyb20gJy4vQ29tYm9Cb3guanMnO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuXHJcbiAgLy8gZmlsbCBmb3IgdGhlIGhpZ2hsaWdodCBiZWhpbmQgaXRlbXMgaW4gdGhlIGxpc3RcclxuICBoaWdobGlnaHRGaWxsPzogVFBhaW50O1xyXG5cclxuICAvLyBPcHRpb25zIHRoYXQgYXBwbHkgdG8gZXZlcnkgQ29tYm9Cb3hJdGVtTm9kZSBjcmVhdGVkIGluIHRoZSBsaXN0XHJcbiAgY29tYm9Cb3hMaXN0SXRlbU5vZGVPcHRpb25zPzogQ29tYm9Cb3hMaXN0SXRlbU5vZGVPcHRpb25zO1xyXG5cclxuICAvLyBTb3VuZCBnZW5lcmF0b3JzIGZvciB3aGVuIGNvbWJvIGJveCBpcyBvcGVuZWQgYW5kIHdoZW4gaXQgaXMgY2xvc2VkIHdpdGggbm8gY2hhbmdlLiBDbG9zaW5nICp3aXRoKlxyXG4gIC8vIGEgY2hhbmdlIGlzIGNvdmVyZWQgYnkgaW5kaXZpZHVhbCBjb21ibyBib3ggaXRlbXMuXHJcbiAgb3BlbmVkU291bmRQbGF5ZXI/OiBUU291bmRQbGF5ZXI7XHJcbiAgY2xvc2VkTm9DaGFuZ2VTb3VuZFBsYXllcj86IFRTb3VuZFBsYXllcjtcclxufTtcclxuXHJcbmV4cG9ydCB0eXBlIENvbWJvQm94TGlzdEJveE9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIFBhbmVsT3B0aW9ucztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbWJvQm94TGlzdEJveDxUPiBleHRlbmRzIFBhbmVsIHtcclxuXHJcbiAgLy8gVGhlIGNvbnRhaW5lciBmb3IgbGlzdCBpdGVtcyB3aGljaCB3aWxsIGJlIHByb3ZpZGVkIHRvIHRoZSBwYW5lbC5cclxuICBwcml2YXRlIHJlYWRvbmx5IGNvbnRlbnQ6IE5vZGU7XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzcG9zZUNvbWJvQm94TGlzdEJveDogKCkgPT4gdm9pZDtcclxuXHJcbiAgLy8gV2UgbmVlZCBhIHNlcGFyYXRlIG5vZGUgdG8gdm9pY2UgdGhyb3VnaCBiZWNhdXNlIHdoZW4gYSBzZWxlY3Rpb24gb2NjdXJzLCB0aGUgbGlzdCBib3ggaXMgaGlkZGVuLCBzaWxlbmNpbmcgYW55XHJcbiAgLy8gdm9pY2luZyByZXNwb25zZXMgb2NjdXJyaW5nIHRocm91Z2ggTm9kZXMgd2l0aGluIHRoaXMgY2xhc3MuIFRoaXMgc2VsZWN0aW9uIG5vZGUgc2hvdWxkIGJlIHZpc2libGUgd2hlbiBhIGNvbWJvXHJcbiAgLy8gYm94IHNlbGVjdGlvbiBvY2N1cnMsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcmF0aW8tYW5kLXByb3BvcnRpb24vaXNzdWVzLzQ3NFxyXG4gIHByaXZhdGUgcmVhZG9ubHkgdm9pY2VPblNlbGVjdGlvbk5vZGU6IFZvaWNpbmdOb2RlO1xyXG5cclxuICAvLyBUaGUgc2VsZWN0ZWQgbGlzdCBpdGVtIG5vZGUgZnJvbSB0aGUgbGlzdCBib3ggYXQgdGhlIHN0YXJ0IG9mIHRoZSBmaXJlIGFjdGlvbi4gIFRoaXMgaXMgbmVlZGVkIGZvciBzb3VuZCBnZW5lcmF0aW9uXHJcbiAgLy8gYmVjYXVzZSB0aGUgbWFuYWdlZCBQcm9wZXJ0eSBpc24ndCBhbHdheXMgdXBkYXRlZCB3aGVuIHRoZSBsaXN0IGJveCBpcyBjbG9zZWQuXHJcbiAgcHJpdmF0ZSBzZWxlY3Rpb25PbkZpcmVBY3Rpb246IENvbWJvQm94TGlzdEl0ZW1Ob2RlPFQ+O1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gcHJvcGVydHlcclxuICAgKiBAcGFyYW0gaXRlbXNcclxuICAgKiBAcGFyYW0gbm9kZXNcclxuICAgKiBAcGFyYW0gaGlkZUxpc3RCb3hDYWxsYmFjayAtIGNhbGxlZCB0byBoaWRlIHRoZSBsaXN0IGJveFxyXG4gICAqIEBwYXJhbSBmb2N1c0J1dHRvbkNhbGxiYWNrIC0gY2FsbGVkIHRvIHRyYW5zZmVyIGZvY3VzIHRvIHRoZSBjb21ibyBib3gncyBidXR0b25cclxuICAgKiBAcGFyYW0gdm9pY2VPblNlbGVjdGlvbk5vZGUgLSBOb2RlIHRvIHZvaWNlIHRoZSByZXNwb25zZSB3aGVuIHNlbGVjdGluZyBhIGNvbWJvIGJveCBpdGVtLlxyXG4gICAqIEBwYXJhbSB0YW5kZW1cclxuICAgKiBAcGFyYW0gcHJvdmlkZWRPcHRpb25zXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJvcGVydHk6IFRQcm9wZXJ0eTxUPixcclxuICAgIGl0ZW1zOiBDb21ib0JveEl0ZW1Ob05vZGU8VD5bXSxcclxuICAgIG5vZGVzOiBOb2RlW10sXHJcbiAgICBhMTF5TmFtZVByb3BlcnR5TWFwOiBDb21ib0JveEExMXlOYW1lUHJvcGVydHlNYXA8VD4sXHJcbiAgICBoaWRlTGlzdEJveENhbGxiYWNrOiAoKSA9PiB2b2lkLFxyXG4gICAgZm9jdXNCdXR0b25DYWxsYmFjazogKCkgPT4gdm9pZCxcclxuICAgIHZvaWNlT25TZWxlY3Rpb25Ob2RlOiBWb2ljaW5nTm9kZSxcclxuICAgIHRhbmRlbTogVGFuZGVtLFxyXG4gICAgcHJvdmlkZWRPcHRpb25zPzogQ29tYm9Cb3hMaXN0Qm94T3B0aW9uc1xyXG4gICkge1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGl0ZW1zLmxlbmd0aCA+IDAsICdlbXB0eSBsaXN0IGJveCBpcyBub3Qgc3VwcG9ydGVkJyApO1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8Q29tYm9Cb3hMaXN0Qm94T3B0aW9ucywgU2VsZk9wdGlvbnMsIFBhbmVsT3B0aW9ucz4oKSgge1xyXG4gICAgICBoaWdobGlnaHRGaWxsOiAncmdiKCAyNDUsIDI0NSwgMjQ1ICknLFxyXG4gICAgICBjb21ib0JveExpc3RJdGVtTm9kZU9wdGlvbnM6IHt9LFxyXG5cclxuICAgICAgLy8gUGFuZWwgb3B0aW9uc1xyXG4gICAgICB4TWFyZ2luOiAxMixcclxuICAgICAgeU1hcmdpbjogOCxcclxuICAgICAgYmFja2dyb3VuZFBpY2thYmxlOiB0cnVlLFxyXG5cclxuICAgICAgLy8gcGRvbVxyXG4gICAgICB0YWdOYW1lOiAndWwnLFxyXG4gICAgICBhcmlhUm9sZTogJ2xpc3Rib3gnLFxyXG4gICAgICBncm91cEZvY3VzSGlnaGxpZ2h0OiB0cnVlLFxyXG5cclxuICAgICAgb3BlbmVkU291bmRQbGF5ZXI6IGdlbmVyYWxPcGVuU291bmRQbGF5ZXIsXHJcbiAgICAgIGNsb3NlZE5vQ2hhbmdlU291bmRQbGF5ZXI6IGdlbmVyYWxDbG9zZVNvdW5kUGxheWVyLFxyXG4gICAgICB2aXNpYmxlUHJvcGVydHlPcHRpb25zOiB7IHBoZXRpb1JlYWRPbmx5OiB0cnVlIH1cclxuXHJcbiAgICAgIC8vIE5vdCBpbnN0cnVtZW50ZWQgZm9yIFBoRVQtaU8gYmVjYXVzZSB0aGUgbGlzdCdzIHBvc2l0aW9uIGlzbid0IHZhbGlkIHVudGlsIGl0IGhhcyBiZWVuIHBvcHBlZCB1cC5cclxuICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvL2lzc3Vlcy8xMTAyXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLnhNYXJnaW4gPiAwICYmIG9wdGlvbnMueU1hcmdpbiA+IDAsXHJcbiAgICAgIGBtYXJnaW5zIG11c3QgYmUgPiAwLCB4TWFyZ2luPSR7b3B0aW9ucy54TWFyZ2lufSwgeU1hcmdpbj0ke29wdGlvbnMueU1hcmdpbn1gICk7XHJcblxyXG4gICAgLy9UT0RPIHN1biM0NjIgcmVwbGFjZSBmaXJlRW1pdHRlciBhbmQgc2VsZWN0aW9uTGlzdGVuZXIgd2l0aCBhIHN0YW5kYXJkIHNjZW5lcnkgbGlzdGVuZXJcclxuICAgIC8vIFBvcHMgZG93biB0aGUgbGlzdCBib3ggYW5kIHNldHMgdGhlIHByb3BlcnR5LnZhbHVlIHRvIG1hdGNoIHRoZSBjaG9zZW4gaXRlbS5cclxuICAgIGNvbnN0IGZpcmVBY3Rpb24gPSBuZXcgUGhldGlvQWN0aW9uKCBldmVudCA9PiB7XHJcblxyXG4gICAgICBjb25zdCBsaXN0SXRlbU5vZGUgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBsaXN0SXRlbU5vZGUgaW5zdGFuY2VvZiBDb21ib0JveExpc3RJdGVtTm9kZSwgJ2V4cGVjdGVkIGEgQ29tYm9Cb3hMaXN0SXRlbU5vZGUnICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2ltcGxlLXR5cGUtY2hlY2tpbmctYXNzZXJ0aW9uc1xyXG5cclxuICAgICAgLy8gVXBkYXRlIHRoZSBpbnRlcm5hbCBzdGF0ZSB0byByZWZsZWN0IHRoZSBzZWxlY3RlZCBOb2RlLCBidXQgZG9uJ3QgdXBkYXRlIHRoZSBQcm9wZXJ0eSB2YWx1ZSB5ZXQgYmVjYXVzZSB0aGVcclxuICAgICAgLy8gZm9jdXMgbmVlZHMgdG8gYmUgc2hpZnRlZCBmaXJzdC5cclxuICAgICAgdGhpcy5zZWxlY3Rpb25PbkZpcmVBY3Rpb24gPSBsaXN0SXRlbU5vZGU7XHJcblxyXG4gICAgICBjb25zdCBvbGRWYWx1ZSA9IHByb3BlcnR5LnZhbHVlO1xyXG5cclxuICAgICAgLy8gU28gdGhhdCBzb21ldGhpbmcgcmVsYXRlZCB0byB0aGUgQ29tYm9Cb3ggaGFzIGZvY3VzIGJlZm9yZSBjaGFuZ2luZyBQcm9wZXJ0eSB2YWx1ZS5cclxuICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zdW4vaXNzdWVzLzcyMVxyXG4gICAgICBmb2N1c0J1dHRvbkNhbGxiYWNrKCk7XHJcblxyXG4gICAgICAvLyBJdCBpcyBub3cgc2FmZSB0byBzZXQgdGhlIHZhbHVlIGJhc2VkIG9uIHdoaWNoIGl0ZW0gd2FzIGNob3NlbiBpbiB0aGUgbGlzdCBib3guXHJcbiAgICAgIHByb3BlcnR5LnZhbHVlID0gdGhpcy5zZWxlY3Rpb25PbkZpcmVBY3Rpb24uaXRlbS52YWx1ZTtcclxuXHJcbiAgICAgIC8vIGhpZGUgdGhlIGxpc3RcclxuICAgICAgaGlkZUxpc3RCb3hDYWxsYmFjaygpO1xyXG5cclxuICAgICAgdGhpcy52b2ljZU9uTmV3U2VsZWN0aW9uKCBwcm9wZXJ0eS52YWx1ZSwgb2xkVmFsdWUsIGxpc3RJdGVtTm9kZSApO1xyXG5cclxuICAgICAgLy8gcHJldmVudCBub2RlcyAoZWcsIGNvbnRyb2xzKSBiZWhpbmQgdGhlIGxpc3QgZnJvbSByZWNlaXZpbmcgdGhlIGV2ZW50XHJcbiAgICAgIGV2ZW50LmFib3J0KCk7XHJcbiAgICB9LCB7XHJcbiAgICAgIHBhcmFtZXRlcnM6IFsgeyBwaGV0aW9Qcml2YXRlOiB0cnVlLCB2YWx1ZVR5cGU6IFNjZW5lcnlFdmVudCB9IF0sXHJcblxyXG4gICAgICAvLyBwaGV0LWlvXHJcbiAgICAgIHRhbmRlbTogdGFuZGVtLmNyZWF0ZVRhbmRlbSggJ2ZpcmVBY3Rpb24nICksXHJcbiAgICAgIHBoZXRpb0V2ZW50VHlwZTogRXZlbnRUeXBlLlVTRVJcclxuICAgIH0gKTtcclxuXHJcbiAgICAvL1RPRE8gc3VuIzQ2MiByZXBsYWNlIGZpcmVFbWl0dGVyIGFuZCBzZWxlY3Rpb25MaXN0ZW5lciB3aXRoIGEgc3RhbmRhcmQgc2NlbmVyeSBsaXN0ZW5lclxyXG4gICAgLy8gSGFuZGxlcyBzZWxlY3Rpb24gZnJvbSB0aGUgbGlzdCBib3guXHJcbiAgICBjb25zdCBzZWxlY3Rpb25MaXN0ZW5lcjogVElucHV0TGlzdGVuZXIgPSB7XHJcblxyXG4gICAgICB1cCggZXZlbnQgKSB7XHJcbiAgICAgICAgZmlyZUFjdGlvbi5leGVjdXRlKCBldmVudCApO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gSGFuZGxlIGtleXVwIG9uIGVhY2ggaXRlbSBpbiB0aGUgbGlzdCBib3gsIGZvciBhMTF5LlxyXG4gICAgICBrZXl1cDogZXZlbnQgPT4ge1xyXG4gICAgICAgIGlmICggZXZlbnQuZG9tRXZlbnQgJiYgS2V5Ym9hcmRVdGlscy5pc0FueUtleUV2ZW50KCBldmVudC5kb21FdmVudCwgWyBLZXlib2FyZFV0aWxzLktFWV9FTlRFUiwgS2V5Ym9hcmRVdGlscy5LRVlfU1BBQ0UgXSApICkge1xyXG4gICAgICAgICAgZmlyZUFjdGlvbi5leGVjdXRlKCBldmVudCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIGhhbmRsZSBhY3RpdmF0aW9uIGZyb20gYW4gYXNzaXN0aXZlIGRldmljZSB0aGF0IG1heSBub3QgdXNlIGEga2V5Ym9hcmQgKHN1Y2ggYXMgbW9iaWxlIFZvaWNlT3ZlcilcclxuICAgICAgY2xpY2s6IGV2ZW50ID0+IHtcclxuICAgICAgICBmaXJlQWN0aW9uLmV4ZWN1dGUoIGV2ZW50ICk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLy8gQ29tcHV0ZSBtYXggaXRlbSBzaXplXHJcbiAgICBjb25zdCBtYXhJdGVtV2lkdGhQcm9wZXJ0eSA9IENvbWJvQm94LmdldE1heEl0ZW1XaWR0aFByb3BlcnR5KCBub2RlcyApO1xyXG4gICAgY29uc3QgbWF4SXRlbUhlaWdodFByb3BlcnR5ID0gQ29tYm9Cb3guZ2V0TWF4SXRlbUhlaWdodFByb3BlcnR5KCBub2RlcyApO1xyXG5cclxuICAgIC8vIFVuaWZvcm0gZGltZW5zaW9ucyBmb3IgYWxsIGhpZ2hsaWdodGVkIGl0ZW1zIGluIHRoZSBsaXN0LCBoaWdobGlnaHQgb3ZlcmxhcHMgbWFyZ2luIGJ5IDUwJVxyXG4gICAgY29uc3QgaGlnaGxpZ2h0V2lkdGhQcm9wZXJ0eSA9IG5ldyBEZXJpdmVkUHJvcGVydHkoIFsgbWF4SXRlbVdpZHRoUHJvcGVydHkgXSwgd2lkdGggPT4gd2lkdGggKyBvcHRpb25zLnhNYXJnaW4gKTtcclxuICAgIGNvbnN0IGhpZ2hsaWdodEhlaWdodFByb3BlcnR5ID0gbmV3IERlcml2ZWRQcm9wZXJ0eSggWyBtYXhJdGVtSGVpZ2h0UHJvcGVydHkgXSwgd2lkdGggPT4gd2lkdGggKyBvcHRpb25zLnlNYXJnaW4gKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgYSBub2RlIGZvciBlYWNoIGl0ZW0gaW4gdGhlIGxpc3QsIGFuZCBhdHRhY2ggYSBsaXN0ZW5lci5cclxuICAgIGNvbnN0IGxpc3RJdGVtTm9kZXM6IENvbWJvQm94TGlzdEl0ZW1Ob2RlPFQ+W10gPSBbXTtcclxuICAgIGl0ZW1zLmZvckVhY2goICggaXRlbSwgaW5kZXggKSA9PiB7XHJcblxyXG4gICAgICBjb25zdCBhMTF5TmFtZVByb3BlcnR5ID0gYTExeU5hbWVQcm9wZXJ0eU1hcC5nZXQoIGl0ZW0udmFsdWUgKSE7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGExMXlOYW1lUHJvcGVydHkgKTtcclxuXHJcbiAgICAgIC8vIENyZWF0ZSB0aGUgbGlzdCBpdGVtIG5vZGVcclxuICAgICAgY29uc3QgbGlzdEl0ZW1Ob2RlID0gbmV3IENvbWJvQm94TGlzdEl0ZW1Ob2RlKCBpdGVtLCBub2Rlc1sgaW5kZXggXSwgYTExeU5hbWVQcm9wZXJ0eSwgaGlnaGxpZ2h0V2lkdGhQcm9wZXJ0eSwgaGlnaGxpZ2h0SGVpZ2h0UHJvcGVydHksXHJcbiAgICAgICAgY29tYmluZU9wdGlvbnM8Q29tYm9Cb3hMaXN0SXRlbU5vZGVPcHRpb25zPigge1xyXG4gICAgICAgICAgYWxpZ246IG9wdGlvbnMuYWxpZ24sXHJcbiAgICAgICAgICBoaWdobGlnaHRGaWxsOiBvcHRpb25zLmhpZ2hsaWdodEZpbGwsXHJcbiAgICAgICAgICBoaWdobGlnaHRDb3JuZXJSYWRpdXM6IG9wdGlvbnMuY29ybmVyUmFkaXVzLFxyXG5cclxuICAgICAgICAgIC8vIGhpZ2hsaWdodCBvdmVybGFwcyBoYWxmIG9mIG1hcmdpbnNcclxuICAgICAgICAgIHhNYXJnaW46IDAuNSAqIG9wdGlvbnMueE1hcmdpbixcclxuXHJcbiAgICAgICAgICB0YW5kZW06IGl0ZW0udGFuZGVtTmFtZSA/IHRhbmRlbS5jcmVhdGVUYW5kZW0oIGl0ZW0udGFuZGVtTmFtZSApIDogVGFuZGVtLk9QVElPTkFMXHJcbiAgICAgICAgfSwgb3B0aW9ucy5jb21ib0JveExpc3RJdGVtTm9kZU9wdGlvbnMsIGl0ZW0uY29tYm9Cb3hMaXN0SXRlbU5vZGVPcHRpb25zICkgKTtcclxuICAgICAgbGlzdEl0ZW1Ob2Rlcy5wdXNoKCBsaXN0SXRlbU5vZGUgKTtcclxuXHJcbiAgICAgIGxpc3RJdGVtTm9kZS5hZGRJbnB1dExpc3RlbmVyKCBzZWxlY3Rpb25MaXN0ZW5lciApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IGNvbnRlbnQgPSBuZXcgVkJveCgge1xyXG4gICAgICBzcGFjaW5nOiAwLFxyXG4gICAgICBleGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzOiB0cnVlLFxyXG4gICAgICBjaGlsZHJlbjogbGlzdEl0ZW1Ob2Rlc1xyXG4gICAgfSApO1xyXG5cclxuICAgIHN1cGVyKCBjb250ZW50LCBjb21iaW5lT3B0aW9uczxQYW5lbE9wdGlvbnM+KCB7fSwgb3B0aW9ucywge1xyXG4gICAgICAvLyBBZGp1c3QgbWFyZ2lucyB0byBhY2NvdW50IGZvciBoaWdobGlnaHQgb3ZlcmxhcFxyXG4gICAgICB4TWFyZ2luOiBvcHRpb25zLnhNYXJnaW4gLyAyLFxyXG4gICAgICB5TWFyZ2luOiBvcHRpb25zLnlNYXJnaW4gLyAyXHJcbiAgICB9ICkgKTtcclxuXHJcbiAgICB0aGlzLmNvbnRlbnQgPSBjb250ZW50O1xyXG5cclxuICAgIHRoaXMudm9pY2VPblNlbGVjdGlvbk5vZGUgPSB2b2ljZU9uU2VsZWN0aW9uTm9kZTtcclxuXHJcbiAgICB0aGlzLnNlbGVjdGlvbk9uRmlyZUFjdGlvbiA9IHRoaXMuZ2V0TGlzdEl0ZW1Ob2RlKCBwcm9wZXJ0eS52YWx1ZSApO1xyXG5cclxuICAgIC8vIENyZWF0ZSBhIHNldCBvZiBkZWZhdWx0IHNvdW5kIGdlbmVyYXRvcnMsIG9uZSBmb3IgZWFjaCBpdGVtLCB0byB1c2UgaWYgdGhlIGl0ZW0gZG9lc24ndCBwcm92aWRlIGl0cyBvd24uXHJcbiAgICBjb25zdCBkZWZhdWx0SXRlbVNlbGVjdGVkU291bmRQbGF5ZXJzID0gaXRlbXMubWFwKCBpdGVtID0+XHJcbiAgICAgIG11bHRpU2VsZWN0aW9uU291bmRQbGF5ZXJGYWN0b3J5LmdldFNlbGVjdGlvblNvdW5kUGxheWVyKCBpdGVtcy5pbmRleE9mKCBpdGVtICkgKVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyB2YXJpYWJsZSBmb3IgdHJhY2tpbmcgd2hldGhlciB0aGUgc2VsZWN0ZWQgdmFsdWUgd2FzIGNoYW5nZWQgYnkgdGhlIHVzZXJcclxuICAgIGxldCBzZWxlY3Rpb25XaGVuTGlzdEJveE9wZW5lZDogQ29tYm9Cb3hMaXN0SXRlbU5vZGU8VD47XHJcblxyXG4gICAgLy8gc291bmQgZ2VuZXJhdGlvblxyXG4gICAgdGhpcy52aXNpYmxlUHJvcGVydHkubGF6eUxpbmsoIHZpc2libGUgPT4ge1xyXG5cclxuICAgICAgaWYgKCB2aXNpYmxlICkge1xyXG5cclxuICAgICAgICAvLyBQbGF5IHRoZSAnb3BlbmVkJyBzb3VuZCB3aGVuIHRoZSBsaXN0IGJveCBiZWNvbWVzIHZpc2libGUuXHJcbiAgICAgICAgb3B0aW9ucy5vcGVuZWRTb3VuZFBsYXllci5wbGF5KCk7XHJcblxyXG4gICAgICAgIC8vIEtlZXAgdHJhY2sgb2Ygd2hhdCB3YXMgc2VsZWN0ZWQgd2hlbiB0aGUgbGlzdCBib3ggd2FzIHByZXNlbnRlZC5cclxuICAgICAgICBzZWxlY3Rpb25XaGVuTGlzdEJveE9wZW5lZCA9IHRoaXMuZ2V0TGlzdEl0ZW1Ob2RlKCBwcm9wZXJ0eS52YWx1ZSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICAvLyBWZXJpZnkgdGhhdCB0aGUgbGlzdCBib3ggYmVjYW1lIHZpc2libGUgYmVmb3JlIGdvaW5nIGludmlzaWJsZSBhbmQgdGhlIHNlbGVjdGVkIHZhbHVlIHdhcyBzYXZlZCBhdCB0aGF0IHRpbWUuXHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggc2VsZWN0aW9uV2hlbkxpc3RCb3hPcGVuZWQsICdubyBOb2RlIGZvciB3aGVuIGxpc3QgYm94IHdhcyBvcGVuZWQnICk7XHJcblxyXG4gICAgICAgIC8vIERpZCB0aGUgdXNlciBjaGFuZ2UgdGhlIHNlbGVjdGlvbiBpbiB0aGUgbGlzdCBib3g/XHJcbiAgICAgICAgaWYgKCBzZWxlY3Rpb25XaGVuTGlzdEJveE9wZW5lZCA9PT0gdGhpcy5zZWxlY3Rpb25PbkZpcmVBY3Rpb24gKSB7XHJcblxyXG4gICAgICAgICAgLy8gTm8gY2hhbmdlLiAgUGxheSB0aGUgc291bmQgdGhhdCBpbmRpY2F0ZXMgdGhpcy5cclxuICAgICAgICAgIG9wdGlvbnMuY2xvc2VkTm9DaGFuZ2VTb3VuZFBsYXllci5wbGF5KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICAgIC8vIFBsYXkgYSBzb3VuZCBmb3IgdGhlIHNlbGVjdGVkIGl0ZW0uXHJcbiAgICAgICAgICBjb25zdCBzZWxlY3RlZEl0ZW0gPSB0aGlzLnNlbGVjdGlvbk9uRmlyZUFjdGlvbi5pdGVtO1xyXG4gICAgICAgICAgaWYgKCBzZWxlY3RlZEl0ZW0uc291bmRQbGF5ZXIgKSB7XHJcbiAgICAgICAgICAgIHNlbGVjdGVkSXRlbS5zb3VuZFBsYXllci5wbGF5KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFRoZSBzZWxlY3RlZCBpdGVtIGRpZG4ndCBwcm92aWRlIGEgc291bmQgcGxheWVyLCBzbyB1c2UgYSBkZWZhdWx0IGJhc2VkIG9uIGl0cyBwb3NpdGlvbiB3aXRoaW4gdGhlIGxpc3RcclxuICAgICAgICAgICAgLy8gb2YgdmlzaWJsZSBzZWxlY3Rpb25zLiAgV2l0aCBtdWx0aXRvdWNoLCBpdCdzIHBvc3NpYmxlIHRoYXQgdGhlIHNlbGVjdGVkIGl0ZW0gbWF5IGJlY29tZSBpbnZpc2libGUgYmVmb3JlXHJcbiAgICAgICAgICAgIC8vIHdlIGF0dGVtcHQgdG8gcGxheSBpdHMgc291bmQsIHNvIHBsYXkgb25seSBpZiBpdCdzIHN0aWxsIHZpc2libGUuXHJcbiAgICAgICAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZm91cmllci1tYWtpbmctd2F2ZXMvaXNzdWVzLzI0NFxyXG4gICAgICAgICAgICBjb25zdCBzZWxlY3Rpb25JbmRleCA9IHRoaXMuZ2V0VmlzaWJsZUxpc3RJdGVtTm9kZXMoKS5pbmRleE9mKCB0aGlzLnNlbGVjdGlvbk9uRmlyZUFjdGlvbiApO1xyXG4gICAgICAgICAgICBpZiAoIHNlbGVjdGlvbkluZGV4ICE9PSAtMSApIHtcclxuICAgICAgICAgICAgICBkZWZhdWx0SXRlbVNlbGVjdGVkU291bmRQbGF5ZXJzWyBzZWxlY3Rpb25JbmRleCBdLnBsYXkoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIHBkb20gLSBsaXN0ZW5lciB0aGF0IG5hdmlnYXRlcyBsaXN0Ym94IGl0ZW1zIGFuZCBjbG9zZXMgdGhlIGJveCBmcm9tIGtleWJvYXJkIGlucHV0XHJcbiAgICBjb25zdCBrZXlib2FyZExpc3RlbmVyID0gbmV3IEtleWJvYXJkTGlzdGVuZXIoIHtcclxuICAgICAga2V5czogWyAnZXNjYXBlJywgJ3RhYicsICdzaGlmdCt0YWInLCAnYXJyb3dVcCcsICdhcnJvd0Rvd24nLCAnaG9tZScsICdlbmQnIF0sXHJcbiAgICAgIGZpcmU6ICggZXZlbnQsIGtleXNQcmVzc2VkICkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHNjZW5lcnlFdmVudCA9IGV2ZW50ITtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBzY2VuZXJ5RXZlbnQsICdldmVudCBpcyByZXF1aXJlZCBmb3IgdGhpcyBsaXN0ZW5lcicgKTtcclxuXHJcbiAgICAgICAgLy8gT25seSB2aXNpYmxlIGl0ZW0gbm9kZXMgY2FuIHJlY2VpdmUgZm9jdXMgLSB1c2luZyBjb250ZW50IGNoaWxkcmVuIGRpcmVjdGx5IGJlY2F1c2UgUGhFVC1pTyBtYXkgY2hhbmdlIHRoZWlyXHJcbiAgICAgICAgLy8gb3JkZXIuXHJcbiAgICAgICAgY29uc3QgdmlzaWJsZUl0ZW1Ob2RlcyA9IHRoaXMuZ2V0VmlzaWJsZUxpc3RJdGVtTm9kZXMoKTtcclxuXHJcbiAgICAgICAgaWYgKCBrZXlzUHJlc3NlZCA9PT0gJ2VzY2FwZScgfHwga2V5c1ByZXNzZWQgPT09ICd0YWInIHx8IGtleXNQcmVzc2VkID09PSAnc2hpZnQrdGFiJyApIHtcclxuXHJcbiAgICAgICAgICAvLyBFc2NhcGUgYW5kIFRhYiBoaWRlIHRoZSBsaXN0IGJveCBhbmQgcmV0dXJuIGZvY3VzIHRvIHRoZSBidXR0b25cclxuICAgICAgICAgIGhpZGVMaXN0Qm94Q2FsbGJhY2soKTtcclxuICAgICAgICAgIGZvY3VzQnV0dG9uQ2FsbGJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIGtleXNQcmVzc2VkID09PSAnYXJyb3dVcCcgfHwga2V5c1ByZXNzZWQgPT09ICdhcnJvd0Rvd24nICkge1xyXG4gICAgICAgICAgY29uc3QgZG9tRXZlbnQgPSBldmVudCE7XHJcbiAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBkb21FdmVudCwgJ2RvbUV2ZW50IGlzIHJlcXVpcmVkIGZvciB0aGlzIGxpc3RlbmVyJyApO1xyXG5cclxuICAgICAgICAgIC8vIHByZXZlbnQgXCJuYXRpdmVcIiBiZWhhdmlvciBzbyB0aGF0IFNhZmFyaSBkb2Vzbid0IG1ha2UgYW4gZXJyb3Igc291bmQgd2l0aCBhcnJvdyBrZXlzIGluXHJcbiAgICAgICAgICAvLyBmdWxsIHNjcmVlbiBtb2RlLCBzZWUgIzIxMFxyXG4gICAgICAgICAgZG9tRXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgICAvLyBVcC9kb3duIGFycm93IGtleXMgbW92ZSB0aGUgZm9jdXMgYmV0d2VlbiBpdGVtcyBpbiB0aGUgbGlzdCBib3hcclxuICAgICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IGtleXNQcmVzc2VkID09PSAnYXJyb3dEb3duJyA/IDEgOiAtMTtcclxuICAgICAgICAgIGNvbnN0IGZvY3VzZWRJdGVtSW5kZXggPSB2aXNpYmxlSXRlbU5vZGVzLmluZGV4T2YoIHRoaXMuZ2V0Rm9jdXNlZEl0ZW1Ob2RlKCkgKTtcclxuICAgICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGZvY3VzZWRJdGVtSW5kZXggPiAtMSwgJ2hvdyBjb3VsZCB3ZSByZWNlaXZlIGtleWRvd24gd2l0aG91dCBhIGZvY3VzZWQgbGlzdCBpdGVtPycgKTtcclxuXHJcbiAgICAgICAgICBjb25zdCBuZXh0SW5kZXggPSBmb2N1c2VkSXRlbUluZGV4ICsgZGlyZWN0aW9uO1xyXG4gICAgICAgICAgdmlzaWJsZUl0ZW1Ob2Rlc1sgbmV4dEluZGV4IF0gJiYgdmlzaWJsZUl0ZW1Ob2Rlc1sgbmV4dEluZGV4IF0uZm9jdXMoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIGtleXNQcmVzc2VkID09PSAnaG9tZScgKSB7XHJcbiAgICAgICAgICB2aXNpYmxlSXRlbU5vZGVzWyAwIF0uZm9jdXMoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIGtleXNQcmVzc2VkID09PSAnZW5kJyApIHtcclxuICAgICAgICAgIHZpc2libGVJdGVtTm9kZXNbIHZpc2libGVJdGVtTm9kZXMubGVuZ3RoIC0gMSBdLmZvY3VzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLmFkZElucHV0TGlzdGVuZXIoIGtleWJvYXJkTGlzdGVuZXIgKTtcclxuXHJcbiAgICB0aGlzLmRpc3Bvc2VDb21ib0JveExpc3RCb3ggPSAoKSA9PiB7XHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGxpc3RJdGVtTm9kZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgbGlzdEl0ZW1Ob2Rlc1sgaSBdLmRpc3Bvc2UoKTsgLy8gdG8gdW5yZWdpc3RlciB0YW5kZW1cclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5yZW1vdmVJbnB1dExpc3RlbmVyKCBrZXlib2FyZExpc3RlbmVyICk7XHJcbiAgICAgIGtleWJvYXJkTGlzdGVuZXIuZGlzcG9zZSgpO1xyXG5cclxuICAgICAgLy8gUHJpdmF0ZSB0byBDb21ib0JveExpc3RCb3gsIGJ1dCB3ZSBuZWVkIHRvIGNsZWFuIHVwIHRhbmRlbS5cclxuICAgICAgZmlyZUFjdGlvbi5kaXNwb3NlKCk7XHJcblxyXG4gICAgICBtYXhJdGVtV2lkdGhQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICAgIG1heEl0ZW1IZWlnaHRQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmRpc3Bvc2VDb21ib0JveExpc3RCb3goKTtcclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHZpc2liaWxpdHkgb2Ygb25lIG9yIG1vcmUgaXRlbXMgaW4gdGhlIGxpc3Rib3ggdGhhdCBjb3JyZXNwb25kIHRvIGEgdmFsdWUuIEFzc3VtZXMgdGhhdCBlYWNoIGl0ZW1cclxuICAgKiBpbiB0aGUgbGlzdGJveCBoYXMgYSB1bmlxdWUgdmFsdWUuXHJcbiAgICogQHBhcmFtIHZhbHVlIC0gdGhlIHZhbHVlIGFzc29jaWF0ZWQgd2l0aCB0aGUgQ29tYm9Cb3hJdGVtXHJcbiAgICogQHBhcmFtIHZpc2libGVcclxuICAgKi9cclxuICBwdWJsaWMgc2V0SXRlbVZpc2libGUoIHZhbHVlOiBULCB2aXNpYmxlOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgdGhpcy5nZXRMaXN0SXRlbU5vZGUoIHZhbHVlICkudmlzaWJsZSA9IHZpc2libGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJcyB0aGUgaXRlbSB0aGF0IGNvcnJlc3BvbmRzIHRvIGEgdmFsdWUgdmlzaWJsZSB3aGVuIHRoZSBsaXN0Ym94IGlzIHBvcHBlZCB1cD9cclxuICAgKiBAcGFyYW0gdmFsdWUgLSB0aGUgdmFsdWUgYXNzb2NpYXRlZCB3aXRoIHRoZSBDb21ib0JveEl0ZW1cclxuICAgKi9cclxuICBwdWJsaWMgaXNJdGVtVmlzaWJsZSggdmFsdWU6IFQgKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMaXN0SXRlbU5vZGUoIHZhbHVlICkudmlzaWJsZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYWxsIGxpc3QgaXRlbSBOb2RlcywgYXMgY2hpbGRyZW4gb2YgdGhlIGxpc3QgYm94IGNvbnRlbnQgaW4gdGhlIGNvcnJlY3Qgb3JkZXIgd2hpY2ggbWF5IGhhdmUgY2hhbmdlZFxyXG4gICAqIGZyb20gUGhFVC1pTy5cclxuICAgKi9cclxuICBwcml2YXRlIGdldEFsbExpc3RJdGVtTm9kZXMoKTogQ29tYm9Cb3hMaXN0SXRlbU5vZGU8VD5bXSB7XHJcbiAgICByZXR1cm4gdGhpcy5jb250ZW50LmNoaWxkcmVuIGFzIENvbWJvQm94TGlzdEl0ZW1Ob2RlPFQ+W107XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGFycmF5IGNvbnRhaW5pbmcgYWxsIHRoZSB2aXNpYmxlIGxpc3QgaXRlbSBOb2RlcyBpbiB0b3AtdG8tYm90dG9tIG9yZGVyLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2V0VmlzaWJsZUxpc3RJdGVtTm9kZXMoKTogQ29tYm9Cb3hMaXN0SXRlbU5vZGU8VD5bXSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRBbGxMaXN0SXRlbU5vZGVzKCkuZmlsdGVyKCBjaGlsZCA9PiBjaGlsZC52aXNpYmxlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBDb21ib0JveExpc3RJdGVtTm9kZSB0aGF0IGNvcnJlc3BvbmRzIHRvIGEgc3BlY2lmaWVkIHZhbHVlLiBBc3N1bWVzIHRoYXQgdmFsdWVzIGFyZSB1bmlxdWUuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRMaXN0SXRlbU5vZGUoIHZhbHVlOiBUICk6IENvbWJvQm94TGlzdEl0ZW1Ob2RlPFQ+IHtcclxuICAgIGNvbnN0IGxpc3RJdGVtTm9kZSA9IF8uZmluZCggdGhpcy5nZXRBbGxMaXN0SXRlbU5vZGVzKCksICggbGlzdEl0ZW1Ob2RlOiBDb21ib0JveExpc3RJdGVtTm9kZTxUPiApID0+IGxpc3RJdGVtTm9kZS5pdGVtLnZhbHVlID09PSB2YWx1ZSApITtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGxpc3RJdGVtTm9kZSwgYG5vIGl0ZW0gZm91bmQgZm9yIHZhbHVlOiAke3ZhbHVlfWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGxpc3RJdGVtTm9kZSBpbnN0YW5jZW9mIENvbWJvQm94TGlzdEl0ZW1Ob2RlLCAnaW52YWxpZCBsaXN0SXRlbU5vZGUnICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2ltcGxlLXR5cGUtY2hlY2tpbmctYXNzZXJ0aW9uc1xyXG4gICAgcmV0dXJuIGxpc3RJdGVtTm9kZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIGl0ZW0gaW4gdGhlIENvbWJvQm94IHRoYXQgY3VycmVudGx5IGhhcyBmb2N1cy5cclxuICAgKi9cclxuICBwcml2YXRlIGdldEZvY3VzZWRJdGVtTm9kZSgpOiBDb21ib0JveExpc3RJdGVtTm9kZTxUPiB7XHJcbiAgICBjb25zdCBsaXN0SXRlbU5vZGUgPSBfLmZpbmQoIHRoaXMuZ2V0QWxsTGlzdEl0ZW1Ob2RlcygpLCAoIGxpc3RJdGVtTm9kZTogQ29tYm9Cb3hMaXN0SXRlbU5vZGU8VD4gKSA9PiBsaXN0SXRlbU5vZGUuZm9jdXNlZCApITtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGxpc3RJdGVtTm9kZSwgJ25vIGl0ZW0gZm91bmQgdGhhdCBoYXMgZm9jdXMnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBsaXN0SXRlbU5vZGUgaW5zdGFuY2VvZiBDb21ib0JveExpc3RJdGVtTm9kZSwgJ2ludmFsaWQgbGlzdEl0ZW1Ob2RlJyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNpbXBsZS10eXBlLWNoZWNraW5nLWFzc2VydGlvbnNcclxuICAgIHJldHVybiBsaXN0SXRlbU5vZGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGb2N1c2VzIHRoZSBDb21ib0JveExpc3RJdGVtTm9kZSB0aGF0IGNvcnJlc3BvbmRzIHRvIGEgc3BlY2lmaWVkIHZhbHVlLiBJZiB0aGUgaXRlbSBmb3IgdGhhdCB2YWx1ZSBpcyBub3RcclxuICAgKiB2aXNpYmxlLCBmb2N1cyBpcyBwbGFjZWQgb24gdGhlIGZpcnN0IHZpc2libGUgaXRlbS5cclxuICAgKi9cclxuICBwdWJsaWMgZm9jdXNMaXN0SXRlbU5vZGUoIHZhbHVlOiBUICk6IHZvaWQge1xyXG4gICAgbGV0IGxpc3RJdGVtTm9kZTogQ29tYm9Cb3hMaXN0SXRlbU5vZGU8VD4gfCB1bmRlZmluZWQgPSB0aGlzLmdldExpc3RJdGVtTm9kZSggdmFsdWUgKTtcclxuXHJcbiAgICAvLyBJZiB0aGUgaXRlbSBOb2RlIGlzIG5vdCB2aXNpYmxlLCBqdXN0IHBsYWNlIGZvY3VzIG9uIHRoZSBmaXJzdCBhdmFpbGFibGUgaXRlbS5cclxuICAgIGlmICggIWxpc3RJdGVtTm9kZS52aXNpYmxlICkge1xyXG4gICAgICBsaXN0SXRlbU5vZGUgPSBfLmZpbmQoIHRoaXMuZ2V0QWxsTGlzdEl0ZW1Ob2RlcygpLCAoIGxpc3RJdGVtTm9kZTogQ29tYm9Cb3hMaXN0SXRlbU5vZGU8VD4gKSA9PiBsaXN0SXRlbU5vZGUudmlzaWJsZSApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggbGlzdEl0ZW1Ob2RlICkge1xyXG4gICAgICBsaXN0SXRlbU5vZGUuc3VwcGx5T3BlblJlc3BvbnNlT25OZXh0Rm9jdXMoKTtcclxuICAgICAgbGlzdEl0ZW1Ob2RlLmZvY3VzKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiB2b2ljZSB0aGUgcmVzcG9uc2UgZnJvbSBzZWxlY3RpbmcgYSBuZXcgaXRlbSBOb2RlLiBUaGUgcmVzcG9uc2Ugd2lsbCBkaWZmZXIgZGVwZW5kaW5nIG9uIGlmIHRoZSBzZWxlY3Rpb25cclxuICAgKiBjaGFuZ2VkIHRoZSBQcm9wZXJ0eS5cclxuICAgKi9cclxuICBwcml2YXRlIHZvaWNlT25OZXdTZWxlY3Rpb24oIG5ld1ZhbHVlOiBULCBvbGRWYWx1ZTogVCwgbGlzdEl0ZW1Ob2RlOiBDb21ib0JveExpc3RJdGVtTm9kZTxUPiApOiB2b2lkIHtcclxuICAgIGNvbnN0IHJlc3BvbnNlT3B0aW9uczogU3BlYWtpbmdPcHRpb25zID0ge1xyXG4gICAgICBuYW1lUmVzcG9uc2U6IGxpc3RJdGVtTm9kZS52b2ljaW5nTmFtZVJlc3BvbnNlLFxyXG4gICAgICBvYmplY3RSZXNwb25zZTogbnVsbCxcclxuICAgICAgY29udGV4dFJlc3BvbnNlOiBsaXN0SXRlbU5vZGUudm9pY2luZ0NvbnRleHRSZXNwb25zZSxcclxuICAgICAgaGludFJlc3BvbnNlOiBudWxsXHJcbiAgICB9O1xyXG4gICAgaWYgKCBvbGRWYWx1ZSA9PT0gbmV3VmFsdWUgKSB7XHJcblxyXG4gICAgICAvLyBJZiB0aGVyZSBpcyBubyBjaGFuZ2UgaW4gdmFsdWUsIHRoZW4gdGhlcmUgaXMgbm8gY29udGV4dCByZXNwb25zZVxyXG4gICAgICByZXNwb25zZU9wdGlvbnMuY29udGV4dFJlc3BvbnNlID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBWb2ljZSB0aHJvdWdoIHRoaXMgbm9kZSBzaW5jZSB0aGUgbGlzdEl0ZW1Ob2RlIGlzIGFib3V0IHRvIGJlIGhpZGRlbiAoc2V0dGluZyBpdCB0byB2b2ljaW5nVmlzaWJsZTpmYWxzZSkuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcmF0aW8tYW5kLXByb3BvcnRpb24vaXNzdWVzLzQ3NFxyXG4gICAgdGhpcy52b2ljZU9uU2VsZWN0aW9uTm9kZS52b2ljaW5nU3BlYWtSZXNwb25zZSggcmVzcG9uc2VPcHRpb25zICk7XHJcbiAgfVxyXG59XHJcblxyXG5zdW4ucmVnaXN0ZXIoICdDb21ib0JveExpc3RCb3gnLCBD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