// Copyright 2018-2024, University of Colorado Boulder

/**
 * The main interaction for grabbing and dragging an object through the PDOM and assistive technology. It works by
 * taking in a Node to augment with the PDOM interaction. In fact it works much like a mixin. In general, this type
 * will mutate the accessible content (PDOM) of the passed in Node (sometimes referred to "wrappedNode"), toggling
 * between a "grabbable" state and a "draggable" state. When each state changes, the underlying PDOM element and general
 * interaction does as well.
 *
 * To accomplish this there are options to be filled in that keep track of the scenery inputListeners for each state,
 * as well as options to mutate the Node for each state. By default the grabbable is a `button` with a containing  `div`,
 * and the draggable is a focusable `div` with an "application" aria role. It is up to the client to supply a
 * KeyboardDragListener as an arg that will be added to the Node in the "draggable" state.
 *
 * As a note on terminology, mostly things are referred to by their current "interaction state" which is either grabbable
 * or draggable.
 *
 * This type will alert when the draggable is released, but no default alert is provided when the object is grabbed.
 * This is because in usages so far, that alert has been custom, context specific, and easier to just supply through
 * the onGrab callback option.
 *
 * NOTE: You SHOULD NOT add listeners directly to the Node where it is constructed, instead see
 * `options.listenersForGrab/DragState`. These will keep track of the listeners for each interaction state, and
 * will set them accordingly. In rare cases it may be desirable to have a listener attached no matter the state, but that
 * has not come up so far.
 *
 * NOTE: There is no "undo" for a mutate call, so it is the client's job to make sure that grabbable/draggableOptions objects
 * appropriately "cancel" out the other. The same goes for any alterations that are done on `onGrab` and `onRelease`
 * callbacks.
 *
 * NOTE: problems may occur if you change the focusHighlight or interactiveHighlight of the Node passed in after
 * creating this type.
 *
 * NOTE: focusHighlightLayerable and interactiveHighlightLayerable is finicky with this type. In order to support
 * it, you must have set the focusHighlight or interactiveHighlight to the wrappedNode and added the focusHighlight
 * to the scene graph before calling this type's constructor.
 *
 * NOTE on positioning the grab "cue" Node: transforming the wrappedNode after creating this type will not update the
 * layout of the grabCueNode. This is because the cue Node is a child of the focus highlight. As a
 * result, currently you must correctly position node before the cue Node is created.
 *
 * NOTE: upon "activation" of this type, meaning that the user grabs the object and it turns into a draggable, the
 * wrappedNode is blurred and refocused. This means that the input event "blur()" set in listenersForGrabState will
 * not just fire when navigating through the sim, but also upon activation. This weirdness is to make sure that the
 * input event "focus()" is called and supported for within listenersForDragState
 *
 * NOTE: For PhET-iO instrumentation, GrabDragInteraction.enabledProperty is phetioReadOnly, it makes the most sense
 * to link to whatever Node control's the mouse/touch input and toggle grab drag enabled when that Node's inputEnabled
 * changes. For example see Friction.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import EnabledComponent from '../../../axon/js/EnabledComponent.js';
import assertHasProperties from '../../../phet-core/js/assertHasProperties.js';
import getGlobal from '../../../phet-core/js/getGlobal.js';
import merge from '../../../phet-core/js/merge.js';
import StringUtils from '../../../phetcommon/js/util/StringUtils.js';
import { HighlightFromNode, HighlightPath, KeyboardListener, Node, PDOMPeer, PressListener, Voicing } from '../../../scenery/js/imports.js';
import Tandem from '../../../tandem/js/Tandem.js';
import AriaLiveAnnouncer from '../../../utterance-queue/js/AriaLiveAnnouncer.js';
import ResponsePacket from '../../../utterance-queue/js/ResponsePacket.js';
import Utterance from '../../../utterance-queue/js/Utterance.js';
import sceneryPhet from '../sceneryPhet.js';
import SceneryPhetStrings from '../SceneryPhetStrings.js';
import GrabReleaseCueNode from './nodes/GrabReleaseCueNode.js';

// constants
const grabPatternString = SceneryPhetStrings.a11y.grabDrag.grabPattern;
const gestureHelpTextPatternString = SceneryPhetStrings.a11y.grabDrag.gestureHelpTextPattern;
const movableString = SceneryPhetStrings.a11y.grabDrag.movable;
const buttonString = SceneryPhetStrings.a11y.grabDrag.button;
const defaultObjectToGrabString = SceneryPhetStrings.a11y.grabDrag.defaultObjectToGrab;
const releasedString = SceneryPhetStrings.a11y.grabDrag.released;
class GrabDragInteraction extends EnabledComponent {
  /**
   * @param {Node} node - will be mutated with a11y options to have the grab/drag functionality in the PDOM
   * @param {KeyboardDragListener} keyboardDragListener - added to the Node when it is draggable
   * @param {Object} [options]
   */
  constructor(node, keyboardDragListener, options) {
    options = merge({
      // A string that is filled in to the appropriate button label
      objectToGrabString: defaultObjectToGrabString,
      // {string|null} - if not provided, a default will be applied, see this.grabbableAccessibleName
      grabbableAccessibleName: null,
      // {function(SceneryEvent):} - called when the node is "grabbed" (when the grab button fires); button -> draggable
      onGrab: _.noop,
      // {function} - called when the node is "released" (when the draggable is "let go"); draggable -> button
      onRelease: _.noop,
      // {function} - similar to onRelease, but called whenever the interaction state is set to "grab". Useful for adding
      // accessible content for the interaction state in a way that can't be achieved with options, like setting
      // pdom attributes.
      onGrabbable: _.noop,
      // {function} - similar to onGrab, but called whenever the interaction state is set to "drag". Useful for adding
      // accessible content for the interaction state in a way that can't be achieved with options, like setting
      // pdom attributes.
      onDraggable: _.noop,
      // {Object} - Node options passed to the grabbable created for the PDOM, filled in with defaults below
      grabbableOptions: {
        appendDescription: true // in general, the help text is after the grabbable
      },
      // {Object} - To pass in options to the cue. This is a scenery Node and you can pass it options supported by
      // that type. When positioning this node, it is in the target Node's parent coordinate frame.
      grabCueOptions: {},
      // {Object} - Node options passed to the draggable created for the PDOM, filled in with defaults below
      draggableOptions: {},
      // {null|Node} - Optional node to cue the drag interaction once successfully updated.
      dragCueNode: null,
      // {Object[]} - GrabDragInteraction swaps the PDOM structure for a given node between a grabbable state, and
      // draggable one. We need to keep track of all listeners that need to be attached to each PDOM manifestation.
      // Note: when these are removed while converting to/from grabbable/draggable, they are interrupted. Other
      // listeners that are attached to this.node but aren't in these lists will not be interrupted. The grabbable
      // will blur() when activated from a grabbable to a draggable. The draggable will focus when activated
      // from grabbable.
      listenersForDragState: [],
      listenersForGrabState: [],
      // {boolean} - if this instance will support specific gesture description behavior.
      supportsGestureDescription: getGlobal('phet.joist.sim.supportsGestureDescription'),
      // {function(numberOfGrabs:number} - Add an aria-describedby link between the description
      // sibling and the primary sibling, only when grabbable. By default this should only be done when supporting
      // gesture interactive description before two success grabs. This function is called with one parameters: the number of
      // successful grabs that has occurred thus far.
      addAriaDescribedbyPredicate: numberOfGrabs => options.supportsGestureDescription && numberOfGrabs < 2,
      // {string} - Help text is treated as the same for the grabbable and draggable items, but is different based on if the
      // runtime is supporting gesture interactive description. Even though "technically" there is no way to access the
      // help text when this Node is in the draggable state, the help text is still in the PDOM.
      keyboardHelpText: null,
      // controls whether or not to show the "Grab" cue node that is displayed on focus - by
      // default it will be shown on focus until it has been successfully grabbed with a keyboard
      showGrabCueNode: () => {
        return this.numberOfKeyboardGrabs < 1 && node.inputEnabled;
      },
      // whether or not to display the Node for the "Drag" cue node once the grabbable Node has been picked up,
      // if a options.dragCueNode is specified. This will only be shown if draggable node has focus
      // from alternative input
      showDragCueNode: () => {
        return true;
      },
      // EnabledComponent
      phetioEnabledPropertyInstrumented: true,
      enabledPropertyOptions: {
        // It is best to wire up grab drag enabled to be in sync with mouse/touch inputEnabled (instead of having both
        // editable by PhET-iO).
        phetioReadOnly: true,
        phetioFeatured: false
      },
      // {Tandem} - For instrumenting
      tandem: Tandem.REQUIRED,
      tandemNameSuffix: 'GrabDragInteraction'
    }, options);

    // a second block for options that use other options, therefore needing the defaults to be filled in
    options = merge({
      // {string} - like keyboardHelpText but when supporting gesture interactive description
      gestureHelpText: StringUtils.fillIn(gestureHelpTextPatternString, {
        objectToGrab: options.objectToGrabString
      })
    }, options);
    assert && assert(typeof options.supportsGestureDescription === 'boolean', 'supportsGestureDescription must be provided');
    if (node.focusHighlightLayerable) {
      assert && assert(node.focusHighlight, 'if focusHighlightLayerable, the highlight must be set to the node before constructing the grab/drag interaction.');
      assert && assert(node.focusHighlight.parent, 'if focusHighlightLayerable, the highlight must be added to the ' + 'scene graph before grab/drag construction.');
    }
    if (node.interactiveHighlightLayerable) {
      assert && assert(node.interactiveHighlight, 'An interactive highlight must be set to the Node before construcion when using interactiveHighlightLayerable');
      assert && assert(node.interactiveHighlight.parent, 'if interactiveHighlightLayerable, the highlight must be added to the scene graph before construction');
    }
    if (node.focusHighlight) {
      assert && assert(node.focusHighlight instanceof phet.scenery.HighlightPath, 'if provided, focusHighlight must be a Path to support highlightChangedEmitter');
    }
    if (node.interactiveHighlight) {
      assert && assert(node.interactiveHighlight instanceof phet.scenery.HighlightPath, 'if provided, interactiveHighlight must be a Path to support highlightChangedEmitter');
    }
    assert && assert(typeof options.onGrab === 'function');
    assert && assert(typeof options.onRelease === 'function');
    assert && assert(typeof options.onGrabbable === 'function');
    assert && assert(typeof options.onDraggable === 'function');
    assert && assert(typeof options.showDragCueNode === 'function');
    assert && assert(typeof options.showGrabCueNode === 'function');
    assert && assert(Array.isArray(options.listenersForDragState));
    assert && assert(Array.isArray(options.listenersForGrabState));
    assert && assert(options.grabbableOptions instanceof Object);
    assert && assert(options.grabCueOptions instanceof Object);
    assert && assert(options.grabCueOptions.visible === undefined, 'Should not set visibility of the cue node');
    assert && assert(options.draggableOptions instanceof Object);
    assert && assert(!options.listenersForDragState.includes(keyboardDragListener), 'GrabDragInteraction adds the KeyboardDragListener to listenersForDragState');
    if (options.dragCueNode !== null) {
      assert && assert(options.dragCueNode instanceof Node);
      assert && assert(!options.dragCueNode.parent, 'GrabDragInteraction adds dragCueNode to focusHighlight');
      assert && assert(options.dragCueNode.visible === true, 'dragCueNode should be visible to begin with');
    }

    // GrabDragInteraction has its own API for description content.
    assert && assert(!options.grabbableOptions.descriptionContent, 'set grabbableOptions.descriptionContent through custom Grab/Drag API, (see keyboardHelpText and gestureHelpText option).');
    assert && assert(!options.grabbableOptions.helpText, 'set grabbableOptions.helpText through custom Grab/Drag API, (see keyboardHelpText and gestureHelpText option).');
    assert && assert(!options.grabbableOptions.descriptionTagName, 'set grabbableOptions.descriptionTagName through custom Grab/Drag API, (see keyboardHelpText and gestureHelpText option).');
    assert && assert(!options.draggableOptions.descriptionTagName, 'set draggableOptions.descriptionTagName through custom Grab/Drag API, (see keyboardHelpText and gestureHelpText option).');
    assert && assert(!options.draggableOptions.descriptionContent, 'set draggableOptions.descriptionContent through custom Grab/Drag API, (see keyboardHelpText and gestureHelpText option).');
    assert && assert(!options.draggableOptions.helpText, 'set draggableOptions.helpText through custom Grab/Drag API, (see keyboardHelpText and gestureHelpText option).');
    assert && assert(!options.draggableOptions.accessibleName, 'GrabDragInteraction sets its own accessible name, see objectToGrabString');
    assert && assert(!options.draggableOptions.innerContent, 'GrabDragInteraction sets its own innerContent, see objectToGrabString');
    assert && assert(!options.draggableOptions.ariaLabel, 'GrabDragInteraction sets its own ariaLabel, see objectToGrabString');
    super(options);
    options.draggableOptions = merge({
      tagName: 'div',
      ariaRole: 'application',
      // to cancel out grabbable
      containerTagName: null
    }, options.draggableOptions);

    // @private
    this.draggableAccessibleName = options.objectToGrabString;
    options.draggableOptions.innerContent = this.draggableAccessibleName;
    options.draggableOptions.ariaLabel = this.draggableAccessibleName;
    assert && assert(!options.grabbableOptions.accessibleName, 'GrabDragInteraction sets its own accessible name, see objectToGrabString');
    assert && assert(!options.grabbableOptions.innerContent, 'GrabDragInteraction sets its own innerContent, see objectToGrabString');
    assert && assert(!options.grabbableOptions.ariaLabel, 'GrabDragInteraction sets its own ariaLabel, see objectToGrabString');
    options.grabbableOptions = merge({
      containerTagName: 'div',
      ariaRole: null,
      tagName: 'button',
      // position the PDOM elements when grabbable for drag and drop on touch-based screen readers
      positionInPDOM: true,
      // {string}
      accessibleName: null
    }, options.grabbableOptions);

    // @private
    this.grabbableAccessibleName = options.grabbableAccessibleName || (
    // if a provided option
    options.supportsGestureDescription ? options.objectToGrabString :
    // otherwise if supporting gesture
    StringUtils.fillIn(grabPatternString, {
      // default case
      objectToGrab: options.objectToGrabString
    }));
    options.grabbableOptions.innerContent = this.grabbableAccessibleName;

    // Setting the aria-label on the grabbable element fixes a bug with VoiceOver in Safari where the aria role
    // from the draggable state is never cleared, see https://github.com/phetsims/scenery-phet/issues/688
    options.grabbableOptions.ariaLabel = this.grabbableAccessibleName;

    // @private
    this.grabbable = true; // If false, then instead this type is in the draggable interaction state.
    this.node = node;
    this.grabbableOptions = options.grabbableOptions;
    this.draggableOptions = options.draggableOptions;
    this.dragCueNode = options.dragCueNode; // {Node|null}
    this.grabCueNode = new GrabReleaseCueNode(options.grabCueOptions);
    this.showGrabCueNode = options.showGrabCueNode;
    this.showDragCueNode = options.showDragCueNode;
    this.onGrabbable = options.onGrabbable;
    this.onDraggable = options.onDraggable;
    this.addAriaDescribedbyPredicate = options.addAriaDescribedbyPredicate;
    this.supportsGestureDescription = options.supportsGestureDescription;

    // @private {number} - the number of times the component has been picked up for dragging, regardless
    // of pickup method for things like determining content for "hints" describing the interaction
    // to the user
    this.numberOfGrabs = 0; // {number}

    // @private {number} - the number of times this component has been picked up with a keyboard
    // specifically to provide hints specific to alternative input
    this.numberOfKeyboardGrabs = 0;

    // @private {string|null}
    // set the help text, if provided - it will be associated with aria-describedby when in the "grabbable" state
    this.node.descriptionContent = this.supportsGestureDescription ? options.gestureHelpText : options.keyboardHelpText;

    // @private {Object} - The aria-describedby association object that will associate "grabbable" with its
    // help text so that it is read automatically when the user finds it. This reference is saved so that
    // the association can be removed when the node becomes a "draggable"
    this.descriptionAssociationObject = {
      otherNode: this.node,
      thisElementName: PDOMPeer.PRIMARY_SIBLING,
      otherElementName: PDOMPeer.DESCRIPTION_SIBLING
    };

    // @private
    this.voicingFocusUtterance = new Utterance({
      alert: new ResponsePacket(),
      announcerOptions: {
        cancelOther: false
      }
    });

    // for both grabbing and dragging, the node with this interaction must be focusable, except when disabled.
    this.node.focusable = true;
    assert && node.isVoicing && assert(node.voicingFocusListener === node.defaultFocusListener, 'GrabDragInteraction sets its own voicingFocusListener.');

    // "released" alerts are assertive so that a pile up of alerts doesn't happen with rapid movement, see
    // https://github.com/phetsims/balloons-and-static-electricity/issues/491
    const releasedUtterance = new Utterance({
      alert: new ResponsePacket({
        objectResponse: releasedString
      }),
      // This was being obscured by other messages, the priority helps make sure it is heard, see https://github.com/phetsims/friction/issues/325
      priority: Utterance.MEDIUM_PRIORITY,
      announcerOptions: {
        ariaLivePriority: AriaLiveAnnouncer.AriaLive.ASSERTIVE // for AriaLiveAnnouncer
      }
    });
    if (node.isVoicing) {
      // sanity check on the voicing interface API.
      assertHasProperties(node, ['voicingFocusListener']);
      node.voicingFocusListener = event => {
        // When swapping from grabbable to draggable, the draggable element will be focused, ignore that case here, see https://github.com/phetsims/friction/issues/213
        this.grabbable && node.defaultFocusListener(event);
      };

      // These Utterances should only be announced if the Node is globally visible and voicingVisible.
      Voicing.registerUtteranceToVoicingNode(releasedUtterance, node);
      Voicing.registerUtteranceToVoicingNode(this.voicingFocusUtterance, node);
    }

    // @private - wrap the optional onRelease in logic that is needed for the core type.
    this.onRelease = () => {
      options.onRelease && options.onRelease();
      this.node.alertDescriptionUtterance(releasedUtterance);
      node.isVoicing && Voicing.alertUtterance(releasedUtterance);
    };
    this.onGrab = options.onGrab; // @private

    // @private - Take highlights from the node for the grab button interaction. The Interactive Highlights cannot
    // fall back to the default focus highlights because GrabDragInteraction adds "grab cue" Nodes as children
    // to the focus highlights that should not be displayed when using Interactive Highlights.
    this.grabFocusHighlight = node.focusHighlight || new HighlightFromNode(node);
    this.grabInteractiveHighlight = node.interactiveHighlight || new HighlightFromNode(node);
    node.focusHighlight = this.grabFocusHighlight;
    node.interactiveHighlight = this.grabInteractiveHighlight;

    // @private - Make the draggable highlights in the spitting image of the node's grabbable highlights
    this.dragFocusHighlight = new HighlightPath(this.grabFocusHighlight.shape, {
      visible: false,
      transformSourceNode: this.grabFocusHighlight.transformSourceNode || node
    });
    this.dragInteractiveHighlight = new HighlightPath(this.grabInteractiveHighlight.shape, {
      visible: false,
      transformSourceNode: this.grabInteractiveHighlight.transformSourceNode || node
    });

    // Update the passed in node's focusHighlight to make it dashed for the "draggable" state
    this.dragFocusHighlight.makeDashed(true);
    this.dragInteractiveHighlight.makeDashed(true);

    // if the Node layers its interactive highlights in the scene graph, add the dragInteractiveHighlight in the same
    // way the grabInteractiveHighlight was added
    if (node.interactiveHighlightLayerable) {
      this.grabInteractiveHighlight.parent.addChild(this.dragInteractiveHighlight);
    }

    // if ever we update the node's highlights, then update the grab button's too to keep in syn.
    const onFocusHighlightChange = () => {
      this.dragFocusHighlight.setShape(this.grabFocusHighlight.shape);
    };
    this.grabFocusHighlight.highlightChangedEmitter.addListener(onFocusHighlightChange);
    const onInteractiveHighlightChange = () => {
      this.dragInteractiveHighlight.setShape(this.grabInteractiveHighlight.shape);
    };
    this.grabInteractiveHighlight.highlightChangedEmitter.addListener(onInteractiveHighlightChange);

    // only the focus highlights have "cue" Nodes so we do not need to do any work here for the Interactive Highlights
    this.grabCueNode.prependMatrix(node.getMatrix());
    this.grabFocusHighlight.addChild(this.grabCueNode);
    if (this.dragCueNode) {
      this.dragCueNode.prependMatrix(node.getMatrix());
      this.dragFocusHighlight.addChild(this.dragCueNode);
    }

    // Some key presses can fire the node's click (the grab button) from the same press that fires the keydown from
    // the draggable, so guard against that.
    let guardKeyPressFromDraggable = false;

    // when the "Grab {{thing}}" button is pressed, focus the draggable node and set to dragged state
    const grabButtonListener = {
      click: event => {
        // don't turn to draggable on mobile a11y, it is the wrong gesture - user should press down and hold
        // to initiate a drag
        if (this.supportsGestureDescription) {
          return;
        }

        // if the draggable was just released, don't pick it up again until the next click event so we don't "loop"
        // and pick it up immediately again.
        if (!guardKeyPressFromDraggable) {
          // blur as a grabbable so that we geta new focus event after we turn into a draggable
          this.node.blur();
          this.turnToDraggable();
          this.numberOfKeyboardGrabs++;

          // focus after the transition
          this.node.focus();
          this.onGrab(event);

          // Add the newly created focusHighlight to the scene graph if focusHighlightLayerable, just like the
          // original focus highlight was added. By doing this on click, we make sure that the node's
          // focusHighlight has been completely constructed (added to the scene graph) and can use its parent. But only
          // do it once.
          if (node.focusHighlightLayerable) {
            assert && assert(this.grabFocusHighlight.parent, 'how can we have focusHighlightLayerable with a ' + 'node that is not in the scene graph?');
            // If not yet added, do so now.
            if (!this.grabFocusHighlight.parent.hasChild(this.dragFocusHighlight)) {
              this.grabFocusHighlight.parent.addChild(this.dragFocusHighlight);
            }
          }
        }

        // "grab" the draggable on the next click event
        guardKeyPressFromDraggable = false;
      },
      focus: () => {
        this.updateVisibilityForCues();
        if (this.node.isVoicing && this.showGrabCueNode()) {
          this.voicingFocusUtterance.alert.hintResponse = SceneryPhetStrings.a11y.grabDrag.spaceToGrabOrReleaseStringProperty;
          Voicing.alertUtterance(this.voicingFocusUtterance);
        }
      },
      blur: () => {
        this.grabCueNode.visible = options.showGrabCueNode();
      }
    };

    // @private - keep track of all listeners to swap out grab/drag functionalities
    this.listenersForGrabState = options.listenersForGrabState.concat(grabButtonListener);
    const dragDivDownListener = new KeyboardListener({
      keys: ['enter'],
      fire: () => {
        // set a guard to make sure the key press from enter doesn't fire future listeners, therefore
        // "clicking" the grab button also on this key press.
        guardKeyPressFromDraggable = true;
        this.releaseDraggable();
      }
    });
    const dragDivUpListener = new KeyboardListener({
      keys: ['space', 'escape'],
      fireOnDown: false,
      fire: () => {
        // Release on keyup for spacebar so that we don't pick up the draggable again when we release the spacebar
        // and trigger a click event - escape could be added to either keyup or keydown listeners
        this.releaseDraggable();

        // if successfully dragged, then make the cue node invisible
        this.updateVisibilityForCues();
      },
      // release when focus is lost
      blur: () => this.releaseDraggable(),
      // if successfully dragged, then make the cue node invisible
      focus: () => this.updateVisibilityForCues()
    });

    // @private
    this.listenersForDragState = options.listenersForDragState.concat([dragDivDownListener, dragDivUpListener, keyboardDragListener]);

    // @private - from non-PDOM pointer events, change representations in the PDOM - necessary for accessible tech that
    // uses pointer events like iOS VoiceOver. The above listeners manage input from the PDOM.
    this.pressListener = new PressListener({
      press: event => {
        if (!event.isFromPDOM()) {
          this.turnToDraggable();
          this.onGrab(event);
        }
      },
      release: event => {
        // release if PressListener is interrupted, but only if not already
        // grabbable, which is possible if the GrabDragInteraction has been
        // reset since press
        if ((event === null || !event.isFromPDOM()) && !this.grabbable) {
          this.releaseDraggable();
        }
      },
      // this listener shouldn't prevent the behavior of other listeners, and this listener should always fire
      // whether or not the pointer is already attached
      attach: false,
      enabledProperty: this.enabledProperty,
      tandem: options.tandem.createTandem('pressListener')
    });
    this.node.addInputListener(this.pressListener);

    // Initialize the Node as a grabbable (button) to begin with
    this.turnToGrabbable();
    this.enabledProperty.lazyLink(enabled => {
      !enabled && this.interrupt();

      // Disabled GrabDragInteractions will be unable to be interacted with.
      this.node.focusable = enabled;
    });
    const boundUpdateVisibilityForCues = this.updateVisibilityForCues.bind(this);
    this.node.inputEnabledProperty.lazyLink(boundUpdateVisibilityForCues);

    // @private
    this.disposeGrabDragInteraction = () => {
      this.node.removeInputListener(this.pressListener);
      this.node.inputEnabledProperty.unlink(boundUpdateVisibilityForCues);

      // Remove listeners according to what state we are in
      if (this.grabbable) {
        this.removeInputListeners(this.listenersForGrabState);
      } else {
        this.removeInputListeners(this.listenersForDragState);
      }
      dragDivDownListener.dispose();
      dragDivUpListener.dispose();
      this.grabFocusHighlight.highlightChangedEmitter.removeListener(onFocusHighlightChange);
      this.grabInteractiveHighlight.highlightChangedEmitter.removeListener(onInteractiveHighlightChange);

      // Remove children if they were added to support layerable highlights
      if (node.focusHighlightLayerable) {
        assert && assert(this.grabFocusHighlight.parent, 'how can we have focusHighlightLayerable with a ' + 'node that is not in the scene graph?');
        if (this.grabFocusHighlight.parent.hasChild(this.dragFocusHighlight)) {
          this.grabFocusHighlight.parent.removeChild(this.dragFocusHighlight);
        }
      }
      if (node.interactiveHighlightLayerable) {
        assert && assert(this.grabInteractiveHighlight.parent, 'how can we have interactiveHighlightLayerable with a ' + 'node that is not in the scene graph?');
        if (this.grabInteractiveHighlight.parent.hasChild(this.dragInteractiveHighlight)) {
          this.grabInteractiveHighlight.parent.removeChild(this.dragInteractiveHighlight);
        }
      }
      if (node.isVoicing) {
        Voicing.unregisterUtteranceToVoicingNode(releasedUtterance, node);
        Voicing.unregisterUtteranceToVoicingNode(this.voicingFocusUtterance, node);
      }

      // remove cue references
      this.grabFocusHighlight.removeChild(this.grabCueNode);
      this.dragCueNode && this.dragFocusHighlight.focusHighlight.removeChild(this.dragCueNode);
    };
  }

  /**
   * Release the draggable
   * @public
   */
  releaseDraggable() {
    assert && assert(!this.grabbable, 'cannot set to grabbable if already set that way');
    this.turnToGrabbable();
    this.onRelease();
  }

  /**
   * turn the Node into the grabbable (button), swap out listeners too
   * @private
   */
  turnToGrabbable() {
    this.grabbable = true;

    // To support gesture and mobile screen readers, we change the roledescription, see https://github.com/phetsims/scenery-phet/issues/536
    if (this.supportsGestureDescription) {
      this.node.setPDOMAttribute('aria-roledescription', movableString);
    } else if (this.node.hasPDOMAttribute('aria-roledescription')) {
      // By default, the grabbable gets a roledescription to force the AT to say its role. This fixes a bug in VoiceOver
      // where it fails to update the role after turning back into a grabbable.
      // See https://github.com/phetsims/scenery-phet/issues/688.
      // You can override this with onGrabbable() if necessary.
      this.node.setPDOMAttribute('aria-roledescription', buttonString);
    }
    if (this.addAriaDescribedbyPredicate(this.numberOfGrabs)) {
      // this node is aria-describedby its own description content, so that the description is read automatically
      // when found by the user
      !this.node.hasAriaDescribedbyAssociation(this.descriptionAssociationObject) && this.node.addAriaDescribedbyAssociation(this.descriptionAssociationObject);
    } else if (this.node.hasAriaDescribedbyAssociation(this.descriptionAssociationObject)) {
      this.node.removeAriaDescribedbyAssociation(this.descriptionAssociationObject);
    }
    this.baseInteractionUpdate(this.grabbableOptions, this.listenersForDragState, this.listenersForGrabState);

    // callback on completion
    this.onGrabbable();
  }

  /**
   * Turn the node into a draggable by updating accessibility representation in the PDOM and changing input
   * listeners.
   * @private
   */
  turnToDraggable() {
    this.numberOfGrabs++;
    this.grabbable = false;

    // by default, the draggable has roledescription of "movable". Can be overwritten in `onDraggable()`
    this.node.setPDOMAttribute('aria-roledescription', movableString);

    // This node is aria-describedby its own description content only when grabbable, so that the description is
    // read automatically when found by the user with the virtual cursor. Remove it for draggable
    if (this.node.hasAriaDescribedbyAssociation(this.descriptionAssociationObject)) {
      this.node.removeAriaDescribedbyAssociation(this.descriptionAssociationObject);
    }

    // turn this into a draggable in the node
    this.baseInteractionUpdate(this.draggableOptions, this.listenersForGrabState, this.listenersForDragState);

    // callback on completion
    this.onDraggable();
  }

  /**
   * Update the node to switch modalities between being draggable, and grabbable. This function holds code that should
   * be called when switching in either direction.
   * @private
   */
  baseInteractionUpdate(optionsToMutate, listenersToRemove, listenersToAdd) {
    // interrupt prior input, reset the key state of the drag handler by interrupting the drag. Don't interrupt all
    // input, but instead just those to be removed.
    listenersToRemove.forEach(listener => listener.interrupt && listener.interrupt());

    // remove all previous listeners from the node
    this.removeInputListeners(listenersToRemove);

    // update the PDOM of the node
    this.node.mutate(optionsToMutate);
    assert && this.enabledProperty.value && assert(this.node.focusable, 'GrabDragInteraction node must remain focusable after mutation');
    this.addInputListeners(listenersToAdd);
    this.updateFocusHighlights();
    this.updateVisibilityForCues();
  }

  /**
   * Update the focusHighlights according to if we are in grabbable or draggable state
   * No need to set visibility to true, because that will happen for us by HighlightOverlay on focus.
   *
   * @private
   */
  updateFocusHighlights() {
    if (this.grabbable) {
      this.node.focusHighlight = this.grabFocusHighlight;
      this.node.interactiveHighlight = this.grabInteractiveHighlight;
    } else {
      this.node.focusHighlight = this.dragFocusHighlight;
      this.node.interactiveHighlight = this.dragInteractiveHighlight;
    }
  }

  /**
   * Update the visibility of the cues for both grabbable and draggable states.
   * @private
   */
  updateVisibilityForCues() {
    if (this.dragCueNode) {
      this.dragCueNode.visible = this.showDragCueNode();
    }
    this.grabCueNode.visible = this.showGrabCueNode();
  }

  /**
   * Add all listeners to node
   * @private
   * @param {Function[]}listeners
   */
  addInputListeners(listeners) {
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      if (!this.node.hasInputListener(listener)) {
        this.node.addInputListener(listener);
      }
    }
  }

  /**
   * Remove all listeners from the node
   * @param listeners
   * @private
   */
  removeInputListeners(listeners) {
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      if (this.node.hasInputListener(listener)) {
        this.node.removeInputListener(listener);
      }
    }
  }

  /**
   * @override
   * @public
   */
  dispose() {
    this.disposeGrabDragInteraction();
    super.dispose();
  }

  /**
   * Interrupt the grab drag interraction - interrupts any listeners attached and makes sure the
   * Node is back in its "grabbable" state.
   * @public
   */
  interrupt() {
    this.pressListener.interrupt();
  }

  /**
   * Reset to initial state
   * @public
   */
  reset() {
    // reset numberOfGrabs for turnToGrabbable
    this.numberOfGrabs = 0;
    this.turnToGrabbable();
    this.voicingFocusUtterance.reset();

    // turnToGrabbable will increment this, so reset it again
    this.numberOfGrabs = 0;
    this.numberOfKeyboardGrabs = 0;
    this.grabCueNode.visible = true;
    if (this.dragCueNode) {
      this.dragCueNode.visible = true;
    }
  }
}
sceneryPhet.register('GrabDragInteraction', GrabDragInteraction);
export default GrabDragInteraction;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFbmFibGVkQ29tcG9uZW50IiwiYXNzZXJ0SGFzUHJvcGVydGllcyIsImdldEdsb2JhbCIsIm1lcmdlIiwiU3RyaW5nVXRpbHMiLCJIaWdobGlnaHRGcm9tTm9kZSIsIkhpZ2hsaWdodFBhdGgiLCJLZXlib2FyZExpc3RlbmVyIiwiTm9kZSIsIlBET01QZWVyIiwiUHJlc3NMaXN0ZW5lciIsIlZvaWNpbmciLCJUYW5kZW0iLCJBcmlhTGl2ZUFubm91bmNlciIsIlJlc3BvbnNlUGFja2V0IiwiVXR0ZXJhbmNlIiwic2NlbmVyeVBoZXQiLCJTY2VuZXJ5UGhldFN0cmluZ3MiLCJHcmFiUmVsZWFzZUN1ZU5vZGUiLCJncmFiUGF0dGVyblN0cmluZyIsImExMXkiLCJncmFiRHJhZyIsImdyYWJQYXR0ZXJuIiwiZ2VzdHVyZUhlbHBUZXh0UGF0dGVyblN0cmluZyIsImdlc3R1cmVIZWxwVGV4dFBhdHRlcm4iLCJtb3ZhYmxlU3RyaW5nIiwibW92YWJsZSIsImJ1dHRvblN0cmluZyIsImJ1dHRvbiIsImRlZmF1bHRPYmplY3RUb0dyYWJTdHJpbmciLCJkZWZhdWx0T2JqZWN0VG9HcmFiIiwicmVsZWFzZWRTdHJpbmciLCJyZWxlYXNlZCIsIkdyYWJEcmFnSW50ZXJhY3Rpb24iLCJjb25zdHJ1Y3RvciIsIm5vZGUiLCJrZXlib2FyZERyYWdMaXN0ZW5lciIsIm9wdGlvbnMiLCJvYmplY3RUb0dyYWJTdHJpbmciLCJncmFiYmFibGVBY2Nlc3NpYmxlTmFtZSIsIm9uR3JhYiIsIl8iLCJub29wIiwib25SZWxlYXNlIiwib25HcmFiYmFibGUiLCJvbkRyYWdnYWJsZSIsImdyYWJiYWJsZU9wdGlvbnMiLCJhcHBlbmREZXNjcmlwdGlvbiIsImdyYWJDdWVPcHRpb25zIiwiZHJhZ2dhYmxlT3B0aW9ucyIsImRyYWdDdWVOb2RlIiwibGlzdGVuZXJzRm9yRHJhZ1N0YXRlIiwibGlzdGVuZXJzRm9yR3JhYlN0YXRlIiwic3VwcG9ydHNHZXN0dXJlRGVzY3JpcHRpb24iLCJhZGRBcmlhRGVzY3JpYmVkYnlQcmVkaWNhdGUiLCJudW1iZXJPZkdyYWJzIiwia2V5Ym9hcmRIZWxwVGV4dCIsInNob3dHcmFiQ3VlTm9kZSIsIm51bWJlck9mS2V5Ym9hcmRHcmFicyIsImlucHV0RW5hYmxlZCIsInNob3dEcmFnQ3VlTm9kZSIsInBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCIsImVuYWJsZWRQcm9wZXJ0eU9wdGlvbnMiLCJwaGV0aW9SZWFkT25seSIsInBoZXRpb0ZlYXR1cmVkIiwidGFuZGVtIiwiUkVRVUlSRUQiLCJ0YW5kZW1OYW1lU3VmZml4IiwiZ2VzdHVyZUhlbHBUZXh0IiwiZmlsbEluIiwib2JqZWN0VG9HcmFiIiwiYXNzZXJ0IiwiZm9jdXNIaWdobGlnaHRMYXllcmFibGUiLCJmb2N1c0hpZ2hsaWdodCIsInBhcmVudCIsImludGVyYWN0aXZlSGlnaGxpZ2h0TGF5ZXJhYmxlIiwiaW50ZXJhY3RpdmVIaWdobGlnaHQiLCJwaGV0Iiwic2NlbmVyeSIsIkFycmF5IiwiaXNBcnJheSIsIk9iamVjdCIsInZpc2libGUiLCJ1bmRlZmluZWQiLCJpbmNsdWRlcyIsImRlc2NyaXB0aW9uQ29udGVudCIsImhlbHBUZXh0IiwiZGVzY3JpcHRpb25UYWdOYW1lIiwiYWNjZXNzaWJsZU5hbWUiLCJpbm5lckNvbnRlbnQiLCJhcmlhTGFiZWwiLCJ0YWdOYW1lIiwiYXJpYVJvbGUiLCJjb250YWluZXJUYWdOYW1lIiwiZHJhZ2dhYmxlQWNjZXNzaWJsZU5hbWUiLCJwb3NpdGlvbkluUERPTSIsImdyYWJiYWJsZSIsImdyYWJDdWVOb2RlIiwiZGVzY3JpcHRpb25Bc3NvY2lhdGlvbk9iamVjdCIsIm90aGVyTm9kZSIsInRoaXNFbGVtZW50TmFtZSIsIlBSSU1BUllfU0lCTElORyIsIm90aGVyRWxlbWVudE5hbWUiLCJERVNDUklQVElPTl9TSUJMSU5HIiwidm9pY2luZ0ZvY3VzVXR0ZXJhbmNlIiwiYWxlcnQiLCJhbm5vdW5jZXJPcHRpb25zIiwiY2FuY2VsT3RoZXIiLCJmb2N1c2FibGUiLCJpc1ZvaWNpbmciLCJ2b2ljaW5nRm9jdXNMaXN0ZW5lciIsImRlZmF1bHRGb2N1c0xpc3RlbmVyIiwicmVsZWFzZWRVdHRlcmFuY2UiLCJvYmplY3RSZXNwb25zZSIsInByaW9yaXR5IiwiTUVESVVNX1BSSU9SSVRZIiwiYXJpYUxpdmVQcmlvcml0eSIsIkFyaWFMaXZlIiwiQVNTRVJUSVZFIiwiZXZlbnQiLCJyZWdpc3RlclV0dGVyYW5jZVRvVm9pY2luZ05vZGUiLCJhbGVydERlc2NyaXB0aW9uVXR0ZXJhbmNlIiwiYWxlcnRVdHRlcmFuY2UiLCJncmFiRm9jdXNIaWdobGlnaHQiLCJncmFiSW50ZXJhY3RpdmVIaWdobGlnaHQiLCJkcmFnRm9jdXNIaWdobGlnaHQiLCJzaGFwZSIsInRyYW5zZm9ybVNvdXJjZU5vZGUiLCJkcmFnSW50ZXJhY3RpdmVIaWdobGlnaHQiLCJtYWtlRGFzaGVkIiwiYWRkQ2hpbGQiLCJvbkZvY3VzSGlnaGxpZ2h0Q2hhbmdlIiwic2V0U2hhcGUiLCJoaWdobGlnaHRDaGFuZ2VkRW1pdHRlciIsImFkZExpc3RlbmVyIiwib25JbnRlcmFjdGl2ZUhpZ2hsaWdodENoYW5nZSIsInByZXBlbmRNYXRyaXgiLCJnZXRNYXRyaXgiLCJndWFyZEtleVByZXNzRnJvbURyYWdnYWJsZSIsImdyYWJCdXR0b25MaXN0ZW5lciIsImNsaWNrIiwiYmx1ciIsInR1cm5Ub0RyYWdnYWJsZSIsImZvY3VzIiwiaGFzQ2hpbGQiLCJ1cGRhdGVWaXNpYmlsaXR5Rm9yQ3VlcyIsImhpbnRSZXNwb25zZSIsInNwYWNlVG9HcmFiT3JSZWxlYXNlU3RyaW5nUHJvcGVydHkiLCJjb25jYXQiLCJkcmFnRGl2RG93bkxpc3RlbmVyIiwia2V5cyIsImZpcmUiLCJyZWxlYXNlRHJhZ2dhYmxlIiwiZHJhZ0RpdlVwTGlzdGVuZXIiLCJmaXJlT25Eb3duIiwicHJlc3NMaXN0ZW5lciIsInByZXNzIiwiaXNGcm9tUERPTSIsInJlbGVhc2UiLCJhdHRhY2giLCJlbmFibGVkUHJvcGVydHkiLCJjcmVhdGVUYW5kZW0iLCJhZGRJbnB1dExpc3RlbmVyIiwidHVyblRvR3JhYmJhYmxlIiwibGF6eUxpbmsiLCJlbmFibGVkIiwiaW50ZXJydXB0IiwiYm91bmRVcGRhdGVWaXNpYmlsaXR5Rm9yQ3VlcyIsImJpbmQiLCJpbnB1dEVuYWJsZWRQcm9wZXJ0eSIsImRpc3Bvc2VHcmFiRHJhZ0ludGVyYWN0aW9uIiwicmVtb3ZlSW5wdXRMaXN0ZW5lciIsInVubGluayIsInJlbW92ZUlucHV0TGlzdGVuZXJzIiwiZGlzcG9zZSIsInJlbW92ZUxpc3RlbmVyIiwicmVtb3ZlQ2hpbGQiLCJ1bnJlZ2lzdGVyVXR0ZXJhbmNlVG9Wb2ljaW5nTm9kZSIsInNldFBET01BdHRyaWJ1dGUiLCJoYXNQRE9NQXR0cmlidXRlIiwiaGFzQXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb24iLCJhZGRBcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbiIsInJlbW92ZUFyaWFEZXNjcmliZWRieUFzc29jaWF0aW9uIiwiYmFzZUludGVyYWN0aW9uVXBkYXRlIiwib3B0aW9uc1RvTXV0YXRlIiwibGlzdGVuZXJzVG9SZW1vdmUiLCJsaXN0ZW5lcnNUb0FkZCIsImZvckVhY2giLCJsaXN0ZW5lciIsIm11dGF0ZSIsInZhbHVlIiwiYWRkSW5wdXRMaXN0ZW5lcnMiLCJ1cGRhdGVGb2N1c0hpZ2hsaWdodHMiLCJsaXN0ZW5lcnMiLCJpIiwibGVuZ3RoIiwiaGFzSW5wdXRMaXN0ZW5lciIsInJlc2V0IiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJHcmFiRHJhZ0ludGVyYWN0aW9uLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFRoZSBtYWluIGludGVyYWN0aW9uIGZvciBncmFiYmluZyBhbmQgZHJhZ2dpbmcgYW4gb2JqZWN0IHRocm91Z2ggdGhlIFBET00gYW5kIGFzc2lzdGl2ZSB0ZWNobm9sb2d5LiBJdCB3b3JrcyBieVxyXG4gKiB0YWtpbmcgaW4gYSBOb2RlIHRvIGF1Z21lbnQgd2l0aCB0aGUgUERPTSBpbnRlcmFjdGlvbi4gSW4gZmFjdCBpdCB3b3JrcyBtdWNoIGxpa2UgYSBtaXhpbi4gSW4gZ2VuZXJhbCwgdGhpcyB0eXBlXHJcbiAqIHdpbGwgbXV0YXRlIHRoZSBhY2Nlc3NpYmxlIGNvbnRlbnQgKFBET00pIG9mIHRoZSBwYXNzZWQgaW4gTm9kZSAoc29tZXRpbWVzIHJlZmVycmVkIHRvIFwid3JhcHBlZE5vZGVcIiksIHRvZ2dsaW5nXHJcbiAqIGJldHdlZW4gYSBcImdyYWJiYWJsZVwiIHN0YXRlIGFuZCBhIFwiZHJhZ2dhYmxlXCIgc3RhdGUuIFdoZW4gZWFjaCBzdGF0ZSBjaGFuZ2VzLCB0aGUgdW5kZXJseWluZyBQRE9NIGVsZW1lbnQgYW5kIGdlbmVyYWxcclxuICogaW50ZXJhY3Rpb24gZG9lcyBhcyB3ZWxsLlxyXG4gKlxyXG4gKiBUbyBhY2NvbXBsaXNoIHRoaXMgdGhlcmUgYXJlIG9wdGlvbnMgdG8gYmUgZmlsbGVkIGluIHRoYXQga2VlcCB0cmFjayBvZiB0aGUgc2NlbmVyeSBpbnB1dExpc3RlbmVycyBmb3IgZWFjaCBzdGF0ZSxcclxuICogYXMgd2VsbCBhcyBvcHRpb25zIHRvIG11dGF0ZSB0aGUgTm9kZSBmb3IgZWFjaCBzdGF0ZS4gQnkgZGVmYXVsdCB0aGUgZ3JhYmJhYmxlIGlzIGEgYGJ1dHRvbmAgd2l0aCBhIGNvbnRhaW5pbmcgIGBkaXZgLFxyXG4gKiBhbmQgdGhlIGRyYWdnYWJsZSBpcyBhIGZvY3VzYWJsZSBgZGl2YCB3aXRoIGFuIFwiYXBwbGljYXRpb25cIiBhcmlhIHJvbGUuIEl0IGlzIHVwIHRvIHRoZSBjbGllbnQgdG8gc3VwcGx5IGFcclxuICogS2V5Ym9hcmREcmFnTGlzdGVuZXIgYXMgYW4gYXJnIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGUgTm9kZSBpbiB0aGUgXCJkcmFnZ2FibGVcIiBzdGF0ZS5cclxuICpcclxuICogQXMgYSBub3RlIG9uIHRlcm1pbm9sb2d5LCBtb3N0bHkgdGhpbmdzIGFyZSByZWZlcnJlZCB0byBieSB0aGVpciBjdXJyZW50IFwiaW50ZXJhY3Rpb24gc3RhdGVcIiB3aGljaCBpcyBlaXRoZXIgZ3JhYmJhYmxlXHJcbiAqIG9yIGRyYWdnYWJsZS5cclxuICpcclxuICogVGhpcyB0eXBlIHdpbGwgYWxlcnQgd2hlbiB0aGUgZHJhZ2dhYmxlIGlzIHJlbGVhc2VkLCBidXQgbm8gZGVmYXVsdCBhbGVydCBpcyBwcm92aWRlZCB3aGVuIHRoZSBvYmplY3QgaXMgZ3JhYmJlZC5cclxuICogVGhpcyBpcyBiZWNhdXNlIGluIHVzYWdlcyBzbyBmYXIsIHRoYXQgYWxlcnQgaGFzIGJlZW4gY3VzdG9tLCBjb250ZXh0IHNwZWNpZmljLCBhbmQgZWFzaWVyIHRvIGp1c3Qgc3VwcGx5IHRocm91Z2hcclxuICogdGhlIG9uR3JhYiBjYWxsYmFjayBvcHRpb24uXHJcbiAqXHJcbiAqIE5PVEU6IFlvdSBTSE9VTEQgTk9UIGFkZCBsaXN0ZW5lcnMgZGlyZWN0bHkgdG8gdGhlIE5vZGUgd2hlcmUgaXQgaXMgY29uc3RydWN0ZWQsIGluc3RlYWQgc2VlXHJcbiAqIGBvcHRpb25zLmxpc3RlbmVyc0ZvckdyYWIvRHJhZ1N0YXRlYC4gVGhlc2Ugd2lsbCBrZWVwIHRyYWNrIG9mIHRoZSBsaXN0ZW5lcnMgZm9yIGVhY2ggaW50ZXJhY3Rpb24gc3RhdGUsIGFuZFxyXG4gKiB3aWxsIHNldCB0aGVtIGFjY29yZGluZ2x5LiBJbiByYXJlIGNhc2VzIGl0IG1heSBiZSBkZXNpcmFibGUgdG8gaGF2ZSBhIGxpc3RlbmVyIGF0dGFjaGVkIG5vIG1hdHRlciB0aGUgc3RhdGUsIGJ1dCB0aGF0XHJcbiAqIGhhcyBub3QgY29tZSB1cCBzbyBmYXIuXHJcbiAqXHJcbiAqIE5PVEU6IFRoZXJlIGlzIG5vIFwidW5kb1wiIGZvciBhIG11dGF0ZSBjYWxsLCBzbyBpdCBpcyB0aGUgY2xpZW50J3Mgam9iIHRvIG1ha2Ugc3VyZSB0aGF0IGdyYWJiYWJsZS9kcmFnZ2FibGVPcHRpb25zIG9iamVjdHNcclxuICogYXBwcm9wcmlhdGVseSBcImNhbmNlbFwiIG91dCB0aGUgb3RoZXIuIFRoZSBzYW1lIGdvZXMgZm9yIGFueSBhbHRlcmF0aW9ucyB0aGF0IGFyZSBkb25lIG9uIGBvbkdyYWJgIGFuZCBgb25SZWxlYXNlYFxyXG4gKiBjYWxsYmFja3MuXHJcbiAqXHJcbiAqIE5PVEU6IHByb2JsZW1zIG1heSBvY2N1ciBpZiB5b3UgY2hhbmdlIHRoZSBmb2N1c0hpZ2hsaWdodCBvciBpbnRlcmFjdGl2ZUhpZ2hsaWdodCBvZiB0aGUgTm9kZSBwYXNzZWQgaW4gYWZ0ZXJcclxuICogY3JlYXRpbmcgdGhpcyB0eXBlLlxyXG4gKlxyXG4gKiBOT1RFOiBmb2N1c0hpZ2hsaWdodExheWVyYWJsZSBhbmQgaW50ZXJhY3RpdmVIaWdobGlnaHRMYXllcmFibGUgaXMgZmluaWNreSB3aXRoIHRoaXMgdHlwZS4gSW4gb3JkZXIgdG8gc3VwcG9ydFxyXG4gKiBpdCwgeW91IG11c3QgaGF2ZSBzZXQgdGhlIGZvY3VzSGlnaGxpZ2h0IG9yIGludGVyYWN0aXZlSGlnaGxpZ2h0IHRvIHRoZSB3cmFwcGVkTm9kZSBhbmQgYWRkZWQgdGhlIGZvY3VzSGlnaGxpZ2h0XHJcbiAqIHRvIHRoZSBzY2VuZSBncmFwaCBiZWZvcmUgY2FsbGluZyB0aGlzIHR5cGUncyBjb25zdHJ1Y3Rvci5cclxuICpcclxuICogTk9URSBvbiBwb3NpdGlvbmluZyB0aGUgZ3JhYiBcImN1ZVwiIE5vZGU6IHRyYW5zZm9ybWluZyB0aGUgd3JhcHBlZE5vZGUgYWZ0ZXIgY3JlYXRpbmcgdGhpcyB0eXBlIHdpbGwgbm90IHVwZGF0ZSB0aGVcclxuICogbGF5b3V0IG9mIHRoZSBncmFiQ3VlTm9kZS4gVGhpcyBpcyBiZWNhdXNlIHRoZSBjdWUgTm9kZSBpcyBhIGNoaWxkIG9mIHRoZSBmb2N1cyBoaWdobGlnaHQuIEFzIGFcclxuICogcmVzdWx0LCBjdXJyZW50bHkgeW91IG11c3QgY29ycmVjdGx5IHBvc2l0aW9uIG5vZGUgYmVmb3JlIHRoZSBjdWUgTm9kZSBpcyBjcmVhdGVkLlxyXG4gKlxyXG4gKiBOT1RFOiB1cG9uIFwiYWN0aXZhdGlvblwiIG9mIHRoaXMgdHlwZSwgbWVhbmluZyB0aGF0IHRoZSB1c2VyIGdyYWJzIHRoZSBvYmplY3QgYW5kIGl0IHR1cm5zIGludG8gYSBkcmFnZ2FibGUsIHRoZVxyXG4gKiB3cmFwcGVkTm9kZSBpcyBibHVycmVkIGFuZCByZWZvY3VzZWQuIFRoaXMgbWVhbnMgdGhhdCB0aGUgaW5wdXQgZXZlbnQgXCJibHVyKClcIiBzZXQgaW4gbGlzdGVuZXJzRm9yR3JhYlN0YXRlIHdpbGxcclxuICogbm90IGp1c3QgZmlyZSB3aGVuIG5hdmlnYXRpbmcgdGhyb3VnaCB0aGUgc2ltLCBidXQgYWxzbyB1cG9uIGFjdGl2YXRpb24uIFRoaXMgd2VpcmRuZXNzIGlzIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZVxyXG4gKiBpbnB1dCBldmVudCBcImZvY3VzKClcIiBpcyBjYWxsZWQgYW5kIHN1cHBvcnRlZCBmb3Igd2l0aGluIGxpc3RlbmVyc0ZvckRyYWdTdGF0ZVxyXG4gKlxyXG4gKiBOT1RFOiBGb3IgUGhFVC1pTyBpbnN0cnVtZW50YXRpb24sIEdyYWJEcmFnSW50ZXJhY3Rpb24uZW5hYmxlZFByb3BlcnR5IGlzIHBoZXRpb1JlYWRPbmx5LCBpdCBtYWtlcyB0aGUgbW9zdCBzZW5zZVxyXG4gKiB0byBsaW5rIHRvIHdoYXRldmVyIE5vZGUgY29udHJvbCdzIHRoZSBtb3VzZS90b3VjaCBpbnB1dCBhbmQgdG9nZ2xlIGdyYWIgZHJhZyBlbmFibGVkIHdoZW4gdGhhdCBOb2RlJ3MgaW5wdXRFbmFibGVkXHJcbiAqIGNoYW5nZXMuIEZvciBleGFtcGxlIHNlZSBGcmljdGlvbi5cclxuICpcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBFbmFibGVkQ29tcG9uZW50IGZyb20gJy4uLy4uLy4uL2F4b24vanMvRW5hYmxlZENvbXBvbmVudC5qcyc7XHJcbmltcG9ydCBhc3NlcnRIYXNQcm9wZXJ0aWVzIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9hc3NlcnRIYXNQcm9wZXJ0aWVzLmpzJztcclxuaW1wb3J0IGdldEdsb2JhbCBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvZ2V0R2xvYmFsLmpzJztcclxuaW1wb3J0IG1lcmdlIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9tZXJnZS5qcyc7XHJcbmltcG9ydCBTdHJpbmdVdGlscyBmcm9tICcuLi8uLi8uLi9waGV0Y29tbW9uL2pzL3V0aWwvU3RyaW5nVXRpbHMuanMnO1xyXG5pbXBvcnQgeyBIaWdobGlnaHRGcm9tTm9kZSwgSGlnaGxpZ2h0UGF0aCwgS2V5Ym9hcmRMaXN0ZW5lciwgTm9kZSwgUERPTVBlZXIsIFByZXNzTGlzdGVuZXIsIFZvaWNpbmcgfSBmcm9tICcuLi8uLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgQXJpYUxpdmVBbm5vdW5jZXIgZnJvbSAnLi4vLi4vLi4vdXR0ZXJhbmNlLXF1ZXVlL2pzL0FyaWFMaXZlQW5ub3VuY2VyLmpzJztcclxuaW1wb3J0IFJlc3BvbnNlUGFja2V0IGZyb20gJy4uLy4uLy4uL3V0dGVyYW5jZS1xdWV1ZS9qcy9SZXNwb25zZVBhY2tldC5qcyc7XHJcbmltcG9ydCBVdHRlcmFuY2UgZnJvbSAnLi4vLi4vLi4vdXR0ZXJhbmNlLXF1ZXVlL2pzL1V0dGVyYW5jZS5qcyc7XHJcbmltcG9ydCBzY2VuZXJ5UGhldCBmcm9tICcuLi9zY2VuZXJ5UGhldC5qcyc7XHJcbmltcG9ydCBTY2VuZXJ5UGhldFN0cmluZ3MgZnJvbSAnLi4vU2NlbmVyeVBoZXRTdHJpbmdzLmpzJztcclxuaW1wb3J0IEdyYWJSZWxlYXNlQ3VlTm9kZSBmcm9tICcuL25vZGVzL0dyYWJSZWxlYXNlQ3VlTm9kZS5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgZ3JhYlBhdHRlcm5TdHJpbmcgPSBTY2VuZXJ5UGhldFN0cmluZ3MuYTExeS5ncmFiRHJhZy5ncmFiUGF0dGVybjtcclxuY29uc3QgZ2VzdHVyZUhlbHBUZXh0UGF0dGVyblN0cmluZyA9IFNjZW5lcnlQaGV0U3RyaW5ncy5hMTF5LmdyYWJEcmFnLmdlc3R1cmVIZWxwVGV4dFBhdHRlcm47XHJcbmNvbnN0IG1vdmFibGVTdHJpbmcgPSBTY2VuZXJ5UGhldFN0cmluZ3MuYTExeS5ncmFiRHJhZy5tb3ZhYmxlO1xyXG5jb25zdCBidXR0b25TdHJpbmcgPSBTY2VuZXJ5UGhldFN0cmluZ3MuYTExeS5ncmFiRHJhZy5idXR0b247XHJcbmNvbnN0IGRlZmF1bHRPYmplY3RUb0dyYWJTdHJpbmcgPSBTY2VuZXJ5UGhldFN0cmluZ3MuYTExeS5ncmFiRHJhZy5kZWZhdWx0T2JqZWN0VG9HcmFiO1xyXG5jb25zdCByZWxlYXNlZFN0cmluZyA9IFNjZW5lcnlQaGV0U3RyaW5ncy5hMTF5LmdyYWJEcmFnLnJlbGVhc2VkO1xyXG5cclxuY2xhc3MgR3JhYkRyYWdJbnRlcmFjdGlvbiBleHRlbmRzIEVuYWJsZWRDb21wb25lbnQge1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0ge05vZGV9IG5vZGUgLSB3aWxsIGJlIG11dGF0ZWQgd2l0aCBhMTF5IG9wdGlvbnMgdG8gaGF2ZSB0aGUgZ3JhYi9kcmFnIGZ1bmN0aW9uYWxpdHkgaW4gdGhlIFBET01cclxuICAgKiBAcGFyYW0ge0tleWJvYXJkRHJhZ0xpc3RlbmVyfSBrZXlib2FyZERyYWdMaXN0ZW5lciAtIGFkZGVkIHRvIHRoZSBOb2RlIHdoZW4gaXQgaXMgZHJhZ2dhYmxlXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKCBub2RlLCBrZXlib2FyZERyYWdMaXN0ZW5lciwgb3B0aW9ucyApIHtcclxuICAgIG9wdGlvbnMgPSBtZXJnZSgge1xyXG5cclxuICAgICAgLy8gQSBzdHJpbmcgdGhhdCBpcyBmaWxsZWQgaW4gdG8gdGhlIGFwcHJvcHJpYXRlIGJ1dHRvbiBsYWJlbFxyXG4gICAgICBvYmplY3RUb0dyYWJTdHJpbmc6IGRlZmF1bHRPYmplY3RUb0dyYWJTdHJpbmcsXHJcblxyXG4gICAgICAvLyB7c3RyaW5nfG51bGx9IC0gaWYgbm90IHByb3ZpZGVkLCBhIGRlZmF1bHQgd2lsbCBiZSBhcHBsaWVkLCBzZWUgdGhpcy5ncmFiYmFibGVBY2Nlc3NpYmxlTmFtZVxyXG4gICAgICBncmFiYmFibGVBY2Nlc3NpYmxlTmFtZTogbnVsbCxcclxuXHJcbiAgICAgIC8vIHtmdW5jdGlvbihTY2VuZXJ5RXZlbnQpOn0gLSBjYWxsZWQgd2hlbiB0aGUgbm9kZSBpcyBcImdyYWJiZWRcIiAod2hlbiB0aGUgZ3JhYiBidXR0b24gZmlyZXMpOyBidXR0b24gLT4gZHJhZ2dhYmxlXHJcbiAgICAgIG9uR3JhYjogXy5ub29wLFxyXG5cclxuICAgICAgLy8ge2Z1bmN0aW9ufSAtIGNhbGxlZCB3aGVuIHRoZSBub2RlIGlzIFwicmVsZWFzZWRcIiAod2hlbiB0aGUgZHJhZ2dhYmxlIGlzIFwibGV0IGdvXCIpOyBkcmFnZ2FibGUgLT4gYnV0dG9uXHJcbiAgICAgIG9uUmVsZWFzZTogXy5ub29wLFxyXG5cclxuICAgICAgLy8ge2Z1bmN0aW9ufSAtIHNpbWlsYXIgdG8gb25SZWxlYXNlLCBidXQgY2FsbGVkIHdoZW5ldmVyIHRoZSBpbnRlcmFjdGlvbiBzdGF0ZSBpcyBzZXQgdG8gXCJncmFiXCIuIFVzZWZ1bCBmb3IgYWRkaW5nXHJcbiAgICAgIC8vIGFjY2Vzc2libGUgY29udGVudCBmb3IgdGhlIGludGVyYWN0aW9uIHN0YXRlIGluIGEgd2F5IHRoYXQgY2FuJ3QgYmUgYWNoaWV2ZWQgd2l0aCBvcHRpb25zLCBsaWtlIHNldHRpbmdcclxuICAgICAgLy8gcGRvbSBhdHRyaWJ1dGVzLlxyXG4gICAgICBvbkdyYWJiYWJsZTogXy5ub29wLFxyXG5cclxuICAgICAgLy8ge2Z1bmN0aW9ufSAtIHNpbWlsYXIgdG8gb25HcmFiLCBidXQgY2FsbGVkIHdoZW5ldmVyIHRoZSBpbnRlcmFjdGlvbiBzdGF0ZSBpcyBzZXQgdG8gXCJkcmFnXCIuIFVzZWZ1bCBmb3IgYWRkaW5nXHJcbiAgICAgIC8vIGFjY2Vzc2libGUgY29udGVudCBmb3IgdGhlIGludGVyYWN0aW9uIHN0YXRlIGluIGEgd2F5IHRoYXQgY2FuJ3QgYmUgYWNoaWV2ZWQgd2l0aCBvcHRpb25zLCBsaWtlIHNldHRpbmdcclxuICAgICAgLy8gcGRvbSBhdHRyaWJ1dGVzLlxyXG4gICAgICBvbkRyYWdnYWJsZTogXy5ub29wLFxyXG5cclxuICAgICAgLy8ge09iamVjdH0gLSBOb2RlIG9wdGlvbnMgcGFzc2VkIHRvIHRoZSBncmFiYmFibGUgY3JlYXRlZCBmb3IgdGhlIFBET00sIGZpbGxlZCBpbiB3aXRoIGRlZmF1bHRzIGJlbG93XHJcbiAgICAgIGdyYWJiYWJsZU9wdGlvbnM6IHtcclxuICAgICAgICBhcHBlbmREZXNjcmlwdGlvbjogdHJ1ZSAvLyBpbiBnZW5lcmFsLCB0aGUgaGVscCB0ZXh0IGlzIGFmdGVyIHRoZSBncmFiYmFibGVcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIHtPYmplY3R9IC0gVG8gcGFzcyBpbiBvcHRpb25zIHRvIHRoZSBjdWUuIFRoaXMgaXMgYSBzY2VuZXJ5IE5vZGUgYW5kIHlvdSBjYW4gcGFzcyBpdCBvcHRpb25zIHN1cHBvcnRlZCBieVxyXG4gICAgICAvLyB0aGF0IHR5cGUuIFdoZW4gcG9zaXRpb25pbmcgdGhpcyBub2RlLCBpdCBpcyBpbiB0aGUgdGFyZ2V0IE5vZGUncyBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgICAgZ3JhYkN1ZU9wdGlvbnM6IHt9LFxyXG5cclxuICAgICAgLy8ge09iamVjdH0gLSBOb2RlIG9wdGlvbnMgcGFzc2VkIHRvIHRoZSBkcmFnZ2FibGUgY3JlYXRlZCBmb3IgdGhlIFBET00sIGZpbGxlZCBpbiB3aXRoIGRlZmF1bHRzIGJlbG93XHJcbiAgICAgIGRyYWdnYWJsZU9wdGlvbnM6IHt9LFxyXG5cclxuICAgICAgLy8ge251bGx8Tm9kZX0gLSBPcHRpb25hbCBub2RlIHRvIGN1ZSB0aGUgZHJhZyBpbnRlcmFjdGlvbiBvbmNlIHN1Y2Nlc3NmdWxseSB1cGRhdGVkLlxyXG4gICAgICBkcmFnQ3VlTm9kZTogbnVsbCxcclxuXHJcbiAgICAgIC8vIHtPYmplY3RbXX0gLSBHcmFiRHJhZ0ludGVyYWN0aW9uIHN3YXBzIHRoZSBQRE9NIHN0cnVjdHVyZSBmb3IgYSBnaXZlbiBub2RlIGJldHdlZW4gYSBncmFiYmFibGUgc3RhdGUsIGFuZFxyXG4gICAgICAvLyBkcmFnZ2FibGUgb25lLiBXZSBuZWVkIHRvIGtlZXAgdHJhY2sgb2YgYWxsIGxpc3RlbmVycyB0aGF0IG5lZWQgdG8gYmUgYXR0YWNoZWQgdG8gZWFjaCBQRE9NIG1hbmlmZXN0YXRpb24uXHJcbiAgICAgIC8vIE5vdGU6IHdoZW4gdGhlc2UgYXJlIHJlbW92ZWQgd2hpbGUgY29udmVydGluZyB0by9mcm9tIGdyYWJiYWJsZS9kcmFnZ2FibGUsIHRoZXkgYXJlIGludGVycnVwdGVkLiBPdGhlclxyXG4gICAgICAvLyBsaXN0ZW5lcnMgdGhhdCBhcmUgYXR0YWNoZWQgdG8gdGhpcy5ub2RlIGJ1dCBhcmVuJ3QgaW4gdGhlc2UgbGlzdHMgd2lsbCBub3QgYmUgaW50ZXJydXB0ZWQuIFRoZSBncmFiYmFibGVcclxuICAgICAgLy8gd2lsbCBibHVyKCkgd2hlbiBhY3RpdmF0ZWQgZnJvbSBhIGdyYWJiYWJsZSB0byBhIGRyYWdnYWJsZS4gVGhlIGRyYWdnYWJsZSB3aWxsIGZvY3VzIHdoZW4gYWN0aXZhdGVkXHJcbiAgICAgIC8vIGZyb20gZ3JhYmJhYmxlLlxyXG4gICAgICBsaXN0ZW5lcnNGb3JEcmFnU3RhdGU6IFtdLFxyXG4gICAgICBsaXN0ZW5lcnNGb3JHcmFiU3RhdGU6IFtdLFxyXG5cclxuICAgICAgLy8ge2Jvb2xlYW59IC0gaWYgdGhpcyBpbnN0YW5jZSB3aWxsIHN1cHBvcnQgc3BlY2lmaWMgZ2VzdHVyZSBkZXNjcmlwdGlvbiBiZWhhdmlvci5cclxuICAgICAgc3VwcG9ydHNHZXN0dXJlRGVzY3JpcHRpb246IGdldEdsb2JhbCggJ3BoZXQuam9pc3Quc2ltLnN1cHBvcnRzR2VzdHVyZURlc2NyaXB0aW9uJyApLFxyXG5cclxuICAgICAgLy8ge2Z1bmN0aW9uKG51bWJlck9mR3JhYnM6bnVtYmVyfSAtIEFkZCBhbiBhcmlhLWRlc2NyaWJlZGJ5IGxpbmsgYmV0d2VlbiB0aGUgZGVzY3JpcHRpb25cclxuICAgICAgLy8gc2libGluZyBhbmQgdGhlIHByaW1hcnkgc2libGluZywgb25seSB3aGVuIGdyYWJiYWJsZS4gQnkgZGVmYXVsdCB0aGlzIHNob3VsZCBvbmx5IGJlIGRvbmUgd2hlbiBzdXBwb3J0aW5nXHJcbiAgICAgIC8vIGdlc3R1cmUgaW50ZXJhY3RpdmUgZGVzY3JpcHRpb24gYmVmb3JlIHR3byBzdWNjZXNzIGdyYWJzLiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoIG9uZSBwYXJhbWV0ZXJzOiB0aGUgbnVtYmVyIG9mXHJcbiAgICAgIC8vIHN1Y2Nlc3NmdWwgZ3JhYnMgdGhhdCBoYXMgb2NjdXJyZWQgdGh1cyBmYXIuXHJcbiAgICAgIGFkZEFyaWFEZXNjcmliZWRieVByZWRpY2F0ZTogbnVtYmVyT2ZHcmFicyA9PiBvcHRpb25zLnN1cHBvcnRzR2VzdHVyZURlc2NyaXB0aW9uICYmIG51bWJlck9mR3JhYnMgPCAyLFxyXG5cclxuICAgICAgLy8ge3N0cmluZ30gLSBIZWxwIHRleHQgaXMgdHJlYXRlZCBhcyB0aGUgc2FtZSBmb3IgdGhlIGdyYWJiYWJsZSBhbmQgZHJhZ2dhYmxlIGl0ZW1zLCBidXQgaXMgZGlmZmVyZW50IGJhc2VkIG9uIGlmIHRoZVxyXG4gICAgICAvLyBydW50aW1lIGlzIHN1cHBvcnRpbmcgZ2VzdHVyZSBpbnRlcmFjdGl2ZSBkZXNjcmlwdGlvbi4gRXZlbiB0aG91Z2ggXCJ0ZWNobmljYWxseVwiIHRoZXJlIGlzIG5vIHdheSB0byBhY2Nlc3MgdGhlXHJcbiAgICAgIC8vIGhlbHAgdGV4dCB3aGVuIHRoaXMgTm9kZSBpcyBpbiB0aGUgZHJhZ2dhYmxlIHN0YXRlLCB0aGUgaGVscCB0ZXh0IGlzIHN0aWxsIGluIHRoZSBQRE9NLlxyXG4gICAgICBrZXlib2FyZEhlbHBUZXh0OiBudWxsLFxyXG5cclxuICAgICAgLy8gY29udHJvbHMgd2hldGhlciBvciBub3QgdG8gc2hvdyB0aGUgXCJHcmFiXCIgY3VlIG5vZGUgdGhhdCBpcyBkaXNwbGF5ZWQgb24gZm9jdXMgLSBieVxyXG4gICAgICAvLyBkZWZhdWx0IGl0IHdpbGwgYmUgc2hvd24gb24gZm9jdXMgdW50aWwgaXQgaGFzIGJlZW4gc3VjY2Vzc2Z1bGx5IGdyYWJiZWQgd2l0aCBhIGtleWJvYXJkXHJcbiAgICAgIHNob3dHcmFiQ3VlTm9kZTogKCkgPT4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm51bWJlck9mS2V5Ym9hcmRHcmFicyA8IDEgJiYgbm9kZS5pbnB1dEVuYWJsZWQ7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyB3aGV0aGVyIG9yIG5vdCB0byBkaXNwbGF5IHRoZSBOb2RlIGZvciB0aGUgXCJEcmFnXCIgY3VlIG5vZGUgb25jZSB0aGUgZ3JhYmJhYmxlIE5vZGUgaGFzIGJlZW4gcGlja2VkIHVwLFxyXG4gICAgICAvLyBpZiBhIG9wdGlvbnMuZHJhZ0N1ZU5vZGUgaXMgc3BlY2lmaWVkLiBUaGlzIHdpbGwgb25seSBiZSBzaG93biBpZiBkcmFnZ2FibGUgbm9kZSBoYXMgZm9jdXNcclxuICAgICAgLy8gZnJvbSBhbHRlcm5hdGl2ZSBpbnB1dFxyXG4gICAgICBzaG93RHJhZ0N1ZU5vZGU6ICgpID0+IHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIEVuYWJsZWRDb21wb25lbnRcclxuICAgICAgcGhldGlvRW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkOiB0cnVlLFxyXG4gICAgICBlbmFibGVkUHJvcGVydHlPcHRpb25zOiB7XHJcblxyXG4gICAgICAgIC8vIEl0IGlzIGJlc3QgdG8gd2lyZSB1cCBncmFiIGRyYWcgZW5hYmxlZCB0byBiZSBpbiBzeW5jIHdpdGggbW91c2UvdG91Y2ggaW5wdXRFbmFibGVkIChpbnN0ZWFkIG9mIGhhdmluZyBib3RoXHJcbiAgICAgICAgLy8gZWRpdGFibGUgYnkgUGhFVC1pTykuXHJcbiAgICAgICAgcGhldGlvUmVhZE9ubHk6IHRydWUsXHJcbiAgICAgICAgcGhldGlvRmVhdHVyZWQ6IGZhbHNlXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyB7VGFuZGVtfSAtIEZvciBpbnN0cnVtZW50aW5nXHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLlJFUVVJUkVELFxyXG4gICAgICB0YW5kZW1OYW1lU3VmZml4OiAnR3JhYkRyYWdJbnRlcmFjdGlvbidcclxuICAgIH0sIG9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyBhIHNlY29uZCBibG9jayBmb3Igb3B0aW9ucyB0aGF0IHVzZSBvdGhlciBvcHRpb25zLCB0aGVyZWZvcmUgbmVlZGluZyB0aGUgZGVmYXVsdHMgdG8gYmUgZmlsbGVkIGluXHJcbiAgICBvcHRpb25zID0gbWVyZ2UoIHtcclxuXHJcbiAgICAgIC8vIHtzdHJpbmd9IC0gbGlrZSBrZXlib2FyZEhlbHBUZXh0IGJ1dCB3aGVuIHN1cHBvcnRpbmcgZ2VzdHVyZSBpbnRlcmFjdGl2ZSBkZXNjcmlwdGlvblxyXG4gICAgICBnZXN0dXJlSGVscFRleHQ6IFN0cmluZ1V0aWxzLmZpbGxJbiggZ2VzdHVyZUhlbHBUZXh0UGF0dGVyblN0cmluZywge1xyXG4gICAgICAgIG9iamVjdFRvR3JhYjogb3B0aW9ucy5vYmplY3RUb0dyYWJTdHJpbmdcclxuICAgICAgfSApXHJcbiAgICB9LCBvcHRpb25zICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIG9wdGlvbnMuc3VwcG9ydHNHZXN0dXJlRGVzY3JpcHRpb24gPT09ICdib29sZWFuJywgJ3N1cHBvcnRzR2VzdHVyZURlc2NyaXB0aW9uIG11c3QgYmUgcHJvdmlkZWQnICk7XHJcblxyXG4gICAgaWYgKCBub2RlLmZvY3VzSGlnaGxpZ2h0TGF5ZXJhYmxlICkge1xyXG5cclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggbm9kZS5mb2N1c0hpZ2hsaWdodCxcclxuICAgICAgICAnaWYgZm9jdXNIaWdobGlnaHRMYXllcmFibGUsIHRoZSBoaWdobGlnaHQgbXVzdCBiZSBzZXQgdG8gdGhlIG5vZGUgYmVmb3JlIGNvbnN0cnVjdGluZyB0aGUgZ3JhYi9kcmFnIGludGVyYWN0aW9uLicgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggbm9kZS5mb2N1c0hpZ2hsaWdodC5wYXJlbnQsICdpZiBmb2N1c0hpZ2hsaWdodExheWVyYWJsZSwgdGhlIGhpZ2hsaWdodCBtdXN0IGJlIGFkZGVkIHRvIHRoZSAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzY2VuZSBncmFwaCBiZWZvcmUgZ3JhYi9kcmFnIGNvbnN0cnVjdGlvbi4nICk7XHJcbiAgICB9XHJcbiAgICBpZiAoIG5vZGUuaW50ZXJhY3RpdmVIaWdobGlnaHRMYXllcmFibGUgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIG5vZGUuaW50ZXJhY3RpdmVIaWdobGlnaHQsXHJcbiAgICAgICAgJ0FuIGludGVyYWN0aXZlIGhpZ2hsaWdodCBtdXN0IGJlIHNldCB0byB0aGUgTm9kZSBiZWZvcmUgY29uc3RydWNpb24gd2hlbiB1c2luZyBpbnRlcmFjdGl2ZUhpZ2hsaWdodExheWVyYWJsZScgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggbm9kZS5pbnRlcmFjdGl2ZUhpZ2hsaWdodC5wYXJlbnQsXHJcbiAgICAgICAgJ2lmIGludGVyYWN0aXZlSGlnaGxpZ2h0TGF5ZXJhYmxlLCB0aGUgaGlnaGxpZ2h0IG11c3QgYmUgYWRkZWQgdG8gdGhlIHNjZW5lIGdyYXBoIGJlZm9yZSBjb25zdHJ1Y3Rpb24nICk7XHJcbiAgICB9XHJcbiAgICBpZiAoIG5vZGUuZm9jdXNIaWdobGlnaHQgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIG5vZGUuZm9jdXNIaWdobGlnaHQgaW5zdGFuY2VvZiBwaGV0LnNjZW5lcnkuSGlnaGxpZ2h0UGF0aCxcclxuICAgICAgICAnaWYgcHJvdmlkZWQsIGZvY3VzSGlnaGxpZ2h0IG11c3QgYmUgYSBQYXRoIHRvIHN1cHBvcnQgaGlnaGxpZ2h0Q2hhbmdlZEVtaXR0ZXInICk7XHJcbiAgICB9XHJcbiAgICBpZiAoIG5vZGUuaW50ZXJhY3RpdmVIaWdobGlnaHQgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIG5vZGUuaW50ZXJhY3RpdmVIaWdobGlnaHQgaW5zdGFuY2VvZiBwaGV0LnNjZW5lcnkuSGlnaGxpZ2h0UGF0aCxcclxuICAgICAgICAnaWYgcHJvdmlkZWQsIGludGVyYWN0aXZlSGlnaGxpZ2h0IG11c3QgYmUgYSBQYXRoIHRvIHN1cHBvcnQgaGlnaGxpZ2h0Q2hhbmdlZEVtaXR0ZXInICk7XHJcbiAgICB9XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2Ygb3B0aW9ucy5vbkdyYWIgPT09ICdmdW5jdGlvbicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiBvcHRpb25zLm9uUmVsZWFzZSA9PT0gJ2Z1bmN0aW9uJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIG9wdGlvbnMub25HcmFiYmFibGUgPT09ICdmdW5jdGlvbicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiBvcHRpb25zLm9uRHJhZ2dhYmxlID09PSAnZnVuY3Rpb24nICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2Ygb3B0aW9ucy5zaG93RHJhZ0N1ZU5vZGUgPT09ICdmdW5jdGlvbicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiBvcHRpb25zLnNob3dHcmFiQ3VlTm9kZSA9PT0gJ2Z1bmN0aW9uJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggQXJyYXkuaXNBcnJheSggb3B0aW9ucy5saXN0ZW5lcnNGb3JEcmFnU3RhdGUgKSApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggQXJyYXkuaXNBcnJheSggb3B0aW9ucy5saXN0ZW5lcnNGb3JHcmFiU3RhdGUgKSApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5ncmFiYmFibGVPcHRpb25zIGluc3RhbmNlb2YgT2JqZWN0ICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLmdyYWJDdWVPcHRpb25zIGluc3RhbmNlb2YgT2JqZWN0ICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLmdyYWJDdWVPcHRpb25zLnZpc2libGUgPT09IHVuZGVmaW5lZCwgJ1Nob3VsZCBub3Qgc2V0IHZpc2liaWxpdHkgb2YgdGhlIGN1ZSBub2RlJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5kcmFnZ2FibGVPcHRpb25zIGluc3RhbmNlb2YgT2JqZWN0ICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhb3B0aW9ucy5saXN0ZW5lcnNGb3JEcmFnU3RhdGUuaW5jbHVkZXMoIGtleWJvYXJkRHJhZ0xpc3RlbmVyICksICdHcmFiRHJhZ0ludGVyYWN0aW9uIGFkZHMgdGhlIEtleWJvYXJkRHJhZ0xpc3RlbmVyIHRvIGxpc3RlbmVyc0ZvckRyYWdTdGF0ZScgKTtcclxuICAgIGlmICggb3B0aW9ucy5kcmFnQ3VlTm9kZSAhPT0gbnVsbCApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5kcmFnQ3VlTm9kZSBpbnN0YW5jZW9mIE5vZGUgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggIW9wdGlvbnMuZHJhZ0N1ZU5vZGUucGFyZW50LCAnR3JhYkRyYWdJbnRlcmFjdGlvbiBhZGRzIGRyYWdDdWVOb2RlIHRvIGZvY3VzSGlnaGxpZ2h0JyApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLmRyYWdDdWVOb2RlLnZpc2libGUgPT09IHRydWUsICdkcmFnQ3VlTm9kZSBzaG91bGQgYmUgdmlzaWJsZSB0byBiZWdpbiB3aXRoJyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdyYWJEcmFnSW50ZXJhY3Rpb24gaGFzIGl0cyBvd24gQVBJIGZvciBkZXNjcmlwdGlvbiBjb250ZW50LlxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIW9wdGlvbnMuZ3JhYmJhYmxlT3B0aW9ucy5kZXNjcmlwdGlvbkNvbnRlbnQsXHJcbiAgICAgICdzZXQgZ3JhYmJhYmxlT3B0aW9ucy5kZXNjcmlwdGlvbkNvbnRlbnQgdGhyb3VnaCBjdXN0b20gR3JhYi9EcmFnIEFQSSwgKHNlZSBrZXlib2FyZEhlbHBUZXh0IGFuZCBnZXN0dXJlSGVscFRleHQgb3B0aW9uKS4nICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhb3B0aW9ucy5ncmFiYmFibGVPcHRpb25zLmhlbHBUZXh0LFxyXG4gICAgICAnc2V0IGdyYWJiYWJsZU9wdGlvbnMuaGVscFRleHQgdGhyb3VnaCBjdXN0b20gR3JhYi9EcmFnIEFQSSwgKHNlZSBrZXlib2FyZEhlbHBUZXh0IGFuZCBnZXN0dXJlSGVscFRleHQgb3B0aW9uKS4nICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhb3B0aW9ucy5ncmFiYmFibGVPcHRpb25zLmRlc2NyaXB0aW9uVGFnTmFtZSxcclxuICAgICAgJ3NldCBncmFiYmFibGVPcHRpb25zLmRlc2NyaXB0aW9uVGFnTmFtZSB0aHJvdWdoIGN1c3RvbSBHcmFiL0RyYWcgQVBJLCAoc2VlIGtleWJvYXJkSGVscFRleHQgYW5kIGdlc3R1cmVIZWxwVGV4dCBvcHRpb24pLicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFvcHRpb25zLmRyYWdnYWJsZU9wdGlvbnMuZGVzY3JpcHRpb25UYWdOYW1lLFxyXG4gICAgICAnc2V0IGRyYWdnYWJsZU9wdGlvbnMuZGVzY3JpcHRpb25UYWdOYW1lIHRocm91Z2ggY3VzdG9tIEdyYWIvRHJhZyBBUEksIChzZWUga2V5Ym9hcmRIZWxwVGV4dCBhbmQgZ2VzdHVyZUhlbHBUZXh0IG9wdGlvbikuJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIW9wdGlvbnMuZHJhZ2dhYmxlT3B0aW9ucy5kZXNjcmlwdGlvbkNvbnRlbnQsXHJcbiAgICAgICdzZXQgZHJhZ2dhYmxlT3B0aW9ucy5kZXNjcmlwdGlvbkNvbnRlbnQgdGhyb3VnaCBjdXN0b20gR3JhYi9EcmFnIEFQSSwgKHNlZSBrZXlib2FyZEhlbHBUZXh0IGFuZCBnZXN0dXJlSGVscFRleHQgb3B0aW9uKS4nICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhb3B0aW9ucy5kcmFnZ2FibGVPcHRpb25zLmhlbHBUZXh0LFxyXG4gICAgICAnc2V0IGRyYWdnYWJsZU9wdGlvbnMuaGVscFRleHQgdGhyb3VnaCBjdXN0b20gR3JhYi9EcmFnIEFQSSwgKHNlZSBrZXlib2FyZEhlbHBUZXh0IGFuZCBnZXN0dXJlSGVscFRleHQgb3B0aW9uKS4nICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIW9wdGlvbnMuZHJhZ2dhYmxlT3B0aW9ucy5hY2Nlc3NpYmxlTmFtZSwgJ0dyYWJEcmFnSW50ZXJhY3Rpb24gc2V0cyBpdHMgb3duIGFjY2Vzc2libGUgbmFtZSwgc2VlIG9iamVjdFRvR3JhYlN0cmluZycgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFvcHRpb25zLmRyYWdnYWJsZU9wdGlvbnMuaW5uZXJDb250ZW50LCAnR3JhYkRyYWdJbnRlcmFjdGlvbiBzZXRzIGl0cyBvd24gaW5uZXJDb250ZW50LCBzZWUgb2JqZWN0VG9HcmFiU3RyaW5nJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIW9wdGlvbnMuZHJhZ2dhYmxlT3B0aW9ucy5hcmlhTGFiZWwsICdHcmFiRHJhZ0ludGVyYWN0aW9uIHNldHMgaXRzIG93biBhcmlhTGFiZWwsIHNlZSBvYmplY3RUb0dyYWJTdHJpbmcnICk7XHJcblxyXG4gICAgc3VwZXIoIG9wdGlvbnMgKTtcclxuXHJcbiAgICBvcHRpb25zLmRyYWdnYWJsZU9wdGlvbnMgPSBtZXJnZSgge1xyXG4gICAgICB0YWdOYW1lOiAnZGl2JyxcclxuICAgICAgYXJpYVJvbGU6ICdhcHBsaWNhdGlvbicsXHJcblxyXG4gICAgICAvLyB0byBjYW5jZWwgb3V0IGdyYWJiYWJsZVxyXG4gICAgICBjb250YWluZXJUYWdOYW1lOiBudWxsXHJcbiAgICB9LCBvcHRpb25zLmRyYWdnYWJsZU9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZVxyXG4gICAgdGhpcy5kcmFnZ2FibGVBY2Nlc3NpYmxlTmFtZSA9IG9wdGlvbnMub2JqZWN0VG9HcmFiU3RyaW5nO1xyXG4gICAgb3B0aW9ucy5kcmFnZ2FibGVPcHRpb25zLmlubmVyQ29udGVudCA9IHRoaXMuZHJhZ2dhYmxlQWNjZXNzaWJsZU5hbWU7XHJcbiAgICBvcHRpb25zLmRyYWdnYWJsZU9wdGlvbnMuYXJpYUxhYmVsID0gdGhpcy5kcmFnZ2FibGVBY2Nlc3NpYmxlTmFtZTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhb3B0aW9ucy5ncmFiYmFibGVPcHRpb25zLmFjY2Vzc2libGVOYW1lLCAnR3JhYkRyYWdJbnRlcmFjdGlvbiBzZXRzIGl0cyBvd24gYWNjZXNzaWJsZSBuYW1lLCBzZWUgb2JqZWN0VG9HcmFiU3RyaW5nJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIW9wdGlvbnMuZ3JhYmJhYmxlT3B0aW9ucy5pbm5lckNvbnRlbnQsICdHcmFiRHJhZ0ludGVyYWN0aW9uIHNldHMgaXRzIG93biBpbm5lckNvbnRlbnQsIHNlZSBvYmplY3RUb0dyYWJTdHJpbmcnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhb3B0aW9ucy5ncmFiYmFibGVPcHRpb25zLmFyaWFMYWJlbCwgJ0dyYWJEcmFnSW50ZXJhY3Rpb24gc2V0cyBpdHMgb3duIGFyaWFMYWJlbCwgc2VlIG9iamVjdFRvR3JhYlN0cmluZycgKTtcclxuXHJcbiAgICBvcHRpb25zLmdyYWJiYWJsZU9wdGlvbnMgPSBtZXJnZSgge1xyXG4gICAgICBjb250YWluZXJUYWdOYW1lOiAnZGl2JyxcclxuICAgICAgYXJpYVJvbGU6IG51bGwsXHJcbiAgICAgIHRhZ05hbWU6ICdidXR0b24nLFxyXG5cclxuICAgICAgLy8gcG9zaXRpb24gdGhlIFBET00gZWxlbWVudHMgd2hlbiBncmFiYmFibGUgZm9yIGRyYWcgYW5kIGRyb3Agb24gdG91Y2gtYmFzZWQgc2NyZWVuIHJlYWRlcnNcclxuICAgICAgcG9zaXRpb25JblBET006IHRydWUsXHJcblxyXG4gICAgICAvLyB7c3RyaW5nfVxyXG4gICAgICBhY2Nlc3NpYmxlTmFtZTogbnVsbFxyXG4gICAgfSwgb3B0aW9ucy5ncmFiYmFibGVPcHRpb25zICk7XHJcblxyXG4gICAgLy8gQHByaXZhdGVcclxuICAgIHRoaXMuZ3JhYmJhYmxlQWNjZXNzaWJsZU5hbWUgPSBvcHRpb25zLmdyYWJiYWJsZUFjY2Vzc2libGVOYW1lIHx8IC8vIGlmIGEgcHJvdmlkZWQgb3B0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCBvcHRpb25zLnN1cHBvcnRzR2VzdHVyZURlc2NyaXB0aW9uID8gb3B0aW9ucy5vYmplY3RUb0dyYWJTdHJpbmcgOiAvLyBvdGhlcndpc2UgaWYgc3VwcG9ydGluZyBnZXN0dXJlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdHJpbmdVdGlscy5maWxsSW4oIGdyYWJQYXR0ZXJuU3RyaW5nLCB7IC8vIGRlZmF1bHQgY2FzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RUb0dyYWI6IG9wdGlvbnMub2JqZWN0VG9HcmFiU3RyaW5nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9ICkgKTtcclxuICAgIG9wdGlvbnMuZ3JhYmJhYmxlT3B0aW9ucy5pbm5lckNvbnRlbnQgPSB0aGlzLmdyYWJiYWJsZUFjY2Vzc2libGVOYW1lO1xyXG5cclxuICAgIC8vIFNldHRpbmcgdGhlIGFyaWEtbGFiZWwgb24gdGhlIGdyYWJiYWJsZSBlbGVtZW50IGZpeGVzIGEgYnVnIHdpdGggVm9pY2VPdmVyIGluIFNhZmFyaSB3aGVyZSB0aGUgYXJpYSByb2xlXHJcbiAgICAvLyBmcm9tIHRoZSBkcmFnZ2FibGUgc3RhdGUgaXMgbmV2ZXIgY2xlYXJlZCwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5LXBoZXQvaXNzdWVzLzY4OFxyXG4gICAgb3B0aW9ucy5ncmFiYmFibGVPcHRpb25zLmFyaWFMYWJlbCA9IHRoaXMuZ3JhYmJhYmxlQWNjZXNzaWJsZU5hbWU7XHJcblxyXG4gICAgLy8gQHByaXZhdGVcclxuICAgIHRoaXMuZ3JhYmJhYmxlID0gdHJ1ZTsgLy8gSWYgZmFsc2UsIHRoZW4gaW5zdGVhZCB0aGlzIHR5cGUgaXMgaW4gdGhlIGRyYWdnYWJsZSBpbnRlcmFjdGlvbiBzdGF0ZS5cclxuICAgIHRoaXMubm9kZSA9IG5vZGU7XHJcbiAgICB0aGlzLmdyYWJiYWJsZU9wdGlvbnMgPSBvcHRpb25zLmdyYWJiYWJsZU9wdGlvbnM7XHJcbiAgICB0aGlzLmRyYWdnYWJsZU9wdGlvbnMgPSBvcHRpb25zLmRyYWdnYWJsZU9wdGlvbnM7XHJcbiAgICB0aGlzLmRyYWdDdWVOb2RlID0gb3B0aW9ucy5kcmFnQ3VlTm9kZTsgLy8ge05vZGV8bnVsbH1cclxuICAgIHRoaXMuZ3JhYkN1ZU5vZGUgPSBuZXcgR3JhYlJlbGVhc2VDdWVOb2RlKCBvcHRpb25zLmdyYWJDdWVPcHRpb25zICk7XHJcbiAgICB0aGlzLnNob3dHcmFiQ3VlTm9kZSA9IG9wdGlvbnMuc2hvd0dyYWJDdWVOb2RlO1xyXG4gICAgdGhpcy5zaG93RHJhZ0N1ZU5vZGUgPSBvcHRpb25zLnNob3dEcmFnQ3VlTm9kZTtcclxuICAgIHRoaXMub25HcmFiYmFibGUgPSBvcHRpb25zLm9uR3JhYmJhYmxlO1xyXG4gICAgdGhpcy5vbkRyYWdnYWJsZSA9IG9wdGlvbnMub25EcmFnZ2FibGU7XHJcbiAgICB0aGlzLmFkZEFyaWFEZXNjcmliZWRieVByZWRpY2F0ZSA9IG9wdGlvbnMuYWRkQXJpYURlc2NyaWJlZGJ5UHJlZGljYXRlO1xyXG4gICAgdGhpcy5zdXBwb3J0c0dlc3R1cmVEZXNjcmlwdGlvbiA9IG9wdGlvbnMuc3VwcG9ydHNHZXN0dXJlRGVzY3JpcHRpb247XHJcblxyXG4gICAgLy8gQHByaXZhdGUge251bWJlcn0gLSB0aGUgbnVtYmVyIG9mIHRpbWVzIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gcGlja2VkIHVwIGZvciBkcmFnZ2luZywgcmVnYXJkbGVzc1xyXG4gICAgLy8gb2YgcGlja3VwIG1ldGhvZCBmb3IgdGhpbmdzIGxpa2UgZGV0ZXJtaW5pbmcgY29udGVudCBmb3IgXCJoaW50c1wiIGRlc2NyaWJpbmcgdGhlIGludGVyYWN0aW9uXHJcbiAgICAvLyB0byB0aGUgdXNlclxyXG4gICAgdGhpcy5udW1iZXJPZkdyYWJzID0gMDsgLy8ge251bWJlcn1cclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7bnVtYmVyfSAtIHRoZSBudW1iZXIgb2YgdGltZXMgdGhpcyBjb21wb25lbnQgaGFzIGJlZW4gcGlja2VkIHVwIHdpdGggYSBrZXlib2FyZFxyXG4gICAgLy8gc3BlY2lmaWNhbGx5IHRvIHByb3ZpZGUgaGludHMgc3BlY2lmaWMgdG8gYWx0ZXJuYXRpdmUgaW5wdXRcclxuICAgIHRoaXMubnVtYmVyT2ZLZXlib2FyZEdyYWJzID0gMDtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7c3RyaW5nfG51bGx9XHJcbiAgICAvLyBzZXQgdGhlIGhlbHAgdGV4dCwgaWYgcHJvdmlkZWQgLSBpdCB3aWxsIGJlIGFzc29jaWF0ZWQgd2l0aCBhcmlhLWRlc2NyaWJlZGJ5IHdoZW4gaW4gdGhlIFwiZ3JhYmJhYmxlXCIgc3RhdGVcclxuICAgIHRoaXMubm9kZS5kZXNjcmlwdGlvbkNvbnRlbnQgPSB0aGlzLnN1cHBvcnRzR2VzdHVyZURlc2NyaXB0aW9uID8gb3B0aW9ucy5nZXN0dXJlSGVscFRleHQgOiBvcHRpb25zLmtleWJvYXJkSGVscFRleHQ7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge09iamVjdH0gLSBUaGUgYXJpYS1kZXNjcmliZWRieSBhc3NvY2lhdGlvbiBvYmplY3QgdGhhdCB3aWxsIGFzc29jaWF0ZSBcImdyYWJiYWJsZVwiIHdpdGggaXRzXHJcbiAgICAvLyBoZWxwIHRleHQgc28gdGhhdCBpdCBpcyByZWFkIGF1dG9tYXRpY2FsbHkgd2hlbiB0aGUgdXNlciBmaW5kcyBpdC4gVGhpcyByZWZlcmVuY2UgaXMgc2F2ZWQgc28gdGhhdFxyXG4gICAgLy8gdGhlIGFzc29jaWF0aW9uIGNhbiBiZSByZW1vdmVkIHdoZW4gdGhlIG5vZGUgYmVjb21lcyBhIFwiZHJhZ2dhYmxlXCJcclxuICAgIHRoaXMuZGVzY3JpcHRpb25Bc3NvY2lhdGlvbk9iamVjdCA9IHtcclxuICAgICAgb3RoZXJOb2RlOiB0aGlzLm5vZGUsXHJcbiAgICAgIHRoaXNFbGVtZW50TmFtZTogUERPTVBlZXIuUFJJTUFSWV9TSUJMSU5HLFxyXG4gICAgICBvdGhlckVsZW1lbnROYW1lOiBQRE9NUGVlci5ERVNDUklQVElPTl9TSUJMSU5HXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEBwcml2YXRlXHJcbiAgICB0aGlzLnZvaWNpbmdGb2N1c1V0dGVyYW5jZSA9IG5ldyBVdHRlcmFuY2UoIHtcclxuICAgICAgYWxlcnQ6IG5ldyBSZXNwb25zZVBhY2tldCgpLFxyXG4gICAgICBhbm5vdW5jZXJPcHRpb25zOiB7XHJcbiAgICAgICAgY2FuY2VsT3RoZXI6IGZhbHNlXHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBmb3IgYm90aCBncmFiYmluZyBhbmQgZHJhZ2dpbmcsIHRoZSBub2RlIHdpdGggdGhpcyBpbnRlcmFjdGlvbiBtdXN0IGJlIGZvY3VzYWJsZSwgZXhjZXB0IHdoZW4gZGlzYWJsZWQuXHJcbiAgICB0aGlzLm5vZGUuZm9jdXNhYmxlID0gdHJ1ZTtcclxuXHJcbiAgICBhc3NlcnQgJiYgbm9kZS5pc1ZvaWNpbmcgJiYgYXNzZXJ0KCBub2RlLnZvaWNpbmdGb2N1c0xpc3RlbmVyID09PSBub2RlLmRlZmF1bHRGb2N1c0xpc3RlbmVyLFxyXG4gICAgICAnR3JhYkRyYWdJbnRlcmFjdGlvbiBzZXRzIGl0cyBvd24gdm9pY2luZ0ZvY3VzTGlzdGVuZXIuJyApO1xyXG5cclxuICAgIC8vIFwicmVsZWFzZWRcIiBhbGVydHMgYXJlIGFzc2VydGl2ZSBzbyB0aGF0IGEgcGlsZSB1cCBvZiBhbGVydHMgZG9lc24ndCBoYXBwZW4gd2l0aCByYXBpZCBtb3ZlbWVudCwgc2VlXHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYmFsbG9vbnMtYW5kLXN0YXRpYy1lbGVjdHJpY2l0eS9pc3N1ZXMvNDkxXHJcbiAgICBjb25zdCByZWxlYXNlZFV0dGVyYW5jZSA9IG5ldyBVdHRlcmFuY2UoIHtcclxuICAgICAgYWxlcnQ6IG5ldyBSZXNwb25zZVBhY2tldCggeyBvYmplY3RSZXNwb25zZTogcmVsZWFzZWRTdHJpbmcgfSApLFxyXG5cclxuICAgICAgLy8gVGhpcyB3YXMgYmVpbmcgb2JzY3VyZWQgYnkgb3RoZXIgbWVzc2FnZXMsIHRoZSBwcmlvcml0eSBoZWxwcyBtYWtlIHN1cmUgaXQgaXMgaGVhcmQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZnJpY3Rpb24vaXNzdWVzLzMyNVxyXG4gICAgICBwcmlvcml0eTogVXR0ZXJhbmNlLk1FRElVTV9QUklPUklUWSxcclxuXHJcbiAgICAgIGFubm91bmNlck9wdGlvbnM6IHtcclxuICAgICAgICBhcmlhTGl2ZVByaW9yaXR5OiBBcmlhTGl2ZUFubm91bmNlci5BcmlhTGl2ZS5BU1NFUlRJVkUgLy8gZm9yIEFyaWFMaXZlQW5ub3VuY2VyXHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICBpZiAoIG5vZGUuaXNWb2ljaW5nICkge1xyXG5cclxuICAgICAgLy8gc2FuaXR5IGNoZWNrIG9uIHRoZSB2b2ljaW5nIGludGVyZmFjZSBBUEkuXHJcbiAgICAgIGFzc2VydEhhc1Byb3BlcnRpZXMoIG5vZGUsIFsgJ3ZvaWNpbmdGb2N1c0xpc3RlbmVyJyBdICk7XHJcblxyXG4gICAgICBub2RlLnZvaWNpbmdGb2N1c0xpc3RlbmVyID0gZXZlbnQgPT4ge1xyXG5cclxuICAgICAgICAvLyBXaGVuIHN3YXBwaW5nIGZyb20gZ3JhYmJhYmxlIHRvIGRyYWdnYWJsZSwgdGhlIGRyYWdnYWJsZSBlbGVtZW50IHdpbGwgYmUgZm9jdXNlZCwgaWdub3JlIHRoYXQgY2FzZSBoZXJlLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2ZyaWN0aW9uL2lzc3Vlcy8yMTNcclxuICAgICAgICB0aGlzLmdyYWJiYWJsZSAmJiBub2RlLmRlZmF1bHRGb2N1c0xpc3RlbmVyKCBldmVudCApO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgLy8gVGhlc2UgVXR0ZXJhbmNlcyBzaG91bGQgb25seSBiZSBhbm5vdW5jZWQgaWYgdGhlIE5vZGUgaXMgZ2xvYmFsbHkgdmlzaWJsZSBhbmQgdm9pY2luZ1Zpc2libGUuXHJcbiAgICAgIFZvaWNpbmcucmVnaXN0ZXJVdHRlcmFuY2VUb1ZvaWNpbmdOb2RlKCByZWxlYXNlZFV0dGVyYW5jZSwgbm9kZSApO1xyXG4gICAgICBWb2ljaW5nLnJlZ2lzdGVyVXR0ZXJhbmNlVG9Wb2ljaW5nTm9kZSggdGhpcy52b2ljaW5nRm9jdXNVdHRlcmFuY2UsIG5vZGUgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBAcHJpdmF0ZSAtIHdyYXAgdGhlIG9wdGlvbmFsIG9uUmVsZWFzZSBpbiBsb2dpYyB0aGF0IGlzIG5lZWRlZCBmb3IgdGhlIGNvcmUgdHlwZS5cclxuICAgIHRoaXMub25SZWxlYXNlID0gKCkgPT4ge1xyXG4gICAgICBvcHRpb25zLm9uUmVsZWFzZSAmJiBvcHRpb25zLm9uUmVsZWFzZSgpO1xyXG5cclxuICAgICAgdGhpcy5ub2RlLmFsZXJ0RGVzY3JpcHRpb25VdHRlcmFuY2UoIHJlbGVhc2VkVXR0ZXJhbmNlICk7XHJcbiAgICAgIG5vZGUuaXNWb2ljaW5nICYmIFZvaWNpbmcuYWxlcnRVdHRlcmFuY2UoIHJlbGVhc2VkVXR0ZXJhbmNlICk7XHJcbiAgICB9O1xyXG4gICAgdGhpcy5vbkdyYWIgPSBvcHRpb25zLm9uR3JhYjsgLy8gQHByaXZhdGVcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSAtIFRha2UgaGlnaGxpZ2h0cyBmcm9tIHRoZSBub2RlIGZvciB0aGUgZ3JhYiBidXR0b24gaW50ZXJhY3Rpb24uIFRoZSBJbnRlcmFjdGl2ZSBIaWdobGlnaHRzIGNhbm5vdFxyXG4gICAgLy8gZmFsbCBiYWNrIHRvIHRoZSBkZWZhdWx0IGZvY3VzIGhpZ2hsaWdodHMgYmVjYXVzZSBHcmFiRHJhZ0ludGVyYWN0aW9uIGFkZHMgXCJncmFiIGN1ZVwiIE5vZGVzIGFzIGNoaWxkcmVuXHJcbiAgICAvLyB0byB0aGUgZm9jdXMgaGlnaGxpZ2h0cyB0aGF0IHNob3VsZCBub3QgYmUgZGlzcGxheWVkIHdoZW4gdXNpbmcgSW50ZXJhY3RpdmUgSGlnaGxpZ2h0cy5cclxuICAgIHRoaXMuZ3JhYkZvY3VzSGlnaGxpZ2h0ID0gbm9kZS5mb2N1c0hpZ2hsaWdodCB8fCBuZXcgSGlnaGxpZ2h0RnJvbU5vZGUoIG5vZGUgKTtcclxuICAgIHRoaXMuZ3JhYkludGVyYWN0aXZlSGlnaGxpZ2h0ID0gbm9kZS5pbnRlcmFjdGl2ZUhpZ2hsaWdodCB8fCBuZXcgSGlnaGxpZ2h0RnJvbU5vZGUoIG5vZGUgKTtcclxuXHJcbiAgICBub2RlLmZvY3VzSGlnaGxpZ2h0ID0gdGhpcy5ncmFiRm9jdXNIaWdobGlnaHQ7XHJcbiAgICBub2RlLmludGVyYWN0aXZlSGlnaGxpZ2h0ID0gdGhpcy5ncmFiSW50ZXJhY3RpdmVIaWdobGlnaHQ7XHJcblxyXG4gICAgLy8gQHByaXZhdGUgLSBNYWtlIHRoZSBkcmFnZ2FibGUgaGlnaGxpZ2h0cyBpbiB0aGUgc3BpdHRpbmcgaW1hZ2Ugb2YgdGhlIG5vZGUncyBncmFiYmFibGUgaGlnaGxpZ2h0c1xyXG4gICAgdGhpcy5kcmFnRm9jdXNIaWdobGlnaHQgPSBuZXcgSGlnaGxpZ2h0UGF0aCggdGhpcy5ncmFiRm9jdXNIaWdobGlnaHQuc2hhcGUsIHtcclxuICAgICAgdmlzaWJsZTogZmFsc2UsXHJcbiAgICAgIHRyYW5zZm9ybVNvdXJjZU5vZGU6IHRoaXMuZ3JhYkZvY3VzSGlnaGxpZ2h0LnRyYW5zZm9ybVNvdXJjZU5vZGUgfHwgbm9kZVxyXG4gICAgfSApO1xyXG4gICAgdGhpcy5kcmFnSW50ZXJhY3RpdmVIaWdobGlnaHQgPSBuZXcgSGlnaGxpZ2h0UGF0aCggdGhpcy5ncmFiSW50ZXJhY3RpdmVIaWdobGlnaHQuc2hhcGUsIHtcclxuICAgICAgdmlzaWJsZTogZmFsc2UsXHJcbiAgICAgIHRyYW5zZm9ybVNvdXJjZU5vZGU6IHRoaXMuZ3JhYkludGVyYWN0aXZlSGlnaGxpZ2h0LnRyYW5zZm9ybVNvdXJjZU5vZGUgfHwgbm9kZVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0aGUgcGFzc2VkIGluIG5vZGUncyBmb2N1c0hpZ2hsaWdodCB0byBtYWtlIGl0IGRhc2hlZCBmb3IgdGhlIFwiZHJhZ2dhYmxlXCIgc3RhdGVcclxuICAgIHRoaXMuZHJhZ0ZvY3VzSGlnaGxpZ2h0Lm1ha2VEYXNoZWQoIHRydWUgKTtcclxuICAgIHRoaXMuZHJhZ0ludGVyYWN0aXZlSGlnaGxpZ2h0Lm1ha2VEYXNoZWQoIHRydWUgKTtcclxuXHJcbiAgICAvLyBpZiB0aGUgTm9kZSBsYXllcnMgaXRzIGludGVyYWN0aXZlIGhpZ2hsaWdodHMgaW4gdGhlIHNjZW5lIGdyYXBoLCBhZGQgdGhlIGRyYWdJbnRlcmFjdGl2ZUhpZ2hsaWdodCBpbiB0aGUgc2FtZVxyXG4gICAgLy8gd2F5IHRoZSBncmFiSW50ZXJhY3RpdmVIaWdobGlnaHQgd2FzIGFkZGVkXHJcbiAgICBpZiAoIG5vZGUuaW50ZXJhY3RpdmVIaWdobGlnaHRMYXllcmFibGUgKSB7XHJcbiAgICAgIHRoaXMuZ3JhYkludGVyYWN0aXZlSGlnaGxpZ2h0LnBhcmVudC5hZGRDaGlsZCggdGhpcy5kcmFnSW50ZXJhY3RpdmVIaWdobGlnaHQgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpZiBldmVyIHdlIHVwZGF0ZSB0aGUgbm9kZSdzIGhpZ2hsaWdodHMsIHRoZW4gdXBkYXRlIHRoZSBncmFiIGJ1dHRvbidzIHRvbyB0byBrZWVwIGluIHN5bi5cclxuICAgIGNvbnN0IG9uRm9jdXNIaWdobGlnaHRDaGFuZ2UgPSAoKSA9PiB7XHJcbiAgICAgIHRoaXMuZHJhZ0ZvY3VzSGlnaGxpZ2h0LnNldFNoYXBlKCB0aGlzLmdyYWJGb2N1c0hpZ2hsaWdodC5zaGFwZSApO1xyXG4gICAgfTtcclxuICAgIHRoaXMuZ3JhYkZvY3VzSGlnaGxpZ2h0LmhpZ2hsaWdodENoYW5nZWRFbWl0dGVyLmFkZExpc3RlbmVyKCBvbkZvY3VzSGlnaGxpZ2h0Q2hhbmdlICk7XHJcblxyXG4gICAgY29uc3Qgb25JbnRlcmFjdGl2ZUhpZ2hsaWdodENoYW5nZSA9ICgpID0+IHtcclxuICAgICAgdGhpcy5kcmFnSW50ZXJhY3RpdmVIaWdobGlnaHQuc2V0U2hhcGUoIHRoaXMuZ3JhYkludGVyYWN0aXZlSGlnaGxpZ2h0LnNoYXBlICk7XHJcbiAgICB9O1xyXG4gICAgdGhpcy5ncmFiSW50ZXJhY3RpdmVIaWdobGlnaHQuaGlnaGxpZ2h0Q2hhbmdlZEVtaXR0ZXIuYWRkTGlzdGVuZXIoIG9uSW50ZXJhY3RpdmVIaWdobGlnaHRDaGFuZ2UgKTtcclxuXHJcbiAgICAvLyBvbmx5IHRoZSBmb2N1cyBoaWdobGlnaHRzIGhhdmUgXCJjdWVcIiBOb2RlcyBzbyB3ZSBkbyBub3QgbmVlZCB0byBkbyBhbnkgd29yayBoZXJlIGZvciB0aGUgSW50ZXJhY3RpdmUgSGlnaGxpZ2h0c1xyXG4gICAgdGhpcy5ncmFiQ3VlTm9kZS5wcmVwZW5kTWF0cml4KCBub2RlLmdldE1hdHJpeCgpICk7XHJcbiAgICB0aGlzLmdyYWJGb2N1c0hpZ2hsaWdodC5hZGRDaGlsZCggdGhpcy5ncmFiQ3VlTm9kZSApO1xyXG4gICAgaWYgKCB0aGlzLmRyYWdDdWVOb2RlICkge1xyXG4gICAgICB0aGlzLmRyYWdDdWVOb2RlLnByZXBlbmRNYXRyaXgoIG5vZGUuZ2V0TWF0cml4KCkgKTtcclxuICAgICAgdGhpcy5kcmFnRm9jdXNIaWdobGlnaHQuYWRkQ2hpbGQoIHRoaXMuZHJhZ0N1ZU5vZGUgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTb21lIGtleSBwcmVzc2VzIGNhbiBmaXJlIHRoZSBub2RlJ3MgY2xpY2sgKHRoZSBncmFiIGJ1dHRvbikgZnJvbSB0aGUgc2FtZSBwcmVzcyB0aGF0IGZpcmVzIHRoZSBrZXlkb3duIGZyb21cclxuICAgIC8vIHRoZSBkcmFnZ2FibGUsIHNvIGd1YXJkIGFnYWluc3QgdGhhdC5cclxuICAgIGxldCBndWFyZEtleVByZXNzRnJvbURyYWdnYWJsZSA9IGZhbHNlO1xyXG5cclxuICAgIC8vIHdoZW4gdGhlIFwiR3JhYiB7e3RoaW5nfX1cIiBidXR0b24gaXMgcHJlc3NlZCwgZm9jdXMgdGhlIGRyYWdnYWJsZSBub2RlIGFuZCBzZXQgdG8gZHJhZ2dlZCBzdGF0ZVxyXG4gICAgY29uc3QgZ3JhYkJ1dHRvbkxpc3RlbmVyID0ge1xyXG4gICAgICBjbGljazogZXZlbnQgPT4ge1xyXG5cclxuICAgICAgICAvLyBkb24ndCB0dXJuIHRvIGRyYWdnYWJsZSBvbiBtb2JpbGUgYTExeSwgaXQgaXMgdGhlIHdyb25nIGdlc3R1cmUgLSB1c2VyIHNob3VsZCBwcmVzcyBkb3duIGFuZCBob2xkXHJcbiAgICAgICAgLy8gdG8gaW5pdGlhdGUgYSBkcmFnXHJcbiAgICAgICAgaWYgKCB0aGlzLnN1cHBvcnRzR2VzdHVyZURlc2NyaXB0aW9uICkge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gaWYgdGhlIGRyYWdnYWJsZSB3YXMganVzdCByZWxlYXNlZCwgZG9uJ3QgcGljayBpdCB1cCBhZ2FpbiB1bnRpbCB0aGUgbmV4dCBjbGljayBldmVudCBzbyB3ZSBkb24ndCBcImxvb3BcIlxyXG4gICAgICAgIC8vIGFuZCBwaWNrIGl0IHVwIGltbWVkaWF0ZWx5IGFnYWluLlxyXG4gICAgICAgIGlmICggIWd1YXJkS2V5UHJlc3NGcm9tRHJhZ2dhYmxlICkge1xyXG5cclxuICAgICAgICAgIC8vIGJsdXIgYXMgYSBncmFiYmFibGUgc28gdGhhdCB3ZSBnZXRhIG5ldyBmb2N1cyBldmVudCBhZnRlciB3ZSB0dXJuIGludG8gYSBkcmFnZ2FibGVcclxuICAgICAgICAgIHRoaXMubm9kZS5ibHVyKCk7XHJcblxyXG4gICAgICAgICAgdGhpcy50dXJuVG9EcmFnZ2FibGUoKTtcclxuXHJcbiAgICAgICAgICB0aGlzLm51bWJlck9mS2V5Ym9hcmRHcmFicysrO1xyXG5cclxuICAgICAgICAgIC8vIGZvY3VzIGFmdGVyIHRoZSB0cmFuc2l0aW9uXHJcbiAgICAgICAgICB0aGlzLm5vZGUuZm9jdXMoKTtcclxuXHJcbiAgICAgICAgICB0aGlzLm9uR3JhYiggZXZlbnQgKTtcclxuXHJcbiAgICAgICAgICAvLyBBZGQgdGhlIG5ld2x5IGNyZWF0ZWQgZm9jdXNIaWdobGlnaHQgdG8gdGhlIHNjZW5lIGdyYXBoIGlmIGZvY3VzSGlnaGxpZ2h0TGF5ZXJhYmxlLCBqdXN0IGxpa2UgdGhlXHJcbiAgICAgICAgICAvLyBvcmlnaW5hbCBmb2N1cyBoaWdobGlnaHQgd2FzIGFkZGVkLiBCeSBkb2luZyB0aGlzIG9uIGNsaWNrLCB3ZSBtYWtlIHN1cmUgdGhhdCB0aGUgbm9kZSdzXHJcbiAgICAgICAgICAvLyBmb2N1c0hpZ2hsaWdodCBoYXMgYmVlbiBjb21wbGV0ZWx5IGNvbnN0cnVjdGVkIChhZGRlZCB0byB0aGUgc2NlbmUgZ3JhcGgpIGFuZCBjYW4gdXNlIGl0cyBwYXJlbnQuIEJ1dCBvbmx5XHJcbiAgICAgICAgICAvLyBkbyBpdCBvbmNlLlxyXG4gICAgICAgICAgaWYgKCBub2RlLmZvY3VzSGlnaGxpZ2h0TGF5ZXJhYmxlICkge1xyXG4gICAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmdyYWJGb2N1c0hpZ2hsaWdodC5wYXJlbnQsICdob3cgY2FuIHdlIGhhdmUgZm9jdXNIaWdobGlnaHRMYXllcmFibGUgd2l0aCBhICcgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdub2RlIHRoYXQgaXMgbm90IGluIHRoZSBzY2VuZSBncmFwaD8nICk7XHJcbiAgICAgICAgICAgIC8vIElmIG5vdCB5ZXQgYWRkZWQsIGRvIHNvIG5vdy5cclxuICAgICAgICAgICAgaWYgKCAhdGhpcy5ncmFiRm9jdXNIaWdobGlnaHQucGFyZW50Lmhhc0NoaWxkKCB0aGlzLmRyYWdGb2N1c0hpZ2hsaWdodCApICkge1xyXG4gICAgICAgICAgICAgIHRoaXMuZ3JhYkZvY3VzSGlnaGxpZ2h0LnBhcmVudC5hZGRDaGlsZCggdGhpcy5kcmFnRm9jdXNIaWdobGlnaHQgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gXCJncmFiXCIgdGhlIGRyYWdnYWJsZSBvbiB0aGUgbmV4dCBjbGljayBldmVudFxyXG4gICAgICAgIGd1YXJkS2V5UHJlc3NGcm9tRHJhZ2dhYmxlID0gZmFsc2U7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBmb2N1czogKCkgPT4ge1xyXG4gICAgICAgIHRoaXMudXBkYXRlVmlzaWJpbGl0eUZvckN1ZXMoKTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLm5vZGUuaXNWb2ljaW5nICYmIHRoaXMuc2hvd0dyYWJDdWVOb2RlKCkgKSB7XHJcbiAgICAgICAgICB0aGlzLnZvaWNpbmdGb2N1c1V0dGVyYW5jZS5hbGVydC5oaW50UmVzcG9uc2UgPSBTY2VuZXJ5UGhldFN0cmluZ3MuYTExeS5ncmFiRHJhZy5zcGFjZVRvR3JhYk9yUmVsZWFzZVN0cmluZ1Byb3BlcnR5O1xyXG4gICAgICAgICAgVm9pY2luZy5hbGVydFV0dGVyYW5jZSggdGhpcy52b2ljaW5nRm9jdXNVdHRlcmFuY2UgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBibHVyOiAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5ncmFiQ3VlTm9kZS52aXNpYmxlID0gb3B0aW9ucy5zaG93R3JhYkN1ZU5vZGUoKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSAtIGtlZXAgdHJhY2sgb2YgYWxsIGxpc3RlbmVycyB0byBzd2FwIG91dCBncmFiL2RyYWcgZnVuY3Rpb25hbGl0aWVzXHJcbiAgICB0aGlzLmxpc3RlbmVyc0ZvckdyYWJTdGF0ZSA9IG9wdGlvbnMubGlzdGVuZXJzRm9yR3JhYlN0YXRlLmNvbmNhdCggZ3JhYkJ1dHRvbkxpc3RlbmVyICk7XHJcblxyXG4gICAgY29uc3QgZHJhZ0RpdkRvd25MaXN0ZW5lciA9IG5ldyBLZXlib2FyZExpc3RlbmVyKCB7XHJcbiAgICAgIGtleXM6IFsgJ2VudGVyJyBdLFxyXG4gICAgICBmaXJlOiAoKSA9PiB7XHJcblxyXG4gICAgICAgIC8vIHNldCBhIGd1YXJkIHRvIG1ha2Ugc3VyZSB0aGUga2V5IHByZXNzIGZyb20gZW50ZXIgZG9lc24ndCBmaXJlIGZ1dHVyZSBsaXN0ZW5lcnMsIHRoZXJlZm9yZVxyXG4gICAgICAgIC8vIFwiY2xpY2tpbmdcIiB0aGUgZ3JhYiBidXR0b24gYWxzbyBvbiB0aGlzIGtleSBwcmVzcy5cclxuICAgICAgICBndWFyZEtleVByZXNzRnJvbURyYWdnYWJsZSA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5yZWxlYXNlRHJhZ2dhYmxlKCk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICBjb25zdCBkcmFnRGl2VXBMaXN0ZW5lciA9IG5ldyBLZXlib2FyZExpc3RlbmVyKCB7XHJcbiAgICAgIGtleXM6IFsgJ3NwYWNlJywgJ2VzY2FwZScgXSxcclxuICAgICAgZmlyZU9uRG93bjogZmFsc2UsXHJcbiAgICAgIGZpcmU6ICgpID0+IHtcclxuXHJcbiAgICAgICAgLy8gUmVsZWFzZSBvbiBrZXl1cCBmb3Igc3BhY2ViYXIgc28gdGhhdCB3ZSBkb24ndCBwaWNrIHVwIHRoZSBkcmFnZ2FibGUgYWdhaW4gd2hlbiB3ZSByZWxlYXNlIHRoZSBzcGFjZWJhclxyXG4gICAgICAgIC8vIGFuZCB0cmlnZ2VyIGEgY2xpY2sgZXZlbnQgLSBlc2NhcGUgY291bGQgYmUgYWRkZWQgdG8gZWl0aGVyIGtleXVwIG9yIGtleWRvd24gbGlzdGVuZXJzXHJcbiAgICAgICAgdGhpcy5yZWxlYXNlRHJhZ2dhYmxlKCk7XHJcblxyXG4gICAgICAgIC8vIGlmIHN1Y2Nlc3NmdWxseSBkcmFnZ2VkLCB0aGVuIG1ha2UgdGhlIGN1ZSBub2RlIGludmlzaWJsZVxyXG4gICAgICAgIHRoaXMudXBkYXRlVmlzaWJpbGl0eUZvckN1ZXMoKTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIHJlbGVhc2Ugd2hlbiBmb2N1cyBpcyBsb3N0XHJcbiAgICAgIGJsdXI6ICgpID0+IHRoaXMucmVsZWFzZURyYWdnYWJsZSgpLFxyXG5cclxuICAgICAgLy8gaWYgc3VjY2Vzc2Z1bGx5IGRyYWdnZWQsIHRoZW4gbWFrZSB0aGUgY3VlIG5vZGUgaW52aXNpYmxlXHJcbiAgICAgIGZvY3VzOiAoKSA9PiB0aGlzLnVwZGF0ZVZpc2liaWxpdHlGb3JDdWVzKClcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZVxyXG4gICAgdGhpcy5saXN0ZW5lcnNGb3JEcmFnU3RhdGUgPSBvcHRpb25zLmxpc3RlbmVyc0ZvckRyYWdTdGF0ZS5jb25jYXQoIFtcclxuICAgICAgZHJhZ0RpdkRvd25MaXN0ZW5lcixcclxuICAgICAgZHJhZ0RpdlVwTGlzdGVuZXIsXHJcbiAgICAgIGtleWJvYXJkRHJhZ0xpc3RlbmVyXHJcbiAgICBdICk7XHJcblxyXG4gICAgLy8gQHByaXZhdGUgLSBmcm9tIG5vbi1QRE9NIHBvaW50ZXIgZXZlbnRzLCBjaGFuZ2UgcmVwcmVzZW50YXRpb25zIGluIHRoZSBQRE9NIC0gbmVjZXNzYXJ5IGZvciBhY2Nlc3NpYmxlIHRlY2ggdGhhdFxyXG4gICAgLy8gdXNlcyBwb2ludGVyIGV2ZW50cyBsaWtlIGlPUyBWb2ljZU92ZXIuIFRoZSBhYm92ZSBsaXN0ZW5lcnMgbWFuYWdlIGlucHV0IGZyb20gdGhlIFBET00uXHJcbiAgICB0aGlzLnByZXNzTGlzdGVuZXIgPSBuZXcgUHJlc3NMaXN0ZW5lcigge1xyXG4gICAgICBwcmVzczogZXZlbnQgPT4ge1xyXG4gICAgICAgIGlmICggIWV2ZW50LmlzRnJvbVBET00oKSApIHtcclxuICAgICAgICAgIHRoaXMudHVyblRvRHJhZ2dhYmxlKCk7XHJcbiAgICAgICAgICB0aGlzLm9uR3JhYiggZXZlbnQgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIHJlbGVhc2U6IGV2ZW50ID0+IHtcclxuXHJcbiAgICAgICAgLy8gcmVsZWFzZSBpZiBQcmVzc0xpc3RlbmVyIGlzIGludGVycnVwdGVkLCBidXQgb25seSBpZiBub3QgYWxyZWFkeVxyXG4gICAgICAgIC8vIGdyYWJiYWJsZSwgd2hpY2ggaXMgcG9zc2libGUgaWYgdGhlIEdyYWJEcmFnSW50ZXJhY3Rpb24gaGFzIGJlZW5cclxuICAgICAgICAvLyByZXNldCBzaW5jZSBwcmVzc1xyXG4gICAgICAgIGlmICggKCBldmVudCA9PT0gbnVsbCB8fCAhZXZlbnQuaXNGcm9tUERPTSgpICkgJiYgIXRoaXMuZ3JhYmJhYmxlICkge1xyXG4gICAgICAgICAgdGhpcy5yZWxlYXNlRHJhZ2dhYmxlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gdGhpcyBsaXN0ZW5lciBzaG91bGRuJ3QgcHJldmVudCB0aGUgYmVoYXZpb3Igb2Ygb3RoZXIgbGlzdGVuZXJzLCBhbmQgdGhpcyBsaXN0ZW5lciBzaG91bGQgYWx3YXlzIGZpcmVcclxuICAgICAgLy8gd2hldGhlciBvciBub3QgdGhlIHBvaW50ZXIgaXMgYWxyZWFkeSBhdHRhY2hlZFxyXG4gICAgICBhdHRhY2g6IGZhbHNlLFxyXG4gICAgICBlbmFibGVkUHJvcGVydHk6IHRoaXMuZW5hYmxlZFByb3BlcnR5LFxyXG4gICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ3ByZXNzTGlzdGVuZXInIClcclxuICAgIH0gKTtcclxuICAgIHRoaXMubm9kZS5hZGRJbnB1dExpc3RlbmVyKCB0aGlzLnByZXNzTGlzdGVuZXIgKTtcclxuXHJcbiAgICAvLyBJbml0aWFsaXplIHRoZSBOb2RlIGFzIGEgZ3JhYmJhYmxlIChidXR0b24pIHRvIGJlZ2luIHdpdGhcclxuICAgIHRoaXMudHVyblRvR3JhYmJhYmxlKCk7XHJcblxyXG4gICAgdGhpcy5lbmFibGVkUHJvcGVydHkubGF6eUxpbmsoIGVuYWJsZWQgPT4ge1xyXG4gICAgICAhZW5hYmxlZCAmJiB0aGlzLmludGVycnVwdCgpO1xyXG5cclxuICAgICAgLy8gRGlzYWJsZWQgR3JhYkRyYWdJbnRlcmFjdGlvbnMgd2lsbCBiZSB1bmFibGUgdG8gYmUgaW50ZXJhY3RlZCB3aXRoLlxyXG4gICAgICB0aGlzLm5vZGUuZm9jdXNhYmxlID0gZW5hYmxlZDtcclxuICAgIH0gKTtcclxuXHJcbiAgICBjb25zdCBib3VuZFVwZGF0ZVZpc2liaWxpdHlGb3JDdWVzID0gdGhpcy51cGRhdGVWaXNpYmlsaXR5Rm9yQ3Vlcy5iaW5kKCB0aGlzICk7XHJcblxyXG4gICAgdGhpcy5ub2RlLmlucHV0RW5hYmxlZFByb3BlcnR5LmxhenlMaW5rKCBib3VuZFVwZGF0ZVZpc2liaWxpdHlGb3JDdWVzICk7XHJcblxyXG4gICAgLy8gQHByaXZhdGVcclxuICAgIHRoaXMuZGlzcG9zZUdyYWJEcmFnSW50ZXJhY3Rpb24gPSAoKSA9PiB7XHJcblxyXG4gICAgICB0aGlzLm5vZGUucmVtb3ZlSW5wdXRMaXN0ZW5lciggdGhpcy5wcmVzc0xpc3RlbmVyICk7XHJcbiAgICAgIHRoaXMubm9kZS5pbnB1dEVuYWJsZWRQcm9wZXJ0eS51bmxpbmsoIGJvdW5kVXBkYXRlVmlzaWJpbGl0eUZvckN1ZXMgKTtcclxuXHJcbiAgICAgIC8vIFJlbW92ZSBsaXN0ZW5lcnMgYWNjb3JkaW5nIHRvIHdoYXQgc3RhdGUgd2UgYXJlIGluXHJcbiAgICAgIGlmICggdGhpcy5ncmFiYmFibGUgKSB7XHJcbiAgICAgICAgdGhpcy5yZW1vdmVJbnB1dExpc3RlbmVycyggdGhpcy5saXN0ZW5lcnNGb3JHcmFiU3RhdGUgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB0aGlzLnJlbW92ZUlucHV0TGlzdGVuZXJzKCB0aGlzLmxpc3RlbmVyc0ZvckRyYWdTdGF0ZSApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBkcmFnRGl2RG93bkxpc3RlbmVyLmRpc3Bvc2UoKTtcclxuICAgICAgZHJhZ0RpdlVwTGlzdGVuZXIuZGlzcG9zZSgpO1xyXG5cclxuICAgICAgdGhpcy5ncmFiRm9jdXNIaWdobGlnaHQuaGlnaGxpZ2h0Q2hhbmdlZEVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoIG9uRm9jdXNIaWdobGlnaHRDaGFuZ2UgKTtcclxuICAgICAgdGhpcy5ncmFiSW50ZXJhY3RpdmVIaWdobGlnaHQuaGlnaGxpZ2h0Q2hhbmdlZEVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoIG9uSW50ZXJhY3RpdmVIaWdobGlnaHRDaGFuZ2UgKTtcclxuXHJcbiAgICAgIC8vIFJlbW92ZSBjaGlsZHJlbiBpZiB0aGV5IHdlcmUgYWRkZWQgdG8gc3VwcG9ydCBsYXllcmFibGUgaGlnaGxpZ2h0c1xyXG4gICAgICBpZiAoIG5vZGUuZm9jdXNIaWdobGlnaHRMYXllcmFibGUgKSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5ncmFiRm9jdXNIaWdobGlnaHQucGFyZW50LCAnaG93IGNhbiB3ZSBoYXZlIGZvY3VzSGlnaGxpZ2h0TGF5ZXJhYmxlIHdpdGggYSAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdub2RlIHRoYXQgaXMgbm90IGluIHRoZSBzY2VuZSBncmFwaD8nICk7XHJcbiAgICAgICAgaWYgKCB0aGlzLmdyYWJGb2N1c0hpZ2hsaWdodC5wYXJlbnQuaGFzQ2hpbGQoIHRoaXMuZHJhZ0ZvY3VzSGlnaGxpZ2h0ICkgKSB7XHJcbiAgICAgICAgICB0aGlzLmdyYWJGb2N1c0hpZ2hsaWdodC5wYXJlbnQucmVtb3ZlQ2hpbGQoIHRoaXMuZHJhZ0ZvY3VzSGlnaGxpZ2h0ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIG5vZGUuaW50ZXJhY3RpdmVIaWdobGlnaHRMYXllcmFibGUgKSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5ncmFiSW50ZXJhY3RpdmVIaWdobGlnaHQucGFyZW50LCAnaG93IGNhbiB3ZSBoYXZlIGludGVyYWN0aXZlSGlnaGxpZ2h0TGF5ZXJhYmxlIHdpdGggYSAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdub2RlIHRoYXQgaXMgbm90IGluIHRoZSBzY2VuZSBncmFwaD8nICk7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5ncmFiSW50ZXJhY3RpdmVIaWdobGlnaHQucGFyZW50Lmhhc0NoaWxkKCB0aGlzLmRyYWdJbnRlcmFjdGl2ZUhpZ2hsaWdodCApICkge1xyXG4gICAgICAgICAgdGhpcy5ncmFiSW50ZXJhY3RpdmVIaWdobGlnaHQucGFyZW50LnJlbW92ZUNoaWxkKCB0aGlzLmRyYWdJbnRlcmFjdGl2ZUhpZ2hsaWdodCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCBub2RlLmlzVm9pY2luZyApIHtcclxuICAgICAgICBWb2ljaW5nLnVucmVnaXN0ZXJVdHRlcmFuY2VUb1ZvaWNpbmdOb2RlKCByZWxlYXNlZFV0dGVyYW5jZSwgbm9kZSApO1xyXG4gICAgICAgIFZvaWNpbmcudW5yZWdpc3RlclV0dGVyYW5jZVRvVm9pY2luZ05vZGUoIHRoaXMudm9pY2luZ0ZvY3VzVXR0ZXJhbmNlLCBub2RlICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHJlbW92ZSBjdWUgcmVmZXJlbmNlc1xyXG4gICAgICB0aGlzLmdyYWJGb2N1c0hpZ2hsaWdodC5yZW1vdmVDaGlsZCggdGhpcy5ncmFiQ3VlTm9kZSApO1xyXG4gICAgICB0aGlzLmRyYWdDdWVOb2RlICYmIHRoaXMuZHJhZ0ZvY3VzSGlnaGxpZ2h0LmZvY3VzSGlnaGxpZ2h0LnJlbW92ZUNoaWxkKCB0aGlzLmRyYWdDdWVOb2RlICk7XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVsZWFzZSB0aGUgZHJhZ2dhYmxlXHJcbiAgICogQHB1YmxpY1xyXG4gICAqL1xyXG4gIHJlbGVhc2VEcmFnZ2FibGUoKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5ncmFiYmFibGUsICdjYW5ub3Qgc2V0IHRvIGdyYWJiYWJsZSBpZiBhbHJlYWR5IHNldCB0aGF0IHdheScgKTtcclxuICAgIHRoaXMudHVyblRvR3JhYmJhYmxlKCk7XHJcbiAgICB0aGlzLm9uUmVsZWFzZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogdHVybiB0aGUgTm9kZSBpbnRvIHRoZSBncmFiYmFibGUgKGJ1dHRvbiksIHN3YXAgb3V0IGxpc3RlbmVycyB0b29cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIHR1cm5Ub0dyYWJiYWJsZSgpIHtcclxuICAgIHRoaXMuZ3JhYmJhYmxlID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBUbyBzdXBwb3J0IGdlc3R1cmUgYW5kIG1vYmlsZSBzY3JlZW4gcmVhZGVycywgd2UgY2hhbmdlIHRoZSByb2xlZGVzY3JpcHRpb24sIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS1waGV0L2lzc3Vlcy81MzZcclxuICAgIGlmICggdGhpcy5zdXBwb3J0c0dlc3R1cmVEZXNjcmlwdGlvbiApIHtcclxuICAgICAgdGhpcy5ub2RlLnNldFBET01BdHRyaWJ1dGUoICdhcmlhLXJvbGVkZXNjcmlwdGlvbicsIG1vdmFibGVTdHJpbmcgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0aGlzLm5vZGUuaGFzUERPTUF0dHJpYnV0ZSggJ2FyaWEtcm9sZWRlc2NyaXB0aW9uJyApICkge1xyXG5cclxuICAgICAgLy8gQnkgZGVmYXVsdCwgdGhlIGdyYWJiYWJsZSBnZXRzIGEgcm9sZWRlc2NyaXB0aW9uIHRvIGZvcmNlIHRoZSBBVCB0byBzYXkgaXRzIHJvbGUuIFRoaXMgZml4ZXMgYSBidWcgaW4gVm9pY2VPdmVyXHJcbiAgICAgIC8vIHdoZXJlIGl0IGZhaWxzIHRvIHVwZGF0ZSB0aGUgcm9sZSBhZnRlciB0dXJuaW5nIGJhY2sgaW50byBhIGdyYWJiYWJsZS5cclxuICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5LXBoZXQvaXNzdWVzLzY4OC5cclxuICAgICAgLy8gWW91IGNhbiBvdmVycmlkZSB0aGlzIHdpdGggb25HcmFiYmFibGUoKSBpZiBuZWNlc3NhcnkuXHJcbiAgICAgIHRoaXMubm9kZS5zZXRQRE9NQXR0cmlidXRlKCAnYXJpYS1yb2xlZGVzY3JpcHRpb24nLCBidXR0b25TdHJpbmcgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHRoaXMuYWRkQXJpYURlc2NyaWJlZGJ5UHJlZGljYXRlKCB0aGlzLm51bWJlck9mR3JhYnMgKSApIHtcclxuXHJcbiAgICAgIC8vIHRoaXMgbm9kZSBpcyBhcmlhLWRlc2NyaWJlZGJ5IGl0cyBvd24gZGVzY3JpcHRpb24gY29udGVudCwgc28gdGhhdCB0aGUgZGVzY3JpcHRpb24gaXMgcmVhZCBhdXRvbWF0aWNhbGx5XHJcbiAgICAgIC8vIHdoZW4gZm91bmQgYnkgdGhlIHVzZXJcclxuICAgICAgIXRoaXMubm9kZS5oYXNBcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbiggdGhpcy5kZXNjcmlwdGlvbkFzc29jaWF0aW9uT2JqZWN0ICkgJiYgdGhpcy5ub2RlLmFkZEFyaWFEZXNjcmliZWRieUFzc29jaWF0aW9uKCB0aGlzLmRlc2NyaXB0aW9uQXNzb2NpYXRpb25PYmplY3QgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0aGlzLm5vZGUuaGFzQXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb24oIHRoaXMuZGVzY3JpcHRpb25Bc3NvY2lhdGlvbk9iamVjdCApICkge1xyXG4gICAgICB0aGlzLm5vZGUucmVtb3ZlQXJpYURlc2NyaWJlZGJ5QXNzb2NpYXRpb24oIHRoaXMuZGVzY3JpcHRpb25Bc3NvY2lhdGlvbk9iamVjdCApO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuYmFzZUludGVyYWN0aW9uVXBkYXRlKCB0aGlzLmdyYWJiYWJsZU9wdGlvbnMsIHRoaXMubGlzdGVuZXJzRm9yRHJhZ1N0YXRlLCB0aGlzLmxpc3RlbmVyc0ZvckdyYWJTdGF0ZSApO1xyXG5cclxuICAgIC8vIGNhbGxiYWNrIG9uIGNvbXBsZXRpb25cclxuICAgIHRoaXMub25HcmFiYmFibGUoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFR1cm4gdGhlIG5vZGUgaW50byBhIGRyYWdnYWJsZSBieSB1cGRhdGluZyBhY2Nlc3NpYmlsaXR5IHJlcHJlc2VudGF0aW9uIGluIHRoZSBQRE9NIGFuZCBjaGFuZ2luZyBpbnB1dFxyXG4gICAqIGxpc3RlbmVycy5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIHR1cm5Ub0RyYWdnYWJsZSgpIHtcclxuICAgIHRoaXMubnVtYmVyT2ZHcmFicysrO1xyXG5cclxuICAgIHRoaXMuZ3JhYmJhYmxlID0gZmFsc2U7XHJcblxyXG4gICAgLy8gYnkgZGVmYXVsdCwgdGhlIGRyYWdnYWJsZSBoYXMgcm9sZWRlc2NyaXB0aW9uIG9mIFwibW92YWJsZVwiLiBDYW4gYmUgb3ZlcndyaXR0ZW4gaW4gYG9uRHJhZ2dhYmxlKClgXHJcbiAgICB0aGlzLm5vZGUuc2V0UERPTUF0dHJpYnV0ZSggJ2FyaWEtcm9sZWRlc2NyaXB0aW9uJywgbW92YWJsZVN0cmluZyApO1xyXG5cclxuICAgIC8vIFRoaXMgbm9kZSBpcyBhcmlhLWRlc2NyaWJlZGJ5IGl0cyBvd24gZGVzY3JpcHRpb24gY29udGVudCBvbmx5IHdoZW4gZ3JhYmJhYmxlLCBzbyB0aGF0IHRoZSBkZXNjcmlwdGlvbiBpc1xyXG4gICAgLy8gcmVhZCBhdXRvbWF0aWNhbGx5IHdoZW4gZm91bmQgYnkgdGhlIHVzZXIgd2l0aCB0aGUgdmlydHVhbCBjdXJzb3IuIFJlbW92ZSBpdCBmb3IgZHJhZ2dhYmxlXHJcbiAgICBpZiAoIHRoaXMubm9kZS5oYXNBcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbiggdGhpcy5kZXNjcmlwdGlvbkFzc29jaWF0aW9uT2JqZWN0ICkgKSB7XHJcbiAgICAgIHRoaXMubm9kZS5yZW1vdmVBcmlhRGVzY3JpYmVkYnlBc3NvY2lhdGlvbiggdGhpcy5kZXNjcmlwdGlvbkFzc29jaWF0aW9uT2JqZWN0ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdHVybiB0aGlzIGludG8gYSBkcmFnZ2FibGUgaW4gdGhlIG5vZGVcclxuICAgIHRoaXMuYmFzZUludGVyYWN0aW9uVXBkYXRlKCB0aGlzLmRyYWdnYWJsZU9wdGlvbnMsIHRoaXMubGlzdGVuZXJzRm9yR3JhYlN0YXRlLCB0aGlzLmxpc3RlbmVyc0ZvckRyYWdTdGF0ZSApO1xyXG5cclxuICAgIC8vIGNhbGxiYWNrIG9uIGNvbXBsZXRpb25cclxuICAgIHRoaXMub25EcmFnZ2FibGUoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwZGF0ZSB0aGUgbm9kZSB0byBzd2l0Y2ggbW9kYWxpdGllcyBiZXR3ZWVuIGJlaW5nIGRyYWdnYWJsZSwgYW5kIGdyYWJiYWJsZS4gVGhpcyBmdW5jdGlvbiBob2xkcyBjb2RlIHRoYXQgc2hvdWxkXHJcbiAgICogYmUgY2FsbGVkIHdoZW4gc3dpdGNoaW5nIGluIGVpdGhlciBkaXJlY3Rpb24uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBiYXNlSW50ZXJhY3Rpb25VcGRhdGUoIG9wdGlvbnNUb011dGF0ZSwgbGlzdGVuZXJzVG9SZW1vdmUsIGxpc3RlbmVyc1RvQWRkICkge1xyXG5cclxuICAgIC8vIGludGVycnVwdCBwcmlvciBpbnB1dCwgcmVzZXQgdGhlIGtleSBzdGF0ZSBvZiB0aGUgZHJhZyBoYW5kbGVyIGJ5IGludGVycnVwdGluZyB0aGUgZHJhZy4gRG9uJ3QgaW50ZXJydXB0IGFsbFxyXG4gICAgLy8gaW5wdXQsIGJ1dCBpbnN0ZWFkIGp1c3QgdGhvc2UgdG8gYmUgcmVtb3ZlZC5cclxuICAgIGxpc3RlbmVyc1RvUmVtb3ZlLmZvckVhY2goIGxpc3RlbmVyID0+IGxpc3RlbmVyLmludGVycnVwdCAmJiBsaXN0ZW5lci5pbnRlcnJ1cHQoKSApO1xyXG5cclxuICAgIC8vIHJlbW92ZSBhbGwgcHJldmlvdXMgbGlzdGVuZXJzIGZyb20gdGhlIG5vZGVcclxuICAgIHRoaXMucmVtb3ZlSW5wdXRMaXN0ZW5lcnMoIGxpc3RlbmVyc1RvUmVtb3ZlICk7XHJcblxyXG4gICAgLy8gdXBkYXRlIHRoZSBQRE9NIG9mIHRoZSBub2RlXHJcbiAgICB0aGlzLm5vZGUubXV0YXRlKCBvcHRpb25zVG9NdXRhdGUgKTtcclxuICAgIGFzc2VydCAmJiB0aGlzLmVuYWJsZWRQcm9wZXJ0eS52YWx1ZSAmJiBhc3NlcnQoIHRoaXMubm9kZS5mb2N1c2FibGUsICdHcmFiRHJhZ0ludGVyYWN0aW9uIG5vZGUgbXVzdCByZW1haW4gZm9jdXNhYmxlIGFmdGVyIG11dGF0aW9uJyApO1xyXG5cclxuICAgIHRoaXMuYWRkSW5wdXRMaXN0ZW5lcnMoIGxpc3RlbmVyc1RvQWRkICk7XHJcblxyXG4gICAgdGhpcy51cGRhdGVGb2N1c0hpZ2hsaWdodHMoKTtcclxuICAgIHRoaXMudXBkYXRlVmlzaWJpbGl0eUZvckN1ZXMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwZGF0ZSB0aGUgZm9jdXNIaWdobGlnaHRzIGFjY29yZGluZyB0byBpZiB3ZSBhcmUgaW4gZ3JhYmJhYmxlIG9yIGRyYWdnYWJsZSBzdGF0ZVxyXG4gICAqIE5vIG5lZWQgdG8gc2V0IHZpc2liaWxpdHkgdG8gdHJ1ZSwgYmVjYXVzZSB0aGF0IHdpbGwgaGFwcGVuIGZvciB1cyBieSBIaWdobGlnaHRPdmVybGF5IG9uIGZvY3VzLlxyXG4gICAqXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICB1cGRhdGVGb2N1c0hpZ2hsaWdodHMoKSB7XHJcbiAgICBpZiAoIHRoaXMuZ3JhYmJhYmxlICkge1xyXG4gICAgICB0aGlzLm5vZGUuZm9jdXNIaWdobGlnaHQgPSB0aGlzLmdyYWJGb2N1c0hpZ2hsaWdodDtcclxuICAgICAgdGhpcy5ub2RlLmludGVyYWN0aXZlSGlnaGxpZ2h0ID0gdGhpcy5ncmFiSW50ZXJhY3RpdmVIaWdobGlnaHQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy5ub2RlLmZvY3VzSGlnaGxpZ2h0ID0gdGhpcy5kcmFnRm9jdXNIaWdobGlnaHQ7XHJcbiAgICAgIHRoaXMubm9kZS5pbnRlcmFjdGl2ZUhpZ2hsaWdodCA9IHRoaXMuZHJhZ0ludGVyYWN0aXZlSGlnaGxpZ2h0O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXBkYXRlIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSBjdWVzIGZvciBib3RoIGdyYWJiYWJsZSBhbmQgZHJhZ2dhYmxlIHN0YXRlcy5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIHVwZGF0ZVZpc2liaWxpdHlGb3JDdWVzKCkge1xyXG4gICAgaWYgKCB0aGlzLmRyYWdDdWVOb2RlICkge1xyXG4gICAgICB0aGlzLmRyYWdDdWVOb2RlLnZpc2libGUgPSB0aGlzLnNob3dEcmFnQ3VlTm9kZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZ3JhYkN1ZU5vZGUudmlzaWJsZSA9IHRoaXMuc2hvd0dyYWJDdWVOb2RlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGQgYWxsIGxpc3RlbmVycyB0byBub2RlXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9uW119bGlzdGVuZXJzXHJcbiAgICovXHJcbiAgYWRkSW5wdXRMaXN0ZW5lcnMoIGxpc3RlbmVycyApIHtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgbGlzdGVuZXIgPSBsaXN0ZW5lcnNbIGkgXTtcclxuICAgICAgaWYgKCAhdGhpcy5ub2RlLmhhc0lucHV0TGlzdGVuZXIoIGxpc3RlbmVyICkgKSB7XHJcbiAgICAgICAgdGhpcy5ub2RlLmFkZElucHV0TGlzdGVuZXIoIGxpc3RlbmVyICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmUgYWxsIGxpc3RlbmVycyBmcm9tIHRoZSBub2RlXHJcbiAgICogQHBhcmFtIGxpc3RlbmVyc1xyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgcmVtb3ZlSW5wdXRMaXN0ZW5lcnMoIGxpc3RlbmVycyApIHtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgbGlzdGVuZXIgPSBsaXN0ZW5lcnNbIGkgXTtcclxuICAgICAgaWYgKCB0aGlzLm5vZGUuaGFzSW5wdXRMaXN0ZW5lciggbGlzdGVuZXIgKSApIHtcclxuICAgICAgICB0aGlzLm5vZGUucmVtb3ZlSW5wdXRMaXN0ZW5lciggbGlzdGVuZXIgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQG92ZXJyaWRlXHJcbiAgICogQHB1YmxpY1xyXG4gICAqL1xyXG4gIGRpc3Bvc2UoKSB7XHJcbiAgICB0aGlzLmRpc3Bvc2VHcmFiRHJhZ0ludGVyYWN0aW9uKCk7XHJcbiAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbnRlcnJ1cHQgdGhlIGdyYWIgZHJhZyBpbnRlcnJhY3Rpb24gLSBpbnRlcnJ1cHRzIGFueSBsaXN0ZW5lcnMgYXR0YWNoZWQgYW5kIG1ha2VzIHN1cmUgdGhlXHJcbiAgICogTm9kZSBpcyBiYWNrIGluIGl0cyBcImdyYWJiYWJsZVwiIHN0YXRlLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICBpbnRlcnJ1cHQoKSB7XHJcbiAgICB0aGlzLnByZXNzTGlzdGVuZXIuaW50ZXJydXB0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXNldCB0byBpbml0aWFsIHN0YXRlXHJcbiAgICogQHB1YmxpY1xyXG4gICAqL1xyXG4gIHJlc2V0KCkge1xyXG5cclxuICAgIC8vIHJlc2V0IG51bWJlck9mR3JhYnMgZm9yIHR1cm5Ub0dyYWJiYWJsZVxyXG4gICAgdGhpcy5udW1iZXJPZkdyYWJzID0gMDtcclxuICAgIHRoaXMudHVyblRvR3JhYmJhYmxlKCk7XHJcblxyXG4gICAgdGhpcy52b2ljaW5nRm9jdXNVdHRlcmFuY2UucmVzZXQoKTtcclxuXHJcbiAgICAvLyB0dXJuVG9HcmFiYmFibGUgd2lsbCBpbmNyZW1lbnQgdGhpcywgc28gcmVzZXQgaXQgYWdhaW5cclxuICAgIHRoaXMubnVtYmVyT2ZHcmFicyA9IDA7XHJcbiAgICB0aGlzLm51bWJlck9mS2V5Ym9hcmRHcmFicyA9IDA7XHJcbiAgICB0aGlzLmdyYWJDdWVOb2RlLnZpc2libGUgPSB0cnVlO1xyXG4gICAgaWYgKCB0aGlzLmRyYWdDdWVOb2RlICkge1xyXG4gICAgICB0aGlzLmRyYWdDdWVOb2RlLnZpc2libGUgPSB0cnVlO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeVBoZXQucmVnaXN0ZXIoICdHcmFiRHJhZ0ludGVyYWN0aW9uJywgR3JhYkRyYWdJbnRlcmFj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