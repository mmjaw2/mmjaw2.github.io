// Copyright 2024, University of Colorado Boulder

/**
 * This doc assumes you have read the doc in GroupSortInteractionModel. Read that first as it explains the "group sort
 * interaction" more generally.
 *
 * The view of the "Group Sort Interaction." This type handles adding the controller for selecting, grabbing, and sorting
 * in the interaction for (keyboard). It also handles the individual and group focus highlights.
 *
 * This class can be used per scene, but the model is best used per screen.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Marla Schulz (PhET Interactive Simulations)
 */

import { animatedPanZoomSingleton, HighlightFromNode, HighlightPath, KeyboardListener } from '../../../../../scenery/js/imports.js';
import sceneryPhet from '../../../sceneryPhet.js';
import Multilink from '../../../../../axon/js/Multilink.js';
import Emitter from '../../../../../axon/js/Emitter.js';
import { Shape } from '../../../../../kite/js/imports.js';
import optionize, { combineOptions } from '../../../../../phet-core/js/optionize.js';
import SortCueArrowNode from './SortCueArrowNode.js';
import Disposable from '../../../../../axon/js/Disposable.js';
import GrabReleaseCueNode from '../../nodes/GrabReleaseCueNode.js';
// A list of all keys that are listened to, except those covered by the numberKeyMapper
const sortingKeys = ['d', 'arrowRight', 'a', 'arrowLeft', 'arrowUp', 'arrowDown', 'w', 's',
// default-step sort
'shift+d', 'shift+arrowRight', 'shift+a', 'shift+arrowLeft', 'shift+arrowUp', 'shift+arrowDown', 'shift+w', 'shift+s',
// shift-step sort
'pageUp', 'pageDown',
// page-step sort
'home', 'end' // min/max
];
export default class GroupSortInteractionView extends Disposable {
  // Update group highlight dynamically by setting the `shape` of this path.

  // The cue node for grab/release.

  // Emitted when the sorting cue should be repositioned. Most likely because the selection has changed.
  positionSortCueNodeEmitter = new Emitter();
  constructor(model, primaryFocusedNode, providedOptions) {
    const options = optionize()({
      numberKeyMapper: null,
      onSort: _.noop,
      onGrab: _.noop,
      onRelease: _.noop,
      sortStep: 1,
      shiftSortStep: 2,
      pageSortStep: Math.ceil(providedOptions.sortingRangeProperty.value.getLength() / 5),
      getHighlightNodeFromModelItem: providedOptions.getNodeFromModelItem,
      sortingRangeListener: newRange => {
        const selectedGroupItem = model.selectedGroupItemProperty.value;
        if (selectedGroupItem) {
          const currentValue = model.getGroupItemValue(selectedGroupItem);
          if (currentValue && !newRange.contains(currentValue)) {
            model.selectedGroupItemProperty.value = providedOptions.getGroupItemToSelect();
          }
        }
      },
      grabReleaseCueOptions: {}
    }, providedOptions);
    super(options);
    this.model = model;
    this.getNodeFromModelItem = options.getNodeFromModelItem;
    this.sortGroupItem = options.sortGroupItem;
    this.onSort = options.onSort;
    this.sortingRangeProperty = options.sortingRangeProperty;
    this.sortStep = options.sortStep;
    this.shiftSortStep = options.shiftSortStep;
    this.pageSortStep = options.pageSortStep;
    const selectedGroupItemProperty = this.model.selectedGroupItemProperty;
    const isKeyboardFocusedProperty = this.model.isKeyboardFocusedProperty;
    const isGroupItemKeyboardGrabbedProperty = this.model.isGroupItemKeyboardGrabbedProperty;
    const hasKeyboardGrabbedGroupItemProperty = this.model.hasKeyboardGrabbedGroupItemProperty;
    const grabbedPropertyListener = grabbed => {
      const selectedGroupItem = selectedGroupItemProperty.value;
      if (selectedGroupItem) {
        if (grabbed) {
          options.onGrab(selectedGroupItem);
        } else {
          options.onRelease(selectedGroupItem);
        }
      }
    };
    isGroupItemKeyboardGrabbedProperty.lazyLink(grabbedPropertyListener);

    // If the new range doesn't include the current selection, reset back to the default heuristic.
    options.sortingRangeProperty.lazyLink(options.sortingRangeListener);
    this.disposeEmitter.addListener(() => {
      isGroupItemKeyboardGrabbedProperty.unlink(grabbedPropertyListener);
      options.sortingRangeProperty.unlink(options.sortingRangeListener);
    });
    const focusListener = {
      focus: () => {
        // It's possible that getGroupItemToSelect's heuristic said that there is nothing to focus here
        if (selectedGroupItemProperty.value === null) {
          selectedGroupItemProperty.value = options.getGroupItemToSelect();
        }
        isKeyboardFocusedProperty.value = true;

        // When the group receives keyboard focus, make sure that the selected group item is displayed
        if (selectedGroupItemProperty.value !== null) {
          const node = options.getNodeFromModelItem(selectedGroupItemProperty.value);
          node && animatedPanZoomSingleton.listener.panToNode(node, true);
        }
      },
      blur: () => {
        isGroupItemKeyboardGrabbedProperty.value = false;
        isKeyboardFocusedProperty.value = false;
      },
      over: () => {
        // When you mouse over while focused, the highlights are hidden, and so update the state (even though we are
        // still technically keyboard focused). This will assist in showing the mouse cue, https://github.com/phetsims/center-and-variability/issues/406
        isKeyboardFocusedProperty.value = false;
      }
    };

    // When interactive highlights become active on the group, interaction with a mouse has begun while using
    // Interactive Highlighting. When that happens, clear the selection to prevent focus highlight flickering/thrashing.
    // See https://github.com/phetsims/center-and-variability/issues/557 and https://github.com/phetsims/scenery-phet/issues/815
    if (primaryFocusedNode.isInteractiveHighlighting) {
      const asHighlightingNodeAlias = primaryFocusedNode;
      const interactiveHighlightingActiveListener = active => {
        if (active) {
          if (model.selectedGroupItemProperty.value !== null) {
            // Release the selection if grabbed
            model.isGroupItemKeyboardGrabbedProperty.value = false;

            // Clear the selection so that there isn't potential for flickering in between input modalities
            model.selectedGroupItemProperty.value = null;
          }

          // This controls the visibility of interaction cues (keyboard vs mouse), so we need to clear it when
          // switching interaction modes.
          isKeyboardFocusedProperty.value = false;
        }
      };
      asHighlightingNodeAlias.isInteractiveHighlightActiveProperty.lazyLink(interactiveHighlightingActiveListener);
      this.disposeEmitter.addListener(() => {
        asHighlightingNodeAlias.isInteractiveHighlightActiveProperty.unlink(interactiveHighlightingActiveListener);
      });
    }
    const updateFocusHighlight = new Multilink([selectedGroupItemProperty, isGroupItemKeyboardGrabbedProperty], (selectedGroupItem, isGroupItemGrabbed) => {
      let focusHighlightSet = false;
      if (selectedGroupItem) {
        const node = options.getHighlightNodeFromModelItem(selectedGroupItem);
        if (node) {
          const focusForSelectedGroupItem = new HighlightFromNode(node, {
            dashed: isGroupItemGrabbed
          });

          // If available, set to the focused selection for this scene.
          primaryFocusedNode.setFocusHighlight(focusForSelectedGroupItem);
          focusHighlightSet = true;
        }
      }

      // If not set above, then actively hide it.
      !focusHighlightSet && primaryFocusedNode.setFocusHighlight('invisible');
      if (selectedGroupItem !== null) {
        this.positionSortCueNodeEmitter.emit();
      }
    });

    // "release" into selecting state when disabled
    const enabledListener = enabled => {
      if (!enabled) {
        hasKeyboardGrabbedGroupItemProperty.value = false;
      }
    };
    this.model.enabledProperty.link(enabledListener);
    this.disposeEmitter.addListener(() => {
      this.model.enabledProperty.unlink(enabledListener);
    });

    // A KeyboardListener that changes the "sorting" vs "selecting" state of the interaction.
    const grabReleaseKeyboardListener = new KeyboardListener({
      fireOnHold: true,
      keys: ['enter', 'space', 'escape'],
      fire: (event, keysPressed) => {
        if (this.model.enabled && selectedGroupItemProperty.value !== null) {
          // Do the "Grab/release" action to switch to sorting or selecting
          if (keysPressed === 'enter' || keysPressed === 'space') {
            isGroupItemKeyboardGrabbedProperty.toggle();
            hasKeyboardGrabbedGroupItemProperty.value = true;
          } else if (isGroupItemKeyboardGrabbedProperty.value && keysPressed === 'escape') {
            isGroupItemKeyboardGrabbedProperty.value = false;
          }

          // Reset to true from keyboard input, in case mouse/touch input set to false during the keyboard interaction.
          isKeyboardFocusedProperty.value = true;
        }
      }
    });
    const deltaKeyboardListener = new KeyboardListener({
      fireOnHold: true,
      keys: sortingKeys,
      fire: (event, keysPressed) => {
        if (selectedGroupItemProperty.value !== null) {
          const groupItem = selectedGroupItemProperty.value;
          const oldValue = this.model.getGroupItemValue(groupItem);
          assert && assert(oldValue !== null, 'We should have a group item when responding to input?');

          // Sorting an item
          if (isGroupItemKeyboardGrabbedProperty.value) {
            // Don't do any sorting when disabled
            // For these keys, the item will move by a particular delta
            if (this.model.enabled && sortingKeys.includes(keysPressed)) {
              const delta = this.getDeltaForKey(keysPressed);
              assert && assert(delta !== null, 'should be a supported key');
              const newValue = oldValue + delta;
              this.onSortedValue(groupItem, newValue, oldValue);
            }
          } else {
            // Selecting an item
            const unclampedDelta = this.getDeltaForKey(keysPressed);
            if (unclampedDelta !== null) {
              this.model.hasKeyboardSelectedGroupItemProperty.value = true;
              const clampedDelta = this.sortingRangeProperty.value.clampDelta(oldValue, unclampedDelta);
              selectedGroupItemProperty.value = options.getNextSelectedGroupItem(clampedDelta, groupItem);
            }
          }
          this.onGroupItemChange(groupItem);
        }
      }
    });
    if (options.numberKeyMapper) {
      const numbersKeyboardListener = new KeyboardListener({
        fireOnHold: true,
        keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        fire: (event, keysPressed) => {
          if (selectedGroupItemProperty.value !== null && isGroupItemKeyboardGrabbedProperty.value && isSingleDigit(keysPressed)) {
            const groupItem = selectedGroupItemProperty.value;
            const oldValue = this.model.getGroupItemValue(groupItem);
            assert && assert(oldValue !== null, 'We should have a group item when responding to input?');
            assert && assert(isSingleDigit(keysPressed), 'sanity check on numbers for keyboard listener');
            const mappedValue = options.numberKeyMapper(keysPressed);
            if (mappedValue) {
              this.onSortedValue(groupItem, mappedValue, oldValue);
              this.onGroupItemChange(groupItem);
            }
          }
        }
      });
      primaryFocusedNode.addInputListener(numbersKeyboardListener);
      this.disposeEmitter.addListener(() => {
        primaryFocusedNode.removeInputListener(numbersKeyboardListener);
        numbersKeyboardListener.dispose();
      });
    }
    const defaultGroupShape = primaryFocusedNode.visibleBounds.isFinite() ? Shape.bounds(primaryFocusedNode.visibleBounds) : null;

    // Set the outer group focus highlight to surround the entire area where group items are located.
    this.groupSortGroupFocusHighlightPath = new HighlightPath(defaultGroupShape, {
      outerStroke: HighlightPath.OUTER_LIGHT_GROUP_FOCUS_COLOR,
      innerStroke: HighlightPath.INNER_LIGHT_GROUP_FOCUS_COLOR,
      outerLineWidth: HighlightPath.GROUP_OUTER_LINE_WIDTH,
      innerLineWidth: HighlightPath.GROUP_INNER_LINE_WIDTH
    });
    this.grabReleaseCueNode = new GrabReleaseCueNode(combineOptions({
      visibleProperty: this.model.grabReleaseCueVisibleProperty
    }, options.grabReleaseCueOptions));
    this.groupSortGroupFocusHighlightPath.addChild(this.grabReleaseCueNode);
    primaryFocusedNode.setGroupFocusHighlight(this.groupSortGroupFocusHighlightPath);
    primaryFocusedNode.addInputListener(focusListener);
    primaryFocusedNode.addInputListener(grabReleaseKeyboardListener);
    primaryFocusedNode.addInputListener(deltaKeyboardListener);
    this.disposeEmitter.addListener(() => {
      primaryFocusedNode.setGroupFocusHighlight(false);
      primaryFocusedNode.setFocusHighlight(null);
      primaryFocusedNode.removeInputListener(deltaKeyboardListener);
      primaryFocusedNode.removeInputListener(grabReleaseKeyboardListener);
      primaryFocusedNode.removeInputListener(focusListener);
      updateFocusHighlight.dispose();
      deltaKeyboardListener.dispose();
      grabReleaseKeyboardListener.dispose;
    });
  }

  // By "change" we mean sort or selection.
  onGroupItemChange(newGroupItem) {
    // When using keyboard input, make sure that the selected group item is still displayed by panning to keep it
    // in view. `panToCenter` is false because centering the group item in the screen is too much movement.
    const node = this.getNodeFromModelItem(newGroupItem);
    node && animatedPanZoomSingleton.listener.panToNode(node, false);

    // Reset to true from keyboard input, in case mouse/touch input set to false during the keyboard interaction.
    this.model.isKeyboardFocusedProperty.value = true;
  }

  // Conduct the sorting of a value
  onSortedValue(groupItem, value, oldValue) {
    assert && assert(value !== null, 'We should have a value for the group item by the end of the listener.');
    this.sortGroupItem(groupItem, this.sortingRangeProperty.value.constrainValue(value));
    this.onSort(groupItem, oldValue);
    this.model.hasKeyboardSortedGroupItemProperty.value = true;
  }

  /**
   * Get the delta to change the value given what key was pressed. The returned delta may not result in a value in range,
   * please constrain value from range or provide your own defensive measures to this delta.
   */
  getDeltaForKey(key) {
    const fullRange = this.sortingRangeProperty.value.getLength();
    return key === 'home' ? -fullRange : key === 'end' ? fullRange : key === 'pageDown' ? -this.pageSortStep : key === 'pageUp' ? this.pageSortStep : ['arrowLeft', 'a', 'arrowDown', 's'].includes(key) ? -this.sortStep : ['arrowRight', 'd', 'arrowUp', 'w'].includes(key) ? this.sortStep : ['shift+arrowLeft', 'shift+a', 'shift+arrowDown', 'shift+s'].includes(key) ? -this.shiftSortStep : ['shift+arrowRight', 'shift+d', 'shift+arrowUp', 'shift+w'].includes(key) ? this.shiftSortStep : null;
  }
  dispose() {
    this.groupSortGroupFocusHighlightPath.dispose();
    this.grabReleaseCueNode.dispose();
    this.positionSortCueNodeEmitter.dispose();
    super.dispose();
  }

  /**
   * Use SortCueArrowNode to create a Node for the keyboard sorting cue. Can also be used as the mouse/touch cue
   * Node if desired.
   */
  static createSortCueNode(visibleProperty, scale = 1) {
    return new SortCueArrowNode({
      doubleHead: true,
      dashWidth: 3.5 * scale,
      dashHeight: 2.8 * scale,
      numberOfDashes: 3,
      spacing: 2 * scale,
      triangleNodeOptions: {
        triangleWidth: 12 * scale,
        triangleHeight: 11 * scale
      },
      visibleProperty: visibleProperty
    });
  }

  /**
   * Creator factory, similar to PhetioObject.create(). This is most useful if you don't need to keep the instance of
   * your GroupSortInteractionView.
   */
  static create(model, primaryFocusedNode, providedOptions) {
    return new GroupSortInteractionView(model, primaryFocusedNode, providedOptions);
  }
}
function isSingleDigit(key) {
  return /^\d$/.test(key);
}
sceneryPhet.register('GroupSortInteractionView', GroupSortInteractionView);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhbmltYXRlZFBhblpvb21TaW5nbGV0b24iLCJIaWdobGlnaHRGcm9tTm9kZSIsIkhpZ2hsaWdodFBhdGgiLCJLZXlib2FyZExpc3RlbmVyIiwic2NlbmVyeVBoZXQiLCJNdWx0aWxpbmsiLCJFbWl0dGVyIiwiU2hhcGUiLCJvcHRpb25pemUiLCJjb21iaW5lT3B0aW9ucyIsIlNvcnRDdWVBcnJvd05vZGUiLCJEaXNwb3NhYmxlIiwiR3JhYlJlbGVhc2VDdWVOb2RlIiwic29ydGluZ0tleXMiLCJHcm91cFNvcnRJbnRlcmFjdGlvblZpZXciLCJwb3NpdGlvblNvcnRDdWVOb2RlRW1pdHRlciIsImNvbnN0cnVjdG9yIiwibW9kZWwiLCJwcmltYXJ5Rm9jdXNlZE5vZGUiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwibnVtYmVyS2V5TWFwcGVyIiwib25Tb3J0IiwiXyIsIm5vb3AiLCJvbkdyYWIiLCJvblJlbGVhc2UiLCJzb3J0U3RlcCIsInNoaWZ0U29ydFN0ZXAiLCJwYWdlU29ydFN0ZXAiLCJNYXRoIiwiY2VpbCIsInNvcnRpbmdSYW5nZVByb3BlcnR5IiwidmFsdWUiLCJnZXRMZW5ndGgiLCJnZXRIaWdobGlnaHROb2RlRnJvbU1vZGVsSXRlbSIsImdldE5vZGVGcm9tTW9kZWxJdGVtIiwic29ydGluZ1JhbmdlTGlzdGVuZXIiLCJuZXdSYW5nZSIsInNlbGVjdGVkR3JvdXBJdGVtIiwic2VsZWN0ZWRHcm91cEl0ZW1Qcm9wZXJ0eSIsImN1cnJlbnRWYWx1ZSIsImdldEdyb3VwSXRlbVZhbHVlIiwiY29udGFpbnMiLCJnZXRHcm91cEl0ZW1Ub1NlbGVjdCIsImdyYWJSZWxlYXNlQ3VlT3B0aW9ucyIsInNvcnRHcm91cEl0ZW0iLCJpc0tleWJvYXJkRm9jdXNlZFByb3BlcnR5IiwiaXNHcm91cEl0ZW1LZXlib2FyZEdyYWJiZWRQcm9wZXJ0eSIsImhhc0tleWJvYXJkR3JhYmJlZEdyb3VwSXRlbVByb3BlcnR5IiwiZ3JhYmJlZFByb3BlcnR5TGlzdGVuZXIiLCJncmFiYmVkIiwibGF6eUxpbmsiLCJkaXNwb3NlRW1pdHRlciIsImFkZExpc3RlbmVyIiwidW5saW5rIiwiZm9jdXNMaXN0ZW5lciIsImZvY3VzIiwibm9kZSIsImxpc3RlbmVyIiwicGFuVG9Ob2RlIiwiYmx1ciIsIm92ZXIiLCJpc0ludGVyYWN0aXZlSGlnaGxpZ2h0aW5nIiwiYXNIaWdobGlnaHRpbmdOb2RlQWxpYXMiLCJpbnRlcmFjdGl2ZUhpZ2hsaWdodGluZ0FjdGl2ZUxpc3RlbmVyIiwiYWN0aXZlIiwiaXNJbnRlcmFjdGl2ZUhpZ2hsaWdodEFjdGl2ZVByb3BlcnR5IiwidXBkYXRlRm9jdXNIaWdobGlnaHQiLCJpc0dyb3VwSXRlbUdyYWJiZWQiLCJmb2N1c0hpZ2hsaWdodFNldCIsImZvY3VzRm9yU2VsZWN0ZWRHcm91cEl0ZW0iLCJkYXNoZWQiLCJzZXRGb2N1c0hpZ2hsaWdodCIsImVtaXQiLCJlbmFibGVkTGlzdGVuZXIiLCJlbmFibGVkIiwiZW5hYmxlZFByb3BlcnR5IiwibGluayIsImdyYWJSZWxlYXNlS2V5Ym9hcmRMaXN0ZW5lciIsImZpcmVPbkhvbGQiLCJrZXlzIiwiZmlyZSIsImV2ZW50Iiwia2V5c1ByZXNzZWQiLCJ0b2dnbGUiLCJkZWx0YUtleWJvYXJkTGlzdGVuZXIiLCJncm91cEl0ZW0iLCJvbGRWYWx1ZSIsImFzc2VydCIsImluY2x1ZGVzIiwiZGVsdGEiLCJnZXREZWx0YUZvcktleSIsIm5ld1ZhbHVlIiwib25Tb3J0ZWRWYWx1ZSIsInVuY2xhbXBlZERlbHRhIiwiaGFzS2V5Ym9hcmRTZWxlY3RlZEdyb3VwSXRlbVByb3BlcnR5IiwiY2xhbXBlZERlbHRhIiwiY2xhbXBEZWx0YSIsImdldE5leHRTZWxlY3RlZEdyb3VwSXRlbSIsIm9uR3JvdXBJdGVtQ2hhbmdlIiwibnVtYmVyc0tleWJvYXJkTGlzdGVuZXIiLCJpc1NpbmdsZURpZ2l0IiwibWFwcGVkVmFsdWUiLCJhZGRJbnB1dExpc3RlbmVyIiwicmVtb3ZlSW5wdXRMaXN0ZW5lciIsImRpc3Bvc2UiLCJkZWZhdWx0R3JvdXBTaGFwZSIsInZpc2libGVCb3VuZHMiLCJpc0Zpbml0ZSIsImJvdW5kcyIsImdyb3VwU29ydEdyb3VwRm9jdXNIaWdobGlnaHRQYXRoIiwib3V0ZXJTdHJva2UiLCJPVVRFUl9MSUdIVF9HUk9VUF9GT0NVU19DT0xPUiIsImlubmVyU3Ryb2tlIiwiSU5ORVJfTElHSFRfR1JPVVBfRk9DVVNfQ09MT1IiLCJvdXRlckxpbmVXaWR0aCIsIkdST1VQX09VVEVSX0xJTkVfV0lEVEgiLCJpbm5lckxpbmVXaWR0aCIsIkdST1VQX0lOTkVSX0xJTkVfV0lEVEgiLCJncmFiUmVsZWFzZUN1ZU5vZGUiLCJ2aXNpYmxlUHJvcGVydHkiLCJncmFiUmVsZWFzZUN1ZVZpc2libGVQcm9wZXJ0eSIsImFkZENoaWxkIiwic2V0R3JvdXBGb2N1c0hpZ2hsaWdodCIsIm5ld0dyb3VwSXRlbSIsImNvbnN0cmFpblZhbHVlIiwiaGFzS2V5Ym9hcmRTb3J0ZWRHcm91cEl0ZW1Qcm9wZXJ0eSIsImtleSIsImZ1bGxSYW5nZSIsImNyZWF0ZVNvcnRDdWVOb2RlIiwic2NhbGUiLCJkb3VibGVIZWFkIiwiZGFzaFdpZHRoIiwiZGFzaEhlaWdodCIsIm51bWJlck9mRGFzaGVzIiwic3BhY2luZyIsInRyaWFuZ2xlTm9kZU9wdGlvbnMiLCJ0cmlhbmdsZVdpZHRoIiwidHJpYW5nbGVIZWlnaHQiLCJjcmVhdGUiLCJ0ZXN0IiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJHcm91cFNvcnRJbnRlcmFjdGlvblZpZXcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFRoaXMgZG9jIGFzc3VtZXMgeW91IGhhdmUgcmVhZCB0aGUgZG9jIGluIEdyb3VwU29ydEludGVyYWN0aW9uTW9kZWwuIFJlYWQgdGhhdCBmaXJzdCBhcyBpdCBleHBsYWlucyB0aGUgXCJncm91cCBzb3J0XHJcbiAqIGludGVyYWN0aW9uXCIgbW9yZSBnZW5lcmFsbHkuXHJcbiAqXHJcbiAqIFRoZSB2aWV3IG9mIHRoZSBcIkdyb3VwIFNvcnQgSW50ZXJhY3Rpb24uXCIgVGhpcyB0eXBlIGhhbmRsZXMgYWRkaW5nIHRoZSBjb250cm9sbGVyIGZvciBzZWxlY3RpbmcsIGdyYWJiaW5nLCBhbmQgc29ydGluZ1xyXG4gKiBpbiB0aGUgaW50ZXJhY3Rpb24gZm9yIChrZXlib2FyZCkuIEl0IGFsc28gaGFuZGxlcyB0aGUgaW5kaXZpZHVhbCBhbmQgZ3JvdXAgZm9jdXMgaGlnaGxpZ2h0cy5cclxuICpcclxuICogVGhpcyBjbGFzcyBjYW4gYmUgdXNlZCBwZXIgc2NlbmUsIGJ1dCB0aGUgbW9kZWwgaXMgYmVzdCB1c2VkIHBlciBzY3JlZW4uXHJcbiAqXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBNYXJsYSBTY2h1bHogKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgYW5pbWF0ZWRQYW5ab29tU2luZ2xldG9uLCBIaWdobGlnaHRGcm9tTm9kZSwgSGlnaGxpZ2h0UGF0aCwgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdOb2RlLCBLZXlib2FyZExpc3RlbmVyLCBOb2RlLCBQYXRoIH0gZnJvbSAnLi4vLi4vLi4vLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IHNjZW5lcnlQaGV0IGZyb20gJy4uLy4uLy4uL3NjZW5lcnlQaGV0LmpzJztcclxuaW1wb3J0IFJhbmdlIGZyb20gJy4uLy4uLy4uLy4uLy4uL2RvdC9qcy9SYW5nZS5qcyc7XHJcbmltcG9ydCBNdWx0aWxpbmsgZnJvbSAnLi4vLi4vLi4vLi4vLi4vYXhvbi9qcy9NdWx0aWxpbmsuanMnO1xyXG5pbXBvcnQgR3JvdXBTb3J0SW50ZXJhY3Rpb25Nb2RlbCBmcm9tICcuLi9tb2RlbC9Hcm91cFNvcnRJbnRlcmFjdGlvbk1vZGVsLmpzJztcclxuaW1wb3J0IEVtaXR0ZXIgZnJvbSAnLi4vLi4vLi4vLi4vLi4vYXhvbi9qcy9FbWl0dGVyLmpzJztcclxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tICcuLi8uLi8uLi8uLi8uLi9raXRlL2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplLCB7IGNvbWJpbmVPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBUUmVhZE9ubHlQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi8uLi9heG9uL2pzL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IFNvcnRDdWVBcnJvd05vZGUgZnJvbSAnLi9Tb3J0Q3VlQXJyb3dOb2RlLmpzJztcclxuaW1wb3J0IERpc3Bvc2FibGUsIHsgRGlzcG9zYWJsZU9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi8uLi8uLi9heG9uL2pzL0Rpc3Bvc2FibGUuanMnO1xyXG5pbXBvcnQgR3JhYlJlbGVhc2VDdWVOb2RlLCB7IEdyYWJSZWxlYXNlQ3VlTm9kZU9wdGlvbnMgfSBmcm9tICcuLi8uLi9ub2Rlcy9HcmFiUmVsZWFzZUN1ZU5vZGUuanMnO1xyXG5pbXBvcnQgU3RyaWN0T21pdCBmcm9tICcuLi8uLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvU3RyaWN0T21pdC5qcyc7XHJcblxyXG50eXBlIFNlbGZPcHRpb25zPEl0ZW1Nb2RlbCwgSXRlbU5vZGUgZXh0ZW5kcyBOb2RlPiA9IHtcclxuXHJcbiAgLy8gR2l2ZW4gdGhlIGRlbHRhIChkaWZmZXJlbmNlIGZyb20gY3VycmVudCB2YWx1ZSB0byBuZXcgdmFsdWUpLCByZXR1cm4gdGhlIGNvcnJlc3BvbmRpbmcgbmV4dCBncm91cCBpdGVtIG1vZGVsIHRvIGJlIHNlbGVjdGVkLlxyXG4gIGdldE5leHRTZWxlY3RlZEdyb3VwSXRlbTogKCBkZWx0YTogbnVtYmVyLCBjdXJyZW50bHlTZWxlY3RlZEdyb3VwSXRlbTogSXRlbU1vZGVsICkgPT4gSXRlbU1vZGVsO1xyXG5cclxuICAvLyBJZiBHcm91cFNvcnRJbnRlcmFjdGlvbiBkb2Vzbid0IGtub3cgd2hhdCB0aGUgc2VsZWN0aW9uIHNob3VsZCBiZSwgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgdG8gc2V0IHRoZSBkZWZhdWx0IG9yXHJcbiAgLy8gYmVzdCBndWVzcyBzZWxlY3Rpb24uIFJldHVybiBudWxsIHRvIG5vdCBzdXBwbHkgYSBzZWxlY3Rpb24gKG5vIGZvY3VzKS5cclxuICBnZXRHcm91cEl0ZW1Ub1NlbGVjdDogKCAoKSA9PiBJdGVtTW9kZWwgfCBudWxsICk7XHJcblxyXG4gIC8vIEdpdmVuIGEgbW9kZWwgaXRlbSwgcmV0dXJuIHRoZSBjb3JyZXNwb25kaW5nIG5vZGUuIFN1cHBvcnQgJ251bGwnIGFzIGEgd2F5IHRvIHN1cHBvcnQgbXVsdGlwbGUgc2NlbmVzLiBJZiB5b3VcclxuICAvLyByZXR1cm4gbnVsbCwgaXQgbWVhbnMgdGhhdCB0aGUgcHJvdmlkZWQgaXRlbU1vZGVsIGlzIG5vdCBhc3NvY2lhdGVkIHdpdGggdGhpcyB2aWV3LCBhbmQgc2hvdWxkbid0IGJlIGhhbmRsZWQuXHJcbiAgZ2V0Tm9kZUZyb21Nb2RlbEl0ZW06ICggbW9kZWw6IEl0ZW1Nb2RlbCApID0+IEl0ZW1Ob2RlIHwgbnVsbDtcclxuXHJcbiAgLy8gR2l2ZW4gYSBtb2RlbCBpdGVtLCByZXR1cm4gdGhlIGNvcnJlc3BvbmRpbmcgZm9jdXMgaGlnaGxpZ2h0IG5vZGUuIERlZmF1bHRzIHRvIHRoZSBpbXBsZW1lbnRhdGlvbiBvZiBnZXROb2RlRnJvbU1vZGVsSXRlbS5cclxuICAvLyBSZXR1cm4gbnVsbCBpZiBubyBoaWdobGlnaHQgc2hvdWxkIGJlIHNob3duIGZvciB0aGUgc2VsZWN0aW9uIChub3QgcmVjb21tZW5kZWQpLlxyXG4gIGdldEhpZ2hsaWdodE5vZGVGcm9tTW9kZWxJdGVtPzogKCBtb2RlbDogSXRlbU1vZGVsICkgPT4gTm9kZSB8IG51bGw7XHJcblxyXG4gIC8vIFRoZSBhdmFpbGFibGUgcmFuZ2UgZm9yIHN0b3JpbmcuIFRoaXMgaXMgdGhlIGFjY2VwdGFibGUgcmFuZ2UgZm9yIHRoZSB2YWx1ZVByb3BlcnR5IG9mIEl0ZW1Nb2RlbCAoc2VlIG1vZGVsLmdldEdyb3VwSXRlbVZhbHVlKCkpLlxyXG4gIHNvcnRpbmdSYW5nZVByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxSYW5nZT47XHJcblxyXG4gIHNvcnRpbmdSYW5nZUxpc3RlbmVyPzogKCByYW5nZTogUmFuZ2UgKSA9PiB2b2lkO1xyXG5cclxuICAvLyBEbyB0aGUgc29ydCBvcGVyYXRpb24sIGFsbG93aW5nIGZvciBjdXN0b20gYWN0aW9ucywgbXVzdCBiZSBpbXBsZW1lbnRlZCBieSBhbGwgaW1wbGVtZW50YXRpb24sIGJ1dCBsaWtlbHkganVzdFxyXG4gIC8vIHNob3VsZCBkZWZhdWx0IHRvIHVwZGF0aW5nIHRoZSBcInZhbHVlUHJvcGVydHlcIiBvZiB0aGUgc2VsZWN0ZWQgZ3JvdXAgaXRlbSB0byB0aGUgbmV3IHZhbHVlIHRoYXQgaXMgcHJvdmlkZWQuXHJcbiAgc29ydEdyb3VwSXRlbTogKCBncm91cEl0ZW06IEl0ZW1Nb2RlbCwgbmV3VmFsdWU6IG51bWJlciApID0+IHZvaWQ7XHJcblxyXG4gIC8vIENhbGxiYWNrIGNhbGxlZCBhZnRlciBhIGdyb3VwIGl0ZW0gaXMgc29ydGVkLiBOb3RlIHRoYXQgc29ydGluZyBtYXkgbm90IGhhdmUgY2hhbmdlZCBpdHMgdmFsdWUgKGxpa2UgaWYgYXQgdGhlIGJvdW5kYXJ5XHJcbiAgLy8gdHJ5aW5nIHRvIG1vdmUgcGFzdCB0aGUgcmFuZ2UpLlxyXG4gIG9uU29ydD86ICggZ3JvdXBJdGVtOiBJdGVtTW9kZWwsIG9sZFZhbHVlOiBudW1iZXIgKSA9PiB2b2lkO1xyXG5cclxuICAvLyBXaGVuIHRoZSBzZWxlY3RlZCBncm91cCBpdGVtIGhhcyBiZWVuIGdyYWJiZWQgKGludG8gXCJzb3J0aW5nXCIgc3RhdGUpLlxyXG4gIG9uR3JhYj86ICggZ3JvdXBJdGVtOiBJdGVtTW9kZWwgKSA9PiB2b2lkO1xyXG5cclxuICAvLyBXaGVuIHRoZSBzZWxlY3RlZCBncm91cCBpdGVtIGlzIHJlbGVhc2VkIChiYWNrIGludG8gXCJzZWxlY3RpbmdcIiBzdGF0ZSkuXHJcbiAgb25SZWxlYXNlPzogKCBncm91cEl0ZW06IEl0ZW1Nb2RlbCApID0+IHZvaWQ7XHJcblxyXG4gIC8vIElmIHByb3ZpZGVkLCBsaXN0ZW4gdG8gdGhlIG51bWJlciBrZXlzIGFzIHdlbGwgdG8gc29ydCB0aGUgc2VsZWN0ZWQgZ3JvdXAgaXRlbS4gUHJvdmlkZSB0aGUgdmFsdWUgdGhhdCB0aGVcclxuICAvLyBudW1iZXIga2V5IG1hcHMgdG8uIEEgZGlyZWN0IHZhbHVlLCBub3QgYSBkZWx0YS4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgbnVsbCwgdGhlbiBubyBhY3Rpb24gdGFrZXMgcGxhY2UgZm9yIHRoZVxyXG4gIC8vIGlucHV0LiBJZiB0aGUgb3B0aW9uIGlzIHNldCB0byBudWxsLCB0aGVuIG51bWJlciBrZXlzIHdpbGwgbm90IGJlIGxpc3RlbmVkIHRvIGZvciB0aGlzIGludGVyYWN0aW9uLlxyXG4gIG51bWJlcktleU1hcHBlcj86ICggKCBwcmVzc2VkS2V5czogc3RyaW5nICkgPT4gKCBudW1iZXIgfCBudWxsICkgKSB8IG51bGw7XHJcblxyXG4gIC8vIFRoZSB2YWx1ZS1jaGFuZ2UgZGVsdGEgc3RlcCBzaXplIHdoZW4gc2VsZWN0aW5nL3NvcnRpbmcgdGhlIGdyb3VwIGl0ZW1zLlxyXG4gIHNvcnRTdGVwPzogbnVtYmVyOyAgIC8vIGFycm93IGtleXMgb3IgV0FTRFxyXG4gIHBhZ2VTb3J0U3RlcD86IG51bWJlcjsgLy8gcGFnZS11cC9kb3duIGtleXNcclxuICBzaGlmdFNvcnRTdGVwPzogbnVtYmVyOyAvLyBzaGlmdCthcnJvdyBrZXlzIG9yIHNoaWZ0K1dBU0RcclxuXHJcbiAgLy8gVG8gYmUgcGFzc2VkIHRvIHRoZSBncmFiL3JlbGVhc2UgY3VlIG5vZGUgKHdoaWNoIGlzIGFkZGVkIHRvIHRoZSBncm91cCBmb2N1cyBoaWdobGlnaHQpLiBUaGUgdmlzaWJsZVByb3BlcnR5IGlzXHJcbiAgLy8gYWx3YXlzIEdyb3VwU29ydEludGVyYWN0aW9uTW9kZWwuZ3JhYlJlbGVhc2VDdWVWaXNpYmxlUHJvcGVydHlcclxuICBncmFiUmVsZWFzZUN1ZU9wdGlvbnM/OiBQYXJ0aWFsPFN0cmljdE9taXQ8R3JhYlJlbGVhc2VDdWVOb2RlT3B0aW9ucywgJ3Zpc2libGVQcm9wZXJ0eSc+PjtcclxufTtcclxuXHJcbi8vIEEgbGlzdCBvZiBhbGwga2V5cyB0aGF0IGFyZSBsaXN0ZW5lZCB0bywgZXhjZXB0IHRob3NlIGNvdmVyZWQgYnkgdGhlIG51bWJlcktleU1hcHBlclxyXG5jb25zdCBzb3J0aW5nS2V5cyA9IFtcclxuICAnZCcsICdhcnJvd1JpZ2h0JywgJ2EnLCAnYXJyb3dMZWZ0JywgJ2Fycm93VXAnLCAnYXJyb3dEb3duJywgJ3cnLCAncycsIC8vIGRlZmF1bHQtc3RlcCBzb3J0XHJcbiAgJ3NoaWZ0K2QnLCAnc2hpZnQrYXJyb3dSaWdodCcsICdzaGlmdCthJywgJ3NoaWZ0K2Fycm93TGVmdCcsICdzaGlmdCthcnJvd1VwJywgJ3NoaWZ0K2Fycm93RG93bicsICdzaGlmdCt3JywgJ3NoaWZ0K3MnLCAvLyBzaGlmdC1zdGVwIHNvcnRcclxuICAncGFnZVVwJywgJ3BhZ2VEb3duJywgLy8gcGFnZS1zdGVwIHNvcnRcclxuICAnaG9tZScsICdlbmQnIC8vIG1pbi9tYXhcclxuXSBhcyBjb25zdDtcclxuXHJcbnR5cGUgUGFyZW50T3B0aW9ucyA9IERpc3Bvc2FibGVPcHRpb25zO1xyXG5leHBvcnQgdHlwZSBHcm91cFNvcnRJbnRlcmFjdGlvblZpZXdPcHRpb25zPEl0ZW1Nb2RlbCwgSXRlbU5vZGUgZXh0ZW5kcyBOb2RlPiA9IFNlbGZPcHRpb25zPEl0ZW1Nb2RlbCwgSXRlbU5vZGU+ICYgUGFyZW50T3B0aW9ucztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdyb3VwU29ydEludGVyYWN0aW9uVmlldzxJdGVtTW9kZWwsIEl0ZW1Ob2RlIGV4dGVuZHMgTm9kZT4gZXh0ZW5kcyBEaXNwb3NhYmxlIHtcclxuXHJcbiAgLy8gVXBkYXRlIGdyb3VwIGhpZ2hsaWdodCBkeW5hbWljYWxseSBieSBzZXR0aW5nIHRoZSBgc2hhcGVgIG9mIHRoaXMgcGF0aC5cclxuICBwdWJsaWMgcmVhZG9ubHkgZ3JvdXBTb3J0R3JvdXBGb2N1c0hpZ2hsaWdodFBhdGg6IFBhdGg7XHJcblxyXG4gIC8vIFRoZSBjdWUgbm9kZSBmb3IgZ3JhYi9yZWxlYXNlLlxyXG4gIHB1YmxpYyByZWFkb25seSBncmFiUmVsZWFzZUN1ZU5vZGU6IE5vZGU7XHJcblxyXG4gIC8vIEVtaXR0ZWQgd2hlbiB0aGUgc29ydGluZyBjdWUgc2hvdWxkIGJlIHJlcG9zaXRpb25lZC4gTW9zdCBsaWtlbHkgYmVjYXVzZSB0aGUgc2VsZWN0aW9uIGhhcyBjaGFuZ2VkLlxyXG4gIHB1YmxpYyByZWFkb25seSBwb3NpdGlvblNvcnRDdWVOb2RlRW1pdHRlciA9IG5ldyBFbWl0dGVyKCk7XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgZ2V0Tm9kZUZyb21Nb2RlbEl0ZW06ICggbW9kZWw6IEl0ZW1Nb2RlbCApID0+IEl0ZW1Ob2RlIHwgbnVsbDtcclxuICBwcml2YXRlIHJlYWRvbmx5IHNvcnRHcm91cEl0ZW06ICggZ3JvdXBJdGVtOiBJdGVtTW9kZWwsIG5ld1ZhbHVlOiBudW1iZXIgKSA9PiB2b2lkO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgb25Tb3J0OiAoIGdyb3VwSXRlbTogSXRlbU1vZGVsLCBvbGRWYWx1ZTogbnVtYmVyICkgPT4gdm9pZDtcclxuICBwcml2YXRlIHJlYWRvbmx5IHNvcnRpbmdSYW5nZVByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxSYW5nZT47XHJcbiAgcHJpdmF0ZSByZWFkb25seSBzb3J0U3RlcDogbnVtYmVyO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgc2hpZnRTb3J0U3RlcDogbnVtYmVyO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgcGFnZVNvcnRTdGVwOiBudW1iZXI7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuICAgIHByb3RlY3RlZCByZWFkb25seSBtb2RlbDogR3JvdXBTb3J0SW50ZXJhY3Rpb25Nb2RlbDxJdGVtTW9kZWw+LFxyXG4gICAgcHJpbWFyeUZvY3VzZWROb2RlOiBOb2RlLFxyXG4gICAgcHJvdmlkZWRPcHRpb25zOiBHcm91cFNvcnRJbnRlcmFjdGlvblZpZXdPcHRpb25zPEl0ZW1Nb2RlbCwgSXRlbU5vZGU+ICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8XHJcbiAgICAgIEdyb3VwU29ydEludGVyYWN0aW9uVmlld09wdGlvbnM8SXRlbU1vZGVsLCBJdGVtTm9kZT4sXHJcbiAgICAgIFNlbGZPcHRpb25zPEl0ZW1Nb2RlbCwgSXRlbU5vZGU+LFxyXG4gICAgICBQYXJlbnRPcHRpb25zPigpKCB7XHJcbiAgICAgIG51bWJlcktleU1hcHBlcjogbnVsbCxcclxuICAgICAgb25Tb3J0OiBfLm5vb3AsXHJcbiAgICAgIG9uR3JhYjogXy5ub29wLFxyXG4gICAgICBvblJlbGVhc2U6IF8ubm9vcCxcclxuICAgICAgc29ydFN0ZXA6IDEsXHJcbiAgICAgIHNoaWZ0U29ydFN0ZXA6IDIsXHJcbiAgICAgIHBhZ2VTb3J0U3RlcDogTWF0aC5jZWlsKCBwcm92aWRlZE9wdGlvbnMuc29ydGluZ1JhbmdlUHJvcGVydHkudmFsdWUuZ2V0TGVuZ3RoKCkgLyA1ICksXHJcbiAgICAgIGdldEhpZ2hsaWdodE5vZGVGcm9tTW9kZWxJdGVtOiBwcm92aWRlZE9wdGlvbnMuZ2V0Tm9kZUZyb21Nb2RlbEl0ZW0sXHJcbiAgICAgIHNvcnRpbmdSYW5nZUxpc3RlbmVyOiAoIG5ld1JhbmdlOiBSYW5nZSApID0+IHtcclxuICAgICAgICBjb25zdCBzZWxlY3RlZEdyb3VwSXRlbSA9IG1vZGVsLnNlbGVjdGVkR3JvdXBJdGVtUHJvcGVydHkudmFsdWU7XHJcbiAgICAgICAgaWYgKCBzZWxlY3RlZEdyb3VwSXRlbSApIHtcclxuICAgICAgICAgIGNvbnN0IGN1cnJlbnRWYWx1ZSA9IG1vZGVsLmdldEdyb3VwSXRlbVZhbHVlKCBzZWxlY3RlZEdyb3VwSXRlbSApO1xyXG4gICAgICAgICAgaWYgKCBjdXJyZW50VmFsdWUgJiYgIW5ld1JhbmdlLmNvbnRhaW5zKCBjdXJyZW50VmFsdWUgKSApIHtcclxuICAgICAgICAgICAgbW9kZWwuc2VsZWN0ZWRHcm91cEl0ZW1Qcm9wZXJ0eS52YWx1ZSA9IHByb3ZpZGVkT3B0aW9ucy5nZXRHcm91cEl0ZW1Ub1NlbGVjdCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgZ3JhYlJlbGVhc2VDdWVPcHRpb25zOiB7fVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgc3VwZXIoIG9wdGlvbnMgKTtcclxuXHJcbiAgICB0aGlzLmdldE5vZGVGcm9tTW9kZWxJdGVtID0gb3B0aW9ucy5nZXROb2RlRnJvbU1vZGVsSXRlbTtcclxuICAgIHRoaXMuc29ydEdyb3VwSXRlbSA9IG9wdGlvbnMuc29ydEdyb3VwSXRlbTtcclxuICAgIHRoaXMub25Tb3J0ID0gb3B0aW9ucy5vblNvcnQ7XHJcbiAgICB0aGlzLnNvcnRpbmdSYW5nZVByb3BlcnR5ID0gb3B0aW9ucy5zb3J0aW5nUmFuZ2VQcm9wZXJ0eTtcclxuICAgIHRoaXMuc29ydFN0ZXAgPSBvcHRpb25zLnNvcnRTdGVwO1xyXG4gICAgdGhpcy5zaGlmdFNvcnRTdGVwID0gb3B0aW9ucy5zaGlmdFNvcnRTdGVwO1xyXG4gICAgdGhpcy5wYWdlU29ydFN0ZXAgPSBvcHRpb25zLnBhZ2VTb3J0U3RlcDtcclxuXHJcbiAgICBjb25zdCBzZWxlY3RlZEdyb3VwSXRlbVByb3BlcnR5ID0gdGhpcy5tb2RlbC5zZWxlY3RlZEdyb3VwSXRlbVByb3BlcnR5O1xyXG4gICAgY29uc3QgaXNLZXlib2FyZEZvY3VzZWRQcm9wZXJ0eSA9IHRoaXMubW9kZWwuaXNLZXlib2FyZEZvY3VzZWRQcm9wZXJ0eTtcclxuICAgIGNvbnN0IGlzR3JvdXBJdGVtS2V5Ym9hcmRHcmFiYmVkUHJvcGVydHkgPSB0aGlzLm1vZGVsLmlzR3JvdXBJdGVtS2V5Ym9hcmRHcmFiYmVkUHJvcGVydHk7XHJcbiAgICBjb25zdCBoYXNLZXlib2FyZEdyYWJiZWRHcm91cEl0ZW1Qcm9wZXJ0eSA9IHRoaXMubW9kZWwuaGFzS2V5Ym9hcmRHcmFiYmVkR3JvdXBJdGVtUHJvcGVydHk7XHJcblxyXG4gICAgY29uc3QgZ3JhYmJlZFByb3BlcnR5TGlzdGVuZXIgPSAoIGdyYWJiZWQ6IGJvb2xlYW4gKSA9PiB7XHJcbiAgICAgIGNvbnN0IHNlbGVjdGVkR3JvdXBJdGVtID0gc2VsZWN0ZWRHcm91cEl0ZW1Qcm9wZXJ0eS52YWx1ZTtcclxuICAgICAgaWYgKCBzZWxlY3RlZEdyb3VwSXRlbSApIHtcclxuICAgICAgICBpZiAoIGdyYWJiZWQgKSB7XHJcbiAgICAgICAgICBvcHRpb25zLm9uR3JhYiggc2VsZWN0ZWRHcm91cEl0ZW0gKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBvcHRpb25zLm9uUmVsZWFzZSggc2VsZWN0ZWRHcm91cEl0ZW0gKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgICBpc0dyb3VwSXRlbUtleWJvYXJkR3JhYmJlZFByb3BlcnR5LmxhenlMaW5rKCBncmFiYmVkUHJvcGVydHlMaXN0ZW5lciApO1xyXG5cclxuICAgIC8vIElmIHRoZSBuZXcgcmFuZ2UgZG9lc24ndCBpbmNsdWRlIHRoZSBjdXJyZW50IHNlbGVjdGlvbiwgcmVzZXQgYmFjayB0byB0aGUgZGVmYXVsdCBoZXVyaXN0aWMuXHJcbiAgICBvcHRpb25zLnNvcnRpbmdSYW5nZVByb3BlcnR5LmxhenlMaW5rKCBvcHRpb25zLnNvcnRpbmdSYW5nZUxpc3RlbmVyICk7XHJcbiAgICB0aGlzLmRpc3Bvc2VFbWl0dGVyLmFkZExpc3RlbmVyKCAoKSA9PiB7XHJcbiAgICAgIGlzR3JvdXBJdGVtS2V5Ym9hcmRHcmFiYmVkUHJvcGVydHkudW5saW5rKCBncmFiYmVkUHJvcGVydHlMaXN0ZW5lciApO1xyXG4gICAgICBvcHRpb25zLnNvcnRpbmdSYW5nZVByb3BlcnR5LnVubGluayggb3B0aW9ucy5zb3J0aW5nUmFuZ2VMaXN0ZW5lciApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IGZvY3VzTGlzdGVuZXIgPSB7XHJcbiAgICAgIGZvY3VzOiAoKSA9PiB7XHJcblxyXG4gICAgICAgIC8vIEl0J3MgcG9zc2libGUgdGhhdCBnZXRHcm91cEl0ZW1Ub1NlbGVjdCdzIGhldXJpc3RpYyBzYWlkIHRoYXQgdGhlcmUgaXMgbm90aGluZyB0byBmb2N1cyBoZXJlXHJcbiAgICAgICAgaWYgKCBzZWxlY3RlZEdyb3VwSXRlbVByb3BlcnR5LnZhbHVlID09PSBudWxsICkge1xyXG4gICAgICAgICAgc2VsZWN0ZWRHcm91cEl0ZW1Qcm9wZXJ0eS52YWx1ZSA9IG9wdGlvbnMuZ2V0R3JvdXBJdGVtVG9TZWxlY3QoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlzS2V5Ym9hcmRGb2N1c2VkUHJvcGVydHkudmFsdWUgPSB0cnVlO1xyXG5cclxuICAgICAgICAvLyBXaGVuIHRoZSBncm91cCByZWNlaXZlcyBrZXlib2FyZCBmb2N1cywgbWFrZSBzdXJlIHRoYXQgdGhlIHNlbGVjdGVkIGdyb3VwIGl0ZW0gaXMgZGlzcGxheWVkXHJcbiAgICAgICAgaWYgKCBzZWxlY3RlZEdyb3VwSXRlbVByb3BlcnR5LnZhbHVlICE9PSBudWxsICkge1xyXG4gICAgICAgICAgY29uc3Qgbm9kZSA9IG9wdGlvbnMuZ2V0Tm9kZUZyb21Nb2RlbEl0ZW0oIHNlbGVjdGVkR3JvdXBJdGVtUHJvcGVydHkudmFsdWUgKTtcclxuICAgICAgICAgIG5vZGUgJiYgYW5pbWF0ZWRQYW5ab29tU2luZ2xldG9uLmxpc3RlbmVyLnBhblRvTm9kZSggbm9kZSwgdHJ1ZSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgYmx1cjogKCkgPT4ge1xyXG4gICAgICAgIGlzR3JvdXBJdGVtS2V5Ym9hcmRHcmFiYmVkUHJvcGVydHkudmFsdWUgPSBmYWxzZTtcclxuICAgICAgICBpc0tleWJvYXJkRm9jdXNlZFByb3BlcnR5LnZhbHVlID0gZmFsc2U7XHJcbiAgICAgIH0sXHJcbiAgICAgIG92ZXI6ICgpID0+IHtcclxuXHJcbiAgICAgICAgLy8gV2hlbiB5b3UgbW91c2Ugb3ZlciB3aGlsZSBmb2N1c2VkLCB0aGUgaGlnaGxpZ2h0cyBhcmUgaGlkZGVuLCBhbmQgc28gdXBkYXRlIHRoZSBzdGF0ZSAoZXZlbiB0aG91Z2ggd2UgYXJlXHJcbiAgICAgICAgLy8gc3RpbGwgdGVjaG5pY2FsbHkga2V5Ym9hcmQgZm9jdXNlZCkuIFRoaXMgd2lsbCBhc3Npc3QgaW4gc2hvd2luZyB0aGUgbW91c2UgY3VlLCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2VudGVyLWFuZC12YXJpYWJpbGl0eS9pc3N1ZXMvNDA2XHJcbiAgICAgICAgaXNLZXlib2FyZEZvY3VzZWRQcm9wZXJ0eS52YWx1ZSA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIFdoZW4gaW50ZXJhY3RpdmUgaGlnaGxpZ2h0cyBiZWNvbWUgYWN0aXZlIG9uIHRoZSBncm91cCwgaW50ZXJhY3Rpb24gd2l0aCBhIG1vdXNlIGhhcyBiZWd1biB3aGlsZSB1c2luZ1xyXG4gICAgLy8gSW50ZXJhY3RpdmUgSGlnaGxpZ2h0aW5nLiBXaGVuIHRoYXQgaGFwcGVucywgY2xlYXIgdGhlIHNlbGVjdGlvbiB0byBwcmV2ZW50IGZvY3VzIGhpZ2hsaWdodCBmbGlja2VyaW5nL3RocmFzaGluZy5cclxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2VudGVyLWFuZC12YXJpYWJpbGl0eS9pc3N1ZXMvNTU3IGFuZCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS1waGV0L2lzc3Vlcy84MTVcclxuICAgIGlmICggKCBwcmltYXJ5Rm9jdXNlZE5vZGUgYXMgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdOb2RlICkuaXNJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZyApIHtcclxuICAgICAgY29uc3QgYXNIaWdobGlnaHRpbmdOb2RlQWxpYXMgPSBwcmltYXJ5Rm9jdXNlZE5vZGUgYXMgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdOb2RlO1xyXG4gICAgICBjb25zdCBpbnRlcmFjdGl2ZUhpZ2hsaWdodGluZ0FjdGl2ZUxpc3RlbmVyID0gKCBhY3RpdmU6IGJvb2xlYW4gKSA9PiB7XHJcbiAgICAgICAgaWYgKCBhY3RpdmUgKSB7XHJcbiAgICAgICAgICBpZiAoIG1vZGVsLnNlbGVjdGVkR3JvdXBJdGVtUHJvcGVydHkudmFsdWUgIT09IG51bGwgKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBSZWxlYXNlIHRoZSBzZWxlY3Rpb24gaWYgZ3JhYmJlZFxyXG4gICAgICAgICAgICBtb2RlbC5pc0dyb3VwSXRlbUtleWJvYXJkR3JhYmJlZFByb3BlcnR5LnZhbHVlID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAvLyBDbGVhciB0aGUgc2VsZWN0aW9uIHNvIHRoYXQgdGhlcmUgaXNuJ3QgcG90ZW50aWFsIGZvciBmbGlja2VyaW5nIGluIGJldHdlZW4gaW5wdXQgbW9kYWxpdGllc1xyXG4gICAgICAgICAgICBtb2RlbC5zZWxlY3RlZEdyb3VwSXRlbVByb3BlcnR5LnZhbHVlID0gbnVsbDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBUaGlzIGNvbnRyb2xzIHRoZSB2aXNpYmlsaXR5IG9mIGludGVyYWN0aW9uIGN1ZXMgKGtleWJvYXJkIHZzIG1vdXNlKSwgc28gd2UgbmVlZCB0byBjbGVhciBpdCB3aGVuXHJcbiAgICAgICAgICAvLyBzd2l0Y2hpbmcgaW50ZXJhY3Rpb24gbW9kZXMuXHJcbiAgICAgICAgICBpc0tleWJvYXJkRm9jdXNlZFByb3BlcnR5LnZhbHVlID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgICBhc0hpZ2hsaWdodGluZ05vZGVBbGlhcy5pc0ludGVyYWN0aXZlSGlnaGxpZ2h0QWN0aXZlUHJvcGVydHkubGF6eUxpbmsoIGludGVyYWN0aXZlSGlnaGxpZ2h0aW5nQWN0aXZlTGlzdGVuZXIgKTtcclxuXHJcbiAgICAgIHRoaXMuZGlzcG9zZUVtaXR0ZXIuYWRkTGlzdGVuZXIoICgpID0+IHtcclxuICAgICAgICBhc0hpZ2hsaWdodGluZ05vZGVBbGlhcy5pc0ludGVyYWN0aXZlSGlnaGxpZ2h0QWN0aXZlUHJvcGVydHkudW5saW5rKCBpbnRlcmFjdGl2ZUhpZ2hsaWdodGluZ0FjdGl2ZUxpc3RlbmVyICk7XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB1cGRhdGVGb2N1c0hpZ2hsaWdodCA9IG5ldyBNdWx0aWxpbmsoIFtcclxuICAgICAgICBzZWxlY3RlZEdyb3VwSXRlbVByb3BlcnR5LFxyXG4gICAgICAgIGlzR3JvdXBJdGVtS2V5Ym9hcmRHcmFiYmVkUHJvcGVydHlcclxuICAgICAgXSxcclxuICAgICAgKCBzZWxlY3RlZEdyb3VwSXRlbSwgaXNHcm91cEl0ZW1HcmFiYmVkICkgPT4ge1xyXG4gICAgICAgIGxldCBmb2N1c0hpZ2hsaWdodFNldCA9IGZhbHNlO1xyXG4gICAgICAgIGlmICggc2VsZWN0ZWRHcm91cEl0ZW0gKSB7XHJcbiAgICAgICAgICBjb25zdCBub2RlID0gb3B0aW9ucy5nZXRIaWdobGlnaHROb2RlRnJvbU1vZGVsSXRlbSggc2VsZWN0ZWRHcm91cEl0ZW0gKTtcclxuICAgICAgICAgIGlmICggbm9kZSApIHtcclxuICAgICAgICAgICAgY29uc3QgZm9jdXNGb3JTZWxlY3RlZEdyb3VwSXRlbSA9IG5ldyBIaWdobGlnaHRGcm9tTm9kZSggbm9kZSwgeyBkYXNoZWQ6IGlzR3JvdXBJdGVtR3JhYmJlZCB9ICk7XHJcblxyXG4gICAgICAgICAgICAvLyBJZiBhdmFpbGFibGUsIHNldCB0byB0aGUgZm9jdXNlZCBzZWxlY3Rpb24gZm9yIHRoaXMgc2NlbmUuXHJcbiAgICAgICAgICAgIHByaW1hcnlGb2N1c2VkTm9kZS5zZXRGb2N1c0hpZ2hsaWdodCggZm9jdXNGb3JTZWxlY3RlZEdyb3VwSXRlbSApO1xyXG4gICAgICAgICAgICBmb2N1c0hpZ2hsaWdodFNldCA9IHRydWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiBub3Qgc2V0IGFib3ZlLCB0aGVuIGFjdGl2ZWx5IGhpZGUgaXQuXHJcbiAgICAgICAgIWZvY3VzSGlnaGxpZ2h0U2V0ICYmIHByaW1hcnlGb2N1c2VkTm9kZS5zZXRGb2N1c0hpZ2hsaWdodCggJ2ludmlzaWJsZScgKTtcclxuXHJcbiAgICAgICAgaWYgKCBzZWxlY3RlZEdyb3VwSXRlbSAhPT0gbnVsbCApIHtcclxuICAgICAgICAgIHRoaXMucG9zaXRpb25Tb3J0Q3VlTm9kZUVtaXR0ZXIuZW1pdCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBcInJlbGVhc2VcIiBpbnRvIHNlbGVjdGluZyBzdGF0ZSB3aGVuIGRpc2FibGVkXHJcbiAgICBjb25zdCBlbmFibGVkTGlzdGVuZXIgPSAoIGVuYWJsZWQ6IGJvb2xlYW4gKSA9PiB7XHJcbiAgICAgIGlmICggIWVuYWJsZWQgKSB7XHJcbiAgICAgICAgaGFzS2V5Ym9hcmRHcmFiYmVkR3JvdXBJdGVtUHJvcGVydHkudmFsdWUgPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIHRoaXMubW9kZWwuZW5hYmxlZFByb3BlcnR5LmxpbmsoIGVuYWJsZWRMaXN0ZW5lciApO1xyXG4gICAgdGhpcy5kaXNwb3NlRW1pdHRlci5hZGRMaXN0ZW5lciggKCkgPT4ge1xyXG4gICAgICB0aGlzLm1vZGVsLmVuYWJsZWRQcm9wZXJ0eS51bmxpbmsoIGVuYWJsZWRMaXN0ZW5lciApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIEEgS2V5Ym9hcmRMaXN0ZW5lciB0aGF0IGNoYW5nZXMgdGhlIFwic29ydGluZ1wiIHZzIFwic2VsZWN0aW5nXCIgc3RhdGUgb2YgdGhlIGludGVyYWN0aW9uLlxyXG4gICAgY29uc3QgZ3JhYlJlbGVhc2VLZXlib2FyZExpc3RlbmVyID0gbmV3IEtleWJvYXJkTGlzdGVuZXIoIHtcclxuICAgICAgZmlyZU9uSG9sZDogdHJ1ZSxcclxuICAgICAga2V5czogWyAnZW50ZXInLCAnc3BhY2UnLCAnZXNjYXBlJyBdLFxyXG4gICAgICBmaXJlOiAoIGV2ZW50LCBrZXlzUHJlc3NlZCApID0+IHtcclxuICAgICAgICBpZiAoIHRoaXMubW9kZWwuZW5hYmxlZCAmJiBzZWxlY3RlZEdyb3VwSXRlbVByb3BlcnR5LnZhbHVlICE9PSBudWxsICkge1xyXG5cclxuICAgICAgICAgIC8vIERvIHRoZSBcIkdyYWIvcmVsZWFzZVwiIGFjdGlvbiB0byBzd2l0Y2ggdG8gc29ydGluZyBvciBzZWxlY3RpbmdcclxuICAgICAgICAgIGlmICgga2V5c1ByZXNzZWQgPT09ICdlbnRlcicgfHwga2V5c1ByZXNzZWQgPT09ICdzcGFjZScgKSB7XHJcbiAgICAgICAgICAgIGlzR3JvdXBJdGVtS2V5Ym9hcmRHcmFiYmVkUHJvcGVydHkudG9nZ2xlKCk7XHJcbiAgICAgICAgICAgIGhhc0tleWJvYXJkR3JhYmJlZEdyb3VwSXRlbVByb3BlcnR5LnZhbHVlID0gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2UgaWYgKCBpc0dyb3VwSXRlbUtleWJvYXJkR3JhYmJlZFByb3BlcnR5LnZhbHVlICYmIGtleXNQcmVzc2VkID09PSAnZXNjYXBlJyApIHtcclxuICAgICAgICAgICAgaXNHcm91cEl0ZW1LZXlib2FyZEdyYWJiZWRQcm9wZXJ0eS52YWx1ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFJlc2V0IHRvIHRydWUgZnJvbSBrZXlib2FyZCBpbnB1dCwgaW4gY2FzZSBtb3VzZS90b3VjaCBpbnB1dCBzZXQgdG8gZmFsc2UgZHVyaW5nIHRoZSBrZXlib2FyZCBpbnRlcmFjdGlvbi5cclxuICAgICAgICAgIGlzS2V5Ym9hcmRGb2N1c2VkUHJvcGVydHkudmFsdWUgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IGRlbHRhS2V5Ym9hcmRMaXN0ZW5lciA9IG5ldyBLZXlib2FyZExpc3RlbmVyKCB7XHJcbiAgICAgIGZpcmVPbkhvbGQ6IHRydWUsXHJcbiAgICAgIGtleXM6IHNvcnRpbmdLZXlzLFxyXG4gICAgICBmaXJlOiAoIGV2ZW50LCBrZXlzUHJlc3NlZCApID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCBzZWxlY3RlZEdyb3VwSXRlbVByb3BlcnR5LnZhbHVlICE9PSBudWxsICkge1xyXG5cclxuICAgICAgICAgIGNvbnN0IGdyb3VwSXRlbSA9IHNlbGVjdGVkR3JvdXBJdGVtUHJvcGVydHkudmFsdWU7XHJcbiAgICAgICAgICBjb25zdCBvbGRWYWx1ZSA9IHRoaXMubW9kZWwuZ2V0R3JvdXBJdGVtVmFsdWUoIGdyb3VwSXRlbSApITtcclxuICAgICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIG9sZFZhbHVlICE9PSBudWxsLCAnV2Ugc2hvdWxkIGhhdmUgYSBncm91cCBpdGVtIHdoZW4gcmVzcG9uZGluZyB0byBpbnB1dD8nICk7XHJcblxyXG4gICAgICAgICAgLy8gU29ydGluZyBhbiBpdGVtXHJcbiAgICAgICAgICBpZiAoIGlzR3JvdXBJdGVtS2V5Ym9hcmRHcmFiYmVkUHJvcGVydHkudmFsdWUgKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBEb24ndCBkbyBhbnkgc29ydGluZyB3aGVuIGRpc2FibGVkXHJcbiAgICAgICAgICAgIC8vIEZvciB0aGVzZSBrZXlzLCB0aGUgaXRlbSB3aWxsIG1vdmUgYnkgYSBwYXJ0aWN1bGFyIGRlbHRhXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5tb2RlbC5lbmFibGVkICYmIHNvcnRpbmdLZXlzLmluY2x1ZGVzKCBrZXlzUHJlc3NlZCApICkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IGRlbHRhID0gdGhpcy5nZXREZWx0YUZvcktleSgga2V5c1ByZXNzZWQgKSE7XHJcbiAgICAgICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggZGVsdGEgIT09IG51bGwsICdzaG91bGQgYmUgYSBzdXBwb3J0ZWQga2V5JyApO1xyXG4gICAgICAgICAgICAgIGNvbnN0IG5ld1ZhbHVlID0gb2xkVmFsdWUgKyBkZWx0YTtcclxuICAgICAgICAgICAgICB0aGlzLm9uU29ydGVkVmFsdWUoIGdyb3VwSXRlbSwgbmV3VmFsdWUsIG9sZFZhbHVlICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBTZWxlY3RpbmcgYW4gaXRlbVxyXG4gICAgICAgICAgICBjb25zdCB1bmNsYW1wZWREZWx0YSA9IHRoaXMuZ2V0RGVsdGFGb3JLZXkoIGtleXNQcmVzc2VkICk7XHJcbiAgICAgICAgICAgIGlmICggdW5jbGFtcGVkRGVsdGEgIT09IG51bGwgKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5tb2RlbC5oYXNLZXlib2FyZFNlbGVjdGVkR3JvdXBJdGVtUHJvcGVydHkudmFsdWUgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICBjb25zdCBjbGFtcGVkRGVsdGEgPSB0aGlzLnNvcnRpbmdSYW5nZVByb3BlcnR5LnZhbHVlLmNsYW1wRGVsdGEoIG9sZFZhbHVlLCB1bmNsYW1wZWREZWx0YSApO1xyXG4gICAgICAgICAgICAgIHNlbGVjdGVkR3JvdXBJdGVtUHJvcGVydHkudmFsdWUgPSBvcHRpb25zLmdldE5leHRTZWxlY3RlZEdyb3VwSXRlbSggY2xhbXBlZERlbHRhLCBncm91cEl0ZW0gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdGhpcy5vbkdyb3VwSXRlbUNoYW5nZSggZ3JvdXBJdGVtICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgaWYgKCBvcHRpb25zLm51bWJlcktleU1hcHBlciApIHtcclxuICAgICAgY29uc3QgbnVtYmVyc0tleWJvYXJkTGlzdGVuZXIgPSBuZXcgS2V5Ym9hcmRMaXN0ZW5lcigge1xyXG4gICAgICAgIGZpcmVPbkhvbGQ6IHRydWUsXHJcbiAgICAgICAga2V5czogWyAnMScsICcyJywgJzMnLCAnNCcsICc1JywgJzYnLCAnNycsICc4JywgJzknLCAnMCcgXSxcclxuICAgICAgICBmaXJlOiAoIGV2ZW50LCBrZXlzUHJlc3NlZCApID0+IHtcclxuICAgICAgICAgIGlmICggc2VsZWN0ZWRHcm91cEl0ZW1Qcm9wZXJ0eS52YWx1ZSAhPT0gbnVsbCAmJiBpc0dyb3VwSXRlbUtleWJvYXJkR3JhYmJlZFByb3BlcnR5LnZhbHVlICYmXHJcbiAgICAgICAgICAgICAgIGlzU2luZ2xlRGlnaXQoIGtleXNQcmVzc2VkICkgKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBncm91cEl0ZW0gPSBzZWxlY3RlZEdyb3VwSXRlbVByb3BlcnR5LnZhbHVlO1xyXG4gICAgICAgICAgICBjb25zdCBvbGRWYWx1ZSA9IHRoaXMubW9kZWwuZ2V0R3JvdXBJdGVtVmFsdWUoIGdyb3VwSXRlbSApITtcclxuICAgICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggb2xkVmFsdWUgIT09IG51bGwsICdXZSBzaG91bGQgaGF2ZSBhIGdyb3VwIGl0ZW0gd2hlbiByZXNwb25kaW5nIHRvIGlucHV0PycgKTtcclxuICAgICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggaXNTaW5nbGVEaWdpdCgga2V5c1ByZXNzZWQgKSwgJ3Nhbml0eSBjaGVjayBvbiBudW1iZXJzIGZvciBrZXlib2FyZCBsaXN0ZW5lcicgKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IG1hcHBlZFZhbHVlID0gb3B0aW9ucy5udW1iZXJLZXlNYXBwZXIhKCBrZXlzUHJlc3NlZCApO1xyXG4gICAgICAgICAgICBpZiAoIG1hcHBlZFZhbHVlICkge1xyXG4gICAgICAgICAgICAgIHRoaXMub25Tb3J0ZWRWYWx1ZSggZ3JvdXBJdGVtLCBtYXBwZWRWYWx1ZSwgb2xkVmFsdWUgKTtcclxuICAgICAgICAgICAgICB0aGlzLm9uR3JvdXBJdGVtQ2hhbmdlKCBncm91cEl0ZW0gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG4gICAgICBwcmltYXJ5Rm9jdXNlZE5vZGUuYWRkSW5wdXRMaXN0ZW5lciggbnVtYmVyc0tleWJvYXJkTGlzdGVuZXIgKTtcclxuICAgICAgdGhpcy5kaXNwb3NlRW1pdHRlci5hZGRMaXN0ZW5lciggKCkgPT4ge1xyXG4gICAgICAgIHByaW1hcnlGb2N1c2VkTm9kZS5yZW1vdmVJbnB1dExpc3RlbmVyKCBudW1iZXJzS2V5Ym9hcmRMaXN0ZW5lciApO1xyXG4gICAgICAgIG51bWJlcnNLZXlib2FyZExpc3RlbmVyLmRpc3Bvc2UoKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRlZmF1bHRHcm91cFNoYXBlID0gcHJpbWFyeUZvY3VzZWROb2RlLnZpc2libGVCb3VuZHMuaXNGaW5pdGUoKSA/IFNoYXBlLmJvdW5kcyggcHJpbWFyeUZvY3VzZWROb2RlLnZpc2libGVCb3VuZHMgKSA6IG51bGw7XHJcblxyXG4gICAgLy8gU2V0IHRoZSBvdXRlciBncm91cCBmb2N1cyBoaWdobGlnaHQgdG8gc3Vycm91bmQgdGhlIGVudGlyZSBhcmVhIHdoZXJlIGdyb3VwIGl0ZW1zIGFyZSBsb2NhdGVkLlxyXG4gICAgdGhpcy5ncm91cFNvcnRHcm91cEZvY3VzSGlnaGxpZ2h0UGF0aCA9IG5ldyBIaWdobGlnaHRQYXRoKCBkZWZhdWx0R3JvdXBTaGFwZSwge1xyXG4gICAgICBvdXRlclN0cm9rZTogSGlnaGxpZ2h0UGF0aC5PVVRFUl9MSUdIVF9HUk9VUF9GT0NVU19DT0xPUixcclxuICAgICAgaW5uZXJTdHJva2U6IEhpZ2hsaWdodFBhdGguSU5ORVJfTElHSFRfR1JPVVBfRk9DVVNfQ09MT1IsXHJcbiAgICAgIG91dGVyTGluZVdpZHRoOiBIaWdobGlnaHRQYXRoLkdST1VQX09VVEVSX0xJTkVfV0lEVEgsXHJcbiAgICAgIGlubmVyTGluZVdpZHRoOiBIaWdobGlnaHRQYXRoLkdST1VQX0lOTkVSX0xJTkVfV0lEVEhcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLmdyYWJSZWxlYXNlQ3VlTm9kZSA9IG5ldyBHcmFiUmVsZWFzZUN1ZU5vZGUoIGNvbWJpbmVPcHRpb25zPEdyYWJSZWxlYXNlQ3VlTm9kZU9wdGlvbnM+KCB7XHJcbiAgICAgIHZpc2libGVQcm9wZXJ0eTogdGhpcy5tb2RlbC5ncmFiUmVsZWFzZUN1ZVZpc2libGVQcm9wZXJ0eVxyXG4gICAgfSwgb3B0aW9ucy5ncmFiUmVsZWFzZUN1ZU9wdGlvbnMgKSApO1xyXG4gICAgdGhpcy5ncm91cFNvcnRHcm91cEZvY3VzSGlnaGxpZ2h0UGF0aC5hZGRDaGlsZCggdGhpcy5ncmFiUmVsZWFzZUN1ZU5vZGUgKTtcclxuXHJcbiAgICBwcmltYXJ5Rm9jdXNlZE5vZGUuc2V0R3JvdXBGb2N1c0hpZ2hsaWdodCggdGhpcy5ncm91cFNvcnRHcm91cEZvY3VzSGlnaGxpZ2h0UGF0aCApO1xyXG4gICAgcHJpbWFyeUZvY3VzZWROb2RlLmFkZElucHV0TGlzdGVuZXIoIGZvY3VzTGlzdGVuZXIgKTtcclxuICAgIHByaW1hcnlGb2N1c2VkTm9kZS5hZGRJbnB1dExpc3RlbmVyKCBncmFiUmVsZWFzZUtleWJvYXJkTGlzdGVuZXIgKTtcclxuICAgIHByaW1hcnlGb2N1c2VkTm9kZS5hZGRJbnB1dExpc3RlbmVyKCBkZWx0YUtleWJvYXJkTGlzdGVuZXIgKTtcclxuXHJcbiAgICB0aGlzLmRpc3Bvc2VFbWl0dGVyLmFkZExpc3RlbmVyKCAoKSA9PiB7XHJcbiAgICAgIHByaW1hcnlGb2N1c2VkTm9kZS5zZXRHcm91cEZvY3VzSGlnaGxpZ2h0KCBmYWxzZSApO1xyXG4gICAgICBwcmltYXJ5Rm9jdXNlZE5vZGUuc2V0Rm9jdXNIaWdobGlnaHQoIG51bGwgKTtcclxuICAgICAgcHJpbWFyeUZvY3VzZWROb2RlLnJlbW92ZUlucHV0TGlzdGVuZXIoIGRlbHRhS2V5Ym9hcmRMaXN0ZW5lciApO1xyXG4gICAgICBwcmltYXJ5Rm9jdXNlZE5vZGUucmVtb3ZlSW5wdXRMaXN0ZW5lciggZ3JhYlJlbGVhc2VLZXlib2FyZExpc3RlbmVyICk7XHJcbiAgICAgIHByaW1hcnlGb2N1c2VkTm9kZS5yZW1vdmVJbnB1dExpc3RlbmVyKCBmb2N1c0xpc3RlbmVyICk7XHJcbiAgICAgIHVwZGF0ZUZvY3VzSGlnaGxpZ2h0LmRpc3Bvc2UoKTtcclxuICAgICAgZGVsdGFLZXlib2FyZExpc3RlbmVyLmRpc3Bvc2UoKTtcclxuICAgICAgZ3JhYlJlbGVhc2VLZXlib2FyZExpc3RlbmVyLmRpc3Bvc2U7XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICAvLyBCeSBcImNoYW5nZVwiIHdlIG1lYW4gc29ydCBvciBzZWxlY3Rpb24uXHJcbiAgcHJpdmF0ZSBvbkdyb3VwSXRlbUNoYW5nZSggbmV3R3JvdXBJdGVtOiBJdGVtTW9kZWwgKTogdm9pZCB7XHJcbiAgICAvLyBXaGVuIHVzaW5nIGtleWJvYXJkIGlucHV0LCBtYWtlIHN1cmUgdGhhdCB0aGUgc2VsZWN0ZWQgZ3JvdXAgaXRlbSBpcyBzdGlsbCBkaXNwbGF5ZWQgYnkgcGFubmluZyB0byBrZWVwIGl0XHJcbiAgICAvLyBpbiB2aWV3LiBgcGFuVG9DZW50ZXJgIGlzIGZhbHNlIGJlY2F1c2UgY2VudGVyaW5nIHRoZSBncm91cCBpdGVtIGluIHRoZSBzY3JlZW4gaXMgdG9vIG11Y2ggbW92ZW1lbnQuXHJcbiAgICBjb25zdCBub2RlID0gdGhpcy5nZXROb2RlRnJvbU1vZGVsSXRlbSggbmV3R3JvdXBJdGVtICk7XHJcbiAgICBub2RlICYmIGFuaW1hdGVkUGFuWm9vbVNpbmdsZXRvbi5saXN0ZW5lci5wYW5Ub05vZGUoIG5vZGUsIGZhbHNlICk7XHJcblxyXG4gICAgLy8gUmVzZXQgdG8gdHJ1ZSBmcm9tIGtleWJvYXJkIGlucHV0LCBpbiBjYXNlIG1vdXNlL3RvdWNoIGlucHV0IHNldCB0byBmYWxzZSBkdXJpbmcgdGhlIGtleWJvYXJkIGludGVyYWN0aW9uLlxyXG4gICAgdGhpcy5tb2RlbC5pc0tleWJvYXJkRm9jdXNlZFByb3BlcnR5LnZhbHVlID0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8vIENvbmR1Y3QgdGhlIHNvcnRpbmcgb2YgYSB2YWx1ZVxyXG4gIHByaXZhdGUgb25Tb3J0ZWRWYWx1ZSggZ3JvdXBJdGVtOiBJdGVtTW9kZWwsIHZhbHVlOiBudW1iZXIsIG9sZFZhbHVlOiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB2YWx1ZSAhPT0gbnVsbCwgJ1dlIHNob3VsZCBoYXZlIGEgdmFsdWUgZm9yIHRoZSBncm91cCBpdGVtIGJ5IHRoZSBlbmQgb2YgdGhlIGxpc3RlbmVyLicgKTtcclxuXHJcbiAgICB0aGlzLnNvcnRHcm91cEl0ZW0oIGdyb3VwSXRlbSwgdGhpcy5zb3J0aW5nUmFuZ2VQcm9wZXJ0eS52YWx1ZS5jb25zdHJhaW5WYWx1ZSggdmFsdWUgKSApO1xyXG4gICAgdGhpcy5vblNvcnQoIGdyb3VwSXRlbSwgb2xkVmFsdWUgKTtcclxuICAgIHRoaXMubW9kZWwuaGFzS2V5Ym9hcmRTb3J0ZWRHcm91cEl0ZW1Qcm9wZXJ0eS52YWx1ZSA9IHRydWU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIGRlbHRhIHRvIGNoYW5nZSB0aGUgdmFsdWUgZ2l2ZW4gd2hhdCBrZXkgd2FzIHByZXNzZWQuIFRoZSByZXR1cm5lZCBkZWx0YSBtYXkgbm90IHJlc3VsdCBpbiBhIHZhbHVlIGluIHJhbmdlLFxyXG4gICAqIHBsZWFzZSBjb25zdHJhaW4gdmFsdWUgZnJvbSByYW5nZSBvciBwcm92aWRlIHlvdXIgb3duIGRlZmVuc2l2ZSBtZWFzdXJlcyB0byB0aGlzIGRlbHRhLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2V0RGVsdGFGb3JLZXkoIGtleTogc3RyaW5nICk6IG51bWJlciB8IG51bGwge1xyXG4gICAgY29uc3QgZnVsbFJhbmdlID0gdGhpcy5zb3J0aW5nUmFuZ2VQcm9wZXJ0eS52YWx1ZS5nZXRMZW5ndGgoKTtcclxuICAgIHJldHVybiBrZXkgPT09ICdob21lJyA/IC1mdWxsUmFuZ2UgOlxyXG4gICAgICAgICAgIGtleSA9PT0gJ2VuZCcgPyBmdWxsUmFuZ2UgOlxyXG4gICAgICAgICAgIGtleSA9PT0gJ3BhZ2VEb3duJyA/IC10aGlzLnBhZ2VTb3J0U3RlcCA6XHJcbiAgICAgICAgICAga2V5ID09PSAncGFnZVVwJyA/IHRoaXMucGFnZVNvcnRTdGVwIDpcclxuICAgICAgICAgICBbICdhcnJvd0xlZnQnLCAnYScsICdhcnJvd0Rvd24nLCAncycgXS5pbmNsdWRlcygga2V5ICkgPyAtdGhpcy5zb3J0U3RlcCA6XHJcbiAgICAgICAgICAgWyAnYXJyb3dSaWdodCcsICdkJywgJ2Fycm93VXAnLCAndycgXS5pbmNsdWRlcygga2V5ICkgPyB0aGlzLnNvcnRTdGVwIDpcclxuICAgICAgICAgICBbICdzaGlmdCthcnJvd0xlZnQnLCAnc2hpZnQrYScsICdzaGlmdCthcnJvd0Rvd24nLCAnc2hpZnQrcycgXS5pbmNsdWRlcygga2V5ICkgPyAtdGhpcy5zaGlmdFNvcnRTdGVwIDpcclxuICAgICAgICAgICBbICdzaGlmdCthcnJvd1JpZ2h0JywgJ3NoaWZ0K2QnLCAnc2hpZnQrYXJyb3dVcCcsICdzaGlmdCt3JyBdLmluY2x1ZGVzKCBrZXkgKSA/IHRoaXMuc2hpZnRTb3J0U3RlcCA6XHJcbiAgICAgICAgICAgbnVsbDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5ncm91cFNvcnRHcm91cEZvY3VzSGlnaGxpZ2h0UGF0aC5kaXNwb3NlKCk7XHJcbiAgICB0aGlzLmdyYWJSZWxlYXNlQ3VlTm9kZS5kaXNwb3NlKCk7XHJcbiAgICB0aGlzLnBvc2l0aW9uU29ydEN1ZU5vZGVFbWl0dGVyLmRpc3Bvc2UoKTtcclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVzZSBTb3J0Q3VlQXJyb3dOb2RlIHRvIGNyZWF0ZSBhIE5vZGUgZm9yIHRoZSBrZXlib2FyZCBzb3J0aW5nIGN1ZS4gQ2FuIGFsc28gYmUgdXNlZCBhcyB0aGUgbW91c2UvdG91Y2ggY3VlXHJcbiAgICogTm9kZSBpZiBkZXNpcmVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlU29ydEN1ZU5vZGUoIHZpc2libGVQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj4sIHNjYWxlID0gMSApOiBTb3J0Q3VlQXJyb3dOb2RlIHtcclxuICAgIHJldHVybiBuZXcgU29ydEN1ZUFycm93Tm9kZSgge1xyXG4gICAgICBkb3VibGVIZWFkOiB0cnVlLFxyXG4gICAgICBkYXNoV2lkdGg6IDMuNSAqIHNjYWxlLFxyXG4gICAgICBkYXNoSGVpZ2h0OiAyLjggKiBzY2FsZSxcclxuICAgICAgbnVtYmVyT2ZEYXNoZXM6IDMsXHJcbiAgICAgIHNwYWNpbmc6IDIgKiBzY2FsZSxcclxuICAgICAgdHJpYW5nbGVOb2RlT3B0aW9uczoge1xyXG4gICAgICAgIHRyaWFuZ2xlV2lkdGg6IDEyICogc2NhbGUsXHJcbiAgICAgICAgdHJpYW5nbGVIZWlnaHQ6IDExICogc2NhbGVcclxuICAgICAgfSxcclxuICAgICAgdmlzaWJsZVByb3BlcnR5OiB2aXNpYmxlUHJvcGVydHlcclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0b3IgZmFjdG9yeSwgc2ltaWxhciB0byBQaGV0aW9PYmplY3QuY3JlYXRlKCkuIFRoaXMgaXMgbW9zdCB1c2VmdWwgaWYgeW91IGRvbid0IG5lZWQgdG8ga2VlcCB0aGUgaW5zdGFuY2Ugb2ZcclxuICAgKiB5b3VyIEdyb3VwU29ydEludGVyYWN0aW9uVmlldy5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGNyZWF0ZTxJdGVtTW9kZWwsIEl0ZW1Ob2RlIGV4dGVuZHMgTm9kZT4oXHJcbiAgICBtb2RlbDogR3JvdXBTb3J0SW50ZXJhY3Rpb25Nb2RlbDxJdGVtTW9kZWw+LFxyXG4gICAgcHJpbWFyeUZvY3VzZWROb2RlOiBOb2RlLFxyXG4gICAgcHJvdmlkZWRPcHRpb25zOiBHcm91cFNvcnRJbnRlcmFjdGlvblZpZXdPcHRpb25zPEl0ZW1Nb2RlbCwgSXRlbU5vZGU+ICk6IEdyb3VwU29ydEludGVyYWN0aW9uVmlldzxJdGVtTW9kZWwsIEl0ZW1Ob2RlPiB7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBHcm91cFNvcnRJbnRlcmFjdGlvblZpZXc8SXRlbU1vZGVsLCBJdGVtTm9kZT4oIG1vZGVsLCBwcmltYXJ5Rm9jdXNlZE5vZGUsIHByb3ZpZGVkT3B0aW9ucyApO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaXNTaW5nbGVEaWdpdCgga2V5OiBzdHJpbmcgKTogYm9vbGVhbiB7IHJldHVybiAvXlxcZCQvLnRlc3QoIGtleSApO31cclxuXHJcbnNjZW5lcnlQaGV0LnJlZ2lzdGVyKCAnR3JvdXBTb3J0SW50ZXJhY3Rpb25WaWV3JywgR3JvdXBTb3J0SW50ZXJhY3Rpb25WaWV3ICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsU0FBU0Esd0JBQXdCLEVBQUVDLGlCQUFpQixFQUFFQyxhQUFhLEVBQStCQyxnQkFBZ0IsUUFBb0Isc0NBQXNDO0FBQzVLLE9BQU9DLFdBQVcsTUFBTSx5QkFBeUI7QUFFakQsT0FBT0MsU0FBUyxNQUFNLHFDQUFxQztBQUUzRCxPQUFPQyxPQUFPLE1BQU0sbUNBQW1DO0FBQ3ZELFNBQVNDLEtBQUssUUFBUSxtQ0FBbUM7QUFDekQs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