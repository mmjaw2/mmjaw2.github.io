// Copyright 2021-2024, University of Colorado Boulder

/**
 * Manages the Properties which signify and control where various forms of focus are. A Focus
 * just contains the Trail pointing to the Node with focus and a Display whose root is at the
 * root of that Trail. So it can be used for more than just DOM focus. At the time of this writing,
 * the forms of Focus include
 *
 *  - DOM Focus - The Focus Trail points to the Node whose element has DOM focus in the Parallel DOM.
 *                Only one element can have focus at a time (DOM limitation) so this is managed by a static on
 *                FocusManager.
 *  - Pointer Focus - The Focus trail points to a Node that supports Highlighting with pointer events.
 *  - Reading Block Focus - The Focus Trail points to a Node that supports ReadingBlocks, and is active
 *                          while the ReadingBlock content is being spoken for Voicing. See ReadingBlock.ts
 *
 * There may be other forms of Focus in the future.
 *
 * This class also controls setting and clearing of several (but not all) of these Properties. It does not set the
 * pdomFocusProperty because that Property is set only when the browser's focus changes. Some of the focus
 * Properties are set in feature traits, such as pointerFocusProperty which is set by InteractiveHighlighting because it is
 * set through listeners on each individual Node.
 *
 * This class also has a few Properties that control the behavior of the Display's HighlightOverlay.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import BooleanProperty from '../../../axon/js/BooleanProperty.js';
import DerivedProperty from '../../../axon/js/DerivedProperty.js';
import Property from '../../../axon/js/Property.js';
import Tandem from '../../../tandem/js/Tandem.js';
import NullableIO from '../../../tandem/js/types/NullableIO.js';
import { Focus, FocusDisplayedController, PDOMInstance, PDOMUtils, ReadingBlockUtterance, scenery, voicingManager } from '../imports.js';
export default class FocusManager {
  // This Property whose Focus Trail points to the Node under the pointer to
  // support features of Voicing and Interactive Highlights. Nodes that compose InteractiveHighlighting can
  // receive this Focus and a highlight may appear around it.

  // The Property that indicates which Node that uses ReadingBlock is currently
  // active. Used by the HighlightOverlay to highlight ReadingBlock Nodes whose content is being spoken.

  // A Property whose value is either null or a Focus with Trail and Display equal
  // to the pointerFocusProperty. When this Property has a value, the HighlightOverlay will wait to update the
  // highlight for the pointerFocusProperty. This is useful when the pointer has begun to interact with a Node
  // that uses InteractiveHighlighting, but the mouse has moved out of it or over another during interaction. The
  // highlight should remain on the Node receiving interaction and wait to update until interaction completes.

  // Controls whether or not highlights related to PDOM focus are visible.

  // Controls whether "Interactive Highlights" are visible.

  // Controls whether "Reading Block" highlights will be visible around Nodes
  // that use ReadingBlock.

  // Indicates whether any highlights should appear from pointer
  // input (mouse/touch). If false, we will try to avoid doing expensive work in PointerHighlighting.js.

  // Whenever the readingBlockFocusProperty's Focused Node is removed from
  // the scene graph or its Trail becomes invisible this removes focus.

  // When the lockedPointerFocusProperty's Node becomes invisible or is removed from the scene
  // graph, the locked pointer focus is cleared.

  // If the voicingManager starts speaking an Utterance for a ReadingBLock, set the readingBlockFocusProperty and
  // add listeners to clear it when the Node is removed or becomes invisible

  // Whenever the voicingManager stops speaking an utterance for the ReadingBlock that has focus, clear it

  // References to the window listeners that update when the window has focus. So they can be removed if needed.
  static attachedWindowFocusListener = null;
  static attachedWindowBlurListener = null;
  static globallyAttached = false;
  constructor() {
    this.pointerFocusProperty = new Property(null);
    this.readingBlockFocusProperty = new Property(null);
    this.lockedPointerFocusProperty = new Property(null);
    this.pdomFocusHighlightsVisibleProperty = new BooleanProperty(true);
    this.interactiveHighlightsVisibleProperty = new BooleanProperty(false);
    this.readingBlockHighlightsVisibleProperty = new BooleanProperty(false);

    // TODO: perhaps remove once reading blocks are set up to listen instead to Node.canSpeakProperty (voicingVisible), https://github.com/phetsims/scenery/issues/1343
    this.voicingFullyEnabledListener = enabled => {
      this.readingBlockHighlightsVisibleProperty.value = enabled;
    };
    voicingManager.voicingFullyEnabledProperty.link(this.voicingFullyEnabledListener);
    this.pointerHighlightsVisibleProperty = new DerivedProperty([this.interactiveHighlightsVisibleProperty, this.readingBlockHighlightsVisibleProperty], (interactiveHighlightsVisible, voicingEnabled) => {
      return interactiveHighlightsVisible || voicingEnabled;
    });

    //-----------------------------------------------------------------------------------------------------------------
    // The following section manages control of ReadingBlockFocusProperty. It takes a value whenever the
    // voicingManager starts speaking and the value is cleared when it stops speaking. Focus is also cleared
    // by the FocusDisplayedController.

    this.readingBlockFocusController = new FocusDisplayedController(this.readingBlockFocusProperty);
    this.startSpeakingListener = (text, utterance) => {
      this.readingBlockFocusProperty.value = utterance instanceof ReadingBlockUtterance ? utterance.readingBlockFocus : null;
    };

    // @ts-expect-error
    voicingManager.startSpeakingEmitter.addListener(this.startSpeakingListener);
    this.endSpeakingListener = (text, utterance) => {
      if (utterance instanceof ReadingBlockUtterance && this.readingBlockFocusProperty.value) {
        assert && assert(utterance.readingBlockFocus, 'should be non null focus');

        // only clear the readingBlockFocusProperty if the ReadingBlockUtterance has a Focus that matches the
        // current value for readingBlockFocusProperty so that the highlight doesn't disappear every time
        // the speaker stops talking
        if (utterance.readingBlockFocus.trail.equals(this.readingBlockFocusProperty.value.trail)) {
          this.readingBlockFocusProperty.value = null;
        }
      }
    };

    // @ts-expect-error
    voicingManager.endSpeakingEmitter.addListener(this.endSpeakingListener);

    //-----------------------------------------------------------------------------------------------------------------
    // The following section manages control of pointerFocusProperty - pointerFocusProperty is set with a Focus
    // by InteractiveHighlighting from listeners on Nodes that use that Trait. But it uses a FocusDisplayedController
    // to remove the focus at the right time.
    this.pointerFocusDisplayedController = new FocusDisplayedController(this.pointerFocusProperty);
    this.lockedPointerFocusDisplayedController = new FocusDisplayedController(this.lockedPointerFocusProperty);
    [this.pointerFocusProperty, this.lockedPointerFocusProperty].forEach(property => {
      property.link(this.onPointerFocusChange.bind(this));
    });
  }
  dispose() {
    this.pointerFocusProperty.dispose();
    this.readingBlockFocusProperty.dispose();
    this.lockedPointerFocusProperty.dispose();
    this.pdomFocusHighlightsVisibleProperty.dispose();
    this.interactiveHighlightsVisibleProperty.dispose();
    this.readingBlockHighlightsVisibleProperty.dispose();
    this.readingBlockFocusController.dispose();
    this.pointerFocusDisplayedController.dispose();
    this.pointerHighlightsVisibleProperty.dispose();
    this.lockedPointerFocusDisplayedController.dispose();

    // @ts-expect-error
    voicingManager.startSpeakingEmitter.removeListener(this.startSpeakingListener);

    // @ts-expect-error
    voicingManager.endSpeakingEmitter.removeListener(this.endSpeakingListener);
    voicingManager.voicingFullyEnabledProperty.unlink(this.voicingFullyEnabledListener);
  }

  /**
   * Update the pdomFocus from a focusin/focusout event. Scenery events are batched so that they cannot be
   * reentrant. However, that means that scenery state that needs to be updated synchronously with the
   * changing DOM cannot happen in listeners that fire from scenery input. This method
   * is meant to be called from focusin/focusout listeners on the window so that The pdomFocus matches
   * browser state.
   *
   * @param displays - List of any displays that are attached to BrowserEvents.
   * @param event - The focusin/focusout event that triggered this update.
   * @param focus - True for focusin event, false for focusout event.
   */
  static updatePDOMFocusFromEvent(displays, event, focus) {
    assert && assert(document.activeElement, 'Must be called from focusin, therefore active elemetn expected');
    if (focus) {
      // Look for the scenery target under the PDOM
      for (let i = 0; i < displays.length; i++) {
        const display = displays[i];
        const activeElement = document.activeElement;
        if (display.isElementUnderPDOM(activeElement, false)) {
          const uniqueId = activeElement.getAttribute(PDOMUtils.DATA_PDOM_UNIQUE_ID);
          assert && assert(uniqueId, 'Event target must have a unique ID on its data if it is in the PDOM.');
          const trail = PDOMInstance.uniqueIdToTrail(display, uniqueId);
          assert && assert(trail, 'We must have a trail since the target was under the PDOM.');
          const visualTrail = PDOMInstance.guessVisualTrail(trail, display.rootNode);
          if (visualTrail.lastNode().focusable) {
            FocusManager.pdomFocus = new Focus(display, visualTrail);
          } else {
            // It is possible that `blur` or `focusout` listeners have removed the element from the traversal order
            // before we receive the `focus` event. In that case, the browser will still try to put focus on the element
            // even though the PDOM element and Node are not in the traversal order. It is more consistent to remove
            // focus in this case.
            event.target.blur();

            // do not allow any more focus listeners to dispatch, this target should never have been focused in the
            // first place, but the browser did it anyway
            event.stopImmediatePropagation();
          }

          // no need to keep searching
          break;
        }
      }
    } else {
      for (let i = 0; i < displays.length; i++) {
        const display = displays[i];

        // will be null if it is not in the PDOM or if it is undefined
        const relatedTargetTrail = display._input.getRelatedTargetTrail(event);
        if (relatedTargetTrail && relatedTargetTrail.lastNode().focusable) {
          FocusManager.pdomFocus = new Focus(display, PDOMInstance.guessVisualTrail(relatedTargetTrail, display.rootNode));
        } else {
          // Don't set this before the related target case because we want to support Node.blur listeners overwriting
          // the relatedTarget behavior.
          FocusManager.pdomFocus = null;
        }
      }
    }
  }

  // Listener to update the "active" highlight state for an interactiveHighlightingNode
  onPointerFocusChange(pointerFocus, oldFocus) {
    const focusNode = pointerFocus?.trail.lastNode();
    focusNode && focusNode.isInteractiveHighlighting && focusNode.handleHighlightActiveChange();
    const oldFocusNode = oldFocus?.trail.lastNode();
    oldFocusNode && oldFocusNode.isInteractiveHighlighting && oldFocusNode.handleHighlightActiveChange();
  }

  /**
   * Set the DOM focus. A DOM limitation is that there can only be one element with focus at a time so this must
   * be a static for the FocusManager.
   */
  static set pdomFocus(value) {
    if (FocusManager.pdomFocusProperty.value !== value) {
      let previousFocus;
      if (FocusManager.pdomFocusProperty.value) {
        previousFocus = FocusManager.pdomFocusedNode;
      }
      FocusManager.pdomFocusProperty.value = value;

      // if set to null, make sure that the active element is no longer focused
      if (previousFocus && !value) {
        previousFocus.blur();
      }
    }
  }

  /**
   * Get the Focus pointing to the Node whose Parallel DOM element has DOM focus.
   */
  static get pdomFocus() {
    return FocusManager.pdomFocusProperty.value;
  }

  /**
   * Get the Node that currently has DOM focus, the leaf-most Node of the Focus Trail. Null if no
   * Node has focus.
   */
  static getPDOMFocusedNode() {
    let focusedNode = null;
    const focus = FocusManager.pdomFocusProperty.get();
    if (focus) {
      focusedNode = focus.trail.lastNode();
    }
    return focusedNode;
  }
  static get pdomFocusedNode() {
    return this.getPDOMFocusedNode();
  }

  // Display has an axon `Property to indicate which component is focused (or null if no
  // scenery Node has focus). By passing the tandem and phetioTye, PhET-iO is able to interoperate (save, restore,
  // control, observe what is currently focused). See FocusManager.pdomFocus for setting the focus. Don't set the value
  // of this Property directly.
  static pdomFocusProperty = new Property(null, {
    tandem: Tandem.GENERAL_MODEL.createTandem('pdomFocusProperty'),
    phetioDocumentation: 'Stores the current focus in the Parallel DOM, null if nothing has focus. This is not updated ' + 'based on mouse or touch input, only keyboard and other alternative inputs. Note that this only ' + 'applies to simulations that support alternative input.',
    phetioValueType: NullableIO(Focus.FocusIO),
    phetioState: false,
    phetioFeatured: true,
    phetioReadOnly: true
  });

  /**
   * A Property that lets you know when the window has focus. When the window has focus, it is in the user's foreground.
   * When in the background, the window does not receive keyboard input (important for global keyboard events).
   */
  static _windowHasFocusProperty = new BooleanProperty(false);
  static windowHasFocusProperty = FocusManager._windowHasFocusProperty;

  /**
   * Updates the _windowHasFocusProperty when the window receives/loses focus. When the window has focus
   * it is in the foreground of the user. When in the background, the window will not receive keyboard input.
   * https://developer.mozilla.org/en-US/docs/Web/API/Window/focus_event.
   *
   * This will be called by scenery for you when you use Display.initializeEvents().
   */
  static attachToWindow() {
    assert && assert(!FocusManager.globallyAttached, 'Can only be attached statically once.');
    FocusManager.attachedWindowFocusListener = () => {
      FocusManager._windowHasFocusProperty.value = true;
    };
    FocusManager.attachedWindowBlurListener = () => {
      FocusManager._windowHasFocusProperty.value = false;
    };
    window.addEventListener('focus', FocusManager.attachedWindowFocusListener);
    window.addEventListener('blur', FocusManager.attachedWindowBlurListener);

    // value will be updated with window, but we need a proper initial value (this function may be called while
    // the window is not in the foreground).
    FocusManager._windowHasFocusProperty.value = document.hasFocus();
    FocusManager.globallyAttached = true;
  }

  /**
   * Detach all window focus/blur listeners from FocusManager watching for when the window loses focus.
   */
  static detachFromWindow() {
    window.removeEventListener('focus', FocusManager.attachedWindowFocusListener);
    window.removeEventListener('blur', FocusManager.attachedWindowBlurListener);

    // For cleanup, this Property becomes false again when detaching because we will no longer be watching for changes.
    FocusManager._windowHasFocusProperty.value = false;
    FocusManager.globallyAttached = false;
  }
}
scenery.register('FocusManager', FocusManager);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJEZXJpdmVkUHJvcGVydHkiLCJQcm9wZXJ0eSIsIlRhbmRlbSIsIk51bGxhYmxlSU8iLCJGb2N1cyIsIkZvY3VzRGlzcGxheWVkQ29udHJvbGxlciIsIlBET01JbnN0YW5jZSIsIlBET01VdGlscyIsIlJlYWRpbmdCbG9ja1V0dGVyYW5jZSIsInNjZW5lcnkiLCJ2b2ljaW5nTWFuYWdlciIsIkZvY3VzTWFuYWdlciIsImF0dGFjaGVkV2luZG93Rm9jdXNMaXN0ZW5lciIsImF0dGFjaGVkV2luZG93Qmx1ckxpc3RlbmVyIiwiZ2xvYmFsbHlBdHRhY2hlZCIsImNvbnN0cnVjdG9yIiwicG9pbnRlckZvY3VzUHJvcGVydHkiLCJyZWFkaW5nQmxvY2tGb2N1c1Byb3BlcnR5IiwibG9ja2VkUG9pbnRlckZvY3VzUHJvcGVydHkiLCJwZG9tRm9jdXNIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5IiwiaW50ZXJhY3RpdmVIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5IiwicmVhZGluZ0Jsb2NrSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eSIsInZvaWNpbmdGdWxseUVuYWJsZWRMaXN0ZW5lciIsImVuYWJsZWQiLCJ2YWx1ZSIsInZvaWNpbmdGdWxseUVuYWJsZWRQcm9wZXJ0eSIsImxpbmsiLCJwb2ludGVySGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eSIsImludGVyYWN0aXZlSGlnaGxpZ2h0c1Zpc2libGUiLCJ2b2ljaW5nRW5hYmxlZCIsInJlYWRpbmdCbG9ja0ZvY3VzQ29udHJvbGxlciIsInN0YXJ0U3BlYWtpbmdMaXN0ZW5lciIsInRleHQiLCJ1dHRlcmFuY2UiLCJyZWFkaW5nQmxvY2tGb2N1cyIsInN0YXJ0U3BlYWtpbmdFbWl0dGVyIiwiYWRkTGlzdGVuZXIiLCJlbmRTcGVha2luZ0xpc3RlbmVyIiwiYXNzZXJ0IiwidHJhaWwiLCJlcXVhbHMiLCJlbmRTcGVha2luZ0VtaXR0ZXIiLCJwb2ludGVyRm9jdXNEaXNwbGF5ZWRDb250cm9sbGVyIiwibG9ja2VkUG9pbnRlckZvY3VzRGlzcGxheWVkQ29udHJvbGxlciIsImZvckVhY2giLCJwcm9wZXJ0eSIsIm9uUG9pbnRlckZvY3VzQ2hhbmdlIiwiYmluZCIsImRpc3Bvc2UiLCJyZW1vdmVMaXN0ZW5lciIsInVubGluayIsInVwZGF0ZVBET01Gb2N1c0Zyb21FdmVudCIsImRpc3BsYXlzIiwiZXZlbnQiLCJmb2N1cyIsImRvY3VtZW50IiwiYWN0aXZlRWxlbWVudCIsImkiLCJsZW5ndGgiLCJkaXNwbGF5IiwiaXNFbGVtZW50VW5kZXJQRE9NIiwidW5pcXVlSWQiLCJnZXRBdHRyaWJ1dGUiLCJEQVRBX1BET01fVU5JUVVFX0lEIiwidW5pcXVlSWRUb1RyYWlsIiwidmlzdWFsVHJhaWwiLCJndWVzc1Zpc3VhbFRyYWlsIiwicm9vdE5vZGUiLCJsYXN0Tm9kZSIsImZvY3VzYWJsZSIsInBkb21Gb2N1cyIsInRhcmdldCIsImJsdXIiLCJzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24iLCJyZWxhdGVkVGFyZ2V0VHJhaWwiLCJfaW5wdXQiLCJnZXRSZWxhdGVkVGFyZ2V0VHJhaWwiLCJwb2ludGVyRm9jdXMiLCJvbGRGb2N1cyIsImZvY3VzTm9kZSIsImlzSW50ZXJhY3RpdmVIaWdobGlnaHRpbmciLCJoYW5kbGVIaWdobGlnaHRBY3RpdmVDaGFuZ2UiLCJvbGRGb2N1c05vZGUiLCJwZG9tRm9jdXNQcm9wZXJ0eSIsInByZXZpb3VzRm9jdXMiLCJwZG9tRm9jdXNlZE5vZGUiLCJnZXRQRE9NRm9jdXNlZE5vZGUiLCJmb2N1c2VkTm9kZSIsImdldCIsInRhbmRlbSIsIkdFTkVSQUxfTU9ERUwiLCJjcmVhdGVUYW5kZW0iLCJwaGV0aW9Eb2N1bWVudGF0aW9uIiwicGhldGlvVmFsdWVUeXBlIiwiRm9jdXNJTyIsInBoZXRpb1N0YXRlIiwicGhldGlvRmVhdHVyZWQiLCJwaGV0aW9SZWFkT25seSIsIl93aW5kb3dIYXNGb2N1c1Byb3BlcnR5Iiwid2luZG93SGFzRm9jdXNQcm9wZXJ0eSIsImF0dGFjaFRvV2luZG93Iiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsImhhc0ZvY3VzIiwiZGV0YWNoRnJvbVdpbmRvdyIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkZvY3VzTWFuYWdlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMS0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBNYW5hZ2VzIHRoZSBQcm9wZXJ0aWVzIHdoaWNoIHNpZ25pZnkgYW5kIGNvbnRyb2wgd2hlcmUgdmFyaW91cyBmb3JtcyBvZiBmb2N1cyBhcmUuIEEgRm9jdXNcclxuICoganVzdCBjb250YWlucyB0aGUgVHJhaWwgcG9pbnRpbmcgdG8gdGhlIE5vZGUgd2l0aCBmb2N1cyBhbmQgYSBEaXNwbGF5IHdob3NlIHJvb3QgaXMgYXQgdGhlXHJcbiAqIHJvb3Qgb2YgdGhhdCBUcmFpbC4gU28gaXQgY2FuIGJlIHVzZWQgZm9yIG1vcmUgdGhhbiBqdXN0IERPTSBmb2N1cy4gQXQgdGhlIHRpbWUgb2YgdGhpcyB3cml0aW5nLFxyXG4gKiB0aGUgZm9ybXMgb2YgRm9jdXMgaW5jbHVkZVxyXG4gKlxyXG4gKiAgLSBET00gRm9jdXMgLSBUaGUgRm9jdXMgVHJhaWwgcG9pbnRzIHRvIHRoZSBOb2RlIHdob3NlIGVsZW1lbnQgaGFzIERPTSBmb2N1cyBpbiB0aGUgUGFyYWxsZWwgRE9NLlxyXG4gKiAgICAgICAgICAgICAgICBPbmx5IG9uZSBlbGVtZW50IGNhbiBoYXZlIGZvY3VzIGF0IGEgdGltZSAoRE9NIGxpbWl0YXRpb24pIHNvIHRoaXMgaXMgbWFuYWdlZCBieSBhIHN0YXRpYyBvblxyXG4gKiAgICAgICAgICAgICAgICBGb2N1c01hbmFnZXIuXHJcbiAqICAtIFBvaW50ZXIgRm9jdXMgLSBUaGUgRm9jdXMgdHJhaWwgcG9pbnRzIHRvIGEgTm9kZSB0aGF0IHN1cHBvcnRzIEhpZ2hsaWdodGluZyB3aXRoIHBvaW50ZXIgZXZlbnRzLlxyXG4gKiAgLSBSZWFkaW5nIEJsb2NrIEZvY3VzIC0gVGhlIEZvY3VzIFRyYWlsIHBvaW50cyB0byBhIE5vZGUgdGhhdCBzdXBwb3J0cyBSZWFkaW5nQmxvY2tzLCBhbmQgaXMgYWN0aXZlXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSB0aGUgUmVhZGluZ0Jsb2NrIGNvbnRlbnQgaXMgYmVpbmcgc3Bva2VuIGZvciBWb2ljaW5nLiBTZWUgUmVhZGluZ0Jsb2NrLnRzXHJcbiAqXHJcbiAqIFRoZXJlIG1heSBiZSBvdGhlciBmb3JtcyBvZiBGb2N1cyBpbiB0aGUgZnV0dXJlLlxyXG4gKlxyXG4gKiBUaGlzIGNsYXNzIGFsc28gY29udHJvbHMgc2V0dGluZyBhbmQgY2xlYXJpbmcgb2Ygc2V2ZXJhbCAoYnV0IG5vdCBhbGwpIG9mIHRoZXNlIFByb3BlcnRpZXMuIEl0IGRvZXMgbm90IHNldCB0aGVcclxuICogcGRvbUZvY3VzUHJvcGVydHkgYmVjYXVzZSB0aGF0IFByb3BlcnR5IGlzIHNldCBvbmx5IHdoZW4gdGhlIGJyb3dzZXIncyBmb2N1cyBjaGFuZ2VzLiBTb21lIG9mIHRoZSBmb2N1c1xyXG4gKiBQcm9wZXJ0aWVzIGFyZSBzZXQgaW4gZmVhdHVyZSB0cmFpdHMsIHN1Y2ggYXMgcG9pbnRlckZvY3VzUHJvcGVydHkgd2hpY2ggaXMgc2V0IGJ5IEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nIGJlY2F1c2UgaXQgaXNcclxuICogc2V0IHRocm91Z2ggbGlzdGVuZXJzIG9uIGVhY2ggaW5kaXZpZHVhbCBOb2RlLlxyXG4gKlxyXG4gKiBUaGlzIGNsYXNzIGFsc28gaGFzIGEgZmV3IFByb3BlcnRpZXMgdGhhdCBjb250cm9sIHRoZSBiZWhhdmlvciBvZiB0aGUgRGlzcGxheSdzIEhpZ2hsaWdodE92ZXJsYXkuXHJcbiAqXHJcbiAqIEBhdXRob3IgSmVzc2UgR3JlZW5iZXJnIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBCb29sZWFuUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9Cb29sZWFuUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgRGVyaXZlZFByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvRGVyaXZlZFByb3BlcnR5LmpzJztcclxuaW1wb3J0IFRQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUUmVhZE9ubHlQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IFByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgTnVsbGFibGVJTyBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvdHlwZXMvTnVsbGFibGVJTy5qcyc7XHJcbmltcG9ydCBVdHRlcmFuY2UgZnJvbSAnLi4vLi4vLi4vdXR0ZXJhbmNlLXF1ZXVlL2pzL1V0dGVyYW5jZS5qcyc7XHJcbmltcG9ydCB7IERpc3BsYXksIEZvY3VzLCBGb2N1c0Rpc3BsYXllZENvbnRyb2xsZXIsIE5vZGUsIFBET01JbnN0YW5jZSwgUERPTVV0aWxzLCBSZWFkaW5nQmxvY2tVdHRlcmFuY2UsIHNjZW5lcnksIHZvaWNpbmdNYW5hZ2VyIH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcbmltcG9ydCB7IEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nTm9kZSB9IGZyb20gJy4vdm9pY2luZy9JbnRlcmFjdGl2ZUhpZ2hsaWdodGluZy5qcyc7XHJcblxyXG50eXBlIFNwZWFraW5nTGlzdGVuZXIgPSAoIHRleHQ6IHN0cmluZywgdXR0ZXJhbmNlOiBVdHRlcmFuY2UgKSA9PiB2b2lkO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRm9jdXNNYW5hZ2VyIHtcclxuXHJcbiAgLy8gVGhpcyBQcm9wZXJ0eSB3aG9zZSBGb2N1cyBUcmFpbCBwb2ludHMgdG8gdGhlIE5vZGUgdW5kZXIgdGhlIHBvaW50ZXIgdG9cclxuICAvLyBzdXBwb3J0IGZlYXR1cmVzIG9mIFZvaWNpbmcgYW5kIEludGVyYWN0aXZlIEhpZ2hsaWdodHMuIE5vZGVzIHRoYXQgY29tcG9zZSBJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZyBjYW5cclxuICAvLyByZWNlaXZlIHRoaXMgRm9jdXMgYW5kIGEgaGlnaGxpZ2h0IG1heSBhcHBlYXIgYXJvdW5kIGl0LlxyXG4gIHB1YmxpYyByZWFkb25seSBwb2ludGVyRm9jdXNQcm9wZXJ0eTogVFByb3BlcnR5PEZvY3VzIHwgbnVsbD47XHJcblxyXG4gIC8vIFRoZSBQcm9wZXJ0eSB0aGF0IGluZGljYXRlcyB3aGljaCBOb2RlIHRoYXQgdXNlcyBSZWFkaW5nQmxvY2sgaXMgY3VycmVudGx5XHJcbiAgLy8gYWN0aXZlLiBVc2VkIGJ5IHRoZSBIaWdobGlnaHRPdmVybGF5IHRvIGhpZ2hsaWdodCBSZWFkaW5nQmxvY2sgTm9kZXMgd2hvc2UgY29udGVudCBpcyBiZWluZyBzcG9rZW4uXHJcbiAgcHVibGljIHJlYWRvbmx5IHJlYWRpbmdCbG9ja0ZvY3VzUHJvcGVydHk6IFRQcm9wZXJ0eTxGb2N1cyB8IG51bGw+O1xyXG5cclxuICAvLyBBIFByb3BlcnR5IHdob3NlIHZhbHVlIGlzIGVpdGhlciBudWxsIG9yIGEgRm9jdXMgd2l0aCBUcmFpbCBhbmQgRGlzcGxheSBlcXVhbFxyXG4gIC8vIHRvIHRoZSBwb2ludGVyRm9jdXNQcm9wZXJ0eS4gV2hlbiB0aGlzIFByb3BlcnR5IGhhcyBhIHZhbHVlLCB0aGUgSGlnaGxpZ2h0T3ZlcmxheSB3aWxsIHdhaXQgdG8gdXBkYXRlIHRoZVxyXG4gIC8vIGhpZ2hsaWdodCBmb3IgdGhlIHBvaW50ZXJGb2N1c1Byb3BlcnR5LiBUaGlzIGlzIHVzZWZ1bCB3aGVuIHRoZSBwb2ludGVyIGhhcyBiZWd1biB0byBpbnRlcmFjdCB3aXRoIGEgTm9kZVxyXG4gIC8vIHRoYXQgdXNlcyBJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZywgYnV0IHRoZSBtb3VzZSBoYXMgbW92ZWQgb3V0IG9mIGl0IG9yIG92ZXIgYW5vdGhlciBkdXJpbmcgaW50ZXJhY3Rpb24uIFRoZVxyXG4gIC8vIGhpZ2hsaWdodCBzaG91bGQgcmVtYWluIG9uIHRoZSBOb2RlIHJlY2VpdmluZyBpbnRlcmFjdGlvbiBhbmQgd2FpdCB0byB1cGRhdGUgdW50aWwgaW50ZXJhY3Rpb24gY29tcGxldGVzLlxyXG4gIHB1YmxpYyByZWFkb25seSBsb2NrZWRQb2ludGVyRm9jdXNQcm9wZXJ0eTogVFByb3BlcnR5PEZvY3VzIHwgbnVsbD47XHJcblxyXG4gIC8vIENvbnRyb2xzIHdoZXRoZXIgb3Igbm90IGhpZ2hsaWdodHMgcmVsYXRlZCB0byBQRE9NIGZvY3VzIGFyZSB2aXNpYmxlLlxyXG4gIHB1YmxpYyByZWFkb25seSBwZG9tRm9jdXNIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5OiBUUHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8vIENvbnRyb2xzIHdoZXRoZXIgXCJJbnRlcmFjdGl2ZSBIaWdobGlnaHRzXCIgYXJlIHZpc2libGUuXHJcbiAgcHVibGljIHJlYWRvbmx5IGludGVyYWN0aXZlSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eTogVFByb3BlcnR5PGJvb2xlYW4+O1xyXG5cclxuICAvLyBDb250cm9scyB3aGV0aGVyIFwiUmVhZGluZyBCbG9ja1wiIGhpZ2hsaWdodHMgd2lsbCBiZSB2aXNpYmxlIGFyb3VuZCBOb2Rlc1xyXG4gIC8vIHRoYXQgdXNlIFJlYWRpbmdCbG9jay5cclxuICBwdWJsaWMgcmVhZG9ubHkgcmVhZGluZ0Jsb2NrSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eTogVFByb3BlcnR5PGJvb2xlYW4+O1xyXG5cclxuICAvLyBJbmRpY2F0ZXMgd2hldGhlciBhbnkgaGlnaGxpZ2h0cyBzaG91bGQgYXBwZWFyIGZyb20gcG9pbnRlclxyXG4gIC8vIGlucHV0IChtb3VzZS90b3VjaCkuIElmIGZhbHNlLCB3ZSB3aWxsIHRyeSB0byBhdm9pZCBkb2luZyBleHBlbnNpdmUgd29yayBpbiBQb2ludGVySGlnaGxpZ2h0aW5nLmpzLlxyXG4gIHB1YmxpYyByZWFkb25seSBwb2ludGVySGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8vIFdoZW5ldmVyIHRoZSByZWFkaW5nQmxvY2tGb2N1c1Byb3BlcnR5J3MgRm9jdXNlZCBOb2RlIGlzIHJlbW92ZWQgZnJvbVxyXG4gIC8vIHRoZSBzY2VuZSBncmFwaCBvciBpdHMgVHJhaWwgYmVjb21lcyBpbnZpc2libGUgdGhpcyByZW1vdmVzIGZvY3VzLlxyXG4gIHByaXZhdGUgcmVhZG9ubHkgcmVhZGluZ0Jsb2NrRm9jdXNDb250cm9sbGVyOiBGb2N1c0Rpc3BsYXllZENvbnRyb2xsZXI7XHJcblxyXG4gIC8vIFdoZW4gdGhlIGxvY2tlZFBvaW50ZXJGb2N1c1Byb3BlcnR5J3MgTm9kZSBiZWNvbWVzIGludmlzaWJsZSBvciBpcyByZW1vdmVkIGZyb20gdGhlIHNjZW5lXHJcbiAgLy8gZ3JhcGgsIHRoZSBsb2NrZWQgcG9pbnRlciBmb2N1cyBpcyBjbGVhcmVkLlxyXG4gIHByaXZhdGUgcmVhZG9ubHkgbG9ja2VkUG9pbnRlckZvY3VzRGlzcGxheWVkQ29udHJvbGxlcjogRm9jdXNEaXNwbGF5ZWRDb250cm9sbGVyO1xyXG5cclxuICAvLyBJZiB0aGUgdm9pY2luZ01hbmFnZXIgc3RhcnRzIHNwZWFraW5nIGFuIFV0dGVyYW5jZSBmb3IgYSBSZWFkaW5nQkxvY2ssIHNldCB0aGUgcmVhZGluZ0Jsb2NrRm9jdXNQcm9wZXJ0eSBhbmRcclxuICAvLyBhZGQgbGlzdGVuZXJzIHRvIGNsZWFyIGl0IHdoZW4gdGhlIE5vZGUgaXMgcmVtb3ZlZCBvciBiZWNvbWVzIGludmlzaWJsZVxyXG4gIHByaXZhdGUgcmVhZG9ubHkgc3RhcnRTcGVha2luZ0xpc3RlbmVyOiBTcGVha2luZ0xpc3RlbmVyO1xyXG5cclxuICAvLyBXaGVuZXZlciB0aGUgdm9pY2luZ01hbmFnZXIgc3RvcHMgc3BlYWtpbmcgYW4gdXR0ZXJhbmNlIGZvciB0aGUgUmVhZGluZ0Jsb2NrIHRoYXQgaGFzIGZvY3VzLCBjbGVhciBpdFxyXG4gIHByaXZhdGUgcmVhZG9ubHkgZW5kU3BlYWtpbmdMaXN0ZW5lcjogU3BlYWtpbmdMaXN0ZW5lcjtcclxuICBwcml2YXRlIHJlYWRvbmx5IHBvaW50ZXJGb2N1c0Rpc3BsYXllZENvbnRyb2xsZXI6IEZvY3VzRGlzcGxheWVkQ29udHJvbGxlcjtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSB2b2ljaW5nRnVsbHlFbmFibGVkTGlzdGVuZXI6ICggZW5hYmxlZDogYm9vbGVhbiApID0+IHZvaWQ7XHJcblxyXG4gIC8vIFJlZmVyZW5jZXMgdG8gdGhlIHdpbmRvdyBsaXN0ZW5lcnMgdGhhdCB1cGRhdGUgd2hlbiB0aGUgd2luZG93IGhhcyBmb2N1cy4gU28gdGhleSBjYW4gYmUgcmVtb3ZlZCBpZiBuZWVkZWQuXHJcbiAgcHJpdmF0ZSBzdGF0aWMgYXR0YWNoZWRXaW5kb3dGb2N1c0xpc3RlbmVyOiBudWxsIHwgKCAoKSA9PiB2b2lkICkgPSBudWxsO1xyXG4gIHByaXZhdGUgc3RhdGljIGF0dGFjaGVkV2luZG93Qmx1ckxpc3RlbmVyOiBudWxsIHwgKCAoKSA9PiB2b2lkICkgPSBudWxsO1xyXG4gIHByaXZhdGUgc3RhdGljIGdsb2JhbGx5QXR0YWNoZWQgPSBmYWxzZTtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgdGhpcy5wb2ludGVyRm9jdXNQcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSggbnVsbCApO1xyXG4gICAgdGhpcy5yZWFkaW5nQmxvY2tGb2N1c1Byb3BlcnR5ID0gbmV3IFByb3BlcnR5KCBudWxsICk7XHJcbiAgICB0aGlzLmxvY2tlZFBvaW50ZXJGb2N1c1Byb3BlcnR5ID0gbmV3IFByb3BlcnR5KCBudWxsICk7XHJcbiAgICB0aGlzLnBkb21Gb2N1c0hpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCB0cnVlICk7XHJcbiAgICB0aGlzLmludGVyYWN0aXZlSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIGZhbHNlICk7XHJcbiAgICB0aGlzLnJlYWRpbmdCbG9ja0hpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCBmYWxzZSApO1xyXG5cclxuICAgIC8vIFRPRE86IHBlcmhhcHMgcmVtb3ZlIG9uY2UgcmVhZGluZyBibG9ja3MgYXJlIHNldCB1cCB0byBsaXN0ZW4gaW5zdGVhZCB0byBOb2RlLmNhblNwZWFrUHJvcGVydHkgKHZvaWNpbmdWaXNpYmxlKSwgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzEzNDNcclxuICAgIHRoaXMudm9pY2luZ0Z1bGx5RW5hYmxlZExpc3RlbmVyID0gZW5hYmxlZCA9PiB7XHJcbiAgICAgIHRoaXMucmVhZGluZ0Jsb2NrSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eS52YWx1ZSA9IGVuYWJsZWQ7XHJcbiAgICB9O1xyXG4gICAgdm9pY2luZ01hbmFnZXIudm9pY2luZ0Z1bGx5RW5hYmxlZFByb3BlcnR5LmxpbmsoIHRoaXMudm9pY2luZ0Z1bGx5RW5hYmxlZExpc3RlbmVyICk7XHJcblxyXG4gICAgdGhpcy5wb2ludGVySGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eSA9IG5ldyBEZXJpdmVkUHJvcGVydHkoXHJcbiAgICAgIFsgdGhpcy5pbnRlcmFjdGl2ZUhpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHksIHRoaXMucmVhZGluZ0Jsb2NrSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eSBdLFxyXG4gICAgICAoIGludGVyYWN0aXZlSGlnaGxpZ2h0c1Zpc2libGUsIHZvaWNpbmdFbmFibGVkICkgPT4ge1xyXG4gICAgICAgIHJldHVybiBpbnRlcmFjdGl2ZUhpZ2hsaWdodHNWaXNpYmxlIHx8IHZvaWNpbmdFbmFibGVkO1xyXG4gICAgICB9ICk7XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gVGhlIGZvbGxvd2luZyBzZWN0aW9uIG1hbmFnZXMgY29udHJvbCBvZiBSZWFkaW5nQmxvY2tGb2N1c1Byb3BlcnR5LiBJdCB0YWtlcyBhIHZhbHVlIHdoZW5ldmVyIHRoZVxyXG4gICAgLy8gdm9pY2luZ01hbmFnZXIgc3RhcnRzIHNwZWFraW5nIGFuZCB0aGUgdmFsdWUgaXMgY2xlYXJlZCB3aGVuIGl0IHN0b3BzIHNwZWFraW5nLiBGb2N1cyBpcyBhbHNvIGNsZWFyZWRcclxuICAgIC8vIGJ5IHRoZSBGb2N1c0Rpc3BsYXllZENvbnRyb2xsZXIuXHJcblxyXG4gICAgdGhpcy5yZWFkaW5nQmxvY2tGb2N1c0NvbnRyb2xsZXIgPSBuZXcgRm9jdXNEaXNwbGF5ZWRDb250cm9sbGVyKCB0aGlzLnJlYWRpbmdCbG9ja0ZvY3VzUHJvcGVydHkgKTtcclxuXHJcbiAgICB0aGlzLnN0YXJ0U3BlYWtpbmdMaXN0ZW5lciA9ICggdGV4dCwgdXR0ZXJhbmNlICkgPT4ge1xyXG4gICAgICB0aGlzLnJlYWRpbmdCbG9ja0ZvY3VzUHJvcGVydHkudmFsdWUgPSB1dHRlcmFuY2UgaW5zdGFuY2VvZiBSZWFkaW5nQmxvY2tVdHRlcmFuY2UgPyB1dHRlcmFuY2UucmVhZGluZ0Jsb2NrRm9jdXMgOiBudWxsO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICB2b2ljaW5nTWFuYWdlci5zdGFydFNwZWFraW5nRW1pdHRlci5hZGRMaXN0ZW5lciggdGhpcy5zdGFydFNwZWFraW5nTGlzdGVuZXIgKTtcclxuXHJcbiAgICB0aGlzLmVuZFNwZWFraW5nTGlzdGVuZXIgPSAoIHRleHQsIHV0dGVyYW5jZSApID0+IHtcclxuICAgICAgaWYgKCB1dHRlcmFuY2UgaW5zdGFuY2VvZiBSZWFkaW5nQmxvY2tVdHRlcmFuY2UgJiYgdGhpcy5yZWFkaW5nQmxvY2tGb2N1c1Byb3BlcnR5LnZhbHVlICkge1xyXG5cclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB1dHRlcmFuY2UucmVhZGluZ0Jsb2NrRm9jdXMsICdzaG91bGQgYmUgbm9uIG51bGwgZm9jdXMnICk7XHJcblxyXG4gICAgICAgIC8vIG9ubHkgY2xlYXIgdGhlIHJlYWRpbmdCbG9ja0ZvY3VzUHJvcGVydHkgaWYgdGhlIFJlYWRpbmdCbG9ja1V0dGVyYW5jZSBoYXMgYSBGb2N1cyB0aGF0IG1hdGNoZXMgdGhlXHJcbiAgICAgICAgLy8gY3VycmVudCB2YWx1ZSBmb3IgcmVhZGluZ0Jsb2NrRm9jdXNQcm9wZXJ0eSBzbyB0aGF0IHRoZSBoaWdobGlnaHQgZG9lc24ndCBkaXNhcHBlYXIgZXZlcnkgdGltZVxyXG4gICAgICAgIC8vIHRoZSBzcGVha2VyIHN0b3BzIHRhbGtpbmdcclxuICAgICAgICBpZiAoIHV0dGVyYW5jZS5yZWFkaW5nQmxvY2tGb2N1cyEudHJhaWwuZXF1YWxzKCB0aGlzLnJlYWRpbmdCbG9ja0ZvY3VzUHJvcGVydHkudmFsdWUudHJhaWwgKSApIHtcclxuICAgICAgICAgIHRoaXMucmVhZGluZ0Jsb2NrRm9jdXNQcm9wZXJ0eS52YWx1ZSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgIHZvaWNpbmdNYW5hZ2VyLmVuZFNwZWFraW5nRW1pdHRlci5hZGRMaXN0ZW5lciggdGhpcy5lbmRTcGVha2luZ0xpc3RlbmVyICk7XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gVGhlIGZvbGxvd2luZyBzZWN0aW9uIG1hbmFnZXMgY29udHJvbCBvZiBwb2ludGVyRm9jdXNQcm9wZXJ0eSAtIHBvaW50ZXJGb2N1c1Byb3BlcnR5IGlzIHNldCB3aXRoIGEgRm9jdXNcclxuICAgIC8vIGJ5IEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nIGZyb20gbGlzdGVuZXJzIG9uIE5vZGVzIHRoYXQgdXNlIHRoYXQgVHJhaXQuIEJ1dCBpdCB1c2VzIGEgRm9jdXNEaXNwbGF5ZWRDb250cm9sbGVyXHJcbiAgICAvLyB0byByZW1vdmUgdGhlIGZvY3VzIGF0IHRoZSByaWdodCB0aW1lLlxyXG4gICAgdGhpcy5wb2ludGVyRm9jdXNEaXNwbGF5ZWRDb250cm9sbGVyID0gbmV3IEZvY3VzRGlzcGxheWVkQ29udHJvbGxlciggdGhpcy5wb2ludGVyRm9jdXNQcm9wZXJ0eSApO1xyXG4gICAgdGhpcy5sb2NrZWRQb2ludGVyRm9jdXNEaXNwbGF5ZWRDb250cm9sbGVyID0gbmV3IEZvY3VzRGlzcGxheWVkQ29udHJvbGxlciggdGhpcy5sb2NrZWRQb2ludGVyRm9jdXNQcm9wZXJ0eSApO1xyXG5cclxuICAgIFtcclxuICAgICAgdGhpcy5wb2ludGVyRm9jdXNQcm9wZXJ0eSxcclxuICAgICAgdGhpcy5sb2NrZWRQb2ludGVyRm9jdXNQcm9wZXJ0eVxyXG4gICAgXS5mb3JFYWNoKCBwcm9wZXJ0eSA9PiB7XHJcbiAgICAgIHByb3BlcnR5LmxpbmsoIHRoaXMub25Qb2ludGVyRm9jdXNDaGFuZ2UuYmluZCggdGhpcyApICk7XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMucG9pbnRlckZvY3VzUHJvcGVydHkuZGlzcG9zZSgpO1xyXG4gICAgdGhpcy5yZWFkaW5nQmxvY2tGb2N1c1Byb3BlcnR5LmRpc3Bvc2UoKTtcclxuICAgIHRoaXMubG9ja2VkUG9pbnRlckZvY3VzUHJvcGVydHkuZGlzcG9zZSgpO1xyXG4gICAgdGhpcy5wZG9tRm9jdXNIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5LmRpc3Bvc2UoKTtcclxuICAgIHRoaXMuaW50ZXJhY3RpdmVIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5LmRpc3Bvc2UoKTtcclxuICAgIHRoaXMucmVhZGluZ0Jsb2NrSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICB0aGlzLnJlYWRpbmdCbG9ja0ZvY3VzQ29udHJvbGxlci5kaXNwb3NlKCk7XHJcbiAgICB0aGlzLnBvaW50ZXJGb2N1c0Rpc3BsYXllZENvbnRyb2xsZXIuZGlzcG9zZSgpO1xyXG4gICAgdGhpcy5wb2ludGVySGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICB0aGlzLmxvY2tlZFBvaW50ZXJGb2N1c0Rpc3BsYXllZENvbnRyb2xsZXIuZGlzcG9zZSgpO1xyXG5cclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgIHZvaWNpbmdNYW5hZ2VyLnN0YXJ0U3BlYWtpbmdFbWl0dGVyLnJlbW92ZUxpc3RlbmVyKCB0aGlzLnN0YXJ0U3BlYWtpbmdMaXN0ZW5lciApO1xyXG5cclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgIHZvaWNpbmdNYW5hZ2VyLmVuZFNwZWFraW5nRW1pdHRlci5yZW1vdmVMaXN0ZW5lciggdGhpcy5lbmRTcGVha2luZ0xpc3RlbmVyICk7XHJcblxyXG4gICAgdm9pY2luZ01hbmFnZXIudm9pY2luZ0Z1bGx5RW5hYmxlZFByb3BlcnR5LnVubGluayggdGhpcy52b2ljaW5nRnVsbHlFbmFibGVkTGlzdGVuZXIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwZGF0ZSB0aGUgcGRvbUZvY3VzIGZyb20gYSBmb2N1c2luL2ZvY3Vzb3V0IGV2ZW50LiBTY2VuZXJ5IGV2ZW50cyBhcmUgYmF0Y2hlZCBzbyB0aGF0IHRoZXkgY2Fubm90IGJlXHJcbiAgICogcmVlbnRyYW50LiBIb3dldmVyLCB0aGF0IG1lYW5zIHRoYXQgc2NlbmVyeSBzdGF0ZSB0aGF0IG5lZWRzIHRvIGJlIHVwZGF0ZWQgc3luY2hyb25vdXNseSB3aXRoIHRoZVxyXG4gICAqIGNoYW5naW5nIERPTSBjYW5ub3QgaGFwcGVuIGluIGxpc3RlbmVycyB0aGF0IGZpcmUgZnJvbSBzY2VuZXJ5IGlucHV0LiBUaGlzIG1ldGhvZFxyXG4gICAqIGlzIG1lYW50IHRvIGJlIGNhbGxlZCBmcm9tIGZvY3VzaW4vZm9jdXNvdXQgbGlzdGVuZXJzIG9uIHRoZSB3aW5kb3cgc28gdGhhdCBUaGUgcGRvbUZvY3VzIG1hdGNoZXNcclxuICAgKiBicm93c2VyIHN0YXRlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGRpc3BsYXlzIC0gTGlzdCBvZiBhbnkgZGlzcGxheXMgdGhhdCBhcmUgYXR0YWNoZWQgdG8gQnJvd3NlckV2ZW50cy5cclxuICAgKiBAcGFyYW0gZXZlbnQgLSBUaGUgZm9jdXNpbi9mb2N1c291dCBldmVudCB0aGF0IHRyaWdnZXJlZCB0aGlzIHVwZGF0ZS5cclxuICAgKiBAcGFyYW0gZm9jdXMgLSBUcnVlIGZvciBmb2N1c2luIGV2ZW50LCBmYWxzZSBmb3IgZm9jdXNvdXQgZXZlbnQuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyB1cGRhdGVQRE9NRm9jdXNGcm9tRXZlbnQoIGRpc3BsYXlzOiBEaXNwbGF5W10sIGV2ZW50OiBGb2N1c0V2ZW50LCBmb2N1czogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQsICdNdXN0IGJlIGNhbGxlZCBmcm9tIGZvY3VzaW4sIHRoZXJlZm9yZSBhY3RpdmUgZWxlbWV0biBleHBlY3RlZCcgKTtcclxuXHJcbiAgICBpZiAoIGZvY3VzICkge1xyXG5cclxuICAgICAgLy8gTG9vayBmb3IgdGhlIHNjZW5lcnkgdGFyZ2V0IHVuZGVyIHRoZSBQRE9NXHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGRpc3BsYXlzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIGNvbnN0IGRpc3BsYXkgPSBkaXNwbGF5c1sgaSBdO1xyXG5cclxuICAgICAgICBjb25zdCBhY3RpdmVFbGVtZW50ID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudDtcclxuICAgICAgICBpZiAoIGRpc3BsYXkuaXNFbGVtZW50VW5kZXJQRE9NKCBhY3RpdmVFbGVtZW50LCBmYWxzZSApICkge1xyXG4gICAgICAgICAgY29uc3QgdW5pcXVlSWQgPSBhY3RpdmVFbGVtZW50LmdldEF0dHJpYnV0ZSggUERPTVV0aWxzLkRBVEFfUERPTV9VTklRVUVfSUQgKSE7XHJcbiAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB1bmlxdWVJZCwgJ0V2ZW50IHRhcmdldCBtdXN0IGhhdmUgYSB1bmlxdWUgSUQgb24gaXRzIGRhdGEgaWYgaXQgaXMgaW4gdGhlIFBET00uJyApO1xyXG5cclxuICAgICAgICAgIGNvbnN0IHRyYWlsID0gUERPTUluc3RhbmNlLnVuaXF1ZUlkVG9UcmFpbCggZGlzcGxheSwgdW5pcXVlSWQgKSE7XHJcbiAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0cmFpbCwgJ1dlIG11c3QgaGF2ZSBhIHRyYWlsIHNpbmNlIHRoZSB0YXJnZXQgd2FzIHVuZGVyIHRoZSBQRE9NLicgKTtcclxuXHJcbiAgICAgICAgICBjb25zdCB2aXN1YWxUcmFpbCA9IFBET01JbnN0YW5jZS5ndWVzc1Zpc3VhbFRyYWlsKCB0cmFpbCwgZGlzcGxheS5yb290Tm9kZSApO1xyXG4gICAgICAgICAgaWYgKCB2aXN1YWxUcmFpbC5sYXN0Tm9kZSgpLmZvY3VzYWJsZSApIHtcclxuICAgICAgICAgICAgRm9jdXNNYW5hZ2VyLnBkb21Gb2N1cyA9IG5ldyBGb2N1cyggZGlzcGxheSwgdmlzdWFsVHJhaWwgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgLy8gSXQgaXMgcG9zc2libGUgdGhhdCBgYmx1cmAgb3IgYGZvY3Vzb3V0YCBsaXN0ZW5lcnMgaGF2ZSByZW1vdmVkIHRoZSBlbGVtZW50IGZyb20gdGhlIHRyYXZlcnNhbCBvcmRlclxyXG4gICAgICAgICAgICAvLyBiZWZvcmUgd2UgcmVjZWl2ZSB0aGUgYGZvY3VzYCBldmVudC4gSW4gdGhhdCBjYXNlLCB0aGUgYnJvd3NlciB3aWxsIHN0aWxsIHRyeSB0byBwdXQgZm9jdXMgb24gdGhlIGVsZW1lbnRcclxuICAgICAgICAgICAgLy8gZXZlbiB0aG91Z2ggdGhlIFBET00gZWxlbWVudCBhbmQgTm9kZSBhcmUgbm90IGluIHRoZSB0cmF2ZXJzYWwgb3JkZXIuIEl0IGlzIG1vcmUgY29uc2lzdGVudCB0byByZW1vdmVcclxuICAgICAgICAgICAgLy8gZm9jdXMgaW4gdGhpcyBjYXNlLlxyXG4gICAgICAgICAgICAoIGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudCApLmJsdXIoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGRvIG5vdCBhbGxvdyBhbnkgbW9yZSBmb2N1cyBsaXN0ZW5lcnMgdG8gZGlzcGF0Y2gsIHRoaXMgdGFyZ2V0IHNob3VsZCBuZXZlciBoYXZlIGJlZW4gZm9jdXNlZCBpbiB0aGVcclxuICAgICAgICAgICAgLy8gZmlyc3QgcGxhY2UsIGJ1dCB0aGUgYnJvd3NlciBkaWQgaXQgYW55d2F5XHJcbiAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIG5vIG5lZWQgdG8ga2VlcCBzZWFyY2hpbmdcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGRpc3BsYXlzLmxlbmd0aDsgaSsrICkge1xyXG5cclxuICAgICAgICBjb25zdCBkaXNwbGF5ID0gZGlzcGxheXNbIGkgXTtcclxuXHJcbiAgICAgICAgLy8gd2lsbCBiZSBudWxsIGlmIGl0IGlzIG5vdCBpbiB0aGUgUERPTSBvciBpZiBpdCBpcyB1bmRlZmluZWRcclxuICAgICAgICBjb25zdCByZWxhdGVkVGFyZ2V0VHJhaWwgPSBkaXNwbGF5Ll9pbnB1dCEuZ2V0UmVsYXRlZFRhcmdldFRyYWlsKCBldmVudCApO1xyXG5cclxuICAgICAgICBpZiAoIHJlbGF0ZWRUYXJnZXRUcmFpbCAmJiByZWxhdGVkVGFyZ2V0VHJhaWwubGFzdE5vZGUoKS5mb2N1c2FibGUgKSB7XHJcbiAgICAgICAgICBGb2N1c01hbmFnZXIucGRvbUZvY3VzID0gbmV3IEZvY3VzKCBkaXNwbGF5LCBQRE9NSW5zdGFuY2UuZ3Vlc3NWaXN1YWxUcmFpbCggcmVsYXRlZFRhcmdldFRyYWlsLCBkaXNwbGF5LnJvb3ROb2RlICkgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgICAgLy8gRG9uJ3Qgc2V0IHRoaXMgYmVmb3JlIHRoZSByZWxhdGVkIHRhcmdldCBjYXNlIGJlY2F1c2Ugd2Ugd2FudCB0byBzdXBwb3J0IE5vZGUuYmx1ciBsaXN0ZW5lcnMgb3ZlcndyaXRpbmdcclxuICAgICAgICAgIC8vIHRoZSByZWxhdGVkVGFyZ2V0IGJlaGF2aW9yLlxyXG4gICAgICAgICAgRm9jdXNNYW5hZ2VyLnBkb21Gb2N1cyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBMaXN0ZW5lciB0byB1cGRhdGUgdGhlIFwiYWN0aXZlXCIgaGlnaGxpZ2h0IHN0YXRlIGZvciBhbiBpbnRlcmFjdGl2ZUhpZ2hsaWdodGluZ05vZGVcclxuICBwcml2YXRlIG9uUG9pbnRlckZvY3VzQ2hhbmdlKCBwb2ludGVyRm9jdXM6IEZvY3VzIHwgbnVsbCwgb2xkRm9jdXM6IEZvY3VzIHwgbnVsbCApOiB2b2lkIHtcclxuICAgIGNvbnN0IGZvY3VzTm9kZSA9IHBvaW50ZXJGb2N1cz8udHJhaWwubGFzdE5vZGUoKSBhcyBJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZ05vZGU7XHJcbiAgICBmb2N1c05vZGUgJiYgZm9jdXNOb2RlLmlzSW50ZXJhY3RpdmVIaWdobGlnaHRpbmcgJiYgZm9jdXNOb2RlLmhhbmRsZUhpZ2hsaWdodEFjdGl2ZUNoYW5nZSgpO1xyXG4gICAgY29uc3Qgb2xkRm9jdXNOb2RlID0gb2xkRm9jdXM/LnRyYWlsLmxhc3ROb2RlKCkgYXMgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdOb2RlO1xyXG4gICAgb2xkRm9jdXNOb2RlICYmIG9sZEZvY3VzTm9kZS5pc0ludGVyYWN0aXZlSGlnaGxpZ2h0aW5nICYmIG9sZEZvY3VzTm9kZS5oYW5kbGVIaWdobGlnaHRBY3RpdmVDaGFuZ2UoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgRE9NIGZvY3VzLiBBIERPTSBsaW1pdGF0aW9uIGlzIHRoYXQgdGhlcmUgY2FuIG9ubHkgYmUgb25lIGVsZW1lbnQgd2l0aCBmb2N1cyBhdCBhIHRpbWUgc28gdGhpcyBtdXN0XHJcbiAgICogYmUgYSBzdGF0aWMgZm9yIHRoZSBGb2N1c01hbmFnZXIuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBzZXQgcGRvbUZvY3VzKCB2YWx1ZTogRm9jdXMgfCBudWxsICkge1xyXG4gICAgaWYgKCBGb2N1c01hbmFnZXIucGRvbUZvY3VzUHJvcGVydHkudmFsdWUgIT09IHZhbHVlICkge1xyXG5cclxuICAgICAgbGV0IHByZXZpb3VzRm9jdXM7XHJcbiAgICAgIGlmICggRm9jdXNNYW5hZ2VyLnBkb21Gb2N1c1Byb3BlcnR5LnZhbHVlICkge1xyXG4gICAgICAgIHByZXZpb3VzRm9jdXMgPSBGb2N1c01hbmFnZXIucGRvbUZvY3VzZWROb2RlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBGb2N1c01hbmFnZXIucGRvbUZvY3VzUHJvcGVydHkudmFsdWUgPSB2YWx1ZTtcclxuXHJcbiAgICAgIC8vIGlmIHNldCB0byBudWxsLCBtYWtlIHN1cmUgdGhhdCB0aGUgYWN0aXZlIGVsZW1lbnQgaXMgbm8gbG9uZ2VyIGZvY3VzZWRcclxuICAgICAgaWYgKCBwcmV2aW91c0ZvY3VzICYmICF2YWx1ZSApIHtcclxuICAgICAgICBwcmV2aW91c0ZvY3VzLmJsdXIoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBGb2N1cyBwb2ludGluZyB0byB0aGUgTm9kZSB3aG9zZSBQYXJhbGxlbCBET00gZWxlbWVudCBoYXMgRE9NIGZvY3VzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgZ2V0IHBkb21Gb2N1cygpOiBGb2N1cyB8IG51bGwge1xyXG4gICAgcmV0dXJuIEZvY3VzTWFuYWdlci5wZG9tRm9jdXNQcm9wZXJ0eS52YWx1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgTm9kZSB0aGF0IGN1cnJlbnRseSBoYXMgRE9NIGZvY3VzLCB0aGUgbGVhZi1tb3N0IE5vZGUgb2YgdGhlIEZvY3VzIFRyYWlsLiBOdWxsIGlmIG5vXHJcbiAgICogTm9kZSBoYXMgZm9jdXMuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBnZXRQRE9NRm9jdXNlZE5vZGUoKTogTm9kZSB8IG51bGwge1xyXG4gICAgbGV0IGZvY3VzZWROb2RlID0gbnVsbDtcclxuICAgIGNvbnN0IGZvY3VzID0gRm9jdXNNYW5hZ2VyLnBkb21Gb2N1c1Byb3BlcnR5LmdldCgpO1xyXG4gICAgaWYgKCBmb2N1cyApIHtcclxuICAgICAgZm9jdXNlZE5vZGUgPSBmb2N1cy50cmFpbC5sYXN0Tm9kZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZvY3VzZWROb2RlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyBnZXQgcGRvbUZvY3VzZWROb2RlKCk6IE5vZGUgfCBudWxsIHsgcmV0dXJuIHRoaXMuZ2V0UERPTUZvY3VzZWROb2RlKCk7IH1cclxuXHJcbiAgLy8gRGlzcGxheSBoYXMgYW4gYXhvbiBgUHJvcGVydHkgdG8gaW5kaWNhdGUgd2hpY2ggY29tcG9uZW50IGlzIGZvY3VzZWQgKG9yIG51bGwgaWYgbm9cclxuICAvLyBzY2VuZXJ5IE5vZGUgaGFzIGZvY3VzKS4gQnkgcGFzc2luZyB0aGUgdGFuZGVtIGFuZCBwaGV0aW9UeWUsIFBoRVQtaU8gaXMgYWJsZSB0byBpbnRlcm9wZXJhdGUgKHNhdmUsIHJlc3RvcmUsXHJcbiAgLy8gY29udHJvbCwgb2JzZXJ2ZSB3aGF0IGlzIGN1cnJlbnRseSBmb2N1c2VkKS4gU2VlIEZvY3VzTWFuYWdlci5wZG9tRm9jdXMgZm9yIHNldHRpbmcgdGhlIGZvY3VzLiBEb24ndCBzZXQgdGhlIHZhbHVlXHJcbiAgLy8gb2YgdGhpcyBQcm9wZXJ0eSBkaXJlY3RseS5cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IHBkb21Gb2N1c1Byb3BlcnR5ID0gbmV3IFByb3BlcnR5PEZvY3VzIHwgbnVsbD4oIG51bGwsIHtcclxuICAgIHRhbmRlbTogVGFuZGVtLkdFTkVSQUxfTU9ERUwuY3JlYXRlVGFuZGVtKCAncGRvbUZvY3VzUHJvcGVydHknICksXHJcbiAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnU3RvcmVzIHRoZSBjdXJyZW50IGZvY3VzIGluIHRoZSBQYXJhbGxlbCBET00sIG51bGwgaWYgbm90aGluZyBoYXMgZm9jdXMuIFRoaXMgaXMgbm90IHVwZGF0ZWQgJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAnYmFzZWQgb24gbW91c2Ugb3IgdG91Y2ggaW5wdXQsIG9ubHkga2V5Ym9hcmQgYW5kIG90aGVyIGFsdGVybmF0aXZlIGlucHV0cy4gTm90ZSB0aGF0IHRoaXMgb25seSAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICdhcHBsaWVzIHRvIHNpbXVsYXRpb25zIHRoYXQgc3VwcG9ydCBhbHRlcm5hdGl2ZSBpbnB1dC4nLFxyXG4gICAgcGhldGlvVmFsdWVUeXBlOiBOdWxsYWJsZUlPKCBGb2N1cy5Gb2N1c0lPICksXHJcbiAgICBwaGV0aW9TdGF0ZTogZmFsc2UsXHJcbiAgICBwaGV0aW9GZWF0dXJlZDogdHJ1ZSxcclxuICAgIHBoZXRpb1JlYWRPbmx5OiB0cnVlXHJcbiAgfSApO1xyXG5cclxuICAvKipcclxuICAgKiBBIFByb3BlcnR5IHRoYXQgbGV0cyB5b3Uga25vdyB3aGVuIHRoZSB3aW5kb3cgaGFzIGZvY3VzLiBXaGVuIHRoZSB3aW5kb3cgaGFzIGZvY3VzLCBpdCBpcyBpbiB0aGUgdXNlcidzIGZvcmVncm91bmQuXHJcbiAgICogV2hlbiBpbiB0aGUgYmFja2dyb3VuZCwgdGhlIHdpbmRvdyBkb2VzIG5vdCByZWNlaXZlIGtleWJvYXJkIGlucHV0IChpbXBvcnRhbnQgZm9yIGdsb2JhbCBrZXlib2FyZCBldmVudHMpLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgc3RhdGljIF93aW5kb3dIYXNGb2N1c1Byb3BlcnR5ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggZmFsc2UgKTtcclxuICBwdWJsaWMgc3RhdGljIHdpbmRvd0hhc0ZvY3VzUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+ID0gRm9jdXNNYW5hZ2VyLl93aW5kb3dIYXNGb2N1c1Byb3BlcnR5O1xyXG5cclxuICAvKipcclxuICAgKiBVcGRhdGVzIHRoZSBfd2luZG93SGFzRm9jdXNQcm9wZXJ0eSB3aGVuIHRoZSB3aW5kb3cgcmVjZWl2ZXMvbG9zZXMgZm9jdXMuIFdoZW4gdGhlIHdpbmRvdyBoYXMgZm9jdXNcclxuICAgKiBpdCBpcyBpbiB0aGUgZm9yZWdyb3VuZCBvZiB0aGUgdXNlci4gV2hlbiBpbiB0aGUgYmFja2dyb3VuZCwgdGhlIHdpbmRvdyB3aWxsIG5vdCByZWNlaXZlIGtleWJvYXJkIGlucHV0LlxyXG4gICAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XaW5kb3cvZm9jdXNfZXZlbnQuXHJcbiAgICpcclxuICAgKiBUaGlzIHdpbGwgYmUgY2FsbGVkIGJ5IHNjZW5lcnkgZm9yIHlvdSB3aGVuIHlvdSB1c2UgRGlzcGxheS5pbml0aWFsaXplRXZlbnRzKCkuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBhdHRhY2hUb1dpbmRvdygpOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFGb2N1c01hbmFnZXIuZ2xvYmFsbHlBdHRhY2hlZCwgJ0NhbiBvbmx5IGJlIGF0dGFjaGVkIHN0YXRpY2FsbHkgb25jZS4nICk7XHJcbiAgICBGb2N1c01hbmFnZXIuYXR0YWNoZWRXaW5kb3dGb2N1c0xpc3RlbmVyID0gKCkgPT4ge1xyXG4gICAgICBGb2N1c01hbmFnZXIuX3dpbmRvd0hhc0ZvY3VzUHJvcGVydHkudmFsdWUgPSB0cnVlO1xyXG4gICAgfTtcclxuXHJcbiAgICBGb2N1c01hbmFnZXIuYXR0YWNoZWRXaW5kb3dCbHVyTGlzdGVuZXIgPSAoKSA9PiB7XHJcbiAgICAgIEZvY3VzTWFuYWdlci5fd2luZG93SGFzRm9jdXNQcm9wZXJ0eS52YWx1ZSA9IGZhbHNlO1xyXG4gICAgfTtcclxuXHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ2ZvY3VzJywgRm9jdXNNYW5hZ2VyLmF0dGFjaGVkV2luZG93Rm9jdXNMaXN0ZW5lciApO1xyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdibHVyJywgRm9jdXNNYW5hZ2VyLmF0dGFjaGVkV2luZG93Qmx1ckxpc3RlbmVyICk7XHJcblxyXG4gICAgLy8gdmFsdWUgd2lsbCBiZSB1cGRhdGVkIHdpdGggd2luZG93LCBidXQgd2UgbmVlZCBhIHByb3BlciBpbml0aWFsIHZhbHVlICh0aGlzIGZ1bmN0aW9uIG1heSBiZSBjYWxsZWQgd2hpbGVcclxuICAgIC8vIHRoZSB3aW5kb3cgaXMgbm90IGluIHRoZSBmb3JlZ3JvdW5kKS5cclxuICAgIEZvY3VzTWFuYWdlci5fd2luZG93SGFzRm9jdXNQcm9wZXJ0eS52YWx1ZSA9IGRvY3VtZW50Lmhhc0ZvY3VzKCk7XHJcblxyXG4gICAgRm9jdXNNYW5hZ2VyLmdsb2JhbGx5QXR0YWNoZWQgPSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGV0YWNoIGFsbCB3aW5kb3cgZm9jdXMvYmx1ciBsaXN0ZW5lcnMgZnJvbSBGb2N1c01hbmFnZXIgd2F0Y2hpbmcgZm9yIHdoZW4gdGhlIHdpbmRvdyBsb3NlcyBmb2N1cy5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGRldGFjaEZyb21XaW5kb3coKTogdm9pZCB7XHJcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2ZvY3VzJywgRm9jdXNNYW5hZ2VyLmF0dGFjaGVkV2luZG93Rm9jdXNMaXN0ZW5lciEgKTtcclxuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCAnYmx1cicsIEZvY3VzTWFuYWdlci5hdHRhY2hlZFdpbmRvd0JsdXJMaXN0ZW5lciEgKTtcclxuXHJcbiAgICAvLyBGb3IgY2xlYW51cCwgdGhpcyBQcm9wZXJ0eSBiZWNvbWVzIGZhbHNlIGFnYWluIHdoZW4gZGV0YWNoaW5nIGJlY2F1c2Ugd2Ugd2lsbCBubyBsb25nZXIgYmUgd2F0Y2hpbmcgZm9yIGNoYW5nZXMuXHJcbiAgICBGb2N1c01hbmFnZXIuX3dpbmRvd0hhc0ZvY3VzUHJvcGVydHkudmFsdWUgPSBmYWxzZTtcclxuXHJcbiAgICBGb2N1c01hbmFnZXIuZ2xvYmFsbHlBdHRhY2hlZCA9IGZhbHNlO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ0ZvY3VzTWFuYWdlcicsIEZvY3VzTWFuYWdlciApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLGVBQWUsTUFBTSxxQ0FBcUM7QUFDakUsT0FBT0MsZUFBZSxNQUFNLHFDQUFxQztBQUdqRSxPQUFPQyxRQUFRLE1BQU0sOEJBQThCO0FBQ25ELE9BQU9DLE1BQU0sTUFBTSw4QkFBOEI7QUFDakQsT0FBT0MsVUFBVSxNQUFNLHdDQUF3QztBQUUvRCxTQUFrQkMsS0FBSyxFQUFFQyx3QkFBd0IsRUFBUUMsWUFBWSxFQUFFQyxTQUFTLEVBQUVDLHFCQUFxQixFQUFFQyxPQUFPLEVBQUVDLGNBQWMsUUFBUSxlQUFlO0FBS3ZKLGVBQWUsTUFBTUMsWUFBWSxDQUFDO0VBRWhDO0VBQ0E7RUFDQTs7RUFHQTtFQUNBOztFQUdBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7O0VBR0E7O0VBR0E7O0VBR0E7RUFDQTs7RUFHQTtFQUNBOztFQUdBO0VBQ0E7O0VBR0E7RUFDQTs7RUFHQTtFQUNBOztFQUdBOztFQU1BO0VBQ0EsT0FBZUMsMkJBQTJCLEdBQTBCLElBQUk7RUFDeEUsT0FBZUMsMEJBQTBCLEdBQTBCLElBQUk7RUFDdkUsT0FBZUMsZ0JBQWdCLEdBQUcsS0FBSztFQUVoQ0MsV0FBV0EsQ0FBQSxFQUFHO0lBQ25CLElBQUksQ0FBQ0Msb0JBQW9CLEdBQUcsSUFBSWYsUUFBUSxDQUFFLElBQUssQ0FBQztJQUNoRCxJQUFJLENBQUNnQix5QkFBeUIsR0FBRyxJQUFJaEIsUUFBUSxDQUFFLElBQUssQ0FBQztJQUNyRCxJQUFJLENBQUNpQiwwQkFBMEIsR0FBRyxJQUFJakIsUUFBUSxDQUFFLElBQUssQ0FBQztJQUN0RCxJQUFJLENBQUNrQixrQ0FBa0MsR0FBRyxJQUFJcEIsZUFBZSxDQUFFLElBQUssQ0FBQztJQUNyRSxJQUFJLENBQUNxQixvQ0FBb0MsR0FBRyxJQUFJckIsZUFBZSxDQUFFLEtBQU0sQ0FBQztJQUN4RSxJQUFJLENBQUNzQixxQ0FBcUMsR0FBRyxJQUFJdEIsZUFBZSxDQUFFLEtBQU0sQ0FBQzs7SUFFekU7SUFDQSxJQUFJLENBQUN1QiwyQkFBMkIsR0FBR0MsT0FBTyxJQUFJO01BQzVDLElBQUksQ0FBQ0YscUNBQXFDLENBQUNHLEtBQUssR0FBR0QsT0FBTztJQUM1RCxDQUFDO0lBQ0RiLGNBQWMsQ0FBQ2UsMkJBQTJCLENBQUNDLElBQUksQ0FBRSxJQUFJLENBQUNKLDJCQUE0QixDQUFDO0lBRW5GLElBQUksQ0FBQ0ssZ0NBQWdDLEdBQUcsSUFBSTNCLGVBQWUsQ0FDekQsQ0FBRSxJQUFJLENBQUNvQixvQ0FBb0MsRUFBRSxJQUFJLENBQUNDLHFDQUFxQyxDQUFFLEVBQ3pGLENBQUVPLDRCQUE0QixFQUFFQyxjQUFjLEtBQU07TUFDbEQsT0FBT0QsNEJBQTRCLElBQUlDLGNBQWM7SUFDdkQsQ0FBRSxDQUFDOztJQUVMO0lBQ0E7SUFDQTtJQUNBOztJQUVBLElBQUksQ0FBQ0MsMkJBQTJCLEdBQUcsSUFBSXpCLHdCQUF3QixDQUFFLElBQUksQ0FBQ1kseUJBQTBCLENBQUM7SUFFakcsSUFBSSxDQUFDYyxxQkFBcUIsR0FBRyxDQUFFQyxJQUFJLEVBQUVDLFNBQVMsS0FBTTtNQUNsRCxJQUFJLENBQUNoQix5QkFBeUIsQ0FBQ08sS0FBSyxHQUFHUyxTQUFTLFlBQVl6QixxQkFBcUIsR0FBR3lCLFNBQVMsQ0FBQ0MsaUJBQWlCLEdBQUcsSUFBSTtJQUN4SCxDQUFDOztJQUVEO0lBQ0F4QixjQUFjLENBQUN5QixvQkFBb0IsQ0FBQ0MsV0FBVyxDQUFFLElBQUksQ0FBQ0wscUJBQXNCLENBQUM7SUFFN0UsSUFBSSxDQUFDTSxtQkFBbUIsR0FBRyxDQUFFTCxJQUFJLEVBQUVDLFNBQVMsS0FBTTtNQUNoRCxJQUFLQSxTQUFTLFlBQVl6QixxQkFBcUIsSUFBSSxJQUFJLENBQUNTLHlCQUF5QixDQUFDTyxLQUFLLEVBQUc7UUFFeEZjLE1BQU0sSUFBSUEsTUFBTSxDQUFFTCxTQUFTLENBQUNDLGlCQUFpQixFQUFFLDBCQUEyQixDQUFDOztRQUUzRTtRQUNBO1FBQ0E7UUFDQSxJQUFLRCxTQUFTLENBQUNDLGlCQUFpQixDQUFFSyxLQUFLLENBQUNDLE1BQU0sQ0FBRSxJQUFJLENBQUN2Qix5QkFBeUIsQ0FBQ08sS0FBSyxDQUFDZSxLQUFNLENBQUMsRUFBRztVQUM3RixJQUFJLENBQUN0Qix5QkFBeUIsQ0FBQ08sS0FBSyxHQUFHLElBQUk7UUFDN0M7TUFDRjtJQUNGLENBQUM7O0lBRUQ7SUFDQWQsY0FBYyxDQUFDK0Isa0JBQWtCLENBQUNMLFdBQVcsQ0FBRSxJQUFJLENBQUNDLG1CQUFvQixDQUFDOztJQUV6RTtJQUNBO0lBQ0E7SUFDQTtJQUNBLElBQUksQ0FBQ0ssK0JBQStCLEdBQUcsSUFBSXJDLHdCQUF3QixDQUFFLElBQUksQ0FBQ1csb0JBQXFCLENBQUM7SUFDaEcsSUFBSSxDQUFDMkIscUNBQXFDLEdBQUcsSUFBSXRDLHdCQUF3QixDQUFFLElBQUksQ0FBQ2EsMEJBQTJCLENBQUM7SUFFNUcsQ0FDRSxJQUFJLENBQUNGLG9CQUFvQixFQUN6QixJQUFJLENBQUNFLDBCQUEwQixDQUNoQyxDQUFDMEIsT0FBTyxDQUFFQyxRQUFRLElBQUk7TUFDckJBLFFBQVEsQ0FBQ25CLElBQUksQ0FBRSxJQUFJLENBQUNvQixvQkFBb0IsQ0FBQ0MsSUFBSSxDQUFFLElBQUssQ0FBRSxDQUFDO0lBQ3pELENBQUUsQ0FBQztFQUNMO0VBRU9DLE9BQU9BLENBQUEsRUFBUztJQUNyQixJQUFJLENBQUNoQyxvQkFBb0IsQ0FBQ2dDLE9BQU8sQ0FBQyxDQUFDO0lBQ25DLElBQUksQ0FBQy9CLHlCQUF5QixDQUFDK0IsT0FBTyxDQUFDLENBQUM7SUFDeEMsSUFBSSxDQUFDOUIsMEJBQTBCLENBQUM4QixPQUFPLENBQUMsQ0FBQztJQUN6QyxJQUFJLENBQUM3QixrQ0FBa0MsQ0FBQzZCLE9BQU8sQ0FBQyxDQUFDO0lBQ2pELElBQUksQ0FBQzVCLG9DQUFvQyxDQUFDNEIsT0FBTyxDQUFDLENBQUM7SUFDbkQsSUFBSSxDQUFDM0IscUNBQXFDLENBQUMyQixPQUFPLENBQUMsQ0FBQztJQUNwRCxJQUFJLENBQUNsQiwyQkFBMkIsQ0FBQ2tCLE9BQU8sQ0FBQyxDQUFDO0lBQzFDLElBQUksQ0FBQ04sK0JBQStCLENBQUNNLE9BQU8sQ0FBQyxDQUFDO0lBQzlDLElBQUksQ0FBQ3JCLGdDQUFnQyxDQUFDcUIsT0FBTyxDQUFDLENBQUM7SUFDL0MsSUFBSSxDQUFDTCxxQ0FBcUMsQ0FBQ0ssT0FBTyxDQUFDLENBQUM7O0lBRXBEO0lBQ0F0QyxjQUFjLENBQUN5QixvQkFBb0IsQ0FBQ2MsY0FBYyxDQUFFLElBQUksQ0FBQ2xCLHFCQUFzQixDQUFDOztJQUVoRjtJQUNBckIsY0FBYyxDQUFDK0Isa0JBQWtCLENBQUNRLGNBQWMsQ0FBRSxJQUFJLENBQUNaLG1CQUFvQixDQUFDO0lBRTVFM0IsY0FBYyxDQUFDZSwyQkFBMkIsQ0FBQ3lCLE1BQU0sQ0FBRSxJQUFJLENBQUM1QiwyQkFBNEIsQ0FBQztFQUN2Rjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBYzZCLHdCQUF3QkEsQ0FBRUMsUUFBbUIsRUFBRUMsS0FBaUIsRUFBRUMsS0FBYyxFQUFTO0lBQ3JHaEIsTUFBTSxJQUFJQSxNQUFNLENBQUVpQixRQUFRLENBQUNDLGFBQWEsRUFBRSxnRUFBaUUsQ0FBQztJQUU1RyxJQUFLRixLQUFLLEVBQUc7TUFFWDtNQUNBLEtBQU0sSUFBSUcsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHTCxRQUFRLENBQUNNLE1BQU0sRUFBRUQsQ0FBQyxFQUFFLEVBQUc7UUFDMUMsTUFBTUUsT0FBTyxHQUFHUCxRQUFRLENBQUVLLENBQUMsQ0FBRTtRQUU3QixNQUFNRCxhQUFhLEdBQUdELFFBQVEsQ0FBQ0MsYUFBNEI7UUFDM0QsSUFBS0csT0FBTyxDQUFDQyxrQkFBa0IsQ0FBRUosYUFBYSxFQUFFLEtBQU0sQ0FBQyxFQUFHO1VBQ3hELE1BQU1LLFFBQVEsR0FBR0wsYUFBYSxDQUFDTSxZQUFZLENBQUV2RCxTQUFTLENBQUN3RCxtQkFBb0IsQ0FBRTtVQUM3RXpCLE1BQU0sSUFBSUEsTUFBTSxDQUFFdUIsUUFBUSxFQUFFLHNFQUF1RSxDQUFDO1VBRXBHLE1BQU10QixLQUFLLEdBQUdqQyxZQUFZLENBQUMwRCxlQUFlLENBQUVMLE9BQU8sRUFBRUUsUUFBUyxDQUFFO1VBQ2hFdkIsTUFBTSxJQUFJQSxNQUFNLENBQUVDLEtBQUssRUFBRSwyREFBNEQsQ0FBQztVQUV0RixNQUFNMEIsV0FBVyxHQUFHM0QsWUFBWSxDQUFDNEQsZ0JBQWdCLENBQUUzQixLQUFLLEVBQUVvQixPQUFPLENBQUNRLFFBQVMsQ0FBQztVQUM1RSxJQUFLRixXQUFXLENBQUNHLFFBQVEsQ0FBQyxDQUFDLENBQUNDLFNBQVMsRUFBRztZQUN0QzFELFlBQVksQ0FBQzJELFNBQVMsR0FBRyxJQUFJbEUsS0FBSyxDQUFFdUQsT0FBTyxFQUFFTSxXQUFZLENBQUM7VUFDNUQsQ0FBQyxNQUNJO1lBRUg7WUFDQTtZQUNBO1lBQ0E7WUFDRVosS0FBSyxDQUFDa0IsTUFBTSxDQUFrQkMsSUFBSSxDQUFDLENBQUM7O1lBRXRDO1lBQ0E7WUFDQW5CLEtBQUssQ0FBQ29CLHdCQUF3QixDQUFDLENBQUM7VUFDbEM7O1VBRUE7VUFDQTtRQUNGO01BQ0Y7SUFDRixDQUFDLE1BQ0k7TUFDSCxLQUFNLElBQUloQixDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdMLFFBQVEsQ0FBQ00sTUFBTSxFQUFFRCxDQUFDLEVBQUUsRUFBRztRQUUxQyxNQUFNRSxPQUFPLEdBQUdQLFFBQVEsQ0FBRUssQ0FBQyxDQUFFOztRQUU3QjtRQUNBLE1BQU1pQixrQkFBa0IsR0FBR2YsT0FBTyxDQUFDZ0IsTUFBTSxDQUFFQyxxQkFBcUIsQ0FBRXZCLEtBQU0sQ0FBQztRQUV6RSxJQUFLcUIsa0JBQWtCLElBQUlBLGtCQUFrQixDQUFDTixRQUFRLENBQUMsQ0FBQyxDQUFDQyxTQUFTLEVBQUc7VUFDbkUxRCxZQUFZLENBQUMyRCxTQUFTLEdBQUcsSUFBSWxFLEtBQUssQ0FBRXVELE9BQU8sRUFBRXJELFlBQVksQ0FBQzRELGdCQUFnQixDQUFFUSxrQkFBa0IsRUFBRWYsT0FBTyxDQUFDUSxRQUFTLENBQUUsQ0FBQztRQUN0SCxDQUFDLE1BQ0k7VUFFSDtVQUNBO1VBQ0F4RCxZQUFZLENBQUMyRCxTQUFTLEdBQUcsSUFBSTtRQUMvQjtNQUNGO0lBQ0Y7RUFDRjs7RUFFQTtFQUNReEIsb0JBQW9CQSxDQUFFK0IsWUFBMEIsRUFBRUMsUUFBc0IsRUFBUztJQUN2RixNQUFNQyxTQUFTLEdBQUdGLFlBQVksRUFBRXRDLEtBQUssQ0FBQzZCLFFBQVEsQ0FBQyxDQUFnQztJQUMvRVcsU0FBUyxJQUFJQSxTQUFTLENBQUNDLHlCQUF5QixJQUFJRCxTQUFTLENBQUNFLDJCQUEyQixDQUFDLENBQUM7SUFDM0YsTUFBTUMsWUFBWSxHQUFHSixRQUFRLEVBQUV2QyxLQUFLLENBQUM2QixRQUFRLENBQUMsQ0FBZ0M7SUFDOUVjLFlBQVksSUFBSUEsWUFBWSxDQUFDRix5QkFBeUIsSUFBSUUsWUFBWSxDQUFDRCwyQkFBMkIsQ0FBQyxDQUFDO0VBQ3RHOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0VBQ0UsV0FBa0JYLFNBQVNBLENBQUU5QyxLQUFtQixFQUFHO0lBQ2pELElBQUtiLFlBQVksQ0FBQ3dFLGlCQUFpQixDQUFDM0QsS0FBSyxLQUFLQSxLQUFLLEVBQUc7TUFFcEQsSUFBSTRELGFBQWE7TUFDakIsSUFBS3pFLFlBQVksQ0FBQ3dFLGlCQUFpQixDQUFDM0QsS0FBSyxFQUFHO1FBQzFDNEQsYUFBYSxHQUFHekUsWUFBWSxDQUFDMEUsZUFBZTtNQUM5QztNQUVBMUUsWUFBWSxDQUFDd0UsaUJBQWlCLENBQUMzRCxLQUFLLEdBQUdBLEtBQUs7O01BRTVDO01BQ0EsSUFBSzRELGFBQWEsSUFBSSxDQUFDNUQsS0FBSyxFQUFHO1FBQzdCNEQsYUFBYSxDQUFDWixJQUFJLENBQUMsQ0FBQztNQUN0QjtJQUNGO0VBQ0Y7O0VBRUE7QUFDRjtBQUNBO0VBQ0UsV0FBa0JGLFNBQVNBLENBQUEsRUFBaUI7SUFDMUMsT0FBTzNELFlBQVksQ0FBQ3dFLGlCQUFpQixDQUFDM0QsS0FBSztFQUM3Qzs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtFQUNFLE9BQWM4RCxrQkFBa0JBLENBQUEsRUFBZ0I7SUFDOUMsSUFBSUMsV0FBVyxHQUFHLElBQUk7SUFDdEIsTUFBTWpDLEtBQUssR0FBRzNDLFlBQVksQ0FBQ3dFLGlCQUFpQixDQUFDSyxHQUFHLENBQUMsQ0FBQztJQUNsRCxJQUFLbEMsS0FBSyxFQUFHO01BQ1hpQyxXQUFXLEdBQUdqQyxLQUFLLENBQUNmLEtBQUssQ0FBQzZCLFFBQVEsQ0FBQyxDQUFDO0lBQ3RDO0lBQ0EsT0FBT21CLFdBQVc7RUFDcEI7RUFFQSxXQUFrQkYsZUFBZUEsQ0FBQSxFQUFnQjtJQUFFLE9BQU8sSUFBSSxDQUFDQyxrQkFBa0IsQ0FBQyxDQUFDO0VBQUU7O0VBRXJGO0VBQ0E7RUFDQTtFQUNBO0VBQ0EsT0FBdUJILGlCQUFpQixHQUFHLElBQUlsRixRQUFRLENBQWdCLElBQUksRUFBRTtJQUMzRXdGLE1BQU0sRUFBRXZGLE1BQU0sQ0FBQ3dGLGFBQWEsQ0FBQ0MsWUFBWSxDQUFFLG1CQUFvQixDQUFDO0lBQ2hFQyxtQkFBbUIsRUFBRSwrRkFBK0YsR0FDL0YsaUdBQWlHLEdBQ2pHLHdEQUF3RDtJQUM3RUMsZUFBZSxFQUFFMUYsVUFBVSxDQUFFQyxLQUFLLENBQUMwRixPQUFRLENBQUM7SUFDNUNDLFdBQVcsRUFBRSxLQUFLO0lBQ2xCQyxjQUFjLEVBQUUsSUFBSTtJQUNwQkMsY0FBYyxFQUFFO0VBQ2xCLENBQUUsQ0FBQzs7RUFFSDtBQUNGO0FBQ0E7QUFDQTtFQUNFLE9BQWVDLHVCQUF1QixHQUFHLElBQUluRyxlQUFlLENBQUUsS0FBTSxDQUFDO0VBQ3JFLE9BQWNvRyxzQkFBc0IsR0FBK0J4RixZQUFZLENBQUN1Rix1QkFBdUI7O0VBRXZHO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBY0UsY0FBY0EsQ0FBQSxFQUFTO0lBQ25DOUQsTUFBTSxJQUFJQSxNQUFNLENBQUUsQ0FBQzNCLFlBQVksQ0FBQ0csZ0JBQWdCLEVBQUUsdUNBQXdDLENBQUM7SUFDM0ZILFlBQVksQ0FBQ0MsMkJBQTJCLEdBQUcsTUFBTTtNQUMvQ0QsWUFBWSxDQUFDdUYsdUJBQXVCLENBQUMxRSxLQUFLLEdBQUcsSUFBSTtJQUNuRCxDQUFDO0lBRURiLFlBQVksQ0FBQ0UsMEJBQTBCLEdBQUcsTUFBTTtNQUM5Q0YsWUFBWSxDQUFDdUYsdUJBQXVCLENBQUMxRSxLQUFLLEdBQUcsS0FBSztJQUNwRCxDQUFDO0lBRUQ2RSxNQUFNLENBQUNDLGdCQUFnQixDQUFFLE9BQU8sRUFBRTNGLFlBQVksQ0FBQ0MsMkJBQTRCLENBQUM7SUFDNUV5RixNQUFNLENBQUNDLGdCQUFnQixDQUFFLE1BQU0sRUFBRTNGLFlBQVksQ0FBQ0UsMEJBQTJCLENBQUM7O0lBRTFFO0lBQ0E7SUFDQUYsWUFBWSxDQUFDdUYsdUJBQXVCLENBQUMxRSxLQUFLLEdBQUcrQixRQUFRLENBQUNnRCxRQUFRLENBQUMsQ0FBQztJQUVoRTVGLFlBQVksQ0FBQ0csZ0JBQWdCLEdBQUcsSUFBSTtFQUN0Qzs7RUFFQTtBQUNGO0FBQ0E7RUFDRSxPQUFjMEYsZ0JBQWdCQSxDQUFBLEVBQVM7SUFDckNILE1BQU0sQ0FBQ0ksbUJBQW1CLENBQUUsT0FBTyxFQUFFOUYsWUFBWSxDQUFDQywyQkFBNkIsQ0FBQztJQUNoRnlGLE1BQU0sQ0FBQ0ksbUJBQW1CLENBQUUsTUFBTSxFQUFFOUYsWUFBWSxDQUFDRSwwQkFBNEIsQ0FBQzs7SUFFOUU7SUFDQUYsWUFBWSxDQUFDdUYsdUJBQXVCLENBQUMxRSxLQUFLLEdBQUcsS0FBSztJQUVsRGIsWUFBWSxDQUFDRyxnQkFBZ0IsR0FBRyxLQUFLO0VBQ3ZDO0FBQ0Y7QUFFQUwsT0FBTyxDQUFDaUcsUUFBUSxDQUFFLGNBQWMsRUFBRS9GLFlBQWEsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==