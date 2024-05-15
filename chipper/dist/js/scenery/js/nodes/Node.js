// Copyright 2012-2024, University of Colorado Boulder

/**
 * A Node for the Scenery scene graph. Supports general directed acyclic graphics (DAGs).
 * Handles multiple layers with assorted types (Canvas 2D, SVG, DOM, WebGL, etc.).
 *
 * ## General description of Nodes
 *
 * In Scenery, the visual output is determined by a group of connected Nodes (generally known as a scene graph).
 * Each Node has a list of 'child' Nodes. When a Node is visually displayed, its child Nodes (children) will also be
 * displayed, along with their children, etc. There is typically one 'root' Node that is passed to the Scenery Display
 * whose descendants (Nodes that can be traced from the root by child relationships) will be displayed.
 *
 * For instance, say there are Nodes named A, B, C, D and E, who have the relationships:
 * - B is a child of A (thus A is a parent of B)
 * - C is a child of A (thus A is a parent of C)
 * - D is a child of C (thus C is a parent of D)
 * - E is a child of C (thus C is a parent of E)
 * where A would be the root Node. This can be visually represented as a scene graph, where a line connects a parent
 * Node to a child Node (where the parent is usually always at the top of the line, and the child is at the bottom):
 * For example:
 *
 *   A
 *  / \
 * B   C
 *    / \
 *   D   E
 *
 * Additionally, in this case:
 * - D is a 'descendant' of A (due to the C being a child of A, and D being a child of C)
 * - A is an 'ancestor' of D (due to the reverse)
 * - C's 'subtree' is C, D and E, which consists of C itself and all of its descendants.
 *
 * Note that Scenery allows some more complicated forms, where Nodes can have multiple parents, e.g.:
 *
 *   A
 *  / \
 * B   C
 *  \ /
 *   D
 *
 * In this case, D has two parents (B and C). Scenery disallows any Node from being its own ancestor or descendant,
 * so that loops are not possible. When a Node has two or more parents, it means that the Node's subtree will typically
 * be displayed twice on the screen. In the above case, D would appear both at B's position and C's position. Each
 * place a Node would be displayed is known as an 'instance'.
 *
 * Each Node has a 'transform' associated with it, which determines how its subtree (that Node and all of its
 * descendants) will be positioned. Transforms can contain:
 * - Translation, which moves the position the subtree is displayed
 * - Scale, which makes the displayed subtree larger or smaller
 * - Rotation, which displays the subtree at an angle
 * - or any combination of the above that uses an affine matrix (more advanced transforms with shear and combinations
 *   are possible).
 *
 * Say we have the following scene graph:
 *
 *   A
 *   |
 *   B
 *   |
 *   C
 *
 * where there are the following transforms:
 * - A has a 'translation' that moves the content 100 pixels to the right
 * - B has a 'scale' that doubles the size of the content
 * - C has a 'rotation' that rotates 180-degrees around the origin
 *
 * If C displays a square that fills the area with 0 <= x <= 10 and 0 <= y <= 10, we can determine the position on
 * the display by applying transforms starting at C and moving towards the root Node (in this case, A):
 * 1. We apply C's rotation to our square, so the filled area will now be -10 <= x <= 0 and -10 <= y <= 0
 * 2. We apply B's scale to our square, so now we have -20 <= x <= 0 and -20 <= y <= 0
 * 3. We apply A's translation to our square, moving it to 80 <= x <= 100 and -20 <= y <= 0
 *
 * Nodes also have a large number of properties that will affect how their entire subtree is rendered, such as
 * visibility, opacity, etc.
 *
 * ## Creating Nodes
 *
 * Generally, there are two types of Nodes:
 * - Nodes that don't display anything, but serve as a container for other Nodes (e.g. Node itself, HBox, VBox)
 * - Nodes that display content, but ALSO serve as a container (e.g. Circle, Image, Text)
 *
 * When a Node is created with the default Node constructor, e.g.:
 *   var node = new Node();
 * then that Node will not display anything by itself.
 *
 * Generally subtypes of Node are used for displaying things, such as Circle, e.g.:
 *   var circle = new Circle( 20 ); // radius of 20
 *
 * Almost all Nodes (with the exception of leaf-only Nodes like Spacer) can contain children.
 *
 * ## Connecting Nodes, and rendering order
 *
 * To make a 'childNode' become a 'parentNode', the typical way is to call addChild():
 *   parentNode.addChild( childNode );
 *
 * To remove this connection, you can call:
 *   parentNode.removeChild( childNode );
 *
 * Adding a child Node with addChild() puts it at the end of parentNode's list of child Nodes. This is important,
 * because the order of children affects what Nodes are drawn on the 'top' or 'bottom' visually. Nodes that are at the
 * end of the list of children are generally drawn on top.
 *
 * This is generally easiest to represent by notating scene graphs with children in order from left to right, thus:
 *
 *   A
 *  / \
 * B   C
 *    / \
 *   D   E
 *
 * would indicate that A's children are [B,C], so C's subtree is drawn ON TOP of B. The same is true of C's children
 * [D,E], so E is drawn on top of D. If a Node itself has content, it is drawn below that of its children (so C itself
 * would be below D and E).
 *
 * This means that for every scene graph, Nodes instances can be ordered from bottom to top. For the above example, the
 * order is:
 * 1. A (on the very bottom visually, may get covered up by other Nodes)
 * 2. B
 * 3. C
 * 4. D
 * 5. E (on the very top visually, may be covering other Nodes)
 *
 * ## Trails
 *
 * For examples where there are multiple parents for some Nodes (also referred to as DAG in some code, as it represents
 * a Directed Acyclic Graph), we need more information about the rendering order (as otherwise Nodes could appear
 * multiple places in the visual bottom-to-top order.
 *
 * A Trail is basically a list of Nodes, where every Node in the list is a child of its previous element, and a parent
 * of its next element. Thus for the scene graph:
 *
 *   A
 *  / \
 * B   C
 *  \ / \
 *   D   E
 *    \ /
 *     F
 *
 * there are actually three instances of F being displayed, with three trails:
 * - [A,B,D,F]
 * - [A,C,D,F]
 * - [A,C,E,F]
 * Note that the trails are essentially listing Nodes used in walking from the root (A) to the relevant Node (F) using
 * connections between parents and children.
 *
 * The trails above are in order from bottom to top (visually), due to the order of children. Thus since A's children
 * are [B,C] in that order, F with the trail [A,B,D,F] is displayed below [A,C,D,F], because C is after B.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import BooleanProperty from '../../../axon/js/BooleanProperty.js';
import EnabledProperty from '../../../axon/js/EnabledProperty.js';
import Property from '../../../axon/js/Property.js';
import TinyEmitter from '../../../axon/js/TinyEmitter.js';
import TinyForwardingProperty from '../../../axon/js/TinyForwardingProperty.js';
import TinyProperty from '../../../axon/js/TinyProperty.js';
import TinyStaticProperty from '../../../axon/js/TinyStaticProperty.js';
import Bounds2 from '../../../dot/js/Bounds2.js';
import Matrix3 from '../../../dot/js/Matrix3.js';
import Transform3 from '../../../dot/js/Transform3.js';
import Vector2 from '../../../dot/js/Vector2.js';
import { Shape } from '../../../kite/js/imports.js';
import arrayDifference from '../../../phet-core/js/arrayDifference.js';
import deprecationWarning from '../../../phet-core/js/deprecationWarning.js';
import PhetioObject from '../../../tandem/js/PhetioObject.js';
import Tandem from '../../../tandem/js/Tandem.js';
import BooleanIO from '../../../tandem/js/types/BooleanIO.js';
import IOType from '../../../tandem/js/types/IOType.js';
import { ACCESSIBILITY_OPTION_KEYS, CanvasContextWrapper, Features, Filter, hotkeyManager, Image, isHeightSizable, isWidthSizable, Mouse, ParallelDOM, Picker, Renderer, RendererSummary, scenery, serializeConnectedNodes, Trail } from '../imports.js';
import optionize, { combineOptions, optionize3 } from '../../../phet-core/js/optionize.js';
import Utils from '../../../dot/js/Utils.js';
let globalIdCounter = 1;
const scratchBounds2 = Bounds2.NOTHING.copy(); // mutable {Bounds2} used temporarily in methods
const scratchBounds2Extra = Bounds2.NOTHING.copy(); // mutable {Bounds2} used temporarily in methods
const scratchMatrix3 = new Matrix3();
const ENABLED_PROPERTY_TANDEM_NAME = EnabledProperty.TANDEM_NAME;
const VISIBLE_PROPERTY_TANDEM_NAME = 'visibleProperty';
const INPUT_ENABLED_PROPERTY_TANDEM_NAME = 'inputEnabledProperty';
const PHET_IO_STATE_DEFAULT = false;

// Store the number of parents from the single Node instance that has the most parents in the whole runtime.
let maxParentCount = 0;

// Store the number of children from the single Node instance that has the most children in the whole runtime.
let maxChildCount = 0;
export const REQUIRES_BOUNDS_OPTION_KEYS = ['leftTop',
// {Vector2} - The upper-left corner of this Node's bounds, see setLeftTop() for more documentation
'centerTop',
// {Vector2} - The top-center of this Node's bounds, see setCenterTop() for more documentation
'rightTop',
// {Vector2} - The upper-right corner of this Node's bounds, see setRightTop() for more documentation
'leftCenter',
// {Vector2} - The left-center of this Node's bounds, see setLeftCenter() for more documentation
'center',
// {Vector2} - The center of this Node's bounds, see setCenter() for more documentation
'rightCenter',
// {Vector2} - The center-right of this Node's bounds, see setRightCenter() for more documentation
'leftBottom',
// {Vector2} - The bottom-left of this Node's bounds, see setLeftBottom() for more documentation
'centerBottom',
// {Vector2} - The middle center of this Node's bounds, see setCenterBottom() for more documentation
'rightBottom',
// {Vector2} - The bottom right of this Node's bounds, see setRightBottom() for more documentation
'left',
// {number} - The left side of this Node's bounds, see setLeft() for more documentation
'right',
// {number} - The right side of this Node's bounds, see setRight() for more documentation
'top',
// {number} - The top side of this Node's bounds, see setTop() for more documentation
'bottom',
// {number} - The bottom side of this Node's bounds, see setBottom() for more documentation
'centerX',
// {number} - The x-center of this Node's bounds, see setCenterX() for more documentation
'centerY' // {number} - The y-center of this Node's bounds, see setCenterY() for more documentation
];

// Node options, in the order they are executed in the constructor/mutate()
const NODE_OPTION_KEYS = ['children',
// List of children to add (in order), see setChildren for more documentation
'cursor',
// CSS cursor to display when over this Node, see setCursor() for more documentation

'phetioVisiblePropertyInstrumented',
// When true, create an instrumented visibleProperty when this Node is instrumented, see setPhetioVisiblePropertyInstrumented() for more documentation
'visibleProperty',
// Sets forwarding of the visibleProperty, see setVisibleProperty() for more documentation
'visible',
// Whether the Node is visible, see setVisible() for more documentation

'pickableProperty',
// Sets forwarding of the pickableProperty, see setPickableProperty() for more documentation
'pickable',
// Whether the Node is pickable, see setPickable() for more documentation

'phetioEnabledPropertyInstrumented',
// When true, create an instrumented enabledProperty when this Node is instrumented, see setPhetioEnabledPropertyInstrumented() for more documentation
'enabledProperty',
// Sets forwarding of the enabledProperty, see setEnabledProperty() for more documentation
'enabled',
// Whether the Node is enabled, see setEnabled() for more documentation

'phetioInputEnabledPropertyInstrumented',
// When true, create an instrumented inputEnabledProperty when this Node is instrumented, see setPhetioInputEnabledPropertyInstrumented() for more documentation
'inputEnabledProperty',
// Sets forwarding of the inputEnabledProperty, see setInputEnabledProperty() for more documentation
'inputEnabled',
// {boolean} Whether input events can reach into this subtree, see setInputEnabled() for more documentation
'inputListeners',
// The input listeners attached to the Node, see setInputListeners() for more documentation
'opacity',
// Opacity of this Node's subtree, see setOpacity() for more documentation
'disabledOpacity',
// A multiplier to the opacity of this Node's subtree when the node is disabled, see setDisabledOpacity() for more documentation
'filters',
// Non-opacity filters, see setFilters() for more documentation
'matrix',
// Transformation matrix of the Node, see setMatrix() for more documentation
'translation',
// x/y translation of the Node, see setTranslation() for more documentation
'x',
// x translation of the Node, see setX() for more documentation
'y',
// y translation of the Node, see setY() for more documentation
'rotation',
// rotation (in radians) of the Node, see setRotation() for more documentation
'scale',
// scale of the Node, see scale() for more documentation
'excludeInvisibleChildrenFromBounds',
// Controls bounds depending on child visibility, see setExcludeInvisibleChildrenFromBounds() for more documentation
'layoutOptions',
// Provided to layout containers for options, see setLayoutOptions() for more documentation
'localBounds',
// bounds of subtree in local coordinate frame, see setLocalBounds() for more documentation
'maxWidth',
// Constrains width of this Node, see setMaxWidth() for more documentation
'maxHeight',
// Constrains height of this Node, see setMaxHeight() for more documentation
'renderer',
// The preferred renderer for this subtree, see setRenderer() for more documentation
'layerSplit',
// Forces this subtree into a layer of its own, see setLayerSplit() for more documentation
'usesOpacity',
// Hint that opacity will be changed, see setUsesOpacity() for more documentation
'cssTransform',
// Hint that can trigger using CSS transforms, see setCssTransform() for more documentation
'excludeInvisible',
// If this is invisible, exclude from DOM, see setExcludeInvisible() for more documentation
'webglScale',
// Hint to adjust WebGL scaling quality for this subtree, see setWebglScale() for more documentation
'preventFit',
// Prevents layers from fitting this subtree, see setPreventFit() for more documentation
'mouseArea',
// Changes the area the mouse can interact with, see setMouseArea() for more documentation
'touchArea',
// Changes the area touches can interact with, see setTouchArea() for more documentation
'clipArea',
// Makes things outside of a shape invisible, see setClipArea() for more documentation
'transformBounds',
// Flag that makes bounds tighter, see setTransformBounds() for more documentation
...REQUIRES_BOUNDS_OPTION_KEYS];
const DEFAULT_OPTIONS = {
  phetioVisiblePropertyInstrumented: true,
  visible: true,
  opacity: 1,
  disabledOpacity: 1,
  pickable: null,
  enabled: true,
  phetioEnabledPropertyInstrumented: false,
  inputEnabled: true,
  phetioInputEnabledPropertyInstrumented: false,
  clipArea: null,
  mouseArea: null,
  touchArea: null,
  cursor: null,
  transformBounds: false,
  maxWidth: null,
  maxHeight: null,
  renderer: null,
  usesOpacity: false,
  layerSplit: false,
  cssTransform: false,
  excludeInvisible: false,
  webglScale: null,
  preventFit: false
};
const DEFAULT_INTERNAL_RENDERER = DEFAULT_OPTIONS.renderer === null ? 0 : Renderer.fromName(DEFAULT_OPTIONS.renderer);

// Isolated so that we can delay options that are based on bounds of the Node to after construction.
// See https://github.com/phetsims/scenery/issues/1332

// All translation options (includes those based on bounds and those that are not)

// All transform options (includes translation options)

// All base Node options

class Node extends ParallelDOM {
  // NOTE: All member properties with names starting with '_' are assumed to be private/protected!

  // Assigns a unique ID to this Node (allows trails to get a unique list of IDs)

  // All of the Instances tracking this Node

  // All displays where this Node is the root. (scenery-internal)

  // Drawable states that need to be updated on mutations. Generally added by SVG and
  // DOM elements that need to closely track state (possibly by Canvas to maintain dirty state).
  // (scenery-internal)

  // Whether this Node (and its children) will be visible when the scene is updated.
  // Visible Nodes by default will not be pickable either.
  // NOTE: This is fired synchronously when the visibility of the Node is toggled

  // Opacity, in the range from 0 (fully transparent) to 1 (fully opaque).
  // NOTE: This is fired synchronously when the opacity of the Node is toggled

  // Disabled opacity, in the range from 0 (fully transparent) to 1 (fully opaque).
  // Combined with the normal opacity ONLY when the node is disabled.
  // NOTE: This is fired synchronously when the opacity of the Node is toggled

  // See setPickable() and setPickableProperty()
  // NOTE: This is fired synchronously when the pickability of the Node is toggled

  // See setEnabled() and setEnabledProperty()

  // Whether input event listeners on this Node or descendants on a trail will have
  // input listeners. triggered. Note that this does NOT effect picking, and only prevents some listeners from being
  // fired.

  // This Node and all children will be clipped by this shape (in addition to any
  // other clipping shapes). The shape should be in the local coordinate frame.
  // NOTE: This is fired synchronously when the clipArea of the Node is toggled

  // Whether this Node and its subtree can announce content with Voicing and SpeechSynthesis. Though
  // related to Voicing it exists in Node because it is useful to set voicingVisible on a subtree where the
  // root does not compose Voicing. This is not ideal but the entirety of Voicing cannot be composed into every
  // Node because it would produce incorrect behaviors and have a massive memory footprint. See setVoicingVisible()
  // and Voicing.ts for more information about Voicing.

  // Areas for hit intersection. If set on a Node, no descendants can handle events.
  // (scenery-internal)
  // for mouse position in the local coordinate frame
  // for touch and pen position in the local coordinate frame

  // The CSS cursor to be displayed over this Node. null should be the default (inherit) value.

  // Ordered array of child Nodes.
  // (scenery-internal)

  // Unordered array of parent Nodes.
  // (scenery-internal)

  // Whether we will do more accurate (and tight) bounds computations for rotations and shears.

  // Set up the transform reference. we add a listener so that the transform itself can be modified directly
  // by reference, triggering the event notifications for Scenery The reference to the Transform3 will never change.
  // (scenery-internal)

  // Maximum dimensions for the Node's local bounds before a corrective scaling factor is applied to maintain size.
  // The maximum dimensions are always compared to local bounds, and applied "before" the Node's transform.
  // Whenever the local bounds or maximum dimensions of this Node change and it has at least one maximum dimension
  // (width or height), an ideal scale is computed (either the smallest scale for our local bounds to fit the
  // dimension constraints, OR 1, whichever is lower). Then the Node's transform will be scaled (prepended) with
  // a scale adjustment of ( idealScale / alreadyAppliedScaleFactor ).
  // In the simple case where the Node isn't otherwise transformed, this will apply and update the Node's scale so that
  // the Node matches the maximum dimensions, while never scaling over 1. Note that manually applying transforms to
  // the Node is fine, but may make the Node's width greater than the maximum width.
  // NOTE: If a dimension constraint is null, no resizing will occur due to it. If both maxWidth and maxHeight are null,
  // no scale adjustment will be applied.
  //
  // Also note that setting maxWidth/maxHeight is like adding a local bounds listener (will trigger validation of
  // bounds during the updateDisplay step). NOTE: this means updates to the transform (on a local bounds change) will
  // happen when bounds are validated (validateBounds()), which does not happen synchronously on a child's size
  // change. It does happen at least once in updateDisplay() before rendering, and calling validateBounds() can force
  // a re-check and transform.

  // Scale applied due to the maximum dimension constraints.

  // For user input handling (mouse/touch). (scenery-internal)

  // [mutable] Bounds for this Node and its children in the "parent" coordinate frame.
  // NOTE: The reference here will not change, we will just notify using the equivalent static notification method.
  // NOTE: This is fired **asynchronously** (usually as part of a Display.updateDisplay()) when the bounds of the Node
  // is changed.

  // [mutable] Bounds for this Node and its children in the "local" coordinate frame.
  // NOTE: The reference here will not change, we will just notify using the equivalent static notification method.
  // NOTE: This is fired **asynchronously** (usually as part of a Display.updateDisplay()) when the localBounds of
  // the Node is changed.

  // [mutable] Bounds just for children of this Node (and sub-trees), in the "local" coordinate frame.
  // NOTE: The reference here will not change, we will just notify using the equivalent static notification method.
  // NOTE: This is fired **asynchronously** (usually as part of a Display.updateDisplay()) when the childBounds of the
  // Node is changed.

  // [mutable] Bounds just for this Node, in the "local" coordinate frame.
  // NOTE: The reference here will not change, we will just notify using the equivalent static notification method.
  // NOTE: This event can be fired synchronously, and happens with the self-bounds of a Node is changed. This is NOT
  // like the other bounds Properties, which usually fire asynchronously

  // Whether our localBounds have been set (with the ES5 setter/setLocalBounds()) to a custom
  // overridden value. If true, then localBounds itself will not be updated, but will instead always be the
  // overridden value.
  // (scenery-internal)

  // [mutable] Whether invisible children will be excluded from this Node's bounds

  // Options that can be provided to layout managers to adjust positioning for this node.

  // Whether bounds needs to be recomputed to be valid.
  // (scenery-internal)

  // Whether localBounds needs to be recomputed to be valid.
  // (scenery-internal)

  // Whether selfBounds needs to be recomputed to be valid.
  // (scenery-internal)

  // Whether childBounds needs to be recomputed to be valid.
  // (scenery-internal)

  // (scenery-internal)

  // If assertions are enabled
  // If assertions are enabled
  // If assertions are enabled
  // If assertions are enabled

  // (scenery-internal) Performance hint: What type of renderer should be forced for this Node. Uses the internal
  // bitmask structure declared in Renderer.

  // (scenery-internal) Performance hint: Whether it is anticipated that opacity will be switched on. If so, having this
  // set to true will make switching back-and-forth between opacity:1 and other opacities much faster.

  // (scenery-internal) Performance hint: Whether layers should be split before and after this Node.

  // (scenery-internal) Performance hint: Whether this Node and its subtree should handle transforms by using a CSS
  // transform of a div.

  // (scenery-internal) Performance hint: Whether SVG (or other) content should be excluded from the DOM tree when
  // invisible (instead of just being hidden)

  // (scenery-internal) Performance hint: If non-null, a multiplier to the detected pixel-to-pixel scaling of the
  // WebGL Canvas

  // (scenery-internal) Performance hint: If true, Scenery will not fit any blocks that contain drawables attached to
  // Nodes underneath this Node's subtree. This will typically prevent Scenery from triggering bounds computation for
  // this sub-tree, and movement of this Node or its descendants will never trigger the refitting of a block.

  // This is fired only once for any single operation that may change the children of a Node.
  // For example, if a Node's children are [ a, b ] and setChildren( [ a, x, y, z ] ) is called on it, the
  // childrenChanged event will only be fired once after the entire operation of changing the children is completed.
  childrenChangedEmitter = new TinyEmitter();

  // For every single added child Node, emits with {Node} Node, {number} indexOfChild
  childInsertedEmitter = new TinyEmitter();

  // For every single removed child Node, emits with {Node} Node, {number} indexOfChild
  childRemovedEmitter = new TinyEmitter();

  // Provides a given range that may be affected by the reordering
  childrenReorderedEmitter = new TinyEmitter();

  // Fired whenever a parent is added
  parentAddedEmitter = new TinyEmitter();

  // Fired whenever a parent is removed
  parentRemovedEmitter = new TinyEmitter();

  // Fired synchronously when the transform (transformation matrix) of a Node is changed. Any
  // change to a Node's translation/rotation/scale/etc. will trigger this event.
  transformEmitter = new TinyEmitter();

  // Should be emitted when we need to check full metadata updates directly on Instances,
  // to see if we need to change drawable types, etc.
  instanceRefreshEmitter = new TinyEmitter();

  // Emitted to when we need to potentially recompute our renderer summary (bitmask flags, or
  // things that could affect descendants)
  rendererSummaryRefreshEmitter = new TinyEmitter();

  // Emitted to when we change filters (either opacity or generalized filters)
  filterChangeEmitter = new TinyEmitter();

  // Fired when an instance is changed (added/removed). CAREFUL!! This is potentially a very dangerous thing to listen
  // to. Instances are updated in an asynchronous batch during `updateDisplay()`, and it is very important that display
  // updates do not cause changes the scene graph. Thus, this emitter should NEVER trigger a Node's state to change.
  // Currently, all usages of this cause into updates to the audio view, or updates to a separate display (used as an
  // overlay). Please proceed with caution. Most likely you prefer to use the synchronous support of DisplayedTrailsProperty,
  // see https://github.com/phetsims/scenery/issues/1615 and https://github.com/phetsims/scenery/issues/1620 for details.
  changedInstanceEmitter = new TinyEmitter();

  // Fired whenever this node is added as a root to a Display OR when it is removed as a root from a Display (i.e.
  // the Display is disposed).
  rootedDisplayChangedEmitter = new TinyEmitter();

  // Fired when layoutOptions changes
  layoutOptionsChangedEmitter = new TinyEmitter();

  // A bitmask which specifies which renderers this Node (and only this Node, not its subtree) supports.
  // (scenery-internal)

  // A bitmask-like summary of what renderers and options are supported by this Node and all of its descendants
  // (scenery-internal)

  // So we can traverse only the subtrees that require bounds validation for events firing.
  // This is a sum of the number of events requiring bounds validation on this Node, plus the number of children whose
  // count is non-zero.
  // NOTE: this means that if A has a child B, and B has a boundsEventCount of 5, it only contributes 1 to A's count.
  // This allows us to have changes localized (increasing B's count won't change A or any of A's ancestors), and
  // guarantees that we will know whether a subtree has bounds listeners. Also important: decreasing B's
  // boundsEventCount down to 0 will allow A to decrease its count by 1, without having to check its other children
  // (if we were just using a boolean value, this operation would require A to check if any OTHER children besides
  // B had bounds listeners)
  // (scenery-internal)

  // This signals that we can validateBounds() on this subtree and we don't have to traverse further
  // (scenery-internal)

  // Subcomponent dedicated to hit testing
  // (scenery-internal)

  // There are certain specific cases (in this case due to a11y) where we need
  // to know that a Node is getting removed from its parent BUT that process has not completed yet. It would be ideal
  // to not need this.
  // (scenery-internal)

  // {Object} - A mapping of all of options that require Bounds to be applied properly. Most often these should be set through `mutate` in the end of the construcor instead of being passed through `super()`
  static REQUIRES_BOUNDS_OPTION_KEYS = REQUIRES_BOUNDS_OPTION_KEYS;

  // Used by sceneryDeserialize
  // (scenery-internal)

  // Tracks any layout constraint, so that we can avoid having multiple layout constraints on the same node
  // (and avoid the infinite loops that can happen if that is triggered).
  // (scenery-internal)
  _activeParentLayoutConstraint = null;

  // This is an array of property (setter) names for Node.mutate(), which are also used when creating
  // Nodes with parameter objects.
  //
  // E.g. new phet.scenery.Node( { x: 5, rotation: 20 } ) will create a Path, and apply setters in the order below
  // (node.x = 5; node.rotation = 20)
  //
  // Some special cases exist (for function names). new phet.scenery.Node( { scale: 2 } ) will actually call
  // node.scale( 2 ).
  //
  // The order below is important! Don't change this without knowing the implications.
  //
  // NOTE: Translation-based mutators come before rotation/scale, since typically we think of their operations
  //       occurring "after" the rotation / scaling
  // NOTE: left/right/top/bottom/centerX/centerY are at the end, since they rely potentially on rotation / scaling
  //       changes of bounds that may happen beforehand
  // (scenery-internal)

  // List of all dirty flags that should be available on drawables created from this Node (or
  // subtype). Given a flag (e.g. radius), it indicates the existence of a function
  // drawable.markDirtyRadius() that will indicate to the drawable that the radius has changed.
  // (scenery-internal)
  //
  // Should be overridden by subtypes.

  /**
   * Creates a Node with options.
   *
   * NOTE: Directly created Nodes (not of any subtype, but created with "new Node( ... )") are generally used as
   *       containers, which can hold other Nodes, subtypes of Node that can display things.
   *
   * Node and its subtypes generally have the last constructor parameter reserved for the 'options' object. This is a
   * key-value map that specifies relevant options that are used by Node and subtypes.
   *
   * For example, one of Node's options is bottom, and one of Circle's options is radius. When a circle is created:
   *   var circle = new Circle( {
   *     radius: 10,
   *     bottom: 200
   *   } );
   * This will create a Circle, set its radius (by executing circle.radius = 10, which uses circle.setRadius()), and
   * then will align the bottom of the circle along y=200 (by executing circle.bottom = 200, which uses
   * node.setBottom()).
   *
   * The options are executed in the order specified by each types _mutatorKeys property.
   *
   * The options object is currently not checked to see whether there are property (key) names that are not used, so it
   * is currently legal to do "new Node( { fork_kitchen_spoon: 5 } )".
   *
   * Usually, an option (e.g. 'visible'), when used in a constructor or mutate() call, will directly use the ES5 setter
   * for that property (e.g. node.visible = ...), which generally forwards to a non-ES5 setter function
   * (e.g. node.setVisible( ... )) that is responsible for the behavior. Documentation is generally on these methods
   * (e.g. setVisible), although some methods may be dynamically created to avoid verbosity (like node.leftTop).
   *
   * Sometimes, options invoke a function instead (e.g. 'scale') because the verb and noun are identical. In this case,
   * instead of setting the setter (node.scale = ..., which would override the function), it will instead call
   * the method directly (e.g. node.scale( ... )).
   */
  constructor(options) {
    super();
    this._id = globalIdCounter++;
    this._instances = [];
    this._rootedDisplays = [];
    this._drawables = [];
    this._visibleProperty = new TinyForwardingProperty(DEFAULT_OPTIONS.visible, DEFAULT_OPTIONS.phetioVisiblePropertyInstrumented, this.onVisiblePropertyChange.bind(this));
    this.opacityProperty = new TinyProperty(DEFAULT_OPTIONS.opacity, this.onOpacityPropertyChange.bind(this));
    this.disabledOpacityProperty = new TinyProperty(DEFAULT_OPTIONS.disabledOpacity, this.onDisabledOpacityPropertyChange.bind(this));
    this._pickableProperty = new TinyForwardingProperty(DEFAULT_OPTIONS.pickable, false, this.onPickablePropertyChange.bind(this));
    this._enabledProperty = new TinyForwardingProperty(DEFAULT_OPTIONS.enabled, DEFAULT_OPTIONS.phetioEnabledPropertyInstrumented, this.onEnabledPropertyChange.bind(this));
    this._inputEnabledProperty = new TinyForwardingProperty(DEFAULT_OPTIONS.inputEnabled, DEFAULT_OPTIONS.phetioInputEnabledPropertyInstrumented);
    this.clipAreaProperty = new TinyProperty(DEFAULT_OPTIONS.clipArea);
    this.voicingVisibleProperty = new TinyProperty(true);
    this._mouseArea = DEFAULT_OPTIONS.mouseArea;
    this._touchArea = DEFAULT_OPTIONS.touchArea;
    this._cursor = DEFAULT_OPTIONS.cursor;
    this._children = [];
    this._parents = [];
    this._transformBounds = DEFAULT_OPTIONS.transformBounds;
    this._transform = new Transform3();
    this._transformListener = this.onTransformChange.bind(this);
    this._transform.changeEmitter.addListener(this._transformListener);
    this._maxWidth = DEFAULT_OPTIONS.maxWidth;
    this._maxHeight = DEFAULT_OPTIONS.maxHeight;
    this._appliedScaleFactor = 1;
    this._inputListeners = [];
    this._renderer = DEFAULT_INTERNAL_RENDERER;
    this._usesOpacity = DEFAULT_OPTIONS.usesOpacity;
    this._layerSplit = DEFAULT_OPTIONS.layerSplit;
    this._cssTransform = DEFAULT_OPTIONS.cssTransform;
    this._excludeInvisible = DEFAULT_OPTIONS.excludeInvisible;
    this._webglScale = DEFAULT_OPTIONS.webglScale;
    this._preventFit = DEFAULT_OPTIONS.preventFit;
    this.inputEnabledProperty.lazyLink(this.pdomBoundInputEnabledListener);

    // Add listener count change notifications into these Properties, since we need to know when their number of listeners
    // changes dynamically.
    const boundsListenersAddedOrRemovedListener = this.onBoundsListenersAddedOrRemoved.bind(this);
    const boundsInvalidationListener = this.validateBounds.bind(this);
    const selfBoundsInvalidationListener = this.validateSelfBounds.bind(this);
    this.boundsProperty = new TinyStaticProperty(Bounds2.NOTHING.copy(), boundsInvalidationListener);
    this.boundsProperty.changeCount = boundsListenersAddedOrRemovedListener;
    this.localBoundsProperty = new TinyStaticProperty(Bounds2.NOTHING.copy(), boundsInvalidationListener);
    this.localBoundsProperty.changeCount = boundsListenersAddedOrRemovedListener;
    this.childBoundsProperty = new TinyStaticProperty(Bounds2.NOTHING.copy(), boundsInvalidationListener);
    this.childBoundsProperty.changeCount = boundsListenersAddedOrRemovedListener;
    this.selfBoundsProperty = new TinyStaticProperty(Bounds2.NOTHING.copy(), selfBoundsInvalidationListener);
    this._localBoundsOverridden = false;
    this._excludeInvisibleChildrenFromBounds = false;
    this._layoutOptions = null;
    this._boundsDirty = true;
    this._localBoundsDirty = true;
    this._selfBoundsDirty = true;
    this._childBoundsDirty = true;
    if (assert) {
      // for assertions later to ensure that we are using the same Bounds2 copies as before
      this._originalBounds = this.boundsProperty._value;
      this._originalLocalBounds = this.localBoundsProperty._value;
      this._originalSelfBounds = this.selfBoundsProperty._value;
      this._originalChildBounds = this.childBoundsProperty._value;
    }
    this._filters = [];
    this._rendererBitmask = Renderer.bitmaskNodeDefault;
    this._rendererSummary = new RendererSummary(this);
    this._boundsEventCount = 0;
    this._boundsEventSelfCount = 0;
    this._picker = new Picker(this);
    this._isGettingRemovedFromParent = false;
    if (options) {
      this.mutate(options);
    }
  }

  /**
   * Inserts a child Node at a specific index.
   *
   * node.insertChild( 0, childNode ) will insert the child into the beginning of the children array (on the bottom
   * visually).
   *
   * node.insertChild( node.children.length, childNode ) is equivalent to node.addChild( childNode ), and appends it
   * to the end (top visually) of the children array. It is recommended to use node.addChild when possible.
   *
   * NOTE: overridden by Leaf for some subtypes
   *
   * @param index - Index where the inserted child Node will be after this operation.
   * @param node - The new child to insert.
   * @param [isComposite] - (scenery-internal) If true, the childrenChanged event will not be sent out.
   */
  insertChild(index, node, isComposite) {
    assert && assert(node !== null && node !== undefined, 'insertChild cannot insert a null/undefined child');
    assert && assert(!_.includes(this._children, node), 'Parent already contains child');
    assert && assert(node !== this, 'Cannot add self as a child');
    assert && assert(node._parents !== null, 'Tried to insert a disposed child node?');
    assert && assert(!node.isDisposed, 'Tried to insert a disposed Node');

    // needs to be early to prevent re-entrant children modifications
    this._picker.onInsertChild(node);
    this.changeBoundsEventCount(node._boundsEventCount > 0 ? 1 : 0);
    this._rendererSummary.summaryChange(RendererSummary.bitmaskAll, node._rendererSummary.bitmask);
    node._parents.push(this);
    if (assert && window.phet?.chipper?.queryParameters && isFinite(phet.chipper.queryParameters.parentLimit)) {
      const parentCount = node._parents.length;
      if (maxParentCount < parentCount) {
        maxParentCount = parentCount;
        console.log(`Max Node parents: ${maxParentCount}`);
        assert(maxParentCount <= phet.chipper.queryParameters.parentLimit, `parent count of ${maxParentCount} above ?parentLimit=${phet.chipper.queryParameters.parentLimit}`);
      }
    }
    this._children.splice(index, 0, node);
    if (assert && window.phet?.chipper?.queryParameters && isFinite(phet.chipper.queryParameters.childLimit)) {
      const childCount = this._children.length;
      if (maxChildCount < childCount) {
        maxChildCount = childCount;
        console.log(`Max Node children: ${maxChildCount}`);
        assert(maxChildCount <= phet.chipper.queryParameters.childLimit, `child count of ${maxChildCount} above ?childLimit=${phet.chipper.queryParameters.childLimit}`);
      }
    }

    // If this added subtree contains PDOM content, we need to notify any relevant displays
    if (!node._rendererSummary.hasNoPDOM()) {
      this.onPDOMAddChild(node);
    }
    node.invalidateBounds();

    // like calling this.invalidateBounds(), but we already marked all ancestors with dirty child bounds
    this._boundsDirty = true;
    this.childInsertedEmitter.emit(node, index);
    node.parentAddedEmitter.emit(this);
    !isComposite && this.childrenChangedEmitter.emit();
    if (assertSlow) {
      this._picker.audit();
    }
    return this; // allow chaining
  }

  /**
   * Appends a child Node to our list of children.
   *
   * The new child Node will be displayed in front (on top) of all of this node's other children.
   *
   * @param node
   * @param [isComposite] - (scenery-internal) If true, the childrenChanged event will not be sent out.
   */
  addChild(node, isComposite) {
    this.insertChild(this._children.length, node, isComposite);
    return this; // allow chaining
  }

  /**
   * Removes a child Node from our list of children, see http://phetsims.github.io/scenery/doc/#node-removeChild
   * Will fail an assertion if the Node is not currently one of our children
   *
   * @param node
   * @param [isComposite] - (scenery-internal) If true, the childrenChanged event will not be sent out.
   */
  removeChild(node, isComposite) {
    assert && assert(node && node instanceof Node, 'Need to call node.removeChild() with a Node.');
    assert && assert(this.hasChild(node), 'Attempted to removeChild with a node that was not a child.');
    const indexOfChild = _.indexOf(this._children, node);
    this.removeChildWithIndex(node, indexOfChild, isComposite);
    return this; // allow chaining
  }

  /**
   * Removes a child Node at a specific index (node.children[ index ]) from our list of children.
   * Will fail if the index is out of bounds.
   *
   * @param index
   * @param [isComposite] - (scenery-internal) If true, the childrenChanged event will not be sent out.
   */
  removeChildAt(index, isComposite) {
    assert && assert(index >= 0);
    assert && assert(index < this._children.length);
    const node = this._children[index];
    this.removeChildWithIndex(node, index, isComposite);
    return this; // allow chaining
  }

  /**
   * Internal method for removing a Node (always has the Node and index).
   *
   * NOTE: overridden by Leaf for some subtypes
   *
   * @param node - The child node to remove from this Node (it's parent)
   * @param indexOfChild - Should satisfy this.children[ indexOfChild ] === node
   * @param [isComposite] - (scenery-internal) If true, the childrenChanged event will not be sent out.
   */
  removeChildWithIndex(node, indexOfChild, isComposite) {
    assert && assert(node && node instanceof Node, 'Need to call node.removeChildWithIndex() with a Node.');
    assert && assert(this.hasChild(node), 'Attempted to removeChild with a node that was not a child.');
    assert && assert(this._children[indexOfChild] === node, 'Incorrect index for removeChildWithIndex');
    assert && assert(node._parents !== null, 'Tried to remove a disposed child node?');
    const indexOfParent = _.indexOf(node._parents, this);
    node._isGettingRemovedFromParent = true;

    // If this added subtree contains PDOM content, we need to notify any relevant displays
    // NOTE: Potentially removes bounds listeners here!
    if (!node._rendererSummary.hasNoPDOM()) {
      this.onPDOMRemoveChild(node);
    }

    // needs to be early to prevent re-entrant children modifications
    this._picker.onRemoveChild(node);
    this.changeBoundsEventCount(node._boundsEventCount > 0 ? -1 : 0);
    this._rendererSummary.summaryChange(node._rendererSummary.bitmask, RendererSummary.bitmaskAll);
    node._parents.splice(indexOfParent, 1);
    this._children.splice(indexOfChild, 1);
    node._isGettingRemovedFromParent = false; // It is "complete"

    this.invalidateBounds();
    this._childBoundsDirty = true; // force recomputation of child bounds after removing a child

    this.childRemovedEmitter.emit(node, indexOfChild);
    node.parentRemovedEmitter.emit(this);
    !isComposite && this.childrenChangedEmitter.emit();
    if (assertSlow) {
      this._picker.audit();
    }
  }

  /**
   * If a child is not at the given index, it is moved to the given index. This reorders the children of this Node so
   * that `this.children[ index ] === node`.
   *
   * @param node - The child Node to move in the order
   * @param index - The desired index (into the children array) of the child.
   */
  moveChildToIndex(node, index) {
    assert && assert(this.hasChild(node), 'Attempted to moveChildToIndex with a node that was not a child.');
    assert && assert(index % 1 === 0 && index >= 0 && index < this._children.length, `Invalid index: ${index}`);
    const currentIndex = this.indexOfChild(node);
    if (this._children[index] !== node) {
      // Apply the actual children change
      this._children.splice(currentIndex, 1);
      this._children.splice(index, 0, node);
      if (!this._rendererSummary.hasNoPDOM()) {
        this.onPDOMReorderedChildren();
      }
      this.childrenReorderedEmitter.emit(Math.min(currentIndex, index), Math.max(currentIndex, index));
      this.childrenChangedEmitter.emit();
    }
    return this;
  }

  /**
   * Removes all children from this Node.
   */
  removeAllChildren() {
    this.setChildren([]);
    return this; // allow chaining
  }

  /**
   * Sets the children of the Node to be equivalent to the passed-in array of Nodes.
   *
   * NOTE: Meant to be overridden in some cases
   */
  setChildren(children) {
    // The implementation is split into basically three stages:
    // 1. Remove current children that are not in the new children array.
    // 2. Reorder children that exist both before/after the change.
    // 3. Insert in new children

    const beforeOnly = []; // Will hold all nodes that will be removed.
    const afterOnly = []; // Will hold all nodes that will be "new" children (added)
    const inBoth = []; // Child nodes that "stay". Will be ordered for the "after" case.
    let i;

    // Compute what things were added, removed, or stay.
    arrayDifference(children, this._children, afterOnly, beforeOnly, inBoth);

    // Remove any nodes that are not in the new children.
    for (i = beforeOnly.length - 1; i >= 0; i--) {
      this.removeChild(beforeOnly[i], true);
    }
    assert && assert(this._children.length === inBoth.length, 'Removing children should not have triggered other children changes');

    // Handle the main reordering (of nodes that "stay")
    let minChangeIndex = -1; // What is the smallest index where this._children[ index ] !== inBoth[ index ]
    let maxChangeIndex = -1; // What is the largest index where this._children[ index ] !== inBoth[ index ]
    for (i = 0; i < inBoth.length; i++) {
      const desired = inBoth[i];
      if (this._children[i] !== desired) {
        this._children[i] = desired;
        if (minChangeIndex === -1) {
          minChangeIndex = i;
        }
        maxChangeIndex = i;
      }
    }
    // If our minChangeIndex is still -1, then none of those nodes that "stay" were reordered. It's important to check
    // for this case, so that `node.children = node.children` is effectively a no-op performance-wise.
    const hasReorderingChange = minChangeIndex !== -1;

    // Immediate consequences/updates from reordering
    if (hasReorderingChange) {
      if (!this._rendererSummary.hasNoPDOM()) {
        this.onPDOMReorderedChildren();
      }
      this.childrenReorderedEmitter.emit(minChangeIndex, maxChangeIndex);
    }

    // Add in "new" children.
    // Scan through the "ending" children indices, adding in things that were in the "afterOnly" part. This scan is
    // done through the children array instead of the afterOnly array (as determining the index in children would
    // then be quadratic in time, which would be unacceptable here). At this point, a forward scan should be
    // sufficient to insert in-place, and should move the least amount of nodes in the array.
    if (afterOnly.length) {
      let afterIndex = 0;
      let after = afterOnly[afterIndex];
      for (i = 0; i < children.length; i++) {
        if (children[i] === after) {
          this.insertChild(i, after, true);
          after = afterOnly[++afterIndex];
        }
      }
    }

    // If we had any changes, send the generic "changed" event.
    if (beforeOnly.length !== 0 || afterOnly.length !== 0 || hasReorderingChange) {
      this.childrenChangedEmitter.emit();
    }

    // Sanity checks to make sure our resulting children array is correct.
    if (assert) {
      for (let j = 0; j < this._children.length; j++) {
        assert(children[j] === this._children[j], 'Incorrect child after setChildren, possibly a reentrancy issue');
      }
    }

    // allow chaining
    return this;
  }

  /**
   * See setChildren() for more information
   */
  set children(value) {
    this.setChildren(value);
  }

  /**
   * See getChildren() for more information
   */
  get children() {
    return this.getChildren();
  }

  /**
   * Returns a defensive copy of the array of direct children of this node, ordered by what is in front (nodes at
   * the end of the array are in front of nodes at the start).
   *
   * Making changes to the returned result will not affect this node's children.
   */
  getChildren() {
    return this._children.slice(0); // create a defensive copy
  }

  /**
   * Returns a count of children, without needing to make a defensive copy.
   */
  getChildrenCount() {
    return this._children.length;
  }

  /**
   * Returns a defensive copy of our parents. This is an array of parent nodes that is returned in no particular
   * order (as order is not important here).
   *
   * NOTE: Modifying the returned array will not in any way modify this node's parents.
   */
  getParents() {
    return this._parents.slice(0); // create a defensive copy
  }

  /**
   * See getParents() for more information
   */
  get parents() {
    return this.getParents();
  }

  /**
   * Returns a single parent if it exists, otherwise null (no parents), or an assertion failure (multiple parents).
   */
  getParent() {
    assert && assert(this._parents.length <= 1, 'Cannot call getParent on a node with multiple parents');
    return this._parents.length ? this._parents[0] : null;
  }

  /**
   * See getParent() for more information
   */
  get parent() {
    return this.getParent();
  }

  /**
   * Gets the child at a specific index into the children array.
   */
  getChildAt(index) {
    return this._children[index];
  }

  /**
   * Finds the index of a parent Node in the parents array.
   *
   * @param parent - Should be a parent of this node.
   * @returns - An index such that this.parents[ index ] === parent
   */
  indexOfParent(parent) {
    return _.indexOf(this._parents, parent);
  }

  /**
   * Finds the index of a child Node in the children array.
   *
   * @param child - Should be a child of this node.
   * @returns - An index such that this.children[ index ] === child
   */
  indexOfChild(child) {
    return _.indexOf(this._children, child);
  }

  /**
   * Moves this Node to the front (end) of all of its parents children array.
   */
  moveToFront() {
    _.each(this.parents, parent => parent.moveChildToFront(this));
    return this; // allow chaining
  }

  /**
   * Moves one of our children to the front (end) of our children array.
   *
   * @param child - Our child to move to the front.
   */
  moveChildToFront(child) {
    return this.moveChildToIndex(child, this._children.length - 1);
  }

  /**
   * Move this node one index forward in each of its parents.  If the Node is already at the front, this is a no-op.
   */
  moveForward() {
    this.parents.forEach(parent => parent.moveChildForward(this));
    return this; // chaining
  }

  /**
   * Moves the specified child forward by one index.  If the child is already at the front, this is a no-op.
   */
  moveChildForward(child) {
    const index = this.indexOfChild(child);
    if (index < this.getChildrenCount() - 1) {
      this.moveChildToIndex(child, index + 1);
    }
    return this; // chaining
  }

  /**
   * Move this node one index backward in each of its parents.  If the Node is already at the back, this is a no-op.
   */
  moveBackward() {
    this.parents.forEach(parent => parent.moveChildBackward(this));
    return this; // chaining
  }

  /**
   * Moves the specified child forward by one index.  If the child is already at the back, this is a no-op.
   */
  moveChildBackward(child) {
    const index = this.indexOfChild(child);
    if (index > 0) {
      this.moveChildToIndex(child, index - 1);
    }
    return this; // chaining
  }

  /**
   * Moves this Node to the back (front) of all of its parents children array.
   */
  moveToBack() {
    _.each(this.parents, parent => parent.moveChildToBack(this));
    return this; // allow chaining
  }

  /**
   * Moves one of our children to the back (front) of our children array.
   *
   * @param child - Our child to move to the back.
   */
  moveChildToBack(child) {
    return this.moveChildToIndex(child, 0);
  }

  /**
   * Replace a child in this node's children array with another node. If the old child had DOM focus and
   * the new child is focusable, the new child will receive focus after it is added.
   */
  replaceChild(oldChild, newChild) {
    assert && assert(this.hasChild(oldChild), 'Attempted to replace a node that was not a child.');

    // information that needs to be restored
    const index = this.indexOfChild(oldChild);
    const oldChildFocused = oldChild.focused;
    this.removeChild(oldChild, true);
    this.insertChild(index, newChild, true);
    this.childrenChangedEmitter.emit();
    if (oldChildFocused && newChild.focusable) {
      newChild.focus();
    }
    return this; // allow chaining
  }

  /**
   * Removes this Node from all of its parents.
   */
  detach() {
    _.each(this._parents.slice(0), parent => parent.removeChild(this));
    return this; // allow chaining
  }

  /**
   * Update our event count, usually by 1 or -1. See documentation on _boundsEventCount in constructor.
   *
   * @param n - How to increment/decrement the bounds event listener count
   */
  changeBoundsEventCount(n) {
    if (n !== 0) {
      const zeroBefore = this._boundsEventCount === 0;
      this._boundsEventCount += n;
      assert && assert(this._boundsEventCount >= 0, 'subtree bounds event count should be guaranteed to be >= 0');
      const zeroAfter = this._boundsEventCount === 0;
      if (zeroBefore !== zeroAfter) {
        // parents will only have their count
        const parentDelta = zeroBefore ? 1 : -1;
        const len = this._parents.length;
        for (let i = 0; i < len; i++) {
          this._parents[i].changeBoundsEventCount(parentDelta);
        }
      }
    }
  }

  /**
   * Ensures that the cached selfBounds of this Node is accurate. Returns true if any sort of dirty flag was set
   * before this was called.
   *
   * @returns - Was the self-bounds potentially updated?
   */
  validateSelfBounds() {
    // validate bounds of ourself if necessary
    if (this._selfBoundsDirty) {
      const oldSelfBounds = scratchBounds2.set(this.selfBoundsProperty._value);

      // Rely on an overloadable method to accomplish computing our self bounds. This should update
      // this.selfBounds itself, returning whether it was actually changed. If it didn't change, we don't want to
      // send a 'selfBounds' event.
      const didSelfBoundsChange = this.updateSelfBounds();
      this._selfBoundsDirty = false;
      if (didSelfBoundsChange) {
        this.selfBoundsProperty.notifyListeners(oldSelfBounds);
      }
      return true;
    }
    return false;
  }

  /**
   * Ensures that cached bounds stored on this Node (and all children) are accurate. Returns true if any sort of dirty
   * flag was set before this was called.
   *
   * @returns - Was something potentially updated?
   */
  validateBounds() {
    sceneryLog && sceneryLog.bounds && sceneryLog.bounds(`validateBounds #${this._id}`);
    sceneryLog && sceneryLog.bounds && sceneryLog.push();
    let i;
    const notificationThreshold = 1e-13;
    let wasDirtyBefore = this.validateSelfBounds();

    // We're going to directly mutate these instances
    const ourChildBounds = this.childBoundsProperty._value;
    const ourLocalBounds = this.localBoundsProperty._value;
    const ourSelfBounds = this.selfBoundsProperty._value;
    const ourBounds = this.boundsProperty._value;

    // validate bounds of children if necessary
    if (this._childBoundsDirty) {
      wasDirtyBefore = true;
      sceneryLog && sceneryLog.bounds && sceneryLog.bounds('childBounds dirty');

      // have each child validate their own bounds
      i = this._children.length;
      while (i--) {
        const child = this._children[i];

        // Reentrancy might cause the child to be removed
        if (child) {
          child.validateBounds();
        }
      }

      // and recompute our childBounds
      const oldChildBounds = scratchBounds2.set(ourChildBounds); // store old value in a temporary Bounds2
      ourChildBounds.set(Bounds2.NOTHING); // initialize to a value that can be unioned with includeBounds()

      i = this._children.length;
      while (i--) {
        const child = this._children[i];

        // Reentrancy might cause the child to be removed
        if (child && !this._excludeInvisibleChildrenFromBounds || child.isVisible()) {
          ourChildBounds.includeBounds(child.bounds);
        }
      }

      // run this before firing the event
      this._childBoundsDirty = false;
      sceneryLog && sceneryLog.bounds && sceneryLog.bounds(`childBounds: ${ourChildBounds}`);
      if (!ourChildBounds.equals(oldChildBounds)) {
        // notifies only on an actual change
        if (!ourChildBounds.equalsEpsilon(oldChildBounds, notificationThreshold)) {
          this.childBoundsProperty.notifyListeners(oldChildBounds); // RE-ENTRANT CALL HERE, it will validateBounds()
        }
      }

      // WARNING: Think twice before adding code here below the listener notification. The notifyListeners() call can
      // trigger re-entrancy, so this function needs to work when that happens. DO NOT set things based on local
      // variables here.
    }
    if (this._localBoundsDirty) {
      wasDirtyBefore = true;
      sceneryLog && sceneryLog.bounds && sceneryLog.bounds('localBounds dirty');
      this._localBoundsDirty = false; // we only need this to set local bounds as dirty

      const oldLocalBounds = scratchBounds2.set(ourLocalBounds); // store old value in a temporary Bounds2

      // Only adjust the local bounds if it is not overridden
      if (!this._localBoundsOverridden) {
        // local bounds are a union between our self bounds and child bounds
        ourLocalBounds.set(ourSelfBounds).includeBounds(ourChildBounds);

        // apply clipping to the bounds if we have a clip area (all done in the local coordinate frame)
        const clipArea = this.clipArea;
        if (clipArea) {
          ourLocalBounds.constrainBounds(clipArea.bounds);
        }
      }
      sceneryLog && sceneryLog.bounds && sceneryLog.bounds(`localBounds: ${ourLocalBounds}`);

      // NOTE: we need to update max dimensions still even if we are setting overridden localBounds
      // adjust our transform to match maximum bounds if necessary on a local bounds change
      if (this._maxWidth !== null || this._maxHeight !== null) {
        // needs to run before notifications below, otherwise reentrancy that hits this codepath will have its
        // updateMaxDimension overridden by the eventual original function call, with the now-incorrect local bounds.
        // See https://github.com/phetsims/joist/issues/725
        this.updateMaxDimension(ourLocalBounds);
      }
      if (!ourLocalBounds.equals(oldLocalBounds)) {
        // sanity check, see https://github.com/phetsims/scenery/issues/1071, we're running this before the localBounds
        // listeners are notified, to support limited re-entrance.
        this._boundsDirty = true;
        if (!ourLocalBounds.equalsEpsilon(oldLocalBounds, notificationThreshold)) {
          this.localBoundsProperty.notifyListeners(oldLocalBounds); // RE-ENTRANT CALL HERE, it will validateBounds()
        }
      }

      // WARNING: Think twice before adding code here below the listener notification. The notifyListeners() call can
      // trigger re-entrancy, so this function needs to work when that happens. DO NOT set things based on local
      // variables here.
    }

    // TODO: layout here? https://github.com/phetsims/scenery/issues/1581

    if (this._boundsDirty) {
      wasDirtyBefore = true;
      sceneryLog && sceneryLog.bounds && sceneryLog.bounds('bounds dirty');

      // run this before firing the event
      this._boundsDirty = false;
      const oldBounds = scratchBounds2.set(ourBounds); // store old value in a temporary Bounds2

      // no need to do the more expensive bounds transformation if we are still axis-aligned
      if (this._transformBounds && !this._transform.getMatrix().isAxisAligned()) {
        // mutates the matrix and bounds during recursion

        const matrix = scratchMatrix3.set(this.getMatrix()); // calls below mutate this matrix
        ourBounds.set(Bounds2.NOTHING);
        // Include each painted self individually, transformed with the exact transform matrix.
        // This is expensive, as we have to do 2 matrix transforms for every descendant.
        this._includeTransformedSubtreeBounds(matrix, ourBounds); // self and children

        const clipArea = this.clipArea;
        if (clipArea) {
          ourBounds.constrainBounds(clipArea.getBoundsWithTransform(matrix));
        }
      } else {
        // converts local to parent bounds. mutable methods used to minimize number of created bounds instances
        // (we create one so we don't change references to the old one)
        ourBounds.set(ourLocalBounds);
        this.transformBoundsFromLocalToParent(ourBounds);
      }
      sceneryLog && sceneryLog.bounds && sceneryLog.bounds(`bounds: ${ourBounds}`);
      if (!ourBounds.equals(oldBounds)) {
        // if we have a bounds change, we need to invalidate our parents so they can be recomputed
        i = this._parents.length;
        while (i--) {
          this._parents[i].invalidateBounds();
        }

        // TODO: consider changing to parameter object (that may be a problem for the GC overhead) https://github.com/phetsims/scenery/issues/1581
        if (!ourBounds.equalsEpsilon(oldBounds, notificationThreshold)) {
          this.boundsProperty.notifyListeners(oldBounds); // RE-ENTRANT CALL HERE, it will validateBounds()
        }
      }

      // WARNING: Think twice before adding code here below the listener notification. The notifyListeners() call can
      // trigger re-entrancy, so this function needs to work when that happens. DO NOT set things based on local
      // variables here.
    }

    // if there were side-effects, run the validation again until we are clean
    if (this._childBoundsDirty || this._boundsDirty) {
      sceneryLog && sceneryLog.bounds && sceneryLog.bounds('revalidation');

      // TODO: if there are side-effects in listeners, this could overflow the stack. we should report an error https://github.com/phetsims/scenery/issues/1581
      // instead of locking up
      this.validateBounds(); // RE-ENTRANT CALL HERE, it will validateBounds()
    }
    if (assert) {
      assert(this._originalBounds === this.boundsProperty._value, 'Reference for bounds changed!');
      assert(this._originalLocalBounds === this.localBoundsProperty._value, 'Reference for localBounds changed!');
      assert(this._originalSelfBounds === this.selfBoundsProperty._value, 'Reference for selfBounds changed!');
      assert(this._originalChildBounds === this.childBoundsProperty._value, 'Reference for childBounds changed!');
    }

    // double-check that all of our bounds handling has been accurate
    if (assertSlow) {
      // new scope for safety
      (() => {
        const epsilon = 0.000001;
        const childBounds = Bounds2.NOTHING.copy();
        _.each(this._children, child => {
          if (!this._excludeInvisibleChildrenFromBounds || child.isVisible()) {
            childBounds.includeBounds(child.boundsProperty._value);
          }
        });
        let localBounds = this.selfBoundsProperty._value.union(childBounds);
        const clipArea = this.clipArea;
        if (clipArea) {
          localBounds = localBounds.intersection(clipArea.bounds);
        }
        const fullBounds = this.localToParentBounds(localBounds);
        assertSlow && assertSlow(this.childBoundsProperty._value.equalsEpsilon(childBounds, epsilon), `Child bounds mismatch after validateBounds: ${this.childBoundsProperty._value.toString()}, expected: ${childBounds.toString()}`);
        assertSlow && assertSlow(this._localBoundsOverridden || this._transformBounds || this.boundsProperty._value.equalsEpsilon(fullBounds, epsilon), `Bounds mismatch after validateBounds: ${this.boundsProperty._value.toString()}, expected: ${fullBounds.toString()}. This could have happened if a bounds instance owned by a Node` + ' was directly mutated (e.g. bounds.erode())');
      })();
    }
    sceneryLog && sceneryLog.bounds && sceneryLog.pop();
    return wasDirtyBefore; // whether any dirty flags were set
  }

  /**
   * Recursion for accurate transformed bounds handling. Mutates bounds with the added bounds.
   * Mutates the matrix (parameter), but mutates it back to the starting point (within floating-point error).
   */
  _includeTransformedSubtreeBounds(matrix, bounds) {
    if (!this.selfBounds.isEmpty()) {
      bounds.includeBounds(this.getTransformedSelfBounds(matrix));
    }
    const numChildren = this._children.length;
    for (let i = 0; i < numChildren; i++) {
      const child = this._children[i];
      matrix.multiplyMatrix(child._transform.getMatrix());
      child._includeTransformedSubtreeBounds(matrix, bounds);
      matrix.multiplyMatrix(child._transform.getInverse());
    }
    return bounds;
  }

  /**
   * Traverses this subtree and validates bounds only for subtrees that have bounds listeners (trying to exclude as
   * much as possible for performance). This is done so that we can do the minimum bounds validation to prevent any
   * bounds listeners from being triggered in further validateBounds() calls without other Node changes being done.
   * This is required for Display's atomic (non-reentrant) updateDisplay(), so that we don't accidentally trigger
   * bounds listeners while computing bounds during updateDisplay(). (scenery-internal)
   *
   * NOTE: this should pass by (ignore) any overridden localBounds, to trigger listeners below.
   */
  validateWatchedBounds() {
    // Since a bounds listener on one of the roots could invalidate bounds on the other, we need to keep running this
    // until they are all clean. Otherwise, side-effects could occur from bounds validations
    // TODO: consider a way to prevent infinite loops here that occur due to bounds listeners triggering cycles https://github.com/phetsims/scenery/issues/1581
    while (this.watchedBoundsScan()) {
      // do nothing
    }
  }

  /**
   * Recursive function for validateWatchedBounds. Returned whether any validateBounds() returned true (means we have
   * to traverse again) - scenery-internal
   *
   * @returns - Whether there could have been any changes.
   */
  watchedBoundsScan() {
    if (this._boundsEventSelfCount !== 0) {
      // we are a root that should be validated. return whether we updated anything
      return this.validateBounds();
    } else if (this._boundsEventCount > 0 && this._childBoundsDirty) {
      // descendants have watched bounds, traverse!
      let changed = false;
      const numChildren = this._children.length;
      for (let i = 0; i < numChildren; i++) {
        changed = this._children[i].watchedBoundsScan() || changed;
      }
      return changed;
    } else {
      // if _boundsEventCount is zero, no bounds are watched below us (don't traverse), and it wasn't changed
      return false;
    }
  }

  /**
   * Marks the bounds of this Node as invalid, so they are recomputed before being accessed again.
   */
  invalidateBounds() {
    // TODO: sometimes we won't need to invalidate local bounds! it's not too much of a hassle though? https://github.com/phetsims/scenery/issues/1581
    this._boundsDirty = true;
    this._localBoundsDirty = true;

    // and set flags for all ancestors
    let i = this._parents.length;
    while (i--) {
      this._parents[i].invalidateChildBounds();
    }
  }

  /**
   * Recursively tag all ancestors with _childBoundsDirty (scenery-internal)
   */
  invalidateChildBounds() {
    // don't bother updating if we've already been tagged
    if (!this._childBoundsDirty) {
      this._childBoundsDirty = true;
      this._localBoundsDirty = true;
      let i = this._parents.length;
      while (i--) {
        this._parents[i].invalidateChildBounds();
      }
    }
  }

  /**
   * Should be called to notify that our selfBounds needs to change to this new value.
   */
  invalidateSelf(newSelfBounds) {
    assert && assert(newSelfBounds === undefined || newSelfBounds instanceof Bounds2, 'invalidateSelf\'s newSelfBounds, if provided, needs to be Bounds2');
    const ourSelfBounds = this.selfBoundsProperty._value;

    // If no self bounds are provided, rely on the bounds validation to trigger computation (using updateSelfBounds()).
    if (!newSelfBounds) {
      this._selfBoundsDirty = true;
      this.invalidateBounds();
      this._picker.onSelfBoundsDirty();
    }
    // Otherwise, set the self bounds directly
    else {
      assert && assert(newSelfBounds.isEmpty() || newSelfBounds.isFinite(), 'Bounds must be empty or finite in invalidateSelf');

      // Don't recompute the self bounds
      this._selfBoundsDirty = false;

      // if these bounds are different than current self bounds
      if (!ourSelfBounds.equals(newSelfBounds)) {
        const oldSelfBounds = scratchBounds2.set(ourSelfBounds);

        // set repaint flags
        this.invalidateBounds();
        this._picker.onSelfBoundsDirty();

        // record the new bounds
        ourSelfBounds.set(newSelfBounds);

        // fire the event immediately
        this.selfBoundsProperty.notifyListeners(oldSelfBounds);
      }
    }
    if (assertSlow) {
      this._picker.audit();
    }
  }

  /**
   * Meant to be overridden by Node sub-types to compute self bounds (if invalidateSelf() with no arguments was called).
   *
   * @returns - Whether the self bounds changed.
   */
  updateSelfBounds() {
    // The Node implementation (un-overridden) will never change the self bounds (always NOTHING).
    assert && assert(this.selfBoundsProperty._value.equals(Bounds2.NOTHING));
    return false;
  }

  /**
   * Returns whether a Node is a child of this node.
   *
   * @returns - Whether potentialChild is actually our child.
   */
  hasChild(potentialChild) {
    assert && assert(potentialChild && potentialChild instanceof Node, 'hasChild needs to be called with a Node');
    const isOurChild = _.includes(this._children, potentialChild);
    assert && assert(isOurChild === _.includes(potentialChild._parents, this), 'child-parent reference should match parent-child reference');
    return isOurChild;
  }

  /**
   * Returns a Shape that represents the area covered by containsPointSelf.
   */
  getSelfShape() {
    const selfBounds = this.selfBounds;
    if (selfBounds.isEmpty()) {
      return new Shape();
    } else {
      return Shape.bounds(this.selfBounds);
    }
  }

  /**
   * Returns our selfBounds (the bounds for this Node's content in the local coordinates, excluding anything from our
   * children and descendants).
   *
   * NOTE: Do NOT mutate the returned value!
   */
  getSelfBounds() {
    return this.selfBoundsProperty.value;
  }

  /**
   * See getSelfBounds() for more information
   */
  get selfBounds() {
    return this.getSelfBounds();
  }

  /**
   * Returns a bounding box that should contain all self content in the local coordinate frame (our normal self bounds
   * aren't guaranteed this for Text, etc.)
   *
   * Override this to provide different behavior.
   */
  getSafeSelfBounds() {
    return this.selfBoundsProperty.value;
  }

  /**
   * See getSafeSelfBounds() for more information
   */
  get safeSelfBounds() {
    return this.getSafeSelfBounds();
  }

  /**
   * Returns the bounding box that should contain all content of our children in our local coordinate frame. Does not
   * include our "self" bounds.
   *
   * NOTE: Do NOT mutate the returned value!
   */
  getChildBounds() {
    return this.childBoundsProperty.value;
  }

  /**
   * See getChildBounds() for more information
   */
  get childBounds() {
    return this.getChildBounds();
  }

  /**
   * Returns the bounding box that should contain all content of our children AND our self in our local coordinate
   * frame.
   *
   * NOTE: Do NOT mutate the returned value!
   */
  getLocalBounds() {
    return this.localBoundsProperty.value;
  }

  /**
   * See getLocalBounds() for more information
   */
  get localBounds() {
    return this.getLocalBounds();
  }

  /**
   * See setLocalBounds() for more information
   */
  set localBounds(value) {
    this.setLocalBounds(value);
  }
  get localBoundsOverridden() {
    return this._localBoundsOverridden;
  }

  /**
   * Allows overriding the value of localBounds (and thus changing things like 'bounds' that depend on localBounds).
   * If it's set to a non-null value, that value will always be used for localBounds until this function is called
   * again. To revert to having Scenery compute the localBounds, set this to null.  The bounds should not be reduced
   * smaller than the visible bounds on the screen.
   */
  setLocalBounds(localBounds) {
    assert && assert(localBounds === null || localBounds instanceof Bounds2, 'localBounds override should be set to either null or a Bounds2');
    assert && assert(localBounds === null || !isNaN(localBounds.minX), 'minX for localBounds should not be NaN');
    assert && assert(localBounds === null || !isNaN(localBounds.minY), 'minY for localBounds should not be NaN');
    assert && assert(localBounds === null || !isNaN(localBounds.maxX), 'maxX for localBounds should not be NaN');
    assert && assert(localBounds === null || !isNaN(localBounds.maxY), 'maxY for localBounds should not be NaN');
    const ourLocalBounds = this.localBoundsProperty._value;
    const oldLocalBounds = ourLocalBounds.copy();
    if (localBounds === null) {
      // we can just ignore this if we weren't actually overriding local bounds before
      if (this._localBoundsOverridden) {
        this._localBoundsOverridden = false;
        this.localBoundsProperty.notifyListeners(oldLocalBounds);
        this.invalidateBounds();
      }
    } else {
      // just an instance check for now. consider equals() in the future depending on cost
      const changed = !localBounds.equals(ourLocalBounds) || !this._localBoundsOverridden;
      if (changed) {
        ourLocalBounds.set(localBounds);
      }
      if (!this._localBoundsOverridden) {
        this._localBoundsOverridden = true; // NOTE: has to be done before invalidating bounds, since this disables localBounds computation
      }
      if (changed) {
        this.localBoundsProperty.notifyListeners(oldLocalBounds);
        this.invalidateBounds();
      }
    }
    return this; // allow chaining
  }

  /**
   * Meant to be overridden in sub-types that have more accurate bounds determination for when we are transformed.
   * Usually rotation is significant here, so that transformed bounds for non-rectangular shapes will be different.
   */
  getTransformedSelfBounds(matrix) {
    // assume that we take up the entire rectangular bounds by default
    return this.selfBounds.transformed(matrix);
  }

  /**
   * Meant to be overridden in sub-types that have more accurate bounds determination for when we are transformed.
   * Usually rotation is significant here, so that transformed bounds for non-rectangular shapes will be different.
   *
   * This should include the "full" bounds that guarantee everything rendered should be inside (e.g. Text, where the
   * normal bounds may not be sufficient).
   */
  getTransformedSafeSelfBounds(matrix) {
    return this.safeSelfBounds.transformed(matrix);
  }

  /**
   * Returns the visual "safe" bounds that are taken up by this Node and its subtree. Notably, this is essentially the
   * combined effects of the "visible" bounds (i.e. invisible nodes do not contribute to bounds), and "safe" bounds
   * (e.g. Text, where we need a larger bounds area to guarantee there is nothing outside). It also tries to "fit"
   * transformed bounds more tightly, where it will handle rotated Path bounds in an improved way.
   *
   * NOTE: This method is not optimized, and may create garbage and not be the fastest.
   *
   * @param [matrix] - If provided, will return the bounds assuming the content is transformed with the
   *                             given matrix.
   */
  getSafeTransformedVisibleBounds(matrix) {
    const localMatrix = (matrix || Matrix3.IDENTITY).timesMatrix(this.matrix);
    const bounds = Bounds2.NOTHING.copy();
    if (this.visibleProperty.value) {
      if (!this.selfBounds.isEmpty()) {
        bounds.includeBounds(this.getTransformedSafeSelfBounds(localMatrix));
      }
      if (this._children.length) {
        for (let i = 0; i < this._children.length; i++) {
          bounds.includeBounds(this._children[i].getSafeTransformedVisibleBounds(localMatrix));
        }
      }
    }
    return bounds;
  }

  /**
   * See getSafeTransformedVisibleBounds() for more information -- This is called without any initial parameter
   */
  get safeTransformedVisibleBounds() {
    return this.getSafeTransformedVisibleBounds();
  }

  /**
   * Sets the flag that determines whether we will require more accurate (and expensive) bounds computation for this
   * node's transform.
   *
   * If set to false (default), Scenery will get the bounds of content, and then if rotated will determine the on-axis
   * bounds that completely cover the rotated bounds (potentially larger than actual content).
   * If set to true, Scenery will try to get the bounds of the actual rotated/transformed content.
   *
   * A good example of when this is necessary is if there are a bunch of nested children that each have pi/4 rotations.
   *
   * @param transformBounds - Whether accurate transform bounds should be used.
   */
  setTransformBounds(transformBounds) {
    if (this._transformBounds !== transformBounds) {
      this._transformBounds = transformBounds;
      this.invalidateBounds();
    }
    return this; // allow chaining
  }

  /**
   * See setTransformBounds() for more information
   */
  set transformBounds(value) {
    this.setTransformBounds(value);
  }

  /**
   * See getTransformBounds() for more information
   */
  get transformBounds() {
    return this.getTransformBounds();
  }

  /**
   * Returns whether accurate transformation bounds are used in bounds computation (see setTransformBounds).
   */
  getTransformBounds() {
    return this._transformBounds;
  }

  /**
   * Returns the bounding box of this Node and all of its sub-trees (in the "parent" coordinate frame).
   *
   * NOTE: Do NOT mutate the returned value!
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getBounds() {
    return this.boundsProperty.value;
  }

  /**
   * See getBounds() for more information
   */
  get bounds() {
    return this.getBounds();
  }

  /**
   * Like getLocalBounds() in the "local" coordinate frame, but includes only visible nodes.
   */
  getVisibleLocalBounds() {
    // defensive copy, since we use mutable modifications below
    const bounds = this.selfBounds.copy();
    let i = this._children.length;
    while (i--) {
      bounds.includeBounds(this._children[i].getVisibleBounds());
    }

    // apply clipping to the bounds if we have a clip area (all done in the local coordinate frame)
    const clipArea = this.clipArea;
    if (clipArea) {
      bounds.constrainBounds(clipArea.bounds);
    }
    assert && assert(bounds.isFinite() || bounds.isEmpty(), 'Visible bounds should not be infinite');
    return bounds;
  }

  /**
   * See getVisibleLocalBounds() for more information
   */
  get visibleLocalBounds() {
    return this.getVisibleLocalBounds();
  }

  /**
   * Like getBounds() in the "parent" coordinate frame, but includes only visible nodes
   */
  getVisibleBounds() {
    if (this.isVisible()) {
      return this.getVisibleLocalBounds().transform(this.getMatrix());
    } else {
      return Bounds2.NOTHING;
    }
  }

  /**
   * See getVisibleBounds() for more information
   */
  get visibleBounds() {
    return this.getVisibleBounds();
  }

  /**
   * Tests whether the given point is "contained" in this node's subtree (optionally using mouse/touch areas), and if
   * so returns the Trail (rooted at this node) to the top-most (in stacking order) Node that contains the given
   * point.
   *
   * NOTE: This is optimized for the current input system (rather than what gets visually displayed on the screen), so
   * pickability (Node's pickable property, visibility, and the presence of input listeners) all may affect the
   * returned value.
   *
   * For example, hit-testing a simple shape (with no pickability) will return null:
   * > new phet.scenery.Circle( 20 ).hitTest( phet.dot.v2( 0, 0 ) ); // null
   *
   * If the same shape is made to be pickable, it will return a trail:
   * > new phet.scenery.Circle( 20, { pickable: true } ).hitTest( phet.dot.v2( 0, 0 ) );
   * > // returns a Trail with the circle as the only node.
   *
   * It will return the result that is visually stacked on top, so e.g.:
   * > new phet.scenery.Node( {
   * >   pickable: true,
   * >   children: [
   * >     new phet.scenery.Circle( 20 ),
   * >     new phet.scenery.Circle( 15 )
   * >   ]
   * > } ).hitTest( phet.dot.v2( 0, 0 ) ); // returns the "top-most" circle (the one with radius:15).
   *
   * This is used by Scenery's internal input system by calling hitTest on a Display's rootNode with the
   * global-coordinate point.
   *
   * @param point - The point (in the parent coordinate frame) to check against this node's subtree.
   * @param [isMouse] - Whether mouseAreas should be used.
   * @param [isTouch] - Whether touchAreas should be used.
   * @returns - Returns null if the point is not contained in the subtree.
   */
  hitTest(point, isMouse, isTouch) {
    assert && assert(point.isFinite(), 'The point should be a finite Vector2');
    assert && assert(isMouse === undefined || typeof isMouse === 'boolean', 'If isMouse is provided, it should be a boolean');
    assert && assert(isTouch === undefined || typeof isTouch === 'boolean', 'If isTouch is provided, it should be a boolean');
    return this._picker.hitTest(point, !!isMouse, !!isTouch);
  }

  /**
   * Hit-tests what is under the pointer, and returns a {Trail} to that Node (or null if there is no matching node).
   *
   * See hitTest() for more details about what will be returned.
   */
  trailUnderPointer(pointer) {
    return pointer.point === null ? null : this.hitTest(pointer.point, pointer instanceof Mouse, pointer.isTouchLike());
  }

  /**
   * Returns whether a point (in parent coordinates) is contained in this node's sub-tree.
   *
   * See hitTest() for more details about what will be returned.
   *
   * @returns - Whether the point is contained.
   */
  containsPoint(point) {
    return this.hitTest(point) !== null;
  }

  /**
   * Override this for computation of whether a point is inside our self content (defaults to selfBounds check).
   *
   * @param point - Considered to be in the local coordinate frame
   */
  containsPointSelf(point) {
    // if self bounds are not null default to checking self bounds
    return this.selfBounds.containsPoint(point);
  }

  /**
   * Returns whether this node's selfBounds is intersected by the specified bounds.
   *
   * @param bounds - Bounds to test, assumed to be in the local coordinate frame.
   */
  intersectsBoundsSelf(bounds) {
    // if self bounds are not null, child should override this
    return this.selfBounds.intersectsBounds(bounds);
  }

  /**
   * Determine if the Node is a candidate for phet-io autoselect.
   * 1. Invisible things cannot be autoselected
   * 2. Transform the point in the local coordinate frame, so we can test it with the clipArea/children
   * 3. If our point is outside the local-coordinate clipping area, there should be no hit.
   * 4. Note that non-pickable nodes can still be autoselected
   */
  isPhetioMouseHittable(point) {
    // unpickable things cannot be autoselected unless there are descendants that could be potential mouse hits.
    // It is important to opt out of these subtrees to make sure that they don't falsely "suck up" a mouse hit that
    // would otherwise go to a target behind the unpickable Node.
    if (this.pickable === false && !this.isAnyDescendantAPhetioMouseHitTarget()) {
      return false;
    }
    return this.visible && (this.clipArea === null || this.clipArea.containsPoint(this._transform.getInverse().timesVector2(point)));
  }

  /**
   * If you need to know if any Node in a subtree could possibly be a phetio mouse hit target.
   * SR and MK ran performance on this function in CCK:DC and CAV in 6/2023 and there was no noticeable problem.
   */
  isAnyDescendantAPhetioMouseHitTarget() {
    return this.getPhetioMouseHitTarget() !== 'phetioNotSelectable' || _.some(this.children, child => child.isAnyDescendantAPhetioMouseHitTarget());
  }

  /**
   * Used in Studio Autoselect.  Returns a PhET-iO Element (a PhetioObject) if possible, or null if no hit.
   * "phetioNotSelectable" is an intermediate state used to note when a "hit" has occurred, but the hit was on a Node
   * that didn't have a fit target (see PhetioObject.getPhetioMouseHitTarget())
   * A few notes on the implementation:
   * 1. Prefer the leaf most Node that is at the highest z-index in rendering order
   * 2. Pickable:false Nodes don't prune out subtrees if descendents could still be mouse hit targets
   *    (see PhetioObject.getPhetioMouseHitTarget()).
   * 3. First the algorithm finds a Node that is a "hit", and then it tries to find the most fit "target" for that hit.
   *    a. Itself, see  PhetioObject.getPhetioMouseHitTarget()
   *    b. A class defined substitute, Text.getPhetioMouseHitTarget()
   *    c. A sibling that is rendered behind the hit
   *    d. The most recent descendant that is a usable target.
   *
   * Adapted originally from Picker.recursiveHitTest, with specific tweaks needed for PhET-iO instrumentation, display
   * and filtering.
   * @returns - null if no hit occurred
   *          - A PhetioObject if a hit occurred on a Node with a selectable target
   *          - 'phetioNotSelectable' if a hit occurred, but no suitable target was found from that hit (see
   *             PhetioObject.getPhetioMouseHitTarget())
   */
  getPhetioMouseHit(point) {
    if (!this.isPhetioMouseHittable(point)) {
      return null;
    }

    // Transform the point in the local coordinate frame, so we can test it with the clipArea/children
    const localPoint = this._transform.getInverse().timesVector2(point);

    // If any child was hit but returned 'phetioNotSelectable', then that will trigger the "find the best target" portion
    // of the algorithm, moving on from the "find the hit Node" part.
    let childHitWithoutTarget = null;

    // Check children before our "self", since the children are rendered on top.
    // Manual iteration here so we can return directly, and so we can iterate backwards (last node is rendered in front).
    for (let i = this._children.length - 1; i >= 0; i--) {
      // Not necessarily a child of this Node (see getPhetioMouseHitTarget())
      const childTargetHit = this._children[i].getPhetioMouseHit(localPoint);
      if (childTargetHit instanceof PhetioObject) {
        return childTargetHit;
      } else if (childTargetHit === 'phetioNotSelectable') {
        childHitWithoutTarget = true;
      }
      // No hit, so keep iterating to next child
    }
    if (childHitWithoutTarget) {
      return this.getPhetioMouseHitTarget();
    }

    // Tests for mouse hit areas before testing containsPointSelf. If there is a mouseArea, then don't ever check selfBounds.
    if (this._mouseArea) {
      return this._mouseArea.containsPoint(localPoint) ? this.getPhetioMouseHitTarget() : null;
    }

    // Didn't hit our children, so check ourselves as a last resort. Check our selfBounds first, so we can potentially
    // avoid hit-testing the actual object (which may be more expensive).
    if (this.selfBounds.containsPoint(localPoint) && this.containsPointSelf(localPoint)) {
      return this.getPhetioMouseHitTarget();
    }

    // No hit
    return null;
  }

  /**
   * Whether this Node itself is painted (displays something itself). Meant to be overridden.
   */
  isPainted() {
    // Normal nodes don't render anything
    return false;
  }

  /**
   * Whether this Node's selfBounds are considered to be valid (always containing the displayed self content
   * of this node). Meant to be overridden in subtypes when this can change (e.g. Text).
   *
   * If this value would potentially change, please trigger the event 'selfBoundsValid'.
   */
  areSelfBoundsValid() {
    return true;
  }

  /**
   * Returns whether this Node has any parents at all.
   */
  hasParent() {
    return this._parents.length !== 0;
  }

  /**
   * Returns whether this Node has any children at all.
   */
  hasChildren() {
    return this._children.length > 0;
  }

  /**
   * Returns whether a child should be included for layout (if this Node is a layout container).
   */
  isChildIncludedInLayout(child) {
    return child.bounds.isValid() && (!this._excludeInvisibleChildrenFromBounds || child.visible);
  }

  /**
   * Calls the callback on nodes recursively in a depth-first manner.
   */
  walkDepthFirst(callback) {
    callback(this);
    const length = this._children.length;
    for (let i = 0; i < length; i++) {
      this._children[i].walkDepthFirst(callback);
    }
  }

  /**
   * Adds an input listener.
   *
   * See Input.js documentation for information about how event listeners are used.
   *
   * Additionally, the following fields are supported on a listener:
   *
   * - interrupt {function()}: When a pointer is interrupted, it will attempt to call this method on the input listener
   * - cursor {string|null}: If node.cursor is null, any non-null cursor of an input listener will effectively
   *                         "override" it. NOTE: this can be implemented as an es5 getter, if the cursor can change
   */
  addInputListener(listener) {
    assert && assert(!_.includes(this._inputListeners, listener), 'Input listener already registered on this Node');
    assert && assert(listener !== null, 'Input listener cannot be null');
    assert && assert(listener !== undefined, 'Input listener cannot be undefined');

    // don't allow listeners to be added multiple times
    if (!_.includes(this._inputListeners, listener)) {
      this._inputListeners.push(listener);
      this._picker.onAddInputListener();
      if (assertSlow) {
        this._picker.audit();
      }

      // If the listener contains hotkeys, active hotkeys may need to be updated. There is no event
      // for changing input listeners. See hotkeyManager for more information.
      if (listener.hotkeys) {
        hotkeyManager.updateHotkeysFromInputListenerChange(this);
      }
    }
    return this;
  }

  /**
   * Removes an input listener that was previously added with addInputListener.
   */
  removeInputListener(listener) {
    const index = _.indexOf(this._inputListeners, listener);

    // ensure the listener is in our list (ignore assertion for disposal, see https://github.com/phetsims/sun/issues/394)
    assert && assert(this.isDisposed || index >= 0, 'Could not find input listener to remove');
    if (index >= 0) {
      this._inputListeners.splice(index, 1);
      this._picker.onRemoveInputListener();
      if (assertSlow) {
        this._picker.audit();
      }

      // If the listener contains hotkeys, active hotkeys may need to be updated. There is no event
      // for changing input listeners. See hotkeyManager for more information.
      if (listener.hotkeys) {
        hotkeyManager.updateHotkeysFromInputListenerChange(this);
      }
    }
    return this;
  }

  /**
   * Returns whether this input listener is currently listening to this node.
   *
   * More efficient than checking node.inputListeners, as that includes a defensive copy.
   */
  hasInputListener(listener) {
    for (let i = 0; i < this._inputListeners.length; i++) {
      if (this._inputListeners[i] === listener) {
        return true;
      }
    }
    return false;
  }

  /**
   * Interrupts all input listeners that are attached to this node.
   */
  interruptInput() {
    const listenersCopy = this.inputListeners;
    for (let i = 0; i < listenersCopy.length; i++) {
      const listener = listenersCopy[i];
      listener.interrupt && listener.interrupt();
    }
    return this;
  }

  /**
   * Interrupts all input listeners that are attached to either this node, or a descendant node.
   */
  interruptSubtreeInput() {
    this.interruptInput();
    const children = this._children.slice();
    for (let i = 0; i < children.length; i++) {
      children[i].interruptSubtreeInput();
    }
    return this;
  }

  /**
   * Changes the transform of this Node by adding a transform. The default "appends" the transform, so that it will
   * appear to happen to the Node before the rest of the transform would apply, but if "prepended", the rest of the
   * transform would apply first.
   *
   * As an example, if a Node is centered at (0,0) and scaled by 2:
   * translate( 100, 0 ) would cause the center of the Node (in the parent coordinate frame) to be at (200,0).
   * translate( 100, 0, true ) would cause the center of the Node (in the parent coordinate frame) to be at (100,0).
   *
   * Allowed call signatures:
   * translate( x {number}, y {number} )
   * translate( x {number}, y {number}, prependInstead {boolean} )
   * translate( vector {Vector2} )
   * translate( vector {Vector2}, prependInstead {boolean} )
   *
   * @param x - The x coordinate
   * @param y - The y coordinate
   * @param [prependInstead] - Whether the transform should be prepended (defaults to false)
   */

  // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  translate(x, y, prependInstead) {
    // eslint-disable-line @typescript-eslint/explicit-member-accessibility
    if (typeof x === 'number') {
      // translate( x, y, prependInstead )
      assert && assert(isFinite(x), 'x should be a finite number');
      assert && assert(typeof y === 'number' && isFinite(y), 'y should be a finite number');
      if (Math.abs(x) < 1e-12 && Math.abs(y) < 1e-12) {
        return;
      } // bail out if both are zero
      if (prependInstead) {
        this.prependTranslation(x, y);
      } else {
        this.appendMatrix(scratchMatrix3.setToTranslation(x, y));
      }
    } else {
      // translate( vector, prependInstead )
      const vector = x;
      assert && assert(vector.isFinite(), 'translation should be a finite Vector2 if not finite numbers');
      if (!vector.x && !vector.y) {
        return;
      } // bail out if both are zero
      this.translate(vector.x, vector.y, y); // forward to full version
    }
  }

  /**
   * Scales the node's transform. The default "appends" the transform, so that it will
   * appear to happen to the Node before the rest of the transform would apply, but if "prepended", the rest of the
   * transform would apply first.
   *
   * As an example, if a Node is translated to (100,0):
   * scale( 2 ) will leave the Node translated at (100,0), but it will be twice as big around its origin at that location.
   * scale( 2, true ) will shift the Node to (200,0).
   *
   * Allowed call signatures:
   * (s invocation): scale( s {number|Vector2}, [prependInstead] {boolean} )
   * (x,y invocation): scale( x {number}, y {number}, [prependInstead] {boolean} )
   *
   * @param x - (s invocation): {number} scales both dimensions equally, or {Vector2} scales independently
   *          - (x,y invocation): {number} scale for the x-dimension
   * @param [y] - (s invocation): {boolean} prependInstead - Whether the transform should be prepended (defaults to false)
   *            - (x,y invocation): {number} y - scale for the y-dimension
   * @param [prependInstead] - (x,y invocation) Whether the transform should be prepended (defaults to false)
   */

  // eslint-disable-line @typescript-eslint/explicit-member-accessibility

  // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  scale(x, y, prependInstead) {
    // eslint-disable-line @typescript-eslint/explicit-member-accessibility
    if (typeof x === 'number') {
      assert && assert(isFinite(x), 'scales should be finite');
      if (y === undefined || typeof y === 'boolean') {
        // scale( scale, [prependInstead] )
        this.scale(x, x, y);
      } else {
        // scale( x, y, [prependInstead] )
        assert && assert(isFinite(y), 'scales should be finite numbers');
        assert && assert(prependInstead === undefined || typeof prependInstead === 'boolean', 'If provided, prependInstead should be boolean');
        if (x === 1 && y === 1) {
          return;
        } // bail out if we are scaling by 1 (identity)
        if (prependInstead) {
          this.prependMatrix(Matrix3.scaling(x, y));
        } else {
          this.appendMatrix(Matrix3.scaling(x, y));
        }
      }
    } else {
      // scale( vector, [prependInstead] )
      const vector = x;
      assert && assert(vector.isFinite(), 'scale should be a finite Vector2 if not a finite number');
      this.scale(vector.x, vector.y, y); // forward to full version
    }
  }

  /**
   * Rotates the node's transform. The default "appends" the transform, so that it will
   * appear to happen to the Node before the rest of the transform would apply, but if "prepended", the rest of the
   * transform would apply first.
   *
   * As an example, if a Node is translated to (100,0):
   * rotate( Math.PI ) will rotate the Node around (100,0)
   * rotate( Math.PI, true ) will rotate the Node around the origin, moving it to (-100,0)
   *
   * @param angle - The angle (in radians) to rotate by
   * @param [prependInstead] - Whether the transform should be prepended (defaults to false)
   */
  rotate(angle, prependInstead) {
    assert && assert(isFinite(angle), 'angle should be a finite number');
    assert && assert(prependInstead === undefined || typeof prependInstead === 'boolean');
    if (angle % (2 * Math.PI) === 0) {
      return;
    } // bail out if our angle is effectively 0
    if (prependInstead) {
      this.prependMatrix(Matrix3.rotation2(angle));
    } else {
      this.appendMatrix(Matrix3.rotation2(angle));
    }
  }

  /**
   * Rotates the node's transform around a specific point (in the parent coordinate frame) by prepending the transform.
   *
   * TODO: determine whether this should use the appendMatrix method https://github.com/phetsims/scenery/issues/1581
   *
   * @param point - In the parent coordinate frame
   * @param angle - In radians
   */
  rotateAround(point, angle) {
    assert && assert(point.isFinite(), 'point should be a finite Vector2');
    assert && assert(isFinite(angle), 'angle should be a finite number');
    let matrix = Matrix3.translation(-point.x, -point.y);
    matrix = Matrix3.rotation2(angle).timesMatrix(matrix);
    matrix = Matrix3.translation(point.x, point.y).timesMatrix(matrix);
    this.prependMatrix(matrix);
    return this;
  }

  /**
   * Shifts the x coordinate (in the parent coordinate frame) of where the node's origin is transformed to.
   */
  setX(x) {
    assert && assert(isFinite(x), 'x should be a finite number');
    this.translate(x - this.getX(), 0, true);
    return this;
  }

  /**
   * See setX() for more information
   */
  set x(value) {
    this.setX(value);
  }

  /**
   * See getX() for more information
   */
  get x() {
    return this.getX();
  }

  /**
   * Returns the x coordinate (in the parent coordinate frame) of where the node's origin is transformed to.
   */
  getX() {
    return this._transform.getMatrix().m02();
  }

  /**
   * Shifts the y coordinate (in the parent coordinate frame) of where the node's origin is transformed to.
   */
  setY(y) {
    assert && assert(isFinite(y), 'y should be a finite number');
    this.translate(0, y - this.getY(), true);
    return this;
  }

  /**
   * See setY() for more information
   */
  set y(value) {
    this.setY(value);
  }

  /**
   * See getY() for more information
   */
  get y() {
    return this.getY();
  }

  /**
   * Returns the y coordinate (in the parent coordinate frame) of where the node's origin is transformed to.
   */
  getY() {
    return this._transform.getMatrix().m12();
  }

  /**
   * Typically without rotations or negative parameters, this sets the scale for each axis. In its more general form,
   * it modifies the node's transform so that:
   * - Transforming (1,0) with our transform will result in a vector with magnitude abs( x-scale-magnitude )
   * - Transforming (0,1) with our transform will result in a vector with magnitude abs( y-scale-magnitude )
   * - If parameters are negative, it will flip orientation in that direct.
   *
   * Allowed call signatures:
   * setScaleMagnitude( s )
   * setScaleMagnitude( sx, sy )
   * setScaleMagnitude( vector )
   *
   * @param a - Scale for both axes, or scale for x-axis if using the 2-parameter call
   * @param [b] - Scale for the Y axis (only for the 2-parameter call)
   */

  // eslint-disable-line @typescript-eslint/explicit-member-accessibility

  // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  setScaleMagnitude(a, b) {
    // eslint-disable-line @typescript-eslint/explicit-member-accessibility
    const currentScale = this.getScaleVector();
    if (typeof a === 'number') {
      if (b === undefined) {
        // to map setScaleMagnitude( scale ) => setScaleMagnitude( scale, scale )
        b = a;
      }
      assert && assert(isFinite(a), 'setScaleMagnitude parameters should be finite numbers');
      assert && assert(isFinite(b), 'setScaleMagnitude parameters should be finite numbers');
      // setScaleMagnitude( x, y )
      this.appendMatrix(Matrix3.scaling(a / currentScale.x, b / currentScale.y));
    } else {
      // setScaleMagnitude( vector ), where we set the x-scale to vector.x and y-scale to vector.y
      assert && assert(a.isFinite(), 'first parameter should be a finite Vector2');
      this.appendMatrix(Matrix3.scaling(a.x / currentScale.x, a.y / currentScale.y));
    }
    return this;
  }

  /**
   * Returns a vector with an entry for each axis, e.g. (5,2) for an affine matrix with rows ((5,0,0),(0,2,0),(0,0,1)).
   *
   * It is equivalent to:
   * ( T(1,0).magnitude(), T(0,1).magnitude() ) where T() transforms points with our transform.
   */
  getScaleVector() {
    return this._transform.getMatrix().getScaleVector();
  }

  /**
   * Rotates this node's transform so that a unit (1,0) vector would be rotated by this node's transform by the
   * specified amount.
   *
   * @param rotation - In radians
   */
  setRotation(rotation) {
    assert && assert(isFinite(rotation), 'rotation should be a finite number');
    this.appendMatrix(scratchMatrix3.setToRotationZ(rotation - this.getRotation()));
    return this;
  }

  /**
   * See setRotation() for more information
   */
  set rotation(value) {
    this.setRotation(value);
  }

  /**
   * See getRotation() for more information
   */
  get rotation() {
    return this.getRotation();
  }

  /**
   * Returns the rotation (in radians) that would be applied to a unit (1,0) vector when transformed with this Node's
   * transform.
   */
  getRotation() {
    return this._transform.getMatrix().getRotation();
  }

  /**
   * Modifies the translation of this Node's transform so that the node's local-coordinate origin will be transformed
   * to the passed-in x/y.
   *
   * Allowed call signatures:
   * setTranslation( x, y )
   * setTranslation( vector )
   *
   * @param a - X translation - or Vector with x/y translation in components
   * @param [b] - Y translation
   */

  // eslint-disable-line @typescript-eslint/explicit-member-accessibility
  setTranslation(a, b) {
    // eslint-disable-line @typescript-eslint/explicit-member-accessibility
    const m = this._transform.getMatrix();
    const tx = m.m02();
    const ty = m.m12();
    let dx;
    let dy;
    if (typeof a === 'number') {
      assert && assert(isFinite(a), 'Parameters to setTranslation should be finite numbers');
      assert && assert(b !== undefined && isFinite(b), 'Parameters to setTranslation should be finite numbers');
      dx = a - tx;
      dy = b - ty;
    } else {
      assert && assert(a.isFinite(), 'Should be a finite Vector2');
      dx = a.x - tx;
      dy = a.y - ty;
    }
    this.translate(dx, dy, true);
    return this;
  }

  /**
   * See setTranslation() for more information - this should only be used with Vector2
   */
  set translation(value) {
    this.setTranslation(value);
  }

  /**
   * See getTranslation() for more information
   */
  get translation() {
    return this.getTranslation();
  }

  /**
   * Returns a vector of where this Node's local-coordinate origin will be transformed by it's own transform.
   */
  getTranslation() {
    const matrix = this._transform.getMatrix();
    return new Vector2(matrix.m02(), matrix.m12());
  }

  /**
   * Appends a transformation matrix to this Node's transform. Appending means this transform is conceptually applied
   * first before the rest of the Node's current transform (i.e. applied in the local coordinate frame).
   */
  appendMatrix(matrix) {
    assert && assert(matrix.isFinite(), 'matrix should be a finite Matrix3');
    assert && assert(matrix.getDeterminant() !== 0, 'matrix should not map plane to a line or point');
    this._transform.append(matrix);
  }

  /**
   * Prepends a transformation matrix to this Node's transform. Prepending means this transform is conceptually applied
   * after the rest of the Node's current transform (i.e. applied in the parent coordinate frame).
   */
  prependMatrix(matrix) {
    assert && assert(matrix.isFinite(), 'matrix should be a finite Matrix3');
    assert && assert(matrix.getDeterminant() !== 0, 'matrix should not map plane to a line or point');
    this._transform.prepend(matrix);
  }

  /**
   * Prepends an (x,y) translation to our Node's transform in an efficient manner without allocating a matrix.
   * see https://github.com/phetsims/scenery/issues/119
   */
  prependTranslation(x, y) {
    assert && assert(isFinite(x), 'x should be a finite number');
    assert && assert(isFinite(y), 'y should be a finite number');
    if (!x && !y) {
      return;
    } // bail out if both are zero

    this._transform.prependTranslation(x, y);
  }

  /**
   * Changes this Node's transform to match the passed-in transformation matrix.
   */
  setMatrix(matrix) {
    assert && assert(matrix.isFinite(), 'matrix should be a finite Matrix3');
    assert && assert(matrix.getDeterminant() !== 0, 'matrix should not map plane to a line or point');
    this._transform.setMatrix(matrix);
  }

  /**
   * See setMatrix() for more information
   */
  set matrix(value) {
    this.setMatrix(value);
  }

  /**
   * See getMatrix() for more information
   */
  get matrix() {
    return this.getMatrix();
  }

  /**
   * Returns a Matrix3 representing our Node's transform.
   *
   * NOTE: Do not mutate the returned matrix.
   */
  getMatrix() {
    return this._transform.getMatrix();
  }

  /**
   * Returns a reference to our Node's transform
   */
  getTransform() {
    // for now, return an actual copy. we can consider listening to changes in the future
    return this._transform;
  }

  /**
   * See getTransform() for more information
   */
  get transform() {
    return this.getTransform();
  }

  /**
   * Resets our Node's transform to an identity transform (i.e. no transform is applied).
   */
  resetTransform() {
    this.setMatrix(Matrix3.IDENTITY);
  }

  /**
   * Callback function that should be called when our transform is changed.
   */
  onTransformChange() {
    // TODO: why is local bounds invalidation needed here? https://github.com/phetsims/scenery/issues/1581
    this.invalidateBounds();
    this._picker.onTransformChange();
    if (assertSlow) {
      this._picker.audit();
    }
    this.transformEmitter.emit();
  }

  /**
   * Called when our summary bitmask changes (scenery-internal)
   */
  onSummaryChange(oldBitmask, newBitmask) {
    // Defined in ParallelDOM.js
    this._pdomDisplaysInfo.onSummaryChange(oldBitmask, newBitmask);
  }

  /**
   * Updates our node's scale and applied scale factor if we need to change our scale to fit within the maximum
   * dimensions (maxWidth and maxHeight). See documentation in constructor for detailed behavior.
   */
  updateMaxDimension(localBounds) {
    assert && this.auditMaxDimensions();
    const currentScale = this._appliedScaleFactor;
    let idealScale = 1;
    if (this._maxWidth !== null) {
      const width = localBounds.width;
      if (width > this._maxWidth) {
        idealScale = Math.min(idealScale, this._maxWidth / width);
      }
    }
    if (this._maxHeight !== null) {
      const height = localBounds.height;
      if (height > this._maxHeight) {
        idealScale = Math.min(idealScale, this._maxHeight / height);
      }
    }
    const scaleAdjustment = idealScale / currentScale;
    if (scaleAdjustment !== 1) {
      // Set this first, for supporting re-entrancy if our content changes based on the scale
      this._appliedScaleFactor = idealScale;
      this.scale(scaleAdjustment);
    }
  }

  /**
   * Scenery-internal method for verifying maximum dimensions are NOT smaller than preferred dimensions
   * NOTE: This has to be public due to mixins not able to access protected/private methods
   */
  auditMaxDimensions() {
    assert && assert(this._maxWidth === null || !isWidthSizable(this) || this.preferredWidth === null || this._maxWidth >= this.preferredWidth - 1e-7, 'If maxWidth and preferredWidth are both non-null, maxWidth should NOT be smaller than the preferredWidth. If that happens, it would trigger an infinite loop');
    assert && assert(this._maxHeight === null || !isHeightSizable(this) || this.preferredHeight === null || this._maxHeight >= this.preferredHeight - 1e-7, 'If maxHeight and preferredHeight are both non-null, maxHeight should NOT be smaller than the preferredHeight. If that happens, it would trigger an infinite loop');
  }

  /**
   * Increments/decrements bounds "listener" count based on the values of maxWidth/maxHeight before and after.
   * null is like no listener, non-null is like having a listener, so we increment for null => non-null, and
   * decrement for non-null => null.
   */
  onMaxDimensionChange(beforeMaxLength, afterMaxLength) {
    if (beforeMaxLength === null && afterMaxLength !== null) {
      this.changeBoundsEventCount(1);
      this._boundsEventSelfCount++;
    } else if (beforeMaxLength !== null && afterMaxLength === null) {
      this.changeBoundsEventCount(-1);
      this._boundsEventSelfCount--;
    }
  }

  /**
   * Sets the maximum width of the Node (see constructor for documentation on how maximum dimensions work).
   */
  setMaxWidth(maxWidth) {
    assert && assert(maxWidth === null || typeof maxWidth === 'number' && maxWidth > 0, 'maxWidth should be null (no constraint) or a positive number');
    if (this._maxWidth !== maxWidth) {
      // update synthetic bounds listener count (to ensure our bounds are validated at the start of updateDisplay)
      this.onMaxDimensionChange(this._maxWidth, maxWidth);
      this._maxWidth = maxWidth;
      this.updateMaxDimension(this.localBoundsProperty.value);
    }
  }

  /**
   * See setMaxWidth() for more information
   */
  set maxWidth(value) {
    this.setMaxWidth(value);
  }

  /**
   * See getMaxWidth() for more information
   */
  get maxWidth() {
    return this.getMaxWidth();
  }

  /**
   * Returns the maximum width (if any) of the Node.
   */
  getMaxWidth() {
    return this._maxWidth;
  }

  /**
   * Sets the maximum height of the Node (see constructor for documentation on how maximum dimensions work).
   */
  setMaxHeight(maxHeight) {
    assert && assert(maxHeight === null || typeof maxHeight === 'number' && maxHeight > 0, 'maxHeight should be null (no constraint) or a positive number');
    if (this._maxHeight !== maxHeight) {
      // update synthetic bounds listener count (to ensure our bounds are validated at the start of updateDisplay)
      this.onMaxDimensionChange(this._maxHeight, maxHeight);
      this._maxHeight = maxHeight;
      this.updateMaxDimension(this.localBoundsProperty.value);
    }
  }

  /**
   * See setMaxHeight() for more information
   */
  set maxHeight(value) {
    this.setMaxHeight(value);
  }

  /**
   * See getMaxHeight() for more information
   */
  get maxHeight() {
    return this.getMaxHeight();
  }

  /**
   * Returns the maximum height (if any) of the Node.
   */
  getMaxHeight() {
    return this._maxHeight;
  }

  /**
   * Shifts this Node horizontally so that its left bound (in the parent coordinate frame) is equal to the passed-in
   * 'left' X value.
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   *
   * @param left - After this operation, node.left should approximately equal this value.
   */
  setLeft(left) {
    const currentLeft = this.getLeft();
    if (isFinite(currentLeft)) {
      this.translate(left - currentLeft, 0, true);
    }
    return this; // allow chaining
  }

  /**
   * See setLeft() for more information
   */
  set left(value) {
    this.setLeft(value);
  }

  /**
   * See getLeft() for more information
   */
  get left() {
    return this.getLeft();
  }

  /**
   * Returns the X value of the left side of the bounding box of this Node (in the parent coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getLeft() {
    return this.getBounds().minX;
  }

  /**
   * Shifts this Node horizontally so that its right bound (in the parent coordinate frame) is equal to the passed-in
   * 'right' X value.
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   *
   * @param right - After this operation, node.right should approximately equal this value.
   */
  setRight(right) {
    const currentRight = this.getRight();
    if (isFinite(currentRight)) {
      this.translate(right - currentRight, 0, true);
    }
    return this; // allow chaining
  }

  /**
   * See setRight() for more information
   */
  set right(value) {
    this.setRight(value);
  }

  /**
   * See getRight() for more information
   */
  get right() {
    return this.getRight();
  }

  /**
   * Returns the X value of the right side of the bounding box of this Node (in the parent coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getRight() {
    return this.getBounds().maxX;
  }

  /**
   * Shifts this Node horizontally so that its horizontal center (in the parent coordinate frame) is equal to the
   * passed-in center X value.
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   *
   * @param x - After this operation, node.centerX should approximately equal this value.
   */
  setCenterX(x) {
    const currentCenterX = this.getCenterX();
    if (isFinite(currentCenterX)) {
      this.translate(x - currentCenterX, 0, true);
    }
    return this; // allow chaining
  }

  /**
   * See setCenterX() for more information
   */
  set centerX(value) {
    this.setCenterX(value);
  }

  /**
   * See getCenterX() for more information
   */
  get centerX() {
    return this.getCenterX();
  }

  /**
   * Returns the X value of this node's horizontal center (in the parent coordinate frame)
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getCenterX() {
    return this.getBounds().getCenterX();
  }

  /**
   * Shifts this Node vertically so that its vertical center (in the parent coordinate frame) is equal to the
   * passed-in center Y value.
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   *
   * @param y - After this operation, node.centerY should approximately equal this value.
   */
  setCenterY(y) {
    const currentCenterY = this.getCenterY();
    if (isFinite(currentCenterY)) {
      this.translate(0, y - currentCenterY, true);
    }
    return this; // allow chaining
  }

  /**
   * See setCenterY() for more information
   */
  set centerY(value) {
    this.setCenterY(value);
  }

  /**
   * See getCenterX() for more information
   */
  get centerY() {
    return this.getCenterY();
  }

  /**
   * Returns the Y value of this node's vertical center (in the parent coordinate frame)
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getCenterY() {
    return this.getBounds().getCenterY();
  }

  /**
   * Shifts this Node vertically so that its top (in the parent coordinate frame) is equal to the passed-in Y value.
   *
   * NOTE: top is the lowest Y value in our bounds.
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   *
   * @param top - After this operation, node.top should approximately equal this value.
   */
  setTop(top) {
    const currentTop = this.getTop();
    if (isFinite(currentTop)) {
      this.translate(0, top - currentTop, true);
    }
    return this; // allow chaining
  }

  /**
   * See setTop() for more information
   */
  set top(value) {
    this.setTop(value);
  }

  /**
   * See getTop() for more information
   */
  get top() {
    return this.getTop();
  }

  /**
   * Returns the lowest Y value of this node's bounding box (in the parent coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getTop() {
    return this.getBounds().minY;
  }

  /**
   * Shifts this Node vertically so that its bottom (in the parent coordinate frame) is equal to the passed-in Y value.
   *
   * NOTE: bottom is the highest Y value in our bounds.
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   *
   * @param bottom - After this operation, node.bottom should approximately equal this value.
   */
  setBottom(bottom) {
    const currentBottom = this.getBottom();
    if (isFinite(currentBottom)) {
      this.translate(0, bottom - currentBottom, true);
    }
    return this; // allow chaining
  }

  /**
   * See setBottom() for more information
   */
  set bottom(value) {
    this.setBottom(value);
  }

  /**
   * See getBottom() for more information
   */
  get bottom() {
    return this.getBottom();
  }

  /**
   * Returns the highest Y value of this node's bounding box (in the parent coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getBottom() {
    return this.getBounds().maxY;
  }

  /*
   * Convenience locations
   *
   * Upper is in terms of the visual layout in Scenery and other programs, so the minY is the "upper", and minY is the "lower"
   *
   *             left (x)     centerX        right
   *          ---------------------------------------
   * top  (y) | leftTop     centerTop     rightTop
   * centerY  | leftCenter  center        rightCenter
   * bottom   | leftBottom  centerBottom  rightBottom
   *
   * NOTE: This requires computation of this node's subtree bounds, which may incur some performance loss.
   */

  /**
   * Sets the position of the upper-left corner of this node's bounds to the specified point.
   */
  setLeftTop(leftTop) {
    assert && assert(leftTop.isFinite(), 'leftTop should be a finite Vector2');
    const currentLeftTop = this.getLeftTop();
    if (currentLeftTop.isFinite()) {
      this.translate(leftTop.minus(currentLeftTop), true);
    }
    return this;
  }

  /**
   * See setLeftTop() for more information
   */
  set leftTop(value) {
    this.setLeftTop(value);
  }

  /**
   * See getLeftTop() for more information
   */
  get leftTop() {
    return this.getLeftTop();
  }

  /**
   * Returns the upper-left corner of this node's bounds.
   */
  getLeftTop() {
    return this.getBounds().getLeftTop();
  }

  /**
   * Sets the position of the center-top location of this node's bounds to the specified point.
   */
  setCenterTop(centerTop) {
    assert && assert(centerTop.isFinite(), 'centerTop should be a finite Vector2');
    const currentCenterTop = this.getCenterTop();
    if (currentCenterTop.isFinite()) {
      this.translate(centerTop.minus(currentCenterTop), true);
    }
    return this;
  }

  /**
   * See setCenterTop() for more information
   */
  set centerTop(value) {
    this.setCenterTop(value);
  }

  /**
   * See getCenterTop() for more information
   */
  get centerTop() {
    return this.getCenterTop();
  }

  /**
   * Returns the center-top location of this node's bounds.
   */
  getCenterTop() {
    return this.getBounds().getCenterTop();
  }

  /**
   * Sets the position of the upper-right corner of this node's bounds to the specified point.
   */
  setRightTop(rightTop) {
    assert && assert(rightTop.isFinite(), 'rightTop should be a finite Vector2');
    const currentRightTop = this.getRightTop();
    if (currentRightTop.isFinite()) {
      this.translate(rightTop.minus(currentRightTop), true);
    }
    return this;
  }

  /**
   * See setRightTop() for more information
   */
  set rightTop(value) {
    this.setRightTop(value);
  }

  /**
   * See getRightTop() for more information
   */
  get rightTop() {
    return this.getRightTop();
  }

  /**
   * Returns the upper-right corner of this node's bounds.
   */
  getRightTop() {
    return this.getBounds().getRightTop();
  }

  /**
   * Sets the position of the center-left of this node's bounds to the specified point.
   */
  setLeftCenter(leftCenter) {
    assert && assert(leftCenter.isFinite(), 'leftCenter should be a finite Vector2');
    const currentLeftCenter = this.getLeftCenter();
    if (currentLeftCenter.isFinite()) {
      this.translate(leftCenter.minus(currentLeftCenter), true);
    }
    return this;
  }

  /**
   * See setLeftCenter() for more information
   */
  set leftCenter(value) {
    this.setLeftCenter(value);
  }

  /**
   * See getLeftCenter() for more information
   */
  get leftCenter() {
    return this.getLeftCenter();
  }

  /**
   * Returns the center-left corner of this node's bounds.
   */
  getLeftCenter() {
    return this.getBounds().getLeftCenter();
  }

  /**
   * Sets the center of this node's bounds to the specified point.
   */
  setCenter(center) {
    assert && assert(center.isFinite(), 'center should be a finite Vector2');
    const currentCenter = this.getCenter();
    if (currentCenter.isFinite()) {
      this.translate(center.minus(currentCenter), true);
    }
    return this;
  }

  /**
   * See setCenter() for more information
   */
  set center(value) {
    this.setCenter(value);
  }

  /**
   * See getCenter() for more information
   */
  get center() {
    return this.getCenter();
  }

  /**
   * Returns the center of this node's bounds.
   */
  getCenter() {
    return this.getBounds().getCenter();
  }

  /**
   * Sets the position of the center-right of this node's bounds to the specified point.
   */
  setRightCenter(rightCenter) {
    assert && assert(rightCenter.isFinite(), 'rightCenter should be a finite Vector2');
    const currentRightCenter = this.getRightCenter();
    if (currentRightCenter.isFinite()) {
      this.translate(rightCenter.minus(currentRightCenter), true);
    }
    return this;
  }

  /**
   * See setRightCenter() for more information
   */
  set rightCenter(value) {
    this.setRightCenter(value);
  }

  /**
   * See getRightCenter() for more information
   */
  get rightCenter() {
    return this.getRightCenter();
  }

  /**
   * Returns the center-right of this node's bounds.
   */
  getRightCenter() {
    return this.getBounds().getRightCenter();
  }

  /**
   * Sets the position of the lower-left corner of this node's bounds to the specified point.
   */
  setLeftBottom(leftBottom) {
    assert && assert(leftBottom.isFinite(), 'leftBottom should be a finite Vector2');
    const currentLeftBottom = this.getLeftBottom();
    if (currentLeftBottom.isFinite()) {
      this.translate(leftBottom.minus(currentLeftBottom), true);
    }
    return this;
  }

  /**
   * See setLeftBottom() for more information
   */
  set leftBottom(value) {
    this.setLeftBottom(value);
  }

  /**
   * See getLeftBottom() for more information
   */
  get leftBottom() {
    return this.getLeftBottom();
  }

  /**
   * Returns the lower-left corner of this node's bounds.
   */
  getLeftBottom() {
    return this.getBounds().getLeftBottom();
  }

  /**
   * Sets the position of the center-bottom of this node's bounds to the specified point.
   */
  setCenterBottom(centerBottom) {
    assert && assert(centerBottom.isFinite(), 'centerBottom should be a finite Vector2');
    const currentCenterBottom = this.getCenterBottom();
    if (currentCenterBottom.isFinite()) {
      this.translate(centerBottom.minus(currentCenterBottom), true);
    }
    return this;
  }

  /**
   * See setCenterBottom() for more information
   */
  set centerBottom(value) {
    this.setCenterBottom(value);
  }

  /**
   * See getCenterBottom() for more information
   */
  get centerBottom() {
    return this.getCenterBottom();
  }

  /**
   * Returns the center-bottom of this node's bounds.
   */
  getCenterBottom() {
    return this.getBounds().getCenterBottom();
  }

  /**
   * Sets the position of the lower-right corner of this node's bounds to the specified point.
   */
  setRightBottom(rightBottom) {
    assert && assert(rightBottom.isFinite(), 'rightBottom should be a finite Vector2');
    const currentRightBottom = this.getRightBottom();
    if (currentRightBottom.isFinite()) {
      this.translate(rightBottom.minus(currentRightBottom), true);
    }
    return this;
  }

  /**
   * See setRightBottom() for more information
   */
  set rightBottom(value) {
    this.setRightBottom(value);
  }

  /**
   * See getRightBottom() for more information
   */
  get rightBottom() {
    return this.getRightBottom();
  }

  /**
   * Returns the lower-right corner of this node's bounds.
   */
  getRightBottom() {
    return this.getBounds().getRightBottom();
  }

  /**
   * Returns the width of this node's bounding box (in the parent coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getWidth() {
    return this.getBounds().getWidth();
  }

  /**
   * See getWidth() for more information
   */
  get width() {
    return this.getWidth();
  }

  /**
   * Returns the height of this node's bounding box (in the parent coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getHeight() {
    return this.getBounds().getHeight();
  }

  /**
   * See getHeight() for more information
   */
  get height() {
    return this.getHeight();
  }

  /**
   * Returns the width of this node's bounding box (in the local coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getLocalWidth() {
    return this.getLocalBounds().getWidth();
  }

  /**
   * See getLocalWidth() for more information
   */
  get localWidth() {
    return this.getLocalWidth();
  }

  /**
   * Returns the height of this node's bounding box (in the local coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getLocalHeight() {
    return this.getLocalBounds().getHeight();
  }

  /**
   * See getLocalHeight() for more information
   */
  get localHeight() {
    return this.getLocalHeight();
  }

  /**
   * Returns the X value of the left side of the bounding box of this Node (in the local coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getLocalLeft() {
    return this.getLocalBounds().minX;
  }

  /**
   * See getLeft() for more information
   */
  get localLeft() {
    return this.getLocalLeft();
  }

  /**
   * Returns the X value of the right side of the bounding box of this Node (in the local coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getLocalRight() {
    return this.getLocalBounds().maxX;
  }

  /**
   * See getRight() for more information
   */
  get localRight() {
    return this.getLocalRight();
  }

  /**
   * Returns the X value of this node's horizontal center (in the local coordinate frame)
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getLocalCenterX() {
    return this.getLocalBounds().getCenterX();
  }

  /**
   * See getCenterX() for more information
   */
  get localCenterX() {
    return this.getLocalCenterX();
  }

  /**
   * Returns the Y value of this node's vertical center (in the local coordinate frame)
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getLocalCenterY() {
    return this.getLocalBounds().getCenterY();
  }

  /**
   * See getCenterX() for more information
   */
  get localCenterY() {
    return this.getLocalCenterY();
  }

  /**
   * Returns the lowest Y value of this node's bounding box (in the local coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getLocalTop() {
    return this.getLocalBounds().minY;
  }

  /**
   * See getTop() for more information
   */
  get localTop() {
    return this.getLocalTop();
  }

  /**
   * Returns the highest Y value of this node's bounding box (in the local coordinate frame).
   *
   * NOTE: This may require computation of this node's subtree bounds, which may incur some performance loss.
   */
  getLocalBottom() {
    return this.getLocalBounds().maxY;
  }

  /**
   * See getLocalBottom() for more information
   */
  get localBottom() {
    return this.getLocalBottom();
  }

  /**
   * Returns the upper-left corner of this node's localBounds.
   */
  getLocalLeftTop() {
    return this.getLocalBounds().getLeftTop();
  }

  /**
   * See getLocalLeftTop() for more information
   */
  get localLeftTop() {
    return this.getLocalLeftTop();
  }

  /**
   * Returns the center-top location of this node's localBounds.
   */
  getLocalCenterTop() {
    return this.getLocalBounds().getCenterTop();
  }

  /**
   * See getLocalCenterTop() for more information
   */
  get localCenterTop() {
    return this.getLocalCenterTop();
  }

  /**
   * Returns the upper-right corner of this node's localBounds.
   */
  getLocalRightTop() {
    return this.getLocalBounds().getRightTop();
  }

  /**
   * See getLocalRightTop() for more information
   */
  get localRightTop() {
    return this.getLocalRightTop();
  }

  /**
   * Returns the center-left corner of this node's localBounds.
   */
  getLocalLeftCenter() {
    return this.getLocalBounds().getLeftCenter();
  }

  /**
   * See getLocalLeftCenter() for more information
   */
  get localLeftCenter() {
    return this.getLocalLeftCenter();
  }

  /**
   * Returns the center of this node's localBounds.
   */
  getLocalCenter() {
    return this.getLocalBounds().getCenter();
  }

  /**
   * See getLocalCenter() for more information
   */
  get localCenter() {
    return this.getLocalCenter();
  }

  /**
   * Returns the center-right of this node's localBounds.
   */
  getLocalRightCenter() {
    return this.getLocalBounds().getRightCenter();
  }

  /**
   * See getLocalRightCenter() for more information
   */
  get localRightCenter() {
    return this.getLocalRightCenter();
  }

  /**
   * Returns the lower-left corner of this node's localBounds.
   */
  getLocalLeftBottom() {
    return this.getLocalBounds().getLeftBottom();
  }

  /**
   * See getLocalLeftBottom() for more information
   */
  get localLeftBottom() {
    return this.getLocalLeftBottom();
  }

  /**
   * Returns the center-bottom of this node's localBounds.
   */
  getLocalCenterBottom() {
    return this.getLocalBounds().getCenterBottom();
  }

  /**
   * See getLocalCenterBottom() for more information
   */
  get localCenterBottom() {
    return this.getLocalCenterBottom();
  }

  /**
   * Returns the lower-right corner of this node's localBounds.
   */
  getLocalRightBottom() {
    return this.getLocalBounds().getRightBottom();
  }

  /**
   * See getLocalRightBottom() for more information
   */
  get localRightBottom() {
    return this.getLocalRightBottom();
  }

  /**
   * Returns the unique integral ID for this node.
   */
  getId() {
    return this._id;
  }

  /**
   * See getId() for more information
   */
  get id() {
    return this.getId();
  }

  /**
   * Called when our visibility Property changes values.
   */
  onVisiblePropertyChange(visible) {
    // changing visibility can affect pickability pruning, which affects mouse/touch bounds
    this._picker.onVisibilityChange();
    if (assertSlow) {
      this._picker.audit();
    }

    // Defined in ParallelDOM.js
    this._pdomDisplaysInfo.onVisibilityChange(visible);
    for (let i = 0; i < this._parents.length; i++) {
      const parent = this._parents[i];
      if (parent._excludeInvisibleChildrenFromBounds) {
        parent.invalidateChildBounds();
      }
    }
  }

  /**
   * Sets what Property our visibleProperty is backed by, so that changes to this provided Property will change this
   * Node's visibility, and vice versa. This does not change this._visibleProperty. See TinyForwardingProperty.setTargetProperty()
   * for more info.
   *
   * NOTE For PhET-iO use:
   * All PhET-iO instrumented Nodes create their own instrumented visibleProperty (if one is not passed in as
   * an option). Once a Node's visibleProperty has been registered with PhET-iO, it cannot be "swapped out" for another.
   * If you need to "delay" setting an instrumented visibleProperty to this node, pass phetioVisiblePropertyInstrumented
   * to instrumentation call to this Node (where Tandem is provided).
   */
  setVisibleProperty(newTarget) {
    return this._visibleProperty.setTargetProperty(newTarget, this, VISIBLE_PROPERTY_TANDEM_NAME);
  }

  /**
   * See setVisibleProperty() for more information
   */
  set visibleProperty(property) {
    this.setVisibleProperty(property);
  }

  /**
   * See getVisibleProperty() for more information
   */
  get visibleProperty() {
    return this.getVisibleProperty();
  }

  /**
   * Get this Node's visibleProperty. Note! This is not the reciprocal of setVisibleProperty. Node.prototype._visibleProperty
   * is a TinyForwardingProperty, and is set up to listen to changes from the visibleProperty provided by
   * setVisibleProperty(), but the underlying reference does not change. This means the following:
   *     * const myNode = new Node();
   * const visibleProperty = new Property( false );
   * myNode.setVisibleProperty( visibleProperty )
   * => myNode.getVisibleProperty() !== visibleProperty (!!!!!!)
   *
   * Please use this with caution. See setVisibleProperty() for more information.
   */
  getVisibleProperty() {
    return this._visibleProperty;
  }

  /**
   * Sets whether this Node is visible.  DO NOT override this as a way of adding additional behavior when a Node's
   * visibility changes, add a listener to this.visibleProperty instead.
   */
  setVisible(visible) {
    this.visibleProperty.set(visible);
    return this;
  }

  /**
   * See setVisible() for more information
   */
  set visible(value) {
    this.setVisible(value);
  }

  /**
   * See isVisible() for more information
   */
  get visible() {
    return this.isVisible();
  }

  /**
   * Returns whether this Node is visible.
   */
  isVisible() {
    return this.visibleProperty.value;
  }

  /**
   * Use this to automatically create a forwarded, PhET-iO instrumented visibleProperty internal to Node.
   */
  setPhetioVisiblePropertyInstrumented(phetioVisiblePropertyInstrumented) {
    return this._visibleProperty.setTargetPropertyInstrumented(phetioVisiblePropertyInstrumented, this);
  }

  /**
   * See setPhetioVisiblePropertyInstrumented() for more information
   */
  set phetioVisiblePropertyInstrumented(value) {
    this.setPhetioVisiblePropertyInstrumented(value);
  }

  /**
   * See getPhetioVisiblePropertyInstrumented() for more information
   */
  get phetioVisiblePropertyInstrumented() {
    return this.getPhetioVisiblePropertyInstrumented();
  }
  getPhetioVisiblePropertyInstrumented() {
    return this._visibleProperty.getTargetPropertyInstrumented();
  }

  /**
   * Swap the visibility of this node with another node. The Node that is made visible will receive keyboard focus
   * if it is focusable and the previously visible Node had focus.
   */
  swapVisibility(otherNode) {
    assert && assert(this.visible !== otherNode.visible);
    const visibleNode = this.visible ? this : otherNode;
    const invisibleNode = this.visible ? otherNode : this;

    // if the visible node has focus we will restore focus on the invisible Node once it is visible
    const visibleNodeFocused = visibleNode.focused;
    visibleNode.visible = false;
    invisibleNode.visible = true;
    if (visibleNodeFocused && invisibleNode.focusable) {
      invisibleNode.focus();
    }
    return this; // allow chaining
  }

  /**
   * Sets the opacity of this Node (and its sub-tree), where 0 is fully transparent, and 1 is fully opaque.  Values
   * outside of that range throw an Error.
   * @throws Error if opacity out of range
   */
  setOpacity(opacity) {
    assert && assert(isFinite(opacity), 'opacity should be a finite number');
    if (opacity < 0 || opacity > 1) {
      throw new Error(`opacity out of range: ${opacity}`);
    }
    this.opacityProperty.value = opacity;
  }

  /**
   * See setOpacity() for more information
   */
  set opacity(value) {
    this.setOpacity(value);
  }

  /**
   * See getOpacity() for more information
   */
  get opacity() {
    return this.getOpacity();
  }

  /**
   * Returns the opacity of this node.
   */
  getOpacity() {
    return this.opacityProperty.value;
  }

  /**
   * Sets the disabledOpacity of this Node (and its sub-tree), where 0 is fully transparent, and 1 is fully opaque.
   * Values outside of that range throw an Error.
   * @throws Error if disabledOpacity out of range
   */
  setDisabledOpacity(disabledOpacity) {
    assert && assert(isFinite(disabledOpacity), 'disabledOpacity should be a finite number');
    if (disabledOpacity < 0 || disabledOpacity > 1) {
      throw new Error(`disabledOpacity out of range: ${disabledOpacity}`);
    }
    this.disabledOpacityProperty.value = disabledOpacity;
    return this;
  }

  /**
   * See setDisabledOpacity() for more information
   */
  set disabledOpacity(value) {
    this.setDisabledOpacity(value);
  }

  /**
   * See getDisabledOpacity() for more information
   */
  get disabledOpacity() {
    return this.getDisabledOpacity();
  }

  /**
   * Returns the disabledOpacity of this node.
   */
  getDisabledOpacity() {
    return this.disabledOpacityProperty.value;
  }

  /**
   * Returns the opacity actually applied to the node.
   */
  getEffectiveOpacity() {
    return this.opacityProperty.value * (this.enabledProperty.value ? 1 : this.disabledOpacityProperty.value);
  }

  /**
   * See getDisabledOpacity() for more information
   */
  get effectiveOpacity() {
    return this.getEffectiveOpacity();
  }

  /**
   * Called when our opacity or other filter changes values
   */
  onOpacityPropertyChange() {
    this.filterChangeEmitter.emit();
  }

  /**
   * Called when our opacity or other filter changes values
   */
  onDisabledOpacityPropertyChange() {
    if (!this._enabledProperty.value) {
      this.filterChangeEmitter.emit();
    }
  }

  /**
   * Sets the non-opacity filters for this Node.
   *
   * The default is an empty array (no filters). It should be an array of Filter objects, which will be effectively
   * applied in-order on this Node (and its subtree), and will be applied BEFORE opacity/clipping.
   *
   * NOTE: Some filters may decrease performance (and this may be platform-specific). Please read documentation for each
   * filter before using.
   *
   * Typical filter types to use are:
   * - Brightness
   * - Contrast
   * - DropShadow (EXPERIMENTAL)
   * - GaussianBlur (EXPERIMENTAL)
   * - Grayscale (Grayscale.FULL for the full effect)
   * - HueRotate
   * - Invert (Invert.FULL for the full effect)
   * - Saturate
   * - Sepia (Sepia.FULL for the full effect)
   *
   * Filter.js has more information in general on filters.
   */
  setFilters(filters) {
    assert && assert(Array.isArray(filters), 'filters should be an array');
    assert && assert(_.every(filters, filter => filter instanceof Filter), 'filters should consist of Filter objects only');

    // We re-use the same array internally, so we don't reference a potentially-mutable array from outside.
    this._filters.length = 0;
    this._filters.push(...filters);
    this.invalidateHint();
    this.filterChangeEmitter.emit();
  }

  /**
   * See setFilters() for more information
   */
  set filters(value) {
    this.setFilters(value);
  }

  /**
   * See getFilters() for more information
   */
  get filters() {
    return this.getFilters();
  }

  /**
   * Returns the non-opacity filters for this Node.
   */
  getFilters() {
    return this._filters.slice();
  }

  /**
   * Sets what Property our pickableProperty is backed by, so that changes to this provided Property will change this
   * Node's pickability, and vice versa. This does not change this._pickableProperty. See TinyForwardingProperty.setTargetProperty()
   * for more info.
   *
   * PhET-iO Instrumented Nodes do not by default create their own instrumented pickableProperty, even though Node.visibleProperty does.
   */
  setPickableProperty(newTarget) {
    return this._pickableProperty.setTargetProperty(newTarget, this, null);
  }

  /**
   * See setPickableProperty() for more information
   */
  set pickableProperty(property) {
    this.setPickableProperty(property);
  }

  /**
   * See getPickableProperty() for more information
   */
  get pickableProperty() {
    return this.getPickableProperty();
  }

  /**
   * Get this Node's pickableProperty. Note! This is not the reciprocal of setPickableProperty. Node.prototype._pickableProperty
   * is a TinyForwardingProperty, and is set up to listen to changes from the pickableProperty provided by
   * setPickableProperty(), but the underlying reference does not change. This means the following:
   * const myNode = new Node();
   * const pickableProperty = new Property( false );
   * myNode.setPickableProperty( pickableProperty )
   * => myNode.getPickableProperty() !== pickableProperty (!!!!!!)
   *
   * Please use this with caution. See setPickableProperty() for more information.
   */
  getPickableProperty() {
    return this._pickableProperty;
  }

  /**
   * Sets whether this Node (and its subtree) will allow hit-testing (and thus user interaction), controlling what
   * Trail is returned from node.trailUnderPoint().
   *
   * Pickable can take one of three values:
   * - null: (default) pass-through behavior. Hit-testing will prune this subtree if there are no
   *         ancestors/descendants with either pickable: true set or with any input listeners.
   * - false: Hit-testing is pruned, nothing in this node or its subtree will respond to events or be picked.
   * - true: Hit-testing will not be pruned in this subtree, except for pickable: false cases.
   *
   * Hit testing is accomplished mainly with node.trailUnderPointer() and node.trailUnderPoint(), following the
   * above rules. Nodes that are not pickable (pruned) will not have input events targeted to them.
   *
   * The following rules (applied in the given order) determine whether a Node (really, a Trail) will receive input events:
   * 1. If the node or one of its ancestors has pickable: false OR is invisible, the Node *will not* receive events
   *    or hit testing.
   * 2. If the Node or one of its ancestors or descendants is pickable: true OR has an input listener attached, it
   *    *will* receive events or hit testing.
   * 3. Otherwise, it *will not* receive events or hit testing.
   *
   * This is useful for semi-transparent overlays or other visual elements that should be displayed but should not
   * prevent objects below from being manipulated by user input, and the default null value is used to increase
   * performance by ignoring areas that don't need user input.
   *
   * NOTE: If you want something to be picked "mouse is over it", but block input events even if there are listeners,
   *       then pickable:false is not appropriate, and inputEnabled:false is preferred.
   *
   * For a visual example of how pickability interacts with input listeners and visibility, see the notes at the
   * bottom of http://phetsims.github.io/scenery/doc/implementation-notes, or scenery/assets/pickability.svg.
   */
  setPickable(pickable) {
    assert && assert(pickable === null || typeof pickable === 'boolean');
    this._pickableProperty.set(pickable);
    return this;
  }

  /**
   * See setPickable() for more information
   */
  set pickable(value) {
    this.setPickable(value);
  }

  /**
   * See isPickable() for more information
   */
  get pickable() {
    return this.isPickable();
  }

  /**
   * Returns the pickability of this node.
   */
  isPickable() {
    return this._pickableProperty.value;
  }

  /**
   * Called when our pickableProperty changes values.
   */
  onPickablePropertyChange(pickable, oldPickable) {
    this._picker.onPickableChange(oldPickable, pickable);
    if (assertSlow) {
      this._picker.audit();
    }
    // TODO: invalidate the cursor somehow? #150
  }

  /**
   * Sets what Property our enabledProperty is backed by, so that changes to this provided Property will change this
   * Node's enabled, and vice versa. This does not change this._enabledProperty. See TinyForwardingProperty.setTargetProperty()
   * for more info.
   *
   *
   * NOTE For PhET-iO use:
   * All PhET-iO instrumented Nodes create their own instrumented enabledProperty (if one is not passed in as
   * an option). Once a Node's enabledProperty has been registered with PhET-iO, it cannot be "swapped out" for another.
   * If you need to "delay" setting an instrumented enabledProperty to this node, pass phetioEnabledPropertyInstrumented
   * to instrumentation call to this Node (where Tandem is provided).
   */
  setEnabledProperty(newTarget) {
    return this._enabledProperty.setTargetProperty(newTarget, this, ENABLED_PROPERTY_TANDEM_NAME);
  }

  /**
   * See setEnabledProperty() for more information
   */
  set enabledProperty(property) {
    this.setEnabledProperty(property);
  }

  /**
   * See getEnabledProperty() for more information
   */
  get enabledProperty() {
    return this.getEnabledProperty();
  }

  /**
   * Get this Node's enabledProperty. Note! This is not the reciprocal of setEnabledProperty. Node.prototype._enabledProperty
   * is a TinyForwardingProperty, and is set up to listen to changes from the enabledProperty provided by
   * setEnabledProperty(), but the underlying reference does not change. This means the following:
   * const myNode = new Node();
   * const enabledProperty = new Property( false );
   * myNode.setEnabledProperty( enabledProperty )
   * => myNode.getEnabledProperty() !== enabledProperty (!!!!!!)
   *
   * Please use this with caution. See setEnabledProperty() for more information.
   */
  getEnabledProperty() {
    return this._enabledProperty;
  }

  /**
   * Use this to automatically create a forwarded, PhET-iO instrumented enabledProperty internal to Node. This is different
   * from visible because enabled by default doesn't not create this forwarded Property.
   */
  setPhetioEnabledPropertyInstrumented(phetioEnabledPropertyInstrumented) {
    return this._enabledProperty.setTargetPropertyInstrumented(phetioEnabledPropertyInstrumented, this);
  }

  /**
   * See setPhetioEnabledPropertyInstrumented() for more information
   */
  set phetioEnabledPropertyInstrumented(value) {
    this.setPhetioEnabledPropertyInstrumented(value);
  }

  /**
   * See getPhetioEnabledPropertyInstrumented() for more information
   */
  get phetioEnabledPropertyInstrumented() {
    return this.getPhetioEnabledPropertyInstrumented();
  }
  getPhetioEnabledPropertyInstrumented() {
    return this._enabledProperty.getTargetPropertyInstrumented();
  }

  /**
   * Sets whether this Node is enabled
   */
  setEnabled(enabled) {
    assert && assert(enabled === null || typeof enabled === 'boolean');
    this._enabledProperty.set(enabled);
    return this;
  }

  /**
   * See setEnabled() for more information
   */
  set enabled(value) {
    this.setEnabled(value);
  }

  /**
   * See isEnabled() for more information
   */
  get enabled() {
    return this.isEnabled();
  }

  /**
   * Returns the enabled of this node.
   */
  isEnabled() {
    return this._enabledProperty.value;
  }

  /**
   * Called when enabledProperty changes values.
   * - override this to change the behavior of enabled
   */
  onEnabledPropertyChange(enabled) {
    !enabled && this.interruptSubtreeInput();
    this.inputEnabled = enabled;
    if (this.disabledOpacityProperty.value !== 1) {
      this.filterChangeEmitter.emit();
    }
  }

  /**
   * Sets what Property our inputEnabledProperty is backed by, so that changes to this provided Property will change this whether this
   * Node's input is enabled, and vice versa. This does not change this._inputEnabledProperty. See TinyForwardingProperty.setTargetProperty()
   * for more info.
   *
   * NOTE For PhET-iO use:
   * All PhET-iO instrumented Nodes create their own instrumented inputEnabledProperty (if one is not passed in as
   * an option). Once a Node's inputEnabledProperty has been registered with PhET-iO, it cannot be "swapped out" for another.
   * If you need to "delay" setting an instrumented inputEnabledProperty to this node, pass phetioInputEnabledPropertyInstrumented
   * to instrumentation call to this Node (where Tandem is provided).
   */
  setInputEnabledProperty(newTarget) {
    return this._inputEnabledProperty.setTargetProperty(newTarget, this, INPUT_ENABLED_PROPERTY_TANDEM_NAME);
  }

  /**
   * See setInputEnabledProperty() for more information
   */
  set inputEnabledProperty(property) {
    this.setInputEnabledProperty(property);
  }

  /**
   * See getInputEnabledProperty() for more information
   */
  get inputEnabledProperty() {
    return this.getInputEnabledProperty();
  }

  /**
   * Get this Node's inputEnabledProperty. Note! This is not the reciprocal of setInputEnabledProperty. Node.prototype._inputEnabledProperty
   * is a TinyForwardingProperty, and is set up to listen to changes from the inputEnabledProperty provided by
   * setInputEnabledProperty(), but the underlying reference does not change. This means the following:
   * const myNode = new Node();
   * const inputEnabledProperty = new Property( false );
   * myNode.setInputEnabledProperty( inputEnabledProperty )
   * => myNode.getInputEnabledProperty() !== inputEnabledProperty (!!!!!!)
   *
   * Please use this with caution. See setInputEnabledProperty() for more information.
   */
  getInputEnabledProperty() {
    return this._inputEnabledProperty;
  }

  /**
   * Use this to automatically create a forwarded, PhET-iO instrumented inputEnabledProperty internal to Node. This is different
   * from visible because inputEnabled by default doesn't not create this forwarded Property.
   */
  setPhetioInputEnabledPropertyInstrumented(phetioInputEnabledPropertyInstrumented) {
    return this._inputEnabledProperty.setTargetPropertyInstrumented(phetioInputEnabledPropertyInstrumented, this);
  }

  /**
   * See setPhetioInputEnabledPropertyInstrumented() for more information
   */
  set phetioInputEnabledPropertyInstrumented(value) {
    this.setPhetioInputEnabledPropertyInstrumented(value);
  }

  /**
   * See getPhetioInputEnabledPropertyInstrumented() for more information
   */
  get phetioInputEnabledPropertyInstrumented() {
    return this.getPhetioInputEnabledPropertyInstrumented();
  }
  getPhetioInputEnabledPropertyInstrumented() {
    return this._inputEnabledProperty.getTargetPropertyInstrumented();
  }

  /**
   * Sets whether input is enabled for this Node and its subtree. If false, input event listeners will not be fired
   * on this Node or its descendants in the picked Trail. This does NOT effect picking (what Trail/nodes are under
   * a pointer), but only effects what listeners are fired.
   *
   * Additionally, this will affect cursor behavior. If inputEnabled=false, descendants of this Node will not be
   * checked when determining what cursor will be shown. Instead, if a pointer (e.g. mouse) is over a descendant,
   * this Node's cursor will be checked first, then ancestors will be checked as normal.
   */
  setInputEnabled(inputEnabled) {
    this.inputEnabledProperty.value = inputEnabled;
  }

  /**
   * See setInputEnabled() for more information
   */
  set inputEnabled(value) {
    this.setInputEnabled(value);
  }

  /**
   * See isInputEnabled() for more information
   */
  get inputEnabled() {
    return this.isInputEnabled();
  }

  /**
   * Returns whether input is enabled for this Node and its subtree. See setInputEnabled for more documentation.
   */
  isInputEnabled() {
    return this.inputEnabledProperty.value;
  }

  /**
   * Sets all of the input listeners attached to this Node.
   *
   * This is equivalent to removing all current input listeners with removeInputListener() and adding all new
   * listeners (in order) with addInputListener().
   */
  setInputListeners(inputListeners) {
    assert && assert(Array.isArray(inputListeners));

    // Remove all old input listeners
    while (this._inputListeners.length) {
      this.removeInputListener(this._inputListeners[0]);
    }

    // Add in all new input listeners
    for (let i = 0; i < inputListeners.length; i++) {
      this.addInputListener(inputListeners[i]);
    }
    return this;
  }

  /**
   * See setInputListeners() for more information
   */
  set inputListeners(value) {
    this.setInputListeners(value);
  }

  /**
   * See getInputListeners() for more information
   */
  get inputListeners() {
    return this.getInputListeners();
  }

  /**
   * Returns a copy of all of our input listeners.
   */
  getInputListeners() {
    return this._inputListeners.slice(0); // defensive copy
  }

  /**
   * Sets the CSS cursor string that should be used when the mouse is over this node. null is the default, and
   * indicates that ancestor nodes (or the browser default) should be used.
   *
   * @param cursor - A CSS cursor string, like 'pointer', or 'none' - Examples are:
   * auto default none inherit help pointer progress wait crosshair text vertical-text alias copy move no-drop not-allowed
   * e-resize n-resize w-resize s-resize nw-resize ne-resize se-resize sw-resize ew-resize ns-resize nesw-resize nwse-resize
   * context-menu cell col-resize row-resize all-scroll url( ... ) --> does it support data URLs?
   */
  setCursor(cursor) {
    // TODO: consider a mapping of types to set reasonable defaults https://github.com/phetsims/scenery/issues/1581

    // allow the 'auto' cursor type to let the ancestors or scene pick the cursor type
    this._cursor = cursor === 'auto' ? null : cursor;
  }

  /**
   * See setCursor() for more information
   */
  set cursor(value) {
    this.setCursor(value);
  }

  /**
   * See getCursor() for more information
   */
  get cursor() {
    return this.getCursor();
  }

  /**
   * Returns the CSS cursor string for this node, or null if there is no cursor specified.
   */
  getCursor() {
    return this._cursor;
  }

  /**
   * Returns the CSS cursor that could be applied either by this Node itself, or from any of its input listeners'
   * preferences. (scenery-internal)
   */
  getEffectiveCursor() {
    if (this._cursor) {
      return this._cursor;
    }
    for (let i = 0; i < this._inputListeners.length; i++) {
      const inputListener = this._inputListeners[i];
      if (inputListener.cursor) {
        return inputListener.cursor;
      }
    }
    return null;
  }

  /**
   * Sets the hit-tested mouse area for this Node (see constructor for more advanced documentation). Use null for the
   * default behavior.
   */
  setMouseArea(area) {
    assert && assert(area === null || area instanceof Shape || area instanceof Bounds2, 'mouseArea needs to be a phet.kite.Shape, phet.dot.Bounds2, or null');
    if (this._mouseArea !== area) {
      this._mouseArea = area; // TODO: could change what is under the mouse, invalidate! https://github.com/phetsims/scenery/issues/1581

      this._picker.onMouseAreaChange();
      if (assertSlow) {
        this._picker.audit();
      }
    }
    return this;
  }

  /**
   * See setMouseArea() for more information
   */
  set mouseArea(value) {
    this.setMouseArea(value);
  }

  /**
   * See getMouseArea() for more information
   */
  get mouseArea() {
    return this.getMouseArea();
  }

  /**
   * Returns the hit-tested mouse area for this node.
   */
  getMouseArea() {
    return this._mouseArea;
  }

  /**
   * Sets the hit-tested touch area for this Node (see constructor for more advanced documentation). Use null for the
   * default behavior.
   */
  setTouchArea(area) {
    assert && assert(area === null || area instanceof Shape || area instanceof Bounds2, 'touchArea needs to be a phet.kite.Shape, phet.dot.Bounds2, or null');
    if (this._touchArea !== area) {
      this._touchArea = area; // TODO: could change what is under the touch, invalidate! https://github.com/phetsims/scenery/issues/1581

      this._picker.onTouchAreaChange();
      if (assertSlow) {
        this._picker.audit();
      }
    }
    return this;
  }

  /**
   * See setTouchArea() for more information
   */
  set touchArea(value) {
    this.setTouchArea(value);
  }

  /**
   * See getTouchArea() for more information
   */
  get touchArea() {
    return this.getTouchArea();
  }

  /**
   * Returns the hit-tested touch area for this node.
   */
  getTouchArea() {
    return this._touchArea;
  }

  /**
   * Sets a clipped shape where only content in our local coordinate frame that is inside the clip area will be shown
   * (anything outside is fully transparent).
   */
  setClipArea(shape) {
    assert && assert(shape === null || shape instanceof Shape, 'clipArea needs to be a phet.kite.Shape, or null');
    if (this.clipArea !== shape) {
      this.clipAreaProperty.value = shape;
      this.invalidateBounds();
      this._picker.onClipAreaChange();
      if (assertSlow) {
        this._picker.audit();
      }
    }
  }

  /**
   * See setClipArea() for more information
   */
  set clipArea(value) {
    this.setClipArea(value);
  }

  /**
   * See getClipArea() for more information
   */
  get clipArea() {
    return this.getClipArea();
  }

  /**
   * Returns the clipped area for this node.
   */
  getClipArea() {
    return this.clipAreaProperty.value;
  }

  /**
   * Returns whether this Node has a clip area.
   */
  hasClipArea() {
    return this.clipArea !== null;
  }

  /**
   * Sets what self renderers (and other bitmask flags) are supported by this node.
   */
  setRendererBitmask(bitmask) {
    assert && assert(isFinite(bitmask));
    if (bitmask !== this._rendererBitmask) {
      this._rendererBitmask = bitmask;
      this._rendererSummary.selfChange();
      this.instanceRefreshEmitter.emit();
    }
  }

  /**
   * Meant to be overridden, so that it can be called to ensure that the renderer bitmask will be up-to-date.
   */
  invalidateSupportedRenderers() {
    // see docs
  }

  /*---------------------------------------------------------------------------*
   * Hints
   *----------------------------------------------------------------------------*/

  /**
   * When ANY hint changes, we refresh everything currently (for safety, this may be possible to make more specific
   * in the future, but hint changes are not particularly common performance bottleneck).
   */
  invalidateHint() {
    this.rendererSummaryRefreshEmitter.emit();
    this.instanceRefreshEmitter.emit();
  }

  /**
   * Sets a preferred renderer for this Node and its sub-tree. Scenery will attempt to use this renderer under here
   * unless it isn't supported, OR another preferred renderer is set as a closer ancestor. Acceptable values are:
   * - null (default, no preference)
   * - 'canvas'
   * - 'svg'
   * - 'dom'
   * - 'webgl'
   */
  setRenderer(renderer) {
    assert && assert(renderer === null || renderer === 'canvas' || renderer === 'svg' || renderer === 'dom' || renderer === 'webgl', 'Renderer input should be null, or one of: "canvas", "svg", "dom" or "webgl".');
    let newRenderer = 0;
    if (renderer === 'canvas') {
      newRenderer = Renderer.bitmaskCanvas;
    } else if (renderer === 'svg') {
      newRenderer = Renderer.bitmaskSVG;
    } else if (renderer === 'dom') {
      newRenderer = Renderer.bitmaskDOM;
    } else if (renderer === 'webgl') {
      newRenderer = Renderer.bitmaskWebGL;
    }
    assert && assert(renderer === null === (newRenderer === 0), 'We should only end up with no actual renderer if renderer is null');
    if (this._renderer !== newRenderer) {
      this._renderer = newRenderer;
      this.invalidateHint();
    }
  }

  /**
   * See setRenderer() for more information
   */
  set renderer(value) {
    this.setRenderer(value);
  }

  /**
   * See getRenderer() for more information
   */
  get renderer() {
    return this.getRenderer();
  }

  /**
   * Returns the preferred renderer (if any) of this node, as a string.
   */
  getRenderer() {
    if (this._renderer === 0) {
      return null;
    } else if (this._renderer === Renderer.bitmaskCanvas) {
      return 'canvas';
    } else if (this._renderer === Renderer.bitmaskSVG) {
      return 'svg';
    } else if (this._renderer === Renderer.bitmaskDOM) {
      return 'dom';
    } else if (this._renderer === Renderer.bitmaskWebGL) {
      return 'webgl';
    }
    assert && assert(false, 'Seems to be an invalid renderer?');
    return null;
  }

  /**
   * Sets whether or not Scenery will try to put this Node (and its descendants) into a separate SVG/Canvas/WebGL/etc.
   * layer, different from other siblings or other nodes. Can be used for performance purposes.
   */
  setLayerSplit(split) {
    if (split !== this._layerSplit) {
      this._layerSplit = split;
      this.invalidateHint();
    }
  }

  /**
   * See setLayerSplit() for more information
   */
  set layerSplit(value) {
    this.setLayerSplit(value);
  }

  /**
   * See isLayerSplit() for more information
   */
  get layerSplit() {
    return this.isLayerSplit();
  }

  /**
   * Returns whether the layerSplit performance flag is set.
   */
  isLayerSplit() {
    return this._layerSplit;
  }

  /**
   * Sets whether or not Scenery will take into account that this Node plans to use opacity. Can have performance
   * gains if there need to be multiple layers for this node's descendants.
   */
  setUsesOpacity(usesOpacity) {
    if (usesOpacity !== this._usesOpacity) {
      this._usesOpacity = usesOpacity;
      this.invalidateHint();
    }
  }

  /**
   * See setUsesOpacity() for more information
   */
  set usesOpacity(value) {
    this.setUsesOpacity(value);
  }

  /**
   * See getUsesOpacity() for more information
   */
  get usesOpacity() {
    return this.getUsesOpacity();
  }

  /**
   * Returns whether the usesOpacity performance flag is set.
   */
  getUsesOpacity() {
    return this._usesOpacity;
  }

  /**
   * Sets a flag for whether whether the contents of this Node and its children should be displayed in a separate
   * DOM element that is transformed with CSS transforms. It can have potential speedups, since the browser may not
   * have to re-rasterize contents when it is animated.
   */
  setCSSTransform(cssTransform) {
    if (cssTransform !== this._cssTransform) {
      this._cssTransform = cssTransform;
      this.invalidateHint();
    }
  }

  /**
   * See setCSSTransform() for more information
   */
  set cssTransform(value) {
    this.setCSSTransform(value);
  }

  /**
   * See isCSSTransformed() for more information
   */
  get cssTransform() {
    return this.isCSSTransformed();
  }

  /**
   * Returns whether the cssTransform performance flag is set.
   */
  isCSSTransformed() {
    return this._cssTransform;
  }

  /**
   * Sets a performance flag for whether layers/DOM elements should be excluded (or included) when things are
   * invisible. The default is false, and invisible content is in the DOM, but hidden.
   */
  setExcludeInvisible(excludeInvisible) {
    if (excludeInvisible !== this._excludeInvisible) {
      this._excludeInvisible = excludeInvisible;
      this.invalidateHint();
    }
  }

  /**
   * See setExcludeInvisible() for more information
   */
  set excludeInvisible(value) {
    this.setExcludeInvisible(value);
  }

  /**
   * See isExcludeInvisible() for more information
   */
  get excludeInvisible() {
    return this.isExcludeInvisible();
  }

  /**
   * Returns whether the excludeInvisible performance flag is set.
   */
  isExcludeInvisible() {
    return this._excludeInvisible;
  }

  /**
   * If this is set to true, child nodes that are invisible will NOT contribute to the bounds of this node.
   *
   * The default is for child nodes bounds' to be included in this node's bounds, but that would in general be a
   * problem for layout containers or other situations, see https://github.com/phetsims/joist/issues/608.
   */
  setExcludeInvisibleChildrenFromBounds(excludeInvisibleChildrenFromBounds) {
    if (excludeInvisibleChildrenFromBounds !== this._excludeInvisibleChildrenFromBounds) {
      this._excludeInvisibleChildrenFromBounds = excludeInvisibleChildrenFromBounds;
      this.invalidateBounds();
    }
  }

  /**
   * See setExcludeInvisibleChildrenFromBounds() for more information
   */
  set excludeInvisibleChildrenFromBounds(value) {
    this.setExcludeInvisibleChildrenFromBounds(value);
  }

  /**
   * See isExcludeInvisibleChildrenFromBounds() for more information
   */
  get excludeInvisibleChildrenFromBounds() {
    return this.isExcludeInvisibleChildrenFromBounds();
  }

  /**
   * Returns whether the excludeInvisibleChildrenFromBounds flag is set, see
   * setExcludeInvisibleChildrenFromBounds() for documentation.
   */
  isExcludeInvisibleChildrenFromBounds() {
    return this._excludeInvisibleChildrenFromBounds;
  }

  /**
   * Sets options that are provided to layout managers in order to customize positioning of this node.
   */
  setLayoutOptions(layoutOptions) {
    assert && assert(layoutOptions === null || typeof layoutOptions === 'object' && Object.getPrototypeOf(layoutOptions) === Object.prototype, 'layoutOptions should be null or an plain options-style object');
    if (layoutOptions !== this._layoutOptions) {
      this._layoutOptions = layoutOptions;
      this.layoutOptionsChangedEmitter.emit();
    }
  }
  set layoutOptions(value) {
    this.setLayoutOptions(value);
  }
  get layoutOptions() {
    return this.getLayoutOptions();
  }
  getLayoutOptions() {
    return this._layoutOptions;
  }
  mutateLayoutOptions(layoutOptions) {
    this.layoutOptions = optionize3()({}, this.layoutOptions || {}, layoutOptions);
  }

  // Defaults indicating that we don't mix in WidthSizable/HeightSizable
  get widthSizable() {
    return false;
  }
  get heightSizable() {
    return false;
  }
  get extendsWidthSizable() {
    return false;
  }
  get extendsHeightSizable() {
    return false;
  }
  get extendsSizable() {
    return false;
  }

  /**
   * Sets the preventFit performance flag.
   */
  setPreventFit(preventFit) {
    if (preventFit !== this._preventFit) {
      this._preventFit = preventFit;
      this.invalidateHint();
    }
  }

  /**
   * See setPreventFit() for more information
   */
  set preventFit(value) {
    this.setPreventFit(value);
  }

  /**
   * See isPreventFit() for more information
   */
  get preventFit() {
    return this.isPreventFit();
  }

  /**
   * Returns whether the preventFit performance flag is set.
   */
  isPreventFit() {
    return this._preventFit;
  }

  /**
   * Sets whether there is a custom WebGL scale applied to the Canvas, and if so what scale.
   */
  setWebGLScale(webglScale) {
    assert && assert(webglScale === null || typeof webglScale === 'number' && isFinite(webglScale));
    if (webglScale !== this._webglScale) {
      this._webglScale = webglScale;
      this.invalidateHint();
    }
  }

  /**
   * See setWebGLScale() for more information
   */
  set webglScale(value) {
    this.setWebGLScale(value);
  }

  /**
   * See getWebGLScale() for more information
   */
  get webglScale() {
    return this.getWebGLScale();
  }

  /**
   * Returns the value of the webglScale performance flag.
   */
  getWebGLScale() {
    return this._webglScale;
  }

  /*---------------------------------------------------------------------------*
   * Trail operations
   *----------------------------------------------------------------------------*/

  /**
   * Returns the one Trail that starts from a node with no parents (or if the predicate is present, a Node that
   * satisfies it), and ends at this node. If more than one Trail would satisfy these conditions, an assertion is
   * thrown (please use getTrails() for those cases).
   *
   * @param [predicate] - If supplied, we will only return trails rooted at a Node that satisfies predicate( node ) == true
   */
  getUniqueTrail(predicate) {
    // Without a predicate, we'll be able to bail out the instant we hit a Node with 2+ parents, and it makes the
    // logic easier.
    if (!predicate) {
      const trail = new Trail();

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let node = this; // eslint-disable-line consistent-this

      while (node) {
        assert && assert(node._parents.length <= 1, `getUniqueTrail found a Node with ${node._parents.length} parents.`);
        trail.addAncestor(node);
        node = node._parents[0]; // should be undefined if there aren't any parents
      }
      return trail;
    }
    // With a predicate, we need to explore multiple parents (since the predicate may filter out all but one)
    else {
      const trails = this.getTrails(predicate);
      assert && assert(trails.length === 1, `getUniqueTrail found ${trails.length} matching trails for the predicate`);
      return trails[0];
    }
  }

  /**
   * Returns a Trail rooted at rootNode and ends at this node. Throws an assertion if the number of trails that match
   * this condition isn't exactly 1.
   */
  getUniqueTrailTo(rootNode) {
    return this.getUniqueTrail(node => rootNode === node);
  }

  /**
   * Returns an array of all Trails that start from nodes with no parent (or if a predicate is present, those that
   * satisfy the predicate), and ends at this node.
   *
   * @param [predicate] - If supplied, we will only return Trails rooted at nodes that satisfy predicate( node ) == true.
   */
  getTrails(predicate) {
    predicate = predicate || Node.defaultTrailPredicate;
    const trails = [];
    const trail = new Trail(this);
    Trail.appendAncestorTrailsWithPredicate(trails, trail, predicate);
    return trails;
  }

  /**
   * Returns an array of all Trails rooted at rootNode and end at this node.
   */
  getTrailsTo(rootNode) {
    return this.getTrails(node => node === rootNode);
  }

  /**
   * Returns an array of all Trails rooted at this Node and end with nodes with no children (or if a predicate is
   * present, those that satisfy the predicate).
   *
   * @param [predicate] - If supplied, we will only return Trails ending at nodes that satisfy predicate( node ) == true.
   */
  getLeafTrails(predicate) {
    predicate = predicate || Node.defaultLeafTrailPredicate;
    const trails = [];
    const trail = new Trail(this);
    Trail.appendDescendantTrailsWithPredicate(trails, trail, predicate);
    return trails;
  }

  /**
   * Returns an array of all Trails rooted at this Node and end with leafNode.
   */
  getLeafTrailsTo(leafNode) {
    return this.getLeafTrails(node => node === leafNode);
  }

  /**
   * Returns a Trail rooted at this node and ending at a Node that has no children (or if a predicate is provided, a
   * Node that satisfies the predicate). If more than one trail matches this description, an assertion will be fired.
   *
   * @param [predicate] - If supplied, we will return a Trail that ends with a Node that satisfies predicate( node ) == true
   */
  getUniqueLeafTrail(predicate) {
    const trails = this.getLeafTrails(predicate);
    assert && assert(trails.length === 1, `getUniqueLeafTrail found ${trails.length} matching trails for the predicate`);
    return trails[0];
  }

  /**
   * Returns a Trail rooted at this Node and ending at leafNode. If more than one trail matches this description,
   * an assertion will be fired.
   */
  getUniqueLeafTrailTo(leafNode) {
    return this.getUniqueLeafTrail(node => node === leafNode);
  }

  /**
   * Returns all nodes in the connected component, returned in an arbitrary order, including nodes that are ancestors
   * of this node.
   */
  getConnectedNodes() {
    const result = [];
    let fresh = this._children.concat(this._parents).concat(this);
    while (fresh.length) {
      const node = fresh.pop();
      if (!_.includes(result, node)) {
        result.push(node);
        fresh = fresh.concat(node._children, node._parents);
      }
    }
    return result;
  }

  /**
   * Returns all nodes in the subtree with this Node as its root, returned in an arbitrary order. Like
   * getConnectedNodes, but doesn't include parents.
   */
  getSubtreeNodes() {
    const result = [];
    let fresh = this._children.concat(this);
    while (fresh.length) {
      const node = fresh.pop();
      if (!_.includes(result, node)) {
        result.push(node);
        fresh = fresh.concat(node._children);
      }
    }
    return result;
  }

  /**
   * Returns all nodes that are connected to this node, sorted in topological order.
   */
  getTopologicallySortedNodes() {
    // see http://en.wikipedia.org/wiki/Topological_sorting
    const edges = {};
    const s = [];
    const l = [];
    let n;
    _.each(this.getConnectedNodes(), node => {
      edges[node.id] = {};
      _.each(node._children, m => {
        edges[node.id][m.id] = true;
      });
      if (!node.parents.length) {
        s.push(node);
      }
    });
    function handleChild(m) {
      delete edges[n.id][m.id];
      if (_.every(edges, children => !children[m.id])) {
        // there are no more edges to m
        s.push(m);
      }
    }
    while (s.length) {
      n = s.pop();
      l.push(n);
      _.each(n._children, handleChild);
    }

    // ensure that there are no edges left, since then it would contain a circular reference
    assert && assert(_.every(edges, children => _.every(children, final => false)), 'circular reference check');
    return l;
  }

  /**
   * Returns whether this.addChild( child ) will not cause circular references.
   */
  canAddChild(child) {
    if (this === child || _.includes(this._children, child)) {
      return false;
    }

    // see http://en.wikipedia.org/wiki/Topological_sorting
    // TODO: remove duplication with above handling? https://github.com/phetsims/scenery/issues/1581
    const edges = {};
    const s = [];
    const l = [];
    let n;
    _.each(this.getConnectedNodes().concat(child.getConnectedNodes()), node => {
      edges[node.id] = {};
      _.each(node._children, m => {
        edges[node.id][m.id] = true;
      });
      if (!node.parents.length && node !== child) {
        s.push(node);
      }
    });
    edges[this.id][child.id] = true; // add in our 'new' edge
    function handleChild(m) {
      delete edges[n.id][m.id];
      if (_.every(edges, children => !children[m.id])) {
        // there are no more edges to m
        s.push(m);
      }
    }
    while (s.length) {
      n = s.pop();
      l.push(n);
      _.each(n._children, handleChild);

      // handle our new edge
      if (n === this) {
        handleChild(child);
      }
    }

    // ensure that there are no edges left, since then it would contain a circular reference
    return _.every(edges, children => _.every(children, final => false));
  }

  /**
   * To be overridden in paintable Node types. Should hook into the drawable's prototype (presumably).
   *
   * Draws the current Node's self representation, assuming the wrapper's Canvas context is already in the local
   * coordinate frame of this node.
   *
   * @param wrapper
   * @param matrix - The transformation matrix already applied to the context.
   */
  canvasPaintSelf(wrapper, matrix) {
    // See subclass for implementation
  }

  /**
   * Renders this Node only (its self) into the Canvas wrapper, in its local coordinate frame.
   *
   * @param wrapper
   * @param matrix - The transformation matrix already applied to the context.
   */
  renderToCanvasSelf(wrapper, matrix) {
    if (this.isPainted() && this._rendererBitmask & Renderer.bitmaskCanvas) {
      this.canvasPaintSelf(wrapper, matrix);
    }
  }

  /**
   * Renders this Node and its descendants into the Canvas wrapper.
   *
   * @param wrapper
   * @param [matrix] - Optional transform to be applied
   */
  renderToCanvasSubtree(wrapper, matrix) {
    matrix = matrix || Matrix3.identity();
    wrapper.resetStyles();
    this.renderToCanvasSelf(wrapper, matrix);
    for (let i = 0; i < this._children.length; i++) {
      const child = this._children[i];

      // Ignore invalid (empty) bounds, since this would show nothing (and we couldn't compute fitted bounds for it).
      if (child.isVisible() && child.bounds.isValid()) {
        // For anything filter-like, we'll need to create a Canvas, render our child's content into that Canvas,
        // and then (applying the filter) render that into the Canvas provided.
        const requiresScratchCanvas = child.effectiveOpacity !== 1 || child.clipArea || child._filters.length;
        wrapper.context.save();
        matrix.multiplyMatrix(child._transform.getMatrix());
        matrix.canvasSetTransform(wrapper.context);
        if (requiresScratchCanvas) {
          // We'll attempt to fit the Canvas to the content to minimize memory use, see
          // https://github.com/phetsims/function-builder/issues/148

          // We're going to ignore content outside our wrapper context's canvas.
          // Added padding and round-out for cases where Canvas bounds might not be fully accurate
          // The matrix already includes the child's transform (so we use localBounds).
          // We won't go outside our parent canvas' bounds, since this would be a waste of memory (wouldn't be written)
          // The round-out will make sure we have pixel alignment, so that we won't get blurs or aliasing/blitting
          // effects when copying things over.
          const childCanvasBounds = child.localBounds.transformed(matrix).dilate(4).roundOut().constrainBounds(scratchBounds2Extra.setMinMax(0, 0, wrapper.canvas.width, wrapper.canvas.height));
          if (childCanvasBounds.width > 0 && childCanvasBounds.height > 0) {
            const canvas = document.createElement('canvas');

            // We'll set our Canvas to the fitted width, and will handle the offsets below.
            canvas.width = childCanvasBounds.width;
            canvas.height = childCanvasBounds.height;
            const context = canvas.getContext('2d');
            const childWrapper = new CanvasContextWrapper(canvas, context);

            // After our ancestor transform is applied, we'll need to apply another offset for fitted Canvas. We'll
            // need to pass this to descendants AND apply it to the sub-context.
            const subMatrix = matrix.copy().prependTranslation(-childCanvasBounds.minX, -childCanvasBounds.minY);
            subMatrix.canvasSetTransform(context);
            child.renderToCanvasSubtree(childWrapper, subMatrix);
            wrapper.context.save();
            if (child.clipArea) {
              wrapper.context.beginPath();
              child.clipArea.writeToContext(wrapper.context);
              wrapper.context.clip();
            }
            wrapper.context.setTransform(1, 0, 0, 1, 0, 0); // identity
            wrapper.context.globalAlpha = child.effectiveOpacity;
            let setFilter = false;
            if (child._filters.length) {
              // Filters shouldn't be too often, so less concerned about the GC here (and this is so much easier to read).
              // Performance bottleneck for not using this fallback style, so we're allowing it for Chrome even though
              // the visual differences may be present, see https://github.com/phetsims/scenery/issues/1139
              if (Features.canvasFilter && _.every(child._filters, filter => filter.isDOMCompatible())) {
                wrapper.context.filter = child._filters.map(filter => filter.getCSSFilterString()).join(' ');
                setFilter = true;
              } else {
                child._filters.forEach(filter => filter.applyCanvasFilter(childWrapper));
              }
            }

            // The inverse transform is applied to handle fitting
            wrapper.context.drawImage(canvas, childCanvasBounds.minX, childCanvasBounds.minY);
            wrapper.context.restore();
            if (setFilter) {
              wrapper.context.filter = 'none';
            }
          }
        } else {
          child.renderToCanvasSubtree(wrapper, matrix);
        }
        matrix.multiplyMatrix(child._transform.getInverse());
        wrapper.context.restore();
      }
    }
  }

  /**
   * @deprecated
   * Render this Node to the Canvas (clearing it first)
   */
  renderToCanvas(canvas, context, callback, backgroundColor) {
    assert && deprecationWarning('Node.renderToCanvas() is deprecated, please use Node.rasterized() instead');

    // should basically reset everything (and clear the Canvas)
    canvas.width = canvas.width; // eslint-disable-line no-self-assign

    if (backgroundColor) {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    const wrapper = new CanvasContextWrapper(canvas, context);
    this.renderToCanvasSubtree(wrapper, Matrix3.identity());
    callback && callback(); // this was originally asynchronous, so we had a callback
  }

  /**
   * Renders this Node to an HTMLCanvasElement. If toCanvas( callback ) is used, the canvas will contain the node's
   * entire bounds (if no x/y/width/height is provided)
   *
   * @param callback - callback( canvas, x, y, width, height ) is called, where x,y are computed if not specified.
   * @param [x] - The X offset for where the upper-left of the content drawn into the Canvas
   * @param [y] - The Y offset for where the upper-left of the content drawn into the Canvas
   * @param [width] - The width of the Canvas output
   * @param [height] - The height of the Canvas output
   */
  toCanvas(callback, x, y, width, height) {
    assert && assert(x === undefined || typeof x === 'number', 'If provided, x should be a number');
    assert && assert(y === undefined || typeof y === 'number', 'If provided, y should be a number');
    assert && assert(width === undefined || typeof width === 'number' && width >= 0 && width % 1 === 0, 'If provided, width should be a non-negative integer');
    assert && assert(height === undefined || typeof height === 'number' && height >= 0 && height % 1 === 0, 'If provided, height should be a non-negative integer');
    const padding = 2; // padding used if x and y are not set

    // for now, we add an unpleasant hack around Text and safe bounds in general. We don't want to add another Bounds2 object per Node for now.
    const bounds = this.getBounds().union(this.localToParentBounds(this.getSafeSelfBounds()));
    assert && assert(!bounds.isEmpty() || x !== undefined && y !== undefined && width !== undefined && height !== undefined, 'Should not call toCanvas on a Node with empty bounds, unless all dimensions are provided');
    x = x !== undefined ? x : Math.ceil(padding - bounds.minX);
    y = y !== undefined ? y : Math.ceil(padding - bounds.minY);
    width = width !== undefined ? width : Math.ceil(bounds.getWidth() + 2 * padding);
    height = height !== undefined ? height : Math.ceil(bounds.getHeight() + 2 * padding);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');

    // shift our rendering over by the desired amount
    context.translate(x, y);

    // for API compatibility, we apply our own transform here
    this._transform.getMatrix().canvasAppendTransform(context);
    const wrapper = new CanvasContextWrapper(canvas, context);
    this.renderToCanvasSubtree(wrapper, Matrix3.translation(x, y).timesMatrix(this._transform.getMatrix()));
    callback(canvas, x, y, width, height); // we used to be asynchronous
  }

  /**
   * Renders this Node to a Canvas, then calls the callback with the data URI from it.
   *
   * @param callback - callback( dataURI {string}, x, y, width, height ) is called, where x,y are computed if not specified.
   * @param [x] - The X offset for where the upper-left of the content drawn into the Canvas
   * @param [y] - The Y offset for where the upper-left of the content drawn into the Canvas
   * @param [width] - The width of the Canvas output
   * @param [height] - The height of the Canvas output
   */
  toDataURL(callback, x, y, width, height) {
    assert && assert(x === undefined || typeof x === 'number', 'If provided, x should be a number');
    assert && assert(y === undefined || typeof y === 'number', 'If provided, y should be a number');
    assert && assert(width === undefined || typeof width === 'number' && width >= 0 && width % 1 === 0, 'If provided, width should be a non-negative integer');
    assert && assert(height === undefined || typeof height === 'number' && height >= 0 && height % 1 === 0, 'If provided, height should be a non-negative integer');
    this.toCanvas((canvas, x, y, width, height) => {
      // this x and y shadow the outside parameters, and will be different if the outside parameters are undefined
      callback(canvas.toDataURL(), x, y, width, height);
    }, x, y, width, height);
  }

  /**
   * Calls the callback with an HTMLImageElement that contains this Node's subtree's visual form.
   * Will always be asynchronous.
   * @deprecated - Use node.rasterized() for creating a rasterized copy, or generally it's best to get the data
   *               URL instead directly.
   *
   * @param callback - callback( image {HTMLImageElement}, x, y ) is called
   * @param [x] - The X offset for where the upper-left of the content drawn into the Canvas
   * @param [y] - The Y offset for where the upper-left of the content drawn into the Canvas
   * @param [width] - The width of the Canvas output
   * @param [height] - The height of the Canvas output
   */
  toImage(callback, x, y, width, height) {
    assert && deprecationWarning('Node.toImage() is deprecated, please use Node.rasterized() instead');
    assert && assert(x === undefined || typeof x === 'number', 'If provided, x should be a number');
    assert && assert(y === undefined || typeof y === 'number', 'If provided, y should be a number');
    assert && assert(width === undefined || typeof width === 'number' && width >= 0 && width % 1 === 0, 'If provided, width should be a non-negative integer');
    assert && assert(height === undefined || typeof height === 'number' && height >= 0 && height % 1 === 0, 'If provided, height should be a non-negative integer');
    this.toDataURL((url, x, y) => {
      // this x and y shadow the outside parameters, and will be different if the outside parameters are undefined
      const img = document.createElement('img');
      img.onload = () => {
        callback(img, x, y);
        try {
          // @ts-expect-error - I believe we need to delete this
          delete img.onload;
        } catch (e) {
          // do nothing
        } // fails on Safari 5.1
      };
      img.src = url;
    }, x, y, width, height);
  }

  /**
   * Calls the callback with an Image Node that contains this Node's subtree's visual form. This is always
   * asynchronous, but the resulting image Node can be used with any back-end (Canvas/WebGL/SVG/etc.)
   * @deprecated - Use node.rasterized() instead (should avoid the asynchronous-ness)
   *
   * @param callback - callback( imageNode {Image} ) is called
   * @param [x] - The X offset for where the upper-left of the content drawn into the Canvas
   * @param [y] - The Y offset for where the upper-left of the content drawn into the Canvas
   * @param [width] - The width of the Canvas output
   * @param [height] - The height of the Canvas output
   */
  toImageNodeAsynchronous(callback, x, y, width, height) {
    assert && deprecationWarning('Node.toImageNodeAsyncrhonous() is deprecated, please use Node.rasterized() instead');
    assert && assert(x === undefined || typeof x === 'number', 'If provided, x should be a number');
    assert && assert(y === undefined || typeof y === 'number', 'If provided, y should be a number');
    assert && assert(width === undefined || typeof width === 'number' && width >= 0 && width % 1 === 0, 'If provided, width should be a non-negative integer');
    assert && assert(height === undefined || typeof height === 'number' && height >= 0 && height % 1 === 0, 'If provided, height should be a non-negative integer');
    this.toImage((image, x, y) => {
      callback(new Node({
        // eslint-disable-line no-html-constructors
        children: [new Image(image, {
          x: -x,
          y: -y
        })]
      }));
    }, x, y, width, height);
  }

  /**
   * Creates a Node containing an Image Node that contains this Node's subtree's visual form. This is always
   * synchronous, but the resulting image Node can ONLY used with Canvas/WebGL (NOT SVG).
   * @deprecated - Use node.rasterized() instead, should be mostly equivalent if useCanvas:true is provided.
   *
   * @param [x] - The X offset for where the upper-left of the content drawn into the Canvas
   * @param [y] - The Y offset for where the upper-left of the content drawn into the Canvas
   * @param [width] - The width of the Canvas output
   * @param [height] - The height of the Canvas output
   */
  toCanvasNodeSynchronous(x, y, width, height) {
    assert && deprecationWarning('Node.toCanvasNodeSynchronous() is deprecated, please use Node.rasterized() instead');
    assert && assert(x === undefined || typeof x === 'number', 'If provided, x should be a number');
    assert && assert(y === undefined || typeof y === 'number', 'If provided, y should be a number');
    assert && assert(width === undefined || typeof width === 'number' && width >= 0 && width % 1 === 0, 'If provided, width should be a non-negative integer');
    assert && assert(height === undefined || typeof height === 'number' && height >= 0 && height % 1 === 0, 'If provided, height should be a non-negative integer');
    let result = null;
    this.toCanvas((canvas, x, y) => {
      result = new Node({
        // eslint-disable-line no-html-constructors
        children: [new Image(canvas, {
          x: -x,
          y: -y
        })]
      });
    }, x, y, width, height);
    assert && assert(result, 'toCanvasNodeSynchronous requires that the node can be rendered only using Canvas');
    return result;
  }

  /**
   * Returns an Image that renders this Node. This is always synchronous, and sets initialWidth/initialHeight so that
   * we have the bounds immediately.  Use this method if you need to reduce the number of parent Nodes.
   *
   * NOTE: the resultant Image should be positioned using its bounds rather than (x,y).  To create a Node that can be
   * positioned like any other node, please use toDataURLNodeSynchronous.
   * @deprecated - Use node.rasterized() instead, should be mostly equivalent if wrap:false is provided.
   *
   * @param [x] - The X offset for where the upper-left of the content drawn into the Canvas
   * @param [y] - The Y offset for where the upper-left of the content drawn into the Canvas
   * @param [width] - The width of the Canvas output
   * @param [height] - The height of the Canvas output
   */
  toDataURLImageSynchronous(x, y, width, height) {
    assert && deprecationWarning('Node.toDataURLImageSychronous() is deprecated, please use Node.rasterized() instead');
    assert && assert(x === undefined || typeof x === 'number', 'If provided, x should be a number');
    assert && assert(y === undefined || typeof y === 'number', 'If provided, y should be a number');
    assert && assert(width === undefined || typeof width === 'number' && width >= 0 && width % 1 === 0, 'If provided, width should be a non-negative integer');
    assert && assert(height === undefined || typeof height === 'number' && height >= 0 && height % 1 === 0, 'If provided, height should be a non-negative integer');
    let result = null;
    this.toDataURL((dataURL, x, y, width, height) => {
      result = new Image(dataURL, {
        x: -x,
        y: -y,
        initialWidth: width,
        initialHeight: height
      });
    }, x, y, width, height);
    assert && assert(result, 'toDataURL failed to return a result synchronously');
    return result;
  }

  /**
   * Returns a Node that contains this Node's subtree's visual form. This is always synchronous, and sets
   * initialWidth/initialHeight so that we have the bounds immediately.  An extra wrapper Node is provided
   * so that transforms can be done independently.  Use this method if you need to be able to transform the node
   * the same way as if it had not been rasterized.
   * @deprecated - Use node.rasterized() instead, should be mostly equivalent
   *
   * @param [x] - The X offset for where the upper-left of the content drawn into the Canvas
   * @param [y] - The Y offset for where the upper-left of the content drawn into the Canvas
   * @param [width] - The width of the Canvas output
   * @param [height] - The height of the Canvas output
   */
  toDataURLNodeSynchronous(x, y, width, height) {
    assert && deprecationWarning('Node.toDataURLNodeSynchronous() is deprecated, please use Node.rasterized() instead');
    assert && assert(x === undefined || typeof x === 'number', 'If provided, x should be a number');
    assert && assert(y === undefined || typeof y === 'number', 'If provided, y should be a number');
    assert && assert(width === undefined || typeof width === 'number' && width >= 0 && width % 1 === 0, 'If provided, width should be a non-negative integer');
    assert && assert(height === undefined || typeof height === 'number' && height >= 0 && height % 1 === 0, 'If provided, height should be a non-negative integer');
    return new Node({
      // eslint-disable-line no-html-constructors
      children: [this.toDataURLImageSynchronous(x, y, width, height)]
    });
  }

  /**
   * Returns a Node (backed by a scenery Image) that is a rasterized version of this node.
   *
   * @param [options] - See below options. This is also passed directly to the created Image object.
   */
  rasterized(providedOptions) {
    const options = optionize()({
      resolution: 1,
      sourceBounds: null,
      useTargetBounds: true,
      wrap: true,
      useCanvas: false,
      imageOptions: {}
    }, providedOptions);
    const resolution = options.resolution;
    const sourceBounds = options.sourceBounds;
    if (assert) {
      assert(typeof resolution === 'number' && resolution > 0, 'resolution should be a positive number');
      assert(sourceBounds === null || sourceBounds instanceof Bounds2, 'sourceBounds should be null or a Bounds2');
      if (sourceBounds) {
        assert(sourceBounds.isValid(), 'sourceBounds should be valid (finite non-negative)');
        assert(Number.isInteger(sourceBounds.width), 'sourceBounds.width should be an integer');
        assert(Number.isInteger(sourceBounds.height), 'sourceBounds.height should be an integer');
      }
    }

    // We'll need to wrap it in a container Node temporarily (while rasterizing) for the scale
    const wrapperNode = new Node({
      // eslint-disable-line no-html-constructors
      scale: resolution,
      children: [this]
    });
    let transformedBounds = sourceBounds || this.getSafeTransformedVisibleBounds().dilated(2).roundedOut();

    // Unfortunately if we provide a resolution AND bounds, we can't use the source bounds directly.
    if (resolution !== 1) {
      transformedBounds = new Bounds2(resolution * transformedBounds.minX, resolution * transformedBounds.minY, resolution * transformedBounds.maxX, resolution * transformedBounds.maxY);
      // Compensate for non-integral transformedBounds after our resolution transform
      if (transformedBounds.width % 1 !== 0) {
        transformedBounds.maxX += 1 - transformedBounds.width % 1;
      }
      if (transformedBounds.height % 1 !== 0) {
        transformedBounds.maxY += 1 - transformedBounds.height % 1;
      }
    }
    let image = null;

    // NOTE: This callback is executed SYNCHRONOUSLY
    function callback(canvas, x, y, width, height) {
      const imageSource = options.useCanvas ? canvas : canvas.toDataURL();
      image = new Image(imageSource, combineOptions({}, options.imageOptions, {
        x: -x,
        y: -y,
        initialWidth: width,
        initialHeight: height
      }));

      // We need to prepend the scale due to order of operations
      image.scale(1 / resolution, 1 / resolution, true);
    }

    // NOTE: Rounding necessary due to floating point arithmetic in the width/height computation of the bounds
    wrapperNode.toCanvas(callback, -transformedBounds.minX, -transformedBounds.minY, Utils.roundSymmetric(transformedBounds.width), Utils.roundSymmetric(transformedBounds.height));
    assert && assert(image, 'The toCanvas should have executed synchronously');
    wrapperNode.dispose();

    // For our useTargetBounds option, we do NOT want to include any "safe" bounds, and instead want to stay true to
    // the original bounds. We do filter out invisible subtrees to set the bounds.
    let finalParentBounds = this.getVisibleBounds();
    if (sourceBounds) {
      // If we provide sourceBounds, don't have resulting bounds that go outside.
      finalParentBounds = sourceBounds.intersection(finalParentBounds);
    }
    if (options.useTargetBounds) {
      image.imageBounds = image.parentToLocalBounds(finalParentBounds);
    }
    if (options.wrap) {
      const wrappedNode = new Node({
        children: [image]
      }); // eslint-disable-line no-html-constructors
      if (options.useTargetBounds) {
        wrappedNode.localBounds = finalParentBounds;
      }
      return wrappedNode;
    } else {
      if (options.useTargetBounds) {
        image.localBounds = image.parentToLocalBounds(finalParentBounds);
      }
      return image;
    }
  }

  /**
   * Creates a DOM drawable for this Node's self representation. (scenery-internal)
   *
   * Implemented by subtypes that support DOM self drawables. There is no need to implement this for subtypes that
   * do not allow the DOM renderer (not set in its rendererBitmask).
   *
   * @param renderer - In the bitmask format specified by Renderer, which may contain additional bit flags.
   * @param instance - Instance object that will be associated with the drawable
   */
  createDOMDrawable(renderer, instance) {
    throw new Error('createDOMDrawable is abstract. The subtype should either override this method, or not support the DOM renderer');
  }

  /**
   * Creates an SVG drawable for this Node's self representation. (scenery-internal)
   *
   * Implemented by subtypes that support SVG self drawables. There is no need to implement this for subtypes that
   * do not allow the SVG renderer (not set in its rendererBitmask).
   *
   * @param renderer - In the bitmask format specified by Renderer, which may contain additional bit flags.
   * @param instance - Instance object that will be associated with the drawable
   */
  createSVGDrawable(renderer, instance) {
    throw new Error('createSVGDrawable is abstract. The subtype should either override this method, or not support the DOM renderer');
  }

  /**
   * Creates a Canvas drawable for this Node's self representation. (scenery-internal)
   *
   * Implemented by subtypes that support Canvas self drawables. There is no need to implement this for subtypes that
   * do not allow the Canvas renderer (not set in its rendererBitmask).
   *
   * @param renderer - In the bitmask format specified by Renderer, which may contain additional bit flags.
   * @param instance - Instance object that will be associated with the drawable
   */
  createCanvasDrawable(renderer, instance) {
    throw new Error('createCanvasDrawable is abstract. The subtype should either override this method, or not support the DOM renderer');
  }

  /**
   * Creates a WebGL drawable for this Node's self representation. (scenery-internal)
   *
   * Implemented by subtypes that support WebGL self drawables. There is no need to implement this for subtypes that
   * do not allow the WebGL renderer (not set in its rendererBitmask).
   *
   * @param renderer - In the bitmask format specified by Renderer, which may contain additional bit flags.
   * @param instance - Instance object that will be associated with the drawable
   */
  createWebGLDrawable(renderer, instance) {
    throw new Error('createWebGLDrawable is abstract. The subtype should either override this method, or not support the DOM renderer');
  }

  /*---------------------------------------------------------------------------*
   * Instance handling
   *----------------------------------------------------------------------------*/

  /**
   * Returns a reference to the instances array. (scenery-internal)
   */
  getInstances() {
    return this._instances;
  }

  /**
   * See getInstances() for more information (scenery-internal)
   */
  get instances() {
    return this.getInstances();
  }

  /**
   * Adds an Instance reference to our array. (scenery-internal)
   */
  addInstance(instance) {
    this._instances.push(instance);
    this.changedInstanceEmitter.emit(instance, true);
  }

  /**
   * Removes an Instance reference from our array. (scenery-internal)
   */
  removeInstance(instance) {
    const index = _.indexOf(this._instances, instance);
    assert && assert(index !== -1, 'Cannot remove a Instance from a Node if it was not there');
    this._instances.splice(index, 1);
    this.changedInstanceEmitter.emit(instance, false);
  }

  /**
   * Returns whether this Node was visually rendered/displayed by any Display in the last updateDisplay() call. Note
   * that something can be independently displayed visually, and in the PDOM; this method only checks visually.
   *
   * @param [display] - if provided, only check if was visible on this particular Display
   */
  wasVisuallyDisplayed(display) {
    for (let i = 0; i < this._instances.length; i++) {
      const instance = this._instances[i];

      // If no display is provided, any instance visibility is enough to be visually displayed
      if (instance.visible && (!display || instance.display === display)) {
        return true;
      }
    }
    return false;
  }

  /*---------------------------------------------------------------------------*
   * Display handling
   *----------------------------------------------------------------------------*/

  /**
   * Returns a reference to the display array. (scenery-internal)
   */
  getRootedDisplays() {
    return this._rootedDisplays;
  }

  /**
   * See getRootedDisplays() for more information (scenery-internal)
   */
  get rootedDisplays() {
    return this.getRootedDisplays();
  }

  /**
   * Adds an display reference to our array. (scenery-internal)
   */
  addRootedDisplay(display) {
    this._rootedDisplays.push(display);

    // Defined in ParallelDOM.js
    this._pdomDisplaysInfo.onAddedRootedDisplay(display);
    this.rootedDisplayChangedEmitter.emit(display);
  }

  /**
   * Removes a Display reference from our array. (scenery-internal)
   */
  removeRootedDisplay(display) {
    const index = _.indexOf(this._rootedDisplays, display);
    assert && assert(index !== -1, 'Cannot remove a Display from a Node if it was not there');
    this._rootedDisplays.splice(index, 1);

    // Defined in ParallelDOM.js
    this._pdomDisplaysInfo.onRemovedRootedDisplay(display);
    this.rootedDisplayChangedEmitter.emit(display);
  }
  getRecursiveConnectedDisplays(displays) {
    if (this.rootedDisplays.length) {
      displays.push(...this.rootedDisplays);
    }
    for (let i = 0; i < this._parents.length; i++) {
      displays.push(...this._parents[i].getRecursiveConnectedDisplays(displays));
    }

    // do not allow duplicate Displays to get collected infinitely
    return _.uniq(displays);
  }

  /**
   * Get a list of the displays that are connected to this Node. Gathered by looking up the scene graph ancestors and
   * collected all rooted Displays along the way.
   */
  getConnectedDisplays() {
    return _.uniq(this.getRecursiveConnectedDisplays([]));
  }

  /*---------------------------------------------------------------------------*
   * Coordinate transform methods
   *----------------------------------------------------------------------------*/

  /**
   * Returns a point transformed from our local coordinate frame into our parent coordinate frame. Applies our node's
   * transform to it.
   */
  localToParentPoint(point) {
    return this._transform.transformPosition2(point);
  }

  /**
   * Returns bounds transformed from our local coordinate frame into our parent coordinate frame. If it includes a
   * rotation, the resulting bounding box will include every point that could have been in the original bounding box
   * (and it can be expanded).
   */
  localToParentBounds(bounds) {
    return this._transform.transformBounds2(bounds);
  }

  /**
   * Returns a point transformed from our parent coordinate frame into our local coordinate frame. Applies the inverse
   * of our node's transform to it.
   */
  parentToLocalPoint(point) {
    return this._transform.inversePosition2(point);
  }

  /**
   * Returns bounds transformed from our parent coordinate frame into our local coordinate frame. If it includes a
   * rotation, the resulting bounding box will include every point that could have been in the original bounding box
   * (and it can be expanded).
   */
  parentToLocalBounds(bounds) {
    return this._transform.inverseBounds2(bounds);
  }

  /**
   * A mutable-optimized form of localToParentBounds() that will modify the provided bounds, transforming it from our
   * local coordinate frame to our parent coordinate frame.
   * @returns - The same bounds object.
   */
  transformBoundsFromLocalToParent(bounds) {
    return bounds.transform(this._transform.getMatrix());
  }

  /**
   * A mutable-optimized form of parentToLocalBounds() that will modify the provided bounds, transforming it from our
   * parent coordinate frame to our local coordinate frame.
   * @returns - The same bounds object.
   */
  transformBoundsFromParentToLocal(bounds) {
    return bounds.transform(this._transform.getInverse());
  }

  /**
   * Returns a new matrix (fresh copy) that would transform points from our local coordinate frame to the global
   * coordinate frame.
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  getLocalToGlobalMatrix() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node = this; // eslint-disable-line consistent-this

    // we need to apply the transformations in the reverse order, so we temporarily store them
    const matrices = [];

    // concatenation like this has been faster than getting a unique trail, getting its transform, and applying it
    while (node) {
      matrices.push(node._transform.getMatrix());
      assert && assert(node._parents[1] === undefined, 'getLocalToGlobalMatrix unable to work for DAG');
      node = node._parents[0];
    }
    const matrix = Matrix3.identity(); // will be modified in place

    // iterate from the back forwards (from the root Node to here)
    for (let i = matrices.length - 1; i >= 0; i--) {
      matrix.multiplyMatrix(matrices[i]);
    }

    // NOTE: always return a fresh copy, getGlobalToLocalMatrix depends on it to minimize instance usage!
    return matrix;
  }

  /**
   * Returns a Transform3 that would transform things from our local coordinate frame to the global coordinate frame.
   * Equivalent to getUniqueTrail().getTransform(), but faster.
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  getUniqueTransform() {
    return new Transform3(this.getLocalToGlobalMatrix());
  }

  /**
   * Returns a new matrix (fresh copy) that would transform points from the global coordinate frame to our local
   * coordinate frame.
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  getGlobalToLocalMatrix() {
    return this.getLocalToGlobalMatrix().invert();
  }

  /**
   * Transforms a point from our local coordinate frame to the global coordinate frame.
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  localToGlobalPoint(point) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node = this; // eslint-disable-line consistent-this
    const resultPoint = point.copy();
    while (node) {
      // in-place multiplication
      node._transform.getMatrix().multiplyVector2(resultPoint);
      assert && assert(node._parents[1] === undefined, 'localToGlobalPoint unable to work for DAG');
      node = node._parents[0];
    }
    return resultPoint;
  }

  /**
   * Transforms a point from the global coordinate frame to our local coordinate frame.
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  globalToLocalPoint(point) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node = this; // eslint-disable-line consistent-this
    // TODO: performance: test whether it is faster to get a total transform and then invert (won't compute individual inverses) https://github.com/phetsims/scenery/issues/1581

    // we need to apply the transformations in the reverse order, so we temporarily store them
    const transforms = [];
    while (node) {
      transforms.push(node._transform);
      assert && assert(node._parents[1] === undefined, 'globalToLocalPoint unable to work for DAG');
      node = node._parents[0];
    }

    // iterate from the back forwards (from the root Node to here)
    const resultPoint = point.copy();
    for (let i = transforms.length - 1; i >= 0; i--) {
      // in-place multiplication
      transforms[i].getInverse().multiplyVector2(resultPoint);
    }
    return resultPoint;
  }

  /**
   * Transforms bounds from our local coordinate frame to the global coordinate frame. If it includes a
   * rotation, the resulting bounding box will include every point that could have been in the original bounding box
   * (and it can be expanded).
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  localToGlobalBounds(bounds) {
    // apply the bounds transform only once, so we can minimize the expansion encountered from multiple rotations
    // it also seems to be a bit faster this way
    return bounds.transformed(this.getLocalToGlobalMatrix());
  }

  /**
   * Transforms bounds from the global coordinate frame to our local coordinate frame. If it includes a
   * rotation, the resulting bounding box will include every point that could have been in the original bounding box
   * (and it can be expanded).
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  globalToLocalBounds(bounds) {
    // apply the bounds transform only once, so we can minimize the expansion encountered from multiple rotations
    return bounds.transformed(this.getGlobalToLocalMatrix());
  }

  /**
   * Transforms a point from our parent coordinate frame to the global coordinate frame.
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  parentToGlobalPoint(point) {
    assert && assert(this.parents.length <= 1, 'parentToGlobalPoint unable to work for DAG');
    return this.parents.length ? this.parents[0].localToGlobalPoint(point) : point;
  }

  /**
   * Transforms bounds from our parent coordinate frame to the global coordinate frame. If it includes a
   * rotation, the resulting bounding box will include every point that could have been in the original bounding box
   * (and it can be expanded).
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  parentToGlobalBounds(bounds) {
    assert && assert(this.parents.length <= 1, 'parentToGlobalBounds unable to work for DAG');
    return this.parents.length ? this.parents[0].localToGlobalBounds(bounds) : bounds;
  }

  /**
   * Transforms a point from the global coordinate frame to our parent coordinate frame.
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  globalToParentPoint(point) {
    assert && assert(this.parents.length <= 1, 'globalToParentPoint unable to work for DAG');
    return this.parents.length ? this.parents[0].globalToLocalPoint(point) : point;
  }

  /**
   * Transforms bounds from the global coordinate frame to our parent coordinate frame. If it includes a
   * rotation, the resulting bounding box will include every point that could have been in the original bounding box
   * (and it can be expanded).
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   */
  globalToParentBounds(bounds) {
    assert && assert(this.parents.length <= 1, 'globalToParentBounds unable to work for DAG');
    return this.parents.length ? this.parents[0].globalToLocalBounds(bounds) : bounds;
  }

  /**
   * Returns a bounding box for this Node (and its sub-tree) in the global coordinate frame.
   *
   * NOTE: If there are multiple instances of this Node (e.g. this or one ancestor has two parents), it will fail
   * with an assertion (since the transform wouldn't be uniquely defined).
   *
   * NOTE: This requires computation of this node's subtree bounds, which may incur some performance loss.
   */
  getGlobalBounds() {
    assert && assert(this.parents.length <= 1, 'globalBounds unable to work for DAG');
    return this.parentToGlobalBounds(this.getBounds());
  }

  /**
   * See getGlobalBounds() for more information
   */
  get globalBounds() {
    return this.getGlobalBounds();
  }

  /**
   * Returns the bounds of any other Node in our local coordinate frame.
   *
   * NOTE: If this node or the passed in Node have multiple instances (e.g. this or one ancestor has two parents), it will fail
   * with an assertion.
   *
   * TODO: Possible to be well-defined and have multiple instances of each. https://github.com/phetsims/scenery/issues/1581
   */
  boundsOf(node) {
    return this.globalToLocalBounds(node.getGlobalBounds());
  }

  /**
   * Returns the bounds of this Node in another node's local coordinate frame.
   *
   * NOTE: If this node or the passed in Node have multiple instances (e.g. this or one ancestor has two parents), it will fail
   * with an assertion.
   *
   * TODO: Possible to be well-defined and have multiple instances of each. https://github.com/phetsims/scenery/issues/1581
   */
  boundsTo(node) {
    return node.globalToLocalBounds(this.getGlobalBounds());
  }

  /*---------------------------------------------------------------------------*
   * Drawable handling
   *----------------------------------------------------------------------------*/

  /**
   * Adds the drawable to our list of drawables to notify of visual changes. (scenery-internal)
   */
  attachDrawable(drawable) {
    this._drawables.push(drawable);
    return this; // allow chaining
  }

  /**
   * Removes the drawable from our list of drawables to notify of visual changes. (scenery-internal)
   */
  detachDrawable(drawable) {
    const index = _.indexOf(this._drawables, drawable);
    assert && assert(index >= 0, 'Invalid operation: trying to detach a non-referenced drawable');
    this._drawables.splice(index, 1); // TODO: replace with a remove() function https://github.com/phetsims/scenery/issues/1581
    return this;
  }

  /**
   * Scans the options object for key names that correspond to ES5 setters or other setter functions, and calls those
   * with the values.
   *
   * For example:
   *
   * node.mutate( { top: 0, left: 5 } );
   *
   * will be equivalent to:
   *
   * node.left = 5;
   * node.top = 0;
   *
   * In particular, note that the order is different. Mutators will be applied in the order of _mutatorKeys, which can
   * be added to by subtypes.
   *
   * Additionally, some keys are actually direct function names, like 'scale'. mutate( { scale: 2 } ) will call
   * node.scale( 2 ) instead of activating an ES5 setter directly.
   */
  mutate(options) {
    if (!options) {
      return this;
    }
    assert && assert(Object.getPrototypeOf(options) === Object.prototype, 'Extra prototype on Node options object is a code smell');

    // @ts-expect-error
    assert && assert(_.filter(['translation', 'x', 'left', 'right', 'centerX', 'centerTop', 'rightTop', 'leftCenter', 'center', 'rightCenter', 'leftBottom', 'centerBottom', 'rightBottom'], key => options[key] !== undefined).length <= 1, `More than one mutation on this Node set the x component, check ${Object.keys(options).join(',')}`);

    // @ts-expect-error
    assert && assert(_.filter(['translation', 'y', 'top', 'bottom', 'centerY', 'centerTop', 'rightTop', 'leftCenter', 'center', 'rightCenter', 'leftBottom', 'centerBottom', 'rightBottom'], key => options[key] !== undefined).length <= 1, `More than one mutation on this Node set the y component, check ${Object.keys(options).join(',')}`);
    if (assert && options.hasOwnProperty('enabled') && options.hasOwnProperty('enabledProperty')) {
      assert && assert(options.enabledProperty.value === options.enabled, 'If both enabled and enabledProperty are provided, then values should match');
    }
    if (assert && options.hasOwnProperty('inputEnabled') && options.hasOwnProperty('inputEnabledProperty')) {
      assert && assert(options.inputEnabledProperty.value === options.inputEnabled, 'If both inputEnabled and inputEnabledProperty are provided, then values should match');
    }
    if (assert && options.hasOwnProperty('visible') && options.hasOwnProperty('visibleProperty')) {
      assert && assert(options.visibleProperty.value === options.visible, 'If both visible and visibleProperty are provided, then values should match');
    }
    if (assert && options.hasOwnProperty('pdomVisible') && options.hasOwnProperty('pdomVisibleProperty')) {
      assert && assert(options.pdomVisibleProperty.value === options.pdomVisible, 'If both pdomVisible and pdomVisibleProperty are provided, then values should match');
    }
    if (assert && options.hasOwnProperty('pickable') && options.hasOwnProperty('pickableProperty')) {
      assert && assert(options.pickableProperty.value === options.pickable, 'If both pickable and pickableProperty are provided, then values should match');
    }
    const mutatorKeys = this._mutatorKeys;
    for (let i = 0; i < mutatorKeys.length; i++) {
      const key = mutatorKeys[i];

      // See https://github.com/phetsims/scenery/issues/580 for more about passing undefined.
      // @ts-expect-error
      assert && assert(!options.hasOwnProperty(key) || options[key] !== undefined, `Undefined not allowed for Node key: ${key}`);

      // @ts-expect-error - Hmm, better way to check this?
      if (options[key] !== undefined) {
        const descriptor = Object.getOwnPropertyDescriptor(Node.prototype, key);

        // if the key refers to a function that is not ES5 writable, it will execute that function with the single argument
        if (descriptor && typeof descriptor.value === 'function') {
          // @ts-expect-error
          this[key](options[key]);
        } else {
          // @ts-expect-error
          this[key] = options[key];
        }
      }
    }
    this.initializePhetioObject(DEFAULT_PHET_IO_OBJECT_BASE_OPTIONS, options);
    return this; // allow chaining
  }
  initializePhetioObject(baseOptions, config) {
    // Track this, so we only override our visibleProperty once.
    const wasInstrumented = this.isPhetioInstrumented();
    super.initializePhetioObject(baseOptions, config);
    if (Tandem.PHET_IO_ENABLED && !wasInstrumented && this.isPhetioInstrumented()) {
      // For each supported TinyForwardingProperty, if a Property was already specified in the options (in the
      // constructor or mutate), then it will be set as this.targetProperty there. Here we only create the default
      // instrumented one if another hasn't already been specified.

      this._visibleProperty.initializePhetio(this, VISIBLE_PROPERTY_TANDEM_NAME, () => new BooleanProperty(this.visible, combineOptions({
        // by default, use the value from the Node
        phetioReadOnly: this.phetioReadOnly,
        tandem: this.tandem.createTandem(VISIBLE_PROPERTY_TANDEM_NAME),
        phetioDocumentation: 'Controls whether the Node will be visible (and interactive).'
      }, config.visiblePropertyOptions)));
      this._enabledProperty.initializePhetio(this, ENABLED_PROPERTY_TANDEM_NAME, () => new EnabledProperty(this.enabled, combineOptions({
        // by default, use the value from the Node
        phetioReadOnly: this.phetioReadOnly,
        phetioDocumentation: 'Sets whether the node is enabled. This will set whether input is enabled for this Node and ' + 'most often children as well. It will also control and toggle the "disabled look" of the node.',
        tandem: this.tandem.createTandem(ENABLED_PROPERTY_TANDEM_NAME)
      }, config.enabledPropertyOptions)));
      this._inputEnabledProperty.initializePhetio(this, INPUT_ENABLED_PROPERTY_TANDEM_NAME, () => new Property(this.inputEnabled, combineOptions({
        // by default, use the value from the Node
        phetioReadOnly: this.phetioReadOnly,
        tandem: this.tandem.createTandem(INPUT_ENABLED_PROPERTY_TANDEM_NAME),
        phetioValueType: BooleanIO,
        phetioFeatured: true,
        // Since this property is opt-in, we typically only opt-in when it should be featured
        phetioDocumentation: 'Sets whether the element will have input enabled, and hence be interactive.'
      }, config.inputEnabledPropertyOptions)));
    }
  }

  /**
   * Set the visibility of this Node with respect to the Voicing feature. Totally separate from graphical display.
   * When visible, this Node and all of its ancestors will be able to speak with Voicing. When voicingVisible
   * is false, all Voicing under this Node will be muted. `voicingVisible` properties exist in Node.ts because
   * it is useful to set `voicingVisible` on a root that is composed with Voicing.ts. We cannot put all of the
   * Voicing.ts implementation in Node because that would have a massive memory impact. See Voicing.ts for more
   * information.
   */
  setVoicingVisible(visible) {
    if (this.voicingVisibleProperty.value !== visible) {
      this.voicingVisibleProperty.value = visible;
    }
  }
  set voicingVisible(visible) {
    this.setVoicingVisible(visible);
  }
  get voicingVisible() {
    return this.isVoicingVisible();
  }

  /**
   * Returns whether this Node is voicingVisible. When true Utterances for this Node can be announced with the
   * Voicing feature, see Voicing.ts for more information.
   */
  isVoicingVisible() {
    return this.voicingVisibleProperty.value;
  }

  /**
   * Override for extra information in the debugging output (from Display.getDebugHTML()). (scenery-internal)
   */
  getDebugHTMLExtras() {
    return '';
  }

  /**
   * Makes this Node's subtree available for inspection.
   */
  inspect() {
    localStorage.scenerySnapshot = JSON.stringify({
      type: 'Subtree',
      rootNodeId: this.id,
      nodes: serializeConnectedNodes(this)
    });
  }

  /**
   * Returns a debugging string that is an attempted serialization of this node's sub-tree.
   */
  toString() {
    return `${this.constructor.name}#${this.id}`;
  }

  /**
   * Performs checks to see if the internal state of Instance references is correct at a certain point in/after the
   * Display's updateDisplay(). (scenery-internal)
   */
  auditInstanceSubtreeForDisplay(display) {
    if (assertSlow) {
      const numInstances = this._instances.length;
      for (let i = 0; i < numInstances; i++) {
        const instance = this._instances[i];
        if (instance.display === display) {
          assertSlow(instance.trail.isValid(), `Invalid trail on Instance: ${instance.toString()} with trail ${instance.trail.toString()}`);
        }
      }

      // audit all of the children
      this.children.forEach(child => {
        child.auditInstanceSubtreeForDisplay(display);
      });
    }
  }

  /**
   * When we add or remove any number of bounds listeners, we want to increment/decrement internal information.
   *
   * @param deltaQuantity - If positive, the number of listeners being added, otherwise the number removed
   */
  onBoundsListenersAddedOrRemoved(deltaQuantity) {
    this.changeBoundsEventCount(deltaQuantity);
    this._boundsEventSelfCount += deltaQuantity;
  }

  /**
   * Disposes the node, releasing all references that it maintained.
   */
  dispose() {
    // remove all PDOM input listeners
    this.disposeParallelDOM();

    // When disposing, remove all children and parents. See https://github.com/phetsims/scenery/issues/629
    this.removeAllChildren();
    this.detach();

    // In opposite order of creation
    this._inputEnabledProperty.dispose();
    this._enabledProperty.dispose();
    this._pickableProperty.dispose();
    this._visibleProperty.dispose();

    // Tear-down in the reverse order Node was created
    super.dispose();
  }

  /**
   * Disposes this Node and all other descendant nodes.
   *
   * NOTE: Use with caution, as you should not re-use any Node touched by this. Not compatible with most DAG
   *       techniques.
   */
  disposeSubtree() {
    if (!this.isDisposed) {
      // makes a copy before disposing
      const children = this.children;
      this.dispose();
      for (let i = 0; i < children.length; i++) {
        children[i].disposeSubtree();
      }
    }
  }

  /**
   * A default for getTrails() searches, returns whether the Node has no parents.
   */
  static defaultTrailPredicate(node) {
    return node._parents.length === 0;
  }

  /**
   * A default for getLeafTrails() searches, returns whether the Node has no parents.
   */
  static defaultLeafTrailPredicate(node) {
    return node._children.length === 0;
  }
  // A mapping of all of the default options provided to Node
  static DEFAULT_NODE_OPTIONS = DEFAULT_OPTIONS;
}
Node.prototype._mutatorKeys = ACCESSIBILITY_OPTION_KEYS.concat(NODE_OPTION_KEYS);

/**
 * {Array.<String>} - List of all dirty flags that should be available on drawables created from this Node (or
 *                    subtype). Given a flag (e.g. radius), it indicates the existence of a function
 *                    drawable.markDirtyRadius() that will indicate to the drawable that the radius has changed.
 * (scenery-internal)
 *
 * Should be overridden by subtypes.
 */
Node.prototype.drawableMarkFlags = [];
scenery.register('Node', Node);

// {IOType}
Node.NodeIO = new IOType('NodeIO', {
  valueType: Node,
  documentation: 'The base type for graphical and potentially interactive objects.',
  metadataDefaults: {
    phetioState: PHET_IO_STATE_DEFAULT
  }
});
const DEFAULT_PHET_IO_OBJECT_BASE_OPTIONS = {
  phetioType: Node.NodeIO,
  phetioState: PHET_IO_STATE_DEFAULT
};

// A base class for a node in the Scenery scene graph. Supports general directed acyclic graphics (DAGs).
// Handles multiple layers with assorted types (Canvas 2D, SVG, DOM, WebGL, etc.).
// Note: We use interface extension, so we can't export Node at its declaration location
export default Node;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJFbmFibGVkUHJvcGVydHkiLCJQcm9wZXJ0eSIsIlRpbnlFbWl0dGVyIiwiVGlueUZvcndhcmRpbmdQcm9wZXJ0eSIsIlRpbnlQcm9wZXJ0eSIsIlRpbnlTdGF0aWNQcm9wZXJ0eSIsIkJvdW5kczIiLCJNYXRyaXgzIiwiVHJhbnNmb3JtMyIsIlZlY3RvcjIiLCJTaGFwZSIsImFycmF5RGlmZmVyZW5jZSIsImRlcHJlY2F0aW9uV2FybmluZyIsIlBoZXRpb09iamVjdCIsIlRhbmRlbSIsIkJvb2xlYW5JTyIsIklPVHlwZSIsIkFDQ0VTU0lCSUxJVFlfT1BUSU9OX0tFWVMiLCJDYW52YXNDb250ZXh0V3JhcHBlciIsIkZlYXR1cmVzIiwiRmlsdGVyIiwiaG90a2V5TWFuYWdlciIsIkltYWdlIiwiaXNIZWlnaHRTaXphYmxlIiwiaXNXaWR0aFNpemFibGUiLCJNb3VzZSIsIlBhcmFsbGVsRE9NIiwiUGlja2VyIiwiUmVuZGVyZXIiLCJSZW5kZXJlclN1bW1hcnkiLCJzY2VuZXJ5Iiwic2VyaWFsaXplQ29ubmVjdGVkTm9kZXMiLCJUcmFpbCIsIm9wdGlvbml6ZSIsImNvbWJpbmVPcHRpb25zIiwib3B0aW9uaXplMyIsIlV0aWxzIiwiZ2xvYmFsSWRDb3VudGVyIiwic2NyYXRjaEJvdW5kczIiLCJOT1RISU5HIiwiY29weSIsInNjcmF0Y2hCb3VuZHMyRXh0cmEiLCJzY3JhdGNoTWF0cml4MyIsIkVOQUJMRURfUFJPUEVSVFlfVEFOREVNX05BTUUiLCJUQU5ERU1fTkFNRSIsIlZJU0lCTEVfUFJPUEVSVFlfVEFOREVNX05BTUUiLCJJTlBVVF9FTkFCTEVEX1BST1BFUlRZX1RBTkRFTV9OQU1FIiwiUEhFVF9JT19TVEFURV9ERUZBVUxUIiwibWF4UGFyZW50Q291bnQiLCJtYXhDaGlsZENvdW50IiwiUkVRVUlSRVNfQk9VTkRTX09QVElPTl9LRVlTIiwiTk9ERV9PUFRJT05fS0VZUyIsIkRFRkFVTFRfT1BUSU9OUyIsInBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZCIsInZpc2libGUiLCJvcGFjaXR5IiwiZGlzYWJsZWRPcGFjaXR5IiwicGlja2FibGUiLCJlbmFibGVkIiwicGhldGlvRW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkIiwiaW5wdXRFbmFibGVkIiwicGhldGlvSW5wdXRFbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQiLCJjbGlwQXJlYSIsIm1vdXNlQXJlYSIsInRvdWNoQXJlYSIsImN1cnNvciIsInRyYW5zZm9ybUJvdW5kcyIsIm1heFdpZHRoIiwibWF4SGVpZ2h0IiwicmVuZGVyZXIiLCJ1c2VzT3BhY2l0eSIsImxheWVyU3BsaXQiLCJjc3NUcmFuc2Zvcm0iLCJleGNsdWRlSW52aXNpYmxlIiwid2ViZ2xTY2FsZSIsInByZXZlbnRGaXQiLCJERUZBVUxUX0lOVEVSTkFMX1JFTkRFUkVSIiwiZnJvbU5hbWUiLCJOb2RlIiwiY2hpbGRyZW5DaGFuZ2VkRW1pdHRlciIsImNoaWxkSW5zZXJ0ZWRFbWl0dGVyIiwiY2hpbGRSZW1vdmVkRW1pdHRlciIsImNoaWxkcmVuUmVvcmRlcmVkRW1pdHRlciIsInBhcmVudEFkZGVkRW1pdHRlciIsInBhcmVudFJlbW92ZWRFbWl0dGVyIiwidHJhbnNmb3JtRW1pdHRlciIsImluc3RhbmNlUmVmcmVzaEVtaXR0ZXIiLCJyZW5kZXJlclN1bW1hcnlSZWZyZXNoRW1pdHRlciIsImZpbHRlckNoYW5nZUVtaXR0ZXIiLCJjaGFuZ2VkSW5zdGFuY2VFbWl0dGVyIiwicm9vdGVkRGlzcGxheUNoYW5nZWRFbWl0dGVyIiwibGF5b3V0T3B0aW9uc0NoYW5nZWRFbWl0dGVyIiwiX2FjdGl2ZVBhcmVudExheW91dENvbnN0cmFpbnQiLCJjb25zdHJ1Y3RvciIsIm9wdGlvbnMiLCJfaWQiLCJfaW5zdGFuY2VzIiwiX3Jvb3RlZERpc3BsYXlzIiwiX2RyYXdhYmxlcyIsIl92aXNpYmxlUHJvcGVydHkiLCJvblZpc2libGVQcm9wZXJ0eUNoYW5nZSIsImJpbmQiLCJvcGFjaXR5UHJvcGVydHkiLCJvbk9wYWNpdHlQcm9wZXJ0eUNoYW5nZSIsImRpc2FibGVkT3BhY2l0eVByb3BlcnR5Iiwib25EaXNhYmxlZE9wYWNpdHlQcm9wZXJ0eUNoYW5nZSIsIl9waWNrYWJsZVByb3BlcnR5Iiwib25QaWNrYWJsZVByb3BlcnR5Q2hhbmdlIiwiX2VuYWJsZWRQcm9wZXJ0eSIsIm9uRW5hYmxlZFByb3BlcnR5Q2hhbmdlIiwiX2lucHV0RW5hYmxlZFByb3BlcnR5IiwiY2xpcEFyZWFQcm9wZXJ0eSIsInZvaWNpbmdWaXNpYmxlUHJvcGVydHkiLCJfbW91c2VBcmVhIiwiX3RvdWNoQXJlYSIsIl9jdXJzb3IiLCJfY2hpbGRyZW4iLCJfcGFyZW50cyIsIl90cmFuc2Zvcm1Cb3VuZHMiLCJfdHJhbnNmb3JtIiwiX3RyYW5zZm9ybUxpc3RlbmVyIiwib25UcmFuc2Zvcm1DaGFuZ2UiLCJjaGFuZ2VFbWl0dGVyIiwiYWRkTGlzdGVuZXIiLCJfbWF4V2lkdGgiLCJfbWF4SGVpZ2h0IiwiX2FwcGxpZWRTY2FsZUZhY3RvciIsIl9pbnB1dExpc3RlbmVycyIsIl9yZW5kZXJlciIsIl91c2VzT3BhY2l0eSIsIl9sYXllclNwbGl0IiwiX2Nzc1RyYW5zZm9ybSIsIl9leGNsdWRlSW52aXNpYmxlIiwiX3dlYmdsU2NhbGUiLCJfcHJldmVudEZpdCIsImlucHV0RW5hYmxlZFByb3BlcnR5IiwibGF6eUxpbmsiLCJwZG9tQm91bmRJbnB1dEVuYWJsZWRMaXN0ZW5lciIsImJvdW5kc0xpc3RlbmVyc0FkZGVkT3JSZW1vdmVkTGlzdGVuZXIiLCJvbkJvdW5kc0xpc3RlbmVyc0FkZGVkT3JSZW1vdmVkIiwiYm91bmRzSW52YWxpZGF0aW9uTGlzdGVuZXIiLCJ2YWxpZGF0ZUJvdW5kcyIsInNlbGZCb3VuZHNJbnZhbGlkYXRpb25MaXN0ZW5lciIsInZhbGlkYXRlU2VsZkJvdW5kcyIsImJvdW5kc1Byb3BlcnR5IiwiY2hhbmdlQ291bnQiLCJsb2NhbEJvdW5kc1Byb3BlcnR5IiwiY2hpbGRCb3VuZHNQcm9wZXJ0eSIsInNlbGZCb3VuZHNQcm9wZXJ0eSIsIl9sb2NhbEJvdW5kc092ZXJyaWRkZW4iLCJfZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcyIsIl9sYXlvdXRPcHRpb25zIiwiX2JvdW5kc0RpcnR5IiwiX2xvY2FsQm91bmRzRGlydHkiLCJfc2VsZkJvdW5kc0RpcnR5IiwiX2NoaWxkQm91bmRzRGlydHkiLCJhc3NlcnQiLCJfb3JpZ2luYWxCb3VuZHMiLCJfdmFsdWUiLCJfb3JpZ2luYWxMb2NhbEJvdW5kcyIsIl9vcmlnaW5hbFNlbGZCb3VuZHMiLCJfb3JpZ2luYWxDaGlsZEJvdW5kcyIsIl9maWx0ZXJzIiwiX3JlbmRlcmVyQml0bWFzayIsImJpdG1hc2tOb2RlRGVmYXVsdCIsIl9yZW5kZXJlclN1bW1hcnkiLCJfYm91bmRzRXZlbnRDb3VudCIsIl9ib3VuZHNFdmVudFNlbGZDb3VudCIsIl9waWNrZXIiLCJfaXNHZXR0aW5nUmVtb3ZlZEZyb21QYXJlbnQiLCJtdXRhdGUiLCJpbnNlcnRDaGlsZCIsImluZGV4Iiwibm9kZSIsImlzQ29tcG9zaXRlIiwidW5kZWZpbmVkIiwiXyIsImluY2x1ZGVzIiwiaXNEaXNwb3NlZCIsIm9uSW5zZXJ0Q2hpbGQiLCJjaGFuZ2VCb3VuZHNFdmVudENvdW50Iiwic3VtbWFyeUNoYW5nZSIsImJpdG1hc2tBbGwiLCJiaXRtYXNrIiwicHVzaCIsIndpbmRvdyIsInBoZXQiLCJjaGlwcGVyIiwicXVlcnlQYXJhbWV0ZXJzIiwiaXNGaW5pdGUiLCJwYXJlbnRMaW1pdCIsInBhcmVudENvdW50IiwibGVuZ3RoIiwiY29uc29sZSIsImxvZyIsInNwbGljZSIsImNoaWxkTGltaXQiLCJjaGlsZENvdW50IiwiaGFzTm9QRE9NIiwib25QRE9NQWRkQ2hpbGQiLCJpbnZhbGlkYXRlQm91bmRzIiwiZW1pdCIsImFzc2VydFNsb3ciLCJhdWRpdCIsImFkZENoaWxkIiwicmVtb3ZlQ2hpbGQiLCJoYXNDaGlsZCIsImluZGV4T2ZDaGlsZCIsImluZGV4T2YiLCJyZW1vdmVDaGlsZFdpdGhJbmRleCIsInJlbW92ZUNoaWxkQXQiLCJpbmRleE9mUGFyZW50Iiwib25QRE9NUmVtb3ZlQ2hpbGQiLCJvblJlbW92ZUNoaWxkIiwibW92ZUNoaWxkVG9JbmRleCIsImN1cnJlbnRJbmRleCIsIm9uUERPTVJlb3JkZXJlZENoaWxkcmVuIiwiTWF0aCIsIm1pbiIsIm1heCIsInJlbW92ZUFsbENoaWxkcmVuIiwic2V0Q2hpbGRyZW4iLCJjaGlsZHJlbiIsImJlZm9yZU9ubHkiLCJhZnRlck9ubHkiLCJpbkJvdGgiLCJpIiwibWluQ2hhbmdlSW5kZXgiLCJtYXhDaGFuZ2VJbmRleCIsImRlc2lyZWQiLCJoYXNSZW9yZGVyaW5nQ2hhbmdlIiwiYWZ0ZXJJbmRleCIsImFmdGVyIiwiaiIsInZhbHVlIiwiZ2V0Q2hpbGRyZW4iLCJzbGljZSIsImdldENoaWxkcmVuQ291bnQiLCJnZXRQYXJlbnRzIiwicGFyZW50cyIsImdldFBhcmVudCIsInBhcmVudCIsImdldENoaWxkQXQiLCJjaGlsZCIsIm1vdmVUb0Zyb250IiwiZWFjaCIsIm1vdmVDaGlsZFRvRnJvbnQiLCJtb3ZlRm9yd2FyZCIsImZvckVhY2giLCJtb3ZlQ2hpbGRGb3J3YXJkIiwibW92ZUJhY2t3YXJkIiwibW92ZUNoaWxkQmFja3dhcmQiLCJtb3ZlVG9CYWNrIiwibW92ZUNoaWxkVG9CYWNrIiwicmVwbGFjZUNoaWxkIiwib2xkQ2hpbGQiLCJuZXdDaGlsZCIsIm9sZENoaWxkRm9jdXNlZCIsImZvY3VzZWQiLCJmb2N1c2FibGUiLCJmb2N1cyIsImRldGFjaCIsIm4iLCJ6ZXJvQmVmb3JlIiwiemVyb0FmdGVyIiwicGFyZW50RGVsdGEiLCJsZW4iLCJvbGRTZWxmQm91bmRzIiwic2V0IiwiZGlkU2VsZkJvdW5kc0NoYW5nZSIsInVwZGF0ZVNlbGZCb3VuZHMiLCJub3RpZnlMaXN0ZW5lcnMiLCJzY2VuZXJ5TG9nIiwiYm91bmRzIiwibm90aWZpY2F0aW9uVGhyZXNob2xkIiwid2FzRGlydHlCZWZvcmUiLCJvdXJDaGlsZEJvdW5kcyIsIm91ckxvY2FsQm91bmRzIiwib3VyU2VsZkJvdW5kcyIsIm91ckJvdW5kcyIsIm9sZENoaWxkQm91bmRzIiwiaXNWaXNpYmxlIiwiaW5jbHVkZUJvdW5kcyIsImVxdWFscyIsImVxdWFsc0Vwc2lsb24iLCJvbGRMb2NhbEJvdW5kcyIsImNvbnN0cmFpbkJvdW5kcyIsInVwZGF0ZU1heERpbWVuc2lvbiIsIm9sZEJvdW5kcyIsImdldE1hdHJpeCIsImlzQXhpc0FsaWduZWQiLCJtYXRyaXgiLCJfaW5jbHVkZVRyYW5zZm9ybWVkU3VidHJlZUJvdW5kcyIsImdldEJvdW5kc1dpdGhUcmFuc2Zvcm0iLCJ0cmFuc2Zvcm1Cb3VuZHNGcm9tTG9jYWxUb1BhcmVudCIsImVwc2lsb24iLCJjaGlsZEJvdW5kcyIsImxvY2FsQm91bmRzIiwidW5pb24iLCJpbnRlcnNlY3Rpb24iLCJmdWxsQm91bmRzIiwibG9jYWxUb1BhcmVudEJvdW5kcyIsInRvU3RyaW5nIiwicG9wIiwic2VsZkJvdW5kcyIsImlzRW1wdHkiLCJnZXRUcmFuc2Zvcm1lZFNlbGZCb3VuZHMiLCJudW1DaGlsZHJlbiIsIm11bHRpcGx5TWF0cml4IiwiZ2V0SW52ZXJzZSIsInZhbGlkYXRlV2F0Y2hlZEJvdW5kcyIsIndhdGNoZWRCb3VuZHNTY2FuIiwiY2hhbmdlZCIsImludmFsaWRhdGVDaGlsZEJvdW5kcyIsImludmFsaWRhdGVTZWxmIiwibmV3U2VsZkJvdW5kcyIsIm9uU2VsZkJvdW5kc0RpcnR5IiwicG90ZW50aWFsQ2hpbGQiLCJpc091ckNoaWxkIiwiZ2V0U2VsZlNoYXBlIiwiZ2V0U2VsZkJvdW5kcyIsImdldFNhZmVTZWxmQm91bmRzIiwic2FmZVNlbGZCb3VuZHMiLCJnZXRDaGlsZEJvdW5kcyIsImdldExvY2FsQm91bmRzIiwic2V0TG9jYWxCb3VuZHMiLCJsb2NhbEJvdW5kc092ZXJyaWRkZW4iLCJpc05hTiIsIm1pblgiLCJtaW5ZIiwibWF4WCIsIm1heFkiLCJ0cmFuc2Zvcm1lZCIsImdldFRyYW5zZm9ybWVkU2FmZVNlbGZCb3VuZHMiLCJnZXRTYWZlVHJhbnNmb3JtZWRWaXNpYmxlQm91bmRzIiwibG9jYWxNYXRyaXgiLCJJREVOVElUWSIsInRpbWVzTWF0cml4IiwidmlzaWJsZVByb3BlcnR5Iiwic2FmZVRyYW5zZm9ybWVkVmlzaWJsZUJvdW5kcyIsInNldFRyYW5zZm9ybUJvdW5kcyIsImdldFRyYW5zZm9ybUJvdW5kcyIsImdldEJvdW5kcyIsImdldFZpc2libGVMb2NhbEJvdW5kcyIsImdldFZpc2libGVCb3VuZHMiLCJ2aXNpYmxlTG9jYWxCb3VuZHMiLCJ0cmFuc2Zvcm0iLCJ2aXNpYmxlQm91bmRzIiwiaGl0VGVzdCIsInBvaW50IiwiaXNNb3VzZSIsImlzVG91Y2giLCJ0cmFpbFVuZGVyUG9pbnRlciIsInBvaW50ZXIiLCJpc1RvdWNoTGlrZSIsImNvbnRhaW5zUG9pbnQiLCJjb250YWluc1BvaW50U2VsZiIsImludGVyc2VjdHNCb3VuZHNTZWxmIiwiaW50ZXJzZWN0c0JvdW5kcyIsImlzUGhldGlvTW91c2VIaXR0YWJsZSIsImlzQW55RGVzY2VuZGFudEFQaGV0aW9Nb3VzZUhpdFRhcmdldCIsInRpbWVzVmVjdG9yMiIsImdldFBoZXRpb01vdXNlSGl0VGFyZ2V0Iiwic29tZSIsImdldFBoZXRpb01vdXNlSGl0IiwibG9jYWxQb2ludCIsImNoaWxkSGl0V2l0aG91dFRhcmdldCIsImNoaWxkVGFyZ2V0SGl0IiwiaXNQYWludGVkIiwiYXJlU2VsZkJvdW5kc1ZhbGlkIiwiaGFzUGFyZW50IiwiaGFzQ2hpbGRyZW4iLCJpc0NoaWxkSW5jbHVkZWRJbkxheW91dCIsImlzVmFsaWQiLCJ3YWxrRGVwdGhGaXJzdCIsImNhbGxiYWNrIiwiYWRkSW5wdXRMaXN0ZW5lciIsImxpc3RlbmVyIiwib25BZGRJbnB1dExpc3RlbmVyIiwiaG90a2V5cyIsInVwZGF0ZUhvdGtleXNGcm9tSW5wdXRMaXN0ZW5lckNoYW5nZSIsInJlbW92ZUlucHV0TGlzdGVuZXIiLCJvblJlbW92ZUlucHV0TGlzdGVuZXIiLCJoYXNJbnB1dExpc3RlbmVyIiwiaW50ZXJydXB0SW5wdXQiLCJsaXN0ZW5lcnNDb3B5IiwiaW5wdXRMaXN0ZW5lcnMiLCJpbnRlcnJ1cHQiLCJpbnRlcnJ1cHRTdWJ0cmVlSW5wdXQiLCJ0cmFuc2xhdGUiLCJ4IiwieSIsInByZXBlbmRJbnN0ZWFkIiwiYWJzIiwicHJlcGVuZFRyYW5zbGF0aW9uIiwiYXBwZW5kTWF0cml4Iiwic2V0VG9UcmFuc2xhdGlvbiIsInZlY3RvciIsInNjYWxlIiwicHJlcGVuZE1hdHJpeCIsInNjYWxpbmciLCJyb3RhdGUiLCJhbmdsZSIsIlBJIiwicm90YXRpb24yIiwicm90YXRlQXJvdW5kIiwidHJhbnNsYXRpb24iLCJzZXRYIiwiZ2V0WCIsIm0wMiIsInNldFkiLCJnZXRZIiwibTEyIiwic2V0U2NhbGVNYWduaXR1ZGUiLCJhIiwiYiIsImN1cnJlbnRTY2FsZSIsImdldFNjYWxlVmVjdG9yIiwic2V0Um90YXRpb24iLCJyb3RhdGlvbiIsInNldFRvUm90YXRpb25aIiwiZ2V0Um90YXRpb24iLCJzZXRUcmFuc2xhdGlvbiIsIm0iLCJ0eCIsInR5IiwiZHgiLCJkeSIsImdldFRyYW5zbGF0aW9uIiwiZ2V0RGV0ZXJtaW5hbnQiLCJhcHBlbmQiLCJwcmVwZW5kIiwic2V0TWF0cml4IiwiZ2V0VHJhbnNmb3JtIiwicmVzZXRUcmFuc2Zvcm0iLCJvblN1bW1hcnlDaGFuZ2UiLCJvbGRCaXRtYXNrIiwibmV3Qml0bWFzayIsIl9wZG9tRGlzcGxheXNJbmZvIiwiYXVkaXRNYXhEaW1lbnNpb25zIiwiaWRlYWxTY2FsZSIsIndpZHRoIiwiaGVpZ2h0Iiwic2NhbGVBZGp1c3RtZW50IiwicHJlZmVycmVkV2lkdGgiLCJwcmVmZXJyZWRIZWlnaHQiLCJvbk1heERpbWVuc2lvbkNoYW5nZSIsImJlZm9yZU1heExlbmd0aCIsImFmdGVyTWF4TGVuZ3RoIiwic2V0TWF4V2lkdGgiLCJnZXRNYXhXaWR0aCIsInNldE1heEhlaWdodCIsImdldE1heEhlaWdodCIsInNldExlZnQiLCJsZWZ0IiwiY3VycmVudExlZnQiLCJnZXRMZWZ0Iiwic2V0UmlnaHQiLCJyaWdodCIsImN1cnJlbnRSaWdodCIsImdldFJpZ2h0Iiwic2V0Q2VudGVyWCIsImN1cnJlbnRDZW50ZXJYIiwiZ2V0Q2VudGVyWCIsImNlbnRlclgiLCJzZXRDZW50ZXJZIiwiY3VycmVudENlbnRlclkiLCJnZXRDZW50ZXJZIiwiY2VudGVyWSIsInNldFRvcCIsInRvcCIsImN1cnJlbnRUb3AiLCJnZXRUb3AiLCJzZXRCb3R0b20iLCJib3R0b20iLCJjdXJyZW50Qm90dG9tIiwiZ2V0Qm90dG9tIiwic2V0TGVmdFRvcCIsImxlZnRUb3AiLCJjdXJyZW50TGVmdFRvcCIsImdldExlZnRUb3AiLCJtaW51cyIsInNldENlbnRlclRvcCIsImNlbnRlclRvcCIsImN1cnJlbnRDZW50ZXJUb3AiLCJnZXRDZW50ZXJUb3AiLCJzZXRSaWdodFRvcCIsInJpZ2h0VG9wIiwiY3VycmVudFJpZ2h0VG9wIiwiZ2V0UmlnaHRUb3AiLCJzZXRMZWZ0Q2VudGVyIiwibGVmdENlbnRlciIsImN1cnJlbnRMZWZ0Q2VudGVyIiwiZ2V0TGVmdENlbnRlciIsInNldENlbnRlciIsImNlbnRlciIsImN1cnJlbnRDZW50ZXIiLCJnZXRDZW50ZXIiLCJzZXRSaWdodENlbnRlciIsInJpZ2h0Q2VudGVyIiwiY3VycmVudFJpZ2h0Q2VudGVyIiwiZ2V0UmlnaHRDZW50ZXIiLCJzZXRMZWZ0Qm90dG9tIiwibGVmdEJvdHRvbSIsImN1cnJlbnRMZWZ0Qm90dG9tIiwiZ2V0TGVmdEJvdHRvbSIsInNldENlbnRlckJvdHRvbSIsImNlbnRlckJvdHRvbSIsImN1cnJlbnRDZW50ZXJCb3R0b20iLCJnZXRDZW50ZXJCb3R0b20iLCJzZXRSaWdodEJvdHRvbSIsInJpZ2h0Qm90dG9tIiwiY3VycmVudFJpZ2h0Qm90dG9tIiwiZ2V0UmlnaHRCb3R0b20iLCJnZXRXaWR0aCIsImdldEhlaWdodCIsImdldExvY2FsV2lkdGgiLCJsb2NhbFdpZHRoIiwiZ2V0TG9jYWxIZWlnaHQiLCJsb2NhbEhlaWdodCIsImdldExvY2FsTGVmdCIsImxvY2FsTGVmdCIsImdldExvY2FsUmlnaHQiLCJsb2NhbFJpZ2h0IiwiZ2V0TG9jYWxDZW50ZXJYIiwibG9jYWxDZW50ZXJYIiwiZ2V0TG9jYWxDZW50ZXJZIiwibG9jYWxDZW50ZXJZIiwiZ2V0TG9jYWxUb3AiLCJsb2NhbFRvcCIsImdldExvY2FsQm90dG9tIiwibG9jYWxCb3R0b20iLCJnZXRMb2NhbExlZnRUb3AiLCJsb2NhbExlZnRUb3AiLCJnZXRMb2NhbENlbnRlclRvcCIsImxvY2FsQ2VudGVyVG9wIiwiZ2V0TG9jYWxSaWdodFRvcCIsImxvY2FsUmlnaHRUb3AiLCJnZXRMb2NhbExlZnRDZW50ZXIiLCJsb2NhbExlZnRDZW50ZXIiLCJnZXRMb2NhbENlbnRlciIsImxvY2FsQ2VudGVyIiwiZ2V0TG9jYWxSaWdodENlbnRlciIsImxvY2FsUmlnaHRDZW50ZXIiLCJnZXRMb2NhbExlZnRCb3R0b20iLCJsb2NhbExlZnRCb3R0b20iLCJnZXRMb2NhbENlbnRlckJvdHRvbSIsImxvY2FsQ2VudGVyQm90dG9tIiwiZ2V0TG9jYWxSaWdodEJvdHRvbSIsImxvY2FsUmlnaHRCb3R0b20iLCJnZXRJZCIsImlkIiwib25WaXNpYmlsaXR5Q2hhbmdlIiwic2V0VmlzaWJsZVByb3BlcnR5IiwibmV3VGFyZ2V0Iiwic2V0VGFyZ2V0UHJvcGVydHkiLCJwcm9wZXJ0eSIsImdldFZpc2libGVQcm9wZXJ0eSIsInNldFZpc2libGUiLCJzZXRQaGV0aW9WaXNpYmxlUHJvcGVydHlJbnN0cnVtZW50ZWQiLCJzZXRUYXJnZXRQcm9wZXJ0eUluc3RydW1lbnRlZCIsImdldFBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZCIsImdldFRhcmdldFByb3BlcnR5SW5zdHJ1bWVudGVkIiwic3dhcFZpc2liaWxpdHkiLCJvdGhlck5vZGUiLCJ2aXNpYmxlTm9kZSIsImludmlzaWJsZU5vZGUiLCJ2aXNpYmxlTm9kZUZvY3VzZWQiLCJzZXRPcGFjaXR5IiwiRXJyb3IiLCJnZXRPcGFjaXR5Iiwic2V0RGlzYWJsZWRPcGFjaXR5IiwiZ2V0RGlzYWJsZWRPcGFjaXR5IiwiZ2V0RWZmZWN0aXZlT3BhY2l0eSIsImVuYWJsZWRQcm9wZXJ0eSIsImVmZmVjdGl2ZU9wYWNpdHkiLCJzZXRGaWx0ZXJzIiwiZmlsdGVycyIsIkFycmF5IiwiaXNBcnJheSIsImV2ZXJ5IiwiZmlsdGVyIiwiaW52YWxpZGF0ZUhpbnQiLCJnZXRGaWx0ZXJzIiwic2V0UGlja2FibGVQcm9wZXJ0eSIsInBpY2thYmxlUHJvcGVydHkiLCJnZXRQaWNrYWJsZVByb3BlcnR5Iiwic2V0UGlja2FibGUiLCJpc1BpY2thYmxlIiwib2xkUGlja2FibGUiLCJvblBpY2thYmxlQ2hhbmdlIiwic2V0RW5hYmxlZFByb3BlcnR5IiwiZ2V0RW5hYmxlZFByb3BlcnR5Iiwic2V0UGhldGlvRW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkIiwiZ2V0UGhldGlvRW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkIiwic2V0RW5hYmxlZCIsImlzRW5hYmxlZCIsInNldElucHV0RW5hYmxlZFByb3BlcnR5IiwiZ2V0SW5wdXRFbmFibGVkUHJvcGVydHkiLCJzZXRQaGV0aW9JbnB1dEVuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCIsImdldFBoZXRpb0lucHV0RW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkIiwic2V0SW5wdXRFbmFibGVkIiwiaXNJbnB1dEVuYWJsZWQiLCJzZXRJbnB1dExpc3RlbmVycyIsImdldElucHV0TGlzdGVuZXJzIiwic2V0Q3Vyc29yIiwiZ2V0Q3Vyc29yIiwiZ2V0RWZmZWN0aXZlQ3Vyc29yIiwiaW5wdXRMaXN0ZW5lciIsInNldE1vdXNlQXJlYSIsImFyZWEiLCJvbk1vdXNlQXJlYUNoYW5nZSIsImdldE1vdXNlQXJlYSIsInNldFRvdWNoQXJlYSIsIm9uVG91Y2hBcmVhQ2hhbmdlIiwiZ2V0VG91Y2hBcmVhIiwic2V0Q2xpcEFyZWEiLCJzaGFwZSIsIm9uQ2xpcEFyZWFDaGFuZ2UiLCJnZXRDbGlwQXJlYSIsImhhc0NsaXBBcmVhIiwic2V0UmVuZGVyZXJCaXRtYXNrIiwic2VsZkNoYW5nZSIsImludmFsaWRhdGVTdXBwb3J0ZWRSZW5kZXJlcnMiLCJzZXRSZW5kZXJlciIsIm5ld1JlbmRlcmVyIiwiYml0bWFza0NhbnZhcyIsImJpdG1hc2tTVkciLCJiaXRtYXNrRE9NIiwiYml0bWFza1dlYkdMIiwiZ2V0UmVuZGVyZXIiLCJzZXRMYXllclNwbGl0Iiwic3BsaXQiLCJpc0xheWVyU3BsaXQiLCJzZXRVc2VzT3BhY2l0eSIsImdldFVzZXNPcGFjaXR5Iiwic2V0Q1NTVHJhbnNmb3JtIiwiaXNDU1NUcmFuc2Zvcm1lZCIsInNldEV4Y2x1ZGVJbnZpc2libGUiLCJpc0V4Y2x1ZGVJbnZpc2libGUiLCJzZXRFeGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzIiwiZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcyIsImlzRXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcyIsInNldExheW91dE9wdGlvbnMiLCJsYXlvdXRPcHRpb25zIiwiT2JqZWN0IiwiZ2V0UHJvdG90eXBlT2YiLCJwcm90b3R5cGUiLCJnZXRMYXlvdXRPcHRpb25zIiwibXV0YXRlTGF5b3V0T3B0aW9ucyIsIndpZHRoU2l6YWJsZSIsImhlaWdodFNpemFibGUiLCJleHRlbmRzV2lkdGhTaXphYmxlIiwiZXh0ZW5kc0hlaWdodFNpemFibGUiLCJleHRlbmRzU2l6YWJsZSIsInNldFByZXZlbnRGaXQiLCJpc1ByZXZlbnRGaXQiLCJzZXRXZWJHTFNjYWxlIiwiZ2V0V2ViR0xTY2FsZSIsImdldFVuaXF1ZVRyYWlsIiwicHJlZGljYXRlIiwidHJhaWwiLCJhZGRBbmNlc3RvciIsInRyYWlscyIsImdldFRyYWlscyIsImdldFVuaXF1ZVRyYWlsVG8iLCJyb290Tm9kZSIsImRlZmF1bHRUcmFpbFByZWRpY2F0ZSIsImFwcGVuZEFuY2VzdG9yVHJhaWxzV2l0aFByZWRpY2F0ZSIsImdldFRyYWlsc1RvIiwiZ2V0TGVhZlRyYWlscyIsImRlZmF1bHRMZWFmVHJhaWxQcmVkaWNhdGUiLCJhcHBlbmREZXNjZW5kYW50VHJhaWxzV2l0aFByZWRpY2F0ZSIsImdldExlYWZUcmFpbHNUbyIsImxlYWZOb2RlIiwiZ2V0VW5pcXVlTGVhZlRyYWlsIiwiZ2V0VW5pcXVlTGVhZlRyYWlsVG8iLCJnZXRDb25uZWN0ZWROb2RlcyIsInJlc3VsdCIsImZyZXNoIiwiY29uY2F0IiwiZ2V0U3VidHJlZU5vZGVzIiwiZ2V0VG9wb2xvZ2ljYWxseVNvcnRlZE5vZGVzIiwiZWRnZXMiLCJzIiwibCIsImhhbmRsZUNoaWxkIiwiZmluYWwiLCJjYW5BZGRDaGlsZCIsImNhbnZhc1BhaW50U2VsZiIsIndyYXBwZXIiLCJyZW5kZXJUb0NhbnZhc1NlbGYiLCJyZW5kZXJUb0NhbnZhc1N1YnRyZWUiLCJpZGVudGl0eSIsInJlc2V0U3R5bGVzIiwicmVxdWlyZXNTY3JhdGNoQ2FudmFzIiwiY29udGV4dCIsInNhdmUiLCJjYW52YXNTZXRUcmFuc2Zvcm0iLCJjaGlsZENhbnZhc0JvdW5kcyIsImRpbGF0ZSIsInJvdW5kT3V0Iiwic2V0TWluTWF4IiwiY2FudmFzIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiZ2V0Q29udGV4dCIsImNoaWxkV3JhcHBlciIsInN1Yk1hdHJpeCIsImJlZ2luUGF0aCIsIndyaXRlVG9Db250ZXh0IiwiY2xpcCIsInNldFRyYW5zZm9ybSIsImdsb2JhbEFscGhhIiwic2V0RmlsdGVyIiwiY2FudmFzRmlsdGVyIiwiaXNET01Db21wYXRpYmxlIiwibWFwIiwiZ2V0Q1NTRmlsdGVyU3RyaW5nIiwiam9pbiIsImFwcGx5Q2FudmFzRmlsdGVyIiwiZHJhd0ltYWdlIiwicmVzdG9yZSIsInJlbmRlclRvQ2FudmFzIiwiYmFja2dyb3VuZENvbG9yIiwiZmlsbFN0eWxlIiwiZmlsbFJlY3QiLCJ0b0NhbnZhcyIsInBhZGRpbmciLCJjZWlsIiwiY2FudmFzQXBwZW5kVHJhbnNmb3JtIiwidG9EYXRhVVJMIiwidG9JbWFnZSIsInVybCIsImltZyIsIm9ubG9hZCIsImUiLCJzcmMiLCJ0b0ltYWdlTm9kZUFzeW5jaHJvbm91cyIsImltYWdlIiwidG9DYW52YXNOb2RlU3luY2hyb25vdXMiLCJ0b0RhdGFVUkxJbWFnZVN5bmNocm9ub3VzIiwiZGF0YVVSTCIsImluaXRpYWxXaWR0aCIsImluaXRpYWxIZWlnaHQiLCJ0b0RhdGFVUkxOb2RlU3luY2hyb25vdXMiLCJyYXN0ZXJpemVkIiwicHJvdmlkZWRPcHRpb25zIiwicmVzb2x1dGlvbiIsInNvdXJjZUJvdW5kcyIsInVzZVRhcmdldEJvdW5kcyIsIndyYXAiLCJ1c2VDYW52YXMiLCJpbWFnZU9wdGlvbnMiLCJOdW1iZXIiLCJpc0ludGVnZXIiLCJ3cmFwcGVyTm9kZSIsInRyYW5zZm9ybWVkQm91bmRzIiwiZGlsYXRlZCIsInJvdW5kZWRPdXQiLCJpbWFnZVNvdXJjZSIsInJvdW5kU3ltbWV0cmljIiwiZGlzcG9zZSIsImZpbmFsUGFyZW50Qm91bmRzIiwiaW1hZ2VCb3VuZHMiLCJwYXJlbnRUb0xvY2FsQm91bmRzIiwid3JhcHBlZE5vZGUiLCJjcmVhdGVET01EcmF3YWJsZSIsImluc3RhbmNlIiwiY3JlYXRlU1ZHRHJhd2FibGUiLCJjcmVhdGVDYW52YXNEcmF3YWJsZSIsImNyZWF0ZVdlYkdMRHJhd2FibGUiLCJnZXRJbnN0YW5jZXMiLCJpbnN0YW5jZXMiLCJhZGRJbnN0YW5jZSIsInJlbW92ZUluc3RhbmNlIiwid2FzVmlzdWFsbHlEaXNwbGF5ZWQiLCJkaXNwbGF5IiwiZ2V0Um9vdGVkRGlzcGxheXMiLCJyb290ZWREaXNwbGF5cyIsImFkZFJvb3RlZERpc3BsYXkiLCJvbkFkZGVkUm9vdGVkRGlzcGxheSIsInJlbW92ZVJvb3RlZERpc3BsYXkiLCJvblJlbW92ZWRSb290ZWREaXNwbGF5IiwiZ2V0UmVjdXJzaXZlQ29ubmVjdGVkRGlzcGxheXMiLCJkaXNwbGF5cyIsInVuaXEiLCJnZXRDb25uZWN0ZWREaXNwbGF5cyIsImxvY2FsVG9QYXJlbnRQb2ludCIsInRyYW5zZm9ybVBvc2l0aW9uMiIsInRyYW5zZm9ybUJvdW5kczIiLCJwYXJlbnRUb0xvY2FsUG9pbnQiLCJpbnZlcnNlUG9zaXRpb24yIiwiaW52ZXJzZUJvdW5kczIiLCJ0cmFuc2Zvcm1Cb3VuZHNGcm9tUGFyZW50VG9Mb2NhbCIsImdldExvY2FsVG9HbG9iYWxNYXRyaXgiLCJtYXRyaWNlcyIsImdldFVuaXF1ZVRyYW5zZm9ybSIsImdldEdsb2JhbFRvTG9jYWxNYXRyaXgiLCJpbnZlcnQiLCJsb2NhbFRvR2xvYmFsUG9pbnQiLCJyZXN1bHRQb2ludCIsIm11bHRpcGx5VmVjdG9yMiIsImdsb2JhbFRvTG9jYWxQb2ludCIsInRyYW5zZm9ybXMiLCJsb2NhbFRvR2xvYmFsQm91bmRzIiwiZ2xvYmFsVG9Mb2NhbEJvdW5kcyIsInBhcmVudFRvR2xvYmFsUG9pbnQiLCJwYXJlbnRUb0dsb2JhbEJvdW5kcyIsImdsb2JhbFRvUGFyZW50UG9pbnQiLCJnbG9iYWxUb1BhcmVudEJvdW5kcyIsImdldEdsb2JhbEJvdW5kcyIsImdsb2JhbEJvdW5kcyIsImJvdW5kc09mIiwiYm91bmRzVG8iLCJhdHRhY2hEcmF3YWJsZSIsImRyYXdhYmxlIiwiZGV0YWNoRHJhd2FibGUiLCJrZXkiLCJrZXlzIiwiaGFzT3duUHJvcGVydHkiLCJwZG9tVmlzaWJsZVByb3BlcnR5IiwicGRvbVZpc2libGUiLCJtdXRhdG9yS2V5cyIsIl9tdXRhdG9yS2V5cyIsImRlc2NyaXB0b3IiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJpbml0aWFsaXplUGhldGlvT2JqZWN0IiwiREVGQVVMVF9QSEVUX0lPX09CSkVDVF9CQVNFX09QVElPTlMiLCJiYXNlT3B0aW9ucyIsImNvbmZpZyIsIndhc0luc3RydW1lbnRlZCIsImlzUGhldGlvSW5zdHJ1bWVudGVkIiwiUEhFVF9JT19FTkFCTEVEIiwiaW5pdGlhbGl6ZVBoZXRpbyIsInBoZXRpb1JlYWRPbmx5IiwidGFuZGVtIiwiY3JlYXRlVGFuZGVtIiwicGhldGlvRG9jdW1lbnRhdGlvbiIsInZpc2libGVQcm9wZXJ0eU9wdGlvbnMiLCJlbmFibGVkUHJvcGVydHlPcHRpb25zIiwicGhldGlvVmFsdWVUeXBlIiwicGhldGlvRmVhdHVyZWQiLCJpbnB1dEVuYWJsZWRQcm9wZXJ0eU9wdGlvbnMiLCJzZXRWb2ljaW5nVmlzaWJsZSIsInZvaWNpbmdWaXNpYmxlIiwiaXNWb2ljaW5nVmlzaWJsZSIsImdldERlYnVnSFRNTEV4dHJhcyIsImluc3BlY3QiLCJsb2NhbFN0b3JhZ2UiLCJzY2VuZXJ5U25hcHNob3QiLCJKU09OIiwic3RyaW5naWZ5IiwidHlwZSIsInJvb3ROb2RlSWQiLCJub2RlcyIsIm5hbWUiLCJhdWRpdEluc3RhbmNlU3VidHJlZUZvckRpc3BsYXkiLCJudW1JbnN0YW5jZXMiLCJkZWx0YVF1YW50aXR5IiwiZGlzcG9zZVBhcmFsbGVsRE9NIiwiZGlzcG9zZVN1YnRyZWUiLCJERUZBVUxUX05PREVfT1BUSU9OUyIsImRyYXdhYmxlTWFya0ZsYWdzIiwicmVnaXN0ZXIiLCJOb2RlSU8iLCJ2YWx1ZVR5cGUiLCJkb2N1bWVudGF0aW9uIiwibWV0YWRhdGFEZWZhdWx0cyIsInBoZXRpb1N0YXRlIiwicGhldGlvVHlwZSJdLCJzb3VyY2VzIjpbIk5vZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTItMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBOb2RlIGZvciB0aGUgU2NlbmVyeSBzY2VuZSBncmFwaC4gU3VwcG9ydHMgZ2VuZXJhbCBkaXJlY3RlZCBhY3ljbGljIGdyYXBoaWNzIChEQUdzKS5cclxuICogSGFuZGxlcyBtdWx0aXBsZSBsYXllcnMgd2l0aCBhc3NvcnRlZCB0eXBlcyAoQ2FudmFzIDJELCBTVkcsIERPTSwgV2ViR0wsIGV0Yy4pLlxyXG4gKlxyXG4gKiAjIyBHZW5lcmFsIGRlc2NyaXB0aW9uIG9mIE5vZGVzXHJcbiAqXHJcbiAqIEluIFNjZW5lcnksIHRoZSB2aXN1YWwgb3V0cHV0IGlzIGRldGVybWluZWQgYnkgYSBncm91cCBvZiBjb25uZWN0ZWQgTm9kZXMgKGdlbmVyYWxseSBrbm93biBhcyBhIHNjZW5lIGdyYXBoKS5cclxuICogRWFjaCBOb2RlIGhhcyBhIGxpc3Qgb2YgJ2NoaWxkJyBOb2Rlcy4gV2hlbiBhIE5vZGUgaXMgdmlzdWFsbHkgZGlzcGxheWVkLCBpdHMgY2hpbGQgTm9kZXMgKGNoaWxkcmVuKSB3aWxsIGFsc28gYmVcclxuICogZGlzcGxheWVkLCBhbG9uZyB3aXRoIHRoZWlyIGNoaWxkcmVuLCBldGMuIFRoZXJlIGlzIHR5cGljYWxseSBvbmUgJ3Jvb3QnIE5vZGUgdGhhdCBpcyBwYXNzZWQgdG8gdGhlIFNjZW5lcnkgRGlzcGxheVxyXG4gKiB3aG9zZSBkZXNjZW5kYW50cyAoTm9kZXMgdGhhdCBjYW4gYmUgdHJhY2VkIGZyb20gdGhlIHJvb3QgYnkgY2hpbGQgcmVsYXRpb25zaGlwcykgd2lsbCBiZSBkaXNwbGF5ZWQuXHJcbiAqXHJcbiAqIEZvciBpbnN0YW5jZSwgc2F5IHRoZXJlIGFyZSBOb2RlcyBuYW1lZCBBLCBCLCBDLCBEIGFuZCBFLCB3aG8gaGF2ZSB0aGUgcmVsYXRpb25zaGlwczpcclxuICogLSBCIGlzIGEgY2hpbGQgb2YgQSAodGh1cyBBIGlzIGEgcGFyZW50IG9mIEIpXHJcbiAqIC0gQyBpcyBhIGNoaWxkIG9mIEEgKHRodXMgQSBpcyBhIHBhcmVudCBvZiBDKVxyXG4gKiAtIEQgaXMgYSBjaGlsZCBvZiBDICh0aHVzIEMgaXMgYSBwYXJlbnQgb2YgRClcclxuICogLSBFIGlzIGEgY2hpbGQgb2YgQyAodGh1cyBDIGlzIGEgcGFyZW50IG9mIEUpXHJcbiAqIHdoZXJlIEEgd291bGQgYmUgdGhlIHJvb3QgTm9kZS4gVGhpcyBjYW4gYmUgdmlzdWFsbHkgcmVwcmVzZW50ZWQgYXMgYSBzY2VuZSBncmFwaCwgd2hlcmUgYSBsaW5lIGNvbm5lY3RzIGEgcGFyZW50XHJcbiAqIE5vZGUgdG8gYSBjaGlsZCBOb2RlICh3aGVyZSB0aGUgcGFyZW50IGlzIHVzdWFsbHkgYWx3YXlzIGF0IHRoZSB0b3Agb2YgdGhlIGxpbmUsIGFuZCB0aGUgY2hpbGQgaXMgYXQgdGhlIGJvdHRvbSk6XHJcbiAqIEZvciBleGFtcGxlOlxyXG4gKlxyXG4gKiAgIEFcclxuICogIC8gXFxcclxuICogQiAgIENcclxuICogICAgLyBcXFxyXG4gKiAgIEQgICBFXHJcbiAqXHJcbiAqIEFkZGl0aW9uYWxseSwgaW4gdGhpcyBjYXNlOlxyXG4gKiAtIEQgaXMgYSAnZGVzY2VuZGFudCcgb2YgQSAoZHVlIHRvIHRoZSBDIGJlaW5nIGEgY2hpbGQgb2YgQSwgYW5kIEQgYmVpbmcgYSBjaGlsZCBvZiBDKVxyXG4gKiAtIEEgaXMgYW4gJ2FuY2VzdG9yJyBvZiBEIChkdWUgdG8gdGhlIHJldmVyc2UpXHJcbiAqIC0gQydzICdzdWJ0cmVlJyBpcyBDLCBEIGFuZCBFLCB3aGljaCBjb25zaXN0cyBvZiBDIGl0c2VsZiBhbmQgYWxsIG9mIGl0cyBkZXNjZW5kYW50cy5cclxuICpcclxuICogTm90ZSB0aGF0IFNjZW5lcnkgYWxsb3dzIHNvbWUgbW9yZSBjb21wbGljYXRlZCBmb3Jtcywgd2hlcmUgTm9kZXMgY2FuIGhhdmUgbXVsdGlwbGUgcGFyZW50cywgZS5nLjpcclxuICpcclxuICogICBBXHJcbiAqICAvIFxcXHJcbiAqIEIgICBDXHJcbiAqICBcXCAvXHJcbiAqICAgRFxyXG4gKlxyXG4gKiBJbiB0aGlzIGNhc2UsIEQgaGFzIHR3byBwYXJlbnRzIChCIGFuZCBDKS4gU2NlbmVyeSBkaXNhbGxvd3MgYW55IE5vZGUgZnJvbSBiZWluZyBpdHMgb3duIGFuY2VzdG9yIG9yIGRlc2NlbmRhbnQsXHJcbiAqIHNvIHRoYXQgbG9vcHMgYXJlIG5vdCBwb3NzaWJsZS4gV2hlbiBhIE5vZGUgaGFzIHR3byBvciBtb3JlIHBhcmVudHMsIGl0IG1lYW5zIHRoYXQgdGhlIE5vZGUncyBzdWJ0cmVlIHdpbGwgdHlwaWNhbGx5XHJcbiAqIGJlIGRpc3BsYXllZCB0d2ljZSBvbiB0aGUgc2NyZWVuLiBJbiB0aGUgYWJvdmUgY2FzZSwgRCB3b3VsZCBhcHBlYXIgYm90aCBhdCBCJ3MgcG9zaXRpb24gYW5kIEMncyBwb3NpdGlvbi4gRWFjaFxyXG4gKiBwbGFjZSBhIE5vZGUgd291bGQgYmUgZGlzcGxheWVkIGlzIGtub3duIGFzIGFuICdpbnN0YW5jZScuXHJcbiAqXHJcbiAqIEVhY2ggTm9kZSBoYXMgYSAndHJhbnNmb3JtJyBhc3NvY2lhdGVkIHdpdGggaXQsIHdoaWNoIGRldGVybWluZXMgaG93IGl0cyBzdWJ0cmVlICh0aGF0IE5vZGUgYW5kIGFsbCBvZiBpdHNcclxuICogZGVzY2VuZGFudHMpIHdpbGwgYmUgcG9zaXRpb25lZC4gVHJhbnNmb3JtcyBjYW4gY29udGFpbjpcclxuICogLSBUcmFuc2xhdGlvbiwgd2hpY2ggbW92ZXMgdGhlIHBvc2l0aW9uIHRoZSBzdWJ0cmVlIGlzIGRpc3BsYXllZFxyXG4gKiAtIFNjYWxlLCB3aGljaCBtYWtlcyB0aGUgZGlzcGxheWVkIHN1YnRyZWUgbGFyZ2VyIG9yIHNtYWxsZXJcclxuICogLSBSb3RhdGlvbiwgd2hpY2ggZGlzcGxheXMgdGhlIHN1YnRyZWUgYXQgYW4gYW5nbGVcclxuICogLSBvciBhbnkgY29tYmluYXRpb24gb2YgdGhlIGFib3ZlIHRoYXQgdXNlcyBhbiBhZmZpbmUgbWF0cml4IChtb3JlIGFkdmFuY2VkIHRyYW5zZm9ybXMgd2l0aCBzaGVhciBhbmQgY29tYmluYXRpb25zXHJcbiAqICAgYXJlIHBvc3NpYmxlKS5cclxuICpcclxuICogU2F5IHdlIGhhdmUgdGhlIGZvbGxvd2luZyBzY2VuZSBncmFwaDpcclxuICpcclxuICogICBBXHJcbiAqICAgfFxyXG4gKiAgIEJcclxuICogICB8XHJcbiAqICAgQ1xyXG4gKlxyXG4gKiB3aGVyZSB0aGVyZSBhcmUgdGhlIGZvbGxvd2luZyB0cmFuc2Zvcm1zOlxyXG4gKiAtIEEgaGFzIGEgJ3RyYW5zbGF0aW9uJyB0aGF0IG1vdmVzIHRoZSBjb250ZW50IDEwMCBwaXhlbHMgdG8gdGhlIHJpZ2h0XHJcbiAqIC0gQiBoYXMgYSAnc2NhbGUnIHRoYXQgZG91YmxlcyB0aGUgc2l6ZSBvZiB0aGUgY29udGVudFxyXG4gKiAtIEMgaGFzIGEgJ3JvdGF0aW9uJyB0aGF0IHJvdGF0ZXMgMTgwLWRlZ3JlZXMgYXJvdW5kIHRoZSBvcmlnaW5cclxuICpcclxuICogSWYgQyBkaXNwbGF5cyBhIHNxdWFyZSB0aGF0IGZpbGxzIHRoZSBhcmVhIHdpdGggMCA8PSB4IDw9IDEwIGFuZCAwIDw9IHkgPD0gMTAsIHdlIGNhbiBkZXRlcm1pbmUgdGhlIHBvc2l0aW9uIG9uXHJcbiAqIHRoZSBkaXNwbGF5IGJ5IGFwcGx5aW5nIHRyYW5zZm9ybXMgc3RhcnRpbmcgYXQgQyBhbmQgbW92aW5nIHRvd2FyZHMgdGhlIHJvb3QgTm9kZSAoaW4gdGhpcyBjYXNlLCBBKTpcclxuICogMS4gV2UgYXBwbHkgQydzIHJvdGF0aW9uIHRvIG91ciBzcXVhcmUsIHNvIHRoZSBmaWxsZWQgYXJlYSB3aWxsIG5vdyBiZSAtMTAgPD0geCA8PSAwIGFuZCAtMTAgPD0geSA8PSAwXHJcbiAqIDIuIFdlIGFwcGx5IEIncyBzY2FsZSB0byBvdXIgc3F1YXJlLCBzbyBub3cgd2UgaGF2ZSAtMjAgPD0geCA8PSAwIGFuZCAtMjAgPD0geSA8PSAwXHJcbiAqIDMuIFdlIGFwcGx5IEEncyB0cmFuc2xhdGlvbiB0byBvdXIgc3F1YXJlLCBtb3ZpbmcgaXQgdG8gODAgPD0geCA8PSAxMDAgYW5kIC0yMCA8PSB5IDw9IDBcclxuICpcclxuICogTm9kZXMgYWxzbyBoYXZlIGEgbGFyZ2UgbnVtYmVyIG9mIHByb3BlcnRpZXMgdGhhdCB3aWxsIGFmZmVjdCBob3cgdGhlaXIgZW50aXJlIHN1YnRyZWUgaXMgcmVuZGVyZWQsIHN1Y2ggYXNcclxuICogdmlzaWJpbGl0eSwgb3BhY2l0eSwgZXRjLlxyXG4gKlxyXG4gKiAjIyBDcmVhdGluZyBOb2Rlc1xyXG4gKlxyXG4gKiBHZW5lcmFsbHksIHRoZXJlIGFyZSB0d28gdHlwZXMgb2YgTm9kZXM6XHJcbiAqIC0gTm9kZXMgdGhhdCBkb24ndCBkaXNwbGF5IGFueXRoaW5nLCBidXQgc2VydmUgYXMgYSBjb250YWluZXIgZm9yIG90aGVyIE5vZGVzIChlLmcuIE5vZGUgaXRzZWxmLCBIQm94LCBWQm94KVxyXG4gKiAtIE5vZGVzIHRoYXQgZGlzcGxheSBjb250ZW50LCBidXQgQUxTTyBzZXJ2ZSBhcyBhIGNvbnRhaW5lciAoZS5nLiBDaXJjbGUsIEltYWdlLCBUZXh0KVxyXG4gKlxyXG4gKiBXaGVuIGEgTm9kZSBpcyBjcmVhdGVkIHdpdGggdGhlIGRlZmF1bHQgTm9kZSBjb25zdHJ1Y3RvciwgZS5nLjpcclxuICogICB2YXIgbm9kZSA9IG5ldyBOb2RlKCk7XHJcbiAqIHRoZW4gdGhhdCBOb2RlIHdpbGwgbm90IGRpc3BsYXkgYW55dGhpbmcgYnkgaXRzZWxmLlxyXG4gKlxyXG4gKiBHZW5lcmFsbHkgc3VidHlwZXMgb2YgTm9kZSBhcmUgdXNlZCBmb3IgZGlzcGxheWluZyB0aGluZ3MsIHN1Y2ggYXMgQ2lyY2xlLCBlLmcuOlxyXG4gKiAgIHZhciBjaXJjbGUgPSBuZXcgQ2lyY2xlKCAyMCApOyAvLyByYWRpdXMgb2YgMjBcclxuICpcclxuICogQWxtb3N0IGFsbCBOb2RlcyAod2l0aCB0aGUgZXhjZXB0aW9uIG9mIGxlYWYtb25seSBOb2RlcyBsaWtlIFNwYWNlcikgY2FuIGNvbnRhaW4gY2hpbGRyZW4uXHJcbiAqXHJcbiAqICMjIENvbm5lY3RpbmcgTm9kZXMsIGFuZCByZW5kZXJpbmcgb3JkZXJcclxuICpcclxuICogVG8gbWFrZSBhICdjaGlsZE5vZGUnIGJlY29tZSBhICdwYXJlbnROb2RlJywgdGhlIHR5cGljYWwgd2F5IGlzIHRvIGNhbGwgYWRkQ2hpbGQoKTpcclxuICogICBwYXJlbnROb2RlLmFkZENoaWxkKCBjaGlsZE5vZGUgKTtcclxuICpcclxuICogVG8gcmVtb3ZlIHRoaXMgY29ubmVjdGlvbiwgeW91IGNhbiBjYWxsOlxyXG4gKiAgIHBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoIGNoaWxkTm9kZSApO1xyXG4gKlxyXG4gKiBBZGRpbmcgYSBjaGlsZCBOb2RlIHdpdGggYWRkQ2hpbGQoKSBwdXRzIGl0IGF0IHRoZSBlbmQgb2YgcGFyZW50Tm9kZSdzIGxpc3Qgb2YgY2hpbGQgTm9kZXMuIFRoaXMgaXMgaW1wb3J0YW50LFxyXG4gKiBiZWNhdXNlIHRoZSBvcmRlciBvZiBjaGlsZHJlbiBhZmZlY3RzIHdoYXQgTm9kZXMgYXJlIGRyYXduIG9uIHRoZSAndG9wJyBvciAnYm90dG9tJyB2aXN1YWxseS4gTm9kZXMgdGhhdCBhcmUgYXQgdGhlXHJcbiAqIGVuZCBvZiB0aGUgbGlzdCBvZiBjaGlsZHJlbiBhcmUgZ2VuZXJhbGx5IGRyYXduIG9uIHRvcC5cclxuICpcclxuICogVGhpcyBpcyBnZW5lcmFsbHkgZWFzaWVzdCB0byByZXByZXNlbnQgYnkgbm90YXRpbmcgc2NlbmUgZ3JhcGhzIHdpdGggY2hpbGRyZW4gaW4gb3JkZXIgZnJvbSBsZWZ0IHRvIHJpZ2h0LCB0aHVzOlxyXG4gKlxyXG4gKiAgIEFcclxuICogIC8gXFxcclxuICogQiAgIENcclxuICogICAgLyBcXFxyXG4gKiAgIEQgICBFXHJcbiAqXHJcbiAqIHdvdWxkIGluZGljYXRlIHRoYXQgQSdzIGNoaWxkcmVuIGFyZSBbQixDXSwgc28gQydzIHN1YnRyZWUgaXMgZHJhd24gT04gVE9QIG9mIEIuIFRoZSBzYW1lIGlzIHRydWUgb2YgQydzIGNoaWxkcmVuXHJcbiAqIFtELEVdLCBzbyBFIGlzIGRyYXduIG9uIHRvcCBvZiBELiBJZiBhIE5vZGUgaXRzZWxmIGhhcyBjb250ZW50LCBpdCBpcyBkcmF3biBiZWxvdyB0aGF0IG9mIGl0cyBjaGlsZHJlbiAoc28gQyBpdHNlbGZcclxuICogd291bGQgYmUgYmVsb3cgRCBhbmQgRSkuXHJcbiAqXHJcbiAqIFRoaXMgbWVhbnMgdGhhdCBmb3IgZXZlcnkgc2NlbmUgZ3JhcGgsIE5vZGVzIGluc3RhbmNlcyBjYW4gYmUgb3JkZXJlZCBmcm9tIGJvdHRvbSB0byB0b3AuIEZvciB0aGUgYWJvdmUgZXhhbXBsZSwgdGhlXHJcbiAqIG9yZGVyIGlzOlxyXG4gKiAxLiBBIChvbiB0aGUgdmVyeSBib3R0b20gdmlzdWFsbHksIG1heSBnZXQgY292ZXJlZCB1cCBieSBvdGhlciBOb2RlcylcclxuICogMi4gQlxyXG4gKiAzLiBDXHJcbiAqIDQuIERcclxuICogNS4gRSAob24gdGhlIHZlcnkgdG9wIHZpc3VhbGx5LCBtYXkgYmUgY292ZXJpbmcgb3RoZXIgTm9kZXMpXHJcbiAqXHJcbiAqICMjIFRyYWlsc1xyXG4gKlxyXG4gKiBGb3IgZXhhbXBsZXMgd2hlcmUgdGhlcmUgYXJlIG11bHRpcGxlIHBhcmVudHMgZm9yIHNvbWUgTm9kZXMgKGFsc28gcmVmZXJyZWQgdG8gYXMgREFHIGluIHNvbWUgY29kZSwgYXMgaXQgcmVwcmVzZW50c1xyXG4gKiBhIERpcmVjdGVkIEFjeWNsaWMgR3JhcGgpLCB3ZSBuZWVkIG1vcmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHJlbmRlcmluZyBvcmRlciAoYXMgb3RoZXJ3aXNlIE5vZGVzIGNvdWxkIGFwcGVhclxyXG4gKiBtdWx0aXBsZSBwbGFjZXMgaW4gdGhlIHZpc3VhbCBib3R0b20tdG8tdG9wIG9yZGVyLlxyXG4gKlxyXG4gKiBBIFRyYWlsIGlzIGJhc2ljYWxseSBhIGxpc3Qgb2YgTm9kZXMsIHdoZXJlIGV2ZXJ5IE5vZGUgaW4gdGhlIGxpc3QgaXMgYSBjaGlsZCBvZiBpdHMgcHJldmlvdXMgZWxlbWVudCwgYW5kIGEgcGFyZW50XHJcbiAqIG9mIGl0cyBuZXh0IGVsZW1lbnQuIFRodXMgZm9yIHRoZSBzY2VuZSBncmFwaDpcclxuICpcclxuICogICBBXHJcbiAqICAvIFxcXHJcbiAqIEIgICBDXHJcbiAqICBcXCAvIFxcXHJcbiAqICAgRCAgIEVcclxuICogICAgXFwgL1xyXG4gKiAgICAgRlxyXG4gKlxyXG4gKiB0aGVyZSBhcmUgYWN0dWFsbHkgdGhyZWUgaW5zdGFuY2VzIG9mIEYgYmVpbmcgZGlzcGxheWVkLCB3aXRoIHRocmVlIHRyYWlsczpcclxuICogLSBbQSxCLEQsRl1cclxuICogLSBbQSxDLEQsRl1cclxuICogLSBbQSxDLEUsRl1cclxuICogTm90ZSB0aGF0IHRoZSB0cmFpbHMgYXJlIGVzc2VudGlhbGx5IGxpc3RpbmcgTm9kZXMgdXNlZCBpbiB3YWxraW5nIGZyb20gdGhlIHJvb3QgKEEpIHRvIHRoZSByZWxldmFudCBOb2RlIChGKSB1c2luZ1xyXG4gKiBjb25uZWN0aW9ucyBiZXR3ZWVuIHBhcmVudHMgYW5kIGNoaWxkcmVuLlxyXG4gKlxyXG4gKiBUaGUgdHJhaWxzIGFib3ZlIGFyZSBpbiBvcmRlciBmcm9tIGJvdHRvbSB0byB0b3AgKHZpc3VhbGx5KSwgZHVlIHRvIHRoZSBvcmRlciBvZiBjaGlsZHJlbi4gVGh1cyBzaW5jZSBBJ3MgY2hpbGRyZW5cclxuICogYXJlIFtCLENdIGluIHRoYXQgb3JkZXIsIEYgd2l0aCB0aGUgdHJhaWwgW0EsQixELEZdIGlzIGRpc3BsYXllZCBiZWxvdyBbQSxDLEQsRl0sIGJlY2F1c2UgQyBpcyBhZnRlciBCLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IEJvb2xlYW5Qcm9wZXJ0eSwgeyBCb29sZWFuUHJvcGVydHlPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9Cb29sZWFuUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgRW5hYmxlZFByb3BlcnR5LCB7IEVuYWJsZWRQcm9wZXJ0eU9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL0VuYWJsZWRQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBQcm9wZXJ0eSwgeyBQcm9wZXJ0eU9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IFRpbnlFbWl0dGVyIGZyb20gJy4uLy4uLy4uL2F4b24vanMvVGlueUVtaXR0ZXIuanMnO1xyXG5pbXBvcnQgVGlueUZvcndhcmRpbmdQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RpbnlGb3J3YXJkaW5nUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgVGlueVByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvVGlueVByb3BlcnR5LmpzJztcclxuaW1wb3J0IFRpbnlTdGF0aWNQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RpbnlTdGF0aWNQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBCb3VuZHMyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9Cb3VuZHMyLmpzJztcclxuaW1wb3J0IE1hdHJpeDMgZnJvbSAnLi4vLi4vLi4vZG90L2pzL01hdHJpeDMuanMnO1xyXG5pbXBvcnQgVHJhbnNmb3JtMyBmcm9tICcuLi8uLi8uLi9kb3QvanMvVHJhbnNmb3JtMy5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tICcuLi8uLi8uLi9raXRlL2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgYXJyYXlEaWZmZXJlbmNlIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9hcnJheURpZmZlcmVuY2UuanMnO1xyXG5pbXBvcnQgZGVwcmVjYXRpb25XYXJuaW5nIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9kZXByZWNhdGlvbldhcm5pbmcuanMnO1xyXG5pbXBvcnQgUGhldGlvT2JqZWN0LCB7IFBoZXRpb09iamVjdE9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvUGhldGlvT2JqZWN0LmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuaW1wb3J0IEJvb2xlYW5JTyBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvdHlwZXMvQm9vbGVhbklPLmpzJztcclxuaW1wb3J0IElPVHlwZSBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvdHlwZXMvSU9UeXBlLmpzJztcclxuaW1wb3J0IFRQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCB7IEFDQ0VTU0lCSUxJVFlfT1BUSU9OX0tFWVMsIENhbnZhc0NvbnRleHRXcmFwcGVyLCBDYW52YXNTZWxmRHJhd2FibGUsIERpc3BsYXksIERPTVNlbGZEcmF3YWJsZSwgRHJhd2FibGUsIEZlYXR1cmVzLCBGaWx0ZXIsIGhvdGtleU1hbmFnZXIsIEltYWdlLCBJbWFnZU9wdGlvbnMsIEluc3RhbmNlLCBpc0hlaWdodFNpemFibGUsIGlzV2lkdGhTaXphYmxlLCBMYXlvdXRDb25zdHJhaW50LCBNb3VzZSwgUGFyYWxsZWxET00sIFBhcmFsbGVsRE9NT3B0aW9ucywgUGlja2VyLCBQb2ludGVyLCBSZW5kZXJlciwgUmVuZGVyZXJTdW1tYXJ5LCBzY2VuZXJ5LCBzZXJpYWxpemVDb25uZWN0ZWROb2RlcywgU1ZHU2VsZkRyYXdhYmxlLCBUSW5wdXRMaXN0ZW5lciwgVExheW91dE9wdGlvbnMsIFRyYWlsLCBXZWJHTFNlbGZEcmF3YWJsZSB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplLCB7IGNvbWJpbmVPcHRpb25zLCBFbXB0eVNlbGZPcHRpb25zLCBvcHRpb25pemUzIH0gZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBJbnRlbnRpb25hbEFueSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvSW50ZW50aW9uYWxBbnkuanMnO1xyXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vLi4vZG90L2pzL1V0aWxzLmpzJztcclxuaW1wb3J0IFRSZWFkT25seVByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgVEVtaXR0ZXIgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9URW1pdHRlci5qcyc7XHJcblxyXG5sZXQgZ2xvYmFsSWRDb3VudGVyID0gMTtcclxuXHJcbmNvbnN0IHNjcmF0Y2hCb3VuZHMyID0gQm91bmRzMi5OT1RISU5HLmNvcHkoKTsgLy8gbXV0YWJsZSB7Qm91bmRzMn0gdXNlZCB0ZW1wb3JhcmlseSBpbiBtZXRob2RzXHJcbmNvbnN0IHNjcmF0Y2hCb3VuZHMyRXh0cmEgPSBCb3VuZHMyLk5PVEhJTkcuY29weSgpOyAvLyBtdXRhYmxlIHtCb3VuZHMyfSB1c2VkIHRlbXBvcmFyaWx5IGluIG1ldGhvZHNcclxuY29uc3Qgc2NyYXRjaE1hdHJpeDMgPSBuZXcgTWF0cml4MygpO1xyXG5cclxuY29uc3QgRU5BQkxFRF9QUk9QRVJUWV9UQU5ERU1fTkFNRSA9IEVuYWJsZWRQcm9wZXJ0eS5UQU5ERU1fTkFNRTtcclxuY29uc3QgVklTSUJMRV9QUk9QRVJUWV9UQU5ERU1fTkFNRSA9ICd2aXNpYmxlUHJvcGVydHknO1xyXG5jb25zdCBJTlBVVF9FTkFCTEVEX1BST1BFUlRZX1RBTkRFTV9OQU1FID0gJ2lucHV0RW5hYmxlZFByb3BlcnR5JztcclxuXHJcbmNvbnN0IFBIRVRfSU9fU1RBVEVfREVGQVVMVCA9IGZhbHNlO1xyXG5cclxuLy8gU3RvcmUgdGhlIG51bWJlciBvZiBwYXJlbnRzIGZyb20gdGhlIHNpbmdsZSBOb2RlIGluc3RhbmNlIHRoYXQgaGFzIHRoZSBtb3N0IHBhcmVudHMgaW4gdGhlIHdob2xlIHJ1bnRpbWUuXHJcbmxldCBtYXhQYXJlbnRDb3VudCA9IDA7XHJcblxyXG4vLyBTdG9yZSB0aGUgbnVtYmVyIG9mIGNoaWxkcmVuIGZyb20gdGhlIHNpbmdsZSBOb2RlIGluc3RhbmNlIHRoYXQgaGFzIHRoZSBtb3N0IGNoaWxkcmVuIGluIHRoZSB3aG9sZSBydW50aW1lLlxyXG5sZXQgbWF4Q2hpbGRDb3VudCA9IDA7XHJcblxyXG5leHBvcnQgY29uc3QgUkVRVUlSRVNfQk9VTkRTX09QVElPTl9LRVlTID0gW1xyXG4gICdsZWZ0VG9wJywgLy8ge1ZlY3RvcjJ9IC0gVGhlIHVwcGVyLWxlZnQgY29ybmVyIG9mIHRoaXMgTm9kZSdzIGJvdW5kcywgc2VlIHNldExlZnRUb3AoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ2NlbnRlclRvcCcsIC8vIHtWZWN0b3IyfSAtIFRoZSB0b3AtY2VudGVyIG9mIHRoaXMgTm9kZSdzIGJvdW5kcywgc2VlIHNldENlbnRlclRvcCgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAncmlnaHRUb3AnLCAvLyB7VmVjdG9yMn0gLSBUaGUgdXBwZXItcmlnaHQgY29ybmVyIG9mIHRoaXMgTm9kZSdzIGJvdW5kcywgc2VlIHNldFJpZ2h0VG9wKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdsZWZ0Q2VudGVyJywgLy8ge1ZlY3RvcjJ9IC0gVGhlIGxlZnQtY2VudGVyIG9mIHRoaXMgTm9kZSdzIGJvdW5kcywgc2VlIHNldExlZnRDZW50ZXIoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ2NlbnRlcicsIC8vIHtWZWN0b3IyfSAtIFRoZSBjZW50ZXIgb2YgdGhpcyBOb2RlJ3MgYm91bmRzLCBzZWUgc2V0Q2VudGVyKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdyaWdodENlbnRlcicsIC8vIHtWZWN0b3IyfSAtIFRoZSBjZW50ZXItcmlnaHQgb2YgdGhpcyBOb2RlJ3MgYm91bmRzLCBzZWUgc2V0UmlnaHRDZW50ZXIoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ2xlZnRCb3R0b20nLCAvLyB7VmVjdG9yMn0gLSBUaGUgYm90dG9tLWxlZnQgb2YgdGhpcyBOb2RlJ3MgYm91bmRzLCBzZWUgc2V0TGVmdEJvdHRvbSgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnY2VudGVyQm90dG9tJywgLy8ge1ZlY3RvcjJ9IC0gVGhlIG1pZGRsZSBjZW50ZXIgb2YgdGhpcyBOb2RlJ3MgYm91bmRzLCBzZWUgc2V0Q2VudGVyQm90dG9tKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdyaWdodEJvdHRvbScsIC8vIHtWZWN0b3IyfSAtIFRoZSBib3R0b20gcmlnaHQgb2YgdGhpcyBOb2RlJ3MgYm91bmRzLCBzZWUgc2V0UmlnaHRCb3R0b20oKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ2xlZnQnLCAvLyB7bnVtYmVyfSAtIFRoZSBsZWZ0IHNpZGUgb2YgdGhpcyBOb2RlJ3MgYm91bmRzLCBzZWUgc2V0TGVmdCgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAncmlnaHQnLCAvLyB7bnVtYmVyfSAtIFRoZSByaWdodCBzaWRlIG9mIHRoaXMgTm9kZSdzIGJvdW5kcywgc2VlIHNldFJpZ2h0KCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICd0b3AnLCAvLyB7bnVtYmVyfSAtIFRoZSB0b3Agc2lkZSBvZiB0aGlzIE5vZGUncyBib3VuZHMsIHNlZSBzZXRUb3AoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ2JvdHRvbScsIC8vIHtudW1iZXJ9IC0gVGhlIGJvdHRvbSBzaWRlIG9mIHRoaXMgTm9kZSdzIGJvdW5kcywgc2VlIHNldEJvdHRvbSgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnY2VudGVyWCcsIC8vIHtudW1iZXJ9IC0gVGhlIHgtY2VudGVyIG9mIHRoaXMgTm9kZSdzIGJvdW5kcywgc2VlIHNldENlbnRlclgoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ2NlbnRlclknIC8vIHtudW1iZXJ9IC0gVGhlIHktY2VudGVyIG9mIHRoaXMgTm9kZSdzIGJvdW5kcywgc2VlIHNldENlbnRlclkoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbl07XHJcblxyXG4vLyBOb2RlIG9wdGlvbnMsIGluIHRoZSBvcmRlciB0aGV5IGFyZSBleGVjdXRlZCBpbiB0aGUgY29uc3RydWN0b3IvbXV0YXRlKClcclxuY29uc3QgTk9ERV9PUFRJT05fS0VZUyA9IFtcclxuICAnY2hpbGRyZW4nLCAvLyBMaXN0IG9mIGNoaWxkcmVuIHRvIGFkZCAoaW4gb3JkZXIpLCBzZWUgc2V0Q2hpbGRyZW4gZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdjdXJzb3InLCAvLyBDU1MgY3Vyc29yIHRvIGRpc3BsYXkgd2hlbiBvdmVyIHRoaXMgTm9kZSwgc2VlIHNldEN1cnNvcigpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuXHJcbiAgJ3BoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZCcsIC8vIFdoZW4gdHJ1ZSwgY3JlYXRlIGFuIGluc3RydW1lbnRlZCB2aXNpYmxlUHJvcGVydHkgd2hlbiB0aGlzIE5vZGUgaXMgaW5zdHJ1bWVudGVkLCBzZWUgc2V0UGhldGlvVmlzaWJsZVByb3BlcnR5SW5zdHJ1bWVudGVkKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICd2aXNpYmxlUHJvcGVydHknLCAvLyBTZXRzIGZvcndhcmRpbmcgb2YgdGhlIHZpc2libGVQcm9wZXJ0eSwgc2VlIHNldFZpc2libGVQcm9wZXJ0eSgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAndmlzaWJsZScsIC8vIFdoZXRoZXIgdGhlIE5vZGUgaXMgdmlzaWJsZSwgc2VlIHNldFZpc2libGUoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcblxyXG4gICdwaWNrYWJsZVByb3BlcnR5JywgLy8gU2V0cyBmb3J3YXJkaW5nIG9mIHRoZSBwaWNrYWJsZVByb3BlcnR5LCBzZWUgc2V0UGlja2FibGVQcm9wZXJ0eSgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAncGlja2FibGUnLCAvLyBXaGV0aGVyIHRoZSBOb2RlIGlzIHBpY2thYmxlLCBzZWUgc2V0UGlja2FibGUoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcblxyXG4gICdwaGV0aW9FbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQnLCAvLyBXaGVuIHRydWUsIGNyZWF0ZSBhbiBpbnN0cnVtZW50ZWQgZW5hYmxlZFByb3BlcnR5IHdoZW4gdGhpcyBOb2RlIGlzIGluc3RydW1lbnRlZCwgc2VlIHNldFBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnZW5hYmxlZFByb3BlcnR5JywgLy8gU2V0cyBmb3J3YXJkaW5nIG9mIHRoZSBlbmFibGVkUHJvcGVydHksIHNlZSBzZXRFbmFibGVkUHJvcGVydHkoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ2VuYWJsZWQnLCAvLyBXaGV0aGVyIHRoZSBOb2RlIGlzIGVuYWJsZWQsIHNlZSBzZXRFbmFibGVkKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG5cclxuICAncGhldGlvSW5wdXRFbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQnLCAvLyBXaGVuIHRydWUsIGNyZWF0ZSBhbiBpbnN0cnVtZW50ZWQgaW5wdXRFbmFibGVkUHJvcGVydHkgd2hlbiB0aGlzIE5vZGUgaXMgaW5zdHJ1bWVudGVkLCBzZWUgc2V0UGhldGlvSW5wdXRFbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ2lucHV0RW5hYmxlZFByb3BlcnR5JywgLy8gU2V0cyBmb3J3YXJkaW5nIG9mIHRoZSBpbnB1dEVuYWJsZWRQcm9wZXJ0eSwgc2VlIHNldElucHV0RW5hYmxlZFByb3BlcnR5KCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdpbnB1dEVuYWJsZWQnLCAvLyB7Ym9vbGVhbn0gV2hldGhlciBpbnB1dCBldmVudHMgY2FuIHJlYWNoIGludG8gdGhpcyBzdWJ0cmVlLCBzZWUgc2V0SW5wdXRFbmFibGVkKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdpbnB1dExpc3RlbmVycycsIC8vIFRoZSBpbnB1dCBsaXN0ZW5lcnMgYXR0YWNoZWQgdG8gdGhlIE5vZGUsIHNlZSBzZXRJbnB1dExpc3RlbmVycygpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnb3BhY2l0eScsIC8vIE9wYWNpdHkgb2YgdGhpcyBOb2RlJ3Mgc3VidHJlZSwgc2VlIHNldE9wYWNpdHkoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ2Rpc2FibGVkT3BhY2l0eScsIC8vIEEgbXVsdGlwbGllciB0byB0aGUgb3BhY2l0eSBvZiB0aGlzIE5vZGUncyBzdWJ0cmVlIHdoZW4gdGhlIG5vZGUgaXMgZGlzYWJsZWQsIHNlZSBzZXREaXNhYmxlZE9wYWNpdHkoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ2ZpbHRlcnMnLCAvLyBOb24tb3BhY2l0eSBmaWx0ZXJzLCBzZWUgc2V0RmlsdGVycygpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnbWF0cml4JywgLy8gVHJhbnNmb3JtYXRpb24gbWF0cml4IG9mIHRoZSBOb2RlLCBzZWUgc2V0TWF0cml4KCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICd0cmFuc2xhdGlvbicsIC8vIHgveSB0cmFuc2xhdGlvbiBvZiB0aGUgTm9kZSwgc2VlIHNldFRyYW5zbGF0aW9uKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICd4JywgLy8geCB0cmFuc2xhdGlvbiBvZiB0aGUgTm9kZSwgc2VlIHNldFgoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ3knLCAvLyB5IHRyYW5zbGF0aW9uIG9mIHRoZSBOb2RlLCBzZWUgc2V0WSgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAncm90YXRpb24nLCAvLyByb3RhdGlvbiAoaW4gcmFkaWFucykgb2YgdGhlIE5vZGUsIHNlZSBzZXRSb3RhdGlvbigpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnc2NhbGUnLCAvLyBzY2FsZSBvZiB0aGUgTm9kZSwgc2VlIHNjYWxlKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdleGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzJywgLy8gQ29udHJvbHMgYm91bmRzIGRlcGVuZGluZyBvbiBjaGlsZCB2aXNpYmlsaXR5LCBzZWUgc2V0RXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcygpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnbGF5b3V0T3B0aW9ucycsIC8vIFByb3ZpZGVkIHRvIGxheW91dCBjb250YWluZXJzIGZvciBvcHRpb25zLCBzZWUgc2V0TGF5b3V0T3B0aW9ucygpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnbG9jYWxCb3VuZHMnLCAvLyBib3VuZHMgb2Ygc3VidHJlZSBpbiBsb2NhbCBjb29yZGluYXRlIGZyYW1lLCBzZWUgc2V0TG9jYWxCb3VuZHMoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ21heFdpZHRoJywgLy8gQ29uc3RyYWlucyB3aWR0aCBvZiB0aGlzIE5vZGUsIHNlZSBzZXRNYXhXaWR0aCgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnbWF4SGVpZ2h0JywgLy8gQ29uc3RyYWlucyBoZWlnaHQgb2YgdGhpcyBOb2RlLCBzZWUgc2V0TWF4SGVpZ2h0KCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdyZW5kZXJlcicsIC8vIFRoZSBwcmVmZXJyZWQgcmVuZGVyZXIgZm9yIHRoaXMgc3VidHJlZSwgc2VlIHNldFJlbmRlcmVyKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdsYXllclNwbGl0JywgLy8gRm9yY2VzIHRoaXMgc3VidHJlZSBpbnRvIGEgbGF5ZXIgb2YgaXRzIG93biwgc2VlIHNldExheWVyU3BsaXQoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ3VzZXNPcGFjaXR5JywgLy8gSGludCB0aGF0IG9wYWNpdHkgd2lsbCBiZSBjaGFuZ2VkLCBzZWUgc2V0VXNlc09wYWNpdHkoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ2Nzc1RyYW5zZm9ybScsIC8vIEhpbnQgdGhhdCBjYW4gdHJpZ2dlciB1c2luZyBDU1MgdHJhbnNmb3Jtcywgc2VlIHNldENzc1RyYW5zZm9ybSgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnZXhjbHVkZUludmlzaWJsZScsIC8vIElmIHRoaXMgaXMgaW52aXNpYmxlLCBleGNsdWRlIGZyb20gRE9NLCBzZWUgc2V0RXhjbHVkZUludmlzaWJsZSgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnd2ViZ2xTY2FsZScsIC8vIEhpbnQgdG8gYWRqdXN0IFdlYkdMIHNjYWxpbmcgcXVhbGl0eSBmb3IgdGhpcyBzdWJ0cmVlLCBzZWUgc2V0V2ViZ2xTY2FsZSgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAncHJldmVudEZpdCcsIC8vIFByZXZlbnRzIGxheWVycyBmcm9tIGZpdHRpbmcgdGhpcyBzdWJ0cmVlLCBzZWUgc2V0UHJldmVudEZpdCgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnbW91c2VBcmVhJywgLy8gQ2hhbmdlcyB0aGUgYXJlYSB0aGUgbW91c2UgY2FuIGludGVyYWN0IHdpdGgsIHNlZSBzZXRNb3VzZUFyZWEoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ3RvdWNoQXJlYScsIC8vIENoYW5nZXMgdGhlIGFyZWEgdG91Y2hlcyBjYW4gaW50ZXJhY3Qgd2l0aCwgc2VlIHNldFRvdWNoQXJlYSgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnY2xpcEFyZWEnLCAvLyBNYWtlcyB0aGluZ3Mgb3V0c2lkZSBvZiBhIHNoYXBlIGludmlzaWJsZSwgc2VlIHNldENsaXBBcmVhKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICd0cmFuc2Zvcm1Cb3VuZHMnLCAvLyBGbGFnIHRoYXQgbWFrZXMgYm91bmRzIHRpZ2h0ZXIsIHNlZSBzZXRUcmFuc2Zvcm1Cb3VuZHMoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgLi4uUkVRVUlSRVNfQk9VTkRTX09QVElPTl9LRVlTXHJcbl07XHJcblxyXG5jb25zdCBERUZBVUxUX09QVElPTlMgPSB7XHJcbiAgcGhldGlvVmlzaWJsZVByb3BlcnR5SW5zdHJ1bWVudGVkOiB0cnVlLFxyXG4gIHZpc2libGU6IHRydWUsXHJcbiAgb3BhY2l0eTogMSxcclxuICBkaXNhYmxlZE9wYWNpdHk6IDEsXHJcbiAgcGlja2FibGU6IG51bGwsXHJcbiAgZW5hYmxlZDogdHJ1ZSxcclxuICBwaGV0aW9FbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQ6IGZhbHNlLFxyXG4gIGlucHV0RW5hYmxlZDogdHJ1ZSxcclxuICBwaGV0aW9JbnB1dEVuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZDogZmFsc2UsXHJcbiAgY2xpcEFyZWE6IG51bGwsXHJcbiAgbW91c2VBcmVhOiBudWxsLFxyXG4gIHRvdWNoQXJlYTogbnVsbCxcclxuICBjdXJzb3I6IG51bGwsXHJcbiAgdHJhbnNmb3JtQm91bmRzOiBmYWxzZSxcclxuICBtYXhXaWR0aDogbnVsbCxcclxuICBtYXhIZWlnaHQ6IG51bGwsXHJcbiAgcmVuZGVyZXI6IG51bGwsXHJcbiAgdXNlc09wYWNpdHk6IGZhbHNlLFxyXG4gIGxheWVyU3BsaXQ6IGZhbHNlLFxyXG4gIGNzc1RyYW5zZm9ybTogZmFsc2UsXHJcbiAgZXhjbHVkZUludmlzaWJsZTogZmFsc2UsXHJcbiAgd2ViZ2xTY2FsZTogbnVsbCxcclxuICBwcmV2ZW50Rml0OiBmYWxzZVxyXG59O1xyXG5cclxuY29uc3QgREVGQVVMVF9JTlRFUk5BTF9SRU5ERVJFUiA9IERFRkFVTFRfT1BUSU9OUy5yZW5kZXJlciA9PT0gbnVsbCA/IDAgOiBSZW5kZXJlci5mcm9tTmFtZSggREVGQVVMVF9PUFRJT05TLnJlbmRlcmVyICk7XHJcblxyXG5leHBvcnQgdHlwZSBSZW5kZXJlclR5cGUgPSAnc3ZnJyB8ICdjYW52YXMnIHwgJ3dlYmdsJyB8ICdkb20nIHwgbnVsbDtcclxuXHJcbi8vIElzb2xhdGVkIHNvIHRoYXQgd2UgY2FuIGRlbGF5IG9wdGlvbnMgdGhhdCBhcmUgYmFzZWQgb24gYm91bmRzIG9mIHRoZSBOb2RlIHRvIGFmdGVyIGNvbnN0cnVjdGlvbi5cclxuLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xMzMyXHJcbmV4cG9ydCB0eXBlIE5vZGVCb3VuZHNCYXNlZFRyYW5zbGF0aW9uT3B0aW9ucyA9IHtcclxuICBsZWZ0VG9wPzogVmVjdG9yMjtcclxuICBjZW50ZXJUb3A/OiBWZWN0b3IyO1xyXG4gIHJpZ2h0VG9wPzogVmVjdG9yMjtcclxuICBsZWZ0Q2VudGVyPzogVmVjdG9yMjtcclxuICBjZW50ZXI/OiBWZWN0b3IyO1xyXG4gIHJpZ2h0Q2VudGVyPzogVmVjdG9yMjtcclxuICBsZWZ0Qm90dG9tPzogVmVjdG9yMjtcclxuICBjZW50ZXJCb3R0b20/OiBWZWN0b3IyO1xyXG4gIHJpZ2h0Qm90dG9tPzogVmVjdG9yMjtcclxuICBsZWZ0PzogbnVtYmVyO1xyXG4gIHJpZ2h0PzogbnVtYmVyO1xyXG4gIHRvcD86IG51bWJlcjtcclxuICBib3R0b20/OiBudW1iZXI7XHJcbiAgY2VudGVyWD86IG51bWJlcjtcclxuICBjZW50ZXJZPzogbnVtYmVyO1xyXG59O1xyXG5cclxuLy8gQWxsIHRyYW5zbGF0aW9uIG9wdGlvbnMgKGluY2x1ZGVzIHRob3NlIGJhc2VkIG9uIGJvdW5kcyBhbmQgdGhvc2UgdGhhdCBhcmUgbm90KVxyXG5leHBvcnQgdHlwZSBOb2RlVHJhbnNsYXRpb25PcHRpb25zID0ge1xyXG4gIHRyYW5zbGF0aW9uPzogVmVjdG9yMjtcclxuICB4PzogbnVtYmVyO1xyXG4gIHk/OiBudW1iZXI7XHJcbn0gJiBOb2RlQm91bmRzQmFzZWRUcmFuc2xhdGlvbk9wdGlvbnM7XHJcblxyXG4vLyBBbGwgdHJhbnNmb3JtIG9wdGlvbnMgKGluY2x1ZGVzIHRyYW5zbGF0aW9uIG9wdGlvbnMpXHJcbmV4cG9ydCB0eXBlIE5vZGVUcmFuc2Zvcm1PcHRpb25zID0ge1xyXG4gIG1hdHJpeD86IE1hdHJpeDM7XHJcbiAgcm90YXRpb24/OiBudW1iZXI7XHJcbiAgc2NhbGU/OiBudW1iZXIgfCBWZWN0b3IyO1xyXG59ICYgTm9kZVRyYW5zbGF0aW9uT3B0aW9ucztcclxuXHJcbi8vIEFsbCBiYXNlIE5vZGUgb3B0aW9uc1xyXG5leHBvcnQgdHlwZSBOb2RlT3B0aW9ucyA9IHtcclxuICBjaGlsZHJlbj86IE5vZGVbXTtcclxuICBjdXJzb3I/OiBzdHJpbmcgfCBudWxsO1xyXG4gIHBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZD86IGJvb2xlYW47XHJcbiAgdmlzaWJsZVByb3BlcnR5PzogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj4gfCBudWxsO1xyXG4gIHZpc2libGU/OiBib29sZWFuO1xyXG4gIHBpY2thYmxlUHJvcGVydHk/OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuIHwgbnVsbD4gfCBudWxsO1xyXG4gIHBpY2thYmxlPzogYm9vbGVhbiB8IG51bGw7XHJcbiAgcGhldGlvRW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkPzogYm9vbGVhbjtcclxuICBlbmFibGVkUHJvcGVydHk/OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuPiB8IG51bGw7XHJcbiAgZW5hYmxlZD86IGJvb2xlYW47XHJcbiAgcGhldGlvSW5wdXRFbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQ/OiBib29sZWFuO1xyXG4gIGlucHV0RW5hYmxlZFByb3BlcnR5PzogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj4gfCBudWxsO1xyXG4gIGlucHV0RW5hYmxlZD86IGJvb2xlYW47XHJcbiAgaW5wdXRMaXN0ZW5lcnM/OiBUSW5wdXRMaXN0ZW5lcltdO1xyXG4gIG9wYWNpdHk/OiBudW1iZXI7XHJcbiAgZGlzYWJsZWRPcGFjaXR5PzogbnVtYmVyO1xyXG4gIGZpbHRlcnM/OiBGaWx0ZXJbXTtcclxuICBleGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzPzogYm9vbGVhbjtcclxuICBsYXlvdXRPcHRpb25zPzogVExheW91dE9wdGlvbnMgfCBudWxsO1xyXG4gIGxvY2FsQm91bmRzPzogQm91bmRzMiB8IG51bGw7XHJcbiAgbWF4V2lkdGg/OiBudW1iZXIgfCBudWxsO1xyXG4gIG1heEhlaWdodD86IG51bWJlciB8IG51bGw7XHJcbiAgcmVuZGVyZXI/OiBSZW5kZXJlclR5cGU7XHJcbiAgbGF5ZXJTcGxpdD86IGJvb2xlYW47XHJcbiAgdXNlc09wYWNpdHk/OiBib29sZWFuO1xyXG4gIGNzc1RyYW5zZm9ybT86IGJvb2xlYW47XHJcbiAgZXhjbHVkZUludmlzaWJsZT86IGJvb2xlYW47XHJcbiAgd2ViZ2xTY2FsZT86IG51bWJlciB8IG51bGw7XHJcbiAgcHJldmVudEZpdD86IGJvb2xlYW47XHJcbiAgbW91c2VBcmVhPzogU2hhcGUgfCBCb3VuZHMyIHwgbnVsbDtcclxuICB0b3VjaEFyZWE/OiBTaGFwZSB8IEJvdW5kczIgfCBudWxsO1xyXG4gIGNsaXBBcmVhPzogU2hhcGUgfCBudWxsO1xyXG4gIHRyYW5zZm9ybUJvdW5kcz86IGJvb2xlYW47XHJcblxyXG4gIC8vIFRoaXMgb3B0aW9uIGlzIHVzZWQgdG8gY3JlYXRlIHRoZSBpbnN0cnVtZW50ZWQsIGRlZmF1bHQgUGhFVC1pTyB2aXNpYmxlUHJvcGVydHkuIFRoZXNlIG9wdGlvbnMgc2hvdWxkIG5vdFxyXG4gIC8vIGJlIHByb3ZpZGVkIGlmIGEgYHZpc2libGVQcm9wZXJ0eWAgd2FzIHByb3ZpZGVkIHRvIHRoaXMgTm9kZSwgdGhvdWdoIGlmIHRoZXkgYXJlLCB0aGV5IHdpbGwganVzdCBiZSBpZ25vcmVkLlxyXG4gIC8vIFRoaXMgZ3JhY2UgaXMgdG8gc3VwcG9ydCBkZWZhdWx0IG9wdGlvbnMgYWNyb3NzIHRoZSBjb21wb25lbnQgaGllcmFyY2h5IG1lbGRpbmcgd2l0aCB1c2FnZXMgcHJvdmlkaW5nIGEgdmlzaWJsZVByb3BlcnR5LlxyXG4gIC8vIFRoaXMgb3B0aW9uIGlzIGEgYml0IGJ1cmllZCBiZWNhdXNlIGl0IGNhbiBvbmx5IGJlIHVzZWQgd2hlbiB0aGUgTm9kZSBpcyBiZWluZyBpbnN0cnVtZW50ZWQsIHdoaWNoIGlzIHdoZW5cclxuICAvLyB0aGUgZGVmYXVsdCwgaW5zdHJ1bWVudGVkIHZpc2libGVQcm9wZXJ0eSBpcyBjb25kaXRpb25hbGx5IGNyZWF0ZWQuIFdlIGRvbid0IHdhbnQgdG8gc3RvcmUgdGhlc2Ugb24gdGhlIE5vZGUsXHJcbiAgLy8gYW5kIHRodXMgdGhleSBhcmVuJ3Qgc3VwcG9ydCB0aHJvdWdoIGBtdXRhdGUoKWAuXHJcbiAgdmlzaWJsZVByb3BlcnR5T3B0aW9ucz86IFByb3BlcnR5T3B0aW9uczxib29sZWFuPjtcclxuICBlbmFibGVkUHJvcGVydHlPcHRpb25zPzogUHJvcGVydHlPcHRpb25zPGJvb2xlYW4+O1xyXG4gIGlucHV0RW5hYmxlZFByb3BlcnR5T3B0aW9ucz86IFByb3BlcnR5T3B0aW9uczxib29sZWFuPjtcclxufSAmIFBhcmFsbGVsRE9NT3B0aW9ucyAmIE5vZGVUcmFuc2Zvcm1PcHRpb25zO1xyXG5cclxudHlwZSBSYXN0ZXJpemVkT3B0aW9ucyA9IHtcclxuXHJcbiAgLy8ge251bWJlcn0gLSBDb250cm9scyB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgaW1hZ2UgcmVsYXRpdmUgdG8gdGhlIGxvY2FsIHZpZXcgdW5pdHMuIEZvciBleGFtcGxlLCBpZiBvdXIgTm9kZSBpc1xyXG4gIC8vIH4xMDAgdmlldyB1bml0cyBhY3Jvc3MgKGluIHRoZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lKSBidXQgeW91IHdhbnQgdGhlIGltYWdlIHRvIGFjdHVhbGx5IGhhdmUgYSB+MjAwLXBpeGVsXHJcbiAgLy8gcmVzb2x1dGlvbiwgcHJvdmlkZSByZXNvbHV0aW9uOjIuXHJcbiAgLy8gRGVmYXVsdHMgdG8gMS4wXHJcbiAgcmVzb2x1dGlvbj86IG51bWJlcjtcclxuXHJcbiAgLy8ge0JvdW5kczJ8bnVsbH0gLSBJZiBwcm92aWRlZCwgaXQgd2lsbCBjb250cm9sIHRoZSB4L3kvd2lkdGgvaGVpZ2h0IG9mIHRoZSB0b0NhbnZhcyBjYWxsLiBTZWUgdG9DYW52YXMgZm9yXHJcbiAgLy8gZGV0YWlscyBvbiBob3cgdGhpcyBjb250cm9scyB0aGUgcmFzdGVyaXphdGlvbi4gVGhpcyBpcyBpbiB0aGUgXCJwYXJlbnRcIiBjb29yZGluYXRlIGZyYW1lLCBzaW1pbGFyIHRvXHJcbiAgLy8gbm9kZS5ib3VuZHMuXHJcbiAgLy8gRGVmYXVsdHMgdG8gbnVsbFxyXG4gIHNvdXJjZUJvdW5kcz86IEJvdW5kczIgfCBudWxsO1xyXG5cclxuICAvLyB7Ym9vbGVhbn0gLSBJZiB0cnVlLCB0aGUgbG9jYWxCb3VuZHMgb2YgdGhlIHJlc3VsdCB3aWxsIGJlIHNldCBpbiBhIHdheSBzdWNoIHRoYXQgaXQgd2lsbCBwcmVjaXNlbHkgbWF0Y2hcclxuICAvLyB0aGUgdmlzaWJsZSBib3VuZHMgb2YgdGhlIG9yaWdpbmFsIE5vZGUgKHRoaXMpLiBOb3RlIHRoYXQgYW50aWFsaWFzZWQgY29udGVudCAod2l0aCBhIG11Y2ggbG93ZXIgcmVzb2x1dGlvbilcclxuICAvLyBtYXkgc29tZXdoYXQgc3BpbGwgb3V0c2lkZSB0aGVzZSBib3VuZHMgaWYgdGhpcyBpcyBzZXQgdG8gdHJ1ZS4gVXN1YWxseSB0aGlzIGlzIGZpbmUgYW5kIHNob3VsZCBiZSB0aGVcclxuICAvLyByZWNvbW1lbmRlZCBvcHRpb24uIElmIHNvdXJjZUJvdW5kcyBhcmUgcHJvdmlkZWQsIHRoZXkgd2lsbCByZXN0cmljdCB0aGUgdXNlZCBib3VuZHMgKHNvIGl0IHdpbGwganVzdFxyXG4gIC8vIHJlcHJlc2VudCB0aGUgYm91bmRzIG9mIHRoZSBzbGljZWQgcGFydCBvZiB0aGUgaW1hZ2UpLlxyXG4gIC8vIERlZmF1bHRzIHRvIHRydWVcclxuICB1c2VUYXJnZXRCb3VuZHM/OiBib29sZWFuO1xyXG5cclxuICAvLyB7Ym9vbGVhbn0gLSBJZiB0cnVlLCB0aGUgY3JlYXRlZCBJbWFnZSBOb2RlIGdldHMgd3JhcHBlZCBpbiBhbiBleHRyYSBOb2RlIHNvIHRoYXQgaXQgY2FuIGJlIHRyYW5zZm9ybWVkXHJcbiAgLy8gaW5kZXBlbmRlbnRseS4gSWYgdGhlcmUgaXMgbm8gbmVlZCB0byB0cmFuc2Zvcm0gdGhlIHJlc3VsdGluZyBub2RlLCB3cmFwOmZhbHNlIGNhbiBiZSBwYXNzZWQgc28gdGhhdCBubyBleHRyYVxyXG4gIC8vIE5vZGUgaXMgY3JlYXRlZC5cclxuICAvLyBEZWZhdWx0cyB0byB0cnVlXHJcbiAgd3JhcD86IGJvb2xlYW47XHJcblxyXG4gIC8vIHtib29sZWFufSAtIElmIHRydWUsIGl0IHdpbGwgZGlyZWN0bHkgdXNlIHRoZSA8Y2FudmFzPiBlbGVtZW50IChvbmx5IHdvcmtzIHdpdGggY2FudmFzL3dlYmdsIHJlbmRlcmVycylcclxuICAvLyBpbnN0ZWFkIG9mIGNvbnZlcnRpbmcgdGhpcyBpbnRvIGEgZm9ybSB0aGF0IGNhbiBiZSB1c2VkIHdpdGggYW55IHJlbmRlcmVyLiBNYXkgaGF2ZSBzbGlnaHRseSBiZXR0ZXJcclxuICAvLyBwZXJmb3JtYW5jZSBpZiBzdmcvZG9tIHJlbmRlcmVycyBkbyBub3QgbmVlZCB0byBiZSB1c2VkLlxyXG4gIC8vIERlZmF1bHRzIHRvIGZhbHNlXHJcbiAgdXNlQ2FudmFzPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gVG8gYmUgcGFzc2VkIHRvIHRoZSBJbWFnZSBub2RlIGNyZWF0ZWQgZnJvbSB0aGUgcmFzdGVyaXphdGlvbi4gU2VlIGJlbG93IGZvciBvcHRpb25zIHRoYXQgd2lsbCBvdmVycmlkZVxyXG4gIC8vIHdoYXQgaXMgcGFzc2VkIGluLlxyXG4gIC8vIERlZmF1bHRzIHRvIHRoZSBlbXB0eSBvYmplY3RcclxuICBpbWFnZU9wdGlvbnM/OiBJbWFnZU9wdGlvbnM7XHJcbn07XHJcblxyXG5jbGFzcyBOb2RlIGV4dGVuZHMgUGFyYWxsZWxET00ge1xyXG4gIC8vIE5PVEU6IEFsbCBtZW1iZXIgcHJvcGVydGllcyB3aXRoIG5hbWVzIHN0YXJ0aW5nIHdpdGggJ18nIGFyZSBhc3N1bWVkIHRvIGJlIHByaXZhdGUvcHJvdGVjdGVkIVxyXG5cclxuICAvLyBBc3NpZ25zIGEgdW5pcXVlIElEIHRvIHRoaXMgTm9kZSAoYWxsb3dzIHRyYWlscyB0byBnZXQgYSB1bmlxdWUgbGlzdCBvZiBJRHMpXHJcbiAgcHVibGljIF9pZDogbnVtYmVyO1xyXG5cclxuICAvLyBBbGwgb2YgdGhlIEluc3RhbmNlcyB0cmFja2luZyB0aGlzIE5vZGVcclxuICBwcml2YXRlIHJlYWRvbmx5IF9pbnN0YW5jZXM6IEluc3RhbmNlW107XHJcblxyXG4gIC8vIEFsbCBkaXNwbGF5cyB3aGVyZSB0aGlzIE5vZGUgaXMgdGhlIHJvb3QuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyByZWFkb25seSBfcm9vdGVkRGlzcGxheXM6IERpc3BsYXlbXTtcclxuXHJcbiAgLy8gRHJhd2FibGUgc3RhdGVzIHRoYXQgbmVlZCB0byBiZSB1cGRhdGVkIG9uIG11dGF0aW9ucy4gR2VuZXJhbGx5IGFkZGVkIGJ5IFNWRyBhbmRcclxuICAvLyBET00gZWxlbWVudHMgdGhhdCBuZWVkIHRvIGNsb3NlbHkgdHJhY2sgc3RhdGUgKHBvc3NpYmx5IGJ5IENhbnZhcyB0byBtYWludGFpbiBkaXJ0eSBzdGF0ZSkuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIHJlYWRvbmx5IF9kcmF3YWJsZXM6IERyYXdhYmxlW107XHJcblxyXG4gIC8vIFdoZXRoZXIgdGhpcyBOb2RlIChhbmQgaXRzIGNoaWxkcmVuKSB3aWxsIGJlIHZpc2libGUgd2hlbiB0aGUgc2NlbmUgaXMgdXBkYXRlZC5cclxuICAvLyBWaXNpYmxlIE5vZGVzIGJ5IGRlZmF1bHQgd2lsbCBub3QgYmUgcGlja2FibGUgZWl0aGVyLlxyXG4gIC8vIE5PVEU6IFRoaXMgaXMgZmlyZWQgc3luY2hyb25vdXNseSB3aGVuIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSBOb2RlIGlzIHRvZ2dsZWRcclxuICBwcml2YXRlIHJlYWRvbmx5IF92aXNpYmxlUHJvcGVydHk6IFRpbnlGb3J3YXJkaW5nUHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8vIE9wYWNpdHksIGluIHRoZSByYW5nZSBmcm9tIDAgKGZ1bGx5IHRyYW5zcGFyZW50KSB0byAxIChmdWxseSBvcGFxdWUpLlxyXG4gIC8vIE5PVEU6IFRoaXMgaXMgZmlyZWQgc3luY2hyb25vdXNseSB3aGVuIHRoZSBvcGFjaXR5IG9mIHRoZSBOb2RlIGlzIHRvZ2dsZWRcclxuICBwdWJsaWMgcmVhZG9ubHkgb3BhY2l0eVByb3BlcnR5OiBUaW55UHJvcGVydHk8bnVtYmVyPjtcclxuXHJcbiAgLy8gRGlzYWJsZWQgb3BhY2l0eSwgaW4gdGhlIHJhbmdlIGZyb20gMCAoZnVsbHkgdHJhbnNwYXJlbnQpIHRvIDEgKGZ1bGx5IG9wYXF1ZSkuXHJcbiAgLy8gQ29tYmluZWQgd2l0aCB0aGUgbm9ybWFsIG9wYWNpdHkgT05MWSB3aGVuIHRoZSBub2RlIGlzIGRpc2FibGVkLlxyXG4gIC8vIE5PVEU6IFRoaXMgaXMgZmlyZWQgc3luY2hyb25vdXNseSB3aGVuIHRoZSBvcGFjaXR5IG9mIHRoZSBOb2RlIGlzIHRvZ2dsZWRcclxuICBwdWJsaWMgcmVhZG9ubHkgZGlzYWJsZWRPcGFjaXR5UHJvcGVydHk6IFRpbnlQcm9wZXJ0eTxudW1iZXI+O1xyXG5cclxuICAvLyBTZWUgc2V0UGlja2FibGUoKSBhbmQgc2V0UGlja2FibGVQcm9wZXJ0eSgpXHJcbiAgLy8gTk9URTogVGhpcyBpcyBmaXJlZCBzeW5jaHJvbm91c2x5IHdoZW4gdGhlIHBpY2thYmlsaXR5IG9mIHRoZSBOb2RlIGlzIHRvZ2dsZWRcclxuICBwcml2YXRlIHJlYWRvbmx5IF9waWNrYWJsZVByb3BlcnR5OiBUaW55Rm9yd2FyZGluZ1Byb3BlcnR5PGJvb2xlYW4gfCBudWxsPjtcclxuXHJcbiAgLy8gU2VlIHNldEVuYWJsZWQoKSBhbmQgc2V0RW5hYmxlZFByb3BlcnR5KClcclxuICBwcml2YXRlIHJlYWRvbmx5IF9lbmFibGVkUHJvcGVydHk6IFRpbnlGb3J3YXJkaW5nUHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8vIFdoZXRoZXIgaW5wdXQgZXZlbnQgbGlzdGVuZXJzIG9uIHRoaXMgTm9kZSBvciBkZXNjZW5kYW50cyBvbiBhIHRyYWlsIHdpbGwgaGF2ZVxyXG4gIC8vIGlucHV0IGxpc3RlbmVycy4gdHJpZ2dlcmVkLiBOb3RlIHRoYXQgdGhpcyBkb2VzIE5PVCBlZmZlY3QgcGlja2luZywgYW5kIG9ubHkgcHJldmVudHMgc29tZSBsaXN0ZW5lcnMgZnJvbSBiZWluZ1xyXG4gIC8vIGZpcmVkLlxyXG4gIHByaXZhdGUgcmVhZG9ubHkgX2lucHV0RW5hYmxlZFByb3BlcnR5OiBUaW55Rm9yd2FyZGluZ1Byb3BlcnR5PGJvb2xlYW4+O1xyXG5cclxuICAvLyBUaGlzIE5vZGUgYW5kIGFsbCBjaGlsZHJlbiB3aWxsIGJlIGNsaXBwZWQgYnkgdGhpcyBzaGFwZSAoaW4gYWRkaXRpb24gdG8gYW55XHJcbiAgLy8gb3RoZXIgY2xpcHBpbmcgc2hhcGVzKS4gVGhlIHNoYXBlIHNob3VsZCBiZSBpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAvLyBOT1RFOiBUaGlzIGlzIGZpcmVkIHN5bmNocm9ub3VzbHkgd2hlbiB0aGUgY2xpcEFyZWEgb2YgdGhlIE5vZGUgaXMgdG9nZ2xlZFxyXG4gIHB1YmxpYyByZWFkb25seSBjbGlwQXJlYVByb3BlcnR5OiBUaW55UHJvcGVydHk8U2hhcGUgfCBudWxsPjtcclxuXHJcbiAgLy8gV2hldGhlciB0aGlzIE5vZGUgYW5kIGl0cyBzdWJ0cmVlIGNhbiBhbm5vdW5jZSBjb250ZW50IHdpdGggVm9pY2luZyBhbmQgU3BlZWNoU3ludGhlc2lzLiBUaG91Z2hcclxuICAvLyByZWxhdGVkIHRvIFZvaWNpbmcgaXQgZXhpc3RzIGluIE5vZGUgYmVjYXVzZSBpdCBpcyB1c2VmdWwgdG8gc2V0IHZvaWNpbmdWaXNpYmxlIG9uIGEgc3VidHJlZSB3aGVyZSB0aGVcclxuICAvLyByb290IGRvZXMgbm90IGNvbXBvc2UgVm9pY2luZy4gVGhpcyBpcyBub3QgaWRlYWwgYnV0IHRoZSBlbnRpcmV0eSBvZiBWb2ljaW5nIGNhbm5vdCBiZSBjb21wb3NlZCBpbnRvIGV2ZXJ5XHJcbiAgLy8gTm9kZSBiZWNhdXNlIGl0IHdvdWxkIHByb2R1Y2UgaW5jb3JyZWN0IGJlaGF2aW9ycyBhbmQgaGF2ZSBhIG1hc3NpdmUgbWVtb3J5IGZvb3RwcmludC4gU2VlIHNldFZvaWNpbmdWaXNpYmxlKClcclxuICAvLyBhbmQgVm9pY2luZy50cyBmb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCBWb2ljaW5nLlxyXG4gIHB1YmxpYyByZWFkb25seSB2b2ljaW5nVmlzaWJsZVByb3BlcnR5OiBUaW55UHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8vIEFyZWFzIGZvciBoaXQgaW50ZXJzZWN0aW9uLiBJZiBzZXQgb24gYSBOb2RlLCBubyBkZXNjZW5kYW50cyBjYW4gaGFuZGxlIGV2ZW50cy5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX21vdXNlQXJlYTogU2hhcGUgfCBCb3VuZHMyIHwgbnVsbDsgLy8gZm9yIG1vdXNlIHBvc2l0aW9uIGluIHRoZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lXHJcbiAgcHVibGljIF90b3VjaEFyZWE6IFNoYXBlIHwgQm91bmRzMiB8IG51bGw7IC8vIGZvciB0b3VjaCBhbmQgcGVuIHBvc2l0aW9uIGluIHRoZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lXHJcblxyXG4gIC8vIFRoZSBDU1MgY3Vyc29yIHRvIGJlIGRpc3BsYXllZCBvdmVyIHRoaXMgTm9kZS4gbnVsbCBzaG91bGQgYmUgdGhlIGRlZmF1bHQgKGluaGVyaXQpIHZhbHVlLlxyXG4gIHByaXZhdGUgX2N1cnNvcjogc3RyaW5nIHwgbnVsbDtcclxuXHJcbiAgLy8gT3JkZXJlZCBhcnJheSBvZiBjaGlsZCBOb2Rlcy5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX2NoaWxkcmVuOiBOb2RlW107XHJcblxyXG4gIC8vIFVub3JkZXJlZCBhcnJheSBvZiBwYXJlbnQgTm9kZXMuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIF9wYXJlbnRzOiBOb2RlW107XHJcblxyXG4gIC8vIFdoZXRoZXIgd2Ugd2lsbCBkbyBtb3JlIGFjY3VyYXRlIChhbmQgdGlnaHQpIGJvdW5kcyBjb21wdXRhdGlvbnMgZm9yIHJvdGF0aW9ucyBhbmQgc2hlYXJzLlxyXG4gIHByaXZhdGUgX3RyYW5zZm9ybUJvdW5kczogYm9vbGVhbjtcclxuXHJcbiAgLy8gU2V0IHVwIHRoZSB0cmFuc2Zvcm0gcmVmZXJlbmNlLiB3ZSBhZGQgYSBsaXN0ZW5lciBzbyB0aGF0IHRoZSB0cmFuc2Zvcm0gaXRzZWxmIGNhbiBiZSBtb2RpZmllZCBkaXJlY3RseVxyXG4gIC8vIGJ5IHJlZmVyZW5jZSwgdHJpZ2dlcmluZyB0aGUgZXZlbnQgbm90aWZpY2F0aW9ucyBmb3IgU2NlbmVyeSBUaGUgcmVmZXJlbmNlIHRvIHRoZSBUcmFuc2Zvcm0zIHdpbGwgbmV2ZXIgY2hhbmdlLlxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyBfdHJhbnNmb3JtOiBUcmFuc2Zvcm0zO1xyXG4gIHB1YmxpYyBfdHJhbnNmb3JtTGlzdGVuZXI6ICgpID0+IHZvaWQ7XHJcblxyXG4gIC8vIE1heGltdW0gZGltZW5zaW9ucyBmb3IgdGhlIE5vZGUncyBsb2NhbCBib3VuZHMgYmVmb3JlIGEgY29ycmVjdGl2ZSBzY2FsaW5nIGZhY3RvciBpcyBhcHBsaWVkIHRvIG1haW50YWluIHNpemUuXHJcbiAgLy8gVGhlIG1heGltdW0gZGltZW5zaW9ucyBhcmUgYWx3YXlzIGNvbXBhcmVkIHRvIGxvY2FsIGJvdW5kcywgYW5kIGFwcGxpZWQgXCJiZWZvcmVcIiB0aGUgTm9kZSdzIHRyYW5zZm9ybS5cclxuICAvLyBXaGVuZXZlciB0aGUgbG9jYWwgYm91bmRzIG9yIG1heGltdW0gZGltZW5zaW9ucyBvZiB0aGlzIE5vZGUgY2hhbmdlIGFuZCBpdCBoYXMgYXQgbGVhc3Qgb25lIG1heGltdW0gZGltZW5zaW9uXHJcbiAgLy8gKHdpZHRoIG9yIGhlaWdodCksIGFuIGlkZWFsIHNjYWxlIGlzIGNvbXB1dGVkIChlaXRoZXIgdGhlIHNtYWxsZXN0IHNjYWxlIGZvciBvdXIgbG9jYWwgYm91bmRzIHRvIGZpdCB0aGVcclxuICAvLyBkaW1lbnNpb24gY29uc3RyYWludHMsIE9SIDEsIHdoaWNoZXZlciBpcyBsb3dlcikuIFRoZW4gdGhlIE5vZGUncyB0cmFuc2Zvcm0gd2lsbCBiZSBzY2FsZWQgKHByZXBlbmRlZCkgd2l0aFxyXG4gIC8vIGEgc2NhbGUgYWRqdXN0bWVudCBvZiAoIGlkZWFsU2NhbGUgLyBhbHJlYWR5QXBwbGllZFNjYWxlRmFjdG9yICkuXHJcbiAgLy8gSW4gdGhlIHNpbXBsZSBjYXNlIHdoZXJlIHRoZSBOb2RlIGlzbid0IG90aGVyd2lzZSB0cmFuc2Zvcm1lZCwgdGhpcyB3aWxsIGFwcGx5IGFuZCB1cGRhdGUgdGhlIE5vZGUncyBzY2FsZSBzbyB0aGF0XHJcbiAgLy8gdGhlIE5vZGUgbWF0Y2hlcyB0aGUgbWF4aW11bSBkaW1lbnNpb25zLCB3aGlsZSBuZXZlciBzY2FsaW5nIG92ZXIgMS4gTm90ZSB0aGF0IG1hbnVhbGx5IGFwcGx5aW5nIHRyYW5zZm9ybXMgdG9cclxuICAvLyB0aGUgTm9kZSBpcyBmaW5lLCBidXQgbWF5IG1ha2UgdGhlIE5vZGUncyB3aWR0aCBncmVhdGVyIHRoYW4gdGhlIG1heGltdW0gd2lkdGguXHJcbiAgLy8gTk9URTogSWYgYSBkaW1lbnNpb24gY29uc3RyYWludCBpcyBudWxsLCBubyByZXNpemluZyB3aWxsIG9jY3VyIGR1ZSB0byBpdC4gSWYgYm90aCBtYXhXaWR0aCBhbmQgbWF4SGVpZ2h0IGFyZSBudWxsLFxyXG4gIC8vIG5vIHNjYWxlIGFkanVzdG1lbnQgd2lsbCBiZSBhcHBsaWVkLlxyXG4gIC8vXHJcbiAgLy8gQWxzbyBub3RlIHRoYXQgc2V0dGluZyBtYXhXaWR0aC9tYXhIZWlnaHQgaXMgbGlrZSBhZGRpbmcgYSBsb2NhbCBib3VuZHMgbGlzdGVuZXIgKHdpbGwgdHJpZ2dlciB2YWxpZGF0aW9uIG9mXHJcbiAgLy8gYm91bmRzIGR1cmluZyB0aGUgdXBkYXRlRGlzcGxheSBzdGVwKS4gTk9URTogdGhpcyBtZWFucyB1cGRhdGVzIHRvIHRoZSB0cmFuc2Zvcm0gKG9uIGEgbG9jYWwgYm91bmRzIGNoYW5nZSkgd2lsbFxyXG4gIC8vIGhhcHBlbiB3aGVuIGJvdW5kcyBhcmUgdmFsaWRhdGVkICh2YWxpZGF0ZUJvdW5kcygpKSwgd2hpY2ggZG9lcyBub3QgaGFwcGVuIHN5bmNocm9ub3VzbHkgb24gYSBjaGlsZCdzIHNpemVcclxuICAvLyBjaGFuZ2UuIEl0IGRvZXMgaGFwcGVuIGF0IGxlYXN0IG9uY2UgaW4gdXBkYXRlRGlzcGxheSgpIGJlZm9yZSByZW5kZXJpbmcsIGFuZCBjYWxsaW5nIHZhbGlkYXRlQm91bmRzKCkgY2FuIGZvcmNlXHJcbiAgLy8gYSByZS1jaGVjayBhbmQgdHJhbnNmb3JtLlxyXG4gIHByaXZhdGUgX21heFdpZHRoOiBudW1iZXIgfCBudWxsO1xyXG4gIHByaXZhdGUgX21heEhlaWdodDogbnVtYmVyIHwgbnVsbDtcclxuXHJcbiAgLy8gU2NhbGUgYXBwbGllZCBkdWUgdG8gdGhlIG1heGltdW0gZGltZW5zaW9uIGNvbnN0cmFpbnRzLlxyXG4gIHByaXZhdGUgX2FwcGxpZWRTY2FsZUZhY3RvcjogbnVtYmVyO1xyXG5cclxuICAvLyBGb3IgdXNlciBpbnB1dCBoYW5kbGluZyAobW91c2UvdG91Y2gpLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX2lucHV0TGlzdGVuZXJzOiBUSW5wdXRMaXN0ZW5lcltdO1xyXG5cclxuICAvLyBbbXV0YWJsZV0gQm91bmRzIGZvciB0aGlzIE5vZGUgYW5kIGl0cyBjaGlsZHJlbiBpbiB0aGUgXCJwYXJlbnRcIiBjb29yZGluYXRlIGZyYW1lLlxyXG4gIC8vIE5PVEU6IFRoZSByZWZlcmVuY2UgaGVyZSB3aWxsIG5vdCBjaGFuZ2UsIHdlIHdpbGwganVzdCBub3RpZnkgdXNpbmcgdGhlIGVxdWl2YWxlbnQgc3RhdGljIG5vdGlmaWNhdGlvbiBtZXRob2QuXHJcbiAgLy8gTk9URTogVGhpcyBpcyBmaXJlZCAqKmFzeW5jaHJvbm91c2x5KiogKHVzdWFsbHkgYXMgcGFydCBvZiBhIERpc3BsYXkudXBkYXRlRGlzcGxheSgpKSB3aGVuIHRoZSBib3VuZHMgb2YgdGhlIE5vZGVcclxuICAvLyBpcyBjaGFuZ2VkLlxyXG4gIHB1YmxpYyByZWFkb25seSBib3VuZHNQcm9wZXJ0eTogVGlueVN0YXRpY1Byb3BlcnR5PEJvdW5kczI+O1xyXG5cclxuICAvLyBbbXV0YWJsZV0gQm91bmRzIGZvciB0aGlzIE5vZGUgYW5kIGl0cyBjaGlsZHJlbiBpbiB0aGUgXCJsb2NhbFwiIGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgLy8gTk9URTogVGhlIHJlZmVyZW5jZSBoZXJlIHdpbGwgbm90IGNoYW5nZSwgd2Ugd2lsbCBqdXN0IG5vdGlmeSB1c2luZyB0aGUgZXF1aXZhbGVudCBzdGF0aWMgbm90aWZpY2F0aW9uIG1ldGhvZC5cclxuICAvLyBOT1RFOiBUaGlzIGlzIGZpcmVkICoqYXN5bmNocm9ub3VzbHkqKiAodXN1YWxseSBhcyBwYXJ0IG9mIGEgRGlzcGxheS51cGRhdGVEaXNwbGF5KCkpIHdoZW4gdGhlIGxvY2FsQm91bmRzIG9mXHJcbiAgLy8gdGhlIE5vZGUgaXMgY2hhbmdlZC5cclxuICBwdWJsaWMgcmVhZG9ubHkgbG9jYWxCb3VuZHNQcm9wZXJ0eTogVGlueVN0YXRpY1Byb3BlcnR5PEJvdW5kczI+O1xyXG5cclxuICAvLyBbbXV0YWJsZV0gQm91bmRzIGp1c3QgZm9yIGNoaWxkcmVuIG9mIHRoaXMgTm9kZSAoYW5kIHN1Yi10cmVlcyksIGluIHRoZSBcImxvY2FsXCIgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAvLyBOT1RFOiBUaGUgcmVmZXJlbmNlIGhlcmUgd2lsbCBub3QgY2hhbmdlLCB3ZSB3aWxsIGp1c3Qgbm90aWZ5IHVzaW5nIHRoZSBlcXVpdmFsZW50IHN0YXRpYyBub3RpZmljYXRpb24gbWV0aG9kLlxyXG4gIC8vIE5PVEU6IFRoaXMgaXMgZmlyZWQgKiphc3luY2hyb25vdXNseSoqICh1c3VhbGx5IGFzIHBhcnQgb2YgYSBEaXNwbGF5LnVwZGF0ZURpc3BsYXkoKSkgd2hlbiB0aGUgY2hpbGRCb3VuZHMgb2YgdGhlXHJcbiAgLy8gTm9kZSBpcyBjaGFuZ2VkLlxyXG4gIHB1YmxpYyByZWFkb25seSBjaGlsZEJvdW5kc1Byb3BlcnR5OiBUaW55U3RhdGljUHJvcGVydHk8Qm91bmRzMj47XHJcblxyXG4gIC8vIFttdXRhYmxlXSBCb3VuZHMganVzdCBmb3IgdGhpcyBOb2RlLCBpbiB0aGUgXCJsb2NhbFwiIGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgLy8gTk9URTogVGhlIHJlZmVyZW5jZSBoZXJlIHdpbGwgbm90IGNoYW5nZSwgd2Ugd2lsbCBqdXN0IG5vdGlmeSB1c2luZyB0aGUgZXF1aXZhbGVudCBzdGF0aWMgbm90aWZpY2F0aW9uIG1ldGhvZC5cclxuICAvLyBOT1RFOiBUaGlzIGV2ZW50IGNhbiBiZSBmaXJlZCBzeW5jaHJvbm91c2x5LCBhbmQgaGFwcGVucyB3aXRoIHRoZSBzZWxmLWJvdW5kcyBvZiBhIE5vZGUgaXMgY2hhbmdlZC4gVGhpcyBpcyBOT1RcclxuICAvLyBsaWtlIHRoZSBvdGhlciBib3VuZHMgUHJvcGVydGllcywgd2hpY2ggdXN1YWxseSBmaXJlIGFzeW5jaHJvbm91c2x5XHJcbiAgcHVibGljIHJlYWRvbmx5IHNlbGZCb3VuZHNQcm9wZXJ0eTogVGlueVN0YXRpY1Byb3BlcnR5PEJvdW5kczI+O1xyXG5cclxuICAvLyBXaGV0aGVyIG91ciBsb2NhbEJvdW5kcyBoYXZlIGJlZW4gc2V0ICh3aXRoIHRoZSBFUzUgc2V0dGVyL3NldExvY2FsQm91bmRzKCkpIHRvIGEgY3VzdG9tXHJcbiAgLy8gb3ZlcnJpZGRlbiB2YWx1ZS4gSWYgdHJ1ZSwgdGhlbiBsb2NhbEJvdW5kcyBpdHNlbGYgd2lsbCBub3QgYmUgdXBkYXRlZCwgYnV0IHdpbGwgaW5zdGVhZCBhbHdheXMgYmUgdGhlXHJcbiAgLy8gb3ZlcnJpZGRlbiB2YWx1ZS5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX2xvY2FsQm91bmRzT3ZlcnJpZGRlbjogYm9vbGVhbjtcclxuXHJcbiAgLy8gW211dGFibGVdIFdoZXRoZXIgaW52aXNpYmxlIGNoaWxkcmVuIHdpbGwgYmUgZXhjbHVkZWQgZnJvbSB0aGlzIE5vZGUncyBib3VuZHNcclxuICBwcml2YXRlIF9leGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzOiBib29sZWFuO1xyXG5cclxuICAvLyBPcHRpb25zIHRoYXQgY2FuIGJlIHByb3ZpZGVkIHRvIGxheW91dCBtYW5hZ2VycyB0byBhZGp1c3QgcG9zaXRpb25pbmcgZm9yIHRoaXMgbm9kZS5cclxuICBwcml2YXRlIF9sYXlvdXRPcHRpb25zOiBUTGF5b3V0T3B0aW9ucyB8IG51bGw7XHJcblxyXG4gIC8vIFdoZXRoZXIgYm91bmRzIG5lZWRzIHRvIGJlIHJlY29tcHV0ZWQgdG8gYmUgdmFsaWQuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIF9ib3VuZHNEaXJ0eTogYm9vbGVhbjtcclxuXHJcbiAgLy8gV2hldGhlciBsb2NhbEJvdW5kcyBuZWVkcyB0byBiZSByZWNvbXB1dGVkIHRvIGJlIHZhbGlkLlxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyBfbG9jYWxCb3VuZHNEaXJ0eTogYm9vbGVhbjtcclxuXHJcbiAgLy8gV2hldGhlciBzZWxmQm91bmRzIG5lZWRzIHRvIGJlIHJlY29tcHV0ZWQgdG8gYmUgdmFsaWQuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIF9zZWxmQm91bmRzRGlydHk6IGJvb2xlYW47XHJcblxyXG4gIC8vIFdoZXRoZXIgY2hpbGRCb3VuZHMgbmVlZHMgdG8gYmUgcmVjb21wdXRlZCB0byBiZSB2YWxpZC5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX2NoaWxkQm91bmRzRGlydHk6IGJvb2xlYW47XHJcblxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyBfZmlsdGVyczogRmlsdGVyW107XHJcblxyXG4gIHByaXZhdGUgX29yaWdpbmFsQm91bmRzPzogQm91bmRzMjsgLy8gSWYgYXNzZXJ0aW9ucyBhcmUgZW5hYmxlZFxyXG4gIHByaXZhdGUgX29yaWdpbmFsTG9jYWxCb3VuZHM/OiBCb3VuZHMyOyAvLyBJZiBhc3NlcnRpb25zIGFyZSBlbmFibGVkXHJcbiAgcHJpdmF0ZSBfb3JpZ2luYWxTZWxmQm91bmRzPzogQm91bmRzMjsgLy8gSWYgYXNzZXJ0aW9ucyBhcmUgZW5hYmxlZFxyXG4gIHByaXZhdGUgX29yaWdpbmFsQ2hpbGRCb3VuZHM/OiBCb3VuZHMyOyAvLyBJZiBhc3NlcnRpb25zIGFyZSBlbmFibGVkXHJcblxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKSBQZXJmb3JtYW5jZSBoaW50OiBXaGF0IHR5cGUgb2YgcmVuZGVyZXIgc2hvdWxkIGJlIGZvcmNlZCBmb3IgdGhpcyBOb2RlLiBVc2VzIHRoZSBpbnRlcm5hbFxyXG4gIC8vIGJpdG1hc2sgc3RydWN0dXJlIGRlY2xhcmVkIGluIFJlbmRlcmVyLlxyXG4gIHB1YmxpYyBfcmVuZGVyZXI6IG51bWJlcjtcclxuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpIFBlcmZvcm1hbmNlIGhpbnQ6IFdoZXRoZXIgaXQgaXMgYW50aWNpcGF0ZWQgdGhhdCBvcGFjaXR5IHdpbGwgYmUgc3dpdGNoZWQgb24uIElmIHNvLCBoYXZpbmcgdGhpc1xyXG4gIC8vIHNldCB0byB0cnVlIHdpbGwgbWFrZSBzd2l0Y2hpbmcgYmFjay1hbmQtZm9ydGggYmV0d2VlbiBvcGFjaXR5OjEgYW5kIG90aGVyIG9wYWNpdGllcyBtdWNoIGZhc3Rlci5cclxuICBwdWJsaWMgX3VzZXNPcGFjaXR5OiBib29sZWFuO1xyXG5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbCkgUGVyZm9ybWFuY2UgaGludDogV2hldGhlciBsYXllcnMgc2hvdWxkIGJlIHNwbGl0IGJlZm9yZSBhbmQgYWZ0ZXIgdGhpcyBOb2RlLlxyXG4gIHB1YmxpYyBfbGF5ZXJTcGxpdDogYm9vbGVhbjtcclxuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpIFBlcmZvcm1hbmNlIGhpbnQ6IFdoZXRoZXIgdGhpcyBOb2RlIGFuZCBpdHMgc3VidHJlZSBzaG91bGQgaGFuZGxlIHRyYW5zZm9ybXMgYnkgdXNpbmcgYSBDU1NcclxuICAvLyB0cmFuc2Zvcm0gb2YgYSBkaXYuXHJcbiAgcHVibGljIF9jc3NUcmFuc2Zvcm06IGJvb2xlYW47XHJcblxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKSBQZXJmb3JtYW5jZSBoaW50OiBXaGV0aGVyIFNWRyAob3Igb3RoZXIpIGNvbnRlbnQgc2hvdWxkIGJlIGV4Y2x1ZGVkIGZyb20gdGhlIERPTSB0cmVlIHdoZW5cclxuICAvLyBpbnZpc2libGUgKGluc3RlYWQgb2YganVzdCBiZWluZyBoaWRkZW4pXHJcbiAgcHVibGljIF9leGNsdWRlSW52aXNpYmxlOiBib29sZWFuO1xyXG5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbCkgUGVyZm9ybWFuY2UgaGludDogSWYgbm9uLW51bGwsIGEgbXVsdGlwbGllciB0byB0aGUgZGV0ZWN0ZWQgcGl4ZWwtdG8tcGl4ZWwgc2NhbGluZyBvZiB0aGVcclxuICAvLyBXZWJHTCBDYW52YXNcclxuICBwdWJsaWMgX3dlYmdsU2NhbGU6IG51bWJlciB8IG51bGw7XHJcblxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKSBQZXJmb3JtYW5jZSBoaW50OiBJZiB0cnVlLCBTY2VuZXJ5IHdpbGwgbm90IGZpdCBhbnkgYmxvY2tzIHRoYXQgY29udGFpbiBkcmF3YWJsZXMgYXR0YWNoZWQgdG9cclxuICAvLyBOb2RlcyB1bmRlcm5lYXRoIHRoaXMgTm9kZSdzIHN1YnRyZWUuIFRoaXMgd2lsbCB0eXBpY2FsbHkgcHJldmVudCBTY2VuZXJ5IGZyb20gdHJpZ2dlcmluZyBib3VuZHMgY29tcHV0YXRpb24gZm9yXHJcbiAgLy8gdGhpcyBzdWItdHJlZSwgYW5kIG1vdmVtZW50IG9mIHRoaXMgTm9kZSBvciBpdHMgZGVzY2VuZGFudHMgd2lsbCBuZXZlciB0cmlnZ2VyIHRoZSByZWZpdHRpbmcgb2YgYSBibG9jay5cclxuICBwdWJsaWMgX3ByZXZlbnRGaXQ6IGJvb2xlYW47XHJcblxyXG4gIC8vIFRoaXMgaXMgZmlyZWQgb25seSBvbmNlIGZvciBhbnkgc2luZ2xlIG9wZXJhdGlvbiB0aGF0IG1heSBjaGFuZ2UgdGhlIGNoaWxkcmVuIG9mIGEgTm9kZS5cclxuICAvLyBGb3IgZXhhbXBsZSwgaWYgYSBOb2RlJ3MgY2hpbGRyZW4gYXJlIFsgYSwgYiBdIGFuZCBzZXRDaGlsZHJlbiggWyBhLCB4LCB5LCB6IF0gKSBpcyBjYWxsZWQgb24gaXQsIHRoZVxyXG4gIC8vIGNoaWxkcmVuQ2hhbmdlZCBldmVudCB3aWxsIG9ubHkgYmUgZmlyZWQgb25jZSBhZnRlciB0aGUgZW50aXJlIG9wZXJhdGlvbiBvZiBjaGFuZ2luZyB0aGUgY2hpbGRyZW4gaXMgY29tcGxldGVkLlxyXG4gIHB1YmxpYyByZWFkb25seSBjaGlsZHJlbkNoYW5nZWRFbWl0dGVyOiBURW1pdHRlciA9IG5ldyBUaW55RW1pdHRlcigpO1xyXG5cclxuICAvLyBGb3IgZXZlcnkgc2luZ2xlIGFkZGVkIGNoaWxkIE5vZGUsIGVtaXRzIHdpdGgge05vZGV9IE5vZGUsIHtudW1iZXJ9IGluZGV4T2ZDaGlsZFxyXG4gIHB1YmxpYyByZWFkb25seSBjaGlsZEluc2VydGVkRW1pdHRlcjogVEVtaXR0ZXI8WyBub2RlOiBOb2RlLCBpbmRleE9mQ2hpbGQ6IG51bWJlciBdPiA9IG5ldyBUaW55RW1pdHRlcigpO1xyXG5cclxuICAvLyBGb3IgZXZlcnkgc2luZ2xlIHJlbW92ZWQgY2hpbGQgTm9kZSwgZW1pdHMgd2l0aCB7Tm9kZX0gTm9kZSwge251bWJlcn0gaW5kZXhPZkNoaWxkXHJcbiAgcHVibGljIHJlYWRvbmx5IGNoaWxkUmVtb3ZlZEVtaXR0ZXI6IFRFbWl0dGVyPFsgbm9kZTogTm9kZSwgaW5kZXhPZkNoaWxkOiBudW1iZXIgXT4gPSBuZXcgVGlueUVtaXR0ZXIoKTtcclxuXHJcbiAgLy8gUHJvdmlkZXMgYSBnaXZlbiByYW5nZSB0aGF0IG1heSBiZSBhZmZlY3RlZCBieSB0aGUgcmVvcmRlcmluZ1xyXG4gIHB1YmxpYyByZWFkb25seSBjaGlsZHJlblJlb3JkZXJlZEVtaXR0ZXI6IFRFbWl0dGVyPFsgbWluQ2hhbmdlZEluZGV4OiBudW1iZXIsIG1heENoYW5nZWRJbmRleDogbnVtYmVyIF0+ID0gbmV3IFRpbnlFbWl0dGVyKCk7XHJcblxyXG4gIC8vIEZpcmVkIHdoZW5ldmVyIGEgcGFyZW50IGlzIGFkZGVkXHJcbiAgcHVibGljIHJlYWRvbmx5IHBhcmVudEFkZGVkRW1pdHRlcjogVEVtaXR0ZXI8WyBub2RlOiBOb2RlIF0+ID0gbmV3IFRpbnlFbWl0dGVyKCk7XHJcblxyXG4gIC8vIEZpcmVkIHdoZW5ldmVyIGEgcGFyZW50IGlzIHJlbW92ZWRcclxuICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50UmVtb3ZlZEVtaXR0ZXI6IFRFbWl0dGVyPFsgbm9kZTogTm9kZSBdPiA9IG5ldyBUaW55RW1pdHRlcigpO1xyXG5cclxuICAvLyBGaXJlZCBzeW5jaHJvbm91c2x5IHdoZW4gdGhlIHRyYW5zZm9ybSAodHJhbnNmb3JtYXRpb24gbWF0cml4KSBvZiBhIE5vZGUgaXMgY2hhbmdlZC4gQW55XHJcbiAgLy8gY2hhbmdlIHRvIGEgTm9kZSdzIHRyYW5zbGF0aW9uL3JvdGF0aW9uL3NjYWxlL2V0Yy4gd2lsbCB0cmlnZ2VyIHRoaXMgZXZlbnQuXHJcbiAgcHVibGljIHJlYWRvbmx5IHRyYW5zZm9ybUVtaXR0ZXI6IFRFbWl0dGVyID0gbmV3IFRpbnlFbWl0dGVyKCk7XHJcblxyXG4gIC8vIFNob3VsZCBiZSBlbWl0dGVkIHdoZW4gd2UgbmVlZCB0byBjaGVjayBmdWxsIG1ldGFkYXRhIHVwZGF0ZXMgZGlyZWN0bHkgb24gSW5zdGFuY2VzLFxyXG4gIC8vIHRvIHNlZSBpZiB3ZSBuZWVkIHRvIGNoYW5nZSBkcmF3YWJsZSB0eXBlcywgZXRjLlxyXG4gIHB1YmxpYyByZWFkb25seSBpbnN0YW5jZVJlZnJlc2hFbWl0dGVyOiBURW1pdHRlciA9IG5ldyBUaW55RW1pdHRlcigpO1xyXG5cclxuICAvLyBFbWl0dGVkIHRvIHdoZW4gd2UgbmVlZCB0byBwb3RlbnRpYWxseSByZWNvbXB1dGUgb3VyIHJlbmRlcmVyIHN1bW1hcnkgKGJpdG1hc2sgZmxhZ3MsIG9yXHJcbiAgLy8gdGhpbmdzIHRoYXQgY291bGQgYWZmZWN0IGRlc2NlbmRhbnRzKVxyXG4gIHB1YmxpYyByZWFkb25seSByZW5kZXJlclN1bW1hcnlSZWZyZXNoRW1pdHRlcjogVEVtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXIoKTtcclxuXHJcbiAgLy8gRW1pdHRlZCB0byB3aGVuIHdlIGNoYW5nZSBmaWx0ZXJzIChlaXRoZXIgb3BhY2l0eSBvciBnZW5lcmFsaXplZCBmaWx0ZXJzKVxyXG4gIHB1YmxpYyByZWFkb25seSBmaWx0ZXJDaGFuZ2VFbWl0dGVyOiBURW1pdHRlciA9IG5ldyBUaW55RW1pdHRlcigpO1xyXG5cclxuICAvLyBGaXJlZCB3aGVuIGFuIGluc3RhbmNlIGlzIGNoYW5nZWQgKGFkZGVkL3JlbW92ZWQpLiBDQVJFRlVMISEgVGhpcyBpcyBwb3RlbnRpYWxseSBhIHZlcnkgZGFuZ2Vyb3VzIHRoaW5nIHRvIGxpc3RlblxyXG4gIC8vIHRvLiBJbnN0YW5jZXMgYXJlIHVwZGF0ZWQgaW4gYW4gYXN5bmNocm9ub3VzIGJhdGNoIGR1cmluZyBgdXBkYXRlRGlzcGxheSgpYCwgYW5kIGl0IGlzIHZlcnkgaW1wb3J0YW50IHRoYXQgZGlzcGxheVxyXG4gIC8vIHVwZGF0ZXMgZG8gbm90IGNhdXNlIGNoYW5nZXMgdGhlIHNjZW5lIGdyYXBoLiBUaHVzLCB0aGlzIGVtaXR0ZXIgc2hvdWxkIE5FVkVSIHRyaWdnZXIgYSBOb2RlJ3Mgc3RhdGUgdG8gY2hhbmdlLlxyXG4gIC8vIEN1cnJlbnRseSwgYWxsIHVzYWdlcyBvZiB0aGlzIGNhdXNlIGludG8gdXBkYXRlcyB0byB0aGUgYXVkaW8gdmlldywgb3IgdXBkYXRlcyB0byBhIHNlcGFyYXRlIGRpc3BsYXkgKHVzZWQgYXMgYW5cclxuICAvLyBvdmVybGF5KS4gUGxlYXNlIHByb2NlZWQgd2l0aCBjYXV0aW9uLiBNb3N0IGxpa2VseSB5b3UgcHJlZmVyIHRvIHVzZSB0aGUgc3luY2hyb25vdXMgc3VwcG9ydCBvZiBEaXNwbGF5ZWRUcmFpbHNQcm9wZXJ0eSxcclxuICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE2MTUgYW5kIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNjIwIGZvciBkZXRhaWxzLlxyXG4gIHB1YmxpYyByZWFkb25seSBjaGFuZ2VkSW5zdGFuY2VFbWl0dGVyOiBURW1pdHRlcjxbIGluc3RhbmNlOiBJbnN0YW5jZSwgYWRkZWQ6IGJvb2xlYW4gXT4gPSBuZXcgVGlueUVtaXR0ZXIoKTtcclxuXHJcbiAgLy8gRmlyZWQgd2hlbmV2ZXIgdGhpcyBub2RlIGlzIGFkZGVkIGFzIGEgcm9vdCB0byBhIERpc3BsYXkgT1Igd2hlbiBpdCBpcyByZW1vdmVkIGFzIGEgcm9vdCBmcm9tIGEgRGlzcGxheSAoaS5lLlxyXG4gIC8vIHRoZSBEaXNwbGF5IGlzIGRpc3Bvc2VkKS5cclxuICBwdWJsaWMgcmVhZG9ubHkgcm9vdGVkRGlzcGxheUNoYW5nZWRFbWl0dGVyOiBURW1pdHRlcjxbIGRpc3BsYXk6IERpc3BsYXkgXT4gPSBuZXcgVGlueUVtaXR0ZXIoKTtcclxuXHJcbiAgLy8gRmlyZWQgd2hlbiBsYXlvdXRPcHRpb25zIGNoYW5nZXNcclxuICBwdWJsaWMgcmVhZG9ubHkgbGF5b3V0T3B0aW9uc0NoYW5nZWRFbWl0dGVyOiBURW1pdHRlciA9IG5ldyBUaW55RW1pdHRlcigpO1xyXG5cclxuICAvLyBBIGJpdG1hc2sgd2hpY2ggc3BlY2lmaWVzIHdoaWNoIHJlbmRlcmVycyB0aGlzIE5vZGUgKGFuZCBvbmx5IHRoaXMgTm9kZSwgbm90IGl0cyBzdWJ0cmVlKSBzdXBwb3J0cy5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX3JlbmRlcmVyQml0bWFzazogbnVtYmVyO1xyXG5cclxuICAvLyBBIGJpdG1hc2stbGlrZSBzdW1tYXJ5IG9mIHdoYXQgcmVuZGVyZXJzIGFuZCBvcHRpb25zIGFyZSBzdXBwb3J0ZWQgYnkgdGhpcyBOb2RlIGFuZCBhbGwgb2YgaXRzIGRlc2NlbmRhbnRzXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIF9yZW5kZXJlclN1bW1hcnk6IFJlbmRlcmVyU3VtbWFyeTtcclxuXHJcbiAgLy8gU28gd2UgY2FuIHRyYXZlcnNlIG9ubHkgdGhlIHN1YnRyZWVzIHRoYXQgcmVxdWlyZSBib3VuZHMgdmFsaWRhdGlvbiBmb3IgZXZlbnRzIGZpcmluZy5cclxuICAvLyBUaGlzIGlzIGEgc3VtIG9mIHRoZSBudW1iZXIgb2YgZXZlbnRzIHJlcXVpcmluZyBib3VuZHMgdmFsaWRhdGlvbiBvbiB0aGlzIE5vZGUsIHBsdXMgdGhlIG51bWJlciBvZiBjaGlsZHJlbiB3aG9zZVxyXG4gIC8vIGNvdW50IGlzIG5vbi16ZXJvLlxyXG4gIC8vIE5PVEU6IHRoaXMgbWVhbnMgdGhhdCBpZiBBIGhhcyBhIGNoaWxkIEIsIGFuZCBCIGhhcyBhIGJvdW5kc0V2ZW50Q291bnQgb2YgNSwgaXQgb25seSBjb250cmlidXRlcyAxIHRvIEEncyBjb3VudC5cclxuICAvLyBUaGlzIGFsbG93cyB1cyB0byBoYXZlIGNoYW5nZXMgbG9jYWxpemVkIChpbmNyZWFzaW5nIEIncyBjb3VudCB3b24ndCBjaGFuZ2UgQSBvciBhbnkgb2YgQSdzIGFuY2VzdG9ycyksIGFuZFxyXG4gIC8vIGd1YXJhbnRlZXMgdGhhdCB3ZSB3aWxsIGtub3cgd2hldGhlciBhIHN1YnRyZWUgaGFzIGJvdW5kcyBsaXN0ZW5lcnMuIEFsc28gaW1wb3J0YW50OiBkZWNyZWFzaW5nIEInc1xyXG4gIC8vIGJvdW5kc0V2ZW50Q291bnQgZG93biB0byAwIHdpbGwgYWxsb3cgQSB0byBkZWNyZWFzZSBpdHMgY291bnQgYnkgMSwgd2l0aG91dCBoYXZpbmcgdG8gY2hlY2sgaXRzIG90aGVyIGNoaWxkcmVuXHJcbiAgLy8gKGlmIHdlIHdlcmUganVzdCB1c2luZyBhIGJvb2xlYW4gdmFsdWUsIHRoaXMgb3BlcmF0aW9uIHdvdWxkIHJlcXVpcmUgQSB0byBjaGVjayBpZiBhbnkgT1RIRVIgY2hpbGRyZW4gYmVzaWRlc1xyXG4gIC8vIEIgaGFkIGJvdW5kcyBsaXN0ZW5lcnMpXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIF9ib3VuZHNFdmVudENvdW50OiBudW1iZXI7XHJcblxyXG4gIC8vIFRoaXMgc2lnbmFscyB0aGF0IHdlIGNhbiB2YWxpZGF0ZUJvdW5kcygpIG9uIHRoaXMgc3VidHJlZSBhbmQgd2UgZG9uJ3QgaGF2ZSB0byB0cmF2ZXJzZSBmdXJ0aGVyXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIF9ib3VuZHNFdmVudFNlbGZDb3VudDogbnVtYmVyO1xyXG5cclxuICAvLyBTdWJjb21wb25lbnQgZGVkaWNhdGVkIHRvIGhpdCB0ZXN0aW5nXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIF9waWNrZXI6IFBpY2tlcjtcclxuXHJcbiAgLy8gVGhlcmUgYXJlIGNlcnRhaW4gc3BlY2lmaWMgY2FzZXMgKGluIHRoaXMgY2FzZSBkdWUgdG8gYTExeSkgd2hlcmUgd2UgbmVlZFxyXG4gIC8vIHRvIGtub3cgdGhhdCBhIE5vZGUgaXMgZ2V0dGluZyByZW1vdmVkIGZyb20gaXRzIHBhcmVudCBCVVQgdGhhdCBwcm9jZXNzIGhhcyBub3QgY29tcGxldGVkIHlldC4gSXQgd291bGQgYmUgaWRlYWxcclxuICAvLyB0byBub3QgbmVlZCB0aGlzLlxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyBfaXNHZXR0aW5nUmVtb3ZlZEZyb21QYXJlbnQ6IGJvb2xlYW47XHJcblxyXG4gIC8vIHtPYmplY3R9IC0gQSBtYXBwaW5nIG9mIGFsbCBvZiBvcHRpb25zIHRoYXQgcmVxdWlyZSBCb3VuZHMgdG8gYmUgYXBwbGllZCBwcm9wZXJseS4gTW9zdCBvZnRlbiB0aGVzZSBzaG91bGQgYmUgc2V0IHRocm91Z2ggYG11dGF0ZWAgaW4gdGhlIGVuZCBvZiB0aGUgY29uc3RydWNvciBpbnN0ZWFkIG9mIGJlaW5nIHBhc3NlZCB0aHJvdWdoIGBzdXBlcigpYFxyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgUkVRVUlSRVNfQk9VTkRTX09QVElPTl9LRVlTID0gUkVRVUlSRVNfQk9VTkRTX09QVElPTl9LRVlTO1xyXG5cclxuICAvLyBVc2VkIGJ5IHNjZW5lcnlEZXNlcmlhbGl6ZVxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyBfc2VyaWFsaXphdGlvbj86IEludGVudGlvbmFsQW55O1xyXG5cclxuICAvLyBUcmFja3MgYW55IGxheW91dCBjb25zdHJhaW50LCBzbyB0aGF0IHdlIGNhbiBhdm9pZCBoYXZpbmcgbXVsdGlwbGUgbGF5b3V0IGNvbnN0cmFpbnRzIG9uIHRoZSBzYW1lIG5vZGVcclxuICAvLyAoYW5kIGF2b2lkIHRoZSBpbmZpbml0ZSBsb29wcyB0aGF0IGNhbiBoYXBwZW4gaWYgdGhhdCBpcyB0cmlnZ2VyZWQpLlxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyBfYWN0aXZlUGFyZW50TGF5b3V0Q29uc3RyYWludDogTGF5b3V0Q29uc3RyYWludCB8IG51bGwgPSBudWxsO1xyXG5cclxuICAvLyBUaGlzIGlzIGFuIGFycmF5IG9mIHByb3BlcnR5IChzZXR0ZXIpIG5hbWVzIGZvciBOb2RlLm11dGF0ZSgpLCB3aGljaCBhcmUgYWxzbyB1c2VkIHdoZW4gY3JlYXRpbmdcclxuICAvLyBOb2RlcyB3aXRoIHBhcmFtZXRlciBvYmplY3RzLlxyXG4gIC8vXHJcbiAgLy8gRS5nLiBuZXcgcGhldC5zY2VuZXJ5Lk5vZGUoIHsgeDogNSwgcm90YXRpb246IDIwIH0gKSB3aWxsIGNyZWF0ZSBhIFBhdGgsIGFuZCBhcHBseSBzZXR0ZXJzIGluIHRoZSBvcmRlciBiZWxvd1xyXG4gIC8vIChub2RlLnggPSA1OyBub2RlLnJvdGF0aW9uID0gMjApXHJcbiAgLy9cclxuICAvLyBTb21lIHNwZWNpYWwgY2FzZXMgZXhpc3QgKGZvciBmdW5jdGlvbiBuYW1lcykuIG5ldyBwaGV0LnNjZW5lcnkuTm9kZSggeyBzY2FsZTogMiB9ICkgd2lsbCBhY3R1YWxseSBjYWxsXHJcbiAgLy8gbm9kZS5zY2FsZSggMiApLlxyXG4gIC8vXHJcbiAgLy8gVGhlIG9yZGVyIGJlbG93IGlzIGltcG9ydGFudCEgRG9uJ3QgY2hhbmdlIHRoaXMgd2l0aG91dCBrbm93aW5nIHRoZSBpbXBsaWNhdGlvbnMuXHJcbiAgLy9cclxuICAvLyBOT1RFOiBUcmFuc2xhdGlvbi1iYXNlZCBtdXRhdG9ycyBjb21lIGJlZm9yZSByb3RhdGlvbi9zY2FsZSwgc2luY2UgdHlwaWNhbGx5IHdlIHRoaW5rIG9mIHRoZWlyIG9wZXJhdGlvbnNcclxuICAvLyAgICAgICBvY2N1cnJpbmcgXCJhZnRlclwiIHRoZSByb3RhdGlvbiAvIHNjYWxpbmdcclxuICAvLyBOT1RFOiBsZWZ0L3JpZ2h0L3RvcC9ib3R0b20vY2VudGVyWC9jZW50ZXJZIGFyZSBhdCB0aGUgZW5kLCBzaW5jZSB0aGV5IHJlbHkgcG90ZW50aWFsbHkgb24gcm90YXRpb24gLyBzY2FsaW5nXHJcbiAgLy8gICAgICAgY2hhbmdlcyBvZiBib3VuZHMgdGhhdCBtYXkgaGFwcGVuIGJlZm9yZWhhbmRcclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX211dGF0b3JLZXlzITogc3RyaW5nW107XHJcblxyXG4gIC8vIExpc3Qgb2YgYWxsIGRpcnR5IGZsYWdzIHRoYXQgc2hvdWxkIGJlIGF2YWlsYWJsZSBvbiBkcmF3YWJsZXMgY3JlYXRlZCBmcm9tIHRoaXMgTm9kZSAob3JcclxuICAvLyBzdWJ0eXBlKS4gR2l2ZW4gYSBmbGFnIChlLmcuIHJhZGl1cyksIGl0IGluZGljYXRlcyB0aGUgZXhpc3RlbmNlIG9mIGEgZnVuY3Rpb25cclxuICAvLyBkcmF3YWJsZS5tYXJrRGlydHlSYWRpdXMoKSB0aGF0IHdpbGwgaW5kaWNhdGUgdG8gdGhlIGRyYXdhYmxlIHRoYXQgdGhlIHJhZGl1cyBoYXMgY2hhbmdlZC5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAvL1xyXG4gIC8vIFNob3VsZCBiZSBvdmVycmlkZGVuIGJ5IHN1YnR5cGVzLlxyXG4gIHB1YmxpYyBkcmF3YWJsZU1hcmtGbGFncyE6IHN0cmluZ1tdO1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgTm9kZSB3aXRoIG9wdGlvbnMuXHJcbiAgICpcclxuICAgKiBOT1RFOiBEaXJlY3RseSBjcmVhdGVkIE5vZGVzIChub3Qgb2YgYW55IHN1YnR5cGUsIGJ1dCBjcmVhdGVkIHdpdGggXCJuZXcgTm9kZSggLi4uIClcIikgYXJlIGdlbmVyYWxseSB1c2VkIGFzXHJcbiAgICogICAgICAgY29udGFpbmVycywgd2hpY2ggY2FuIGhvbGQgb3RoZXIgTm9kZXMsIHN1YnR5cGVzIG9mIE5vZGUgdGhhdCBjYW4gZGlzcGxheSB0aGluZ3MuXHJcbiAgICpcclxuICAgKiBOb2RlIGFuZCBpdHMgc3VidHlwZXMgZ2VuZXJhbGx5IGhhdmUgdGhlIGxhc3QgY29uc3RydWN0b3IgcGFyYW1ldGVyIHJlc2VydmVkIGZvciB0aGUgJ29wdGlvbnMnIG9iamVjdC4gVGhpcyBpcyBhXHJcbiAgICoga2V5LXZhbHVlIG1hcCB0aGF0IHNwZWNpZmllcyByZWxldmFudCBvcHRpb25zIHRoYXQgYXJlIHVzZWQgYnkgTm9kZSBhbmQgc3VidHlwZXMuXHJcbiAgICpcclxuICAgKiBGb3IgZXhhbXBsZSwgb25lIG9mIE5vZGUncyBvcHRpb25zIGlzIGJvdHRvbSwgYW5kIG9uZSBvZiBDaXJjbGUncyBvcHRpb25zIGlzIHJhZGl1cy4gV2hlbiBhIGNpcmNsZSBpcyBjcmVhdGVkOlxyXG4gICAqICAgdmFyIGNpcmNsZSA9IG5ldyBDaXJjbGUoIHtcclxuICAgKiAgICAgcmFkaXVzOiAxMCxcclxuICAgKiAgICAgYm90dG9tOiAyMDBcclxuICAgKiAgIH0gKTtcclxuICAgKiBUaGlzIHdpbGwgY3JlYXRlIGEgQ2lyY2xlLCBzZXQgaXRzIHJhZGl1cyAoYnkgZXhlY3V0aW5nIGNpcmNsZS5yYWRpdXMgPSAxMCwgd2hpY2ggdXNlcyBjaXJjbGUuc2V0UmFkaXVzKCkpLCBhbmRcclxuICAgKiB0aGVuIHdpbGwgYWxpZ24gdGhlIGJvdHRvbSBvZiB0aGUgY2lyY2xlIGFsb25nIHk9MjAwIChieSBleGVjdXRpbmcgY2lyY2xlLmJvdHRvbSA9IDIwMCwgd2hpY2ggdXNlc1xyXG4gICAqIG5vZGUuc2V0Qm90dG9tKCkpLlxyXG4gICAqXHJcbiAgICogVGhlIG9wdGlvbnMgYXJlIGV4ZWN1dGVkIGluIHRoZSBvcmRlciBzcGVjaWZpZWQgYnkgZWFjaCB0eXBlcyBfbXV0YXRvcktleXMgcHJvcGVydHkuXHJcbiAgICpcclxuICAgKiBUaGUgb3B0aW9ucyBvYmplY3QgaXMgY3VycmVudGx5IG5vdCBjaGVja2VkIHRvIHNlZSB3aGV0aGVyIHRoZXJlIGFyZSBwcm9wZXJ0eSAoa2V5KSBuYW1lcyB0aGF0IGFyZSBub3QgdXNlZCwgc28gaXRcclxuICAgKiBpcyBjdXJyZW50bHkgbGVnYWwgdG8gZG8gXCJuZXcgTm9kZSggeyBmb3JrX2tpdGNoZW5fc3Bvb246IDUgfSApXCIuXHJcbiAgICpcclxuICAgKiBVc3VhbGx5LCBhbiBvcHRpb24gKGUuZy4gJ3Zpc2libGUnKSwgd2hlbiB1c2VkIGluIGEgY29uc3RydWN0b3Igb3IgbXV0YXRlKCkgY2FsbCwgd2lsbCBkaXJlY3RseSB1c2UgdGhlIEVTNSBzZXR0ZXJcclxuICAgKiBmb3IgdGhhdCBwcm9wZXJ0eSAoZS5nLiBub2RlLnZpc2libGUgPSAuLi4pLCB3aGljaCBnZW5lcmFsbHkgZm9yd2FyZHMgdG8gYSBub24tRVM1IHNldHRlciBmdW5jdGlvblxyXG4gICAqIChlLmcuIG5vZGUuc2V0VmlzaWJsZSggLi4uICkpIHRoYXQgaXMgcmVzcG9uc2libGUgZm9yIHRoZSBiZWhhdmlvci4gRG9jdW1lbnRhdGlvbiBpcyBnZW5lcmFsbHkgb24gdGhlc2UgbWV0aG9kc1xyXG4gICAqIChlLmcuIHNldFZpc2libGUpLCBhbHRob3VnaCBzb21lIG1ldGhvZHMgbWF5IGJlIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdG8gYXZvaWQgdmVyYm9zaXR5IChsaWtlIG5vZGUubGVmdFRvcCkuXHJcbiAgICpcclxuICAgKiBTb21ldGltZXMsIG9wdGlvbnMgaW52b2tlIGEgZnVuY3Rpb24gaW5zdGVhZCAoZS5nLiAnc2NhbGUnKSBiZWNhdXNlIHRoZSB2ZXJiIGFuZCBub3VuIGFyZSBpZGVudGljYWwuIEluIHRoaXMgY2FzZSxcclxuICAgKiBpbnN0ZWFkIG9mIHNldHRpbmcgdGhlIHNldHRlciAobm9kZS5zY2FsZSA9IC4uLiwgd2hpY2ggd291bGQgb3ZlcnJpZGUgdGhlIGZ1bmN0aW9uKSwgaXQgd2lsbCBpbnN0ZWFkIGNhbGxcclxuICAgKiB0aGUgbWV0aG9kIGRpcmVjdGx5IChlLmcuIG5vZGUuc2NhbGUoIC4uLiApKS5cclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIG9wdGlvbnM/OiBOb2RlT3B0aW9ucyApIHtcclxuXHJcbiAgICBzdXBlcigpO1xyXG5cclxuICAgIHRoaXMuX2lkID0gZ2xvYmFsSWRDb3VudGVyKys7XHJcbiAgICB0aGlzLl9pbnN0YW5jZXMgPSBbXTtcclxuICAgIHRoaXMuX3Jvb3RlZERpc3BsYXlzID0gW107XHJcbiAgICB0aGlzLl9kcmF3YWJsZXMgPSBbXTtcclxuICAgIHRoaXMuX3Zpc2libGVQcm9wZXJ0eSA9IG5ldyBUaW55Rm9yd2FyZGluZ1Byb3BlcnR5KCBERUZBVUxUX09QVElPTlMudmlzaWJsZSwgREVGQVVMVF9PUFRJT05TLnBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZCxcclxuICAgICAgdGhpcy5vblZpc2libGVQcm9wZXJ0eUNoYW5nZS5iaW5kKCB0aGlzICkgKTtcclxuICAgIHRoaXMub3BhY2l0eVByb3BlcnR5ID0gbmV3IFRpbnlQcm9wZXJ0eSggREVGQVVMVF9PUFRJT05TLm9wYWNpdHksIHRoaXMub25PcGFjaXR5UHJvcGVydHlDaGFuZ2UuYmluZCggdGhpcyApICk7XHJcbiAgICB0aGlzLmRpc2FibGVkT3BhY2l0eVByb3BlcnR5ID0gbmV3IFRpbnlQcm9wZXJ0eSggREVGQVVMVF9PUFRJT05TLmRpc2FibGVkT3BhY2l0eSwgdGhpcy5vbkRpc2FibGVkT3BhY2l0eVByb3BlcnR5Q2hhbmdlLmJpbmQoIHRoaXMgKSApO1xyXG4gICAgdGhpcy5fcGlja2FibGVQcm9wZXJ0eSA9IG5ldyBUaW55Rm9yd2FyZGluZ1Byb3BlcnR5PGJvb2xlYW4gfCBudWxsPiggREVGQVVMVF9PUFRJT05TLnBpY2thYmxlLFxyXG4gICAgICBmYWxzZSwgdGhpcy5vblBpY2thYmxlUHJvcGVydHlDaGFuZ2UuYmluZCggdGhpcyApICk7XHJcbiAgICB0aGlzLl9lbmFibGVkUHJvcGVydHkgPSBuZXcgVGlueUZvcndhcmRpbmdQcm9wZXJ0eTxib29sZWFuPiggREVGQVVMVF9PUFRJT05TLmVuYWJsZWQsXHJcbiAgICAgIERFRkFVTFRfT1BUSU9OUy5waGV0aW9FbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQsIHRoaXMub25FbmFibGVkUHJvcGVydHlDaGFuZ2UuYmluZCggdGhpcyApICk7XHJcblxyXG4gICAgdGhpcy5faW5wdXRFbmFibGVkUHJvcGVydHkgPSBuZXcgVGlueUZvcndhcmRpbmdQcm9wZXJ0eSggREVGQVVMVF9PUFRJT05TLmlucHV0RW5hYmxlZCxcclxuICAgICAgREVGQVVMVF9PUFRJT05TLnBoZXRpb0lucHV0RW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkICk7XHJcbiAgICB0aGlzLmNsaXBBcmVhUHJvcGVydHkgPSBuZXcgVGlueVByb3BlcnR5PFNoYXBlIHwgbnVsbD4oIERFRkFVTFRfT1BUSU9OUy5jbGlwQXJlYSApO1xyXG4gICAgdGhpcy52b2ljaW5nVmlzaWJsZVByb3BlcnR5ID0gbmV3IFRpbnlQcm9wZXJ0eTxib29sZWFuPiggdHJ1ZSApO1xyXG4gICAgdGhpcy5fbW91c2VBcmVhID0gREVGQVVMVF9PUFRJT05TLm1vdXNlQXJlYTtcclxuICAgIHRoaXMuX3RvdWNoQXJlYSA9IERFRkFVTFRfT1BUSU9OUy50b3VjaEFyZWE7XHJcbiAgICB0aGlzLl9jdXJzb3IgPSBERUZBVUxUX09QVElPTlMuY3Vyc29yO1xyXG4gICAgdGhpcy5fY2hpbGRyZW4gPSBbXTtcclxuICAgIHRoaXMuX3BhcmVudHMgPSBbXTtcclxuICAgIHRoaXMuX3RyYW5zZm9ybUJvdW5kcyA9IERFRkFVTFRfT1BUSU9OUy50cmFuc2Zvcm1Cb3VuZHM7XHJcbiAgICB0aGlzLl90cmFuc2Zvcm0gPSBuZXcgVHJhbnNmb3JtMygpO1xyXG4gICAgdGhpcy5fdHJhbnNmb3JtTGlzdGVuZXIgPSB0aGlzLm9uVHJhbnNmb3JtQ2hhbmdlLmJpbmQoIHRoaXMgKTtcclxuICAgIHRoaXMuX3RyYW5zZm9ybS5jaGFuZ2VFbWl0dGVyLmFkZExpc3RlbmVyKCB0aGlzLl90cmFuc2Zvcm1MaXN0ZW5lciApO1xyXG4gICAgdGhpcy5fbWF4V2lkdGggPSBERUZBVUxUX09QVElPTlMubWF4V2lkdGg7XHJcbiAgICB0aGlzLl9tYXhIZWlnaHQgPSBERUZBVUxUX09QVElPTlMubWF4SGVpZ2h0O1xyXG4gICAgdGhpcy5fYXBwbGllZFNjYWxlRmFjdG9yID0gMTtcclxuICAgIHRoaXMuX2lucHV0TGlzdGVuZXJzID0gW107XHJcbiAgICB0aGlzLl9yZW5kZXJlciA9IERFRkFVTFRfSU5URVJOQUxfUkVOREVSRVI7XHJcbiAgICB0aGlzLl91c2VzT3BhY2l0eSA9IERFRkFVTFRfT1BUSU9OUy51c2VzT3BhY2l0eTtcclxuICAgIHRoaXMuX2xheWVyU3BsaXQgPSBERUZBVUxUX09QVElPTlMubGF5ZXJTcGxpdDtcclxuICAgIHRoaXMuX2Nzc1RyYW5zZm9ybSA9IERFRkFVTFRfT1BUSU9OUy5jc3NUcmFuc2Zvcm07XHJcbiAgICB0aGlzLl9leGNsdWRlSW52aXNpYmxlID0gREVGQVVMVF9PUFRJT05TLmV4Y2x1ZGVJbnZpc2libGU7XHJcbiAgICB0aGlzLl93ZWJnbFNjYWxlID0gREVGQVVMVF9PUFRJT05TLndlYmdsU2NhbGU7XHJcbiAgICB0aGlzLl9wcmV2ZW50Rml0ID0gREVGQVVMVF9PUFRJT05TLnByZXZlbnRGaXQ7XHJcblxyXG4gICAgdGhpcy5pbnB1dEVuYWJsZWRQcm9wZXJ0eS5sYXp5TGluayggdGhpcy5wZG9tQm91bmRJbnB1dEVuYWJsZWRMaXN0ZW5lciApO1xyXG5cclxuICAgIC8vIEFkZCBsaXN0ZW5lciBjb3VudCBjaGFuZ2Ugbm90aWZpY2F0aW9ucyBpbnRvIHRoZXNlIFByb3BlcnRpZXMsIHNpbmNlIHdlIG5lZWQgdG8ga25vdyB3aGVuIHRoZWlyIG51bWJlciBvZiBsaXN0ZW5lcnNcclxuICAgIC8vIGNoYW5nZXMgZHluYW1pY2FsbHkuXHJcbiAgICBjb25zdCBib3VuZHNMaXN0ZW5lcnNBZGRlZE9yUmVtb3ZlZExpc3RlbmVyID0gdGhpcy5vbkJvdW5kc0xpc3RlbmVyc0FkZGVkT3JSZW1vdmVkLmJpbmQoIHRoaXMgKTtcclxuXHJcbiAgICBjb25zdCBib3VuZHNJbnZhbGlkYXRpb25MaXN0ZW5lciA9IHRoaXMudmFsaWRhdGVCb3VuZHMuYmluZCggdGhpcyApO1xyXG4gICAgY29uc3Qgc2VsZkJvdW5kc0ludmFsaWRhdGlvbkxpc3RlbmVyID0gdGhpcy52YWxpZGF0ZVNlbGZCb3VuZHMuYmluZCggdGhpcyApO1xyXG5cclxuICAgIHRoaXMuYm91bmRzUHJvcGVydHkgPSBuZXcgVGlueVN0YXRpY1Byb3BlcnR5KCBCb3VuZHMyLk5PVEhJTkcuY29weSgpLCBib3VuZHNJbnZhbGlkYXRpb25MaXN0ZW5lciApO1xyXG4gICAgdGhpcy5ib3VuZHNQcm9wZXJ0eS5jaGFuZ2VDb3VudCA9IGJvdW5kc0xpc3RlbmVyc0FkZGVkT3JSZW1vdmVkTGlzdGVuZXI7XHJcblxyXG4gICAgdGhpcy5sb2NhbEJvdW5kc1Byb3BlcnR5ID0gbmV3IFRpbnlTdGF0aWNQcm9wZXJ0eSggQm91bmRzMi5OT1RISU5HLmNvcHkoKSwgYm91bmRzSW52YWxpZGF0aW9uTGlzdGVuZXIgKTtcclxuICAgIHRoaXMubG9jYWxCb3VuZHNQcm9wZXJ0eS5jaGFuZ2VDb3VudCA9IGJvdW5kc0xpc3RlbmVyc0FkZGVkT3JSZW1vdmVkTGlzdGVuZXI7XHJcblxyXG4gICAgdGhpcy5jaGlsZEJvdW5kc1Byb3BlcnR5ID0gbmV3IFRpbnlTdGF0aWNQcm9wZXJ0eSggQm91bmRzMi5OT1RISU5HLmNvcHkoKSwgYm91bmRzSW52YWxpZGF0aW9uTGlzdGVuZXIgKTtcclxuICAgIHRoaXMuY2hpbGRCb3VuZHNQcm9wZXJ0eS5jaGFuZ2VDb3VudCA9IGJvdW5kc0xpc3RlbmVyc0FkZGVkT3JSZW1vdmVkTGlzdGVuZXI7XHJcblxyXG4gICAgdGhpcy5zZWxmQm91bmRzUHJvcGVydHkgPSBuZXcgVGlueVN0YXRpY1Byb3BlcnR5KCBCb3VuZHMyLk5PVEhJTkcuY29weSgpLCBzZWxmQm91bmRzSW52YWxpZGF0aW9uTGlzdGVuZXIgKTtcclxuXHJcbiAgICB0aGlzLl9sb2NhbEJvdW5kc092ZXJyaWRkZW4gPSBmYWxzZTtcclxuICAgIHRoaXMuX2V4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMgPSBmYWxzZTtcclxuICAgIHRoaXMuX2xheW91dE9wdGlvbnMgPSBudWxsO1xyXG4gICAgdGhpcy5fYm91bmRzRGlydHkgPSB0cnVlO1xyXG4gICAgdGhpcy5fbG9jYWxCb3VuZHNEaXJ0eSA9IHRydWU7XHJcbiAgICB0aGlzLl9zZWxmQm91bmRzRGlydHkgPSB0cnVlO1xyXG4gICAgdGhpcy5fY2hpbGRCb3VuZHNEaXJ0eSA9IHRydWU7XHJcblxyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgIC8vIGZvciBhc3NlcnRpb25zIGxhdGVyIHRvIGVuc3VyZSB0aGF0IHdlIGFyZSB1c2luZyB0aGUgc2FtZSBCb3VuZHMyIGNvcGllcyBhcyBiZWZvcmVcclxuICAgICAgdGhpcy5fb3JpZ2luYWxCb3VuZHMgPSB0aGlzLmJvdW5kc1Byb3BlcnR5Ll92YWx1ZTtcclxuICAgICAgdGhpcy5fb3JpZ2luYWxMb2NhbEJvdW5kcyA9IHRoaXMubG9jYWxCb3VuZHNQcm9wZXJ0eS5fdmFsdWU7XHJcbiAgICAgIHRoaXMuX29yaWdpbmFsU2VsZkJvdW5kcyA9IHRoaXMuc2VsZkJvdW5kc1Byb3BlcnR5Ll92YWx1ZTtcclxuICAgICAgdGhpcy5fb3JpZ2luYWxDaGlsZEJvdW5kcyA9IHRoaXMuY2hpbGRCb3VuZHNQcm9wZXJ0eS5fdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fZmlsdGVycyA9IFtdO1xyXG5cclxuICAgIHRoaXMuX3JlbmRlcmVyQml0bWFzayA9IFJlbmRlcmVyLmJpdG1hc2tOb2RlRGVmYXVsdDtcclxuICAgIHRoaXMuX3JlbmRlcmVyU3VtbWFyeSA9IG5ldyBSZW5kZXJlclN1bW1hcnkoIHRoaXMgKTtcclxuXHJcbiAgICB0aGlzLl9ib3VuZHNFdmVudENvdW50ID0gMDtcclxuICAgIHRoaXMuX2JvdW5kc0V2ZW50U2VsZkNvdW50ID0gMDtcclxuICAgIHRoaXMuX3BpY2tlciA9IG5ldyBQaWNrZXIoIHRoaXMgKTtcclxuICAgIHRoaXMuX2lzR2V0dGluZ1JlbW92ZWRGcm9tUGFyZW50ID0gZmFsc2U7XHJcblxyXG4gICAgaWYgKCBvcHRpb25zICkge1xyXG4gICAgICB0aGlzLm11dGF0ZSggb3B0aW9ucyApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEluc2VydHMgYSBjaGlsZCBOb2RlIGF0IGEgc3BlY2lmaWMgaW5kZXguXHJcbiAgICpcclxuICAgKiBub2RlLmluc2VydENoaWxkKCAwLCBjaGlsZE5vZGUgKSB3aWxsIGluc2VydCB0aGUgY2hpbGQgaW50byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBjaGlsZHJlbiBhcnJheSAob24gdGhlIGJvdHRvbVxyXG4gICAqIHZpc3VhbGx5KS5cclxuICAgKlxyXG4gICAqIG5vZGUuaW5zZXJ0Q2hpbGQoIG5vZGUuY2hpbGRyZW4ubGVuZ3RoLCBjaGlsZE5vZGUgKSBpcyBlcXVpdmFsZW50IHRvIG5vZGUuYWRkQ2hpbGQoIGNoaWxkTm9kZSApLCBhbmQgYXBwZW5kcyBpdFxyXG4gICAqIHRvIHRoZSBlbmQgKHRvcCB2aXN1YWxseSkgb2YgdGhlIGNoaWxkcmVuIGFycmF5LiBJdCBpcyByZWNvbW1lbmRlZCB0byB1c2Ugbm9kZS5hZGRDaGlsZCB3aGVuIHBvc3NpYmxlLlxyXG4gICAqXHJcbiAgICogTk9URTogb3ZlcnJpZGRlbiBieSBMZWFmIGZvciBzb21lIHN1YnR5cGVzXHJcbiAgICpcclxuICAgKiBAcGFyYW0gaW5kZXggLSBJbmRleCB3aGVyZSB0aGUgaW5zZXJ0ZWQgY2hpbGQgTm9kZSB3aWxsIGJlIGFmdGVyIHRoaXMgb3BlcmF0aW9uLlxyXG4gICAqIEBwYXJhbSBub2RlIC0gVGhlIG5ldyBjaGlsZCB0byBpbnNlcnQuXHJcbiAgICogQHBhcmFtIFtpc0NvbXBvc2l0ZV0gLSAoc2NlbmVyeS1pbnRlcm5hbCkgSWYgdHJ1ZSwgdGhlIGNoaWxkcmVuQ2hhbmdlZCBldmVudCB3aWxsIG5vdCBiZSBzZW50IG91dC5cclxuICAgKi9cclxuICBwdWJsaWMgaW5zZXJ0Q2hpbGQoIGluZGV4OiBudW1iZXIsIG5vZGU6IE5vZGUsIGlzQ29tcG9zaXRlPzogYm9vbGVhbiApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG5vZGUgIT09IG51bGwgJiYgbm9kZSAhPT0gdW5kZWZpbmVkLCAnaW5zZXJ0Q2hpbGQgY2Fubm90IGluc2VydCBhIG51bGwvdW5kZWZpbmVkIGNoaWxkJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIV8uaW5jbHVkZXMoIHRoaXMuX2NoaWxkcmVuLCBub2RlICksICdQYXJlbnQgYWxyZWFkeSBjb250YWlucyBjaGlsZCcgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG5vZGUgIT09IHRoaXMsICdDYW5ub3QgYWRkIHNlbGYgYXMgYSBjaGlsZCcgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG5vZGUuX3BhcmVudHMgIT09IG51bGwsICdUcmllZCB0byBpbnNlcnQgYSBkaXNwb3NlZCBjaGlsZCBub2RlPycgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFub2RlLmlzRGlzcG9zZWQsICdUcmllZCB0byBpbnNlcnQgYSBkaXNwb3NlZCBOb2RlJyApO1xyXG5cclxuICAgIC8vIG5lZWRzIHRvIGJlIGVhcmx5IHRvIHByZXZlbnQgcmUtZW50cmFudCBjaGlsZHJlbiBtb2RpZmljYXRpb25zXHJcbiAgICB0aGlzLl9waWNrZXIub25JbnNlcnRDaGlsZCggbm9kZSApO1xyXG4gICAgdGhpcy5jaGFuZ2VCb3VuZHNFdmVudENvdW50KCBub2RlLl9ib3VuZHNFdmVudENvdW50ID4gMCA/IDEgOiAwICk7XHJcbiAgICB0aGlzLl9yZW5kZXJlclN1bW1hcnkuc3VtbWFyeUNoYW5nZSggUmVuZGVyZXJTdW1tYXJ5LmJpdG1hc2tBbGwsIG5vZGUuX3JlbmRlcmVyU3VtbWFyeS5iaXRtYXNrICk7XHJcblxyXG4gICAgbm9kZS5fcGFyZW50cy5wdXNoKCB0aGlzICk7XHJcbiAgICBpZiAoIGFzc2VydCAmJiB3aW5kb3cucGhldD8uY2hpcHBlcj8ucXVlcnlQYXJhbWV0ZXJzICYmIGlzRmluaXRlKCBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLnBhcmVudExpbWl0ICkgKSB7XHJcbiAgICAgIGNvbnN0IHBhcmVudENvdW50ID0gbm9kZS5fcGFyZW50cy5sZW5ndGg7XHJcbiAgICAgIGlmICggbWF4UGFyZW50Q291bnQgPCBwYXJlbnRDb3VudCApIHtcclxuICAgICAgICBtYXhQYXJlbnRDb3VudCA9IHBhcmVudENvdW50O1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCBgTWF4IE5vZGUgcGFyZW50czogJHttYXhQYXJlbnRDb3VudH1gICk7XHJcbiAgICAgICAgYXNzZXJ0KCBtYXhQYXJlbnRDb3VudCA8PSBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLnBhcmVudExpbWl0LFxyXG4gICAgICAgICAgYHBhcmVudCBjb3VudCBvZiAke21heFBhcmVudENvdW50fSBhYm92ZSA/cGFyZW50TGltaXQ9JHtwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLnBhcmVudExpbWl0fWAgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2NoaWxkcmVuLnNwbGljZSggaW5kZXgsIDAsIG5vZGUgKTtcclxuICAgIGlmICggYXNzZXJ0ICYmIHdpbmRvdy5waGV0Py5jaGlwcGVyPy5xdWVyeVBhcmFtZXRlcnMgJiYgaXNGaW5pdGUoIHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuY2hpbGRMaW1pdCApICkge1xyXG4gICAgICBjb25zdCBjaGlsZENvdW50ID0gdGhpcy5fY2hpbGRyZW4ubGVuZ3RoO1xyXG4gICAgICBpZiAoIG1heENoaWxkQ291bnQgPCBjaGlsZENvdW50ICkge1xyXG4gICAgICAgIG1heENoaWxkQ291bnQgPSBjaGlsZENvdW50O1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCBgTWF4IE5vZGUgY2hpbGRyZW46ICR7bWF4Q2hpbGRDb3VudH1gICk7XHJcbiAgICAgICAgYXNzZXJ0KCBtYXhDaGlsZENvdW50IDw9IHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuY2hpbGRMaW1pdCxcclxuICAgICAgICAgIGBjaGlsZCBjb3VudCBvZiAke21heENoaWxkQ291bnR9IGFib3ZlID9jaGlsZExpbWl0PSR7cGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5jaGlsZExpbWl0fWAgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIHRoaXMgYWRkZWQgc3VidHJlZSBjb250YWlucyBQRE9NIGNvbnRlbnQsIHdlIG5lZWQgdG8gbm90aWZ5IGFueSByZWxldmFudCBkaXNwbGF5c1xyXG4gICAgaWYgKCAhbm9kZS5fcmVuZGVyZXJTdW1tYXJ5Lmhhc05vUERPTSgpICkge1xyXG4gICAgICB0aGlzLm9uUERPTUFkZENoaWxkKCBub2RlICk7XHJcbiAgICB9XHJcblxyXG4gICAgbm9kZS5pbnZhbGlkYXRlQm91bmRzKCk7XHJcblxyXG4gICAgLy8gbGlrZSBjYWxsaW5nIHRoaXMuaW52YWxpZGF0ZUJvdW5kcygpLCBidXQgd2UgYWxyZWFkeSBtYXJrZWQgYWxsIGFuY2VzdG9ycyB3aXRoIGRpcnR5IGNoaWxkIGJvdW5kc1xyXG4gICAgdGhpcy5fYm91bmRzRGlydHkgPSB0cnVlO1xyXG5cclxuICAgIHRoaXMuY2hpbGRJbnNlcnRlZEVtaXR0ZXIuZW1pdCggbm9kZSwgaW5kZXggKTtcclxuICAgIG5vZGUucGFyZW50QWRkZWRFbWl0dGVyLmVtaXQoIHRoaXMgKTtcclxuXHJcbiAgICAhaXNDb21wb3NpdGUgJiYgdGhpcy5jaGlsZHJlbkNoYW5nZWRFbWl0dGVyLmVtaXQoKTtcclxuXHJcbiAgICBpZiAoIGFzc2VydFNsb3cgKSB7IHRoaXMuX3BpY2tlci5hdWRpdCgpOyB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBcHBlbmRzIGEgY2hpbGQgTm9kZSB0byBvdXIgbGlzdCBvZiBjaGlsZHJlbi5cclxuICAgKlxyXG4gICAqIFRoZSBuZXcgY2hpbGQgTm9kZSB3aWxsIGJlIGRpc3BsYXllZCBpbiBmcm9udCAob24gdG9wKSBvZiBhbGwgb2YgdGhpcyBub2RlJ3Mgb3RoZXIgY2hpbGRyZW4uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbm9kZVxyXG4gICAqIEBwYXJhbSBbaXNDb21wb3NpdGVdIC0gKHNjZW5lcnktaW50ZXJuYWwpIElmIHRydWUsIHRoZSBjaGlsZHJlbkNoYW5nZWQgZXZlbnQgd2lsbCBub3QgYmUgc2VudCBvdXQuXHJcbiAgICovXHJcbiAgcHVibGljIGFkZENoaWxkKCBub2RlOiBOb2RlLCBpc0NvbXBvc2l0ZT86IGJvb2xlYW4gKTogdGhpcyB7XHJcbiAgICB0aGlzLmluc2VydENoaWxkKCB0aGlzLl9jaGlsZHJlbi5sZW5ndGgsIG5vZGUsIGlzQ29tcG9zaXRlICk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmVzIGEgY2hpbGQgTm9kZSBmcm9tIG91ciBsaXN0IG9mIGNoaWxkcmVuLCBzZWUgaHR0cDovL3BoZXRzaW1zLmdpdGh1Yi5pby9zY2VuZXJ5L2RvYy8jbm9kZS1yZW1vdmVDaGlsZFxyXG4gICAqIFdpbGwgZmFpbCBhbiBhc3NlcnRpb24gaWYgdGhlIE5vZGUgaXMgbm90IGN1cnJlbnRseSBvbmUgb2Ygb3VyIGNoaWxkcmVuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbm9kZVxyXG4gICAqIEBwYXJhbSBbaXNDb21wb3NpdGVdIC0gKHNjZW5lcnktaW50ZXJuYWwpIElmIHRydWUsIHRoZSBjaGlsZHJlbkNoYW5nZWQgZXZlbnQgd2lsbCBub3QgYmUgc2VudCBvdXQuXHJcbiAgICovXHJcbiAgcHVibGljIHJlbW92ZUNoaWxkKCBub2RlOiBOb2RlLCBpc0NvbXBvc2l0ZT86IGJvb2xlYW4gKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBub2RlICYmIG5vZGUgaW5zdGFuY2VvZiBOb2RlLCAnTmVlZCB0byBjYWxsIG5vZGUucmVtb3ZlQ2hpbGQoKSB3aXRoIGEgTm9kZS4nICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmhhc0NoaWxkKCBub2RlICksICdBdHRlbXB0ZWQgdG8gcmVtb3ZlQ2hpbGQgd2l0aCBhIG5vZGUgdGhhdCB3YXMgbm90IGEgY2hpbGQuJyApO1xyXG5cclxuICAgIGNvbnN0IGluZGV4T2ZDaGlsZCA9IF8uaW5kZXhPZiggdGhpcy5fY2hpbGRyZW4sIG5vZGUgKTtcclxuXHJcbiAgICB0aGlzLnJlbW92ZUNoaWxkV2l0aEluZGV4KCBub2RlLCBpbmRleE9mQ2hpbGQsIGlzQ29tcG9zaXRlICk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmVzIGEgY2hpbGQgTm9kZSBhdCBhIHNwZWNpZmljIGluZGV4IChub2RlLmNoaWxkcmVuWyBpbmRleCBdKSBmcm9tIG91ciBsaXN0IG9mIGNoaWxkcmVuLlxyXG4gICAqIFdpbGwgZmFpbCBpZiB0aGUgaW5kZXggaXMgb3V0IG9mIGJvdW5kcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBpbmRleFxyXG4gICAqIEBwYXJhbSBbaXNDb21wb3NpdGVdIC0gKHNjZW5lcnktaW50ZXJuYWwpIElmIHRydWUsIHRoZSBjaGlsZHJlbkNoYW5nZWQgZXZlbnQgd2lsbCBub3QgYmUgc2VudCBvdXQuXHJcbiAgICovXHJcbiAgcHVibGljIHJlbW92ZUNoaWxkQXQoIGluZGV4OiBudW1iZXIsIGlzQ29tcG9zaXRlPzogYm9vbGVhbiApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGluZGV4ID49IDAgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGluZGV4IDwgdGhpcy5fY2hpbGRyZW4ubGVuZ3RoICk7XHJcblxyXG4gICAgY29uc3Qgbm9kZSA9IHRoaXMuX2NoaWxkcmVuWyBpbmRleCBdO1xyXG5cclxuICAgIHRoaXMucmVtb3ZlQ2hpbGRXaXRoSW5kZXgoIG5vZGUsIGluZGV4LCBpc0NvbXBvc2l0ZSApO1xyXG5cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW50ZXJuYWwgbWV0aG9kIGZvciByZW1vdmluZyBhIE5vZGUgKGFsd2F5cyBoYXMgdGhlIE5vZGUgYW5kIGluZGV4KS5cclxuICAgKlxyXG4gICAqIE5PVEU6IG92ZXJyaWRkZW4gYnkgTGVhZiBmb3Igc29tZSBzdWJ0eXBlc1xyXG4gICAqXHJcbiAgICogQHBhcmFtIG5vZGUgLSBUaGUgY2hpbGQgbm9kZSB0byByZW1vdmUgZnJvbSB0aGlzIE5vZGUgKGl0J3MgcGFyZW50KVxyXG4gICAqIEBwYXJhbSBpbmRleE9mQ2hpbGQgLSBTaG91bGQgc2F0aXNmeSB0aGlzLmNoaWxkcmVuWyBpbmRleE9mQ2hpbGQgXSA9PT0gbm9kZVxyXG4gICAqIEBwYXJhbSBbaXNDb21wb3NpdGVdIC0gKHNjZW5lcnktaW50ZXJuYWwpIElmIHRydWUsIHRoZSBjaGlsZHJlbkNoYW5nZWQgZXZlbnQgd2lsbCBub3QgYmUgc2VudCBvdXQuXHJcbiAgICovXHJcbiAgcHVibGljIHJlbW92ZUNoaWxkV2l0aEluZGV4KCBub2RlOiBOb2RlLCBpbmRleE9mQ2hpbGQ6IG51bWJlciwgaXNDb21wb3NpdGU/OiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbm9kZSAmJiBub2RlIGluc3RhbmNlb2YgTm9kZSwgJ05lZWQgdG8gY2FsbCBub2RlLnJlbW92ZUNoaWxkV2l0aEluZGV4KCkgd2l0aCBhIE5vZGUuJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5oYXNDaGlsZCggbm9kZSApLCAnQXR0ZW1wdGVkIHRvIHJlbW92ZUNoaWxkIHdpdGggYSBub2RlIHRoYXQgd2FzIG5vdCBhIGNoaWxkLicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2NoaWxkcmVuWyBpbmRleE9mQ2hpbGQgXSA9PT0gbm9kZSwgJ0luY29ycmVjdCBpbmRleCBmb3IgcmVtb3ZlQ2hpbGRXaXRoSW5kZXgnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBub2RlLl9wYXJlbnRzICE9PSBudWxsLCAnVHJpZWQgdG8gcmVtb3ZlIGEgZGlzcG9zZWQgY2hpbGQgbm9kZT8nICk7XHJcblxyXG4gICAgY29uc3QgaW5kZXhPZlBhcmVudCA9IF8uaW5kZXhPZiggbm9kZS5fcGFyZW50cywgdGhpcyApO1xyXG5cclxuICAgIG5vZGUuX2lzR2V0dGluZ1JlbW92ZWRGcm9tUGFyZW50ID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBJZiB0aGlzIGFkZGVkIHN1YnRyZWUgY29udGFpbnMgUERPTSBjb250ZW50LCB3ZSBuZWVkIHRvIG5vdGlmeSBhbnkgcmVsZXZhbnQgZGlzcGxheXNcclxuICAgIC8vIE5PVEU6IFBvdGVudGlhbGx5IHJlbW92ZXMgYm91bmRzIGxpc3RlbmVycyBoZXJlIVxyXG4gICAgaWYgKCAhbm9kZS5fcmVuZGVyZXJTdW1tYXJ5Lmhhc05vUERPTSgpICkge1xyXG4gICAgICB0aGlzLm9uUERPTVJlbW92ZUNoaWxkKCBub2RlICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gbmVlZHMgdG8gYmUgZWFybHkgdG8gcHJldmVudCByZS1lbnRyYW50IGNoaWxkcmVuIG1vZGlmaWNhdGlvbnNcclxuICAgIHRoaXMuX3BpY2tlci5vblJlbW92ZUNoaWxkKCBub2RlICk7XHJcbiAgICB0aGlzLmNoYW5nZUJvdW5kc0V2ZW50Q291bnQoIG5vZGUuX2JvdW5kc0V2ZW50Q291bnQgPiAwID8gLTEgOiAwICk7XHJcbiAgICB0aGlzLl9yZW5kZXJlclN1bW1hcnkuc3VtbWFyeUNoYW5nZSggbm9kZS5fcmVuZGVyZXJTdW1tYXJ5LmJpdG1hc2ssIFJlbmRlcmVyU3VtbWFyeS5iaXRtYXNrQWxsICk7XHJcblxyXG4gICAgbm9kZS5fcGFyZW50cy5zcGxpY2UoIGluZGV4T2ZQYXJlbnQsIDEgKTtcclxuICAgIHRoaXMuX2NoaWxkcmVuLnNwbGljZSggaW5kZXhPZkNoaWxkLCAxICk7XHJcbiAgICBub2RlLl9pc0dldHRpbmdSZW1vdmVkRnJvbVBhcmVudCA9IGZhbHNlOyAvLyBJdCBpcyBcImNvbXBsZXRlXCJcclxuXHJcbiAgICB0aGlzLmludmFsaWRhdGVCb3VuZHMoKTtcclxuICAgIHRoaXMuX2NoaWxkQm91bmRzRGlydHkgPSB0cnVlOyAvLyBmb3JjZSByZWNvbXB1dGF0aW9uIG9mIGNoaWxkIGJvdW5kcyBhZnRlciByZW1vdmluZyBhIGNoaWxkXHJcblxyXG4gICAgdGhpcy5jaGlsZFJlbW92ZWRFbWl0dGVyLmVtaXQoIG5vZGUsIGluZGV4T2ZDaGlsZCApO1xyXG4gICAgbm9kZS5wYXJlbnRSZW1vdmVkRW1pdHRlci5lbWl0KCB0aGlzICk7XHJcblxyXG4gICAgIWlzQ29tcG9zaXRlICYmIHRoaXMuY2hpbGRyZW5DaGFuZ2VkRW1pdHRlci5lbWl0KCk7XHJcblxyXG4gICAgaWYgKCBhc3NlcnRTbG93ICkgeyB0aGlzLl9waWNrZXIuYXVkaXQoKTsgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSWYgYSBjaGlsZCBpcyBub3QgYXQgdGhlIGdpdmVuIGluZGV4LCBpdCBpcyBtb3ZlZCB0byB0aGUgZ2l2ZW4gaW5kZXguIFRoaXMgcmVvcmRlcnMgdGhlIGNoaWxkcmVuIG9mIHRoaXMgTm9kZSBzb1xyXG4gICAqIHRoYXQgYHRoaXMuY2hpbGRyZW5bIGluZGV4IF0gPT09IG5vZGVgLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIG5vZGUgLSBUaGUgY2hpbGQgTm9kZSB0byBtb3ZlIGluIHRoZSBvcmRlclxyXG4gICAqIEBwYXJhbSBpbmRleCAtIFRoZSBkZXNpcmVkIGluZGV4IChpbnRvIHRoZSBjaGlsZHJlbiBhcnJheSkgb2YgdGhlIGNoaWxkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBtb3ZlQ2hpbGRUb0luZGV4KCBub2RlOiBOb2RlLCBpbmRleDogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5oYXNDaGlsZCggbm9kZSApLCAnQXR0ZW1wdGVkIHRvIG1vdmVDaGlsZFRvSW5kZXggd2l0aCBhIG5vZGUgdGhhdCB3YXMgbm90IGEgY2hpbGQuJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaW5kZXggJSAxID09PSAwICYmIGluZGV4ID49IDAgJiYgaW5kZXggPCB0aGlzLl9jaGlsZHJlbi5sZW5ndGgsXHJcbiAgICAgIGBJbnZhbGlkIGluZGV4OiAke2luZGV4fWAgKTtcclxuXHJcbiAgICBjb25zdCBjdXJyZW50SW5kZXggPSB0aGlzLmluZGV4T2ZDaGlsZCggbm9kZSApO1xyXG4gICAgaWYgKCB0aGlzLl9jaGlsZHJlblsgaW5kZXggXSAhPT0gbm9kZSApIHtcclxuXHJcbiAgICAgIC8vIEFwcGx5IHRoZSBhY3R1YWwgY2hpbGRyZW4gY2hhbmdlXHJcbiAgICAgIHRoaXMuX2NoaWxkcmVuLnNwbGljZSggY3VycmVudEluZGV4LCAxICk7XHJcbiAgICAgIHRoaXMuX2NoaWxkcmVuLnNwbGljZSggaW5kZXgsIDAsIG5vZGUgKTtcclxuXHJcbiAgICAgIGlmICggIXRoaXMuX3JlbmRlcmVyU3VtbWFyeS5oYXNOb1BET00oKSApIHtcclxuICAgICAgICB0aGlzLm9uUERPTVJlb3JkZXJlZENoaWxkcmVuKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuY2hpbGRyZW5SZW9yZGVyZWRFbWl0dGVyLmVtaXQoIE1hdGgubWluKCBjdXJyZW50SW5kZXgsIGluZGV4ICksIE1hdGgubWF4KCBjdXJyZW50SW5kZXgsIGluZGV4ICkgKTtcclxuICAgICAgdGhpcy5jaGlsZHJlbkNoYW5nZWRFbWl0dGVyLmVtaXQoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgYWxsIGNoaWxkcmVuIGZyb20gdGhpcyBOb2RlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyByZW1vdmVBbGxDaGlsZHJlbigpOiB0aGlzIHtcclxuICAgIHRoaXMuc2V0Q2hpbGRyZW4oIFtdICk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBjaGlsZHJlbiBvZiB0aGUgTm9kZSB0byBiZSBlcXVpdmFsZW50IHRvIHRoZSBwYXNzZWQtaW4gYXJyYXkgb2YgTm9kZXMuXHJcbiAgICpcclxuICAgKiBOT1RFOiBNZWFudCB0byBiZSBvdmVycmlkZGVuIGluIHNvbWUgY2FzZXNcclxuICAgKi9cclxuICBwdWJsaWMgc2V0Q2hpbGRyZW4oIGNoaWxkcmVuOiBOb2RlW10gKTogdGhpcyB7XHJcbiAgICAvLyBUaGUgaW1wbGVtZW50YXRpb24gaXMgc3BsaXQgaW50byBiYXNpY2FsbHkgdGhyZWUgc3RhZ2VzOlxyXG4gICAgLy8gMS4gUmVtb3ZlIGN1cnJlbnQgY2hpbGRyZW4gdGhhdCBhcmUgbm90IGluIHRoZSBuZXcgY2hpbGRyZW4gYXJyYXkuXHJcbiAgICAvLyAyLiBSZW9yZGVyIGNoaWxkcmVuIHRoYXQgZXhpc3QgYm90aCBiZWZvcmUvYWZ0ZXIgdGhlIGNoYW5nZS5cclxuICAgIC8vIDMuIEluc2VydCBpbiBuZXcgY2hpbGRyZW5cclxuXHJcbiAgICBjb25zdCBiZWZvcmVPbmx5OiBOb2RlW10gPSBbXTsgLy8gV2lsbCBob2xkIGFsbCBub2RlcyB0aGF0IHdpbGwgYmUgcmVtb3ZlZC5cclxuICAgIGNvbnN0IGFmdGVyT25seTogTm9kZVtdID0gW107IC8vIFdpbGwgaG9sZCBhbGwgbm9kZXMgdGhhdCB3aWxsIGJlIFwibmV3XCIgY2hpbGRyZW4gKGFkZGVkKVxyXG4gICAgY29uc3QgaW5Cb3RoOiBOb2RlW10gPSBbXTsgLy8gQ2hpbGQgbm9kZXMgdGhhdCBcInN0YXlcIi4gV2lsbCBiZSBvcmRlcmVkIGZvciB0aGUgXCJhZnRlclwiIGNhc2UuXHJcbiAgICBsZXQgaTtcclxuXHJcbiAgICAvLyBDb21wdXRlIHdoYXQgdGhpbmdzIHdlcmUgYWRkZWQsIHJlbW92ZWQsIG9yIHN0YXkuXHJcbiAgICBhcnJheURpZmZlcmVuY2UoIGNoaWxkcmVuLCB0aGlzLl9jaGlsZHJlbiwgYWZ0ZXJPbmx5LCBiZWZvcmVPbmx5LCBpbkJvdGggKTtcclxuXHJcbiAgICAvLyBSZW1vdmUgYW55IG5vZGVzIHRoYXQgYXJlIG5vdCBpbiB0aGUgbmV3IGNoaWxkcmVuLlxyXG4gICAgZm9yICggaSA9IGJlZm9yZU9ubHkubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0gKSB7XHJcbiAgICAgIHRoaXMucmVtb3ZlQ2hpbGQoIGJlZm9yZU9ubHlbIGkgXSwgdHJ1ZSApO1xyXG4gICAgfVxyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2NoaWxkcmVuLmxlbmd0aCA9PT0gaW5Cb3RoLmxlbmd0aCxcclxuICAgICAgJ1JlbW92aW5nIGNoaWxkcmVuIHNob3VsZCBub3QgaGF2ZSB0cmlnZ2VyZWQgb3RoZXIgY2hpbGRyZW4gY2hhbmdlcycgKTtcclxuXHJcbiAgICAvLyBIYW5kbGUgdGhlIG1haW4gcmVvcmRlcmluZyAob2Ygbm9kZXMgdGhhdCBcInN0YXlcIilcclxuICAgIGxldCBtaW5DaGFuZ2VJbmRleCA9IC0xOyAvLyBXaGF0IGlzIHRoZSBzbWFsbGVzdCBpbmRleCB3aGVyZSB0aGlzLl9jaGlsZHJlblsgaW5kZXggXSAhPT0gaW5Cb3RoWyBpbmRleCBdXHJcbiAgICBsZXQgbWF4Q2hhbmdlSW5kZXggPSAtMTsgLy8gV2hhdCBpcyB0aGUgbGFyZ2VzdCBpbmRleCB3aGVyZSB0aGlzLl9jaGlsZHJlblsgaW5kZXggXSAhPT0gaW5Cb3RoWyBpbmRleCBdXHJcbiAgICBmb3IgKCBpID0gMDsgaSA8IGluQm90aC5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgZGVzaXJlZCA9IGluQm90aFsgaSBdO1xyXG4gICAgICBpZiAoIHRoaXMuX2NoaWxkcmVuWyBpIF0gIT09IGRlc2lyZWQgKSB7XHJcbiAgICAgICAgdGhpcy5fY2hpbGRyZW5bIGkgXSA9IGRlc2lyZWQ7XHJcbiAgICAgICAgaWYgKCBtaW5DaGFuZ2VJbmRleCA9PT0gLTEgKSB7XHJcbiAgICAgICAgICBtaW5DaGFuZ2VJbmRleCA9IGk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG1heENoYW5nZUluZGV4ID0gaTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gSWYgb3VyIG1pbkNoYW5nZUluZGV4IGlzIHN0aWxsIC0xLCB0aGVuIG5vbmUgb2YgdGhvc2Ugbm9kZXMgdGhhdCBcInN0YXlcIiB3ZXJlIHJlb3JkZXJlZC4gSXQncyBpbXBvcnRhbnQgdG8gY2hlY2tcclxuICAgIC8vIGZvciB0aGlzIGNhc2UsIHNvIHRoYXQgYG5vZGUuY2hpbGRyZW4gPSBub2RlLmNoaWxkcmVuYCBpcyBlZmZlY3RpdmVseSBhIG5vLW9wIHBlcmZvcm1hbmNlLXdpc2UuXHJcbiAgICBjb25zdCBoYXNSZW9yZGVyaW5nQ2hhbmdlID0gbWluQ2hhbmdlSW5kZXggIT09IC0xO1xyXG5cclxuICAgIC8vIEltbWVkaWF0ZSBjb25zZXF1ZW5jZXMvdXBkYXRlcyBmcm9tIHJlb3JkZXJpbmdcclxuICAgIGlmICggaGFzUmVvcmRlcmluZ0NoYW5nZSApIHtcclxuICAgICAgaWYgKCAhdGhpcy5fcmVuZGVyZXJTdW1tYXJ5Lmhhc05vUERPTSgpICkge1xyXG4gICAgICAgIHRoaXMub25QRE9NUmVvcmRlcmVkQ2hpbGRyZW4oKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5jaGlsZHJlblJlb3JkZXJlZEVtaXR0ZXIuZW1pdCggbWluQ2hhbmdlSW5kZXgsIG1heENoYW5nZUluZGV4ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWRkIGluIFwibmV3XCIgY2hpbGRyZW4uXHJcbiAgICAvLyBTY2FuIHRocm91Z2ggdGhlIFwiZW5kaW5nXCIgY2hpbGRyZW4gaW5kaWNlcywgYWRkaW5nIGluIHRoaW5ncyB0aGF0IHdlcmUgaW4gdGhlIFwiYWZ0ZXJPbmx5XCIgcGFydC4gVGhpcyBzY2FuIGlzXHJcbiAgICAvLyBkb25lIHRocm91Z2ggdGhlIGNoaWxkcmVuIGFycmF5IGluc3RlYWQgb2YgdGhlIGFmdGVyT25seSBhcnJheSAoYXMgZGV0ZXJtaW5pbmcgdGhlIGluZGV4IGluIGNoaWxkcmVuIHdvdWxkXHJcbiAgICAvLyB0aGVuIGJlIHF1YWRyYXRpYyBpbiB0aW1lLCB3aGljaCB3b3VsZCBiZSB1bmFjY2VwdGFibGUgaGVyZSkuIEF0IHRoaXMgcG9pbnQsIGEgZm9yd2FyZCBzY2FuIHNob3VsZCBiZVxyXG4gICAgLy8gc3VmZmljaWVudCB0byBpbnNlcnQgaW4tcGxhY2UsIGFuZCBzaG91bGQgbW92ZSB0aGUgbGVhc3QgYW1vdW50IG9mIG5vZGVzIGluIHRoZSBhcnJheS5cclxuICAgIGlmICggYWZ0ZXJPbmx5Lmxlbmd0aCApIHtcclxuICAgICAgbGV0IGFmdGVySW5kZXggPSAwO1xyXG4gICAgICBsZXQgYWZ0ZXIgPSBhZnRlck9ubHlbIGFmdGVySW5kZXggXTtcclxuICAgICAgZm9yICggaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICBpZiAoIGNoaWxkcmVuWyBpIF0gPT09IGFmdGVyICkge1xyXG4gICAgICAgICAgdGhpcy5pbnNlcnRDaGlsZCggaSwgYWZ0ZXIsIHRydWUgKTtcclxuICAgICAgICAgIGFmdGVyID0gYWZ0ZXJPbmx5WyArK2FmdGVySW5kZXggXTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiB3ZSBoYWQgYW55IGNoYW5nZXMsIHNlbmQgdGhlIGdlbmVyaWMgXCJjaGFuZ2VkXCIgZXZlbnQuXHJcbiAgICBpZiAoIGJlZm9yZU9ubHkubGVuZ3RoICE9PSAwIHx8IGFmdGVyT25seS5sZW5ndGggIT09IDAgfHwgaGFzUmVvcmRlcmluZ0NoYW5nZSApIHtcclxuICAgICAgdGhpcy5jaGlsZHJlbkNoYW5nZWRFbWl0dGVyLmVtaXQoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTYW5pdHkgY2hlY2tzIHRvIG1ha2Ugc3VyZSBvdXIgcmVzdWx0aW5nIGNoaWxkcmVuIGFycmF5IGlzIGNvcnJlY3QuXHJcbiAgICBpZiAoIGFzc2VydCApIHtcclxuICAgICAgZm9yICggbGV0IGogPSAwOyBqIDwgdGhpcy5fY2hpbGRyZW4ubGVuZ3RoOyBqKysgKSB7XHJcbiAgICAgICAgYXNzZXJ0KCBjaGlsZHJlblsgaiBdID09PSB0aGlzLl9jaGlsZHJlblsgaiBdLFxyXG4gICAgICAgICAgJ0luY29ycmVjdCBjaGlsZCBhZnRlciBzZXRDaGlsZHJlbiwgcG9zc2libHkgYSByZWVudHJhbmN5IGlzc3VlJyApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gYWxsb3cgY2hhaW5pbmdcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldENoaWxkcmVuKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGNoaWxkcmVuKCB2YWx1ZTogTm9kZVtdICkge1xyXG4gICAgdGhpcy5zZXRDaGlsZHJlbiggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRDaGlsZHJlbigpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBjaGlsZHJlbigpOiBOb2RlW10ge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q2hpbGRyZW4oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBkZWZlbnNpdmUgY29weSBvZiB0aGUgYXJyYXkgb2YgZGlyZWN0IGNoaWxkcmVuIG9mIHRoaXMgbm9kZSwgb3JkZXJlZCBieSB3aGF0IGlzIGluIGZyb250IChub2RlcyBhdFxyXG4gICAqIHRoZSBlbmQgb2YgdGhlIGFycmF5IGFyZSBpbiBmcm9udCBvZiBub2RlcyBhdCB0aGUgc3RhcnQpLlxyXG4gICAqXHJcbiAgICogTWFraW5nIGNoYW5nZXMgdG8gdGhlIHJldHVybmVkIHJlc3VsdCB3aWxsIG5vdCBhZmZlY3QgdGhpcyBub2RlJ3MgY2hpbGRyZW4uXHJcbiAgICovXHJcbiAgcHVibGljIGdldENoaWxkcmVuKCk6IE5vZGVbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5fY2hpbGRyZW4uc2xpY2UoIDAgKTsgLy8gY3JlYXRlIGEgZGVmZW5zaXZlIGNvcHlcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBjb3VudCBvZiBjaGlsZHJlbiwgd2l0aG91dCBuZWVkaW5nIHRvIG1ha2UgYSBkZWZlbnNpdmUgY29weS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q2hpbGRyZW5Db3VudCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX2NoaWxkcmVuLmxlbmd0aDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBkZWZlbnNpdmUgY29weSBvZiBvdXIgcGFyZW50cy4gVGhpcyBpcyBhbiBhcnJheSBvZiBwYXJlbnQgbm9kZXMgdGhhdCBpcyByZXR1cm5lZCBpbiBubyBwYXJ0aWN1bGFyXHJcbiAgICogb3JkZXIgKGFzIG9yZGVyIGlzIG5vdCBpbXBvcnRhbnQgaGVyZSkuXHJcbiAgICpcclxuICAgKiBOT1RFOiBNb2RpZnlpbmcgdGhlIHJldHVybmVkIGFycmF5IHdpbGwgbm90IGluIGFueSB3YXkgbW9kaWZ5IHRoaXMgbm9kZSdzIHBhcmVudHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFBhcmVudHMoKTogTm9kZVtdIHtcclxuICAgIHJldHVybiB0aGlzLl9wYXJlbnRzLnNsaWNlKCAwICk7IC8vIGNyZWF0ZSBhIGRlZmVuc2l2ZSBjb3B5XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0UGFyZW50cygpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBwYXJlbnRzKCk6IE5vZGVbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRQYXJlbnRzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgc2luZ2xlIHBhcmVudCBpZiBpdCBleGlzdHMsIG90aGVyd2lzZSBudWxsIChubyBwYXJlbnRzKSwgb3IgYW4gYXNzZXJ0aW9uIGZhaWx1cmUgKG11bHRpcGxlIHBhcmVudHMpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRQYXJlbnQoKTogTm9kZSB8IG51bGwge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fcGFyZW50cy5sZW5ndGggPD0gMSwgJ0Nhbm5vdCBjYWxsIGdldFBhcmVudCBvbiBhIG5vZGUgd2l0aCBtdWx0aXBsZSBwYXJlbnRzJyApO1xyXG4gICAgcmV0dXJuIHRoaXMuX3BhcmVudHMubGVuZ3RoID8gdGhpcy5fcGFyZW50c1sgMCBdIDogbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRQYXJlbnQoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgcGFyZW50KCk6IE5vZGUgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLmdldFBhcmVudCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgY2hpbGQgYXQgYSBzcGVjaWZpYyBpbmRleCBpbnRvIHRoZSBjaGlsZHJlbiBhcnJheS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q2hpbGRBdCggaW5kZXg6IG51bWJlciApOiBOb2RlIHtcclxuICAgIHJldHVybiB0aGlzLl9jaGlsZHJlblsgaW5kZXggXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZpbmRzIHRoZSBpbmRleCBvZiBhIHBhcmVudCBOb2RlIGluIHRoZSBwYXJlbnRzIGFycmF5LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHBhcmVudCAtIFNob3VsZCBiZSBhIHBhcmVudCBvZiB0aGlzIG5vZGUuXHJcbiAgICogQHJldHVybnMgLSBBbiBpbmRleCBzdWNoIHRoYXQgdGhpcy5wYXJlbnRzWyBpbmRleCBdID09PSBwYXJlbnRcclxuICAgKi9cclxuICBwdWJsaWMgaW5kZXhPZlBhcmVudCggcGFyZW50OiBOb2RlICk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gXy5pbmRleE9mKCB0aGlzLl9wYXJlbnRzLCBwYXJlbnQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZpbmRzIHRoZSBpbmRleCBvZiBhIGNoaWxkIE5vZGUgaW4gdGhlIGNoaWxkcmVuIGFycmF5LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNoaWxkIC0gU2hvdWxkIGJlIGEgY2hpbGQgb2YgdGhpcyBub2RlLlxyXG4gICAqIEByZXR1cm5zIC0gQW4gaW5kZXggc3VjaCB0aGF0IHRoaXMuY2hpbGRyZW5bIGluZGV4IF0gPT09IGNoaWxkXHJcbiAgICovXHJcbiAgcHVibGljIGluZGV4T2ZDaGlsZCggY2hpbGQ6IE5vZGUgKTogbnVtYmVyIHtcclxuICAgIHJldHVybiBfLmluZGV4T2YoIHRoaXMuX2NoaWxkcmVuLCBjaGlsZCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTW92ZXMgdGhpcyBOb2RlIHRvIHRoZSBmcm9udCAoZW5kKSBvZiBhbGwgb2YgaXRzIHBhcmVudHMgY2hpbGRyZW4gYXJyYXkuXHJcbiAgICovXHJcbiAgcHVibGljIG1vdmVUb0Zyb250KCk6IHRoaXMge1xyXG4gICAgXy5lYWNoKCB0aGlzLnBhcmVudHMsIHBhcmVudCA9PiBwYXJlbnQubW92ZUNoaWxkVG9Gcm9udCggdGhpcyApICk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNb3ZlcyBvbmUgb2Ygb3VyIGNoaWxkcmVuIHRvIHRoZSBmcm9udCAoZW5kKSBvZiBvdXIgY2hpbGRyZW4gYXJyYXkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY2hpbGQgLSBPdXIgY2hpbGQgdG8gbW92ZSB0byB0aGUgZnJvbnQuXHJcbiAgICovXHJcbiAgcHVibGljIG1vdmVDaGlsZFRvRnJvbnQoIGNoaWxkOiBOb2RlICk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHRoaXMubW92ZUNoaWxkVG9JbmRleCggY2hpbGQsIHRoaXMuX2NoaWxkcmVuLmxlbmd0aCAtIDEgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1vdmUgdGhpcyBub2RlIG9uZSBpbmRleCBmb3J3YXJkIGluIGVhY2ggb2YgaXRzIHBhcmVudHMuICBJZiB0aGUgTm9kZSBpcyBhbHJlYWR5IGF0IHRoZSBmcm9udCwgdGhpcyBpcyBhIG5vLW9wLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBtb3ZlRm9yd2FyZCgpOiB0aGlzIHtcclxuICAgIHRoaXMucGFyZW50cy5mb3JFYWNoKCBwYXJlbnQgPT4gcGFyZW50Lm1vdmVDaGlsZEZvcndhcmQoIHRoaXMgKSApO1xyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNb3ZlcyB0aGUgc3BlY2lmaWVkIGNoaWxkIGZvcndhcmQgYnkgb25lIGluZGV4LiAgSWYgdGhlIGNoaWxkIGlzIGFscmVhZHkgYXQgdGhlIGZyb250LCB0aGlzIGlzIGEgbm8tb3AuXHJcbiAgICovXHJcbiAgcHVibGljIG1vdmVDaGlsZEZvcndhcmQoIGNoaWxkOiBOb2RlICk6IHRoaXMge1xyXG4gICAgY29uc3QgaW5kZXggPSB0aGlzLmluZGV4T2ZDaGlsZCggY2hpbGQgKTtcclxuICAgIGlmICggaW5kZXggPCB0aGlzLmdldENoaWxkcmVuQ291bnQoKSAtIDEgKSB7XHJcbiAgICAgIHRoaXMubW92ZUNoaWxkVG9JbmRleCggY2hpbGQsIGluZGV4ICsgMSApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNb3ZlIHRoaXMgbm9kZSBvbmUgaW5kZXggYmFja3dhcmQgaW4gZWFjaCBvZiBpdHMgcGFyZW50cy4gIElmIHRoZSBOb2RlIGlzIGFscmVhZHkgYXQgdGhlIGJhY2ssIHRoaXMgaXMgYSBuby1vcC5cclxuICAgKi9cclxuICBwdWJsaWMgbW92ZUJhY2t3YXJkKCk6IHRoaXMge1xyXG4gICAgdGhpcy5wYXJlbnRzLmZvckVhY2goIHBhcmVudCA9PiBwYXJlbnQubW92ZUNoaWxkQmFja3dhcmQoIHRoaXMgKSApO1xyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNb3ZlcyB0aGUgc3BlY2lmaWVkIGNoaWxkIGZvcndhcmQgYnkgb25lIGluZGV4LiAgSWYgdGhlIGNoaWxkIGlzIGFscmVhZHkgYXQgdGhlIGJhY2ssIHRoaXMgaXMgYSBuby1vcC5cclxuICAgKi9cclxuICBwdWJsaWMgbW92ZUNoaWxkQmFja3dhcmQoIGNoaWxkOiBOb2RlICk6IHRoaXMge1xyXG4gICAgY29uc3QgaW5kZXggPSB0aGlzLmluZGV4T2ZDaGlsZCggY2hpbGQgKTtcclxuICAgIGlmICggaW5kZXggPiAwICkge1xyXG4gICAgICB0aGlzLm1vdmVDaGlsZFRvSW5kZXgoIGNoaWxkLCBpbmRleCAtIDEgKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzOyAvLyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTW92ZXMgdGhpcyBOb2RlIHRvIHRoZSBiYWNrIChmcm9udCkgb2YgYWxsIG9mIGl0cyBwYXJlbnRzIGNoaWxkcmVuIGFycmF5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBtb3ZlVG9CYWNrKCk6IHRoaXMge1xyXG4gICAgXy5lYWNoKCB0aGlzLnBhcmVudHMsIHBhcmVudCA9PiBwYXJlbnQubW92ZUNoaWxkVG9CYWNrKCB0aGlzICkgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpczsgLy8gYWxsb3cgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1vdmVzIG9uZSBvZiBvdXIgY2hpbGRyZW4gdG8gdGhlIGJhY2sgKGZyb250KSBvZiBvdXIgY2hpbGRyZW4gYXJyYXkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY2hpbGQgLSBPdXIgY2hpbGQgdG8gbW92ZSB0byB0aGUgYmFjay5cclxuICAgKi9cclxuICBwdWJsaWMgbW92ZUNoaWxkVG9CYWNrKCBjaGlsZDogTm9kZSApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLm1vdmVDaGlsZFRvSW5kZXgoIGNoaWxkLCAwICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXBsYWNlIGEgY2hpbGQgaW4gdGhpcyBub2RlJ3MgY2hpbGRyZW4gYXJyYXkgd2l0aCBhbm90aGVyIG5vZGUuIElmIHRoZSBvbGQgY2hpbGQgaGFkIERPTSBmb2N1cyBhbmRcclxuICAgKiB0aGUgbmV3IGNoaWxkIGlzIGZvY3VzYWJsZSwgdGhlIG5ldyBjaGlsZCB3aWxsIHJlY2VpdmUgZm9jdXMgYWZ0ZXIgaXQgaXMgYWRkZWQuXHJcbiAgICovXHJcbiAgcHVibGljIHJlcGxhY2VDaGlsZCggb2xkQ2hpbGQ6IE5vZGUsIG5ld0NoaWxkOiBOb2RlICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5oYXNDaGlsZCggb2xkQ2hpbGQgKSwgJ0F0dGVtcHRlZCB0byByZXBsYWNlIGEgbm9kZSB0aGF0IHdhcyBub3QgYSBjaGlsZC4nICk7XHJcblxyXG4gICAgLy8gaW5mb3JtYXRpb24gdGhhdCBuZWVkcyB0byBiZSByZXN0b3JlZFxyXG4gICAgY29uc3QgaW5kZXggPSB0aGlzLmluZGV4T2ZDaGlsZCggb2xkQ2hpbGQgKTtcclxuICAgIGNvbnN0IG9sZENoaWxkRm9jdXNlZCA9IG9sZENoaWxkLmZvY3VzZWQ7XHJcblxyXG4gICAgdGhpcy5yZW1vdmVDaGlsZCggb2xkQ2hpbGQsIHRydWUgKTtcclxuICAgIHRoaXMuaW5zZXJ0Q2hpbGQoIGluZGV4LCBuZXdDaGlsZCwgdHJ1ZSApO1xyXG5cclxuICAgIHRoaXMuY2hpbGRyZW5DaGFuZ2VkRW1pdHRlci5lbWl0KCk7XHJcblxyXG4gICAgaWYgKCBvbGRDaGlsZEZvY3VzZWQgJiYgbmV3Q2hpbGQuZm9jdXNhYmxlICkge1xyXG4gICAgICBuZXdDaGlsZC5mb2N1cygpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyB0aGlzIE5vZGUgZnJvbSBhbGwgb2YgaXRzIHBhcmVudHMuXHJcbiAgICovXHJcbiAgcHVibGljIGRldGFjaCgpOiB0aGlzIHtcclxuICAgIF8uZWFjaCggdGhpcy5fcGFyZW50cy5zbGljZSggMCApLCBwYXJlbnQgPT4gcGFyZW50LnJlbW92ZUNoaWxkKCB0aGlzICkgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpczsgLy8gYWxsb3cgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwZGF0ZSBvdXIgZXZlbnQgY291bnQsIHVzdWFsbHkgYnkgMSBvciAtMS4gU2VlIGRvY3VtZW50YXRpb24gb24gX2JvdW5kc0V2ZW50Q291bnQgaW4gY29uc3RydWN0b3IuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbiAtIEhvdyB0byBpbmNyZW1lbnQvZGVjcmVtZW50IHRoZSBib3VuZHMgZXZlbnQgbGlzdGVuZXIgY291bnRcclxuICAgKi9cclxuICBwcml2YXRlIGNoYW5nZUJvdW5kc0V2ZW50Q291bnQoIG46IG51bWJlciApOiB2b2lkIHtcclxuICAgIGlmICggbiAhPT0gMCApIHtcclxuICAgICAgY29uc3QgemVyb0JlZm9yZSA9IHRoaXMuX2JvdW5kc0V2ZW50Q291bnQgPT09IDA7XHJcblxyXG4gICAgICB0aGlzLl9ib3VuZHNFdmVudENvdW50ICs9IG47XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2JvdW5kc0V2ZW50Q291bnQgPj0gMCwgJ3N1YnRyZWUgYm91bmRzIGV2ZW50IGNvdW50IHNob3VsZCBiZSBndWFyYW50ZWVkIHRvIGJlID49IDAnICk7XHJcblxyXG4gICAgICBjb25zdCB6ZXJvQWZ0ZXIgPSB0aGlzLl9ib3VuZHNFdmVudENvdW50ID09PSAwO1xyXG5cclxuICAgICAgaWYgKCB6ZXJvQmVmb3JlICE9PSB6ZXJvQWZ0ZXIgKSB7XHJcbiAgICAgICAgLy8gcGFyZW50cyB3aWxsIG9ubHkgaGF2ZSB0aGVpciBjb3VudFxyXG4gICAgICAgIGNvbnN0IHBhcmVudERlbHRhID0gemVyb0JlZm9yZSA/IDEgOiAtMTtcclxuXHJcbiAgICAgICAgY29uc3QgbGVuID0gdGhpcy5fcGFyZW50cy5sZW5ndGg7XHJcbiAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbGVuOyBpKysgKSB7XHJcbiAgICAgICAgICB0aGlzLl9wYXJlbnRzWyBpIF0uY2hhbmdlQm91bmRzRXZlbnRDb3VudCggcGFyZW50RGVsdGEgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEVuc3VyZXMgdGhhdCB0aGUgY2FjaGVkIHNlbGZCb3VuZHMgb2YgdGhpcyBOb2RlIGlzIGFjY3VyYXRlLiBSZXR1cm5zIHRydWUgaWYgYW55IHNvcnQgb2YgZGlydHkgZmxhZyB3YXMgc2V0XHJcbiAgICogYmVmb3JlIHRoaXMgd2FzIGNhbGxlZC5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIC0gV2FzIHRoZSBzZWxmLWJvdW5kcyBwb3RlbnRpYWxseSB1cGRhdGVkP1xyXG4gICAqL1xyXG4gIHB1YmxpYyB2YWxpZGF0ZVNlbGZCb3VuZHMoKTogYm9vbGVhbiB7XHJcbiAgICAvLyB2YWxpZGF0ZSBib3VuZHMgb2Ygb3Vyc2VsZiBpZiBuZWNlc3NhcnlcclxuICAgIGlmICggdGhpcy5fc2VsZkJvdW5kc0RpcnR5ICkge1xyXG4gICAgICBjb25zdCBvbGRTZWxmQm91bmRzID0gc2NyYXRjaEJvdW5kczIuc2V0KCB0aGlzLnNlbGZCb3VuZHNQcm9wZXJ0eS5fdmFsdWUgKTtcclxuXHJcbiAgICAgIC8vIFJlbHkgb24gYW4gb3ZlcmxvYWRhYmxlIG1ldGhvZCB0byBhY2NvbXBsaXNoIGNvbXB1dGluZyBvdXIgc2VsZiBib3VuZHMuIFRoaXMgc2hvdWxkIHVwZGF0ZVxyXG4gICAgICAvLyB0aGlzLnNlbGZCb3VuZHMgaXRzZWxmLCByZXR1cm5pbmcgd2hldGhlciBpdCB3YXMgYWN0dWFsbHkgY2hhbmdlZC4gSWYgaXQgZGlkbid0IGNoYW5nZSwgd2UgZG9uJ3Qgd2FudCB0b1xyXG4gICAgICAvLyBzZW5kIGEgJ3NlbGZCb3VuZHMnIGV2ZW50LlxyXG4gICAgICBjb25zdCBkaWRTZWxmQm91bmRzQ2hhbmdlID0gdGhpcy51cGRhdGVTZWxmQm91bmRzKCk7XHJcbiAgICAgIHRoaXMuX3NlbGZCb3VuZHNEaXJ0eSA9IGZhbHNlO1xyXG5cclxuICAgICAgaWYgKCBkaWRTZWxmQm91bmRzQ2hhbmdlICkge1xyXG4gICAgICAgIHRoaXMuc2VsZkJvdW5kc1Byb3BlcnR5Lm5vdGlmeUxpc3RlbmVycyggb2xkU2VsZkJvdW5kcyApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFbnN1cmVzIHRoYXQgY2FjaGVkIGJvdW5kcyBzdG9yZWQgb24gdGhpcyBOb2RlIChhbmQgYWxsIGNoaWxkcmVuKSBhcmUgYWNjdXJhdGUuIFJldHVybnMgdHJ1ZSBpZiBhbnkgc29ydCBvZiBkaXJ0eVxyXG4gICAqIGZsYWcgd2FzIHNldCBiZWZvcmUgdGhpcyB3YXMgY2FsbGVkLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgLSBXYXMgc29tZXRoaW5nIHBvdGVudGlhbGx5IHVwZGF0ZWQ/XHJcbiAgICovXHJcbiAgcHVibGljIHZhbGlkYXRlQm91bmRzKCk6IGJvb2xlYW4ge1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5ib3VuZHMgJiYgc2NlbmVyeUxvZy5ib3VuZHMoIGB2YWxpZGF0ZUJvdW5kcyAjJHt0aGlzLl9pZH1gICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuYm91bmRzICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIGxldCBpO1xyXG4gICAgY29uc3Qgbm90aWZpY2F0aW9uVGhyZXNob2xkID0gMWUtMTM7XHJcblxyXG4gICAgbGV0IHdhc0RpcnR5QmVmb3JlID0gdGhpcy52YWxpZGF0ZVNlbGZCb3VuZHMoKTtcclxuXHJcbiAgICAvLyBXZSdyZSBnb2luZyB0byBkaXJlY3RseSBtdXRhdGUgdGhlc2UgaW5zdGFuY2VzXHJcbiAgICBjb25zdCBvdXJDaGlsZEJvdW5kcyA9IHRoaXMuY2hpbGRCb3VuZHNQcm9wZXJ0eS5fdmFsdWU7XHJcbiAgICBjb25zdCBvdXJMb2NhbEJvdW5kcyA9IHRoaXMubG9jYWxCb3VuZHNQcm9wZXJ0eS5fdmFsdWU7XHJcbiAgICBjb25zdCBvdXJTZWxmQm91bmRzID0gdGhpcy5zZWxmQm91bmRzUHJvcGVydHkuX3ZhbHVlO1xyXG4gICAgY29uc3Qgb3VyQm91bmRzID0gdGhpcy5ib3VuZHNQcm9wZXJ0eS5fdmFsdWU7XHJcblxyXG4gICAgLy8gdmFsaWRhdGUgYm91bmRzIG9mIGNoaWxkcmVuIGlmIG5lY2Vzc2FyeVxyXG4gICAgaWYgKCB0aGlzLl9jaGlsZEJvdW5kc0RpcnR5ICkge1xyXG4gICAgICB3YXNEaXJ0eUJlZm9yZSA9IHRydWU7XHJcblxyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuYm91bmRzICYmIHNjZW5lcnlMb2cuYm91bmRzKCAnY2hpbGRCb3VuZHMgZGlydHknICk7XHJcblxyXG4gICAgICAvLyBoYXZlIGVhY2ggY2hpbGQgdmFsaWRhdGUgdGhlaXIgb3duIGJvdW5kc1xyXG4gICAgICBpID0gdGhpcy5fY2hpbGRyZW4ubGVuZ3RoO1xyXG4gICAgICB3aGlsZSAoIGktLSApIHtcclxuICAgICAgICBjb25zdCBjaGlsZCA9IHRoaXMuX2NoaWxkcmVuWyBpIF07XHJcblxyXG4gICAgICAgIC8vIFJlZW50cmFuY3kgbWlnaHQgY2F1c2UgdGhlIGNoaWxkIHRvIGJlIHJlbW92ZWRcclxuICAgICAgICBpZiAoIGNoaWxkICkge1xyXG4gICAgICAgICAgY2hpbGQudmFsaWRhdGVCb3VuZHMoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGFuZCByZWNvbXB1dGUgb3VyIGNoaWxkQm91bmRzXHJcbiAgICAgIGNvbnN0IG9sZENoaWxkQm91bmRzID0gc2NyYXRjaEJvdW5kczIuc2V0KCBvdXJDaGlsZEJvdW5kcyApOyAvLyBzdG9yZSBvbGQgdmFsdWUgaW4gYSB0ZW1wb3JhcnkgQm91bmRzMlxyXG4gICAgICBvdXJDaGlsZEJvdW5kcy5zZXQoIEJvdW5kczIuTk9USElORyApOyAvLyBpbml0aWFsaXplIHRvIGEgdmFsdWUgdGhhdCBjYW4gYmUgdW5pb25lZCB3aXRoIGluY2x1ZGVCb3VuZHMoKVxyXG5cclxuICAgICAgaSA9IHRoaXMuX2NoaWxkcmVuLmxlbmd0aDtcclxuICAgICAgd2hpbGUgKCBpLS0gKSB7XHJcbiAgICAgICAgY29uc3QgY2hpbGQgPSB0aGlzLl9jaGlsZHJlblsgaSBdO1xyXG5cclxuICAgICAgICAvLyBSZWVudHJhbmN5IG1pZ2h0IGNhdXNlIHRoZSBjaGlsZCB0byBiZSByZW1vdmVkXHJcbiAgICAgICAgaWYgKCBjaGlsZCAmJiAhdGhpcy5fZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcyB8fCBjaGlsZC5pc1Zpc2libGUoKSApIHtcclxuICAgICAgICAgIG91ckNoaWxkQm91bmRzLmluY2x1ZGVCb3VuZHMoIGNoaWxkLmJvdW5kcyApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gcnVuIHRoaXMgYmVmb3JlIGZpcmluZyB0aGUgZXZlbnRcclxuICAgICAgdGhpcy5fY2hpbGRCb3VuZHNEaXJ0eSA9IGZhbHNlO1xyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuYm91bmRzICYmIHNjZW5lcnlMb2cuYm91bmRzKCBgY2hpbGRCb3VuZHM6ICR7b3VyQ2hpbGRCb3VuZHN9YCApO1xyXG5cclxuICAgICAgaWYgKCAhb3VyQ2hpbGRCb3VuZHMuZXF1YWxzKCBvbGRDaGlsZEJvdW5kcyApICkge1xyXG4gICAgICAgIC8vIG5vdGlmaWVzIG9ubHkgb24gYW4gYWN0dWFsIGNoYW5nZVxyXG4gICAgICAgIGlmICggIW91ckNoaWxkQm91bmRzLmVxdWFsc0Vwc2lsb24oIG9sZENoaWxkQm91bmRzLCBub3RpZmljYXRpb25UaHJlc2hvbGQgKSApIHtcclxuICAgICAgICAgIHRoaXMuY2hpbGRCb3VuZHNQcm9wZXJ0eS5ub3RpZnlMaXN0ZW5lcnMoIG9sZENoaWxkQm91bmRzICk7IC8vIFJFLUVOVFJBTlQgQ0FMTCBIRVJFLCBpdCB3aWxsIHZhbGlkYXRlQm91bmRzKClcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFdBUk5JTkc6IFRoaW5rIHR3aWNlIGJlZm9yZSBhZGRpbmcgY29kZSBoZXJlIGJlbG93IHRoZSBsaXN0ZW5lciBub3RpZmljYXRpb24uIFRoZSBub3RpZnlMaXN0ZW5lcnMoKSBjYWxsIGNhblxyXG4gICAgICAvLyB0cmlnZ2VyIHJlLWVudHJhbmN5LCBzbyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIHdvcmsgd2hlbiB0aGF0IGhhcHBlbnMuIERPIE5PVCBzZXQgdGhpbmdzIGJhc2VkIG9uIGxvY2FsXHJcbiAgICAgIC8vIHZhcmlhYmxlcyBoZXJlLlxyXG4gICAgfVxyXG5cclxuICAgIGlmICggdGhpcy5fbG9jYWxCb3VuZHNEaXJ0eSApIHtcclxuICAgICAgd2FzRGlydHlCZWZvcmUgPSB0cnVlO1xyXG5cclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLmJvdW5kcyAmJiBzY2VuZXJ5TG9nLmJvdW5kcyggJ2xvY2FsQm91bmRzIGRpcnR5JyApO1xyXG5cclxuICAgICAgdGhpcy5fbG9jYWxCb3VuZHNEaXJ0eSA9IGZhbHNlOyAvLyB3ZSBvbmx5IG5lZWQgdGhpcyB0byBzZXQgbG9jYWwgYm91bmRzIGFzIGRpcnR5XHJcblxyXG4gICAgICBjb25zdCBvbGRMb2NhbEJvdW5kcyA9IHNjcmF0Y2hCb3VuZHMyLnNldCggb3VyTG9jYWxCb3VuZHMgKTsgLy8gc3RvcmUgb2xkIHZhbHVlIGluIGEgdGVtcG9yYXJ5IEJvdW5kczJcclxuXHJcbiAgICAgIC8vIE9ubHkgYWRqdXN0IHRoZSBsb2NhbCBib3VuZHMgaWYgaXQgaXMgbm90IG92ZXJyaWRkZW5cclxuICAgICAgaWYgKCAhdGhpcy5fbG9jYWxCb3VuZHNPdmVycmlkZGVuICkge1xyXG4gICAgICAgIC8vIGxvY2FsIGJvdW5kcyBhcmUgYSB1bmlvbiBiZXR3ZWVuIG91ciBzZWxmIGJvdW5kcyBhbmQgY2hpbGQgYm91bmRzXHJcbiAgICAgICAgb3VyTG9jYWxCb3VuZHMuc2V0KCBvdXJTZWxmQm91bmRzICkuaW5jbHVkZUJvdW5kcyggb3VyQ2hpbGRCb3VuZHMgKTtcclxuXHJcbiAgICAgICAgLy8gYXBwbHkgY2xpcHBpbmcgdG8gdGhlIGJvdW5kcyBpZiB3ZSBoYXZlIGEgY2xpcCBhcmVhIChhbGwgZG9uZSBpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSlcclxuICAgICAgICBjb25zdCBjbGlwQXJlYSA9IHRoaXMuY2xpcEFyZWE7XHJcbiAgICAgICAgaWYgKCBjbGlwQXJlYSApIHtcclxuICAgICAgICAgIG91ckxvY2FsQm91bmRzLmNvbnN0cmFpbkJvdW5kcyggY2xpcEFyZWEuYm91bmRzICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuYm91bmRzICYmIHNjZW5lcnlMb2cuYm91bmRzKCBgbG9jYWxCb3VuZHM6ICR7b3VyTG9jYWxCb3VuZHN9YCApO1xyXG5cclxuICAgICAgLy8gTk9URTogd2UgbmVlZCB0byB1cGRhdGUgbWF4IGRpbWVuc2lvbnMgc3RpbGwgZXZlbiBpZiB3ZSBhcmUgc2V0dGluZyBvdmVycmlkZGVuIGxvY2FsQm91bmRzXHJcbiAgICAgIC8vIGFkanVzdCBvdXIgdHJhbnNmb3JtIHRvIG1hdGNoIG1heGltdW0gYm91bmRzIGlmIG5lY2Vzc2FyeSBvbiBhIGxvY2FsIGJvdW5kcyBjaGFuZ2VcclxuICAgICAgaWYgKCB0aGlzLl9tYXhXaWR0aCAhPT0gbnVsbCB8fCB0aGlzLl9tYXhIZWlnaHQgIT09IG51bGwgKSB7XHJcbiAgICAgICAgLy8gbmVlZHMgdG8gcnVuIGJlZm9yZSBub3RpZmljYXRpb25zIGJlbG93LCBvdGhlcndpc2UgcmVlbnRyYW5jeSB0aGF0IGhpdHMgdGhpcyBjb2RlcGF0aCB3aWxsIGhhdmUgaXRzXHJcbiAgICAgICAgLy8gdXBkYXRlTWF4RGltZW5zaW9uIG92ZXJyaWRkZW4gYnkgdGhlIGV2ZW50dWFsIG9yaWdpbmFsIGZ1bmN0aW9uIGNhbGwsIHdpdGggdGhlIG5vdy1pbmNvcnJlY3QgbG9jYWwgYm91bmRzLlxyXG4gICAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzcyNVxyXG4gICAgICAgIHRoaXMudXBkYXRlTWF4RGltZW5zaW9uKCBvdXJMb2NhbEJvdW5kcyApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoICFvdXJMb2NhbEJvdW5kcy5lcXVhbHMoIG9sZExvY2FsQm91bmRzICkgKSB7XHJcbiAgICAgICAgLy8gc2FuaXR5IGNoZWNrLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzEwNzEsIHdlJ3JlIHJ1bm5pbmcgdGhpcyBiZWZvcmUgdGhlIGxvY2FsQm91bmRzXHJcbiAgICAgICAgLy8gbGlzdGVuZXJzIGFyZSBub3RpZmllZCwgdG8gc3VwcG9ydCBsaW1pdGVkIHJlLWVudHJhbmNlLlxyXG4gICAgICAgIHRoaXMuX2JvdW5kc0RpcnR5ID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgaWYgKCAhb3VyTG9jYWxCb3VuZHMuZXF1YWxzRXBzaWxvbiggb2xkTG9jYWxCb3VuZHMsIG5vdGlmaWNhdGlvblRocmVzaG9sZCApICkge1xyXG4gICAgICAgICAgdGhpcy5sb2NhbEJvdW5kc1Byb3BlcnR5Lm5vdGlmeUxpc3RlbmVycyggb2xkTG9jYWxCb3VuZHMgKTsgLy8gUkUtRU5UUkFOVCBDQUxMIEhFUkUsIGl0IHdpbGwgdmFsaWRhdGVCb3VuZHMoKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gV0FSTklORzogVGhpbmsgdHdpY2UgYmVmb3JlIGFkZGluZyBjb2RlIGhlcmUgYmVsb3cgdGhlIGxpc3RlbmVyIG5vdGlmaWNhdGlvbi4gVGhlIG5vdGlmeUxpc3RlbmVycygpIGNhbGwgY2FuXHJcbiAgICAgIC8vIHRyaWdnZXIgcmUtZW50cmFuY3ksIHNvIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gd29yayB3aGVuIHRoYXQgaGFwcGVucy4gRE8gTk9UIHNldCB0aGluZ3MgYmFzZWQgb24gbG9jYWxcclxuICAgICAgLy8gdmFyaWFibGVzIGhlcmUuXHJcbiAgICB9XHJcblxyXG4gICAgLy8gVE9ETzogbGF5b3V0IGhlcmU/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcblxyXG4gICAgaWYgKCB0aGlzLl9ib3VuZHNEaXJ0eSApIHtcclxuICAgICAgd2FzRGlydHlCZWZvcmUgPSB0cnVlO1xyXG5cclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLmJvdW5kcyAmJiBzY2VuZXJ5TG9nLmJvdW5kcyggJ2JvdW5kcyBkaXJ0eScgKTtcclxuXHJcbiAgICAgIC8vIHJ1biB0aGlzIGJlZm9yZSBmaXJpbmcgdGhlIGV2ZW50XHJcbiAgICAgIHRoaXMuX2JvdW5kc0RpcnR5ID0gZmFsc2U7XHJcblxyXG4gICAgICBjb25zdCBvbGRCb3VuZHMgPSBzY3JhdGNoQm91bmRzMi5zZXQoIG91ckJvdW5kcyApOyAvLyBzdG9yZSBvbGQgdmFsdWUgaW4gYSB0ZW1wb3JhcnkgQm91bmRzMlxyXG5cclxuICAgICAgLy8gbm8gbmVlZCB0byBkbyB0aGUgbW9yZSBleHBlbnNpdmUgYm91bmRzIHRyYW5zZm9ybWF0aW9uIGlmIHdlIGFyZSBzdGlsbCBheGlzLWFsaWduZWRcclxuICAgICAgaWYgKCB0aGlzLl90cmFuc2Zvcm1Cb3VuZHMgJiYgIXRoaXMuX3RyYW5zZm9ybS5nZXRNYXRyaXgoKS5pc0F4aXNBbGlnbmVkKCkgKSB7XHJcbiAgICAgICAgLy8gbXV0YXRlcyB0aGUgbWF0cml4IGFuZCBib3VuZHMgZHVyaW5nIHJlY3Vyc2lvblxyXG5cclxuICAgICAgICBjb25zdCBtYXRyaXggPSBzY3JhdGNoTWF0cml4My5zZXQoIHRoaXMuZ2V0TWF0cml4KCkgKTsgLy8gY2FsbHMgYmVsb3cgbXV0YXRlIHRoaXMgbWF0cml4XHJcbiAgICAgICAgb3VyQm91bmRzLnNldCggQm91bmRzMi5OT1RISU5HICk7XHJcbiAgICAgICAgLy8gSW5jbHVkZSBlYWNoIHBhaW50ZWQgc2VsZiBpbmRpdmlkdWFsbHksIHRyYW5zZm9ybWVkIHdpdGggdGhlIGV4YWN0IHRyYW5zZm9ybSBtYXRyaXguXHJcbiAgICAgICAgLy8gVGhpcyBpcyBleHBlbnNpdmUsIGFzIHdlIGhhdmUgdG8gZG8gMiBtYXRyaXggdHJhbnNmb3JtcyBmb3IgZXZlcnkgZGVzY2VuZGFudC5cclxuICAgICAgICB0aGlzLl9pbmNsdWRlVHJhbnNmb3JtZWRTdWJ0cmVlQm91bmRzKCBtYXRyaXgsIG91ckJvdW5kcyApOyAvLyBzZWxmIGFuZCBjaGlsZHJlblxyXG5cclxuICAgICAgICBjb25zdCBjbGlwQXJlYSA9IHRoaXMuY2xpcEFyZWE7XHJcbiAgICAgICAgaWYgKCBjbGlwQXJlYSApIHtcclxuICAgICAgICAgIG91ckJvdW5kcy5jb25zdHJhaW5Cb3VuZHMoIGNsaXBBcmVhLmdldEJvdW5kc1dpdGhUcmFuc2Zvcm0oIG1hdHJpeCApICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIC8vIGNvbnZlcnRzIGxvY2FsIHRvIHBhcmVudCBib3VuZHMuIG11dGFibGUgbWV0aG9kcyB1c2VkIHRvIG1pbmltaXplIG51bWJlciBvZiBjcmVhdGVkIGJvdW5kcyBpbnN0YW5jZXNcclxuICAgICAgICAvLyAod2UgY3JlYXRlIG9uZSBzbyB3ZSBkb24ndCBjaGFuZ2UgcmVmZXJlbmNlcyB0byB0aGUgb2xkIG9uZSlcclxuICAgICAgICBvdXJCb3VuZHMuc2V0KCBvdXJMb2NhbEJvdW5kcyApO1xyXG4gICAgICAgIHRoaXMudHJhbnNmb3JtQm91bmRzRnJvbUxvY2FsVG9QYXJlbnQoIG91ckJvdW5kcyApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuYm91bmRzICYmIHNjZW5lcnlMb2cuYm91bmRzKCBgYm91bmRzOiAke291ckJvdW5kc31gICk7XHJcblxyXG4gICAgICBpZiAoICFvdXJCb3VuZHMuZXF1YWxzKCBvbGRCb3VuZHMgKSApIHtcclxuICAgICAgICAvLyBpZiB3ZSBoYXZlIGEgYm91bmRzIGNoYW5nZSwgd2UgbmVlZCB0byBpbnZhbGlkYXRlIG91ciBwYXJlbnRzIHNvIHRoZXkgY2FuIGJlIHJlY29tcHV0ZWRcclxuICAgICAgICBpID0gdGhpcy5fcGFyZW50cy5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKCBpLS0gKSB7XHJcbiAgICAgICAgICB0aGlzLl9wYXJlbnRzWyBpIF0uaW52YWxpZGF0ZUJvdW5kcygpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVE9ETzogY29uc2lkZXIgY2hhbmdpbmcgdG8gcGFyYW1ldGVyIG9iamVjdCAodGhhdCBtYXkgYmUgYSBwcm9ibGVtIGZvciB0aGUgR0Mgb3ZlcmhlYWQpIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAgICAgaWYgKCAhb3VyQm91bmRzLmVxdWFsc0Vwc2lsb24oIG9sZEJvdW5kcywgbm90aWZpY2F0aW9uVGhyZXNob2xkICkgKSB7XHJcbiAgICAgICAgICB0aGlzLmJvdW5kc1Byb3BlcnR5Lm5vdGlmeUxpc3RlbmVycyggb2xkQm91bmRzICk7IC8vIFJFLUVOVFJBTlQgQ0FMTCBIRVJFLCBpdCB3aWxsIHZhbGlkYXRlQm91bmRzKClcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFdBUk5JTkc6IFRoaW5rIHR3aWNlIGJlZm9yZSBhZGRpbmcgY29kZSBoZXJlIGJlbG93IHRoZSBsaXN0ZW5lciBub3RpZmljYXRpb24uIFRoZSBub3RpZnlMaXN0ZW5lcnMoKSBjYWxsIGNhblxyXG4gICAgICAvLyB0cmlnZ2VyIHJlLWVudHJhbmN5LCBzbyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIHdvcmsgd2hlbiB0aGF0IGhhcHBlbnMuIERPIE5PVCBzZXQgdGhpbmdzIGJhc2VkIG9uIGxvY2FsXHJcbiAgICAgIC8vIHZhcmlhYmxlcyBoZXJlLlxyXG4gICAgfVxyXG5cclxuICAgIC8vIGlmIHRoZXJlIHdlcmUgc2lkZS1lZmZlY3RzLCBydW4gdGhlIHZhbGlkYXRpb24gYWdhaW4gdW50aWwgd2UgYXJlIGNsZWFuXHJcbiAgICBpZiAoIHRoaXMuX2NoaWxkQm91bmRzRGlydHkgfHwgdGhpcy5fYm91bmRzRGlydHkgKSB7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5ib3VuZHMgJiYgc2NlbmVyeUxvZy5ib3VuZHMoICdyZXZhbGlkYXRpb24nICk7XHJcblxyXG4gICAgICAvLyBUT0RPOiBpZiB0aGVyZSBhcmUgc2lkZS1lZmZlY3RzIGluIGxpc3RlbmVycywgdGhpcyBjb3VsZCBvdmVyZmxvdyB0aGUgc3RhY2suIHdlIHNob3VsZCByZXBvcnQgYW4gZXJyb3IgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgLy8gaW5zdGVhZCBvZiBsb2NraW5nIHVwXHJcbiAgICAgIHRoaXMudmFsaWRhdGVCb3VuZHMoKTsgLy8gUkUtRU5UUkFOVCBDQUxMIEhFUkUsIGl0IHdpbGwgdmFsaWRhdGVCb3VuZHMoKVxyXG4gICAgfVxyXG5cclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICBhc3NlcnQoIHRoaXMuX29yaWdpbmFsQm91bmRzID09PSB0aGlzLmJvdW5kc1Byb3BlcnR5Ll92YWx1ZSwgJ1JlZmVyZW5jZSBmb3IgYm91bmRzIGNoYW5nZWQhJyApO1xyXG4gICAgICBhc3NlcnQoIHRoaXMuX29yaWdpbmFsTG9jYWxCb3VuZHMgPT09IHRoaXMubG9jYWxCb3VuZHNQcm9wZXJ0eS5fdmFsdWUsICdSZWZlcmVuY2UgZm9yIGxvY2FsQm91bmRzIGNoYW5nZWQhJyApO1xyXG4gICAgICBhc3NlcnQoIHRoaXMuX29yaWdpbmFsU2VsZkJvdW5kcyA9PT0gdGhpcy5zZWxmQm91bmRzUHJvcGVydHkuX3ZhbHVlLCAnUmVmZXJlbmNlIGZvciBzZWxmQm91bmRzIGNoYW5nZWQhJyApO1xyXG4gICAgICBhc3NlcnQoIHRoaXMuX29yaWdpbmFsQ2hpbGRCb3VuZHMgPT09IHRoaXMuY2hpbGRCb3VuZHNQcm9wZXJ0eS5fdmFsdWUsICdSZWZlcmVuY2UgZm9yIGNoaWxkQm91bmRzIGNoYW5nZWQhJyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGRvdWJsZS1jaGVjayB0aGF0IGFsbCBvZiBvdXIgYm91bmRzIGhhbmRsaW5nIGhhcyBiZWVuIGFjY3VyYXRlXHJcbiAgICBpZiAoIGFzc2VydFNsb3cgKSB7XHJcbiAgICAgIC8vIG5ldyBzY29wZSBmb3Igc2FmZXR5XHJcbiAgICAgICggKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGVwc2lsb24gPSAwLjAwMDAwMTtcclxuXHJcbiAgICAgICAgY29uc3QgY2hpbGRCb3VuZHMgPSBCb3VuZHMyLk5PVEhJTkcuY29weSgpO1xyXG4gICAgICAgIF8uZWFjaCggdGhpcy5fY2hpbGRyZW4sIGNoaWxkID0+IHtcclxuICAgICAgICAgIGlmICggIXRoaXMuX2V4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMgfHwgY2hpbGQuaXNWaXNpYmxlKCkgKSB7XHJcbiAgICAgICAgICAgIGNoaWxkQm91bmRzLmluY2x1ZGVCb3VuZHMoIGNoaWxkLmJvdW5kc1Byb3BlcnR5Ll92YWx1ZSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gKTtcclxuXHJcbiAgICAgICAgbGV0IGxvY2FsQm91bmRzID0gdGhpcy5zZWxmQm91bmRzUHJvcGVydHkuX3ZhbHVlLnVuaW9uKCBjaGlsZEJvdW5kcyApO1xyXG5cclxuICAgICAgICBjb25zdCBjbGlwQXJlYSA9IHRoaXMuY2xpcEFyZWE7XHJcbiAgICAgICAgaWYgKCBjbGlwQXJlYSApIHtcclxuICAgICAgICAgIGxvY2FsQm91bmRzID0gbG9jYWxCb3VuZHMuaW50ZXJzZWN0aW9uKCBjbGlwQXJlYS5ib3VuZHMgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGZ1bGxCb3VuZHMgPSB0aGlzLmxvY2FsVG9QYXJlbnRCb3VuZHMoIGxvY2FsQm91bmRzICk7XHJcblxyXG4gICAgICAgIGFzc2VydFNsb3cgJiYgYXNzZXJ0U2xvdyggdGhpcy5jaGlsZEJvdW5kc1Byb3BlcnR5Ll92YWx1ZS5lcXVhbHNFcHNpbG9uKCBjaGlsZEJvdW5kcywgZXBzaWxvbiApLFxyXG4gICAgICAgICAgYENoaWxkIGJvdW5kcyBtaXNtYXRjaCBhZnRlciB2YWxpZGF0ZUJvdW5kczogJHtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZEJvdW5kc1Byb3BlcnR5Ll92YWx1ZS50b1N0cmluZygpfSwgZXhwZWN0ZWQ6ICR7Y2hpbGRCb3VuZHMudG9TdHJpbmcoKX1gICk7XHJcbiAgICAgICAgYXNzZXJ0U2xvdyAmJiBhc3NlcnRTbG93KCB0aGlzLl9sb2NhbEJvdW5kc092ZXJyaWRkZW4gfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3RyYW5zZm9ybUJvdW5kcyB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ib3VuZHNQcm9wZXJ0eS5fdmFsdWUuZXF1YWxzRXBzaWxvbiggZnVsbEJvdW5kcywgZXBzaWxvbiApLFxyXG4gICAgICAgICAgYEJvdW5kcyBtaXNtYXRjaCBhZnRlciB2YWxpZGF0ZUJvdW5kczogJHt0aGlzLmJvdW5kc1Byb3BlcnR5Ll92YWx1ZS50b1N0cmluZygpXHJcbiAgICAgICAgICB9LCBleHBlY3RlZDogJHtmdWxsQm91bmRzLnRvU3RyaW5nKCl9LiBUaGlzIGNvdWxkIGhhdmUgaGFwcGVuZWQgaWYgYSBib3VuZHMgaW5zdGFuY2Ugb3duZWQgYnkgYSBOb2RlYCArXHJcbiAgICAgICAgICAnIHdhcyBkaXJlY3RseSBtdXRhdGVkIChlLmcuIGJvdW5kcy5lcm9kZSgpKScgKTtcclxuICAgICAgfSApKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLmJvdW5kcyAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG5cclxuICAgIHJldHVybiB3YXNEaXJ0eUJlZm9yZTsgLy8gd2hldGhlciBhbnkgZGlydHkgZmxhZ3Mgd2VyZSBzZXRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlY3Vyc2lvbiBmb3IgYWNjdXJhdGUgdHJhbnNmb3JtZWQgYm91bmRzIGhhbmRsaW5nLiBNdXRhdGVzIGJvdW5kcyB3aXRoIHRoZSBhZGRlZCBib3VuZHMuXHJcbiAgICogTXV0YXRlcyB0aGUgbWF0cml4IChwYXJhbWV0ZXIpLCBidXQgbXV0YXRlcyBpdCBiYWNrIHRvIHRoZSBzdGFydGluZyBwb2ludCAod2l0aGluIGZsb2F0aW5nLXBvaW50IGVycm9yKS5cclxuICAgKi9cclxuICBwcml2YXRlIF9pbmNsdWRlVHJhbnNmb3JtZWRTdWJ0cmVlQm91bmRzKCBtYXRyaXg6IE1hdHJpeDMsIGJvdW5kczogQm91bmRzMiApOiBCb3VuZHMyIHtcclxuICAgIGlmICggIXRoaXMuc2VsZkJvdW5kcy5pc0VtcHR5KCkgKSB7XHJcbiAgICAgIGJvdW5kcy5pbmNsdWRlQm91bmRzKCB0aGlzLmdldFRyYW5zZm9ybWVkU2VsZkJvdW5kcyggbWF0cml4ICkgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBudW1DaGlsZHJlbiA9IHRoaXMuX2NoaWxkcmVuLmxlbmd0aDtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IG51bUNoaWxkcmVuOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGNoaWxkID0gdGhpcy5fY2hpbGRyZW5bIGkgXTtcclxuXHJcbiAgICAgIG1hdHJpeC5tdWx0aXBseU1hdHJpeCggY2hpbGQuX3RyYW5zZm9ybS5nZXRNYXRyaXgoKSApO1xyXG4gICAgICBjaGlsZC5faW5jbHVkZVRyYW5zZm9ybWVkU3VidHJlZUJvdW5kcyggbWF0cml4LCBib3VuZHMgKTtcclxuICAgICAgbWF0cml4Lm11bHRpcGx5TWF0cml4KCBjaGlsZC5fdHJhbnNmb3JtLmdldEludmVyc2UoKSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBib3VuZHM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmF2ZXJzZXMgdGhpcyBzdWJ0cmVlIGFuZCB2YWxpZGF0ZXMgYm91bmRzIG9ubHkgZm9yIHN1YnRyZWVzIHRoYXQgaGF2ZSBib3VuZHMgbGlzdGVuZXJzICh0cnlpbmcgdG8gZXhjbHVkZSBhc1xyXG4gICAqIG11Y2ggYXMgcG9zc2libGUgZm9yIHBlcmZvcm1hbmNlKS4gVGhpcyBpcyBkb25lIHNvIHRoYXQgd2UgY2FuIGRvIHRoZSBtaW5pbXVtIGJvdW5kcyB2YWxpZGF0aW9uIHRvIHByZXZlbnQgYW55XHJcbiAgICogYm91bmRzIGxpc3RlbmVycyBmcm9tIGJlaW5nIHRyaWdnZXJlZCBpbiBmdXJ0aGVyIHZhbGlkYXRlQm91bmRzKCkgY2FsbHMgd2l0aG91dCBvdGhlciBOb2RlIGNoYW5nZXMgYmVpbmcgZG9uZS5cclxuICAgKiBUaGlzIGlzIHJlcXVpcmVkIGZvciBEaXNwbGF5J3MgYXRvbWljIChub24tcmVlbnRyYW50KSB1cGRhdGVEaXNwbGF5KCksIHNvIHRoYXQgd2UgZG9uJ3QgYWNjaWRlbnRhbGx5IHRyaWdnZXJcclxuICAgKiBib3VuZHMgbGlzdGVuZXJzIHdoaWxlIGNvbXB1dGluZyBib3VuZHMgZHVyaW5nIHVwZGF0ZURpc3BsYXkoKS4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICpcclxuICAgKiBOT1RFOiB0aGlzIHNob3VsZCBwYXNzIGJ5IChpZ25vcmUpIGFueSBvdmVycmlkZGVuIGxvY2FsQm91bmRzLCB0byB0cmlnZ2VyIGxpc3RlbmVycyBiZWxvdy5cclxuICAgKi9cclxuICBwdWJsaWMgdmFsaWRhdGVXYXRjaGVkQm91bmRzKCk6IHZvaWQge1xyXG4gICAgLy8gU2luY2UgYSBib3VuZHMgbGlzdGVuZXIgb24gb25lIG9mIHRoZSByb290cyBjb3VsZCBpbnZhbGlkYXRlIGJvdW5kcyBvbiB0aGUgb3RoZXIsIHdlIG5lZWQgdG8ga2VlcCBydW5uaW5nIHRoaXNcclxuICAgIC8vIHVudGlsIHRoZXkgYXJlIGFsbCBjbGVhbi4gT3RoZXJ3aXNlLCBzaWRlLWVmZmVjdHMgY291bGQgb2NjdXIgZnJvbSBib3VuZHMgdmFsaWRhdGlvbnNcclxuICAgIC8vIFRPRE86IGNvbnNpZGVyIGEgd2F5IHRvIHByZXZlbnQgaW5maW5pdGUgbG9vcHMgaGVyZSB0aGF0IG9jY3VyIGR1ZSB0byBib3VuZHMgbGlzdGVuZXJzIHRyaWdnZXJpbmcgY3ljbGVzIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICB3aGlsZSAoIHRoaXMud2F0Y2hlZEJvdW5kc1NjYW4oKSApIHtcclxuICAgICAgLy8gZG8gbm90aGluZ1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVjdXJzaXZlIGZ1bmN0aW9uIGZvciB2YWxpZGF0ZVdhdGNoZWRCb3VuZHMuIFJldHVybmVkIHdoZXRoZXIgYW55IHZhbGlkYXRlQm91bmRzKCkgcmV0dXJuZWQgdHJ1ZSAobWVhbnMgd2UgaGF2ZVxyXG4gICAqIHRvIHRyYXZlcnNlIGFnYWluKSAtIHNjZW5lcnktaW50ZXJuYWxcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIC0gV2hldGhlciB0aGVyZSBjb3VsZCBoYXZlIGJlZW4gYW55IGNoYW5nZXMuXHJcbiAgICovXHJcbiAgcHVibGljIHdhdGNoZWRCb3VuZHNTY2FuKCk6IGJvb2xlYW4ge1xyXG4gICAgaWYgKCB0aGlzLl9ib3VuZHNFdmVudFNlbGZDb3VudCAhPT0gMCApIHtcclxuICAgICAgLy8gd2UgYXJlIGEgcm9vdCB0aGF0IHNob3VsZCBiZSB2YWxpZGF0ZWQuIHJldHVybiB3aGV0aGVyIHdlIHVwZGF0ZWQgYW55dGhpbmdcclxuICAgICAgcmV0dXJuIHRoaXMudmFsaWRhdGVCb3VuZHMoKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0aGlzLl9ib3VuZHNFdmVudENvdW50ID4gMCAmJiB0aGlzLl9jaGlsZEJvdW5kc0RpcnR5ICkge1xyXG4gICAgICAvLyBkZXNjZW5kYW50cyBoYXZlIHdhdGNoZWQgYm91bmRzLCB0cmF2ZXJzZSFcclxuICAgICAgbGV0IGNoYW5nZWQgPSBmYWxzZTtcclxuICAgICAgY29uc3QgbnVtQ2hpbGRyZW4gPSB0aGlzLl9jaGlsZHJlbi5sZW5ndGg7XHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IG51bUNoaWxkcmVuOyBpKysgKSB7XHJcbiAgICAgICAgY2hhbmdlZCA9IHRoaXMuX2NoaWxkcmVuWyBpIF0ud2F0Y2hlZEJvdW5kc1NjYW4oKSB8fCBjaGFuZ2VkO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBjaGFuZ2VkO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIGlmIF9ib3VuZHNFdmVudENvdW50IGlzIHplcm8sIG5vIGJvdW5kcyBhcmUgd2F0Y2hlZCBiZWxvdyB1cyAoZG9uJ3QgdHJhdmVyc2UpLCBhbmQgaXQgd2Fzbid0IGNoYW5nZWRcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFya3MgdGhlIGJvdW5kcyBvZiB0aGlzIE5vZGUgYXMgaW52YWxpZCwgc28gdGhleSBhcmUgcmVjb21wdXRlZCBiZWZvcmUgYmVpbmcgYWNjZXNzZWQgYWdhaW4uXHJcbiAgICovXHJcbiAgcHVibGljIGludmFsaWRhdGVCb3VuZHMoKTogdm9pZCB7XHJcbiAgICAvLyBUT0RPOiBzb21ldGltZXMgd2Ugd29uJ3QgbmVlZCB0byBpbnZhbGlkYXRlIGxvY2FsIGJvdW5kcyEgaXQncyBub3QgdG9vIG11Y2ggb2YgYSBoYXNzbGUgdGhvdWdoPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgdGhpcy5fYm91bmRzRGlydHkgPSB0cnVlO1xyXG4gICAgdGhpcy5fbG9jYWxCb3VuZHNEaXJ0eSA9IHRydWU7XHJcblxyXG4gICAgLy8gYW5kIHNldCBmbGFncyBmb3IgYWxsIGFuY2VzdG9yc1xyXG4gICAgbGV0IGkgPSB0aGlzLl9wYXJlbnRzLmxlbmd0aDtcclxuICAgIHdoaWxlICggaS0tICkge1xyXG4gICAgICB0aGlzLl9wYXJlbnRzWyBpIF0uaW52YWxpZGF0ZUNoaWxkQm91bmRzKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWN1cnNpdmVseSB0YWcgYWxsIGFuY2VzdG9ycyB3aXRoIF9jaGlsZEJvdW5kc0RpcnR5IChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbnZhbGlkYXRlQ2hpbGRCb3VuZHMoKTogdm9pZCB7XHJcbiAgICAvLyBkb24ndCBib3RoZXIgdXBkYXRpbmcgaWYgd2UndmUgYWxyZWFkeSBiZWVuIHRhZ2dlZFxyXG4gICAgaWYgKCAhdGhpcy5fY2hpbGRCb3VuZHNEaXJ0eSApIHtcclxuICAgICAgdGhpcy5fY2hpbGRCb3VuZHNEaXJ0eSA9IHRydWU7XHJcbiAgICAgIHRoaXMuX2xvY2FsQm91bmRzRGlydHkgPSB0cnVlO1xyXG4gICAgICBsZXQgaSA9IHRoaXMuX3BhcmVudHMubGVuZ3RoO1xyXG4gICAgICB3aGlsZSAoIGktLSApIHtcclxuICAgICAgICB0aGlzLl9wYXJlbnRzWyBpIF0uaW52YWxpZGF0ZUNoaWxkQm91bmRzKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNob3VsZCBiZSBjYWxsZWQgdG8gbm90aWZ5IHRoYXQgb3VyIHNlbGZCb3VuZHMgbmVlZHMgdG8gY2hhbmdlIHRvIHRoaXMgbmV3IHZhbHVlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbnZhbGlkYXRlU2VsZiggbmV3U2VsZkJvdW5kcz86IEJvdW5kczIgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBuZXdTZWxmQm91bmRzID09PSB1bmRlZmluZWQgfHwgbmV3U2VsZkJvdW5kcyBpbnN0YW5jZW9mIEJvdW5kczIsXHJcbiAgICAgICdpbnZhbGlkYXRlU2VsZlxcJ3MgbmV3U2VsZkJvdW5kcywgaWYgcHJvdmlkZWQsIG5lZWRzIHRvIGJlIEJvdW5kczInICk7XHJcblxyXG4gICAgY29uc3Qgb3VyU2VsZkJvdW5kcyA9IHRoaXMuc2VsZkJvdW5kc1Byb3BlcnR5Ll92YWx1ZTtcclxuXHJcbiAgICAvLyBJZiBubyBzZWxmIGJvdW5kcyBhcmUgcHJvdmlkZWQsIHJlbHkgb24gdGhlIGJvdW5kcyB2YWxpZGF0aW9uIHRvIHRyaWdnZXIgY29tcHV0YXRpb24gKHVzaW5nIHVwZGF0ZVNlbGZCb3VuZHMoKSkuXHJcbiAgICBpZiAoICFuZXdTZWxmQm91bmRzICkge1xyXG4gICAgICB0aGlzLl9zZWxmQm91bmRzRGlydHkgPSB0cnVlO1xyXG4gICAgICB0aGlzLmludmFsaWRhdGVCb3VuZHMoKTtcclxuICAgICAgdGhpcy5fcGlja2VyLm9uU2VsZkJvdW5kc0RpcnR5KCk7XHJcbiAgICB9XHJcbiAgICAvLyBPdGhlcndpc2UsIHNldCB0aGUgc2VsZiBib3VuZHMgZGlyZWN0bHlcclxuICAgIGVsc2Uge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBuZXdTZWxmQm91bmRzLmlzRW1wdHkoKSB8fCBuZXdTZWxmQm91bmRzLmlzRmluaXRlKCksICdCb3VuZHMgbXVzdCBiZSBlbXB0eSBvciBmaW5pdGUgaW4gaW52YWxpZGF0ZVNlbGYnICk7XHJcblxyXG4gICAgICAvLyBEb24ndCByZWNvbXB1dGUgdGhlIHNlbGYgYm91bmRzXHJcbiAgICAgIHRoaXMuX3NlbGZCb3VuZHNEaXJ0eSA9IGZhbHNlO1xyXG5cclxuICAgICAgLy8gaWYgdGhlc2UgYm91bmRzIGFyZSBkaWZmZXJlbnQgdGhhbiBjdXJyZW50IHNlbGYgYm91bmRzXHJcbiAgICAgIGlmICggIW91clNlbGZCb3VuZHMuZXF1YWxzKCBuZXdTZWxmQm91bmRzICkgKSB7XHJcbiAgICAgICAgY29uc3Qgb2xkU2VsZkJvdW5kcyA9IHNjcmF0Y2hCb3VuZHMyLnNldCggb3VyU2VsZkJvdW5kcyApO1xyXG5cclxuICAgICAgICAvLyBzZXQgcmVwYWludCBmbGFnc1xyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZUJvdW5kcygpO1xyXG4gICAgICAgIHRoaXMuX3BpY2tlci5vblNlbGZCb3VuZHNEaXJ0eSgpO1xyXG5cclxuICAgICAgICAvLyByZWNvcmQgdGhlIG5ldyBib3VuZHNcclxuICAgICAgICBvdXJTZWxmQm91bmRzLnNldCggbmV3U2VsZkJvdW5kcyApO1xyXG5cclxuICAgICAgICAvLyBmaXJlIHRoZSBldmVudCBpbW1lZGlhdGVseVxyXG4gICAgICAgIHRoaXMuc2VsZkJvdW5kc1Byb3BlcnR5Lm5vdGlmeUxpc3RlbmVycyggb2xkU2VsZkJvdW5kcyApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBhc3NlcnRTbG93ICkgeyB0aGlzLl9waWNrZXIuYXVkaXQoKTsgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWVhbnQgdG8gYmUgb3ZlcnJpZGRlbiBieSBOb2RlIHN1Yi10eXBlcyB0byBjb21wdXRlIHNlbGYgYm91bmRzIChpZiBpbnZhbGlkYXRlU2VsZigpIHdpdGggbm8gYXJndW1lbnRzIHdhcyBjYWxsZWQpLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgLSBXaGV0aGVyIHRoZSBzZWxmIGJvdW5kcyBjaGFuZ2VkLlxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCB1cGRhdGVTZWxmQm91bmRzKCk6IGJvb2xlYW4ge1xyXG4gICAgLy8gVGhlIE5vZGUgaW1wbGVtZW50YXRpb24gKHVuLW92ZXJyaWRkZW4pIHdpbGwgbmV2ZXIgY2hhbmdlIHRoZSBzZWxmIGJvdW5kcyAoYWx3YXlzIE5PVEhJTkcpLlxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5zZWxmQm91bmRzUHJvcGVydHkuX3ZhbHVlLmVxdWFscyggQm91bmRzMi5OT1RISU5HICkgKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciBhIE5vZGUgaXMgYSBjaGlsZCBvZiB0aGlzIG5vZGUuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyAtIFdoZXRoZXIgcG90ZW50aWFsQ2hpbGQgaXMgYWN0dWFsbHkgb3VyIGNoaWxkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBoYXNDaGlsZCggcG90ZW50aWFsQ2hpbGQ6IE5vZGUgKTogYm9vbGVhbiB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBwb3RlbnRpYWxDaGlsZCAmJiAoIHBvdGVudGlhbENoaWxkIGluc3RhbmNlb2YgTm9kZSApLCAnaGFzQ2hpbGQgbmVlZHMgdG8gYmUgY2FsbGVkIHdpdGggYSBOb2RlJyApO1xyXG4gICAgY29uc3QgaXNPdXJDaGlsZCA9IF8uaW5jbHVkZXMoIHRoaXMuX2NoaWxkcmVuLCBwb3RlbnRpYWxDaGlsZCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNPdXJDaGlsZCA9PT0gXy5pbmNsdWRlcyggcG90ZW50aWFsQ2hpbGQuX3BhcmVudHMsIHRoaXMgKSwgJ2NoaWxkLXBhcmVudCByZWZlcmVuY2Ugc2hvdWxkIG1hdGNoIHBhcmVudC1jaGlsZCByZWZlcmVuY2UnICk7XHJcbiAgICByZXR1cm4gaXNPdXJDaGlsZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBTaGFwZSB0aGF0IHJlcHJlc2VudHMgdGhlIGFyZWEgY292ZXJlZCBieSBjb250YWluc1BvaW50U2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0U2VsZlNoYXBlKCk6IFNoYXBlIHtcclxuICAgIGNvbnN0IHNlbGZCb3VuZHMgPSB0aGlzLnNlbGZCb3VuZHM7XHJcbiAgICBpZiAoIHNlbGZCb3VuZHMuaXNFbXB0eSgpICkge1xyXG4gICAgICByZXR1cm4gbmV3IFNoYXBlKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIFNoYXBlLmJvdW5kcyggdGhpcy5zZWxmQm91bmRzICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIG91ciBzZWxmQm91bmRzICh0aGUgYm91bmRzIGZvciB0aGlzIE5vZGUncyBjb250ZW50IGluIHRoZSBsb2NhbCBjb29yZGluYXRlcywgZXhjbHVkaW5nIGFueXRoaW5nIGZyb20gb3VyXHJcbiAgICogY2hpbGRyZW4gYW5kIGRlc2NlbmRhbnRzKS5cclxuICAgKlxyXG4gICAqIE5PVEU6IERvIE5PVCBtdXRhdGUgdGhlIHJldHVybmVkIHZhbHVlIVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTZWxmQm91bmRzKCk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuc2VsZkJvdW5kc1Byb3BlcnR5LnZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFNlbGZCb3VuZHMoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgc2VsZkJvdW5kcygpOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiB0aGlzLmdldFNlbGZCb3VuZHMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBib3VuZGluZyBib3ggdGhhdCBzaG91bGQgY29udGFpbiBhbGwgc2VsZiBjb250ZW50IGluIHRoZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lIChvdXIgbm9ybWFsIHNlbGYgYm91bmRzXHJcbiAgICogYXJlbid0IGd1YXJhbnRlZWQgdGhpcyBmb3IgVGV4dCwgZXRjLilcclxuICAgKlxyXG4gICAqIE92ZXJyaWRlIHRoaXMgdG8gcHJvdmlkZSBkaWZmZXJlbnQgYmVoYXZpb3IuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFNhZmVTZWxmQm91bmRzKCk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuc2VsZkJvdW5kc1Byb3BlcnR5LnZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFNhZmVTZWxmQm91bmRzKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHNhZmVTZWxmQm91bmRzKCk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0U2FmZVNlbGZCb3VuZHMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGJvdW5kaW5nIGJveCB0aGF0IHNob3VsZCBjb250YWluIGFsbCBjb250ZW50IG9mIG91ciBjaGlsZHJlbiBpbiBvdXIgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZS4gRG9lcyBub3RcclxuICAgKiBpbmNsdWRlIG91ciBcInNlbGZcIiBib3VuZHMuXHJcbiAgICpcclxuICAgKiBOT1RFOiBEbyBOT1QgbXV0YXRlIHRoZSByZXR1cm5lZCB2YWx1ZSFcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q2hpbGRCb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5jaGlsZEJvdW5kc1Byb3BlcnR5LnZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldENoaWxkQm91bmRzKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGNoaWxkQm91bmRzKCk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q2hpbGRCb3VuZHMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGJvdW5kaW5nIGJveCB0aGF0IHNob3VsZCBjb250YWluIGFsbCBjb250ZW50IG9mIG91ciBjaGlsZHJlbiBBTkQgb3VyIHNlbGYgaW4gb3VyIGxvY2FsIGNvb3JkaW5hdGVcclxuICAgKiBmcmFtZS5cclxuICAgKlxyXG4gICAqIE5PVEU6IERvIE5PVCBtdXRhdGUgdGhlIHJldHVybmVkIHZhbHVlIVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMb2NhbEJvdW5kcygpOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiB0aGlzLmxvY2FsQm91bmRzUHJvcGVydHkudmFsdWU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0TG9jYWxCb3VuZHMoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgbG9jYWxCb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbEJvdW5kcygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldExvY2FsQm91bmRzKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGxvY2FsQm91bmRzKCB2YWx1ZTogQm91bmRzMiB8IG51bGwgKSB7XHJcbiAgICB0aGlzLnNldExvY2FsQm91bmRzKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBsb2NhbEJvdW5kc092ZXJyaWRkZW4oKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5fbG9jYWxCb3VuZHNPdmVycmlkZGVuO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWxsb3dzIG92ZXJyaWRpbmcgdGhlIHZhbHVlIG9mIGxvY2FsQm91bmRzIChhbmQgdGh1cyBjaGFuZ2luZyB0aGluZ3MgbGlrZSAnYm91bmRzJyB0aGF0IGRlcGVuZCBvbiBsb2NhbEJvdW5kcykuXHJcbiAgICogSWYgaXQncyBzZXQgdG8gYSBub24tbnVsbCB2YWx1ZSwgdGhhdCB2YWx1ZSB3aWxsIGFsd2F5cyBiZSB1c2VkIGZvciBsb2NhbEJvdW5kcyB1bnRpbCB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZFxyXG4gICAqIGFnYWluLiBUbyByZXZlcnQgdG8gaGF2aW5nIFNjZW5lcnkgY29tcHV0ZSB0aGUgbG9jYWxCb3VuZHMsIHNldCB0aGlzIHRvIG51bGwuICBUaGUgYm91bmRzIHNob3VsZCBub3QgYmUgcmVkdWNlZFxyXG4gICAqIHNtYWxsZXIgdGhhbiB0aGUgdmlzaWJsZSBib3VuZHMgb24gdGhlIHNjcmVlbi5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0TG9jYWxCb3VuZHMoIGxvY2FsQm91bmRzOiBCb3VuZHMyIHwgbnVsbCApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGxvY2FsQm91bmRzID09PSBudWxsIHx8IGxvY2FsQm91bmRzIGluc3RhbmNlb2YgQm91bmRzMiwgJ2xvY2FsQm91bmRzIG92ZXJyaWRlIHNob3VsZCBiZSBzZXQgdG8gZWl0aGVyIG51bGwgb3IgYSBCb3VuZHMyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbG9jYWxCb3VuZHMgPT09IG51bGwgfHwgIWlzTmFOKCBsb2NhbEJvdW5kcy5taW5YICksICdtaW5YIGZvciBsb2NhbEJvdW5kcyBzaG91bGQgbm90IGJlIE5hTicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGxvY2FsQm91bmRzID09PSBudWxsIHx8ICFpc05hTiggbG9jYWxCb3VuZHMubWluWSApLCAnbWluWSBmb3IgbG9jYWxCb3VuZHMgc2hvdWxkIG5vdCBiZSBOYU4nICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBsb2NhbEJvdW5kcyA9PT0gbnVsbCB8fCAhaXNOYU4oIGxvY2FsQm91bmRzLm1heFggKSwgJ21heFggZm9yIGxvY2FsQm91bmRzIHNob3VsZCBub3QgYmUgTmFOJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbG9jYWxCb3VuZHMgPT09IG51bGwgfHwgIWlzTmFOKCBsb2NhbEJvdW5kcy5tYXhZICksICdtYXhZIGZvciBsb2NhbEJvdW5kcyBzaG91bGQgbm90IGJlIE5hTicgKTtcclxuXHJcbiAgICBjb25zdCBvdXJMb2NhbEJvdW5kcyA9IHRoaXMubG9jYWxCb3VuZHNQcm9wZXJ0eS5fdmFsdWU7XHJcbiAgICBjb25zdCBvbGRMb2NhbEJvdW5kcyA9IG91ckxvY2FsQm91bmRzLmNvcHkoKTtcclxuXHJcbiAgICBpZiAoIGxvY2FsQm91bmRzID09PSBudWxsICkge1xyXG4gICAgICAvLyB3ZSBjYW4ganVzdCBpZ25vcmUgdGhpcyBpZiB3ZSB3ZXJlbid0IGFjdHVhbGx5IG92ZXJyaWRpbmcgbG9jYWwgYm91bmRzIGJlZm9yZVxyXG4gICAgICBpZiAoIHRoaXMuX2xvY2FsQm91bmRzT3ZlcnJpZGRlbiApIHtcclxuXHJcbiAgICAgICAgdGhpcy5fbG9jYWxCb3VuZHNPdmVycmlkZGVuID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5sb2NhbEJvdW5kc1Byb3BlcnR5Lm5vdGlmeUxpc3RlbmVycyggb2xkTG9jYWxCb3VuZHMgKTtcclxuICAgICAgICB0aGlzLmludmFsaWRhdGVCb3VuZHMoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIGp1c3QgYW4gaW5zdGFuY2UgY2hlY2sgZm9yIG5vdy4gY29uc2lkZXIgZXF1YWxzKCkgaW4gdGhlIGZ1dHVyZSBkZXBlbmRpbmcgb24gY29zdFxyXG4gICAgICBjb25zdCBjaGFuZ2VkID0gIWxvY2FsQm91bmRzLmVxdWFscyggb3VyTG9jYWxCb3VuZHMgKSB8fCAhdGhpcy5fbG9jYWxCb3VuZHNPdmVycmlkZGVuO1xyXG5cclxuICAgICAgaWYgKCBjaGFuZ2VkICkge1xyXG4gICAgICAgIG91ckxvY2FsQm91bmRzLnNldCggbG9jYWxCb3VuZHMgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCAhdGhpcy5fbG9jYWxCb3VuZHNPdmVycmlkZGVuICkge1xyXG4gICAgICAgIHRoaXMuX2xvY2FsQm91bmRzT3ZlcnJpZGRlbiA9IHRydWU7IC8vIE5PVEU6IGhhcyB0byBiZSBkb25lIGJlZm9yZSBpbnZhbGlkYXRpbmcgYm91bmRzLCBzaW5jZSB0aGlzIGRpc2FibGVzIGxvY2FsQm91bmRzIGNvbXB1dGF0aW9uXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggY2hhbmdlZCApIHtcclxuICAgICAgICB0aGlzLmxvY2FsQm91bmRzUHJvcGVydHkubm90aWZ5TGlzdGVuZXJzKCBvbGRMb2NhbEJvdW5kcyApO1xyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZUJvdW5kcygpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNZWFudCB0byBiZSBvdmVycmlkZGVuIGluIHN1Yi10eXBlcyB0aGF0IGhhdmUgbW9yZSBhY2N1cmF0ZSBib3VuZHMgZGV0ZXJtaW5hdGlvbiBmb3Igd2hlbiB3ZSBhcmUgdHJhbnNmb3JtZWQuXHJcbiAgICogVXN1YWxseSByb3RhdGlvbiBpcyBzaWduaWZpY2FudCBoZXJlLCBzbyB0aGF0IHRyYW5zZm9ybWVkIGJvdW5kcyBmb3Igbm9uLXJlY3Rhbmd1bGFyIHNoYXBlcyB3aWxsIGJlIGRpZmZlcmVudC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0VHJhbnNmb3JtZWRTZWxmQm91bmRzKCBtYXRyaXg6IE1hdHJpeDMgKTogQm91bmRzMiB7XHJcbiAgICAvLyBhc3N1bWUgdGhhdCB3ZSB0YWtlIHVwIHRoZSBlbnRpcmUgcmVjdGFuZ3VsYXIgYm91bmRzIGJ5IGRlZmF1bHRcclxuICAgIHJldHVybiB0aGlzLnNlbGZCb3VuZHMudHJhbnNmb3JtZWQoIG1hdHJpeCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWVhbnQgdG8gYmUgb3ZlcnJpZGRlbiBpbiBzdWItdHlwZXMgdGhhdCBoYXZlIG1vcmUgYWNjdXJhdGUgYm91bmRzIGRldGVybWluYXRpb24gZm9yIHdoZW4gd2UgYXJlIHRyYW5zZm9ybWVkLlxyXG4gICAqIFVzdWFsbHkgcm90YXRpb24gaXMgc2lnbmlmaWNhbnQgaGVyZSwgc28gdGhhdCB0cmFuc2Zvcm1lZCBib3VuZHMgZm9yIG5vbi1yZWN0YW5ndWxhciBzaGFwZXMgd2lsbCBiZSBkaWZmZXJlbnQuXHJcbiAgICpcclxuICAgKiBUaGlzIHNob3VsZCBpbmNsdWRlIHRoZSBcImZ1bGxcIiBib3VuZHMgdGhhdCBndWFyYW50ZWUgZXZlcnl0aGluZyByZW5kZXJlZCBzaG91bGQgYmUgaW5zaWRlIChlLmcuIFRleHQsIHdoZXJlIHRoZVxyXG4gICAqIG5vcm1hbCBib3VuZHMgbWF5IG5vdCBiZSBzdWZmaWNpZW50KS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0VHJhbnNmb3JtZWRTYWZlU2VsZkJvdW5kcyggbWF0cml4OiBNYXRyaXgzICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuc2FmZVNlbGZCb3VuZHMudHJhbnNmb3JtZWQoIG1hdHJpeCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgdmlzdWFsIFwic2FmZVwiIGJvdW5kcyB0aGF0IGFyZSB0YWtlbiB1cCBieSB0aGlzIE5vZGUgYW5kIGl0cyBzdWJ0cmVlLiBOb3RhYmx5LCB0aGlzIGlzIGVzc2VudGlhbGx5IHRoZVxyXG4gICAqIGNvbWJpbmVkIGVmZmVjdHMgb2YgdGhlIFwidmlzaWJsZVwiIGJvdW5kcyAoaS5lLiBpbnZpc2libGUgbm9kZXMgZG8gbm90IGNvbnRyaWJ1dGUgdG8gYm91bmRzKSwgYW5kIFwic2FmZVwiIGJvdW5kc1xyXG4gICAqIChlLmcuIFRleHQsIHdoZXJlIHdlIG5lZWQgYSBsYXJnZXIgYm91bmRzIGFyZWEgdG8gZ3VhcmFudGVlIHRoZXJlIGlzIG5vdGhpbmcgb3V0c2lkZSkuIEl0IGFsc28gdHJpZXMgdG8gXCJmaXRcIlxyXG4gICAqIHRyYW5zZm9ybWVkIGJvdW5kcyBtb3JlIHRpZ2h0bHksIHdoZXJlIGl0IHdpbGwgaGFuZGxlIHJvdGF0ZWQgUGF0aCBib3VuZHMgaW4gYW4gaW1wcm92ZWQgd2F5LlxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyBtZXRob2QgaXMgbm90IG9wdGltaXplZCwgYW5kIG1heSBjcmVhdGUgZ2FyYmFnZSBhbmQgbm90IGJlIHRoZSBmYXN0ZXN0LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIFttYXRyaXhdIC0gSWYgcHJvdmlkZWQsIHdpbGwgcmV0dXJuIHRoZSBib3VuZHMgYXNzdW1pbmcgdGhlIGNvbnRlbnQgaXMgdHJhbnNmb3JtZWQgd2l0aCB0aGVcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2l2ZW4gbWF0cml4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTYWZlVHJhbnNmb3JtZWRWaXNpYmxlQm91bmRzKCBtYXRyaXg/OiBNYXRyaXgzICk6IEJvdW5kczIge1xyXG4gICAgY29uc3QgbG9jYWxNYXRyaXggPSAoIG1hdHJpeCB8fCBNYXRyaXgzLklERU5USVRZICkudGltZXNNYXRyaXgoIHRoaXMubWF0cml4ICk7XHJcblxyXG4gICAgY29uc3QgYm91bmRzID0gQm91bmRzMi5OT1RISU5HLmNvcHkoKTtcclxuXHJcbiAgICBpZiAoIHRoaXMudmlzaWJsZVByb3BlcnR5LnZhbHVlICkge1xyXG4gICAgICBpZiAoICF0aGlzLnNlbGZCb3VuZHMuaXNFbXB0eSgpICkge1xyXG4gICAgICAgIGJvdW5kcy5pbmNsdWRlQm91bmRzKCB0aGlzLmdldFRyYW5zZm9ybWVkU2FmZVNlbGZCb3VuZHMoIGxvY2FsTWF0cml4ICkgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCB0aGlzLl9jaGlsZHJlbi5sZW5ndGggKSB7XHJcbiAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5fY2hpbGRyZW4ubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICBib3VuZHMuaW5jbHVkZUJvdW5kcyggdGhpcy5fY2hpbGRyZW5bIGkgXS5nZXRTYWZlVHJhbnNmb3JtZWRWaXNpYmxlQm91bmRzKCBsb2NhbE1hdHJpeCApICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGJvdW5kcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRTYWZlVHJhbnNmb3JtZWRWaXNpYmxlQm91bmRzKCkgZm9yIG1vcmUgaW5mb3JtYXRpb24gLS0gVGhpcyBpcyBjYWxsZWQgd2l0aG91dCBhbnkgaW5pdGlhbCBwYXJhbWV0ZXJcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHNhZmVUcmFuc2Zvcm1lZFZpc2libGVCb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRTYWZlVHJhbnNmb3JtZWRWaXNpYmxlQm91bmRzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBmbGFnIHRoYXQgZGV0ZXJtaW5lcyB3aGV0aGVyIHdlIHdpbGwgcmVxdWlyZSBtb3JlIGFjY3VyYXRlIChhbmQgZXhwZW5zaXZlKSBib3VuZHMgY29tcHV0YXRpb24gZm9yIHRoaXNcclxuICAgKiBub2RlJ3MgdHJhbnNmb3JtLlxyXG4gICAqXHJcbiAgICogSWYgc2V0IHRvIGZhbHNlIChkZWZhdWx0KSwgU2NlbmVyeSB3aWxsIGdldCB0aGUgYm91bmRzIG9mIGNvbnRlbnQsIGFuZCB0aGVuIGlmIHJvdGF0ZWQgd2lsbCBkZXRlcm1pbmUgdGhlIG9uLWF4aXNcclxuICAgKiBib3VuZHMgdGhhdCBjb21wbGV0ZWx5IGNvdmVyIHRoZSByb3RhdGVkIGJvdW5kcyAocG90ZW50aWFsbHkgbGFyZ2VyIHRoYW4gYWN0dWFsIGNvbnRlbnQpLlxyXG4gICAqIElmIHNldCB0byB0cnVlLCBTY2VuZXJ5IHdpbGwgdHJ5IHRvIGdldCB0aGUgYm91bmRzIG9mIHRoZSBhY3R1YWwgcm90YXRlZC90cmFuc2Zvcm1lZCBjb250ZW50LlxyXG4gICAqXHJcbiAgICogQSBnb29kIGV4YW1wbGUgb2Ygd2hlbiB0aGlzIGlzIG5lY2Vzc2FyeSBpcyBpZiB0aGVyZSBhcmUgYSBidW5jaCBvZiBuZXN0ZWQgY2hpbGRyZW4gdGhhdCBlYWNoIGhhdmUgcGkvNCByb3RhdGlvbnMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdHJhbnNmb3JtQm91bmRzIC0gV2hldGhlciBhY2N1cmF0ZSB0cmFuc2Zvcm0gYm91bmRzIHNob3VsZCBiZSB1c2VkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRUcmFuc2Zvcm1Cb3VuZHMoIHRyYW5zZm9ybUJvdW5kczogYm9vbGVhbiApOiB0aGlzIHtcclxuXHJcbiAgICBpZiAoIHRoaXMuX3RyYW5zZm9ybUJvdW5kcyAhPT0gdHJhbnNmb3JtQm91bmRzICkge1xyXG4gICAgICB0aGlzLl90cmFuc2Zvcm1Cb3VuZHMgPSB0cmFuc2Zvcm1Cb3VuZHM7XHJcblxyXG4gICAgICB0aGlzLmludmFsaWRhdGVCb3VuZHMoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpczsgLy8gYWxsb3cgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRUcmFuc2Zvcm1Cb3VuZHMoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgdHJhbnNmb3JtQm91bmRzKCB2YWx1ZTogYm9vbGVhbiApIHtcclxuICAgIHRoaXMuc2V0VHJhbnNmb3JtQm91bmRzKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFRyYW5zZm9ybUJvdW5kcygpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCB0cmFuc2Zvcm1Cb3VuZHMoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRUcmFuc2Zvcm1Cb3VuZHMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciBhY2N1cmF0ZSB0cmFuc2Zvcm1hdGlvbiBib3VuZHMgYXJlIHVzZWQgaW4gYm91bmRzIGNvbXB1dGF0aW9uIChzZWUgc2V0VHJhbnNmb3JtQm91bmRzKS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0VHJhbnNmb3JtQm91bmRzKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX3RyYW5zZm9ybUJvdW5kcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGJvdW5kaW5nIGJveCBvZiB0aGlzIE5vZGUgYW5kIGFsbCBvZiBpdHMgc3ViLXRyZWVzIChpbiB0aGUgXCJwYXJlbnRcIiBjb29yZGluYXRlIGZyYW1lKS5cclxuICAgKlxyXG4gICAqIE5PVEU6IERvIE5PVCBtdXRhdGUgdGhlIHJldHVybmVkIHZhbHVlIVxyXG4gICAqIE5PVEU6IFRoaXMgbWF5IHJlcXVpcmUgY29tcHV0YXRpb24gb2YgdGhpcyBub2RlJ3Mgc3VidHJlZSBib3VuZHMsIHdoaWNoIG1heSBpbmN1ciBzb21lIHBlcmZvcm1hbmNlIGxvc3MuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEJvdW5kcygpOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiB0aGlzLmJvdW5kc1Byb3BlcnR5LnZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldEJvdW5kcygpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBib3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRCb3VuZHMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIExpa2UgZ2V0TG9jYWxCb3VuZHMoKSBpbiB0aGUgXCJsb2NhbFwiIGNvb3JkaW5hdGUgZnJhbWUsIGJ1dCBpbmNsdWRlcyBvbmx5IHZpc2libGUgbm9kZXMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFZpc2libGVMb2NhbEJvdW5kcygpOiBCb3VuZHMyIHtcclxuICAgIC8vIGRlZmVuc2l2ZSBjb3B5LCBzaW5jZSB3ZSB1c2UgbXV0YWJsZSBtb2RpZmljYXRpb25zIGJlbG93XHJcbiAgICBjb25zdCBib3VuZHMgPSB0aGlzLnNlbGZCb3VuZHMuY29weSgpO1xyXG5cclxuICAgIGxldCBpID0gdGhpcy5fY2hpbGRyZW4ubGVuZ3RoO1xyXG4gICAgd2hpbGUgKCBpLS0gKSB7XHJcbiAgICAgIGJvdW5kcy5pbmNsdWRlQm91bmRzKCB0aGlzLl9jaGlsZHJlblsgaSBdLmdldFZpc2libGVCb3VuZHMoKSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGFwcGx5IGNsaXBwaW5nIHRvIHRoZSBib3VuZHMgaWYgd2UgaGF2ZSBhIGNsaXAgYXJlYSAoYWxsIGRvbmUgaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUpXHJcbiAgICBjb25zdCBjbGlwQXJlYSA9IHRoaXMuY2xpcEFyZWE7XHJcbiAgICBpZiAoIGNsaXBBcmVhICkge1xyXG4gICAgICBib3VuZHMuY29uc3RyYWluQm91bmRzKCBjbGlwQXJlYS5ib3VuZHMgKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBib3VuZHMuaXNGaW5pdGUoKSB8fCBib3VuZHMuaXNFbXB0eSgpLCAnVmlzaWJsZSBib3VuZHMgc2hvdWxkIG5vdCBiZSBpbmZpbml0ZScgKTtcclxuICAgIHJldHVybiBib3VuZHM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0VmlzaWJsZUxvY2FsQm91bmRzKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHZpc2libGVMb2NhbEJvdW5kcygpOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiB0aGlzLmdldFZpc2libGVMb2NhbEJvdW5kcygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTGlrZSBnZXRCb3VuZHMoKSBpbiB0aGUgXCJwYXJlbnRcIiBjb29yZGluYXRlIGZyYW1lLCBidXQgaW5jbHVkZXMgb25seSB2aXNpYmxlIG5vZGVzXHJcbiAgICovXHJcbiAgcHVibGljIGdldFZpc2libGVCb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICBpZiAoIHRoaXMuaXNWaXNpYmxlKCkgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmdldFZpc2libGVMb2NhbEJvdW5kcygpLnRyYW5zZm9ybSggdGhpcy5nZXRNYXRyaXgoKSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBCb3VuZHMyLk5PVEhJTkc7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0VmlzaWJsZUJvdW5kcygpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCB2aXNpYmxlQm91bmRzKCk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0VmlzaWJsZUJvdW5kcygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGVzdHMgd2hldGhlciB0aGUgZ2l2ZW4gcG9pbnQgaXMgXCJjb250YWluZWRcIiBpbiB0aGlzIG5vZGUncyBzdWJ0cmVlIChvcHRpb25hbGx5IHVzaW5nIG1vdXNlL3RvdWNoIGFyZWFzKSwgYW5kIGlmXHJcbiAgICogc28gcmV0dXJucyB0aGUgVHJhaWwgKHJvb3RlZCBhdCB0aGlzIG5vZGUpIHRvIHRoZSB0b3AtbW9zdCAoaW4gc3RhY2tpbmcgb3JkZXIpIE5vZGUgdGhhdCBjb250YWlucyB0aGUgZ2l2ZW5cclxuICAgKiBwb2ludC5cclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgaXMgb3B0aW1pemVkIGZvciB0aGUgY3VycmVudCBpbnB1dCBzeXN0ZW0gKHJhdGhlciB0aGFuIHdoYXQgZ2V0cyB2aXN1YWxseSBkaXNwbGF5ZWQgb24gdGhlIHNjcmVlbiksIHNvXHJcbiAgICogcGlja2FiaWxpdHkgKE5vZGUncyBwaWNrYWJsZSBwcm9wZXJ0eSwgdmlzaWJpbGl0eSwgYW5kIHRoZSBwcmVzZW5jZSBvZiBpbnB1dCBsaXN0ZW5lcnMpIGFsbCBtYXkgYWZmZWN0IHRoZVxyXG4gICAqIHJldHVybmVkIHZhbHVlLlxyXG4gICAqXHJcbiAgICogRm9yIGV4YW1wbGUsIGhpdC10ZXN0aW5nIGEgc2ltcGxlIHNoYXBlICh3aXRoIG5vIHBpY2thYmlsaXR5KSB3aWxsIHJldHVybiBudWxsOlxyXG4gICAqID4gbmV3IHBoZXQuc2NlbmVyeS5DaXJjbGUoIDIwICkuaGl0VGVzdCggcGhldC5kb3QudjIoIDAsIDAgKSApOyAvLyBudWxsXHJcbiAgICpcclxuICAgKiBJZiB0aGUgc2FtZSBzaGFwZSBpcyBtYWRlIHRvIGJlIHBpY2thYmxlLCBpdCB3aWxsIHJldHVybiBhIHRyYWlsOlxyXG4gICAqID4gbmV3IHBoZXQuc2NlbmVyeS5DaXJjbGUoIDIwLCB7IHBpY2thYmxlOiB0cnVlIH0gKS5oaXRUZXN0KCBwaGV0LmRvdC52MiggMCwgMCApICk7XHJcbiAgICogPiAvLyByZXR1cm5zIGEgVHJhaWwgd2l0aCB0aGUgY2lyY2xlIGFzIHRoZSBvbmx5IG5vZGUuXHJcbiAgICpcclxuICAgKiBJdCB3aWxsIHJldHVybiB0aGUgcmVzdWx0IHRoYXQgaXMgdmlzdWFsbHkgc3RhY2tlZCBvbiB0b3AsIHNvIGUuZy46XHJcbiAgICogPiBuZXcgcGhldC5zY2VuZXJ5Lk5vZGUoIHtcclxuICAgKiA+ICAgcGlja2FibGU6IHRydWUsXHJcbiAgICogPiAgIGNoaWxkcmVuOiBbXHJcbiAgICogPiAgICAgbmV3IHBoZXQuc2NlbmVyeS5DaXJjbGUoIDIwICksXHJcbiAgICogPiAgICAgbmV3IHBoZXQuc2NlbmVyeS5DaXJjbGUoIDE1IClcclxuICAgKiA+ICAgXVxyXG4gICAqID4gfSApLmhpdFRlc3QoIHBoZXQuZG90LnYyKCAwLCAwICkgKTsgLy8gcmV0dXJucyB0aGUgXCJ0b3AtbW9zdFwiIGNpcmNsZSAodGhlIG9uZSB3aXRoIHJhZGl1czoxNSkuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIHVzZWQgYnkgU2NlbmVyeSdzIGludGVybmFsIGlucHV0IHN5c3RlbSBieSBjYWxsaW5nIGhpdFRlc3Qgb24gYSBEaXNwbGF5J3Mgcm9vdE5vZGUgd2l0aCB0aGVcclxuICAgKiBnbG9iYWwtY29vcmRpbmF0ZSBwb2ludC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBwb2ludCAtIFRoZSBwb2ludCAoaW4gdGhlIHBhcmVudCBjb29yZGluYXRlIGZyYW1lKSB0byBjaGVjayBhZ2FpbnN0IHRoaXMgbm9kZSdzIHN1YnRyZWUuXHJcbiAgICogQHBhcmFtIFtpc01vdXNlXSAtIFdoZXRoZXIgbW91c2VBcmVhcyBzaG91bGQgYmUgdXNlZC5cclxuICAgKiBAcGFyYW0gW2lzVG91Y2hdIC0gV2hldGhlciB0b3VjaEFyZWFzIHNob3VsZCBiZSB1c2VkLlxyXG4gICAqIEByZXR1cm5zIC0gUmV0dXJucyBudWxsIGlmIHRoZSBwb2ludCBpcyBub3QgY29udGFpbmVkIGluIHRoZSBzdWJ0cmVlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBoaXRUZXN0KCBwb2ludDogVmVjdG9yMiwgaXNNb3VzZT86IGJvb2xlYW4sIGlzVG91Y2g/OiBib29sZWFuICk6IFRyYWlsIHwgbnVsbCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBwb2ludC5pc0Zpbml0ZSgpLCAnVGhlIHBvaW50IHNob3VsZCBiZSBhIGZpbml0ZSBWZWN0b3IyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNNb3VzZSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiBpc01vdXNlID09PSAnYm9vbGVhbicsXHJcbiAgICAgICdJZiBpc01vdXNlIGlzIHByb3ZpZGVkLCBpdCBzaG91bGQgYmUgYSBib29sZWFuJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNUb3VjaCA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiBpc1RvdWNoID09PSAnYm9vbGVhbicsXHJcbiAgICAgICdJZiBpc1RvdWNoIGlzIHByb3ZpZGVkLCBpdCBzaG91bGQgYmUgYSBib29sZWFuJyApO1xyXG5cclxuICAgIHJldHVybiB0aGlzLl9waWNrZXIuaGl0VGVzdCggcG9pbnQsICEhaXNNb3VzZSwgISFpc1RvdWNoICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIaXQtdGVzdHMgd2hhdCBpcyB1bmRlciB0aGUgcG9pbnRlciwgYW5kIHJldHVybnMgYSB7VHJhaWx9IHRvIHRoYXQgTm9kZSAob3IgbnVsbCBpZiB0aGVyZSBpcyBubyBtYXRjaGluZyBub2RlKS5cclxuICAgKlxyXG4gICAqIFNlZSBoaXRUZXN0KCkgZm9yIG1vcmUgZGV0YWlscyBhYm91dCB3aGF0IHdpbGwgYmUgcmV0dXJuZWQuXHJcbiAgICovXHJcbiAgcHVibGljIHRyYWlsVW5kZXJQb2ludGVyKCBwb2ludGVyOiBQb2ludGVyICk6IFRyYWlsIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gcG9pbnRlci5wb2ludCA9PT0gbnVsbCA/IG51bGwgOiB0aGlzLmhpdFRlc3QoIHBvaW50ZXIucG9pbnQsIHBvaW50ZXIgaW5zdGFuY2VvZiBNb3VzZSwgcG9pbnRlci5pc1RvdWNoTGlrZSgpICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgYSBwb2ludCAoaW4gcGFyZW50IGNvb3JkaW5hdGVzKSBpcyBjb250YWluZWQgaW4gdGhpcyBub2RlJ3Mgc3ViLXRyZWUuXHJcbiAgICpcclxuICAgKiBTZWUgaGl0VGVzdCgpIGZvciBtb3JlIGRldGFpbHMgYWJvdXQgd2hhdCB3aWxsIGJlIHJldHVybmVkLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgLSBXaGV0aGVyIHRoZSBwb2ludCBpcyBjb250YWluZWQuXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnRhaW5zUG9pbnQoIHBvaW50OiBWZWN0b3IyICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuaGl0VGVzdCggcG9pbnQgKSAhPT0gbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE92ZXJyaWRlIHRoaXMgZm9yIGNvbXB1dGF0aW9uIG9mIHdoZXRoZXIgYSBwb2ludCBpcyBpbnNpZGUgb3VyIHNlbGYgY29udGVudCAoZGVmYXVsdHMgdG8gc2VsZkJvdW5kcyBjaGVjaykuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcG9pbnQgLSBDb25zaWRlcmVkIHRvIGJlIGluIHRoZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnRhaW5zUG9pbnRTZWxmKCBwb2ludDogVmVjdG9yMiApOiBib29sZWFuIHtcclxuICAgIC8vIGlmIHNlbGYgYm91bmRzIGFyZSBub3QgbnVsbCBkZWZhdWx0IHRvIGNoZWNraW5nIHNlbGYgYm91bmRzXHJcbiAgICByZXR1cm4gdGhpcy5zZWxmQm91bmRzLmNvbnRhaW5zUG9pbnQoIHBvaW50ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhpcyBub2RlJ3Mgc2VsZkJvdW5kcyBpcyBpbnRlcnNlY3RlZCBieSB0aGUgc3BlY2lmaWVkIGJvdW5kcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBib3VuZHMgLSBCb3VuZHMgdG8gdGVzdCwgYXNzdW1lZCB0byBiZSBpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKi9cclxuICBwdWJsaWMgaW50ZXJzZWN0c0JvdW5kc1NlbGYoIGJvdW5kczogQm91bmRzMiApOiBib29sZWFuIHtcclxuICAgIC8vIGlmIHNlbGYgYm91bmRzIGFyZSBub3QgbnVsbCwgY2hpbGQgc2hvdWxkIG92ZXJyaWRlIHRoaXNcclxuICAgIHJldHVybiB0aGlzLnNlbGZCb3VuZHMuaW50ZXJzZWN0c0JvdW5kcyggYm91bmRzICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmUgaWYgdGhlIE5vZGUgaXMgYSBjYW5kaWRhdGUgZm9yIHBoZXQtaW8gYXV0b3NlbGVjdC5cclxuICAgKiAxLiBJbnZpc2libGUgdGhpbmdzIGNhbm5vdCBiZSBhdXRvc2VsZWN0ZWRcclxuICAgKiAyLiBUcmFuc2Zvcm0gdGhlIHBvaW50IGluIHRoZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lLCBzbyB3ZSBjYW4gdGVzdCBpdCB3aXRoIHRoZSBjbGlwQXJlYS9jaGlsZHJlblxyXG4gICAqIDMuIElmIG91ciBwb2ludCBpcyBvdXRzaWRlIHRoZSBsb2NhbC1jb29yZGluYXRlIGNsaXBwaW5nIGFyZWEsIHRoZXJlIHNob3VsZCBiZSBubyBoaXQuXHJcbiAgICogNC4gTm90ZSB0aGF0IG5vbi1waWNrYWJsZSBub2RlcyBjYW4gc3RpbGwgYmUgYXV0b3NlbGVjdGVkXHJcbiAgICovXHJcbiAgcHVibGljIGlzUGhldGlvTW91c2VIaXR0YWJsZSggcG9pbnQ6IFZlY3RvcjIgKTogYm9vbGVhbiB7XHJcblxyXG4gICAgLy8gdW5waWNrYWJsZSB0aGluZ3MgY2Fubm90IGJlIGF1dG9zZWxlY3RlZCB1bmxlc3MgdGhlcmUgYXJlIGRlc2NlbmRhbnRzIHRoYXQgY291bGQgYmUgcG90ZW50aWFsIG1vdXNlIGhpdHMuXHJcbiAgICAvLyBJdCBpcyBpbXBvcnRhbnQgdG8gb3B0IG91dCBvZiB0aGVzZSBzdWJ0cmVlcyB0byBtYWtlIHN1cmUgdGhhdCB0aGV5IGRvbid0IGZhbHNlbHkgXCJzdWNrIHVwXCIgYSBtb3VzZSBoaXQgdGhhdFxyXG4gICAgLy8gd291bGQgb3RoZXJ3aXNlIGdvIHRvIGEgdGFyZ2V0IGJlaGluZCB0aGUgdW5waWNrYWJsZSBOb2RlLlxyXG4gICAgaWYgKCB0aGlzLnBpY2thYmxlID09PSBmYWxzZSAmJiAhdGhpcy5pc0FueURlc2NlbmRhbnRBUGhldGlvTW91c2VIaXRUYXJnZXQoKSApIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzLnZpc2libGUgJiZcclxuICAgICAgICAgICAoIHRoaXMuY2xpcEFyZWEgPT09IG51bGwgfHwgdGhpcy5jbGlwQXJlYS5jb250YWluc1BvaW50KCB0aGlzLl90cmFuc2Zvcm0uZ2V0SW52ZXJzZSgpLnRpbWVzVmVjdG9yMiggcG9pbnQgKSApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJZiB5b3UgbmVlZCB0byBrbm93IGlmIGFueSBOb2RlIGluIGEgc3VidHJlZSBjb3VsZCBwb3NzaWJseSBiZSBhIHBoZXRpbyBtb3VzZSBoaXQgdGFyZ2V0LlxyXG4gICAqIFNSIGFuZCBNSyByYW4gcGVyZm9ybWFuY2Ugb24gdGhpcyBmdW5jdGlvbiBpbiBDQ0s6REMgYW5kIENBViBpbiA2LzIwMjMgYW5kIHRoZXJlIHdhcyBubyBub3RpY2VhYmxlIHByb2JsZW0uXHJcbiAgICovXHJcbiAgcHVibGljIGlzQW55RGVzY2VuZGFudEFQaGV0aW9Nb3VzZUhpdFRhcmdldCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmdldFBoZXRpb01vdXNlSGl0VGFyZ2V0KCkgIT09ICdwaGV0aW9Ob3RTZWxlY3RhYmxlJyB8fFxyXG4gICAgICAgICAgIF8uc29tZSggdGhpcy5jaGlsZHJlbiwgY2hpbGQgPT4gY2hpbGQuaXNBbnlEZXNjZW5kYW50QVBoZXRpb01vdXNlSGl0VGFyZ2V0KCkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVzZWQgaW4gU3R1ZGlvIEF1dG9zZWxlY3QuICBSZXR1cm5zIGEgUGhFVC1pTyBFbGVtZW50IChhIFBoZXRpb09iamVjdCkgaWYgcG9zc2libGUsIG9yIG51bGwgaWYgbm8gaGl0LlxyXG4gICAqIFwicGhldGlvTm90U2VsZWN0YWJsZVwiIGlzIGFuIGludGVybWVkaWF0ZSBzdGF0ZSB1c2VkIHRvIG5vdGUgd2hlbiBhIFwiaGl0XCIgaGFzIG9jY3VycmVkLCBidXQgdGhlIGhpdCB3YXMgb24gYSBOb2RlXHJcbiAgICogdGhhdCBkaWRuJ3QgaGF2ZSBhIGZpdCB0YXJnZXQgKHNlZSBQaGV0aW9PYmplY3QuZ2V0UGhldGlvTW91c2VIaXRUYXJnZXQoKSlcclxuICAgKiBBIGZldyBub3RlcyBvbiB0aGUgaW1wbGVtZW50YXRpb246XHJcbiAgICogMS4gUHJlZmVyIHRoZSBsZWFmIG1vc3QgTm9kZSB0aGF0IGlzIGF0IHRoZSBoaWdoZXN0IHotaW5kZXggaW4gcmVuZGVyaW5nIG9yZGVyXHJcbiAgICogMi4gUGlja2FibGU6ZmFsc2UgTm9kZXMgZG9uJ3QgcHJ1bmUgb3V0IHN1YnRyZWVzIGlmIGRlc2NlbmRlbnRzIGNvdWxkIHN0aWxsIGJlIG1vdXNlIGhpdCB0YXJnZXRzXHJcbiAgICogICAgKHNlZSBQaGV0aW9PYmplY3QuZ2V0UGhldGlvTW91c2VIaXRUYXJnZXQoKSkuXHJcbiAgICogMy4gRmlyc3QgdGhlIGFsZ29yaXRobSBmaW5kcyBhIE5vZGUgdGhhdCBpcyBhIFwiaGl0XCIsIGFuZCB0aGVuIGl0IHRyaWVzIHRvIGZpbmQgdGhlIG1vc3QgZml0IFwidGFyZ2V0XCIgZm9yIHRoYXQgaGl0LlxyXG4gICAqICAgIGEuIEl0c2VsZiwgc2VlICBQaGV0aW9PYmplY3QuZ2V0UGhldGlvTW91c2VIaXRUYXJnZXQoKVxyXG4gICAqICAgIGIuIEEgY2xhc3MgZGVmaW5lZCBzdWJzdGl0dXRlLCBUZXh0LmdldFBoZXRpb01vdXNlSGl0VGFyZ2V0KClcclxuICAgKiAgICBjLiBBIHNpYmxpbmcgdGhhdCBpcyByZW5kZXJlZCBiZWhpbmQgdGhlIGhpdFxyXG4gICAqICAgIGQuIFRoZSBtb3N0IHJlY2VudCBkZXNjZW5kYW50IHRoYXQgaXMgYSB1c2FibGUgdGFyZ2V0LlxyXG4gICAqXHJcbiAgICogQWRhcHRlZCBvcmlnaW5hbGx5IGZyb20gUGlja2VyLnJlY3Vyc2l2ZUhpdFRlc3QsIHdpdGggc3BlY2lmaWMgdHdlYWtzIG5lZWRlZCBmb3IgUGhFVC1pTyBpbnN0cnVtZW50YXRpb24sIGRpc3BsYXlcclxuICAgKiBhbmQgZmlsdGVyaW5nLlxyXG4gICAqIEByZXR1cm5zIC0gbnVsbCBpZiBubyBoaXQgb2NjdXJyZWRcclxuICAgKiAgICAgICAgICAtIEEgUGhldGlvT2JqZWN0IGlmIGEgaGl0IG9jY3VycmVkIG9uIGEgTm9kZSB3aXRoIGEgc2VsZWN0YWJsZSB0YXJnZXRcclxuICAgKiAgICAgICAgICAtICdwaGV0aW9Ob3RTZWxlY3RhYmxlJyBpZiBhIGhpdCBvY2N1cnJlZCwgYnV0IG5vIHN1aXRhYmxlIHRhcmdldCB3YXMgZm91bmQgZnJvbSB0aGF0IGhpdCAoc2VlXHJcbiAgICogICAgICAgICAgICAgUGhldGlvT2JqZWN0LmdldFBoZXRpb01vdXNlSGl0VGFyZ2V0KCkpXHJcbiAgICovXHJcbiAgcHVibGljIGdldFBoZXRpb01vdXNlSGl0KCBwb2ludDogVmVjdG9yMiApOiBQaGV0aW9PYmplY3QgfCBudWxsIHwgJ3BoZXRpb05vdFNlbGVjdGFibGUnIHtcclxuXHJcbiAgICBpZiAoICF0aGlzLmlzUGhldGlvTW91c2VIaXR0YWJsZSggcG9pbnQgKSApIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVHJhbnNmb3JtIHRoZSBwb2ludCBpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSwgc28gd2UgY2FuIHRlc3QgaXQgd2l0aCB0aGUgY2xpcEFyZWEvY2hpbGRyZW5cclxuICAgIGNvbnN0IGxvY2FsUG9pbnQgPSB0aGlzLl90cmFuc2Zvcm0uZ2V0SW52ZXJzZSgpLnRpbWVzVmVjdG9yMiggcG9pbnQgKTtcclxuXHJcbiAgICAvLyBJZiBhbnkgY2hpbGQgd2FzIGhpdCBidXQgcmV0dXJuZWQgJ3BoZXRpb05vdFNlbGVjdGFibGUnLCB0aGVuIHRoYXQgd2lsbCB0cmlnZ2VyIHRoZSBcImZpbmQgdGhlIGJlc3QgdGFyZ2V0XCIgcG9ydGlvblxyXG4gICAgLy8gb2YgdGhlIGFsZ29yaXRobSwgbW92aW5nIG9uIGZyb20gdGhlIFwiZmluZCB0aGUgaGl0IE5vZGVcIiBwYXJ0LlxyXG4gICAgbGV0IGNoaWxkSGl0V2l0aG91dFRhcmdldCA9IG51bGw7XHJcblxyXG4gICAgLy8gQ2hlY2sgY2hpbGRyZW4gYmVmb3JlIG91ciBcInNlbGZcIiwgc2luY2UgdGhlIGNoaWxkcmVuIGFyZSByZW5kZXJlZCBvbiB0b3AuXHJcbiAgICAvLyBNYW51YWwgaXRlcmF0aW9uIGhlcmUgc28gd2UgY2FuIHJldHVybiBkaXJlY3RseSwgYW5kIHNvIHdlIGNhbiBpdGVyYXRlIGJhY2t3YXJkcyAobGFzdCBub2RlIGlzIHJlbmRlcmVkIGluIGZyb250KS5cclxuICAgIGZvciAoIGxldCBpID0gdGhpcy5fY2hpbGRyZW4ubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0gKSB7XHJcblxyXG4gICAgICAvLyBOb3QgbmVjZXNzYXJpbHkgYSBjaGlsZCBvZiB0aGlzIE5vZGUgKHNlZSBnZXRQaGV0aW9Nb3VzZUhpdFRhcmdldCgpKVxyXG4gICAgICBjb25zdCBjaGlsZFRhcmdldEhpdCA9IHRoaXMuX2NoaWxkcmVuWyBpIF0uZ2V0UGhldGlvTW91c2VIaXQoIGxvY2FsUG9pbnQgKTtcclxuXHJcbiAgICAgIGlmICggY2hpbGRUYXJnZXRIaXQgaW5zdGFuY2VvZiBQaGV0aW9PYmplY3QgKSB7XHJcbiAgICAgICAgcmV0dXJuIGNoaWxkVGFyZ2V0SGl0O1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCBjaGlsZFRhcmdldEhpdCA9PT0gJ3BoZXRpb05vdFNlbGVjdGFibGUnICkge1xyXG4gICAgICAgIGNoaWxkSGl0V2l0aG91dFRhcmdldCA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgLy8gTm8gaGl0LCBzbyBrZWVwIGl0ZXJhdGluZyB0byBuZXh0IGNoaWxkXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBjaGlsZEhpdFdpdGhvdXRUYXJnZXQgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmdldFBoZXRpb01vdXNlSGl0VGFyZ2V0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVGVzdHMgZm9yIG1vdXNlIGhpdCBhcmVhcyBiZWZvcmUgdGVzdGluZyBjb250YWluc1BvaW50U2VsZi4gSWYgdGhlcmUgaXMgYSBtb3VzZUFyZWEsIHRoZW4gZG9uJ3QgZXZlciBjaGVjayBzZWxmQm91bmRzLlxyXG4gICAgaWYgKCB0aGlzLl9tb3VzZUFyZWEgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9tb3VzZUFyZWEuY29udGFpbnNQb2ludCggbG9jYWxQb2ludCApID8gdGhpcy5nZXRQaGV0aW9Nb3VzZUhpdFRhcmdldCgpIDogbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEaWRuJ3QgaGl0IG91ciBjaGlsZHJlbiwgc28gY2hlY2sgb3Vyc2VsdmVzIGFzIGEgbGFzdCByZXNvcnQuIENoZWNrIG91ciBzZWxmQm91bmRzIGZpcnN0LCBzbyB3ZSBjYW4gcG90ZW50aWFsbHlcclxuICAgIC8vIGF2b2lkIGhpdC10ZXN0aW5nIHRoZSBhY3R1YWwgb2JqZWN0ICh3aGljaCBtYXkgYmUgbW9yZSBleHBlbnNpdmUpLlxyXG4gICAgaWYgKCB0aGlzLnNlbGZCb3VuZHMuY29udGFpbnNQb2ludCggbG9jYWxQb2ludCApICYmIHRoaXMuY29udGFpbnNQb2ludFNlbGYoIGxvY2FsUG9pbnQgKSApIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZ2V0UGhldGlvTW91c2VIaXRUYXJnZXQoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBObyBoaXRcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV2hldGhlciB0aGlzIE5vZGUgaXRzZWxmIGlzIHBhaW50ZWQgKGRpc3BsYXlzIHNvbWV0aGluZyBpdHNlbGYpLiBNZWFudCB0byBiZSBvdmVycmlkZGVuLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc1BhaW50ZWQoKTogYm9vbGVhbiB7XHJcbiAgICAvLyBOb3JtYWwgbm9kZXMgZG9uJ3QgcmVuZGVyIGFueXRoaW5nXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGV0aGVyIHRoaXMgTm9kZSdzIHNlbGZCb3VuZHMgYXJlIGNvbnNpZGVyZWQgdG8gYmUgdmFsaWQgKGFsd2F5cyBjb250YWluaW5nIHRoZSBkaXNwbGF5ZWQgc2VsZiBjb250ZW50XHJcbiAgICogb2YgdGhpcyBub2RlKS4gTWVhbnQgdG8gYmUgb3ZlcnJpZGRlbiBpbiBzdWJ0eXBlcyB3aGVuIHRoaXMgY2FuIGNoYW5nZSAoZS5nLiBUZXh0KS5cclxuICAgKlxyXG4gICAqIElmIHRoaXMgdmFsdWUgd291bGQgcG90ZW50aWFsbHkgY2hhbmdlLCBwbGVhc2UgdHJpZ2dlciB0aGUgZXZlbnQgJ3NlbGZCb3VuZHNWYWxpZCcuXHJcbiAgICovXHJcbiAgcHVibGljIGFyZVNlbGZCb3VuZHNWYWxpZCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoaXMgTm9kZSBoYXMgYW55IHBhcmVudHMgYXQgYWxsLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBoYXNQYXJlbnQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5fcGFyZW50cy5sZW5ndGggIT09IDA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhpcyBOb2RlIGhhcyBhbnkgY2hpbGRyZW4gYXQgYWxsLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBoYXNDaGlsZHJlbigpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl9jaGlsZHJlbi5sZW5ndGggPiAwO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIGEgY2hpbGQgc2hvdWxkIGJlIGluY2x1ZGVkIGZvciBsYXlvdXQgKGlmIHRoaXMgTm9kZSBpcyBhIGxheW91dCBjb250YWluZXIpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc0NoaWxkSW5jbHVkZWRJbkxheW91dCggY2hpbGQ6IE5vZGUgKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gY2hpbGQuYm91bmRzLmlzVmFsaWQoKSAmJiAoICF0aGlzLl9leGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzIHx8IGNoaWxkLnZpc2libGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIHRoZSBjYWxsYmFjayBvbiBub2RlcyByZWN1cnNpdmVseSBpbiBhIGRlcHRoLWZpcnN0IG1hbm5lci5cclxuICAgKi9cclxuICBwdWJsaWMgd2Fsa0RlcHRoRmlyc3QoIGNhbGxiYWNrOiAoIG5vZGU6IE5vZGUgKSA9PiB2b2lkICk6IHZvaWQge1xyXG4gICAgY2FsbGJhY2soIHRoaXMgKTtcclxuICAgIGNvbnN0IGxlbmd0aCA9IHRoaXMuX2NoaWxkcmVuLmxlbmd0aDtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrICkge1xyXG4gICAgICB0aGlzLl9jaGlsZHJlblsgaSBdLndhbGtEZXB0aEZpcnN0KCBjYWxsYmFjayApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhbiBpbnB1dCBsaXN0ZW5lci5cclxuICAgKlxyXG4gICAqIFNlZSBJbnB1dC5qcyBkb2N1bWVudGF0aW9uIGZvciBpbmZvcm1hdGlvbiBhYm91dCBob3cgZXZlbnQgbGlzdGVuZXJzIGFyZSB1c2VkLlxyXG4gICAqXHJcbiAgICogQWRkaXRpb25hbGx5LCB0aGUgZm9sbG93aW5nIGZpZWxkcyBhcmUgc3VwcG9ydGVkIG9uIGEgbGlzdGVuZXI6XHJcbiAgICpcclxuICAgKiAtIGludGVycnVwdCB7ZnVuY3Rpb24oKX06IFdoZW4gYSBwb2ludGVyIGlzIGludGVycnVwdGVkLCBpdCB3aWxsIGF0dGVtcHQgdG8gY2FsbCB0aGlzIG1ldGhvZCBvbiB0aGUgaW5wdXQgbGlzdGVuZXJcclxuICAgKiAtIGN1cnNvciB7c3RyaW5nfG51bGx9OiBJZiBub2RlLmN1cnNvciBpcyBudWxsLCBhbnkgbm9uLW51bGwgY3Vyc29yIG9mIGFuIGlucHV0IGxpc3RlbmVyIHdpbGwgZWZmZWN0aXZlbHlcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICBcIm92ZXJyaWRlXCIgaXQuIE5PVEU6IHRoaXMgY2FuIGJlIGltcGxlbWVudGVkIGFzIGFuIGVzNSBnZXR0ZXIsIGlmIHRoZSBjdXJzb3IgY2FuIGNoYW5nZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGRJbnB1dExpc3RlbmVyKCBsaXN0ZW5lcjogVElucHV0TGlzdGVuZXIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhXy5pbmNsdWRlcyggdGhpcy5faW5wdXRMaXN0ZW5lcnMsIGxpc3RlbmVyICksICdJbnB1dCBsaXN0ZW5lciBhbHJlYWR5IHJlZ2lzdGVyZWQgb24gdGhpcyBOb2RlJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbGlzdGVuZXIgIT09IG51bGwsICdJbnB1dCBsaXN0ZW5lciBjYW5ub3QgYmUgbnVsbCcgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGxpc3RlbmVyICE9PSB1bmRlZmluZWQsICdJbnB1dCBsaXN0ZW5lciBjYW5ub3QgYmUgdW5kZWZpbmVkJyApO1xyXG5cclxuICAgIC8vIGRvbid0IGFsbG93IGxpc3RlbmVycyB0byBiZSBhZGRlZCBtdWx0aXBsZSB0aW1lc1xyXG4gICAgaWYgKCAhXy5pbmNsdWRlcyggdGhpcy5faW5wdXRMaXN0ZW5lcnMsIGxpc3RlbmVyICkgKSB7XHJcbiAgICAgIHRoaXMuX2lucHV0TGlzdGVuZXJzLnB1c2goIGxpc3RlbmVyICk7XHJcbiAgICAgIHRoaXMuX3BpY2tlci5vbkFkZElucHV0TGlzdGVuZXIoKTtcclxuICAgICAgaWYgKCBhc3NlcnRTbG93ICkgeyB0aGlzLl9waWNrZXIuYXVkaXQoKTsgfVxyXG5cclxuICAgICAgLy8gSWYgdGhlIGxpc3RlbmVyIGNvbnRhaW5zIGhvdGtleXMsIGFjdGl2ZSBob3RrZXlzIG1heSBuZWVkIHRvIGJlIHVwZGF0ZWQuIFRoZXJlIGlzIG5vIGV2ZW50XHJcbiAgICAgIC8vIGZvciBjaGFuZ2luZyBpbnB1dCBsaXN0ZW5lcnMuIFNlZSBob3RrZXlNYW5hZ2VyIGZvciBtb3JlIGluZm9ybWF0aW9uLlxyXG4gICAgICBpZiAoIGxpc3RlbmVyLmhvdGtleXMgKSB7XHJcbiAgICAgICAgaG90a2V5TWFuYWdlci51cGRhdGVIb3RrZXlzRnJvbUlucHV0TGlzdGVuZXJDaGFuZ2UoIHRoaXMgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmVzIGFuIGlucHV0IGxpc3RlbmVyIHRoYXQgd2FzIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBhZGRJbnB1dExpc3RlbmVyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyByZW1vdmVJbnB1dExpc3RlbmVyKCBsaXN0ZW5lcjogVElucHV0TGlzdGVuZXIgKTogdGhpcyB7XHJcbiAgICBjb25zdCBpbmRleCA9IF8uaW5kZXhPZiggdGhpcy5faW5wdXRMaXN0ZW5lcnMsIGxpc3RlbmVyICk7XHJcblxyXG4gICAgLy8gZW5zdXJlIHRoZSBsaXN0ZW5lciBpcyBpbiBvdXIgbGlzdCAoaWdub3JlIGFzc2VydGlvbiBmb3IgZGlzcG9zYWwsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc3VuL2lzc3Vlcy8zOTQpXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmlzRGlzcG9zZWQgfHwgaW5kZXggPj0gMCwgJ0NvdWxkIG5vdCBmaW5kIGlucHV0IGxpc3RlbmVyIHRvIHJlbW92ZScgKTtcclxuICAgIGlmICggaW5kZXggPj0gMCApIHtcclxuICAgICAgdGhpcy5faW5wdXRMaXN0ZW5lcnMuc3BsaWNlKCBpbmRleCwgMSApO1xyXG4gICAgICB0aGlzLl9waWNrZXIub25SZW1vdmVJbnB1dExpc3RlbmVyKCk7XHJcbiAgICAgIGlmICggYXNzZXJ0U2xvdyApIHsgdGhpcy5fcGlja2VyLmF1ZGl0KCk7IH1cclxuXHJcbiAgICAgIC8vIElmIHRoZSBsaXN0ZW5lciBjb250YWlucyBob3RrZXlzLCBhY3RpdmUgaG90a2V5cyBtYXkgbmVlZCB0byBiZSB1cGRhdGVkLiBUaGVyZSBpcyBubyBldmVudFxyXG4gICAgICAvLyBmb3IgY2hhbmdpbmcgaW5wdXQgbGlzdGVuZXJzLiBTZWUgaG90a2V5TWFuYWdlciBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cclxuICAgICAgaWYgKCBsaXN0ZW5lci5ob3RrZXlzICkge1xyXG4gICAgICAgIGhvdGtleU1hbmFnZXIudXBkYXRlSG90a2V5c0Zyb21JbnB1dExpc3RlbmVyQ2hhbmdlKCB0aGlzICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciB0aGlzIGlucHV0IGxpc3RlbmVyIGlzIGN1cnJlbnRseSBsaXN0ZW5pbmcgdG8gdGhpcyBub2RlLlxyXG4gICAqXHJcbiAgICogTW9yZSBlZmZpY2llbnQgdGhhbiBjaGVja2luZyBub2RlLmlucHV0TGlzdGVuZXJzLCBhcyB0aGF0IGluY2x1ZGVzIGEgZGVmZW5zaXZlIGNvcHkuXHJcbiAgICovXHJcbiAgcHVibGljIGhhc0lucHV0TGlzdGVuZXIoIGxpc3RlbmVyOiBUSW5wdXRMaXN0ZW5lciApOiBib29sZWFuIHtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuX2lucHV0TGlzdGVuZXJzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBpZiAoIHRoaXMuX2lucHV0TGlzdGVuZXJzWyBpIF0gPT09IGxpc3RlbmVyICkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbnRlcnJ1cHRzIGFsbCBpbnB1dCBsaXN0ZW5lcnMgdGhhdCBhcmUgYXR0YWNoZWQgdG8gdGhpcyBub2RlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbnRlcnJ1cHRJbnB1dCgpOiB0aGlzIHtcclxuICAgIGNvbnN0IGxpc3RlbmVyc0NvcHkgPSB0aGlzLmlucHV0TGlzdGVuZXJzO1xyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGxpc3RlbmVyc0NvcHkubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGxpc3RlbmVyID0gbGlzdGVuZXJzQ29weVsgaSBdO1xyXG5cclxuICAgICAgbGlzdGVuZXIuaW50ZXJydXB0ICYmIGxpc3RlbmVyLmludGVycnVwdCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW50ZXJydXB0cyBhbGwgaW5wdXQgbGlzdGVuZXJzIHRoYXQgYXJlIGF0dGFjaGVkIHRvIGVpdGhlciB0aGlzIG5vZGUsIG9yIGEgZGVzY2VuZGFudCBub2RlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbnRlcnJ1cHRTdWJ0cmVlSW5wdXQoKTogdGhpcyB7XHJcbiAgICB0aGlzLmludGVycnVwdElucHV0KCk7XHJcblxyXG4gICAgY29uc3QgY2hpbGRyZW4gPSB0aGlzLl9jaGlsZHJlbi5zbGljZSgpO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNoaWxkcmVuWyBpIF0uaW50ZXJydXB0U3VidHJlZUlucHV0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDaGFuZ2VzIHRoZSB0cmFuc2Zvcm0gb2YgdGhpcyBOb2RlIGJ5IGFkZGluZyBhIHRyYW5zZm9ybS4gVGhlIGRlZmF1bHQgXCJhcHBlbmRzXCIgdGhlIHRyYW5zZm9ybSwgc28gdGhhdCBpdCB3aWxsXHJcbiAgICogYXBwZWFyIHRvIGhhcHBlbiB0byB0aGUgTm9kZSBiZWZvcmUgdGhlIHJlc3Qgb2YgdGhlIHRyYW5zZm9ybSB3b3VsZCBhcHBseSwgYnV0IGlmIFwicHJlcGVuZGVkXCIsIHRoZSByZXN0IG9mIHRoZVxyXG4gICAqIHRyYW5zZm9ybSB3b3VsZCBhcHBseSBmaXJzdC5cclxuICAgKlxyXG4gICAqIEFzIGFuIGV4YW1wbGUsIGlmIGEgTm9kZSBpcyBjZW50ZXJlZCBhdCAoMCwwKSBhbmQgc2NhbGVkIGJ5IDI6XHJcbiAgICogdHJhbnNsYXRlKCAxMDAsIDAgKSB3b3VsZCBjYXVzZSB0aGUgY2VudGVyIG9mIHRoZSBOb2RlIChpbiB0aGUgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUpIHRvIGJlIGF0ICgyMDAsMCkuXHJcbiAgICogdHJhbnNsYXRlKCAxMDAsIDAsIHRydWUgKSB3b3VsZCBjYXVzZSB0aGUgY2VudGVyIG9mIHRoZSBOb2RlIChpbiB0aGUgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUpIHRvIGJlIGF0ICgxMDAsMCkuXHJcbiAgICpcclxuICAgKiBBbGxvd2VkIGNhbGwgc2lnbmF0dXJlczpcclxuICAgKiB0cmFuc2xhdGUoIHgge251bWJlcn0sIHkge251bWJlcn0gKVxyXG4gICAqIHRyYW5zbGF0ZSggeCB7bnVtYmVyfSwgeSB7bnVtYmVyfSwgcHJlcGVuZEluc3RlYWQge2Jvb2xlYW59IClcclxuICAgKiB0cmFuc2xhdGUoIHZlY3RvciB7VmVjdG9yMn0gKVxyXG4gICAqIHRyYW5zbGF0ZSggdmVjdG9yIHtWZWN0b3IyfSwgcHJlcGVuZEluc3RlYWQge2Jvb2xlYW59IClcclxuICAgKlxyXG4gICAqIEBwYXJhbSB4IC0gVGhlIHggY29vcmRpbmF0ZVxyXG4gICAqIEBwYXJhbSB5IC0gVGhlIHkgY29vcmRpbmF0ZVxyXG4gICAqIEBwYXJhbSBbcHJlcGVuZEluc3RlYWRdIC0gV2hldGhlciB0aGUgdHJhbnNmb3JtIHNob3VsZCBiZSBwcmVwZW5kZWQgKGRlZmF1bHRzIHRvIGZhbHNlKVxyXG4gICAqL1xyXG4gIHB1YmxpYyB0cmFuc2xhdGUoIHY6IFZlY3RvcjIsIHByZXBlbmRJbnN0ZWFkPzogYm9vbGVhbiApOiB2b2lkO1xyXG4gIHRyYW5zbGF0ZSggeDogbnVtYmVyLCB5OiBudW1iZXIsIHByZXBlbmRJbnN0ZWFkPzogYm9vbGVhbiApOiB2b2lkOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9leHBsaWNpdC1tZW1iZXItYWNjZXNzaWJpbGl0eVxyXG4gIHRyYW5zbGF0ZSggeDogbnVtYmVyIHwgVmVjdG9yMiwgeT86IG51bWJlciB8IGJvb2xlYW4sIHByZXBlbmRJbnN0ZWFkPzogYm9vbGVhbiApOiB2b2lkIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbWVtYmVyLWFjY2Vzc2liaWxpdHlcclxuICAgIGlmICggdHlwZW9mIHggPT09ICdudW1iZXInICkge1xyXG4gICAgICAvLyB0cmFuc2xhdGUoIHgsIHksIHByZXBlbmRJbnN0ZWFkIClcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHggKSwgJ3ggc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcicgKTtcclxuXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiB5ID09PSAnbnVtYmVyJyAmJiBpc0Zpbml0ZSggeSApLCAneSBzaG91bGQgYmUgYSBmaW5pdGUgbnVtYmVyJyApO1xyXG5cclxuICAgICAgaWYgKCBNYXRoLmFicyggeCApIDwgMWUtMTIgJiYgTWF0aC5hYnMoIHkgYXMgbnVtYmVyICkgPCAxZS0xMiApIHsgcmV0dXJuOyB9IC8vIGJhaWwgb3V0IGlmIGJvdGggYXJlIHplcm9cclxuICAgICAgaWYgKCBwcmVwZW5kSW5zdGVhZCApIHtcclxuICAgICAgICB0aGlzLnByZXBlbmRUcmFuc2xhdGlvbiggeCwgeSBhcyBudW1iZXIgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB0aGlzLmFwcGVuZE1hdHJpeCggc2NyYXRjaE1hdHJpeDMuc2V0VG9UcmFuc2xhdGlvbiggeCwgeSBhcyBudW1iZXIgKSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgLy8gdHJhbnNsYXRlKCB2ZWN0b3IsIHByZXBlbmRJbnN0ZWFkIClcclxuICAgICAgY29uc3QgdmVjdG9yID0geDtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdmVjdG9yLmlzRmluaXRlKCksICd0cmFuc2xhdGlvbiBzaG91bGQgYmUgYSBmaW5pdGUgVmVjdG9yMiBpZiBub3QgZmluaXRlIG51bWJlcnMnICk7XHJcbiAgICAgIGlmICggIXZlY3Rvci54ICYmICF2ZWN0b3IueSApIHsgcmV0dXJuOyB9IC8vIGJhaWwgb3V0IGlmIGJvdGggYXJlIHplcm9cclxuICAgICAgdGhpcy50cmFuc2xhdGUoIHZlY3Rvci54LCB2ZWN0b3IueSwgeSBhcyBib29sZWFuICk7IC8vIGZvcndhcmQgdG8gZnVsbCB2ZXJzaW9uXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTY2FsZXMgdGhlIG5vZGUncyB0cmFuc2Zvcm0uIFRoZSBkZWZhdWx0IFwiYXBwZW5kc1wiIHRoZSB0cmFuc2Zvcm0sIHNvIHRoYXQgaXQgd2lsbFxyXG4gICAqIGFwcGVhciB0byBoYXBwZW4gdG8gdGhlIE5vZGUgYmVmb3JlIHRoZSByZXN0IG9mIHRoZSB0cmFuc2Zvcm0gd291bGQgYXBwbHksIGJ1dCBpZiBcInByZXBlbmRlZFwiLCB0aGUgcmVzdCBvZiB0aGVcclxuICAgKiB0cmFuc2Zvcm0gd291bGQgYXBwbHkgZmlyc3QuXHJcbiAgICpcclxuICAgKiBBcyBhbiBleGFtcGxlLCBpZiBhIE5vZGUgaXMgdHJhbnNsYXRlZCB0byAoMTAwLDApOlxyXG4gICAqIHNjYWxlKCAyICkgd2lsbCBsZWF2ZSB0aGUgTm9kZSB0cmFuc2xhdGVkIGF0ICgxMDAsMCksIGJ1dCBpdCB3aWxsIGJlIHR3aWNlIGFzIGJpZyBhcm91bmQgaXRzIG9yaWdpbiBhdCB0aGF0IGxvY2F0aW9uLlxyXG4gICAqIHNjYWxlKCAyLCB0cnVlICkgd2lsbCBzaGlmdCB0aGUgTm9kZSB0byAoMjAwLDApLlxyXG4gICAqXHJcbiAgICogQWxsb3dlZCBjYWxsIHNpZ25hdHVyZXM6XHJcbiAgICogKHMgaW52b2NhdGlvbik6IHNjYWxlKCBzIHtudW1iZXJ8VmVjdG9yMn0sIFtwcmVwZW5kSW5zdGVhZF0ge2Jvb2xlYW59IClcclxuICAgKiAoeCx5IGludm9jYXRpb24pOiBzY2FsZSggeCB7bnVtYmVyfSwgeSB7bnVtYmVyfSwgW3ByZXBlbmRJbnN0ZWFkXSB7Ym9vbGVhbn0gKVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHggLSAocyBpbnZvY2F0aW9uKToge251bWJlcn0gc2NhbGVzIGJvdGggZGltZW5zaW9ucyBlcXVhbGx5LCBvciB7VmVjdG9yMn0gc2NhbGVzIGluZGVwZW5kZW50bHlcclxuICAgKiAgICAgICAgICAtICh4LHkgaW52b2NhdGlvbik6IHtudW1iZXJ9IHNjYWxlIGZvciB0aGUgeC1kaW1lbnNpb25cclxuICAgKiBAcGFyYW0gW3ldIC0gKHMgaW52b2NhdGlvbik6IHtib29sZWFufSBwcmVwZW5kSW5zdGVhZCAtIFdoZXRoZXIgdGhlIHRyYW5zZm9ybSBzaG91bGQgYmUgcHJlcGVuZGVkIChkZWZhdWx0cyB0byBmYWxzZSlcclxuICAgKiAgICAgICAgICAgIC0gKHgseSBpbnZvY2F0aW9uKToge251bWJlcn0geSAtIHNjYWxlIGZvciB0aGUgeS1kaW1lbnNpb25cclxuICAgKiBAcGFyYW0gW3ByZXBlbmRJbnN0ZWFkXSAtICh4LHkgaW52b2NhdGlvbikgV2hldGhlciB0aGUgdHJhbnNmb3JtIHNob3VsZCBiZSBwcmVwZW5kZWQgKGRlZmF1bHRzIHRvIGZhbHNlKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzY2FsZSggczogbnVtYmVyLCBwcmVwZW5kSW5zdGVhZD86IGJvb2xlYW4gKTogdm9pZDtcclxuICBzY2FsZSggczogVmVjdG9yMiwgcHJlcGVuZEluc3RlYWQ/OiBib29sZWFuICk6IHZvaWQ7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2V4cGxpY2l0LW1lbWJlci1hY2Nlc3NpYmlsaXR5XHJcbiAgc2NhbGUoIHg6IG51bWJlciwgeTogbnVtYmVyLCBwcmVwZW5kSW5zdGVhZD86IGJvb2xlYW4gKTogdm9pZDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbWVtYmVyLWFjY2Vzc2liaWxpdHlcclxuICBzY2FsZSggeDogbnVtYmVyIHwgVmVjdG9yMiwgeT86IG51bWJlciB8IGJvb2xlYW4sIHByZXBlbmRJbnN0ZWFkPzogYm9vbGVhbiApOiB2b2lkIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbWVtYmVyLWFjY2Vzc2liaWxpdHlcclxuICAgIGlmICggdHlwZW9mIHggPT09ICdudW1iZXInICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggeCApLCAnc2NhbGVzIHNob3VsZCBiZSBmaW5pdGUnICk7XHJcbiAgICAgIGlmICggeSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiB5ID09PSAnYm9vbGVhbicgKSB7XHJcbiAgICAgICAgLy8gc2NhbGUoIHNjYWxlLCBbcHJlcGVuZEluc3RlYWRdIClcclxuICAgICAgICB0aGlzLnNjYWxlKCB4LCB4LCB5ICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gc2NhbGUoIHgsIHksIFtwcmVwZW5kSW5zdGVhZF0gKVxyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB5ICksICdzY2FsZXMgc2hvdWxkIGJlIGZpbml0ZSBudW1iZXJzJyApO1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHByZXBlbmRJbnN0ZWFkID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHByZXBlbmRJbnN0ZWFkID09PSAnYm9vbGVhbicsICdJZiBwcm92aWRlZCwgcHJlcGVuZEluc3RlYWQgc2hvdWxkIGJlIGJvb2xlYW4nICk7XHJcblxyXG4gICAgICAgIGlmICggeCA9PT0gMSAmJiB5ID09PSAxICkgeyByZXR1cm47IH0gLy8gYmFpbCBvdXQgaWYgd2UgYXJlIHNjYWxpbmcgYnkgMSAoaWRlbnRpdHkpXHJcbiAgICAgICAgaWYgKCBwcmVwZW5kSW5zdGVhZCApIHtcclxuICAgICAgICAgIHRoaXMucHJlcGVuZE1hdHJpeCggTWF0cml4My5zY2FsaW5nKCB4LCB5ICkgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLmFwcGVuZE1hdHJpeCggTWF0cml4My5zY2FsaW5nKCB4LCB5ICkgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyBzY2FsZSggdmVjdG9yLCBbcHJlcGVuZEluc3RlYWRdIClcclxuICAgICAgY29uc3QgdmVjdG9yID0geDtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdmVjdG9yLmlzRmluaXRlKCksICdzY2FsZSBzaG91bGQgYmUgYSBmaW5pdGUgVmVjdG9yMiBpZiBub3QgYSBmaW5pdGUgbnVtYmVyJyApO1xyXG4gICAgICB0aGlzLnNjYWxlKCB2ZWN0b3IueCwgdmVjdG9yLnksIHkgYXMgYm9vbGVhbiApOyAvLyBmb3J3YXJkIHRvIGZ1bGwgdmVyc2lvblxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUm90YXRlcyB0aGUgbm9kZSdzIHRyYW5zZm9ybS4gVGhlIGRlZmF1bHQgXCJhcHBlbmRzXCIgdGhlIHRyYW5zZm9ybSwgc28gdGhhdCBpdCB3aWxsXHJcbiAgICogYXBwZWFyIHRvIGhhcHBlbiB0byB0aGUgTm9kZSBiZWZvcmUgdGhlIHJlc3Qgb2YgdGhlIHRyYW5zZm9ybSB3b3VsZCBhcHBseSwgYnV0IGlmIFwicHJlcGVuZGVkXCIsIHRoZSByZXN0IG9mIHRoZVxyXG4gICAqIHRyYW5zZm9ybSB3b3VsZCBhcHBseSBmaXJzdC5cclxuICAgKlxyXG4gICAqIEFzIGFuIGV4YW1wbGUsIGlmIGEgTm9kZSBpcyB0cmFuc2xhdGVkIHRvICgxMDAsMCk6XHJcbiAgICogcm90YXRlKCBNYXRoLlBJICkgd2lsbCByb3RhdGUgdGhlIE5vZGUgYXJvdW5kICgxMDAsMClcclxuICAgKiByb3RhdGUoIE1hdGguUEksIHRydWUgKSB3aWxsIHJvdGF0ZSB0aGUgTm9kZSBhcm91bmQgdGhlIG9yaWdpbiwgbW92aW5nIGl0IHRvICgtMTAwLDApXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYW5nbGUgLSBUaGUgYW5nbGUgKGluIHJhZGlhbnMpIHRvIHJvdGF0ZSBieVxyXG4gICAqIEBwYXJhbSBbcHJlcGVuZEluc3RlYWRdIC0gV2hldGhlciB0aGUgdHJhbnNmb3JtIHNob3VsZCBiZSBwcmVwZW5kZWQgKGRlZmF1bHRzIHRvIGZhbHNlKVxyXG4gICAqL1xyXG4gIHB1YmxpYyByb3RhdGUoIGFuZ2xlOiBudW1iZXIsIHByZXBlbmRJbnN0ZWFkPzogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBhbmdsZSApLCAnYW5nbGUgc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHByZXBlbmRJbnN0ZWFkID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHByZXBlbmRJbnN0ZWFkID09PSAnYm9vbGVhbicgKTtcclxuICAgIGlmICggYW5nbGUgJSAoIDIgKiBNYXRoLlBJICkgPT09IDAgKSB7IHJldHVybjsgfSAvLyBiYWlsIG91dCBpZiBvdXIgYW5nbGUgaXMgZWZmZWN0aXZlbHkgMFxyXG4gICAgaWYgKCBwcmVwZW5kSW5zdGVhZCApIHtcclxuICAgICAgdGhpcy5wcmVwZW5kTWF0cml4KCBNYXRyaXgzLnJvdGF0aW9uMiggYW5nbGUgKSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRoaXMuYXBwZW5kTWF0cml4KCBNYXRyaXgzLnJvdGF0aW9uMiggYW5nbGUgKSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUm90YXRlcyB0aGUgbm9kZSdzIHRyYW5zZm9ybSBhcm91bmQgYSBzcGVjaWZpYyBwb2ludCAoaW4gdGhlIHBhcmVudCBjb29yZGluYXRlIGZyYW1lKSBieSBwcmVwZW5kaW5nIHRoZSB0cmFuc2Zvcm0uXHJcbiAgICpcclxuICAgKiBUT0RPOiBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHNob3VsZCB1c2UgdGhlIGFwcGVuZE1hdHJpeCBtZXRob2QgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgKlxyXG4gICAqIEBwYXJhbSBwb2ludCAtIEluIHRoZSBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZVxyXG4gICAqIEBwYXJhbSBhbmdsZSAtIEluIHJhZGlhbnNcclxuICAgKi9cclxuICBwdWJsaWMgcm90YXRlQXJvdW5kKCBwb2ludDogVmVjdG9yMiwgYW5nbGU6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHBvaW50LmlzRmluaXRlKCksICdwb2ludCBzaG91bGQgYmUgYSBmaW5pdGUgVmVjdG9yMicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBhbmdsZSApLCAnYW5nbGUgc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcicgKTtcclxuXHJcbiAgICBsZXQgbWF0cml4ID0gTWF0cml4My50cmFuc2xhdGlvbiggLXBvaW50LngsIC1wb2ludC55ICk7XHJcbiAgICBtYXRyaXggPSBNYXRyaXgzLnJvdGF0aW9uMiggYW5nbGUgKS50aW1lc01hdHJpeCggbWF0cml4ICk7XHJcbiAgICBtYXRyaXggPSBNYXRyaXgzLnRyYW5zbGF0aW9uKCBwb2ludC54LCBwb2ludC55ICkudGltZXNNYXRyaXgoIG1hdHJpeCApO1xyXG4gICAgdGhpcy5wcmVwZW5kTWF0cml4KCBtYXRyaXggKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2hpZnRzIHRoZSB4IGNvb3JkaW5hdGUgKGluIHRoZSBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZSkgb2Ygd2hlcmUgdGhlIG5vZGUncyBvcmlnaW4gaXMgdHJhbnNmb3JtZWQgdG8uXHJcbiAgICovXHJcbiAgcHVibGljIHNldFgoIHg6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB4ICksICd4IHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXInICk7XHJcblxyXG4gICAgdGhpcy50cmFuc2xhdGUoIHggLSB0aGlzLmdldFgoKSwgMCwgdHJ1ZSApO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0WCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCB4KCB2YWx1ZTogbnVtYmVyICkge1xyXG4gICAgdGhpcy5zZXRYKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFgoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgeCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0WCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgeCBjb29yZGluYXRlIChpbiB0aGUgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUpIG9mIHdoZXJlIHRoZSBub2RlJ3Mgb3JpZ2luIGlzIHRyYW5zZm9ybWVkIHRvLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRYKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fdHJhbnNmb3JtLmdldE1hdHJpeCgpLm0wMigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2hpZnRzIHRoZSB5IGNvb3JkaW5hdGUgKGluIHRoZSBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZSkgb2Ygd2hlcmUgdGhlIG5vZGUncyBvcmlnaW4gaXMgdHJhbnNmb3JtZWQgdG8uXHJcbiAgICovXHJcbiAgcHVibGljIHNldFkoIHk6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB5ICksICd5IHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXInICk7XHJcblxyXG4gICAgdGhpcy50cmFuc2xhdGUoIDAsIHkgLSB0aGlzLmdldFkoKSwgdHJ1ZSApO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0WSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCB5KCB2YWx1ZTogbnVtYmVyICkge1xyXG4gICAgdGhpcy5zZXRZKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFkoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgeSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0WSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgeSBjb29yZGluYXRlIChpbiB0aGUgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUpIG9mIHdoZXJlIHRoZSBub2RlJ3Mgb3JpZ2luIGlzIHRyYW5zZm9ybWVkIHRvLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRZKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fdHJhbnNmb3JtLmdldE1hdHJpeCgpLm0xMigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHlwaWNhbGx5IHdpdGhvdXQgcm90YXRpb25zIG9yIG5lZ2F0aXZlIHBhcmFtZXRlcnMsIHRoaXMgc2V0cyB0aGUgc2NhbGUgZm9yIGVhY2ggYXhpcy4gSW4gaXRzIG1vcmUgZ2VuZXJhbCBmb3JtLFxyXG4gICAqIGl0IG1vZGlmaWVzIHRoZSBub2RlJ3MgdHJhbnNmb3JtIHNvIHRoYXQ6XHJcbiAgICogLSBUcmFuc2Zvcm1pbmcgKDEsMCkgd2l0aCBvdXIgdHJhbnNmb3JtIHdpbGwgcmVzdWx0IGluIGEgdmVjdG9yIHdpdGggbWFnbml0dWRlIGFicyggeC1zY2FsZS1tYWduaXR1ZGUgKVxyXG4gICAqIC0gVHJhbnNmb3JtaW5nICgwLDEpIHdpdGggb3VyIHRyYW5zZm9ybSB3aWxsIHJlc3VsdCBpbiBhIHZlY3RvciB3aXRoIG1hZ25pdHVkZSBhYnMoIHktc2NhbGUtbWFnbml0dWRlIClcclxuICAgKiAtIElmIHBhcmFtZXRlcnMgYXJlIG5lZ2F0aXZlLCBpdCB3aWxsIGZsaXAgb3JpZW50YXRpb24gaW4gdGhhdCBkaXJlY3QuXHJcbiAgICpcclxuICAgKiBBbGxvd2VkIGNhbGwgc2lnbmF0dXJlczpcclxuICAgKiBzZXRTY2FsZU1hZ25pdHVkZSggcyApXHJcbiAgICogc2V0U2NhbGVNYWduaXR1ZGUoIHN4LCBzeSApXHJcbiAgICogc2V0U2NhbGVNYWduaXR1ZGUoIHZlY3RvciApXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYSAtIFNjYWxlIGZvciBib3RoIGF4ZXMsIG9yIHNjYWxlIGZvciB4LWF4aXMgaWYgdXNpbmcgdGhlIDItcGFyYW1ldGVyIGNhbGxcclxuICAgKiBAcGFyYW0gW2JdIC0gU2NhbGUgZm9yIHRoZSBZIGF4aXMgKG9ubHkgZm9yIHRoZSAyLXBhcmFtZXRlciBjYWxsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRTY2FsZU1hZ25pdHVkZSggczogbnVtYmVyICk6IHRoaXM7XHJcbiAgc2V0U2NhbGVNYWduaXR1ZGUoIHY6IFZlY3RvcjIgKTogdGhpczsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvZXhwbGljaXQtbWVtYmVyLWFjY2Vzc2liaWxpdHlcclxuICBzZXRTY2FsZU1hZ25pdHVkZSggc3g6IG51bWJlciwgc3k6IG51bWJlciApOiB0aGlzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9leHBsaWNpdC1tZW1iZXItYWNjZXNzaWJpbGl0eVxyXG4gIHNldFNjYWxlTWFnbml0dWRlKCBhOiBudW1iZXIgfCBWZWN0b3IyLCBiPzogbnVtYmVyICk6IHRoaXMgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9leHBsaWNpdC1tZW1iZXItYWNjZXNzaWJpbGl0eVxyXG4gICAgY29uc3QgY3VycmVudFNjYWxlID0gdGhpcy5nZXRTY2FsZVZlY3RvcigpO1xyXG5cclxuICAgIGlmICggdHlwZW9mIGEgPT09ICdudW1iZXInICkge1xyXG4gICAgICBpZiAoIGIgPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAvLyB0byBtYXAgc2V0U2NhbGVNYWduaXR1ZGUoIHNjYWxlICkgPT4gc2V0U2NhbGVNYWduaXR1ZGUoIHNjYWxlLCBzY2FsZSApXHJcbiAgICAgICAgYiA9IGE7XHJcbiAgICAgIH1cclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIGEgKSwgJ3NldFNjYWxlTWFnbml0dWRlIHBhcmFtZXRlcnMgc2hvdWxkIGJlIGZpbml0ZSBudW1iZXJzJyApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggYiApLCAnc2V0U2NhbGVNYWduaXR1ZGUgcGFyYW1ldGVycyBzaG91bGQgYmUgZmluaXRlIG51bWJlcnMnICk7XHJcbiAgICAgIC8vIHNldFNjYWxlTWFnbml0dWRlKCB4LCB5IClcclxuICAgICAgdGhpcy5hcHBlbmRNYXRyaXgoIE1hdHJpeDMuc2NhbGluZyggYSAvIGN1cnJlbnRTY2FsZS54LCBiIC8gY3VycmVudFNjYWxlLnkgKSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIHNldFNjYWxlTWFnbml0dWRlKCB2ZWN0b3IgKSwgd2hlcmUgd2Ugc2V0IHRoZSB4LXNjYWxlIHRvIHZlY3Rvci54IGFuZCB5LXNjYWxlIHRvIHZlY3Rvci55XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGEuaXNGaW5pdGUoKSwgJ2ZpcnN0IHBhcmFtZXRlciBzaG91bGQgYmUgYSBmaW5pdGUgVmVjdG9yMicgKTtcclxuXHJcbiAgICAgIHRoaXMuYXBwZW5kTWF0cml4KCBNYXRyaXgzLnNjYWxpbmcoIGEueCAvIGN1cnJlbnRTY2FsZS54LCBhLnkgLyBjdXJyZW50U2NhbGUueSApICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSB2ZWN0b3Igd2l0aCBhbiBlbnRyeSBmb3IgZWFjaCBheGlzLCBlLmcuICg1LDIpIGZvciBhbiBhZmZpbmUgbWF0cml4IHdpdGggcm93cyAoKDUsMCwwKSwoMCwyLDApLCgwLDAsMSkpLlxyXG4gICAqXHJcbiAgICogSXQgaXMgZXF1aXZhbGVudCB0bzpcclxuICAgKiAoIFQoMSwwKS5tYWduaXR1ZGUoKSwgVCgwLDEpLm1hZ25pdHVkZSgpICkgd2hlcmUgVCgpIHRyYW5zZm9ybXMgcG9pbnRzIHdpdGggb3VyIHRyYW5zZm9ybS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0U2NhbGVWZWN0b3IoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5fdHJhbnNmb3JtLmdldE1hdHJpeCgpLmdldFNjYWxlVmVjdG9yKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSb3RhdGVzIHRoaXMgbm9kZSdzIHRyYW5zZm9ybSBzbyB0aGF0IGEgdW5pdCAoMSwwKSB2ZWN0b3Igd291bGQgYmUgcm90YXRlZCBieSB0aGlzIG5vZGUncyB0cmFuc2Zvcm0gYnkgdGhlXHJcbiAgICogc3BlY2lmaWVkIGFtb3VudC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSByb3RhdGlvbiAtIEluIHJhZGlhbnNcclxuICAgKi9cclxuICBwdWJsaWMgc2V0Um90YXRpb24oIHJvdGF0aW9uOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggcm90YXRpb24gKSxcclxuICAgICAgJ3JvdGF0aW9uIHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXInICk7XHJcblxyXG4gICAgdGhpcy5hcHBlbmRNYXRyaXgoIHNjcmF0Y2hNYXRyaXgzLnNldFRvUm90YXRpb25aKCByb3RhdGlvbiAtIHRoaXMuZ2V0Um90YXRpb24oKSApICk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRSb3RhdGlvbigpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCByb3RhdGlvbiggdmFsdWU6IG51bWJlciApIHtcclxuICAgIHRoaXMuc2V0Um90YXRpb24oIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0Um90YXRpb24oKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgcm90YXRpb24oKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldFJvdGF0aW9uKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSByb3RhdGlvbiAoaW4gcmFkaWFucykgdGhhdCB3b3VsZCBiZSBhcHBsaWVkIHRvIGEgdW5pdCAoMSwwKSB2ZWN0b3Igd2hlbiB0cmFuc2Zvcm1lZCB3aXRoIHRoaXMgTm9kZSdzXHJcbiAgICogdHJhbnNmb3JtLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRSb3RhdGlvbigpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3RyYW5zZm9ybS5nZXRNYXRyaXgoKS5nZXRSb3RhdGlvbigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTW9kaWZpZXMgdGhlIHRyYW5zbGF0aW9uIG9mIHRoaXMgTm9kZSdzIHRyYW5zZm9ybSBzbyB0aGF0IHRoZSBub2RlJ3MgbG9jYWwtY29vcmRpbmF0ZSBvcmlnaW4gd2lsbCBiZSB0cmFuc2Zvcm1lZFxyXG4gICAqIHRvIHRoZSBwYXNzZWQtaW4geC95LlxyXG4gICAqXHJcbiAgICogQWxsb3dlZCBjYWxsIHNpZ25hdHVyZXM6XHJcbiAgICogc2V0VHJhbnNsYXRpb24oIHgsIHkgKVxyXG4gICAqIHNldFRyYW5zbGF0aW9uKCB2ZWN0b3IgKVxyXG4gICAqXHJcbiAgICogQHBhcmFtIGEgLSBYIHRyYW5zbGF0aW9uIC0gb3IgVmVjdG9yIHdpdGggeC95IHRyYW5zbGF0aW9uIGluIGNvbXBvbmVudHNcclxuICAgKiBAcGFyYW0gW2JdIC0gWSB0cmFuc2xhdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRUcmFuc2xhdGlvbiggeDogbnVtYmVyLCB5OiBudW1iZXIgKTogdGhpcztcclxuICBzZXRUcmFuc2xhdGlvbiggdjogVmVjdG9yMiApOiB0aGlzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9leHBsaWNpdC1tZW1iZXItYWNjZXNzaWJpbGl0eVxyXG4gIHNldFRyYW5zbGF0aW9uKCBhOiBudW1iZXIgfCBWZWN0b3IyLCBiPzogbnVtYmVyICk6IHRoaXMgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9leHBsaWNpdC1tZW1iZXItYWNjZXNzaWJpbGl0eVxyXG4gICAgY29uc3QgbSA9IHRoaXMuX3RyYW5zZm9ybS5nZXRNYXRyaXgoKTtcclxuICAgIGNvbnN0IHR4ID0gbS5tMDIoKTtcclxuICAgIGNvbnN0IHR5ID0gbS5tMTIoKTtcclxuXHJcbiAgICBsZXQgZHg7XHJcbiAgICBsZXQgZHk7XHJcblxyXG4gICAgaWYgKCB0eXBlb2YgYSA9PT0gJ251bWJlcicgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBhICksICdQYXJhbWV0ZXJzIHRvIHNldFRyYW5zbGF0aW9uIHNob3VsZCBiZSBmaW5pdGUgbnVtYmVycycgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggYiAhPT0gdW5kZWZpbmVkICYmIGlzRmluaXRlKCBiICksICdQYXJhbWV0ZXJzIHRvIHNldFRyYW5zbGF0aW9uIHNob3VsZCBiZSBmaW5pdGUgbnVtYmVycycgKTtcclxuICAgICAgZHggPSBhIC0gdHg7XHJcbiAgICAgIGR5ID0gYiEgLSB0eTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhLmlzRmluaXRlKCksICdTaG91bGQgYmUgYSBmaW5pdGUgVmVjdG9yMicgKTtcclxuICAgICAgZHggPSBhLnggLSB0eDtcclxuICAgICAgZHkgPSBhLnkgLSB0eTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyYW5zbGF0ZSggZHgsIGR5LCB0cnVlICk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0VHJhbnNsYXRpb24oKSBmb3IgbW9yZSBpbmZvcm1hdGlvbiAtIHRoaXMgc2hvdWxkIG9ubHkgYmUgdXNlZCB3aXRoIFZlY3RvcjJcclxuICAgKi9cclxuICBwdWJsaWMgc2V0IHRyYW5zbGF0aW9uKCB2YWx1ZTogVmVjdG9yMiApIHtcclxuICAgIHRoaXMuc2V0VHJhbnNsYXRpb24oIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0VHJhbnNsYXRpb24oKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgdHJhbnNsYXRpb24oKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRUcmFuc2xhdGlvbigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHZlY3RvciBvZiB3aGVyZSB0aGlzIE5vZGUncyBsb2NhbC1jb29yZGluYXRlIG9yaWdpbiB3aWxsIGJlIHRyYW5zZm9ybWVkIGJ5IGl0J3Mgb3duIHRyYW5zZm9ybS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0VHJhbnNsYXRpb24oKTogVmVjdG9yMiB7XHJcbiAgICBjb25zdCBtYXRyaXggPSB0aGlzLl90cmFuc2Zvcm0uZ2V0TWF0cml4KCk7XHJcbiAgICByZXR1cm4gbmV3IFZlY3RvcjIoIG1hdHJpeC5tMDIoKSwgbWF0cml4Lm0xMigpICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBcHBlbmRzIGEgdHJhbnNmb3JtYXRpb24gbWF0cml4IHRvIHRoaXMgTm9kZSdzIHRyYW5zZm9ybS4gQXBwZW5kaW5nIG1lYW5zIHRoaXMgdHJhbnNmb3JtIGlzIGNvbmNlcHR1YWxseSBhcHBsaWVkXHJcbiAgICogZmlyc3QgYmVmb3JlIHRoZSByZXN0IG9mIHRoZSBOb2RlJ3MgY3VycmVudCB0cmFuc2Zvcm0gKGkuZS4gYXBwbGllZCBpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSkuXHJcbiAgICovXHJcbiAgcHVibGljIGFwcGVuZE1hdHJpeCggbWF0cml4OiBNYXRyaXgzICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbWF0cml4LmlzRmluaXRlKCksICdtYXRyaXggc2hvdWxkIGJlIGEgZmluaXRlIE1hdHJpeDMnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBtYXRyaXguZ2V0RGV0ZXJtaW5hbnQoKSAhPT0gMCwgJ21hdHJpeCBzaG91bGQgbm90IG1hcCBwbGFuZSB0byBhIGxpbmUgb3IgcG9pbnQnICk7XHJcbiAgICB0aGlzLl90cmFuc2Zvcm0uYXBwZW5kKCBtYXRyaXggKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFByZXBlbmRzIGEgdHJhbnNmb3JtYXRpb24gbWF0cml4IHRvIHRoaXMgTm9kZSdzIHRyYW5zZm9ybS4gUHJlcGVuZGluZyBtZWFucyB0aGlzIHRyYW5zZm9ybSBpcyBjb25jZXB0dWFsbHkgYXBwbGllZFxyXG4gICAqIGFmdGVyIHRoZSByZXN0IG9mIHRoZSBOb2RlJ3MgY3VycmVudCB0cmFuc2Zvcm0gKGkuZS4gYXBwbGllZCBpbiB0aGUgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBwcmVwZW5kTWF0cml4KCBtYXRyaXg6IE1hdHJpeDMgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBtYXRyaXguaXNGaW5pdGUoKSwgJ21hdHJpeCBzaG91bGQgYmUgYSBmaW5pdGUgTWF0cml4MycgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG1hdHJpeC5nZXREZXRlcm1pbmFudCgpICE9PSAwLCAnbWF0cml4IHNob3VsZCBub3QgbWFwIHBsYW5lIHRvIGEgbGluZSBvciBwb2ludCcgKTtcclxuICAgIHRoaXMuX3RyYW5zZm9ybS5wcmVwZW5kKCBtYXRyaXggKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFByZXBlbmRzIGFuICh4LHkpIHRyYW5zbGF0aW9uIHRvIG91ciBOb2RlJ3MgdHJhbnNmb3JtIGluIGFuIGVmZmljaWVudCBtYW5uZXIgd2l0aG91dCBhbGxvY2F0aW5nIGEgbWF0cml4LlxyXG4gICAqIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTE5XHJcbiAgICovXHJcbiAgcHVibGljIHByZXBlbmRUcmFuc2xhdGlvbiggeDogbnVtYmVyLCB5OiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggeCApLCAneCBzaG91bGQgYmUgYSBmaW5pdGUgbnVtYmVyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHkgKSwgJ3kgc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcicgKTtcclxuXHJcbiAgICBpZiAoICF4ICYmICF5ICkgeyByZXR1cm47IH0gLy8gYmFpbCBvdXQgaWYgYm90aCBhcmUgemVyb1xyXG5cclxuICAgIHRoaXMuX3RyYW5zZm9ybS5wcmVwZW5kVHJhbnNsYXRpb24oIHgsIHkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENoYW5nZXMgdGhpcyBOb2RlJ3MgdHJhbnNmb3JtIHRvIG1hdGNoIHRoZSBwYXNzZWQtaW4gdHJhbnNmb3JtYXRpb24gbWF0cml4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRNYXRyaXgoIG1hdHJpeDogTWF0cml4MyApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG1hdHJpeC5pc0Zpbml0ZSgpLCAnbWF0cml4IHNob3VsZCBiZSBhIGZpbml0ZSBNYXRyaXgzJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbWF0cml4LmdldERldGVybWluYW50KCkgIT09IDAsICdtYXRyaXggc2hvdWxkIG5vdCBtYXAgcGxhbmUgdG8gYSBsaW5lIG9yIHBvaW50JyApO1xyXG5cclxuICAgIHRoaXMuX3RyYW5zZm9ybS5zZXRNYXRyaXgoIG1hdHJpeCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldE1hdHJpeCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBtYXRyaXgoIHZhbHVlOiBNYXRyaXgzICkge1xyXG4gICAgdGhpcy5zZXRNYXRyaXgoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0TWF0cml4KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IG1hdHJpeCgpOiBNYXRyaXgzIHtcclxuICAgIHJldHVybiB0aGlzLmdldE1hdHJpeCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIE1hdHJpeDMgcmVwcmVzZW50aW5nIG91ciBOb2RlJ3MgdHJhbnNmb3JtLlxyXG4gICAqXHJcbiAgICogTk9URTogRG8gbm90IG11dGF0ZSB0aGUgcmV0dXJuZWQgbWF0cml4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRNYXRyaXgoKTogTWF0cml4MyB7XHJcbiAgICByZXR1cm4gdGhpcy5fdHJhbnNmb3JtLmdldE1hdHJpeCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHJlZmVyZW5jZSB0byBvdXIgTm9kZSdzIHRyYW5zZm9ybVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRUcmFuc2Zvcm0oKTogVHJhbnNmb3JtMyB7XHJcbiAgICAvLyBmb3Igbm93LCByZXR1cm4gYW4gYWN0dWFsIGNvcHkuIHdlIGNhbiBjb25zaWRlciBsaXN0ZW5pbmcgdG8gY2hhbmdlcyBpbiB0aGUgZnV0dXJlXHJcbiAgICByZXR1cm4gdGhpcy5fdHJhbnNmb3JtO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFRyYW5zZm9ybSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCB0cmFuc2Zvcm0oKTogVHJhbnNmb3JtMyB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRUcmFuc2Zvcm0oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc2V0cyBvdXIgTm9kZSdzIHRyYW5zZm9ybSB0byBhbiBpZGVudGl0eSB0cmFuc2Zvcm0gKGkuZS4gbm8gdHJhbnNmb3JtIGlzIGFwcGxpZWQpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyByZXNldFRyYW5zZm9ybSgpOiB2b2lkIHtcclxuICAgIHRoaXMuc2V0TWF0cml4KCBNYXRyaXgzLklERU5USVRZICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHNob3VsZCBiZSBjYWxsZWQgd2hlbiBvdXIgdHJhbnNmb3JtIGlzIGNoYW5nZWQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBvblRyYW5zZm9ybUNoYW5nZSgpOiB2b2lkIHtcclxuICAgIC8vIFRPRE86IHdoeSBpcyBsb2NhbCBib3VuZHMgaW52YWxpZGF0aW9uIG5lZWRlZCBoZXJlPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgdGhpcy5pbnZhbGlkYXRlQm91bmRzKCk7XHJcblxyXG4gICAgdGhpcy5fcGlja2VyLm9uVHJhbnNmb3JtQ2hhbmdlKCk7XHJcbiAgICBpZiAoIGFzc2VydFNsb3cgKSB7IHRoaXMuX3BpY2tlci5hdWRpdCgpOyB9XHJcblxyXG4gICAgdGhpcy50cmFuc2Zvcm1FbWl0dGVyLmVtaXQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCB3aGVuIG91ciBzdW1tYXJ5IGJpdG1hc2sgY2hhbmdlcyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgb25TdW1tYXJ5Q2hhbmdlKCBvbGRCaXRtYXNrOiBudW1iZXIsIG5ld0JpdG1hc2s6IG51bWJlciApOiB2b2lkIHtcclxuICAgIC8vIERlZmluZWQgaW4gUGFyYWxsZWxET00uanNcclxuICAgIHRoaXMuX3Bkb21EaXNwbGF5c0luZm8ub25TdW1tYXJ5Q2hhbmdlKCBvbGRCaXRtYXNrLCBuZXdCaXRtYXNrICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVcGRhdGVzIG91ciBub2RlJ3Mgc2NhbGUgYW5kIGFwcGxpZWQgc2NhbGUgZmFjdG9yIGlmIHdlIG5lZWQgdG8gY2hhbmdlIG91ciBzY2FsZSB0byBmaXQgd2l0aGluIHRoZSBtYXhpbXVtXHJcbiAgICogZGltZW5zaW9ucyAobWF4V2lkdGggYW5kIG1heEhlaWdodCkuIFNlZSBkb2N1bWVudGF0aW9uIGluIGNvbnN0cnVjdG9yIGZvciBkZXRhaWxlZCBiZWhhdmlvci5cclxuICAgKi9cclxuICBwcml2YXRlIHVwZGF0ZU1heERpbWVuc2lvbiggbG9jYWxCb3VuZHM6IEJvdW5kczIgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgdGhpcy5hdWRpdE1heERpbWVuc2lvbnMoKTtcclxuXHJcbiAgICBjb25zdCBjdXJyZW50U2NhbGUgPSB0aGlzLl9hcHBsaWVkU2NhbGVGYWN0b3I7XHJcbiAgICBsZXQgaWRlYWxTY2FsZSA9IDE7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9tYXhXaWR0aCAhPT0gbnVsbCApIHtcclxuICAgICAgY29uc3Qgd2lkdGggPSBsb2NhbEJvdW5kcy53aWR0aDtcclxuICAgICAgaWYgKCB3aWR0aCA+IHRoaXMuX21heFdpZHRoICkge1xyXG4gICAgICAgIGlkZWFsU2NhbGUgPSBNYXRoLm1pbiggaWRlYWxTY2FsZSwgdGhpcy5fbWF4V2lkdGggLyB3aWR0aCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0aGlzLl9tYXhIZWlnaHQgIT09IG51bGwgKSB7XHJcbiAgICAgIGNvbnN0IGhlaWdodCA9IGxvY2FsQm91bmRzLmhlaWdodDtcclxuICAgICAgaWYgKCBoZWlnaHQgPiB0aGlzLl9tYXhIZWlnaHQgKSB7XHJcbiAgICAgICAgaWRlYWxTY2FsZSA9IE1hdGgubWluKCBpZGVhbFNjYWxlLCB0aGlzLl9tYXhIZWlnaHQgLyBoZWlnaHQgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHNjYWxlQWRqdXN0bWVudCA9IGlkZWFsU2NhbGUgLyBjdXJyZW50U2NhbGU7XHJcbiAgICBpZiAoIHNjYWxlQWRqdXN0bWVudCAhPT0gMSApIHtcclxuICAgICAgLy8gU2V0IHRoaXMgZmlyc3QsIGZvciBzdXBwb3J0aW5nIHJlLWVudHJhbmN5IGlmIG91ciBjb250ZW50IGNoYW5nZXMgYmFzZWQgb24gdGhlIHNjYWxlXHJcbiAgICAgIHRoaXMuX2FwcGxpZWRTY2FsZUZhY3RvciA9IGlkZWFsU2NhbGU7XHJcblxyXG4gICAgICB0aGlzLnNjYWxlKCBzY2FsZUFkanVzdG1lbnQgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNjZW5lcnktaW50ZXJuYWwgbWV0aG9kIGZvciB2ZXJpZnlpbmcgbWF4aW11bSBkaW1lbnNpb25zIGFyZSBOT1Qgc21hbGxlciB0aGFuIHByZWZlcnJlZCBkaW1lbnNpb25zXHJcbiAgICogTk9URTogVGhpcyBoYXMgdG8gYmUgcHVibGljIGR1ZSB0byBtaXhpbnMgbm90IGFibGUgdG8gYWNjZXNzIHByb3RlY3RlZC9wcml2YXRlIG1ldGhvZHNcclxuICAgKi9cclxuICBwdWJsaWMgYXVkaXRNYXhEaW1lbnNpb25zKCk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fbWF4V2lkdGggPT09IG51bGwgfHwgIWlzV2lkdGhTaXphYmxlKCB0aGlzICkgfHwgdGhpcy5wcmVmZXJyZWRXaWR0aCA9PT0gbnVsbCB8fCB0aGlzLl9tYXhXaWR0aCA+PSB0aGlzLnByZWZlcnJlZFdpZHRoIC0gMWUtNyxcclxuICAgICAgJ0lmIG1heFdpZHRoIGFuZCBwcmVmZXJyZWRXaWR0aCBhcmUgYm90aCBub24tbnVsbCwgbWF4V2lkdGggc2hvdWxkIE5PVCBiZSBzbWFsbGVyIHRoYW4gdGhlIHByZWZlcnJlZFdpZHRoLiBJZiB0aGF0IGhhcHBlbnMsIGl0IHdvdWxkIHRyaWdnZXIgYW4gaW5maW5pdGUgbG9vcCcgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9tYXhIZWlnaHQgPT09IG51bGwgfHwgIWlzSGVpZ2h0U2l6YWJsZSggdGhpcyApIHx8IHRoaXMucHJlZmVycmVkSGVpZ2h0ID09PSBudWxsIHx8IHRoaXMuX21heEhlaWdodCA+PSB0aGlzLnByZWZlcnJlZEhlaWdodCAtIDFlLTcsXHJcbiAgICAgICdJZiBtYXhIZWlnaHQgYW5kIHByZWZlcnJlZEhlaWdodCBhcmUgYm90aCBub24tbnVsbCwgbWF4SGVpZ2h0IHNob3VsZCBOT1QgYmUgc21hbGxlciB0aGFuIHRoZSBwcmVmZXJyZWRIZWlnaHQuIElmIHRoYXQgaGFwcGVucywgaXQgd291bGQgdHJpZ2dlciBhbiBpbmZpbml0ZSBsb29wJyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5jcmVtZW50cy9kZWNyZW1lbnRzIGJvdW5kcyBcImxpc3RlbmVyXCIgY291bnQgYmFzZWQgb24gdGhlIHZhbHVlcyBvZiBtYXhXaWR0aC9tYXhIZWlnaHQgYmVmb3JlIGFuZCBhZnRlci5cclxuICAgKiBudWxsIGlzIGxpa2Ugbm8gbGlzdGVuZXIsIG5vbi1udWxsIGlzIGxpa2UgaGF2aW5nIGEgbGlzdGVuZXIsIHNvIHdlIGluY3JlbWVudCBmb3IgbnVsbCA9PiBub24tbnVsbCwgYW5kXHJcbiAgICogZGVjcmVtZW50IGZvciBub24tbnVsbCA9PiBudWxsLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgb25NYXhEaW1lbnNpb25DaGFuZ2UoIGJlZm9yZU1heExlbmd0aDogbnVtYmVyIHwgbnVsbCwgYWZ0ZXJNYXhMZW5ndGg6IG51bWJlciB8IG51bGwgKTogdm9pZCB7XHJcbiAgICBpZiAoIGJlZm9yZU1heExlbmd0aCA9PT0gbnVsbCAmJiBhZnRlck1heExlbmd0aCAhPT0gbnVsbCApIHtcclxuICAgICAgdGhpcy5jaGFuZ2VCb3VuZHNFdmVudENvdW50KCAxICk7XHJcbiAgICAgIHRoaXMuX2JvdW5kc0V2ZW50U2VsZkNvdW50Kys7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggYmVmb3JlTWF4TGVuZ3RoICE9PSBudWxsICYmIGFmdGVyTWF4TGVuZ3RoID09PSBudWxsICkge1xyXG4gICAgICB0aGlzLmNoYW5nZUJvdW5kc0V2ZW50Q291bnQoIC0xICk7XHJcbiAgICAgIHRoaXMuX2JvdW5kc0V2ZW50U2VsZkNvdW50LS07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBtYXhpbXVtIHdpZHRoIG9mIHRoZSBOb2RlIChzZWUgY29uc3RydWN0b3IgZm9yIGRvY3VtZW50YXRpb24gb24gaG93IG1heGltdW0gZGltZW5zaW9ucyB3b3JrKS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0TWF4V2lkdGgoIG1heFdpZHRoOiBudW1iZXIgfCBudWxsICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbWF4V2lkdGggPT09IG51bGwgfHwgKCB0eXBlb2YgbWF4V2lkdGggPT09ICdudW1iZXInICYmIG1heFdpZHRoID4gMCApLFxyXG4gICAgICAnbWF4V2lkdGggc2hvdWxkIGJlIG51bGwgKG5vIGNvbnN0cmFpbnQpIG9yIGEgcG9zaXRpdmUgbnVtYmVyJyApO1xyXG5cclxuICAgIGlmICggdGhpcy5fbWF4V2lkdGggIT09IG1heFdpZHRoICkge1xyXG4gICAgICAvLyB1cGRhdGUgc3ludGhldGljIGJvdW5kcyBsaXN0ZW5lciBjb3VudCAodG8gZW5zdXJlIG91ciBib3VuZHMgYXJlIHZhbGlkYXRlZCBhdCB0aGUgc3RhcnQgb2YgdXBkYXRlRGlzcGxheSlcclxuICAgICAgdGhpcy5vbk1heERpbWVuc2lvbkNoYW5nZSggdGhpcy5fbWF4V2lkdGgsIG1heFdpZHRoICk7XHJcblxyXG4gICAgICB0aGlzLl9tYXhXaWR0aCA9IG1heFdpZHRoO1xyXG5cclxuICAgICAgdGhpcy51cGRhdGVNYXhEaW1lbnNpb24oIHRoaXMubG9jYWxCb3VuZHNQcm9wZXJ0eS52YWx1ZSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldE1heFdpZHRoKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IG1heFdpZHRoKCB2YWx1ZTogbnVtYmVyIHwgbnVsbCApIHtcclxuICAgIHRoaXMuc2V0TWF4V2lkdGgoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0TWF4V2lkdGgoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgbWF4V2lkdGgoKTogbnVtYmVyIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRNYXhXaWR0aCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgbWF4aW11bSB3aWR0aCAoaWYgYW55KSBvZiB0aGUgTm9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TWF4V2lkdGgoKTogbnVtYmVyIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5fbWF4V2lkdGg7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBtYXhpbXVtIGhlaWdodCBvZiB0aGUgTm9kZSAoc2VlIGNvbnN0cnVjdG9yIGZvciBkb2N1bWVudGF0aW9uIG9uIGhvdyBtYXhpbXVtIGRpbWVuc2lvbnMgd29yaykuXHJcbiAgICovXHJcbiAgcHVibGljIHNldE1heEhlaWdodCggbWF4SGVpZ2h0OiBudW1iZXIgfCBudWxsICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbWF4SGVpZ2h0ID09PSBudWxsIHx8ICggdHlwZW9mIG1heEhlaWdodCA9PT0gJ251bWJlcicgJiYgbWF4SGVpZ2h0ID4gMCApLFxyXG4gICAgICAnbWF4SGVpZ2h0IHNob3VsZCBiZSBudWxsIChubyBjb25zdHJhaW50KSBvciBhIHBvc2l0aXZlIG51bWJlcicgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX21heEhlaWdodCAhPT0gbWF4SGVpZ2h0ICkge1xyXG4gICAgICAvLyB1cGRhdGUgc3ludGhldGljIGJvdW5kcyBsaXN0ZW5lciBjb3VudCAodG8gZW5zdXJlIG91ciBib3VuZHMgYXJlIHZhbGlkYXRlZCBhdCB0aGUgc3RhcnQgb2YgdXBkYXRlRGlzcGxheSlcclxuICAgICAgdGhpcy5vbk1heERpbWVuc2lvbkNoYW5nZSggdGhpcy5fbWF4SGVpZ2h0LCBtYXhIZWlnaHQgKTtcclxuXHJcbiAgICAgIHRoaXMuX21heEhlaWdodCA9IG1heEhlaWdodDtcclxuXHJcbiAgICAgIHRoaXMudXBkYXRlTWF4RGltZW5zaW9uKCB0aGlzLmxvY2FsQm91bmRzUHJvcGVydHkudmFsdWUgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRNYXhIZWlnaHQoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgbWF4SGVpZ2h0KCB2YWx1ZTogbnVtYmVyIHwgbnVsbCApIHtcclxuICAgIHRoaXMuc2V0TWF4SGVpZ2h0KCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldE1heEhlaWdodCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBtYXhIZWlnaHQoKTogbnVtYmVyIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRNYXhIZWlnaHQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG1heGltdW0gaGVpZ2h0IChpZiBhbnkpIG9mIHRoZSBOb2RlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRNYXhIZWlnaHQoKTogbnVtYmVyIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5fbWF4SGVpZ2h0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2hpZnRzIHRoaXMgTm9kZSBob3Jpem9udGFsbHkgc28gdGhhdCBpdHMgbGVmdCBib3VuZCAoaW4gdGhlIHBhcmVudCBjb29yZGluYXRlIGZyYW1lKSBpcyBlcXVhbCB0byB0aGUgcGFzc2VkLWluXHJcbiAgICogJ2xlZnQnIFggdmFsdWUuXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSByZXF1aXJlIGNvbXB1dGF0aW9uIG9mIHRoaXMgbm9kZSdzIHN1YnRyZWUgYm91bmRzLCB3aGljaCBtYXkgaW5jdXIgc29tZSBwZXJmb3JtYW5jZSBsb3NzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGxlZnQgLSBBZnRlciB0aGlzIG9wZXJhdGlvbiwgbm9kZS5sZWZ0IHNob3VsZCBhcHByb3hpbWF0ZWx5IGVxdWFsIHRoaXMgdmFsdWUuXHJcbiAgICovXHJcbiAgcHVibGljIHNldExlZnQoIGxlZnQ6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGNvbnN0IGN1cnJlbnRMZWZ0ID0gdGhpcy5nZXRMZWZ0KCk7XHJcbiAgICBpZiAoIGlzRmluaXRlKCBjdXJyZW50TGVmdCApICkge1xyXG4gICAgICB0aGlzLnRyYW5zbGF0ZSggbGVmdCAtIGN1cnJlbnRMZWZ0LCAwLCB0cnVlICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0TGVmdCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBsZWZ0KCB2YWx1ZTogbnVtYmVyICkge1xyXG4gICAgdGhpcy5zZXRMZWZ0KCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldExlZnQoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgbGVmdCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TGVmdCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgWCB2YWx1ZSBvZiB0aGUgbGVmdCBzaWRlIG9mIHRoZSBib3VuZGluZyBib3ggb2YgdGhpcyBOb2RlIChpbiB0aGUgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUpLlxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyBtYXkgcmVxdWlyZSBjb21wdXRhdGlvbiBvZiB0aGlzIG5vZGUncyBzdWJ0cmVlIGJvdW5kcywgd2hpY2ggbWF5IGluY3VyIHNvbWUgcGVyZm9ybWFuY2UgbG9zcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TGVmdCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Qm91bmRzKCkubWluWDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNoaWZ0cyB0aGlzIE5vZGUgaG9yaXpvbnRhbGx5IHNvIHRoYXQgaXRzIHJpZ2h0IGJvdW5kIChpbiB0aGUgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUpIGlzIGVxdWFsIHRvIHRoZSBwYXNzZWQtaW5cclxuICAgKiAncmlnaHQnIFggdmFsdWUuXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSByZXF1aXJlIGNvbXB1dGF0aW9uIG9mIHRoaXMgbm9kZSdzIHN1YnRyZWUgYm91bmRzLCB3aGljaCBtYXkgaW5jdXIgc29tZSBwZXJmb3JtYW5jZSBsb3NzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHJpZ2h0IC0gQWZ0ZXIgdGhpcyBvcGVyYXRpb24sIG5vZGUucmlnaHQgc2hvdWxkIGFwcHJveGltYXRlbHkgZXF1YWwgdGhpcyB2YWx1ZS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0UmlnaHQoIHJpZ2h0OiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBjb25zdCBjdXJyZW50UmlnaHQgPSB0aGlzLmdldFJpZ2h0KCk7XHJcbiAgICBpZiAoIGlzRmluaXRlKCBjdXJyZW50UmlnaHQgKSApIHtcclxuICAgICAgdGhpcy50cmFuc2xhdGUoIHJpZ2h0IC0gY3VycmVudFJpZ2h0LCAwLCB0cnVlICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpczsgLy8gYWxsb3cgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRSaWdodCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCByaWdodCggdmFsdWU6IG51bWJlciApIHtcclxuICAgIHRoaXMuc2V0UmlnaHQoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0UmlnaHQoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgcmlnaHQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldFJpZ2h0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBYIHZhbHVlIG9mIHRoZSByaWdodCBzaWRlIG9mIHRoZSBib3VuZGluZyBib3ggb2YgdGhpcyBOb2RlIChpbiB0aGUgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUpLlxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyBtYXkgcmVxdWlyZSBjb21wdXRhdGlvbiBvZiB0aGlzIG5vZGUncyBzdWJ0cmVlIGJvdW5kcywgd2hpY2ggbWF5IGluY3VyIHNvbWUgcGVyZm9ybWFuY2UgbG9zcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0UmlnaHQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldEJvdW5kcygpLm1heFg7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTaGlmdHMgdGhpcyBOb2RlIGhvcml6b250YWxseSBzbyB0aGF0IGl0cyBob3Jpem9udGFsIGNlbnRlciAoaW4gdGhlIHBhcmVudCBjb29yZGluYXRlIGZyYW1lKSBpcyBlcXVhbCB0byB0aGVcclxuICAgKiBwYXNzZWQtaW4gY2VudGVyIFggdmFsdWUuXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSByZXF1aXJlIGNvbXB1dGF0aW9uIG9mIHRoaXMgbm9kZSdzIHN1YnRyZWUgYm91bmRzLCB3aGljaCBtYXkgaW5jdXIgc29tZSBwZXJmb3JtYW5jZSBsb3NzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHggLSBBZnRlciB0aGlzIG9wZXJhdGlvbiwgbm9kZS5jZW50ZXJYIHNob3VsZCBhcHByb3hpbWF0ZWx5IGVxdWFsIHRoaXMgdmFsdWUuXHJcbiAgICovXHJcbiAgcHVibGljIHNldENlbnRlclgoIHg6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGNvbnN0IGN1cnJlbnRDZW50ZXJYID0gdGhpcy5nZXRDZW50ZXJYKCk7XHJcbiAgICBpZiAoIGlzRmluaXRlKCBjdXJyZW50Q2VudGVyWCApICkge1xyXG4gICAgICB0aGlzLnRyYW5zbGF0ZSggeCAtIGN1cnJlbnRDZW50ZXJYLCAwLCB0cnVlICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0Q2VudGVyWCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBjZW50ZXJYKCB2YWx1ZTogbnVtYmVyICkge1xyXG4gICAgdGhpcy5zZXRDZW50ZXJYKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldENlbnRlclgoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgY2VudGVyWCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q2VudGVyWCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgWCB2YWx1ZSBvZiB0aGlzIG5vZGUncyBob3Jpem9udGFsIGNlbnRlciAoaW4gdGhlIHBhcmVudCBjb29yZGluYXRlIGZyYW1lKVxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyBtYXkgcmVxdWlyZSBjb21wdXRhdGlvbiBvZiB0aGlzIG5vZGUncyBzdWJ0cmVlIGJvdW5kcywgd2hpY2ggbWF5IGluY3VyIHNvbWUgcGVyZm9ybWFuY2UgbG9zcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q2VudGVyWCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Qm91bmRzKCkuZ2V0Q2VudGVyWCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2hpZnRzIHRoaXMgTm9kZSB2ZXJ0aWNhbGx5IHNvIHRoYXQgaXRzIHZlcnRpY2FsIGNlbnRlciAoaW4gdGhlIHBhcmVudCBjb29yZGluYXRlIGZyYW1lKSBpcyBlcXVhbCB0byB0aGVcclxuICAgKiBwYXNzZWQtaW4gY2VudGVyIFkgdmFsdWUuXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSByZXF1aXJlIGNvbXB1dGF0aW9uIG9mIHRoaXMgbm9kZSdzIHN1YnRyZWUgYm91bmRzLCB3aGljaCBtYXkgaW5jdXIgc29tZSBwZXJmb3JtYW5jZSBsb3NzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHkgLSBBZnRlciB0aGlzIG9wZXJhdGlvbiwgbm9kZS5jZW50ZXJZIHNob3VsZCBhcHByb3hpbWF0ZWx5IGVxdWFsIHRoaXMgdmFsdWUuXHJcbiAgICovXHJcbiAgcHVibGljIHNldENlbnRlclkoIHk6IG51bWJlciApOiB0aGlzIHtcclxuICAgIGNvbnN0IGN1cnJlbnRDZW50ZXJZID0gdGhpcy5nZXRDZW50ZXJZKCk7XHJcbiAgICBpZiAoIGlzRmluaXRlKCBjdXJyZW50Q2VudGVyWSApICkge1xyXG4gICAgICB0aGlzLnRyYW5zbGF0ZSggMCwgeSAtIGN1cnJlbnRDZW50ZXJZLCB0cnVlICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0Q2VudGVyWSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBjZW50ZXJZKCB2YWx1ZTogbnVtYmVyICkge1xyXG4gICAgdGhpcy5zZXRDZW50ZXJZKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldENlbnRlclgoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgY2VudGVyWSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q2VudGVyWSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgWSB2YWx1ZSBvZiB0aGlzIG5vZGUncyB2ZXJ0aWNhbCBjZW50ZXIgKGluIHRoZSBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZSlcclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgbWF5IHJlcXVpcmUgY29tcHV0YXRpb24gb2YgdGhpcyBub2RlJ3Mgc3VidHJlZSBib3VuZHMsIHdoaWNoIG1heSBpbmN1ciBzb21lIHBlcmZvcm1hbmNlIGxvc3MuXHJcbiAgICovXHJcbiAgcHVibGljIGdldENlbnRlclkoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldEJvdW5kcygpLmdldENlbnRlclkoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNoaWZ0cyB0aGlzIE5vZGUgdmVydGljYWxseSBzbyB0aGF0IGl0cyB0b3AgKGluIHRoZSBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZSkgaXMgZXF1YWwgdG8gdGhlIHBhc3NlZC1pbiBZIHZhbHVlLlxyXG4gICAqXHJcbiAgICogTk9URTogdG9wIGlzIHRoZSBsb3dlc3QgWSB2YWx1ZSBpbiBvdXIgYm91bmRzLlxyXG4gICAqIE5PVEU6IFRoaXMgbWF5IHJlcXVpcmUgY29tcHV0YXRpb24gb2YgdGhpcyBub2RlJ3Mgc3VidHJlZSBib3VuZHMsIHdoaWNoIG1heSBpbmN1ciBzb21lIHBlcmZvcm1hbmNlIGxvc3MuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdG9wIC0gQWZ0ZXIgdGhpcyBvcGVyYXRpb24sIG5vZGUudG9wIHNob3VsZCBhcHByb3hpbWF0ZWx5IGVxdWFsIHRoaXMgdmFsdWUuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFRvcCggdG9wOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBjb25zdCBjdXJyZW50VG9wID0gdGhpcy5nZXRUb3AoKTtcclxuICAgIGlmICggaXNGaW5pdGUoIGN1cnJlbnRUb3AgKSApIHtcclxuICAgICAgdGhpcy50cmFuc2xhdGUoIDAsIHRvcCAtIGN1cnJlbnRUb3AsIHRydWUgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpczsgLy8gYWxsb3cgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRUb3AoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgdG9wKCB2YWx1ZTogbnVtYmVyICkge1xyXG4gICAgdGhpcy5zZXRUb3AoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0VG9wKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHRvcCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0VG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBsb3dlc3QgWSB2YWx1ZSBvZiB0aGlzIG5vZGUncyBib3VuZGluZyBib3ggKGluIHRoZSBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZSkuXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSByZXF1aXJlIGNvbXB1dGF0aW9uIG9mIHRoaXMgbm9kZSdzIHN1YnRyZWUgYm91bmRzLCB3aGljaCBtYXkgaW5jdXIgc29tZSBwZXJmb3JtYW5jZSBsb3NzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRUb3AoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldEJvdW5kcygpLm1pblk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTaGlmdHMgdGhpcyBOb2RlIHZlcnRpY2FsbHkgc28gdGhhdCBpdHMgYm90dG9tIChpbiB0aGUgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUpIGlzIGVxdWFsIHRvIHRoZSBwYXNzZWQtaW4gWSB2YWx1ZS5cclxuICAgKlxyXG4gICAqIE5PVEU6IGJvdHRvbSBpcyB0aGUgaGlnaGVzdCBZIHZhbHVlIGluIG91ciBib3VuZHMuXHJcbiAgICogTk9URTogVGhpcyBtYXkgcmVxdWlyZSBjb21wdXRhdGlvbiBvZiB0aGlzIG5vZGUncyBzdWJ0cmVlIGJvdW5kcywgd2hpY2ggbWF5IGluY3VyIHNvbWUgcGVyZm9ybWFuY2UgbG9zcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBib3R0b20gLSBBZnRlciB0aGlzIG9wZXJhdGlvbiwgbm9kZS5ib3R0b20gc2hvdWxkIGFwcHJveGltYXRlbHkgZXF1YWwgdGhpcyB2YWx1ZS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0Qm90dG9tKCBib3R0b206IG51bWJlciApOiB0aGlzIHtcclxuICAgIGNvbnN0IGN1cnJlbnRCb3R0b20gPSB0aGlzLmdldEJvdHRvbSgpO1xyXG4gICAgaWYgKCBpc0Zpbml0ZSggY3VycmVudEJvdHRvbSApICkge1xyXG4gICAgICB0aGlzLnRyYW5zbGF0ZSggMCwgYm90dG9tIC0gY3VycmVudEJvdHRvbSwgdHJ1ZSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldEJvdHRvbSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBib3R0b20oIHZhbHVlOiBudW1iZXIgKSB7XHJcbiAgICB0aGlzLnNldEJvdHRvbSggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRCb3R0b20oKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgYm90dG9tKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRCb3R0b20oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGhpZ2hlc3QgWSB2YWx1ZSBvZiB0aGlzIG5vZGUncyBib3VuZGluZyBib3ggKGluIHRoZSBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZSkuXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSByZXF1aXJlIGNvbXB1dGF0aW9uIG9mIHRoaXMgbm9kZSdzIHN1YnRyZWUgYm91bmRzLCB3aGljaCBtYXkgaW5jdXIgc29tZSBwZXJmb3JtYW5jZSBsb3NzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRCb3R0b20oKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldEJvdW5kcygpLm1heFk7XHJcbiAgfVxyXG5cclxuICAvKlxyXG4gICAqIENvbnZlbmllbmNlIGxvY2F0aW9uc1xyXG4gICAqXHJcbiAgICogVXBwZXIgaXMgaW4gdGVybXMgb2YgdGhlIHZpc3VhbCBsYXlvdXQgaW4gU2NlbmVyeSBhbmQgb3RoZXIgcHJvZ3JhbXMsIHNvIHRoZSBtaW5ZIGlzIHRoZSBcInVwcGVyXCIsIGFuZCBtaW5ZIGlzIHRoZSBcImxvd2VyXCJcclxuICAgKlxyXG4gICAqICAgICAgICAgICAgIGxlZnQgKHgpICAgICBjZW50ZXJYICAgICAgICByaWdodFxyXG4gICAqICAgICAgICAgIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAqIHRvcCAgKHkpIHwgbGVmdFRvcCAgICAgY2VudGVyVG9wICAgICByaWdodFRvcFxyXG4gICAqIGNlbnRlclkgIHwgbGVmdENlbnRlciAgY2VudGVyICAgICAgICByaWdodENlbnRlclxyXG4gICAqIGJvdHRvbSAgIHwgbGVmdEJvdHRvbSAgY2VudGVyQm90dG9tICByaWdodEJvdHRvbVxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyByZXF1aXJlcyBjb21wdXRhdGlvbiBvZiB0aGlzIG5vZGUncyBzdWJ0cmVlIGJvdW5kcywgd2hpY2ggbWF5IGluY3VyIHNvbWUgcGVyZm9ybWFuY2UgbG9zcy5cclxuICAgKi9cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgcG9zaXRpb24gb2YgdGhlIHVwcGVyLWxlZnQgY29ybmVyIG9mIHRoaXMgbm9kZSdzIGJvdW5kcyB0byB0aGUgc3BlY2lmaWVkIHBvaW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRMZWZ0VG9wKCBsZWZ0VG9wOiBWZWN0b3IyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbGVmdFRvcC5pc0Zpbml0ZSgpLCAnbGVmdFRvcCBzaG91bGQgYmUgYSBmaW5pdGUgVmVjdG9yMicgKTtcclxuXHJcbiAgICBjb25zdCBjdXJyZW50TGVmdFRvcCA9IHRoaXMuZ2V0TGVmdFRvcCgpO1xyXG4gICAgaWYgKCBjdXJyZW50TGVmdFRvcC5pc0Zpbml0ZSgpICkge1xyXG4gICAgICB0aGlzLnRyYW5zbGF0ZSggbGVmdFRvcC5taW51cyggY3VycmVudExlZnRUb3AgKSwgdHJ1ZSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldExlZnRUb3AoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgbGVmdFRvcCggdmFsdWU6IFZlY3RvcjIgKSB7XHJcbiAgICB0aGlzLnNldExlZnRUb3AoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0TGVmdFRvcCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBsZWZ0VG9wKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TGVmdFRvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgdXBwZXItbGVmdCBjb3JuZXIgb2YgdGhpcyBub2RlJ3MgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMZWZ0VG9wKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Qm91bmRzKCkuZ2V0TGVmdFRvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgcG9zaXRpb24gb2YgdGhlIGNlbnRlci10b3AgbG9jYXRpb24gb2YgdGhpcyBub2RlJ3MgYm91bmRzIHRvIHRoZSBzcGVjaWZpZWQgcG9pbnQuXHJcbiAgICovXHJcbiAgcHVibGljIHNldENlbnRlclRvcCggY2VudGVyVG9wOiBWZWN0b3IyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggY2VudGVyVG9wLmlzRmluaXRlKCksICdjZW50ZXJUb3Agc2hvdWxkIGJlIGEgZmluaXRlIFZlY3RvcjInICk7XHJcblxyXG4gICAgY29uc3QgY3VycmVudENlbnRlclRvcCA9IHRoaXMuZ2V0Q2VudGVyVG9wKCk7XHJcbiAgICBpZiAoIGN1cnJlbnRDZW50ZXJUb3AuaXNGaW5pdGUoKSApIHtcclxuICAgICAgdGhpcy50cmFuc2xhdGUoIGNlbnRlclRvcC5taW51cyggY3VycmVudENlbnRlclRvcCApLCB0cnVlICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0Q2VudGVyVG9wKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGNlbnRlclRvcCggdmFsdWU6IFZlY3RvcjIgKSB7XHJcbiAgICB0aGlzLnNldENlbnRlclRvcCggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRDZW50ZXJUb3AoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgY2VudGVyVG9wKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q2VudGVyVG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjZW50ZXItdG9wIGxvY2F0aW9uIG9mIHRoaXMgbm9kZSdzIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q2VudGVyVG9wKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Qm91bmRzKCkuZ2V0Q2VudGVyVG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBwb3NpdGlvbiBvZiB0aGUgdXBwZXItcmlnaHQgY29ybmVyIG9mIHRoaXMgbm9kZSdzIGJvdW5kcyB0byB0aGUgc3BlY2lmaWVkIHBvaW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRSaWdodFRvcCggcmlnaHRUb3A6IFZlY3RvcjIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCByaWdodFRvcC5pc0Zpbml0ZSgpLCAncmlnaHRUb3Agc2hvdWxkIGJlIGEgZmluaXRlIFZlY3RvcjInICk7XHJcblxyXG4gICAgY29uc3QgY3VycmVudFJpZ2h0VG9wID0gdGhpcy5nZXRSaWdodFRvcCgpO1xyXG4gICAgaWYgKCBjdXJyZW50UmlnaHRUb3AuaXNGaW5pdGUoKSApIHtcclxuICAgICAgdGhpcy50cmFuc2xhdGUoIHJpZ2h0VG9wLm1pbnVzKCBjdXJyZW50UmlnaHRUb3AgKSwgdHJ1ZSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldFJpZ2h0VG9wKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IHJpZ2h0VG9wKCB2YWx1ZTogVmVjdG9yMiApIHtcclxuICAgIHRoaXMuc2V0UmlnaHRUb3AoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0UmlnaHRUb3AoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgcmlnaHRUb3AoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRSaWdodFRvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgdXBwZXItcmlnaHQgY29ybmVyIG9mIHRoaXMgbm9kZSdzIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0UmlnaHRUb3AoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRCb3VuZHMoKS5nZXRSaWdodFRvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgcG9zaXRpb24gb2YgdGhlIGNlbnRlci1sZWZ0IG9mIHRoaXMgbm9kZSdzIGJvdW5kcyB0byB0aGUgc3BlY2lmaWVkIHBvaW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRMZWZ0Q2VudGVyKCBsZWZ0Q2VudGVyOiBWZWN0b3IyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbGVmdENlbnRlci5pc0Zpbml0ZSgpLCAnbGVmdENlbnRlciBzaG91bGQgYmUgYSBmaW5pdGUgVmVjdG9yMicgKTtcclxuXHJcbiAgICBjb25zdCBjdXJyZW50TGVmdENlbnRlciA9IHRoaXMuZ2V0TGVmdENlbnRlcigpO1xyXG4gICAgaWYgKCBjdXJyZW50TGVmdENlbnRlci5pc0Zpbml0ZSgpICkge1xyXG4gICAgICB0aGlzLnRyYW5zbGF0ZSggbGVmdENlbnRlci5taW51cyggY3VycmVudExlZnRDZW50ZXIgKSwgdHJ1ZSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldExlZnRDZW50ZXIoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgbGVmdENlbnRlciggdmFsdWU6IFZlY3RvcjIgKSB7XHJcbiAgICB0aGlzLnNldExlZnRDZW50ZXIoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0TGVmdENlbnRlcigpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBsZWZ0Q2VudGVyKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TGVmdENlbnRlcigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY2VudGVyLWxlZnQgY29ybmVyIG9mIHRoaXMgbm9kZSdzIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TGVmdENlbnRlcigpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldEJvdW5kcygpLmdldExlZnRDZW50ZXIoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGNlbnRlciBvZiB0aGlzIG5vZGUncyBib3VuZHMgdG8gdGhlIHNwZWNpZmllZCBwb2ludC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0Q2VudGVyKCBjZW50ZXI6IFZlY3RvcjIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBjZW50ZXIuaXNGaW5pdGUoKSwgJ2NlbnRlciBzaG91bGQgYmUgYSBmaW5pdGUgVmVjdG9yMicgKTtcclxuXHJcbiAgICBjb25zdCBjdXJyZW50Q2VudGVyID0gdGhpcy5nZXRDZW50ZXIoKTtcclxuICAgIGlmICggY3VycmVudENlbnRlci5pc0Zpbml0ZSgpICkge1xyXG4gICAgICB0aGlzLnRyYW5zbGF0ZSggY2VudGVyLm1pbnVzKCBjdXJyZW50Q2VudGVyICksIHRydWUgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRDZW50ZXIoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgY2VudGVyKCB2YWx1ZTogVmVjdG9yMiApIHtcclxuICAgIHRoaXMuc2V0Q2VudGVyKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldENlbnRlcigpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBjZW50ZXIoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRDZW50ZXIoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGNlbnRlciBvZiB0aGlzIG5vZGUncyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldENlbnRlcigpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldEJvdW5kcygpLmdldENlbnRlcigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgcG9zaXRpb24gb2YgdGhlIGNlbnRlci1yaWdodCBvZiB0aGlzIG5vZGUncyBib3VuZHMgdG8gdGhlIHNwZWNpZmllZCBwb2ludC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0UmlnaHRDZW50ZXIoIHJpZ2h0Q2VudGVyOiBWZWN0b3IyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcmlnaHRDZW50ZXIuaXNGaW5pdGUoKSwgJ3JpZ2h0Q2VudGVyIHNob3VsZCBiZSBhIGZpbml0ZSBWZWN0b3IyJyApO1xyXG5cclxuICAgIGNvbnN0IGN1cnJlbnRSaWdodENlbnRlciA9IHRoaXMuZ2V0UmlnaHRDZW50ZXIoKTtcclxuICAgIGlmICggY3VycmVudFJpZ2h0Q2VudGVyLmlzRmluaXRlKCkgKSB7XHJcbiAgICAgIHRoaXMudHJhbnNsYXRlKCByaWdodENlbnRlci5taW51cyggY3VycmVudFJpZ2h0Q2VudGVyICksIHRydWUgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRSaWdodENlbnRlcigpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCByaWdodENlbnRlciggdmFsdWU6IFZlY3RvcjIgKSB7XHJcbiAgICB0aGlzLnNldFJpZ2h0Q2VudGVyKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFJpZ2h0Q2VudGVyKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHJpZ2h0Q2VudGVyKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0UmlnaHRDZW50ZXIoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGNlbnRlci1yaWdodCBvZiB0aGlzIG5vZGUncyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFJpZ2h0Q2VudGVyKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Qm91bmRzKCkuZ2V0UmlnaHRDZW50ZXIoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHBvc2l0aW9uIG9mIHRoZSBsb3dlci1sZWZ0IGNvcm5lciBvZiB0aGlzIG5vZGUncyBib3VuZHMgdG8gdGhlIHNwZWNpZmllZCBwb2ludC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0TGVmdEJvdHRvbSggbGVmdEJvdHRvbTogVmVjdG9yMiApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGxlZnRCb3R0b20uaXNGaW5pdGUoKSwgJ2xlZnRCb3R0b20gc2hvdWxkIGJlIGEgZmluaXRlIFZlY3RvcjInICk7XHJcblxyXG4gICAgY29uc3QgY3VycmVudExlZnRCb3R0b20gPSB0aGlzLmdldExlZnRCb3R0b20oKTtcclxuICAgIGlmICggY3VycmVudExlZnRCb3R0b20uaXNGaW5pdGUoKSApIHtcclxuICAgICAgdGhpcy50cmFuc2xhdGUoIGxlZnRCb3R0b20ubWludXMoIGN1cnJlbnRMZWZ0Qm90dG9tICksIHRydWUgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRMZWZ0Qm90dG9tKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGxlZnRCb3R0b20oIHZhbHVlOiBWZWN0b3IyICkge1xyXG4gICAgdGhpcy5zZXRMZWZ0Qm90dG9tKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldExlZnRCb3R0b20oKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgbGVmdEJvdHRvbSgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExlZnRCb3R0b20oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGxvd2VyLWxlZnQgY29ybmVyIG9mIHRoaXMgbm9kZSdzIGJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TGVmdEJvdHRvbSgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldEJvdW5kcygpLmdldExlZnRCb3R0b20oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHBvc2l0aW9uIG9mIHRoZSBjZW50ZXItYm90dG9tIG9mIHRoaXMgbm9kZSdzIGJvdW5kcyB0byB0aGUgc3BlY2lmaWVkIHBvaW50LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRDZW50ZXJCb3R0b20oIGNlbnRlckJvdHRvbTogVmVjdG9yMiApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGNlbnRlckJvdHRvbS5pc0Zpbml0ZSgpLCAnY2VudGVyQm90dG9tIHNob3VsZCBiZSBhIGZpbml0ZSBWZWN0b3IyJyApO1xyXG5cclxuICAgIGNvbnN0IGN1cnJlbnRDZW50ZXJCb3R0b20gPSB0aGlzLmdldENlbnRlckJvdHRvbSgpO1xyXG4gICAgaWYgKCBjdXJyZW50Q2VudGVyQm90dG9tLmlzRmluaXRlKCkgKSB7XHJcbiAgICAgIHRoaXMudHJhbnNsYXRlKCBjZW50ZXJCb3R0b20ubWludXMoIGN1cnJlbnRDZW50ZXJCb3R0b20gKSwgdHJ1ZSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldENlbnRlckJvdHRvbSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBjZW50ZXJCb3R0b20oIHZhbHVlOiBWZWN0b3IyICkge1xyXG4gICAgdGhpcy5zZXRDZW50ZXJCb3R0b20oIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0Q2VudGVyQm90dG9tKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGNlbnRlckJvdHRvbSgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldENlbnRlckJvdHRvbSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY2VudGVyLWJvdHRvbSBvZiB0aGlzIG5vZGUncyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldENlbnRlckJvdHRvbSgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldEJvdW5kcygpLmdldENlbnRlckJvdHRvbSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgcG9zaXRpb24gb2YgdGhlIGxvd2VyLXJpZ2h0IGNvcm5lciBvZiB0aGlzIG5vZGUncyBib3VuZHMgdG8gdGhlIHNwZWNpZmllZCBwb2ludC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0UmlnaHRCb3R0b20oIHJpZ2h0Qm90dG9tOiBWZWN0b3IyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcmlnaHRCb3R0b20uaXNGaW5pdGUoKSwgJ3JpZ2h0Qm90dG9tIHNob3VsZCBiZSBhIGZpbml0ZSBWZWN0b3IyJyApO1xyXG5cclxuICAgIGNvbnN0IGN1cnJlbnRSaWdodEJvdHRvbSA9IHRoaXMuZ2V0UmlnaHRCb3R0b20oKTtcclxuICAgIGlmICggY3VycmVudFJpZ2h0Qm90dG9tLmlzRmluaXRlKCkgKSB7XHJcbiAgICAgIHRoaXMudHJhbnNsYXRlKCByaWdodEJvdHRvbS5taW51cyggY3VycmVudFJpZ2h0Qm90dG9tICksIHRydWUgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRSaWdodEJvdHRvbSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCByaWdodEJvdHRvbSggdmFsdWU6IFZlY3RvcjIgKSB7XHJcbiAgICB0aGlzLnNldFJpZ2h0Qm90dG9tKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFJpZ2h0Qm90dG9tKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHJpZ2h0Qm90dG9tKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0UmlnaHRCb3R0b20oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGxvd2VyLXJpZ2h0IGNvcm5lciBvZiB0aGlzIG5vZGUncyBib3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFJpZ2h0Qm90dG9tKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Qm91bmRzKCkuZ2V0UmlnaHRCb3R0b20oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHdpZHRoIG9mIHRoaXMgbm9kZSdzIGJvdW5kaW5nIGJveCAoaW4gdGhlIHBhcmVudCBjb29yZGluYXRlIGZyYW1lKS5cclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgbWF5IHJlcXVpcmUgY29tcHV0YXRpb24gb2YgdGhpcyBub2RlJ3Mgc3VidHJlZSBib3VuZHMsIHdoaWNoIG1heSBpbmN1ciBzb21lIHBlcmZvcm1hbmNlIGxvc3MuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFdpZHRoKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRCb3VuZHMoKS5nZXRXaWR0aCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFdpZHRoKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHdpZHRoKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRXaWR0aCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgaGVpZ2h0IG9mIHRoaXMgbm9kZSdzIGJvdW5kaW5nIGJveCAoaW4gdGhlIHBhcmVudCBjb29yZGluYXRlIGZyYW1lKS5cclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgbWF5IHJlcXVpcmUgY29tcHV0YXRpb24gb2YgdGhpcyBub2RlJ3Mgc3VidHJlZSBib3VuZHMsIHdoaWNoIG1heSBpbmN1ciBzb21lIHBlcmZvcm1hbmNlIGxvc3MuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEhlaWdodCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Qm91bmRzKCkuZ2V0SGVpZ2h0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0SGVpZ2h0KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGhlaWdodCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0SGVpZ2h0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB3aWR0aCBvZiB0aGlzIG5vZGUncyBib3VuZGluZyBib3ggKGluIHRoZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lKS5cclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgbWF5IHJlcXVpcmUgY29tcHV0YXRpb24gb2YgdGhpcyBub2RlJ3Mgc3VidHJlZSBib3VuZHMsIHdoaWNoIG1heSBpbmN1ciBzb21lIHBlcmZvcm1hbmNlIGxvc3MuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExvY2FsV2lkdGgoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsQm91bmRzKCkuZ2V0V2lkdGgoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRMb2NhbFdpZHRoKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGxvY2FsV2lkdGgoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsV2lkdGgoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGhlaWdodCBvZiB0aGlzIG5vZGUncyBib3VuZGluZyBib3ggKGluIHRoZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lKS5cclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgbWF5IHJlcXVpcmUgY29tcHV0YXRpb24gb2YgdGhpcyBub2RlJ3Mgc3VidHJlZSBib3VuZHMsIHdoaWNoIG1heSBpbmN1ciBzb21lIHBlcmZvcm1hbmNlIGxvc3MuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExvY2FsSGVpZ2h0KCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbEJvdW5kcygpLmdldEhlaWdodCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldExvY2FsSGVpZ2h0KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGxvY2FsSGVpZ2h0KCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbEhlaWdodCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgWCB2YWx1ZSBvZiB0aGUgbGVmdCBzaWRlIG9mIHRoZSBib3VuZGluZyBib3ggb2YgdGhpcyBOb2RlIChpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSkuXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSByZXF1aXJlIGNvbXB1dGF0aW9uIG9mIHRoaXMgbm9kZSdzIHN1YnRyZWUgYm91bmRzLCB3aGljaCBtYXkgaW5jdXIgc29tZSBwZXJmb3JtYW5jZSBsb3NzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMb2NhbExlZnQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsQm91bmRzKCkubWluWDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRMZWZ0KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGxvY2FsTGVmdCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxMZWZ0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBYIHZhbHVlIG9mIHRoZSByaWdodCBzaWRlIG9mIHRoZSBib3VuZGluZyBib3ggb2YgdGhpcyBOb2RlIChpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSkuXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSByZXF1aXJlIGNvbXB1dGF0aW9uIG9mIHRoaXMgbm9kZSdzIHN1YnRyZWUgYm91bmRzLCB3aGljaCBtYXkgaW5jdXIgc29tZSBwZXJmb3JtYW5jZSBsb3NzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMb2NhbFJpZ2h0KCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbEJvdW5kcygpLm1heFg7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0UmlnaHQoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgbG9jYWxSaWdodCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxSaWdodCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgWCB2YWx1ZSBvZiB0aGlzIG5vZGUncyBob3Jpem9udGFsIGNlbnRlciAoaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUpXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSByZXF1aXJlIGNvbXB1dGF0aW9uIG9mIHRoaXMgbm9kZSdzIHN1YnRyZWUgYm91bmRzLCB3aGljaCBtYXkgaW5jdXIgc29tZSBwZXJmb3JtYW5jZSBsb3NzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMb2NhbENlbnRlclgoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsQm91bmRzKCkuZ2V0Q2VudGVyWCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldENlbnRlclgoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgbG9jYWxDZW50ZXJYKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbENlbnRlclgoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIFkgdmFsdWUgb2YgdGhpcyBub2RlJ3MgdmVydGljYWwgY2VudGVyIChpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSlcclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgbWF5IHJlcXVpcmUgY29tcHV0YXRpb24gb2YgdGhpcyBub2RlJ3Mgc3VidHJlZSBib3VuZHMsIHdoaWNoIG1heSBpbmN1ciBzb21lIHBlcmZvcm1hbmNlIGxvc3MuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExvY2FsQ2VudGVyWSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxCb3VuZHMoKS5nZXRDZW50ZXJZKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0Q2VudGVyWCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBsb2NhbENlbnRlclkoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsQ2VudGVyWSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgbG93ZXN0IFkgdmFsdWUgb2YgdGhpcyBub2RlJ3MgYm91bmRpbmcgYm94IChpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSkuXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIG1heSByZXF1aXJlIGNvbXB1dGF0aW9uIG9mIHRoaXMgbm9kZSdzIHN1YnRyZWUgYm91bmRzLCB3aGljaCBtYXkgaW5jdXIgc29tZSBwZXJmb3JtYW5jZSBsb3NzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMb2NhbFRvcCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxCb3VuZHMoKS5taW5ZO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFRvcCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBsb2NhbFRvcCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxUb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGhpZ2hlc3QgWSB2YWx1ZSBvZiB0aGlzIG5vZGUncyBib3VuZGluZyBib3ggKGluIHRoZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lKS5cclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgbWF5IHJlcXVpcmUgY29tcHV0YXRpb24gb2YgdGhpcyBub2RlJ3Mgc3VidHJlZSBib3VuZHMsIHdoaWNoIG1heSBpbmN1ciBzb21lIHBlcmZvcm1hbmNlIGxvc3MuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExvY2FsQm90dG9tKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbEJvdW5kcygpLm1heFk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0TG9jYWxCb3R0b20oKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgbG9jYWxCb3R0b20oKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsQm90dG9tKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB1cHBlci1sZWZ0IGNvcm5lciBvZiB0aGlzIG5vZGUncyBsb2NhbEJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TG9jYWxMZWZ0VG9wKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxCb3VuZHMoKS5nZXRMZWZ0VG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0TG9jYWxMZWZ0VG9wKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGxvY2FsTGVmdFRvcCgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsTGVmdFRvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY2VudGVyLXRvcCBsb2NhdGlvbiBvZiB0aGlzIG5vZGUncyBsb2NhbEJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TG9jYWxDZW50ZXJUb3AoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbEJvdW5kcygpLmdldENlbnRlclRvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldExvY2FsQ2VudGVyVG9wKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGxvY2FsQ2VudGVyVG9wKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxDZW50ZXJUb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHVwcGVyLXJpZ2h0IGNvcm5lciBvZiB0aGlzIG5vZGUncyBsb2NhbEJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TG9jYWxSaWdodFRvcCgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsQm91bmRzKCkuZ2V0UmlnaHRUb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRMb2NhbFJpZ2h0VG9wKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGxvY2FsUmlnaHRUb3AoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbFJpZ2h0VG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjZW50ZXItbGVmdCBjb3JuZXIgb2YgdGhpcyBub2RlJ3MgbG9jYWxCb3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExvY2FsTGVmdENlbnRlcigpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsQm91bmRzKCkuZ2V0TGVmdENlbnRlcigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldExvY2FsTGVmdENlbnRlcigpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBsb2NhbExlZnRDZW50ZXIoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbExlZnRDZW50ZXIoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGNlbnRlciBvZiB0aGlzIG5vZGUncyBsb2NhbEJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TG9jYWxDZW50ZXIoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbEJvdW5kcygpLmdldENlbnRlcigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldExvY2FsQ2VudGVyKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGxvY2FsQ2VudGVyKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxDZW50ZXIoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGNlbnRlci1yaWdodCBvZiB0aGlzIG5vZGUncyBsb2NhbEJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TG9jYWxSaWdodENlbnRlcigpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsQm91bmRzKCkuZ2V0UmlnaHRDZW50ZXIoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRMb2NhbFJpZ2h0Q2VudGVyKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGxvY2FsUmlnaHRDZW50ZXIoKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbFJpZ2h0Q2VudGVyKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBsb3dlci1sZWZ0IGNvcm5lciBvZiB0aGlzIG5vZGUncyBsb2NhbEJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TG9jYWxMZWZ0Qm90dG9tKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxCb3VuZHMoKS5nZXRMZWZ0Qm90dG9tKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0TG9jYWxMZWZ0Qm90dG9tKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGxvY2FsTGVmdEJvdHRvbSgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsTGVmdEJvdHRvbSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY2VudGVyLWJvdHRvbSBvZiB0aGlzIG5vZGUncyBsb2NhbEJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TG9jYWxDZW50ZXJCb3R0b20oKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbEJvdW5kcygpLmdldENlbnRlckJvdHRvbSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldExvY2FsQ2VudGVyQm90dG9tKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGxvY2FsQ2VudGVyQm90dG9tKCk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxDZW50ZXJCb3R0b20oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGxvd2VyLXJpZ2h0IGNvcm5lciBvZiB0aGlzIG5vZGUncyBsb2NhbEJvdW5kcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TG9jYWxSaWdodEJvdHRvbSgpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmdldExvY2FsQm91bmRzKCkuZ2V0UmlnaHRCb3R0b20oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRMb2NhbFJpZ2h0Qm90dG9tKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGxvY2FsUmlnaHRCb3R0b20oKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMb2NhbFJpZ2h0Qm90dG9tKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB1bmlxdWUgaW50ZWdyYWwgSUQgZm9yIHRoaXMgbm9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0SWQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9pZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRJZCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBpZCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0SWQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCB3aGVuIG91ciB2aXNpYmlsaXR5IFByb3BlcnR5IGNoYW5nZXMgdmFsdWVzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgb25WaXNpYmxlUHJvcGVydHlDaGFuZ2UoIHZpc2libGU6IGJvb2xlYW4gKTogdm9pZCB7XHJcblxyXG4gICAgLy8gY2hhbmdpbmcgdmlzaWJpbGl0eSBjYW4gYWZmZWN0IHBpY2thYmlsaXR5IHBydW5pbmcsIHdoaWNoIGFmZmVjdHMgbW91c2UvdG91Y2ggYm91bmRzXHJcbiAgICB0aGlzLl9waWNrZXIub25WaXNpYmlsaXR5Q2hhbmdlKCk7XHJcblxyXG4gICAgaWYgKCBhc3NlcnRTbG93ICkgeyB0aGlzLl9waWNrZXIuYXVkaXQoKTsgfVxyXG5cclxuICAgIC8vIERlZmluZWQgaW4gUGFyYWxsZWxET00uanNcclxuICAgIHRoaXMuX3Bkb21EaXNwbGF5c0luZm8ub25WaXNpYmlsaXR5Q2hhbmdlKCB2aXNpYmxlICk7XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5fcGFyZW50cy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5fcGFyZW50c1sgaSBdO1xyXG4gICAgICBpZiAoIHBhcmVudC5fZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcyApIHtcclxuICAgICAgICBwYXJlbnQuaW52YWxpZGF0ZUNoaWxkQm91bmRzKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgd2hhdCBQcm9wZXJ0eSBvdXIgdmlzaWJsZVByb3BlcnR5IGlzIGJhY2tlZCBieSwgc28gdGhhdCBjaGFuZ2VzIHRvIHRoaXMgcHJvdmlkZWQgUHJvcGVydHkgd2lsbCBjaGFuZ2UgdGhpc1xyXG4gICAqIE5vZGUncyB2aXNpYmlsaXR5LCBhbmQgdmljZSB2ZXJzYS4gVGhpcyBkb2VzIG5vdCBjaGFuZ2UgdGhpcy5fdmlzaWJsZVByb3BlcnR5LiBTZWUgVGlueUZvcndhcmRpbmdQcm9wZXJ0eS5zZXRUYXJnZXRQcm9wZXJ0eSgpXHJcbiAgICogZm9yIG1vcmUgaW5mby5cclxuICAgKlxyXG4gICAqIE5PVEUgRm9yIFBoRVQtaU8gdXNlOlxyXG4gICAqIEFsbCBQaEVULWlPIGluc3RydW1lbnRlZCBOb2RlcyBjcmVhdGUgdGhlaXIgb3duIGluc3RydW1lbnRlZCB2aXNpYmxlUHJvcGVydHkgKGlmIG9uZSBpcyBub3QgcGFzc2VkIGluIGFzXHJcbiAgICogYW4gb3B0aW9uKS4gT25jZSBhIE5vZGUncyB2aXNpYmxlUHJvcGVydHkgaGFzIGJlZW4gcmVnaXN0ZXJlZCB3aXRoIFBoRVQtaU8sIGl0IGNhbm5vdCBiZSBcInN3YXBwZWQgb3V0XCIgZm9yIGFub3RoZXIuXHJcbiAgICogSWYgeW91IG5lZWQgdG8gXCJkZWxheVwiIHNldHRpbmcgYW4gaW5zdHJ1bWVudGVkIHZpc2libGVQcm9wZXJ0eSB0byB0aGlzIG5vZGUsIHBhc3MgcGhldGlvVmlzaWJsZVByb3BlcnR5SW5zdHJ1bWVudGVkXHJcbiAgICogdG8gaW5zdHJ1bWVudGF0aW9uIGNhbGwgdG8gdGhpcyBOb2RlICh3aGVyZSBUYW5kZW0gaXMgcHJvdmlkZWQpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRWaXNpYmxlUHJvcGVydHkoIG5ld1RhcmdldDogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj4gfCBudWxsICk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHRoaXMuX3Zpc2libGVQcm9wZXJ0eS5zZXRUYXJnZXRQcm9wZXJ0eSggbmV3VGFyZ2V0LCB0aGlzLCBWSVNJQkxFX1BST1BFUlRZX1RBTkRFTV9OQU1FICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0VmlzaWJsZVByb3BlcnR5KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IHZpc2libGVQcm9wZXJ0eSggcHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+IHwgbnVsbCApIHtcclxuICAgIHRoaXMuc2V0VmlzaWJsZVByb3BlcnR5KCBwcm9wZXJ0eSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFZpc2libGVQcm9wZXJ0eSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCB2aXNpYmxlUHJvcGVydHkoKTogVFByb3BlcnR5PGJvb2xlYW4+IHtcclxuICAgIHJldHVybiB0aGlzLmdldFZpc2libGVQcm9wZXJ0eSgpO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGlzIE5vZGUncyB2aXNpYmxlUHJvcGVydHkuIE5vdGUhIFRoaXMgaXMgbm90IHRoZSByZWNpcHJvY2FsIG9mIHNldFZpc2libGVQcm9wZXJ0eS4gTm9kZS5wcm90b3R5cGUuX3Zpc2libGVQcm9wZXJ0eVxyXG4gICAqIGlzIGEgVGlueUZvcndhcmRpbmdQcm9wZXJ0eSwgYW5kIGlzIHNldCB1cCB0byBsaXN0ZW4gdG8gY2hhbmdlcyBmcm9tIHRoZSB2aXNpYmxlUHJvcGVydHkgcHJvdmlkZWQgYnlcclxuICAgKiBzZXRWaXNpYmxlUHJvcGVydHkoKSwgYnV0IHRoZSB1bmRlcmx5aW5nIHJlZmVyZW5jZSBkb2VzIG5vdCBjaGFuZ2UuIFRoaXMgbWVhbnMgdGhlIGZvbGxvd2luZzpcclxuICAgKiAgICAgKiBjb25zdCBteU5vZGUgPSBuZXcgTm9kZSgpO1xyXG4gICAqIGNvbnN0IHZpc2libGVQcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSggZmFsc2UgKTtcclxuICAgKiBteU5vZGUuc2V0VmlzaWJsZVByb3BlcnR5KCB2aXNpYmxlUHJvcGVydHkgKVxyXG4gICAqID0+IG15Tm9kZS5nZXRWaXNpYmxlUHJvcGVydHkoKSAhPT0gdmlzaWJsZVByb3BlcnR5ICghISEhISEpXHJcbiAgICpcclxuICAgKiBQbGVhc2UgdXNlIHRoaXMgd2l0aCBjYXV0aW9uLiBTZWUgc2V0VmlzaWJsZVByb3BlcnR5KCkgZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIGdldFZpc2libGVQcm9wZXJ0eSgpOiBUUHJvcGVydHk8Ym9vbGVhbj4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX3Zpc2libGVQcm9wZXJ0eTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgd2hldGhlciB0aGlzIE5vZGUgaXMgdmlzaWJsZS4gIERPIE5PVCBvdmVycmlkZSB0aGlzIGFzIGEgd2F5IG9mIGFkZGluZyBhZGRpdGlvbmFsIGJlaGF2aW9yIHdoZW4gYSBOb2RlJ3NcclxuICAgKiB2aXNpYmlsaXR5IGNoYW5nZXMsIGFkZCBhIGxpc3RlbmVyIHRvIHRoaXMudmlzaWJsZVByb3BlcnR5IGluc3RlYWQuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFZpc2libGUoIHZpc2libGU6IGJvb2xlYW4gKTogdGhpcyB7XHJcbiAgICB0aGlzLnZpc2libGVQcm9wZXJ0eS5zZXQoIHZpc2libGUgKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldFZpc2libGUoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgdmlzaWJsZSggdmFsdWU6IGJvb2xlYW4gKSB7XHJcbiAgICB0aGlzLnNldFZpc2libGUoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgaXNWaXNpYmxlKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHZpc2libGUoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5pc1Zpc2libGUoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciB0aGlzIE5vZGUgaXMgdmlzaWJsZS5cclxuICAgKi9cclxuICBwdWJsaWMgaXNWaXNpYmxlKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMudmlzaWJsZVByb3BlcnR5LnZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXNlIHRoaXMgdG8gYXV0b21hdGljYWxseSBjcmVhdGUgYSBmb3J3YXJkZWQsIFBoRVQtaU8gaW5zdHJ1bWVudGVkIHZpc2libGVQcm9wZXJ0eSBpbnRlcm5hbCB0byBOb2RlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRQaGV0aW9WaXNpYmxlUHJvcGVydHlJbnN0cnVtZW50ZWQoIHBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZDogYm9vbGVhbiApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLl92aXNpYmxlUHJvcGVydHkuc2V0VGFyZ2V0UHJvcGVydHlJbnN0cnVtZW50ZWQoIHBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZCwgdGhpcyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldFBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBwaGV0aW9WaXNpYmxlUHJvcGVydHlJbnN0cnVtZW50ZWQoIHZhbHVlOiBib29sZWFuICkge1xyXG4gICAgdGhpcy5zZXRQaGV0aW9WaXNpYmxlUHJvcGVydHlJbnN0cnVtZW50ZWQoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0UGhldGlvVmlzaWJsZVByb3BlcnR5SW5zdHJ1bWVudGVkKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmdldFBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZCgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldFBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl92aXNpYmxlUHJvcGVydHkuZ2V0VGFyZ2V0UHJvcGVydHlJbnN0cnVtZW50ZWQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN3YXAgdGhlIHZpc2liaWxpdHkgb2YgdGhpcyBub2RlIHdpdGggYW5vdGhlciBub2RlLiBUaGUgTm9kZSB0aGF0IGlzIG1hZGUgdmlzaWJsZSB3aWxsIHJlY2VpdmUga2V5Ym9hcmQgZm9jdXNcclxuICAgKiBpZiBpdCBpcyBmb2N1c2FibGUgYW5kIHRoZSBwcmV2aW91c2x5IHZpc2libGUgTm9kZSBoYWQgZm9jdXMuXHJcbiAgICovXHJcbiAgcHVibGljIHN3YXBWaXNpYmlsaXR5KCBvdGhlck5vZGU6IE5vZGUgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLnZpc2libGUgIT09IG90aGVyTm9kZS52aXNpYmxlICk7XHJcblxyXG4gICAgY29uc3QgdmlzaWJsZU5vZGUgPSB0aGlzLnZpc2libGUgPyB0aGlzIDogb3RoZXJOb2RlO1xyXG4gICAgY29uc3QgaW52aXNpYmxlTm9kZSA9IHRoaXMudmlzaWJsZSA/IG90aGVyTm9kZSA6IHRoaXM7XHJcblxyXG4gICAgLy8gaWYgdGhlIHZpc2libGUgbm9kZSBoYXMgZm9jdXMgd2Ugd2lsbCByZXN0b3JlIGZvY3VzIG9uIHRoZSBpbnZpc2libGUgTm9kZSBvbmNlIGl0IGlzIHZpc2libGVcclxuICAgIGNvbnN0IHZpc2libGVOb2RlRm9jdXNlZCA9IHZpc2libGVOb2RlLmZvY3VzZWQ7XHJcblxyXG4gICAgdmlzaWJsZU5vZGUudmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgaW52aXNpYmxlTm9kZS52aXNpYmxlID0gdHJ1ZTtcclxuXHJcbiAgICBpZiAoIHZpc2libGVOb2RlRm9jdXNlZCAmJiBpbnZpc2libGVOb2RlLmZvY3VzYWJsZSApIHtcclxuICAgICAgaW52aXNpYmxlTm9kZS5mb2N1cygpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgb3BhY2l0eSBvZiB0aGlzIE5vZGUgKGFuZCBpdHMgc3ViLXRyZWUpLCB3aGVyZSAwIGlzIGZ1bGx5IHRyYW5zcGFyZW50LCBhbmQgMSBpcyBmdWxseSBvcGFxdWUuICBWYWx1ZXNcclxuICAgKiBvdXRzaWRlIG9mIHRoYXQgcmFuZ2UgdGhyb3cgYW4gRXJyb3IuXHJcbiAgICogQHRocm93cyBFcnJvciBpZiBvcGFjaXR5IG91dCBvZiByYW5nZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRPcGFjaXR5KCBvcGFjaXR5OiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggb3BhY2l0eSApLCAnb3BhY2l0eSBzaG91bGQgYmUgYSBmaW5pdGUgbnVtYmVyJyApO1xyXG5cclxuICAgIGlmICggb3BhY2l0eSA8IDAgfHwgb3BhY2l0eSA+IDEgKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggYG9wYWNpdHkgb3V0IG9mIHJhbmdlOiAke29wYWNpdHl9YCApO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMub3BhY2l0eVByb3BlcnR5LnZhbHVlID0gb3BhY2l0eTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRPcGFjaXR5KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IG9wYWNpdHkoIHZhbHVlOiBudW1iZXIgKSB7XHJcbiAgICB0aGlzLnNldE9wYWNpdHkoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0T3BhY2l0eSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBvcGFjaXR5KCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRPcGFjaXR5KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBvcGFjaXR5IG9mIHRoaXMgbm9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0T3BhY2l0eSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMub3BhY2l0eVByb3BlcnR5LnZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgZGlzYWJsZWRPcGFjaXR5IG9mIHRoaXMgTm9kZSAoYW5kIGl0cyBzdWItdHJlZSksIHdoZXJlIDAgaXMgZnVsbHkgdHJhbnNwYXJlbnQsIGFuZCAxIGlzIGZ1bGx5IG9wYXF1ZS5cclxuICAgKiBWYWx1ZXMgb3V0c2lkZSBvZiB0aGF0IHJhbmdlIHRocm93IGFuIEVycm9yLlxyXG4gICAqIEB0aHJvd3MgRXJyb3IgaWYgZGlzYWJsZWRPcGFjaXR5IG91dCBvZiByYW5nZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXREaXNhYmxlZE9wYWNpdHkoIGRpc2FibGVkT3BhY2l0eTogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIGRpc2FibGVkT3BhY2l0eSApLCAnZGlzYWJsZWRPcGFjaXR5IHNob3VsZCBiZSBhIGZpbml0ZSBudW1iZXInICk7XHJcblxyXG4gICAgaWYgKCBkaXNhYmxlZE9wYWNpdHkgPCAwIHx8IGRpc2FibGVkT3BhY2l0eSA+IDEgKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggYGRpc2FibGVkT3BhY2l0eSBvdXQgb2YgcmFuZ2U6ICR7ZGlzYWJsZWRPcGFjaXR5fWAgKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmRpc2FibGVkT3BhY2l0eVByb3BlcnR5LnZhbHVlID0gZGlzYWJsZWRPcGFjaXR5O1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldERpc2FibGVkT3BhY2l0eSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBkaXNhYmxlZE9wYWNpdHkoIHZhbHVlOiBudW1iZXIgKSB7XHJcbiAgICB0aGlzLnNldERpc2FibGVkT3BhY2l0eSggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXREaXNhYmxlZE9wYWNpdHkoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgZGlzYWJsZWRPcGFjaXR5KCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXREaXNhYmxlZE9wYWNpdHkoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGRpc2FibGVkT3BhY2l0eSBvZiB0aGlzIG5vZGUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldERpc2FibGVkT3BhY2l0eSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZGlzYWJsZWRPcGFjaXR5UHJvcGVydHkudmFsdWU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBvcGFjaXR5IGFjdHVhbGx5IGFwcGxpZWQgdG8gdGhlIG5vZGUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEVmZmVjdGl2ZU9wYWNpdHkoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLm9wYWNpdHlQcm9wZXJ0eS52YWx1ZSAqICggdGhpcy5lbmFibGVkUHJvcGVydHkudmFsdWUgPyAxIDogdGhpcy5kaXNhYmxlZE9wYWNpdHlQcm9wZXJ0eS52YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldERpc2FibGVkT3BhY2l0eSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBlZmZlY3RpdmVPcGFjaXR5KCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRFZmZlY3RpdmVPcGFjaXR5KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgd2hlbiBvdXIgb3BhY2l0eSBvciBvdGhlciBmaWx0ZXIgY2hhbmdlcyB2YWx1ZXNcclxuICAgKi9cclxuICBwcml2YXRlIG9uT3BhY2l0eVByb3BlcnR5Q2hhbmdlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5maWx0ZXJDaGFuZ2VFbWl0dGVyLmVtaXQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCB3aGVuIG91ciBvcGFjaXR5IG9yIG90aGVyIGZpbHRlciBjaGFuZ2VzIHZhbHVlc1xyXG4gICAqL1xyXG4gIHByaXZhdGUgb25EaXNhYmxlZE9wYWNpdHlQcm9wZXJ0eUNoYW5nZSgpOiB2b2lkIHtcclxuICAgIGlmICggIXRoaXMuX2VuYWJsZWRQcm9wZXJ0eS52YWx1ZSApIHtcclxuICAgICAgdGhpcy5maWx0ZXJDaGFuZ2VFbWl0dGVyLmVtaXQoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIG5vbi1vcGFjaXR5IGZpbHRlcnMgZm9yIHRoaXMgTm9kZS5cclxuICAgKlxyXG4gICAqIFRoZSBkZWZhdWx0IGlzIGFuIGVtcHR5IGFycmF5IChubyBmaWx0ZXJzKS4gSXQgc2hvdWxkIGJlIGFuIGFycmF5IG9mIEZpbHRlciBvYmplY3RzLCB3aGljaCB3aWxsIGJlIGVmZmVjdGl2ZWx5XHJcbiAgICogYXBwbGllZCBpbi1vcmRlciBvbiB0aGlzIE5vZGUgKGFuZCBpdHMgc3VidHJlZSksIGFuZCB3aWxsIGJlIGFwcGxpZWQgQkVGT1JFIG9wYWNpdHkvY2xpcHBpbmcuXHJcbiAgICpcclxuICAgKiBOT1RFOiBTb21lIGZpbHRlcnMgbWF5IGRlY3JlYXNlIHBlcmZvcm1hbmNlIChhbmQgdGhpcyBtYXkgYmUgcGxhdGZvcm0tc3BlY2lmaWMpLiBQbGVhc2UgcmVhZCBkb2N1bWVudGF0aW9uIGZvciBlYWNoXHJcbiAgICogZmlsdGVyIGJlZm9yZSB1c2luZy5cclxuICAgKlxyXG4gICAqIFR5cGljYWwgZmlsdGVyIHR5cGVzIHRvIHVzZSBhcmU6XHJcbiAgICogLSBCcmlnaHRuZXNzXHJcbiAgICogLSBDb250cmFzdFxyXG4gICAqIC0gRHJvcFNoYWRvdyAoRVhQRVJJTUVOVEFMKVxyXG4gICAqIC0gR2F1c3NpYW5CbHVyIChFWFBFUklNRU5UQUwpXHJcbiAgICogLSBHcmF5c2NhbGUgKEdyYXlzY2FsZS5GVUxMIGZvciB0aGUgZnVsbCBlZmZlY3QpXHJcbiAgICogLSBIdWVSb3RhdGVcclxuICAgKiAtIEludmVydCAoSW52ZXJ0LkZVTEwgZm9yIHRoZSBmdWxsIGVmZmVjdClcclxuICAgKiAtIFNhdHVyYXRlXHJcbiAgICogLSBTZXBpYSAoU2VwaWEuRlVMTCBmb3IgdGhlIGZ1bGwgZWZmZWN0KVxyXG4gICAqXHJcbiAgICogRmlsdGVyLmpzIGhhcyBtb3JlIGluZm9ybWF0aW9uIGluIGdlbmVyYWwgb24gZmlsdGVycy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0RmlsdGVycyggZmlsdGVyczogRmlsdGVyW10gKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBBcnJheS5pc0FycmF5KCBmaWx0ZXJzICksICdmaWx0ZXJzIHNob3VsZCBiZSBhbiBhcnJheScgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIF8uZXZlcnkoIGZpbHRlcnMsIGZpbHRlciA9PiBmaWx0ZXIgaW5zdGFuY2VvZiBGaWx0ZXIgKSwgJ2ZpbHRlcnMgc2hvdWxkIGNvbnNpc3Qgb2YgRmlsdGVyIG9iamVjdHMgb25seScgKTtcclxuXHJcbiAgICAvLyBXZSByZS11c2UgdGhlIHNhbWUgYXJyYXkgaW50ZXJuYWxseSwgc28gd2UgZG9uJ3QgcmVmZXJlbmNlIGEgcG90ZW50aWFsbHktbXV0YWJsZSBhcnJheSBmcm9tIG91dHNpZGUuXHJcbiAgICB0aGlzLl9maWx0ZXJzLmxlbmd0aCA9IDA7XHJcbiAgICB0aGlzLl9maWx0ZXJzLnB1c2goIC4uLmZpbHRlcnMgKTtcclxuXHJcbiAgICB0aGlzLmludmFsaWRhdGVIaW50KCk7XHJcbiAgICB0aGlzLmZpbHRlckNoYW5nZUVtaXR0ZXIuZW1pdCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldEZpbHRlcnMoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgZmlsdGVycyggdmFsdWU6IEZpbHRlcltdICkge1xyXG4gICAgdGhpcy5zZXRGaWx0ZXJzKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldEZpbHRlcnMoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgZmlsdGVycygpOiBGaWx0ZXJbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRGaWx0ZXJzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBub24tb3BhY2l0eSBmaWx0ZXJzIGZvciB0aGlzIE5vZGUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEZpbHRlcnMoKTogRmlsdGVyW10ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2ZpbHRlcnMuc2xpY2UoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgd2hhdCBQcm9wZXJ0eSBvdXIgcGlja2FibGVQcm9wZXJ0eSBpcyBiYWNrZWQgYnksIHNvIHRoYXQgY2hhbmdlcyB0byB0aGlzIHByb3ZpZGVkIFByb3BlcnR5IHdpbGwgY2hhbmdlIHRoaXNcclxuICAgKiBOb2RlJ3MgcGlja2FiaWxpdHksIGFuZCB2aWNlIHZlcnNhLiBUaGlzIGRvZXMgbm90IGNoYW5nZSB0aGlzLl9waWNrYWJsZVByb3BlcnR5LiBTZWUgVGlueUZvcndhcmRpbmdQcm9wZXJ0eS5zZXRUYXJnZXRQcm9wZXJ0eSgpXHJcbiAgICogZm9yIG1vcmUgaW5mby5cclxuICAgKlxyXG4gICAqIFBoRVQtaU8gSW5zdHJ1bWVudGVkIE5vZGVzIGRvIG5vdCBieSBkZWZhdWx0IGNyZWF0ZSB0aGVpciBvd24gaW5zdHJ1bWVudGVkIHBpY2thYmxlUHJvcGVydHksIGV2ZW4gdGhvdWdoIE5vZGUudmlzaWJsZVByb3BlcnR5IGRvZXMuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFBpY2thYmxlUHJvcGVydHkoIG5ld1RhcmdldDogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbiB8IG51bGw+IHwgbnVsbCApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLl9waWNrYWJsZVByb3BlcnR5LnNldFRhcmdldFByb3BlcnR5KCBuZXdUYXJnZXQgYXMgVFByb3BlcnR5PGJvb2xlYW4gfCBudWxsPiwgdGhpcywgbnVsbCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldFBpY2thYmxlUHJvcGVydHkoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgcGlja2FibGVQcm9wZXJ0eSggcHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4gfCBudWxsPiB8IG51bGwgKSB7XHJcbiAgICB0aGlzLnNldFBpY2thYmxlUHJvcGVydHkoIHByb3BlcnR5ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0UGlja2FibGVQcm9wZXJ0eSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBwaWNrYWJsZVByb3BlcnR5KCk6IFRQcm9wZXJ0eTxib29sZWFuIHwgbnVsbD4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0UGlja2FibGVQcm9wZXJ0eSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoaXMgTm9kZSdzIHBpY2thYmxlUHJvcGVydHkuIE5vdGUhIFRoaXMgaXMgbm90IHRoZSByZWNpcHJvY2FsIG9mIHNldFBpY2thYmxlUHJvcGVydHkuIE5vZGUucHJvdG90eXBlLl9waWNrYWJsZVByb3BlcnR5XHJcbiAgICogaXMgYSBUaW55Rm9yd2FyZGluZ1Byb3BlcnR5LCBhbmQgaXMgc2V0IHVwIHRvIGxpc3RlbiB0byBjaGFuZ2VzIGZyb20gdGhlIHBpY2thYmxlUHJvcGVydHkgcHJvdmlkZWQgYnlcclxuICAgKiBzZXRQaWNrYWJsZVByb3BlcnR5KCksIGJ1dCB0aGUgdW5kZXJseWluZyByZWZlcmVuY2UgZG9lcyBub3QgY2hhbmdlLiBUaGlzIG1lYW5zIHRoZSBmb2xsb3dpbmc6XHJcbiAgICogY29uc3QgbXlOb2RlID0gbmV3IE5vZGUoKTtcclxuICAgKiBjb25zdCBwaWNrYWJsZVByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCBmYWxzZSApO1xyXG4gICAqIG15Tm9kZS5zZXRQaWNrYWJsZVByb3BlcnR5KCBwaWNrYWJsZVByb3BlcnR5IClcclxuICAgKiA9PiBteU5vZGUuZ2V0UGlja2FibGVQcm9wZXJ0eSgpICE9PSBwaWNrYWJsZVByb3BlcnR5ICghISEhISEpXHJcbiAgICpcclxuICAgKiBQbGVhc2UgdXNlIHRoaXMgd2l0aCBjYXV0aW9uLiBTZWUgc2V0UGlja2FibGVQcm9wZXJ0eSgpIGZvciBtb3JlIGluZm9ybWF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRQaWNrYWJsZVByb3BlcnR5KCk6IFRQcm9wZXJ0eTxib29sZWFuIHwgbnVsbD4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX3BpY2thYmxlUHJvcGVydHk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHdoZXRoZXIgdGhpcyBOb2RlIChhbmQgaXRzIHN1YnRyZWUpIHdpbGwgYWxsb3cgaGl0LXRlc3RpbmcgKGFuZCB0aHVzIHVzZXIgaW50ZXJhY3Rpb24pLCBjb250cm9sbGluZyB3aGF0XHJcbiAgICogVHJhaWwgaXMgcmV0dXJuZWQgZnJvbSBub2RlLnRyYWlsVW5kZXJQb2ludCgpLlxyXG4gICAqXHJcbiAgICogUGlja2FibGUgY2FuIHRha2Ugb25lIG9mIHRocmVlIHZhbHVlczpcclxuICAgKiAtIG51bGw6IChkZWZhdWx0KSBwYXNzLXRocm91Z2ggYmVoYXZpb3IuIEhpdC10ZXN0aW5nIHdpbGwgcHJ1bmUgdGhpcyBzdWJ0cmVlIGlmIHRoZXJlIGFyZSBub1xyXG4gICAqICAgICAgICAgYW5jZXN0b3JzL2Rlc2NlbmRhbnRzIHdpdGggZWl0aGVyIHBpY2thYmxlOiB0cnVlIHNldCBvciB3aXRoIGFueSBpbnB1dCBsaXN0ZW5lcnMuXHJcbiAgICogLSBmYWxzZTogSGl0LXRlc3RpbmcgaXMgcHJ1bmVkLCBub3RoaW5nIGluIHRoaXMgbm9kZSBvciBpdHMgc3VidHJlZSB3aWxsIHJlc3BvbmQgdG8gZXZlbnRzIG9yIGJlIHBpY2tlZC5cclxuICAgKiAtIHRydWU6IEhpdC10ZXN0aW5nIHdpbGwgbm90IGJlIHBydW5lZCBpbiB0aGlzIHN1YnRyZWUsIGV4Y2VwdCBmb3IgcGlja2FibGU6IGZhbHNlIGNhc2VzLlxyXG4gICAqXHJcbiAgICogSGl0IHRlc3RpbmcgaXMgYWNjb21wbGlzaGVkIG1haW5seSB3aXRoIG5vZGUudHJhaWxVbmRlclBvaW50ZXIoKSBhbmQgbm9kZS50cmFpbFVuZGVyUG9pbnQoKSwgZm9sbG93aW5nIHRoZVxyXG4gICAqIGFib3ZlIHJ1bGVzLiBOb2RlcyB0aGF0IGFyZSBub3QgcGlja2FibGUgKHBydW5lZCkgd2lsbCBub3QgaGF2ZSBpbnB1dCBldmVudHMgdGFyZ2V0ZWQgdG8gdGhlbS5cclxuICAgKlxyXG4gICAqIFRoZSBmb2xsb3dpbmcgcnVsZXMgKGFwcGxpZWQgaW4gdGhlIGdpdmVuIG9yZGVyKSBkZXRlcm1pbmUgd2hldGhlciBhIE5vZGUgKHJlYWxseSwgYSBUcmFpbCkgd2lsbCByZWNlaXZlIGlucHV0IGV2ZW50czpcclxuICAgKiAxLiBJZiB0aGUgbm9kZSBvciBvbmUgb2YgaXRzIGFuY2VzdG9ycyBoYXMgcGlja2FibGU6IGZhbHNlIE9SIGlzIGludmlzaWJsZSwgdGhlIE5vZGUgKndpbGwgbm90KiByZWNlaXZlIGV2ZW50c1xyXG4gICAqICAgIG9yIGhpdCB0ZXN0aW5nLlxyXG4gICAqIDIuIElmIHRoZSBOb2RlIG9yIG9uZSBvZiBpdHMgYW5jZXN0b3JzIG9yIGRlc2NlbmRhbnRzIGlzIHBpY2thYmxlOiB0cnVlIE9SIGhhcyBhbiBpbnB1dCBsaXN0ZW5lciBhdHRhY2hlZCwgaXRcclxuICAgKiAgICAqd2lsbCogcmVjZWl2ZSBldmVudHMgb3IgaGl0IHRlc3RpbmcuXHJcbiAgICogMy4gT3RoZXJ3aXNlLCBpdCAqd2lsbCBub3QqIHJlY2VpdmUgZXZlbnRzIG9yIGhpdCB0ZXN0aW5nLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyB1c2VmdWwgZm9yIHNlbWktdHJhbnNwYXJlbnQgb3ZlcmxheXMgb3Igb3RoZXIgdmlzdWFsIGVsZW1lbnRzIHRoYXQgc2hvdWxkIGJlIGRpc3BsYXllZCBidXQgc2hvdWxkIG5vdFxyXG4gICAqIHByZXZlbnQgb2JqZWN0cyBiZWxvdyBmcm9tIGJlaW5nIG1hbmlwdWxhdGVkIGJ5IHVzZXIgaW5wdXQsIGFuZCB0aGUgZGVmYXVsdCBudWxsIHZhbHVlIGlzIHVzZWQgdG8gaW5jcmVhc2VcclxuICAgKiBwZXJmb3JtYW5jZSBieSBpZ25vcmluZyBhcmVhcyB0aGF0IGRvbid0IG5lZWQgdXNlciBpbnB1dC5cclxuICAgKlxyXG4gICAqIE5PVEU6IElmIHlvdSB3YW50IHNvbWV0aGluZyB0byBiZSBwaWNrZWQgXCJtb3VzZSBpcyBvdmVyIGl0XCIsIGJ1dCBibG9jayBpbnB1dCBldmVudHMgZXZlbiBpZiB0aGVyZSBhcmUgbGlzdGVuZXJzLFxyXG4gICAqICAgICAgIHRoZW4gcGlja2FibGU6ZmFsc2UgaXMgbm90IGFwcHJvcHJpYXRlLCBhbmQgaW5wdXRFbmFibGVkOmZhbHNlIGlzIHByZWZlcnJlZC5cclxuICAgKlxyXG4gICAqIEZvciBhIHZpc3VhbCBleGFtcGxlIG9mIGhvdyBwaWNrYWJpbGl0eSBpbnRlcmFjdHMgd2l0aCBpbnB1dCBsaXN0ZW5lcnMgYW5kIHZpc2liaWxpdHksIHNlZSB0aGUgbm90ZXMgYXQgdGhlXHJcbiAgICogYm90dG9tIG9mIGh0dHA6Ly9waGV0c2ltcy5naXRodWIuaW8vc2NlbmVyeS9kb2MvaW1wbGVtZW50YXRpb24tbm90ZXMsIG9yIHNjZW5lcnkvYXNzZXRzL3BpY2thYmlsaXR5LnN2Zy5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0UGlja2FibGUoIHBpY2thYmxlOiBib29sZWFuIHwgbnVsbCApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHBpY2thYmxlID09PSBudWxsIHx8IHR5cGVvZiBwaWNrYWJsZSA9PT0gJ2Jvb2xlYW4nICk7XHJcbiAgICB0aGlzLl9waWNrYWJsZVByb3BlcnR5LnNldCggcGlja2FibGUgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRQaWNrYWJsZSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBwaWNrYWJsZSggdmFsdWU6IGJvb2xlYW4gfCBudWxsICkge1xyXG4gICAgdGhpcy5zZXRQaWNrYWJsZSggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBpc1BpY2thYmxlKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHBpY2thYmxlKCk6IGJvb2xlYW4gfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLmlzUGlja2FibGUoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHBpY2thYmlsaXR5IG9mIHRoaXMgbm9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgaXNQaWNrYWJsZSgpOiBib29sZWFuIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5fcGlja2FibGVQcm9wZXJ0eS52YWx1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCB3aGVuIG91ciBwaWNrYWJsZVByb3BlcnR5IGNoYW5nZXMgdmFsdWVzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgb25QaWNrYWJsZVByb3BlcnR5Q2hhbmdlKCBwaWNrYWJsZTogYm9vbGVhbiB8IG51bGwsIG9sZFBpY2thYmxlOiBib29sZWFuIHwgbnVsbCApOiB2b2lkIHtcclxuICAgIHRoaXMuX3BpY2tlci5vblBpY2thYmxlQ2hhbmdlKCBvbGRQaWNrYWJsZSwgcGlja2FibGUgKTtcclxuICAgIGlmICggYXNzZXJ0U2xvdyApIHsgdGhpcy5fcGlja2VyLmF1ZGl0KCk7IH1cclxuICAgIC8vIFRPRE86IGludmFsaWRhdGUgdGhlIGN1cnNvciBzb21laG93PyAjMTUwXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHdoYXQgUHJvcGVydHkgb3VyIGVuYWJsZWRQcm9wZXJ0eSBpcyBiYWNrZWQgYnksIHNvIHRoYXQgY2hhbmdlcyB0byB0aGlzIHByb3ZpZGVkIFByb3BlcnR5IHdpbGwgY2hhbmdlIHRoaXNcclxuICAgKiBOb2RlJ3MgZW5hYmxlZCwgYW5kIHZpY2UgdmVyc2EuIFRoaXMgZG9lcyBub3QgY2hhbmdlIHRoaXMuX2VuYWJsZWRQcm9wZXJ0eS4gU2VlIFRpbnlGb3J3YXJkaW5nUHJvcGVydHkuc2V0VGFyZ2V0UHJvcGVydHkoKVxyXG4gICAqIGZvciBtb3JlIGluZm8uXHJcbiAgICpcclxuICAgKlxyXG4gICAqIE5PVEUgRm9yIFBoRVQtaU8gdXNlOlxyXG4gICAqIEFsbCBQaEVULWlPIGluc3RydW1lbnRlZCBOb2RlcyBjcmVhdGUgdGhlaXIgb3duIGluc3RydW1lbnRlZCBlbmFibGVkUHJvcGVydHkgKGlmIG9uZSBpcyBub3QgcGFzc2VkIGluIGFzXHJcbiAgICogYW4gb3B0aW9uKS4gT25jZSBhIE5vZGUncyBlbmFibGVkUHJvcGVydHkgaGFzIGJlZW4gcmVnaXN0ZXJlZCB3aXRoIFBoRVQtaU8sIGl0IGNhbm5vdCBiZSBcInN3YXBwZWQgb3V0XCIgZm9yIGFub3RoZXIuXHJcbiAgICogSWYgeW91IG5lZWQgdG8gXCJkZWxheVwiIHNldHRpbmcgYW4gaW5zdHJ1bWVudGVkIGVuYWJsZWRQcm9wZXJ0eSB0byB0aGlzIG5vZGUsIHBhc3MgcGhldGlvRW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkXHJcbiAgICogdG8gaW5zdHJ1bWVudGF0aW9uIGNhbGwgdG8gdGhpcyBOb2RlICh3aGVyZSBUYW5kZW0gaXMgcHJvdmlkZWQpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRFbmFibGVkUHJvcGVydHkoIG5ld1RhcmdldDogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj4gfCBudWxsICk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHRoaXMuX2VuYWJsZWRQcm9wZXJ0eS5zZXRUYXJnZXRQcm9wZXJ0eSggbmV3VGFyZ2V0LCB0aGlzLCBFTkFCTEVEX1BST1BFUlRZX1RBTkRFTV9OQU1FICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0RW5hYmxlZFByb3BlcnR5KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGVuYWJsZWRQcm9wZXJ0eSggcHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+IHwgbnVsbCApIHtcclxuICAgIHRoaXMuc2V0RW5hYmxlZFByb3BlcnR5KCBwcm9wZXJ0eSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldEVuYWJsZWRQcm9wZXJ0eSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBlbmFibGVkUHJvcGVydHkoKTogVFByb3BlcnR5PGJvb2xlYW4+IHtcclxuICAgIHJldHVybiB0aGlzLmdldEVuYWJsZWRQcm9wZXJ0eSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoaXMgTm9kZSdzIGVuYWJsZWRQcm9wZXJ0eS4gTm90ZSEgVGhpcyBpcyBub3QgdGhlIHJlY2lwcm9jYWwgb2Ygc2V0RW5hYmxlZFByb3BlcnR5LiBOb2RlLnByb3RvdHlwZS5fZW5hYmxlZFByb3BlcnR5XHJcbiAgICogaXMgYSBUaW55Rm9yd2FyZGluZ1Byb3BlcnR5LCBhbmQgaXMgc2V0IHVwIHRvIGxpc3RlbiB0byBjaGFuZ2VzIGZyb20gdGhlIGVuYWJsZWRQcm9wZXJ0eSBwcm92aWRlZCBieVxyXG4gICAqIHNldEVuYWJsZWRQcm9wZXJ0eSgpLCBidXQgdGhlIHVuZGVybHlpbmcgcmVmZXJlbmNlIGRvZXMgbm90IGNoYW5nZS4gVGhpcyBtZWFucyB0aGUgZm9sbG93aW5nOlxyXG4gICAqIGNvbnN0IG15Tm9kZSA9IG5ldyBOb2RlKCk7XHJcbiAgICogY29uc3QgZW5hYmxlZFByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCBmYWxzZSApO1xyXG4gICAqIG15Tm9kZS5zZXRFbmFibGVkUHJvcGVydHkoIGVuYWJsZWRQcm9wZXJ0eSApXHJcbiAgICogPT4gbXlOb2RlLmdldEVuYWJsZWRQcm9wZXJ0eSgpICE9PSBlbmFibGVkUHJvcGVydHkgKCEhISEhISlcclxuICAgKlxyXG4gICAqIFBsZWFzZSB1c2UgdGhpcyB3aXRoIGNhdXRpb24uIFNlZSBzZXRFbmFibGVkUHJvcGVydHkoKSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0RW5hYmxlZFByb3BlcnR5KCk6IFRQcm9wZXJ0eTxib29sZWFuPiB7XHJcbiAgICByZXR1cm4gdGhpcy5fZW5hYmxlZFByb3BlcnR5O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXNlIHRoaXMgdG8gYXV0b21hdGljYWxseSBjcmVhdGUgYSBmb3J3YXJkZWQsIFBoRVQtaU8gaW5zdHJ1bWVudGVkIGVuYWJsZWRQcm9wZXJ0eSBpbnRlcm5hbCB0byBOb2RlLiBUaGlzIGlzIGRpZmZlcmVudFxyXG4gICAqIGZyb20gdmlzaWJsZSBiZWNhdXNlIGVuYWJsZWQgYnkgZGVmYXVsdCBkb2Vzbid0IG5vdCBjcmVhdGUgdGhpcyBmb3J3YXJkZWQgUHJvcGVydHkuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCggcGhldGlvRW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkOiBib29sZWFuICk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHRoaXMuX2VuYWJsZWRQcm9wZXJ0eS5zZXRUYXJnZXRQcm9wZXJ0eUluc3RydW1lbnRlZCggcGhldGlvRW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkLCB0aGlzICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0UGhldGlvRW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IHBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCggdmFsdWU6IGJvb2xlYW4gKSB7XHJcbiAgICB0aGlzLnNldFBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRQaGV0aW9FbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgcGhldGlvRW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0UGhldGlvRW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0UGhldGlvRW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2VuYWJsZWRQcm9wZXJ0eS5nZXRUYXJnZXRQcm9wZXJ0eUluc3RydW1lbnRlZCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB3aGV0aGVyIHRoaXMgTm9kZSBpcyBlbmFibGVkXHJcbiAgICovXHJcbiAgcHVibGljIHNldEVuYWJsZWQoIGVuYWJsZWQ6IGJvb2xlYW4gKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBlbmFibGVkID09PSBudWxsIHx8IHR5cGVvZiBlbmFibGVkID09PSAnYm9vbGVhbicgKTtcclxuICAgIHRoaXMuX2VuYWJsZWRQcm9wZXJ0eS5zZXQoIGVuYWJsZWQgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRFbmFibGVkKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGVuYWJsZWQoIHZhbHVlOiBib29sZWFuICkge1xyXG4gICAgdGhpcy5zZXRFbmFibGVkKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGlzRW5hYmxlZCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBlbmFibGVkKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuaXNFbmFibGVkKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBlbmFibGVkIG9mIHRoaXMgbm9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgaXNFbmFibGVkKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2VuYWJsZWRQcm9wZXJ0eS52YWx1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCB3aGVuIGVuYWJsZWRQcm9wZXJ0eSBjaGFuZ2VzIHZhbHVlcy5cclxuICAgKiAtIG92ZXJyaWRlIHRoaXMgdG8gY2hhbmdlIHRoZSBiZWhhdmlvciBvZiBlbmFibGVkXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIG9uRW5hYmxlZFByb3BlcnR5Q2hhbmdlKCBlbmFibGVkOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgIWVuYWJsZWQgJiYgdGhpcy5pbnRlcnJ1cHRTdWJ0cmVlSW5wdXQoKTtcclxuICAgIHRoaXMuaW5wdXRFbmFibGVkID0gZW5hYmxlZDtcclxuXHJcbiAgICBpZiAoIHRoaXMuZGlzYWJsZWRPcGFjaXR5UHJvcGVydHkudmFsdWUgIT09IDEgKSB7XHJcbiAgICAgIHRoaXMuZmlsdGVyQ2hhbmdlRW1pdHRlci5lbWl0KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHdoYXQgUHJvcGVydHkgb3VyIGlucHV0RW5hYmxlZFByb3BlcnR5IGlzIGJhY2tlZCBieSwgc28gdGhhdCBjaGFuZ2VzIHRvIHRoaXMgcHJvdmlkZWQgUHJvcGVydHkgd2lsbCBjaGFuZ2UgdGhpcyB3aGV0aGVyIHRoaXNcclxuICAgKiBOb2RlJ3MgaW5wdXQgaXMgZW5hYmxlZCwgYW5kIHZpY2UgdmVyc2EuIFRoaXMgZG9lcyBub3QgY2hhbmdlIHRoaXMuX2lucHV0RW5hYmxlZFByb3BlcnR5LiBTZWUgVGlueUZvcndhcmRpbmdQcm9wZXJ0eS5zZXRUYXJnZXRQcm9wZXJ0eSgpXHJcbiAgICogZm9yIG1vcmUgaW5mby5cclxuICAgKlxyXG4gICAqIE5PVEUgRm9yIFBoRVQtaU8gdXNlOlxyXG4gICAqIEFsbCBQaEVULWlPIGluc3RydW1lbnRlZCBOb2RlcyBjcmVhdGUgdGhlaXIgb3duIGluc3RydW1lbnRlZCBpbnB1dEVuYWJsZWRQcm9wZXJ0eSAoaWYgb25lIGlzIG5vdCBwYXNzZWQgaW4gYXNcclxuICAgKiBhbiBvcHRpb24pLiBPbmNlIGEgTm9kZSdzIGlucHV0RW5hYmxlZFByb3BlcnR5IGhhcyBiZWVuIHJlZ2lzdGVyZWQgd2l0aCBQaEVULWlPLCBpdCBjYW5ub3QgYmUgXCJzd2FwcGVkIG91dFwiIGZvciBhbm90aGVyLlxyXG4gICAqIElmIHlvdSBuZWVkIHRvIFwiZGVsYXlcIiBzZXR0aW5nIGFuIGluc3RydW1lbnRlZCBpbnB1dEVuYWJsZWRQcm9wZXJ0eSB0byB0aGlzIG5vZGUsIHBhc3MgcGhldGlvSW5wdXRFbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWRcclxuICAgKiB0byBpbnN0cnVtZW50YXRpb24gY2FsbCB0byB0aGlzIE5vZGUgKHdoZXJlIFRhbmRlbSBpcyBwcm92aWRlZCkuXHJcbiAgICovXHJcbiAgcHVibGljIHNldElucHV0RW5hYmxlZFByb3BlcnR5KCBuZXdUYXJnZXQ6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+IHwgbnVsbCApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLl9pbnB1dEVuYWJsZWRQcm9wZXJ0eS5zZXRUYXJnZXRQcm9wZXJ0eSggbmV3VGFyZ2V0LCB0aGlzLCBJTlBVVF9FTkFCTEVEX1BST1BFUlRZX1RBTkRFTV9OQU1FICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0SW5wdXRFbmFibGVkUHJvcGVydHkoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgaW5wdXRFbmFibGVkUHJvcGVydHkoIHByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuPiB8IG51bGwgKSB7XHJcbiAgICB0aGlzLnNldElucHV0RW5hYmxlZFByb3BlcnR5KCBwcm9wZXJ0eSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldElucHV0RW5hYmxlZFByb3BlcnR5KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGlucHV0RW5hYmxlZFByb3BlcnR5KCk6IFRQcm9wZXJ0eTxib29sZWFuPiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRJbnB1dEVuYWJsZWRQcm9wZXJ0eSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoaXMgTm9kZSdzIGlucHV0RW5hYmxlZFByb3BlcnR5LiBOb3RlISBUaGlzIGlzIG5vdCB0aGUgcmVjaXByb2NhbCBvZiBzZXRJbnB1dEVuYWJsZWRQcm9wZXJ0eS4gTm9kZS5wcm90b3R5cGUuX2lucHV0RW5hYmxlZFByb3BlcnR5XHJcbiAgICogaXMgYSBUaW55Rm9yd2FyZGluZ1Byb3BlcnR5LCBhbmQgaXMgc2V0IHVwIHRvIGxpc3RlbiB0byBjaGFuZ2VzIGZyb20gdGhlIGlucHV0RW5hYmxlZFByb3BlcnR5IHByb3ZpZGVkIGJ5XHJcbiAgICogc2V0SW5wdXRFbmFibGVkUHJvcGVydHkoKSwgYnV0IHRoZSB1bmRlcmx5aW5nIHJlZmVyZW5jZSBkb2VzIG5vdCBjaGFuZ2UuIFRoaXMgbWVhbnMgdGhlIGZvbGxvd2luZzpcclxuICAgKiBjb25zdCBteU5vZGUgPSBuZXcgTm9kZSgpO1xyXG4gICAqIGNvbnN0IGlucHV0RW5hYmxlZFByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCBmYWxzZSApO1xyXG4gICAqIG15Tm9kZS5zZXRJbnB1dEVuYWJsZWRQcm9wZXJ0eSggaW5wdXRFbmFibGVkUHJvcGVydHkgKVxyXG4gICAqID0+IG15Tm9kZS5nZXRJbnB1dEVuYWJsZWRQcm9wZXJ0eSgpICE9PSBpbnB1dEVuYWJsZWRQcm9wZXJ0eSAoISEhISEhKVxyXG4gICAqXHJcbiAgICogUGxlYXNlIHVzZSB0aGlzIHdpdGggY2F1dGlvbi4gU2VlIHNldElucHV0RW5hYmxlZFByb3BlcnR5KCkgZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIGdldElucHV0RW5hYmxlZFByb3BlcnR5KCk6IFRQcm9wZXJ0eTxib29sZWFuPiB7XHJcbiAgICByZXR1cm4gdGhpcy5faW5wdXRFbmFibGVkUHJvcGVydHk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVc2UgdGhpcyB0byBhdXRvbWF0aWNhbGx5IGNyZWF0ZSBhIGZvcndhcmRlZCwgUGhFVC1pTyBpbnN0cnVtZW50ZWQgaW5wdXRFbmFibGVkUHJvcGVydHkgaW50ZXJuYWwgdG8gTm9kZS4gVGhpcyBpcyBkaWZmZXJlbnRcclxuICAgKiBmcm9tIHZpc2libGUgYmVjYXVzZSBpbnB1dEVuYWJsZWQgYnkgZGVmYXVsdCBkb2Vzbid0IG5vdCBjcmVhdGUgdGhpcyBmb3J3YXJkZWQgUHJvcGVydHkuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFBoZXRpb0lucHV0RW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkKCBwaGV0aW9JbnB1dEVuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZDogYm9vbGVhbiApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLl9pbnB1dEVuYWJsZWRQcm9wZXJ0eS5zZXRUYXJnZXRQcm9wZXJ0eUluc3RydW1lbnRlZCggcGhldGlvSW5wdXRFbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQsIHRoaXMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRQaGV0aW9JbnB1dEVuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBwaGV0aW9JbnB1dEVuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCggdmFsdWU6IGJvb2xlYW4gKSB7XHJcbiAgICB0aGlzLnNldFBoZXRpb0lucHV0RW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFBoZXRpb0lucHV0RW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHBoZXRpb0lucHV0RW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0UGhldGlvSW5wdXRFbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXRQaGV0aW9JbnB1dEVuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl9pbnB1dEVuYWJsZWRQcm9wZXJ0eS5nZXRUYXJnZXRQcm9wZXJ0eUluc3RydW1lbnRlZCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB3aGV0aGVyIGlucHV0IGlzIGVuYWJsZWQgZm9yIHRoaXMgTm9kZSBhbmQgaXRzIHN1YnRyZWUuIElmIGZhbHNlLCBpbnB1dCBldmVudCBsaXN0ZW5lcnMgd2lsbCBub3QgYmUgZmlyZWRcclxuICAgKiBvbiB0aGlzIE5vZGUgb3IgaXRzIGRlc2NlbmRhbnRzIGluIHRoZSBwaWNrZWQgVHJhaWwuIFRoaXMgZG9lcyBOT1QgZWZmZWN0IHBpY2tpbmcgKHdoYXQgVHJhaWwvbm9kZXMgYXJlIHVuZGVyXHJcbiAgICogYSBwb2ludGVyKSwgYnV0IG9ubHkgZWZmZWN0cyB3aGF0IGxpc3RlbmVycyBhcmUgZmlyZWQuXHJcbiAgICpcclxuICAgKiBBZGRpdGlvbmFsbHksIHRoaXMgd2lsbCBhZmZlY3QgY3Vyc29yIGJlaGF2aW9yLiBJZiBpbnB1dEVuYWJsZWQ9ZmFsc2UsIGRlc2NlbmRhbnRzIG9mIHRoaXMgTm9kZSB3aWxsIG5vdCBiZVxyXG4gICAqIGNoZWNrZWQgd2hlbiBkZXRlcm1pbmluZyB3aGF0IGN1cnNvciB3aWxsIGJlIHNob3duLiBJbnN0ZWFkLCBpZiBhIHBvaW50ZXIgKGUuZy4gbW91c2UpIGlzIG92ZXIgYSBkZXNjZW5kYW50LFxyXG4gICAqIHRoaXMgTm9kZSdzIGN1cnNvciB3aWxsIGJlIGNoZWNrZWQgZmlyc3QsIHRoZW4gYW5jZXN0b3JzIHdpbGwgYmUgY2hlY2tlZCBhcyBub3JtYWwuXHJcbiAgICovXHJcbiAgcHVibGljIHNldElucHV0RW5hYmxlZCggaW5wdXRFbmFibGVkOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgdGhpcy5pbnB1dEVuYWJsZWRQcm9wZXJ0eS52YWx1ZSA9IGlucHV0RW5hYmxlZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRJbnB1dEVuYWJsZWQoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgaW5wdXRFbmFibGVkKCB2YWx1ZTogYm9vbGVhbiApIHtcclxuICAgIHRoaXMuc2V0SW5wdXRFbmFibGVkKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGlzSW5wdXRFbmFibGVkKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGlucHV0RW5hYmxlZCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmlzSW5wdXRFbmFibGVkKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgaW5wdXQgaXMgZW5hYmxlZCBmb3IgdGhpcyBOb2RlIGFuZCBpdHMgc3VidHJlZS4gU2VlIHNldElucHV0RW5hYmxlZCBmb3IgbW9yZSBkb2N1bWVudGF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc0lucHV0RW5hYmxlZCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmlucHV0RW5hYmxlZFByb3BlcnR5LnZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyBhbGwgb2YgdGhlIGlucHV0IGxpc3RlbmVycyBhdHRhY2hlZCB0byB0aGlzIE5vZGUuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gcmVtb3ZpbmcgYWxsIGN1cnJlbnQgaW5wdXQgbGlzdGVuZXJzIHdpdGggcmVtb3ZlSW5wdXRMaXN0ZW5lcigpIGFuZCBhZGRpbmcgYWxsIG5ld1xyXG4gICAqIGxpc3RlbmVycyAoaW4gb3JkZXIpIHdpdGggYWRkSW5wdXRMaXN0ZW5lcigpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRJbnB1dExpc3RlbmVycyggaW5wdXRMaXN0ZW5lcnM6IFRJbnB1dExpc3RlbmVyW10gKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBBcnJheS5pc0FycmF5KCBpbnB1dExpc3RlbmVycyApICk7XHJcblxyXG4gICAgLy8gUmVtb3ZlIGFsbCBvbGQgaW5wdXQgbGlzdGVuZXJzXHJcbiAgICB3aGlsZSAoIHRoaXMuX2lucHV0TGlzdGVuZXJzLmxlbmd0aCApIHtcclxuICAgICAgdGhpcy5yZW1vdmVJbnB1dExpc3RlbmVyKCB0aGlzLl9pbnB1dExpc3RlbmVyc1sgMCBdICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWRkIGluIGFsbCBuZXcgaW5wdXQgbGlzdGVuZXJzXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBpbnB1dExpc3RlbmVycy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgdGhpcy5hZGRJbnB1dExpc3RlbmVyKCBpbnB1dExpc3RlbmVyc1sgaSBdICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0SW5wdXRMaXN0ZW5lcnMoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgaW5wdXRMaXN0ZW5lcnMoIHZhbHVlOiBUSW5wdXRMaXN0ZW5lcltdICkge1xyXG4gICAgdGhpcy5zZXRJbnB1dExpc3RlbmVycyggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRJbnB1dExpc3RlbmVycygpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBpbnB1dExpc3RlbmVycygpOiBUSW5wdXRMaXN0ZW5lcltdIHtcclxuICAgIHJldHVybiB0aGlzLmdldElucHV0TGlzdGVuZXJzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgY29weSBvZiBhbGwgb2Ygb3VyIGlucHV0IGxpc3RlbmVycy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0SW5wdXRMaXN0ZW5lcnMoKTogVElucHV0TGlzdGVuZXJbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5faW5wdXRMaXN0ZW5lcnMuc2xpY2UoIDAgKTsgLy8gZGVmZW5zaXZlIGNvcHlcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIENTUyBjdXJzb3Igc3RyaW5nIHRoYXQgc2hvdWxkIGJlIHVzZWQgd2hlbiB0aGUgbW91c2UgaXMgb3ZlciB0aGlzIG5vZGUuIG51bGwgaXMgdGhlIGRlZmF1bHQsIGFuZFxyXG4gICAqIGluZGljYXRlcyB0aGF0IGFuY2VzdG9yIG5vZGVzIChvciB0aGUgYnJvd3NlciBkZWZhdWx0KSBzaG91bGQgYmUgdXNlZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBjdXJzb3IgLSBBIENTUyBjdXJzb3Igc3RyaW5nLCBsaWtlICdwb2ludGVyJywgb3IgJ25vbmUnIC0gRXhhbXBsZXMgYXJlOlxyXG4gICAqIGF1dG8gZGVmYXVsdCBub25lIGluaGVyaXQgaGVscCBwb2ludGVyIHByb2dyZXNzIHdhaXQgY3Jvc3NoYWlyIHRleHQgdmVydGljYWwtdGV4dCBhbGlhcyBjb3B5IG1vdmUgbm8tZHJvcCBub3QtYWxsb3dlZFxyXG4gICAqIGUtcmVzaXplIG4tcmVzaXplIHctcmVzaXplIHMtcmVzaXplIG53LXJlc2l6ZSBuZS1yZXNpemUgc2UtcmVzaXplIHN3LXJlc2l6ZSBldy1yZXNpemUgbnMtcmVzaXplIG5lc3ctcmVzaXplIG53c2UtcmVzaXplXHJcbiAgICogY29udGV4dC1tZW51IGNlbGwgY29sLXJlc2l6ZSByb3ctcmVzaXplIGFsbC1zY3JvbGwgdXJsKCAuLi4gKSAtLT4gZG9lcyBpdCBzdXBwb3J0IGRhdGEgVVJMcz9cclxuICAgKi9cclxuICBwdWJsaWMgc2V0Q3Vyc29yKCBjdXJzb3I6IHN0cmluZyB8IG51bGwgKTogdm9pZCB7XHJcblxyXG4gICAgLy8gVE9ETzogY29uc2lkZXIgYSBtYXBwaW5nIG9mIHR5cGVzIHRvIHNldCByZWFzb25hYmxlIGRlZmF1bHRzIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcblxyXG4gICAgLy8gYWxsb3cgdGhlICdhdXRvJyBjdXJzb3IgdHlwZSB0byBsZXQgdGhlIGFuY2VzdG9ycyBvciBzY2VuZSBwaWNrIHRoZSBjdXJzb3IgdHlwZVxyXG4gICAgdGhpcy5fY3Vyc29yID0gY3Vyc29yID09PSAnYXV0bycgPyBudWxsIDogY3Vyc29yO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldEN1cnNvcigpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBjdXJzb3IoIHZhbHVlOiBzdHJpbmcgfCBudWxsICkge1xyXG4gICAgdGhpcy5zZXRDdXJzb3IoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0Q3Vyc29yKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGN1cnNvcigpOiBzdHJpbmcgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLmdldEN1cnNvcigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgQ1NTIGN1cnNvciBzdHJpbmcgZm9yIHRoaXMgbm9kZSwgb3IgbnVsbCBpZiB0aGVyZSBpcyBubyBjdXJzb3Igc3BlY2lmaWVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDdXJzb3IoKTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5fY3Vyc29yO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgQ1NTIGN1cnNvciB0aGF0IGNvdWxkIGJlIGFwcGxpZWQgZWl0aGVyIGJ5IHRoaXMgTm9kZSBpdHNlbGYsIG9yIGZyb20gYW55IG9mIGl0cyBpbnB1dCBsaXN0ZW5lcnMnXHJcbiAgICogcHJlZmVyZW5jZXMuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRFZmZlY3RpdmVDdXJzb3IoKTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgICBpZiAoIHRoaXMuX2N1cnNvciApIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX2N1cnNvcjtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLl9pbnB1dExpc3RlbmVycy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgaW5wdXRMaXN0ZW5lciA9IHRoaXMuX2lucHV0TGlzdGVuZXJzWyBpIF07XHJcblxyXG4gICAgICBpZiAoIGlucHV0TGlzdGVuZXIuY3Vyc29yICkge1xyXG4gICAgICAgIHJldHVybiBpbnB1dExpc3RlbmVyLmN1cnNvcjtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgaGl0LXRlc3RlZCBtb3VzZSBhcmVhIGZvciB0aGlzIE5vZGUgKHNlZSBjb25zdHJ1Y3RvciBmb3IgbW9yZSBhZHZhbmNlZCBkb2N1bWVudGF0aW9uKS4gVXNlIG51bGwgZm9yIHRoZVxyXG4gICAqIGRlZmF1bHQgYmVoYXZpb3IuXHJcbiAgICovXHJcbiAgcHVibGljIHNldE1vdXNlQXJlYSggYXJlYTogU2hhcGUgfCBCb3VuZHMyIHwgbnVsbCApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGFyZWEgPT09IG51bGwgfHwgYXJlYSBpbnN0YW5jZW9mIFNoYXBlIHx8IGFyZWEgaW5zdGFuY2VvZiBCb3VuZHMyLCAnbW91c2VBcmVhIG5lZWRzIHRvIGJlIGEgcGhldC5raXRlLlNoYXBlLCBwaGV0LmRvdC5Cb3VuZHMyLCBvciBudWxsJyApO1xyXG5cclxuICAgIGlmICggdGhpcy5fbW91c2VBcmVhICE9PSBhcmVhICkge1xyXG4gICAgICB0aGlzLl9tb3VzZUFyZWEgPSBhcmVhOyAvLyBUT0RPOiBjb3VsZCBjaGFuZ2Ugd2hhdCBpcyB1bmRlciB0aGUgbW91c2UsIGludmFsaWRhdGUhIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcblxyXG4gICAgICB0aGlzLl9waWNrZXIub25Nb3VzZUFyZWFDaGFuZ2UoKTtcclxuICAgICAgaWYgKCBhc3NlcnRTbG93ICkgeyB0aGlzLl9waWNrZXIuYXVkaXQoKTsgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldE1vdXNlQXJlYSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBtb3VzZUFyZWEoIHZhbHVlOiBTaGFwZSB8IEJvdW5kczIgfCBudWxsICkge1xyXG4gICAgdGhpcy5zZXRNb3VzZUFyZWEoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZ2V0TW91c2VBcmVhKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IG1vdXNlQXJlYSgpOiBTaGFwZSB8IEJvdW5kczIgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLmdldE1vdXNlQXJlYSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgaGl0LXRlc3RlZCBtb3VzZSBhcmVhIGZvciB0aGlzIG5vZGUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldE1vdXNlQXJlYSgpOiBTaGFwZSB8IEJvdW5kczIgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLl9tb3VzZUFyZWE7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBoaXQtdGVzdGVkIHRvdWNoIGFyZWEgZm9yIHRoaXMgTm9kZSAoc2VlIGNvbnN0cnVjdG9yIGZvciBtb3JlIGFkdmFuY2VkIGRvY3VtZW50YXRpb24pLiBVc2UgbnVsbCBmb3IgdGhlXHJcbiAgICogZGVmYXVsdCBiZWhhdmlvci5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0VG91Y2hBcmVhKCBhcmVhOiBTaGFwZSB8IEJvdW5kczIgfCBudWxsICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggYXJlYSA9PT0gbnVsbCB8fCBhcmVhIGluc3RhbmNlb2YgU2hhcGUgfHwgYXJlYSBpbnN0YW5jZW9mIEJvdW5kczIsICd0b3VjaEFyZWEgbmVlZHMgdG8gYmUgYSBwaGV0LmtpdGUuU2hhcGUsIHBoZXQuZG90LkJvdW5kczIsIG9yIG51bGwnICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl90b3VjaEFyZWEgIT09IGFyZWEgKSB7XHJcbiAgICAgIHRoaXMuX3RvdWNoQXJlYSA9IGFyZWE7IC8vIFRPRE86IGNvdWxkIGNoYW5nZSB3aGF0IGlzIHVuZGVyIHRoZSB0b3VjaCwgaW52YWxpZGF0ZSEgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuXHJcbiAgICAgIHRoaXMuX3BpY2tlci5vblRvdWNoQXJlYUNoYW5nZSgpO1xyXG4gICAgICBpZiAoIGFzc2VydFNsb3cgKSB7IHRoaXMuX3BpY2tlci5hdWRpdCgpOyB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0VG91Y2hBcmVhKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IHRvdWNoQXJlYSggdmFsdWU6IFNoYXBlIHwgQm91bmRzMiB8IG51bGwgKSB7XHJcbiAgICB0aGlzLnNldFRvdWNoQXJlYSggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRUb3VjaEFyZWEoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgdG91Y2hBcmVhKCk6IFNoYXBlIHwgQm91bmRzMiB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0VG91Y2hBcmVhKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBoaXQtdGVzdGVkIHRvdWNoIGFyZWEgZm9yIHRoaXMgbm9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0VG91Y2hBcmVhKCk6IFNoYXBlIHwgQm91bmRzMiB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuX3RvdWNoQXJlYTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgYSBjbGlwcGVkIHNoYXBlIHdoZXJlIG9ubHkgY29udGVudCBpbiBvdXIgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSB0aGF0IGlzIGluc2lkZSB0aGUgY2xpcCBhcmVhIHdpbGwgYmUgc2hvd25cclxuICAgKiAoYW55dGhpbmcgb3V0c2lkZSBpcyBmdWxseSB0cmFuc3BhcmVudCkuXHJcbiAgICovXHJcbiAgcHVibGljIHNldENsaXBBcmVhKCBzaGFwZTogU2hhcGUgfCBudWxsICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggc2hhcGUgPT09IG51bGwgfHwgc2hhcGUgaW5zdGFuY2VvZiBTaGFwZSwgJ2NsaXBBcmVhIG5lZWRzIHRvIGJlIGEgcGhldC5raXRlLlNoYXBlLCBvciBudWxsJyApO1xyXG5cclxuICAgIGlmICggdGhpcy5jbGlwQXJlYSAhPT0gc2hhcGUgKSB7XHJcbiAgICAgIHRoaXMuY2xpcEFyZWFQcm9wZXJ0eS52YWx1ZSA9IHNoYXBlO1xyXG5cclxuICAgICAgdGhpcy5pbnZhbGlkYXRlQm91bmRzKCk7XHJcbiAgICAgIHRoaXMuX3BpY2tlci5vbkNsaXBBcmVhQ2hhbmdlKCk7XHJcblxyXG4gICAgICBpZiAoIGFzc2VydFNsb3cgKSB7IHRoaXMuX3BpY2tlci5hdWRpdCgpOyB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0Q2xpcEFyZWEoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgY2xpcEFyZWEoIHZhbHVlOiBTaGFwZSB8IG51bGwgKSB7XHJcbiAgICB0aGlzLnNldENsaXBBcmVhKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldENsaXBBcmVhKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGNsaXBBcmVhKCk6IFNoYXBlIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRDbGlwQXJlYSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY2xpcHBlZCBhcmVhIGZvciB0aGlzIG5vZGUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldENsaXBBcmVhKCk6IFNoYXBlIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5jbGlwQXJlYVByb3BlcnR5LnZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoaXMgTm9kZSBoYXMgYSBjbGlwIGFyZWEuXHJcbiAgICovXHJcbiAgcHVibGljIGhhc0NsaXBBcmVhKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuY2xpcEFyZWEgIT09IG51bGw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHdoYXQgc2VsZiByZW5kZXJlcnMgKGFuZCBvdGhlciBiaXRtYXNrIGZsYWdzKSBhcmUgc3VwcG9ydGVkIGJ5IHRoaXMgbm9kZS5cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgc2V0UmVuZGVyZXJCaXRtYXNrKCBiaXRtYXNrOiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggYml0bWFzayApICk7XHJcblxyXG4gICAgaWYgKCBiaXRtYXNrICE9PSB0aGlzLl9yZW5kZXJlckJpdG1hc2sgKSB7XHJcbiAgICAgIHRoaXMuX3JlbmRlcmVyQml0bWFzayA9IGJpdG1hc2s7XHJcblxyXG4gICAgICB0aGlzLl9yZW5kZXJlclN1bW1hcnkuc2VsZkNoYW5nZSgpO1xyXG5cclxuICAgICAgdGhpcy5pbnN0YW5jZVJlZnJlc2hFbWl0dGVyLmVtaXQoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1lYW50IHRvIGJlIG92ZXJyaWRkZW4sIHNvIHRoYXQgaXQgY2FuIGJlIGNhbGxlZCB0byBlbnN1cmUgdGhhdCB0aGUgcmVuZGVyZXIgYml0bWFzayB3aWxsIGJlIHVwLXRvLWRhdGUuXHJcbiAgICovXHJcbiAgcHVibGljIGludmFsaWRhdGVTdXBwb3J0ZWRSZW5kZXJlcnMoKTogdm9pZCB7XHJcbiAgICAvLyBzZWUgZG9jc1xyXG4gIH1cclxuXHJcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXHJcbiAgICogSGludHNcclxuICAgKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuICAvKipcclxuICAgKiBXaGVuIEFOWSBoaW50IGNoYW5nZXMsIHdlIHJlZnJlc2ggZXZlcnl0aGluZyBjdXJyZW50bHkgKGZvciBzYWZldHksIHRoaXMgbWF5IGJlIHBvc3NpYmxlIHRvIG1ha2UgbW9yZSBzcGVjaWZpY1xyXG4gICAqIGluIHRoZSBmdXR1cmUsIGJ1dCBoaW50IGNoYW5nZXMgYXJlIG5vdCBwYXJ0aWN1bGFybHkgY29tbW9uIHBlcmZvcm1hbmNlIGJvdHRsZW5lY2spLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgaW52YWxpZGF0ZUhpbnQoKTogdm9pZCB7XHJcbiAgICB0aGlzLnJlbmRlcmVyU3VtbWFyeVJlZnJlc2hFbWl0dGVyLmVtaXQoKTtcclxuICAgIHRoaXMuaW5zdGFuY2VSZWZyZXNoRW1pdHRlci5lbWl0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIGEgcHJlZmVycmVkIHJlbmRlcmVyIGZvciB0aGlzIE5vZGUgYW5kIGl0cyBzdWItdHJlZS4gU2NlbmVyeSB3aWxsIGF0dGVtcHQgdG8gdXNlIHRoaXMgcmVuZGVyZXIgdW5kZXIgaGVyZVxyXG4gICAqIHVubGVzcyBpdCBpc24ndCBzdXBwb3J0ZWQsIE9SIGFub3RoZXIgcHJlZmVycmVkIHJlbmRlcmVyIGlzIHNldCBhcyBhIGNsb3NlciBhbmNlc3Rvci4gQWNjZXB0YWJsZSB2YWx1ZXMgYXJlOlxyXG4gICAqIC0gbnVsbCAoZGVmYXVsdCwgbm8gcHJlZmVyZW5jZSlcclxuICAgKiAtICdjYW52YXMnXHJcbiAgICogLSAnc3ZnJ1xyXG4gICAqIC0gJ2RvbSdcclxuICAgKiAtICd3ZWJnbCdcclxuICAgKi9cclxuICBwdWJsaWMgc2V0UmVuZGVyZXIoIHJlbmRlcmVyOiBSZW5kZXJlclR5cGUgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCByZW5kZXJlciA9PT0gbnVsbCB8fCByZW5kZXJlciA9PT0gJ2NhbnZhcycgfHwgcmVuZGVyZXIgPT09ICdzdmcnIHx8IHJlbmRlcmVyID09PSAnZG9tJyB8fCByZW5kZXJlciA9PT0gJ3dlYmdsJyxcclxuICAgICAgJ1JlbmRlcmVyIGlucHV0IHNob3VsZCBiZSBudWxsLCBvciBvbmUgb2Y6IFwiY2FudmFzXCIsIFwic3ZnXCIsIFwiZG9tXCIgb3IgXCJ3ZWJnbFwiLicgKTtcclxuXHJcbiAgICBsZXQgbmV3UmVuZGVyZXIgPSAwO1xyXG4gICAgaWYgKCByZW5kZXJlciA9PT0gJ2NhbnZhcycgKSB7XHJcbiAgICAgIG5ld1JlbmRlcmVyID0gUmVuZGVyZXIuYml0bWFza0NhbnZhcztcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCByZW5kZXJlciA9PT0gJ3N2ZycgKSB7XHJcbiAgICAgIG5ld1JlbmRlcmVyID0gUmVuZGVyZXIuYml0bWFza1NWRztcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCByZW5kZXJlciA9PT0gJ2RvbScgKSB7XHJcbiAgICAgIG5ld1JlbmRlcmVyID0gUmVuZGVyZXIuYml0bWFza0RPTTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCByZW5kZXJlciA9PT0gJ3dlYmdsJyApIHtcclxuICAgICAgbmV3UmVuZGVyZXIgPSBSZW5kZXJlci5iaXRtYXNrV2ViR0w7XHJcbiAgICB9XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAoIHJlbmRlcmVyID09PSBudWxsICkgPT09ICggbmV3UmVuZGVyZXIgPT09IDAgKSxcclxuICAgICAgJ1dlIHNob3VsZCBvbmx5IGVuZCB1cCB3aXRoIG5vIGFjdHVhbCByZW5kZXJlciBpZiByZW5kZXJlciBpcyBudWxsJyApO1xyXG5cclxuICAgIGlmICggdGhpcy5fcmVuZGVyZXIgIT09IG5ld1JlbmRlcmVyICkge1xyXG4gICAgICB0aGlzLl9yZW5kZXJlciA9IG5ld1JlbmRlcmVyO1xyXG5cclxuICAgICAgdGhpcy5pbnZhbGlkYXRlSGludCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldFJlbmRlcmVyKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IHJlbmRlcmVyKCB2YWx1ZTogUmVuZGVyZXJUeXBlICkge1xyXG4gICAgdGhpcy5zZXRSZW5kZXJlciggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRSZW5kZXJlcigpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCByZW5kZXJlcigpOiBSZW5kZXJlclR5cGUge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0UmVuZGVyZXIoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHByZWZlcnJlZCByZW5kZXJlciAoaWYgYW55KSBvZiB0aGlzIG5vZGUsIGFzIGEgc3RyaW5nLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRSZW5kZXJlcigpOiBSZW5kZXJlclR5cGUge1xyXG4gICAgaWYgKCB0aGlzLl9yZW5kZXJlciA9PT0gMCApIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggdGhpcy5fcmVuZGVyZXIgPT09IFJlbmRlcmVyLmJpdG1hc2tDYW52YXMgKSB7XHJcbiAgICAgIHJldHVybiAnY2FudmFzJztcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0aGlzLl9yZW5kZXJlciA9PT0gUmVuZGVyZXIuYml0bWFza1NWRyApIHtcclxuICAgICAgcmV0dXJuICdzdmcnO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHRoaXMuX3JlbmRlcmVyID09PSBSZW5kZXJlci5iaXRtYXNrRE9NICkge1xyXG4gICAgICByZXR1cm4gJ2RvbSc7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggdGhpcy5fcmVuZGVyZXIgPT09IFJlbmRlcmVyLmJpdG1hc2tXZWJHTCApIHtcclxuICAgICAgcmV0dXJuICd3ZWJnbCc7XHJcbiAgICB9XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBmYWxzZSwgJ1NlZW1zIHRvIGJlIGFuIGludmFsaWQgcmVuZGVyZXI/JyApO1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHdoZXRoZXIgb3Igbm90IFNjZW5lcnkgd2lsbCB0cnkgdG8gcHV0IHRoaXMgTm9kZSAoYW5kIGl0cyBkZXNjZW5kYW50cykgaW50byBhIHNlcGFyYXRlIFNWRy9DYW52YXMvV2ViR0wvZXRjLlxyXG4gICAqIGxheWVyLCBkaWZmZXJlbnQgZnJvbSBvdGhlciBzaWJsaW5ncyBvciBvdGhlciBub2Rlcy4gQ2FuIGJlIHVzZWQgZm9yIHBlcmZvcm1hbmNlIHB1cnBvc2VzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRMYXllclNwbGl0KCBzcGxpdDogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIGlmICggc3BsaXQgIT09IHRoaXMuX2xheWVyU3BsaXQgKSB7XHJcbiAgICAgIHRoaXMuX2xheWVyU3BsaXQgPSBzcGxpdDtcclxuXHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZUhpbnQoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRMYXllclNwbGl0KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGxheWVyU3BsaXQoIHZhbHVlOiBib29sZWFuICkge1xyXG4gICAgdGhpcy5zZXRMYXllclNwbGl0KCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGlzTGF5ZXJTcGxpdCgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBsYXllclNwbGl0KCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuaXNMYXllclNwbGl0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIGxheWVyU3BsaXQgcGVyZm9ybWFuY2UgZmxhZyBpcyBzZXQuXHJcbiAgICovXHJcbiAgcHVibGljIGlzTGF5ZXJTcGxpdCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl9sYXllclNwbGl0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB3aGV0aGVyIG9yIG5vdCBTY2VuZXJ5IHdpbGwgdGFrZSBpbnRvIGFjY291bnQgdGhhdCB0aGlzIE5vZGUgcGxhbnMgdG8gdXNlIG9wYWNpdHkuIENhbiBoYXZlIHBlcmZvcm1hbmNlXHJcbiAgICogZ2FpbnMgaWYgdGhlcmUgbmVlZCB0byBiZSBtdWx0aXBsZSBsYXllcnMgZm9yIHRoaXMgbm9kZSdzIGRlc2NlbmRhbnRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRVc2VzT3BhY2l0eSggdXNlc09wYWNpdHk6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICBpZiAoIHVzZXNPcGFjaXR5ICE9PSB0aGlzLl91c2VzT3BhY2l0eSApIHtcclxuICAgICAgdGhpcy5fdXNlc09wYWNpdHkgPSB1c2VzT3BhY2l0eTtcclxuXHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZUhpbnQoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRVc2VzT3BhY2l0eSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCB1c2VzT3BhY2l0eSggdmFsdWU6IGJvb2xlYW4gKSB7XHJcbiAgICB0aGlzLnNldFVzZXNPcGFjaXR5KCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFVzZXNPcGFjaXR5KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHVzZXNPcGFjaXR5KCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0VXNlc09wYWNpdHkoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciB0aGUgdXNlc09wYWNpdHkgcGVyZm9ybWFuY2UgZmxhZyBpcyBzZXQuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFVzZXNPcGFjaXR5KCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX3VzZXNPcGFjaXR5O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyBhIGZsYWcgZm9yIHdoZXRoZXIgd2hldGhlciB0aGUgY29udGVudHMgb2YgdGhpcyBOb2RlIGFuZCBpdHMgY2hpbGRyZW4gc2hvdWxkIGJlIGRpc3BsYXllZCBpbiBhIHNlcGFyYXRlXHJcbiAgICogRE9NIGVsZW1lbnQgdGhhdCBpcyB0cmFuc2Zvcm1lZCB3aXRoIENTUyB0cmFuc2Zvcm1zLiBJdCBjYW4gaGF2ZSBwb3RlbnRpYWwgc3BlZWR1cHMsIHNpbmNlIHRoZSBicm93c2VyIG1heSBub3RcclxuICAgKiBoYXZlIHRvIHJlLXJhc3Rlcml6ZSBjb250ZW50cyB3aGVuIGl0IGlzIGFuaW1hdGVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRDU1NUcmFuc2Zvcm0oIGNzc1RyYW5zZm9ybTogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIGlmICggY3NzVHJhbnNmb3JtICE9PSB0aGlzLl9jc3NUcmFuc2Zvcm0gKSB7XHJcbiAgICAgIHRoaXMuX2Nzc1RyYW5zZm9ybSA9IGNzc1RyYW5zZm9ybTtcclxuXHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZUhpbnQoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRDU1NUcmFuc2Zvcm0oKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgY3NzVHJhbnNmb3JtKCB2YWx1ZTogYm9vbGVhbiApIHtcclxuICAgIHRoaXMuc2V0Q1NTVHJhbnNmb3JtKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGlzQ1NTVHJhbnNmb3JtZWQoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgY3NzVHJhbnNmb3JtKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuaXNDU1NUcmFuc2Zvcm1lZCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoZSBjc3NUcmFuc2Zvcm0gcGVyZm9ybWFuY2UgZmxhZyBpcyBzZXQuXHJcbiAgICovXHJcbiAgcHVibGljIGlzQ1NTVHJhbnNmb3JtZWQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5fY3NzVHJhbnNmb3JtO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyBhIHBlcmZvcm1hbmNlIGZsYWcgZm9yIHdoZXRoZXIgbGF5ZXJzL0RPTSBlbGVtZW50cyBzaG91bGQgYmUgZXhjbHVkZWQgKG9yIGluY2x1ZGVkKSB3aGVuIHRoaW5ncyBhcmVcclxuICAgKiBpbnZpc2libGUuIFRoZSBkZWZhdWx0IGlzIGZhbHNlLCBhbmQgaW52aXNpYmxlIGNvbnRlbnQgaXMgaW4gdGhlIERPTSwgYnV0IGhpZGRlbi5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0RXhjbHVkZUludmlzaWJsZSggZXhjbHVkZUludmlzaWJsZTogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIGlmICggZXhjbHVkZUludmlzaWJsZSAhPT0gdGhpcy5fZXhjbHVkZUludmlzaWJsZSApIHtcclxuICAgICAgdGhpcy5fZXhjbHVkZUludmlzaWJsZSA9IGV4Y2x1ZGVJbnZpc2libGU7XHJcblxyXG4gICAgICB0aGlzLmludmFsaWRhdGVIaW50KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0RXhjbHVkZUludmlzaWJsZSgpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBleGNsdWRlSW52aXNpYmxlKCB2YWx1ZTogYm9vbGVhbiApIHtcclxuICAgIHRoaXMuc2V0RXhjbHVkZUludmlzaWJsZSggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBpc0V4Y2x1ZGVJbnZpc2libGUoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgZXhjbHVkZUludmlzaWJsZSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmlzRXhjbHVkZUludmlzaWJsZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoZSBleGNsdWRlSW52aXNpYmxlIHBlcmZvcm1hbmNlIGZsYWcgaXMgc2V0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc0V4Y2x1ZGVJbnZpc2libGUoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5fZXhjbHVkZUludmlzaWJsZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIElmIHRoaXMgaXMgc2V0IHRvIHRydWUsIGNoaWxkIG5vZGVzIHRoYXQgYXJlIGludmlzaWJsZSB3aWxsIE5PVCBjb250cmlidXRlIHRvIHRoZSBib3VuZHMgb2YgdGhpcyBub2RlLlxyXG4gICAqXHJcbiAgICogVGhlIGRlZmF1bHQgaXMgZm9yIGNoaWxkIG5vZGVzIGJvdW5kcycgdG8gYmUgaW5jbHVkZWQgaW4gdGhpcyBub2RlJ3MgYm91bmRzLCBidXQgdGhhdCB3b3VsZCBpbiBnZW5lcmFsIGJlIGFcclxuICAgKiBwcm9ibGVtIGZvciBsYXlvdXQgY29udGFpbmVycyBvciBvdGhlciBzaXR1YXRpb25zLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2pvaXN0L2lzc3Vlcy82MDguXHJcbiAgICovXHJcbiAgcHVibGljIHNldEV4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMoIGV4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHM6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICBpZiAoIGV4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMgIT09IHRoaXMuX2V4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMgKSB7XHJcbiAgICAgIHRoaXMuX2V4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMgPSBleGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzO1xyXG5cclxuICAgICAgdGhpcy5pbnZhbGlkYXRlQm91bmRzKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgc2V0RXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcygpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBleGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzKCB2YWx1ZTogYm9vbGVhbiApIHtcclxuICAgIHRoaXMuc2V0RXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcyggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBpc0V4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcygpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmlzRXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoZSBleGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzIGZsYWcgaXMgc2V0LCBzZWVcclxuICAgKiBzZXRFeGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzKCkgZm9yIGRvY3VtZW50YXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIGlzRXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcygpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl9leGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyBvcHRpb25zIHRoYXQgYXJlIHByb3ZpZGVkIHRvIGxheW91dCBtYW5hZ2VycyBpbiBvcmRlciB0byBjdXN0b21pemUgcG9zaXRpb25pbmcgb2YgdGhpcyBub2RlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRMYXlvdXRPcHRpb25zKCBsYXlvdXRPcHRpb25zOiBUTGF5b3V0T3B0aW9ucyB8IG51bGwgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBsYXlvdXRPcHRpb25zID09PSBudWxsIHx8ICggdHlwZW9mIGxheW91dE9wdGlvbnMgPT09ICdvYmplY3QnICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZiggbGF5b3V0T3B0aW9ucyApID09PSBPYmplY3QucHJvdG90eXBlICksXHJcbiAgICAgICdsYXlvdXRPcHRpb25zIHNob3VsZCBiZSBudWxsIG9yIGFuIHBsYWluIG9wdGlvbnMtc3R5bGUgb2JqZWN0JyApO1xyXG5cclxuICAgIGlmICggbGF5b3V0T3B0aW9ucyAhPT0gdGhpcy5fbGF5b3V0T3B0aW9ucyApIHtcclxuICAgICAgdGhpcy5fbGF5b3V0T3B0aW9ucyA9IGxheW91dE9wdGlvbnM7XHJcblxyXG4gICAgICB0aGlzLmxheW91dE9wdGlvbnNDaGFuZ2VkRW1pdHRlci5lbWl0KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGxheW91dE9wdGlvbnMoIHZhbHVlOiBUTGF5b3V0T3B0aW9ucyB8IG51bGwgKSB7XHJcbiAgICB0aGlzLnNldExheW91dE9wdGlvbnMoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGxheW91dE9wdGlvbnMoKTogVExheW91dE9wdGlvbnMgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLmdldExheW91dE9wdGlvbnMoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXRMYXlvdXRPcHRpb25zKCk6IFRMYXlvdXRPcHRpb25zIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5fbGF5b3V0T3B0aW9ucztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBtdXRhdGVMYXlvdXRPcHRpb25zKCBsYXlvdXRPcHRpb25zPzogVExheW91dE9wdGlvbnMgKTogdm9pZCB7XHJcbiAgICB0aGlzLmxheW91dE9wdGlvbnMgPSBvcHRpb25pemUzPFRMYXlvdXRPcHRpb25zLCBFbXB0eVNlbGZPcHRpb25zLCBUTGF5b3V0T3B0aW9ucz4oKSgge30sIHRoaXMubGF5b3V0T3B0aW9ucyB8fCB7fSwgbGF5b3V0T3B0aW9ucyApO1xyXG4gIH1cclxuXHJcbiAgLy8gRGVmYXVsdHMgaW5kaWNhdGluZyB0aGF0IHdlIGRvbid0IG1peCBpbiBXaWR0aFNpemFibGUvSGVpZ2h0U2l6YWJsZVxyXG4gIHB1YmxpYyBnZXQgd2lkdGhTaXphYmxlKCk6IGJvb2xlYW4geyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgcHVibGljIGdldCBoZWlnaHRTaXphYmxlKCk6IGJvb2xlYW4geyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgcHVibGljIGdldCBleHRlbmRzV2lkdGhTaXphYmxlKCk6IGJvb2xlYW4geyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgcHVibGljIGdldCBleHRlbmRzSGVpZ2h0U2l6YWJsZSgpOiBib29sZWFuIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZXh0ZW5kc1NpemFibGUoKTogYm9vbGVhbiB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBwcmV2ZW50Rml0IHBlcmZvcm1hbmNlIGZsYWcuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFByZXZlbnRGaXQoIHByZXZlbnRGaXQ6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICBpZiAoIHByZXZlbnRGaXQgIT09IHRoaXMuX3ByZXZlbnRGaXQgKSB7XHJcbiAgICAgIHRoaXMuX3ByZXZlbnRGaXQgPSBwcmV2ZW50Rml0O1xyXG5cclxuICAgICAgdGhpcy5pbnZhbGlkYXRlSGludCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIHNldFByZXZlbnRGaXQoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgcHJldmVudEZpdCggdmFsdWU6IGJvb2xlYW4gKSB7XHJcbiAgICB0aGlzLnNldFByZXZlbnRGaXQoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgaXNQcmV2ZW50Rml0KCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHByZXZlbnRGaXQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5pc1ByZXZlbnRGaXQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciB0aGUgcHJldmVudEZpdCBwZXJmb3JtYW5jZSBmbGFnIGlzIHNldC5cclxuICAgKi9cclxuICBwdWJsaWMgaXNQcmV2ZW50Rml0KCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX3ByZXZlbnRGaXQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHdoZXRoZXIgdGhlcmUgaXMgYSBjdXN0b20gV2ViR0wgc2NhbGUgYXBwbGllZCB0byB0aGUgQ2FudmFzLCBhbmQgaWYgc28gd2hhdCBzY2FsZS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0V2ViR0xTY2FsZSggd2ViZ2xTY2FsZTogbnVtYmVyIHwgbnVsbCApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHdlYmdsU2NhbGUgPT09IG51bGwgfHwgKCB0eXBlb2Ygd2ViZ2xTY2FsZSA9PT0gJ251bWJlcicgJiYgaXNGaW5pdGUoIHdlYmdsU2NhbGUgKSApICk7XHJcblxyXG4gICAgaWYgKCB3ZWJnbFNjYWxlICE9PSB0aGlzLl93ZWJnbFNjYWxlICkge1xyXG4gICAgICB0aGlzLl93ZWJnbFNjYWxlID0gd2ViZ2xTY2FsZTtcclxuXHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZUhpbnQoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBzZXRXZWJHTFNjYWxlKCkgZm9yIG1vcmUgaW5mb3JtYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IHdlYmdsU2NhbGUoIHZhbHVlOiBudW1iZXIgfCBudWxsICkge1xyXG4gICAgdGhpcy5zZXRXZWJHTFNjYWxlKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldFdlYkdMU2NhbGUoKSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgd2ViZ2xTY2FsZSgpOiBudW1iZXIgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLmdldFdlYkdMU2NhbGUoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHZhbHVlIG9mIHRoZSB3ZWJnbFNjYWxlIHBlcmZvcm1hbmNlIGZsYWcuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFdlYkdMU2NhbGUoKTogbnVtYmVyIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5fd2ViZ2xTY2FsZTtcclxuICB9XHJcblxyXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxyXG4gICAqIFRyYWlsIG9wZXJhdGlvbnNcclxuICAgKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBvbmUgVHJhaWwgdGhhdCBzdGFydHMgZnJvbSBhIG5vZGUgd2l0aCBubyBwYXJlbnRzIChvciBpZiB0aGUgcHJlZGljYXRlIGlzIHByZXNlbnQsIGEgTm9kZSB0aGF0XHJcbiAgICogc2F0aXNmaWVzIGl0KSwgYW5kIGVuZHMgYXQgdGhpcyBub2RlLiBJZiBtb3JlIHRoYW4gb25lIFRyYWlsIHdvdWxkIHNhdGlzZnkgdGhlc2UgY29uZGl0aW9ucywgYW4gYXNzZXJ0aW9uIGlzXHJcbiAgICogdGhyb3duIChwbGVhc2UgdXNlIGdldFRyYWlscygpIGZvciB0aG9zZSBjYXNlcykuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gW3ByZWRpY2F0ZV0gLSBJZiBzdXBwbGllZCwgd2Ugd2lsbCBvbmx5IHJldHVybiB0cmFpbHMgcm9vdGVkIGF0IGEgTm9kZSB0aGF0IHNhdGlzZmllcyBwcmVkaWNhdGUoIG5vZGUgKSA9PSB0cnVlXHJcbiAgICovXHJcbiAgcHVibGljIGdldFVuaXF1ZVRyYWlsKCBwcmVkaWNhdGU/OiAoIG5vZGU6IE5vZGUgKSA9PiBib29sZWFuICk6IFRyYWlsIHtcclxuXHJcbiAgICAvLyBXaXRob3V0IGEgcHJlZGljYXRlLCB3ZSdsbCBiZSBhYmxlIHRvIGJhaWwgb3V0IHRoZSBpbnN0YW50IHdlIGhpdCBhIE5vZGUgd2l0aCAyKyBwYXJlbnRzLCBhbmQgaXQgbWFrZXMgdGhlXHJcbiAgICAvLyBsb2dpYyBlYXNpZXIuXHJcbiAgICBpZiAoICFwcmVkaWNhdGUgKSB7XHJcbiAgICAgIGNvbnN0IHRyYWlsID0gbmV3IFRyYWlsKCk7XHJcblxyXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXRoaXMtYWxpYXNcclxuICAgICAgbGV0IG5vZGU6IE5vZGUgPSB0aGlzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNvbnNpc3RlbnQtdGhpc1xyXG5cclxuICAgICAgd2hpbGUgKCBub2RlICkge1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIG5vZGUuX3BhcmVudHMubGVuZ3RoIDw9IDEsXHJcbiAgICAgICAgICBgZ2V0VW5pcXVlVHJhaWwgZm91bmQgYSBOb2RlIHdpdGggJHtub2RlLl9wYXJlbnRzLmxlbmd0aH0gcGFyZW50cy5gICk7XHJcblxyXG4gICAgICAgIHRyYWlsLmFkZEFuY2VzdG9yKCBub2RlICk7XHJcbiAgICAgICAgbm9kZSA9IG5vZGUuX3BhcmVudHNbIDAgXTsgLy8gc2hvdWxkIGJlIHVuZGVmaW5lZCBpZiB0aGVyZSBhcmVuJ3QgYW55IHBhcmVudHNcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRyYWlsO1xyXG4gICAgfVxyXG4gICAgLy8gV2l0aCBhIHByZWRpY2F0ZSwgd2UgbmVlZCB0byBleHBsb3JlIG11bHRpcGxlIHBhcmVudHMgKHNpbmNlIHRoZSBwcmVkaWNhdGUgbWF5IGZpbHRlciBvdXQgYWxsIGJ1dCBvbmUpXHJcbiAgICBlbHNlIHtcclxuICAgICAgY29uc3QgdHJhaWxzID0gdGhpcy5nZXRUcmFpbHMoIHByZWRpY2F0ZSApO1xyXG5cclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdHJhaWxzLmxlbmd0aCA9PT0gMSxcclxuICAgICAgICBgZ2V0VW5pcXVlVHJhaWwgZm91bmQgJHt0cmFpbHMubGVuZ3RofSBtYXRjaGluZyB0cmFpbHMgZm9yIHRoZSBwcmVkaWNhdGVgICk7XHJcblxyXG4gICAgICByZXR1cm4gdHJhaWxzWyAwIF07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgVHJhaWwgcm9vdGVkIGF0IHJvb3ROb2RlIGFuZCBlbmRzIGF0IHRoaXMgbm9kZS4gVGhyb3dzIGFuIGFzc2VydGlvbiBpZiB0aGUgbnVtYmVyIG9mIHRyYWlscyB0aGF0IG1hdGNoXHJcbiAgICogdGhpcyBjb25kaXRpb24gaXNuJ3QgZXhhY3RseSAxLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRVbmlxdWVUcmFpbFRvKCByb290Tm9kZTogTm9kZSApOiBUcmFpbCB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRVbmlxdWVUcmFpbCggbm9kZSA9PiByb290Tm9kZSA9PT0gbm9kZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiBhbGwgVHJhaWxzIHRoYXQgc3RhcnQgZnJvbSBub2RlcyB3aXRoIG5vIHBhcmVudCAob3IgaWYgYSBwcmVkaWNhdGUgaXMgcHJlc2VudCwgdGhvc2UgdGhhdFxyXG4gICAqIHNhdGlzZnkgdGhlIHByZWRpY2F0ZSksIGFuZCBlbmRzIGF0IHRoaXMgbm9kZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBbcHJlZGljYXRlXSAtIElmIHN1cHBsaWVkLCB3ZSB3aWxsIG9ubHkgcmV0dXJuIFRyYWlscyByb290ZWQgYXQgbm9kZXMgdGhhdCBzYXRpc2Z5IHByZWRpY2F0ZSggbm9kZSApID09IHRydWUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFRyYWlscyggcHJlZGljYXRlPzogKCBub2RlOiBOb2RlICkgPT4gYm9vbGVhbiApOiBUcmFpbFtdIHtcclxuICAgIHByZWRpY2F0ZSA9IHByZWRpY2F0ZSB8fCBOb2RlLmRlZmF1bHRUcmFpbFByZWRpY2F0ZTtcclxuXHJcbiAgICBjb25zdCB0cmFpbHM6IFRyYWlsW10gPSBbXTtcclxuICAgIGNvbnN0IHRyYWlsID0gbmV3IFRyYWlsKCB0aGlzICk7XHJcbiAgICBUcmFpbC5hcHBlbmRBbmNlc3RvclRyYWlsc1dpdGhQcmVkaWNhdGUoIHRyYWlscywgdHJhaWwsIHByZWRpY2F0ZSApO1xyXG5cclxuICAgIHJldHVybiB0cmFpbHM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGFsbCBUcmFpbHMgcm9vdGVkIGF0IHJvb3ROb2RlIGFuZCBlbmQgYXQgdGhpcyBub2RlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRUcmFpbHNUbyggcm9vdE5vZGU6IE5vZGUgKTogVHJhaWxbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRUcmFpbHMoIG5vZGUgPT4gbm9kZSA9PT0gcm9vdE5vZGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgYWxsIFRyYWlscyByb290ZWQgYXQgdGhpcyBOb2RlIGFuZCBlbmQgd2l0aCBub2RlcyB3aXRoIG5vIGNoaWxkcmVuIChvciBpZiBhIHByZWRpY2F0ZSBpc1xyXG4gICAqIHByZXNlbnQsIHRob3NlIHRoYXQgc2F0aXNmeSB0aGUgcHJlZGljYXRlKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBbcHJlZGljYXRlXSAtIElmIHN1cHBsaWVkLCB3ZSB3aWxsIG9ubHkgcmV0dXJuIFRyYWlscyBlbmRpbmcgYXQgbm9kZXMgdGhhdCBzYXRpc2Z5IHByZWRpY2F0ZSggbm9kZSApID09IHRydWUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExlYWZUcmFpbHMoIHByZWRpY2F0ZT86ICggbm9kZTogTm9kZSApID0+IGJvb2xlYW4gKTogVHJhaWxbXSB7XHJcbiAgICBwcmVkaWNhdGUgPSBwcmVkaWNhdGUgfHwgTm9kZS5kZWZhdWx0TGVhZlRyYWlsUHJlZGljYXRlO1xyXG5cclxuICAgIGNvbnN0IHRyYWlsczogVHJhaWxbXSA9IFtdO1xyXG4gICAgY29uc3QgdHJhaWwgPSBuZXcgVHJhaWwoIHRoaXMgKTtcclxuICAgIFRyYWlsLmFwcGVuZERlc2NlbmRhbnRUcmFpbHNXaXRoUHJlZGljYXRlKCB0cmFpbHMsIHRyYWlsLCBwcmVkaWNhdGUgKTtcclxuXHJcbiAgICByZXR1cm4gdHJhaWxzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiBhbGwgVHJhaWxzIHJvb3RlZCBhdCB0aGlzIE5vZGUgYW5kIGVuZCB3aXRoIGxlYWZOb2RlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMZWFmVHJhaWxzVG8oIGxlYWZOb2RlOiBOb2RlICk6IFRyYWlsW10ge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TGVhZlRyYWlscyggbm9kZSA9PiBub2RlID09PSBsZWFmTm9kZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIFRyYWlsIHJvb3RlZCBhdCB0aGlzIG5vZGUgYW5kIGVuZGluZyBhdCBhIE5vZGUgdGhhdCBoYXMgbm8gY2hpbGRyZW4gKG9yIGlmIGEgcHJlZGljYXRlIGlzIHByb3ZpZGVkLCBhXHJcbiAgICogTm9kZSB0aGF0IHNhdGlzZmllcyB0aGUgcHJlZGljYXRlKS4gSWYgbW9yZSB0aGFuIG9uZSB0cmFpbCBtYXRjaGVzIHRoaXMgZGVzY3JpcHRpb24sIGFuIGFzc2VydGlvbiB3aWxsIGJlIGZpcmVkLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIFtwcmVkaWNhdGVdIC0gSWYgc3VwcGxpZWQsIHdlIHdpbGwgcmV0dXJuIGEgVHJhaWwgdGhhdCBlbmRzIHdpdGggYSBOb2RlIHRoYXQgc2F0aXNmaWVzIHByZWRpY2F0ZSggbm9kZSApID09IHRydWVcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0VW5pcXVlTGVhZlRyYWlsKCBwcmVkaWNhdGU/OiAoIG5vZGU6IE5vZGUgKSA9PiBib29sZWFuICk6IFRyYWlsIHtcclxuICAgIGNvbnN0IHRyYWlscyA9IHRoaXMuZ2V0TGVhZlRyYWlscyggcHJlZGljYXRlICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdHJhaWxzLmxlbmd0aCA9PT0gMSxcclxuICAgICAgYGdldFVuaXF1ZUxlYWZUcmFpbCBmb3VuZCAke3RyYWlscy5sZW5ndGh9IG1hdGNoaW5nIHRyYWlscyBmb3IgdGhlIHByZWRpY2F0ZWAgKTtcclxuXHJcbiAgICByZXR1cm4gdHJhaWxzWyAwIF07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgVHJhaWwgcm9vdGVkIGF0IHRoaXMgTm9kZSBhbmQgZW5kaW5nIGF0IGxlYWZOb2RlLiBJZiBtb3JlIHRoYW4gb25lIHRyYWlsIG1hdGNoZXMgdGhpcyBkZXNjcmlwdGlvbixcclxuICAgKiBhbiBhc3NlcnRpb24gd2lsbCBiZSBmaXJlZC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0VW5pcXVlTGVhZlRyYWlsVG8oIGxlYWZOb2RlOiBOb2RlICk6IFRyYWlsIHtcclxuICAgIHJldHVybiB0aGlzLmdldFVuaXF1ZUxlYWZUcmFpbCggbm9kZSA9PiBub2RlID09PSBsZWFmTm9kZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbGwgbm9kZXMgaW4gdGhlIGNvbm5lY3RlZCBjb21wb25lbnQsIHJldHVybmVkIGluIGFuIGFyYml0cmFyeSBvcmRlciwgaW5jbHVkaW5nIG5vZGVzIHRoYXQgYXJlIGFuY2VzdG9yc1xyXG4gICAqIG9mIHRoaXMgbm9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q29ubmVjdGVkTm9kZXMoKTogTm9kZVtdIHtcclxuICAgIGNvbnN0IHJlc3VsdDogTm9kZVtdID0gW107XHJcbiAgICBsZXQgZnJlc2ggPSB0aGlzLl9jaGlsZHJlbi5jb25jYXQoIHRoaXMuX3BhcmVudHMgKS5jb25jYXQoIHRoaXMgKTtcclxuICAgIHdoaWxlICggZnJlc2gubGVuZ3RoICkge1xyXG4gICAgICBjb25zdCBub2RlID0gZnJlc2gucG9wKCkhO1xyXG4gICAgICBpZiAoICFfLmluY2x1ZGVzKCByZXN1bHQsIG5vZGUgKSApIHtcclxuICAgICAgICByZXN1bHQucHVzaCggbm9kZSApO1xyXG4gICAgICAgIGZyZXNoID0gZnJlc2guY29uY2F0KCBub2RlLl9jaGlsZHJlbiwgbm9kZS5fcGFyZW50cyApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbGwgbm9kZXMgaW4gdGhlIHN1YnRyZWUgd2l0aCB0aGlzIE5vZGUgYXMgaXRzIHJvb3QsIHJldHVybmVkIGluIGFuIGFyYml0cmFyeSBvcmRlci4gTGlrZVxyXG4gICAqIGdldENvbm5lY3RlZE5vZGVzLCBidXQgZG9lc24ndCBpbmNsdWRlIHBhcmVudHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFN1YnRyZWVOb2RlcygpOiBOb2RlW10ge1xyXG4gICAgY29uc3QgcmVzdWx0OiBOb2RlW10gPSBbXTtcclxuICAgIGxldCBmcmVzaCA9IHRoaXMuX2NoaWxkcmVuLmNvbmNhdCggdGhpcyApO1xyXG4gICAgd2hpbGUgKCBmcmVzaC5sZW5ndGggKSB7XHJcbiAgICAgIGNvbnN0IG5vZGUgPSBmcmVzaC5wb3AoKSE7XHJcbiAgICAgIGlmICggIV8uaW5jbHVkZXMoIHJlc3VsdCwgbm9kZSApICkge1xyXG4gICAgICAgIHJlc3VsdC5wdXNoKCBub2RlICk7XHJcbiAgICAgICAgZnJlc2ggPSBmcmVzaC5jb25jYXQoIG5vZGUuX2NoaWxkcmVuICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFsbCBub2RlcyB0aGF0IGFyZSBjb25uZWN0ZWQgdG8gdGhpcyBub2RlLCBzb3J0ZWQgaW4gdG9wb2xvZ2ljYWwgb3JkZXIuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFRvcG9sb2dpY2FsbHlTb3J0ZWROb2RlcygpOiBOb2RlW10ge1xyXG4gICAgLy8gc2VlIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvVG9wb2xvZ2ljYWxfc29ydGluZ1xyXG4gICAgY29uc3QgZWRnZXM6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+PiA9IHt9O1xyXG4gICAgY29uc3QgczogTm9kZVtdID0gW107XHJcbiAgICBjb25zdCBsOiBOb2RlW10gPSBbXTtcclxuICAgIGxldCBuOiBOb2RlO1xyXG4gICAgXy5lYWNoKCB0aGlzLmdldENvbm5lY3RlZE5vZGVzKCksIG5vZGUgPT4ge1xyXG4gICAgICBlZGdlc1sgbm9kZS5pZCBdID0ge307XHJcbiAgICAgIF8uZWFjaCggbm9kZS5fY2hpbGRyZW4sIG0gPT4ge1xyXG4gICAgICAgIGVkZ2VzWyBub2RlLmlkIF1bIG0uaWQgXSA9IHRydWU7XHJcbiAgICAgIH0gKTtcclxuICAgICAgaWYgKCAhbm9kZS5wYXJlbnRzLmxlbmd0aCApIHtcclxuICAgICAgICBzLnB1c2goIG5vZGUgKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIGZ1bmN0aW9uIGhhbmRsZUNoaWxkKCBtOiBOb2RlICk6IHZvaWQge1xyXG4gICAgICBkZWxldGUgZWRnZXNbIG4uaWQgXVsgbS5pZCBdO1xyXG4gICAgICBpZiAoIF8uZXZlcnkoIGVkZ2VzLCBjaGlsZHJlbiA9PiAhY2hpbGRyZW5bIG0uaWQgXSApICkge1xyXG4gICAgICAgIC8vIHRoZXJlIGFyZSBubyBtb3JlIGVkZ2VzIHRvIG1cclxuICAgICAgICBzLnB1c2goIG0gKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHdoaWxlICggcy5sZW5ndGggKSB7XHJcbiAgICAgIG4gPSBzLnBvcCgpITtcclxuICAgICAgbC5wdXNoKCBuICk7XHJcblxyXG4gICAgICBfLmVhY2goIG4uX2NoaWxkcmVuLCBoYW5kbGVDaGlsZCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGVuc3VyZSB0aGF0IHRoZXJlIGFyZSBubyBlZGdlcyBsZWZ0LCBzaW5jZSB0aGVuIGl0IHdvdWxkIGNvbnRhaW4gYSBjaXJjdWxhciByZWZlcmVuY2VcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIF8uZXZlcnkoIGVkZ2VzLCBjaGlsZHJlbiA9PiBfLmV2ZXJ5KCBjaGlsZHJlbiwgZmluYWwgPT4gZmFsc2UgKSApLCAnY2lyY3VsYXIgcmVmZXJlbmNlIGNoZWNrJyApO1xyXG5cclxuICAgIHJldHVybiBsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoaXMuYWRkQ2hpbGQoIGNoaWxkICkgd2lsbCBub3QgY2F1c2UgY2lyY3VsYXIgcmVmZXJlbmNlcy5cclxuICAgKi9cclxuICBwdWJsaWMgY2FuQWRkQ2hpbGQoIGNoaWxkOiBOb2RlICk6IGJvb2xlYW4ge1xyXG4gICAgaWYgKCB0aGlzID09PSBjaGlsZCB8fCBfLmluY2x1ZGVzKCB0aGlzLl9jaGlsZHJlbiwgY2hpbGQgKSApIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHNlZSBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1RvcG9sb2dpY2FsX3NvcnRpbmdcclxuICAgIC8vIFRPRE86IHJlbW92ZSBkdXBsaWNhdGlvbiB3aXRoIGFib3ZlIGhhbmRsaW5nPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgY29uc3QgZWRnZXM6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+PiA9IHt9O1xyXG4gICAgY29uc3QgczogTm9kZVtdID0gW107XHJcbiAgICBjb25zdCBsOiBOb2RlW10gPSBbXTtcclxuICAgIGxldCBuOiBOb2RlO1xyXG4gICAgXy5lYWNoKCB0aGlzLmdldENvbm5lY3RlZE5vZGVzKCkuY29uY2F0KCBjaGlsZC5nZXRDb25uZWN0ZWROb2RlcygpICksIG5vZGUgPT4ge1xyXG4gICAgICBlZGdlc1sgbm9kZS5pZCBdID0ge307XHJcbiAgICAgIF8uZWFjaCggbm9kZS5fY2hpbGRyZW4sIG0gPT4ge1xyXG4gICAgICAgIGVkZ2VzWyBub2RlLmlkIF1bIG0uaWQgXSA9IHRydWU7XHJcbiAgICAgIH0gKTtcclxuICAgICAgaWYgKCAhbm9kZS5wYXJlbnRzLmxlbmd0aCAmJiBub2RlICE9PSBjaGlsZCApIHtcclxuICAgICAgICBzLnB1c2goIG5vZGUgKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gICAgZWRnZXNbIHRoaXMuaWQgXVsgY2hpbGQuaWQgXSA9IHRydWU7IC8vIGFkZCBpbiBvdXIgJ25ldycgZWRnZVxyXG4gICAgZnVuY3Rpb24gaGFuZGxlQ2hpbGQoIG06IE5vZGUgKTogdm9pZCB7XHJcbiAgICAgIGRlbGV0ZSBlZGdlc1sgbi5pZCBdWyBtLmlkIF07XHJcbiAgICAgIGlmICggXy5ldmVyeSggZWRnZXMsIGNoaWxkcmVuID0+ICFjaGlsZHJlblsgbS5pZCBdICkgKSB7XHJcbiAgICAgICAgLy8gdGhlcmUgYXJlIG5vIG1vcmUgZWRnZXMgdG8gbVxyXG4gICAgICAgIHMucHVzaCggbSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgd2hpbGUgKCBzLmxlbmd0aCApIHtcclxuICAgICAgbiA9IHMucG9wKCkhO1xyXG4gICAgICBsLnB1c2goIG4gKTtcclxuXHJcbiAgICAgIF8uZWFjaCggbi5fY2hpbGRyZW4sIGhhbmRsZUNoaWxkICk7XHJcblxyXG4gICAgICAvLyBoYW5kbGUgb3VyIG5ldyBlZGdlXHJcbiAgICAgIGlmICggbiA9PT0gdGhpcyApIHtcclxuICAgICAgICBoYW5kbGVDaGlsZCggY2hpbGQgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGVuc3VyZSB0aGF0IHRoZXJlIGFyZSBubyBlZGdlcyBsZWZ0LCBzaW5jZSB0aGVuIGl0IHdvdWxkIGNvbnRhaW4gYSBjaXJjdWxhciByZWZlcmVuY2VcclxuICAgIHJldHVybiBfLmV2ZXJ5KCBlZGdlcywgY2hpbGRyZW4gPT4gXy5ldmVyeSggY2hpbGRyZW4sIGZpbmFsID0+IGZhbHNlICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRvIGJlIG92ZXJyaWRkZW4gaW4gcGFpbnRhYmxlIE5vZGUgdHlwZXMuIFNob3VsZCBob29rIGludG8gdGhlIGRyYXdhYmxlJ3MgcHJvdG90eXBlIChwcmVzdW1hYmx5KS5cclxuICAgKlxyXG4gICAqIERyYXdzIHRoZSBjdXJyZW50IE5vZGUncyBzZWxmIHJlcHJlc2VudGF0aW9uLCBhc3N1bWluZyB0aGUgd3JhcHBlcidzIENhbnZhcyBjb250ZXh0IGlzIGFscmVhZHkgaW4gdGhlIGxvY2FsXHJcbiAgICogY29vcmRpbmF0ZSBmcmFtZSBvZiB0aGlzIG5vZGUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gd3JhcHBlclxyXG4gICAqIEBwYXJhbSBtYXRyaXggLSBUaGUgdHJhbnNmb3JtYXRpb24gbWF0cml4IGFscmVhZHkgYXBwbGllZCB0byB0aGUgY29udGV4dC5cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgY2FudmFzUGFpbnRTZWxmKCB3cmFwcGVyOiBDYW52YXNDb250ZXh0V3JhcHBlciwgbWF0cml4OiBNYXRyaXgzICk6IHZvaWQge1xyXG4gICAgLy8gU2VlIHN1YmNsYXNzIGZvciBpbXBsZW1lbnRhdGlvblxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVuZGVycyB0aGlzIE5vZGUgb25seSAoaXRzIHNlbGYpIGludG8gdGhlIENhbnZhcyB3cmFwcGVyLCBpbiBpdHMgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB3cmFwcGVyXHJcbiAgICogQHBhcmFtIG1hdHJpeCAtIFRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggYWxyZWFkeSBhcHBsaWVkIHRvIHRoZSBjb250ZXh0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyByZW5kZXJUb0NhbnZhc1NlbGYoIHdyYXBwZXI6IENhbnZhc0NvbnRleHRXcmFwcGVyLCBtYXRyaXg6IE1hdHJpeDMgKTogdm9pZCB7XHJcbiAgICBpZiAoIHRoaXMuaXNQYWludGVkKCkgJiYgKCB0aGlzLl9yZW5kZXJlckJpdG1hc2sgJiBSZW5kZXJlci5iaXRtYXNrQ2FudmFzICkgKSB7XHJcbiAgICAgIHRoaXMuY2FudmFzUGFpbnRTZWxmKCB3cmFwcGVyLCBtYXRyaXggKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbmRlcnMgdGhpcyBOb2RlIGFuZCBpdHMgZGVzY2VuZGFudHMgaW50byB0aGUgQ2FudmFzIHdyYXBwZXIuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gd3JhcHBlclxyXG4gICAqIEBwYXJhbSBbbWF0cml4XSAtIE9wdGlvbmFsIHRyYW5zZm9ybSB0byBiZSBhcHBsaWVkXHJcbiAgICovXHJcbiAgcHVibGljIHJlbmRlclRvQ2FudmFzU3VidHJlZSggd3JhcHBlcjogQ2FudmFzQ29udGV4dFdyYXBwZXIsIG1hdHJpeD86IE1hdHJpeDMgKTogdm9pZCB7XHJcbiAgICBtYXRyaXggPSBtYXRyaXggfHwgTWF0cml4My5pZGVudGl0eSgpO1xyXG5cclxuICAgIHdyYXBwZXIucmVzZXRTdHlsZXMoKTtcclxuXHJcbiAgICB0aGlzLnJlbmRlclRvQ2FudmFzU2VsZiggd3JhcHBlciwgbWF0cml4ICk7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLl9jaGlsZHJlbi5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgY2hpbGQgPSB0aGlzLl9jaGlsZHJlblsgaSBdO1xyXG5cclxuICAgICAgLy8gSWdub3JlIGludmFsaWQgKGVtcHR5KSBib3VuZHMsIHNpbmNlIHRoaXMgd291bGQgc2hvdyBub3RoaW5nIChhbmQgd2UgY291bGRuJ3QgY29tcHV0ZSBmaXR0ZWQgYm91bmRzIGZvciBpdCkuXHJcbiAgICAgIGlmICggY2hpbGQuaXNWaXNpYmxlKCkgJiYgY2hpbGQuYm91bmRzLmlzVmFsaWQoKSApIHtcclxuXHJcbiAgICAgICAgLy8gRm9yIGFueXRoaW5nIGZpbHRlci1saWtlLCB3ZSdsbCBuZWVkIHRvIGNyZWF0ZSBhIENhbnZhcywgcmVuZGVyIG91ciBjaGlsZCdzIGNvbnRlbnQgaW50byB0aGF0IENhbnZhcyxcclxuICAgICAgICAvLyBhbmQgdGhlbiAoYXBwbHlpbmcgdGhlIGZpbHRlcikgcmVuZGVyIHRoYXQgaW50byB0aGUgQ2FudmFzIHByb3ZpZGVkLlxyXG4gICAgICAgIGNvbnN0IHJlcXVpcmVzU2NyYXRjaENhbnZhcyA9IGNoaWxkLmVmZmVjdGl2ZU9wYWNpdHkgIT09IDEgfHwgY2hpbGQuY2xpcEFyZWEgfHwgY2hpbGQuX2ZpbHRlcnMubGVuZ3RoO1xyXG5cclxuICAgICAgICB3cmFwcGVyLmNvbnRleHQuc2F2ZSgpO1xyXG4gICAgICAgIG1hdHJpeC5tdWx0aXBseU1hdHJpeCggY2hpbGQuX3RyYW5zZm9ybS5nZXRNYXRyaXgoKSApO1xyXG4gICAgICAgIG1hdHJpeC5jYW52YXNTZXRUcmFuc2Zvcm0oIHdyYXBwZXIuY29udGV4dCApO1xyXG4gICAgICAgIGlmICggcmVxdWlyZXNTY3JhdGNoQ2FudmFzICkge1xyXG4gICAgICAgICAgLy8gV2UnbGwgYXR0ZW1wdCB0byBmaXQgdGhlIENhbnZhcyB0byB0aGUgY29udGVudCB0byBtaW5pbWl6ZSBtZW1vcnkgdXNlLCBzZWVcclxuICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9mdW5jdGlvbi1idWlsZGVyL2lzc3Vlcy8xNDhcclxuXHJcbiAgICAgICAgICAvLyBXZSdyZSBnb2luZyB0byBpZ25vcmUgY29udGVudCBvdXRzaWRlIG91ciB3cmFwcGVyIGNvbnRleHQncyBjYW52YXMuXHJcbiAgICAgICAgICAvLyBBZGRlZCBwYWRkaW5nIGFuZCByb3VuZC1vdXQgZm9yIGNhc2VzIHdoZXJlIENhbnZhcyBib3VuZHMgbWlnaHQgbm90IGJlIGZ1bGx5IGFjY3VyYXRlXHJcbiAgICAgICAgICAvLyBUaGUgbWF0cml4IGFscmVhZHkgaW5jbHVkZXMgdGhlIGNoaWxkJ3MgdHJhbnNmb3JtIChzbyB3ZSB1c2UgbG9jYWxCb3VuZHMpLlxyXG4gICAgICAgICAgLy8gV2Ugd29uJ3QgZ28gb3V0c2lkZSBvdXIgcGFyZW50IGNhbnZhcycgYm91bmRzLCBzaW5jZSB0aGlzIHdvdWxkIGJlIGEgd2FzdGUgb2YgbWVtb3J5ICh3b3VsZG4ndCBiZSB3cml0dGVuKVxyXG4gICAgICAgICAgLy8gVGhlIHJvdW5kLW91dCB3aWxsIG1ha2Ugc3VyZSB3ZSBoYXZlIHBpeGVsIGFsaWdubWVudCwgc28gdGhhdCB3ZSB3b24ndCBnZXQgYmx1cnMgb3IgYWxpYXNpbmcvYmxpdHRpbmdcclxuICAgICAgICAgIC8vIGVmZmVjdHMgd2hlbiBjb3B5aW5nIHRoaW5ncyBvdmVyLlxyXG4gICAgICAgICAgY29uc3QgY2hpbGRDYW52YXNCb3VuZHMgPSBjaGlsZC5sb2NhbEJvdW5kcy50cmFuc2Zvcm1lZCggbWF0cml4ICkuZGlsYXRlKCA0ICkucm91bmRPdXQoKS5jb25zdHJhaW5Cb3VuZHMoXHJcbiAgICAgICAgICAgIHNjcmF0Y2hCb3VuZHMyRXh0cmEuc2V0TWluTWF4KCAwLCAwLCB3cmFwcGVyLmNhbnZhcy53aWR0aCwgd3JhcHBlci5jYW52YXMuaGVpZ2h0IClcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgaWYgKCBjaGlsZENhbnZhc0JvdW5kcy53aWR0aCA+IDAgJiYgY2hpbGRDYW52YXNCb3VuZHMuaGVpZ2h0ID4gMCApIHtcclxuICAgICAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFdlJ2xsIHNldCBvdXIgQ2FudmFzIHRvIHRoZSBmaXR0ZWQgd2lkdGgsIGFuZCB3aWxsIGhhbmRsZSB0aGUgb2Zmc2V0cyBiZWxvdy5cclxuICAgICAgICAgICAgY2FudmFzLndpZHRoID0gY2hpbGRDYW52YXNCb3VuZHMud2lkdGg7XHJcbiAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBjaGlsZENhbnZhc0JvdW5kcy5oZWlnaHQ7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCggJzJkJyApITtcclxuICAgICAgICAgICAgY29uc3QgY2hpbGRXcmFwcGVyID0gbmV3IENhbnZhc0NvbnRleHRXcmFwcGVyKCBjYW52YXMsIGNvbnRleHQgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEFmdGVyIG91ciBhbmNlc3RvciB0cmFuc2Zvcm0gaXMgYXBwbGllZCwgd2UnbGwgbmVlZCB0byBhcHBseSBhbm90aGVyIG9mZnNldCBmb3IgZml0dGVkIENhbnZhcy4gV2UnbGxcclxuICAgICAgICAgICAgLy8gbmVlZCB0byBwYXNzIHRoaXMgdG8gZGVzY2VuZGFudHMgQU5EIGFwcGx5IGl0IHRvIHRoZSBzdWItY29udGV4dC5cclxuICAgICAgICAgICAgY29uc3Qgc3ViTWF0cml4ID0gbWF0cml4LmNvcHkoKS5wcmVwZW5kVHJhbnNsYXRpb24oIC1jaGlsZENhbnZhc0JvdW5kcy5taW5YLCAtY2hpbGRDYW52YXNCb3VuZHMubWluWSApO1xyXG5cclxuICAgICAgICAgICAgc3ViTWF0cml4LmNhbnZhc1NldFRyYW5zZm9ybSggY29udGV4dCApO1xyXG4gICAgICAgICAgICBjaGlsZC5yZW5kZXJUb0NhbnZhc1N1YnRyZWUoIGNoaWxkV3JhcHBlciwgc3ViTWF0cml4ICk7XHJcblxyXG4gICAgICAgICAgICB3cmFwcGVyLmNvbnRleHQuc2F2ZSgpO1xyXG4gICAgICAgICAgICBpZiAoIGNoaWxkLmNsaXBBcmVhICkge1xyXG4gICAgICAgICAgICAgIHdyYXBwZXIuY29udGV4dC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgICBjaGlsZC5jbGlwQXJlYS53cml0ZVRvQ29udGV4dCggd3JhcHBlci5jb250ZXh0ICk7XHJcbiAgICAgICAgICAgICAgd3JhcHBlci5jb250ZXh0LmNsaXAoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB3cmFwcGVyLmNvbnRleHQuc2V0VHJhbnNmb3JtKCAxLCAwLCAwLCAxLCAwLCAwICk7IC8vIGlkZW50aXR5XHJcbiAgICAgICAgICAgIHdyYXBwZXIuY29udGV4dC5nbG9iYWxBbHBoYSA9IGNoaWxkLmVmZmVjdGl2ZU9wYWNpdHk7XHJcblxyXG4gICAgICAgICAgICBsZXQgc2V0RmlsdGVyID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGlmICggY2hpbGQuX2ZpbHRlcnMubGVuZ3RoICkge1xyXG4gICAgICAgICAgICAgIC8vIEZpbHRlcnMgc2hvdWxkbid0IGJlIHRvbyBvZnRlbiwgc28gbGVzcyBjb25jZXJuZWQgYWJvdXQgdGhlIEdDIGhlcmUgKGFuZCB0aGlzIGlzIHNvIG11Y2ggZWFzaWVyIHRvIHJlYWQpLlxyXG4gICAgICAgICAgICAgIC8vIFBlcmZvcm1hbmNlIGJvdHRsZW5lY2sgZm9yIG5vdCB1c2luZyB0aGlzIGZhbGxiYWNrIHN0eWxlLCBzbyB3ZSdyZSBhbGxvd2luZyBpdCBmb3IgQ2hyb21lIGV2ZW4gdGhvdWdoXHJcbiAgICAgICAgICAgICAgLy8gdGhlIHZpc3VhbCBkaWZmZXJlbmNlcyBtYXkgYmUgcHJlc2VudCwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xMTM5XHJcbiAgICAgICAgICAgICAgaWYgKCBGZWF0dXJlcy5jYW52YXNGaWx0ZXIgJiYgXy5ldmVyeSggY2hpbGQuX2ZpbHRlcnMsIGZpbHRlciA9PiBmaWx0ZXIuaXNET01Db21wYXRpYmxlKCkgKSApIHtcclxuICAgICAgICAgICAgICAgIHdyYXBwZXIuY29udGV4dC5maWx0ZXIgPSBjaGlsZC5fZmlsdGVycy5tYXAoIGZpbHRlciA9PiBmaWx0ZXIuZ2V0Q1NTRmlsdGVyU3RyaW5nKCkgKS5qb2luKCAnICcgKTtcclxuICAgICAgICAgICAgICAgIHNldEZpbHRlciA9IHRydWU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY2hpbGQuX2ZpbHRlcnMuZm9yRWFjaCggZmlsdGVyID0+IGZpbHRlci5hcHBseUNhbnZhc0ZpbHRlciggY2hpbGRXcmFwcGVyICkgKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFRoZSBpbnZlcnNlIHRyYW5zZm9ybSBpcyBhcHBsaWVkIHRvIGhhbmRsZSBmaXR0aW5nXHJcbiAgICAgICAgICAgIHdyYXBwZXIuY29udGV4dC5kcmF3SW1hZ2UoIGNhbnZhcywgY2hpbGRDYW52YXNCb3VuZHMubWluWCwgY2hpbGRDYW52YXNCb3VuZHMubWluWSApO1xyXG4gICAgICAgICAgICB3cmFwcGVyLmNvbnRleHQucmVzdG9yZSgpO1xyXG4gICAgICAgICAgICBpZiAoIHNldEZpbHRlciApIHtcclxuICAgICAgICAgICAgICB3cmFwcGVyLmNvbnRleHQuZmlsdGVyID0gJ25vbmUnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgY2hpbGQucmVuZGVyVG9DYW52YXNTdWJ0cmVlKCB3cmFwcGVyLCBtYXRyaXggKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbWF0cml4Lm11bHRpcGx5TWF0cml4KCBjaGlsZC5fdHJhbnNmb3JtLmdldEludmVyc2UoKSApO1xyXG4gICAgICAgIHdyYXBwZXIuY29udGV4dC5yZXN0b3JlKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBkZXByZWNhdGVkXHJcbiAgICogUmVuZGVyIHRoaXMgTm9kZSB0byB0aGUgQ2FudmFzIChjbGVhcmluZyBpdCBmaXJzdClcclxuICAgKi9cclxuICBwdWJsaWMgcmVuZGVyVG9DYW52YXMoIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQsIGNvbnRleHQ6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCwgY2FsbGJhY2s/OiAoKSA9PiB2b2lkLCBiYWNrZ3JvdW5kQ29sb3I/OiBzdHJpbmcgKTogdm9pZCB7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGRlcHJlY2F0aW9uV2FybmluZyggJ05vZGUucmVuZGVyVG9DYW52YXMoKSBpcyBkZXByZWNhdGVkLCBwbGVhc2UgdXNlIE5vZGUucmFzdGVyaXplZCgpIGluc3RlYWQnICk7XHJcblxyXG4gICAgLy8gc2hvdWxkIGJhc2ljYWxseSByZXNldCBldmVyeXRoaW5nIChhbmQgY2xlYXIgdGhlIENhbnZhcylcclxuICAgIGNhbnZhcy53aWR0aCA9IGNhbnZhcy53aWR0aDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zZWxmLWFzc2lnblxyXG5cclxuICAgIGlmICggYmFja2dyb3VuZENvbG9yICkge1xyXG4gICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGJhY2tncm91bmRDb2xvcjtcclxuICAgICAgY29udGV4dC5maWxsUmVjdCggMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0ICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgd3JhcHBlciA9IG5ldyBDYW52YXNDb250ZXh0V3JhcHBlciggY2FudmFzLCBjb250ZXh0ICk7XHJcblxyXG4gICAgdGhpcy5yZW5kZXJUb0NhbnZhc1N1YnRyZWUoIHdyYXBwZXIsIE1hdHJpeDMuaWRlbnRpdHkoKSApO1xyXG5cclxuICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKCk7IC8vIHRoaXMgd2FzIG9yaWdpbmFsbHkgYXN5bmNocm9ub3VzLCBzbyB3ZSBoYWQgYSBjYWxsYmFja1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVuZGVycyB0aGlzIE5vZGUgdG8gYW4gSFRNTENhbnZhc0VsZW1lbnQuIElmIHRvQ2FudmFzKCBjYWxsYmFjayApIGlzIHVzZWQsIHRoZSBjYW52YXMgd2lsbCBjb250YWluIHRoZSBub2RlJ3NcclxuICAgKiBlbnRpcmUgYm91bmRzIChpZiBubyB4L3kvd2lkdGgvaGVpZ2h0IGlzIHByb3ZpZGVkKVxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNhbGxiYWNrIC0gY2FsbGJhY2soIGNhbnZhcywgeCwgeSwgd2lkdGgsIGhlaWdodCApIGlzIGNhbGxlZCwgd2hlcmUgeCx5IGFyZSBjb21wdXRlZCBpZiBub3Qgc3BlY2lmaWVkLlxyXG4gICAqIEBwYXJhbSBbeF0gLSBUaGUgWCBvZmZzZXQgZm9yIHdoZXJlIHRoZSB1cHBlci1sZWZ0IG9mIHRoZSBjb250ZW50IGRyYXduIGludG8gdGhlIENhbnZhc1xyXG4gICAqIEBwYXJhbSBbeV0gLSBUaGUgWSBvZmZzZXQgZm9yIHdoZXJlIHRoZSB1cHBlci1sZWZ0IG9mIHRoZSBjb250ZW50IGRyYXduIGludG8gdGhlIENhbnZhc1xyXG4gICAqIEBwYXJhbSBbd2lkdGhdIC0gVGhlIHdpZHRoIG9mIHRoZSBDYW52YXMgb3V0cHV0XHJcbiAgICogQHBhcmFtIFtoZWlnaHRdIC0gVGhlIGhlaWdodCBvZiB0aGUgQ2FudmFzIG91dHB1dFxyXG4gICAqL1xyXG4gIHB1YmxpYyB0b0NhbnZhcyggY2FsbGJhY2s6ICggY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCwgeDogbnVtYmVyLCB5OiBudW1iZXIsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyICkgPT4gdm9pZCwgeD86IG51bWJlciwgeT86IG51bWJlciwgd2lkdGg/OiBudW1iZXIsIGhlaWdodD86IG51bWJlciApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHggPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgeCA9PT0gJ251bWJlcicsICdJZiBwcm92aWRlZCwgeCBzaG91bGQgYmUgYSBudW1iZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB5ID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHkgPT09ICdudW1iZXInLCAnSWYgcHJvdmlkZWQsIHkgc2hvdWxkIGJlIGEgbnVtYmVyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggd2lkdGggPT09IHVuZGVmaW5lZCB8fCAoIHR5cGVvZiB3aWR0aCA9PT0gJ251bWJlcicgJiYgd2lkdGggPj0gMCAmJiAoIHdpZHRoICUgMSA9PT0gMCApICksXHJcbiAgICAgICdJZiBwcm92aWRlZCwgd2lkdGggc2hvdWxkIGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBoZWlnaHQgPT09IHVuZGVmaW5lZCB8fCAoIHR5cGVvZiBoZWlnaHQgPT09ICdudW1iZXInICYmIGhlaWdodCA+PSAwICYmICggaGVpZ2h0ICUgMSA9PT0gMCApICksXHJcbiAgICAgICdJZiBwcm92aWRlZCwgaGVpZ2h0IHNob3VsZCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyJyApO1xyXG5cclxuICAgIGNvbnN0IHBhZGRpbmcgPSAyOyAvLyBwYWRkaW5nIHVzZWQgaWYgeCBhbmQgeSBhcmUgbm90IHNldFxyXG5cclxuICAgIC8vIGZvciBub3csIHdlIGFkZCBhbiB1bnBsZWFzYW50IGhhY2sgYXJvdW5kIFRleHQgYW5kIHNhZmUgYm91bmRzIGluIGdlbmVyYWwuIFdlIGRvbid0IHdhbnQgdG8gYWRkIGFub3RoZXIgQm91bmRzMiBvYmplY3QgcGVyIE5vZGUgZm9yIG5vdy5cclxuICAgIGNvbnN0IGJvdW5kcyA9IHRoaXMuZ2V0Qm91bmRzKCkudW5pb24oIHRoaXMubG9jYWxUb1BhcmVudEJvdW5kcyggdGhpcy5nZXRTYWZlU2VsZkJvdW5kcygpICkgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFib3VuZHMuaXNFbXB0eSgpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAoIHggIT09IHVuZGVmaW5lZCAmJiB5ICE9PSB1bmRlZmluZWQgJiYgd2lkdGggIT09IHVuZGVmaW5lZCAmJiBoZWlnaHQgIT09IHVuZGVmaW5lZCApLFxyXG4gICAgICAnU2hvdWxkIG5vdCBjYWxsIHRvQ2FudmFzIG9uIGEgTm9kZSB3aXRoIGVtcHR5IGJvdW5kcywgdW5sZXNzIGFsbCBkaW1lbnNpb25zIGFyZSBwcm92aWRlZCcgKTtcclxuXHJcbiAgICB4ID0geCAhPT0gdW5kZWZpbmVkID8geCA6IE1hdGguY2VpbCggcGFkZGluZyAtIGJvdW5kcy5taW5YICk7XHJcbiAgICB5ID0geSAhPT0gdW5kZWZpbmVkID8geSA6IE1hdGguY2VpbCggcGFkZGluZyAtIGJvdW5kcy5taW5ZICk7XHJcbiAgICB3aWR0aCA9IHdpZHRoICE9PSB1bmRlZmluZWQgPyB3aWR0aCA6IE1hdGguY2VpbCggYm91bmRzLmdldFdpZHRoKCkgKyAyICogcGFkZGluZyApO1xyXG4gICAgaGVpZ2h0ID0gaGVpZ2h0ICE9PSB1bmRlZmluZWQgPyBoZWlnaHQgOiBNYXRoLmNlaWwoIGJvdW5kcy5nZXRIZWlnaHQoKSArIDIgKiBwYWRkaW5nICk7XHJcblxyXG4gICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcclxuICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuICAgIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCggJzJkJyApITtcclxuXHJcbiAgICAvLyBzaGlmdCBvdXIgcmVuZGVyaW5nIG92ZXIgYnkgdGhlIGRlc2lyZWQgYW1vdW50XHJcbiAgICBjb250ZXh0LnRyYW5zbGF0ZSggeCwgeSApO1xyXG5cclxuICAgIC8vIGZvciBBUEkgY29tcGF0aWJpbGl0eSwgd2UgYXBwbHkgb3VyIG93biB0cmFuc2Zvcm0gaGVyZVxyXG4gICAgdGhpcy5fdHJhbnNmb3JtLmdldE1hdHJpeCgpLmNhbnZhc0FwcGVuZFRyYW5zZm9ybSggY29udGV4dCApO1xyXG5cclxuICAgIGNvbnN0IHdyYXBwZXIgPSBuZXcgQ2FudmFzQ29udGV4dFdyYXBwZXIoIGNhbnZhcywgY29udGV4dCApO1xyXG5cclxuICAgIHRoaXMucmVuZGVyVG9DYW52YXNTdWJ0cmVlKCB3cmFwcGVyLCBNYXRyaXgzLnRyYW5zbGF0aW9uKCB4LCB5ICkudGltZXNNYXRyaXgoIHRoaXMuX3RyYW5zZm9ybS5nZXRNYXRyaXgoKSApICk7XHJcblxyXG4gICAgY2FsbGJhY2soIGNhbnZhcywgeCwgeSwgd2lkdGgsIGhlaWdodCApOyAvLyB3ZSB1c2VkIHRvIGJlIGFzeW5jaHJvbm91c1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVuZGVycyB0aGlzIE5vZGUgdG8gYSBDYW52YXMsIHRoZW4gY2FsbHMgdGhlIGNhbGxiYWNrIHdpdGggdGhlIGRhdGEgVVJJIGZyb20gaXQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY2FsbGJhY2sgLSBjYWxsYmFjayggZGF0YVVSSSB7c3RyaW5nfSwgeCwgeSwgd2lkdGgsIGhlaWdodCApIGlzIGNhbGxlZCwgd2hlcmUgeCx5IGFyZSBjb21wdXRlZCBpZiBub3Qgc3BlY2lmaWVkLlxyXG4gICAqIEBwYXJhbSBbeF0gLSBUaGUgWCBvZmZzZXQgZm9yIHdoZXJlIHRoZSB1cHBlci1sZWZ0IG9mIHRoZSBjb250ZW50IGRyYXduIGludG8gdGhlIENhbnZhc1xyXG4gICAqIEBwYXJhbSBbeV0gLSBUaGUgWSBvZmZzZXQgZm9yIHdoZXJlIHRoZSB1cHBlci1sZWZ0IG9mIHRoZSBjb250ZW50IGRyYXduIGludG8gdGhlIENhbnZhc1xyXG4gICAqIEBwYXJhbSBbd2lkdGhdIC0gVGhlIHdpZHRoIG9mIHRoZSBDYW52YXMgb3V0cHV0XHJcbiAgICogQHBhcmFtIFtoZWlnaHRdIC0gVGhlIGhlaWdodCBvZiB0aGUgQ2FudmFzIG91dHB1dFxyXG4gICAqL1xyXG4gIHB1YmxpYyB0b0RhdGFVUkwoIGNhbGxiYWNrOiAoIGRhdGFVUkk6IHN0cmluZywgeDogbnVtYmVyLCB5OiBudW1iZXIsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyICkgPT4gdm9pZCwgeD86IG51bWJlciwgeT86IG51bWJlciwgd2lkdGg/OiBudW1iZXIsIGhlaWdodD86IG51bWJlciApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHggPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgeCA9PT0gJ251bWJlcicsICdJZiBwcm92aWRlZCwgeCBzaG91bGQgYmUgYSBudW1iZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB5ID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHkgPT09ICdudW1iZXInLCAnSWYgcHJvdmlkZWQsIHkgc2hvdWxkIGJlIGEgbnVtYmVyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggd2lkdGggPT09IHVuZGVmaW5lZCB8fCAoIHR5cGVvZiB3aWR0aCA9PT0gJ251bWJlcicgJiYgd2lkdGggPj0gMCAmJiAoIHdpZHRoICUgMSA9PT0gMCApICksXHJcbiAgICAgICdJZiBwcm92aWRlZCwgd2lkdGggc2hvdWxkIGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBoZWlnaHQgPT09IHVuZGVmaW5lZCB8fCAoIHR5cGVvZiBoZWlnaHQgPT09ICdudW1iZXInICYmIGhlaWdodCA+PSAwICYmICggaGVpZ2h0ICUgMSA9PT0gMCApICksXHJcbiAgICAgICdJZiBwcm92aWRlZCwgaGVpZ2h0IHNob3VsZCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyJyApO1xyXG5cclxuICAgIHRoaXMudG9DYW52YXMoICggY2FudmFzLCB4LCB5LCB3aWR0aCwgaGVpZ2h0ICkgPT4ge1xyXG4gICAgICAvLyB0aGlzIHggYW5kIHkgc2hhZG93IHRoZSBvdXRzaWRlIHBhcmFtZXRlcnMsIGFuZCB3aWxsIGJlIGRpZmZlcmVudCBpZiB0aGUgb3V0c2lkZSBwYXJhbWV0ZXJzIGFyZSB1bmRlZmluZWRcclxuICAgICAgY2FsbGJhY2soIGNhbnZhcy50b0RhdGFVUkwoKSwgeCwgeSwgd2lkdGgsIGhlaWdodCApO1xyXG4gICAgfSwgeCwgeSwgd2lkdGgsIGhlaWdodCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbHMgdGhlIGNhbGxiYWNrIHdpdGggYW4gSFRNTEltYWdlRWxlbWVudCB0aGF0IGNvbnRhaW5zIHRoaXMgTm9kZSdzIHN1YnRyZWUncyB2aXN1YWwgZm9ybS5cclxuICAgKiBXaWxsIGFsd2F5cyBiZSBhc3luY2hyb25vdXMuXHJcbiAgICogQGRlcHJlY2F0ZWQgLSBVc2Ugbm9kZS5yYXN0ZXJpemVkKCkgZm9yIGNyZWF0aW5nIGEgcmFzdGVyaXplZCBjb3B5LCBvciBnZW5lcmFsbHkgaXQncyBiZXN0IHRvIGdldCB0aGUgZGF0YVxyXG4gICAqICAgICAgICAgICAgICAgVVJMIGluc3RlYWQgZGlyZWN0bHkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY2FsbGJhY2sgLSBjYWxsYmFjayggaW1hZ2Uge0hUTUxJbWFnZUVsZW1lbnR9LCB4LCB5ICkgaXMgY2FsbGVkXHJcbiAgICogQHBhcmFtIFt4XSAtIFRoZSBYIG9mZnNldCBmb3Igd2hlcmUgdGhlIHVwcGVyLWxlZnQgb2YgdGhlIGNvbnRlbnQgZHJhd24gaW50byB0aGUgQ2FudmFzXHJcbiAgICogQHBhcmFtIFt5XSAtIFRoZSBZIG9mZnNldCBmb3Igd2hlcmUgdGhlIHVwcGVyLWxlZnQgb2YgdGhlIGNvbnRlbnQgZHJhd24gaW50byB0aGUgQ2FudmFzXHJcbiAgICogQHBhcmFtIFt3aWR0aF0gLSBUaGUgd2lkdGggb2YgdGhlIENhbnZhcyBvdXRwdXRcclxuICAgKiBAcGFyYW0gW2hlaWdodF0gLSBUaGUgaGVpZ2h0IG9mIHRoZSBDYW52YXMgb3V0cHV0XHJcbiAgICovXHJcbiAgcHVibGljIHRvSW1hZ2UoIGNhbGxiYWNrOiAoIGltYWdlOiBIVE1MSW1hZ2VFbGVtZW50LCB4OiBudW1iZXIsIHk6IG51bWJlciApID0+IHZvaWQsIHg/OiBudW1iZXIsIHk/OiBudW1iZXIsIHdpZHRoPzogbnVtYmVyLCBoZWlnaHQ/OiBudW1iZXIgKTogdm9pZCB7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGRlcHJlY2F0aW9uV2FybmluZyggJ05vZGUudG9JbWFnZSgpIGlzIGRlcHJlY2F0ZWQsIHBsZWFzZSB1c2UgTm9kZS5yYXN0ZXJpemVkKCkgaW5zdGVhZCcgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB4ID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHggPT09ICdudW1iZXInLCAnSWYgcHJvdmlkZWQsIHggc2hvdWxkIGJlIGEgbnVtYmVyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggeSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiB5ID09PSAnbnVtYmVyJywgJ0lmIHByb3ZpZGVkLCB5IHNob3VsZCBiZSBhIG51bWJlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHdpZHRoID09PSB1bmRlZmluZWQgfHwgKCB0eXBlb2Ygd2lkdGggPT09ICdudW1iZXInICYmIHdpZHRoID49IDAgJiYgKCB3aWR0aCAlIDEgPT09IDAgKSApLFxyXG4gICAgICAnSWYgcHJvdmlkZWQsIHdpZHRoIHNob3VsZCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaGVpZ2h0ID09PSB1bmRlZmluZWQgfHwgKCB0eXBlb2YgaGVpZ2h0ID09PSAnbnVtYmVyJyAmJiBoZWlnaHQgPj0gMCAmJiAoIGhlaWdodCAlIDEgPT09IDAgKSApLFxyXG4gICAgICAnSWYgcHJvdmlkZWQsIGhlaWdodCBzaG91bGQgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlcicgKTtcclxuXHJcbiAgICB0aGlzLnRvRGF0YVVSTCggKCB1cmwsIHgsIHkgKSA9PiB7XHJcbiAgICAgIC8vIHRoaXMgeCBhbmQgeSBzaGFkb3cgdGhlIG91dHNpZGUgcGFyYW1ldGVycywgYW5kIHdpbGwgYmUgZGlmZmVyZW50IGlmIHRoZSBvdXRzaWRlIHBhcmFtZXRlcnMgYXJlIHVuZGVmaW5lZFxyXG4gICAgICBjb25zdCBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnaW1nJyApO1xyXG4gICAgICBpbWcub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICAgIGNhbGxiYWNrKCBpbWcsIHgsIHkgKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciAtIEkgYmVsaWV2ZSB3ZSBuZWVkIHRvIGRlbGV0ZSB0aGlzXHJcbiAgICAgICAgICBkZWxldGUgaW1nLm9ubG9hZDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2goIGUgKSB7XHJcbiAgICAgICAgICAvLyBkbyBub3RoaW5nXHJcbiAgICAgICAgfSAvLyBmYWlscyBvbiBTYWZhcmkgNS4xXHJcbiAgICAgIH07XHJcbiAgICAgIGltZy5zcmMgPSB1cmw7XHJcbiAgICB9LCB4LCB5LCB3aWR0aCwgaGVpZ2h0ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxscyB0aGUgY2FsbGJhY2sgd2l0aCBhbiBJbWFnZSBOb2RlIHRoYXQgY29udGFpbnMgdGhpcyBOb2RlJ3Mgc3VidHJlZSdzIHZpc3VhbCBmb3JtLiBUaGlzIGlzIGFsd2F5c1xyXG4gICAqIGFzeW5jaHJvbm91cywgYnV0IHRoZSByZXN1bHRpbmcgaW1hZ2UgTm9kZSBjYW4gYmUgdXNlZCB3aXRoIGFueSBiYWNrLWVuZCAoQ2FudmFzL1dlYkdML1NWRy9ldGMuKVxyXG4gICAqIEBkZXByZWNhdGVkIC0gVXNlIG5vZGUucmFzdGVyaXplZCgpIGluc3RlYWQgKHNob3VsZCBhdm9pZCB0aGUgYXN5bmNocm9ub3VzLW5lc3MpXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY2FsbGJhY2sgLSBjYWxsYmFjayggaW1hZ2VOb2RlIHtJbWFnZX0gKSBpcyBjYWxsZWRcclxuICAgKiBAcGFyYW0gW3hdIC0gVGhlIFggb2Zmc2V0IGZvciB3aGVyZSB0aGUgdXBwZXItbGVmdCBvZiB0aGUgY29udGVudCBkcmF3biBpbnRvIHRoZSBDYW52YXNcclxuICAgKiBAcGFyYW0gW3ldIC0gVGhlIFkgb2Zmc2V0IGZvciB3aGVyZSB0aGUgdXBwZXItbGVmdCBvZiB0aGUgY29udGVudCBkcmF3biBpbnRvIHRoZSBDYW52YXNcclxuICAgKiBAcGFyYW0gW3dpZHRoXSAtIFRoZSB3aWR0aCBvZiB0aGUgQ2FudmFzIG91dHB1dFxyXG4gICAqIEBwYXJhbSBbaGVpZ2h0XSAtIFRoZSBoZWlnaHQgb2YgdGhlIENhbnZhcyBvdXRwdXRcclxuICAgKi9cclxuICBwdWJsaWMgdG9JbWFnZU5vZGVBc3luY2hyb25vdXMoIGNhbGxiYWNrOiAoIGltYWdlOiBOb2RlICkgPT4gdm9pZCwgeD86IG51bWJlciwgeT86IG51bWJlciwgd2lkdGg/OiBudW1iZXIsIGhlaWdodD86IG51bWJlciApOiB2b2lkIHtcclxuXHJcbiAgICBhc3NlcnQgJiYgZGVwcmVjYXRpb25XYXJuaW5nKCAnTm9kZS50b0ltYWdlTm9kZUFzeW5jcmhvbm91cygpIGlzIGRlcHJlY2F0ZWQsIHBsZWFzZSB1c2UgTm9kZS5yYXN0ZXJpemVkKCkgaW5zdGVhZCcgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB4ID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHggPT09ICdudW1iZXInLCAnSWYgcHJvdmlkZWQsIHggc2hvdWxkIGJlIGEgbnVtYmVyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggeSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiB5ID09PSAnbnVtYmVyJywgJ0lmIHByb3ZpZGVkLCB5IHNob3VsZCBiZSBhIG51bWJlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHdpZHRoID09PSB1bmRlZmluZWQgfHwgKCB0eXBlb2Ygd2lkdGggPT09ICdudW1iZXInICYmIHdpZHRoID49IDAgJiYgKCB3aWR0aCAlIDEgPT09IDAgKSApLFxyXG4gICAgICAnSWYgcHJvdmlkZWQsIHdpZHRoIHNob3VsZCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaGVpZ2h0ID09PSB1bmRlZmluZWQgfHwgKCB0eXBlb2YgaGVpZ2h0ID09PSAnbnVtYmVyJyAmJiBoZWlnaHQgPj0gMCAmJiAoIGhlaWdodCAlIDEgPT09IDAgKSApLFxyXG4gICAgICAnSWYgcHJvdmlkZWQsIGhlaWdodCBzaG91bGQgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlcicgKTtcclxuXHJcbiAgICB0aGlzLnRvSW1hZ2UoICggaW1hZ2UsIHgsIHkgKSA9PiB7XHJcbiAgICAgIGNhbGxiYWNrKCBuZXcgTm9kZSggeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWh0bWwtY29uc3RydWN0b3JzXHJcbiAgICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICAgIG5ldyBJbWFnZSggaW1hZ2UsIHsgeDogLXgsIHk6IC15IH0gKVxyXG4gICAgICAgIF1cclxuICAgICAgfSApICk7XHJcbiAgICB9LCB4LCB5LCB3aWR0aCwgaGVpZ2h0ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgTm9kZSBjb250YWluaW5nIGFuIEltYWdlIE5vZGUgdGhhdCBjb250YWlucyB0aGlzIE5vZGUncyBzdWJ0cmVlJ3MgdmlzdWFsIGZvcm0uIFRoaXMgaXMgYWx3YXlzXHJcbiAgICogc3luY2hyb25vdXMsIGJ1dCB0aGUgcmVzdWx0aW5nIGltYWdlIE5vZGUgY2FuIE9OTFkgdXNlZCB3aXRoIENhbnZhcy9XZWJHTCAoTk9UIFNWRykuXHJcbiAgICogQGRlcHJlY2F0ZWQgLSBVc2Ugbm9kZS5yYXN0ZXJpemVkKCkgaW5zdGVhZCwgc2hvdWxkIGJlIG1vc3RseSBlcXVpdmFsZW50IGlmIHVzZUNhbnZhczp0cnVlIGlzIHByb3ZpZGVkLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIFt4XSAtIFRoZSBYIG9mZnNldCBmb3Igd2hlcmUgdGhlIHVwcGVyLWxlZnQgb2YgdGhlIGNvbnRlbnQgZHJhd24gaW50byB0aGUgQ2FudmFzXHJcbiAgICogQHBhcmFtIFt5XSAtIFRoZSBZIG9mZnNldCBmb3Igd2hlcmUgdGhlIHVwcGVyLWxlZnQgb2YgdGhlIGNvbnRlbnQgZHJhd24gaW50byB0aGUgQ2FudmFzXHJcbiAgICogQHBhcmFtIFt3aWR0aF0gLSBUaGUgd2lkdGggb2YgdGhlIENhbnZhcyBvdXRwdXRcclxuICAgKiBAcGFyYW0gW2hlaWdodF0gLSBUaGUgaGVpZ2h0IG9mIHRoZSBDYW52YXMgb3V0cHV0XHJcbiAgICovXHJcbiAgcHVibGljIHRvQ2FudmFzTm9kZVN5bmNocm9ub3VzKCB4PzogbnVtYmVyLCB5PzogbnVtYmVyLCB3aWR0aD86IG51bWJlciwgaGVpZ2h0PzogbnVtYmVyICk6IE5vZGUge1xyXG5cclxuICAgIGFzc2VydCAmJiBkZXByZWNhdGlvbldhcm5pbmcoICdOb2RlLnRvQ2FudmFzTm9kZVN5bmNocm9ub3VzKCkgaXMgZGVwcmVjYXRlZCwgcGxlYXNlIHVzZSBOb2RlLnJhc3Rlcml6ZWQoKSBpbnN0ZWFkJyApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHggPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgeCA9PT0gJ251bWJlcicsICdJZiBwcm92aWRlZCwgeCBzaG91bGQgYmUgYSBudW1iZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB5ID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHkgPT09ICdudW1iZXInLCAnSWYgcHJvdmlkZWQsIHkgc2hvdWxkIGJlIGEgbnVtYmVyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggd2lkdGggPT09IHVuZGVmaW5lZCB8fCAoIHR5cGVvZiB3aWR0aCA9PT0gJ251bWJlcicgJiYgd2lkdGggPj0gMCAmJiAoIHdpZHRoICUgMSA9PT0gMCApICksXHJcbiAgICAgICdJZiBwcm92aWRlZCwgd2lkdGggc2hvdWxkIGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBoZWlnaHQgPT09IHVuZGVmaW5lZCB8fCAoIHR5cGVvZiBoZWlnaHQgPT09ICdudW1iZXInICYmIGhlaWdodCA+PSAwICYmICggaGVpZ2h0ICUgMSA9PT0gMCApICksXHJcbiAgICAgICdJZiBwcm92aWRlZCwgaGVpZ2h0IHNob3VsZCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyJyApO1xyXG5cclxuICAgIGxldCByZXN1bHQ6IE5vZGUgfCBudWxsID0gbnVsbDtcclxuICAgIHRoaXMudG9DYW52YXMoICggY2FudmFzLCB4LCB5ICkgPT4ge1xyXG4gICAgICByZXN1bHQgPSBuZXcgTm9kZSggeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWh0bWwtY29uc3RydWN0b3JzXHJcbiAgICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICAgIG5ldyBJbWFnZSggY2FudmFzLCB7IHg6IC14LCB5OiAteSB9IClcclxuICAgICAgICBdXHJcbiAgICAgIH0gKTtcclxuICAgIH0sIHgsIHksIHdpZHRoLCBoZWlnaHQgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHJlc3VsdCwgJ3RvQ2FudmFzTm9kZVN5bmNocm9ub3VzIHJlcXVpcmVzIHRoYXQgdGhlIG5vZGUgY2FuIGJlIHJlbmRlcmVkIG9ubHkgdXNpbmcgQ2FudmFzJyApO1xyXG4gICAgcmV0dXJuIHJlc3VsdCE7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIEltYWdlIHRoYXQgcmVuZGVycyB0aGlzIE5vZGUuIFRoaXMgaXMgYWx3YXlzIHN5bmNocm9ub3VzLCBhbmQgc2V0cyBpbml0aWFsV2lkdGgvaW5pdGlhbEhlaWdodCBzbyB0aGF0XHJcbiAgICogd2UgaGF2ZSB0aGUgYm91bmRzIGltbWVkaWF0ZWx5LiAgVXNlIHRoaXMgbWV0aG9kIGlmIHlvdSBuZWVkIHRvIHJlZHVjZSB0aGUgbnVtYmVyIG9mIHBhcmVudCBOb2Rlcy5cclxuICAgKlxyXG4gICAqIE5PVEU6IHRoZSByZXN1bHRhbnQgSW1hZ2Ugc2hvdWxkIGJlIHBvc2l0aW9uZWQgdXNpbmcgaXRzIGJvdW5kcyByYXRoZXIgdGhhbiAoeCx5KS4gIFRvIGNyZWF0ZSBhIE5vZGUgdGhhdCBjYW4gYmVcclxuICAgKiBwb3NpdGlvbmVkIGxpa2UgYW55IG90aGVyIG5vZGUsIHBsZWFzZSB1c2UgdG9EYXRhVVJMTm9kZVN5bmNocm9ub3VzLlxyXG4gICAqIEBkZXByZWNhdGVkIC0gVXNlIG5vZGUucmFzdGVyaXplZCgpIGluc3RlYWQsIHNob3VsZCBiZSBtb3N0bHkgZXF1aXZhbGVudCBpZiB3cmFwOmZhbHNlIGlzIHByb3ZpZGVkLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIFt4XSAtIFRoZSBYIG9mZnNldCBmb3Igd2hlcmUgdGhlIHVwcGVyLWxlZnQgb2YgdGhlIGNvbnRlbnQgZHJhd24gaW50byB0aGUgQ2FudmFzXHJcbiAgICogQHBhcmFtIFt5XSAtIFRoZSBZIG9mZnNldCBmb3Igd2hlcmUgdGhlIHVwcGVyLWxlZnQgb2YgdGhlIGNvbnRlbnQgZHJhd24gaW50byB0aGUgQ2FudmFzXHJcbiAgICogQHBhcmFtIFt3aWR0aF0gLSBUaGUgd2lkdGggb2YgdGhlIENhbnZhcyBvdXRwdXRcclxuICAgKiBAcGFyYW0gW2hlaWdodF0gLSBUaGUgaGVpZ2h0IG9mIHRoZSBDYW52YXMgb3V0cHV0XHJcbiAgICovXHJcbiAgcHVibGljIHRvRGF0YVVSTEltYWdlU3luY2hyb25vdXMoIHg/OiBudW1iZXIsIHk/OiBudW1iZXIsIHdpZHRoPzogbnVtYmVyLCBoZWlnaHQ/OiBudW1iZXIgKTogSW1hZ2Uge1xyXG5cclxuICAgIGFzc2VydCAmJiBkZXByZWNhdGlvbldhcm5pbmcoICdOb2RlLnRvRGF0YVVSTEltYWdlU3ljaHJvbm91cygpIGlzIGRlcHJlY2F0ZWQsIHBsZWFzZSB1c2UgTm9kZS5yYXN0ZXJpemVkKCkgaW5zdGVhZCcgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB4ID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHggPT09ICdudW1iZXInLCAnSWYgcHJvdmlkZWQsIHggc2hvdWxkIGJlIGEgbnVtYmVyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggeSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiB5ID09PSAnbnVtYmVyJywgJ0lmIHByb3ZpZGVkLCB5IHNob3VsZCBiZSBhIG51bWJlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHdpZHRoID09PSB1bmRlZmluZWQgfHwgKCB0eXBlb2Ygd2lkdGggPT09ICdudW1iZXInICYmIHdpZHRoID49IDAgJiYgKCB3aWR0aCAlIDEgPT09IDAgKSApLFxyXG4gICAgICAnSWYgcHJvdmlkZWQsIHdpZHRoIHNob3VsZCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaGVpZ2h0ID09PSB1bmRlZmluZWQgfHwgKCB0eXBlb2YgaGVpZ2h0ID09PSAnbnVtYmVyJyAmJiBoZWlnaHQgPj0gMCAmJiAoIGhlaWdodCAlIDEgPT09IDAgKSApLFxyXG4gICAgICAnSWYgcHJvdmlkZWQsIGhlaWdodCBzaG91bGQgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlcicgKTtcclxuXHJcbiAgICBsZXQgcmVzdWx0OiBJbWFnZSB8IG51bGwgPSBudWxsO1xyXG4gICAgdGhpcy50b0RhdGFVUkwoICggZGF0YVVSTCwgeCwgeSwgd2lkdGgsIGhlaWdodCApID0+IHtcclxuICAgICAgcmVzdWx0ID0gbmV3IEltYWdlKCBkYXRhVVJMLCB7IHg6IC14LCB5OiAteSwgaW5pdGlhbFdpZHRoOiB3aWR0aCwgaW5pdGlhbEhlaWdodDogaGVpZ2h0IH0gKTtcclxuICAgIH0sIHgsIHksIHdpZHRoLCBoZWlnaHQgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHJlc3VsdCwgJ3RvRGF0YVVSTCBmYWlsZWQgdG8gcmV0dXJuIGEgcmVzdWx0IHN5bmNocm9ub3VzbHknICk7XHJcbiAgICByZXR1cm4gcmVzdWx0ITtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBOb2RlIHRoYXQgY29udGFpbnMgdGhpcyBOb2RlJ3Mgc3VidHJlZSdzIHZpc3VhbCBmb3JtLiBUaGlzIGlzIGFsd2F5cyBzeW5jaHJvbm91cywgYW5kIHNldHNcclxuICAgKiBpbml0aWFsV2lkdGgvaW5pdGlhbEhlaWdodCBzbyB0aGF0IHdlIGhhdmUgdGhlIGJvdW5kcyBpbW1lZGlhdGVseS4gIEFuIGV4dHJhIHdyYXBwZXIgTm9kZSBpcyBwcm92aWRlZFxyXG4gICAqIHNvIHRoYXQgdHJhbnNmb3JtcyBjYW4gYmUgZG9uZSBpbmRlcGVuZGVudGx5LiAgVXNlIHRoaXMgbWV0aG9kIGlmIHlvdSBuZWVkIHRvIGJlIGFibGUgdG8gdHJhbnNmb3JtIHRoZSBub2RlXHJcbiAgICogdGhlIHNhbWUgd2F5IGFzIGlmIGl0IGhhZCBub3QgYmVlbiByYXN0ZXJpemVkLlxyXG4gICAqIEBkZXByZWNhdGVkIC0gVXNlIG5vZGUucmFzdGVyaXplZCgpIGluc3RlYWQsIHNob3VsZCBiZSBtb3N0bHkgZXF1aXZhbGVudFxyXG4gICAqXHJcbiAgICogQHBhcmFtIFt4XSAtIFRoZSBYIG9mZnNldCBmb3Igd2hlcmUgdGhlIHVwcGVyLWxlZnQgb2YgdGhlIGNvbnRlbnQgZHJhd24gaW50byB0aGUgQ2FudmFzXHJcbiAgICogQHBhcmFtIFt5XSAtIFRoZSBZIG9mZnNldCBmb3Igd2hlcmUgdGhlIHVwcGVyLWxlZnQgb2YgdGhlIGNvbnRlbnQgZHJhd24gaW50byB0aGUgQ2FudmFzXHJcbiAgICogQHBhcmFtIFt3aWR0aF0gLSBUaGUgd2lkdGggb2YgdGhlIENhbnZhcyBvdXRwdXRcclxuICAgKiBAcGFyYW0gW2hlaWdodF0gLSBUaGUgaGVpZ2h0IG9mIHRoZSBDYW52YXMgb3V0cHV0XHJcbiAgICovXHJcbiAgcHVibGljIHRvRGF0YVVSTE5vZGVTeW5jaHJvbm91cyggeD86IG51bWJlciwgeT86IG51bWJlciwgd2lkdGg/OiBudW1iZXIsIGhlaWdodD86IG51bWJlciApOiBOb2RlIHtcclxuXHJcbiAgICBhc3NlcnQgJiYgZGVwcmVjYXRpb25XYXJuaW5nKCAnTm9kZS50b0RhdGFVUkxOb2RlU3luY2hyb25vdXMoKSBpcyBkZXByZWNhdGVkLCBwbGVhc2UgdXNlIE5vZGUucmFzdGVyaXplZCgpIGluc3RlYWQnICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggeCA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiB4ID09PSAnbnVtYmVyJywgJ0lmIHByb3ZpZGVkLCB4IHNob3VsZCBiZSBhIG51bWJlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHkgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgeSA9PT0gJ251bWJlcicsICdJZiBwcm92aWRlZCwgeSBzaG91bGQgYmUgYSBudW1iZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB3aWR0aCA9PT0gdW5kZWZpbmVkIHx8ICggdHlwZW9mIHdpZHRoID09PSAnbnVtYmVyJyAmJiB3aWR0aCA+PSAwICYmICggd2lkdGggJSAxID09PSAwICkgKSxcclxuICAgICAgJ0lmIHByb3ZpZGVkLCB3aWR0aCBzaG91bGQgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGhlaWdodCA9PT0gdW5kZWZpbmVkIHx8ICggdHlwZW9mIGhlaWdodCA9PT0gJ251bWJlcicgJiYgaGVpZ2h0ID49IDAgJiYgKCBoZWlnaHQgJSAxID09PSAwICkgKSxcclxuICAgICAgJ0lmIHByb3ZpZGVkLCBoZWlnaHQgc2hvdWxkIGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXInICk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBOb2RlKCB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8taHRtbC1jb25zdHJ1Y3RvcnNcclxuICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICB0aGlzLnRvRGF0YVVSTEltYWdlU3luY2hyb25vdXMoIHgsIHksIHdpZHRoLCBoZWlnaHQgKVxyXG4gICAgICBdXHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgTm9kZSAoYmFja2VkIGJ5IGEgc2NlbmVyeSBJbWFnZSkgdGhhdCBpcyBhIHJhc3Rlcml6ZWQgdmVyc2lvbiBvZiB0aGlzIG5vZGUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gW29wdGlvbnNdIC0gU2VlIGJlbG93IG9wdGlvbnMuIFRoaXMgaXMgYWxzbyBwYXNzZWQgZGlyZWN0bHkgdG8gdGhlIGNyZWF0ZWQgSW1hZ2Ugb2JqZWN0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyByYXN0ZXJpemVkKCBwcm92aWRlZE9wdGlvbnM/OiBSYXN0ZXJpemVkT3B0aW9ucyApOiBOb2RlIHtcclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8UmFzdGVyaXplZE9wdGlvbnMsIFJhc3Rlcml6ZWRPcHRpb25zPigpKCB7XHJcbiAgICAgIHJlc29sdXRpb246IDEsXHJcbiAgICAgIHNvdXJjZUJvdW5kczogbnVsbCxcclxuICAgICAgdXNlVGFyZ2V0Qm91bmRzOiB0cnVlLFxyXG4gICAgICB3cmFwOiB0cnVlLFxyXG4gICAgICB1c2VDYW52YXM6IGZhbHNlLFxyXG4gICAgICBpbWFnZU9wdGlvbnM6IHt9XHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBjb25zdCByZXNvbHV0aW9uID0gb3B0aW9ucy5yZXNvbHV0aW9uO1xyXG4gICAgY29uc3Qgc291cmNlQm91bmRzID0gb3B0aW9ucy5zb3VyY2VCb3VuZHM7XHJcblxyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgIGFzc2VydCggdHlwZW9mIHJlc29sdXRpb24gPT09ICdudW1iZXInICYmIHJlc29sdXRpb24gPiAwLCAncmVzb2x1dGlvbiBzaG91bGQgYmUgYSBwb3NpdGl2ZSBudW1iZXInICk7XHJcbiAgICAgIGFzc2VydCggc291cmNlQm91bmRzID09PSBudWxsIHx8IHNvdXJjZUJvdW5kcyBpbnN0YW5jZW9mIEJvdW5kczIsICdzb3VyY2VCb3VuZHMgc2hvdWxkIGJlIG51bGwgb3IgYSBCb3VuZHMyJyApO1xyXG4gICAgICBpZiAoIHNvdXJjZUJvdW5kcyApIHtcclxuICAgICAgICBhc3NlcnQoIHNvdXJjZUJvdW5kcy5pc1ZhbGlkKCksICdzb3VyY2VCb3VuZHMgc2hvdWxkIGJlIHZhbGlkIChmaW5pdGUgbm9uLW5lZ2F0aXZlKScgKTtcclxuICAgICAgICBhc3NlcnQoIE51bWJlci5pc0ludGVnZXIoIHNvdXJjZUJvdW5kcy53aWR0aCApLCAnc291cmNlQm91bmRzLndpZHRoIHNob3VsZCBiZSBhbiBpbnRlZ2VyJyApO1xyXG4gICAgICAgIGFzc2VydCggTnVtYmVyLmlzSW50ZWdlciggc291cmNlQm91bmRzLmhlaWdodCApLCAnc291cmNlQm91bmRzLmhlaWdodCBzaG91bGQgYmUgYW4gaW50ZWdlcicgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFdlJ2xsIG5lZWQgdG8gd3JhcCBpdCBpbiBhIGNvbnRhaW5lciBOb2RlIHRlbXBvcmFyaWx5ICh3aGlsZSByYXN0ZXJpemluZykgZm9yIHRoZSBzY2FsZVxyXG4gICAgY29uc3Qgd3JhcHBlck5vZGUgPSBuZXcgTm9kZSggeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWh0bWwtY29uc3RydWN0b3JzXHJcbiAgICAgIHNjYWxlOiByZXNvbHV0aW9uLFxyXG4gICAgICBjaGlsZHJlbjogWyB0aGlzIF1cclxuICAgIH0gKTtcclxuXHJcbiAgICBsZXQgdHJhbnNmb3JtZWRCb3VuZHMgPSBzb3VyY2VCb3VuZHMgfHwgdGhpcy5nZXRTYWZlVHJhbnNmb3JtZWRWaXNpYmxlQm91bmRzKCkuZGlsYXRlZCggMiApLnJvdW5kZWRPdXQoKTtcclxuXHJcbiAgICAvLyBVbmZvcnR1bmF0ZWx5IGlmIHdlIHByb3ZpZGUgYSByZXNvbHV0aW9uIEFORCBib3VuZHMsIHdlIGNhbid0IHVzZSB0aGUgc291cmNlIGJvdW5kcyBkaXJlY3RseS5cclxuICAgIGlmICggcmVzb2x1dGlvbiAhPT0gMSApIHtcclxuICAgICAgdHJhbnNmb3JtZWRCb3VuZHMgPSBuZXcgQm91bmRzMihcclxuICAgICAgICByZXNvbHV0aW9uICogdHJhbnNmb3JtZWRCb3VuZHMubWluWCxcclxuICAgICAgICByZXNvbHV0aW9uICogdHJhbnNmb3JtZWRCb3VuZHMubWluWSxcclxuICAgICAgICByZXNvbHV0aW9uICogdHJhbnNmb3JtZWRCb3VuZHMubWF4WCxcclxuICAgICAgICByZXNvbHV0aW9uICogdHJhbnNmb3JtZWRCb3VuZHMubWF4WVxyXG4gICAgICApO1xyXG4gICAgICAvLyBDb21wZW5zYXRlIGZvciBub24taW50ZWdyYWwgdHJhbnNmb3JtZWRCb3VuZHMgYWZ0ZXIgb3VyIHJlc29sdXRpb24gdHJhbnNmb3JtXHJcbiAgICAgIGlmICggdHJhbnNmb3JtZWRCb3VuZHMud2lkdGggJSAxICE9PSAwICkge1xyXG4gICAgICAgIHRyYW5zZm9ybWVkQm91bmRzLm1heFggKz0gMSAtICggdHJhbnNmb3JtZWRCb3VuZHMud2lkdGggJSAxICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCB0cmFuc2Zvcm1lZEJvdW5kcy5oZWlnaHQgJSAxICE9PSAwICkge1xyXG4gICAgICAgIHRyYW5zZm9ybWVkQm91bmRzLm1heFkgKz0gMSAtICggdHJhbnNmb3JtZWRCb3VuZHMuaGVpZ2h0ICUgMSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGltYWdlOiBJbWFnZSB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgIC8vIE5PVEU6IFRoaXMgY2FsbGJhY2sgaXMgZXhlY3V0ZWQgU1lOQ0hST05PVVNMWVxyXG4gICAgZnVuY3Rpb24gY2FsbGJhY2soIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQsIHg6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciApOiB2b2lkIHtcclxuICAgICAgY29uc3QgaW1hZ2VTb3VyY2UgPSBvcHRpb25zLnVzZUNhbnZhcyA/IGNhbnZhcyA6IGNhbnZhcy50b0RhdGFVUkwoKTtcclxuXHJcbiAgICAgIGltYWdlID0gbmV3IEltYWdlKCBpbWFnZVNvdXJjZSwgY29tYmluZU9wdGlvbnM8SW1hZ2VPcHRpb25zPigge30sIG9wdGlvbnMuaW1hZ2VPcHRpb25zLCB7XHJcbiAgICAgICAgeDogLXgsXHJcbiAgICAgICAgeTogLXksXHJcbiAgICAgICAgaW5pdGlhbFdpZHRoOiB3aWR0aCxcclxuICAgICAgICBpbml0aWFsSGVpZ2h0OiBoZWlnaHRcclxuICAgICAgfSApICk7XHJcblxyXG4gICAgICAvLyBXZSBuZWVkIHRvIHByZXBlbmQgdGhlIHNjYWxlIGR1ZSB0byBvcmRlciBvZiBvcGVyYXRpb25zXHJcbiAgICAgIGltYWdlLnNjYWxlKCAxIC8gcmVzb2x1dGlvbiwgMSAvIHJlc29sdXRpb24sIHRydWUgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBOT1RFOiBSb3VuZGluZyBuZWNlc3NhcnkgZHVlIHRvIGZsb2F0aW5nIHBvaW50IGFyaXRobWV0aWMgaW4gdGhlIHdpZHRoL2hlaWdodCBjb21wdXRhdGlvbiBvZiB0aGUgYm91bmRzXHJcbiAgICB3cmFwcGVyTm9kZS50b0NhbnZhcyggY2FsbGJhY2ssIC10cmFuc2Zvcm1lZEJvdW5kcy5taW5YLCAtdHJhbnNmb3JtZWRCb3VuZHMubWluWSwgVXRpbHMucm91bmRTeW1tZXRyaWMoIHRyYW5zZm9ybWVkQm91bmRzLndpZHRoICksIFV0aWxzLnJvdW5kU3ltbWV0cmljKCB0cmFuc2Zvcm1lZEJvdW5kcy5oZWlnaHQgKSApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGltYWdlLCAnVGhlIHRvQ2FudmFzIHNob3VsZCBoYXZlIGV4ZWN1dGVkIHN5bmNocm9ub3VzbHknICk7XHJcblxyXG4gICAgd3JhcHBlck5vZGUuZGlzcG9zZSgpO1xyXG5cclxuICAgIC8vIEZvciBvdXIgdXNlVGFyZ2V0Qm91bmRzIG9wdGlvbiwgd2UgZG8gTk9UIHdhbnQgdG8gaW5jbHVkZSBhbnkgXCJzYWZlXCIgYm91bmRzLCBhbmQgaW5zdGVhZCB3YW50IHRvIHN0YXkgdHJ1ZSB0b1xyXG4gICAgLy8gdGhlIG9yaWdpbmFsIGJvdW5kcy4gV2UgZG8gZmlsdGVyIG91dCBpbnZpc2libGUgc3VidHJlZXMgdG8gc2V0IHRoZSBib3VuZHMuXHJcbiAgICBsZXQgZmluYWxQYXJlbnRCb3VuZHMgPSB0aGlzLmdldFZpc2libGVCb3VuZHMoKTtcclxuICAgIGlmICggc291cmNlQm91bmRzICkge1xyXG4gICAgICAvLyBJZiB3ZSBwcm92aWRlIHNvdXJjZUJvdW5kcywgZG9uJ3QgaGF2ZSByZXN1bHRpbmcgYm91bmRzIHRoYXQgZ28gb3V0c2lkZS5cclxuICAgICAgZmluYWxQYXJlbnRCb3VuZHMgPSBzb3VyY2VCb3VuZHMuaW50ZXJzZWN0aW9uKCBmaW5hbFBhcmVudEJvdW5kcyApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggb3B0aW9ucy51c2VUYXJnZXRCb3VuZHMgKSB7XHJcbiAgICAgIGltYWdlIS5pbWFnZUJvdW5kcyA9IGltYWdlIS5wYXJlbnRUb0xvY2FsQm91bmRzKCBmaW5hbFBhcmVudEJvdW5kcyApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggb3B0aW9ucy53cmFwICkge1xyXG4gICAgICBjb25zdCB3cmFwcGVkTm9kZSA9IG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIGltYWdlISBdIH0gKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1odG1sLWNvbnN0cnVjdG9yc1xyXG4gICAgICBpZiAoIG9wdGlvbnMudXNlVGFyZ2V0Qm91bmRzICkge1xyXG4gICAgICAgIHdyYXBwZWROb2RlLmxvY2FsQm91bmRzID0gZmluYWxQYXJlbnRCb3VuZHM7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHdyYXBwZWROb2RlO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGlmICggb3B0aW9ucy51c2VUYXJnZXRCb3VuZHMgKSB7XHJcbiAgICAgICAgaW1hZ2UhLmxvY2FsQm91bmRzID0gaW1hZ2UhLnBhcmVudFRvTG9jYWxCb3VuZHMoIGZpbmFsUGFyZW50Qm91bmRzICk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGltYWdlITtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBET00gZHJhd2FibGUgZm9yIHRoaXMgTm9kZSdzIHNlbGYgcmVwcmVzZW50YXRpb24uIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogSW1wbGVtZW50ZWQgYnkgc3VidHlwZXMgdGhhdCBzdXBwb3J0IERPTSBzZWxmIGRyYXdhYmxlcy4gVGhlcmUgaXMgbm8gbmVlZCB0byBpbXBsZW1lbnQgdGhpcyBmb3Igc3VidHlwZXMgdGhhdFxyXG4gICAqIGRvIG5vdCBhbGxvdyB0aGUgRE9NIHJlbmRlcmVyIChub3Qgc2V0IGluIGl0cyByZW5kZXJlckJpdG1hc2spLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHJlbmRlcmVyIC0gSW4gdGhlIGJpdG1hc2sgZm9ybWF0IHNwZWNpZmllZCBieSBSZW5kZXJlciwgd2hpY2ggbWF5IGNvbnRhaW4gYWRkaXRpb25hbCBiaXQgZmxhZ3MuXHJcbiAgICogQHBhcmFtIGluc3RhbmNlIC0gSW5zdGFuY2Ugb2JqZWN0IHRoYXQgd2lsbCBiZSBhc3NvY2lhdGVkIHdpdGggdGhlIGRyYXdhYmxlXHJcbiAgICovXHJcbiAgcHVibGljIGNyZWF0ZURPTURyYXdhYmxlKCByZW5kZXJlcjogbnVtYmVyLCBpbnN0YW5jZTogSW5zdGFuY2UgKTogRE9NU2VsZkRyYXdhYmxlIHtcclxuICAgIHRocm93IG5ldyBFcnJvciggJ2NyZWF0ZURPTURyYXdhYmxlIGlzIGFic3RyYWN0LiBUaGUgc3VidHlwZSBzaG91bGQgZWl0aGVyIG92ZXJyaWRlIHRoaXMgbWV0aG9kLCBvciBub3Qgc3VwcG9ydCB0aGUgRE9NIHJlbmRlcmVyJyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhbiBTVkcgZHJhd2FibGUgZm9yIHRoaXMgTm9kZSdzIHNlbGYgcmVwcmVzZW50YXRpb24uIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogSW1wbGVtZW50ZWQgYnkgc3VidHlwZXMgdGhhdCBzdXBwb3J0IFNWRyBzZWxmIGRyYXdhYmxlcy4gVGhlcmUgaXMgbm8gbmVlZCB0byBpbXBsZW1lbnQgdGhpcyBmb3Igc3VidHlwZXMgdGhhdFxyXG4gICAqIGRvIG5vdCBhbGxvdyB0aGUgU1ZHIHJlbmRlcmVyIChub3Qgc2V0IGluIGl0cyByZW5kZXJlckJpdG1hc2spLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHJlbmRlcmVyIC0gSW4gdGhlIGJpdG1hc2sgZm9ybWF0IHNwZWNpZmllZCBieSBSZW5kZXJlciwgd2hpY2ggbWF5IGNvbnRhaW4gYWRkaXRpb25hbCBiaXQgZmxhZ3MuXHJcbiAgICogQHBhcmFtIGluc3RhbmNlIC0gSW5zdGFuY2Ugb2JqZWN0IHRoYXQgd2lsbCBiZSBhc3NvY2lhdGVkIHdpdGggdGhlIGRyYXdhYmxlXHJcbiAgICovXHJcbiAgcHVibGljIGNyZWF0ZVNWR0RyYXdhYmxlKCByZW5kZXJlcjogbnVtYmVyLCBpbnN0YW5jZTogSW5zdGFuY2UgKTogU1ZHU2VsZkRyYXdhYmxlIHtcclxuICAgIHRocm93IG5ldyBFcnJvciggJ2NyZWF0ZVNWR0RyYXdhYmxlIGlzIGFic3RyYWN0LiBUaGUgc3VidHlwZSBzaG91bGQgZWl0aGVyIG92ZXJyaWRlIHRoaXMgbWV0aG9kLCBvciBub3Qgc3VwcG9ydCB0aGUgRE9NIHJlbmRlcmVyJyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIENhbnZhcyBkcmF3YWJsZSBmb3IgdGhpcyBOb2RlJ3Mgc2VsZiByZXByZXNlbnRhdGlvbi4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICpcclxuICAgKiBJbXBsZW1lbnRlZCBieSBzdWJ0eXBlcyB0aGF0IHN1cHBvcnQgQ2FudmFzIHNlbGYgZHJhd2FibGVzLiBUaGVyZSBpcyBubyBuZWVkIHRvIGltcGxlbWVudCB0aGlzIGZvciBzdWJ0eXBlcyB0aGF0XHJcbiAgICogZG8gbm90IGFsbG93IHRoZSBDYW52YXMgcmVuZGVyZXIgKG5vdCBzZXQgaW4gaXRzIHJlbmRlcmVyQml0bWFzaykuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcmVuZGVyZXIgLSBJbiB0aGUgYml0bWFzayBmb3JtYXQgc3BlY2lmaWVkIGJ5IFJlbmRlcmVyLCB3aGljaCBtYXkgY29udGFpbiBhZGRpdGlvbmFsIGJpdCBmbGFncy5cclxuICAgKiBAcGFyYW0gaW5zdGFuY2UgLSBJbnN0YW5jZSBvYmplY3QgdGhhdCB3aWxsIGJlIGFzc29jaWF0ZWQgd2l0aCB0aGUgZHJhd2FibGVcclxuICAgKi9cclxuICBwdWJsaWMgY3JlYXRlQ2FudmFzRHJhd2FibGUoIHJlbmRlcmVyOiBudW1iZXIsIGluc3RhbmNlOiBJbnN0YW5jZSApOiBDYW52YXNTZWxmRHJhd2FibGUge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCAnY3JlYXRlQ2FudmFzRHJhd2FibGUgaXMgYWJzdHJhY3QuIFRoZSBzdWJ0eXBlIHNob3VsZCBlaXRoZXIgb3ZlcnJpZGUgdGhpcyBtZXRob2QsIG9yIG5vdCBzdXBwb3J0IHRoZSBET00gcmVuZGVyZXInICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgV2ViR0wgZHJhd2FibGUgZm9yIHRoaXMgTm9kZSdzIHNlbGYgcmVwcmVzZW50YXRpb24uIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogSW1wbGVtZW50ZWQgYnkgc3VidHlwZXMgdGhhdCBzdXBwb3J0IFdlYkdMIHNlbGYgZHJhd2FibGVzLiBUaGVyZSBpcyBubyBuZWVkIHRvIGltcGxlbWVudCB0aGlzIGZvciBzdWJ0eXBlcyB0aGF0XHJcbiAgICogZG8gbm90IGFsbG93IHRoZSBXZWJHTCByZW5kZXJlciAobm90IHNldCBpbiBpdHMgcmVuZGVyZXJCaXRtYXNrKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSByZW5kZXJlciAtIEluIHRoZSBiaXRtYXNrIGZvcm1hdCBzcGVjaWZpZWQgYnkgUmVuZGVyZXIsIHdoaWNoIG1heSBjb250YWluIGFkZGl0aW9uYWwgYml0IGZsYWdzLlxyXG4gICAqIEBwYXJhbSBpbnN0YW5jZSAtIEluc3RhbmNlIG9iamVjdCB0aGF0IHdpbGwgYmUgYXNzb2NpYXRlZCB3aXRoIHRoZSBkcmF3YWJsZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjcmVhdGVXZWJHTERyYXdhYmxlKCByZW5kZXJlcjogbnVtYmVyLCBpbnN0YW5jZTogSW5zdGFuY2UgKTogV2ViR0xTZWxmRHJhd2FibGUge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCAnY3JlYXRlV2ViR0xEcmF3YWJsZSBpcyBhYnN0cmFjdC4gVGhlIHN1YnR5cGUgc2hvdWxkIGVpdGhlciBvdmVycmlkZSB0aGlzIG1ldGhvZCwgb3Igbm90IHN1cHBvcnQgdGhlIERPTSByZW5kZXJlcicgKTtcclxuICB9XHJcblxyXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxyXG4gICAqIEluc3RhbmNlIGhhbmRsaW5nXHJcbiAgICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgaW5zdGFuY2VzIGFycmF5LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0SW5zdGFuY2VzKCk6IEluc3RhbmNlW10ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2luc3RhbmNlcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRJbnN0YW5jZXMoKSBmb3IgbW9yZSBpbmZvcm1hdGlvbiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGluc3RhbmNlcygpOiBJbnN0YW5jZVtdIHtcclxuICAgIHJldHVybiB0aGlzLmdldEluc3RhbmNlcygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhbiBJbnN0YW5jZSByZWZlcmVuY2UgdG8gb3VyIGFycmF5LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgYWRkSW5zdGFuY2UoIGluc3RhbmNlOiBJbnN0YW5jZSApOiB2b2lkIHtcclxuICAgIHRoaXMuX2luc3RhbmNlcy5wdXNoKCBpbnN0YW5jZSApO1xyXG5cclxuICAgIHRoaXMuY2hhbmdlZEluc3RhbmNlRW1pdHRlci5lbWl0KCBpbnN0YW5jZSwgdHJ1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyBhbiBJbnN0YW5jZSByZWZlcmVuY2UgZnJvbSBvdXIgYXJyYXkuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyByZW1vdmVJbnN0YW5jZSggaW5zdGFuY2U6IEluc3RhbmNlICk6IHZvaWQge1xyXG4gICAgY29uc3QgaW5kZXggPSBfLmluZGV4T2YoIHRoaXMuX2luc3RhbmNlcywgaW5zdGFuY2UgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGluZGV4ICE9PSAtMSwgJ0Nhbm5vdCByZW1vdmUgYSBJbnN0YW5jZSBmcm9tIGEgTm9kZSBpZiBpdCB3YXMgbm90IHRoZXJlJyApO1xyXG4gICAgdGhpcy5faW5zdGFuY2VzLnNwbGljZSggaW5kZXgsIDEgKTtcclxuXHJcbiAgICB0aGlzLmNoYW5nZWRJbnN0YW5jZUVtaXR0ZXIuZW1pdCggaW5zdGFuY2UsIGZhbHNlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhpcyBOb2RlIHdhcyB2aXN1YWxseSByZW5kZXJlZC9kaXNwbGF5ZWQgYnkgYW55IERpc3BsYXkgaW4gdGhlIGxhc3QgdXBkYXRlRGlzcGxheSgpIGNhbGwuIE5vdGVcclxuICAgKiB0aGF0IHNvbWV0aGluZyBjYW4gYmUgaW5kZXBlbmRlbnRseSBkaXNwbGF5ZWQgdmlzdWFsbHksIGFuZCBpbiB0aGUgUERPTTsgdGhpcyBtZXRob2Qgb25seSBjaGVja3MgdmlzdWFsbHkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gW2Rpc3BsYXldIC0gaWYgcHJvdmlkZWQsIG9ubHkgY2hlY2sgaWYgd2FzIHZpc2libGUgb24gdGhpcyBwYXJ0aWN1bGFyIERpc3BsYXlcclxuICAgKi9cclxuICBwdWJsaWMgd2FzVmlzdWFsbHlEaXNwbGF5ZWQoIGRpc3BsYXk/OiBEaXNwbGF5ICk6IGJvb2xlYW4ge1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5faW5zdGFuY2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBpbnN0YW5jZSA9IHRoaXMuX2luc3RhbmNlc1sgaSBdO1xyXG5cclxuICAgICAgLy8gSWYgbm8gZGlzcGxheSBpcyBwcm92aWRlZCwgYW55IGluc3RhbmNlIHZpc2liaWxpdHkgaXMgZW5vdWdoIHRvIGJlIHZpc3VhbGx5IGRpc3BsYXllZFxyXG4gICAgICBpZiAoIGluc3RhbmNlLnZpc2libGUgJiYgKCAhZGlzcGxheSB8fCBpbnN0YW5jZS5kaXNwbGF5ID09PSBkaXNwbGF5ICkgKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxyXG4gICAqIERpc3BsYXkgaGFuZGxpbmdcclxuICAgKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBkaXNwbGF5IGFycmF5LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Um9vdGVkRGlzcGxheXMoKTogRGlzcGxheVtdIHtcclxuICAgIHJldHVybiB0aGlzLl9yb290ZWREaXNwbGF5cztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBnZXRSb290ZWREaXNwbGF5cygpIGZvciBtb3JlIGluZm9ybWF0aW9uIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgcm9vdGVkRGlzcGxheXMoKTogRGlzcGxheVtdIHtcclxuICAgIHJldHVybiB0aGlzLmdldFJvb3RlZERpc3BsYXlzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGFuIGRpc3BsYXkgcmVmZXJlbmNlIHRvIG91ciBhcnJheS4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIGFkZFJvb3RlZERpc3BsYXkoIGRpc3BsYXk6IERpc3BsYXkgKTogdm9pZCB7XHJcbiAgICB0aGlzLl9yb290ZWREaXNwbGF5cy5wdXNoKCBkaXNwbGF5ICk7XHJcblxyXG4gICAgLy8gRGVmaW5lZCBpbiBQYXJhbGxlbERPTS5qc1xyXG4gICAgdGhpcy5fcGRvbURpc3BsYXlzSW5mby5vbkFkZGVkUm9vdGVkRGlzcGxheSggZGlzcGxheSApO1xyXG5cclxuICAgIHRoaXMucm9vdGVkRGlzcGxheUNoYW5nZWRFbWl0dGVyLmVtaXQoIGRpc3BsYXkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgYSBEaXNwbGF5IHJlZmVyZW5jZSBmcm9tIG91ciBhcnJheS4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIHJlbW92ZVJvb3RlZERpc3BsYXkoIGRpc3BsYXk6IERpc3BsYXkgKTogdm9pZCB7XHJcbiAgICBjb25zdCBpbmRleCA9IF8uaW5kZXhPZiggdGhpcy5fcm9vdGVkRGlzcGxheXMsIGRpc3BsYXkgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGluZGV4ICE9PSAtMSwgJ0Nhbm5vdCByZW1vdmUgYSBEaXNwbGF5IGZyb20gYSBOb2RlIGlmIGl0IHdhcyBub3QgdGhlcmUnICk7XHJcbiAgICB0aGlzLl9yb290ZWREaXNwbGF5cy5zcGxpY2UoIGluZGV4LCAxICk7XHJcblxyXG4gICAgLy8gRGVmaW5lZCBpbiBQYXJhbGxlbERPTS5qc1xyXG4gICAgdGhpcy5fcGRvbURpc3BsYXlzSW5mby5vblJlbW92ZWRSb290ZWREaXNwbGF5KCBkaXNwbGF5ICk7XHJcblxyXG4gICAgdGhpcy5yb290ZWREaXNwbGF5Q2hhbmdlZEVtaXR0ZXIuZW1pdCggZGlzcGxheSApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBnZXRSZWN1cnNpdmVDb25uZWN0ZWREaXNwbGF5cyggZGlzcGxheXM6IERpc3BsYXlbXSApOiBEaXNwbGF5W10ge1xyXG4gICAgaWYgKCB0aGlzLnJvb3RlZERpc3BsYXlzLmxlbmd0aCApIHtcclxuICAgICAgZGlzcGxheXMucHVzaCggLi4udGhpcy5yb290ZWREaXNwbGF5cyApO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuX3BhcmVudHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGRpc3BsYXlzLnB1c2goIC4uLnRoaXMuX3BhcmVudHNbIGkgXS5nZXRSZWN1cnNpdmVDb25uZWN0ZWREaXNwbGF5cyggZGlzcGxheXMgKSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGRvIG5vdCBhbGxvdyBkdXBsaWNhdGUgRGlzcGxheXMgdG8gZ2V0IGNvbGxlY3RlZCBpbmZpbml0ZWx5XHJcbiAgICByZXR1cm4gXy51bmlxKCBkaXNwbGF5cyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IGEgbGlzdCBvZiB0aGUgZGlzcGxheXMgdGhhdCBhcmUgY29ubmVjdGVkIHRvIHRoaXMgTm9kZS4gR2F0aGVyZWQgYnkgbG9va2luZyB1cCB0aGUgc2NlbmUgZ3JhcGggYW5jZXN0b3JzIGFuZFxyXG4gICAqIGNvbGxlY3RlZCBhbGwgcm9vdGVkIERpc3BsYXlzIGFsb25nIHRoZSB3YXkuXHJcbiAgICovXHJcbiAgcHVibGljIGdldENvbm5lY3RlZERpc3BsYXlzKCk6IERpc3BsYXlbXSB7XHJcbiAgICByZXR1cm4gXy51bmlxKCB0aGlzLmdldFJlY3Vyc2l2ZUNvbm5lY3RlZERpc3BsYXlzKCBbXSApICk7XHJcbiAgfVxyXG5cclxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcclxuICAgKiBDb29yZGluYXRlIHRyYW5zZm9ybSBtZXRob2RzXHJcbiAgICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHBvaW50IHRyYW5zZm9ybWVkIGZyb20gb3VyIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUgaW50byBvdXIgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUuIEFwcGxpZXMgb3VyIG5vZGUnc1xyXG4gICAqIHRyYW5zZm9ybSB0byBpdC5cclxuICAgKi9cclxuICBwdWJsaWMgbG9jYWxUb1BhcmVudFBvaW50KCBwb2ludDogVmVjdG9yMiApOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLl90cmFuc2Zvcm0udHJhbnNmb3JtUG9zaXRpb24yKCBwb2ludCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBib3VuZHMgdHJhbnNmb3JtZWQgZnJvbSBvdXIgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSBpbnRvIG91ciBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZS4gSWYgaXQgaW5jbHVkZXMgYVxyXG4gICAqIHJvdGF0aW9uLCB0aGUgcmVzdWx0aW5nIGJvdW5kaW5nIGJveCB3aWxsIGluY2x1ZGUgZXZlcnkgcG9pbnQgdGhhdCBjb3VsZCBoYXZlIGJlZW4gaW4gdGhlIG9yaWdpbmFsIGJvdW5kaW5nIGJveFxyXG4gICAqIChhbmQgaXQgY2FuIGJlIGV4cGFuZGVkKS5cclxuICAgKi9cclxuICBwdWJsaWMgbG9jYWxUb1BhcmVudEJvdW5kcyggYm91bmRzOiBCb3VuZHMyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3RyYW5zZm9ybS50cmFuc2Zvcm1Cb3VuZHMyKCBib3VuZHMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBwb2ludCB0cmFuc2Zvcm1lZCBmcm9tIG91ciBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZSBpbnRvIG91ciBsb2NhbCBjb29yZGluYXRlIGZyYW1lLiBBcHBsaWVzIHRoZSBpbnZlcnNlXHJcbiAgICogb2Ygb3VyIG5vZGUncyB0cmFuc2Zvcm0gdG8gaXQuXHJcbiAgICovXHJcbiAgcHVibGljIHBhcmVudFRvTG9jYWxQb2ludCggcG9pbnQ6IFZlY3RvcjIgKTogVmVjdG9yMiB7XHJcbiAgICByZXR1cm4gdGhpcy5fdHJhbnNmb3JtLmludmVyc2VQb3NpdGlvbjIoIHBvaW50ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGJvdW5kcyB0cmFuc2Zvcm1lZCBmcm9tIG91ciBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZSBpbnRvIG91ciBsb2NhbCBjb29yZGluYXRlIGZyYW1lLiBJZiBpdCBpbmNsdWRlcyBhXHJcbiAgICogcm90YXRpb24sIHRoZSByZXN1bHRpbmcgYm91bmRpbmcgYm94IHdpbGwgaW5jbHVkZSBldmVyeSBwb2ludCB0aGF0IGNvdWxkIGhhdmUgYmVlbiBpbiB0aGUgb3JpZ2luYWwgYm91bmRpbmcgYm94XHJcbiAgICogKGFuZCBpdCBjYW4gYmUgZXhwYW5kZWQpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBwYXJlbnRUb0xvY2FsQm91bmRzKCBib3VuZHM6IEJvdW5kczIgKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5fdHJhbnNmb3JtLmludmVyc2VCb3VuZHMyKCBib3VuZHMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgbXV0YWJsZS1vcHRpbWl6ZWQgZm9ybSBvZiBsb2NhbFRvUGFyZW50Qm91bmRzKCkgdGhhdCB3aWxsIG1vZGlmeSB0aGUgcHJvdmlkZWQgYm91bmRzLCB0cmFuc2Zvcm1pbmcgaXQgZnJvbSBvdXJcclxuICAgKiBsb2NhbCBjb29yZGluYXRlIGZyYW1lIHRvIG91ciBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKiBAcmV0dXJucyAtIFRoZSBzYW1lIGJvdW5kcyBvYmplY3QuXHJcbiAgICovXHJcbiAgcHVibGljIHRyYW5zZm9ybUJvdW5kc0Zyb21Mb2NhbFRvUGFyZW50KCBib3VuZHM6IEJvdW5kczIgKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gYm91bmRzLnRyYW5zZm9ybSggdGhpcy5fdHJhbnNmb3JtLmdldE1hdHJpeCgpICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBIG11dGFibGUtb3B0aW1pemVkIGZvcm0gb2YgcGFyZW50VG9Mb2NhbEJvdW5kcygpIHRoYXQgd2lsbCBtb2RpZnkgdGhlIHByb3ZpZGVkIGJvdW5kcywgdHJhbnNmb3JtaW5nIGl0IGZyb20gb3VyXHJcbiAgICogcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUgdG8gb3VyIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICogQHJldHVybnMgLSBUaGUgc2FtZSBib3VuZHMgb2JqZWN0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyB0cmFuc2Zvcm1Cb3VuZHNGcm9tUGFyZW50VG9Mb2NhbCggYm91bmRzOiBCb3VuZHMyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIGJvdW5kcy50cmFuc2Zvcm0oIHRoaXMuX3RyYW5zZm9ybS5nZXRJbnZlcnNlKCkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBuZXcgbWF0cml4IChmcmVzaCBjb3B5KSB0aGF0IHdvdWxkIHRyYW5zZm9ybSBwb2ludHMgZnJvbSBvdXIgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSB0byB0aGUgZ2xvYmFsXHJcbiAgICogY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKlxyXG4gICAqIE5PVEU6IElmIHRoZXJlIGFyZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhpcyBOb2RlIChlLmcuIHRoaXMgb3Igb25lIGFuY2VzdG9yIGhhcyB0d28gcGFyZW50cyksIGl0IHdpbGwgZmFpbFxyXG4gICAqIHdpdGggYW4gYXNzZXJ0aW9uIChzaW5jZSB0aGUgdHJhbnNmb3JtIHdvdWxkbid0IGJlIHVuaXF1ZWx5IGRlZmluZWQpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMb2NhbFRvR2xvYmFsTWF0cml4KCk6IE1hdHJpeDMge1xyXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby10aGlzLWFsaWFzXHJcbiAgICBsZXQgbm9kZTogTm9kZSA9IHRoaXM7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY29uc2lzdGVudC10aGlzXHJcblxyXG4gICAgLy8gd2UgbmVlZCB0byBhcHBseSB0aGUgdHJhbnNmb3JtYXRpb25zIGluIHRoZSByZXZlcnNlIG9yZGVyLCBzbyB3ZSB0ZW1wb3JhcmlseSBzdG9yZSB0aGVtXHJcbiAgICBjb25zdCBtYXRyaWNlcyA9IFtdO1xyXG5cclxuICAgIC8vIGNvbmNhdGVuYXRpb24gbGlrZSB0aGlzIGhhcyBiZWVuIGZhc3RlciB0aGFuIGdldHRpbmcgYSB1bmlxdWUgdHJhaWwsIGdldHRpbmcgaXRzIHRyYW5zZm9ybSwgYW5kIGFwcGx5aW5nIGl0XHJcbiAgICB3aGlsZSAoIG5vZGUgKSB7XHJcbiAgICAgIG1hdHJpY2VzLnB1c2goIG5vZGUuX3RyYW5zZm9ybS5nZXRNYXRyaXgoKSApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBub2RlLl9wYXJlbnRzWyAxIF0gPT09IHVuZGVmaW5lZCwgJ2dldExvY2FsVG9HbG9iYWxNYXRyaXggdW5hYmxlIHRvIHdvcmsgZm9yIERBRycgKTtcclxuICAgICAgbm9kZSA9IG5vZGUuX3BhcmVudHNbIDAgXTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtYXRyaXggPSBNYXRyaXgzLmlkZW50aXR5KCk7IC8vIHdpbGwgYmUgbW9kaWZpZWQgaW4gcGxhY2VcclxuXHJcbiAgICAvLyBpdGVyYXRlIGZyb20gdGhlIGJhY2sgZm9yd2FyZHMgKGZyb20gdGhlIHJvb3QgTm9kZSB0byBoZXJlKVxyXG4gICAgZm9yICggbGV0IGkgPSBtYXRyaWNlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSApIHtcclxuICAgICAgbWF0cml4Lm11bHRpcGx5TWF0cml4KCBtYXRyaWNlc1sgaSBdICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTk9URTogYWx3YXlzIHJldHVybiBhIGZyZXNoIGNvcHksIGdldEdsb2JhbFRvTG9jYWxNYXRyaXggZGVwZW5kcyBvbiBpdCB0byBtaW5pbWl6ZSBpbnN0YW5jZSB1c2FnZSFcclxuICAgIHJldHVybiBtYXRyaXg7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgVHJhbnNmb3JtMyB0aGF0IHdvdWxkIHRyYW5zZm9ybSB0aGluZ3MgZnJvbSBvdXIgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSB0byB0aGUgZ2xvYmFsIGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICogRXF1aXZhbGVudCB0byBnZXRVbmlxdWVUcmFpbCgpLmdldFRyYW5zZm9ybSgpLCBidXQgZmFzdGVyLlxyXG4gICAqXHJcbiAgICogTk9URTogSWYgdGhlcmUgYXJlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGlzIE5vZGUgKGUuZy4gdGhpcyBvciBvbmUgYW5jZXN0b3IgaGFzIHR3byBwYXJlbnRzKSwgaXQgd2lsbCBmYWlsXHJcbiAgICogd2l0aCBhbiBhc3NlcnRpb24gKHNpbmNlIHRoZSB0cmFuc2Zvcm0gd291bGRuJ3QgYmUgdW5pcXVlbHkgZGVmaW5lZCkuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFVuaXF1ZVRyYW5zZm9ybSgpOiBUcmFuc2Zvcm0zIHtcclxuICAgIHJldHVybiBuZXcgVHJhbnNmb3JtMyggdGhpcy5nZXRMb2NhbFRvR2xvYmFsTWF0cml4KCkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBuZXcgbWF0cml4IChmcmVzaCBjb3B5KSB0aGF0IHdvdWxkIHRyYW5zZm9ybSBwb2ludHMgZnJvbSB0aGUgZ2xvYmFsIGNvb3JkaW5hdGUgZnJhbWUgdG8gb3VyIGxvY2FsXHJcbiAgICogY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKlxyXG4gICAqIE5PVEU6IElmIHRoZXJlIGFyZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhpcyBOb2RlIChlLmcuIHRoaXMgb3Igb25lIGFuY2VzdG9yIGhhcyB0d28gcGFyZW50cyksIGl0IHdpbGwgZmFpbFxyXG4gICAqIHdpdGggYW4gYXNzZXJ0aW9uIChzaW5jZSB0aGUgdHJhbnNmb3JtIHdvdWxkbid0IGJlIHVuaXF1ZWx5IGRlZmluZWQpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRHbG9iYWxUb0xvY2FsTWF0cml4KCk6IE1hdHJpeDMge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TG9jYWxUb0dsb2JhbE1hdHJpeCgpLmludmVydCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJhbnNmb3JtcyBhIHBvaW50IGZyb20gb3VyIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUgdG8gdGhlIGdsb2JhbCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqXHJcbiAgICogTk9URTogSWYgdGhlcmUgYXJlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGlzIE5vZGUgKGUuZy4gdGhpcyBvciBvbmUgYW5jZXN0b3IgaGFzIHR3byBwYXJlbnRzKSwgaXQgd2lsbCBmYWlsXHJcbiAgICogd2l0aCBhbiBhc3NlcnRpb24gKHNpbmNlIHRoZSB0cmFuc2Zvcm0gd291bGRuJ3QgYmUgdW5pcXVlbHkgZGVmaW5lZCkuXHJcbiAgICovXHJcbiAgcHVibGljIGxvY2FsVG9HbG9iYWxQb2ludCggcG9pbnQ6IFZlY3RvcjIgKTogVmVjdG9yMiB7XHJcblxyXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby10aGlzLWFsaWFzXHJcbiAgICBsZXQgbm9kZTogTm9kZSA9IHRoaXM7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY29uc2lzdGVudC10aGlzXHJcbiAgICBjb25zdCByZXN1bHRQb2ludCA9IHBvaW50LmNvcHkoKTtcclxuICAgIHdoaWxlICggbm9kZSApIHtcclxuICAgICAgLy8gaW4tcGxhY2UgbXVsdGlwbGljYXRpb25cclxuICAgICAgbm9kZS5fdHJhbnNmb3JtLmdldE1hdHJpeCgpLm11bHRpcGx5VmVjdG9yMiggcmVzdWx0UG9pbnQgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggbm9kZS5fcGFyZW50c1sgMSBdID09PSB1bmRlZmluZWQsICdsb2NhbFRvR2xvYmFsUG9pbnQgdW5hYmxlIHRvIHdvcmsgZm9yIERBRycgKTtcclxuICAgICAgbm9kZSA9IG5vZGUuX3BhcmVudHNbIDAgXTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHRQb2ludDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyYW5zZm9ybXMgYSBwb2ludCBmcm9tIHRoZSBnbG9iYWwgY29vcmRpbmF0ZSBmcmFtZSB0byBvdXIgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKlxyXG4gICAqIE5PVEU6IElmIHRoZXJlIGFyZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhpcyBOb2RlIChlLmcuIHRoaXMgb3Igb25lIGFuY2VzdG9yIGhhcyB0d28gcGFyZW50cyksIGl0IHdpbGwgZmFpbFxyXG4gICAqIHdpdGggYW4gYXNzZXJ0aW9uIChzaW5jZSB0aGUgdHJhbnNmb3JtIHdvdWxkbid0IGJlIHVuaXF1ZWx5IGRlZmluZWQpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnbG9iYWxUb0xvY2FsUG9pbnQoIHBvaW50OiBWZWN0b3IyICk6IFZlY3RvcjIge1xyXG5cclxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdGhpcy1hbGlhc1xyXG4gICAgbGV0IG5vZGU6IE5vZGUgPSB0aGlzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNvbnNpc3RlbnQtdGhpc1xyXG4gICAgLy8gVE9ETzogcGVyZm9ybWFuY2U6IHRlc3Qgd2hldGhlciBpdCBpcyBmYXN0ZXIgdG8gZ2V0IGEgdG90YWwgdHJhbnNmb3JtIGFuZCB0aGVuIGludmVydCAod29uJ3QgY29tcHV0ZSBpbmRpdmlkdWFsIGludmVyc2VzKSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG5cclxuICAgIC8vIHdlIG5lZWQgdG8gYXBwbHkgdGhlIHRyYW5zZm9ybWF0aW9ucyBpbiB0aGUgcmV2ZXJzZSBvcmRlciwgc28gd2UgdGVtcG9yYXJpbHkgc3RvcmUgdGhlbVxyXG4gICAgY29uc3QgdHJhbnNmb3JtcyA9IFtdO1xyXG4gICAgd2hpbGUgKCBub2RlICkge1xyXG4gICAgICB0cmFuc2Zvcm1zLnB1c2goIG5vZGUuX3RyYW5zZm9ybSApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBub2RlLl9wYXJlbnRzWyAxIF0gPT09IHVuZGVmaW5lZCwgJ2dsb2JhbFRvTG9jYWxQb2ludCB1bmFibGUgdG8gd29yayBmb3IgREFHJyApO1xyXG4gICAgICBub2RlID0gbm9kZS5fcGFyZW50c1sgMCBdO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGl0ZXJhdGUgZnJvbSB0aGUgYmFjayBmb3J3YXJkcyAoZnJvbSB0aGUgcm9vdCBOb2RlIHRvIGhlcmUpXHJcbiAgICBjb25zdCByZXN1bHRQb2ludCA9IHBvaW50LmNvcHkoKTtcclxuICAgIGZvciAoIGxldCBpID0gdHJhbnNmb3Jtcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSApIHtcclxuICAgICAgLy8gaW4tcGxhY2UgbXVsdGlwbGljYXRpb25cclxuICAgICAgdHJhbnNmb3Jtc1sgaSBdLmdldEludmVyc2UoKS5tdWx0aXBseVZlY3RvcjIoIHJlc3VsdFBvaW50ICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0UG9pbnQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmFuc2Zvcm1zIGJvdW5kcyBmcm9tIG91ciBsb2NhbCBjb29yZGluYXRlIGZyYW1lIHRvIHRoZSBnbG9iYWwgY29vcmRpbmF0ZSBmcmFtZS4gSWYgaXQgaW5jbHVkZXMgYVxyXG4gICAqIHJvdGF0aW9uLCB0aGUgcmVzdWx0aW5nIGJvdW5kaW5nIGJveCB3aWxsIGluY2x1ZGUgZXZlcnkgcG9pbnQgdGhhdCBjb3VsZCBoYXZlIGJlZW4gaW4gdGhlIG9yaWdpbmFsIGJvdW5kaW5nIGJveFxyXG4gICAqIChhbmQgaXQgY2FuIGJlIGV4cGFuZGVkKS5cclxuICAgKlxyXG4gICAqIE5PVEU6IElmIHRoZXJlIGFyZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhpcyBOb2RlIChlLmcuIHRoaXMgb3Igb25lIGFuY2VzdG9yIGhhcyB0d28gcGFyZW50cyksIGl0IHdpbGwgZmFpbFxyXG4gICAqIHdpdGggYW4gYXNzZXJ0aW9uIChzaW5jZSB0aGUgdHJhbnNmb3JtIHdvdWxkbid0IGJlIHVuaXF1ZWx5IGRlZmluZWQpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBsb2NhbFRvR2xvYmFsQm91bmRzKCBib3VuZHM6IEJvdW5kczIgKTogQm91bmRzMiB7XHJcbiAgICAvLyBhcHBseSB0aGUgYm91bmRzIHRyYW5zZm9ybSBvbmx5IG9uY2UsIHNvIHdlIGNhbiBtaW5pbWl6ZSB0aGUgZXhwYW5zaW9uIGVuY291bnRlcmVkIGZyb20gbXVsdGlwbGUgcm90YXRpb25zXHJcbiAgICAvLyBpdCBhbHNvIHNlZW1zIHRvIGJlIGEgYml0IGZhc3RlciB0aGlzIHdheVxyXG4gICAgcmV0dXJuIGJvdW5kcy50cmFuc2Zvcm1lZCggdGhpcy5nZXRMb2NhbFRvR2xvYmFsTWF0cml4KCkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyYW5zZm9ybXMgYm91bmRzIGZyb20gdGhlIGdsb2JhbCBjb29yZGluYXRlIGZyYW1lIHRvIG91ciBsb2NhbCBjb29yZGluYXRlIGZyYW1lLiBJZiBpdCBpbmNsdWRlcyBhXHJcbiAgICogcm90YXRpb24sIHRoZSByZXN1bHRpbmcgYm91bmRpbmcgYm94IHdpbGwgaW5jbHVkZSBldmVyeSBwb2ludCB0aGF0IGNvdWxkIGhhdmUgYmVlbiBpbiB0aGUgb3JpZ2luYWwgYm91bmRpbmcgYm94XHJcbiAgICogKGFuZCBpdCBjYW4gYmUgZXhwYW5kZWQpLlxyXG4gICAqXHJcbiAgICogTk9URTogSWYgdGhlcmUgYXJlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGlzIE5vZGUgKGUuZy4gdGhpcyBvciBvbmUgYW5jZXN0b3IgaGFzIHR3byBwYXJlbnRzKSwgaXQgd2lsbCBmYWlsXHJcbiAgICogd2l0aCBhbiBhc3NlcnRpb24gKHNpbmNlIHRoZSB0cmFuc2Zvcm0gd291bGRuJ3QgYmUgdW5pcXVlbHkgZGVmaW5lZCkuXHJcbiAgICovXHJcbiAgcHVibGljIGdsb2JhbFRvTG9jYWxCb3VuZHMoIGJvdW5kczogQm91bmRzMiApOiBCb3VuZHMyIHtcclxuICAgIC8vIGFwcGx5IHRoZSBib3VuZHMgdHJhbnNmb3JtIG9ubHkgb25jZSwgc28gd2UgY2FuIG1pbmltaXplIHRoZSBleHBhbnNpb24gZW5jb3VudGVyZWQgZnJvbSBtdWx0aXBsZSByb3RhdGlvbnNcclxuICAgIHJldHVybiBib3VuZHMudHJhbnNmb3JtZWQoIHRoaXMuZ2V0R2xvYmFsVG9Mb2NhbE1hdHJpeCgpICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmFuc2Zvcm1zIGEgcG9pbnQgZnJvbSBvdXIgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUgdG8gdGhlIGdsb2JhbCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqXHJcbiAgICogTk9URTogSWYgdGhlcmUgYXJlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGlzIE5vZGUgKGUuZy4gdGhpcyBvciBvbmUgYW5jZXN0b3IgaGFzIHR3byBwYXJlbnRzKSwgaXQgd2lsbCBmYWlsXHJcbiAgICogd2l0aCBhbiBhc3NlcnRpb24gKHNpbmNlIHRoZSB0cmFuc2Zvcm0gd291bGRuJ3QgYmUgdW5pcXVlbHkgZGVmaW5lZCkuXHJcbiAgICovXHJcbiAgcHVibGljIHBhcmVudFRvR2xvYmFsUG9pbnQoIHBvaW50OiBWZWN0b3IyICk6IFZlY3RvcjIge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5wYXJlbnRzLmxlbmd0aCA8PSAxLCAncGFyZW50VG9HbG9iYWxQb2ludCB1bmFibGUgdG8gd29yayBmb3IgREFHJyApO1xyXG4gICAgcmV0dXJuIHRoaXMucGFyZW50cy5sZW5ndGggPyB0aGlzLnBhcmVudHNbIDAgXS5sb2NhbFRvR2xvYmFsUG9pbnQoIHBvaW50ICkgOiBwb2ludDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyYW5zZm9ybXMgYm91bmRzIGZyb20gb3VyIHBhcmVudCBjb29yZGluYXRlIGZyYW1lIHRvIHRoZSBnbG9iYWwgY29vcmRpbmF0ZSBmcmFtZS4gSWYgaXQgaW5jbHVkZXMgYVxyXG4gICAqIHJvdGF0aW9uLCB0aGUgcmVzdWx0aW5nIGJvdW5kaW5nIGJveCB3aWxsIGluY2x1ZGUgZXZlcnkgcG9pbnQgdGhhdCBjb3VsZCBoYXZlIGJlZW4gaW4gdGhlIG9yaWdpbmFsIGJvdW5kaW5nIGJveFxyXG4gICAqIChhbmQgaXQgY2FuIGJlIGV4cGFuZGVkKS5cclxuICAgKlxyXG4gICAqIE5PVEU6IElmIHRoZXJlIGFyZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhpcyBOb2RlIChlLmcuIHRoaXMgb3Igb25lIGFuY2VzdG9yIGhhcyB0d28gcGFyZW50cyksIGl0IHdpbGwgZmFpbFxyXG4gICAqIHdpdGggYW4gYXNzZXJ0aW9uIChzaW5jZSB0aGUgdHJhbnNmb3JtIHdvdWxkbid0IGJlIHVuaXF1ZWx5IGRlZmluZWQpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBwYXJlbnRUb0dsb2JhbEJvdW5kcyggYm91bmRzOiBCb3VuZHMyICk6IEJvdW5kczIge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5wYXJlbnRzLmxlbmd0aCA8PSAxLCAncGFyZW50VG9HbG9iYWxCb3VuZHMgdW5hYmxlIHRvIHdvcmsgZm9yIERBRycgKTtcclxuICAgIHJldHVybiB0aGlzLnBhcmVudHMubGVuZ3RoID8gdGhpcy5wYXJlbnRzWyAwIF0ubG9jYWxUb0dsb2JhbEJvdW5kcyggYm91bmRzICkgOiBib3VuZHM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmFuc2Zvcm1zIGEgcG9pbnQgZnJvbSB0aGUgZ2xvYmFsIGNvb3JkaW5hdGUgZnJhbWUgdG8gb3VyIHBhcmVudCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqXHJcbiAgICogTk9URTogSWYgdGhlcmUgYXJlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGlzIE5vZGUgKGUuZy4gdGhpcyBvciBvbmUgYW5jZXN0b3IgaGFzIHR3byBwYXJlbnRzKSwgaXQgd2lsbCBmYWlsXHJcbiAgICogd2l0aCBhbiBhc3NlcnRpb24gKHNpbmNlIHRoZSB0cmFuc2Zvcm0gd291bGRuJ3QgYmUgdW5pcXVlbHkgZGVmaW5lZCkuXHJcbiAgICovXHJcbiAgcHVibGljIGdsb2JhbFRvUGFyZW50UG9pbnQoIHBvaW50OiBWZWN0b3IyICk6IFZlY3RvcjIge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5wYXJlbnRzLmxlbmd0aCA8PSAxLCAnZ2xvYmFsVG9QYXJlbnRQb2ludCB1bmFibGUgdG8gd29yayBmb3IgREFHJyApO1xyXG4gICAgcmV0dXJuIHRoaXMucGFyZW50cy5sZW5ndGggPyB0aGlzLnBhcmVudHNbIDAgXS5nbG9iYWxUb0xvY2FsUG9pbnQoIHBvaW50ICkgOiBwb2ludDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyYW5zZm9ybXMgYm91bmRzIGZyb20gdGhlIGdsb2JhbCBjb29yZGluYXRlIGZyYW1lIHRvIG91ciBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZS4gSWYgaXQgaW5jbHVkZXMgYVxyXG4gICAqIHJvdGF0aW9uLCB0aGUgcmVzdWx0aW5nIGJvdW5kaW5nIGJveCB3aWxsIGluY2x1ZGUgZXZlcnkgcG9pbnQgdGhhdCBjb3VsZCBoYXZlIGJlZW4gaW4gdGhlIG9yaWdpbmFsIGJvdW5kaW5nIGJveFxyXG4gICAqIChhbmQgaXQgY2FuIGJlIGV4cGFuZGVkKS5cclxuICAgKlxyXG4gICAqIE5PVEU6IElmIHRoZXJlIGFyZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhpcyBOb2RlIChlLmcuIHRoaXMgb3Igb25lIGFuY2VzdG9yIGhhcyB0d28gcGFyZW50cyksIGl0IHdpbGwgZmFpbFxyXG4gICAqIHdpdGggYW4gYXNzZXJ0aW9uIChzaW5jZSB0aGUgdHJhbnNmb3JtIHdvdWxkbid0IGJlIHVuaXF1ZWx5IGRlZmluZWQpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnbG9iYWxUb1BhcmVudEJvdW5kcyggYm91bmRzOiBCb3VuZHMyICk6IEJvdW5kczIge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5wYXJlbnRzLmxlbmd0aCA8PSAxLCAnZ2xvYmFsVG9QYXJlbnRCb3VuZHMgdW5hYmxlIHRvIHdvcmsgZm9yIERBRycgKTtcclxuICAgIHJldHVybiB0aGlzLnBhcmVudHMubGVuZ3RoID8gdGhpcy5wYXJlbnRzWyAwIF0uZ2xvYmFsVG9Mb2NhbEJvdW5kcyggYm91bmRzICkgOiBib3VuZHM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgYm91bmRpbmcgYm94IGZvciB0aGlzIE5vZGUgKGFuZCBpdHMgc3ViLXRyZWUpIGluIHRoZSBnbG9iYWwgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKlxyXG4gICAqIE5PVEU6IElmIHRoZXJlIGFyZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhpcyBOb2RlIChlLmcuIHRoaXMgb3Igb25lIGFuY2VzdG9yIGhhcyB0d28gcGFyZW50cyksIGl0IHdpbGwgZmFpbFxyXG4gICAqIHdpdGggYW4gYXNzZXJ0aW9uIChzaW5jZSB0aGUgdHJhbnNmb3JtIHdvdWxkbid0IGJlIHVuaXF1ZWx5IGRlZmluZWQpLlxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyByZXF1aXJlcyBjb21wdXRhdGlvbiBvZiB0aGlzIG5vZGUncyBzdWJ0cmVlIGJvdW5kcywgd2hpY2ggbWF5IGluY3VyIHNvbWUgcGVyZm9ybWFuY2UgbG9zcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0R2xvYmFsQm91bmRzKCk6IEJvdW5kczIge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5wYXJlbnRzLmxlbmd0aCA8PSAxLCAnZ2xvYmFsQm91bmRzIHVuYWJsZSB0byB3b3JrIGZvciBEQUcnICk7XHJcbiAgICByZXR1cm4gdGhpcy5wYXJlbnRUb0dsb2JhbEJvdW5kcyggdGhpcy5nZXRCb3VuZHMoKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGdldEdsb2JhbEJvdW5kcygpIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBnbG9iYWxCb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRHbG9iYWxCb3VuZHMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGJvdW5kcyBvZiBhbnkgb3RoZXIgTm9kZSBpbiBvdXIgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKlxyXG4gICAqIE5PVEU6IElmIHRoaXMgbm9kZSBvciB0aGUgcGFzc2VkIGluIE5vZGUgaGF2ZSBtdWx0aXBsZSBpbnN0YW5jZXMgKGUuZy4gdGhpcyBvciBvbmUgYW5jZXN0b3IgaGFzIHR3byBwYXJlbnRzKSwgaXQgd2lsbCBmYWlsXHJcbiAgICogd2l0aCBhbiBhc3NlcnRpb24uXHJcbiAgICpcclxuICAgKiBUT0RPOiBQb3NzaWJsZSB0byBiZSB3ZWxsLWRlZmluZWQgYW5kIGhhdmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIGVhY2guIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICovXHJcbiAgcHVibGljIGJvdW5kc09mKCBub2RlOiBOb2RlICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2xvYmFsVG9Mb2NhbEJvdW5kcyggbm9kZS5nZXRHbG9iYWxCb3VuZHMoKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYm91bmRzIG9mIHRoaXMgTm9kZSBpbiBhbm90aGVyIG5vZGUncyBsb2NhbCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqXHJcbiAgICogTk9URTogSWYgdGhpcyBub2RlIG9yIHRoZSBwYXNzZWQgaW4gTm9kZSBoYXZlIG11bHRpcGxlIGluc3RhbmNlcyAoZS5nLiB0aGlzIG9yIG9uZSBhbmNlc3RvciBoYXMgdHdvIHBhcmVudHMpLCBpdCB3aWxsIGZhaWxcclxuICAgKiB3aXRoIGFuIGFzc2VydGlvbi5cclxuICAgKlxyXG4gICAqIFRPRE86IFBvc3NpYmxlIHRvIGJlIHdlbGwtZGVmaW5lZCBhbmQgaGF2ZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgZWFjaC4gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgKi9cclxuICBwdWJsaWMgYm91bmRzVG8oIG5vZGU6IE5vZGUgKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gbm9kZS5nbG9iYWxUb0xvY2FsQm91bmRzKCB0aGlzLmdldEdsb2JhbEJvdW5kcygpICk7XHJcbiAgfVxyXG5cclxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcclxuICAgKiBEcmF3YWJsZSBoYW5kbGluZ1xyXG4gICAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgdGhlIGRyYXdhYmxlIHRvIG91ciBsaXN0IG9mIGRyYXdhYmxlcyB0byBub3RpZnkgb2YgdmlzdWFsIGNoYW5nZXMuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBhdHRhY2hEcmF3YWJsZSggZHJhd2FibGU6IERyYXdhYmxlICk6IHRoaXMge1xyXG4gICAgdGhpcy5fZHJhd2FibGVzLnB1c2goIGRyYXdhYmxlICk7XHJcbiAgICByZXR1cm4gdGhpczsgLy8gYWxsb3cgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgdGhlIGRyYXdhYmxlIGZyb20gb3VyIGxpc3Qgb2YgZHJhd2FibGVzIHRvIG5vdGlmeSBvZiB2aXN1YWwgY2hhbmdlcy4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIGRldGFjaERyYXdhYmxlKCBkcmF3YWJsZTogRHJhd2FibGUgKTogdGhpcyB7XHJcbiAgICBjb25zdCBpbmRleCA9IF8uaW5kZXhPZiggdGhpcy5fZHJhd2FibGVzLCBkcmF3YWJsZSApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGluZGV4ID49IDAsICdJbnZhbGlkIG9wZXJhdGlvbjogdHJ5aW5nIHRvIGRldGFjaCBhIG5vbi1yZWZlcmVuY2VkIGRyYXdhYmxlJyApO1xyXG5cclxuICAgIHRoaXMuX2RyYXdhYmxlcy5zcGxpY2UoIGluZGV4LCAxICk7IC8vIFRPRE86IHJlcGxhY2Ugd2l0aCBhIHJlbW92ZSgpIGZ1bmN0aW9uIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNjYW5zIHRoZSBvcHRpb25zIG9iamVjdCBmb3Iga2V5IG5hbWVzIHRoYXQgY29ycmVzcG9uZCB0byBFUzUgc2V0dGVycyBvciBvdGhlciBzZXR0ZXIgZnVuY3Rpb25zLCBhbmQgY2FsbHMgdGhvc2VcclxuICAgKiB3aXRoIHRoZSB2YWx1ZXMuXHJcbiAgICpcclxuICAgKiBGb3IgZXhhbXBsZTpcclxuICAgKlxyXG4gICAqIG5vZGUubXV0YXRlKCB7IHRvcDogMCwgbGVmdDogNSB9ICk7XHJcbiAgICpcclxuICAgKiB3aWxsIGJlIGVxdWl2YWxlbnQgdG86XHJcbiAgICpcclxuICAgKiBub2RlLmxlZnQgPSA1O1xyXG4gICAqIG5vZGUudG9wID0gMDtcclxuICAgKlxyXG4gICAqIEluIHBhcnRpY3VsYXIsIG5vdGUgdGhhdCB0aGUgb3JkZXIgaXMgZGlmZmVyZW50LiBNdXRhdG9ycyB3aWxsIGJlIGFwcGxpZWQgaW4gdGhlIG9yZGVyIG9mIF9tdXRhdG9yS2V5cywgd2hpY2ggY2FuXHJcbiAgICogYmUgYWRkZWQgdG8gYnkgc3VidHlwZXMuXHJcbiAgICpcclxuICAgKiBBZGRpdGlvbmFsbHksIHNvbWUga2V5cyBhcmUgYWN0dWFsbHkgZGlyZWN0IGZ1bmN0aW9uIG5hbWVzLCBsaWtlICdzY2FsZScuIG11dGF0ZSggeyBzY2FsZTogMiB9ICkgd2lsbCBjYWxsXHJcbiAgICogbm9kZS5zY2FsZSggMiApIGluc3RlYWQgb2YgYWN0aXZhdGluZyBhbiBFUzUgc2V0dGVyIGRpcmVjdGx5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBtdXRhdGUoIG9wdGlvbnM/OiBOb2RlT3B0aW9ucyApOiB0aGlzIHtcclxuXHJcbiAgICBpZiAoICFvcHRpb25zICkge1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoIG9wdGlvbnMgKSA9PT0gT2JqZWN0LnByb3RvdHlwZSxcclxuICAgICAgJ0V4dHJhIHByb3RvdHlwZSBvbiBOb2RlIG9wdGlvbnMgb2JqZWN0IGlzIGEgY29kZSBzbWVsbCcgKTtcclxuXHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBfLmZpbHRlciggWyAndHJhbnNsYXRpb24nLCAneCcsICdsZWZ0JywgJ3JpZ2h0JywgJ2NlbnRlclgnLCAnY2VudGVyVG9wJywgJ3JpZ2h0VG9wJywgJ2xlZnRDZW50ZXInLCAnY2VudGVyJywgJ3JpZ2h0Q2VudGVyJywgJ2xlZnRCb3R0b20nLCAnY2VudGVyQm90dG9tJywgJ3JpZ2h0Qm90dG9tJyBdLCBrZXkgPT4gb3B0aW9uc1sga2V5IF0gIT09IHVuZGVmaW5lZCApLmxlbmd0aCA8PSAxLFxyXG4gICAgICBgTW9yZSB0aGFuIG9uZSBtdXRhdGlvbiBvbiB0aGlzIE5vZGUgc2V0IHRoZSB4IGNvbXBvbmVudCwgY2hlY2sgJHtPYmplY3Qua2V5cyggb3B0aW9ucyApLmpvaW4oICcsJyApfWAgKTtcclxuXHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBfLmZpbHRlciggWyAndHJhbnNsYXRpb24nLCAneScsICd0b3AnLCAnYm90dG9tJywgJ2NlbnRlclknLCAnY2VudGVyVG9wJywgJ3JpZ2h0VG9wJywgJ2xlZnRDZW50ZXInLCAnY2VudGVyJywgJ3JpZ2h0Q2VudGVyJywgJ2xlZnRCb3R0b20nLCAnY2VudGVyQm90dG9tJywgJ3JpZ2h0Qm90dG9tJyBdLCBrZXkgPT4gb3B0aW9uc1sga2V5IF0gIT09IHVuZGVmaW5lZCApLmxlbmd0aCA8PSAxLFxyXG4gICAgICBgTW9yZSB0aGFuIG9uZSBtdXRhdGlvbiBvbiB0aGlzIE5vZGUgc2V0IHRoZSB5IGNvbXBvbmVudCwgY2hlY2sgJHtPYmplY3Qua2V5cyggb3B0aW9ucyApLmpvaW4oICcsJyApfWAgKTtcclxuXHJcbiAgICBpZiAoIGFzc2VydCAmJiBvcHRpb25zLmhhc093blByb3BlcnR5KCAnZW5hYmxlZCcgKSAmJiBvcHRpb25zLmhhc093blByb3BlcnR5KCAnZW5hYmxlZFByb3BlcnR5JyApICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLmVuYWJsZWRQcm9wZXJ0eSEudmFsdWUgPT09IG9wdGlvbnMuZW5hYmxlZCwgJ0lmIGJvdGggZW5hYmxlZCBhbmQgZW5hYmxlZFByb3BlcnR5IGFyZSBwcm92aWRlZCwgdGhlbiB2YWx1ZXMgc2hvdWxkIG1hdGNoJyApO1xyXG4gICAgfVxyXG4gICAgaWYgKCBhc3NlcnQgJiYgb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSggJ2lucHV0RW5hYmxlZCcgKSAmJiBvcHRpb25zLmhhc093blByb3BlcnR5KCAnaW5wdXRFbmFibGVkUHJvcGVydHknICkgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIG9wdGlvbnMuaW5wdXRFbmFibGVkUHJvcGVydHkhLnZhbHVlID09PSBvcHRpb25zLmlucHV0RW5hYmxlZCwgJ0lmIGJvdGggaW5wdXRFbmFibGVkIGFuZCBpbnB1dEVuYWJsZWRQcm9wZXJ0eSBhcmUgcHJvdmlkZWQsIHRoZW4gdmFsdWVzIHNob3VsZCBtYXRjaCcgKTtcclxuICAgIH1cclxuICAgIGlmICggYXNzZXJ0ICYmIG9wdGlvbnMuaGFzT3duUHJvcGVydHkoICd2aXNpYmxlJyApICYmIG9wdGlvbnMuaGFzT3duUHJvcGVydHkoICd2aXNpYmxlUHJvcGVydHknICkgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIG9wdGlvbnMudmlzaWJsZVByb3BlcnR5IS52YWx1ZSA9PT0gb3B0aW9ucy52aXNpYmxlLCAnSWYgYm90aCB2aXNpYmxlIGFuZCB2aXNpYmxlUHJvcGVydHkgYXJlIHByb3ZpZGVkLCB0aGVuIHZhbHVlcyBzaG91bGQgbWF0Y2gnICk7XHJcbiAgICB9XHJcbiAgICBpZiAoIGFzc2VydCAmJiBvcHRpb25zLmhhc093blByb3BlcnR5KCAncGRvbVZpc2libGUnICkgJiYgb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSggJ3Bkb21WaXNpYmxlUHJvcGVydHknICkgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIG9wdGlvbnMucGRvbVZpc2libGVQcm9wZXJ0eSEudmFsdWUgPT09IG9wdGlvbnMucGRvbVZpc2libGUsICdJZiBib3RoIHBkb21WaXNpYmxlIGFuZCBwZG9tVmlzaWJsZVByb3BlcnR5IGFyZSBwcm92aWRlZCwgdGhlbiB2YWx1ZXMgc2hvdWxkIG1hdGNoJyApO1xyXG4gICAgfVxyXG4gICAgaWYgKCBhc3NlcnQgJiYgb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSggJ3BpY2thYmxlJyApICYmIG9wdGlvbnMuaGFzT3duUHJvcGVydHkoICdwaWNrYWJsZVByb3BlcnR5JyApICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLnBpY2thYmxlUHJvcGVydHkhLnZhbHVlID09PSBvcHRpb25zLnBpY2thYmxlLCAnSWYgYm90aCBwaWNrYWJsZSBhbmQgcGlja2FibGVQcm9wZXJ0eSBhcmUgcHJvdmlkZWQsIHRoZW4gdmFsdWVzIHNob3VsZCBtYXRjaCcgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtdXRhdG9yS2V5cyA9IHRoaXMuX211dGF0b3JLZXlzO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbXV0YXRvcktleXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGtleSA9IG11dGF0b3JLZXlzWyBpIF07XHJcblxyXG4gICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzU4MCBmb3IgbW9yZSBhYm91dCBwYXNzaW5nIHVuZGVmaW5lZC5cclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSgga2V5ICkgfHwgb3B0aW9uc1sga2V5IF0gIT09IHVuZGVmaW5lZCwgYFVuZGVmaW5lZCBub3QgYWxsb3dlZCBmb3IgTm9kZSBrZXk6ICR7a2V5fWAgKTtcclxuXHJcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBIbW0sIGJldHRlciB3YXkgdG8gY2hlY2sgdGhpcz9cclxuICAgICAgaWYgKCBvcHRpb25zWyBrZXkgXSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgIGNvbnN0IGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKCBOb2RlLnByb3RvdHlwZSwga2V5ICk7XHJcblxyXG4gICAgICAgIC8vIGlmIHRoZSBrZXkgcmVmZXJzIHRvIGEgZnVuY3Rpb24gdGhhdCBpcyBub3QgRVM1IHdyaXRhYmxlLCBpdCB3aWxsIGV4ZWN1dGUgdGhhdCBmdW5jdGlvbiB3aXRoIHRoZSBzaW5nbGUgYXJndW1lbnRcclxuICAgICAgICBpZiAoIGRlc2NyaXB0b3IgJiYgdHlwZW9mIGRlc2NyaXB0b3IudmFsdWUgPT09ICdmdW5jdGlvbicgKSB7XHJcbiAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICAgICAgICB0aGlzWyBrZXkgXSggb3B0aW9uc1sga2V5IF0gKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICAgICAgICB0aGlzWyBrZXkgXSA9IG9wdGlvbnNbIGtleSBdO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuaW5pdGlhbGl6ZVBoZXRpb09iamVjdCggREVGQVVMVF9QSEVUX0lPX09CSkVDVF9CQVNFX09QVElPTlMsIG9wdGlvbnMgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpczsgLy8gYWxsb3cgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBvdmVycmlkZSBpbml0aWFsaXplUGhldGlvT2JqZWN0KCBiYXNlT3B0aW9uczogUGFydGlhbDxQaGV0aW9PYmplY3RPcHRpb25zPiwgY29uZmlnOiBOb2RlT3B0aW9ucyApOiB2b2lkIHtcclxuXHJcbiAgICAvLyBUcmFjayB0aGlzLCBzbyB3ZSBvbmx5IG92ZXJyaWRlIG91ciB2aXNpYmxlUHJvcGVydHkgb25jZS5cclxuICAgIGNvbnN0IHdhc0luc3RydW1lbnRlZCA9IHRoaXMuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKTtcclxuXHJcbiAgICBzdXBlci5pbml0aWFsaXplUGhldGlvT2JqZWN0KCBiYXNlT3B0aW9ucywgY29uZmlnICk7XHJcblxyXG4gICAgaWYgKCBUYW5kZW0uUEhFVF9JT19FTkFCTEVEICYmICF3YXNJbnN0cnVtZW50ZWQgJiYgdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpICkge1xyXG5cclxuICAgICAgLy8gRm9yIGVhY2ggc3VwcG9ydGVkIFRpbnlGb3J3YXJkaW5nUHJvcGVydHksIGlmIGEgUHJvcGVydHkgd2FzIGFscmVhZHkgc3BlY2lmaWVkIGluIHRoZSBvcHRpb25zIChpbiB0aGVcclxuICAgICAgLy8gY29uc3RydWN0b3Igb3IgbXV0YXRlKSwgdGhlbiBpdCB3aWxsIGJlIHNldCBhcyB0aGlzLnRhcmdldFByb3BlcnR5IHRoZXJlLiBIZXJlIHdlIG9ubHkgY3JlYXRlIHRoZSBkZWZhdWx0XHJcbiAgICAgIC8vIGluc3RydW1lbnRlZCBvbmUgaWYgYW5vdGhlciBoYXNuJ3QgYWxyZWFkeSBiZWVuIHNwZWNpZmllZC5cclxuXHJcbiAgICAgIHRoaXMuX3Zpc2libGVQcm9wZXJ0eS5pbml0aWFsaXplUGhldGlvKCB0aGlzLCBWSVNJQkxFX1BST1BFUlRZX1RBTkRFTV9OQU1FLCAoKSA9PiBuZXcgQm9vbGVhblByb3BlcnR5KCB0aGlzLnZpc2libGUsIGNvbWJpbmVPcHRpb25zPEJvb2xlYW5Qcm9wZXJ0eU9wdGlvbnM+KCB7XHJcblxyXG4gICAgICAgICAgLy8gYnkgZGVmYXVsdCwgdXNlIHRoZSB2YWx1ZSBmcm9tIHRoZSBOb2RlXHJcbiAgICAgICAgICBwaGV0aW9SZWFkT25seTogdGhpcy5waGV0aW9SZWFkT25seSxcclxuICAgICAgICAgIHRhbmRlbTogdGhpcy50YW5kZW0uY3JlYXRlVGFuZGVtKCBWSVNJQkxFX1BST1BFUlRZX1RBTkRFTV9OQU1FICksXHJcbiAgICAgICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnQ29udHJvbHMgd2hldGhlciB0aGUgTm9kZSB3aWxsIGJlIHZpc2libGUgKGFuZCBpbnRlcmFjdGl2ZSkuJ1xyXG4gICAgICAgIH0sIGNvbmZpZy52aXNpYmxlUHJvcGVydHlPcHRpb25zICkgKVxyXG4gICAgICApO1xyXG5cclxuICAgICAgdGhpcy5fZW5hYmxlZFByb3BlcnR5LmluaXRpYWxpemVQaGV0aW8oIHRoaXMsIEVOQUJMRURfUFJPUEVSVFlfVEFOREVNX05BTUUsICgpID0+IG5ldyBFbmFibGVkUHJvcGVydHkoIHRoaXMuZW5hYmxlZCwgY29tYmluZU9wdGlvbnM8RW5hYmxlZFByb3BlcnR5T3B0aW9ucz4oIHtcclxuXHJcbiAgICAgICAgICAvLyBieSBkZWZhdWx0LCB1c2UgdGhlIHZhbHVlIGZyb20gdGhlIE5vZGVcclxuICAgICAgICAgIHBoZXRpb1JlYWRPbmx5OiB0aGlzLnBoZXRpb1JlYWRPbmx5LFxyXG4gICAgICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ1NldHMgd2hldGhlciB0aGUgbm9kZSBpcyBlbmFibGVkLiBUaGlzIHdpbGwgc2V0IHdoZXRoZXIgaW5wdXQgaXMgZW5hYmxlZCBmb3IgdGhpcyBOb2RlIGFuZCAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdtb3N0IG9mdGVuIGNoaWxkcmVuIGFzIHdlbGwuIEl0IHdpbGwgYWxzbyBjb250cm9sIGFuZCB0b2dnbGUgdGhlIFwiZGlzYWJsZWQgbG9va1wiIG9mIHRoZSBub2RlLicsXHJcbiAgICAgICAgICB0YW5kZW06IHRoaXMudGFuZGVtLmNyZWF0ZVRhbmRlbSggRU5BQkxFRF9QUk9QRVJUWV9UQU5ERU1fTkFNRSApXHJcbiAgICAgICAgfSwgY29uZmlnLmVuYWJsZWRQcm9wZXJ0eU9wdGlvbnMgKSApXHJcbiAgICAgICk7XHJcblxyXG4gICAgICB0aGlzLl9pbnB1dEVuYWJsZWRQcm9wZXJ0eS5pbml0aWFsaXplUGhldGlvKCB0aGlzLCBJTlBVVF9FTkFCTEVEX1BST1BFUlRZX1RBTkRFTV9OQU1FLCAoKSA9PiBuZXcgUHJvcGVydHkoIHRoaXMuaW5wdXRFbmFibGVkLCBjb21iaW5lT3B0aW9uczxQcm9wZXJ0eU9wdGlvbnM8Ym9vbGVhbj4+KCB7XHJcblxyXG4gICAgICAgICAgLy8gYnkgZGVmYXVsdCwgdXNlIHRoZSB2YWx1ZSBmcm9tIHRoZSBOb2RlXHJcbiAgICAgICAgICBwaGV0aW9SZWFkT25seTogdGhpcy5waGV0aW9SZWFkT25seSxcclxuICAgICAgICAgIHRhbmRlbTogdGhpcy50YW5kZW0uY3JlYXRlVGFuZGVtKCBJTlBVVF9FTkFCTEVEX1BST1BFUlRZX1RBTkRFTV9OQU1FICksXHJcbiAgICAgICAgICBwaGV0aW9WYWx1ZVR5cGU6IEJvb2xlYW5JTyxcclxuICAgICAgICAgIHBoZXRpb0ZlYXR1cmVkOiB0cnVlLCAvLyBTaW5jZSB0aGlzIHByb3BlcnR5IGlzIG9wdC1pbiwgd2UgdHlwaWNhbGx5IG9ubHkgb3B0LWluIHdoZW4gaXQgc2hvdWxkIGJlIGZlYXR1cmVkXHJcbiAgICAgICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnU2V0cyB3aGV0aGVyIHRoZSBlbGVtZW50IHdpbGwgaGF2ZSBpbnB1dCBlbmFibGVkLCBhbmQgaGVuY2UgYmUgaW50ZXJhY3RpdmUuJ1xyXG4gICAgICAgIH0sIGNvbmZpZy5pbnB1dEVuYWJsZWRQcm9wZXJ0eU9wdGlvbnMgKSApXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXQgdGhlIHZpc2liaWxpdHkgb2YgdGhpcyBOb2RlIHdpdGggcmVzcGVjdCB0byB0aGUgVm9pY2luZyBmZWF0dXJlLiBUb3RhbGx5IHNlcGFyYXRlIGZyb20gZ3JhcGhpY2FsIGRpc3BsYXkuXHJcbiAgICogV2hlbiB2aXNpYmxlLCB0aGlzIE5vZGUgYW5kIGFsbCBvZiBpdHMgYW5jZXN0b3JzIHdpbGwgYmUgYWJsZSB0byBzcGVhayB3aXRoIFZvaWNpbmcuIFdoZW4gdm9pY2luZ1Zpc2libGVcclxuICAgKiBpcyBmYWxzZSwgYWxsIFZvaWNpbmcgdW5kZXIgdGhpcyBOb2RlIHdpbGwgYmUgbXV0ZWQuIGB2b2ljaW5nVmlzaWJsZWAgcHJvcGVydGllcyBleGlzdCBpbiBOb2RlLnRzIGJlY2F1c2VcclxuICAgKiBpdCBpcyB1c2VmdWwgdG8gc2V0IGB2b2ljaW5nVmlzaWJsZWAgb24gYSByb290IHRoYXQgaXMgY29tcG9zZWQgd2l0aCBWb2ljaW5nLnRzLiBXZSBjYW5ub3QgcHV0IGFsbCBvZiB0aGVcclxuICAgKiBWb2ljaW5nLnRzIGltcGxlbWVudGF0aW9uIGluIE5vZGUgYmVjYXVzZSB0aGF0IHdvdWxkIGhhdmUgYSBtYXNzaXZlIG1lbW9yeSBpbXBhY3QuIFNlZSBWb2ljaW5nLnRzIGZvciBtb3JlXHJcbiAgICogaW5mb3JtYXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIHNldFZvaWNpbmdWaXNpYmxlKCB2aXNpYmxlOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgaWYgKCB0aGlzLnZvaWNpbmdWaXNpYmxlUHJvcGVydHkudmFsdWUgIT09IHZpc2libGUgKSB7XHJcbiAgICAgIHRoaXMudm9pY2luZ1Zpc2libGVQcm9wZXJ0eS52YWx1ZSA9IHZpc2libGU7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHZvaWNpbmdWaXNpYmxlKCB2aXNpYmxlOiBib29sZWFuICkgeyB0aGlzLnNldFZvaWNpbmdWaXNpYmxlKCB2aXNpYmxlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCB2b2ljaW5nVmlzaWJsZSgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuaXNWb2ljaW5nVmlzaWJsZSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciB0aGlzIE5vZGUgaXMgdm9pY2luZ1Zpc2libGUuIFdoZW4gdHJ1ZSBVdHRlcmFuY2VzIGZvciB0aGlzIE5vZGUgY2FuIGJlIGFubm91bmNlZCB3aXRoIHRoZVxyXG4gICAqIFZvaWNpbmcgZmVhdHVyZSwgc2VlIFZvaWNpbmcudHMgZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIGlzVm9pY2luZ1Zpc2libGUoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy52b2ljaW5nVmlzaWJsZVByb3BlcnR5LnZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT3ZlcnJpZGUgZm9yIGV4dHJhIGluZm9ybWF0aW9uIGluIHRoZSBkZWJ1Z2dpbmcgb3V0cHV0IChmcm9tIERpc3BsYXkuZ2V0RGVidWdIVE1MKCkpLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0RGVidWdIVE1MRXh0cmFzKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gJyc7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNYWtlcyB0aGlzIE5vZGUncyBzdWJ0cmVlIGF2YWlsYWJsZSBmb3IgaW5zcGVjdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgaW5zcGVjdCgpOiB2b2lkIHtcclxuICAgIGxvY2FsU3RvcmFnZS5zY2VuZXJ5U25hcHNob3QgPSBKU09OLnN0cmluZ2lmeSgge1xyXG4gICAgICB0eXBlOiAnU3VidHJlZScsXHJcbiAgICAgIHJvb3ROb2RlSWQ6IHRoaXMuaWQsXHJcbiAgICAgIG5vZGVzOiBzZXJpYWxpemVDb25uZWN0ZWROb2RlcyggdGhpcyApXHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgZGVidWdnaW5nIHN0cmluZyB0aGF0IGlzIGFuIGF0dGVtcHRlZCBzZXJpYWxpemF0aW9uIG9mIHRoaXMgbm9kZSdzIHN1Yi10cmVlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSB0b1N0cmluZygpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGAke3RoaXMuY29uc3RydWN0b3IubmFtZX0jJHt0aGlzLmlkfWA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQZXJmb3JtcyBjaGVja3MgdG8gc2VlIGlmIHRoZSBpbnRlcm5hbCBzdGF0ZSBvZiBJbnN0YW5jZSByZWZlcmVuY2VzIGlzIGNvcnJlY3QgYXQgYSBjZXJ0YWluIHBvaW50IGluL2FmdGVyIHRoZVxyXG4gICAqIERpc3BsYXkncyB1cGRhdGVEaXNwbGF5KCkuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBhdWRpdEluc3RhbmNlU3VidHJlZUZvckRpc3BsYXkoIGRpc3BsYXk6IERpc3BsYXkgKTogdm9pZCB7XHJcbiAgICBpZiAoIGFzc2VydFNsb3cgKSB7XHJcbiAgICAgIGNvbnN0IG51bUluc3RhbmNlcyA9IHRoaXMuX2luc3RhbmNlcy5sZW5ndGg7XHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IG51bUluc3RhbmNlczsgaSsrICkge1xyXG4gICAgICAgIGNvbnN0IGluc3RhbmNlID0gdGhpcy5faW5zdGFuY2VzWyBpIF07XHJcbiAgICAgICAgaWYgKCBpbnN0YW5jZS5kaXNwbGF5ID09PSBkaXNwbGF5ICkge1xyXG4gICAgICAgICAgYXNzZXJ0U2xvdyggaW5zdGFuY2UudHJhaWwhLmlzVmFsaWQoKSxcclxuICAgICAgICAgICAgYEludmFsaWQgdHJhaWwgb24gSW5zdGFuY2U6ICR7aW5zdGFuY2UudG9TdHJpbmcoKX0gd2l0aCB0cmFpbCAke2luc3RhbmNlLnRyYWlsIS50b1N0cmluZygpfWAgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGF1ZGl0IGFsbCBvZiB0aGUgY2hpbGRyZW5cclxuICAgICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKCBjaGlsZCA9PiB7XHJcbiAgICAgICAgY2hpbGQuYXVkaXRJbnN0YW5jZVN1YnRyZWVGb3JEaXNwbGF5KCBkaXNwbGF5ICk7XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZW4gd2UgYWRkIG9yIHJlbW92ZSBhbnkgbnVtYmVyIG9mIGJvdW5kcyBsaXN0ZW5lcnMsIHdlIHdhbnQgdG8gaW5jcmVtZW50L2RlY3JlbWVudCBpbnRlcm5hbCBpbmZvcm1hdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBkZWx0YVF1YW50aXR5IC0gSWYgcG9zaXRpdmUsIHRoZSBudW1iZXIgb2YgbGlzdGVuZXJzIGJlaW5nIGFkZGVkLCBvdGhlcndpc2UgdGhlIG51bWJlciByZW1vdmVkXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBvbkJvdW5kc0xpc3RlbmVyc0FkZGVkT3JSZW1vdmVkKCBkZWx0YVF1YW50aXR5OiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICB0aGlzLmNoYW5nZUJvdW5kc0V2ZW50Q291bnQoIGRlbHRhUXVhbnRpdHkgKTtcclxuICAgIHRoaXMuX2JvdW5kc0V2ZW50U2VsZkNvdW50ICs9IGRlbHRhUXVhbnRpdHk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEaXNwb3NlcyB0aGUgbm9kZSwgcmVsZWFzaW5nIGFsbCByZWZlcmVuY2VzIHRoYXQgaXQgbWFpbnRhaW5lZC5cclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuXHJcbiAgICAvLyByZW1vdmUgYWxsIFBET00gaW5wdXQgbGlzdGVuZXJzXHJcbiAgICB0aGlzLmRpc3Bvc2VQYXJhbGxlbERPTSgpO1xyXG5cclxuICAgIC8vIFdoZW4gZGlzcG9zaW5nLCByZW1vdmUgYWxsIGNoaWxkcmVuIGFuZCBwYXJlbnRzLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzYyOVxyXG4gICAgdGhpcy5yZW1vdmVBbGxDaGlsZHJlbigpO1xyXG4gICAgdGhpcy5kZXRhY2goKTtcclxuXHJcbiAgICAvLyBJbiBvcHBvc2l0ZSBvcmRlciBvZiBjcmVhdGlvblxyXG4gICAgdGhpcy5faW5wdXRFbmFibGVkUHJvcGVydHkuZGlzcG9zZSgpO1xyXG4gICAgdGhpcy5fZW5hYmxlZFByb3BlcnR5LmRpc3Bvc2UoKTtcclxuICAgIHRoaXMuX3BpY2thYmxlUHJvcGVydHkuZGlzcG9zZSgpO1xyXG4gICAgdGhpcy5fdmlzaWJsZVByb3BlcnR5LmRpc3Bvc2UoKTtcclxuXHJcbiAgICAvLyBUZWFyLWRvd24gaW4gdGhlIHJldmVyc2Ugb3JkZXIgTm9kZSB3YXMgY3JlYXRlZFxyXG4gICAgc3VwZXIuZGlzcG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGlzcG9zZXMgdGhpcyBOb2RlIGFuZCBhbGwgb3RoZXIgZGVzY2VuZGFudCBub2Rlcy5cclxuICAgKlxyXG4gICAqIE5PVEU6IFVzZSB3aXRoIGNhdXRpb24sIGFzIHlvdSBzaG91bGQgbm90IHJlLXVzZSBhbnkgTm9kZSB0b3VjaGVkIGJ5IHRoaXMuIE5vdCBjb21wYXRpYmxlIHdpdGggbW9zdCBEQUdcclxuICAgKiAgICAgICB0ZWNobmlxdWVzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaXNwb3NlU3VidHJlZSgpOiB2b2lkIHtcclxuICAgIGlmICggIXRoaXMuaXNEaXNwb3NlZCApIHtcclxuICAgICAgLy8gbWFrZXMgYSBjb3B5IGJlZm9yZSBkaXNwb3NpbmdcclxuICAgICAgY29uc3QgY2hpbGRyZW4gPSB0aGlzLmNoaWxkcmVuO1xyXG5cclxuICAgICAgdGhpcy5kaXNwb3NlKCk7XHJcblxyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICBjaGlsZHJlblsgaSBdLmRpc3Bvc2VTdWJ0cmVlKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBBIGRlZmF1bHQgZm9yIGdldFRyYWlscygpIHNlYXJjaGVzLCByZXR1cm5zIHdoZXRoZXIgdGhlIE5vZGUgaGFzIG5vIHBhcmVudHMuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBkZWZhdWx0VHJhaWxQcmVkaWNhdGUoIG5vZGU6IE5vZGUgKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gbm9kZS5fcGFyZW50cy5sZW5ndGggPT09IDA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBIGRlZmF1bHQgZm9yIGdldExlYWZUcmFpbHMoKSBzZWFyY2hlcywgcmV0dXJucyB3aGV0aGVyIHRoZSBOb2RlIGhhcyBubyBwYXJlbnRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgZGVmYXVsdExlYWZUcmFpbFByZWRpY2F0ZSggbm9kZTogTm9kZSApOiBib29sZWFuIHtcclxuICAgIHJldHVybiBub2RlLl9jaGlsZHJlbi5sZW5ndGggPT09IDA7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIE5vZGVJTzogSU9UeXBlO1xyXG5cclxuICAvLyBBIG1hcHBpbmcgb2YgYWxsIG9mIHRoZSBkZWZhdWx0IG9wdGlvbnMgcHJvdmlkZWQgdG8gTm9kZVxyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9OT0RFX09QVElPTlMgPSBERUZBVUxUX09QVElPTlM7XHJcblxyXG59XHJcblxyXG5Ob2RlLnByb3RvdHlwZS5fbXV0YXRvcktleXMgPSBBQ0NFU1NJQklMSVRZX09QVElPTl9LRVlTLmNvbmNhdCggTk9ERV9PUFRJT05fS0VZUyApO1xyXG5cclxuLyoqXHJcbiAqIHtBcnJheS48U3RyaW5nPn0gLSBMaXN0IG9mIGFsbCBkaXJ0eSBmbGFncyB0aGF0IHNob3VsZCBiZSBhdmFpbGFibGUgb24gZHJhd2FibGVzIGNyZWF0ZWQgZnJvbSB0aGlzIE5vZGUgKG9yXHJcbiAqICAgICAgICAgICAgICAgICAgICBzdWJ0eXBlKS4gR2l2ZW4gYSBmbGFnIChlLmcuIHJhZGl1cyksIGl0IGluZGljYXRlcyB0aGUgZXhpc3RlbmNlIG9mIGEgZnVuY3Rpb25cclxuICogICAgICAgICAgICAgICAgICAgIGRyYXdhYmxlLm1hcmtEaXJ0eVJhZGl1cygpIHRoYXQgd2lsbCBpbmRpY2F0ZSB0byB0aGUgZHJhd2FibGUgdGhhdCB0aGUgcmFkaXVzIGhhcyBjaGFuZ2VkLlxyXG4gKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICpcclxuICogU2hvdWxkIGJlIG92ZXJyaWRkZW4gYnkgc3VidHlwZXMuXHJcbiAqL1xyXG5Ob2RlLnByb3RvdHlwZS5kcmF3YWJsZU1hcmtGbGFncyA9IFtdO1xyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ05vZGUnLCBOb2RlICk7XHJcblxyXG4vLyB7SU9UeXBlfVxyXG5Ob2RlLk5vZGVJTyA9IG5ldyBJT1R5cGUoICdOb2RlSU8nLCB7XHJcbiAgdmFsdWVUeXBlOiBOb2RlLFxyXG4gIGRvY3VtZW50YXRpb246ICdUaGUgYmFzZSB0eXBlIGZvciBncmFwaGljYWwgYW5kIHBvdGVudGlhbGx5IGludGVyYWN0aXZlIG9iamVjdHMuJyxcclxuICBtZXRhZGF0YURlZmF1bHRzOiB7XHJcbiAgICBwaGV0aW9TdGF0ZTogUEhFVF9JT19TVEFURV9ERUZBVUxUXHJcbiAgfVxyXG59ICk7XHJcblxyXG5jb25zdCBERUZBVUxUX1BIRVRfSU9fT0JKRUNUX0JBU0VfT1BUSU9OUyA9IHsgcGhldGlvVHlwZTogTm9kZS5Ob2RlSU8sIHBoZXRpb1N0YXRlOiBQSEVUX0lPX1NUQVRFX0RFRkFVTFQgfTtcclxuXHJcbi8vIEEgYmFzZSBjbGFzcyBmb3IgYSBub2RlIGluIHRoZSBTY2VuZXJ5IHNjZW5lIGdyYXBoLiBTdXBwb3J0cyBnZW5lcmFsIGRpcmVjdGVkIGFjeWNsaWMgZ3JhcGhpY3MgKERBR3MpLlxyXG4vLyBIYW5kbGVzIG11bHRpcGxlIGxheWVycyB3aXRoIGFzc29ydGVkIHR5cGVzIChDYW52YXMgMkQsIFNWRywgRE9NLCBXZWJHTCwgZXRjLikuXHJcbi8vIE5vdGU6IFdlIHVzZSBpbnRlcmZhY2UgZXh0ZW5zaW9uLCBzbyB3ZSBjYW4ndCBleHBvcnQgTm9kZSBhdCBpdHMgZGVjbGFyYXRpb24gbG9jYXRpb25cclxuZXhwb3J0IGRlZmF1bHQgTm9kZTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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