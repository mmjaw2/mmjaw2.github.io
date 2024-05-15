// Copyright 2014-2024, University of Colorado Boulder

/**
 * Basic model for a push button, including over/down/enabled properties.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author John Blanco (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import BooleanProperty from '../../../axon/js/BooleanProperty.js';
import CallbackTimer from '../../../axon/js/CallbackTimer.js';
import Emitter from '../../../axon/js/Emitter.js';
import optionize from '../../../phet-core/js/optionize.js';
import EventType from '../../../tandem/js/EventType.js';
import PhetioObject from '../../../tandem/js/PhetioObject.js';
import Tandem from '../../../tandem/js/Tandem.js';
import sun from '../sun.js';
import ButtonModel from './ButtonModel.js';
export default class PushButtonModel extends ButtonModel {
  // used by ResetAllButton to call functions during reset start/end

  // sends out notifications when the button is released.

  // the event that kicked off the latest fire (including delayed fire-on-hold cases)
  startEvent = null;
  constructor(providedOptions) {
    const options = optionize()({
      fireOnDown: false,
      listener: null,
      interruptListener: null,
      fireOnHold: false,
      fireOnHoldDelay: 400,
      fireOnHoldInterval: 100,
      tandem: Tandem.REQUIRED,
      phetioReadOnly: PhetioObject.DEFAULT_OPTIONS.phetioReadOnly
    }, providedOptions);
    super(options);
    this.isFiringProperty = new BooleanProperty(false);
    this.firedEmitter = new Emitter({
      tandem: options.tandem.createTandem('firedEmitter'),
      phetioDocumentation: 'Emits when the button is fired',
      phetioReadOnly: options.phetioReadOnly,
      phetioEventType: EventType.USER,
      // Order dependencies, so that we can fire our interruptListener before any other listeners without having to
      // create and maintain other emitters.
      hasListenerOrderDependencies: true
    });
    if (options.interruptListener) {
      this.firedEmitter.addListener(() => {
        options.interruptListener(this.startEvent);
      });
    }
    if (options.listener !== null) {
      this.firedEmitter.addListener(options.listener);
    }

    // Create a timer to handle the optional fire-on-hold feature.
    // When that feature is enabled, calling this.fire is delegated to the timer.
    if (options.fireOnHold) {
      this.timer = new CallbackTimer({
        callback: this.fire.bind(this),
        delay: options.fireOnHoldDelay,
        interval: options.fireOnHoldInterval
      });
    }

    // Point down
    const downPropertyObserver = down => {
      if (down) {
        if (this.enabledProperty.get()) {
          this.startEvent = phet?.joist?.display?._input?.currentSceneryEvent || null;
          if (options.fireOnDown) {
            this.fire();
          }
          if (this.timer) {
            this.timer.start();
          }
          if (options.fireOnDown || this.timer) {
            this.produceSoundEmitter.emit();
          }
        }
      } else {
        // should the button fire?
        const fire = !options.fireOnDown && (this.overProperty.get() || this.focusedProperty.get()) && this.enabledProperty.get() && !this.interrupted;
        if (this.timer) {
          this.timer.stop(fire);
        } else if (fire) {
          // Produce sound before firing, in case firing causes the disposal of this PushButtonModel
          this.produceSoundEmitter.emit();
          this.fire();
        }
      }
    };
    this.downProperty.link(downPropertyObserver);

    // Stop the timer when the button is disabled.
    const enabledPropertyObserver = enabled => {
      if (!enabled && this.timer) {
        this.timer.stop(false); // Stop the timer, don't fire if we haven't already
      }
    };
    this.enabledProperty.link(enabledPropertyObserver);
    this.disposePushButtonModel = () => {
      // If the button was firing, we must complete the PhET-iO transaction before disposing.
      // see https://github.com/phetsims/energy-skate-park-basics/issues/380
      this.isFiringProperty.value = false;
      this.isFiringProperty.dispose();
      this.firedEmitter.dispose();
      this.downProperty.unlink(downPropertyObserver);
      this.enabledProperty.unlink(enabledPropertyObserver);
      if (this.timer) {
        this.timer.dispose();
        this.timer = null;
      }
    };
  }
  dispose() {
    this.disposePushButtonModel();
    super.dispose();
  }

  /**
   * Adds a listener. If already a listener, this is a no-op.
   * @param listener - function called when the button is pressed, no args
   */
  addListener(listener) {
    this.firedEmitter.addListener(listener);
  }

  /**
   * Removes a listener. If not a listener, this is a no-op.
   */
  removeListener(listener) {
    this.firedEmitter.removeListener(listener);
  }

  /**
   * Fires all listeners.  Public for phet-io and a11y use.
   */
  fire() {
    // Make sure the button is not already firing, see https://github.com/phetsims/energy-skate-park-basics/issues/380
    assert && assert(!this.isFiringProperty.value, 'Cannot fire when already firing');
    this.isFiringProperty.value = true;
    this.firedEmitter.emit();
    this.isFiringProperty.value = false;
  }
}
sun.register('PushButtonModel', PushButtonModel);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJDYWxsYmFja1RpbWVyIiwiRW1pdHRlciIsIm9wdGlvbml6ZSIsIkV2ZW50VHlwZSIsIlBoZXRpb09iamVjdCIsIlRhbmRlbSIsInN1biIsIkJ1dHRvbk1vZGVsIiwiUHVzaEJ1dHRvbk1vZGVsIiwic3RhcnRFdmVudCIsImNvbnN0cnVjdG9yIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsImZpcmVPbkRvd24iLCJsaXN0ZW5lciIsImludGVycnVwdExpc3RlbmVyIiwiZmlyZU9uSG9sZCIsImZpcmVPbkhvbGREZWxheSIsImZpcmVPbkhvbGRJbnRlcnZhbCIsInRhbmRlbSIsIlJFUVVJUkVEIiwicGhldGlvUmVhZE9ubHkiLCJERUZBVUxUX09QVElPTlMiLCJpc0ZpcmluZ1Byb3BlcnR5IiwiZmlyZWRFbWl0dGVyIiwiY3JlYXRlVGFuZGVtIiwicGhldGlvRG9jdW1lbnRhdGlvbiIsInBoZXRpb0V2ZW50VHlwZSIsIlVTRVIiLCJoYXNMaXN0ZW5lck9yZGVyRGVwZW5kZW5jaWVzIiwiYWRkTGlzdGVuZXIiLCJ0aW1lciIsImNhbGxiYWNrIiwiZmlyZSIsImJpbmQiLCJkZWxheSIsImludGVydmFsIiwiZG93blByb3BlcnR5T2JzZXJ2ZXIiLCJkb3duIiwiZW5hYmxlZFByb3BlcnR5IiwiZ2V0IiwicGhldCIsImpvaXN0IiwiZGlzcGxheSIsIl9pbnB1dCIsImN1cnJlbnRTY2VuZXJ5RXZlbnQiLCJzdGFydCIsInByb2R1Y2VTb3VuZEVtaXR0ZXIiLCJlbWl0Iiwib3ZlclByb3BlcnR5IiwiZm9jdXNlZFByb3BlcnR5IiwiaW50ZXJydXB0ZWQiLCJzdG9wIiwiZG93blByb3BlcnR5IiwibGluayIsImVuYWJsZWRQcm9wZXJ0eU9ic2VydmVyIiwiZW5hYmxlZCIsImRpc3Bvc2VQdXNoQnV0dG9uTW9kZWwiLCJ2YWx1ZSIsImRpc3Bvc2UiLCJ1bmxpbmsiLCJyZW1vdmVMaXN0ZW5lciIsImFzc2VydCIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiUHVzaEJ1dHRvbk1vZGVsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE0LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEJhc2ljIG1vZGVsIGZvciBhIHB1c2ggYnV0dG9uLCBpbmNsdWRpbmcgb3Zlci9kb3duL2VuYWJsZWQgcHJvcGVydGllcy5cclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBKb2huIEJsYW5jbyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICovXHJcblxyXG5pbXBvcnQgQm9vbGVhblByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvQm9vbGVhblByb3BlcnR5LmpzJztcclxuaW1wb3J0IENhbGxiYWNrVGltZXIgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9DYWxsYmFja1RpbWVyLmpzJztcclxuaW1wb3J0IEVtaXR0ZXIgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9FbWl0dGVyLmpzJztcclxuaW1wb3J0IFRFbWl0dGVyIGZyb20gJy4uLy4uLy4uL2F4b24vanMvVEVtaXR0ZXIuanMnO1xyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBFdmVudFR5cGUgZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL0V2ZW50VHlwZS5qcyc7XHJcbmltcG9ydCBQaGV0aW9PYmplY3QgZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL1BoZXRpb09iamVjdC5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcbmltcG9ydCBzdW4gZnJvbSAnLi4vc3VuLmpzJztcclxuaW1wb3J0IEJ1dHRvbk1vZGVsLCB7IEJ1dHRvbk1vZGVsT3B0aW9ucyB9IGZyb20gJy4vQnV0dG9uTW9kZWwuanMnO1xyXG5pbXBvcnQgeyBTY2VuZXJ5RXZlbnQgfSBmcm9tICcuLi8uLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5cclxuZXhwb3J0IHR5cGUgUHVzaEJ1dHRvbkxpc3RlbmVyID0gKCkgPT4gdm9pZDtcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcblxyXG4gIC8vIHRydWU6IGZpcmUgb24gcG9pbnRlciBkb3duOyBmYWxzZTogZmlyZSBvbiBwb2ludGVyIHVwIGlmIHBvaW50ZXIgaXMgb3ZlciBidXR0b25cclxuICBmaXJlT25Eb3duPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gY29udmVuaWVuY2UgZm9yIGFkZGluZyAxIGxpc3RlbmVyLCBubyBhcmdzXHJcbiAgbGlzdGVuZXI/OiBQdXNoQnV0dG9uTGlzdGVuZXIgfCBudWxsO1xyXG5cclxuICAvLyBhIGxpc3RlbmVyIHRoYXQgZ2V0cyBmaXJlZCBiZWZvcmUgb3RoZXIgbGlzdGVuZXJzIG9uIHRoaXMgYnV0dG9uLCB3aXRoIHRoZSBleHByZXNzIHB1cnBvc2Ugb2YganVzdCBpbnRlcnJ1cHRpbmdcclxuICAvLyBvdGhlciBpbnB1dC9wb2ludGVycyBmb3IgYmV0dGVyIG11bHRpLXRvdWNoIHN1cHBvcnQuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc3VuL2lzc3Vlcy84NThcclxuICBpbnRlcnJ1cHRMaXN0ZW5lcj86ICggKCBldmVudDogU2NlbmVyeUV2ZW50IHwgbnVsbCApID0+IHZvaWQgKSB8IG51bGw7XHJcblxyXG4gIC8vIGZpcmUtb24taG9sZCBmZWF0dXJlXHJcbiAgLy8gVE9ETzogdGhlc2Ugb3B0aW9ucyBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIFBET00gaW50ZXJhY3Rpb24sIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTExN1xyXG4gIGZpcmVPbkhvbGQ/OiBib29sZWFuOyAvLyBpcyB0aGUgZmlyZS1vbi1ob2xkIGZlYXR1cmUgZW5hYmxlZD9cclxuICBmaXJlT25Ib2xkRGVsYXk/OiBudW1iZXI7IC8vIHN0YXJ0IHRvIGZpcmUgY29udGludW91c2x5IGFmdGVyIHByZXNzaW5nIGZvciB0aGlzIGxvbmcgKG1pbGxpc2Vjb25kcylcclxuICBmaXJlT25Ib2xkSW50ZXJ2YWw/OiBudW1iZXI7IC8vIGZpcmUgY29udGludW91c2x5IGF0IHRoaXMgaW50ZXJ2YWwgKG1pbGxpc2Vjb25kcyksIHNhbWUgZGVmYXVsdCBhcyBpbiBCdXR0b25Nb2RlbFxyXG5cclxuICAvLyB0byBzdXBwb3J0IHByb3Blcmx5IHBhc3NpbmcgdGhpcyB0byBjaGlsZHJlbiwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy90YW5kZW0vaXNzdWVzLzYwXHJcbiAgcGhldGlvUmVhZE9ubHk/OiBib29sZWFuO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgUHVzaEJ1dHRvbk1vZGVsT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgQnV0dG9uTW9kZWxPcHRpb25zO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHVzaEJ1dHRvbk1vZGVsIGV4dGVuZHMgQnV0dG9uTW9kZWwge1xyXG5cclxuICAvLyB1c2VkIGJ5IFJlc2V0QWxsQnV0dG9uIHRvIGNhbGwgZnVuY3Rpb25zIGR1cmluZyByZXNldCBzdGFydC9lbmRcclxuICBwdWJsaWMgcmVhZG9ubHkgaXNGaXJpbmdQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8vIHNlbmRzIG91dCBub3RpZmljYXRpb25zIHdoZW4gdGhlIGJ1dHRvbiBpcyByZWxlYXNlZC5cclxuICBwcml2YXRlIHJlYWRvbmx5IGZpcmVkRW1pdHRlcjogVEVtaXR0ZXI7XHJcblxyXG4gIHByaXZhdGUgdGltZXI/OiBDYWxsYmFja1RpbWVyIHwgbnVsbDtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNwb3NlUHVzaEJ1dHRvbk1vZGVsOiAoKSA9PiB2b2lkO1xyXG5cclxuICAvLyB0aGUgZXZlbnQgdGhhdCBraWNrZWQgb2ZmIHRoZSBsYXRlc3QgZmlyZSAoaW5jbHVkaW5nIGRlbGF5ZWQgZmlyZS1vbi1ob2xkIGNhc2VzKVxyXG4gIHByaXZhdGUgc3RhcnRFdmVudDogU2NlbmVyeUV2ZW50IHwgbnVsbCA9IG51bGw7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggcHJvdmlkZWRPcHRpb25zPzogUHVzaEJ1dHRvbk1vZGVsT3B0aW9ucyApIHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPFB1c2hCdXR0b25Nb2RlbE9wdGlvbnMsIFNlbGZPcHRpb25zLCBCdXR0b25Nb2RlbE9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgIGZpcmVPbkRvd246IGZhbHNlLFxyXG4gICAgICBsaXN0ZW5lcjogbnVsbCxcclxuICAgICAgaW50ZXJydXB0TGlzdGVuZXI6IG51bGwsXHJcbiAgICAgIGZpcmVPbkhvbGQ6IGZhbHNlLFxyXG4gICAgICBmaXJlT25Ib2xkRGVsYXk6IDQwMCxcclxuICAgICAgZmlyZU9uSG9sZEludGVydmFsOiAxMDAsXHJcblxyXG4gICAgICB0YW5kZW06IFRhbmRlbS5SRVFVSVJFRCxcclxuICAgICAgcGhldGlvUmVhZE9ubHk6IFBoZXRpb09iamVjdC5ERUZBVUxUX09QVElPTlMucGhldGlvUmVhZE9ubHlcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIHN1cGVyKCBvcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy5pc0ZpcmluZ1Byb3BlcnR5ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggZmFsc2UgKTtcclxuXHJcbiAgICB0aGlzLmZpcmVkRW1pdHRlciA9IG5ldyBFbWl0dGVyKCB7XHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAnZmlyZWRFbWl0dGVyJyApLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnRW1pdHMgd2hlbiB0aGUgYnV0dG9uIGlzIGZpcmVkJyxcclxuICAgICAgcGhldGlvUmVhZE9ubHk6IG9wdGlvbnMucGhldGlvUmVhZE9ubHksXHJcbiAgICAgIHBoZXRpb0V2ZW50VHlwZTogRXZlbnRUeXBlLlVTRVIsXHJcblxyXG4gICAgICAvLyBPcmRlciBkZXBlbmRlbmNpZXMsIHNvIHRoYXQgd2UgY2FuIGZpcmUgb3VyIGludGVycnVwdExpc3RlbmVyIGJlZm9yZSBhbnkgb3RoZXIgbGlzdGVuZXJzIHdpdGhvdXQgaGF2aW5nIHRvXHJcbiAgICAgIC8vIGNyZWF0ZSBhbmQgbWFpbnRhaW4gb3RoZXIgZW1pdHRlcnMuXHJcbiAgICAgIGhhc0xpc3RlbmVyT3JkZXJEZXBlbmRlbmNpZXM6IHRydWVcclxuICAgIH0gKTtcclxuXHJcbiAgICBpZiAoIG9wdGlvbnMuaW50ZXJydXB0TGlzdGVuZXIgKSB7XHJcbiAgICAgIHRoaXMuZmlyZWRFbWl0dGVyLmFkZExpc3RlbmVyKCAoKSA9PiB7XHJcbiAgICAgICAgb3B0aW9ucy5pbnRlcnJ1cHRMaXN0ZW5lciEoIHRoaXMuc3RhcnRFdmVudCApO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBvcHRpb25zLmxpc3RlbmVyICE9PSBudWxsICkge1xyXG4gICAgICB0aGlzLmZpcmVkRW1pdHRlci5hZGRMaXN0ZW5lciggb3B0aW9ucy5saXN0ZW5lciApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENyZWF0ZSBhIHRpbWVyIHRvIGhhbmRsZSB0aGUgb3B0aW9uYWwgZmlyZS1vbi1ob2xkIGZlYXR1cmUuXHJcbiAgICAvLyBXaGVuIHRoYXQgZmVhdHVyZSBpcyBlbmFibGVkLCBjYWxsaW5nIHRoaXMuZmlyZSBpcyBkZWxlZ2F0ZWQgdG8gdGhlIHRpbWVyLlxyXG4gICAgaWYgKCBvcHRpb25zLmZpcmVPbkhvbGQgKSB7XHJcbiAgICAgIHRoaXMudGltZXIgPSBuZXcgQ2FsbGJhY2tUaW1lcigge1xyXG4gICAgICAgIGNhbGxiYWNrOiB0aGlzLmZpcmUuYmluZCggdGhpcyApLFxyXG4gICAgICAgIGRlbGF5OiBvcHRpb25zLmZpcmVPbkhvbGREZWxheSxcclxuICAgICAgICBpbnRlcnZhbDogb3B0aW9ucy5maXJlT25Ib2xkSW50ZXJ2YWxcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFBvaW50IGRvd25cclxuICAgIGNvbnN0IGRvd25Qcm9wZXJ0eU9ic2VydmVyID0gKCBkb3duOiBib29sZWFuICkgPT4ge1xyXG4gICAgICBpZiAoIGRvd24gKSB7XHJcbiAgICAgICAgaWYgKCB0aGlzLmVuYWJsZWRQcm9wZXJ0eS5nZXQoKSApIHtcclxuICAgICAgICAgIHRoaXMuc3RhcnRFdmVudCA9IHBoZXQ/LmpvaXN0Py5kaXNwbGF5Py5faW5wdXQ/LmN1cnJlbnRTY2VuZXJ5RXZlbnQgfHwgbnVsbDtcclxuXHJcbiAgICAgICAgICBpZiAoIG9wdGlvbnMuZmlyZU9uRG93biApIHtcclxuICAgICAgICAgICAgdGhpcy5maXJlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoIHRoaXMudGltZXIgKSB7XHJcbiAgICAgICAgICAgIHRoaXMudGltZXIuc3RhcnQoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICggb3B0aW9ucy5maXJlT25Eb3duIHx8IHRoaXMudGltZXIgKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvZHVjZVNvdW5kRW1pdHRlci5lbWl0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICAvLyBzaG91bGQgdGhlIGJ1dHRvbiBmaXJlP1xyXG4gICAgICAgIGNvbnN0IGZpcmUgPSAoICFvcHRpb25zLmZpcmVPbkRvd24gJiYgKCB0aGlzLm92ZXJQcm9wZXJ0eS5nZXQoKSB8fCB0aGlzLmZvY3VzZWRQcm9wZXJ0eS5nZXQoKSApICYmIHRoaXMuZW5hYmxlZFByb3BlcnR5LmdldCgpICYmICF0aGlzLmludGVycnVwdGVkICk7XHJcbiAgICAgICAgaWYgKCB0aGlzLnRpbWVyICkge1xyXG4gICAgICAgICAgdGhpcy50aW1lci5zdG9wKCBmaXJlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCBmaXJlICkge1xyXG5cclxuICAgICAgICAgIC8vIFByb2R1Y2Ugc291bmQgYmVmb3JlIGZpcmluZywgaW4gY2FzZSBmaXJpbmcgY2F1c2VzIHRoZSBkaXNwb3NhbCBvZiB0aGlzIFB1c2hCdXR0b25Nb2RlbFxyXG4gICAgICAgICAgdGhpcy5wcm9kdWNlU291bmRFbWl0dGVyLmVtaXQoKTtcclxuICAgICAgICAgIHRoaXMuZmlyZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIHRoaXMuZG93blByb3BlcnR5LmxpbmsoIGRvd25Qcm9wZXJ0eU9ic2VydmVyICk7XHJcblxyXG4gICAgLy8gU3RvcCB0aGUgdGltZXIgd2hlbiB0aGUgYnV0dG9uIGlzIGRpc2FibGVkLlxyXG4gICAgY29uc3QgZW5hYmxlZFByb3BlcnR5T2JzZXJ2ZXIgPSAoIGVuYWJsZWQ6IGJvb2xlYW4gKSA9PiB7XHJcbiAgICAgIGlmICggIWVuYWJsZWQgJiYgdGhpcy50aW1lciApIHtcclxuICAgICAgICB0aGlzLnRpbWVyLnN0b3AoIGZhbHNlICk7IC8vIFN0b3AgdGhlIHRpbWVyLCBkb24ndCBmaXJlIGlmIHdlIGhhdmVuJ3QgYWxyZWFkeVxyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgdGhpcy5lbmFibGVkUHJvcGVydHkubGluayggZW5hYmxlZFByb3BlcnR5T2JzZXJ2ZXIgKTtcclxuXHJcbiAgICB0aGlzLmRpc3Bvc2VQdXNoQnV0dG9uTW9kZWwgPSAoKSA9PiB7XHJcblxyXG4gICAgICAvLyBJZiB0aGUgYnV0dG9uIHdhcyBmaXJpbmcsIHdlIG11c3QgY29tcGxldGUgdGhlIFBoRVQtaU8gdHJhbnNhY3Rpb24gYmVmb3JlIGRpc3Bvc2luZy5cclxuICAgICAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9lbmVyZ3ktc2thdGUtcGFyay1iYXNpY3MvaXNzdWVzLzM4MFxyXG4gICAgICB0aGlzLmlzRmlyaW5nUHJvcGVydHkudmFsdWUgPSBmYWxzZTtcclxuICAgICAgdGhpcy5pc0ZpcmluZ1Byb3BlcnR5LmRpc3Bvc2UoKTtcclxuICAgICAgdGhpcy5maXJlZEVtaXR0ZXIuZGlzcG9zZSgpO1xyXG4gICAgICB0aGlzLmRvd25Qcm9wZXJ0eS51bmxpbmsoIGRvd25Qcm9wZXJ0eU9ic2VydmVyICk7XHJcbiAgICAgIHRoaXMuZW5hYmxlZFByb3BlcnR5LnVubGluayggZW5hYmxlZFByb3BlcnR5T2JzZXJ2ZXIgKTtcclxuICAgICAgaWYgKCB0aGlzLnRpbWVyICkge1xyXG4gICAgICAgIHRoaXMudGltZXIuZGlzcG9zZSgpO1xyXG4gICAgICAgIHRoaXMudGltZXIgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmRpc3Bvc2VQdXNoQnV0dG9uTW9kZWwoKTtcclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYSBsaXN0ZW5lci4gSWYgYWxyZWFkeSBhIGxpc3RlbmVyLCB0aGlzIGlzIGEgbm8tb3AuXHJcbiAgICogQHBhcmFtIGxpc3RlbmVyIC0gZnVuY3Rpb24gY2FsbGVkIHdoZW4gdGhlIGJ1dHRvbiBpcyBwcmVzc2VkLCBubyBhcmdzXHJcbiAgICovXHJcbiAgcHVibGljIGFkZExpc3RlbmVyKCBsaXN0ZW5lcjogUHVzaEJ1dHRvbkxpc3RlbmVyICk6IHZvaWQge1xyXG4gICAgdGhpcy5maXJlZEVtaXR0ZXIuYWRkTGlzdGVuZXIoIGxpc3RlbmVyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmVzIGEgbGlzdGVuZXIuIElmIG5vdCBhIGxpc3RlbmVyLCB0aGlzIGlzIGEgbm8tb3AuXHJcbiAgICovXHJcbiAgcHVibGljIHJlbW92ZUxpc3RlbmVyKCBsaXN0ZW5lcjogUHVzaEJ1dHRvbkxpc3RlbmVyICk6IHZvaWQge1xyXG4gICAgdGhpcy5maXJlZEVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoIGxpc3RlbmVyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGaXJlcyBhbGwgbGlzdGVuZXJzLiAgUHVibGljIGZvciBwaGV0LWlvIGFuZCBhMTF5IHVzZS5cclxuICAgKi9cclxuICBwdWJsaWMgZmlyZSgpOiB2b2lkIHtcclxuXHJcbiAgICAvLyBNYWtlIHN1cmUgdGhlIGJ1dHRvbiBpcyBub3QgYWxyZWFkeSBmaXJpbmcsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZW5lcmd5LXNrYXRlLXBhcmstYmFzaWNzL2lzc3Vlcy8zODBcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLmlzRmlyaW5nUHJvcGVydHkudmFsdWUsICdDYW5ub3QgZmlyZSB3aGVuIGFscmVhZHkgZmlyaW5nJyApO1xyXG4gICAgdGhpcy5pc0ZpcmluZ1Byb3BlcnR5LnZhbHVlID0gdHJ1ZTtcclxuICAgIHRoaXMuZmlyZWRFbWl0dGVyLmVtaXQoKTtcclxuICAgIHRoaXMuaXNGaXJpbmdQcm9wZXJ0eS52YWx1ZSA9IGZhbHNlO1xyXG4gIH1cclxufVxyXG5cclxuc3VuLnJlZ2lzdGVyKCAnUHVzaEJ1dHRvbk1vZGVsJywgUHVzaEJ1dHRvbk1vZGVsICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxlQUFlLE1BQU0scUNBQXFDO0FBQ2pFLE9BQU9DLGFBQWEsTUFBTSxtQ0FBbUM7QUFDN0QsT0FBT0MsT0FBTyxNQUFNLDZCQUE2QjtBQUdqRCxPQUFPQyxTQUFTLE1BQU0sb0NBQW9DO0FBQzFELE9BQU9DLFNBQVMsTUFB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