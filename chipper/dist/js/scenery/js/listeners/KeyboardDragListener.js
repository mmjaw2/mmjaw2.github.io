// Copyright 2019-2024, University of Colorado Boulder

/**
 * An input listener for keyboard-based drag interactions, allowing objects to be moved using the arrow keys or
 * the W, A, S, D keys.
 *
 * Key features:
 * - Supports both discrete (step-based) and continuous (speed-based) dragging modes.
 * - Allows restricting movement to specific axes (e.g., horizontal or vertical only) or allowing free 2D movement.
 * - Configurable drag speed and drag delta values, with separate configurations when the shift key is held for
 *   finer control.
 * - Optionally synchronizes with a 'positionProperty' to allow for model-view coordination with custom transformations
 *   if needed.
 * - Provides hooks for start, drag (movement), and end phases of a drag interaction through callback options.
 * - Includes support for drag bounds, restricting the draggable area within specified model coordinates.
 * - Utilizes a CallbackTimer for smooth, timed updates during drag operations, especially useful in continuous drag
 *   mode.
 *
 * Usage:
 * Attach an instance of KeyboardDragListener to a Node via the `addInputListener` method.
 *
 * Example:
 *
 *   const myNode = new Node();
 *   const dragListener = new KeyboardDragListener( {
 *     dragDelta: 2,
 *     shiftDragDelta: 2,
 *     start: (event, listener) => { console.log('Drag started'); },
 *     drag: (event, listener) => { console.log('Dragging'); },
 *     end: (event, listener) => { console.log('Drag ended'); },
 *     positionProperty: myNode.positionProperty,
 *     transform: myNode.getTransform()
 *   } );
 *   myNode.addInputListener(dragListener);
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Michael Barlow
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import PhetioAction from '../../../tandem/js/PhetioAction.js';
import Property from '../../../axon/js/Property.js';
import Transform3 from '../../../dot/js/Transform3.js';
import Vector2 from '../../../dot/js/Vector2.js';
import EventType from '../../../tandem/js/EventType.js';
import Tandem from '../../../tandem/js/Tandem.js';
import { globalKeyStateTracker, KeyboardListener, KeyboardUtils, scenery, SceneryEvent } from '../imports.js';
import optionize from '../../../phet-core/js/optionize.js';
import assertMutuallyExclusiveOptions from '../../../phet-core/js/assertMutuallyExclusiveOptions.js';
import TinyProperty from '../../../axon/js/TinyProperty.js';
import CallbackTimer from '../../../axon/js/CallbackTimer.js';
import platform from '../../../phet-core/js/platform.js';
// 'shift' is not included in any list of keys because we don't want the KeyboardListener to be 'pressed' when only
// the shift key is down. State of the shift key is tracked by the globalKeyStateTracker.
const allKeys = ['arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'w', 'a', 's', 'd'];
const leftRightKeys = ['arrowLeft', 'arrowRight', 'a', 'd'];
const upDownKeys = ['arrowUp', 'arrowDown', 'w', 's'];

// Possible movement types for this KeyboardDragListener. 2D motion ('both') or 1D motion ('leftRight' or 'upDown').

const KeyboardDragDirectionToKeysMap = new Map([['both', allKeys], ['leftRight', leftRightKeys], ['upDown', upDownKeys]]);
// Other superclass options are allowed

class KeyboardDragListener extends KeyboardListener {
  // See options for documentation

  // Properties internal to the listener that track pressed keys. Instead of updating in the KeyboardListener
  // callback, the positionProperty is updated in a callback timer depending on the state of these Properties
  // so that movement is smooth.
  leftKeyDownProperty = new TinyProperty(false);
  rightKeyDownProperty = new TinyProperty(false);
  upKeyDownProperty = new TinyProperty(false);
  downKeyDownProperty = new TinyProperty(false);

  // Fires to conduct the start and end of a drag, added for PhET-iO interoperability

  // KeyboardDragListener is implemented with KeyboardListener and therefore Hotkey. Hotkeys use 'global' DOM events
  // instead of SceneryEvent dispatch. In order to start the drag with a SceneryEvent, this listener waits
  // to start until its keys are pressed, and it starts the drag on the next SceneryEvent from keydown dispatch.
  startNextKeyboardEvent = false;

  // Similar to the above, but used for restarting the callback timer on the next keydown event when a new key is
  // pressed.
  restartTimerNextKeyboardEvent = false;

  // Implements disposal.

  // A listener added to the pointer when dragging starts so that we can attach a listener and provide a channel of
  // communication to the AnimatedPanZoomListener to define custom behavior for screen panning during a drag operation.

  // A reference to the Pointer during a drag operation so that we can add/remove the _pointerListener.

  // Whether this listener uses a speed implementation or delta implementation for dragging. See options
  // dragSpeed and dragDelta for more information.

  // The vector delta that is used to move the object during a drag operation. Assigned to the listener so that
  // it is usable in the drag callback.
  vectorDelta = new Vector2(0, 0);

  // The callback timer that is used to move the object during a drag operation to support animated motion and
  // motion every moveOnHoldInterval.

  constructor(providedOptions) {
    // Use either dragSpeed or dragDelta, cannot use both at the same time.
    assert && assertMutuallyExclusiveOptions(providedOptions, ['dragSpeed', 'shiftDragSpeed'], ['dragDelta', 'shiftDragDelta']);

    // 'move on hold' timings are only relevant for 'delta' implementations of dragging
    assert && assertMutuallyExclusiveOptions(providedOptions, ['dragSpeed'], ['moveOnHoldDelay', 'moveOnHOldInterval']);
    assert && assertMutuallyExclusiveOptions(providedOptions, ['mapPosition'], ['dragBoundsProperty']);
    const options = optionize()({
      // default moves the object roughly 600 view coordinates every second, assuming 60 fps
      dragDelta: 10,
      shiftDragDelta: 5,
      dragSpeed: 0,
      shiftDragSpeed: 0,
      keyboardDragDirection: 'both',
      positionProperty: null,
      transform: null,
      dragBoundsProperty: null,
      mapPosition: null,
      start: null,
      drag: null,
      end: null,
      moveOnHoldDelay: 500,
      moveOnHoldInterval: 400,
      tandem: Tandem.REQUIRED,
      // DragListener by default doesn't allow PhET-iO to trigger drag Action events
      phetioReadOnly: true
    }, providedOptions);
    assert && assert(options.shiftDragSpeed <= options.dragSpeed, 'shiftDragSpeed should be less than or equal to shiftDragSpeed, it is intended to provide more fine-grained control');
    assert && assert(options.shiftDragDelta <= options.dragDelta, 'shiftDragDelta should be less than or equal to dragDelta, it is intended to provide more fine-grained control');
    const keys = KeyboardDragDirectionToKeysMap.get(options.keyboardDragDirection);
    assert && assert(keys, 'Invalid keyboardDragDirection');
    const superOptions = optionize()({
      keys: keys,
      // We still want to start drag operations when the shift modifier key is pressed, even though it is not
      // listed in keys.
      ignoredModifierKeys: ['shift']
    }, options);
    super(superOptions);

    // pressedKeysProperty comes from KeyboardListener, and it is used to determine the state of the movement keys.
    // This approach gives more control over the positionProperty in the callbackTimer than using the KeyboardListener
    // callback.
    this.pressedKeysProperty.link(pressedKeys => {
      this.leftKeyDownProperty.value = pressedKeys.includes('arrowLeft') || pressedKeys.includes('a');
      this.rightKeyDownProperty.value = pressedKeys.includes('arrowRight') || pressedKeys.includes('d');
      this.upKeyDownProperty.value = pressedKeys.includes('arrowUp') || pressedKeys.includes('w');
      this.downKeyDownProperty.value = pressedKeys.includes('arrowDown') || pressedKeys.includes('s');
    });

    // Mutable attributes declared from options, see options for info, as well as getters and setters.
    this._start = options.start;
    this._drag = options.drag;
    this._end = options.end;
    this._dragBoundsProperty = options.dragBoundsProperty || new Property(null);
    this._mapPosition = options.mapPosition;
    this._transform = options.transform;
    this._positionProperty = options.positionProperty;
    this._dragSpeed = options.dragSpeed;
    this._shiftDragSpeed = options.shiftDragSpeed;
    this._dragDelta = options.dragDelta;
    this._shiftDragDelta = options.shiftDragDelta;
    this._moveOnHoldDelay = options.moveOnHoldDelay;

    // Since dragSpeed and dragDelta are mutually-exclusive drag implementations, a value for either one of these
    // options indicates we should use a speed implementation for dragging.
    this.useDragSpeed = options.dragSpeed > 0 || options.shiftDragSpeed > 0;
    this.dragStartAction = new PhetioAction(event => {
      this._start && this._start(event, this);
      if (this.useDragSpeed) {
        this.callbackTimer.start();
      }
    }, {
      parameters: [{
        name: 'event',
        phetioType: SceneryEvent.SceneryEventIO
      }],
      tandem: options.tandem.createTandem('dragStartAction'),
      phetioDocumentation: 'Emits whenever a keyboard drag starts.',
      phetioReadOnly: options.phetioReadOnly,
      phetioEventType: EventType.USER
    });

    // The drag action only executes when there is actual movement (vectorDelta is non-zero). For example, it does
    // NOT execute if conflicting keys are pressed (e.g. left and right arrow keys at the same time). Note that this
    // is expected to be executed from the CallbackTimer. So there will be problems if this can be executed from
    // PhET-iO clients.
    this.dragAction = new PhetioAction(() => {
      assert && assert(this.isPressedProperty.value, 'The listener should not be dragging if not pressed');

      // synchronize with model position
      if (this._positionProperty) {
        let newPosition = this._positionProperty.value.plus(this.vectorDelta);
        newPosition = this.mapModelPoint(newPosition);

        // update the position if it is different
        if (!newPosition.equals(this._positionProperty.value)) {
          this._positionProperty.value = newPosition;
        }
      }

      // the optional drag function at the end of any movement
      if (this._drag) {
        assert && assert(this._pointer, 'the pointer must be assigned at the start of a drag action');
        const syntheticEvent = this.createSyntheticEvent(this._pointer);
        this._drag(syntheticEvent, this);
      }
    }, {
      parameters: [],
      tandem: options.tandem.createTandem('dragAction'),
      phetioDocumentation: 'Emits every time there is some input from a keyboard drag.',
      phetioHighFrequency: true,
      phetioReadOnly: options.phetioReadOnly,
      phetioEventType: EventType.USER
    });
    this.dragEndAction = new PhetioAction(() => {
      // stop the callback timer
      this.callbackTimer.stop(false);
      const syntheticEvent = this._pointer ? this.createSyntheticEvent(this._pointer) : null;
      this._end && this._end(syntheticEvent, this);
      this.clearPointer();
    }, {
      parameters: [],
      tandem: options.tandem.createTandem('dragEndAction'),
      phetioDocumentation: 'Emits whenever a keyboard drag ends.',
      phetioReadOnly: options.phetioReadOnly,
      phetioEventType: EventType.USER
    });
    this._pointerListener = {
      listener: this,
      interrupt: this.interrupt.bind(this)
    };
    this._pointer = null;

    // For dragSpeed implementation, the CallbackTimer will fire every animation frame, so the interval is
    // meant to work at 60 frames per second.
    const interval = this.useDragSpeed ? 1000 / 60 : options.moveOnHoldInterval;
    const delay = this.useDragSpeed ? 0 : options.moveOnHoldDelay;
    this.callbackTimer = new CallbackTimer({
      delay: delay,
      interval: interval,
      callback: () => {
        let deltaX = 0;
        let deltaY = 0;
        const shiftKeyDown = globalKeyStateTracker.shiftKeyDown;
        let delta;
        if (this.useDragSpeed) {
          // We know that CallbackTimer is going to fire at the interval so we can use that to get the dt.
          const dt = interval / 1000; // the interval in seconds
          delta = dt * (shiftKeyDown ? options.shiftDragSpeed : options.dragSpeed);
        } else {
          delta = shiftKeyDown ? options.shiftDragDelta : options.dragDelta;
        }
        if (this.leftKeyDownProperty.value) {
          deltaX -= delta;
        }
        if (this.rightKeyDownProperty.value) {
          deltaX += delta;
        }
        if (this.upKeyDownProperty.value) {
          deltaY -= delta;
        }
        if (this.downKeyDownProperty.value) {
          deltaY += delta;
        }
        let vectorDelta = new Vector2(deltaX, deltaY);

        // only initiate move if there was some attempted keyboard drag
        if (!vectorDelta.equals(Vector2.ZERO)) {
          // to model coordinates
          if (options.transform) {
            const transform = options.transform instanceof Transform3 ? options.transform : options.transform.value;
            vectorDelta = transform.inverseDelta2(vectorDelta);
          }
          this.vectorDelta = vectorDelta;
          this.dragAction.execute();
        }
      }
    });

    // When any of the movement keys first go down, start the drag operation on the next keydown event (so that
    // the SceneryEvent is available).
    this.isPressedProperty.lazyLink(dragKeysDown => {
      if (dragKeysDown) {
        this.startNextKeyboardEvent = true;
      } else {
        // In case movement keys are released before we get a keydown event (mostly possible during fuzz testing),
        // don't start the next drag action.
        this.startNextKeyboardEvent = false;
        this.restartTimerNextKeyboardEvent = false;
        this.dragEndAction.execute();
      }
    });

    // If not the shift key, the drag should start immediately in the direction of the newly pressed key instead
    // of waiting for the next interval. Only important for !useDragSpeed.
    if (!this.useDragSpeed) {
      const addStartTimerListener = keyProperty => {
        keyProperty.link(keyDown => {
          if (keyDown) {
            this.restartTimerNextKeyboardEvent = true;
          }
        });
      };
      addStartTimerListener(this.leftKeyDownProperty);
      addStartTimerListener(this.rightKeyDownProperty);
      addStartTimerListener(this.upKeyDownProperty);
      addStartTimerListener(this.downKeyDownProperty);
    }
    this._disposeKeyboardDragListener = () => {
      this.leftKeyDownProperty.dispose();
      this.rightKeyDownProperty.dispose();
      this.upKeyDownProperty.dispose();
      this.downKeyDownProperty.dispose();
      this.callbackTimer.dispose();
    };
  }

  /**
   * Returns the drag bounds in model coordinates.
   */
  getDragBounds() {
    return this._dragBoundsProperty.value;
  }
  get dragBounds() {
    return this.getDragBounds();
  }

  /**
   * Sets the drag transform of the listener.
   */
  setTransform(transform) {
    this._transform = transform;
  }
  set transform(transform) {
    this.setTransform(transform);
  }
  get transform() {
    return this.getTransform();
  }

  /**
   * Returns the transform of the listener.
   */
  getTransform() {
    return this._transform;
  }

  /**
   * Getter for the dragSpeed property, see options.dragSpeed for more info.
   */
  get dragSpeed() {
    return this._dragSpeed;
  }

  /**
   * Setter for the dragSpeed property, see options.dragSpeed for more info.
   */
  set dragSpeed(dragSpeed) {
    this._dragSpeed = dragSpeed;
  }

  /**
   * Getter for the shiftDragSpeed property, see options.shiftDragSpeed for more info.
   */
  get shiftDragSpeed() {
    return this._shiftDragSpeed;
  }

  /**
   * Setter for the shiftDragSpeed property, see options.shiftDragSpeed for more info.
   */
  set shiftDragSpeed(shiftDragSpeed) {
    this._shiftDragSpeed = shiftDragSpeed;
  }

  /**
   * Getter for the dragDelta property, see options.dragDelta for more info.
   */
  get dragDelta() {
    return this._dragDelta;
  }

  /**
   * Setter for the dragDelta property, see options.dragDelta for more info.
   */
  set dragDelta(dragDelta) {
    this._dragDelta = dragDelta;
  }

  /**
   * Getter for the shiftDragDelta property, see options.shiftDragDelta for more info.
   */
  get shiftDragDelta() {
    return this._shiftDragDelta;
  }

  /**
   * Setter for the shiftDragDelta property, see options.shiftDragDelta for more info.
   */
  set shiftDragDelta(shiftDragDelta) {
    this._shiftDragDelta = shiftDragDelta;
  }

  /**
   * Are keys pressed that would move the target Node to the left?
   */
  movingLeft() {
    return this.leftKeyDownProperty.value && !this.rightKeyDownProperty.value;
  }

  /**
   * Are keys pressed that would move the target Node to the right?
   */
  movingRight() {
    return this.rightKeyDownProperty.value && !this.leftKeyDownProperty.value;
  }

  /**
   * Are keys pressed that would move the target Node up?
   */
  movingUp() {
    return this.upKeyDownProperty.value && !this.downKeyDownProperty.value;
  }

  /**
   * Are keys pressed that would move the target Node down?
   */
  movingDown() {
    return this.downKeyDownProperty.value && !this.upKeyDownProperty.value;
  }

  /**
   * Get the current target Node of the drag.
   */
  getCurrentTarget() {
    assert && assert(this.isPressedProperty.value, 'We have no currentTarget if we are not pressed');
    assert && assert(this._pointer && this._pointer.trail, 'Must have a Pointer with an active trail if we are pressed');
    return this._pointer.trail.lastNode();
  }

  /**
   * Scenery internal. Part of the events API. Do not call directly.
   *
   * Does specific work for the keydown event. This is called during scenery event dispatch, and AFTER any global
   * key state updates. This is important because interruption needs to happen after hotkeyManager has fully processed
   * the key state. And this implementation assumes that the keydown event will happen after Hotkey updates
   * (see startNextKeyboardEvent).
   */
  keydown(event) {
    super.keydown(event);
    const domEvent = event.domEvent;

    // If the meta key is down (command key/windows key) prevent movement and do not preventDefault.
    // Meta key + arrow key is a command to go back a page, and we need to allow that. But also, macOS
    // fails to provide keyup events once the meta key is pressed, see
    // http://web.archive.org/web/20160304022453/http://bitspushedaround.com/on-a-few-things-you-may-not-know-about-the-hellish-command-key-and-javascript-events/
    if (domEvent.metaKey) {
      return;
    }
    if (KeyboardUtils.isMovementKey(domEvent)) {
      // Prevent a VoiceOver bug where pressing multiple arrow keys at once causes the AT to send the wrong keys
      // through the keyup event - as a workaround, we only allow one arrow key to be down at a time. If two are pressed
      // down, we immediately interrupt.
      if (platform.safari && this.pressedKeysProperty.value.length > 1) {
        this.interrupt();
        return;
      }

      // Finally, in this case we are actually going to drag the object. Prevent default behavior so that Safari
      // doesn't play a 'bonk' sound every arrow key press.
      domEvent.preventDefault();

      // Cannot attach a listener to a Pointer that is already attached.
      if (this.startNextKeyboardEvent && !event.pointer.isAttached()) {
        // If there are no movement keys down, attach a listener to the Pointer that will tell the AnimatedPanZoomListener
        // to keep this Node in view
        assert && assert(this._pointer === null, 'Pointer should be null at the start of a drag action');
        this._pointer = event.pointer;
        event.pointer.addInputListener(this._pointerListener, true);
        this.dragStartAction.execute(event);
        this.startNextKeyboardEvent = false;
      }
      if (this.restartTimerNextKeyboardEvent) {
        // restart the callback timer
        this.callbackTimer.stop(false);
        this.callbackTimer.start();
        if (this._moveOnHoldDelay > 0) {
          // fire right away if there is a delay - if there is no delay the timer is going to fire in the next
          // animation frame and so it would appear that the object makes two steps in one frame
          this.callbackTimer.fire();
        }
        this.restartTimerNextKeyboardEvent = false;
      }
    }
  }

  /**
   * Apply a mapping from the drag target's model position to an allowed model position.
   *
   * A common example is using dragBounds, where the position of the drag target is constrained to within a bounding
   * box. This is done by mapping points outside the bounding box to the closest position inside the box. More
   * general mappings can be used.
   *
   * Should be overridden (or use mapPosition) if a custom transformation is needed.
   *
   * @returns - A point in the model coordinate frame
   */
  mapModelPoint(modelPoint) {
    if (this._mapPosition) {
      return this._mapPosition(modelPoint);
    } else if (this._dragBoundsProperty.value) {
      return this._dragBoundsProperty.value.closestPointTo(modelPoint);
    } else {
      return modelPoint;
    }
  }

  /**
   * If the pointer is set, remove the listener from it and clear the reference.
   */
  clearPointer() {
    if (this._pointer) {
      assert && assert(this._pointer.listeners.includes(this._pointerListener), 'A reference to the Pointer means it should have the pointerListener');
      this._pointer.removeInputListener(this._pointerListener);
      this._pointer = null;
    }
  }

  /**
   * Make eligible for garbage collection.
   */
  dispose() {
    this.interrupt();
    this._disposeKeyboardDragListener();
    super.dispose();
  }
}
scenery.register('KeyboardDragListener', KeyboardDragListener);
export default KeyboardDragListener;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQaGV0aW9BY3Rpb24iLCJQcm9wZXJ0eSIsIlRyYW5zZm9ybTMiLCJWZWN0b3IyIiwiRXZlbnRUeXBlIiwiVGFuZGVtIiwiZ2xvYmFsS2V5U3RhdGVUcmFja2VyIiwiS2V5Ym9hcmRMaXN0ZW5lciIsIktleWJvYXJkVXRpbHMiLCJzY2VuZXJ5IiwiU2NlbmVyeUV2ZW50Iiwib3B0aW9uaXplIiwiYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zIiwiVGlueVByb3BlcnR5IiwiQ2FsbGJhY2tUaW1lciIsInBsYXRmb3JtIiwiYWxsS2V5cyIsImxlZnRSaWdodEtleXMiLCJ1cERvd25LZXlzIiwiS2V5Ym9hcmREcmFnRGlyZWN0aW9uVG9LZXlzTWFwIiwiTWFwIiwiS2V5Ym9hcmREcmFnTGlzdGVuZXIiLCJsZWZ0S2V5RG93blByb3BlcnR5IiwicmlnaHRLZXlEb3duUHJvcGVydHkiLCJ1cEtleURvd25Qcm9wZXJ0eSIsImRvd25LZXlEb3duUHJvcGVydHkiLCJzdGFydE5leHRLZXlib2FyZEV2ZW50IiwicmVzdGFydFRpbWVyTmV4dEtleWJvYXJkRXZlbnQiLCJ2ZWN0b3JEZWx0YSIsImNvbnN0cnVjdG9yIiwicHJvdmlkZWRPcHRpb25zIiwiYXNzZXJ0Iiwib3B0aW9ucyIsImRyYWdEZWx0YSIsInNoaWZ0RHJhZ0RlbHRhIiwiZHJhZ1NwZWVkIiwic2hpZnREcmFnU3BlZWQiLCJrZXlib2FyZERyYWdEaXJlY3Rpb24iLCJwb3NpdGlvblByb3BlcnR5IiwidHJhbnNmb3JtIiwiZHJhZ0JvdW5kc1Byb3BlcnR5IiwibWFwUG9zaXRpb24iLCJzdGFydCIsImRyYWciLCJlbmQiLCJtb3ZlT25Ib2xkRGVsYXkiLCJtb3ZlT25Ib2xkSW50ZXJ2YWwiLCJ0YW5kZW0iLCJSRVFVSVJFRCIsInBoZXRpb1JlYWRPbmx5Iiwia2V5cyIsImdldCIsInN1cGVyT3B0aW9ucyIsImlnbm9yZWRNb2RpZmllcktleXMiLCJwcmVzc2VkS2V5c1Byb3BlcnR5IiwibGluayIsInByZXNzZWRLZXlzIiwidmFsdWUiLCJpbmNsdWRlcyIsIl9zdGFydCIsIl9kcmFnIiwiX2VuZCIsIl9kcmFnQm91bmRzUHJvcGVydHkiLCJfbWFwUG9zaXRpb24iLCJfdHJhbnNmb3JtIiwiX3Bvc2l0aW9uUHJvcGVydHkiLCJfZHJhZ1NwZWVkIiwiX3NoaWZ0RHJhZ1NwZWVkIiwiX2RyYWdEZWx0YSIsIl9zaGlmdERyYWdEZWx0YSIsIl9tb3ZlT25Ib2xkRGVsYXkiLCJ1c2VEcmFnU3BlZWQiLCJkcmFnU3RhcnRBY3Rpb24iLCJldmVudCIsImNhbGxiYWNrVGltZXIiLCJwYXJhbWV0ZXJzIiwibmFtZSIsInBoZXRpb1R5cGUiLCJTY2VuZXJ5RXZlbnRJTyIsImNyZWF0ZVRhbmRlbSIsInBoZXRpb0RvY3VtZW50YXRpb24iLCJwaGV0aW9FdmVudFR5cGUiLCJVU0VSIiwiZHJhZ0FjdGlvbiIsImlzUHJlc3NlZFByb3BlcnR5IiwibmV3UG9zaXRpb24iLCJwbHVzIiwibWFwTW9kZWxQb2ludCIsImVxdWFscyIsIl9wb2ludGVyIiwic3ludGhldGljRXZlbnQiLCJjcmVhdGVTeW50aGV0aWNFdmVudCIsInBoZXRpb0hpZ2hGcmVxdWVuY3kiLCJkcmFnRW5kQWN0aW9uIiwic3RvcCIsImNsZWFyUG9pbnRlciIsIl9wb2ludGVyTGlzdGVuZXIiLCJsaXN0ZW5lciIsImludGVycnVwdCIsImJpbmQiLCJpbnRlcnZhbCIsImRlbGF5IiwiY2FsbGJhY2siLCJkZWx0YVgiLCJkZWx0YVkiLCJzaGlmdEtleURvd24iLCJkZWx0YSIsImR0IiwiWkVSTyIsImludmVyc2VEZWx0YTIiLCJleGVjdXRlIiwibGF6eUxpbmsiLCJkcmFnS2V5c0Rvd24iLCJhZGRTdGFydFRpbWVyTGlzdGVuZXIiLCJrZXlQcm9wZXJ0eSIsImtleURvd24iLCJfZGlzcG9zZUtleWJvYXJkRHJhZ0xpc3RlbmVyIiwiZGlzcG9zZSIsImdldERyYWdCb3VuZHMiLCJkcmFnQm91bmRzIiwic2V0VHJhbnNmb3JtIiwiZ2V0VHJhbnNmb3JtIiwibW92aW5nTGVmdCIsIm1vdmluZ1JpZ2h0IiwibW92aW5nVXAiLCJtb3ZpbmdEb3duIiwiZ2V0Q3VycmVudFRhcmdldCIsInRyYWlsIiwibGFzdE5vZGUiLCJrZXlkb3duIiwiZG9tRXZlbnQiLCJtZXRhS2V5IiwiaXNNb3ZlbWVudEtleSIsInNhZmFyaSIsImxlbmd0aCIsInByZXZlbnREZWZhdWx0IiwicG9pbnRlciIsImlzQXR0YWNoZWQiLCJhZGRJbnB1dExpc3RlbmVyIiwiZmlyZSIsIm1vZGVsUG9pbnQiLCJjbG9zZXN0UG9pbnRUbyIsImxpc3RlbmVycyIsInJlbW92ZUlucHV0TGlzdGVuZXIiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIktleWJvYXJkRHJhZ0xpc3RlbmVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE5LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEFuIGlucHV0IGxpc3RlbmVyIGZvciBrZXlib2FyZC1iYXNlZCBkcmFnIGludGVyYWN0aW9ucywgYWxsb3dpbmcgb2JqZWN0cyB0byBiZSBtb3ZlZCB1c2luZyB0aGUgYXJyb3cga2V5cyBvclxyXG4gKiB0aGUgVywgQSwgUywgRCBrZXlzLlxyXG4gKlxyXG4gKiBLZXkgZmVhdHVyZXM6XHJcbiAqIC0gU3VwcG9ydHMgYm90aCBkaXNjcmV0ZSAoc3RlcC1iYXNlZCkgYW5kIGNvbnRpbnVvdXMgKHNwZWVkLWJhc2VkKSBkcmFnZ2luZyBtb2Rlcy5cclxuICogLSBBbGxvd3MgcmVzdHJpY3RpbmcgbW92ZW1lbnQgdG8gc3BlY2lmaWMgYXhlcyAoZS5nLiwgaG9yaXpvbnRhbCBvciB2ZXJ0aWNhbCBvbmx5KSBvciBhbGxvd2luZyBmcmVlIDJEIG1vdmVtZW50LlxyXG4gKiAtIENvbmZpZ3VyYWJsZSBkcmFnIHNwZWVkIGFuZCBkcmFnIGRlbHRhIHZhbHVlcywgd2l0aCBzZXBhcmF0ZSBjb25maWd1cmF0aW9ucyB3aGVuIHRoZSBzaGlmdCBrZXkgaXMgaGVsZCBmb3JcclxuICogICBmaW5lciBjb250cm9sLlxyXG4gKiAtIE9wdGlvbmFsbHkgc3luY2hyb25pemVzIHdpdGggYSAncG9zaXRpb25Qcm9wZXJ0eScgdG8gYWxsb3cgZm9yIG1vZGVsLXZpZXcgY29vcmRpbmF0aW9uIHdpdGggY3VzdG9tIHRyYW5zZm9ybWF0aW9uc1xyXG4gKiAgIGlmIG5lZWRlZC5cclxuICogLSBQcm92aWRlcyBob29rcyBmb3Igc3RhcnQsIGRyYWcgKG1vdmVtZW50KSwgYW5kIGVuZCBwaGFzZXMgb2YgYSBkcmFnIGludGVyYWN0aW9uIHRocm91Z2ggY2FsbGJhY2sgb3B0aW9ucy5cclxuICogLSBJbmNsdWRlcyBzdXBwb3J0IGZvciBkcmFnIGJvdW5kcywgcmVzdHJpY3RpbmcgdGhlIGRyYWdnYWJsZSBhcmVhIHdpdGhpbiBzcGVjaWZpZWQgbW9kZWwgY29vcmRpbmF0ZXMuXHJcbiAqIC0gVXRpbGl6ZXMgYSBDYWxsYmFja1RpbWVyIGZvciBzbW9vdGgsIHRpbWVkIHVwZGF0ZXMgZHVyaW5nIGRyYWcgb3BlcmF0aW9ucywgZXNwZWNpYWxseSB1c2VmdWwgaW4gY29udGludW91cyBkcmFnXHJcbiAqICAgbW9kZS5cclxuICpcclxuICogVXNhZ2U6XHJcbiAqIEF0dGFjaCBhbiBpbnN0YW5jZSBvZiBLZXlib2FyZERyYWdMaXN0ZW5lciB0byBhIE5vZGUgdmlhIHRoZSBgYWRkSW5wdXRMaXN0ZW5lcmAgbWV0aG9kLlxyXG4gKlxyXG4gKiBFeGFtcGxlOlxyXG4gKlxyXG4gKiAgIGNvbnN0IG15Tm9kZSA9IG5ldyBOb2RlKCk7XHJcbiAqICAgY29uc3QgZHJhZ0xpc3RlbmVyID0gbmV3IEtleWJvYXJkRHJhZ0xpc3RlbmVyKCB7XHJcbiAqICAgICBkcmFnRGVsdGE6IDIsXHJcbiAqICAgICBzaGlmdERyYWdEZWx0YTogMixcclxuICogICAgIHN0YXJ0OiAoZXZlbnQsIGxpc3RlbmVyKSA9PiB7IGNvbnNvbGUubG9nKCdEcmFnIHN0YXJ0ZWQnKTsgfSxcclxuICogICAgIGRyYWc6IChldmVudCwgbGlzdGVuZXIpID0+IHsgY29uc29sZS5sb2coJ0RyYWdnaW5nJyk7IH0sXHJcbiAqICAgICBlbmQ6IChldmVudCwgbGlzdGVuZXIpID0+IHsgY29uc29sZS5sb2coJ0RyYWcgZW5kZWQnKTsgfSxcclxuICogICAgIHBvc2l0aW9uUHJvcGVydHk6IG15Tm9kZS5wb3NpdGlvblByb3BlcnR5LFxyXG4gKiAgICAgdHJhbnNmb3JtOiBteU5vZGUuZ2V0VHJhbnNmb3JtKClcclxuICogICB9ICk7XHJcbiAqICAgbXlOb2RlLmFkZElucHV0TGlzdGVuZXIoZHJhZ0xpc3RlbmVyKTtcclxuICpcclxuICogQGF1dGhvciBKZXNzZSBHcmVlbmJlcmcgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgTWljaGFlbCBCYXJsb3dcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBQaGV0aW9BY3Rpb24gZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL1BoZXRpb0FjdGlvbi5qcyc7XHJcbmltcG9ydCBQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IEJvdW5kczIgZnJvbSAnLi4vLi4vLi4vZG90L2pzL0JvdW5kczIuanMnO1xyXG5pbXBvcnQgVHJhbnNmb3JtMyBmcm9tICcuLi8uLi8uLi9kb3QvanMvVHJhbnNmb3JtMy5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IEV2ZW50VHlwZSBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvRXZlbnRUeXBlLmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuaW1wb3J0IHsgZ2xvYmFsS2V5U3RhdGVUcmFja2VyLCBLZXlib2FyZExpc3RlbmVyLCBLZXlib2FyZExpc3RlbmVyT3B0aW9ucywgS2V5Ym9hcmRVdGlscywgTm9kZSwgUERPTVBvaW50ZXIsIHNjZW5lcnksIFNjZW5lcnlFdmVudCwgVElucHV0TGlzdGVuZXIgfSBmcm9tICcuLi9pbXBvcnRzLmpzJztcclxuaW1wb3J0IFRQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUsIHsgRW1wdHlTZWxmT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBhc3NlcnRNdXR1YWxseUV4Y2x1c2l2ZU9wdGlvbnMgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL2Fzc2VydE11dHVhbGx5RXhjbHVzaXZlT3B0aW9ucy5qcyc7XHJcbmltcG9ydCB7IFBoZXRpb09iamVjdE9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvUGhldGlvT2JqZWN0LmpzJztcclxuaW1wb3J0IFRpbnlQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RpbnlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBDYWxsYmFja1RpbWVyIGZyb20gJy4uLy4uLy4uL2F4b24vanMvQ2FsbGJhY2tUaW1lci5qcyc7XHJcbmltcG9ydCBQaWNrT3B0aW9uYWwgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1BpY2tPcHRpb25hbC5qcyc7XHJcbmltcG9ydCBwbGF0Zm9ybSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvcGxhdGZvcm0uanMnO1xyXG5pbXBvcnQgU3RyaWN0T21pdCBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvU3RyaWN0T21pdC5qcyc7XHJcbmltcG9ydCB7IEVuYWJsZWRDb21wb25lbnRPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9FbmFibGVkQ29tcG9uZW50LmpzJztcclxuXHJcbi8vICdzaGlmdCcgaXMgbm90IGluY2x1ZGVkIGluIGFueSBsaXN0IG9mIGtleXMgYmVjYXVzZSB3ZSBkb24ndCB3YW50IHRoZSBLZXlib2FyZExpc3RlbmVyIHRvIGJlICdwcmVzc2VkJyB3aGVuIG9ubHlcclxuLy8gdGhlIHNoaWZ0IGtleSBpcyBkb3duLiBTdGF0ZSBvZiB0aGUgc2hpZnQga2V5IGlzIHRyYWNrZWQgYnkgdGhlIGdsb2JhbEtleVN0YXRlVHJhY2tlci5cclxuY29uc3QgYWxsS2V5cyA9IFsgJ2Fycm93TGVmdCcsICdhcnJvd1JpZ2h0JywgJ2Fycm93VXAnLCAnYXJyb3dEb3duJywgJ3cnLCAnYScsICdzJywgJ2QnIF0gYXMgY29uc3Q7XHJcbmNvbnN0IGxlZnRSaWdodEtleXMgPSBbICdhcnJvd0xlZnQnLCAnYXJyb3dSaWdodCcsICdhJywgJ2QnIF0gYXMgY29uc3Q7XHJcbmNvbnN0IHVwRG93bktleXMgPSBbICdhcnJvd1VwJywgJ2Fycm93RG93bicsICd3JywgJ3MnIF0gYXMgY29uc3Q7XHJcblxyXG50eXBlIEtleWJvYXJkRHJhZ0xpc3RlbmVyS2V5U3Ryb2tlID0gdHlwZW9mIGFsbEtleXMgfCB0eXBlb2YgbGVmdFJpZ2h0S2V5cyB8IHR5cGVvZiB1cERvd25LZXlzO1xyXG5cclxuLy8gUG9zc2libGUgbW92ZW1lbnQgdHlwZXMgZm9yIHRoaXMgS2V5Ym9hcmREcmFnTGlzdGVuZXIuIDJEIG1vdGlvbiAoJ2JvdGgnKSBvciAxRCBtb3Rpb24gKCdsZWZ0UmlnaHQnIG9yICd1cERvd24nKS5cclxudHlwZSBLZXlib2FyZERyYWdEaXJlY3Rpb24gPSAnYm90aCcgfCAnbGVmdFJpZ2h0JyB8ICd1cERvd24nO1xyXG5jb25zdCBLZXlib2FyZERyYWdEaXJlY3Rpb25Ub0tleXNNYXAgPSBuZXcgTWFwPEtleWJvYXJkRHJhZ0RpcmVjdGlvbiwgS2V5Ym9hcmREcmFnTGlzdGVuZXJLZXlTdHJva2U+KCBbXHJcbiAgWyAnYm90aCcsIGFsbEtleXMgXSxcclxuICBbICdsZWZ0UmlnaHQnLCBsZWZ0UmlnaHRLZXlzIF0sXHJcbiAgWyAndXBEb3duJywgdXBEb3duS2V5cyBdXHJcbl0gKTtcclxuXHJcbnR5cGUgTWFwUG9zaXRpb24gPSAoIHBvaW50OiBWZWN0b3IyICkgPT4gVmVjdG9yMjtcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcblxyXG4gIC8vIEhvdyBtdWNoIHRoZSBwb3NpdGlvbiBQcm9wZXJ0eSB3aWxsIGNoYW5nZSBpbiB2aWV3IGNvb3JkaW5hdGVzIGV2ZXJ5IG1vdmVPbkhvbGRJbnRlcnZhbC4gT2JqZWN0IHdpbGxcclxuICAvLyBtb3ZlIGluIGRpc2NyZXRlIHN0ZXBzIGF0IHRoaXMgaW50ZXJ2YWwuIElmIHlvdSB3b3VsZCBsaWtlIHNtb290aGVyIFwiYW5pbWF0ZWRcIiBtb3Rpb24gdXNlIGRyYWdTcGVlZFxyXG4gIC8vIGluc3RlYWQuIGRyYWdEZWx0YSBwcm9kdWNlcyBhIFVYIHRoYXQgaXMgbW9yZSB0eXBpY2FsIGZvciBhcHBsaWNhdGlvbnMgYnV0IGRyYWdTcGVlZCBpcyBiZXR0ZXIgZm9yIHZpZGVvXHJcbiAgLy8gZ2FtZS1saWtlIGNvbXBvbmVudHMuIGRyYWdEZWx0YSBhbmQgZHJhZ1NwZWVkIGFyZSBtdXR1YWxseSBleGNsdXNpdmUgb3B0aW9ucy5cclxuICBkcmFnRGVsdGE/OiBudW1iZXI7XHJcblxyXG4gIC8vIEhvdyBtdWNoIHRoZSBQb3NpdGlvblByb3BlcnR5IHdpbGwgY2hhbmdlIGluIHZpZXcgY29vcmRpbmF0ZXMgZXZlcnkgbW92ZU9uSG9sZEludGVydmFsIHdoaWxlIHRoZSBzaGlmdCBtb2RpZmllclxyXG4gIC8vIGtleSBpcyBwcmVzc2VkLiBTaGlmdCBtb2RpZmllciBzaG91bGQgcHJvZHVjZSBtb3JlIGZpbmUtZ3JhaW5lZCBtb3Rpb24gc28gdGhpcyB2YWx1ZSBuZWVkcyB0byBiZSBsZXNzIHRoYW5cclxuICAvLyBkcmFnRGVsdGEgaWYgcHJvdmlkZWQuIE9iamVjdCB3aWxsIG1vdmUgaW4gZGlzY3JldGUgc3RlcHMuIElmIHlvdSB3b3VsZCBsaWtlIHNtb290aGVyIFwiYW5pbWF0ZWRcIiBtb3Rpb24gdXNlXHJcbiAgLy8gZHJhZ1NwZWVkIG9wdGlvbnMgaW5zdGVhZC4gZHJhZ0RlbHRhIG9wdGlvbnMgcHJvZHVjZSBhIFVYIHRoYXQgaXMgbW9yZSB0eXBpY2FsIGZvciBhcHBsaWNhdGlvbnMgYnV0IGRyYWdTcGVlZFxyXG4gIC8vIGlzIGJldHRlciBmb3IgZ2FtZS1saWtlIGNvbXBvbmVudHMuIGRyYWdEZWx0YSBhbmQgZHJhZ1NwZWVkIGFyZSBtdXR1YWxseSBleGNsdXNpdmUgb3B0aW9ucy5cclxuICBzaGlmdERyYWdEZWx0YT86IG51bWJlcjtcclxuXHJcbiAgLy8gV2hpbGUgYSBkaXJlY3Rpb24ga2V5IGlzIGhlbGQgZG93biwgdGhlIHRhcmdldCB3aWxsIG1vdmUgYnkgdGhpcyBhbW91bnQgaW4gdmlldyBjb29yZGluYXRlcyBldmVyeSBzZWNvbmQuXHJcbiAgLy8gVGhpcyBpcyBhbiBhbHRlcm5hdGl2ZSB3YXkgdG8gY29udHJvbCBtb3Rpb24gd2l0aCBrZXlib2FyZCB0aGFuIGRyYWdEZWx0YSBhbmQgcHJvZHVjZXMgc21vb3RoZXIgbW90aW9uIGZvclxyXG4gIC8vIHRoZSBvYmplY3QuIGRyYWdTcGVlZCBhbmQgZHJhZ0RlbHRhIG9wdGlvbnMgYXJlIG11dHVhbGx5IGV4Y2x1c2l2ZS4gU2VlIGRyYWdEZWx0YSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cclxuICBkcmFnU3BlZWQ/OiBudW1iZXI7XHJcblxyXG4gIC8vIFdoaWxlIGEgZGlyZWN0aW9uIGtleSBpcyBoZWxkIGRvd24gd2l0aCB0aGUgc2hpZnQgbW9kaWZpZXIga2V5LCB0aGUgdGFyZ2V0IHdpbGwgbW92ZSBieSB0aGlzIGFtb3VudCBpbiB2aWV3XHJcbiAgLy8gY29vcmRpbmF0ZXMgZXZlcnkgc2Vjb25kLiBTaGlmdCBtb2RpZmllciBzaG91bGQgcHJvZHVjZSBtb3JlIGZpbmUtZ3JhaW5lZCBtb3Rpb24gc28gdGhpcyB2YWx1ZSBuZWVkcyB0byBiZSBsZXNzXHJcbiAgLy8gdGhhbiBkcmFnU3BlZWQgaWYgcHJvdmlkZWQuIFRoaXMgaXMgYW4gYWx0ZXJuYXRpdmUgd2F5IHRvIGNvbnRyb2wgbW90aW9uIHdpdGgga2V5Ym9hcmQgdGhhbiBkcmFnRGVsdGEgYW5kXHJcbiAgLy8gcHJvZHVjZXMgc21vb3RoZXIgbW90aW9uIGZvciB0aGUgb2JqZWN0LiBkcmFnU3BlZWQgYW5kIGRyYWdEZWx0YSBvcHRpb25zIGFyZSBtdXR1YWxseSBleGNsdXNpdmUuIFNlZSBkcmFnRGVsdGFcclxuICAvLyBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cclxuICBzaGlmdERyYWdTcGVlZD86IG51bWJlcjtcclxuXHJcbiAgLy8gU3BlY2lmaWVzIHRoZSBkaXJlY3Rpb24gb2YgbW90aW9uIGZvciB0aGUgS2V5Ym9hcmREcmFnTGlzdGVuZXIuIEJ5IGRlZmF1bHQsIHRoZSBwb3NpdGlvbiBWZWN0b3IyIGNhbiBjaGFuZ2UgaW5cclxuICAvLyBib3RoIGRpcmVjdGlvbnMgYnkgcHJlc3NpbmcgdGhlIGFycm93IGtleXMuIEJ1dCB5b3UgY2FuIGNvbnN0cmFpbiBkcmFnZ2luZyB0byAxRCBsZWZ0LXJpZ2h0IG9yIHVwLWRvd24gbW90aW9uXHJcbiAgLy8gd2l0aCB0aGlzIHZhbHVlLlxyXG4gIGtleWJvYXJkRHJhZ0RpcmVjdGlvbj86IEtleWJvYXJkRHJhZ0RpcmVjdGlvbjtcclxuXHJcbiAgLy8gSWYgcHJvdmlkZWQsIGl0IHdpbGwgYmUgc3luY2hyb25pemVkIHdpdGggdGhlIGRyYWcgcG9zaXRpb24gaW4gdGhlIG1vZGVsIGZyYW1lLCBhcHBseWluZyBwcm92aWRlZCB0cmFuc2Zvcm1zIGFzXHJcbiAgLy8gbmVlZGVkLiBNb3N0IHVzZWZ1bCB3aGVuIHVzZWQgd2l0aCB0cmFuc2Zvcm0gb3B0aW9uXHJcbiAgcG9zaXRpb25Qcm9wZXJ0eT86IFBpY2s8VFByb3BlcnR5PFZlY3RvcjI+LCAndmFsdWUnPiB8IG51bGw7XHJcblxyXG4gIC8vIElmIHByb3ZpZGVkLCB0aGlzIHdpbGwgYmUgdGhlIGNvbnZlcnNpb24gYmV0d2VlbiB0aGUgdmlldyBhbmQgbW9kZWwgY29vcmRpbmF0ZSBmcmFtZXMuIFVzdWFsbHkgbW9zdCB1c2VmdWwgd2hlblxyXG4gIC8vIHBhaXJlZCB3aXRoIHRoZSBwb3NpdGlvblByb3BlcnR5LlxyXG4gIHRyYW5zZm9ybT86IFRyYW5zZm9ybTMgfCBUUmVhZE9ubHlQcm9wZXJ0eTxUcmFuc2Zvcm0zPiB8IG51bGw7XHJcblxyXG4gIC8vIElmIHByb3ZpZGVkLCB0aGUgbW9kZWwgcG9zaXRpb24gd2lsbCBiZSBjb25zdHJhaW5lZCB0byBiZSBpbnNpZGUgdGhlc2UgYm91bmRzLCBpbiBtb2RlbCBjb29yZGluYXRlc1xyXG4gIGRyYWdCb3VuZHNQcm9wZXJ0eT86IFRSZWFkT25seVByb3BlcnR5PEJvdW5kczIgfCBudWxsPiB8IG51bGw7XHJcblxyXG4gIC8vIElmIHByb3ZpZGVkLCBpdCB3aWxsIGFsbG93IGN1c3RvbSBtYXBwaW5nXHJcbiAgLy8gZnJvbSB0aGUgZGVzaXJlZCBwb3NpdGlvbiAoaS5lLiB3aGVyZSB0aGUgcG9pbnRlciBpcykgdG8gdGhlIGFjdHVhbCBwb3NzaWJsZSBwb3NpdGlvbiAoaS5lLiB3aGVyZSB0aGUgZHJhZ2dlZFxyXG4gIC8vIG9iamVjdCBlbmRzIHVwKS4gRm9yIGV4YW1wbGUsIHVzaW5nIGRyYWdCb3VuZHNQcm9wZXJ0eSBpcyBlcXVpdmFsZW50IHRvIHBhc3Npbmc6XHJcbiAgLy8gICBtYXBQb3NpdGlvbjogZnVuY3Rpb24oIHBvaW50ICkgeyByZXR1cm4gZHJhZ0JvdW5kc1Byb3BlcnR5LnZhbHVlLmNsb3Nlc3RQb2ludFRvKCBwb2ludCApOyB9XHJcbiAgbWFwUG9zaXRpb24/OiBNYXBQb3NpdGlvbiB8IG51bGw7XHJcblxyXG4gIC8vIENhbGxlZCB3aGVuIGtleWJvYXJkIGRyYWcgaXMgc3RhcnRlZCAob24gaW5pdGlhbCBwcmVzcykuXHJcbiAgc3RhcnQ/OiAoICggZXZlbnQ6IFNjZW5lcnlFdmVudCwgbGlzdGVuZXI6IEtleWJvYXJkRHJhZ0xpc3RlbmVyICkgPT4gdm9pZCApIHwgbnVsbDtcclxuXHJcbiAgLy8gQ2FsbGVkIGR1cmluZyBkcmFnLiBJZiBwcm92aWRlZE9wdGlvbnMudHJhbnNmb3JtIGlzIHByb3ZpZGVkLCB2ZWN0b3JEZWx0YSB3aWxsIGJlIGluIG1vZGVsIGNvb3JkaW5hdGVzLlxyXG4gIC8vIE90aGVyd2lzZSwgaXQgd2lsbCBiZSBpbiB2aWV3IGNvb3JkaW5hdGVzLiBOb3RlIHRoYXQgdGhpcyBkb2VzIG5vdCBwcm92aWRlIHRoZSBTY2VuZXJ5RXZlbnQuIERyYWdnaW5nXHJcbiAgLy8gaGFwcGVucyBkdXJpbmcgYW5pbWF0aW9uIChhcyBsb25nIGFzIGtleXMgYXJlIGRvd24pLCBzbyB0aGVyZSBpcyBubyBldmVudCBhc3NvY2lhdGVkIHdpdGggdGhlIGRyYWcuXHJcbiAgZHJhZz86ICggKCBldmVudDogU2NlbmVyeUV2ZW50LCBsaXN0ZW5lcjogS2V5Ym9hcmREcmFnTGlzdGVuZXIgKSA9PiB2b2lkICkgfCBudWxsO1xyXG5cclxuICAvLyBDYWxsZWQgd2hlbiBrZXlib2FyZCBkcmFnZ2luZyBlbmRzLlxyXG4gIGVuZD86ICggKCBldmVudDogU2NlbmVyeUV2ZW50IHwgbnVsbCwgbGlzdGVuZXI6IEtleWJvYXJkRHJhZ0xpc3RlbmVyICkgPT4gdm9pZCApIHwgbnVsbDtcclxuXHJcbiAgLy8gQXJyb3cga2V5cyBtdXN0IGJlIHByZXNzZWQgdGhpcyBsb25nIHRvIGJlZ2luIG1vdmVtZW50IHNldCBvbiBtb3ZlT25Ib2xkSW50ZXJ2YWwsIGluIG1zXHJcbiAgbW92ZU9uSG9sZERlbGF5PzogbnVtYmVyO1xyXG5cclxuICAvLyBUaW1lIGludGVydmFsIGF0IHdoaWNoIHRoZSBvYmplY3Qgd2lsbCBjaGFuZ2UgcG9zaXRpb24gd2hpbGUgdGhlIGFycm93IGtleSBpcyBoZWxkIGRvd24sIGluIG1zLiBUaGlzIG11c3QgYmUgbGFyZ2VyXHJcbiAgLy8gdGhhbiAwIHRvIHByZXZlbnQgZHJhZ2dpbmcgdGhhdCBpcyBiYXNlZCBvbiBob3cgb2Z0ZW4gYW5pbWF0aW9uLWZyYW1lIHN0ZXBzIG9jY3VyLlxyXG4gIG1vdmVPbkhvbGRJbnRlcnZhbD86IG51bWJlcjtcclxuXHJcbiAgLy8gVGhvdWdoIERyYWdMaXN0ZW5lciBpcyBub3QgaW5zdHJ1bWVudGVkLCBkZWNsYXJlIHRoZXNlIGhlcmUgdG8gc3VwcG9ydCBwcm9wZXJseSBwYXNzaW5nIHRoaXMgdG8gY2hpbGRyZW4sIHNlZVxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy90YW5kZW0vaXNzdWVzLzYwLlxyXG59ICYgUGljazxQaGV0aW9PYmplY3RPcHRpb25zLCAndGFuZGVtJyB8ICdwaGV0aW9SZWFkT25seSc+O1xyXG5cclxudHlwZSBQYXJlbnRPcHRpb25zID0gU3RyaWN0T21pdDxLZXlib2FyZExpc3RlbmVyT3B0aW9uczxLZXlib2FyZERyYWdMaXN0ZW5lcktleVN0cm9rZT4sICdrZXlzJz47XHJcblxyXG5leHBvcnQgdHlwZSBLZXlib2FyZERyYWdMaXN0ZW5lck9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIC8vIE9wdGlvbnMgc3BlY2lmaWMgdG8gdGhpcyBjbGFzc1xyXG4gIFBpY2tPcHRpb25hbDxQYXJlbnRPcHRpb25zLCAnZm9jdXMnIHwgJ2JsdXInPiAmIC8vIE9ubHkgZm9jdXMvYmx1ciBhcmUgb3B0aW9uYWwgZnJvbSB0aGUgc3VwZXJjbGFzc1xyXG4gIEVuYWJsZWRDb21wb25lbnRPcHRpb25zOyAvLyBPdGhlciBzdXBlcmNsYXNzIG9wdGlvbnMgYXJlIGFsbG93ZWRcclxuXHJcbmNsYXNzIEtleWJvYXJkRHJhZ0xpc3RlbmVyIGV4dGVuZHMgS2V5Ym9hcmRMaXN0ZW5lcjxLZXlib2FyZERyYWdMaXN0ZW5lcktleVN0cm9rZT4ge1xyXG5cclxuICAvLyBTZWUgb3B0aW9ucyBmb3IgZG9jdW1lbnRhdGlvblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgX3N0YXJ0OiAoICggZXZlbnQ6IFNjZW5lcnlFdmVudCwgbGlzdGVuZXI6IEtleWJvYXJkRHJhZ0xpc3RlbmVyICkgPT4gdm9pZCApIHwgbnVsbDtcclxuICBwcml2YXRlIHJlYWRvbmx5IF9kcmFnOiAoICggZXZlbnQ6IFNjZW5lcnlFdmVudCwgbGlzdGVuZXI6IEtleWJvYXJkRHJhZ0xpc3RlbmVyICkgPT4gdm9pZCApIHwgbnVsbDtcclxuICBwcml2YXRlIHJlYWRvbmx5IF9lbmQ6ICggKCBldmVudDogU2NlbmVyeUV2ZW50IHwgbnVsbCwgbGlzdGVuZXI6IEtleWJvYXJkRHJhZ0xpc3RlbmVyICkgPT4gdm9pZCApIHwgbnVsbDtcclxuICBwcml2YXRlIF9kcmFnQm91bmRzUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PEJvdW5kczIgfCBudWxsPjtcclxuICBwcml2YXRlIHJlYWRvbmx5IF9tYXBQb3NpdGlvbjogTWFwUG9zaXRpb24gfCBudWxsO1xyXG4gIHByaXZhdGUgX3RyYW5zZm9ybTogVHJhbnNmb3JtMyB8IFRSZWFkT25seVByb3BlcnR5PFRyYW5zZm9ybTM+IHwgbnVsbDtcclxuICBwcml2YXRlIHJlYWRvbmx5IF9wb3NpdGlvblByb3BlcnR5OiBQaWNrPFRQcm9wZXJ0eTxWZWN0b3IyPiwgJ3ZhbHVlJz4gfCBudWxsO1xyXG4gIHByaXZhdGUgX2RyYWdTcGVlZDogbnVtYmVyO1xyXG4gIHByaXZhdGUgX3NoaWZ0RHJhZ1NwZWVkOiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBfZHJhZ0RlbHRhOiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBfc2hpZnREcmFnRGVsdGE6IG51bWJlcjtcclxuICBwcml2YXRlIHJlYWRvbmx5IF9tb3ZlT25Ib2xkRGVsYXk6IG51bWJlcjtcclxuXHJcbiAgLy8gUHJvcGVydGllcyBpbnRlcm5hbCB0byB0aGUgbGlzdGVuZXIgdGhhdCB0cmFjayBwcmVzc2VkIGtleXMuIEluc3RlYWQgb2YgdXBkYXRpbmcgaW4gdGhlIEtleWJvYXJkTGlzdGVuZXJcclxuICAvLyBjYWxsYmFjaywgdGhlIHBvc2l0aW9uUHJvcGVydHkgaXMgdXBkYXRlZCBpbiBhIGNhbGxiYWNrIHRpbWVyIGRlcGVuZGluZyBvbiB0aGUgc3RhdGUgb2YgdGhlc2UgUHJvcGVydGllc1xyXG4gIC8vIHNvIHRoYXQgbW92ZW1lbnQgaXMgc21vb3RoLlxyXG4gIHByaXZhdGUgbGVmdEtleURvd25Qcm9wZXJ0eSA9IG5ldyBUaW55UHJvcGVydHk8Ym9vbGVhbj4oIGZhbHNlICk7XHJcbiAgcHJpdmF0ZSByaWdodEtleURvd25Qcm9wZXJ0eSA9IG5ldyBUaW55UHJvcGVydHk8Ym9vbGVhbj4oIGZhbHNlICk7XHJcbiAgcHJpdmF0ZSB1cEtleURvd25Qcm9wZXJ0eSA9IG5ldyBUaW55UHJvcGVydHk8Ym9vbGVhbj4oIGZhbHNlICk7XHJcbiAgcHJpdmF0ZSBkb3duS2V5RG93blByb3BlcnR5ID0gbmV3IFRpbnlQcm9wZXJ0eTxib29sZWFuPiggZmFsc2UgKTtcclxuXHJcbiAgLy8gRmlyZXMgdG8gY29uZHVjdCB0aGUgc3RhcnQgYW5kIGVuZCBvZiBhIGRyYWcsIGFkZGVkIGZvciBQaEVULWlPIGludGVyb3BlcmFiaWxpdHlcclxuICBwcml2YXRlIGRyYWdTdGFydEFjdGlvbjogUGhldGlvQWN0aW9uPFsgU2NlbmVyeUV2ZW50IF0+O1xyXG4gIHByaXZhdGUgZHJhZ0VuZEFjdGlvbjogUGhldGlvQWN0aW9uO1xyXG4gIHByaXZhdGUgZHJhZ0FjdGlvbjogUGhldGlvQWN0aW9uO1xyXG5cclxuICAvLyBLZXlib2FyZERyYWdMaXN0ZW5lciBpcyBpbXBsZW1lbnRlZCB3aXRoIEtleWJvYXJkTGlzdGVuZXIgYW5kIHRoZXJlZm9yZSBIb3RrZXkuIEhvdGtleXMgdXNlICdnbG9iYWwnIERPTSBldmVudHNcclxuICAvLyBpbnN0ZWFkIG9mIFNjZW5lcnlFdmVudCBkaXNwYXRjaC4gSW4gb3JkZXIgdG8gc3RhcnQgdGhlIGRyYWcgd2l0aCBhIFNjZW5lcnlFdmVudCwgdGhpcyBsaXN0ZW5lciB3YWl0c1xyXG4gIC8vIHRvIHN0YXJ0IHVudGlsIGl0cyBrZXlzIGFyZSBwcmVzc2VkLCBhbmQgaXQgc3RhcnRzIHRoZSBkcmFnIG9uIHRoZSBuZXh0IFNjZW5lcnlFdmVudCBmcm9tIGtleWRvd24gZGlzcGF0Y2guXHJcbiAgcHJpdmF0ZSBzdGFydE5leHRLZXlib2FyZEV2ZW50ID0gZmFsc2U7XHJcblxyXG4gIC8vIFNpbWlsYXIgdG8gdGhlIGFib3ZlLCBidXQgdXNlZCBmb3IgcmVzdGFydGluZyB0aGUgY2FsbGJhY2sgdGltZXIgb24gdGhlIG5leHQga2V5ZG93biBldmVudCB3aGVuIGEgbmV3IGtleSBpc1xyXG4gIC8vIHByZXNzZWQuXHJcbiAgcHJpdmF0ZSByZXN0YXJ0VGltZXJOZXh0S2V5Ym9hcmRFdmVudCA9IGZhbHNlO1xyXG5cclxuICAvLyBJbXBsZW1lbnRzIGRpc3Bvc2FsLlxyXG4gIHByaXZhdGUgcmVhZG9ubHkgX2Rpc3Bvc2VLZXlib2FyZERyYWdMaXN0ZW5lcjogKCkgPT4gdm9pZDtcclxuXHJcbiAgLy8gQSBsaXN0ZW5lciBhZGRlZCB0byB0aGUgcG9pbnRlciB3aGVuIGRyYWdnaW5nIHN0YXJ0cyBzbyB0aGF0IHdlIGNhbiBhdHRhY2ggYSBsaXN0ZW5lciBhbmQgcHJvdmlkZSBhIGNoYW5uZWwgb2ZcclxuICAvLyBjb21tdW5pY2F0aW9uIHRvIHRoZSBBbmltYXRlZFBhblpvb21MaXN0ZW5lciB0byBkZWZpbmUgY3VzdG9tIGJlaGF2aW9yIGZvciBzY3JlZW4gcGFubmluZyBkdXJpbmcgYSBkcmFnIG9wZXJhdGlvbi5cclxuICBwcml2YXRlIHJlYWRvbmx5IF9wb2ludGVyTGlzdGVuZXI6IFRJbnB1dExpc3RlbmVyO1xyXG5cclxuICAvLyBBIHJlZmVyZW5jZSB0byB0aGUgUG9pbnRlciBkdXJpbmcgYSBkcmFnIG9wZXJhdGlvbiBzbyB0aGF0IHdlIGNhbiBhZGQvcmVtb3ZlIHRoZSBfcG9pbnRlckxpc3RlbmVyLlxyXG4gIHByaXZhdGUgX3BvaW50ZXI6IFBET01Qb2ludGVyIHwgbnVsbDtcclxuXHJcbiAgLy8gV2hldGhlciB0aGlzIGxpc3RlbmVyIHVzZXMgYSBzcGVlZCBpbXBsZW1lbnRhdGlvbiBvciBkZWx0YSBpbXBsZW1lbnRhdGlvbiBmb3IgZHJhZ2dpbmcuIFNlZSBvcHRpb25zXHJcbiAgLy8gZHJhZ1NwZWVkIGFuZCBkcmFnRGVsdGEgZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgcHJpdmF0ZSByZWFkb25seSB1c2VEcmFnU3BlZWQ6IGJvb2xlYW47XHJcblxyXG4gIC8vIFRoZSB2ZWN0b3IgZGVsdGEgdGhhdCBpcyB1c2VkIHRvIG1vdmUgdGhlIG9iamVjdCBkdXJpbmcgYSBkcmFnIG9wZXJhdGlvbi4gQXNzaWduZWQgdG8gdGhlIGxpc3RlbmVyIHNvIHRoYXRcclxuICAvLyBpdCBpcyB1c2FibGUgaW4gdGhlIGRyYWcgY2FsbGJhY2suXHJcbiAgcHVibGljIHZlY3RvckRlbHRhOiBWZWN0b3IyID0gbmV3IFZlY3RvcjIoIDAsIDAgKTtcclxuXHJcbiAgLy8gVGhlIGNhbGxiYWNrIHRpbWVyIHRoYXQgaXMgdXNlZCB0byBtb3ZlIHRoZSBvYmplY3QgZHVyaW5nIGEgZHJhZyBvcGVyYXRpb24gdG8gc3VwcG9ydCBhbmltYXRlZCBtb3Rpb24gYW5kXHJcbiAgLy8gbW90aW9uIGV2ZXJ5IG1vdmVPbkhvbGRJbnRlcnZhbC5cclxuICBwcml2YXRlIHJlYWRvbmx5IGNhbGxiYWNrVGltZXI6IENhbGxiYWNrVGltZXI7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggcHJvdmlkZWRPcHRpb25zPzogS2V5Ym9hcmREcmFnTGlzdGVuZXJPcHRpb25zICkge1xyXG5cclxuICAgIC8vIFVzZSBlaXRoZXIgZHJhZ1NwZWVkIG9yIGRyYWdEZWx0YSwgY2Fubm90IHVzZSBib3RoIGF0IHRoZSBzYW1lIHRpbWUuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zKCBwcm92aWRlZE9wdGlvbnMsIFsgJ2RyYWdTcGVlZCcsICdzaGlmdERyYWdTcGVlZCcgXSwgWyAnZHJhZ0RlbHRhJywgJ3NoaWZ0RHJhZ0RlbHRhJyBdICk7XHJcblxyXG4gICAgLy8gJ21vdmUgb24gaG9sZCcgdGltaW5ncyBhcmUgb25seSByZWxldmFudCBmb3IgJ2RlbHRhJyBpbXBsZW1lbnRhdGlvbnMgb2YgZHJhZ2dpbmdcclxuICAgIGFzc2VydCAmJiBhc3NlcnRNdXR1YWxseUV4Y2x1c2l2ZU9wdGlvbnMoIHByb3ZpZGVkT3B0aW9ucywgWyAnZHJhZ1NwZWVkJyBdLCBbICdtb3ZlT25Ib2xkRGVsYXknLCAnbW92ZU9uSE9sZEludGVydmFsJyBdICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zKCBwcm92aWRlZE9wdGlvbnMsIFsgJ21hcFBvc2l0aW9uJyBdLCBbICdkcmFnQm91bmRzUHJvcGVydHknIF0gKTtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPEtleWJvYXJkRHJhZ0xpc3RlbmVyT3B0aW9ucywgU2VsZk9wdGlvbnMsIFBhcmVudE9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgIC8vIGRlZmF1bHQgbW92ZXMgdGhlIG9iamVjdCByb3VnaGx5IDYwMCB2aWV3IGNvb3JkaW5hdGVzIGV2ZXJ5IHNlY29uZCwgYXNzdW1pbmcgNjAgZnBzXHJcbiAgICAgIGRyYWdEZWx0YTogMTAsXHJcbiAgICAgIHNoaWZ0RHJhZ0RlbHRhOiA1LFxyXG4gICAgICBkcmFnU3BlZWQ6IDAsXHJcbiAgICAgIHNoaWZ0RHJhZ1NwZWVkOiAwLFxyXG4gICAgICBrZXlib2FyZERyYWdEaXJlY3Rpb246ICdib3RoJyxcclxuICAgICAgcG9zaXRpb25Qcm9wZXJ0eTogbnVsbCxcclxuICAgICAgdHJhbnNmb3JtOiBudWxsLFxyXG4gICAgICBkcmFnQm91bmRzUHJvcGVydHk6IG51bGwsXHJcbiAgICAgIG1hcFBvc2l0aW9uOiBudWxsLFxyXG4gICAgICBzdGFydDogbnVsbCxcclxuICAgICAgZHJhZzogbnVsbCxcclxuICAgICAgZW5kOiBudWxsLFxyXG4gICAgICBtb3ZlT25Ib2xkRGVsYXk6IDUwMCxcclxuICAgICAgbW92ZU9uSG9sZEludGVydmFsOiA0MDAsXHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLlJFUVVJUkVELFxyXG5cclxuICAgICAgLy8gRHJhZ0xpc3RlbmVyIGJ5IGRlZmF1bHQgZG9lc24ndCBhbGxvdyBQaEVULWlPIHRvIHRyaWdnZXIgZHJhZyBBY3Rpb24gZXZlbnRzXHJcbiAgICAgIHBoZXRpb1JlYWRPbmx5OiB0cnVlXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLnNoaWZ0RHJhZ1NwZWVkIDw9IG9wdGlvbnMuZHJhZ1NwZWVkLCAnc2hpZnREcmFnU3BlZWQgc2hvdWxkIGJlIGxlc3MgdGhhbiBvciBlcXVhbCB0byBzaGlmdERyYWdTcGVlZCwgaXQgaXMgaW50ZW5kZWQgdG8gcHJvdmlkZSBtb3JlIGZpbmUtZ3JhaW5lZCBjb250cm9sJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5zaGlmdERyYWdEZWx0YSA8PSBvcHRpb25zLmRyYWdEZWx0YSwgJ3NoaWZ0RHJhZ0RlbHRhIHNob3VsZCBiZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gZHJhZ0RlbHRhLCBpdCBpcyBpbnRlbmRlZCB0byBwcm92aWRlIG1vcmUgZmluZS1ncmFpbmVkIGNvbnRyb2wnICk7XHJcblxyXG4gICAgY29uc3Qga2V5cyA9IEtleWJvYXJkRHJhZ0RpcmVjdGlvblRvS2V5c01hcC5nZXQoIG9wdGlvbnMua2V5Ym9hcmREcmFnRGlyZWN0aW9uICkhO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCgga2V5cywgJ0ludmFsaWQga2V5Ym9hcmREcmFnRGlyZWN0aW9uJyApO1xyXG5cclxuICAgIGNvbnN0IHN1cGVyT3B0aW9ucyA9IG9wdGlvbml6ZTxLZXlib2FyZERyYWdMaXN0ZW5lck9wdGlvbnMsIEVtcHR5U2VsZk9wdGlvbnMsIEtleWJvYXJkTGlzdGVuZXJPcHRpb25zPEtleWJvYXJkRHJhZ0xpc3RlbmVyS2V5U3Ryb2tlPj4oKSgge1xyXG4gICAgICBrZXlzOiBrZXlzLFxyXG5cclxuICAgICAgLy8gV2Ugc3RpbGwgd2FudCB0byBzdGFydCBkcmFnIG9wZXJhdGlvbnMgd2hlbiB0aGUgc2hpZnQgbW9kaWZpZXIga2V5IGlzIHByZXNzZWQsIGV2ZW4gdGhvdWdoIGl0IGlzIG5vdFxyXG4gICAgICAvLyBsaXN0ZWQgaW4ga2V5cy5cclxuICAgICAgaWdub3JlZE1vZGlmaWVyS2V5czogWyAnc2hpZnQnIF1cclxuICAgIH0sIG9wdGlvbnMgKTtcclxuXHJcbiAgICBzdXBlciggc3VwZXJPcHRpb25zICk7XHJcblxyXG4gICAgLy8gcHJlc3NlZEtleXNQcm9wZXJ0eSBjb21lcyBmcm9tIEtleWJvYXJkTGlzdGVuZXIsIGFuZCBpdCBpcyB1c2VkIHRvIGRldGVybWluZSB0aGUgc3RhdGUgb2YgdGhlIG1vdmVtZW50IGtleXMuXHJcbiAgICAvLyBUaGlzIGFwcHJvYWNoIGdpdmVzIG1vcmUgY29udHJvbCBvdmVyIHRoZSBwb3NpdGlvblByb3BlcnR5IGluIHRoZSBjYWxsYmFja1RpbWVyIHRoYW4gdXNpbmcgdGhlIEtleWJvYXJkTGlzdGVuZXJcclxuICAgIC8vIGNhbGxiYWNrLlxyXG4gICAgdGhpcy5wcmVzc2VkS2V5c1Byb3BlcnR5LmxpbmsoIHByZXNzZWRLZXlzID0+IHtcclxuICAgICAgdGhpcy5sZWZ0S2V5RG93blByb3BlcnR5LnZhbHVlID0gcHJlc3NlZEtleXMuaW5jbHVkZXMoICdhcnJvd0xlZnQnICkgfHwgcHJlc3NlZEtleXMuaW5jbHVkZXMoICdhJyApO1xyXG4gICAgICB0aGlzLnJpZ2h0S2V5RG93blByb3BlcnR5LnZhbHVlID0gcHJlc3NlZEtleXMuaW5jbHVkZXMoICdhcnJvd1JpZ2h0JyApIHx8IHByZXNzZWRLZXlzLmluY2x1ZGVzKCAnZCcgKTtcclxuICAgICAgdGhpcy51cEtleURvd25Qcm9wZXJ0eS52YWx1ZSA9IHByZXNzZWRLZXlzLmluY2x1ZGVzKCAnYXJyb3dVcCcgKSB8fCBwcmVzc2VkS2V5cy5pbmNsdWRlcyggJ3cnICk7XHJcbiAgICAgIHRoaXMuZG93bktleURvd25Qcm9wZXJ0eS52YWx1ZSA9IHByZXNzZWRLZXlzLmluY2x1ZGVzKCAnYXJyb3dEb3duJyApIHx8IHByZXNzZWRLZXlzLmluY2x1ZGVzKCAncycgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBNdXRhYmxlIGF0dHJpYnV0ZXMgZGVjbGFyZWQgZnJvbSBvcHRpb25zLCBzZWUgb3B0aW9ucyBmb3IgaW5mbywgYXMgd2VsbCBhcyBnZXR0ZXJzIGFuZCBzZXR0ZXJzLlxyXG4gICAgdGhpcy5fc3RhcnQgPSBvcHRpb25zLnN0YXJ0O1xyXG4gICAgdGhpcy5fZHJhZyA9IG9wdGlvbnMuZHJhZztcclxuICAgIHRoaXMuX2VuZCA9IG9wdGlvbnMuZW5kO1xyXG4gICAgdGhpcy5fZHJhZ0JvdW5kc1Byb3BlcnR5ID0gKCBvcHRpb25zLmRyYWdCb3VuZHNQcm9wZXJ0eSB8fCBuZXcgUHJvcGVydHkoIG51bGwgKSApO1xyXG4gICAgdGhpcy5fbWFwUG9zaXRpb24gPSBvcHRpb25zLm1hcFBvc2l0aW9uO1xyXG4gICAgdGhpcy5fdHJhbnNmb3JtID0gb3B0aW9ucy50cmFuc2Zvcm07XHJcbiAgICB0aGlzLl9wb3NpdGlvblByb3BlcnR5ID0gb3B0aW9ucy5wb3NpdGlvblByb3BlcnR5O1xyXG4gICAgdGhpcy5fZHJhZ1NwZWVkID0gb3B0aW9ucy5kcmFnU3BlZWQ7XHJcbiAgICB0aGlzLl9zaGlmdERyYWdTcGVlZCA9IG9wdGlvbnMuc2hpZnREcmFnU3BlZWQ7XHJcbiAgICB0aGlzLl9kcmFnRGVsdGEgPSBvcHRpb25zLmRyYWdEZWx0YTtcclxuICAgIHRoaXMuX3NoaWZ0RHJhZ0RlbHRhID0gb3B0aW9ucy5zaGlmdERyYWdEZWx0YTtcclxuICAgIHRoaXMuX21vdmVPbkhvbGREZWxheSA9IG9wdGlvbnMubW92ZU9uSG9sZERlbGF5O1xyXG5cclxuICAgIC8vIFNpbmNlIGRyYWdTcGVlZCBhbmQgZHJhZ0RlbHRhIGFyZSBtdXR1YWxseS1leGNsdXNpdmUgZHJhZyBpbXBsZW1lbnRhdGlvbnMsIGEgdmFsdWUgZm9yIGVpdGhlciBvbmUgb2YgdGhlc2VcclxuICAgIC8vIG9wdGlvbnMgaW5kaWNhdGVzIHdlIHNob3VsZCB1c2UgYSBzcGVlZCBpbXBsZW1lbnRhdGlvbiBmb3IgZHJhZ2dpbmcuXHJcbiAgICB0aGlzLnVzZURyYWdTcGVlZCA9IG9wdGlvbnMuZHJhZ1NwZWVkID4gMCB8fCBvcHRpb25zLnNoaWZ0RHJhZ1NwZWVkID4gMDtcclxuXHJcbiAgICB0aGlzLmRyYWdTdGFydEFjdGlvbiA9IG5ldyBQaGV0aW9BY3Rpb24oIGV2ZW50ID0+IHtcclxuICAgICAgdGhpcy5fc3RhcnQgJiYgdGhpcy5fc3RhcnQoIGV2ZW50LCB0aGlzICk7XHJcblxyXG4gICAgICBpZiAoIHRoaXMudXNlRHJhZ1NwZWVkICkge1xyXG4gICAgICAgIHRoaXMuY2FsbGJhY2tUaW1lci5zdGFydCgpO1xyXG4gICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgIHBhcmFtZXRlcnM6IFsgeyBuYW1lOiAnZXZlbnQnLCBwaGV0aW9UeXBlOiBTY2VuZXJ5RXZlbnQuU2NlbmVyeUV2ZW50SU8gfSBdLFxyXG4gICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ2RyYWdTdGFydEFjdGlvbicgKSxcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ0VtaXRzIHdoZW5ldmVyIGEga2V5Ym9hcmQgZHJhZyBzdGFydHMuJyxcclxuICAgICAgcGhldGlvUmVhZE9ubHk6IG9wdGlvbnMucGhldGlvUmVhZE9ubHksXHJcbiAgICAgIHBoZXRpb0V2ZW50VHlwZTogRXZlbnRUeXBlLlVTRVJcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBUaGUgZHJhZyBhY3Rpb24gb25seSBleGVjdXRlcyB3aGVuIHRoZXJlIGlzIGFjdHVhbCBtb3ZlbWVudCAodmVjdG9yRGVsdGEgaXMgbm9uLXplcm8pLiBGb3IgZXhhbXBsZSwgaXQgZG9lc1xyXG4gICAgLy8gTk9UIGV4ZWN1dGUgaWYgY29uZmxpY3Rpbmcga2V5cyBhcmUgcHJlc3NlZCAoZS5nLiBsZWZ0IGFuZCByaWdodCBhcnJvdyBrZXlzIGF0IHRoZSBzYW1lIHRpbWUpLiBOb3RlIHRoYXQgdGhpc1xyXG4gICAgLy8gaXMgZXhwZWN0ZWQgdG8gYmUgZXhlY3V0ZWQgZnJvbSB0aGUgQ2FsbGJhY2tUaW1lci4gU28gdGhlcmUgd2lsbCBiZSBwcm9ibGVtcyBpZiB0aGlzIGNhbiBiZSBleGVjdXRlZCBmcm9tXHJcbiAgICAvLyBQaEVULWlPIGNsaWVudHMuXHJcbiAgICB0aGlzLmRyYWdBY3Rpb24gPSBuZXcgUGhldGlvQWN0aW9uKCAoKSA9PiB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuaXNQcmVzc2VkUHJvcGVydHkudmFsdWUsICdUaGUgbGlzdGVuZXIgc2hvdWxkIG5vdCBiZSBkcmFnZ2luZyBpZiBub3QgcHJlc3NlZCcgKTtcclxuXHJcbiAgICAgIC8vIHN5bmNocm9uaXplIHdpdGggbW9kZWwgcG9zaXRpb25cclxuICAgICAgaWYgKCB0aGlzLl9wb3NpdGlvblByb3BlcnR5ICkge1xyXG4gICAgICAgIGxldCBuZXdQb3NpdGlvbiA9IHRoaXMuX3Bvc2l0aW9uUHJvcGVydHkudmFsdWUucGx1cyggdGhpcy52ZWN0b3JEZWx0YSApO1xyXG4gICAgICAgIG5ld1Bvc2l0aW9uID0gdGhpcy5tYXBNb2RlbFBvaW50KCBuZXdQb3NpdGlvbiApO1xyXG5cclxuICAgICAgICAvLyB1cGRhdGUgdGhlIHBvc2l0aW9uIGlmIGl0IGlzIGRpZmZlcmVudFxyXG4gICAgICAgIGlmICggIW5ld1Bvc2l0aW9uLmVxdWFscyggdGhpcy5fcG9zaXRpb25Qcm9wZXJ0eS52YWx1ZSApICkge1xyXG4gICAgICAgICAgdGhpcy5fcG9zaXRpb25Qcm9wZXJ0eS52YWx1ZSA9IG5ld1Bvc2l0aW9uO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gdGhlIG9wdGlvbmFsIGRyYWcgZnVuY3Rpb24gYXQgdGhlIGVuZCBvZiBhbnkgbW92ZW1lbnRcclxuICAgICAgaWYgKCB0aGlzLl9kcmFnICkge1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX3BvaW50ZXIsICd0aGUgcG9pbnRlciBtdXN0IGJlIGFzc2lnbmVkIGF0IHRoZSBzdGFydCBvZiBhIGRyYWcgYWN0aW9uJyApO1xyXG4gICAgICAgIGNvbnN0IHN5bnRoZXRpY0V2ZW50ID0gdGhpcy5jcmVhdGVTeW50aGV0aWNFdmVudCggdGhpcy5fcG9pbnRlciEgKTtcclxuICAgICAgICB0aGlzLl9kcmFnKCBzeW50aGV0aWNFdmVudCwgdGhpcyApO1xyXG4gICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgIHBhcmFtZXRlcnM6IFtdLFxyXG4gICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ2RyYWdBY3Rpb24nICksXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdFbWl0cyBldmVyeSB0aW1lIHRoZXJlIGlzIHNvbWUgaW5wdXQgZnJvbSBhIGtleWJvYXJkIGRyYWcuJyxcclxuICAgICAgcGhldGlvSGlnaEZyZXF1ZW5jeTogdHJ1ZSxcclxuICAgICAgcGhldGlvUmVhZE9ubHk6IG9wdGlvbnMucGhldGlvUmVhZE9ubHksXHJcbiAgICAgIHBoZXRpb0V2ZW50VHlwZTogRXZlbnRUeXBlLlVTRVJcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLmRyYWdFbmRBY3Rpb24gPSBuZXcgUGhldGlvQWN0aW9uKCAoKSA9PiB7XHJcblxyXG4gICAgICAvLyBzdG9wIHRoZSBjYWxsYmFjayB0aW1lclxyXG4gICAgICB0aGlzLmNhbGxiYWNrVGltZXIuc3RvcCggZmFsc2UgKTtcclxuXHJcbiAgICAgIGNvbnN0IHN5bnRoZXRpY0V2ZW50ID0gdGhpcy5fcG9pbnRlciA/IHRoaXMuY3JlYXRlU3ludGhldGljRXZlbnQoIHRoaXMuX3BvaW50ZXIgKSA6IG51bGw7XHJcbiAgICAgIHRoaXMuX2VuZCAmJiB0aGlzLl9lbmQoIHN5bnRoZXRpY0V2ZW50LCB0aGlzICk7XHJcblxyXG4gICAgICB0aGlzLmNsZWFyUG9pbnRlcigpO1xyXG4gICAgfSwge1xyXG4gICAgICBwYXJhbWV0ZXJzOiBbXSxcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdkcmFnRW5kQWN0aW9uJyApLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnRW1pdHMgd2hlbmV2ZXIgYSBrZXlib2FyZCBkcmFnIGVuZHMuJyxcclxuICAgICAgcGhldGlvUmVhZE9ubHk6IG9wdGlvbnMucGhldGlvUmVhZE9ubHksXHJcbiAgICAgIHBoZXRpb0V2ZW50VHlwZTogRXZlbnRUeXBlLlVTRVJcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLl9wb2ludGVyTGlzdGVuZXIgPSB7XHJcbiAgICAgIGxpc3RlbmVyOiB0aGlzLFxyXG4gICAgICBpbnRlcnJ1cHQ6IHRoaXMuaW50ZXJydXB0LmJpbmQoIHRoaXMgKVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLl9wb2ludGVyID0gbnVsbDtcclxuXHJcbiAgICAvLyBGb3IgZHJhZ1NwZWVkIGltcGxlbWVudGF0aW9uLCB0aGUgQ2FsbGJhY2tUaW1lciB3aWxsIGZpcmUgZXZlcnkgYW5pbWF0aW9uIGZyYW1lLCBzbyB0aGUgaW50ZXJ2YWwgaXNcclxuICAgIC8vIG1lYW50IHRvIHdvcmsgYXQgNjAgZnJhbWVzIHBlciBzZWNvbmQuXHJcbiAgICBjb25zdCBpbnRlcnZhbCA9IHRoaXMudXNlRHJhZ1NwZWVkID8gMTAwMCAvIDYwIDogb3B0aW9ucy5tb3ZlT25Ib2xkSW50ZXJ2YWw7XHJcbiAgICBjb25zdCBkZWxheSA9IHRoaXMudXNlRHJhZ1NwZWVkID8gMCA6IG9wdGlvbnMubW92ZU9uSG9sZERlbGF5O1xyXG5cclxuICAgIHRoaXMuY2FsbGJhY2tUaW1lciA9IG5ldyBDYWxsYmFja1RpbWVyKCB7XHJcbiAgICAgIGRlbGF5OiBkZWxheSxcclxuICAgICAgaW50ZXJ2YWw6IGludGVydmFsLFxyXG5cclxuICAgICAgY2FsbGJhY2s6ICgpID0+IHtcclxuXHJcbiAgICAgICAgbGV0IGRlbHRhWCA9IDA7XHJcbiAgICAgICAgbGV0IGRlbHRhWSA9IDA7XHJcblxyXG4gICAgICAgIGNvbnN0IHNoaWZ0S2V5RG93biA9IGdsb2JhbEtleVN0YXRlVHJhY2tlci5zaGlmdEtleURvd247XHJcblxyXG4gICAgICAgIGxldCBkZWx0YTogbnVtYmVyO1xyXG4gICAgICAgIGlmICggdGhpcy51c2VEcmFnU3BlZWQgKSB7XHJcblxyXG4gICAgICAgICAgLy8gV2Uga25vdyB0aGF0IENhbGxiYWNrVGltZXIgaXMgZ29pbmcgdG8gZmlyZSBhdCB0aGUgaW50ZXJ2YWwgc28gd2UgY2FuIHVzZSB0aGF0IHRvIGdldCB0aGUgZHQuXHJcbiAgICAgICAgICBjb25zdCBkdCA9IGludGVydmFsIC8gMTAwMDsgLy8gdGhlIGludGVydmFsIGluIHNlY29uZHNcclxuICAgICAgICAgIGRlbHRhID0gZHQgKiAoIHNoaWZ0S2V5RG93biA/IG9wdGlvbnMuc2hpZnREcmFnU3BlZWQgOiBvcHRpb25zLmRyYWdTcGVlZCApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGRlbHRhID0gc2hpZnRLZXlEb3duID8gb3B0aW9ucy5zaGlmdERyYWdEZWx0YSA6IG9wdGlvbnMuZHJhZ0RlbHRhO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmxlZnRLZXlEb3duUHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgICAgICBkZWx0YVggLT0gZGVsdGE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggdGhpcy5yaWdodEtleURvd25Qcm9wZXJ0eS52YWx1ZSApIHtcclxuICAgICAgICAgIGRlbHRhWCArPSBkZWx0YTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCB0aGlzLnVwS2V5RG93blByb3BlcnR5LnZhbHVlICkge1xyXG4gICAgICAgICAgZGVsdGFZIC09IGRlbHRhO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIHRoaXMuZG93bktleURvd25Qcm9wZXJ0eS52YWx1ZSApIHtcclxuICAgICAgICAgIGRlbHRhWSArPSBkZWx0YTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCB2ZWN0b3JEZWx0YSA9IG5ldyBWZWN0b3IyKCBkZWx0YVgsIGRlbHRhWSApO1xyXG5cclxuICAgICAgICAvLyBvbmx5IGluaXRpYXRlIG1vdmUgaWYgdGhlcmUgd2FzIHNvbWUgYXR0ZW1wdGVkIGtleWJvYXJkIGRyYWdcclxuICAgICAgICBpZiAoICF2ZWN0b3JEZWx0YS5lcXVhbHMoIFZlY3RvcjIuWkVSTyApICkge1xyXG5cclxuICAgICAgICAgIC8vIHRvIG1vZGVsIGNvb3JkaW5hdGVzXHJcbiAgICAgICAgICBpZiAoIG9wdGlvbnMudHJhbnNmb3JtICkge1xyXG4gICAgICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSBvcHRpb25zLnRyYW5zZm9ybSBpbnN0YW5jZW9mIFRyYW5zZm9ybTMgPyBvcHRpb25zLnRyYW5zZm9ybSA6IG9wdGlvbnMudHJhbnNmb3JtLnZhbHVlO1xyXG4gICAgICAgICAgICB2ZWN0b3JEZWx0YSA9IHRyYW5zZm9ybS5pbnZlcnNlRGVsdGEyKCB2ZWN0b3JEZWx0YSApO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRoaXMudmVjdG9yRGVsdGEgPSB2ZWN0b3JEZWx0YTtcclxuICAgICAgICAgIHRoaXMuZHJhZ0FjdGlvbi5leGVjdXRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gV2hlbiBhbnkgb2YgdGhlIG1vdmVtZW50IGtleXMgZmlyc3QgZ28gZG93biwgc3RhcnQgdGhlIGRyYWcgb3BlcmF0aW9uIG9uIHRoZSBuZXh0IGtleWRvd24gZXZlbnQgKHNvIHRoYXRcclxuICAgIC8vIHRoZSBTY2VuZXJ5RXZlbnQgaXMgYXZhaWxhYmxlKS5cclxuICAgIHRoaXMuaXNQcmVzc2VkUHJvcGVydHkubGF6eUxpbmsoIGRyYWdLZXlzRG93biA9PiB7XHJcbiAgICAgIGlmICggZHJhZ0tleXNEb3duICkge1xyXG4gICAgICAgIHRoaXMuc3RhcnROZXh0S2V5Ym9hcmRFdmVudCA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgIC8vIEluIGNhc2UgbW92ZW1lbnQga2V5cyBhcmUgcmVsZWFzZWQgYmVmb3JlIHdlIGdldCBhIGtleWRvd24gZXZlbnQgKG1vc3RseSBwb3NzaWJsZSBkdXJpbmcgZnV6eiB0ZXN0aW5nKSxcclxuICAgICAgICAvLyBkb24ndCBzdGFydCB0aGUgbmV4dCBkcmFnIGFjdGlvbi5cclxuICAgICAgICB0aGlzLnN0YXJ0TmV4dEtleWJvYXJkRXZlbnQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnJlc3RhcnRUaW1lck5leHRLZXlib2FyZEV2ZW50ID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHRoaXMuZHJhZ0VuZEFjdGlvbi5leGVjdXRlKCk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBJZiBub3QgdGhlIHNoaWZ0IGtleSwgdGhlIGRyYWcgc2hvdWxkIHN0YXJ0IGltbWVkaWF0ZWx5IGluIHRoZSBkaXJlY3Rpb24gb2YgdGhlIG5ld2x5IHByZXNzZWQga2V5IGluc3RlYWRcclxuICAgIC8vIG9mIHdhaXRpbmcgZm9yIHRoZSBuZXh0IGludGVydmFsLiBPbmx5IGltcG9ydGFudCBmb3IgIXVzZURyYWdTcGVlZC5cclxuICAgIGlmICggIXRoaXMudXNlRHJhZ1NwZWVkICkge1xyXG4gICAgICBjb25zdCBhZGRTdGFydFRpbWVyTGlzdGVuZXIgPSAoIGtleVByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuPiApID0+IHtcclxuICAgICAgICBrZXlQcm9wZXJ0eS5saW5rKCBrZXlEb3duID0+IHtcclxuICAgICAgICAgIGlmICgga2V5RG93biApIHtcclxuICAgICAgICAgICAgdGhpcy5yZXN0YXJ0VGltZXJOZXh0S2V5Ym9hcmRFdmVudCA9IHRydWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9O1xyXG4gICAgICBhZGRTdGFydFRpbWVyTGlzdGVuZXIoIHRoaXMubGVmdEtleURvd25Qcm9wZXJ0eSApO1xyXG4gICAgICBhZGRTdGFydFRpbWVyTGlzdGVuZXIoIHRoaXMucmlnaHRLZXlEb3duUHJvcGVydHkgKTtcclxuICAgICAgYWRkU3RhcnRUaW1lckxpc3RlbmVyKCB0aGlzLnVwS2V5RG93blByb3BlcnR5ICk7XHJcbiAgICAgIGFkZFN0YXJ0VGltZXJMaXN0ZW5lciggdGhpcy5kb3duS2V5RG93blByb3BlcnR5ICk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fZGlzcG9zZUtleWJvYXJkRHJhZ0xpc3RlbmVyID0gKCkgPT4ge1xyXG5cclxuICAgICAgdGhpcy5sZWZ0S2V5RG93blByb3BlcnR5LmRpc3Bvc2UoKTtcclxuICAgICAgdGhpcy5yaWdodEtleURvd25Qcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICAgIHRoaXMudXBLZXlEb3duUHJvcGVydHkuZGlzcG9zZSgpO1xyXG4gICAgICB0aGlzLmRvd25LZXlEb3duUHJvcGVydHkuZGlzcG9zZSgpO1xyXG5cclxuICAgICAgdGhpcy5jYWxsYmFja1RpbWVyLmRpc3Bvc2UoKTtcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBkcmFnIGJvdW5kcyBpbiBtb2RlbCBjb29yZGluYXRlcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0RHJhZ0JvdW5kcygpOiBCb3VuZHMyIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5fZHJhZ0JvdW5kc1Byb3BlcnR5LnZhbHVlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBkcmFnQm91bmRzKCk6IEJvdW5kczIgfCBudWxsIHsgcmV0dXJuIHRoaXMuZ2V0RHJhZ0JvdW5kcygpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGRyYWcgdHJhbnNmb3JtIG9mIHRoZSBsaXN0ZW5lci5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0VHJhbnNmb3JtKCB0cmFuc2Zvcm06IFRyYW5zZm9ybTMgfCBUUmVhZE9ubHlQcm9wZXJ0eTxUcmFuc2Zvcm0zPiB8IG51bGwgKTogdm9pZCB7XHJcbiAgICB0aGlzLl90cmFuc2Zvcm0gPSB0cmFuc2Zvcm07XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHRyYW5zZm9ybSggdHJhbnNmb3JtOiBUcmFuc2Zvcm0zIHwgVFJlYWRPbmx5UHJvcGVydHk8VHJhbnNmb3JtMz4gfCBudWxsICkgeyB0aGlzLnNldFRyYW5zZm9ybSggdHJhbnNmb3JtICk7IH1cclxuXHJcbiAgcHVibGljIGdldCB0cmFuc2Zvcm0oKTogVHJhbnNmb3JtMyB8IFRSZWFkT25seVByb3BlcnR5PFRyYW5zZm9ybTM+IHwgbnVsbCB7IHJldHVybiB0aGlzLmdldFRyYW5zZm9ybSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHRyYW5zZm9ybSBvZiB0aGUgbGlzdGVuZXIuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFRyYW5zZm9ybSgpOiBUcmFuc2Zvcm0zIHwgVFJlYWRPbmx5UHJvcGVydHk8VHJhbnNmb3JtMz4gfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLl90cmFuc2Zvcm07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXR0ZXIgZm9yIHRoZSBkcmFnU3BlZWQgcHJvcGVydHksIHNlZSBvcHRpb25zLmRyYWdTcGVlZCBmb3IgbW9yZSBpbmZvLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgZHJhZ1NwZWVkKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9kcmFnU3BlZWQ7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0dGVyIGZvciB0aGUgZHJhZ1NwZWVkIHByb3BlcnR5LCBzZWUgb3B0aW9ucy5kcmFnU3BlZWQgZm9yIG1vcmUgaW5mby5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGRyYWdTcGVlZCggZHJhZ1NwZWVkOiBudW1iZXIgKSB7IHRoaXMuX2RyYWdTcGVlZCA9IGRyYWdTcGVlZDsgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXR0ZXIgZm9yIHRoZSBzaGlmdERyYWdTcGVlZCBwcm9wZXJ0eSwgc2VlIG9wdGlvbnMuc2hpZnREcmFnU3BlZWQgZm9yIG1vcmUgaW5mby5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHNoaWZ0RHJhZ1NwZWVkKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9zaGlmdERyYWdTcGVlZDsgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXR0ZXIgZm9yIHRoZSBzaGlmdERyYWdTcGVlZCBwcm9wZXJ0eSwgc2VlIG9wdGlvbnMuc2hpZnREcmFnU3BlZWQgZm9yIG1vcmUgaW5mby5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IHNoaWZ0RHJhZ1NwZWVkKCBzaGlmdERyYWdTcGVlZDogbnVtYmVyICkgeyB0aGlzLl9zaGlmdERyYWdTcGVlZCA9IHNoaWZ0RHJhZ1NwZWVkOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHRlciBmb3IgdGhlIGRyYWdEZWx0YSBwcm9wZXJ0eSwgc2VlIG9wdGlvbnMuZHJhZ0RlbHRhIGZvciBtb3JlIGluZm8uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBkcmFnRGVsdGEoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX2RyYWdEZWx0YTsgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXR0ZXIgZm9yIHRoZSBkcmFnRGVsdGEgcHJvcGVydHksIHNlZSBvcHRpb25zLmRyYWdEZWx0YSBmb3IgbW9yZSBpbmZvLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgZHJhZ0RlbHRhKCBkcmFnRGVsdGE6IG51bWJlciApIHsgdGhpcy5fZHJhZ0RlbHRhID0gZHJhZ0RlbHRhOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHRlciBmb3IgdGhlIHNoaWZ0RHJhZ0RlbHRhIHByb3BlcnR5LCBzZWUgb3B0aW9ucy5zaGlmdERyYWdEZWx0YSBmb3IgbW9yZSBpbmZvLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgc2hpZnREcmFnRGVsdGEoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX3NoaWZ0RHJhZ0RlbHRhOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHRlciBmb3IgdGhlIHNoaWZ0RHJhZ0RlbHRhIHByb3BlcnR5LCBzZWUgb3B0aW9ucy5zaGlmdERyYWdEZWx0YSBmb3IgbW9yZSBpbmZvLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgc2hpZnREcmFnRGVsdGEoIHNoaWZ0RHJhZ0RlbHRhOiBudW1iZXIgKSB7IHRoaXMuX3NoaWZ0RHJhZ0RlbHRhID0gc2hpZnREcmFnRGVsdGE7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXJlIGtleXMgcHJlc3NlZCB0aGF0IHdvdWxkIG1vdmUgdGhlIHRhcmdldCBOb2RlIHRvIHRoZSBsZWZ0P1xyXG4gICAqL1xyXG4gIHB1YmxpYyBtb3ZpbmdMZWZ0KCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMubGVmdEtleURvd25Qcm9wZXJ0eS52YWx1ZSAmJiAhdGhpcy5yaWdodEtleURvd25Qcm9wZXJ0eS52YWx1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFyZSBrZXlzIHByZXNzZWQgdGhhdCB3b3VsZCBtb3ZlIHRoZSB0YXJnZXQgTm9kZSB0byB0aGUgcmlnaHQ/XHJcbiAgICovXHJcbiAgcHVibGljIG1vdmluZ1JpZ2h0KCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMucmlnaHRLZXlEb3duUHJvcGVydHkudmFsdWUgJiYgIXRoaXMubGVmdEtleURvd25Qcm9wZXJ0eS52YWx1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFyZSBrZXlzIHByZXNzZWQgdGhhdCB3b3VsZCBtb3ZlIHRoZSB0YXJnZXQgTm9kZSB1cD9cclxuICAgKi9cclxuICBwdWJsaWMgbW92aW5nVXAoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy51cEtleURvd25Qcm9wZXJ0eS52YWx1ZSAmJiAhdGhpcy5kb3duS2V5RG93blByb3BlcnR5LnZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXJlIGtleXMgcHJlc3NlZCB0aGF0IHdvdWxkIG1vdmUgdGhlIHRhcmdldCBOb2RlIGRvd24/XHJcbiAgICovXHJcbiAgcHVibGljIG1vdmluZ0Rvd24oKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5kb3duS2V5RG93blByb3BlcnR5LnZhbHVlICYmICF0aGlzLnVwS2V5RG93blByb3BlcnR5LnZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBjdXJyZW50IHRhcmdldCBOb2RlIG9mIHRoZSBkcmFnLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDdXJyZW50VGFyZ2V0KCk6IE5vZGUge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5pc1ByZXNzZWRQcm9wZXJ0eS52YWx1ZSwgJ1dlIGhhdmUgbm8gY3VycmVudFRhcmdldCBpZiB3ZSBhcmUgbm90IHByZXNzZWQnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9wb2ludGVyICYmIHRoaXMuX3BvaW50ZXIudHJhaWwsICdNdXN0IGhhdmUgYSBQb2ludGVyIHdpdGggYW4gYWN0aXZlIHRyYWlsIGlmIHdlIGFyZSBwcmVzc2VkJyApO1xyXG4gICAgcmV0dXJuIHRoaXMuX3BvaW50ZXIhLnRyYWlsIS5sYXN0Tm9kZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2NlbmVyeSBpbnRlcm5hbC4gUGFydCBvZiB0aGUgZXZlbnRzIEFQSS4gRG8gbm90IGNhbGwgZGlyZWN0bHkuXHJcbiAgICpcclxuICAgKiBEb2VzIHNwZWNpZmljIHdvcmsgZm9yIHRoZSBrZXlkb3duIGV2ZW50LiBUaGlzIGlzIGNhbGxlZCBkdXJpbmcgc2NlbmVyeSBldmVudCBkaXNwYXRjaCwgYW5kIEFGVEVSIGFueSBnbG9iYWxcclxuICAgKiBrZXkgc3RhdGUgdXBkYXRlcy4gVGhpcyBpcyBpbXBvcnRhbnQgYmVjYXVzZSBpbnRlcnJ1cHRpb24gbmVlZHMgdG8gaGFwcGVuIGFmdGVyIGhvdGtleU1hbmFnZXIgaGFzIGZ1bGx5IHByb2Nlc3NlZFxyXG4gICAqIHRoZSBrZXkgc3RhdGUuIEFuZCB0aGlzIGltcGxlbWVudGF0aW9uIGFzc3VtZXMgdGhhdCB0aGUga2V5ZG93biBldmVudCB3aWxsIGhhcHBlbiBhZnRlciBIb3RrZXkgdXBkYXRlc1xyXG4gICAqIChzZWUgc3RhcnROZXh0S2V5Ym9hcmRFdmVudCkuXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGtleWRvd24oIGV2ZW50OiBTY2VuZXJ5RXZlbnQ8S2V5Ym9hcmRFdmVudD4gKTogdm9pZCB7XHJcbiAgICBzdXBlci5rZXlkb3duKCBldmVudCApO1xyXG5cclxuICAgIGNvbnN0IGRvbUV2ZW50ID0gZXZlbnQuZG9tRXZlbnQhO1xyXG5cclxuICAgIC8vIElmIHRoZSBtZXRhIGtleSBpcyBkb3duIChjb21tYW5kIGtleS93aW5kb3dzIGtleSkgcHJldmVudCBtb3ZlbWVudCBhbmQgZG8gbm90IHByZXZlbnREZWZhdWx0LlxyXG4gICAgLy8gTWV0YSBrZXkgKyBhcnJvdyBrZXkgaXMgYSBjb21tYW5kIHRvIGdvIGJhY2sgYSBwYWdlLCBhbmQgd2UgbmVlZCB0byBhbGxvdyB0aGF0LiBCdXQgYWxzbywgbWFjT1NcclxuICAgIC8vIGZhaWxzIHRvIHByb3ZpZGUga2V5dXAgZXZlbnRzIG9uY2UgdGhlIG1ldGEga2V5IGlzIHByZXNzZWQsIHNlZVxyXG4gICAgLy8gaHR0cDovL3dlYi5hcmNoaXZlLm9yZy93ZWIvMjAxNjAzMDQwMjI0NTMvaHR0cDovL2JpdHNwdXNoZWRhcm91bmQuY29tL29uLWEtZmV3LXRoaW5ncy15b3UtbWF5LW5vdC1rbm93LWFib3V0LXRoZS1oZWxsaXNoLWNvbW1hbmQta2V5LWFuZC1qYXZhc2NyaXB0LWV2ZW50cy9cclxuICAgIGlmICggZG9tRXZlbnQubWV0YUtleSApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggS2V5Ym9hcmRVdGlscy5pc01vdmVtZW50S2V5KCBkb21FdmVudCApICkge1xyXG5cclxuICAgICAgLy8gUHJldmVudCBhIFZvaWNlT3ZlciBidWcgd2hlcmUgcHJlc3NpbmcgbXVsdGlwbGUgYXJyb3cga2V5cyBhdCBvbmNlIGNhdXNlcyB0aGUgQVQgdG8gc2VuZCB0aGUgd3Jvbmcga2V5c1xyXG4gICAgICAvLyB0aHJvdWdoIHRoZSBrZXl1cCBldmVudCAtIGFzIGEgd29ya2Fyb3VuZCwgd2Ugb25seSBhbGxvdyBvbmUgYXJyb3cga2V5IHRvIGJlIGRvd24gYXQgYSB0aW1lLiBJZiB0d28gYXJlIHByZXNzZWRcclxuICAgICAgLy8gZG93biwgd2UgaW1tZWRpYXRlbHkgaW50ZXJydXB0LlxyXG4gICAgICBpZiAoIHBsYXRmb3JtLnNhZmFyaSAmJiB0aGlzLnByZXNzZWRLZXlzUHJvcGVydHkudmFsdWUubGVuZ3RoID4gMSApIHtcclxuICAgICAgICB0aGlzLmludGVycnVwdCgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gRmluYWxseSwgaW4gdGhpcyBjYXNlIHdlIGFyZSBhY3R1YWxseSBnb2luZyB0byBkcmFnIHRoZSBvYmplY3QuIFByZXZlbnQgZGVmYXVsdCBiZWhhdmlvciBzbyB0aGF0IFNhZmFyaVxyXG4gICAgICAvLyBkb2Vzbid0IHBsYXkgYSAnYm9uaycgc291bmQgZXZlcnkgYXJyb3cga2V5IHByZXNzLlxyXG4gICAgICBkb21FdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgLy8gQ2Fubm90IGF0dGFjaCBhIGxpc3RlbmVyIHRvIGEgUG9pbnRlciB0aGF0IGlzIGFscmVhZHkgYXR0YWNoZWQuXHJcbiAgICAgIGlmICggdGhpcy5zdGFydE5leHRLZXlib2FyZEV2ZW50ICYmICFldmVudC5wb2ludGVyLmlzQXR0YWNoZWQoKSApIHtcclxuXHJcbiAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIG1vdmVtZW50IGtleXMgZG93biwgYXR0YWNoIGEgbGlzdGVuZXIgdG8gdGhlIFBvaW50ZXIgdGhhdCB3aWxsIHRlbGwgdGhlIEFuaW1hdGVkUGFuWm9vbUxpc3RlbmVyXHJcbiAgICAgICAgLy8gdG8ga2VlcCB0aGlzIE5vZGUgaW4gdmlld1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX3BvaW50ZXIgPT09IG51bGwsICdQb2ludGVyIHNob3VsZCBiZSBudWxsIGF0IHRoZSBzdGFydCBvZiBhIGRyYWcgYWN0aW9uJyApO1xyXG4gICAgICAgIHRoaXMuX3BvaW50ZXIgPSBldmVudC5wb2ludGVyIGFzIFBET01Qb2ludGVyO1xyXG4gICAgICAgIGV2ZW50LnBvaW50ZXIuYWRkSW5wdXRMaXN0ZW5lciggdGhpcy5fcG9pbnRlckxpc3RlbmVyLCB0cnVlICk7XHJcblxyXG4gICAgICAgIHRoaXMuZHJhZ1N0YXJ0QWN0aW9uLmV4ZWN1dGUoIGV2ZW50ICk7XHJcbiAgICAgICAgdGhpcy5zdGFydE5leHRLZXlib2FyZEV2ZW50ID0gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggdGhpcy5yZXN0YXJ0VGltZXJOZXh0S2V5Ym9hcmRFdmVudCApIHtcclxuXHJcbiAgICAgICAgLy8gcmVzdGFydCB0aGUgY2FsbGJhY2sgdGltZXJcclxuICAgICAgICB0aGlzLmNhbGxiYWNrVGltZXIuc3RvcCggZmFsc2UgKTtcclxuICAgICAgICB0aGlzLmNhbGxiYWNrVGltZXIuc3RhcnQoKTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLl9tb3ZlT25Ib2xkRGVsYXkgPiAwICkge1xyXG5cclxuICAgICAgICAgIC8vIGZpcmUgcmlnaHQgYXdheSBpZiB0aGVyZSBpcyBhIGRlbGF5IC0gaWYgdGhlcmUgaXMgbm8gZGVsYXkgdGhlIHRpbWVyIGlzIGdvaW5nIHRvIGZpcmUgaW4gdGhlIG5leHRcclxuICAgICAgICAgIC8vIGFuaW1hdGlvbiBmcmFtZSBhbmQgc28gaXQgd291bGQgYXBwZWFyIHRoYXQgdGhlIG9iamVjdCBtYWtlcyB0d28gc3RlcHMgaW4gb25lIGZyYW1lXHJcbiAgICAgICAgICB0aGlzLmNhbGxiYWNrVGltZXIuZmlyZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5yZXN0YXJ0VGltZXJOZXh0S2V5Ym9hcmRFdmVudCA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBcHBseSBhIG1hcHBpbmcgZnJvbSB0aGUgZHJhZyB0YXJnZXQncyBtb2RlbCBwb3NpdGlvbiB0byBhbiBhbGxvd2VkIG1vZGVsIHBvc2l0aW9uLlxyXG4gICAqXHJcbiAgICogQSBjb21tb24gZXhhbXBsZSBpcyB1c2luZyBkcmFnQm91bmRzLCB3aGVyZSB0aGUgcG9zaXRpb24gb2YgdGhlIGRyYWcgdGFyZ2V0IGlzIGNvbnN0cmFpbmVkIHRvIHdpdGhpbiBhIGJvdW5kaW5nXHJcbiAgICogYm94LiBUaGlzIGlzIGRvbmUgYnkgbWFwcGluZyBwb2ludHMgb3V0c2lkZSB0aGUgYm91bmRpbmcgYm94IHRvIHRoZSBjbG9zZXN0IHBvc2l0aW9uIGluc2lkZSB0aGUgYm94LiBNb3JlXHJcbiAgICogZ2VuZXJhbCBtYXBwaW5ncyBjYW4gYmUgdXNlZC5cclxuICAgKlxyXG4gICAqIFNob3VsZCBiZSBvdmVycmlkZGVuIChvciB1c2UgbWFwUG9zaXRpb24pIGlmIGEgY3VzdG9tIHRyYW5zZm9ybWF0aW9uIGlzIG5lZWRlZC5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIC0gQSBwb2ludCBpbiB0aGUgbW9kZWwgY29vcmRpbmF0ZSBmcmFtZVxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBtYXBNb2RlbFBvaW50KCBtb2RlbFBvaW50OiBWZWN0b3IyICk6IFZlY3RvcjIge1xyXG4gICAgaWYgKCB0aGlzLl9tYXBQb3NpdGlvbiApIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX21hcFBvc2l0aW9uKCBtb2RlbFBvaW50ICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggdGhpcy5fZHJhZ0JvdW5kc1Byb3BlcnR5LnZhbHVlICkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fZHJhZ0JvdW5kc1Byb3BlcnR5LnZhbHVlLmNsb3Nlc3RQb2ludFRvKCBtb2RlbFBvaW50ICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIG1vZGVsUG9pbnQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJZiB0aGUgcG9pbnRlciBpcyBzZXQsIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbSBpdCBhbmQgY2xlYXIgdGhlIHJlZmVyZW5jZS5cclxuICAgKi9cclxuICBwcml2YXRlIGNsZWFyUG9pbnRlcigpOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy5fcG9pbnRlciApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fcG9pbnRlci5saXN0ZW5lcnMuaW5jbHVkZXMoIHRoaXMuX3BvaW50ZXJMaXN0ZW5lciApLFxyXG4gICAgICAgICdBIHJlZmVyZW5jZSB0byB0aGUgUG9pbnRlciBtZWFucyBpdCBzaG91bGQgaGF2ZSB0aGUgcG9pbnRlckxpc3RlbmVyJyApO1xyXG4gICAgICB0aGlzLl9wb2ludGVyLnJlbW92ZUlucHV0TGlzdGVuZXIoIHRoaXMuX3BvaW50ZXJMaXN0ZW5lciApO1xyXG4gICAgICB0aGlzLl9wb2ludGVyID0gbnVsbDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1ha2UgZWxpZ2libGUgZm9yIGdhcmJhZ2UgY29sbGVjdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuaW50ZXJydXB0KCk7XHJcbiAgICB0aGlzLl9kaXNwb3NlS2V5Ym9hcmREcmFnTGlzdGVuZXIoKTtcclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICB9XHJcbn1cclxuXHJcbnNjZW5lcnkucmVnaXN0ZXIoICdLZXlib2FyZERyYWdMaXN0ZW5lcicsIEtleWJvYXJkRHJhZ0xpc3RlbmVyICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBLZXlib2FyZERyYWdMaXN0ZW5lcjsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFlBQVksTUFBTSxvQ0FBb0M7QUFDN0QsT0FBT0MsUUFBUSxNQUFNLDhCQUE4QjtBQUVuRCxPQUFPQyxVQUFVLE1BQU0sK0JBQStCO0FBQ3RELE9BQU9DLE9BQU8sTUFBTSw0QkFBNEI7QUFDaEQsT0FBT0MsU0FBUyxNQUFNLGlDQUFpQztBQUN2RCxPQUFPQyxNQUFNLE1BQU0sOEJBQThCO0FBQ2pELFNBQVNDLHFCQUFxQixFQUFFQyxnQkFBZ0IsRUFBMkJDLGFBQWEsRUFBcUJDLE9BQU8sRUFBRUMsWUFBWSxRQUF3QixlQUFlO0FBRXpLLE9BQU9DLFNBQVMsTUFBNEIsb0NBQW9DO0FBRWhGLE9BQU9DLDhCQUE4QixNQUFNLHlEQUF5RDtBQUVwRyxPQUFPQyxZQUFZLE1BQU0sa0NBQWtDO0FBQzNELE9BQU9DLGFBQWEsTUFBTSxtQ0FBbUM7QUFFN0QsT0FBT0MsUUFBUSxNQUFNLG1DQUFtQztBQUl4RDtBQUNBO0FBQ0EsTUFBTUMsT0FBTyxHQUFHLENBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBVztBQUNsRyxNQUFNQyxhQUFhLEdBQUcsQ0FBRSxXQUFXLEVBQUUsWUFB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