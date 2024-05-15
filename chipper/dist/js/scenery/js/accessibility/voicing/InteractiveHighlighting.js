// Copyright 2021-2024, University of Colorado Boulder

/**
 * A trait for Node that mixes functionality to support visual highlights that appear on hover with a pointer.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import TinyEmitter from '../../../../axon/js/TinyEmitter.js';
import { DelayedMutate, Focus, Node, scenery } from '../../imports.js';
import memoize from '../../../../phet-core/js/memoize.js';
import TinyProperty from '../../../../axon/js/TinyProperty.js';

// constants
// option keys for InteractiveHighlighting, each of these will have a setter and getter and values are applied with mutate()
const INTERACTIVE_HIGHLIGHTING_OPTIONS = ['interactiveHighlight', 'interactiveHighlightLayerable', 'interactiveHighlightEnabled'];
const InteractiveHighlighting = memoize(Type => {
  // @ts-expect-error
  assert && assert(!Type._mixesInteractiveHighlighting, 'InteractiveHighlighting is already added to this Type');
  const InteractiveHighlightingClass = DelayedMutate('InteractiveHighlightingClass', INTERACTIVE_HIGHLIGHTING_OPTIONS, class InteractiveHighlightingClass extends Type {
    // Input listener to activate the HighlightOverlay upon pointer input. Uses exit and enter instead of over and out
    // because we do not want this to fire from bubbling. The highlight should be around this Node when it receives
    // input.

    // A reference to the Pointer so that we can add and remove listeners from it when necessary.
    // Since this is on the trait, only one pointer can have a listener for this Node that uses InteractiveHighlighting
    // at one time.
    _pointer = null;

    // A map that collects all of the Displays that this InteractiveHighlighting Node is
    // attached to, mapping the unique ID of the Instance Trail to the Display. We need a reference to the
    // Displays to activate the Focus Property associated with highlighting, and to add/remove listeners when
    // features that require highlighting are enabled/disabled. Note that this is updated asynchronously
    // (with updateDisplay) since Instances are added asynchronously.
    // @mixin-protected - made public for use in the mixin only
    displays = {};

    // The highlight that will surround this Node when it is activated and a Pointer is currently over it. When
    // null, the focus highlight will be used (as defined in ParallelDOM.js).
    _interactiveHighlight = null;

    // If true, the highlight will be layerable in the scene graph instead of drawn
    // above everything in the HighlightOverlay. If true, you are responsible for adding the interactiveHighlight
    // in the location you want in the scene graph. The interactiveHighlight will become visible when
    // this.isInteractiveHighlightActiveProperty is true.
    _interactiveHighlightLayerable = false;

    // If true, the highlight will be displayed on activation input. If false, it will not and we can remove listeners
    // that would do this work.
    _interactiveHighlightEnabled = true;

    // Emits an event when the interactive highlight changes for this Node
    interactiveHighlightChangedEmitter = new TinyEmitter();

    // This Property will be true when this node has highlights activated on it. See isInteractiveHighlightActivated().

    _isInteractiveHighlightActiveProperty = new TinyProperty(false);

    // When new instances of this Node are created, adds an entry to the map of Displays.

    // Listener that adds/removes other listeners that activate highlights when
    // the feature becomes enabled/disabled so that we don't do extra work related to highlighting unless
    // it is necessary.

    // A listener that is added to the FocusManager.lockedPointerFocusProperty to clear this._pointer and its listeners from
    // this instance when the lockedPointerFocusProperty is set to null externally (not by InteractiveHighlighting).

    // Input listener that locks the HighlightOverlay so that there are no updates to the highlight
    // while the pointer is down over something that uses InteractiveHighlighting.

    constructor(...args) {
      super(...args);
      this._activationListener = {
        enter: this._onPointerEntered.bind(this),
        over: this._onPointerOver.bind(this),
        move: this._onPointerMove.bind(this),
        exit: this._onPointerExited.bind(this),
        down: this._onPointerDown.bind(this)
      };
      this._changedInstanceListener = this.onChangedInstance.bind(this);

      // This is potentially dangerous to listen to generally, but in this case it is safe because the state we change
      // will only affect a separate display's state, not this one.
      this.changedInstanceEmitter.addListener(this._changedInstanceListener);
      this._interactiveHighlightingEnabledListener = this._onInteractiveHighlightingEnabledChange.bind(this);
      this._boundPointerFocusClearedListener = this.handleLockedPointerFocusCleared.bind(this);
      const boundPointerReleaseListener = this._onPointerRelease.bind(this);
      const boundPointerCancel = this._onPointerCancel.bind(this);
      this._pointerListener = {
        up: boundPointerReleaseListener,
        cancel: boundPointerCancel,
        interrupt: boundPointerCancel
      };
      this.isInteractiveHighlightActiveProperty = this._isInteractiveHighlightActiveProperty;
    }

    /**
     * Whether a Node composes InteractiveHighlighting.
     */
    get isInteractiveHighlighting() {
      return true;
    }
    static get _mixesInteractiveHighlighting() {
      return true;
    }

    /**
     * Set the interactive highlight for this node. By default, the highlight will be a pink rectangle that surrounds
     * the node's local bounds.
     */
    setInteractiveHighlight(interactiveHighlight) {
      if (this._interactiveHighlight !== interactiveHighlight) {
        this._interactiveHighlight = interactiveHighlight;
        if (this._interactiveHighlightLayerable) {
          // if focus highlight is layerable, it must be a node for the scene graph
          assert && assert(interactiveHighlight instanceof Node); // eslint-disable-line no-simple-type-checking-assertions

          // make sure the highlight is invisible, the HighlightOverlay will manage visibility
          interactiveHighlight.visible = false;
        }
        this.interactiveHighlightChangedEmitter.emit();
      }
    }
    set interactiveHighlight(interactiveHighlight) {
      this.setInteractiveHighlight(interactiveHighlight);
    }
    get interactiveHighlight() {
      return this.getInteractiveHighlight();
    }

    /**
     * Returns the interactive highlight for this Node.
     */
    getInteractiveHighlight() {
      return this._interactiveHighlight;
    }

    /**
     * Sets whether the highlight is layerable in the scene graph instead of above everything in the
     * highlight overlay. If layerable, you must provide a custom highlight and it must be a Node. The highlight
     * Node will always be invisible unless this Node is activated with a pointer.
     */
    setInteractiveHighlightLayerable(interactiveHighlightLayerable) {
      if (this._interactiveHighlightLayerable !== interactiveHighlightLayerable) {
        this._interactiveHighlightLayerable = interactiveHighlightLayerable;
        if (this._interactiveHighlight) {
          assert && assert(this._interactiveHighlight instanceof Node);
          this._interactiveHighlight.visible = false;
          this.interactiveHighlightChangedEmitter.emit();
        }
      }
    }
    set interactiveHighlightLayerable(interactiveHighlightLayerable) {
      this.setInteractiveHighlightLayerable(interactiveHighlightLayerable);
    }
    get interactiveHighlightLayerable() {
      return this.getInteractiveHighlightLayerable();
    }

    /**
     * Get whether the interactive highlight is layerable in the scene graph.
     */
    getInteractiveHighlightLayerable() {
      return this._interactiveHighlightLayerable;
    }

    /**
     * Set the enabled state of Interactive Highlights on this Node. When false, highlights will not activate
     * on this Node with mouse and touch input. You can also disable Interactive Highlights by making the node
     * pickable: false. Use this when you want to disable Interactive Highlights without modifying pickability.
     */
    setInteractiveHighlightEnabled(enabled) {
      this._interactiveHighlightEnabled = enabled;

      // Each display has its own focusManager.pointerHighlightsVisibleProperty, so we need to go through all of them
      // and update after this enabled change
      const trailIds = Object.keys(this.displays);
      for (let i = 0; i < trailIds.length; i++) {
        const display = this.displays[trailIds[i]];
        this._interactiveHighlightingEnabledListener(display.focusManager.pointerHighlightsVisibleProperty.value);
      }
    }

    /**
     * Are Interactive Highlights enabled for this Node? When false, no highlights activate from mouse and touch.
     */
    getInteractiveHighlightEnabled() {
      return this._interactiveHighlightEnabled;
    }
    set interactiveHighlightEnabled(enabled) {
      this.setInteractiveHighlightEnabled(enabled);
    }
    get interactiveHighlightEnabled() {
      return this.getInteractiveHighlightEnabled();
    }

    /**
     * Returns true if this Node is "activated" by a pointer, indicating that a Pointer is over it
     * and this Node mixes InteractiveHighlighting so an interactive highlight should surround it.
     *
     * This algorithm depends on the direct focus over the pointer, the "locked" focus (from an attached listener),
     * and if pointer highlights are visible at all.
     *
     * If you come to desire this private function, instead you should use isInteractiveHighlightActiveProperty.
     *
     */
    isInteractiveHighlightActivated() {
      let activated = false;
      const trailIds = Object.keys(this.displays);
      for (let i = 0; i < trailIds.length; i++) {
        const display = this.displays[trailIds[i]];

        // Only if the interactive highlights feature is enabled can we be active
        if (display.focusManager.pointerHighlightsVisibleProperty.value) {
          const pointerFocus = display.focusManager.pointerFocusProperty.value;
          const lockedPointerFocus = display.focusManager.lockedPointerFocusProperty.value;
          if (lockedPointerFocus) {
            if (lockedPointerFocus?.trail.lastNode() === this) {
              activated = true;
              break;
            }
          } else if (pointerFocus?.trail.lastNode() === this) {
            activated = true;
            break;
          }
        }
      }
      return activated;
    }
    handleHighlightActiveChange() {
      // The performance of this is OK at the time of this writing. It depends greatly on how often this function is
      // called, since recalculation involves looping through all instances' displays, but since recalculation only
      // occurs from FocusManager's Property updates (and not on every pointer operation), this is acceptable.
      this._isInteractiveHighlightActiveProperty.value = this.isInteractiveHighlightActivated();
    }
    dispose() {
      this.changedInstanceEmitter.removeListener(this._changedInstanceListener);

      // remove the activation listener if it is currently attached
      if (this.hasInputListener(this._activationListener)) {
        this.removeInputListener(this._activationListener);
      }
      if (this._pointer) {
        this._pointer.removeInputListener(this._pointerListener);
        this._pointer = null;
      }

      // remove listeners on displays and remove Displays from the map
      const trailIds = Object.keys(this.displays);
      for (let i = 0; i < trailIds.length; i++) {
        const display = this.displays[trailIds[i]];
        this.onDisplayRemoved(display);
        delete this.displays[trailIds[i]];
      }
      super.dispose && super.dispose();
    }

    /**
     * When the pointer goes 'over' a node (not including children), look for a group focus highlight to
     * activate. This is most useful for InteractiveHighlighting Nodes that act as a "group" container
     * for other nodes. When the pointer leaves a child, we get the 'exited' event on the child, immediately
     * followed by an 'over' event on the parent. This keeps the group highlight visible without any flickering.
     * The group parent must be composed with InteractiveHighlighting so that it has these event listeners.
     */
    _onPointerOver(event) {
      // If there is an ancestor that is a group focus highlight that is composed with InteractiveHighlight (
      // (should activate with pointer input)...
      const groupHighlightNode = event.trail.nodes.find(node => node.groupFocusHighlight && node.isInteractiveHighlighting);
      if (groupHighlightNode) {
        // trail to the group highlight Node
        const rootToGroupNode = event.trail.subtrailTo(groupHighlightNode);
        const displays = Object.values(this.displays);
        for (let i = 0; i < displays.length; i++) {
          const display = displays[i];

          // only set focus if current Pointer focus is not defined (from a more descendant Node)
          if (display.focusManager.pointerFocusProperty.value === null) {
            display.focusManager.pointerFocusProperty.set(new Focus(display, rootToGroupNode));
          }
        }
      }
    }

    /**
     * When a Pointer enters this Node, signal to the Displays that the pointer is over this Node so that the
     * HighlightOverlay can be activated.
     *
     * This is most likely how most pointerFocusProperty is set. First we get an `enter` event then we may get
     * a down event or move event which could do further updates on the event Pointer or FocusManager.
     */
    _onPointerEntered(event) {
      let lockPointer = false;
      const displays = Object.values(this.displays);
      for (let i = 0; i < displays.length; i++) {
        const display = displays[i];
        if (display.focusManager.pointerFocusProperty.value === null || !event.trail.equals(display.focusManager.pointerFocusProperty.value.trail)) {
          const newFocus = new Focus(display, event.trail);
          display.focusManager.pointerFocusProperty.set(newFocus);
          if (display.focusManager.lockedPointerFocusProperty.value === null && event.pointer.attachedListener) {
            this.lockHighlight(newFocus, display.focusManager);
            lockPointer = true;
          }
        }
      }
      if (lockPointer) {
        this.savePointer(event.pointer);
      }
    }

    /**
     * Update highlights when the Pointer moves over this Node. In general, highlights will activate on 'enter'. But
     * in cases where multiple Nodes in a Trail support InteractiveHighlighting this listener can move focus
     * to the most reasonable target (the closest ancestor or descendent that is composed with InteractiveHighlighting).
     */
    _onPointerMove(event) {
      let lockPointer = false;
      const displays = Object.values(this.displays);
      for (let i = 0; i < displays.length; i++) {
        const display = displays[i];

        // the SceneryEvent might have gone through a descendant of this Node
        const rootToSelf = event.trail.subtrailTo(this);

        // only do more work on move if the event indicates that pointer focus might have changed.
        if (display.focusManager.pointerFocusProperty.value === null || !rootToSelf.equals(display.focusManager.pointerFocusProperty.value.trail)) {
          if (!this.getDescendantsUseHighlighting(event.trail)) {
            const newFocus = new Focus(display, rootToSelf);
            display.focusManager.pointerFocusProperty.set(newFocus);
            if (display.focusManager.lockedPointerFocusProperty.value === null && event.pointer.attachedListener) {
              this.lockHighlight(newFocus, display.focusManager);
              lockPointer = true;
            }
          }
        }
      }
      if (lockPointer) {
        this.savePointer(event.pointer);
      }
    }

    /**
     * When a pointer exits this Node or its children, signal to the Displays that pointer focus has changed to
     * deactivate the HighlightOverlay. This can also fire when visibility/pickability of the Node changes.
     */
    _onPointerExited(event) {
      const displays = Object.values(this.displays);
      for (let i = 0; i < displays.length; i++) {
        const display = displays[i];
        display.focusManager.pointerFocusProperty.set(null);

        // An exit event may come from a Node along the trail becoming invisible or unpickable. In that case unlock
        // focus and remove pointer listeners so that highlights can continue to update from new input.
        const lockedPointerFocus = display.focusManager.lockedPointerFocusProperty.value;
        if (!event.trail.isPickable() && (lockedPointerFocus === null ||
        // We do not want to remove the lockedPointerFocus if this event trail has nothing
        // to do with the node that is receiving a locked focus.
        event.trail.containsNode(lockedPointerFocus.trail.lastNode()))) {
          // unlock and remove pointer listeners
          this._onPointerRelease(event);
        }
      }
    }

    /**
     * When a pointer goes down on this Node, signal to the Displays that the pointerFocus is locked. On the down
     * event, the pointerFocusProperty will have been set first from the `enter` event.
     */
    _onPointerDown(event) {
      if (this._pointer === null) {
        let lockPointer = false;
        const displays = Object.values(this.displays);
        for (let i = 0; i < displays.length; i++) {
          const display = displays[i];
          const focus = display.focusManager.pointerFocusProperty.value;
          const locked = !!display.focusManager.lockedPointerFocusProperty.value;

          // Focus should generally be defined when pointer enters the Node, but it may be null in cases of
          // cancel or interrupt. Don't attempt to lock if the FocusManager already has a locked highlight (especially
          // important for gracefully handling multitouch).
          if (focus && !locked) {
            assert && assert(!focus.trail.lastNode().isDisposed, 'Focus should not be set to a disposed Node');

            // Set the lockedPointerFocusProperty with a copy of the Focus (as deep as possible) because we want
            // to keep a reference to the old Trail while pointerFocusProperty changes.
            this.lockHighlight(focus, display.focusManager);
            lockPointer = true;
          }
        }
        if (lockPointer) {
          this.savePointer(event.pointer);
        }
      }
    }
    onDisplayAdded(display) {
      // Listener may already by on the display in cases of DAG, only add if this is the first instance of this Node
      if (!display.focusManager.pointerHighlightsVisibleProperty.hasListener(this._interactiveHighlightingEnabledListener)) {
        display.focusManager.pointerHighlightsVisibleProperty.link(this._interactiveHighlightingEnabledListener);
      }
    }
    onDisplayRemoved(display) {
      // Pointer focus was locked due to interaction with this listener, but unlocked because of other
      // scenery-internal listeners. But the Property still has this listener so it needs to be removed now.
      if (display.focusManager.lockedPointerFocusProperty.hasListener(this._boundPointerFocusClearedListener)) {
        display.focusManager.lockedPointerFocusProperty.unlink(this._boundPointerFocusClearedListener);
      }
      display.focusManager.pointerHighlightsVisibleProperty.unlink(this._interactiveHighlightingEnabledListener);
    }

    /**
     * When a Pointer goes up after going down on this Node, signal to the Displays that the pointerFocusProperty no
     * longer needs to be locked.
     *
     * @param [event] - may be called during interrupt or cancel, in which case there is no event
     */
    _onPointerRelease(event) {
      const displays = Object.values(this.displays);
      for (let i = 0; i < displays.length; i++) {
        const display = displays[i];
        display.focusManager.lockedPointerFocusProperty.value = null;

        // Unlink the listener that was watching for the lockedPointerFocusProperty to be cleared externally
        if (display.focusManager.lockedPointerFocusProperty.hasListener(this._boundPointerFocusClearedListener)) {
          display.focusManager.lockedPointerFocusProperty.unlink(this._boundPointerFocusClearedListener);
        }
      }
      if (this._pointer && this._pointer.listeners.includes(this._pointerListener)) {
        this._pointer.removeInputListener(this._pointerListener);
        this._pointer = null;
      }
    }

    /**
     * If the pointer listener is cancelled or interrupted, clear focus and remove input listeners.
     */
    _onPointerCancel(event) {
      const displays = Object.values(this.displays);
      for (let i = 0; i < displays.length; i++) {
        const display = displays[i];
        display.focusManager.pointerFocusProperty.set(null);
      }

      // unlock and remove pointer listeners
      this._onPointerRelease(event);
    }

    /**
     * Save the Pointer and add a listener to it to remove highlights when a pointer is released/cancelled.
     */
    savePointer(eventPointer) {
      assert && assert(this._pointer === null, 'It should be impossible to already have a Pointer before locking from touchSnag');
      this._pointer = eventPointer;
      this._pointer.addInputListener(this._pointerListener);
    }

    /**
     * Sets the "locked" focus for Interactive Highlighting. The "locking" makes sure that the highlight remains
     * active on the Node that is receiving interaction even when the pointer has move away from the Node
     * (but presumably is still down somewhere else on the screen).
     */
    lockHighlight(newFocus, focusManager) {
      assert && assert(this._pointer === null, 'It should be impossible to already have a Pointer before locking from touchSnag');

      // A COPY of the focus is saved to the Property because we need the value of the Trail at this event.
      focusManager.lockedPointerFocusProperty.set(new Focus(newFocus.display, newFocus.trail.copy()));

      // Attach a listener that will clear the pointer and its listener if the lockedPointerFocusProperty is cleared
      // externally (not by InteractiveHighlighting).
      assert && assert(!focusManager.lockedPointerFocusProperty.hasListener(this._boundPointerFocusClearedListener), 'this listener still on the lockedPointerFocusProperty indicates a memory leak');
      focusManager.lockedPointerFocusProperty.link(this._boundPointerFocusClearedListener);
    }

    /**
     * FocusManager.lockedPointerFocusProperty does not belong to InteractiveHighlighting and can be cleared
     * for any reason. If it is set to null while a pointer is down we need to release the Pointer and remove input
     * listeners.
     */
    handleLockedPointerFocusCleared(lockedPointerFocus) {
      if (lockedPointerFocus === null) {
        this._onPointerRelease();
      }
    }

    /**
     * Add or remove listeners related to activating interactive highlighting when the feature becomes enabled.
     * Work related to interactive highlighting is avoided unless the feature is enabled.
     */
    _onInteractiveHighlightingEnabledChange(featureEnabled) {
      // Only listen to the activation listener if the feature is enabled and highlighting is enabled for this Node.
      const enabled = featureEnabled && this._interactiveHighlightEnabled;
      const hasActivationListener = this.hasInputListener(this._activationListener);
      if (enabled && !hasActivationListener) {
        this.addInputListener(this._activationListener);
      } else if (!enabled && hasActivationListener) {
        this.removeInputListener(this._activationListener);
      }

      // If now displayed, then we should recompute if we are active or not.
      this.handleHighlightActiveChange();
    }

    /**
     * Add the Display to the collection when this Node is added to a scene graph. Also adds listeners to the
     * Display that turns on highlighting when the feature is enabled.
     */
    onChangedInstance(instance, added) {
      assert && assert(instance.trail, 'should have a trail');
      assert && assert(instance.display, 'should have a display');
      const uniqueId = instance.trail.uniqueId;
      if (added) {
        const display = instance.display; // eslint-disable-line @typescript-eslint/non-nullable-type-assertion-style
        this.displays[uniqueId] = display;
        this.onDisplayAdded(display);
      } else {
        assert && assert(instance.node, 'should have a node');
        const display = this.displays[uniqueId];
        assert && assert(display, `interactive highlighting does not have a Display for removed instance: ${uniqueId}`);

        // If the node was disposed, this display reference has already been cleaned up, but instances are updated
        // (disposed) on the next frame after the node was disposed. Only unlink if there are no more instances of
        // this node;
        instance.node.instances.length === 0 && this.onDisplayRemoved(display);
        delete this.displays[uniqueId];
      }
    }

    /**
     * Returns true if any nodes from this Node to the leaf of the Trail use Voicing features in some way. In
     * general, we do not want to activate voicing features in this case because the leaf-most Nodes in the Trail
     * should be activated instead.
     * @mixin-protected - made public for use in the mixin only
     */
    getDescendantsUseHighlighting(trail) {
      const indexOfSelf = trail.nodes.indexOf(this);

      // all the way to length, end not included in slice - and if start value is greater than index range
      // an empty array is returned
      const childToLeafNodes = trail.nodes.slice(indexOfSelf + 1, trail.nodes.length);

      // if any of the nodes from leaf to self use InteractiveHighlighting, they should receive input, and we shouldn't
      // speak the content for this Node
      let descendantsUseVoicing = false;
      for (let i = 0; i < childToLeafNodes.length; i++) {
        if (childToLeafNodes[i].isInteractiveHighlighting) {
          descendantsUseVoicing = true;
          break;
        }
      }
      return descendantsUseVoicing;
    }
    mutate(options) {
      return super.mutate(options);
    }
  });

  /**
   * {Array.<string>} - String keys for all the allowed options that will be set by Node.mutate( options ), in
   * the order they will be evaluated.
   *
   * NOTE: See Node's _mutatorKeys documentation for more information on how this operates, and potential special
   *       cases that may apply.
   */
  InteractiveHighlightingClass.prototype._mutatorKeys = INTERACTIVE_HIGHLIGHTING_OPTIONS.concat(InteractiveHighlightingClass.prototype._mutatorKeys);
  assert && assert(InteractiveHighlightingClass.prototype._mutatorKeys.length === _.uniq(InteractiveHighlightingClass.prototype._mutatorKeys).length, 'duplicate mutator keys in InteractiveHighlighting');
  return InteractiveHighlightingClass;
});
scenery.register('InteractiveHighlighting', InteractiveHighlighting);
export default InteractiveHighlighting;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUaW55RW1pdHRlciIsIkRlbGF5ZWRNdXRhdGUiLCJGb2N1cyIsIk5vZGUiLCJzY2VuZXJ5IiwibWVtb2l6ZSIsIlRpbnlQcm9wZXJ0eSIsIklOVEVSQUNUSVZFX0hJR0hMSUdIVElOR19PUFRJT05TIiwiSW50ZXJhY3RpdmVIaWdobGlnaHRpbmciLCJUeXBlIiwiYXNzZXJ0IiwiX21peGVzSW50ZXJhY3RpdmVIaWdobGlnaHRpbmciLCJJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZ0NsYXNzIiwiX3BvaW50ZXIiLCJkaXNwbGF5cyIsIl9pbnRlcmFjdGl2ZUhpZ2hsaWdodCIsIl9pbnRlcmFjdGl2ZUhpZ2hsaWdodExheWVyYWJsZSIsIl9pbnRlcmFjdGl2ZUhpZ2hsaWdodEVuYWJsZWQiLCJpbnRlcmFjdGl2ZUhpZ2hsaWdodENoYW5nZWRFbWl0dGVyIiwiX2lzSW50ZXJhY3RpdmVIaWdobGlnaHRBY3RpdmVQcm9wZXJ0eSIsImNvbnN0cnVjdG9yIiwiYXJncyIsIl9hY3RpdmF0aW9uTGlzdGVuZXIiLCJlbnRlciIsIl9vblBvaW50ZXJFbnRlcmVkIiwiYmluZCIsIm92ZXIiLCJfb25Qb2ludGVyT3ZlciIsIm1vdmUiLCJfb25Qb2ludGVyTW92ZSIsImV4aXQiLCJfb25Qb2ludGVyRXhpdGVkIiwiZG93biIsIl9vblBvaW50ZXJEb3duIiwiX2NoYW5nZWRJbnN0YW5jZUxpc3RlbmVyIiwib25DaGFuZ2VkSW5zdGFuY2UiLCJjaGFuZ2VkSW5zdGFuY2VFbWl0dGVyIiwiYWRkTGlzdGVuZXIiLCJfaW50ZXJhY3RpdmVIaWdobGlnaHRpbmdFbmFibGVkTGlzdGVuZXIiLCJfb25JbnRlcmFjdGl2ZUhpZ2hsaWdodGluZ0VuYWJsZWRDaGFuZ2UiLCJfYm91bmRQb2ludGVyRm9jdXNDbGVhcmVkTGlzdGVuZXIiLCJoYW5kbGVMb2NrZWRQb2ludGVyRm9jdXNDbGVhcmVkIiwiYm91bmRQb2ludGVyUmVsZWFzZUxpc3RlbmVyIiwiX29uUG9pbnRlclJlbGVhc2UiLCJib3VuZFBvaW50ZXJDYW5jZWwiLCJfb25Qb2ludGVyQ2FuY2VsIiwiX3BvaW50ZXJMaXN0ZW5lciIsInVwIiwiY2FuY2VsIiwiaW50ZXJydXB0IiwiaXNJbnRlcmFjdGl2ZUhpZ2hsaWdodEFjdGl2ZVByb3BlcnR5IiwiaXNJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZyIsInNldEludGVyYWN0aXZlSGlnaGxpZ2h0IiwiaW50ZXJhY3RpdmVIaWdobGlnaHQiLCJ2aXNpYmxlIiwiZW1pdCIsImdldEludGVyYWN0aXZlSGlnaGxpZ2h0Iiwic2V0SW50ZXJhY3RpdmVIaWdobGlnaHRMYXllcmFibGUiLCJpbnRlcmFjdGl2ZUhpZ2hsaWdodExheWVyYWJsZSIsImdldEludGVyYWN0aXZlSGlnaGxpZ2h0TGF5ZXJhYmxlIiwic2V0SW50ZXJhY3RpdmVIaWdobGlnaHRFbmFibGVkIiwiZW5hYmxlZCIsInRyYWlsSWRzIiwiT2JqZWN0Iiwia2V5cyIsImkiLCJsZW5ndGgiLCJkaXNwbGF5IiwiZm9jdXNNYW5hZ2VyIiwicG9pbnRlckhpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHkiLCJ2YWx1ZSIsImdldEludGVyYWN0aXZlSGlnaGxpZ2h0RW5hYmxlZCIsImludGVyYWN0aXZlSGlnaGxpZ2h0RW5hYmxlZCIsImlzSW50ZXJhY3RpdmVIaWdobGlnaHRBY3RpdmF0ZWQiLCJhY3RpdmF0ZWQiLCJwb2ludGVyRm9jdXMiLCJwb2ludGVyRm9jdXNQcm9wZXJ0eSIsImxvY2tlZFBvaW50ZXJGb2N1cyIsImxvY2tlZFBvaW50ZXJGb2N1c1Byb3BlcnR5IiwidHJhaWwiLCJsYXN0Tm9kZSIsImhhbmRsZUhpZ2hsaWdodEFjdGl2ZUNoYW5nZSIsImRpc3Bvc2UiLCJyZW1vdmVMaXN0ZW5lciIsImhhc0lucHV0TGlzdGVuZXIiLCJyZW1vdmVJbnB1dExpc3RlbmVyIiwib25EaXNwbGF5UmVtb3ZlZCIsImV2ZW50IiwiZ3JvdXBIaWdobGlnaHROb2RlIiwibm9kZXMiLCJmaW5kIiwibm9kZSIsImdyb3VwRm9jdXNIaWdobGlnaHQiLCJyb290VG9Hcm91cE5vZGUiLCJzdWJ0cmFpbFRvIiwidmFsdWVzIiwic2V0IiwibG9ja1BvaW50ZXIiLCJlcXVhbHMiLCJuZXdGb2N1cyIsInBvaW50ZXIiLCJhdHRhY2hlZExpc3RlbmVyIiwibG9ja0hpZ2hsaWdodCIsInNhdmVQb2ludGVyIiwicm9vdFRvU2VsZiIsImdldERlc2NlbmRhbnRzVXNlSGlnaGxpZ2h0aW5nIiwiaXNQaWNrYWJsZSIsImNvbnRhaW5zTm9kZSIsImZvY3VzIiwibG9ja2VkIiwiaXNEaXNwb3NlZCIsIm9uRGlzcGxheUFkZGVkIiwiaGFzTGlzdGVuZXIiLCJsaW5rIiwidW5saW5rIiwibGlzdGVuZXJzIiwiaW5jbHVkZXMiLCJldmVudFBvaW50ZXIiLCJhZGRJbnB1dExpc3RlbmVyIiwiY29weSIsImZlYXR1cmVFbmFibGVkIiwiaGFzQWN0aXZhdGlvbkxpc3RlbmVyIiwiaW5zdGFuY2UiLCJhZGRlZCIsInVuaXF1ZUlkIiwiaW5zdGFuY2VzIiwiaW5kZXhPZlNlbGYiLCJpbmRleE9mIiwiY2hpbGRUb0xlYWZOb2RlcyIsInNsaWNlIiwiZGVzY2VuZGFudHNVc2VWb2ljaW5nIiwibXV0YXRlIiwib3B0aW9ucyIsInByb3RvdHlwZSIsIl9tdXRhdG9yS2V5cyIsImNvbmNhdCIsIl8iLCJ1bmlxIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMS0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBIHRyYWl0IGZvciBOb2RlIHRoYXQgbWl4ZXMgZnVuY3Rpb25hbGl0eSB0byBzdXBwb3J0IHZpc3VhbCBoaWdobGlnaHRzIHRoYXQgYXBwZWFyIG9uIGhvdmVyIHdpdGggYSBwb2ludGVyLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgVGlueUVtaXR0ZXIgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9UaW55RW1pdHRlci5qcyc7XHJcbmltcG9ydCBDb25zdHJ1Y3RvciBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvQ29uc3RydWN0b3IuanMnO1xyXG5pbXBvcnQgSW50ZW50aW9uYWxBbnkgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL0ludGVudGlvbmFsQW55LmpzJztcclxuaW1wb3J0IHsgRGVsYXllZE11dGF0ZSwgRGlzcGxheSwgRm9jdXMsIEZvY3VzTWFuYWdlciwgSW5zdGFuY2UsIE5vZGUsIFBvaW50ZXIsIHNjZW5lcnksIFNjZW5lcnlFdmVudCwgVElucHV0TGlzdGVuZXIsIFRyYWlsIH0gZnJvbSAnLi4vLi4vaW1wb3J0cy5qcyc7XHJcbmltcG9ydCB7IEhpZ2hsaWdodCB9IGZyb20gJy4uLy4uL292ZXJsYXlzL0hpZ2hsaWdodE92ZXJsYXkuanMnO1xyXG5pbXBvcnQgVEVtaXR0ZXIgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9URW1pdHRlci5qcyc7XHJcbmltcG9ydCBtZW1vaXplIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9tZW1vaXplLmpzJztcclxuaW1wb3J0IFRSZWFkT25seVByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgVGlueVByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvVGlueVByb3BlcnR5LmpzJztcclxuXHJcbi8vIGNvbnN0YW50c1xyXG4vLyBvcHRpb24ga2V5cyBmb3IgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmcsIGVhY2ggb2YgdGhlc2Ugd2lsbCBoYXZlIGEgc2V0dGVyIGFuZCBnZXR0ZXIgYW5kIHZhbHVlcyBhcmUgYXBwbGllZCB3aXRoIG11dGF0ZSgpXHJcbmNvbnN0IElOVEVSQUNUSVZFX0hJR0hMSUdIVElOR19PUFRJT05TID0gW1xyXG4gICdpbnRlcmFjdGl2ZUhpZ2hsaWdodCcsXHJcbiAgJ2ludGVyYWN0aXZlSGlnaGxpZ2h0TGF5ZXJhYmxlJyxcclxuICAnaW50ZXJhY3RpdmVIaWdobGlnaHRFbmFibGVkJ1xyXG5dO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuICBpbnRlcmFjdGl2ZUhpZ2hsaWdodD86IEhpZ2hsaWdodDtcclxuICBpbnRlcmFjdGl2ZUhpZ2hsaWdodExheWVyYWJsZT86IGJvb2xlYW47XHJcbiAgaW50ZXJhY3RpdmVIaWdobGlnaHRFbmFibGVkPzogYm9vbGVhbjtcclxufTtcclxuXHJcbmV4cG9ydCB0eXBlIEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nT3B0aW9ucyA9IFNlbGZPcHRpb25zO1xyXG5cclxuZXhwb3J0IHR5cGUgVEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nID0ge1xyXG5cclxuICAvLyBAbWl4aW4tcHJvdGVjdGVkIC0gbWFkZSBwdWJsaWMgZm9yIHVzZSBpbiB0aGUgbWl4aW4gb25seVxyXG4gIGRpc3BsYXlzOiBSZWNvcmQ8c3RyaW5nLCBEaXNwbGF5PjtcclxuXHJcbiAgaW50ZXJhY3RpdmVIaWdobGlnaHRDaGFuZ2VkRW1pdHRlcjogVEVtaXR0ZXI7XHJcbiAgcmVhZG9ubHkgaXNJbnRlcmFjdGl2ZUhpZ2hsaWdodEFjdGl2ZVByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuPjtcclxuICByZWFkb25seSBpc0ludGVyYWN0aXZlSGlnaGxpZ2h0aW5nOiBib29sZWFuO1xyXG4gIHNldEludGVyYWN0aXZlSGlnaGxpZ2h0KCBpbnRlcmFjdGl2ZUhpZ2hsaWdodDogSGlnaGxpZ2h0ICk6IHZvaWQ7XHJcbiAgaW50ZXJhY3RpdmVIaWdobGlnaHQ6IEhpZ2hsaWdodDtcclxuICBnZXRJbnRlcmFjdGl2ZUhpZ2hsaWdodCgpOiBIaWdobGlnaHQ7XHJcbiAgc2V0SW50ZXJhY3RpdmVIaWdobGlnaHRMYXllcmFibGUoIGludGVyYWN0aXZlSGlnaGxpZ2h0TGF5ZXJhYmxlOiBib29sZWFuICk6IHZvaWQ7XHJcbiAgaW50ZXJhY3RpdmVIaWdobGlnaHRMYXllcmFibGU6IGJvb2xlYW47XHJcbiAgZ2V0SW50ZXJhY3RpdmVIaWdobGlnaHRMYXllcmFibGUoKTogYm9vbGVhbjtcclxuICBzZXRJbnRlcmFjdGl2ZUhpZ2hsaWdodEVuYWJsZWQoIGVuYWJsZWQ6IGJvb2xlYW4gKTogdm9pZDtcclxuICBnZXRJbnRlcmFjdGl2ZUhpZ2hsaWdodEVuYWJsZWQoKTogYm9vbGVhbjtcclxuICBpbnRlcmFjdGl2ZUhpZ2hsaWdodEVuYWJsZWQ6IGJvb2xlYW47XHJcbiAgaGFuZGxlSGlnaGxpZ2h0QWN0aXZlQ2hhbmdlKCk6IHZvaWQ7XHJcbiAgb25DaGFuZ2VkSW5zdGFuY2UoIGluc3RhbmNlOiBJbnN0YW5jZSwgYWRkZWQ6IGJvb2xlYW4gKTogdm9pZDtcclxuXHJcbiAgLy8gQG1peGluLXByb3RlY3RlZCAtIG1hZGUgcHVibGljIGZvciB1c2UgaW4gdGhlIG1peGluIG9ubHlcclxuICBnZXREZXNjZW5kYW50c1VzZUhpZ2hsaWdodGluZyggdHJhaWw6IFRyYWlsICk6IGJvb2xlYW47XHJcbn07XHJcblxyXG5jb25zdCBJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZyA9IG1lbW9pemUoIDxTdXBlclR5cGUgZXh0ZW5kcyBDb25zdHJ1Y3RvcjxOb2RlPj4oIFR5cGU6IFN1cGVyVHlwZSApOiBTdXBlclR5cGUgJiBDb25zdHJ1Y3RvcjxUSW50ZXJhY3RpdmVIaWdobGlnaHRpbmc+ID0+IHtcclxuXHJcbiAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gIGFzc2VydCAmJiBhc3NlcnQoICFUeXBlLl9taXhlc0ludGVyYWN0aXZlSGlnaGxpZ2h0aW5nLCAnSW50ZXJhY3RpdmVIaWdobGlnaHRpbmcgaXMgYWxyZWFkeSBhZGRlZCB0byB0aGlzIFR5cGUnICk7XHJcblxyXG4gIGNvbnN0IEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nQ2xhc3MgPSBEZWxheWVkTXV0YXRlKCAnSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdDbGFzcycsIElOVEVSQUNUSVZFX0hJR0hMSUdIVElOR19PUFRJT05TLFxyXG4gICAgY2xhc3MgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdDbGFzcyBleHRlbmRzIFR5cGUgaW1wbGVtZW50cyBUSW50ZXJhY3RpdmVIaWdobGlnaHRpbmcge1xyXG5cclxuICAgICAgLy8gSW5wdXQgbGlzdGVuZXIgdG8gYWN0aXZhdGUgdGhlIEhpZ2hsaWdodE92ZXJsYXkgdXBvbiBwb2ludGVyIGlucHV0LiBVc2VzIGV4aXQgYW5kIGVudGVyIGluc3RlYWQgb2Ygb3ZlciBhbmQgb3V0XHJcbiAgICAgIC8vIGJlY2F1c2Ugd2UgZG8gbm90IHdhbnQgdGhpcyB0byBmaXJlIGZyb20gYnViYmxpbmcuIFRoZSBoaWdobGlnaHQgc2hvdWxkIGJlIGFyb3VuZCB0aGlzIE5vZGUgd2hlbiBpdCByZWNlaXZlc1xyXG4gICAgICAvLyBpbnB1dC5cclxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfYWN0aXZhdGlvbkxpc3RlbmVyOiBUSW5wdXRMaXN0ZW5lcjtcclxuXHJcbiAgICAgIC8vIEEgcmVmZXJlbmNlIHRvIHRoZSBQb2ludGVyIHNvIHRoYXQgd2UgY2FuIGFkZCBhbmQgcmVtb3ZlIGxpc3RlbmVycyBmcm9tIGl0IHdoZW4gbmVjZXNzYXJ5LlxyXG4gICAgICAvLyBTaW5jZSB0aGlzIGlzIG9uIHRoZSB0cmFpdCwgb25seSBvbmUgcG9pbnRlciBjYW4gaGF2ZSBhIGxpc3RlbmVyIGZvciB0aGlzIE5vZGUgdGhhdCB1c2VzIEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nXHJcbiAgICAgIC8vIGF0IG9uZSB0aW1lLlxyXG4gICAgICBwcml2YXRlIF9wb2ludGVyOiBudWxsIHwgUG9pbnRlciA9IG51bGw7XHJcblxyXG4gICAgICAvLyBBIG1hcCB0aGF0IGNvbGxlY3RzIGFsbCBvZiB0aGUgRGlzcGxheXMgdGhhdCB0aGlzIEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nIE5vZGUgaXNcclxuICAgICAgLy8gYXR0YWNoZWQgdG8sIG1hcHBpbmcgdGhlIHVuaXF1ZSBJRCBvZiB0aGUgSW5zdGFuY2UgVHJhaWwgdG8gdGhlIERpc3BsYXkuIFdlIG5lZWQgYSByZWZlcmVuY2UgdG8gdGhlXHJcbiAgICAgIC8vIERpc3BsYXlzIHRvIGFjdGl2YXRlIHRoZSBGb2N1cyBQcm9wZXJ0eSBhc3NvY2lhdGVkIHdpdGggaGlnaGxpZ2h0aW5nLCBhbmQgdG8gYWRkL3JlbW92ZSBsaXN0ZW5lcnMgd2hlblxyXG4gICAgICAvLyBmZWF0dXJlcyB0aGF0IHJlcXVpcmUgaGlnaGxpZ2h0aW5nIGFyZSBlbmFibGVkL2Rpc2FibGVkLiBOb3RlIHRoYXQgdGhpcyBpcyB1cGRhdGVkIGFzeW5jaHJvbm91c2x5XHJcbiAgICAgIC8vICh3aXRoIHVwZGF0ZURpc3BsYXkpIHNpbmNlIEluc3RhbmNlcyBhcmUgYWRkZWQgYXN5bmNocm9ub3VzbHkuXHJcbiAgICAgIC8vIEBtaXhpbi1wcm90ZWN0ZWQgLSBtYWRlIHB1YmxpYyBmb3IgdXNlIGluIHRoZSBtaXhpbiBvbmx5XHJcbiAgICAgIHB1YmxpYyBkaXNwbGF5czogUmVjb3JkPHN0cmluZywgRGlzcGxheT4gPSB7fTtcclxuXHJcbiAgICAgIC8vIFRoZSBoaWdobGlnaHQgdGhhdCB3aWxsIHN1cnJvdW5kIHRoaXMgTm9kZSB3aGVuIGl0IGlzIGFjdGl2YXRlZCBhbmQgYSBQb2ludGVyIGlzIGN1cnJlbnRseSBvdmVyIGl0LiBXaGVuXHJcbiAgICAgIC8vIG51bGwsIHRoZSBmb2N1cyBoaWdobGlnaHQgd2lsbCBiZSB1c2VkIChhcyBkZWZpbmVkIGluIFBhcmFsbGVsRE9NLmpzKS5cclxuICAgICAgcHJpdmF0ZSBfaW50ZXJhY3RpdmVIaWdobGlnaHQ6IEhpZ2hsaWdodCA9IG51bGw7XHJcblxyXG4gICAgICAvLyBJZiB0cnVlLCB0aGUgaGlnaGxpZ2h0IHdpbGwgYmUgbGF5ZXJhYmxlIGluIHRoZSBzY2VuZSBncmFwaCBpbnN0ZWFkIG9mIGRyYXduXHJcbiAgICAgIC8vIGFib3ZlIGV2ZXJ5dGhpbmcgaW4gdGhlIEhpZ2hsaWdodE92ZXJsYXkuIElmIHRydWUsIHlvdSBhcmUgcmVzcG9uc2libGUgZm9yIGFkZGluZyB0aGUgaW50ZXJhY3RpdmVIaWdobGlnaHRcclxuICAgICAgLy8gaW4gdGhlIGxvY2F0aW9uIHlvdSB3YW50IGluIHRoZSBzY2VuZSBncmFwaC4gVGhlIGludGVyYWN0aXZlSGlnaGxpZ2h0IHdpbGwgYmVjb21lIHZpc2libGUgd2hlblxyXG4gICAgICAvLyB0aGlzLmlzSW50ZXJhY3RpdmVIaWdobGlnaHRBY3RpdmVQcm9wZXJ0eSBpcyB0cnVlLlxyXG4gICAgICBwcml2YXRlIF9pbnRlcmFjdGl2ZUhpZ2hsaWdodExheWVyYWJsZSA9IGZhbHNlO1xyXG5cclxuICAgICAgLy8gSWYgdHJ1ZSwgdGhlIGhpZ2hsaWdodCB3aWxsIGJlIGRpc3BsYXllZCBvbiBhY3RpdmF0aW9uIGlucHV0LiBJZiBmYWxzZSwgaXQgd2lsbCBub3QgYW5kIHdlIGNhbiByZW1vdmUgbGlzdGVuZXJzXHJcbiAgICAgIC8vIHRoYXQgd291bGQgZG8gdGhpcyB3b3JrLlxyXG4gICAgICBwcml2YXRlIF9pbnRlcmFjdGl2ZUhpZ2hsaWdodEVuYWJsZWQgPSB0cnVlO1xyXG5cclxuICAgICAgLy8gRW1pdHMgYW4gZXZlbnQgd2hlbiB0aGUgaW50ZXJhY3RpdmUgaGlnaGxpZ2h0IGNoYW5nZXMgZm9yIHRoaXMgTm9kZVxyXG4gICAgICBwdWJsaWMgaW50ZXJhY3RpdmVIaWdobGlnaHRDaGFuZ2VkRW1pdHRlcjogVEVtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXIoKTtcclxuXHJcbiAgICAgIC8vIFRoaXMgUHJvcGVydHkgd2lsbCBiZSB0cnVlIHdoZW4gdGhpcyBub2RlIGhhcyBoaWdobGlnaHRzIGFjdGl2YXRlZCBvbiBpdC4gU2VlIGlzSW50ZXJhY3RpdmVIaWdobGlnaHRBY3RpdmF0ZWQoKS5cclxuICAgICAgcHVibGljIHJlYWRvbmx5IGlzSW50ZXJhY3RpdmVIaWdobGlnaHRBY3RpdmVQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj47XHJcbiAgICAgIHByaXZhdGUgcmVhZG9ubHkgX2lzSW50ZXJhY3RpdmVIaWdobGlnaHRBY3RpdmVQcm9wZXJ0eSA9IG5ldyBUaW55UHJvcGVydHkoIGZhbHNlICk7XHJcblxyXG4gICAgICAvLyBXaGVuIG5ldyBpbnN0YW5jZXMgb2YgdGhpcyBOb2RlIGFyZSBjcmVhdGVkLCBhZGRzIGFuIGVudHJ5IHRvIHRoZSBtYXAgb2YgRGlzcGxheXMuXHJcbiAgICAgIHByaXZhdGUgcmVhZG9ubHkgX2NoYW5nZWRJbnN0YW5jZUxpc3RlbmVyOiAoIGluc3RhbmNlOiBJbnN0YW5jZSwgYWRkZWQ6IGJvb2xlYW4gKSA9PiB2b2lkO1xyXG5cclxuICAgICAgLy8gTGlzdGVuZXIgdGhhdCBhZGRzL3JlbW92ZXMgb3RoZXIgbGlzdGVuZXJzIHRoYXQgYWN0aXZhdGUgaGlnaGxpZ2h0cyB3aGVuXHJcbiAgICAgIC8vIHRoZSBmZWF0dXJlIGJlY29tZXMgZW5hYmxlZC9kaXNhYmxlZCBzbyB0aGF0IHdlIGRvbid0IGRvIGV4dHJhIHdvcmsgcmVsYXRlZCB0byBoaWdobGlnaHRpbmcgdW5sZXNzXHJcbiAgICAgIC8vIGl0IGlzIG5lY2Vzc2FyeS5cclxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfaW50ZXJhY3RpdmVIaWdobGlnaHRpbmdFbmFibGVkTGlzdGVuZXI6ICggZW5hYmxlZDogYm9vbGVhbiApID0+IHZvaWQ7XHJcblxyXG4gICAgICAvLyBBIGxpc3RlbmVyIHRoYXQgaXMgYWRkZWQgdG8gdGhlIEZvY3VzTWFuYWdlci5sb2NrZWRQb2ludGVyRm9jdXNQcm9wZXJ0eSB0byBjbGVhciB0aGlzLl9wb2ludGVyIGFuZCBpdHMgbGlzdGVuZXJzIGZyb21cclxuICAgICAgLy8gdGhpcyBpbnN0YW5jZSB3aGVuIHRoZSBsb2NrZWRQb2ludGVyRm9jdXNQcm9wZXJ0eSBpcyBzZXQgdG8gbnVsbCBleHRlcm5hbGx5IChub3QgYnkgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmcpLlxyXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IF9ib3VuZFBvaW50ZXJGb2N1c0NsZWFyZWRMaXN0ZW5lcjogKCBsb2NrZWRQb2ludGVyRm9jdXM6IEZvY3VzIHwgbnVsbCApID0+IHZvaWQ7XHJcblxyXG4gICAgICAvLyBJbnB1dCBsaXN0ZW5lciB0aGF0IGxvY2tzIHRoZSBIaWdobGlnaHRPdmVybGF5IHNvIHRoYXQgdGhlcmUgYXJlIG5vIHVwZGF0ZXMgdG8gdGhlIGhpZ2hsaWdodFxyXG4gICAgICAvLyB3aGlsZSB0aGUgcG9pbnRlciBpcyBkb3duIG92ZXIgc29tZXRoaW5nIHRoYXQgdXNlcyBJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZy5cclxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfcG9pbnRlckxpc3RlbmVyOiBUSW5wdXRMaXN0ZW5lcjtcclxuXHJcbiAgICAgIHB1YmxpYyBjb25zdHJ1Y3RvciggLi4uYXJnczogSW50ZW50aW9uYWxBbnlbXSApIHtcclxuICAgICAgICBzdXBlciggLi4uYXJncyApO1xyXG5cclxuICAgICAgICB0aGlzLl9hY3RpdmF0aW9uTGlzdGVuZXIgPSB7XHJcbiAgICAgICAgICBlbnRlcjogdGhpcy5fb25Qb2ludGVyRW50ZXJlZC5iaW5kKCB0aGlzICksXHJcbiAgICAgICAgICBvdmVyOiB0aGlzLl9vblBvaW50ZXJPdmVyLmJpbmQoIHRoaXMgKSxcclxuICAgICAgICAgIG1vdmU6IHRoaXMuX29uUG9pbnRlck1vdmUuYmluZCggdGhpcyApLFxyXG4gICAgICAgICAgZXhpdDogdGhpcy5fb25Qb2ludGVyRXhpdGVkLmJpbmQoIHRoaXMgKSxcclxuICAgICAgICAgIGRvd246IHRoaXMuX29uUG9pbnRlckRvd24uYmluZCggdGhpcyApXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5fY2hhbmdlZEluc3RhbmNlTGlzdGVuZXIgPSB0aGlzLm9uQ2hhbmdlZEluc3RhbmNlLmJpbmQoIHRoaXMgKTtcclxuXHJcbiAgICAgICAgLy8gVGhpcyBpcyBwb3RlbnRpYWxseSBkYW5nZXJvdXMgdG8gbGlzdGVuIHRvIGdlbmVyYWxseSwgYnV0IGluIHRoaXMgY2FzZSBpdCBpcyBzYWZlIGJlY2F1c2UgdGhlIHN0YXRlIHdlIGNoYW5nZVxyXG4gICAgICAgIC8vIHdpbGwgb25seSBhZmZlY3QgYSBzZXBhcmF0ZSBkaXNwbGF5J3Mgc3RhdGUsIG5vdCB0aGlzIG9uZS5cclxuICAgICAgICB0aGlzLmNoYW5nZWRJbnN0YW5jZUVtaXR0ZXIuYWRkTGlzdGVuZXIoIHRoaXMuX2NoYW5nZWRJbnN0YW5jZUxpc3RlbmVyICk7XHJcblxyXG4gICAgICAgIHRoaXMuX2ludGVyYWN0aXZlSGlnaGxpZ2h0aW5nRW5hYmxlZExpc3RlbmVyID0gdGhpcy5fb25JbnRlcmFjdGl2ZUhpZ2hsaWdodGluZ0VuYWJsZWRDaGFuZ2UuYmluZCggdGhpcyApO1xyXG4gICAgICAgIHRoaXMuX2JvdW5kUG9pbnRlckZvY3VzQ2xlYXJlZExpc3RlbmVyID0gdGhpcy5oYW5kbGVMb2NrZWRQb2ludGVyRm9jdXNDbGVhcmVkLmJpbmQoIHRoaXMgKTtcclxuXHJcbiAgICAgICAgY29uc3QgYm91bmRQb2ludGVyUmVsZWFzZUxpc3RlbmVyID0gdGhpcy5fb25Qb2ludGVyUmVsZWFzZS5iaW5kKCB0aGlzICk7XHJcbiAgICAgICAgY29uc3QgYm91bmRQb2ludGVyQ2FuY2VsID0gdGhpcy5fb25Qb2ludGVyQ2FuY2VsLmJpbmQoIHRoaXMgKTtcclxuXHJcbiAgICAgICAgdGhpcy5fcG9pbnRlckxpc3RlbmVyID0ge1xyXG4gICAgICAgICAgdXA6IGJvdW5kUG9pbnRlclJlbGVhc2VMaXN0ZW5lcixcclxuICAgICAgICAgIGNhbmNlbDogYm91bmRQb2ludGVyQ2FuY2VsLFxyXG4gICAgICAgICAgaW50ZXJydXB0OiBib3VuZFBvaW50ZXJDYW5jZWxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmlzSW50ZXJhY3RpdmVIaWdobGlnaHRBY3RpdmVQcm9wZXJ0eSA9IHRoaXMuX2lzSW50ZXJhY3RpdmVIaWdobGlnaHRBY3RpdmVQcm9wZXJ0eTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFdoZXRoZXIgYSBOb2RlIGNvbXBvc2VzIEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nLlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIGdldCBpc0ludGVyYWN0aXZlSGlnaGxpZ2h0aW5nKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwdWJsaWMgc3RhdGljIGdldCBfbWl4ZXNJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZygpOiBib29sZWFuIHsgcmV0dXJuIHRydWU7fVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFNldCB0aGUgaW50ZXJhY3RpdmUgaGlnaGxpZ2h0IGZvciB0aGlzIG5vZGUuIEJ5IGRlZmF1bHQsIHRoZSBoaWdobGlnaHQgd2lsbCBiZSBhIHBpbmsgcmVjdGFuZ2xlIHRoYXQgc3Vycm91bmRzXHJcbiAgICAgICAqIHRoZSBub2RlJ3MgbG9jYWwgYm91bmRzLlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIHNldEludGVyYWN0aXZlSGlnaGxpZ2h0KCBpbnRlcmFjdGl2ZUhpZ2hsaWdodDogSGlnaGxpZ2h0ICk6IHZvaWQge1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMuX2ludGVyYWN0aXZlSGlnaGxpZ2h0ICE9PSBpbnRlcmFjdGl2ZUhpZ2hsaWdodCApIHtcclxuICAgICAgICAgIHRoaXMuX2ludGVyYWN0aXZlSGlnaGxpZ2h0ID0gaW50ZXJhY3RpdmVIaWdobGlnaHQ7XHJcblxyXG4gICAgICAgICAgaWYgKCB0aGlzLl9pbnRlcmFjdGl2ZUhpZ2hsaWdodExheWVyYWJsZSApIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGlmIGZvY3VzIGhpZ2hsaWdodCBpcyBsYXllcmFibGUsIGl0IG11c3QgYmUgYSBub2RlIGZvciB0aGUgc2NlbmUgZ3JhcGhcclxuICAgICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggaW50ZXJhY3RpdmVIaWdobGlnaHQgaW5zdGFuY2VvZiBOb2RlICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2ltcGxlLXR5cGUtY2hlY2tpbmctYXNzZXJ0aW9uc1xyXG5cclxuICAgICAgICAgICAgLy8gbWFrZSBzdXJlIHRoZSBoaWdobGlnaHQgaXMgaW52aXNpYmxlLCB0aGUgSGlnaGxpZ2h0T3ZlcmxheSB3aWxsIG1hbmFnZSB2aXNpYmlsaXR5XHJcbiAgICAgICAgICAgICggaW50ZXJhY3RpdmVIaWdobGlnaHQgYXMgTm9kZSApLnZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB0aGlzLmludGVyYWN0aXZlSGlnaGxpZ2h0Q2hhbmdlZEVtaXR0ZXIuZW1pdCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcHVibGljIHNldCBpbnRlcmFjdGl2ZUhpZ2hsaWdodCggaW50ZXJhY3RpdmVIaWdobGlnaHQ6IEhpZ2hsaWdodCApIHsgdGhpcy5zZXRJbnRlcmFjdGl2ZUhpZ2hsaWdodCggaW50ZXJhY3RpdmVIaWdobGlnaHQgKTsgfVxyXG5cclxuICAgICAgcHVibGljIGdldCBpbnRlcmFjdGl2ZUhpZ2hsaWdodCgpOiBIaWdobGlnaHQgeyByZXR1cm4gdGhpcy5nZXRJbnRlcmFjdGl2ZUhpZ2hsaWdodCgpOyB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogUmV0dXJucyB0aGUgaW50ZXJhY3RpdmUgaGlnaGxpZ2h0IGZvciB0aGlzIE5vZGUuXHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgZ2V0SW50ZXJhY3RpdmVIaWdobGlnaHQoKTogSGlnaGxpZ2h0IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faW50ZXJhY3RpdmVIaWdobGlnaHQ7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBTZXRzIHdoZXRoZXIgdGhlIGhpZ2hsaWdodCBpcyBsYXllcmFibGUgaW4gdGhlIHNjZW5lIGdyYXBoIGluc3RlYWQgb2YgYWJvdmUgZXZlcnl0aGluZyBpbiB0aGVcclxuICAgICAgICogaGlnaGxpZ2h0IG92ZXJsYXkuIElmIGxheWVyYWJsZSwgeW91IG11c3QgcHJvdmlkZSBhIGN1c3RvbSBoaWdobGlnaHQgYW5kIGl0IG11c3QgYmUgYSBOb2RlLiBUaGUgaGlnaGxpZ2h0XHJcbiAgICAgICAqIE5vZGUgd2lsbCBhbHdheXMgYmUgaW52aXNpYmxlIHVubGVzcyB0aGlzIE5vZGUgaXMgYWN0aXZhdGVkIHdpdGggYSBwb2ludGVyLlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIHNldEludGVyYWN0aXZlSGlnaGxpZ2h0TGF5ZXJhYmxlKCBpbnRlcmFjdGl2ZUhpZ2hsaWdodExheWVyYWJsZTogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgICAgICBpZiAoIHRoaXMuX2ludGVyYWN0aXZlSGlnaGxpZ2h0TGF5ZXJhYmxlICE9PSBpbnRlcmFjdGl2ZUhpZ2hsaWdodExheWVyYWJsZSApIHtcclxuICAgICAgICAgIHRoaXMuX2ludGVyYWN0aXZlSGlnaGxpZ2h0TGF5ZXJhYmxlID0gaW50ZXJhY3RpdmVIaWdobGlnaHRMYXllcmFibGU7XHJcblxyXG4gICAgICAgICAgaWYgKCB0aGlzLl9pbnRlcmFjdGl2ZUhpZ2hsaWdodCApIHtcclxuICAgICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5faW50ZXJhY3RpdmVIaWdobGlnaHQgaW5zdGFuY2VvZiBOb2RlICk7XHJcbiAgICAgICAgICAgICggdGhpcy5faW50ZXJhY3RpdmVIaWdobGlnaHQgYXMgTm9kZSApLnZpc2libGUgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaW50ZXJhY3RpdmVIaWdobGlnaHRDaGFuZ2VkRW1pdHRlci5lbWl0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBwdWJsaWMgc2V0IGludGVyYWN0aXZlSGlnaGxpZ2h0TGF5ZXJhYmxlKCBpbnRlcmFjdGl2ZUhpZ2hsaWdodExheWVyYWJsZTogYm9vbGVhbiApIHsgdGhpcy5zZXRJbnRlcmFjdGl2ZUhpZ2hsaWdodExheWVyYWJsZSggaW50ZXJhY3RpdmVIaWdobGlnaHRMYXllcmFibGUgKTsgfVxyXG5cclxuICAgICAgcHVibGljIGdldCBpbnRlcmFjdGl2ZUhpZ2hsaWdodExheWVyYWJsZSgpIHsgcmV0dXJuIHRoaXMuZ2V0SW50ZXJhY3RpdmVIaWdobGlnaHRMYXllcmFibGUoKTsgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEdldCB3aGV0aGVyIHRoZSBpbnRlcmFjdGl2ZSBoaWdobGlnaHQgaXMgbGF5ZXJhYmxlIGluIHRoZSBzY2VuZSBncmFwaC5cclxuICAgICAgICovXHJcbiAgICAgIHB1YmxpYyBnZXRJbnRlcmFjdGl2ZUhpZ2hsaWdodExheWVyYWJsZSgpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faW50ZXJhY3RpdmVIaWdobGlnaHRMYXllcmFibGU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBTZXQgdGhlIGVuYWJsZWQgc3RhdGUgb2YgSW50ZXJhY3RpdmUgSGlnaGxpZ2h0cyBvbiB0aGlzIE5vZGUuIFdoZW4gZmFsc2UsIGhpZ2hsaWdodHMgd2lsbCBub3QgYWN0aXZhdGVcclxuICAgICAgICogb24gdGhpcyBOb2RlIHdpdGggbW91c2UgYW5kIHRvdWNoIGlucHV0LiBZb3UgY2FuIGFsc28gZGlzYWJsZSBJbnRlcmFjdGl2ZSBIaWdobGlnaHRzIGJ5IG1ha2luZyB0aGUgbm9kZVxyXG4gICAgICAgKiBwaWNrYWJsZTogZmFsc2UuIFVzZSB0aGlzIHdoZW4geW91IHdhbnQgdG8gZGlzYWJsZSBJbnRlcmFjdGl2ZSBIaWdobGlnaHRzIHdpdGhvdXQgbW9kaWZ5aW5nIHBpY2thYmlsaXR5LlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIHNldEludGVyYWN0aXZlSGlnaGxpZ2h0RW5hYmxlZCggZW5hYmxlZDogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgICAgICB0aGlzLl9pbnRlcmFjdGl2ZUhpZ2hsaWdodEVuYWJsZWQgPSBlbmFibGVkO1xyXG5cclxuICAgICAgICAvLyBFYWNoIGRpc3BsYXkgaGFzIGl0cyBvd24gZm9jdXNNYW5hZ2VyLnBvaW50ZXJIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5LCBzbyB3ZSBuZWVkIHRvIGdvIHRocm91Z2ggYWxsIG9mIHRoZW1cclxuICAgICAgICAvLyBhbmQgdXBkYXRlIGFmdGVyIHRoaXMgZW5hYmxlZCBjaGFuZ2VcclxuICAgICAgICBjb25zdCB0cmFpbElkcyA9IE9iamVjdC5rZXlzKCB0aGlzLmRpc3BsYXlzICk7XHJcbiAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdHJhaWxJZHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICBjb25zdCBkaXNwbGF5ID0gdGhpcy5kaXNwbGF5c1sgdHJhaWxJZHNbIGkgXSBdO1xyXG4gICAgICAgICAgdGhpcy5faW50ZXJhY3RpdmVIaWdobGlnaHRpbmdFbmFibGVkTGlzdGVuZXIoIGRpc3BsYXkuZm9jdXNNYW5hZ2VyLnBvaW50ZXJIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5LnZhbHVlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogQXJlIEludGVyYWN0aXZlIEhpZ2hsaWdodHMgZW5hYmxlZCBmb3IgdGhpcyBOb2RlPyBXaGVuIGZhbHNlLCBubyBoaWdobGlnaHRzIGFjdGl2YXRlIGZyb20gbW91c2UgYW5kIHRvdWNoLlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIGdldEludGVyYWN0aXZlSGlnaGxpZ2h0RW5hYmxlZCgpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faW50ZXJhY3RpdmVIaWdobGlnaHRFbmFibGVkO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwdWJsaWMgc2V0IGludGVyYWN0aXZlSGlnaGxpZ2h0RW5hYmxlZCggZW5hYmxlZDogYm9vbGVhbiApIHsgdGhpcy5zZXRJbnRlcmFjdGl2ZUhpZ2hsaWdodEVuYWJsZWQoIGVuYWJsZWQgKTsgfVxyXG5cclxuICAgICAgcHVibGljIGdldCBpbnRlcmFjdGl2ZUhpZ2hsaWdodEVuYWJsZWQoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmdldEludGVyYWN0aXZlSGlnaGxpZ2h0RW5hYmxlZCgpOyB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogUmV0dXJucyB0cnVlIGlmIHRoaXMgTm9kZSBpcyBcImFjdGl2YXRlZFwiIGJ5IGEgcG9pbnRlciwgaW5kaWNhdGluZyB0aGF0IGEgUG9pbnRlciBpcyBvdmVyIGl0XHJcbiAgICAgICAqIGFuZCB0aGlzIE5vZGUgbWl4ZXMgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmcgc28gYW4gaW50ZXJhY3RpdmUgaGlnaGxpZ2h0IHNob3VsZCBzdXJyb3VuZCBpdC5cclxuICAgICAgICpcclxuICAgICAgICogVGhpcyBhbGdvcml0aG0gZGVwZW5kcyBvbiB0aGUgZGlyZWN0IGZvY3VzIG92ZXIgdGhlIHBvaW50ZXIsIHRoZSBcImxvY2tlZFwiIGZvY3VzIChmcm9tIGFuIGF0dGFjaGVkIGxpc3RlbmVyKSxcclxuICAgICAgICogYW5kIGlmIHBvaW50ZXIgaGlnaGxpZ2h0cyBhcmUgdmlzaWJsZSBhdCBhbGwuXHJcbiAgICAgICAqXHJcbiAgICAgICAqIElmIHlvdSBjb21lIHRvIGRlc2lyZSB0aGlzIHByaXZhdGUgZnVuY3Rpb24sIGluc3RlYWQgeW91IHNob3VsZCB1c2UgaXNJbnRlcmFjdGl2ZUhpZ2hsaWdodEFjdGl2ZVByb3BlcnR5LlxyXG4gICAgICAgKlxyXG4gICAgICAgKi9cclxuICAgICAgcHJpdmF0ZSBpc0ludGVyYWN0aXZlSGlnaGxpZ2h0QWN0aXZhdGVkKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIGxldCBhY3RpdmF0ZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgY29uc3QgdHJhaWxJZHMgPSBPYmplY3Qua2V5cyggdGhpcy5kaXNwbGF5cyApO1xyXG4gICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRyYWlsSWRzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgY29uc3QgZGlzcGxheSA9IHRoaXMuZGlzcGxheXNbIHRyYWlsSWRzWyBpIF0gXTtcclxuXHJcbiAgICAgICAgICAvLyBPbmx5IGlmIHRoZSBpbnRlcmFjdGl2ZSBoaWdobGlnaHRzIGZlYXR1cmUgaXMgZW5hYmxlZCBjYW4gd2UgYmUgYWN0aXZlXHJcbiAgICAgICAgICBpZiAoIGRpc3BsYXkuZm9jdXNNYW5hZ2VyLnBvaW50ZXJIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5LnZhbHVlICkge1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcG9pbnRlckZvY3VzID0gZGlzcGxheS5mb2N1c01hbmFnZXIucG9pbnRlckZvY3VzUHJvcGVydHkudmFsdWU7XHJcbiAgICAgICAgICAgIGNvbnN0IGxvY2tlZFBvaW50ZXJGb2N1cyA9IGRpc3BsYXkuZm9jdXNNYW5hZ2VyLmxvY2tlZFBvaW50ZXJGb2N1c1Byb3BlcnR5LnZhbHVlO1xyXG4gICAgICAgICAgICBpZiAoIGxvY2tlZFBvaW50ZXJGb2N1cyApIHtcclxuICAgICAgICAgICAgICBpZiAoIGxvY2tlZFBvaW50ZXJGb2N1cz8udHJhaWwubGFzdE5vZGUoKSA9PT0gdGhpcyApIHtcclxuICAgICAgICAgICAgICAgIGFjdGl2YXRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoIHBvaW50ZXJGb2N1cz8udHJhaWwubGFzdE5vZGUoKSA9PT0gdGhpcyApIHtcclxuICAgICAgICAgICAgICBhY3RpdmF0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhY3RpdmF0ZWQ7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHB1YmxpYyBoYW5kbGVIaWdobGlnaHRBY3RpdmVDaGFuZ2UoKTogdm9pZCB7XHJcblxyXG4gICAgICAgIC8vIFRoZSBwZXJmb3JtYW5jZSBvZiB0aGlzIGlzIE9LIGF0IHRoZSB0aW1lIG9mIHRoaXMgd3JpdGluZy4gSXQgZGVwZW5kcyBncmVhdGx5IG9uIGhvdyBvZnRlbiB0aGlzIGZ1bmN0aW9uIGlzXHJcbiAgICAgICAgLy8gY2FsbGVkLCBzaW5jZSByZWNhbGN1bGF0aW9uIGludm9sdmVzIGxvb3BpbmcgdGhyb3VnaCBhbGwgaW5zdGFuY2VzJyBkaXNwbGF5cywgYnV0IHNpbmNlIHJlY2FsY3VsYXRpb24gb25seVxyXG4gICAgICAgIC8vIG9jY3VycyBmcm9tIEZvY3VzTWFuYWdlcidzIFByb3BlcnR5IHVwZGF0ZXMgKGFuZCBub3Qgb24gZXZlcnkgcG9pbnRlciBvcGVyYXRpb24pLCB0aGlzIGlzIGFjY2VwdGFibGUuXHJcbiAgICAgICAgdGhpcy5faXNJbnRlcmFjdGl2ZUhpZ2hsaWdodEFjdGl2ZVByb3BlcnR5LnZhbHVlID0gdGhpcy5pc0ludGVyYWN0aXZlSGlnaGxpZ2h0QWN0aXZhdGVkKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHB1YmxpYyBvdmVycmlkZSBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY2hhbmdlZEluc3RhbmNlRW1pdHRlci5yZW1vdmVMaXN0ZW5lciggdGhpcy5fY2hhbmdlZEluc3RhbmNlTGlzdGVuZXIgKTtcclxuXHJcbiAgICAgICAgLy8gcmVtb3ZlIHRoZSBhY3RpdmF0aW9uIGxpc3RlbmVyIGlmIGl0IGlzIGN1cnJlbnRseSBhdHRhY2hlZFxyXG4gICAgICAgIGlmICggdGhpcy5oYXNJbnB1dExpc3RlbmVyKCB0aGlzLl9hY3RpdmF0aW9uTGlzdGVuZXIgKSApIHtcclxuICAgICAgICAgIHRoaXMucmVtb3ZlSW5wdXRMaXN0ZW5lciggdGhpcy5fYWN0aXZhdGlvbkxpc3RlbmVyICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIHRoaXMuX3BvaW50ZXIgKSB7XHJcbiAgICAgICAgICB0aGlzLl9wb2ludGVyLnJlbW92ZUlucHV0TGlzdGVuZXIoIHRoaXMuX3BvaW50ZXJMaXN0ZW5lciApO1xyXG4gICAgICAgICAgdGhpcy5fcG9pbnRlciA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyByZW1vdmUgbGlzdGVuZXJzIG9uIGRpc3BsYXlzIGFuZCByZW1vdmUgRGlzcGxheXMgZnJvbSB0aGUgbWFwXHJcbiAgICAgICAgY29uc3QgdHJhaWxJZHMgPSBPYmplY3Qua2V5cyggdGhpcy5kaXNwbGF5cyApO1xyXG4gICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRyYWlsSWRzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgY29uc3QgZGlzcGxheSA9IHRoaXMuZGlzcGxheXNbIHRyYWlsSWRzWyBpIF0gXTtcclxuICAgICAgICAgIHRoaXMub25EaXNwbGF5UmVtb3ZlZCggZGlzcGxheSApO1xyXG4gICAgICAgICAgZGVsZXRlIHRoaXMuZGlzcGxheXNbIHRyYWlsSWRzWyBpIF0gXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN1cGVyLmRpc3Bvc2UgJiYgc3VwZXIuZGlzcG9zZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogV2hlbiB0aGUgcG9pbnRlciBnb2VzICdvdmVyJyBhIG5vZGUgKG5vdCBpbmNsdWRpbmcgY2hpbGRyZW4pLCBsb29rIGZvciBhIGdyb3VwIGZvY3VzIGhpZ2hsaWdodCB0b1xyXG4gICAgICAgKiBhY3RpdmF0ZS4gVGhpcyBpcyBtb3N0IHVzZWZ1bCBmb3IgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmcgTm9kZXMgdGhhdCBhY3QgYXMgYSBcImdyb3VwXCIgY29udGFpbmVyXHJcbiAgICAgICAqIGZvciBvdGhlciBub2Rlcy4gV2hlbiB0aGUgcG9pbnRlciBsZWF2ZXMgYSBjaGlsZCwgd2UgZ2V0IHRoZSAnZXhpdGVkJyBldmVudCBvbiB0aGUgY2hpbGQsIGltbWVkaWF0ZWx5XHJcbiAgICAgICAqIGZvbGxvd2VkIGJ5IGFuICdvdmVyJyBldmVudCBvbiB0aGUgcGFyZW50LiBUaGlzIGtlZXBzIHRoZSBncm91cCBoaWdobGlnaHQgdmlzaWJsZSB3aXRob3V0IGFueSBmbGlja2VyaW5nLlxyXG4gICAgICAgKiBUaGUgZ3JvdXAgcGFyZW50IG11c3QgYmUgY29tcG9zZWQgd2l0aCBJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZyBzbyB0aGF0IGl0IGhhcyB0aGVzZSBldmVudCBsaXN0ZW5lcnMuXHJcbiAgICAgICAqL1xyXG4gICAgICBwcml2YXRlIF9vblBvaW50ZXJPdmVyKCBldmVudDogU2NlbmVyeUV2ZW50PE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50IHwgUG9pbnRlckV2ZW50PiApOiB2b2lkIHtcclxuXHJcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgYW4gYW5jZXN0b3IgdGhhdCBpcyBhIGdyb3VwIGZvY3VzIGhpZ2hsaWdodCB0aGF0IGlzIGNvbXBvc2VkIHdpdGggSW50ZXJhY3RpdmVIaWdobGlnaHQgKFxyXG4gICAgICAgIC8vIChzaG91bGQgYWN0aXZhdGUgd2l0aCBwb2ludGVyIGlucHV0KS4uLlxyXG4gICAgICAgIGNvbnN0IGdyb3VwSGlnaGxpZ2h0Tm9kZSA9IGV2ZW50LnRyYWlsLm5vZGVzLmZpbmQoIG5vZGUgPT4gKCBub2RlLmdyb3VwRm9jdXNIaWdobGlnaHQgJiYgKCBub2RlIGFzIEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nTm9kZSApLmlzSW50ZXJhY3RpdmVIaWdobGlnaHRpbmcgKSApO1xyXG4gICAgICAgIGlmICggZ3JvdXBIaWdobGlnaHROb2RlICkge1xyXG5cclxuICAgICAgICAgIC8vIHRyYWlsIHRvIHRoZSBncm91cCBoaWdobGlnaHQgTm9kZVxyXG4gICAgICAgICAgY29uc3Qgcm9vdFRvR3JvdXBOb2RlID0gZXZlbnQudHJhaWwuc3VidHJhaWxUbyggZ3JvdXBIaWdobGlnaHROb2RlICk7XHJcbiAgICAgICAgICBjb25zdCBkaXNwbGF5cyA9IE9iamVjdC52YWx1ZXMoIHRoaXMuZGlzcGxheXMgKTtcclxuICAgICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGRpc3BsYXlzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgICBjb25zdCBkaXNwbGF5ID0gZGlzcGxheXNbIGkgXTtcclxuXHJcbiAgICAgICAgICAgIC8vIG9ubHkgc2V0IGZvY3VzIGlmIGN1cnJlbnQgUG9pbnRlciBmb2N1cyBpcyBub3QgZGVmaW5lZCAoZnJvbSBhIG1vcmUgZGVzY2VuZGFudCBOb2RlKVxyXG4gICAgICAgICAgICBpZiAoIGRpc3BsYXkuZm9jdXNNYW5hZ2VyLnBvaW50ZXJGb2N1c1Byb3BlcnR5LnZhbHVlID09PSBudWxsICkge1xyXG4gICAgICAgICAgICAgIGRpc3BsYXkuZm9jdXNNYW5hZ2VyLnBvaW50ZXJGb2N1c1Byb3BlcnR5LnNldCggbmV3IEZvY3VzKCBkaXNwbGF5LCByb290VG9Hcm91cE5vZGUgKSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogV2hlbiBhIFBvaW50ZXIgZW50ZXJzIHRoaXMgTm9kZSwgc2lnbmFsIHRvIHRoZSBEaXNwbGF5cyB0aGF0IHRoZSBwb2ludGVyIGlzIG92ZXIgdGhpcyBOb2RlIHNvIHRoYXQgdGhlXHJcbiAgICAgICAqIEhpZ2hsaWdodE92ZXJsYXkgY2FuIGJlIGFjdGl2YXRlZC5cclxuICAgICAgICpcclxuICAgICAgICogVGhpcyBpcyBtb3N0IGxpa2VseSBob3cgbW9zdCBwb2ludGVyRm9jdXNQcm9wZXJ0eSBpcyBzZXQuIEZpcnN0IHdlIGdldCBhbiBgZW50ZXJgIGV2ZW50IHRoZW4gd2UgbWF5IGdldFxyXG4gICAgICAgKiBhIGRvd24gZXZlbnQgb3IgbW92ZSBldmVudCB3aGljaCBjb3VsZCBkbyBmdXJ0aGVyIHVwZGF0ZXMgb24gdGhlIGV2ZW50IFBvaW50ZXIgb3IgRm9jdXNNYW5hZ2VyLlxyXG4gICAgICAgKi9cclxuICAgICAgcHJpdmF0ZSBfb25Qb2ludGVyRW50ZXJlZCggZXZlbnQ6IFNjZW5lcnlFdmVudDxNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCB8IFBvaW50ZXJFdmVudD4gKTogdm9pZCB7XHJcblxyXG4gICAgICAgIGxldCBsb2NrUG9pbnRlciA9IGZhbHNlO1xyXG5cclxuICAgICAgICBjb25zdCBkaXNwbGF5cyA9IE9iamVjdC52YWx1ZXMoIHRoaXMuZGlzcGxheXMgKTtcclxuICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBkaXNwbGF5cy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgIGNvbnN0IGRpc3BsYXkgPSBkaXNwbGF5c1sgaSBdO1xyXG5cclxuICAgICAgICAgIGlmICggZGlzcGxheS5mb2N1c01hbmFnZXIucG9pbnRlckZvY3VzUHJvcGVydHkudmFsdWUgPT09IG51bGwgfHxcclxuICAgICAgICAgICAgICAgIWV2ZW50LnRyYWlsLmVxdWFscyggZGlzcGxheS5mb2N1c01hbmFnZXIucG9pbnRlckZvY3VzUHJvcGVydHkudmFsdWUudHJhaWwgKSApIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IG5ld0ZvY3VzID0gbmV3IEZvY3VzKCBkaXNwbGF5LCBldmVudC50cmFpbCApO1xyXG4gICAgICAgICAgICBkaXNwbGF5LmZvY3VzTWFuYWdlci5wb2ludGVyRm9jdXNQcm9wZXJ0eS5zZXQoIG5ld0ZvY3VzICk7XHJcbiAgICAgICAgICAgIGlmICggZGlzcGxheS5mb2N1c01hbmFnZXIubG9ja2VkUG9pbnRlckZvY3VzUHJvcGVydHkudmFsdWUgPT09IG51bGwgJiYgZXZlbnQucG9pbnRlci5hdHRhY2hlZExpc3RlbmVyICkge1xyXG4gICAgICAgICAgICAgIHRoaXMubG9ja0hpZ2hsaWdodCggbmV3Rm9jdXMsIGRpc3BsYXkuZm9jdXNNYW5hZ2VyICk7XHJcbiAgICAgICAgICAgICAgbG9ja1BvaW50ZXIgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIGxvY2tQb2ludGVyICkge1xyXG4gICAgICAgICAgdGhpcy5zYXZlUG9pbnRlciggZXZlbnQucG9pbnRlciApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFVwZGF0ZSBoaWdobGlnaHRzIHdoZW4gdGhlIFBvaW50ZXIgbW92ZXMgb3ZlciB0aGlzIE5vZGUuIEluIGdlbmVyYWwsIGhpZ2hsaWdodHMgd2lsbCBhY3RpdmF0ZSBvbiAnZW50ZXInLiBCdXRcclxuICAgICAgICogaW4gY2FzZXMgd2hlcmUgbXVsdGlwbGUgTm9kZXMgaW4gYSBUcmFpbCBzdXBwb3J0IEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nIHRoaXMgbGlzdGVuZXIgY2FuIG1vdmUgZm9jdXNcclxuICAgICAgICogdG8gdGhlIG1vc3QgcmVhc29uYWJsZSB0YXJnZXQgKHRoZSBjbG9zZXN0IGFuY2VzdG9yIG9yIGRlc2NlbmRlbnQgdGhhdCBpcyBjb21wb3NlZCB3aXRoIEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nKS5cclxuICAgICAgICovXHJcbiAgICAgIHByaXZhdGUgX29uUG9pbnRlck1vdmUoIGV2ZW50OiBTY2VuZXJ5RXZlbnQ8TW91c2VFdmVudCB8IFRvdWNoRXZlbnQgfCBQb2ludGVyRXZlbnQ+ICk6IHZvaWQge1xyXG4gICAgICAgIGxldCBsb2NrUG9pbnRlciA9IGZhbHNlO1xyXG5cclxuICAgICAgICBjb25zdCBkaXNwbGF5cyA9IE9iamVjdC52YWx1ZXMoIHRoaXMuZGlzcGxheXMgKTtcclxuICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBkaXNwbGF5cy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgIGNvbnN0IGRpc3BsYXkgPSBkaXNwbGF5c1sgaSBdO1xyXG5cclxuICAgICAgICAgIC8vIHRoZSBTY2VuZXJ5RXZlbnQgbWlnaHQgaGF2ZSBnb25lIHRocm91Z2ggYSBkZXNjZW5kYW50IG9mIHRoaXMgTm9kZVxyXG4gICAgICAgICAgY29uc3Qgcm9vdFRvU2VsZiA9IGV2ZW50LnRyYWlsLnN1YnRyYWlsVG8oIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAvLyBvbmx5IGRvIG1vcmUgd29yayBvbiBtb3ZlIGlmIHRoZSBldmVudCBpbmRpY2F0ZXMgdGhhdCBwb2ludGVyIGZvY3VzIG1pZ2h0IGhhdmUgY2hhbmdlZC5cclxuICAgICAgICAgIGlmICggZGlzcGxheS5mb2N1c01hbmFnZXIucG9pbnRlckZvY3VzUHJvcGVydHkudmFsdWUgPT09IG51bGwgfHwgIXJvb3RUb1NlbGYuZXF1YWxzKCBkaXNwbGF5LmZvY3VzTWFuYWdlci5wb2ludGVyRm9jdXNQcm9wZXJ0eS52YWx1ZS50cmFpbCApICkge1xyXG5cclxuICAgICAgICAgICAgaWYgKCAhdGhpcy5nZXREZXNjZW5kYW50c1VzZUhpZ2hsaWdodGluZyggZXZlbnQudHJhaWwgKSApIHtcclxuICAgICAgICAgICAgICBjb25zdCBuZXdGb2N1cyA9IG5ldyBGb2N1cyggZGlzcGxheSwgcm9vdFRvU2VsZiApO1xyXG4gICAgICAgICAgICAgIGRpc3BsYXkuZm9jdXNNYW5hZ2VyLnBvaW50ZXJGb2N1c1Byb3BlcnR5LnNldCggbmV3Rm9jdXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgaWYgKCBkaXNwbGF5LmZvY3VzTWFuYWdlci5sb2NrZWRQb2ludGVyRm9jdXNQcm9wZXJ0eS52YWx1ZSA9PT0gbnVsbCAmJiBldmVudC5wb2ludGVyLmF0dGFjaGVkTGlzdGVuZXIgKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxvY2tIaWdobGlnaHQoIG5ld0ZvY3VzLCBkaXNwbGF5LmZvY3VzTWFuYWdlciApO1xyXG4gICAgICAgICAgICAgICAgbG9ja1BvaW50ZXIgPSB0cnVlO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCBsb2NrUG9pbnRlciApIHtcclxuICAgICAgICAgIHRoaXMuc2F2ZVBvaW50ZXIoIGV2ZW50LnBvaW50ZXIgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBXaGVuIGEgcG9pbnRlciBleGl0cyB0aGlzIE5vZGUgb3IgaXRzIGNoaWxkcmVuLCBzaWduYWwgdG8gdGhlIERpc3BsYXlzIHRoYXQgcG9pbnRlciBmb2N1cyBoYXMgY2hhbmdlZCB0b1xyXG4gICAgICAgKiBkZWFjdGl2YXRlIHRoZSBIaWdobGlnaHRPdmVybGF5LiBUaGlzIGNhbiBhbHNvIGZpcmUgd2hlbiB2aXNpYmlsaXR5L3BpY2thYmlsaXR5IG9mIHRoZSBOb2RlIGNoYW5nZXMuXHJcbiAgICAgICAqL1xyXG4gICAgICBwcml2YXRlIF9vblBvaW50ZXJFeGl0ZWQoIGV2ZW50OiBTY2VuZXJ5RXZlbnQ8TW91c2VFdmVudCB8IFRvdWNoRXZlbnQgfCBQb2ludGVyRXZlbnQ+ICk6IHZvaWQge1xyXG5cclxuICAgICAgICBjb25zdCBkaXNwbGF5cyA9IE9iamVjdC52YWx1ZXMoIHRoaXMuZGlzcGxheXMgKTtcclxuICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBkaXNwbGF5cy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgIGNvbnN0IGRpc3BsYXkgPSBkaXNwbGF5c1sgaSBdO1xyXG4gICAgICAgICAgZGlzcGxheS5mb2N1c01hbmFnZXIucG9pbnRlckZvY3VzUHJvcGVydHkuc2V0KCBudWxsICk7XHJcblxyXG4gICAgICAgICAgLy8gQW4gZXhpdCBldmVudCBtYXkgY29tZSBmcm9tIGEgTm9kZSBhbG9uZyB0aGUgdHJhaWwgYmVjb21pbmcgaW52aXNpYmxlIG9yIHVucGlja2FibGUuIEluIHRoYXQgY2FzZSB1bmxvY2tcclxuICAgICAgICAgIC8vIGZvY3VzIGFuZCByZW1vdmUgcG9pbnRlciBsaXN0ZW5lcnMgc28gdGhhdCBoaWdobGlnaHRzIGNhbiBjb250aW51ZSB0byB1cGRhdGUgZnJvbSBuZXcgaW5wdXQuXHJcbiAgICAgICAgICBjb25zdCBsb2NrZWRQb2ludGVyRm9jdXMgPSBkaXNwbGF5LmZvY3VzTWFuYWdlci5sb2NrZWRQb2ludGVyRm9jdXNQcm9wZXJ0eS52YWx1ZTtcclxuICAgICAgICAgIGlmICggIWV2ZW50LnRyYWlsLmlzUGlja2FibGUoKSAmJlxyXG4gICAgICAgICAgICAgICAoIGxvY2tlZFBvaW50ZXJGb2N1cyA9PT0gbnVsbCB8fFxyXG5cclxuICAgICAgICAgICAgICAgICAvLyBXZSBkbyBub3Qgd2FudCB0byByZW1vdmUgdGhlIGxvY2tlZFBvaW50ZXJGb2N1cyBpZiB0aGlzIGV2ZW50IHRyYWlsIGhhcyBub3RoaW5nXHJcbiAgICAgICAgICAgICAgICAgLy8gdG8gZG8gd2l0aCB0aGUgbm9kZSB0aGF0IGlzIHJlY2VpdmluZyBhIGxvY2tlZCBmb2N1cy5cclxuICAgICAgICAgICAgICAgICBldmVudC50cmFpbC5jb250YWluc05vZGUoIGxvY2tlZFBvaW50ZXJGb2N1cy50cmFpbC5sYXN0Tm9kZSgpICkgKSApIHtcclxuXHJcbiAgICAgICAgICAgIC8vIHVubG9jayBhbmQgcmVtb3ZlIHBvaW50ZXIgbGlzdGVuZXJzXHJcbiAgICAgICAgICAgIHRoaXMuX29uUG9pbnRlclJlbGVhc2UoIGV2ZW50ICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogV2hlbiBhIHBvaW50ZXIgZ29lcyBkb3duIG9uIHRoaXMgTm9kZSwgc2lnbmFsIHRvIHRoZSBEaXNwbGF5cyB0aGF0IHRoZSBwb2ludGVyRm9jdXMgaXMgbG9ja2VkLiBPbiB0aGUgZG93blxyXG4gICAgICAgKiBldmVudCwgdGhlIHBvaW50ZXJGb2N1c1Byb3BlcnR5IHdpbGwgaGF2ZSBiZWVuIHNldCBmaXJzdCBmcm9tIHRoZSBgZW50ZXJgIGV2ZW50LlxyXG4gICAgICAgKi9cclxuICAgICAgcHJpdmF0ZSBfb25Qb2ludGVyRG93biggZXZlbnQ6IFNjZW5lcnlFdmVudDxNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCB8IFBvaW50ZXJFdmVudD4gKTogdm9pZCB7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5fcG9pbnRlciA9PT0gbnVsbCApIHtcclxuICAgICAgICAgIGxldCBsb2NrUG9pbnRlciA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgIGNvbnN0IGRpc3BsYXlzID0gT2JqZWN0LnZhbHVlcyggdGhpcy5kaXNwbGF5cyApO1xyXG4gICAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgZGlzcGxheXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRpc3BsYXkgPSBkaXNwbGF5c1sgaSBdO1xyXG4gICAgICAgICAgICBjb25zdCBmb2N1cyA9IGRpc3BsYXkuZm9jdXNNYW5hZ2VyLnBvaW50ZXJGb2N1c1Byb3BlcnR5LnZhbHVlO1xyXG4gICAgICAgICAgICBjb25zdCBsb2NrZWQgPSAhIWRpc3BsYXkuZm9jdXNNYW5hZ2VyLmxvY2tlZFBvaW50ZXJGb2N1c1Byb3BlcnR5LnZhbHVlO1xyXG5cclxuICAgICAgICAgICAgLy8gRm9jdXMgc2hvdWxkIGdlbmVyYWxseSBiZSBkZWZpbmVkIHdoZW4gcG9pbnRlciBlbnRlcnMgdGhlIE5vZGUsIGJ1dCBpdCBtYXkgYmUgbnVsbCBpbiBjYXNlcyBvZlxyXG4gICAgICAgICAgICAvLyBjYW5jZWwgb3IgaW50ZXJydXB0LiBEb24ndCBhdHRlbXB0IHRvIGxvY2sgaWYgdGhlIEZvY3VzTWFuYWdlciBhbHJlYWR5IGhhcyBhIGxvY2tlZCBoaWdobGlnaHQgKGVzcGVjaWFsbHlcclxuICAgICAgICAgICAgLy8gaW1wb3J0YW50IGZvciBncmFjZWZ1bGx5IGhhbmRsaW5nIG11bHRpdG91Y2gpLlxyXG4gICAgICAgICAgICBpZiAoIGZvY3VzICYmICFsb2NrZWQgKSB7XHJcbiAgICAgICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggIWZvY3VzLnRyYWlsLmxhc3ROb2RlKCkuaXNEaXNwb3NlZCwgJ0ZvY3VzIHNob3VsZCBub3QgYmUgc2V0IHRvIGEgZGlzcG9zZWQgTm9kZScgKTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gU2V0IHRoZSBsb2NrZWRQb2ludGVyRm9jdXNQcm9wZXJ0eSB3aXRoIGEgY29weSBvZiB0aGUgRm9jdXMgKGFzIGRlZXAgYXMgcG9zc2libGUpIGJlY2F1c2Ugd2Ugd2FudFxyXG4gICAgICAgICAgICAgIC8vIHRvIGtlZXAgYSByZWZlcmVuY2UgdG8gdGhlIG9sZCBUcmFpbCB3aGlsZSBwb2ludGVyRm9jdXNQcm9wZXJ0eSBjaGFuZ2VzLlxyXG4gICAgICAgICAgICAgIHRoaXMubG9ja0hpZ2hsaWdodCggZm9jdXMsIGRpc3BsYXkuZm9jdXNNYW5hZ2VyICk7XHJcbiAgICAgICAgICAgICAgbG9ja1BvaW50ZXIgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKCBsb2NrUG9pbnRlciApIHtcclxuICAgICAgICAgICAgdGhpcy5zYXZlUG9pbnRlciggZXZlbnQucG9pbnRlciApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcHJpdmF0ZSBvbkRpc3BsYXlBZGRlZCggZGlzcGxheTogRGlzcGxheSApOiB2b2lkIHtcclxuXHJcbiAgICAgICAgLy8gTGlzdGVuZXIgbWF5IGFscmVhZHkgYnkgb24gdGhlIGRpc3BsYXkgaW4gY2FzZXMgb2YgREFHLCBvbmx5IGFkZCBpZiB0aGlzIGlzIHRoZSBmaXJzdCBpbnN0YW5jZSBvZiB0aGlzIE5vZGVcclxuICAgICAgICBpZiAoICFkaXNwbGF5LmZvY3VzTWFuYWdlci5wb2ludGVySGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eS5oYXNMaXN0ZW5lciggdGhpcy5faW50ZXJhY3RpdmVIaWdobGlnaHRpbmdFbmFibGVkTGlzdGVuZXIgKSApIHtcclxuICAgICAgICAgIGRpc3BsYXkuZm9jdXNNYW5hZ2VyLnBvaW50ZXJIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5LmxpbmsoIHRoaXMuX2ludGVyYWN0aXZlSGlnaGxpZ2h0aW5nRW5hYmxlZExpc3RlbmVyICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBwcml2YXRlIG9uRGlzcGxheVJlbW92ZWQoIGRpc3BsYXk6IERpc3BsYXkgKTogdm9pZCB7XHJcblxyXG4gICAgICAgIC8vIFBvaW50ZXIgZm9jdXMgd2FzIGxvY2tlZCBkdWUgdG8gaW50ZXJhY3Rpb24gd2l0aCB0aGlzIGxpc3RlbmVyLCBidXQgdW5sb2NrZWQgYmVjYXVzZSBvZiBvdGhlclxyXG4gICAgICAgIC8vIHNjZW5lcnktaW50ZXJuYWwgbGlzdGVuZXJzLiBCdXQgdGhlIFByb3BlcnR5IHN0aWxsIGhhcyB0aGlzIGxpc3RlbmVyIHNvIGl0IG5lZWRzIHRvIGJlIHJlbW92ZWQgbm93LlxyXG4gICAgICAgIGlmICggZGlzcGxheS5mb2N1c01hbmFnZXIubG9ja2VkUG9pbnRlckZvY3VzUHJvcGVydHkuaGFzTGlzdGVuZXIoIHRoaXMuX2JvdW5kUG9pbnRlckZvY3VzQ2xlYXJlZExpc3RlbmVyICkgKSB7XHJcbiAgICAgICAgICBkaXNwbGF5LmZvY3VzTWFuYWdlci5sb2NrZWRQb2ludGVyRm9jdXNQcm9wZXJ0eS51bmxpbmsoIHRoaXMuX2JvdW5kUG9pbnRlckZvY3VzQ2xlYXJlZExpc3RlbmVyICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaXNwbGF5LmZvY3VzTWFuYWdlci5wb2ludGVySGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eS51bmxpbmsoIHRoaXMuX2ludGVyYWN0aXZlSGlnaGxpZ2h0aW5nRW5hYmxlZExpc3RlbmVyICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBXaGVuIGEgUG9pbnRlciBnb2VzIHVwIGFmdGVyIGdvaW5nIGRvd24gb24gdGhpcyBOb2RlLCBzaWduYWwgdG8gdGhlIERpc3BsYXlzIHRoYXQgdGhlIHBvaW50ZXJGb2N1c1Byb3BlcnR5IG5vXHJcbiAgICAgICAqIGxvbmdlciBuZWVkcyB0byBiZSBsb2NrZWQuXHJcbiAgICAgICAqXHJcbiAgICAgICAqIEBwYXJhbSBbZXZlbnRdIC0gbWF5IGJlIGNhbGxlZCBkdXJpbmcgaW50ZXJydXB0IG9yIGNhbmNlbCwgaW4gd2hpY2ggY2FzZSB0aGVyZSBpcyBubyBldmVudFxyXG4gICAgICAgKi9cclxuICAgICAgcHJpdmF0ZSBfb25Qb2ludGVyUmVsZWFzZSggZXZlbnQ/OiBTY2VuZXJ5RXZlbnQ8TW91c2VFdmVudCB8IFRvdWNoRXZlbnQgfCBQb2ludGVyRXZlbnQ+ICk6IHZvaWQge1xyXG5cclxuICAgICAgICBjb25zdCBkaXNwbGF5cyA9IE9iamVjdC52YWx1ZXMoIHRoaXMuZGlzcGxheXMgKTtcclxuICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBkaXNwbGF5cy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgIGNvbnN0IGRpc3BsYXkgPSBkaXNwbGF5c1sgaSBdO1xyXG4gICAgICAgICAgZGlzcGxheS5mb2N1c01hbmFnZXIubG9ja2VkUG9pbnRlckZvY3VzUHJvcGVydHkudmFsdWUgPSBudWxsO1xyXG5cclxuICAgICAgICAgIC8vIFVubGluayB0aGUgbGlzdGVuZXIgdGhhdCB3YXMgd2F0Y2hpbmcgZm9yIHRoZSBsb2NrZWRQb2ludGVyRm9jdXNQcm9wZXJ0eSB0byBiZSBjbGVhcmVkIGV4dGVybmFsbHlcclxuICAgICAgICAgIGlmICggZGlzcGxheS5mb2N1c01hbmFnZXIubG9ja2VkUG9pbnRlckZvY3VzUHJvcGVydHkuaGFzTGlzdGVuZXIoIHRoaXMuX2JvdW5kUG9pbnRlckZvY3VzQ2xlYXJlZExpc3RlbmVyICkgKSB7XHJcbiAgICAgICAgICAgIGRpc3BsYXkuZm9jdXNNYW5hZ2VyLmxvY2tlZFBvaW50ZXJGb2N1c1Byb3BlcnR5LnVubGluayggdGhpcy5fYm91bmRQb2ludGVyRm9jdXNDbGVhcmVkTGlzdGVuZXIgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5fcG9pbnRlciAmJiB0aGlzLl9wb2ludGVyLmxpc3RlbmVycy5pbmNsdWRlcyggdGhpcy5fcG9pbnRlckxpc3RlbmVyICkgKSB7XHJcbiAgICAgICAgICB0aGlzLl9wb2ludGVyLnJlbW92ZUlucHV0TGlzdGVuZXIoIHRoaXMuX3BvaW50ZXJMaXN0ZW5lciApO1xyXG4gICAgICAgICAgdGhpcy5fcG9pbnRlciA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogSWYgdGhlIHBvaW50ZXIgbGlzdGVuZXIgaXMgY2FuY2VsbGVkIG9yIGludGVycnVwdGVkLCBjbGVhciBmb2N1cyBhbmQgcmVtb3ZlIGlucHV0IGxpc3RlbmVycy5cclxuICAgICAgICovXHJcbiAgICAgIHByaXZhdGUgX29uUG9pbnRlckNhbmNlbCggZXZlbnQ/OiBTY2VuZXJ5RXZlbnQ8TW91c2VFdmVudCB8IFRvdWNoRXZlbnQgfCBQb2ludGVyRXZlbnQ+ICk6IHZvaWQge1xyXG5cclxuICAgICAgICBjb25zdCBkaXNwbGF5cyA9IE9iamVjdC52YWx1ZXMoIHRoaXMuZGlzcGxheXMgKTtcclxuICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBkaXNwbGF5cy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgIGNvbnN0IGRpc3BsYXkgPSBkaXNwbGF5c1sgaSBdO1xyXG4gICAgICAgICAgZGlzcGxheS5mb2N1c01hbmFnZXIucG9pbnRlckZvY3VzUHJvcGVydHkuc2V0KCBudWxsICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyB1bmxvY2sgYW5kIHJlbW92ZSBwb2ludGVyIGxpc3RlbmVyc1xyXG4gICAgICAgIHRoaXMuX29uUG9pbnRlclJlbGVhc2UoIGV2ZW50ICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBTYXZlIHRoZSBQb2ludGVyIGFuZCBhZGQgYSBsaXN0ZW5lciB0byBpdCB0byByZW1vdmUgaGlnaGxpZ2h0cyB3aGVuIGEgcG9pbnRlciBpcyByZWxlYXNlZC9jYW5jZWxsZWQuXHJcbiAgICAgICAqL1xyXG4gICAgICBwcml2YXRlIHNhdmVQb2ludGVyKCBldmVudFBvaW50ZXI6IFBvaW50ZXIgKTogdm9pZCB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydChcclxuICAgICAgICAgIHRoaXMuX3BvaW50ZXIgPT09IG51bGwsXHJcbiAgICAgICAgICAnSXQgc2hvdWxkIGJlIGltcG9zc2libGUgdG8gYWxyZWFkeSBoYXZlIGEgUG9pbnRlciBiZWZvcmUgbG9ja2luZyBmcm9tIHRvdWNoU25hZydcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICB0aGlzLl9wb2ludGVyID0gZXZlbnRQb2ludGVyO1xyXG4gICAgICAgIHRoaXMuX3BvaW50ZXIuYWRkSW5wdXRMaXN0ZW5lciggdGhpcy5fcG9pbnRlckxpc3RlbmVyICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBTZXRzIHRoZSBcImxvY2tlZFwiIGZvY3VzIGZvciBJbnRlcmFjdGl2ZSBIaWdobGlnaHRpbmcuIFRoZSBcImxvY2tpbmdcIiBtYWtlcyBzdXJlIHRoYXQgdGhlIGhpZ2hsaWdodCByZW1haW5zXHJcbiAgICAgICAqIGFjdGl2ZSBvbiB0aGUgTm9kZSB0aGF0IGlzIHJlY2VpdmluZyBpbnRlcmFjdGlvbiBldmVuIHdoZW4gdGhlIHBvaW50ZXIgaGFzIG1vdmUgYXdheSBmcm9tIHRoZSBOb2RlXHJcbiAgICAgICAqIChidXQgcHJlc3VtYWJseSBpcyBzdGlsbCBkb3duIHNvbWV3aGVyZSBlbHNlIG9uIHRoZSBzY3JlZW4pLlxyXG4gICAgICAgKi9cclxuICAgICAgcHJpdmF0ZSBsb2NrSGlnaGxpZ2h0KCBuZXdGb2N1czogRm9jdXMsIGZvY3VzTWFuYWdlcjogRm9jdXNNYW5hZ2VyICk6IHZvaWQge1xyXG5cclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9wb2ludGVyID09PSBudWxsLFxyXG4gICAgICAgICAgJ0l0IHNob3VsZCBiZSBpbXBvc3NpYmxlIHRvIGFscmVhZHkgaGF2ZSBhIFBvaW50ZXIgYmVmb3JlIGxvY2tpbmcgZnJvbSB0b3VjaFNuYWcnICk7XHJcblxyXG4gICAgICAgIC8vIEEgQ09QWSBvZiB0aGUgZm9jdXMgaXMgc2F2ZWQgdG8gdGhlIFByb3BlcnR5IGJlY2F1c2Ugd2UgbmVlZCB0aGUgdmFsdWUgb2YgdGhlIFRyYWlsIGF0IHRoaXMgZXZlbnQuXHJcbiAgICAgICAgZm9jdXNNYW5hZ2VyLmxvY2tlZFBvaW50ZXJGb2N1c1Byb3BlcnR5LnNldCggbmV3IEZvY3VzKCBuZXdGb2N1cy5kaXNwbGF5LCBuZXdGb2N1cy50cmFpbC5jb3B5KCkgKSApO1xyXG5cclxuICAgICAgICAvLyBBdHRhY2ggYSBsaXN0ZW5lciB0aGF0IHdpbGwgY2xlYXIgdGhlIHBvaW50ZXIgYW5kIGl0cyBsaXN0ZW5lciBpZiB0aGUgbG9ja2VkUG9pbnRlckZvY3VzUHJvcGVydHkgaXMgY2xlYXJlZFxyXG4gICAgICAgIC8vIGV4dGVybmFsbHkgKG5vdCBieSBJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZykuXHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggIWZvY3VzTWFuYWdlci5sb2NrZWRQb2ludGVyRm9jdXNQcm9wZXJ0eS5oYXNMaXN0ZW5lciggdGhpcy5fYm91bmRQb2ludGVyRm9jdXNDbGVhcmVkTGlzdGVuZXIgKSxcclxuICAgICAgICAgICd0aGlzIGxpc3RlbmVyIHN0aWxsIG9uIHRoZSBsb2NrZWRQb2ludGVyRm9jdXNQcm9wZXJ0eSBpbmRpY2F0ZXMgYSBtZW1vcnkgbGVhaydcclxuICAgICAgICApO1xyXG4gICAgICAgIGZvY3VzTWFuYWdlci5sb2NrZWRQb2ludGVyRm9jdXNQcm9wZXJ0eS5saW5rKCB0aGlzLl9ib3VuZFBvaW50ZXJGb2N1c0NsZWFyZWRMaXN0ZW5lciApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogRm9jdXNNYW5hZ2VyLmxvY2tlZFBvaW50ZXJGb2N1c1Byb3BlcnR5IGRvZXMgbm90IGJlbG9uZyB0byBJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZyBhbmQgY2FuIGJlIGNsZWFyZWRcclxuICAgICAgICogZm9yIGFueSByZWFzb24uIElmIGl0IGlzIHNldCB0byBudWxsIHdoaWxlIGEgcG9pbnRlciBpcyBkb3duIHdlIG5lZWQgdG8gcmVsZWFzZSB0aGUgUG9pbnRlciBhbmQgcmVtb3ZlIGlucHV0XHJcbiAgICAgICAqIGxpc3RlbmVycy5cclxuICAgICAgICovXHJcbiAgICAgIHByaXZhdGUgaGFuZGxlTG9ja2VkUG9pbnRlckZvY3VzQ2xlYXJlZCggbG9ja2VkUG9pbnRlckZvY3VzOiBGb2N1cyB8IG51bGwgKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKCBsb2NrZWRQb2ludGVyRm9jdXMgPT09IG51bGwgKSB7XHJcbiAgICAgICAgICB0aGlzLl9vblBvaW50ZXJSZWxlYXNlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogQWRkIG9yIHJlbW92ZSBsaXN0ZW5lcnMgcmVsYXRlZCB0byBhY3RpdmF0aW5nIGludGVyYWN0aXZlIGhpZ2hsaWdodGluZyB3aGVuIHRoZSBmZWF0dXJlIGJlY29tZXMgZW5hYmxlZC5cclxuICAgICAgICogV29yayByZWxhdGVkIHRvIGludGVyYWN0aXZlIGhpZ2hsaWdodGluZyBpcyBhdm9pZGVkIHVubGVzcyB0aGUgZmVhdHVyZSBpcyBlbmFibGVkLlxyXG4gICAgICAgKi9cclxuICAgICAgcHJpdmF0ZSBfb25JbnRlcmFjdGl2ZUhpZ2hsaWdodGluZ0VuYWJsZWRDaGFuZ2UoIGZlYXR1cmVFbmFibGVkOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgICAgIC8vIE9ubHkgbGlzdGVuIHRvIHRoZSBhY3RpdmF0aW9uIGxpc3RlbmVyIGlmIHRoZSBmZWF0dXJlIGlzIGVuYWJsZWQgYW5kIGhpZ2hsaWdodGluZyBpcyBlbmFibGVkIGZvciB0aGlzIE5vZGUuXHJcbiAgICAgICAgY29uc3QgZW5hYmxlZCA9IGZlYXR1cmVFbmFibGVkICYmIHRoaXMuX2ludGVyYWN0aXZlSGlnaGxpZ2h0RW5hYmxlZDtcclxuXHJcbiAgICAgICAgY29uc3QgaGFzQWN0aXZhdGlvbkxpc3RlbmVyID0gdGhpcy5oYXNJbnB1dExpc3RlbmVyKCB0aGlzLl9hY3RpdmF0aW9uTGlzdGVuZXIgKTtcclxuICAgICAgICBpZiAoIGVuYWJsZWQgJiYgIWhhc0FjdGl2YXRpb25MaXN0ZW5lciApIHtcclxuICAgICAgICAgIHRoaXMuYWRkSW5wdXRMaXN0ZW5lciggdGhpcy5fYWN0aXZhdGlvbkxpc3RlbmVyICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCAhZW5hYmxlZCAmJiBoYXNBY3RpdmF0aW9uTGlzdGVuZXIgKSB7XHJcbiAgICAgICAgICB0aGlzLnJlbW92ZUlucHV0TGlzdGVuZXIoIHRoaXMuX2FjdGl2YXRpb25MaXN0ZW5lciApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgbm93IGRpc3BsYXllZCwgdGhlbiB3ZSBzaG91bGQgcmVjb21wdXRlIGlmIHdlIGFyZSBhY3RpdmUgb3Igbm90LlxyXG4gICAgICAgIHRoaXMuaGFuZGxlSGlnaGxpZ2h0QWN0aXZlQ2hhbmdlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBBZGQgdGhlIERpc3BsYXkgdG8gdGhlIGNvbGxlY3Rpb24gd2hlbiB0aGlzIE5vZGUgaXMgYWRkZWQgdG8gYSBzY2VuZSBncmFwaC4gQWxzbyBhZGRzIGxpc3RlbmVycyB0byB0aGVcclxuICAgICAgICogRGlzcGxheSB0aGF0IHR1cm5zIG9uIGhpZ2hsaWdodGluZyB3aGVuIHRoZSBmZWF0dXJlIGlzIGVuYWJsZWQuXHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgb25DaGFuZ2VkSW5zdGFuY2UoIGluc3RhbmNlOiBJbnN0YW5jZSwgYWRkZWQ6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggaW5zdGFuY2UudHJhaWwsICdzaG91bGQgaGF2ZSBhIHRyYWlsJyApO1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGluc3RhbmNlLmRpc3BsYXksICdzaG91bGQgaGF2ZSBhIGRpc3BsYXknICk7XHJcblxyXG4gICAgICAgIGNvbnN0IHVuaXF1ZUlkID0gaW5zdGFuY2UudHJhaWwhLnVuaXF1ZUlkO1xyXG5cclxuICAgICAgICBpZiAoIGFkZGVkICkge1xyXG4gICAgICAgICAgY29uc3QgZGlzcGxheSA9IGluc3RhbmNlLmRpc3BsYXkgYXMgRGlzcGxheTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm9uLW51bGxhYmxlLXR5cGUtYXNzZXJ0aW9uLXN0eWxlXHJcbiAgICAgICAgICB0aGlzLmRpc3BsYXlzWyB1bmlxdWVJZCBdID0gZGlzcGxheTtcclxuICAgICAgICAgIHRoaXMub25EaXNwbGF5QWRkZWQoIGRpc3BsYXkgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpbnN0YW5jZS5ub2RlLCAnc2hvdWxkIGhhdmUgYSBub2RlJyApO1xyXG4gICAgICAgICAgY29uc3QgZGlzcGxheSA9IHRoaXMuZGlzcGxheXNbIHVuaXF1ZUlkIF07XHJcbiAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBkaXNwbGF5LCBgaW50ZXJhY3RpdmUgaGlnaGxpZ2h0aW5nIGRvZXMgbm90IGhhdmUgYSBEaXNwbGF5IGZvciByZW1vdmVkIGluc3RhbmNlOiAke3VuaXF1ZUlkfWAgKTtcclxuXHJcbiAgICAgICAgICAvLyBJZiB0aGUgbm9kZSB3YXMgZGlzcG9zZWQsIHRoaXMgZGlzcGxheSByZWZlcmVuY2UgaGFzIGFscmVhZHkgYmVlbiBjbGVhbmVkIHVwLCBidXQgaW5zdGFuY2VzIGFyZSB1cGRhdGVkXHJcbiAgICAgICAgICAvLyAoZGlzcG9zZWQpIG9uIHRoZSBuZXh0IGZyYW1lIGFmdGVyIHRoZSBub2RlIHdhcyBkaXNwb3NlZC4gT25seSB1bmxpbmsgaWYgdGhlcmUgYXJlIG5vIG1vcmUgaW5zdGFuY2VzIG9mXHJcbiAgICAgICAgICAvLyB0aGlzIG5vZGU7XHJcbiAgICAgICAgICBpbnN0YW5jZS5ub2RlIS5pbnN0YW5jZXMubGVuZ3RoID09PSAwICYmIHRoaXMub25EaXNwbGF5UmVtb3ZlZCggZGlzcGxheSApO1xyXG4gICAgICAgICAgZGVsZXRlIHRoaXMuZGlzcGxheXNbIHVuaXF1ZUlkIF07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogUmV0dXJucyB0cnVlIGlmIGFueSBub2RlcyBmcm9tIHRoaXMgTm9kZSB0byB0aGUgbGVhZiBvZiB0aGUgVHJhaWwgdXNlIFZvaWNpbmcgZmVhdHVyZXMgaW4gc29tZSB3YXkuIEluXHJcbiAgICAgICAqIGdlbmVyYWwsIHdlIGRvIG5vdCB3YW50IHRvIGFjdGl2YXRlIHZvaWNpbmcgZmVhdHVyZXMgaW4gdGhpcyBjYXNlIGJlY2F1c2UgdGhlIGxlYWYtbW9zdCBOb2RlcyBpbiB0aGUgVHJhaWxcclxuICAgICAgICogc2hvdWxkIGJlIGFjdGl2YXRlZCBpbnN0ZWFkLlxyXG4gICAgICAgKiBAbWl4aW4tcHJvdGVjdGVkIC0gbWFkZSBwdWJsaWMgZm9yIHVzZSBpbiB0aGUgbWl4aW4gb25seVxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIGdldERlc2NlbmRhbnRzVXNlSGlnaGxpZ2h0aW5nKCB0cmFpbDogVHJhaWwgKTogYm9vbGVhbiB7XHJcbiAgICAgICAgY29uc3QgaW5kZXhPZlNlbGYgPSB0cmFpbC5ub2Rlcy5pbmRleE9mKCB0aGlzICk7XHJcblxyXG4gICAgICAgIC8vIGFsbCB0aGUgd2F5IHRvIGxlbmd0aCwgZW5kIG5vdCBpbmNsdWRlZCBpbiBzbGljZSAtIGFuZCBpZiBzdGFydCB2YWx1ZSBpcyBncmVhdGVyIHRoYW4gaW5kZXggcmFuZ2VcclxuICAgICAgICAvLyBhbiBlbXB0eSBhcnJheSBpcyByZXR1cm5lZFxyXG4gICAgICAgIGNvbnN0IGNoaWxkVG9MZWFmTm9kZXMgPSB0cmFpbC5ub2Rlcy5zbGljZSggaW5kZXhPZlNlbGYgKyAxLCB0cmFpbC5ub2Rlcy5sZW5ndGggKTtcclxuXHJcbiAgICAgICAgLy8gaWYgYW55IG9mIHRoZSBub2RlcyBmcm9tIGxlYWYgdG8gc2VsZiB1c2UgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmcsIHRoZXkgc2hvdWxkIHJlY2VpdmUgaW5wdXQsIGFuZCB3ZSBzaG91bGRuJ3RcclxuICAgICAgICAvLyBzcGVhayB0aGUgY29udGVudCBmb3IgdGhpcyBOb2RlXHJcbiAgICAgICAgbGV0IGRlc2NlbmRhbnRzVXNlVm9pY2luZyA9IGZhbHNlO1xyXG4gICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGNoaWxkVG9MZWFmTm9kZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICBpZiAoICggY2hpbGRUb0xlYWZOb2Rlc1sgaSBdIGFzIEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nTm9kZSApLmlzSW50ZXJhY3RpdmVIaWdobGlnaHRpbmcgKSB7XHJcbiAgICAgICAgICAgIGRlc2NlbmRhbnRzVXNlVm9pY2luZyA9IHRydWU7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGRlc2NlbmRhbnRzVXNlVm9pY2luZztcclxuICAgICAgfVxyXG5cclxuICAgICAgcHVibGljIG92ZXJyaWRlIG11dGF0ZSggb3B0aW9ucz86IFNlbGZPcHRpb25zICYgUGFyYW1ldGVyczxJbnN0YW5jZVR5cGU8U3VwZXJUeXBlPlsgJ211dGF0ZScgXT5bIDAgXSApOiB0aGlzIHtcclxuICAgICAgICByZXR1cm4gc3VwZXIubXV0YXRlKCBvcHRpb25zICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgLyoqXHJcbiAgICoge0FycmF5LjxzdHJpbmc+fSAtIFN0cmluZyBrZXlzIGZvciBhbGwgdGhlIGFsbG93ZWQgb3B0aW9ucyB0aGF0IHdpbGwgYmUgc2V0IGJ5IE5vZGUubXV0YXRlKCBvcHRpb25zICksIGluXHJcbiAgICogdGhlIG9yZGVyIHRoZXkgd2lsbCBiZSBldmFsdWF0ZWQuXHJcbiAgICpcclxuICAgKiBOT1RFOiBTZWUgTm9kZSdzIF9tdXRhdG9yS2V5cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uIG9uIGhvdyB0aGlzIG9wZXJhdGVzLCBhbmQgcG90ZW50aWFsIHNwZWNpYWxcclxuICAgKiAgICAgICBjYXNlcyB0aGF0IG1heSBhcHBseS5cclxuICAgKi9cclxuICBJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZ0NsYXNzLnByb3RvdHlwZS5fbXV0YXRvcktleXMgPSBJTlRFUkFDVElWRV9ISUdITElHSFRJTkdfT1BUSU9OUy5jb25jYXQoIEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nQ2xhc3MucHJvdG90eXBlLl9tdXRhdG9yS2V5cyApO1xyXG5cclxuICBhc3NlcnQgJiYgYXNzZXJ0KCBJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZ0NsYXNzLnByb3RvdHlwZS5fbXV0YXRvcktleXMubGVuZ3RoID09PVxyXG4gICAgICAgICAgICAgICAgICAgIF8udW5pcSggSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdDbGFzcy5wcm90b3R5cGUuX211dGF0b3JLZXlzICkubGVuZ3RoLFxyXG4gICAgJ2R1cGxpY2F0ZSBtdXRhdG9yIGtleXMgaW4gSW50ZXJhY3RpdmVIaWdobGlnaHRpbmcnICk7XHJcblxyXG4gIHJldHVybiBJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZ0NsYXNzO1xyXG59ICk7XHJcblxyXG5leHBvcnQgdHlwZSBJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZ05vZGUgPSBOb2RlICYgVEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nO1xyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ0ludGVyYWN0aXZlSGlnaGxpZ2h0aW5nJywgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmcgKTtcclxuZXhwb3J0IGRlZmF1bHQgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmc7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFdBQVcsTUFBTSxvQ0FBb0M7QUFHNUQsU0FBU0MsYUFBYSxFQUFXQyxLQUFLLEVBQTBCQyxJQUFJLEVBQVdDLE9BQU8sUUFBNkMsa0JBQWtCO0FBR3JKLE9BQU9DLE9BQU8sTUFBTSxxQ0FBcUM7QUFFekQsT0FBT0MsWUFBWSxNQUFNLHFDQUFxQzs7QUFFOUQ7QUFDQTtBQUNBLE1BQU1DLGdDQUFnQyxHQUFHLENBQ3ZDLHNCQUFzQixFQUN0QiwrQkFBK0IsRUFDL0IsNkJBQTZCLENBQzlCO0FBa0NELE1BQU1DLHVCQUF1QixHQUFHSCxPQUFPLENBQXlDSSxJQUFlLElBQXlEO0VBRXRKO0VBQ0FDLE1BQU0sSUFBSUEsTUFBTSxDQUFFLENBQUNELElBQUksQ0FBQ0UsNkJBQTZCLEVBQUUsdURBQXdELENBQUM7RUFFaEgsTUFBTUMsNEJBQTRCLEdBQUdYLGFBQWEsQ0FBRSw4QkFBOEIsRUFBRU0sZ0NBQWdDLEVBQ2xILE1BQU1LLDRCQUE0QixTQUFTSCxJQUFJLENBQXFDO0lBRWxGO0lBQ0E7SUFDQTs7SUFHQTtJQUNBO0lBQ0E7SUFDUUksUUFBUSxHQUFtQixJQUFJOztJQUV2QztJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDT0MsUUFBUSxHQUE0QixDQUFDLENBQUM7O0lBRTdDO0lBQ0E7SUFDUUMscUJBQXFCLEdBQWMsSUFBSTs7SUFFL0M7SUFDQTtJQUNBO0lBQ0E7SUFDUUMsOEJBQThCLEdBQUcsS0FBSzs7SUFFOUM7SUFDQTtJQUNRQyw0QkFBNEIsR0FBRyxJQUFJOztJQUUzQztJQUNPQyxrQ0FBa0MsR0FBYSxJQUFJbEIsV0FBVyxDQUFDLENB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