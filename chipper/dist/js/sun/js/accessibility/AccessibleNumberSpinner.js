// Copyright 2018-2024, University of Colorado Boulder

/**
 * A trait for subtypes of Node, used to make the Node behave like a 'number' input with assistive technology.
 * An accessible number spinner behaves like:
 *
 * - Arrow keys increment/decrement the value by a specified step size.
 * - Page Up and Page Down increments/decrements value by an alternative step size, usually larger than default.
 * - Home key sets value to its minimum.
 * - End key sets value to its maximum.
 *
 * This number spinner is different than typical 'number' inputs because it does not support number key control. It
 * was determined that an input of type range is the best match for a PhET Number Spinner, with a custom role
 * description with aria-roledescription. See https://github.com/phetsims/sun/issues/497 for history on this
 * decision.
 *
 * This trait mixes in a "parent" mixin to handle general "value" formatting and aria-valuetext updating, see
 * AccessibleValueHandler.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Michael Barlow (PhET Interactive Simulations)
 */

import CallbackTimer from '../../../axon/js/CallbackTimer.js';
import Emitter from '../../../axon/js/Emitter.js';
import validate from '../../../axon/js/validate.js';
import assertHasProperties from '../../../phet-core/js/assertHasProperties.js';
import { combineOptions } from '../../../phet-core/js/optionize.js';
import Orientation from '../../../phet-core/js/Orientation.js';
import { DelayedMutate, KeyboardUtils } from '../../../scenery/js/imports.js';
import sun from '../sun.js';
import SunStrings from '../SunStrings.js';
import AccessibleValueHandler from './AccessibleValueHandler.js';
const ACCESSIBLE_NUMBER_SPINNER_OPTIONS = ['pdomTimerDelay', 'pdomTimerInterval'];
/**
 * @param Type
 * @param optionsArgPosition - zero-indexed number that the options argument is provided at
 */
const AccessibleNumberSpinner = (Type, optionsArgPosition) => {
  const AccessibleNumberSpinnerClass = DelayedMutate('AccessibleNumberSpinner', ACCESSIBLE_NUMBER_SPINNER_OPTIONS, class AccessibleNumberSpinner extends AccessibleValueHandler(Type, optionsArgPosition) {
    // Manages timing must be disposed

    // Emits events when increment and decrement actions occur, but only for changes of keyboardStep and
    // shiftKeyboardStep (not pageKeyboardStep). Indicates "normal" usage with a keyboard, so that components
    // composed with this trait can style themselves differently when the keyboard is being used.
    // @mixin-protected - made public for use in the mixin only

    _pdomTimerDelay = 400;
    _pdomTimerInterval = 100;
    constructor(...args) {
      const providedOptions = args[optionsArgPosition];
      assert && providedOptions && assert(Object.getPrototypeOf(providedOptions) === Object.prototype, 'Extra prototype on AccessibleSlider options object is a code smell (or probably a bug)');
      const options = combineOptions({
        ariaOrientation: Orientation.VERTICAL // by default, number spinners should be oriented vertically
      }, providedOptions);
      args[optionsArgPosition] = options;
      super(...args);

      // members of the Node API that are used by this trait
      assertHasProperties(this, ['addInputListener']);
      this._callbackTimer = new CallbackTimer({
        delay: this._pdomTimerDelay,
        interval: this._pdomTimerInterval
      });
      this.pdomIncrementDownEmitter = new Emitter({
        parameters: [{
          valueType: 'boolean'
        }]
      });
      this.pdomDecrementDownEmitter = new Emitter({
        parameters: [{
          valueType: 'boolean'
        }]
      });
      this.setPDOMAttribute('aria-roledescription', SunStrings.a11y.numberSpinnerRoleDescriptionStringProperty);

      // a callback that is added and removed from the timer depending on keystate
      let downCallback = null;
      let runningTimerCallbackEvent = null; // {Event|null}

      // handle all accessible event input
      const accessibleInputListener = {
        keydown: event => {
          if (this.enabledProperty.get()) {
            // check for relevant keys here
            if (KeyboardUtils.isRangeKey(event.domEvent)) {
              const domEvent = event.domEvent;

              // If the meta key is down we will not even call the keydown listener of the supertype, so we need
              // to be sure that default behavior is prevented so we don't receive `input` and `change` events.
              // See AccessibleValueHandler.handleInput for information on these events and why we don't want
              // to change in response to them.
              domEvent.preventDefault();

              // When the meta key is down Mac will not send keyup events so do not change values or add timer
              // listeners because they will never be removed since we fail to get a keyup event. See
              if (!domEvent.metaKey) {
                if (!this._callbackTimer.isRunning()) {
                  this._accessibleNumberSpinnerHandleKeyDown(event);
                  downCallback = this._accessibleNumberSpinnerHandleKeyDown.bind(this, event);
                  runningTimerCallbackEvent = domEvent;
                  this._callbackTimer.addCallback(downCallback);
                  this._callbackTimer.start();
                }
              }
            }
          }
        },
        keyup: event => {
          const key = KeyboardUtils.getEventCode(event.domEvent);
          if (KeyboardUtils.isRangeKey(event.domEvent)) {
            if (runningTimerCallbackEvent && key === KeyboardUtils.getEventCode(runningTimerCallbackEvent)) {
              this._emitKeyState(event.domEvent, false);
              this._callbackTimer.stop(false);
              assert && assert(downCallback);
              this._callbackTimer.removeCallback(downCallback);
              downCallback = null;
              runningTimerCallbackEvent = null;
            }
            this.handleKeyUp(event);
          }
        },
        blur: event => {
          // if a key is currently down when focus leaves the spinner, stop callbacks and emit that the
          // key is up
          if (downCallback) {
            assert && assert(runningTimerCallbackEvent !== null, 'key should be down if running downCallback');
            this._emitKeyState(runningTimerCallbackEvent, false);
            this._callbackTimer.stop(false);
            this._callbackTimer.removeCallback(downCallback);
          }
          this.handleBlur(event);
        },
        input: this.handleInput.bind(this),
        change: this.handleChange.bind(this)
      };
      this.addInputListener(accessibleInputListener);
      this._disposeAccessibleNumberSpinner = () => {
        this._callbackTimer.dispose();

        // emitters owned by this instance, can be disposed here
        this.pdomIncrementDownEmitter.dispose();
        this.pdomDecrementDownEmitter.dispose();
        this.removeInputListener(accessibleInputListener);
      };
    }
    set pdomTimerDelay(value) {
      this._pdomTimerDelay = value;
      if (this._callbackTimer) {
        this._callbackTimer.delay = value;
      }
    }
    get pdomTimerDelay() {
      return this._pdomTimerDelay;
    }
    set pdomTimerInterval(value) {
      this._pdomTimerInterval = value;
      if (this._callbackTimer) {
        this._callbackTimer.interval = value;
      }
    }
    get pdomTimerInterval() {
      return this._pdomTimerInterval;
    }

    /**
     * Handle the keydown event and emit events related to the user interaction. Ideally, this would
     * override AccessibleValueHandler.handleKeyDown, but overriding is not supported with PhET Trait pattern.
     */

    _accessibleNumberSpinnerHandleKeyDown(event) {
      assert && assert(event.domEvent, 'must have a domEvent');
      this.handleKeyDown(event);
      this._emitKeyState(event.domEvent, true);
    }

    /**
     * Emit events related to the keystate of the spinner. Typically used to style the spinner during keyboard
     * interaction.
     *
     * @param domEvent - the code of the key changing state
     * @param isDown - whether or not event was triggered from down or up keys
     */

    _emitKeyState(domEvent, isDown) {
      validate(domEvent, {
        valueType: Event
      });
      if (KeyboardUtils.isAnyKeyEvent(domEvent, [KeyboardUtils.KEY_UP_ARROW, KeyboardUtils.KEY_RIGHT_ARROW])) {
        this.pdomIncrementDownEmitter.emit(isDown);
      } else if (KeyboardUtils.isAnyKeyEvent(domEvent, [KeyboardUtils.KEY_DOWN_ARROW, KeyboardUtils.KEY_LEFT_ARROW])) {
        this.pdomDecrementDownEmitter.emit(isDown);
      }
    }
    dispose() {
      this._disposeAccessibleNumberSpinner();
      super.dispose();
    }
  });

  /**
   * {Array.<string>} - String keys for all the allowed options that will be set by Node.mutate( options ), in
   * the order they will be evaluated.
   *
   * NOTE: See Node's _mutatorKeys documentation for more information on how this operates, and potential special
   *       cases that may apply.
   */
  AccessibleNumberSpinnerClass.prototype._mutatorKeys = ACCESSIBLE_NUMBER_SPINNER_OPTIONS.concat(AccessibleNumberSpinnerClass.prototype._mutatorKeys);
  assert && assert(AccessibleNumberSpinnerClass.prototype._mutatorKeys.length === _.uniq(AccessibleNumberSpinnerClass.prototype._mutatorKeys).length, 'duplicate mutator keys in AccessibleNumberSpinner');
  return AccessibleNumberSpinnerClass;
};
sun.register('AccessibleNumberSpinner', AccessibleNumberSpinner);
export default AccessibleNumberSpinner;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJDYWxsYmFja1RpbWVyIiwiRW1pdHRlciIsInZhbGlkYXRlIiwiYXNzZXJ0SGFzUHJvcGVydGllcyIsImNvbWJpbmVPcHRpb25zIiwiT3JpZW50YXRpb24iLCJEZWxheWVkTXV0YXRlIiwiS2V5Ym9hcmRVdGlscyIsInN1biIsIlN1blN0cmluZ3MiLCJBY2Nlc3NpYmxlVmFsdWVIYW5kbGVyIiwiQUNDRVNTSUJMRV9OVU1CRVJfU1BJTk5FUl9PUFRJT05TIiwiQWNjZXNzaWJsZU51bWJlclNwaW5uZXIiLCJUeXBlIiwib3B0aW9uc0FyZ1Bvc2l0aW9uIiwiQWNjZXNzaWJsZU51bWJlclNwaW5uZXJDbGFzcyIsIl9wZG9tVGltZXJEZWxheSIsIl9wZG9tVGltZXJJbnRlcnZhbCIsImNvbnN0cnVjdG9yIiwiYXJncyIsInByb3ZpZGVkT3B0aW9ucyIsImFzc2VydCIsIk9iamVjdCIsImdldFByb3RvdHlwZU9mIiwicHJvdG90eXBlIiwib3B0aW9ucyIsImFyaWFPcmllbnRhdGlvbiIsIlZFUlRJQ0FMIiwiX2NhbGxiYWNrVGltZXIiLCJkZWxheSIsImludGVydmFsIiwicGRvbUluY3JlbWVudERvd25FbWl0dGVyIiwicGFyYW1ldGVycyIsInZhbHVlVHlwZSIsInBkb21EZWNyZW1lbnREb3duRW1pdHRlciIsInNldFBET01BdHRyaWJ1dGUiLCJhMTF5IiwibnVtYmVyU3Bpbm5lclJvbGVEZXNjcmlwdGlvblN0cmluZ1Byb3BlcnR5IiwiZG93bkNhbGxiYWNrIiwicnVubmluZ1RpbWVyQ2FsbGJhY2tFdmVudCIsImFjY2Vzc2libGVJbnB1dExpc3RlbmVyIiwia2V5ZG93biIsImV2ZW50IiwiZW5hYmxlZFByb3BlcnR5IiwiZ2V0IiwiaXNSYW5nZUtleSIsImRvbUV2ZW50IiwicHJldmVudERlZmF1bHQiLCJtZXRhS2V5IiwiaXNSdW5uaW5nIiwiX2FjY2Vzc2libGVOdW1iZXJTcGlubmVySGFuZGxlS2V5RG93biIsImJpbmQiLCJhZGRDYWxsYmFjayIsInN0YXJ0Iiwia2V5dXAiLCJrZXkiLCJnZXRFdmVudENvZGUiLCJfZW1pdEtleVN0YXRlIiwic3RvcCIsInJlbW92ZUNhbGxiYWNrIiwiaGFuZGxlS2V5VXAiLCJibHVyIiwiaGFuZGxlQmx1ciIsImlucHV0IiwiaGFuZGxlSW5wdXQiLCJjaGFuZ2UiLCJoYW5kbGVDaGFuZ2UiLCJhZGRJbnB1dExpc3RlbmVyIiwiX2Rpc3Bvc2VBY2Nlc3NpYmxlTnVtYmVyU3Bpbm5lciIsImRpc3Bvc2UiLCJyZW1vdmVJbnB1dExpc3RlbmVyIiwicGRvbVRpbWVyRGVsYXkiLCJ2YWx1ZSIsInBkb21UaW1lckludGVydmFsIiwiaGFuZGxlS2V5RG93biIsImlzRG93biIsIkV2ZW50IiwiaXNBbnlLZXlFdmVudCIsIktFWV9VUF9BUlJPVyIsIktFWV9SSUdIVF9BUlJPVyIsImVtaXQiLCJLRVlfRE9XTl9BUlJPVyIsIktFWV9MRUZUX0FSUk9XIiwiX211dGF0b3JLZXlzIiwiY29uY2F0IiwibGVuZ3RoIiwiXyIsInVuaXEiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkFjY2Vzc2libGVOdW1iZXJTcGlubmVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEEgdHJhaXQgZm9yIHN1YnR5cGVzIG9mIE5vZGUsIHVzZWQgdG8gbWFrZSB0aGUgTm9kZSBiZWhhdmUgbGlrZSBhICdudW1iZXInIGlucHV0IHdpdGggYXNzaXN0aXZlIHRlY2hub2xvZ3kuXHJcbiAqIEFuIGFjY2Vzc2libGUgbnVtYmVyIHNwaW5uZXIgYmVoYXZlcyBsaWtlOlxyXG4gKlxyXG4gKiAtIEFycm93IGtleXMgaW5jcmVtZW50L2RlY3JlbWVudCB0aGUgdmFsdWUgYnkgYSBzcGVjaWZpZWQgc3RlcCBzaXplLlxyXG4gKiAtIFBhZ2UgVXAgYW5kIFBhZ2UgRG93biBpbmNyZW1lbnRzL2RlY3JlbWVudHMgdmFsdWUgYnkgYW4gYWx0ZXJuYXRpdmUgc3RlcCBzaXplLCB1c3VhbGx5IGxhcmdlciB0aGFuIGRlZmF1bHQuXHJcbiAqIC0gSG9tZSBrZXkgc2V0cyB2YWx1ZSB0byBpdHMgbWluaW11bS5cclxuICogLSBFbmQga2V5IHNldHMgdmFsdWUgdG8gaXRzIG1heGltdW0uXHJcbiAqXHJcbiAqIFRoaXMgbnVtYmVyIHNwaW5uZXIgaXMgZGlmZmVyZW50IHRoYW4gdHlwaWNhbCAnbnVtYmVyJyBpbnB1dHMgYmVjYXVzZSBpdCBkb2VzIG5vdCBzdXBwb3J0IG51bWJlciBrZXkgY29udHJvbC4gSXRcclxuICogd2FzIGRldGVybWluZWQgdGhhdCBhbiBpbnB1dCBvZiB0eXBlIHJhbmdlIGlzIHRoZSBiZXN0IG1hdGNoIGZvciBhIFBoRVQgTnVtYmVyIFNwaW5uZXIsIHdpdGggYSBjdXN0b20gcm9sZVxyXG4gKiBkZXNjcmlwdGlvbiB3aXRoIGFyaWEtcm9sZWRlc2NyaXB0aW9uLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3N1bi9pc3N1ZXMvNDk3IGZvciBoaXN0b3J5IG9uIHRoaXNcclxuICogZGVjaXNpb24uXHJcbiAqXHJcbiAqIFRoaXMgdHJhaXQgbWl4ZXMgaW4gYSBcInBhcmVudFwiIG1peGluIHRvIGhhbmRsZSBnZW5lcmFsIFwidmFsdWVcIiBmb3JtYXR0aW5nIGFuZCBhcmlhLXZhbHVldGV4dCB1cGRhdGluZywgc2VlXHJcbiAqIEFjY2Vzc2libGVWYWx1ZUhhbmRsZXIuXHJcbiAqXHJcbiAqIEBhdXRob3IgSmVzc2UgR3JlZW5iZXJnIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIE1pY2hhZWwgQmFybG93IChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBDYWxsYmFja1RpbWVyLCB7IENhbGxiYWNrVGltZXJDYWxsYmFjayB9IGZyb20gJy4uLy4uLy4uL2F4b24vanMvQ2FsbGJhY2tUaW1lci5qcyc7XHJcbmltcG9ydCBFbWl0dGVyIGZyb20gJy4uLy4uLy4uL2F4b24vanMvRW1pdHRlci5qcyc7XHJcbmltcG9ydCB2YWxpZGF0ZSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL3ZhbGlkYXRlLmpzJztcclxuaW1wb3J0IGFzc2VydEhhc1Byb3BlcnRpZXMgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL2Fzc2VydEhhc1Byb3BlcnRpZXMuanMnO1xyXG5pbXBvcnQgQ29uc3RydWN0b3IgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL0NvbnN0cnVjdG9yLmpzJztcclxuaW1wb3J0IEludGVudGlvbmFsQW55IGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9JbnRlbnRpb25hbEFueS5qcyc7XHJcbmltcG9ydCB7IGNvbWJpbmVPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBPcmllbnRhdGlvbiBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvT3JpZW50YXRpb24uanMnO1xyXG5pbXBvcnQgeyBEZWxheWVkTXV0YXRlLCBLZXlib2FyZFV0aWxzLCBOb2RlLCBTY2VuZXJ5RXZlbnQsIFRJbnB1dExpc3RlbmVyIH0gZnJvbSAnLi4vLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IHN1biBmcm9tICcuLi9zdW4uanMnO1xyXG5pbXBvcnQgU3VuU3RyaW5ncyBmcm9tICcuLi9TdW5TdHJpbmdzLmpzJztcclxuaW1wb3J0IEFjY2Vzc2libGVWYWx1ZUhhbmRsZXIsIHsgQWNjZXNzaWJsZVZhbHVlSGFuZGxlck9wdGlvbnMsIFRBY2Nlc3NpYmxlVmFsdWVIYW5kbGVyIH0gZnJvbSAnLi9BY2Nlc3NpYmxlVmFsdWVIYW5kbGVyLmpzJztcclxuaW1wb3J0IFRFbWl0dGVyIGZyb20gJy4uLy4uLy4uL2F4b24vanMvVEVtaXR0ZXIuanMnO1xyXG5cclxuY29uc3QgQUNDRVNTSUJMRV9OVU1CRVJfU1BJTk5FUl9PUFRJT05TID0gW1xyXG4gICdwZG9tVGltZXJEZWxheScsXHJcbiAgJ3Bkb21UaW1lckludGVydmFsJ1xyXG5dO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuXHJcbiAgLy8gc3RhcnQgdG8gZmlyZSBjb250aW51b3VzbHkgYWZ0ZXIgcHJlc3NpbmcgZm9yIHRoaXMgbG9uZyAobWlsbGlzZWNvbmRzKVxyXG4gIHBkb21UaW1lckRlbGF5PzogbnVtYmVyO1xyXG5cclxuICAvLyBmaXJlIGNvbnRpbnVvdXNseSBhdCB0aGlzIGZyZXF1ZW5jeSAobWlsbGlzZWNvbmRzKSxcclxuICBwZG9tVGltZXJJbnRlcnZhbD86IG51bWJlcjtcclxufTtcclxuXHJcbnR5cGUgQWNjZXNzaWJsZU51bWJlclNwaW5uZXJPcHRpb25zID0gU2VsZk9wdGlvbnMgJiBBY2Nlc3NpYmxlVmFsdWVIYW5kbGVyT3B0aW9ucztcclxuXHJcbnR5cGUgVEFjY2Vzc2libGVOdW1iZXJTcGlubmVyID0ge1xyXG4gIC8vIEBtaXhpbi1wcm90ZWN0ZWQgLSBtYWRlIHB1YmxpYyBmb3IgdXNlIGluIHRoZSBtaXhpbiBvbmx5XHJcbiAgcmVhZG9ubHkgcGRvbUluY3JlbWVudERvd25FbWl0dGVyOiBURW1pdHRlcjxbIGJvb2xlYW4gXT47XHJcbiAgLy8gQG1peGluLXByb3RlY3RlZCAtIG1hZGUgcHVibGljIGZvciB1c2UgaW4gdGhlIG1peGluIG9ubHlcclxuICByZWFkb25seSBwZG9tRGVjcmVtZW50RG93bkVtaXR0ZXI6IFRFbWl0dGVyPFsgYm9vbGVhbiBdPjtcclxuICBwZG9tVGltZXJEZWxheTogbnVtYmVyO1xyXG4gIHBkb21UaW1lckludGVydmFsOiBudW1iZXI7XHJcbn0gJiBUQWNjZXNzaWJsZVZhbHVlSGFuZGxlcjtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0gVHlwZVxyXG4gKiBAcGFyYW0gb3B0aW9uc0FyZ1Bvc2l0aW9uIC0gemVyby1pbmRleGVkIG51bWJlciB0aGF0IHRoZSBvcHRpb25zIGFyZ3VtZW50IGlzIHByb3ZpZGVkIGF0XHJcbiAqL1xyXG5jb25zdCBBY2Nlc3NpYmxlTnVtYmVyU3Bpbm5lciA9IDxTdXBlclR5cGUgZXh0ZW5kcyBDb25zdHJ1Y3RvcjxOb2RlPj4oIFR5cGU6IFN1cGVyVHlwZSwgb3B0aW9uc0FyZ1Bvc2l0aW9uOiBudW1iZXIgKTogU3VwZXJUeXBlICYgQ29uc3RydWN0b3I8VEFjY2Vzc2libGVOdW1iZXJTcGlubmVyPiA9PiB7XHJcblxyXG4gIGNvbnN0IEFjY2Vzc2libGVOdW1iZXJTcGlubmVyQ2xhc3MgPSBEZWxheWVkTXV0YXRlKCAnQWNjZXNzaWJsZU51bWJlclNwaW5uZXInLCBBQ0NFU1NJQkxFX05VTUJFUl9TUElOTkVSX09QVElPTlMsXHJcbiAgICBjbGFzcyBBY2Nlc3NpYmxlTnVtYmVyU3Bpbm5lciBleHRlbmRzIEFjY2Vzc2libGVWYWx1ZUhhbmRsZXIoIFR5cGUsIG9wdGlvbnNBcmdQb3NpdGlvbiApIGltcGxlbWVudHMgVEFjY2Vzc2libGVOdW1iZXJTcGlubmVyIHtcclxuXHJcbiAgICAgIC8vIE1hbmFnZXMgdGltaW5nIG11c3QgYmUgZGlzcG9zZWRcclxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfY2FsbGJhY2tUaW1lcjogQ2FsbGJhY2tUaW1lcjtcclxuXHJcbiAgICAgIC8vIEVtaXRzIGV2ZW50cyB3aGVuIGluY3JlbWVudCBhbmQgZGVjcmVtZW50IGFjdGlvbnMgb2NjdXIsIGJ1dCBvbmx5IGZvciBjaGFuZ2VzIG9mIGtleWJvYXJkU3RlcCBhbmRcclxuICAgICAgLy8gc2hpZnRLZXlib2FyZFN0ZXAgKG5vdCBwYWdlS2V5Ym9hcmRTdGVwKS4gSW5kaWNhdGVzIFwibm9ybWFsXCIgdXNhZ2Ugd2l0aCBhIGtleWJvYXJkLCBzbyB0aGF0IGNvbXBvbmVudHNcclxuICAgICAgLy8gY29tcG9zZWQgd2l0aCB0aGlzIHRyYWl0IGNhbiBzdHlsZSB0aGVtc2VsdmVzIGRpZmZlcmVudGx5IHdoZW4gdGhlIGtleWJvYXJkIGlzIGJlaW5nIHVzZWQuXHJcbiAgICAgIC8vIEBtaXhpbi1wcm90ZWN0ZWQgLSBtYWRlIHB1YmxpYyBmb3IgdXNlIGluIHRoZSBtaXhpbiBvbmx5XHJcbiAgICAgIHB1YmxpYyByZWFkb25seSBwZG9tSW5jcmVtZW50RG93bkVtaXR0ZXI6IFRFbWl0dGVyPFsgYm9vbGVhbiBdPjtcclxuICAgICAgcHVibGljIHJlYWRvbmx5IHBkb21EZWNyZW1lbnREb3duRW1pdHRlcjogVEVtaXR0ZXI8WyBib29sZWFuIF0+O1xyXG5cclxuICAgICAgcHJpdmF0ZSBfcGRvbVRpbWVyRGVsYXkgPSA0MDA7XHJcbiAgICAgIHByaXZhdGUgX3Bkb21UaW1lckludGVydmFsID0gMTAwO1xyXG5cclxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfZGlzcG9zZUFjY2Vzc2libGVOdW1iZXJTcGlubmVyOiAoKSA9PiB2b2lkO1xyXG5cclxuICAgICAgcHVibGljIGNvbnN0cnVjdG9yKCAuLi5hcmdzOiBJbnRlbnRpb25hbEFueVtdICkge1xyXG5cclxuICAgICAgICBjb25zdCBwcm92aWRlZE9wdGlvbnMgPSBhcmdzWyBvcHRpb25zQXJnUG9zaXRpb24gXSBhcyBBY2Nlc3NpYmxlVmFsdWVIYW5kbGVyT3B0aW9ucztcclxuXHJcbiAgICAgICAgYXNzZXJ0ICYmIHByb3ZpZGVkT3B0aW9ucyAmJiBhc3NlcnQoIE9iamVjdC5nZXRQcm90b3R5cGVPZiggcHJvdmlkZWRPcHRpb25zICkgPT09IE9iamVjdC5wcm90b3R5cGUsXHJcbiAgICAgICAgICAnRXh0cmEgcHJvdG90eXBlIG9uIEFjY2Vzc2libGVTbGlkZXIgb3B0aW9ucyBvYmplY3QgaXMgYSBjb2RlIHNtZWxsIChvciBwcm9iYWJseSBhIGJ1ZyknICk7XHJcblxyXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBjb21iaW5lT3B0aW9uczxBY2Nlc3NpYmxlVmFsdWVIYW5kbGVyT3B0aW9ucz4oIHtcclxuICAgICAgICAgIGFyaWFPcmllbnRhdGlvbjogT3JpZW50YXRpb24uVkVSVElDQUwgLy8gYnkgZGVmYXVsdCwgbnVtYmVyIHNwaW5uZXJzIHNob3VsZCBiZSBvcmllbnRlZCB2ZXJ0aWNhbGx5XHJcbiAgICAgICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgICAgIGFyZ3NbIG9wdGlvbnNBcmdQb3NpdGlvbiBdID0gb3B0aW9ucztcclxuXHJcbiAgICAgICAgc3VwZXIoIC4uLmFyZ3MgKTtcclxuXHJcbiAgICAgICAgLy8gbWVtYmVycyBvZiB0aGUgTm9kZSBBUEkgdGhhdCBhcmUgdXNlZCBieSB0aGlzIHRyYWl0XHJcbiAgICAgICAgYXNzZXJ0SGFzUHJvcGVydGllcyggdGhpcywgWyAnYWRkSW5wdXRMaXN0ZW5lcicgXSApO1xyXG5cclxuICAgICAgICB0aGlzLl9jYWxsYmFja1RpbWVyID0gbmV3IENhbGxiYWNrVGltZXIoIHtcclxuICAgICAgICAgIGRlbGF5OiB0aGlzLl9wZG9tVGltZXJEZWxheSxcclxuICAgICAgICAgIGludGVydmFsOiB0aGlzLl9wZG9tVGltZXJJbnRlcnZhbFxyXG4gICAgICAgIH0gKTtcclxuXHJcbiAgICAgICAgdGhpcy5wZG9tSW5jcmVtZW50RG93bkVtaXR0ZXIgPSBuZXcgRW1pdHRlciggeyBwYXJhbWV0ZXJzOiBbIHsgdmFsdWVUeXBlOiAnYm9vbGVhbicgfSBdIH0gKTtcclxuICAgICAgICB0aGlzLnBkb21EZWNyZW1lbnREb3duRW1pdHRlciA9IG5ldyBFbWl0dGVyKCB7IHBhcmFtZXRlcnM6IFsgeyB2YWx1ZVR5cGU6ICdib29sZWFuJyB9IF0gfSApO1xyXG5cclxuICAgICAgICB0aGlzLnNldFBET01BdHRyaWJ1dGUoICdhcmlhLXJvbGVkZXNjcmlwdGlvbicsIFN1blN0cmluZ3MuYTExeS5udW1iZXJTcGlubmVyUm9sZURlc2NyaXB0aW9uU3RyaW5nUHJvcGVydHkgKTtcclxuXHJcbiAgICAgICAgLy8gYSBjYWxsYmFjayB0aGF0IGlzIGFkZGVkIGFuZCByZW1vdmVkIGZyb20gdGhlIHRpbWVyIGRlcGVuZGluZyBvbiBrZXlzdGF0ZVxyXG4gICAgICAgIGxldCBkb3duQ2FsbGJhY2s6IENhbGxiYWNrVGltZXJDYWxsYmFjayB8IG51bGwgPSBudWxsO1xyXG4gICAgICAgIGxldCBydW5uaW5nVGltZXJDYWxsYmFja0V2ZW50OiBFdmVudCB8IG51bGwgPSBudWxsOyAvLyB7RXZlbnR8bnVsbH1cclxuXHJcbiAgICAgICAgLy8gaGFuZGxlIGFsbCBhY2Nlc3NpYmxlIGV2ZW50IGlucHV0XHJcbiAgICAgICAgY29uc3QgYWNjZXNzaWJsZUlucHV0TGlzdGVuZXI6IFRJbnB1dExpc3RlbmVyID0ge1xyXG4gICAgICAgICAga2V5ZG93bjogZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuZW5hYmxlZFByb3BlcnR5LmdldCgpICkge1xyXG5cclxuICAgICAgICAgICAgICAvLyBjaGVjayBmb3IgcmVsZXZhbnQga2V5cyBoZXJlXHJcbiAgICAgICAgICAgICAgaWYgKCBLZXlib2FyZFV0aWxzLmlzUmFuZ2VLZXkoIGV2ZW50LmRvbUV2ZW50ICkgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgZG9tRXZlbnQgPSBldmVudC5kb21FdmVudCE7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIG1ldGEga2V5IGlzIGRvd24gd2Ugd2lsbCBub3QgZXZlbiBjYWxsIHRoZSBrZXlkb3duIGxpc3RlbmVyIG9mIHRoZSBzdXBlcnR5cGUsIHNvIHdlIG5lZWRcclxuICAgICAgICAgICAgICAgIC8vIHRvIGJlIHN1cmUgdGhhdCBkZWZhdWx0IGJlaGF2aW9yIGlzIHByZXZlbnRlZCBzbyB3ZSBkb24ndCByZWNlaXZlIGBpbnB1dGAgYW5kIGBjaGFuZ2VgIGV2ZW50cy5cclxuICAgICAgICAgICAgICAgIC8vIFNlZSBBY2Nlc3NpYmxlVmFsdWVIYW5kbGVyLmhhbmRsZUlucHV0IGZvciBpbmZvcm1hdGlvbiBvbiB0aGVzZSBldmVudHMgYW5kIHdoeSB3ZSBkb24ndCB3YW50XHJcbiAgICAgICAgICAgICAgICAvLyB0byBjaGFuZ2UgaW4gcmVzcG9uc2UgdG8gdGhlbS5cclxuICAgICAgICAgICAgICAgIGRvbUV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gV2hlbiB0aGUgbWV0YSBrZXkgaXMgZG93biBNYWMgd2lsbCBub3Qgc2VuZCBrZXl1cCBldmVudHMgc28gZG8gbm90IGNoYW5nZSB2YWx1ZXMgb3IgYWRkIHRpbWVyXHJcbiAgICAgICAgICAgICAgICAvLyBsaXN0ZW5lcnMgYmVjYXVzZSB0aGV5IHdpbGwgbmV2ZXIgYmUgcmVtb3ZlZCBzaW5jZSB3ZSBmYWlsIHRvIGdldCBhIGtleXVwIGV2ZW50LiBTZWVcclxuICAgICAgICAgICAgICAgIGlmICggIWRvbUV2ZW50Lm1ldGFLZXkgKSB7XHJcbiAgICAgICAgICAgICAgICAgIGlmICggIXRoaXMuX2NhbGxiYWNrVGltZXIuaXNSdW5uaW5nKCkgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYWNjZXNzaWJsZU51bWJlclNwaW5uZXJIYW5kbGVLZXlEb3duKCBldmVudCApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBkb3duQ2FsbGJhY2sgPSB0aGlzLl9hY2Nlc3NpYmxlTnVtYmVyU3Bpbm5lckhhbmRsZUtleURvd24uYmluZCggdGhpcywgZXZlbnQgKTtcclxuICAgICAgICAgICAgICAgICAgICBydW5uaW5nVGltZXJDYWxsYmFja0V2ZW50ID0gZG9tRXZlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FsbGJhY2tUaW1lci5hZGRDYWxsYmFjayggZG93bkNhbGxiYWNrICk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FsbGJhY2tUaW1lci5zdGFydCgpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAga2V5dXA6IGV2ZW50ID0+IHtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IEtleWJvYXJkVXRpbHMuZ2V0RXZlbnRDb2RlKCBldmVudC5kb21FdmVudCApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBLZXlib2FyZFV0aWxzLmlzUmFuZ2VLZXkoIGV2ZW50LmRvbUV2ZW50ICkgKSB7XHJcbiAgICAgICAgICAgICAgaWYgKCBydW5uaW5nVGltZXJDYWxsYmFja0V2ZW50ICYmIGtleSA9PT0gS2V5Ym9hcmRVdGlscy5nZXRFdmVudENvZGUoIHJ1bm5pbmdUaW1lckNhbGxiYWNrRXZlbnQgKSApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2VtaXRLZXlTdGF0ZSggZXZlbnQuZG9tRXZlbnQhLCBmYWxzZSApO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fY2FsbGJhY2tUaW1lci5zdG9wKCBmYWxzZSApO1xyXG4gICAgICAgICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggZG93bkNhbGxiYWNrICk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jYWxsYmFja1RpbWVyLnJlbW92ZUNhbGxiYWNrKCBkb3duQ2FsbGJhY2shICk7XHJcbiAgICAgICAgICAgICAgICBkb3duQ2FsbGJhY2sgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgcnVubmluZ1RpbWVyQ2FsbGJhY2tFdmVudCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICB0aGlzLmhhbmRsZUtleVVwKCBldmVudCApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgYmx1cjogZXZlbnQgPT4ge1xyXG5cclxuICAgICAgICAgICAgLy8gaWYgYSBrZXkgaXMgY3VycmVudGx5IGRvd24gd2hlbiBmb2N1cyBsZWF2ZXMgdGhlIHNwaW5uZXIsIHN0b3AgY2FsbGJhY2tzIGFuZCBlbWl0IHRoYXQgdGhlXHJcbiAgICAgICAgICAgIC8vIGtleSBpcyB1cFxyXG4gICAgICAgICAgICBpZiAoIGRvd25DYWxsYmFjayApIHtcclxuICAgICAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBydW5uaW5nVGltZXJDYWxsYmFja0V2ZW50ICE9PSBudWxsLCAna2V5IHNob3VsZCBiZSBkb3duIGlmIHJ1bm5pbmcgZG93bkNhbGxiYWNrJyApO1xyXG5cclxuICAgICAgICAgICAgICB0aGlzLl9lbWl0S2V5U3RhdGUoIHJ1bm5pbmdUaW1lckNhbGxiYWNrRXZlbnQhLCBmYWxzZSApO1xyXG4gICAgICAgICAgICAgIHRoaXMuX2NhbGxiYWNrVGltZXIuc3RvcCggZmFsc2UgKTtcclxuICAgICAgICAgICAgICB0aGlzLl9jYWxsYmFja1RpbWVyLnJlbW92ZUNhbGxiYWNrKCBkb3duQ2FsbGJhY2sgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5oYW5kbGVCbHVyKCBldmVudCApO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGlucHV0OiB0aGlzLmhhbmRsZUlucHV0LmJpbmQoIHRoaXMgKSxcclxuICAgICAgICAgIGNoYW5nZTogdGhpcy5oYW5kbGVDaGFuZ2UuYmluZCggdGhpcyApXHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLmFkZElucHV0TGlzdGVuZXIoIGFjY2Vzc2libGVJbnB1dExpc3RlbmVyICk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2VBY2Nlc3NpYmxlTnVtYmVyU3Bpbm5lciA9ICgpID0+IHtcclxuICAgICAgICAgIHRoaXMuX2NhbGxiYWNrVGltZXIuZGlzcG9zZSgpO1xyXG5cclxuICAgICAgICAgIC8vIGVtaXR0ZXJzIG93bmVkIGJ5IHRoaXMgaW5zdGFuY2UsIGNhbiBiZSBkaXNwb3NlZCBoZXJlXHJcbiAgICAgICAgICB0aGlzLnBkb21JbmNyZW1lbnREb3duRW1pdHRlci5kaXNwb3NlKCk7XHJcbiAgICAgICAgICB0aGlzLnBkb21EZWNyZW1lbnREb3duRW1pdHRlci5kaXNwb3NlKCk7XHJcblxyXG4gICAgICAgICAgdGhpcy5yZW1vdmVJbnB1dExpc3RlbmVyKCBhY2Nlc3NpYmxlSW5wdXRMaXN0ZW5lciApO1xyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHB1YmxpYyBzZXQgcGRvbVRpbWVyRGVsYXkoIHZhbHVlOiBudW1iZXIgKSB7XHJcbiAgICAgICAgdGhpcy5fcGRvbVRpbWVyRGVsYXkgPSB2YWx1ZTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLl9jYWxsYmFja1RpbWVyICkge1xyXG4gICAgICAgICAgdGhpcy5fY2FsbGJhY2tUaW1lci5kZWxheSA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcHVibGljIGdldCBwZG9tVGltZXJEZWxheSgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9wZG9tVGltZXJEZWxheTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcHVibGljIHNldCBwZG9tVGltZXJJbnRlcnZhbCggdmFsdWU6IG51bWJlciApIHtcclxuICAgICAgICB0aGlzLl9wZG9tVGltZXJJbnRlcnZhbCA9IHZhbHVlO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMuX2NhbGxiYWNrVGltZXIgKSB7XHJcbiAgICAgICAgICB0aGlzLl9jYWxsYmFja1RpbWVyLmludGVydmFsID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBwdWJsaWMgZ2V0IHBkb21UaW1lckludGVydmFsKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Bkb21UaW1lckludGVydmFsO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogSGFuZGxlIHRoZSBrZXlkb3duIGV2ZW50IGFuZCBlbWl0IGV2ZW50cyByZWxhdGVkIHRvIHRoZSB1c2VyIGludGVyYWN0aW9uLiBJZGVhbGx5LCB0aGlzIHdvdWxkXHJcbiAgICAgICAqIG92ZXJyaWRlIEFjY2Vzc2libGVWYWx1ZUhhbmRsZXIuaGFuZGxlS2V5RG93biwgYnV0IG92ZXJyaWRpbmcgaXMgbm90IHN1cHBvcnRlZCB3aXRoIFBoRVQgVHJhaXQgcGF0dGVybi5cclxuICAgICAgICovXHJcblxyXG4gICAgICBwcml2YXRlIF9hY2Nlc3NpYmxlTnVtYmVyU3Bpbm5lckhhbmRsZUtleURvd24oIGV2ZW50OiBTY2VuZXJ5RXZlbnQ8S2V5Ym9hcmRFdmVudD4gKTogdm9pZCB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggZXZlbnQuZG9tRXZlbnQsICdtdXN0IGhhdmUgYSBkb21FdmVudCcgKTtcclxuICAgICAgICB0aGlzLmhhbmRsZUtleURvd24oIGV2ZW50ICk7XHJcbiAgICAgICAgdGhpcy5fZW1pdEtleVN0YXRlKCBldmVudC5kb21FdmVudCEsIHRydWUgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEVtaXQgZXZlbnRzIHJlbGF0ZWQgdG8gdGhlIGtleXN0YXRlIG9mIHRoZSBzcGlubmVyLiBUeXBpY2FsbHkgdXNlZCB0byBzdHlsZSB0aGUgc3Bpbm5lciBkdXJpbmcga2V5Ym9hcmRcclxuICAgICAgICogaW50ZXJhY3Rpb24uXHJcbiAgICAgICAqXHJcbiAgICAgICAqIEBwYXJhbSBkb21FdmVudCAtIHRoZSBjb2RlIG9mIHRoZSBrZXkgY2hhbmdpbmcgc3RhdGVcclxuICAgICAgICogQHBhcmFtIGlzRG93biAtIHdoZXRoZXIgb3Igbm90IGV2ZW50IHdhcyB0cmlnZ2VyZWQgZnJvbSBkb3duIG9yIHVwIGtleXNcclxuICAgICAgICovXHJcblxyXG4gICAgICBwcml2YXRlIF9lbWl0S2V5U3RhdGUoIGRvbUV2ZW50OiBFdmVudCwgaXNEb3duOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgICAgIHZhbGlkYXRlKCBkb21FdmVudCwgeyB2YWx1ZVR5cGU6IEV2ZW50IH0gKTtcclxuICAgICAgICBpZiAoIEtleWJvYXJkVXRpbHMuaXNBbnlLZXlFdmVudCggZG9tRXZlbnQsIFsgS2V5Ym9hcmRVdGlscy5LRVlfVVBfQVJST1csIEtleWJvYXJkVXRpbHMuS0VZX1JJR0hUX0FSUk9XIF0gKSApIHtcclxuICAgICAgICAgIHRoaXMucGRvbUluY3JlbWVudERvd25FbWl0dGVyLmVtaXQoIGlzRG93biApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggS2V5Ym9hcmRVdGlscy5pc0FueUtleUV2ZW50KCBkb21FdmVudCwgWyBLZXlib2FyZFV0aWxzLktFWV9ET1dOX0FSUk9XLCBLZXlib2FyZFV0aWxzLktFWV9MRUZUX0FSUk9XIF0gKSApIHtcclxuICAgICAgICAgIHRoaXMucGRvbURlY3JlbWVudERvd25FbWl0dGVyLmVtaXQoIGlzRG93biApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zZUFjY2Vzc2libGVOdW1iZXJTcGlubmVyKCk7XHJcblxyXG4gICAgICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAvKipcclxuICAgKiB7QXJyYXkuPHN0cmluZz59IC0gU3RyaW5nIGtleXMgZm9yIGFsbCB0aGUgYWxsb3dlZCBvcHRpb25zIHRoYXQgd2lsbCBiZSBzZXQgYnkgTm9kZS5tdXRhdGUoIG9wdGlvbnMgKSwgaW5cclxuICAgKiB0aGUgb3JkZXIgdGhleSB3aWxsIGJlIGV2YWx1YXRlZC5cclxuICAgKlxyXG4gICAqIE5PVEU6IFNlZSBOb2RlJ3MgX211dGF0b3JLZXlzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24gb24gaG93IHRoaXMgb3BlcmF0ZXMsIGFuZCBwb3RlbnRpYWwgc3BlY2lhbFxyXG4gICAqICAgICAgIGNhc2VzIHRoYXQgbWF5IGFwcGx5LlxyXG4gICAqL1xyXG4gIEFjY2Vzc2libGVOdW1iZXJTcGlubmVyQ2xhc3MucHJvdG90eXBlLl9tdXRhdG9yS2V5cyA9IEFDQ0VTU0lCTEVfTlVNQkVSX1NQSU5ORVJfT1BUSU9OUy5jb25jYXQoIEFjY2Vzc2libGVOdW1iZXJTcGlubmVyQ2xhc3MucHJvdG90eXBlLl9tdXRhdG9yS2V5cyApO1xyXG5cclxuICBhc3NlcnQgJiYgYXNzZXJ0KCBBY2Nlc3NpYmxlTnVtYmVyU3Bpbm5lckNsYXNzLnByb3RvdHlwZS5fbXV0YXRvcktleXMubGVuZ3RoID09PSBfLnVuaXEoIEFjY2Vzc2libGVOdW1iZXJTcGlubmVyQ2xhc3MucHJvdG90eXBlLl9tdXRhdG9yS2V5cyApLmxlbmd0aCwgJ2R1cGxpY2F0ZSBtdXRhdG9yIGtleXMgaW4gQWNjZXNzaWJsZU51bWJlclNwaW5uZXInICk7XHJcblxyXG4gIHJldHVybiBBY2Nlc3NpYmxlTnVtYmVyU3Bpbm5lckNsYXNzO1xyXG59O1xyXG5cclxuc3VuLnJlZ2lzdGVyKCAnQWNjZXNzaWJsZU51bWJlclNwaW5uZXInLCBBY2Nlc3NpYmxlTnVtYmVyU3Bpbm5lciApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgQWNjZXNzaWJsZU51bWJlclNwaW5uZXI7XHJcbmV4cG9ydCB0eXBlIHsgQWNjZXNzaWJsZU51bWJlclNwaW5uZXJPcHRpb25zIH07Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLGFBQWEsTUFBaUMsbUNBQW1DO0FBQ3hGLE9BQU9DLE9BQU8sTUFBTSw2QkFBNkI7QUFDakQsT0FBT0MsUUFBUSxNQUFNLDhCQUE4QjtBQUNuRCxPQUFPQyxtQkFBbUIsTUFBTSw4Q0FBOEM7QUFHOUUsU0FBU0MsY0FBYyxRQUFRLG9DQUFvQztBQUNuRSxPQUFPQyxXQUFXLE1BQU0sc0NBQXNDO0FBQzlELFNBQVNDLGFBQWEsRUFBRUMsYUFBYSxRQUE0QyxnQ0FBZ0M7QUFDakgsT0FBT0MsR0FBRyxNQUFNLFdBQVc7QUFDM0IsT0FBT0MsVUFBVSxNQUFNLGtCQUFrQjtBQUN6QyxPQUFP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