// Copyright 2013-2024, University of Colorado Boulder

/**
 * An instance that is specific to the display (not necessarily a global instance, could be in a Canvas cache, etc),
 * that is needed to tracking instance-specific display information, and signals to the display system when other
 * changes are necessary.
 *
 * Instances generally form a true tree, as opposed to the DAG of nodes. The one exception is for shared Canvas caches,
 * where multiple instances can point to one globally-stored (shared) cache instance.
 *
 * An Instance is pooled, but when constructed will not automatically create children, drawables, etc.
 * syncTree() is responsible for synchronizing the instance itself and its entire subtree.
 *
 * Instances are created as 'stateless' instances, but during syncTree the rendering state (properties to determine
 * how to construct the drawable tree for this instance and its subtree) are set.
 *
 * While Instances are considered 'stateful', they will have listeners added to their Node which records actions taken
 * in-between Display.updateDisplay().
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import TinyEmitter from '../../../axon/js/TinyEmitter.js';
import arrayRemove from '../../../phet-core/js/arrayRemove.js';
import cleanArray from '../../../phet-core/js/cleanArray.js';
import Poolable from '../../../phet-core/js/Poolable.js';
import { BackboneDrawable, CanvasBlock, ChangeInterval, Drawable, Fittability, InlineCanvasCacheDrawable, RelativeTransform, Renderer, scenery, SharedCanvasCacheDrawable, Trail, Utils } from '../imports.js';

// This fixes how Typescript recognizes the "Display" type, used this pattern in javascript files we can't convert to
// TypeScript right now.
/**
 * @typedef {import('../imports').Display} Display
 */

let globalIdCounter = 1;

// preferences top to bottom in general
const defaultPreferredRenderers = Renderer.createOrderBitmask(Renderer.bitmaskSVG, Renderer.bitmaskCanvas, Renderer.bitmaskDOM, Renderer.bitmaskWebGL);
class Instance {
  /**
   * @public
   * @type {Display|null}
   */
  display = null;

  /**
   * @mixes Poolable
   *
   * See initialize() for documentation
   *
   * @param {Display} display
   * @param {Trail} trail
   * @param {boolean} isDisplayRoot
   * @param {boolean} isSharedCanvasCacheRoot
   */
  constructor(display, trail, isDisplayRoot, isSharedCanvasCacheRoot) {
    // @private {boolean}
    this.active = false;
    this.initialize(display, trail, isDisplayRoot, isSharedCanvasCacheRoot);
  }

  /**
   * @public
   *
   * @param {Display} display - Instances are bound to a single display
   * @param {Trail} trail - The list of ancestors going back up to our root instance (for the display, or for a cache)
   * @param {boolean} isDisplayRoot - Whether our instance is for the root node provided to the Display.
   * @param {boolean} isSharedCanvasCacheRoot - Whether our instance is the root for a shared Canvas cache (which can
   *                                            be used multiple places in the main instance tree)
   */
  initialize(display, trail, isDisplayRoot, isSharedCanvasCacheRoot) {
    assert && assert(!this.active, 'We should never try to initialize an already active object');

    // prevent the trail passed in from being mutated after this point (we want a consistent trail)
    trail.setImmutable();

    // @public {number}
    this.id = this.id || globalIdCounter++;

    // @public {boolean}
    this.isWebGLSupported = display.isWebGLAllowed() && Utils.isWebGLSupported;

    // @public {RelativeTransform} - provides high-performance access to 'relative' transforms (from our nearest
    // transform root), and allows for listening to when our relative transform changes (called during a phase of
    // Display.updateDisplay()).
    this.relativeTransform = this.relativeTransform || new RelativeTransform(this);

    // @public {Fittability} - provides logic for whether our drawables (or common-fit ancestors) will support fitting
    // for FittedBlock subtypes. See https://github.com/phetsims/scenery/issues/406.
    this.fittability = this.fittability || new Fittability(this);

    // @public {boolean} - Tracking of visibility {boolean} and associated boolean flags.
    this.visible = true; // global visibility (whether this instance will end up appearing on the display)
    this.relativeVisible = true; // relative visibility (ignores the closest ancestral visibility root and below)
    this.selfVisible = true; // like relative visibility, but is always true if we are a visibility root
    this.visibilityDirty = true; // entire subtree of visibility will need to be updated
    this.childVisibilityDirty = true; // an ancestor needs its visibility updated
    this.voicingVisible = true; // whether this instance is "visible" for Voicing and allows speech with that feature

    // @private {Object.<instanceId:number,number>} - Maps another instance's `instance.id` {number} => branch index
    // {number} (first index where the two trails are different). This effectively operates as a cache (since it's more
    // expensive to compute the value than it is to look up the value).
    // It is also "bidirectional", such that if we add instance A's branch index to this map, we will also add the
    // same value to instance A's map (referencing this instance). In order to clean up and prevent leaks, the
    // instance references are provided in this.branchIndexReferences (on both ends), so that when one instance is
    // disposed it can remove the references bidirectionally.
    this.branchIndexMap = this.branchIndexMap || {};

    // @public {Array.<Instance>} - All instances where we have entries in our map. See docs for branchIndexMap.
    this.branchIndexReferences = cleanArray(this.branchIndexReferences);

    // @private {number} - In the range (-1,0), to help us track insertions and removals of this instance's node to its
    // parent (did we get removed but added back?).
    // If it's -1 at its parent's syncTree, we'll end up removing our reference to it.
    // We use an integer just for sanity checks (if it ever reaches -2 or 1, we've reached an invalid state)
    this.addRemoveCounter = 0;

    // @private {number} - If equal to the current frame ID (it is initialized as such), then it is treated during the
    // change interval waterfall as "completely changed", and an interval for the entire instance is used.
    this.stitchChangeFrame = display._frameId;

    // @private {number} - If equal to the current frame ID, an instance was removed from before or after this instance,
    // so we'll want to add in a proper change interval (related to siblings)
    this.stitchChangeBefore = 0;
    this.stitchChangeAfter = 0;

    // @private {number} - If equal to the current frame ID, child instances were added or removed from this instance.
    this.stitchChangeOnChildren = 0;

    // @private {boolean} - whether we have been included in our parent's drawables the previous frame
    this.stitchChangeIncluded = false;

    // @private {function} - Node listeners for tracking children. Listeners should be added only when we become
    // stateful
    this.childInsertedListener = this.childInsertedListener || this.onChildInserted.bind(this);
    this.childRemovedListener = this.childRemovedListener || this.onChildRemoved.bind(this);
    this.childrenReorderedListener = this.childrenReorderedListener || this.onChildrenReordered.bind(this);
    this.visibilityListener = this.visibilityListener || this.onVisibilityChange.bind(this);
    this.markRenderStateDirtyListener = this.markRenderStateDirtyListener || this.markRenderStateDirty.bind(this);

    // @public {TinyEmitter}
    this.visibleEmitter = new TinyEmitter();
    this.relativeVisibleEmitter = new TinyEmitter();
    this.selfVisibleEmitter = new TinyEmitter();
    this.canVoiceEmitter = new TinyEmitter();
    this.cleanInstance(display, trail);

    // We need to add this reference on stateless instances, so that we can find out if it was removed before our
    // syncTree was called.
    this.node.addInstance(this);

    // @private {number} - Outstanding external references. used for shared cache instances, where multiple instances
    // can point to us.
    this.externalReferenceCount = 0;

    // @public {boolean} - Whether we have had our state initialized yet
    this.stateless = true;

    // @public {boolean} - Whether we are the root instance for a Display. Rendering state constant (will not change
    // over the life of an instance)
    this.isDisplayRoot = isDisplayRoot;

    // @public {boolean} - Whether we are the root of a Canvas cache. Rendering state constant (will not change over the
    // life of an instance)
    this.isSharedCanvasCacheRoot = isSharedCanvasCacheRoot;

    // @private {number} - [CASCADING RENDER STATE] Packed renderer order bitmask (what our renderer preferences are).
    // Part of the 'cascading' render state for the instance tree. These are properties that can affect the entire
    // subtree when set
    this.preferredRenderers = 0;

    // @private {boolean} - [CASCADING RENDER STATE] Whether we are beneath a Canvas cache (Canvas required). Part of
    // the 'cascading' render state for the instance tree. These are properties that can affect the entire subtree when
    // set
    this.isUnderCanvasCache = isSharedCanvasCacheRoot;

    // @public {boolean} - [RENDER STATE EXPORT] Whether we will have a BackboneDrawable group drawable
    this.isBackbone = false;

    // @public {boolean} - [RENDER STATE EXPORT] Whether this instance creates a new "root" for the relative trail
    // transforms
    this.isTransformed = false;

    // @private {boolean} - [RENDER STATE EXPORT] Whether this instance handles visibility with a group drawable
    this.isVisibilityApplied = false;

    // @private {boolean} - [RENDER STATE EXPORT] Whether we have a Canvas cache specific to this instance's position
    this.isInstanceCanvasCache = false;

    // @private {boolean} - [RENDER STATE EXPORT]
    this.isSharedCanvasCachePlaceholder = false;

    // @private {boolean} - [RENDER STATE EXPORT]
    this.isSharedCanvasCacheSelf = isSharedCanvasCacheRoot;

    // @private {number} - [RENDER STATE EXPORT] Renderer bitmask for the 'self' drawable (if our Node is painted)
    this.selfRenderer = 0;

    // @private {number} - [RENDER STATE EXPORT] Renderer bitmask for the 'group' drawable (if applicable)
    this.groupRenderer = 0;

    // @private {number} - [RENDER STATE EXPORT] Renderer bitmask for the cache drawable (if applicable)
    this.sharedCacheRenderer = 0;

    // @private {number} - When equal to the current frame it is considered "dirty". Is a pruning flag (whether we need
    // to be visited, whether updateRenderingState is required, and whether to visit children)
    this.renderStateDirtyFrame = display._frameId;

    // @private {number} - When equal to the current frame we can't prune at this instance. Is a pruning flag (whether
    // we need to be visited, whether updateRenderingState is required, and whether to visit children)
    this.skipPruningFrame = display._frameId;
    sceneryLog && sceneryLog.Instance && sceneryLog.Instance(`initialized ${this.toString()}`);

    // Whether we have been instantiated. false if we are in a pool waiting to be instantiated.
    this.active = true;
    return this;
  }

  /**
   * Called for initialization of properties (via initialize(), via constructor), and to clean the instance for
   * placement in the pool (don't leak memory).
   * @private
   *
   * If the parameters are null, we remove all external references so that we don't leak memory.
   *
   * @param {Display|null} display - Instances are bound to a single display
   * @param {Trail|null} trail - The list of ancestors going back up to our root instance (for the display, or for a cache)
   */
  cleanInstance(display, trail) {
    // @public {Display|null}
    this.display = display;

    // @public {Trail|null}
    this.trail = trail;

    // @public {Node|null}
    this.node = trail ? trail.lastNode() : null;

    // @public {Instance|null} - will be set as needed
    this.parent = null;

    // @private {Instance|null} - set when removed from us, so that we can easily reattach it when necessary
    this.oldParent = null;

    // @public {Array.<Instance>} - NOTE: reliance on correct order after syncTree by at least SVGBlock/SVGGroup
    this.children = cleanArray(this.children);

    // @private {Instance|null} - reference to a shared cache instance (different than a child)
    this.sharedCacheInstance = null;

    // initialize/clean sub-components
    this.relativeTransform.initialize(display, trail);
    this.fittability.initialize(display, trail);

    // @private {Array.<Instance>} - Child instances are pushed to here when their node is removed from our node.
    // We don't immediately dispose, since it may be added back.
    this.instanceRemovalCheckList = cleanArray(this.instanceRemovalCheckList);

    // @public {Drawable|null} - Our self-drawable in the drawable tree
    this.selfDrawable = null;

    // @public {Drawable|null} - Our backbone or non-shared cache
    this.groupDrawable = null;

    // @public {Drawable|null} - Our drawable if we are a shared cache
    this.sharedCacheDrawable = null;

    // @private {Drawable} - references into the linked list of drawables (null if nothing is drawable under this)
    this.firstDrawable = null;
    this.lastDrawable = null;

    // @private {Drawable} - references into the linked list of drawables (excludes any group drawables handling)
    this.firstInnerDrawable = null;
    this.lastInnerDrawable = null;

    // @private {Array.<SVGGroup>} - List of SVG groups associated with this display instance
    this.svgGroups = cleanArray(this.svgGroups);
    this.cleanSyncTreeResults();
  }

  /**
   * Initializes or clears properties that are all set as pseudo 'return values' of the syncTree() method. It is the
   * responsibility of the caller of syncTree() to afterwards (optionally read these results and) clear the references
   * using this method to prevent memory leaks.
   * @private
   *
   * TODO: consider a pool of (or a single global) typed return object(s), since setting these values on the instance https://github.com/phetsims/scenery/issues/1581
   * generally means hitting the heap, and can slow us down.
   */
  cleanSyncTreeResults() {
    // Tracking bounding indices / drawables for what has changed, so we don't have to over-stitch things.

    // @private {number} - if (not iff) child's index <= beforeStableIndex, it hasn't been added/removed. relevant to
    // current children.
    this.beforeStableIndex = this.children.length;

    // @private {number} - if (not iff) child's index >= afterStableIndex, it hasn't been added/removed. relevant to
    // current children.
    this.afterStableIndex = -1;

    // NOTE: both of these being null indicates "there are no change intervals", otherwise it assumes it points to
    // a linked-list of change intervals. We use {ChangeInterval}s to hold this information, see ChangeInterval to see
    // the individual properties that are considered part of a change interval.

    // @private {ChangeInterval}, first change interval (should have nextChangeInterval linked-list to
    // lastChangeInterval)
    this.firstChangeInterval = null;

    // @private {ChangeInterval}, last change interval
    this.lastChangeInterval = null;

    // @private {boolean} - render state change flags, all set in updateRenderingState()
    this.incompatibleStateChange = false; // Whether we need to recreate the instance tree
    this.groupChanged = false; // Whether we need to force a rebuild of the group drawable
    this.cascadingStateChange = false; // Whether we had a render state change that requires visiting all children
    this.anyStateChange = false; // Whether there was any change of rendering state with the last updateRenderingState()
  }

  /**
   * Updates the rendering state properties, and returns a {boolean} flag of whether it was successful if we were
   * already stateful.
   * @private
   *
   * Rendering state properties determine how we construct the drawable tree from our instance tree (e.g. do we
   * create an SVG or Canvas rectangle, where to place CSS transforms, how to handle opacity, etc.)
   *
   * Instances start out as 'stateless' until updateRenderingState() is called the first time.
   *
   * Node changes that can cause a potential state change (using Node event listeners):
   * - hints
   * - opacity
   * - clipArea
   * - _rendererSummary
   * - _rendererBitmask
   *
   * State changes that can cause cascading state changes in descendants:
   * - isUnderCanvasCache
   * - preferredRenderers
   */
  updateRenderingState() {
    sceneryLog && sceneryLog.Instance && sceneryLog.Instance(`updateRenderingState ${this.toString()}${this.stateless ? ' (stateless)' : ''}`);
    sceneryLog && sceneryLog.Instance && sceneryLog.push();
    sceneryLog && sceneryLog.Instance && sceneryLog.Instance(`old: ${this.getStateString()}`);

    // old state information, so we can compare what was changed
    const wasBackbone = this.isBackbone;
    const wasTransformed = this.isTransformed;
    const wasVisibilityApplied = this.isVisibilityApplied;
    const wasInstanceCanvasCache = this.isInstanceCanvasCache;
    const wasSharedCanvasCacheSelf = this.isSharedCanvasCacheSelf;
    const wasSharedCanvasCachePlaceholder = this.isSharedCanvasCachePlaceholder;
    const wasUnderCanvasCache = this.isUnderCanvasCache;
    const oldSelfRenderer = this.selfRenderer;
    const oldGroupRenderer = this.groupRenderer;
    const oldSharedCacheRenderer = this.sharedCacheRenderer;
    const oldPreferredRenderers = this.preferredRenderers;

    // default values to set (makes the logic much simpler)
    this.isBackbone = false;
    this.isTransformed = false;
    this.isVisibilityApplied = false;
    this.isInstanceCanvasCache = false;
    this.isSharedCanvasCacheSelf = false;
    this.isSharedCanvasCachePlaceholder = false;
    this.selfRenderer = 0;
    this.groupRenderer = 0;
    this.sharedCacheRenderer = 0;
    const node = this.node;
    this.isUnderCanvasCache = this.isSharedCanvasCacheRoot || (this.parent ? this.parent.isUnderCanvasCache || this.parent.isInstanceCanvasCache || this.parent.isSharedCanvasCacheSelf : false);

    // set up our preferred renderer list (generally based on the parent)
    this.preferredRenderers = this.parent ? this.parent.preferredRenderers : defaultPreferredRenderers;
    // allow the node to modify its preferred renderers (and those of its descendants)
    if (node._renderer) {
      this.preferredRenderers = Renderer.pushOrderBitmask(this.preferredRenderers, node._renderer);
    }
    const hasClip = this.node.hasClipArea();
    const hasFilters = this.node.effectiveOpacity !== 1 || node._usesOpacity || this.node._filters.length > 0;
    // let hasNonDOMFilter = false;
    let hasNonSVGFilter = false;
    let hasNonCanvasFilter = false;
    // let hasNonWebGLFilter = false;
    if (hasFilters) {
      // NOTE: opacity is OK with all of those (currently)
      for (let i = 0; i < this.node._filters.length; i++) {
        const filter = this.node._filters[i];

        // TODO: how to handle this, if we split AT the node? https://github.com/phetsims/scenery/issues/1581
        // if ( !filter.isDOMCompatible() ) {
        //   hasNonDOMFilter = true;
        // }
        if (!filter.isSVGCompatible()) {
          hasNonSVGFilter = true;
        }
        if (!filter.isCanvasCompatible()) {
          hasNonCanvasFilter = true;
        }
        // if ( !filter.isWebGLCompatible() ) {
        //   hasNonWebGLFilter = true;
        // }
      }
    }
    const requiresSplit = node._cssTransform || node._layerSplit;
    const backboneRequired = this.isDisplayRoot || !this.isUnderCanvasCache && requiresSplit;

    // Support either "all Canvas" or "all SVG" opacity/clip
    const applyTransparencyWithBlock = !backboneRequired && (hasFilters || hasClip) && (!hasNonSVGFilter && this.node._rendererSummary.isSubtreeRenderedExclusivelySVG(this.preferredRenderers) || !hasNonCanvasFilter && this.node._rendererSummary.isSubtreeRenderedExclusivelyCanvas(this.preferredRenderers));
    const useBackbone = applyTransparencyWithBlock ? false : backboneRequired || hasFilters || hasClip;

    // check if we need a backbone or cache
    // if we are under a canvas cache, we will NEVER have a backbone
    // splits are accomplished just by having a backbone
    // NOTE: If changing, check RendererSummary.summaryBitmaskForNodeSelf
    //OHTWO TODO: Update this to properly identify when backbones are necessary/and-or when we forward opacity/clipping https://github.com/phetsims/scenery/issues/1581
    if (useBackbone) {
      this.isBackbone = true;
      this.isVisibilityApplied = true;
      this.isTransformed = this.isDisplayRoot || !!node._cssTransform; // for now, only trigger CSS transform if we have the specific hint
      //OHTWO TODO: check whether the force acceleration hint is being used by our DOMBlock https://github.com/phetsims/scenery/issues/1581
      this.groupRenderer = Renderer.bitmaskDOM; // probably won't be used
    }
    // TODO: node._canvasCache hint not defined, always undefined https://github.com/phetsims/scenery/issues/1581
    else if (!applyTransparencyWithBlock && (hasFilters || hasClip || node._canvasCache)) {
      // everything underneath needs to be renderable with Canvas, otherwise we cannot cache
      assert && assert(this.node._rendererSummary.isSingleCanvasSupported(), `Node canvasCache provided, but not all node contents can be rendered with Canvas under ${this.node.constructor.name}`);

      // TODO: node._singleCache hint not defined, always undefined https://github.com/phetsims/scenery/issues/1581
      if (node._singleCache) {
        // TODO: scale options - fixed size, match highest resolution (adaptive), or mipmapped https://github.com/phetsims/scenery/issues/1581
        if (this.isSharedCanvasCacheRoot) {
          this.isSharedCanvasCacheSelf = true;
          this.sharedCacheRenderer = this.isWebGLSupported ? Renderer.bitmaskWebGL : Renderer.bitmaskCanvas;
        } else {
          // everything underneath needs to guarantee that its bounds are valid
          //OHTWO TODO: We'll probably remove this if we go with the "safe bounds" approach https://github.com/phetsims/scenery/issues/1581
          assert && assert(this.node._rendererSummary.areBoundsValid(), `Node singleCache provided, but not all node contents have valid bounds under ${this.node.constructor.name}`);
          this.isSharedCanvasCachePlaceholder = true;
        }
      } else {
        this.isInstanceCanvasCache = true;
        this.isUnderCanvasCache = true;
        this.groupRenderer = this.isWebGLSupported ? Renderer.bitmaskWebGL : Renderer.bitmaskCanvas;
      }
    }
    if (this.node.isPainted()) {
      if (this.isUnderCanvasCache) {
        this.selfRenderer = Renderer.bitmaskCanvas;
      } else {
        let supportedNodeBitmask = this.node._rendererBitmask;
        if (!this.isWebGLSupported) {
          const invalidBitmasks = Renderer.bitmaskWebGL;
          supportedNodeBitmask = supportedNodeBitmask ^ supportedNodeBitmask & invalidBitmasks;
        }

        // use the preferred rendering order if specified, otherwise use the default
        this.selfRenderer = supportedNodeBitmask & Renderer.bitmaskOrder(this.preferredRenderers, 0) || supportedNodeBitmask & Renderer.bitmaskOrder(this.preferredRenderers, 1) || supportedNodeBitmask & Renderer.bitmaskOrder(this.preferredRenderers, 2) || supportedNodeBitmask & Renderer.bitmaskOrder(this.preferredRenderers, 3) || supportedNodeBitmask & Renderer.bitmaskSVG || supportedNodeBitmask & Renderer.bitmaskCanvas || supportedNodeBitmask & Renderer.bitmaskDOM || supportedNodeBitmask & Renderer.bitmaskWebGL || 0;
        assert && assert(this.selfRenderer, 'setSelfRenderer failure?');
      }
    }

    // whether we need to force rebuilding the group drawable
    this.groupChanged = wasBackbone !== this.isBackbone || wasInstanceCanvasCache !== this.isInstanceCanvasCache || wasSharedCanvasCacheSelf !== this.isSharedCanvasCacheSelf;

    // whether any of our render state changes can change descendant render states
    this.cascadingStateChange = wasUnderCanvasCache !== this.isUnderCanvasCache || oldPreferredRenderers !== this.preferredRenderers;

    /*
     * Whether we can just update the state on an Instance when changing from this state => otherState.
     * This is generally not possible if there is a change in whether the instance should be a transform root
     * (e.g. backbone/single-cache), so we will have to recreate the instance and its subtree if that is the case.
     *
     * Only relevant if we were previously stateful, so it can be ignored if this is our first updateRenderingState()
     */
    this.incompatibleStateChange = this.isTransformed !== wasTransformed || this.isSharedCanvasCachePlaceholder !== wasSharedCanvasCachePlaceholder;

    // whether there was any render state change
    this.anyStateChange = this.groupChanged || this.cascadingStateChange || this.incompatibleStateChange || oldSelfRenderer !== this.selfRenderer || oldGroupRenderer !== this.groupRenderer || oldSharedCacheRenderer !== this.sharedCacheRenderer;

    // if our visibility applications changed, update the entire subtree
    if (wasVisibilityApplied !== this.isVisibilityApplied) {
      this.visibilityDirty = true;
      this.parent && this.parent.markChildVisibilityDirty();
    }

    // If our fittability has changed, propagate those changes. (It's generally a hint change which will trigger an
    // update of rendering state).
    this.fittability.checkSelfFittability();
    sceneryLog && sceneryLog.Instance && sceneryLog.Instance(`new: ${this.getStateString()}`);
    sceneryLog && sceneryLog.Instance && sceneryLog.pop();
  }

  /**
   * A short string that contains a summary of the rendering state, for debugging/logging purposes.
   * @public
   *
   * @returns {string}
   */
  getStateString() {
    const result = `S[ ${this.isDisplayRoot ? 'displayRoot ' : ''}${this.isBackbone ? 'backbone ' : ''}${this.isInstanceCanvasCache ? 'instanceCache ' : ''}${this.isSharedCanvasCachePlaceholder ? 'sharedCachePlaceholder ' : ''}${this.isSharedCanvasCacheSelf ? 'sharedCacheSelf ' : ''}${this.isTransformed ? 'TR ' : ''}${this.isVisibilityApplied ? 'VIS ' : ''}${this.selfRenderer ? this.selfRenderer.toString(16) : '-'},${this.groupRenderer ? this.groupRenderer.toString(16) : '-'},${this.sharedCacheRenderer ? this.sharedCacheRenderer.toString(16) : '-'} `;
    return `${result}]`;
  }

  /**
   * The main entry point for syncTree(), called on the root instance. See syncTree() for more information.
   * @public
   */
  baseSyncTree() {
    assert && assert(this.isDisplayRoot, 'baseSyncTree() should only be called on the root instance');
    sceneryLog && sceneryLog.Instance && sceneryLog.Instance(`-------- START baseSyncTree ${this.toString()} --------`);
    this.syncTree();
    sceneryLog && sceneryLog.Instance && sceneryLog.Instance(`-------- END baseSyncTree ${this.toString()} --------`);
    this.cleanSyncTreeResults();
  }

  /**
   * Updates the rendering state, synchronizes the instance sub-tree (so that our instance tree matches
   * the Node tree the client provided), and back-propagates {ChangeInterval} information for stitching backbones
   * and/or caches.
   * @private
   *
   * syncTree() also sets a number of pseudo 'return values' (documented in cleanSyncTreeResults()). After calling
   * syncTree() and optionally reading those results, cleanSyncTreeResults() should be called on the same instance
   * in order to prevent memory leaks.
   *
   * @returns {boolean} - Whether the sync was possible. If it wasn't, a new instance subtree will need to be created.
   */
  syncTree() {
    sceneryLog && sceneryLog.Instance && sceneryLog.Instance(`syncTree ${this.toString()} ${this.getStateString()}${this.stateless ? ' (stateless)' : ''}`);
    sceneryLog && sceneryLog.Instance && sceneryLog.push();
    if (sceneryLog && scenery.isLoggingPerformance()) {
      this.display.perfSyncTreeCount++;
    }

    // may access isTransformed up to root to determine relative trails
    assert && assert(!this.parent || !this.parent.stateless, 'We should not have a stateless parent instance');
    const wasStateless = this.stateless;
    if (wasStateless || this.parent && this.parent.cascadingStateChange ||
    // if our parent had cascading state changes, we need to recompute
    this.renderStateDirtyFrame === this.display._frameId) {
      // if our render state is dirty
      this.updateRenderingState();
    } else {
      // we can check whether updating state would have made any changes when we skip it (for slow assertions)
      if (assertSlow) {
        this.updateRenderingState();
        assertSlow(!this.anyStateChange);
      }
    }
    if (!wasStateless && this.incompatibleStateChange) {
      sceneryLog && sceneryLog.Instance && sceneryLog.Instance(`incompatible instance ${this.toString()} ${this.getStateString()}, aborting`);
      sceneryLog && sceneryLog.Instance && sceneryLog.pop();

      // The false return will signal that a new instance needs to be used. our tree will be disposed soon.
      return false;
    }
    this.stateless = false;

    // no need to overwrite, should always be the same
    assert && assert(!wasStateless || this.children.length === 0, 'We should not have child instances on an instance without state');
    if (wasStateless) {
      // If we are a transform root, notify the display that we are dirty. We'll be validated when it's at that phase
      // at the next updateDisplay().
      if (this.isTransformed) {
        this.display.markTransformRootDirty(this, true);
      }
      this.attachNodeListeners();
    }

    // TODO: pruning of shared caches https://github.com/phetsims/scenery/issues/1581
    if (this.isSharedCanvasCachePlaceholder) {
      this.sharedSyncTree();
    }
    // pruning so that if no changes would affect a subtree it is skipped
    else if (wasStateless || this.skipPruningFrame === this.display._frameId || this.anyStateChange) {
      // mark fully-removed instances for disposal, and initialize child instances if we were stateless
      this.prepareChildInstances(wasStateless);
      const oldFirstDrawable = this.firstDrawable;
      const oldLastDrawable = this.lastDrawable;
      const oldFirstInnerDrawable = this.firstInnerDrawable;
      const oldLastInnerDrawable = this.lastInnerDrawable;
      const selfChanged = this.updateSelfDrawable();

      // Synchronizes our children and self, with the drawables and change intervals of both combined
      this.localSyncTree(selfChanged);
      if (assertSlow) {
        // before and after first/last drawables (inside any potential group drawable)
        this.auditChangeIntervals(oldFirstInnerDrawable, oldLastInnerDrawable, this.firstInnerDrawable, this.lastInnerDrawable);
      }

      // If we use a group drawable (backbone, etc.), we'll collapse our drawables and change intervals to reference
      // the group drawable (as applicable).
      this.groupSyncTree(wasStateless);
      if (assertSlow) {
        // before and after first/last drawables (outside of any potential group drawable)
        this.auditChangeIntervals(oldFirstDrawable, oldLastDrawable, this.firstDrawable, this.lastDrawable);
      }
    } else {
      // our sub-tree was not visited, since there were no relevant changes to it (that need instance synchronization
      // or drawable changes)
      sceneryLog && sceneryLog.Instance && sceneryLog.Instance('pruned');
    }
    sceneryLog && sceneryLog.Instance && sceneryLog.pop();
    return true;
  }

  /**
   * Responsible for syncing children, connecting the drawable linked list as needed, and outputting change intervals
   * and first/last drawable information.
   * @private
   *
   * @param {boolean} selfChanged
   */
  localSyncTree(selfChanged) {
    const frameId = this.display._frameId;

    // local variables, since we can't overwrite our instance properties yet
    let firstDrawable = this.selfDrawable; // possibly null
    let currentDrawable = firstDrawable; // possibly null

    assert && assert(this.firstChangeInterval === null && this.lastChangeInterval === null, 'sanity checks that cleanSyncTreeResults were called');
    let firstChangeInterval = null;
    if (selfChanged) {
      sceneryLog && sceneryLog.ChangeInterval && sceneryLog.ChangeInterval('self');
      sceneryLog && sceneryLog.ChangeInterval && sceneryLog.push();
      firstChangeInterval = ChangeInterval.newForDisplay(null, null, this.display);
      sceneryLog && sceneryLog.ChangeInterval && sceneryLog.pop();
    }
    let currentChangeInterval = firstChangeInterval;
    let lastUnchangedDrawable = selfChanged ? null : this.selfDrawable; // possibly null

    for (let i = 0; i < this.children.length; i++) {
      let childInstance = this.children[i];
      const isCompatible = childInstance.syncTree();
      if (!isCompatible) {
        childInstance = this.updateIncompatibleChildInstance(childInstance, i);
        childInstance.syncTree();
      }
      const includeChildDrawables = childInstance.shouldIncludeInParentDrawables();

      //OHTWO TODO: only strip out invisible Canvas drawables, while leaving SVG (since we can more efficiently hide https://github.com/phetsims/scenery/issues/1581
      // SVG trees, memory-wise)
      // here we strip out invisible drawable sections out of the drawable linked list
      if (includeChildDrawables) {
        // if there are any drawables for that child, link them up in our linked list
        if (childInstance.firstDrawable) {
          if (currentDrawable) {
            // there is already an end of the linked list, so just append to it
            Drawable.connectDrawables(currentDrawable, childInstance.firstDrawable, this.display);
          } else {
            // start out the linked list
            firstDrawable = childInstance.firstDrawable;
          }
          // update the last drawable of the linked list
          currentDrawable = childInstance.lastDrawable;
        }
      }

      /*---------------------------------------------------------------------------*
       * Change intervals
       *----------------------------------------------------------------------------*/

      sceneryLog && sceneryLog.ChangeInterval && sceneryLog.ChangeInterval(`changes for ${childInstance.toString()} in ${this.toString()}`);
      sceneryLog && sceneryLog.ChangeInterval && sceneryLog.push();
      const wasIncluded = childInstance.stitchChangeIncluded;
      const isIncluded = includeChildDrawables;
      childInstance.stitchChangeIncluded = isIncluded;
      sceneryLog && sceneryLog.ChangeInterval && sceneryLog.ChangeInterval(`included: ${wasIncluded} => ${isIncluded}`);

      // check for forcing full change-interval on child
      if (childInstance.stitchChangeFrame === frameId) {
        sceneryLog && sceneryLog.ChangeInterval && sceneryLog.ChangeInterval('stitchChangeFrame full change interval');
        sceneryLog && sceneryLog.ChangeInterval && sceneryLog.push();

        // e.g. it was added, moved, or had visibility changes. requires full change interval
        childInstance.firstChangeInterval = childInstance.lastChangeInterval = ChangeInterval.newForDisplay(null, null, this.display);
        sceneryLog && sceneryLog.ChangeInterval && sceneryLog.pop();
      } else {
        assert && assert(wasIncluded === isIncluded, 'If we do not have stitchChangeFrame activated, our inclusion should not have changed');
      }
      const firstChildChangeInterval = childInstance.firstChangeInterval;
      let isBeforeOpen = currentChangeInterval && currentChangeInterval.drawableAfter === null;
      const isAfterOpen = firstChildChangeInterval && firstChildChangeInterval.drawableBefore === null;
      const needsBridge = childInstance.stitchChangeBefore === frameId && !isBeforeOpen && !isAfterOpen;

      // We need to insert an additional change interval (bridge) when we notice a link in the drawable linked list
      // where there were nodes that needed stitch changes that aren't still children, or were moved. We create a
      // "bridge" change interval to span the gap where nodes were removed.
      if (needsBridge) {
        sceneryLog && sceneryLog.ChangeInterval && sceneryLog.ChangeInterval('bridge');
        sceneryLog && sceneryLog.ChangeInterval && sceneryLog.push();
        const bridge = ChangeInterval.newForDisplay(lastUnchangedDrawable, null, this.display);
        if (currentChangeInterval) {
          currentChangeInterval.nextChangeInterval = bridge;
        }
        currentChangeInterval = bridge;
        firstChangeInterval = firstChangeInterval || currentChangeInterval; // store if it is the first
        isBeforeOpen = true;
        sceneryLog && sceneryLog.ChangeInterval && sceneryLog.pop();
      }

      // Exclude child instances that are now (and were before) not included. NOTE: We still need to include those in
      // bridge calculations, since a removed (before-included) instance could be between two still-invisible
      // instances.
      if (wasIncluded || isIncluded) {
        if (isBeforeOpen) {
          // we want to try to glue our last ChangeInterval up
          if (firstChildChangeInterval) {
            if (firstChildChangeInterval.drawableBefore === null) {
              // we want to glue from both sides

              // basically have our current change interval replace the child's first change interval
              currentChangeInterval.drawableAfter = firstChildChangeInterval.drawableAfter;
              currentChangeInterval.nextChangeInterval = firstChildChangeInterval.nextChangeInterval;
              currentChangeInterval = childInstance.lastChangeInterval === firstChildChangeInterval ? currentChangeInterval :
              // since we are replacing, don't give an origin reference
              childInstance.lastChangeInterval;
            } else {
              // only a desire to glue from before
              currentChangeInterval.drawableAfter = childInstance.firstDrawable; // either null or the correct drawable
              currentChangeInterval.nextChangeInterval = firstChildChangeInterval;
              currentChangeInterval = childInstance.lastChangeInterval;
            }
          } else {
            // no changes to the child. grabs the first drawable reference it can
            currentChangeInterval.drawableAfter = childInstance.firstDrawable; // either null or the correct drawable
          }
        } else if (firstChildChangeInterval) {
          firstChangeInterval = firstChangeInterval || firstChildChangeInterval; // store if it is the first
          if (firstChildChangeInterval.drawableBefore === null) {
            assert && assert(!currentChangeInterval || lastUnchangedDrawable, 'If we have a current change interval, we should be guaranteed a non-null ' + 'lastUnchangedDrawable');
            firstChildChangeInterval.drawableBefore = lastUnchangedDrawable; // either null or the correct drawable
          }
          if (currentChangeInterval) {
            currentChangeInterval.nextChangeInterval = firstChildChangeInterval;
          }
          currentChangeInterval = childInstance.lastChangeInterval;
        }
        lastUnchangedDrawable = currentChangeInterval && currentChangeInterval.drawableAfter === null ? null : childInstance.lastDrawable ? childInstance.lastDrawable : lastUnchangedDrawable;
      }

      // if the last instance, check for post-bridge
      if (i === this.children.length - 1) {
        if (childInstance.stitchChangeAfter === frameId && !(currentChangeInterval && currentChangeInterval.drawableAfter === null)) {
          const endingBridge = ChangeInterval.newForDisplay(lastUnchangedDrawable, null, this.display);
          if (currentChangeInterval) {
            currentChangeInterval.nextChangeInterval = endingBridge;
          }
          currentChangeInterval = endingBridge;
          firstChangeInterval = firstChangeInterval || currentChangeInterval; // store if it is the first
        }
      }

      // clean up the metadata on our child (can't be done in the child call, since we use these values like a
      // composite return value)
      //OHTWO TODO: only do this on instances that were actually traversed https://github.com/phetsims/scenery/issues/1581
      childInstance.cleanSyncTreeResults();
      sceneryLog && sceneryLog.ChangeInterval && sceneryLog.pop();
    }

    // it's really the easiest way to compare if two things (casted to booleans) are the same?
    assert && assert(!!firstChangeInterval === !!currentChangeInterval, 'Presence of first and current change intervals should be equal');

    // Check to see if we are emptied and marked as changed (but without change intervals). This should imply we have
    // no children (and thus no stitchChangeBefore / stitchChangeAfter to use), so we'll want to create a change
    // interval to cover our entire range.
    if (!firstChangeInterval && this.stitchChangeOnChildren === this.display._frameId && this.children.length === 0) {
      firstChangeInterval = currentChangeInterval = ChangeInterval.newForDisplay(null, null, this.display);
    }

    // store our results
    // NOTE: these may get overwritten with the group change intervals (in that case, groupSyncTree will read from these)
    this.firstChangeInterval = firstChangeInterval;
    this.lastChangeInterval = currentChangeInterval;

    // NOTE: these may get overwritten with the group drawable (in that case, groupSyncTree will read from these)
    this.firstDrawable = this.firstInnerDrawable = firstDrawable;
    this.lastDrawable = this.lastInnerDrawable = currentDrawable; // either null, or the drawable itself

    // ensure that our firstDrawable and lastDrawable are correct
    if (assertSlow) {
      let firstDrawableCheck = null;
      for (let j = 0; j < this.children.length; j++) {
        if (this.children[j].shouldIncludeInParentDrawables() && this.children[j].firstDrawable) {
          firstDrawableCheck = this.children[j].firstDrawable;
          break;
        }
      }
      if (this.selfDrawable) {
        firstDrawableCheck = this.selfDrawable;
      }
      let lastDrawableCheck = this.selfDrawable;
      for (let k = this.children.length - 1; k >= 0; k--) {
        if (this.children[k].shouldIncludeInParentDrawables() && this.children[k].lastDrawable) {
          lastDrawableCheck = this.children[k].lastDrawable;
          break;
        }
      }
      assertSlow(firstDrawableCheck === this.firstDrawable);
      assertSlow(lastDrawableCheck === this.lastDrawable);
    }
  }

  /**
   * If necessary, create/replace/remove our selfDrawable.
   * @private
   *
   * @returns whether the selfDrawable changed
   */
  updateSelfDrawable() {
    if (this.node.isPainted()) {
      const selfRenderer = this.selfRenderer; // our new self renderer bitmask

      // bitwise trick, since only one of Canvas/SVG/DOM/WebGL/etc. flags will be chosen, and bitmaskRendererArea is
      // the mask for those flags. In English, "Is the current selfDrawable compatible with our selfRenderer (if any),
      // or do we need to create a selfDrawable?"
      //OHTWO TODO: For Canvas, we won't care about anything else for the drawable, but for DOM we care about the https://github.com/phetsims/scenery/issues/1581
      // force-acceleration flag! That's stripped out here.
      if (!this.selfDrawable || (this.selfDrawable.renderer & selfRenderer & Renderer.bitmaskRendererArea) === 0) {
        if (this.selfDrawable) {
          sceneryLog && sceneryLog.Instance && sceneryLog.Instance(`replacing old drawable ${this.selfDrawable.toString()} with new renderer`);

          // scrap the previous selfDrawable, we need to create one with a different renderer.
          this.selfDrawable.markForDisposal(this.display);
        }
        this.selfDrawable = Renderer.createSelfDrawable(this, this.node, selfRenderer, this.fittability.ancestorsFittable);
        assert && assert(this.selfDrawable);
        return true;
      }
    } else {
      assert && assert(this.selfDrawable === null, 'Non-painted nodes should not have a selfDrawable');
    }
    return false;
  }

  /**
   * Returns the up-to-date instance.
   * @private
   *
   * @param {Instance} childInstance
   * @param {number} index
   * @returns {Instance}
   */
  updateIncompatibleChildInstance(childInstance, index) {
    if (sceneryLog && scenery.isLoggingPerformance()) {
      const affectedInstanceCount = childInstance.getDescendantCount() + 1; // +1 for itself

      if (affectedInstanceCount > 100) {
        sceneryLog.PerfCritical && sceneryLog.PerfCritical(`incompatible instance rebuild at ${this.trail.toPathString()}: ${affectedInstanceCount}`);
      } else if (affectedInstanceCount > 40) {
        sceneryLog.PerfMajor && sceneryLog.PerfMajor(`incompatible instance rebuild at ${this.trail.toPathString()}: ${affectedInstanceCount}`);
      } else if (affectedInstanceCount > 0) {
        sceneryLog.PerfMinor && sceneryLog.PerfMinor(`incompatible instance rebuild at ${this.trail.toPathString()}: ${affectedInstanceCount}`);
      }
    }

    // mark it for disposal
    this.display.markInstanceRootForDisposal(childInstance);

    // swap in a new instance
    const replacementInstance = Instance.createFromPool(this.display, this.trail.copy().addDescendant(childInstance.node, index), false, false);
    this.replaceInstanceWithIndex(childInstance, replacementInstance, index);
    return replacementInstance;
  }

  /**
   * @private
   *
   * @param {boolean} wasStateless
   */
  groupSyncTree(wasStateless) {
    const groupRenderer = this.groupRenderer;
    assert && assert((this.isBackbone ? 1 : 0) + (this.isInstanceCanvasCache ? 1 : 0) + (this.isSharedCanvasCacheSelf ? 1 : 0) === (groupRenderer ? 1 : 0), 'We should have precisely one of these flags set for us to have a groupRenderer');

    // if we switched to/away from a group, our group type changed, or our group renderer changed
    const groupChanged = !!groupRenderer !== !!this.groupDrawable || !wasStateless && this.groupChanged || this.groupDrawable && this.groupDrawable.renderer !== groupRenderer;

    // if there is a change, prepare
    if (groupChanged) {
      if (this.groupDrawable) {
        sceneryLog && sceneryLog.Instance && sceneryLog.Instance(`replacing group drawable ${this.groupDrawable.toString()}`);
        this.groupDrawable.markForDisposal(this.display);
        this.groupDrawable = null;
      }

      // change everything, since we may need a full restitch
      this.firstChangeInterval = this.lastChangeInterval = ChangeInterval.newForDisplay(null, null, this.display);
    }
    if (groupRenderer) {
      // ensure our linked list is fully disconnected from others
      this.firstDrawable && Drawable.disconnectBefore(this.firstDrawable, this.display);
      this.lastDrawable && Drawable.disconnectAfter(this.lastDrawable, this.display);
      if (this.isBackbone) {
        if (groupChanged) {
          this.groupDrawable = BackboneDrawable.createFromPool(this.display, this, this.getTransformRootInstance(), groupRenderer, this.isDisplayRoot);
          if (this.isTransformed) {
            this.display.markTransformRootDirty(this, true);
          }
        }
        if (this.firstChangeInterval) {
          this.groupDrawable.stitch(this.firstDrawable, this.lastDrawable, this.firstChangeInterval, this.lastChangeInterval);
        }
      } else if (this.isInstanceCanvasCache) {
        if (groupChanged) {
          this.groupDrawable = InlineCanvasCacheDrawable.createFromPool(groupRenderer, this);
        }
        if (this.firstChangeInterval) {
          this.groupDrawable.stitch(this.firstDrawable, this.lastDrawable, this.firstChangeInterval, this.lastChangeInterval);
        }
      } else if (this.isSharedCanvasCacheSelf) {
        if (groupChanged) {
          this.groupDrawable = CanvasBlock.createFromPool(groupRenderer, this);
        }
        //OHTWO TODO: restitch here??? implement it https://github.com/phetsims/scenery/issues/1581
      }
      // Update the fittable flag
      this.groupDrawable.setFittable(this.fittability.ancestorsFittable);
      this.firstDrawable = this.lastDrawable = this.groupDrawable;
    }

    // change interval handling
    if (groupChanged) {
      // if our group status changed, mark EVERYTHING as potentially changed
      this.firstChangeInterval = this.lastChangeInterval = ChangeInterval.newForDisplay(null, null, this.display);
    } else if (groupRenderer) {
      // our group didn't have to change at all, so we prevent any change intervals
      this.firstChangeInterval = this.lastChangeInterval = null;
    }
  }

  /**
   * @private
   */
  sharedSyncTree() {
    //OHTWO TODO: we are probably missing syncTree for shared trees properly with pruning. investigate!! https://github.com/phetsims/scenery/issues/1581

    this.ensureSharedCacheInitialized();
    const sharedCacheRenderer = this.sharedCacheRenderer;
    if (!this.sharedCacheDrawable || this.sharedCacheDrawable.renderer !== sharedCacheRenderer) {
      //OHTWO TODO: mark everything as changed (big change interval) https://github.com/phetsims/scenery/issues/1581

      if (this.sharedCacheDrawable) {
        sceneryLog && sceneryLog.Instance && sceneryLog.Instance(`replacing shared cache drawable ${this.sharedCacheDrawable.toString()}`);
        this.sharedCacheDrawable.markForDisposal(this.display);
      }

      //OHTWO TODO: actually create the proper shared cache drawable depending on the specified renderer https://github.com/phetsims/scenery/issues/1581
      // (update it if necessary)
      this.sharedCacheDrawable = new SharedCanvasCacheDrawable(this.trail, sharedCacheRenderer, this, this.sharedCacheInstance);
      this.firstDrawable = this.sharedCacheDrawable;
      this.lastDrawable = this.sharedCacheDrawable;

      // basically everything changed now, and won't from now on
      this.firstChangeInterval = this.lastChangeInterval = ChangeInterval.newForDisplay(null, null, this.display);
    }
  }

  /**
   * @private
   *
   * @param {boolean} wasStateless
   */
  prepareChildInstances(wasStateless) {
    // mark all removed instances to be disposed (along with their subtrees)
    while (this.instanceRemovalCheckList.length) {
      const instanceToMark = this.instanceRemovalCheckList.pop();
      if (instanceToMark.addRemoveCounter === -1) {
        instanceToMark.addRemoveCounter = 0; // reset it, so we don't mark it for disposal more than once
        this.display.markInstanceRootForDisposal(instanceToMark);
      }
    }
    if (wasStateless) {
      // we need to create all of the child instances
      for (let k = 0; k < this.node.children.length; k++) {
        // create a child instance
        const child = this.node.children[k];
        this.appendInstance(Instance.createFromPool(this.display, this.trail.copy().addDescendant(child, k), false, false));
      }
    }
  }

  /**
   * @private
   */
  ensureSharedCacheInitialized() {
    // we only need to initialize this shared cache reference once
    if (!this.sharedCacheInstance) {
      const instanceKey = this.node.getId();
      // TODO: have this abstracted away in the Display? https://github.com/phetsims/scenery/issues/1581
      this.sharedCacheInstance = this.display._sharedCanvasInstances[instanceKey];

      // TODO: increment reference counting? https://github.com/phetsims/scenery/issues/1581
      if (!this.sharedCacheInstance) {
        this.sharedCacheInstance = Instance.createFromPool(this.display, new Trail(this.node), false, true);
        this.sharedCacheInstance.syncTree();
        this.display._sharedCanvasInstances[instanceKey] = this.sharedCacheInstance;
        // TODO: reference counting? https://github.com/phetsims/scenery/issues/1581

        // TODO: this.sharedCacheInstance.isTransformed? https://github.com/phetsims/scenery/issues/1581

        //OHTWO TODO: is this necessary? https://github.com/phetsims/scenery/issues/1581
        this.display.markTransformRootDirty(this.sharedCacheInstance, true);
      }
      this.sharedCacheInstance.externalReferenceCount++;

      //OHTWO TODO: is this necessary? https://github.com/phetsims/scenery/issues/1581
      if (this.isTransformed) {
        this.display.markTransformRootDirty(this, true);
      }
    }
  }

  /**
   * Whether out drawables (from firstDrawable to lastDrawable) should be included in our parent's drawables
   * @private
   *
   * @returns {boolean}
   */
  shouldIncludeInParentDrawables() {
    return this.node.isVisible() || !this.node.isExcludeInvisible();
  }

  /**
   * Finds the closest drawable (not including the child instance at childIndex) using lastDrawable, or null
   * @private
   *
   * TODO: check usage? https://github.com/phetsims/scenery/issues/1581
   *
   * @param {number} childIndex
   * @returns {Drawable|null}
   */
  findPreviousDrawable(childIndex) {
    for (let i = childIndex - 1; i >= 0; i--) {
      const option = this.children[i].lastDrawable;
      if (option !== null) {
        return option;
      }
    }
    return null;
  }

  /**
   * Finds the closest drawable (not including the child instance at childIndex) using nextDrawable, or null
   * @private
   *
   * TODO: check usage? https://github.com/phetsims/scenery/issues/1581
   *
   * @param {number} childIndex
   * @returns {Drawable|null}
   */
  findNextDrawable(childIndex) {
    const len = this.children.length;
    for (let i = childIndex + 1; i < len; i++) {
      const option = this.children[i].firstDrawable;
      if (option !== null) {
        return option;
      }
    }
    return null;
  }

  /*---------------------------------------------------------------------------*
   * Children handling
   *----------------------------------------------------------------------------*/

  /**
   * @private
   *
   * @param {Instance} instance
   */
  appendInstance(instance) {
    this.insertInstance(instance, this.children.length);
  }

  /**
   * @private
   *
   * NOTE: different parameter order compared to Node
   *
   * @param {Instance} instance
   * @param {number} index
   */
  insertInstance(instance, index) {
    assert && assert(instance instanceof Instance);
    assert && assert(index >= 0 && index <= this.children.length, `Instance insertion bounds check for index ${index} with previous children length ${this.children.length}`);
    sceneryLog && sceneryLog.InstanceTree && sceneryLog.InstanceTree(`inserting ${instance.toString()} into ${this.toString()}`);
    sceneryLog && sceneryLog.InstanceTree && sceneryLog.push();

    // mark it as changed during this frame, so that we can properly set the change interval
    instance.stitchChangeFrame = this.display._frameId;
    this.stitchChangeOnChildren = this.display._frameId;
    this.children.splice(index, 0, instance);
    instance.parent = this;
    instance.oldParent = this;

    // maintain our stitch-change interval
    if (index <= this.beforeStableIndex) {
      this.beforeStableIndex = index - 1;
    }
    if (index > this.afterStableIndex) {
      this.afterStableIndex = index + 1;
    } else {
      this.afterStableIndex++;
    }

    // maintain fittable flags
    this.fittability.onInsert(instance.fittability);
    this.relativeTransform.addInstance(instance);
    this.markChildVisibilityDirty();
    sceneryLog && sceneryLog.InstanceTree && sceneryLog.pop();
  }

  /**
   * @private
   *
   * @param {Instance} instance
   */
  removeInstance(instance) {
    this.removeInstanceWithIndex(instance, _.indexOf(this.children, instance));
  }

  /**
   * @private
   *
   * @param {Instance} instance
   * @param {number} index
   */
  removeInstanceWithIndex(instance, index) {
    assert && assert(instance instanceof Instance);
    assert && assert(index >= 0 && index < this.children.length, `Instance removal bounds check for index ${index} with previous children length ${this.children.length}`);
    sceneryLog && sceneryLog.InstanceTree && sceneryLog.InstanceTree(`removing ${instance.toString()} from ${this.toString()}`);
    sceneryLog && sceneryLog.InstanceTree && sceneryLog.push();
    const frameId = this.display._frameId;

    // mark it as changed during this frame, so that we can properly set the change interval
    instance.stitchChangeFrame = frameId;
    this.stitchChangeOnChildren = frameId;

    // mark neighbors so that we can add a change interval for our removal area
    if (index - 1 >= 0) {
      this.children[index - 1].stitchChangeAfter = frameId;
    }
    if (index + 1 < this.children.length) {
      this.children[index + 1].stitchChangeBefore = frameId;
    }
    this.children.splice(index, 1); // TODO: replace with a 'remove' function call https://github.com/phetsims/scenery/issues/1581
    instance.parent = null;
    instance.oldParent = this;

    // maintain our stitch-change interval
    if (index <= this.beforeStableIndex) {
      this.beforeStableIndex = index - 1;
    }
    if (index >= this.afterStableIndex) {
      this.afterStableIndex = index;
    } else {
      this.afterStableIndex--;
    }

    // maintain fittable flags
    this.fittability.onRemove(instance.fittability);
    this.relativeTransform.removeInstance(instance);
    sceneryLog && sceneryLog.InstanceTree && sceneryLog.pop();
  }

  /**
   * @private
   *
   * @param {Instance} childInstance
   * @param {Instance} replacementInstance
   * @param {number} index
   */
  replaceInstanceWithIndex(childInstance, replacementInstance, index) {
    // TODO: optimization? hopefully it won't happen often, so we just do this for now https://github.com/phetsims/scenery/issues/1581
    this.removeInstanceWithIndex(childInstance, index);
    this.insertInstance(replacementInstance, index);
  }

  /**
   * For handling potential reordering of child instances inclusively between the min and max indices.
   * @private
   *
   * @param {number} minChangeIndex
   * @param {number} maxChangeIndex
   */
  reorderInstances(minChangeIndex, maxChangeIndex) {
    assert && assert(typeof minChangeIndex === 'number');
    assert && assert(typeof maxChangeIndex === 'number');
    assert && assert(minChangeIndex <= maxChangeIndex);
    sceneryLog && sceneryLog.InstanceTree && sceneryLog.InstanceTree(`Reordering ${this.toString()}`);
    sceneryLog && sceneryLog.InstanceTree && sceneryLog.push();

    // NOTE: For implementation, we've basically set parameters as if we removed all of the relevant instances and
    // then added them back in. There may be more efficient ways to do this, but the stitching and change interval
    // process is a bit complicated right now.

    const frameId = this.display._frameId;

    // Remove the old ordering of instances
    this.children.splice(minChangeIndex, maxChangeIndex - minChangeIndex + 1);

    // Add the instances back in the correct order
    for (let i = minChangeIndex; i <= maxChangeIndex; i++) {
      const child = this.findChildInstanceOnNode(this.node._children[i]);
      this.children.splice(i, 0, child);
      child.stitchChangeFrame = frameId;

      // mark neighbors so that we can add a change interval for our change area
      if (i > minChangeIndex) {
        child.stitchChangeAfter = frameId;
      }
      if (i < maxChangeIndex) {
        child.stitchChangeBefore = frameId;
      }
    }
    this.stitchChangeOnChildren = frameId;
    this.beforeStableIndex = Math.min(this.beforeStableIndex, minChangeIndex - 1);
    this.afterStableIndex = Math.max(this.afterStableIndex, maxChangeIndex + 1);
    sceneryLog && sceneryLog.InstanceTree && sceneryLog.pop();
  }

  /**
   * If we have a child instance that corresponds to this node, return it (otherwise null).
   * @private
   *
   * @param {Node} node
   * @returns {Instance|null}
   */
  findChildInstanceOnNode(node) {
    const instances = node.getInstances();
    for (let i = 0; i < instances.length; i++) {
      if (instances[i].oldParent === this) {
        return instances[i];
      }
    }
    return null;
  }

  /**
   * Event callback for Node's 'childInserted' event, used to track children.
   * @private
   *
   * @param {Node} childNode
   * @param {number} index
   */
  onChildInserted(childNode, index) {
    sceneryLog && sceneryLog.Instance && sceneryLog.Instance(`inserting child node ${childNode.constructor.name}#${childNode.id} into ${this.toString()}`);
    sceneryLog && sceneryLog.Instance && sceneryLog.push();
    assert && assert(!this.stateless, 'If we are stateless, we should not receive these notifications');
    let instance = this.findChildInstanceOnNode(childNode);
    if (instance) {
      sceneryLog && sceneryLog.Instance && sceneryLog.Instance('instance already exists');
      // it must have been added back. increment its counter
      instance.addRemoveCounter += 1;
      assert && assert(instance.addRemoveCounter === 0);
    } else {
      sceneryLog && sceneryLog.Instance && sceneryLog.Instance('creating stub instance');
      sceneryLog && sceneryLog.Instance && sceneryLog.push();
      instance = Instance.createFromPool(this.display, this.trail.copy().addDescendant(childNode, index), false, false);
      sceneryLog && sceneryLog.Instance && sceneryLog.pop();
    }
    this.insertInstance(instance, index);

    // make sure we are visited for syncTree()
    this.markSkipPruning();
    sceneryLog && sceneryLog.Instance && sceneryLog.pop();
  }

  /**
   * Event callback for Node's 'childRemoved' event, used to track children.
   * @private
   *
   * @param {Node} childNode
   * @param {number} index
   */
  onChildRemoved(childNode, index) {
    sceneryLog && sceneryLog.Instance && sceneryLog.Instance(`removing child node ${childNode.constructor.name}#${childNode.id} from ${this.toString()}`);
    sceneryLog && sceneryLog.Instance && sceneryLog.push();
    assert && assert(!this.stateless, 'If we are stateless, we should not receive these notifications');
    assert && assert(this.children[index].node === childNode, 'Ensure that our instance matches up');
    const instance = this.findChildInstanceOnNode(childNode);
    assert && assert(instance !== null, 'We should always have a reference to a removed instance');
    instance.addRemoveCounter -= 1;
    assert && assert(instance.addRemoveCounter === -1);

    // track the removed instance here. if it doesn't get added back, this will be the only reference we have (we'll
    // need to dispose it)
    this.instanceRemovalCheckList.push(instance);
    this.removeInstanceWithIndex(instance, index);

    // make sure we are visited for syncTree()
    this.markSkipPruning();
    sceneryLog && sceneryLog.Instance && sceneryLog.pop();
  }

  /**
   * Event callback for Node's 'childrenReordered' event
   * @private
   *
   * @param {number} minChangeIndex
   * @param {number} maxChangeIndex
   */
  onChildrenReordered(minChangeIndex, maxChangeIndex) {
    sceneryLog && sceneryLog.Instance && sceneryLog.Instance(`reordering children for ${this.toString()}`);
    sceneryLog && sceneryLog.Instance && sceneryLog.push();
    this.reorderInstances(minChangeIndex, maxChangeIndex);

    // make sure we are visited for syncTree()
    this.markSkipPruning();
    sceneryLog && sceneryLog.Instance && sceneryLog.pop();
  }

  /**
   * Event callback for Node's 'visibility' event, used to notify about stitch changes.
   * @private
   */
  onVisibilityChange() {
    assert && assert(!this.stateless, 'If we are stateless, we should not receive these notifications');

    // for now, just mark which frame we were changed for our change interval
    this.stitchChangeFrame = this.display._frameId;

    // make sure we aren't pruned in the next syncTree()
    this.parent && this.parent.markSkipPruning();

    // mark visibility changes
    this.visibilityDirty = true;
    this.parent && this.parent.markChildVisibilityDirty();
  }

  /**
   * Event callback for Node's 'opacity' change event.
   * @private
   */
  onOpacityChange() {
    assert && assert(!this.stateless, 'If we are stateless, we should not receive these notifications');
    this.markRenderStateDirty();
  }

  /**
   * @private
   */
  markChildVisibilityDirty() {
    if (!this.childVisibilityDirty) {
      this.childVisibilityDirty = true;
      this.parent && this.parent.markChildVisibilityDirty();
    }
  }

  /**
   * Updates the currently fittability for all of the drawables attached to this instance.
   * @public
   *
   * @param {boolean} fittable
   */
  updateDrawableFittability(fittable) {
    this.selfDrawable && this.selfDrawable.setFittable(fittable);
    this.groupDrawable && this.groupDrawable.setFittable(fittable);
    // this.sharedCacheDrawable && this.sharedCacheDrawable.setFittable( fittable );
  }

  /**
   * Updates the visible/relativeVisible flags on the Instance and its entire subtree.
   * @public
   *
   * @param {boolean} parentGloballyVisible - Whether our parent (if any) is globally visible
   * @param {boolean} parentGloballyVoicingVisible - Whether our parent (if any) is globally voicingVisible.
   * @param {boolean} parentRelativelyVisible - Whether our parent (if any) is relatively visible
   * @param {boolean} updateFullSubtree - If true, we will visit the entire subtree to ensure visibility is correct.
   */
  updateVisibility(parentGloballyVisible, parentGloballyVoicingVisible, parentRelativelyVisible, updateFullSubtree) {
    // If our visibility flag for ourself is dirty, we need to update our entire subtree
    if (this.visibilityDirty) {
      updateFullSubtree = true;
    }

    // calculate our visibilities
    const nodeVisible = this.node.isVisible();
    const wasVisible = this.visible;
    const wasRelativeVisible = this.relativeVisible;
    const wasSelfVisible = this.selfVisible;
    const nodeVoicingVisible = this.node.voicingVisibleProperty.value;
    const wasVoicingVisible = this.voicingVisible;
    const couldVoice = wasVisible && wasVoicingVisible;
    this.visible = parentGloballyVisible && nodeVisible;
    this.voicingVisible = parentGloballyVoicingVisible && nodeVoicingVisible;
    this.relativeVisible = parentRelativelyVisible && nodeVisible;
    this.selfVisible = this.isVisibilityApplied ? true : this.relativeVisible;
    const len = this.children.length;
    for (let i = 0; i < len; i++) {
      const child = this.children[i];
      if (updateFullSubtree || child.visibilityDirty || child.childVisibilityDirty) {
        // if we are a visibility root (isVisibilityApplied===true), disregard ancestor visibility
        child.updateVisibility(this.visible, this.voicingVisible, this.isVisibilityApplied ? true : this.relativeVisible, updateFullSubtree);
      }
    }
    this.visibilityDirty = false;
    this.childVisibilityDirty = false;

    // trigger changes after we do the full visibility update
    if (this.visible !== wasVisible) {
      this.visibleEmitter.emit();
    }
    if (this.relativeVisible !== wasRelativeVisible) {
      this.relativeVisibleEmitter.emit();
    }
    if (this.selfVisible !== wasSelfVisible) {
      this.selfVisibleEmitter.emit();
    }

    // An Instance can voice when it is globally visible and voicingVisible. Notify when this state has changed
    // based on these dependencies.
    const canVoice = this.voicingVisible && this.visible;
    if (canVoice !== couldVoice) {
      this.canVoiceEmitter.emit(canVoice);
    }
  }

  /**
   * @private
   *
   * @returns {number}
   */
  getDescendantCount() {
    let count = this.children.length;
    for (let i = 0; i < this.children.length; i++) {
      count += this.children[i].getDescendantCount();
    }
    return count;
  }

  /*---------------------------------------------------------------------------*
   * Miscellaneous
   *----------------------------------------------------------------------------*/

  /**
   * Add a reference for an SVG group (fastest way to track them)
   * @public
   *
   * @param {SVGGroup} group
   */
  addSVGGroup(group) {
    this.svgGroups.push(group);
  }

  /**
   * Remove a reference for an SVG group (fastest way to track them)
   * @public
   *
   * @param {SVGGroup} group
   */
  removeSVGGroup(group) {
    arrayRemove(this.svgGroups, group);
  }

  /**
   * Returns null when a lookup fails (which is legitimate)
   * @public
   *
   * @param {SVGBlock} block
   * @returns {SVGGroup|null}
   */
  lookupSVGGroup(block) {
    const len = this.svgGroups.length;
    for (let i = 0; i < len; i++) {
      const group = this.svgGroups[i];
      if (group.block === block) {
        return group;
      }
    }
    return null;
  }

  /**
   * What instance have filters (opacity/visibility/clip) been applied up to?
   * @public
   *
   * @returns {Instance}
   */
  getFilterRootInstance() {
    if (this.isBackbone || this.isInstanceCanvasCache || !this.parent) {
      return this;
    } else {
      return this.parent.getFilterRootInstance();
    }
  }

  /**
   * What instance transforms have been applied up to?
   * @public
   *
   * @returns {Instance}
   */
  getTransformRootInstance() {
    if (this.isTransformed || !this.parent) {
      return this;
    } else {
      return this.parent.getTransformRootInstance();
    }
  }

  /**
   * @public
   *
   * @returns {Instance}
   */
  getVisibilityRootInstance() {
    if (this.isVisibilityApplied || !this.parent) {
      return this;
    } else {
      return this.parent.getVisibilityRootInstance();
    }
  }

  /**
   * @private
   */
  attachNodeListeners() {
    // attach listeners to our node
    this.relativeTransform.attachNodeListeners();
    if (!this.isSharedCanvasCachePlaceholder) {
      this.node.childInsertedEmitter.addListener(this.childInsertedListener);
      this.node.childRemovedEmitter.addListener(this.childRemovedListener);
      this.node.childrenReorderedEmitter.addListener(this.childrenReorderedListener);
      this.node.visibleProperty.lazyLink(this.visibilityListener);

      // Marks all visibility dirty when voicingVisible changes to cause necessary updates for voicingVisible
      this.node.voicingVisibleProperty.lazyLink(this.visibilityListener);
      this.node.filterChangeEmitter.addListener(this.markRenderStateDirtyListener);
      this.node.clipAreaProperty.lazyLink(this.markRenderStateDirtyListener);
      this.node.instanceRefreshEmitter.addListener(this.markRenderStateDirtyListener);
    }
  }

  /**
   * @private
   */
  detachNodeListeners() {
    this.relativeTransform.detachNodeListeners();
    if (!this.isSharedCanvasCachePlaceholder) {
      this.node.childInsertedEmitter.removeListener(this.childInsertedListener);
      this.node.childRemovedEmitter.removeListener(this.childRemovedListener);
      this.node.childrenReorderedEmitter.removeListener(this.childrenReorderedListener);
      this.node.visibleProperty.unlink(this.visibilityListener);
      this.node.voicingVisibleProperty.unlink(this.visibilityListener);
      this.node.filterChangeEmitter.removeListener(this.markRenderStateDirtyListener);
      this.node.clipAreaProperty.unlink(this.markRenderStateDirtyListener);
      this.node.instanceRefreshEmitter.removeListener(this.markRenderStateDirtyListener);
    }
  }

  /**
   * Ensure that the render state is updated in the next syncTree()
   * @private
   */
  markRenderStateDirty() {
    this.renderStateDirtyFrame = this.display._frameId;

    // ensure we aren't pruned (not set on this instance, since we may not need to visit our children)
    this.parent && this.parent.markSkipPruning();
  }

  /**
   * Ensure that this instance and its children will be visited in the next syncTree()
   * @private
   */
  markSkipPruning() {
    this.skipPruningFrame = this.display._frameId;

    // walk it up to the root
    this.parent && this.parent.markSkipPruning();
  }

  /**
   * @public
   *
   * NOTE: used in CanvasBlock internals, performance-critical.
   *
   * @param {Instance} instance
   * @returns {number}
   */
  getBranchIndexTo(instance) {
    const cachedValue = this.branchIndexMap[instance.id];
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    const branchIndex = this.trail.getBranchIndexTo(instance.trail);
    this.branchIndexMap[instance.id] = branchIndex;
    instance.branchIndexMap[this.id] = branchIndex;
    this.branchIndexReferences.push(instance);
    instance.branchIndexReferences.push(this);
    return branchIndex;
  }

  /**
   * Clean up listeners and garbage, so that we can be recycled (or pooled)
   * @public
   */
  dispose() {
    sceneryLog && sceneryLog.Instance && sceneryLog.Instance(`dispose ${this.toString()}`);
    sceneryLog && sceneryLog.Instance && sceneryLog.push();
    assert && assert(this.active, 'Seems like we tried to dispose this Instance twice, it is not active');
    this.active = false;

    // Remove the bidirectional branch index reference data from this instance and any referenced instances.
    while (this.branchIndexReferences.length) {
      const referenceInstance = this.branchIndexReferences.pop();
      delete this.branchIndexMap[referenceInstance.id];
      delete referenceInstance.branchIndexMap[this.id];
      arrayRemove(referenceInstance.branchIndexReferences, this);
    }

    // order is somewhat important
    this.groupDrawable && this.groupDrawable.disposeImmediately(this.display);
    this.sharedCacheDrawable && this.sharedCacheDrawable.disposeImmediately(this.display);
    this.selfDrawable && this.selfDrawable.disposeImmediately(this.display);

    // Dispose the rest of our subtree
    const numChildren = this.children.length;
    for (let i = 0; i < numChildren; i++) {
      this.children[i].dispose();
    }
    // Check for child instances that were removed (we are still responsible for disposing them, since we didn't get
    // synctree to happen for them).
    while (this.instanceRemovalCheckList.length) {
      const child = this.instanceRemovalCheckList.pop();

      // they could have already been disposed, so we need a guard here
      if (child.active) {
        child.dispose();
      }
    }

    // we don't originally add in the listener if we are stateless
    if (!this.stateless) {
      this.detachNodeListeners();
    }
    this.node.removeInstance(this);

    // release our reference to a shared cache if applicable, and dispose if there are no other references
    if (this.sharedCacheInstance) {
      this.sharedCacheInstance.externalReferenceCount--;
      if (this.sharedCacheInstance.externalReferenceCount === 0) {
        delete this.display._sharedCanvasInstances[this.node.getId()];
        this.sharedCacheInstance.dispose();
      }
    }

    // clean our variables out to release memory
    this.cleanInstance(null, null);
    this.visibleEmitter.removeAllListeners();
    this.relativeVisibleEmitter.removeAllListeners();
    this.selfVisibleEmitter.removeAllListeners();
    this.canVoiceEmitter.removeAllListeners();
    this.freeToPool();
    sceneryLog && sceneryLog.Instance && sceneryLog.pop();
  }

  /**
   * @public
   *
   * @param {number} frameId
   * @param {boolean} allowValidationNotNeededChecks
   */
  audit(frameId, allowValidationNotNeededChecks) {
    if (assertSlow) {
      if (frameId === undefined) {
        frameId = this.display._frameId;
      }
      assertSlow(!this.stateless, 'State is required for all display instances');
      assertSlow(this.firstDrawable === null === (this.lastDrawable === null), 'First/last drawables need to both be null or non-null');
      assertSlow(!this.isBackbone && !this.isSharedCanvasCachePlaceholder || this.groupDrawable, 'If we are a backbone or shared cache, we need to have a groupDrawable reference');
      assertSlow(!this.isSharedCanvasCachePlaceholder || !this.node.isPainted() || this.selfDrawable, 'We need to have a selfDrawable if we are painted and not a shared cache');
      assertSlow(!this.isTransformed && !this.isCanvasCache || this.groupDrawable, 'We need to have a groupDrawable if we are a backbone or any type of canvas cache');
      assertSlow(!this.isSharedCanvasCachePlaceholder || this.sharedCacheDrawable, 'We need to have a sharedCacheDrawable if we are a shared cache');
      assertSlow(this.addRemoveCounter === 0, 'Our addRemoveCounter should always be 0 at the end of syncTree');

      // validate the subtree
      for (let i = 0; i < this.children.length; i++) {
        const childInstance = this.children[i];
        childInstance.audit(frameId, allowValidationNotNeededChecks);
      }
      this.relativeTransform.audit(frameId, allowValidationNotNeededChecks);
      this.fittability.audit();
    }
  }

  /**
   * Applies checks to make sure our visibility tracking is working as expected.
   * @public
   *
   * @param {boolean} parentVisible
   */
  auditVisibility(parentVisible) {
    if (assertSlow) {
      const visible = parentVisible && this.node.isVisible();
      const trailVisible = this.trail.isVisible();
      assertSlow(visible === trailVisible, 'Trail visibility failure');
      assertSlow(visible === this.visible, 'Visible flag failure');
      assertSlow(this.voicingVisible === _.reduce(this.trail.nodes, (value, node) => value && node.voicingVisibleProperty.value, true), 'When this Instance is voicingVisible: true, all Trail Nodes must also be voicingVisible: true');

      // validate the subtree
      for (let i = 0; i < this.children.length; i++) {
        const childInstance = this.children[i];
        childInstance.auditVisibility(visible);
      }
    }
  }

  /**
   * @private
   *
   * @param {Drawable|null} oldFirstDrawable
   * @param {Drawable|null} oldLastDrawable
   * @param {Drawable|null} newFirstDrawable
   * @param {Drawable|null} newLastDrawable
   */
  auditChangeIntervals(oldFirstDrawable, oldLastDrawable, newFirstDrawable, newLastDrawable) {
    if (oldFirstDrawable) {
      let oldOne = oldFirstDrawable;

      // should hit, or will have NPE
      while (oldOne !== oldLastDrawable) {
        oldOne = oldOne.oldNextDrawable;
      }
    }
    if (newFirstDrawable) {
      let newOne = newFirstDrawable;

      // should hit, or will have NPE
      while (newOne !== newLastDrawable) {
        newOne = newOne.nextDrawable;
      }
    }
    function checkBetween(a, b) {
      // have the body of the function stripped (it's not inside the if statement due to JSHint)
      if (assertSlow) {
        assertSlow(a !== null);
        assertSlow(b !== null);
        while (a !== b) {
          assertSlow(a.nextDrawable === a.oldNextDrawable, 'Change interval mismatch');
          a = a.nextDrawable;
        }
      }
    }
    if (assertSlow) {
      const firstChangeInterval = this.firstChangeInterval;
      const lastChangeInterval = this.lastChangeInterval;
      if (!firstChangeInterval || firstChangeInterval.drawableBefore !== null) {
        assertSlow(oldFirstDrawable === newFirstDrawable, 'If we have no changes, or our first change interval is not open, our firsts should be the same');
      }
      if (!lastChangeInterval || lastChangeInterval.drawableAfter !== null) {
        assertSlow(oldLastDrawable === newLastDrawable, 'If we have no changes, or our last change interval is not open, our lasts should be the same');
      }
      if (!firstChangeInterval) {
        assertSlow(!lastChangeInterval, 'We should not be missing only one change interval');

        // with no changes, everything should be identical
        oldFirstDrawable && checkBetween(oldFirstDrawable, oldLastDrawable);
      } else {
        assertSlow(lastChangeInterval, 'We should not be missing only one change interval');

        // endpoints
        if (firstChangeInterval.drawableBefore !== null) {
          // check to the start if applicable
          checkBetween(oldFirstDrawable, firstChangeInterval.drawableBefore);
        }
        if (lastChangeInterval.drawableAfter !== null) {
          // check to the end if applicable
          checkBetween(lastChangeInterval.drawableAfter, oldLastDrawable);
        }

        // between change intervals (should always be guaranteed to be fixed)
        let interval = firstChangeInterval;
        while (interval && interval.nextChangeInterval) {
          const nextInterval = interval.nextChangeInterval;
          assertSlow(interval.drawableAfter !== null);
          assertSlow(nextInterval.drawableBefore !== null);
          checkBetween(interval.drawableAfter, nextInterval.drawableBefore);
          interval = nextInterval;
        }
      }
    }
  }

  /**
   * Returns a string form of this object
   * @public
   *
   * @returns {string}
   */
  toString() {
    return `${this.id}#${this.node ? `${this.node.constructor.name ? this.node.constructor.name : '?'}#${this.node.id}` : '-'}`;
  }
}
scenery.register('Instance', Instance);

// object pooling
Poolable.mixInto(Instance);
export default Instance;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUaW55RW1pdHRlciIsImFycmF5UmVtb3ZlIiwiY2xlYW5BcnJheSIsIlBvb2xhYmxlIiwiQmFja2JvbmVEcmF3YWJsZSIsIkNhbnZhc0Jsb2NrIiwiQ2hhbmdlSW50ZXJ2YWwiLCJEcmF3YWJsZSIsIkZpdHRhYmlsaXR5IiwiSW5saW5lQ2FudmFzQ2FjaGVEcmF3YWJsZSIsIlJlbGF0aXZlVHJhbnNmb3JtIiwiUmVuZGVyZXIiLCJzY2VuZXJ5IiwiU2hhcmVkQ2FudmFzQ2FjaGVEcmF3YWJsZSIsIlRyYWlsIiwiVXRpbHMiLCJnbG9iYWxJZENvdW50ZXIiLCJkZWZhdWx0UHJlZmVycmVkUmVuZGVyZXJzIiwiY3JlYXRlT3JkZXJCaXRtYXNrIiwiYml0bWFza1NWRyIsImJpdG1hc2tDYW52YXMiLCJiaXRtYXNrRE9NIiwiYml0bWFza1dlYkdMIiwiSW5zdGFuY2UiLCJkaXNwbGF5IiwiY29uc3RydWN0b3IiLCJ0cmFpbCIsImlzRGlzcGxheVJvb3QiLCJpc1NoYXJlZENhbnZhc0NhY2hlUm9vdCIsImFjdGl2ZSIsImluaXRpYWxpemUiLCJhc3NlcnQiLCJzZXRJbW11dGFibGUiLCJpZCIsImlzV2ViR0xTdXBwb3J0ZWQiLCJpc1dlYkdMQWxsb3dlZCIsInJlbGF0aXZlVHJhbnNmb3JtIiwiZml0dGFiaWxpdHkiLCJ2aXNpYmxlIiwicmVsYXRpdmVWaXNpYmxlIiwic2VsZlZpc2libGUiLCJ2aXNpYmlsaXR5RGlydHkiLCJjaGlsZFZpc2liaWxpdHlEaXJ0eSIsInZvaWNpbmdWaXNpYmxlIiwiYnJhbmNoSW5kZXhNYXAiLCJicmFuY2hJbmRleFJlZmVyZW5jZXMiLCJhZGRSZW1vdmVDb3VudGVyIiwic3RpdGNoQ2hhbmdlRnJhbWUiLCJfZnJhbWVJZCIsInN0aXRjaENoYW5nZUJlZm9yZSIsInN0aXRjaENoYW5nZUFmdGVyIiwic3RpdGNoQ2hhbmdlT25DaGlsZHJlbiIsInN0aXRjaENoYW5nZUluY2x1ZGVkIiwiY2hpbGRJbnNlcnRlZExpc3RlbmVyIiwib25DaGlsZEluc2VydGVkIiwiYmluZCIsImNoaWxkUmVtb3ZlZExpc3RlbmVyIiwib25DaGlsZFJlbW92ZWQiLCJjaGlsZHJlblJlb3JkZXJlZExpc3RlbmVyIiwib25DaGlsZHJlblJlb3JkZXJlZCIsInZpc2liaWxpdHlMaXN0ZW5lciIsIm9uVmlzaWJpbGl0eUNoYW5nZSIsIm1hcmtSZW5kZXJTdGF0ZURpcnR5TGlzdGVuZXIiLCJtYXJrUmVuZGVyU3RhdGVEaXJ0eSIsInZpc2libGVFbWl0dGVyIiwicmVsYXRpdmVWaXNpYmxlRW1pdHRlciIsInNlbGZWaXNpYmxlRW1pdHRlciIsImNhblZvaWNlRW1pdHRlciIsImNsZWFuSW5zdGFuY2UiLCJub2RlIiwiYWRkSW5zdGFuY2UiLCJleHRlcm5hbFJlZmVyZW5jZUNvdW50Iiwic3RhdGVsZXNzIiwicHJlZmVycmVkUmVuZGVyZXJzIiwiaXNVbmRlckNhbnZhc0NhY2hlIiwiaXNCYWNrYm9uZSIsImlzVHJhbnNmb3JtZWQiLCJpc1Zpc2liaWxpdHlBcHBsaWVkIiwiaXNJbnN0YW5jZUNhbnZhc0NhY2hlIiwiaXNTaGFyZWRDYW52YXNDYWNoZVBsYWNlaG9sZGVyIiwiaXNTaGFyZWRDYW52YXNDYWNoZVNlbGYiLCJzZWxmUmVuZGVyZXIiLCJncm91cFJlbmRlcmVyIiwic2hhcmVkQ2FjaGVSZW5kZXJlciIsInJlbmRlclN0YXRlRGlydHlGcmFtZSIsInNraXBQcnVuaW5nRnJhbWUiLCJzY2VuZXJ5TG9nIiwidG9TdHJpbmciLCJsYXN0Tm9kZSIsInBhcmVudCIsIm9sZFBhcmVudCIsImNoaWxkcmVuIiwic2hhcmVkQ2FjaGVJbnN0YW5jZSIsImluc3RhbmNlUmVtb3ZhbENoZWNrTGlzdCIsInNlbGZEcmF3YWJsZSIsImdyb3VwRHJhd2FibGUiLCJzaGFyZWRDYWNoZURyYXdhYmxlIiwiZmlyc3REcmF3YWJsZSIsImxhc3REcmF3YWJsZSIsImZpcnN0SW5uZXJEcmF3YWJsZSIsImxhc3RJbm5lckRyYXdhYmxlIiwic3ZnR3JvdXBzIiwiY2xlYW5TeW5jVHJlZVJlc3VsdHMiLCJiZWZvcmVTdGFibGVJbmRleCIsImxlbmd0aCIsImFmdGVyU3RhYmxlSW5kZXgiLCJmaXJzdENoYW5nZUludGVydmFsIiwibGFzdENoYW5nZUludGVydmFsIiwiaW5jb21wYXRpYmxlU3RhdGVDaGFuZ2UiLCJncm91cENoYW5nZWQiLCJjYXNjYWRpbmdTdGF0ZUNoYW5nZSIsImFueVN0YXRlQ2hhbmdlIiwidXBkYXRlUmVuZGVyaW5nU3RhdGUiLCJwdXNoIiwiZ2V0U3RhdGVTdHJpbmciLCJ3YXNCYWNrYm9uZSIsIndhc1RyYW5zZm9ybWVkIiwid2FzVmlzaWJpbGl0eUFwcGxpZWQiLCJ3YXNJbnN0YW5jZUNhbnZhc0NhY2hlIiwid2FzU2hhcmVkQ2FudmFzQ2FjaGVTZWxmIiwid2FzU2hhcmVkQ2FudmFzQ2FjaGVQbGFjZWhvbGRlciIsIndhc1VuZGVyQ2FudmFzQ2FjaGUiLCJvbGRTZWxmUmVuZGVyZXIiLCJvbGRHcm91cFJlbmRlcmVyIiwib2xkU2hhcmVkQ2FjaGVSZW5kZXJlciIsIm9sZFByZWZlcnJlZFJlbmRlcmVycyIsIl9yZW5kZXJlciIsInB1c2hPcmRlckJpdG1hc2siLCJoYXNDbGlwIiwiaGFzQ2xpcEFyZWEiLCJoYXNGaWx0ZXJzIiwiZWZmZWN0aXZlT3BhY2l0eSIsIl91c2VzT3BhY2l0eSIsIl9maWx0ZXJzIiwiaGFzTm9uU1ZHRmlsdGVyIiwiaGFzTm9uQ2FudmFzRmlsdGVyIiwiaSIsImZpbHRlciIsImlzU1ZHQ29tcGF0aWJsZSIsImlzQ2FudmFzQ29tcGF0aWJsZSIsInJlcXVpcmVzU3BsaXQiLCJfY3NzVHJhbnNmb3JtIiwiX2xheWVyU3BsaXQiLCJiYWNrYm9uZVJlcXVpcmVkIiwiYXBwbHlUcmFuc3BhcmVuY3lXaXRoQmxvY2siLCJfcmVuZGVyZXJTdW1tYXJ5IiwiaXNTdWJ0cmVlUmVuZGVyZWRFeGNsdXNpdmVseVNWRyIsImlzU3VidHJlZVJlbmRlcmVkRXhjbHVzaXZlbHlDYW52YXMiLCJ1c2VCYWNrYm9uZSIsIl9jYW52YXNDYWNoZSIsImlzU2luZ2xlQ2FudmFzU3VwcG9ydGVkIiwibmFtZSIsIl9zaW5nbGVDYWNoZSIsImFyZUJvdW5kc1ZhbGlkIiwiaXNQYWludGVkIiwic3VwcG9ydGVkTm9kZUJpdG1hc2siLCJfcmVuZGVyZXJCaXRtYXNrIiwiaW52YWxpZEJpdG1hc2tzIiwiYml0bWFza09yZGVyIiwibWFya0NoaWxkVmlzaWJpbGl0eURpcnR5IiwiY2hlY2tTZWxmRml0dGFiaWxpdHkiLCJwb3AiLCJyZXN1bHQiLCJiYXNlU3luY1RyZWUiLCJzeW5jVHJlZSIsImlzTG9nZ2luZ1BlcmZvcm1hbmNlIiwicGVyZlN5bmNUcmVlQ291bnQiLCJ3YXNTdGF0ZWxlc3MiLCJhc3NlcnRTbG93IiwibWFya1RyYW5zZm9ybVJvb3REaXJ0eSIsImF0dGFjaE5vZGVMaXN0ZW5lcnMiLCJzaGFyZWRTeW5jVHJlZSIsInByZXBhcmVDaGlsZEluc3RhbmNlcyIsIm9sZEZpcnN0RHJhd2FibGUiLCJvbGRMYXN0RHJhd2FibGUiLCJvbGRGaXJzdElubmVyRHJhd2FibGUiLCJvbGRMYXN0SW5uZXJEcmF3YWJsZSIsInNlbGZDaGFuZ2VkIiwidXBkYXRlU2VsZkRyYXdhYmxlIiwibG9jYWxTeW5jVHJlZSIsImF1ZGl0Q2hhbmdlSW50ZXJ2YWxzIiwiZ3JvdXBTeW5jVHJlZSIsImZyYW1lSWQiLCJjdXJyZW50RHJhd2FibGUiLCJuZXdGb3JEaXNwbGF5IiwiY3VycmVudENoYW5nZUludGVydmFsIiwibGFzdFVuY2hhbmdlZERyYXdhYmxlIiwiY2hpbGRJbnN0YW5jZSIsImlzQ29tcGF0aWJsZSIsInVwZGF0ZUluY29tcGF0aWJsZUNoaWxkSW5zdGFuY2UiLCJpbmNsdWRlQ2hpbGREcmF3YWJsZXMiLCJzaG91bGRJbmNsdWRlSW5QYXJlbnREcmF3YWJsZXMiLCJjb25uZWN0RHJhd2FibGVzIiwid2FzSW5jbHVkZWQiLCJpc0luY2x1ZGVkIiwiZmlyc3RDaGlsZENoYW5nZUludGVydmFsIiwiaXNCZWZvcmVPcGVuIiwiZHJhd2FibGVBZnRlciIsImlzQWZ0ZXJPcGVuIiwiZHJhd2FibGVCZWZvcmUiLCJuZWVkc0JyaWRnZSIsImJyaWRnZSIsIm5leHRDaGFuZ2VJbnRlcnZhbCIsImVuZGluZ0JyaWRnZSIsImZpcnN0RHJhd2FibGVDaGVjayIsImoiLCJsYXN0RHJhd2FibGVDaGVjayIsImsiLCJyZW5kZXJlciIsImJpdG1hc2tSZW5kZXJlckFyZWEiLCJtYXJrRm9yRGlzcG9zYWwiLCJjcmVhdGVTZWxmRHJhd2FibGUiLCJhbmNlc3RvcnNGaXR0YWJsZSIsImluZGV4IiwiYWZmZWN0ZWRJbnN0YW5jZUNvdW50IiwiZ2V0RGVzY2VuZGFudENvdW50IiwiUGVyZkNyaXRpY2FsIiwidG9QYXRoU3RyaW5nIiwiUGVyZk1ham9yIiwiUGVyZk1pbm9yIiwibWFya0luc3RhbmNlUm9vdEZvckRpc3Bvc2FsIiwicmVwbGFjZW1lbnRJbnN0YW5jZSIsImNyZWF0ZUZyb21Qb29sIiwiY29weSIsImFkZERlc2NlbmRhbnQiLCJyZXBsYWNlSW5zdGFuY2VXaXRoSW5kZXgiLCJkaXNjb25uZWN0QmVmb3JlIiwiZGlzY29ubmVjdEFmdGVyIiwiZ2V0VHJhbnNmb3JtUm9vdEluc3RhbmNlIiwic3RpdGNoIiwic2V0Rml0dGFibGUiLCJlbnN1cmVTaGFyZWRDYWNoZUluaXRpYWxpemVkIiwiaW5zdGFuY2VUb01hcmsiLCJjaGlsZCIsImFwcGVuZEluc3RhbmNlIiwiaW5zdGFuY2VLZXkiLCJnZXRJZCIsIl9zaGFyZWRDYW52YXNJbnN0YW5jZXMiLCJpc1Zpc2libGUiLCJpc0V4Y2x1ZGVJbnZpc2libGUiLCJmaW5kUHJldmlvdXNEcmF3YWJsZSIsImNoaWxkSW5kZXgiLCJvcHRpb24iLCJmaW5kTmV4dERyYXdhYmxlIiwibGVuIiwiaW5zdGFuY2UiLCJpbnNlcnRJbnN0YW5jZSIsIkluc3RhbmNlVHJlZSIsInNwbGljZSIsIm9uSW5zZXJ0IiwicmVtb3ZlSW5zdGFuY2UiLCJyZW1vdmVJbnN0YW5jZVdpdGhJbmRleCIsIl8iLCJpbmRleE9mIiwib25SZW1vdmUiLCJyZW9yZGVySW5zdGFuY2VzIiwibWluQ2hhbmdlSW5kZXgiLCJtYXhDaGFuZ2VJbmRleCIsImZpbmRDaGlsZEluc3RhbmNlT25Ob2RlIiwiX2NoaWxkcmVuIiwiTWF0aCIsIm1pbiIsIm1heCIsImluc3RhbmNlcyIsImdldEluc3RhbmNlcyIsImNoaWxkTm9kZSIsIm1hcmtTa2lwUHJ1bmluZyIsIm9uT3BhY2l0eUNoYW5nZSIsInVwZGF0ZURyYXdhYmxlRml0dGFiaWxpdHkiLCJmaXR0YWJsZSIsInVwZGF0ZVZpc2liaWxpdHkiLCJwYXJlbnRHbG9iYWxseVZpc2libGUiLCJwYXJlbnRHbG9iYWxseVZvaWNpbmdWaXNpYmxlIiwicGFyZW50UmVsYXRpdmVseVZpc2libGUiLCJ1cGRhdGVGdWxsU3VidHJlZSIsIm5vZGVWaXNpYmxlIiwid2FzVmlzaWJsZSIsIndhc1JlbGF0aXZlVmlzaWJsZSIsIndhc1NlbGZWaXNpYmxlIiwibm9kZVZvaWNpbmdWaXNpYmxlIiwidm9pY2luZ1Zpc2libGVQcm9wZXJ0eSIsInZhbHVlIiwid2FzVm9pY2luZ1Zpc2libGUiLCJjb3VsZFZvaWNlIiwiZW1pdCIsImNhblZvaWNlIiwiY291bnQiLCJhZGRTVkdHcm91cCIsImdyb3VwIiwicmVtb3ZlU1ZHR3JvdXAiLCJsb29rdXBTVkdHcm91cCIsImJsb2NrIiwiZ2V0RmlsdGVyUm9vdEluc3RhbmNlIiwiZ2V0VmlzaWJpbGl0eVJvb3RJbnN0YW5jZSIsImNoaWxkSW5zZXJ0ZWRFbWl0dGVyIiwiYWRkTGlzdGVuZXIiLCJjaGlsZFJlbW92ZWRFbWl0dGVyIiwiY2hpbGRyZW5SZW9yZGVyZWRFbWl0dGVyIiwidmlzaWJsZVByb3BlcnR5IiwibGF6eUxpbmsiLCJmaWx0ZXJDaGFuZ2VFbWl0dGVyIiwiY2xpcEFyZWFQcm9wZXJ0eSIsImluc3RhbmNlUmVmcmVzaEVtaXR0ZXIiLCJkZXRhY2hOb2RlTGlzdGVuZXJzIiwicmVtb3ZlTGlzdGVuZXIiLCJ1bmxpbmsiLCJnZXRCcmFuY2hJbmRleFRvIiwiY2FjaGVkVmFsdWUiLCJ1bmRlZmluZWQiLCJicmFuY2hJbmRleCIsImRpc3Bvc2UiLCJyZWZlcmVuY2VJbnN0YW5jZSIsImRpc3Bvc2VJbW1lZGlhdGVseSIsIm51bUNoaWxkcmVuIiwicmVtb3ZlQWxsTGlzdGVuZXJzIiwiZnJlZVRvUG9vbCIsImF1ZGl0IiwiYWxsb3dWYWxpZGF0aW9uTm90TmVlZGVkQ2hlY2tzIiwiaXNDYW52YXNDYWNoZSIsImF1ZGl0VmlzaWJpbGl0eSIsInBhcmVudFZpc2libGUiLCJ0cmFpbFZpc2libGUiLCJyZWR1Y2UiLCJub2RlcyIsIm5ld0ZpcnN0RHJhd2FibGUiLCJuZXdMYXN0RHJhd2FibGUiLCJvbGRPbmUiLCJvbGROZXh0RHJhd2FibGUiLCJuZXdPbmUiLCJuZXh0RHJhd2FibGUiLCJjaGVja0JldHdlZW4iLCJhIiwiYiIsImludGVydmFsIiwibmV4dEludGVydmFsIiwicmVnaXN0ZXIiLCJtaXhJbnRvIl0sInNvdXJjZXMiOlsiSW5zdGFuY2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQW4gaW5zdGFuY2UgdGhhdCBpcyBzcGVjaWZpYyB0byB0aGUgZGlzcGxheSAobm90IG5lY2Vzc2FyaWx5IGEgZ2xvYmFsIGluc3RhbmNlLCBjb3VsZCBiZSBpbiBhIENhbnZhcyBjYWNoZSwgZXRjKSxcclxuICogdGhhdCBpcyBuZWVkZWQgdG8gdHJhY2tpbmcgaW5zdGFuY2Utc3BlY2lmaWMgZGlzcGxheSBpbmZvcm1hdGlvbiwgYW5kIHNpZ25hbHMgdG8gdGhlIGRpc3BsYXkgc3lzdGVtIHdoZW4gb3RoZXJcclxuICogY2hhbmdlcyBhcmUgbmVjZXNzYXJ5LlxyXG4gKlxyXG4gKiBJbnN0YW5jZXMgZ2VuZXJhbGx5IGZvcm0gYSB0cnVlIHRyZWUsIGFzIG9wcG9zZWQgdG8gdGhlIERBRyBvZiBub2Rlcy4gVGhlIG9uZSBleGNlcHRpb24gaXMgZm9yIHNoYXJlZCBDYW52YXMgY2FjaGVzLFxyXG4gKiB3aGVyZSBtdWx0aXBsZSBpbnN0YW5jZXMgY2FuIHBvaW50IHRvIG9uZSBnbG9iYWxseS1zdG9yZWQgKHNoYXJlZCkgY2FjaGUgaW5zdGFuY2UuXHJcbiAqXHJcbiAqIEFuIEluc3RhbmNlIGlzIHBvb2xlZCwgYnV0IHdoZW4gY29uc3RydWN0ZWQgd2lsbCBub3QgYXV0b21hdGljYWxseSBjcmVhdGUgY2hpbGRyZW4sIGRyYXdhYmxlcywgZXRjLlxyXG4gKiBzeW5jVHJlZSgpIGlzIHJlc3BvbnNpYmxlIGZvciBzeW5jaHJvbml6aW5nIHRoZSBpbnN0YW5jZSBpdHNlbGYgYW5kIGl0cyBlbnRpcmUgc3VidHJlZS5cclxuICpcclxuICogSW5zdGFuY2VzIGFyZSBjcmVhdGVkIGFzICdzdGF0ZWxlc3MnIGluc3RhbmNlcywgYnV0IGR1cmluZyBzeW5jVHJlZSB0aGUgcmVuZGVyaW5nIHN0YXRlIChwcm9wZXJ0aWVzIHRvIGRldGVybWluZVxyXG4gKiBob3cgdG8gY29uc3RydWN0IHRoZSBkcmF3YWJsZSB0cmVlIGZvciB0aGlzIGluc3RhbmNlIGFuZCBpdHMgc3VidHJlZSkgYXJlIHNldC5cclxuICpcclxuICogV2hpbGUgSW5zdGFuY2VzIGFyZSBjb25zaWRlcmVkICdzdGF0ZWZ1bCcsIHRoZXkgd2lsbCBoYXZlIGxpc3RlbmVycyBhZGRlZCB0byB0aGVpciBOb2RlIHdoaWNoIHJlY29yZHMgYWN0aW9ucyB0YWtlblxyXG4gKiBpbi1iZXR3ZWVuIERpc3BsYXkudXBkYXRlRGlzcGxheSgpLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IFRpbnlFbWl0dGVyIGZyb20gJy4uLy4uLy4uL2F4b24vanMvVGlueUVtaXR0ZXIuanMnO1xyXG5pbXBvcnQgYXJyYXlSZW1vdmUgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL2FycmF5UmVtb3ZlLmpzJztcclxuaW1wb3J0IGNsZWFuQXJyYXkgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL2NsZWFuQXJyYXkuanMnO1xyXG5pbXBvcnQgUG9vbGFibGUgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL1Bvb2xhYmxlLmpzJztcclxuaW1wb3J0IHsgQmFja2JvbmVEcmF3YWJsZSwgQ2FudmFzQmxvY2ssIENoYW5nZUludGVydmFsLCBEcmF3YWJsZSwgRml0dGFiaWxpdHksIElubGluZUNhbnZhc0NhY2hlRHJhd2FibGUsIFJlbGF0aXZlVHJhbnNmb3JtLCBSZW5kZXJlciwgc2NlbmVyeSwgU2hhcmVkQ2FudmFzQ2FjaGVEcmF3YWJsZSwgVHJhaWwsIFV0aWxzIH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcblxyXG4vLyBUaGlzIGZpeGVzIGhvdyBUeXBlc2NyaXB0IHJlY29nbml6ZXMgdGhlIFwiRGlzcGxheVwiIHR5cGUsIHVzZWQgdGhpcyBwYXR0ZXJuIGluIGphdmFzY3JpcHQgZmlsZXMgd2UgY2FuJ3QgY29udmVydCB0b1xyXG4vLyBUeXBlU2NyaXB0IHJpZ2h0IG5vdy5cclxuLyoqXHJcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4uL2ltcG9ydHMnKS5EaXNwbGF5fSBEaXNwbGF5XHJcbiAqL1xyXG5cclxubGV0IGdsb2JhbElkQ291bnRlciA9IDE7XHJcblxyXG4vLyBwcmVmZXJlbmNlcyB0b3AgdG8gYm90dG9tIGluIGdlbmVyYWxcclxuY29uc3QgZGVmYXVsdFByZWZlcnJlZFJlbmRlcmVycyA9IFJlbmRlcmVyLmNyZWF0ZU9yZGVyQml0bWFzayhcclxuICBSZW5kZXJlci5iaXRtYXNrU1ZHLFxyXG4gIFJlbmRlcmVyLmJpdG1hc2tDYW52YXMsXHJcbiAgUmVuZGVyZXIuYml0bWFza0RPTSxcclxuICBSZW5kZXJlci5iaXRtYXNrV2ViR0xcclxuKTtcclxuXHJcbmNsYXNzIEluc3RhbmNlIHtcclxuXHJcbiAgLyoqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqIEB0eXBlIHtEaXNwbGF5fG51bGx9XHJcbiAgICovXHJcbiAgZGlzcGxheSA9IG51bGw7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBtaXhlcyBQb29sYWJsZVxyXG4gICAqXHJcbiAgICogU2VlIGluaXRpYWxpemUoKSBmb3IgZG9jdW1lbnRhdGlvblxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtEaXNwbGF5fSBkaXNwbGF5XHJcbiAgICogQHBhcmFtIHtUcmFpbH0gdHJhaWxcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzRGlzcGxheVJvb3RcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzU2hhcmVkQ2FudmFzQ2FjaGVSb290XHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoIGRpc3BsYXksIHRyYWlsLCBpc0Rpc3BsYXlSb290LCBpc1NoYXJlZENhbnZhc0NhY2hlUm9vdCApIHtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7Ym9vbGVhbn1cclxuICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XHJcblxyXG4gICAgdGhpcy5pbml0aWFsaXplKCBkaXNwbGF5LCB0cmFpbCwgaXNEaXNwbGF5Um9vdCwgaXNTaGFyZWRDYW52YXNDYWNoZVJvb3QgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7RGlzcGxheX0gZGlzcGxheSAtIEluc3RhbmNlcyBhcmUgYm91bmQgdG8gYSBzaW5nbGUgZGlzcGxheVxyXG4gICAqIEBwYXJhbSB7VHJhaWx9IHRyYWlsIC0gVGhlIGxpc3Qgb2YgYW5jZXN0b3JzIGdvaW5nIGJhY2sgdXAgdG8gb3VyIHJvb3QgaW5zdGFuY2UgKGZvciB0aGUgZGlzcGxheSwgb3IgZm9yIGEgY2FjaGUpXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBpc0Rpc3BsYXlSb290IC0gV2hldGhlciBvdXIgaW5zdGFuY2UgaXMgZm9yIHRoZSByb290IG5vZGUgcHJvdmlkZWQgdG8gdGhlIERpc3BsYXkuXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBpc1NoYXJlZENhbnZhc0NhY2hlUm9vdCAtIFdoZXRoZXIgb3VyIGluc3RhbmNlIGlzIHRoZSByb290IGZvciBhIHNoYXJlZCBDYW52YXMgY2FjaGUgKHdoaWNoIGNhblxyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZSB1c2VkIG11bHRpcGxlIHBsYWNlcyBpbiB0aGUgbWFpbiBpbnN0YW5jZSB0cmVlKVxyXG4gICAqL1xyXG4gIGluaXRpYWxpemUoIGRpc3BsYXksIHRyYWlsLCBpc0Rpc3BsYXlSb290LCBpc1NoYXJlZENhbnZhc0NhY2hlUm9vdCApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLmFjdGl2ZSxcclxuICAgICAgJ1dlIHNob3VsZCBuZXZlciB0cnkgdG8gaW5pdGlhbGl6ZSBhbiBhbHJlYWR5IGFjdGl2ZSBvYmplY3QnICk7XHJcblxyXG4gICAgLy8gcHJldmVudCB0aGUgdHJhaWwgcGFzc2VkIGluIGZyb20gYmVpbmcgbXV0YXRlZCBhZnRlciB0aGlzIHBvaW50ICh3ZSB3YW50IGEgY29uc2lzdGVudCB0cmFpbClcclxuICAgIHRyYWlsLnNldEltbXV0YWJsZSgpO1xyXG5cclxuICAgIC8vIEBwdWJsaWMge251bWJlcn1cclxuICAgIHRoaXMuaWQgPSB0aGlzLmlkIHx8IGdsb2JhbElkQ291bnRlcisrO1xyXG5cclxuICAgIC8vIEBwdWJsaWMge2Jvb2xlYW59XHJcbiAgICB0aGlzLmlzV2ViR0xTdXBwb3J0ZWQgPSBkaXNwbGF5LmlzV2ViR0xBbGxvd2VkKCkgJiYgVXRpbHMuaXNXZWJHTFN1cHBvcnRlZDtcclxuXHJcbiAgICAvLyBAcHVibGljIHtSZWxhdGl2ZVRyYW5zZm9ybX0gLSBwcm92aWRlcyBoaWdoLXBlcmZvcm1hbmNlIGFjY2VzcyB0byAncmVsYXRpdmUnIHRyYW5zZm9ybXMgKGZyb20gb3VyIG5lYXJlc3RcclxuICAgIC8vIHRyYW5zZm9ybSByb290KSwgYW5kIGFsbG93cyBmb3IgbGlzdGVuaW5nIHRvIHdoZW4gb3VyIHJlbGF0aXZlIHRyYW5zZm9ybSBjaGFuZ2VzIChjYWxsZWQgZHVyaW5nIGEgcGhhc2Ugb2ZcclxuICAgIC8vIERpc3BsYXkudXBkYXRlRGlzcGxheSgpKS5cclxuICAgIHRoaXMucmVsYXRpdmVUcmFuc2Zvcm0gPSAoIHRoaXMucmVsYXRpdmVUcmFuc2Zvcm0gfHwgbmV3IFJlbGF0aXZlVHJhbnNmb3JtKCB0aGlzICkgKTtcclxuXHJcbiAgICAvLyBAcHVibGljIHtGaXR0YWJpbGl0eX0gLSBwcm92aWRlcyBsb2dpYyBmb3Igd2hldGhlciBvdXIgZHJhd2FibGVzIChvciBjb21tb24tZml0IGFuY2VzdG9ycykgd2lsbCBzdXBwb3J0IGZpdHRpbmdcclxuICAgIC8vIGZvciBGaXR0ZWRCbG9jayBzdWJ0eXBlcy4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy80MDYuXHJcbiAgICB0aGlzLmZpdHRhYmlsaXR5ID0gKCB0aGlzLmZpdHRhYmlsaXR5IHx8IG5ldyBGaXR0YWJpbGl0eSggdGhpcyApICk7XHJcblxyXG4gICAgLy8gQHB1YmxpYyB7Ym9vbGVhbn0gLSBUcmFja2luZyBvZiB2aXNpYmlsaXR5IHtib29sZWFufSBhbmQgYXNzb2NpYXRlZCBib29sZWFuIGZsYWdzLlxyXG4gICAgdGhpcy52aXNpYmxlID0gdHJ1ZTsgLy8gZ2xvYmFsIHZpc2liaWxpdHkgKHdoZXRoZXIgdGhpcyBpbnN0YW5jZSB3aWxsIGVuZCB1cCBhcHBlYXJpbmcgb24gdGhlIGRpc3BsYXkpXHJcbiAgICB0aGlzLnJlbGF0aXZlVmlzaWJsZSA9IHRydWU7IC8vIHJlbGF0aXZlIHZpc2liaWxpdHkgKGlnbm9yZXMgdGhlIGNsb3Nlc3QgYW5jZXN0cmFsIHZpc2liaWxpdHkgcm9vdCBhbmQgYmVsb3cpXHJcbiAgICB0aGlzLnNlbGZWaXNpYmxlID0gdHJ1ZTsgLy8gbGlrZSByZWxhdGl2ZSB2aXNpYmlsaXR5LCBidXQgaXMgYWx3YXlzIHRydWUgaWYgd2UgYXJlIGEgdmlzaWJpbGl0eSByb290XHJcbiAgICB0aGlzLnZpc2liaWxpdHlEaXJ0eSA9IHRydWU7IC8vIGVudGlyZSBzdWJ0cmVlIG9mIHZpc2liaWxpdHkgd2lsbCBuZWVkIHRvIGJlIHVwZGF0ZWRcclxuICAgIHRoaXMuY2hpbGRWaXNpYmlsaXR5RGlydHkgPSB0cnVlOyAvLyBhbiBhbmNlc3RvciBuZWVkcyBpdHMgdmlzaWJpbGl0eSB1cGRhdGVkXHJcbiAgICB0aGlzLnZvaWNpbmdWaXNpYmxlID0gdHJ1ZTsgLy8gd2hldGhlciB0aGlzIGluc3RhbmNlIGlzIFwidmlzaWJsZVwiIGZvciBWb2ljaW5nIGFuZCBhbGxvd3Mgc3BlZWNoIHdpdGggdGhhdCBmZWF0dXJlXHJcblxyXG4gICAgLy8gQHByaXZhdGUge09iamVjdC48aW5zdGFuY2VJZDpudW1iZXIsbnVtYmVyPn0gLSBNYXBzIGFub3RoZXIgaW5zdGFuY2UncyBgaW5zdGFuY2UuaWRgIHtudW1iZXJ9ID0+IGJyYW5jaCBpbmRleFxyXG4gICAgLy8ge251bWJlcn0gKGZpcnN0IGluZGV4IHdoZXJlIHRoZSB0d28gdHJhaWxzIGFyZSBkaWZmZXJlbnQpLiBUaGlzIGVmZmVjdGl2ZWx5IG9wZXJhdGVzIGFzIGEgY2FjaGUgKHNpbmNlIGl0J3MgbW9yZVxyXG4gICAgLy8gZXhwZW5zaXZlIHRvIGNvbXB1dGUgdGhlIHZhbHVlIHRoYW4gaXQgaXMgdG8gbG9vayB1cCB0aGUgdmFsdWUpLlxyXG4gICAgLy8gSXQgaXMgYWxzbyBcImJpZGlyZWN0aW9uYWxcIiwgc3VjaCB0aGF0IGlmIHdlIGFkZCBpbnN0YW5jZSBBJ3MgYnJhbmNoIGluZGV4IHRvIHRoaXMgbWFwLCB3ZSB3aWxsIGFsc28gYWRkIHRoZVxyXG4gICAgLy8gc2FtZSB2YWx1ZSB0byBpbnN0YW5jZSBBJ3MgbWFwIChyZWZlcmVuY2luZyB0aGlzIGluc3RhbmNlKS4gSW4gb3JkZXIgdG8gY2xlYW4gdXAgYW5kIHByZXZlbnQgbGVha3MsIHRoZVxyXG4gICAgLy8gaW5zdGFuY2UgcmVmZXJlbmNlcyBhcmUgcHJvdmlkZWQgaW4gdGhpcy5icmFuY2hJbmRleFJlZmVyZW5jZXMgKG9uIGJvdGggZW5kcyksIHNvIHRoYXQgd2hlbiBvbmUgaW5zdGFuY2UgaXNcclxuICAgIC8vIGRpc3Bvc2VkIGl0IGNhbiByZW1vdmUgdGhlIHJlZmVyZW5jZXMgYmlkaXJlY3Rpb25hbGx5LlxyXG4gICAgdGhpcy5icmFuY2hJbmRleE1hcCA9IHRoaXMuYnJhbmNoSW5kZXhNYXAgfHwge307XHJcblxyXG4gICAgLy8gQHB1YmxpYyB7QXJyYXkuPEluc3RhbmNlPn0gLSBBbGwgaW5zdGFuY2VzIHdoZXJlIHdlIGhhdmUgZW50cmllcyBpbiBvdXIgbWFwLiBTZWUgZG9jcyBmb3IgYnJhbmNoSW5kZXhNYXAuXHJcbiAgICB0aGlzLmJyYW5jaEluZGV4UmVmZXJlbmNlcyA9IGNsZWFuQXJyYXkoIHRoaXMuYnJhbmNoSW5kZXhSZWZlcmVuY2VzICk7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge251bWJlcn0gLSBJbiB0aGUgcmFuZ2UgKC0xLDApLCB0byBoZWxwIHVzIHRyYWNrIGluc2VydGlvbnMgYW5kIHJlbW92YWxzIG9mIHRoaXMgaW5zdGFuY2UncyBub2RlIHRvIGl0c1xyXG4gICAgLy8gcGFyZW50IChkaWQgd2UgZ2V0IHJlbW92ZWQgYnV0IGFkZGVkIGJhY2s/KS5cclxuICAgIC8vIElmIGl0J3MgLTEgYXQgaXRzIHBhcmVudCdzIHN5bmNUcmVlLCB3ZSdsbCBlbmQgdXAgcmVtb3Zpbmcgb3VyIHJlZmVyZW5jZSB0byBpdC5cclxuICAgIC8vIFdlIHVzZSBhbiBpbnRlZ2VyIGp1c3QgZm9yIHNhbml0eSBjaGVja3MgKGlmIGl0IGV2ZXIgcmVhY2hlcyAtMiBvciAxLCB3ZSd2ZSByZWFjaGVkIGFuIGludmFsaWQgc3RhdGUpXHJcbiAgICB0aGlzLmFkZFJlbW92ZUNvdW50ZXIgPSAwO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtudW1iZXJ9IC0gSWYgZXF1YWwgdG8gdGhlIGN1cnJlbnQgZnJhbWUgSUQgKGl0IGlzIGluaXRpYWxpemVkIGFzIHN1Y2gpLCB0aGVuIGl0IGlzIHRyZWF0ZWQgZHVyaW5nIHRoZVxyXG4gICAgLy8gY2hhbmdlIGludGVydmFsIHdhdGVyZmFsbCBhcyBcImNvbXBsZXRlbHkgY2hhbmdlZFwiLCBhbmQgYW4gaW50ZXJ2YWwgZm9yIHRoZSBlbnRpcmUgaW5zdGFuY2UgaXMgdXNlZC5cclxuICAgIHRoaXMuc3RpdGNoQ2hhbmdlRnJhbWUgPSBkaXNwbGF5Ll9mcmFtZUlkO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtudW1iZXJ9IC0gSWYgZXF1YWwgdG8gdGhlIGN1cnJlbnQgZnJhbWUgSUQsIGFuIGluc3RhbmNlIHdhcyByZW1vdmVkIGZyb20gYmVmb3JlIG9yIGFmdGVyIHRoaXMgaW5zdGFuY2UsXHJcbiAgICAvLyBzbyB3ZSdsbCB3YW50IHRvIGFkZCBpbiBhIHByb3BlciBjaGFuZ2UgaW50ZXJ2YWwgKHJlbGF0ZWQgdG8gc2libGluZ3MpXHJcbiAgICB0aGlzLnN0aXRjaENoYW5nZUJlZm9yZSA9IDA7XHJcbiAgICB0aGlzLnN0aXRjaENoYW5nZUFmdGVyID0gMDtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7bnVtYmVyfSAtIElmIGVxdWFsIHRvIHRoZSBjdXJyZW50IGZyYW1lIElELCBjaGlsZCBpbnN0YW5jZXMgd2VyZSBhZGRlZCBvciByZW1vdmVkIGZyb20gdGhpcyBpbnN0YW5jZS5cclxuICAgIHRoaXMuc3RpdGNoQ2hhbmdlT25DaGlsZHJlbiA9IDA7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge2Jvb2xlYW59IC0gd2hldGhlciB3ZSBoYXZlIGJlZW4gaW5jbHVkZWQgaW4gb3VyIHBhcmVudCdzIGRyYXdhYmxlcyB0aGUgcHJldmlvdXMgZnJhbWVcclxuICAgIHRoaXMuc3RpdGNoQ2hhbmdlSW5jbHVkZWQgPSBmYWxzZTtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7ZnVuY3Rpb259IC0gTm9kZSBsaXN0ZW5lcnMgZm9yIHRyYWNraW5nIGNoaWxkcmVuLiBMaXN0ZW5lcnMgc2hvdWxkIGJlIGFkZGVkIG9ubHkgd2hlbiB3ZSBiZWNvbWVcclxuICAgIC8vIHN0YXRlZnVsXHJcbiAgICB0aGlzLmNoaWxkSW5zZXJ0ZWRMaXN0ZW5lciA9IHRoaXMuY2hpbGRJbnNlcnRlZExpc3RlbmVyIHx8IHRoaXMub25DaGlsZEluc2VydGVkLmJpbmQoIHRoaXMgKTtcclxuICAgIHRoaXMuY2hpbGRSZW1vdmVkTGlzdGVuZXIgPSB0aGlzLmNoaWxkUmVtb3ZlZExpc3RlbmVyIHx8IHRoaXMub25DaGlsZFJlbW92ZWQuYmluZCggdGhpcyApO1xyXG4gICAgdGhpcy5jaGlsZHJlblJlb3JkZXJlZExpc3RlbmVyID0gdGhpcy5jaGlsZHJlblJlb3JkZXJlZExpc3RlbmVyIHx8IHRoaXMub25DaGlsZHJlblJlb3JkZXJlZC5iaW5kKCB0aGlzICk7XHJcbiAgICB0aGlzLnZpc2liaWxpdHlMaXN0ZW5lciA9IHRoaXMudmlzaWJpbGl0eUxpc3RlbmVyIHx8IHRoaXMub25WaXNpYmlsaXR5Q2hhbmdlLmJpbmQoIHRoaXMgKTtcclxuICAgIHRoaXMubWFya1JlbmRlclN0YXRlRGlydHlMaXN0ZW5lciA9IHRoaXMubWFya1JlbmRlclN0YXRlRGlydHlMaXN0ZW5lciB8fCB0aGlzLm1hcmtSZW5kZXJTdGF0ZURpcnR5LmJpbmQoIHRoaXMgKTtcclxuXHJcbiAgICAvLyBAcHVibGljIHtUaW55RW1pdHRlcn1cclxuICAgIHRoaXMudmlzaWJsZUVtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXIoKTtcclxuICAgIHRoaXMucmVsYXRpdmVWaXNpYmxlRW1pdHRlciA9IG5ldyBUaW55RW1pdHRlcigpO1xyXG4gICAgdGhpcy5zZWxmVmlzaWJsZUVtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXIoKTtcclxuICAgIHRoaXMuY2FuVm9pY2VFbWl0dGVyID0gbmV3IFRpbnlFbWl0dGVyKCk7XHJcblxyXG4gICAgdGhpcy5jbGVhbkluc3RhbmNlKCBkaXNwbGF5LCB0cmFpbCApO1xyXG5cclxuICAgIC8vIFdlIG5lZWQgdG8gYWRkIHRoaXMgcmVmZXJlbmNlIG9uIHN0YXRlbGVzcyBpbnN0YW5jZXMsIHNvIHRoYXQgd2UgY2FuIGZpbmQgb3V0IGlmIGl0IHdhcyByZW1vdmVkIGJlZm9yZSBvdXJcclxuICAgIC8vIHN5bmNUcmVlIHdhcyBjYWxsZWQuXHJcbiAgICB0aGlzLm5vZGUuYWRkSW5zdGFuY2UoIHRoaXMgKTtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7bnVtYmVyfSAtIE91dHN0YW5kaW5nIGV4dGVybmFsIHJlZmVyZW5jZXMuIHVzZWQgZm9yIHNoYXJlZCBjYWNoZSBpbnN0YW5jZXMsIHdoZXJlIG11bHRpcGxlIGluc3RhbmNlc1xyXG4gICAgLy8gY2FuIHBvaW50IHRvIHVzLlxyXG4gICAgdGhpcy5leHRlcm5hbFJlZmVyZW5jZUNvdW50ID0gMDtcclxuXHJcbiAgICAvLyBAcHVibGljIHtib29sZWFufSAtIFdoZXRoZXIgd2UgaGF2ZSBoYWQgb3VyIHN0YXRlIGluaXRpYWxpemVkIHlldFxyXG4gICAgdGhpcy5zdGF0ZWxlc3MgPSB0cnVlO1xyXG5cclxuICAgIC8vIEBwdWJsaWMge2Jvb2xlYW59IC0gV2hldGhlciB3ZSBhcmUgdGhlIHJvb3QgaW5zdGFuY2UgZm9yIGEgRGlzcGxheS4gUmVuZGVyaW5nIHN0YXRlIGNvbnN0YW50ICh3aWxsIG5vdCBjaGFuZ2VcclxuICAgIC8vIG92ZXIgdGhlIGxpZmUgb2YgYW4gaW5zdGFuY2UpXHJcbiAgICB0aGlzLmlzRGlzcGxheVJvb3QgPSBpc0Rpc3BsYXlSb290O1xyXG5cclxuICAgIC8vIEBwdWJsaWMge2Jvb2xlYW59IC0gV2hldGhlciB3ZSBhcmUgdGhlIHJvb3Qgb2YgYSBDYW52YXMgY2FjaGUuIFJlbmRlcmluZyBzdGF0ZSBjb25zdGFudCAod2lsbCBub3QgY2hhbmdlIG92ZXIgdGhlXHJcbiAgICAvLyBsaWZlIG9mIGFuIGluc3RhbmNlKVxyXG4gICAgdGhpcy5pc1NoYXJlZENhbnZhc0NhY2hlUm9vdCA9IGlzU2hhcmVkQ2FudmFzQ2FjaGVSb290O1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtudW1iZXJ9IC0gW0NBU0NBRElORyBSRU5ERVIgU1RBVEVdIFBhY2tlZCByZW5kZXJlciBvcmRlciBiaXRtYXNrICh3aGF0IG91ciByZW5kZXJlciBwcmVmZXJlbmNlcyBhcmUpLlxyXG4gICAgLy8gUGFydCBvZiB0aGUgJ2Nhc2NhZGluZycgcmVuZGVyIHN0YXRlIGZvciB0aGUgaW5zdGFuY2UgdHJlZS4gVGhlc2UgYXJlIHByb3BlcnRpZXMgdGhhdCBjYW4gYWZmZWN0IHRoZSBlbnRpcmVcclxuICAgIC8vIHN1YnRyZWUgd2hlbiBzZXRcclxuICAgIHRoaXMucHJlZmVycmVkUmVuZGVyZXJzID0gMDtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7Ym9vbGVhbn0gLSBbQ0FTQ0FESU5HIFJFTkRFUiBTVEFURV0gV2hldGhlciB3ZSBhcmUgYmVuZWF0aCBhIENhbnZhcyBjYWNoZSAoQ2FudmFzIHJlcXVpcmVkKS4gUGFydCBvZlxyXG4gICAgLy8gdGhlICdjYXNjYWRpbmcnIHJlbmRlciBzdGF0ZSBmb3IgdGhlIGluc3RhbmNlIHRyZWUuIFRoZXNlIGFyZSBwcm9wZXJ0aWVzIHRoYXQgY2FuIGFmZmVjdCB0aGUgZW50aXJlIHN1YnRyZWUgd2hlblxyXG4gICAgLy8gc2V0XHJcbiAgICB0aGlzLmlzVW5kZXJDYW52YXNDYWNoZSA9IGlzU2hhcmVkQ2FudmFzQ2FjaGVSb290O1xyXG5cclxuICAgIC8vIEBwdWJsaWMge2Jvb2xlYW59IC0gW1JFTkRFUiBTVEFURSBFWFBPUlRdIFdoZXRoZXIgd2Ugd2lsbCBoYXZlIGEgQmFja2JvbmVEcmF3YWJsZSBncm91cCBkcmF3YWJsZVxyXG4gICAgdGhpcy5pc0JhY2tib25lID0gZmFsc2U7XHJcblxyXG4gICAgLy8gQHB1YmxpYyB7Ym9vbGVhbn0gLSBbUkVOREVSIFNUQVRFIEVYUE9SVF0gV2hldGhlciB0aGlzIGluc3RhbmNlIGNyZWF0ZXMgYSBuZXcgXCJyb290XCIgZm9yIHRoZSByZWxhdGl2ZSB0cmFpbFxyXG4gICAgLy8gdHJhbnNmb3Jtc1xyXG4gICAgdGhpcy5pc1RyYW5zZm9ybWVkID0gZmFsc2U7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge2Jvb2xlYW59IC0gW1JFTkRFUiBTVEFURSBFWFBPUlRdIFdoZXRoZXIgdGhpcyBpbnN0YW5jZSBoYW5kbGVzIHZpc2liaWxpdHkgd2l0aCBhIGdyb3VwIGRyYXdhYmxlXHJcbiAgICB0aGlzLmlzVmlzaWJpbGl0eUFwcGxpZWQgPSBmYWxzZTtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7Ym9vbGVhbn0gLSBbUkVOREVSIFNUQVRFIEVYUE9SVF0gV2hldGhlciB3ZSBoYXZlIGEgQ2FudmFzIGNhY2hlIHNwZWNpZmljIHRvIHRoaXMgaW5zdGFuY2UncyBwb3NpdGlvblxyXG4gICAgdGhpcy5pc0luc3RhbmNlQ2FudmFzQ2FjaGUgPSBmYWxzZTtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7Ym9vbGVhbn0gLSBbUkVOREVSIFNUQVRFIEVYUE9SVF1cclxuICAgIHRoaXMuaXNTaGFyZWRDYW52YXNDYWNoZVBsYWNlaG9sZGVyID0gZmFsc2U7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge2Jvb2xlYW59IC0gW1JFTkRFUiBTVEFURSBFWFBPUlRdXHJcbiAgICB0aGlzLmlzU2hhcmVkQ2FudmFzQ2FjaGVTZWxmID0gaXNTaGFyZWRDYW52YXNDYWNoZVJvb3Q7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge251bWJlcn0gLSBbUkVOREVSIFNUQVRFIEVYUE9SVF0gUmVuZGVyZXIgYml0bWFzayBmb3IgdGhlICdzZWxmJyBkcmF3YWJsZSAoaWYgb3VyIE5vZGUgaXMgcGFpbnRlZClcclxuICAgIHRoaXMuc2VsZlJlbmRlcmVyID0gMDtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7bnVtYmVyfSAtIFtSRU5ERVIgU1RBVEUgRVhQT1JUXSBSZW5kZXJlciBiaXRtYXNrIGZvciB0aGUgJ2dyb3VwJyBkcmF3YWJsZSAoaWYgYXBwbGljYWJsZSlcclxuICAgIHRoaXMuZ3JvdXBSZW5kZXJlciA9IDA7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge251bWJlcn0gLSBbUkVOREVSIFNUQVRFIEVYUE9SVF0gUmVuZGVyZXIgYml0bWFzayBmb3IgdGhlIGNhY2hlIGRyYXdhYmxlIChpZiBhcHBsaWNhYmxlKVxyXG4gICAgdGhpcy5zaGFyZWRDYWNoZVJlbmRlcmVyID0gMDtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7bnVtYmVyfSAtIFdoZW4gZXF1YWwgdG8gdGhlIGN1cnJlbnQgZnJhbWUgaXQgaXMgY29uc2lkZXJlZCBcImRpcnR5XCIuIElzIGEgcHJ1bmluZyBmbGFnICh3aGV0aGVyIHdlIG5lZWRcclxuICAgIC8vIHRvIGJlIHZpc2l0ZWQsIHdoZXRoZXIgdXBkYXRlUmVuZGVyaW5nU3RhdGUgaXMgcmVxdWlyZWQsIGFuZCB3aGV0aGVyIHRvIHZpc2l0IGNoaWxkcmVuKVxyXG4gICAgdGhpcy5yZW5kZXJTdGF0ZURpcnR5RnJhbWUgPSBkaXNwbGF5Ll9mcmFtZUlkO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtudW1iZXJ9IC0gV2hlbiBlcXVhbCB0byB0aGUgY3VycmVudCBmcmFtZSB3ZSBjYW4ndCBwcnVuZSBhdCB0aGlzIGluc3RhbmNlLiBJcyBhIHBydW5pbmcgZmxhZyAod2hldGhlclxyXG4gICAgLy8gd2UgbmVlZCB0byBiZSB2aXNpdGVkLCB3aGV0aGVyIHVwZGF0ZVJlbmRlcmluZ1N0YXRlIGlzIHJlcXVpcmVkLCBhbmQgd2hldGhlciB0byB2aXNpdCBjaGlsZHJlbilcclxuICAgIHRoaXMuc2tpcFBydW5pbmdGcmFtZSA9IGRpc3BsYXkuX2ZyYW1lSWQ7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkluc3RhbmNlICYmIHNjZW5lcnlMb2cuSW5zdGFuY2UoIGBpbml0aWFsaXplZCAke3RoaXMudG9TdHJpbmcoKX1gICk7XHJcblxyXG4gICAgLy8gV2hldGhlciB3ZSBoYXZlIGJlZW4gaW5zdGFudGlhdGVkLiBmYWxzZSBpZiB3ZSBhcmUgaW4gYSBwb29sIHdhaXRpbmcgdG8gYmUgaW5zdGFudGlhdGVkLlxyXG4gICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIGZvciBpbml0aWFsaXphdGlvbiBvZiBwcm9wZXJ0aWVzICh2aWEgaW5pdGlhbGl6ZSgpLCB2aWEgY29uc3RydWN0b3IpLCBhbmQgdG8gY2xlYW4gdGhlIGluc3RhbmNlIGZvclxyXG4gICAqIHBsYWNlbWVudCBpbiB0aGUgcG9vbCAoZG9uJ3QgbGVhayBtZW1vcnkpLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBJZiB0aGUgcGFyYW1ldGVycyBhcmUgbnVsbCwgd2UgcmVtb3ZlIGFsbCBleHRlcm5hbCByZWZlcmVuY2VzIHNvIHRoYXQgd2UgZG9uJ3QgbGVhayBtZW1vcnkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0Rpc3BsYXl8bnVsbH0gZGlzcGxheSAtIEluc3RhbmNlcyBhcmUgYm91bmQgdG8gYSBzaW5nbGUgZGlzcGxheVxyXG4gICAqIEBwYXJhbSB7VHJhaWx8bnVsbH0gdHJhaWwgLSBUaGUgbGlzdCBvZiBhbmNlc3RvcnMgZ29pbmcgYmFjayB1cCB0byBvdXIgcm9vdCBpbnN0YW5jZSAoZm9yIHRoZSBkaXNwbGF5LCBvciBmb3IgYSBjYWNoZSlcclxuICAgKi9cclxuICBjbGVhbkluc3RhbmNlKCBkaXNwbGF5LCB0cmFpbCApIHtcclxuICAgIC8vIEBwdWJsaWMge0Rpc3BsYXl8bnVsbH1cclxuICAgIHRoaXMuZGlzcGxheSA9IGRpc3BsYXk7XHJcblxyXG4gICAgLy8gQHB1YmxpYyB7VHJhaWx8bnVsbH1cclxuICAgIHRoaXMudHJhaWwgPSB0cmFpbDtcclxuXHJcbiAgICAvLyBAcHVibGljIHtOb2RlfG51bGx9XHJcbiAgICB0aGlzLm5vZGUgPSB0cmFpbCA/IHRyYWlsLmxhc3ROb2RlKCkgOiBudWxsO1xyXG5cclxuICAgIC8vIEBwdWJsaWMge0luc3RhbmNlfG51bGx9IC0gd2lsbCBiZSBzZXQgYXMgbmVlZGVkXHJcbiAgICB0aGlzLnBhcmVudCA9IG51bGw7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge0luc3RhbmNlfG51bGx9IC0gc2V0IHdoZW4gcmVtb3ZlZCBmcm9tIHVzLCBzbyB0aGF0IHdlIGNhbiBlYXNpbHkgcmVhdHRhY2ggaXQgd2hlbiBuZWNlc3NhcnlcclxuICAgIHRoaXMub2xkUGFyZW50ID0gbnVsbDtcclxuXHJcbiAgICAvLyBAcHVibGljIHtBcnJheS48SW5zdGFuY2U+fSAtIE5PVEU6IHJlbGlhbmNlIG9uIGNvcnJlY3Qgb3JkZXIgYWZ0ZXIgc3luY1RyZWUgYnkgYXQgbGVhc3QgU1ZHQmxvY2svU1ZHR3JvdXBcclxuICAgIHRoaXMuY2hpbGRyZW4gPSBjbGVhbkFycmF5KCB0aGlzLmNoaWxkcmVuICk7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge0luc3RhbmNlfG51bGx9IC0gcmVmZXJlbmNlIHRvIGEgc2hhcmVkIGNhY2hlIGluc3RhbmNlIChkaWZmZXJlbnQgdGhhbiBhIGNoaWxkKVxyXG4gICAgdGhpcy5zaGFyZWRDYWNoZUluc3RhbmNlID0gbnVsbDtcclxuXHJcbiAgICAvLyBpbml0aWFsaXplL2NsZWFuIHN1Yi1jb21wb25lbnRzXHJcbiAgICB0aGlzLnJlbGF0aXZlVHJhbnNmb3JtLmluaXRpYWxpemUoIGRpc3BsYXksIHRyYWlsICk7XHJcbiAgICB0aGlzLmZpdHRhYmlsaXR5LmluaXRpYWxpemUoIGRpc3BsYXksIHRyYWlsICk7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge0FycmF5LjxJbnN0YW5jZT59IC0gQ2hpbGQgaW5zdGFuY2VzIGFyZSBwdXNoZWQgdG8gaGVyZSB3aGVuIHRoZWlyIG5vZGUgaXMgcmVtb3ZlZCBmcm9tIG91ciBub2RlLlxyXG4gICAgLy8gV2UgZG9uJ3QgaW1tZWRpYXRlbHkgZGlzcG9zZSwgc2luY2UgaXQgbWF5IGJlIGFkZGVkIGJhY2suXHJcbiAgICB0aGlzLmluc3RhbmNlUmVtb3ZhbENoZWNrTGlzdCA9IGNsZWFuQXJyYXkoIHRoaXMuaW5zdGFuY2VSZW1vdmFsQ2hlY2tMaXN0ICk7XHJcblxyXG4gICAgLy8gQHB1YmxpYyB7RHJhd2FibGV8bnVsbH0gLSBPdXIgc2VsZi1kcmF3YWJsZSBpbiB0aGUgZHJhd2FibGUgdHJlZVxyXG4gICAgdGhpcy5zZWxmRHJhd2FibGUgPSBudWxsO1xyXG5cclxuICAgIC8vIEBwdWJsaWMge0RyYXdhYmxlfG51bGx9IC0gT3VyIGJhY2tib25lIG9yIG5vbi1zaGFyZWQgY2FjaGVcclxuICAgIHRoaXMuZ3JvdXBEcmF3YWJsZSA9IG51bGw7XHJcblxyXG4gICAgLy8gQHB1YmxpYyB7RHJhd2FibGV8bnVsbH0gLSBPdXIgZHJhd2FibGUgaWYgd2UgYXJlIGEgc2hhcmVkIGNhY2hlXHJcbiAgICB0aGlzLnNoYXJlZENhY2hlRHJhd2FibGUgPSBudWxsO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtEcmF3YWJsZX0gLSByZWZlcmVuY2VzIGludG8gdGhlIGxpbmtlZCBsaXN0IG9mIGRyYXdhYmxlcyAobnVsbCBpZiBub3RoaW5nIGlzIGRyYXdhYmxlIHVuZGVyIHRoaXMpXHJcbiAgICB0aGlzLmZpcnN0RHJhd2FibGUgPSBudWxsO1xyXG4gICAgdGhpcy5sYXN0RHJhd2FibGUgPSBudWxsO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtEcmF3YWJsZX0gLSByZWZlcmVuY2VzIGludG8gdGhlIGxpbmtlZCBsaXN0IG9mIGRyYXdhYmxlcyAoZXhjbHVkZXMgYW55IGdyb3VwIGRyYXdhYmxlcyBoYW5kbGluZylcclxuICAgIHRoaXMuZmlyc3RJbm5lckRyYXdhYmxlID0gbnVsbDtcclxuICAgIHRoaXMubGFzdElubmVyRHJhd2FibGUgPSBudWxsO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtBcnJheS48U1ZHR3JvdXA+fSAtIExpc3Qgb2YgU1ZHIGdyb3VwcyBhc3NvY2lhdGVkIHdpdGggdGhpcyBkaXNwbGF5IGluc3RhbmNlXHJcbiAgICB0aGlzLnN2Z0dyb3VwcyA9IGNsZWFuQXJyYXkoIHRoaXMuc3ZnR3JvdXBzICk7XHJcblxyXG4gICAgdGhpcy5jbGVhblN5bmNUcmVlUmVzdWx0cygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgb3IgY2xlYXJzIHByb3BlcnRpZXMgdGhhdCBhcmUgYWxsIHNldCBhcyBwc2V1ZG8gJ3JldHVybiB2YWx1ZXMnIG9mIHRoZSBzeW5jVHJlZSgpIG1ldGhvZC4gSXQgaXMgdGhlXHJcbiAgICogcmVzcG9uc2liaWxpdHkgb2YgdGhlIGNhbGxlciBvZiBzeW5jVHJlZSgpIHRvIGFmdGVyd2FyZHMgKG9wdGlvbmFsbHkgcmVhZCB0aGVzZSByZXN1bHRzIGFuZCkgY2xlYXIgdGhlIHJlZmVyZW5jZXNcclxuICAgKiB1c2luZyB0aGlzIG1ldGhvZCB0byBwcmV2ZW50IG1lbW9yeSBsZWFrcy5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogVE9ETzogY29uc2lkZXIgYSBwb29sIG9mIChvciBhIHNpbmdsZSBnbG9iYWwpIHR5cGVkIHJldHVybiBvYmplY3QocyksIHNpbmNlIHNldHRpbmcgdGhlc2UgdmFsdWVzIG9uIHRoZSBpbnN0YW5jZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAqIGdlbmVyYWxseSBtZWFucyBoaXR0aW5nIHRoZSBoZWFwLCBhbmQgY2FuIHNsb3cgdXMgZG93bi5cclxuICAgKi9cclxuICBjbGVhblN5bmNUcmVlUmVzdWx0cygpIHtcclxuICAgIC8vIFRyYWNraW5nIGJvdW5kaW5nIGluZGljZXMgLyBkcmF3YWJsZXMgZm9yIHdoYXQgaGFzIGNoYW5nZWQsIHNvIHdlIGRvbid0IGhhdmUgdG8gb3Zlci1zdGl0Y2ggdGhpbmdzLlxyXG5cclxuICAgIC8vIEBwcml2YXRlIHtudW1iZXJ9IC0gaWYgKG5vdCBpZmYpIGNoaWxkJ3MgaW5kZXggPD0gYmVmb3JlU3RhYmxlSW5kZXgsIGl0IGhhc24ndCBiZWVuIGFkZGVkL3JlbW92ZWQuIHJlbGV2YW50IHRvXHJcbiAgICAvLyBjdXJyZW50IGNoaWxkcmVuLlxyXG4gICAgdGhpcy5iZWZvcmVTdGFibGVJbmRleCA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtudW1iZXJ9IC0gaWYgKG5vdCBpZmYpIGNoaWxkJ3MgaW5kZXggPj0gYWZ0ZXJTdGFibGVJbmRleCwgaXQgaGFzbid0IGJlZW4gYWRkZWQvcmVtb3ZlZC4gcmVsZXZhbnQgdG9cclxuICAgIC8vIGN1cnJlbnQgY2hpbGRyZW4uXHJcbiAgICB0aGlzLmFmdGVyU3RhYmxlSW5kZXggPSAtMTtcclxuXHJcbiAgICAvLyBOT1RFOiBib3RoIG9mIHRoZXNlIGJlaW5nIG51bGwgaW5kaWNhdGVzIFwidGhlcmUgYXJlIG5vIGNoYW5nZSBpbnRlcnZhbHNcIiwgb3RoZXJ3aXNlIGl0IGFzc3VtZXMgaXQgcG9pbnRzIHRvXHJcbiAgICAvLyBhIGxpbmtlZC1saXN0IG9mIGNoYW5nZSBpbnRlcnZhbHMuIFdlIHVzZSB7Q2hhbmdlSW50ZXJ2YWx9cyB0byBob2xkIHRoaXMgaW5mb3JtYXRpb24sIHNlZSBDaGFuZ2VJbnRlcnZhbCB0byBzZWVcclxuICAgIC8vIHRoZSBpbmRpdmlkdWFsIHByb3BlcnRpZXMgdGhhdCBhcmUgY29uc2lkZXJlZCBwYXJ0IG9mIGEgY2hhbmdlIGludGVydmFsLlxyXG5cclxuICAgIC8vIEBwcml2YXRlIHtDaGFuZ2VJbnRlcnZhbH0sIGZpcnN0IGNoYW5nZSBpbnRlcnZhbCAoc2hvdWxkIGhhdmUgbmV4dENoYW5nZUludGVydmFsIGxpbmtlZC1saXN0IHRvXHJcbiAgICAvLyBsYXN0Q2hhbmdlSW50ZXJ2YWwpXHJcbiAgICB0aGlzLmZpcnN0Q2hhbmdlSW50ZXJ2YWwgPSBudWxsO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtDaGFuZ2VJbnRlcnZhbH0sIGxhc3QgY2hhbmdlIGludGVydmFsXHJcbiAgICB0aGlzLmxhc3RDaGFuZ2VJbnRlcnZhbCA9IG51bGw7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge2Jvb2xlYW59IC0gcmVuZGVyIHN0YXRlIGNoYW5nZSBmbGFncywgYWxsIHNldCBpbiB1cGRhdGVSZW5kZXJpbmdTdGF0ZSgpXHJcbiAgICB0aGlzLmluY29tcGF0aWJsZVN0YXRlQ2hhbmdlID0gZmFsc2U7IC8vIFdoZXRoZXIgd2UgbmVlZCB0byByZWNyZWF0ZSB0aGUgaW5zdGFuY2UgdHJlZVxyXG4gICAgdGhpcy5ncm91cENoYW5nZWQgPSBmYWxzZTsgLy8gV2hldGhlciB3ZSBuZWVkIHRvIGZvcmNlIGEgcmVidWlsZCBvZiB0aGUgZ3JvdXAgZHJhd2FibGVcclxuICAgIHRoaXMuY2FzY2FkaW5nU3RhdGVDaGFuZ2UgPSBmYWxzZTsgLy8gV2hldGhlciB3ZSBoYWQgYSByZW5kZXIgc3RhdGUgY2hhbmdlIHRoYXQgcmVxdWlyZXMgdmlzaXRpbmcgYWxsIGNoaWxkcmVuXHJcbiAgICB0aGlzLmFueVN0YXRlQ2hhbmdlID0gZmFsc2U7IC8vIFdoZXRoZXIgdGhlcmUgd2FzIGFueSBjaGFuZ2Ugb2YgcmVuZGVyaW5nIHN0YXRlIHdpdGggdGhlIGxhc3QgdXBkYXRlUmVuZGVyaW5nU3RhdGUoKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXBkYXRlcyB0aGUgcmVuZGVyaW5nIHN0YXRlIHByb3BlcnRpZXMsIGFuZCByZXR1cm5zIGEge2Jvb2xlYW59IGZsYWcgb2Ygd2hldGhlciBpdCB3YXMgc3VjY2Vzc2Z1bCBpZiB3ZSB3ZXJlXHJcbiAgICogYWxyZWFkeSBzdGF0ZWZ1bC5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogUmVuZGVyaW5nIHN0YXRlIHByb3BlcnRpZXMgZGV0ZXJtaW5lIGhvdyB3ZSBjb25zdHJ1Y3QgdGhlIGRyYXdhYmxlIHRyZWUgZnJvbSBvdXIgaW5zdGFuY2UgdHJlZSAoZS5nLiBkbyB3ZVxyXG4gICAqIGNyZWF0ZSBhbiBTVkcgb3IgQ2FudmFzIHJlY3RhbmdsZSwgd2hlcmUgdG8gcGxhY2UgQ1NTIHRyYW5zZm9ybXMsIGhvdyB0byBoYW5kbGUgb3BhY2l0eSwgZXRjLilcclxuICAgKlxyXG4gICAqIEluc3RhbmNlcyBzdGFydCBvdXQgYXMgJ3N0YXRlbGVzcycgdW50aWwgdXBkYXRlUmVuZGVyaW5nU3RhdGUoKSBpcyBjYWxsZWQgdGhlIGZpcnN0IHRpbWUuXHJcbiAgICpcclxuICAgKiBOb2RlIGNoYW5nZXMgdGhhdCBjYW4gY2F1c2UgYSBwb3RlbnRpYWwgc3RhdGUgY2hhbmdlICh1c2luZyBOb2RlIGV2ZW50IGxpc3RlbmVycyk6XHJcbiAgICogLSBoaW50c1xyXG4gICAqIC0gb3BhY2l0eVxyXG4gICAqIC0gY2xpcEFyZWFcclxuICAgKiAtIF9yZW5kZXJlclN1bW1hcnlcclxuICAgKiAtIF9yZW5kZXJlckJpdG1hc2tcclxuICAgKlxyXG4gICAqIFN0YXRlIGNoYW5nZXMgdGhhdCBjYW4gY2F1c2UgY2FzY2FkaW5nIHN0YXRlIGNoYW5nZXMgaW4gZGVzY2VuZGFudHM6XHJcbiAgICogLSBpc1VuZGVyQ2FudmFzQ2FjaGVcclxuICAgKiAtIHByZWZlcnJlZFJlbmRlcmVyc1xyXG4gICAqL1xyXG4gIHVwZGF0ZVJlbmRlcmluZ1N0YXRlKCkge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkluc3RhbmNlICYmIHNjZW5lcnlMb2cuSW5zdGFuY2UoIGB1cGRhdGVSZW5kZXJpbmdTdGF0ZSAke3RoaXMudG9TdHJpbmcoKVxyXG4gICAgfSR7dGhpcy5zdGF0ZWxlc3MgPyAnIChzdGF0ZWxlc3MpJyA6ICcnfWAgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnN0YW5jZSAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5JbnN0YW5jZSggYG9sZDogJHt0aGlzLmdldFN0YXRlU3RyaW5nKCl9YCApO1xyXG5cclxuICAgIC8vIG9sZCBzdGF0ZSBpbmZvcm1hdGlvbiwgc28gd2UgY2FuIGNvbXBhcmUgd2hhdCB3YXMgY2hhbmdlZFxyXG4gICAgY29uc3Qgd2FzQmFja2JvbmUgPSB0aGlzLmlzQmFja2JvbmU7XHJcbiAgICBjb25zdCB3YXNUcmFuc2Zvcm1lZCA9IHRoaXMuaXNUcmFuc2Zvcm1lZDtcclxuICAgIGNvbnN0IHdhc1Zpc2liaWxpdHlBcHBsaWVkID0gdGhpcy5pc1Zpc2liaWxpdHlBcHBsaWVkO1xyXG4gICAgY29uc3Qgd2FzSW5zdGFuY2VDYW52YXNDYWNoZSA9IHRoaXMuaXNJbnN0YW5jZUNhbnZhc0NhY2hlO1xyXG4gICAgY29uc3Qgd2FzU2hhcmVkQ2FudmFzQ2FjaGVTZWxmID0gdGhpcy5pc1NoYXJlZENhbnZhc0NhY2hlU2VsZjtcclxuICAgIGNvbnN0IHdhc1NoYXJlZENhbnZhc0NhY2hlUGxhY2Vob2xkZXIgPSB0aGlzLmlzU2hhcmVkQ2FudmFzQ2FjaGVQbGFjZWhvbGRlcjtcclxuICAgIGNvbnN0IHdhc1VuZGVyQ2FudmFzQ2FjaGUgPSB0aGlzLmlzVW5kZXJDYW52YXNDYWNoZTtcclxuICAgIGNvbnN0IG9sZFNlbGZSZW5kZXJlciA9IHRoaXMuc2VsZlJlbmRlcmVyO1xyXG4gICAgY29uc3Qgb2xkR3JvdXBSZW5kZXJlciA9IHRoaXMuZ3JvdXBSZW5kZXJlcjtcclxuICAgIGNvbnN0IG9sZFNoYXJlZENhY2hlUmVuZGVyZXIgPSB0aGlzLnNoYXJlZENhY2hlUmVuZGVyZXI7XHJcbiAgICBjb25zdCBvbGRQcmVmZXJyZWRSZW5kZXJlcnMgPSB0aGlzLnByZWZlcnJlZFJlbmRlcmVycztcclxuXHJcbiAgICAvLyBkZWZhdWx0IHZhbHVlcyB0byBzZXQgKG1ha2VzIHRoZSBsb2dpYyBtdWNoIHNpbXBsZXIpXHJcbiAgICB0aGlzLmlzQmFja2JvbmUgPSBmYWxzZTtcclxuICAgIHRoaXMuaXNUcmFuc2Zvcm1lZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5pc1Zpc2liaWxpdHlBcHBsaWVkID0gZmFsc2U7XHJcbiAgICB0aGlzLmlzSW5zdGFuY2VDYW52YXNDYWNoZSA9IGZhbHNlO1xyXG4gICAgdGhpcy5pc1NoYXJlZENhbnZhc0NhY2hlU2VsZiA9IGZhbHNlO1xyXG4gICAgdGhpcy5pc1NoYXJlZENhbnZhc0NhY2hlUGxhY2Vob2xkZXIgPSBmYWxzZTtcclxuICAgIHRoaXMuc2VsZlJlbmRlcmVyID0gMDtcclxuICAgIHRoaXMuZ3JvdXBSZW5kZXJlciA9IDA7XHJcbiAgICB0aGlzLnNoYXJlZENhY2hlUmVuZGVyZXIgPSAwO1xyXG5cclxuICAgIGNvbnN0IG5vZGUgPSB0aGlzLm5vZGU7XHJcblxyXG4gICAgdGhpcy5pc1VuZGVyQ2FudmFzQ2FjaGUgPSB0aGlzLmlzU2hhcmVkQ2FudmFzQ2FjaGVSb290IHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICggdGhpcy5wYXJlbnQgPyAoIHRoaXMucGFyZW50LmlzVW5kZXJDYW52YXNDYWNoZSB8fCB0aGlzLnBhcmVudC5pc0luc3RhbmNlQ2FudmFzQ2FjaGUgfHwgdGhpcy5wYXJlbnQuaXNTaGFyZWRDYW52YXNDYWNoZVNlbGYgKSA6IGZhbHNlICk7XHJcblxyXG4gICAgLy8gc2V0IHVwIG91ciBwcmVmZXJyZWQgcmVuZGVyZXIgbGlzdCAoZ2VuZXJhbGx5IGJhc2VkIG9uIHRoZSBwYXJlbnQpXHJcbiAgICB0aGlzLnByZWZlcnJlZFJlbmRlcmVycyA9IHRoaXMucGFyZW50ID8gdGhpcy5wYXJlbnQucHJlZmVycmVkUmVuZGVyZXJzIDogZGVmYXVsdFByZWZlcnJlZFJlbmRlcmVycztcclxuICAgIC8vIGFsbG93IHRoZSBub2RlIHRvIG1vZGlmeSBpdHMgcHJlZmVycmVkIHJlbmRlcmVycyAoYW5kIHRob3NlIG9mIGl0cyBkZXNjZW5kYW50cylcclxuICAgIGlmICggbm9kZS5fcmVuZGVyZXIgKSB7XHJcbiAgICAgIHRoaXMucHJlZmVycmVkUmVuZGVyZXJzID0gUmVuZGVyZXIucHVzaE9yZGVyQml0bWFzayggdGhpcy5wcmVmZXJyZWRSZW5kZXJlcnMsIG5vZGUuX3JlbmRlcmVyICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgaGFzQ2xpcCA9IHRoaXMubm9kZS5oYXNDbGlwQXJlYSgpO1xyXG4gICAgY29uc3QgaGFzRmlsdGVycyA9IHRoaXMubm9kZS5lZmZlY3RpdmVPcGFjaXR5ICE9PSAxIHx8IG5vZGUuX3VzZXNPcGFjaXR5IHx8IHRoaXMubm9kZS5fZmlsdGVycy5sZW5ndGggPiAwO1xyXG4gICAgLy8gbGV0IGhhc05vbkRPTUZpbHRlciA9IGZhbHNlO1xyXG4gICAgbGV0IGhhc05vblNWR0ZpbHRlciA9IGZhbHNlO1xyXG4gICAgbGV0IGhhc05vbkNhbnZhc0ZpbHRlciA9IGZhbHNlO1xyXG4gICAgLy8gbGV0IGhhc05vbldlYkdMRmlsdGVyID0gZmFsc2U7XHJcbiAgICBpZiAoIGhhc0ZpbHRlcnMgKSB7XHJcbiAgICAgIC8vIE5PVEU6IG9wYWNpdHkgaXMgT0sgd2l0aCBhbGwgb2YgdGhvc2UgKGN1cnJlbnRseSlcclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5ub2RlLl9maWx0ZXJzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIGNvbnN0IGZpbHRlciA9IHRoaXMubm9kZS5fZmlsdGVyc1sgaSBdO1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBob3cgdG8gaGFuZGxlIHRoaXMsIGlmIHdlIHNwbGl0IEFUIHRoZSBub2RlPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICAgIC8vIGlmICggIWZpbHRlci5pc0RPTUNvbXBhdGlibGUoKSApIHtcclxuICAgICAgICAvLyAgIGhhc05vbkRPTUZpbHRlciA9IHRydWU7XHJcbiAgICAgICAgLy8gfVxyXG4gICAgICAgIGlmICggIWZpbHRlci5pc1NWR0NvbXBhdGlibGUoKSApIHtcclxuICAgICAgICAgIGhhc05vblNWR0ZpbHRlciA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggIWZpbHRlci5pc0NhbnZhc0NvbXBhdGlibGUoKSApIHtcclxuICAgICAgICAgIGhhc05vbkNhbnZhc0ZpbHRlciA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGlmICggIWZpbHRlci5pc1dlYkdMQ29tcGF0aWJsZSgpICkge1xyXG4gICAgICAgIC8vICAgaGFzTm9uV2ViR0xGaWx0ZXIgPSB0cnVlO1xyXG4gICAgICAgIC8vIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgY29uc3QgcmVxdWlyZXNTcGxpdCA9IG5vZGUuX2Nzc1RyYW5zZm9ybSB8fCBub2RlLl9sYXllclNwbGl0O1xyXG4gICAgY29uc3QgYmFja2JvbmVSZXF1aXJlZCA9IHRoaXMuaXNEaXNwbGF5Um9vdCB8fCAoICF0aGlzLmlzVW5kZXJDYW52YXNDYWNoZSAmJiByZXF1aXJlc1NwbGl0ICk7XHJcblxyXG4gICAgLy8gU3VwcG9ydCBlaXRoZXIgXCJhbGwgQ2FudmFzXCIgb3IgXCJhbGwgU1ZHXCIgb3BhY2l0eS9jbGlwXHJcbiAgICBjb25zdCBhcHBseVRyYW5zcGFyZW5jeVdpdGhCbG9jayA9ICFiYWNrYm9uZVJlcXVpcmVkICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICggaGFzRmlsdGVycyB8fCBoYXNDbGlwICkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCAoICFoYXNOb25TVkdGaWx0ZXIgJiYgdGhpcy5ub2RlLl9yZW5kZXJlclN1bW1hcnkuaXNTdWJ0cmVlUmVuZGVyZWRFeGNsdXNpdmVseVNWRyggdGhpcy5wcmVmZXJyZWRSZW5kZXJlcnMgKSApIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCAhaGFzTm9uQ2FudmFzRmlsdGVyICYmIHRoaXMubm9kZS5fcmVuZGVyZXJTdW1tYXJ5LmlzU3VidHJlZVJlbmRlcmVkRXhjbHVzaXZlbHlDYW52YXMoIHRoaXMucHJlZmVycmVkUmVuZGVyZXJzICkgKSApO1xyXG4gICAgY29uc3QgdXNlQmFja2JvbmUgPSBhcHBseVRyYW5zcGFyZW5jeVdpdGhCbG9jayA/IGZhbHNlIDogKCBiYWNrYm9uZVJlcXVpcmVkIHx8IGhhc0ZpbHRlcnMgfHwgaGFzQ2xpcCApO1xyXG5cclxuICAgIC8vIGNoZWNrIGlmIHdlIG5lZWQgYSBiYWNrYm9uZSBvciBjYWNoZVxyXG4gICAgLy8gaWYgd2UgYXJlIHVuZGVyIGEgY2FudmFzIGNhY2hlLCB3ZSB3aWxsIE5FVkVSIGhhdmUgYSBiYWNrYm9uZVxyXG4gICAgLy8gc3BsaXRzIGFyZSBhY2NvbXBsaXNoZWQganVzdCBieSBoYXZpbmcgYSBiYWNrYm9uZVxyXG4gICAgLy8gTk9URTogSWYgY2hhbmdpbmcsIGNoZWNrIFJlbmRlcmVyU3VtbWFyeS5zdW1tYXJ5Qml0bWFza0Zvck5vZGVTZWxmXHJcbiAgICAvL09IVFdPIFRPRE86IFVwZGF0ZSB0aGlzIHRvIHByb3Blcmx5IGlkZW50aWZ5IHdoZW4gYmFja2JvbmVzIGFyZSBuZWNlc3NhcnkvYW5kLW9yIHdoZW4gd2UgZm9yd2FyZCBvcGFjaXR5L2NsaXBwaW5nIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICBpZiAoIHVzZUJhY2tib25lICkge1xyXG4gICAgICB0aGlzLmlzQmFja2JvbmUgPSB0cnVlO1xyXG4gICAgICB0aGlzLmlzVmlzaWJpbGl0eUFwcGxpZWQgPSB0cnVlO1xyXG4gICAgICB0aGlzLmlzVHJhbnNmb3JtZWQgPSB0aGlzLmlzRGlzcGxheVJvb3QgfHwgISFub2RlLl9jc3NUcmFuc2Zvcm07IC8vIGZvciBub3csIG9ubHkgdHJpZ2dlciBDU1MgdHJhbnNmb3JtIGlmIHdlIGhhdmUgdGhlIHNwZWNpZmljIGhpbnRcclxuICAgICAgLy9PSFRXTyBUT0RPOiBjaGVjayB3aGV0aGVyIHRoZSBmb3JjZSBhY2NlbGVyYXRpb24gaGludCBpcyBiZWluZyB1c2VkIGJ5IG91ciBET01CbG9jayBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICB0aGlzLmdyb3VwUmVuZGVyZXIgPSBSZW5kZXJlci5iaXRtYXNrRE9NOyAvLyBwcm9iYWJseSB3b24ndCBiZSB1c2VkXHJcbiAgICB9XHJcbiAgICAvLyBUT0RPOiBub2RlLl9jYW52YXNDYWNoZSBoaW50IG5vdCBkZWZpbmVkLCBhbHdheXMgdW5kZWZpbmVkIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICBlbHNlIGlmICggIWFwcGx5VHJhbnNwYXJlbmN5V2l0aEJsb2NrICYmICggaGFzRmlsdGVycyB8fCBoYXNDbGlwIHx8IG5vZGUuX2NhbnZhc0NhY2hlICkgKSB7XHJcbiAgICAgIC8vIGV2ZXJ5dGhpbmcgdW5kZXJuZWF0aCBuZWVkcyB0byBiZSByZW5kZXJhYmxlIHdpdGggQ2FudmFzLCBvdGhlcndpc2Ugd2UgY2Fubm90IGNhY2hlXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMubm9kZS5fcmVuZGVyZXJTdW1tYXJ5LmlzU2luZ2xlQ2FudmFzU3VwcG9ydGVkKCksXHJcbiAgICAgICAgYE5vZGUgY2FudmFzQ2FjaGUgcHJvdmlkZWQsIGJ1dCBub3QgYWxsIG5vZGUgY29udGVudHMgY2FuIGJlIHJlbmRlcmVkIHdpdGggQ2FudmFzIHVuZGVyICR7XHJcbiAgICAgICAgICB0aGlzLm5vZGUuY29uc3RydWN0b3IubmFtZX1gICk7XHJcblxyXG4gICAgICAvLyBUT0RPOiBub2RlLl9zaW5nbGVDYWNoZSBoaW50IG5vdCBkZWZpbmVkLCBhbHdheXMgdW5kZWZpbmVkIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAgIGlmICggbm9kZS5fc2luZ2xlQ2FjaGUgKSB7XHJcbiAgICAgICAgLy8gVE9ETzogc2NhbGUgb3B0aW9ucyAtIGZpeGVkIHNpemUsIG1hdGNoIGhpZ2hlc3QgcmVzb2x1dGlvbiAoYWRhcHRpdmUpLCBvciBtaXBtYXBwZWQgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgICBpZiAoIHRoaXMuaXNTaGFyZWRDYW52YXNDYWNoZVJvb3QgKSB7XHJcbiAgICAgICAgICB0aGlzLmlzU2hhcmVkQ2FudmFzQ2FjaGVTZWxmID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICB0aGlzLnNoYXJlZENhY2hlUmVuZGVyZXIgPSB0aGlzLmlzV2ViR0xTdXBwb3J0ZWQgPyBSZW5kZXJlci5iaXRtYXNrV2ViR0wgOiBSZW5kZXJlci5iaXRtYXNrQ2FudmFzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIC8vIGV2ZXJ5dGhpbmcgdW5kZXJuZWF0aCBuZWVkcyB0byBndWFyYW50ZWUgdGhhdCBpdHMgYm91bmRzIGFyZSB2YWxpZFxyXG4gICAgICAgICAgLy9PSFRXTyBUT0RPOiBXZSdsbCBwcm9iYWJseSByZW1vdmUgdGhpcyBpZiB3ZSBnbyB3aXRoIHRoZSBcInNhZmUgYm91bmRzXCIgYXBwcm9hY2ggaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMubm9kZS5fcmVuZGVyZXJTdW1tYXJ5LmFyZUJvdW5kc1ZhbGlkKCksXHJcbiAgICAgICAgICAgIGBOb2RlIHNpbmdsZUNhY2hlIHByb3ZpZGVkLCBidXQgbm90IGFsbCBub2RlIGNvbnRlbnRzIGhhdmUgdmFsaWQgYm91bmRzIHVuZGVyICR7XHJcbiAgICAgICAgICAgICAgdGhpcy5ub2RlLmNvbnN0cnVjdG9yLm5hbWV9YCApO1xyXG5cclxuICAgICAgICAgIHRoaXMuaXNTaGFyZWRDYW52YXNDYWNoZVBsYWNlaG9sZGVyID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdGhpcy5pc0luc3RhbmNlQ2FudmFzQ2FjaGUgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuaXNVbmRlckNhbnZhc0NhY2hlID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmdyb3VwUmVuZGVyZXIgPSB0aGlzLmlzV2ViR0xTdXBwb3J0ZWQgPyBSZW5kZXJlci5iaXRtYXNrV2ViR0wgOiBSZW5kZXJlci5iaXRtYXNrQ2FudmFzO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0aGlzLm5vZGUuaXNQYWludGVkKCkgKSB7XHJcbiAgICAgIGlmICggdGhpcy5pc1VuZGVyQ2FudmFzQ2FjaGUgKSB7XHJcbiAgICAgICAgdGhpcy5zZWxmUmVuZGVyZXIgPSBSZW5kZXJlci5iaXRtYXNrQ2FudmFzO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGxldCBzdXBwb3J0ZWROb2RlQml0bWFzayA9IHRoaXMubm9kZS5fcmVuZGVyZXJCaXRtYXNrO1xyXG4gICAgICAgIGlmICggIXRoaXMuaXNXZWJHTFN1cHBvcnRlZCApIHtcclxuICAgICAgICAgIGNvbnN0IGludmFsaWRCaXRtYXNrcyA9IFJlbmRlcmVyLmJpdG1hc2tXZWJHTDtcclxuICAgICAgICAgIHN1cHBvcnRlZE5vZGVCaXRtYXNrID0gc3VwcG9ydGVkTm9kZUJpdG1hc2sgXiAoIHN1cHBvcnRlZE5vZGVCaXRtYXNrICYgaW52YWxpZEJpdG1hc2tzICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyB1c2UgdGhlIHByZWZlcnJlZCByZW5kZXJpbmcgb3JkZXIgaWYgc3BlY2lmaWVkLCBvdGhlcndpc2UgdXNlIHRoZSBkZWZhdWx0XHJcbiAgICAgICAgdGhpcy5zZWxmUmVuZGVyZXIgPSAoIHN1cHBvcnRlZE5vZGVCaXRtYXNrICYgUmVuZGVyZXIuYml0bWFza09yZGVyKCB0aGlzLnByZWZlcnJlZFJlbmRlcmVycywgMCApICkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICggc3VwcG9ydGVkTm9kZUJpdG1hc2sgJiBSZW5kZXJlci5iaXRtYXNrT3JkZXIoIHRoaXMucHJlZmVycmVkUmVuZGVyZXJzLCAxICkgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKCBzdXBwb3J0ZWROb2RlQml0bWFzayAmIFJlbmRlcmVyLmJpdG1hc2tPcmRlciggdGhpcy5wcmVmZXJyZWRSZW5kZXJlcnMsIDIgKSApIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoIHN1cHBvcnRlZE5vZGVCaXRtYXNrICYgUmVuZGVyZXIuYml0bWFza09yZGVyKCB0aGlzLnByZWZlcnJlZFJlbmRlcmVycywgMyApICkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICggc3VwcG9ydGVkTm9kZUJpdG1hc2sgJiBSZW5kZXJlci5iaXRtYXNrU1ZHICkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICggc3VwcG9ydGVkTm9kZUJpdG1hc2sgJiBSZW5kZXJlci5iaXRtYXNrQ2FudmFzICkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICggc3VwcG9ydGVkTm9kZUJpdG1hc2sgJiBSZW5kZXJlci5iaXRtYXNrRE9NICkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICggc3VwcG9ydGVkTm9kZUJpdG1hc2sgJiBSZW5kZXJlci5iaXRtYXNrV2ViR0wgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgMDtcclxuXHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5zZWxmUmVuZGVyZXIsICdzZXRTZWxmUmVuZGVyZXIgZmFpbHVyZT8nICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyB3aGV0aGVyIHdlIG5lZWQgdG8gZm9yY2UgcmVidWlsZGluZyB0aGUgZ3JvdXAgZHJhd2FibGVcclxuICAgIHRoaXMuZ3JvdXBDaGFuZ2VkID0gKCB3YXNCYWNrYm9uZSAhPT0gdGhpcy5pc0JhY2tib25lICkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgKCB3YXNJbnN0YW5jZUNhbnZhc0NhY2hlICE9PSB0aGlzLmlzSW5zdGFuY2VDYW52YXNDYWNoZSApIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICggd2FzU2hhcmVkQ2FudmFzQ2FjaGVTZWxmICE9PSB0aGlzLmlzU2hhcmVkQ2FudmFzQ2FjaGVTZWxmICk7XHJcblxyXG4gICAgLy8gd2hldGhlciBhbnkgb2Ygb3VyIHJlbmRlciBzdGF0ZSBjaGFuZ2VzIGNhbiBjaGFuZ2UgZGVzY2VuZGFudCByZW5kZXIgc3RhdGVzXHJcbiAgICB0aGlzLmNhc2NhZGluZ1N0YXRlQ2hhbmdlID0gKCB3YXNVbmRlckNhbnZhc0NhY2hlICE9PSB0aGlzLmlzVW5kZXJDYW52YXNDYWNoZSApIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCBvbGRQcmVmZXJyZWRSZW5kZXJlcnMgIT09IHRoaXMucHJlZmVycmVkUmVuZGVyZXJzICk7XHJcblxyXG4gICAgLypcclxuICAgICAqIFdoZXRoZXIgd2UgY2FuIGp1c3QgdXBkYXRlIHRoZSBzdGF0ZSBvbiBhbiBJbnN0YW5jZSB3aGVuIGNoYW5naW5nIGZyb20gdGhpcyBzdGF0ZSA9PiBvdGhlclN0YXRlLlxyXG4gICAgICogVGhpcyBpcyBnZW5lcmFsbHkgbm90IHBvc3NpYmxlIGlmIHRoZXJlIGlzIGEgY2hhbmdlIGluIHdoZXRoZXIgdGhlIGluc3RhbmNlIHNob3VsZCBiZSBhIHRyYW5zZm9ybSByb290XHJcbiAgICAgKiAoZS5nLiBiYWNrYm9uZS9zaW5nbGUtY2FjaGUpLCBzbyB3ZSB3aWxsIGhhdmUgdG8gcmVjcmVhdGUgdGhlIGluc3RhbmNlIGFuZCBpdHMgc3VidHJlZSBpZiB0aGF0IGlzIHRoZSBjYXNlLlxyXG4gICAgICpcclxuICAgICAqIE9ubHkgcmVsZXZhbnQgaWYgd2Ugd2VyZSBwcmV2aW91c2x5IHN0YXRlZnVsLCBzbyBpdCBjYW4gYmUgaWdub3JlZCBpZiB0aGlzIGlzIG91ciBmaXJzdCB1cGRhdGVSZW5kZXJpbmdTdGF0ZSgpXHJcbiAgICAgKi9cclxuICAgIHRoaXMuaW5jb21wYXRpYmxlU3RhdGVDaGFuZ2UgPSAoIHRoaXMuaXNUcmFuc2Zvcm1lZCAhPT0gd2FzVHJhbnNmb3JtZWQgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICggdGhpcy5pc1NoYXJlZENhbnZhc0NhY2hlUGxhY2Vob2xkZXIgIT09IHdhc1NoYXJlZENhbnZhc0NhY2hlUGxhY2Vob2xkZXIgKTtcclxuXHJcbiAgICAvLyB3aGV0aGVyIHRoZXJlIHdhcyBhbnkgcmVuZGVyIHN0YXRlIGNoYW5nZVxyXG4gICAgdGhpcy5hbnlTdGF0ZUNoYW5nZSA9IHRoaXMuZ3JvdXBDaGFuZ2VkIHx8IHRoaXMuY2FzY2FkaW5nU3RhdGVDaGFuZ2UgfHwgdGhpcy5pbmNvbXBhdGlibGVTdGF0ZUNoYW5nZSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICggb2xkU2VsZlJlbmRlcmVyICE9PSB0aGlzLnNlbGZSZW5kZXJlciApIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKCBvbGRHcm91cFJlbmRlcmVyICE9PSB0aGlzLmdyb3VwUmVuZGVyZXIgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICggb2xkU2hhcmVkQ2FjaGVSZW5kZXJlciAhPT0gdGhpcy5zaGFyZWRDYWNoZVJlbmRlcmVyICk7XHJcblxyXG4gICAgLy8gaWYgb3VyIHZpc2liaWxpdHkgYXBwbGljYXRpb25zIGNoYW5nZWQsIHVwZGF0ZSB0aGUgZW50aXJlIHN1YnRyZWVcclxuICAgIGlmICggd2FzVmlzaWJpbGl0eUFwcGxpZWQgIT09IHRoaXMuaXNWaXNpYmlsaXR5QXBwbGllZCApIHtcclxuICAgICAgdGhpcy52aXNpYmlsaXR5RGlydHkgPSB0cnVlO1xyXG4gICAgICB0aGlzLnBhcmVudCAmJiB0aGlzLnBhcmVudC5tYXJrQ2hpbGRWaXNpYmlsaXR5RGlydHkoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiBvdXIgZml0dGFiaWxpdHkgaGFzIGNoYW5nZWQsIHByb3BhZ2F0ZSB0aG9zZSBjaGFuZ2VzLiAoSXQncyBnZW5lcmFsbHkgYSBoaW50IGNoYW5nZSB3aGljaCB3aWxsIHRyaWdnZXIgYW5cclxuICAgIC8vIHVwZGF0ZSBvZiByZW5kZXJpbmcgc3RhdGUpLlxyXG4gICAgdGhpcy5maXR0YWJpbGl0eS5jaGVja1NlbGZGaXR0YWJpbGl0eSgpO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnN0YW5jZSAmJiBzY2VuZXJ5TG9nLkluc3RhbmNlKCBgbmV3OiAke3RoaXMuZ2V0U3RhdGVTdHJpbmcoKX1gICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgc2hvcnQgc3RyaW5nIHRoYXQgY29udGFpbnMgYSBzdW1tYXJ5IG9mIHRoZSByZW5kZXJpbmcgc3RhdGUsIGZvciBkZWJ1Z2dpbmcvbG9nZ2luZyBwdXJwb3Nlcy5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAqL1xyXG4gIGdldFN0YXRlU3RyaW5nKCkge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gYFNbICR7XHJcbiAgICAgIHRoaXMuaXNEaXNwbGF5Um9vdCA/ICdkaXNwbGF5Um9vdCAnIDogJydcclxuICAgIH0ke3RoaXMuaXNCYWNrYm9uZSA/ICdiYWNrYm9uZSAnIDogJydcclxuICAgIH0ke3RoaXMuaXNJbnN0YW5jZUNhbnZhc0NhY2hlID8gJ2luc3RhbmNlQ2FjaGUgJyA6ICcnXHJcbiAgICB9JHt0aGlzLmlzU2hhcmVkQ2FudmFzQ2FjaGVQbGFjZWhvbGRlciA/ICdzaGFyZWRDYWNoZVBsYWNlaG9sZGVyICcgOiAnJ1xyXG4gICAgfSR7dGhpcy5pc1NoYXJlZENhbnZhc0NhY2hlU2VsZiA/ICdzaGFyZWRDYWNoZVNlbGYgJyA6ICcnXHJcbiAgICB9JHt0aGlzLmlzVHJhbnNmb3JtZWQgPyAnVFIgJyA6ICcnXHJcbiAgICB9JHt0aGlzLmlzVmlzaWJpbGl0eUFwcGxpZWQgPyAnVklTICcgOiAnJ1xyXG4gICAgfSR7dGhpcy5zZWxmUmVuZGVyZXIgPyB0aGlzLnNlbGZSZW5kZXJlci50b1N0cmluZyggMTYgKSA6ICctJ30sJHtcclxuICAgICAgdGhpcy5ncm91cFJlbmRlcmVyID8gdGhpcy5ncm91cFJlbmRlcmVyLnRvU3RyaW5nKCAxNiApIDogJy0nfSwke1xyXG4gICAgICB0aGlzLnNoYXJlZENhY2hlUmVuZGVyZXIgPyB0aGlzLnNoYXJlZENhY2hlUmVuZGVyZXIudG9TdHJpbmcoIDE2ICkgOiAnLSd9IGA7XHJcbiAgICByZXR1cm4gYCR7cmVzdWx0fV1gO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIG1haW4gZW50cnkgcG9pbnQgZm9yIHN5bmNUcmVlKCksIGNhbGxlZCBvbiB0aGUgcm9vdCBpbnN0YW5jZS4gU2VlIHN5bmNUcmVlKCkgZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgICogQHB1YmxpY1xyXG4gICAqL1xyXG4gIGJhc2VTeW5jVHJlZSgpIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuaXNEaXNwbGF5Um9vdCwgJ2Jhc2VTeW5jVHJlZSgpIHNob3VsZCBvbmx5IGJlIGNhbGxlZCBvbiB0aGUgcm9vdCBpbnN0YW5jZScgKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5JbnN0YW5jZSggYC0tLS0tLS0tIFNUQVJUIGJhc2VTeW5jVHJlZSAke3RoaXMudG9TdHJpbmcoKX0gLS0tLS0tLS1gICk7XHJcbiAgICB0aGlzLnN5bmNUcmVlKCk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5JbnN0YW5jZSggYC0tLS0tLS0tIEVORCBiYXNlU3luY1RyZWUgJHt0aGlzLnRvU3RyaW5nKCl9IC0tLS0tLS0tYCApO1xyXG4gICAgdGhpcy5jbGVhblN5bmNUcmVlUmVzdWx0cygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXBkYXRlcyB0aGUgcmVuZGVyaW5nIHN0YXRlLCBzeW5jaHJvbml6ZXMgdGhlIGluc3RhbmNlIHN1Yi10cmVlIChzbyB0aGF0IG91ciBpbnN0YW5jZSB0cmVlIG1hdGNoZXNcclxuICAgKiB0aGUgTm9kZSB0cmVlIHRoZSBjbGllbnQgcHJvdmlkZWQpLCBhbmQgYmFjay1wcm9wYWdhdGVzIHtDaGFuZ2VJbnRlcnZhbH0gaW5mb3JtYXRpb24gZm9yIHN0aXRjaGluZyBiYWNrYm9uZXNcclxuICAgKiBhbmQvb3IgY2FjaGVzLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBzeW5jVHJlZSgpIGFsc28gc2V0cyBhIG51bWJlciBvZiBwc2V1ZG8gJ3JldHVybiB2YWx1ZXMnIChkb2N1bWVudGVkIGluIGNsZWFuU3luY1RyZWVSZXN1bHRzKCkpLiBBZnRlciBjYWxsaW5nXHJcbiAgICogc3luY1RyZWUoKSBhbmQgb3B0aW9uYWxseSByZWFkaW5nIHRob3NlIHJlc3VsdHMsIGNsZWFuU3luY1RyZWVSZXN1bHRzKCkgc2hvdWxkIGJlIGNhbGxlZCBvbiB0aGUgc2FtZSBpbnN0YW5jZVxyXG4gICAqIGluIG9yZGVyIHRvIHByZXZlbnQgbWVtb3J5IGxlYWtzLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gV2hldGhlciB0aGUgc3luYyB3YXMgcG9zc2libGUuIElmIGl0IHdhc24ndCwgYSBuZXcgaW5zdGFuY2Ugc3VidHJlZSB3aWxsIG5lZWQgdG8gYmUgY3JlYXRlZC5cclxuICAgKi9cclxuICBzeW5jVHJlZSgpIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnN0YW5jZSAmJiBzY2VuZXJ5TG9nLkluc3RhbmNlKCBgc3luY1RyZWUgJHt0aGlzLnRvU3RyaW5nKCl9ICR7dGhpcy5nZXRTdGF0ZVN0cmluZygpXHJcbiAgICB9JHt0aGlzLnN0YXRlbGVzcyA/ICcgKHN0YXRlbGVzcyknIDogJyd9YCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkluc3RhbmNlICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIGlmICggc2NlbmVyeUxvZyAmJiBzY2VuZXJ5LmlzTG9nZ2luZ1BlcmZvcm1hbmNlKCkgKSB7XHJcbiAgICAgIHRoaXMuZGlzcGxheS5wZXJmU3luY1RyZWVDb3VudCsrO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIG1heSBhY2Nlc3MgaXNUcmFuc2Zvcm1lZCB1cCB0byByb290IHRvIGRldGVybWluZSByZWxhdGl2ZSB0cmFpbHNcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLnBhcmVudCB8fCAhdGhpcy5wYXJlbnQuc3RhdGVsZXNzLCAnV2Ugc2hvdWxkIG5vdCBoYXZlIGEgc3RhdGVsZXNzIHBhcmVudCBpbnN0YW5jZScgKTtcclxuXHJcbiAgICBjb25zdCB3YXNTdGF0ZWxlc3MgPSB0aGlzLnN0YXRlbGVzcztcclxuICAgIGlmICggd2FzU3RhdGVsZXNzIHx8XHJcbiAgICAgICAgICggdGhpcy5wYXJlbnQgJiYgdGhpcy5wYXJlbnQuY2FzY2FkaW5nU3RhdGVDaGFuZ2UgKSB8fCAvLyBpZiBvdXIgcGFyZW50IGhhZCBjYXNjYWRpbmcgc3RhdGUgY2hhbmdlcywgd2UgbmVlZCB0byByZWNvbXB1dGVcclxuICAgICAgICAgKCB0aGlzLnJlbmRlclN0YXRlRGlydHlGcmFtZSA9PT0gdGhpcy5kaXNwbGF5Ll9mcmFtZUlkICkgKSB7IC8vIGlmIG91ciByZW5kZXIgc3RhdGUgaXMgZGlydHlcclxuICAgICAgdGhpcy51cGRhdGVSZW5kZXJpbmdTdGF0ZSgpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIHdlIGNhbiBjaGVjayB3aGV0aGVyIHVwZGF0aW5nIHN0YXRlIHdvdWxkIGhhdmUgbWFkZSBhbnkgY2hhbmdlcyB3aGVuIHdlIHNraXAgaXQgKGZvciBzbG93IGFzc2VydGlvbnMpXHJcbiAgICAgIGlmICggYXNzZXJ0U2xvdyApIHtcclxuICAgICAgICB0aGlzLnVwZGF0ZVJlbmRlcmluZ1N0YXRlKCk7XHJcbiAgICAgICAgYXNzZXJ0U2xvdyggIXRoaXMuYW55U3RhdGVDaGFuZ2UgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICggIXdhc1N0YXRlbGVzcyAmJiB0aGlzLmluY29tcGF0aWJsZVN0YXRlQ2hhbmdlICkge1xyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5JbnN0YW5jZSggYGluY29tcGF0aWJsZSBpbnN0YW5jZSAke3RoaXMudG9TdHJpbmcoKX0gJHt0aGlzLmdldFN0YXRlU3RyaW5nKCl9LCBhYm9ydGluZ2AgKTtcclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkluc3RhbmNlICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcblxyXG4gICAgICAvLyBUaGUgZmFsc2UgcmV0dXJuIHdpbGwgc2lnbmFsIHRoYXQgYSBuZXcgaW5zdGFuY2UgbmVlZHMgdG8gYmUgdXNlZC4gb3VyIHRyZWUgd2lsbCBiZSBkaXNwb3NlZCBzb29uLlxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICB0aGlzLnN0YXRlbGVzcyA9IGZhbHNlO1xyXG5cclxuICAgIC8vIG5vIG5lZWQgdG8gb3ZlcndyaXRlLCBzaG91bGQgYWx3YXlzIGJlIHRoZSBzYW1lXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhd2FzU3RhdGVsZXNzIHx8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoID09PSAwLFxyXG4gICAgICAnV2Ugc2hvdWxkIG5vdCBoYXZlIGNoaWxkIGluc3RhbmNlcyBvbiBhbiBpbnN0YW5jZSB3aXRob3V0IHN0YXRlJyApO1xyXG5cclxuICAgIGlmICggd2FzU3RhdGVsZXNzICkge1xyXG4gICAgICAvLyBJZiB3ZSBhcmUgYSB0cmFuc2Zvcm0gcm9vdCwgbm90aWZ5IHRoZSBkaXNwbGF5IHRoYXQgd2UgYXJlIGRpcnR5LiBXZSdsbCBiZSB2YWxpZGF0ZWQgd2hlbiBpdCdzIGF0IHRoYXQgcGhhc2VcclxuICAgICAgLy8gYXQgdGhlIG5leHQgdXBkYXRlRGlzcGxheSgpLlxyXG4gICAgICBpZiAoIHRoaXMuaXNUcmFuc2Zvcm1lZCApIHtcclxuICAgICAgICB0aGlzLmRpc3BsYXkubWFya1RyYW5zZm9ybVJvb3REaXJ0eSggdGhpcywgdHJ1ZSApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmF0dGFjaE5vZGVMaXN0ZW5lcnMoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUT0RPOiBwcnVuaW5nIG9mIHNoYXJlZCBjYWNoZXMgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgIGlmICggdGhpcy5pc1NoYXJlZENhbnZhc0NhY2hlUGxhY2Vob2xkZXIgKSB7XHJcbiAgICAgIHRoaXMuc2hhcmVkU3luY1RyZWUoKTtcclxuICAgIH1cclxuICAgIC8vIHBydW5pbmcgc28gdGhhdCBpZiBubyBjaGFuZ2VzIHdvdWxkIGFmZmVjdCBhIHN1YnRyZWUgaXQgaXMgc2tpcHBlZFxyXG4gICAgZWxzZSBpZiAoIHdhc1N0YXRlbGVzcyB8fCB0aGlzLnNraXBQcnVuaW5nRnJhbWUgPT09IHRoaXMuZGlzcGxheS5fZnJhbWVJZCB8fCB0aGlzLmFueVN0YXRlQ2hhbmdlICkge1xyXG5cclxuICAgICAgLy8gbWFyayBmdWxseS1yZW1vdmVkIGluc3RhbmNlcyBmb3IgZGlzcG9zYWwsIGFuZCBpbml0aWFsaXplIGNoaWxkIGluc3RhbmNlcyBpZiB3ZSB3ZXJlIHN0YXRlbGVzc1xyXG4gICAgICB0aGlzLnByZXBhcmVDaGlsZEluc3RhbmNlcyggd2FzU3RhdGVsZXNzICk7XHJcblxyXG4gICAgICBjb25zdCBvbGRGaXJzdERyYXdhYmxlID0gdGhpcy5maXJzdERyYXdhYmxlO1xyXG4gICAgICBjb25zdCBvbGRMYXN0RHJhd2FibGUgPSB0aGlzLmxhc3REcmF3YWJsZTtcclxuICAgICAgY29uc3Qgb2xkRmlyc3RJbm5lckRyYXdhYmxlID0gdGhpcy5maXJzdElubmVyRHJhd2FibGU7XHJcbiAgICAgIGNvbnN0IG9sZExhc3RJbm5lckRyYXdhYmxlID0gdGhpcy5sYXN0SW5uZXJEcmF3YWJsZTtcclxuXHJcbiAgICAgIGNvbnN0IHNlbGZDaGFuZ2VkID0gdGhpcy51cGRhdGVTZWxmRHJhd2FibGUoKTtcclxuXHJcbiAgICAgIC8vIFN5bmNocm9uaXplcyBvdXIgY2hpbGRyZW4gYW5kIHNlbGYsIHdpdGggdGhlIGRyYXdhYmxlcyBhbmQgY2hhbmdlIGludGVydmFscyBvZiBib3RoIGNvbWJpbmVkXHJcbiAgICAgIHRoaXMubG9jYWxTeW5jVHJlZSggc2VsZkNoYW5nZWQgKTtcclxuXHJcbiAgICAgIGlmICggYXNzZXJ0U2xvdyApIHtcclxuICAgICAgICAvLyBiZWZvcmUgYW5kIGFmdGVyIGZpcnN0L2xhc3QgZHJhd2FibGVzIChpbnNpZGUgYW55IHBvdGVudGlhbCBncm91cCBkcmF3YWJsZSlcclxuICAgICAgICB0aGlzLmF1ZGl0Q2hhbmdlSW50ZXJ2YWxzKCBvbGRGaXJzdElubmVyRHJhd2FibGUsIG9sZExhc3RJbm5lckRyYXdhYmxlLCB0aGlzLmZpcnN0SW5uZXJEcmF3YWJsZSwgdGhpcy5sYXN0SW5uZXJEcmF3YWJsZSApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJZiB3ZSB1c2UgYSBncm91cCBkcmF3YWJsZSAoYmFja2JvbmUsIGV0Yy4pLCB3ZSdsbCBjb2xsYXBzZSBvdXIgZHJhd2FibGVzIGFuZCBjaGFuZ2UgaW50ZXJ2YWxzIHRvIHJlZmVyZW5jZVxyXG4gICAgICAvLyB0aGUgZ3JvdXAgZHJhd2FibGUgKGFzIGFwcGxpY2FibGUpLlxyXG4gICAgICB0aGlzLmdyb3VwU3luY1RyZWUoIHdhc1N0YXRlbGVzcyApO1xyXG5cclxuICAgICAgaWYgKCBhc3NlcnRTbG93ICkge1xyXG4gICAgICAgIC8vIGJlZm9yZSBhbmQgYWZ0ZXIgZmlyc3QvbGFzdCBkcmF3YWJsZXMgKG91dHNpZGUgb2YgYW55IHBvdGVudGlhbCBncm91cCBkcmF3YWJsZSlcclxuICAgICAgICB0aGlzLmF1ZGl0Q2hhbmdlSW50ZXJ2YWxzKCBvbGRGaXJzdERyYXdhYmxlLCBvbGRMYXN0RHJhd2FibGUsIHRoaXMuZmlyc3REcmF3YWJsZSwgdGhpcy5sYXN0RHJhd2FibGUgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIG91ciBzdWItdHJlZSB3YXMgbm90IHZpc2l0ZWQsIHNpbmNlIHRoZXJlIHdlcmUgbm8gcmVsZXZhbnQgY2hhbmdlcyB0byBpdCAodGhhdCBuZWVkIGluc3RhbmNlIHN5bmNocm9uaXphdGlvblxyXG4gICAgICAvLyBvciBkcmF3YWJsZSBjaGFuZ2VzKVxyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5JbnN0YW5jZSggJ3BydW5lZCcgKTtcclxuICAgIH1cclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuXHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc3BvbnNpYmxlIGZvciBzeW5jaW5nIGNoaWxkcmVuLCBjb25uZWN0aW5nIHRoZSBkcmF3YWJsZSBsaW5rZWQgbGlzdCBhcyBuZWVkZWQsIGFuZCBvdXRwdXR0aW5nIGNoYW5nZSBpbnRlcnZhbHNcclxuICAgKiBhbmQgZmlyc3QvbGFzdCBkcmF3YWJsZSBpbmZvcm1hdGlvbi5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBzZWxmQ2hhbmdlZFxyXG4gICAqL1xyXG4gIGxvY2FsU3luY1RyZWUoIHNlbGZDaGFuZ2VkICkge1xyXG4gICAgY29uc3QgZnJhbWVJZCA9IHRoaXMuZGlzcGxheS5fZnJhbWVJZDtcclxuXHJcbiAgICAvLyBsb2NhbCB2YXJpYWJsZXMsIHNpbmNlIHdlIGNhbid0IG92ZXJ3cml0ZSBvdXIgaW5zdGFuY2UgcHJvcGVydGllcyB5ZXRcclxuICAgIGxldCBmaXJzdERyYXdhYmxlID0gdGhpcy5zZWxmRHJhd2FibGU7IC8vIHBvc3NpYmx5IG51bGxcclxuICAgIGxldCBjdXJyZW50RHJhd2FibGUgPSBmaXJzdERyYXdhYmxlOyAvLyBwb3NzaWJseSBudWxsXHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5maXJzdENoYW5nZUludGVydmFsID09PSBudWxsICYmIHRoaXMubGFzdENoYW5nZUludGVydmFsID09PSBudWxsLFxyXG4gICAgICAnc2FuaXR5IGNoZWNrcyB0aGF0IGNsZWFuU3luY1RyZWVSZXN1bHRzIHdlcmUgY2FsbGVkJyApO1xyXG5cclxuICAgIGxldCBmaXJzdENoYW5nZUludGVydmFsID0gbnVsbDtcclxuICAgIGlmICggc2VsZkNoYW5nZWQgKSB7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5DaGFuZ2VJbnRlcnZhbCAmJiBzY2VuZXJ5TG9nLkNoYW5nZUludGVydmFsKCAnc2VsZicgKTtcclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkNoYW5nZUludGVydmFsICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG4gICAgICBmaXJzdENoYW5nZUludGVydmFsID0gQ2hhbmdlSW50ZXJ2YWwubmV3Rm9yRGlzcGxheSggbnVsbCwgbnVsbCwgdGhpcy5kaXNwbGF5ICk7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5DaGFuZ2VJbnRlcnZhbCAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gICAgfVxyXG4gICAgbGV0IGN1cnJlbnRDaGFuZ2VJbnRlcnZhbCA9IGZpcnN0Q2hhbmdlSW50ZXJ2YWw7XHJcbiAgICBsZXQgbGFzdFVuY2hhbmdlZERyYXdhYmxlID0gc2VsZkNoYW5nZWQgPyBudWxsIDogdGhpcy5zZWxmRHJhd2FibGU7IC8vIHBvc3NpYmx5IG51bGxcclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBsZXQgY2hpbGRJbnN0YW5jZSA9IHRoaXMuY2hpbGRyZW5bIGkgXTtcclxuXHJcbiAgICAgIGNvbnN0IGlzQ29tcGF0aWJsZSA9IGNoaWxkSW5zdGFuY2Uuc3luY1RyZWUoKTtcclxuICAgICAgaWYgKCAhaXNDb21wYXRpYmxlICkge1xyXG4gICAgICAgIGNoaWxkSW5zdGFuY2UgPSB0aGlzLnVwZGF0ZUluY29tcGF0aWJsZUNoaWxkSW5zdGFuY2UoIGNoaWxkSW5zdGFuY2UsIGkgKTtcclxuICAgICAgICBjaGlsZEluc3RhbmNlLnN5bmNUcmVlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGluY2x1ZGVDaGlsZERyYXdhYmxlcyA9IGNoaWxkSW5zdGFuY2Uuc2hvdWxkSW5jbHVkZUluUGFyZW50RHJhd2FibGVzKCk7XHJcblxyXG4gICAgICAvL09IVFdPIFRPRE86IG9ubHkgc3RyaXAgb3V0IGludmlzaWJsZSBDYW52YXMgZHJhd2FibGVzLCB3aGlsZSBsZWF2aW5nIFNWRyAoc2luY2Ugd2UgY2FuIG1vcmUgZWZmaWNpZW50bHkgaGlkZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICAvLyBTVkcgdHJlZXMsIG1lbW9yeS13aXNlKVxyXG4gICAgICAvLyBoZXJlIHdlIHN0cmlwIG91dCBpbnZpc2libGUgZHJhd2FibGUgc2VjdGlvbnMgb3V0IG9mIHRoZSBkcmF3YWJsZSBsaW5rZWQgbGlzdFxyXG4gICAgICBpZiAoIGluY2x1ZGVDaGlsZERyYXdhYmxlcyApIHtcclxuICAgICAgICAvLyBpZiB0aGVyZSBhcmUgYW55IGRyYXdhYmxlcyBmb3IgdGhhdCBjaGlsZCwgbGluayB0aGVtIHVwIGluIG91ciBsaW5rZWQgbGlzdFxyXG4gICAgICAgIGlmICggY2hpbGRJbnN0YW5jZS5maXJzdERyYXdhYmxlICkge1xyXG4gICAgICAgICAgaWYgKCBjdXJyZW50RHJhd2FibGUgKSB7XHJcbiAgICAgICAgICAgIC8vIHRoZXJlIGlzIGFscmVhZHkgYW4gZW5kIG9mIHRoZSBsaW5rZWQgbGlzdCwgc28ganVzdCBhcHBlbmQgdG8gaXRcclxuICAgICAgICAgICAgRHJhd2FibGUuY29ubmVjdERyYXdhYmxlcyggY3VycmVudERyYXdhYmxlLCBjaGlsZEluc3RhbmNlLmZpcnN0RHJhd2FibGUsIHRoaXMuZGlzcGxheSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIHN0YXJ0IG91dCB0aGUgbGlua2VkIGxpc3RcclxuICAgICAgICAgICAgZmlyc3REcmF3YWJsZSA9IGNoaWxkSW5zdGFuY2UuZmlyc3REcmF3YWJsZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgbGFzdCBkcmF3YWJsZSBvZiB0aGUgbGlua2VkIGxpc3RcclxuICAgICAgICAgIGN1cnJlbnREcmF3YWJsZSA9IGNoaWxkSW5zdGFuY2UubGFzdERyYXdhYmxlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXHJcbiAgICAgICAqIENoYW5nZSBpbnRlcnZhbHNcclxuICAgICAgICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5DaGFuZ2VJbnRlcnZhbCAmJiBzY2VuZXJ5TG9nLkNoYW5nZUludGVydmFsKCBgY2hhbmdlcyBmb3IgJHtjaGlsZEluc3RhbmNlLnRvU3RyaW5nKClcclxuICAgICAgfSBpbiAke3RoaXMudG9TdHJpbmcoKX1gICk7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5DaGFuZ2VJbnRlcnZhbCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICAgIGNvbnN0IHdhc0luY2x1ZGVkID0gY2hpbGRJbnN0YW5jZS5zdGl0Y2hDaGFuZ2VJbmNsdWRlZDtcclxuICAgICAgY29uc3QgaXNJbmNsdWRlZCA9IGluY2x1ZGVDaGlsZERyYXdhYmxlcztcclxuICAgICAgY2hpbGRJbnN0YW5jZS5zdGl0Y2hDaGFuZ2VJbmNsdWRlZCA9IGlzSW5jbHVkZWQ7XHJcblxyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuQ2hhbmdlSW50ZXJ2YWwgJiYgc2NlbmVyeUxvZy5DaGFuZ2VJbnRlcnZhbCggYGluY2x1ZGVkOiAke3dhc0luY2x1ZGVkfSA9PiAke2lzSW5jbHVkZWR9YCApO1xyXG5cclxuICAgICAgLy8gY2hlY2sgZm9yIGZvcmNpbmcgZnVsbCBjaGFuZ2UtaW50ZXJ2YWwgb24gY2hpbGRcclxuICAgICAgaWYgKCBjaGlsZEluc3RhbmNlLnN0aXRjaENoYW5nZUZyYW1lID09PSBmcmFtZUlkICkge1xyXG4gICAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5DaGFuZ2VJbnRlcnZhbCAmJiBzY2VuZXJ5TG9nLkNoYW5nZUludGVydmFsKCAnc3RpdGNoQ2hhbmdlRnJhbWUgZnVsbCBjaGFuZ2UgaW50ZXJ2YWwnICk7XHJcbiAgICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkNoYW5nZUludGVydmFsICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgICAgICAvLyBlLmcuIGl0IHdhcyBhZGRlZCwgbW92ZWQsIG9yIGhhZCB2aXNpYmlsaXR5IGNoYW5nZXMuIHJlcXVpcmVzIGZ1bGwgY2hhbmdlIGludGVydmFsXHJcbiAgICAgICAgY2hpbGRJbnN0YW5jZS5maXJzdENoYW5nZUludGVydmFsID0gY2hpbGRJbnN0YW5jZS5sYXN0Q2hhbmdlSW50ZXJ2YWwgPSBDaGFuZ2VJbnRlcnZhbC5uZXdGb3JEaXNwbGF5KCBudWxsLCBudWxsLCB0aGlzLmRpc3BsYXkgKTtcclxuXHJcbiAgICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkNoYW5nZUludGVydmFsICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggd2FzSW5jbHVkZWQgPT09IGlzSW5jbHVkZWQsXHJcbiAgICAgICAgICAnSWYgd2UgZG8gbm90IGhhdmUgc3RpdGNoQ2hhbmdlRnJhbWUgYWN0aXZhdGVkLCBvdXIgaW5jbHVzaW9uIHNob3VsZCBub3QgaGF2ZSBjaGFuZ2VkJyApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBmaXJzdENoaWxkQ2hhbmdlSW50ZXJ2YWwgPSBjaGlsZEluc3RhbmNlLmZpcnN0Q2hhbmdlSW50ZXJ2YWw7XHJcbiAgICAgIGxldCBpc0JlZm9yZU9wZW4gPSBjdXJyZW50Q2hhbmdlSW50ZXJ2YWwgJiYgY3VycmVudENoYW5nZUludGVydmFsLmRyYXdhYmxlQWZ0ZXIgPT09IG51bGw7XHJcbiAgICAgIGNvbnN0IGlzQWZ0ZXJPcGVuID0gZmlyc3RDaGlsZENoYW5nZUludGVydmFsICYmIGZpcnN0Q2hpbGRDaGFuZ2VJbnRlcnZhbC5kcmF3YWJsZUJlZm9yZSA9PT0gbnVsbDtcclxuICAgICAgY29uc3QgbmVlZHNCcmlkZ2UgPSBjaGlsZEluc3RhbmNlLnN0aXRjaENoYW5nZUJlZm9yZSA9PT0gZnJhbWVJZCAmJiAhaXNCZWZvcmVPcGVuICYmICFpc0FmdGVyT3BlbjtcclxuXHJcbiAgICAgIC8vIFdlIG5lZWQgdG8gaW5zZXJ0IGFuIGFkZGl0aW9uYWwgY2hhbmdlIGludGVydmFsIChicmlkZ2UpIHdoZW4gd2Ugbm90aWNlIGEgbGluayBpbiB0aGUgZHJhd2FibGUgbGlua2VkIGxpc3RcclxuICAgICAgLy8gd2hlcmUgdGhlcmUgd2VyZSBub2RlcyB0aGF0IG5lZWRlZCBzdGl0Y2ggY2hhbmdlcyB0aGF0IGFyZW4ndCBzdGlsbCBjaGlsZHJlbiwgb3Igd2VyZSBtb3ZlZC4gV2UgY3JlYXRlIGFcclxuICAgICAgLy8gXCJicmlkZ2VcIiBjaGFuZ2UgaW50ZXJ2YWwgdG8gc3BhbiB0aGUgZ2FwIHdoZXJlIG5vZGVzIHdlcmUgcmVtb3ZlZC5cclxuICAgICAgaWYgKCBuZWVkc0JyaWRnZSApIHtcclxuICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuQ2hhbmdlSW50ZXJ2YWwgJiYgc2NlbmVyeUxvZy5DaGFuZ2VJbnRlcnZhbCggJ2JyaWRnZScgKTtcclxuICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuQ2hhbmdlSW50ZXJ2YWwgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGJyaWRnZSA9IENoYW5nZUludGVydmFsLm5ld0ZvckRpc3BsYXkoIGxhc3RVbmNoYW5nZWREcmF3YWJsZSwgbnVsbCwgdGhpcy5kaXNwbGF5ICk7XHJcbiAgICAgICAgaWYgKCBjdXJyZW50Q2hhbmdlSW50ZXJ2YWwgKSB7XHJcbiAgICAgICAgICBjdXJyZW50Q2hhbmdlSW50ZXJ2YWwubmV4dENoYW5nZUludGVydmFsID0gYnJpZGdlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjdXJyZW50Q2hhbmdlSW50ZXJ2YWwgPSBicmlkZ2U7XHJcbiAgICAgICAgZmlyc3RDaGFuZ2VJbnRlcnZhbCA9IGZpcnN0Q2hhbmdlSW50ZXJ2YWwgfHwgY3VycmVudENoYW5nZUludGVydmFsOyAvLyBzdG9yZSBpZiBpdCBpcyB0aGUgZmlyc3RcclxuICAgICAgICBpc0JlZm9yZU9wZW4gPSB0cnVlO1xyXG5cclxuICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuQ2hhbmdlSW50ZXJ2YWwgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gRXhjbHVkZSBjaGlsZCBpbnN0YW5jZXMgdGhhdCBhcmUgbm93IChhbmQgd2VyZSBiZWZvcmUpIG5vdCBpbmNsdWRlZC4gTk9URTogV2Ugc3RpbGwgbmVlZCB0byBpbmNsdWRlIHRob3NlIGluXHJcbiAgICAgIC8vIGJyaWRnZSBjYWxjdWxhdGlvbnMsIHNpbmNlIGEgcmVtb3ZlZCAoYmVmb3JlLWluY2x1ZGVkKSBpbnN0YW5jZSBjb3VsZCBiZSBiZXR3ZWVuIHR3byBzdGlsbC1pbnZpc2libGVcclxuICAgICAgLy8gaW5zdGFuY2VzLlxyXG4gICAgICBpZiAoIHdhc0luY2x1ZGVkIHx8IGlzSW5jbHVkZWQgKSB7XHJcbiAgICAgICAgaWYgKCBpc0JlZm9yZU9wZW4gKSB7XHJcbiAgICAgICAgICAvLyB3ZSB3YW50IHRvIHRyeSB0byBnbHVlIG91ciBsYXN0IENoYW5nZUludGVydmFsIHVwXHJcbiAgICAgICAgICBpZiAoIGZpcnN0Q2hpbGRDaGFuZ2VJbnRlcnZhbCApIHtcclxuICAgICAgICAgICAgaWYgKCBmaXJzdENoaWxkQ2hhbmdlSW50ZXJ2YWwuZHJhd2FibGVCZWZvcmUgPT09IG51bGwgKSB7XHJcbiAgICAgICAgICAgICAgLy8gd2Ugd2FudCB0byBnbHVlIGZyb20gYm90aCBzaWRlc1xyXG5cclxuICAgICAgICAgICAgICAvLyBiYXNpY2FsbHkgaGF2ZSBvdXIgY3VycmVudCBjaGFuZ2UgaW50ZXJ2YWwgcmVwbGFjZSB0aGUgY2hpbGQncyBmaXJzdCBjaGFuZ2UgaW50ZXJ2YWxcclxuICAgICAgICAgICAgICBjdXJyZW50Q2hhbmdlSW50ZXJ2YWwuZHJhd2FibGVBZnRlciA9IGZpcnN0Q2hpbGRDaGFuZ2VJbnRlcnZhbC5kcmF3YWJsZUFmdGVyO1xyXG4gICAgICAgICAgICAgIGN1cnJlbnRDaGFuZ2VJbnRlcnZhbC5uZXh0Q2hhbmdlSW50ZXJ2YWwgPSBmaXJzdENoaWxkQ2hhbmdlSW50ZXJ2YWwubmV4dENoYW5nZUludGVydmFsO1xyXG5cclxuICAgICAgICAgICAgICBjdXJyZW50Q2hhbmdlSW50ZXJ2YWwgPSBjaGlsZEluc3RhbmNlLmxhc3RDaGFuZ2VJbnRlcnZhbCA9PT0gZmlyc3RDaGlsZENoYW5nZUludGVydmFsID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Q2hhbmdlSW50ZXJ2YWwgOiAvLyBzaW5jZSB3ZSBhcmUgcmVwbGFjaW5nLCBkb24ndCBnaXZlIGFuIG9yaWdpbiByZWZlcmVuY2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZEluc3RhbmNlLmxhc3RDaGFuZ2VJbnRlcnZhbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAvLyBvbmx5IGEgZGVzaXJlIHRvIGdsdWUgZnJvbSBiZWZvcmVcclxuICAgICAgICAgICAgICBjdXJyZW50Q2hhbmdlSW50ZXJ2YWwuZHJhd2FibGVBZnRlciA9IGNoaWxkSW5zdGFuY2UuZmlyc3REcmF3YWJsZTsgLy8gZWl0aGVyIG51bGwgb3IgdGhlIGNvcnJlY3QgZHJhd2FibGVcclxuICAgICAgICAgICAgICBjdXJyZW50Q2hhbmdlSW50ZXJ2YWwubmV4dENoYW5nZUludGVydmFsID0gZmlyc3RDaGlsZENoYW5nZUludGVydmFsO1xyXG4gICAgICAgICAgICAgIGN1cnJlbnRDaGFuZ2VJbnRlcnZhbCA9IGNoaWxkSW5zdGFuY2UubGFzdENoYW5nZUludGVydmFsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gbm8gY2hhbmdlcyB0byB0aGUgY2hpbGQuIGdyYWJzIHRoZSBmaXJzdCBkcmF3YWJsZSByZWZlcmVuY2UgaXQgY2FuXHJcbiAgICAgICAgICAgIGN1cnJlbnRDaGFuZ2VJbnRlcnZhbC5kcmF3YWJsZUFmdGVyID0gY2hpbGRJbnN0YW5jZS5maXJzdERyYXdhYmxlOyAvLyBlaXRoZXIgbnVsbCBvciB0aGUgY29ycmVjdCBkcmF3YWJsZVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggZmlyc3RDaGlsZENoYW5nZUludGVydmFsICkge1xyXG4gICAgICAgICAgZmlyc3RDaGFuZ2VJbnRlcnZhbCA9IGZpcnN0Q2hhbmdlSW50ZXJ2YWwgfHwgZmlyc3RDaGlsZENoYW5nZUludGVydmFsOyAvLyBzdG9yZSBpZiBpdCBpcyB0aGUgZmlyc3RcclxuICAgICAgICAgIGlmICggZmlyc3RDaGlsZENoYW5nZUludGVydmFsLmRyYXdhYmxlQmVmb3JlID09PSBudWxsICkge1xyXG4gICAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhY3VycmVudENoYW5nZUludGVydmFsIHx8IGxhc3RVbmNoYW5nZWREcmF3YWJsZSxcclxuICAgICAgICAgICAgICAnSWYgd2UgaGF2ZSBhIGN1cnJlbnQgY2hhbmdlIGludGVydmFsLCB3ZSBzaG91bGQgYmUgZ3VhcmFudGVlZCBhIG5vbi1udWxsICcgK1xyXG4gICAgICAgICAgICAgICdsYXN0VW5jaGFuZ2VkRHJhd2FibGUnICk7XHJcbiAgICAgICAgICAgIGZpcnN0Q2hpbGRDaGFuZ2VJbnRlcnZhbC5kcmF3YWJsZUJlZm9yZSA9IGxhc3RVbmNoYW5nZWREcmF3YWJsZTsgLy8gZWl0aGVyIG51bGwgb3IgdGhlIGNvcnJlY3QgZHJhd2FibGVcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICggY3VycmVudENoYW5nZUludGVydmFsICkge1xyXG4gICAgICAgICAgICBjdXJyZW50Q2hhbmdlSW50ZXJ2YWwubmV4dENoYW5nZUludGVydmFsID0gZmlyc3RDaGlsZENoYW5nZUludGVydmFsO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY3VycmVudENoYW5nZUludGVydmFsID0gY2hpbGRJbnN0YW5jZS5sYXN0Q2hhbmdlSW50ZXJ2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxhc3RVbmNoYW5nZWREcmF3YWJsZSA9ICggY3VycmVudENoYW5nZUludGVydmFsICYmIGN1cnJlbnRDaGFuZ2VJbnRlcnZhbC5kcmF3YWJsZUFmdGVyID09PSBudWxsICkgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICggY2hpbGRJbnN0YW5jZS5sYXN0RHJhd2FibGUgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRJbnN0YW5jZS5sYXN0RHJhd2FibGUgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFVuY2hhbmdlZERyYXdhYmxlICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGlmIHRoZSBsYXN0IGluc3RhbmNlLCBjaGVjayBmb3IgcG9zdC1icmlkZ2VcclxuICAgICAgaWYgKCBpID09PSB0aGlzLmNoaWxkcmVuLmxlbmd0aCAtIDEgKSB7XHJcbiAgICAgICAgaWYgKCBjaGlsZEluc3RhbmNlLnN0aXRjaENoYW5nZUFmdGVyID09PSBmcmFtZUlkICYmICEoIGN1cnJlbnRDaGFuZ2VJbnRlcnZhbCAmJiBjdXJyZW50Q2hhbmdlSW50ZXJ2YWwuZHJhd2FibGVBZnRlciA9PT0gbnVsbCApICkge1xyXG4gICAgICAgICAgY29uc3QgZW5kaW5nQnJpZGdlID0gQ2hhbmdlSW50ZXJ2YWwubmV3Rm9yRGlzcGxheSggbGFzdFVuY2hhbmdlZERyYXdhYmxlLCBudWxsLCB0aGlzLmRpc3BsYXkgKTtcclxuICAgICAgICAgIGlmICggY3VycmVudENoYW5nZUludGVydmFsICkge1xyXG4gICAgICAgICAgICBjdXJyZW50Q2hhbmdlSW50ZXJ2YWwubmV4dENoYW5nZUludGVydmFsID0gZW5kaW5nQnJpZGdlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY3VycmVudENoYW5nZUludGVydmFsID0gZW5kaW5nQnJpZGdlO1xyXG4gICAgICAgICAgZmlyc3RDaGFuZ2VJbnRlcnZhbCA9IGZpcnN0Q2hhbmdlSW50ZXJ2YWwgfHwgY3VycmVudENoYW5nZUludGVydmFsOyAvLyBzdG9yZSBpZiBpdCBpcyB0aGUgZmlyc3RcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGNsZWFuIHVwIHRoZSBtZXRhZGF0YSBvbiBvdXIgY2hpbGQgKGNhbid0IGJlIGRvbmUgaW4gdGhlIGNoaWxkIGNhbGwsIHNpbmNlIHdlIHVzZSB0aGVzZSB2YWx1ZXMgbGlrZSBhXHJcbiAgICAgIC8vIGNvbXBvc2l0ZSByZXR1cm4gdmFsdWUpXHJcbiAgICAgIC8vT0hUV08gVE9ETzogb25seSBkbyB0aGlzIG9uIGluc3RhbmNlcyB0aGF0IHdlcmUgYWN0dWFsbHkgdHJhdmVyc2VkIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAgIGNoaWxkSW5zdGFuY2UuY2xlYW5TeW5jVHJlZVJlc3VsdHMoKTtcclxuXHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5DaGFuZ2VJbnRlcnZhbCAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGl0J3MgcmVhbGx5IHRoZSBlYXNpZXN0IHdheSB0byBjb21wYXJlIGlmIHR3byB0aGluZ3MgKGNhc3RlZCB0byBib29sZWFucykgYXJlIHRoZSBzYW1lP1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggISFmaXJzdENoYW5nZUludGVydmFsID09PSAhIWN1cnJlbnRDaGFuZ2VJbnRlcnZhbCxcclxuICAgICAgJ1ByZXNlbmNlIG9mIGZpcnN0IGFuZCBjdXJyZW50IGNoYW5nZSBpbnRlcnZhbHMgc2hvdWxkIGJlIGVxdWFsJyApO1xyXG5cclxuICAgIC8vIENoZWNrIHRvIHNlZSBpZiB3ZSBhcmUgZW1wdGllZCBhbmQgbWFya2VkIGFzIGNoYW5nZWQgKGJ1dCB3aXRob3V0IGNoYW5nZSBpbnRlcnZhbHMpLiBUaGlzIHNob3VsZCBpbXBseSB3ZSBoYXZlXHJcbiAgICAvLyBubyBjaGlsZHJlbiAoYW5kIHRodXMgbm8gc3RpdGNoQ2hhbmdlQmVmb3JlIC8gc3RpdGNoQ2hhbmdlQWZ0ZXIgdG8gdXNlKSwgc28gd2UnbGwgd2FudCB0byBjcmVhdGUgYSBjaGFuZ2VcclxuICAgIC8vIGludGVydmFsIHRvIGNvdmVyIG91ciBlbnRpcmUgcmFuZ2UuXHJcbiAgICBpZiAoICFmaXJzdENoYW5nZUludGVydmFsICYmIHRoaXMuc3RpdGNoQ2hhbmdlT25DaGlsZHJlbiA9PT0gdGhpcy5kaXNwbGF5Ll9mcmFtZUlkICYmIHRoaXMuY2hpbGRyZW4ubGVuZ3RoID09PSAwICkge1xyXG4gICAgICBmaXJzdENoYW5nZUludGVydmFsID0gY3VycmVudENoYW5nZUludGVydmFsID0gQ2hhbmdlSW50ZXJ2YWwubmV3Rm9yRGlzcGxheSggbnVsbCwgbnVsbCwgdGhpcy5kaXNwbGF5ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc3RvcmUgb3VyIHJlc3VsdHNcclxuICAgIC8vIE5PVEU6IHRoZXNlIG1heSBnZXQgb3ZlcndyaXR0ZW4gd2l0aCB0aGUgZ3JvdXAgY2hhbmdlIGludGVydmFscyAoaW4gdGhhdCBjYXNlLCBncm91cFN5bmNUcmVlIHdpbGwgcmVhZCBmcm9tIHRoZXNlKVxyXG4gICAgdGhpcy5maXJzdENoYW5nZUludGVydmFsID0gZmlyc3RDaGFuZ2VJbnRlcnZhbDtcclxuICAgIHRoaXMubGFzdENoYW5nZUludGVydmFsID0gY3VycmVudENoYW5nZUludGVydmFsO1xyXG5cclxuICAgIC8vIE5PVEU6IHRoZXNlIG1heSBnZXQgb3ZlcndyaXR0ZW4gd2l0aCB0aGUgZ3JvdXAgZHJhd2FibGUgKGluIHRoYXQgY2FzZSwgZ3JvdXBTeW5jVHJlZSB3aWxsIHJlYWQgZnJvbSB0aGVzZSlcclxuICAgIHRoaXMuZmlyc3REcmF3YWJsZSA9IHRoaXMuZmlyc3RJbm5lckRyYXdhYmxlID0gZmlyc3REcmF3YWJsZTtcclxuICAgIHRoaXMubGFzdERyYXdhYmxlID0gdGhpcy5sYXN0SW5uZXJEcmF3YWJsZSA9IGN1cnJlbnREcmF3YWJsZTsgLy8gZWl0aGVyIG51bGwsIG9yIHRoZSBkcmF3YWJsZSBpdHNlbGZcclxuXHJcbiAgICAvLyBlbnN1cmUgdGhhdCBvdXIgZmlyc3REcmF3YWJsZSBhbmQgbGFzdERyYXdhYmxlIGFyZSBjb3JyZWN0XHJcbiAgICBpZiAoIGFzc2VydFNsb3cgKSB7XHJcbiAgICAgIGxldCBmaXJzdERyYXdhYmxlQ2hlY2sgPSBudWxsO1xyXG4gICAgICBmb3IgKCBsZXQgaiA9IDA7IGogPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaisrICkge1xyXG4gICAgICAgIGlmICggdGhpcy5jaGlsZHJlblsgaiBdLnNob3VsZEluY2x1ZGVJblBhcmVudERyYXdhYmxlcygpICYmIHRoaXMuY2hpbGRyZW5bIGogXS5maXJzdERyYXdhYmxlICkge1xyXG4gICAgICAgICAgZmlyc3REcmF3YWJsZUNoZWNrID0gdGhpcy5jaGlsZHJlblsgaiBdLmZpcnN0RHJhd2FibGU7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCB0aGlzLnNlbGZEcmF3YWJsZSApIHtcclxuICAgICAgICBmaXJzdERyYXdhYmxlQ2hlY2sgPSB0aGlzLnNlbGZEcmF3YWJsZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgbGV0IGxhc3REcmF3YWJsZUNoZWNrID0gdGhpcy5zZWxmRHJhd2FibGU7XHJcbiAgICAgIGZvciAoIGxldCBrID0gdGhpcy5jaGlsZHJlbi5sZW5ndGggLSAxOyBrID49IDA7IGstLSApIHtcclxuICAgICAgICBpZiAoIHRoaXMuY2hpbGRyZW5bIGsgXS5zaG91bGRJbmNsdWRlSW5QYXJlbnREcmF3YWJsZXMoKSAmJiB0aGlzLmNoaWxkcmVuWyBrIF0ubGFzdERyYXdhYmxlICkge1xyXG4gICAgICAgICAgbGFzdERyYXdhYmxlQ2hlY2sgPSB0aGlzLmNoaWxkcmVuWyBrIF0ubGFzdERyYXdhYmxlO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBhc3NlcnRTbG93KCBmaXJzdERyYXdhYmxlQ2hlY2sgPT09IHRoaXMuZmlyc3REcmF3YWJsZSApO1xyXG4gICAgICBhc3NlcnRTbG93KCBsYXN0RHJhd2FibGVDaGVjayA9PT0gdGhpcy5sYXN0RHJhd2FibGUgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIElmIG5lY2Vzc2FyeSwgY3JlYXRlL3JlcGxhY2UvcmVtb3ZlIG91ciBzZWxmRHJhd2FibGUuXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHdoZXRoZXIgdGhlIHNlbGZEcmF3YWJsZSBjaGFuZ2VkXHJcbiAgICovXHJcbiAgdXBkYXRlU2VsZkRyYXdhYmxlKCkge1xyXG4gICAgaWYgKCB0aGlzLm5vZGUuaXNQYWludGVkKCkgKSB7XHJcbiAgICAgIGNvbnN0IHNlbGZSZW5kZXJlciA9IHRoaXMuc2VsZlJlbmRlcmVyOyAvLyBvdXIgbmV3IHNlbGYgcmVuZGVyZXIgYml0bWFza1xyXG5cclxuICAgICAgLy8gYml0d2lzZSB0cmljaywgc2luY2Ugb25seSBvbmUgb2YgQ2FudmFzL1NWRy9ET00vV2ViR0wvZXRjLiBmbGFncyB3aWxsIGJlIGNob3NlbiwgYW5kIGJpdG1hc2tSZW5kZXJlckFyZWEgaXNcclxuICAgICAgLy8gdGhlIG1hc2sgZm9yIHRob3NlIGZsYWdzLiBJbiBFbmdsaXNoLCBcIklzIHRoZSBjdXJyZW50IHNlbGZEcmF3YWJsZSBjb21wYXRpYmxlIHdpdGggb3VyIHNlbGZSZW5kZXJlciAoaWYgYW55KSxcclxuICAgICAgLy8gb3IgZG8gd2UgbmVlZCB0byBjcmVhdGUgYSBzZWxmRHJhd2FibGU/XCJcclxuICAgICAgLy9PSFRXTyBUT0RPOiBGb3IgQ2FudmFzLCB3ZSB3b24ndCBjYXJlIGFib3V0IGFueXRoaW5nIGVsc2UgZm9yIHRoZSBkcmF3YWJsZSwgYnV0IGZvciBET00gd2UgY2FyZSBhYm91dCB0aGUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgLy8gZm9yY2UtYWNjZWxlcmF0aW9uIGZsYWchIFRoYXQncyBzdHJpcHBlZCBvdXQgaGVyZS5cclxuICAgICAgaWYgKCAhdGhpcy5zZWxmRHJhd2FibGUgfHwgKCAoIHRoaXMuc2VsZkRyYXdhYmxlLnJlbmRlcmVyICYgc2VsZlJlbmRlcmVyICYgUmVuZGVyZXIuYml0bWFza1JlbmRlcmVyQXJlYSApID09PSAwICkgKSB7XHJcbiAgICAgICAgaWYgKCB0aGlzLnNlbGZEcmF3YWJsZSApIHtcclxuICAgICAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnN0YW5jZSAmJiBzY2VuZXJ5TG9nLkluc3RhbmNlKCBgcmVwbGFjaW5nIG9sZCBkcmF3YWJsZSAke3RoaXMuc2VsZkRyYXdhYmxlLnRvU3RyaW5nKCl9IHdpdGggbmV3IHJlbmRlcmVyYCApO1xyXG5cclxuICAgICAgICAgIC8vIHNjcmFwIHRoZSBwcmV2aW91cyBzZWxmRHJhd2FibGUsIHdlIG5lZWQgdG8gY3JlYXRlIG9uZSB3aXRoIGEgZGlmZmVyZW50IHJlbmRlcmVyLlxyXG4gICAgICAgICAgdGhpcy5zZWxmRHJhd2FibGUubWFya0ZvckRpc3Bvc2FsKCB0aGlzLmRpc3BsYXkgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2VsZkRyYXdhYmxlID0gUmVuZGVyZXIuY3JlYXRlU2VsZkRyYXdhYmxlKCB0aGlzLCB0aGlzLm5vZGUsIHNlbGZSZW5kZXJlciwgdGhpcy5maXR0YWJpbGl0eS5hbmNlc3RvcnNGaXR0YWJsZSApO1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuc2VsZkRyYXdhYmxlICk7XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5zZWxmRHJhd2FibGUgPT09IG51bGwsICdOb24tcGFpbnRlZCBub2RlcyBzaG91bGQgbm90IGhhdmUgYSBzZWxmRHJhd2FibGUnICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgdXAtdG8tZGF0ZSBpbnN0YW5jZS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtJbnN0YW5jZX0gY2hpbGRJbnN0YW5jZVxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxyXG4gICAqIEByZXR1cm5zIHtJbnN0YW5jZX1cclxuICAgKi9cclxuICB1cGRhdGVJbmNvbXBhdGlibGVDaGlsZEluc3RhbmNlKCBjaGlsZEluc3RhbmNlLCBpbmRleCApIHtcclxuICAgIGlmICggc2NlbmVyeUxvZyAmJiBzY2VuZXJ5LmlzTG9nZ2luZ1BlcmZvcm1hbmNlKCkgKSB7XHJcbiAgICAgIGNvbnN0IGFmZmVjdGVkSW5zdGFuY2VDb3VudCA9IGNoaWxkSW5zdGFuY2UuZ2V0RGVzY2VuZGFudENvdW50KCkgKyAxOyAvLyArMSBmb3IgaXRzZWxmXHJcblxyXG4gICAgICBpZiAoIGFmZmVjdGVkSW5zdGFuY2VDb3VudCA+IDEwMCApIHtcclxuICAgICAgICBzY2VuZXJ5TG9nLlBlcmZDcml0aWNhbCAmJiBzY2VuZXJ5TG9nLlBlcmZDcml0aWNhbCggYGluY29tcGF0aWJsZSBpbnN0YW5jZSByZWJ1aWxkIGF0ICR7dGhpcy50cmFpbC50b1BhdGhTdHJpbmcoKX06ICR7YWZmZWN0ZWRJbnN0YW5jZUNvdW50fWAgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggYWZmZWN0ZWRJbnN0YW5jZUNvdW50ID4gNDAgKSB7XHJcbiAgICAgICAgc2NlbmVyeUxvZy5QZXJmTWFqb3IgJiYgc2NlbmVyeUxvZy5QZXJmTWFqb3IoIGBpbmNvbXBhdGlibGUgaW5zdGFuY2UgcmVidWlsZCBhdCAke3RoaXMudHJhaWwudG9QYXRoU3RyaW5nKCl9OiAke2FmZmVjdGVkSW5zdGFuY2VDb3VudH1gICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIGFmZmVjdGVkSW5zdGFuY2VDb3VudCA+IDAgKSB7XHJcbiAgICAgICAgc2NlbmVyeUxvZy5QZXJmTWlub3IgJiYgc2NlbmVyeUxvZy5QZXJmTWlub3IoIGBpbmNvbXBhdGlibGUgaW5zdGFuY2UgcmVidWlsZCBhdCAke3RoaXMudHJhaWwudG9QYXRoU3RyaW5nKCl9OiAke2FmZmVjdGVkSW5zdGFuY2VDb3VudH1gICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBtYXJrIGl0IGZvciBkaXNwb3NhbFxyXG4gICAgdGhpcy5kaXNwbGF5Lm1hcmtJbnN0YW5jZVJvb3RGb3JEaXNwb3NhbCggY2hpbGRJbnN0YW5jZSApO1xyXG5cclxuICAgIC8vIHN3YXAgaW4gYSBuZXcgaW5zdGFuY2VcclxuICAgIGNvbnN0IHJlcGxhY2VtZW50SW5zdGFuY2UgPSBJbnN0YW5jZS5jcmVhdGVGcm9tUG9vbCggdGhpcy5kaXNwbGF5LCB0aGlzLnRyYWlsLmNvcHkoKS5hZGREZXNjZW5kYW50KCBjaGlsZEluc3RhbmNlLm5vZGUsIGluZGV4ICksIGZhbHNlLCBmYWxzZSApO1xyXG4gICAgdGhpcy5yZXBsYWNlSW5zdGFuY2VXaXRoSW5kZXgoIGNoaWxkSW5zdGFuY2UsIHJlcGxhY2VtZW50SW5zdGFuY2UsIGluZGV4ICk7XHJcbiAgICByZXR1cm4gcmVwbGFjZW1lbnRJbnN0YW5jZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHdhc1N0YXRlbGVzc1xyXG4gICAqL1xyXG4gIGdyb3VwU3luY1RyZWUoIHdhc1N0YXRlbGVzcyApIHtcclxuICAgIGNvbnN0IGdyb3VwUmVuZGVyZXIgPSB0aGlzLmdyb3VwUmVuZGVyZXI7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAoIHRoaXMuaXNCYWNrYm9uZSA/IDEgOiAwICkgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgKCB0aGlzLmlzSW5zdGFuY2VDYW52YXNDYWNoZSA/IDEgOiAwICkgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgKCB0aGlzLmlzU2hhcmVkQ2FudmFzQ2FjaGVTZWxmID8gMSA6IDAgKSA9PT0gKCBncm91cFJlbmRlcmVyID8gMSA6IDAgKSxcclxuICAgICAgJ1dlIHNob3VsZCBoYXZlIHByZWNpc2VseSBvbmUgb2YgdGhlc2UgZmxhZ3Mgc2V0IGZvciB1cyB0byBoYXZlIGEgZ3JvdXBSZW5kZXJlcicgKTtcclxuXHJcbiAgICAvLyBpZiB3ZSBzd2l0Y2hlZCB0by9hd2F5IGZyb20gYSBncm91cCwgb3VyIGdyb3VwIHR5cGUgY2hhbmdlZCwgb3Igb3VyIGdyb3VwIHJlbmRlcmVyIGNoYW5nZWRcclxuICAgIGNvbnN0IGdyb3VwQ2hhbmdlZCA9ICggISFncm91cFJlbmRlcmVyICE9PSAhIXRoaXMuZ3JvdXBEcmF3YWJsZSApIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAoICF3YXNTdGF0ZWxlc3MgJiYgdGhpcy5ncm91cENoYW5nZWQgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgKCB0aGlzLmdyb3VwRHJhd2FibGUgJiYgdGhpcy5ncm91cERyYXdhYmxlLnJlbmRlcmVyICE9PSBncm91cFJlbmRlcmVyICk7XHJcblxyXG4gICAgLy8gaWYgdGhlcmUgaXMgYSBjaGFuZ2UsIHByZXBhcmVcclxuICAgIGlmICggZ3JvdXBDaGFuZ2VkICkge1xyXG4gICAgICBpZiAoIHRoaXMuZ3JvdXBEcmF3YWJsZSApIHtcclxuICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5JbnN0YW5jZSggYHJlcGxhY2luZyBncm91cCBkcmF3YWJsZSAke3RoaXMuZ3JvdXBEcmF3YWJsZS50b1N0cmluZygpfWAgKTtcclxuXHJcbiAgICAgICAgdGhpcy5ncm91cERyYXdhYmxlLm1hcmtGb3JEaXNwb3NhbCggdGhpcy5kaXNwbGF5ICk7XHJcbiAgICAgICAgdGhpcy5ncm91cERyYXdhYmxlID0gbnVsbDtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gY2hhbmdlIGV2ZXJ5dGhpbmcsIHNpbmNlIHdlIG1heSBuZWVkIGEgZnVsbCByZXN0aXRjaFxyXG4gICAgICB0aGlzLmZpcnN0Q2hhbmdlSW50ZXJ2YWwgPSB0aGlzLmxhc3RDaGFuZ2VJbnRlcnZhbCA9IENoYW5nZUludGVydmFsLm5ld0ZvckRpc3BsYXkoIG51bGwsIG51bGwsIHRoaXMuZGlzcGxheSApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggZ3JvdXBSZW5kZXJlciApIHtcclxuICAgICAgLy8gZW5zdXJlIG91ciBsaW5rZWQgbGlzdCBpcyBmdWxseSBkaXNjb25uZWN0ZWQgZnJvbSBvdGhlcnNcclxuICAgICAgdGhpcy5maXJzdERyYXdhYmxlICYmIERyYXdhYmxlLmRpc2Nvbm5lY3RCZWZvcmUoIHRoaXMuZmlyc3REcmF3YWJsZSwgdGhpcy5kaXNwbGF5ICk7XHJcbiAgICAgIHRoaXMubGFzdERyYXdhYmxlICYmIERyYXdhYmxlLmRpc2Nvbm5lY3RBZnRlciggdGhpcy5sYXN0RHJhd2FibGUsIHRoaXMuZGlzcGxheSApO1xyXG5cclxuICAgICAgaWYgKCB0aGlzLmlzQmFja2JvbmUgKSB7XHJcbiAgICAgICAgaWYgKCBncm91cENoYW5nZWQgKSB7XHJcbiAgICAgICAgICB0aGlzLmdyb3VwRHJhd2FibGUgPSBCYWNrYm9uZURyYXdhYmxlLmNyZWF0ZUZyb21Qb29sKCB0aGlzLmRpc3BsYXksIHRoaXMsIHRoaXMuZ2V0VHJhbnNmb3JtUm9vdEluc3RhbmNlKCksIGdyb3VwUmVuZGVyZXIsIHRoaXMuaXNEaXNwbGF5Um9vdCApO1xyXG5cclxuICAgICAgICAgIGlmICggdGhpcy5pc1RyYW5zZm9ybWVkICkge1xyXG4gICAgICAgICAgICB0aGlzLmRpc3BsYXkubWFya1RyYW5zZm9ybVJvb3REaXJ0eSggdGhpcywgdHJ1ZSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmZpcnN0Q2hhbmdlSW50ZXJ2YWwgKSB7XHJcbiAgICAgICAgICB0aGlzLmdyb3VwRHJhd2FibGUuc3RpdGNoKCB0aGlzLmZpcnN0RHJhd2FibGUsIHRoaXMubGFzdERyYXdhYmxlLCB0aGlzLmZpcnN0Q2hhbmdlSW50ZXJ2YWwsIHRoaXMubGFzdENoYW5nZUludGVydmFsICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCB0aGlzLmlzSW5zdGFuY2VDYW52YXNDYWNoZSApIHtcclxuICAgICAgICBpZiAoIGdyb3VwQ2hhbmdlZCApIHtcclxuICAgICAgICAgIHRoaXMuZ3JvdXBEcmF3YWJsZSA9IElubGluZUNhbnZhc0NhY2hlRHJhd2FibGUuY3JlYXRlRnJvbVBvb2woIGdyb3VwUmVuZGVyZXIsIHRoaXMgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCB0aGlzLmZpcnN0Q2hhbmdlSW50ZXJ2YWwgKSB7XHJcbiAgICAgICAgICB0aGlzLmdyb3VwRHJhd2FibGUuc3RpdGNoKCB0aGlzLmZpcnN0RHJhd2FibGUsIHRoaXMubGFzdERyYXdhYmxlLCB0aGlzLmZpcnN0Q2hhbmdlSW50ZXJ2YWwsIHRoaXMubGFzdENoYW5nZUludGVydmFsICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCB0aGlzLmlzU2hhcmVkQ2FudmFzQ2FjaGVTZWxmICkge1xyXG4gICAgICAgIGlmICggZ3JvdXBDaGFuZ2VkICkge1xyXG4gICAgICAgICAgdGhpcy5ncm91cERyYXdhYmxlID0gQ2FudmFzQmxvY2suY3JlYXRlRnJvbVBvb2woIGdyb3VwUmVuZGVyZXIsIHRoaXMgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9PSFRXTyBUT0RPOiByZXN0aXRjaCBoZXJlPz8/IGltcGxlbWVudCBpdCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICB9XHJcbiAgICAgIC8vIFVwZGF0ZSB0aGUgZml0dGFibGUgZmxhZ1xyXG4gICAgICB0aGlzLmdyb3VwRHJhd2FibGUuc2V0Rml0dGFibGUoIHRoaXMuZml0dGFiaWxpdHkuYW5jZXN0b3JzRml0dGFibGUgKTtcclxuXHJcbiAgICAgIHRoaXMuZmlyc3REcmF3YWJsZSA9IHRoaXMubGFzdERyYXdhYmxlID0gdGhpcy5ncm91cERyYXdhYmxlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGNoYW5nZSBpbnRlcnZhbCBoYW5kbGluZ1xyXG4gICAgaWYgKCBncm91cENoYW5nZWQgKSB7XHJcbiAgICAgIC8vIGlmIG91ciBncm91cCBzdGF0dXMgY2hhbmdlZCwgbWFyayBFVkVSWVRISU5HIGFzIHBvdGVudGlhbGx5IGNoYW5nZWRcclxuICAgICAgdGhpcy5maXJzdENoYW5nZUludGVydmFsID0gdGhpcy5sYXN0Q2hhbmdlSW50ZXJ2YWwgPSBDaGFuZ2VJbnRlcnZhbC5uZXdGb3JEaXNwbGF5KCBudWxsLCBudWxsLCB0aGlzLmRpc3BsYXkgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBncm91cFJlbmRlcmVyICkge1xyXG4gICAgICAvLyBvdXIgZ3JvdXAgZGlkbid0IGhhdmUgdG8gY2hhbmdlIGF0IGFsbCwgc28gd2UgcHJldmVudCBhbnkgY2hhbmdlIGludGVydmFsc1xyXG4gICAgICB0aGlzLmZpcnN0Q2hhbmdlSW50ZXJ2YWwgPSB0aGlzLmxhc3RDaGFuZ2VJbnRlcnZhbCA9IG51bGw7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIHNoYXJlZFN5bmNUcmVlKCkge1xyXG4gICAgLy9PSFRXTyBUT0RPOiB3ZSBhcmUgcHJvYmFibHkgbWlzc2luZyBzeW5jVHJlZSBmb3Igc2hhcmVkIHRyZWVzIHByb3Blcmx5IHdpdGggcHJ1bmluZy4gaW52ZXN0aWdhdGUhISBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG5cclxuICAgIHRoaXMuZW5zdXJlU2hhcmVkQ2FjaGVJbml0aWFsaXplZCgpO1xyXG5cclxuICAgIGNvbnN0IHNoYXJlZENhY2hlUmVuZGVyZXIgPSB0aGlzLnNoYXJlZENhY2hlUmVuZGVyZXI7XHJcblxyXG4gICAgaWYgKCAhdGhpcy5zaGFyZWRDYWNoZURyYXdhYmxlIHx8IHRoaXMuc2hhcmVkQ2FjaGVEcmF3YWJsZS5yZW5kZXJlciAhPT0gc2hhcmVkQ2FjaGVSZW5kZXJlciApIHtcclxuICAgICAgLy9PSFRXTyBUT0RPOiBtYXJrIGV2ZXJ5dGhpbmcgYXMgY2hhbmdlZCAoYmlnIGNoYW5nZSBpbnRlcnZhbCkgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuXHJcbiAgICAgIGlmICggdGhpcy5zaGFyZWRDYWNoZURyYXdhYmxlICkge1xyXG4gICAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnN0YW5jZSAmJiBzY2VuZXJ5TG9nLkluc3RhbmNlKCBgcmVwbGFjaW5nIHNoYXJlZCBjYWNoZSBkcmF3YWJsZSAke3RoaXMuc2hhcmVkQ2FjaGVEcmF3YWJsZS50b1N0cmluZygpfWAgKTtcclxuXHJcbiAgICAgICAgdGhpcy5zaGFyZWRDYWNoZURyYXdhYmxlLm1hcmtGb3JEaXNwb3NhbCggdGhpcy5kaXNwbGF5ICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vT0hUV08gVE9ETzogYWN0dWFsbHkgY3JlYXRlIHRoZSBwcm9wZXIgc2hhcmVkIGNhY2hlIGRyYXdhYmxlIGRlcGVuZGluZyBvbiB0aGUgc3BlY2lmaWVkIHJlbmRlcmVyIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAgIC8vICh1cGRhdGUgaXQgaWYgbmVjZXNzYXJ5KVxyXG4gICAgICB0aGlzLnNoYXJlZENhY2hlRHJhd2FibGUgPSBuZXcgU2hhcmVkQ2FudmFzQ2FjaGVEcmF3YWJsZSggdGhpcy50cmFpbCwgc2hhcmVkQ2FjaGVSZW5kZXJlciwgdGhpcywgdGhpcy5zaGFyZWRDYWNoZUluc3RhbmNlICk7XHJcbiAgICAgIHRoaXMuZmlyc3REcmF3YWJsZSA9IHRoaXMuc2hhcmVkQ2FjaGVEcmF3YWJsZTtcclxuICAgICAgdGhpcy5sYXN0RHJhd2FibGUgPSB0aGlzLnNoYXJlZENhY2hlRHJhd2FibGU7XHJcblxyXG4gICAgICAvLyBiYXNpY2FsbHkgZXZlcnl0aGluZyBjaGFuZ2VkIG5vdywgYW5kIHdvbid0IGZyb20gbm93IG9uXHJcbiAgICAgIHRoaXMuZmlyc3RDaGFuZ2VJbnRlcnZhbCA9IHRoaXMubGFzdENoYW5nZUludGVydmFsID0gQ2hhbmdlSW50ZXJ2YWwubmV3Rm9yRGlzcGxheSggbnVsbCwgbnVsbCwgdGhpcy5kaXNwbGF5ICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtib29sZWFufSB3YXNTdGF0ZWxlc3NcclxuICAgKi9cclxuICBwcmVwYXJlQ2hpbGRJbnN0YW5jZXMoIHdhc1N0YXRlbGVzcyApIHtcclxuICAgIC8vIG1hcmsgYWxsIHJlbW92ZWQgaW5zdGFuY2VzIHRvIGJlIGRpc3Bvc2VkIChhbG9uZyB3aXRoIHRoZWlyIHN1YnRyZWVzKVxyXG4gICAgd2hpbGUgKCB0aGlzLmluc3RhbmNlUmVtb3ZhbENoZWNrTGlzdC5sZW5ndGggKSB7XHJcbiAgICAgIGNvbnN0IGluc3RhbmNlVG9NYXJrID0gdGhpcy5pbnN0YW5jZVJlbW92YWxDaGVja0xpc3QucG9wKCk7XHJcbiAgICAgIGlmICggaW5zdGFuY2VUb01hcmsuYWRkUmVtb3ZlQ291bnRlciA9PT0gLTEgKSB7XHJcbiAgICAgICAgaW5zdGFuY2VUb01hcmsuYWRkUmVtb3ZlQ291bnRlciA9IDA7IC8vIHJlc2V0IGl0LCBzbyB3ZSBkb24ndCBtYXJrIGl0IGZvciBkaXNwb3NhbCBtb3JlIHRoYW4gb25jZVxyXG4gICAgICAgIHRoaXMuZGlzcGxheS5tYXJrSW5zdGFuY2VSb290Rm9yRGlzcG9zYWwoIGluc3RhbmNlVG9NYXJrICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHdhc1N0YXRlbGVzcyApIHtcclxuICAgICAgLy8gd2UgbmVlZCB0byBjcmVhdGUgYWxsIG9mIHRoZSBjaGlsZCBpbnN0YW5jZXNcclxuICAgICAgZm9yICggbGV0IGsgPSAwOyBrIDwgdGhpcy5ub2RlLmNoaWxkcmVuLmxlbmd0aDsgaysrICkge1xyXG4gICAgICAgIC8vIGNyZWF0ZSBhIGNoaWxkIGluc3RhbmNlXHJcbiAgICAgICAgY29uc3QgY2hpbGQgPSB0aGlzLm5vZGUuY2hpbGRyZW5bIGsgXTtcclxuICAgICAgICB0aGlzLmFwcGVuZEluc3RhbmNlKCBJbnN0YW5jZS5jcmVhdGVGcm9tUG9vbCggdGhpcy5kaXNwbGF5LCB0aGlzLnRyYWlsLmNvcHkoKS5hZGREZXNjZW5kYW50KCBjaGlsZCwgayApLCBmYWxzZSwgZmFsc2UgKSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIGVuc3VyZVNoYXJlZENhY2hlSW5pdGlhbGl6ZWQoKSB7XHJcbiAgICAvLyB3ZSBvbmx5IG5lZWQgdG8gaW5pdGlhbGl6ZSB0aGlzIHNoYXJlZCBjYWNoZSByZWZlcmVuY2Ugb25jZVxyXG4gICAgaWYgKCAhdGhpcy5zaGFyZWRDYWNoZUluc3RhbmNlICkge1xyXG4gICAgICBjb25zdCBpbnN0YW5jZUtleSA9IHRoaXMubm9kZS5nZXRJZCgpO1xyXG4gICAgICAvLyBUT0RPOiBoYXZlIHRoaXMgYWJzdHJhY3RlZCBhd2F5IGluIHRoZSBEaXNwbGF5PyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICB0aGlzLnNoYXJlZENhY2hlSW5zdGFuY2UgPSB0aGlzLmRpc3BsYXkuX3NoYXJlZENhbnZhc0luc3RhbmNlc1sgaW5zdGFuY2VLZXkgXTtcclxuXHJcbiAgICAgIC8vIFRPRE86IGluY3JlbWVudCByZWZlcmVuY2UgY291bnRpbmc/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAgIGlmICggIXRoaXMuc2hhcmVkQ2FjaGVJbnN0YW5jZSApIHtcclxuICAgICAgICB0aGlzLnNoYXJlZENhY2hlSW5zdGFuY2UgPSBJbnN0YW5jZS5jcmVhdGVGcm9tUG9vbCggdGhpcy5kaXNwbGF5LCBuZXcgVHJhaWwoIHRoaXMubm9kZSApLCBmYWxzZSwgdHJ1ZSApO1xyXG4gICAgICAgIHRoaXMuc2hhcmVkQ2FjaGVJbnN0YW5jZS5zeW5jVHJlZSgpO1xyXG4gICAgICAgIHRoaXMuZGlzcGxheS5fc2hhcmVkQ2FudmFzSW5zdGFuY2VzWyBpbnN0YW5jZUtleSBdID0gdGhpcy5zaGFyZWRDYWNoZUluc3RhbmNlO1xyXG4gICAgICAgIC8vIFRPRE86IHJlZmVyZW5jZSBjb3VudGluZz8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuXHJcbiAgICAgICAgLy8gVE9ETzogdGhpcy5zaGFyZWRDYWNoZUluc3RhbmNlLmlzVHJhbnNmb3JtZWQ/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcblxyXG4gICAgICAgIC8vT0hUV08gVE9ETzogaXMgdGhpcyBuZWNlc3Nhcnk/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAgICAgdGhpcy5kaXNwbGF5Lm1hcmtUcmFuc2Zvcm1Sb290RGlydHkoIHRoaXMuc2hhcmVkQ2FjaGVJbnN0YW5jZSwgdHJ1ZSApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLnNoYXJlZENhY2hlSW5zdGFuY2UuZXh0ZXJuYWxSZWZlcmVuY2VDb3VudCsrO1xyXG5cclxuICAgICAgLy9PSFRXTyBUT0RPOiBpcyB0aGlzIG5lY2Vzc2FyeT8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgaWYgKCB0aGlzLmlzVHJhbnNmb3JtZWQgKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwbGF5Lm1hcmtUcmFuc2Zvcm1Sb290RGlydHkoIHRoaXMsIHRydWUgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV2hldGhlciBvdXQgZHJhd2FibGVzIChmcm9tIGZpcnN0RHJhd2FibGUgdG8gbGFzdERyYXdhYmxlKSBzaG91bGQgYmUgaW5jbHVkZWQgaW4gb3VyIHBhcmVudCdzIGRyYXdhYmxlc1xyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgKi9cclxuICBzaG91bGRJbmNsdWRlSW5QYXJlbnREcmF3YWJsZXMoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5ub2RlLmlzVmlzaWJsZSgpIHx8ICF0aGlzLm5vZGUuaXNFeGNsdWRlSW52aXNpYmxlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGaW5kcyB0aGUgY2xvc2VzdCBkcmF3YWJsZSAobm90IGluY2x1ZGluZyB0aGUgY2hpbGQgaW5zdGFuY2UgYXQgY2hpbGRJbmRleCkgdXNpbmcgbGFzdERyYXdhYmxlLCBvciBudWxsXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIFRPRE86IGNoZWNrIHVzYWdlPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNoaWxkSW5kZXhcclxuICAgKiBAcmV0dXJucyB7RHJhd2FibGV8bnVsbH1cclxuICAgKi9cclxuICBmaW5kUHJldmlvdXNEcmF3YWJsZSggY2hpbGRJbmRleCApIHtcclxuICAgIGZvciAoIGxldCBpID0gY2hpbGRJbmRleCAtIDE7IGkgPj0gMDsgaS0tICkge1xyXG4gICAgICBjb25zdCBvcHRpb24gPSB0aGlzLmNoaWxkcmVuWyBpIF0ubGFzdERyYXdhYmxlO1xyXG4gICAgICBpZiAoIG9wdGlvbiAhPT0gbnVsbCApIHtcclxuICAgICAgICByZXR1cm4gb3B0aW9uO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGaW5kcyB0aGUgY2xvc2VzdCBkcmF3YWJsZSAobm90IGluY2x1ZGluZyB0aGUgY2hpbGQgaW5zdGFuY2UgYXQgY2hpbGRJbmRleCkgdXNpbmcgbmV4dERyYXdhYmxlLCBvciBudWxsXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIFRPRE86IGNoZWNrIHVzYWdlPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNoaWxkSW5kZXhcclxuICAgKiBAcmV0dXJucyB7RHJhd2FibGV8bnVsbH1cclxuICAgKi9cclxuICBmaW5kTmV4dERyYXdhYmxlKCBjaGlsZEluZGV4ICkge1xyXG4gICAgY29uc3QgbGVuID0gdGhpcy5jaGlsZHJlbi5sZW5ndGg7XHJcbiAgICBmb3IgKCBsZXQgaSA9IGNoaWxkSW5kZXggKyAxOyBpIDwgbGVuOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IG9wdGlvbiA9IHRoaXMuY2hpbGRyZW5bIGkgXS5maXJzdERyYXdhYmxlO1xyXG4gICAgICBpZiAoIG9wdGlvbiAhPT0gbnVsbCApIHtcclxuICAgICAgICByZXR1cm4gb3B0aW9uO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcclxuICAgKiBDaGlsZHJlbiBoYW5kbGluZ1xyXG4gICAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG4gIC8qKlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0luc3RhbmNlfSBpbnN0YW5jZVxyXG4gICAqL1xyXG4gIGFwcGVuZEluc3RhbmNlKCBpbnN0YW5jZSApIHtcclxuICAgIHRoaXMuaW5zZXJ0SW5zdGFuY2UoIGluc3RhbmNlLCB0aGlzLmNoaWxkcmVuLmxlbmd0aCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIE5PVEU6IGRpZmZlcmVudCBwYXJhbWV0ZXIgb3JkZXIgY29tcGFyZWQgdG8gTm9kZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtJbnN0YW5jZX0gaW5zdGFuY2VcclxuICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcclxuICAgKi9cclxuICBpbnNlcnRJbnN0YW5jZSggaW5zdGFuY2UsIGluZGV4ICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaW5zdGFuY2UgaW5zdGFuY2VvZiBJbnN0YW5jZSApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaW5kZXggPj0gMCAmJiBpbmRleCA8PSB0aGlzLmNoaWxkcmVuLmxlbmd0aCxcclxuICAgICAgYEluc3RhbmNlIGluc2VydGlvbiBib3VuZHMgY2hlY2sgZm9yIGluZGV4ICR7aW5kZXh9IHdpdGggcHJldmlvdXMgY2hpbGRyZW4gbGVuZ3RoICR7XHJcbiAgICAgICAgdGhpcy5jaGlsZHJlbi5sZW5ndGh9YCApO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnN0YW5jZVRyZWUgJiYgc2NlbmVyeUxvZy5JbnN0YW5jZVRyZWUoXHJcbiAgICAgIGBpbnNlcnRpbmcgJHtpbnN0YW5jZS50b1N0cmluZygpfSBpbnRvICR7dGhpcy50b1N0cmluZygpfWAgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnN0YW5jZVRyZWUgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgLy8gbWFyayBpdCBhcyBjaGFuZ2VkIGR1cmluZyB0aGlzIGZyYW1lLCBzbyB0aGF0IHdlIGNhbiBwcm9wZXJseSBzZXQgdGhlIGNoYW5nZSBpbnRlcnZhbFxyXG4gICAgaW5zdGFuY2Uuc3RpdGNoQ2hhbmdlRnJhbWUgPSB0aGlzLmRpc3BsYXkuX2ZyYW1lSWQ7XHJcbiAgICB0aGlzLnN0aXRjaENoYW5nZU9uQ2hpbGRyZW4gPSB0aGlzLmRpc3BsYXkuX2ZyYW1lSWQ7XHJcblxyXG4gICAgdGhpcy5jaGlsZHJlbi5zcGxpY2UoIGluZGV4LCAwLCBpbnN0YW5jZSApO1xyXG4gICAgaW5zdGFuY2UucGFyZW50ID0gdGhpcztcclxuICAgIGluc3RhbmNlLm9sZFBhcmVudCA9IHRoaXM7XHJcblxyXG4gICAgLy8gbWFpbnRhaW4gb3VyIHN0aXRjaC1jaGFuZ2UgaW50ZXJ2YWxcclxuICAgIGlmICggaW5kZXggPD0gdGhpcy5iZWZvcmVTdGFibGVJbmRleCApIHtcclxuICAgICAgdGhpcy5iZWZvcmVTdGFibGVJbmRleCA9IGluZGV4IC0gMTtcclxuICAgIH1cclxuICAgIGlmICggaW5kZXggPiB0aGlzLmFmdGVyU3RhYmxlSW5kZXggKSB7XHJcbiAgICAgIHRoaXMuYWZ0ZXJTdGFibGVJbmRleCA9IGluZGV4ICsgMTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLmFmdGVyU3RhYmxlSW5kZXgrKztcclxuICAgIH1cclxuXHJcbiAgICAvLyBtYWludGFpbiBmaXR0YWJsZSBmbGFnc1xyXG4gICAgdGhpcy5maXR0YWJpbGl0eS5vbkluc2VydCggaW5zdGFuY2UuZml0dGFiaWxpdHkgKTtcclxuXHJcbiAgICB0aGlzLnJlbGF0aXZlVHJhbnNmb3JtLmFkZEluc3RhbmNlKCBpbnN0YW5jZSApO1xyXG5cclxuICAgIHRoaXMubWFya0NoaWxkVmlzaWJpbGl0eURpcnR5KCk7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkluc3RhbmNlVHJlZSAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7SW5zdGFuY2V9IGluc3RhbmNlXHJcbiAgICovXHJcbiAgcmVtb3ZlSW5zdGFuY2UoIGluc3RhbmNlICkge1xyXG4gICAgdGhpcy5yZW1vdmVJbnN0YW5jZVdpdGhJbmRleCggaW5zdGFuY2UsIF8uaW5kZXhPZiggdGhpcy5jaGlsZHJlbiwgaW5zdGFuY2UgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7SW5zdGFuY2V9IGluc3RhbmNlXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XHJcbiAgICovXHJcbiAgcmVtb3ZlSW5zdGFuY2VXaXRoSW5kZXgoIGluc3RhbmNlLCBpbmRleCApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGluc3RhbmNlIGluc3RhbmNlb2YgSW5zdGFuY2UgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGluZGV4ID49IDAgJiYgaW5kZXggPCB0aGlzLmNoaWxkcmVuLmxlbmd0aCxcclxuICAgICAgYEluc3RhbmNlIHJlbW92YWwgYm91bmRzIGNoZWNrIGZvciBpbmRleCAke2luZGV4fSB3aXRoIHByZXZpb3VzIGNoaWxkcmVuIGxlbmd0aCAke1xyXG4gICAgICAgIHRoaXMuY2hpbGRyZW4ubGVuZ3RofWAgKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5zdGFuY2VUcmVlICYmIHNjZW5lcnlMb2cuSW5zdGFuY2VUcmVlKFxyXG4gICAgICBgcmVtb3ZpbmcgJHtpbnN0YW5jZS50b1N0cmluZygpfSBmcm9tICR7dGhpcy50b1N0cmluZygpfWAgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnN0YW5jZVRyZWUgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgY29uc3QgZnJhbWVJZCA9IHRoaXMuZGlzcGxheS5fZnJhbWVJZDtcclxuXHJcbiAgICAvLyBtYXJrIGl0IGFzIGNoYW5nZWQgZHVyaW5nIHRoaXMgZnJhbWUsIHNvIHRoYXQgd2UgY2FuIHByb3Blcmx5IHNldCB0aGUgY2hhbmdlIGludGVydmFsXHJcbiAgICBpbnN0YW5jZS5zdGl0Y2hDaGFuZ2VGcmFtZSA9IGZyYW1lSWQ7XHJcbiAgICB0aGlzLnN0aXRjaENoYW5nZU9uQ2hpbGRyZW4gPSBmcmFtZUlkO1xyXG5cclxuICAgIC8vIG1hcmsgbmVpZ2hib3JzIHNvIHRoYXQgd2UgY2FuIGFkZCBhIGNoYW5nZSBpbnRlcnZhbCBmb3Igb3VyIHJlbW92YWwgYXJlYVxyXG4gICAgaWYgKCBpbmRleCAtIDEgPj0gMCApIHtcclxuICAgICAgdGhpcy5jaGlsZHJlblsgaW5kZXggLSAxIF0uc3RpdGNoQ2hhbmdlQWZ0ZXIgPSBmcmFtZUlkO1xyXG4gICAgfVxyXG4gICAgaWYgKCBpbmRleCArIDEgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aCApIHtcclxuICAgICAgdGhpcy5jaGlsZHJlblsgaW5kZXggKyAxIF0uc3RpdGNoQ2hhbmdlQmVmb3JlID0gZnJhbWVJZDtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmNoaWxkcmVuLnNwbGljZSggaW5kZXgsIDEgKTsgLy8gVE9ETzogcmVwbGFjZSB3aXRoIGEgJ3JlbW92ZScgZnVuY3Rpb24gY2FsbCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgaW5zdGFuY2UucGFyZW50ID0gbnVsbDtcclxuICAgIGluc3RhbmNlLm9sZFBhcmVudCA9IHRoaXM7XHJcblxyXG4gICAgLy8gbWFpbnRhaW4gb3VyIHN0aXRjaC1jaGFuZ2UgaW50ZXJ2YWxcclxuICAgIGlmICggaW5kZXggPD0gdGhpcy5iZWZvcmVTdGFibGVJbmRleCApIHtcclxuICAgICAgdGhpcy5iZWZvcmVTdGFibGVJbmRleCA9IGluZGV4IC0gMTtcclxuICAgIH1cclxuICAgIGlmICggaW5kZXggPj0gdGhpcy5hZnRlclN0YWJsZUluZGV4ICkge1xyXG4gICAgICB0aGlzLmFmdGVyU3RhYmxlSW5kZXggPSBpbmRleDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLmFmdGVyU3RhYmxlSW5kZXgtLTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBtYWludGFpbiBmaXR0YWJsZSBmbGFnc1xyXG4gICAgdGhpcy5maXR0YWJpbGl0eS5vblJlbW92ZSggaW5zdGFuY2UuZml0dGFiaWxpdHkgKTtcclxuXHJcbiAgICB0aGlzLnJlbGF0aXZlVHJhbnNmb3JtLnJlbW92ZUluc3RhbmNlKCBpbnN0YW5jZSApO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnN0YW5jZVRyZWUgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0luc3RhbmNlfSBjaGlsZEluc3RhbmNlXHJcbiAgICogQHBhcmFtIHtJbnN0YW5jZX0gcmVwbGFjZW1lbnRJbnN0YW5jZVxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxyXG4gICAqL1xyXG4gIHJlcGxhY2VJbnN0YW5jZVdpdGhJbmRleCggY2hpbGRJbnN0YW5jZSwgcmVwbGFjZW1lbnRJbnN0YW5jZSwgaW5kZXggKSB7XHJcbiAgICAvLyBUT0RPOiBvcHRpbWl6YXRpb24/IGhvcGVmdWxseSBpdCB3b24ndCBoYXBwZW4gb2Z0ZW4sIHNvIHdlIGp1c3QgZG8gdGhpcyBmb3Igbm93IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICB0aGlzLnJlbW92ZUluc3RhbmNlV2l0aEluZGV4KCBjaGlsZEluc3RhbmNlLCBpbmRleCApO1xyXG4gICAgdGhpcy5pbnNlcnRJbnN0YW5jZSggcmVwbGFjZW1lbnRJbnN0YW5jZSwgaW5kZXggKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZvciBoYW5kbGluZyBwb3RlbnRpYWwgcmVvcmRlcmluZyBvZiBjaGlsZCBpbnN0YW5jZXMgaW5jbHVzaXZlbHkgYmV0d2VlbiB0aGUgbWluIGFuZCBtYXggaW5kaWNlcy5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1pbkNoYW5nZUluZGV4XHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1heENoYW5nZUluZGV4XHJcbiAgICovXHJcbiAgcmVvcmRlckluc3RhbmNlcyggbWluQ2hhbmdlSW5kZXgsIG1heENoYW5nZUluZGV4ICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIG1pbkNoYW5nZUluZGV4ID09PSAnbnVtYmVyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIG1heENoYW5nZUluZGV4ID09PSAnbnVtYmVyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbWluQ2hhbmdlSW5kZXggPD0gbWF4Q2hhbmdlSW5kZXggKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5zdGFuY2VUcmVlICYmIHNjZW5lcnlMb2cuSW5zdGFuY2VUcmVlKCBgUmVvcmRlcmluZyAke3RoaXMudG9TdHJpbmcoKX1gICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5zdGFuY2VUcmVlICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIC8vIE5PVEU6IEZvciBpbXBsZW1lbnRhdGlvbiwgd2UndmUgYmFzaWNhbGx5IHNldCBwYXJhbWV0ZXJzIGFzIGlmIHdlIHJlbW92ZWQgYWxsIG9mIHRoZSByZWxldmFudCBpbnN0YW5jZXMgYW5kXHJcbiAgICAvLyB0aGVuIGFkZGVkIHRoZW0gYmFjayBpbi4gVGhlcmUgbWF5IGJlIG1vcmUgZWZmaWNpZW50IHdheXMgdG8gZG8gdGhpcywgYnV0IHRoZSBzdGl0Y2hpbmcgYW5kIGNoYW5nZSBpbnRlcnZhbFxyXG4gICAgLy8gcHJvY2VzcyBpcyBhIGJpdCBjb21wbGljYXRlZCByaWdodCBub3cuXHJcblxyXG4gICAgY29uc3QgZnJhbWVJZCA9IHRoaXMuZGlzcGxheS5fZnJhbWVJZDtcclxuXHJcbiAgICAvLyBSZW1vdmUgdGhlIG9sZCBvcmRlcmluZyBvZiBpbnN0YW5jZXNcclxuICAgIHRoaXMuY2hpbGRyZW4uc3BsaWNlKCBtaW5DaGFuZ2VJbmRleCwgbWF4Q2hhbmdlSW5kZXggLSBtaW5DaGFuZ2VJbmRleCArIDEgKTtcclxuXHJcbiAgICAvLyBBZGQgdGhlIGluc3RhbmNlcyBiYWNrIGluIHRoZSBjb3JyZWN0IG9yZGVyXHJcbiAgICBmb3IgKCBsZXQgaSA9IG1pbkNoYW5nZUluZGV4OyBpIDw9IG1heENoYW5nZUluZGV4OyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGNoaWxkID0gdGhpcy5maW5kQ2hpbGRJbnN0YW5jZU9uTm9kZSggdGhpcy5ub2RlLl9jaGlsZHJlblsgaSBdICk7XHJcbiAgICAgIHRoaXMuY2hpbGRyZW4uc3BsaWNlKCBpLCAwLCBjaGlsZCApO1xyXG4gICAgICBjaGlsZC5zdGl0Y2hDaGFuZ2VGcmFtZSA9IGZyYW1lSWQ7XHJcblxyXG4gICAgICAvLyBtYXJrIG5laWdoYm9ycyBzbyB0aGF0IHdlIGNhbiBhZGQgYSBjaGFuZ2UgaW50ZXJ2YWwgZm9yIG91ciBjaGFuZ2UgYXJlYVxyXG4gICAgICBpZiAoIGkgPiBtaW5DaGFuZ2VJbmRleCApIHtcclxuICAgICAgICBjaGlsZC5zdGl0Y2hDaGFuZ2VBZnRlciA9IGZyYW1lSWQ7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBpIDwgbWF4Q2hhbmdlSW5kZXggKSB7XHJcbiAgICAgICAgY2hpbGQuc3RpdGNoQ2hhbmdlQmVmb3JlID0gZnJhbWVJZDtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc3RpdGNoQ2hhbmdlT25DaGlsZHJlbiA9IGZyYW1lSWQ7XHJcbiAgICB0aGlzLmJlZm9yZVN0YWJsZUluZGV4ID0gTWF0aC5taW4oIHRoaXMuYmVmb3JlU3RhYmxlSW5kZXgsIG1pbkNoYW5nZUluZGV4IC0gMSApO1xyXG4gICAgdGhpcy5hZnRlclN0YWJsZUluZGV4ID0gTWF0aC5tYXgoIHRoaXMuYWZ0ZXJTdGFibGVJbmRleCwgbWF4Q2hhbmdlSW5kZXggKyAxICk7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkluc3RhbmNlVHJlZSAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSWYgd2UgaGF2ZSBhIGNoaWxkIGluc3RhbmNlIHRoYXQgY29ycmVzcG9uZHMgdG8gdGhpcyBub2RlLCByZXR1cm4gaXQgKG90aGVyd2lzZSBudWxsKS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtOb2RlfSBub2RlXHJcbiAgICogQHJldHVybnMge0luc3RhbmNlfG51bGx9XHJcbiAgICovXHJcbiAgZmluZENoaWxkSW5zdGFuY2VPbk5vZGUoIG5vZGUgKSB7XHJcbiAgICBjb25zdCBpbnN0YW5jZXMgPSBub2RlLmdldEluc3RhbmNlcygpO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgaW5zdGFuY2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBpZiAoIGluc3RhbmNlc1sgaSBdLm9sZFBhcmVudCA9PT0gdGhpcyApIHtcclxuICAgICAgICByZXR1cm4gaW5zdGFuY2VzWyBpIF07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRXZlbnQgY2FsbGJhY2sgZm9yIE5vZGUncyAnY2hpbGRJbnNlcnRlZCcgZXZlbnQsIHVzZWQgdG8gdHJhY2sgY2hpbGRyZW4uXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7Tm9kZX0gY2hpbGROb2RlXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XHJcbiAgICovXHJcbiAgb25DaGlsZEluc2VydGVkKCBjaGlsZE5vZGUsIGluZGV4ICkge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkluc3RhbmNlICYmIHNjZW5lcnlMb2cuSW5zdGFuY2UoXHJcbiAgICAgIGBpbnNlcnRpbmcgY2hpbGQgbm9kZSAke2NoaWxkTm9kZS5jb25zdHJ1Y3Rvci5uYW1lfSMke2NoaWxkTm9kZS5pZH0gaW50byAke3RoaXMudG9TdHJpbmcoKX1gICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMuc3RhdGVsZXNzLCAnSWYgd2UgYXJlIHN0YXRlbGVzcywgd2Ugc2hvdWxkIG5vdCByZWNlaXZlIHRoZXNlIG5vdGlmaWNhdGlvbnMnICk7XHJcblxyXG4gICAgbGV0IGluc3RhbmNlID0gdGhpcy5maW5kQ2hpbGRJbnN0YW5jZU9uTm9kZSggY2hpbGROb2RlICk7XHJcblxyXG4gICAgaWYgKCBpbnN0YW5jZSApIHtcclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkluc3RhbmNlICYmIHNjZW5lcnlMb2cuSW5zdGFuY2UoICdpbnN0YW5jZSBhbHJlYWR5IGV4aXN0cycgKTtcclxuICAgICAgLy8gaXQgbXVzdCBoYXZlIGJlZW4gYWRkZWQgYmFjay4gaW5jcmVtZW50IGl0cyBjb3VudGVyXHJcbiAgICAgIGluc3RhbmNlLmFkZFJlbW92ZUNvdW50ZXIgKz0gMTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggaW5zdGFuY2UuYWRkUmVtb3ZlQ291bnRlciA9PT0gMCApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnN0YW5jZSAmJiBzY2VuZXJ5TG9nLkluc3RhbmNlKCAnY3JlYXRpbmcgc3R1YiBpbnN0YW5jZScgKTtcclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkluc3RhbmNlICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG4gICAgICBpbnN0YW5jZSA9IEluc3RhbmNlLmNyZWF0ZUZyb21Qb29sKCB0aGlzLmRpc3BsYXksIHRoaXMudHJhaWwuY29weSgpLmFkZERlc2NlbmRhbnQoIGNoaWxkTm9kZSwgaW5kZXggKSwgZmFsc2UsIGZhbHNlICk7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnN0YW5jZSAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuaW5zZXJ0SW5zdGFuY2UoIGluc3RhbmNlLCBpbmRleCApO1xyXG5cclxuICAgIC8vIG1ha2Ugc3VyZSB3ZSBhcmUgdmlzaXRlZCBmb3Igc3luY1RyZWUoKVxyXG4gICAgdGhpcy5tYXJrU2tpcFBydW5pbmcoKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEV2ZW50IGNhbGxiYWNrIGZvciBOb2RlJ3MgJ2NoaWxkUmVtb3ZlZCcgZXZlbnQsIHVzZWQgdG8gdHJhY2sgY2hpbGRyZW4uXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7Tm9kZX0gY2hpbGROb2RlXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XHJcbiAgICovXHJcbiAgb25DaGlsZFJlbW92ZWQoIGNoaWxkTm9kZSwgaW5kZXggKSB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5JbnN0YW5jZShcclxuICAgICAgYHJlbW92aW5nIGNoaWxkIG5vZGUgJHtjaGlsZE5vZGUuY29uc3RydWN0b3IubmFtZX0jJHtjaGlsZE5vZGUuaWR9IGZyb20gJHt0aGlzLnRvU3RyaW5nKCl9YCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkluc3RhbmNlICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLnN0YXRlbGVzcywgJ0lmIHdlIGFyZSBzdGF0ZWxlc3MsIHdlIHNob3VsZCBub3QgcmVjZWl2ZSB0aGVzZSBub3RpZmljYXRpb25zJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5jaGlsZHJlblsgaW5kZXggXS5ub2RlID09PSBjaGlsZE5vZGUsICdFbnN1cmUgdGhhdCBvdXIgaW5zdGFuY2UgbWF0Y2hlcyB1cCcgKTtcclxuXHJcbiAgICBjb25zdCBpbnN0YW5jZSA9IHRoaXMuZmluZENoaWxkSW5zdGFuY2VPbk5vZGUoIGNoaWxkTm9kZSApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaW5zdGFuY2UgIT09IG51bGwsICdXZSBzaG91bGQgYWx3YXlzIGhhdmUgYSByZWZlcmVuY2UgdG8gYSByZW1vdmVkIGluc3RhbmNlJyApO1xyXG5cclxuICAgIGluc3RhbmNlLmFkZFJlbW92ZUNvdW50ZXIgLT0gMTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGluc3RhbmNlLmFkZFJlbW92ZUNvdW50ZXIgPT09IC0xICk7XHJcblxyXG4gICAgLy8gdHJhY2sgdGhlIHJlbW92ZWQgaW5zdGFuY2UgaGVyZS4gaWYgaXQgZG9lc24ndCBnZXQgYWRkZWQgYmFjaywgdGhpcyB3aWxsIGJlIHRoZSBvbmx5IHJlZmVyZW5jZSB3ZSBoYXZlICh3ZSdsbFxyXG4gICAgLy8gbmVlZCB0byBkaXNwb3NlIGl0KVxyXG4gICAgdGhpcy5pbnN0YW5jZVJlbW92YWxDaGVja0xpc3QucHVzaCggaW5zdGFuY2UgKTtcclxuXHJcbiAgICB0aGlzLnJlbW92ZUluc3RhbmNlV2l0aEluZGV4KCBpbnN0YW5jZSwgaW5kZXggKTtcclxuXHJcbiAgICAvLyBtYWtlIHN1cmUgd2UgYXJlIHZpc2l0ZWQgZm9yIHN5bmNUcmVlKClcclxuICAgIHRoaXMubWFya1NraXBQcnVuaW5nKCk7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkluc3RhbmNlICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFdmVudCBjYWxsYmFjayBmb3IgTm9kZSdzICdjaGlsZHJlblJlb3JkZXJlZCcgZXZlbnRcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1pbkNoYW5nZUluZGV4XHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1heENoYW5nZUluZGV4XHJcbiAgICovXHJcbiAgb25DaGlsZHJlblJlb3JkZXJlZCggbWluQ2hhbmdlSW5kZXgsIG1heENoYW5nZUluZGV4ICkge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkluc3RhbmNlICYmIHNjZW5lcnlMb2cuSW5zdGFuY2UoXHJcbiAgICAgIGByZW9yZGVyaW5nIGNoaWxkcmVuIGZvciAke3RoaXMudG9TdHJpbmcoKX1gICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgdGhpcy5yZW9yZGVySW5zdGFuY2VzKCBtaW5DaGFuZ2VJbmRleCwgbWF4Q2hhbmdlSW5kZXggKTtcclxuXHJcbiAgICAvLyBtYWtlIHN1cmUgd2UgYXJlIHZpc2l0ZWQgZm9yIHN5bmNUcmVlKClcclxuICAgIHRoaXMubWFya1NraXBQcnVuaW5nKCk7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkluc3RhbmNlICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFdmVudCBjYWxsYmFjayBmb3IgTm9kZSdzICd2aXNpYmlsaXR5JyBldmVudCwgdXNlZCB0byBub3RpZnkgYWJvdXQgc3RpdGNoIGNoYW5nZXMuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBvblZpc2liaWxpdHlDaGFuZ2UoKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5zdGF0ZWxlc3MsICdJZiB3ZSBhcmUgc3RhdGVsZXNzLCB3ZSBzaG91bGQgbm90IHJlY2VpdmUgdGhlc2Ugbm90aWZpY2F0aW9ucycgKTtcclxuXHJcbiAgICAvLyBmb3Igbm93LCBqdXN0IG1hcmsgd2hpY2ggZnJhbWUgd2Ugd2VyZSBjaGFuZ2VkIGZvciBvdXIgY2hhbmdlIGludGVydmFsXHJcbiAgICB0aGlzLnN0aXRjaENoYW5nZUZyYW1lID0gdGhpcy5kaXNwbGF5Ll9mcmFtZUlkO1xyXG5cclxuICAgIC8vIG1ha2Ugc3VyZSB3ZSBhcmVuJ3QgcHJ1bmVkIGluIHRoZSBuZXh0IHN5bmNUcmVlKClcclxuICAgIHRoaXMucGFyZW50ICYmIHRoaXMucGFyZW50Lm1hcmtTa2lwUHJ1bmluZygpO1xyXG5cclxuICAgIC8vIG1hcmsgdmlzaWJpbGl0eSBjaGFuZ2VzXHJcbiAgICB0aGlzLnZpc2liaWxpdHlEaXJ0eSA9IHRydWU7XHJcbiAgICB0aGlzLnBhcmVudCAmJiB0aGlzLnBhcmVudC5tYXJrQ2hpbGRWaXNpYmlsaXR5RGlydHkoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEV2ZW50IGNhbGxiYWNrIGZvciBOb2RlJ3MgJ29wYWNpdHknIGNoYW5nZSBldmVudC5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIG9uT3BhY2l0eUNoYW5nZSgpIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLnN0YXRlbGVzcywgJ0lmIHdlIGFyZSBzdGF0ZWxlc3MsIHdlIHNob3VsZCBub3QgcmVjZWl2ZSB0aGVzZSBub3RpZmljYXRpb25zJyApO1xyXG5cclxuICAgIHRoaXMubWFya1JlbmRlclN0YXRlRGlydHkoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgbWFya0NoaWxkVmlzaWJpbGl0eURpcnR5KCkge1xyXG4gICAgaWYgKCAhdGhpcy5jaGlsZFZpc2liaWxpdHlEaXJ0eSApIHtcclxuICAgICAgdGhpcy5jaGlsZFZpc2liaWxpdHlEaXJ0eSA9IHRydWU7XHJcbiAgICAgIHRoaXMucGFyZW50ICYmIHRoaXMucGFyZW50Lm1hcmtDaGlsZFZpc2liaWxpdHlEaXJ0eSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXBkYXRlcyB0aGUgY3VycmVudGx5IGZpdHRhYmlsaXR5IGZvciBhbGwgb2YgdGhlIGRyYXdhYmxlcyBhdHRhY2hlZCB0byB0aGlzIGluc3RhbmNlLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZml0dGFibGVcclxuICAgKi9cclxuICB1cGRhdGVEcmF3YWJsZUZpdHRhYmlsaXR5KCBmaXR0YWJsZSApIHtcclxuICAgIHRoaXMuc2VsZkRyYXdhYmxlICYmIHRoaXMuc2VsZkRyYXdhYmxlLnNldEZpdHRhYmxlKCBmaXR0YWJsZSApO1xyXG4gICAgdGhpcy5ncm91cERyYXdhYmxlICYmIHRoaXMuZ3JvdXBEcmF3YWJsZS5zZXRGaXR0YWJsZSggZml0dGFibGUgKTtcclxuICAgIC8vIHRoaXMuc2hhcmVkQ2FjaGVEcmF3YWJsZSAmJiB0aGlzLnNoYXJlZENhY2hlRHJhd2FibGUuc2V0Rml0dGFibGUoIGZpdHRhYmxlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVcGRhdGVzIHRoZSB2aXNpYmxlL3JlbGF0aXZlVmlzaWJsZSBmbGFncyBvbiB0aGUgSW5zdGFuY2UgYW5kIGl0cyBlbnRpcmUgc3VidHJlZS5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHBhcmVudEdsb2JhbGx5VmlzaWJsZSAtIFdoZXRoZXIgb3VyIHBhcmVudCAoaWYgYW55KSBpcyBnbG9iYWxseSB2aXNpYmxlXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBwYXJlbnRHbG9iYWxseVZvaWNpbmdWaXNpYmxlIC0gV2hldGhlciBvdXIgcGFyZW50IChpZiBhbnkpIGlzIGdsb2JhbGx5IHZvaWNpbmdWaXNpYmxlLlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gcGFyZW50UmVsYXRpdmVseVZpc2libGUgLSBXaGV0aGVyIG91ciBwYXJlbnQgKGlmIGFueSkgaXMgcmVsYXRpdmVseSB2aXNpYmxlXHJcbiAgICogQHBhcmFtIHtib29sZWFufSB1cGRhdGVGdWxsU3VidHJlZSAtIElmIHRydWUsIHdlIHdpbGwgdmlzaXQgdGhlIGVudGlyZSBzdWJ0cmVlIHRvIGVuc3VyZSB2aXNpYmlsaXR5IGlzIGNvcnJlY3QuXHJcbiAgICovXHJcbiAgdXBkYXRlVmlzaWJpbGl0eSggcGFyZW50R2xvYmFsbHlWaXNpYmxlLCBwYXJlbnRHbG9iYWxseVZvaWNpbmdWaXNpYmxlLCBwYXJlbnRSZWxhdGl2ZWx5VmlzaWJsZSwgdXBkYXRlRnVsbFN1YnRyZWUgKSB7XHJcbiAgICAvLyBJZiBvdXIgdmlzaWJpbGl0eSBmbGFnIGZvciBvdXJzZWxmIGlzIGRpcnR5LCB3ZSBuZWVkIHRvIHVwZGF0ZSBvdXIgZW50aXJlIHN1YnRyZWVcclxuICAgIGlmICggdGhpcy52aXNpYmlsaXR5RGlydHkgKSB7XHJcbiAgICAgIHVwZGF0ZUZ1bGxTdWJ0cmVlID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBjYWxjdWxhdGUgb3VyIHZpc2liaWxpdGllc1xyXG4gICAgY29uc3Qgbm9kZVZpc2libGUgPSB0aGlzLm5vZGUuaXNWaXNpYmxlKCk7XHJcbiAgICBjb25zdCB3YXNWaXNpYmxlID0gdGhpcy52aXNpYmxlO1xyXG4gICAgY29uc3Qgd2FzUmVsYXRpdmVWaXNpYmxlID0gdGhpcy5yZWxhdGl2ZVZpc2libGU7XHJcbiAgICBjb25zdCB3YXNTZWxmVmlzaWJsZSA9IHRoaXMuc2VsZlZpc2libGU7XHJcbiAgICBjb25zdCBub2RlVm9pY2luZ1Zpc2libGUgPSB0aGlzLm5vZGUudm9pY2luZ1Zpc2libGVQcm9wZXJ0eS52YWx1ZTtcclxuICAgIGNvbnN0IHdhc1ZvaWNpbmdWaXNpYmxlID0gdGhpcy52b2ljaW5nVmlzaWJsZTtcclxuICAgIGNvbnN0IGNvdWxkVm9pY2UgPSB3YXNWaXNpYmxlICYmIHdhc1ZvaWNpbmdWaXNpYmxlO1xyXG4gICAgdGhpcy52aXNpYmxlID0gcGFyZW50R2xvYmFsbHlWaXNpYmxlICYmIG5vZGVWaXNpYmxlO1xyXG4gICAgdGhpcy52b2ljaW5nVmlzaWJsZSA9IHBhcmVudEdsb2JhbGx5Vm9pY2luZ1Zpc2libGUgJiYgbm9kZVZvaWNpbmdWaXNpYmxlO1xyXG4gICAgdGhpcy5yZWxhdGl2ZVZpc2libGUgPSBwYXJlbnRSZWxhdGl2ZWx5VmlzaWJsZSAmJiBub2RlVmlzaWJsZTtcclxuICAgIHRoaXMuc2VsZlZpc2libGUgPSB0aGlzLmlzVmlzaWJpbGl0eUFwcGxpZWQgPyB0cnVlIDogdGhpcy5yZWxhdGl2ZVZpc2libGU7XHJcblxyXG4gICAgY29uc3QgbGVuID0gdGhpcy5jaGlsZHJlbi5sZW5ndGg7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBsZW47IGkrKyApIHtcclxuICAgICAgY29uc3QgY2hpbGQgPSB0aGlzLmNoaWxkcmVuWyBpIF07XHJcblxyXG4gICAgICBpZiAoIHVwZGF0ZUZ1bGxTdWJ0cmVlIHx8IGNoaWxkLnZpc2liaWxpdHlEaXJ0eSB8fCBjaGlsZC5jaGlsZFZpc2liaWxpdHlEaXJ0eSApIHtcclxuICAgICAgICAvLyBpZiB3ZSBhcmUgYSB2aXNpYmlsaXR5IHJvb3QgKGlzVmlzaWJpbGl0eUFwcGxpZWQ9PT10cnVlKSwgZGlzcmVnYXJkIGFuY2VzdG9yIHZpc2liaWxpdHlcclxuICAgICAgICBjaGlsZC51cGRhdGVWaXNpYmlsaXR5KCB0aGlzLnZpc2libGUsIHRoaXMudm9pY2luZ1Zpc2libGUsIHRoaXMuaXNWaXNpYmlsaXR5QXBwbGllZCA/IHRydWUgOiB0aGlzLnJlbGF0aXZlVmlzaWJsZSwgdXBkYXRlRnVsbFN1YnRyZWUgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudmlzaWJpbGl0eURpcnR5ID0gZmFsc2U7XHJcbiAgICB0aGlzLmNoaWxkVmlzaWJpbGl0eURpcnR5ID0gZmFsc2U7XHJcblxyXG4gICAgLy8gdHJpZ2dlciBjaGFuZ2VzIGFmdGVyIHdlIGRvIHRoZSBmdWxsIHZpc2liaWxpdHkgdXBkYXRlXHJcbiAgICBpZiAoIHRoaXMudmlzaWJsZSAhPT0gd2FzVmlzaWJsZSApIHtcclxuICAgICAgdGhpcy52aXNpYmxlRW1pdHRlci5lbWl0KCk7XHJcbiAgICB9XHJcbiAgICBpZiAoIHRoaXMucmVsYXRpdmVWaXNpYmxlICE9PSB3YXNSZWxhdGl2ZVZpc2libGUgKSB7XHJcbiAgICAgIHRoaXMucmVsYXRpdmVWaXNpYmxlRW1pdHRlci5lbWl0KCk7XHJcbiAgICB9XHJcbiAgICBpZiAoIHRoaXMuc2VsZlZpc2libGUgIT09IHdhc1NlbGZWaXNpYmxlICkge1xyXG4gICAgICB0aGlzLnNlbGZWaXNpYmxlRW1pdHRlci5lbWl0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQW4gSW5zdGFuY2UgY2FuIHZvaWNlIHdoZW4gaXQgaXMgZ2xvYmFsbHkgdmlzaWJsZSBhbmQgdm9pY2luZ1Zpc2libGUuIE5vdGlmeSB3aGVuIHRoaXMgc3RhdGUgaGFzIGNoYW5nZWRcclxuICAgIC8vIGJhc2VkIG9uIHRoZXNlIGRlcGVuZGVuY2llcy5cclxuICAgIGNvbnN0IGNhblZvaWNlID0gdGhpcy52b2ljaW5nVmlzaWJsZSAmJiB0aGlzLnZpc2libGU7XHJcbiAgICBpZiAoIGNhblZvaWNlICE9PSBjb3VsZFZvaWNlICkge1xyXG4gICAgICB0aGlzLmNhblZvaWNlRW1pdHRlci5lbWl0KCBjYW5Wb2ljZSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgZ2V0RGVzY2VuZGFudENvdW50KCkge1xyXG4gICAgbGV0IGNvdW50ID0gdGhpcy5jaGlsZHJlbi5sZW5ndGg7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb3VudCArPSB0aGlzLmNoaWxkcmVuWyBpIF0uZ2V0RGVzY2VuZGFudENvdW50KCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY291bnQ7XHJcbiAgfVxyXG5cclxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcclxuICAgKiBNaXNjZWxsYW5lb3VzXHJcbiAgICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkIGEgcmVmZXJlbmNlIGZvciBhbiBTVkcgZ3JvdXAgKGZhc3Rlc3Qgd2F5IHRvIHRyYWNrIHRoZW0pXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtTVkdHcm91cH0gZ3JvdXBcclxuICAgKi9cclxuICBhZGRTVkdHcm91cCggZ3JvdXAgKSB7XHJcbiAgICB0aGlzLnN2Z0dyb3Vwcy5wdXNoKCBncm91cCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlIGEgcmVmZXJlbmNlIGZvciBhbiBTVkcgZ3JvdXAgKGZhc3Rlc3Qgd2F5IHRvIHRyYWNrIHRoZW0pXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtTVkdHcm91cH0gZ3JvdXBcclxuICAgKi9cclxuICByZW1vdmVTVkdHcm91cCggZ3JvdXAgKSB7XHJcbiAgICBhcnJheVJlbW92ZSggdGhpcy5zdmdHcm91cHMsIGdyb3VwICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIG51bGwgd2hlbiBhIGxvb2t1cCBmYWlscyAod2hpY2ggaXMgbGVnaXRpbWF0ZSlcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1NWR0Jsb2NrfSBibG9ja1xyXG4gICAqIEByZXR1cm5zIHtTVkdHcm91cHxudWxsfVxyXG4gICAqL1xyXG4gIGxvb2t1cFNWR0dyb3VwKCBibG9jayApIHtcclxuICAgIGNvbnN0IGxlbiA9IHRoaXMuc3ZnR3JvdXBzLmxlbmd0aDtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGxlbjsgaSsrICkge1xyXG4gICAgICBjb25zdCBncm91cCA9IHRoaXMuc3ZnR3JvdXBzWyBpIF07XHJcbiAgICAgIGlmICggZ3JvdXAuYmxvY2sgPT09IGJsb2NrICkge1xyXG4gICAgICAgIHJldHVybiBncm91cDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGF0IGluc3RhbmNlIGhhdmUgZmlsdGVycyAob3BhY2l0eS92aXNpYmlsaXR5L2NsaXApIGJlZW4gYXBwbGllZCB1cCB0bz9cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7SW5zdGFuY2V9XHJcbiAgICovXHJcbiAgZ2V0RmlsdGVyUm9vdEluc3RhbmNlKCkge1xyXG4gICAgaWYgKCB0aGlzLmlzQmFja2JvbmUgfHwgdGhpcy5pc0luc3RhbmNlQ2FudmFzQ2FjaGUgfHwgIXRoaXMucGFyZW50ICkge1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gdGhpcy5wYXJlbnQuZ2V0RmlsdGVyUm9vdEluc3RhbmNlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGF0IGluc3RhbmNlIHRyYW5zZm9ybXMgaGF2ZSBiZWVuIGFwcGxpZWQgdXAgdG8/XHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge0luc3RhbmNlfVxyXG4gICAqL1xyXG4gIGdldFRyYW5zZm9ybVJvb3RJbnN0YW5jZSgpIHtcclxuICAgIGlmICggdGhpcy5pc1RyYW5zZm9ybWVkIHx8ICF0aGlzLnBhcmVudCApIHtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIHRoaXMucGFyZW50LmdldFRyYW5zZm9ybVJvb3RJbnN0YW5jZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge0luc3RhbmNlfVxyXG4gICAqL1xyXG4gIGdldFZpc2liaWxpdHlSb290SW5zdGFuY2UoKSB7XHJcbiAgICBpZiAoIHRoaXMuaXNWaXNpYmlsaXR5QXBwbGllZCB8fCAhdGhpcy5wYXJlbnQgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnBhcmVudC5nZXRWaXNpYmlsaXR5Um9vdEluc3RhbmNlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIGF0dGFjaE5vZGVMaXN0ZW5lcnMoKSB7XHJcbiAgICAvLyBhdHRhY2ggbGlzdGVuZXJzIHRvIG91ciBub2RlXHJcbiAgICB0aGlzLnJlbGF0aXZlVHJhbnNmb3JtLmF0dGFjaE5vZGVMaXN0ZW5lcnMoKTtcclxuXHJcbiAgICBpZiAoICF0aGlzLmlzU2hhcmVkQ2FudmFzQ2FjaGVQbGFjZWhvbGRlciApIHtcclxuICAgICAgdGhpcy5ub2RlLmNoaWxkSW5zZXJ0ZWRFbWl0dGVyLmFkZExpc3RlbmVyKCB0aGlzLmNoaWxkSW5zZXJ0ZWRMaXN0ZW5lciApO1xyXG4gICAgICB0aGlzLm5vZGUuY2hpbGRSZW1vdmVkRW1pdHRlci5hZGRMaXN0ZW5lciggdGhpcy5jaGlsZFJlbW92ZWRMaXN0ZW5lciApO1xyXG4gICAgICB0aGlzLm5vZGUuY2hpbGRyZW5SZW9yZGVyZWRFbWl0dGVyLmFkZExpc3RlbmVyKCB0aGlzLmNoaWxkcmVuUmVvcmRlcmVkTGlzdGVuZXIgKTtcclxuICAgICAgdGhpcy5ub2RlLnZpc2libGVQcm9wZXJ0eS5sYXp5TGluayggdGhpcy52aXNpYmlsaXR5TGlzdGVuZXIgKTtcclxuXHJcbiAgICAgIC8vIE1hcmtzIGFsbCB2aXNpYmlsaXR5IGRpcnR5IHdoZW4gdm9pY2luZ1Zpc2libGUgY2hhbmdlcyB0byBjYXVzZSBuZWNlc3NhcnkgdXBkYXRlcyBmb3Igdm9pY2luZ1Zpc2libGVcclxuICAgICAgdGhpcy5ub2RlLnZvaWNpbmdWaXNpYmxlUHJvcGVydHkubGF6eUxpbmsoIHRoaXMudmlzaWJpbGl0eUxpc3RlbmVyICk7XHJcblxyXG4gICAgICB0aGlzLm5vZGUuZmlsdGVyQ2hhbmdlRW1pdHRlci5hZGRMaXN0ZW5lciggdGhpcy5tYXJrUmVuZGVyU3RhdGVEaXJ0eUxpc3RlbmVyICk7XHJcbiAgICAgIHRoaXMubm9kZS5jbGlwQXJlYVByb3BlcnR5LmxhenlMaW5rKCB0aGlzLm1hcmtSZW5kZXJTdGF0ZURpcnR5TGlzdGVuZXIgKTtcclxuICAgICAgdGhpcy5ub2RlLmluc3RhbmNlUmVmcmVzaEVtaXR0ZXIuYWRkTGlzdGVuZXIoIHRoaXMubWFya1JlbmRlclN0YXRlRGlydHlMaXN0ZW5lciApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBkZXRhY2hOb2RlTGlzdGVuZXJzKCkge1xyXG4gICAgdGhpcy5yZWxhdGl2ZVRyYW5zZm9ybS5kZXRhY2hOb2RlTGlzdGVuZXJzKCk7XHJcblxyXG4gICAgaWYgKCAhdGhpcy5pc1NoYXJlZENhbnZhc0NhY2hlUGxhY2Vob2xkZXIgKSB7XHJcbiAgICAgIHRoaXMubm9kZS5jaGlsZEluc2VydGVkRW1pdHRlci5yZW1vdmVMaXN0ZW5lciggdGhpcy5jaGlsZEluc2VydGVkTGlzdGVuZXIgKTtcclxuICAgICAgdGhpcy5ub2RlLmNoaWxkUmVtb3ZlZEVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoIHRoaXMuY2hpbGRSZW1vdmVkTGlzdGVuZXIgKTtcclxuICAgICAgdGhpcy5ub2RlLmNoaWxkcmVuUmVvcmRlcmVkRW1pdHRlci5yZW1vdmVMaXN0ZW5lciggdGhpcy5jaGlsZHJlblJlb3JkZXJlZExpc3RlbmVyICk7XHJcbiAgICAgIHRoaXMubm9kZS52aXNpYmxlUHJvcGVydHkudW5saW5rKCB0aGlzLnZpc2liaWxpdHlMaXN0ZW5lciApO1xyXG4gICAgICB0aGlzLm5vZGUudm9pY2luZ1Zpc2libGVQcm9wZXJ0eS51bmxpbmsoIHRoaXMudmlzaWJpbGl0eUxpc3RlbmVyICk7XHJcblxyXG4gICAgICB0aGlzLm5vZGUuZmlsdGVyQ2hhbmdlRW1pdHRlci5yZW1vdmVMaXN0ZW5lciggdGhpcy5tYXJrUmVuZGVyU3RhdGVEaXJ0eUxpc3RlbmVyICk7XHJcbiAgICAgIHRoaXMubm9kZS5jbGlwQXJlYVByb3BlcnR5LnVubGluayggdGhpcy5tYXJrUmVuZGVyU3RhdGVEaXJ0eUxpc3RlbmVyICk7XHJcbiAgICAgIHRoaXMubm9kZS5pbnN0YW5jZVJlZnJlc2hFbWl0dGVyLnJlbW92ZUxpc3RlbmVyKCB0aGlzLm1hcmtSZW5kZXJTdGF0ZURpcnR5TGlzdGVuZXIgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEVuc3VyZSB0aGF0IHRoZSByZW5kZXIgc3RhdGUgaXMgdXBkYXRlZCBpbiB0aGUgbmV4dCBzeW5jVHJlZSgpXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBtYXJrUmVuZGVyU3RhdGVEaXJ0eSgpIHtcclxuICAgIHRoaXMucmVuZGVyU3RhdGVEaXJ0eUZyYW1lID0gdGhpcy5kaXNwbGF5Ll9mcmFtZUlkO1xyXG5cclxuICAgIC8vIGVuc3VyZSB3ZSBhcmVuJ3QgcHJ1bmVkIChub3Qgc2V0IG9uIHRoaXMgaW5zdGFuY2UsIHNpbmNlIHdlIG1heSBub3QgbmVlZCB0byB2aXNpdCBvdXIgY2hpbGRyZW4pXHJcbiAgICB0aGlzLnBhcmVudCAmJiB0aGlzLnBhcmVudC5tYXJrU2tpcFBydW5pbmcoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEVuc3VyZSB0aGF0IHRoaXMgaW5zdGFuY2UgYW5kIGl0cyBjaGlsZHJlbiB3aWxsIGJlIHZpc2l0ZWQgaW4gdGhlIG5leHQgc3luY1RyZWUoKVxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgbWFya1NraXBQcnVuaW5nKCkge1xyXG4gICAgdGhpcy5za2lwUHJ1bmluZ0ZyYW1lID0gdGhpcy5kaXNwbGF5Ll9mcmFtZUlkO1xyXG5cclxuICAgIC8vIHdhbGsgaXQgdXAgdG8gdGhlIHJvb3RcclxuICAgIHRoaXMucGFyZW50ICYmIHRoaXMucGFyZW50Lm1hcmtTa2lwUHJ1bmluZygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogTk9URTogdXNlZCBpbiBDYW52YXNCbG9jayBpbnRlcm5hbHMsIHBlcmZvcm1hbmNlLWNyaXRpY2FsLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtJbnN0YW5jZX0gaW5zdGFuY2VcclxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAqL1xyXG4gIGdldEJyYW5jaEluZGV4VG8oIGluc3RhbmNlICkge1xyXG4gICAgY29uc3QgY2FjaGVkVmFsdWUgPSB0aGlzLmJyYW5jaEluZGV4TWFwWyBpbnN0YW5jZS5pZCBdO1xyXG4gICAgaWYgKCBjYWNoZWRWYWx1ZSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICByZXR1cm4gY2FjaGVkVmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgYnJhbmNoSW5kZXggPSB0aGlzLnRyYWlsLmdldEJyYW5jaEluZGV4VG8oIGluc3RhbmNlLnRyYWlsICk7XHJcbiAgICB0aGlzLmJyYW5jaEluZGV4TWFwWyBpbnN0YW5jZS5pZCBdID0gYnJhbmNoSW5kZXg7XHJcbiAgICBpbnN0YW5jZS5icmFuY2hJbmRleE1hcFsgdGhpcy5pZCBdID0gYnJhbmNoSW5kZXg7XHJcbiAgICB0aGlzLmJyYW5jaEluZGV4UmVmZXJlbmNlcy5wdXNoKCBpbnN0YW5jZSApO1xyXG4gICAgaW5zdGFuY2UuYnJhbmNoSW5kZXhSZWZlcmVuY2VzLnB1c2goIHRoaXMgKTtcclxuXHJcbiAgICByZXR1cm4gYnJhbmNoSW5kZXg7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDbGVhbiB1cCBsaXN0ZW5lcnMgYW5kIGdhcmJhZ2UsIHNvIHRoYXQgd2UgY2FuIGJlIHJlY3ljbGVkIChvciBwb29sZWQpXHJcbiAgICogQHB1YmxpY1xyXG4gICAqL1xyXG4gIGRpc3Bvc2UoKSB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5JbnN0YW5jZSggYGRpc3Bvc2UgJHt0aGlzLnRvU3RyaW5nKCl9YCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkluc3RhbmNlICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuYWN0aXZlLCAnU2VlbXMgbGlrZSB3ZSB0cmllZCB0byBkaXNwb3NlIHRoaXMgSW5zdGFuY2UgdHdpY2UsIGl0IGlzIG5vdCBhY3RpdmUnICk7XHJcblxyXG4gICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuXHJcbiAgICAvLyBSZW1vdmUgdGhlIGJpZGlyZWN0aW9uYWwgYnJhbmNoIGluZGV4IHJlZmVyZW5jZSBkYXRhIGZyb20gdGhpcyBpbnN0YW5jZSBhbmQgYW55IHJlZmVyZW5jZWQgaW5zdGFuY2VzLlxyXG4gICAgd2hpbGUgKCB0aGlzLmJyYW5jaEluZGV4UmVmZXJlbmNlcy5sZW5ndGggKSB7XHJcbiAgICAgIGNvbnN0IHJlZmVyZW5jZUluc3RhbmNlID0gdGhpcy5icmFuY2hJbmRleFJlZmVyZW5jZXMucG9wKCk7XHJcbiAgICAgIGRlbGV0ZSB0aGlzLmJyYW5jaEluZGV4TWFwWyByZWZlcmVuY2VJbnN0YW5jZS5pZCBdO1xyXG4gICAgICBkZWxldGUgcmVmZXJlbmNlSW5zdGFuY2UuYnJhbmNoSW5kZXhNYXBbIHRoaXMuaWQgXTtcclxuICAgICAgYXJyYXlSZW1vdmUoIHJlZmVyZW5jZUluc3RhbmNlLmJyYW5jaEluZGV4UmVmZXJlbmNlcywgdGhpcyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIG9yZGVyIGlzIHNvbWV3aGF0IGltcG9ydGFudFxyXG4gICAgdGhpcy5ncm91cERyYXdhYmxlICYmIHRoaXMuZ3JvdXBEcmF3YWJsZS5kaXNwb3NlSW1tZWRpYXRlbHkoIHRoaXMuZGlzcGxheSApO1xyXG4gICAgdGhpcy5zaGFyZWRDYWNoZURyYXdhYmxlICYmIHRoaXMuc2hhcmVkQ2FjaGVEcmF3YWJsZS5kaXNwb3NlSW1tZWRpYXRlbHkoIHRoaXMuZGlzcGxheSApO1xyXG4gICAgdGhpcy5zZWxmRHJhd2FibGUgJiYgdGhpcy5zZWxmRHJhd2FibGUuZGlzcG9zZUltbWVkaWF0ZWx5KCB0aGlzLmRpc3BsYXkgKTtcclxuXHJcbiAgICAvLyBEaXNwb3NlIHRoZSByZXN0IG9mIG91ciBzdWJ0cmVlXHJcbiAgICBjb25zdCBudW1DaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbnVtQ2hpbGRyZW47IGkrKyApIHtcclxuICAgICAgdGhpcy5jaGlsZHJlblsgaSBdLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuICAgIC8vIENoZWNrIGZvciBjaGlsZCBpbnN0YW5jZXMgdGhhdCB3ZXJlIHJlbW92ZWQgKHdlIGFyZSBzdGlsbCByZXNwb25zaWJsZSBmb3IgZGlzcG9zaW5nIHRoZW0sIHNpbmNlIHdlIGRpZG4ndCBnZXRcclxuICAgIC8vIHN5bmN0cmVlIHRvIGhhcHBlbiBmb3IgdGhlbSkuXHJcbiAgICB3aGlsZSAoIHRoaXMuaW5zdGFuY2VSZW1vdmFsQ2hlY2tMaXN0Lmxlbmd0aCApIHtcclxuICAgICAgY29uc3QgY2hpbGQgPSB0aGlzLmluc3RhbmNlUmVtb3ZhbENoZWNrTGlzdC5wb3AoKTtcclxuXHJcbiAgICAgIC8vIHRoZXkgY291bGQgaGF2ZSBhbHJlYWR5IGJlZW4gZGlzcG9zZWQsIHNvIHdlIG5lZWQgYSBndWFyZCBoZXJlXHJcbiAgICAgIGlmICggY2hpbGQuYWN0aXZlICkge1xyXG4gICAgICAgIGNoaWxkLmRpc3Bvc2UoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHdlIGRvbid0IG9yaWdpbmFsbHkgYWRkIGluIHRoZSBsaXN0ZW5lciBpZiB3ZSBhcmUgc3RhdGVsZXNzXHJcbiAgICBpZiAoICF0aGlzLnN0YXRlbGVzcyApIHtcclxuICAgICAgdGhpcy5kZXRhY2hOb2RlTGlzdGVuZXJzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5ub2RlLnJlbW92ZUluc3RhbmNlKCB0aGlzICk7XHJcblxyXG4gICAgLy8gcmVsZWFzZSBvdXIgcmVmZXJlbmNlIHRvIGEgc2hhcmVkIGNhY2hlIGlmIGFwcGxpY2FibGUsIGFuZCBkaXNwb3NlIGlmIHRoZXJlIGFyZSBubyBvdGhlciByZWZlcmVuY2VzXHJcbiAgICBpZiAoIHRoaXMuc2hhcmVkQ2FjaGVJbnN0YW5jZSApIHtcclxuICAgICAgdGhpcy5zaGFyZWRDYWNoZUluc3RhbmNlLmV4dGVybmFsUmVmZXJlbmNlQ291bnQtLTtcclxuICAgICAgaWYgKCB0aGlzLnNoYXJlZENhY2hlSW5zdGFuY2UuZXh0ZXJuYWxSZWZlcmVuY2VDb3VudCA9PT0gMCApIHtcclxuICAgICAgICBkZWxldGUgdGhpcy5kaXNwbGF5Ll9zaGFyZWRDYW52YXNJbnN0YW5jZXNbIHRoaXMubm9kZS5nZXRJZCgpIF07XHJcbiAgICAgICAgdGhpcy5zaGFyZWRDYWNoZUluc3RhbmNlLmRpc3Bvc2UoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGNsZWFuIG91ciB2YXJpYWJsZXMgb3V0IHRvIHJlbGVhc2UgbWVtb3J5XHJcbiAgICB0aGlzLmNsZWFuSW5zdGFuY2UoIG51bGwsIG51bGwgKTtcclxuXHJcbiAgICB0aGlzLnZpc2libGVFbWl0dGVyLnJlbW92ZUFsbExpc3RlbmVycygpO1xyXG4gICAgdGhpcy5yZWxhdGl2ZVZpc2libGVFbWl0dGVyLnJlbW92ZUFsbExpc3RlbmVycygpO1xyXG4gICAgdGhpcy5zZWxmVmlzaWJsZUVtaXR0ZXIucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XHJcbiAgICB0aGlzLmNhblZvaWNlRW1pdHRlci5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcclxuXHJcbiAgICB0aGlzLmZyZWVUb1Bvb2woKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBmcmFtZUlkXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBhbGxvd1ZhbGlkYXRpb25Ob3ROZWVkZWRDaGVja3NcclxuICAgKi9cclxuICBhdWRpdCggZnJhbWVJZCwgYWxsb3dWYWxpZGF0aW9uTm90TmVlZGVkQ2hlY2tzICkge1xyXG4gICAgaWYgKCBhc3NlcnRTbG93ICkge1xyXG4gICAgICBpZiAoIGZyYW1lSWQgPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICBmcmFtZUlkID0gdGhpcy5kaXNwbGF5Ll9mcmFtZUlkO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBhc3NlcnRTbG93KCAhdGhpcy5zdGF0ZWxlc3MsXHJcbiAgICAgICAgJ1N0YXRlIGlzIHJlcXVpcmVkIGZvciBhbGwgZGlzcGxheSBpbnN0YW5jZXMnICk7XHJcblxyXG4gICAgICBhc3NlcnRTbG93KCAoIHRoaXMuZmlyc3REcmF3YWJsZSA9PT0gbnVsbCApID09PSAoIHRoaXMubGFzdERyYXdhYmxlID09PSBudWxsICksXHJcbiAgICAgICAgJ0ZpcnN0L2xhc3QgZHJhd2FibGVzIG5lZWQgdG8gYm90aCBiZSBudWxsIG9yIG5vbi1udWxsJyApO1xyXG5cclxuICAgICAgYXNzZXJ0U2xvdyggKCAhdGhpcy5pc0JhY2tib25lICYmICF0aGlzLmlzU2hhcmVkQ2FudmFzQ2FjaGVQbGFjZWhvbGRlciApIHx8IHRoaXMuZ3JvdXBEcmF3YWJsZSxcclxuICAgICAgICAnSWYgd2UgYXJlIGEgYmFja2JvbmUgb3Igc2hhcmVkIGNhY2hlLCB3ZSBuZWVkIHRvIGhhdmUgYSBncm91cERyYXdhYmxlIHJlZmVyZW5jZScgKTtcclxuXHJcbiAgICAgIGFzc2VydFNsb3coICF0aGlzLmlzU2hhcmVkQ2FudmFzQ2FjaGVQbGFjZWhvbGRlciB8fCAhdGhpcy5ub2RlLmlzUGFpbnRlZCgpIHx8IHRoaXMuc2VsZkRyYXdhYmxlLFxyXG4gICAgICAgICdXZSBuZWVkIHRvIGhhdmUgYSBzZWxmRHJhd2FibGUgaWYgd2UgYXJlIHBhaW50ZWQgYW5kIG5vdCBhIHNoYXJlZCBjYWNoZScgKTtcclxuXHJcbiAgICAgIGFzc2VydFNsb3coICggIXRoaXMuaXNUcmFuc2Zvcm1lZCAmJiAhdGhpcy5pc0NhbnZhc0NhY2hlICkgfHwgdGhpcy5ncm91cERyYXdhYmxlLFxyXG4gICAgICAgICdXZSBuZWVkIHRvIGhhdmUgYSBncm91cERyYXdhYmxlIGlmIHdlIGFyZSBhIGJhY2tib25lIG9yIGFueSB0eXBlIG9mIGNhbnZhcyBjYWNoZScgKTtcclxuXHJcbiAgICAgIGFzc2VydFNsb3coICF0aGlzLmlzU2hhcmVkQ2FudmFzQ2FjaGVQbGFjZWhvbGRlciB8fCB0aGlzLnNoYXJlZENhY2hlRHJhd2FibGUsXHJcbiAgICAgICAgJ1dlIG5lZWQgdG8gaGF2ZSBhIHNoYXJlZENhY2hlRHJhd2FibGUgaWYgd2UgYXJlIGEgc2hhcmVkIGNhY2hlJyApO1xyXG5cclxuICAgICAgYXNzZXJ0U2xvdyggdGhpcy5hZGRSZW1vdmVDb3VudGVyID09PSAwLFxyXG4gICAgICAgICdPdXIgYWRkUmVtb3ZlQ291bnRlciBzaG91bGQgYWx3YXlzIGJlIDAgYXQgdGhlIGVuZCBvZiBzeW5jVHJlZScgKTtcclxuXHJcbiAgICAgIC8vIHZhbGlkYXRlIHRoZSBzdWJ0cmVlXHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgY29uc3QgY2hpbGRJbnN0YW5jZSA9IHRoaXMuY2hpbGRyZW5bIGkgXTtcclxuXHJcbiAgICAgICAgY2hpbGRJbnN0YW5jZS5hdWRpdCggZnJhbWVJZCwgYWxsb3dWYWxpZGF0aW9uTm90TmVlZGVkQ2hlY2tzICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMucmVsYXRpdmVUcmFuc2Zvcm0uYXVkaXQoIGZyYW1lSWQsIGFsbG93VmFsaWRhdGlvbk5vdE5lZWRlZENoZWNrcyApO1xyXG5cclxuICAgICAgdGhpcy5maXR0YWJpbGl0eS5hdWRpdCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXBwbGllcyBjaGVja3MgdG8gbWFrZSBzdXJlIG91ciB2aXNpYmlsaXR5IHRyYWNraW5nIGlzIHdvcmtpbmcgYXMgZXhwZWN0ZWQuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBwYXJlbnRWaXNpYmxlXHJcbiAgICovXHJcbiAgYXVkaXRWaXNpYmlsaXR5KCBwYXJlbnRWaXNpYmxlICkge1xyXG4gICAgaWYgKCBhc3NlcnRTbG93ICkge1xyXG4gICAgICBjb25zdCB2aXNpYmxlID0gcGFyZW50VmlzaWJsZSAmJiB0aGlzLm5vZGUuaXNWaXNpYmxlKCk7XHJcbiAgICAgIGNvbnN0IHRyYWlsVmlzaWJsZSA9IHRoaXMudHJhaWwuaXNWaXNpYmxlKCk7XHJcbiAgICAgIGFzc2VydFNsb3coIHZpc2libGUgPT09IHRyYWlsVmlzaWJsZSwgJ1RyYWlsIHZpc2liaWxpdHkgZmFpbHVyZScgKTtcclxuICAgICAgYXNzZXJ0U2xvdyggdmlzaWJsZSA9PT0gdGhpcy52aXNpYmxlLCAnVmlzaWJsZSBmbGFnIGZhaWx1cmUnICk7XHJcblxyXG4gICAgICBhc3NlcnRTbG93KCB0aGlzLnZvaWNpbmdWaXNpYmxlID09PSBfLnJlZHVjZSggdGhpcy50cmFpbC5ub2RlcywgKCB2YWx1ZSwgbm9kZSApID0+IHZhbHVlICYmIG5vZGUudm9pY2luZ1Zpc2libGVQcm9wZXJ0eS52YWx1ZSwgdHJ1ZSApLFxyXG4gICAgICAgICdXaGVuIHRoaXMgSW5zdGFuY2UgaXMgdm9pY2luZ1Zpc2libGU6IHRydWUsIGFsbCBUcmFpbCBOb2RlcyBtdXN0IGFsc28gYmUgdm9pY2luZ1Zpc2libGU6IHRydWUnICk7XHJcblxyXG4gICAgICAvLyB2YWxpZGF0ZSB0aGUgc3VidHJlZVxyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIGNvbnN0IGNoaWxkSW5zdGFuY2UgPSB0aGlzLmNoaWxkcmVuWyBpIF07XHJcblxyXG4gICAgICAgIGNoaWxkSW5zdGFuY2UuYXVkaXRWaXNpYmlsaXR5KCB2aXNpYmxlICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0RyYXdhYmxlfG51bGx9IG9sZEZpcnN0RHJhd2FibGVcclxuICAgKiBAcGFyYW0ge0RyYXdhYmxlfG51bGx9IG9sZExhc3REcmF3YWJsZVxyXG4gICAqIEBwYXJhbSB7RHJhd2FibGV8bnVsbH0gbmV3Rmlyc3REcmF3YWJsZVxyXG4gICAqIEBwYXJhbSB7RHJhd2FibGV8bnVsbH0gbmV3TGFzdERyYXdhYmxlXHJcbiAgICovXHJcbiAgYXVkaXRDaGFuZ2VJbnRlcnZhbHMoIG9sZEZpcnN0RHJhd2FibGUsIG9sZExhc3REcmF3YWJsZSwgbmV3Rmlyc3REcmF3YWJsZSwgbmV3TGFzdERyYXdhYmxlICkge1xyXG4gICAgaWYgKCBvbGRGaXJzdERyYXdhYmxlICkge1xyXG4gICAgICBsZXQgb2xkT25lID0gb2xkRmlyc3REcmF3YWJsZTtcclxuXHJcbiAgICAgIC8vIHNob3VsZCBoaXQsIG9yIHdpbGwgaGF2ZSBOUEVcclxuICAgICAgd2hpbGUgKCBvbGRPbmUgIT09IG9sZExhc3REcmF3YWJsZSApIHtcclxuICAgICAgICBvbGRPbmUgPSBvbGRPbmUub2xkTmV4dERyYXdhYmxlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBuZXdGaXJzdERyYXdhYmxlICkge1xyXG4gICAgICBsZXQgbmV3T25lID0gbmV3Rmlyc3REcmF3YWJsZTtcclxuXHJcbiAgICAgIC8vIHNob3VsZCBoaXQsIG9yIHdpbGwgaGF2ZSBOUEVcclxuICAgICAgd2hpbGUgKCBuZXdPbmUgIT09IG5ld0xhc3REcmF3YWJsZSApIHtcclxuICAgICAgICBuZXdPbmUgPSBuZXdPbmUubmV4dERyYXdhYmxlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2hlY2tCZXR3ZWVuKCBhLCBiICkge1xyXG4gICAgICAvLyBoYXZlIHRoZSBib2R5IG9mIHRoZSBmdW5jdGlvbiBzdHJpcHBlZCAoaXQncyBub3QgaW5zaWRlIHRoZSBpZiBzdGF0ZW1lbnQgZHVlIHRvIEpTSGludClcclxuICAgICAgaWYgKCBhc3NlcnRTbG93ICkge1xyXG4gICAgICAgIGFzc2VydFNsb3coIGEgIT09IG51bGwgKTtcclxuICAgICAgICBhc3NlcnRTbG93KCBiICE9PSBudWxsICk7XHJcblxyXG4gICAgICAgIHdoaWxlICggYSAhPT0gYiApIHtcclxuICAgICAgICAgIGFzc2VydFNsb3coIGEubmV4dERyYXdhYmxlID09PSBhLm9sZE5leHREcmF3YWJsZSwgJ0NoYW5nZSBpbnRlcnZhbCBtaXNtYXRjaCcgKTtcclxuICAgICAgICAgIGEgPSBhLm5leHREcmF3YWJsZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIGFzc2VydFNsb3cgKSB7XHJcbiAgICAgIGNvbnN0IGZpcnN0Q2hhbmdlSW50ZXJ2YWwgPSB0aGlzLmZpcnN0Q2hhbmdlSW50ZXJ2YWw7XHJcbiAgICAgIGNvbnN0IGxhc3RDaGFuZ2VJbnRlcnZhbCA9IHRoaXMubGFzdENoYW5nZUludGVydmFsO1xyXG5cclxuICAgICAgaWYgKCAhZmlyc3RDaGFuZ2VJbnRlcnZhbCB8fCBmaXJzdENoYW5nZUludGVydmFsLmRyYXdhYmxlQmVmb3JlICE9PSBudWxsICkge1xyXG4gICAgICAgIGFzc2VydFNsb3coIG9sZEZpcnN0RHJhd2FibGUgPT09IG5ld0ZpcnN0RHJhd2FibGUsXHJcbiAgICAgICAgICAnSWYgd2UgaGF2ZSBubyBjaGFuZ2VzLCBvciBvdXIgZmlyc3QgY2hhbmdlIGludGVydmFsIGlzIG5vdCBvcGVuLCBvdXIgZmlyc3RzIHNob3VsZCBiZSB0aGUgc2FtZScgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoICFsYXN0Q2hhbmdlSW50ZXJ2YWwgfHwgbGFzdENoYW5nZUludGVydmFsLmRyYXdhYmxlQWZ0ZXIgIT09IG51bGwgKSB7XHJcbiAgICAgICAgYXNzZXJ0U2xvdyggb2xkTGFzdERyYXdhYmxlID09PSBuZXdMYXN0RHJhd2FibGUsXHJcbiAgICAgICAgICAnSWYgd2UgaGF2ZSBubyBjaGFuZ2VzLCBvciBvdXIgbGFzdCBjaGFuZ2UgaW50ZXJ2YWwgaXMgbm90IG9wZW4sIG91ciBsYXN0cyBzaG91bGQgYmUgdGhlIHNhbWUnICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggIWZpcnN0Q2hhbmdlSW50ZXJ2YWwgKSB7XHJcbiAgICAgICAgYXNzZXJ0U2xvdyggIWxhc3RDaGFuZ2VJbnRlcnZhbCwgJ1dlIHNob3VsZCBub3QgYmUgbWlzc2luZyBvbmx5IG9uZSBjaGFuZ2UgaW50ZXJ2YWwnICk7XHJcblxyXG4gICAgICAgIC8vIHdpdGggbm8gY2hhbmdlcywgZXZlcnl0aGluZyBzaG91bGQgYmUgaWRlbnRpY2FsXHJcbiAgICAgICAgb2xkRmlyc3REcmF3YWJsZSAmJiBjaGVja0JldHdlZW4oIG9sZEZpcnN0RHJhd2FibGUsIG9sZExhc3REcmF3YWJsZSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGFzc2VydFNsb3coIGxhc3RDaGFuZ2VJbnRlcnZhbCwgJ1dlIHNob3VsZCBub3QgYmUgbWlzc2luZyBvbmx5IG9uZSBjaGFuZ2UgaW50ZXJ2YWwnICk7XHJcblxyXG4gICAgICAgIC8vIGVuZHBvaW50c1xyXG4gICAgICAgIGlmICggZmlyc3RDaGFuZ2VJbnRlcnZhbC5kcmF3YWJsZUJlZm9yZSAhPT0gbnVsbCApIHtcclxuICAgICAgICAgIC8vIGNoZWNrIHRvIHRoZSBzdGFydCBpZiBhcHBsaWNhYmxlXHJcbiAgICAgICAgICBjaGVja0JldHdlZW4oIG9sZEZpcnN0RHJhd2FibGUsIGZpcnN0Q2hhbmdlSW50ZXJ2YWwuZHJhd2FibGVCZWZvcmUgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBsYXN0Q2hhbmdlSW50ZXJ2YWwuZHJhd2FibGVBZnRlciAhPT0gbnVsbCApIHtcclxuICAgICAgICAgIC8vIGNoZWNrIHRvIHRoZSBlbmQgaWYgYXBwbGljYWJsZVxyXG4gICAgICAgICAgY2hlY2tCZXR3ZWVuKCBsYXN0Q2hhbmdlSW50ZXJ2YWwuZHJhd2FibGVBZnRlciwgb2xkTGFzdERyYXdhYmxlICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBiZXR3ZWVuIGNoYW5nZSBpbnRlcnZhbHMgKHNob3VsZCBhbHdheXMgYmUgZ3VhcmFudGVlZCB0byBiZSBmaXhlZClcclxuICAgICAgICBsZXQgaW50ZXJ2YWwgPSBmaXJzdENoYW5nZUludGVydmFsO1xyXG4gICAgICAgIHdoaWxlICggaW50ZXJ2YWwgJiYgaW50ZXJ2YWwubmV4dENoYW5nZUludGVydmFsICkge1xyXG4gICAgICAgICAgY29uc3QgbmV4dEludGVydmFsID0gaW50ZXJ2YWwubmV4dENoYW5nZUludGVydmFsO1xyXG5cclxuICAgICAgICAgIGFzc2VydFNsb3coIGludGVydmFsLmRyYXdhYmxlQWZ0ZXIgIT09IG51bGwgKTtcclxuICAgICAgICAgIGFzc2VydFNsb3coIG5leHRJbnRlcnZhbC5kcmF3YWJsZUJlZm9yZSAhPT0gbnVsbCApO1xyXG5cclxuICAgICAgICAgIGNoZWNrQmV0d2VlbiggaW50ZXJ2YWwuZHJhd2FibGVBZnRlciwgbmV4dEludGVydmFsLmRyYXdhYmxlQmVmb3JlICk7XHJcblxyXG4gICAgICAgICAgaW50ZXJ2YWwgPSBuZXh0SW50ZXJ2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIGZvcm0gb2YgdGhpcyBvYmplY3RcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAqL1xyXG4gIHRvU3RyaW5nKCkge1xyXG4gICAgcmV0dXJuIGAke3RoaXMuaWR9IyR7dGhpcy5ub2RlID8gYCR7dGhpcy5ub2RlLmNvbnN0cnVjdG9yLm5hbWUgPyB0aGlzLm5vZGUuY29uc3RydWN0b3IubmFtZSA6ICc/J30jJHt0aGlzLm5vZGUuaWR9YCA6ICctJ31gO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ0luc3RhbmNlJywgSW5zdGFuY2UgKTtcclxuXHJcbi8vIG9iamVjdCBwb29saW5nXHJcblBvb2xhYmxlLm1peEludG8oIEluc3RhbmNlICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBJbnN0YW5jZTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFdBQVcsTUFBTSxpQ0FBaUM7QUFDekQsT0FBT0MsV0FBVyxNQUFNLHNDQUFzQztBQUM5RCxPQUFPQyxVQUFVLE1BQU0scUNBQXFDO0FBQzVELE9BQU9DLFFBQVEsTUFBTSxtQ0FBbUM7QUFDeEQsU0FBU0MsZ0JBQWdCLEVBQUVDLFdBQVcsRUFBRUMsY0FBYyxFQUFFQyxRQUFRLEVBQUVDLFdBQVcsRUFBRUMseUJBQXlCLEVBQUVDLGlCQUFpQixFQUFFQyxRQUFRLEVBQUVDLE9BQU8sRUFBRUMseUJBQXlCLEVBQUVDLEtBQUssRUFBRUMsS0FBSyxRQUFRLGVBQWU7O0FBRTlNO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBSUMsZUFBZSxHQUFHLENBQUM7O0FBRXZCO0FBQ0EsTUFBTUMseUJBQXlCLEdBQUdOLFFBQVEsQ0FBQ08sa0JBQWtCLENBQzNEUCxRQUFRLENBQUNRLFVBQVUsRUFDbkJSLFFBQVEsQ0FBQ1MsYUFBYSxFQUN0QlQsUUFBUSxDQUFDVSxVQUFVLEVBQ25CVixRQUFRLENBQUNXLFlBQ1gsQ0FBQztBQUVELE1BQU1D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