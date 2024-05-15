// Copyright 2013-2024, University of Colorado Boulder

/**
 * Main handler for user-input events in Scenery.
 *
 * *** Adding input handling to a display
 *
 * Displays do not have event listeners attached by default. To initialize the event system (that will set up
 * listeners), use one of Display's initialize*Events functions.
 *
 * *** Pointers
 *
 * A 'pointer' is an abstract way of describing a mouse, a single touch point, or a pen/stylus, similar to in the
 * Pointer Events specification (https://dvcs.w3.org/hg/pointerevents/raw-file/tip/pointerEvents.html). Touch and pen
 * pointers are transient, created when the relevant DOM down event occurs and released when corresponding the DOM up
 * or cancel event occurs. However, the mouse pointer is persistent.
 *
 * Input event listeners can be added to {Node}s directly, or to a pointer. When a DOM event is received, it is first
 * broken up into multiple events (if necessary, e.g. multiple touch points), then the dispatch is handled for each
 * individual Scenery event. Events are first fired for any listeners attached to the pointer that caused the event,
 * then fire on the node directly under the pointer, and if applicable, bubble up the graph to the Scene from which the
 * event was triggered. Events are not fired directly on nodes that are not under the pointer at the time of the event.
 * To handle many common patterns (like button presses, where mouse-ups could happen when not over the button), it is
 * necessary to add those move/up listeners to the pointer itself.
 *
 * *** Listeners and Events
 *
 * Event listeners are added with node.addInputListener( listener ), pointer.addInputListener( listener ) and
 * display.addInputListener( listener ).
 * This listener can be an arbitrary object, and the listener will be triggered by calling listener[eventType]( event ),
 * where eventType is one of the event types as described below, and event is a Scenery event with the
 * following properties:
 * - trail {Trail} - Points to the node under the pointer
 * - pointer {Pointer} - The pointer that triggered the event. Additional information about the mouse/touch/pen can be
 *                       obtained from the pointer, for example event.pointer.point.
 * - type {string} - The base type of the event (e.g. for touch down events, it will always just be "down").
 * - domEvent {UIEvent} - The underlying DOM event that triggered this Scenery event. The DOM event may correspond to
 *                        multiple Scenery events, particularly for touch events. This could be a TouchEvent,
 *                        PointerEvent, MouseEvent, MSPointerEvent, etc.
 * - target {Node} - The leaf-most Node in the trail.
 * - currentTarget {Node} - The Node to which the listener being fired is attached, or null if the listener is being
 *                          fired directly from a pointer.
 *
 * Additionally, listeners may support an interrupt() method that detaches it from pointers, or may support being
 * "attached" to a pointer (indicating a primary role in controlling the pointer's behavior). See Pointer for more
 * information about these interactions.
 *
 * *** Event Types
 *
 * Scenery will fire the following base event types:
 *
 * - down: Triggered when a pointer is pressed down. Touch / pen pointers are created for each down event, and are
 *         active until an up/cancel event is sent.
 * - up: Triggered when a pointer is released normally. Touch / pen pointers will not have any more events associated
 *       with them after an up event.
 * - cancel: Triggered when a pointer is canceled abnormally. Touch / pen pointers will not have any more events
 *           associated with them after an up event.
 * - move: Triggered when a pointer moves.
 * - wheel: Triggered when the (mouse) wheel is scrolled. The associated pointer will have wheelDelta information.
 * - enter: Triggered when a pointer moves over a Node or one of its children. Does not bubble up. Mirrors behavior from
 *          the DOM mouseenter (http://www.w3.org/TR/DOM-Level-3-Events/#event-type-mouseenter)
 * - exit:  Triggered when a pointer moves out from over a Node or one of its children. Does not bubble up. Mirrors
 *          behavior from the DOM mouseleave (http://www.w3.org/TR/DOM-Level-3-Events/#event-type-mouseleave).
 * - over: Triggered when a pointer moves over a Node (not including its children). Mirrors behavior from the DOM
 *         mouseover (http://www.w3.org/TR/DOM-Level-3-Events/#event-type-mouseover).
 * - out: Triggered when a pointer moves out from over a Node (not including its children). Mirrors behavior from the
 *        DOM mouseout (http://www.w3.org/TR/DOM-Level-3-Events/#event-type-mouseout).
 *
 * Before firing the base event type (for example, 'move'), Scenery will also fire an event specific to the type of
 * pointer. For mice, it will fire 'mousemove', for touch events it will fire 'touchmove', and for pen events it will
 * fire 'penmove'. Similarly, for any type of event, it will first fire pointerType+eventType, and then eventType.
 *
 * **** PDOM Specific Event Types
 *
 * Some event types can only be triggered from the PDOM. If a SCENERY/Node has accessible content (see
 * ParallelDOM.js for more info), then listeners can be added for events fired from the PDOM. The accessibility events
 * triggered from a Node are dependent on the `tagName` (ergo the HTMLElement primary sibling) specified by the Node.
 *
 * Some terminology for understanding:
 * - PDOM:  parallel DOM, see ParallelDOM.js
 * - Primary Sibling:  The Node's HTMLElement in the PDOM that is interacted with for accessible interactions and to
 *                     display accessible content. The primary sibling has the tag name specified by the `tagName`
 *                     option, see `ParallelDOM.setTagName`. Primary sibling is further defined in PDOMPeer.js
 * - Assistive Technology:  aka AT, devices meant to improve the capabilities of an individual with a disability.
 *
 * The following are the supported accessible events:
 *
 * - focus: Triggered when navigation focus is set to this Node's primary sibling. This can be triggered with some
 *          AT too, like screen readers' virtual cursor, but that is not dependable as it can be toggled with a screen
 *          reader option. Furthermore, this event is not triggered on mobile devices. Does not bubble.
 * - focusin: Same as 'focus' event, but bubbles.
 * - blur:  Triggered when navigation focus leaves this Node's primary sibling. This can be triggered with some
 *          AT too, like screen readers' virtual cursor, but that is not dependable as it can be toggled with a screen
 *          reader option. Furthermore, this event is not triggered on mobile devices.
 * - focusout: Same as 'blur' event, but bubbles.
 * - click:  Triggered when this Node's primary sibling is clicked. Note, though this event seems similar to some base
 *           event types (the event implements `MouseEvent`), it only applies when triggered from the PDOM.
 *           See https://www.w3.org/TR/DOM-Level-3-Events/#click
 * - input:  Triggered when the value of an <input>, <select>, or <textarea> element has been changed.
 *           See https://www.w3.org/TR/DOM-Level-3-Events/#input
 * - change:  Triggered for <input>, <select>, and <textarea> elements when an alteration to the element's value is
 *            committed by the user. Unlike the input event, the change event is not necessarily fired for each
 *            alteration to an element's value. See
 *            https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event and
 *            https://html.spec.whatwg.org/multipage/indices.html#event-change
 * - keydown: Triggered for all keys pressed. When a screen reader is active, this event will be omitted
 *            role="button" is activated.
 *            See https://www.w3.org/TR/DOM-Level-3-Events/#keydown
 * - keyup :  Triggered for all keys when released. When a screen reader is active, this event will be omitted
 *            role="button" is activated.
 *            See https://www.w3.org/TR/DOM-Level-3-Events/#keyup
 *
 * *** Event Dispatch
 *
 * Events have two methods that will cause early termination: event.abort() will cause no more listeners to be notified
 * for this event, and event.handle() will allow the current level of listeners to be notified (all pointer listeners,
 * or all listeners attached to the current node), but no more listeners after that level will fire. handle and abort
 * are like stopPropagation, stopImmediatePropagation for DOM events, except they do not trigger those DOM methods on
 * the underlying DOM event.
 *
 * Up/down/cancel events all happen separately, but for move events, a specific sequence of events occurs if the pointer
 * changes the node it is over:
 *
 * 1. The move event is fired (and bubbles).
 * 2. An out event is fired for the old topmost Node (and bubbles).
 * 3. exit events are fired for all Nodes in the Trail hierarchy that are now not under the pointer, from the root-most
 *    to the leaf-most. Does not bubble.
 * 4. enter events are fired for all Nodes in the Trail hierarchy that were not under the pointer (but now are), from
 *    the leaf-most to the root-most. Does not bubble.
 * 5. An over event is fired for the new topmost Node (and bubbles).
 *
 * event.abort() and event.handle() will currently not affect other stages in the 'move' sequence (e.g. event.abort() in
 * the 'move' event will not affect the following 'out' event).
 *
 * For each event type:
 *
 * 1. Listeners on the pointer will be triggered first (in the order they were added)
 * 2. Listeners on the target (top-most) Node will be triggered (in the order they were added to that Node)
 * 3. Then if the event bubbles, each Node in the Trail will be triggered, starting from the Node under the top-most
 *    (that just had listeners triggered) and all the way down to the Scene. Listeners are triggered in the order they
 *    were added for each Node.
 * 4. Listeners on the display will be triggered (in the order they were added)
 *
 * For each listener being notified, it will fire the more specific pointerType+eventType first (e.g. 'mousemove'),
 * then eventType next (e.g. 'move').
 *
 * Currently, preventDefault() is called on the associated DOM event if the top-most node has the 'interactive' property
 * set to a truthy value.
 *
 * *** Relevant Specifications
 *
 * DOM Level 3 events spec: http://www.w3.org/TR/DOM-Level-3-Events/
 * Touch events spec: http://www.w3.org/TR/touch-events/
 * Pointer events spec draft: https://dvcs.w3.org/hg/pointerevents/raw-file/tip/pointerEvents.html
 *                            http://msdn.microsoft.com/en-us/library/ie/hh673557(v=vs.85).aspx
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Sam Reid (PhET Interactive Simulations)
 */

import PhetioAction from '../../../tandem/js/PhetioAction.js';
import TinyEmitter from '../../../axon/js/TinyEmitter.js';
import Vector2 from '../../../dot/js/Vector2.js';
import cleanArray from '../../../phet-core/js/cleanArray.js';
import optionize from '../../../phet-core/js/optionize.js';
import platform from '../../../phet-core/js/platform.js';
import EventType from '../../../tandem/js/EventType.js';
import NullableIO from '../../../tandem/js/types/NullableIO.js';
import NumberIO from '../../../tandem/js/types/NumberIO.js';
import { BatchedDOMEvent, BatchedDOMEventType, BrowserEvents, Display, EventContext, EventContextIO, Mouse, PDOMInstance, PDOMPointer, PDOMUtils, Pen, Pointer, scenery, SceneryEvent, Touch, Trail } from '../imports.js';
import PhetioObject from '../../../tandem/js/PhetioObject.js';
import IOType from '../../../tandem/js/types/IOType.js';
import ArrayIO from '../../../tandem/js/types/ArrayIO.js';
const ArrayIOPointerIO = ArrayIO(Pointer.PointerIO);

// This is the list of keys that get serialized AND deserialized. NOTE: Do not add or change this without
// consulting the PhET-iO IOType schema for this in EventIO
const domEventPropertiesToSerialize = ['altKey', 'button', 'charCode', 'clientX', 'clientY', 'code', 'ctrlKey', 'deltaMode', 'deltaX', 'deltaY', 'deltaZ', 'key', 'keyCode', 'metaKey', 'pageX', 'pageY', 'pointerId', 'pointerType', 'scale', 'shiftKey', 'target', 'type', 'relatedTarget', 'which'];

// The list of serialized properties needed for deserialization

// Cannot be set after construction, and should be provided in the init config to the constructor(), see Input.deserializeDOMEvent
const domEventPropertiesSetInConstructor = ['deltaMode', 'deltaX', 'deltaY', 'deltaZ', 'altKey', 'button', 'charCode', 'clientX', 'clientY', 'code', 'ctrlKey', 'key', 'keyCode', 'metaKey', 'pageX', 'pageY', 'pointerId', 'pointerType', 'shiftKey', 'type', 'relatedTarget', 'which'];
// A list of keys on events that need to be serialized into HTMLElements
const EVENT_KEY_VALUES_AS_ELEMENTS = ['target', 'relatedTarget'];

// A list of events that should still fire, even when the Node is not pickable
const PDOM_UNPICKABLE_EVENTS = ['focus', 'blur', 'focusin', 'focusout'];
const TARGET_SUBSTITUTE_KEY = 'targetSubstitute';
// A bit more than the maximum amount of time that iOS 14 VoiceOver was observed to delay between
// sending a mouseup event and a click event.
const PDOM_CLICK_DELAY = 80;
export default class Input extends PhetioObject {
  // Pointer for accessibility, only created lazily on first pdom event.

  // Pointer for mouse, only created lazily on first mouse event, so no mouse is allocated on tablets.

  // All active pointers.

  // Whether we are currently firing events. We need to track this to handle re-entrant cases
  // like https://github.com/phetsims/balloons-and-static-electricity/issues/406.

  currentSceneryEvent = null;

  // In miliseconds, the DOMEvent timeStamp when we receive a logical up event.
  // We can compare this to the timeStamp on a click vent to filter out the click events
  // when some screen readers send both down/up events AND click events to the target
  // element, see https://github.com/phetsims/scenery/issues/1094

  // Emits pointer validation to the input stream for playback
  // This is a high frequency event that is necessary for reproducible playbacks

  // If accessible

  static InputIO = new IOType('InputIO', {
    valueType: Input,
    applyState: _.noop,
    toStateObject: input => {
      return {
        pointers: ArrayIOPointerIO.toStateObject(input.pointers)
      };
    },
    stateSchema: {
      pointers: ArrayIOPointerIO
    }
  });

  /**
   * @param display
   * @param attachToWindow - Whether to add listeners to the window (instead of the Display's domElement).
   * @param batchDOMEvents - If true, most event types will be batched until otherwise triggered.
   * @param assumeFullWindow - We can optimize certain things like computing points if we know the display
   *                                     fills the entire window.
   * @param passiveEvents - See Display's documentation (controls the presence of the passive flag for
   *                                       events, which has some advanced considerations).
   *
   * @param [providedOptions]
   */
  constructor(display, attachToWindow, batchDOMEvents, assumeFullWindow, passiveEvents, providedOptions) {
    const options = optionize()({
      phetioType: Input.InputIO,
      phetioDocumentation: 'Central point for user input events, such as mouse, touch'
    }, providedOptions);
    super(options);
    this.display = display;
    this.rootNode = display.rootNode;
    this.attachToWindow = attachToWindow;
    this.batchDOMEvents = batchDOMEvents;
    this.assumeFullWindow = assumeFullWindow;
    this.passiveEvents = passiveEvents;
    this.batchedEvents = [];
    this.pdomPointer = null;
    this.mouse = null;
    this.pointers = [];
    this.pointerAddedEmitter = new TinyEmitter();
    this.currentlyFiringEvents = false;
    this.upTimeStamp = 0;

    ////////////////////////////////////////////////////
    // Declare the Actions that send scenery input events to the PhET-iO data stream.  Note they use the default value
    // of phetioReadOnly false, in case a client wants to synthesize events.

    this.validatePointersAction = new PhetioAction(() => {
      let i = this.pointers.length;
      while (i--) {
        const pointer = this.pointers[i];
        if (pointer.point && pointer !== this.pdomPointer) {
          this.branchChangeEvents(pointer, pointer.lastEventContext || EventContext.createSynthetic(), false);
        }
      }
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('validatePointersAction'),
      phetioHighFrequency: true
    });
    this.mouseUpAction = new PhetioAction((point, context) => {
      const mouse = this.ensureMouse(point);
      mouse.id = null;
      this.upEvent(mouse, context, point);
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('mouseUpAction'),
      parameters: [{
        name: 'point',
        phetioType: Vector2.Vector2IO
      }, {
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when a mouse button is released.'
    });
    this.mouseDownAction = new PhetioAction((id, point, context) => {
      const mouse = this.ensureMouse(point);
      mouse.id = id;
      this.downEvent(mouse, context, point);
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('mouseDownAction'),
      parameters: [{
        name: 'id',
        phetioType: NullableIO(NumberIO)
      }, {
        name: 'point',
        phetioType: Vector2.Vector2IO
      }, {
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when a mouse button is pressed.'
    });
    this.mouseMoveAction = new PhetioAction((point, context) => {
      const mouse = this.ensureMouse(point);
      mouse.move(point);
      this.moveEvent(mouse, context);
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('mouseMoveAction'),
      parameters: [{
        name: 'point',
        phetioType: Vector2.Vector2IO
      }, {
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when the mouse is moved.',
      phetioHighFrequency: true
    });
    this.mouseOverAction = new PhetioAction((point, context) => {
      const mouse = this.ensureMouse(point);
      mouse.over(point);
      // TODO: how to handle mouse-over (and log it)... are we changing the pointer.point without a branch change? https://github.com/phetsims/scenery/issues/1581
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('mouseOverAction'),
      parameters: [{
        name: 'point',
        phetioType: Vector2.Vector2IO
      }, {
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when the mouse is moved while on the sim.'
    });
    this.mouseOutAction = new PhetioAction((point, context) => {
      const mouse = this.ensureMouse(point);
      mouse.out(point);
      // TODO: how to handle mouse-out (and log it)... are we changing the pointer.point without a branch change? https://github.com/phetsims/scenery/issues/1581
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('mouseOutAction'),
      parameters: [{
        name: 'point',
        phetioType: Vector2.Vector2IO
      }, {
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when the mouse moves out of the display.'
    });
    this.wheelScrollAction = new PhetioAction(context => {
      const event = context.domEvent;
      const mouse = this.ensureMouse(this.pointFromEvent(event));
      mouse.wheel(event);

      // don't send mouse-wheel events if we don't yet have a mouse location!
      // TODO: Can we set the mouse location based on the wheel event? https://github.com/phetsims/scenery/issues/1581
      if (mouse.point) {
        const trail = this.rootNode.trailUnderPointer(mouse) || new Trail(this.rootNode);
        this.dispatchEvent(trail, 'wheel', mouse, context, true);
      }
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('wheelScrollAction'),
      parameters: [{
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when the mouse wheel scrolls.',
      phetioHighFrequency: true
    });
    this.touchStartAction = new PhetioAction((id, point, context) => {
      const touch = new Touch(id, point, context.domEvent);
      this.addPointer(touch);
      this.downEvent(touch, context, point);
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('touchStartAction'),
      parameters: [{
        name: 'id',
        phetioType: NumberIO
      }, {
        name: 'point',
        phetioType: Vector2.Vector2IO
      }, {
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when a touch begins.'
    });
    this.touchEndAction = new PhetioAction((id, point, context) => {
      const touch = this.findPointerById(id);
      if (touch) {
        assert && assert(touch instanceof Touch); // eslint-disable-line no-simple-type-checking-assertions, bad-sim-text
        this.upEvent(touch, context, point);
        this.removePointer(touch);
      }
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('touchEndAction'),
      parameters: [{
        name: 'id',
        phetioType: NumberIO
      }, {
        name: 'point',
        phetioType: Vector2.Vector2IO
      }, {
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when a touch ends.'
    });
    this.touchMoveAction = new PhetioAction((id, point, context) => {
      const touch = this.findPointerById(id);
      if (touch) {
        assert && assert(touch instanceof Touch); // eslint-disable-line no-simple-type-checking-assertions, bad-sim-text
        touch.move(point);
        this.moveEvent(touch, context);
      }
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('touchMoveAction'),
      parameters: [{
        name: 'id',
        phetioType: NumberIO
      }, {
        name: 'point',
        phetioType: Vector2.Vector2IO
      }, {
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when a touch moves.',
      phetioHighFrequency: true
    });
    this.touchCancelAction = new PhetioAction((id, point, context) => {
      const touch = this.findPointerById(id);
      if (touch) {
        assert && assert(touch instanceof Touch); // eslint-disable-line no-simple-type-checking-assertions, bad-sim-text
        this.cancelEvent(touch, context, point);
        this.removePointer(touch);
      }
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('touchCancelAction'),
      parameters: [{
        name: 'id',
        phetioType: NumberIO
      }, {
        name: 'point',
        phetioType: Vector2.Vector2IO
      }, {
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when a touch is canceled.'
    });
    this.penStartAction = new PhetioAction((id, point, context) => {
      const pen = new Pen(id, point, context.domEvent);
      this.addPointer(pen);
      this.downEvent(pen, context, point);
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('penStartAction'),
      parameters: [{
        name: 'id',
        phetioType: NumberIO
      }, {
        name: 'point',
        phetioType: Vector2.Vector2IO
      }, {
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when a pen touches the screen.'
    });
    this.penEndAction = new PhetioAction((id, point, context) => {
      const pen = this.findPointerById(id);
      if (pen) {
        this.upEvent(pen, context, point);
        this.removePointer(pen);
      }
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('penEndAction'),
      parameters: [{
        name: 'id',
        phetioType: NumberIO
      }, {
        name: 'point',
        phetioType: Vector2.Vector2IO
      }, {
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when a pen is lifted.'
    });
    this.penMoveAction = new PhetioAction((id, point, context) => {
      const pen = this.findPointerById(id);
      if (pen) {
        pen.move(point);
        this.moveEvent(pen, context);
      }
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('penMoveAction'),
      parameters: [{
        name: 'id',
        phetioType: NumberIO
      }, {
        name: 'point',
        phetioType: Vector2.Vector2IO
      }, {
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when a pen is moved.',
      phetioHighFrequency: true
    });
    this.penCancelAction = new PhetioAction((id, point, context) => {
      const pen = this.findPointerById(id);
      if (pen) {
        this.cancelEvent(pen, context, point);
        this.removePointer(pen);
      }
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('penCancelAction'),
      parameters: [{
        name: 'id',
        phetioType: NumberIO
      }, {
        name: 'point',
        phetioType: Vector2.Vector2IO
      }, {
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when a pen is canceled.'
    });
    this.gotPointerCaptureAction = new PhetioAction((id, context) => {
      const pointer = this.findPointerById(id);
      if (pointer) {
        pointer.onGotPointerCapture();
      }
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('gotPointerCaptureAction'),
      parameters: [{
        name: 'id',
        phetioType: NumberIO
      }, {
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when a pointer is captured (normally at the start of an interaction)',
      phetioHighFrequency: true
    });
    this.lostPointerCaptureAction = new PhetioAction((id, context) => {
      const pointer = this.findPointerById(id);
      if (pointer) {
        pointer.onLostPointerCapture();
      }
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('lostPointerCaptureAction'),
      parameters: [{
        name: 'id',
        phetioType: NumberIO
      }, {
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when a pointer loses its capture (normally at the end of an interaction)',
      phetioHighFrequency: true
    });
    this.focusinAction = new PhetioAction(context => {
      const trail = this.getPDOMEventTrail(context.domEvent, 'focusin');
      if (!trail) {
        return;
      }
      sceneryLog && sceneryLog.Input && sceneryLog.Input(`focusin(${Input.debugText(null, context.domEvent)});`);
      sceneryLog && sceneryLog.Input && sceneryLog.push();
      this.dispatchPDOMEvent(trail, 'focus', context, false);
      this.dispatchPDOMEvent(trail, 'focusin', context, true);
      sceneryLog && sceneryLog.Input && sceneryLog.pop();
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('focusinAction'),
      parameters: [{
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when the PDOM root gets the focusin DOM event.'
    });
    this.focusoutAction = new PhetioAction(context => {
      const trail = this.getPDOMEventTrail(context.domEvent, 'focusout');
      if (!trail) {
        return;
      }
      sceneryLog && sceneryLog.Input && sceneryLog.Input(`focusOut(${Input.debugText(null, context.domEvent)});`);
      sceneryLog && sceneryLog.Input && sceneryLog.push();
      this.dispatchPDOMEvent(trail, 'blur', context, false);
      this.dispatchPDOMEvent(trail, 'focusout', context, true);
      sceneryLog && sceneryLog.Input && sceneryLog.pop();
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('focusoutAction'),
      parameters: [{
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when the PDOM root gets the focusout DOM event.'
    });

    // https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event notes that the click action should result
    // in a MouseEvent
    this.clickAction = new PhetioAction(context => {
      const trail = this.getPDOMEventTrail(context.domEvent, 'click');
      if (!trail) {
        return;
      }
      sceneryLog && sceneryLog.Input && sceneryLog.Input(`click(${Input.debugText(null, context.domEvent)});`);
      sceneryLog && sceneryLog.Input && sceneryLog.push();
      this.dispatchPDOMEvent(trail, 'click', context, true);
      sceneryLog && sceneryLog.Input && sceneryLog.pop();
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('clickAction'),
      parameters: [{
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when the PDOM root gets the click DOM event.'
    });
    this.inputAction = new PhetioAction(context => {
      const trail = this.getPDOMEventTrail(context.domEvent, 'input');
      if (!trail) {
        return;
      }
      sceneryLog && sceneryLog.Input && sceneryLog.Input(`input(${Input.debugText(null, context.domEvent)});`);
      sceneryLog && sceneryLog.Input && sceneryLog.push();
      this.dispatchPDOMEvent(trail, 'input', context, true);
      sceneryLog && sceneryLog.Input && sceneryLog.pop();
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('inputAction'),
      parameters: [{
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when the PDOM root gets the input DOM event.'
    });
    this.changeAction = new PhetioAction(context => {
      const trail = this.getPDOMEventTrail(context.domEvent, 'change');
      if (!trail) {
        return;
      }
      sceneryLog && sceneryLog.Input && sceneryLog.Input(`change(${Input.debugText(null, context.domEvent)});`);
      sceneryLog && sceneryLog.Input && sceneryLog.push();
      this.dispatchPDOMEvent(trail, 'change', context, true);
      sceneryLog && sceneryLog.Input && sceneryLog.pop();
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('changeAction'),
      parameters: [{
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when the PDOM root gets the change DOM event.'
    });
    this.keydownAction = new PhetioAction(context => {
      sceneryLog && sceneryLog.Input && sceneryLog.Input(`keydown(${Input.debugText(null, context.domEvent)});`);
      sceneryLog && sceneryLog.Input && sceneryLog.push();
      const trail = this.getPDOMEventTrail(context.domEvent, 'keydown');
      trail && this.dispatchPDOMEvent(trail, 'keydown', context, true);
      sceneryLog && sceneryLog.Input && sceneryLog.pop();
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('keydownAction'),
      parameters: [{
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when the PDOM root gets the keydown DOM event.'
    });
    this.keyupAction = new PhetioAction(context => {
      sceneryLog && sceneryLog.Input && sceneryLog.Input(`keyup(${Input.debugText(null, context.domEvent)});`);
      sceneryLog && sceneryLog.Input && sceneryLog.push();
      const trail = this.getPDOMEventTrail(context.domEvent, 'keydown');
      trail && this.dispatchPDOMEvent(trail, 'keyup', context, true);
      sceneryLog && sceneryLog.Input && sceneryLog.pop();
    }, {
      phetioPlayback: true,
      tandem: options.tandem?.createTandem('keyupAction'),
      parameters: [{
        name: 'context',
        phetioType: EventContextIO
      }],
      phetioEventType: EventType.USER,
      phetioDocumentation: 'Emits when the PDOM root gets the keyup DOM event.'
    });
  }

  /**
   * Interrupts any input actions that are currently taking place (should stop drags, etc.)
   *
   * If excludePointer is provided, it will NOT be interrupted along with the others
   */
  interruptPointers(excludePointer = null) {
    _.each(this.pointers, pointer => {
      if (pointer !== excludePointer) {
        pointer.interruptAll();
      }
    });
  }

  /**
   * Called to batch a raw DOM event (which may be immediately fired, depending on the settings). (scenery-internal)
   *
   * @param context
   * @param batchType - See BatchedDOMEvent's "enumeration"
   * @param callback - Parameter types defined by the batchType. See BatchedDOMEvent for details
   * @param triggerImmediate - Certain events can force immediate action, since browsers like Chrome
   *                                     only allow certain operations in the callback for a user gesture (e.g. like
   *                                     a mouseup to open a window).
   */
  batchEvent(context, batchType, callback, triggerImmediate) {
    sceneryLog && sceneryLog.InputEvent && sceneryLog.InputEvent('Input.batchEvent');
    sceneryLog && sceneryLog.InputEvent && sceneryLog.push();

    // If our display is not interactive, do not respond to any events (but still prevent default)
    if (this.display.interactive) {
      this.batchedEvents.push(BatchedDOMEvent.pool.create(context, batchType, callback));
      if (triggerImmediate || !this.batchDOMEvents) {
        this.fireBatchedEvents();
      }
      // NOTE: If we ever want to Display.updateDisplay() on events, do so here
    }

    // Always preventDefault on touch events, since we don't want mouse events triggered afterwards. See
    // http://www.html5rocks.com/en/mobile/touchandmouse/ for more information.
    // Additionally, IE had some issues with skipping prevent default, see
    // https://github.com/phetsims/scenery/issues/464 for mouse handling.
    // WE WILL NOT preventDefault() on keyboard or alternative input events here
    if (!(this.passiveEvents === true) && (callback !== this.mouseDown || platform.edge) && batchType !== BatchedDOMEventType.ALT_TYPE && !context.allowsDOMInput()) {
      // We cannot prevent a passive event, so don't try
      context.domEvent.preventDefault();
    }
    sceneryLog && sceneryLog.InputEvent && sceneryLog.pop();
  }

  /**
   * Fires all of our events that were batched into the batchedEvents array. (scenery-internal)
   */
  fireBatchedEvents() {
    sceneryLog && sceneryLog.InputEvent && this.currentlyFiringEvents && sceneryLog.InputEvent('REENTRANCE DETECTED');
    // Don't re-entrantly enter our loop, see https://github.com/phetsims/balloons-and-static-electricity/issues/406
    if (!this.currentlyFiringEvents && this.batchedEvents.length) {
      sceneryLog && sceneryLog.InputEvent && sceneryLog.InputEvent(`Input.fireBatchedEvents length:${this.batchedEvents.length}`);
      sceneryLog && sceneryLog.InputEvent && sceneryLog.push();
      this.currentlyFiringEvents = true;

      // needs to be done in order
      const batchedEvents = this.batchedEvents;
      // IMPORTANT: We need to check the length of the array at every iteration, as it can change due to re-entrant
      // event handling, see https://github.com/phetsims/balloons-and-static-electricity/issues/406.
      // Events may be appended to this (synchronously) as part of firing initial events, so we want to FULLY run all
      // events before clearing our array.
      for (let i = 0; i < batchedEvents.length; i++) {
        const batchedEvent = batchedEvents[i];
        batchedEvent.run(this);
        batchedEvent.dispose();
      }
      cleanArray(batchedEvents);
      this.currentlyFiringEvents = false;
      sceneryLog && sceneryLog.InputEvent && sceneryLog.pop();
    }
  }

  /**
   * Clears any batched events that we don't want to process. (scenery-internal)
   *
   * NOTE: It is HIGHLY recommended to interrupt pointers and remove non-Mouse pointers before doing this, as
   * otherwise it can cause incorrect state in certain types of listeners (e.g. ones that count how many pointers
   * are over them).
   */
  clearBatchedEvents() {
    this.batchedEvents.length = 0;
  }

  /**
   * Checks all pointers to see whether they are still "over" the same nodes (trail). If not, it will fire the usual
   * enter/exit events. (scenery-internal)
   */
  validatePointers() {
    this.validatePointersAction.execute();
  }

  /**
   * Removes all non-Mouse pointers from internal tracking. (scenery-internal)
   */
  removeTemporaryPointers() {
    for (let i = this.pointers.length - 1; i >= 0; i--) {
      const pointer = this.pointers[i];
      if (!(pointer instanceof Mouse)) {
        this.pointers.splice(i, 1);

        // Send exit events. As we can't get a DOM event, we'll send a fake object instead.
        const exitTrail = pointer.trail || new Trail(this.rootNode);
        this.exitEvents(pointer, EventContext.createSynthetic(), exitTrail, 0, true);
      }
    }
  }

  /**
   * Hooks up DOM listeners to whatever type of object we are going to listen to. (scenery-internal)
   */
  connectListeners() {
    BrowserEvents.addDisplay(this.display, this.attachToWindow, this.passiveEvents);
  }

  /**
   * Removes DOM listeners from whatever type of object we were listening to. (scenery-internal)
   */
  disconnectListeners() {
    BrowserEvents.removeDisplay(this.display, this.attachToWindow, this.passiveEvents);
  }

  /**
   * Extract a {Vector2} global coordinate point from an arbitrary DOM event. (scenery-internal)
   */
  pointFromEvent(domEvent) {
    const position = Vector2.pool.create(domEvent.clientX, domEvent.clientY);
    if (!this.assumeFullWindow) {
      const domBounds = this.display.domElement.getBoundingClientRect();

      // TODO: consider totally ignoring any with zero width/height, as we aren't attached to the display? https://github.com/phetsims/scenery/issues/1581
      // For now, don't offset.
      if (domBounds.width > 0 && domBounds.height > 0) {
        position.subtractXY(domBounds.left, domBounds.top);

        // Detect a scaling of the display here (the client bounding rect having different dimensions from our
        // display), and attempt to compensate.
        // NOTE: We can't handle rotation here.
        if (domBounds.width !== this.display.width || domBounds.height !== this.display.height) {
          // TODO: Have code verify the correctness here, and that it's not triggering all the time https://github.com/phetsims/scenery/issues/1581
          position.x *= this.display.width / domBounds.width;
          position.y *= this.display.height / domBounds.height;
        }
      }
    }
    return position;
  }

  /**
   * Adds a pointer to our list.
   */
  addPointer(pointer) {
    this.pointers.push(pointer);
    this.pointerAddedEmitter.emit(pointer);
  }

  /**
   * Removes a pointer from our list. If we get future events for it (based on the ID) it will be ignored.
   */
  removePointer(pointer) {
    // sanity check version, will remove all instances
    for (let i = this.pointers.length - 1; i >= 0; i--) {
      if (this.pointers[i] === pointer) {
        this.pointers.splice(i, 1);
      }
    }
    pointer.dispose();
  }

  /**
   * Given a pointer's ID (given by the pointer/touch specifications to be unique to a specific pointer/touch),
   * returns the given pointer (if we have one).
   *
   * NOTE: There are some cases where we may have prematurely "removed" a pointer.
   */
  findPointerById(id) {
    let i = this.pointers.length;
    while (i--) {
      const pointer = this.pointers[i];
      if (pointer.id === id) {
        return pointer;
      }
    }
    return null;
  }
  getPDOMEventTrail(domEvent, eventName) {
    if (!this.display.interactive) {
      return null;
    }
    const trail = this.getTrailFromPDOMEvent(domEvent);

    // Only dispatch the event if the click did not happen rapidly after an up event. It is
    // likely that the screen reader dispatched both pointer AND click events in this case, and
    // we only want to respond to one or the other. See https://github.com/phetsims/scenery/issues/1094.
    // This is outside of the clickAction execution so that blocked clicks are not part of the PhET-iO data
    // stream.
    const notBlockingSubsequentClicksOccurringTooQuickly = trail && !(eventName === 'click' && _.some(trail.nodes, node => node.positionInPDOM) && domEvent.timeStamp - this.upTimeStamp <= PDOM_CLICK_DELAY);
    return notBlockingSubsequentClicksOccurringTooQuickly ? trail : null;
  }

  /**
   * Initializes the Mouse object on the first mouse event (this may never happen on touch devices).
   */
  initMouse(point) {
    const mouse = new Mouse(point);
    this.mouse = mouse;
    this.addPointer(mouse);
    return mouse;
  }
  ensureMouse(point) {
    const mouse = this.mouse;
    if (mouse) {
      return mouse;
    } else {
      return this.initMouse(point);
    }
  }

  /**
   * Initializes the accessible pointer object on the first pdom event.
   */
  initPDOMPointer() {
    const pdomPointer = new PDOMPointer(this.display);
    this.pdomPointer = pdomPointer;
    this.addPointer(pdomPointer);
    return pdomPointer;
  }
  ensurePDOMPointer() {
    const pdomPointer = this.pdomPointer;
    if (pdomPointer) {
      return pdomPointer;
    } else {
      return this.initPDOMPointer();
    }
  }

  /**
   * Steps to dispatch a pdom-related event. Before dispatch, the PDOMPointer is initialized if it
   * hasn't been created yet and a userGestureEmitter emits to indicate that a user has begun an interaction.
   */
  dispatchPDOMEvent(trail, eventType, context, bubbles) {
    this.ensurePDOMPointer().updateTrail(trail);

    // exclude focus and blur events because they can happen with scripting without user input
    if (PDOMUtils.USER_GESTURE_EVENTS.includes(eventType)) {
      Display.userGestureEmitter.emit();
    }
    const domEvent = context.domEvent;

    // This workaround hopefully won't be here forever, see ParallelDOM.setExcludeLabelSiblingFromInput() and https://github.com/phetsims/a11y-research/issues/156
    if (!(domEvent.target && domEvent.target.hasAttribute(PDOMUtils.DATA_EXCLUDE_FROM_INPUT))) {
      // If the trail is not pickable, don't dispatch PDOM events to those targets - but we still
      // dispatch with an empty trail to call listeners on the Display and Pointer.
      const canFireListeners = trail.isPickable() || PDOM_UNPICKABLE_EVENTS.includes(eventType);
      if (!canFireListeners) {
        trail = new Trail([]);
      }
      assert && assert(this.pdomPointer);
      this.dispatchEvent(trail, eventType, this.pdomPointer, context, bubbles);
    }
  }

  /**
   * From a DOM Event, get its relatedTarget and map that to the scenery Node. Will return null if relatedTarget
   * is not provided, or if relatedTarget is not under PDOM, or there is no associated Node with trail id on the
   * relatedTarget element. (scenery-internal)
   *
   * @param domEvent - DOM Event, not a SceneryEvent!
   */
  getRelatedTargetTrail(domEvent) {
    const relatedTargetElement = domEvent.relatedTarget;
    if (relatedTargetElement && this.display.isElementUnderPDOM(relatedTargetElement, false)) {
      const relatedTarget = domEvent.relatedTarget;
      assert && assert(relatedTarget instanceof window.Element);
      const trailIndices = relatedTarget.getAttribute(PDOMUtils.DATA_PDOM_UNIQUE_ID);
      assert && assert(trailIndices, 'should not be null');
      return PDOMInstance.uniqueIdToTrail(this.display, trailIndices);
    }
    return null;
  }

  /**
   * Get the trail ID of the node represented by a DOM element who is the target of a DOM Event in the accessible PDOM.
   * This is a bit of a misnomer, because the domEvent doesn't have to be under the PDOM. Returns null if not in the PDOM.
   */
  getTrailFromPDOMEvent(domEvent) {
    assert && assert(domEvent.target || domEvent[TARGET_SUBSTITUTE_KEY], 'need a way to get the target');
    if (!this.display._accessible) {
      return null;
    }

    // could be serialized event for phet-io playbacks, see Input.serializeDOMEvent()
    if (domEvent[TARGET_SUBSTITUTE_KEY]) {
      const trailIndices = domEvent[TARGET_SUBSTITUTE_KEY].getAttribute(PDOMUtils.DATA_PDOM_UNIQUE_ID);
      return PDOMInstance.uniqueIdToTrail(this.display, trailIndices);
    } else {
      const target = domEvent.target;
      if (target && target instanceof window.Element && this.display.isElementUnderPDOM(target, false)) {
        const trailIndices = target.getAttribute(PDOMUtils.DATA_PDOM_UNIQUE_ID);
        assert && assert(trailIndices, 'should not be null');
        return PDOMInstance.uniqueIdToTrail(this.display, trailIndices);
      }
    }
    return null;
  }

  /**
   * Triggers a logical mousedown event. (scenery-internal)
   *
   * NOTE: This may also be called from the pointer event handler (pointerDown) or from things like fuzzing or
   * playback. The event may be "faked" for certain purposes.
   */
  mouseDown(id, point, context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`mouseDown('${id}', ${Input.debugText(point, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.mouseDownAction.execute(id, point, context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Triggers a logical mouseup event. (scenery-internal)
   *
   * NOTE: This may also be called from the pointer event handler (pointerUp) or from things like fuzzing or
   * playback. The event may be "faked" for certain purposes.
   */
  mouseUp(point, context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`mouseUp(${Input.debugText(point, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.mouseUpAction.execute(point, context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Triggers a logical mousemove event. (scenery-internal)
   *
   * NOTE: This may also be called from the pointer event handler (pointerMove) or from things like fuzzing or
   * playback. The event may be "faked" for certain purposes.
   */
  mouseMove(point, context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`mouseMove(${Input.debugText(point, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.mouseMoveAction.execute(point, context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Triggers a logical mouseover event (this does NOT correspond to the Scenery event, since this is for the display) (scenery-internal)
   */
  mouseOver(point, context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`mouseOver(${Input.debugText(point, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.mouseOverAction.execute(point, context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Triggers a logical mouseout event (this does NOT correspond to the Scenery event, since this is for the display) (scenery-internal)
   */
  mouseOut(point, context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`mouseOut(${Input.debugText(point, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.mouseOutAction.execute(point, context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Triggers a logical mouse-wheel/scroll event. (scenery-internal)
   */
  wheel(context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`wheel(${Input.debugText(null, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.wheelScrollAction.execute(context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Triggers a logical touchstart event. This is called for each touch point in a 'raw' event. (scenery-internal)
   *
   * NOTE: This may also be called from the pointer event handler (pointerDown) or from things like fuzzing or
   * playback. The event may be "faked" for certain purposes.
   */
  touchStart(id, point, context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`touchStart('${id}',${Input.debugText(point, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.touchStartAction.execute(id, point, context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Triggers a logical touchend event. This is called for each touch point in a 'raw' event. (scenery-internal)
   *
   * NOTE: This may also be called from the pointer event handler (pointerUp) or from things like fuzzing or
   * playback. The event may be "faked" for certain purposes.
   */
  touchEnd(id, point, context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`touchEnd('${id}',${Input.debugText(point, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.touchEndAction.execute(id, point, context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Triggers a logical touchmove event. This is called for each touch point in a 'raw' event. (scenery-internal)
   *
   * NOTE: This may also be called from the pointer event handler (pointerMove) or from things like fuzzing or
   * playback. The event may be "faked" for certain purposes.
   */
  touchMove(id, point, context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`touchMove('${id}',${Input.debugText(point, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.touchMoveAction.execute(id, point, context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Triggers a logical touchcancel event. This is called for each touch point in a 'raw' event. (scenery-internal)
   *
   * NOTE: This may also be called from the pointer event handler (pointerCancel) or from things like fuzzing or
   * playback. The event may be "faked" for certain purposes.
   */
  touchCancel(id, point, context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`touchCancel('${id}',${Input.debugText(point, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.touchCancelAction.execute(id, point, context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Triggers a logical penstart event (e.g. a stylus). This is called for each pen point in a 'raw' event. (scenery-internal)
   *
   * NOTE: This may also be called from the pointer event handler (pointerDown) or from things like fuzzing or
   * playback. The event may be "faked" for certain purposes.
   */
  penStart(id, point, context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`penStart('${id}',${Input.debugText(point, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.penStartAction.execute(id, point, context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Triggers a logical penend event (e.g. a stylus). This is called for each pen point in a 'raw' event. (scenery-internal)
   *
   * NOTE: This may also be called from the pointer event handler (pointerUp) or from things like fuzzing or
   * playback. The event may be "faked" for certain purposes.
   */
  penEnd(id, point, context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`penEnd('${id}',${Input.debugText(point, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.penEndAction.execute(id, point, context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Triggers a logical penmove event (e.g. a stylus). This is called for each pen point in a 'raw' event. (scenery-internal)
   *
   * NOTE: This may also be called from the pointer event handler (pointerMove) or from things like fuzzing or
   * playback. The event may be "faked" for certain purposes.
   */
  penMove(id, point, context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`penMove('${id}',${Input.debugText(point, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.penMoveAction.execute(id, point, context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Triggers a logical pencancel event (e.g. a stylus). This is called for each pen point in a 'raw' event. (scenery-internal)
   *
   * NOTE: This may also be called from the pointer event handler (pointerCancel) or from things like fuzzing or
   * playback. The event may be "faked" for certain purposes.
   */
  penCancel(id, point, context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`penCancel('${id}',${Input.debugText(point, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.penCancelAction.execute(id, point, context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Handles a pointerdown event, forwarding it to the proper logical event. (scenery-internal)
   */
  pointerDown(id, type, point, context) {
    // In IE for pointer down events, we want to make sure than the next interactions off the page are sent to
    // this element (it will bubble). See https://github.com/phetsims/scenery/issues/464 and
    // http://news.qooxdoo.org/mouse-capturing.
    const target = this.attachToWindow ? document.body : this.display.domElement;
    if (target.setPointerCapture && context.domEvent.pointerId && !context.allowsDOMInput()) {
      // NOTE: This will error out if run on a playback destination, where a pointer with the given ID does not exist.
      target.setPointerCapture(context.domEvent.pointerId);
    }
    type = this.handleUnknownPointerType(type, id);
    switch (type) {
      case 'mouse':
        // The actual event afterwards
        this.mouseDown(id, point, context);
        break;
      case 'touch':
        this.touchStart(id, point, context);
        break;
      case 'pen':
        this.penStart(id, point, context);
        break;
      default:
        if (assert) {
          throw new Error(`Unknown pointer type: ${type}`);
        }
    }
  }

  /**
   * Handles a pointerup event, forwarding it to the proper logical event. (scenery-internal)
   */
  pointerUp(id, type, point, context) {
    // update this outside of the Action executions so that PhET-iO event playback does not override it
    this.upTimeStamp = context.domEvent.timeStamp;
    type = this.handleUnknownPointerType(type, id);
    switch (type) {
      case 'mouse':
        this.mouseUp(point, context);
        break;
      case 'touch':
        this.touchEnd(id, point, context);
        break;
      case 'pen':
        this.penEnd(id, point, context);
        break;
      default:
        if (assert) {
          throw new Error(`Unknown pointer type: ${type}`);
        }
    }
  }

  /**
   * Handles a pointercancel event, forwarding it to the proper logical event. (scenery-internal)
   */
  pointerCancel(id, type, point, context) {
    type = this.handleUnknownPointerType(type, id);
    switch (type) {
      case 'mouse':
        if (console && console.log) {
          console.log('WARNING: Pointer mouse cancel was received');
        }
        break;
      case 'touch':
        this.touchCancel(id, point, context);
        break;
      case 'pen':
        this.penCancel(id, point, context);
        break;
      default:
        if (console.log) {
          console.log(`Unknown pointer type: ${type}`);
        }
    }
  }

  /**
   * Handles a gotpointercapture event, forwarding it to the proper logical event. (scenery-internal)
   */
  gotPointerCapture(id, type, point, context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`gotPointerCapture('${id}',${Input.debugText(null, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.gotPointerCaptureAction.execute(id, context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Handles a lostpointercapture event, forwarding it to the proper logical event. (scenery-internal)
   */
  lostPointerCapture(id, type, point, context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`lostPointerCapture('${id}',${Input.debugText(null, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.lostPointerCaptureAction.execute(id, context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Handles a pointermove event, forwarding it to the proper logical event. (scenery-internal)
   */
  pointerMove(id, type, point, context) {
    type = this.handleUnknownPointerType(type, id);
    switch (type) {
      case 'mouse':
        this.mouseMove(point, context);
        break;
      case 'touch':
        this.touchMove(id, point, context);
        break;
      case 'pen':
        this.penMove(id, point, context);
        break;
      default:
        if (console.log) {
          console.log(`Unknown pointer type: ${type}`);
        }
    }
  }

  /**
   * Handles a pointerover event, forwarding it to the proper logical event. (scenery-internal)
   */
  pointerOver(id, type, point, context) {
    // TODO: accumulate mouse/touch info in the object if needed? https://github.com/phetsims/scenery/issues/1581
    // TODO: do we want to branch change on these types of events? https://github.com/phetsims/scenery/issues/1581
  }

  /**
   * Handles a pointerout event, forwarding it to the proper logical event. (scenery-internal)
   */
  pointerOut(id, type, point, context) {
    // TODO: accumulate mouse/touch info in the object if needed? https://github.com/phetsims/scenery/issues/1581
    // TODO: do we want to branch change on these types of events? https://github.com/phetsims/scenery/issues/1581
  }

  /**
   * Handles a pointerenter event, forwarding it to the proper logical event. (scenery-internal)
   */
  pointerEnter(id, type, point, context) {
    // TODO: accumulate mouse/touch info in the object if needed? https://github.com/phetsims/scenery/issues/1581
    // TODO: do we want to branch change on these types of events? https://github.com/phetsims/scenery/issues/1581
  }

  /**
   * Handles a pointerleave event, forwarding it to the proper logical event. (scenery-internal)
   */
  pointerLeave(id, type, point, context) {
    // TODO: accumulate mouse/touch info in the object if needed? https://github.com/phetsims/scenery/issues/1581
    // TODO: do we want to branch change on these types of events? https://github.com/phetsims/scenery/issues/1581
  }

  /**
   * Handles a focusin event, forwarding it to the proper logical event. (scenery-internal)
   */
  focusIn(context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`focusIn('${Input.debugText(null, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.focusinAction.execute(context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Handles a focusout event, forwarding it to the proper logical event. (scenery-internal)
   */
  focusOut(context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`focusOut('${Input.debugText(null, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.focusoutAction.execute(context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Handles an input event, forwarding it to the proper logical event. (scenery-internal)
   */
  input(context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`input('${Input.debugText(null, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.inputAction.execute(context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Handles a change event, forwarding it to the proper logical event. (scenery-internal)
   */
  change(context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`change('${Input.debugText(null, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.changeAction.execute(context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Handles a click event, forwarding it to the proper logical event. (scenery-internal)
   */
  click(context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`click('${Input.debugText(null, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.clickAction.execute(context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Handles a keydown event, forwarding it to the proper logical event. (scenery-internal)
   */
  keyDown(context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`keyDown('${Input.debugText(null, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.keydownAction.execute(context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Handles a keyup event, forwarding it to the proper logical event. (scenery-internal)
   */
  keyUp(context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`keyUp('${Input.debugText(null, context.domEvent)});`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();
    this.keyupAction.execute(context);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * When we get an unknown pointer event type (allowed in the spec, see
   * https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/pointerType), we'll try to guess the pointer type
   * so that we can properly start/end the interaction. NOTE: this can happen for an 'up' where we received a
   * proper type for a 'down', so thus we need the detection.
   */
  handleUnknownPointerType(type, id) {
    if (type !== '') {
      return type;
    }
    return this.mouse && this.mouse.id === id ? 'mouse' : 'touch';
  }

  /**
   * Given a pointer reference, hit test it and determine the Trail that the pointer is over.
   */
  getPointerTrail(pointer) {
    return this.rootNode.trailUnderPointer(pointer) || new Trail(this.rootNode);
  }

  /**
   * Called for each logical "up" event, for any pointer type.
   */
  upEvent(pointer, context, point) {
    // if the event target is within the PDOM the AT is sending a fake pointer event to the document - do not
    // dispatch this since the PDOM should only handle Input.PDOM_EVENT_TYPES, and all other pointer input should
    // go through the Display div. Otherwise, activation will be duplicated when we handle pointer and PDOM events
    if (this.display.isElementUnderPDOM(context.domEvent.target, true)) {
      return;
    }
    const pointChanged = pointer.up(point, context.domEvent);
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`upEvent ${pointer.toString()} changed:${pointChanged}`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();

    // We'll use this trail for the entire dispatch of this event.
    const eventTrail = this.branchChangeEvents(pointer, context, pointChanged);
    this.dispatchEvent(eventTrail, 'up', pointer, context, true);

    // touch pointers are transient, so fire exit/out to the trail afterwards
    if (pointer.isTouchLike()) {
      this.exitEvents(pointer, context, eventTrail, 0, true);
    }
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Called for each logical "down" event, for any pointer type.
   */
  downEvent(pointer, context, point) {
    // if the event target is within the PDOM the AT is sending a fake pointer event to the document - do not
    // dispatch this since the PDOM should only handle Input.PDOM_EVENT_TYPES, and all other pointer input should
    // go through the Display div. Otherwise, activation will be duplicated when we handle pointer and PDOM events
    if (this.display.isElementUnderPDOM(context.domEvent.target, true)) {
      return;
    }
    const pointChanged = pointer.updatePoint(point);
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`downEvent ${pointer.toString()} changed:${pointChanged}`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();

    // We'll use this trail for the entire dispatch of this event.
    const eventTrail = this.branchChangeEvents(pointer, context, pointChanged);
    pointer.down(context.domEvent);
    this.dispatchEvent(eventTrail, 'down', pointer, context, true);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Called for each logical "move" event, for any pointer type.
   */
  moveEvent(pointer, context) {
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`moveEvent ${pointer.toString()}`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();

    // Always treat move events as "point changed"
    this.branchChangeEvents(pointer, context, true);
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Called for each logical "cancel" event, for any pointer type.
   */
  cancelEvent(pointer, context, point) {
    const pointChanged = pointer.cancel(point);
    sceneryLog && sceneryLog.Input && sceneryLog.Input(`cancelEvent ${pointer.toString()} changed:${pointChanged}`);
    sceneryLog && sceneryLog.Input && sceneryLog.push();

    // We'll use this trail for the entire dispatch of this event.
    const eventTrail = this.branchChangeEvents(pointer, context, pointChanged);
    this.dispatchEvent(eventTrail, 'cancel', pointer, context, true);

    // touch pointers are transient, so fire exit/out to the trail afterwards
    if (pointer.isTouchLike()) {
      this.exitEvents(pointer, context, eventTrail, 0, true);
    }
    sceneryLog && sceneryLog.Input && sceneryLog.pop();
  }

  /**
   * Dispatches any necessary events that would result from the pointer's trail changing.
   *
   * This will send the necessary exit/enter events (on subtrails that have diverged between before/after), the
   * out/over events, and if flagged a move event.
   *
   * @param pointer
   * @param context
   * @param sendMove - Whether to send move events
   * @returns - The current trail of the pointer
   */
  branchChangeEvents(pointer, context, sendMove) {
    sceneryLog && sceneryLog.InputEvent && sceneryLog.InputEvent(`branchChangeEvents: ${pointer.toString()} sendMove:${sendMove}`);
    sceneryLog && sceneryLog.InputEvent && sceneryLog.push();
    const trail = this.getPointerTrail(pointer);
    const inputEnabledTrail = trail.slice(0, Math.min(trail.nodes.length, trail.getLastInputEnabledIndex() + 1));
    const oldInputEnabledTrail = pointer.inputEnabledTrail || new Trail(this.rootNode);
    const branchInputEnabledIndex = Trail.branchIndex(inputEnabledTrail, oldInputEnabledTrail);
    const lastInputEnabledNodeChanged = oldInputEnabledTrail.lastNode() !== inputEnabledTrail.lastNode();
    if (sceneryLog && sceneryLog.InputEvent) {
      const oldTrail = pointer.trail || new Trail(this.rootNode);
      const branchIndex = Trail.branchIndex(trail, oldTrail);
      (branchIndex !== trail.length || branchIndex !== oldTrail.length) && sceneryLog.InputEvent(`changed from ${oldTrail.toString()} to ${trail.toString()}`);
    }

    // event order matches http://www.w3.org/TR/DOM-Level-3-Events/#events-mouseevent-event-order
    if (sendMove) {
      this.dispatchEvent(trail, 'move', pointer, context, true);
    }

    // We want to approximately mimic http://www.w3.org/TR/DOM-Level-3-Events/#events-mouseevent-event-order
    this.exitEvents(pointer, context, oldInputEnabledTrail, branchInputEnabledIndex, lastInputEnabledNodeChanged);
    this.enterEvents(pointer, context, inputEnabledTrail, branchInputEnabledIndex, lastInputEnabledNodeChanged);
    pointer.trail = trail;
    pointer.inputEnabledTrail = inputEnabledTrail;
    sceneryLog && sceneryLog.InputEvent && sceneryLog.pop();
    return trail;
  }

  /**
   * Triggers 'enter' events along a trail change, and an 'over' event on the leaf.
   *
   * For example, if we change from a trail [ a, b, c, d, e ] => [ a, b, x, y ], it will fire:
   *
   * - enter x
   * - enter y
   * - over y (bubbles)
   *
   * @param pointer
   * @param event
   * @param trail - The "new" trail
   * @param branchIndex - The first index where the old and new trails have a different node. We will notify
   *                               for this node and all "descendant" nodes in the relevant trail.
   * @param lastNodeChanged - If the last node didn't change, we won't sent an over event.
   */
  enterEvents(pointer, context, trail, branchIndex, lastNodeChanged) {
    if (lastNodeChanged) {
      this.dispatchEvent(trail, 'over', pointer, context, true, true);
    }
    for (let i = branchIndex; i < trail.length; i++) {
      this.dispatchEvent(trail.slice(0, i + 1), 'enter', pointer, context, false);
    }
  }

  /**
   * Triggers 'exit' events along a trail change, and an 'out' event on the leaf.
   *
   * For example, if we change from a trail [ a, b, c, d, e ] => [ a, b, x, y ], it will fire:
   *
   * - out e (bubbles)
   * - exit c
   * - exit d
   * - exit e
   *
   * @param pointer
   * @param event
   * @param trail - The "old" trail
   * @param branchIndex - The first index where the old and new trails have a different node. We will notify
   *                               for this node and all "descendant" nodes in the relevant trail.
   * @param lastNodeChanged - If the last node didn't change, we won't sent an out event.
   */
  exitEvents(pointer, context, trail, branchIndex, lastNodeChanged) {
    for (let i = trail.length - 1; i >= branchIndex; i--) {
      this.dispatchEvent(trail.slice(0, i + 1), 'exit', pointer, context, false, true);
    }
    if (lastNodeChanged) {
      this.dispatchEvent(trail, 'out', pointer, context, true);
    }
  }

  /**
   * Dispatch to all nodes in the Trail, optionally bubbling down from the leaf to the root.
   *
   * @param trail
   * @param type
   * @param pointer
   * @param context
   * @param bubbles - If bubbles is false, the event is only dispatched to the leaf node of the trail.
   * @param fireOnInputDisabled - Whether to fire this event even if nodes have inputEnabled:false
   */
  dispatchEvent(trail, type, pointer, context, bubbles, fireOnInputDisabled = false) {
    sceneryLog && sceneryLog.EventDispatch && sceneryLog.EventDispatch(`${type} trail:${trail.toString()} pointer:${pointer.toString()} at ${pointer.point ? pointer.point.toString() : 'null'}`);
    sceneryLog && sceneryLog.EventDispatch && sceneryLog.push();
    assert && assert(trail, 'Falsy trail for dispatchEvent');
    sceneryLog && sceneryLog.EventPath && sceneryLog.EventPath(`${type} ${trail.toPathString()}`);

    // NOTE: event is not immutable, as its currentTarget changes
    const inputEvent = new SceneryEvent(trail, type, pointer, context);
    this.currentSceneryEvent = inputEvent;

    // first run through the pointer's listeners to see if one of them will handle the event
    this.dispatchToListeners(pointer, pointer.getListeners(), type, inputEvent);

    // if not yet handled, run through the trail in order to see if one of them will handle the event
    // at the base of the trail should be the scene node, so the scene will be notified last
    this.dispatchToTargets(trail, type, pointer, inputEvent, bubbles, fireOnInputDisabled);

    // Notify input listeners on the Display
    this.dispatchToListeners(pointer, this.display.getInputListeners(), type, inputEvent);

    // Notify input listeners to any Display
    if (Display.inputListeners.length) {
      this.dispatchToListeners(pointer, Display.inputListeners.slice(), type, inputEvent);
    }
    this.currentSceneryEvent = null;
    sceneryLog && sceneryLog.EventDispatch && sceneryLog.pop();
  }

  /**
   * Notifies an array of listeners with a specific event.
   *
   * @param pointer
   * @param listeners - Should be a defensive array copy already.
   * @param type
   * @param inputEvent
   */
  dispatchToListeners(pointer, listeners, type, inputEvent) {
    if (inputEvent.handled) {
      return;
    }
    const specificType = pointer.type + type; // e.g. mouseup, touchup

    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      if (!inputEvent.aborted && listener[specificType]) {
        sceneryLog && sceneryLog.EventDispatch && sceneryLog.EventDispatch(specificType);
        sceneryLog && sceneryLog.EventDispatch && sceneryLog.push();
        listener[specificType](inputEvent);
        sceneryLog && sceneryLog.EventDispatch && sceneryLog.pop();
      }
      if (!inputEvent.aborted && listener[type]) {
        sceneryLog && sceneryLog.EventDispatch && sceneryLog.EventDispatch(type);
        sceneryLog && sceneryLog.EventDispatch && sceneryLog.push();
        listener[type](inputEvent);
        sceneryLog && sceneryLog.EventDispatch && sceneryLog.pop();
      }
    }
  }

  /**
   * Dispatch to all nodes in the Trail, optionally bubbling down from the leaf to the root.
   *
   * @param trail
   * @param type
   * @param pointer
   * @param inputEvent
   * @param bubbles - If bubbles is false, the event is only dispatched to the leaf node of the trail.
   * @param [fireOnInputDisabled]
   */
  dispatchToTargets(trail, type, pointer, inputEvent, bubbles, fireOnInputDisabled = false) {
    if (inputEvent.aborted || inputEvent.handled) {
      return;
    }
    const inputEnabledIndex = trail.getLastInputEnabledIndex();
    for (let i = trail.nodes.length - 1; i >= 0; bubbles ? i-- : i = -1) {
      const target = trail.nodes[i];
      const trailInputDisabled = inputEnabledIndex < i;
      if (target.isDisposed || !fireOnInputDisabled && trailInputDisabled) {
        continue;
      }
      inputEvent.currentTarget = target;
      this.dispatchToListeners(pointer, target.getInputListeners(), type, inputEvent);

      // if the input event was aborted or handled, don't follow the trail down another level
      if (inputEvent.aborted || inputEvent.handled) {
        return;
      }
    }
  }

  /**
   * Saves the main information we care about from a DOM `Event` into a JSON-like structure. To support
   * polymorphism, all supported DOM event keys that scenery uses will always be included in this serialization. If
   * the particular Event interface for the instance being serialized doesn't have a certain property, then it will be
   * set as `null`. See domEventPropertiesToSerialize for the full list of supported Event properties.
   *
   * @returns - see domEventPropertiesToSerialize for list keys that are serialized
   */
  static serializeDomEvent(domEvent) {
    const entries = {
      constructorName: domEvent.constructor.name
    };
    domEventPropertiesToSerialize.forEach(property => {
      const domEventProperty = domEvent[property];

      // We serialize many Event APIs into a single object, so be graceful if properties don't exist.
      if (domEventProperty === undefined || domEventProperty === null) {
        entries[property] = null;
      } else if (domEventProperty instanceof Element && EVENT_KEY_VALUES_AS_ELEMENTS.includes(property) && typeof domEventProperty.getAttribute === 'function' &&
      // If false, then this target isn't a PDOM element, so we can skip this serialization
      domEventProperty.hasAttribute(PDOMUtils.DATA_PDOM_UNIQUE_ID)) {
        // If the target came from the accessibility PDOM, then we want to store the Node trail id of where it came from.
        entries[property] = {
          [PDOMUtils.DATA_PDOM_UNIQUE_ID]: domEventProperty.getAttribute(PDOMUtils.DATA_PDOM_UNIQUE_ID),
          // Have the ID also
          id: domEventProperty.getAttribute('id')
        };
      } else {
        // Parse to get rid of functions and circular references.
        entries[property] = typeof domEventProperty === 'object' ? {} : JSON.parse(JSON.stringify(domEventProperty));
      }
    });
    return entries;
  }

  /**
   * From a serialized dom event, return a recreated window.Event (scenery-internal)
   */
  static deserializeDomEvent(eventObject) {
    const constructorName = eventObject.constructorName || 'Event';
    const configForConstructor = _.pick(eventObject, domEventPropertiesSetInConstructor);
    // serialize the relatedTarget back into an event Object, so that it can be passed to the init config in the Event
    // constructor
    if (configForConstructor.relatedTarget) {
      // @ts-expect-error
      const htmlElement = document.getElementById(configForConstructor.relatedTarget.id);
      assert && assert(htmlElement, 'cannot deserialize event when related target is not in the DOM.');
      configForConstructor.relatedTarget = htmlElement;
    }

    // @ts-expect-error
    const domEvent = new window[constructorName](constructorName, configForConstructor);
    for (const key in eventObject) {
      // `type` is readonly, so don't try to set it.
      if (eventObject.hasOwnProperty(key) && !domEventPropertiesSetInConstructor.includes(key)) {
        // Special case for target since we can't set that read-only property. Instead use a substitute key.
        if (key === 'target') {
          if (assert) {
            const target = eventObject.target;
            if (target && target.id) {
              assert(document.getElementById(target.id), 'target should exist in the PDOM to support playback.');
            }
          }

          // @ts-expect-error
          domEvent[TARGET_SUBSTITUTE_KEY] = _.clone(eventObject[key]) || {};

          // This may not be needed since https://github.com/phetsims/scenery/issues/1296 is complete, double check on getTrailFromPDOMEvent() too
          // @ts-expect-error
          domEvent[TARGET_SUBSTITUTE_KEY].getAttribute = function (key) {
            return this[key];
          };
        } else {
          // @ts-expect-error
          domEvent[key] = eventObject[key];
        }
      }
    }
    return domEvent;
  }

  /**
   * Convenience function for logging out a point/event combination.
   *
   * @param point - Not logged if null
   * @param domEvent
   */
  static debugText(point, domEvent) {
    let result = `${domEvent.timeStamp} ${domEvent.type}`;
    if (point !== null) {
      result = `${point.x},${point.y} ${result}`;
    }
    return result;
  }

  /**
   * Maps the current MS pointer types onto the pointer spec. (scenery-internal)
   */
  static msPointerType(event) {
    // @ts-expect-error -- legacy API
    if (event.pointerType === window.MSPointerEvent.MSPOINTER_TYPE_TOUCH) {
      return 'touch';
    }
    // @ts-expect-error -- legacy API
    else if (event.pointerType === window.MSPointerEvent.MSPOINTER_TYPE_PEN) {
      return 'pen';
    }
    // @ts-expect-error -- legacy API
    else if (event.pointerType === window.MSPointerEvent.MSPOINTER_TYPE_MOUSE) {
      return 'mouse';
    } else {
      return event.pointerType; // hope for the best
    }
  }
}
scenery.register('Input', Input);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQaGV0aW9BY3Rpb24iLCJUaW55RW1pdHRlciIsIlZlY3RvcjIiLCJjbGVhbkFycmF5Iiwib3B0aW9uaXplIiwicGxhdGZvcm0iLCJFdmVudFR5cGUiLCJOdWxsYWJsZUlPIiwiTnVtYmVySU8iLCJCYXRjaGVkRE9NRXZlbnQiLCJCYXRjaGVkRE9NRXZlbnRUeXBlIiwiQnJvd3NlckV2ZW50cyIsIkRpc3BsYXkiLCJFdmVudENvbnRleHQiLCJFdmVudENvbnRleHRJTyIsIk1vdXNlIiwiUERPTUluc3RhbmNlIiwiUERPTVBvaW50ZXIiLCJQRE9NVXRpbHMiLCJQZW4iLCJQb2ludGVyIiwic2NlbmVyeSIsIlNjZW5lcnlFdmVudCIsIlRvdWNoIiwiVHJhaWwiLCJQaGV0aW9PYmplY3QiLCJJT1R5cGUiLCJBcnJheUlPIiwiQXJyYXlJT1BvaW50ZXJJTyIsIlBvaW50ZXJJTyIsImRvbUV2ZW50UHJvcGVydGllc1RvU2VyaWFsaXplIiwiZG9tRXZlbnRQcm9wZXJ0aWVzU2V0SW5Db25zdHJ1Y3RvciIsIkVWRU5UX0tFWV9WQUxVRVNfQVNfRUxFTUVOVFMiLCJQRE9NX1VOUElDS0FCTEVfRVZFTlRTIiwiVEFSR0VUX1NVQlNUSVRVVEVfS0VZIiwiUERPTV9DTElDS19ERUxBWSIsIklucHV0IiwiY3VycmVudFNjZW5lcnlFdmVudCIsIklucHV0SU8iLCJ2YWx1ZVR5cGUiLCJhcHBseVN0YXRlIiwiXyIsIm5vb3AiLCJ0b1N0YXRlT2JqZWN0IiwiaW5wdXQiLCJwb2ludGVycyIsInN0YXRlU2NoZW1hIiwiY29uc3RydWN0b3IiLCJkaXNwbGF5IiwiYXR0YWNoVG9XaW5kb3ciLCJiYXRjaERPTUV2ZW50cyIsImFzc3VtZUZ1bGxXaW5kb3ciLCJwYXNzaXZlRXZlbnRzIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsInBoZXRpb1R5cGUiLCJwaGV0aW9Eb2N1bWVudGF0aW9uIiwicm9vdE5vZGUiLCJiYXRjaGVkRXZlbnRzIiwicGRvbVBvaW50ZXIiLCJtb3VzZSIsInBvaW50ZXJBZGRlZEVtaXR0ZXIiLCJjdXJyZW50bHlGaXJpbmdFdmVudHMiLCJ1cFRpbWVTdGFtcCIsInZhbGlkYXRlUG9pbnRlcnNBY3Rpb24iLCJpIiwibGVuZ3RoIiwicG9pbnRlciIsInBvaW50IiwiYnJhbmNoQ2hhbmdlRXZlbnRzIiwibGFzdEV2ZW50Q29udGV4dCIsImNyZWF0ZVN5bnRoZXRpYyIsInBoZXRpb1BsYXliYWNrIiwidGFuZGVtIiwiY3JlYXRlVGFuZGVtIiwicGhldGlvSGlnaEZyZXF1ZW5jeSIsIm1vdXNlVXBBY3Rpb24iLCJjb250ZXh0IiwiZW5zdXJlTW91c2UiLCJpZCIsInVwRXZlbnQiLCJwYXJhbWV0ZXJzIiwibmFtZSIsIlZlY3RvcjJJTyIsInBoZXRpb0V2ZW50VHlwZSIsIlVTRVIiLCJtb3VzZURvd25BY3Rpb24iLCJkb3duRXZlbnQiLCJtb3VzZU1vdmVBY3Rpb24iLCJtb3ZlIiwibW92ZUV2ZW50IiwibW91c2VPdmVyQWN0aW9uIiwib3ZlciIsIm1vdXNlT3V0QWN0aW9uIiwib3V0Iiwid2hlZWxTY3JvbGxBY3Rpb24iLCJldmVudCIsImRvbUV2ZW50IiwicG9pbnRGcm9tRXZlbnQiLCJ3aGVlbCIsInRyYWlsIiwidHJhaWxVbmRlclBvaW50ZXIiLCJkaXNwYXRjaEV2ZW50IiwidG91Y2hTdGFydEFjdGlvbiIsInRvdWNoIiwiYWRkUG9pbnRlciIsInRvdWNoRW5kQWN0aW9uIiwiZmluZFBvaW50ZXJCeUlkIiwiYXNzZXJ0IiwicmVtb3ZlUG9pbnRlciIsInRvdWNoTW92ZUFjdGlvbiIsInRvdWNoQ2FuY2VsQWN0aW9uIiwiY2FuY2VsRXZlbnQiLCJwZW5TdGFydEFjdGlvbiIsInBlbiIsInBlbkVuZEFjdGlvbiIsInBlbk1vdmVBY3Rpb24iLCJwZW5DYW5jZWxBY3Rpb24iLCJnb3RQb2ludGVyQ2FwdHVyZUFjdGlvbiIsIm9uR290UG9pbnRlckNhcHR1cmUiLCJsb3N0UG9pbnRlckNhcHR1cmVBY3Rpb24iLCJvbkxvc3RQb2ludGVyQ2FwdHVyZSIsImZvY3VzaW5BY3Rpb24iLCJnZXRQRE9NRXZlbnRUcmFpbCIsInNjZW5lcnlMb2ciLCJkZWJ1Z1RleHQiLCJwdXNoIiwiZGlzcGF0Y2hQRE9NRXZlbnQiLCJwb3AiLCJmb2N1c291dEFjdGlvbiIsImNsaWNrQWN0aW9uIiwiaW5wdXRBY3Rpb24iLCJjaGFuZ2VBY3Rpb24iLCJrZXlkb3duQWN0aW9uIiwia2V5dXBBY3Rpb24iLCJpbnRlcnJ1cHRQb2ludGVycyIsImV4Y2x1ZGVQb2ludGVyIiwiZWFjaCIsImludGVycnVwdEFsbCIsImJhdGNoRXZlbnQiLCJiYXRjaFR5cGUiLCJjYWxsYmFjayIsInRyaWdnZXJJbW1lZGlhdGUiLCJJbnB1dEV2ZW50IiwiaW50ZXJhY3RpdmUiLCJwb29sIiwiY3JlYXRlIiwiZmlyZUJhdGNoZWRFdmVudHMiLCJtb3VzZURvd24iLCJlZGdlIiwiQUxUX1RZUEUiLCJhbGxvd3NET01JbnB1dCIsInByZXZlbnREZWZhdWx0IiwiYmF0Y2hlZEV2ZW50IiwicnVuIiwiZGlzcG9zZSIsImNsZWFyQmF0Y2hlZEV2ZW50cyIsInZhbGlkYXRlUG9pbnRlcnMiLCJleGVjdXRlIiwicmVtb3ZlVGVtcG9yYXJ5UG9pbnRlcnMiLCJzcGxpY2UiLCJleGl0VHJhaWwiLCJleGl0RXZlbnRzIiwiY29ubmVjdExpc3RlbmVycyIsImFkZERpc3BsYXkiLCJkaXNjb25uZWN0TGlzdGVuZXJzIiwicmVtb3ZlRGlzcGxheSIsInBvc2l0aW9uIiwiY2xpZW50WCIsImNsaWVudFkiLCJkb21Cb3VuZHMiLCJkb21FbGVtZW50IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0Iiwid2lkdGgiLCJoZWlnaHQiLCJzdWJ0cmFjdFhZIiwibGVmdCIsInRvcCIsIngiLCJ5IiwiZW1pdCIsImV2ZW50TmFtZSIsImdldFRyYWlsRnJvbVBET01FdmVudCIsIm5vdEJsb2NraW5nU3Vic2VxdWVudENsaWNrc09jY3VycmluZ1Rvb1F1aWNrbHkiLCJzb21lIiwibm9kZXMiLCJub2RlIiwicG9zaXRpb25JblBET00iLCJ0aW1lU3RhbXAiLCJpbml0TW91c2UiLCJpbml0UERPTVBvaW50ZXIiLCJlbnN1cmVQRE9NUG9pbnRlciIsImV2ZW50VHlwZSIsImJ1YmJsZXMiLCJ1cGRhdGVUcmFpbCIsIlVTRVJfR0VTVFVSRV9FVkVOVFMiLCJpbmNsdWRlcyIsInVzZXJHZXN0dXJlRW1pdHRlciIsInRhcmdldCIsImhhc0F0dHJpYnV0ZSIsIkRBVEFfRVhDTFVERV9GUk9NX0lOUFVUIiwiY2FuRmlyZUxpc3RlbmVycyIsImlzUGlja2FibGUiLCJnZXRSZWxhdGVkVGFyZ2V0VHJhaWwiLCJyZWxhdGVkVGFyZ2V0RWxlbWVudCIsInJlbGF0ZWRUYXJnZXQiLCJpc0VsZW1lbnRVbmRlclBET00iLCJ3aW5kb3ciLCJFbGVtZW50IiwidHJhaWxJbmRpY2VzIiwiZ2V0QXR0cmlidXRlIiwiREFUQV9QRE9NX1VOSVFVRV9JRCIsInVuaXF1ZUlkVG9UcmFpbCIsIl9hY2Nlc3NpYmxlIiwibW91c2VVcCIsIm1vdXNlTW92ZSIsIm1vdXNlT3ZlciIsIm1vdXNlT3V0IiwidG91Y2hTdGFydCIsInRvdWNoRW5kIiwidG91Y2hNb3ZlIiwidG91Y2hDYW5jZWwiLCJwZW5TdGFydCIsInBlbkVuZCIsInBlbk1vdmUiLCJwZW5DYW5jZWwiLCJwb2ludGVyRG93biIsInR5cGUiLCJkb2N1bWVudCIsImJvZHkiLCJzZXRQb2ludGVyQ2FwdHVyZSIsInBvaW50ZXJJZCIsImhhbmRsZVVua25vd25Qb2ludGVyVHlwZSIsIkVycm9yIiwicG9pbnRlclVwIiwicG9pbnRlckNhbmNlbCIsImNvbnNvbGUiLCJsb2ciLCJnb3RQb2ludGVyQ2FwdHVyZSIsImxvc3RQb2ludGVyQ2FwdHVyZSIsInBvaW50ZXJNb3ZlIiwicG9pbnRlck92ZXIiLCJwb2ludGVyT3V0IiwicG9pbnRlckVudGVyIiwicG9pbnRlckxlYXZlIiwiZm9jdXNJbiIsImZvY3VzT3V0IiwiY2hhbmdlIiwiY2xpY2siLCJrZXlEb3duIiwia2V5VXAiLCJnZXRQb2ludGVyVHJhaWwiLCJwb2ludENoYW5nZWQiLCJ1cCIsInRvU3RyaW5nIiwiZXZlbnRUcmFpbCIsImlzVG91Y2hMaWtlIiwidXBkYXRlUG9pbnQiLCJkb3duIiwiY2FuY2VsIiwic2VuZE1vdmUiLCJpbnB1dEVuYWJsZWRUcmFpbCIsInNsaWNlIiwiTWF0aCIsIm1pbiIsImdldExhc3RJbnB1dEVuYWJsZWRJbmRleCIsIm9sZElucHV0RW5hYmxlZFRyYWlsIiwiYnJhbmNoSW5wdXRFbmFibGVkSW5kZXgiLCJicmFuY2hJbmRleCIsImxhc3RJbnB1dEVuYWJsZWROb2RlQ2hhbmdlZCIsImxhc3ROb2RlIiwib2xkVHJhaWwiLCJlbnRlckV2ZW50cyIsImxhc3ROb2RlQ2hhbmdlZCIsImZpcmVPbklucHV0RGlzYWJsZWQiLCJFdmVudERpc3BhdGNoIiwiRXZlbnRQYXRoIiwidG9QYXRoU3RyaW5nIiwiaW5wdXRFdmVudCIsImRpc3BhdGNoVG9MaXN0ZW5lcnMiLCJnZXRMaXN0ZW5lcnMiLCJkaXNwYXRjaFRvVGFyZ2V0cyIsImdldElucHV0TGlzdGVuZXJzIiwiaW5wdXRMaXN0ZW5lcnMiLCJsaXN0ZW5lcnMiLCJoYW5kbGVkIiwic3BlY2lmaWNUeXBlIiwibGlzdGVuZXIiLCJhYm9ydGVkIiwiaW5wdXRFbmFibGVkSW5kZXgiLCJ0cmFpbElucHV0RGlzYWJsZWQiLCJpc0Rpc3Bvc2VkIiwiY3VycmVudFRhcmdldCIsInNlcmlhbGl6ZURvbUV2ZW50IiwiZW50cmllcyIsImNvbnN0cnVjdG9yTmFtZSIsImZvckVhY2giLCJwcm9wZXJ0eSIsImRvbUV2ZW50UHJvcGVydHkiLCJ1bmRlZmluZWQiLCJKU09OIiwicGFyc2UiLCJzdHJpbmdpZnkiLCJkZXNlcmlhbGl6ZURvbUV2ZW50IiwiZXZlbnRPYmplY3QiLCJjb25maWdGb3JDb25zdHJ1Y3RvciIsInBpY2siLCJodG1sRWxlbWVudCIsImdldEVsZW1lbnRCeUlkIiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJjbG9uZSIsInJlc3VsdCIsIm1zUG9pbnRlclR5cGUiLCJwb2ludGVyVHlwZSIsIk1TUG9pbnRlckV2ZW50IiwiTVNQT0lOVEVSX1RZUEVfVE9VQ0giLCJNU1BPSU5URVJfVFlQRV9QRU4iLCJNU1BPSU5URVJfVFlQRV9NT1VTRSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiSW5wdXQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogTWFpbiBoYW5kbGVyIGZvciB1c2VyLWlucHV0IGV2ZW50cyBpbiBTY2VuZXJ5LlxyXG4gKlxyXG4gKiAqKiogQWRkaW5nIGlucHV0IGhhbmRsaW5nIHRvIGEgZGlzcGxheVxyXG4gKlxyXG4gKiBEaXNwbGF5cyBkbyBub3QgaGF2ZSBldmVudCBsaXN0ZW5lcnMgYXR0YWNoZWQgYnkgZGVmYXVsdC4gVG8gaW5pdGlhbGl6ZSB0aGUgZXZlbnQgc3lzdGVtICh0aGF0IHdpbGwgc2V0IHVwXHJcbiAqIGxpc3RlbmVycyksIHVzZSBvbmUgb2YgRGlzcGxheSdzIGluaXRpYWxpemUqRXZlbnRzIGZ1bmN0aW9ucy5cclxuICpcclxuICogKioqIFBvaW50ZXJzXHJcbiAqXHJcbiAqIEEgJ3BvaW50ZXInIGlzIGFuIGFic3RyYWN0IHdheSBvZiBkZXNjcmliaW5nIGEgbW91c2UsIGEgc2luZ2xlIHRvdWNoIHBvaW50LCBvciBhIHBlbi9zdHlsdXMsIHNpbWlsYXIgdG8gaW4gdGhlXHJcbiAqIFBvaW50ZXIgRXZlbnRzIHNwZWNpZmljYXRpb24gKGh0dHBzOi8vZHZjcy53My5vcmcvaGcvcG9pbnRlcmV2ZW50cy9yYXctZmlsZS90aXAvcG9pbnRlckV2ZW50cy5odG1sKS4gVG91Y2ggYW5kIHBlblxyXG4gKiBwb2ludGVycyBhcmUgdHJhbnNpZW50LCBjcmVhdGVkIHdoZW4gdGhlIHJlbGV2YW50IERPTSBkb3duIGV2ZW50IG9jY3VycyBhbmQgcmVsZWFzZWQgd2hlbiBjb3JyZXNwb25kaW5nIHRoZSBET00gdXBcclxuICogb3IgY2FuY2VsIGV2ZW50IG9jY3Vycy4gSG93ZXZlciwgdGhlIG1vdXNlIHBvaW50ZXIgaXMgcGVyc2lzdGVudC5cclxuICpcclxuICogSW5wdXQgZXZlbnQgbGlzdGVuZXJzIGNhbiBiZSBhZGRlZCB0byB7Tm9kZX1zIGRpcmVjdGx5LCBvciB0byBhIHBvaW50ZXIuIFdoZW4gYSBET00gZXZlbnQgaXMgcmVjZWl2ZWQsIGl0IGlzIGZpcnN0XHJcbiAqIGJyb2tlbiB1cCBpbnRvIG11bHRpcGxlIGV2ZW50cyAoaWYgbmVjZXNzYXJ5LCBlLmcuIG11bHRpcGxlIHRvdWNoIHBvaW50cyksIHRoZW4gdGhlIGRpc3BhdGNoIGlzIGhhbmRsZWQgZm9yIGVhY2hcclxuICogaW5kaXZpZHVhbCBTY2VuZXJ5IGV2ZW50LiBFdmVudHMgYXJlIGZpcnN0IGZpcmVkIGZvciBhbnkgbGlzdGVuZXJzIGF0dGFjaGVkIHRvIHRoZSBwb2ludGVyIHRoYXQgY2F1c2VkIHRoZSBldmVudCxcclxuICogdGhlbiBmaXJlIG9uIHRoZSBub2RlIGRpcmVjdGx5IHVuZGVyIHRoZSBwb2ludGVyLCBhbmQgaWYgYXBwbGljYWJsZSwgYnViYmxlIHVwIHRoZSBncmFwaCB0byB0aGUgU2NlbmUgZnJvbSB3aGljaCB0aGVcclxuICogZXZlbnQgd2FzIHRyaWdnZXJlZC4gRXZlbnRzIGFyZSBub3QgZmlyZWQgZGlyZWN0bHkgb24gbm9kZXMgdGhhdCBhcmUgbm90IHVuZGVyIHRoZSBwb2ludGVyIGF0IHRoZSB0aW1lIG9mIHRoZSBldmVudC5cclxuICogVG8gaGFuZGxlIG1hbnkgY29tbW9uIHBhdHRlcm5zIChsaWtlIGJ1dHRvbiBwcmVzc2VzLCB3aGVyZSBtb3VzZS11cHMgY291bGQgaGFwcGVuIHdoZW4gbm90IG92ZXIgdGhlIGJ1dHRvbiksIGl0IGlzXHJcbiAqIG5lY2Vzc2FyeSB0byBhZGQgdGhvc2UgbW92ZS91cCBsaXN0ZW5lcnMgdG8gdGhlIHBvaW50ZXIgaXRzZWxmLlxyXG4gKlxyXG4gKiAqKiogTGlzdGVuZXJzIGFuZCBFdmVudHNcclxuICpcclxuICogRXZlbnQgbGlzdGVuZXJzIGFyZSBhZGRlZCB3aXRoIG5vZGUuYWRkSW5wdXRMaXN0ZW5lciggbGlzdGVuZXIgKSwgcG9pbnRlci5hZGRJbnB1dExpc3RlbmVyKCBsaXN0ZW5lciApIGFuZFxyXG4gKiBkaXNwbGF5LmFkZElucHV0TGlzdGVuZXIoIGxpc3RlbmVyICkuXHJcbiAqIFRoaXMgbGlzdGVuZXIgY2FuIGJlIGFuIGFyYml0cmFyeSBvYmplY3QsIGFuZCB0aGUgbGlzdGVuZXIgd2lsbCBiZSB0cmlnZ2VyZWQgYnkgY2FsbGluZyBsaXN0ZW5lcltldmVudFR5cGVdKCBldmVudCApLFxyXG4gKiB3aGVyZSBldmVudFR5cGUgaXMgb25lIG9mIHRoZSBldmVudCB0eXBlcyBhcyBkZXNjcmliZWQgYmVsb3csIGFuZCBldmVudCBpcyBhIFNjZW5lcnkgZXZlbnQgd2l0aCB0aGVcclxuICogZm9sbG93aW5nIHByb3BlcnRpZXM6XHJcbiAqIC0gdHJhaWwge1RyYWlsfSAtIFBvaW50cyB0byB0aGUgbm9kZSB1bmRlciB0aGUgcG9pbnRlclxyXG4gKiAtIHBvaW50ZXIge1BvaW50ZXJ9IC0gVGhlIHBvaW50ZXIgdGhhdCB0cmlnZ2VyZWQgdGhlIGV2ZW50LiBBZGRpdGlvbmFsIGluZm9ybWF0aW9uIGFib3V0IHRoZSBtb3VzZS90b3VjaC9wZW4gY2FuIGJlXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICBvYnRhaW5lZCBmcm9tIHRoZSBwb2ludGVyLCBmb3IgZXhhbXBsZSBldmVudC5wb2ludGVyLnBvaW50LlxyXG4gKiAtIHR5cGUge3N0cmluZ30gLSBUaGUgYmFzZSB0eXBlIG9mIHRoZSBldmVudCAoZS5nLiBmb3IgdG91Y2ggZG93biBldmVudHMsIGl0IHdpbGwgYWx3YXlzIGp1c3QgYmUgXCJkb3duXCIpLlxyXG4gKiAtIGRvbUV2ZW50IHtVSUV2ZW50fSAtIFRoZSB1bmRlcmx5aW5nIERPTSBldmVudCB0aGF0IHRyaWdnZXJlZCB0aGlzIFNjZW5lcnkgZXZlbnQuIFRoZSBET00gZXZlbnQgbWF5IGNvcnJlc3BvbmQgdG9cclxuICogICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBsZSBTY2VuZXJ5IGV2ZW50cywgcGFydGljdWxhcmx5IGZvciB0b3VjaCBldmVudHMuIFRoaXMgY291bGQgYmUgYSBUb3VjaEV2ZW50LFxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgIFBvaW50ZXJFdmVudCwgTW91c2VFdmVudCwgTVNQb2ludGVyRXZlbnQsIGV0Yy5cclxuICogLSB0YXJnZXQge05vZGV9IC0gVGhlIGxlYWYtbW9zdCBOb2RlIGluIHRoZSB0cmFpbC5cclxuICogLSBjdXJyZW50VGFyZ2V0IHtOb2RlfSAtIFRoZSBOb2RlIHRvIHdoaWNoIHRoZSBsaXN0ZW5lciBiZWluZyBmaXJlZCBpcyBhdHRhY2hlZCwgb3IgbnVsbCBpZiB0aGUgbGlzdGVuZXIgaXMgYmVpbmdcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgIGZpcmVkIGRpcmVjdGx5IGZyb20gYSBwb2ludGVyLlxyXG4gKlxyXG4gKiBBZGRpdGlvbmFsbHksIGxpc3RlbmVycyBtYXkgc3VwcG9ydCBhbiBpbnRlcnJ1cHQoKSBtZXRob2QgdGhhdCBkZXRhY2hlcyBpdCBmcm9tIHBvaW50ZXJzLCBvciBtYXkgc3VwcG9ydCBiZWluZ1xyXG4gKiBcImF0dGFjaGVkXCIgdG8gYSBwb2ludGVyIChpbmRpY2F0aW5nIGEgcHJpbWFyeSByb2xlIGluIGNvbnRyb2xsaW5nIHRoZSBwb2ludGVyJ3MgYmVoYXZpb3IpLiBTZWUgUG9pbnRlciBmb3IgbW9yZVxyXG4gKiBpbmZvcm1hdGlvbiBhYm91dCB0aGVzZSBpbnRlcmFjdGlvbnMuXHJcbiAqXHJcbiAqICoqKiBFdmVudCBUeXBlc1xyXG4gKlxyXG4gKiBTY2VuZXJ5IHdpbGwgZmlyZSB0aGUgZm9sbG93aW5nIGJhc2UgZXZlbnQgdHlwZXM6XHJcbiAqXHJcbiAqIC0gZG93bjogVHJpZ2dlcmVkIHdoZW4gYSBwb2ludGVyIGlzIHByZXNzZWQgZG93bi4gVG91Y2ggLyBwZW4gcG9pbnRlcnMgYXJlIGNyZWF0ZWQgZm9yIGVhY2ggZG93biBldmVudCwgYW5kIGFyZVxyXG4gKiAgICAgICAgIGFjdGl2ZSB1bnRpbCBhbiB1cC9jYW5jZWwgZXZlbnQgaXMgc2VudC5cclxuICogLSB1cDogVHJpZ2dlcmVkIHdoZW4gYSBwb2ludGVyIGlzIHJlbGVhc2VkIG5vcm1hbGx5LiBUb3VjaCAvIHBlbiBwb2ludGVycyB3aWxsIG5vdCBoYXZlIGFueSBtb3JlIGV2ZW50cyBhc3NvY2lhdGVkXHJcbiAqICAgICAgIHdpdGggdGhlbSBhZnRlciBhbiB1cCBldmVudC5cclxuICogLSBjYW5jZWw6IFRyaWdnZXJlZCB3aGVuIGEgcG9pbnRlciBpcyBjYW5jZWxlZCBhYm5vcm1hbGx5LiBUb3VjaCAvIHBlbiBwb2ludGVycyB3aWxsIG5vdCBoYXZlIGFueSBtb3JlIGV2ZW50c1xyXG4gKiAgICAgICAgICAgYXNzb2NpYXRlZCB3aXRoIHRoZW0gYWZ0ZXIgYW4gdXAgZXZlbnQuXHJcbiAqIC0gbW92ZTogVHJpZ2dlcmVkIHdoZW4gYSBwb2ludGVyIG1vdmVzLlxyXG4gKiAtIHdoZWVsOiBUcmlnZ2VyZWQgd2hlbiB0aGUgKG1vdXNlKSB3aGVlbCBpcyBzY3JvbGxlZC4gVGhlIGFzc29jaWF0ZWQgcG9pbnRlciB3aWxsIGhhdmUgd2hlZWxEZWx0YSBpbmZvcm1hdGlvbi5cclxuICogLSBlbnRlcjogVHJpZ2dlcmVkIHdoZW4gYSBwb2ludGVyIG1vdmVzIG92ZXIgYSBOb2RlIG9yIG9uZSBvZiBpdHMgY2hpbGRyZW4uIERvZXMgbm90IGJ1YmJsZSB1cC4gTWlycm9ycyBiZWhhdmlvciBmcm9tXHJcbiAqICAgICAgICAgIHRoZSBET00gbW91c2VlbnRlciAoaHR0cDovL3d3dy53My5vcmcvVFIvRE9NLUxldmVsLTMtRXZlbnRzLyNldmVudC10eXBlLW1vdXNlZW50ZXIpXHJcbiAqIC0gZXhpdDogIFRyaWdnZXJlZCB3aGVuIGEgcG9pbnRlciBtb3ZlcyBvdXQgZnJvbSBvdmVyIGEgTm9kZSBvciBvbmUgb2YgaXRzIGNoaWxkcmVuLiBEb2VzIG5vdCBidWJibGUgdXAuIE1pcnJvcnNcclxuICogICAgICAgICAgYmVoYXZpb3IgZnJvbSB0aGUgRE9NIG1vdXNlbGVhdmUgKGh0dHA6Ly93d3cudzMub3JnL1RSL0RPTS1MZXZlbC0zLUV2ZW50cy8jZXZlbnQtdHlwZS1tb3VzZWxlYXZlKS5cclxuICogLSBvdmVyOiBUcmlnZ2VyZWQgd2hlbiBhIHBvaW50ZXIgbW92ZXMgb3ZlciBhIE5vZGUgKG5vdCBpbmNsdWRpbmcgaXRzIGNoaWxkcmVuKS4gTWlycm9ycyBiZWhhdmlvciBmcm9tIHRoZSBET01cclxuICogICAgICAgICBtb3VzZW92ZXIgKGh0dHA6Ly93d3cudzMub3JnL1RSL0RPTS1MZXZlbC0zLUV2ZW50cy8jZXZlbnQtdHlwZS1tb3VzZW92ZXIpLlxyXG4gKiAtIG91dDogVHJpZ2dlcmVkIHdoZW4gYSBwb2ludGVyIG1vdmVzIG91dCBmcm9tIG92ZXIgYSBOb2RlIChub3QgaW5jbHVkaW5nIGl0cyBjaGlsZHJlbikuIE1pcnJvcnMgYmVoYXZpb3IgZnJvbSB0aGVcclxuICogICAgICAgIERPTSBtb3VzZW91dCAoaHR0cDovL3d3dy53My5vcmcvVFIvRE9NLUxldmVsLTMtRXZlbnRzLyNldmVudC10eXBlLW1vdXNlb3V0KS5cclxuICpcclxuICogQmVmb3JlIGZpcmluZyB0aGUgYmFzZSBldmVudCB0eXBlIChmb3IgZXhhbXBsZSwgJ21vdmUnKSwgU2NlbmVyeSB3aWxsIGFsc28gZmlyZSBhbiBldmVudCBzcGVjaWZpYyB0byB0aGUgdHlwZSBvZlxyXG4gKiBwb2ludGVyLiBGb3IgbWljZSwgaXQgd2lsbCBmaXJlICdtb3VzZW1vdmUnLCBmb3IgdG91Y2ggZXZlbnRzIGl0IHdpbGwgZmlyZSAndG91Y2htb3ZlJywgYW5kIGZvciBwZW4gZXZlbnRzIGl0IHdpbGxcclxuICogZmlyZSAncGVubW92ZScuIFNpbWlsYXJseSwgZm9yIGFueSB0eXBlIG9mIGV2ZW50LCBpdCB3aWxsIGZpcnN0IGZpcmUgcG9pbnRlclR5cGUrZXZlbnRUeXBlLCBhbmQgdGhlbiBldmVudFR5cGUuXHJcbiAqXHJcbiAqICoqKiogUERPTSBTcGVjaWZpYyBFdmVudCBUeXBlc1xyXG4gKlxyXG4gKiBTb21lIGV2ZW50IHR5cGVzIGNhbiBvbmx5IGJlIHRyaWdnZXJlZCBmcm9tIHRoZSBQRE9NLiBJZiBhIFNDRU5FUlkvTm9kZSBoYXMgYWNjZXNzaWJsZSBjb250ZW50IChzZWVcclxuICogUGFyYWxsZWxET00uanMgZm9yIG1vcmUgaW5mbyksIHRoZW4gbGlzdGVuZXJzIGNhbiBiZSBhZGRlZCBmb3IgZXZlbnRzIGZpcmVkIGZyb20gdGhlIFBET00uIFRoZSBhY2Nlc3NpYmlsaXR5IGV2ZW50c1xyXG4gKiB0cmlnZ2VyZWQgZnJvbSBhIE5vZGUgYXJlIGRlcGVuZGVudCBvbiB0aGUgYHRhZ05hbWVgIChlcmdvIHRoZSBIVE1MRWxlbWVudCBwcmltYXJ5IHNpYmxpbmcpIHNwZWNpZmllZCBieSB0aGUgTm9kZS5cclxuICpcclxuICogU29tZSB0ZXJtaW5vbG9neSBmb3IgdW5kZXJzdGFuZGluZzpcclxuICogLSBQRE9NOiAgcGFyYWxsZWwgRE9NLCBzZWUgUGFyYWxsZWxET00uanNcclxuICogLSBQcmltYXJ5IFNpYmxpbmc6ICBUaGUgTm9kZSdzIEhUTUxFbGVtZW50IGluIHRoZSBQRE9NIHRoYXQgaXMgaW50ZXJhY3RlZCB3aXRoIGZvciBhY2Nlc3NpYmxlIGludGVyYWN0aW9ucyBhbmQgdG9cclxuICogICAgICAgICAgICAgICAgICAgICBkaXNwbGF5IGFjY2Vzc2libGUgY29udGVudC4gVGhlIHByaW1hcnkgc2libGluZyBoYXMgdGhlIHRhZyBuYW1lIHNwZWNpZmllZCBieSB0aGUgYHRhZ05hbWVgXHJcbiAqICAgICAgICAgICAgICAgICAgICAgb3B0aW9uLCBzZWUgYFBhcmFsbGVsRE9NLnNldFRhZ05hbWVgLiBQcmltYXJ5IHNpYmxpbmcgaXMgZnVydGhlciBkZWZpbmVkIGluIFBET01QZWVyLmpzXHJcbiAqIC0gQXNzaXN0aXZlIFRlY2hub2xvZ3k6ICBha2EgQVQsIGRldmljZXMgbWVhbnQgdG8gaW1wcm92ZSB0aGUgY2FwYWJpbGl0aWVzIG9mIGFuIGluZGl2aWR1YWwgd2l0aCBhIGRpc2FiaWxpdHkuXHJcbiAqXHJcbiAqIFRoZSBmb2xsb3dpbmcgYXJlIHRoZSBzdXBwb3J0ZWQgYWNjZXNzaWJsZSBldmVudHM6XHJcbiAqXHJcbiAqIC0gZm9jdXM6IFRyaWdnZXJlZCB3aGVuIG5hdmlnYXRpb24gZm9jdXMgaXMgc2V0IHRvIHRoaXMgTm9kZSdzIHByaW1hcnkgc2libGluZy4gVGhpcyBjYW4gYmUgdHJpZ2dlcmVkIHdpdGggc29tZVxyXG4gKiAgICAgICAgICBBVCB0b28sIGxpa2Ugc2NyZWVuIHJlYWRlcnMnIHZpcnR1YWwgY3Vyc29yLCBidXQgdGhhdCBpcyBub3QgZGVwZW5kYWJsZSBhcyBpdCBjYW4gYmUgdG9nZ2xlZCB3aXRoIGEgc2NyZWVuXHJcbiAqICAgICAgICAgIHJlYWRlciBvcHRpb24uIEZ1cnRoZXJtb3JlLCB0aGlzIGV2ZW50IGlzIG5vdCB0cmlnZ2VyZWQgb24gbW9iaWxlIGRldmljZXMuIERvZXMgbm90IGJ1YmJsZS5cclxuICogLSBmb2N1c2luOiBTYW1lIGFzICdmb2N1cycgZXZlbnQsIGJ1dCBidWJibGVzLlxyXG4gKiAtIGJsdXI6ICBUcmlnZ2VyZWQgd2hlbiBuYXZpZ2F0aW9uIGZvY3VzIGxlYXZlcyB0aGlzIE5vZGUncyBwcmltYXJ5IHNpYmxpbmcuIFRoaXMgY2FuIGJlIHRyaWdnZXJlZCB3aXRoIHNvbWVcclxuICogICAgICAgICAgQVQgdG9vLCBsaWtlIHNjcmVlbiByZWFkZXJzJyB2aXJ0dWFsIGN1cnNvciwgYnV0IHRoYXQgaXMgbm90IGRlcGVuZGFibGUgYXMgaXQgY2FuIGJlIHRvZ2dsZWQgd2l0aCBhIHNjcmVlblxyXG4gKiAgICAgICAgICByZWFkZXIgb3B0aW9uLiBGdXJ0aGVybW9yZSwgdGhpcyBldmVudCBpcyBub3QgdHJpZ2dlcmVkIG9uIG1vYmlsZSBkZXZpY2VzLlxyXG4gKiAtIGZvY3Vzb3V0OiBTYW1lIGFzICdibHVyJyBldmVudCwgYnV0IGJ1YmJsZXMuXHJcbiAqIC0gY2xpY2s6ICBUcmlnZ2VyZWQgd2hlbiB0aGlzIE5vZGUncyBwcmltYXJ5IHNpYmxpbmcgaXMgY2xpY2tlZC4gTm90ZSwgdGhvdWdoIHRoaXMgZXZlbnQgc2VlbXMgc2ltaWxhciB0byBzb21lIGJhc2VcclxuICogICAgICAgICAgIGV2ZW50IHR5cGVzICh0aGUgZXZlbnQgaW1wbGVtZW50cyBgTW91c2VFdmVudGApLCBpdCBvbmx5IGFwcGxpZXMgd2hlbiB0cmlnZ2VyZWQgZnJvbSB0aGUgUERPTS5cclxuICogICAgICAgICAgIFNlZSBodHRwczovL3d3dy53My5vcmcvVFIvRE9NLUxldmVsLTMtRXZlbnRzLyNjbGlja1xyXG4gKiAtIGlucHV0OiAgVHJpZ2dlcmVkIHdoZW4gdGhlIHZhbHVlIG9mIGFuIDxpbnB1dD4sIDxzZWxlY3Q+LCBvciA8dGV4dGFyZWE+IGVsZW1lbnQgaGFzIGJlZW4gY2hhbmdlZC5cclxuICogICAgICAgICAgIFNlZSBodHRwczovL3d3dy53My5vcmcvVFIvRE9NLUxldmVsLTMtRXZlbnRzLyNpbnB1dFxyXG4gKiAtIGNoYW5nZTogIFRyaWdnZXJlZCBmb3IgPGlucHV0PiwgPHNlbGVjdD4sIGFuZCA8dGV4dGFyZWE+IGVsZW1lbnRzIHdoZW4gYW4gYWx0ZXJhdGlvbiB0byB0aGUgZWxlbWVudCdzIHZhbHVlIGlzXHJcbiAqICAgICAgICAgICAgY29tbWl0dGVkIGJ5IHRoZSB1c2VyLiBVbmxpa2UgdGhlIGlucHV0IGV2ZW50LCB0aGUgY2hhbmdlIGV2ZW50IGlzIG5vdCBuZWNlc3NhcmlseSBmaXJlZCBmb3IgZWFjaFxyXG4gKiAgICAgICAgICAgIGFsdGVyYXRpb24gdG8gYW4gZWxlbWVudCdzIHZhbHVlLiBTZWVcclxuICogICAgICAgICAgICBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvSFRNTEVsZW1lbnQvY2hhbmdlX2V2ZW50IGFuZFxyXG4gKiAgICAgICAgICAgIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2luZGljZXMuaHRtbCNldmVudC1jaGFuZ2VcclxuICogLSBrZXlkb3duOiBUcmlnZ2VyZWQgZm9yIGFsbCBrZXlzIHByZXNzZWQuIFdoZW4gYSBzY3JlZW4gcmVhZGVyIGlzIGFjdGl2ZSwgdGhpcyBldmVudCB3aWxsIGJlIG9taXR0ZWRcclxuICogICAgICAgICAgICByb2xlPVwiYnV0dG9uXCIgaXMgYWN0aXZhdGVkLlxyXG4gKiAgICAgICAgICAgIFNlZSBodHRwczovL3d3dy53My5vcmcvVFIvRE9NLUxldmVsLTMtRXZlbnRzLyNrZXlkb3duXHJcbiAqIC0ga2V5dXAgOiAgVHJpZ2dlcmVkIGZvciBhbGwga2V5cyB3aGVuIHJlbGVhc2VkLiBXaGVuIGEgc2NyZWVuIHJlYWRlciBpcyBhY3RpdmUsIHRoaXMgZXZlbnQgd2lsbCBiZSBvbWl0dGVkXHJcbiAqICAgICAgICAgICAgcm9sZT1cImJ1dHRvblwiIGlzIGFjdGl2YXRlZC5cclxuICogICAgICAgICAgICBTZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL0RPTS1MZXZlbC0zLUV2ZW50cy8ja2V5dXBcclxuICpcclxuICogKioqIEV2ZW50IERpc3BhdGNoXHJcbiAqXHJcbiAqIEV2ZW50cyBoYXZlIHR3byBtZXRob2RzIHRoYXQgd2lsbCBjYXVzZSBlYXJseSB0ZXJtaW5hdGlvbjogZXZlbnQuYWJvcnQoKSB3aWxsIGNhdXNlIG5vIG1vcmUgbGlzdGVuZXJzIHRvIGJlIG5vdGlmaWVkXHJcbiAqIGZvciB0aGlzIGV2ZW50LCBhbmQgZXZlbnQuaGFuZGxlKCkgd2lsbCBhbGxvdyB0aGUgY3VycmVudCBsZXZlbCBvZiBsaXN0ZW5lcnMgdG8gYmUgbm90aWZpZWQgKGFsbCBwb2ludGVyIGxpc3RlbmVycyxcclxuICogb3IgYWxsIGxpc3RlbmVycyBhdHRhY2hlZCB0byB0aGUgY3VycmVudCBub2RlKSwgYnV0IG5vIG1vcmUgbGlzdGVuZXJzIGFmdGVyIHRoYXQgbGV2ZWwgd2lsbCBmaXJlLiBoYW5kbGUgYW5kIGFib3J0XHJcbiAqIGFyZSBsaWtlIHN0b3BQcm9wYWdhdGlvbiwgc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uIGZvciBET00gZXZlbnRzLCBleGNlcHQgdGhleSBkbyBub3QgdHJpZ2dlciB0aG9zZSBET00gbWV0aG9kcyBvblxyXG4gKiB0aGUgdW5kZXJseWluZyBET00gZXZlbnQuXHJcbiAqXHJcbiAqIFVwL2Rvd24vY2FuY2VsIGV2ZW50cyBhbGwgaGFwcGVuIHNlcGFyYXRlbHksIGJ1dCBmb3IgbW92ZSBldmVudHMsIGEgc3BlY2lmaWMgc2VxdWVuY2Ugb2YgZXZlbnRzIG9jY3VycyBpZiB0aGUgcG9pbnRlclxyXG4gKiBjaGFuZ2VzIHRoZSBub2RlIGl0IGlzIG92ZXI6XHJcbiAqXHJcbiAqIDEuIFRoZSBtb3ZlIGV2ZW50IGlzIGZpcmVkIChhbmQgYnViYmxlcykuXHJcbiAqIDIuIEFuIG91dCBldmVudCBpcyBmaXJlZCBmb3IgdGhlIG9sZCB0b3Btb3N0IE5vZGUgKGFuZCBidWJibGVzKS5cclxuICogMy4gZXhpdCBldmVudHMgYXJlIGZpcmVkIGZvciBhbGwgTm9kZXMgaW4gdGhlIFRyYWlsIGhpZXJhcmNoeSB0aGF0IGFyZSBub3cgbm90IHVuZGVyIHRoZSBwb2ludGVyLCBmcm9tIHRoZSByb290LW1vc3RcclxuICogICAgdG8gdGhlIGxlYWYtbW9zdC4gRG9lcyBub3QgYnViYmxlLlxyXG4gKiA0LiBlbnRlciBldmVudHMgYXJlIGZpcmVkIGZvciBhbGwgTm9kZXMgaW4gdGhlIFRyYWlsIGhpZXJhcmNoeSB0aGF0IHdlcmUgbm90IHVuZGVyIHRoZSBwb2ludGVyIChidXQgbm93IGFyZSksIGZyb21cclxuICogICAgdGhlIGxlYWYtbW9zdCB0byB0aGUgcm9vdC1tb3N0LiBEb2VzIG5vdCBidWJibGUuXHJcbiAqIDUuIEFuIG92ZXIgZXZlbnQgaXMgZmlyZWQgZm9yIHRoZSBuZXcgdG9wbW9zdCBOb2RlIChhbmQgYnViYmxlcykuXHJcbiAqXHJcbiAqIGV2ZW50LmFib3J0KCkgYW5kIGV2ZW50LmhhbmRsZSgpIHdpbGwgY3VycmVudGx5IG5vdCBhZmZlY3Qgb3RoZXIgc3RhZ2VzIGluIHRoZSAnbW92ZScgc2VxdWVuY2UgKGUuZy4gZXZlbnQuYWJvcnQoKSBpblxyXG4gKiB0aGUgJ21vdmUnIGV2ZW50IHdpbGwgbm90IGFmZmVjdCB0aGUgZm9sbG93aW5nICdvdXQnIGV2ZW50KS5cclxuICpcclxuICogRm9yIGVhY2ggZXZlbnQgdHlwZTpcclxuICpcclxuICogMS4gTGlzdGVuZXJzIG9uIHRoZSBwb2ludGVyIHdpbGwgYmUgdHJpZ2dlcmVkIGZpcnN0IChpbiB0aGUgb3JkZXIgdGhleSB3ZXJlIGFkZGVkKVxyXG4gKiAyLiBMaXN0ZW5lcnMgb24gdGhlIHRhcmdldCAodG9wLW1vc3QpIE5vZGUgd2lsbCBiZSB0cmlnZ2VyZWQgKGluIHRoZSBvcmRlciB0aGV5IHdlcmUgYWRkZWQgdG8gdGhhdCBOb2RlKVxyXG4gKiAzLiBUaGVuIGlmIHRoZSBldmVudCBidWJibGVzLCBlYWNoIE5vZGUgaW4gdGhlIFRyYWlsIHdpbGwgYmUgdHJpZ2dlcmVkLCBzdGFydGluZyBmcm9tIHRoZSBOb2RlIHVuZGVyIHRoZSB0b3AtbW9zdFxyXG4gKiAgICAodGhhdCBqdXN0IGhhZCBsaXN0ZW5lcnMgdHJpZ2dlcmVkKSBhbmQgYWxsIHRoZSB3YXkgZG93biB0byB0aGUgU2NlbmUuIExpc3RlbmVycyBhcmUgdHJpZ2dlcmVkIGluIHRoZSBvcmRlciB0aGV5XHJcbiAqICAgIHdlcmUgYWRkZWQgZm9yIGVhY2ggTm9kZS5cclxuICogNC4gTGlzdGVuZXJzIG9uIHRoZSBkaXNwbGF5IHdpbGwgYmUgdHJpZ2dlcmVkIChpbiB0aGUgb3JkZXIgdGhleSB3ZXJlIGFkZGVkKVxyXG4gKlxyXG4gKiBGb3IgZWFjaCBsaXN0ZW5lciBiZWluZyBub3RpZmllZCwgaXQgd2lsbCBmaXJlIHRoZSBtb3JlIHNwZWNpZmljIHBvaW50ZXJUeXBlK2V2ZW50VHlwZSBmaXJzdCAoZS5nLiAnbW91c2Vtb3ZlJyksXHJcbiAqIHRoZW4gZXZlbnRUeXBlIG5leHQgKGUuZy4gJ21vdmUnKS5cclxuICpcclxuICogQ3VycmVudGx5LCBwcmV2ZW50RGVmYXVsdCgpIGlzIGNhbGxlZCBvbiB0aGUgYXNzb2NpYXRlZCBET00gZXZlbnQgaWYgdGhlIHRvcC1tb3N0IG5vZGUgaGFzIHRoZSAnaW50ZXJhY3RpdmUnIHByb3BlcnR5XHJcbiAqIHNldCB0byBhIHRydXRoeSB2YWx1ZS5cclxuICpcclxuICogKioqIFJlbGV2YW50IFNwZWNpZmljYXRpb25zXHJcbiAqXHJcbiAqIERPTSBMZXZlbCAzIGV2ZW50cyBzcGVjOiBodHRwOi8vd3d3LnczLm9yZy9UUi9ET00tTGV2ZWwtMy1FdmVudHMvXHJcbiAqIFRvdWNoIGV2ZW50cyBzcGVjOiBodHRwOi8vd3d3LnczLm9yZy9UUi90b3VjaC1ldmVudHMvXHJcbiAqIFBvaW50ZXIgZXZlbnRzIHNwZWMgZHJhZnQ6IGh0dHBzOi8vZHZjcy53My5vcmcvaGcvcG9pbnRlcmV2ZW50cy9yYXctZmlsZS90aXAvcG9pbnRlckV2ZW50cy5odG1sXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9oaDY3MzU1Nyh2PXZzLjg1KS5hc3B4XHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgUGhldGlvQWN0aW9uIGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy9QaGV0aW9BY3Rpb24uanMnO1xyXG5pbXBvcnQgVGlueUVtaXR0ZXIgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UaW55RW1pdHRlci5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IGNsZWFuQXJyYXkgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL2NsZWFuQXJyYXkuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplLCB7IEVtcHR5U2VsZk9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IHBsYXRmb3JtIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9wbGF0Zm9ybS5qcyc7XHJcbmltcG9ydCBFdmVudFR5cGUgZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL0V2ZW50VHlwZS5qcyc7XHJcbmltcG9ydCBOdWxsYWJsZUlPIGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy90eXBlcy9OdWxsYWJsZUlPLmpzJztcclxuaW1wb3J0IE51bWJlcklPIGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy90eXBlcy9OdW1iZXJJTy5qcyc7XHJcbmltcG9ydCB7IEJhdGNoZWRET01FdmVudCwgQmF0Y2hlZERPTUV2ZW50Q2FsbGJhY2ssIEJhdGNoZWRET01FdmVudFR5cGUsIEJyb3dzZXJFdmVudHMsIERpc3BsYXksIEV2ZW50Q29udGV4dCwgRXZlbnRDb250ZXh0SU8sIE1vdXNlLCBOb2RlLCBQRE9NSW5zdGFuY2UsIFBET01Qb2ludGVyLCBQRE9NVXRpbHMsIFBlbiwgUG9pbnRlciwgc2NlbmVyeSwgU2NlbmVyeUV2ZW50LCBTY2VuZXJ5TGlzdGVuZXJGdW5jdGlvbiwgU3VwcG9ydGVkRXZlbnRUeXBlcywgVElucHV0TGlzdGVuZXIsIFRvdWNoLCBUcmFpbCwgV2luZG93VG91Y2ggfSBmcm9tICcuLi9pbXBvcnRzLmpzJztcclxuaW1wb3J0IFBoZXRpb09iamVjdCwgeyBQaGV0aW9PYmplY3RPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL1BoZXRpb09iamVjdC5qcyc7XHJcbmltcG9ydCBJT1R5cGUgZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL3R5cGVzL0lPVHlwZS5qcyc7XHJcbmltcG9ydCBBcnJheUlPIGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy90eXBlcy9BcnJheUlPLmpzJztcclxuaW1wb3J0IFBpY2tPcHRpb25hbCBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvUGlja09wdGlvbmFsLmpzJztcclxuaW1wb3J0IFRFbWl0dGVyIGZyb20gJy4uLy4uLy4uL2F4b24vanMvVEVtaXR0ZXIuanMnO1xyXG5cclxuY29uc3QgQXJyYXlJT1BvaW50ZXJJTyA9IEFycmF5SU8oIFBvaW50ZXIuUG9pbnRlcklPICk7XHJcblxyXG4vLyBUaGlzIGlzIHRoZSBsaXN0IG9mIGtleXMgdGhhdCBnZXQgc2VyaWFsaXplZCBBTkQgZGVzZXJpYWxpemVkLiBOT1RFOiBEbyBub3QgYWRkIG9yIGNoYW5nZSB0aGlzIHdpdGhvdXRcclxuLy8gY29uc3VsdGluZyB0aGUgUGhFVC1pTyBJT1R5cGUgc2NoZW1hIGZvciB0aGlzIGluIEV2ZW50SU9cclxuY29uc3QgZG9tRXZlbnRQcm9wZXJ0aWVzVG9TZXJpYWxpemUgPSBbXHJcbiAgJ2FsdEtleScsXHJcbiAgJ2J1dHRvbicsXHJcbiAgJ2NoYXJDb2RlJyxcclxuICAnY2xpZW50WCcsXHJcbiAgJ2NsaWVudFknLFxyXG4gICdjb2RlJyxcclxuICAnY3RybEtleScsXHJcbiAgJ2RlbHRhTW9kZScsXHJcbiAgJ2RlbHRhWCcsXHJcbiAgJ2RlbHRhWScsXHJcbiAgJ2RlbHRhWicsXHJcbiAgJ2tleScsXHJcbiAgJ2tleUNvZGUnLFxyXG4gICdtZXRhS2V5JyxcclxuICAncGFnZVgnLFxyXG4gICdwYWdlWScsXHJcbiAgJ3BvaW50ZXJJZCcsXHJcbiAgJ3BvaW50ZXJUeXBlJyxcclxuICAnc2NhbGUnLFxyXG4gICdzaGlmdEtleScsXHJcbiAgJ3RhcmdldCcsXHJcbiAgJ3R5cGUnLFxyXG4gICdyZWxhdGVkVGFyZ2V0JyxcclxuICAnd2hpY2gnXHJcbl0gYXMgY29uc3Q7XHJcblxyXG4vLyBUaGUgbGlzdCBvZiBzZXJpYWxpemVkIHByb3BlcnRpZXMgbmVlZGVkIGZvciBkZXNlcmlhbGl6YXRpb25cclxudHlwZSBTZXJpYWxpemVkUHJvcGVydGllc0ZvckRlc2VyaWFsaXphdGlvbiA9IHR5cGVvZiBkb21FdmVudFByb3BlcnRpZXNUb1NlcmlhbGl6ZVtudW1iZXJdO1xyXG5cclxuLy8gQ2Fubm90IGJlIHNldCBhZnRlciBjb25zdHJ1Y3Rpb24sIGFuZCBzaG91bGQgYmUgcHJvdmlkZWQgaW4gdGhlIGluaXQgY29uZmlnIHRvIHRoZSBjb25zdHJ1Y3RvcigpLCBzZWUgSW5wdXQuZGVzZXJpYWxpemVET01FdmVudFxyXG5jb25zdCBkb21FdmVudFByb3BlcnRpZXNTZXRJbkNvbnN0cnVjdG9yOiBTZXJpYWxpemVkUHJvcGVydGllc0ZvckRlc2VyaWFsaXphdGlvbltdID0gW1xyXG4gICdkZWx0YU1vZGUnLFxyXG4gICdkZWx0YVgnLFxyXG4gICdkZWx0YVknLFxyXG4gICdkZWx0YVonLFxyXG4gICdhbHRLZXknLFxyXG4gICdidXR0b24nLFxyXG4gICdjaGFyQ29kZScsXHJcbiAgJ2NsaWVudFgnLFxyXG4gICdjbGllbnRZJyxcclxuICAnY29kZScsXHJcbiAgJ2N0cmxLZXknLFxyXG4gICdrZXknLFxyXG4gICdrZXlDb2RlJyxcclxuICAnbWV0YUtleScsXHJcbiAgJ3BhZ2VYJyxcclxuICAncGFnZVknLFxyXG4gICdwb2ludGVySWQnLFxyXG4gICdwb2ludGVyVHlwZScsXHJcbiAgJ3NoaWZ0S2V5JyxcclxuICAndHlwZScsXHJcbiAgJ3JlbGF0ZWRUYXJnZXQnLFxyXG4gICd3aGljaCdcclxuXTtcclxuXHJcbnR5cGUgU2VyaWFsaXplZERPTUV2ZW50ID0ge1xyXG4gIGNvbnN0cnVjdG9yTmFtZTogc3RyaW5nOyAvLyB1c2VkIHRvIGdldCB0aGUgY29uc3RydWN0b3IgZnJvbSB0aGUgd2luZG93IG9iamVjdCwgc2VlIElucHV0LmRlc2VyaWFsaXplRE9NRXZlbnRcclxufSAmIHtcclxuICBba2V5IGluIFNlcmlhbGl6ZWRQcm9wZXJ0aWVzRm9yRGVzZXJpYWxpemF0aW9uXT86IHVua25vd247XHJcbn07XHJcblxyXG4vLyBBIGxpc3Qgb2Yga2V5cyBvbiBldmVudHMgdGhhdCBuZWVkIHRvIGJlIHNlcmlhbGl6ZWQgaW50byBIVE1MRWxlbWVudHNcclxuY29uc3QgRVZFTlRfS0VZX1ZBTFVFU19BU19FTEVNRU5UUzogU2VyaWFsaXplZFByb3BlcnRpZXNGb3JEZXNlcmlhbGl6YXRpb25bXSA9IFsgJ3RhcmdldCcsICdyZWxhdGVkVGFyZ2V0JyBdO1xyXG5cclxuLy8gQSBsaXN0IG9mIGV2ZW50cyB0aGF0IHNob3VsZCBzdGlsbCBmaXJlLCBldmVuIHdoZW4gdGhlIE5vZGUgaXMgbm90IHBpY2thYmxlXHJcbmNvbnN0IFBET01fVU5QSUNLQUJMRV9FVkVOVFMgPSBbICdmb2N1cycsICdibHVyJywgJ2ZvY3VzaW4nLCAnZm9jdXNvdXQnIF07XHJcbmNvbnN0IFRBUkdFVF9TVUJTVElUVVRFX0tFWSA9ICd0YXJnZXRTdWJzdGl0dXRlJztcclxudHlwZSBUYXJnZXRTdWJzdGl0dWRlQXVnbWVudGVkRXZlbnQgPSBFdmVudCAmIHtcclxuICBbIFRBUkdFVF9TVUJTVElUVVRFX0tFWSBdPzogRWxlbWVudDtcclxufTtcclxuXHJcblxyXG4vLyBBIGJpdCBtb3JlIHRoYW4gdGhlIG1heGltdW0gYW1vdW50IG9mIHRpbWUgdGhhdCBpT1MgMTQgVm9pY2VPdmVyIHdhcyBvYnNlcnZlZCB0byBkZWxheSBiZXR3ZWVuXHJcbi8vIHNlbmRpbmcgYSBtb3VzZXVwIGV2ZW50IGFuZCBhIGNsaWNrIGV2ZW50LlxyXG5jb25zdCBQRE9NX0NMSUNLX0RFTEFZID0gODA7XHJcblxyXG50eXBlIFNlbGZPcHRpb25zID0gRW1wdHlTZWxmT3B0aW9ucztcclxuXHJcbmV4cG9ydCB0eXBlIElucHV0T3B0aW9ucyA9IFNlbGZPcHRpb25zICYgUGlja09wdGlvbmFsPFBoZXRpb09iamVjdE9wdGlvbnMsICd0YW5kZW0nPjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIElucHV0IGV4dGVuZHMgUGhldGlvT2JqZWN0IHtcclxuXHJcbiAgcHVibGljIHJlYWRvbmx5IGRpc3BsYXk6IERpc3BsYXk7XHJcbiAgcHVibGljIHJlYWRvbmx5IHJvb3ROb2RlOiBOb2RlO1xyXG5cclxuICBwdWJsaWMgcmVhZG9ubHkgYXR0YWNoVG9XaW5kb3c6IGJvb2xlYW47XHJcbiAgcHVibGljIHJlYWRvbmx5IGJhdGNoRE9NRXZlbnRzOiBib29sZWFuO1xyXG4gIHB1YmxpYyByZWFkb25seSBhc3N1bWVGdWxsV2luZG93OiBib29sZWFuO1xyXG4gIHB1YmxpYyByZWFkb25seSBwYXNzaXZlRXZlbnRzOiBib29sZWFuIHwgbnVsbDtcclxuXHJcbiAgLy8gUG9pbnRlciBmb3IgYWNjZXNzaWJpbGl0eSwgb25seSBjcmVhdGVkIGxhemlseSBvbiBmaXJzdCBwZG9tIGV2ZW50LlxyXG4gIHB1YmxpYyBwZG9tUG9pbnRlcjogUERPTVBvaW50ZXIgfCBudWxsO1xyXG5cclxuICAvLyBQb2ludGVyIGZvciBtb3VzZSwgb25seSBjcmVhdGVkIGxhemlseSBvbiBmaXJzdCBtb3VzZSBldmVudCwgc28gbm8gbW91c2UgaXMgYWxsb2NhdGVkIG9uIHRhYmxldHMuXHJcbiAgcHVibGljIG1vdXNlOiBNb3VzZSB8IG51bGw7XHJcblxyXG4gIC8vIEFsbCBhY3RpdmUgcG9pbnRlcnMuXHJcbiAgcHVibGljIHBvaW50ZXJzOiBQb2ludGVyW107XHJcblxyXG4gIHB1YmxpYyBwb2ludGVyQWRkZWRFbWl0dGVyOiBURW1pdHRlcjxbIFBvaW50ZXIgXT47XHJcblxyXG4gIC8vIFdoZXRoZXIgd2UgYXJlIGN1cnJlbnRseSBmaXJpbmcgZXZlbnRzLiBXZSBuZWVkIHRvIHRyYWNrIHRoaXMgdG8gaGFuZGxlIHJlLWVudHJhbnQgY2FzZXNcclxuICAvLyBsaWtlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9iYWxsb29ucy1hbmQtc3RhdGljLWVsZWN0cmljaXR5L2lzc3Vlcy80MDYuXHJcbiAgcHVibGljIGN1cnJlbnRseUZpcmluZ0V2ZW50czogYm9vbGVhbjtcclxuXHJcbiAgcHVibGljIGN1cnJlbnRTY2VuZXJ5RXZlbnQ6IFNjZW5lcnlFdmVudCB8IG51bGwgPSBudWxsO1xyXG5cclxuICBwcml2YXRlIGJhdGNoZWRFdmVudHM6IEJhdGNoZWRET01FdmVudFtdO1xyXG5cclxuICAvLyBJbiBtaWxpc2Vjb25kcywgdGhlIERPTUV2ZW50IHRpbWVTdGFtcCB3aGVuIHdlIHJlY2VpdmUgYSBsb2dpY2FsIHVwIGV2ZW50LlxyXG4gIC8vIFdlIGNhbiBjb21wYXJlIHRoaXMgdG8gdGhlIHRpbWVTdGFtcCBvbiBhIGNsaWNrIHZlbnQgdG8gZmlsdGVyIG91dCB0aGUgY2xpY2sgZXZlbnRzXHJcbiAgLy8gd2hlbiBzb21lIHNjcmVlbiByZWFkZXJzIHNlbmQgYm90aCBkb3duL3VwIGV2ZW50cyBBTkQgY2xpY2sgZXZlbnRzIHRvIHRoZSB0YXJnZXRcclxuICAvLyBlbGVtZW50LCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzEwOTRcclxuICBwcml2YXRlIHVwVGltZVN0YW1wOiBudW1iZXI7XHJcblxyXG4gIC8vIEVtaXRzIHBvaW50ZXIgdmFsaWRhdGlvbiB0byB0aGUgaW5wdXQgc3RyZWFtIGZvciBwbGF5YmFja1xyXG4gIC8vIFRoaXMgaXMgYSBoaWdoIGZyZXF1ZW5jeSBldmVudCB0aGF0IGlzIG5lY2Vzc2FyeSBmb3IgcmVwcm9kdWNpYmxlIHBsYXliYWNrc1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgdmFsaWRhdGVQb2ludGVyc0FjdGlvbjogUGhldGlvQWN0aW9uO1xyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IG1vdXNlVXBBY3Rpb246IFBoZXRpb0FjdGlvbjxbIFZlY3RvcjIsIEV2ZW50Q29udGV4dDxNb3VzZUV2ZW50PiBdPjtcclxuICBwcml2YXRlIHJlYWRvbmx5IG1vdXNlRG93bkFjdGlvbjogUGhldGlvQWN0aW9uPFsgbnVtYmVyLCBWZWN0b3IyLCBFdmVudENvbnRleHQ8TW91c2VFdmVudD4gXT47XHJcbiAgcHJpdmF0ZSByZWFkb25seSBtb3VzZU1vdmVBY3Rpb246IFBoZXRpb0FjdGlvbjxbIFZlY3RvcjIsIEV2ZW50Q29udGV4dDxNb3VzZUV2ZW50PiBdPjtcclxuICBwcml2YXRlIHJlYWRvbmx5IG1vdXNlT3ZlckFjdGlvbjogUGhldGlvQWN0aW9uPFsgVmVjdG9yMiwgRXZlbnRDb250ZXh0PE1vdXNlRXZlbnQ+IF0+O1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgbW91c2VPdXRBY3Rpb246IFBoZXRpb0FjdGlvbjxbIFZlY3RvcjIsIEV2ZW50Q29udGV4dDxNb3VzZUV2ZW50PiBdPjtcclxuICBwcml2YXRlIHJlYWRvbmx5IHdoZWVsU2Nyb2xsQWN0aW9uOiBQaGV0aW9BY3Rpb248WyBFdmVudENvbnRleHQ8V2hlZWxFdmVudD4gXT47XHJcbiAgcHJpdmF0ZSByZWFkb25seSB0b3VjaFN0YXJ0QWN0aW9uOiBQaGV0aW9BY3Rpb248WyBudW1iZXIsIFZlY3RvcjIsIEV2ZW50Q29udGV4dDxUb3VjaEV2ZW50IHwgUG9pbnRlckV2ZW50PiBdPjtcclxuICBwcml2YXRlIHJlYWRvbmx5IHRvdWNoRW5kQWN0aW9uOiBQaGV0aW9BY3Rpb248WyBudW1iZXIsIFZlY3RvcjIsIEV2ZW50Q29udGV4dDxUb3VjaEV2ZW50IHwgUG9pbnRlckV2ZW50PiBdPjtcclxuICBwcml2YXRlIHJlYWRvbmx5IHRvdWNoTW92ZUFjdGlvbjogUGhldGlvQWN0aW9uPFsgbnVtYmVyLCBWZWN0b3IyLCBFdmVudENvbnRleHQ8VG91Y2hFdmVudCB8IFBvaW50ZXJFdmVudD4gXT47XHJcbiAgcHJpdmF0ZSByZWFkb25seSB0b3VjaENhbmNlbEFjdGlvbjogUGhldGlvQWN0aW9uPFsgbnVtYmVyLCBWZWN0b3IyLCBFdmVudENvbnRleHQ8VG91Y2hFdmVudCB8IFBvaW50ZXJFdmVudD4gXT47XHJcbiAgcHJpdmF0ZSByZWFkb25seSBwZW5TdGFydEFjdGlvbjogUGhldGlvQWN0aW9uPFsgbnVtYmVyLCBWZWN0b3IyLCBFdmVudENvbnRleHQ8UG9pbnRlckV2ZW50PiBdPjtcclxuICBwcml2YXRlIHJlYWRvbmx5IHBlbkVuZEFjdGlvbjogUGhldGlvQWN0aW9uPFsgbnVtYmVyLCBWZWN0b3IyLCBFdmVudENvbnRleHQ8UG9pbnRlckV2ZW50PiBdPjtcclxuICBwcml2YXRlIHJlYWRvbmx5IHBlbk1vdmVBY3Rpb246IFBoZXRpb0FjdGlvbjxbIG51bWJlciwgVmVjdG9yMiwgRXZlbnRDb250ZXh0PFBvaW50ZXJFdmVudD4gXT47XHJcbiAgcHJpdmF0ZSByZWFkb25seSBwZW5DYW5jZWxBY3Rpb246IFBoZXRpb0FjdGlvbjxbIG51bWJlciwgVmVjdG9yMiwgRXZlbnRDb250ZXh0PFBvaW50ZXJFdmVudD4gXT47XHJcbiAgcHJpdmF0ZSByZWFkb25seSBnb3RQb2ludGVyQ2FwdHVyZUFjdGlvbjogUGhldGlvQWN0aW9uPFsgbnVtYmVyLCBFdmVudENvbnRleHQgXT47XHJcbiAgcHJpdmF0ZSByZWFkb25seSBsb3N0UG9pbnRlckNhcHR1cmVBY3Rpb246IFBoZXRpb0FjdGlvbjxbIG51bWJlciwgRXZlbnRDb250ZXh0IF0+O1xyXG5cclxuICAvLyBJZiBhY2Nlc3NpYmxlXHJcbiAgcHJpdmF0ZSByZWFkb25seSBmb2N1c2luQWN0aW9uOiBQaGV0aW9BY3Rpb248WyBFdmVudENvbnRleHQ8Rm9jdXNFdmVudD4gXT47XHJcbiAgcHJpdmF0ZSByZWFkb25seSBmb2N1c291dEFjdGlvbjogUGhldGlvQWN0aW9uPFsgRXZlbnRDb250ZXh0PEZvY3VzRXZlbnQ+IF0+O1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgY2xpY2tBY3Rpb246IFBoZXRpb0FjdGlvbjxbIEV2ZW50Q29udGV4dDxNb3VzZUV2ZW50PiBdPjtcclxuICBwcml2YXRlIHJlYWRvbmx5IGlucHV0QWN0aW9uOiBQaGV0aW9BY3Rpb248WyBFdmVudENvbnRleHQ8RXZlbnQgfCBJbnB1dEV2ZW50PiBdPjtcclxuICBwcml2YXRlIHJlYWRvbmx5IGNoYW5nZUFjdGlvbjogUGhldGlvQWN0aW9uPFsgRXZlbnRDb250ZXh0IF0+O1xyXG4gIHByaXZhdGUgcmVhZG9ubHkga2V5ZG93bkFjdGlvbjogUGhldGlvQWN0aW9uPFsgRXZlbnRDb250ZXh0PEtleWJvYXJkRXZlbnQ+IF0+O1xyXG4gIHByaXZhdGUgcmVhZG9ubHkga2V5dXBBY3Rpb246IFBoZXRpb0FjdGlvbjxbIEV2ZW50Q29udGV4dDxLZXlib2FyZEV2ZW50PiBdPjtcclxuXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBJbnB1dElPID0gbmV3IElPVHlwZTxJbnB1dD4oICdJbnB1dElPJywge1xyXG4gICAgdmFsdWVUeXBlOiBJbnB1dCxcclxuICAgIGFwcGx5U3RhdGU6IF8ubm9vcCxcclxuICAgIHRvU3RhdGVPYmplY3Q6ICggaW5wdXQ6IElucHV0ICkgPT4ge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHBvaW50ZXJzOiBBcnJheUlPUG9pbnRlcklPLnRvU3RhdGVPYmplY3QoIGlucHV0LnBvaW50ZXJzIClcclxuICAgICAgfTtcclxuICAgIH0sXHJcbiAgICBzdGF0ZVNjaGVtYToge1xyXG4gICAgICBwb2ludGVyczogQXJyYXlJT1BvaW50ZXJJT1xyXG4gICAgfVxyXG4gIH0gKTtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIGRpc3BsYXlcclxuICAgKiBAcGFyYW0gYXR0YWNoVG9XaW5kb3cgLSBXaGV0aGVyIHRvIGFkZCBsaXN0ZW5lcnMgdG8gdGhlIHdpbmRvdyAoaW5zdGVhZCBvZiB0aGUgRGlzcGxheSdzIGRvbUVsZW1lbnQpLlxyXG4gICAqIEBwYXJhbSBiYXRjaERPTUV2ZW50cyAtIElmIHRydWUsIG1vc3QgZXZlbnQgdHlwZXMgd2lsbCBiZSBiYXRjaGVkIHVudGlsIG90aGVyd2lzZSB0cmlnZ2VyZWQuXHJcbiAgICogQHBhcmFtIGFzc3VtZUZ1bGxXaW5kb3cgLSBXZSBjYW4gb3B0aW1pemUgY2VydGFpbiB0aGluZ3MgbGlrZSBjb21wdXRpbmcgcG9pbnRzIGlmIHdlIGtub3cgdGhlIGRpc3BsYXlcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxscyB0aGUgZW50aXJlIHdpbmRvdy5cclxuICAgKiBAcGFyYW0gcGFzc2l2ZUV2ZW50cyAtIFNlZSBEaXNwbGF5J3MgZG9jdW1lbnRhdGlvbiAoY29udHJvbHMgdGhlIHByZXNlbmNlIG9mIHRoZSBwYXNzaXZlIGZsYWcgZm9yXHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudHMsIHdoaWNoIGhhcyBzb21lIGFkdmFuY2VkIGNvbnNpZGVyYXRpb25zKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBbcHJvdmlkZWRPcHRpb25zXVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggZGlzcGxheTogRGlzcGxheSwgYXR0YWNoVG9XaW5kb3c6IGJvb2xlYW4sIGJhdGNoRE9NRXZlbnRzOiBib29sZWFuLCBhc3N1bWVGdWxsV2luZG93OiBib29sZWFuLCBwYXNzaXZlRXZlbnRzOiBib29sZWFuIHwgbnVsbCwgcHJvdmlkZWRPcHRpb25zPzogSW5wdXRPcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8SW5wdXRPcHRpb25zLCBTZWxmT3B0aW9ucywgUGhldGlvT2JqZWN0T3B0aW9ucz4oKSgge1xyXG4gICAgICBwaGV0aW9UeXBlOiBJbnB1dC5JbnB1dElPLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnQ2VudHJhbCBwb2ludCBmb3IgdXNlciBpbnB1dCBldmVudHMsIHN1Y2ggYXMgbW91c2UsIHRvdWNoJ1xyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgc3VwZXIoIG9wdGlvbnMgKTtcclxuXHJcbiAgICB0aGlzLmRpc3BsYXkgPSBkaXNwbGF5O1xyXG4gICAgdGhpcy5yb290Tm9kZSA9IGRpc3BsYXkucm9vdE5vZGU7XHJcblxyXG4gICAgdGhpcy5hdHRhY2hUb1dpbmRvdyA9IGF0dGFjaFRvV2luZG93O1xyXG4gICAgdGhpcy5iYXRjaERPTUV2ZW50cyA9IGJhdGNoRE9NRXZlbnRzO1xyXG4gICAgdGhpcy5hc3N1bWVGdWxsV2luZG93ID0gYXNzdW1lRnVsbFdpbmRvdztcclxuICAgIHRoaXMucGFzc2l2ZUV2ZW50cyA9IHBhc3NpdmVFdmVudHM7XHJcbiAgICB0aGlzLmJhdGNoZWRFdmVudHMgPSBbXTtcclxuICAgIHRoaXMucGRvbVBvaW50ZXIgPSBudWxsO1xyXG4gICAgdGhpcy5tb3VzZSA9IG51bGw7XHJcbiAgICB0aGlzLnBvaW50ZXJzID0gW107XHJcbiAgICB0aGlzLnBvaW50ZXJBZGRlZEVtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXI8WyBQb2ludGVyIF0+KCk7XHJcbiAgICB0aGlzLmN1cnJlbnRseUZpcmluZ0V2ZW50cyA9IGZhbHNlO1xyXG4gICAgdGhpcy51cFRpbWVTdGFtcCA9IDA7XHJcblxyXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gICAgLy8gRGVjbGFyZSB0aGUgQWN0aW9ucyB0aGF0IHNlbmQgc2NlbmVyeSBpbnB1dCBldmVudHMgdG8gdGhlIFBoRVQtaU8gZGF0YSBzdHJlYW0uICBOb3RlIHRoZXkgdXNlIHRoZSBkZWZhdWx0IHZhbHVlXHJcbiAgICAvLyBvZiBwaGV0aW9SZWFkT25seSBmYWxzZSwgaW4gY2FzZSBhIGNsaWVudCB3YW50cyB0byBzeW50aGVzaXplIGV2ZW50cy5cclxuXHJcbiAgICB0aGlzLnZhbGlkYXRlUG9pbnRlcnNBY3Rpb24gPSBuZXcgUGhldGlvQWN0aW9uKCAoKSA9PiB7XHJcbiAgICAgIGxldCBpID0gdGhpcy5wb2ludGVycy5sZW5ndGg7XHJcbiAgICAgIHdoaWxlICggaS0tICkge1xyXG4gICAgICAgIGNvbnN0IHBvaW50ZXIgPSB0aGlzLnBvaW50ZXJzWyBpIF07XHJcbiAgICAgICAgaWYgKCBwb2ludGVyLnBvaW50ICYmIHBvaW50ZXIgIT09IHRoaXMucGRvbVBvaW50ZXIgKSB7XHJcbiAgICAgICAgICB0aGlzLmJyYW5jaENoYW5nZUV2ZW50czxFdmVudD4oIHBvaW50ZXIsIHBvaW50ZXIubGFzdEV2ZW50Q29udGV4dCB8fCBFdmVudENvbnRleHQuY3JlYXRlU3ludGhldGljKCksIGZhbHNlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgIHBoZXRpb1BsYXliYWNrOiB0cnVlLFxyXG4gICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtPy5jcmVhdGVUYW5kZW0oICd2YWxpZGF0ZVBvaW50ZXJzQWN0aW9uJyApLFxyXG4gICAgICBwaGV0aW9IaWdoRnJlcXVlbmN5OiB0cnVlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5tb3VzZVVwQWN0aW9uID0gbmV3IFBoZXRpb0FjdGlvbiggKCBwb2ludDogVmVjdG9yMiwgY29udGV4dDogRXZlbnRDb250ZXh0PE1vdXNlRXZlbnQ+ICkgPT4ge1xyXG4gICAgICBjb25zdCBtb3VzZSA9IHRoaXMuZW5zdXJlTW91c2UoIHBvaW50ICk7XHJcbiAgICAgIG1vdXNlLmlkID0gbnVsbDtcclxuICAgICAgdGhpcy51cEV2ZW50PE1vdXNlRXZlbnQ+KCBtb3VzZSwgY29udGV4dCwgcG9pbnQgKTtcclxuICAgIH0sIHtcclxuICAgICAgcGhldGlvUGxheWJhY2s6IHRydWUsXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0/LmNyZWF0ZVRhbmRlbSggJ21vdXNlVXBBY3Rpb24nICksXHJcbiAgICAgIHBhcmFtZXRlcnM6IFtcclxuICAgICAgICB7IG5hbWU6ICdwb2ludCcsIHBoZXRpb1R5cGU6IFZlY3RvcjIuVmVjdG9yMklPIH0sXHJcbiAgICAgICAgeyBuYW1lOiAnY29udGV4dCcsIHBoZXRpb1R5cGU6IEV2ZW50Q29udGV4dElPIH1cclxuICAgICAgXSxcclxuICAgICAgcGhldGlvRXZlbnRUeXBlOiBFdmVudFR5cGUuVVNFUixcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ0VtaXRzIHdoZW4gYSBtb3VzZSBidXR0b24gaXMgcmVsZWFzZWQuJ1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMubW91c2VEb3duQWN0aW9uID0gbmV3IFBoZXRpb0FjdGlvbiggKCBpZDogbnVtYmVyLCBwb2ludDogVmVjdG9yMiwgY29udGV4dDogRXZlbnRDb250ZXh0PE1vdXNlRXZlbnQ+ICkgPT4ge1xyXG4gICAgICBjb25zdCBtb3VzZSA9IHRoaXMuZW5zdXJlTW91c2UoIHBvaW50ICk7XHJcbiAgICAgIG1vdXNlLmlkID0gaWQ7XHJcbiAgICAgIHRoaXMuZG93bkV2ZW50PE1vdXNlRXZlbnQ+KCBtb3VzZSwgY29udGV4dCwgcG9pbnQgKTtcclxuICAgIH0sIHtcclxuICAgICAgcGhldGlvUGxheWJhY2s6IHRydWUsXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0/LmNyZWF0ZVRhbmRlbSggJ21vdXNlRG93bkFjdGlvbicgKSxcclxuICAgICAgcGFyYW1ldGVyczogW1xyXG4gICAgICAgIHsgbmFtZTogJ2lkJywgcGhldGlvVHlwZTogTnVsbGFibGVJTyggTnVtYmVySU8gKSB9LFxyXG4gICAgICAgIHsgbmFtZTogJ3BvaW50JywgcGhldGlvVHlwZTogVmVjdG9yMi5WZWN0b3IySU8gfSxcclxuICAgICAgICB7IG5hbWU6ICdjb250ZXh0JywgcGhldGlvVHlwZTogRXZlbnRDb250ZXh0SU8gfVxyXG4gICAgICBdLFxyXG4gICAgICBwaGV0aW9FdmVudFR5cGU6IEV2ZW50VHlwZS5VU0VSLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnRW1pdHMgd2hlbiBhIG1vdXNlIGJ1dHRvbiBpcyBwcmVzc2VkLidcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLm1vdXNlTW92ZUFjdGlvbiA9IG5ldyBQaGV0aW9BY3Rpb24oICggcG9pbnQ6IFZlY3RvcjIsIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxNb3VzZUV2ZW50PiApID0+IHtcclxuICAgICAgY29uc3QgbW91c2UgPSB0aGlzLmVuc3VyZU1vdXNlKCBwb2ludCApO1xyXG4gICAgICBtb3VzZS5tb3ZlKCBwb2ludCApO1xyXG4gICAgICB0aGlzLm1vdmVFdmVudDxNb3VzZUV2ZW50PiggbW91c2UsIGNvbnRleHQgKTtcclxuICAgIH0sIHtcclxuICAgICAgcGhldGlvUGxheWJhY2s6IHRydWUsXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0/LmNyZWF0ZVRhbmRlbSggJ21vdXNlTW92ZUFjdGlvbicgKSxcclxuICAgICAgcGFyYW1ldGVyczogW1xyXG4gICAgICAgIHsgbmFtZTogJ3BvaW50JywgcGhldGlvVHlwZTogVmVjdG9yMi5WZWN0b3IySU8gfSxcclxuICAgICAgICB7IG5hbWU6ICdjb250ZXh0JywgcGhldGlvVHlwZTogRXZlbnRDb250ZXh0SU8gfVxyXG4gICAgICBdLFxyXG4gICAgICBwaGV0aW9FdmVudFR5cGU6IEV2ZW50VHlwZS5VU0VSLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnRW1pdHMgd2hlbiB0aGUgbW91c2UgaXMgbW92ZWQuJyxcclxuICAgICAgcGhldGlvSGlnaEZyZXF1ZW5jeTogdHJ1ZVxyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMubW91c2VPdmVyQWN0aW9uID0gbmV3IFBoZXRpb0FjdGlvbiggKCBwb2ludDogVmVjdG9yMiwgY29udGV4dDogRXZlbnRDb250ZXh0PE1vdXNlRXZlbnQ+ICkgPT4ge1xyXG4gICAgICBjb25zdCBtb3VzZSA9IHRoaXMuZW5zdXJlTW91c2UoIHBvaW50ICk7XHJcbiAgICAgIG1vdXNlLm92ZXIoIHBvaW50ICk7XHJcbiAgICAgIC8vIFRPRE86IGhvdyB0byBoYW5kbGUgbW91c2Utb3ZlciAoYW5kIGxvZyBpdCkuLi4gYXJlIHdlIGNoYW5naW5nIHRoZSBwb2ludGVyLnBvaW50IHdpdGhvdXQgYSBicmFuY2ggY2hhbmdlPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgfSwge1xyXG4gICAgICBwaGV0aW9QbGF5YmFjazogdHJ1ZSxcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbT8uY3JlYXRlVGFuZGVtKCAnbW91c2VPdmVyQWN0aW9uJyApLFxyXG4gICAgICBwYXJhbWV0ZXJzOiBbXHJcbiAgICAgICAgeyBuYW1lOiAncG9pbnQnLCBwaGV0aW9UeXBlOiBWZWN0b3IyLlZlY3RvcjJJTyB9LFxyXG4gICAgICAgIHsgbmFtZTogJ2NvbnRleHQnLCBwaGV0aW9UeXBlOiBFdmVudENvbnRleHRJTyB9XHJcbiAgICAgIF0sXHJcbiAgICAgIHBoZXRpb0V2ZW50VHlwZTogRXZlbnRUeXBlLlVTRVIsXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdFbWl0cyB3aGVuIHRoZSBtb3VzZSBpcyBtb3ZlZCB3aGlsZSBvbiB0aGUgc2ltLidcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLm1vdXNlT3V0QWN0aW9uID0gbmV3IFBoZXRpb0FjdGlvbiggKCBwb2ludDogVmVjdG9yMiwgY29udGV4dDogRXZlbnRDb250ZXh0PE1vdXNlRXZlbnQ+ICkgPT4ge1xyXG4gICAgICBjb25zdCBtb3VzZSA9IHRoaXMuZW5zdXJlTW91c2UoIHBvaW50ICk7XHJcbiAgICAgIG1vdXNlLm91dCggcG9pbnQgKTtcclxuICAgICAgLy8gVE9ETzogaG93IHRvIGhhbmRsZSBtb3VzZS1vdXQgKGFuZCBsb2cgaXQpLi4uIGFyZSB3ZSBjaGFuZ2luZyB0aGUgcG9pbnRlci5wb2ludCB3aXRob3V0IGEgYnJhbmNoIGNoYW5nZT8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgIH0sIHtcclxuICAgICAgcGhldGlvUGxheWJhY2s6IHRydWUsXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0/LmNyZWF0ZVRhbmRlbSggJ21vdXNlT3V0QWN0aW9uJyApLFxyXG4gICAgICBwYXJhbWV0ZXJzOiBbXHJcbiAgICAgICAgeyBuYW1lOiAncG9pbnQnLCBwaGV0aW9UeXBlOiBWZWN0b3IyLlZlY3RvcjJJTyB9LFxyXG4gICAgICAgIHsgbmFtZTogJ2NvbnRleHQnLCBwaGV0aW9UeXBlOiBFdmVudENvbnRleHRJTyB9XHJcbiAgICAgIF0sXHJcbiAgICAgIHBoZXRpb0V2ZW50VHlwZTogRXZlbnRUeXBlLlVTRVIsXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdFbWl0cyB3aGVuIHRoZSBtb3VzZSBtb3ZlcyBvdXQgb2YgdGhlIGRpc3BsYXkuJ1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMud2hlZWxTY3JvbGxBY3Rpb24gPSBuZXcgUGhldGlvQWN0aW9uKCAoIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxXaGVlbEV2ZW50PiApID0+IHtcclxuICAgICAgY29uc3QgZXZlbnQgPSBjb250ZXh0LmRvbUV2ZW50O1xyXG5cclxuICAgICAgY29uc3QgbW91c2UgPSB0aGlzLmVuc3VyZU1vdXNlKCB0aGlzLnBvaW50RnJvbUV2ZW50KCBldmVudCApICk7XHJcbiAgICAgIG1vdXNlLndoZWVsKCBldmVudCApO1xyXG5cclxuICAgICAgLy8gZG9uJ3Qgc2VuZCBtb3VzZS13aGVlbCBldmVudHMgaWYgd2UgZG9uJ3QgeWV0IGhhdmUgYSBtb3VzZSBsb2NhdGlvbiFcclxuICAgICAgLy8gVE9ETzogQ2FuIHdlIHNldCB0aGUgbW91c2UgbG9jYXRpb24gYmFzZWQgb24gdGhlIHdoZWVsIGV2ZW50PyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICBpZiAoIG1vdXNlLnBvaW50ICkge1xyXG4gICAgICAgIGNvbnN0IHRyYWlsID0gdGhpcy5yb290Tm9kZS50cmFpbFVuZGVyUG9pbnRlciggbW91c2UgKSB8fCBuZXcgVHJhaWwoIHRoaXMucm9vdE5vZGUgKTtcclxuICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQ8V2hlZWxFdmVudD4oIHRyYWlsLCAnd2hlZWwnLCBtb3VzZSwgY29udGV4dCwgdHJ1ZSApO1xyXG4gICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgIHBoZXRpb1BsYXliYWNrOiB0cnVlLFxyXG4gICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtPy5jcmVhdGVUYW5kZW0oICd3aGVlbFNjcm9sbEFjdGlvbicgKSxcclxuICAgICAgcGFyYW1ldGVyczogW1xyXG4gICAgICAgIHsgbmFtZTogJ2NvbnRleHQnLCBwaGV0aW9UeXBlOiBFdmVudENvbnRleHRJTyB9XHJcbiAgICAgIF0sXHJcbiAgICAgIHBoZXRpb0V2ZW50VHlwZTogRXZlbnRUeXBlLlVTRVIsXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdFbWl0cyB3aGVuIHRoZSBtb3VzZSB3aGVlbCBzY3JvbGxzLicsXHJcbiAgICAgIHBoZXRpb0hpZ2hGcmVxdWVuY3k6IHRydWVcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLnRvdWNoU3RhcnRBY3Rpb24gPSBuZXcgUGhldGlvQWN0aW9uKCAoIGlkOiBudW1iZXIsIHBvaW50OiBWZWN0b3IyLCBjb250ZXh0OiBFdmVudENvbnRleHQ8VG91Y2hFdmVudCB8IFBvaW50ZXJFdmVudD4gKSA9PiB7XHJcbiAgICAgIGNvbnN0IHRvdWNoID0gbmV3IFRvdWNoKCBpZCwgcG9pbnQsIGNvbnRleHQuZG9tRXZlbnQgKTtcclxuICAgICAgdGhpcy5hZGRQb2ludGVyKCB0b3VjaCApO1xyXG4gICAgICB0aGlzLmRvd25FdmVudDxUb3VjaEV2ZW50IHwgUG9pbnRlckV2ZW50PiggdG91Y2gsIGNvbnRleHQsIHBvaW50ICk7XHJcbiAgICB9LCB7XHJcbiAgICAgIHBoZXRpb1BsYXliYWNrOiB0cnVlLFxyXG4gICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtPy5jcmVhdGVUYW5kZW0oICd0b3VjaFN0YXJ0QWN0aW9uJyApLFxyXG4gICAgICBwYXJhbWV0ZXJzOiBbXHJcbiAgICAgICAgeyBuYW1lOiAnaWQnLCBwaGV0aW9UeXBlOiBOdW1iZXJJTyB9LFxyXG4gICAgICAgIHsgbmFtZTogJ3BvaW50JywgcGhldGlvVHlwZTogVmVjdG9yMi5WZWN0b3IySU8gfSxcclxuICAgICAgICB7IG5hbWU6ICdjb250ZXh0JywgcGhldGlvVHlwZTogRXZlbnRDb250ZXh0SU8gfVxyXG4gICAgICBdLFxyXG4gICAgICBwaGV0aW9FdmVudFR5cGU6IEV2ZW50VHlwZS5VU0VSLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnRW1pdHMgd2hlbiBhIHRvdWNoIGJlZ2lucy4nXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy50b3VjaEVuZEFjdGlvbiA9IG5ldyBQaGV0aW9BY3Rpb24oICggaWQ6IG51bWJlciwgcG9pbnQ6IFZlY3RvcjIsIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxUb3VjaEV2ZW50IHwgUG9pbnRlckV2ZW50PiApID0+IHtcclxuICAgICAgY29uc3QgdG91Y2ggPSB0aGlzLmZpbmRQb2ludGVyQnlJZCggaWQgKSBhcyBUb3VjaCB8IG51bGw7XHJcbiAgICAgIGlmICggdG91Y2ggKSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdG91Y2ggaW5zdGFuY2VvZiBUb3VjaCApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNpbXBsZS10eXBlLWNoZWNraW5nLWFzc2VydGlvbnMsIGJhZC1zaW0tdGV4dFxyXG4gICAgICAgIHRoaXMudXBFdmVudDxUb3VjaEV2ZW50IHwgUG9pbnRlckV2ZW50PiggdG91Y2gsIGNvbnRleHQsIHBvaW50ICk7XHJcbiAgICAgICAgdGhpcy5yZW1vdmVQb2ludGVyKCB0b3VjaCApO1xyXG4gICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgIHBoZXRpb1BsYXliYWNrOiB0cnVlLFxyXG4gICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtPy5jcmVhdGVUYW5kZW0oICd0b3VjaEVuZEFjdGlvbicgKSxcclxuICAgICAgcGFyYW1ldGVyczogW1xyXG4gICAgICAgIHsgbmFtZTogJ2lkJywgcGhldGlvVHlwZTogTnVtYmVySU8gfSxcclxuICAgICAgICB7IG5hbWU6ICdwb2ludCcsIHBoZXRpb1R5cGU6IFZlY3RvcjIuVmVjdG9yMklPIH0sXHJcbiAgICAgICAgeyBuYW1lOiAnY29udGV4dCcsIHBoZXRpb1R5cGU6IEV2ZW50Q29udGV4dElPIH1cclxuICAgICAgXSxcclxuICAgICAgcGhldGlvRXZlbnRUeXBlOiBFdmVudFR5cGUuVVNFUixcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ0VtaXRzIHdoZW4gYSB0b3VjaCBlbmRzLidcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLnRvdWNoTW92ZUFjdGlvbiA9IG5ldyBQaGV0aW9BY3Rpb24oICggaWQ6IG51bWJlciwgcG9pbnQ6IFZlY3RvcjIsIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxUb3VjaEV2ZW50IHwgUG9pbnRlckV2ZW50PiApID0+IHtcclxuICAgICAgY29uc3QgdG91Y2ggPSB0aGlzLmZpbmRQb2ludGVyQnlJZCggaWQgKSBhcyBUb3VjaCB8IG51bGw7XHJcbiAgICAgIGlmICggdG91Y2ggKSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdG91Y2ggaW5zdGFuY2VvZiBUb3VjaCApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNpbXBsZS10eXBlLWNoZWNraW5nLWFzc2VydGlvbnMsIGJhZC1zaW0tdGV4dFxyXG4gICAgICAgIHRvdWNoLm1vdmUoIHBvaW50ICk7XHJcbiAgICAgICAgdGhpcy5tb3ZlRXZlbnQ8VG91Y2hFdmVudCB8IFBvaW50ZXJFdmVudD4oIHRvdWNoLCBjb250ZXh0ICk7XHJcbiAgICAgIH1cclxuICAgIH0sIHtcclxuICAgICAgcGhldGlvUGxheWJhY2s6IHRydWUsXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0/LmNyZWF0ZVRhbmRlbSggJ3RvdWNoTW92ZUFjdGlvbicgKSxcclxuICAgICAgcGFyYW1ldGVyczogW1xyXG4gICAgICAgIHsgbmFtZTogJ2lkJywgcGhldGlvVHlwZTogTnVtYmVySU8gfSxcclxuICAgICAgICB7IG5hbWU6ICdwb2ludCcsIHBoZXRpb1R5cGU6IFZlY3RvcjIuVmVjdG9yMklPIH0sXHJcbiAgICAgICAgeyBuYW1lOiAnY29udGV4dCcsIHBoZXRpb1R5cGU6IEV2ZW50Q29udGV4dElPIH1cclxuICAgICAgXSxcclxuICAgICAgcGhldGlvRXZlbnRUeXBlOiBFdmVudFR5cGUuVVNFUixcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ0VtaXRzIHdoZW4gYSB0b3VjaCBtb3Zlcy4nLFxyXG4gICAgICBwaGV0aW9IaWdoRnJlcXVlbmN5OiB0cnVlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy50b3VjaENhbmNlbEFjdGlvbiA9IG5ldyBQaGV0aW9BY3Rpb24oICggaWQ6IG51bWJlciwgcG9pbnQ6IFZlY3RvcjIsIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxUb3VjaEV2ZW50IHwgUG9pbnRlckV2ZW50PiApID0+IHtcclxuICAgICAgY29uc3QgdG91Y2ggPSB0aGlzLmZpbmRQb2ludGVyQnlJZCggaWQgKSBhcyBUb3VjaCB8IG51bGw7XHJcbiAgICAgIGlmICggdG91Y2ggKSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdG91Y2ggaW5zdGFuY2VvZiBUb3VjaCApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNpbXBsZS10eXBlLWNoZWNraW5nLWFzc2VydGlvbnMsIGJhZC1zaW0tdGV4dFxyXG4gICAgICAgIHRoaXMuY2FuY2VsRXZlbnQ8VG91Y2hFdmVudCB8IFBvaW50ZXJFdmVudD4oIHRvdWNoLCBjb250ZXh0LCBwb2ludCApO1xyXG4gICAgICAgIHRoaXMucmVtb3ZlUG9pbnRlciggdG91Y2ggKTtcclxuICAgICAgfVxyXG4gICAgfSwge1xyXG4gICAgICBwaGV0aW9QbGF5YmFjazogdHJ1ZSxcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbT8uY3JlYXRlVGFuZGVtKCAndG91Y2hDYW5jZWxBY3Rpb24nICksXHJcbiAgICAgIHBhcmFtZXRlcnM6IFtcclxuICAgICAgICB7IG5hbWU6ICdpZCcsIHBoZXRpb1R5cGU6IE51bWJlcklPIH0sXHJcbiAgICAgICAgeyBuYW1lOiAncG9pbnQnLCBwaGV0aW9UeXBlOiBWZWN0b3IyLlZlY3RvcjJJTyB9LFxyXG4gICAgICAgIHsgbmFtZTogJ2NvbnRleHQnLCBwaGV0aW9UeXBlOiBFdmVudENvbnRleHRJTyB9XHJcbiAgICAgIF0sXHJcbiAgICAgIHBoZXRpb0V2ZW50VHlwZTogRXZlbnRUeXBlLlVTRVIsXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdFbWl0cyB3aGVuIGEgdG91Y2ggaXMgY2FuY2VsZWQuJ1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMucGVuU3RhcnRBY3Rpb24gPSBuZXcgUGhldGlvQWN0aW9uKCAoIGlkOiBudW1iZXIsIHBvaW50OiBWZWN0b3IyLCBjb250ZXh0OiBFdmVudENvbnRleHQ8UG9pbnRlckV2ZW50PiApID0+IHtcclxuICAgICAgY29uc3QgcGVuID0gbmV3IFBlbiggaWQsIHBvaW50LCBjb250ZXh0LmRvbUV2ZW50ICk7XHJcbiAgICAgIHRoaXMuYWRkUG9pbnRlciggcGVuICk7XHJcbiAgICAgIHRoaXMuZG93bkV2ZW50PFBvaW50ZXJFdmVudD4oIHBlbiwgY29udGV4dCwgcG9pbnQgKTtcclxuICAgIH0sIHtcclxuICAgICAgcGhldGlvUGxheWJhY2s6IHRydWUsXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0/LmNyZWF0ZVRhbmRlbSggJ3BlblN0YXJ0QWN0aW9uJyApLFxyXG4gICAgICBwYXJhbWV0ZXJzOiBbXHJcbiAgICAgICAgeyBuYW1lOiAnaWQnLCBwaGV0aW9UeXBlOiBOdW1iZXJJTyB9LFxyXG4gICAgICAgIHsgbmFtZTogJ3BvaW50JywgcGhldGlvVHlwZTogVmVjdG9yMi5WZWN0b3IySU8gfSxcclxuICAgICAgICB7IG5hbWU6ICdjb250ZXh0JywgcGhldGlvVHlwZTogRXZlbnRDb250ZXh0SU8gfVxyXG4gICAgICBdLFxyXG4gICAgICBwaGV0aW9FdmVudFR5cGU6IEV2ZW50VHlwZS5VU0VSLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnRW1pdHMgd2hlbiBhIHBlbiB0b3VjaGVzIHRoZSBzY3JlZW4uJ1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMucGVuRW5kQWN0aW9uID0gbmV3IFBoZXRpb0FjdGlvbiggKCBpZDogbnVtYmVyLCBwb2ludDogVmVjdG9yMiwgY29udGV4dDogRXZlbnRDb250ZXh0PFBvaW50ZXJFdmVudD4gKSA9PiB7XHJcbiAgICAgIGNvbnN0IHBlbiA9IHRoaXMuZmluZFBvaW50ZXJCeUlkKCBpZCApIGFzIFBlbiB8IG51bGw7XHJcbiAgICAgIGlmICggcGVuICkge1xyXG4gICAgICAgIHRoaXMudXBFdmVudDxQb2ludGVyRXZlbnQ+KCBwZW4sIGNvbnRleHQsIHBvaW50ICk7XHJcbiAgICAgICAgdGhpcy5yZW1vdmVQb2ludGVyKCBwZW4gKTtcclxuICAgICAgfVxyXG4gICAgfSwge1xyXG4gICAgICBwaGV0aW9QbGF5YmFjazogdHJ1ZSxcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbT8uY3JlYXRlVGFuZGVtKCAncGVuRW5kQWN0aW9uJyApLFxyXG4gICAgICBwYXJhbWV0ZXJzOiBbXHJcbiAgICAgICAgeyBuYW1lOiAnaWQnLCBwaGV0aW9UeXBlOiBOdW1iZXJJTyB9LFxyXG4gICAgICAgIHsgbmFtZTogJ3BvaW50JywgcGhldGlvVHlwZTogVmVjdG9yMi5WZWN0b3IySU8gfSxcclxuICAgICAgICB7IG5hbWU6ICdjb250ZXh0JywgcGhldGlvVHlwZTogRXZlbnRDb250ZXh0SU8gfVxyXG4gICAgICBdLFxyXG4gICAgICBwaGV0aW9FdmVudFR5cGU6IEV2ZW50VHlwZS5VU0VSLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnRW1pdHMgd2hlbiBhIHBlbiBpcyBsaWZ0ZWQuJ1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMucGVuTW92ZUFjdGlvbiA9IG5ldyBQaGV0aW9BY3Rpb24oICggaWQ6IG51bWJlciwgcG9pbnQ6IFZlY3RvcjIsIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxQb2ludGVyRXZlbnQ+ICkgPT4ge1xyXG4gICAgICBjb25zdCBwZW4gPSB0aGlzLmZpbmRQb2ludGVyQnlJZCggaWQgKSBhcyBQZW4gfCBudWxsO1xyXG4gICAgICBpZiAoIHBlbiApIHtcclxuICAgICAgICBwZW4ubW92ZSggcG9pbnQgKTtcclxuICAgICAgICB0aGlzLm1vdmVFdmVudDxQb2ludGVyRXZlbnQ+KCBwZW4sIGNvbnRleHQgKTtcclxuICAgICAgfVxyXG4gICAgfSwge1xyXG4gICAgICBwaGV0aW9QbGF5YmFjazogdHJ1ZSxcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbT8uY3JlYXRlVGFuZGVtKCAncGVuTW92ZUFjdGlvbicgKSxcclxuICAgICAgcGFyYW1ldGVyczogW1xyXG4gICAgICAgIHsgbmFtZTogJ2lkJywgcGhldGlvVHlwZTogTnVtYmVySU8gfSxcclxuICAgICAgICB7IG5hbWU6ICdwb2ludCcsIHBoZXRpb1R5cGU6IFZlY3RvcjIuVmVjdG9yMklPIH0sXHJcbiAgICAgICAgeyBuYW1lOiAnY29udGV4dCcsIHBoZXRpb1R5cGU6IEV2ZW50Q29udGV4dElPIH1cclxuICAgICAgXSxcclxuICAgICAgcGhldGlvRXZlbnRUeXBlOiBFdmVudFR5cGUuVVNFUixcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ0VtaXRzIHdoZW4gYSBwZW4gaXMgbW92ZWQuJyxcclxuICAgICAgcGhldGlvSGlnaEZyZXF1ZW5jeTogdHJ1ZVxyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMucGVuQ2FuY2VsQWN0aW9uID0gbmV3IFBoZXRpb0FjdGlvbiggKCBpZDogbnVtYmVyLCBwb2ludDogVmVjdG9yMiwgY29udGV4dDogRXZlbnRDb250ZXh0PFBvaW50ZXJFdmVudD4gKSA9PiB7XHJcbiAgICAgIGNvbnN0IHBlbiA9IHRoaXMuZmluZFBvaW50ZXJCeUlkKCBpZCApIGFzIFBlbiB8IG51bGw7XHJcbiAgICAgIGlmICggcGVuICkge1xyXG4gICAgICAgIHRoaXMuY2FuY2VsRXZlbnQ8UG9pbnRlckV2ZW50PiggcGVuLCBjb250ZXh0LCBwb2ludCApO1xyXG4gICAgICAgIHRoaXMucmVtb3ZlUG9pbnRlciggcGVuICk7XHJcbiAgICAgIH1cclxuICAgIH0sIHtcclxuICAgICAgcGhldGlvUGxheWJhY2s6IHRydWUsXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0/LmNyZWF0ZVRhbmRlbSggJ3BlbkNhbmNlbEFjdGlvbicgKSxcclxuICAgICAgcGFyYW1ldGVyczogW1xyXG4gICAgICAgIHsgbmFtZTogJ2lkJywgcGhldGlvVHlwZTogTnVtYmVySU8gfSxcclxuICAgICAgICB7IG5hbWU6ICdwb2ludCcsIHBoZXRpb1R5cGU6IFZlY3RvcjIuVmVjdG9yMklPIH0sXHJcbiAgICAgICAgeyBuYW1lOiAnY29udGV4dCcsIHBoZXRpb1R5cGU6IEV2ZW50Q29udGV4dElPIH1cclxuICAgICAgXSxcclxuICAgICAgcGhldGlvRXZlbnRUeXBlOiBFdmVudFR5cGUuVVNFUixcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ0VtaXRzIHdoZW4gYSBwZW4gaXMgY2FuY2VsZWQuJ1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuZ290UG9pbnRlckNhcHR1cmVBY3Rpb24gPSBuZXcgUGhldGlvQWN0aW9uKCAoIGlkOiBudW1iZXIsIGNvbnRleHQ6IEV2ZW50Q29udGV4dCApID0+IHtcclxuICAgICAgY29uc3QgcG9pbnRlciA9IHRoaXMuZmluZFBvaW50ZXJCeUlkKCBpZCApO1xyXG5cclxuICAgICAgaWYgKCBwb2ludGVyICkge1xyXG4gICAgICAgIHBvaW50ZXIub25Hb3RQb2ludGVyQ2FwdHVyZSgpO1xyXG4gICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgIHBoZXRpb1BsYXliYWNrOiB0cnVlLFxyXG4gICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtPy5jcmVhdGVUYW5kZW0oICdnb3RQb2ludGVyQ2FwdHVyZUFjdGlvbicgKSxcclxuICAgICAgcGFyYW1ldGVyczogW1xyXG4gICAgICAgIHsgbmFtZTogJ2lkJywgcGhldGlvVHlwZTogTnVtYmVySU8gfSxcclxuICAgICAgICB7IG5hbWU6ICdjb250ZXh0JywgcGhldGlvVHlwZTogRXZlbnRDb250ZXh0SU8gfVxyXG4gICAgICBdLFxyXG4gICAgICBwaGV0aW9FdmVudFR5cGU6IEV2ZW50VHlwZS5VU0VSLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnRW1pdHMgd2hlbiBhIHBvaW50ZXIgaXMgY2FwdHVyZWQgKG5vcm1hbGx5IGF0IHRoZSBzdGFydCBvZiBhbiBpbnRlcmFjdGlvbiknLFxyXG4gICAgICBwaGV0aW9IaWdoRnJlcXVlbmN5OiB0cnVlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5sb3N0UG9pbnRlckNhcHR1cmVBY3Rpb24gPSBuZXcgUGhldGlvQWN0aW9uKCAoIGlkOiBudW1iZXIsIGNvbnRleHQ6IEV2ZW50Q29udGV4dCApID0+IHtcclxuICAgICAgY29uc3QgcG9pbnRlciA9IHRoaXMuZmluZFBvaW50ZXJCeUlkKCBpZCApO1xyXG5cclxuICAgICAgaWYgKCBwb2ludGVyICkge1xyXG4gICAgICAgIHBvaW50ZXIub25Mb3N0UG9pbnRlckNhcHR1cmUoKTtcclxuICAgICAgfVxyXG4gICAgfSwge1xyXG4gICAgICBwaGV0aW9QbGF5YmFjazogdHJ1ZSxcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbT8uY3JlYXRlVGFuZGVtKCAnbG9zdFBvaW50ZXJDYXB0dXJlQWN0aW9uJyApLFxyXG4gICAgICBwYXJhbWV0ZXJzOiBbXHJcbiAgICAgICAgeyBuYW1lOiAnaWQnLCBwaGV0aW9UeXBlOiBOdW1iZXJJTyB9LFxyXG4gICAgICAgIHsgbmFtZTogJ2NvbnRleHQnLCBwaGV0aW9UeXBlOiBFdmVudENvbnRleHRJTyB9XHJcbiAgICAgIF0sXHJcbiAgICAgIHBoZXRpb0V2ZW50VHlwZTogRXZlbnRUeXBlLlVTRVIsXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdFbWl0cyB3aGVuIGEgcG9pbnRlciBsb3NlcyBpdHMgY2FwdHVyZSAobm9ybWFsbHkgYXQgdGhlIGVuZCBvZiBhbiBpbnRlcmFjdGlvbiknLFxyXG4gICAgICBwaGV0aW9IaWdoRnJlcXVlbmN5OiB0cnVlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5mb2N1c2luQWN0aW9uID0gbmV3IFBoZXRpb0FjdGlvbiggKCBjb250ZXh0OiBFdmVudENvbnRleHQ8Rm9jdXNFdmVudD4gKSA9PiB7XHJcbiAgICAgIGNvbnN0IHRyYWlsID0gdGhpcy5nZXRQRE9NRXZlbnRUcmFpbCggY29udGV4dC5kb21FdmVudCwgJ2ZvY3VzaW4nICk7XHJcbiAgICAgIGlmICggIXRyYWlsICkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cuSW5wdXQoIGBmb2N1c2luKCR7SW5wdXQuZGVidWdUZXh0KCBudWxsLCBjb250ZXh0LmRvbUV2ZW50ICl9KTtgICk7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICAgIHRoaXMuZGlzcGF0Y2hQRE9NRXZlbnQ8Rm9jdXNFdmVudD4oIHRyYWlsLCAnZm9jdXMnLCBjb250ZXh0LCBmYWxzZSApO1xyXG4gICAgICB0aGlzLmRpc3BhdGNoUERPTUV2ZW50PEZvY3VzRXZlbnQ+KCB0cmFpbCwgJ2ZvY3VzaW4nLCBjb250ZXh0LCB0cnVlICk7XHJcblxyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICAgIH0sIHtcclxuICAgICAgcGhldGlvUGxheWJhY2s6IHRydWUsXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0/LmNyZWF0ZVRhbmRlbSggJ2ZvY3VzaW5BY3Rpb24nICksXHJcbiAgICAgIHBhcmFtZXRlcnM6IFtcclxuICAgICAgICB7IG5hbWU6ICdjb250ZXh0JywgcGhldGlvVHlwZTogRXZlbnRDb250ZXh0SU8gfVxyXG4gICAgICBdLFxyXG4gICAgICBwaGV0aW9FdmVudFR5cGU6IEV2ZW50VHlwZS5VU0VSLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnRW1pdHMgd2hlbiB0aGUgUERPTSByb290IGdldHMgdGhlIGZvY3VzaW4gRE9NIGV2ZW50LidcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLmZvY3Vzb3V0QWN0aW9uID0gbmV3IFBoZXRpb0FjdGlvbiggKCBjb250ZXh0OiBFdmVudENvbnRleHQ8Rm9jdXNFdmVudD4gKSA9PiB7XHJcbiAgICAgIGNvbnN0IHRyYWlsID0gdGhpcy5nZXRQRE9NRXZlbnRUcmFpbCggY29udGV4dC5kb21FdmVudCwgJ2ZvY3Vzb3V0JyApO1xyXG4gICAgICBpZiAoICF0cmFpbCApIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLklucHV0KCBgZm9jdXNPdXQoJHtJbnB1dC5kZWJ1Z1RleHQoIG51bGwsIGNvbnRleHQuZG9tRXZlbnQgKX0pO2AgKTtcclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgICAgdGhpcy5kaXNwYXRjaFBET01FdmVudDxGb2N1c0V2ZW50PiggdHJhaWwsICdibHVyJywgY29udGV4dCwgZmFsc2UgKTtcclxuICAgICAgdGhpcy5kaXNwYXRjaFBET01FdmVudDxGb2N1c0V2ZW50PiggdHJhaWwsICdmb2N1c291dCcsIGNvbnRleHQsIHRydWUgKTtcclxuXHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gICAgfSwge1xyXG4gICAgICBwaGV0aW9QbGF5YmFjazogdHJ1ZSxcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbT8uY3JlYXRlVGFuZGVtKCAnZm9jdXNvdXRBY3Rpb24nICksXHJcbiAgICAgIHBhcmFtZXRlcnM6IFtcclxuICAgICAgICB7IG5hbWU6ICdjb250ZXh0JywgcGhldGlvVHlwZTogRXZlbnRDb250ZXh0SU8gfVxyXG4gICAgICBdLFxyXG4gICAgICBwaGV0aW9FdmVudFR5cGU6IEV2ZW50VHlwZS5VU0VSLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnRW1pdHMgd2hlbiB0aGUgUERPTSByb290IGdldHMgdGhlIGZvY3Vzb3V0IERPTSBldmVudC4nXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0VsZW1lbnQvY2xpY2tfZXZlbnQgbm90ZXMgdGhhdCB0aGUgY2xpY2sgYWN0aW9uIHNob3VsZCByZXN1bHRcclxuICAgIC8vIGluIGEgTW91c2VFdmVudFxyXG4gICAgdGhpcy5jbGlja0FjdGlvbiA9IG5ldyBQaGV0aW9BY3Rpb24oICggY29udGV4dDogRXZlbnRDb250ZXh0PE1vdXNlRXZlbnQ+ICkgPT4ge1xyXG4gICAgICBjb25zdCB0cmFpbCA9IHRoaXMuZ2V0UERPTUV2ZW50VHJhaWwoIGNvbnRleHQuZG9tRXZlbnQsICdjbGljaycgKTtcclxuICAgICAgaWYgKCAhdHJhaWwgKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5JbnB1dCggYGNsaWNrKCR7SW5wdXQuZGVidWdUZXh0KCBudWxsLCBjb250ZXh0LmRvbUV2ZW50ICl9KTtgICk7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICAgIHRoaXMuZGlzcGF0Y2hQRE9NRXZlbnQ8TW91c2VFdmVudD4oIHRyYWlsLCAnY2xpY2snLCBjb250ZXh0LCB0cnVlICk7XHJcblxyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICAgIH0sIHtcclxuICAgICAgcGhldGlvUGxheWJhY2s6IHRydWUsXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0/LmNyZWF0ZVRhbmRlbSggJ2NsaWNrQWN0aW9uJyApLFxyXG4gICAgICBwYXJhbWV0ZXJzOiBbXHJcbiAgICAgICAgeyBuYW1lOiAnY29udGV4dCcsIHBoZXRpb1R5cGU6IEV2ZW50Q29udGV4dElPIH1cclxuICAgICAgXSxcclxuICAgICAgcGhldGlvRXZlbnRUeXBlOiBFdmVudFR5cGUuVVNFUixcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ0VtaXRzIHdoZW4gdGhlIFBET00gcm9vdCBnZXRzIHRoZSBjbGljayBET00gZXZlbnQuJ1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuaW5wdXRBY3Rpb24gPSBuZXcgUGhldGlvQWN0aW9uKCAoIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxFdmVudCB8IElucHV0RXZlbnQ+ICkgPT4ge1xyXG4gICAgICBjb25zdCB0cmFpbCA9IHRoaXMuZ2V0UERPTUV2ZW50VHJhaWwoIGNvbnRleHQuZG9tRXZlbnQsICdpbnB1dCcgKTtcclxuICAgICAgaWYgKCAhdHJhaWwgKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5JbnB1dCggYGlucHV0KCR7SW5wdXQuZGVidWdUZXh0KCBudWxsLCBjb250ZXh0LmRvbUV2ZW50ICl9KTtgICk7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICAgIHRoaXMuZGlzcGF0Y2hQRE9NRXZlbnQ8RXZlbnQgfCBJbnB1dEV2ZW50PiggdHJhaWwsICdpbnB1dCcsIGNvbnRleHQsIHRydWUgKTtcclxuXHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gICAgfSwge1xyXG4gICAgICBwaGV0aW9QbGF5YmFjazogdHJ1ZSxcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbT8uY3JlYXRlVGFuZGVtKCAnaW5wdXRBY3Rpb24nICksXHJcbiAgICAgIHBhcmFtZXRlcnM6IFtcclxuICAgICAgICB7IG5hbWU6ICdjb250ZXh0JywgcGhldGlvVHlwZTogRXZlbnRDb250ZXh0SU8gfVxyXG4gICAgICBdLFxyXG4gICAgICBwaGV0aW9FdmVudFR5cGU6IEV2ZW50VHlwZS5VU0VSLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnRW1pdHMgd2hlbiB0aGUgUERPTSByb290IGdldHMgdGhlIGlucHV0IERPTSBldmVudC4nXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5jaGFuZ2VBY3Rpb24gPSBuZXcgUGhldGlvQWN0aW9uKCAoIGNvbnRleHQ6IEV2ZW50Q29udGV4dCApID0+IHtcclxuICAgICAgY29uc3QgdHJhaWwgPSB0aGlzLmdldFBET01FdmVudFRyYWlsKCBjb250ZXh0LmRvbUV2ZW50LCAnY2hhbmdlJyApO1xyXG4gICAgICBpZiAoICF0cmFpbCApIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLklucHV0KCBgY2hhbmdlKCR7SW5wdXQuZGVidWdUZXh0KCBudWxsLCBjb250ZXh0LmRvbUV2ZW50ICl9KTtgICk7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICAgIHRoaXMuZGlzcGF0Y2hQRE9NRXZlbnQ8RXZlbnQ+KCB0cmFpbCwgJ2NoYW5nZScsIGNvbnRleHQsIHRydWUgKTtcclxuXHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gICAgfSwge1xyXG4gICAgICBwaGV0aW9QbGF5YmFjazogdHJ1ZSxcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbT8uY3JlYXRlVGFuZGVtKCAnY2hhbmdlQWN0aW9uJyApLFxyXG4gICAgICBwYXJhbWV0ZXJzOiBbXHJcbiAgICAgICAgeyBuYW1lOiAnY29udGV4dCcsIHBoZXRpb1R5cGU6IEV2ZW50Q29udGV4dElPIH1cclxuICAgICAgXSxcclxuICAgICAgcGhldGlvRXZlbnRUeXBlOiBFdmVudFR5cGUuVVNFUixcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ0VtaXRzIHdoZW4gdGhlIFBET00gcm9vdCBnZXRzIHRoZSBjaGFuZ2UgRE9NIGV2ZW50LidcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLmtleWRvd25BY3Rpb24gPSBuZXcgUGhldGlvQWN0aW9uKCAoIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxLZXlib2FyZEV2ZW50PiApID0+IHtcclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cuSW5wdXQoIGBrZXlkb3duKCR7SW5wdXQuZGVidWdUZXh0KCBudWxsLCBjb250ZXh0LmRvbUV2ZW50ICl9KTtgICk7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICAgIGNvbnN0IHRyYWlsID0gdGhpcy5nZXRQRE9NRXZlbnRUcmFpbCggY29udGV4dC5kb21FdmVudCwgJ2tleWRvd24nICk7XHJcbiAgICAgIHRyYWlsICYmIHRoaXMuZGlzcGF0Y2hQRE9NRXZlbnQ8S2V5Ym9hcmRFdmVudD4oIHRyYWlsLCAna2V5ZG93bicsIGNvbnRleHQsIHRydWUgKTtcclxuXHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gICAgfSwge1xyXG4gICAgICBwaGV0aW9QbGF5YmFjazogdHJ1ZSxcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbT8uY3JlYXRlVGFuZGVtKCAna2V5ZG93bkFjdGlvbicgKSxcclxuICAgICAgcGFyYW1ldGVyczogW1xyXG4gICAgICAgIHsgbmFtZTogJ2NvbnRleHQnLCBwaGV0aW9UeXBlOiBFdmVudENvbnRleHRJTyB9XHJcbiAgICAgIF0sXHJcbiAgICAgIHBoZXRpb0V2ZW50VHlwZTogRXZlbnRUeXBlLlVTRVIsXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdFbWl0cyB3aGVuIHRoZSBQRE9NIHJvb3QgZ2V0cyB0aGUga2V5ZG93biBET00gZXZlbnQuJ1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMua2V5dXBBY3Rpb24gPSBuZXcgUGhldGlvQWN0aW9uKCAoIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxLZXlib2FyZEV2ZW50PiApID0+IHtcclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cuSW5wdXQoIGBrZXl1cCgke0lucHV0LmRlYnVnVGV4dCggbnVsbCwgY29udGV4dC5kb21FdmVudCApfSk7YCApO1xyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgICBjb25zdCB0cmFpbCA9IHRoaXMuZ2V0UERPTUV2ZW50VHJhaWwoIGNvbnRleHQuZG9tRXZlbnQsICdrZXlkb3duJyApO1xyXG4gICAgICB0cmFpbCAmJiB0aGlzLmRpc3BhdGNoUERPTUV2ZW50PEtleWJvYXJkRXZlbnQ+KCB0cmFpbCwgJ2tleXVwJywgY29udGV4dCwgdHJ1ZSApO1xyXG5cclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgICB9LCB7XHJcbiAgICAgIHBoZXRpb1BsYXliYWNrOiB0cnVlLFxyXG4gICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtPy5jcmVhdGVUYW5kZW0oICdrZXl1cEFjdGlvbicgKSxcclxuICAgICAgcGFyYW1ldGVyczogW1xyXG4gICAgICAgIHsgbmFtZTogJ2NvbnRleHQnLCBwaGV0aW9UeXBlOiBFdmVudENvbnRleHRJTyB9XHJcbiAgICAgIF0sXHJcbiAgICAgIHBoZXRpb0V2ZW50VHlwZTogRXZlbnRUeXBlLlVTRVIsXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdFbWl0cyB3aGVuIHRoZSBQRE9NIHJvb3QgZ2V0cyB0aGUga2V5dXAgRE9NIGV2ZW50LidcclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEludGVycnVwdHMgYW55IGlucHV0IGFjdGlvbnMgdGhhdCBhcmUgY3VycmVudGx5IHRha2luZyBwbGFjZSAoc2hvdWxkIHN0b3AgZHJhZ3MsIGV0Yy4pXHJcbiAgICpcclxuICAgKiBJZiBleGNsdWRlUG9pbnRlciBpcyBwcm92aWRlZCwgaXQgd2lsbCBOT1QgYmUgaW50ZXJydXB0ZWQgYWxvbmcgd2l0aCB0aGUgb3RoZXJzXHJcbiAgICovXHJcbiAgcHVibGljIGludGVycnVwdFBvaW50ZXJzKCBleGNsdWRlUG9pbnRlcjogUG9pbnRlciB8IG51bGwgPSBudWxsICk6IHZvaWQge1xyXG4gICAgXy5lYWNoKCB0aGlzLnBvaW50ZXJzLCBwb2ludGVyID0+IHtcclxuICAgICAgaWYgKCBwb2ludGVyICE9PSBleGNsdWRlUG9pbnRlciApIHtcclxuICAgICAgICBwb2ludGVyLmludGVycnVwdEFsbCgpO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgdG8gYmF0Y2ggYSByYXcgRE9NIGV2ZW50ICh3aGljaCBtYXkgYmUgaW1tZWRpYXRlbHkgZmlyZWQsIGRlcGVuZGluZyBvbiB0aGUgc2V0dGluZ3MpLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKlxyXG4gICAqIEBwYXJhbSBjb250ZXh0XHJcbiAgICogQHBhcmFtIGJhdGNoVHlwZSAtIFNlZSBCYXRjaGVkRE9NRXZlbnQncyBcImVudW1lcmF0aW9uXCJcclxuICAgKiBAcGFyYW0gY2FsbGJhY2sgLSBQYXJhbWV0ZXIgdHlwZXMgZGVmaW5lZCBieSB0aGUgYmF0Y2hUeXBlLiBTZWUgQmF0Y2hlZERPTUV2ZW50IGZvciBkZXRhaWxzXHJcbiAgICogQHBhcmFtIHRyaWdnZXJJbW1lZGlhdGUgLSBDZXJ0YWluIGV2ZW50cyBjYW4gZm9yY2UgaW1tZWRpYXRlIGFjdGlvbiwgc2luY2UgYnJvd3NlcnMgbGlrZSBDaHJvbWVcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbmx5IGFsbG93IGNlcnRhaW4gb3BlcmF0aW9ucyBpbiB0aGUgY2FsbGJhY2sgZm9yIGEgdXNlciBnZXN0dXJlIChlLmcuIGxpa2VcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhIG1vdXNldXAgdG8gb3BlbiBhIHdpbmRvdykuXHJcbiAgICovXHJcbiAgcHVibGljIGJhdGNoRXZlbnQoIGNvbnRleHQ6IEV2ZW50Q29udGV4dCwgYmF0Y2hUeXBlOiBCYXRjaGVkRE9NRXZlbnRUeXBlLCBjYWxsYmFjazogQmF0Y2hlZERPTUV2ZW50Q2FsbGJhY2ssIHRyaWdnZXJJbW1lZGlhdGU6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRFdmVudCAmJiBzY2VuZXJ5TG9nLklucHV0RXZlbnQoICdJbnB1dC5iYXRjaEV2ZW50JyApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0RXZlbnQgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgLy8gSWYgb3VyIGRpc3BsYXkgaXMgbm90IGludGVyYWN0aXZlLCBkbyBub3QgcmVzcG9uZCB0byBhbnkgZXZlbnRzIChidXQgc3RpbGwgcHJldmVudCBkZWZhdWx0KVxyXG4gICAgaWYgKCB0aGlzLmRpc3BsYXkuaW50ZXJhY3RpdmUgKSB7XHJcbiAgICAgIHRoaXMuYmF0Y2hlZEV2ZW50cy5wdXNoKCBCYXRjaGVkRE9NRXZlbnQucG9vbC5jcmVhdGUoIGNvbnRleHQsIGJhdGNoVHlwZSwgY2FsbGJhY2sgKSApO1xyXG4gICAgICBpZiAoIHRyaWdnZXJJbW1lZGlhdGUgfHwgIXRoaXMuYmF0Y2hET01FdmVudHMgKSB7XHJcbiAgICAgICAgdGhpcy5maXJlQmF0Y2hlZEV2ZW50cygpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIE5PVEU6IElmIHdlIGV2ZXIgd2FudCB0byBEaXNwbGF5LnVwZGF0ZURpc3BsYXkoKSBvbiBldmVudHMsIGRvIHNvIGhlcmVcclxuICAgIH1cclxuXHJcbiAgICAvLyBBbHdheXMgcHJldmVudERlZmF1bHQgb24gdG91Y2ggZXZlbnRzLCBzaW5jZSB3ZSBkb24ndCB3YW50IG1vdXNlIGV2ZW50cyB0cmlnZ2VyZWQgYWZ0ZXJ3YXJkcy4gU2VlXHJcbiAgICAvLyBodHRwOi8vd3d3Lmh0bWw1cm9ja3MuY29tL2VuL21vYmlsZS90b3VjaGFuZG1vdXNlLyBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cclxuICAgIC8vIEFkZGl0aW9uYWxseSwgSUUgaGFkIHNvbWUgaXNzdWVzIHdpdGggc2tpcHBpbmcgcHJldmVudCBkZWZhdWx0LCBzZWVcclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy80NjQgZm9yIG1vdXNlIGhhbmRsaW5nLlxyXG4gICAgLy8gV0UgV0lMTCBOT1QgcHJldmVudERlZmF1bHQoKSBvbiBrZXlib2FyZCBvciBhbHRlcm5hdGl2ZSBpbnB1dCBldmVudHMgaGVyZVxyXG4gICAgaWYgKFxyXG4gICAgICAhKCB0aGlzLnBhc3NpdmVFdmVudHMgPT09IHRydWUgKSAmJlxyXG4gICAgICAoIGNhbGxiYWNrICE9PSB0aGlzLm1vdXNlRG93biB8fCBwbGF0Zm9ybS5lZGdlICkgJiZcclxuICAgICAgYmF0Y2hUeXBlICE9PSBCYXRjaGVkRE9NRXZlbnRUeXBlLkFMVF9UWVBFICYmXHJcbiAgICAgICFjb250ZXh0LmFsbG93c0RPTUlucHV0KClcclxuICAgICkge1xyXG4gICAgICAvLyBXZSBjYW5ub3QgcHJldmVudCBhIHBhc3NpdmUgZXZlbnQsIHNvIGRvbid0IHRyeVxyXG4gICAgICBjb250ZXh0LmRvbUV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0RXZlbnQgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZpcmVzIGFsbCBvZiBvdXIgZXZlbnRzIHRoYXQgd2VyZSBiYXRjaGVkIGludG8gdGhlIGJhdGNoZWRFdmVudHMgYXJyYXkuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBmaXJlQmF0Y2hlZEV2ZW50cygpOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dEV2ZW50ICYmIHRoaXMuY3VycmVudGx5RmlyaW5nRXZlbnRzICYmIHNjZW5lcnlMb2cuSW5wdXRFdmVudChcclxuICAgICAgJ1JFRU5UUkFOQ0UgREVURUNURUQnICk7XHJcbiAgICAvLyBEb24ndCByZS1lbnRyYW50bHkgZW50ZXIgb3VyIGxvb3AsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYmFsbG9vbnMtYW5kLXN0YXRpYy1lbGVjdHJpY2l0eS9pc3N1ZXMvNDA2XHJcbiAgICBpZiAoICF0aGlzLmN1cnJlbnRseUZpcmluZ0V2ZW50cyAmJiB0aGlzLmJhdGNoZWRFdmVudHMubGVuZ3RoICkge1xyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRFdmVudCAmJiBzY2VuZXJ5TG9nLklucHV0RXZlbnQoIGBJbnB1dC5maXJlQmF0Y2hlZEV2ZW50cyBsZW5ndGg6JHt0aGlzLmJhdGNoZWRFdmVudHMubGVuZ3RofWAgKTtcclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0RXZlbnQgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgICB0aGlzLmN1cnJlbnRseUZpcmluZ0V2ZW50cyA9IHRydWU7XHJcblxyXG4gICAgICAvLyBuZWVkcyB0byBiZSBkb25lIGluIG9yZGVyXHJcbiAgICAgIGNvbnN0IGJhdGNoZWRFdmVudHMgPSB0aGlzLmJhdGNoZWRFdmVudHM7XHJcbiAgICAgIC8vIElNUE9SVEFOVDogV2UgbmVlZCB0byBjaGVjayB0aGUgbGVuZ3RoIG9mIHRoZSBhcnJheSBhdCBldmVyeSBpdGVyYXRpb24sIGFzIGl0IGNhbiBjaGFuZ2UgZHVlIHRvIHJlLWVudHJhbnRcclxuICAgICAgLy8gZXZlbnQgaGFuZGxpbmcsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYmFsbG9vbnMtYW5kLXN0YXRpYy1lbGVjdHJpY2l0eS9pc3N1ZXMvNDA2LlxyXG4gICAgICAvLyBFdmVudHMgbWF5IGJlIGFwcGVuZGVkIHRvIHRoaXMgKHN5bmNocm9ub3VzbHkpIGFzIHBhcnQgb2YgZmlyaW5nIGluaXRpYWwgZXZlbnRzLCBzbyB3ZSB3YW50IHRvIEZVTExZIHJ1biBhbGxcclxuICAgICAgLy8gZXZlbnRzIGJlZm9yZSBjbGVhcmluZyBvdXIgYXJyYXkuXHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGJhdGNoZWRFdmVudHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgY29uc3QgYmF0Y2hlZEV2ZW50ID0gYmF0Y2hlZEV2ZW50c1sgaSBdO1xyXG4gICAgICAgIGJhdGNoZWRFdmVudC5ydW4oIHRoaXMgKTtcclxuICAgICAgICBiYXRjaGVkRXZlbnQuZGlzcG9zZSgpO1xyXG4gICAgICB9XHJcbiAgICAgIGNsZWFuQXJyYXkoIGJhdGNoZWRFdmVudHMgKTtcclxuXHJcbiAgICAgIHRoaXMuY3VycmVudGx5RmlyaW5nRXZlbnRzID0gZmFsc2U7XHJcblxyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRFdmVudCAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xlYXJzIGFueSBiYXRjaGVkIGV2ZW50cyB0aGF0IHdlIGRvbid0IHdhbnQgdG8gcHJvY2Vzcy4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICpcclxuICAgKiBOT1RFOiBJdCBpcyBISUdITFkgcmVjb21tZW5kZWQgdG8gaW50ZXJydXB0IHBvaW50ZXJzIGFuZCByZW1vdmUgbm9uLU1vdXNlIHBvaW50ZXJzIGJlZm9yZSBkb2luZyB0aGlzLCBhc1xyXG4gICAqIG90aGVyd2lzZSBpdCBjYW4gY2F1c2UgaW5jb3JyZWN0IHN0YXRlIGluIGNlcnRhaW4gdHlwZXMgb2YgbGlzdGVuZXJzIChlLmcuIG9uZXMgdGhhdCBjb3VudCBob3cgbWFueSBwb2ludGVyc1xyXG4gICAqIGFyZSBvdmVyIHRoZW0pLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjbGVhckJhdGNoZWRFdmVudHMoKTogdm9pZCB7XHJcbiAgICB0aGlzLmJhdGNoZWRFdmVudHMubGVuZ3RoID0gMDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrcyBhbGwgcG9pbnRlcnMgdG8gc2VlIHdoZXRoZXIgdGhleSBhcmUgc3RpbGwgXCJvdmVyXCIgdGhlIHNhbWUgbm9kZXMgKHRyYWlsKS4gSWYgbm90LCBpdCB3aWxsIGZpcmUgdGhlIHVzdWFsXHJcbiAgICogZW50ZXIvZXhpdCBldmVudHMuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyB2YWxpZGF0ZVBvaW50ZXJzKCk6IHZvaWQge1xyXG4gICAgdGhpcy52YWxpZGF0ZVBvaW50ZXJzQWN0aW9uLmV4ZWN1dGUoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgYWxsIG5vbi1Nb3VzZSBwb2ludGVycyBmcm9tIGludGVybmFsIHRyYWNraW5nLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgcmVtb3ZlVGVtcG9yYXJ5UG9pbnRlcnMoKTogdm9pZCB7XHJcbiAgICBmb3IgKCBsZXQgaSA9IHRoaXMucG9pbnRlcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0gKSB7XHJcbiAgICAgIGNvbnN0IHBvaW50ZXIgPSB0aGlzLnBvaW50ZXJzWyBpIF07XHJcbiAgICAgIGlmICggISggcG9pbnRlciBpbnN0YW5jZW9mIE1vdXNlICkgKSB7XHJcbiAgICAgICAgdGhpcy5wb2ludGVycy5zcGxpY2UoIGksIDEgKTtcclxuXHJcbiAgICAgICAgLy8gU2VuZCBleGl0IGV2ZW50cy4gQXMgd2UgY2FuJ3QgZ2V0IGEgRE9NIGV2ZW50LCB3ZSdsbCBzZW5kIGEgZmFrZSBvYmplY3QgaW5zdGVhZC5cclxuICAgICAgICBjb25zdCBleGl0VHJhaWwgPSBwb2ludGVyLnRyYWlsIHx8IG5ldyBUcmFpbCggdGhpcy5yb290Tm9kZSApO1xyXG4gICAgICAgIHRoaXMuZXhpdEV2ZW50cyggcG9pbnRlciwgRXZlbnRDb250ZXh0LmNyZWF0ZVN5bnRoZXRpYygpLCBleGl0VHJhaWwsIDAsIHRydWUgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSG9va3MgdXAgRE9NIGxpc3RlbmVycyB0byB3aGF0ZXZlciB0eXBlIG9mIG9iamVjdCB3ZSBhcmUgZ29pbmcgdG8gbGlzdGVuIHRvLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgY29ubmVjdExpc3RlbmVycygpOiB2b2lkIHtcclxuICAgIEJyb3dzZXJFdmVudHMuYWRkRGlzcGxheSggdGhpcy5kaXNwbGF5LCB0aGlzLmF0dGFjaFRvV2luZG93LCB0aGlzLnBhc3NpdmVFdmVudHMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgRE9NIGxpc3RlbmVycyBmcm9tIHdoYXRldmVyIHR5cGUgb2Ygb2JqZWN0IHdlIHdlcmUgbGlzdGVuaW5nIHRvLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgZGlzY29ubmVjdExpc3RlbmVycygpOiB2b2lkIHtcclxuICAgIEJyb3dzZXJFdmVudHMucmVtb3ZlRGlzcGxheSggdGhpcy5kaXNwbGF5LCB0aGlzLmF0dGFjaFRvV2luZG93LCB0aGlzLnBhc3NpdmVFdmVudHMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEV4dHJhY3QgYSB7VmVjdG9yMn0gZ2xvYmFsIGNvb3JkaW5hdGUgcG9pbnQgZnJvbSBhbiBhcmJpdHJhcnkgRE9NIGV2ZW50LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgcG9pbnRGcm9tRXZlbnQoIGRvbUV2ZW50OiBNb3VzZUV2ZW50IHwgV2luZG93VG91Y2ggKTogVmVjdG9yMiB7XHJcbiAgICBjb25zdCBwb3NpdGlvbiA9IFZlY3RvcjIucG9vbC5jcmVhdGUoIGRvbUV2ZW50LmNsaWVudFgsIGRvbUV2ZW50LmNsaWVudFkgKTtcclxuICAgIGlmICggIXRoaXMuYXNzdW1lRnVsbFdpbmRvdyApIHtcclxuICAgICAgY29uc3QgZG9tQm91bmRzID0gdGhpcy5kaXNwbGF5LmRvbUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblxyXG4gICAgICAvLyBUT0RPOiBjb25zaWRlciB0b3RhbGx5IGlnbm9yaW5nIGFueSB3aXRoIHplcm8gd2lkdGgvaGVpZ2h0LCBhcyB3ZSBhcmVuJ3QgYXR0YWNoZWQgdG8gdGhlIGRpc3BsYXk/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAgIC8vIEZvciBub3csIGRvbid0IG9mZnNldC5cclxuICAgICAgaWYgKCBkb21Cb3VuZHMud2lkdGggPiAwICYmIGRvbUJvdW5kcy5oZWlnaHQgPiAwICkge1xyXG4gICAgICAgIHBvc2l0aW9uLnN1YnRyYWN0WFkoIGRvbUJvdW5kcy5sZWZ0LCBkb21Cb3VuZHMudG9wICk7XHJcblxyXG4gICAgICAgIC8vIERldGVjdCBhIHNjYWxpbmcgb2YgdGhlIGRpc3BsYXkgaGVyZSAodGhlIGNsaWVudCBib3VuZGluZyByZWN0IGhhdmluZyBkaWZmZXJlbnQgZGltZW5zaW9ucyBmcm9tIG91clxyXG4gICAgICAgIC8vIGRpc3BsYXkpLCBhbmQgYXR0ZW1wdCB0byBjb21wZW5zYXRlLlxyXG4gICAgICAgIC8vIE5PVEU6IFdlIGNhbid0IGhhbmRsZSByb3RhdGlvbiBoZXJlLlxyXG4gICAgICAgIGlmICggZG9tQm91bmRzLndpZHRoICE9PSB0aGlzLmRpc3BsYXkud2lkdGggfHwgZG9tQm91bmRzLmhlaWdodCAhPT0gdGhpcy5kaXNwbGF5LmhlaWdodCApIHtcclxuICAgICAgICAgIC8vIFRPRE86IEhhdmUgY29kZSB2ZXJpZnkgdGhlIGNvcnJlY3RuZXNzIGhlcmUsIGFuZCB0aGF0IGl0J3Mgbm90IHRyaWdnZXJpbmcgYWxsIHRoZSB0aW1lIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAgICAgICBwb3NpdGlvbi54ICo9IHRoaXMuZGlzcGxheS53aWR0aCAvIGRvbUJvdW5kcy53aWR0aDtcclxuICAgICAgICAgIHBvc2l0aW9uLnkgKj0gdGhpcy5kaXNwbGF5LmhlaWdodCAvIGRvbUJvdW5kcy5oZWlnaHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcG9zaXRpb247XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGEgcG9pbnRlciB0byBvdXIgbGlzdC5cclxuICAgKi9cclxuICBwcml2YXRlIGFkZFBvaW50ZXIoIHBvaW50ZXI6IFBvaW50ZXIgKTogdm9pZCB7XHJcbiAgICB0aGlzLnBvaW50ZXJzLnB1c2goIHBvaW50ZXIgKTtcclxuXHJcbiAgICB0aGlzLnBvaW50ZXJBZGRlZEVtaXR0ZXIuZW1pdCggcG9pbnRlciApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyBhIHBvaW50ZXIgZnJvbSBvdXIgbGlzdC4gSWYgd2UgZ2V0IGZ1dHVyZSBldmVudHMgZm9yIGl0IChiYXNlZCBvbiB0aGUgSUQpIGl0IHdpbGwgYmUgaWdub3JlZC5cclxuICAgKi9cclxuICBwcml2YXRlIHJlbW92ZVBvaW50ZXIoIHBvaW50ZXI6IFBvaW50ZXIgKTogdm9pZCB7XHJcbiAgICAvLyBzYW5pdHkgY2hlY2sgdmVyc2lvbiwgd2lsbCByZW1vdmUgYWxsIGluc3RhbmNlc1xyXG4gICAgZm9yICggbGV0IGkgPSB0aGlzLnBvaW50ZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tICkge1xyXG4gICAgICBpZiAoIHRoaXMucG9pbnRlcnNbIGkgXSA9PT0gcG9pbnRlciApIHtcclxuICAgICAgICB0aGlzLnBvaW50ZXJzLnNwbGljZSggaSwgMSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcG9pbnRlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHaXZlbiBhIHBvaW50ZXIncyBJRCAoZ2l2ZW4gYnkgdGhlIHBvaW50ZXIvdG91Y2ggc3BlY2lmaWNhdGlvbnMgdG8gYmUgdW5pcXVlIHRvIGEgc3BlY2lmaWMgcG9pbnRlci90b3VjaCksXHJcbiAgICogcmV0dXJucyB0aGUgZ2l2ZW4gcG9pbnRlciAoaWYgd2UgaGF2ZSBvbmUpLlxyXG4gICAqXHJcbiAgICogTk9URTogVGhlcmUgYXJlIHNvbWUgY2FzZXMgd2hlcmUgd2UgbWF5IGhhdmUgcHJlbWF0dXJlbHkgXCJyZW1vdmVkXCIgYSBwb2ludGVyLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZmluZFBvaW50ZXJCeUlkKCBpZDogbnVtYmVyICk6IE1vdXNlIHwgVG91Y2ggfCBQZW4gfCBudWxsIHtcclxuICAgIGxldCBpID0gdGhpcy5wb2ludGVycy5sZW5ndGg7XHJcbiAgICB3aGlsZSAoIGktLSApIHtcclxuICAgICAgY29uc3QgcG9pbnRlciA9IHRoaXMucG9pbnRlcnNbIGkgXSBhcyBNb3VzZSB8IFRvdWNoIHwgUGVuO1xyXG4gICAgICBpZiAoIHBvaW50ZXIuaWQgPT09IGlkICkge1xyXG4gICAgICAgIHJldHVybiBwb2ludGVyO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZ2V0UERPTUV2ZW50VHJhaWwoIGRvbUV2ZW50OiBUYXJnZXRTdWJzdGl0dWRlQXVnbWVudGVkRXZlbnQsIGV2ZW50TmFtZTogc3RyaW5nICk6IFRyYWlsIHwgbnVsbCB7XHJcbiAgICBpZiAoICF0aGlzLmRpc3BsYXkuaW50ZXJhY3RpdmUgKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRyYWlsID0gdGhpcy5nZXRUcmFpbEZyb21QRE9NRXZlbnQoIGRvbUV2ZW50ICk7XHJcblxyXG4gICAgLy8gT25seSBkaXNwYXRjaCB0aGUgZXZlbnQgaWYgdGhlIGNsaWNrIGRpZCBub3QgaGFwcGVuIHJhcGlkbHkgYWZ0ZXIgYW4gdXAgZXZlbnQuIEl0IGlzXHJcbiAgICAvLyBsaWtlbHkgdGhhdCB0aGUgc2NyZWVuIHJlYWRlciBkaXNwYXRjaGVkIGJvdGggcG9pbnRlciBBTkQgY2xpY2sgZXZlbnRzIGluIHRoaXMgY2FzZSwgYW5kXHJcbiAgICAvLyB3ZSBvbmx5IHdhbnQgdG8gcmVzcG9uZCB0byBvbmUgb3IgdGhlIG90aGVyLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzEwOTQuXHJcbiAgICAvLyBUaGlzIGlzIG91dHNpZGUgb2YgdGhlIGNsaWNrQWN0aW9uIGV4ZWN1dGlvbiBzbyB0aGF0IGJsb2NrZWQgY2xpY2tzIGFyZSBub3QgcGFydCBvZiB0aGUgUGhFVC1pTyBkYXRhXHJcbiAgICAvLyBzdHJlYW0uXHJcbiAgICBjb25zdCBub3RCbG9ja2luZ1N1YnNlcXVlbnRDbGlja3NPY2N1cnJpbmdUb29RdWlja2x5ID0gdHJhaWwgJiYgISggZXZlbnROYW1lID09PSAnY2xpY2snICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5zb21lKCB0cmFpbC5ub2Rlcywgbm9kZSA9PiBub2RlLnBvc2l0aW9uSW5QRE9NICkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb21FdmVudC50aW1lU3RhbXAgLSB0aGlzLnVwVGltZVN0YW1wIDw9IFBET01fQ0xJQ0tfREVMQVkgKTtcclxuXHJcbiAgICByZXR1cm4gbm90QmxvY2tpbmdTdWJzZXF1ZW50Q2xpY2tzT2NjdXJyaW5nVG9vUXVpY2tseSA/IHRyYWlsIDogbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSBNb3VzZSBvYmplY3Qgb24gdGhlIGZpcnN0IG1vdXNlIGV2ZW50ICh0aGlzIG1heSBuZXZlciBoYXBwZW4gb24gdG91Y2ggZGV2aWNlcykuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBpbml0TW91c2UoIHBvaW50OiBWZWN0b3IyICk6IE1vdXNlIHtcclxuICAgIGNvbnN0IG1vdXNlID0gbmV3IE1vdXNlKCBwb2ludCApO1xyXG4gICAgdGhpcy5tb3VzZSA9IG1vdXNlO1xyXG4gICAgdGhpcy5hZGRQb2ludGVyKCBtb3VzZSApO1xyXG4gICAgcmV0dXJuIG1vdXNlO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBlbnN1cmVNb3VzZSggcG9pbnQ6IFZlY3RvcjIgKTogTW91c2Uge1xyXG4gICAgY29uc3QgbW91c2UgPSB0aGlzLm1vdXNlO1xyXG4gICAgaWYgKCBtb3VzZSApIHtcclxuICAgICAgcmV0dXJuIG1vdXNlO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmluaXRNb3VzZSggcG9pbnQgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSBhY2Nlc3NpYmxlIHBvaW50ZXIgb2JqZWN0IG9uIHRoZSBmaXJzdCBwZG9tIGV2ZW50LlxyXG4gICAqL1xyXG4gIHByaXZhdGUgaW5pdFBET01Qb2ludGVyKCk6IFBET01Qb2ludGVyIHtcclxuICAgIGNvbnN0IHBkb21Qb2ludGVyID0gbmV3IFBET01Qb2ludGVyKCB0aGlzLmRpc3BsYXkgKTtcclxuICAgIHRoaXMucGRvbVBvaW50ZXIgPSBwZG9tUG9pbnRlcjtcclxuXHJcbiAgICB0aGlzLmFkZFBvaW50ZXIoIHBkb21Qb2ludGVyICk7XHJcblxyXG4gICAgcmV0dXJuIHBkb21Qb2ludGVyO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBlbnN1cmVQRE9NUG9pbnRlcigpOiBQRE9NUG9pbnRlciB7XHJcbiAgICBjb25zdCBwZG9tUG9pbnRlciA9IHRoaXMucGRvbVBvaW50ZXI7XHJcbiAgICBpZiAoIHBkb21Qb2ludGVyICkge1xyXG4gICAgICByZXR1cm4gcGRvbVBvaW50ZXI7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIHRoaXMuaW5pdFBET01Qb2ludGVyKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTdGVwcyB0byBkaXNwYXRjaCBhIHBkb20tcmVsYXRlZCBldmVudC4gQmVmb3JlIGRpc3BhdGNoLCB0aGUgUERPTVBvaW50ZXIgaXMgaW5pdGlhbGl6ZWQgaWYgaXRcclxuICAgKiBoYXNuJ3QgYmVlbiBjcmVhdGVkIHlldCBhbmQgYSB1c2VyR2VzdHVyZUVtaXR0ZXIgZW1pdHMgdG8gaW5kaWNhdGUgdGhhdCBhIHVzZXIgaGFzIGJlZ3VuIGFuIGludGVyYWN0aW9uLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZGlzcGF0Y2hQRE9NRXZlbnQ8RE9NRXZlbnQgZXh0ZW5kcyBFdmVudD4oIHRyYWlsOiBUcmFpbCwgZXZlbnRUeXBlOiBTdXBwb3J0ZWRFdmVudFR5cGVzLCBjb250ZXh0OiBFdmVudENvbnRleHQ8RE9NRXZlbnQ+LCBidWJibGVzOiBib29sZWFuICk6IHZvaWQge1xyXG5cclxuICAgIHRoaXMuZW5zdXJlUERPTVBvaW50ZXIoKS51cGRhdGVUcmFpbCggdHJhaWwgKTtcclxuXHJcbiAgICAvLyBleGNsdWRlIGZvY3VzIGFuZCBibHVyIGV2ZW50cyBiZWNhdXNlIHRoZXkgY2FuIGhhcHBlbiB3aXRoIHNjcmlwdGluZyB3aXRob3V0IHVzZXIgaW5wdXRcclxuICAgIGlmICggUERPTVV0aWxzLlVTRVJfR0VTVFVSRV9FVkVOVFMuaW5jbHVkZXMoIGV2ZW50VHlwZSApICkge1xyXG4gICAgICBEaXNwbGF5LnVzZXJHZXN0dXJlRW1pdHRlci5lbWl0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZG9tRXZlbnQgPSBjb250ZXh0LmRvbUV2ZW50O1xyXG5cclxuICAgIC8vIFRoaXMgd29ya2Fyb3VuZCBob3BlZnVsbHkgd29uJ3QgYmUgaGVyZSBmb3JldmVyLCBzZWUgUGFyYWxsZWxET00uc2V0RXhjbHVkZUxhYmVsU2libGluZ0Zyb21JbnB1dCgpIGFuZCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYTExeS1yZXNlYXJjaC9pc3N1ZXMvMTU2XHJcbiAgICBpZiAoICEoIGRvbUV2ZW50LnRhcmdldCAmJiAoIGRvbUV2ZW50LnRhcmdldCBhcyBFbGVtZW50ICkuaGFzQXR0cmlidXRlKCBQRE9NVXRpbHMuREFUQV9FWENMVURFX0ZST01fSU5QVVQgKSApICkge1xyXG5cclxuICAgICAgLy8gSWYgdGhlIHRyYWlsIGlzIG5vdCBwaWNrYWJsZSwgZG9uJ3QgZGlzcGF0Y2ggUERPTSBldmVudHMgdG8gdGhvc2UgdGFyZ2V0cyAtIGJ1dCB3ZSBzdGlsbFxyXG4gICAgICAvLyBkaXNwYXRjaCB3aXRoIGFuIGVtcHR5IHRyYWlsIHRvIGNhbGwgbGlzdGVuZXJzIG9uIHRoZSBEaXNwbGF5IGFuZCBQb2ludGVyLlxyXG4gICAgICBjb25zdCBjYW5GaXJlTGlzdGVuZXJzID0gdHJhaWwuaXNQaWNrYWJsZSgpIHx8IFBET01fVU5QSUNLQUJMRV9FVkVOVFMuaW5jbHVkZXMoIGV2ZW50VHlwZSApO1xyXG5cclxuICAgICAgaWYgKCAhY2FuRmlyZUxpc3RlbmVycyApIHtcclxuICAgICAgICB0cmFpbCA9IG5ldyBUcmFpbCggW10gKTtcclxuICAgICAgfVxyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLnBkb21Qb2ludGVyICk7XHJcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudDxET01FdmVudD4oIHRyYWlsLCBldmVudFR5cGUsIHRoaXMucGRvbVBvaW50ZXIhLCBjb250ZXh0LCBidWJibGVzICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGcm9tIGEgRE9NIEV2ZW50LCBnZXQgaXRzIHJlbGF0ZWRUYXJnZXQgYW5kIG1hcCB0aGF0IHRvIHRoZSBzY2VuZXJ5IE5vZGUuIFdpbGwgcmV0dXJuIG51bGwgaWYgcmVsYXRlZFRhcmdldFxyXG4gICAqIGlzIG5vdCBwcm92aWRlZCwgb3IgaWYgcmVsYXRlZFRhcmdldCBpcyBub3QgdW5kZXIgUERPTSwgb3IgdGhlcmUgaXMgbm8gYXNzb2NpYXRlZCBOb2RlIHdpdGggdHJhaWwgaWQgb24gdGhlXHJcbiAgICogcmVsYXRlZFRhcmdldCBlbGVtZW50LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKlxyXG4gICAqIEBwYXJhbSBkb21FdmVudCAtIERPTSBFdmVudCwgbm90IGEgU2NlbmVyeUV2ZW50IVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRSZWxhdGVkVGFyZ2V0VHJhaWwoIGRvbUV2ZW50OiBGb2N1c0V2ZW50IHwgTW91c2VFdmVudCApOiBUcmFpbCB8IG51bGwge1xyXG4gICAgY29uc3QgcmVsYXRlZFRhcmdldEVsZW1lbnQgPSBkb21FdmVudC5yZWxhdGVkVGFyZ2V0O1xyXG5cclxuICAgIGlmICggcmVsYXRlZFRhcmdldEVsZW1lbnQgJiYgdGhpcy5kaXNwbGF5LmlzRWxlbWVudFVuZGVyUERPTSggcmVsYXRlZFRhcmdldEVsZW1lbnQgYXMgSFRNTEVsZW1lbnQsIGZhbHNlICkgKSB7XHJcblxyXG4gICAgICBjb25zdCByZWxhdGVkVGFyZ2V0ID0gKCBkb21FdmVudC5yZWxhdGVkVGFyZ2V0IGFzIHVua25vd24gYXMgRWxlbWVudCApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCByZWxhdGVkVGFyZ2V0IGluc3RhbmNlb2Ygd2luZG93LkVsZW1lbnQgKTtcclxuICAgICAgY29uc3QgdHJhaWxJbmRpY2VzID0gcmVsYXRlZFRhcmdldC5nZXRBdHRyaWJ1dGUoIFBET01VdGlscy5EQVRBX1BET01fVU5JUVVFX0lEICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRyYWlsSW5kaWNlcywgJ3Nob3VsZCBub3QgYmUgbnVsbCcgKTtcclxuXHJcbiAgICAgIHJldHVybiBQRE9NSW5zdGFuY2UudW5pcXVlSWRUb1RyYWlsKCB0aGlzLmRpc3BsYXksIHRyYWlsSW5kaWNlcyEgKTtcclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSB0cmFpbCBJRCBvZiB0aGUgbm9kZSByZXByZXNlbnRlZCBieSBhIERPTSBlbGVtZW50IHdobyBpcyB0aGUgdGFyZ2V0IG9mIGEgRE9NIEV2ZW50IGluIHRoZSBhY2Nlc3NpYmxlIFBET00uXHJcbiAgICogVGhpcyBpcyBhIGJpdCBvZiBhIG1pc25vbWVyLCBiZWNhdXNlIHRoZSBkb21FdmVudCBkb2Vzbid0IGhhdmUgdG8gYmUgdW5kZXIgdGhlIFBET00uIFJldHVybnMgbnVsbCBpZiBub3QgaW4gdGhlIFBET00uXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRUcmFpbEZyb21QRE9NRXZlbnQoIGRvbUV2ZW50OiBUYXJnZXRTdWJzdGl0dWRlQXVnbWVudGVkRXZlbnQgKTogVHJhaWwgfCBudWxsIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGRvbUV2ZW50LnRhcmdldCB8fCBkb21FdmVudFsgVEFSR0VUX1NVQlNUSVRVVEVfS0VZIF0sICduZWVkIGEgd2F5IHRvIGdldCB0aGUgdGFyZ2V0JyApO1xyXG5cclxuICAgIGlmICggIXRoaXMuZGlzcGxheS5fYWNjZXNzaWJsZSApIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY291bGQgYmUgc2VyaWFsaXplZCBldmVudCBmb3IgcGhldC1pbyBwbGF5YmFja3MsIHNlZSBJbnB1dC5zZXJpYWxpemVET01FdmVudCgpXHJcbiAgICBpZiAoIGRvbUV2ZW50WyBUQVJHRVRfU1VCU1RJVFVURV9LRVkgXSApIHtcclxuICAgICAgY29uc3QgdHJhaWxJbmRpY2VzID0gZG9tRXZlbnRbIFRBUkdFVF9TVUJTVElUVVRFX0tFWSBdLmdldEF0dHJpYnV0ZSggUERPTVV0aWxzLkRBVEFfUERPTV9VTklRVUVfSUQgKTtcclxuICAgICAgcmV0dXJuIFBET01JbnN0YW5jZS51bmlxdWVJZFRvVHJhaWwoIHRoaXMuZGlzcGxheSwgdHJhaWxJbmRpY2VzISApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGNvbnN0IHRhcmdldCA9IGRvbUV2ZW50LnRhcmdldDtcclxuICAgICAgaWYgKCB0YXJnZXQgJiYgdGFyZ2V0IGluc3RhbmNlb2Ygd2luZG93LkVsZW1lbnQgJiYgdGhpcy5kaXNwbGF5LmlzRWxlbWVudFVuZGVyUERPTSggdGFyZ2V0LCBmYWxzZSApICkge1xyXG4gICAgICAgIGNvbnN0IHRyYWlsSW5kaWNlcyA9IHRhcmdldC5nZXRBdHRyaWJ1dGUoIFBET01VdGlscy5EQVRBX1BET01fVU5JUVVFX0lEICk7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdHJhaWxJbmRpY2VzLCAnc2hvdWxkIG5vdCBiZSBudWxsJyApO1xyXG4gICAgICAgIHJldHVybiBQRE9NSW5zdGFuY2UudW5pcXVlSWRUb1RyYWlsKCB0aGlzLmRpc3BsYXksIHRyYWlsSW5kaWNlcyEgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmlnZ2VycyBhIGxvZ2ljYWwgbW91c2Vkb3duIGV2ZW50LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgbWF5IGFsc28gYmUgY2FsbGVkIGZyb20gdGhlIHBvaW50ZXIgZXZlbnQgaGFuZGxlciAocG9pbnRlckRvd24pIG9yIGZyb20gdGhpbmdzIGxpa2UgZnV6emluZyBvclxyXG4gICAqIHBsYXliYWNrLiBUaGUgZXZlbnQgbWF5IGJlIFwiZmFrZWRcIiBmb3IgY2VydGFpbiBwdXJwb3Nlcy5cclxuICAgKi9cclxuICBwdWJsaWMgbW91c2VEb3duKCBpZDogbnVtYmVyLCBwb2ludDogVmVjdG9yMiwgY29udGV4dDogRXZlbnRDb250ZXh0PE1vdXNlRXZlbnQgfCBQb2ludGVyRXZlbnQ+ICk6IHZvaWQge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cuSW5wdXQoIGBtb3VzZURvd24oJyR7aWR9JywgJHtJbnB1dC5kZWJ1Z1RleHQoIHBvaW50LCBjb250ZXh0LmRvbUV2ZW50ICl9KTtgICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcbiAgICB0aGlzLm1vdXNlRG93bkFjdGlvbi5leGVjdXRlKCBpZCwgcG9pbnQsIGNvbnRleHQgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJpZ2dlcnMgYSBsb2dpY2FsIG1vdXNldXAgZXZlbnQuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyBtYXkgYWxzbyBiZSBjYWxsZWQgZnJvbSB0aGUgcG9pbnRlciBldmVudCBoYW5kbGVyIChwb2ludGVyVXApIG9yIGZyb20gdGhpbmdzIGxpa2UgZnV6emluZyBvclxyXG4gICAqIHBsYXliYWNrLiBUaGUgZXZlbnQgbWF5IGJlIFwiZmFrZWRcIiBmb3IgY2VydGFpbiBwdXJwb3Nlcy5cclxuICAgKi9cclxuICBwdWJsaWMgbW91c2VVcCggcG9pbnQ6IFZlY3RvcjIsIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxNb3VzZUV2ZW50IHwgUG9pbnRlckV2ZW50PiApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLklucHV0KCBgbW91c2VVcCgke0lucHV0LmRlYnVnVGV4dCggcG9pbnQsIGNvbnRleHQuZG9tRXZlbnQgKX0pO2AgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuICAgIHRoaXMubW91c2VVcEFjdGlvbi5leGVjdXRlKCBwb2ludCwgY29udGV4dCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmlnZ2VycyBhIGxvZ2ljYWwgbW91c2Vtb3ZlIGV2ZW50LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgbWF5IGFsc28gYmUgY2FsbGVkIGZyb20gdGhlIHBvaW50ZXIgZXZlbnQgaGFuZGxlciAocG9pbnRlck1vdmUpIG9yIGZyb20gdGhpbmdzIGxpa2UgZnV6emluZyBvclxyXG4gICAqIHBsYXliYWNrLiBUaGUgZXZlbnQgbWF5IGJlIFwiZmFrZWRcIiBmb3IgY2VydGFpbiBwdXJwb3Nlcy5cclxuICAgKi9cclxuICBwdWJsaWMgbW91c2VNb3ZlKCBwb2ludDogVmVjdG9yMiwgY29udGV4dDogRXZlbnRDb250ZXh0PE1vdXNlRXZlbnQgfCBQb2ludGVyRXZlbnQ+ICk6IHZvaWQge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cuSW5wdXQoIGBtb3VzZU1vdmUoJHtJbnB1dC5kZWJ1Z1RleHQoIHBvaW50LCBjb250ZXh0LmRvbUV2ZW50ICl9KTtgICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcbiAgICB0aGlzLm1vdXNlTW92ZUFjdGlvbi5leGVjdXRlKCBwb2ludCwgY29udGV4dCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmlnZ2VycyBhIGxvZ2ljYWwgbW91c2VvdmVyIGV2ZW50ICh0aGlzIGRvZXMgTk9UIGNvcnJlc3BvbmQgdG8gdGhlIFNjZW5lcnkgZXZlbnQsIHNpbmNlIHRoaXMgaXMgZm9yIHRoZSBkaXNwbGF5KSAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgbW91c2VPdmVyKCBwb2ludDogVmVjdG9yMiwgY29udGV4dDogRXZlbnRDb250ZXh0PE1vdXNlRXZlbnQgfCBQb2ludGVyRXZlbnQ+ICk6IHZvaWQge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cuSW5wdXQoIGBtb3VzZU92ZXIoJHtJbnB1dC5kZWJ1Z1RleHQoIHBvaW50LCBjb250ZXh0LmRvbUV2ZW50ICl9KTtgICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcbiAgICB0aGlzLm1vdXNlT3ZlckFjdGlvbi5leGVjdXRlKCBwb2ludCwgY29udGV4dCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmlnZ2VycyBhIGxvZ2ljYWwgbW91c2VvdXQgZXZlbnQgKHRoaXMgZG9lcyBOT1QgY29ycmVzcG9uZCB0byB0aGUgU2NlbmVyeSBldmVudCwgc2luY2UgdGhpcyBpcyBmb3IgdGhlIGRpc3BsYXkpIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBtb3VzZU91dCggcG9pbnQ6IFZlY3RvcjIsIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxNb3VzZUV2ZW50IHwgUG9pbnRlckV2ZW50PiApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLklucHV0KCBgbW91c2VPdXQoJHtJbnB1dC5kZWJ1Z1RleHQoIHBvaW50LCBjb250ZXh0LmRvbUV2ZW50ICl9KTtgICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcbiAgICB0aGlzLm1vdXNlT3V0QWN0aW9uLmV4ZWN1dGUoIHBvaW50LCBjb250ZXh0ICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyaWdnZXJzIGEgbG9naWNhbCBtb3VzZS13aGVlbC9zY3JvbGwgZXZlbnQuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyB3aGVlbCggY29udGV4dDogRXZlbnRDb250ZXh0PFdoZWVsRXZlbnQ+ICk6IHZvaWQge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cuSW5wdXQoIGB3aGVlbCgke0lucHV0LmRlYnVnVGV4dCggbnVsbCwgY29udGV4dC5kb21FdmVudCApfSk7YCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG4gICAgdGhpcy53aGVlbFNjcm9sbEFjdGlvbi5leGVjdXRlKCBjb250ZXh0ICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyaWdnZXJzIGEgbG9naWNhbCB0b3VjaHN0YXJ0IGV2ZW50LiBUaGlzIGlzIGNhbGxlZCBmb3IgZWFjaCB0b3VjaCBwb2ludCBpbiBhICdyYXcnIGV2ZW50LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgbWF5IGFsc28gYmUgY2FsbGVkIGZyb20gdGhlIHBvaW50ZXIgZXZlbnQgaGFuZGxlciAocG9pbnRlckRvd24pIG9yIGZyb20gdGhpbmdzIGxpa2UgZnV6emluZyBvclxyXG4gICAqIHBsYXliYWNrLiBUaGUgZXZlbnQgbWF5IGJlIFwiZmFrZWRcIiBmb3IgY2VydGFpbiBwdXJwb3Nlcy5cclxuICAgKi9cclxuICBwdWJsaWMgdG91Y2hTdGFydCggaWQ6IG51bWJlciwgcG9pbnQ6IFZlY3RvcjIsIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxUb3VjaEV2ZW50IHwgUG9pbnRlckV2ZW50PiApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLklucHV0KCBgdG91Y2hTdGFydCgnJHtpZH0nLCR7SW5wdXQuZGVidWdUZXh0KCBwb2ludCwgY29udGV4dC5kb21FdmVudCApfSk7YCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIHRoaXMudG91Y2hTdGFydEFjdGlvbi5leGVjdXRlKCBpZCwgcG9pbnQsIGNvbnRleHQgKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyaWdnZXJzIGEgbG9naWNhbCB0b3VjaGVuZCBldmVudC4gVGhpcyBpcyBjYWxsZWQgZm9yIGVhY2ggdG91Y2ggcG9pbnQgaW4gYSAncmF3JyBldmVudC4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSBhbHNvIGJlIGNhbGxlZCBmcm9tIHRoZSBwb2ludGVyIGV2ZW50IGhhbmRsZXIgKHBvaW50ZXJVcCkgb3IgZnJvbSB0aGluZ3MgbGlrZSBmdXp6aW5nIG9yXHJcbiAgICogcGxheWJhY2suIFRoZSBldmVudCBtYXkgYmUgXCJmYWtlZFwiIGZvciBjZXJ0YWluIHB1cnBvc2VzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB0b3VjaEVuZCggaWQ6IG51bWJlciwgcG9pbnQ6IFZlY3RvcjIsIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxUb3VjaEV2ZW50IHwgUG9pbnRlckV2ZW50PiApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLklucHV0KCBgdG91Y2hFbmQoJyR7aWR9Jywke0lucHV0LmRlYnVnVGV4dCggcG9pbnQsIGNvbnRleHQuZG9tRXZlbnQgKX0pO2AgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICB0aGlzLnRvdWNoRW5kQWN0aW9uLmV4ZWN1dGUoIGlkLCBwb2ludCwgY29udGV4dCApO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJpZ2dlcnMgYSBsb2dpY2FsIHRvdWNobW92ZSBldmVudC4gVGhpcyBpcyBjYWxsZWQgZm9yIGVhY2ggdG91Y2ggcG9pbnQgaW4gYSAncmF3JyBldmVudC4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSBhbHNvIGJlIGNhbGxlZCBmcm9tIHRoZSBwb2ludGVyIGV2ZW50IGhhbmRsZXIgKHBvaW50ZXJNb3ZlKSBvciBmcm9tIHRoaW5ncyBsaWtlIGZ1enppbmcgb3JcclxuICAgKiBwbGF5YmFjay4gVGhlIGV2ZW50IG1heSBiZSBcImZha2VkXCIgZm9yIGNlcnRhaW4gcHVycG9zZXMuXHJcbiAgICovXHJcbiAgcHVibGljIHRvdWNoTW92ZSggaWQ6IG51bWJlciwgcG9pbnQ6IFZlY3RvcjIsIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxUb3VjaEV2ZW50IHwgUG9pbnRlckV2ZW50PiApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLklucHV0KCBgdG91Y2hNb3ZlKCcke2lkfScsJHtJbnB1dC5kZWJ1Z1RleHQoIHBvaW50LCBjb250ZXh0LmRvbUV2ZW50ICl9KTtgICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcbiAgICB0aGlzLnRvdWNoTW92ZUFjdGlvbi5leGVjdXRlKCBpZCwgcG9pbnQsIGNvbnRleHQgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJpZ2dlcnMgYSBsb2dpY2FsIHRvdWNoY2FuY2VsIGV2ZW50LiBUaGlzIGlzIGNhbGxlZCBmb3IgZWFjaCB0b3VjaCBwb2ludCBpbiBhICdyYXcnIGV2ZW50LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgbWF5IGFsc28gYmUgY2FsbGVkIGZyb20gdGhlIHBvaW50ZXIgZXZlbnQgaGFuZGxlciAocG9pbnRlckNhbmNlbCkgb3IgZnJvbSB0aGluZ3MgbGlrZSBmdXp6aW5nIG9yXHJcbiAgICogcGxheWJhY2suIFRoZSBldmVudCBtYXkgYmUgXCJmYWtlZFwiIGZvciBjZXJ0YWluIHB1cnBvc2VzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB0b3VjaENhbmNlbCggaWQ6IG51bWJlciwgcG9pbnQ6IFZlY3RvcjIsIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxUb3VjaEV2ZW50IHwgUG9pbnRlckV2ZW50PiApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLklucHV0KCBgdG91Y2hDYW5jZWwoJyR7aWR9Jywke0lucHV0LmRlYnVnVGV4dCggcG9pbnQsIGNvbnRleHQuZG9tRXZlbnQgKX0pO2AgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuICAgIHRoaXMudG91Y2hDYW5jZWxBY3Rpb24uZXhlY3V0ZSggaWQsIHBvaW50LCBjb250ZXh0ICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyaWdnZXJzIGEgbG9naWNhbCBwZW5zdGFydCBldmVudCAoZS5nLiBhIHN0eWx1cykuIFRoaXMgaXMgY2FsbGVkIGZvciBlYWNoIHBlbiBwb2ludCBpbiBhICdyYXcnIGV2ZW50LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgbWF5IGFsc28gYmUgY2FsbGVkIGZyb20gdGhlIHBvaW50ZXIgZXZlbnQgaGFuZGxlciAocG9pbnRlckRvd24pIG9yIGZyb20gdGhpbmdzIGxpa2UgZnV6emluZyBvclxyXG4gICAqIHBsYXliYWNrLiBUaGUgZXZlbnQgbWF5IGJlIFwiZmFrZWRcIiBmb3IgY2VydGFpbiBwdXJwb3Nlcy5cclxuICAgKi9cclxuICBwdWJsaWMgcGVuU3RhcnQoIGlkOiBudW1iZXIsIHBvaW50OiBWZWN0b3IyLCBjb250ZXh0OiBFdmVudENvbnRleHQ8UG9pbnRlckV2ZW50PiApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLklucHV0KCBgcGVuU3RhcnQoJyR7aWR9Jywke0lucHV0LmRlYnVnVGV4dCggcG9pbnQsIGNvbnRleHQuZG9tRXZlbnQgKX0pO2AgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuICAgIHRoaXMucGVuU3RhcnRBY3Rpb24uZXhlY3V0ZSggaWQsIHBvaW50LCBjb250ZXh0ICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyaWdnZXJzIGEgbG9naWNhbCBwZW5lbmQgZXZlbnQgKGUuZy4gYSBzdHlsdXMpLiBUaGlzIGlzIGNhbGxlZCBmb3IgZWFjaCBwZW4gcG9pbnQgaW4gYSAncmF3JyBldmVudC4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSBhbHNvIGJlIGNhbGxlZCBmcm9tIHRoZSBwb2ludGVyIGV2ZW50IGhhbmRsZXIgKHBvaW50ZXJVcCkgb3IgZnJvbSB0aGluZ3MgbGlrZSBmdXp6aW5nIG9yXHJcbiAgICogcGxheWJhY2suIFRoZSBldmVudCBtYXkgYmUgXCJmYWtlZFwiIGZvciBjZXJ0YWluIHB1cnBvc2VzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBwZW5FbmQoIGlkOiBudW1iZXIsIHBvaW50OiBWZWN0b3IyLCBjb250ZXh0OiBFdmVudENvbnRleHQ8UG9pbnRlckV2ZW50PiApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLklucHV0KCBgcGVuRW5kKCcke2lkfScsJHtJbnB1dC5kZWJ1Z1RleHQoIHBvaW50LCBjb250ZXh0LmRvbUV2ZW50ICl9KTtgICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcbiAgICB0aGlzLnBlbkVuZEFjdGlvbi5leGVjdXRlKCBpZCwgcG9pbnQsIGNvbnRleHQgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJpZ2dlcnMgYSBsb2dpY2FsIHBlbm1vdmUgZXZlbnQgKGUuZy4gYSBzdHlsdXMpLiBUaGlzIGlzIGNhbGxlZCBmb3IgZWFjaCBwZW4gcG9pbnQgaW4gYSAncmF3JyBldmVudC4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSBhbHNvIGJlIGNhbGxlZCBmcm9tIHRoZSBwb2ludGVyIGV2ZW50IGhhbmRsZXIgKHBvaW50ZXJNb3ZlKSBvciBmcm9tIHRoaW5ncyBsaWtlIGZ1enppbmcgb3JcclxuICAgKiBwbGF5YmFjay4gVGhlIGV2ZW50IG1heSBiZSBcImZha2VkXCIgZm9yIGNlcnRhaW4gcHVycG9zZXMuXHJcbiAgICovXHJcbiAgcHVibGljIHBlbk1vdmUoIGlkOiBudW1iZXIsIHBvaW50OiBWZWN0b3IyLCBjb250ZXh0OiBFdmVudENvbnRleHQ8UG9pbnRlckV2ZW50PiApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLklucHV0KCBgcGVuTW92ZSgnJHtpZH0nLCR7SW5wdXQuZGVidWdUZXh0KCBwb2ludCwgY29udGV4dC5kb21FdmVudCApfSk7YCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG4gICAgdGhpcy5wZW5Nb3ZlQWN0aW9uLmV4ZWN1dGUoIGlkLCBwb2ludCwgY29udGV4dCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmlnZ2VycyBhIGxvZ2ljYWwgcGVuY2FuY2VsIGV2ZW50IChlLmcuIGEgc3R5bHVzKS4gVGhpcyBpcyBjYWxsZWQgZm9yIGVhY2ggcGVuIHBvaW50IGluIGEgJ3JhdycgZXZlbnQuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyBtYXkgYWxzbyBiZSBjYWxsZWQgZnJvbSB0aGUgcG9pbnRlciBldmVudCBoYW5kbGVyIChwb2ludGVyQ2FuY2VsKSBvciBmcm9tIHRoaW5ncyBsaWtlIGZ1enppbmcgb3JcclxuICAgKiBwbGF5YmFjay4gVGhlIGV2ZW50IG1heSBiZSBcImZha2VkXCIgZm9yIGNlcnRhaW4gcHVycG9zZXMuXHJcbiAgICovXHJcbiAgcHVibGljIHBlbkNhbmNlbCggaWQ6IG51bWJlciwgcG9pbnQ6IFZlY3RvcjIsIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxQb2ludGVyRXZlbnQ+ICk6IHZvaWQge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cuSW5wdXQoIGBwZW5DYW5jZWwoJyR7aWR9Jywke0lucHV0LmRlYnVnVGV4dCggcG9pbnQsIGNvbnRleHQuZG9tRXZlbnQgKX0pO2AgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuICAgIHRoaXMucGVuQ2FuY2VsQWN0aW9uLmV4ZWN1dGUoIGlkLCBwb2ludCwgY29udGV4dCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGVzIGEgcG9pbnRlcmRvd24gZXZlbnQsIGZvcndhcmRpbmcgaXQgdG8gdGhlIHByb3BlciBsb2dpY2FsIGV2ZW50LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgcG9pbnRlckRvd24oIGlkOiBudW1iZXIsIHR5cGU6IHN0cmluZywgcG9pbnQ6IFZlY3RvcjIsIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxQb2ludGVyRXZlbnQ+ICk6IHZvaWQge1xyXG4gICAgLy8gSW4gSUUgZm9yIHBvaW50ZXIgZG93biBldmVudHMsIHdlIHdhbnQgdG8gbWFrZSBzdXJlIHRoYW4gdGhlIG5leHQgaW50ZXJhY3Rpb25zIG9mZiB0aGUgcGFnZSBhcmUgc2VudCB0b1xyXG4gICAgLy8gdGhpcyBlbGVtZW50IChpdCB3aWxsIGJ1YmJsZSkuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvNDY0IGFuZFxyXG4gICAgLy8gaHR0cDovL25ld3MucW9veGRvby5vcmcvbW91c2UtY2FwdHVyaW5nLlxyXG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5hdHRhY2hUb1dpbmRvdyA/IGRvY3VtZW50LmJvZHkgOiB0aGlzLmRpc3BsYXkuZG9tRWxlbWVudDtcclxuICAgIGlmICggdGFyZ2V0LnNldFBvaW50ZXJDYXB0dXJlICYmIGNvbnRleHQuZG9tRXZlbnQucG9pbnRlcklkICYmICFjb250ZXh0LmFsbG93c0RPTUlucHV0KCkgKSB7XHJcbiAgICAgIC8vIE5PVEU6IFRoaXMgd2lsbCBlcnJvciBvdXQgaWYgcnVuIG9uIGEgcGxheWJhY2sgZGVzdGluYXRpb24sIHdoZXJlIGEgcG9pbnRlciB3aXRoIHRoZSBnaXZlbiBJRCBkb2VzIG5vdCBleGlzdC5cclxuICAgICAgdGFyZ2V0LnNldFBvaW50ZXJDYXB0dXJlKCBjb250ZXh0LmRvbUV2ZW50LnBvaW50ZXJJZCApO1xyXG4gICAgfVxyXG5cclxuICAgIHR5cGUgPSB0aGlzLmhhbmRsZVVua25vd25Qb2ludGVyVHlwZSggdHlwZSwgaWQgKTtcclxuICAgIHN3aXRjaCggdHlwZSApIHtcclxuICAgICAgY2FzZSAnbW91c2UnOlxyXG4gICAgICAgIC8vIFRoZSBhY3R1YWwgZXZlbnQgYWZ0ZXJ3YXJkc1xyXG4gICAgICAgIHRoaXMubW91c2VEb3duKCBpZCwgcG9pbnQsIGNvbnRleHQgKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAndG91Y2gnOlxyXG4gICAgICAgIHRoaXMudG91Y2hTdGFydCggaWQsIHBvaW50LCBjb250ZXh0ICk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ3Blbic6XHJcbiAgICAgICAgdGhpcy5wZW5TdGFydCggaWQsIHBvaW50LCBjb250ZXh0ICk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIGBVbmtub3duIHBvaW50ZXIgdHlwZTogJHt0eXBlfWAgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGVzIGEgcG9pbnRlcnVwIGV2ZW50LCBmb3J3YXJkaW5nIGl0IHRvIHRoZSBwcm9wZXIgbG9naWNhbCBldmVudC4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIHBvaW50ZXJVcCggaWQ6IG51bWJlciwgdHlwZTogc3RyaW5nLCBwb2ludDogVmVjdG9yMiwgY29udGV4dDogRXZlbnRDb250ZXh0PFBvaW50ZXJFdmVudD4gKTogdm9pZCB7XHJcblxyXG4gICAgLy8gdXBkYXRlIHRoaXMgb3V0c2lkZSBvZiB0aGUgQWN0aW9uIGV4ZWN1dGlvbnMgc28gdGhhdCBQaEVULWlPIGV2ZW50IHBsYXliYWNrIGRvZXMgbm90IG92ZXJyaWRlIGl0XHJcbiAgICB0aGlzLnVwVGltZVN0YW1wID0gY29udGV4dC5kb21FdmVudC50aW1lU3RhbXA7XHJcblxyXG4gICAgdHlwZSA9IHRoaXMuaGFuZGxlVW5rbm93blBvaW50ZXJUeXBlKCB0eXBlLCBpZCApO1xyXG4gICAgc3dpdGNoKCB0eXBlICkge1xyXG4gICAgICBjYXNlICdtb3VzZSc6XHJcbiAgICAgICAgdGhpcy5tb3VzZVVwKCBwb2ludCwgY29udGV4dCApO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICd0b3VjaCc6XHJcbiAgICAgICAgdGhpcy50b3VjaEVuZCggaWQsIHBvaW50LCBjb250ZXh0ICk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ3Blbic6XHJcbiAgICAgICAgdGhpcy5wZW5FbmQoIGlkLCBwb2ludCwgY29udGV4dCApO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBgVW5rbm93biBwb2ludGVyIHR5cGU6ICR7dHlwZX1gICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlcyBhIHBvaW50ZXJjYW5jZWwgZXZlbnQsIGZvcndhcmRpbmcgaXQgdG8gdGhlIHByb3BlciBsb2dpY2FsIGV2ZW50LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgcG9pbnRlckNhbmNlbCggaWQ6IG51bWJlciwgdHlwZTogc3RyaW5nLCBwb2ludDogVmVjdG9yMiwgY29udGV4dDogRXZlbnRDb250ZXh0PFBvaW50ZXJFdmVudD4gKTogdm9pZCB7XHJcbiAgICB0eXBlID0gdGhpcy5oYW5kbGVVbmtub3duUG9pbnRlclR5cGUoIHR5cGUsIGlkICk7XHJcbiAgICBzd2l0Y2goIHR5cGUgKSB7XHJcbiAgICAgIGNhc2UgJ21vdXNlJzpcclxuICAgICAgICBpZiAoIGNvbnNvbGUgJiYgY29uc29sZS5sb2cgKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggJ1dBUk5JTkc6IFBvaW50ZXIgbW91c2UgY2FuY2VsIHdhcyByZWNlaXZlZCcgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ3RvdWNoJzpcclxuICAgICAgICB0aGlzLnRvdWNoQ2FuY2VsKCBpZCwgcG9pbnQsIGNvbnRleHQgKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAncGVuJzpcclxuICAgICAgICB0aGlzLnBlbkNhbmNlbCggaWQsIHBvaW50LCBjb250ZXh0ICk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgaWYgKCBjb25zb2xlLmxvZyApIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCBgVW5rbm93biBwb2ludGVyIHR5cGU6ICR7dHlwZX1gICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlcyBhIGdvdHBvaW50ZXJjYXB0dXJlIGV2ZW50LCBmb3J3YXJkaW5nIGl0IHRvIHRoZSBwcm9wZXIgbG9naWNhbCBldmVudC4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIGdvdFBvaW50ZXJDYXB0dXJlKCBpZDogbnVtYmVyLCB0eXBlOiBzdHJpbmcsIHBvaW50OiBWZWN0b3IyLCBjb250ZXh0OiBFdmVudENvbnRleHQgKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5JbnB1dCggYGdvdFBvaW50ZXJDYXB0dXJlKCcke2lkfScsJHtJbnB1dC5kZWJ1Z1RleHQoIG51bGwsIGNvbnRleHQuZG9tRXZlbnQgKX0pO2AgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuICAgIHRoaXMuZ290UG9pbnRlckNhcHR1cmVBY3Rpb24uZXhlY3V0ZSggaWQsIGNvbnRleHQgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlcyBhIGxvc3Rwb2ludGVyY2FwdHVyZSBldmVudCwgZm9yd2FyZGluZyBpdCB0byB0aGUgcHJvcGVyIGxvZ2ljYWwgZXZlbnQuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBsb3N0UG9pbnRlckNhcHR1cmUoIGlkOiBudW1iZXIsIHR5cGU6IHN0cmluZywgcG9pbnQ6IFZlY3RvcjIsIGNvbnRleHQ6IEV2ZW50Q29udGV4dCApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLklucHV0KCBgbG9zdFBvaW50ZXJDYXB0dXJlKCcke2lkfScsJHtJbnB1dC5kZWJ1Z1RleHQoIG51bGwsIGNvbnRleHQuZG9tRXZlbnQgKX0pO2AgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuICAgIHRoaXMubG9zdFBvaW50ZXJDYXB0dXJlQWN0aW9uLmV4ZWN1dGUoIGlkLCBjb250ZXh0ICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZXMgYSBwb2ludGVybW92ZSBldmVudCwgZm9yd2FyZGluZyBpdCB0byB0aGUgcHJvcGVyIGxvZ2ljYWwgZXZlbnQuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBwb2ludGVyTW92ZSggaWQ6IG51bWJlciwgdHlwZTogc3RyaW5nLCBwb2ludDogVmVjdG9yMiwgY29udGV4dDogRXZlbnRDb250ZXh0PFBvaW50ZXJFdmVudD4gKTogdm9pZCB7XHJcbiAgICB0eXBlID0gdGhpcy5oYW5kbGVVbmtub3duUG9pbnRlclR5cGUoIHR5cGUsIGlkICk7XHJcbiAgICBzd2l0Y2goIHR5cGUgKSB7XHJcbiAgICAgIGNhc2UgJ21vdXNlJzpcclxuICAgICAgICB0aGlzLm1vdXNlTW92ZSggcG9pbnQsIGNvbnRleHQgKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAndG91Y2gnOlxyXG4gICAgICAgIHRoaXMudG91Y2hNb3ZlKCBpZCwgcG9pbnQsIGNvbnRleHQgKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAncGVuJzpcclxuICAgICAgICB0aGlzLnBlbk1vdmUoIGlkLCBwb2ludCwgY29udGV4dCApO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIGlmICggY29uc29sZS5sb2cgKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyggYFVua25vd24gcG9pbnRlciB0eXBlOiAke3R5cGV9YCApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZXMgYSBwb2ludGVyb3ZlciBldmVudCwgZm9yd2FyZGluZyBpdCB0byB0aGUgcHJvcGVyIGxvZ2ljYWwgZXZlbnQuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBwb2ludGVyT3ZlciggaWQ6IG51bWJlciwgdHlwZTogc3RyaW5nLCBwb2ludDogVmVjdG9yMiwgY29udGV4dDogRXZlbnRDb250ZXh0PFBvaW50ZXJFdmVudD4gKTogdm9pZCB7XHJcbiAgICAvLyBUT0RPOiBhY2N1bXVsYXRlIG1vdXNlL3RvdWNoIGluZm8gaW4gdGhlIG9iamVjdCBpZiBuZWVkZWQ/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAvLyBUT0RPOiBkbyB3ZSB3YW50IHRvIGJyYW5jaCBjaGFuZ2Ugb24gdGhlc2UgdHlwZXMgb2YgZXZlbnRzPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlcyBhIHBvaW50ZXJvdXQgZXZlbnQsIGZvcndhcmRpbmcgaXQgdG8gdGhlIHByb3BlciBsb2dpY2FsIGV2ZW50LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgcG9pbnRlck91dCggaWQ6IG51bWJlciwgdHlwZTogc3RyaW5nLCBwb2ludDogVmVjdG9yMiwgY29udGV4dDogRXZlbnRDb250ZXh0PFBvaW50ZXJFdmVudD4gKTogdm9pZCB7XHJcbiAgICAvLyBUT0RPOiBhY2N1bXVsYXRlIG1vdXNlL3RvdWNoIGluZm8gaW4gdGhlIG9iamVjdCBpZiBuZWVkZWQ/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAvLyBUT0RPOiBkbyB3ZSB3YW50IHRvIGJyYW5jaCBjaGFuZ2Ugb24gdGhlc2UgdHlwZXMgb2YgZXZlbnRzPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlcyBhIHBvaW50ZXJlbnRlciBldmVudCwgZm9yd2FyZGluZyBpdCB0byB0aGUgcHJvcGVyIGxvZ2ljYWwgZXZlbnQuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBwb2ludGVyRW50ZXIoIGlkOiBudW1iZXIsIHR5cGU6IHN0cmluZywgcG9pbnQ6IFZlY3RvcjIsIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxQb2ludGVyRXZlbnQ+ICk6IHZvaWQge1xyXG4gICAgLy8gVE9ETzogYWNjdW11bGF0ZSBtb3VzZS90b3VjaCBpbmZvIGluIHRoZSBvYmplY3QgaWYgbmVlZGVkPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgLy8gVE9ETzogZG8gd2Ugd2FudCB0byBicmFuY2ggY2hhbmdlIG9uIHRoZXNlIHR5cGVzIG9mIGV2ZW50cz8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZXMgYSBwb2ludGVybGVhdmUgZXZlbnQsIGZvcndhcmRpbmcgaXQgdG8gdGhlIHByb3BlciBsb2dpY2FsIGV2ZW50LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgcG9pbnRlckxlYXZlKCBpZDogbnVtYmVyLCB0eXBlOiBzdHJpbmcsIHBvaW50OiBWZWN0b3IyLCBjb250ZXh0OiBFdmVudENvbnRleHQ8UG9pbnRlckV2ZW50PiApOiB2b2lkIHtcclxuICAgIC8vIFRPRE86IGFjY3VtdWxhdGUgbW91c2UvdG91Y2ggaW5mbyBpbiB0aGUgb2JqZWN0IGlmIG5lZWRlZD8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgIC8vIFRPRE86IGRvIHdlIHdhbnQgdG8gYnJhbmNoIGNoYW5nZSBvbiB0aGVzZSB0eXBlcyBvZiBldmVudHM/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGVzIGEgZm9jdXNpbiBldmVudCwgZm9yd2FyZGluZyBpdCB0byB0aGUgcHJvcGVyIGxvZ2ljYWwgZXZlbnQuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBmb2N1c0luKCBjb250ZXh0OiBFdmVudENvbnRleHQ8Rm9jdXNFdmVudD4gKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5JbnB1dCggYGZvY3VzSW4oJyR7SW5wdXQuZGVidWdUZXh0KCBudWxsLCBjb250ZXh0LmRvbUV2ZW50ICl9KTtgICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgdGhpcy5mb2N1c2luQWN0aW9uLmV4ZWN1dGUoIGNvbnRleHQgKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZXMgYSBmb2N1c291dCBldmVudCwgZm9yd2FyZGluZyBpdCB0byB0aGUgcHJvcGVyIGxvZ2ljYWwgZXZlbnQuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBmb2N1c091dCggY29udGV4dDogRXZlbnRDb250ZXh0PEZvY3VzRXZlbnQ+ICk6IHZvaWQge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cuSW5wdXQoIGBmb2N1c091dCgnJHtJbnB1dC5kZWJ1Z1RleHQoIG51bGwsIGNvbnRleHQuZG9tRXZlbnQgKX0pO2AgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICB0aGlzLmZvY3Vzb3V0QWN0aW9uLmV4ZWN1dGUoIGNvbnRleHQgKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZXMgYW4gaW5wdXQgZXZlbnQsIGZvcndhcmRpbmcgaXQgdG8gdGhlIHByb3BlciBsb2dpY2FsIGV2ZW50LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgaW5wdXQoIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxFdmVudCB8IElucHV0RXZlbnQ+ICk6IHZvaWQge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cuSW5wdXQoIGBpbnB1dCgnJHtJbnB1dC5kZWJ1Z1RleHQoIG51bGwsIGNvbnRleHQuZG9tRXZlbnQgKX0pO2AgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICB0aGlzLmlucHV0QWN0aW9uLmV4ZWN1dGUoIGNvbnRleHQgKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZXMgYSBjaGFuZ2UgZXZlbnQsIGZvcndhcmRpbmcgaXQgdG8gdGhlIHByb3BlciBsb2dpY2FsIGV2ZW50LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgY2hhbmdlKCBjb250ZXh0OiBFdmVudENvbnRleHQgKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5JbnB1dCggYGNoYW5nZSgnJHtJbnB1dC5kZWJ1Z1RleHQoIG51bGwsIGNvbnRleHQuZG9tRXZlbnQgKX0pO2AgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICB0aGlzLmNoYW5nZUFjdGlvbi5leGVjdXRlKCBjb250ZXh0ICk7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGVzIGEgY2xpY2sgZXZlbnQsIGZvcndhcmRpbmcgaXQgdG8gdGhlIHByb3BlciBsb2dpY2FsIGV2ZW50LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgY2xpY2soIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxNb3VzZUV2ZW50PiApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLklucHV0KCBgY2xpY2soJyR7SW5wdXQuZGVidWdUZXh0KCBudWxsLCBjb250ZXh0LmRvbUV2ZW50ICl9KTtgICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgdGhpcy5jbGlja0FjdGlvbi5leGVjdXRlKCBjb250ZXh0ICk7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGVzIGEga2V5ZG93biBldmVudCwgZm9yd2FyZGluZyBpdCB0byB0aGUgcHJvcGVyIGxvZ2ljYWwgZXZlbnQuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBrZXlEb3duKCBjb250ZXh0OiBFdmVudENvbnRleHQ8S2V5Ym9hcmRFdmVudD4gKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5JbnB1dCggYGtleURvd24oJyR7SW5wdXQuZGVidWdUZXh0KCBudWxsLCBjb250ZXh0LmRvbUV2ZW50ICl9KTtgICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgdGhpcy5rZXlkb3duQWN0aW9uLmV4ZWN1dGUoIGNvbnRleHQgKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZXMgYSBrZXl1cCBldmVudCwgZm9yd2FyZGluZyBpdCB0byB0aGUgcHJvcGVyIGxvZ2ljYWwgZXZlbnQuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBrZXlVcCggY29udGV4dDogRXZlbnRDb250ZXh0PEtleWJvYXJkRXZlbnQ+ICk6IHZvaWQge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cuSW5wdXQoIGBrZXlVcCgnJHtJbnB1dC5kZWJ1Z1RleHQoIG51bGwsIGNvbnRleHQuZG9tRXZlbnQgKX0pO2AgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICB0aGlzLmtleXVwQWN0aW9uLmV4ZWN1dGUoIGNvbnRleHQgKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZW4gd2UgZ2V0IGFuIHVua25vd24gcG9pbnRlciBldmVudCB0eXBlIChhbGxvd2VkIGluIHRoZSBzcGVjLCBzZWVcclxuICAgKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvUG9pbnRlckV2ZW50L3BvaW50ZXJUeXBlKSwgd2UnbGwgdHJ5IHRvIGd1ZXNzIHRoZSBwb2ludGVyIHR5cGVcclxuICAgKiBzbyB0aGF0IHdlIGNhbiBwcm9wZXJseSBzdGFydC9lbmQgdGhlIGludGVyYWN0aW9uLiBOT1RFOiB0aGlzIGNhbiBoYXBwZW4gZm9yIGFuICd1cCcgd2hlcmUgd2UgcmVjZWl2ZWQgYVxyXG4gICAqIHByb3BlciB0eXBlIGZvciBhICdkb3duJywgc28gdGh1cyB3ZSBuZWVkIHRoZSBkZXRlY3Rpb24uXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBoYW5kbGVVbmtub3duUG9pbnRlclR5cGUoIHR5cGU6IHN0cmluZywgaWQ6IG51bWJlciApOiBzdHJpbmcge1xyXG4gICAgaWYgKCB0eXBlICE9PSAnJyApIHtcclxuICAgICAgcmV0dXJuIHR5cGU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gKCB0aGlzLm1vdXNlICYmIHRoaXMubW91c2UuaWQgPT09IGlkICkgPyAnbW91c2UnIDogJ3RvdWNoJztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIGEgcG9pbnRlciByZWZlcmVuY2UsIGhpdCB0ZXN0IGl0IGFuZCBkZXRlcm1pbmUgdGhlIFRyYWlsIHRoYXQgdGhlIHBvaW50ZXIgaXMgb3Zlci5cclxuICAgKi9cclxuICBwcml2YXRlIGdldFBvaW50ZXJUcmFpbCggcG9pbnRlcjogUG9pbnRlciApOiBUcmFpbCB7XHJcbiAgICByZXR1cm4gdGhpcy5yb290Tm9kZS50cmFpbFVuZGVyUG9pbnRlciggcG9pbnRlciApIHx8IG5ldyBUcmFpbCggdGhpcy5yb290Tm9kZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIGZvciBlYWNoIGxvZ2ljYWwgXCJ1cFwiIGV2ZW50LCBmb3IgYW55IHBvaW50ZXIgdHlwZS5cclxuICAgKi9cclxuICBwcml2YXRlIHVwRXZlbnQ8RE9NRXZlbnQgZXh0ZW5kcyBFdmVudD4oIHBvaW50ZXI6IFBvaW50ZXIsIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxET01FdmVudD4sIHBvaW50OiBWZWN0b3IyICk6IHZvaWQge1xyXG4gICAgLy8gaWYgdGhlIGV2ZW50IHRhcmdldCBpcyB3aXRoaW4gdGhlIFBET00gdGhlIEFUIGlzIHNlbmRpbmcgYSBmYWtlIHBvaW50ZXIgZXZlbnQgdG8gdGhlIGRvY3VtZW50IC0gZG8gbm90XHJcbiAgICAvLyBkaXNwYXRjaCB0aGlzIHNpbmNlIHRoZSBQRE9NIHNob3VsZCBvbmx5IGhhbmRsZSBJbnB1dC5QRE9NX0VWRU5UX1RZUEVTLCBhbmQgYWxsIG90aGVyIHBvaW50ZXIgaW5wdXQgc2hvdWxkXHJcbiAgICAvLyBnbyB0aHJvdWdoIHRoZSBEaXNwbGF5IGRpdi4gT3RoZXJ3aXNlLCBhY3RpdmF0aW9uIHdpbGwgYmUgZHVwbGljYXRlZCB3aGVuIHdlIGhhbmRsZSBwb2ludGVyIGFuZCBQRE9NIGV2ZW50c1xyXG4gICAgaWYgKCB0aGlzLmRpc3BsYXkuaXNFbGVtZW50VW5kZXJQRE9NKCBjb250ZXh0LmRvbUV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudCwgdHJ1ZSApICkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcG9pbnRDaGFuZ2VkID0gcG9pbnRlci51cCggcG9pbnQsIGNvbnRleHQuZG9tRXZlbnQgKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5JbnB1dCggYHVwRXZlbnQgJHtwb2ludGVyLnRvU3RyaW5nKCl9IGNoYW5nZWQ6JHtwb2ludENoYW5nZWR9YCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIC8vIFdlJ2xsIHVzZSB0aGlzIHRyYWlsIGZvciB0aGUgZW50aXJlIGRpc3BhdGNoIG9mIHRoaXMgZXZlbnQuXHJcbiAgICBjb25zdCBldmVudFRyYWlsID0gdGhpcy5icmFuY2hDaGFuZ2VFdmVudHM8RE9NRXZlbnQ+KCBwb2ludGVyLCBjb250ZXh0LCBwb2ludENoYW5nZWQgKTtcclxuXHJcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQ8RE9NRXZlbnQ+KCBldmVudFRyYWlsLCAndXAnLCBwb2ludGVyLCBjb250ZXh0LCB0cnVlICk7XHJcblxyXG4gICAgLy8gdG91Y2ggcG9pbnRlcnMgYXJlIHRyYW5zaWVudCwgc28gZmlyZSBleGl0L291dCB0byB0aGUgdHJhaWwgYWZ0ZXJ3YXJkc1xyXG4gICAgaWYgKCBwb2ludGVyLmlzVG91Y2hMaWtlKCkgKSB7XHJcbiAgICAgIHRoaXMuZXhpdEV2ZW50czxET01FdmVudD4oIHBvaW50ZXIsIGNvbnRleHQsIGV2ZW50VHJhaWwsIDAsIHRydWUgKTtcclxuICAgIH1cclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCBmb3IgZWFjaCBsb2dpY2FsIFwiZG93blwiIGV2ZW50LCBmb3IgYW55IHBvaW50ZXIgdHlwZS5cclxuICAgKi9cclxuICBwcml2YXRlIGRvd25FdmVudDxET01FdmVudCBleHRlbmRzIEV2ZW50PiggcG9pbnRlcjogUG9pbnRlciwgY29udGV4dDogRXZlbnRDb250ZXh0PERPTUV2ZW50PiwgcG9pbnQ6IFZlY3RvcjIgKTogdm9pZCB7XHJcbiAgICAvLyBpZiB0aGUgZXZlbnQgdGFyZ2V0IGlzIHdpdGhpbiB0aGUgUERPTSB0aGUgQVQgaXMgc2VuZGluZyBhIGZha2UgcG9pbnRlciBldmVudCB0byB0aGUgZG9jdW1lbnQgLSBkbyBub3RcclxuICAgIC8vIGRpc3BhdGNoIHRoaXMgc2luY2UgdGhlIFBET00gc2hvdWxkIG9ubHkgaGFuZGxlIElucHV0LlBET01fRVZFTlRfVFlQRVMsIGFuZCBhbGwgb3RoZXIgcG9pbnRlciBpbnB1dCBzaG91bGRcclxuICAgIC8vIGdvIHRocm91Z2ggdGhlIERpc3BsYXkgZGl2LiBPdGhlcndpc2UsIGFjdGl2YXRpb24gd2lsbCBiZSBkdXBsaWNhdGVkIHdoZW4gd2UgaGFuZGxlIHBvaW50ZXIgYW5kIFBET00gZXZlbnRzXHJcbiAgICBpZiAoIHRoaXMuZGlzcGxheS5pc0VsZW1lbnRVbmRlclBET00oIGNvbnRleHQuZG9tRXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50LCB0cnVlICkgKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwb2ludENoYW5nZWQgPSBwb2ludGVyLnVwZGF0ZVBvaW50KCBwb2ludCApO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLklucHV0KCBgZG93bkV2ZW50ICR7cG9pbnRlci50b1N0cmluZygpfSBjaGFuZ2VkOiR7cG9pbnRDaGFuZ2VkfWAgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICAvLyBXZSdsbCB1c2UgdGhpcyB0cmFpbCBmb3IgdGhlIGVudGlyZSBkaXNwYXRjaCBvZiB0aGlzIGV2ZW50LlxyXG4gICAgY29uc3QgZXZlbnRUcmFpbCA9IHRoaXMuYnJhbmNoQ2hhbmdlRXZlbnRzPERPTUV2ZW50PiggcG9pbnRlciwgY29udGV4dCwgcG9pbnRDaGFuZ2VkICk7XHJcblxyXG4gICAgcG9pbnRlci5kb3duKCBjb250ZXh0LmRvbUV2ZW50ICk7XHJcblxyXG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50PERPTUV2ZW50PiggZXZlbnRUcmFpbCwgJ2Rvd24nLCBwb2ludGVyLCBjb250ZXh0LCB0cnVlICk7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgZm9yIGVhY2ggbG9naWNhbCBcIm1vdmVcIiBldmVudCwgZm9yIGFueSBwb2ludGVyIHR5cGUuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBtb3ZlRXZlbnQ8RE9NRXZlbnQgZXh0ZW5kcyBFdmVudD4oIHBvaW50ZXI6IFBvaW50ZXIsIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxET01FdmVudD4gKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5JbnB1dCggYG1vdmVFdmVudCAke3BvaW50ZXIudG9TdHJpbmcoKX1gICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgLy8gQWx3YXlzIHRyZWF0IG1vdmUgZXZlbnRzIGFzIFwicG9pbnQgY2hhbmdlZFwiXHJcbiAgICB0aGlzLmJyYW5jaENoYW5nZUV2ZW50czxET01FdmVudD4oIHBvaW50ZXIsIGNvbnRleHQsIHRydWUgKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCBmb3IgZWFjaCBsb2dpY2FsIFwiY2FuY2VsXCIgZXZlbnQsIGZvciBhbnkgcG9pbnRlciB0eXBlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgY2FuY2VsRXZlbnQ8RE9NRXZlbnQgZXh0ZW5kcyBFdmVudD4oIHBvaW50ZXI6IFBvaW50ZXIsIGNvbnRleHQ6IEV2ZW50Q29udGV4dDxET01FdmVudD4sIHBvaW50OiBWZWN0b3IyICk6IHZvaWQge1xyXG4gICAgY29uc3QgcG9pbnRDaGFuZ2VkID0gcG9pbnRlci5jYW5jZWwoIHBvaW50ICk7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0ICYmIHNjZW5lcnlMb2cuSW5wdXQoIGBjYW5jZWxFdmVudCAke3BvaW50ZXIudG9TdHJpbmcoKX0gY2hhbmdlZDoke3BvaW50Q2hhbmdlZH1gICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgLy8gV2UnbGwgdXNlIHRoaXMgdHJhaWwgZm9yIHRoZSBlbnRpcmUgZGlzcGF0Y2ggb2YgdGhpcyBldmVudC5cclxuICAgIGNvbnN0IGV2ZW50VHJhaWwgPSB0aGlzLmJyYW5jaENoYW5nZUV2ZW50czxET01FdmVudD4oIHBvaW50ZXIsIGNvbnRleHQsIHBvaW50Q2hhbmdlZCApO1xyXG5cclxuICAgIHRoaXMuZGlzcGF0Y2hFdmVudDxET01FdmVudD4oIGV2ZW50VHJhaWwsICdjYW5jZWwnLCBwb2ludGVyLCBjb250ZXh0LCB0cnVlICk7XHJcblxyXG4gICAgLy8gdG91Y2ggcG9pbnRlcnMgYXJlIHRyYW5zaWVudCwgc28gZmlyZSBleGl0L291dCB0byB0aGUgdHJhaWwgYWZ0ZXJ3YXJkc1xyXG4gICAgaWYgKCBwb2ludGVyLmlzVG91Y2hMaWtlKCkgKSB7XHJcbiAgICAgIHRoaXMuZXhpdEV2ZW50czxET01FdmVudD4oIHBvaW50ZXIsIGNvbnRleHQsIGV2ZW50VHJhaWwsIDAsIHRydWUgKTtcclxuICAgIH1cclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXQgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERpc3BhdGNoZXMgYW55IG5lY2Vzc2FyeSBldmVudHMgdGhhdCB3b3VsZCByZXN1bHQgZnJvbSB0aGUgcG9pbnRlcidzIHRyYWlsIGNoYW5naW5nLlxyXG4gICAqXHJcbiAgICogVGhpcyB3aWxsIHNlbmQgdGhlIG5lY2Vzc2FyeSBleGl0L2VudGVyIGV2ZW50cyAob24gc3VidHJhaWxzIHRoYXQgaGF2ZSBkaXZlcmdlZCBiZXR3ZWVuIGJlZm9yZS9hZnRlciksIHRoZVxyXG4gICAqIG91dC9vdmVyIGV2ZW50cywgYW5kIGlmIGZsYWdnZWQgYSBtb3ZlIGV2ZW50LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHBvaW50ZXJcclxuICAgKiBAcGFyYW0gY29udGV4dFxyXG4gICAqIEBwYXJhbSBzZW5kTW92ZSAtIFdoZXRoZXIgdG8gc2VuZCBtb3ZlIGV2ZW50c1xyXG4gICAqIEByZXR1cm5zIC0gVGhlIGN1cnJlbnQgdHJhaWwgb2YgdGhlIHBvaW50ZXJcclxuICAgKi9cclxuICBwcml2YXRlIGJyYW5jaENoYW5nZUV2ZW50czxET01FdmVudCBleHRlbmRzIEV2ZW50PiggcG9pbnRlcjogUG9pbnRlciwgY29udGV4dDogRXZlbnRDb250ZXh0PERPTUV2ZW50Piwgc2VuZE1vdmU6IGJvb2xlYW4gKTogVHJhaWwge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0RXZlbnQgJiYgc2NlbmVyeUxvZy5JbnB1dEV2ZW50KFxyXG4gICAgICBgYnJhbmNoQ2hhbmdlRXZlbnRzOiAke3BvaW50ZXIudG9TdHJpbmcoKX0gc2VuZE1vdmU6JHtzZW5kTW92ZX1gICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRFdmVudCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICBjb25zdCB0cmFpbCA9IHRoaXMuZ2V0UG9pbnRlclRyYWlsKCBwb2ludGVyICk7XHJcblxyXG4gICAgY29uc3QgaW5wdXRFbmFibGVkVHJhaWwgPSB0cmFpbC5zbGljZSggMCwgTWF0aC5taW4oIHRyYWlsLm5vZGVzLmxlbmd0aCwgdHJhaWwuZ2V0TGFzdElucHV0RW5hYmxlZEluZGV4KCkgKyAxICkgKTtcclxuICAgIGNvbnN0IG9sZElucHV0RW5hYmxlZFRyYWlsID0gcG9pbnRlci5pbnB1dEVuYWJsZWRUcmFpbCB8fCBuZXcgVHJhaWwoIHRoaXMucm9vdE5vZGUgKTtcclxuICAgIGNvbnN0IGJyYW5jaElucHV0RW5hYmxlZEluZGV4ID0gVHJhaWwuYnJhbmNoSW5kZXgoIGlucHV0RW5hYmxlZFRyYWlsLCBvbGRJbnB1dEVuYWJsZWRUcmFpbCApO1xyXG4gICAgY29uc3QgbGFzdElucHV0RW5hYmxlZE5vZGVDaGFuZ2VkID0gb2xkSW5wdXRFbmFibGVkVHJhaWwubGFzdE5vZGUoKSAhPT0gaW5wdXRFbmFibGVkVHJhaWwubGFzdE5vZGUoKTtcclxuXHJcbiAgICBpZiAoIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dEV2ZW50ICkge1xyXG4gICAgICBjb25zdCBvbGRUcmFpbCA9IHBvaW50ZXIudHJhaWwgfHwgbmV3IFRyYWlsKCB0aGlzLnJvb3ROb2RlICk7XHJcbiAgICAgIGNvbnN0IGJyYW5jaEluZGV4ID0gVHJhaWwuYnJhbmNoSW5kZXgoIHRyYWlsLCBvbGRUcmFpbCApO1xyXG5cclxuICAgICAgKCBicmFuY2hJbmRleCAhPT0gdHJhaWwubGVuZ3RoIHx8IGJyYW5jaEluZGV4ICE9PSBvbGRUcmFpbC5sZW5ndGggKSAmJiBzY2VuZXJ5TG9nLklucHV0RXZlbnQoXHJcbiAgICAgICAgYGNoYW5nZWQgZnJvbSAke29sZFRyYWlsLnRvU3RyaW5nKCl9IHRvICR7dHJhaWwudG9TdHJpbmcoKX1gICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZXZlbnQgb3JkZXIgbWF0Y2hlcyBodHRwOi8vd3d3LnczLm9yZy9UUi9ET00tTGV2ZWwtMy1FdmVudHMvI2V2ZW50cy1tb3VzZWV2ZW50LWV2ZW50LW9yZGVyXHJcbiAgICBpZiAoIHNlbmRNb3ZlICkge1xyXG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQ8RE9NRXZlbnQ+KCB0cmFpbCwgJ21vdmUnLCBwb2ludGVyLCBjb250ZXh0LCB0cnVlICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gV2Ugd2FudCB0byBhcHByb3hpbWF0ZWx5IG1pbWljIGh0dHA6Ly93d3cudzMub3JnL1RSL0RPTS1MZXZlbC0zLUV2ZW50cy8jZXZlbnRzLW1vdXNlZXZlbnQtZXZlbnQtb3JkZXJcclxuICAgIHRoaXMuZXhpdEV2ZW50czxET01FdmVudD4oIHBvaW50ZXIsIGNvbnRleHQsIG9sZElucHV0RW5hYmxlZFRyYWlsLCBicmFuY2hJbnB1dEVuYWJsZWRJbmRleCwgbGFzdElucHV0RW5hYmxlZE5vZGVDaGFuZ2VkICk7XHJcbiAgICB0aGlzLmVudGVyRXZlbnRzPERPTUV2ZW50PiggcG9pbnRlciwgY29udGV4dCwgaW5wdXRFbmFibGVkVHJhaWwsIGJyYW5jaElucHV0RW5hYmxlZEluZGV4LCBsYXN0SW5wdXRFbmFibGVkTm9kZUNoYW5nZWQgKTtcclxuXHJcbiAgICBwb2ludGVyLnRyYWlsID0gdHJhaWw7XHJcbiAgICBwb2ludGVyLmlucHV0RW5hYmxlZFRyYWlsID0gaW5wdXRFbmFibGVkVHJhaWw7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0RXZlbnQgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICAgIHJldHVybiB0cmFpbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyaWdnZXJzICdlbnRlcicgZXZlbnRzIGFsb25nIGEgdHJhaWwgY2hhbmdlLCBhbmQgYW4gJ292ZXInIGV2ZW50IG9uIHRoZSBsZWFmLlxyXG4gICAqXHJcbiAgICogRm9yIGV4YW1wbGUsIGlmIHdlIGNoYW5nZSBmcm9tIGEgdHJhaWwgWyBhLCBiLCBjLCBkLCBlIF0gPT4gWyBhLCBiLCB4LCB5IF0sIGl0IHdpbGwgZmlyZTpcclxuICAgKlxyXG4gICAqIC0gZW50ZXIgeFxyXG4gICAqIC0gZW50ZXIgeVxyXG4gICAqIC0gb3ZlciB5IChidWJibGVzKVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHBvaW50ZXJcclxuICAgKiBAcGFyYW0gZXZlbnRcclxuICAgKiBAcGFyYW0gdHJhaWwgLSBUaGUgXCJuZXdcIiB0cmFpbFxyXG4gICAqIEBwYXJhbSBicmFuY2hJbmRleCAtIFRoZSBmaXJzdCBpbmRleCB3aGVyZSB0aGUgb2xkIGFuZCBuZXcgdHJhaWxzIGhhdmUgYSBkaWZmZXJlbnQgbm9kZS4gV2Ugd2lsbCBub3RpZnlcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgdGhpcyBub2RlIGFuZCBhbGwgXCJkZXNjZW5kYW50XCIgbm9kZXMgaW4gdGhlIHJlbGV2YW50IHRyYWlsLlxyXG4gICAqIEBwYXJhbSBsYXN0Tm9kZUNoYW5nZWQgLSBJZiB0aGUgbGFzdCBub2RlIGRpZG4ndCBjaGFuZ2UsIHdlIHdvbid0IHNlbnQgYW4gb3ZlciBldmVudC5cclxuICAgKi9cclxuICBwcml2YXRlIGVudGVyRXZlbnRzPERPTUV2ZW50IGV4dGVuZHMgRXZlbnQ+KCBwb2ludGVyOiBQb2ludGVyLCBjb250ZXh0OiBFdmVudENvbnRleHQ8RE9NRXZlbnQ+LCB0cmFpbDogVHJhaWwsIGJyYW5jaEluZGV4OiBudW1iZXIsIGxhc3ROb2RlQ2hhbmdlZDogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIGlmICggbGFzdE5vZGVDaGFuZ2VkICkge1xyXG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQ8RE9NRXZlbnQ+KCB0cmFpbCwgJ292ZXInLCBwb2ludGVyLCBjb250ZXh0LCB0cnVlLCB0cnVlICk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSBicmFuY2hJbmRleDsgaSA8IHRyYWlsLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQ8RE9NRXZlbnQ+KCB0cmFpbC5zbGljZSggMCwgaSArIDEgKSwgJ2VudGVyJywgcG9pbnRlciwgY29udGV4dCwgZmFsc2UgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyaWdnZXJzICdleGl0JyBldmVudHMgYWxvbmcgYSB0cmFpbCBjaGFuZ2UsIGFuZCBhbiAnb3V0JyBldmVudCBvbiB0aGUgbGVhZi5cclxuICAgKlxyXG4gICAqIEZvciBleGFtcGxlLCBpZiB3ZSBjaGFuZ2UgZnJvbSBhIHRyYWlsIFsgYSwgYiwgYywgZCwgZSBdID0+IFsgYSwgYiwgeCwgeSBdLCBpdCB3aWxsIGZpcmU6XHJcbiAgICpcclxuICAgKiAtIG91dCBlIChidWJibGVzKVxyXG4gICAqIC0gZXhpdCBjXHJcbiAgICogLSBleGl0IGRcclxuICAgKiAtIGV4aXQgZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHBvaW50ZXJcclxuICAgKiBAcGFyYW0gZXZlbnRcclxuICAgKiBAcGFyYW0gdHJhaWwgLSBUaGUgXCJvbGRcIiB0cmFpbFxyXG4gICAqIEBwYXJhbSBicmFuY2hJbmRleCAtIFRoZSBmaXJzdCBpbmRleCB3aGVyZSB0aGUgb2xkIGFuZCBuZXcgdHJhaWxzIGhhdmUgYSBkaWZmZXJlbnQgbm9kZS4gV2Ugd2lsbCBub3RpZnlcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgdGhpcyBub2RlIGFuZCBhbGwgXCJkZXNjZW5kYW50XCIgbm9kZXMgaW4gdGhlIHJlbGV2YW50IHRyYWlsLlxyXG4gICAqIEBwYXJhbSBsYXN0Tm9kZUNoYW5nZWQgLSBJZiB0aGUgbGFzdCBub2RlIGRpZG4ndCBjaGFuZ2UsIHdlIHdvbid0IHNlbnQgYW4gb3V0IGV2ZW50LlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZXhpdEV2ZW50czxET01FdmVudCBleHRlbmRzIEV2ZW50PiggcG9pbnRlcjogUG9pbnRlciwgY29udGV4dDogRXZlbnRDb250ZXh0PERPTUV2ZW50PiwgdHJhaWw6IFRyYWlsLCBicmFuY2hJbmRleDogbnVtYmVyLCBsYXN0Tm9kZUNoYW5nZWQ6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICBmb3IgKCBsZXQgaSA9IHRyYWlsLmxlbmd0aCAtIDE7IGkgPj0gYnJhbmNoSW5kZXg7IGktLSApIHtcclxuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50PERPTUV2ZW50PiggdHJhaWwuc2xpY2UoIDAsIGkgKyAxICksICdleGl0JywgcG9pbnRlciwgY29udGV4dCwgZmFsc2UsIHRydWUgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIGxhc3ROb2RlQ2hhbmdlZCApIHtcclxuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50PERPTUV2ZW50PiggdHJhaWwsICdvdXQnLCBwb2ludGVyLCBjb250ZXh0LCB0cnVlICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEaXNwYXRjaCB0byBhbGwgbm9kZXMgaW4gdGhlIFRyYWlsLCBvcHRpb25hbGx5IGJ1YmJsaW5nIGRvd24gZnJvbSB0aGUgbGVhZiB0byB0aGUgcm9vdC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB0cmFpbFxyXG4gICAqIEBwYXJhbSB0eXBlXHJcbiAgICogQHBhcmFtIHBvaW50ZXJcclxuICAgKiBAcGFyYW0gY29udGV4dFxyXG4gICAqIEBwYXJhbSBidWJibGVzIC0gSWYgYnViYmxlcyBpcyBmYWxzZSwgdGhlIGV2ZW50IGlzIG9ubHkgZGlzcGF0Y2hlZCB0byB0aGUgbGVhZiBub2RlIG9mIHRoZSB0cmFpbC5cclxuICAgKiBAcGFyYW0gZmlyZU9uSW5wdXREaXNhYmxlZCAtIFdoZXRoZXIgdG8gZmlyZSB0aGlzIGV2ZW50IGV2ZW4gaWYgbm9kZXMgaGF2ZSBpbnB1dEVuYWJsZWQ6ZmFsc2VcclxuICAgKi9cclxuICBwcml2YXRlIGRpc3BhdGNoRXZlbnQ8RE9NRXZlbnQgZXh0ZW5kcyBFdmVudD4oIHRyYWlsOiBUcmFpbCwgdHlwZTogU3VwcG9ydGVkRXZlbnRUeXBlcywgcG9pbnRlcjogUG9pbnRlciwgY29udGV4dDogRXZlbnRDb250ZXh0PERPTUV2ZW50PiwgYnViYmxlczogYm9vbGVhbiwgZmlyZU9uSW5wdXREaXNhYmxlZCA9IGZhbHNlICk6IHZvaWQge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkV2ZW50RGlzcGF0Y2ggJiYgc2NlbmVyeUxvZy5FdmVudERpc3BhdGNoKFxyXG4gICAgICBgJHt0eXBlfSB0cmFpbDoke3RyYWlsLnRvU3RyaW5nKCl9IHBvaW50ZXI6JHtwb2ludGVyLnRvU3RyaW5nKCl9IGF0ICR7cG9pbnRlci5wb2ludCA/IHBvaW50ZXIucG9pbnQudG9TdHJpbmcoKSA6ICdudWxsJ31gICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuRXZlbnREaXNwYXRjaCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0cmFpbCwgJ0ZhbHN5IHRyYWlsIGZvciBkaXNwYXRjaEV2ZW50JyApO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5FdmVudFBhdGggJiYgc2NlbmVyeUxvZy5FdmVudFBhdGgoIGAke3R5cGV9ICR7dHJhaWwudG9QYXRoU3RyaW5nKCl9YCApO1xyXG5cclxuICAgIC8vIE5PVEU6IGV2ZW50IGlzIG5vdCBpbW11dGFibGUsIGFzIGl0cyBjdXJyZW50VGFyZ2V0IGNoYW5nZXNcclxuICAgIGNvbnN0IGlucHV0RXZlbnQgPSBuZXcgU2NlbmVyeUV2ZW50PERPTUV2ZW50PiggdHJhaWwsIHR5cGUsIHBvaW50ZXIsIGNvbnRleHQgKTtcclxuXHJcbiAgICB0aGlzLmN1cnJlbnRTY2VuZXJ5RXZlbnQgPSBpbnB1dEV2ZW50O1xyXG5cclxuICAgIC8vIGZpcnN0IHJ1biB0aHJvdWdoIHRoZSBwb2ludGVyJ3MgbGlzdGVuZXJzIHRvIHNlZSBpZiBvbmUgb2YgdGhlbSB3aWxsIGhhbmRsZSB0aGUgZXZlbnRcclxuICAgIHRoaXMuZGlzcGF0Y2hUb0xpc3RlbmVyczxET01FdmVudD4oIHBvaW50ZXIsIHBvaW50ZXIuZ2V0TGlzdGVuZXJzKCksIHR5cGUsIGlucHV0RXZlbnQgKTtcclxuXHJcbiAgICAvLyBpZiBub3QgeWV0IGhhbmRsZWQsIHJ1biB0aHJvdWdoIHRoZSB0cmFpbCBpbiBvcmRlciB0byBzZWUgaWYgb25lIG9mIHRoZW0gd2lsbCBoYW5kbGUgdGhlIGV2ZW50XHJcbiAgICAvLyBhdCB0aGUgYmFzZSBvZiB0aGUgdHJhaWwgc2hvdWxkIGJlIHRoZSBzY2VuZSBub2RlLCBzbyB0aGUgc2NlbmUgd2lsbCBiZSBub3RpZmllZCBsYXN0XHJcbiAgICB0aGlzLmRpc3BhdGNoVG9UYXJnZXRzPERPTUV2ZW50PiggdHJhaWwsIHR5cGUsIHBvaW50ZXIsIGlucHV0RXZlbnQsIGJ1YmJsZXMsIGZpcmVPbklucHV0RGlzYWJsZWQgKTtcclxuXHJcbiAgICAvLyBOb3RpZnkgaW5wdXQgbGlzdGVuZXJzIG9uIHRoZSBEaXNwbGF5XHJcbiAgICB0aGlzLmRpc3BhdGNoVG9MaXN0ZW5lcnM8RE9NRXZlbnQ+KCBwb2ludGVyLCB0aGlzLmRpc3BsYXkuZ2V0SW5wdXRMaXN0ZW5lcnMoKSwgdHlwZSwgaW5wdXRFdmVudCApO1xyXG5cclxuICAgIC8vIE5vdGlmeSBpbnB1dCBsaXN0ZW5lcnMgdG8gYW55IERpc3BsYXlcclxuICAgIGlmICggRGlzcGxheS5pbnB1dExpc3RlbmVycy5sZW5ndGggKSB7XHJcbiAgICAgIHRoaXMuZGlzcGF0Y2hUb0xpc3RlbmVyczxET01FdmVudD4oIHBvaW50ZXIsIERpc3BsYXkuaW5wdXRMaXN0ZW5lcnMuc2xpY2UoKSwgdHlwZSwgaW5wdXRFdmVudCApO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY3VycmVudFNjZW5lcnlFdmVudCA9IG51bGw7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkV2ZW50RGlzcGF0Y2ggJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE5vdGlmaWVzIGFuIGFycmF5IG9mIGxpc3RlbmVycyB3aXRoIGEgc3BlY2lmaWMgZXZlbnQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcG9pbnRlclxyXG4gICAqIEBwYXJhbSBsaXN0ZW5lcnMgLSBTaG91bGQgYmUgYSBkZWZlbnNpdmUgYXJyYXkgY29weSBhbHJlYWR5LlxyXG4gICAqIEBwYXJhbSB0eXBlXHJcbiAgICogQHBhcmFtIGlucHV0RXZlbnRcclxuICAgKi9cclxuICBwcml2YXRlIGRpc3BhdGNoVG9MaXN0ZW5lcnM8RE9NRXZlbnQgZXh0ZW5kcyBFdmVudD4oIHBvaW50ZXI6IFBvaW50ZXIsIGxpc3RlbmVyczogVElucHV0TGlzdGVuZXJbXSwgdHlwZTogU3VwcG9ydGVkRXZlbnRUeXBlcywgaW5wdXRFdmVudDogU2NlbmVyeUV2ZW50PERPTUV2ZW50PiApOiB2b2lkIHtcclxuXHJcbiAgICBpZiAoIGlucHV0RXZlbnQuaGFuZGxlZCApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHNwZWNpZmljVHlwZSA9IHBvaW50ZXIudHlwZSArIHR5cGUgYXMgU3VwcG9ydGVkRXZlbnRUeXBlczsgLy8gZS5nLiBtb3VzZXVwLCB0b3VjaHVwXHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBsaXN0ZW5lciA9IGxpc3RlbmVyc1sgaSBdO1xyXG5cclxuICAgICAgaWYgKCAhaW5wdXRFdmVudC5hYm9ydGVkICYmIGxpc3RlbmVyWyBzcGVjaWZpY1R5cGUgYXMga2V5b2YgVElucHV0TGlzdGVuZXIgXSApIHtcclxuICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuRXZlbnREaXNwYXRjaCAmJiBzY2VuZXJ5TG9nLkV2ZW50RGlzcGF0Y2goIHNwZWNpZmljVHlwZSApO1xyXG4gICAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5FdmVudERpc3BhdGNoICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgICAgICAoIGxpc3RlbmVyWyBzcGVjaWZpY1R5cGUgYXMga2V5b2YgVElucHV0TGlzdGVuZXIgXSBhcyBTY2VuZXJ5TGlzdGVuZXJGdW5jdGlvbjxET01FdmVudD4gKSggaW5wdXRFdmVudCApO1xyXG5cclxuICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuRXZlbnREaXNwYXRjaCAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoICFpbnB1dEV2ZW50LmFib3J0ZWQgJiYgbGlzdGVuZXJbIHR5cGUgYXMga2V5b2YgVElucHV0TGlzdGVuZXIgXSApIHtcclxuICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuRXZlbnREaXNwYXRjaCAmJiBzY2VuZXJ5TG9nLkV2ZW50RGlzcGF0Y2goIHR5cGUgKTtcclxuICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuRXZlbnREaXNwYXRjaCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICAgICAgKCBsaXN0ZW5lclsgdHlwZSBhcyBrZXlvZiBUSW5wdXRMaXN0ZW5lciBdIGFzIFNjZW5lcnlMaXN0ZW5lckZ1bmN0aW9uPERPTUV2ZW50PiApKCBpbnB1dEV2ZW50ICk7XHJcblxyXG4gICAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5FdmVudERpc3BhdGNoICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERpc3BhdGNoIHRvIGFsbCBub2RlcyBpbiB0aGUgVHJhaWwsIG9wdGlvbmFsbHkgYnViYmxpbmcgZG93biBmcm9tIHRoZSBsZWFmIHRvIHRoZSByb290LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHRyYWlsXHJcbiAgICogQHBhcmFtIHR5cGVcclxuICAgKiBAcGFyYW0gcG9pbnRlclxyXG4gICAqIEBwYXJhbSBpbnB1dEV2ZW50XHJcbiAgICogQHBhcmFtIGJ1YmJsZXMgLSBJZiBidWJibGVzIGlzIGZhbHNlLCB0aGUgZXZlbnQgaXMgb25seSBkaXNwYXRjaGVkIHRvIHRoZSBsZWFmIG5vZGUgb2YgdGhlIHRyYWlsLlxyXG4gICAqIEBwYXJhbSBbZmlyZU9uSW5wdXREaXNhYmxlZF1cclxuICAgKi9cclxuICBwcml2YXRlIGRpc3BhdGNoVG9UYXJnZXRzPERPTUV2ZW50IGV4dGVuZHMgRXZlbnQ+KCB0cmFpbDogVHJhaWwsIHR5cGU6IFN1cHBvcnRlZEV2ZW50VHlwZXMsIHBvaW50ZXI6IFBvaW50ZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRFdmVudDogU2NlbmVyeUV2ZW50PERPTUV2ZW50PiwgYnViYmxlczogYm9vbGVhbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaXJlT25JbnB1dERpc2FibGVkID0gZmFsc2UgKTogdm9pZCB7XHJcblxyXG4gICAgaWYgKCBpbnB1dEV2ZW50LmFib3J0ZWQgfHwgaW5wdXRFdmVudC5oYW5kbGVkICkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgaW5wdXRFbmFibGVkSW5kZXggPSB0cmFpbC5nZXRMYXN0SW5wdXRFbmFibGVkSW5kZXgoKTtcclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IHRyYWlsLm5vZGVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgYnViYmxlcyA/IGktLSA6IGkgPSAtMSApIHtcclxuXHJcbiAgICAgIGNvbnN0IHRhcmdldCA9IHRyYWlsLm5vZGVzWyBpIF07XHJcblxyXG4gICAgICBjb25zdCB0cmFpbElucHV0RGlzYWJsZWQgPSBpbnB1dEVuYWJsZWRJbmRleCA8IGk7XHJcblxyXG4gICAgICBpZiAoIHRhcmdldC5pc0Rpc3Bvc2VkIHx8ICggIWZpcmVPbklucHV0RGlzYWJsZWQgJiYgdHJhaWxJbnB1dERpc2FibGVkICkgKSB7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlucHV0RXZlbnQuY3VycmVudFRhcmdldCA9IHRhcmdldDtcclxuXHJcbiAgICAgIHRoaXMuZGlzcGF0Y2hUb0xpc3RlbmVyczxET01FdmVudD4oIHBvaW50ZXIsIHRhcmdldC5nZXRJbnB1dExpc3RlbmVycygpLCB0eXBlLCBpbnB1dEV2ZW50ICk7XHJcblxyXG4gICAgICAvLyBpZiB0aGUgaW5wdXQgZXZlbnQgd2FzIGFib3J0ZWQgb3IgaGFuZGxlZCwgZG9uJ3QgZm9sbG93IHRoZSB0cmFpbCBkb3duIGFub3RoZXIgbGV2ZWxcclxuICAgICAgaWYgKCBpbnB1dEV2ZW50LmFib3J0ZWQgfHwgaW5wdXRFdmVudC5oYW5kbGVkICkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2F2ZXMgdGhlIG1haW4gaW5mb3JtYXRpb24gd2UgY2FyZSBhYm91dCBmcm9tIGEgRE9NIGBFdmVudGAgaW50byBhIEpTT04tbGlrZSBzdHJ1Y3R1cmUuIFRvIHN1cHBvcnRcclxuICAgKiBwb2x5bW9ycGhpc20sIGFsbCBzdXBwb3J0ZWQgRE9NIGV2ZW50IGtleXMgdGhhdCBzY2VuZXJ5IHVzZXMgd2lsbCBhbHdheXMgYmUgaW5jbHVkZWQgaW4gdGhpcyBzZXJpYWxpemF0aW9uLiBJZlxyXG4gICAqIHRoZSBwYXJ0aWN1bGFyIEV2ZW50IGludGVyZmFjZSBmb3IgdGhlIGluc3RhbmNlIGJlaW5nIHNlcmlhbGl6ZWQgZG9lc24ndCBoYXZlIGEgY2VydGFpbiBwcm9wZXJ0eSwgdGhlbiBpdCB3aWxsIGJlXHJcbiAgICogc2V0IGFzIGBudWxsYC4gU2VlIGRvbUV2ZW50UHJvcGVydGllc1RvU2VyaWFsaXplIGZvciB0aGUgZnVsbCBsaXN0IG9mIHN1cHBvcnRlZCBFdmVudCBwcm9wZXJ0aWVzLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgLSBzZWUgZG9tRXZlbnRQcm9wZXJ0aWVzVG9TZXJpYWxpemUgZm9yIGxpc3Qga2V5cyB0aGF0IGFyZSBzZXJpYWxpemVkXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBzZXJpYWxpemVEb21FdmVudCggZG9tRXZlbnQ6IEV2ZW50ICk6IFNlcmlhbGl6ZWRET01FdmVudCB7XHJcbiAgICBjb25zdCBlbnRyaWVzOiBTZXJpYWxpemVkRE9NRXZlbnQgPSB7XHJcbiAgICAgIGNvbnN0cnVjdG9yTmFtZTogZG9tRXZlbnQuY29uc3RydWN0b3IubmFtZVxyXG4gICAgfTtcclxuXHJcbiAgICBkb21FdmVudFByb3BlcnRpZXNUb1NlcmlhbGl6ZS5mb3JFYWNoKCBwcm9wZXJ0eSA9PiB7XHJcblxyXG4gICAgICBjb25zdCBkb21FdmVudFByb3BlcnR5OiBFdmVudFsga2V5b2YgRXZlbnQgXSB8IEVsZW1lbnQgPSBkb21FdmVudFsgcHJvcGVydHkgYXMga2V5b2YgRXZlbnQgXTtcclxuXHJcbiAgICAgIC8vIFdlIHNlcmlhbGl6ZSBtYW55IEV2ZW50IEFQSXMgaW50byBhIHNpbmdsZSBvYmplY3QsIHNvIGJlIGdyYWNlZnVsIGlmIHByb3BlcnRpZXMgZG9uJ3QgZXhpc3QuXHJcbiAgICAgIGlmICggZG9tRXZlbnRQcm9wZXJ0eSA9PT0gdW5kZWZpbmVkIHx8IGRvbUV2ZW50UHJvcGVydHkgPT09IG51bGwgKSB7XHJcbiAgICAgICAgZW50cmllc1sgcHJvcGVydHkgXSA9IG51bGw7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGVsc2UgaWYgKCBkb21FdmVudFByb3BlcnR5IGluc3RhbmNlb2YgRWxlbWVudCAmJiBFVkVOVF9LRVlfVkFMVUVTX0FTX0VMRU1FTlRTLmluY2x1ZGVzKCBwcm9wZXJ0eSApICYmIHR5cGVvZiBkb21FdmVudFByb3BlcnR5LmdldEF0dHJpYnV0ZSA9PT0gJ2Z1bmN0aW9uJyAmJlxyXG5cclxuICAgICAgICAgICAgICAgIC8vIElmIGZhbHNlLCB0aGVuIHRoaXMgdGFyZ2V0IGlzbid0IGEgUERPTSBlbGVtZW50LCBzbyB3ZSBjYW4gc2tpcCB0aGlzIHNlcmlhbGl6YXRpb25cclxuICAgICAgICAgICAgICAgIGRvbUV2ZW50UHJvcGVydHkuaGFzQXR0cmlidXRlKCBQRE9NVXRpbHMuREFUQV9QRE9NX1VOSVFVRV9JRCApICkge1xyXG5cclxuICAgICAgICAvLyBJZiB0aGUgdGFyZ2V0IGNhbWUgZnJvbSB0aGUgYWNjZXNzaWJpbGl0eSBQRE9NLCB0aGVuIHdlIHdhbnQgdG8gc3RvcmUgdGhlIE5vZGUgdHJhaWwgaWQgb2Ygd2hlcmUgaXQgY2FtZSBmcm9tLlxyXG4gICAgICAgIGVudHJpZXNbIHByb3BlcnR5IF0gPSB7XHJcbiAgICAgICAgICBbIFBET01VdGlscy5EQVRBX1BET01fVU5JUVVFX0lEIF06IGRvbUV2ZW50UHJvcGVydHkuZ2V0QXR0cmlidXRlKCBQRE9NVXRpbHMuREFUQV9QRE9NX1VOSVFVRV9JRCApLFxyXG5cclxuICAgICAgICAgIC8vIEhhdmUgdGhlIElEIGFsc29cclxuICAgICAgICAgIGlkOiBkb21FdmVudFByb3BlcnR5LmdldEF0dHJpYnV0ZSggJ2lkJyApXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuXHJcbiAgICAgICAgLy8gUGFyc2UgdG8gZ2V0IHJpZCBvZiBmdW5jdGlvbnMgYW5kIGNpcmN1bGFyIHJlZmVyZW5jZXMuXHJcbiAgICAgICAgZW50cmllc1sgcHJvcGVydHkgXSA9ICggKCB0eXBlb2YgZG9tRXZlbnRQcm9wZXJ0eSA9PT0gJ29iamVjdCcgKSA/IHt9IDogSlNPTi5wYXJzZSggSlNPTi5zdHJpbmdpZnkoIGRvbUV2ZW50UHJvcGVydHkgKSApICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICByZXR1cm4gZW50cmllcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZyb20gYSBzZXJpYWxpemVkIGRvbSBldmVudCwgcmV0dXJuIGEgcmVjcmVhdGVkIHdpbmRvdy5FdmVudCAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGRlc2VyaWFsaXplRG9tRXZlbnQoIGV2ZW50T2JqZWN0OiBTZXJpYWxpemVkRE9NRXZlbnQgKTogRXZlbnQge1xyXG4gICAgY29uc3QgY29uc3RydWN0b3JOYW1lID0gZXZlbnRPYmplY3QuY29uc3RydWN0b3JOYW1lIHx8ICdFdmVudCc7XHJcblxyXG4gICAgY29uc3QgY29uZmlnRm9yQ29uc3RydWN0b3IgPSBfLnBpY2soIGV2ZW50T2JqZWN0LCBkb21FdmVudFByb3BlcnRpZXNTZXRJbkNvbnN0cnVjdG9yICk7XHJcbiAgICAvLyBzZXJpYWxpemUgdGhlIHJlbGF0ZWRUYXJnZXQgYmFjayBpbnRvIGFuIGV2ZW50IE9iamVjdCwgc28gdGhhdCBpdCBjYW4gYmUgcGFzc2VkIHRvIHRoZSBpbml0IGNvbmZpZyBpbiB0aGUgRXZlbnRcclxuICAgIC8vIGNvbnN0cnVjdG9yXHJcbiAgICBpZiAoIGNvbmZpZ0ZvckNvbnN0cnVjdG9yLnJlbGF0ZWRUYXJnZXQgKSB7XHJcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgICAgY29uc3QgaHRtbEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggY29uZmlnRm9yQ29uc3RydWN0b3IucmVsYXRlZFRhcmdldC5pZCApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBodG1sRWxlbWVudCwgJ2Nhbm5vdCBkZXNlcmlhbGl6ZSBldmVudCB3aGVuIHJlbGF0ZWQgdGFyZ2V0IGlzIG5vdCBpbiB0aGUgRE9NLicgKTtcclxuICAgICAgY29uZmlnRm9yQ29uc3RydWN0b3IucmVsYXRlZFRhcmdldCA9IGh0bWxFbGVtZW50O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgIGNvbnN0IGRvbUV2ZW50OiBFdmVudCA9IG5ldyB3aW5kb3dbIGNvbnN0cnVjdG9yTmFtZSBdKCBjb25zdHJ1Y3Rvck5hbWUsIGNvbmZpZ0ZvckNvbnN0cnVjdG9yICk7XHJcblxyXG4gICAgZm9yICggY29uc3Qga2V5IGluIGV2ZW50T2JqZWN0ICkge1xyXG5cclxuICAgICAgLy8gYHR5cGVgIGlzIHJlYWRvbmx5LCBzbyBkb24ndCB0cnkgdG8gc2V0IGl0LlxyXG4gICAgICBpZiAoIGV2ZW50T2JqZWN0Lmhhc093blByb3BlcnR5KCBrZXkgKSAmJiAhKCBkb21FdmVudFByb3BlcnRpZXNTZXRJbkNvbnN0cnVjdG9yIGFzIHN0cmluZ1tdICkuaW5jbHVkZXMoIGtleSApICkge1xyXG5cclxuICAgICAgICAvLyBTcGVjaWFsIGNhc2UgZm9yIHRhcmdldCBzaW5jZSB3ZSBjYW4ndCBzZXQgdGhhdCByZWFkLW9ubHkgcHJvcGVydHkuIEluc3RlYWQgdXNlIGEgc3Vic3RpdHV0ZSBrZXkuXHJcbiAgICAgICAgaWYgKCBrZXkgPT09ICd0YXJnZXQnICkge1xyXG5cclxuICAgICAgICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBldmVudE9iamVjdC50YXJnZXQgYXMgeyBpZD86IHN0cmluZyB9IHwgdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICBpZiAoIHRhcmdldCAmJiB0YXJnZXQuaWQgKSB7XHJcbiAgICAgICAgICAgICAgYXNzZXJ0KCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggdGFyZ2V0LmlkICksICd0YXJnZXQgc2hvdWxkIGV4aXN0IGluIHRoZSBQRE9NIHRvIHN1cHBvcnQgcGxheWJhY2suJyApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICAgICAgZG9tRXZlbnRbIFRBUkdFVF9TVUJTVElUVVRFX0tFWSBdID0gXy5jbG9uZSggZXZlbnRPYmplY3RbIGtleSBdICkgfHwge307XHJcblxyXG4gICAgICAgICAgLy8gVGhpcyBtYXkgbm90IGJlIG5lZWRlZCBzaW5jZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTI5NiBpcyBjb21wbGV0ZSwgZG91YmxlIGNoZWNrIG9uIGdldFRyYWlsRnJvbVBET01FdmVudCgpIHRvb1xyXG4gICAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICAgICAgZG9tRXZlbnRbIFRBUkdFVF9TVUJTVElUVVRFX0tFWSBdLmdldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKCBrZXkgKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzWyBrZXkgXTtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgICAgICAgIGRvbUV2ZW50WyBrZXkgXSA9IGV2ZW50T2JqZWN0WyBrZXkgXTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBkb21FdmVudDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnZlbmllbmNlIGZ1bmN0aW9uIGZvciBsb2dnaW5nIG91dCBhIHBvaW50L2V2ZW50IGNvbWJpbmF0aW9uLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHBvaW50IC0gTm90IGxvZ2dlZCBpZiBudWxsXHJcbiAgICogQHBhcmFtIGRvbUV2ZW50XHJcbiAgICovXHJcbiAgcHJpdmF0ZSBzdGF0aWMgZGVidWdUZXh0KCBwb2ludDogVmVjdG9yMiB8IG51bGwsIGRvbUV2ZW50OiBFdmVudCApOiBzdHJpbmcge1xyXG4gICAgbGV0IHJlc3VsdCA9IGAke2RvbUV2ZW50LnRpbWVTdGFtcH0gJHtkb21FdmVudC50eXBlfWA7XHJcbiAgICBpZiAoIHBvaW50ICE9PSBudWxsICkge1xyXG4gICAgICByZXN1bHQgPSBgJHtwb2ludC54fSwke3BvaW50Lnl9ICR7cmVzdWx0fWA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFwcyB0aGUgY3VycmVudCBNUyBwb2ludGVyIHR5cGVzIG9udG8gdGhlIHBvaW50ZXIgc3BlYy4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBtc1BvaW50ZXJUeXBlKCBldmVudDogUG9pbnRlckV2ZW50ICk6IHN0cmluZyB7XHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0tIGxlZ2FjeSBBUElcclxuICAgIGlmICggZXZlbnQucG9pbnRlclR5cGUgPT09IHdpbmRvdy5NU1BvaW50ZXJFdmVudC5NU1BPSU5URVJfVFlQRV9UT1VDSCApIHtcclxuICAgICAgcmV0dXJuICd0b3VjaCc7XHJcbiAgICB9XHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0tIGxlZ2FjeSBBUElcclxuICAgIGVsc2UgaWYgKCBldmVudC5wb2ludGVyVHlwZSA9PT0gd2luZG93Lk1TUG9pbnRlckV2ZW50Lk1TUE9JTlRFUl9UWVBFX1BFTiApIHtcclxuICAgICAgcmV0dXJuICdwZW4nO1xyXG4gICAgfVxyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciAtLSBsZWdhY3kgQVBJXHJcbiAgICBlbHNlIGlmICggZXZlbnQucG9pbnRlclR5cGUgPT09IHdpbmRvdy5NU1BvaW50ZXJFdmVudC5NU1BPSU5URVJfVFlQRV9NT1VTRSApIHtcclxuICAgICAgcmV0dXJuICdtb3VzZSc7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIGV2ZW50LnBvaW50ZXJUeXBlOyAvLyBob3BlIGZvciB0aGUgYmVzdFxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ0lucHV0JywgSW5wdXQgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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