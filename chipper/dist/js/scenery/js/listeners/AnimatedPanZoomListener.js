// Copyright 2019-2023, University of Colorado Boulder

/**
 * A PanZoomListener that supports additional forms of input for pan and zoom, including trackpad gestures, mouse
 * wheel, and keyboard input. These gestures will animate the target node to its destination translation and scale so it
 * uses a step function that must be called every animation frame.
 *
 * @author Jesse Greenberg
 */

import Bounds2 from '../../../dot/js/Bounds2.js';
import Matrix3 from '../../../dot/js/Matrix3.js';
import Utils from '../../../dot/js/Utils.js';
import Vector2 from '../../../dot/js/Vector2.js';
import platform from '../../../phet-core/js/platform.js';
import EventType from '../../../tandem/js/EventType.js';
import isSettingPhetioStateProperty from '../../../tandem/js/isSettingPhetioStateProperty.js';
import PhetioAction from '../../../tandem/js/PhetioAction.js';
import { EventIO, FocusManager, globalKeyStateTracker, Intent, KeyboardDragListener, KeyboardUtils, KeyboardZoomUtils, Mouse, PanZoomListener, PDOMPointer, PDOMUtils, PressListener, scenery, TransformTracker } from '../imports.js';
import optionize from '../../../phet-core/js/optionize.js';
import Tandem from '../../../tandem/js/Tandem.js';
import BooleanProperty from '../../../axon/js/BooleanProperty.js';
// constants
const MOVE_CURSOR = 'all-scroll';
const MAX_SCROLL_VELOCITY = 150; // max global view coords per second while scrolling with middle mouse button drag

// The max speed of translation when animating from source position to destination position in the coordinate frame
// of the parent of the targetNode of this listener. Increase the value of this to animate faster to the destination
// position when panning to targets.
const MAX_TRANSLATION_SPEED = 1000;

// scratch variables to reduce garbage
const scratchTranslationVector = new Vector2(0, 0);
const scratchScaleTargetVector = new Vector2(0, 0);
const scratchVelocityVector = new Vector2(0, 0);
const scratchBounds = new Bounds2(0, 0, 0, 0);

// Type for a GestureEvent - experimental and Safari specific Event, not available in default typing so it is manually
// defined here. See https://developer.mozilla.org/en-US/docs/Web/API/GestureEvent

class AnimatedPanZoomListener extends PanZoomListener {
  // This point is the center of the transformedPanBounds (see PanZoomListener) in
  // the parent coordinate frame of the targetNode. This is the current center of the transformedPanBounds, and
  // during animation we will move this point closer to the destinationPosition.

  // The destination for translation, we will reposition the targetNode until the
  // sourcePosition matches this point. This is in the parent coordinate frame of the targetNode.

  // The current scale of the targetNode. During animation we will scale the targetNode until this matches the destinationScale.

  // The desired scale for the targetNode, the node is repositioned until sourceScale matches destinationScale.

  // The point at which a scale gesture was initiated. This is usually the mouse point in
  // the global coordinate frame when a wheel or trackpad zoom gesture is initiated. The targetNode will appear to
  // be zoomed into this point. This is in the global coordinate frame.

  // Scale changes in discrete amounts for certain types of input, and in these cases this array defines the discrete
  // scales possible

  // If defined, indicates that a middle mouse button is down to pan in the direction of cursor movement.

  // These bounds define behavior of panning during interaction with another listener that declares its intent for
  // dragging. If the pointer is out of these bounds and its intent is for dragging, we will try to reposition so
  // that the dragged object remains visible

  // The panBounds in the local coordinate frame of the targetNode. Generally, these are the bounds of the targetNode
  // that you can see within the panBounds.

  // whether or not the Pointer went down within the drag bounds - if it went down out of drag bounds
  // then user likely trying to pull an object back into view so we prevent panning during drag

  // A collection of listeners Pointers with attached listeners that are down. Used
  // primarily to determine if the attached listener defines any unique behavior that should happen during a drag,
  // such as panning to keep custom Bounds in view. See TInputListener.createPanTargetBounds.

  // Certain calculations can only be done once available pan bounds are finite.

  // Action wrapping work to be done when a gesture starts on a macOS trackpad (specific to that platform!). Wrapped
  // in an action so that state is captured for PhET-iO

  // scale represented at the start of the gesture, as reported by the GestureEvent, used to calculate how much
  // to scale the target Node
  trackpadGestureStartScale = 1;

  // True when the listener is actively panning or zooming to the destination position and scale. Updated in the
  // animation frame.
  animatingProperty = new BooleanProperty(false);

  // A TransformTracker that will watch for changes to the targetNode's global transformation matrix, used to keep
  // the targetNode in view during animation.
  _transformTracker = null;

  // A listener on the focusPanTargetBoundsProperty of the focused Node that will keep those bounds displayed in
  // the viewport.
  _focusBoundsListener = null;
  /**
   * targetNode - Node to be transformed by this listener
   * {Object} [providedOptions]
   */
  constructor(targetNode, providedOptions) {
    const options = optionize()({
      tandem: Tandem.REQUIRED
    }, providedOptions);
    super(targetNode, options);
    this.sourcePosition = null;
    this.destinationPosition = null;
    this.sourceScale = this.getCurrentScale();
    this.destinationScale = this.getCurrentScale();
    this.scaleGestureTargetPosition = null;
    this.discreteScales = calculateDiscreteScales(this._minScale, this._maxScale);
    this.middlePress = null;
    this._dragBounds = null;
    this._transformedPanBounds = this._panBounds.transformed(this._targetNode.matrix.inverted());
    this._draggingInDragBounds = false;
    this._attachedPointers = [];
    this.boundsFinite = false;

    // listeners that will be bound to `this` if we are on a (non-touchscreen) safari platform, referenced for
    // removal on dispose
    let boundGestureStartListener = null;
    let boundGestureChangeListener = null;
    this.gestureStartAction = new PhetioAction(domEvent => {
      assert && assert(domEvent.pageX, 'pageX required on DOMEvent');
      assert && assert(domEvent.pageY, 'pageY required on DOMEvent');
      assert && assert(domEvent.scale, 'scale required on DOMEvent');

      // prevent Safari from doing anything native with this gesture
      domEvent.preventDefault();
      this.trackpadGestureStartScale = domEvent.scale;
      this.scaleGestureTargetPosition = new Vector2(domEvent.pageX, domEvent.pageY);
    }, {
      phetioPlayback: true,
      tandem: options.tandem.createTandem('gestureStartAction'),
      parameters: [{
        name: 'event',
        phetioType: EventIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Action that executes whenever a gesture starts on a trackpad in macOS Safari.'
    });
    this.gestureChangeAction = new PhetioAction(domEvent => {
      assert && assert(domEvent.scale, 'scale required on DOMEvent');

      // prevent Safari from changing position or scale natively
      domEvent.preventDefault();
      const newScale = this.sourceScale + domEvent.scale - this.trackpadGestureStartScale;
      this.setDestinationScale(newScale);
    }, {
      phetioPlayback: true,
      tandem: options.tandem.createTandem('gestureChangeAction'),
      parameters: [{
        name: 'event',
        phetioType: EventIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Action that executes whenever a gesture changes on a trackpad in macOS Safari.'
    });

    // respond to macOS trackpad input, but don't respond to this input on an iOS touch screen
    if (platform.safari && !platform.mobileSafari) {
      boundGestureStartListener = this.handleGestureStartEvent.bind(this);
      boundGestureChangeListener = this.handleGestureChangeEvent.bind(this);

      // the scale of the targetNode at the start of the gesture, used to calculate how scale to apply from
      // 'gesturechange' event
      this.trackpadGestureStartScale = this.getCurrentScale();

      // WARNING: These events are non-standard, but this is the only way to detect and prevent native trackpad
      // input on macOS Safari. For Apple documentation about these events, see
      // https://developer.apple.com/documentation/webkitjs/gestureevent

      // @ts-expect-error - Event type for this Safari specific event isn't available yet
      window.addEventListener('gesturestart', boundGestureStartListener);

      // @ts-expect-error - Event type for this Safari specific event isn't available yet
      window.addEventListener('gesturechange', boundGestureChangeListener);
    }

    // Handle key input from events outside of the PDOM - in this case it is impossible for the PDOMPointer
    // to be attached so we have free reign over the keyboard
    globalKeyStateTracker.keydownEmitter.addListener(this.windowKeydown.bind(this));

    // Make sure that the focused Node stays in view and automatically pan to keep it displayed when it is animated
    // with a transformation change
    const displayFocusListener = this.handleFocusChange.bind(this);
    FocusManager.pdomFocusProperty.link(displayFocusListener);

    // set source and destination positions and scales after setting from state
    // to initialize values for animation with AnimatedPanZoomListener
    this.sourceFramePanBoundsProperty.lazyLink(() => {
      if (isSettingPhetioStateProperty.value) {
        this.initializePositions();
        this.sourceScale = this.getCurrentScale();
        this.setDestinationScale(this.sourceScale);
      }
    }, {
      // guarantee that the matrixProperty value is up to date when this listener is called
      phetioDependencies: [this.matrixProperty]
    });
    this.disposeAnimatedPanZoomListener = () => {
      // @ts-expect-error - Event type for this Safari specific event isn't available yet
      boundGestureStartListener && window.removeEventListener('gesturestart', boundGestureStartListener);

      // @ts-expect-error - Event type for this Safari specific event isn't available yet
      boundGestureChangeListener && window.removeEventListener('gestureChange', boundGestureChangeListener);
      this.animatingProperty.dispose();
      if (this._transformTracker) {
        this._transformTracker.dispose();
      }
      FocusManager.pdomFocusProperty.unlink(displayFocusListener);
    };
  }

  /**
   * Step the listener, supporting any animation as the target node is transformed to target position and scale.
   */
  step(dt) {
    if (this.middlePress) {
      this.handleMiddlePress(dt);
    }

    // if dragging an item with a mouse or touch pointer, make sure that it ramains visible in the zoomed in view,
    // panning to it when it approaches edge of the screen
    if (this._attachedPointers.length > 0) {
      // only need to do this work if we are zoomed in
      if (this.getCurrentScale() > 1) {
        if (this._attachedPointers.length > 0) {
          // Filter out any pointers that no longer have an attached listener due to interruption from things like opening
          // the context menu with a right click.
          this._attachedPointers = this._attachedPointers.filter(pointer => pointer.attachedListener);
          assert && assert(this._attachedPointers.length <= 10, 'Not clearing attachedPointers, there is probably a memory leak');
        }

        // Only reposition if one of the attached pointers is down and dragging within the drag bounds area, or if one
        // of the attached pointers is a PDOMPointer, which indicates that we are dragging with alternative input
        // (in which case draggingInDragBounds does not apply)
        if (this._draggingInDragBounds || this._attachedPointers.some(pointer => pointer instanceof PDOMPointer)) {
          this.repositionDuringDrag();
        }
      }
    }
    this.animateToTargets(dt);
  }

  /**
   * Attach a MiddlePress for drag panning, if detected.
   */
  down(event) {
    super.down(event);

    // If the Pointer signifies the input is intended for dragging save a reference to the trail so we can support
    // keeping the event target in view during the drag operation.
    if (this._dragBounds !== null && event.pointer.hasIntent(Intent.DRAG)) {
      // if this is our only down pointer, see if we should start panning during drag
      if (this._attachedPointers.length === 0) {
        this._draggingInDragBounds = this._dragBounds.containsPoint(event.pointer.point);
      }

      // All conditions are met to start watching for bounds to keep in view during a drag interaction. Eagerly
      // save the attachedListener here so that we don't have to do any work in the move event.
      if (event.pointer.attachedListener) {
        if (!this._attachedPointers.includes(event.pointer)) {
          this._attachedPointers.push(event.pointer);
        }
      }
    }

    // begin middle press panning if we aren't already in that state
    if (event.pointer.type === 'mouse' && event.pointer instanceof Mouse && event.pointer.middleDown && !this.middlePress) {
      this.middlePress = new MiddlePress(event.pointer, event.trail);
      event.pointer.cursor = MOVE_CURSOR;
    } else {
      this.cancelMiddlePress();
    }
  }

  /**
   * If in a state where we are panning from a middle mouse press, exit that state.
   */
  cancelMiddlePress() {
    if (this.middlePress) {
      this.middlePress.pointer.cursor = null;
      this.middlePress = null;
      this.stopInProgressAnimation();
    }
  }

  /**
   * Listener for the attached pointer on move. Only move if a middle press is not currently down.
   */
  movePress(press) {
    if (!this.middlePress) {
      super.movePress(press);
    }
  }

  /**
   * Part of the Scenery listener API. Supports repositioning while dragging a more descendant level
   * Node under this listener. If the node and pointer are out of the dragBounds, we reposition to keep the Node
   * visible within dragBounds.
   *
   * (scenery-internal)
   */
  move(event) {
    // No need to do this work if we are zoomed out.
    if (this._attachedPointers.length > 0 && this.getCurrentScale() > 1) {
      // Only try to get the attached listener if we didn't successfully get it on the down event. This should only
      // happen if the drag did not start withing dragBounds (the listener is likely pulling the Node into view) or
      // if a listener has not been attached yet. Once a listener is attached we can start using it to look for the
      // bounds to keep in view.
      if (this._draggingInDragBounds) {
        if (!this._attachedPointers.includes(event.pointer)) {
          const hasDragIntent = this.hasDragIntent(event.pointer);
          const currentTargetExists = event.currentTarget !== null;
          if (currentTargetExists && hasDragIntent) {
            if (event.pointer.attachedListener) {
              this._attachedPointers.push(event.pointer);
            }
          }
        }
      } else {
        if (this._dragBounds) {
          this._draggingInDragBounds = this._dragBounds.containsPoint(event.pointer.point);
        }
      }
    }
  }

  /**
   * This function returns the targetNode if there are attached pointers and an attachedPressListener during a drag event,
   * otherwise the function returns null.
   */
  getTargetNodeDuringDrag() {
    if (this._attachedPointers.length > 0) {
      // We have an attachedListener from a SceneryEvent Pointer, see if it has information we can use to
      // get the target Bounds for the drag event.

      // Only use the first one so that unique dragging behaviors don't "fight" if multiple pointers are down.
      const activeListener = this._attachedPointers[0].attachedListener;
      assert && assert(activeListener, 'The attached Pointer is expected to have an attached listener.');
      if (activeListener.listener instanceof PressListener || activeListener.listener instanceof KeyboardDragListener) {
        const attachedPressListener = activeListener.listener;

        // The PressListener might not be pressed anymore but the Pointer is still down, in which case it
        // has been interrupted or cancelled.
        // NOTE: It is possible I need to cancelPanDuringDrag() if it is no longer pressed, but I don't
        // want to clear the reference to the attachedListener, and I want to support resuming drag during touch-snag.
        if (attachedPressListener.isPressed) {
          // this will either be the PressListener's targetNode or the default target of the SceneryEvent on press
          return attachedPressListener.getCurrentTarget();
        }
      }
    }
    return null;
  }

  /**
   * Gets the Bounds2 in the global coordinate frame that we are going to try to keep in view during a drag
   * operation.
   */
  getGlobalBoundsToViewDuringDrag() {
    let globalBoundsToView = null;
    if (this._attachedPointers.length > 0) {
      // We have an attachedListener from a SceneryEvent Pointer, see if it has information we can use to
      // get the target Bounds for the drag event.

      // Only use the first one so that unique dragging behaviors don't "fight" if multiple pointers are down.
      const activeListener = this._attachedPointers[0].attachedListener;
      assert && assert(activeListener, 'The attached Pointer is expected to have an attached listener.');
      if (activeListener.createPanTargetBounds) {
        // client has defined the Bounds they want to keep in view for this Pointer (it is assigned to the
        // Pointer to support multitouch cases)
        globalBoundsToView = activeListener.createPanTargetBounds();
      } else if (activeListener.listener instanceof PressListener || activeListener.listener instanceof KeyboardDragListener) {
        const attachedPressListener = activeListener.listener;

        // The PressListener might not be pressed anymore but the Pointer is still down, in which case it
        // has been interrupted or cancelled.
        // NOTE: It is possible I need to cancelPanDuringDrag() if it is no longer pressed, but I don't
        // want to clear the reference to the attachedListener, and I want to support resuming drag during touch-snag.
        if (attachedPressListener.isPressed) {
          // this will either be the PressListener's targetNode or the default target of the SceneryEvent on press
          const target = attachedPressListener.getCurrentTarget();

          // TODO: For now we cannot support DAG. We may be able to use PressListener.pressedTrail instead of https://github.com/phetsims/scenery/issues/1581
          // getCurrentTarget, and then we would have a uniquely defined trail. See
          // https://github.com/phetsims/scenery/issues/1361 and
          // https://github.com/phetsims/scenery/issues/1356#issuecomment-1039678678
          if (target.instances.length === 1) {
            const trail = target.instances[0].trail;
            assert && assert(trail, 'The target should be in one scene graph and have an instance with a trail.');
            globalBoundsToView = trail.parentToGlobalBounds(target.visibleBounds);
          }
        }
      }
    }
    return globalBoundsToView;
  }

  /**
   * During a drag of another Node that is a descendant of this listener's targetNode, reposition if the
   * node is out of dragBounds so that the Node is always within panBounds.
   */
  repositionDuringDrag() {
    const globalBounds = this.getGlobalBoundsToViewDuringDrag();
    const targetNode = this.getTargetNodeDuringDrag();
    globalBounds && this.keepBoundsInView(globalBounds, this._attachedPointers.some(pointer => pointer instanceof PDOMPointer), targetNode?.limitPanDirection);
  }

  /**
   * Stop panning during drag by clearing variables that are set to indicate and provide information for this work.
   * @param [event] - if not provided all are panning is cancelled and we assume interruption
   */
  cancelPanningDuringDrag(event) {
    if (event) {
      // remove the attachedPointer associated with the event
      const index = this._attachedPointers.indexOf(event.pointer);
      if (index > -1) {
        this._attachedPointers.splice(index, 1);
      }
    } else {
      // There is no SceneryEvent, we must be interrupting - clear all attachedPointers
      this._attachedPointers = [];
    }

    // Clear flag indicating we are "dragging in bounds" next move
    this._draggingInDragBounds = false;
  }

  /**
   * Scenery listener API. Cancel any drag and pan behavior for the Pointer on the event.
   *
   * (scenery-internal)
   */
  up(event) {
    this.cancelPanningDuringDrag(event);
  }

  /**
   * Input listener for the 'wheel' event, part of the Scenery Input API.
   * (scenery-internal)
   */
  wheel(event) {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener wheel');
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();

    // cannot reposition if a dragging with middle mouse button - but wheel zoom should not cancel a middle press
    // (behavior copied from other browsers)
    if (!this.middlePress) {
      const wheel = new Wheel(event, this._targetScale);
      this.repositionFromWheel(wheel, event);
    }
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Keydown listener for events outside of the PDOM. Attached as a listener to the body and driven by
   * Events rather than SceneryEvents. When we handle Events from within the PDOM we need the Pointer to
   * determine if attached. But from outside of the PDOM we know that there is no focus in the document and therfore
   * the PDOMPointer is not attached.
   */
  windowKeydown(domEvent) {
    // on any keyboard reposition interrupt the middle press panning
    this.cancelMiddlePress();
    const simGlobal = _.get(window, 'phet.joist.sim', null); // returns null if global isn't found

    if (!simGlobal || !simGlobal.display._accessible || !simGlobal.display.pdomRootElement.contains(domEvent.target)) {
      this.handleZoomCommands(domEvent);

      // handle translation without worry of the pointer being attached because there is no pointer at this level
      if (KeyboardUtils.isArrowKey(domEvent)) {
        const keyPress = new KeyPress(globalKeyStateTracker, this.getCurrentScale(), this._targetScale);
        this.repositionFromKeys(keyPress);
      }
    }
  }

  /**
   * For the Scenery listener API, handle a keydown event. This SceneryEvent will have been dispatched from
   * Input.dispatchEvent and so the Event target must be within the PDOM. In this case, we may
   * need to prevent translation if the PDOMPointer is attached.
   *
   * (scenery-internal)
   */
  keydown(event) {
    const domEvent = event.domEvent;
    assert && assert(domEvent instanceof KeyboardEvent, 'keydown event must be a KeyboardEvent'); // eslint-disable-line no-simple-type-checking-assertions

    // on any keyboard reposition interrupt the middle press panning
    this.cancelMiddlePress();

    // handle zoom
    this.handleZoomCommands(domEvent);
    const keyboardDragIntent = event.pointer.hasIntent(Intent.KEYBOARD_DRAG);

    // handle translation
    if (KeyboardUtils.isArrowKey(domEvent)) {
      if (!keyboardDragIntent) {
        sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener handle arrow key down');
        sceneryLog && sceneryLog.InputListener && sceneryLog.push();
        const keyPress = new KeyPress(globalKeyStateTracker, this.getCurrentScale(), this._targetScale);
        this.repositionFromKeys(keyPress);
        sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
      }
    }
  }

  /**
   * Handle a change of focus by immediately panning so that the focused Node is in view. Also sets up the
   * TransformTracker which will automatically keep the target in the viewport as it is animates, and a listener
   * on the focusPanTargetBoundsProperty (if provided) to handle Node other size or custom changes.
   */
  handleFocusChange(focus, previousFocus) {
    // Remove listeners on the previous focus watching transform and bounds changes
    if (this._transformTracker) {
      this._transformTracker.dispose();
      this._transformTracker = null;
    }
    if (previousFocus && previousFocus.trail.lastNode() && previousFocus.trail.lastNode().focusPanTargetBoundsProperty) {
      const previousBoundsProperty = previousFocus.trail.lastNode().focusPanTargetBoundsProperty;
      assert && assert(this._focusBoundsListener && previousBoundsProperty.hasListener(this._focusBoundsListener), 'Focus bounds listener should be linked to the previous Node');
      previousBoundsProperty.unlink(this._focusBoundsListener);
      this._focusBoundsListener = null;
    }
    if (focus) {
      const lastNode = focus.trail.lastNode();
      let trailToTrack = focus.trail;
      if (focus.trail.containsNode(this._targetNode)) {
        // Track transforms to the focused Node, but exclude the targetNode so that repositions during pan don't
        // trigger another transform update.
        const indexOfTarget = focus.trail.nodes.indexOf(this._targetNode);
        const indexOfLeaf = focus.trail.nodes.length; // end of slice is not included
        trailToTrack = focus.trail.slice(indexOfTarget, indexOfLeaf);
      }
      this._transformTracker = new TransformTracker(trailToTrack);
      const focusMovementListener = () => {
        if (this.getCurrentScale() > 1) {
          let globalBounds;
          if (lastNode.focusPanTargetBoundsProperty) {
            // This Node has a custom bounds area that we need to keep in view
            const localBounds = lastNode.focusPanTargetBoundsProperty.value;
            globalBounds = focus.trail.localToGlobalBounds(localBounds);
          } else {
            // by default, use the global bounds of the Node - note this is the full Trail to the focused Node,
            // not the subtrail used by TransformTracker
            globalBounds = focus.trail.localToGlobalBounds(focus.trail.lastNode().localBounds);
          }
          this.keepBoundsInView(globalBounds, true, lastNode.limitPanDirection);
        }
      };

      // observe changes to the transform
      this._transformTracker.addListener(focusMovementListener);

      // observe changes on the client-provided local bounds
      if (lastNode.focusPanTargetBoundsProperty) {
        this._focusBoundsListener = focusMovementListener;
        lastNode.focusPanTargetBoundsProperty.link(this._focusBoundsListener);
      }

      // Pan to the focus trail right away if it is off-screen
      this.keepTrailInView(focus.trail, lastNode.limitPanDirection);
    }
  }

  /**
   * Handle zoom commands from a keyboard.
   */
  handleZoomCommands(domEvent) {
    // handle zoom - Safari doesn't receive the keyup event when the meta key is pressed so we cannot use
    // the keyStateTracker to determine if zoom keys are down
    const zoomInCommandDown = KeyboardZoomUtils.isZoomCommand(domEvent, true);
    const zoomOutCommandDown = KeyboardZoomUtils.isZoomCommand(domEvent, false);
    if (zoomInCommandDown || zoomOutCommandDown) {
      sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiPanZoomListener keyboard zoom in');
      sceneryLog && sceneryLog.InputListener && sceneryLog.push();

      // don't allow native browser zoom
      domEvent.preventDefault();
      const nextScale = this.getNextDiscreteScale(zoomInCommandDown);
      const keyPress = new KeyPress(globalKeyStateTracker, nextScale, this._targetScale);
      this.repositionFromKeys(keyPress);
    } else if (KeyboardZoomUtils.isZoomResetCommand(domEvent)) {
      sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener keyboard reset');
      sceneryLog && sceneryLog.InputListener && sceneryLog.push();

      // this is a native command, but we are taking over
      domEvent.preventDefault();
      this.resetTransform();
      sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
    }
  }

  /**
   * This is just for macOS Safari. Responds to trackpad input. Prevents default browser behavior and sets values
   * required for repositioning as user operates the track pad.
   */
  handleGestureStartEvent(domEvent) {
    this.gestureStartAction.execute(domEvent);
  }

  /**
   * This is just for macOS Safari. Responds to trackpad input. Prevends default browser behavior and
   * sets destination scale as user pinches on the trackpad.
   */
  handleGestureChangeEvent(domEvent) {
    this.gestureChangeAction.execute(domEvent);
  }

  /**
   * Handle the down MiddlePress during animation. If we have a middle press we need to update position target.
   */
  handleMiddlePress(dt) {
    const middlePress = this.middlePress;
    assert && assert(middlePress, 'MiddlePress must be defined to handle');
    const sourcePosition = this.sourcePosition;
    assert && assert(sourcePosition, 'sourcePosition must be defined to handle middle press, be sure to call initializePositions');
    if (dt > 0) {
      const currentPoint = middlePress.pointer.point;
      const globalDelta = currentPoint.minus(middlePress.initialPoint);

      // magnitude alone is too fast, reduce by a bit
      const reducedMagnitude = globalDelta.magnitude / 100;
      if (reducedMagnitude > 0) {
        // set the delta vector in global coordinates, limited by a maximum view coords/second velocity, corrected
        // for any representative target scale
        globalDelta.setMagnitude(Math.min(reducedMagnitude / dt, MAX_SCROLL_VELOCITY * this._targetScale));
        this.setDestinationPosition(sourcePosition.plus(globalDelta));
      }
    }
  }

  /**
   * Translate and scale to a target point. The result of this function should make it appear that we are scaling
   * in or out of a particular point on the target node. This actually modifies the matrix of the target node. To
   * accomplish zooming into a particular point, we compute a matrix that would transform the target node from
   * the target point, then apply scale, then translate the target back to the target point.
   *
   * @param globalPoint - point to zoom in on, in the global coordinate frame
   * @param scaleDelta
   */
  translateScaleToTarget(globalPoint, scaleDelta) {
    const pointInLocalFrame = this._targetNode.globalToLocalPoint(globalPoint);
    const pointInParentFrame = this._targetNode.globalToParentPoint(globalPoint);
    const fromLocalPoint = Matrix3.translation(-pointInLocalFrame.x, -pointInLocalFrame.y);
    const toTargetPoint = Matrix3.translation(pointInParentFrame.x, pointInParentFrame.y);
    const nextScale = this.limitScale(this.getCurrentScale() + scaleDelta);

    // we first translate from target point, then apply scale, then translate back to target point ()
    // so that it appears as though we are zooming into that point
    const scaleMatrix = toTargetPoint.timesMatrix(Matrix3.scaling(nextScale)).timesMatrix(fromLocalPoint);
    this.matrixProperty.set(scaleMatrix);

    // make sure that we are still within PanZoomListener constraints
    this.correctReposition();
  }

  /**
   * Sets the translation and scale to a target point. Like translateScaleToTarget, but instead of taking a scaleDelta
   * it takes the final scale to be used for the target Nodes matrix.
   *
   * @param globalPoint - point to translate to in the global coordinate frame
   * @param scale - final scale for the transformation matrix
   */
  setTranslationScaleToTarget(globalPoint, scale) {
    const pointInLocalFrame = this._targetNode.globalToLocalPoint(globalPoint);
    const pointInParentFrame = this._targetNode.globalToParentPoint(globalPoint);
    const fromLocalPoint = Matrix3.translation(-pointInLocalFrame.x, -pointInLocalFrame.y);
    const toTargetPoint = Matrix3.translation(pointInParentFrame.x, pointInParentFrame.y);
    const nextScale = this.limitScale(scale);

    // we first translate from target point, then apply scale, then translate back to target point ()
    // so that it appears as though we are zooming into that point
    const scaleMatrix = toTargetPoint.timesMatrix(Matrix3.scaling(nextScale)).timesMatrix(fromLocalPoint);
    this.matrixProperty.set(scaleMatrix);

    // make sure that we are still within PanZoomListener constraints
    this.correctReposition();
  }

  /**
   * Translate the target node in a direction specified by deltaVector.
   */
  translateDelta(deltaVector) {
    const targetPoint = this._targetNode.globalToParentPoint(this._panBounds.center);
    const sourcePoint = targetPoint.plus(deltaVector);
    this.translateToTarget(sourcePoint, targetPoint);
  }

  /**
   * Translate the targetNode from a local point to a target point. Both points should be in the global coordinate
   * frame.
   * @param initialPoint - in global coordinate frame, source position
   * @param targetPoint - in global coordinate frame, target position
   */
  translateToTarget(initialPoint, targetPoint) {
    const singleInitialPoint = this._targetNode.globalToParentPoint(initialPoint);
    const singleTargetPoint = this._targetNode.globalToParentPoint(targetPoint);
    const delta = singleTargetPoint.minus(singleInitialPoint);
    this.matrixProperty.set(Matrix3.translationFromVector(delta).timesMatrix(this._targetNode.getMatrix()));
    this.correctReposition();
  }

  /**
   * Repositions the target node in response to keyboard input.
   */
  repositionFromKeys(keyPress) {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener reposition from key press');
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();
    const sourcePosition = this.sourcePosition;
    assert && assert(sourcePosition, 'sourcePosition must be defined to handle key press, be sure to call initializePositions');
    const newScale = keyPress.scale;
    const currentScale = this.getCurrentScale();
    if (newScale !== currentScale) {
      // key press changed scale
      this.setDestinationScale(newScale);
      this.scaleGestureTargetPosition = keyPress.computeScaleTargetFromKeyPress();
    } else if (!keyPress.translationVector.equals(Vector2.ZERO)) {
      // key press initiated some translation
      this.setDestinationPosition(sourcePosition.plus(keyPress.translationVector));
    }
    this.correctReposition();
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Repositions the target node in response to wheel input. Wheel input can come from a mouse, trackpad, or
   * other. Aspects of the event are slightly different for each input source and this function tries to normalize
   * these differences.
   */
  repositionFromWheel(wheel, event) {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener reposition from wheel');
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();
    const domEvent = event.domEvent;
    assert && assert(domEvent instanceof WheelEvent, 'wheel event must be a WheelEvent'); // eslint-disable-line no-simple-type-checking-assertions

    const sourcePosition = this.sourcePosition;
    assert && assert(sourcePosition, 'sourcePosition must be defined to handle wheel, be sure to call initializePositions');

    // prevent any native browser zoom and don't allow browser to go 'back' or 'forward' a page with certain gestures
    domEvent.preventDefault();
    if (wheel.isCtrlKeyDown) {
      const nextScale = this.limitScale(this.getCurrentScale() + wheel.scaleDelta);
      this.scaleGestureTargetPosition = wheel.targetPoint;
      this.setDestinationScale(nextScale);
    } else {
      // wheel does not indicate zoom, must be translation
      this.setDestinationPosition(sourcePosition.plus(wheel.translationVector));
    }
    this.correctReposition();
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Upon any kind of reposition, update the source position and scale for the next update in animateToTargets.
   *
   * Note: This assumes that any kind of repositioning of the target node will eventually call correctReposition.
   */
  correctReposition() {
    super.correctReposition();
    if (this._panBounds.isFinite()) {
      // the pan bounds in the local coordinate frame of the target Node (generally, bounds of the targetNode
      // that are visible in the global panBounds)
      this._transformedPanBounds = this._panBounds.transformed(this._targetNode.matrix.inverted());
      this.sourcePosition = this._transformedPanBounds.center;
      this.sourceScale = this.getCurrentScale();
    }
  }

  /**
   * When a new press begins, stop any in progress animation.
   */
  addPress(press) {
    super.addPress(press);
    this.stopInProgressAnimation();
  }

  /**
   * When presses are removed, reset animation destinations.
   */
  removePress(press) {
    super.removePress(press);

    // restore the cursor if we have a middle press as we are in a state where moving the mouse will pan
    if (this.middlePress) {
      press.pointer.cursor = MOVE_CURSOR;
    }
    if (this._presses.length === 0) {
      this.stopInProgressAnimation();
    }
  }

  /**
   * Interrupt the listener. Cancels any active input and clears references upon interaction end.
   */
  interrupt() {
    this.cancelPanningDuringDrag();
    this.cancelMiddlePress();
    super.interrupt();
  }

  /**
   * "Cancel" the listener, when input stops abnormally. Part of the scenery Input API.
   */
  cancel() {
    this.interrupt();
  }

  /**
   * Returns true if the Intent of the Pointer indicates that it will be used for dragging of some kind.
   */
  hasDragIntent(pointer) {
    return pointer.hasIntent(Intent.KEYBOARD_DRAG) || pointer.hasIntent(Intent.DRAG);
  }

  /**
   * Pan to a provided Node, attempting to place the node in the center of the transformedPanBounds. It may not end
   * up exactly in the center since we have to make sure panBounds are completely filled with targetNode content.
   *
   * You can conditionally not pan to the center by setting panToCenter to false. Sometimes shifting the screen so
   * that the Node is at the center is too jarring.
   *
   * @param node - Node to pan to
   * @param panToCenter - If true, listener will pan so that the Node is at the center of the screen. Otherwise, just
   *                      until the Node is fully displayed in the viewport.
   * @param panDirection - if provided, we will only pan in the direction specified, null for all directions
   */
  panToNode(node, panToCenter, panDirection) {
    assert && assert(this._panBounds.isFinite(), 'panBounds should be defined when panning.');
    this.keepBoundsInView(node.globalBounds, panToCenter, panDirection);
  }

  /**
   * Set the destination position to pan such that the provided globalBounds are totally visible within the panBounds.
   * This will never pan outside panBounds, if the provided globalBounds extend beyond them.
   *
   * If we are not using panToCenter and the globalBounds is larger than the screen size this function does nothing.
   * It doesn't make sense to try to keep the provided bounds entirely in view if they are larger than the availalable
   * view space.
   *
   * @param globalBounds - in global coordinate frame
   * @param panToCenter - if true, we will pan to the center of the provided bounds, otherwise we will pan
   *                                until all edges are on screen
   * @param panDirection - if provided, we will only pan in the direction specified, null for all directions
   */
  keepBoundsInView(globalBounds, panToCenter, panDirection) {
    assert && assert(this._panBounds.isFinite(), 'panBounds should be defined when panning.');
    const sourcePosition = this.sourcePosition;
    assert && assert(sourcePosition, 'sourcePosition must be defined to handle keepBoundsInView, be sure to call initializePositions');
    const boundsInTargetFrame = this._targetNode.globalToLocalBounds(globalBounds);
    const translationDelta = new Vector2(0, 0);
    let distanceToLeftEdge = 0;
    let distanceToRightEdge = 0;
    let distanceToTopEdge = 0;
    let distanceToBottomEdge = 0;
    if (panToCenter) {
      // If panning to center, the amount to pan is the distance between the center of the screen to the center of the
      // provided bounds. In this case
      distanceToLeftEdge = this._transformedPanBounds.centerX - boundsInTargetFrame.centerX;
      distanceToRightEdge = this._transformedPanBounds.centerX - boundsInTargetFrame.centerX;
      distanceToTopEdge = this._transformedPanBounds.centerY - boundsInTargetFrame.centerY;
      distanceToBottomEdge = this._transformedPanBounds.centerY - boundsInTargetFrame.centerY;
    } else if ((panDirection === 'vertical' || boundsInTargetFrame.width < this._transformedPanBounds.width) && (panDirection === 'horizontal' || boundsInTargetFrame.height < this._transformedPanBounds.height)) {
      // If the provided bounds are wider than the available pan bounds we shouldn't try to shift it, it will awkwardly
      // try to slide the screen to one of the sides of the bounds. This operation only makes sense if the screen can
      // totally contain the object being dragged.

      // A bit of padding helps to pan the screen further so that you can keep dragging even if the cursor/object
      // is right at the edge of the screen. It also looks a little nicer by keeping the object well in view.
      // Increase this value to add more motion when dragging near the edge of the screen. But too much of this
      // will make the screen feel like it is "sliding" around too much.
      // See https://github.com/phetsims/number-line-operations/issues/108
      const paddingDelta = 150; // global coordinate frame, scaled below

      // scale the padding delta by our matrix so that it is appropriate for our zoom level - smaller when zoomed way in
      const matrixScale = this.getCurrentScale();
      const paddingDeltaScaled = paddingDelta / matrixScale;
      distanceToLeftEdge = this._transformedPanBounds.left - boundsInTargetFrame.left + paddingDeltaScaled;
      distanceToRightEdge = this._transformedPanBounds.right - boundsInTargetFrame.right - paddingDeltaScaled;
      distanceToTopEdge = this._transformedPanBounds.top - boundsInTargetFrame.top + paddingDeltaScaled;
      distanceToBottomEdge = this._transformedPanBounds.bottom - boundsInTargetFrame.bottom - paddingDeltaScaled;
    }
    if (panDirection !== 'vertical') {
      // if not panning vertically, we are free to move in the horizontal dimension
      if (distanceToRightEdge < 0) {
        translationDelta.x = -distanceToRightEdge;
      }
      if (distanceToLeftEdge > 0) {
        translationDelta.x = -distanceToLeftEdge;
      }
    }
    if (panDirection !== 'horizontal') {
      // if not panning horizontally, we are free to move in the vertical direction
      if (distanceToBottomEdge < 0) {
        translationDelta.y = -distanceToBottomEdge;
      }
      if (distanceToTopEdge > 0) {
        translationDelta.y = -distanceToTopEdge;
      }
    }
    this.setDestinationPosition(sourcePosition.plus(translationDelta));
  }

  /**
   * Keep a trail in view by panning to it if it has bounds that are outside of the global panBounds.
   */
  keepTrailInView(trail, panDirection) {
    if (this._panBounds.isFinite() && trail.lastNode().bounds.isFinite()) {
      const globalBounds = trail.localToGlobalBounds(trail.lastNode().localBounds);
      if (!this._panBounds.containsBounds(globalBounds)) {
        this.keepBoundsInView(globalBounds, true, panDirection);
      }
    }
  }

  /**
   * @param dt - in seconds
   */
  animateToTargets(dt) {
    assert && assert(this.boundsFinite, 'initializePositions must be called at least once before animating');
    const sourcePosition = this.sourcePosition;
    assert && assert(sourcePosition, 'sourcePosition must be defined to animate, be sure to all initializePositions');
    assert && assert(sourcePosition.isFinite(), 'How can the source position not be a finite Vector2?');
    const destinationPosition = this.destinationPosition;
    assert && assert(destinationPosition, 'destinationPosition must be defined to animate, be sure to all initializePositions');
    assert && assert(destinationPosition.isFinite(), 'How can the destination position not be a finite Vector2?');

    // only animate to targets if within this precision so that we don't animate forever, since animation speed
    // is dependent on the difference betwen source and destination positions
    const positionDirty = !destinationPosition.equalsEpsilon(sourcePosition, 0.1);
    const scaleDirty = !Utils.equalsEpsilon(this.sourceScale, this.destinationScale, 0.001);
    this.animatingProperty.value = positionDirty || scaleDirty;

    // Only a MiddlePress can support animation while down
    if (this._presses.length === 0 || this.middlePress !== null) {
      if (positionDirty) {
        // animate to the position, effectively panning over time without any scaling
        const translationDifference = destinationPosition.minus(sourcePosition);
        let translationDirection = translationDifference;
        if (translationDifference.magnitude !== 0) {
          translationDirection = translationDifference.normalized();
        }
        const translationSpeed = this.getTranslationSpeed(translationDifference.magnitude);
        scratchVelocityVector.setXY(translationSpeed, translationSpeed);

        // finally determine the final panning translation and apply
        const componentMagnitude = scratchVelocityVector.multiplyScalar(dt);
        const translationDelta = translationDirection.componentTimes(componentMagnitude);

        // in case of large dt, don't overshoot the destination
        if (translationDelta.magnitude > translationDifference.magnitude) {
          translationDelta.set(translationDifference);
        }
        assert && assert(translationDelta.isFinite(), 'Trying to translate with a non-finite Vector2');
        this.translateDelta(translationDelta);
      }
      if (scaleDirty) {
        assert && assert(this.scaleGestureTargetPosition, 'there must be a scale target point');
        const scaleDifference = this.destinationScale - this.sourceScale;
        let scaleDelta = scaleDifference * dt * 6;

        // in case of large dt make sure that we don't overshoot our destination
        if (Math.abs(scaleDelta) > Math.abs(scaleDifference)) {
          scaleDelta = scaleDifference;
        }
        this.translateScaleToTarget(this.scaleGestureTargetPosition, scaleDelta);

        // after applying the scale, the source position has changed, update destination to match
        this.setDestinationPosition(sourcePosition);
      } else if (this.destinationScale !== this.sourceScale) {
        assert && assert(this.scaleGestureTargetPosition, 'there must be a scale target point');

        // not far enough to animate but close enough that we can set destination equal to source to avoid further
        // animation steps
        this.setTranslationScaleToTarget(this.scaleGestureTargetPosition, this.destinationScale);
        this.setDestinationPosition(sourcePosition);
      }
    }
  }

  /**
   * Stop any in-progress transformations of the target node by setting destinations to sources immediately.
   */
  stopInProgressAnimation() {
    if (this.boundsFinite && this.sourcePosition) {
      this.setDestinationScale(this.sourceScale);
      this.setDestinationPosition(this.sourcePosition);
    }
  }

  /**
   * Sets the source and destination positions. Necessary because target or pan bounds may not be defined
   * upon construction. This can set those up when they are defined.
   */
  initializePositions() {
    this.boundsFinite = this._transformedPanBounds.isFinite();
    if (this.boundsFinite) {
      this.sourcePosition = this._transformedPanBounds.center;
      this.setDestinationPosition(this.sourcePosition);
    } else {
      this.sourcePosition = null;
      this.destinationPosition = null;
    }
  }

  /**
   * Set the containing panBounds and then make sure that the targetBounds fully fill the new panBounds. Updates
   * bounds that trigger panning during a drag operation.
   */
  setPanBounds(bounds) {
    super.setPanBounds(bounds);
    this.initializePositions();

    // drag bounds eroded a bit so that repositioning during drag occurs as the pointer gets close to the edge.
    this._dragBounds = bounds.erodedXY(bounds.width * 0.1, bounds.height * 0.1);
    assert && assert(this._dragBounds.hasNonzeroArea(), 'drag bounds must have some width and height');
  }

  /**
   * Upon setting target bounds, re-set source and destination positions.
   */
  setTargetBounds(targetBounds) {
    super.setTargetBounds(targetBounds);
    this.initializePositions();
  }

  /**
   * Set the destination position. In animation, we will try move the targetNode until sourcePosition matches
   * this point. Destination is in the local coordinate frame of the target node.
   */
  setDestinationPosition(destination) {
    assert && assert(this.boundsFinite, 'bounds must be finite before setting destination positions');
    assert && assert(destination.isFinite(), 'provided destination position is not defined');
    const sourcePosition = this.sourcePosition;
    assert && assert(sourcePosition, 'sourcePosition must be defined to set destination position, be sure to call initializePositions');

    // limit destination position to be within the available bounds pan bounds
    scratchBounds.setMinMax(sourcePosition.x - this._transformedPanBounds.left - this._panBounds.left, sourcePosition.y - this._transformedPanBounds.top - this._panBounds.top, sourcePosition.x + this._panBounds.right - this._transformedPanBounds.right, sourcePosition.y + this._panBounds.bottom - this._transformedPanBounds.bottom);
    this.destinationPosition = scratchBounds.closestPointTo(destination);
  }

  /**
   * Set the destination scale for the target node. In animation, target node will be repositioned until source
   * scale matches destination scale.
   */
  setDestinationScale(scale) {
    this.destinationScale = this.limitScale(scale);
  }

  /**
   * Calculate the translation speed to animate from our sourcePosition to our targetPosition. Speed goes to zero
   * as the translationDistance gets smaller for smooth animation as we reach our destination position. This returns
   * a speed in the coordinate frame of the parent of this listener's target Node.
   */
  getTranslationSpeed(translationDistance) {
    assert && assert(translationDistance >= 0, 'distance for getTranslationSpeed should be a non-negative number');

    // The larger the scale, that faster we want to translate because the distances between source and destination
    // are smaller when zoomed in. Otherwise, speeds will be slower while zoomed in.
    const scaleDistance = translationDistance * this.getCurrentScale();

    // A maximum translation factor applied to distance to determine a reasonable speed, determined by
    // inspection but could be modified. This impacts how long the "tail" of translation is as we animate.
    // While we animate to the destination position we move quickly far away from the destination and slow down
    // as we get closer to the target. Reduce this value to exaggerate that effect and move more slowly as we
    // get closer to the destination position.
    const maxScaleFactor = 5;

    // speed falls away exponentially as we get closer to our destination so that we appear to "slide" to our
    // destination which looks nice, but also prevents us from animating for too long
    const translationSpeed = scaleDistance * (1 / (Math.pow(scaleDistance, 2) - Math.pow(maxScaleFactor, 2)) + maxScaleFactor);

    // translationSpeed could be negative or go to infinity due to the behavior of the exponential calculation above.
    // Make sure that the speed is constrained and greater than zero.
    const limitedTranslationSpeed = Math.min(Math.abs(translationSpeed), MAX_TRANSLATION_SPEED * this.getCurrentScale());
    return limitedTranslationSpeed;
  }

  /**
   * Reset all transformations on the target node, and reset destination targets to source values to prevent any
   * in progress animation.
   */
  resetTransform() {
    super.resetTransform();
    this.stopInProgressAnimation();
  }

  /**
   * Get the next discrete scale from the current scale. Will be one of the scales along the discreteScales list
   * and limited by the min and max scales assigned to this MultiPanZoomListener.
   *
   * @param zoomIn - direction of zoom change, positive if zooming in
   * @returns number
   */
  getNextDiscreteScale(zoomIn) {
    const currentScale = this.getCurrentScale();
    let nearestIndex = null;
    let distanceToCurrentScale = Number.POSITIVE_INFINITY;
    for (let i = 0; i < this.discreteScales.length; i++) {
      const distance = Math.abs(this.discreteScales[i] - currentScale);
      if (distance < distanceToCurrentScale) {
        distanceToCurrentScale = distance;
        nearestIndex = i;
      }
    }
    nearestIndex = nearestIndex;
    assert && assert(nearestIndex !== null, 'nearestIndex should have been found');
    let nextIndex = zoomIn ? nearestIndex + 1 : nearestIndex - 1;
    nextIndex = Utils.clamp(nextIndex, 0, this.discreteScales.length - 1);
    return this.discreteScales[nextIndex];
  }
  dispose() {
    this.disposeAnimatedPanZoomListener();
  }
}
/**
 * A type that contains the information needed to respond to keyboard input.
 */
class KeyPress {
  // The translation delta vector that should be applied to the target node in response to the key presses

  // The scale that should be applied to the target node in response to the key press

  /**
   * @param keyStateTracker
   * @param scale
   * @param targetScale - scale describing the targetNode, see PanZoomListener._targetScale
   * @param [providedOptions]
   */
  constructor(keyStateTracker, scale, targetScale, providedOptions) {
    const options = optionize()({
      translationMagnitude: 80
    }, providedOptions);

    // determine resulting translation
    let xDirection = 0;
    xDirection += keyStateTracker.isKeyDown(KeyboardUtils.KEY_RIGHT_ARROW) ? 1 : 0;
    xDirection -= keyStateTracker.isKeyDown(KeyboardUtils.KEY_LEFT_ARROW) ? 1 : 0;
    let yDirection = 0;
    yDirection += keyStateTracker.isKeyDown(KeyboardUtils.KEY_DOWN_ARROW) ? 1 : 0;
    yDirection -= keyStateTracker.isKeyDown(KeyboardUtils.KEY_UP_ARROW) ? 1 : 0;

    // don't set magnitude if zero vector (as vector will become ill-defined)
    scratchTranslationVector.setXY(xDirection, yDirection);
    if (!scratchTranslationVector.equals(Vector2.ZERO)) {
      const translationMagnitude = options.translationMagnitude * targetScale;
      scratchTranslationVector.setMagnitude(translationMagnitude);
    }
    this.translationVector = scratchTranslationVector;
    this.scale = scale;
  }

  /**
   * Compute the target position for scaling from a key press. The target node will appear to get larger and zoom
   * into this point. If focus is within the Display, we zoom into the focused node. If not and focusable content
   * exists in the display, we zoom into the first focusable component. Otherwise, we zoom into the top left corner
   * of the screen.
   *
   * This function could be expensive, so we only call it if we know that the key press is a "scale" gesture.
   *
   * @returns a scratch Vector2 instance with the target position
   */
  computeScaleTargetFromKeyPress() {
    // default cause, scale target will be origin of the screen
    scratchScaleTargetVector.setXY(0, 0);

    // zoom into the focused Node if it has defined bounds, it may not if it is for controlling the
    // virtual cursor and has an invisible focus highlight
    const focus = FocusManager.pdomFocusProperty.value;
    if (focus) {
      const focusTrail = focus.trail;
      const focusedNode = focusTrail.lastNode();
      if (focusedNode.bounds.isFinite()) {
        scratchScaleTargetVector.set(focusTrail.parentToGlobalPoint(focusedNode.center));
      }
    } else {
      // no focusable element in the Display so try to zoom into the first focusable element
      const firstFocusable = PDOMUtils.getNextFocusable();
      if (firstFocusable !== document.body) {
        // if not the body, focused node should be contained by the body - error loudly if the browser reports
        // that this is not the case
        assert && assert(document.body.contains(firstFocusable), 'focusable should be attached to the body');

        // assumes that focusable DOM elements are correctly positioned, which should be the case - an alternative
        // could be to use Displat.getTrailFromPDOMIndicesString(), but that function requires information that is not
        // available here.
        const centerX = firstFocusable.offsetLeft + firstFocusable.offsetWidth / 2;
        const centerY = firstFocusable.offsetTop + firstFocusable.offsetHeight / 2;
        scratchScaleTargetVector.setXY(centerX, centerY);
      }
    }
    assert && assert(scratchScaleTargetVector.isFinite(), 'target position not defined');
    return scratchScaleTargetVector;
  }
}

/**
 * A type that contains the information needed to respond to a wheel input.
 */
class Wheel {
  // is the ctrl key down during this wheel input? Cannot use KeyStateTracker because the
  // ctrl key might be 'down' on this event without going through the keyboard. For example, with a trackpad
  // the browser sets ctrlKey true with the zoom gesture.

  // magnitude and direction of scale change from the wheel input

  // the target of the wheel input in the global coordinate frame

  // the translation vector for the target node in response to the wheel input

  /**
   * @param event
   * @param targetScale - scale describing the targetNode, see PanZoomListener._targetScale
   */
  constructor(event, targetScale) {
    const domEvent = event.domEvent;
    assert && assert(domEvent instanceof WheelEvent, 'SceneryEvent should have a DOMEvent from the wheel input'); // eslint-disable-line no-simple-type-checking-assertions

    this.isCtrlKeyDown = domEvent.ctrlKey;
    this.scaleDelta = domEvent.deltaY > 0 ? -0.5 : 0.5;
    this.targetPoint = event.pointer.point;

    // the DOM Event specifies deltas that look appropriate and works well in different cases like
    // mouse wheel and trackpad input, both which trigger wheel events but at different rates with different
    // delta values - but they are generally too large, reducing a bit feels more natural and gives more control
    let translationX = domEvent.deltaX * 0.5;
    let translationY = domEvent.deltaY * 0.5;

    // FireFox defaults to scrolling in units of "lines" rather than pixels, resulting in slow movement - speed up
    // translation in this case
    if (domEvent.deltaMode === window.WheelEvent.DOM_DELTA_LINE) {
      translationX = translationX * 25;
      translationY = translationY * 25;
    }
    this.translationVector = scratchTranslationVector.setXY(translationX * targetScale, translationY * targetScale);
  }
}

/**
 * A press from a middle mouse button. Will initiate panning and destination position will be updated for as long
 * as the Pointer point is dragged away from the initial point.
 */
class MiddlePress {
  // point of press in the global coordinate frame

  constructor(pointer, trail) {
    assert && assert(pointer.type === 'mouse', 'incorrect pointer type');
    this.pointer = pointer;
    this.trail = trail;
    this.initialPoint = pointer.point.copy();
  }
}

/**
 * Helper function, calculates discrete scales between min and max scale limits. Creates increasing step sizes
 * so that you zoom in from high zoom reaches the max faster with fewer key presses. This is standard behavior for
 * browser zoom.
 */
const calculateDiscreteScales = (minScale, maxScale) => {
  assert && assert(minScale >= 1, 'min scales less than one are currently not supported');

  // will take this many key presses to reach maximum scale from minimum scale
  const steps = 8;

  // break the range from min to max scale into steps, then exponentiate
  const discreteScales = [];
  for (let i = 0; i < steps; i++) {
    discreteScales[i] = (maxScale - minScale) / steps * (i * i);
  }

  // normalize steps back into range of the min and max scale for this listener
  const discreteScalesMax = discreteScales[steps - 1];
  for (let i = 0; i < discreteScales.length; i++) {
    discreteScales[i] = minScale + discreteScales[i] * (maxScale - minScale) / discreteScalesMax;
  }
  return discreteScales;
};
scenery.register('AnimatedPanZoomListener', AnimatedPanZoomListener);
export default AnimatedPanZoomListener;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb3VuZHMyIiwiTWF0cml4MyIsIlV0aWxzIiwiVmVjdG9yMiIsInBsYXRmb3JtIiwiRXZlbnRUeXBlIiwiaXNTZXR0aW5nUGhldGlvU3RhdGVQcm9wZXJ0eSIsIlBoZXRpb0FjdGlvbiIsIkV2ZW50SU8iLCJGb2N1c01hbmFnZXIiLCJnbG9iYWxLZXlTdGF0ZVRyYWNrZXIiLCJJbnRlbnQiLCJLZXlib2FyZERyYWdMaXN0ZW5lciIsIktleWJvYXJkVXRpbHMiLCJLZXlib2FyZFpvb21VdGlscyIsIk1vdXNlIiwiUGFuWm9vbUxpc3RlbmVyIiwiUERPTVBvaW50ZXIiLCJQRE9NVXRpbHMiLCJQcmVzc0xpc3RlbmVyIiwic2NlbmVyeSIsIlRyYW5zZm9ybVRyYWNrZXIiLCJvcHRpb25pemUiLCJUYW5kZW0iLCJCb29sZWFuUHJvcGVydHkiLCJNT1ZFX0NVUlNPUiIsIk1BWF9TQ1JPTExfVkVMT0NJVFkiLCJNQVhfVFJBTlNMQVRJT05fU1BFRUQiLCJzY3JhdGNoVHJhbnNsYXRpb25WZWN0b3IiLCJzY3JhdGNoU2NhbGVUYXJnZXRWZWN0b3IiLCJzY3JhdGNoVmVsb2NpdHlWZWN0b3IiLCJzY3JhdGNoQm91bmRzIiwiQW5pbWF0ZWRQYW5ab29tTGlzdGVuZXIiLCJ0cmFja3BhZEdlc3R1cmVTdGFydFNjYWxlIiwiYW5pbWF0aW5nUHJvcGVydHkiLCJfdHJhbnNmb3JtVHJhY2tlciIsIl9mb2N1c0JvdW5kc0xpc3RlbmVyIiwiY29uc3RydWN0b3IiLCJ0YXJnZXROb2RlIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsInRhbmRlbSIsIlJFUVVJUkVEIiwic291cmNlUG9zaXRpb24iLCJkZXN0aW5hdGlvblBvc2l0aW9uIiwic291cmNlU2NhbGUiLCJnZXRDdXJyZW50U2NhbGUiLCJkZXN0aW5hdGlvblNjYWxlIiwic2NhbGVHZXN0dXJlVGFyZ2V0UG9zaXRpb24iLCJkaXNjcmV0ZVNjYWxlcyIsImNhbGN1bGF0ZURpc2NyZXRlU2NhbGVzIiwiX21pblNjYWxlIiwiX21heFNjYWxlIiwibWlkZGxlUHJlc3MiLCJfZHJhZ0JvdW5kcyIsIl90cmFuc2Zvcm1lZFBhbkJvdW5kcyIsIl9wYW5Cb3VuZHMiLCJ0cmFuc2Zvcm1lZCIsIl90YXJnZXROb2RlIiwibWF0cml4IiwiaW52ZXJ0ZWQiLCJfZHJhZ2dpbmdJbkRyYWdCb3VuZHMiLCJfYXR0YWNoZWRQb2ludGVycyIsImJvdW5kc0Zpbml0ZSIsImJvdW5kR2VzdHVyZVN0YXJ0TGlzdGVuZXIiLCJib3VuZEdlc3R1cmVDaGFuZ2VMaXN0ZW5lciIsImdlc3R1cmVTdGFydEFjdGlvbiIsImRvbUV2ZW50IiwiYXNzZXJ0IiwicGFnZVgiLCJwYWdlWSIsInNjYWxlIiwicHJldmVudERlZmF1bHQiLCJwaGV0aW9QbGF5YmFjayIsImNyZWF0ZVRhbmRlbSIsInBhcmFtZXRlcnMiLCJuYW1lIiwicGhldGlvVHlwZSIsInBoZXRpb0V2ZW50VHlwZSIsIlVTRVIiLCJwaGV0aW9Eb2N1bWVudGF0aW9uIiwiZ2VzdHVyZUNoYW5nZUFjdGlvbiIsIm5ld1NjYWxlIiwic2V0RGVzdGluYXRpb25TY2FsZSIsInNhZmFyaSIsIm1vYmlsZVNhZmFyaSIsImhhbmRsZUdlc3R1cmVTdGFydEV2ZW50IiwiYmluZCIsImhhbmRsZUdlc3R1cmVDaGFuZ2VFdmVudCIsIndpbmRvdyIsImFkZEV2ZW50TGlzdGVuZXIiLCJrZXlkb3duRW1pdHRlciIsImFkZExpc3RlbmVyIiwid2luZG93S2V5ZG93biIsImRpc3BsYXlGb2N1c0xpc3RlbmVyIiwiaGFuZGxlRm9jdXNDaGFuZ2UiLCJwZG9tRm9jdXNQcm9wZXJ0eSIsImxpbmsiLCJzb3VyY2VGcmFtZVBhbkJvdW5kc1Byb3BlcnR5IiwibGF6eUxpbmsiLCJ2YWx1ZSIsImluaXRpYWxpemVQb3NpdGlvbnMiLCJwaGV0aW9EZXBlbmRlbmNpZXMiLCJtYXRyaXhQcm9wZXJ0eSIsImRpc3Bvc2VBbmltYXRlZFBhblpvb21MaXN0ZW5lciIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJkaXNwb3NlIiwidW5saW5rIiwic3RlcCIsImR0IiwiaGFuZGxlTWlkZGxlUHJlc3MiLCJsZW5ndGgiLCJmaWx0ZXIiLCJwb2ludGVyIiwiYXR0YWNoZWRMaXN0ZW5lciIsInNvbWUiLCJyZXBvc2l0aW9uRHVyaW5nRHJhZyIsImFuaW1hdGVUb1RhcmdldHMiLCJkb3duIiwiZXZlbnQiLCJoYXNJbnRlbnQiLCJEUkFHIiwiY29udGFpbnNQb2ludCIsInBvaW50IiwiaW5jbHVkZXMiLCJwdXNoIiwidHlwZSIsIm1pZGRsZURvd24iLCJNaWRkbGVQcmVzcyIsInRyYWlsIiwiY3Vyc29yIiwiY2FuY2VsTWlkZGxlUHJlc3MiLCJzdG9wSW5Qcm9ncmVzc0FuaW1hdGlvbiIsIm1vdmVQcmVzcyIsInByZXNzIiwibW92ZSIsImhhc0RyYWdJbnRlbnQiLCJjdXJyZW50VGFyZ2V0RXhpc3RzIiwiY3VycmVudFRhcmdldCIsImdldFRhcmdldE5vZGVEdXJpbmdEcmFnIiwiYWN0aXZlTGlzdGVuZXIiLCJsaXN0ZW5lciIsImF0dGFjaGVkUHJlc3NMaXN0ZW5lciIsImlzUHJlc3NlZCIsImdldEN1cnJlbnRUYXJnZXQiLCJnZXRHbG9iYWxCb3VuZHNUb1ZpZXdEdXJpbmdEcmFnIiwiZ2xvYmFsQm91bmRzVG9WaWV3IiwiY3JlYXRlUGFuVGFyZ2V0Qm91bmRzIiwidGFyZ2V0IiwiaW5zdGFuY2VzIiwicGFyZW50VG9HbG9iYWxCb3VuZHMiLCJ2aXNpYmxlQm91bmRzIiwiZ2xvYmFsQm91bmRzIiwia2VlcEJvdW5kc0luVmlldyIsImxpbWl0UGFuRGlyZWN0aW9uIiwiY2FuY2VsUGFubmluZ0R1cmluZ0RyYWciLCJpbmRleCIsImluZGV4T2YiLCJzcGxpY2UiLCJ1cCIsIndoZWVsIiwic2NlbmVyeUxvZyIsIklucHV0TGlzdGVuZXIiLCJXaGVlbCIsIl90YXJnZXRTY2FsZSIsInJlcG9zaXRpb25Gcm9tV2hlZWwiLCJwb3AiLCJzaW1HbG9iYWwiLCJfIiwiZ2V0IiwiZGlzcGxheSIsIl9hY2Nlc3NpYmxlIiwicGRvbVJvb3RFbGVtZW50IiwiY29udGFpbnMiLCJoYW5kbGVab29tQ29tbWFuZHMiLCJpc0Fycm93S2V5Iiwia2V5UHJlc3MiLCJLZXlQcmVzcyIsInJlcG9zaXRpb25Gcm9tS2V5cyIsImtleWRvd24iLCJLZXlib2FyZEV2ZW50Iiwia2V5Ym9hcmREcmFnSW50ZW50IiwiS0VZQk9BUkRfRFJBRyIsImZvY3VzIiwicHJldmlvdXNGb2N1cyIsImxhc3ROb2RlIiwiZm9jdXNQYW5UYXJnZXRCb3VuZHNQcm9wZXJ0eSIsInByZXZpb3VzQm91bmRzUHJvcGVydHkiLCJoYXNMaXN0ZW5lciIsInRyYWlsVG9UcmFjayIsImNvbnRhaW5zTm9kZSIsImluZGV4T2ZUYXJnZXQiLCJub2RlcyIsImluZGV4T2ZMZWFmIiwic2xpY2UiLCJmb2N1c01vdmVtZW50TGlzdGVuZXIiLCJsb2NhbEJvdW5kcyIsImxvY2FsVG9HbG9iYWxCb3VuZHMiLCJrZWVwVHJhaWxJblZpZXciLCJ6b29tSW5Db21tYW5kRG93biIsImlzWm9vbUNvbW1hbmQiLCJ6b29tT3V0Q29tbWFuZERvd24iLCJuZXh0U2NhbGUiLCJnZXROZXh0RGlzY3JldGVTY2FsZSIsImlzWm9vbVJlc2V0Q29tbWFuZCIsInJlc2V0VHJhbnNmb3JtIiwiZXhlY3V0ZSIsImN1cnJlbnRQb2ludCIsImdsb2JhbERlbHRhIiwibWludXMiLCJpbml0aWFsUG9pbnQiLCJyZWR1Y2VkTWFnbml0dWRlIiwibWFnbml0dWRlIiwic2V0TWFnbml0dWRlIiwiTWF0aCIsIm1pbiIsInNldERlc3RpbmF0aW9uUG9zaXRpb24iLCJwbHVzIiwidHJhbnNsYXRlU2NhbGVUb1RhcmdldCIsImdsb2JhbFBvaW50Iiwic2NhbGVEZWx0YSIsInBvaW50SW5Mb2NhbEZyYW1lIiwiZ2xvYmFsVG9Mb2NhbFBvaW50IiwicG9pbnRJblBhcmVudEZyYW1lIiwiZ2xvYmFsVG9QYXJlbnRQb2ludCIsImZyb21Mb2NhbFBvaW50IiwidHJhbnNsYXRpb24iLCJ4IiwieSIsInRvVGFyZ2V0UG9pbnQiLCJsaW1pdFNjYWxlIiwic2NhbGVNYXRyaXgiLCJ0aW1lc01hdHJpeCIsInNjYWxpbmciLCJzZXQiLCJjb3JyZWN0UmVwb3NpdGlvbiIsInNldFRyYW5zbGF0aW9uU2NhbGVUb1RhcmdldCIsInRyYW5zbGF0ZURlbHRhIiwiZGVsdGFWZWN0b3IiLCJ0YXJnZXRQb2ludCIsImNlbnRlciIsInNvdXJjZVBvaW50IiwidHJhbnNsYXRlVG9UYXJnZXQiLCJzaW5nbGVJbml0aWFsUG9pbnQiLCJzaW5nbGVUYXJnZXRQb2ludCIsImRlbHRhIiwidHJhbnNsYXRpb25Gcm9tVmVjdG9yIiwiZ2V0TWF0cml4IiwiY3VycmVudFNjYWxlIiwiY29tcHV0ZVNjYWxlVGFyZ2V0RnJvbUtleVByZXNzIiwidHJhbnNsYXRpb25WZWN0b3IiLCJlcXVhbHMiLCJaRVJPIiwiV2hlZWxFdmVudCIsImlzQ3RybEtleURvd24iLCJpc0Zpbml0ZSIsImFkZFByZXNzIiwicmVtb3ZlUHJlc3MiLCJfcHJlc3NlcyIsImludGVycnVwdCIsImNhbmNlbCIsInBhblRvTm9kZSIsIm5vZGUiLCJwYW5Ub0NlbnRlciIsInBhbkRpcmVjdGlvbiIsImJvdW5kc0luVGFyZ2V0RnJhbWUiLCJnbG9iYWxUb0xvY2FsQm91bmRzIiwidHJhbnNsYXRpb25EZWx0YSIsImRpc3RhbmNlVG9MZWZ0RWRnZSIsImRpc3RhbmNlVG9SaWdodEVkZ2UiLCJkaXN0YW5jZVRvVG9wRWRnZSIsImRpc3RhbmNlVG9Cb3R0b21FZGdlIiwiY2VudGVyWCIsImNlbnRlclkiLCJ3aWR0aCIsImhlaWdodCIsInBhZGRpbmdEZWx0YSIsIm1hdHJpeFNjYWxlIiwicGFkZGluZ0RlbHRhU2NhbGVkIiwibGVmdCIsInJpZ2h0IiwidG9wIiwiYm90dG9tIiwiYm91bmRzIiwiY29udGFpbnNCb3VuZHMiLCJwb3NpdGlvbkRpcnR5IiwiZXF1YWxzRXBzaWxvbiIsInNjYWxlRGlydHkiLCJ0cmFuc2xhdGlvbkRpZmZlcmVuY2UiLCJ0cmFuc2xhdGlvbkRpcmVjdGlvbiIsIm5vcm1hbGl6ZWQiLCJ0cmFuc2xhdGlvblNwZWVkIiwiZ2V0VHJhbnNsYXRpb25TcGVlZCIsInNldFhZIiwiY29tcG9uZW50TWFnbml0dWRlIiwibXVsdGlwbHlTY2FsYXIiLCJjb21wb25lbnRUaW1lcyIsInNjYWxlRGlmZmVyZW5jZSIsImFicyIsInNldFBhbkJvdW5kcyIsImVyb2RlZFhZIiwiaGFzTm9uemVyb0FyZWEiLCJzZXRUYXJnZXRCb3VuZHMiLCJ0YXJnZXRCb3VuZHMiLCJkZXN0aW5hdGlvbiIsInNldE1pbk1heCIsImNsb3Nlc3RQb2ludFRvIiwidHJhbnNsYXRpb25EaXN0YW5jZSIsInNjYWxlRGlzdGFuY2UiLCJtYXhTY2FsZUZhY3RvciIsInBvdyIsImxpbWl0ZWRUcmFuc2xhdGlvblNwZWVkIiwiem9vbUluIiwibmVhcmVzdEluZGV4IiwiZGlzdGFuY2VUb0N1cnJlbnRTY2FsZSIsIk51bWJlciIsIlBPU0lUSVZFX0lORklOSVRZIiwiaSIsImRpc3RhbmNlIiwibmV4dEluZGV4IiwiY2xhbXAiLCJrZXlTdGF0ZVRyYWNrZXIiLCJ0YXJnZXRTY2FsZSIsInRyYW5zbGF0aW9uTWFnbml0dWRlIiwieERpcmVjdGlvbiIsImlzS2V5RG93biIsIktFWV9SSUdIVF9BUlJPVyIsIktFWV9MRUZUX0FSUk9XIiwieURpcmVjdGlvbiIsIktFWV9ET1dOX0FSUk9XIiwiS0VZX1VQX0FSUk9XIiwiZm9jdXNUcmFpbCIsImZvY3VzZWROb2RlIiwicGFyZW50VG9HbG9iYWxQb2ludCIsImZpcnN0Rm9jdXNhYmxlIiwiZ2V0TmV4dEZvY3VzYWJsZSIsImRvY3VtZW50IiwiYm9keSIsIm9mZnNldExlZnQiLCJvZmZzZXRXaWR0aCIsIm9mZnNldFRvcCIsIm9mZnNldEhlaWdodCIsImN0cmxLZXkiLCJkZWx0YVkiLCJ0cmFuc2xhdGlvblgiLCJkZWx0YVgiLCJ0cmFuc2xhdGlvblkiLCJkZWx0YU1vZGUiLCJET01fREVMVEFfTElORSIsImNvcHkiLCJtaW5TY2FsZSIsIm1heFNjYWxlIiwic3RlcHMiLCJkaXNjcmV0ZVNjYWxlc01heCIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiQW5pbWF0ZWRQYW5ab29tTGlzdGVuZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBQYW5ab29tTGlzdGVuZXIgdGhhdCBzdXBwb3J0cyBhZGRpdGlvbmFsIGZvcm1zIG9mIGlucHV0IGZvciBwYW4gYW5kIHpvb20sIGluY2x1ZGluZyB0cmFja3BhZCBnZXN0dXJlcywgbW91c2VcclxuICogd2hlZWwsIGFuZCBrZXlib2FyZCBpbnB1dC4gVGhlc2UgZ2VzdHVyZXMgd2lsbCBhbmltYXRlIHRoZSB0YXJnZXQgbm9kZSB0byBpdHMgZGVzdGluYXRpb24gdHJhbnNsYXRpb24gYW5kIHNjYWxlIHNvIGl0XHJcbiAqIHVzZXMgYSBzdGVwIGZ1bmN0aW9uIHRoYXQgbXVzdCBiZSBjYWxsZWQgZXZlcnkgYW5pbWF0aW9uIGZyYW1lLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZ1xyXG4gKi9cclxuXHJcbmltcG9ydCBCb3VuZHMyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9Cb3VuZHMyLmpzJztcclxuaW1wb3J0IE1hdHJpeDMgZnJvbSAnLi4vLi4vLi4vZG90L2pzL01hdHJpeDMuanMnO1xyXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vLi4vZG90L2pzL1V0aWxzLmpzJztcclxuaW1wb3J0IFZlY3RvcjIgZnJvbSAnLi4vLi4vLi4vZG90L2pzL1ZlY3RvcjIuanMnO1xyXG5pbXBvcnQgcGxhdGZvcm0gZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL3BsYXRmb3JtLmpzJztcclxuaW1wb3J0IEV2ZW50VHlwZSBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvRXZlbnRUeXBlLmpzJztcclxuaW1wb3J0IGlzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL2lzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgUGhldGlvQWN0aW9uIGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy9QaGV0aW9BY3Rpb24uanMnO1xyXG5pbXBvcnQgeyBFdmVudElPLCBGb2N1cywgRm9jdXNNYW5hZ2VyLCBnbG9iYWxLZXlTdGF0ZVRyYWNrZXIsIEludGVudCwgS2V5Ym9hcmREcmFnTGlzdGVuZXIsIEtleWJvYXJkVXRpbHMsIEtleWJvYXJkWm9vbVV0aWxzLCBLZXlTdGF0ZVRyYWNrZXIsIExpbWl0UGFuRGlyZWN0aW9uLCBNb3VzZSwgTXVsdGlMaXN0ZW5lclByZXNzLCBOb2RlLCBQYW5ab29tTGlzdGVuZXIsIFBhblpvb21MaXN0ZW5lck9wdGlvbnMsIFBET01Qb2ludGVyLCBQRE9NVXRpbHMsIFBvaW50ZXIsIFByZXNzTGlzdGVuZXIsIHNjZW5lcnksIFNjZW5lcnlFdmVudCwgVHJhaWwsIFRyYW5zZm9ybVRyYWNrZXIgfSBmcm9tICcuLi9pbXBvcnRzLmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBFbXB0eVNlbGZPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcbmltcG9ydCBCb29sZWFuUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9Cb29sZWFuUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgeyBQcm9wZXJ0eUxpbmtMaXN0ZW5lciB9IGZyb20gJy4uLy4uLy4uL2F4b24vanMvVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5cclxuLy8gY29uc3RhbnRzXHJcbmNvbnN0IE1PVkVfQ1VSU09SID0gJ2FsbC1zY3JvbGwnO1xyXG5jb25zdCBNQVhfU0NST0xMX1ZFTE9DSVRZID0gMTUwOyAvLyBtYXggZ2xvYmFsIHZpZXcgY29vcmRzIHBlciBzZWNvbmQgd2hpbGUgc2Nyb2xsaW5nIHdpdGggbWlkZGxlIG1vdXNlIGJ1dHRvbiBkcmFnXHJcblxyXG4vLyBUaGUgbWF4IHNwZWVkIG9mIHRyYW5zbGF0aW9uIHdoZW4gYW5pbWF0aW5nIGZyb20gc291cmNlIHBvc2l0aW9uIHRvIGRlc3RpbmF0aW9uIHBvc2l0aW9uIGluIHRoZSBjb29yZGluYXRlIGZyYW1lXHJcbi8vIG9mIHRoZSBwYXJlbnQgb2YgdGhlIHRhcmdldE5vZGUgb2YgdGhpcyBsaXN0ZW5lci4gSW5jcmVhc2UgdGhlIHZhbHVlIG9mIHRoaXMgdG8gYW5pbWF0ZSBmYXN0ZXIgdG8gdGhlIGRlc3RpbmF0aW9uXHJcbi8vIHBvc2l0aW9uIHdoZW4gcGFubmluZyB0byB0YXJnZXRzLlxyXG5jb25zdCBNQVhfVFJBTlNMQVRJT05fU1BFRUQgPSAxMDAwO1xyXG5cclxuLy8gc2NyYXRjaCB2YXJpYWJsZXMgdG8gcmVkdWNlIGdhcmJhZ2VcclxuY29uc3Qgc2NyYXRjaFRyYW5zbGF0aW9uVmVjdG9yID0gbmV3IFZlY3RvcjIoIDAsIDAgKTtcclxuY29uc3Qgc2NyYXRjaFNjYWxlVGFyZ2V0VmVjdG9yID0gbmV3IFZlY3RvcjIoIDAsIDAgKTtcclxuY29uc3Qgc2NyYXRjaFZlbG9jaXR5VmVjdG9yID0gbmV3IFZlY3RvcjIoIDAsIDAgKTtcclxuY29uc3Qgc2NyYXRjaEJvdW5kcyA9IG5ldyBCb3VuZHMyKCAwLCAwLCAwLCAwICk7XHJcblxyXG4vLyBUeXBlIGZvciBhIEdlc3R1cmVFdmVudCAtIGV4cGVyaW1lbnRhbCBhbmQgU2FmYXJpIHNwZWNpZmljIEV2ZW50LCBub3QgYXZhaWxhYmxlIGluIGRlZmF1bHQgdHlwaW5nIHNvIGl0IGlzIG1hbnVhbGx5XHJcbi8vIGRlZmluZWQgaGVyZS4gU2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9HZXN0dXJlRXZlbnRcclxudHlwZSBHZXN0dXJlRXZlbnQgPSB7XHJcbiAgc2NhbGU6IG51bWJlcjtcclxuICBwYWdlWDogbnVtYmVyO1xyXG4gIHBhZ2VZOiBudW1iZXI7XHJcbn0gJiBFdmVudDtcclxuXHJcbmNsYXNzIEFuaW1hdGVkUGFuWm9vbUxpc3RlbmVyIGV4dGVuZHMgUGFuWm9vbUxpc3RlbmVyIHtcclxuXHJcbiAgLy8gVGhpcyBwb2ludCBpcyB0aGUgY2VudGVyIG9mIHRoZSB0cmFuc2Zvcm1lZFBhbkJvdW5kcyAoc2VlIFBhblpvb21MaXN0ZW5lcikgaW5cclxuICAvLyB0aGUgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUgb2YgdGhlIHRhcmdldE5vZGUuIFRoaXMgaXMgdGhlIGN1cnJlbnQgY2VudGVyIG9mIHRoZSB0cmFuc2Zvcm1lZFBhbkJvdW5kcywgYW5kXHJcbiAgLy8gZHVyaW5nIGFuaW1hdGlvbiB3ZSB3aWxsIG1vdmUgdGhpcyBwb2ludCBjbG9zZXIgdG8gdGhlIGRlc3RpbmF0aW9uUG9zaXRpb24uXHJcbiAgcHJpdmF0ZSBzb3VyY2VQb3NpdGlvbjogVmVjdG9yMiB8IG51bGw7XHJcblxyXG4gIC8vIFRoZSBkZXN0aW5hdGlvbiBmb3IgdHJhbnNsYXRpb24sIHdlIHdpbGwgcmVwb3NpdGlvbiB0aGUgdGFyZ2V0Tm9kZSB1bnRpbCB0aGVcclxuICAvLyBzb3VyY2VQb3NpdGlvbiBtYXRjaGVzIHRoaXMgcG9pbnQuIFRoaXMgaXMgaW4gdGhlIHBhcmVudCBjb29yZGluYXRlIGZyYW1lIG9mIHRoZSB0YXJnZXROb2RlLlxyXG4gIHByaXZhdGUgZGVzdGluYXRpb25Qb3NpdGlvbjogVmVjdG9yMiB8IG51bGw7XHJcblxyXG4gIC8vIFRoZSBjdXJyZW50IHNjYWxlIG9mIHRoZSB0YXJnZXROb2RlLiBEdXJpbmcgYW5pbWF0aW9uIHdlIHdpbGwgc2NhbGUgdGhlIHRhcmdldE5vZGUgdW50aWwgdGhpcyBtYXRjaGVzIHRoZSBkZXN0aW5hdGlvblNjYWxlLlxyXG4gIHByaXZhdGUgc291cmNlU2NhbGU6IG51bWJlcjtcclxuXHJcbiAgLy8gVGhlIGRlc2lyZWQgc2NhbGUgZm9yIHRoZSB0YXJnZXROb2RlLCB0aGUgbm9kZSBpcyByZXBvc2l0aW9uZWQgdW50aWwgc291cmNlU2NhbGUgbWF0Y2hlcyBkZXN0aW5hdGlvblNjYWxlLlxyXG4gIHByaXZhdGUgZGVzdGluYXRpb25TY2FsZTogbnVtYmVyO1xyXG5cclxuICAvLyBUaGUgcG9pbnQgYXQgd2hpY2ggYSBzY2FsZSBnZXN0dXJlIHdhcyBpbml0aWF0ZWQuIFRoaXMgaXMgdXN1YWxseSB0aGUgbW91c2UgcG9pbnQgaW5cclxuICAvLyB0aGUgZ2xvYmFsIGNvb3JkaW5hdGUgZnJhbWUgd2hlbiBhIHdoZWVsIG9yIHRyYWNrcGFkIHpvb20gZ2VzdHVyZSBpcyBpbml0aWF0ZWQuIFRoZSB0YXJnZXROb2RlIHdpbGwgYXBwZWFyIHRvXHJcbiAgLy8gYmUgem9vbWVkIGludG8gdGhpcyBwb2ludC4gVGhpcyBpcyBpbiB0aGUgZ2xvYmFsIGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgcHJpdmF0ZSBzY2FsZUdlc3R1cmVUYXJnZXRQb3NpdGlvbjogVmVjdG9yMiB8IG51bGw7XHJcblxyXG4gIC8vIFNjYWxlIGNoYW5nZXMgaW4gZGlzY3JldGUgYW1vdW50cyBmb3IgY2VydGFpbiB0eXBlcyBvZiBpbnB1dCwgYW5kIGluIHRoZXNlIGNhc2VzIHRoaXMgYXJyYXkgZGVmaW5lcyB0aGUgZGlzY3JldGVcclxuICAvLyBzY2FsZXMgcG9zc2libGVcclxuICBwcml2YXRlIGRpc2NyZXRlU2NhbGVzOiBudW1iZXJbXTtcclxuXHJcbiAgLy8gSWYgZGVmaW5lZCwgaW5kaWNhdGVzIHRoYXQgYSBtaWRkbGUgbW91c2UgYnV0dG9uIGlzIGRvd24gdG8gcGFuIGluIHRoZSBkaXJlY3Rpb24gb2YgY3Vyc29yIG1vdmVtZW50LlxyXG4gIHByaXZhdGUgbWlkZGxlUHJlc3M6IE1pZGRsZVByZXNzIHwgbnVsbDtcclxuXHJcbiAgLy8gVGhlc2UgYm91bmRzIGRlZmluZSBiZWhhdmlvciBvZiBwYW5uaW5nIGR1cmluZyBpbnRlcmFjdGlvbiB3aXRoIGFub3RoZXIgbGlzdGVuZXIgdGhhdCBkZWNsYXJlcyBpdHMgaW50ZW50IGZvclxyXG4gIC8vIGRyYWdnaW5nLiBJZiB0aGUgcG9pbnRlciBpcyBvdXQgb2YgdGhlc2UgYm91bmRzIGFuZCBpdHMgaW50ZW50IGlzIGZvciBkcmFnZ2luZywgd2Ugd2lsbCB0cnkgdG8gcmVwb3NpdGlvbiBzb1xyXG4gIC8vIHRoYXQgdGhlIGRyYWdnZWQgb2JqZWN0IHJlbWFpbnMgdmlzaWJsZVxyXG4gIHByaXZhdGUgX2RyYWdCb3VuZHM6IEJvdW5kczIgfCBudWxsO1xyXG5cclxuICAvLyBUaGUgcGFuQm91bmRzIGluIHRoZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lIG9mIHRoZSB0YXJnZXROb2RlLiBHZW5lcmFsbHksIHRoZXNlIGFyZSB0aGUgYm91bmRzIG9mIHRoZSB0YXJnZXROb2RlXHJcbiAgLy8gdGhhdCB5b3UgY2FuIHNlZSB3aXRoaW4gdGhlIHBhbkJvdW5kcy5cclxuICBwcml2YXRlIF90cmFuc2Zvcm1lZFBhbkJvdW5kczogQm91bmRzMjtcclxuXHJcbiAgLy8gd2hldGhlciBvciBub3QgdGhlIFBvaW50ZXIgd2VudCBkb3duIHdpdGhpbiB0aGUgZHJhZyBib3VuZHMgLSBpZiBpdCB3ZW50IGRvd24gb3V0IG9mIGRyYWcgYm91bmRzXHJcbiAgLy8gdGhlbiB1c2VyIGxpa2VseSB0cnlpbmcgdG8gcHVsbCBhbiBvYmplY3QgYmFjayBpbnRvIHZpZXcgc28gd2UgcHJldmVudCBwYW5uaW5nIGR1cmluZyBkcmFnXHJcbiAgcHJpdmF0ZSBfZHJhZ2dpbmdJbkRyYWdCb3VuZHM6IGJvb2xlYW47XHJcblxyXG4gIC8vIEEgY29sbGVjdGlvbiBvZiBsaXN0ZW5lcnMgUG9pbnRlcnMgd2l0aCBhdHRhY2hlZCBsaXN0ZW5lcnMgdGhhdCBhcmUgZG93bi4gVXNlZFxyXG4gIC8vIHByaW1hcmlseSB0byBkZXRlcm1pbmUgaWYgdGhlIGF0dGFjaGVkIGxpc3RlbmVyIGRlZmluZXMgYW55IHVuaXF1ZSBiZWhhdmlvciB0aGF0IHNob3VsZCBoYXBwZW4gZHVyaW5nIGEgZHJhZyxcclxuICAvLyBzdWNoIGFzIHBhbm5pbmcgdG8ga2VlcCBjdXN0b20gQm91bmRzIGluIHZpZXcuIFNlZSBUSW5wdXRMaXN0ZW5lci5jcmVhdGVQYW5UYXJnZXRCb3VuZHMuXHJcbiAgcHJpdmF0ZSBfYXR0YWNoZWRQb2ludGVyczogUG9pbnRlcltdO1xyXG5cclxuICAvLyBDZXJ0YWluIGNhbGN1bGF0aW9ucyBjYW4gb25seSBiZSBkb25lIG9uY2UgYXZhaWxhYmxlIHBhbiBib3VuZHMgYXJlIGZpbml0ZS5cclxuICBwcml2YXRlIGJvdW5kc0Zpbml0ZTogYm9vbGVhbjtcclxuXHJcbiAgLy8gQWN0aW9uIHdyYXBwaW5nIHdvcmsgdG8gYmUgZG9uZSB3aGVuIGEgZ2VzdHVyZSBzdGFydHMgb24gYSBtYWNPUyB0cmFja3BhZCAoc3BlY2lmaWMgdG8gdGhhdCBwbGF0Zm9ybSEpLiBXcmFwcGVkXHJcbiAgLy8gaW4gYW4gYWN0aW9uIHNvIHRoYXQgc3RhdGUgaXMgY2FwdHVyZWQgZm9yIFBoRVQtaU9cclxuICBwcml2YXRlIGdlc3R1cmVTdGFydEFjdGlvbjogUGhldGlvQWN0aW9uPEdlc3R1cmVFdmVudFtdPjtcclxuICBwcml2YXRlIGdlc3R1cmVDaGFuZ2VBY3Rpb246IFBoZXRpb0FjdGlvbjxHZXN0dXJlRXZlbnRbXT47XHJcblxyXG4gIC8vIHNjYWxlIHJlcHJlc2VudGVkIGF0IHRoZSBzdGFydCBvZiB0aGUgZ2VzdHVyZSwgYXMgcmVwb3J0ZWQgYnkgdGhlIEdlc3R1cmVFdmVudCwgdXNlZCB0byBjYWxjdWxhdGUgaG93IG11Y2hcclxuICAvLyB0byBzY2FsZSB0aGUgdGFyZ2V0IE5vZGVcclxuICBwcml2YXRlIHRyYWNrcGFkR2VzdHVyZVN0YXJ0U2NhbGUgPSAxO1xyXG5cclxuICAvLyBUcnVlIHdoZW4gdGhlIGxpc3RlbmVyIGlzIGFjdGl2ZWx5IHBhbm5pbmcgb3Igem9vbWluZyB0byB0aGUgZGVzdGluYXRpb24gcG9zaXRpb24gYW5kIHNjYWxlLiBVcGRhdGVkIGluIHRoZVxyXG4gIC8vIGFuaW1hdGlvbiBmcmFtZS5cclxuICBwdWJsaWMgcmVhZG9ubHkgYW5pbWF0aW5nUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCBmYWxzZSApO1xyXG5cclxuICAvLyBBIFRyYW5zZm9ybVRyYWNrZXIgdGhhdCB3aWxsIHdhdGNoIGZvciBjaGFuZ2VzIHRvIHRoZSB0YXJnZXROb2RlJ3MgZ2xvYmFsIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCwgdXNlZCB0byBrZWVwXHJcbiAgLy8gdGhlIHRhcmdldE5vZGUgaW4gdmlldyBkdXJpbmcgYW5pbWF0aW9uLlxyXG4gIHByaXZhdGUgX3RyYW5zZm9ybVRyYWNrZXI6IFRyYW5zZm9ybVRyYWNrZXIgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgLy8gQSBsaXN0ZW5lciBvbiB0aGUgZm9jdXNQYW5UYXJnZXRCb3VuZHNQcm9wZXJ0eSBvZiB0aGUgZm9jdXNlZCBOb2RlIHRoYXQgd2lsbCBrZWVwIHRob3NlIGJvdW5kcyBkaXNwbGF5ZWQgaW5cclxuICAvLyB0aGUgdmlld3BvcnQuXHJcbiAgcHJpdmF0ZSBfZm9jdXNCb3VuZHNMaXN0ZW5lcjogUHJvcGVydHlMaW5rTGlzdGVuZXI8Qm91bmRzMj4gfCBudWxsID0gbnVsbDtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNwb3NlQW5pbWF0ZWRQYW5ab29tTGlzdGVuZXI6ICgpID0+IHZvaWQ7XHJcblxyXG4gIC8qKlxyXG4gICAqIHRhcmdldE5vZGUgLSBOb2RlIHRvIGJlIHRyYW5zZm9ybWVkIGJ5IHRoaXMgbGlzdGVuZXJcclxuICAgKiB7T2JqZWN0fSBbcHJvdmlkZWRPcHRpb25zXVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggdGFyZ2V0Tm9kZTogTm9kZSwgcHJvdmlkZWRPcHRpb25zPzogUGFuWm9vbUxpc3RlbmVyT3B0aW9ucyApIHtcclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8UGFuWm9vbUxpc3RlbmVyT3B0aW9ucywgRW1wdHlTZWxmT3B0aW9ucywgUGFuWm9vbUxpc3RlbmVyT3B0aW9ucz4oKSgge1xyXG4gICAgICB0YW5kZW06IFRhbmRlbS5SRVFVSVJFRFxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcbiAgICBzdXBlciggdGFyZ2V0Tm9kZSwgb3B0aW9ucyApO1xyXG5cclxuICAgIHRoaXMuc291cmNlUG9zaXRpb24gPSBudWxsO1xyXG4gICAgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uID0gbnVsbDtcclxuICAgIHRoaXMuc291cmNlU2NhbGUgPSB0aGlzLmdldEN1cnJlbnRTY2FsZSgpO1xyXG4gICAgdGhpcy5kZXN0aW5hdGlvblNjYWxlID0gdGhpcy5nZXRDdXJyZW50U2NhbGUoKTtcclxuICAgIHRoaXMuc2NhbGVHZXN0dXJlVGFyZ2V0UG9zaXRpb24gPSBudWxsO1xyXG4gICAgdGhpcy5kaXNjcmV0ZVNjYWxlcyA9IGNhbGN1bGF0ZURpc2NyZXRlU2NhbGVzKCB0aGlzLl9taW5TY2FsZSwgdGhpcy5fbWF4U2NhbGUgKTtcclxuICAgIHRoaXMubWlkZGxlUHJlc3MgPSBudWxsO1xyXG4gICAgdGhpcy5fZHJhZ0JvdW5kcyA9IG51bGw7XHJcbiAgICB0aGlzLl90cmFuc2Zvcm1lZFBhbkJvdW5kcyA9IHRoaXMuX3BhbkJvdW5kcy50cmFuc2Zvcm1lZCggdGhpcy5fdGFyZ2V0Tm9kZS5tYXRyaXguaW52ZXJ0ZWQoKSApO1xyXG4gICAgdGhpcy5fZHJhZ2dpbmdJbkRyYWdCb3VuZHMgPSBmYWxzZTtcclxuICAgIHRoaXMuX2F0dGFjaGVkUG9pbnRlcnMgPSBbXTtcclxuICAgIHRoaXMuYm91bmRzRmluaXRlID0gZmFsc2U7XHJcblxyXG4gICAgLy8gbGlzdGVuZXJzIHRoYXQgd2lsbCBiZSBib3VuZCB0byBgdGhpc2AgaWYgd2UgYXJlIG9uIGEgKG5vbi10b3VjaHNjcmVlbikgc2FmYXJpIHBsYXRmb3JtLCByZWZlcmVuY2VkIGZvclxyXG4gICAgLy8gcmVtb3ZhbCBvbiBkaXNwb3NlXHJcbiAgICBsZXQgYm91bmRHZXN0dXJlU3RhcnRMaXN0ZW5lcjogbnVsbCB8ICggKCBldmVudDogR2VzdHVyZUV2ZW50ICkgPT4gdm9pZCApID0gbnVsbDtcclxuICAgIGxldCBib3VuZEdlc3R1cmVDaGFuZ2VMaXN0ZW5lcjogbnVsbCB8ICggKCBldmVudDogR2VzdHVyZUV2ZW50ICkgPT4gdm9pZCApID0gbnVsbDtcclxuXHJcbiAgICB0aGlzLmdlc3R1cmVTdGFydEFjdGlvbiA9IG5ldyBQaGV0aW9BY3Rpb24oIGRvbUV2ZW50ID0+IHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggZG9tRXZlbnQucGFnZVgsICdwYWdlWCByZXF1aXJlZCBvbiBET01FdmVudCcgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggZG9tRXZlbnQucGFnZVksICdwYWdlWSByZXF1aXJlZCBvbiBET01FdmVudCcgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggZG9tRXZlbnQuc2NhbGUsICdzY2FsZSByZXF1aXJlZCBvbiBET01FdmVudCcgKTtcclxuXHJcbiAgICAgIC8vIHByZXZlbnQgU2FmYXJpIGZyb20gZG9pbmcgYW55dGhpbmcgbmF0aXZlIHdpdGggdGhpcyBnZXN0dXJlXHJcbiAgICAgIGRvbUV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICB0aGlzLnRyYWNrcGFkR2VzdHVyZVN0YXJ0U2NhbGUgPSBkb21FdmVudC5zY2FsZTtcclxuICAgICAgdGhpcy5zY2FsZUdlc3R1cmVUYXJnZXRQb3NpdGlvbiA9IG5ldyBWZWN0b3IyKCBkb21FdmVudC5wYWdlWCwgZG9tRXZlbnQucGFnZVkgKTtcclxuICAgIH0sIHtcclxuICAgICAgcGhldGlvUGxheWJhY2s6IHRydWUsXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAnZ2VzdHVyZVN0YXJ0QWN0aW9uJyApLFxyXG4gICAgICBwYXJhbWV0ZXJzOiBbIHsgbmFtZTogJ2V2ZW50JywgcGhldGlvVHlwZTogRXZlbnRJTyB9IF0sXHJcbiAgICAgIHBoZXRpb0V2ZW50VHlwZTogRXZlbnRUeXBlLlVTRVIsXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdBY3Rpb24gdGhhdCBleGVjdXRlcyB3aGVuZXZlciBhIGdlc3R1cmUgc3RhcnRzIG9uIGEgdHJhY2twYWQgaW4gbWFjT1MgU2FmYXJpLidcclxuICAgIH0gKTtcclxuXHJcblxyXG4gICAgdGhpcy5nZXN0dXJlQ2hhbmdlQWN0aW9uID0gbmV3IFBoZXRpb0FjdGlvbiggZG9tRXZlbnQgPT4ge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBkb21FdmVudC5zY2FsZSwgJ3NjYWxlIHJlcXVpcmVkIG9uIERPTUV2ZW50JyApO1xyXG5cclxuICAgICAgLy8gcHJldmVudCBTYWZhcmkgZnJvbSBjaGFuZ2luZyBwb3NpdGlvbiBvciBzY2FsZSBuYXRpdmVseVxyXG4gICAgICBkb21FdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgY29uc3QgbmV3U2NhbGUgPSB0aGlzLnNvdXJjZVNjYWxlICsgZG9tRXZlbnQuc2NhbGUgLSB0aGlzLnRyYWNrcGFkR2VzdHVyZVN0YXJ0U2NhbGU7XHJcbiAgICAgIHRoaXMuc2V0RGVzdGluYXRpb25TY2FsZSggbmV3U2NhbGUgKTtcclxuICAgIH0sIHtcclxuICAgICAgcGhldGlvUGxheWJhY2s6IHRydWUsXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAnZ2VzdHVyZUNoYW5nZUFjdGlvbicgKSxcclxuICAgICAgcGFyYW1ldGVyczogWyB7IG5hbWU6ICdldmVudCcsIHBoZXRpb1R5cGU6IEV2ZW50SU8gfSBdLFxyXG4gICAgICBwaGV0aW9FdmVudFR5cGU6IEV2ZW50VHlwZS5VU0VSLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnQWN0aW9uIHRoYXQgZXhlY3V0ZXMgd2hlbmV2ZXIgYSBnZXN0dXJlIGNoYW5nZXMgb24gYSB0cmFja3BhZCBpbiBtYWNPUyBTYWZhcmkuJ1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIHJlc3BvbmQgdG8gbWFjT1MgdHJhY2twYWQgaW5wdXQsIGJ1dCBkb24ndCByZXNwb25kIHRvIHRoaXMgaW5wdXQgb24gYW4gaU9TIHRvdWNoIHNjcmVlblxyXG4gICAgaWYgKCBwbGF0Zm9ybS5zYWZhcmkgJiYgIXBsYXRmb3JtLm1vYmlsZVNhZmFyaSApIHtcclxuICAgICAgYm91bmRHZXN0dXJlU3RhcnRMaXN0ZW5lciA9IHRoaXMuaGFuZGxlR2VzdHVyZVN0YXJ0RXZlbnQuYmluZCggdGhpcyApO1xyXG4gICAgICBib3VuZEdlc3R1cmVDaGFuZ2VMaXN0ZW5lciA9IHRoaXMuaGFuZGxlR2VzdHVyZUNoYW5nZUV2ZW50LmJpbmQoIHRoaXMgKTtcclxuXHJcbiAgICAgIC8vIHRoZSBzY2FsZSBvZiB0aGUgdGFyZ2V0Tm9kZSBhdCB0aGUgc3RhcnQgb2YgdGhlIGdlc3R1cmUsIHVzZWQgdG8gY2FsY3VsYXRlIGhvdyBzY2FsZSB0byBhcHBseSBmcm9tXHJcbiAgICAgIC8vICdnZXN0dXJlY2hhbmdlJyBldmVudFxyXG4gICAgICB0aGlzLnRyYWNrcGFkR2VzdHVyZVN0YXJ0U2NhbGUgPSB0aGlzLmdldEN1cnJlbnRTY2FsZSgpO1xyXG5cclxuICAgICAgLy8gV0FSTklORzogVGhlc2UgZXZlbnRzIGFyZSBub24tc3RhbmRhcmQsIGJ1dCB0aGlzIGlzIHRoZSBvbmx5IHdheSB0byBkZXRlY3QgYW5kIHByZXZlbnQgbmF0aXZlIHRyYWNrcGFkXHJcbiAgICAgIC8vIGlucHV0IG9uIG1hY09TIFNhZmFyaS4gRm9yIEFwcGxlIGRvY3VtZW50YXRpb24gYWJvdXQgdGhlc2UgZXZlbnRzLCBzZWVcclxuICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIuYXBwbGUuY29tL2RvY3VtZW50YXRpb24vd2Via2l0anMvZ2VzdHVyZWV2ZW50XHJcblxyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gRXZlbnQgdHlwZSBmb3IgdGhpcyBTYWZhcmkgc3BlY2lmaWMgZXZlbnQgaXNuJ3QgYXZhaWxhYmxlIHlldFxyXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ2dlc3R1cmVzdGFydCcsIGJvdW5kR2VzdHVyZVN0YXJ0TGlzdGVuZXIgKTtcclxuXHJcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBFdmVudCB0eXBlIGZvciB0aGlzIFNhZmFyaSBzcGVjaWZpYyBldmVudCBpc24ndCBhdmFpbGFibGUgeWV0XHJcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAnZ2VzdHVyZWNoYW5nZScsIGJvdW5kR2VzdHVyZUNoYW5nZUxpc3RlbmVyICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSGFuZGxlIGtleSBpbnB1dCBmcm9tIGV2ZW50cyBvdXRzaWRlIG9mIHRoZSBQRE9NIC0gaW4gdGhpcyBjYXNlIGl0IGlzIGltcG9zc2libGUgZm9yIHRoZSBQRE9NUG9pbnRlclxyXG4gICAgLy8gdG8gYmUgYXR0YWNoZWQgc28gd2UgaGF2ZSBmcmVlIHJlaWduIG92ZXIgdGhlIGtleWJvYXJkXHJcbiAgICBnbG9iYWxLZXlTdGF0ZVRyYWNrZXIua2V5ZG93bkVtaXR0ZXIuYWRkTGlzdGVuZXIoIHRoaXMud2luZG93S2V5ZG93bi5iaW5kKCB0aGlzICkgKTtcclxuXHJcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCB0aGUgZm9jdXNlZCBOb2RlIHN0YXlzIGluIHZpZXcgYW5kIGF1dG9tYXRpY2FsbHkgcGFuIHRvIGtlZXAgaXQgZGlzcGxheWVkIHdoZW4gaXQgaXMgYW5pbWF0ZWRcclxuICAgIC8vIHdpdGggYSB0cmFuc2Zvcm1hdGlvbiBjaGFuZ2VcclxuICAgIGNvbnN0IGRpc3BsYXlGb2N1c0xpc3RlbmVyID0gdGhpcy5oYW5kbGVGb2N1c0NoYW5nZS5iaW5kKCB0aGlzICk7XHJcbiAgICBGb2N1c01hbmFnZXIucGRvbUZvY3VzUHJvcGVydHkubGluayggZGlzcGxheUZvY3VzTGlzdGVuZXIgKTtcclxuXHJcbiAgICAvLyBzZXQgc291cmNlIGFuZCBkZXN0aW5hdGlvbiBwb3NpdGlvbnMgYW5kIHNjYWxlcyBhZnRlciBzZXR0aW5nIGZyb20gc3RhdGVcclxuICAgIC8vIHRvIGluaXRpYWxpemUgdmFsdWVzIGZvciBhbmltYXRpb24gd2l0aCBBbmltYXRlZFBhblpvb21MaXN0ZW5lclxyXG4gICAgdGhpcy5zb3VyY2VGcmFtZVBhbkJvdW5kc1Byb3BlcnR5LmxhenlMaW5rKCAoKSA9PiB7XHJcblxyXG4gICAgICBpZiAoIGlzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgICAgdGhpcy5pbml0aWFsaXplUG9zaXRpb25zKCk7XHJcbiAgICAgICAgdGhpcy5zb3VyY2VTY2FsZSA9IHRoaXMuZ2V0Q3VycmVudFNjYWxlKCk7XHJcbiAgICAgICAgdGhpcy5zZXREZXN0aW5hdGlvblNjYWxlKCB0aGlzLnNvdXJjZVNjYWxlICk7XHJcbiAgICAgIH1cclxuICAgIH0sIHtcclxuXHJcbiAgICAgIC8vIGd1YXJhbnRlZSB0aGF0IHRoZSBtYXRyaXhQcm9wZXJ0eSB2YWx1ZSBpcyB1cCB0byBkYXRlIHdoZW4gdGhpcyBsaXN0ZW5lciBpcyBjYWxsZWRcclxuICAgICAgcGhldGlvRGVwZW5kZW5jaWVzOiBbIHRoaXMubWF0cml4UHJvcGVydHkgXVxyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuZGlzcG9zZUFuaW1hdGVkUGFuWm9vbUxpc3RlbmVyID0gKCkgPT4ge1xyXG5cclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciAtIEV2ZW50IHR5cGUgZm9yIHRoaXMgU2FmYXJpIHNwZWNpZmljIGV2ZW50IGlzbid0IGF2YWlsYWJsZSB5ZXRcclxuICAgICAgYm91bmRHZXN0dXJlU3RhcnRMaXN0ZW5lciAmJiB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2dlc3R1cmVzdGFydCcsIGJvdW5kR2VzdHVyZVN0YXJ0TGlzdGVuZXIgKTtcclxuXHJcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBFdmVudCB0eXBlIGZvciB0aGlzIFNhZmFyaSBzcGVjaWZpYyBldmVudCBpc24ndCBhdmFpbGFibGUgeWV0XHJcbiAgICAgIGJvdW5kR2VzdHVyZUNoYW5nZUxpc3RlbmVyICYmIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCAnZ2VzdHVyZUNoYW5nZScsIGJvdW5kR2VzdHVyZUNoYW5nZUxpc3RlbmVyICk7XHJcblxyXG4gICAgICB0aGlzLmFuaW1hdGluZ1Byb3BlcnR5LmRpc3Bvc2UoKTtcclxuXHJcbiAgICAgIGlmICggdGhpcy5fdHJhbnNmb3JtVHJhY2tlciApIHtcclxuICAgICAgICB0aGlzLl90cmFuc2Zvcm1UcmFja2VyLmRpc3Bvc2UoKTtcclxuICAgICAgfVxyXG4gICAgICBGb2N1c01hbmFnZXIucGRvbUZvY3VzUHJvcGVydHkudW5saW5rKCBkaXNwbGF5Rm9jdXNMaXN0ZW5lciApO1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN0ZXAgdGhlIGxpc3RlbmVyLCBzdXBwb3J0aW5nIGFueSBhbmltYXRpb24gYXMgdGhlIHRhcmdldCBub2RlIGlzIHRyYW5zZm9ybWVkIHRvIHRhcmdldCBwb3NpdGlvbiBhbmQgc2NhbGUuXHJcbiAgICovXHJcbiAgcHVibGljIHN0ZXAoIGR0OiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICBpZiAoIHRoaXMubWlkZGxlUHJlc3MgKSB7XHJcbiAgICAgIHRoaXMuaGFuZGxlTWlkZGxlUHJlc3MoIGR0ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaWYgZHJhZ2dpbmcgYW4gaXRlbSB3aXRoIGEgbW91c2Ugb3IgdG91Y2ggcG9pbnRlciwgbWFrZSBzdXJlIHRoYXQgaXQgcmFtYWlucyB2aXNpYmxlIGluIHRoZSB6b29tZWQgaW4gdmlldyxcclxuICAgIC8vIHBhbm5pbmcgdG8gaXQgd2hlbiBpdCBhcHByb2FjaGVzIGVkZ2Ugb2YgdGhlIHNjcmVlblxyXG4gICAgaWYgKCB0aGlzLl9hdHRhY2hlZFBvaW50ZXJzLmxlbmd0aCA+IDAgKSB7XHJcblxyXG4gICAgICAvLyBvbmx5IG5lZWQgdG8gZG8gdGhpcyB3b3JrIGlmIHdlIGFyZSB6b29tZWQgaW5cclxuICAgICAgaWYgKCB0aGlzLmdldEN1cnJlbnRTY2FsZSgpID4gMSApIHtcclxuICAgICAgICBpZiAoIHRoaXMuX2F0dGFjaGVkUG9pbnRlcnMubGVuZ3RoID4gMCApIHtcclxuXHJcbiAgICAgICAgICAvLyBGaWx0ZXIgb3V0IGFueSBwb2ludGVycyB0aGF0IG5vIGxvbmdlciBoYXZlIGFuIGF0dGFjaGVkIGxpc3RlbmVyIGR1ZSB0byBpbnRlcnJ1cHRpb24gZnJvbSB0aGluZ3MgbGlrZSBvcGVuaW5nXHJcbiAgICAgICAgICAvLyB0aGUgY29udGV4dCBtZW51IHdpdGggYSByaWdodCBjbGljay5cclxuICAgICAgICAgIHRoaXMuX2F0dGFjaGVkUG9pbnRlcnMgPSB0aGlzLl9hdHRhY2hlZFBvaW50ZXJzLmZpbHRlciggcG9pbnRlciA9PiBwb2ludGVyLmF0dGFjaGVkTGlzdGVuZXIgKTtcclxuICAgICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2F0dGFjaGVkUG9pbnRlcnMubGVuZ3RoIDw9IDEwLCAnTm90IGNsZWFyaW5nIGF0dGFjaGVkUG9pbnRlcnMsIHRoZXJlIGlzIHByb2JhYmx5IGEgbWVtb3J5IGxlYWsnICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBPbmx5IHJlcG9zaXRpb24gaWYgb25lIG9mIHRoZSBhdHRhY2hlZCBwb2ludGVycyBpcyBkb3duIGFuZCBkcmFnZ2luZyB3aXRoaW4gdGhlIGRyYWcgYm91bmRzIGFyZWEsIG9yIGlmIG9uZVxyXG4gICAgICAgIC8vIG9mIHRoZSBhdHRhY2hlZCBwb2ludGVycyBpcyBhIFBET01Qb2ludGVyLCB3aGljaCBpbmRpY2F0ZXMgdGhhdCB3ZSBhcmUgZHJhZ2dpbmcgd2l0aCBhbHRlcm5hdGl2ZSBpbnB1dFxyXG4gICAgICAgIC8vIChpbiB3aGljaCBjYXNlIGRyYWdnaW5nSW5EcmFnQm91bmRzIGRvZXMgbm90IGFwcGx5KVxyXG4gICAgICAgIGlmICggdGhpcy5fZHJhZ2dpbmdJbkRyYWdCb3VuZHMgfHwgdGhpcy5fYXR0YWNoZWRQb2ludGVycy5zb21lKCBwb2ludGVyID0+IHBvaW50ZXIgaW5zdGFuY2VvZiBQRE9NUG9pbnRlciApICkge1xyXG4gICAgICAgICAgdGhpcy5yZXBvc2l0aW9uRHVyaW5nRHJhZygpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuYW5pbWF0ZVRvVGFyZ2V0cyggZHQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEF0dGFjaCBhIE1pZGRsZVByZXNzIGZvciBkcmFnIHBhbm5pbmcsIGlmIGRldGVjdGVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBkb3duKCBldmVudDogU2NlbmVyeUV2ZW50ICk6IHZvaWQge1xyXG4gICAgc3VwZXIuZG93biggZXZlbnQgKTtcclxuXHJcbiAgICAvLyBJZiB0aGUgUG9pbnRlciBzaWduaWZpZXMgdGhlIGlucHV0IGlzIGludGVuZGVkIGZvciBkcmFnZ2luZyBzYXZlIGEgcmVmZXJlbmNlIHRvIHRoZSB0cmFpbCBzbyB3ZSBjYW4gc3VwcG9ydFxyXG4gICAgLy8ga2VlcGluZyB0aGUgZXZlbnQgdGFyZ2V0IGluIHZpZXcgZHVyaW5nIHRoZSBkcmFnIG9wZXJhdGlvbi5cclxuICAgIGlmICggdGhpcy5fZHJhZ0JvdW5kcyAhPT0gbnVsbCAmJiBldmVudC5wb2ludGVyLmhhc0ludGVudCggSW50ZW50LkRSQUcgKSApIHtcclxuXHJcbiAgICAgIC8vIGlmIHRoaXMgaXMgb3VyIG9ubHkgZG93biBwb2ludGVyLCBzZWUgaWYgd2Ugc2hvdWxkIHN0YXJ0IHBhbm5pbmcgZHVyaW5nIGRyYWdcclxuICAgICAgaWYgKCB0aGlzLl9hdHRhY2hlZFBvaW50ZXJzLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgICB0aGlzLl9kcmFnZ2luZ0luRHJhZ0JvdW5kcyA9IHRoaXMuX2RyYWdCb3VuZHMuY29udGFpbnNQb2ludCggZXZlbnQucG9pbnRlci5wb2ludCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBBbGwgY29uZGl0aW9ucyBhcmUgbWV0IHRvIHN0YXJ0IHdhdGNoaW5nIGZvciBib3VuZHMgdG8ga2VlcCBpbiB2aWV3IGR1cmluZyBhIGRyYWcgaW50ZXJhY3Rpb24uIEVhZ2VybHlcclxuICAgICAgLy8gc2F2ZSB0aGUgYXR0YWNoZWRMaXN0ZW5lciBoZXJlIHNvIHRoYXQgd2UgZG9uJ3QgaGF2ZSB0byBkbyBhbnkgd29yayBpbiB0aGUgbW92ZSBldmVudC5cclxuICAgICAgaWYgKCBldmVudC5wb2ludGVyLmF0dGFjaGVkTGlzdGVuZXIgKSB7XHJcbiAgICAgICAgaWYgKCAhdGhpcy5fYXR0YWNoZWRQb2ludGVycy5pbmNsdWRlcyggZXZlbnQucG9pbnRlciApICkge1xyXG4gICAgICAgICAgdGhpcy5fYXR0YWNoZWRQb2ludGVycy5wdXNoKCBldmVudC5wb2ludGVyICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gYmVnaW4gbWlkZGxlIHByZXNzIHBhbm5pbmcgaWYgd2UgYXJlbid0IGFscmVhZHkgaW4gdGhhdCBzdGF0ZVxyXG4gICAgaWYgKCBldmVudC5wb2ludGVyLnR5cGUgPT09ICdtb3VzZScgJiYgZXZlbnQucG9pbnRlciBpbnN0YW5jZW9mIE1vdXNlICYmIGV2ZW50LnBvaW50ZXIubWlkZGxlRG93biAmJiAhdGhpcy5taWRkbGVQcmVzcyApIHtcclxuICAgICAgdGhpcy5taWRkbGVQcmVzcyA9IG5ldyBNaWRkbGVQcmVzcyggZXZlbnQucG9pbnRlciwgZXZlbnQudHJhaWwgKTtcclxuICAgICAgZXZlbnQucG9pbnRlci5jdXJzb3IgPSBNT1ZFX0NVUlNPUjtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLmNhbmNlbE1pZGRsZVByZXNzKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJZiBpbiBhIHN0YXRlIHdoZXJlIHdlIGFyZSBwYW5uaW5nIGZyb20gYSBtaWRkbGUgbW91c2UgcHJlc3MsIGV4aXQgdGhhdCBzdGF0ZS5cclxuICAgKi9cclxuICBwcml2YXRlIGNhbmNlbE1pZGRsZVByZXNzKCk6IHZvaWQge1xyXG4gICAgaWYgKCB0aGlzLm1pZGRsZVByZXNzICkge1xyXG4gICAgICB0aGlzLm1pZGRsZVByZXNzLnBvaW50ZXIuY3Vyc29yID0gbnVsbDtcclxuICAgICAgdGhpcy5taWRkbGVQcmVzcyA9IG51bGw7XHJcblxyXG4gICAgICB0aGlzLnN0b3BJblByb2dyZXNzQW5pbWF0aW9uKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBMaXN0ZW5lciBmb3IgdGhlIGF0dGFjaGVkIHBvaW50ZXIgb24gbW92ZS4gT25seSBtb3ZlIGlmIGEgbWlkZGxlIHByZXNzIGlzIG5vdCBjdXJyZW50bHkgZG93bi5cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgb3ZlcnJpZGUgbW92ZVByZXNzKCBwcmVzczogTXVsdGlMaXN0ZW5lclByZXNzICk6IHZvaWQge1xyXG4gICAgaWYgKCAhdGhpcy5taWRkbGVQcmVzcyApIHtcclxuICAgICAgc3VwZXIubW92ZVByZXNzKCBwcmVzcyApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUGFydCBvZiB0aGUgU2NlbmVyeSBsaXN0ZW5lciBBUEkuIFN1cHBvcnRzIHJlcG9zaXRpb25pbmcgd2hpbGUgZHJhZ2dpbmcgYSBtb3JlIGRlc2NlbmRhbnQgbGV2ZWxcclxuICAgKiBOb2RlIHVuZGVyIHRoaXMgbGlzdGVuZXIuIElmIHRoZSBub2RlIGFuZCBwb2ludGVyIGFyZSBvdXQgb2YgdGhlIGRyYWdCb3VuZHMsIHdlIHJlcG9zaXRpb24gdG8ga2VlcCB0aGUgTm9kZVxyXG4gICAqIHZpc2libGUgd2l0aGluIGRyYWdCb3VuZHMuXHJcbiAgICpcclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgbW92ZSggZXZlbnQ6IFNjZW5lcnlFdmVudCApOiB2b2lkIHtcclxuXHJcbiAgICAvLyBObyBuZWVkIHRvIGRvIHRoaXMgd29yayBpZiB3ZSBhcmUgem9vbWVkIG91dC5cclxuICAgIGlmICggdGhpcy5fYXR0YWNoZWRQb2ludGVycy5sZW5ndGggPiAwICYmIHRoaXMuZ2V0Q3VycmVudFNjYWxlKCkgPiAxICkge1xyXG5cclxuICAgICAgLy8gT25seSB0cnkgdG8gZ2V0IHRoZSBhdHRhY2hlZCBsaXN0ZW5lciBpZiB3ZSBkaWRuJ3Qgc3VjY2Vzc2Z1bGx5IGdldCBpdCBvbiB0aGUgZG93biBldmVudC4gVGhpcyBzaG91bGQgb25seVxyXG4gICAgICAvLyBoYXBwZW4gaWYgdGhlIGRyYWcgZGlkIG5vdCBzdGFydCB3aXRoaW5nIGRyYWdCb3VuZHMgKHRoZSBsaXN0ZW5lciBpcyBsaWtlbHkgcHVsbGluZyB0aGUgTm9kZSBpbnRvIHZpZXcpIG9yXHJcbiAgICAgIC8vIGlmIGEgbGlzdGVuZXIgaGFzIG5vdCBiZWVuIGF0dGFjaGVkIHlldC4gT25jZSBhIGxpc3RlbmVyIGlzIGF0dGFjaGVkIHdlIGNhbiBzdGFydCB1c2luZyBpdCB0byBsb29rIGZvciB0aGVcclxuICAgICAgLy8gYm91bmRzIHRvIGtlZXAgaW4gdmlldy5cclxuICAgICAgaWYgKCB0aGlzLl9kcmFnZ2luZ0luRHJhZ0JvdW5kcyApIHtcclxuICAgICAgICBpZiAoICF0aGlzLl9hdHRhY2hlZFBvaW50ZXJzLmluY2x1ZGVzKCBldmVudC5wb2ludGVyICkgKSB7XHJcbiAgICAgICAgICBjb25zdCBoYXNEcmFnSW50ZW50ID0gdGhpcy5oYXNEcmFnSW50ZW50KCBldmVudC5wb2ludGVyICk7XHJcbiAgICAgICAgICBjb25zdCBjdXJyZW50VGFyZ2V0RXhpc3RzID0gZXZlbnQuY3VycmVudFRhcmdldCAhPT0gbnVsbDtcclxuXHJcbiAgICAgICAgICBpZiAoIGN1cnJlbnRUYXJnZXRFeGlzdHMgJiYgaGFzRHJhZ0ludGVudCApIHtcclxuICAgICAgICAgICAgaWYgKCBldmVudC5wb2ludGVyLmF0dGFjaGVkTGlzdGVuZXIgKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5fYXR0YWNoZWRQb2ludGVycy5wdXNoKCBldmVudC5wb2ludGVyICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgaWYgKCB0aGlzLl9kcmFnQm91bmRzICkge1xyXG4gICAgICAgICAgdGhpcy5fZHJhZ2dpbmdJbkRyYWdCb3VuZHMgPSB0aGlzLl9kcmFnQm91bmRzLmNvbnRhaW5zUG9pbnQoIGV2ZW50LnBvaW50ZXIucG9pbnQgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyB0aGUgdGFyZ2V0Tm9kZSBpZiB0aGVyZSBhcmUgYXR0YWNoZWQgcG9pbnRlcnMgYW5kIGFuIGF0dGFjaGVkUHJlc3NMaXN0ZW5lciBkdXJpbmcgYSBkcmFnIGV2ZW50LFxyXG4gICAqIG90aGVyd2lzZSB0aGUgZnVuY3Rpb24gcmV0dXJucyBudWxsLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2V0VGFyZ2V0Tm9kZUR1cmluZ0RyYWcoKTogTm9kZSB8IG51bGwge1xyXG5cclxuICAgIGlmICggdGhpcy5fYXR0YWNoZWRQb2ludGVycy5sZW5ndGggPiAwICkge1xyXG5cclxuICAgICAgLy8gV2UgaGF2ZSBhbiBhdHRhY2hlZExpc3RlbmVyIGZyb20gYSBTY2VuZXJ5RXZlbnQgUG9pbnRlciwgc2VlIGlmIGl0IGhhcyBpbmZvcm1hdGlvbiB3ZSBjYW4gdXNlIHRvXHJcbiAgICAgIC8vIGdldCB0aGUgdGFyZ2V0IEJvdW5kcyBmb3IgdGhlIGRyYWcgZXZlbnQuXHJcblxyXG4gICAgICAvLyBPbmx5IHVzZSB0aGUgZmlyc3Qgb25lIHNvIHRoYXQgdW5pcXVlIGRyYWdnaW5nIGJlaGF2aW9ycyBkb24ndCBcImZpZ2h0XCIgaWYgbXVsdGlwbGUgcG9pbnRlcnMgYXJlIGRvd24uXHJcbiAgICAgIGNvbnN0IGFjdGl2ZUxpc3RlbmVyID0gdGhpcy5fYXR0YWNoZWRQb2ludGVyc1sgMCBdLmF0dGFjaGVkTGlzdGVuZXIhO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhY3RpdmVMaXN0ZW5lciwgJ1RoZSBhdHRhY2hlZCBQb2ludGVyIGlzIGV4cGVjdGVkIHRvIGhhdmUgYW4gYXR0YWNoZWQgbGlzdGVuZXIuJyApO1xyXG5cclxuICAgICAgaWYgKCBhY3RpdmVMaXN0ZW5lci5saXN0ZW5lciBpbnN0YW5jZW9mIFByZXNzTGlzdGVuZXIgfHxcclxuICAgICAgICAgICBhY3RpdmVMaXN0ZW5lci5saXN0ZW5lciBpbnN0YW5jZW9mIEtleWJvYXJkRHJhZ0xpc3RlbmVyICkge1xyXG4gICAgICAgIGNvbnN0IGF0dGFjaGVkUHJlc3NMaXN0ZW5lciA9IGFjdGl2ZUxpc3RlbmVyLmxpc3RlbmVyO1xyXG5cclxuICAgICAgICAvLyBUaGUgUHJlc3NMaXN0ZW5lciBtaWdodCBub3QgYmUgcHJlc3NlZCBhbnltb3JlIGJ1dCB0aGUgUG9pbnRlciBpcyBzdGlsbCBkb3duLCBpbiB3aGljaCBjYXNlIGl0XHJcbiAgICAgICAgLy8gaGFzIGJlZW4gaW50ZXJydXB0ZWQgb3IgY2FuY2VsbGVkLlxyXG4gICAgICAgIC8vIE5PVEU6IEl0IGlzIHBvc3NpYmxlIEkgbmVlZCB0byBjYW5jZWxQYW5EdXJpbmdEcmFnKCkgaWYgaXQgaXMgbm8gbG9uZ2VyIHByZXNzZWQsIGJ1dCBJIGRvbid0XHJcbiAgICAgICAgLy8gd2FudCB0byBjbGVhciB0aGUgcmVmZXJlbmNlIHRvIHRoZSBhdHRhY2hlZExpc3RlbmVyLCBhbmQgSSB3YW50IHRvIHN1cHBvcnQgcmVzdW1pbmcgZHJhZyBkdXJpbmcgdG91Y2gtc25hZy5cclxuICAgICAgICBpZiAoIGF0dGFjaGVkUHJlc3NMaXN0ZW5lci5pc1ByZXNzZWQgKSB7XHJcblxyXG4gICAgICAgICAgLy8gdGhpcyB3aWxsIGVpdGhlciBiZSB0aGUgUHJlc3NMaXN0ZW5lcidzIHRhcmdldE5vZGUgb3IgdGhlIGRlZmF1bHQgdGFyZ2V0IG9mIHRoZSBTY2VuZXJ5RXZlbnQgb24gcHJlc3NcclxuICAgICAgICAgIHJldHVybiBhdHRhY2hlZFByZXNzTGlzdGVuZXIuZ2V0Q3VycmVudFRhcmdldCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBCb3VuZHMyIGluIHRoZSBnbG9iYWwgY29vcmRpbmF0ZSBmcmFtZSB0aGF0IHdlIGFyZSBnb2luZyB0byB0cnkgdG8ga2VlcCBpbiB2aWV3IGR1cmluZyBhIGRyYWdcclxuICAgKiBvcGVyYXRpb24uXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRHbG9iYWxCb3VuZHNUb1ZpZXdEdXJpbmdEcmFnKCk6IEJvdW5kczIgfCBudWxsIHtcclxuICAgIGxldCBnbG9iYWxCb3VuZHNUb1ZpZXcgPSBudWxsO1xyXG5cclxuICAgIGlmICggdGhpcy5fYXR0YWNoZWRQb2ludGVycy5sZW5ndGggPiAwICkge1xyXG5cclxuICAgICAgLy8gV2UgaGF2ZSBhbiBhdHRhY2hlZExpc3RlbmVyIGZyb20gYSBTY2VuZXJ5RXZlbnQgUG9pbnRlciwgc2VlIGlmIGl0IGhhcyBpbmZvcm1hdGlvbiB3ZSBjYW4gdXNlIHRvXHJcbiAgICAgIC8vIGdldCB0aGUgdGFyZ2V0IEJvdW5kcyBmb3IgdGhlIGRyYWcgZXZlbnQuXHJcblxyXG4gICAgICAvLyBPbmx5IHVzZSB0aGUgZmlyc3Qgb25lIHNvIHRoYXQgdW5pcXVlIGRyYWdnaW5nIGJlaGF2aW9ycyBkb24ndCBcImZpZ2h0XCIgaWYgbXVsdGlwbGUgcG9pbnRlcnMgYXJlIGRvd24uXHJcbiAgICAgIGNvbnN0IGFjdGl2ZUxpc3RlbmVyID0gdGhpcy5fYXR0YWNoZWRQb2ludGVyc1sgMCBdLmF0dGFjaGVkTGlzdGVuZXIhO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhY3RpdmVMaXN0ZW5lciwgJ1RoZSBhdHRhY2hlZCBQb2ludGVyIGlzIGV4cGVjdGVkIHRvIGhhdmUgYW4gYXR0YWNoZWQgbGlzdGVuZXIuJyApO1xyXG5cclxuICAgICAgaWYgKCBhY3RpdmVMaXN0ZW5lci5jcmVhdGVQYW5UYXJnZXRCb3VuZHMgKSB7XHJcblxyXG4gICAgICAgIC8vIGNsaWVudCBoYXMgZGVmaW5lZCB0aGUgQm91bmRzIHRoZXkgd2FudCB0byBrZWVwIGluIHZpZXcgZm9yIHRoaXMgUG9pbnRlciAoaXQgaXMgYXNzaWduZWQgdG8gdGhlXHJcbiAgICAgICAgLy8gUG9pbnRlciB0byBzdXBwb3J0IG11bHRpdG91Y2ggY2FzZXMpXHJcbiAgICAgICAgZ2xvYmFsQm91bmRzVG9WaWV3ID0gYWN0aXZlTGlzdGVuZXIuY3JlYXRlUGFuVGFyZ2V0Qm91bmRzKCk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIGFjdGl2ZUxpc3RlbmVyLmxpc3RlbmVyIGluc3RhbmNlb2YgUHJlc3NMaXN0ZW5lciB8fFxyXG4gICAgICAgICAgICAgICAgYWN0aXZlTGlzdGVuZXIubGlzdGVuZXIgaW5zdGFuY2VvZiBLZXlib2FyZERyYWdMaXN0ZW5lciApIHtcclxuICAgICAgICBjb25zdCBhdHRhY2hlZFByZXNzTGlzdGVuZXIgPSBhY3RpdmVMaXN0ZW5lci5saXN0ZW5lcjtcclxuXHJcbiAgICAgICAgLy8gVGhlIFByZXNzTGlzdGVuZXIgbWlnaHQgbm90IGJlIHByZXNzZWQgYW55bW9yZSBidXQgdGhlIFBvaW50ZXIgaXMgc3RpbGwgZG93biwgaW4gd2hpY2ggY2FzZSBpdFxyXG4gICAgICAgIC8vIGhhcyBiZWVuIGludGVycnVwdGVkIG9yIGNhbmNlbGxlZC5cclxuICAgICAgICAvLyBOT1RFOiBJdCBpcyBwb3NzaWJsZSBJIG5lZWQgdG8gY2FuY2VsUGFuRHVyaW5nRHJhZygpIGlmIGl0IGlzIG5vIGxvbmdlciBwcmVzc2VkLCBidXQgSSBkb24ndFxyXG4gICAgICAgIC8vIHdhbnQgdG8gY2xlYXIgdGhlIHJlZmVyZW5jZSB0byB0aGUgYXR0YWNoZWRMaXN0ZW5lciwgYW5kIEkgd2FudCB0byBzdXBwb3J0IHJlc3VtaW5nIGRyYWcgZHVyaW5nIHRvdWNoLXNuYWcuXHJcbiAgICAgICAgaWYgKCBhdHRhY2hlZFByZXNzTGlzdGVuZXIuaXNQcmVzc2VkICkge1xyXG5cclxuICAgICAgICAgIC8vIHRoaXMgd2lsbCBlaXRoZXIgYmUgdGhlIFByZXNzTGlzdGVuZXIncyB0YXJnZXROb2RlIG9yIHRoZSBkZWZhdWx0IHRhcmdldCBvZiB0aGUgU2NlbmVyeUV2ZW50IG9uIHByZXNzXHJcbiAgICAgICAgICBjb25zdCB0YXJnZXQgPSBhdHRhY2hlZFByZXNzTGlzdGVuZXIuZ2V0Q3VycmVudFRhcmdldCgpO1xyXG5cclxuICAgICAgICAgIC8vIFRPRE86IEZvciBub3cgd2UgY2Fubm90IHN1cHBvcnQgREFHLiBXZSBtYXkgYmUgYWJsZSB0byB1c2UgUHJlc3NMaXN0ZW5lci5wcmVzc2VkVHJhaWwgaW5zdGVhZCBvZiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICAgICAgLy8gZ2V0Q3VycmVudFRhcmdldCwgYW5kIHRoZW4gd2Ugd291bGQgaGF2ZSBhIHVuaXF1ZWx5IGRlZmluZWQgdHJhaWwuIFNlZVxyXG4gICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzEzNjEgYW5kXHJcbiAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTM1NiNpc3N1ZWNvbW1lbnQtMTAzOTY3ODY3OFxyXG4gICAgICAgICAgaWYgKCB0YXJnZXQuaW5zdGFuY2VzLmxlbmd0aCA9PT0gMSApIHtcclxuICAgICAgICAgICAgY29uc3QgdHJhaWwgPSB0YXJnZXQuaW5zdGFuY2VzWyAwIF0udHJhaWwhO1xyXG4gICAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0cmFpbCwgJ1RoZSB0YXJnZXQgc2hvdWxkIGJlIGluIG9uZSBzY2VuZSBncmFwaCBhbmQgaGF2ZSBhbiBpbnN0YW5jZSB3aXRoIGEgdHJhaWwuJyApO1xyXG4gICAgICAgICAgICBnbG9iYWxCb3VuZHNUb1ZpZXcgPSB0cmFpbC5wYXJlbnRUb0dsb2JhbEJvdW5kcyggdGFyZ2V0LnZpc2libGVCb3VuZHMgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZ2xvYmFsQm91bmRzVG9WaWV3O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRHVyaW5nIGEgZHJhZyBvZiBhbm90aGVyIE5vZGUgdGhhdCBpcyBhIGRlc2NlbmRhbnQgb2YgdGhpcyBsaXN0ZW5lcidzIHRhcmdldE5vZGUsIHJlcG9zaXRpb24gaWYgdGhlXHJcbiAgICogbm9kZSBpcyBvdXQgb2YgZHJhZ0JvdW5kcyBzbyB0aGF0IHRoZSBOb2RlIGlzIGFsd2F5cyB3aXRoaW4gcGFuQm91bmRzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgcmVwb3NpdGlvbkR1cmluZ0RyYWcoKTogdm9pZCB7XHJcbiAgICBjb25zdCBnbG9iYWxCb3VuZHMgPSB0aGlzLmdldEdsb2JhbEJvdW5kc1RvVmlld0R1cmluZ0RyYWcoKTtcclxuICAgIGNvbnN0IHRhcmdldE5vZGUgPSB0aGlzLmdldFRhcmdldE5vZGVEdXJpbmdEcmFnKCk7XHJcbiAgICBnbG9iYWxCb3VuZHMgJiYgdGhpcy5rZWVwQm91bmRzSW5WaWV3KCBnbG9iYWxCb3VuZHMsIHRoaXMuX2F0dGFjaGVkUG9pbnRlcnMuc29tZSggcG9pbnRlciA9PiBwb2ludGVyIGluc3RhbmNlb2YgUERPTVBvaW50ZXIgKSwgdGFyZ2V0Tm9kZT8ubGltaXRQYW5EaXJlY3Rpb24gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN0b3AgcGFubmluZyBkdXJpbmcgZHJhZyBieSBjbGVhcmluZyB2YXJpYWJsZXMgdGhhdCBhcmUgc2V0IHRvIGluZGljYXRlIGFuZCBwcm92aWRlIGluZm9ybWF0aW9uIGZvciB0aGlzIHdvcmsuXHJcbiAgICogQHBhcmFtIFtldmVudF0gLSBpZiBub3QgcHJvdmlkZWQgYWxsIGFyZSBwYW5uaW5nIGlzIGNhbmNlbGxlZCBhbmQgd2UgYXNzdW1lIGludGVycnVwdGlvblxyXG4gICAqL1xyXG4gIHByaXZhdGUgY2FuY2VsUGFubmluZ0R1cmluZ0RyYWcoIGV2ZW50PzogU2NlbmVyeUV2ZW50ICk6IHZvaWQge1xyXG5cclxuICAgIGlmICggZXZlbnQgKSB7XHJcblxyXG4gICAgICAvLyByZW1vdmUgdGhlIGF0dGFjaGVkUG9pbnRlciBhc3NvY2lhdGVkIHdpdGggdGhlIGV2ZW50XHJcbiAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fYXR0YWNoZWRQb2ludGVycy5pbmRleE9mKCBldmVudC5wb2ludGVyICk7XHJcbiAgICAgIGlmICggaW5kZXggPiAtMSApIHtcclxuICAgICAgICB0aGlzLl9hdHRhY2hlZFBvaW50ZXJzLnNwbGljZSggaW5kZXgsIDEgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcblxyXG4gICAgICAvLyBUaGVyZSBpcyBubyBTY2VuZXJ5RXZlbnQsIHdlIG11c3QgYmUgaW50ZXJydXB0aW5nIC0gY2xlYXIgYWxsIGF0dGFjaGVkUG9pbnRlcnNcclxuICAgICAgdGhpcy5fYXR0YWNoZWRQb2ludGVycyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENsZWFyIGZsYWcgaW5kaWNhdGluZyB3ZSBhcmUgXCJkcmFnZ2luZyBpbiBib3VuZHNcIiBuZXh0IG1vdmVcclxuICAgIHRoaXMuX2RyYWdnaW5nSW5EcmFnQm91bmRzID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTY2VuZXJ5IGxpc3RlbmVyIEFQSS4gQ2FuY2VsIGFueSBkcmFnIGFuZCBwYW4gYmVoYXZpb3IgZm9yIHRoZSBQb2ludGVyIG9uIHRoZSBldmVudC5cclxuICAgKlxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyB1cCggZXZlbnQ6IFNjZW5lcnlFdmVudCApOiB2b2lkIHtcclxuICAgIHRoaXMuY2FuY2VsUGFubmluZ0R1cmluZ0RyYWcoIGV2ZW50ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbnB1dCBsaXN0ZW5lciBmb3IgdGhlICd3aGVlbCcgZXZlbnQsIHBhcnQgb2YgdGhlIFNjZW5lcnkgSW5wdXQgQVBJLlxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyB3aGVlbCggZXZlbnQ6IFNjZW5lcnlFdmVudCApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciggJ011bHRpTGlzdGVuZXIgd2hlZWwnICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICAvLyBjYW5ub3QgcmVwb3NpdGlvbiBpZiBhIGRyYWdnaW5nIHdpdGggbWlkZGxlIG1vdXNlIGJ1dHRvbiAtIGJ1dCB3aGVlbCB6b29tIHNob3VsZCBub3QgY2FuY2VsIGEgbWlkZGxlIHByZXNzXHJcbiAgICAvLyAoYmVoYXZpb3IgY29waWVkIGZyb20gb3RoZXIgYnJvd3NlcnMpXHJcbiAgICBpZiAoICF0aGlzLm1pZGRsZVByZXNzICkge1xyXG4gICAgICBjb25zdCB3aGVlbCA9IG5ldyBXaGVlbCggZXZlbnQsIHRoaXMuX3RhcmdldFNjYWxlICk7XHJcbiAgICAgIHRoaXMucmVwb3NpdGlvbkZyb21XaGVlbCggd2hlZWwsIGV2ZW50ICk7XHJcbiAgICB9XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEtleWRvd24gbGlzdGVuZXIgZm9yIGV2ZW50cyBvdXRzaWRlIG9mIHRoZSBQRE9NLiBBdHRhY2hlZCBhcyBhIGxpc3RlbmVyIHRvIHRoZSBib2R5IGFuZCBkcml2ZW4gYnlcclxuICAgKiBFdmVudHMgcmF0aGVyIHRoYW4gU2NlbmVyeUV2ZW50cy4gV2hlbiB3ZSBoYW5kbGUgRXZlbnRzIGZyb20gd2l0aGluIHRoZSBQRE9NIHdlIG5lZWQgdGhlIFBvaW50ZXIgdG9cclxuICAgKiBkZXRlcm1pbmUgaWYgYXR0YWNoZWQuIEJ1dCBmcm9tIG91dHNpZGUgb2YgdGhlIFBET00gd2Uga25vdyB0aGF0IHRoZXJlIGlzIG5vIGZvY3VzIGluIHRoZSBkb2N1bWVudCBhbmQgdGhlcmZvcmVcclxuICAgKiB0aGUgUERPTVBvaW50ZXIgaXMgbm90IGF0dGFjaGVkLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgd2luZG93S2V5ZG93biggZG9tRXZlbnQ6IEV2ZW50ICk6IHZvaWQge1xyXG5cclxuICAgIC8vIG9uIGFueSBrZXlib2FyZCByZXBvc2l0aW9uIGludGVycnVwdCB0aGUgbWlkZGxlIHByZXNzIHBhbm5pbmdcclxuICAgIHRoaXMuY2FuY2VsTWlkZGxlUHJlc3MoKTtcclxuXHJcbiAgICBjb25zdCBzaW1HbG9iYWwgPSBfLmdldCggd2luZG93LCAncGhldC5qb2lzdC5zaW0nLCBudWxsICk7IC8vIHJldHVybnMgbnVsbCBpZiBnbG9iYWwgaXNuJ3QgZm91bmRcclxuXHJcbiAgICBpZiAoICFzaW1HbG9iYWwgfHwgIXNpbUdsb2JhbC5kaXNwbGF5Ll9hY2Nlc3NpYmxlIHx8XHJcbiAgICAgICAgICFzaW1HbG9iYWwuZGlzcGxheS5wZG9tUm9vdEVsZW1lbnQuY29udGFpbnMoIGRvbUV2ZW50LnRhcmdldCApICkge1xyXG4gICAgICB0aGlzLmhhbmRsZVpvb21Db21tYW5kcyggZG9tRXZlbnQgKTtcclxuXHJcbiAgICAgIC8vIGhhbmRsZSB0cmFuc2xhdGlvbiB3aXRob3V0IHdvcnJ5IG9mIHRoZSBwb2ludGVyIGJlaW5nIGF0dGFjaGVkIGJlY2F1c2UgdGhlcmUgaXMgbm8gcG9pbnRlciBhdCB0aGlzIGxldmVsXHJcbiAgICAgIGlmICggS2V5Ym9hcmRVdGlscy5pc0Fycm93S2V5KCBkb21FdmVudCApICkge1xyXG4gICAgICAgIGNvbnN0IGtleVByZXNzID0gbmV3IEtleVByZXNzKCBnbG9iYWxLZXlTdGF0ZVRyYWNrZXIsIHRoaXMuZ2V0Q3VycmVudFNjYWxlKCksIHRoaXMuX3RhcmdldFNjYWxlICk7XHJcbiAgICAgICAgdGhpcy5yZXBvc2l0aW9uRnJvbUtleXMoIGtleVByZXNzICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZvciB0aGUgU2NlbmVyeSBsaXN0ZW5lciBBUEksIGhhbmRsZSBhIGtleWRvd24gZXZlbnQuIFRoaXMgU2NlbmVyeUV2ZW50IHdpbGwgaGF2ZSBiZWVuIGRpc3BhdGNoZWQgZnJvbVxyXG4gICAqIElucHV0LmRpc3BhdGNoRXZlbnQgYW5kIHNvIHRoZSBFdmVudCB0YXJnZXQgbXVzdCBiZSB3aXRoaW4gdGhlIFBET00uIEluIHRoaXMgY2FzZSwgd2UgbWF5XHJcbiAgICogbmVlZCB0byBwcmV2ZW50IHRyYW5zbGF0aW9uIGlmIHRoZSBQRE9NUG9pbnRlciBpcyBhdHRhY2hlZC5cclxuICAgKlxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBrZXlkb3duKCBldmVudDogU2NlbmVyeUV2ZW50ICk6IHZvaWQge1xyXG4gICAgY29uc3QgZG9tRXZlbnQgPSBldmVudC5kb21FdmVudCE7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBkb21FdmVudCBpbnN0YW5jZW9mIEtleWJvYXJkRXZlbnQsICdrZXlkb3duIGV2ZW50IG11c3QgYmUgYSBLZXlib2FyZEV2ZW50JyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNpbXBsZS10eXBlLWNoZWNraW5nLWFzc2VydGlvbnNcclxuXHJcbiAgICAvLyBvbiBhbnkga2V5Ym9hcmQgcmVwb3NpdGlvbiBpbnRlcnJ1cHQgdGhlIG1pZGRsZSBwcmVzcyBwYW5uaW5nXHJcbiAgICB0aGlzLmNhbmNlbE1pZGRsZVByZXNzKCk7XHJcblxyXG4gICAgLy8gaGFuZGxlIHpvb21cclxuICAgIHRoaXMuaGFuZGxlWm9vbUNvbW1hbmRzKCBkb21FdmVudCApO1xyXG5cclxuICAgIGNvbnN0IGtleWJvYXJkRHJhZ0ludGVudCA9IGV2ZW50LnBvaW50ZXIuaGFzSW50ZW50KCBJbnRlbnQuS0VZQk9BUkRfRFJBRyApO1xyXG5cclxuICAgIC8vIGhhbmRsZSB0cmFuc2xhdGlvblxyXG4gICAgaWYgKCBLZXlib2FyZFV0aWxzLmlzQXJyb3dLZXkoIGRvbUV2ZW50ICkgKSB7XHJcblxyXG4gICAgICBpZiAoICFrZXlib2FyZERyYWdJbnRlbnQgKSB7XHJcbiAgICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyKCAnTXVsdGlMaXN0ZW5lciBoYW5kbGUgYXJyb3cga2V5IGRvd24nICk7XHJcbiAgICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGtleVByZXNzID0gbmV3IEtleVByZXNzKCBnbG9iYWxLZXlTdGF0ZVRyYWNrZXIsIHRoaXMuZ2V0Q3VycmVudFNjYWxlKCksIHRoaXMuX3RhcmdldFNjYWxlICk7XHJcbiAgICAgICAgdGhpcy5yZXBvc2l0aW9uRnJvbUtleXMoIGtleVByZXNzICk7XHJcblxyXG4gICAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZSBhIGNoYW5nZSBvZiBmb2N1cyBieSBpbW1lZGlhdGVseSBwYW5uaW5nIHNvIHRoYXQgdGhlIGZvY3VzZWQgTm9kZSBpcyBpbiB2aWV3LiBBbHNvIHNldHMgdXAgdGhlXHJcbiAgICogVHJhbnNmb3JtVHJhY2tlciB3aGljaCB3aWxsIGF1dG9tYXRpY2FsbHkga2VlcCB0aGUgdGFyZ2V0IGluIHRoZSB2aWV3cG9ydCBhcyBpdCBpcyBhbmltYXRlcywgYW5kIGEgbGlzdGVuZXJcclxuICAgKiBvbiB0aGUgZm9jdXNQYW5UYXJnZXRCb3VuZHNQcm9wZXJ0eSAoaWYgcHJvdmlkZWQpIHRvIGhhbmRsZSBOb2RlIG90aGVyIHNpemUgb3IgY3VzdG9tIGNoYW5nZXMuXHJcbiAgICovXHJcbiAgcHVibGljIGhhbmRsZUZvY3VzQ2hhbmdlKCBmb2N1czogRm9jdXMgfCBudWxsLCBwcmV2aW91c0ZvY3VzOiBGb2N1cyB8IG51bGwgKTogdm9pZCB7XHJcblxyXG4gICAgLy8gUmVtb3ZlIGxpc3RlbmVycyBvbiB0aGUgcHJldmlvdXMgZm9jdXMgd2F0Y2hpbmcgdHJhbnNmb3JtIGFuZCBib3VuZHMgY2hhbmdlc1xyXG4gICAgaWYgKCB0aGlzLl90cmFuc2Zvcm1UcmFja2VyICkge1xyXG4gICAgICB0aGlzLl90cmFuc2Zvcm1UcmFja2VyLmRpc3Bvc2UoKTtcclxuICAgICAgdGhpcy5fdHJhbnNmb3JtVHJhY2tlciA9IG51bGw7XHJcbiAgICB9XHJcbiAgICBpZiAoIHByZXZpb3VzRm9jdXMgJiYgcHJldmlvdXNGb2N1cy50cmFpbC5sYXN0Tm9kZSgpICYmIHByZXZpb3VzRm9jdXMudHJhaWwubGFzdE5vZGUoKS5mb2N1c1BhblRhcmdldEJvdW5kc1Byb3BlcnR5ICkge1xyXG4gICAgICBjb25zdCBwcmV2aW91c0JvdW5kc1Byb3BlcnR5ID0gcHJldmlvdXNGb2N1cy50cmFpbC5sYXN0Tm9kZSgpLmZvY3VzUGFuVGFyZ2V0Qm91bmRzUHJvcGVydHkhO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9mb2N1c0JvdW5kc0xpc3RlbmVyICYmIHByZXZpb3VzQm91bmRzUHJvcGVydHkuaGFzTGlzdGVuZXIoIHRoaXMuX2ZvY3VzQm91bmRzTGlzdGVuZXIgKSxcclxuICAgICAgICAnRm9jdXMgYm91bmRzIGxpc3RlbmVyIHNob3VsZCBiZSBsaW5rZWQgdG8gdGhlIHByZXZpb3VzIE5vZGUnXHJcbiAgICAgICk7XHJcbiAgICAgIHByZXZpb3VzQm91bmRzUHJvcGVydHkudW5saW5rKCB0aGlzLl9mb2N1c0JvdW5kc0xpc3RlbmVyISApO1xyXG4gICAgICB0aGlzLl9mb2N1c0JvdW5kc0xpc3RlbmVyID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIGZvY3VzICkge1xyXG4gICAgICBjb25zdCBsYXN0Tm9kZSA9IGZvY3VzLnRyYWlsLmxhc3ROb2RlKCk7XHJcblxyXG4gICAgICBsZXQgdHJhaWxUb1RyYWNrID0gZm9jdXMudHJhaWw7XHJcbiAgICAgIGlmICggZm9jdXMudHJhaWwuY29udGFpbnNOb2RlKCB0aGlzLl90YXJnZXROb2RlICkgKSB7XHJcblxyXG4gICAgICAgIC8vIFRyYWNrIHRyYW5zZm9ybXMgdG8gdGhlIGZvY3VzZWQgTm9kZSwgYnV0IGV4Y2x1ZGUgdGhlIHRhcmdldE5vZGUgc28gdGhhdCByZXBvc2l0aW9ucyBkdXJpbmcgcGFuIGRvbid0XHJcbiAgICAgICAgLy8gdHJpZ2dlciBhbm90aGVyIHRyYW5zZm9ybSB1cGRhdGUuXHJcbiAgICAgICAgY29uc3QgaW5kZXhPZlRhcmdldCA9IGZvY3VzLnRyYWlsLm5vZGVzLmluZGV4T2YoIHRoaXMuX3RhcmdldE5vZGUgKTtcclxuICAgICAgICBjb25zdCBpbmRleE9mTGVhZiA9IGZvY3VzLnRyYWlsLm5vZGVzLmxlbmd0aDsgLy8gZW5kIG9mIHNsaWNlIGlzIG5vdCBpbmNsdWRlZFxyXG4gICAgICAgIHRyYWlsVG9UcmFjayA9IGZvY3VzLnRyYWlsLnNsaWNlKCBpbmRleE9mVGFyZ2V0LCBpbmRleE9mTGVhZiApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLl90cmFuc2Zvcm1UcmFja2VyID0gbmV3IFRyYW5zZm9ybVRyYWNrZXIoIHRyYWlsVG9UcmFjayApO1xyXG5cclxuICAgICAgY29uc3QgZm9jdXNNb3ZlbWVudExpc3RlbmVyID0gKCkgPT4ge1xyXG4gICAgICAgIGlmICggdGhpcy5nZXRDdXJyZW50U2NhbGUoKSA+IDEgKSB7XHJcblxyXG4gICAgICAgICAgbGV0IGdsb2JhbEJvdW5kczogQm91bmRzMjtcclxuICAgICAgICAgIGlmICggbGFzdE5vZGUuZm9jdXNQYW5UYXJnZXRCb3VuZHNQcm9wZXJ0eSApIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFRoaXMgTm9kZSBoYXMgYSBjdXN0b20gYm91bmRzIGFyZWEgdGhhdCB3ZSBuZWVkIHRvIGtlZXAgaW4gdmlld1xyXG4gICAgICAgICAgICBjb25zdCBsb2NhbEJvdW5kcyA9IGxhc3ROb2RlLmZvY3VzUGFuVGFyZ2V0Qm91bmRzUHJvcGVydHkudmFsdWU7XHJcbiAgICAgICAgICAgIGdsb2JhbEJvdW5kcyA9IGZvY3VzLnRyYWlsLmxvY2FsVG9HbG9iYWxCb3VuZHMoIGxvY2FsQm91bmRzICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGJ5IGRlZmF1bHQsIHVzZSB0aGUgZ2xvYmFsIGJvdW5kcyBvZiB0aGUgTm9kZSAtIG5vdGUgdGhpcyBpcyB0aGUgZnVsbCBUcmFpbCB0byB0aGUgZm9jdXNlZCBOb2RlLFxyXG4gICAgICAgICAgICAvLyBub3QgdGhlIHN1YnRyYWlsIHVzZWQgYnkgVHJhbnNmb3JtVHJhY2tlclxyXG4gICAgICAgICAgICBnbG9iYWxCb3VuZHMgPSBmb2N1cy50cmFpbC5sb2NhbFRvR2xvYmFsQm91bmRzKCBmb2N1cy50cmFpbC5sYXN0Tm9kZSgpLmxvY2FsQm91bmRzICk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdGhpcy5rZWVwQm91bmRzSW5WaWV3KCBnbG9iYWxCb3VuZHMsIHRydWUsIGxhc3ROb2RlLmxpbWl0UGFuRGlyZWN0aW9uICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgLy8gb2JzZXJ2ZSBjaGFuZ2VzIHRvIHRoZSB0cmFuc2Zvcm1cclxuICAgICAgdGhpcy5fdHJhbnNmb3JtVHJhY2tlci5hZGRMaXN0ZW5lciggZm9jdXNNb3ZlbWVudExpc3RlbmVyICk7XHJcblxyXG4gICAgICAvLyBvYnNlcnZlIGNoYW5nZXMgb24gdGhlIGNsaWVudC1wcm92aWRlZCBsb2NhbCBib3VuZHNcclxuICAgICAgaWYgKCBsYXN0Tm9kZS5mb2N1c1BhblRhcmdldEJvdW5kc1Byb3BlcnR5ICkge1xyXG4gICAgICAgIHRoaXMuX2ZvY3VzQm91bmRzTGlzdGVuZXIgPSBmb2N1c01vdmVtZW50TGlzdGVuZXI7XHJcbiAgICAgICAgbGFzdE5vZGUuZm9jdXNQYW5UYXJnZXRCb3VuZHNQcm9wZXJ0eS5saW5rKCB0aGlzLl9mb2N1c0JvdW5kc0xpc3RlbmVyICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFBhbiB0byB0aGUgZm9jdXMgdHJhaWwgcmlnaHQgYXdheSBpZiBpdCBpcyBvZmYtc2NyZWVuXHJcbiAgICAgIHRoaXMua2VlcFRyYWlsSW5WaWV3KCBmb2N1cy50cmFpbCwgbGFzdE5vZGUubGltaXRQYW5EaXJlY3Rpb24gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZSB6b29tIGNvbW1hbmRzIGZyb20gYSBrZXlib2FyZC5cclxuICAgKi9cclxuICBwdWJsaWMgaGFuZGxlWm9vbUNvbW1hbmRzKCBkb21FdmVudDogRXZlbnQgKTogdm9pZCB7XHJcblxyXG4gICAgLy8gaGFuZGxlIHpvb20gLSBTYWZhcmkgZG9lc24ndCByZWNlaXZlIHRoZSBrZXl1cCBldmVudCB3aGVuIHRoZSBtZXRhIGtleSBpcyBwcmVzc2VkIHNvIHdlIGNhbm5vdCB1c2VcclxuICAgIC8vIHRoZSBrZXlTdGF0ZVRyYWNrZXIgdG8gZGV0ZXJtaW5lIGlmIHpvb20ga2V5cyBhcmUgZG93blxyXG4gICAgY29uc3Qgem9vbUluQ29tbWFuZERvd24gPSBLZXlib2FyZFpvb21VdGlscy5pc1pvb21Db21tYW5kKCBkb21FdmVudCwgdHJ1ZSApO1xyXG4gICAgY29uc3Qgem9vbU91dENvbW1hbmREb3duID0gS2V5Ym9hcmRab29tVXRpbHMuaXNab29tQ29tbWFuZCggZG9tRXZlbnQsIGZhbHNlICk7XHJcblxyXG4gICAgaWYgKCB6b29tSW5Db21tYW5kRG93biB8fCB6b29tT3V0Q29tbWFuZERvd24gKSB7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciggJ011bHRpUGFuWm9vbUxpc3RlbmVyIGtleWJvYXJkIHpvb20gaW4nICk7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgICAgLy8gZG9uJ3QgYWxsb3cgbmF0aXZlIGJyb3dzZXIgem9vbVxyXG4gICAgICBkb21FdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgY29uc3QgbmV4dFNjYWxlID0gdGhpcy5nZXROZXh0RGlzY3JldGVTY2FsZSggem9vbUluQ29tbWFuZERvd24gKTtcclxuICAgICAgY29uc3Qga2V5UHJlc3MgPSBuZXcgS2V5UHJlc3MoIGdsb2JhbEtleVN0YXRlVHJhY2tlciwgbmV4dFNjYWxlLCB0aGlzLl90YXJnZXRTY2FsZSApO1xyXG4gICAgICB0aGlzLnJlcG9zaXRpb25Gcm9tS2V5cygga2V5UHJlc3MgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBLZXlib2FyZFpvb21VdGlscy5pc1pvb21SZXNldENvbW1hbmQoIGRvbUV2ZW50ICkgKSB7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciggJ011bHRpTGlzdGVuZXIga2V5Ym9hcmQgcmVzZXQnICk7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgICAgLy8gdGhpcyBpcyBhIG5hdGl2ZSBjb21tYW5kLCBidXQgd2UgYXJlIHRha2luZyBvdmVyXHJcbiAgICAgIGRvbUV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgIHRoaXMucmVzZXRUcmFuc2Zvcm0oKTtcclxuXHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGlzIGlzIGp1c3QgZm9yIG1hY09TIFNhZmFyaS4gUmVzcG9uZHMgdG8gdHJhY2twYWQgaW5wdXQuIFByZXZlbnRzIGRlZmF1bHQgYnJvd3NlciBiZWhhdmlvciBhbmQgc2V0cyB2YWx1ZXNcclxuICAgKiByZXF1aXJlZCBmb3IgcmVwb3NpdGlvbmluZyBhcyB1c2VyIG9wZXJhdGVzIHRoZSB0cmFjayBwYWQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBoYW5kbGVHZXN0dXJlU3RhcnRFdmVudCggZG9tRXZlbnQ6IEdlc3R1cmVFdmVudCApOiB2b2lkIHtcclxuICAgIHRoaXMuZ2VzdHVyZVN0YXJ0QWN0aW9uLmV4ZWN1dGUoIGRvbUV2ZW50ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGlzIGlzIGp1c3QgZm9yIG1hY09TIFNhZmFyaS4gUmVzcG9uZHMgdG8gdHJhY2twYWQgaW5wdXQuIFByZXZlbmRzIGRlZmF1bHQgYnJvd3NlciBiZWhhdmlvciBhbmRcclxuICAgKiBzZXRzIGRlc3RpbmF0aW9uIHNjYWxlIGFzIHVzZXIgcGluY2hlcyBvbiB0aGUgdHJhY2twYWQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBoYW5kbGVHZXN0dXJlQ2hhbmdlRXZlbnQoIGRvbUV2ZW50OiBHZXN0dXJlRXZlbnQgKTogdm9pZCB7XHJcbiAgICB0aGlzLmdlc3R1cmVDaGFuZ2VBY3Rpb24uZXhlY3V0ZSggZG9tRXZlbnQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZSB0aGUgZG93biBNaWRkbGVQcmVzcyBkdXJpbmcgYW5pbWF0aW9uLiBJZiB3ZSBoYXZlIGEgbWlkZGxlIHByZXNzIHdlIG5lZWQgdG8gdXBkYXRlIHBvc2l0aW9uIHRhcmdldC5cclxuICAgKi9cclxuICBwcml2YXRlIGhhbmRsZU1pZGRsZVByZXNzKCBkdDogbnVtYmVyICk6IHZvaWQge1xyXG4gICAgY29uc3QgbWlkZGxlUHJlc3MgPSB0aGlzLm1pZGRsZVByZXNzITtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG1pZGRsZVByZXNzLCAnTWlkZGxlUHJlc3MgbXVzdCBiZSBkZWZpbmVkIHRvIGhhbmRsZScgKTtcclxuXHJcbiAgICBjb25zdCBzb3VyY2VQb3NpdGlvbiA9IHRoaXMuc291cmNlUG9zaXRpb24hO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggc291cmNlUG9zaXRpb24sICdzb3VyY2VQb3NpdGlvbiBtdXN0IGJlIGRlZmluZWQgdG8gaGFuZGxlIG1pZGRsZSBwcmVzcywgYmUgc3VyZSB0byBjYWxsIGluaXRpYWxpemVQb3NpdGlvbnMnICk7XHJcblxyXG4gICAgaWYgKCBkdCA+IDAgKSB7XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRQb2ludCA9IG1pZGRsZVByZXNzLnBvaW50ZXIucG9pbnQ7XHJcbiAgICAgIGNvbnN0IGdsb2JhbERlbHRhID0gY3VycmVudFBvaW50Lm1pbnVzKCBtaWRkbGVQcmVzcy5pbml0aWFsUG9pbnQgKTtcclxuXHJcbiAgICAgIC8vIG1hZ25pdHVkZSBhbG9uZSBpcyB0b28gZmFzdCwgcmVkdWNlIGJ5IGEgYml0XHJcbiAgICAgIGNvbnN0IHJlZHVjZWRNYWduaXR1ZGUgPSBnbG9iYWxEZWx0YS5tYWduaXR1ZGUgLyAxMDA7XHJcbiAgICAgIGlmICggcmVkdWNlZE1hZ25pdHVkZSA+IDAgKSB7XHJcblxyXG4gICAgICAgIC8vIHNldCB0aGUgZGVsdGEgdmVjdG9yIGluIGdsb2JhbCBjb29yZGluYXRlcywgbGltaXRlZCBieSBhIG1heGltdW0gdmlldyBjb29yZHMvc2Vjb25kIHZlbG9jaXR5LCBjb3JyZWN0ZWRcclxuICAgICAgICAvLyBmb3IgYW55IHJlcHJlc2VudGF0aXZlIHRhcmdldCBzY2FsZVxyXG4gICAgICAgIGdsb2JhbERlbHRhLnNldE1hZ25pdHVkZSggTWF0aC5taW4oIHJlZHVjZWRNYWduaXR1ZGUgLyBkdCwgTUFYX1NDUk9MTF9WRUxPQ0lUWSAqIHRoaXMuX3RhcmdldFNjYWxlICkgKTtcclxuICAgICAgICB0aGlzLnNldERlc3RpbmF0aW9uUG9zaXRpb24oIHNvdXJjZVBvc2l0aW9uLnBsdXMoIGdsb2JhbERlbHRhICkgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJhbnNsYXRlIGFuZCBzY2FsZSB0byBhIHRhcmdldCBwb2ludC4gVGhlIHJlc3VsdCBvZiB0aGlzIGZ1bmN0aW9uIHNob3VsZCBtYWtlIGl0IGFwcGVhciB0aGF0IHdlIGFyZSBzY2FsaW5nXHJcbiAgICogaW4gb3Igb3V0IG9mIGEgcGFydGljdWxhciBwb2ludCBvbiB0aGUgdGFyZ2V0IG5vZGUuIFRoaXMgYWN0dWFsbHkgbW9kaWZpZXMgdGhlIG1hdHJpeCBvZiB0aGUgdGFyZ2V0IG5vZGUuIFRvXHJcbiAgICogYWNjb21wbGlzaCB6b29taW5nIGludG8gYSBwYXJ0aWN1bGFyIHBvaW50LCB3ZSBjb21wdXRlIGEgbWF0cml4IHRoYXQgd291bGQgdHJhbnNmb3JtIHRoZSB0YXJnZXQgbm9kZSBmcm9tXHJcbiAgICogdGhlIHRhcmdldCBwb2ludCwgdGhlbiBhcHBseSBzY2FsZSwgdGhlbiB0cmFuc2xhdGUgdGhlIHRhcmdldCBiYWNrIHRvIHRoZSB0YXJnZXQgcG9pbnQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gZ2xvYmFsUG9pbnQgLSBwb2ludCB0byB6b29tIGluIG9uLCBpbiB0aGUgZ2xvYmFsIGNvb3JkaW5hdGUgZnJhbWVcclxuICAgKiBAcGFyYW0gc2NhbGVEZWx0YVxyXG4gICAqL1xyXG4gIHByaXZhdGUgdHJhbnNsYXRlU2NhbGVUb1RhcmdldCggZ2xvYmFsUG9pbnQ6IFZlY3RvcjIsIHNjYWxlRGVsdGE6IG51bWJlciApOiB2b2lkIHtcclxuICAgIGNvbnN0IHBvaW50SW5Mb2NhbEZyYW1lID0gdGhpcy5fdGFyZ2V0Tm9kZS5nbG9iYWxUb0xvY2FsUG9pbnQoIGdsb2JhbFBvaW50ICk7XHJcbiAgICBjb25zdCBwb2ludEluUGFyZW50RnJhbWUgPSB0aGlzLl90YXJnZXROb2RlLmdsb2JhbFRvUGFyZW50UG9pbnQoIGdsb2JhbFBvaW50ICk7XHJcblxyXG4gICAgY29uc3QgZnJvbUxvY2FsUG9pbnQgPSBNYXRyaXgzLnRyYW5zbGF0aW9uKCAtcG9pbnRJbkxvY2FsRnJhbWUueCwgLXBvaW50SW5Mb2NhbEZyYW1lLnkgKTtcclxuICAgIGNvbnN0IHRvVGFyZ2V0UG9pbnQgPSBNYXRyaXgzLnRyYW5zbGF0aW9uKCBwb2ludEluUGFyZW50RnJhbWUueCwgcG9pbnRJblBhcmVudEZyYW1lLnkgKTtcclxuXHJcbiAgICBjb25zdCBuZXh0U2NhbGUgPSB0aGlzLmxpbWl0U2NhbGUoIHRoaXMuZ2V0Q3VycmVudFNjYWxlKCkgKyBzY2FsZURlbHRhICk7XHJcblxyXG4gICAgLy8gd2UgZmlyc3QgdHJhbnNsYXRlIGZyb20gdGFyZ2V0IHBvaW50LCB0aGVuIGFwcGx5IHNjYWxlLCB0aGVuIHRyYW5zbGF0ZSBiYWNrIHRvIHRhcmdldCBwb2ludCAoKVxyXG4gICAgLy8gc28gdGhhdCBpdCBhcHBlYXJzIGFzIHRob3VnaCB3ZSBhcmUgem9vbWluZyBpbnRvIHRoYXQgcG9pbnRcclxuICAgIGNvbnN0IHNjYWxlTWF0cml4ID0gdG9UYXJnZXRQb2ludC50aW1lc01hdHJpeCggTWF0cml4My5zY2FsaW5nKCBuZXh0U2NhbGUgKSApLnRpbWVzTWF0cml4KCBmcm9tTG9jYWxQb2ludCApO1xyXG4gICAgdGhpcy5tYXRyaXhQcm9wZXJ0eS5zZXQoIHNjYWxlTWF0cml4ICk7XHJcblxyXG4gICAgLy8gbWFrZSBzdXJlIHRoYXQgd2UgYXJlIHN0aWxsIHdpdGhpbiBQYW5ab29tTGlzdGVuZXIgY29uc3RyYWludHNcclxuICAgIHRoaXMuY29ycmVjdFJlcG9zaXRpb24oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHRyYW5zbGF0aW9uIGFuZCBzY2FsZSB0byBhIHRhcmdldCBwb2ludC4gTGlrZSB0cmFuc2xhdGVTY2FsZVRvVGFyZ2V0LCBidXQgaW5zdGVhZCBvZiB0YWtpbmcgYSBzY2FsZURlbHRhXHJcbiAgICogaXQgdGFrZXMgdGhlIGZpbmFsIHNjYWxlIHRvIGJlIHVzZWQgZm9yIHRoZSB0YXJnZXQgTm9kZXMgbWF0cml4LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGdsb2JhbFBvaW50IC0gcG9pbnQgdG8gdHJhbnNsYXRlIHRvIGluIHRoZSBnbG9iYWwgY29vcmRpbmF0ZSBmcmFtZVxyXG4gICAqIEBwYXJhbSBzY2FsZSAtIGZpbmFsIHNjYWxlIGZvciB0aGUgdHJhbnNmb3JtYXRpb24gbWF0cml4XHJcbiAgICovXHJcbiAgcHJpdmF0ZSBzZXRUcmFuc2xhdGlvblNjYWxlVG9UYXJnZXQoIGdsb2JhbFBvaW50OiBWZWN0b3IyLCBzY2FsZTogbnVtYmVyICk6IHZvaWQge1xyXG4gICAgY29uc3QgcG9pbnRJbkxvY2FsRnJhbWUgPSB0aGlzLl90YXJnZXROb2RlLmdsb2JhbFRvTG9jYWxQb2ludCggZ2xvYmFsUG9pbnQgKTtcclxuICAgIGNvbnN0IHBvaW50SW5QYXJlbnRGcmFtZSA9IHRoaXMuX3RhcmdldE5vZGUuZ2xvYmFsVG9QYXJlbnRQb2ludCggZ2xvYmFsUG9pbnQgKTtcclxuXHJcbiAgICBjb25zdCBmcm9tTG9jYWxQb2ludCA9IE1hdHJpeDMudHJhbnNsYXRpb24oIC1wb2ludEluTG9jYWxGcmFtZS54LCAtcG9pbnRJbkxvY2FsRnJhbWUueSApO1xyXG4gICAgY29uc3QgdG9UYXJnZXRQb2ludCA9IE1hdHJpeDMudHJhbnNsYXRpb24oIHBvaW50SW5QYXJlbnRGcmFtZS54LCBwb2ludEluUGFyZW50RnJhbWUueSApO1xyXG5cclxuICAgIGNvbnN0IG5leHRTY2FsZSA9IHRoaXMubGltaXRTY2FsZSggc2NhbGUgKTtcclxuXHJcbiAgICAvLyB3ZSBmaXJzdCB0cmFuc2xhdGUgZnJvbSB0YXJnZXQgcG9pbnQsIHRoZW4gYXBwbHkgc2NhbGUsIHRoZW4gdHJhbnNsYXRlIGJhY2sgdG8gdGFyZ2V0IHBvaW50ICgpXHJcbiAgICAvLyBzbyB0aGF0IGl0IGFwcGVhcnMgYXMgdGhvdWdoIHdlIGFyZSB6b29taW5nIGludG8gdGhhdCBwb2ludFxyXG4gICAgY29uc3Qgc2NhbGVNYXRyaXggPSB0b1RhcmdldFBvaW50LnRpbWVzTWF0cml4KCBNYXRyaXgzLnNjYWxpbmcoIG5leHRTY2FsZSApICkudGltZXNNYXRyaXgoIGZyb21Mb2NhbFBvaW50ICk7XHJcbiAgICB0aGlzLm1hdHJpeFByb3BlcnR5LnNldCggc2NhbGVNYXRyaXggKTtcclxuXHJcbiAgICAvLyBtYWtlIHN1cmUgdGhhdCB3ZSBhcmUgc3RpbGwgd2l0aGluIFBhblpvb21MaXN0ZW5lciBjb25zdHJhaW50c1xyXG4gICAgdGhpcy5jb3JyZWN0UmVwb3NpdGlvbigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJhbnNsYXRlIHRoZSB0YXJnZXQgbm9kZSBpbiBhIGRpcmVjdGlvbiBzcGVjaWZpZWQgYnkgZGVsdGFWZWN0b3IuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSB0cmFuc2xhdGVEZWx0YSggZGVsdGFWZWN0b3I6IFZlY3RvcjIgKTogdm9pZCB7XHJcbiAgICBjb25zdCB0YXJnZXRQb2ludCA9IHRoaXMuX3RhcmdldE5vZGUuZ2xvYmFsVG9QYXJlbnRQb2ludCggdGhpcy5fcGFuQm91bmRzLmNlbnRlciApO1xyXG4gICAgY29uc3Qgc291cmNlUG9pbnQgPSB0YXJnZXRQb2ludC5wbHVzKCBkZWx0YVZlY3RvciApO1xyXG4gICAgdGhpcy50cmFuc2xhdGVUb1RhcmdldCggc291cmNlUG9pbnQsIHRhcmdldFBvaW50ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmFuc2xhdGUgdGhlIHRhcmdldE5vZGUgZnJvbSBhIGxvY2FsIHBvaW50IHRvIGEgdGFyZ2V0IHBvaW50LiBCb3RoIHBvaW50cyBzaG91bGQgYmUgaW4gdGhlIGdsb2JhbCBjb29yZGluYXRlXHJcbiAgICogZnJhbWUuXHJcbiAgICogQHBhcmFtIGluaXRpYWxQb2ludCAtIGluIGdsb2JhbCBjb29yZGluYXRlIGZyYW1lLCBzb3VyY2UgcG9zaXRpb25cclxuICAgKiBAcGFyYW0gdGFyZ2V0UG9pbnQgLSBpbiBnbG9iYWwgY29vcmRpbmF0ZSBmcmFtZSwgdGFyZ2V0IHBvc2l0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHRyYW5zbGF0ZVRvVGFyZ2V0KCBpbml0aWFsUG9pbnQ6IFZlY3RvcjIsIHRhcmdldFBvaW50OiBWZWN0b3IyICk6IHZvaWQge1xyXG5cclxuICAgIGNvbnN0IHNpbmdsZUluaXRpYWxQb2ludCA9IHRoaXMuX3RhcmdldE5vZGUuZ2xvYmFsVG9QYXJlbnRQb2ludCggaW5pdGlhbFBvaW50ICk7XHJcbiAgICBjb25zdCBzaW5nbGVUYXJnZXRQb2ludCA9IHRoaXMuX3RhcmdldE5vZGUuZ2xvYmFsVG9QYXJlbnRQb2ludCggdGFyZ2V0UG9pbnQgKTtcclxuICAgIGNvbnN0IGRlbHRhID0gc2luZ2xlVGFyZ2V0UG9pbnQubWludXMoIHNpbmdsZUluaXRpYWxQb2ludCApO1xyXG4gICAgdGhpcy5tYXRyaXhQcm9wZXJ0eS5zZXQoIE1hdHJpeDMudHJhbnNsYXRpb25Gcm9tVmVjdG9yKCBkZWx0YSApLnRpbWVzTWF0cml4KCB0aGlzLl90YXJnZXROb2RlLmdldE1hdHJpeCgpICkgKTtcclxuXHJcbiAgICB0aGlzLmNvcnJlY3RSZXBvc2l0aW9uKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXBvc2l0aW9ucyB0aGUgdGFyZ2V0IG5vZGUgaW4gcmVzcG9uc2UgdG8ga2V5Ym9hcmQgaW5wdXQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSByZXBvc2l0aW9uRnJvbUtleXMoIGtleVByZXNzOiBLZXlQcmVzcyApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciggJ011bHRpTGlzdGVuZXIgcmVwb3NpdGlvbiBmcm9tIGtleSBwcmVzcycgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIGNvbnN0IHNvdXJjZVBvc2l0aW9uID0gdGhpcy5zb3VyY2VQb3NpdGlvbiE7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBzb3VyY2VQb3NpdGlvbiwgJ3NvdXJjZVBvc2l0aW9uIG11c3QgYmUgZGVmaW5lZCB0byBoYW5kbGUga2V5IHByZXNzLCBiZSBzdXJlIHRvIGNhbGwgaW5pdGlhbGl6ZVBvc2l0aW9ucycgKTtcclxuXHJcbiAgICBjb25zdCBuZXdTY2FsZSA9IGtleVByZXNzLnNjYWxlO1xyXG4gICAgY29uc3QgY3VycmVudFNjYWxlID0gdGhpcy5nZXRDdXJyZW50U2NhbGUoKTtcclxuICAgIGlmICggbmV3U2NhbGUgIT09IGN1cnJlbnRTY2FsZSApIHtcclxuXHJcbiAgICAgIC8vIGtleSBwcmVzcyBjaGFuZ2VkIHNjYWxlXHJcbiAgICAgIHRoaXMuc2V0RGVzdGluYXRpb25TY2FsZSggbmV3U2NhbGUgKTtcclxuICAgICAgdGhpcy5zY2FsZUdlc3R1cmVUYXJnZXRQb3NpdGlvbiA9IGtleVByZXNzLmNvbXB1dGVTY2FsZVRhcmdldEZyb21LZXlQcmVzcygpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoICFrZXlQcmVzcy50cmFuc2xhdGlvblZlY3Rvci5lcXVhbHMoIFZlY3RvcjIuWkVSTyApICkge1xyXG5cclxuICAgICAgLy8ga2V5IHByZXNzIGluaXRpYXRlZCBzb21lIHRyYW5zbGF0aW9uXHJcbiAgICAgIHRoaXMuc2V0RGVzdGluYXRpb25Qb3NpdGlvbiggc291cmNlUG9zaXRpb24ucGx1cygga2V5UHJlc3MudHJhbnNsYXRpb25WZWN0b3IgKSApO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY29ycmVjdFJlcG9zaXRpb24oKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVwb3NpdGlvbnMgdGhlIHRhcmdldCBub2RlIGluIHJlc3BvbnNlIHRvIHdoZWVsIGlucHV0LiBXaGVlbCBpbnB1dCBjYW4gY29tZSBmcm9tIGEgbW91c2UsIHRyYWNrcGFkLCBvclxyXG4gICAqIG90aGVyLiBBc3BlY3RzIG9mIHRoZSBldmVudCBhcmUgc2xpZ2h0bHkgZGlmZmVyZW50IGZvciBlYWNoIGlucHV0IHNvdXJjZSBhbmQgdGhpcyBmdW5jdGlvbiB0cmllcyB0byBub3JtYWxpemVcclxuICAgKiB0aGVzZSBkaWZmZXJlbmNlcy5cclxuICAgKi9cclxuICBwcml2YXRlIHJlcG9zaXRpb25Gcm9tV2hlZWwoIHdoZWVsOiBXaGVlbCwgZXZlbnQ6IFNjZW5lcnlFdmVudCApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciggJ011bHRpTGlzdGVuZXIgcmVwb3NpdGlvbiBmcm9tIHdoZWVsJyApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgY29uc3QgZG9tRXZlbnQgPSBldmVudC5kb21FdmVudCE7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBkb21FdmVudCBpbnN0YW5jZW9mIFdoZWVsRXZlbnQsICd3aGVlbCBldmVudCBtdXN0IGJlIGEgV2hlZWxFdmVudCcgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zaW1wbGUtdHlwZS1jaGVja2luZy1hc3NlcnRpb25zXHJcblxyXG4gICAgY29uc3Qgc291cmNlUG9zaXRpb24gPSB0aGlzLnNvdXJjZVBvc2l0aW9uITtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHNvdXJjZVBvc2l0aW9uLCAnc291cmNlUG9zaXRpb24gbXVzdCBiZSBkZWZpbmVkIHRvIGhhbmRsZSB3aGVlbCwgYmUgc3VyZSB0byBjYWxsIGluaXRpYWxpemVQb3NpdGlvbnMnICk7XHJcblxyXG4gICAgLy8gcHJldmVudCBhbnkgbmF0aXZlIGJyb3dzZXIgem9vbSBhbmQgZG9uJ3QgYWxsb3cgYnJvd3NlciB0byBnbyAnYmFjaycgb3IgJ2ZvcndhcmQnIGEgcGFnZSB3aXRoIGNlcnRhaW4gZ2VzdHVyZXNcclxuICAgIGRvbUV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgaWYgKCB3aGVlbC5pc0N0cmxLZXlEb3duICkge1xyXG4gICAgICBjb25zdCBuZXh0U2NhbGUgPSB0aGlzLmxpbWl0U2NhbGUoIHRoaXMuZ2V0Q3VycmVudFNjYWxlKCkgKyB3aGVlbC5zY2FsZURlbHRhICk7XHJcbiAgICAgIHRoaXMuc2NhbGVHZXN0dXJlVGFyZ2V0UG9zaXRpb24gPSB3aGVlbC50YXJnZXRQb2ludDtcclxuICAgICAgdGhpcy5zZXREZXN0aW5hdGlvblNjYWxlKCBuZXh0U2NhbGUgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG5cclxuICAgICAgLy8gd2hlZWwgZG9lcyBub3QgaW5kaWNhdGUgem9vbSwgbXVzdCBiZSB0cmFuc2xhdGlvblxyXG4gICAgICB0aGlzLnNldERlc3RpbmF0aW9uUG9zaXRpb24oIHNvdXJjZVBvc2l0aW9uLnBsdXMoIHdoZWVsLnRyYW5zbGF0aW9uVmVjdG9yICkgKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmNvcnJlY3RSZXBvc2l0aW9uKCk7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwb24gYW55IGtpbmQgb2YgcmVwb3NpdGlvbiwgdXBkYXRlIHRoZSBzb3VyY2UgcG9zaXRpb24gYW5kIHNjYWxlIGZvciB0aGUgbmV4dCB1cGRhdGUgaW4gYW5pbWF0ZVRvVGFyZ2V0cy5cclxuICAgKlxyXG4gICAqIE5vdGU6IFRoaXMgYXNzdW1lcyB0aGF0IGFueSBraW5kIG9mIHJlcG9zaXRpb25pbmcgb2YgdGhlIHRhcmdldCBub2RlIHdpbGwgZXZlbnR1YWxseSBjYWxsIGNvcnJlY3RSZXBvc2l0aW9uLlxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBvdmVycmlkZSBjb3JyZWN0UmVwb3NpdGlvbigpOiB2b2lkIHtcclxuICAgIHN1cGVyLmNvcnJlY3RSZXBvc2l0aW9uKCk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9wYW5Cb3VuZHMuaXNGaW5pdGUoKSApIHtcclxuXHJcbiAgICAgIC8vIHRoZSBwYW4gYm91bmRzIGluIHRoZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lIG9mIHRoZSB0YXJnZXQgTm9kZSAoZ2VuZXJhbGx5LCBib3VuZHMgb2YgdGhlIHRhcmdldE5vZGVcclxuICAgICAgLy8gdGhhdCBhcmUgdmlzaWJsZSBpbiB0aGUgZ2xvYmFsIHBhbkJvdW5kcylcclxuICAgICAgdGhpcy5fdHJhbnNmb3JtZWRQYW5Cb3VuZHMgPSB0aGlzLl9wYW5Cb3VuZHMudHJhbnNmb3JtZWQoIHRoaXMuX3RhcmdldE5vZGUubWF0cml4LmludmVydGVkKCkgKTtcclxuXHJcbiAgICAgIHRoaXMuc291cmNlUG9zaXRpb24gPSB0aGlzLl90cmFuc2Zvcm1lZFBhbkJvdW5kcy5jZW50ZXI7XHJcbiAgICAgIHRoaXMuc291cmNlU2NhbGUgPSB0aGlzLmdldEN1cnJlbnRTY2FsZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV2hlbiBhIG5ldyBwcmVzcyBiZWdpbnMsIHN0b3AgYW55IGluIHByb2dyZXNzIGFuaW1hdGlvbi5cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgb3ZlcnJpZGUgYWRkUHJlc3MoIHByZXNzOiBNdWx0aUxpc3RlbmVyUHJlc3MgKTogdm9pZCB7XHJcbiAgICBzdXBlci5hZGRQcmVzcyggcHJlc3MgKTtcclxuICAgIHRoaXMuc3RvcEluUHJvZ3Jlc3NBbmltYXRpb24oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZW4gcHJlc3NlcyBhcmUgcmVtb3ZlZCwgcmVzZXQgYW5pbWF0aW9uIGRlc3RpbmF0aW9ucy5cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgb3ZlcnJpZGUgcmVtb3ZlUHJlc3MoIHByZXNzOiBNdWx0aUxpc3RlbmVyUHJlc3MgKTogdm9pZCB7XHJcbiAgICBzdXBlci5yZW1vdmVQcmVzcyggcHJlc3MgKTtcclxuXHJcbiAgICAvLyByZXN0b3JlIHRoZSBjdXJzb3IgaWYgd2UgaGF2ZSBhIG1pZGRsZSBwcmVzcyBhcyB3ZSBhcmUgaW4gYSBzdGF0ZSB3aGVyZSBtb3ZpbmcgdGhlIG1vdXNlIHdpbGwgcGFuXHJcbiAgICBpZiAoIHRoaXMubWlkZGxlUHJlc3MgKSB7XHJcbiAgICAgIHByZXNzLnBvaW50ZXIuY3Vyc29yID0gTU9WRV9DVVJTT1I7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0aGlzLl9wcmVzc2VzLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgdGhpcy5zdG9wSW5Qcm9ncmVzc0FuaW1hdGlvbigpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW50ZXJydXB0IHRoZSBsaXN0ZW5lci4gQ2FuY2VscyBhbnkgYWN0aXZlIGlucHV0IGFuZCBjbGVhcnMgcmVmZXJlbmNlcyB1cG9uIGludGVyYWN0aW9uIGVuZC5cclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgaW50ZXJydXB0KCk6IHZvaWQge1xyXG4gICAgdGhpcy5jYW5jZWxQYW5uaW5nRHVyaW5nRHJhZygpO1xyXG5cclxuICAgIHRoaXMuY2FuY2VsTWlkZGxlUHJlc3MoKTtcclxuICAgIHN1cGVyLmludGVycnVwdCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogXCJDYW5jZWxcIiB0aGUgbGlzdGVuZXIsIHdoZW4gaW5wdXQgc3RvcHMgYWJub3JtYWxseS4gUGFydCBvZiB0aGUgc2NlbmVyeSBJbnB1dCBBUEkuXHJcbiAgICovXHJcbiAgcHVibGljIGNhbmNlbCgpOiB2b2lkIHtcclxuICAgIHRoaXMuaW50ZXJydXB0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIEludGVudCBvZiB0aGUgUG9pbnRlciBpbmRpY2F0ZXMgdGhhdCBpdCB3aWxsIGJlIHVzZWQgZm9yIGRyYWdnaW5nIG9mIHNvbWUga2luZC5cclxuICAgKi9cclxuICBwcml2YXRlIGhhc0RyYWdJbnRlbnQoIHBvaW50ZXI6IFBvaW50ZXIgKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gcG9pbnRlci5oYXNJbnRlbnQoIEludGVudC5LRVlCT0FSRF9EUkFHICkgfHxcclxuICAgICAgICAgICBwb2ludGVyLmhhc0ludGVudCggSW50ZW50LkRSQUcgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFBhbiB0byBhIHByb3ZpZGVkIE5vZGUsIGF0dGVtcHRpbmcgdG8gcGxhY2UgdGhlIG5vZGUgaW4gdGhlIGNlbnRlciBvZiB0aGUgdHJhbnNmb3JtZWRQYW5Cb3VuZHMuIEl0IG1heSBub3QgZW5kXHJcbiAgICogdXAgZXhhY3RseSBpbiB0aGUgY2VudGVyIHNpbmNlIHdlIGhhdmUgdG8gbWFrZSBzdXJlIHBhbkJvdW5kcyBhcmUgY29tcGxldGVseSBmaWxsZWQgd2l0aCB0YXJnZXROb2RlIGNvbnRlbnQuXHJcbiAgICpcclxuICAgKiBZb3UgY2FuIGNvbmRpdGlvbmFsbHkgbm90IHBhbiB0byB0aGUgY2VudGVyIGJ5IHNldHRpbmcgcGFuVG9DZW50ZXIgdG8gZmFsc2UuIFNvbWV0aW1lcyBzaGlmdGluZyB0aGUgc2NyZWVuIHNvXHJcbiAgICogdGhhdCB0aGUgTm9kZSBpcyBhdCB0aGUgY2VudGVyIGlzIHRvbyBqYXJyaW5nLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIG5vZGUgLSBOb2RlIHRvIHBhbiB0b1xyXG4gICAqIEBwYXJhbSBwYW5Ub0NlbnRlciAtIElmIHRydWUsIGxpc3RlbmVyIHdpbGwgcGFuIHNvIHRoYXQgdGhlIE5vZGUgaXMgYXQgdGhlIGNlbnRlciBvZiB0aGUgc2NyZWVuLiBPdGhlcndpc2UsIGp1c3RcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICB1bnRpbCB0aGUgTm9kZSBpcyBmdWxseSBkaXNwbGF5ZWQgaW4gdGhlIHZpZXdwb3J0LlxyXG4gICAqIEBwYXJhbSBwYW5EaXJlY3Rpb24gLSBpZiBwcm92aWRlZCwgd2Ugd2lsbCBvbmx5IHBhbiBpbiB0aGUgZGlyZWN0aW9uIHNwZWNpZmllZCwgbnVsbCBmb3IgYWxsIGRpcmVjdGlvbnNcclxuICAgKi9cclxuICBwdWJsaWMgcGFuVG9Ob2RlKCBub2RlOiBOb2RlLCBwYW5Ub0NlbnRlcjogYm9vbGVhbiwgcGFuRGlyZWN0aW9uPzogTGltaXRQYW5EaXJlY3Rpb24gfCBudWxsICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fcGFuQm91bmRzLmlzRmluaXRlKCksICdwYW5Cb3VuZHMgc2hvdWxkIGJlIGRlZmluZWQgd2hlbiBwYW5uaW5nLicgKTtcclxuICAgIHRoaXMua2VlcEJvdW5kc0luVmlldyggbm9kZS5nbG9iYWxCb3VuZHMsIHBhblRvQ2VudGVyLCBwYW5EaXJlY3Rpb24gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgZGVzdGluYXRpb24gcG9zaXRpb24gdG8gcGFuIHN1Y2ggdGhhdCB0aGUgcHJvdmlkZWQgZ2xvYmFsQm91bmRzIGFyZSB0b3RhbGx5IHZpc2libGUgd2l0aGluIHRoZSBwYW5Cb3VuZHMuXHJcbiAgICogVGhpcyB3aWxsIG5ldmVyIHBhbiBvdXRzaWRlIHBhbkJvdW5kcywgaWYgdGhlIHByb3ZpZGVkIGdsb2JhbEJvdW5kcyBleHRlbmQgYmV5b25kIHRoZW0uXHJcbiAgICpcclxuICAgKiBJZiB3ZSBhcmUgbm90IHVzaW5nIHBhblRvQ2VudGVyIGFuZCB0aGUgZ2xvYmFsQm91bmRzIGlzIGxhcmdlciB0aGFuIHRoZSBzY3JlZW4gc2l6ZSB0aGlzIGZ1bmN0aW9uIGRvZXMgbm90aGluZy5cclxuICAgKiBJdCBkb2Vzbid0IG1ha2Ugc2Vuc2UgdG8gdHJ5IHRvIGtlZXAgdGhlIHByb3ZpZGVkIGJvdW5kcyBlbnRpcmVseSBpbiB2aWV3IGlmIHRoZXkgYXJlIGxhcmdlciB0aGFuIHRoZSBhdmFpbGFsYWJsZVxyXG4gICAqIHZpZXcgc3BhY2UuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gZ2xvYmFsQm91bmRzIC0gaW4gZ2xvYmFsIGNvb3JkaW5hdGUgZnJhbWVcclxuICAgKiBAcGFyYW0gcGFuVG9DZW50ZXIgLSBpZiB0cnVlLCB3ZSB3aWxsIHBhbiB0byB0aGUgY2VudGVyIG9mIHRoZSBwcm92aWRlZCBib3VuZHMsIG90aGVyd2lzZSB3ZSB3aWxsIHBhblxyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bnRpbCBhbGwgZWRnZXMgYXJlIG9uIHNjcmVlblxyXG4gICAqIEBwYXJhbSBwYW5EaXJlY3Rpb24gLSBpZiBwcm92aWRlZCwgd2Ugd2lsbCBvbmx5IHBhbiBpbiB0aGUgZGlyZWN0aW9uIHNwZWNpZmllZCwgbnVsbCBmb3IgYWxsIGRpcmVjdGlvbnNcclxuICAgKi9cclxuICBwcml2YXRlIGtlZXBCb3VuZHNJblZpZXcoIGdsb2JhbEJvdW5kczogQm91bmRzMiwgcGFuVG9DZW50ZXI6IGJvb2xlYW4sIHBhbkRpcmVjdGlvbj86IExpbWl0UGFuRGlyZWN0aW9uIHwgbnVsbCApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX3BhbkJvdW5kcy5pc0Zpbml0ZSgpLCAncGFuQm91bmRzIHNob3VsZCBiZSBkZWZpbmVkIHdoZW4gcGFubmluZy4nICk7XHJcbiAgICBjb25zdCBzb3VyY2VQb3NpdGlvbiA9IHRoaXMuc291cmNlUG9zaXRpb24hO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggc291cmNlUG9zaXRpb24sICdzb3VyY2VQb3NpdGlvbiBtdXN0IGJlIGRlZmluZWQgdG8gaGFuZGxlIGtlZXBCb3VuZHNJblZpZXcsIGJlIHN1cmUgdG8gY2FsbCBpbml0aWFsaXplUG9zaXRpb25zJyApO1xyXG5cclxuICAgIGNvbnN0IGJvdW5kc0luVGFyZ2V0RnJhbWUgPSB0aGlzLl90YXJnZXROb2RlLmdsb2JhbFRvTG9jYWxCb3VuZHMoIGdsb2JhbEJvdW5kcyApO1xyXG4gICAgY29uc3QgdHJhbnNsYXRpb25EZWx0YSA9IG5ldyBWZWN0b3IyKCAwLCAwICk7XHJcblxyXG4gICAgbGV0IGRpc3RhbmNlVG9MZWZ0RWRnZSA9IDA7XHJcbiAgICBsZXQgZGlzdGFuY2VUb1JpZ2h0RWRnZSA9IDA7XHJcbiAgICBsZXQgZGlzdGFuY2VUb1RvcEVkZ2UgPSAwO1xyXG4gICAgbGV0IGRpc3RhbmNlVG9Cb3R0b21FZGdlID0gMDtcclxuXHJcbiAgICBpZiAoIHBhblRvQ2VudGVyICkge1xyXG5cclxuICAgICAgLy8gSWYgcGFubmluZyB0byBjZW50ZXIsIHRoZSBhbW91bnQgdG8gcGFuIGlzIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRoZSBjZW50ZXIgb2YgdGhlIHNjcmVlbiB0byB0aGUgY2VudGVyIG9mIHRoZVxyXG4gICAgICAvLyBwcm92aWRlZCBib3VuZHMuIEluIHRoaXMgY2FzZVxyXG4gICAgICBkaXN0YW5jZVRvTGVmdEVkZ2UgPSB0aGlzLl90cmFuc2Zvcm1lZFBhbkJvdW5kcy5jZW50ZXJYIC0gYm91bmRzSW5UYXJnZXRGcmFtZS5jZW50ZXJYO1xyXG4gICAgICBkaXN0YW5jZVRvUmlnaHRFZGdlID0gdGhpcy5fdHJhbnNmb3JtZWRQYW5Cb3VuZHMuY2VudGVyWCAtIGJvdW5kc0luVGFyZ2V0RnJhbWUuY2VudGVyWDtcclxuICAgICAgZGlzdGFuY2VUb1RvcEVkZ2UgPSB0aGlzLl90cmFuc2Zvcm1lZFBhbkJvdW5kcy5jZW50ZXJZIC0gYm91bmRzSW5UYXJnZXRGcmFtZS5jZW50ZXJZO1xyXG4gICAgICBkaXN0YW5jZVRvQm90dG9tRWRnZSA9IHRoaXMuX3RyYW5zZm9ybWVkUGFuQm91bmRzLmNlbnRlclkgLSBib3VuZHNJblRhcmdldEZyYW1lLmNlbnRlclk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggKCBwYW5EaXJlY3Rpb24gPT09ICd2ZXJ0aWNhbCcgfHwgYm91bmRzSW5UYXJnZXRGcmFtZS53aWR0aCA8IHRoaXMuX3RyYW5zZm9ybWVkUGFuQm91bmRzLndpZHRoICkgJiYgKCBwYW5EaXJlY3Rpb24gPT09ICdob3Jpem9udGFsJyB8fCBib3VuZHNJblRhcmdldEZyYW1lLmhlaWdodCA8IHRoaXMuX3RyYW5zZm9ybWVkUGFuQm91bmRzLmhlaWdodCApICkge1xyXG5cclxuICAgICAgLy8gSWYgdGhlIHByb3ZpZGVkIGJvdW5kcyBhcmUgd2lkZXIgdGhhbiB0aGUgYXZhaWxhYmxlIHBhbiBib3VuZHMgd2Ugc2hvdWxkbid0IHRyeSB0byBzaGlmdCBpdCwgaXQgd2lsbCBhd2t3YXJkbHlcclxuICAgICAgLy8gdHJ5IHRvIHNsaWRlIHRoZSBzY3JlZW4gdG8gb25lIG9mIHRoZSBzaWRlcyBvZiB0aGUgYm91bmRzLiBUaGlzIG9wZXJhdGlvbiBvbmx5IG1ha2VzIHNlbnNlIGlmIHRoZSBzY3JlZW4gY2FuXHJcbiAgICAgIC8vIHRvdGFsbHkgY29udGFpbiB0aGUgb2JqZWN0IGJlaW5nIGRyYWdnZWQuXHJcblxyXG4gICAgICAvLyBBIGJpdCBvZiBwYWRkaW5nIGhlbHBzIHRvIHBhbiB0aGUgc2NyZWVuIGZ1cnRoZXIgc28gdGhhdCB5b3UgY2FuIGtlZXAgZHJhZ2dpbmcgZXZlbiBpZiB0aGUgY3Vyc29yL29iamVjdFxyXG4gICAgICAvLyBpcyByaWdodCBhdCB0aGUgZWRnZSBvZiB0aGUgc2NyZWVuLiBJdCBhbHNvIGxvb2tzIGEgbGl0dGxlIG5pY2VyIGJ5IGtlZXBpbmcgdGhlIG9iamVjdCB3ZWxsIGluIHZpZXcuXHJcbiAgICAgIC8vIEluY3JlYXNlIHRoaXMgdmFsdWUgdG8gYWRkIG1vcmUgbW90aW9uIHdoZW4gZHJhZ2dpbmcgbmVhciB0aGUgZWRnZSBvZiB0aGUgc2NyZWVuLiBCdXQgdG9vIG11Y2ggb2YgdGhpc1xyXG4gICAgICAvLyB3aWxsIG1ha2UgdGhlIHNjcmVlbiBmZWVsIGxpa2UgaXQgaXMgXCJzbGlkaW5nXCIgYXJvdW5kIHRvbyBtdWNoLlxyXG4gICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL251bWJlci1saW5lLW9wZXJhdGlvbnMvaXNzdWVzLzEwOFxyXG4gICAgICBjb25zdCBwYWRkaW5nRGVsdGEgPSAxNTA7IC8vIGdsb2JhbCBjb29yZGluYXRlIGZyYW1lLCBzY2FsZWQgYmVsb3dcclxuXHJcbiAgICAgIC8vIHNjYWxlIHRoZSBwYWRkaW5nIGRlbHRhIGJ5IG91ciBtYXRyaXggc28gdGhhdCBpdCBpcyBhcHByb3ByaWF0ZSBmb3Igb3VyIHpvb20gbGV2ZWwgLSBzbWFsbGVyIHdoZW4gem9vbWVkIHdheSBpblxyXG4gICAgICBjb25zdCBtYXRyaXhTY2FsZSA9IHRoaXMuZ2V0Q3VycmVudFNjYWxlKCk7XHJcbiAgICAgIGNvbnN0IHBhZGRpbmdEZWx0YVNjYWxlZCA9IHBhZGRpbmdEZWx0YSAvIG1hdHJpeFNjYWxlO1xyXG5cclxuICAgICAgZGlzdGFuY2VUb0xlZnRFZGdlID0gdGhpcy5fdHJhbnNmb3JtZWRQYW5Cb3VuZHMubGVmdCAtIGJvdW5kc0luVGFyZ2V0RnJhbWUubGVmdCArIHBhZGRpbmdEZWx0YVNjYWxlZDtcclxuICAgICAgZGlzdGFuY2VUb1JpZ2h0RWRnZSA9IHRoaXMuX3RyYW5zZm9ybWVkUGFuQm91bmRzLnJpZ2h0IC0gYm91bmRzSW5UYXJnZXRGcmFtZS5yaWdodCAtIHBhZGRpbmdEZWx0YVNjYWxlZDtcclxuICAgICAgZGlzdGFuY2VUb1RvcEVkZ2UgPSB0aGlzLl90cmFuc2Zvcm1lZFBhbkJvdW5kcy50b3AgLSBib3VuZHNJblRhcmdldEZyYW1lLnRvcCArIHBhZGRpbmdEZWx0YVNjYWxlZDtcclxuICAgICAgZGlzdGFuY2VUb0JvdHRvbUVkZ2UgPSB0aGlzLl90cmFuc2Zvcm1lZFBhbkJvdW5kcy5ib3R0b20gLSBib3VuZHNJblRhcmdldEZyYW1lLmJvdHRvbSAtIHBhZGRpbmdEZWx0YVNjYWxlZDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHBhbkRpcmVjdGlvbiAhPT0gJ3ZlcnRpY2FsJyApIHtcclxuXHJcbiAgICAgIC8vIGlmIG5vdCBwYW5uaW5nIHZlcnRpY2FsbHksIHdlIGFyZSBmcmVlIHRvIG1vdmUgaW4gdGhlIGhvcml6b250YWwgZGltZW5zaW9uXHJcbiAgICAgIGlmICggZGlzdGFuY2VUb1JpZ2h0RWRnZSA8IDAgKSB7XHJcbiAgICAgICAgdHJhbnNsYXRpb25EZWx0YS54ID0gLWRpc3RhbmNlVG9SaWdodEVkZ2U7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBkaXN0YW5jZVRvTGVmdEVkZ2UgPiAwICkge1xyXG4gICAgICAgIHRyYW5zbGF0aW9uRGVsdGEueCA9IC1kaXN0YW5jZVRvTGVmdEVkZ2U7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICggcGFuRGlyZWN0aW9uICE9PSAnaG9yaXpvbnRhbCcgKSB7XHJcblxyXG4gICAgICAvLyBpZiBub3QgcGFubmluZyBob3Jpem9udGFsbHksIHdlIGFyZSBmcmVlIHRvIG1vdmUgaW4gdGhlIHZlcnRpY2FsIGRpcmVjdGlvblxyXG4gICAgICBpZiAoIGRpc3RhbmNlVG9Cb3R0b21FZGdlIDwgMCApIHtcclxuICAgICAgICB0cmFuc2xhdGlvbkRlbHRhLnkgPSAtZGlzdGFuY2VUb0JvdHRvbUVkZ2U7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBkaXN0YW5jZVRvVG9wRWRnZSA+IDAgKSB7XHJcbiAgICAgICAgdHJhbnNsYXRpb25EZWx0YS55ID0gLWRpc3RhbmNlVG9Ub3BFZGdlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zZXREZXN0aW5hdGlvblBvc2l0aW9uKCBzb3VyY2VQb3NpdGlvbi5wbHVzKCB0cmFuc2xhdGlvbkRlbHRhICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEtlZXAgYSB0cmFpbCBpbiB2aWV3IGJ5IHBhbm5pbmcgdG8gaXQgaWYgaXQgaGFzIGJvdW5kcyB0aGF0IGFyZSBvdXRzaWRlIG9mIHRoZSBnbG9iYWwgcGFuQm91bmRzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUga2VlcFRyYWlsSW5WaWV3KCB0cmFpbDogVHJhaWwsIHBhbkRpcmVjdGlvbj86IExpbWl0UGFuRGlyZWN0aW9uIHwgbnVsbCApOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy5fcGFuQm91bmRzLmlzRmluaXRlKCkgJiYgdHJhaWwubGFzdE5vZGUoKS5ib3VuZHMuaXNGaW5pdGUoKSApIHtcclxuICAgICAgY29uc3QgZ2xvYmFsQm91bmRzID0gdHJhaWwubG9jYWxUb0dsb2JhbEJvdW5kcyggdHJhaWwubGFzdE5vZGUoKS5sb2NhbEJvdW5kcyApO1xyXG4gICAgICBpZiAoICF0aGlzLl9wYW5Cb3VuZHMuY29udGFpbnNCb3VuZHMoIGdsb2JhbEJvdW5kcyApICkge1xyXG4gICAgICAgIHRoaXMua2VlcEJvdW5kc0luVmlldyggZ2xvYmFsQm91bmRzLCB0cnVlLCBwYW5EaXJlY3Rpb24gKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIGR0IC0gaW4gc2Vjb25kc1xyXG4gICAqL1xyXG4gIHByaXZhdGUgYW5pbWF0ZVRvVGFyZ2V0cyggZHQ6IG51bWJlciApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuYm91bmRzRmluaXRlLCAnaW5pdGlhbGl6ZVBvc2l0aW9ucyBtdXN0IGJlIGNhbGxlZCBhdCBsZWFzdCBvbmNlIGJlZm9yZSBhbmltYXRpbmcnICk7XHJcblxyXG4gICAgY29uc3Qgc291cmNlUG9zaXRpb24gPSB0aGlzLnNvdXJjZVBvc2l0aW9uITtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHNvdXJjZVBvc2l0aW9uLCAnc291cmNlUG9zaXRpb24gbXVzdCBiZSBkZWZpbmVkIHRvIGFuaW1hdGUsIGJlIHN1cmUgdG8gYWxsIGluaXRpYWxpemVQb3NpdGlvbnMnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBzb3VyY2VQb3NpdGlvbi5pc0Zpbml0ZSgpLCAnSG93IGNhbiB0aGUgc291cmNlIHBvc2l0aW9uIG5vdCBiZSBhIGZpbml0ZSBWZWN0b3IyPycgKTtcclxuXHJcbiAgICBjb25zdCBkZXN0aW5hdGlvblBvc2l0aW9uID0gdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uITtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGRlc3RpbmF0aW9uUG9zaXRpb24sICdkZXN0aW5hdGlvblBvc2l0aW9uIG11c3QgYmUgZGVmaW5lZCB0byBhbmltYXRlLCBiZSBzdXJlIHRvIGFsbCBpbml0aWFsaXplUG9zaXRpb25zJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggZGVzdGluYXRpb25Qb3NpdGlvbi5pc0Zpbml0ZSgpLCAnSG93IGNhbiB0aGUgZGVzdGluYXRpb24gcG9zaXRpb24gbm90IGJlIGEgZmluaXRlIFZlY3RvcjI/JyApO1xyXG5cclxuICAgIC8vIG9ubHkgYW5pbWF0ZSB0byB0YXJnZXRzIGlmIHdpdGhpbiB0aGlzIHByZWNpc2lvbiBzbyB0aGF0IHdlIGRvbid0IGFuaW1hdGUgZm9yZXZlciwgc2luY2UgYW5pbWF0aW9uIHNwZWVkXHJcbiAgICAvLyBpcyBkZXBlbmRlbnQgb24gdGhlIGRpZmZlcmVuY2UgYmV0d2VuIHNvdXJjZSBhbmQgZGVzdGluYXRpb24gcG9zaXRpb25zXHJcbiAgICBjb25zdCBwb3NpdGlvbkRpcnR5ID0gIWRlc3RpbmF0aW9uUG9zaXRpb24uZXF1YWxzRXBzaWxvbiggc291cmNlUG9zaXRpb24sIDAuMSApO1xyXG4gICAgY29uc3Qgc2NhbGVEaXJ0eSA9ICFVdGlscy5lcXVhbHNFcHNpbG9uKCB0aGlzLnNvdXJjZVNjYWxlLCB0aGlzLmRlc3RpbmF0aW9uU2NhbGUsIDAuMDAxICk7XHJcblxyXG4gICAgdGhpcy5hbmltYXRpbmdQcm9wZXJ0eS52YWx1ZSA9IHBvc2l0aW9uRGlydHkgfHwgc2NhbGVEaXJ0eTtcclxuXHJcbiAgICAvLyBPbmx5IGEgTWlkZGxlUHJlc3MgY2FuIHN1cHBvcnQgYW5pbWF0aW9uIHdoaWxlIGRvd25cclxuICAgIGlmICggdGhpcy5fcHJlc3Nlcy5sZW5ndGggPT09IDAgfHwgdGhpcy5taWRkbGVQcmVzcyAhPT0gbnVsbCApIHtcclxuICAgICAgaWYgKCBwb3NpdGlvbkRpcnR5ICkge1xyXG5cclxuICAgICAgICAvLyBhbmltYXRlIHRvIHRoZSBwb3NpdGlvbiwgZWZmZWN0aXZlbHkgcGFubmluZyBvdmVyIHRpbWUgd2l0aG91dCBhbnkgc2NhbGluZ1xyXG4gICAgICAgIGNvbnN0IHRyYW5zbGF0aW9uRGlmZmVyZW5jZSA9IGRlc3RpbmF0aW9uUG9zaXRpb24ubWludXMoIHNvdXJjZVBvc2l0aW9uICk7XHJcblxyXG4gICAgICAgIGxldCB0cmFuc2xhdGlvbkRpcmVjdGlvbiA9IHRyYW5zbGF0aW9uRGlmZmVyZW5jZTtcclxuICAgICAgICBpZiAoIHRyYW5zbGF0aW9uRGlmZmVyZW5jZS5tYWduaXR1ZGUgIT09IDAgKSB7XHJcbiAgICAgICAgICB0cmFuc2xhdGlvbkRpcmVjdGlvbiA9IHRyYW5zbGF0aW9uRGlmZmVyZW5jZS5ub3JtYWxpemVkKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB0cmFuc2xhdGlvblNwZWVkID0gdGhpcy5nZXRUcmFuc2xhdGlvblNwZWVkKCB0cmFuc2xhdGlvbkRpZmZlcmVuY2UubWFnbml0dWRlICk7XHJcbiAgICAgICAgc2NyYXRjaFZlbG9jaXR5VmVjdG9yLnNldFhZKCB0cmFuc2xhdGlvblNwZWVkLCB0cmFuc2xhdGlvblNwZWVkICk7XHJcblxyXG4gICAgICAgIC8vIGZpbmFsbHkgZGV0ZXJtaW5lIHRoZSBmaW5hbCBwYW5uaW5nIHRyYW5zbGF0aW9uIGFuZCBhcHBseVxyXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudE1hZ25pdHVkZSA9IHNjcmF0Y2hWZWxvY2l0eVZlY3Rvci5tdWx0aXBseVNjYWxhciggZHQgKTtcclxuICAgICAgICBjb25zdCB0cmFuc2xhdGlvbkRlbHRhID0gdHJhbnNsYXRpb25EaXJlY3Rpb24uY29tcG9uZW50VGltZXMoIGNvbXBvbmVudE1hZ25pdHVkZSApO1xyXG5cclxuICAgICAgICAvLyBpbiBjYXNlIG9mIGxhcmdlIGR0LCBkb24ndCBvdmVyc2hvb3QgdGhlIGRlc3RpbmF0aW9uXHJcbiAgICAgICAgaWYgKCB0cmFuc2xhdGlvbkRlbHRhLm1hZ25pdHVkZSA+IHRyYW5zbGF0aW9uRGlmZmVyZW5jZS5tYWduaXR1ZGUgKSB7XHJcbiAgICAgICAgICB0cmFuc2xhdGlvbkRlbHRhLnNldCggdHJhbnNsYXRpb25EaWZmZXJlbmNlICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0cmFuc2xhdGlvbkRlbHRhLmlzRmluaXRlKCksICdUcnlpbmcgdG8gdHJhbnNsYXRlIHdpdGggYSBub24tZmluaXRlIFZlY3RvcjInICk7XHJcbiAgICAgICAgdGhpcy50cmFuc2xhdGVEZWx0YSggdHJhbnNsYXRpb25EZWx0YSApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIHNjYWxlRGlydHkgKSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5zY2FsZUdlc3R1cmVUYXJnZXRQb3NpdGlvbiwgJ3RoZXJlIG11c3QgYmUgYSBzY2FsZSB0YXJnZXQgcG9pbnQnICk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNjYWxlRGlmZmVyZW5jZSA9IHRoaXMuZGVzdGluYXRpb25TY2FsZSAtIHRoaXMuc291cmNlU2NhbGU7XHJcbiAgICAgICAgbGV0IHNjYWxlRGVsdGEgPSBzY2FsZURpZmZlcmVuY2UgKiBkdCAqIDY7XHJcblxyXG4gICAgICAgIC8vIGluIGNhc2Ugb2YgbGFyZ2UgZHQgbWFrZSBzdXJlIHRoYXQgd2UgZG9uJ3Qgb3ZlcnNob290IG91ciBkZXN0aW5hdGlvblxyXG4gICAgICAgIGlmICggTWF0aC5hYnMoIHNjYWxlRGVsdGEgKSA+IE1hdGguYWJzKCBzY2FsZURpZmZlcmVuY2UgKSApIHtcclxuICAgICAgICAgIHNjYWxlRGVsdGEgPSBzY2FsZURpZmZlcmVuY2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudHJhbnNsYXRlU2NhbGVUb1RhcmdldCggdGhpcy5zY2FsZUdlc3R1cmVUYXJnZXRQb3NpdGlvbiEsIHNjYWxlRGVsdGEgKTtcclxuXHJcbiAgICAgICAgLy8gYWZ0ZXIgYXBwbHlpbmcgdGhlIHNjYWxlLCB0aGUgc291cmNlIHBvc2l0aW9uIGhhcyBjaGFuZ2VkLCB1cGRhdGUgZGVzdGluYXRpb24gdG8gbWF0Y2hcclxuICAgICAgICB0aGlzLnNldERlc3RpbmF0aW9uUG9zaXRpb24oIHNvdXJjZVBvc2l0aW9uICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIHRoaXMuZGVzdGluYXRpb25TY2FsZSAhPT0gdGhpcy5zb3VyY2VTY2FsZSApIHtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLnNjYWxlR2VzdHVyZVRhcmdldFBvc2l0aW9uLCAndGhlcmUgbXVzdCBiZSBhIHNjYWxlIHRhcmdldCBwb2ludCcgKTtcclxuXHJcbiAgICAgICAgLy8gbm90IGZhciBlbm91Z2ggdG8gYW5pbWF0ZSBidXQgY2xvc2UgZW5vdWdoIHRoYXQgd2UgY2FuIHNldCBkZXN0aW5hdGlvbiBlcXVhbCB0byBzb3VyY2UgdG8gYXZvaWQgZnVydGhlclxyXG4gICAgICAgIC8vIGFuaW1hdGlvbiBzdGVwc1xyXG4gICAgICAgIHRoaXMuc2V0VHJhbnNsYXRpb25TY2FsZVRvVGFyZ2V0KCB0aGlzLnNjYWxlR2VzdHVyZVRhcmdldFBvc2l0aW9uISwgdGhpcy5kZXN0aW5hdGlvblNjYWxlICk7XHJcbiAgICAgICAgdGhpcy5zZXREZXN0aW5hdGlvblBvc2l0aW9uKCBzb3VyY2VQb3NpdGlvbiApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTdG9wIGFueSBpbi1wcm9ncmVzcyB0cmFuc2Zvcm1hdGlvbnMgb2YgdGhlIHRhcmdldCBub2RlIGJ5IHNldHRpbmcgZGVzdGluYXRpb25zIHRvIHNvdXJjZXMgaW1tZWRpYXRlbHkuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBzdG9wSW5Qcm9ncmVzc0FuaW1hdGlvbigpOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy5ib3VuZHNGaW5pdGUgJiYgdGhpcy5zb3VyY2VQb3NpdGlvbiApIHtcclxuICAgICAgdGhpcy5zZXREZXN0aW5hdGlvblNjYWxlKCB0aGlzLnNvdXJjZVNjYWxlICk7XHJcbiAgICAgIHRoaXMuc2V0RGVzdGluYXRpb25Qb3NpdGlvbiggdGhpcy5zb3VyY2VQb3NpdGlvbiApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgc291cmNlIGFuZCBkZXN0aW5hdGlvbiBwb3NpdGlvbnMuIE5lY2Vzc2FyeSBiZWNhdXNlIHRhcmdldCBvciBwYW4gYm91bmRzIG1heSBub3QgYmUgZGVmaW5lZFxyXG4gICAqIHVwb24gY29uc3RydWN0aW9uLiBUaGlzIGNhbiBzZXQgdGhvc2UgdXAgd2hlbiB0aGV5IGFyZSBkZWZpbmVkLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgaW5pdGlhbGl6ZVBvc2l0aW9ucygpOiB2b2lkIHtcclxuICAgIHRoaXMuYm91bmRzRmluaXRlID0gdGhpcy5fdHJhbnNmb3JtZWRQYW5Cb3VuZHMuaXNGaW5pdGUoKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuYm91bmRzRmluaXRlICkge1xyXG5cclxuICAgICAgdGhpcy5zb3VyY2VQb3NpdGlvbiA9IHRoaXMuX3RyYW5zZm9ybWVkUGFuQm91bmRzLmNlbnRlcjtcclxuICAgICAgdGhpcy5zZXREZXN0aW5hdGlvblBvc2l0aW9uKCB0aGlzLnNvdXJjZVBvc2l0aW9uICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy5zb3VyY2VQb3NpdGlvbiA9IG51bGw7XHJcbiAgICAgIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbiA9IG51bGw7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXQgdGhlIGNvbnRhaW5pbmcgcGFuQm91bmRzIGFuZCB0aGVuIG1ha2Ugc3VyZSB0aGF0IHRoZSB0YXJnZXRCb3VuZHMgZnVsbHkgZmlsbCB0aGUgbmV3IHBhbkJvdW5kcy4gVXBkYXRlc1xyXG4gICAqIGJvdW5kcyB0aGF0IHRyaWdnZXIgcGFubmluZyBkdXJpbmcgYSBkcmFnIG9wZXJhdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgc2V0UGFuQm91bmRzKCBib3VuZHM6IEJvdW5kczIgKTogdm9pZCB7XHJcbiAgICBzdXBlci5zZXRQYW5Cb3VuZHMoIGJvdW5kcyApO1xyXG4gICAgdGhpcy5pbml0aWFsaXplUG9zaXRpb25zKCk7XHJcblxyXG4gICAgLy8gZHJhZyBib3VuZHMgZXJvZGVkIGEgYml0IHNvIHRoYXQgcmVwb3NpdGlvbmluZyBkdXJpbmcgZHJhZyBvY2N1cnMgYXMgdGhlIHBvaW50ZXIgZ2V0cyBjbG9zZSB0byB0aGUgZWRnZS5cclxuICAgIHRoaXMuX2RyYWdCb3VuZHMgPSBib3VuZHMuZXJvZGVkWFkoIGJvdW5kcy53aWR0aCAqIDAuMSwgYm91bmRzLmhlaWdodCAqIDAuMSApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fZHJhZ0JvdW5kcy5oYXNOb256ZXJvQXJlYSgpLCAnZHJhZyBib3VuZHMgbXVzdCBoYXZlIHNvbWUgd2lkdGggYW5kIGhlaWdodCcgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwb24gc2V0dGluZyB0YXJnZXQgYm91bmRzLCByZS1zZXQgc291cmNlIGFuZCBkZXN0aW5hdGlvbiBwb3NpdGlvbnMuXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIHNldFRhcmdldEJvdW5kcyggdGFyZ2V0Qm91bmRzOiBCb3VuZHMyICk6IHZvaWQge1xyXG4gICAgc3VwZXIuc2V0VGFyZ2V0Qm91bmRzKCB0YXJnZXRCb3VuZHMgKTtcclxuICAgIHRoaXMuaW5pdGlhbGl6ZVBvc2l0aW9ucygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHRoZSBkZXN0aW5hdGlvbiBwb3NpdGlvbi4gSW4gYW5pbWF0aW9uLCB3ZSB3aWxsIHRyeSBtb3ZlIHRoZSB0YXJnZXROb2RlIHVudGlsIHNvdXJjZVBvc2l0aW9uIG1hdGNoZXNcclxuICAgKiB0aGlzIHBvaW50LiBEZXN0aW5hdGlvbiBpcyBpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSBvZiB0aGUgdGFyZ2V0IG5vZGUuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBzZXREZXN0aW5hdGlvblBvc2l0aW9uKCBkZXN0aW5hdGlvbjogVmVjdG9yMiApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuYm91bmRzRmluaXRlLCAnYm91bmRzIG11c3QgYmUgZmluaXRlIGJlZm9yZSBzZXR0aW5nIGRlc3RpbmF0aW9uIHBvc2l0aW9ucycgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGRlc3RpbmF0aW9uLmlzRmluaXRlKCksICdwcm92aWRlZCBkZXN0aW5hdGlvbiBwb3NpdGlvbiBpcyBub3QgZGVmaW5lZCcgKTtcclxuXHJcbiAgICBjb25zdCBzb3VyY2VQb3NpdGlvbiA9IHRoaXMuc291cmNlUG9zaXRpb24hO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggc291cmNlUG9zaXRpb24sICdzb3VyY2VQb3NpdGlvbiBtdXN0IGJlIGRlZmluZWQgdG8gc2V0IGRlc3RpbmF0aW9uIHBvc2l0aW9uLCBiZSBzdXJlIHRvIGNhbGwgaW5pdGlhbGl6ZVBvc2l0aW9ucycgKTtcclxuXHJcbiAgICAvLyBsaW1pdCBkZXN0aW5hdGlvbiBwb3NpdGlvbiB0byBiZSB3aXRoaW4gdGhlIGF2YWlsYWJsZSBib3VuZHMgcGFuIGJvdW5kc1xyXG4gICAgc2NyYXRjaEJvdW5kcy5zZXRNaW5NYXgoXHJcbiAgICAgIHNvdXJjZVBvc2l0aW9uLnggLSB0aGlzLl90cmFuc2Zvcm1lZFBhbkJvdW5kcy5sZWZ0IC0gdGhpcy5fcGFuQm91bmRzLmxlZnQsXHJcbiAgICAgIHNvdXJjZVBvc2l0aW9uLnkgLSB0aGlzLl90cmFuc2Zvcm1lZFBhbkJvdW5kcy50b3AgLSB0aGlzLl9wYW5Cb3VuZHMudG9wLFxyXG4gICAgICBzb3VyY2VQb3NpdGlvbi54ICsgdGhpcy5fcGFuQm91bmRzLnJpZ2h0IC0gdGhpcy5fdHJhbnNmb3JtZWRQYW5Cb3VuZHMucmlnaHQsXHJcbiAgICAgIHNvdXJjZVBvc2l0aW9uLnkgKyB0aGlzLl9wYW5Cb3VuZHMuYm90dG9tIC0gdGhpcy5fdHJhbnNmb3JtZWRQYW5Cb3VuZHMuYm90dG9tXHJcbiAgICApO1xyXG5cclxuICAgIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbiA9IHNjcmF0Y2hCb3VuZHMuY2xvc2VzdFBvaW50VG8oIGRlc3RpbmF0aW9uICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXQgdGhlIGRlc3RpbmF0aW9uIHNjYWxlIGZvciB0aGUgdGFyZ2V0IG5vZGUuIEluIGFuaW1hdGlvbiwgdGFyZ2V0IG5vZGUgd2lsbCBiZSByZXBvc2l0aW9uZWQgdW50aWwgc291cmNlXHJcbiAgICogc2NhbGUgbWF0Y2hlcyBkZXN0aW5hdGlvbiBzY2FsZS5cclxuICAgKi9cclxuICBwcml2YXRlIHNldERlc3RpbmF0aW9uU2NhbGUoIHNjYWxlOiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICB0aGlzLmRlc3RpbmF0aW9uU2NhbGUgPSB0aGlzLmxpbWl0U2NhbGUoIHNjYWxlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxjdWxhdGUgdGhlIHRyYW5zbGF0aW9uIHNwZWVkIHRvIGFuaW1hdGUgZnJvbSBvdXIgc291cmNlUG9zaXRpb24gdG8gb3VyIHRhcmdldFBvc2l0aW9uLiBTcGVlZCBnb2VzIHRvIHplcm9cclxuICAgKiBhcyB0aGUgdHJhbnNsYXRpb25EaXN0YW5jZSBnZXRzIHNtYWxsZXIgZm9yIHNtb290aCBhbmltYXRpb24gYXMgd2UgcmVhY2ggb3VyIGRlc3RpbmF0aW9uIHBvc2l0aW9uLiBUaGlzIHJldHVybnNcclxuICAgKiBhIHNwZWVkIGluIHRoZSBjb29yZGluYXRlIGZyYW1lIG9mIHRoZSBwYXJlbnQgb2YgdGhpcyBsaXN0ZW5lcidzIHRhcmdldCBOb2RlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2V0VHJhbnNsYXRpb25TcGVlZCggdHJhbnNsYXRpb25EaXN0YW5jZTogbnVtYmVyICk6IG51bWJlciB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0cmFuc2xhdGlvbkRpc3RhbmNlID49IDAsICdkaXN0YW5jZSBmb3IgZ2V0VHJhbnNsYXRpb25TcGVlZCBzaG91bGQgYmUgYSBub24tbmVnYXRpdmUgbnVtYmVyJyApO1xyXG5cclxuICAgIC8vIFRoZSBsYXJnZXIgdGhlIHNjYWxlLCB0aGF0IGZhc3RlciB3ZSB3YW50IHRvIHRyYW5zbGF0ZSBiZWNhdXNlIHRoZSBkaXN0YW5jZXMgYmV0d2VlbiBzb3VyY2UgYW5kIGRlc3RpbmF0aW9uXHJcbiAgICAvLyBhcmUgc21hbGxlciB3aGVuIHpvb21lZCBpbi4gT3RoZXJ3aXNlLCBzcGVlZHMgd2lsbCBiZSBzbG93ZXIgd2hpbGUgem9vbWVkIGluLlxyXG4gICAgY29uc3Qgc2NhbGVEaXN0YW5jZSA9IHRyYW5zbGF0aW9uRGlzdGFuY2UgKiB0aGlzLmdldEN1cnJlbnRTY2FsZSgpO1xyXG5cclxuICAgIC8vIEEgbWF4aW11bSB0cmFuc2xhdGlvbiBmYWN0b3IgYXBwbGllZCB0byBkaXN0YW5jZSB0byBkZXRlcm1pbmUgYSByZWFzb25hYmxlIHNwZWVkLCBkZXRlcm1pbmVkIGJ5XHJcbiAgICAvLyBpbnNwZWN0aW9uIGJ1dCBjb3VsZCBiZSBtb2RpZmllZC4gVGhpcyBpbXBhY3RzIGhvdyBsb25nIHRoZSBcInRhaWxcIiBvZiB0cmFuc2xhdGlvbiBpcyBhcyB3ZSBhbmltYXRlLlxyXG4gICAgLy8gV2hpbGUgd2UgYW5pbWF0ZSB0byB0aGUgZGVzdGluYXRpb24gcG9zaXRpb24gd2UgbW92ZSBxdWlja2x5IGZhciBhd2F5IGZyb20gdGhlIGRlc3RpbmF0aW9uIGFuZCBzbG93IGRvd25cclxuICAgIC8vIGFzIHdlIGdldCBjbG9zZXIgdG8gdGhlIHRhcmdldC4gUmVkdWNlIHRoaXMgdmFsdWUgdG8gZXhhZ2dlcmF0ZSB0aGF0IGVmZmVjdCBhbmQgbW92ZSBtb3JlIHNsb3dseSBhcyB3ZVxyXG4gICAgLy8gZ2V0IGNsb3NlciB0byB0aGUgZGVzdGluYXRpb24gcG9zaXRpb24uXHJcbiAgICBjb25zdCBtYXhTY2FsZUZhY3RvciA9IDU7XHJcblxyXG4gICAgLy8gc3BlZWQgZmFsbHMgYXdheSBleHBvbmVudGlhbGx5IGFzIHdlIGdldCBjbG9zZXIgdG8gb3VyIGRlc3RpbmF0aW9uIHNvIHRoYXQgd2UgYXBwZWFyIHRvIFwic2xpZGVcIiB0byBvdXJcclxuICAgIC8vIGRlc3RpbmF0aW9uIHdoaWNoIGxvb2tzIG5pY2UsIGJ1dCBhbHNvIHByZXZlbnRzIHVzIGZyb20gYW5pbWF0aW5nIGZvciB0b28gbG9uZ1xyXG4gICAgY29uc3QgdHJhbnNsYXRpb25TcGVlZCA9IHNjYWxlRGlzdGFuY2UgKiAoIDEgLyAoIE1hdGgucG93KCBzY2FsZURpc3RhbmNlLCAyICkgLSBNYXRoLnBvdyggbWF4U2NhbGVGYWN0b3IsIDIgKSApICsgbWF4U2NhbGVGYWN0b3IgKTtcclxuXHJcbiAgICAvLyB0cmFuc2xhdGlvblNwZWVkIGNvdWxkIGJlIG5lZ2F0aXZlIG9yIGdvIHRvIGluZmluaXR5IGR1ZSB0byB0aGUgYmVoYXZpb3Igb2YgdGhlIGV4cG9uZW50aWFsIGNhbGN1bGF0aW9uIGFib3ZlLlxyXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgdGhlIHNwZWVkIGlzIGNvbnN0cmFpbmVkIGFuZCBncmVhdGVyIHRoYW4gemVyby5cclxuICAgIGNvbnN0IGxpbWl0ZWRUcmFuc2xhdGlvblNwZWVkID0gTWF0aC5taW4oIE1hdGguYWJzKCB0cmFuc2xhdGlvblNwZWVkICksIE1BWF9UUkFOU0xBVElPTl9TUEVFRCAqIHRoaXMuZ2V0Q3VycmVudFNjYWxlKCkgKTtcclxuICAgIHJldHVybiBsaW1pdGVkVHJhbnNsYXRpb25TcGVlZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc2V0IGFsbCB0cmFuc2Zvcm1hdGlvbnMgb24gdGhlIHRhcmdldCBub2RlLCBhbmQgcmVzZXQgZGVzdGluYXRpb24gdGFyZ2V0cyB0byBzb3VyY2UgdmFsdWVzIHRvIHByZXZlbnQgYW55XHJcbiAgICogaW4gcHJvZ3Jlc3MgYW5pbWF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSByZXNldFRyYW5zZm9ybSgpOiB2b2lkIHtcclxuICAgIHN1cGVyLnJlc2V0VHJhbnNmb3JtKCk7XHJcbiAgICB0aGlzLnN0b3BJblByb2dyZXNzQW5pbWF0aW9uKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIG5leHQgZGlzY3JldGUgc2NhbGUgZnJvbSB0aGUgY3VycmVudCBzY2FsZS4gV2lsbCBiZSBvbmUgb2YgdGhlIHNjYWxlcyBhbG9uZyB0aGUgZGlzY3JldGVTY2FsZXMgbGlzdFxyXG4gICAqIGFuZCBsaW1pdGVkIGJ5IHRoZSBtaW4gYW5kIG1heCBzY2FsZXMgYXNzaWduZWQgdG8gdGhpcyBNdWx0aVBhblpvb21MaXN0ZW5lci5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB6b29tSW4gLSBkaXJlY3Rpb24gb2Ygem9vbSBjaGFuZ2UsIHBvc2l0aXZlIGlmIHpvb21pbmcgaW5cclxuICAgKiBAcmV0dXJucyBudW1iZXJcclxuICAgKi9cclxuICBwcml2YXRlIGdldE5leHREaXNjcmV0ZVNjYWxlKCB6b29tSW46IGJvb2xlYW4gKTogbnVtYmVyIHtcclxuXHJcbiAgICBjb25zdCBjdXJyZW50U2NhbGUgPSB0aGlzLmdldEN1cnJlbnRTY2FsZSgpO1xyXG5cclxuICAgIGxldCBuZWFyZXN0SW5kZXg6IG51bWJlciB8IG51bGwgPSBudWxsO1xyXG4gICAgbGV0IGRpc3RhbmNlVG9DdXJyZW50U2NhbGUgPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLmRpc2NyZXRlU2NhbGVzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBkaXN0YW5jZSA9IE1hdGguYWJzKCB0aGlzLmRpc2NyZXRlU2NhbGVzWyBpIF0gLSBjdXJyZW50U2NhbGUgKTtcclxuICAgICAgaWYgKCBkaXN0YW5jZSA8IGRpc3RhbmNlVG9DdXJyZW50U2NhbGUgKSB7XHJcbiAgICAgICAgZGlzdGFuY2VUb0N1cnJlbnRTY2FsZSA9IGRpc3RhbmNlO1xyXG4gICAgICAgIG5lYXJlc3RJbmRleCA9IGk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBuZWFyZXN0SW5kZXggPSBuZWFyZXN0SW5kZXghO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbmVhcmVzdEluZGV4ICE9PSBudWxsLCAnbmVhcmVzdEluZGV4IHNob3VsZCBoYXZlIGJlZW4gZm91bmQnICk7XHJcbiAgICBsZXQgbmV4dEluZGV4ID0gem9vbUluID8gbmVhcmVzdEluZGV4ICsgMSA6IG5lYXJlc3RJbmRleCAtIDE7XHJcbiAgICBuZXh0SW5kZXggPSBVdGlscy5jbGFtcCggbmV4dEluZGV4LCAwLCB0aGlzLmRpc2NyZXRlU2NhbGVzLmxlbmd0aCAtIDEgKTtcclxuICAgIHJldHVybiB0aGlzLmRpc2NyZXRlU2NhbGVzWyBuZXh0SW5kZXggXTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5kaXNwb3NlQW5pbWF0ZWRQYW5ab29tTGlzdGVuZXIoKTtcclxuICB9XHJcbn1cclxuXHJcbnR5cGUgS2V5UHJlc3NPcHRpb25zID0ge1xyXG5cclxuICAvLyBtYWduaXR1ZGUgZm9yIHRyYW5zbGF0aW9uIHZlY3RvciBmb3IgdGhlIHRhcmdldCBub2RlIGFzIGxvbmcgYXMgYXJyb3cga2V5cyBhcmUgaGVsZCBkb3duXHJcbiAgdHJhbnNsYXRpb25NYWduaXR1ZGU/OiBudW1iZXI7XHJcbn07XHJcblxyXG4vKipcclxuICogQSB0eXBlIHRoYXQgY29udGFpbnMgdGhlIGluZm9ybWF0aW9uIG5lZWRlZCB0byByZXNwb25kIHRvIGtleWJvYXJkIGlucHV0LlxyXG4gKi9cclxuY2xhc3MgS2V5UHJlc3Mge1xyXG5cclxuICAvLyBUaGUgdHJhbnNsYXRpb24gZGVsdGEgdmVjdG9yIHRoYXQgc2hvdWxkIGJlIGFwcGxpZWQgdG8gdGhlIHRhcmdldCBub2RlIGluIHJlc3BvbnNlIHRvIHRoZSBrZXkgcHJlc3Nlc1xyXG4gIHB1YmxpYyByZWFkb25seSB0cmFuc2xhdGlvblZlY3RvcjogVmVjdG9yMjtcclxuXHJcbiAgLy8gVGhlIHNjYWxlIHRoYXQgc2hvdWxkIGJlIGFwcGxpZWQgdG8gdGhlIHRhcmdldCBub2RlIGluIHJlc3BvbnNlIHRvIHRoZSBrZXkgcHJlc3NcclxuICBwdWJsaWMgcmVhZG9ubHkgc2NhbGU6IG51bWJlcjtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIGtleVN0YXRlVHJhY2tlclxyXG4gICAqIEBwYXJhbSBzY2FsZVxyXG4gICAqIEBwYXJhbSB0YXJnZXRTY2FsZSAtIHNjYWxlIGRlc2NyaWJpbmcgdGhlIHRhcmdldE5vZGUsIHNlZSBQYW5ab29tTGlzdGVuZXIuX3RhcmdldFNjYWxlXHJcbiAgICogQHBhcmFtIFtwcm92aWRlZE9wdGlvbnNdXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBrZXlTdGF0ZVRyYWNrZXI6IEtleVN0YXRlVHJhY2tlciwgc2NhbGU6IG51bWJlciwgdGFyZ2V0U2NhbGU6IG51bWJlciwgcHJvdmlkZWRPcHRpb25zPzogS2V5UHJlc3NPcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8S2V5UHJlc3NPcHRpb25zPigpKCB7XHJcbiAgICAgIHRyYW5zbGF0aW9uTWFnbml0dWRlOiA4MFxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgLy8gZGV0ZXJtaW5lIHJlc3VsdGluZyB0cmFuc2xhdGlvblxyXG4gICAgbGV0IHhEaXJlY3Rpb24gPSAwO1xyXG4gICAgeERpcmVjdGlvbiArPSBrZXlTdGF0ZVRyYWNrZXIuaXNLZXlEb3duKCBLZXlib2FyZFV0aWxzLktFWV9SSUdIVF9BUlJPVyApID8gMSA6IDA7XHJcbiAgICB4RGlyZWN0aW9uIC09IGtleVN0YXRlVHJhY2tlci5pc0tleURvd24oIEtleWJvYXJkVXRpbHMuS0VZX0xFRlRfQVJST1cgKSA/IDEgOiAwO1xyXG5cclxuICAgIGxldCB5RGlyZWN0aW9uID0gMDtcclxuICAgIHlEaXJlY3Rpb24gKz0ga2V5U3RhdGVUcmFja2VyLmlzS2V5RG93biggS2V5Ym9hcmRVdGlscy5LRVlfRE9XTl9BUlJPVyApID8gMSA6IDA7XHJcbiAgICB5RGlyZWN0aW9uIC09IGtleVN0YXRlVHJhY2tlci5pc0tleURvd24oIEtleWJvYXJkVXRpbHMuS0VZX1VQX0FSUk9XICkgPyAxIDogMDtcclxuXHJcbiAgICAvLyBkb24ndCBzZXQgbWFnbml0dWRlIGlmIHplcm8gdmVjdG9yIChhcyB2ZWN0b3Igd2lsbCBiZWNvbWUgaWxsLWRlZmluZWQpXHJcbiAgICBzY3JhdGNoVHJhbnNsYXRpb25WZWN0b3Iuc2V0WFkoIHhEaXJlY3Rpb24sIHlEaXJlY3Rpb24gKTtcclxuICAgIGlmICggIXNjcmF0Y2hUcmFuc2xhdGlvblZlY3Rvci5lcXVhbHMoIFZlY3RvcjIuWkVSTyApICkge1xyXG4gICAgICBjb25zdCB0cmFuc2xhdGlvbk1hZ25pdHVkZSA9IG9wdGlvbnMudHJhbnNsYXRpb25NYWduaXR1ZGUgKiB0YXJnZXRTY2FsZTtcclxuICAgICAgc2NyYXRjaFRyYW5zbGF0aW9uVmVjdG9yLnNldE1hZ25pdHVkZSggdHJhbnNsYXRpb25NYWduaXR1ZGUgKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyYW5zbGF0aW9uVmVjdG9yID0gc2NyYXRjaFRyYW5zbGF0aW9uVmVjdG9yO1xyXG4gICAgdGhpcy5zY2FsZSA9IHNjYWxlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcHV0ZSB0aGUgdGFyZ2V0IHBvc2l0aW9uIGZvciBzY2FsaW5nIGZyb20gYSBrZXkgcHJlc3MuIFRoZSB0YXJnZXQgbm9kZSB3aWxsIGFwcGVhciB0byBnZXQgbGFyZ2VyIGFuZCB6b29tXHJcbiAgICogaW50byB0aGlzIHBvaW50LiBJZiBmb2N1cyBpcyB3aXRoaW4gdGhlIERpc3BsYXksIHdlIHpvb20gaW50byB0aGUgZm9jdXNlZCBub2RlLiBJZiBub3QgYW5kIGZvY3VzYWJsZSBjb250ZW50XHJcbiAgICogZXhpc3RzIGluIHRoZSBkaXNwbGF5LCB3ZSB6b29tIGludG8gdGhlIGZpcnN0IGZvY3VzYWJsZSBjb21wb25lbnQuIE90aGVyd2lzZSwgd2Ugem9vbSBpbnRvIHRoZSB0b3AgbGVmdCBjb3JuZXJcclxuICAgKiBvZiB0aGUgc2NyZWVuLlxyXG4gICAqXHJcbiAgICogVGhpcyBmdW5jdGlvbiBjb3VsZCBiZSBleHBlbnNpdmUsIHNvIHdlIG9ubHkgY2FsbCBpdCBpZiB3ZSBrbm93IHRoYXQgdGhlIGtleSBwcmVzcyBpcyBhIFwic2NhbGVcIiBnZXN0dXJlLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgYSBzY3JhdGNoIFZlY3RvcjIgaW5zdGFuY2Ugd2l0aCB0aGUgdGFyZ2V0IHBvc2l0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGNvbXB1dGVTY2FsZVRhcmdldEZyb21LZXlQcmVzcygpOiBWZWN0b3IyIHtcclxuXHJcbiAgICAvLyBkZWZhdWx0IGNhdXNlLCBzY2FsZSB0YXJnZXQgd2lsbCBiZSBvcmlnaW4gb2YgdGhlIHNjcmVlblxyXG4gICAgc2NyYXRjaFNjYWxlVGFyZ2V0VmVjdG9yLnNldFhZKCAwLCAwICk7XHJcblxyXG4gICAgLy8gem9vbSBpbnRvIHRoZSBmb2N1c2VkIE5vZGUgaWYgaXQgaGFzIGRlZmluZWQgYm91bmRzLCBpdCBtYXkgbm90IGlmIGl0IGlzIGZvciBjb250cm9sbGluZyB0aGVcclxuICAgIC8vIHZpcnR1YWwgY3Vyc29yIGFuZCBoYXMgYW4gaW52aXNpYmxlIGZvY3VzIGhpZ2hsaWdodFxyXG4gICAgY29uc3QgZm9jdXMgPSBGb2N1c01hbmFnZXIucGRvbUZvY3VzUHJvcGVydHkudmFsdWU7XHJcbiAgICBpZiAoIGZvY3VzICkge1xyXG4gICAgICBjb25zdCBmb2N1c1RyYWlsID0gZm9jdXMudHJhaWw7XHJcbiAgICAgIGNvbnN0IGZvY3VzZWROb2RlID0gZm9jdXNUcmFpbC5sYXN0Tm9kZSgpO1xyXG4gICAgICBpZiAoIGZvY3VzZWROb2RlLmJvdW5kcy5pc0Zpbml0ZSgpICkge1xyXG4gICAgICAgIHNjcmF0Y2hTY2FsZVRhcmdldFZlY3Rvci5zZXQoIGZvY3VzVHJhaWwucGFyZW50VG9HbG9iYWxQb2ludCggZm9jdXNlZE5vZGUuY2VudGVyICkgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcblxyXG4gICAgICAvLyBubyBmb2N1c2FibGUgZWxlbWVudCBpbiB0aGUgRGlzcGxheSBzbyB0cnkgdG8gem9vbSBpbnRvIHRoZSBmaXJzdCBmb2N1c2FibGUgZWxlbWVudFxyXG4gICAgICBjb25zdCBmaXJzdEZvY3VzYWJsZSA9IFBET01VdGlscy5nZXROZXh0Rm9jdXNhYmxlKCk7XHJcbiAgICAgIGlmICggZmlyc3RGb2N1c2FibGUgIT09IGRvY3VtZW50LmJvZHkgKSB7XHJcblxyXG4gICAgICAgIC8vIGlmIG5vdCB0aGUgYm9keSwgZm9jdXNlZCBub2RlIHNob3VsZCBiZSBjb250YWluZWQgYnkgdGhlIGJvZHkgLSBlcnJvciBsb3VkbHkgaWYgdGhlIGJyb3dzZXIgcmVwb3J0c1xyXG4gICAgICAgIC8vIHRoYXQgdGhpcyBpcyBub3QgdGhlIGNhc2VcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBkb2N1bWVudC5ib2R5LmNvbnRhaW5zKCBmaXJzdEZvY3VzYWJsZSApLCAnZm9jdXNhYmxlIHNob3VsZCBiZSBhdHRhY2hlZCB0byB0aGUgYm9keScgKTtcclxuXHJcbiAgICAgICAgLy8gYXNzdW1lcyB0aGF0IGZvY3VzYWJsZSBET00gZWxlbWVudHMgYXJlIGNvcnJlY3RseSBwb3NpdGlvbmVkLCB3aGljaCBzaG91bGQgYmUgdGhlIGNhc2UgLSBhbiBhbHRlcm5hdGl2ZVxyXG4gICAgICAgIC8vIGNvdWxkIGJlIHRvIHVzZSBEaXNwbGF0LmdldFRyYWlsRnJvbVBET01JbmRpY2VzU3RyaW5nKCksIGJ1dCB0aGF0IGZ1bmN0aW9uIHJlcXVpcmVzIGluZm9ybWF0aW9uIHRoYXQgaXMgbm90XHJcbiAgICAgICAgLy8gYXZhaWxhYmxlIGhlcmUuXHJcbiAgICAgICAgY29uc3QgY2VudGVyWCA9IGZpcnN0Rm9jdXNhYmxlLm9mZnNldExlZnQgKyBmaXJzdEZvY3VzYWJsZS5vZmZzZXRXaWR0aCAvIDI7XHJcbiAgICAgICAgY29uc3QgY2VudGVyWSA9IGZpcnN0Rm9jdXNhYmxlLm9mZnNldFRvcCArIGZpcnN0Rm9jdXNhYmxlLm9mZnNldEhlaWdodCAvIDI7XHJcbiAgICAgICAgc2NyYXRjaFNjYWxlVGFyZ2V0VmVjdG9yLnNldFhZKCBjZW50ZXJYLCBjZW50ZXJZICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBzY3JhdGNoU2NhbGVUYXJnZXRWZWN0b3IuaXNGaW5pdGUoKSwgJ3RhcmdldCBwb3NpdGlvbiBub3QgZGVmaW5lZCcgKTtcclxuICAgIHJldHVybiBzY3JhdGNoU2NhbGVUYXJnZXRWZWN0b3I7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQSB0eXBlIHRoYXQgY29udGFpbnMgdGhlIGluZm9ybWF0aW9uIG5lZWRlZCB0byByZXNwb25kIHRvIGEgd2hlZWwgaW5wdXQuXHJcbiAqL1xyXG5jbGFzcyBXaGVlbCB7XHJcblxyXG4gIC8vIGlzIHRoZSBjdHJsIGtleSBkb3duIGR1cmluZyB0aGlzIHdoZWVsIGlucHV0PyBDYW5ub3QgdXNlIEtleVN0YXRlVHJhY2tlciBiZWNhdXNlIHRoZVxyXG4gIC8vIGN0cmwga2V5IG1pZ2h0IGJlICdkb3duJyBvbiB0aGlzIGV2ZW50IHdpdGhvdXQgZ29pbmcgdGhyb3VnaCB0aGUga2V5Ym9hcmQuIEZvciBleGFtcGxlLCB3aXRoIGEgdHJhY2twYWRcclxuICAvLyB0aGUgYnJvd3NlciBzZXRzIGN0cmxLZXkgdHJ1ZSB3aXRoIHRoZSB6b29tIGdlc3R1cmUuXHJcbiAgcHVibGljIHJlYWRvbmx5IGlzQ3RybEtleURvd246IGJvb2xlYW47XHJcblxyXG4gIC8vIG1hZ25pdHVkZSBhbmQgZGlyZWN0aW9uIG9mIHNjYWxlIGNoYW5nZSBmcm9tIHRoZSB3aGVlbCBpbnB1dFxyXG4gIHB1YmxpYyByZWFkb25seSBzY2FsZURlbHRhOiBudW1iZXI7XHJcblxyXG4gIC8vIHRoZSB0YXJnZXQgb2YgdGhlIHdoZWVsIGlucHV0IGluIHRoZSBnbG9iYWwgY29vcmRpbmF0ZSBmcmFtZVxyXG4gIHB1YmxpYyByZWFkb25seSB0YXJnZXRQb2ludDogVmVjdG9yMjtcclxuXHJcbiAgLy8gdGhlIHRyYW5zbGF0aW9uIHZlY3RvciBmb3IgdGhlIHRhcmdldCBub2RlIGluIHJlc3BvbnNlIHRvIHRoZSB3aGVlbCBpbnB1dFxyXG4gIHB1YmxpYyByZWFkb25seSB0cmFuc2xhdGlvblZlY3RvcjogVmVjdG9yMjtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIGV2ZW50XHJcbiAgICogQHBhcmFtIHRhcmdldFNjYWxlIC0gc2NhbGUgZGVzY3JpYmluZyB0aGUgdGFyZ2V0Tm9kZSwgc2VlIFBhblpvb21MaXN0ZW5lci5fdGFyZ2V0U2NhbGVcclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIGV2ZW50OiBTY2VuZXJ5RXZlbnQsIHRhcmdldFNjYWxlOiBudW1iZXIgKSB7XHJcbiAgICBjb25zdCBkb21FdmVudCA9IGV2ZW50LmRvbUV2ZW50IGFzIFdoZWVsRXZlbnQ7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBkb21FdmVudCBpbnN0YW5jZW9mIFdoZWVsRXZlbnQsICdTY2VuZXJ5RXZlbnQgc2hvdWxkIGhhdmUgYSBET01FdmVudCBmcm9tIHRoZSB3aGVlbCBpbnB1dCcgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zaW1wbGUtdHlwZS1jaGVja2luZy1hc3NlcnRpb25zXHJcblxyXG4gICAgdGhpcy5pc0N0cmxLZXlEb3duID0gZG9tRXZlbnQuY3RybEtleTtcclxuICAgIHRoaXMuc2NhbGVEZWx0YSA9IGRvbUV2ZW50LmRlbHRhWSA+IDAgPyAtMC41IDogMC41O1xyXG4gICAgdGhpcy50YXJnZXRQb2ludCA9IGV2ZW50LnBvaW50ZXIucG9pbnQ7XHJcblxyXG4gICAgLy8gdGhlIERPTSBFdmVudCBzcGVjaWZpZXMgZGVsdGFzIHRoYXQgbG9vayBhcHByb3ByaWF0ZSBhbmQgd29ya3Mgd2VsbCBpbiBkaWZmZXJlbnQgY2FzZXMgbGlrZVxyXG4gICAgLy8gbW91c2Ugd2hlZWwgYW5kIHRyYWNrcGFkIGlucHV0LCBib3RoIHdoaWNoIHRyaWdnZXIgd2hlZWwgZXZlbnRzIGJ1dCBhdCBkaWZmZXJlbnQgcmF0ZXMgd2l0aCBkaWZmZXJlbnRcclxuICAgIC8vIGRlbHRhIHZhbHVlcyAtIGJ1dCB0aGV5IGFyZSBnZW5lcmFsbHkgdG9vIGxhcmdlLCByZWR1Y2luZyBhIGJpdCBmZWVscyBtb3JlIG5hdHVyYWwgYW5kIGdpdmVzIG1vcmUgY29udHJvbFxyXG4gICAgbGV0IHRyYW5zbGF0aW9uWCA9IGRvbUV2ZW50LmRlbHRhWCAqIDAuNTtcclxuICAgIGxldCB0cmFuc2xhdGlvblkgPSBkb21FdmVudC5kZWx0YVkgKiAwLjU7XHJcblxyXG4gICAgLy8gRmlyZUZveCBkZWZhdWx0cyB0byBzY3JvbGxpbmcgaW4gdW5pdHMgb2YgXCJsaW5lc1wiIHJhdGhlciB0aGFuIHBpeGVscywgcmVzdWx0aW5nIGluIHNsb3cgbW92ZW1lbnQgLSBzcGVlZCB1cFxyXG4gICAgLy8gdHJhbnNsYXRpb24gaW4gdGhpcyBjYXNlXHJcbiAgICBpZiAoIGRvbUV2ZW50LmRlbHRhTW9kZSA9PT0gd2luZG93LldoZWVsRXZlbnQuRE9NX0RFTFRBX0xJTkUgKSB7XHJcbiAgICAgIHRyYW5zbGF0aW9uWCA9IHRyYW5zbGF0aW9uWCAqIDI1O1xyXG4gICAgICB0cmFuc2xhdGlvblkgPSB0cmFuc2xhdGlvblkgKiAyNTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyYW5zbGF0aW9uVmVjdG9yID0gc2NyYXRjaFRyYW5zbGF0aW9uVmVjdG9yLnNldFhZKCB0cmFuc2xhdGlvblggKiB0YXJnZXRTY2FsZSwgdHJhbnNsYXRpb25ZICogdGFyZ2V0U2NhbGUgKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBIHByZXNzIGZyb20gYSBtaWRkbGUgbW91c2UgYnV0dG9uLiBXaWxsIGluaXRpYXRlIHBhbm5pbmcgYW5kIGRlc3RpbmF0aW9uIHBvc2l0aW9uIHdpbGwgYmUgdXBkYXRlZCBmb3IgYXMgbG9uZ1xyXG4gKiBhcyB0aGUgUG9pbnRlciBwb2ludCBpcyBkcmFnZ2VkIGF3YXkgZnJvbSB0aGUgaW5pdGlhbCBwb2ludC5cclxuICovXHJcbmNsYXNzIE1pZGRsZVByZXNzIHtcclxuXHJcbiAgcHVibGljIHJlYWRvbmx5IHBvaW50ZXI6IE1vdXNlO1xyXG4gIHB1YmxpYyByZWFkb25seSB0cmFpbDogVHJhaWw7XHJcblxyXG4gIC8vIHBvaW50IG9mIHByZXNzIGluIHRoZSBnbG9iYWwgY29vcmRpbmF0ZSBmcmFtZVxyXG4gIHB1YmxpYyByZWFkb25seSBpbml0aWFsUG9pbnQ6IFZlY3RvcjI7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggcG9pbnRlcjogTW91c2UsIHRyYWlsOiBUcmFpbCApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHBvaW50ZXIudHlwZSA9PT0gJ21vdXNlJywgJ2luY29ycmVjdCBwb2ludGVyIHR5cGUnICk7XHJcblxyXG4gICAgdGhpcy5wb2ludGVyID0gcG9pbnRlcjtcclxuICAgIHRoaXMudHJhaWwgPSB0cmFpbDtcclxuXHJcbiAgICB0aGlzLmluaXRpYWxQb2ludCA9IHBvaW50ZXIucG9pbnQuY29weSgpO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEhlbHBlciBmdW5jdGlvbiwgY2FsY3VsYXRlcyBkaXNjcmV0ZSBzY2FsZXMgYmV0d2VlbiBtaW4gYW5kIG1heCBzY2FsZSBsaW1pdHMuIENyZWF0ZXMgaW5jcmVhc2luZyBzdGVwIHNpemVzXHJcbiAqIHNvIHRoYXQgeW91IHpvb20gaW4gZnJvbSBoaWdoIHpvb20gcmVhY2hlcyB0aGUgbWF4IGZhc3RlciB3aXRoIGZld2VyIGtleSBwcmVzc2VzLiBUaGlzIGlzIHN0YW5kYXJkIGJlaGF2aW9yIGZvclxyXG4gKiBicm93c2VyIHpvb20uXHJcbiAqL1xyXG5jb25zdCBjYWxjdWxhdGVEaXNjcmV0ZVNjYWxlcyA9ICggbWluU2NhbGU6IG51bWJlciwgbWF4U2NhbGU6IG51bWJlciApOiBudW1iZXJbXSA9PiB7XHJcblxyXG4gIGFzc2VydCAmJiBhc3NlcnQoIG1pblNjYWxlID49IDEsICdtaW4gc2NhbGVzIGxlc3MgdGhhbiBvbmUgYXJlIGN1cnJlbnRseSBub3Qgc3VwcG9ydGVkJyApO1xyXG5cclxuICAvLyB3aWxsIHRha2UgdGhpcyBtYW55IGtleSBwcmVzc2VzIHRvIHJlYWNoIG1heGltdW0gc2NhbGUgZnJvbSBtaW5pbXVtIHNjYWxlXHJcbiAgY29uc3Qgc3RlcHMgPSA4O1xyXG5cclxuICAvLyBicmVhayB0aGUgcmFuZ2UgZnJvbSBtaW4gdG8gbWF4IHNjYWxlIGludG8gc3RlcHMsIHRoZW4gZXhwb25lbnRpYXRlXHJcbiAgY29uc3QgZGlzY3JldGVTY2FsZXMgPSBbXTtcclxuICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzdGVwczsgaSsrICkge1xyXG4gICAgZGlzY3JldGVTY2FsZXNbIGkgXSA9ICggbWF4U2NhbGUgLSBtaW5TY2FsZSApIC8gc3RlcHMgKiAoIGkgKiBpICk7XHJcbiAgfVxyXG5cclxuICAvLyBub3JtYWxpemUgc3RlcHMgYmFjayBpbnRvIHJhbmdlIG9mIHRoZSBtaW4gYW5kIG1heCBzY2FsZSBmb3IgdGhpcyBsaXN0ZW5lclxyXG4gIGNvbnN0IGRpc2NyZXRlU2NhbGVzTWF4ID0gZGlzY3JldGVTY2FsZXNbIHN0ZXBzIC0gMSBdO1xyXG4gIGZvciAoIGxldCBpID0gMDsgaSA8IGRpc2NyZXRlU2NhbGVzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgZGlzY3JldGVTY2FsZXNbIGkgXSA9IG1pblNjYWxlICsgZGlzY3JldGVTY2FsZXNbIGkgXSAqICggbWF4U2NhbGUgLSBtaW5TY2FsZSApIC8gZGlzY3JldGVTY2FsZXNNYXg7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZGlzY3JldGVTY2FsZXM7XHJcbn07XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnQW5pbWF0ZWRQYW5ab29tTGlzdGVuZXInLCBBbmltYXRlZFBhblpvb21MaXN0ZW5lciApO1xyXG5leHBvcnQgZGVmYXVsdCBBbmltYXRlZFBhblpvb21MaXN0ZW5lcjsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLE9BQU8sTUFBTSw0QkFBNEI7QUFDaEQsT0FBT0MsT0FBTyxNQUFNLDRCQUE0QjtBQUNoRCxPQUFPQyxLQUFLLE1BQU0sMEJBQTBCO0FBQzVDLE9BQU9DLE9BQU8sTUFBTSw0QkFBNEI7QUFDaEQsT0FBT0MsUUFBUSxNQUFNLG1DQUFtQztBQUN4RCxPQUFPQyxTQUFTLE1BQU0saUNBQWlDO0FBQ3ZELE9BQU9DLDRCQUE0QixNQUFNLG9EQUFvRDtBQUM3RixPQUFPQyxZQUFZLE1BQU0sb0NBQW9DO0FBQzdELFNBQVNDLE9BQU8sRUFBU0MsWUFBWSxFQUFFQyxxQkFB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