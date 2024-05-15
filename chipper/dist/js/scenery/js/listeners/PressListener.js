// Copyright 2017-2024, University of Colorado Boulder

/**
 * Listens to presses (down events), attaching a listener to the pointer when one occurs, so that a release (up/cancel
 * or interruption) can be recorded.
 *
 * This is the base type for both DragListener and FireListener, which contains the shared logic that would be needed
 * by both.
 *
 * PressListener is fine to use directly, particularly when drag-coordinate information is needed (e.g. DragListener),
 * or if the interaction is more complicated than a simple button fire (e.g. FireListener).
 *
 * For example usage, see scenery/examples/input.html. Additionally, a typical "simple" PressListener direct usage
 * would be something like:
 *
 *   someNode.addInputListener( new PressListener( {
 *     press: () => { ... },
 *     release: () => { ... }
 *   } ) );
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import PhetioAction from '../../../tandem/js/PhetioAction.js';
import BooleanProperty from '../../../axon/js/BooleanProperty.js';
import DerivedProperty from '../../../axon/js/DerivedProperty.js';
import EnabledComponent from '../../../axon/js/EnabledComponent.js';
import createObservableArray from '../../../axon/js/createObservableArray.js';
import stepTimer from '../../../axon/js/stepTimer.js';
import optionize from '../../../phet-core/js/optionize.js';
import EventType from '../../../tandem/js/EventType.js';
import PhetioObject from '../../../tandem/js/PhetioObject.js';
import Tandem from '../../../tandem/js/Tandem.js';
import NullableIO from '../../../tandem/js/types/NullableIO.js';
import { Mouse, Node, scenery, SceneryEvent } from '../imports.js';
// global
let globalID = 0;

// Factor out to reduce memory footprint, see https://github.com/phetsims/tandem/issues/71
const truePredicate = _.constant(true);
const isPressedListener = listener => listener.isPressed;
export default class PressListener extends EnabledComponent {
  // Unique global ID for this listener

  // Contains all pointers that are over our button. Tracked by adding with 'enter' events and removing with 'exit'
  // events.

  // (read-only) - Tracks whether this listener is "pressed" or not.

  // (read-only) - It will be set to true when at least one pointer is over the listener.
  // This is not effected by PDOM focus.

  // (read-only) - True when either isOverProperty is true, or when focused and the
  // related Display is showing its focusHighlights, see this.validateOver() for details.

  // (read-only) - It will be set to true when either:
  //   1. The listener is pressed and the pointer that is pressing is over the listener.
  //   2. There is at least one unpressed pointer that is over the listener.

  // (read-only) - It will be set to true when either:
  //   1. The listener is pressed.
  //   2. There is at least one unpressed pointer that is over the listener.
  // This is essentially true when ( isPressed || isHovering ).

  // (read-only) - Whether the listener has focus (should appear to be over)

  // (read-only) - The current pointer, or null when not pressed. There can be short periods of
  // time when this has a value when isPressedProperty.value is false, such as during the processing of a pointer
  // release, but these periods should be very brief.

  // (read-only) - The Trail for the press, with no descendant nodes past the currentTarget
  // or targetNode (if provided). Will generally be null when not pressed, though there can be short periods of time
  // where this has a value when isPressedProperty.value is false, such as during the processing of a release, but
  // these periods should be very brief.

  //(read-only) - Whether the last press was interrupted. Will be valid until the next press.

  // For the collapseDragEvents feature, this will hold the last pending drag event to trigger a call to drag() with,
  // if one has been skipped.

  // Whether our pointer listener is referenced by the pointer (need to have a flag due to handling disposal properly).

  // isHoveringProperty updates (not a DerivedProperty because we need to hook to passed-in properties)

  // isHighlightedProperty updates (not a DerivedProperty because we need to hook to passed-in properties)

  // (read-only) - Whether a press is being processed from a pdom click input event from the PDOM.

  // (read-only) - This Property was added to support input from the PDOM. It tracks whether
  // or not the button should "look" down. This will be true if downProperty is true or if a pdom click is in
  // progress. For a click event from the pdom, the listeners are fired right away but the button will look down for
  // as long as a11yLooksPressedInterval. See PressListener.click() for more details.

  // When pdom clicking begins, this will be added to a timeout so that the
  // pdomClickingProperty is updated after some delay. This is required since an assistive device (like a switch) may
  // send "click" events directly instead of keydown/keyup pairs. If a click initiates while already in progress,
  // this listener will be removed to start the timeout over. null until timout is added.

  // The listener that gets added to the pointer when we are pressed

  // Executed on press event
  // The main implementation of "press" handling is implemented as a callback to the PhetioAction, so things are nested
  // nicely for phet-io.

  // Executed on release event
  // The main implementation of "release" handling is implemented as a callback to the PhetioAction, so things are nested
  // nicely for phet-io.

  // To support looksOverProperty being true based on focus, we need to monitor the display from which
  // the event has come from to see if that display is showing its focusHighlights, see
  // Display.prototype.focusManager.FocusManager.pdomFocusHighlightsVisibleProperty for details.

  // we need the same exact function to add and remove as a listener

  constructor(providedOptions) {
    const options = optionize()({
      press: _.noop,
      release: _.noop,
      targetNode: null,
      drag: _.noop,
      attach: true,
      mouseButton: 0,
      pressCursor: 'pointer',
      useInputListenerCursor: false,
      canStartPress: truePredicate,
      a11yLooksPressedInterval: 100,
      collapseDragEvents: false,
      // EnabledComponent
      // By default, PressListener does not have an instrumented enabledProperty, but you can opt in with this option.
      phetioEnabledPropertyInstrumented: false,
      // phet-io (EnabledComponent)
      // For PhET-iO instrumentation. If only using the PressListener for hover behavior, there is no need to
      // instrument because events are only added to the data stream for press/release and not for hover events. Please pass
      // Tandem.OPT_OUT as the tandem option to not instrument an instance.
      tandem: Tandem.REQUIRED,
      phetioReadOnly: true,
      phetioFeatured: PhetioObject.DEFAULT_OPTIONS.phetioFeatured
    }, providedOptions);
    assert && assert(typeof options.mouseButton === 'number' && options.mouseButton >= 0 && options.mouseButton % 1 === 0, 'mouseButton should be a non-negative integer');
    assert && assert(options.pressCursor === null || typeof options.pressCursor === 'string', 'pressCursor should either be a string or null');
    assert && assert(typeof options.press === 'function', 'The press callback should be a function');
    assert && assert(typeof options.release === 'function', 'The release callback should be a function');
    assert && assert(typeof options.drag === 'function', 'The drag callback should be a function');
    assert && assert(options.targetNode === null || options.targetNode instanceof Node, 'If provided, targetNode should be a Node');
    assert && assert(typeof options.attach === 'boolean', 'attach should be a boolean');
    assert && assert(typeof options.a11yLooksPressedInterval === 'number', 'a11yLooksPressedInterval should be a number');
    super(options);
    this._id = globalID++;
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener(`PressListener#${this._id} construction`);
    this._mouseButton = options.mouseButton;
    this._a11yLooksPressedInterval = options.a11yLooksPressedInterval;
    this._pressCursor = options.pressCursor;
    this._pressListener = options.press;
    this._releaseListener = options.release;
    this._dragListener = options.drag;
    this._canStartPress = options.canStartPress;
    this._targetNode = options.targetNode;
    this._attach = options.attach;
    this._collapseDragEvents = options.collapseDragEvents;
    this.overPointers = createObservableArray();
    this.isPressedProperty = new BooleanProperty(false, {
      reentrant: true
    });
    this.isOverProperty = new BooleanProperty(false);
    this.looksOverProperty = new BooleanProperty(false);
    this.isHoveringProperty = new BooleanProperty(false);
    this.isHighlightedProperty = new BooleanProperty(false);
    this.isFocusedProperty = new BooleanProperty(false);
    this.cursorProperty = new DerivedProperty([this.enabledProperty], enabled => {
      if (options.useInputListenerCursor && enabled && this._attach) {
        return this._pressCursor;
      } else {
        return null;
      }
    });
    this.pointer = null;
    this.pressedTrail = null;
    this.interrupted = false;
    this._pendingCollapsedDragEvent = null;
    this._listeningToPointer = false;
    this._isHoveringListener = this.invalidateHovering.bind(this);
    this._isHighlightedListener = this.invalidateHighlighted.bind(this);
    this.pdomClickingProperty = new BooleanProperty(false);
    this.looksPressedProperty = DerivedProperty.or([this.pdomClickingProperty, this.isPressedProperty]);
    this._pdomClickingTimeoutListener = null;
    this._pointerListener = {
      up: this.pointerUp.bind(this),
      cancel: this.pointerCancel.bind(this),
      move: this.pointerMove.bind(this),
      interrupt: this.pointerInterrupt.bind(this),
      listener: this
    };
    this._pressAction = new PhetioAction(this.onPress.bind(this), {
      tandem: options.tandem.createTandem('pressAction'),
      phetioDocumentation: 'Executes whenever a press occurs. The first argument when executing can be ' + 'used to convey info about the SceneryEvent.',
      phetioReadOnly: true,
      phetioFeatured: options.phetioFeatured,
      phetioEventType: EventType.USER,
      parameters: [{
        name: 'event',
        phetioType: SceneryEvent.SceneryEventIO
      }, {
        phetioPrivate: true,
        valueType: [Node, null]
      }, {
        phetioPrivate: true,
        valueType: ['function', null]
      }]
    });
    this._releaseAction = new PhetioAction(this.onRelease.bind(this), {
      parameters: [{
        name: 'event',
        phetioType: NullableIO(SceneryEvent.SceneryEventIO)
      }, {
        phetioPrivate: true,
        valueType: ['function', null]
      }],
      // phet-io
      tandem: options.tandem.createTandem('releaseAction'),
      phetioDocumentation: 'Executes whenever a release occurs.',
      phetioReadOnly: true,
      phetioFeatured: options.phetioFeatured,
      phetioEventType: EventType.USER
    });
    this.display = null;
    this.boundInvalidateOverListener = this.invalidateOver.bind(this);

    // update isOverProperty (not a DerivedProperty because we need to hook to passed-in properties)
    this.overPointers.lengthProperty.link(this.invalidateOver.bind(this));
    this.isFocusedProperty.link(this.invalidateOver.bind(this));

    // update isHoveringProperty (not a DerivedProperty because we need to hook to passed-in properties)
    this.overPointers.lengthProperty.link(this._isHoveringListener);
    this.isPressedProperty.link(this._isHoveringListener);

    // Update isHovering when any pointer's isDownProperty changes.
    // NOTE: overPointers is cleared on dispose, which should remove all of these (interior) listeners)
    this.overPointers.addItemAddedListener(pointer => pointer.isDownProperty.link(this._isHoveringListener));
    this.overPointers.addItemRemovedListener(pointer => pointer.isDownProperty.unlink(this._isHoveringListener));

    // update isHighlightedProperty (not a DerivedProperty because we need to hook to passed-in properties)
    this.isHoveringProperty.link(this._isHighlightedListener);
    this.isPressedProperty.link(this._isHighlightedListener);
    this.enabledProperty.lazyLink(this.onEnabledPropertyChange.bind(this));
  }

  /**
   * Whether this listener is currently activated with a press.
   */
  get isPressed() {
    return this.isPressedProperty.value;
  }
  get cursor() {
    return this.cursorProperty.value;
  }
  get attach() {
    return this._attach;
  }
  get targetNode() {
    return this._targetNode;
  }

  /**
   * The main node that this listener is responsible for dragging.
   */
  getCurrentTarget() {
    assert && assert(this.isPressed, 'We have no currentTarget if we are not pressed');
    return this.pressedTrail.lastNode();
  }
  get currentTarget() {
    return this.getCurrentTarget();
  }

  /**
   * Returns whether a press can be started with a particular event.
   */
  canPress(event) {
    return !!this.enabledProperty.value && !this.isPressed && this._canStartPress(event, this) && (
    // Only let presses be started with the correct mouse button.
    // @ts-expect-error Typed SceneryEvent
    !(event.pointer instanceof Mouse) || event.domEvent.button === this._mouseButton) && (
    // We can't attach to a pointer that is already attached.
    !this._attach || !event.pointer.isAttached());
  }

  /**
   * Returns whether this PressListener can be clicked from keyboard input. This copies part of canPress, but
   * we didn't want to use canClick in canPress because canClick could be overridden in subtypes.
   */
  canClick() {
    // If this listener is already involved in pressing something (or our options predicate returns false) we can't
    // press something.
    return this.enabledProperty.value && !this.isPressed && this._canStartPress(null, this);
  }

  /**
   * Moves the listener to the 'pressed' state if possible (attaches listeners and initializes press-related
   * properties).
   *
   * This can be overridden (with super-calls) when custom press behavior is needed for a type.
   *
   * This can be called by outside clients in order to try to begin a process (generally on an already-pressed
   * pointer), and is useful if a 'drag' needs to change between listeners. Use canPress( event ) to determine if
   * a press can be started (if needed beforehand).
   *
   * @param event
   * @param [targetNode] - If provided, will take the place of the targetNode for this call. Useful for
   *                              forwarded presses.
   * @param [callback] - to be run at the end of the function, but only on success
   * @returns success - Returns whether the press was actually started
   */
  press(event, targetNode, callback) {
    assert && assert(event, 'An event is required');
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener(`PressListener#${this._id} press`);
    if (!this.canPress(event)) {
      sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener(`PressListener#${this._id} could not press`);
      return false;
    }

    // Flush out a pending drag, so it happens before we press
    this.flushCollapsedDrag();
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener(`PressListener#${this._id} successful press`);
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();
    this._pressAction.execute(event, targetNode || null, callback || null); // cannot pass undefined into execute call

    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
    return true;
  }

  /**
   * Releases a pressed listener.
   *
   * This can be overridden (with super-calls) when custom release behavior is needed for a type.
   *
   * This can be called from the outside to release the press without the pointer having actually fired any 'up'
   * events. If the cancel/interrupt behavior is more preferable, call interrupt() on this listener instead.
   *
   * @param [event] - scenery event if there was one. We can't guarantee an event, in part to support interrupting.
   * @param [callback] - called at the end of the release
   */
  release(event, callback) {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener(`PressListener#${this._id} release`);
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();

    // Flush out a pending drag, so it happens before we release
    this.flushCollapsedDrag();
    this._releaseAction.execute(event || null, callback || null); // cannot pass undefined to execute call

    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Called when move events are fired on the attached pointer listener.
   *
   * This can be overridden (with super-calls) when custom drag behavior is needed for a type.
   *
   * (scenery-internal, effectively protected)
   */
  drag(event) {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener(`PressListener#${this._id} drag`);
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();
    assert && assert(this.isPressed, 'Can only drag while pressed');
    this._dragListener(event, this);
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Interrupts the listener, releasing it (canceling behavior).
   *
   * This effectively releases/ends the press, and sets the `interrupted` flag to true while firing these events
   * so that code can determine whether a release/end happened naturally, or was canceled in some way.
   *
   * This can be called manually, but can also be called through node.interruptSubtreeInput().
   */
  interrupt() {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener(`PressListener#${this._id} interrupt`);
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();

    // handle pdom interrupt
    if (this.pdomClickingProperty.value) {
      this.interrupted = true;

      // it is possible we are interrupting a click with a pointer press, in which case
      // we are listening to the Pointer listener - do a full release in this case
      if (this._listeningToPointer) {
        this.release();
      } else {
        // release on interrupt (without going through onRelease, which handles mouse/touch specific things)
        this.isPressedProperty.value = false;
        this._releaseListener(null, this);
      }

      // clear the clicking timer, specific to pdom input
      // @ts-expect-error TODO: This looks buggy, will need to ignore for now https://github.com/phetsims/scenery/issues/1581
      if (stepTimer.hasListener(this._pdomClickingTimeoutListener)) {
        // @ts-expect-error TODO: This looks buggy, will need to ignore for now https://github.com/phetsims/scenery/issues/1581
        stepTimer.clearTimeout(this._pdomClickingTimeoutListener);

        // interrupt may be called after the PressListener has been disposed (for instance, internally by scenery
        // if the Node receives a blur event after the PressListener is disposed)
        if (!this.pdomClickingProperty.isDisposed) {
          this.pdomClickingProperty.value = false;
        }
      }
    } else if (this.isPressed) {
      // handle pointer interrupt
      sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener(`PressListener#${this._id} interrupting`);
      this.interrupted = true;
      this.release();
    }
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * This should be called when the listened "Node" is effectively removed from the scene graph AND
   * expected to be placed back in such that it could potentially get multiple "enter" events, see
   * https://github.com/phetsims/scenery/issues/1021
   *
   * This will clear the list of pointers considered "over" the Node, so that when it is placed back in, the state
   * will be correct, and another "enter" event will not be missing an "exit".
   */
  clearOverPointers() {
    this.overPointers.clear(); // We have listeners that will trigger the proper refreshes
  }

  /**
   * If collapseDragEvents is set to true, this step() should be called every frame so that the collapsed drag
   * can be fired.
   */
  step() {
    this.flushCollapsedDrag();
  }

  /**
   * Set the callback that will create a Bounds2 in the global coordinate frame for the AnimatedPanZoomListener to
   * keep in view during a drag operation. During drag input the AnimatedPanZoomListener will pan the screen to
   * try and keep the returned Bounds2 visible. By default, the AnimatedPanZoomListener will try to keep the target of
   * the drag in view but that may not always work if the target is not associated with the translated Node, the target
   * is not defined, or the target has bounds that do not accurately surround the graphic you want to keep in view.
   */
  setCreatePanTargetBounds(createDragPanTargetBounds) {
    // Forwarded to the pointerListener so that the AnimatedPanZoomListener can get this callback from the attached
    // listener
    this._pointerListener.createPanTargetBounds = createDragPanTargetBounds;
  }
  set createPanTargetBounds(createDragPanTargetBounds) {
    this.setCreatePanTargetBounds(createDragPanTargetBounds);
  }

  /**
   * A convenient way to create and set the callback that will return a Bounds2 in the global coordinate frame for the
   * AnimatedPanZoomListener to keep in view during a drag operation. The AnimatedPanZoomListener will try to keep the
   * bounds of the last Node of the provided trail visible by panning the screen during a drag operation. See
   * setCreatePanTargetBounds() for more documentation.
   */
  setCreatePanTargetBoundsFromTrail(trail) {
    assert && assert(trail.length > 0, 'trail has no Nodes to provide localBounds');
    this.setCreatePanTargetBounds(() => trail.localToGlobalBounds(trail.lastNode().localBounds));
  }
  set createPanTargetBoundsFromTrail(trail) {
    this.setCreatePanTargetBoundsFromTrail(trail);
  }

  /**
   * If there is a pending collapsed drag waiting, we'll fire that drag (usually before other events or during a step)
   */
  flushCollapsedDrag() {
    if (this._pendingCollapsedDragEvent) {
      this.drag(this._pendingCollapsedDragEvent);
    }
    this._pendingCollapsedDragEvent = null;
  }

  /**
   * Recomputes the value for isOverProperty. Separate to reduce anonymous function closures.
   */
  invalidateOver() {
    let pointerAttachedToOther = false;
    if (this._listeningToPointer) {
      // this pointer listener is attached to the pointer
      pointerAttachedToOther = false;
    } else {
      // a listener other than this one is attached to the pointer so it should not be considered over
      for (let i = 0; i < this.overPointers.length; i++) {
        if (this.overPointers.get(i).isAttached()) {
          pointerAttachedToOther = true;
          break;
        }
      }
    }

    // isOverProperty is only for the `over` event, looksOverProperty includes focused pressListeners (only when the
    // display is showing focus highlights)
    this.isOverProperty.value = this.overPointers.length > 0 && !pointerAttachedToOther;
    this.looksOverProperty.value = this.isOverProperty.value || this.isFocusedProperty.value && !!this.display && this.display.focusManager.pdomFocusHighlightsVisibleProperty.value;
  }

  /**
   * Recomputes the value for isHoveringProperty. Separate to reduce anonymous function closures.
   */
  invalidateHovering() {
    for (let i = 0; i < this.overPointers.length; i++) {
      const pointer = this.overPointers[i];
      if (!pointer.isDown || pointer === this.pointer) {
        this.isHoveringProperty.value = true;
        return;
      }
    }
    this.isHoveringProperty.value = false;
  }

  /**
   * Recomputes the value for isHighlightedProperty. Separate to reduce anonymous function closures.
   */
  invalidateHighlighted() {
    this.isHighlightedProperty.value = this.isHoveringProperty.value || this.isPressedProperty.value;
  }

  /**
   * Fired when the enabledProperty changes
   */
  onEnabledPropertyChange(enabled) {
    !enabled && this.interrupt();
  }

  /**
   * Internal code executed as the first step of a press.
   *
   * @param event
   * @param [targetNode] - If provided, will take the place of the targetNode for this call. Useful for
   *                              forwarded presses.
   * @param [callback] - to be run at the end of the function, but only on success
   */
  onPress(event, targetNode, callback) {
    assert && assert(!this.isDisposed, 'Should not press on a disposed listener');
    const givenTargetNode = targetNode || this._targetNode;

    // Set this properties before the property change, so they are visible to listeners.
    this.pointer = event.pointer;
    this.pressedTrail = givenTargetNode ? givenTargetNode.getUniqueTrail() : event.trail.subtrailTo(event.currentTarget, false);
    this.interrupted = false; // clears the flag (don't set to false before here)

    this.pointer.addInputListener(this._pointerListener, this._attach);
    this._listeningToPointer = true;
    this.pointer.cursor = this.pressedTrail.lastNode().getEffectiveCursor() || this._pressCursor;
    this.isPressedProperty.value = true;

    // Notify after everything else is set up
    this._pressListener(event, this);
    callback && callback();
  }

  /**
   * Internal code executed as the first step of a release.
   *
   * @param event - scenery event if there was one
   * @param [callback] - called at the end of the release
   */
  onRelease(event, callback) {
    assert && assert(this.isPressed, 'This listener is not pressed');
    const pressedListener = this;
    pressedListener.pointer.removeInputListener(this._pointerListener);
    this._listeningToPointer = false;

    // Set the pressed state false *before* invoking the callback, otherwise an infinite loop can result in some
    // circumstances.
    this.isPressedProperty.value = false;

    // Notify after the rest of release is called in order to prevent it from triggering interrupt().
    this._releaseListener(event, this);
    callback && callback();

    // These properties are cleared now, at the end of the onRelease, in case they were needed by the callback or in
    // listeners on the pressed Property.
    pressedListener.pointer.cursor = null;
    this.pointer = null;
    this.pressedTrail = null;
  }

  /**
   * Called with 'down' events (part of the listener API). (scenery-internal)
   *
   * NOTE: Do not call directly. See the press method instead.
   */
  down(event) {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener(`PressListener#${this._id} down`);
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();
    this.press(event);
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Called with 'up' events (part of the listener API). (scenery-internal)
   *
   * NOTE: Do not call directly.
   */
  up(event) {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener(`PressListener#${this._id} up`);
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();

    // Recalculate over/hovering Properties.
    this.invalidateOver();
    this.invalidateHovering();
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Called with 'enter' events (part of the listener API). (scenery-internal)
   *
   * NOTE: Do not call directly.
   */
  enter(event) {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener(`PressListener#${this._id} enter`);
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();
    this.overPointers.push(event.pointer);
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Called with `move` events (part of the listener API). It is necessary to check for `over` state changes on move
   * in case a pointer listener gets interrupted and resumes movement over a target. (scenery-internal)
   */
  move(event) {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener(`PressListener#${this._id} move`);
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();
    this.invalidateOver();
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Called with 'exit' events (part of the listener API). (scenery-internal)
   *
   * NOTE: Do not call directly.
   */
  exit(event) {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener(`PressListener#${this._id} exit`);
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();

    // NOTE: We don't require the pointer to be included here, since we may have added the listener after the 'enter'
    // was fired. See https://github.com/phetsims/area-model-common/issues/159 for more details.
    if (this.overPointers.includes(event.pointer)) {
      this.overPointers.remove(event.pointer);
    }
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Called with 'up' events from the pointer (part of the listener API) (scenery-internal)
   *
   * NOTE: Do not call directly.
   */
  pointerUp(event) {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener(`PressListener#${this._id} pointer up`);
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();

    // Since our callback can get queued up and THEN interrupted before this happens, we'll check to make sure we are
    // still pressed by the time we get here. If not pressed, then there is nothing to do.
    // See https://github.com/phetsims/capacitor-lab-basics/issues/251
    if (this.isPressed) {
      assert && assert(event.pointer === this.pointer);
      this.release(event);
    }
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Called with 'cancel' events from the pointer (part of the listener API) (scenery-internal)
   *
   * NOTE: Do not call directly.
   */
  pointerCancel(event) {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener(`PressListener#${this._id} pointer cancel`);
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();

    // Since our callback can get queued up and THEN interrupted before this happens, we'll check to make sure we are
    // still pressed by the time we get here. If not pressed, then there is nothing to do.
    // See https://github.com/phetsims/capacitor-lab-basics/issues/251
    if (this.isPressed) {
      assert && assert(event.pointer === this.pointer);
      this.interrupt(); // will mark as interrupted and release()
    }
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Called with 'move' events from the pointer (part of the listener API) (scenery-internal)
   *
   * NOTE: Do not call directly.
   */
  pointerMove(event) {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener(`PressListener#${this._id} pointer move`);
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();

    // Since our callback can get queued up and THEN interrupted before this happens, we'll check to make sure we are
    // still pressed by the time we get here. If not pressed, then there is nothing to do.
    // See https://github.com/phetsims/capacitor-lab-basics/issues/251
    if (this.isPressed) {
      assert && assert(event.pointer === this.pointer);
      if (this._collapseDragEvents) {
        this._pendingCollapsedDragEvent = event;
      } else {
        this.drag(event);
      }
    }
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Called when the pointer needs to interrupt its current listener (usually so another can be added). (scenery-internal)
   *
   * NOTE: Do not call directly.
   */
  pointerInterrupt() {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener(`PressListener#${this._id} pointer interrupt`);
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();
    this.interrupt();
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Click listener, called when this is treated as an accessible input listener.
   * In general not needed to be public, but just used in edge cases to get proper click logic for pdom.
   *
   * Handle the click event from DOM for PDOM. Clicks by calling press and release immediately.
   * When assistive technology is used, the browser may not receive 'keydown' or 'keyup' events on input elements, but
   * only a single 'click' event. We need to toggle the pressed state from the single 'click' event.
   *
   * This will fire listeners immediately, but adds a delay for the pdomClickingProperty so that you can make a
   * button look pressed from a single DOM click event. For example usage, see sun/ButtonModel.looksPressedProperty.
   *
   * @param event
   * @param [callback] optionally called immediately after press, but only on successful click
   * @returns success - Returns whether the press was actually started
   */
  click(event, callback) {
    if (this.canClick()) {
      this.interrupted = false; // clears the flag (don't set to false before here)

      this.pdomClickingProperty.value = true;

      // ensure that button is 'focused' so listener can be called while button is down
      this.isFocusedProperty.value = true;
      this.isPressedProperty.value = true;

      // fire the optional callback
      // @ts-expect-error
      this._pressListener(event, this);
      callback && callback();

      // no longer down, don't reset 'over' so button can be styled as long as it has focus
      this.isPressedProperty.value = false;

      // fire the callback from options
      this._releaseListener(event, this);

      // if we are already clicking, remove the previous timeout - this assumes that clearTimeout is a noop if the
      // listener is no longer attached
      // @ts-expect-error TODO: This looks buggy, will need to ignore for now https://github.com/phetsims/scenery/issues/1581
      stepTimer.clearTimeout(this._pdomClickingTimeoutListener);

      // Now add the timeout back to start over, saving so that it can be removed later. Even when this listener was
      // interrupted from above logic, we still delay setting this to false to support visual "pressing" redraw.
      // @ts-expect-error TODO: This looks buggy, will need to ignore for now https://github.com/phetsims/scenery/issues/1581
      this._pdomClickingTimeoutListener = stepTimer.setTimeout(() => {
        // the listener may have been disposed before the end of a11yLooksPressedInterval, like if it fires and
        // disposes itself immediately
        if (!this.pdomClickingProperty.isDisposed) {
          this.pdomClickingProperty.value = false;
        }
      }, this._a11yLooksPressedInterval);
    }
    return true;
  }

  /**
   * Focus listener, called when this is treated as an accessible input listener and its target is focused. (scenery-internal)
   * @pdom
   */
  focus(event) {
    // Get the Display related to this accessible event.
    const accessibleDisplays = event.trail.rootNode().getRootedDisplays().filter(display => display.isAccessible());
    assert && assert(accessibleDisplays.length === 1, 'cannot focus node with zero or multiple accessible displays attached');
    //
    this.display = accessibleDisplays[0];
    if (!this.display.focusManager.pdomFocusHighlightsVisibleProperty.hasListener(this.boundInvalidateOverListener)) {
      this.display.focusManager.pdomFocusHighlightsVisibleProperty.link(this.boundInvalidateOverListener);
    }

    // On focus, button should look 'over'.
    this.isFocusedProperty.value = true;
  }

  /**
   * Blur listener, called when this is treated as an accessible input listener.
   * @pdom
   */
  blur() {
    if (this.display) {
      if (this.display.focusManager.pdomFocusHighlightsVisibleProperty.hasListener(this.boundInvalidateOverListener)) {
        this.display.focusManager.pdomFocusHighlightsVisibleProperty.unlink(this.boundInvalidateOverListener);
      }
      this.display = null;
    }

    // On blur, the button should no longer look 'over'.
    this.isFocusedProperty.value = false;
  }

  /**
   * Disposes the listener, releasing references. It should not be used after this.
   */
  dispose() {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener(`PressListener#${this._id} dispose`);
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();

    // We need to release references to any pointers that are over us.
    this.overPointers.clear();
    if (this._listeningToPointer && isPressedListener(this)) {
      this.pointer.removeInputListener(this._pointerListener);
    }

    // These Properties could have already been disposed, for example in the sun button hierarchy, see https://github.com/phetsims/sun/issues/372
    if (!this.isPressedProperty.isDisposed) {
      this.isPressedProperty.unlink(this._isHighlightedListener);
      this.isPressedProperty.unlink(this._isHoveringListener);
    }
    !this.isHoveringProperty.isDisposed && this.isHoveringProperty.unlink(this._isHighlightedListener);
    this._pressAction.dispose();
    this._releaseAction.dispose();
    this.looksPressedProperty.dispose();
    this.pdomClickingProperty.dispose();
    this.cursorProperty.dispose();
    this.isFocusedProperty.dispose();
    this.isHighlightedProperty.dispose();
    this.isHoveringProperty.dispose();
    this.looksOverProperty.dispose();
    this.isOverProperty.dispose();
    this.isPressedProperty.dispose();
    this.overPointers.dispose();

    // Remove references to the stored display, if we have any.
    if (this.display) {
      this.display.focusManager.pdomFocusHighlightsVisibleProperty.unlink(this.boundInvalidateOverListener);
      this.display = null;
    }
    super.dispose();
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }
  static phetioAPI = {
    pressAction: {
      phetioType: PhetioAction.PhetioActionIO([SceneryEvent.SceneryEventIO])
    },
    releaseAction: {
      phetioType: PhetioAction.PhetioActionIO([NullableIO(SceneryEvent.SceneryEventIO)])
    }
  };
}
scenery.register('PressListener', PressListener);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQaGV0aW9BY3Rpb24iLCJCb29sZWFuUHJvcGVydHkiLCJEZXJpdmVkUHJvcGVydHkiLCJFbmFibGVkQ29tcG9uZW50IiwiY3JlYXRlT2JzZXJ2YWJsZUFycmF5Iiwic3RlcFRpbWVyIiwib3B0aW9uaXplIiwiRXZlbnRUeXBlIiwiUGhldGlvT2JqZWN0IiwiVGFuZGVtIiwiTnVsbGFibGVJTyIsIk1vdXNlIiwiTm9kZSIsInNjZW5lcnkiLCJTY2VuZXJ5RXZlbnQiLCJnbG9iYWxJRCIsInRydWVQcmVkaWNhdGUiLCJfIiwiY29uc3RhbnQiLCJpc1ByZXNzZWRMaXN0ZW5lciIsImxpc3RlbmVyIiwiaXNQcmVzc2VkIiwiUHJlc3NMaXN0ZW5lciIsImNvbnN0cnVjdG9yIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsInByZXNzIiwibm9vcCIsInJlbGVhc2UiLCJ0YXJnZXROb2RlIiwiZHJhZyIsImF0dGFjaCIsIm1vdXNlQnV0dG9uIiwicHJlc3NDdXJzb3IiLCJ1c2VJbnB1dExpc3RlbmVyQ3Vyc29yIiwiY2FuU3RhcnRQcmVzcyIsImExMXlMb29rc1ByZXNzZWRJbnRlcnZhbCIsImNvbGxhcHNlRHJhZ0V2ZW50cyIsInBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCIsInRhbmRlbSIsIlJFUVVJUkVEIiwicGhldGlvUmVhZE9ubHkiLCJwaGV0aW9GZWF0dXJlZCIsIkRFRkFVTFRfT1BUSU9OUyIsImFzc2VydCIsIl9pZCIsInNjZW5lcnlMb2ciLCJJbnB1dExpc3RlbmVyIiwiX21vdXNlQnV0dG9uIiwiX2ExMXlMb29rc1ByZXNzZWRJbnRlcnZhbCIsIl9wcmVzc0N1cnNvciIsIl9wcmVzc0xpc3RlbmVyIiwiX3JlbGVhc2VMaXN0ZW5lciIsIl9kcmFnTGlzdGVuZXIiLCJfY2FuU3RhcnRQcmVzcyIsIl90YXJnZXROb2RlIiwiX2F0dGFjaCIsIl9jb2xsYXBzZURyYWdFdmVudHMiLCJvdmVyUG9pbnRlcnMiLCJpc1ByZXNzZWRQcm9wZXJ0eSIsInJlZW50cmFudCIsImlzT3ZlclByb3BlcnR5IiwibG9va3NPdmVyUHJvcGVydHkiLCJpc0hvdmVyaW5nUHJvcGVydHkiLCJpc0hpZ2hsaWdodGVkUHJvcGVydHkiLCJpc0ZvY3VzZWRQcm9wZXJ0eSIsImN1cnNvclByb3BlcnR5IiwiZW5hYmxlZFByb3BlcnR5IiwiZW5hYmxlZCIsInBvaW50ZXIiLCJwcmVzc2VkVHJhaWwiLCJpbnRlcnJ1cHRlZCIsIl9wZW5kaW5nQ29sbGFwc2VkRHJhZ0V2ZW50IiwiX2xpc3RlbmluZ1RvUG9pbnRlciIsIl9pc0hvdmVyaW5nTGlzdGVuZXIiLCJpbnZhbGlkYXRlSG92ZXJpbmciLCJiaW5kIiwiX2lzSGlnaGxpZ2h0ZWRMaXN0ZW5lciIsImludmFsaWRhdGVIaWdobGlnaHRlZCIsInBkb21DbGlja2luZ1Byb3BlcnR5IiwibG9va3NQcmVzc2VkUHJvcGVydHkiLCJvciIsIl9wZG9tQ2xpY2tpbmdUaW1lb3V0TGlzdGVuZXIiLCJfcG9pbnRlckxpc3RlbmVyIiwidXAiLCJwb2ludGVyVXAiLCJjYW5jZWwiLCJwb2ludGVyQ2FuY2VsIiwibW92ZSIsInBvaW50ZXJNb3ZlIiwiaW50ZXJydXB0IiwicG9pbnRlckludGVycnVwdCIsIl9wcmVzc0FjdGlvbiIsIm9uUHJlc3MiLCJjcmVhdGVUYW5kZW0iLCJwaGV0aW9Eb2N1bWVudGF0aW9uIiwicGhldGlvRXZlbnRUeXBlIiwiVVNFUiIsInBhcmFtZXRlcnMiLCJuYW1lIiwicGhldGlvVHlwZSIsIlNjZW5lcnlFdmVudElPIiwicGhldGlvUHJpdmF0ZSIsInZhbHVlVHlwZSIsIl9yZWxlYXNlQWN0aW9uIiwib25SZWxlYXNlIiwiZGlzcGxheSIsImJvdW5kSW52YWxpZGF0ZU92ZXJMaXN0ZW5lciIsImludmFsaWRhdGVPdmVyIiwibGVuZ3RoUHJvcGVydHkiLCJsaW5rIiwiYWRkSXRlbUFkZGVkTGlzdGVuZXIiLCJpc0Rvd25Qcm9wZXJ0eSIsImFkZEl0ZW1SZW1vdmVkTGlzdGVuZXIiLCJ1bmxpbmsiLCJsYXp5TGluayIsIm9uRW5hYmxlZFByb3BlcnR5Q2hhbmdlIiwidmFsdWUiLCJjdXJzb3IiLCJnZXRDdXJyZW50VGFyZ2V0IiwibGFzdE5vZGUiLCJjdXJyZW50VGFyZ2V0IiwiY2FuUHJlc3MiLCJldmVudCIsImRvbUV2ZW50IiwiYnV0dG9uIiwiaXNBdHRhY2hlZCIsImNhbkNsaWNrIiwiY2FsbGJhY2siLCJmbHVzaENvbGxhcHNlZERyYWciLCJwdXNoIiwiZXhlY3V0ZSIsInBvcCIsImhhc0xpc3RlbmVyIiwiY2xlYXJUaW1lb3V0IiwiaXNEaXNwb3NlZCIsImNsZWFyT3ZlclBvaW50ZXJzIiwiY2xlYXIiLCJzdGVwIiwic2V0Q3JlYXRlUGFuVGFyZ2V0Qm91bmRzIiwiY3JlYXRlRHJhZ1BhblRhcmdldEJvdW5kcyIsImNyZWF0ZVBhblRhcmdldEJvdW5kcyIsInNldENyZWF0ZVBhblRhcmdldEJvdW5kc0Zyb21UcmFpbCIsInRyYWlsIiwibGVuZ3RoIiwibG9jYWxUb0dsb2JhbEJvdW5kcyIsImxvY2FsQm91bmRzIiwiY3JlYXRlUGFuVGFyZ2V0Qm91bmRzRnJvbVRyYWlsIiwicG9pbnRlckF0dGFjaGVkVG9PdGhlciIsImkiLCJnZXQiLCJmb2N1c01hbmFnZXIiLCJwZG9tRm9jdXNIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5IiwiaXNEb3duIiwiZ2l2ZW5UYXJnZXROb2RlIiwiZ2V0VW5pcXVlVHJhaWwiLCJzdWJ0cmFpbFRvIiwiYWRkSW5wdXRMaXN0ZW5lciIsImdldEVmZmVjdGl2ZUN1cnNvciIsInByZXNzZWRMaXN0ZW5lciIsInJlbW92ZUlucHV0TGlzdGVuZXIiLCJkb3duIiwiZW50ZXIiLCJleGl0IiwiaW5jbHVkZXMiLCJyZW1vdmUiLCJjbGljayIsInNldFRpbWVvdXQiLCJmb2N1cyIsImFjY2Vzc2libGVEaXNwbGF5cyIsInJvb3ROb2RlIiwiZ2V0Um9vdGVkRGlzcGxheXMiLCJmaWx0ZXIiLCJpc0FjY2Vzc2libGUiLCJibHVyIiwiZGlzcG9zZSIsInBoZXRpb0FQSSIsInByZXNzQWN0aW9uIiwiUGhldGlvQWN0aW9uSU8iLCJyZWxlYXNlQWN0aW9uIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJQcmVzc0xpc3RlbmVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIExpc3RlbnMgdG8gcHJlc3NlcyAoZG93biBldmVudHMpLCBhdHRhY2hpbmcgYSBsaXN0ZW5lciB0byB0aGUgcG9pbnRlciB3aGVuIG9uZSBvY2N1cnMsIHNvIHRoYXQgYSByZWxlYXNlICh1cC9jYW5jZWxcclxuICogb3IgaW50ZXJydXB0aW9uKSBjYW4gYmUgcmVjb3JkZWQuXHJcbiAqXHJcbiAqIFRoaXMgaXMgdGhlIGJhc2UgdHlwZSBmb3IgYm90aCBEcmFnTGlzdGVuZXIgYW5kIEZpcmVMaXN0ZW5lciwgd2hpY2ggY29udGFpbnMgdGhlIHNoYXJlZCBsb2dpYyB0aGF0IHdvdWxkIGJlIG5lZWRlZFxyXG4gKiBieSBib3RoLlxyXG4gKlxyXG4gKiBQcmVzc0xpc3RlbmVyIGlzIGZpbmUgdG8gdXNlIGRpcmVjdGx5LCBwYXJ0aWN1bGFybHkgd2hlbiBkcmFnLWNvb3JkaW5hdGUgaW5mb3JtYXRpb24gaXMgbmVlZGVkIChlLmcuIERyYWdMaXN0ZW5lciksXHJcbiAqIG9yIGlmIHRoZSBpbnRlcmFjdGlvbiBpcyBtb3JlIGNvbXBsaWNhdGVkIHRoYW4gYSBzaW1wbGUgYnV0dG9uIGZpcmUgKGUuZy4gRmlyZUxpc3RlbmVyKS5cclxuICpcclxuICogRm9yIGV4YW1wbGUgdXNhZ2UsIHNlZSBzY2VuZXJ5L2V4YW1wbGVzL2lucHV0Lmh0bWwuIEFkZGl0aW9uYWxseSwgYSB0eXBpY2FsIFwic2ltcGxlXCIgUHJlc3NMaXN0ZW5lciBkaXJlY3QgdXNhZ2VcclxuICogd291bGQgYmUgc29tZXRoaW5nIGxpa2U6XHJcbiAqXHJcbiAqICAgc29tZU5vZGUuYWRkSW5wdXRMaXN0ZW5lciggbmV3IFByZXNzTGlzdGVuZXIoIHtcclxuICogICAgIHByZXNzOiAoKSA9PiB7IC4uLiB9LFxyXG4gKiAgICAgcmVsZWFzZTogKCkgPT4geyAuLi4gfVxyXG4gKiAgIH0gKSApO1xyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IFBoZXRpb0FjdGlvbiBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvUGhldGlvQWN0aW9uLmpzJztcclxuaW1wb3J0IEJvb2xlYW5Qcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL0Jvb2xlYW5Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBEZXJpdmVkUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9EZXJpdmVkUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgRW5hYmxlZENvbXBvbmVudCwgeyBFbmFibGVkQ29tcG9uZW50T3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL2F4b24vanMvRW5hYmxlZENvbXBvbmVudC5qcyc7XHJcbmltcG9ydCBjcmVhdGVPYnNlcnZhYmxlQXJyYXksIHsgT2JzZXJ2YWJsZUFycmF5IH0gZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9jcmVhdGVPYnNlcnZhYmxlQXJyYXkuanMnO1xyXG5pbXBvcnQgc3RlcFRpbWVyIGZyb20gJy4uLy4uLy4uL2F4b24vanMvc3RlcFRpbWVyLmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IFdpdGhvdXROdWxsIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9XaXRob3V0TnVsbC5qcyc7XHJcbmltcG9ydCBFdmVudFR5cGUgZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL0V2ZW50VHlwZS5qcyc7XHJcbmltcG9ydCBQaGV0aW9PYmplY3QgZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL1BoZXRpb09iamVjdC5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcbmltcG9ydCBOdWxsYWJsZUlPIGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy90eXBlcy9OdWxsYWJsZUlPLmpzJztcclxuaW1wb3J0IHsgRGlzcGxheSwgTW91c2UsIE5vZGUsIFBvaW50ZXIsIHNjZW5lcnksIFNjZW5lcnlFdmVudCwgVElucHV0TGlzdGVuZXIsIFRyYWlsIH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBUUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBUUmVhZE9ubHlQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IEludGVudGlvbmFsQW55IGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9JbnRlbnRpb25hbEFueS5qcyc7XHJcblxyXG4vLyBnbG9iYWxcclxubGV0IGdsb2JhbElEID0gMDtcclxuXHJcbi8vIEZhY3RvciBvdXQgdG8gcmVkdWNlIG1lbW9yeSBmb290cHJpbnQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvdGFuZGVtL2lzc3Vlcy83MVxyXG5jb25zdCB0cnVlUHJlZGljYXRlOiAoICggLi4uYXJnczogSW50ZW50aW9uYWxBbnlbXSApID0+IHRydWUgKSA9IF8uY29uc3RhbnQoIHRydWUgKTtcclxuXHJcbmV4cG9ydCB0eXBlIFByZXNzTGlzdGVuZXJET01FdmVudCA9IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50IHwgUG9pbnRlckV2ZW50IHwgRm9jdXNFdmVudCB8IEtleWJvYXJkRXZlbnQ7XHJcbmV4cG9ydCB0eXBlIFByZXNzTGlzdGVuZXJFdmVudCA9IFNjZW5lcnlFdmVudDxQcmVzc0xpc3RlbmVyRE9NRXZlbnQ+O1xyXG5leHBvcnQgdHlwZSBQcmVzc0xpc3RlbmVyQ2FsbGJhY2s8TGlzdGVuZXIgZXh0ZW5kcyBQcmVzc0xpc3RlbmVyPiA9ICggZXZlbnQ6IFByZXNzTGlzdGVuZXJFdmVudCwgbGlzdGVuZXI6IExpc3RlbmVyICkgPT4gdm9pZDtcclxuZXhwb3J0IHR5cGUgUHJlc3NMaXN0ZW5lck51bGxhYmxlQ2FsbGJhY2s8TGlzdGVuZXIgZXh0ZW5kcyBQcmVzc0xpc3RlbmVyPiA9ICggZXZlbnQ6IFByZXNzTGlzdGVuZXJFdmVudCB8IG51bGwsIGxpc3RlbmVyOiBMaXN0ZW5lciApID0+IHZvaWQ7XHJcbmV4cG9ydCB0eXBlIFByZXNzTGlzdGVuZXJDYW5TdGFydFByZXNzQ2FsbGJhY2s8TGlzdGVuZXIgZXh0ZW5kcyBQcmVzc0xpc3RlbmVyPiA9ICggZXZlbnQ6IFByZXNzTGlzdGVuZXJFdmVudCB8IG51bGwsIGxpc3RlbmVyOiBMaXN0ZW5lciApID0+IGJvb2xlYW47XHJcblxyXG50eXBlIFNlbGZPcHRpb25zPExpc3RlbmVyIGV4dGVuZHMgUHJlc3NMaXN0ZW5lcj4gPSB7XHJcbiAgLy8gQ2FsbGVkIHdoZW4gdGhpcyBsaXN0ZW5lciBpcyBwcmVzc2VkICh0eXBpY2FsbHkgZnJvbSBhIGRvd24gZXZlbnQsIGJ1dCBjYW4gYmUgdHJpZ2dlcmVkIGJ5IG90aGVyIGhhbmRsZXJzKVxyXG4gIHByZXNzPzogUHJlc3NMaXN0ZW5lckNhbGxiYWNrPExpc3RlbmVyPjtcclxuXHJcbiAgLy8gQ2FsbGVkIHdoZW4gdGhpcyBsaXN0ZW5lciBpcyByZWxlYXNlZC4gTm90ZSB0aGF0IGFuIFNjZW5lcnlFdmVudCBhcmcgY2Fubm90IGJlIGd1YXJhbnRlZWQgZnJvbSB0aGlzIGxpc3RlbmVyLiBUaGlzXHJcbiAgLy8gaXMsIGluIHBhcnQsIHRvIHN1cHBvcnQgaW50ZXJydXB0LiAocG9pbnRlciB1cC9jYW5jZWwgb3IgaW50ZXJydXB0IHdoZW4gcHJlc3NlZC9hZnRlciBjbGljayBmcm9tIHRoZSBwZG9tKS5cclxuICAvLyBOT1RFOiBUaGlzIHdpbGwgYWxzbyBiZSBjYWxsZWQgaWYgdGhlIHByZXNzIGlzIFwicmVsZWFzZWRcIiBkdWUgdG8gYmVpbmcgaW50ZXJydXB0ZWQgb3IgY2FuY2VsZWQuXHJcbiAgcmVsZWFzZT86IFByZXNzTGlzdGVuZXJOdWxsYWJsZUNhbGxiYWNrPExpc3RlbmVyPjtcclxuXHJcbiAgLy8gQ2FsbGVkIHdoZW4gdGhpcyBsaXN0ZW5lciBpcyBkcmFnZ2VkIChtb3ZlIGV2ZW50cyBvbiB0aGUgcG9pbnRlciB3aGlsZSBwcmVzc2VkKVxyXG4gIGRyYWc/OiBQcmVzc0xpc3RlbmVyQ2FsbGJhY2s8TGlzdGVuZXI+O1xyXG5cclxuICAvLyBJZiBwcm92aWRlZCwgdGhlIHByZXNzZWRUcmFpbCAoY2FsY3VsYXRlZCBmcm9tIHRoZSBkb3duIGV2ZW50KSB3aWxsIGJlIHJlcGxhY2VkIHdpdGggdGhlIChzdWIpdHJhaWwgdGhhdCBlbmRzIHdpdGhcclxuICAvLyB0aGUgdGFyZ2V0Tm9kZSBhcyB0aGUgbGVhZi1tb3N0IE5vZGUuIFRoaXMgYWZmZWN0cyB0aGUgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUgY29tcHV0YXRpb25zLlxyXG4gIC8vIFRoaXMgaXMgaWRlYWxseSB1c2VkIHdoZW4gdGhlIE5vZGUgd2hpY2ggaGFzIHRoaXMgaW5wdXQgbGlzdGVuZXIgaXMgZGlmZmVyZW50IGZyb20gdGhlIE5vZGUgYmVpbmcgdHJhbnNmb3JtZWQsXHJcbiAgLy8gYXMgb3RoZXJ3aXNlIG9mZnNldHMgYW5kIGRyYWcgYmVoYXZpb3Igd291bGQgYmUgaW5jb3JyZWN0IGJ5IGRlZmF1bHQuXHJcbiAgdGFyZ2V0Tm9kZT86IE5vZGUgfCBudWxsO1xyXG5cclxuICAvLyBJZiB0cnVlLCB0aGlzIGxpc3RlbmVyIHdpbGwgbm90IFwicHJlc3NcIiB3aGlsZSB0aGUgYXNzb2NpYXRlZCBwb2ludGVyIGlzIGF0dGFjaGVkLCBhbmQgd2hlbiBwcmVzc2VkLFxyXG4gIC8vIHdpbGwgbWFyayBpdHNlbGYgYXMgYXR0YWNoZWQgdG8gdGhlIHBvaW50ZXIuIElmIHRoaXMgbGlzdGVuZXIgc2hvdWxkIG5vdCBiZSBpbnRlcnJ1cHRlZCBieSBvdGhlcnMgYW5kIGlzbid0XHJcbiAgLy8gYSBcInByaW1hcnlcIiBoYW5kbGVyIG9mIHRoZSBwb2ludGVyJ3MgYmVoYXZpb3IsIHRoaXMgc2hvdWxkIGJlIHNldCB0byBmYWxzZS5cclxuICBhdHRhY2g/OiBib29sZWFuO1xyXG5cclxuICAvLyBSZXN0cmljdHMgdG8gdGhlIHNwZWNpZmljIG1vdXNlIGJ1dHRvbiAoYnV0IGFsbG93cyBhbnkgdG91Y2gpLiBPbmx5IG9uZSBtb3VzZSBidXR0b24gaXMgYWxsb3dlZCBhdFxyXG4gIC8vIGEgdGltZS4gVGhlIGJ1dHRvbiBudW1iZXJzIGFyZSBkZWZpbmVkIGluIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Nb3VzZUV2ZW50L2J1dHRvbixcclxuICAvLyB3aGVyZSB0eXBpY2FsbHk6XHJcbiAgLy8gICAwOiBMZWZ0IG1vdXNlIGJ1dHRvblxyXG4gIC8vICAgMTogTWlkZGxlIG1vdXNlIGJ1dHRvbiAob3Igd2hlZWwgcHJlc3MpXHJcbiAgLy8gICAyOiBSaWdodCBtb3VzZSBidXR0b25cclxuICAvLyAgIDMrOiBvdGhlciBzcGVjaWZpYyBudW1iZXJlZCBidXR0b25zIHRoYXQgYXJlIG1vcmUgcmFyZVxyXG4gIG1vdXNlQnV0dG9uPzogbnVtYmVyO1xyXG5cclxuICAvLyBJZiB0aGUgdGFyZ2V0Tm9kZS9jdXJyZW50VGFyZ2V0IGRvbid0IGhhdmUgYSBjdXN0b20gY3Vyc29yLCB0aGlzIHdpbGwgc2V0IHRoZSBwb2ludGVyIGN1cnNvciB0b1xyXG4gIC8vIHRoaXMgdmFsdWUgd2hlbiB0aGlzIGxpc3RlbmVyIGlzIFwicHJlc3NlZFwiLiBUaGlzIG1lYW5zIHRoYXQgZXZlbiB3aGVuIHRoZSBtb3VzZSBtb3ZlcyBvdXQgb2YgdGhlIG5vZGUgYWZ0ZXJcclxuICAvLyBwcmVzc2luZyBkb3duLCBpdCB3aWxsIHN0aWxsIGhhdmUgdGhpcyBjdXJzb3IgKG92ZXJyaWRpbmcgdGhlIGN1cnNvciBvZiB3aGF0ZXZlciBub2RlcyB0aGUgcG9pbnRlciBtYXkgYmVcclxuICAvLyBvdmVyKS5cclxuICBwcmVzc0N1cnNvcj86IHN0cmluZyB8IG51bGw7XHJcblxyXG4gIC8vIFdoZW4gdHJ1ZSwgYW55IG5vZGUgdGhpcyBsaXN0ZW5lciBpcyBhZGRlZCB0byB3aWxsIHVzZSB0aGlzIGxpc3RlbmVyJ3MgY3Vyc29yIChzZWUgb3B0aW9ucy5wcmVzc0N1cnNvcilcclxuICAvLyBhcyB0aGUgY3Vyc29yIGZvciB0aGF0IG5vZGUuIFRoaXMgb25seSBhcHBsaWVzIGlmIHRoZSBub2RlJ3MgY3Vyc29yIGlzIG51bGwsIHNlZSBOb2RlLmdldEVmZmVjdGl2ZUN1cnNvcigpLlxyXG4gIHVzZUlucHV0TGlzdGVuZXJDdXJzb3I/OiBib29sZWFuO1xyXG5cclxuICAvLyBDaGVja3MgdGhpcyB3aGVuIHRyeWluZyB0byBzdGFydCBhIHByZXNzLiBJZiB0aGlzIGZ1bmN0aW9uIHJldHVybnMgZmFsc2UsIGEgcHJlc3Mgd2lsbCBub3QgYmUgc3RhcnRlZFxyXG4gIGNhblN0YXJ0UHJlc3M/OiBQcmVzc0xpc3RlbmVyQ2FuU3RhcnRQcmVzc0NhbGxiYWNrPExpc3RlbmVyPjtcclxuXHJcbiAgLy8gKGExMXkpIC0gSG93IGxvbmcgc29tZXRoaW5nIHNob3VsZCAnbG9vaycgcHJlc3NlZCBhZnRlciBhbiBhY2Nlc3NpYmxlIGNsaWNrIGlucHV0IGV2ZW50LCBpbiBtc1xyXG4gIGExMXlMb29rc1ByZXNzZWRJbnRlcnZhbD86IG51bWJlcjtcclxuXHJcbiAgLy8gSWYgdHJ1ZSwgbXVsdGlwbGUgZHJhZyBldmVudHMgaW4gYSByb3cgKGJldHdlZW4gc3RlcHMpIHdpbGwgYmUgY29sbGFwc2VkIGludG8gb25lIGRyYWcgZXZlbnRcclxuICAvLyAodXN1YWxseSBmb3IgcGVyZm9ybWFuY2UpIGJ5IGp1c3QgY2FsbGluZyB0aGUgY2FsbGJhY2tzIGZvciB0aGUgbGFzdCBkcmFnIGV2ZW50LiBPdGhlciBldmVudHMgKHByZXNzL3JlbGVhc2VcclxuICAvLyBoYW5kbGluZykgd2lsbCBmb3JjZSB0aHJvdWdoIHRoZSBsYXN0IHBlbmRpbmcgZHJhZyBldmVudC4gQ2FsbGluZyBzdGVwKCkgZXZlcnkgZnJhbWUgd2lsbCB0aGVuIGJlIGdlbmVyYWxseVxyXG4gIC8vIG5lY2Vzc2FyeSB0byBoYXZlIGFjY3VyYXRlLWxvb2tpbmcgZHJhZ3MuIE5PVEUgdGhhdCB0aGlzIG1heSBwdXQgaW4gZXZlbnRzIG91dC1vZi1vcmRlci5cclxuICAvLyBUaGlzIGlzIGFwcHJvcHJpYXRlIHdoZW4gdGhlIGRyYWcgb3BlcmF0aW9uIGlzIGV4cGVuc2l2ZSBwZXJmb3JtYW5jZS13aXNlIEFORCBpZGVhbGx5IHNob3VsZCBvbmx5IGJlIHJ1biBhdFxyXG4gIC8vIG1vc3Qgb25jZSBwZXIgZnJhbWUgKGFueSBtb3JlLCBhbmQgaXQgd291bGQgYmUgYSB3YXN0ZSkuXHJcbiAgY29sbGFwc2VEcmFnRXZlbnRzPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gVGhvdWdoIFByZXNzTGlzdGVuZXIgaXMgbm90IGluc3RydW1lbnRlZCwgZGVjbGFyZSB0aGVzZSBoZXJlIHRvIHN1cHBvcnQgcHJvcGVybHkgcGFzc2luZyB0aGlzIHRvIGNoaWxkcmVuLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3RhbmRlbS9pc3N1ZXMvNjAuXHJcbiAgLy8gUHJlc3NMaXN0ZW5lciBieSBkZWZhdWx0IGRvZXNuJ3QgYWxsb3cgUGhFVC1pTyB0byB0cmlnZ2VyIHByZXNzL3JlbGVhc2UgQWN0aW9uIGV2ZW50c1xyXG4gIHBoZXRpb1JlYWRPbmx5PzogYm9vbGVhbjtcclxuICBwaGV0aW9GZWF0dXJlZD86IGJvb2xlYW47XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBQcmVzc0xpc3RlbmVyT3B0aW9uczxMaXN0ZW5lciBleHRlbmRzIFByZXNzTGlzdGVuZXIgPSBQcmVzc0xpc3RlbmVyPiA9IFNlbGZPcHRpb25zPExpc3RlbmVyPiAmIEVuYWJsZWRDb21wb25lbnRPcHRpb25zO1xyXG5cclxuZXhwb3J0IHR5cGUgUHJlc3NlZFByZXNzTGlzdGVuZXIgPSBXaXRob3V0TnVsbDxQcmVzc0xpc3RlbmVyLCAncG9pbnRlcicgfCAncHJlc3NlZFRyYWlsJz47XHJcbmNvbnN0IGlzUHJlc3NlZExpc3RlbmVyID0gKCBsaXN0ZW5lcjogUHJlc3NMaXN0ZW5lciApOiBsaXN0ZW5lciBpcyBQcmVzc2VkUHJlc3NMaXN0ZW5lciA9PiBsaXN0ZW5lci5pc1ByZXNzZWQ7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcmVzc0xpc3RlbmVyIGV4dGVuZHMgRW5hYmxlZENvbXBvbmVudCBpbXBsZW1lbnRzIFRJbnB1dExpc3RlbmVyIHtcclxuXHJcbiAgLy8gVW5pcXVlIGdsb2JhbCBJRCBmb3IgdGhpcyBsaXN0ZW5lclxyXG4gIHByaXZhdGUgX2lkOiBudW1iZXI7XHJcblxyXG4gIHByaXZhdGUgX21vdXNlQnV0dG9uOiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBfYTExeUxvb2tzUHJlc3NlZEludGVydmFsOiBudW1iZXI7XHJcblxyXG4gIHByaXZhdGUgX3ByZXNzQ3Vyc29yOiBzdHJpbmcgfCBudWxsO1xyXG5cclxuICBwcml2YXRlIF9wcmVzc0xpc3RlbmVyOiBQcmVzc0xpc3RlbmVyQ2FsbGJhY2s8UHJlc3NMaXN0ZW5lcj47XHJcbiAgcHJpdmF0ZSBfcmVsZWFzZUxpc3RlbmVyOiBQcmVzc0xpc3RlbmVyTnVsbGFibGVDYWxsYmFjazxQcmVzc0xpc3RlbmVyPjtcclxuICBwcml2YXRlIF9kcmFnTGlzdGVuZXI6IFByZXNzTGlzdGVuZXJDYWxsYmFjazxQcmVzc0xpc3RlbmVyPjtcclxuICBwcml2YXRlIF9jYW5TdGFydFByZXNzOiBQcmVzc0xpc3RlbmVyQ2FuU3RhcnRQcmVzc0NhbGxiYWNrPFByZXNzTGlzdGVuZXI+O1xyXG5cclxuICBwcml2YXRlIF90YXJnZXROb2RlOiBOb2RlIHwgbnVsbDtcclxuXHJcbiAgcHJpdmF0ZSBfYXR0YWNoOiBib29sZWFuO1xyXG4gIHByaXZhdGUgX2NvbGxhcHNlRHJhZ0V2ZW50czogYm9vbGVhbjtcclxuXHJcbiAgLy8gQ29udGFpbnMgYWxsIHBvaW50ZXJzIHRoYXQgYXJlIG92ZXIgb3VyIGJ1dHRvbi4gVHJhY2tlZCBieSBhZGRpbmcgd2l0aCAnZW50ZXInIGV2ZW50cyBhbmQgcmVtb3Zpbmcgd2l0aCAnZXhpdCdcclxuICAvLyBldmVudHMuXHJcbiAgcHVibGljIHJlYWRvbmx5IG92ZXJQb2ludGVyczogT2JzZXJ2YWJsZUFycmF5PFBvaW50ZXI+O1xyXG5cclxuICAvLyAocmVhZC1vbmx5KSAtIFRyYWNrcyB3aGV0aGVyIHRoaXMgbGlzdGVuZXIgaXMgXCJwcmVzc2VkXCIgb3Igbm90LlxyXG4gIHB1YmxpYyByZWFkb25seSBpc1ByZXNzZWRQcm9wZXJ0eTogVFByb3BlcnR5PGJvb2xlYW4+O1xyXG5cclxuICAvLyAocmVhZC1vbmx5KSAtIEl0IHdpbGwgYmUgc2V0IHRvIHRydWUgd2hlbiBhdCBsZWFzdCBvbmUgcG9pbnRlciBpcyBvdmVyIHRoZSBsaXN0ZW5lci5cclxuICAvLyBUaGlzIGlzIG5vdCBlZmZlY3RlZCBieSBQRE9NIGZvY3VzLlxyXG4gIHB1YmxpYyByZWFkb25seSBpc092ZXJQcm9wZXJ0eTogVFByb3BlcnR5PGJvb2xlYW4+O1xyXG5cclxuICAvLyAocmVhZC1vbmx5KSAtIFRydWUgd2hlbiBlaXRoZXIgaXNPdmVyUHJvcGVydHkgaXMgdHJ1ZSwgb3Igd2hlbiBmb2N1c2VkIGFuZCB0aGVcclxuICAvLyByZWxhdGVkIERpc3BsYXkgaXMgc2hvd2luZyBpdHMgZm9jdXNIaWdobGlnaHRzLCBzZWUgdGhpcy52YWxpZGF0ZU92ZXIoKSBmb3IgZGV0YWlscy5cclxuICBwdWJsaWMgcmVhZG9ubHkgbG9va3NPdmVyUHJvcGVydHk6IFRQcm9wZXJ0eTxib29sZWFuPjtcclxuXHJcbiAgLy8gKHJlYWQtb25seSkgLSBJdCB3aWxsIGJlIHNldCB0byB0cnVlIHdoZW4gZWl0aGVyOlxyXG4gIC8vICAgMS4gVGhlIGxpc3RlbmVyIGlzIHByZXNzZWQgYW5kIHRoZSBwb2ludGVyIHRoYXQgaXMgcHJlc3NpbmcgaXMgb3ZlciB0aGUgbGlzdGVuZXIuXHJcbiAgLy8gICAyLiBUaGVyZSBpcyBhdCBsZWFzdCBvbmUgdW5wcmVzc2VkIHBvaW50ZXIgdGhhdCBpcyBvdmVyIHRoZSBsaXN0ZW5lci5cclxuICBwdWJsaWMgcmVhZG9ubHkgaXNIb3ZlcmluZ1Byb3BlcnR5OiBUUHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8vIChyZWFkLW9ubHkpIC0gSXQgd2lsbCBiZSBzZXQgdG8gdHJ1ZSB3aGVuIGVpdGhlcjpcclxuICAvLyAgIDEuIFRoZSBsaXN0ZW5lciBpcyBwcmVzc2VkLlxyXG4gIC8vICAgMi4gVGhlcmUgaXMgYXQgbGVhc3Qgb25lIHVucHJlc3NlZCBwb2ludGVyIHRoYXQgaXMgb3ZlciB0aGUgbGlzdGVuZXIuXHJcbiAgLy8gVGhpcyBpcyBlc3NlbnRpYWxseSB0cnVlIHdoZW4gKCBpc1ByZXNzZWQgfHwgaXNIb3ZlcmluZyApLlxyXG4gIHB1YmxpYyByZWFkb25seSBpc0hpZ2hsaWdodGVkUHJvcGVydHk6IFRQcm9wZXJ0eTxib29sZWFuPjtcclxuXHJcbiAgLy8gKHJlYWQtb25seSkgLSBXaGV0aGVyIHRoZSBsaXN0ZW5lciBoYXMgZm9jdXMgKHNob3VsZCBhcHBlYXIgdG8gYmUgb3ZlcilcclxuICBwdWJsaWMgcmVhZG9ubHkgaXNGb2N1c2VkUHJvcGVydHk6IFRQcm9wZXJ0eTxib29sZWFuPjtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBjdXJzb3JQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nIHwgbnVsbD47XHJcblxyXG4gIC8vIChyZWFkLW9ubHkpIC0gVGhlIGN1cnJlbnQgcG9pbnRlciwgb3IgbnVsbCB3aGVuIG5vdCBwcmVzc2VkLiBUaGVyZSBjYW4gYmUgc2hvcnQgcGVyaW9kcyBvZlxyXG4gIC8vIHRpbWUgd2hlbiB0aGlzIGhhcyBhIHZhbHVlIHdoZW4gaXNQcmVzc2VkUHJvcGVydHkudmFsdWUgaXMgZmFsc2UsIHN1Y2ggYXMgZHVyaW5nIHRoZSBwcm9jZXNzaW5nIG9mIGEgcG9pbnRlclxyXG4gIC8vIHJlbGVhc2UsIGJ1dCB0aGVzZSBwZXJpb2RzIHNob3VsZCBiZSB2ZXJ5IGJyaWVmLlxyXG4gIHB1YmxpYyBwb2ludGVyOiBQb2ludGVyIHwgbnVsbDtcclxuXHJcbiAgLy8gKHJlYWQtb25seSkgLSBUaGUgVHJhaWwgZm9yIHRoZSBwcmVzcywgd2l0aCBubyBkZXNjZW5kYW50IG5vZGVzIHBhc3QgdGhlIGN1cnJlbnRUYXJnZXRcclxuICAvLyBvciB0YXJnZXROb2RlIChpZiBwcm92aWRlZCkuIFdpbGwgZ2VuZXJhbGx5IGJlIG51bGwgd2hlbiBub3QgcHJlc3NlZCwgdGhvdWdoIHRoZXJlIGNhbiBiZSBzaG9ydCBwZXJpb2RzIG9mIHRpbWVcclxuICAvLyB3aGVyZSB0aGlzIGhhcyBhIHZhbHVlIHdoZW4gaXNQcmVzc2VkUHJvcGVydHkudmFsdWUgaXMgZmFsc2UsIHN1Y2ggYXMgZHVyaW5nIHRoZSBwcm9jZXNzaW5nIG9mIGEgcmVsZWFzZSwgYnV0XHJcbiAgLy8gdGhlc2UgcGVyaW9kcyBzaG91bGQgYmUgdmVyeSBicmllZi5cclxuICBwdWJsaWMgcHJlc3NlZFRyYWlsOiBUcmFpbCB8IG51bGw7XHJcblxyXG4gIC8vKHJlYWQtb25seSkgLSBXaGV0aGVyIHRoZSBsYXN0IHByZXNzIHdhcyBpbnRlcnJ1cHRlZC4gV2lsbCBiZSB2YWxpZCB1bnRpbCB0aGUgbmV4dCBwcmVzcy5cclxuICBwdWJsaWMgaW50ZXJydXB0ZWQ6IGJvb2xlYW47XHJcblxyXG4gIC8vIEZvciB0aGUgY29sbGFwc2VEcmFnRXZlbnRzIGZlYXR1cmUsIHRoaXMgd2lsbCBob2xkIHRoZSBsYXN0IHBlbmRpbmcgZHJhZyBldmVudCB0byB0cmlnZ2VyIGEgY2FsbCB0byBkcmFnKCkgd2l0aCxcclxuICAvLyBpZiBvbmUgaGFzIGJlZW4gc2tpcHBlZC5cclxuICBwcml2YXRlIF9wZW5kaW5nQ29sbGFwc2VkRHJhZ0V2ZW50OiBQcmVzc0xpc3RlbmVyRXZlbnQgfCBudWxsO1xyXG5cclxuICAvLyBXaGV0aGVyIG91ciBwb2ludGVyIGxpc3RlbmVyIGlzIHJlZmVyZW5jZWQgYnkgdGhlIHBvaW50ZXIgKG5lZWQgdG8gaGF2ZSBhIGZsYWcgZHVlIHRvIGhhbmRsaW5nIGRpc3Bvc2FsIHByb3Blcmx5KS5cclxuICBwcml2YXRlIF9saXN0ZW5pbmdUb1BvaW50ZXI6IGJvb2xlYW47XHJcblxyXG4gIC8vIGlzSG92ZXJpbmdQcm9wZXJ0eSB1cGRhdGVzIChub3QgYSBEZXJpdmVkUHJvcGVydHkgYmVjYXVzZSB3ZSBuZWVkIHRvIGhvb2sgdG8gcGFzc2VkLWluIHByb3BlcnRpZXMpXHJcbiAgcHJpdmF0ZSBfaXNIb3ZlcmluZ0xpc3RlbmVyOiAoKSA9PiB2b2lkO1xyXG5cclxuICAvLyBpc0hpZ2hsaWdodGVkUHJvcGVydHkgdXBkYXRlcyAobm90IGEgRGVyaXZlZFByb3BlcnR5IGJlY2F1c2Ugd2UgbmVlZCB0byBob29rIHRvIHBhc3NlZC1pbiBwcm9wZXJ0aWVzKVxyXG4gIHByaXZhdGUgX2lzSGlnaGxpZ2h0ZWRMaXN0ZW5lcjogKCkgPT4gdm9pZDtcclxuXHJcbiAgLy8gKHJlYWQtb25seSkgLSBXaGV0aGVyIGEgcHJlc3MgaXMgYmVpbmcgcHJvY2Vzc2VkIGZyb20gYSBwZG9tIGNsaWNrIGlucHV0IGV2ZW50IGZyb20gdGhlIFBET00uXHJcbiAgcHVibGljIHJlYWRvbmx5IHBkb21DbGlja2luZ1Byb3BlcnR5OiBUUHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8vIChyZWFkLW9ubHkpIC0gVGhpcyBQcm9wZXJ0eSB3YXMgYWRkZWQgdG8gc3VwcG9ydCBpbnB1dCBmcm9tIHRoZSBQRE9NLiBJdCB0cmFja3Mgd2hldGhlclxyXG4gIC8vIG9yIG5vdCB0aGUgYnV0dG9uIHNob3VsZCBcImxvb2tcIiBkb3duLiBUaGlzIHdpbGwgYmUgdHJ1ZSBpZiBkb3duUHJvcGVydHkgaXMgdHJ1ZSBvciBpZiBhIHBkb20gY2xpY2sgaXMgaW5cclxuICAvLyBwcm9ncmVzcy4gRm9yIGEgY2xpY2sgZXZlbnQgZnJvbSB0aGUgcGRvbSwgdGhlIGxpc3RlbmVycyBhcmUgZmlyZWQgcmlnaHQgYXdheSBidXQgdGhlIGJ1dHRvbiB3aWxsIGxvb2sgZG93biBmb3JcclxuICAvLyBhcyBsb25nIGFzIGExMXlMb29rc1ByZXNzZWRJbnRlcnZhbC4gU2VlIFByZXNzTGlzdGVuZXIuY2xpY2soKSBmb3IgbW9yZSBkZXRhaWxzLlxyXG4gIHB1YmxpYyByZWFkb25seSBsb29rc1ByZXNzZWRQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8vIFdoZW4gcGRvbSBjbGlja2luZyBiZWdpbnMsIHRoaXMgd2lsbCBiZSBhZGRlZCB0byBhIHRpbWVvdXQgc28gdGhhdCB0aGVcclxuICAvLyBwZG9tQ2xpY2tpbmdQcm9wZXJ0eSBpcyB1cGRhdGVkIGFmdGVyIHNvbWUgZGVsYXkuIFRoaXMgaXMgcmVxdWlyZWQgc2luY2UgYW4gYXNzaXN0aXZlIGRldmljZSAobGlrZSBhIHN3aXRjaCkgbWF5XHJcbiAgLy8gc2VuZCBcImNsaWNrXCIgZXZlbnRzIGRpcmVjdGx5IGluc3RlYWQgb2Yga2V5ZG93bi9rZXl1cCBwYWlycy4gSWYgYSBjbGljayBpbml0aWF0ZXMgd2hpbGUgYWxyZWFkeSBpbiBwcm9ncmVzcyxcclxuICAvLyB0aGlzIGxpc3RlbmVyIHdpbGwgYmUgcmVtb3ZlZCB0byBzdGFydCB0aGUgdGltZW91dCBvdmVyLiBudWxsIHVudGlsIHRpbW91dCBpcyBhZGRlZC5cclxuICBwcml2YXRlIF9wZG9tQ2xpY2tpbmdUaW1lb3V0TGlzdGVuZXI6ICggKCkgPT4gdm9pZCApIHwgbnVsbDtcclxuXHJcbiAgLy8gVGhlIGxpc3RlbmVyIHRoYXQgZ2V0cyBhZGRlZCB0byB0aGUgcG9pbnRlciB3aGVuIHdlIGFyZSBwcmVzc2VkXHJcbiAgcHJpdmF0ZSBfcG9pbnRlckxpc3RlbmVyOiBUSW5wdXRMaXN0ZW5lcjtcclxuXHJcbiAgLy8gRXhlY3V0ZWQgb24gcHJlc3MgZXZlbnRcclxuICAvLyBUaGUgbWFpbiBpbXBsZW1lbnRhdGlvbiBvZiBcInByZXNzXCIgaGFuZGxpbmcgaXMgaW1wbGVtZW50ZWQgYXMgYSBjYWxsYmFjayB0byB0aGUgUGhldGlvQWN0aW9uLCBzbyB0aGluZ3MgYXJlIG5lc3RlZFxyXG4gIC8vIG5pY2VseSBmb3IgcGhldC1pby5cclxuICBwcml2YXRlIF9wcmVzc0FjdGlvbjogUGhldGlvQWN0aW9uPFsgUHJlc3NMaXN0ZW5lckV2ZW50LCBOb2RlIHwgbnVsbCwgKCAoKSA9PiB2b2lkICkgfCBudWxsIF0+O1xyXG5cclxuICAvLyBFeGVjdXRlZCBvbiByZWxlYXNlIGV2ZW50XHJcbiAgLy8gVGhlIG1haW4gaW1wbGVtZW50YXRpb24gb2YgXCJyZWxlYXNlXCIgaGFuZGxpbmcgaXMgaW1wbGVtZW50ZWQgYXMgYSBjYWxsYmFjayB0byB0aGUgUGhldGlvQWN0aW9uLCBzbyB0aGluZ3MgYXJlIG5lc3RlZFxyXG4gIC8vIG5pY2VseSBmb3IgcGhldC1pby5cclxuICBwcml2YXRlIF9yZWxlYXNlQWN0aW9uOiBQaGV0aW9BY3Rpb248WyBQcmVzc0xpc3RlbmVyRXZlbnQgfCBudWxsLCAoICgpID0+IHZvaWQgKSB8IG51bGwgXT47XHJcblxyXG4gIC8vIFRvIHN1cHBvcnQgbG9va3NPdmVyUHJvcGVydHkgYmVpbmcgdHJ1ZSBiYXNlZCBvbiBmb2N1cywgd2UgbmVlZCB0byBtb25pdG9yIHRoZSBkaXNwbGF5IGZyb20gd2hpY2hcclxuICAvLyB0aGUgZXZlbnQgaGFzIGNvbWUgZnJvbSB0byBzZWUgaWYgdGhhdCBkaXNwbGF5IGlzIHNob3dpbmcgaXRzIGZvY3VzSGlnaGxpZ2h0cywgc2VlXHJcbiAgLy8gRGlzcGxheS5wcm90b3R5cGUuZm9jdXNNYW5hZ2VyLkZvY3VzTWFuYWdlci5wZG9tRm9jdXNIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5IGZvciBkZXRhaWxzLlxyXG4gIHB1YmxpYyBkaXNwbGF5OiBEaXNwbGF5IHwgbnVsbDtcclxuXHJcbiAgLy8gd2UgbmVlZCB0aGUgc2FtZSBleGFjdCBmdW5jdGlvbiB0byBhZGQgYW5kIHJlbW92ZSBhcyBhIGxpc3RlbmVyXHJcbiAgcHJpdmF0ZSBib3VuZEludmFsaWRhdGVPdmVyTGlzdGVuZXI6ICgpID0+IHZvaWQ7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggcHJvdmlkZWRPcHRpb25zPzogUHJlc3NMaXN0ZW5lck9wdGlvbnMgKSB7XHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPFByZXNzTGlzdGVuZXJPcHRpb25zLCBTZWxmT3B0aW9uczxQcmVzc0xpc3RlbmVyPiwgRW5hYmxlZENvbXBvbmVudE9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgIHByZXNzOiBfLm5vb3AsXHJcbiAgICAgIHJlbGVhc2U6IF8ubm9vcCxcclxuICAgICAgdGFyZ2V0Tm9kZTogbnVsbCxcclxuICAgICAgZHJhZzogXy5ub29wLFxyXG4gICAgICBhdHRhY2g6IHRydWUsXHJcbiAgICAgIG1vdXNlQnV0dG9uOiAwLFxyXG4gICAgICBwcmVzc0N1cnNvcjogJ3BvaW50ZXInLFxyXG4gICAgICB1c2VJbnB1dExpc3RlbmVyQ3Vyc29yOiBmYWxzZSxcclxuICAgICAgY2FuU3RhcnRQcmVzczogdHJ1ZVByZWRpY2F0ZSxcclxuICAgICAgYTExeUxvb2tzUHJlc3NlZEludGVydmFsOiAxMDAsXHJcbiAgICAgIGNvbGxhcHNlRHJhZ0V2ZW50czogZmFsc2UsXHJcblxyXG4gICAgICAvLyBFbmFibGVkQ29tcG9uZW50XHJcbiAgICAgIC8vIEJ5IGRlZmF1bHQsIFByZXNzTGlzdGVuZXIgZG9lcyBub3QgaGF2ZSBhbiBpbnN0cnVtZW50ZWQgZW5hYmxlZFByb3BlcnR5LCBidXQgeW91IGNhbiBvcHQgaW4gd2l0aCB0aGlzIG9wdGlvbi5cclxuICAgICAgcGhldGlvRW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkOiBmYWxzZSxcclxuXHJcbiAgICAgIC8vIHBoZXQtaW8gKEVuYWJsZWRDb21wb25lbnQpXHJcbiAgICAgIC8vIEZvciBQaEVULWlPIGluc3RydW1lbnRhdGlvbi4gSWYgb25seSB1c2luZyB0aGUgUHJlc3NMaXN0ZW5lciBmb3IgaG92ZXIgYmVoYXZpb3IsIHRoZXJlIGlzIG5vIG5lZWQgdG9cclxuICAgICAgLy8gaW5zdHJ1bWVudCBiZWNhdXNlIGV2ZW50cyBhcmUgb25seSBhZGRlZCB0byB0aGUgZGF0YSBzdHJlYW0gZm9yIHByZXNzL3JlbGVhc2UgYW5kIG5vdCBmb3IgaG92ZXIgZXZlbnRzLiBQbGVhc2UgcGFzc1xyXG4gICAgICAvLyBUYW5kZW0uT1BUX09VVCBhcyB0aGUgdGFuZGVtIG9wdGlvbiB0byBub3QgaW5zdHJ1bWVudCBhbiBpbnN0YW5jZS5cclxuICAgICAgdGFuZGVtOiBUYW5kZW0uUkVRVUlSRUQsXHJcblxyXG4gICAgICBwaGV0aW9SZWFkT25seTogdHJ1ZSxcclxuICAgICAgcGhldGlvRmVhdHVyZWQ6IFBoZXRpb09iamVjdC5ERUZBVUxUX09QVElPTlMucGhldGlvRmVhdHVyZWRcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiBvcHRpb25zLm1vdXNlQnV0dG9uID09PSAnbnVtYmVyJyAmJiBvcHRpb25zLm1vdXNlQnV0dG9uID49IDAgJiYgb3B0aW9ucy5tb3VzZUJ1dHRvbiAlIDEgPT09IDAsXHJcbiAgICAgICdtb3VzZUJ1dHRvbiBzaG91bGQgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG9wdGlvbnMucHJlc3NDdXJzb3IgPT09IG51bGwgfHwgdHlwZW9mIG9wdGlvbnMucHJlc3NDdXJzb3IgPT09ICdzdHJpbmcnLFxyXG4gICAgICAncHJlc3NDdXJzb3Igc2hvdWxkIGVpdGhlciBiZSBhIHN0cmluZyBvciBudWxsJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIG9wdGlvbnMucHJlc3MgPT09ICdmdW5jdGlvbicsXHJcbiAgICAgICdUaGUgcHJlc3MgY2FsbGJhY2sgc2hvdWxkIGJlIGEgZnVuY3Rpb24nICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2Ygb3B0aW9ucy5yZWxlYXNlID09PSAnZnVuY3Rpb24nLFxyXG4gICAgICAnVGhlIHJlbGVhc2UgY2FsbGJhY2sgc2hvdWxkIGJlIGEgZnVuY3Rpb24nICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2Ygb3B0aW9ucy5kcmFnID09PSAnZnVuY3Rpb24nLFxyXG4gICAgICAnVGhlIGRyYWcgY2FsbGJhY2sgc2hvdWxkIGJlIGEgZnVuY3Rpb24nICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLnRhcmdldE5vZGUgPT09IG51bGwgfHwgb3B0aW9ucy50YXJnZXROb2RlIGluc3RhbmNlb2YgTm9kZSxcclxuICAgICAgJ0lmIHByb3ZpZGVkLCB0YXJnZXROb2RlIHNob3VsZCBiZSBhIE5vZGUnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2Ygb3B0aW9ucy5hdHRhY2ggPT09ICdib29sZWFuJywgJ2F0dGFjaCBzaG91bGQgYmUgYSBib29sZWFuJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIG9wdGlvbnMuYTExeUxvb2tzUHJlc3NlZEludGVydmFsID09PSAnbnVtYmVyJyxcclxuICAgICAgJ2ExMXlMb29rc1ByZXNzZWRJbnRlcnZhbCBzaG91bGQgYmUgYSBudW1iZXInICk7XHJcblxyXG4gICAgc3VwZXIoIG9wdGlvbnMgKTtcclxuXHJcbiAgICB0aGlzLl9pZCA9IGdsb2JhbElEKys7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyKCBgUHJlc3NMaXN0ZW5lciMke3RoaXMuX2lkfSBjb25zdHJ1Y3Rpb25gICk7XHJcblxyXG4gICAgdGhpcy5fbW91c2VCdXR0b24gPSBvcHRpb25zLm1vdXNlQnV0dG9uO1xyXG4gICAgdGhpcy5fYTExeUxvb2tzUHJlc3NlZEludGVydmFsID0gb3B0aW9ucy5hMTF5TG9va3NQcmVzc2VkSW50ZXJ2YWw7XHJcbiAgICB0aGlzLl9wcmVzc0N1cnNvciA9IG9wdGlvbnMucHJlc3NDdXJzb3I7XHJcblxyXG4gICAgdGhpcy5fcHJlc3NMaXN0ZW5lciA9IG9wdGlvbnMucHJlc3M7XHJcbiAgICB0aGlzLl9yZWxlYXNlTGlzdGVuZXIgPSBvcHRpb25zLnJlbGVhc2U7XHJcbiAgICB0aGlzLl9kcmFnTGlzdGVuZXIgPSBvcHRpb25zLmRyYWc7XHJcbiAgICB0aGlzLl9jYW5TdGFydFByZXNzID0gb3B0aW9ucy5jYW5TdGFydFByZXNzO1xyXG5cclxuICAgIHRoaXMuX3RhcmdldE5vZGUgPSBvcHRpb25zLnRhcmdldE5vZGU7XHJcblxyXG4gICAgdGhpcy5fYXR0YWNoID0gb3B0aW9ucy5hdHRhY2g7XHJcbiAgICB0aGlzLl9jb2xsYXBzZURyYWdFdmVudHMgPSBvcHRpb25zLmNvbGxhcHNlRHJhZ0V2ZW50cztcclxuXHJcbiAgICB0aGlzLm92ZXJQb2ludGVycyA9IGNyZWF0ZU9ic2VydmFibGVBcnJheSgpO1xyXG5cclxuICAgIHRoaXMuaXNQcmVzc2VkUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCBmYWxzZSwgeyByZWVudHJhbnQ6IHRydWUgfSApO1xyXG4gICAgdGhpcy5pc092ZXJQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIGZhbHNlICk7XHJcbiAgICB0aGlzLmxvb2tzT3ZlclByb3BlcnR5ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggZmFsc2UgKTtcclxuICAgIHRoaXMuaXNIb3ZlcmluZ1Byb3BlcnR5ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggZmFsc2UgKTtcclxuICAgIHRoaXMuaXNIaWdobGlnaHRlZFByb3BlcnR5ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggZmFsc2UgKTtcclxuICAgIHRoaXMuaXNGb2N1c2VkUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCBmYWxzZSApO1xyXG4gICAgdGhpcy5jdXJzb3JQcm9wZXJ0eSA9IG5ldyBEZXJpdmVkUHJvcGVydHkoIFsgdGhpcy5lbmFibGVkUHJvcGVydHkgXSwgZW5hYmxlZCA9PiB7XHJcbiAgICAgIGlmICggb3B0aW9ucy51c2VJbnB1dExpc3RlbmVyQ3Vyc29yICYmIGVuYWJsZWQgJiYgdGhpcy5fYXR0YWNoICkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9wcmVzc0N1cnNvcjtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuXHJcbiAgICB0aGlzLnBvaW50ZXIgPSBudWxsO1xyXG4gICAgdGhpcy5wcmVzc2VkVHJhaWwgPSBudWxsO1xyXG4gICAgdGhpcy5pbnRlcnJ1cHRlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5fcGVuZGluZ0NvbGxhcHNlZERyYWdFdmVudCA9IG51bGw7XHJcbiAgICB0aGlzLl9saXN0ZW5pbmdUb1BvaW50ZXIgPSBmYWxzZTtcclxuICAgIHRoaXMuX2lzSG92ZXJpbmdMaXN0ZW5lciA9IHRoaXMuaW52YWxpZGF0ZUhvdmVyaW5nLmJpbmQoIHRoaXMgKTtcclxuICAgIHRoaXMuX2lzSGlnaGxpZ2h0ZWRMaXN0ZW5lciA9IHRoaXMuaW52YWxpZGF0ZUhpZ2hsaWdodGVkLmJpbmQoIHRoaXMgKTtcclxuICAgIHRoaXMucGRvbUNsaWNraW5nUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCBmYWxzZSApO1xyXG4gICAgdGhpcy5sb29rc1ByZXNzZWRQcm9wZXJ0eSA9IERlcml2ZWRQcm9wZXJ0eS5vciggWyB0aGlzLnBkb21DbGlja2luZ1Byb3BlcnR5LCB0aGlzLmlzUHJlc3NlZFByb3BlcnR5IF0gKTtcclxuICAgIHRoaXMuX3Bkb21DbGlja2luZ1RpbWVvdXRMaXN0ZW5lciA9IG51bGw7XHJcbiAgICB0aGlzLl9wb2ludGVyTGlzdGVuZXIgPSB7XHJcbiAgICAgIHVwOiB0aGlzLnBvaW50ZXJVcC5iaW5kKCB0aGlzICksXHJcbiAgICAgIGNhbmNlbDogdGhpcy5wb2ludGVyQ2FuY2VsLmJpbmQoIHRoaXMgKSxcclxuICAgICAgbW92ZTogdGhpcy5wb2ludGVyTW92ZS5iaW5kKCB0aGlzICksXHJcbiAgICAgIGludGVycnVwdDogdGhpcy5wb2ludGVySW50ZXJydXB0LmJpbmQoIHRoaXMgKSxcclxuICAgICAgbGlzdGVuZXI6IHRoaXNcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5fcHJlc3NBY3Rpb24gPSBuZXcgUGhldGlvQWN0aW9uKCB0aGlzLm9uUHJlc3MuYmluZCggdGhpcyApLCB7XHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAncHJlc3NBY3Rpb24nICksXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdFeGVjdXRlcyB3aGVuZXZlciBhIHByZXNzIG9jY3Vycy4gVGhlIGZpcnN0IGFyZ3VtZW50IHdoZW4gZXhlY3V0aW5nIGNhbiBiZSAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3VzZWQgdG8gY29udmV5IGluZm8gYWJvdXQgdGhlIFNjZW5lcnlFdmVudC4nLFxyXG4gICAgICBwaGV0aW9SZWFkT25seTogdHJ1ZSxcclxuICAgICAgcGhldGlvRmVhdHVyZWQ6IG9wdGlvbnMucGhldGlvRmVhdHVyZWQsXHJcbiAgICAgIHBoZXRpb0V2ZW50VHlwZTogRXZlbnRUeXBlLlVTRVIsXHJcbiAgICAgIHBhcmFtZXRlcnM6IFsge1xyXG4gICAgICAgIG5hbWU6ICdldmVudCcsXHJcbiAgICAgICAgcGhldGlvVHlwZTogU2NlbmVyeUV2ZW50LlNjZW5lcnlFdmVudElPXHJcbiAgICAgIH0sIHtcclxuICAgICAgICBwaGV0aW9Qcml2YXRlOiB0cnVlLFxyXG4gICAgICAgIHZhbHVlVHlwZTogWyBOb2RlLCBudWxsIF1cclxuICAgICAgfSwge1xyXG4gICAgICAgIHBoZXRpb1ByaXZhdGU6IHRydWUsXHJcbiAgICAgICAgdmFsdWVUeXBlOiBbICdmdW5jdGlvbicsIG51bGwgXVxyXG4gICAgICB9XHJcbiAgICAgIF1cclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLl9yZWxlYXNlQWN0aW9uID0gbmV3IFBoZXRpb0FjdGlvbiggdGhpcy5vblJlbGVhc2UuYmluZCggdGhpcyApLCB7XHJcbiAgICAgIHBhcmFtZXRlcnM6IFsge1xyXG4gICAgICAgIG5hbWU6ICdldmVudCcsXHJcbiAgICAgICAgcGhldGlvVHlwZTogTnVsbGFibGVJTyggU2NlbmVyeUV2ZW50LlNjZW5lcnlFdmVudElPIClcclxuICAgICAgfSwge1xyXG4gICAgICAgIHBoZXRpb1ByaXZhdGU6IHRydWUsXHJcbiAgICAgICAgdmFsdWVUeXBlOiBbICdmdW5jdGlvbicsIG51bGwgXVxyXG4gICAgICB9IF0sXHJcblxyXG4gICAgICAvLyBwaGV0LWlvXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAncmVsZWFzZUFjdGlvbicgKSxcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ0V4ZWN1dGVzIHdoZW5ldmVyIGEgcmVsZWFzZSBvY2N1cnMuJyxcclxuICAgICAgcGhldGlvUmVhZE9ubHk6IHRydWUsXHJcbiAgICAgIHBoZXRpb0ZlYXR1cmVkOiBvcHRpb25zLnBoZXRpb0ZlYXR1cmVkLFxyXG4gICAgICBwaGV0aW9FdmVudFR5cGU6IEV2ZW50VHlwZS5VU0VSXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5kaXNwbGF5ID0gbnVsbDtcclxuICAgIHRoaXMuYm91bmRJbnZhbGlkYXRlT3Zlckxpc3RlbmVyID0gdGhpcy5pbnZhbGlkYXRlT3Zlci5iaW5kKCB0aGlzICk7XHJcblxyXG4gICAgLy8gdXBkYXRlIGlzT3ZlclByb3BlcnR5IChub3QgYSBEZXJpdmVkUHJvcGVydHkgYmVjYXVzZSB3ZSBuZWVkIHRvIGhvb2sgdG8gcGFzc2VkLWluIHByb3BlcnRpZXMpXHJcbiAgICB0aGlzLm92ZXJQb2ludGVycy5sZW5ndGhQcm9wZXJ0eS5saW5rKCB0aGlzLmludmFsaWRhdGVPdmVyLmJpbmQoIHRoaXMgKSApO1xyXG4gICAgdGhpcy5pc0ZvY3VzZWRQcm9wZXJ0eS5saW5rKCB0aGlzLmludmFsaWRhdGVPdmVyLmJpbmQoIHRoaXMgKSApO1xyXG5cclxuICAgIC8vIHVwZGF0ZSBpc0hvdmVyaW5nUHJvcGVydHkgKG5vdCBhIERlcml2ZWRQcm9wZXJ0eSBiZWNhdXNlIHdlIG5lZWQgdG8gaG9vayB0byBwYXNzZWQtaW4gcHJvcGVydGllcylcclxuICAgIHRoaXMub3ZlclBvaW50ZXJzLmxlbmd0aFByb3BlcnR5LmxpbmsoIHRoaXMuX2lzSG92ZXJpbmdMaXN0ZW5lciApO1xyXG4gICAgdGhpcy5pc1ByZXNzZWRQcm9wZXJ0eS5saW5rKCB0aGlzLl9pc0hvdmVyaW5nTGlzdGVuZXIgKTtcclxuXHJcbiAgICAvLyBVcGRhdGUgaXNIb3ZlcmluZyB3aGVuIGFueSBwb2ludGVyJ3MgaXNEb3duUHJvcGVydHkgY2hhbmdlcy5cclxuICAgIC8vIE5PVEU6IG92ZXJQb2ludGVycyBpcyBjbGVhcmVkIG9uIGRpc3Bvc2UsIHdoaWNoIHNob3VsZCByZW1vdmUgYWxsIG9mIHRoZXNlIChpbnRlcmlvcikgbGlzdGVuZXJzKVxyXG4gICAgdGhpcy5vdmVyUG9pbnRlcnMuYWRkSXRlbUFkZGVkTGlzdGVuZXIoIHBvaW50ZXIgPT4gcG9pbnRlci5pc0Rvd25Qcm9wZXJ0eS5saW5rKCB0aGlzLl9pc0hvdmVyaW5nTGlzdGVuZXIgKSApO1xyXG4gICAgdGhpcy5vdmVyUG9pbnRlcnMuYWRkSXRlbVJlbW92ZWRMaXN0ZW5lciggcG9pbnRlciA9PiBwb2ludGVyLmlzRG93blByb3BlcnR5LnVubGluayggdGhpcy5faXNIb3ZlcmluZ0xpc3RlbmVyICkgKTtcclxuXHJcbiAgICAvLyB1cGRhdGUgaXNIaWdobGlnaHRlZFByb3BlcnR5IChub3QgYSBEZXJpdmVkUHJvcGVydHkgYmVjYXVzZSB3ZSBuZWVkIHRvIGhvb2sgdG8gcGFzc2VkLWluIHByb3BlcnRpZXMpXHJcbiAgICB0aGlzLmlzSG92ZXJpbmdQcm9wZXJ0eS5saW5rKCB0aGlzLl9pc0hpZ2hsaWdodGVkTGlzdGVuZXIgKTtcclxuICAgIHRoaXMuaXNQcmVzc2VkUHJvcGVydHkubGluayggdGhpcy5faXNIaWdobGlnaHRlZExpc3RlbmVyICk7XHJcblxyXG4gICAgdGhpcy5lbmFibGVkUHJvcGVydHkubGF6eUxpbmsoIHRoaXMub25FbmFibGVkUHJvcGVydHlDaGFuZ2UuYmluZCggdGhpcyApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGV0aGVyIHRoaXMgbGlzdGVuZXIgaXMgY3VycmVudGx5IGFjdGl2YXRlZCB3aXRoIGEgcHJlc3MuXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBpc1ByZXNzZWQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5pc1ByZXNzZWRQcm9wZXJ0eS52YWx1ZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgY3Vyc29yKCk6IHN0cmluZyB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuY3Vyc29yUHJvcGVydHkudmFsdWU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGF0dGFjaCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl9hdHRhY2g7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHRhcmdldE5vZGUoKTogTm9kZSB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuX3RhcmdldE5vZGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgbWFpbiBub2RlIHRoYXQgdGhpcyBsaXN0ZW5lciBpcyByZXNwb25zaWJsZSBmb3IgZHJhZ2dpbmcuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEN1cnJlbnRUYXJnZXQoKTogTm9kZSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmlzUHJlc3NlZCwgJ1dlIGhhdmUgbm8gY3VycmVudFRhcmdldCBpZiB3ZSBhcmUgbm90IHByZXNzZWQnICk7XHJcblxyXG4gICAgcmV0dXJuICggdGhpcyBhcyBQcmVzc2VkUHJlc3NMaXN0ZW5lciApLnByZXNzZWRUcmFpbC5sYXN0Tm9kZSgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBjdXJyZW50VGFyZ2V0KCk6IE5vZGUge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q3VycmVudFRhcmdldCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIGEgcHJlc3MgY2FuIGJlIHN0YXJ0ZWQgd2l0aCBhIHBhcnRpY3VsYXIgZXZlbnQuXHJcbiAgICovXHJcbiAgcHVibGljIGNhblByZXNzKCBldmVudDogUHJlc3NMaXN0ZW5lckV2ZW50ICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuICEhdGhpcy5lbmFibGVkUHJvcGVydHkudmFsdWUgJiZcclxuICAgICAgICAgICAhdGhpcy5pc1ByZXNzZWQgJiZcclxuICAgICAgICAgICB0aGlzLl9jYW5TdGFydFByZXNzKCBldmVudCwgdGhpcyApICYmXHJcbiAgICAgICAgICAgLy8gT25seSBsZXQgcHJlc3NlcyBiZSBzdGFydGVkIHdpdGggdGhlIGNvcnJlY3QgbW91c2UgYnV0dG9uLlxyXG4gICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgVHlwZWQgU2NlbmVyeUV2ZW50XHJcbiAgICAgICAgICAgKCAhKCBldmVudC5wb2ludGVyIGluc3RhbmNlb2YgTW91c2UgKSB8fCBldmVudC5kb21FdmVudC5idXR0b24gPT09IHRoaXMuX21vdXNlQnV0dG9uICkgJiZcclxuICAgICAgICAgICAvLyBXZSBjYW4ndCBhdHRhY2ggdG8gYSBwb2ludGVyIHRoYXQgaXMgYWxyZWFkeSBhdHRhY2hlZC5cclxuICAgICAgICAgICAoICF0aGlzLl9hdHRhY2ggfHwgIWV2ZW50LnBvaW50ZXIuaXNBdHRhY2hlZCgpICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhpcyBQcmVzc0xpc3RlbmVyIGNhbiBiZSBjbGlja2VkIGZyb20ga2V5Ym9hcmQgaW5wdXQuIFRoaXMgY29waWVzIHBhcnQgb2YgY2FuUHJlc3MsIGJ1dFxyXG4gICAqIHdlIGRpZG4ndCB3YW50IHRvIHVzZSBjYW5DbGljayBpbiBjYW5QcmVzcyBiZWNhdXNlIGNhbkNsaWNrIGNvdWxkIGJlIG92ZXJyaWRkZW4gaW4gc3VidHlwZXMuXHJcbiAgICovXHJcbiAgcHVibGljIGNhbkNsaWNrKCk6IGJvb2xlYW4ge1xyXG4gICAgLy8gSWYgdGhpcyBsaXN0ZW5lciBpcyBhbHJlYWR5IGludm9sdmVkIGluIHByZXNzaW5nIHNvbWV0aGluZyAob3Igb3VyIG9wdGlvbnMgcHJlZGljYXRlIHJldHVybnMgZmFsc2UpIHdlIGNhbid0XHJcbiAgICAvLyBwcmVzcyBzb21ldGhpbmcuXHJcbiAgICByZXR1cm4gdGhpcy5lbmFibGVkUHJvcGVydHkudmFsdWUgJiYgIXRoaXMuaXNQcmVzc2VkICYmIHRoaXMuX2NhblN0YXJ0UHJlc3MoIG51bGwsIHRoaXMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1vdmVzIHRoZSBsaXN0ZW5lciB0byB0aGUgJ3ByZXNzZWQnIHN0YXRlIGlmIHBvc3NpYmxlIChhdHRhY2hlcyBsaXN0ZW5lcnMgYW5kIGluaXRpYWxpemVzIHByZXNzLXJlbGF0ZWRcclxuICAgKiBwcm9wZXJ0aWVzKS5cclxuICAgKlxyXG4gICAqIFRoaXMgY2FuIGJlIG92ZXJyaWRkZW4gKHdpdGggc3VwZXItY2FsbHMpIHdoZW4gY3VzdG9tIHByZXNzIGJlaGF2aW9yIGlzIG5lZWRlZCBmb3IgYSB0eXBlLlxyXG4gICAqXHJcbiAgICogVGhpcyBjYW4gYmUgY2FsbGVkIGJ5IG91dHNpZGUgY2xpZW50cyBpbiBvcmRlciB0byB0cnkgdG8gYmVnaW4gYSBwcm9jZXNzIChnZW5lcmFsbHkgb24gYW4gYWxyZWFkeS1wcmVzc2VkXHJcbiAgICogcG9pbnRlciksIGFuZCBpcyB1c2VmdWwgaWYgYSAnZHJhZycgbmVlZHMgdG8gY2hhbmdlIGJldHdlZW4gbGlzdGVuZXJzLiBVc2UgY2FuUHJlc3MoIGV2ZW50ICkgdG8gZGV0ZXJtaW5lIGlmXHJcbiAgICogYSBwcmVzcyBjYW4gYmUgc3RhcnRlZCAoaWYgbmVlZGVkIGJlZm9yZWhhbmQpLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGV2ZW50XHJcbiAgICogQHBhcmFtIFt0YXJnZXROb2RlXSAtIElmIHByb3ZpZGVkLCB3aWxsIHRha2UgdGhlIHBsYWNlIG9mIHRoZSB0YXJnZXROb2RlIGZvciB0aGlzIGNhbGwuIFVzZWZ1bCBmb3JcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcndhcmRlZCBwcmVzc2VzLlxyXG4gICAqIEBwYXJhbSBbY2FsbGJhY2tdIC0gdG8gYmUgcnVuIGF0IHRoZSBlbmQgb2YgdGhlIGZ1bmN0aW9uLCBidXQgb25seSBvbiBzdWNjZXNzXHJcbiAgICogQHJldHVybnMgc3VjY2VzcyAtIFJldHVybnMgd2hldGhlciB0aGUgcHJlc3Mgd2FzIGFjdHVhbGx5IHN0YXJ0ZWRcclxuICAgKi9cclxuICBwdWJsaWMgcHJlc3MoIGV2ZW50OiBQcmVzc0xpc3RlbmVyRXZlbnQsIHRhcmdldE5vZGU/OiBOb2RlLCBjYWxsYmFjaz86ICgpID0+IHZvaWQgKTogYm9vbGVhbiB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBldmVudCwgJ0FuIGV2ZW50IGlzIHJlcXVpcmVkJyApO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciggYFByZXNzTGlzdGVuZXIjJHt0aGlzLl9pZH0gcHJlc3NgICk7XHJcblxyXG4gICAgaWYgKCAhdGhpcy5jYW5QcmVzcyggZXZlbnQgKSApIHtcclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyKCBgUHJlc3NMaXN0ZW5lciMke3RoaXMuX2lkfSBjb3VsZCBub3QgcHJlc3NgICk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGbHVzaCBvdXQgYSBwZW5kaW5nIGRyYWcsIHNvIGl0IGhhcHBlbnMgYmVmb3JlIHdlIHByZXNzXHJcbiAgICB0aGlzLmZsdXNoQ29sbGFwc2VkRHJhZygpO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciggYFByZXNzTGlzdGVuZXIjJHt0aGlzLl9pZH0gc3VjY2Vzc2Z1bCBwcmVzc2AgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG4gICAgdGhpcy5fcHJlc3NBY3Rpb24uZXhlY3V0ZSggZXZlbnQsIHRhcmdldE5vZGUgfHwgbnVsbCwgY2FsbGJhY2sgfHwgbnVsbCApOyAvLyBjYW5ub3QgcGFzcyB1bmRlZmluZWQgaW50byBleGVjdXRlIGNhbGxcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG5cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVsZWFzZXMgYSBwcmVzc2VkIGxpc3RlbmVyLlxyXG4gICAqXHJcbiAgICogVGhpcyBjYW4gYmUgb3ZlcnJpZGRlbiAod2l0aCBzdXBlci1jYWxscykgd2hlbiBjdXN0b20gcmVsZWFzZSBiZWhhdmlvciBpcyBuZWVkZWQgZm9yIGEgdHlwZS5cclxuICAgKlxyXG4gICAqIFRoaXMgY2FuIGJlIGNhbGxlZCBmcm9tIHRoZSBvdXRzaWRlIHRvIHJlbGVhc2UgdGhlIHByZXNzIHdpdGhvdXQgdGhlIHBvaW50ZXIgaGF2aW5nIGFjdHVhbGx5IGZpcmVkIGFueSAndXAnXHJcbiAgICogZXZlbnRzLiBJZiB0aGUgY2FuY2VsL2ludGVycnVwdCBiZWhhdmlvciBpcyBtb3JlIHByZWZlcmFibGUsIGNhbGwgaW50ZXJydXB0KCkgb24gdGhpcyBsaXN0ZW5lciBpbnN0ZWFkLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIFtldmVudF0gLSBzY2VuZXJ5IGV2ZW50IGlmIHRoZXJlIHdhcyBvbmUuIFdlIGNhbid0IGd1YXJhbnRlZSBhbiBldmVudCwgaW4gcGFydCB0byBzdXBwb3J0IGludGVycnVwdGluZy5cclxuICAgKiBAcGFyYW0gW2NhbGxiYWNrXSAtIGNhbGxlZCBhdCB0aGUgZW5kIG9mIHRoZSByZWxlYXNlXHJcbiAgICovXHJcbiAgcHVibGljIHJlbGVhc2UoIGV2ZW50PzogUHJlc3NMaXN0ZW5lckV2ZW50LCBjYWxsYmFjaz86ICgpID0+IHZvaWQgKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIoIGBQcmVzc0xpc3RlbmVyIyR7dGhpcy5faWR9IHJlbGVhc2VgICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICAvLyBGbHVzaCBvdXQgYSBwZW5kaW5nIGRyYWcsIHNvIGl0IGhhcHBlbnMgYmVmb3JlIHdlIHJlbGVhc2VcclxuICAgIHRoaXMuZmx1c2hDb2xsYXBzZWREcmFnKCk7XHJcblxyXG4gICAgdGhpcy5fcmVsZWFzZUFjdGlvbi5leGVjdXRlKCBldmVudCB8fCBudWxsLCBjYWxsYmFjayB8fCBudWxsICk7IC8vIGNhbm5vdCBwYXNzIHVuZGVmaW5lZCB0byBleGVjdXRlIGNhbGxcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIHdoZW4gbW92ZSBldmVudHMgYXJlIGZpcmVkIG9uIHRoZSBhdHRhY2hlZCBwb2ludGVyIGxpc3RlbmVyLlxyXG4gICAqXHJcbiAgICogVGhpcyBjYW4gYmUgb3ZlcnJpZGRlbiAod2l0aCBzdXBlci1jYWxscykgd2hlbiBjdXN0b20gZHJhZyBiZWhhdmlvciBpcyBuZWVkZWQgZm9yIGEgdHlwZS5cclxuICAgKlxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsLCBlZmZlY3RpdmVseSBwcm90ZWN0ZWQpXHJcbiAgICovXHJcbiAgcHVibGljIGRyYWcoIGV2ZW50OiBQcmVzc0xpc3RlbmVyRXZlbnQgKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIoIGBQcmVzc0xpc3RlbmVyIyR7dGhpcy5faWR9IGRyYWdgICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmlzUHJlc3NlZCwgJ0NhbiBvbmx5IGRyYWcgd2hpbGUgcHJlc3NlZCcgKTtcclxuXHJcbiAgICB0aGlzLl9kcmFnTGlzdGVuZXIoIGV2ZW50LCB0aGlzICk7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEludGVycnVwdHMgdGhlIGxpc3RlbmVyLCByZWxlYXNpbmcgaXQgKGNhbmNlbGluZyBiZWhhdmlvcikuXHJcbiAgICpcclxuICAgKiBUaGlzIGVmZmVjdGl2ZWx5IHJlbGVhc2VzL2VuZHMgdGhlIHByZXNzLCBhbmQgc2V0cyB0aGUgYGludGVycnVwdGVkYCBmbGFnIHRvIHRydWUgd2hpbGUgZmlyaW5nIHRoZXNlIGV2ZW50c1xyXG4gICAqIHNvIHRoYXQgY29kZSBjYW4gZGV0ZXJtaW5lIHdoZXRoZXIgYSByZWxlYXNlL2VuZCBoYXBwZW5lZCBuYXR1cmFsbHksIG9yIHdhcyBjYW5jZWxlZCBpbiBzb21lIHdheS5cclxuICAgKlxyXG4gICAqIFRoaXMgY2FuIGJlIGNhbGxlZCBtYW51YWxseSwgYnV0IGNhbiBhbHNvIGJlIGNhbGxlZCB0aHJvdWdoIG5vZGUuaW50ZXJydXB0U3VidHJlZUlucHV0KCkuXHJcbiAgICovXHJcbiAgcHVibGljIGludGVycnVwdCgpOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciggYFByZXNzTGlzdGVuZXIjJHt0aGlzLl9pZH0gaW50ZXJydXB0YCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgLy8gaGFuZGxlIHBkb20gaW50ZXJydXB0XHJcbiAgICBpZiAoIHRoaXMucGRvbUNsaWNraW5nUHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgIHRoaXMuaW50ZXJydXB0ZWQgPSB0cnVlO1xyXG5cclxuICAgICAgLy8gaXQgaXMgcG9zc2libGUgd2UgYXJlIGludGVycnVwdGluZyBhIGNsaWNrIHdpdGggYSBwb2ludGVyIHByZXNzLCBpbiB3aGljaCBjYXNlXHJcbiAgICAgIC8vIHdlIGFyZSBsaXN0ZW5pbmcgdG8gdGhlIFBvaW50ZXIgbGlzdGVuZXIgLSBkbyBhIGZ1bGwgcmVsZWFzZSBpbiB0aGlzIGNhc2VcclxuICAgICAgaWYgKCB0aGlzLl9saXN0ZW5pbmdUb1BvaW50ZXIgKSB7XHJcbiAgICAgICAgdGhpcy5yZWxlYXNlKCk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgIC8vIHJlbGVhc2Ugb24gaW50ZXJydXB0ICh3aXRob3V0IGdvaW5nIHRocm91Z2ggb25SZWxlYXNlLCB3aGljaCBoYW5kbGVzIG1vdXNlL3RvdWNoIHNwZWNpZmljIHRoaW5ncylcclxuICAgICAgICB0aGlzLmlzUHJlc3NlZFByb3BlcnR5LnZhbHVlID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fcmVsZWFzZUxpc3RlbmVyKCBudWxsLCB0aGlzICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGNsZWFyIHRoZSBjbGlja2luZyB0aW1lciwgc3BlY2lmaWMgdG8gcGRvbSBpbnB1dFxyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIFRPRE86IFRoaXMgbG9va3MgYnVnZ3ksIHdpbGwgbmVlZCB0byBpZ25vcmUgZm9yIG5vdyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICBpZiAoIHN0ZXBUaW1lci5oYXNMaXN0ZW5lciggdGhpcy5fcGRvbUNsaWNraW5nVGltZW91dExpc3RlbmVyICkgKSB7XHJcbiAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBUT0RPOiBUaGlzIGxvb2tzIGJ1Z2d5LCB3aWxsIG5lZWQgdG8gaWdub3JlIGZvciBub3cgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgICBzdGVwVGltZXIuY2xlYXJUaW1lb3V0KCB0aGlzLl9wZG9tQ2xpY2tpbmdUaW1lb3V0TGlzdGVuZXIgKTtcclxuXHJcbiAgICAgICAgLy8gaW50ZXJydXB0IG1heSBiZSBjYWxsZWQgYWZ0ZXIgdGhlIFByZXNzTGlzdGVuZXIgaGFzIGJlZW4gZGlzcG9zZWQgKGZvciBpbnN0YW5jZSwgaW50ZXJuYWxseSBieSBzY2VuZXJ5XHJcbiAgICAgICAgLy8gaWYgdGhlIE5vZGUgcmVjZWl2ZXMgYSBibHVyIGV2ZW50IGFmdGVyIHRoZSBQcmVzc0xpc3RlbmVyIGlzIGRpc3Bvc2VkKVxyXG4gICAgICAgIGlmICggIXRoaXMucGRvbUNsaWNraW5nUHJvcGVydHkuaXNEaXNwb3NlZCApIHtcclxuICAgICAgICAgIHRoaXMucGRvbUNsaWNraW5nUHJvcGVydHkudmFsdWUgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0aGlzLmlzUHJlc3NlZCApIHtcclxuXHJcbiAgICAgIC8vIGhhbmRsZSBwb2ludGVyIGludGVycnVwdFxyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIoIGBQcmVzc0xpc3RlbmVyIyR7dGhpcy5faWR9IGludGVycnVwdGluZ2AgKTtcclxuICAgICAgdGhpcy5pbnRlcnJ1cHRlZCA9IHRydWU7XHJcblxyXG4gICAgICB0aGlzLnJlbGVhc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhpcyBzaG91bGQgYmUgY2FsbGVkIHdoZW4gdGhlIGxpc3RlbmVkIFwiTm9kZVwiIGlzIGVmZmVjdGl2ZWx5IHJlbW92ZWQgZnJvbSB0aGUgc2NlbmUgZ3JhcGggQU5EXHJcbiAgICogZXhwZWN0ZWQgdG8gYmUgcGxhY2VkIGJhY2sgaW4gc3VjaCB0aGF0IGl0IGNvdWxkIHBvdGVudGlhbGx5IGdldCBtdWx0aXBsZSBcImVudGVyXCIgZXZlbnRzLCBzZWVcclxuICAgKiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTAyMVxyXG4gICAqXHJcbiAgICogVGhpcyB3aWxsIGNsZWFyIHRoZSBsaXN0IG9mIHBvaW50ZXJzIGNvbnNpZGVyZWQgXCJvdmVyXCIgdGhlIE5vZGUsIHNvIHRoYXQgd2hlbiBpdCBpcyBwbGFjZWQgYmFjayBpbiwgdGhlIHN0YXRlXHJcbiAgICogd2lsbCBiZSBjb3JyZWN0LCBhbmQgYW5vdGhlciBcImVudGVyXCIgZXZlbnQgd2lsbCBub3QgYmUgbWlzc2luZyBhbiBcImV4aXRcIi5cclxuICAgKi9cclxuICBwdWJsaWMgY2xlYXJPdmVyUG9pbnRlcnMoKTogdm9pZCB7XHJcbiAgICB0aGlzLm92ZXJQb2ludGVycy5jbGVhcigpOyAvLyBXZSBoYXZlIGxpc3RlbmVycyB0aGF0IHdpbGwgdHJpZ2dlciB0aGUgcHJvcGVyIHJlZnJlc2hlc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSWYgY29sbGFwc2VEcmFnRXZlbnRzIGlzIHNldCB0byB0cnVlLCB0aGlzIHN0ZXAoKSBzaG91bGQgYmUgY2FsbGVkIGV2ZXJ5IGZyYW1lIHNvIHRoYXQgdGhlIGNvbGxhcHNlZCBkcmFnXHJcbiAgICogY2FuIGJlIGZpcmVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGVwKCk6IHZvaWQge1xyXG4gICAgdGhpcy5mbHVzaENvbGxhcHNlZERyYWcoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgY2FsbGJhY2sgdGhhdCB3aWxsIGNyZWF0ZSBhIEJvdW5kczIgaW4gdGhlIGdsb2JhbCBjb29yZGluYXRlIGZyYW1lIGZvciB0aGUgQW5pbWF0ZWRQYW5ab29tTGlzdGVuZXIgdG9cclxuICAgKiBrZWVwIGluIHZpZXcgZHVyaW5nIGEgZHJhZyBvcGVyYXRpb24uIER1cmluZyBkcmFnIGlucHV0IHRoZSBBbmltYXRlZFBhblpvb21MaXN0ZW5lciB3aWxsIHBhbiB0aGUgc2NyZWVuIHRvXHJcbiAgICogdHJ5IGFuZCBrZWVwIHRoZSByZXR1cm5lZCBCb3VuZHMyIHZpc2libGUuIEJ5IGRlZmF1bHQsIHRoZSBBbmltYXRlZFBhblpvb21MaXN0ZW5lciB3aWxsIHRyeSB0byBrZWVwIHRoZSB0YXJnZXQgb2ZcclxuICAgKiB0aGUgZHJhZyBpbiB2aWV3IGJ1dCB0aGF0IG1heSBub3QgYWx3YXlzIHdvcmsgaWYgdGhlIHRhcmdldCBpcyBub3QgYXNzb2NpYXRlZCB3aXRoIHRoZSB0cmFuc2xhdGVkIE5vZGUsIHRoZSB0YXJnZXRcclxuICAgKiBpcyBub3QgZGVmaW5lZCwgb3IgdGhlIHRhcmdldCBoYXMgYm91bmRzIHRoYXQgZG8gbm90IGFjY3VyYXRlbHkgc3Vycm91bmQgdGhlIGdyYXBoaWMgeW91IHdhbnQgdG8ga2VlcCBpbiB2aWV3LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRDcmVhdGVQYW5UYXJnZXRCb3VuZHMoIGNyZWF0ZURyYWdQYW5UYXJnZXRCb3VuZHM6ICggKCkgPT4gQm91bmRzMiApIHwgbnVsbCApOiB2b2lkIHtcclxuXHJcbiAgICAvLyBGb3J3YXJkZWQgdG8gdGhlIHBvaW50ZXJMaXN0ZW5lciBzbyB0aGF0IHRoZSBBbmltYXRlZFBhblpvb21MaXN0ZW5lciBjYW4gZ2V0IHRoaXMgY2FsbGJhY2sgZnJvbSB0aGUgYXR0YWNoZWRcclxuICAgIC8vIGxpc3RlbmVyXHJcbiAgICB0aGlzLl9wb2ludGVyTGlzdGVuZXIuY3JlYXRlUGFuVGFyZ2V0Qm91bmRzID0gY3JlYXRlRHJhZ1BhblRhcmdldEJvdW5kcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgY3JlYXRlUGFuVGFyZ2V0Qm91bmRzKCBjcmVhdGVEcmFnUGFuVGFyZ2V0Qm91bmRzOiAoICgpID0+IEJvdW5kczIgKSB8IG51bGwgKSB7IHRoaXMuc2V0Q3JlYXRlUGFuVGFyZ2V0Qm91bmRzKCBjcmVhdGVEcmFnUGFuVGFyZ2V0Qm91bmRzICk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSBjb252ZW5pZW50IHdheSB0byBjcmVhdGUgYW5kIHNldCB0aGUgY2FsbGJhY2sgdGhhdCB3aWxsIHJldHVybiBhIEJvdW5kczIgaW4gdGhlIGdsb2JhbCBjb29yZGluYXRlIGZyYW1lIGZvciB0aGVcclxuICAgKiBBbmltYXRlZFBhblpvb21MaXN0ZW5lciB0byBrZWVwIGluIHZpZXcgZHVyaW5nIGEgZHJhZyBvcGVyYXRpb24uIFRoZSBBbmltYXRlZFBhblpvb21MaXN0ZW5lciB3aWxsIHRyeSB0byBrZWVwIHRoZVxyXG4gICAqIGJvdW5kcyBvZiB0aGUgbGFzdCBOb2RlIG9mIHRoZSBwcm92aWRlZCB0cmFpbCB2aXNpYmxlIGJ5IHBhbm5pbmcgdGhlIHNjcmVlbiBkdXJpbmcgYSBkcmFnIG9wZXJhdGlvbi4gU2VlXHJcbiAgICogc2V0Q3JlYXRlUGFuVGFyZ2V0Qm91bmRzKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0Q3JlYXRlUGFuVGFyZ2V0Qm91bmRzRnJvbVRyYWlsKCB0cmFpbDogVHJhaWwgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0cmFpbC5sZW5ndGggPiAwLCAndHJhaWwgaGFzIG5vIE5vZGVzIHRvIHByb3ZpZGUgbG9jYWxCb3VuZHMnICk7XHJcbiAgICB0aGlzLnNldENyZWF0ZVBhblRhcmdldEJvdW5kcyggKCkgPT4gdHJhaWwubG9jYWxUb0dsb2JhbEJvdW5kcyggdHJhaWwubGFzdE5vZGUoKS5sb2NhbEJvdW5kcyApICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGNyZWF0ZVBhblRhcmdldEJvdW5kc0Zyb21UcmFpbCggdHJhaWw6IFRyYWlsICkgeyB0aGlzLnNldENyZWF0ZVBhblRhcmdldEJvdW5kc0Zyb21UcmFpbCggdHJhaWwgKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBJZiB0aGVyZSBpcyBhIHBlbmRpbmcgY29sbGFwc2VkIGRyYWcgd2FpdGluZywgd2UnbGwgZmlyZSB0aGF0IGRyYWcgKHVzdWFsbHkgYmVmb3JlIG90aGVyIGV2ZW50cyBvciBkdXJpbmcgYSBzdGVwKVxyXG4gICAqL1xyXG4gIHByaXZhdGUgZmx1c2hDb2xsYXBzZWREcmFnKCk6IHZvaWQge1xyXG4gICAgaWYgKCB0aGlzLl9wZW5kaW5nQ29sbGFwc2VkRHJhZ0V2ZW50ICkge1xyXG4gICAgICB0aGlzLmRyYWcoIHRoaXMuX3BlbmRpbmdDb2xsYXBzZWREcmFnRXZlbnQgKTtcclxuICAgIH1cclxuICAgIHRoaXMuX3BlbmRpbmdDb2xsYXBzZWREcmFnRXZlbnQgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVjb21wdXRlcyB0aGUgdmFsdWUgZm9yIGlzT3ZlclByb3BlcnR5LiBTZXBhcmF0ZSB0byByZWR1Y2UgYW5vbnltb3VzIGZ1bmN0aW9uIGNsb3N1cmVzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgaW52YWxpZGF0ZU92ZXIoKTogdm9pZCB7XHJcbiAgICBsZXQgcG9pbnRlckF0dGFjaGVkVG9PdGhlciA9IGZhbHNlO1xyXG5cclxuICAgIGlmICggdGhpcy5fbGlzdGVuaW5nVG9Qb2ludGVyICkge1xyXG5cclxuICAgICAgLy8gdGhpcyBwb2ludGVyIGxpc3RlbmVyIGlzIGF0dGFjaGVkIHRvIHRoZSBwb2ludGVyXHJcbiAgICAgIHBvaW50ZXJBdHRhY2hlZFRvT3RoZXIgPSBmYWxzZTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG5cclxuICAgICAgLy8gYSBsaXN0ZW5lciBvdGhlciB0aGFuIHRoaXMgb25lIGlzIGF0dGFjaGVkIHRvIHRoZSBwb2ludGVyIHNvIGl0IHNob3VsZCBub3QgYmUgY29uc2lkZXJlZCBvdmVyXHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMub3ZlclBvaW50ZXJzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIGlmICggdGhpcy5vdmVyUG9pbnRlcnMuZ2V0KCBpICkuaXNBdHRhY2hlZCgpICkge1xyXG4gICAgICAgICAgcG9pbnRlckF0dGFjaGVkVG9PdGhlciA9IHRydWU7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBpc092ZXJQcm9wZXJ0eSBpcyBvbmx5IGZvciB0aGUgYG92ZXJgIGV2ZW50LCBsb29rc092ZXJQcm9wZXJ0eSBpbmNsdWRlcyBmb2N1c2VkIHByZXNzTGlzdGVuZXJzIChvbmx5IHdoZW4gdGhlXHJcbiAgICAvLyBkaXNwbGF5IGlzIHNob3dpbmcgZm9jdXMgaGlnaGxpZ2h0cylcclxuICAgIHRoaXMuaXNPdmVyUHJvcGVydHkudmFsdWUgPSAoIHRoaXMub3ZlclBvaW50ZXJzLmxlbmd0aCA+IDAgJiYgIXBvaW50ZXJBdHRhY2hlZFRvT3RoZXIgKTtcclxuICAgIHRoaXMubG9va3NPdmVyUHJvcGVydHkudmFsdWUgPSB0aGlzLmlzT3ZlclByb3BlcnR5LnZhbHVlIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCB0aGlzLmlzRm9jdXNlZFByb3BlcnR5LnZhbHVlICYmICEhdGhpcy5kaXNwbGF5ICYmIHRoaXMuZGlzcGxheS5mb2N1c01hbmFnZXIucGRvbUZvY3VzSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eS52YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVjb21wdXRlcyB0aGUgdmFsdWUgZm9yIGlzSG92ZXJpbmdQcm9wZXJ0eS4gU2VwYXJhdGUgdG8gcmVkdWNlIGFub255bW91cyBmdW5jdGlvbiBjbG9zdXJlcy5cclxuICAgKi9cclxuICBwcml2YXRlIGludmFsaWRhdGVIb3ZlcmluZygpOiB2b2lkIHtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMub3ZlclBvaW50ZXJzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBwb2ludGVyID0gdGhpcy5vdmVyUG9pbnRlcnNbIGkgXTtcclxuICAgICAgaWYgKCAhcG9pbnRlci5pc0Rvd24gfHwgcG9pbnRlciA9PT0gdGhpcy5wb2ludGVyICkge1xyXG4gICAgICAgIHRoaXMuaXNIb3ZlcmluZ1Byb3BlcnR5LnZhbHVlID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuaXNIb3ZlcmluZ1Byb3BlcnR5LnZhbHVlID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWNvbXB1dGVzIHRoZSB2YWx1ZSBmb3IgaXNIaWdobGlnaHRlZFByb3BlcnR5LiBTZXBhcmF0ZSB0byByZWR1Y2UgYW5vbnltb3VzIGZ1bmN0aW9uIGNsb3N1cmVzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgaW52YWxpZGF0ZUhpZ2hsaWdodGVkKCk6IHZvaWQge1xyXG4gICAgdGhpcy5pc0hpZ2hsaWdodGVkUHJvcGVydHkudmFsdWUgPSB0aGlzLmlzSG92ZXJpbmdQcm9wZXJ0eS52YWx1ZSB8fCB0aGlzLmlzUHJlc3NlZFByb3BlcnR5LnZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmlyZWQgd2hlbiB0aGUgZW5hYmxlZFByb3BlcnR5IGNoYW5nZXNcclxuICAgKi9cclxuICBwcm90ZWN0ZWQgb25FbmFibGVkUHJvcGVydHlDaGFuZ2UoIGVuYWJsZWQ6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICAhZW5hYmxlZCAmJiB0aGlzLmludGVycnVwdCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW50ZXJuYWwgY29kZSBleGVjdXRlZCBhcyB0aGUgZmlyc3Qgc3RlcCBvZiBhIHByZXNzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGV2ZW50XHJcbiAgICogQHBhcmFtIFt0YXJnZXROb2RlXSAtIElmIHByb3ZpZGVkLCB3aWxsIHRha2UgdGhlIHBsYWNlIG9mIHRoZSB0YXJnZXROb2RlIGZvciB0aGlzIGNhbGwuIFVzZWZ1bCBmb3JcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcndhcmRlZCBwcmVzc2VzLlxyXG4gICAqIEBwYXJhbSBbY2FsbGJhY2tdIC0gdG8gYmUgcnVuIGF0IHRoZSBlbmQgb2YgdGhlIGZ1bmN0aW9uLCBidXQgb25seSBvbiBzdWNjZXNzXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBvblByZXNzKCBldmVudDogUHJlc3NMaXN0ZW5lckV2ZW50LCB0YXJnZXROb2RlOiBOb2RlIHwgbnVsbCwgY2FsbGJhY2s6ICggKCkgPT4gdm9pZCApIHwgbnVsbCApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLmlzRGlzcG9zZWQsICdTaG91bGQgbm90IHByZXNzIG9uIGEgZGlzcG9zZWQgbGlzdGVuZXInICk7XHJcblxyXG4gICAgY29uc3QgZ2l2ZW5UYXJnZXROb2RlID0gdGFyZ2V0Tm9kZSB8fCB0aGlzLl90YXJnZXROb2RlO1xyXG5cclxuICAgIC8vIFNldCB0aGlzIHByb3BlcnRpZXMgYmVmb3JlIHRoZSBwcm9wZXJ0eSBjaGFuZ2UsIHNvIHRoZXkgYXJlIHZpc2libGUgdG8gbGlzdGVuZXJzLlxyXG4gICAgdGhpcy5wb2ludGVyID0gZXZlbnQucG9pbnRlcjtcclxuICAgIHRoaXMucHJlc3NlZFRyYWlsID0gZ2l2ZW5UYXJnZXROb2RlID8gZ2l2ZW5UYXJnZXROb2RlLmdldFVuaXF1ZVRyYWlsKCkgOiBldmVudC50cmFpbC5zdWJ0cmFpbFRvKCBldmVudC5jdXJyZW50VGFyZ2V0ISwgZmFsc2UgKTtcclxuXHJcbiAgICB0aGlzLmludGVycnVwdGVkID0gZmFsc2U7IC8vIGNsZWFycyB0aGUgZmxhZyAoZG9uJ3Qgc2V0IHRvIGZhbHNlIGJlZm9yZSBoZXJlKVxyXG5cclxuICAgIHRoaXMucG9pbnRlci5hZGRJbnB1dExpc3RlbmVyKCB0aGlzLl9wb2ludGVyTGlzdGVuZXIsIHRoaXMuX2F0dGFjaCApO1xyXG4gICAgdGhpcy5fbGlzdGVuaW5nVG9Qb2ludGVyID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLnBvaW50ZXIuY3Vyc29yID0gdGhpcy5wcmVzc2VkVHJhaWwubGFzdE5vZGUoKS5nZXRFZmZlY3RpdmVDdXJzb3IoKSB8fCB0aGlzLl9wcmVzc0N1cnNvcjtcclxuXHJcbiAgICB0aGlzLmlzUHJlc3NlZFByb3BlcnR5LnZhbHVlID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBOb3RpZnkgYWZ0ZXIgZXZlcnl0aGluZyBlbHNlIGlzIHNldCB1cFxyXG4gICAgdGhpcy5fcHJlc3NMaXN0ZW5lciggZXZlbnQsIHRoaXMgKTtcclxuXHJcbiAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW50ZXJuYWwgY29kZSBleGVjdXRlZCBhcyB0aGUgZmlyc3Qgc3RlcCBvZiBhIHJlbGVhc2UuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gZXZlbnQgLSBzY2VuZXJ5IGV2ZW50IGlmIHRoZXJlIHdhcyBvbmVcclxuICAgKiBAcGFyYW0gW2NhbGxiYWNrXSAtIGNhbGxlZCBhdCB0aGUgZW5kIG9mIHRoZSByZWxlYXNlXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBvblJlbGVhc2UoIGV2ZW50OiBQcmVzc0xpc3RlbmVyRXZlbnQgfCBudWxsLCBjYWxsYmFjazogKCAoKSA9PiB2b2lkICkgfCBudWxsICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5pc1ByZXNzZWQsICdUaGlzIGxpc3RlbmVyIGlzIG5vdCBwcmVzc2VkJyApO1xyXG4gICAgY29uc3QgcHJlc3NlZExpc3RlbmVyID0gdGhpcyBhcyBQcmVzc2VkUHJlc3NMaXN0ZW5lcjtcclxuXHJcbiAgICBwcmVzc2VkTGlzdGVuZXIucG9pbnRlci5yZW1vdmVJbnB1dExpc3RlbmVyKCB0aGlzLl9wb2ludGVyTGlzdGVuZXIgKTtcclxuICAgIHRoaXMuX2xpc3RlbmluZ1RvUG9pbnRlciA9IGZhbHNlO1xyXG5cclxuICAgIC8vIFNldCB0aGUgcHJlc3NlZCBzdGF0ZSBmYWxzZSAqYmVmb3JlKiBpbnZva2luZyB0aGUgY2FsbGJhY2ssIG90aGVyd2lzZSBhbiBpbmZpbml0ZSBsb29wIGNhbiByZXN1bHQgaW4gc29tZVxyXG4gICAgLy8gY2lyY3Vtc3RhbmNlcy5cclxuICAgIHRoaXMuaXNQcmVzc2VkUHJvcGVydHkudmFsdWUgPSBmYWxzZTtcclxuXHJcbiAgICAvLyBOb3RpZnkgYWZ0ZXIgdGhlIHJlc3Qgb2YgcmVsZWFzZSBpcyBjYWxsZWQgaW4gb3JkZXIgdG8gcHJldmVudCBpdCBmcm9tIHRyaWdnZXJpbmcgaW50ZXJydXB0KCkuXHJcbiAgICB0aGlzLl9yZWxlYXNlTGlzdGVuZXIoIGV2ZW50LCB0aGlzICk7XHJcblxyXG4gICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soKTtcclxuXHJcbiAgICAvLyBUaGVzZSBwcm9wZXJ0aWVzIGFyZSBjbGVhcmVkIG5vdywgYXQgdGhlIGVuZCBvZiB0aGUgb25SZWxlYXNlLCBpbiBjYXNlIHRoZXkgd2VyZSBuZWVkZWQgYnkgdGhlIGNhbGxiYWNrIG9yIGluXHJcbiAgICAvLyBsaXN0ZW5lcnMgb24gdGhlIHByZXNzZWQgUHJvcGVydHkuXHJcbiAgICBwcmVzc2VkTGlzdGVuZXIucG9pbnRlci5jdXJzb3IgPSBudWxsO1xyXG4gICAgdGhpcy5wb2ludGVyID0gbnVsbDtcclxuICAgIHRoaXMucHJlc3NlZFRyYWlsID0gbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCB3aXRoICdkb3duJyBldmVudHMgKHBhcnQgb2YgdGhlIGxpc3RlbmVyIEFQSSkuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogTk9URTogRG8gbm90IGNhbGwgZGlyZWN0bHkuIFNlZSB0aGUgcHJlc3MgbWV0aG9kIGluc3RlYWQuXHJcbiAgICovXHJcbiAgcHVibGljIGRvd24oIGV2ZW50OiBQcmVzc0xpc3RlbmVyRXZlbnQgKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIoIGBQcmVzc0xpc3RlbmVyIyR7dGhpcy5faWR9IGRvd25gICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICB0aGlzLnByZXNzKCBldmVudCApO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgd2l0aCAndXAnIGV2ZW50cyAocGFydCBvZiB0aGUgbGlzdGVuZXIgQVBJKS4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICpcclxuICAgKiBOT1RFOiBEbyBub3QgY2FsbCBkaXJlY3RseS5cclxuICAgKi9cclxuICBwdWJsaWMgdXAoIGV2ZW50OiBQcmVzc0xpc3RlbmVyRXZlbnQgKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIoIGBQcmVzc0xpc3RlbmVyIyR7dGhpcy5faWR9IHVwYCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgLy8gUmVjYWxjdWxhdGUgb3Zlci9ob3ZlcmluZyBQcm9wZXJ0aWVzLlxyXG4gICAgdGhpcy5pbnZhbGlkYXRlT3ZlcigpO1xyXG4gICAgdGhpcy5pbnZhbGlkYXRlSG92ZXJpbmcoKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIHdpdGggJ2VudGVyJyBldmVudHMgKHBhcnQgb2YgdGhlIGxpc3RlbmVyIEFQSSkuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogTk9URTogRG8gbm90IGNhbGwgZGlyZWN0bHkuXHJcbiAgICovXHJcbiAgcHVibGljIGVudGVyKCBldmVudDogUHJlc3NMaXN0ZW5lckV2ZW50ICk6IHZvaWQge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyKCBgUHJlc3NMaXN0ZW5lciMke3RoaXMuX2lkfSBlbnRlcmAgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIHRoaXMub3ZlclBvaW50ZXJzLnB1c2goIGV2ZW50LnBvaW50ZXIgKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIHdpdGggYG1vdmVgIGV2ZW50cyAocGFydCBvZiB0aGUgbGlzdGVuZXIgQVBJKS4gSXQgaXMgbmVjZXNzYXJ5IHRvIGNoZWNrIGZvciBgb3ZlcmAgc3RhdGUgY2hhbmdlcyBvbiBtb3ZlXHJcbiAgICogaW4gY2FzZSBhIHBvaW50ZXIgbGlzdGVuZXIgZ2V0cyBpbnRlcnJ1cHRlZCBhbmQgcmVzdW1lcyBtb3ZlbWVudCBvdmVyIGEgdGFyZ2V0LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgbW92ZSggZXZlbnQ6IFByZXNzTGlzdGVuZXJFdmVudCApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciggYFByZXNzTGlzdGVuZXIjJHt0aGlzLl9pZH0gbW92ZWAgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIHRoaXMuaW52YWxpZGF0ZU92ZXIoKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIHdpdGggJ2V4aXQnIGV2ZW50cyAocGFydCBvZiB0aGUgbGlzdGVuZXIgQVBJKS4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICpcclxuICAgKiBOT1RFOiBEbyBub3QgY2FsbCBkaXJlY3RseS5cclxuICAgKi9cclxuICBwdWJsaWMgZXhpdCggZXZlbnQ6IFByZXNzTGlzdGVuZXJFdmVudCApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciggYFByZXNzTGlzdGVuZXIjJHt0aGlzLl9pZH0gZXhpdGAgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIC8vIE5PVEU6IFdlIGRvbid0IHJlcXVpcmUgdGhlIHBvaW50ZXIgdG8gYmUgaW5jbHVkZWQgaGVyZSwgc2luY2Ugd2UgbWF5IGhhdmUgYWRkZWQgdGhlIGxpc3RlbmVyIGFmdGVyIHRoZSAnZW50ZXInXHJcbiAgICAvLyB3YXMgZmlyZWQuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYXJlYS1tb2RlbC1jb21tb24vaXNzdWVzLzE1OSBmb3IgbW9yZSBkZXRhaWxzLlxyXG4gICAgaWYgKCB0aGlzLm92ZXJQb2ludGVycy5pbmNsdWRlcyggZXZlbnQucG9pbnRlciApICkge1xyXG4gICAgICB0aGlzLm92ZXJQb2ludGVycy5yZW1vdmUoIGV2ZW50LnBvaW50ZXIgKTtcclxuICAgIH1cclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIHdpdGggJ3VwJyBldmVudHMgZnJvbSB0aGUgcG9pbnRlciAocGFydCBvZiB0aGUgbGlzdGVuZXIgQVBJKSAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKlxyXG4gICAqIE5PVEU6IERvIG5vdCBjYWxsIGRpcmVjdGx5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBwb2ludGVyVXAoIGV2ZW50OiBQcmVzc0xpc3RlbmVyRXZlbnQgKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIoIGBQcmVzc0xpc3RlbmVyIyR7dGhpcy5faWR9IHBvaW50ZXIgdXBgICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICAvLyBTaW5jZSBvdXIgY2FsbGJhY2sgY2FuIGdldCBxdWV1ZWQgdXAgYW5kIFRIRU4gaW50ZXJydXB0ZWQgYmVmb3JlIHRoaXMgaGFwcGVucywgd2UnbGwgY2hlY2sgdG8gbWFrZSBzdXJlIHdlIGFyZVxyXG4gICAgLy8gc3RpbGwgcHJlc3NlZCBieSB0aGUgdGltZSB3ZSBnZXQgaGVyZS4gSWYgbm90IHByZXNzZWQsIHRoZW4gdGhlcmUgaXMgbm90aGluZyB0byBkby5cclxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2FwYWNpdG9yLWxhYi1iYXNpY3MvaXNzdWVzLzI1MVxyXG4gICAgaWYgKCB0aGlzLmlzUHJlc3NlZCApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggZXZlbnQucG9pbnRlciA9PT0gdGhpcy5wb2ludGVyICk7XHJcblxyXG4gICAgICB0aGlzLnJlbGVhc2UoIGV2ZW50ICk7XHJcbiAgICB9XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCB3aXRoICdjYW5jZWwnIGV2ZW50cyBmcm9tIHRoZSBwb2ludGVyIChwYXJ0IG9mIHRoZSBsaXN0ZW5lciBBUEkpIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogTk9URTogRG8gbm90IGNhbGwgZGlyZWN0bHkuXHJcbiAgICovXHJcbiAgcHVibGljIHBvaW50ZXJDYW5jZWwoIGV2ZW50OiBQcmVzc0xpc3RlbmVyRXZlbnQgKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIoIGBQcmVzc0xpc3RlbmVyIyR7dGhpcy5faWR9IHBvaW50ZXIgY2FuY2VsYCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgLy8gU2luY2Ugb3VyIGNhbGxiYWNrIGNhbiBnZXQgcXVldWVkIHVwIGFuZCBUSEVOIGludGVycnVwdGVkIGJlZm9yZSB0aGlzIGhhcHBlbnMsIHdlJ2xsIGNoZWNrIHRvIG1ha2Ugc3VyZSB3ZSBhcmVcclxuICAgIC8vIHN0aWxsIHByZXNzZWQgYnkgdGhlIHRpbWUgd2UgZ2V0IGhlcmUuIElmIG5vdCBwcmVzc2VkLCB0aGVuIHRoZXJlIGlzIG5vdGhpbmcgdG8gZG8uXHJcbiAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NhcGFjaXRvci1sYWItYmFzaWNzL2lzc3Vlcy8yNTFcclxuICAgIGlmICggdGhpcy5pc1ByZXNzZWQgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGV2ZW50LnBvaW50ZXIgPT09IHRoaXMucG9pbnRlciApO1xyXG5cclxuICAgICAgdGhpcy5pbnRlcnJ1cHQoKTsgLy8gd2lsbCBtYXJrIGFzIGludGVycnVwdGVkIGFuZCByZWxlYXNlKClcclxuICAgIH1cclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIHdpdGggJ21vdmUnIGV2ZW50cyBmcm9tIHRoZSBwb2ludGVyIChwYXJ0IG9mIHRoZSBsaXN0ZW5lciBBUEkpIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogTk9URTogRG8gbm90IGNhbGwgZGlyZWN0bHkuXHJcbiAgICovXHJcbiAgcHVibGljIHBvaW50ZXJNb3ZlKCBldmVudDogUHJlc3NMaXN0ZW5lckV2ZW50ICk6IHZvaWQge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyKCBgUHJlc3NMaXN0ZW5lciMke3RoaXMuX2lkfSBwb2ludGVyIG1vdmVgICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICAvLyBTaW5jZSBvdXIgY2FsbGJhY2sgY2FuIGdldCBxdWV1ZWQgdXAgYW5kIFRIRU4gaW50ZXJydXB0ZWQgYmVmb3JlIHRoaXMgaGFwcGVucywgd2UnbGwgY2hlY2sgdG8gbWFrZSBzdXJlIHdlIGFyZVxyXG4gICAgLy8gc3RpbGwgcHJlc3NlZCBieSB0aGUgdGltZSB3ZSBnZXQgaGVyZS4gSWYgbm90IHByZXNzZWQsIHRoZW4gdGhlcmUgaXMgbm90aGluZyB0byBkby5cclxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY2FwYWNpdG9yLWxhYi1iYXNpY3MvaXNzdWVzLzI1MVxyXG4gICAgaWYgKCB0aGlzLmlzUHJlc3NlZCApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggZXZlbnQucG9pbnRlciA9PT0gdGhpcy5wb2ludGVyICk7XHJcblxyXG4gICAgICBpZiAoIHRoaXMuX2NvbGxhcHNlRHJhZ0V2ZW50cyApIHtcclxuICAgICAgICB0aGlzLl9wZW5kaW5nQ29sbGFwc2VkRHJhZ0V2ZW50ID0gZXZlbnQ7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdGhpcy5kcmFnKCBldmVudCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCB3aGVuIHRoZSBwb2ludGVyIG5lZWRzIHRvIGludGVycnVwdCBpdHMgY3VycmVudCBsaXN0ZW5lciAodXN1YWxseSBzbyBhbm90aGVyIGNhbiBiZSBhZGRlZCkuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogTk9URTogRG8gbm90IGNhbGwgZGlyZWN0bHkuXHJcbiAgICovXHJcbiAgcHVibGljIHBvaW50ZXJJbnRlcnJ1cHQoKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIoIGBQcmVzc0xpc3RlbmVyIyR7dGhpcy5faWR9IHBvaW50ZXIgaW50ZXJydXB0YCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgdGhpcy5pbnRlcnJ1cHQoKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xpY2sgbGlzdGVuZXIsIGNhbGxlZCB3aGVuIHRoaXMgaXMgdHJlYXRlZCBhcyBhbiBhY2Nlc3NpYmxlIGlucHV0IGxpc3RlbmVyLlxyXG4gICAqIEluIGdlbmVyYWwgbm90IG5lZWRlZCB0byBiZSBwdWJsaWMsIGJ1dCBqdXN0IHVzZWQgaW4gZWRnZSBjYXNlcyB0byBnZXQgcHJvcGVyIGNsaWNrIGxvZ2ljIGZvciBwZG9tLlxyXG4gICAqXHJcbiAgICogSGFuZGxlIHRoZSBjbGljayBldmVudCBmcm9tIERPTSBmb3IgUERPTS4gQ2xpY2tzIGJ5IGNhbGxpbmcgcHJlc3MgYW5kIHJlbGVhc2UgaW1tZWRpYXRlbHkuXHJcbiAgICogV2hlbiBhc3Npc3RpdmUgdGVjaG5vbG9neSBpcyB1c2VkLCB0aGUgYnJvd3NlciBtYXkgbm90IHJlY2VpdmUgJ2tleWRvd24nIG9yICdrZXl1cCcgZXZlbnRzIG9uIGlucHV0IGVsZW1lbnRzLCBidXRcclxuICAgKiBvbmx5IGEgc2luZ2xlICdjbGljaycgZXZlbnQuIFdlIG5lZWQgdG8gdG9nZ2xlIHRoZSBwcmVzc2VkIHN0YXRlIGZyb20gdGhlIHNpbmdsZSAnY2xpY2snIGV2ZW50LlxyXG4gICAqXHJcbiAgICogVGhpcyB3aWxsIGZpcmUgbGlzdGVuZXJzIGltbWVkaWF0ZWx5LCBidXQgYWRkcyBhIGRlbGF5IGZvciB0aGUgcGRvbUNsaWNraW5nUHJvcGVydHkgc28gdGhhdCB5b3UgY2FuIG1ha2UgYVxyXG4gICAqIGJ1dHRvbiBsb29rIHByZXNzZWQgZnJvbSBhIHNpbmdsZSBET00gY2xpY2sgZXZlbnQuIEZvciBleGFtcGxlIHVzYWdlLCBzZWUgc3VuL0J1dHRvbk1vZGVsLmxvb2tzUHJlc3NlZFByb3BlcnR5LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGV2ZW50XHJcbiAgICogQHBhcmFtIFtjYWxsYmFja10gb3B0aW9uYWxseSBjYWxsZWQgaW1tZWRpYXRlbHkgYWZ0ZXIgcHJlc3MsIGJ1dCBvbmx5IG9uIHN1Y2Nlc3NmdWwgY2xpY2tcclxuICAgKiBAcmV0dXJucyBzdWNjZXNzIC0gUmV0dXJucyB3aGV0aGVyIHRoZSBwcmVzcyB3YXMgYWN0dWFsbHkgc3RhcnRlZFxyXG4gICAqL1xyXG4gIHB1YmxpYyBjbGljayggZXZlbnQ6IFNjZW5lcnlFdmVudDxNb3VzZUV2ZW50PiB8IG51bGwsIGNhbGxiYWNrPzogKCkgPT4gdm9pZCApOiBib29sZWFuIHtcclxuICAgIGlmICggdGhpcy5jYW5DbGljaygpICkge1xyXG4gICAgICB0aGlzLmludGVycnVwdGVkID0gZmFsc2U7IC8vIGNsZWFycyB0aGUgZmxhZyAoZG9uJ3Qgc2V0IHRvIGZhbHNlIGJlZm9yZSBoZXJlKVxyXG5cclxuICAgICAgdGhpcy5wZG9tQ2xpY2tpbmdQcm9wZXJ0eS52YWx1ZSA9IHRydWU7XHJcblxyXG4gICAgICAvLyBlbnN1cmUgdGhhdCBidXR0b24gaXMgJ2ZvY3VzZWQnIHNvIGxpc3RlbmVyIGNhbiBiZSBjYWxsZWQgd2hpbGUgYnV0dG9uIGlzIGRvd25cclxuICAgICAgdGhpcy5pc0ZvY3VzZWRQcm9wZXJ0eS52YWx1ZSA9IHRydWU7XHJcbiAgICAgIHRoaXMuaXNQcmVzc2VkUHJvcGVydHkudmFsdWUgPSB0cnVlO1xyXG5cclxuICAgICAgLy8gZmlyZSB0aGUgb3B0aW9uYWwgY2FsbGJhY2tcclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICB0aGlzLl9wcmVzc0xpc3RlbmVyKCBldmVudCwgdGhpcyApO1xyXG5cclxuICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soKTtcclxuXHJcbiAgICAgIC8vIG5vIGxvbmdlciBkb3duLCBkb24ndCByZXNldCAnb3Zlcicgc28gYnV0dG9uIGNhbiBiZSBzdHlsZWQgYXMgbG9uZyBhcyBpdCBoYXMgZm9jdXNcclxuICAgICAgdGhpcy5pc1ByZXNzZWRQcm9wZXJ0eS52YWx1ZSA9IGZhbHNlO1xyXG5cclxuICAgICAgLy8gZmlyZSB0aGUgY2FsbGJhY2sgZnJvbSBvcHRpb25zXHJcbiAgICAgIHRoaXMuX3JlbGVhc2VMaXN0ZW5lciggZXZlbnQsIHRoaXMgKTtcclxuXHJcbiAgICAgIC8vIGlmIHdlIGFyZSBhbHJlYWR5IGNsaWNraW5nLCByZW1vdmUgdGhlIHByZXZpb3VzIHRpbWVvdXQgLSB0aGlzIGFzc3VtZXMgdGhhdCBjbGVhclRpbWVvdXQgaXMgYSBub29wIGlmIHRoZVxyXG4gICAgICAvLyBsaXN0ZW5lciBpcyBubyBsb25nZXIgYXR0YWNoZWRcclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBUT0RPOiBUaGlzIGxvb2tzIGJ1Z2d5LCB3aWxsIG5lZWQgdG8gaWdub3JlIGZvciBub3cgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgc3RlcFRpbWVyLmNsZWFyVGltZW91dCggdGhpcy5fcGRvbUNsaWNraW5nVGltZW91dExpc3RlbmVyICk7XHJcblxyXG4gICAgICAvLyBOb3cgYWRkIHRoZSB0aW1lb3V0IGJhY2sgdG8gc3RhcnQgb3Zlciwgc2F2aW5nIHNvIHRoYXQgaXQgY2FuIGJlIHJlbW92ZWQgbGF0ZXIuIEV2ZW4gd2hlbiB0aGlzIGxpc3RlbmVyIHdhc1xyXG4gICAgICAvLyBpbnRlcnJ1cHRlZCBmcm9tIGFib3ZlIGxvZ2ljLCB3ZSBzdGlsbCBkZWxheSBzZXR0aW5nIHRoaXMgdG8gZmFsc2UgdG8gc3VwcG9ydCB2aXN1YWwgXCJwcmVzc2luZ1wiIHJlZHJhdy5cclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBUT0RPOiBUaGlzIGxvb2tzIGJ1Z2d5LCB3aWxsIG5lZWQgdG8gaWdub3JlIGZvciBub3cgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgdGhpcy5fcGRvbUNsaWNraW5nVGltZW91dExpc3RlbmVyID0gc3RlcFRpbWVyLnNldFRpbWVvdXQoICgpID0+IHtcclxuXHJcbiAgICAgICAgLy8gdGhlIGxpc3RlbmVyIG1heSBoYXZlIGJlZW4gZGlzcG9zZWQgYmVmb3JlIHRoZSBlbmQgb2YgYTExeUxvb2tzUHJlc3NlZEludGVydmFsLCBsaWtlIGlmIGl0IGZpcmVzIGFuZFxyXG4gICAgICAgIC8vIGRpc3Bvc2VzIGl0c2VsZiBpbW1lZGlhdGVseVxyXG4gICAgICAgIGlmICggIXRoaXMucGRvbUNsaWNraW5nUHJvcGVydHkuaXNEaXNwb3NlZCApIHtcclxuICAgICAgICAgIHRoaXMucGRvbUNsaWNraW5nUHJvcGVydHkudmFsdWUgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sIHRoaXMuX2ExMXlMb29rc1ByZXNzZWRJbnRlcnZhbCApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRm9jdXMgbGlzdGVuZXIsIGNhbGxlZCB3aGVuIHRoaXMgaXMgdHJlYXRlZCBhcyBhbiBhY2Nlc3NpYmxlIGlucHV0IGxpc3RlbmVyIGFuZCBpdHMgdGFyZ2V0IGlzIGZvY3VzZWQuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqIEBwZG9tXHJcbiAgICovXHJcbiAgcHVibGljIGZvY3VzKCBldmVudDogU2NlbmVyeUV2ZW50PEZvY3VzRXZlbnQ+ICk6IHZvaWQge1xyXG5cclxuICAgIC8vIEdldCB0aGUgRGlzcGxheSByZWxhdGVkIHRvIHRoaXMgYWNjZXNzaWJsZSBldmVudC5cclxuICAgIGNvbnN0IGFjY2Vzc2libGVEaXNwbGF5cyA9IGV2ZW50LnRyYWlsLnJvb3ROb2RlKCkuZ2V0Um9vdGVkRGlzcGxheXMoKS5maWx0ZXIoIGRpc3BsYXkgPT4gZGlzcGxheS5pc0FjY2Vzc2libGUoKSApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggYWNjZXNzaWJsZURpc3BsYXlzLmxlbmd0aCA9PT0gMSxcclxuICAgICAgJ2Nhbm5vdCBmb2N1cyBub2RlIHdpdGggemVybyBvciBtdWx0aXBsZSBhY2Nlc3NpYmxlIGRpc3BsYXlzIGF0dGFjaGVkJyApO1xyXG4gICAgLy9cclxuICAgIHRoaXMuZGlzcGxheSA9IGFjY2Vzc2libGVEaXNwbGF5c1sgMCBdO1xyXG4gICAgaWYgKCAhdGhpcy5kaXNwbGF5LmZvY3VzTWFuYWdlci5wZG9tRm9jdXNIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5Lmhhc0xpc3RlbmVyKCB0aGlzLmJvdW5kSW52YWxpZGF0ZU92ZXJMaXN0ZW5lciApICkge1xyXG4gICAgICB0aGlzLmRpc3BsYXkuZm9jdXNNYW5hZ2VyLnBkb21Gb2N1c0hpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHkubGluayggdGhpcy5ib3VuZEludmFsaWRhdGVPdmVyTGlzdGVuZXIgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBPbiBmb2N1cywgYnV0dG9uIHNob3VsZCBsb29rICdvdmVyJy5cclxuICAgIHRoaXMuaXNGb2N1c2VkUHJvcGVydHkudmFsdWUgPSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQmx1ciBsaXN0ZW5lciwgY2FsbGVkIHdoZW4gdGhpcyBpcyB0cmVhdGVkIGFzIGFuIGFjY2Vzc2libGUgaW5wdXQgbGlzdGVuZXIuXHJcbiAgICogQHBkb21cclxuICAgKi9cclxuICBwdWJsaWMgYmx1cigpOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy5kaXNwbGF5ICkge1xyXG4gICAgICBpZiAoIHRoaXMuZGlzcGxheS5mb2N1c01hbmFnZXIucGRvbUZvY3VzSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eS5oYXNMaXN0ZW5lciggdGhpcy5ib3VuZEludmFsaWRhdGVPdmVyTGlzdGVuZXIgKSApIHtcclxuICAgICAgICB0aGlzLmRpc3BsYXkuZm9jdXNNYW5hZ2VyLnBkb21Gb2N1c0hpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHkudW5saW5rKCB0aGlzLmJvdW5kSW52YWxpZGF0ZU92ZXJMaXN0ZW5lciApO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuZGlzcGxheSA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT24gYmx1ciwgdGhlIGJ1dHRvbiBzaG91bGQgbm8gbG9uZ2VyIGxvb2sgJ292ZXInLlxyXG4gICAgdGhpcy5pc0ZvY3VzZWRQcm9wZXJ0eS52YWx1ZSA9IGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGlzcG9zZXMgdGhlIGxpc3RlbmVyLCByZWxlYXNpbmcgcmVmZXJlbmNlcy4gSXQgc2hvdWxkIG5vdCBiZSB1c2VkIGFmdGVyIHRoaXMuXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIoIGBQcmVzc0xpc3RlbmVyIyR7dGhpcy5faWR9IGRpc3Bvc2VgICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICAvLyBXZSBuZWVkIHRvIHJlbGVhc2UgcmVmZXJlbmNlcyB0byBhbnkgcG9pbnRlcnMgdGhhdCBhcmUgb3ZlciB1cy5cclxuICAgIHRoaXMub3ZlclBvaW50ZXJzLmNsZWFyKCk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9saXN0ZW5pbmdUb1BvaW50ZXIgJiYgaXNQcmVzc2VkTGlzdGVuZXIoIHRoaXMgKSApIHtcclxuICAgICAgdGhpcy5wb2ludGVyLnJlbW92ZUlucHV0TGlzdGVuZXIoIHRoaXMuX3BvaW50ZXJMaXN0ZW5lciApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFRoZXNlIFByb3BlcnRpZXMgY291bGQgaGF2ZSBhbHJlYWR5IGJlZW4gZGlzcG9zZWQsIGZvciBleGFtcGxlIGluIHRoZSBzdW4gYnV0dG9uIGhpZXJhcmNoeSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zdW4vaXNzdWVzLzM3MlxyXG4gICAgaWYgKCAhdGhpcy5pc1ByZXNzZWRQcm9wZXJ0eS5pc0Rpc3Bvc2VkICkge1xyXG4gICAgICB0aGlzLmlzUHJlc3NlZFByb3BlcnR5LnVubGluayggdGhpcy5faXNIaWdobGlnaHRlZExpc3RlbmVyICk7XHJcbiAgICAgIHRoaXMuaXNQcmVzc2VkUHJvcGVydHkudW5saW5rKCB0aGlzLl9pc0hvdmVyaW5nTGlzdGVuZXIgKTtcclxuICAgIH1cclxuICAgICF0aGlzLmlzSG92ZXJpbmdQcm9wZXJ0eS5pc0Rpc3Bvc2VkICYmIHRoaXMuaXNIb3ZlcmluZ1Byb3BlcnR5LnVubGluayggdGhpcy5faXNIaWdobGlnaHRlZExpc3RlbmVyICk7XHJcblxyXG4gICAgdGhpcy5fcHJlc3NBY3Rpb24uZGlzcG9zZSgpO1xyXG4gICAgdGhpcy5fcmVsZWFzZUFjdGlvbi5kaXNwb3NlKCk7XHJcblxyXG4gICAgdGhpcy5sb29rc1ByZXNzZWRQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICB0aGlzLnBkb21DbGlja2luZ1Byb3BlcnR5LmRpc3Bvc2UoKTtcclxuICAgIHRoaXMuY3Vyc29yUHJvcGVydHkuZGlzcG9zZSgpO1xyXG4gICAgdGhpcy5pc0ZvY3VzZWRQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICB0aGlzLmlzSGlnaGxpZ2h0ZWRQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICB0aGlzLmlzSG92ZXJpbmdQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICB0aGlzLmxvb2tzT3ZlclByb3BlcnR5LmRpc3Bvc2UoKTtcclxuICAgIHRoaXMuaXNPdmVyUHJvcGVydHkuZGlzcG9zZSgpO1xyXG4gICAgdGhpcy5pc1ByZXNzZWRQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICB0aGlzLm92ZXJQb2ludGVycy5kaXNwb3NlKCk7XHJcblxyXG4gICAgLy8gUmVtb3ZlIHJlZmVyZW5jZXMgdG8gdGhlIHN0b3JlZCBkaXNwbGF5LCBpZiB3ZSBoYXZlIGFueS5cclxuICAgIGlmICggdGhpcy5kaXNwbGF5ICkge1xyXG4gICAgICB0aGlzLmRpc3BsYXkuZm9jdXNNYW5hZ2VyLnBkb21Gb2N1c0hpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHkudW5saW5rKCB0aGlzLmJvdW5kSW52YWxpZGF0ZU92ZXJMaXN0ZW5lciApO1xyXG4gICAgICB0aGlzLmRpc3BsYXkgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyBwaGV0aW9BUEkgPSB7XHJcbiAgICBwcmVzc0FjdGlvbjogeyBwaGV0aW9UeXBlOiBQaGV0aW9BY3Rpb24uUGhldGlvQWN0aW9uSU8oIFsgU2NlbmVyeUV2ZW50LlNjZW5lcnlFdmVudElPIF0gKSB9LFxyXG4gICAgcmVsZWFzZUFjdGlvbjogeyBwaGV0aW9UeXBlOiBQaGV0aW9BY3Rpb24uUGhldGlvQWN0aW9uSU8oIFsgTnVsbGFibGVJTyggU2NlbmVyeUV2ZW50LlNjZW5lcnlFdmVudElPICkgXSApIH1cclxuICB9O1xyXG59XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnUHJlc3NMaXN0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