// Copyright 2015-2024, University of Colorado Boulder

/**
 * An overlay that implements highlights for a Display. This is responsible for drawing the highlights and
 * observing Properties or Emitters that dictate when highlights should become active. A highlight surrounds a Node
 * to indicate that it is in focus or relevant.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import BooleanProperty from '../../../axon/js/BooleanProperty.js';
import { Shape } from '../../../kite/js/imports.js';
import optionize from '../../../phet-core/js/optionize.js';
import { ActivatedReadingBlockHighlight, Display, FocusManager, HighlightFromNode, HighlightPath, Node, scenery, TransformTracker } from '../imports.js';
// colors for the focus highlights, can be changed for different application backgrounds or color profiles, see
// the setters and getters below for these values.
let outerHighlightColor = HighlightPath.OUTER_FOCUS_COLOR;
let innerHighlightColor = HighlightPath.INNER_FOCUS_COLOR;
let innerGroupHighlightColor = HighlightPath.INNER_LIGHT_GROUP_FOCUS_COLOR;
let outerGroupHighlightColor = HighlightPath.OUTER_LIGHT_GROUP_FOCUS_COLOR;

// Type for the "mode" of a particular highlight, signifying behavior for handling the active highlight.

// Highlights displayed by the overlay support these types. Highlight behavior works like the following:
// - If value is null, the highlight will use default stylings of HighlightPath and surround the Node with focus.
// - If value is a Shape the Shape is set to a HighlightPath with default stylings in the global coordinate frame.
// - If you provide a Node it is your responsibility to position it in the global coordinate frame.
// - If the value is 'invisible' no highlight will be displayed at all.

export default class HighlightOverlay {
  // The root Node of our child display

  // Trail to the node with focus, modified when focus changes
  trail = null;

  // Node with focus, modified when focus changes
  node = null;

  // A references to the highlight from the Node that is highlighted.
  activeHighlight = null;

  // Signifies method of representing focus, 'bounds'|'node'|'shape'|'invisible', modified
  // when focus changes
  mode = null;

  // Signifies method off representing group focus, 'bounds'|'node', modified when
  // focus changes
  groupMode = null;

  // The group highlight node around an ancestor of this.node when focus changes, see ParallelDOM.setGroupFocusHighlight
  // for more information on the group focus highlight, modified when focus changes
  groupHighlightNode = null;

  // Tracks transformations to the focused node and the node with a group focus highlight, modified when focus changes
  transformTracker = null;
  groupTransformTracker = null;

  // If a node is using a custom focus highlight, a reference is kept so that it can be removed from the overlay when
  // node focus changes.
  nodeModeHighlight = null;

  // If true, the active highlight is in "node" mode and is layered in the scene graph. This field lets us deactivate
  // the highlight appropriately when it is in that state.
  nodeModeHighlightLayered = false;

  // If true, the next update() will trigger an update to the highlight's transform
  transformDirty = true;

  // The main node for the highlight. It will be transformed.
  highlightNode = new Node();

  // The main Node for the ReadingBlock highlight, while ReadingBlock content is being spoken by speech synthesis.
  readingBlockHighlightNode = new Node();

  // A reference to the Node that is added when a custom node is specified as the active highlight for the
  // ReadingBlock. Stored so that we can remove it when deactivating reading block highlights.
  addedReadingBlockHighlight = null;

  // A reference to the Node that is a ReadingBlock which the Voicing framework is currently speaking about.
  activeReadingBlockNode = null;

  // Trail to the ReadingBlock Node with an active highlight around it while the voicingManager is speaking its content.
  readingBlockTrail = null;

  // Whether the transform applied to the readinBlockHighlightNode is out of date.
  readingBlockTransformDirty = true;

  // The TransformTracker used to observe changes to the transform of the Node with Reading Block focus, so that
  // the highlight can match the ReadingBlock.
  readingBlockTransformTracker = null;

  // See HighlightOverlayOptions for documentation.

  // See HighlightOverlayOptions for documentation.

  // See HighlightOverlayOptions for documentation.

  // Display that manages all highlights

  // HTML element of the display

  // Used as the focus highlight when the overlay is passed a shape

  // Used as the default case for the highlight when the highlight value is null

  // Focus highlight for 'groups' of Nodes. When descendant node has focus, ancestor with groupFocusHighlight flag will
  // have this extra focus highlight surround its local bounds

  // A parent Node for group focus highlights so visibility of all group highlights can easily be controlled

  // The highlight shown around ReadingBlock Nodes while the voicingManager is speaking.

  constructor(display, focusRootNode, providedOptions) {
    const options = optionize()({
      // Controls whether highlights related to DOM focus are visible
      pdomFocusHighlightsVisibleProperty: new BooleanProperty(true),
      // Controls whether highlights related to Interactive Highlights are visible
      interactiveHighlightsVisibleProperty: new BooleanProperty(false),
      // Controls whether highlights associated with ReadingBlocks (of the Voicing feature set) are shown when
      // pointerFocusProperty changes
      readingBlockHighlightsVisibleProperty: new BooleanProperty(false)
    }, providedOptions);
    this.display = display;
    this.focusRootNode = focusRootNode;
    this.focusRootNode.addChild(this.highlightNode);
    this.focusRootNode.addChild(this.readingBlockHighlightNode);
    this.pdomFocusHighlightsVisibleProperty = options.pdomFocusHighlightsVisibleProperty;
    this.interactiveHighlightsVisibleProperty = options.interactiveHighlightsVisibleProperty;
    this.readingBlockHighlightsVisibleProperty = options.readingBlockHighlightsVisibleProperty;
    this.focusDisplay = new Display(this.focusRootNode, {
      allowWebGL: display.isWebGLAllowed(),
      allowCSSHacks: false,
      accessibility: false,
      interactive: false,
      // Layer fitting solved a chrome bug where we could lose focus highlights when tabbing while zoomed in certain
      // cases, see https://github.com/phetsims/scenery/issues/1605
      allowLayerFitting: true
    });
    this.domElement = this.focusDisplay.domElement;
    this.domElement.style.pointerEvents = 'none';
    this.shapeFocusHighlightPath = new HighlightPath(null);
    this.boundsFocusHighlightPath = new HighlightFromNode(null, {
      useLocalBounds: true
    });
    this.highlightNode.addChild(this.shapeFocusHighlightPath);
    this.highlightNode.addChild(this.boundsFocusHighlightPath);
    this.groupFocusHighlightPath = new HighlightFromNode(null, {
      useLocalBounds: true,
      useGroupDilation: true,
      outerLineWidth: HighlightPath.GROUP_OUTER_LINE_WIDTH,
      innerLineWidth: HighlightPath.GROUP_INNER_LINE_WIDTH,
      innerStroke: HighlightPath.OUTER_FOCUS_COLOR
    });
    this.groupFocusHighlightParent = new Node({
      children: [this.groupFocusHighlightPath]
    });
    this.focusRootNode.addChild(this.groupFocusHighlightParent);
    this.readingBlockHighlightPath = new ActivatedReadingBlockHighlight(null);
    this.readingBlockHighlightNode.addChild(this.readingBlockHighlightPath);

    // Listeners bound once, so we can access them for removal.
    this.boundsListener = this.onBoundsChange.bind(this);
    this.transformListener = this.onTransformChange.bind(this);
    this.domFocusListener = this.onFocusChange.bind(this);
    this.readingBlockTransformListener = this.onReadingBlockTransformChange.bind(this);
    this.focusHighlightListener = this.onFocusHighlightChange.bind(this);
    this.interactiveHighlightListener = this.onInteractiveHighlightChange.bind(this);
    this.focusHighlightsVisibleListener = this.onFocusHighlightsVisibleChange.bind(this);
    this.voicingHighlightsVisibleListener = this.onVoicingHighlightsVisibleChange.bind(this);
    this.pointerFocusListener = this.onPointerFocusChange.bind(this);
    this.lockedPointerFocusListener = this.onLockedPointerFocusChange.bind(this);
    this.readingBlockFocusListener = this.onReadingBlockFocusChange.bind(this);
    this.readingBlockHighlightChangeListener = this.onReadingBlockHighlightChange.bind(this);
    FocusManager.pdomFocusProperty.link(this.domFocusListener);
    display.focusManager.pointerFocusProperty.link(this.pointerFocusListener);
    display.focusManager.readingBlockFocusProperty.link(this.readingBlockFocusListener);
    display.focusManager.lockedPointerFocusProperty.link(this.lockedPointerFocusListener);
    this.pdomFocusHighlightsVisibleProperty.link(this.focusHighlightsVisibleListener);
    this.interactiveHighlightsVisibleProperty.link(this.voicingHighlightsVisibleListener);
  }

  /**
   * Releases references
   */
  dispose() {
    if (this.hasHighlight()) {
      this.deactivateHighlight();
    }
    FocusManager.pdomFocusProperty.unlink(this.domFocusListener);
    this.pdomFocusHighlightsVisibleProperty.unlink(this.focusHighlightsVisibleListener);
    this.interactiveHighlightsVisibleProperty.unlink(this.voicingHighlightsVisibleListener);
    this.display.focusManager.pointerFocusProperty.unlink(this.pointerFocusListener);
    this.display.focusManager.readingBlockFocusProperty.unlink(this.readingBlockFocusListener);
    this.focusDisplay.dispose();
  }

  /**
   * Returns whether or not this HighlightOverlay is displaying some highlight.
   */
  hasHighlight() {
    return !!this.trail;
  }

  /**
   * Returns true if there is an active highlight around a ReadingBlock while the voicingManager is speaking its
   * Voicing content.
   */
  hasReadingBlockHighlight() {
    return !!this.readingBlockTrail;
  }

  /**
   * Activates the highlight, choosing a mode for whether the highlight will be a shape, node, or bounds.
   *
   * @param trail - The focused trail to highlight. It assumes that this trail is in this display.
   * @param node - Node receiving the highlight
   * @param nodeHighlight - the highlight to use
   * @param layerable - Is the highlight layerable in the scene graph?
   * @param visibleProperty - Property controlling the visibility for the provided highlight
   */
  activateHighlight(trail, node, nodeHighlight, layerable, visibleProperty) {
    this.trail = trail;
    this.node = node;
    const highlight = nodeHighlight;
    this.activeHighlight = highlight;

    // we may or may not track this trail depending on whether the focus highlight surrounds the trail's leaf node or
    // a different node
    let trailToTrack = trail;

    // Invisible mode - no focus highlight; this is only for testing mode, when Nodes rarely have bounds.
    if (highlight === 'invisible') {
      this.mode = 'invisible';
    }
    // Shape mode
    else if (highlight instanceof Shape) {
      this.mode = 'shape';
      this.shapeFocusHighlightPath.visible = true;
      this.shapeFocusHighlightPath.setShape(highlight);
    }
    // Node mode
    else if (highlight instanceof Node) {
      this.mode = 'node';

      // if using a focus highlight from another node, we will track that node's transform instead of the focused node
      if (highlight instanceof HighlightPath) {
        const highlightPath = highlight;
        assert && assert(highlight.shape !== null, 'The shape of the Node highlight should be set by now. Does it have bounds?');
        if (highlightPath.transformSourceNode) {
          trailToTrack = highlight.getUniqueHighlightTrail(this.trail);
        }
      }

      // store the focus highlight so that it can be removed later
      this.nodeModeHighlight = highlight;
      if (layerable) {
        // flag so that we know how to deactivate in this case
        this.nodeModeHighlightLayered = true;

        // the focusHighlight is just a node in the scene graph, so set it visible - visibility of other highlights
        // controlled by visibility of parent Nodes but that cannot be done in this case because the highlight
        // can be anywhere in the scene graph, so have to check pdomFocusHighlightsVisibleProperty
        this.nodeModeHighlight.visible = visibleProperty.get();
      } else {
        // the node is already in the scene graph, so this will set visibility
        // for all instances.
        this.nodeModeHighlight.visible = true;

        // Use the node itself as the highlight
        this.highlightNode.addChild(this.nodeModeHighlight);
      }
    }
    // Bounds mode
    else {
      this.mode = 'bounds';
      this.boundsFocusHighlightPath.setShapeFromNode(this.node, this.trail);
      this.boundsFocusHighlightPath.visible = true;
      this.node.localBoundsProperty.lazyLink(this.boundsListener);
      this.onBoundsChange();
    }
    this.transformTracker = new TransformTracker(trailToTrack, {
      isStatic: true
    });
    this.transformTracker.addListener(this.transformListener);

    // handle group focus highlights
    this.activateGroupHighlights();

    // update highlight colors if necessary
    this.updateHighlightColors();
    this.transformDirty = true;
  }

  /**
   * Activate a focus highlight, activating the highlight and adding a listener that will update the highlight whenever
   * the Node's focusHighlight changes
   */
  activateFocusHighlight(trail, node) {
    this.activateHighlight(trail, node, node.focusHighlight, node.focusHighlightLayerable, this.pdomFocusHighlightsVisibleProperty);

    // handle any changes to the focus highlight while the node has focus
    node.focusHighlightChangedEmitter.addListener(this.focusHighlightListener);
  }

  /**
   * Activate an interactive highlight, activating the highlight and adding a listener that will update the highlight
   * changes while it is active.
   */
  activateInteractiveHighlight(trail, node) {
    this.activateHighlight(trail, node, node.interactiveHighlight || node.focusHighlight, node.interactiveHighlightLayerable, this.interactiveHighlightsVisibleProperty);

    // sanity check that our Node actually uses InteractiveHighlighting
    assert && assert(node.isInteractiveHighlighting, 'Node does not support any kind of interactive highlighting.');
    node.interactiveHighlightChangedEmitter.addListener(this.interactiveHighlightListener);

    // handle changes to the highlight while it is active - Since the highlight can fall back to the focus highlight
    // watch for updates to redraw when that highlight changes as well.
    node.focusHighlightChangedEmitter.addListener(this.interactiveHighlightListener);
  }

  /**
   * Activate the Reading Block highlight. This highlight is separate from others in the overlay and will always
   * surround the Bounds of the focused Node. It is shown in response to certain input on Nodes with Voicing while
   * the voicingManager is speaking.
   *
   * Note that customizations for this highlight are not supported at this time, that could be added in the future if
   * we need.
   */
  activateReadingBlockHighlight(trail) {
    this.readingBlockTrail = trail;
    const readingBlockNode = trail.lastNode();
    assert && assert(readingBlockNode.isReadingBlock, 'should not activate a reading block highlight for a Node that is not a ReadingBlock');
    this.activeReadingBlockNode = readingBlockNode;
    const readingBlockHighlight = this.activeReadingBlockNode.readingBlockActiveHighlight;
    this.addedReadingBlockHighlight = readingBlockHighlight;
    if (readingBlockHighlight === 'invisible') {
      // nothing to draw
    } else if (readingBlockHighlight instanceof Shape) {
      this.readingBlockHighlightPath.setShape(readingBlockHighlight);
      this.readingBlockHighlightPath.visible = true;
    } else if (readingBlockHighlight instanceof Node) {
      // node mode
      this.readingBlockHighlightNode.addChild(readingBlockHighlight);
    } else {
      // bounds mode
      this.readingBlockHighlightPath.setShapeFromNode(this.activeReadingBlockNode, this.readingBlockTrail);
      this.readingBlockHighlightPath.visible = true;
    }

    // update the highlight if the transform for the Node ever changes
    this.readingBlockTransformTracker = new TransformTracker(this.readingBlockTrail, {
      isStatic: true
    });
    this.readingBlockTransformTracker.addListener(this.readingBlockTransformListener);

    // update the highlight if it is changed on the Node while active
    this.activeReadingBlockNode.readingBlockActiveHighlightChangedEmitter.addListener(this.readingBlockHighlightChangeListener);
    this.readingBlockTransformDirty = true;
  }

  /**
   * Deactivate the speaking highlight by making it invisible.
   */
  deactivateReadingBlockHighlight() {
    this.readingBlockHighlightPath.visible = false;
    if (this.addedReadingBlockHighlight instanceof Node) {
      this.readingBlockHighlightNode.removeChild(this.addedReadingBlockHighlight);
    }
    assert && assert(this.readingBlockTransformTracker, 'How can we deactivate the TransformTracker if it wasnt assigned.');
    const transformTracker = this.readingBlockTransformTracker;
    transformTracker.removeListener(this.readingBlockTransformListener);
    transformTracker.dispose();
    this.readingBlockTransformTracker = null;
    assert && assert(this.activeReadingBlockNode, 'How can we deactivate the activeReadingBlockNode if it wasnt assigned.');
    this.activeReadingBlockNode.readingBlockActiveHighlightChangedEmitter.removeListener(this.readingBlockHighlightChangeListener);
    this.activeReadingBlockNode = null;
    this.readingBlockTrail = null;
    this.addedReadingBlockHighlight = null;
  }

  /**
   * Deactivates the all active highlights, disposing and removing listeners as necessary.
   */
  deactivateHighlight() {
    assert && assert(this.node, 'Need an active Node to deactivate highlights');
    const activeNode = this.node;
    if (this.mode === 'shape') {
      this.shapeFocusHighlightPath.visible = false;
    } else if (this.mode === 'node') {
      assert && assert(this.nodeModeHighlight, 'How can we deactivate if nodeModeHighlight is not assigned');
      const nodeModeHighlight = this.nodeModeHighlight;

      // If layered, client has put the Node where they want in the scene graph and we cannot remove it
      if (this.nodeModeHighlightLayered) {
        this.nodeModeHighlightLayered = false;
      } else {
        this.highlightNode.removeChild(nodeModeHighlight);
      }

      // node focus highlight can be cleared now that it has been removed
      nodeModeHighlight.visible = false;
      this.nodeModeHighlight = null;
    } else if (this.mode === 'bounds') {
      this.boundsFocusHighlightPath.visible = false;
      activeNode.localBoundsProperty.unlink(this.boundsListener);
    }

    // remove listeners that redraw the highlight if a type of highlight changes on the Node
    if (activeNode.focusHighlightChangedEmitter.hasListener(this.focusHighlightListener)) {
      activeNode.focusHighlightChangedEmitter.removeListener(this.focusHighlightListener);
    }
    const activeInteractiveHighlightingNode = activeNode;
    if (activeInteractiveHighlightingNode.isInteractiveHighlighting) {
      if (activeInteractiveHighlightingNode.interactiveHighlightChangedEmitter.hasListener(this.interactiveHighlightListener)) {
        activeInteractiveHighlightingNode.interactiveHighlightChangedEmitter.removeListener(this.interactiveHighlightListener);
      }
      if (activeInteractiveHighlightingNode.focusHighlightChangedEmitter.hasListener(this.interactiveHighlightListener)) {
        activeInteractiveHighlightingNode.focusHighlightChangedEmitter.removeListener(this.interactiveHighlightListener);
      }
    }

    // remove all 'group' focus highlights
    this.deactivateGroupHighlights();
    this.trail = null;
    this.node = null;
    this.mode = null;
    this.activeHighlight = null;
    this.transformTracker.removeListener(this.transformListener);
    this.transformTracker.dispose();
    this.transformTracker = null;
  }

  /**
   * Activate all 'group' focus highlights by searching for ancestor nodes from the node that has focus
   * and adding a rectangle around it if it has a "groupFocusHighlight". A group highlight will only appear around
   * the closest ancestor that has a one.
   */
  activateGroupHighlights() {
    assert && assert(this.trail, 'must have an active trail to activate group highlights');
    const trail = this.trail;
    for (let i = 0; i < trail.length; i++) {
      const node = trail.nodes[i];
      const highlight = node.groupFocusHighlight;
      if (highlight) {
        // update transform tracker
        const trailToParent = trail.upToNode(node);
        this.groupTransformTracker = new TransformTracker(trailToParent);
        this.groupTransformTracker.addListener(this.transformListener);
        if (typeof highlight === 'boolean') {
          // add a bounding rectangle around the node that uses group highlights
          this.groupFocusHighlightPath.setShapeFromNode(node, trailToParent);
          this.groupFocusHighlightPath.visible = true;
          this.groupHighlightNode = this.groupFocusHighlightPath;
          this.groupMode = 'bounds';
        } else if (highlight instanceof Node) {
          this.groupHighlightNode = highlight;
          this.groupFocusHighlightParent.addChild(highlight);
          this.groupMode = 'node';
        }

        // Only closest ancestor with group highlight will get the group highlight
        break;
      }
    }
  }

  /**
   * Update focus highlight colors. This is a no-op if we are in 'node' mode, or if none of the highlight colors
   * have changed.
   *
   * TODO: Support updating focus highlight strokes in 'node' mode as well? https://github.com/phetsims/scenery/issues/1581
   */
  updateHighlightColors() {
    if (this.mode === 'shape') {
      if (this.shapeFocusHighlightPath.innerHighlightColor !== HighlightOverlay.getInnerHighlightColor()) {
        this.shapeFocusHighlightPath.setInnerHighlightColor(HighlightOverlay.getInnerHighlightColor());
      }
      if (this.shapeFocusHighlightPath.outerHighlightColor !== HighlightOverlay.getOuterHighlightColor()) {
        this.shapeFocusHighlightPath.setOuterHighlightColor(HighlightOverlay.getOuterHighlightColor());
      }
    } else if (this.mode === 'bounds') {
      if (this.boundsFocusHighlightPath.innerHighlightColor !== HighlightOverlay.getInnerHighlightColor()) {
        this.boundsFocusHighlightPath.setInnerHighlightColor(HighlightOverlay.getInnerHighlightColor());
      }
      if (this.boundsFocusHighlightPath.outerHighlightColor !== HighlightOverlay.getOuterHighlightColor()) {
        this.boundsFocusHighlightPath.setOuterHighlightColor(HighlightOverlay.getOuterHighlightColor());
      }
    }

    // if a group focus highlight is active, update strokes
    if (this.groupMode) {
      if (this.groupFocusHighlightPath.innerHighlightColor !== HighlightOverlay.getInnerGroupHighlightColor()) {
        this.groupFocusHighlightPath.setInnerHighlightColor(HighlightOverlay.getInnerGroupHighlightColor());
      }
      if (this.groupFocusHighlightPath.outerHighlightColor !== HighlightOverlay.getOuterGroupHighlightColor()) {
        this.groupFocusHighlightPath.setOuterHighlightColor(HighlightOverlay.getOuterGroupHighlightColor());
      }
    }
  }

  /**
   * Remove all group focus highlights by making them invisible, or removing them from the root of this overlay,
   * depending on mode.
   */
  deactivateGroupHighlights() {
    if (this.groupMode) {
      if (this.groupMode === 'bounds') {
        this.groupFocusHighlightPath.visible = false;
      } else if (this.groupMode === 'node') {
        assert && assert(this.groupHighlightNode, 'Need a groupHighlightNode to deactivate this mode');
        this.groupFocusHighlightParent.removeChild(this.groupHighlightNode);
      }
      this.groupMode = null;
      this.groupHighlightNode = null;
      assert && assert(this.groupTransformTracker, 'Need a groupTransformTracker to dispose');
      this.groupTransformTracker.removeListener(this.transformListener);
      this.groupTransformTracker.dispose();
      this.groupTransformTracker = null;
    }
  }

  /**
   * Called from HighlightOverlay after transforming the highlight. Only called when the transform changes.
   */
  afterTransform() {
    // This matrix makes sure that the line width of the highlight remains appropriately sized, even when the Node
    // (and therefore its highlight) may be scaled. However, we DO want to scale up the highlight line width when
    // the scene is zoomed in from the global pan/zoom listener, so we include that inverted matrix.
    assert && assert(this.transformTracker, 'Must have an active transformTracker to adjust from transformation.');
    const lineWidthScalingMatrix = this.transformTracker.getMatrix().timesMatrix(HighlightPath.getCorrectiveScalingMatrix());
    if (this.mode === 'shape') {
      this.shapeFocusHighlightPath.updateLineWidth(lineWidthScalingMatrix);
    } else if (this.mode === 'bounds') {
      this.boundsFocusHighlightPath.updateLineWidth(lineWidthScalingMatrix);
    } else if (this.mode === 'node' && this.activeHighlight instanceof HighlightPath && this.activeHighlight.updateLineWidth) {
      this.activeHighlight.updateLineWidth(lineWidthScalingMatrix);
    }

    // If the group highlight is active, we need to correct the line widths for that highlight.
    if (this.groupHighlightNode) {
      if (this.groupMode === 'bounds') {
        this.groupFocusHighlightPath.updateLineWidth(lineWidthScalingMatrix);
      } else if (this.groupMode === 'node' && this.groupHighlightNode instanceof HighlightPath && this.groupHighlightNode.updateLineWidth) {
        this.groupHighlightNode.updateLineWidth(lineWidthScalingMatrix);
      }
    }

    // If the ReadingBlock highlight is active, we need to correct the line widths for that highlight.
    if (this.readingBlockTrail) {
      this.readingBlockHighlightPath.updateLineWidth(lineWidthScalingMatrix);
    }
  }

  /**
   * Every time the transform changes on the target Node signify that updates are necessary, see the usage of the
   * TransformTrackers.
   */
  onTransformChange() {
    this.transformDirty = true;
  }

  /**
   * Mark that the transform for the ReadingBlock highlight is out of date and needs to be recalculated next update.
   */
  onReadingBlockTransformChange() {
    this.readingBlockTransformDirty = true;
  }

  /**
   * Called when bounds change on our node when we are in "Bounds" mode
   */
  onBoundsChange() {
    assert && assert(this.node, 'Must have an active node when bounds are changing');
    assert && assert(this.trail, 'Must have an active trail when updating default bounds highlight');
    this.boundsFocusHighlightPath.setShapeFromNode(this.node, this.trail);
  }

  /**
   * Called when the main Scenery focus pair (Display,Trail) changes. The Trail points to the Node that has
   * focus and a highlight will appear around this Node if focus highlights are visible.
   */
  onFocusChange(focus) {
    const newTrail = focus && focus.display === this.display ? focus.trail : null;
    if (this.hasHighlight()) {
      this.deactivateHighlight();
    }
    if (newTrail && this.pdomFocusHighlightsVisibleProperty.value) {
      const node = newTrail.lastNode();
      this.activateFocusHighlight(newTrail, node);
    } else if (this.display.focusManager.pointerFocusProperty.value && this.interactiveHighlightsVisibleProperty.value) {
      this.updateInteractiveHighlight(this.display.focusManager.pointerFocusProperty.value);
    }
  }

  /**
   * Called when the pointerFocusProperty changes. pointerFocusProperty will have the Trail to the
   * Node that composes Voicing and is under the Pointer. A highlight will appear around this Node if
   * voicing highlights are visible.
   */
  onPointerFocusChange(focus) {
    // updateInteractiveHighlight will only activate the highlight if pdomFocusHighlightsVisibleProperty is false,
    // but check here as well so that we don't do work to deactivate highlights only to immediately reactivate them
    if (!this.display.focusManager.lockedPointerFocusProperty.value && !this.display.focusManager.pdomFocusHighlightsVisibleProperty.value) {
      this.updateInteractiveHighlight(focus);
    }
  }

  /**
   * Redraws the highlight. There are cases where we want to do this regardless of whether the pointer focus
   * is locked, such as when the highlight changes changes for a Node that is activated for highlighting.
   *
   * As of 8/11/21 we also decided that Interactive Highlights should also never be shown while
   * PDOM highlights are visible, to avoid confusing cases where the Interactive Highlight
   * can appear while the DOM focus highlight is active and conveying information. In the future
   * we might make it so that both can be visible at the same time, but that will require
   * changing the look of one of the highlights so it is clear they are distinct.
   */
  updateInteractiveHighlight(focus) {
    const newTrail = focus && focus.display === this.display ? focus.trail : null;

    // always clear the highlight if it is being removed
    if (this.hasHighlight()) {
      this.deactivateHighlight();
    }

    // only activate a new highlight if PDOM focus highlights are not displayed, see JSDoc
    let activated = false;
    if (newTrail && !this.display.focusManager.pdomFocusHighlightsVisibleProperty.value) {
      const node = newTrail.lastNode();
      if (node.isReadingBlock && this.readingBlockHighlightsVisibleProperty.value || !node.isReadingBlock && this.interactiveHighlightsVisibleProperty.value) {
        this.activateInteractiveHighlight(newTrail, node);
        activated = true;
      }
    }
    if (!activated && FocusManager.pdomFocus && this.pdomFocusHighlightsVisibleProperty.value) {
      this.onFocusChange(FocusManager.pdomFocus);
    }
  }

  /**
   * Called whenever the lockedPointerFocusProperty changes. If the lockedPointerFocusProperty changes we probably
   * have to update the highlight because interaction with a Node that uses InteractiveHighlighting just ended.
   */
  onLockedPointerFocusChange(focus) {
    this.updateInteractiveHighlight(focus || this.display.focusManager.pointerFocusProperty.value);
  }

  /**
   * Responsible for deactivating the Reading Block highlight when the display.focusManager.readingBlockFocusProperty changes.
   * The Reading Block waits to activate until the voicingManager starts speaking because there is often a stop speaking
   * event that comes right after the speaker starts to interrupt the previous utterance.
   */
  onReadingBlockFocusChange(focus) {
    if (this.hasReadingBlockHighlight()) {
      this.deactivateReadingBlockHighlight();
    }
    const newTrail = focus && focus.display === this.display ? focus.trail : null;
    if (newTrail) {
      this.activateReadingBlockHighlight(newTrail);
    }
  }

  /**
   * If the focused node has an updated focus highlight, we must do all the work of highlight deactivation/activation
   * as if the application focus changed. If focus highlight mode changed, we need to add/remove static listeners,
   * add/remove highlight children, and so on. Called when focus highlight changes, but should only ever be
   * necessary when the node has focus.
   */
  onFocusHighlightChange() {
    assert && assert(this.node && this.node.focused, 'update should only be necessary if node already has focus');
    this.onFocusChange(FocusManager.pdomFocus);
  }

  /**
   * If the Node has pointer focus and the interacive highlight changes, we must do all of the work to reapply the
   * highlight as if the value of the focusProperty changed.
   */
  onInteractiveHighlightChange() {
    if (assert) {
      const interactiveHighlightNode = this.node;
      const lockedPointerFocus = this.display.focusManager.lockedPointerFocusProperty.value;
      assert(interactiveHighlightNode || lockedPointerFocus && lockedPointerFocus.trail.lastNode() === this.node, 'Update should only be necessary if Node is activated with a Pointer or pointer focus is locked during interaction');
    }

    // Prefer the trail to the 'locked' highlight
    this.updateInteractiveHighlight(this.display.focusManager.lockedPointerFocusProperty.value || this.display.focusManager.pointerFocusProperty.value);
  }

  /**
   * Redraw the highlight for the ReadingBlock if it changes while the reading block highlight is already
   * active for a Node.
   */
  onReadingBlockHighlightChange() {
    assert && assert(this.activeReadingBlockNode, 'Update should only be necessary when there is an active ReadingBlock Node');
    assert && assert(this.activeReadingBlockNode.readingBlockActivated, 'Update should only be necessary while the ReadingBlock is activated');
    this.onReadingBlockFocusChange(this.display.focusManager.readingBlockFocusProperty.value);
  }

  /**
   * When focus highlight visibility changes, deactivate highlights or reactivate the highlight around the Node
   * with focus.
   */
  onFocusHighlightsVisibleChange() {
    this.onFocusChange(FocusManager.pdomFocus);
  }

  /**
   * When voicing highlight visibility changes, deactivate highlights or reactivate the highlight around the Node
   * with focus. Note that when voicing is disabled we will never set the pointerFocusProperty to prevent
   * extra work, so this function shouldn't do much. But it is here to complete the API.
   */
  onVoicingHighlightsVisibleChange() {
    this.onPointerFocusChange(this.display.focusManager.pointerFocusProperty.value);
  }

  /**
   * Called by Display, updates this overlay in the Display.updateDisplay call.
   */
  update() {
    // Transform the highlight to match the position of the node
    if (this.hasHighlight() && this.transformDirty) {
      this.transformDirty = false;
      assert && assert(this.transformTracker, 'The transformTracker must be available on update if transform is dirty');
      this.highlightNode.setMatrix(this.transformTracker.matrix);
      if (this.groupHighlightNode) {
        assert && assert(this.groupTransformTracker, 'The groupTransformTracker must be available on update if transform is dirty');
        this.groupHighlightNode.setMatrix(this.groupTransformTracker.matrix);
      }
      this.afterTransform();
    }
    if (this.hasReadingBlockHighlight() && this.readingBlockTransformDirty) {
      this.readingBlockTransformDirty = false;
      assert && assert(this.readingBlockTransformTracker, 'The groupTransformTracker must be available on update if transform is dirty');
      this.readingBlockHighlightNode.setMatrix(this.readingBlockTransformTracker.matrix);
    }
    if (!this.display.size.equals(this.focusDisplay.size)) {
      this.focusDisplay.setWidthHeight(this.display.width, this.display.height);
    }
    this.focusDisplay.updateDisplay();
  }

  /**
   * Set the inner color of all focus highlights.
   */
  static setInnerHighlightColor(color) {
    innerHighlightColor = color;
  }

  /**
   * Get the inner color of all focus highlights.
   */
  static getInnerHighlightColor() {
    return innerHighlightColor;
  }

  /**
   * Set the outer color of all focus highlights.
   */
  static setOuterHilightColor(color) {
    outerHighlightColor = color;
  }

  /**
   * Get the outer color of all focus highlights.
   */
  static getOuterHighlightColor() {
    return outerHighlightColor;
  }

  /**
   * Set the inner color of all group focus highlights.
   */
  static setInnerGroupHighlightColor(color) {
    innerGroupHighlightColor = color;
  }

  /**
   * Get the inner color of all group focus highlights
   */
  static getInnerGroupHighlightColor() {
    return innerGroupHighlightColor;
  }

  /**
   * Set the outer color of all group focus highlight.
   */
  static setOuterGroupHighlightColor(color) {
    outerGroupHighlightColor = color;
  }

  /**
   * Get the outer color of all group focus highlights.
   */
  static getOuterGroupHighlightColor() {
    return outerGroupHighlightColor;
  }
}
scenery.register('HighlightOverlay', HighlightOverlay);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJTaGFwZSIsIm9wdGlvbml6ZSIsIkFjdGl2YXRlZFJlYWRpbmdCbG9ja0hpZ2hsaWdodCIsIkRpc3BsYXkiLCJGb2N1c01hbmFnZXIiLCJIaWdobGlnaHRGcm9tTm9kZSIsIkhpZ2hsaWdodFBhdGgiLCJOb2RlIiwic2NlbmVyeSIsIlRyYW5zZm9ybVRyYWNrZXIiLCJvdXRlckhpZ2hsaWdodENvbG9yIiwiT1VURVJfRk9DVVNfQ09MT1IiLCJpbm5lckhpZ2hsaWdodENvbG9yIiwiSU5ORVJfRk9DVVNfQ09MT1IiLCJpbm5lckdyb3VwSGlnaGxpZ2h0Q29sb3IiLCJJTk5FUl9MSUdIVF9HUk9VUF9GT0NVU19DT0xPUiIsIm91dGVyR3JvdXBIaWdobGlnaHRDb2xvciIsIk9VVEVSX0xJR0hUX0dST1VQX0ZPQ1VTX0NPTE9SIiwiSGlnaGxpZ2h0T3ZlcmxheSIsInRyYWlsIiwibm9kZSIsImFjdGl2ZUhpZ2hsaWdodCIsIm1vZGUiLCJncm91cE1vZGUiLCJncm91cEhpZ2hsaWdodE5vZGUiLCJ0cmFuc2Zvcm1UcmFja2VyIiwiZ3JvdXBUcmFuc2Zvcm1UcmFja2VyIiwibm9kZU1vZGVIaWdobGlnaHQiLCJub2RlTW9kZUhpZ2hsaWdodExheWVyZWQiLCJ0cmFuc2Zvcm1EaXJ0eSIsImhpZ2hsaWdodE5vZGUiLCJyZWFkaW5nQmxvY2tIaWdobGlnaHROb2RlIiwiYWRkZWRSZWFkaW5nQmxvY2tIaWdobGlnaHQiLCJhY3RpdmVSZWFkaW5nQmxvY2tOb2RlIiwicmVhZGluZ0Jsb2NrVHJhaWwiLCJyZWFkaW5nQmxvY2tUcmFuc2Zvcm1EaXJ0eSIsInJlYWRpbmdCbG9ja1RyYW5zZm9ybVRyYWNrZXIiLCJjb25zdHJ1Y3RvciIsImRpc3BsYXkiLCJmb2N1c1Jvb3ROb2RlIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsInBkb21Gb2N1c0hpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHkiLCJpbnRlcmFjdGl2ZUhpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHkiLCJyZWFkaW5nQmxvY2tIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5IiwiYWRkQ2hpbGQiLCJmb2N1c0Rpc3BsYXkiLCJhbGxvd1dlYkdMIiwiaXNXZWJHTEFsbG93ZWQiLCJhbGxvd0NTU0hhY2tzIiwiYWNjZXNzaWJpbGl0eSIsImludGVyYWN0aXZlIiwiYWxsb3dMYXllckZpdHRpbmciLCJkb21FbGVtZW50Iiwic3R5bGUiLCJwb2ludGVyRXZlbnRzIiwic2hhcGVGb2N1c0hpZ2hsaWdodFBhdGgiLCJib3VuZHNGb2N1c0hpZ2hsaWdodFBhdGgiLCJ1c2VMb2NhbEJvdW5kcyIsImdyb3VwRm9jdXNIaWdobGlnaHRQYXRoIiwidXNlR3JvdXBEaWxhdGlvbiIsIm91dGVyTGluZVdpZHRoIiwiR1JPVVBfT1VURVJfTElORV9XSURUSCIsImlubmVyTGluZVdpZHRoIiwiR1JPVVBfSU5ORVJfTElORV9XSURUSCIsImlubmVyU3Ryb2tlIiwiZ3JvdXBGb2N1c0hpZ2hsaWdodFBhcmVudCIsImNoaWxkcmVuIiwicmVhZGluZ0Jsb2NrSGlnaGxpZ2h0UGF0aCIsImJvdW5kc0xpc3RlbmVyIiwib25Cb3VuZHNDaGFuZ2UiLCJiaW5kIiwidHJhbnNmb3JtTGlzdGVuZXIiLCJvblRyYW5zZm9ybUNoYW5nZSIsImRvbUZvY3VzTGlzdGVuZXIiLCJvbkZvY3VzQ2hhbmdlIiwicmVhZGluZ0Jsb2NrVHJhbnNmb3JtTGlzdGVuZXIiLCJvblJlYWRpbmdCbG9ja1RyYW5zZm9ybUNoYW5nZSIsImZvY3VzSGlnaGxpZ2h0TGlzdGVuZXIiLCJvbkZvY3VzSGlnaGxpZ2h0Q2hhbmdlIiwiaW50ZXJhY3RpdmVIaWdobGlnaHRMaXN0ZW5lciIsIm9uSW50ZXJhY3RpdmVIaWdobGlnaHRDaGFuZ2UiLCJmb2N1c0hpZ2hsaWdodHNWaXNpYmxlTGlzdGVuZXIiLCJvbkZvY3VzSGlnaGxpZ2h0c1Zpc2libGVDaGFuZ2UiLCJ2b2ljaW5nSGlnaGxpZ2h0c1Zpc2libGVMaXN0ZW5lciIsIm9uVm9pY2luZ0hpZ2hsaWdodHNWaXNpYmxlQ2hhbmdlIiwicG9pbnRlckZvY3VzTGlzdGVuZXIiLCJvblBvaW50ZXJGb2N1c0NoYW5nZSIsImxvY2tlZFBvaW50ZXJGb2N1c0xpc3RlbmVyIiwib25Mb2NrZWRQb2ludGVyRm9jdXNDaGFuZ2UiLCJyZWFkaW5nQmxvY2tGb2N1c0xpc3RlbmVyIiwib25SZWFkaW5nQmxvY2tGb2N1c0NoYW5nZSIsInJlYWRpbmdCbG9ja0hpZ2hsaWdodENoYW5nZUxpc3RlbmVyIiwib25SZWFkaW5nQmxvY2tIaWdobGlnaHRDaGFuZ2UiLCJwZG9tRm9jdXNQcm9wZXJ0eSIsImxpbmsiLCJmb2N1c01hbmFnZXIiLCJwb2ludGVyRm9jdXNQcm9wZXJ0eSIsInJlYWRpbmdCbG9ja0ZvY3VzUHJvcGVydHkiLCJsb2NrZWRQb2ludGVyRm9jdXNQcm9wZXJ0eSIsImRpc3Bvc2UiLCJoYXNIaWdobGlnaHQiLCJkZWFjdGl2YXRlSGlnaGxpZ2h0IiwidW5saW5rIiwiaGFzUmVhZGluZ0Jsb2NrSGlnaGxpZ2h0IiwiYWN0aXZhdGVIaWdobGlnaHQiLCJub2RlSGlnaGxpZ2h0IiwibGF5ZXJhYmxlIiwidmlzaWJsZVByb3BlcnR5IiwiaGlnaGxpZ2h0IiwidHJhaWxUb1RyYWNrIiwidmlzaWJsZSIsInNldFNoYXBlIiwiaGlnaGxpZ2h0UGF0aCIsImFzc2VydCIsInNoYXBlIiwidHJhbnNmb3JtU291cmNlTm9kZSIsImdldFVuaXF1ZUhpZ2hsaWdodFRyYWlsIiwiZ2V0Iiwic2V0U2hhcGVGcm9tTm9kZSIsImxvY2FsQm91bmRzUHJvcGVydHkiLCJsYXp5TGluayIsImlzU3RhdGljIiwiYWRkTGlzdGVuZXIiLCJhY3RpdmF0ZUdyb3VwSGlnaGxpZ2h0cyIsInVwZGF0ZUhpZ2hsaWdodENvbG9ycyIsImFjdGl2YXRlRm9jdXNIaWdobGlnaHQiLCJmb2N1c0hpZ2hsaWdodCIsImZvY3VzSGlnaGxpZ2h0TGF5ZXJhYmxlIiwiZm9jdXNIaWdobGlnaHRDaGFuZ2VkRW1pdHRlciIsImFjdGl2YXRlSW50ZXJhY3RpdmVIaWdobGlnaHQiLCJpbnRlcmFjdGl2ZUhpZ2hsaWdodCIsImludGVyYWN0aXZlSGlnaGxpZ2h0TGF5ZXJhYmxlIiwiaXNJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZyIsImludGVyYWN0aXZlSGlnaGxpZ2h0Q2hhbmdlZEVtaXR0ZXIiLCJhY3RpdmF0ZVJlYWRpbmdCbG9ja0hpZ2hsaWdodCIsInJlYWRpbmdCbG9ja05vZGUiLCJsYXN0Tm9kZSIsImlzUmVhZGluZ0Jsb2NrIiwicmVhZGluZ0Jsb2NrSGlnaGxpZ2h0IiwicmVhZGluZ0Jsb2NrQWN0aXZlSGlnaGxpZ2h0IiwicmVhZGluZ0Jsb2NrQWN0aXZlSGlnaGxpZ2h0Q2hhbmdlZEVtaXR0ZXIiLCJkZWFjdGl2YXRlUmVhZGluZ0Jsb2NrSGlnaGxpZ2h0IiwicmVtb3ZlQ2hpbGQiLCJyZW1vdmVMaXN0ZW5lciIsImFjdGl2ZU5vZGUiLCJoYXNMaXN0ZW5lciIsImFjdGl2ZUludGVyYWN0aXZlSGlnaGxpZ2h0aW5nTm9kZSIsImRlYWN0aXZhdGVHcm91cEhpZ2hsaWdodHMiLCJpIiwibGVuZ3RoIiwibm9kZXMiLCJncm91cEZvY3VzSGlnaGxpZ2h0IiwidHJhaWxUb1BhcmVudCIsInVwVG9Ob2RlIiwiZ2V0SW5uZXJIaWdobGlnaHRDb2xvciIsInNldElubmVySGlnaGxpZ2h0Q29sb3IiLCJnZXRPdXRlckhpZ2hsaWdodENvbG9yIiwic2V0T3V0ZXJIaWdobGlnaHRDb2xvciIsImdldElubmVyR3JvdXBIaWdobGlnaHRDb2xvciIsImdldE91dGVyR3JvdXBIaWdobGlnaHRDb2xvciIsImFmdGVyVHJhbnNmb3JtIiwibGluZVdpZHRoU2NhbGluZ01hdHJpeCIsImdldE1hdHJpeCIsInRpbWVzTWF0cml4IiwiZ2V0Q29ycmVjdGl2ZVNjYWxpbmdNYXRyaXgiLCJ1cGRhdGVMaW5lV2lkdGgiLCJmb2N1cyIsIm5ld1RyYWlsIiwidmFsdWUiLCJ1cGRhdGVJbnRlcmFjdGl2ZUhpZ2hsaWdodCIsImFjdGl2YXRlZCIsInBkb21Gb2N1cyIsImZvY3VzZWQiLCJpbnRlcmFjdGl2ZUhpZ2hsaWdodE5vZGUiLCJsb2NrZWRQb2ludGVyRm9jdXMiLCJyZWFkaW5nQmxvY2tBY3RpdmF0ZWQiLCJ1cGRhdGUiLCJzZXRNYXRyaXgiLCJtYXRyaXgiLCJzaXplIiwiZXF1YWxzIiwic2V0V2lkdGhIZWlnaHQiLCJ3aWR0aCIsImhlaWdodCIsInVwZGF0ZURpc3BsYXkiLCJjb2xvciIsInNldE91dGVySGlsaWdodENvbG9yIiwic2V0SW5uZXJHcm91cEhpZ2hsaWdodENvbG9yIiwic2V0T3V0ZXJHcm91cEhpZ2hsaWdodENvbG9yIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJIaWdobGlnaHRPdmVybGF5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE1LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEFuIG92ZXJsYXkgdGhhdCBpbXBsZW1lbnRzIGhpZ2hsaWdodHMgZm9yIGEgRGlzcGxheS4gVGhpcyBpcyByZXNwb25zaWJsZSBmb3IgZHJhd2luZyB0aGUgaGlnaGxpZ2h0cyBhbmRcclxuICogb2JzZXJ2aW5nIFByb3BlcnRpZXMgb3IgRW1pdHRlcnMgdGhhdCBkaWN0YXRlIHdoZW4gaGlnaGxpZ2h0cyBzaG91bGQgYmVjb21lIGFjdGl2ZS4gQSBoaWdobGlnaHQgc3Vycm91bmRzIGEgTm9kZVxyXG4gKiB0byBpbmRpY2F0ZSB0aGF0IGl0IGlzIGluIGZvY3VzIG9yIHJlbGV2YW50LlxyXG4gKlxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBCb29sZWFuUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9Cb29sZWFuUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gJy4uLy4uLy4uL2tpdGUvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCB7IEFjdGl2YXRlZFJlYWRpbmdCbG9ja0hpZ2hsaWdodCwgRGlzcGxheSwgRm9jdXMsIEZvY3VzTWFuYWdlciwgSGlnaGxpZ2h0RnJvbU5vZGUsIEhpZ2hsaWdodFBhdGgsIE5vZGUsIHNjZW5lcnksIFRPdmVybGF5LCBUUGFpbnQsIFRyYWlsLCBUcmFuc2Zvcm1UcmFja2VyIH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcbmltcG9ydCB7IEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nTm9kZSB9IGZyb20gJy4uL2FjY2Vzc2liaWxpdHkvdm9pY2luZy9JbnRlcmFjdGl2ZUhpZ2hsaWdodGluZy5qcyc7XHJcbmltcG9ydCB7IFJlYWRpbmdCbG9ja05vZGUgfSBmcm9tICcuLi9hY2Nlc3NpYmlsaXR5L3ZvaWNpbmcvUmVhZGluZ0Jsb2NrLmpzJztcclxuaW1wb3J0IFRQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RQcm9wZXJ0eS5qcyc7XHJcblxyXG4vLyBjb2xvcnMgZm9yIHRoZSBmb2N1cyBoaWdobGlnaHRzLCBjYW4gYmUgY2hhbmdlZCBmb3IgZGlmZmVyZW50IGFwcGxpY2F0aW9uIGJhY2tncm91bmRzIG9yIGNvbG9yIHByb2ZpbGVzLCBzZWVcclxuLy8gdGhlIHNldHRlcnMgYW5kIGdldHRlcnMgYmVsb3cgZm9yIHRoZXNlIHZhbHVlcy5cclxubGV0IG91dGVySGlnaGxpZ2h0Q29sb3I6IFRQYWludCA9IEhpZ2hsaWdodFBhdGguT1VURVJfRk9DVVNfQ09MT1I7XHJcbmxldCBpbm5lckhpZ2hsaWdodENvbG9yOiBUUGFpbnQgPSBIaWdobGlnaHRQYXRoLklOTkVSX0ZPQ1VTX0NPTE9SO1xyXG5cclxubGV0IGlubmVyR3JvdXBIaWdobGlnaHRDb2xvcjogVFBhaW50ID0gSGlnaGxpZ2h0UGF0aC5JTk5FUl9MSUdIVF9HUk9VUF9GT0NVU19DT0xPUjtcclxubGV0IG91dGVyR3JvdXBIaWdobGlnaHRDb2xvcjogVFBhaW50ID0gSGlnaGxpZ2h0UGF0aC5PVVRFUl9MSUdIVF9HUk9VUF9GT0NVU19DT0xPUjtcclxuXHJcbi8vIFR5cGUgZm9yIHRoZSBcIm1vZGVcIiBvZiBhIHBhcnRpY3VsYXIgaGlnaGxpZ2h0LCBzaWduaWZ5aW5nIGJlaGF2aW9yIGZvciBoYW5kbGluZyB0aGUgYWN0aXZlIGhpZ2hsaWdodC5cclxudHlwZSBIaWdobGlnaHRNb2RlID0gbnVsbCB8ICdib3VuZHMnIHwgJ25vZGUnIHwgJ3NoYXBlJyB8ICdpbnZpc2libGUnO1xyXG5cclxuLy8gSGlnaGxpZ2h0cyBkaXNwbGF5ZWQgYnkgdGhlIG92ZXJsYXkgc3VwcG9ydCB0aGVzZSB0eXBlcy4gSGlnaGxpZ2h0IGJlaGF2aW9yIHdvcmtzIGxpa2UgdGhlIGZvbGxvd2luZzpcclxuLy8gLSBJZiB2YWx1ZSBpcyBudWxsLCB0aGUgaGlnaGxpZ2h0IHdpbGwgdXNlIGRlZmF1bHQgc3R5bGluZ3Mgb2YgSGlnaGxpZ2h0UGF0aCBhbmQgc3Vycm91bmQgdGhlIE5vZGUgd2l0aCBmb2N1cy5cclxuLy8gLSBJZiB2YWx1ZSBpcyBhIFNoYXBlIHRoZSBTaGFwZSBpcyBzZXQgdG8gYSBIaWdobGlnaHRQYXRoIHdpdGggZGVmYXVsdCBzdHlsaW5ncyBpbiB0aGUgZ2xvYmFsIGNvb3JkaW5hdGUgZnJhbWUuXHJcbi8vIC0gSWYgeW91IHByb3ZpZGUgYSBOb2RlIGl0IGlzIHlvdXIgcmVzcG9uc2liaWxpdHkgdG8gcG9zaXRpb24gaXQgaW4gdGhlIGdsb2JhbCBjb29yZGluYXRlIGZyYW1lLlxyXG4vLyAtIElmIHRoZSB2YWx1ZSBpcyAnaW52aXNpYmxlJyBubyBoaWdobGlnaHQgd2lsbCBiZSBkaXNwbGF5ZWQgYXQgYWxsLlxyXG5leHBvcnQgdHlwZSBIaWdobGlnaHQgPSBOb2RlIHwgU2hhcGUgfCBudWxsIHwgJ2ludmlzaWJsZSc7XHJcblxyXG5leHBvcnQgdHlwZSBIaWdobGlnaHRPdmVybGF5T3B0aW9ucyA9IHtcclxuXHJcbiAgLy8gQ29udHJvbHMgd2hldGhlciBoaWdobGlnaHRzIHJlbGF0ZWQgdG8gRE9NIGZvY3VzIGFyZSB2aXNpYmxlXHJcbiAgcGRvbUZvY3VzSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eT86IFRQcm9wZXJ0eTxib29sZWFuPjtcclxuXHJcbiAgLy8gQ29udHJvbHMgd2hldGhlciBoaWdobGlnaHRzIHJlbGF0ZWQgdG8gSW50ZXJhY3RpdmUgSGlnaGxpZ2h0cyBhcmUgdmlzaWJsZVxyXG4gIGludGVyYWN0aXZlSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eT86IFRQcm9wZXJ0eTxib29sZWFuPjtcclxuXHJcbiAgLy8gQ29udHJvbHMgd2hldGhlciBoaWdobGlnaHRzIGFzc29jaWF0ZWQgd2l0aCBSZWFkaW5nQmxvY2tzIChvZiB0aGUgVm9pY2luZyBmZWF0dXJlIHNldClcclxuICAvLyBhcmUgc2hvd24gd2hlbiBwb2ludGVyRm9jdXNQcm9wZXJ0eSBjaGFuZ2VzXHJcbiAgcmVhZGluZ0Jsb2NrSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eT86IFRQcm9wZXJ0eTxib29sZWFuPjtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhpZ2hsaWdodE92ZXJsYXkgaW1wbGVtZW50cyBUT3ZlcmxheSB7XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzcGxheTogRGlzcGxheTtcclxuXHJcbiAgLy8gVGhlIHJvb3QgTm9kZSBvZiBvdXIgY2hpbGQgZGlzcGxheVxyXG4gIHByaXZhdGUgcmVhZG9ubHkgZm9jdXNSb290Tm9kZTogTm9kZTtcclxuXHJcbiAgLy8gVHJhaWwgdG8gdGhlIG5vZGUgd2l0aCBmb2N1cywgbW9kaWZpZWQgd2hlbiBmb2N1cyBjaGFuZ2VzXHJcbiAgcHJpdmF0ZSB0cmFpbDogVHJhaWwgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgLy8gTm9kZSB3aXRoIGZvY3VzLCBtb2RpZmllZCB3aGVuIGZvY3VzIGNoYW5nZXNcclxuICBwcml2YXRlIG5vZGU6IE5vZGUgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgLy8gQSByZWZlcmVuY2VzIHRvIHRoZSBoaWdobGlnaHQgZnJvbSB0aGUgTm9kZSB0aGF0IGlzIGhpZ2hsaWdodGVkLlxyXG4gIHByaXZhdGUgYWN0aXZlSGlnaGxpZ2h0OiBIaWdobGlnaHQgPSBudWxsO1xyXG5cclxuICAvLyBTaWduaWZpZXMgbWV0aG9kIG9mIHJlcHJlc2VudGluZyBmb2N1cywgJ2JvdW5kcyd8J25vZGUnfCdzaGFwZSd8J2ludmlzaWJsZScsIG1vZGlmaWVkXHJcbiAgLy8gd2hlbiBmb2N1cyBjaGFuZ2VzXHJcbiAgcHJpdmF0ZSBtb2RlOiBIaWdobGlnaHRNb2RlID0gbnVsbDtcclxuXHJcbiAgLy8gU2lnbmlmaWVzIG1ldGhvZCBvZmYgcmVwcmVzZW50aW5nIGdyb3VwIGZvY3VzLCAnYm91bmRzJ3wnbm9kZScsIG1vZGlmaWVkIHdoZW5cclxuICAvLyBmb2N1cyBjaGFuZ2VzXHJcbiAgcHJpdmF0ZSBncm91cE1vZGU6IEhpZ2hsaWdodE1vZGUgPSBudWxsO1xyXG5cclxuICAvLyBUaGUgZ3JvdXAgaGlnaGxpZ2h0IG5vZGUgYXJvdW5kIGFuIGFuY2VzdG9yIG9mIHRoaXMubm9kZSB3aGVuIGZvY3VzIGNoYW5nZXMsIHNlZSBQYXJhbGxlbERPTS5zZXRHcm91cEZvY3VzSGlnaGxpZ2h0XHJcbiAgLy8gZm9yIG1vcmUgaW5mb3JtYXRpb24gb24gdGhlIGdyb3VwIGZvY3VzIGhpZ2hsaWdodCwgbW9kaWZpZWQgd2hlbiBmb2N1cyBjaGFuZ2VzXHJcbiAgcHJpdmF0ZSBncm91cEhpZ2hsaWdodE5vZGU6IE5vZGUgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgLy8gVHJhY2tzIHRyYW5zZm9ybWF0aW9ucyB0byB0aGUgZm9jdXNlZCBub2RlIGFuZCB0aGUgbm9kZSB3aXRoIGEgZ3JvdXAgZm9jdXMgaGlnaGxpZ2h0LCBtb2RpZmllZCB3aGVuIGZvY3VzIGNoYW5nZXNcclxuICBwcml2YXRlIHRyYW5zZm9ybVRyYWNrZXI6IFRyYW5zZm9ybVRyYWNrZXIgfCBudWxsID0gbnVsbDtcclxuICBwcml2YXRlIGdyb3VwVHJhbnNmb3JtVHJhY2tlcjogVHJhbnNmb3JtVHJhY2tlciB8IG51bGwgPSBudWxsO1xyXG5cclxuICAvLyBJZiBhIG5vZGUgaXMgdXNpbmcgYSBjdXN0b20gZm9jdXMgaGlnaGxpZ2h0LCBhIHJlZmVyZW5jZSBpcyBrZXB0IHNvIHRoYXQgaXQgY2FuIGJlIHJlbW92ZWQgZnJvbSB0aGUgb3ZlcmxheSB3aGVuXHJcbiAgLy8gbm9kZSBmb2N1cyBjaGFuZ2VzLlxyXG4gIHByaXZhdGUgbm9kZU1vZGVIaWdobGlnaHQ6IE5vZGUgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgLy8gSWYgdHJ1ZSwgdGhlIGFjdGl2ZSBoaWdobGlnaHQgaXMgaW4gXCJub2RlXCIgbW9kZSBhbmQgaXMgbGF5ZXJlZCBpbiB0aGUgc2NlbmUgZ3JhcGguIFRoaXMgZmllbGQgbGV0cyB1cyBkZWFjdGl2YXRlXHJcbiAgLy8gdGhlIGhpZ2hsaWdodCBhcHByb3ByaWF0ZWx5IHdoZW4gaXQgaXMgaW4gdGhhdCBzdGF0ZS5cclxuICBwcml2YXRlIG5vZGVNb2RlSGlnaGxpZ2h0TGF5ZXJlZCA9IGZhbHNlO1xyXG5cclxuICAvLyBJZiB0cnVlLCB0aGUgbmV4dCB1cGRhdGUoKSB3aWxsIHRyaWdnZXIgYW4gdXBkYXRlIHRvIHRoZSBoaWdobGlnaHQncyB0cmFuc2Zvcm1cclxuICBwcml2YXRlIHRyYW5zZm9ybURpcnR5ID0gdHJ1ZTtcclxuXHJcbiAgLy8gVGhlIG1haW4gbm9kZSBmb3IgdGhlIGhpZ2hsaWdodC4gSXQgd2lsbCBiZSB0cmFuc2Zvcm1lZC5cclxuICBwcml2YXRlIHJlYWRvbmx5IGhpZ2hsaWdodE5vZGUgPSBuZXcgTm9kZSgpO1xyXG5cclxuICAvLyBUaGUgbWFpbiBOb2RlIGZvciB0aGUgUmVhZGluZ0Jsb2NrIGhpZ2hsaWdodCwgd2hpbGUgUmVhZGluZ0Jsb2NrIGNvbnRlbnQgaXMgYmVpbmcgc3Bva2VuIGJ5IHNwZWVjaCBzeW50aGVzaXMuXHJcbiAgcHJpdmF0ZSByZWFkb25seSByZWFkaW5nQmxvY2tIaWdobGlnaHROb2RlID0gbmV3IE5vZGUoKTtcclxuXHJcbiAgLy8gQSByZWZlcmVuY2UgdG8gdGhlIE5vZGUgdGhhdCBpcyBhZGRlZCB3aGVuIGEgY3VzdG9tIG5vZGUgaXMgc3BlY2lmaWVkIGFzIHRoZSBhY3RpdmUgaGlnaGxpZ2h0IGZvciB0aGVcclxuICAvLyBSZWFkaW5nQmxvY2suIFN0b3JlZCBzbyB0aGF0IHdlIGNhbiByZW1vdmUgaXQgd2hlbiBkZWFjdGl2YXRpbmcgcmVhZGluZyBibG9jayBoaWdobGlnaHRzLlxyXG4gIHByaXZhdGUgYWRkZWRSZWFkaW5nQmxvY2tIaWdobGlnaHQ6IEhpZ2hsaWdodCA9IG51bGw7XHJcblxyXG4gIC8vIEEgcmVmZXJlbmNlIHRvIHRoZSBOb2RlIHRoYXQgaXMgYSBSZWFkaW5nQmxvY2sgd2hpY2ggdGhlIFZvaWNpbmcgZnJhbWV3b3JrIGlzIGN1cnJlbnRseSBzcGVha2luZyBhYm91dC5cclxuICBwcml2YXRlIGFjdGl2ZVJlYWRpbmdCbG9ja05vZGU6IG51bGwgfCBSZWFkaW5nQmxvY2tOb2RlID0gbnVsbDtcclxuXHJcbiAgLy8gVHJhaWwgdG8gdGhlIFJlYWRpbmdCbG9jayBOb2RlIHdpdGggYW4gYWN0aXZlIGhpZ2hsaWdodCBhcm91bmQgaXQgd2hpbGUgdGhlIHZvaWNpbmdNYW5hZ2VyIGlzIHNwZWFraW5nIGl0cyBjb250ZW50LlxyXG4gIHByaXZhdGUgcmVhZGluZ0Jsb2NrVHJhaWw6IG51bGwgfCBUcmFpbCA9IG51bGw7XHJcblxyXG4gIC8vIFdoZXRoZXIgdGhlIHRyYW5zZm9ybSBhcHBsaWVkIHRvIHRoZSByZWFkaW5CbG9ja0hpZ2hsaWdodE5vZGUgaXMgb3V0IG9mIGRhdGUuXHJcbiAgcHJpdmF0ZSByZWFkaW5nQmxvY2tUcmFuc2Zvcm1EaXJ0eSA9IHRydWU7XHJcblxyXG4gIC8vIFRoZSBUcmFuc2Zvcm1UcmFja2VyIHVzZWQgdG8gb2JzZXJ2ZSBjaGFuZ2VzIHRvIHRoZSB0cmFuc2Zvcm0gb2YgdGhlIE5vZGUgd2l0aCBSZWFkaW5nIEJsb2NrIGZvY3VzLCBzbyB0aGF0XHJcbiAgLy8gdGhlIGhpZ2hsaWdodCBjYW4gbWF0Y2ggdGhlIFJlYWRpbmdCbG9jay5cclxuICBwcml2YXRlIHJlYWRpbmdCbG9ja1RyYW5zZm9ybVRyYWNrZXI6IG51bGwgfCBUcmFuc2Zvcm1UcmFja2VyID0gbnVsbDtcclxuXHJcbiAgLy8gU2VlIEhpZ2hsaWdodE92ZXJsYXlPcHRpb25zIGZvciBkb2N1bWVudGF0aW9uLlxyXG4gIHByaXZhdGUgcmVhZG9ubHkgcGRvbUZvY3VzSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eTogVFByb3BlcnR5PGJvb2xlYW4+O1xyXG5cclxuICAvLyBTZWUgSGlnaGxpZ2h0T3ZlcmxheU9wdGlvbnMgZm9yIGRvY3VtZW50YXRpb24uXHJcbiAgcHJpdmF0ZSByZWFkb25seSBpbnRlcmFjdGl2ZUhpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHk6IFRQcm9wZXJ0eTxib29sZWFuPjtcclxuXHJcbiAgLy8gU2VlIEhpZ2hsaWdodE92ZXJsYXlPcHRpb25zIGZvciBkb2N1bWVudGF0aW9uLlxyXG4gIHByaXZhdGUgcmVhZG9ubHkgcmVhZGluZ0Jsb2NrSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eTogVFByb3BlcnR5PGJvb2xlYW4+O1xyXG5cclxuICAvLyBEaXNwbGF5IHRoYXQgbWFuYWdlcyBhbGwgaGlnaGxpZ2h0c1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgZm9jdXNEaXNwbGF5OiBEaXNwbGF5O1xyXG5cclxuICAvLyBIVE1MIGVsZW1lbnQgb2YgdGhlIGRpc3BsYXlcclxuICBwdWJsaWMgcmVhZG9ubHkgZG9tRWxlbWVudDogSFRNTEVsZW1lbnQ7XHJcblxyXG4gIC8vIFVzZWQgYXMgdGhlIGZvY3VzIGhpZ2hsaWdodCB3aGVuIHRoZSBvdmVybGF5IGlzIHBhc3NlZCBhIHNoYXBlXHJcbiAgcHJpdmF0ZSByZWFkb25seSBzaGFwZUZvY3VzSGlnaGxpZ2h0UGF0aDogSGlnaGxpZ2h0UGF0aDtcclxuXHJcbiAgLy8gVXNlZCBhcyB0aGUgZGVmYXVsdCBjYXNlIGZvciB0aGUgaGlnaGxpZ2h0IHdoZW4gdGhlIGhpZ2hsaWdodCB2YWx1ZSBpcyBudWxsXHJcbiAgcHJpdmF0ZSByZWFkb25seSBib3VuZHNGb2N1c0hpZ2hsaWdodFBhdGg6IEhpZ2hsaWdodEZyb21Ob2RlO1xyXG5cclxuICAvLyBGb2N1cyBoaWdobGlnaHQgZm9yICdncm91cHMnIG9mIE5vZGVzLiBXaGVuIGRlc2NlbmRhbnQgbm9kZSBoYXMgZm9jdXMsIGFuY2VzdG9yIHdpdGggZ3JvdXBGb2N1c0hpZ2hsaWdodCBmbGFnIHdpbGxcclxuICAvLyBoYXZlIHRoaXMgZXh0cmEgZm9jdXMgaGlnaGxpZ2h0IHN1cnJvdW5kIGl0cyBsb2NhbCBib3VuZHNcclxuICBwcml2YXRlIHJlYWRvbmx5IGdyb3VwRm9jdXNIaWdobGlnaHRQYXRoOiBIaWdobGlnaHRGcm9tTm9kZTtcclxuXHJcbiAgLy8gQSBwYXJlbnQgTm9kZSBmb3IgZ3JvdXAgZm9jdXMgaGlnaGxpZ2h0cyBzbyB2aXNpYmlsaXR5IG9mIGFsbCBncm91cCBoaWdobGlnaHRzIGNhbiBlYXNpbHkgYmUgY29udHJvbGxlZFxyXG4gIHByaXZhdGUgcmVhZG9ubHkgZ3JvdXBGb2N1c0hpZ2hsaWdodFBhcmVudDogTm9kZTtcclxuXHJcbiAgLy8gVGhlIGhpZ2hsaWdodCBzaG93biBhcm91bmQgUmVhZGluZ0Jsb2NrIE5vZGVzIHdoaWxlIHRoZSB2b2ljaW5nTWFuYWdlciBpcyBzcGVha2luZy5cclxuICBwcml2YXRlIHJlYWRvbmx5IHJlYWRpbmdCbG9ja0hpZ2hsaWdodFBhdGg6IEFjdGl2YXRlZFJlYWRpbmdCbG9ja0hpZ2hsaWdodDtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBib3VuZHNMaXN0ZW5lcjogKCkgPT4gdm9pZDtcclxuICBwcml2YXRlIHJlYWRvbmx5IHRyYW5zZm9ybUxpc3RlbmVyOiAoKSA9PiB2b2lkO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgZG9tRm9jdXNMaXN0ZW5lcjogKCBmb2N1czogRm9jdXMgfCBudWxsICkgPT4gdm9pZDtcclxuICBwcml2YXRlIHJlYWRvbmx5IHJlYWRpbmdCbG9ja1RyYW5zZm9ybUxpc3RlbmVyOiAoKSA9PiB2b2lkO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgZm9jdXNIaWdobGlnaHRMaXN0ZW5lcjogKCkgPT4gdm9pZDtcclxuICBwcml2YXRlIHJlYWRvbmx5IGludGVyYWN0aXZlSGlnaGxpZ2h0TGlzdGVuZXI6ICgpID0+IHZvaWQ7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBmb2N1c0hpZ2hsaWdodHNWaXNpYmxlTGlzdGVuZXI6ICgpID0+IHZvaWQ7XHJcbiAgcHJpdmF0ZSByZWFkb25seSB2b2ljaW5nSGlnaGxpZ2h0c1Zpc2libGVMaXN0ZW5lcjogKCkgPT4gdm9pZDtcclxuICBwcml2YXRlIHJlYWRvbmx5IHBvaW50ZXJGb2N1c0xpc3RlbmVyOiAoIGZvY3VzOiBGb2N1cyB8IG51bGwgKSA9PiB2b2lkO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgbG9ja2VkUG9pbnRlckZvY3VzTGlzdGVuZXI6ICggZm9jdXM6IEZvY3VzIHwgbnVsbCApID0+IHZvaWQ7XHJcbiAgcHJpdmF0ZSByZWFkb25seSByZWFkaW5nQmxvY2tGb2N1c0xpc3RlbmVyOiAoIGZvY3VzOiBGb2N1cyB8IG51bGwgKSA9PiB2b2lkO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgcmVhZGluZ0Jsb2NrSGlnaGxpZ2h0Q2hhbmdlTGlzdGVuZXI6ICgpID0+IHZvaWQ7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggZGlzcGxheTogRGlzcGxheSwgZm9jdXNSb290Tm9kZTogTm9kZSwgcHJvdmlkZWRPcHRpb25zPzogSGlnaGxpZ2h0T3ZlcmxheU9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxIaWdobGlnaHRPdmVybGF5T3B0aW9ucz4oKSgge1xyXG5cclxuICAgICAgLy8gQ29udHJvbHMgd2hldGhlciBoaWdobGlnaHRzIHJlbGF0ZWQgdG8gRE9NIGZvY3VzIGFyZSB2aXNpYmxlXHJcbiAgICAgIHBkb21Gb2N1c0hpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHk6IG5ldyBCb29sZWFuUHJvcGVydHkoIHRydWUgKSxcclxuXHJcbiAgICAgIC8vIENvbnRyb2xzIHdoZXRoZXIgaGlnaGxpZ2h0cyByZWxhdGVkIHRvIEludGVyYWN0aXZlIEhpZ2hsaWdodHMgYXJlIHZpc2libGVcclxuICAgICAgaW50ZXJhY3RpdmVIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5OiBuZXcgQm9vbGVhblByb3BlcnR5KCBmYWxzZSApLFxyXG5cclxuICAgICAgLy8gQ29udHJvbHMgd2hldGhlciBoaWdobGlnaHRzIGFzc29jaWF0ZWQgd2l0aCBSZWFkaW5nQmxvY2tzIChvZiB0aGUgVm9pY2luZyBmZWF0dXJlIHNldCkgYXJlIHNob3duIHdoZW5cclxuICAgICAgLy8gcG9pbnRlckZvY3VzUHJvcGVydHkgY2hhbmdlc1xyXG4gICAgICByZWFkaW5nQmxvY2tIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5OiBuZXcgQm9vbGVhblByb3BlcnR5KCBmYWxzZSApXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICB0aGlzLmRpc3BsYXkgPSBkaXNwbGF5O1xyXG4gICAgdGhpcy5mb2N1c1Jvb3ROb2RlID0gZm9jdXNSb290Tm9kZTtcclxuXHJcbiAgICB0aGlzLmZvY3VzUm9vdE5vZGUuYWRkQ2hpbGQoIHRoaXMuaGlnaGxpZ2h0Tm9kZSApO1xyXG4gICAgdGhpcy5mb2N1c1Jvb3ROb2RlLmFkZENoaWxkKCB0aGlzLnJlYWRpbmdCbG9ja0hpZ2hsaWdodE5vZGUgKTtcclxuXHJcbiAgICB0aGlzLnBkb21Gb2N1c0hpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHkgPSBvcHRpb25zLnBkb21Gb2N1c0hpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHk7XHJcbiAgICB0aGlzLmludGVyYWN0aXZlSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eSA9IG9wdGlvbnMuaW50ZXJhY3RpdmVIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5O1xyXG4gICAgdGhpcy5yZWFkaW5nQmxvY2tIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5ID0gb3B0aW9ucy5yZWFkaW5nQmxvY2tIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5O1xyXG5cclxuICAgIHRoaXMuZm9jdXNEaXNwbGF5ID0gbmV3IERpc3BsYXkoIHRoaXMuZm9jdXNSb290Tm9kZSwge1xyXG4gICAgICBhbGxvd1dlYkdMOiBkaXNwbGF5LmlzV2ViR0xBbGxvd2VkKCksXHJcbiAgICAgIGFsbG93Q1NTSGFja3M6IGZhbHNlLFxyXG4gICAgICBhY2Nlc3NpYmlsaXR5OiBmYWxzZSxcclxuICAgICAgaW50ZXJhY3RpdmU6IGZhbHNlLFxyXG5cclxuICAgICAgLy8gTGF5ZXIgZml0dGluZyBzb2x2ZWQgYSBjaHJvbWUgYnVnIHdoZXJlIHdlIGNvdWxkIGxvc2UgZm9jdXMgaGlnaGxpZ2h0cyB3aGVuIHRhYmJpbmcgd2hpbGUgem9vbWVkIGluIGNlcnRhaW5cclxuICAgICAgLy8gY2FzZXMsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTYwNVxyXG4gICAgICBhbGxvd0xheWVyRml0dGluZzogdHJ1ZVxyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuZG9tRWxlbWVudCA9IHRoaXMuZm9jdXNEaXNwbGF5LmRvbUVsZW1lbnQ7XHJcbiAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcclxuXHJcbiAgICB0aGlzLnNoYXBlRm9jdXNIaWdobGlnaHRQYXRoID0gbmV3IEhpZ2hsaWdodFBhdGgoIG51bGwgKTtcclxuICAgIHRoaXMuYm91bmRzRm9jdXNIaWdobGlnaHRQYXRoID0gbmV3IEhpZ2hsaWdodEZyb21Ob2RlKCBudWxsLCB7XHJcbiAgICAgIHVzZUxvY2FsQm91bmRzOiB0cnVlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5oaWdobGlnaHROb2RlLmFkZENoaWxkKCB0aGlzLnNoYXBlRm9jdXNIaWdobGlnaHRQYXRoICk7XHJcbiAgICB0aGlzLmhpZ2hsaWdodE5vZGUuYWRkQ2hpbGQoIHRoaXMuYm91bmRzRm9jdXNIaWdobGlnaHRQYXRoICk7XHJcblxyXG4gICAgdGhpcy5ncm91cEZvY3VzSGlnaGxpZ2h0UGF0aCA9IG5ldyBIaWdobGlnaHRGcm9tTm9kZSggbnVsbCwge1xyXG4gICAgICB1c2VMb2NhbEJvdW5kczogdHJ1ZSxcclxuICAgICAgdXNlR3JvdXBEaWxhdGlvbjogdHJ1ZSxcclxuICAgICAgb3V0ZXJMaW5lV2lkdGg6IEhpZ2hsaWdodFBhdGguR1JPVVBfT1VURVJfTElORV9XSURUSCxcclxuICAgICAgaW5uZXJMaW5lV2lkdGg6IEhpZ2hsaWdodFBhdGguR1JPVVBfSU5ORVJfTElORV9XSURUSCxcclxuICAgICAgaW5uZXJTdHJva2U6IEhpZ2hsaWdodFBhdGguT1VURVJfRk9DVVNfQ09MT1JcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLmdyb3VwRm9jdXNIaWdobGlnaHRQYXJlbnQgPSBuZXcgTm9kZSgge1xyXG4gICAgICBjaGlsZHJlbjogWyB0aGlzLmdyb3VwRm9jdXNIaWdobGlnaHRQYXRoIF1cclxuICAgIH0gKTtcclxuICAgIHRoaXMuZm9jdXNSb290Tm9kZS5hZGRDaGlsZCggdGhpcy5ncm91cEZvY3VzSGlnaGxpZ2h0UGFyZW50ICk7XHJcblxyXG4gICAgdGhpcy5yZWFkaW5nQmxvY2tIaWdobGlnaHRQYXRoID0gbmV3IEFjdGl2YXRlZFJlYWRpbmdCbG9ja0hpZ2hsaWdodCggbnVsbCApO1xyXG4gICAgdGhpcy5yZWFkaW5nQmxvY2tIaWdobGlnaHROb2RlLmFkZENoaWxkKCB0aGlzLnJlYWRpbmdCbG9ja0hpZ2hsaWdodFBhdGggKTtcclxuXHJcbiAgICAvLyBMaXN0ZW5lcnMgYm91bmQgb25jZSwgc28gd2UgY2FuIGFjY2VzcyB0aGVtIGZvciByZW1vdmFsLlxyXG4gICAgdGhpcy5ib3VuZHNMaXN0ZW5lciA9IHRoaXMub25Cb3VuZHNDaGFuZ2UuYmluZCggdGhpcyApO1xyXG4gICAgdGhpcy50cmFuc2Zvcm1MaXN0ZW5lciA9IHRoaXMub25UcmFuc2Zvcm1DaGFuZ2UuYmluZCggdGhpcyApO1xyXG4gICAgdGhpcy5kb21Gb2N1c0xpc3RlbmVyID0gdGhpcy5vbkZvY3VzQ2hhbmdlLmJpbmQoIHRoaXMgKTtcclxuICAgIHRoaXMucmVhZGluZ0Jsb2NrVHJhbnNmb3JtTGlzdGVuZXIgPSB0aGlzLm9uUmVhZGluZ0Jsb2NrVHJhbnNmb3JtQ2hhbmdlLmJpbmQoIHRoaXMgKTtcclxuICAgIHRoaXMuZm9jdXNIaWdobGlnaHRMaXN0ZW5lciA9IHRoaXMub25Gb2N1c0hpZ2hsaWdodENoYW5nZS5iaW5kKCB0aGlzICk7XHJcbiAgICB0aGlzLmludGVyYWN0aXZlSGlnaGxpZ2h0TGlzdGVuZXIgPSB0aGlzLm9uSW50ZXJhY3RpdmVIaWdobGlnaHRDaGFuZ2UuYmluZCggdGhpcyApO1xyXG4gICAgdGhpcy5mb2N1c0hpZ2hsaWdodHNWaXNpYmxlTGlzdGVuZXIgPSB0aGlzLm9uRm9jdXNIaWdobGlnaHRzVmlzaWJsZUNoYW5nZS5iaW5kKCB0aGlzICk7XHJcbiAgICB0aGlzLnZvaWNpbmdIaWdobGlnaHRzVmlzaWJsZUxpc3RlbmVyID0gdGhpcy5vblZvaWNpbmdIaWdobGlnaHRzVmlzaWJsZUNoYW5nZS5iaW5kKCB0aGlzICk7XHJcbiAgICB0aGlzLnBvaW50ZXJGb2N1c0xpc3RlbmVyID0gdGhpcy5vblBvaW50ZXJGb2N1c0NoYW5nZS5iaW5kKCB0aGlzICk7XHJcbiAgICB0aGlzLmxvY2tlZFBvaW50ZXJGb2N1c0xpc3RlbmVyID0gdGhpcy5vbkxvY2tlZFBvaW50ZXJGb2N1c0NoYW5nZS5iaW5kKCB0aGlzICk7XHJcbiAgICB0aGlzLnJlYWRpbmdCbG9ja0ZvY3VzTGlzdGVuZXIgPSB0aGlzLm9uUmVhZGluZ0Jsb2NrRm9jdXNDaGFuZ2UuYmluZCggdGhpcyApO1xyXG4gICAgdGhpcy5yZWFkaW5nQmxvY2tIaWdobGlnaHRDaGFuZ2VMaXN0ZW5lciA9IHRoaXMub25SZWFkaW5nQmxvY2tIaWdobGlnaHRDaGFuZ2UuYmluZCggdGhpcyApO1xyXG5cclxuICAgIEZvY3VzTWFuYWdlci5wZG9tRm9jdXNQcm9wZXJ0eS5saW5rKCB0aGlzLmRvbUZvY3VzTGlzdGVuZXIgKTtcclxuICAgIGRpc3BsYXkuZm9jdXNNYW5hZ2VyLnBvaW50ZXJGb2N1c1Byb3BlcnR5LmxpbmsoIHRoaXMucG9pbnRlckZvY3VzTGlzdGVuZXIgKTtcclxuICAgIGRpc3BsYXkuZm9jdXNNYW5hZ2VyLnJlYWRpbmdCbG9ja0ZvY3VzUHJvcGVydHkubGluayggdGhpcy5yZWFkaW5nQmxvY2tGb2N1c0xpc3RlbmVyICk7XHJcblxyXG4gICAgZGlzcGxheS5mb2N1c01hbmFnZXIubG9ja2VkUG9pbnRlckZvY3VzUHJvcGVydHkubGluayggdGhpcy5sb2NrZWRQb2ludGVyRm9jdXNMaXN0ZW5lciApO1xyXG5cclxuICAgIHRoaXMucGRvbUZvY3VzSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eS5saW5rKCB0aGlzLmZvY3VzSGlnaGxpZ2h0c1Zpc2libGVMaXN0ZW5lciApO1xyXG4gICAgdGhpcy5pbnRlcmFjdGl2ZUhpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHkubGluayggdGhpcy52b2ljaW5nSGlnaGxpZ2h0c1Zpc2libGVMaXN0ZW5lciApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVsZWFzZXMgcmVmZXJlbmNlc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgaWYgKCB0aGlzLmhhc0hpZ2hsaWdodCgpICkge1xyXG4gICAgICB0aGlzLmRlYWN0aXZhdGVIaWdobGlnaHQoKTtcclxuICAgIH1cclxuXHJcbiAgICBGb2N1c01hbmFnZXIucGRvbUZvY3VzUHJvcGVydHkudW5saW5rKCB0aGlzLmRvbUZvY3VzTGlzdGVuZXIgKTtcclxuICAgIHRoaXMucGRvbUZvY3VzSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eS51bmxpbmsoIHRoaXMuZm9jdXNIaWdobGlnaHRzVmlzaWJsZUxpc3RlbmVyICk7XHJcbiAgICB0aGlzLmludGVyYWN0aXZlSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eS51bmxpbmsoIHRoaXMudm9pY2luZ0hpZ2hsaWdodHNWaXNpYmxlTGlzdGVuZXIgKTtcclxuXHJcbiAgICB0aGlzLmRpc3BsYXkuZm9jdXNNYW5hZ2VyLnBvaW50ZXJGb2N1c1Byb3BlcnR5LnVubGluayggdGhpcy5wb2ludGVyRm9jdXNMaXN0ZW5lciApO1xyXG4gICAgdGhpcy5kaXNwbGF5LmZvY3VzTWFuYWdlci5yZWFkaW5nQmxvY2tGb2N1c1Byb3BlcnR5LnVubGluayggdGhpcy5yZWFkaW5nQmxvY2tGb2N1c0xpc3RlbmVyICk7XHJcblxyXG4gICAgdGhpcy5mb2N1c0Rpc3BsYXkuZGlzcG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGlzIEhpZ2hsaWdodE92ZXJsYXkgaXMgZGlzcGxheWluZyBzb21lIGhpZ2hsaWdodC5cclxuICAgKi9cclxuICBwdWJsaWMgaGFzSGlnaGxpZ2h0KCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuICEhdGhpcy50cmFpbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGVyZSBpcyBhbiBhY3RpdmUgaGlnaGxpZ2h0IGFyb3VuZCBhIFJlYWRpbmdCbG9jayB3aGlsZSB0aGUgdm9pY2luZ01hbmFnZXIgaXMgc3BlYWtpbmcgaXRzXHJcbiAgICogVm9pY2luZyBjb250ZW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBoYXNSZWFkaW5nQmxvY2tIaWdobGlnaHQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gISF0aGlzLnJlYWRpbmdCbG9ja1RyYWlsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWN0aXZhdGVzIHRoZSBoaWdobGlnaHQsIGNob29zaW5nIGEgbW9kZSBmb3Igd2hldGhlciB0aGUgaGlnaGxpZ2h0IHdpbGwgYmUgYSBzaGFwZSwgbm9kZSwgb3IgYm91bmRzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHRyYWlsIC0gVGhlIGZvY3VzZWQgdHJhaWwgdG8gaGlnaGxpZ2h0LiBJdCBhc3N1bWVzIHRoYXQgdGhpcyB0cmFpbCBpcyBpbiB0aGlzIGRpc3BsYXkuXHJcbiAgICogQHBhcmFtIG5vZGUgLSBOb2RlIHJlY2VpdmluZyB0aGUgaGlnaGxpZ2h0XHJcbiAgICogQHBhcmFtIG5vZGVIaWdobGlnaHQgLSB0aGUgaGlnaGxpZ2h0IHRvIHVzZVxyXG4gICAqIEBwYXJhbSBsYXllcmFibGUgLSBJcyB0aGUgaGlnaGxpZ2h0IGxheWVyYWJsZSBpbiB0aGUgc2NlbmUgZ3JhcGg/XHJcbiAgICogQHBhcmFtIHZpc2libGVQcm9wZXJ0eSAtIFByb3BlcnR5IGNvbnRyb2xsaW5nIHRoZSB2aXNpYmlsaXR5IGZvciB0aGUgcHJvdmlkZWQgaGlnaGxpZ2h0XHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhY3RpdmF0ZUhpZ2hsaWdodCggdHJhaWw6IFRyYWlsLCBub2RlOiBOb2RlLCBub2RlSGlnaGxpZ2h0OiBIaWdobGlnaHQsIGxheWVyYWJsZTogYm9vbGVhbiwgdmlzaWJsZVByb3BlcnR5OiBUUHJvcGVydHk8Ym9vbGVhbj4gKTogdm9pZCB7XHJcbiAgICB0aGlzLnRyYWlsID0gdHJhaWw7XHJcbiAgICB0aGlzLm5vZGUgPSBub2RlO1xyXG5cclxuICAgIGNvbnN0IGhpZ2hsaWdodCA9IG5vZGVIaWdobGlnaHQ7XHJcbiAgICB0aGlzLmFjdGl2ZUhpZ2hsaWdodCA9IGhpZ2hsaWdodDtcclxuXHJcbiAgICAvLyB3ZSBtYXkgb3IgbWF5IG5vdCB0cmFjayB0aGlzIHRyYWlsIGRlcGVuZGluZyBvbiB3aGV0aGVyIHRoZSBmb2N1cyBoaWdobGlnaHQgc3Vycm91bmRzIHRoZSB0cmFpbCdzIGxlYWYgbm9kZSBvclxyXG4gICAgLy8gYSBkaWZmZXJlbnQgbm9kZVxyXG4gICAgbGV0IHRyYWlsVG9UcmFjayA9IHRyYWlsO1xyXG5cclxuICAgIC8vIEludmlzaWJsZSBtb2RlIC0gbm8gZm9jdXMgaGlnaGxpZ2h0OyB0aGlzIGlzIG9ubHkgZm9yIHRlc3RpbmcgbW9kZSwgd2hlbiBOb2RlcyByYXJlbHkgaGF2ZSBib3VuZHMuXHJcbiAgICBpZiAoIGhpZ2hsaWdodCA9PT0gJ2ludmlzaWJsZScgKSB7XHJcbiAgICAgIHRoaXMubW9kZSA9ICdpbnZpc2libGUnO1xyXG4gICAgfVxyXG4gICAgLy8gU2hhcGUgbW9kZVxyXG4gICAgZWxzZSBpZiAoIGhpZ2hsaWdodCBpbnN0YW5jZW9mIFNoYXBlICkge1xyXG4gICAgICB0aGlzLm1vZGUgPSAnc2hhcGUnO1xyXG5cclxuICAgICAgdGhpcy5zaGFwZUZvY3VzSGlnaGxpZ2h0UGF0aC52aXNpYmxlID0gdHJ1ZTtcclxuICAgICAgdGhpcy5zaGFwZUZvY3VzSGlnaGxpZ2h0UGF0aC5zZXRTaGFwZSggaGlnaGxpZ2h0ICk7XHJcbiAgICB9XHJcbiAgICAvLyBOb2RlIG1vZGVcclxuICAgIGVsc2UgaWYgKCBoaWdobGlnaHQgaW5zdGFuY2VvZiBOb2RlICkge1xyXG4gICAgICB0aGlzLm1vZGUgPSAnbm9kZSc7XHJcblxyXG4gICAgICAvLyBpZiB1c2luZyBhIGZvY3VzIGhpZ2hsaWdodCBmcm9tIGFub3RoZXIgbm9kZSwgd2Ugd2lsbCB0cmFjayB0aGF0IG5vZGUncyB0cmFuc2Zvcm0gaW5zdGVhZCBvZiB0aGUgZm9jdXNlZCBub2RlXHJcbiAgICAgIGlmICggaGlnaGxpZ2h0IGluc3RhbmNlb2YgSGlnaGxpZ2h0UGF0aCApIHtcclxuICAgICAgICBjb25zdCBoaWdobGlnaHRQYXRoID0gaGlnaGxpZ2h0O1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGhpZ2hsaWdodC5zaGFwZSAhPT0gbnVsbCwgJ1RoZSBzaGFwZSBvZiB0aGUgTm9kZSBoaWdobGlnaHQgc2hvdWxkIGJlIHNldCBieSBub3cuIERvZXMgaXQgaGF2ZSBib3VuZHM/JyApO1xyXG5cclxuICAgICAgICBpZiAoIGhpZ2hsaWdodFBhdGgudHJhbnNmb3JtU291cmNlTm9kZSApIHtcclxuICAgICAgICAgIHRyYWlsVG9UcmFjayA9IGhpZ2hsaWdodC5nZXRVbmlxdWVIaWdobGlnaHRUcmFpbCggdGhpcy50cmFpbCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gc3RvcmUgdGhlIGZvY3VzIGhpZ2hsaWdodCBzbyB0aGF0IGl0IGNhbiBiZSByZW1vdmVkIGxhdGVyXHJcbiAgICAgIHRoaXMubm9kZU1vZGVIaWdobGlnaHQgPSBoaWdobGlnaHQ7XHJcblxyXG4gICAgICBpZiAoIGxheWVyYWJsZSApIHtcclxuXHJcbiAgICAgICAgLy8gZmxhZyBzbyB0aGF0IHdlIGtub3cgaG93IHRvIGRlYWN0aXZhdGUgaW4gdGhpcyBjYXNlXHJcbiAgICAgICAgdGhpcy5ub2RlTW9kZUhpZ2hsaWdodExheWVyZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICAvLyB0aGUgZm9jdXNIaWdobGlnaHQgaXMganVzdCBhIG5vZGUgaW4gdGhlIHNjZW5lIGdyYXBoLCBzbyBzZXQgaXQgdmlzaWJsZSAtIHZpc2liaWxpdHkgb2Ygb3RoZXIgaGlnaGxpZ2h0c1xyXG4gICAgICAgIC8vIGNvbnRyb2xsZWQgYnkgdmlzaWJpbGl0eSBvZiBwYXJlbnQgTm9kZXMgYnV0IHRoYXQgY2Fubm90IGJlIGRvbmUgaW4gdGhpcyBjYXNlIGJlY2F1c2UgdGhlIGhpZ2hsaWdodFxyXG4gICAgICAgIC8vIGNhbiBiZSBhbnl3aGVyZSBpbiB0aGUgc2NlbmUgZ3JhcGgsIHNvIGhhdmUgdG8gY2hlY2sgcGRvbUZvY3VzSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eVxyXG4gICAgICAgIHRoaXMubm9kZU1vZGVIaWdobGlnaHQudmlzaWJsZSA9IHZpc2libGVQcm9wZXJ0eS5nZXQoKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuXHJcbiAgICAgICAgLy8gdGhlIG5vZGUgaXMgYWxyZWFkeSBpbiB0aGUgc2NlbmUgZ3JhcGgsIHNvIHRoaXMgd2lsbCBzZXQgdmlzaWJpbGl0eVxyXG4gICAgICAgIC8vIGZvciBhbGwgaW5zdGFuY2VzLlxyXG4gICAgICAgIHRoaXMubm9kZU1vZGVIaWdobGlnaHQudmlzaWJsZSA9IHRydWU7XHJcblxyXG4gICAgICAgIC8vIFVzZSB0aGUgbm9kZSBpdHNlbGYgYXMgdGhlIGhpZ2hsaWdodFxyXG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0Tm9kZS5hZGRDaGlsZCggdGhpcy5ub2RlTW9kZUhpZ2hsaWdodCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBCb3VuZHMgbW9kZVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRoaXMubW9kZSA9ICdib3VuZHMnO1xyXG5cclxuICAgICAgdGhpcy5ib3VuZHNGb2N1c0hpZ2hsaWdodFBhdGguc2V0U2hhcGVGcm9tTm9kZSggdGhpcy5ub2RlLCB0aGlzLnRyYWlsICk7XHJcblxyXG4gICAgICB0aGlzLmJvdW5kc0ZvY3VzSGlnaGxpZ2h0UGF0aC52aXNpYmxlID0gdHJ1ZTtcclxuICAgICAgdGhpcy5ub2RlLmxvY2FsQm91bmRzUHJvcGVydHkubGF6eUxpbmsoIHRoaXMuYm91bmRzTGlzdGVuZXIgKTtcclxuXHJcbiAgICAgIHRoaXMub25Cb3VuZHNDaGFuZ2UoKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyYW5zZm9ybVRyYWNrZXIgPSBuZXcgVHJhbnNmb3JtVHJhY2tlciggdHJhaWxUb1RyYWNrLCB7XHJcbiAgICAgIGlzU3RhdGljOiB0cnVlXHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLnRyYW5zZm9ybVRyYWNrZXIuYWRkTGlzdGVuZXIoIHRoaXMudHJhbnNmb3JtTGlzdGVuZXIgKTtcclxuXHJcbiAgICAvLyBoYW5kbGUgZ3JvdXAgZm9jdXMgaGlnaGxpZ2h0c1xyXG4gICAgdGhpcy5hY3RpdmF0ZUdyb3VwSGlnaGxpZ2h0cygpO1xyXG5cclxuICAgIC8vIHVwZGF0ZSBoaWdobGlnaHQgY29sb3JzIGlmIG5lY2Vzc2FyeVxyXG4gICAgdGhpcy51cGRhdGVIaWdobGlnaHRDb2xvcnMoKTtcclxuXHJcbiAgICB0aGlzLnRyYW5zZm9ybURpcnR5ID0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFjdGl2YXRlIGEgZm9jdXMgaGlnaGxpZ2h0LCBhY3RpdmF0aW5nIHRoZSBoaWdobGlnaHQgYW5kIGFkZGluZyBhIGxpc3RlbmVyIHRoYXQgd2lsbCB1cGRhdGUgdGhlIGhpZ2hsaWdodCB3aGVuZXZlclxyXG4gICAqIHRoZSBOb2RlJ3MgZm9jdXNIaWdobGlnaHQgY2hhbmdlc1xyXG4gICAqL1xyXG4gIHByaXZhdGUgYWN0aXZhdGVGb2N1c0hpZ2hsaWdodCggdHJhaWw6IFRyYWlsLCBub2RlOiBOb2RlICk6IHZvaWQge1xyXG4gICAgdGhpcy5hY3RpdmF0ZUhpZ2hsaWdodCggdHJhaWwsIG5vZGUsIG5vZGUuZm9jdXNIaWdobGlnaHQsIG5vZGUuZm9jdXNIaWdobGlnaHRMYXllcmFibGUsIHRoaXMucGRvbUZvY3VzSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eSApO1xyXG5cclxuICAgIC8vIGhhbmRsZSBhbnkgY2hhbmdlcyB0byB0aGUgZm9jdXMgaGlnaGxpZ2h0IHdoaWxlIHRoZSBub2RlIGhhcyBmb2N1c1xyXG4gICAgbm9kZS5mb2N1c0hpZ2hsaWdodENoYW5nZWRFbWl0dGVyLmFkZExpc3RlbmVyKCB0aGlzLmZvY3VzSGlnaGxpZ2h0TGlzdGVuZXIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFjdGl2YXRlIGFuIGludGVyYWN0aXZlIGhpZ2hsaWdodCwgYWN0aXZhdGluZyB0aGUgaGlnaGxpZ2h0IGFuZCBhZGRpbmcgYSBsaXN0ZW5lciB0aGF0IHdpbGwgdXBkYXRlIHRoZSBoaWdobGlnaHRcclxuICAgKiBjaGFuZ2VzIHdoaWxlIGl0IGlzIGFjdGl2ZS5cclxuICAgKi9cclxuICBwcml2YXRlIGFjdGl2YXRlSW50ZXJhY3RpdmVIaWdobGlnaHQoIHRyYWlsOiBUcmFpbCwgbm9kZTogSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdOb2RlICk6IHZvaWQge1xyXG5cclxuICAgIHRoaXMuYWN0aXZhdGVIaWdobGlnaHQoXHJcbiAgICAgIHRyYWlsLFxyXG4gICAgICBub2RlLFxyXG4gICAgICBub2RlLmludGVyYWN0aXZlSGlnaGxpZ2h0IHx8IG5vZGUuZm9jdXNIaWdobGlnaHQsXHJcbiAgICAgIG5vZGUuaW50ZXJhY3RpdmVIaWdobGlnaHRMYXllcmFibGUsXHJcbiAgICAgIHRoaXMuaW50ZXJhY3RpdmVIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5XHJcbiAgICApO1xyXG5cclxuICAgIC8vIHNhbml0eSBjaGVjayB0aGF0IG91ciBOb2RlIGFjdHVhbGx5IHVzZXMgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG5vZGUuaXNJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZywgJ05vZGUgZG9lcyBub3Qgc3VwcG9ydCBhbnkga2luZCBvZiBpbnRlcmFjdGl2ZSBoaWdobGlnaHRpbmcuJyApO1xyXG4gICAgbm9kZS5pbnRlcmFjdGl2ZUhpZ2hsaWdodENoYW5nZWRFbWl0dGVyLmFkZExpc3RlbmVyKCB0aGlzLmludGVyYWN0aXZlSGlnaGxpZ2h0TGlzdGVuZXIgKTtcclxuXHJcbiAgICAvLyBoYW5kbGUgY2hhbmdlcyB0byB0aGUgaGlnaGxpZ2h0IHdoaWxlIGl0IGlzIGFjdGl2ZSAtIFNpbmNlIHRoZSBoaWdobGlnaHQgY2FuIGZhbGwgYmFjayB0byB0aGUgZm9jdXMgaGlnaGxpZ2h0XHJcbiAgICAvLyB3YXRjaCBmb3IgdXBkYXRlcyB0byByZWRyYXcgd2hlbiB0aGF0IGhpZ2hsaWdodCBjaGFuZ2VzIGFzIHdlbGwuXHJcbiAgICBub2RlLmZvY3VzSGlnaGxpZ2h0Q2hhbmdlZEVtaXR0ZXIuYWRkTGlzdGVuZXIoIHRoaXMuaW50ZXJhY3RpdmVIaWdobGlnaHRMaXN0ZW5lciApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWN0aXZhdGUgdGhlIFJlYWRpbmcgQmxvY2sgaGlnaGxpZ2h0LiBUaGlzIGhpZ2hsaWdodCBpcyBzZXBhcmF0ZSBmcm9tIG90aGVycyBpbiB0aGUgb3ZlcmxheSBhbmQgd2lsbCBhbHdheXNcclxuICAgKiBzdXJyb3VuZCB0aGUgQm91bmRzIG9mIHRoZSBmb2N1c2VkIE5vZGUuIEl0IGlzIHNob3duIGluIHJlc3BvbnNlIHRvIGNlcnRhaW4gaW5wdXQgb24gTm9kZXMgd2l0aCBWb2ljaW5nIHdoaWxlXHJcbiAgICogdGhlIHZvaWNpbmdNYW5hZ2VyIGlzIHNwZWFraW5nLlxyXG4gICAqXHJcbiAgICogTm90ZSB0aGF0IGN1c3RvbWl6YXRpb25zIGZvciB0aGlzIGhpZ2hsaWdodCBhcmUgbm90IHN1cHBvcnRlZCBhdCB0aGlzIHRpbWUsIHRoYXQgY291bGQgYmUgYWRkZWQgaW4gdGhlIGZ1dHVyZSBpZlxyXG4gICAqIHdlIG5lZWQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhY3RpdmF0ZVJlYWRpbmdCbG9ja0hpZ2hsaWdodCggdHJhaWw6IFRyYWlsICk6IHZvaWQge1xyXG4gICAgdGhpcy5yZWFkaW5nQmxvY2tUcmFpbCA9IHRyYWlsO1xyXG5cclxuICAgIGNvbnN0IHJlYWRpbmdCbG9ja05vZGUgPSB0cmFpbC5sYXN0Tm9kZSgpIGFzIFJlYWRpbmdCbG9ja05vZGU7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCByZWFkaW5nQmxvY2tOb2RlLmlzUmVhZGluZ0Jsb2NrLFxyXG4gICAgICAnc2hvdWxkIG5vdCBhY3RpdmF0ZSBhIHJlYWRpbmcgYmxvY2sgaGlnaGxpZ2h0IGZvciBhIE5vZGUgdGhhdCBpcyBub3QgYSBSZWFkaW5nQmxvY2snICk7XHJcbiAgICB0aGlzLmFjdGl2ZVJlYWRpbmdCbG9ja05vZGUgPSByZWFkaW5nQmxvY2tOb2RlO1xyXG5cclxuICAgIGNvbnN0IHJlYWRpbmdCbG9ja0hpZ2hsaWdodCA9IHRoaXMuYWN0aXZlUmVhZGluZ0Jsb2NrTm9kZS5yZWFkaW5nQmxvY2tBY3RpdmVIaWdobGlnaHQ7XHJcblxyXG4gICAgdGhpcy5hZGRlZFJlYWRpbmdCbG9ja0hpZ2hsaWdodCA9IHJlYWRpbmdCbG9ja0hpZ2hsaWdodDtcclxuXHJcbiAgICBpZiAoIHJlYWRpbmdCbG9ja0hpZ2hsaWdodCA9PT0gJ2ludmlzaWJsZScgKSB7XHJcbiAgICAgIC8vIG5vdGhpbmcgdG8gZHJhd1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHJlYWRpbmdCbG9ja0hpZ2hsaWdodCBpbnN0YW5jZW9mIFNoYXBlICkge1xyXG4gICAgICB0aGlzLnJlYWRpbmdCbG9ja0hpZ2hsaWdodFBhdGguc2V0U2hhcGUoIHJlYWRpbmdCbG9ja0hpZ2hsaWdodCApO1xyXG4gICAgICB0aGlzLnJlYWRpbmdCbG9ja0hpZ2hsaWdodFBhdGgudmlzaWJsZSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggcmVhZGluZ0Jsb2NrSGlnaGxpZ2h0IGluc3RhbmNlb2YgTm9kZSApIHtcclxuXHJcbiAgICAgIC8vIG5vZGUgbW9kZVxyXG4gICAgICB0aGlzLnJlYWRpbmdCbG9ja0hpZ2hsaWdodE5vZGUuYWRkQ2hpbGQoIHJlYWRpbmdCbG9ja0hpZ2hsaWdodCApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcblxyXG4gICAgICAvLyBib3VuZHMgbW9kZVxyXG4gICAgICB0aGlzLnJlYWRpbmdCbG9ja0hpZ2hsaWdodFBhdGguc2V0U2hhcGVGcm9tTm9kZSggdGhpcy5hY3RpdmVSZWFkaW5nQmxvY2tOb2RlLCB0aGlzLnJlYWRpbmdCbG9ja1RyYWlsICk7XHJcbiAgICAgIHRoaXMucmVhZGluZ0Jsb2NrSGlnaGxpZ2h0UGF0aC52aXNpYmxlID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyB1cGRhdGUgdGhlIGhpZ2hsaWdodCBpZiB0aGUgdHJhbnNmb3JtIGZvciB0aGUgTm9kZSBldmVyIGNoYW5nZXNcclxuICAgIHRoaXMucmVhZGluZ0Jsb2NrVHJhbnNmb3JtVHJhY2tlciA9IG5ldyBUcmFuc2Zvcm1UcmFja2VyKCB0aGlzLnJlYWRpbmdCbG9ja1RyYWlsLCB7XHJcbiAgICAgIGlzU3RhdGljOiB0cnVlXHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLnJlYWRpbmdCbG9ja1RyYW5zZm9ybVRyYWNrZXIuYWRkTGlzdGVuZXIoIHRoaXMucmVhZGluZ0Jsb2NrVHJhbnNmb3JtTGlzdGVuZXIgKTtcclxuXHJcbiAgICAvLyB1cGRhdGUgdGhlIGhpZ2hsaWdodCBpZiBpdCBpcyBjaGFuZ2VkIG9uIHRoZSBOb2RlIHdoaWxlIGFjdGl2ZVxyXG4gICAgdGhpcy5hY3RpdmVSZWFkaW5nQmxvY2tOb2RlLnJlYWRpbmdCbG9ja0FjdGl2ZUhpZ2hsaWdodENoYW5nZWRFbWl0dGVyLmFkZExpc3RlbmVyKCB0aGlzLnJlYWRpbmdCbG9ja0hpZ2hsaWdodENoYW5nZUxpc3RlbmVyICk7XHJcblxyXG4gICAgdGhpcy5yZWFkaW5nQmxvY2tUcmFuc2Zvcm1EaXJ0eSA9IHRydWU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZWFjdGl2YXRlIHRoZSBzcGVha2luZyBoaWdobGlnaHQgYnkgbWFraW5nIGl0IGludmlzaWJsZS5cclxuICAgKi9cclxuICBwcml2YXRlIGRlYWN0aXZhdGVSZWFkaW5nQmxvY2tIaWdobGlnaHQoKTogdm9pZCB7XHJcbiAgICB0aGlzLnJlYWRpbmdCbG9ja0hpZ2hsaWdodFBhdGgudmlzaWJsZSA9IGZhbHNlO1xyXG5cclxuICAgIGlmICggdGhpcy5hZGRlZFJlYWRpbmdCbG9ja0hpZ2hsaWdodCBpbnN0YW5jZW9mIE5vZGUgKSB7XHJcbiAgICAgIHRoaXMucmVhZGluZ0Jsb2NrSGlnaGxpZ2h0Tm9kZS5yZW1vdmVDaGlsZCggdGhpcy5hZGRlZFJlYWRpbmdCbG9ja0hpZ2hsaWdodCApO1xyXG4gICAgfVxyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMucmVhZGluZ0Jsb2NrVHJhbnNmb3JtVHJhY2tlciwgJ0hvdyBjYW4gd2UgZGVhY3RpdmF0ZSB0aGUgVHJhbnNmb3JtVHJhY2tlciBpZiBpdCB3YXNudCBhc3NpZ25lZC4nICk7XHJcbiAgICBjb25zdCB0cmFuc2Zvcm1UcmFja2VyID0gdGhpcy5yZWFkaW5nQmxvY2tUcmFuc2Zvcm1UcmFja2VyITtcclxuICAgIHRyYW5zZm9ybVRyYWNrZXIucmVtb3ZlTGlzdGVuZXIoIHRoaXMucmVhZGluZ0Jsb2NrVHJhbnNmb3JtTGlzdGVuZXIgKTtcclxuICAgIHRyYW5zZm9ybVRyYWNrZXIuZGlzcG9zZSgpO1xyXG4gICAgdGhpcy5yZWFkaW5nQmxvY2tUcmFuc2Zvcm1UcmFja2VyID0gbnVsbDtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmFjdGl2ZVJlYWRpbmdCbG9ja05vZGUsICdIb3cgY2FuIHdlIGRlYWN0aXZhdGUgdGhlIGFjdGl2ZVJlYWRpbmdCbG9ja05vZGUgaWYgaXQgd2FzbnQgYXNzaWduZWQuJyApO1xyXG4gICAgdGhpcy5hY3RpdmVSZWFkaW5nQmxvY2tOb2RlIS5yZWFkaW5nQmxvY2tBY3RpdmVIaWdobGlnaHRDaGFuZ2VkRW1pdHRlci5yZW1vdmVMaXN0ZW5lciggdGhpcy5yZWFkaW5nQmxvY2tIaWdobGlnaHRDaGFuZ2VMaXN0ZW5lciApO1xyXG5cclxuICAgIHRoaXMuYWN0aXZlUmVhZGluZ0Jsb2NrTm9kZSA9IG51bGw7XHJcbiAgICB0aGlzLnJlYWRpbmdCbG9ja1RyYWlsID0gbnVsbDtcclxuICAgIHRoaXMuYWRkZWRSZWFkaW5nQmxvY2tIaWdobGlnaHQgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVhY3RpdmF0ZXMgdGhlIGFsbCBhY3RpdmUgaGlnaGxpZ2h0cywgZGlzcG9zaW5nIGFuZCByZW1vdmluZyBsaXN0ZW5lcnMgYXMgbmVjZXNzYXJ5LlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZGVhY3RpdmF0ZUhpZ2hsaWdodCgpOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMubm9kZSwgJ05lZWQgYW4gYWN0aXZlIE5vZGUgdG8gZGVhY3RpdmF0ZSBoaWdobGlnaHRzJyApO1xyXG4gICAgY29uc3QgYWN0aXZlTm9kZSA9IHRoaXMubm9kZSE7XHJcblxyXG4gICAgaWYgKCB0aGlzLm1vZGUgPT09ICdzaGFwZScgKSB7XHJcbiAgICAgIHRoaXMuc2hhcGVGb2N1c0hpZ2hsaWdodFBhdGgudmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHRoaXMubW9kZSA9PT0gJ25vZGUnICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLm5vZGVNb2RlSGlnaGxpZ2h0LCAnSG93IGNhbiB3ZSBkZWFjdGl2YXRlIGlmIG5vZGVNb2RlSGlnaGxpZ2h0IGlzIG5vdCBhc3NpZ25lZCcgKTtcclxuICAgICAgY29uc3Qgbm9kZU1vZGVIaWdobGlnaHQgPSB0aGlzLm5vZGVNb2RlSGlnaGxpZ2h0ITtcclxuXHJcbiAgICAgIC8vIElmIGxheWVyZWQsIGNsaWVudCBoYXMgcHV0IHRoZSBOb2RlIHdoZXJlIHRoZXkgd2FudCBpbiB0aGUgc2NlbmUgZ3JhcGggYW5kIHdlIGNhbm5vdCByZW1vdmUgaXRcclxuICAgICAgaWYgKCB0aGlzLm5vZGVNb2RlSGlnaGxpZ2h0TGF5ZXJlZCApIHtcclxuICAgICAgICB0aGlzLm5vZGVNb2RlSGlnaGxpZ2h0TGF5ZXJlZCA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0Tm9kZS5yZW1vdmVDaGlsZCggbm9kZU1vZGVIaWdobGlnaHQgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gbm9kZSBmb2N1cyBoaWdobGlnaHQgY2FuIGJlIGNsZWFyZWQgbm93IHRoYXQgaXQgaGFzIGJlZW4gcmVtb3ZlZFxyXG4gICAgICBub2RlTW9kZUhpZ2hsaWdodC52aXNpYmxlID0gZmFsc2U7XHJcbiAgICAgIHRoaXMubm9kZU1vZGVIaWdobGlnaHQgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHRoaXMubW9kZSA9PT0gJ2JvdW5kcycgKSB7XHJcbiAgICAgIHRoaXMuYm91bmRzRm9jdXNIaWdobGlnaHRQYXRoLnZpc2libGUgPSBmYWxzZTtcclxuICAgICAgYWN0aXZlTm9kZS5sb2NhbEJvdW5kc1Byb3BlcnR5LnVubGluayggdGhpcy5ib3VuZHNMaXN0ZW5lciApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHJlbW92ZSBsaXN0ZW5lcnMgdGhhdCByZWRyYXcgdGhlIGhpZ2hsaWdodCBpZiBhIHR5cGUgb2YgaGlnaGxpZ2h0IGNoYW5nZXMgb24gdGhlIE5vZGVcclxuICAgIGlmICggYWN0aXZlTm9kZS5mb2N1c0hpZ2hsaWdodENoYW5nZWRFbWl0dGVyLmhhc0xpc3RlbmVyKCB0aGlzLmZvY3VzSGlnaGxpZ2h0TGlzdGVuZXIgKSApIHtcclxuICAgICAgYWN0aXZlTm9kZS5mb2N1c0hpZ2hsaWdodENoYW5nZWRFbWl0dGVyLnJlbW92ZUxpc3RlbmVyKCB0aGlzLmZvY3VzSGlnaGxpZ2h0TGlzdGVuZXIgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBhY3RpdmVJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZ05vZGUgPSBhY3RpdmVOb2RlIGFzIEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nTm9kZTtcclxuICAgIGlmICggYWN0aXZlSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdOb2RlLmlzSW50ZXJhY3RpdmVIaWdobGlnaHRpbmcgKSB7XHJcbiAgICAgIGlmICggYWN0aXZlSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdOb2RlLmludGVyYWN0aXZlSGlnaGxpZ2h0Q2hhbmdlZEVtaXR0ZXIuaGFzTGlzdGVuZXIoIHRoaXMuaW50ZXJhY3RpdmVIaWdobGlnaHRMaXN0ZW5lciApICkge1xyXG4gICAgICAgIGFjdGl2ZUludGVyYWN0aXZlSGlnaGxpZ2h0aW5nTm9kZS5pbnRlcmFjdGl2ZUhpZ2hsaWdodENoYW5nZWRFbWl0dGVyLnJlbW92ZUxpc3RlbmVyKCB0aGlzLmludGVyYWN0aXZlSGlnaGxpZ2h0TGlzdGVuZXIgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIGFjdGl2ZUludGVyYWN0aXZlSGlnaGxpZ2h0aW5nTm9kZS5mb2N1c0hpZ2hsaWdodENoYW5nZWRFbWl0dGVyLmhhc0xpc3RlbmVyKCB0aGlzLmludGVyYWN0aXZlSGlnaGxpZ2h0TGlzdGVuZXIgKSApIHtcclxuICAgICAgICBhY3RpdmVJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZ05vZGUuZm9jdXNIaWdobGlnaHRDaGFuZ2VkRW1pdHRlci5yZW1vdmVMaXN0ZW5lciggdGhpcy5pbnRlcmFjdGl2ZUhpZ2hsaWdodExpc3RlbmVyICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyByZW1vdmUgYWxsICdncm91cCcgZm9jdXMgaGlnaGxpZ2h0c1xyXG4gICAgdGhpcy5kZWFjdGl2YXRlR3JvdXBIaWdobGlnaHRzKCk7XHJcblxyXG4gICAgdGhpcy50cmFpbCA9IG51bGw7XHJcbiAgICB0aGlzLm5vZGUgPSBudWxsO1xyXG4gICAgdGhpcy5tb2RlID0gbnVsbDtcclxuICAgIHRoaXMuYWN0aXZlSGlnaGxpZ2h0ID0gbnVsbDtcclxuICAgIHRoaXMudHJhbnNmb3JtVHJhY2tlciEucmVtb3ZlTGlzdGVuZXIoIHRoaXMudHJhbnNmb3JtTGlzdGVuZXIgKTtcclxuICAgIHRoaXMudHJhbnNmb3JtVHJhY2tlciEuZGlzcG9zZSgpO1xyXG4gICAgdGhpcy50cmFuc2Zvcm1UcmFja2VyID0gbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFjdGl2YXRlIGFsbCAnZ3JvdXAnIGZvY3VzIGhpZ2hsaWdodHMgYnkgc2VhcmNoaW5nIGZvciBhbmNlc3RvciBub2RlcyBmcm9tIHRoZSBub2RlIHRoYXQgaGFzIGZvY3VzXHJcbiAgICogYW5kIGFkZGluZyBhIHJlY3RhbmdsZSBhcm91bmQgaXQgaWYgaXQgaGFzIGEgXCJncm91cEZvY3VzSGlnaGxpZ2h0XCIuIEEgZ3JvdXAgaGlnaGxpZ2h0IHdpbGwgb25seSBhcHBlYXIgYXJvdW5kXHJcbiAgICogdGhlIGNsb3Nlc3QgYW5jZXN0b3IgdGhhdCBoYXMgYSBvbmUuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhY3RpdmF0ZUdyb3VwSGlnaGxpZ2h0cygpOiB2b2lkIHtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLnRyYWlsLCAnbXVzdCBoYXZlIGFuIGFjdGl2ZSB0cmFpbCB0byBhY3RpdmF0ZSBncm91cCBoaWdobGlnaHRzJyApO1xyXG4gICAgY29uc3QgdHJhaWwgPSB0aGlzLnRyYWlsITtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRyYWlsLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBub2RlID0gdHJhaWwubm9kZXNbIGkgXTtcclxuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gbm9kZS5ncm91cEZvY3VzSGlnaGxpZ2h0O1xyXG4gICAgICBpZiAoIGhpZ2hsaWdodCApIHtcclxuXHJcbiAgICAgICAgLy8gdXBkYXRlIHRyYW5zZm9ybSB0cmFja2VyXHJcbiAgICAgICAgY29uc3QgdHJhaWxUb1BhcmVudCA9IHRyYWlsLnVwVG9Ob2RlKCBub2RlICk7XHJcbiAgICAgICAgdGhpcy5ncm91cFRyYW5zZm9ybVRyYWNrZXIgPSBuZXcgVHJhbnNmb3JtVHJhY2tlciggdHJhaWxUb1BhcmVudCApO1xyXG4gICAgICAgIHRoaXMuZ3JvdXBUcmFuc2Zvcm1UcmFja2VyLmFkZExpc3RlbmVyKCB0aGlzLnRyYW5zZm9ybUxpc3RlbmVyICk7XHJcblxyXG4gICAgICAgIGlmICggdHlwZW9mIGhpZ2hsaWdodCA9PT0gJ2Jvb2xlYW4nICkge1xyXG5cclxuICAgICAgICAgIC8vIGFkZCBhIGJvdW5kaW5nIHJlY3RhbmdsZSBhcm91bmQgdGhlIG5vZGUgdGhhdCB1c2VzIGdyb3VwIGhpZ2hsaWdodHNcclxuICAgICAgICAgIHRoaXMuZ3JvdXBGb2N1c0hpZ2hsaWdodFBhdGguc2V0U2hhcGVGcm9tTm9kZSggbm9kZSwgdHJhaWxUb1BhcmVudCApO1xyXG5cclxuICAgICAgICAgIHRoaXMuZ3JvdXBGb2N1c0hpZ2hsaWdodFBhdGgudmlzaWJsZSA9IHRydWU7XHJcblxyXG4gICAgICAgICAgdGhpcy5ncm91cEhpZ2hsaWdodE5vZGUgPSB0aGlzLmdyb3VwRm9jdXNIaWdobGlnaHRQYXRoO1xyXG4gICAgICAgICAgdGhpcy5ncm91cE1vZGUgPSAnYm91bmRzJztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIGhpZ2hsaWdodCBpbnN0YW5jZW9mIE5vZGUgKSB7XHJcbiAgICAgICAgICB0aGlzLmdyb3VwSGlnaGxpZ2h0Tm9kZSA9IGhpZ2hsaWdodDtcclxuICAgICAgICAgIHRoaXMuZ3JvdXBGb2N1c0hpZ2hsaWdodFBhcmVudC5hZGRDaGlsZCggaGlnaGxpZ2h0ICk7XHJcblxyXG4gICAgICAgICAgdGhpcy5ncm91cE1vZGUgPSAnbm9kZSc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBPbmx5IGNsb3Nlc3QgYW5jZXN0b3Igd2l0aCBncm91cCBoaWdobGlnaHQgd2lsbCBnZXQgdGhlIGdyb3VwIGhpZ2hsaWdodFxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVcGRhdGUgZm9jdXMgaGlnaGxpZ2h0IGNvbG9ycy4gVGhpcyBpcyBhIG5vLW9wIGlmIHdlIGFyZSBpbiAnbm9kZScgbW9kZSwgb3IgaWYgbm9uZSBvZiB0aGUgaGlnaGxpZ2h0IGNvbG9yc1xyXG4gICAqIGhhdmUgY2hhbmdlZC5cclxuICAgKlxyXG4gICAqIFRPRE86IFN1cHBvcnQgdXBkYXRpbmcgZm9jdXMgaGlnaGxpZ2h0IHN0cm9rZXMgaW4gJ25vZGUnIG1vZGUgYXMgd2VsbD8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgKi9cclxuICBwcml2YXRlIHVwZGF0ZUhpZ2hsaWdodENvbG9ycygpOiB2b2lkIHtcclxuXHJcbiAgICBpZiAoIHRoaXMubW9kZSA9PT0gJ3NoYXBlJyApIHtcclxuICAgICAgaWYgKCB0aGlzLnNoYXBlRm9jdXNIaWdobGlnaHRQYXRoLmlubmVySGlnaGxpZ2h0Q29sb3IgIT09IEhpZ2hsaWdodE92ZXJsYXkuZ2V0SW5uZXJIaWdobGlnaHRDb2xvcigpICkge1xyXG4gICAgICAgIHRoaXMuc2hhcGVGb2N1c0hpZ2hsaWdodFBhdGguc2V0SW5uZXJIaWdobGlnaHRDb2xvciggSGlnaGxpZ2h0T3ZlcmxheS5nZXRJbm5lckhpZ2hsaWdodENvbG9yKCkgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIHRoaXMuc2hhcGVGb2N1c0hpZ2hsaWdodFBhdGgub3V0ZXJIaWdobGlnaHRDb2xvciAhPT0gSGlnaGxpZ2h0T3ZlcmxheS5nZXRPdXRlckhpZ2hsaWdodENvbG9yKCkgKSB7XHJcbiAgICAgICAgdGhpcy5zaGFwZUZvY3VzSGlnaGxpZ2h0UGF0aC5zZXRPdXRlckhpZ2hsaWdodENvbG9yKCBIaWdobGlnaHRPdmVybGF5LmdldE91dGVySGlnaGxpZ2h0Q29sb3IoKSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggdGhpcy5tb2RlID09PSAnYm91bmRzJyApIHtcclxuICAgICAgaWYgKCB0aGlzLmJvdW5kc0ZvY3VzSGlnaGxpZ2h0UGF0aC5pbm5lckhpZ2hsaWdodENvbG9yICE9PSBIaWdobGlnaHRPdmVybGF5LmdldElubmVySGlnaGxpZ2h0Q29sb3IoKSApIHtcclxuICAgICAgICB0aGlzLmJvdW5kc0ZvY3VzSGlnaGxpZ2h0UGF0aC5zZXRJbm5lckhpZ2hsaWdodENvbG9yKCBIaWdobGlnaHRPdmVybGF5LmdldElubmVySGlnaGxpZ2h0Q29sb3IoKSApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggdGhpcy5ib3VuZHNGb2N1c0hpZ2hsaWdodFBhdGgub3V0ZXJIaWdobGlnaHRDb2xvciAhPT0gSGlnaGxpZ2h0T3ZlcmxheS5nZXRPdXRlckhpZ2hsaWdodENvbG9yKCkgKSB7XHJcbiAgICAgICAgdGhpcy5ib3VuZHNGb2N1c0hpZ2hsaWdodFBhdGguc2V0T3V0ZXJIaWdobGlnaHRDb2xvciggSGlnaGxpZ2h0T3ZlcmxheS5nZXRPdXRlckhpZ2hsaWdodENvbG9yKCkgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGlmIGEgZ3JvdXAgZm9jdXMgaGlnaGxpZ2h0IGlzIGFjdGl2ZSwgdXBkYXRlIHN0cm9rZXNcclxuICAgIGlmICggdGhpcy5ncm91cE1vZGUgKSB7XHJcbiAgICAgIGlmICggdGhpcy5ncm91cEZvY3VzSGlnaGxpZ2h0UGF0aC5pbm5lckhpZ2hsaWdodENvbG9yICE9PSBIaWdobGlnaHRPdmVybGF5LmdldElubmVyR3JvdXBIaWdobGlnaHRDb2xvcigpICkge1xyXG4gICAgICAgIHRoaXMuZ3JvdXBGb2N1c0hpZ2hsaWdodFBhdGguc2V0SW5uZXJIaWdobGlnaHRDb2xvciggSGlnaGxpZ2h0T3ZlcmxheS5nZXRJbm5lckdyb3VwSGlnaGxpZ2h0Q29sb3IoKSApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggdGhpcy5ncm91cEZvY3VzSGlnaGxpZ2h0UGF0aC5vdXRlckhpZ2hsaWdodENvbG9yICE9PSBIaWdobGlnaHRPdmVybGF5LmdldE91dGVyR3JvdXBIaWdobGlnaHRDb2xvcigpICkge1xyXG4gICAgICAgIHRoaXMuZ3JvdXBGb2N1c0hpZ2hsaWdodFBhdGguc2V0T3V0ZXJIaWdobGlnaHRDb2xvciggSGlnaGxpZ2h0T3ZlcmxheS5nZXRPdXRlckdyb3VwSGlnaGxpZ2h0Q29sb3IoKSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmUgYWxsIGdyb3VwIGZvY3VzIGhpZ2hsaWdodHMgYnkgbWFraW5nIHRoZW0gaW52aXNpYmxlLCBvciByZW1vdmluZyB0aGVtIGZyb20gdGhlIHJvb3Qgb2YgdGhpcyBvdmVybGF5LFxyXG4gICAqIGRlcGVuZGluZyBvbiBtb2RlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZGVhY3RpdmF0ZUdyb3VwSGlnaGxpZ2h0cygpOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy5ncm91cE1vZGUgKSB7XHJcbiAgICAgIGlmICggdGhpcy5ncm91cE1vZGUgPT09ICdib3VuZHMnICkge1xyXG4gICAgICAgIHRoaXMuZ3JvdXBGb2N1c0hpZ2hsaWdodFBhdGgudmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCB0aGlzLmdyb3VwTW9kZSA9PT0gJ25vZGUnICkge1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuZ3JvdXBIaWdobGlnaHROb2RlLCAnTmVlZCBhIGdyb3VwSGlnaGxpZ2h0Tm9kZSB0byBkZWFjdGl2YXRlIHRoaXMgbW9kZScgKTtcclxuICAgICAgICB0aGlzLmdyb3VwRm9jdXNIaWdobGlnaHRQYXJlbnQucmVtb3ZlQ2hpbGQoIHRoaXMuZ3JvdXBIaWdobGlnaHROb2RlISApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmdyb3VwTW9kZSA9IG51bGw7XHJcbiAgICAgIHRoaXMuZ3JvdXBIaWdobGlnaHROb2RlID0gbnVsbDtcclxuXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuZ3JvdXBUcmFuc2Zvcm1UcmFja2VyLCAnTmVlZCBhIGdyb3VwVHJhbnNmb3JtVHJhY2tlciB0byBkaXNwb3NlJyApO1xyXG4gICAgICB0aGlzLmdyb3VwVHJhbnNmb3JtVHJhY2tlciEucmVtb3ZlTGlzdGVuZXIoIHRoaXMudHJhbnNmb3JtTGlzdGVuZXIgKTtcclxuICAgICAgdGhpcy5ncm91cFRyYW5zZm9ybVRyYWNrZXIhLmRpc3Bvc2UoKTtcclxuICAgICAgdGhpcy5ncm91cFRyYW5zZm9ybVRyYWNrZXIgPSBudWxsO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIGZyb20gSGlnaGxpZ2h0T3ZlcmxheSBhZnRlciB0cmFuc2Zvcm1pbmcgdGhlIGhpZ2hsaWdodC4gT25seSBjYWxsZWQgd2hlbiB0aGUgdHJhbnNmb3JtIGNoYW5nZXMuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhZnRlclRyYW5zZm9ybSgpOiB2b2lkIHtcclxuXHJcbiAgICAvLyBUaGlzIG1hdHJpeCBtYWtlcyBzdXJlIHRoYXQgdGhlIGxpbmUgd2lkdGggb2YgdGhlIGhpZ2hsaWdodCByZW1haW5zIGFwcHJvcHJpYXRlbHkgc2l6ZWQsIGV2ZW4gd2hlbiB0aGUgTm9kZVxyXG4gICAgLy8gKGFuZCB0aGVyZWZvcmUgaXRzIGhpZ2hsaWdodCkgbWF5IGJlIHNjYWxlZC4gSG93ZXZlciwgd2UgRE8gd2FudCB0byBzY2FsZSB1cCB0aGUgaGlnaGxpZ2h0IGxpbmUgd2lkdGggd2hlblxyXG4gICAgLy8gdGhlIHNjZW5lIGlzIHpvb21lZCBpbiBmcm9tIHRoZSBnbG9iYWwgcGFuL3pvb20gbGlzdGVuZXIsIHNvIHdlIGluY2x1ZGUgdGhhdCBpbnZlcnRlZCBtYXRyaXguXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLnRyYW5zZm9ybVRyYWNrZXIsICdNdXN0IGhhdmUgYW4gYWN0aXZlIHRyYW5zZm9ybVRyYWNrZXIgdG8gYWRqdXN0IGZyb20gdHJhbnNmb3JtYXRpb24uJyApO1xyXG4gICAgY29uc3QgbGluZVdpZHRoU2NhbGluZ01hdHJpeCA9IHRoaXMudHJhbnNmb3JtVHJhY2tlciEuZ2V0TWF0cml4KCkudGltZXNNYXRyaXgoIEhpZ2hsaWdodFBhdGguZ2V0Q29ycmVjdGl2ZVNjYWxpbmdNYXRyaXgoKSApO1xyXG5cclxuICAgIGlmICggdGhpcy5tb2RlID09PSAnc2hhcGUnICkge1xyXG4gICAgICB0aGlzLnNoYXBlRm9jdXNIaWdobGlnaHRQYXRoLnVwZGF0ZUxpbmVXaWR0aCggbGluZVdpZHRoU2NhbGluZ01hdHJpeCApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHRoaXMubW9kZSA9PT0gJ2JvdW5kcycgKSB7XHJcbiAgICAgIHRoaXMuYm91bmRzRm9jdXNIaWdobGlnaHRQYXRoLnVwZGF0ZUxpbmVXaWR0aCggbGluZVdpZHRoU2NhbGluZ01hdHJpeCApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHRoaXMubW9kZSA9PT0gJ25vZGUnICYmIHRoaXMuYWN0aXZlSGlnaGxpZ2h0IGluc3RhbmNlb2YgSGlnaGxpZ2h0UGF0aCAmJiB0aGlzLmFjdGl2ZUhpZ2hsaWdodC51cGRhdGVMaW5lV2lkdGggKSB7XHJcbiAgICAgIHRoaXMuYWN0aXZlSGlnaGxpZ2h0LnVwZGF0ZUxpbmVXaWR0aCggbGluZVdpZHRoU2NhbGluZ01hdHJpeCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIHRoZSBncm91cCBoaWdobGlnaHQgaXMgYWN0aXZlLCB3ZSBuZWVkIHRvIGNvcnJlY3QgdGhlIGxpbmUgd2lkdGhzIGZvciB0aGF0IGhpZ2hsaWdodC5cclxuICAgIGlmICggdGhpcy5ncm91cEhpZ2hsaWdodE5vZGUgKSB7XHJcbiAgICAgIGlmICggdGhpcy5ncm91cE1vZGUgPT09ICdib3VuZHMnICkge1xyXG4gICAgICAgIHRoaXMuZ3JvdXBGb2N1c0hpZ2hsaWdodFBhdGgudXBkYXRlTGluZVdpZHRoKCBsaW5lV2lkdGhTY2FsaW5nTWF0cml4ICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIHRoaXMuZ3JvdXBNb2RlID09PSAnbm9kZScgJiYgdGhpcy5ncm91cEhpZ2hsaWdodE5vZGUgaW5zdGFuY2VvZiBIaWdobGlnaHRQYXRoICYmIHRoaXMuZ3JvdXBIaWdobGlnaHROb2RlLnVwZGF0ZUxpbmVXaWR0aCApIHtcclxuICAgICAgICB0aGlzLmdyb3VwSGlnaGxpZ2h0Tm9kZS51cGRhdGVMaW5lV2lkdGgoIGxpbmVXaWR0aFNjYWxpbmdNYXRyaXggKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIHRoZSBSZWFkaW5nQmxvY2sgaGlnaGxpZ2h0IGlzIGFjdGl2ZSwgd2UgbmVlZCB0byBjb3JyZWN0IHRoZSBsaW5lIHdpZHRocyBmb3IgdGhhdCBoaWdobGlnaHQuXHJcbiAgICBpZiAoIHRoaXMucmVhZGluZ0Jsb2NrVHJhaWwgKSB7XHJcbiAgICAgIHRoaXMucmVhZGluZ0Jsb2NrSGlnaGxpZ2h0UGF0aC51cGRhdGVMaW5lV2lkdGgoIGxpbmVXaWR0aFNjYWxpbmdNYXRyaXggKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEV2ZXJ5IHRpbWUgdGhlIHRyYW5zZm9ybSBjaGFuZ2VzIG9uIHRoZSB0YXJnZXQgTm9kZSBzaWduaWZ5IHRoYXQgdXBkYXRlcyBhcmUgbmVjZXNzYXJ5LCBzZWUgdGhlIHVzYWdlIG9mIHRoZVxyXG4gICAqIFRyYW5zZm9ybVRyYWNrZXJzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgb25UcmFuc2Zvcm1DaGFuZ2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLnRyYW5zZm9ybURpcnR5ID0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1hcmsgdGhhdCB0aGUgdHJhbnNmb3JtIGZvciB0aGUgUmVhZGluZ0Jsb2NrIGhpZ2hsaWdodCBpcyBvdXQgb2YgZGF0ZSBhbmQgbmVlZHMgdG8gYmUgcmVjYWxjdWxhdGVkIG5leHQgdXBkYXRlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgb25SZWFkaW5nQmxvY2tUcmFuc2Zvcm1DaGFuZ2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLnJlYWRpbmdCbG9ja1RyYW5zZm9ybURpcnR5ID0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCB3aGVuIGJvdW5kcyBjaGFuZ2Ugb24gb3VyIG5vZGUgd2hlbiB3ZSBhcmUgaW4gXCJCb3VuZHNcIiBtb2RlXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBvbkJvdW5kc0NoYW5nZSgpOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMubm9kZSwgJ011c3QgaGF2ZSBhbiBhY3RpdmUgbm9kZSB3aGVuIGJvdW5kcyBhcmUgY2hhbmdpbmcnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLnRyYWlsLCAnTXVzdCBoYXZlIGFuIGFjdGl2ZSB0cmFpbCB3aGVuIHVwZGF0aW5nIGRlZmF1bHQgYm91bmRzIGhpZ2hsaWdodCcgKTtcclxuICAgIHRoaXMuYm91bmRzRm9jdXNIaWdobGlnaHRQYXRoLnNldFNoYXBlRnJvbU5vZGUoIHRoaXMubm9kZSEsIHRoaXMudHJhaWwhICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgd2hlbiB0aGUgbWFpbiBTY2VuZXJ5IGZvY3VzIHBhaXIgKERpc3BsYXksVHJhaWwpIGNoYW5nZXMuIFRoZSBUcmFpbCBwb2ludHMgdG8gdGhlIE5vZGUgdGhhdCBoYXNcclxuICAgKiBmb2N1cyBhbmQgYSBoaWdobGlnaHQgd2lsbCBhcHBlYXIgYXJvdW5kIHRoaXMgTm9kZSBpZiBmb2N1cyBoaWdobGlnaHRzIGFyZSB2aXNpYmxlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgb25Gb2N1c0NoYW5nZSggZm9jdXM6IEZvY3VzIHwgbnVsbCApOiB2b2lkIHtcclxuICAgIGNvbnN0IG5ld1RyYWlsID0gKCBmb2N1cyAmJiBmb2N1cy5kaXNwbGF5ID09PSB0aGlzLmRpc3BsYXkgKSA/IGZvY3VzLnRyYWlsIDogbnVsbDtcclxuXHJcbiAgICBpZiAoIHRoaXMuaGFzSGlnaGxpZ2h0KCkgKSB7XHJcbiAgICAgIHRoaXMuZGVhY3RpdmF0ZUhpZ2hsaWdodCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggbmV3VHJhaWwgJiYgdGhpcy5wZG9tRm9jdXNIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5LnZhbHVlICkge1xyXG4gICAgICBjb25zdCBub2RlID0gbmV3VHJhaWwubGFzdE5vZGUoKTtcclxuXHJcbiAgICAgIHRoaXMuYWN0aXZhdGVGb2N1c0hpZ2hsaWdodCggbmV3VHJhaWwsIG5vZGUgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0aGlzLmRpc3BsYXkuZm9jdXNNYW5hZ2VyLnBvaW50ZXJGb2N1c1Byb3BlcnR5LnZhbHVlICYmIHRoaXMuaW50ZXJhY3RpdmVIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5LnZhbHVlICkge1xyXG4gICAgICB0aGlzLnVwZGF0ZUludGVyYWN0aXZlSGlnaGxpZ2h0KCB0aGlzLmRpc3BsYXkuZm9jdXNNYW5hZ2VyLnBvaW50ZXJGb2N1c1Byb3BlcnR5LnZhbHVlICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgd2hlbiB0aGUgcG9pbnRlckZvY3VzUHJvcGVydHkgY2hhbmdlcy4gcG9pbnRlckZvY3VzUHJvcGVydHkgd2lsbCBoYXZlIHRoZSBUcmFpbCB0byB0aGVcclxuICAgKiBOb2RlIHRoYXQgY29tcG9zZXMgVm9pY2luZyBhbmQgaXMgdW5kZXIgdGhlIFBvaW50ZXIuIEEgaGlnaGxpZ2h0IHdpbGwgYXBwZWFyIGFyb3VuZCB0aGlzIE5vZGUgaWZcclxuICAgKiB2b2ljaW5nIGhpZ2hsaWdodHMgYXJlIHZpc2libGUuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBvblBvaW50ZXJGb2N1c0NoYW5nZSggZm9jdXM6IEZvY3VzIHwgbnVsbCApOiB2b2lkIHtcclxuXHJcbiAgICAvLyB1cGRhdGVJbnRlcmFjdGl2ZUhpZ2hsaWdodCB3aWxsIG9ubHkgYWN0aXZhdGUgdGhlIGhpZ2hsaWdodCBpZiBwZG9tRm9jdXNIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5IGlzIGZhbHNlLFxyXG4gICAgLy8gYnV0IGNoZWNrIGhlcmUgYXMgd2VsbCBzbyB0aGF0IHdlIGRvbid0IGRvIHdvcmsgdG8gZGVhY3RpdmF0ZSBoaWdobGlnaHRzIG9ubHkgdG8gaW1tZWRpYXRlbHkgcmVhY3RpdmF0ZSB0aGVtXHJcbiAgICBpZiAoICF0aGlzLmRpc3BsYXkuZm9jdXNNYW5hZ2VyLmxvY2tlZFBvaW50ZXJGb2N1c1Byb3BlcnR5LnZhbHVlICYmXHJcbiAgICAgICAgICF0aGlzLmRpc3BsYXkuZm9jdXNNYW5hZ2VyLnBkb21Gb2N1c0hpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgIHRoaXMudXBkYXRlSW50ZXJhY3RpdmVIaWdobGlnaHQoIGZvY3VzICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWRyYXdzIHRoZSBoaWdobGlnaHQuIFRoZXJlIGFyZSBjYXNlcyB3aGVyZSB3ZSB3YW50IHRvIGRvIHRoaXMgcmVnYXJkbGVzcyBvZiB3aGV0aGVyIHRoZSBwb2ludGVyIGZvY3VzXHJcbiAgICogaXMgbG9ja2VkLCBzdWNoIGFzIHdoZW4gdGhlIGhpZ2hsaWdodCBjaGFuZ2VzIGNoYW5nZXMgZm9yIGEgTm9kZSB0aGF0IGlzIGFjdGl2YXRlZCBmb3IgaGlnaGxpZ2h0aW5nLlxyXG4gICAqXHJcbiAgICogQXMgb2YgOC8xMS8yMSB3ZSBhbHNvIGRlY2lkZWQgdGhhdCBJbnRlcmFjdGl2ZSBIaWdobGlnaHRzIHNob3VsZCBhbHNvIG5ldmVyIGJlIHNob3duIHdoaWxlXHJcbiAgICogUERPTSBoaWdobGlnaHRzIGFyZSB2aXNpYmxlLCB0byBhdm9pZCBjb25mdXNpbmcgY2FzZXMgd2hlcmUgdGhlIEludGVyYWN0aXZlIEhpZ2hsaWdodFxyXG4gICAqIGNhbiBhcHBlYXIgd2hpbGUgdGhlIERPTSBmb2N1cyBoaWdobGlnaHQgaXMgYWN0aXZlIGFuZCBjb252ZXlpbmcgaW5mb3JtYXRpb24uIEluIHRoZSBmdXR1cmVcclxuICAgKiB3ZSBtaWdodCBtYWtlIGl0IHNvIHRoYXQgYm90aCBjYW4gYmUgdmlzaWJsZSBhdCB0aGUgc2FtZSB0aW1lLCBidXQgdGhhdCB3aWxsIHJlcXVpcmVcclxuICAgKiBjaGFuZ2luZyB0aGUgbG9vayBvZiBvbmUgb2YgdGhlIGhpZ2hsaWdodHMgc28gaXQgaXMgY2xlYXIgdGhleSBhcmUgZGlzdGluY3QuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSB1cGRhdGVJbnRlcmFjdGl2ZUhpZ2hsaWdodCggZm9jdXM6IEZvY3VzIHwgbnVsbCApOiB2b2lkIHtcclxuICAgIGNvbnN0IG5ld1RyYWlsID0gKCBmb2N1cyAmJiBmb2N1cy5kaXNwbGF5ID09PSB0aGlzLmRpc3BsYXkgKSA/IGZvY3VzLnRyYWlsIDogbnVsbDtcclxuXHJcbiAgICAvLyBhbHdheXMgY2xlYXIgdGhlIGhpZ2hsaWdodCBpZiBpdCBpcyBiZWluZyByZW1vdmVkXHJcbiAgICBpZiAoIHRoaXMuaGFzSGlnaGxpZ2h0KCkgKSB7XHJcbiAgICAgIHRoaXMuZGVhY3RpdmF0ZUhpZ2hsaWdodCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIG9ubHkgYWN0aXZhdGUgYSBuZXcgaGlnaGxpZ2h0IGlmIFBET00gZm9jdXMgaGlnaGxpZ2h0cyBhcmUgbm90IGRpc3BsYXllZCwgc2VlIEpTRG9jXHJcbiAgICBsZXQgYWN0aXZhdGVkID0gZmFsc2U7XHJcbiAgICBpZiAoIG5ld1RyYWlsICYmICF0aGlzLmRpc3BsYXkuZm9jdXNNYW5hZ2VyLnBkb21Gb2N1c0hpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgIGNvbnN0IG5vZGUgPSBuZXdUcmFpbC5sYXN0Tm9kZSgpIGFzIFJlYWRpbmdCbG9ja05vZGU7XHJcblxyXG4gICAgICBpZiAoICggbm9kZS5pc1JlYWRpbmdCbG9jayAmJiB0aGlzLnJlYWRpbmdCbG9ja0hpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHkudmFsdWUgKSB8fCAoICFub2RlLmlzUmVhZGluZ0Jsb2NrICYmIHRoaXMuaW50ZXJhY3RpdmVIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5LnZhbHVlICkgKSB7XHJcbiAgICAgICAgdGhpcy5hY3RpdmF0ZUludGVyYWN0aXZlSGlnaGxpZ2h0KCBuZXdUcmFpbCwgbm9kZSApO1xyXG4gICAgICAgIGFjdGl2YXRlZCA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoICFhY3RpdmF0ZWQgJiYgRm9jdXNNYW5hZ2VyLnBkb21Gb2N1cyAmJiB0aGlzLnBkb21Gb2N1c0hpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgIHRoaXMub25Gb2N1c0NoYW5nZSggRm9jdXNNYW5hZ2VyLnBkb21Gb2N1cyApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIHdoZW5ldmVyIHRoZSBsb2NrZWRQb2ludGVyRm9jdXNQcm9wZXJ0eSBjaGFuZ2VzLiBJZiB0aGUgbG9ja2VkUG9pbnRlckZvY3VzUHJvcGVydHkgY2hhbmdlcyB3ZSBwcm9iYWJseVxyXG4gICAqIGhhdmUgdG8gdXBkYXRlIHRoZSBoaWdobGlnaHQgYmVjYXVzZSBpbnRlcmFjdGlvbiB3aXRoIGEgTm9kZSB0aGF0IHVzZXMgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmcganVzdCBlbmRlZC5cclxuICAgKi9cclxuICBwcml2YXRlIG9uTG9ja2VkUG9pbnRlckZvY3VzQ2hhbmdlKCBmb2N1czogRm9jdXMgfCBudWxsICk6IHZvaWQge1xyXG4gICAgdGhpcy51cGRhdGVJbnRlcmFjdGl2ZUhpZ2hsaWdodCggZm9jdXMgfHwgdGhpcy5kaXNwbGF5LmZvY3VzTWFuYWdlci5wb2ludGVyRm9jdXNQcm9wZXJ0eS52YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzcG9uc2libGUgZm9yIGRlYWN0aXZhdGluZyB0aGUgUmVhZGluZyBCbG9jayBoaWdobGlnaHQgd2hlbiB0aGUgZGlzcGxheS5mb2N1c01hbmFnZXIucmVhZGluZ0Jsb2NrRm9jdXNQcm9wZXJ0eSBjaGFuZ2VzLlxyXG4gICAqIFRoZSBSZWFkaW5nIEJsb2NrIHdhaXRzIHRvIGFjdGl2YXRlIHVudGlsIHRoZSB2b2ljaW5nTWFuYWdlciBzdGFydHMgc3BlYWtpbmcgYmVjYXVzZSB0aGVyZSBpcyBvZnRlbiBhIHN0b3Agc3BlYWtpbmdcclxuICAgKiBldmVudCB0aGF0IGNvbWVzIHJpZ2h0IGFmdGVyIHRoZSBzcGVha2VyIHN0YXJ0cyB0byBpbnRlcnJ1cHQgdGhlIHByZXZpb3VzIHV0dGVyYW5jZS5cclxuICAgKi9cclxuICBwcml2YXRlIG9uUmVhZGluZ0Jsb2NrRm9jdXNDaGFuZ2UoIGZvY3VzOiBGb2N1cyB8IG51bGwgKTogdm9pZCB7XHJcbiAgICBpZiAoIHRoaXMuaGFzUmVhZGluZ0Jsb2NrSGlnaGxpZ2h0KCkgKSB7XHJcbiAgICAgIHRoaXMuZGVhY3RpdmF0ZVJlYWRpbmdCbG9ja0hpZ2hsaWdodCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG5ld1RyYWlsID0gKCBmb2N1cyAmJiBmb2N1cy5kaXNwbGF5ID09PSB0aGlzLmRpc3BsYXkgKSA/IGZvY3VzLnRyYWlsIDogbnVsbDtcclxuICAgIGlmICggbmV3VHJhaWwgKSB7XHJcbiAgICAgIHRoaXMuYWN0aXZhdGVSZWFkaW5nQmxvY2tIaWdobGlnaHQoIG5ld1RyYWlsICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJZiB0aGUgZm9jdXNlZCBub2RlIGhhcyBhbiB1cGRhdGVkIGZvY3VzIGhpZ2hsaWdodCwgd2UgbXVzdCBkbyBhbGwgdGhlIHdvcmsgb2YgaGlnaGxpZ2h0IGRlYWN0aXZhdGlvbi9hY3RpdmF0aW9uXHJcbiAgICogYXMgaWYgdGhlIGFwcGxpY2F0aW9uIGZvY3VzIGNoYW5nZWQuIElmIGZvY3VzIGhpZ2hsaWdodCBtb2RlIGNoYW5nZWQsIHdlIG5lZWQgdG8gYWRkL3JlbW92ZSBzdGF0aWMgbGlzdGVuZXJzLFxyXG4gICAqIGFkZC9yZW1vdmUgaGlnaGxpZ2h0IGNoaWxkcmVuLCBhbmQgc28gb24uIENhbGxlZCB3aGVuIGZvY3VzIGhpZ2hsaWdodCBjaGFuZ2VzLCBidXQgc2hvdWxkIG9ubHkgZXZlciBiZVxyXG4gICAqIG5lY2Vzc2FyeSB3aGVuIHRoZSBub2RlIGhhcyBmb2N1cy5cclxuICAgKi9cclxuICBwcml2YXRlIG9uRm9jdXNIaWdobGlnaHRDaGFuZ2UoKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLm5vZGUgJiYgdGhpcy5ub2RlLmZvY3VzZWQsICd1cGRhdGUgc2hvdWxkIG9ubHkgYmUgbmVjZXNzYXJ5IGlmIG5vZGUgYWxyZWFkeSBoYXMgZm9jdXMnICk7XHJcbiAgICB0aGlzLm9uRm9jdXNDaGFuZ2UoIEZvY3VzTWFuYWdlci5wZG9tRm9jdXMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIElmIHRoZSBOb2RlIGhhcyBwb2ludGVyIGZvY3VzIGFuZCB0aGUgaW50ZXJhY2l2ZSBoaWdobGlnaHQgY2hhbmdlcywgd2UgbXVzdCBkbyBhbGwgb2YgdGhlIHdvcmsgdG8gcmVhcHBseSB0aGVcclxuICAgKiBoaWdobGlnaHQgYXMgaWYgdGhlIHZhbHVlIG9mIHRoZSBmb2N1c1Byb3BlcnR5IGNoYW5nZWQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBvbkludGVyYWN0aXZlSGlnaGxpZ2h0Q2hhbmdlKCk6IHZvaWQge1xyXG5cclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICBjb25zdCBpbnRlcmFjdGl2ZUhpZ2hsaWdodE5vZGUgPSB0aGlzLm5vZGUgYXMgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdOb2RlO1xyXG4gICAgICBjb25zdCBsb2NrZWRQb2ludGVyRm9jdXMgPSB0aGlzLmRpc3BsYXkuZm9jdXNNYW5hZ2VyLmxvY2tlZFBvaW50ZXJGb2N1c1Byb3BlcnR5LnZhbHVlO1xyXG4gICAgICBhc3NlcnQoIGludGVyYWN0aXZlSGlnaGxpZ2h0Tm9kZSB8fCAoIGxvY2tlZFBvaW50ZXJGb2N1cyAmJiBsb2NrZWRQb2ludGVyRm9jdXMudHJhaWwubGFzdE5vZGUoKSA9PT0gdGhpcy5ub2RlICksXHJcbiAgICAgICAgJ1VwZGF0ZSBzaG91bGQgb25seSBiZSBuZWNlc3NhcnkgaWYgTm9kZSBpcyBhY3RpdmF0ZWQgd2l0aCBhIFBvaW50ZXIgb3IgcG9pbnRlciBmb2N1cyBpcyBsb2NrZWQgZHVyaW5nIGludGVyYWN0aW9uJyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFByZWZlciB0aGUgdHJhaWwgdG8gdGhlICdsb2NrZWQnIGhpZ2hsaWdodFxyXG4gICAgdGhpcy51cGRhdGVJbnRlcmFjdGl2ZUhpZ2hsaWdodChcclxuICAgICAgdGhpcy5kaXNwbGF5LmZvY3VzTWFuYWdlci5sb2NrZWRQb2ludGVyRm9jdXNQcm9wZXJ0eS52YWx1ZSB8fFxyXG4gICAgICB0aGlzLmRpc3BsYXkuZm9jdXNNYW5hZ2VyLnBvaW50ZXJGb2N1c1Byb3BlcnR5LnZhbHVlXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVkcmF3IHRoZSBoaWdobGlnaHQgZm9yIHRoZSBSZWFkaW5nQmxvY2sgaWYgaXQgY2hhbmdlcyB3aGlsZSB0aGUgcmVhZGluZyBibG9jayBoaWdobGlnaHQgaXMgYWxyZWFkeVxyXG4gICAqIGFjdGl2ZSBmb3IgYSBOb2RlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgb25SZWFkaW5nQmxvY2tIaWdobGlnaHRDaGFuZ2UoKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmFjdGl2ZVJlYWRpbmdCbG9ja05vZGUsICdVcGRhdGUgc2hvdWxkIG9ubHkgYmUgbmVjZXNzYXJ5IHdoZW4gdGhlcmUgaXMgYW4gYWN0aXZlIFJlYWRpbmdCbG9jayBOb2RlJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5hY3RpdmVSZWFkaW5nQmxvY2tOb2RlIS5yZWFkaW5nQmxvY2tBY3RpdmF0ZWQsICdVcGRhdGUgc2hvdWxkIG9ubHkgYmUgbmVjZXNzYXJ5IHdoaWxlIHRoZSBSZWFkaW5nQmxvY2sgaXMgYWN0aXZhdGVkJyApO1xyXG4gICAgdGhpcy5vblJlYWRpbmdCbG9ja0ZvY3VzQ2hhbmdlKCB0aGlzLmRpc3BsYXkuZm9jdXNNYW5hZ2VyLnJlYWRpbmdCbG9ja0ZvY3VzUHJvcGVydHkudmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZW4gZm9jdXMgaGlnaGxpZ2h0IHZpc2liaWxpdHkgY2hhbmdlcywgZGVhY3RpdmF0ZSBoaWdobGlnaHRzIG9yIHJlYWN0aXZhdGUgdGhlIGhpZ2hsaWdodCBhcm91bmQgdGhlIE5vZGVcclxuICAgKiB3aXRoIGZvY3VzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgb25Gb2N1c0hpZ2hsaWdodHNWaXNpYmxlQ2hhbmdlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5vbkZvY3VzQ2hhbmdlKCBGb2N1c01hbmFnZXIucGRvbUZvY3VzICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGVuIHZvaWNpbmcgaGlnaGxpZ2h0IHZpc2liaWxpdHkgY2hhbmdlcywgZGVhY3RpdmF0ZSBoaWdobGlnaHRzIG9yIHJlYWN0aXZhdGUgdGhlIGhpZ2hsaWdodCBhcm91bmQgdGhlIE5vZGVcclxuICAgKiB3aXRoIGZvY3VzLiBOb3RlIHRoYXQgd2hlbiB2b2ljaW5nIGlzIGRpc2FibGVkIHdlIHdpbGwgbmV2ZXIgc2V0IHRoZSBwb2ludGVyRm9jdXNQcm9wZXJ0eSB0byBwcmV2ZW50XHJcbiAgICogZXh0cmEgd29yaywgc28gdGhpcyBmdW5jdGlvbiBzaG91bGRuJ3QgZG8gbXVjaC4gQnV0IGl0IGlzIGhlcmUgdG8gY29tcGxldGUgdGhlIEFQSS5cclxuICAgKi9cclxuICBwcml2YXRlIG9uVm9pY2luZ0hpZ2hsaWdodHNWaXNpYmxlQ2hhbmdlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5vblBvaW50ZXJGb2N1c0NoYW5nZSggdGhpcy5kaXNwbGF5LmZvY3VzTWFuYWdlci5wb2ludGVyRm9jdXNQcm9wZXJ0eS52YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIGJ5IERpc3BsYXksIHVwZGF0ZXMgdGhpcyBvdmVybGF5IGluIHRoZSBEaXNwbGF5LnVwZGF0ZURpc3BsYXkgY2FsbC5cclxuICAgKi9cclxuICBwdWJsaWMgdXBkYXRlKCk6IHZvaWQge1xyXG5cclxuICAgIC8vIFRyYW5zZm9ybSB0aGUgaGlnaGxpZ2h0IHRvIG1hdGNoIHRoZSBwb3NpdGlvbiBvZiB0aGUgbm9kZVxyXG4gICAgaWYgKCB0aGlzLmhhc0hpZ2hsaWdodCgpICYmIHRoaXMudHJhbnNmb3JtRGlydHkgKSB7XHJcbiAgICAgIHRoaXMudHJhbnNmb3JtRGlydHkgPSBmYWxzZTtcclxuXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMudHJhbnNmb3JtVHJhY2tlciwgJ1RoZSB0cmFuc2Zvcm1UcmFja2VyIG11c3QgYmUgYXZhaWxhYmxlIG9uIHVwZGF0ZSBpZiB0cmFuc2Zvcm0gaXMgZGlydHknICk7XHJcbiAgICAgIHRoaXMuaGlnaGxpZ2h0Tm9kZS5zZXRNYXRyaXgoIHRoaXMudHJhbnNmb3JtVHJhY2tlciEubWF0cml4ICk7XHJcblxyXG4gICAgICBpZiAoIHRoaXMuZ3JvdXBIaWdobGlnaHROb2RlICkge1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuZ3JvdXBUcmFuc2Zvcm1UcmFja2VyLCAnVGhlIGdyb3VwVHJhbnNmb3JtVHJhY2tlciBtdXN0IGJlIGF2YWlsYWJsZSBvbiB1cGRhdGUgaWYgdHJhbnNmb3JtIGlzIGRpcnR5JyApO1xyXG4gICAgICAgIHRoaXMuZ3JvdXBIaWdobGlnaHROb2RlLnNldE1hdHJpeCggdGhpcy5ncm91cFRyYW5zZm9ybVRyYWNrZXIhLm1hdHJpeCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmFmdGVyVHJhbnNmb3JtKCk7XHJcbiAgICB9XHJcbiAgICBpZiAoIHRoaXMuaGFzUmVhZGluZ0Jsb2NrSGlnaGxpZ2h0KCkgJiYgdGhpcy5yZWFkaW5nQmxvY2tUcmFuc2Zvcm1EaXJ0eSApIHtcclxuICAgICAgdGhpcy5yZWFkaW5nQmxvY2tUcmFuc2Zvcm1EaXJ0eSA9IGZhbHNlO1xyXG5cclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5yZWFkaW5nQmxvY2tUcmFuc2Zvcm1UcmFja2VyLCAnVGhlIGdyb3VwVHJhbnNmb3JtVHJhY2tlciBtdXN0IGJlIGF2YWlsYWJsZSBvbiB1cGRhdGUgaWYgdHJhbnNmb3JtIGlzIGRpcnR5JyApO1xyXG4gICAgICB0aGlzLnJlYWRpbmdCbG9ja0hpZ2hsaWdodE5vZGUuc2V0TWF0cml4KCB0aGlzLnJlYWRpbmdCbG9ja1RyYW5zZm9ybVRyYWNrZXIhLm1hdHJpeCApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggIXRoaXMuZGlzcGxheS5zaXplLmVxdWFscyggdGhpcy5mb2N1c0Rpc3BsYXkuc2l6ZSApICkge1xyXG4gICAgICB0aGlzLmZvY3VzRGlzcGxheS5zZXRXaWR0aEhlaWdodCggdGhpcy5kaXNwbGF5LndpZHRoLCB0aGlzLmRpc3BsYXkuaGVpZ2h0ICk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmZvY3VzRGlzcGxheS51cGRhdGVEaXNwbGF5KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXQgdGhlIGlubmVyIGNvbG9yIG9mIGFsbCBmb2N1cyBoaWdobGlnaHRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgc2V0SW5uZXJIaWdobGlnaHRDb2xvciggY29sb3I6IFRQYWludCApOiB2b2lkIHtcclxuICAgIGlubmVySGlnaGxpZ2h0Q29sb3IgPSBjb2xvcjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgaW5uZXIgY29sb3Igb2YgYWxsIGZvY3VzIGhpZ2hsaWdodHMuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBnZXRJbm5lckhpZ2hsaWdodENvbG9yKCk6IFRQYWludCB7XHJcbiAgICByZXR1cm4gaW5uZXJIaWdobGlnaHRDb2xvcjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgb3V0ZXIgY29sb3Igb2YgYWxsIGZvY3VzIGhpZ2hsaWdodHMuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBzZXRPdXRlckhpbGlnaHRDb2xvciggY29sb3I6IFRQYWludCApOiB2b2lkIHtcclxuICAgIG91dGVySGlnaGxpZ2h0Q29sb3IgPSBjb2xvcjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgb3V0ZXIgY29sb3Igb2YgYWxsIGZvY3VzIGhpZ2hsaWdodHMuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBnZXRPdXRlckhpZ2hsaWdodENvbG9yKCk6IFRQYWludCB7XHJcbiAgICByZXR1cm4gb3V0ZXJIaWdobGlnaHRDb2xvcjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgaW5uZXIgY29sb3Igb2YgYWxsIGdyb3VwIGZvY3VzIGhpZ2hsaWdodHMuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBzZXRJbm5lckdyb3VwSGlnaGxpZ2h0Q29sb3IoIGNvbG9yOiBUUGFpbnQgKTogdm9pZCB7XHJcbiAgICBpbm5lckdyb3VwSGlnaGxpZ2h0Q29sb3IgPSBjb2xvcjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgaW5uZXIgY29sb3Igb2YgYWxsIGdyb3VwIGZvY3VzIGhpZ2hsaWdodHNcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGdldElubmVyR3JvdXBIaWdobGlnaHRDb2xvcigpOiBUUGFpbnQge1xyXG4gICAgcmV0dXJuIGlubmVyR3JvdXBIaWdobGlnaHRDb2xvcjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgb3V0ZXIgY29sb3Igb2YgYWxsIGdyb3VwIGZvY3VzIGhpZ2hsaWdodC5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHNldE91dGVyR3JvdXBIaWdobGlnaHRDb2xvciggY29sb3I6IFRQYWludCApOiB2b2lkIHtcclxuICAgIG91dGVyR3JvdXBIaWdobGlnaHRDb2xvciA9IGNvbG9yO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBvdXRlciBjb2xvciBvZiBhbGwgZ3JvdXAgZm9jdXMgaGlnaGxpZ2h0cy5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGdldE91dGVyR3JvdXBIaWdobGlnaHRDb2xvcigpOiBUUGFpbnQge1xyXG4gICAgcmV0dXJuIG91dGVyR3JvdXBIaWdobGlnaHRDb2xvcjtcclxuICB9XHJcbn1cclxuXHJcbnNjZW5lcnkucmVnaXN0ZXIoICdIaWdobGlnaHRPdmVybGF5JywgSGlnaGxpZ2h0T3ZlcmxheSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNB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