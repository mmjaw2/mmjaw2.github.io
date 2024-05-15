// Copyright 2024, University of Colorado Boulder

/**
 * Manages hotkeys based on two sources:
 *
 * 1. Global hotkeys (from globalHotkeyRegistry)
 * 2. Hotkeys from the current focus trail (FocusManager.pdomFocusProperty, all hotkeys on all input listeners of
 *    nodes in the trail)
 *
 * Manages key press state using EnglishKey from globalKeyStateTracker.
 *
 * The "available" hotkeys are the union of the above two sources.
 *
 * The "enabled" hotkeys are the subset of available hotkeys whose enabledProperties are true.
 *
 * The "active" hotkeys are the subset of enabled hotkeys that are considered pressed. They will have fire-on-hold
 * behavior active.
 *
 * The set of enabled hotkeys determines the set of modifier keys that are considered "active" (in addition to
 * ctrl/alt/meta/shift, which are always included).
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { eventCodeToEnglishString, FocusManager, globalHotkeyRegistry, globalKeyStateTracker, KeyboardUtils, metaEnglishKeys, scenery } from '../imports.js';
import DerivedProperty from '../../../axon/js/DerivedProperty.js';
import TinyProperty from '../../../axon/js/TinyProperty.js';
const arrayComparator = (a, b) => {
  return a.length === b.length && a.every((element, index) => element === b[index]);
};
const setComparator = (a, b) => {
  return a.size === b.size && [...a].every(element => b.has(element));
};
class HotkeyManager {
  // All hotkeys that are either globally or under the current focus trail. They are ordered, so that the first
  // "identical key-shortcut" hotkey with override will be the one that is active.

  // Enabled hotkeys that are either global, or under the current focus trail
  enabledHotkeysProperty = new TinyProperty([]);

  // The set of EnglishKeys that are currently pressed.
  englishKeysDown = new Set();

  // The current set of modifier keys (pressed or not) based on current enabled hotkeys
  // NOTE: Pressed modifier keys will prevent any other Hotkeys from becoming active. For example if you have a hotkey
  // with 'b+x', pressing 'b' will prevent any other hotkeys from becoming active.
  modifierKeys = [];

  // Hotkeys that are actively pressed
  activeHotkeys = new Set();
  constructor() {
    this.availableHotkeysProperty = new DerivedProperty([globalHotkeyRegistry.hotkeysProperty, FocusManager.pdomFocusProperty], (globalHotkeys, focus) => {
      const hotkeys = [];

      // If we have focus, include the hotkeys from the focus trail
      if (focus) {
        for (const node of focus.trail.nodes.slice().reverse()) {
          if (!node.isInputEnabled()) {
            break;
          }
          node.inputListeners.forEach(listener => {
            listener.hotkeys?.forEach(hotkey => {
              hotkeys.push(hotkey);
            });
          });
        }
      }

      // Always include global hotkeys. Use a set since we might have duplicates.
      hotkeys.push(...globalHotkeys);
      return _.uniq(hotkeys);
    }, {
      // We want to not over-notify, so we compare the sets directly
      valueComparisonStrategy: arrayComparator
    });

    // If any of the nodes in the focus trail change inputEnabled, we need to recompute availableHotkeysProperty
    const onInputEnabledChanged = () => {
      this.availableHotkeysProperty.recomputeDerivation();
    };
    FocusManager.pdomFocusProperty.link((focus, oldFocus) => {
      if (oldFocus) {
        oldFocus.trail.nodes.forEach(node => {
          node.inputEnabledProperty.unlink(onInputEnabledChanged);
        });
      }
      if (focus) {
        focus.trail.nodes.forEach(node => {
          node.inputEnabledProperty.lazyLink(onInputEnabledChanged);
        });
      }
    });

    // Update enabledHotkeysProperty when availableHotkeysProperty (or any enabledProperty) changes
    const rebuildHotkeys = () => {
      const overriddenHotkeyStrings = new Set();
      const enabledHotkeys = [];
      for (const hotkey of this.availableHotkeysProperty.value) {
        if (hotkey.enabledProperty.value) {
          // Each hotkey will have a canonical way to represent it, so we can check for duplicates when overridden.
          // Catch shift+ctrl+c and ctrl+shift+c as the same hotkey.
          const hotkeyCanonicalString = [...hotkey.modifierKeys.slice().sort(), hotkey.key].join('+');
          if (!overriddenHotkeyStrings.has(hotkeyCanonicalString)) {
            enabledHotkeys.push(hotkey);
            if (hotkey.override) {
              overriddenHotkeyStrings.add(hotkeyCanonicalString);
            }
          }
        }
      }
      this.enabledHotkeysProperty.value = enabledHotkeys;
    };
    // Because we can't add duplicate listeners, we create extra closures to have a unique handle for each hotkey
    const hotkeyRebuildListenerMap = new Map(); // eslint-disable-line no-spaced-func
    this.availableHotkeysProperty.link((newHotkeys, oldHotkeys) => {
      // Track whether any hotkeys changed. If none did, we don't need to rebuild.
      let hotkeysChanged = false;

      // Any old hotkeys and aren't in new hotkeys should be unlinked
      if (oldHotkeys) {
        for (const hotkey of oldHotkeys) {
          if (!newHotkeys.includes(hotkey)) {
            const listener = hotkeyRebuildListenerMap.get(hotkey);
            hotkeyRebuildListenerMap.delete(hotkey);
            assert && assert(listener);
            hotkey.enabledProperty.unlink(listener);
            hotkeysChanged = true;
          }
        }
      }

      // Any new hotkeys that aren't in old hotkeys should be linked
      for (const hotkey of newHotkeys) {
        if (!oldHotkeys || !oldHotkeys.includes(hotkey)) {
          // Unfortunate. Perhaps in the future we could have an abstraction that makes a "count" of how many times we
          // are "listening" to a Property.
          const listener = () => rebuildHotkeys();
          hotkeyRebuildListenerMap.set(hotkey, listener);
          hotkey.enabledProperty.lazyLink(listener);
          hotkeysChanged = true;
        }
      }
      if (hotkeysChanged) {
        rebuildHotkeys();
      }
    });

    // Update modifierKeys and whether each hotkey is currently pressed. This is how hotkeys can have their state change
    // from either themselves (or other hotkeys with modifier keys) being added/removed from enabledHotkeys.
    this.enabledHotkeysProperty.link((newHotkeys, oldHotkeys) => {
      this.modifierKeys = _.uniq([...metaEnglishKeys, ...[...newHotkeys].flatMap(hotkey => hotkey.modifierKeys)]);

      // Remove any hotkeys that are no longer available or enabled
      if (oldHotkeys) {
        for (const hotkey of oldHotkeys) {
          if (!newHotkeys.includes(hotkey) && this.activeHotkeys.has(hotkey)) {
            this.removeActiveHotkey(hotkey, null, false);
          }
        }
      }

      // Re-check all hotkeys (since modifier keys might have changed, OR we need to validate that there are no conflicts).
      this.updateHotkeyStatus(null);
    });

    // Track key state changes
    globalKeyStateTracker.keyDownStateChangedEmitter.addListener(keyboardEvent => {
      const englishKeysDown = globalKeyStateTracker.getEnglishKeysDown();
      const englishKeysChanged = !setComparator(this.englishKeysDown, englishKeysDown);
      if (englishKeysChanged) {
        this.englishKeysDown = englishKeysDown;
        this.updateHotkeyStatus(keyboardEvent);
      } else {
        // No keys changed, got the browser/OS "fire on hold". See what hotkeys have the browser fire-on-hold behavior.

        // Handle re-entrancy (if something changes the state of activeHotkeys)
        for (const hotkey of [...this.activeHotkeys]) {
          if (hotkey.fireOnHold && hotkey.fireOnHoldTiming === 'browser') {
            hotkey.fire(keyboardEvent);
          }
        }
      }
    });
  }

  /**
   * Scenery-internal. If a Node along the focused trail changes its input listeners we need to manually recompute
   * the available hotkeys. There is no other way at this time to observe the input listeners of a Node. Otherwise,
   * the available hotkeys will be recomputed when focus changes, inputEnabledProperty changes for Nodes along the
   * trail, or when global hotkeys change.
   *
   * Called by Node.addInputListener/Node.removeInputListener.
   *
   * (scenery-internal)
   */
  updateHotkeysFromInputListenerChange(node) {
    if (FocusManager.pdomFocusProperty.value && FocusManager.pdomFocusProperty.value.trail.nodes.includes(node)) {
      this.availableHotkeysProperty.recomputeDerivation();
    }
  }

  /**
   * Given a main `key`, see if there is a hotkey that should be considered "active/pressed" for it.
   *
   * For a hotkey to be compatible, it needs to have:
   *
   * 1. Main key pressed
   * 2. All modifier keys in the hotkey's modifierKeys pressed
   * 3. All modifier keys not in the hotkey's modifierKeys (but in the other hotkeys above) not pressed
   */
  getHotkeysForMainKey(mainKey) {
    // If the main key isn't down, there's no way it could be active
    if (!this.englishKeysDown.has(mainKey)) {
      return [];
    }
    const compatibleKeys = [...this.enabledHotkeysProperty.value].filter(hotkey => {
      // Filter out hotkeys that don't have the main key
      if (hotkey.key !== mainKey) {
        return false;
      }

      // See whether the modifier keys match
      return this.modifierKeys.every(modifierKey => {
        return this.englishKeysDown.has(modifierKey) === hotkey.keys.includes(modifierKey) || hotkey.ignoredModifierKeys.includes(modifierKey);
      });
    });
    if (assert) {
      const conflictingKeys = compatibleKeys.filter(hotkey => !hotkey.allowOverlap);
      assert && assert(conflictingKeys.length < 2, `Key conflict detected: ${conflictingKeys.map(hotkey => hotkey.getHotkeyString())}`);
    }
    return compatibleKeys;
  }

  /**
   * Re-check all hotkey active/pressed states (since modifier keys might have changed, OR we need to validate that
   * there are no conflicts).
   */
  updateHotkeyStatus(keyboardEvent) {
    // For fireOnDown on/off cases, we only want to fire the hotkeys when we have a keyboard event specifying hotkey's
    // main `key`.
    const pressedOrReleasedKeyCode = KeyboardUtils.getEventCode(keyboardEvent);
    const pressedOrReleasedEnglishKey = pressedOrReleasedKeyCode ? eventCodeToEnglishString(pressedOrReleasedKeyCode) : null;
    for (const hotkey of this.enabledHotkeysProperty.value) {
      // A hotkey should be  active if its main key is pressed. If it was interrupted, it can only become
      // active again if there was an actual key press event from the user. If a Hotkey is interrupted during
      // a press, it should remain inactive and interrupted until the NEXT press.
      const keyPressed = this.getHotkeysForMainKey(hotkey.key).includes(hotkey);
      const notInterrupted = !hotkey.interrupted || keyboardEvent && keyboardEvent.type === 'keydown';
      const shouldBeActive = keyPressed && notInterrupted;
      const isActive = this.activeHotkeys.has(hotkey);
      if (shouldBeActive && !isActive) {
        this.addActiveHotkey(hotkey, keyboardEvent, hotkey.key === pressedOrReleasedEnglishKey);
      } else if (!shouldBeActive && isActive) {
        this.removeActiveHotkey(hotkey, keyboardEvent, hotkey.key === pressedOrReleasedEnglishKey);
      }
    }
  }

  /**
   * Hotkey made active/pressed
   */
  addActiveHotkey(hotkey, keyboardEvent, triggeredFromPress) {
    this.activeHotkeys.add(hotkey);
    const shouldFire = triggeredFromPress && hotkey.fireOnDown;
    hotkey.onPress(keyboardEvent, shouldFire);
  }

  /**
   * Hotkey made inactive/released.
   */
  removeActiveHotkey(hotkey, keyboardEvent, triggeredFromRelease) {
    // Remove from activeHotkeys before Hotkey.onRelease so that we do not try to remove it again if there is
    // re-entrancy. This is possible if the release listener moves focus or interrupts a Hotkey.
    this.activeHotkeys.delete(hotkey);
    const shouldFire = triggeredFromRelease && !hotkey.fireOnDown;
    const interrupted = !triggeredFromRelease;
    hotkey.onRelease(keyboardEvent, interrupted, shouldFire);
  }

  /**
   * Called by Hotkey, removes the Hotkey from the active set when it is interrupted. The Hotkey cannot be active
   * again in this manager until there is an actual key press event from the user.
   */
  interruptHotkey(hotkey) {
    assert && assert(hotkey.isPressedProperty.value, 'hotkey must be pressed to be interrupted');
    this.removeActiveHotkey(hotkey, null, false);
  }
}
scenery.register('HotkeyManager', HotkeyManager);
const hotkeyManager = new HotkeyManager();
export default hotkeyManager;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJldmVudENvZGVUb0VuZ2xpc2hTdHJpbmciLCJGb2N1c01hbmFnZXIiLCJnbG9iYWxIb3RrZXlSZWdpc3RyeSIsImdsb2JhbEtleVN0YXRlVHJhY2tlciIsIktleWJvYXJkVXRpbHMiLCJtZXRhRW5nbGlzaEtleXMiLCJzY2VuZXJ5IiwiRGVyaXZlZFByb3BlcnR5IiwiVGlueVByb3BlcnR5IiwiYXJyYXlDb21wYXJhdG9yIiwiYSIsImIiLCJsZW5ndGgiLCJldmVyeSIsImVsZW1lbnQiLCJpbmRleCIsInNldENvbXBhcmF0b3IiLCJzaXplIiwiaGFzIiwiSG90a2V5TWFuYWdlciIsImVuYWJsZWRIb3RrZXlzUHJvcGVydHkiLCJlbmdsaXNoS2V5c0Rvd24iLCJTZXQiLCJtb2RpZmllcktleXMiLCJhY3RpdmVIb3RrZXlzIiwiY29uc3RydWN0b3IiLCJhdmFpbGFibGVIb3RrZXlzUHJvcGVydHkiLCJob3RrZXlzUHJvcGVydHkiLCJwZG9tRm9jdXNQcm9wZXJ0eSIsImdsb2JhbEhvdGtleXMiLCJmb2N1cyIsImhvdGtleXMiLCJub2RlIiwidHJhaWwiLCJub2RlcyIsInNsaWNlIiwicmV2ZXJzZSIsImlzSW5wdXRFbmFibGVkIiwiaW5wdXRMaXN0ZW5lcnMiLCJmb3JFYWNoIiwibGlzdGVuZXIiLCJob3RrZXkiLCJwdXNoIiwiXyIsInVuaXEiLCJ2YWx1ZUNvbXBhcmlzb25TdHJhdGVneSIsIm9uSW5wdXRFbmFibGVkQ2hhbmdlZCIsInJlY29tcHV0ZURlcml2YXRpb24iLCJsaW5rIiwib2xkRm9jdXMiLCJpbnB1dEVuYWJsZWRQcm9wZXJ0eSIsInVubGluayIsImxhenlMaW5rIiwicmVidWlsZEhvdGtleXMiLCJvdmVycmlkZGVuSG90a2V5U3RyaW5ncyIsImVuYWJsZWRIb3RrZXlzIiwidmFsdWUiLCJlbmFibGVkUHJvcGVydHkiLCJob3RrZXlDYW5vbmljYWxTdHJpbmciLCJzb3J0Iiwia2V5Iiwiam9pbiIsIm92ZXJyaWRlIiwiYWRkIiwiaG90a2V5UmVidWlsZExpc3RlbmVyTWFwIiwiTWFwIiwibmV3SG90a2V5cyIsIm9sZEhvdGtleXMiLCJob3RrZXlzQ2hhbmdlZCIsImluY2x1ZGVzIiwiZ2V0IiwiZGVsZXRlIiwiYXNzZXJ0Iiwic2V0IiwiZmxhdE1hcCIsInJlbW92ZUFjdGl2ZUhvdGtleSIsInVwZGF0ZUhvdGtleVN0YXR1cyIsImtleURvd25TdGF0ZUNoYW5nZWRFbWl0dGVyIiwiYWRkTGlzdGVuZXIiLCJrZXlib2FyZEV2ZW50IiwiZ2V0RW5nbGlzaEtleXNEb3duIiwiZW5nbGlzaEtleXNDaGFuZ2VkIiwiZmlyZU9uSG9sZCIsImZpcmVPbkhvbGRUaW1pbmciLCJmaXJlIiwidXBkYXRlSG90a2V5c0Zyb21JbnB1dExpc3RlbmVyQ2hhbmdlIiwiZ2V0SG90a2V5c0Zvck1haW5LZXkiLCJtYWluS2V5IiwiY29tcGF0aWJsZUtleXMiLCJmaWx0ZXIiLCJtb2RpZmllcktleSIsImtleXMiLCJpZ25vcmVkTW9kaWZpZXJLZXlzIiwiY29uZmxpY3RpbmdLZXlzIiwiYWxsb3dPdmVybGFwIiwibWFwIiwiZ2V0SG90a2V5U3RyaW5nIiwicHJlc3NlZE9yUmVsZWFzZWRLZXlDb2RlIiwiZ2V0RXZlbnRDb2RlIiwicHJlc3NlZE9yUmVsZWFzZWRFbmdsaXNoS2V5Iiwia2V5UHJlc3NlZCIsIm5vdEludGVycnVwdGVkIiwiaW50ZXJydXB0ZWQiLCJ0eXBlIiwic2hvdWxkQmVBY3RpdmUiLCJpc0FjdGl2ZSIsImFkZEFjdGl2ZUhvdGtleSIsInRyaWdnZXJlZEZyb21QcmVzcyIsInNob3VsZEZpcmUiLCJmaXJlT25Eb3duIiwib25QcmVzcyIsInRyaWdnZXJlZEZyb21SZWxlYXNlIiwib25SZWxlYXNlIiwiaW50ZXJydXB0SG90a2V5IiwiaXNQcmVzc2VkUHJvcGVydHkiLCJyZWdpc3RlciIsImhvdGtleU1hbmFnZXIiXSwic291cmNlcyI6WyJob3RrZXlNYW5hZ2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBNYW5hZ2VzIGhvdGtleXMgYmFzZWQgb24gdHdvIHNvdXJjZXM6XHJcbiAqXHJcbiAqIDEuIEdsb2JhbCBob3RrZXlzIChmcm9tIGdsb2JhbEhvdGtleVJlZ2lzdHJ5KVxyXG4gKiAyLiBIb3RrZXlzIGZyb20gdGhlIGN1cnJlbnQgZm9jdXMgdHJhaWwgKEZvY3VzTWFuYWdlci5wZG9tRm9jdXNQcm9wZXJ0eSwgYWxsIGhvdGtleXMgb24gYWxsIGlucHV0IGxpc3RlbmVycyBvZlxyXG4gKiAgICBub2RlcyBpbiB0aGUgdHJhaWwpXHJcbiAqXHJcbiAqIE1hbmFnZXMga2V5IHByZXNzIHN0YXRlIHVzaW5nIEVuZ2xpc2hLZXkgZnJvbSBnbG9iYWxLZXlTdGF0ZVRyYWNrZXIuXHJcbiAqXHJcbiAqIFRoZSBcImF2YWlsYWJsZVwiIGhvdGtleXMgYXJlIHRoZSB1bmlvbiBvZiB0aGUgYWJvdmUgdHdvIHNvdXJjZXMuXHJcbiAqXHJcbiAqIFRoZSBcImVuYWJsZWRcIiBob3RrZXlzIGFyZSB0aGUgc3Vic2V0IG9mIGF2YWlsYWJsZSBob3RrZXlzIHdob3NlIGVuYWJsZWRQcm9wZXJ0aWVzIGFyZSB0cnVlLlxyXG4gKlxyXG4gKiBUaGUgXCJhY3RpdmVcIiBob3RrZXlzIGFyZSB0aGUgc3Vic2V0IG9mIGVuYWJsZWQgaG90a2V5cyB0aGF0IGFyZSBjb25zaWRlcmVkIHByZXNzZWQuIFRoZXkgd2lsbCBoYXZlIGZpcmUtb24taG9sZFxyXG4gKiBiZWhhdmlvciBhY3RpdmUuXHJcbiAqXHJcbiAqIFRoZSBzZXQgb2YgZW5hYmxlZCBob3RrZXlzIGRldGVybWluZXMgdGhlIHNldCBvZiBtb2RpZmllciBrZXlzIHRoYXQgYXJlIGNvbnNpZGVyZWQgXCJhY3RpdmVcIiAoaW4gYWRkaXRpb24gdG9cclxuICogY3RybC9hbHQvbWV0YS9zaGlmdCwgd2hpY2ggYXJlIGFsd2F5cyBpbmNsdWRlZCkuXHJcbiAqXHJcbiAqIEBhdXRob3IgSmVzc2UgR3JlZW5iZXJnIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgRW5nbGlzaEtleSwgZXZlbnRDb2RlVG9FbmdsaXNoU3RyaW5nLCBGb2N1c01hbmFnZXIsIGdsb2JhbEhvdGtleVJlZ2lzdHJ5LCBnbG9iYWxLZXlTdGF0ZVRyYWNrZXIsIEhvdGtleSwgS2V5Ym9hcmRVdGlscywgbWV0YUVuZ2xpc2hLZXlzLCBOb2RlLCBzY2VuZXJ5IH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBEZXJpdmVkUHJvcGVydHksIHsgVW5rbm93bkRlcml2ZWRQcm9wZXJ0eSB9IGZyb20gJy4uLy4uLy4uL2F4b24vanMvRGVyaXZlZFByb3BlcnR5LmpzJztcclxuaW1wb3J0IFRQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUaW55UHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UaW55UHJvcGVydHkuanMnO1xyXG5cclxuY29uc3QgYXJyYXlDb21wYXJhdG9yID0gPEtleT4oIGE6IEtleVtdLCBiOiBLZXlbXSApOiBib29sZWFuID0+IHtcclxuICByZXR1cm4gYS5sZW5ndGggPT09IGIubGVuZ3RoICYmIGEuZXZlcnkoICggZWxlbWVudCwgaW5kZXggKSA9PiBlbGVtZW50ID09PSBiWyBpbmRleCBdICk7XHJcbn07XHJcblxyXG5jb25zdCBzZXRDb21wYXJhdG9yID0gPEtleT4oIGE6IFNldDxLZXk+LCBiOiBTZXQ8S2V5PiApID0+IHtcclxuICByZXR1cm4gYS5zaXplID09PSBiLnNpemUgJiYgWyAuLi5hIF0uZXZlcnkoIGVsZW1lbnQgPT4gYi5oYXMoIGVsZW1lbnQgKSApO1xyXG59O1xyXG5cclxuY2xhc3MgSG90a2V5TWFuYWdlciB7XHJcblxyXG4gIC8vIEFsbCBob3RrZXlzIHRoYXQgYXJlIGVpdGhlciBnbG9iYWxseSBvciB1bmRlciB0aGUgY3VycmVudCBmb2N1cyB0cmFpbC4gVGhleSBhcmUgb3JkZXJlZCwgc28gdGhhdCB0aGUgZmlyc3RcclxuICAvLyBcImlkZW50aWNhbCBrZXktc2hvcnRjdXRcIiBob3RrZXkgd2l0aCBvdmVycmlkZSB3aWxsIGJlIHRoZSBvbmUgdGhhdCBpcyBhY3RpdmUuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBhdmFpbGFibGVIb3RrZXlzUHJvcGVydHk6IFVua25vd25EZXJpdmVkUHJvcGVydHk8SG90a2V5W10+O1xyXG5cclxuICAvLyBFbmFibGVkIGhvdGtleXMgdGhhdCBhcmUgZWl0aGVyIGdsb2JhbCwgb3IgdW5kZXIgdGhlIGN1cnJlbnQgZm9jdXMgdHJhaWxcclxuICBwcml2YXRlIHJlYWRvbmx5IGVuYWJsZWRIb3RrZXlzUHJvcGVydHk6IFRQcm9wZXJ0eTxIb3RrZXlbXT4gPSBuZXcgVGlueVByb3BlcnR5KCBbXSApO1xyXG5cclxuICAvLyBUaGUgc2V0IG9mIEVuZ2xpc2hLZXlzIHRoYXQgYXJlIGN1cnJlbnRseSBwcmVzc2VkLlxyXG4gIHByaXZhdGUgZW5nbGlzaEtleXNEb3duOiBTZXQ8RW5nbGlzaEtleT4gPSBuZXcgU2V0PEVuZ2xpc2hLZXk+KCk7XHJcblxyXG4gIC8vIFRoZSBjdXJyZW50IHNldCBvZiBtb2RpZmllciBrZXlzIChwcmVzc2VkIG9yIG5vdCkgYmFzZWQgb24gY3VycmVudCBlbmFibGVkIGhvdGtleXNcclxuICAvLyBOT1RFOiBQcmVzc2VkIG1vZGlmaWVyIGtleXMgd2lsbCBwcmV2ZW50IGFueSBvdGhlciBIb3RrZXlzIGZyb20gYmVjb21pbmcgYWN0aXZlLiBGb3IgZXhhbXBsZSBpZiB5b3UgaGF2ZSBhIGhvdGtleVxyXG4gIC8vIHdpdGggJ2IreCcsIHByZXNzaW5nICdiJyB3aWxsIHByZXZlbnQgYW55IG90aGVyIGhvdGtleXMgZnJvbSBiZWNvbWluZyBhY3RpdmUuXHJcbiAgcHJpdmF0ZSBtb2RpZmllcktleXM6IEVuZ2xpc2hLZXlbXSA9IFtdO1xyXG5cclxuICAvLyBIb3RrZXlzIHRoYXQgYXJlIGFjdGl2ZWx5IHByZXNzZWRcclxuICBwcml2YXRlIHJlYWRvbmx5IGFjdGl2ZUhvdGtleXM6IFNldDxIb3RrZXk+ID0gbmV3IFNldDxIb3RrZXk+KCk7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHRoaXMuYXZhaWxhYmxlSG90a2V5c1Byb3BlcnR5ID0gbmV3IERlcml2ZWRQcm9wZXJ0eSggW1xyXG4gICAgICBnbG9iYWxIb3RrZXlSZWdpc3RyeS5ob3RrZXlzUHJvcGVydHksXHJcbiAgICAgIEZvY3VzTWFuYWdlci5wZG9tRm9jdXNQcm9wZXJ0eVxyXG4gICAgXSwgKCBnbG9iYWxIb3RrZXlzLCBmb2N1cyApID0+IHtcclxuICAgICAgY29uc3QgaG90a2V5czogSG90a2V5W10gPSBbXTtcclxuXHJcbiAgICAgIC8vIElmIHdlIGhhdmUgZm9jdXMsIGluY2x1ZGUgdGhlIGhvdGtleXMgZnJvbSB0aGUgZm9jdXMgdHJhaWxcclxuICAgICAgaWYgKCBmb2N1cyApIHtcclxuICAgICAgICBmb3IgKCBjb25zdCBub2RlIG9mIGZvY3VzLnRyYWlsLm5vZGVzLnNsaWNlKCkucmV2ZXJzZSgpICkge1xyXG4gICAgICAgICAgaWYgKCAhbm9kZS5pc0lucHV0RW5hYmxlZCgpICkge1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBub2RlLmlucHV0TGlzdGVuZXJzLmZvckVhY2goIGxpc3RlbmVyID0+IHtcclxuICAgICAgICAgICAgbGlzdGVuZXIuaG90a2V5cz8uZm9yRWFjaCggaG90a2V5ID0+IHtcclxuICAgICAgICAgICAgICBob3RrZXlzLnB1c2goIGhvdGtleSApO1xyXG4gICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICB9ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBBbHdheXMgaW5jbHVkZSBnbG9iYWwgaG90a2V5cy4gVXNlIGEgc2V0IHNpbmNlIHdlIG1pZ2h0IGhhdmUgZHVwbGljYXRlcy5cclxuICAgICAgaG90a2V5cy5wdXNoKCAuLi5nbG9iYWxIb3RrZXlzICk7XHJcblxyXG4gICAgICByZXR1cm4gXy51bmlxKCBob3RrZXlzICk7XHJcbiAgICB9LCB7XHJcbiAgICAgIC8vIFdlIHdhbnQgdG8gbm90IG92ZXItbm90aWZ5LCBzbyB3ZSBjb21wYXJlIHRoZSBzZXRzIGRpcmVjdGx5XHJcbiAgICAgIHZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5OiBhcnJheUNvbXBhcmF0b3JcclxuICAgIH0gKSBhcyBVbmtub3duRGVyaXZlZFByb3BlcnR5PEhvdGtleVtdPjtcclxuXHJcbiAgICAvLyBJZiBhbnkgb2YgdGhlIG5vZGVzIGluIHRoZSBmb2N1cyB0cmFpbCBjaGFuZ2UgaW5wdXRFbmFibGVkLCB3ZSBuZWVkIHRvIHJlY29tcHV0ZSBhdmFpbGFibGVIb3RrZXlzUHJvcGVydHlcclxuICAgIGNvbnN0IG9uSW5wdXRFbmFibGVkQ2hhbmdlZCA9ICgpID0+IHtcclxuICAgICAgdGhpcy5hdmFpbGFibGVIb3RrZXlzUHJvcGVydHkucmVjb21wdXRlRGVyaXZhdGlvbigpO1xyXG4gICAgfTtcclxuICAgIEZvY3VzTWFuYWdlci5wZG9tRm9jdXNQcm9wZXJ0eS5saW5rKCAoIGZvY3VzLCBvbGRGb2N1cyApID0+IHtcclxuICAgICAgaWYgKCBvbGRGb2N1cyApIHtcclxuICAgICAgICBvbGRGb2N1cy50cmFpbC5ub2Rlcy5mb3JFYWNoKCBub2RlID0+IHtcclxuICAgICAgICAgIG5vZGUuaW5wdXRFbmFibGVkUHJvcGVydHkudW5saW5rKCBvbklucHV0RW5hYmxlZENoYW5nZWQgKTtcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggZm9jdXMgKSB7XHJcbiAgICAgICAgZm9jdXMudHJhaWwubm9kZXMuZm9yRWFjaCggbm9kZSA9PiB7XHJcbiAgICAgICAgICBub2RlLmlucHV0RW5hYmxlZFByb3BlcnR5LmxhenlMaW5rKCBvbklucHV0RW5hYmxlZENoYW5nZWQgKTtcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBVcGRhdGUgZW5hYmxlZEhvdGtleXNQcm9wZXJ0eSB3aGVuIGF2YWlsYWJsZUhvdGtleXNQcm9wZXJ0eSAob3IgYW55IGVuYWJsZWRQcm9wZXJ0eSkgY2hhbmdlc1xyXG4gICAgY29uc3QgcmVidWlsZEhvdGtleXMgPSAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IG92ZXJyaWRkZW5Ib3RrZXlTdHJpbmdzID0gbmV3IFNldDxzdHJpbmc+KCk7XHJcbiAgICAgIGNvbnN0IGVuYWJsZWRIb3RrZXlzOiBIb3RrZXlbXSA9IFtdO1xyXG5cclxuICAgICAgZm9yICggY29uc3QgaG90a2V5IG9mIHRoaXMuYXZhaWxhYmxlSG90a2V5c1Byb3BlcnR5LnZhbHVlICkge1xyXG4gICAgICAgIGlmICggaG90a2V5LmVuYWJsZWRQcm9wZXJ0eS52YWx1ZSApIHtcclxuICAgICAgICAgIC8vIEVhY2ggaG90a2V5IHdpbGwgaGF2ZSBhIGNhbm9uaWNhbCB3YXkgdG8gcmVwcmVzZW50IGl0LCBzbyB3ZSBjYW4gY2hlY2sgZm9yIGR1cGxpY2F0ZXMgd2hlbiBvdmVycmlkZGVuLlxyXG4gICAgICAgICAgLy8gQ2F0Y2ggc2hpZnQrY3RybCtjIGFuZCBjdHJsK3NoaWZ0K2MgYXMgdGhlIHNhbWUgaG90a2V5LlxyXG4gICAgICAgICAgY29uc3QgaG90a2V5Q2Fub25pY2FsU3RyaW5nID0gW1xyXG4gICAgICAgICAgICAuLi5ob3RrZXkubW9kaWZpZXJLZXlzLnNsaWNlKCkuc29ydCgpLFxyXG4gICAgICAgICAgICBob3RrZXkua2V5XHJcbiAgICAgICAgICBdLmpvaW4oICcrJyApO1xyXG5cclxuICAgICAgICAgIGlmICggIW92ZXJyaWRkZW5Ib3RrZXlTdHJpbmdzLmhhcyggaG90a2V5Q2Fub25pY2FsU3RyaW5nICkgKSB7XHJcbiAgICAgICAgICAgIGVuYWJsZWRIb3RrZXlzLnB1c2goIGhvdGtleSApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBob3RrZXkub3ZlcnJpZGUgKSB7XHJcbiAgICAgICAgICAgICAgb3ZlcnJpZGRlbkhvdGtleVN0cmluZ3MuYWRkKCBob3RrZXlDYW5vbmljYWxTdHJpbmcgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5lbmFibGVkSG90a2V5c1Byb3BlcnR5LnZhbHVlID0gZW5hYmxlZEhvdGtleXM7XHJcbiAgICB9O1xyXG4gICAgLy8gQmVjYXVzZSB3ZSBjYW4ndCBhZGQgZHVwbGljYXRlIGxpc3RlbmVycywgd2UgY3JlYXRlIGV4dHJhIGNsb3N1cmVzIHRvIGhhdmUgYSB1bmlxdWUgaGFuZGxlIGZvciBlYWNoIGhvdGtleVxyXG4gICAgY29uc3QgaG90a2V5UmVidWlsZExpc3RlbmVyTWFwID0gbmV3IE1hcDxIb3RrZXksICgpID0+IHZvaWQ+KCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc3BhY2VkLWZ1bmNcclxuICAgIHRoaXMuYXZhaWxhYmxlSG90a2V5c1Byb3BlcnR5LmxpbmsoICggbmV3SG90a2V5cywgb2xkSG90a2V5cyApID0+IHtcclxuICAgICAgLy8gVHJhY2sgd2hldGhlciBhbnkgaG90a2V5cyBjaGFuZ2VkLiBJZiBub25lIGRpZCwgd2UgZG9uJ3QgbmVlZCB0byByZWJ1aWxkLlxyXG4gICAgICBsZXQgaG90a2V5c0NoYW5nZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgIC8vIEFueSBvbGQgaG90a2V5cyBhbmQgYXJlbid0IGluIG5ldyBob3RrZXlzIHNob3VsZCBiZSB1bmxpbmtlZFxyXG4gICAgICBpZiAoIG9sZEhvdGtleXMgKSB7XHJcbiAgICAgICAgZm9yICggY29uc3QgaG90a2V5IG9mIG9sZEhvdGtleXMgKSB7XHJcbiAgICAgICAgICBpZiAoICFuZXdIb3RrZXlzLmluY2x1ZGVzKCBob3RrZXkgKSApIHtcclxuICAgICAgICAgICAgY29uc3QgbGlzdGVuZXIgPSBob3RrZXlSZWJ1aWxkTGlzdGVuZXJNYXAuZ2V0KCBob3RrZXkgKSE7XHJcbiAgICAgICAgICAgIGhvdGtleVJlYnVpbGRMaXN0ZW5lck1hcC5kZWxldGUoIGhvdGtleSApO1xyXG4gICAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBsaXN0ZW5lciApO1xyXG5cclxuICAgICAgICAgICAgaG90a2V5LmVuYWJsZWRQcm9wZXJ0eS51bmxpbmsoIGxpc3RlbmVyICk7XHJcbiAgICAgICAgICAgIGhvdGtleXNDaGFuZ2VkID0gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEFueSBuZXcgaG90a2V5cyB0aGF0IGFyZW4ndCBpbiBvbGQgaG90a2V5cyBzaG91bGQgYmUgbGlua2VkXHJcbiAgICAgIGZvciAoIGNvbnN0IGhvdGtleSBvZiBuZXdIb3RrZXlzICkge1xyXG4gICAgICAgIGlmICggIW9sZEhvdGtleXMgfHwgIW9sZEhvdGtleXMuaW5jbHVkZXMoIGhvdGtleSApICkge1xyXG4gICAgICAgICAgLy8gVW5mb3J0dW5hdGUuIFBlcmhhcHMgaW4gdGhlIGZ1dHVyZSB3ZSBjb3VsZCBoYXZlIGFuIGFic3RyYWN0aW9uIHRoYXQgbWFrZXMgYSBcImNvdW50XCIgb2YgaG93IG1hbnkgdGltZXMgd2VcclxuICAgICAgICAgIC8vIGFyZSBcImxpc3RlbmluZ1wiIHRvIGEgUHJvcGVydHkuXHJcbiAgICAgICAgICBjb25zdCBsaXN0ZW5lciA9ICgpID0+IHJlYnVpbGRIb3RrZXlzKCk7XHJcbiAgICAgICAgICBob3RrZXlSZWJ1aWxkTGlzdGVuZXJNYXAuc2V0KCBob3RrZXksIGxpc3RlbmVyICk7XHJcblxyXG4gICAgICAgICAgaG90a2V5LmVuYWJsZWRQcm9wZXJ0eS5sYXp5TGluayggbGlzdGVuZXIgKTtcclxuICAgICAgICAgIGhvdGtleXNDaGFuZ2VkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggaG90a2V5c0NoYW5nZWQgKSB7XHJcbiAgICAgICAgcmVidWlsZEhvdGtleXMoKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIFVwZGF0ZSBtb2RpZmllcktleXMgYW5kIHdoZXRoZXIgZWFjaCBob3RrZXkgaXMgY3VycmVudGx5IHByZXNzZWQuIFRoaXMgaXMgaG93IGhvdGtleXMgY2FuIGhhdmUgdGhlaXIgc3RhdGUgY2hhbmdlXHJcbiAgICAvLyBmcm9tIGVpdGhlciB0aGVtc2VsdmVzIChvciBvdGhlciBob3RrZXlzIHdpdGggbW9kaWZpZXIga2V5cykgYmVpbmcgYWRkZWQvcmVtb3ZlZCBmcm9tIGVuYWJsZWRIb3RrZXlzLlxyXG4gICAgdGhpcy5lbmFibGVkSG90a2V5c1Byb3BlcnR5LmxpbmsoICggbmV3SG90a2V5cywgb2xkSG90a2V5cyApID0+IHtcclxuICAgICAgdGhpcy5tb2RpZmllcktleXMgPSBfLnVuaXEoIFtcclxuICAgICAgICAuLi5tZXRhRW5nbGlzaEtleXMsXHJcbiAgICAgICAgLi4uWyAuLi5uZXdIb3RrZXlzIF0uZmxhdE1hcCggaG90a2V5ID0+IGhvdGtleS5tb2RpZmllcktleXMgKVxyXG4gICAgICBdICk7XHJcblxyXG4gICAgICAvLyBSZW1vdmUgYW55IGhvdGtleXMgdGhhdCBhcmUgbm8gbG9uZ2VyIGF2YWlsYWJsZSBvciBlbmFibGVkXHJcbiAgICAgIGlmICggb2xkSG90a2V5cyApIHtcclxuICAgICAgICBmb3IgKCBjb25zdCBob3RrZXkgb2Ygb2xkSG90a2V5cyApIHtcclxuICAgICAgICAgIGlmICggIW5ld0hvdGtleXMuaW5jbHVkZXMoIGhvdGtleSApICYmIHRoaXMuYWN0aXZlSG90a2V5cy5oYXMoIGhvdGtleSApICkge1xyXG4gICAgICAgICAgICB0aGlzLnJlbW92ZUFjdGl2ZUhvdGtleSggaG90a2V5LCBudWxsLCBmYWxzZSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gUmUtY2hlY2sgYWxsIGhvdGtleXMgKHNpbmNlIG1vZGlmaWVyIGtleXMgbWlnaHQgaGF2ZSBjaGFuZ2VkLCBPUiB3ZSBuZWVkIHRvIHZhbGlkYXRlIHRoYXQgdGhlcmUgYXJlIG5vIGNvbmZsaWN0cykuXHJcbiAgICAgIHRoaXMudXBkYXRlSG90a2V5U3RhdHVzKCBudWxsICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gVHJhY2sga2V5IHN0YXRlIGNoYW5nZXNcclxuICAgIGdsb2JhbEtleVN0YXRlVHJhY2tlci5rZXlEb3duU3RhdGVDaGFuZ2VkRW1pdHRlci5hZGRMaXN0ZW5lciggKCBrZXlib2FyZEV2ZW50OiBLZXlib2FyZEV2ZW50IHwgbnVsbCApID0+IHtcclxuICAgICAgY29uc3QgZW5nbGlzaEtleXNEb3duID0gZ2xvYmFsS2V5U3RhdGVUcmFja2VyLmdldEVuZ2xpc2hLZXlzRG93bigpO1xyXG4gICAgICBjb25zdCBlbmdsaXNoS2V5c0NoYW5nZWQgPSAhc2V0Q29tcGFyYXRvciggdGhpcy5lbmdsaXNoS2V5c0Rvd24sIGVuZ2xpc2hLZXlzRG93biApO1xyXG5cclxuICAgICAgaWYgKCBlbmdsaXNoS2V5c0NoYW5nZWQgKSB7XHJcbiAgICAgICAgdGhpcy5lbmdsaXNoS2V5c0Rvd24gPSBlbmdsaXNoS2V5c0Rvd247XHJcblxyXG4gICAgICAgIHRoaXMudXBkYXRlSG90a2V5U3RhdHVzKCBrZXlib2FyZEV2ZW50ICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gTm8ga2V5cyBjaGFuZ2VkLCBnb3QgdGhlIGJyb3dzZXIvT1MgXCJmaXJlIG9uIGhvbGRcIi4gU2VlIHdoYXQgaG90a2V5cyBoYXZlIHRoZSBicm93c2VyIGZpcmUtb24taG9sZCBiZWhhdmlvci5cclxuXHJcbiAgICAgICAgLy8gSGFuZGxlIHJlLWVudHJhbmN5IChpZiBzb21ldGhpbmcgY2hhbmdlcyB0aGUgc3RhdGUgb2YgYWN0aXZlSG90a2V5cylcclxuICAgICAgICBmb3IgKCBjb25zdCBob3RrZXkgb2YgWyAuLi50aGlzLmFjdGl2ZUhvdGtleXMgXSApIHtcclxuICAgICAgICAgIGlmICggaG90a2V5LmZpcmVPbkhvbGQgJiYgaG90a2V5LmZpcmVPbkhvbGRUaW1pbmcgPT09ICdicm93c2VyJyApIHtcclxuICAgICAgICAgICAgaG90a2V5LmZpcmUoIGtleWJvYXJkRXZlbnQgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNjZW5lcnktaW50ZXJuYWwuIElmIGEgTm9kZSBhbG9uZyB0aGUgZm9jdXNlZCB0cmFpbCBjaGFuZ2VzIGl0cyBpbnB1dCBsaXN0ZW5lcnMgd2UgbmVlZCB0byBtYW51YWxseSByZWNvbXB1dGVcclxuICAgKiB0aGUgYXZhaWxhYmxlIGhvdGtleXMuIFRoZXJlIGlzIG5vIG90aGVyIHdheSBhdCB0aGlzIHRpbWUgdG8gb2JzZXJ2ZSB0aGUgaW5wdXQgbGlzdGVuZXJzIG9mIGEgTm9kZS4gT3RoZXJ3aXNlLFxyXG4gICAqIHRoZSBhdmFpbGFibGUgaG90a2V5cyB3aWxsIGJlIHJlY29tcHV0ZWQgd2hlbiBmb2N1cyBjaGFuZ2VzLCBpbnB1dEVuYWJsZWRQcm9wZXJ0eSBjaGFuZ2VzIGZvciBOb2RlcyBhbG9uZyB0aGVcclxuICAgKiB0cmFpbCwgb3Igd2hlbiBnbG9iYWwgaG90a2V5cyBjaGFuZ2UuXHJcbiAgICpcclxuICAgKiBDYWxsZWQgYnkgTm9kZS5hZGRJbnB1dExpc3RlbmVyL05vZGUucmVtb3ZlSW5wdXRMaXN0ZW5lci5cclxuICAgKlxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyB1cGRhdGVIb3RrZXlzRnJvbUlucHV0TGlzdGVuZXJDaGFuZ2UoIG5vZGU6IE5vZGUgKTogdm9pZCB7XHJcbiAgICBpZiAoIEZvY3VzTWFuYWdlci5wZG9tRm9jdXNQcm9wZXJ0eS52YWx1ZSAmJiBGb2N1c01hbmFnZXIucGRvbUZvY3VzUHJvcGVydHkudmFsdWUudHJhaWwubm9kZXMuaW5jbHVkZXMoIG5vZGUgKSApIHtcclxuICAgICAgdGhpcy5hdmFpbGFibGVIb3RrZXlzUHJvcGVydHkucmVjb21wdXRlRGVyaXZhdGlvbigpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2l2ZW4gYSBtYWluIGBrZXlgLCBzZWUgaWYgdGhlcmUgaXMgYSBob3RrZXkgdGhhdCBzaG91bGQgYmUgY29uc2lkZXJlZCBcImFjdGl2ZS9wcmVzc2VkXCIgZm9yIGl0LlxyXG4gICAqXHJcbiAgICogRm9yIGEgaG90a2V5IHRvIGJlIGNvbXBhdGlibGUsIGl0IG5lZWRzIHRvIGhhdmU6XHJcbiAgICpcclxuICAgKiAxLiBNYWluIGtleSBwcmVzc2VkXHJcbiAgICogMi4gQWxsIG1vZGlmaWVyIGtleXMgaW4gdGhlIGhvdGtleSdzIG1vZGlmaWVyS2V5cyBwcmVzc2VkXHJcbiAgICogMy4gQWxsIG1vZGlmaWVyIGtleXMgbm90IGluIHRoZSBob3RrZXkncyBtb2RpZmllcktleXMgKGJ1dCBpbiB0aGUgb3RoZXIgaG90a2V5cyBhYm92ZSkgbm90IHByZXNzZWRcclxuICAgKi9cclxuICBwcml2YXRlIGdldEhvdGtleXNGb3JNYWluS2V5KCBtYWluS2V5OiBFbmdsaXNoS2V5ICk6IEhvdGtleVtdIHtcclxuXHJcbiAgICAvLyBJZiB0aGUgbWFpbiBrZXkgaXNuJ3QgZG93biwgdGhlcmUncyBubyB3YXkgaXQgY291bGQgYmUgYWN0aXZlXHJcbiAgICBpZiAoICF0aGlzLmVuZ2xpc2hLZXlzRG93bi5oYXMoIG1haW5LZXkgKSApIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNvbXBhdGlibGVLZXlzID0gWyAuLi50aGlzLmVuYWJsZWRIb3RrZXlzUHJvcGVydHkudmFsdWUgXS5maWx0ZXIoIGhvdGtleSA9PiB7XHJcblxyXG4gICAgICAvLyBGaWx0ZXIgb3V0IGhvdGtleXMgdGhhdCBkb24ndCBoYXZlIHRoZSBtYWluIGtleVxyXG4gICAgICBpZiAoIGhvdGtleS5rZXkgIT09IG1haW5LZXkgKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBTZWUgd2hldGhlciB0aGUgbW9kaWZpZXIga2V5cyBtYXRjaFxyXG4gICAgICByZXR1cm4gdGhpcy5tb2RpZmllcktleXMuZXZlcnkoIG1vZGlmaWVyS2V5ID0+IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lbmdsaXNoS2V5c0Rvd24uaGFzKCBtb2RpZmllcktleSApID09PSBob3RrZXkua2V5cy5pbmNsdWRlcyggbW9kaWZpZXJLZXkgKSB8fFxyXG4gICAgICAgICAgICAgICBob3RrZXkuaWdub3JlZE1vZGlmaWVyS2V5cy5pbmNsdWRlcyggbW9kaWZpZXJLZXkgKTtcclxuICAgICAgfSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICBjb25zdCBjb25mbGljdGluZ0tleXMgPSBjb21wYXRpYmxlS2V5cy5maWx0ZXIoIGhvdGtleSA9PiAhaG90a2V5LmFsbG93T3ZlcmxhcCApO1xyXG5cclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggY29uZmxpY3RpbmdLZXlzLmxlbmd0aCA8IDIsIGBLZXkgY29uZmxpY3QgZGV0ZWN0ZWQ6ICR7Y29uZmxpY3RpbmdLZXlzLm1hcCggaG90a2V5ID0+IGhvdGtleS5nZXRIb3RrZXlTdHJpbmcoKSApfWAgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY29tcGF0aWJsZUtleXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZS1jaGVjayBhbGwgaG90a2V5IGFjdGl2ZS9wcmVzc2VkIHN0YXRlcyAoc2luY2UgbW9kaWZpZXIga2V5cyBtaWdodCBoYXZlIGNoYW5nZWQsIE9SIHdlIG5lZWQgdG8gdmFsaWRhdGUgdGhhdFxyXG4gICAqIHRoZXJlIGFyZSBubyBjb25mbGljdHMpLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgdXBkYXRlSG90a2V5U3RhdHVzKCBrZXlib2FyZEV2ZW50OiBLZXlib2FyZEV2ZW50IHwgbnVsbCApOiB2b2lkIHtcclxuXHJcbiAgICAvLyBGb3IgZmlyZU9uRG93biBvbi9vZmYgY2FzZXMsIHdlIG9ubHkgd2FudCB0byBmaXJlIHRoZSBob3RrZXlzIHdoZW4gd2UgaGF2ZSBhIGtleWJvYXJkIGV2ZW50IHNwZWNpZnlpbmcgaG90a2V5J3NcclxuICAgIC8vIG1haW4gYGtleWAuXHJcbiAgICBjb25zdCBwcmVzc2VkT3JSZWxlYXNlZEtleUNvZGUgPSBLZXlib2FyZFV0aWxzLmdldEV2ZW50Q29kZSgga2V5Ym9hcmRFdmVudCApO1xyXG4gICAgY29uc3QgcHJlc3NlZE9yUmVsZWFzZWRFbmdsaXNoS2V5ID0gcHJlc3NlZE9yUmVsZWFzZWRLZXlDb2RlID8gZXZlbnRDb2RlVG9FbmdsaXNoU3RyaW5nKCBwcmVzc2VkT3JSZWxlYXNlZEtleUNvZGUgKSA6IG51bGw7XHJcblxyXG4gICAgZm9yICggY29uc3QgaG90a2V5IG9mIHRoaXMuZW5hYmxlZEhvdGtleXNQcm9wZXJ0eS52YWx1ZSApIHtcclxuXHJcbiAgICAgIC8vIEEgaG90a2V5IHNob3VsZCBiZSAgYWN0aXZlIGlmIGl0cyBtYWluIGtleSBpcyBwcmVzc2VkLiBJZiBpdCB3YXMgaW50ZXJydXB0ZWQsIGl0IGNhbiBvbmx5IGJlY29tZVxyXG4gICAgICAvLyBhY3RpdmUgYWdhaW4gaWYgdGhlcmUgd2FzIGFuIGFjdHVhbCBrZXkgcHJlc3MgZXZlbnQgZnJvbSB0aGUgdXNlci4gSWYgYSBIb3RrZXkgaXMgaW50ZXJydXB0ZWQgZHVyaW5nXHJcbiAgICAgIC8vIGEgcHJlc3MsIGl0IHNob3VsZCByZW1haW4gaW5hY3RpdmUgYW5kIGludGVycnVwdGVkIHVudGlsIHRoZSBORVhUIHByZXNzLlxyXG4gICAgICBjb25zdCBrZXlQcmVzc2VkID0gdGhpcy5nZXRIb3RrZXlzRm9yTWFpbktleSggaG90a2V5LmtleSApLmluY2x1ZGVzKCBob3RrZXkgKTtcclxuICAgICAgY29uc3Qgbm90SW50ZXJydXB0ZWQgPSAhaG90a2V5LmludGVycnVwdGVkIHx8ICgga2V5Ym9hcmRFdmVudCAmJiBrZXlib2FyZEV2ZW50LnR5cGUgPT09ICdrZXlkb3duJyApO1xyXG4gICAgICBjb25zdCBzaG91bGRCZUFjdGl2ZSA9IGtleVByZXNzZWQgJiYgbm90SW50ZXJydXB0ZWQ7XHJcblxyXG4gICAgICBjb25zdCBpc0FjdGl2ZSA9IHRoaXMuYWN0aXZlSG90a2V5cy5oYXMoIGhvdGtleSApO1xyXG5cclxuICAgICAgaWYgKCBzaG91bGRCZUFjdGl2ZSAmJiAhaXNBY3RpdmUgKSB7XHJcbiAgICAgICAgdGhpcy5hZGRBY3RpdmVIb3RrZXkoIGhvdGtleSwga2V5Ym9hcmRFdmVudCwgaG90a2V5LmtleSA9PT0gcHJlc3NlZE9yUmVsZWFzZWRFbmdsaXNoS2V5ICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoICFzaG91bGRCZUFjdGl2ZSAmJiBpc0FjdGl2ZSApIHtcclxuICAgICAgICB0aGlzLnJlbW92ZUFjdGl2ZUhvdGtleSggaG90a2V5LCBrZXlib2FyZEV2ZW50LCBob3RrZXkua2V5ID09PSBwcmVzc2VkT3JSZWxlYXNlZEVuZ2xpc2hLZXkgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSG90a2V5IG1hZGUgYWN0aXZlL3ByZXNzZWRcclxuICAgKi9cclxuICBwcml2YXRlIGFkZEFjdGl2ZUhvdGtleSggaG90a2V5OiBIb3RrZXksIGtleWJvYXJkRXZlbnQ6IEtleWJvYXJkRXZlbnQgfCBudWxsLCB0cmlnZ2VyZWRGcm9tUHJlc3M6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICB0aGlzLmFjdGl2ZUhvdGtleXMuYWRkKCBob3RrZXkgKTtcclxuXHJcbiAgICBjb25zdCBzaG91bGRGaXJlID0gdHJpZ2dlcmVkRnJvbVByZXNzICYmIGhvdGtleS5maXJlT25Eb3duO1xyXG4gICAgaG90a2V5Lm9uUHJlc3MoIGtleWJvYXJkRXZlbnQsIHNob3VsZEZpcmUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhvdGtleSBtYWRlIGluYWN0aXZlL3JlbGVhc2VkLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgcmVtb3ZlQWN0aXZlSG90a2V5KCBob3RrZXk6IEhvdGtleSwga2V5Ym9hcmRFdmVudDogS2V5Ym9hcmRFdmVudCB8IG51bGwsIHRyaWdnZXJlZEZyb21SZWxlYXNlOiBib29sZWFuICk6IHZvaWQge1xyXG5cclxuICAgIC8vIFJlbW92ZSBmcm9tIGFjdGl2ZUhvdGtleXMgYmVmb3JlIEhvdGtleS5vblJlbGVhc2Ugc28gdGhhdCB3ZSBkbyBub3QgdHJ5IHRvIHJlbW92ZSBpdCBhZ2FpbiBpZiB0aGVyZSBpc1xyXG4gICAgLy8gcmUtZW50cmFuY3kuIFRoaXMgaXMgcG9zc2libGUgaWYgdGhlIHJlbGVhc2UgbGlzdGVuZXIgbW92ZXMgZm9jdXMgb3IgaW50ZXJydXB0cyBhIEhvdGtleS5cclxuICAgIHRoaXMuYWN0aXZlSG90a2V5cy5kZWxldGUoIGhvdGtleSApO1xyXG5cclxuICAgIGNvbnN0IHNob3VsZEZpcmUgPSB0cmlnZ2VyZWRGcm9tUmVsZWFzZSAmJiAhaG90a2V5LmZpcmVPbkRvd247XHJcbiAgICBjb25zdCBpbnRlcnJ1cHRlZCA9ICF0cmlnZ2VyZWRGcm9tUmVsZWFzZTtcclxuICAgIGhvdGtleS5vblJlbGVhc2UoIGtleWJvYXJkRXZlbnQsIGludGVycnVwdGVkLCBzaG91bGRGaXJlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgYnkgSG90a2V5LCByZW1vdmVzIHRoZSBIb3RrZXkgZnJvbSB0aGUgYWN0aXZlIHNldCB3aGVuIGl0IGlzIGludGVycnVwdGVkLiBUaGUgSG90a2V5IGNhbm5vdCBiZSBhY3RpdmVcclxuICAgKiBhZ2FpbiBpbiB0aGlzIG1hbmFnZXIgdW50aWwgdGhlcmUgaXMgYW4gYWN0dWFsIGtleSBwcmVzcyBldmVudCBmcm9tIHRoZSB1c2VyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbnRlcnJ1cHRIb3RrZXkoIGhvdGtleTogSG90a2V5ICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaG90a2V5LmlzUHJlc3NlZFByb3BlcnR5LnZhbHVlLCAnaG90a2V5IG11c3QgYmUgcHJlc3NlZCB0byBiZSBpbnRlcnJ1cHRlZCcgKTtcclxuICAgIHRoaXMucmVtb3ZlQWN0aXZlSG90a2V5KCBob3RrZXksIG51bGwsIGZhbHNlICk7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnSG90a2V5TWFuYWdlcicsIEhvdGtleU1hbmFnZXIgKTtcclxuXHJcbmNvbnN0IGhvdGtleU1hbmFnZXIgPSBuZXcgSG90a2V5TWFuYWdlcigpO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgaG90a2V5TWFuYWdlcjsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFNBQXFCQSx3QkFBd0IsRUFBRUMsWUFBWSxFQUFFQyxvQkFBb0IsRUFBRUMscUJBQXFCLEVBQVVDLGFBQWEsRUFBRUMsZUFBZSxFQUFRQyxPQUFPLFFBQVEsZUFBZTtBQUN0TCxPQUFPQyxlQUFlLE1BQWtDLHFDQUFxQztBQUU3RixPQUFPQyxZQUFZLE1BQU0sa0NBQWtDO0FBRTNELE1BQU1DLGVBQWUsR0FBR0EsQ0FBT0MsQ0FBUSxFQUFFQyxDQUFRLEtBQWU7RUFDOUQsT0FBT0QsQ0FBQyxDQUFDRSxNQUFNLEtBQUtELENBQUMsQ0FBQ0MsTUFBTSxJQUFJRixDQUFDLENBQUNHLEtBQUssQ0FBRSxDQUFFQyxPQUFPLEVBQUVDLEtBQUssS0FBTUQsT0FBTyxLQUFLSCxDQUFDLENBQUVJLEtBQUssQ0FBRyxD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