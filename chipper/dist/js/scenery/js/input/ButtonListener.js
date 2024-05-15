// Copyright 2013-2023, University of Colorado Boulder

/**
 * Basic button handling.
 *
 * Uses 4 states:
 * up: mouse not over, not pressed
 * over: mouse over, not pressed
 * down: mouse over, pressed
 * out: mouse not over, pressed
 *
 * TODO: offscreen handling https://github.com/phetsims/scenery/issues/1581
 * TODO: fix enter/exit edge cases for moving nodes or add/remove child, and when touches are created
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import deprecationWarning from '../../../phet-core/js/deprecationWarning.js';
import merge from '../../../phet-core/js/merge.js';
import EventType from '../../../tandem/js/EventType.js';
import IOType from '../../../tandem/js/types/IOType.js';
import { DownUpListener, scenery } from '../imports.js';

/**
 * @deprecated - please use FireListener for new code (set up for the `fire` callback to be easy, and has Properties
 * that can be checked for the other states or complicated cases)
 */
class ButtonListener extends DownUpListener {
  /**
   * Options for the ButtonListener:
   *
   * mouseButton: 0
   * fireOnDown: false // default is to fire on 'up' after 'down', but passing fireOnDown: true will fire on 'down' instead
   * up: null          // Called on an 'up' state change, as up( event, oldState )
   * over: null        // Called on an 'over' state change, as over( event, oldState )
   * down: null        // Called on an 'down' state change, as down( event, oldState )
   * out: null         // Called on an 'out' state change, as out( event, oldState )
   * fire: null        // Called on a state change to/from 'down' (depending on fireOnDown), as fire( event ). Called after the triggering up/over/down event.
   */
  constructor(options) {
    assert && deprecationWarning('ButtonListener is deprecated, please use FireListener instead');
    options = merge({
      // When running in PhET-iO brand, the tandem must be supplied
      phetioType: ButtonListener.ButtonListenerIO,
      phetioState: false,
      phetioEventType: EventType.USER
    }, options);

    // TODO: pass through options https://github.com/phetsims/scenery/issues/1581
    super({
      tandem: options.tandem,
      phetioType: options.phetioType,
      phetioState: options.phetioState,
      mouseButton: options.mouseButton || 0,
      // forward the mouse button, default to 0 (LMB)

      // parameter to DownUpListener, NOT an input listener itself
      down: (event, trail) => {
        this.setButtonState(event, 'down');
      },
      // parameter to DownUpListener, NOT an input listener itself
      up: (event, trail) => {
        this.setButtonState(event, this._overCount > 0 ? 'over' : 'up');
      }
    });

    // @public {string} - 'up', 'over', 'down' or 'out'
    this.buttonState = 'up';

    // @private {number} - how many pointers are over us (track a count, so we can handle multiple pointers gracefully)
    this._overCount = 0;

    // @private {Object} - store the options object so we can call the callbacks
    this._buttonOptions = options;
  }

  /**
   * @public
   *
   * @param {SceneryEvent} event
   * @param {string} state
   */
  setButtonState(event, state) {
    if (state !== this.buttonState) {
      sceneryLog && sceneryLog.InputEvent && sceneryLog.InputEvent(`ButtonListener state change to ${state} from ${this.buttonState} for ${this.downTrail ? this.downTrail.toString() : this.downTrail}`);
      const oldState = this.buttonState;
      this.buttonState = state;
      if (this._buttonOptions[state]) {
        // Record this event to the phet-io data stream, including all downstream events as nested children
        this.phetioStartEvent(state);

        // Then invoke the callback
        this._buttonOptions[state](event, oldState);
        this.phetioEndEvent();
      }
      if (this._buttonOptions.fire && this._overCount > 0 && !this.interrupted && (this._buttonOptions.fireOnDown ? state === 'down' : oldState === 'down')) {
        // Record this event to the phet-io data stream, including all downstream events as nested children
        this.phetioStartEvent('fire');

        // Then fire the event
        this._buttonOptions.fire(event);
        this.phetioEndEvent();
      }
    }
  }

  /**
   * @public (scenery-internal)
   *
   * @param {SceneryEvent} event
   */
  enter(event) {
    sceneryLog && sceneryLog.InputEvent && sceneryLog.InputEvent(`ButtonListener enter for ${this.downTrail ? this.downTrail.toString() : this.downTrail}`);
    this._overCount++;
    if (this._overCount === 1) {
      this.setButtonState(event, this.isDown ? 'down' : 'over');
    }
  }

  /**
   * @public (scenery-internal)
   *
   * @param {SceneryEvent} event
   */
  exit(event) {
    sceneryLog && sceneryLog.InputEvent && sceneryLog.InputEvent(`ButtonListener exit for ${this.downTrail ? this.downTrail.toString() : this.downTrail}`);
    assert && assert(this._overCount > 0, 'Exit events not matched by an enter');
    this._overCount--;
    if (this._overCount === 0) {
      this.setButtonState(event, this.isDown ? 'out' : 'up');
    }
  }

  /**
   * Called from "focus" events (part of the Scenery listener API). On focus the PDOMPointer is over the node
   * with the attached listener, so add to the over count.
   * @private
   *
   * @param {SceneryEvent} event
   */
  focus(event) {
    this.enter(event);
  }

  /**
   * Called from "blur" events (part of the Scenery listener API). On blur, the PDOMPointer leaves the node
   * with this listener so reduce the over count.
   * @private
   *
   * @param {SceneryEvent} event
   */
  blur(event) {
    this.exit(event);
  }

  /**
   * Called with "click" events (part of the Scenery listener API). Typically will be called from a keyboard
   * or assistive device.
   *
   * There are no `keyup` or `keydown` events when an assistive device is active. So we respond generally
   * to the single `click` event, which indicates a logical activation of this button.
   * TODO: This may change after https://github.com/phetsims/scenery/issues/1117 is done, at which point
   * `click` should likely be replaced by `keydown` and `keyup` listeners.
   * @private
   *
   * @param {SceneryEvent} event
   */
  click(event) {
    this.setButtonState(event, 'down');
    this.setButtonState(event, 'up');
  }
}
scenery.register('ButtonListener', ButtonListener);
ButtonListener.ButtonListenerIO = new IOType('ButtonListenerIO', {
  valueType: ButtonListener,
  documentation: 'Button listener',
  events: ['up', 'over', 'down', 'out', 'fire']
});
export default ButtonListener;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJkZXByZWNhdGlvbldhcm5pbmciLCJtZXJnZSIsIkV2ZW50VHlwZSIsIklPVHlwZSIsIkRvd25VcExpc3RlbmVyIiwic2NlbmVyeSIsIkJ1dHRvbkxpc3RlbmVyIiwiY29uc3RydWN0b3IiLCJvcHRpb25zIiwiYXNzZXJ0IiwicGhldGlvVHlwZSIsIkJ1dHRvbkxpc3RlbmVySU8iLCJwaGV0aW9TdGF0ZSIsInBoZXRpb0V2ZW50VHlwZSIsIlVTRVIiLCJ0YW5kZW0iLCJtb3VzZUJ1dHRvbiIsImRvd24iLCJldmVudCIsInRyYWlsIiwic2V0QnV0dG9uU3RhdGUiLCJ1cCIsIl9vdmVyQ291bnQiLCJidXR0b25TdGF0ZSIsIl9idXR0b25PcHRpb25zIiwic3RhdGUiLCJzY2VuZXJ5TG9nIiwiSW5wdXRFdmVudCIsImRvd25UcmFpbCIsInRvU3RyaW5nIiwib2xkU3RhdGUiLCJwaGV0aW9TdGFydEV2ZW50IiwicGhldGlvRW5kRXZlbnQiLCJmaXJlIiwiaW50ZXJydXB0ZWQiLCJmaXJlT25Eb3duIiwiZW50ZXIiLCJpc0Rvd24iLCJleGl0IiwiZm9jdXMiLCJibHVyIiwiY2xpY2siLCJyZWdpc3RlciIsInZhbHVlVHlwZSIsImRvY3VtZW50YXRpb24iLCJldmVudHMiXSwic291cmNlcyI6WyJCdXR0b25MaXN0ZW5lci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxMy0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBCYXNpYyBidXR0b24gaGFuZGxpbmcuXHJcbiAqXHJcbiAqIFVzZXMgNCBzdGF0ZXM6XHJcbiAqIHVwOiBtb3VzZSBub3Qgb3Zlciwgbm90IHByZXNzZWRcclxuICogb3ZlcjogbW91c2Ugb3Zlciwgbm90IHByZXNzZWRcclxuICogZG93bjogbW91c2Ugb3ZlciwgcHJlc3NlZFxyXG4gKiBvdXQ6IG1vdXNlIG5vdCBvdmVyLCBwcmVzc2VkXHJcbiAqXHJcbiAqIFRPRE86IG9mZnNjcmVlbiBoYW5kbGluZyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gKiBUT0RPOiBmaXggZW50ZXIvZXhpdCBlZGdlIGNhc2VzIGZvciBtb3Zpbmcgbm9kZXMgb3IgYWRkL3JlbW92ZSBjaGlsZCwgYW5kIHdoZW4gdG91Y2hlcyBhcmUgY3JlYXRlZFxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IGRlcHJlY2F0aW9uV2FybmluZyBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvZGVwcmVjYXRpb25XYXJuaW5nLmpzJztcclxuaW1wb3J0IG1lcmdlIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9tZXJnZS5qcyc7XHJcbmltcG9ydCBFdmVudFR5cGUgZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL0V2ZW50VHlwZS5qcyc7XHJcbmltcG9ydCBJT1R5cGUgZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL3R5cGVzL0lPVHlwZS5qcyc7XHJcbmltcG9ydCB7IERvd25VcExpc3RlbmVyLCBzY2VuZXJ5IH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcblxyXG4vKipcclxuICogQGRlcHJlY2F0ZWQgLSBwbGVhc2UgdXNlIEZpcmVMaXN0ZW5lciBmb3IgbmV3IGNvZGUgKHNldCB1cCBmb3IgdGhlIGBmaXJlYCBjYWxsYmFjayB0byBiZSBlYXN5LCBhbmQgaGFzIFByb3BlcnRpZXNcclxuICogdGhhdCBjYW4gYmUgY2hlY2tlZCBmb3IgdGhlIG90aGVyIHN0YXRlcyBvciBjb21wbGljYXRlZCBjYXNlcylcclxuICovXHJcbmNsYXNzIEJ1dHRvbkxpc3RlbmVyIGV4dGVuZHMgRG93blVwTGlzdGVuZXIge1xyXG4gIC8qKlxyXG4gICAqIE9wdGlvbnMgZm9yIHRoZSBCdXR0b25MaXN0ZW5lcjpcclxuICAgKlxyXG4gICAqIG1vdXNlQnV0dG9uOiAwXHJcbiAgICogZmlyZU9uRG93bjogZmFsc2UgLy8gZGVmYXVsdCBpcyB0byBmaXJlIG9uICd1cCcgYWZ0ZXIgJ2Rvd24nLCBidXQgcGFzc2luZyBmaXJlT25Eb3duOiB0cnVlIHdpbGwgZmlyZSBvbiAnZG93bicgaW5zdGVhZFxyXG4gICAqIHVwOiBudWxsICAgICAgICAgIC8vIENhbGxlZCBvbiBhbiAndXAnIHN0YXRlIGNoYW5nZSwgYXMgdXAoIGV2ZW50LCBvbGRTdGF0ZSApXHJcbiAgICogb3ZlcjogbnVsbCAgICAgICAgLy8gQ2FsbGVkIG9uIGFuICdvdmVyJyBzdGF0ZSBjaGFuZ2UsIGFzIG92ZXIoIGV2ZW50LCBvbGRTdGF0ZSApXHJcbiAgICogZG93bjogbnVsbCAgICAgICAgLy8gQ2FsbGVkIG9uIGFuICdkb3duJyBzdGF0ZSBjaGFuZ2UsIGFzIGRvd24oIGV2ZW50LCBvbGRTdGF0ZSApXHJcbiAgICogb3V0OiBudWxsICAgICAgICAgLy8gQ2FsbGVkIG9uIGFuICdvdXQnIHN0YXRlIGNoYW5nZSwgYXMgb3V0KCBldmVudCwgb2xkU3RhdGUgKVxyXG4gICAqIGZpcmU6IG51bGwgICAgICAgIC8vIENhbGxlZCBvbiBhIHN0YXRlIGNoYW5nZSB0by9mcm9tICdkb3duJyAoZGVwZW5kaW5nIG9uIGZpcmVPbkRvd24pLCBhcyBmaXJlKCBldmVudCApLiBDYWxsZWQgYWZ0ZXIgdGhlIHRyaWdnZXJpbmcgdXAvb3Zlci9kb3duIGV2ZW50LlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKCBvcHRpb25zICkge1xyXG4gICAgYXNzZXJ0ICYmIGRlcHJlY2F0aW9uV2FybmluZyggJ0J1dHRvbkxpc3RlbmVyIGlzIGRlcHJlY2F0ZWQsIHBsZWFzZSB1c2UgRmlyZUxpc3RlbmVyIGluc3RlYWQnICk7XHJcblxyXG5cclxuICAgIG9wdGlvbnMgPSBtZXJnZSgge1xyXG5cclxuICAgICAgLy8gV2hlbiBydW5uaW5nIGluIFBoRVQtaU8gYnJhbmQsIHRoZSB0YW5kZW0gbXVzdCBiZSBzdXBwbGllZFxyXG4gICAgICBwaGV0aW9UeXBlOiBCdXR0b25MaXN0ZW5lci5CdXR0b25MaXN0ZW5lcklPLFxyXG4gICAgICBwaGV0aW9TdGF0ZTogZmFsc2UsXHJcbiAgICAgIHBoZXRpb0V2ZW50VHlwZTogRXZlbnRUeXBlLlVTRVJcclxuICAgIH0sIG9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyBUT0RPOiBwYXNzIHRocm91Z2ggb3B0aW9ucyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgc3VwZXIoIHtcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbSxcclxuICAgICAgcGhldGlvVHlwZTogb3B0aW9ucy5waGV0aW9UeXBlLFxyXG4gICAgICBwaGV0aW9TdGF0ZTogb3B0aW9ucy5waGV0aW9TdGF0ZSxcclxuXHJcbiAgICAgIG1vdXNlQnV0dG9uOiBvcHRpb25zLm1vdXNlQnV0dG9uIHx8IDAsIC8vIGZvcndhcmQgdGhlIG1vdXNlIGJ1dHRvbiwgZGVmYXVsdCB0byAwIChMTUIpXHJcblxyXG4gICAgICAvLyBwYXJhbWV0ZXIgdG8gRG93blVwTGlzdGVuZXIsIE5PVCBhbiBpbnB1dCBsaXN0ZW5lciBpdHNlbGZcclxuICAgICAgZG93bjogKCBldmVudCwgdHJhaWwgKSA9PiB7XHJcbiAgICAgICAgdGhpcy5zZXRCdXR0b25TdGF0ZSggZXZlbnQsICdkb3duJyApO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gcGFyYW1ldGVyIHRvIERvd25VcExpc3RlbmVyLCBOT1QgYW4gaW5wdXQgbGlzdGVuZXIgaXRzZWxmXHJcbiAgICAgIHVwOiAoIGV2ZW50LCB0cmFpbCApID0+IHtcclxuICAgICAgICB0aGlzLnNldEJ1dHRvblN0YXRlKCBldmVudCwgdGhpcy5fb3ZlckNvdW50ID4gMCA/ICdvdmVyJyA6ICd1cCcgKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIEBwdWJsaWMge3N0cmluZ30gLSAndXAnLCAnb3ZlcicsICdkb3duJyBvciAnb3V0J1xyXG4gICAgdGhpcy5idXR0b25TdGF0ZSA9ICd1cCc7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge251bWJlcn0gLSBob3cgbWFueSBwb2ludGVycyBhcmUgb3ZlciB1cyAodHJhY2sgYSBjb3VudCwgc28gd2UgY2FuIGhhbmRsZSBtdWx0aXBsZSBwb2ludGVycyBncmFjZWZ1bGx5KVxyXG4gICAgdGhpcy5fb3ZlckNvdW50ID0gMDtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7T2JqZWN0fSAtIHN0b3JlIHRoZSBvcHRpb25zIG9iamVjdCBzbyB3ZSBjYW4gY2FsbCB0aGUgY2FsbGJhY2tzXHJcbiAgICB0aGlzLl9idXR0b25PcHRpb25zID0gb3B0aW9ucztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7U2NlbmVyeUV2ZW50fSBldmVudFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZVxyXG4gICAqL1xyXG4gIHNldEJ1dHRvblN0YXRlKCBldmVudCwgc3RhdGUgKSB7XHJcbiAgICBpZiAoIHN0YXRlICE9PSB0aGlzLmJ1dHRvblN0YXRlICkge1xyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRFdmVudCAmJiBzY2VuZXJ5TG9nLklucHV0RXZlbnQoXHJcbiAgICAgICAgYEJ1dHRvbkxpc3RlbmVyIHN0YXRlIGNoYW5nZSB0byAke3N0YXRlfSBmcm9tICR7dGhpcy5idXR0b25TdGF0ZX0gZm9yICR7dGhpcy5kb3duVHJhaWwgPyB0aGlzLmRvd25UcmFpbC50b1N0cmluZygpIDogdGhpcy5kb3duVHJhaWx9YCApO1xyXG4gICAgICBjb25zdCBvbGRTdGF0ZSA9IHRoaXMuYnV0dG9uU3RhdGU7XHJcblxyXG4gICAgICB0aGlzLmJ1dHRvblN0YXRlID0gc3RhdGU7XHJcblxyXG4gICAgICBpZiAoIHRoaXMuX2J1dHRvbk9wdGlvbnNbIHN0YXRlIF0gKSB7XHJcblxyXG4gICAgICAgIC8vIFJlY29yZCB0aGlzIGV2ZW50IHRvIHRoZSBwaGV0LWlvIGRhdGEgc3RyZWFtLCBpbmNsdWRpbmcgYWxsIGRvd25zdHJlYW0gZXZlbnRzIGFzIG5lc3RlZCBjaGlsZHJlblxyXG4gICAgICAgIHRoaXMucGhldGlvU3RhcnRFdmVudCggc3RhdGUgKTtcclxuXHJcbiAgICAgICAgLy8gVGhlbiBpbnZva2UgdGhlIGNhbGxiYWNrXHJcbiAgICAgICAgdGhpcy5fYnV0dG9uT3B0aW9uc1sgc3RhdGUgXSggZXZlbnQsIG9sZFN0YXRlICk7XHJcblxyXG4gICAgICAgIHRoaXMucGhldGlvRW5kRXZlbnQoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCB0aGlzLl9idXR0b25PcHRpb25zLmZpcmUgJiZcclxuICAgICAgICAgICB0aGlzLl9vdmVyQ291bnQgPiAwICYmXHJcbiAgICAgICAgICAgIXRoaXMuaW50ZXJydXB0ZWQgJiZcclxuICAgICAgICAgICAoIHRoaXMuX2J1dHRvbk9wdGlvbnMuZmlyZU9uRG93biA/ICggc3RhdGUgPT09ICdkb3duJyApIDogKCBvbGRTdGF0ZSA9PT0gJ2Rvd24nICkgKSApIHtcclxuXHJcbiAgICAgICAgLy8gUmVjb3JkIHRoaXMgZXZlbnQgdG8gdGhlIHBoZXQtaW8gZGF0YSBzdHJlYW0sIGluY2x1ZGluZyBhbGwgZG93bnN0cmVhbSBldmVudHMgYXMgbmVzdGVkIGNoaWxkcmVuXHJcbiAgICAgICAgdGhpcy5waGV0aW9TdGFydEV2ZW50KCAnZmlyZScgKTtcclxuXHJcbiAgICAgICAgLy8gVGhlbiBmaXJlIHRoZSBldmVudFxyXG4gICAgICAgIHRoaXMuX2J1dHRvbk9wdGlvbnMuZmlyZSggZXZlbnQgKTtcclxuXHJcbiAgICAgICAgdGhpcy5waGV0aW9FbmRFdmVudCgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtTY2VuZXJ5RXZlbnR9IGV2ZW50XHJcbiAgICovXHJcbiAgZW50ZXIoIGV2ZW50ICkge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0RXZlbnQgJiYgc2NlbmVyeUxvZy5JbnB1dEV2ZW50KFxyXG4gICAgICBgQnV0dG9uTGlzdGVuZXIgZW50ZXIgZm9yICR7dGhpcy5kb3duVHJhaWwgPyB0aGlzLmRvd25UcmFpbC50b1N0cmluZygpIDogdGhpcy5kb3duVHJhaWx9YCApO1xyXG4gICAgdGhpcy5fb3ZlckNvdW50Kys7XHJcbiAgICBpZiAoIHRoaXMuX292ZXJDb3VudCA9PT0gMSApIHtcclxuICAgICAgdGhpcy5zZXRCdXR0b25TdGF0ZSggZXZlbnQsIHRoaXMuaXNEb3duID8gJ2Rvd24nIDogJ292ZXInICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtTY2VuZXJ5RXZlbnR9IGV2ZW50XHJcbiAgICovXHJcbiAgZXhpdCggZXZlbnQgKSB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRFdmVudCAmJiBzY2VuZXJ5TG9nLklucHV0RXZlbnQoXHJcbiAgICAgIGBCdXR0b25MaXN0ZW5lciBleGl0IGZvciAke3RoaXMuZG93blRyYWlsID8gdGhpcy5kb3duVHJhaWwudG9TdHJpbmcoKSA6IHRoaXMuZG93blRyYWlsfWAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX292ZXJDb3VudCA+IDAsICdFeGl0IGV2ZW50cyBub3QgbWF0Y2hlZCBieSBhbiBlbnRlcicgKTtcclxuICAgIHRoaXMuX292ZXJDb3VudC0tO1xyXG4gICAgaWYgKCB0aGlzLl9vdmVyQ291bnQgPT09IDAgKSB7XHJcbiAgICAgIHRoaXMuc2V0QnV0dG9uU3RhdGUoIGV2ZW50LCB0aGlzLmlzRG93biA/ICdvdXQnIDogJ3VwJyApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIGZyb20gXCJmb2N1c1wiIGV2ZW50cyAocGFydCBvZiB0aGUgU2NlbmVyeSBsaXN0ZW5lciBBUEkpLiBPbiBmb2N1cyB0aGUgUERPTVBvaW50ZXIgaXMgb3ZlciB0aGUgbm9kZVxyXG4gICAqIHdpdGggdGhlIGF0dGFjaGVkIGxpc3RlbmVyLCBzbyBhZGQgdG8gdGhlIG92ZXIgY291bnQuXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7U2NlbmVyeUV2ZW50fSBldmVudFxyXG4gICAqL1xyXG4gIGZvY3VzKCBldmVudCApIHtcclxuICAgIHRoaXMuZW50ZXIoIGV2ZW50ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgZnJvbSBcImJsdXJcIiBldmVudHMgKHBhcnQgb2YgdGhlIFNjZW5lcnkgbGlzdGVuZXIgQVBJKS4gT24gYmx1ciwgdGhlIFBET01Qb2ludGVyIGxlYXZlcyB0aGUgbm9kZVxyXG4gICAqIHdpdGggdGhpcyBsaXN0ZW5lciBzbyByZWR1Y2UgdGhlIG92ZXIgY291bnQuXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7U2NlbmVyeUV2ZW50fSBldmVudFxyXG4gICAqL1xyXG4gIGJsdXIoIGV2ZW50ICkge1xyXG4gICAgdGhpcy5leGl0KCBldmVudCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIHdpdGggXCJjbGlja1wiIGV2ZW50cyAocGFydCBvZiB0aGUgU2NlbmVyeSBsaXN0ZW5lciBBUEkpLiBUeXBpY2FsbHkgd2lsbCBiZSBjYWxsZWQgZnJvbSBhIGtleWJvYXJkXHJcbiAgICogb3IgYXNzaXN0aXZlIGRldmljZS5cclxuICAgKlxyXG4gICAqIFRoZXJlIGFyZSBubyBga2V5dXBgIG9yIGBrZXlkb3duYCBldmVudHMgd2hlbiBhbiBhc3Npc3RpdmUgZGV2aWNlIGlzIGFjdGl2ZS4gU28gd2UgcmVzcG9uZCBnZW5lcmFsbHlcclxuICAgKiB0byB0aGUgc2luZ2xlIGBjbGlja2AgZXZlbnQsIHdoaWNoIGluZGljYXRlcyBhIGxvZ2ljYWwgYWN0aXZhdGlvbiBvZiB0aGlzIGJ1dHRvbi5cclxuICAgKiBUT0RPOiBUaGlzIG1heSBjaGFuZ2UgYWZ0ZXIgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzExMTcgaXMgZG9uZSwgYXQgd2hpY2ggcG9pbnRcclxuICAgKiBgY2xpY2tgIHNob3VsZCBsaWtlbHkgYmUgcmVwbGFjZWQgYnkgYGtleWRvd25gIGFuZCBga2V5dXBgIGxpc3RlbmVycy5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtTY2VuZXJ5RXZlbnR9IGV2ZW50XHJcbiAgICovXHJcbiAgY2xpY2soIGV2ZW50ICkge1xyXG4gICAgdGhpcy5zZXRCdXR0b25TdGF0ZSggZXZlbnQsICdkb3duJyApO1xyXG4gICAgdGhpcy5zZXRCdXR0b25TdGF0ZSggZXZlbnQsICd1cCcgKTtcclxuICB9XHJcbn1cclxuXHJcbnNjZW5lcnkucmVnaXN0ZXIoICdCdXR0b25MaXN0ZW5lcicsIEJ1dHRvbkxpc3RlbmVyICk7XHJcblxyXG5CdXR0b25MaXN0ZW5lci5CdXR0b25MaXN0ZW5lcklPID0gbmV3IElPVHlwZSggJ0J1dHRvbkxpc3RlbmVySU8nLCB7XHJcbiAgdmFsdWVUeXBlOiBCdXR0b25MaXN0ZW5lcixcclxuICBkb2N1bWVudGF0aW9uOiAnQnV0dG9uIGxpc3RlbmVyJyxcclxuICBldmVudHM6IFsgJ3VwJywgJ292ZXInLCAnZG93bicsICdvdXQnLCAnZmlyZScgXVxyXG59ICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBCdXR0b25MaXN0ZW5lcjsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0Esa0JBQWtCLE1BQU0sNkNBQTZDO0FBQzVFLE9BQU9DLEtBQUssTUFBTSxnQ0FBZ0M7QUFD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