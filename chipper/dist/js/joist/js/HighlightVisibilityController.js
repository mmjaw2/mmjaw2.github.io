// Copyright 2021-2024, University of Colorado Boulder

/**
 * A listener that manages the visibility of different highlights when switching between mouse/touch and alternative
 * input for a Display.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import Multilink from '../../axon/js/Multilink.js';
import { FocusManager, globalKeyStateTracker, KeyboardUtils } from '../../scenery/js/imports.js';
import joist from './joist.js';
// constants
// The amount of Pointer movement required to switch from showing focus highlights to Interactive Highlights if both
// are enabled, in the global coordinate frame.
const HIDE_FOCUS_HIGHLIGHTS_MOVEMENT_THRESHOLD = 100;
class HighlightVisibilityController {
  // {null|Vector2} - The initial point of the Pointer when focus highlights are made visible and Interactive
  // highlights are enabled. Pointer movement to determine whether to switch to showing Interactive Highlights
  // instead of focus highlights will be relative to this point. A value of null means we haven't saved a point
  // yet and we need to on the next move event.
  initialPointerPoint = null;

  // {number} - The amount of distance that the Pointer has moved relative to initialPointerPoint, in the global
  // coordinate frame.
  relativePointerDistance = 0;
  constructor(display, preferencesModel) {
    // A reference to the Display whose FocusManager we will operate on to control the visibility of various kinds of highlights
    this.display = display;

    // A listener that is added/removed from the display to manage visibility of highlights on move events. We
    // usually don't need this listener so it is only added when we need to listen for move events.
    const moveListener = {
      move: this.handleMove.bind(this)
    };
    const setHighlightsVisible = () => {
      this.display.focusManager.pdomFocusHighlightsVisibleProperty.value = true;
    };
    const focusHighlightVisibleListener = {};

    // Restore display of focus highlights if we receive PDOM events. Exclude focus-related events here
    // so that we can support some iOS cases where we want PDOM behavior even though iOS + VO only provided pointer
    // events. See https://github.com/phetsims/scenery/issues/1137 for details.
    ['click', 'input', 'change', 'keydown', 'keyup'].forEach(eventType => {
      focusHighlightVisibleListener[eventType] = setHighlightsVisible;
    });
    this.display.addInputListener(focusHighlightVisibleListener);

    // When tabbing into the sim, make focus highlights visible - on keyup because the keydown is likely to have
    // occurred on an element outside of the DOM scope.
    globalKeyStateTracker.keyupEmitter.addListener(event => {
      if (KeyboardUtils.isKeyEvent(event, KeyboardUtils.KEY_TAB)) {
        setHighlightsVisible();
      }
    });
    if (preferencesModel.visualModel.supportsInteractiveHighlights) {
      preferencesModel.visualModel.interactiveHighlightsEnabledProperty.link(visible => {
        this.display.focusManager.interactiveHighlightsVisibleProperty.value = visible;
      });

      // When both Interactive Highlights are enabled and the PDOM focus highlights are visible, add a listener that
      // will make focus highlights invisible and interactive highlights visible if we receive a certain amount of
      // mouse movement. The listener is removed as soon as PDOM focus highlights are made invisible or Interactive
      // Highlights are disabled.
      const interactiveHighlightsEnabledProperty = preferencesModel.visualModel.interactiveHighlightsEnabledProperty;
      const pdomFocusHighlightsVisibleProperty = this.display.focusManager.pdomFocusHighlightsVisibleProperty;
      Multilink.multilink([interactiveHighlightsEnabledProperty, pdomFocusHighlightsVisibleProperty], (interactiveHighlightsEnabled, pdomHighlightsVisible) => {
        if (interactiveHighlightsEnabled && pdomHighlightsVisible) {
          this.display.addInputListener(moveListener);

          // Setting to null indicates that we should store the Pointer.point as the initialPointerPoint on next move.
          this.initialPointerPoint = null;

          // Reset distance of movement for the mouse pointer since we are looking for changes again.
          this.relativePointerDistance = 0;
        } else {
          this.display.hasInputListener(moveListener) && this.display.removeInputListener(moveListener);
        }
      });
    }
    this.display.addInputListener({
      // Whenever we receive a down event focus highlights are made invisible. We may also blur the active element in
      // some cases, but not always as is necessary for iOS VoiceOver. See documentation details in the function.
      down: event => {
        // An AT might have sent a down event outside of the display, if this happened we will not do anything
        // to change focus
        if (this.display.bounds.containsPoint(event.pointer.point)) {
          // in response to pointer events, always hide the focus highlight so it isn't distracting
          this.display.focusManager.pdomFocusHighlightsVisibleProperty.value = false;

          // no need to do this work unless some element in the simulation has focus
          if (FocusManager.pdomFocusedNode) {
            // if the event trail doesn't include the focusedNode, clear it - otherwise DOM focus is kept on the
            // active element so that it can remain the target for assistive devices using pointer events
            // on behalf of the user, see https://github.com/phetsims/scenery/issues/1137
            if (!event.trail.nodes.includes(FocusManager.pdomFocusedNode)) {
              FocusManager.pdomFocus = null;
            }
          }
        }
      }
    });
  }

  /**
   * Switches between focus highlights and Interactive Highlights if there is enough mouse movement.
   */
  handleMove(event) {
    // A null initialPointerPoint means that we have not set the point yet since we started listening for mouse
    // movements - set it now so that distance of mose movement will be relative to this initial point.
    if (this.initialPointerPoint === null) {
      this.initialPointerPoint = event.pointer.point;
    } else {
      this.relativePointerDistance = event.pointer.point.distance(this.initialPointerPoint);

      // we have moved enough to switch from focus highlights to Interactive Highlights. Setting the
      // pdomFocusHighlightsVisibleProperty to false will remove this listener for us.
      if (this.relativePointerDistance > HIDE_FOCUS_HIGHLIGHTS_MOVEMENT_THRESHOLD) {
        this.display.focusManager.pdomFocusHighlightsVisibleProperty.value = false;
        this.display.focusManager.interactiveHighlightsVisibleProperty.value = true;
      }
    }
  }
}
joist.register('HighlightVisibilityController', HighlightVisibilityController);
export default HighlightVisibilityController;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNdWx0aWxpbmsiLCJGb2N1c01hbmFnZXIiLCJnbG9iYWxLZXlTdGF0ZVRyYWNrZXIiLCJLZXlib2FyZFV0aWxzIiwiam9pc3QiLCJISURFX0ZPQ1VTX0hJR0hMSUdIVFNfTU9WRU1FTlRfVEhSRVNIT0xEIiwiSGlnaGxpZ2h0VmlzaWJpbGl0eUNvbnRyb2xsZXIiLCJpbml0aWFsUG9pbnRlclBvaW50IiwicmVsYXRpdmVQb2ludGVyRGlzdGFuY2UiLCJjb25zdHJ1Y3RvciIsImRpc3BsYXkiLCJwcmVmZXJlbmNlc01vZGVsIiwibW92ZUxpc3RlbmVyIiwibW92ZSIsImhhbmRsZU1vdmUiLCJiaW5kIiwic2V0SGlnaGxpZ2h0c1Zpc2libGUiLCJmb2N1c01hbmFnZXIiLCJwZG9tRm9jdXNIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5IiwidmFsdWUiLCJmb2N1c0hpZ2hsaWdodFZpc2libGVMaXN0ZW5lciIsImZvckVhY2giLCJldmVudFR5cGUiLCJhZGRJbnB1dExpc3RlbmVyIiwia2V5dXBFbWl0dGVyIiwiYWRkTGlzdGVuZXIiLCJldmVudCIsImlzS2V5RXZlbnQiLCJLRVlfVEFCIiwidmlzdWFsTW9kZWwiLCJzdXBwb3J0c0ludGVyYWN0aXZlSGlnaGxpZ2h0cyIsImludGVyYWN0aXZlSGlnaGxpZ2h0c0VuYWJsZWRQcm9wZXJ0eSIsImxpbmsiLCJ2aXNpYmxlIiwiaW50ZXJhY3RpdmVIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5IiwibXVsdGlsaW5rIiwiaW50ZXJhY3RpdmVIaWdobGlnaHRzRW5hYmxlZCIsInBkb21IaWdobGlnaHRzVmlzaWJsZSIsImhhc0lucHV0TGlzdGVuZXIiLCJyZW1vdmVJbnB1dExpc3RlbmVyIiwiZG93biIsImJvdW5kcyIsImNvbnRhaW5zUG9pbnQiLCJwb2ludGVyIiwicG9pbnQiLCJwZG9tRm9jdXNlZE5vZGUiLCJ0cmFpbCIsIm5vZGVzIiwiaW5jbHVkZXMiLCJwZG9tRm9jdXMiLCJkaXN0YW5jZSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiSGlnaGxpZ2h0VmlzaWJpbGl0eUNvbnRyb2xsZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBsaXN0ZW5lciB0aGF0IG1hbmFnZXMgdGhlIHZpc2liaWxpdHkgb2YgZGlmZmVyZW50IGhpZ2hsaWdodHMgd2hlbiBzd2l0Y2hpbmcgYmV0d2VlbiBtb3VzZS90b3VjaCBhbmQgYWx0ZXJuYXRpdmVcclxuICogaW5wdXQgZm9yIGEgRGlzcGxheS5cclxuICpcclxuICogQGF1dGhvciBKZXNzZSBHcmVlbmJlcmcgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IE11bHRpbGluayBmcm9tICcuLi8uLi9heG9uL2pzL011bHRpbGluay5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IHsgRGlzcGxheSwgRm9jdXNNYW5hZ2VyLCBnbG9iYWxLZXlTdGF0ZVRyYWNrZXIsIEtleWJvYXJkVXRpbHMsIFNjZW5lcnlFdmVudCwgVElucHV0TGlzdGVuZXIgfSBmcm9tICcuLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgam9pc3QgZnJvbSAnLi9qb2lzdC5qcyc7XHJcbmltcG9ydCBQcmVmZXJlbmNlc01vZGVsIGZyb20gJy4vcHJlZmVyZW5jZXMvUHJlZmVyZW5jZXNNb2RlbC5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuLy8gVGhlIGFtb3VudCBvZiBQb2ludGVyIG1vdmVtZW50IHJlcXVpcmVkIHRvIHN3aXRjaCBmcm9tIHNob3dpbmcgZm9jdXMgaGlnaGxpZ2h0cyB0byBJbnRlcmFjdGl2ZSBIaWdobGlnaHRzIGlmIGJvdGhcclxuLy8gYXJlIGVuYWJsZWQsIGluIHRoZSBnbG9iYWwgY29vcmRpbmF0ZSBmcmFtZS5cclxuY29uc3QgSElERV9GT0NVU19ISUdITElHSFRTX01PVkVNRU5UX1RIUkVTSE9MRCA9IDEwMDtcclxuXHJcbmNsYXNzIEhpZ2hsaWdodFZpc2liaWxpdHlDb250cm9sbGVyIHtcclxuICBwcml2YXRlIHJlYWRvbmx5IGRpc3BsYXk6IERpc3BsYXk7XHJcblxyXG4gIC8vIHtudWxsfFZlY3RvcjJ9IC0gVGhlIGluaXRpYWwgcG9pbnQgb2YgdGhlIFBvaW50ZXIgd2hlbiBmb2N1cyBoaWdobGlnaHRzIGFyZSBtYWRlIHZpc2libGUgYW5kIEludGVyYWN0aXZlXHJcbiAgLy8gaGlnaGxpZ2h0cyBhcmUgZW5hYmxlZC4gUG9pbnRlciBtb3ZlbWVudCB0byBkZXRlcm1pbmUgd2hldGhlciB0byBzd2l0Y2ggdG8gc2hvd2luZyBJbnRlcmFjdGl2ZSBIaWdobGlnaHRzXHJcbiAgLy8gaW5zdGVhZCBvZiBmb2N1cyBoaWdobGlnaHRzIHdpbGwgYmUgcmVsYXRpdmUgdG8gdGhpcyBwb2ludC4gQSB2YWx1ZSBvZiBudWxsIG1lYW5zIHdlIGhhdmVuJ3Qgc2F2ZWQgYSBwb2ludFxyXG4gIC8vIHlldCBhbmQgd2UgbmVlZCB0byBvbiB0aGUgbmV4dCBtb3ZlIGV2ZW50LlxyXG4gIHByaXZhdGUgaW5pdGlhbFBvaW50ZXJQb2ludDogVmVjdG9yMiB8IG51bGwgPSBudWxsO1xyXG5cclxuICAvLyB7bnVtYmVyfSAtIFRoZSBhbW91bnQgb2YgZGlzdGFuY2UgdGhhdCB0aGUgUG9pbnRlciBoYXMgbW92ZWQgcmVsYXRpdmUgdG8gaW5pdGlhbFBvaW50ZXJQb2ludCwgaW4gdGhlIGdsb2JhbFxyXG4gIC8vIGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgcHJpdmF0ZSByZWxhdGl2ZVBvaW50ZXJEaXN0YW5jZSA9IDA7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggZGlzcGxheTogRGlzcGxheSwgcHJlZmVyZW5jZXNNb2RlbDogUHJlZmVyZW5jZXNNb2RlbCApIHtcclxuXHJcbiAgICAvLyBBIHJlZmVyZW5jZSB0byB0aGUgRGlzcGxheSB3aG9zZSBGb2N1c01hbmFnZXIgd2Ugd2lsbCBvcGVyYXRlIG9uIHRvIGNvbnRyb2wgdGhlIHZpc2liaWxpdHkgb2YgdmFyaW91cyBraW5kcyBvZiBoaWdobGlnaHRzXHJcbiAgICB0aGlzLmRpc3BsYXkgPSBkaXNwbGF5O1xyXG5cclxuICAgIC8vIEEgbGlzdGVuZXIgdGhhdCBpcyBhZGRlZC9yZW1vdmVkIGZyb20gdGhlIGRpc3BsYXkgdG8gbWFuYWdlIHZpc2liaWxpdHkgb2YgaGlnaGxpZ2h0cyBvbiBtb3ZlIGV2ZW50cy4gV2VcclxuICAgIC8vIHVzdWFsbHkgZG9uJ3QgbmVlZCB0aGlzIGxpc3RlbmVyIHNvIGl0IGlzIG9ubHkgYWRkZWQgd2hlbiB3ZSBuZWVkIHRvIGxpc3RlbiBmb3IgbW92ZSBldmVudHMuXHJcbiAgICBjb25zdCBtb3ZlTGlzdGVuZXIgPSB7XHJcbiAgICAgIG1vdmU6IHRoaXMuaGFuZGxlTW92ZS5iaW5kKCB0aGlzIClcclxuICAgIH07XHJcblxyXG4gICAgY29uc3Qgc2V0SGlnaGxpZ2h0c1Zpc2libGUgPSAoKSA9PiB7IHRoaXMuZGlzcGxheS5mb2N1c01hbmFnZXIucGRvbUZvY3VzSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eS52YWx1ZSA9IHRydWU7IH07XHJcbiAgICBjb25zdCBmb2N1c0hpZ2hsaWdodFZpc2libGVMaXN0ZW5lcjogVElucHV0TGlzdGVuZXIgPSB7fTtcclxuXHJcbiAgICAvLyBSZXN0b3JlIGRpc3BsYXkgb2YgZm9jdXMgaGlnaGxpZ2h0cyBpZiB3ZSByZWNlaXZlIFBET00gZXZlbnRzLiBFeGNsdWRlIGZvY3VzLXJlbGF0ZWQgZXZlbnRzIGhlcmVcclxuICAgIC8vIHNvIHRoYXQgd2UgY2FuIHN1cHBvcnQgc29tZSBpT1MgY2FzZXMgd2hlcmUgd2Ugd2FudCBQRE9NIGJlaGF2aW9yIGV2ZW4gdGhvdWdoIGlPUyArIFZPIG9ubHkgcHJvdmlkZWQgcG9pbnRlclxyXG4gICAgLy8gZXZlbnRzLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzExMzcgZm9yIGRldGFpbHMuXHJcbiAgICAoIFsgJ2NsaWNrJywgJ2lucHV0JywgJ2NoYW5nZScsICdrZXlkb3duJywgJ2tleXVwJyBdIGFzIGNvbnN0ICkuZm9yRWFjaCggZXZlbnRUeXBlID0+IHtcclxuICAgICAgZm9jdXNIaWdobGlnaHRWaXNpYmxlTGlzdGVuZXJbIGV2ZW50VHlwZSBdID0gc2V0SGlnaGxpZ2h0c1Zpc2libGU7XHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLmRpc3BsYXkuYWRkSW5wdXRMaXN0ZW5lciggZm9jdXNIaWdobGlnaHRWaXNpYmxlTGlzdGVuZXIgKTtcclxuXHJcbiAgICAvLyBXaGVuIHRhYmJpbmcgaW50byB0aGUgc2ltLCBtYWtlIGZvY3VzIGhpZ2hsaWdodHMgdmlzaWJsZSAtIG9uIGtleXVwIGJlY2F1c2UgdGhlIGtleWRvd24gaXMgbGlrZWx5IHRvIGhhdmVcclxuICAgIC8vIG9jY3VycmVkIG9uIGFuIGVsZW1lbnQgb3V0c2lkZSBvZiB0aGUgRE9NIHNjb3BlLlxyXG4gICAgZ2xvYmFsS2V5U3RhdGVUcmFja2VyLmtleXVwRW1pdHRlci5hZGRMaXN0ZW5lciggZXZlbnQgPT4ge1xyXG4gICAgICBpZiAoIEtleWJvYXJkVXRpbHMuaXNLZXlFdmVudCggZXZlbnQsIEtleWJvYXJkVXRpbHMuS0VZX1RBQiApICkge1xyXG4gICAgICAgIHNldEhpZ2hsaWdodHNWaXNpYmxlKCk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICBpZiAoIHByZWZlcmVuY2VzTW9kZWwudmlzdWFsTW9kZWwuc3VwcG9ydHNJbnRlcmFjdGl2ZUhpZ2hsaWdodHMgKSB7XHJcblxyXG4gICAgICBwcmVmZXJlbmNlc01vZGVsLnZpc3VhbE1vZGVsLmludGVyYWN0aXZlSGlnaGxpZ2h0c0VuYWJsZWRQcm9wZXJ0eS5saW5rKCB2aXNpYmxlID0+IHtcclxuICAgICAgICB0aGlzLmRpc3BsYXkuZm9jdXNNYW5hZ2VyLmludGVyYWN0aXZlSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eS52YWx1ZSA9IHZpc2libGU7XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIC8vIFdoZW4gYm90aCBJbnRlcmFjdGl2ZSBIaWdobGlnaHRzIGFyZSBlbmFibGVkIGFuZCB0aGUgUERPTSBmb2N1cyBoaWdobGlnaHRzIGFyZSB2aXNpYmxlLCBhZGQgYSBsaXN0ZW5lciB0aGF0XHJcbiAgICAgIC8vIHdpbGwgbWFrZSBmb2N1cyBoaWdobGlnaHRzIGludmlzaWJsZSBhbmQgaW50ZXJhY3RpdmUgaGlnaGxpZ2h0cyB2aXNpYmxlIGlmIHdlIHJlY2VpdmUgYSBjZXJ0YWluIGFtb3VudCBvZlxyXG4gICAgICAvLyBtb3VzZSBtb3ZlbWVudC4gVGhlIGxpc3RlbmVyIGlzIHJlbW92ZWQgYXMgc29vbiBhcyBQRE9NIGZvY3VzIGhpZ2hsaWdodHMgYXJlIG1hZGUgaW52aXNpYmxlIG9yIEludGVyYWN0aXZlXHJcbiAgICAgIC8vIEhpZ2hsaWdodHMgYXJlIGRpc2FibGVkLlxyXG4gICAgICBjb25zdCBpbnRlcmFjdGl2ZUhpZ2hsaWdodHNFbmFibGVkUHJvcGVydHkgPSBwcmVmZXJlbmNlc01vZGVsLnZpc3VhbE1vZGVsLmludGVyYWN0aXZlSGlnaGxpZ2h0c0VuYWJsZWRQcm9wZXJ0eTtcclxuICAgICAgY29uc3QgcGRvbUZvY3VzSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eSA9IHRoaXMuZGlzcGxheS5mb2N1c01hbmFnZXIucGRvbUZvY3VzSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eTtcclxuICAgICAgTXVsdGlsaW5rLm11bHRpbGluayhcclxuICAgICAgICBbIGludGVyYWN0aXZlSGlnaGxpZ2h0c0VuYWJsZWRQcm9wZXJ0eSwgcGRvbUZvY3VzSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eSBdLFxyXG4gICAgICAgICggaW50ZXJhY3RpdmVIaWdobGlnaHRzRW5hYmxlZCwgcGRvbUhpZ2hsaWdodHNWaXNpYmxlICkgPT4ge1xyXG4gICAgICAgICAgaWYgKCBpbnRlcmFjdGl2ZUhpZ2hsaWdodHNFbmFibGVkICYmIHBkb21IaWdobGlnaHRzVmlzaWJsZSApIHtcclxuICAgICAgICAgICAgdGhpcy5kaXNwbGF5LmFkZElucHV0TGlzdGVuZXIoIG1vdmVMaXN0ZW5lciApO1xyXG5cclxuICAgICAgICAgICAgLy8gU2V0dGluZyB0byBudWxsIGluZGljYXRlcyB0aGF0IHdlIHNob3VsZCBzdG9yZSB0aGUgUG9pbnRlci5wb2ludCBhcyB0aGUgaW5pdGlhbFBvaW50ZXJQb2ludCBvbiBuZXh0IG1vdmUuXHJcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhbFBvaW50ZXJQb2ludCA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICAvLyBSZXNldCBkaXN0YW5jZSBvZiBtb3ZlbWVudCBmb3IgdGhlIG1vdXNlIHBvaW50ZXIgc2luY2Ugd2UgYXJlIGxvb2tpbmcgZm9yIGNoYW5nZXMgYWdhaW4uXHJcbiAgICAgICAgICAgIHRoaXMucmVsYXRpdmVQb2ludGVyRGlzdGFuY2UgPSAwO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheS5oYXNJbnB1dExpc3RlbmVyKCBtb3ZlTGlzdGVuZXIgKSAmJiB0aGlzLmRpc3BsYXkucmVtb3ZlSW5wdXRMaXN0ZW5lciggbW92ZUxpc3RlbmVyICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZGlzcGxheS5hZGRJbnB1dExpc3RlbmVyKCB7XHJcblxyXG4gICAgICAvLyBXaGVuZXZlciB3ZSByZWNlaXZlIGEgZG93biBldmVudCBmb2N1cyBoaWdobGlnaHRzIGFyZSBtYWRlIGludmlzaWJsZS4gV2UgbWF5IGFsc28gYmx1ciB0aGUgYWN0aXZlIGVsZW1lbnQgaW5cclxuICAgICAgLy8gc29tZSBjYXNlcywgYnV0IG5vdCBhbHdheXMgYXMgaXMgbmVjZXNzYXJ5IGZvciBpT1MgVm9pY2VPdmVyLiBTZWUgZG9jdW1lbnRhdGlvbiBkZXRhaWxzIGluIHRoZSBmdW5jdGlvbi5cclxuICAgICAgZG93bjogZXZlbnQgPT4ge1xyXG5cclxuICAgICAgICAvLyBBbiBBVCBtaWdodCBoYXZlIHNlbnQgYSBkb3duIGV2ZW50IG91dHNpZGUgb2YgdGhlIGRpc3BsYXksIGlmIHRoaXMgaGFwcGVuZWQgd2Ugd2lsbCBub3QgZG8gYW55dGhpbmdcclxuICAgICAgICAvLyB0byBjaGFuZ2UgZm9jdXNcclxuICAgICAgICBpZiAoIHRoaXMuZGlzcGxheS5ib3VuZHMuY29udGFpbnNQb2ludCggZXZlbnQucG9pbnRlci5wb2ludCApICkge1xyXG5cclxuICAgICAgICAgIC8vIGluIHJlc3BvbnNlIHRvIHBvaW50ZXIgZXZlbnRzLCBhbHdheXMgaGlkZSB0aGUgZm9jdXMgaGlnaGxpZ2h0IHNvIGl0IGlzbid0IGRpc3RyYWN0aW5nXHJcbiAgICAgICAgICB0aGlzLmRpc3BsYXkuZm9jdXNNYW5hZ2VyLnBkb21Gb2N1c0hpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHkudmFsdWUgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAvLyBubyBuZWVkIHRvIGRvIHRoaXMgd29yayB1bmxlc3Mgc29tZSBlbGVtZW50IGluIHRoZSBzaW11bGF0aW9uIGhhcyBmb2N1c1xyXG4gICAgICAgICAgaWYgKCBGb2N1c01hbmFnZXIucGRvbUZvY3VzZWROb2RlICkge1xyXG5cclxuICAgICAgICAgICAgLy8gaWYgdGhlIGV2ZW50IHRyYWlsIGRvZXNuJ3QgaW5jbHVkZSB0aGUgZm9jdXNlZE5vZGUsIGNsZWFyIGl0IC0gb3RoZXJ3aXNlIERPTSBmb2N1cyBpcyBrZXB0IG9uIHRoZVxyXG4gICAgICAgICAgICAvLyBhY3RpdmUgZWxlbWVudCBzbyB0aGF0IGl0IGNhbiByZW1haW4gdGhlIHRhcmdldCBmb3IgYXNzaXN0aXZlIGRldmljZXMgdXNpbmcgcG9pbnRlciBldmVudHNcclxuICAgICAgICAgICAgLy8gb24gYmVoYWxmIG9mIHRoZSB1c2VyLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzExMzdcclxuICAgICAgICAgICAgaWYgKCAhZXZlbnQudHJhaWwubm9kZXMuaW5jbHVkZXMoIEZvY3VzTWFuYWdlci5wZG9tRm9jdXNlZE5vZGUgKSApIHtcclxuICAgICAgICAgICAgICBGb2N1c01hbmFnZXIucGRvbUZvY3VzID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU3dpdGNoZXMgYmV0d2VlbiBmb2N1cyBoaWdobGlnaHRzIGFuZCBJbnRlcmFjdGl2ZSBIaWdobGlnaHRzIGlmIHRoZXJlIGlzIGVub3VnaCBtb3VzZSBtb3ZlbWVudC5cclxuICAgKi9cclxuICBwcml2YXRlIGhhbmRsZU1vdmUoIGV2ZW50OiBTY2VuZXJ5RXZlbnQgKTogdm9pZCB7XHJcblxyXG4gICAgLy8gQSBudWxsIGluaXRpYWxQb2ludGVyUG9pbnQgbWVhbnMgdGhhdCB3ZSBoYXZlIG5vdCBzZXQgdGhlIHBvaW50IHlldCBzaW5jZSB3ZSBzdGFydGVkIGxpc3RlbmluZyBmb3IgbW91c2VcclxuICAgIC8vIG1vdmVtZW50cyAtIHNldCBpdCBub3cgc28gdGhhdCBkaXN0YW5jZSBvZiBtb3NlIG1vdmVtZW50IHdpbGwgYmUgcmVsYXRpdmUgdG8gdGhpcyBpbml0aWFsIHBvaW50LlxyXG4gICAgaWYgKCB0aGlzLmluaXRpYWxQb2ludGVyUG9pbnQgPT09IG51bGwgKSB7XHJcbiAgICAgIHRoaXMuaW5pdGlhbFBvaW50ZXJQb2ludCA9IGV2ZW50LnBvaW50ZXIucG9pbnQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy5yZWxhdGl2ZVBvaW50ZXJEaXN0YW5jZSA9IGV2ZW50LnBvaW50ZXIucG9pbnQuZGlzdGFuY2UoIHRoaXMuaW5pdGlhbFBvaW50ZXJQb2ludCApO1xyXG5cclxuICAgICAgLy8gd2UgaGF2ZSBtb3ZlZCBlbm91Z2ggdG8gc3dpdGNoIGZyb20gZm9jdXMgaGlnaGxpZ2h0cyB0byBJbnRlcmFjdGl2ZSBIaWdobGlnaHRzLiBTZXR0aW5nIHRoZVxyXG4gICAgICAvLyBwZG9tRm9jdXNIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5IHRvIGZhbHNlIHdpbGwgcmVtb3ZlIHRoaXMgbGlzdGVuZXIgZm9yIHVzLlxyXG4gICAgICBpZiAoIHRoaXMucmVsYXRpdmVQb2ludGVyRGlzdGFuY2UgPiBISURFX0ZPQ1VTX0hJR0hMSUdIVFNfTU9WRU1FTlRfVEhSRVNIT0xEICkge1xyXG4gICAgICAgIHRoaXMuZGlzcGxheS5mb2N1c01hbmFnZXIucGRvbUZvY3VzSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eS52YWx1ZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZGlzcGxheS5mb2N1c01hbmFnZXIuaW50ZXJhY3RpdmVIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5LnZhbHVlID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuam9pc3QucmVnaXN0ZXIoICdIaWdobGlnaHRWaXNpYmlsaXR5Q29udHJvbGxlcicsIEhpZ2hsaWdodFZpc2liaWxpdHlDb250cm9sbGVyICk7XHJcbmV4cG9ydCBkZWZhdWx0IEhpZ2hsaWdodFZpc2liaWxpdHlDb250cm9sbGVyOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFNBQVMsTUFBTSw0QkFBNEI7QUFFbEQsU0FBa0JDLFlBQVksRUFBRUMscUJBQXFCLEVBQUVDLGFBQWEsUUFBc0MsNkJBQTZCO0FBQ3ZJLE9BQU9DLEtBQUssTUFBTSxZQUFZO0FBRzlCO0FBQ0E7QUFDQTtBQUNBLE1BQU1DLHdDQUF3QyxHQUFHLEdBQUc7QUFFcEQsTUFBTUMsNkJBQTZCLENBQUM7RUFHbEM7RUFDQTtFQUNBO0VBQ0E7RUFDUUMsbUJBQW1CLEdBQW1CLElBQUk7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