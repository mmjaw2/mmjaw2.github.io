// Copyright 2018-2024, University of Colorado Boulder

/**
 * A type that will manage the state of the keyboard. This will track which keys are being held down and for how long.
 * It also offers convenience methods to determine whether or not specific keys are down like shift or enter using
 * KeyboardUtils' key schema.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Michael Barlow
 */

import PhetioAction from '../../../tandem/js/PhetioAction.js';
import Emitter from '../../../axon/js/Emitter.js';
import stepTimer from '../../../axon/js/stepTimer.js';
import EventType from '../../../tandem/js/EventType.js';
import { EnglishStringToCodeMap, eventCodeToEnglishString, EventIO, KeyboardUtils, scenery } from '../imports.js';
import platform from '../../../phet-core/js/platform.js';

// Type describing the state of a single key in the KeyState.

// The type for the keyState Object, keys are the KeyboardEvent.code for the pressed key.

class KeyStateTracker {
  // Contains info about which keys are currently pressed for how long. JavaScript doesn't handle multiple key presses,
  // with events so we have to update this object ourselves.
  keyState = {};

  // The KeyboardEvent.code of the last key that was pressed down when updating the key state.
  _lastKeyDown = null;

  // Whether this KeyStateTracker is attached to the document and listening for events.
  attachedToDocument = false;

  // Listeners potentially attached to the document to update the state of this KeyStateTracker, see attachToWindow()
  documentKeyupListener = null;
  documentKeydownListener = null;
  documentBlurListener = null;

  // If the KeyStateTracker is enabled. If disabled, keyState is cleared and listeners noop.
  _enabled = true;

  // Emits events when keyup/keydown updates are received. These will emit after any updates to the
  // keyState so that keyState is correct in time for listeners. Note the valueType is a native KeyboardEvent event.
  keydownEmitter = new Emitter({
    parameters: [{
      valueType: KeyboardEvent
    }]
  });
  keyupEmitter = new Emitter({
    parameters: [{
      valueType: KeyboardEvent
    }]
  });

  // Emits when any key "down" state changes. This is useful for when you want to know if any key is down or up.
  // Does NOT change for timeDown changes. DOES fire if the browser sends fire-on-hold down.
  keyDownStateChangedEmitter = new Emitter({
    parameters: [{
      valueType: [KeyboardEvent, null]
    }]
  });

  // Action which updates the KeyStateTracker, when it is time to do so - the update is wrapped by an Action so that
  // the KeyStateTracker state is captured for PhET-iO.

  // Action which updates the state of the KeyStateTracker on key release. This is wrapped in an Action so that state
  // is captured for PhET-iO.

  constructor(options) {
    this.keydownUpdateAction = new PhetioAction(domEvent => {
      // Not all keys have a code for the browser to use, we need to be graceful and do nothing if there isn't one.
      const key = KeyboardUtils.getEventCode(domEvent);
      if (key) {
        // The dom event might have a modifier key that we weren't able to catch, if that is the case update the keyState.
        // This is likely to happen when pressing browser key commands like "ctrl + tab" to switch tabs.
        this.correctModifierKeys(domEvent);
        if (assert && !KeyboardUtils.isShiftKey(domEvent)) {
          assert(domEvent.shiftKey === this.shiftKeyDown, 'shift key inconsistency between event and keyState.');
        }
        if (assert && !KeyboardUtils.isAltKey(domEvent)) {
          assert(domEvent.altKey === this.altKeyDown, 'alt key inconsistency between event and keyState.');
        }
        if (assert && !KeyboardUtils.isControlKey(domEvent)) {
          assert(domEvent.ctrlKey === this.ctrlKeyDown, 'ctrl key inconsistency between event and keyState.');
        }
        if (assert && !KeyboardUtils.isMetaKey(domEvent)) {
          assert(domEvent.metaKey === this.metaKeyDown, 'meta key inconsistency between event and keyState.');
        }

        // if the key is already down, don't do anything else (we don't want to create a new keyState object
        // for a key that is already being tracked and down)
        if (!this.isKeyDown(key)) {
          const key = KeyboardUtils.getEventCode(domEvent);
          assert && assert(key, 'Could not find key from domEvent');
          this.keyState[key] = {
            key: key,
            timeDown: 0 // in ms
          };
        }
        this._lastKeyDown = key;

        // keydown update received, notify listeners
        this.keydownEmitter.emit(domEvent);
        this.keyDownStateChangedEmitter.emit(domEvent);
      }
    }, {
      phetioPlayback: true,
      tandem: options?.tandem?.createTandem('keydownUpdateAction'),
      parameters: [{
        name: 'event',
        phetioType: EventIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Action that executes whenever a keydown occurs from the input listeners this keyStateTracker adds (most likely to the document).'
    });
    this.keyupUpdateAction = new PhetioAction(domEvent => {
      // Not all keys have a code for the browser to use, we need to be graceful and do nothing if there isn't one.
      const key = KeyboardUtils.getEventCode(domEvent);
      if (key) {
        // correct keyState in case browser didn't receive keydown/keyup events for a modifier key
        this.correctModifierKeys(domEvent);

        // Remove this key data from the state - There are many cases where we might receive a keyup before keydown like
        // on first tab into scenery Display or when using specific operating system keys with the browser or PrtScn so
        // an assertion for this is too strict. See https://github.com/phetsims/scenery/issues/918
        if (this.isKeyDown(key)) {
          delete this.keyState[key];
        }

        // On MacOS, we will not get key keyup events while a meta key is pressed. So the keystate will be inaccurate
        // until the meta keys are released. If both meta keys are pressed, We just We will not get a keyup event until
        // BOTH keys are released, so this should be safe in that case.
        // See https://github.com/phetsims/scenery/issues/1555
        if (platform.mac && KeyboardUtils.isMetaKey(domEvent)) {
          // Skip notification, since we will emit on the state change below
          this.clearState(true);
        }

        // keyup event received, notify listeners
        this.keyupEmitter.emit(domEvent);
        this.keyDownStateChangedEmitter.emit(domEvent);
      }
    }, {
      phetioPlayback: true,
      tandem: options?.tandem?.createTandem('keyupUpdateAction'),
      parameters: [{
        name: 'event',
        phetioType: EventIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Action that executes whenever a keyup occurs from the input listeners this keyStateTracker adds (most likely to the document).'
    });
    const stepListener = this.step.bind(this);
    stepTimer.addListener(stepListener);
    this.disposeKeyStateTracker = () => {
      stepTimer.removeListener(stepListener);
      if (this.attachedToDocument) {
        this.detachFromDocument();
      }
    };
  }

  /**
   * Implements keyboard dragging when listener is attached to the Node, public so listener is attached
   * with addInputListener(). Only updated when enabled.
   *
   * Note that this event is assigned in the constructor, and not to the prototype. As of writing this,
   * `Node.addInputListener` only supports type properties as event listeners, and not the event keys as
   * prototype methods. Please see https://github.com/phetsims/scenery/issues/851 for more information.
   */
  keydownUpdate(domEvent) {
    this.enabled && this.keydownUpdateAction.execute(domEvent);
  }

  /**
   * Modifier keys might be part of the domEvent but the browser may or may not have received a keydown/keyup event
   * with specifically for the modifier key. This will add or remove modifier keys in that case.
   */
  correctModifierKeys(domEvent) {
    const key = KeyboardUtils.getEventCode(domEvent);
    assert && assert(key, 'key not found from domEvent');
    let changed = false;

    // add modifier keys if they aren't down
    if (domEvent.shiftKey && !KeyboardUtils.isShiftKey(domEvent) && !this.shiftKeyDown) {
      changed = changed || !this.keyState[KeyboardUtils.KEY_SHIFT_LEFT];
      this.keyState[KeyboardUtils.KEY_SHIFT_LEFT] = {
        key: key,
        timeDown: 0 // in ms
      };
    }
    if (domEvent.altKey && !KeyboardUtils.isAltKey(domEvent) && !this.altKeyDown) {
      changed = changed || !this.keyState[KeyboardUtils.KEY_ALT_LEFT];
      this.keyState[KeyboardUtils.KEY_ALT_LEFT] = {
        key: key,
        timeDown: 0 // in ms
      };
    }
    if (domEvent.ctrlKey && !KeyboardUtils.isControlKey(domEvent) && !this.ctrlKeyDown) {
      changed = changed || !this.keyState[KeyboardUtils.KEY_CONTROL_LEFT];
      this.keyState[KeyboardUtils.KEY_CONTROL_LEFT] = {
        key: key,
        timeDown: 0 // in ms
      };
    }
    if (domEvent.metaKey && !KeyboardUtils.isMetaKey(domEvent) && !this.metaKeyDown) {
      changed = changed || !this.keyState[KeyboardUtils.KEY_META_LEFT];
      this.keyState[KeyboardUtils.KEY_META_LEFT] = {
        key: key,
        timeDown: 0 // in ms
      };
    }

    // delete modifier keys if we think they are down
    if (!domEvent.shiftKey && this.shiftKeyDown) {
      changed = changed || !!this.keyState[KeyboardUtils.KEY_SHIFT_LEFT] || !!this.keyState[KeyboardUtils.KEY_SHIFT_RIGHT];
      delete this.keyState[KeyboardUtils.KEY_SHIFT_LEFT];
      delete this.keyState[KeyboardUtils.KEY_SHIFT_RIGHT];
    }
    if (!domEvent.altKey && this.altKeyDown) {
      changed = changed || !!this.keyState[KeyboardUtils.KEY_ALT_LEFT] || !!this.keyState[KeyboardUtils.KEY_ALT_RIGHT];
      delete this.keyState[KeyboardUtils.KEY_ALT_LEFT];
      delete this.keyState[KeyboardUtils.KEY_ALT_RIGHT];
    }
    if (!domEvent.ctrlKey && this.ctrlKeyDown) {
      changed = changed || !!this.keyState[KeyboardUtils.KEY_CONTROL_LEFT] || !!this.keyState[KeyboardUtils.KEY_CONTROL_RIGHT];
      delete this.keyState[KeyboardUtils.KEY_CONTROL_LEFT];
      delete this.keyState[KeyboardUtils.KEY_CONTROL_RIGHT];
    }
    if (!domEvent.metaKey && this.metaKeyDown) {
      changed = changed || KeyboardUtils.META_KEYS.some(key => !!this.keyState[key]);
      KeyboardUtils.META_KEYS.forEach(key => {
        delete this.keyState[key];
      });
    }
    if (changed) {
      this.keyDownStateChangedEmitter.emit(domEvent);
    }
  }

  /**
   * Behavior for keyboard 'up' DOM event. Public so it can be attached with addInputListener(). Only updated when
   * enabled.
   *
   * Note that this event is assigned in the constructor, and not to the prototype. As of writing this,
   * `Node.addInputListener` only supports type properties as event listeners, and not the event keys as
   * prototype methods. Please see https://github.com/phetsims/scenery/issues/851 for more information.
   */
  keyupUpdate(domEvent) {
    this.enabled && this.keyupUpdateAction.execute(domEvent);
  }

  /**
   * Returns true if any of the movement keys are down (arrow keys or WASD keys).
   */
  get movementKeysDown() {
    return this.isAnyKeyInListDown(KeyboardUtils.MOVEMENT_KEYS);
  }

  /**
   * Returns the KeyboardEvent.code from the last key down that updated the keystate.
   */
  getLastKeyDown() {
    return this._lastKeyDown;
  }

  /**
   * Returns true if a key with the KeyboardEvent.code is currently down.
   */
  isKeyDown(key) {
    return !!this.keyState[key];
  }

  /**
   * Returns true if the key with the KeyboardEvent.code is currently down.
   */
  isEnglishKeyDown(key) {
    return this.isAnyKeyInListDown(EnglishStringToCodeMap[key]);
  }

  /**
   * Returns the set of keys that are currently down.
   *
   * NOTE: Always returns a new array, so a defensive copy is not needed.
   */
  getKeysDown() {
    return Object.keys(this.keyState);
  }

  /**
   * Returns the set of EnglishKeys that are currently down.
   *
   * NOTE: Always returns a new Set, so a defensive copy is not needed.
   */
  getEnglishKeysDown() {
    const englishKeySet = new Set();
    for (const key of this.getKeysDown()) {
      const englishKey = eventCodeToEnglishString(key);
      if (englishKey) {
        englishKeySet.add(englishKey);
      }
    }
    return englishKeySet;
  }

  /**
   * Returns true if any of the keys in the list are currently down. Keys are the KeyboardEvent.code strings.
   */
  isAnyKeyInListDown(keyList) {
    for (let i = 0; i < keyList.length; i++) {
      if (this.isKeyDown(keyList[i])) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns true if ALL of the keys in the list are currently down. Values of the keyList array are the
   * KeyboardEvent.code for the keys you are interested in.
   */
  areKeysDown(keyList) {
    const keysDown = true;
    for (let i = 0; i < keyList.length; i++) {
      if (!this.isKeyDown(keyList[i])) {
        return false;
      }
    }
    return keysDown;
  }

  /**
   * Returns true if ALL keys in the list are down and ONLY the keys in the list are down. Values of keyList array
   * are the KeyboardEvent.code for keys you are interested in OR the KeyboardEvent.key in the special case of
   * modifier keys.
   *
   * (scenery-internal)
   */
  areKeysExclusivelyDown(keyList) {
    const keyStateKeys = Object.keys(this.keyState);

    // quick sanity check for equality first
    if (keyStateKeys.length !== keyList.length) {
      return false;
    }

    // Now make sure that every key in the list is in the keyState
    let onlyKeyListDown = true;
    for (let i = 0; i < keyList.length; i++) {
      const initialKey = keyList[i];
      let keysToCheck = [initialKey];

      // If a modifier key, need to look for the equivalent pair of left/right KeyboardEvent.codes in the list
      // because KeyStateTracker works exclusively with codes.
      if (KeyboardUtils.isModifierKey(initialKey)) {
        keysToCheck = KeyboardUtils.MODIFIER_KEY_TO_CODE_MAP.get(initialKey);
      }
      if (_.intersection(keyStateKeys, keysToCheck).length === 0) {
        onlyKeyListDown = false;
      }
    }
    return onlyKeyListDown;
  }

  /**
   * Returns true if every key in the list is down but no other modifier keys are down, unless
   * the modifier key is in the list. For example
   * areKeysDownWithoutModifiers( [ 'ShiftLeft', 'ArrowLeft' ] ) -> true if left shift and left arrow keys are down.
   * areKeysDownWithoutModifiers( [ 'ShiftLeft', 'ArrowLeft' ] ) -> true if left shift, left arrow, and J keys are down.
   * areKeysDownWithoutModifiers( [ 'ArrowLeft' ] ) -> false if left shift and arrow left keys are down.
   * areKeysDownWithoutModifiers( [ 'ArrowLeft' ] ) -> true if the left arrow key is down.
   * areKeysDownWithoutModifiers( [ 'ArrowLeft' ] ) -> true if the left arrow and R keys are down.
   *
   * This is important for determining when keyboard events should fire listeners. Say you have two KeyboardListeners -
   * One fires from key 'c' and another fires from 'shift-c'. If the user presses 'shift-c', you do NOT want both to
   * fire.
   *
   * @param keyList - List of KeyboardEvent.code strings for keys you are interested in.
   */
  areKeysDownWithoutExtraModifiers(keyList) {
    // If any modifier keys are down that are not in the keyList, return false
    for (let i = 0; i < KeyboardUtils.MODIFIER_KEY_CODES.length; i++) {
      const modifierKey = KeyboardUtils.MODIFIER_KEY_CODES[i];
      if (this.isKeyDown(modifierKey) && !keyList.includes(modifierKey)) {
        return false;
      }
    }

    // Modifier state seems OK so return true if all keys in the list are down
    return this.areKeysDown(keyList);
  }

  /**
   * Returns true if any keys are down according to teh keyState.
   */
  keysAreDown() {
    return Object.keys(this.keyState).length > 0;
  }

  /**
   * Returns true if the "Enter" key is currently down.
   */
  get enterKeyDown() {
    return this.isKeyDown(KeyboardUtils.KEY_ENTER);
  }

  /**
   * Returns true if the shift key is currently down.
   */
  get shiftKeyDown() {
    return this.isAnyKeyInListDown(KeyboardUtils.SHIFT_KEYS);
  }

  /**
   * Returns true if the alt key is currently down.
   */
  get altKeyDown() {
    return this.isAnyKeyInListDown(KeyboardUtils.ALT_KEYS);
  }

  /**
   * Returns true if the control key is currently down.
   */
  get ctrlKeyDown() {
    return this.isAnyKeyInListDown(KeyboardUtils.CONTROL_KEYS);
  }

  /**
   * Returns true if one of the meta keys is currently down.
   */
  get metaKeyDown() {
    return this.isAnyKeyInListDown(KeyboardUtils.META_KEYS);
  }

  /**
   * Returns the amount of time that the provided key has been held down. Error if the key is not currently down.
   * @param key - KeyboardEvent.code for the key you are inspecting.
   */
  timeDownForKey(key) {
    assert && assert(this.isKeyDown(key), 'cannot get timeDown on a key that is not pressed down');
    return this.keyState[key].timeDown;
  }

  /**
   * Clear the entire state of the key tracker, basically restarting the tracker.
   */
  clearState(skipNotify) {
    this.keyState = {};
    if (!skipNotify) {
      this.keyDownStateChangedEmitter.emit(null);
    }
  }

  /**
   * Step function for the tracker. JavaScript does not natively handle multiple keydown events at once,
   * so we need to track the state of the keyboard in an Object and manage dragging in this function.
   * In order for the drag handler to work.
   *
   * @param dt - time in seconds that has passed since the last update
   */
  step(dt) {
    // no-op unless a key is down
    if (this.keysAreDown()) {
      const ms = dt * 1000;

      // for each key that is still down, increment the tracked time that has been down
      for (const i in this.keyState) {
        if (this.keyState[i]) {
          this.keyState[i].timeDown += ms;
        }
      }
    }
  }

  /**
   * Add this KeyStateTracker to the window so that it updates whenever the document receives key events. This is
   * useful if you want to observe key presses while DOM focus not within the PDOM root.
   */
  attachToWindow() {
    assert && assert(!this.attachedToDocument, 'KeyStateTracker is already attached to document.');
    this.documentKeydownListener = event => {
      this.keydownUpdate(event);
    };
    this.documentKeyupListener = event => {
      this.keyupUpdate(event);
    };
    this.documentBlurListener = event => {
      // As recommended for similar situations online, we clear our key state when we get a window blur, since we
      // will not be able to track any key state changes during this time (and users will likely release any keys
      // that are pressed).
      // If shift/alt/ctrl are pressed when we regain focus, we will hopefully get a keyboard event and update their state
      // with correctModifierKeys().
      this.clearState();
    };
    const addListenersToDocument = () => {
      // attach with useCapture so that the keyStateTracker is updated before the events dispatch within Scenery
      window.addEventListener('keyup', this.documentKeyupListener, {
        capture: true
      });
      window.addEventListener('keydown', this.documentKeydownListener, {
        capture: true
      });
      window.addEventListener('blur', this.documentBlurListener, {
        capture: true
      });
      this.attachedToDocument = true;
    };
    if (!document) {
      // attach listeners on window load to ensure that the document is defined
      const loadListener = () => {
        addListenersToDocument();
        window.removeEventListener('load', loadListener);
      };
      window.addEventListener('load', loadListener);
    } else {
      // document is defined and we won't get another load event so attach right away
      addListenersToDocument();
    }
  }

  /**
   * The KeyState is cleared when the tracker is disabled.
   */
  setEnabled(enabled) {
    if (this._enabled !== enabled) {
      this._enabled = enabled;

      // clear state when disabled
      !enabled && this.clearState();
    }
  }
  set enabled(enabled) {
    this.setEnabled(enabled);
  }
  get enabled() {
    return this.isEnabled();
  }
  isEnabled() {
    return this._enabled;
  }

  /**
   * Detach listeners from the document that would update the state of this KeyStateTracker on key presses.
   */
  detachFromDocument() {
    assert && assert(this.attachedToDocument, 'KeyStateTracker is not attached to window.');
    assert && assert(this.documentKeyupListener, 'keyup listener was not created or attached to window');
    assert && assert(this.documentKeydownListener, 'keydown listener was not created or attached to window.');
    assert && assert(this.documentBlurListener, 'blur listener was not created or attached to window.');
    window.removeEventListener('keyup', this.documentKeyupListener);
    window.removeEventListener('keydown', this.documentKeydownListener);
    window.removeEventListener('blur', this.documentBlurListener);
    this.documentKeyupListener = null;
    this.documentKeydownListener = null;
    this.documentBlurListener = null;
    this.attachedToDocument = false;
  }
  dispose() {
    this.disposeKeyStateTracker();
  }
}
scenery.register('KeyStateTracker', KeyStateTracker);
export default KeyStateTracker;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQaGV0aW9BY3Rpb24iLCJFbWl0dGVyIiwic3RlcFRpbWVyIiwiRXZlbnRUeXBlIiwiRW5nbGlzaFN0cmluZ1RvQ29kZU1hcCIsImV2ZW50Q29kZVRvRW5nbGlzaFN0cmluZyIsIkV2ZW50SU8iLCJLZXlib2FyZFV0aWxzIiwic2NlbmVyeSIsInBsYXRmb3JtIiwiS2V5U3RhdGVUcmFja2VyIiwia2V5U3RhdGUiLCJfbGFzdEtleURvd24iLCJhdHRhY2hlZFRvRG9jdW1lbnQiLCJkb2N1bWVudEtleXVwTGlzdGVuZXIiLCJkb2N1bWVudEtleWRvd25MaXN0ZW5lciIsImRvY3VtZW50Qmx1ckxpc3RlbmVyIiwiX2VuYWJsZWQiLCJrZXlkb3duRW1pdHRlciIsInBhcmFtZXRlcnMiLCJ2YWx1ZVR5cGUiLCJLZXlib2FyZEV2ZW50Iiwia2V5dXBFbWl0dGVyIiwia2V5RG93blN0YXRlQ2hhbmdlZEVtaXR0ZXIiLCJjb25zdHJ1Y3RvciIsIm9wdGlvbnMiLCJrZXlkb3duVXBkYXRlQWN0aW9uIiwiZG9tRXZlbnQiLCJrZXkiLCJnZXRFdmVudENvZGUiLCJjb3JyZWN0TW9kaWZpZXJLZXlzIiwiYXNzZXJ0IiwiaXNTaGlmdEtleSIsInNoaWZ0S2V5Iiwic2hpZnRLZXlEb3duIiwiaXNBbHRLZXkiLCJhbHRLZXkiLCJhbHRLZXlEb3duIiwiaXNDb250cm9sS2V5IiwiY3RybEtleSIsImN0cmxLZXlEb3duIiwiaXNNZXRhS2V5IiwibWV0YUtleSIsIm1ldGFLZXlEb3duIiwiaXNLZXlEb3duIiwidGltZURvd24iLCJlbWl0IiwicGhldGlvUGxheWJhY2siLCJ0YW5kZW0iLCJjcmVhdGVUYW5kZW0iLCJuYW1lIiwicGhldGlvVHlwZSIsInBoZXRpb0V2ZW50VHlwZSIsIlVTRVIiLCJwaGV0aW9Eb2N1bWVudGF0aW9uIiwia2V5dXBVcGRhdGVBY3Rpb24iLCJtYWMiLCJjbGVhclN0YXRlIiwic3RlcExpc3RlbmVyIiwic3RlcCIsImJpbmQiLCJhZGRMaXN0ZW5lciIsImRpc3Bvc2VLZXlTdGF0ZVRyYWNrZXIiLCJyZW1vdmVMaXN0ZW5lciIsImRldGFjaEZyb21Eb2N1bWVudCIsImtleWRvd25VcGRhdGUiLCJlbmFibGVkIiwiZXhlY3V0ZSIsImNoYW5nZWQiLCJLRVlfU0hJRlRfTEVGVCIsIktFWV9BTFRfTEVGVCIsIktFWV9DT05UUk9MX0xFRlQiLCJLRVlfTUVUQV9MRUZUIiwiS0VZX1NISUZUX1JJR0hUIiwiS0VZX0FMVF9SSUdIVCIsIktFWV9DT05UUk9MX1JJR0hUIiwiTUVUQV9LRVlTIiwic29tZSIsImZvckVhY2giLCJrZXl1cFVwZGF0ZSIsIm1vdmVtZW50S2V5c0Rvd24iLCJpc0FueUtleUluTGlzdERvd24iLCJNT1ZFTUVOVF9LRVlTIiwiZ2V0TGFzdEtleURvd24iLCJpc0VuZ2xpc2hLZXlEb3duIiwiZ2V0S2V5c0Rvd24iLCJPYmplY3QiLCJrZXlzIiwiZ2V0RW5nbGlzaEtleXNEb3duIiwiZW5nbGlzaEtleVNldCIsIlNldCIsImVuZ2xpc2hLZXkiLCJhZGQiLCJrZXlMaXN0IiwiaSIsImxlbmd0aCIsImFyZUtleXNEb3duIiwia2V5c0Rvd24iLCJhcmVLZXlzRXhjbHVzaXZlbHlEb3duIiwia2V5U3RhdGVLZXlzIiwib25seUtleUxpc3REb3duIiwiaW5pdGlhbEtleSIsImtleXNUb0NoZWNrIiwiaXNNb2RpZmllcktleSIsIk1PRElGSUVSX0tFWV9UT19DT0RFX01BUCIsImdldCIsIl8iLCJpbnRlcnNlY3Rpb24iLCJhcmVLZXlzRG93bldpdGhvdXRFeHRyYU1vZGlmaWVycyIsIk1PRElGSUVSX0tFWV9DT0RFUyIsIm1vZGlmaWVyS2V5IiwiaW5jbHVkZXMiLCJrZXlzQXJlRG93biIsImVudGVyS2V5RG93biIsIktFWV9FTlRFUiIsIlNISUZUX0tFWVMiLCJBTFRfS0VZUyIsIkNPTlRST0xfS0VZUyIsInRpbWVEb3duRm9yS2V5Iiwic2tpcE5vdGlmeSIsImR0IiwibXMiLCJhdHRhY2hUb1dpbmRvdyIsImV2ZW50IiwiYWRkTGlzdGVuZXJzVG9Eb2N1bWVudCIsIndpbmRvdyIsImFkZEV2ZW50TGlzdGVuZXIiLCJjYXB0dXJlIiwiZG9jdW1lbnQiLCJsb2FkTGlzdGVuZXIiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwic2V0RW5hYmxlZCIsImlzRW5hYmxlZCIsImRpc3Bvc2UiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIktleVN0YXRlVHJhY2tlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBIHR5cGUgdGhhdCB3aWxsIG1hbmFnZSB0aGUgc3RhdGUgb2YgdGhlIGtleWJvYXJkLiBUaGlzIHdpbGwgdHJhY2sgd2hpY2gga2V5cyBhcmUgYmVpbmcgaGVsZCBkb3duIGFuZCBmb3IgaG93IGxvbmcuXHJcbiAqIEl0IGFsc28gb2ZmZXJzIGNvbnZlbmllbmNlIG1ldGhvZHMgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90IHNwZWNpZmljIGtleXMgYXJlIGRvd24gbGlrZSBzaGlmdCBvciBlbnRlciB1c2luZ1xyXG4gKiBLZXlib2FyZFV0aWxzJyBrZXkgc2NoZW1hLlxyXG4gKlxyXG4gKiBAYXV0aG9yIE1pY2hhZWwgS2F1em1hbm4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgSmVzc2UgR3JlZW5iZXJnIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIE1pY2hhZWwgQmFybG93XHJcbiAqL1xyXG5cclxuaW1wb3J0IFBoZXRpb0FjdGlvbiBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvUGhldGlvQWN0aW9uLmpzJztcclxuaW1wb3J0IEVtaXR0ZXIgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9FbWl0dGVyLmpzJztcclxuaW1wb3J0IHN0ZXBUaW1lciBmcm9tICcuLi8uLi8uLi9heG9uL2pzL3N0ZXBUaW1lci5qcyc7XHJcbmltcG9ydCBFdmVudFR5cGUgZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL0V2ZW50VHlwZS5qcyc7XHJcbmltcG9ydCB7IEVuZ2xpc2hLZXksIEVuZ2xpc2hTdHJpbmdUb0NvZGVNYXAsIGV2ZW50Q29kZVRvRW5nbGlzaFN0cmluZywgRXZlbnRJTywgS2V5Ym9hcmRVdGlscywgc2NlbmVyeSB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgeyBQaGV0aW9PYmplY3RPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL1BoZXRpb09iamVjdC5qcyc7XHJcbmltcG9ydCBQaWNrT3B0aW9uYWwgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1BpY2tPcHRpb25hbC5qcyc7XHJcbmltcG9ydCBURW1pdHRlciBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RFbWl0dGVyLmpzJztcclxuaW1wb3J0IHBsYXRmb3JtIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9wbGF0Zm9ybS5qcyc7XHJcblxyXG4vLyBUeXBlIGRlc2NyaWJpbmcgdGhlIHN0YXRlIG9mIGEgc2luZ2xlIGtleSBpbiB0aGUgS2V5U3RhdGUuXHJcbnR5cGUgS2V5U3RhdGVJbmZvID0ge1xyXG5cclxuICAvLyBUaGUgZXZlbnQuY29kZSBzdHJpbmcgZm9yIHRoZSBrZXkuXHJcbiAga2V5OiBzdHJpbmc7XHJcblxyXG4gIC8vIEhvdyBsb25nIGhhcyB0aGUga2V5IGJlZW4gaGVsZCBkb3duLCBpbiBtaWxsaXNlY29uZHNcclxuICB0aW1lRG93bjogbnVtYmVyO1xyXG59O1xyXG5cclxuLy8gVGhlIHR5cGUgZm9yIHRoZSBrZXlTdGF0ZSBPYmplY3QsIGtleXMgYXJlIHRoZSBLZXlib2FyZEV2ZW50LmNvZGUgZm9yIHRoZSBwcmVzc2VkIGtleS5cclxudHlwZSBLZXlTdGF0ZSA9IFJlY29yZDxzdHJpbmcsIEtleVN0YXRlSW5mbz47XHJcblxyXG5leHBvcnQgdHlwZSBLZXlTdGF0ZVRyYWNrZXJPcHRpb25zID0gUGlja09wdGlvbmFsPFBoZXRpb09iamVjdE9wdGlvbnMsICd0YW5kZW0nPjtcclxuXHJcbmNsYXNzIEtleVN0YXRlVHJhY2tlciB7XHJcblxyXG4gIC8vIENvbnRhaW5zIGluZm8gYWJvdXQgd2hpY2gga2V5cyBhcmUgY3VycmVudGx5IHByZXNzZWQgZm9yIGhvdyBsb25nLiBKYXZhU2NyaXB0IGRvZXNuJ3QgaGFuZGxlIG11bHRpcGxlIGtleSBwcmVzc2VzLFxyXG4gIC8vIHdpdGggZXZlbnRzIHNvIHdlIGhhdmUgdG8gdXBkYXRlIHRoaXMgb2JqZWN0IG91cnNlbHZlcy5cclxuICBwcml2YXRlIGtleVN0YXRlOiBLZXlTdGF0ZSA9IHt9O1xyXG5cclxuICAvLyBUaGUgS2V5Ym9hcmRFdmVudC5jb2RlIG9mIHRoZSBsYXN0IGtleSB0aGF0IHdhcyBwcmVzc2VkIGRvd24gd2hlbiB1cGRhdGluZyB0aGUga2V5IHN0YXRlLlxyXG4gIHByaXZhdGUgX2xhc3RLZXlEb3duOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgLy8gV2hldGhlciB0aGlzIEtleVN0YXRlVHJhY2tlciBpcyBhdHRhY2hlZCB0byB0aGUgZG9jdW1lbnQgYW5kIGxpc3RlbmluZyBmb3IgZXZlbnRzLlxyXG4gIHByaXZhdGUgYXR0YWNoZWRUb0RvY3VtZW50ID0gZmFsc2U7XHJcblxyXG4gIC8vIExpc3RlbmVycyBwb3RlbnRpYWxseSBhdHRhY2hlZCB0byB0aGUgZG9jdW1lbnQgdG8gdXBkYXRlIHRoZSBzdGF0ZSBvZiB0aGlzIEtleVN0YXRlVHJhY2tlciwgc2VlIGF0dGFjaFRvV2luZG93KClcclxuICBwcml2YXRlIGRvY3VtZW50S2V5dXBMaXN0ZW5lcjogbnVsbCB8ICggKCBldmVudDogS2V5Ym9hcmRFdmVudCApID0+IHZvaWQgKSA9IG51bGw7XHJcbiAgcHJpdmF0ZSBkb2N1bWVudEtleWRvd25MaXN0ZW5lcjogbnVsbCB8ICggKCBldmVudDogS2V5Ym9hcmRFdmVudCApID0+IHZvaWQgKSA9IG51bGw7XHJcbiAgcHJpdmF0ZSBkb2N1bWVudEJsdXJMaXN0ZW5lcjogbnVsbCB8ICggKCBldmVudDogRm9jdXNFdmVudCApID0+IHZvaWQgKSA9IG51bGw7XHJcblxyXG4gIC8vIElmIHRoZSBLZXlTdGF0ZVRyYWNrZXIgaXMgZW5hYmxlZC4gSWYgZGlzYWJsZWQsIGtleVN0YXRlIGlzIGNsZWFyZWQgYW5kIGxpc3RlbmVycyBub29wLlxyXG4gIHByaXZhdGUgX2VuYWJsZWQgPSB0cnVlO1xyXG5cclxuICAvLyBFbWl0cyBldmVudHMgd2hlbiBrZXl1cC9rZXlkb3duIHVwZGF0ZXMgYXJlIHJlY2VpdmVkLiBUaGVzZSB3aWxsIGVtaXQgYWZ0ZXIgYW55IHVwZGF0ZXMgdG8gdGhlXHJcbiAgLy8ga2V5U3RhdGUgc28gdGhhdCBrZXlTdGF0ZSBpcyBjb3JyZWN0IGluIHRpbWUgZm9yIGxpc3RlbmVycy4gTm90ZSB0aGUgdmFsdWVUeXBlIGlzIGEgbmF0aXZlIEtleWJvYXJkRXZlbnQgZXZlbnQuXHJcbiAgcHVibGljIHJlYWRvbmx5IGtleWRvd25FbWl0dGVyOiBURW1pdHRlcjxbIEtleWJvYXJkRXZlbnQgXT4gPSBuZXcgRW1pdHRlciggeyBwYXJhbWV0ZXJzOiBbIHsgdmFsdWVUeXBlOiBLZXlib2FyZEV2ZW50IH0gXSB9ICk7XHJcbiAgcHVibGljIHJlYWRvbmx5IGtleXVwRW1pdHRlcjogVEVtaXR0ZXI8WyBLZXlib2FyZEV2ZW50IF0+ID0gbmV3IEVtaXR0ZXIoIHsgcGFyYW1ldGVyczogWyB7IHZhbHVlVHlwZTogS2V5Ym9hcmRFdmVudCB9IF0gfSApO1xyXG5cclxuICAvLyBFbWl0cyB3aGVuIGFueSBrZXkgXCJkb3duXCIgc3RhdGUgY2hhbmdlcy4gVGhpcyBpcyB1c2VmdWwgZm9yIHdoZW4geW91IHdhbnQgdG8ga25vdyBpZiBhbnkga2V5IGlzIGRvd24gb3IgdXAuXHJcbiAgLy8gRG9lcyBOT1QgY2hhbmdlIGZvciB0aW1lRG93biBjaGFuZ2VzLiBET0VTIGZpcmUgaWYgdGhlIGJyb3dzZXIgc2VuZHMgZmlyZS1vbi1ob2xkIGRvd24uXHJcbiAgcHVibGljIHJlYWRvbmx5IGtleURvd25TdGF0ZUNoYW5nZWRFbWl0dGVyOiBURW1pdHRlcjxbIEtleWJvYXJkRXZlbnQgfCBudWxsIF0+ID0gbmV3IEVtaXR0ZXIoIHsgcGFyYW1ldGVyczogWyB7IHZhbHVlVHlwZTogWyBLZXlib2FyZEV2ZW50LCBudWxsIF0gfSBdIH0gKTtcclxuXHJcbiAgLy8gQWN0aW9uIHdoaWNoIHVwZGF0ZXMgdGhlIEtleVN0YXRlVHJhY2tlciwgd2hlbiBpdCBpcyB0aW1lIHRvIGRvIHNvIC0gdGhlIHVwZGF0ZSBpcyB3cmFwcGVkIGJ5IGFuIEFjdGlvbiBzbyB0aGF0XHJcbiAgLy8gdGhlIEtleVN0YXRlVHJhY2tlciBzdGF0ZSBpcyBjYXB0dXJlZCBmb3IgUGhFVC1pTy5cclxuICBwdWJsaWMgcmVhZG9ubHkga2V5ZG93blVwZGF0ZUFjdGlvbjogUGhldGlvQWN0aW9uPFsgS2V5Ym9hcmRFdmVudCBdPjtcclxuXHJcbiAgLy8gQWN0aW9uIHdoaWNoIHVwZGF0ZXMgdGhlIHN0YXRlIG9mIHRoZSBLZXlTdGF0ZVRyYWNrZXIgb24ga2V5IHJlbGVhc2UuIFRoaXMgaXMgd3JhcHBlZCBpbiBhbiBBY3Rpb24gc28gdGhhdCBzdGF0ZVxyXG4gIC8vIGlzIGNhcHR1cmVkIGZvciBQaEVULWlPLlxyXG4gIHB1YmxpYyByZWFkb25seSBrZXl1cFVwZGF0ZUFjdGlvbjogUGhldGlvQWN0aW9uPFsgS2V5Ym9hcmRFdmVudCBdPjtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNwb3NlS2V5U3RhdGVUcmFja2VyOiAoKSA9PiB2b2lkO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIG9wdGlvbnM/OiBLZXlTdGF0ZVRyYWNrZXJPcHRpb25zICkge1xyXG5cclxuICAgIHRoaXMua2V5ZG93blVwZGF0ZUFjdGlvbiA9IG5ldyBQaGV0aW9BY3Rpb24oIGRvbUV2ZW50ID0+IHtcclxuXHJcbiAgICAgIC8vIE5vdCBhbGwga2V5cyBoYXZlIGEgY29kZSBmb3IgdGhlIGJyb3dzZXIgdG8gdXNlLCB3ZSBuZWVkIHRvIGJlIGdyYWNlZnVsIGFuZCBkbyBub3RoaW5nIGlmIHRoZXJlIGlzbid0IG9uZS5cclxuICAgICAgY29uc3Qga2V5ID0gS2V5Ym9hcmRVdGlscy5nZXRFdmVudENvZGUoIGRvbUV2ZW50ICk7XHJcbiAgICAgIGlmICgga2V5ICkge1xyXG5cclxuICAgICAgICAvLyBUaGUgZG9tIGV2ZW50IG1pZ2h0IGhhdmUgYSBtb2RpZmllciBrZXkgdGhhdCB3ZSB3ZXJlbid0IGFibGUgdG8gY2F0Y2gsIGlmIHRoYXQgaXMgdGhlIGNhc2UgdXBkYXRlIHRoZSBrZXlTdGF0ZS5cclxuICAgICAgICAvLyBUaGlzIGlzIGxpa2VseSB0byBoYXBwZW4gd2hlbiBwcmVzc2luZyBicm93c2VyIGtleSBjb21tYW5kcyBsaWtlIFwiY3RybCArIHRhYlwiIHRvIHN3aXRjaCB0YWJzLlxyXG4gICAgICAgIHRoaXMuY29ycmVjdE1vZGlmaWVyS2V5cyggZG9tRXZlbnQgKTtcclxuXHJcbiAgICAgICAgaWYgKCBhc3NlcnQgJiYgIUtleWJvYXJkVXRpbHMuaXNTaGlmdEtleSggZG9tRXZlbnQgKSApIHtcclxuICAgICAgICAgIGFzc2VydCggZG9tRXZlbnQuc2hpZnRLZXkgPT09IHRoaXMuc2hpZnRLZXlEb3duLCAnc2hpZnQga2V5IGluY29uc2lzdGVuY3kgYmV0d2VlbiBldmVudCBhbmQga2V5U3RhdGUuJyApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIGFzc2VydCAmJiAhS2V5Ym9hcmRVdGlscy5pc0FsdEtleSggZG9tRXZlbnQgKSApIHtcclxuICAgICAgICAgIGFzc2VydCggZG9tRXZlbnQuYWx0S2V5ID09PSB0aGlzLmFsdEtleURvd24sICdhbHQga2V5IGluY29uc2lzdGVuY3kgYmV0d2VlbiBldmVudCBhbmQga2V5U3RhdGUuJyApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIGFzc2VydCAmJiAhS2V5Ym9hcmRVdGlscy5pc0NvbnRyb2xLZXkoIGRvbUV2ZW50ICkgKSB7XHJcbiAgICAgICAgICBhc3NlcnQoIGRvbUV2ZW50LmN0cmxLZXkgPT09IHRoaXMuY3RybEtleURvd24sICdjdHJsIGtleSBpbmNvbnNpc3RlbmN5IGJldHdlZW4gZXZlbnQgYW5kIGtleVN0YXRlLicgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBhc3NlcnQgJiYgIUtleWJvYXJkVXRpbHMuaXNNZXRhS2V5KCBkb21FdmVudCApICkge1xyXG4gICAgICAgICAgYXNzZXJ0KCBkb21FdmVudC5tZXRhS2V5ID09PSB0aGlzLm1ldGFLZXlEb3duLCAnbWV0YSBrZXkgaW5jb25zaXN0ZW5jeSBiZXR3ZWVuIGV2ZW50IGFuZCBrZXlTdGF0ZS4nICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBpZiB0aGUga2V5IGlzIGFscmVhZHkgZG93biwgZG9uJ3QgZG8gYW55dGhpbmcgZWxzZSAod2UgZG9uJ3Qgd2FudCB0byBjcmVhdGUgYSBuZXcga2V5U3RhdGUgb2JqZWN0XHJcbiAgICAgICAgLy8gZm9yIGEga2V5IHRoYXQgaXMgYWxyZWFkeSBiZWluZyB0cmFja2VkIGFuZCBkb3duKVxyXG4gICAgICAgIGlmICggIXRoaXMuaXNLZXlEb3duKCBrZXkgKSApIHtcclxuICAgICAgICAgIGNvbnN0IGtleSA9IEtleWJvYXJkVXRpbHMuZ2V0RXZlbnRDb2RlKCBkb21FdmVudCApITtcclxuICAgICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGtleSwgJ0NvdWxkIG5vdCBmaW5kIGtleSBmcm9tIGRvbUV2ZW50JyApO1xyXG4gICAgICAgICAgdGhpcy5rZXlTdGF0ZVsga2V5IF0gPSB7XHJcbiAgICAgICAgICAgIGtleToga2V5LFxyXG4gICAgICAgICAgICB0aW1lRG93bjogMCAvLyBpbiBtc1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX2xhc3RLZXlEb3duID0ga2V5O1xyXG5cclxuICAgICAgICAvLyBrZXlkb3duIHVwZGF0ZSByZWNlaXZlZCwgbm90aWZ5IGxpc3RlbmVyc1xyXG4gICAgICAgIHRoaXMua2V5ZG93bkVtaXR0ZXIuZW1pdCggZG9tRXZlbnQgKTtcclxuICAgICAgICB0aGlzLmtleURvd25TdGF0ZUNoYW5nZWRFbWl0dGVyLmVtaXQoIGRvbUV2ZW50ICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9LCB7XHJcbiAgICAgIHBoZXRpb1BsYXliYWNrOiB0cnVlLFxyXG4gICAgICB0YW5kZW06IG9wdGlvbnM/LnRhbmRlbT8uY3JlYXRlVGFuZGVtKCAna2V5ZG93blVwZGF0ZUFjdGlvbicgKSxcclxuICAgICAgcGFyYW1ldGVyczogWyB7IG5hbWU6ICdldmVudCcsIHBoZXRpb1R5cGU6IEV2ZW50SU8gfSBdLFxyXG4gICAgICBwaGV0aW9FdmVudFR5cGU6IEV2ZW50VHlwZS5VU0VSLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnQWN0aW9uIHRoYXQgZXhlY3V0ZXMgd2hlbmV2ZXIgYSBrZXlkb3duIG9jY3VycyBmcm9tIHRoZSBpbnB1dCBsaXN0ZW5lcnMgdGhpcyBrZXlTdGF0ZVRyYWNrZXIgYWRkcyAobW9zdCBsaWtlbHkgdG8gdGhlIGRvY3VtZW50KS4nXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5rZXl1cFVwZGF0ZUFjdGlvbiA9IG5ldyBQaGV0aW9BY3Rpb24oIGRvbUV2ZW50ID0+IHtcclxuXHJcbiAgICAgIC8vIE5vdCBhbGwga2V5cyBoYXZlIGEgY29kZSBmb3IgdGhlIGJyb3dzZXIgdG8gdXNlLCB3ZSBuZWVkIHRvIGJlIGdyYWNlZnVsIGFuZCBkbyBub3RoaW5nIGlmIHRoZXJlIGlzbid0IG9uZS5cclxuICAgICAgY29uc3Qga2V5ID0gS2V5Ym9hcmRVdGlscy5nZXRFdmVudENvZGUoIGRvbUV2ZW50ICk7XHJcbiAgICAgIGlmICgga2V5ICkge1xyXG5cclxuICAgICAgICAvLyBjb3JyZWN0IGtleVN0YXRlIGluIGNhc2UgYnJvd3NlciBkaWRuJ3QgcmVjZWl2ZSBrZXlkb3duL2tleXVwIGV2ZW50cyBmb3IgYSBtb2RpZmllciBrZXlcclxuICAgICAgICB0aGlzLmNvcnJlY3RNb2RpZmllcktleXMoIGRvbUV2ZW50ICk7XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSB0aGlzIGtleSBkYXRhIGZyb20gdGhlIHN0YXRlIC0gVGhlcmUgYXJlIG1hbnkgY2FzZXMgd2hlcmUgd2UgbWlnaHQgcmVjZWl2ZSBhIGtleXVwIGJlZm9yZSBrZXlkb3duIGxpa2VcclxuICAgICAgICAvLyBvbiBmaXJzdCB0YWIgaW50byBzY2VuZXJ5IERpc3BsYXkgb3Igd2hlbiB1c2luZyBzcGVjaWZpYyBvcGVyYXRpbmcgc3lzdGVtIGtleXMgd2l0aCB0aGUgYnJvd3NlciBvciBQcnRTY24gc29cclxuICAgICAgICAvLyBhbiBhc3NlcnRpb24gZm9yIHRoaXMgaXMgdG9vIHN0cmljdC4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy85MThcclxuICAgICAgICBpZiAoIHRoaXMuaXNLZXlEb3duKCBrZXkgKSApIHtcclxuICAgICAgICAgIGRlbGV0ZSB0aGlzLmtleVN0YXRlWyBrZXkgXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE9uIE1hY09TLCB3ZSB3aWxsIG5vdCBnZXQga2V5IGtleXVwIGV2ZW50cyB3aGlsZSBhIG1ldGEga2V5IGlzIHByZXNzZWQuIFNvIHRoZSBrZXlzdGF0ZSB3aWxsIGJlIGluYWNjdXJhdGVcclxuICAgICAgICAvLyB1bnRpbCB0aGUgbWV0YSBrZXlzIGFyZSByZWxlYXNlZC4gSWYgYm90aCBtZXRhIGtleXMgYXJlIHByZXNzZWQsIFdlIGp1c3QgV2Ugd2lsbCBub3QgZ2V0IGEga2V5dXAgZXZlbnQgdW50aWxcclxuICAgICAgICAvLyBCT1RIIGtleXMgYXJlIHJlbGVhc2VkLCBzbyB0aGlzIHNob3VsZCBiZSBzYWZlIGluIHRoYXQgY2FzZS5cclxuICAgICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1NTVcclxuICAgICAgICBpZiAoIHBsYXRmb3JtLm1hYyAmJiBLZXlib2FyZFV0aWxzLmlzTWV0YUtleSggZG9tRXZlbnQgKSApIHtcclxuICAgICAgICAgIC8vIFNraXAgbm90aWZpY2F0aW9uLCBzaW5jZSB3ZSB3aWxsIGVtaXQgb24gdGhlIHN0YXRlIGNoYW5nZSBiZWxvd1xyXG4gICAgICAgICAgdGhpcy5jbGVhclN0YXRlKCB0cnVlICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBrZXl1cCBldmVudCByZWNlaXZlZCwgbm90aWZ5IGxpc3RlbmVyc1xyXG4gICAgICAgIHRoaXMua2V5dXBFbWl0dGVyLmVtaXQoIGRvbUV2ZW50ICk7XHJcbiAgICAgICAgdGhpcy5rZXlEb3duU3RhdGVDaGFuZ2VkRW1pdHRlci5lbWl0KCBkb21FdmVudCApO1xyXG4gICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgIHBoZXRpb1BsYXliYWNrOiB0cnVlLFxyXG4gICAgICB0YW5kZW06IG9wdGlvbnM/LnRhbmRlbT8uY3JlYXRlVGFuZGVtKCAna2V5dXBVcGRhdGVBY3Rpb24nICksXHJcbiAgICAgIHBhcmFtZXRlcnM6IFsgeyBuYW1lOiAnZXZlbnQnLCBwaGV0aW9UeXBlOiBFdmVudElPIH0gXSxcclxuICAgICAgcGhldGlvRXZlbnRUeXBlOiBFdmVudFR5cGUuVVNFUixcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ0FjdGlvbiB0aGF0IGV4ZWN1dGVzIHdoZW5ldmVyIGEga2V5dXAgb2NjdXJzIGZyb20gdGhlIGlucHV0IGxpc3RlbmVycyB0aGlzIGtleVN0YXRlVHJhY2tlciBhZGRzIChtb3N0IGxpa2VseSB0byB0aGUgZG9jdW1lbnQpLidcclxuICAgIH0gKTtcclxuXHJcbiAgICBjb25zdCBzdGVwTGlzdGVuZXIgPSB0aGlzLnN0ZXAuYmluZCggdGhpcyApO1xyXG4gICAgc3RlcFRpbWVyLmFkZExpc3RlbmVyKCBzdGVwTGlzdGVuZXIgKTtcclxuXHJcbiAgICB0aGlzLmRpc3Bvc2VLZXlTdGF0ZVRyYWNrZXIgPSAoKSA9PiB7XHJcbiAgICAgIHN0ZXBUaW1lci5yZW1vdmVMaXN0ZW5lciggc3RlcExpc3RlbmVyICk7XHJcblxyXG4gICAgICBpZiAoIHRoaXMuYXR0YWNoZWRUb0RvY3VtZW50ICkge1xyXG4gICAgICAgIHRoaXMuZGV0YWNoRnJvbURvY3VtZW50KCk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbXBsZW1lbnRzIGtleWJvYXJkIGRyYWdnaW5nIHdoZW4gbGlzdGVuZXIgaXMgYXR0YWNoZWQgdG8gdGhlIE5vZGUsIHB1YmxpYyBzbyBsaXN0ZW5lciBpcyBhdHRhY2hlZFxyXG4gICAqIHdpdGggYWRkSW5wdXRMaXN0ZW5lcigpLiBPbmx5IHVwZGF0ZWQgd2hlbiBlbmFibGVkLlxyXG4gICAqXHJcbiAgICogTm90ZSB0aGF0IHRoaXMgZXZlbnQgaXMgYXNzaWduZWQgaW4gdGhlIGNvbnN0cnVjdG9yLCBhbmQgbm90IHRvIHRoZSBwcm90b3R5cGUuIEFzIG9mIHdyaXRpbmcgdGhpcyxcclxuICAgKiBgTm9kZS5hZGRJbnB1dExpc3RlbmVyYCBvbmx5IHN1cHBvcnRzIHR5cGUgcHJvcGVydGllcyBhcyBldmVudCBsaXN0ZW5lcnMsIGFuZCBub3QgdGhlIGV2ZW50IGtleXMgYXNcclxuICAgKiBwcm90b3R5cGUgbWV0aG9kcy4gUGxlYXNlIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvODUxIGZvciBtb3JlIGluZm9ybWF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBrZXlkb3duVXBkYXRlKCBkb21FdmVudDogS2V5Ym9hcmRFdmVudCApOiB2b2lkIHtcclxuICAgIHRoaXMuZW5hYmxlZCAmJiB0aGlzLmtleWRvd25VcGRhdGVBY3Rpb24uZXhlY3V0ZSggZG9tRXZlbnQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1vZGlmaWVyIGtleXMgbWlnaHQgYmUgcGFydCBvZiB0aGUgZG9tRXZlbnQgYnV0IHRoZSBicm93c2VyIG1heSBvciBtYXkgbm90IGhhdmUgcmVjZWl2ZWQgYSBrZXlkb3duL2tleXVwIGV2ZW50XHJcbiAgICogd2l0aCBzcGVjaWZpY2FsbHkgZm9yIHRoZSBtb2RpZmllciBrZXkuIFRoaXMgd2lsbCBhZGQgb3IgcmVtb3ZlIG1vZGlmaWVyIGtleXMgaW4gdGhhdCBjYXNlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgY29ycmVjdE1vZGlmaWVyS2V5cyggZG9tRXZlbnQ6IEtleWJvYXJkRXZlbnQgKTogdm9pZCB7XHJcbiAgICBjb25zdCBrZXkgPSBLZXlib2FyZFV0aWxzLmdldEV2ZW50Q29kZSggZG9tRXZlbnQgKSE7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBrZXksICdrZXkgbm90IGZvdW5kIGZyb20gZG9tRXZlbnQnICk7XHJcblxyXG4gICAgbGV0IGNoYW5nZWQgPSBmYWxzZTtcclxuXHJcbiAgICAvLyBhZGQgbW9kaWZpZXIga2V5cyBpZiB0aGV5IGFyZW4ndCBkb3duXHJcbiAgICBpZiAoIGRvbUV2ZW50LnNoaWZ0S2V5ICYmICFLZXlib2FyZFV0aWxzLmlzU2hpZnRLZXkoIGRvbUV2ZW50ICkgJiYgIXRoaXMuc2hpZnRLZXlEb3duICkge1xyXG4gICAgICBjaGFuZ2VkID0gY2hhbmdlZCB8fCAhdGhpcy5rZXlTdGF0ZVsgS2V5Ym9hcmRVdGlscy5LRVlfU0hJRlRfTEVGVCBdO1xyXG4gICAgICB0aGlzLmtleVN0YXRlWyBLZXlib2FyZFV0aWxzLktFWV9TSElGVF9MRUZUIF0gPSB7XHJcbiAgICAgICAga2V5OiBrZXksXHJcbiAgICAgICAgdGltZURvd246IDAgLy8gaW4gbXNcclxuICAgICAgfTtcclxuICAgIH1cclxuICAgIGlmICggZG9tRXZlbnQuYWx0S2V5ICYmICFLZXlib2FyZFV0aWxzLmlzQWx0S2V5KCBkb21FdmVudCApICYmICF0aGlzLmFsdEtleURvd24gKSB7XHJcbiAgICAgIGNoYW5nZWQgPSBjaGFuZ2VkIHx8ICF0aGlzLmtleVN0YXRlWyBLZXlib2FyZFV0aWxzLktFWV9BTFRfTEVGVCBdO1xyXG4gICAgICB0aGlzLmtleVN0YXRlWyBLZXlib2FyZFV0aWxzLktFWV9BTFRfTEVGVCBdID0ge1xyXG4gICAgICAgIGtleToga2V5LFxyXG4gICAgICAgIHRpbWVEb3duOiAwIC8vIGluIG1zXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgICBpZiAoIGRvbUV2ZW50LmN0cmxLZXkgJiYgIUtleWJvYXJkVXRpbHMuaXNDb250cm9sS2V5KCBkb21FdmVudCApICYmICF0aGlzLmN0cmxLZXlEb3duICkge1xyXG4gICAgICBjaGFuZ2VkID0gY2hhbmdlZCB8fCAhdGhpcy5rZXlTdGF0ZVsgS2V5Ym9hcmRVdGlscy5LRVlfQ09OVFJPTF9MRUZUIF07XHJcbiAgICAgIHRoaXMua2V5U3RhdGVbIEtleWJvYXJkVXRpbHMuS0VZX0NPTlRST0xfTEVGVCBdID0ge1xyXG4gICAgICAgIGtleToga2V5LFxyXG4gICAgICAgIHRpbWVEb3duOiAwIC8vIGluIG1zXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgICBpZiAoIGRvbUV2ZW50Lm1ldGFLZXkgJiYgIUtleWJvYXJkVXRpbHMuaXNNZXRhS2V5KCBkb21FdmVudCApICYmICF0aGlzLm1ldGFLZXlEb3duICkge1xyXG4gICAgICBjaGFuZ2VkID0gY2hhbmdlZCB8fCAhdGhpcy5rZXlTdGF0ZVsgS2V5Ym9hcmRVdGlscy5LRVlfTUVUQV9MRUZUIF07XHJcbiAgICAgIHRoaXMua2V5U3RhdGVbIEtleWJvYXJkVXRpbHMuS0VZX01FVEFfTEVGVCBdID0ge1xyXG4gICAgICAgIGtleToga2V5LFxyXG4gICAgICAgIHRpbWVEb3duOiAwIC8vIGluIG1zXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZGVsZXRlIG1vZGlmaWVyIGtleXMgaWYgd2UgdGhpbmsgdGhleSBhcmUgZG93blxyXG4gICAgaWYgKCAhZG9tRXZlbnQuc2hpZnRLZXkgJiYgdGhpcy5zaGlmdEtleURvd24gKSB7XHJcbiAgICAgIGNoYW5nZWQgPSBjaGFuZ2VkIHx8ICEhdGhpcy5rZXlTdGF0ZVsgS2V5Ym9hcmRVdGlscy5LRVlfU0hJRlRfTEVGVCBdIHx8ICEhdGhpcy5rZXlTdGF0ZVsgS2V5Ym9hcmRVdGlscy5LRVlfU0hJRlRfUklHSFQgXTtcclxuICAgICAgZGVsZXRlIHRoaXMua2V5U3RhdGVbIEtleWJvYXJkVXRpbHMuS0VZX1NISUZUX0xFRlQgXTtcclxuICAgICAgZGVsZXRlIHRoaXMua2V5U3RhdGVbIEtleWJvYXJkVXRpbHMuS0VZX1NISUZUX1JJR0hUIF07XHJcbiAgICB9XHJcbiAgICBpZiAoICFkb21FdmVudC5hbHRLZXkgJiYgdGhpcy5hbHRLZXlEb3duICkge1xyXG4gICAgICBjaGFuZ2VkID0gY2hhbmdlZCB8fCAhIXRoaXMua2V5U3RhdGVbIEtleWJvYXJkVXRpbHMuS0VZX0FMVF9MRUZUIF0gfHwgISF0aGlzLmtleVN0YXRlWyBLZXlib2FyZFV0aWxzLktFWV9BTFRfUklHSFQgXTtcclxuICAgICAgZGVsZXRlIHRoaXMua2V5U3RhdGVbIEtleWJvYXJkVXRpbHMuS0VZX0FMVF9MRUZUIF07XHJcbiAgICAgIGRlbGV0ZSB0aGlzLmtleVN0YXRlWyBLZXlib2FyZFV0aWxzLktFWV9BTFRfUklHSFQgXTtcclxuICAgIH1cclxuICAgIGlmICggIWRvbUV2ZW50LmN0cmxLZXkgJiYgdGhpcy5jdHJsS2V5RG93biApIHtcclxuICAgICAgY2hhbmdlZCA9IGNoYW5nZWQgfHwgISF0aGlzLmtleVN0YXRlWyBLZXlib2FyZFV0aWxzLktFWV9DT05UUk9MX0xFRlQgXSB8fCAhIXRoaXMua2V5U3RhdGVbIEtleWJvYXJkVXRpbHMuS0VZX0NPTlRST0xfUklHSFQgXTtcclxuICAgICAgZGVsZXRlIHRoaXMua2V5U3RhdGVbIEtleWJvYXJkVXRpbHMuS0VZX0NPTlRST0xfTEVGVCBdO1xyXG4gICAgICBkZWxldGUgdGhpcy5rZXlTdGF0ZVsgS2V5Ym9hcmRVdGlscy5LRVlfQ09OVFJPTF9SSUdIVCBdO1xyXG4gICAgfVxyXG4gICAgaWYgKCAhZG9tRXZlbnQubWV0YUtleSAmJiB0aGlzLm1ldGFLZXlEb3duICkge1xyXG4gICAgICBjaGFuZ2VkID0gY2hhbmdlZCB8fCBLZXlib2FyZFV0aWxzLk1FVEFfS0VZUy5zb21lKCBrZXkgPT4gISF0aGlzLmtleVN0YXRlWyBrZXkgXSApO1xyXG4gICAgICBLZXlib2FyZFV0aWxzLk1FVEFfS0VZUy5mb3JFYWNoKCBrZXkgPT4geyBkZWxldGUgdGhpcy5rZXlTdGF0ZVsga2V5IF07IH0gKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIGNoYW5nZWQgKSB7XHJcbiAgICAgIHRoaXMua2V5RG93blN0YXRlQ2hhbmdlZEVtaXR0ZXIuZW1pdCggZG9tRXZlbnQgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEJlaGF2aW9yIGZvciBrZXlib2FyZCAndXAnIERPTSBldmVudC4gUHVibGljIHNvIGl0IGNhbiBiZSBhdHRhY2hlZCB3aXRoIGFkZElucHV0TGlzdGVuZXIoKS4gT25seSB1cGRhdGVkIHdoZW5cclxuICAgKiBlbmFibGVkLlxyXG4gICAqXHJcbiAgICogTm90ZSB0aGF0IHRoaXMgZXZlbnQgaXMgYXNzaWduZWQgaW4gdGhlIGNvbnN0cnVjdG9yLCBhbmQgbm90IHRvIHRoZSBwcm90b3R5cGUuIEFzIG9mIHdyaXRpbmcgdGhpcyxcclxuICAgKiBgTm9kZS5hZGRJbnB1dExpc3RlbmVyYCBvbmx5IHN1cHBvcnRzIHR5cGUgcHJvcGVydGllcyBhcyBldmVudCBsaXN0ZW5lcnMsIGFuZCBub3QgdGhlIGV2ZW50IGtleXMgYXNcclxuICAgKiBwcm90b3R5cGUgbWV0aG9kcy4gUGxlYXNlIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvODUxIGZvciBtb3JlIGluZm9ybWF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBrZXl1cFVwZGF0ZSggZG9tRXZlbnQ6IEtleWJvYXJkRXZlbnQgKTogdm9pZCB7XHJcbiAgICB0aGlzLmVuYWJsZWQgJiYgdGhpcy5rZXl1cFVwZGF0ZUFjdGlvbi5leGVjdXRlKCBkb21FdmVudCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0cnVlIGlmIGFueSBvZiB0aGUgbW92ZW1lbnQga2V5cyBhcmUgZG93biAoYXJyb3cga2V5cyBvciBXQVNEIGtleXMpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgbW92ZW1lbnRLZXlzRG93bigpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmlzQW55S2V5SW5MaXN0RG93biggS2V5Ym9hcmRVdGlscy5NT1ZFTUVOVF9LRVlTICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBLZXlib2FyZEV2ZW50LmNvZGUgZnJvbSB0aGUgbGFzdCBrZXkgZG93biB0aGF0IHVwZGF0ZWQgdGhlIGtleXN0YXRlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMYXN0S2V5RG93bigpOiBzdHJpbmcgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLl9sYXN0S2V5RG93bjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdHJ1ZSBpZiBhIGtleSB3aXRoIHRoZSBLZXlib2FyZEV2ZW50LmNvZGUgaXMgY3VycmVudGx5IGRvd24uXHJcbiAgICovXHJcbiAgcHVibGljIGlzS2V5RG93bigga2V5OiBzdHJpbmcgKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gISF0aGlzLmtleVN0YXRlWyBrZXkgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUga2V5IHdpdGggdGhlIEtleWJvYXJkRXZlbnQuY29kZSBpcyBjdXJyZW50bHkgZG93bi5cclxuICAgKi9cclxuICBwdWJsaWMgaXNFbmdsaXNoS2V5RG93bigga2V5OiBFbmdsaXNoS2V5ICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuaXNBbnlLZXlJbkxpc3REb3duKCBFbmdsaXNoU3RyaW5nVG9Db2RlTWFwWyBrZXkgXSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgc2V0IG9mIGtleXMgdGhhdCBhcmUgY3VycmVudGx5IGRvd24uXHJcbiAgICpcclxuICAgKiBOT1RFOiBBbHdheXMgcmV0dXJucyBhIG5ldyBhcnJheSwgc28gYSBkZWZlbnNpdmUgY29weSBpcyBub3QgbmVlZGVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRLZXlzRG93bigpOiBzdHJpbmdbXSB7XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoIHRoaXMua2V5U3RhdGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHNldCBvZiBFbmdsaXNoS2V5cyB0aGF0IGFyZSBjdXJyZW50bHkgZG93bi5cclxuICAgKlxyXG4gICAqIE5PVEU6IEFsd2F5cyByZXR1cm5zIGEgbmV3IFNldCwgc28gYSBkZWZlbnNpdmUgY29weSBpcyBub3QgbmVlZGVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRFbmdsaXNoS2V5c0Rvd24oKTogU2V0PEVuZ2xpc2hLZXk+IHtcclxuICAgIGNvbnN0IGVuZ2xpc2hLZXlTZXQgPSBuZXcgU2V0PEVuZ2xpc2hLZXk+KCk7XHJcblxyXG4gICAgZm9yICggY29uc3Qga2V5IG9mIHRoaXMuZ2V0S2V5c0Rvd24oKSApIHtcclxuICAgICAgY29uc3QgZW5nbGlzaEtleSA9IGV2ZW50Q29kZVRvRW5nbGlzaFN0cmluZygga2V5ICk7XHJcbiAgICAgIGlmICggZW5nbGlzaEtleSApIHtcclxuICAgICAgICBlbmdsaXNoS2V5U2V0LmFkZCggZW5nbGlzaEtleSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGVuZ2xpc2hLZXlTZXQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRydWUgaWYgYW55IG9mIHRoZSBrZXlzIGluIHRoZSBsaXN0IGFyZSBjdXJyZW50bHkgZG93bi4gS2V5cyBhcmUgdGhlIEtleWJvYXJkRXZlbnQuY29kZSBzdHJpbmdzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc0FueUtleUluTGlzdERvd24oIGtleUxpc3Q6IHN0cmluZ1tdICk6IGJvb2xlYW4ge1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwga2V5TGlzdC5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgaWYgKCB0aGlzLmlzS2V5RG93bigga2V5TGlzdFsgaSBdICkgKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRydWUgaWYgQUxMIG9mIHRoZSBrZXlzIGluIHRoZSBsaXN0IGFyZSBjdXJyZW50bHkgZG93bi4gVmFsdWVzIG9mIHRoZSBrZXlMaXN0IGFycmF5IGFyZSB0aGVcclxuICAgKiBLZXlib2FyZEV2ZW50LmNvZGUgZm9yIHRoZSBrZXlzIHlvdSBhcmUgaW50ZXJlc3RlZCBpbi5cclxuICAgKi9cclxuICBwdWJsaWMgYXJlS2V5c0Rvd24oIGtleUxpc3Q6IHN0cmluZ1tdICk6IGJvb2xlYW4ge1xyXG4gICAgY29uc3Qga2V5c0Rvd24gPSB0cnVlO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwga2V5TGlzdC5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgaWYgKCAhdGhpcy5pc0tleURvd24oIGtleUxpc3RbIGkgXSApICkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBrZXlzRG93bjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdHJ1ZSBpZiBBTEwga2V5cyBpbiB0aGUgbGlzdCBhcmUgZG93biBhbmQgT05MWSB0aGUga2V5cyBpbiB0aGUgbGlzdCBhcmUgZG93bi4gVmFsdWVzIG9mIGtleUxpc3QgYXJyYXlcclxuICAgKiBhcmUgdGhlIEtleWJvYXJkRXZlbnQuY29kZSBmb3Iga2V5cyB5b3UgYXJlIGludGVyZXN0ZWQgaW4gT1IgdGhlIEtleWJvYXJkRXZlbnQua2V5IGluIHRoZSBzcGVjaWFsIGNhc2Ugb2ZcclxuICAgKiBtb2RpZmllciBrZXlzLlxyXG4gICAqXHJcbiAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIGFyZUtleXNFeGNsdXNpdmVseURvd24oIGtleUxpc3Q6IHN0cmluZyBbXSApOiBib29sZWFuIHtcclxuICAgIGNvbnN0IGtleVN0YXRlS2V5cyA9IE9iamVjdC5rZXlzKCB0aGlzLmtleVN0YXRlICk7XHJcblxyXG4gICAgLy8gcXVpY2sgc2FuaXR5IGNoZWNrIGZvciBlcXVhbGl0eSBmaXJzdFxyXG4gICAgaWYgKCBrZXlTdGF0ZUtleXMubGVuZ3RoICE9PSBrZXlMaXN0Lmxlbmd0aCApIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE5vdyBtYWtlIHN1cmUgdGhhdCBldmVyeSBrZXkgaW4gdGhlIGxpc3QgaXMgaW4gdGhlIGtleVN0YXRlXHJcbiAgICBsZXQgb25seUtleUxpc3REb3duID0gdHJ1ZTtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGtleUxpc3QubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGluaXRpYWxLZXkgPSBrZXlMaXN0WyBpIF07XHJcbiAgICAgIGxldCBrZXlzVG9DaGVjayA9IFsgaW5pdGlhbEtleSBdO1xyXG5cclxuICAgICAgLy8gSWYgYSBtb2RpZmllciBrZXksIG5lZWQgdG8gbG9vayBmb3IgdGhlIGVxdWl2YWxlbnQgcGFpciBvZiBsZWZ0L3JpZ2h0IEtleWJvYXJkRXZlbnQuY29kZXMgaW4gdGhlIGxpc3RcclxuICAgICAgLy8gYmVjYXVzZSBLZXlTdGF0ZVRyYWNrZXIgd29ya3MgZXhjbHVzaXZlbHkgd2l0aCBjb2Rlcy5cclxuICAgICAgaWYgKCBLZXlib2FyZFV0aWxzLmlzTW9kaWZpZXJLZXkoIGluaXRpYWxLZXkgKSApIHtcclxuICAgICAgICBrZXlzVG9DaGVjayA9IEtleWJvYXJkVXRpbHMuTU9ESUZJRVJfS0VZX1RPX0NPREVfTUFQLmdldCggaW5pdGlhbEtleSApITtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCBfLmludGVyc2VjdGlvbigga2V5U3RhdGVLZXlzLCBrZXlzVG9DaGVjayApLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgICBvbmx5S2V5TGlzdERvd24gPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBvbmx5S2V5TGlzdERvd247XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRydWUgaWYgZXZlcnkga2V5IGluIHRoZSBsaXN0IGlzIGRvd24gYnV0IG5vIG90aGVyIG1vZGlmaWVyIGtleXMgYXJlIGRvd24sIHVubGVzc1xyXG4gICAqIHRoZSBtb2RpZmllciBrZXkgaXMgaW4gdGhlIGxpc3QuIEZvciBleGFtcGxlXHJcbiAgICogYXJlS2V5c0Rvd25XaXRob3V0TW9kaWZpZXJzKCBbICdTaGlmdExlZnQnLCAnQXJyb3dMZWZ0JyBdICkgLT4gdHJ1ZSBpZiBsZWZ0IHNoaWZ0IGFuZCBsZWZ0IGFycm93IGtleXMgYXJlIGRvd24uXHJcbiAgICogYXJlS2V5c0Rvd25XaXRob3V0TW9kaWZpZXJzKCBbICdTaGlmdExlZnQnLCAnQXJyb3dMZWZ0JyBdICkgLT4gdHJ1ZSBpZiBsZWZ0IHNoaWZ0LCBsZWZ0IGFycm93LCBhbmQgSiBrZXlzIGFyZSBkb3duLlxyXG4gICAqIGFyZUtleXNEb3duV2l0aG91dE1vZGlmaWVycyggWyAnQXJyb3dMZWZ0JyBdICkgLT4gZmFsc2UgaWYgbGVmdCBzaGlmdCBhbmQgYXJyb3cgbGVmdCBrZXlzIGFyZSBkb3duLlxyXG4gICAqIGFyZUtleXNEb3duV2l0aG91dE1vZGlmaWVycyggWyAnQXJyb3dMZWZ0JyBdICkgLT4gdHJ1ZSBpZiB0aGUgbGVmdCBhcnJvdyBrZXkgaXMgZG93bi5cclxuICAgKiBhcmVLZXlzRG93bldpdGhvdXRNb2RpZmllcnMoIFsgJ0Fycm93TGVmdCcgXSApIC0+IHRydWUgaWYgdGhlIGxlZnQgYXJyb3cgYW5kIFIga2V5cyBhcmUgZG93bi5cclxuICAgKlxyXG4gICAqIFRoaXMgaXMgaW1wb3J0YW50IGZvciBkZXRlcm1pbmluZyB3aGVuIGtleWJvYXJkIGV2ZW50cyBzaG91bGQgZmlyZSBsaXN0ZW5lcnMuIFNheSB5b3UgaGF2ZSB0d28gS2V5Ym9hcmRMaXN0ZW5lcnMgLVxyXG4gICAqIE9uZSBmaXJlcyBmcm9tIGtleSAnYycgYW5kIGFub3RoZXIgZmlyZXMgZnJvbSAnc2hpZnQtYycuIElmIHRoZSB1c2VyIHByZXNzZXMgJ3NoaWZ0LWMnLCB5b3UgZG8gTk9UIHdhbnQgYm90aCB0b1xyXG4gICAqIGZpcmUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ga2V5TGlzdCAtIExpc3Qgb2YgS2V5Ym9hcmRFdmVudC5jb2RlIHN0cmluZ3MgZm9yIGtleXMgeW91IGFyZSBpbnRlcmVzdGVkIGluLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhcmVLZXlzRG93bldpdGhvdXRFeHRyYU1vZGlmaWVycygga2V5TGlzdDogc3RyaW5nW10gKTogYm9vbGVhbiB7XHJcblxyXG4gICAgLy8gSWYgYW55IG1vZGlmaWVyIGtleXMgYXJlIGRvd24gdGhhdCBhcmUgbm90IGluIHRoZSBrZXlMaXN0LCByZXR1cm4gZmFsc2VcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IEtleWJvYXJkVXRpbHMuTU9ESUZJRVJfS0VZX0NPREVTLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBtb2RpZmllcktleSA9IEtleWJvYXJkVXRpbHMuTU9ESUZJRVJfS0VZX0NPREVTWyBpIF07XHJcbiAgICAgIGlmICggdGhpcy5pc0tleURvd24oIG1vZGlmaWVyS2V5ICkgJiYgIWtleUxpc3QuaW5jbHVkZXMoIG1vZGlmaWVyS2V5ICkgKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTW9kaWZpZXIgc3RhdGUgc2VlbXMgT0sgc28gcmV0dXJuIHRydWUgaWYgYWxsIGtleXMgaW4gdGhlIGxpc3QgYXJlIGRvd25cclxuICAgIHJldHVybiB0aGlzLmFyZUtleXNEb3duKCBrZXlMaXN0ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRydWUgaWYgYW55IGtleXMgYXJlIGRvd24gYWNjb3JkaW5nIHRvIHRlaCBrZXlTdGF0ZS5cclxuICAgKi9cclxuICBwdWJsaWMga2V5c0FyZURvd24oKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoIHRoaXMua2V5U3RhdGUgKS5sZW5ndGggPiAwO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBcIkVudGVyXCIga2V5IGlzIGN1cnJlbnRseSBkb3duLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgZW50ZXJLZXlEb3duKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuaXNLZXlEb3duKCBLZXlib2FyZFV0aWxzLktFWV9FTlRFUiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBzaGlmdCBrZXkgaXMgY3VycmVudGx5IGRvd24uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBzaGlmdEtleURvd24oKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5pc0FueUtleUluTGlzdERvd24oIEtleWJvYXJkVXRpbHMuU0hJRlRfS0VZUyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBhbHQga2V5IGlzIGN1cnJlbnRseSBkb3duLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgYWx0S2V5RG93bigpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmlzQW55S2V5SW5MaXN0RG93biggS2V5Ym9hcmRVdGlscy5BTFRfS0VZUyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBjb250cm9sIGtleSBpcyBjdXJyZW50bHkgZG93bi5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGN0cmxLZXlEb3duKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuaXNBbnlLZXlJbkxpc3REb3duKCBLZXlib2FyZFV0aWxzLkNPTlRST0xfS0VZUyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0cnVlIGlmIG9uZSBvZiB0aGUgbWV0YSBrZXlzIGlzIGN1cnJlbnRseSBkb3duLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgbWV0YUtleURvd24oKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5pc0FueUtleUluTGlzdERvd24oIEtleWJvYXJkVXRpbHMuTUVUQV9LRVlTICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBhbW91bnQgb2YgdGltZSB0aGF0IHRoZSBwcm92aWRlZCBrZXkgaGFzIGJlZW4gaGVsZCBkb3duLiBFcnJvciBpZiB0aGUga2V5IGlzIG5vdCBjdXJyZW50bHkgZG93bi5cclxuICAgKiBAcGFyYW0ga2V5IC0gS2V5Ym9hcmRFdmVudC5jb2RlIGZvciB0aGUga2V5IHlvdSBhcmUgaW5zcGVjdGluZy5cclxuICAgKi9cclxuICBwdWJsaWMgdGltZURvd25Gb3JLZXkoIGtleTogc3RyaW5nICk6IG51bWJlciB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmlzS2V5RG93bigga2V5ICksICdjYW5ub3QgZ2V0IHRpbWVEb3duIG9uIGEga2V5IHRoYXQgaXMgbm90IHByZXNzZWQgZG93bicgKTtcclxuICAgIHJldHVybiB0aGlzLmtleVN0YXRlWyBrZXkgXS50aW1lRG93bjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsZWFyIHRoZSBlbnRpcmUgc3RhdGUgb2YgdGhlIGtleSB0cmFja2VyLCBiYXNpY2FsbHkgcmVzdGFydGluZyB0aGUgdHJhY2tlci5cclxuICAgKi9cclxuICBwdWJsaWMgY2xlYXJTdGF0ZSggc2tpcE5vdGlmeT86IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICB0aGlzLmtleVN0YXRlID0ge307XHJcblxyXG4gICAgaWYgKCAhc2tpcE5vdGlmeSApIHtcclxuICAgICAgdGhpcy5rZXlEb3duU3RhdGVDaGFuZ2VkRW1pdHRlci5lbWl0KCBudWxsICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTdGVwIGZ1bmN0aW9uIGZvciB0aGUgdHJhY2tlci4gSmF2YVNjcmlwdCBkb2VzIG5vdCBuYXRpdmVseSBoYW5kbGUgbXVsdGlwbGUga2V5ZG93biBldmVudHMgYXQgb25jZSxcclxuICAgKiBzbyB3ZSBuZWVkIHRvIHRyYWNrIHRoZSBzdGF0ZSBvZiB0aGUga2V5Ym9hcmQgaW4gYW4gT2JqZWN0IGFuZCBtYW5hZ2UgZHJhZ2dpbmcgaW4gdGhpcyBmdW5jdGlvbi5cclxuICAgKiBJbiBvcmRlciBmb3IgdGhlIGRyYWcgaGFuZGxlciB0byB3b3JrLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGR0IC0gdGltZSBpbiBzZWNvbmRzIHRoYXQgaGFzIHBhc3NlZCBzaW5jZSB0aGUgbGFzdCB1cGRhdGVcclxuICAgKi9cclxuICBwcml2YXRlIHN0ZXAoIGR0OiBudW1iZXIgKTogdm9pZCB7XHJcblxyXG4gICAgLy8gbm8tb3AgdW5sZXNzIGEga2V5IGlzIGRvd25cclxuICAgIGlmICggdGhpcy5rZXlzQXJlRG93bigpICkge1xyXG4gICAgICBjb25zdCBtcyA9IGR0ICogMTAwMDtcclxuXHJcbiAgICAgIC8vIGZvciBlYWNoIGtleSB0aGF0IGlzIHN0aWxsIGRvd24sIGluY3JlbWVudCB0aGUgdHJhY2tlZCB0aW1lIHRoYXQgaGFzIGJlZW4gZG93blxyXG4gICAgICBmb3IgKCBjb25zdCBpIGluIHRoaXMua2V5U3RhdGUgKSB7XHJcbiAgICAgICAgaWYgKCB0aGlzLmtleVN0YXRlWyBpIF0gKSB7XHJcbiAgICAgICAgICB0aGlzLmtleVN0YXRlWyBpIF0udGltZURvd24gKz0gbXM7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGQgdGhpcyBLZXlTdGF0ZVRyYWNrZXIgdG8gdGhlIHdpbmRvdyBzbyB0aGF0IGl0IHVwZGF0ZXMgd2hlbmV2ZXIgdGhlIGRvY3VtZW50IHJlY2VpdmVzIGtleSBldmVudHMuIFRoaXMgaXNcclxuICAgKiB1c2VmdWwgaWYgeW91IHdhbnQgdG8gb2JzZXJ2ZSBrZXkgcHJlc3NlcyB3aGlsZSBET00gZm9jdXMgbm90IHdpdGhpbiB0aGUgUERPTSByb290LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhdHRhY2hUb1dpbmRvdygpOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLmF0dGFjaGVkVG9Eb2N1bWVudCwgJ0tleVN0YXRlVHJhY2tlciBpcyBhbHJlYWR5IGF0dGFjaGVkIHRvIGRvY3VtZW50LicgKTtcclxuXHJcbiAgICB0aGlzLmRvY3VtZW50S2V5ZG93bkxpc3RlbmVyID0gZXZlbnQgPT4ge1xyXG4gICAgICB0aGlzLmtleWRvd25VcGRhdGUoIGV2ZW50ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZG9jdW1lbnRLZXl1cExpc3RlbmVyID0gZXZlbnQgPT4ge1xyXG4gICAgICB0aGlzLmtleXVwVXBkYXRlKCBldmVudCApO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmRvY3VtZW50Qmx1ckxpc3RlbmVyID0gZXZlbnQgPT4ge1xyXG5cclxuICAgICAgLy8gQXMgcmVjb21tZW5kZWQgZm9yIHNpbWlsYXIgc2l0dWF0aW9ucyBvbmxpbmUsIHdlIGNsZWFyIG91ciBrZXkgc3RhdGUgd2hlbiB3ZSBnZXQgYSB3aW5kb3cgYmx1ciwgc2luY2Ugd2VcclxuICAgICAgLy8gd2lsbCBub3QgYmUgYWJsZSB0byB0cmFjayBhbnkga2V5IHN0YXRlIGNoYW5nZXMgZHVyaW5nIHRoaXMgdGltZSAoYW5kIHVzZXJzIHdpbGwgbGlrZWx5IHJlbGVhc2UgYW55IGtleXNcclxuICAgICAgLy8gdGhhdCBhcmUgcHJlc3NlZCkuXHJcbiAgICAgIC8vIElmIHNoaWZ0L2FsdC9jdHJsIGFyZSBwcmVzc2VkIHdoZW4gd2UgcmVnYWluIGZvY3VzLCB3ZSB3aWxsIGhvcGVmdWxseSBnZXQgYSBrZXlib2FyZCBldmVudCBhbmQgdXBkYXRlIHRoZWlyIHN0YXRlXHJcbiAgICAgIC8vIHdpdGggY29ycmVjdE1vZGlmaWVyS2V5cygpLlxyXG4gICAgICB0aGlzLmNsZWFyU3RhdGUoKTtcclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgYWRkTGlzdGVuZXJzVG9Eb2N1bWVudCA9ICgpID0+IHtcclxuXHJcbiAgICAgIC8vIGF0dGFjaCB3aXRoIHVzZUNhcHR1cmUgc28gdGhhdCB0aGUga2V5U3RhdGVUcmFja2VyIGlzIHVwZGF0ZWQgYmVmb3JlIHRoZSBldmVudHMgZGlzcGF0Y2ggd2l0aGluIFNjZW5lcnlcclxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdrZXl1cCcsIHRoaXMuZG9jdW1lbnRLZXl1cExpc3RlbmVyISwgeyBjYXB0dXJlOiB0cnVlIH0gKTtcclxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdrZXlkb3duJywgdGhpcy5kb2N1bWVudEtleWRvd25MaXN0ZW5lciEsIHsgY2FwdHVyZTogdHJ1ZSB9ICk7XHJcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAnYmx1cicsIHRoaXMuZG9jdW1lbnRCbHVyTGlzdGVuZXIhLCB7IGNhcHR1cmU6IHRydWUgfSApO1xyXG4gICAgICB0aGlzLmF0dGFjaGVkVG9Eb2N1bWVudCA9IHRydWU7XHJcbiAgICB9O1xyXG5cclxuICAgIGlmICggIWRvY3VtZW50ICkge1xyXG5cclxuICAgICAgLy8gYXR0YWNoIGxpc3RlbmVycyBvbiB3aW5kb3cgbG9hZCB0byBlbnN1cmUgdGhhdCB0aGUgZG9jdW1lbnQgaXMgZGVmaW5lZFxyXG4gICAgICBjb25zdCBsb2FkTGlzdGVuZXIgPSAoKSA9PiB7XHJcbiAgICAgICAgYWRkTGlzdGVuZXJzVG9Eb2N1bWVudCgpO1xyXG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCAnbG9hZCcsIGxvYWRMaXN0ZW5lciApO1xyXG4gICAgICB9O1xyXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ2xvYWQnLCBsb2FkTGlzdGVuZXIgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG5cclxuICAgICAgLy8gZG9jdW1lbnQgaXMgZGVmaW5lZCBhbmQgd2Ugd29uJ3QgZ2V0IGFub3RoZXIgbG9hZCBldmVudCBzbyBhdHRhY2ggcmlnaHQgYXdheVxyXG4gICAgICBhZGRMaXN0ZW5lcnNUb0RvY3VtZW50KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgS2V5U3RhdGUgaXMgY2xlYXJlZCB3aGVuIHRoZSB0cmFja2VyIGlzIGRpc2FibGVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRFbmFibGVkKCBlbmFibGVkOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgaWYgKCB0aGlzLl9lbmFibGVkICE9PSBlbmFibGVkICkge1xyXG4gICAgICB0aGlzLl9lbmFibGVkID0gZW5hYmxlZDtcclxuXHJcbiAgICAgIC8vIGNsZWFyIHN0YXRlIHdoZW4gZGlzYWJsZWRcclxuICAgICAgIWVuYWJsZWQgJiYgdGhpcy5jbGVhclN0YXRlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGVuYWJsZWQoIGVuYWJsZWQ6IGJvb2xlYW4gKSB7IHRoaXMuc2V0RW5hYmxlZCggZW5hYmxlZCApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZW5hYmxlZCgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuaXNFbmFibGVkKCk7IH1cclxuXHJcbiAgcHVibGljIGlzRW5hYmxlZCgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX2VuYWJsZWQ7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGV0YWNoIGxpc3RlbmVycyBmcm9tIHRoZSBkb2N1bWVudCB0aGF0IHdvdWxkIHVwZGF0ZSB0aGUgc3RhdGUgb2YgdGhpcyBLZXlTdGF0ZVRyYWNrZXIgb24ga2V5IHByZXNzZXMuXHJcbiAgICovXHJcbiAgcHVibGljIGRldGFjaEZyb21Eb2N1bWVudCgpOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuYXR0YWNoZWRUb0RvY3VtZW50LCAnS2V5U3RhdGVUcmFja2VyIGlzIG5vdCBhdHRhY2hlZCB0byB3aW5kb3cuJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5kb2N1bWVudEtleXVwTGlzdGVuZXIsICdrZXl1cCBsaXN0ZW5lciB3YXMgbm90IGNyZWF0ZWQgb3IgYXR0YWNoZWQgdG8gd2luZG93JyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5kb2N1bWVudEtleWRvd25MaXN0ZW5lciwgJ2tleWRvd24gbGlzdGVuZXIgd2FzIG5vdCBjcmVhdGVkIG9yIGF0dGFjaGVkIHRvIHdpbmRvdy4nICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmRvY3VtZW50Qmx1ckxpc3RlbmVyLCAnYmx1ciBsaXN0ZW5lciB3YXMgbm90IGNyZWF0ZWQgb3IgYXR0YWNoZWQgdG8gd2luZG93LicgKTtcclxuXHJcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2tleXVwJywgdGhpcy5kb2N1bWVudEtleXVwTGlzdGVuZXIhICk7XHJcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2tleWRvd24nLCB0aGlzLmRvY3VtZW50S2V5ZG93bkxpc3RlbmVyISApO1xyXG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdibHVyJywgdGhpcy5kb2N1bWVudEJsdXJMaXN0ZW5lciEgKTtcclxuXHJcbiAgICB0aGlzLmRvY3VtZW50S2V5dXBMaXN0ZW5lciA9IG51bGw7XHJcbiAgICB0aGlzLmRvY3VtZW50S2V5ZG93bkxpc3RlbmVyID0gbnVsbDtcclxuICAgIHRoaXMuZG9jdW1lbnRCbHVyTGlzdGVuZXIgPSBudWxsO1xyXG5cclxuICAgIHRoaXMuYXR0YWNoZWRUb0RvY3VtZW50ID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuZGlzcG9zZUtleVN0YXRlVHJhY2tlcigpO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ0tleVN0YXRlVHJhY2tlcicsIEtleVN0YXRlVHJhY2tlciApO1xyXG5leHBvcnQgZGVmYXVsdCBLZXlTdGF0ZVRyYWNrZXI7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsWUFBWSxNQUFNLG9DQUFvQztBQUM3RCxPQUFPQyxPQUFPLE1BQU0sNkJBQTZCO0FBQ2pELE9BQU9DLFNBQVMsTUFBTSwrQkFBK0I7QUFDckQsT0FBT0MsU0FBUyxNQUFNLGlDQUFpQztBQUN2RCxTQUFxQkMsc0JBQXNCLEVBQUVDLHdCQUF3QixFQUFFQyxPQUFPLEVBQUVDLGFBQWEsRUFBRUMsT0FBTyxRQUFRLGVBQWU7QUFJN0gsT0FBT0MsUUFBUSxNQUFNLG1DQUFtQzs7QUFFeEQ7O0FBVUE7O0FBS0EsTUFBTUMsZUFBZSxDQUFDO0VBRXBCO0VBQ0E7RUFDUUMsUUFBUSxHQUFhLENBQUMsQ0FBQzs7RUFFL0I7RUFDUUMsWUFBWSxHQUFrQixJQUFJOztFQUUxQztFQUNRQyxrQkFBa0IsR0FBRyxLQUFLOztFQUVsQztFQUNRQyxxQkFBcUIsR0FBZ0QsSUFBSTtFQUN6RUMsdUJBQXVCLEdBQWdELElBQUk7RUFDM0VDLG9CQUFvQixHQUE2QyxJQUFJOztFQUU3RTtFQUNRQyxRQUFRLEdBQUcsSUFBSTs7RUFFdkI7RUFDQTtFQUNnQkMsY0FBYyxHQUFnQyxJQUFJakIsT0FBTyxDQUFFO0lBQUVrQixVQUFVLEVBQUUsQ0FBRTtN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