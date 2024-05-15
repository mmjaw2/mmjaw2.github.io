// Copyright 2013-2024, University of Colorado Boulder

/**
 * A persistent display of a specific Node and its descendants, which is updated at discrete points in time.
 *
 * Use display.getDOMElement or display.domElement to retrieve the Display's DOM representation.
 * Use display.updateDisplay() to trigger the visual update in the Display's DOM element.
 *
 * A standard way of using a Display with Scenery is to:
 * 1. Create a Node that will be the root
 * 2. Create a Display, referencing that node
 * 3. Make changes to the scene graph
 * 4. Call display.updateDisplay() to draw the scene graph into the Display
 * 5. Go to (3)
 *
 * Common ways to simplify the change/update loop would be to:
 * - Use Node-based events. Initialize it with Display.initializeEvents(), then
 *   add input listeners to parts of the scene graph (see Node.addInputListener).
 * - Execute code (and update the display afterwards) by using Display.updateOnRequestAnimationFrame.
 *
 * Internal documentation:
 *
 * Lifecycle information:
 *   Instance (create,dispose)
 *     - out of update:            Stateless stub is created synchronously when a Node's children are added where we
 *                                 have no relevant Instance.
 *     - start of update:          Creates first (root) instance if it doesn't exist (stateless stub).
 *     - synctree:                 Create descendant instances under stubs, fills in state, and marks removed subtree
 *                                 roots for disposal.
 *     - update instance disposal: Disposes root instances that were marked. This also disposes all descendant
 *                                 instances, and for every instance,
 *                                 it disposes the currently-attached drawables.
 *   Drawable (create,dispose)
 *     - synctree:                 Creates all drawables where necessary. If it replaces a self/group/shared drawable on
 *                                 the instance,
 *                                 that old drawable is marked for disposal.
 *     - update instance disposal: Any drawables attached to disposed instances are disposed themselves (see Instance
 *                                 lifecycle).
 *     - update drawable disposal: Any marked drawables that were replaced or removed from an instance (it didn't
 *                                 maintain a reference) are disposed.
 *
 *   add/remove drawables from blocks:
 *     - stitching changes pending "parents", marks for block update
 *     - backbones marked for disposal (e.g. instance is still there, just changed to not have a backbone) will mark
 *         drawables for block updates
 *     - add/remove drawables phase updates drawables that were marked
 *     - disposed backbone instances will only remove drawables if they weren't marked for removal previously (e.g. in
 *         case we are from a removed instance)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Emitter from '../../../axon/js/Emitter.js';
import stepTimer from '../../../axon/js/stepTimer.js';
import TinyProperty from '../../../axon/js/TinyProperty.js';
import Dimension2 from '../../../dot/js/Dimension2.js';
import { Matrix3Type } from '../../../dot/js/Matrix3.js';
import escapeHTML from '../../../phet-core/js/escapeHTML.js';
import optionize from '../../../phet-core/js/optionize.js';
import platform from '../../../phet-core/js/platform.js';
import AriaLiveAnnouncer from '../../../utterance-queue/js/AriaLiveAnnouncer.js';
import UtteranceQueue from '../../../utterance-queue/js/UtteranceQueue.js';
import { BackboneDrawable, Block, CanvasBlock, CanvasNodeBoundsOverlay, Color, DOMBlock, DOMDrawable, Features, FittedBlockBoundsOverlay, FocusManager, FullScreen, globalKeyStateTracker, HighlightOverlay, HitAreaOverlay, Input, Instance, KeyboardUtils, Node, PDOMInstance, PDOMSiblingStyle, PDOMTree, PDOMUtils, PointerAreaOverlay, PointerOverlay, Renderer, scenery, scenerySerialize, Trail, Utils, WebGLBlock } from '../imports.js';
import SafariWorkaroundOverlay from '../overlays/SafariWorkaroundOverlay.js';
const CUSTOM_CURSORS = {
  'scenery-grab-pointer': ['grab', '-moz-grab', '-webkit-grab', 'pointer'],
  'scenery-grabbing-pointer': ['grabbing', '-moz-grabbing', '-webkit-grabbing', 'pointer']
};
let globalIdCounter = 1;
export default class Display {
  // unique ID for the display instance, (scenery-internal), and useful for debugging with multiple displays.

  // The (integral, > 0) dimensions of the Display's DOM element (only updates the DOM element on updateDisplay())

  // data structure for managing aria-live alerts the this Display instance

  // Manages the various types of Focus that can go through the Display, as well as Properties
  // controlling which forms of focus should be displayed in the HighlightOverlay.

  // (phet-io,scenery) - Will be filled in with a phet.scenery.Input if event handling is enabled

  // (scenery-internal) Whether accessibility is enabled for this particular display.

  // (scenery-internal)

  // (scenery-internal) map from Node ID to Instance, for fast lookup

  // (scenery-internal) - We have a monotonically-increasing frame ID, generally for use with a pattern
  // where we can mark objects with this to note that they are either up-to-date or need refreshing due to this
  // particular frame (without having to clear that information after use). This is incremented every frame

  // (scenery-internal)

  // to be filled in later

  // will be filled with the root Instance

  // Used to check against new size to see what we need to change

  // At the end of Display.update, reduceReferences will be called on all of these. It's meant to
  // catch various objects that would usually have update() called, but if they are invisible or otherwise not updated
  // for performance, they may need to release references another way instead.
  // See https://github.com/phetsims/energy-forms-and-changes/issues/356

  // Block changes are handled by changing the "pending" block/backbone on drawables. We
  // want to change them all after the main stitch process has completed, so we can guarantee that a single drawable is
  // removed from its previous block before being added to a new one. This is taken care of in an updateDisplay pass
  // after syncTree / stitching.

  // Drawables have two implicit linked-lists, "current" and "old". syncTree modifies the
  // "current" linked-list information so it is up-to-date, but needs to use the "old" information also. We move
  // updating the "current" => "old" linked-list information until after syncTree and stitching is complete, and is
  // taken care of in an updateDisplay pass.

  // We store information on {ChangeInterval}s that records change interval
  // information, that may contain references. We don't want to leave those references dangling after we don't need
  // them, so they are recorded and cleaned in one of updateDisplay's phases.

  // Used for shortcut animation frame functions

  // Listeners that will be called for every event.

  // Whether mouse/touch/keyboard inputs are enabled (if input has been added). Simulation will still step.

  // Passed through to Input

  // Overlays currently being displayed.

  // @assertion-only - Whether we are running the paint phase of updateDisplay() for this Display.

  // @assertion-only

  // @assertion-only Whether disposal has started (but not finished)

  // If accessible

  // (scenery-internal, if accessible)

  // (if accessible)

  // If logging performance

  // (scenery-internal) When fired, forces an SVG refresh, to try to work around issues
  // like https://github.com/phetsims/scenery/issues/1507
  _refreshSVGEmitter = new Emitter();

  // If true, we will refresh the SVG elements on the next frame
  _refreshSVGPending = false;

  /**
   * Constructs a Display that will show the rootNode and its subtree in a visual state. Default options provided below
   *
   * @param rootNode - Displays this node and all of its descendants
   * @param [providedOptions]
   */
  constructor(rootNode, providedOptions) {
    assert && assert(rootNode, 'rootNode is a required parameter');

    //OHTWO TODO: hybrid batching (option to batch until an event like 'up' that might be needed for security issues) https://github.com/phetsims/scenery/issues/1581

    const options = optionize()({
      // {number} - Initial display width
      width: providedOptions && providedOptions.container && providedOptions.container.clientWidth || 640,
      // {number} - Initial display height
      height: providedOptions && providedOptions.container && providedOptions.container.clientHeight || 480,
      // {boolean} - Applies CSS styles to the root DOM element that make it amenable to interactive content
      allowCSSHacks: true,
      allowSafariRedrawWorkaround: false,
      // {boolean} - Usually anything displayed outside of our dom element is hidden with CSS overflow
      allowSceneOverflow: false,
      allowLayerFitting: false,
      forceSVGRefresh: false,
      // {string} - What cursor is used when no other cursor is specified
      defaultCursor: 'default',
      // {ColorDef} - Initial background color
      backgroundColor: null,
      // {boolean} - Whether WebGL will preserve the drawing buffer
      preserveDrawingBuffer: false,
      // {boolean} - Whether WebGL is enabled at all for drawables in this Display
      allowWebGL: true,
      // {boolean} - Enables accessibility features
      accessibility: true,
      // {boolean} - See declaration.
      supportsInteractiveHighlights: false,
      // {boolean} - Whether mouse/touch/keyboard inputs are enabled (if input has been added).
      interactive: true,
      // {boolean} - If true, input event listeners will be attached to the Display's DOM element instead of the window.
      // Normally, attaching listeners to the window is preferred (it will see mouse moves/ups outside of the browser
      // window, allowing correct button tracking), however there may be instances where a global listener is not
      // preferred.
      listenToOnlyElement: false,
      // {boolean} - Forwarded to Input: If true, most event types will be batched until otherwise triggered.
      batchDOMEvents: false,
      // {boolean} - If true, the input event location (based on the top-left of the browser tab's viewport, with no
      // scaling applied) will be used. Usually, this is not a safe assumption, so when false the location of the
      // display's DOM element will be used to get the correct event location. There is a slight performance hit to
      // doing so, thus this option is provided if the top-left location can be guaranteed.
      // NOTE: Rotation of the Display's DOM element (e.g. with a CSS transform) will result in an incorrect event
      //       mapping, as getBoundingClientRect() can't work with this. getBoxQuads() should fix this when browser
      //       support is available.
      assumeFullWindow: false,
      // {boolean} - Whether Scenery will try to aggressively re-create WebGL Canvas/context instead of waiting for
      // a context restored event. Sometimes context losses can occur without a restoration afterwards, but this can
      // jump-start the process.
      // See https://github.com/phetsims/scenery/issues/347.
      aggressiveContextRecreation: true,
      // {boolean|null} - Whether the `passive` flag should be set when adding and removing DOM event listeners.
      // See https://github.com/phetsims/scenery/issues/770 for more details.
      // If it is true or false, that is the value of the passive flag that will be used. If it is null, the default
      // behavior of the browser will be used.
      //
      // Safari doesn't support touch-action: none, so we NEED to not use passive events (which would not allow
      // preventDefault to do anything, so drags actually can scroll the sim).
      // Chrome also did the same "passive by default", but because we have `touch-action: none` in place, it doesn't
      // affect us, and we can potentially get performance improvements by allowing passive events.
      // See https://github.com/phetsims/scenery/issues/770 for more information.
      passiveEvents: platform.safari ? false : null,
      // {boolean} - Whether, if no WebGL antialiasing is detected, the backing scale can be increased so as to
      //             provide some antialiasing benefit. See https://github.com/phetsims/scenery/issues/859.
      allowBackingScaleAntialiasing: true
    }, providedOptions);
    this.id = globalIdCounter++;
    this._accessible = options.accessibility;
    this._preserveDrawingBuffer = options.preserveDrawingBuffer;
    this._allowWebGL = options.allowWebGL;
    this._allowCSSHacks = options.allowCSSHacks;
    this._allowSceneOverflow = options.allowSceneOverflow;
    this._defaultCursor = options.defaultCursor;
    this.sizeProperty = new TinyProperty(new Dimension2(options.width, options.height));
    this._currentSize = new Dimension2(-1, -1);
    this._rootNode = rootNode;
    this._rootNode.addRootedDisplay(this);
    this._rootBackbone = null; // to be filled in later
    this._domElement = options.container ? BackboneDrawable.repurposeBackboneContainer(options.container) : BackboneDrawable.createDivBackbone();
    this._sharedCanvasInstances = {};
    this._baseInstance = null; // will be filled with the root Instance
    this._frameId = 0;
    this._dirtyTransformRoots = [];
    this._dirtyTransformRootsWithoutPass = [];
    this._instanceRootsToDispose = [];
    this._reduceReferencesNeeded = [];
    this._drawablesToDispose = [];
    this._drawablesToChangeBlock = [];
    this._drawablesToUpdateLinks = [];
    this._changeIntervalsToDispose = [];
    this._lastCursor = null;
    this._currentBackgroundCSS = null;
    this._backgroundColor = null;
    this._requestAnimationFrameID = 0;
    this._input = null;
    this._inputListeners = [];
    this._interactive = options.interactive;
    this._listenToOnlyElement = options.listenToOnlyElement;
    this._batchDOMEvents = options.batchDOMEvents;
    this._assumeFullWindow = options.assumeFullWindow;
    this._passiveEvents = options.passiveEvents;
    this._aggressiveContextRecreation = options.aggressiveContextRecreation;
    this._allowBackingScaleAntialiasing = options.allowBackingScaleAntialiasing;
    this._allowLayerFitting = options.allowLayerFitting;
    this._forceSVGRefresh = options.forceSVGRefresh;
    this._overlays = [];
    this._pointerOverlay = null;
    this._pointerAreaOverlay = null;
    this._hitAreaOverlay = null;
    this._canvasAreaBoundsOverlay = null;
    this._fittedBlockBoundsOverlay = null;
    if (assert) {
      this._isPainting = false;
      this._isDisposing = false;
      this._isDisposed = false;
    }
    this.applyCSSHacks();
    this.setBackgroundColor(options.backgroundColor);
    const ariaLiveAnnouncer = new AriaLiveAnnouncer();
    this.descriptionUtteranceQueue = new UtteranceQueue(ariaLiveAnnouncer, {
      initialize: this._accessible,
      featureSpecificAnnouncingControlPropertyName: 'descriptionCanAnnounceProperty'
    });
    if (platform.safari && options.allowSafariRedrawWorkaround) {
      this.addOverlay(new SafariWorkaroundOverlay(this));
    }
    this.focusManager = new FocusManager();

    // Features that require the HighlightOverlay
    if (this._accessible || options.supportsInteractiveHighlights) {
      this._focusRootNode = new Node();
      this._focusOverlay = new HighlightOverlay(this, this._focusRootNode, {
        pdomFocusHighlightsVisibleProperty: this.focusManager.pdomFocusHighlightsVisibleProperty,
        interactiveHighlightsVisibleProperty: this.focusManager.interactiveHighlightsVisibleProperty,
        readingBlockHighlightsVisibleProperty: this.focusManager.readingBlockHighlightsVisibleProperty
      });
      this.addOverlay(this._focusOverlay);
    }
    if (this._accessible) {
      this._rootPDOMInstance = PDOMInstance.pool.create(null, this, new Trail());
      sceneryLog && sceneryLog.PDOMInstance && sceneryLog.PDOMInstance(`Display root instance: ${this._rootPDOMInstance.toString()}`);
      PDOMTree.rebuildInstanceTree(this._rootPDOMInstance);

      // add the accessible DOM as a child of this DOM element
      assert && assert(this._rootPDOMInstance.peer, 'Peer should be created from createFromPool');
      this._domElement.appendChild(this._rootPDOMInstance.peer.primarySibling);
      const ariaLiveContainer = ariaLiveAnnouncer.ariaLiveContainer;

      // add aria-live elements to the display
      this._domElement.appendChild(ariaLiveContainer);

      // set `user-select: none` on the aria-live container to prevent iOS text selection issue, see
      // https://github.com/phetsims/scenery/issues/1006
      // @ts-expect-error
      ariaLiveContainer.style[Features.userSelect] = 'none';

      // Prevent focus from being lost in FullScreen mode, listener on the globalKeyStateTracker
      // because tab navigation may happen before focus is within the PDOM. See handleFullScreenNavigation
      // for more.
      this._boundHandleFullScreenNavigation = this.handleFullScreenNavigation.bind(this);
      globalKeyStateTracker.keydownEmitter.addListener(this._boundHandleFullScreenNavigation);
    }
  }
  getDOMElement() {
    return this._domElement;
  }
  get domElement() {
    return this.getDOMElement();
  }

  /**
   * Updates the display's DOM element with the current visual state of the attached root node and its descendants
   */
  updateDisplay() {
    // @ts-expect-error scenery namespace
    if (sceneryLog && scenery.isLoggingPerformance()) {
      this.perfSyncTreeCount = 0;
      this.perfStitchCount = 0;
      this.perfIntervalCount = 0;
      this.perfDrawableBlockChangeCount = 0;
      this.perfDrawableOldIntervalCount = 0;
      this.perfDrawableNewIntervalCount = 0;
    }
    if (assert) {
      Display.assertSubtreeDisposed(this._rootNode);
    }
    sceneryLog && sceneryLog.Display && sceneryLog.Display(`updateDisplay frame ${this._frameId}`);
    sceneryLog && sceneryLog.Display && sceneryLog.push();
    const firstRun = !!this._baseInstance;

    // check to see whether contents under pointers changed (and if so, send the enter/exit events) to
    // maintain consistent state
    if (this._input) {
      // TODO: Should this be handled elsewhere? https://github.com/phetsims/scenery/issues/1581
      this._input.validatePointers();
    }
    if (this._accessible) {
      // update positioning of focusable peer siblings so they are discoverable on mobile assistive devices
      this._rootPDOMInstance.peer.updateSubtreePositioning();
    }

    // validate bounds for everywhere that could trigger bounds listeners. we want to flush out any changes, so that we can call validateBounds()
    // from code below without triggering side effects (we assume that we are not reentrant).
    this._rootNode.validateWatchedBounds();
    if (assertSlow) {
      this._accessible && this._rootPDOMInstance.auditRoot();
    }
    if (assertSlow) {
      this._rootNode._picker.audit();
    }

    // @ts-expect-error TODO Instance https://github.com/phetsims/scenery/issues/1581
    this._baseInstance = this._baseInstance || Instance.createFromPool(this, new Trail(this._rootNode), true, false);
    this._baseInstance.baseSyncTree();
    if (firstRun) {
      // @ts-expect-error TODO instance https://github.com/phetsims/scenery/issues/1581
      this.markTransformRootDirty(this._baseInstance, this._baseInstance.isTransformed); // marks the transform root as dirty (since it is)
    }

    // update our drawable's linked lists where necessary
    while (this._drawablesToUpdateLinks.length) {
      this._drawablesToUpdateLinks.pop().updateLinks();
    }

    // clean change-interval information from instances, so we don't leak memory/references
    while (this._changeIntervalsToDispose.length) {
      this._changeIntervalsToDispose.pop().dispose();
    }
    this._rootBackbone = this._rootBackbone || this._baseInstance.groupDrawable;
    assert && assert(this._rootBackbone, 'We are guaranteed a root backbone as the groupDrawable on the base instance');
    assert && assert(this._rootBackbone === this._baseInstance.groupDrawable, 'We don\'t want the base instance\'s groupDrawable to change');
    if (assertSlow) {
      this._rootBackbone.audit(true, false, true);
    } // allow pending blocks / dirty

    sceneryLog && sceneryLog.Display && sceneryLog.Display('drawable block change phase');
    sceneryLog && sceneryLog.Display && sceneryLog.push();
    while (this._drawablesToChangeBlock.length) {
      const changed = this._drawablesToChangeBlock.pop().updateBlock();
      // @ts-expect-error scenery namespace
      if (sceneryLog && scenery.isLoggingPerformance() && changed) {
        this.perfDrawableBlockChangeCount++;
      }
    }
    sceneryLog && sceneryLog.Display && sceneryLog.pop();
    if (assertSlow) {
      this._rootBackbone.audit(false, false, true);
    } // allow only dirty
    if (assertSlow) {
      this._baseInstance.audit(this._frameId, false);
    }

    // pre-repaint phase: update relative transform information for listeners (notification) and precomputation where desired
    this.updateDirtyTransformRoots();
    // pre-repaint phase update visibility information on instances
    this._baseInstance.updateVisibility(true, true, true, false);
    if (assertSlow) {
      this._baseInstance.auditVisibility(true);
    }
    if (assertSlow) {
      this._baseInstance.audit(this._frameId, true);
    }
    sceneryLog && sceneryLog.Display && sceneryLog.Display('instance root disposal phase');
    sceneryLog && sceneryLog.Display && sceneryLog.push();
    // dispose all of our instances. disposing the root will cause all descendants to also be disposed.
    // will also dispose attached drawables (self/group/etc.)
    while (this._instanceRootsToDispose.length) {
      this._instanceRootsToDispose.pop().dispose();
    }
    sceneryLog && sceneryLog.Display && sceneryLog.pop();
    if (assertSlow) {
      this._rootNode.auditInstanceSubtreeForDisplay(this);
    } // make sure trails are valid

    sceneryLog && sceneryLog.Display && sceneryLog.Display('drawable disposal phase');
    sceneryLog && sceneryLog.Display && sceneryLog.push();
    // dispose all of our other drawables.
    while (this._drawablesToDispose.length) {
      this._drawablesToDispose.pop().dispose();
    }
    sceneryLog && sceneryLog.Display && sceneryLog.pop();
    if (assertSlow) {
      this._baseInstance.audit(this._frameId, false);
    }
    if (assert) {
      assert(!this._isPainting, 'Display was already updating paint, may have thrown an error on the last update');
      this._isPainting = true;
    }

    // repaint phase
    //OHTWO TODO: can anything be updated more efficiently by tracking at the Display level? Remember, we have recursive updates so things get updated in the right order! https://github.com/phetsims/scenery/issues/1581
    sceneryLog && sceneryLog.Display && sceneryLog.Display('repaint phase');
    sceneryLog && sceneryLog.Display && sceneryLog.push();
    this._rootBackbone.update();
    sceneryLog && sceneryLog.Display && sceneryLog.pop();
    if (assert) {
      this._isPainting = false;
    }
    if (assertSlow) {
      this._rootBackbone.audit(false, false, false);
    } // allow nothing
    if (assertSlow) {
      this._baseInstance.audit(this._frameId, false);
    }
    this.updateCursor();
    this.updateBackgroundColor();
    this.updateSize();
    if (this._overlays.length) {
      let zIndex = this._rootBackbone.lastZIndex;
      for (let i = 0; i < this._overlays.length; i++) {
        // layer the overlays properly
        const overlay = this._overlays[i];
        overlay.domElement.style.zIndex = '' + zIndex++;
        overlay.update();
      }
    }

    // After our update and disposals, we want to eliminate any memory leaks from anything that wasn't updated.
    while (this._reduceReferencesNeeded.length) {
      this._reduceReferencesNeeded.pop().reduceReferences();
    }
    this._frameId++;

    // @ts-expect-error TODO scenery namespace https://github.com/phetsims/scenery/issues/1581
    if (sceneryLog && scenery.isLoggingPerformance()) {
      const syncTreeMessage = `syncTree count: ${this.perfSyncTreeCount}`;
      if (this.perfSyncTreeCount > 500) {
        sceneryLog.PerfCritical && sceneryLog.PerfCritical(syncTreeMessage);
      } else if (this.perfSyncTreeCount > 100) {
        sceneryLog.PerfMajor && sceneryLog.PerfMajor(syncTreeMessage);
      } else if (this.perfSyncTreeCount > 20) {
        sceneryLog.PerfMinor && sceneryLog.PerfMinor(syncTreeMessage);
      } else if (this.perfSyncTreeCount > 0) {
        sceneryLog.PerfVerbose && sceneryLog.PerfVerbose(syncTreeMessage);
      }
      const drawableBlockCountMessage = `drawable block changes: ${this.perfDrawableBlockChangeCount} for` + ` -${this.perfDrawableOldIntervalCount} +${this.perfDrawableNewIntervalCount}`;
      if (this.perfDrawableBlockChangeCount > 200) {
        sceneryLog.PerfCritical && sceneryLog.PerfCritical(drawableBlockCountMessage);
      } else if (this.perfDrawableBlockChangeCount > 60) {
        sceneryLog.PerfMajor && sceneryLog.PerfMajor(drawableBlockCountMessage);
      } else if (this.perfDrawableBlockChangeCount > 10) {
        sceneryLog.PerfMinor && sceneryLog.PerfMinor(drawableBlockCountMessage);
      } else if (this.perfDrawableBlockChangeCount > 0) {
        sceneryLog.PerfVerbose && sceneryLog.PerfVerbose(drawableBlockCountMessage);
      }
    }
    PDOMTree.auditPDOMDisplays(this.rootNode);
    if (this._forceSVGRefresh || this._refreshSVGPending) {
      this._refreshSVGPending = false;
      this.refreshSVG();
    }
    sceneryLog && sceneryLog.Display && sceneryLog.pop();
  }

  // Used for Studio Autoselect to determine the leafiest PhET-iO Element under the mouse
  getPhetioElementAt(point) {
    const node = this._rootNode.getPhetioMouseHit(point);
    if (node === 'phetioNotSelectable') {
      return null;
    }
    if (node) {
      assert && assert(node.isPhetioInstrumented(), 'a PhetioMouseHit should be instrumented');
    }
    return node;
  }
  updateSize() {
    let sizeDirty = false;
    //OHTWO TODO: if we aren't clipping or setting background colors, can we get away with having a 0x0 container div and using absolutely-positioned children? https://github.com/phetsims/scenery/issues/1581
    if (this.size.width !== this._currentSize.width) {
      sizeDirty = true;
      this._currentSize.width = this.size.width;
      this._domElement.style.width = `${this.size.width}px`;
    }
    if (this.size.height !== this._currentSize.height) {
      sizeDirty = true;
      this._currentSize.height = this.size.height;
      this._domElement.style.height = `${this.size.height}px`;
    }
    if (sizeDirty && !this._allowSceneOverflow) {
      // to prevent overflow, we add a CSS clip
      //TODO: 0px => 0? https://github.com/phetsims/scenery/issues/1581
      this._domElement.style.clip = `rect(0px,${this.size.width}px,${this.size.height}px,0px)`;
    }
  }

  /**
   * Whether WebGL is allowed to be used in drawables for this Display
   */
  isWebGLAllowed() {
    return this._allowWebGL;
  }
  get webglAllowed() {
    return this.isWebGLAllowed();
  }
  getRootNode() {
    return this._rootNode;
  }
  get rootNode() {
    return this.getRootNode();
  }
  getRootBackbone() {
    assert && assert(this._rootBackbone);
    return this._rootBackbone;
  }
  get rootBackbone() {
    return this.getRootBackbone();
  }

  /**
   * The dimensions of the Display's DOM element
   */
  getSize() {
    return this.sizeProperty.value;
  }
  get size() {
    return this.getSize();
  }
  getBounds() {
    return this.size.toBounds();
  }
  get bounds() {
    return this.getBounds();
  }

  /**
   * Changes the size that the Display's DOM element will be after the next updateDisplay()
   */
  setSize(size) {
    assert && assert(size.width % 1 === 0, 'Display.width should be an integer');
    assert && assert(size.width > 0, 'Display.width should be greater than zero');
    assert && assert(size.height % 1 === 0, 'Display.height should be an integer');
    assert && assert(size.height > 0, 'Display.height should be greater than zero');
    this.sizeProperty.value = size;
  }

  /**
   * Changes the size that the Display's DOM element will be after the next updateDisplay()
   */
  setWidthHeight(width, height) {
    this.setSize(new Dimension2(width, height));
  }

  /**
   * The width of the Display's DOM element
   */
  getWidth() {
    return this.size.width;
  }
  get width() {
    return this.getWidth();
  }
  set width(value) {
    this.setWidth(value);
  }

  /**
   * Sets the width that the Display's DOM element will be after the next updateDisplay(). Should be an integral value.
   */
  setWidth(width) {
    if (this.getWidth() !== width) {
      this.setSize(new Dimension2(width, this.getHeight()));
    }
    return this;
  }

  /**
   * The height of the Display's DOM element
   */
  getHeight() {
    return this.size.height;
  }
  get height() {
    return this.getHeight();
  }
  set height(value) {
    this.setHeight(value);
  }

  /**
   * Sets the height that the Display's DOM element will be after the next updateDisplay(). Should be an integral value.
   */
  setHeight(height) {
    if (this.getHeight() !== height) {
      this.setSize(new Dimension2(this.getWidth(), height));
    }
    return this;
  }

  /**
   * Will be applied to the root DOM element on updateDisplay(), and no sooner.
   */
  setBackgroundColor(color) {
    assert && assert(color === null || typeof color === 'string' || color instanceof Color);
    this._backgroundColor = color;
    return this;
  }
  set backgroundColor(value) {
    this.setBackgroundColor(value);
  }
  get backgroundColor() {
    return this.getBackgroundColor();
  }
  getBackgroundColor() {
    return this._backgroundColor;
  }
  get interactive() {
    return this._interactive;
  }
  set interactive(value) {
    if (this._accessible && value !== this._interactive) {
      this._rootPDOMInstance.peer.recursiveDisable(!value);
    }
    this._interactive = value;
    if (!this._interactive && this._input) {
      this._input.interruptPointers();
      this._input.clearBatchedEvents();
      this._input.removeTemporaryPointers();
      this._rootNode.interruptSubtreeInput();
      this.interruptInput();
    }
  }

  /**
   * Adds an overlay to the Display. Each overlay should have a .domElement (the DOM element that will be used for
   * display) and an .update() method.
   */
  addOverlay(overlay) {
    this._overlays.push(overlay);
    this._domElement.appendChild(overlay.domElement);

    // ensure that the overlay is hidden from screen readers, all accessible content should be in the dom element
    // of the this._rootPDOMInstance
    overlay.domElement.setAttribute('aria-hidden', 'true');
  }

  /**
   * Removes an overlay from the display.
   */
  removeOverlay(overlay) {
    this._domElement.removeChild(overlay.domElement);
    this._overlays.splice(_.indexOf(this._overlays, overlay), 1);
  }

  /**
   * Get the root accessible DOM element which represents this display and provides semantics for assistive
   * technology. If this Display is not accessible, returns null.
   */
  getPDOMRootElement() {
    return this._accessible ? this._rootPDOMInstance.peer.primarySibling : null;
  }
  get pdomRootElement() {
    return this.getPDOMRootElement();
  }

  /**
   * Has this Display enabled accessibility features like PDOM creation and support.
   */
  isAccessible() {
    return this._accessible;
  }

  /**
   * Returns true if the element is in the PDOM. That is only possible if the display is accessible.
   * @param element
   * @param allowRoot - If true, the root of the PDOM is also considered to be "under" the PDOM.
   */
  isElementUnderPDOM(element, allowRoot) {
    if (!this._accessible) {
      return false;
    }
    const isElementContained = this.pdomRootElement.contains(element);
    const isNotRootElement = element !== this.pdomRootElement;

    // If allowRoot is true, just return if the element is contained.
    // Otherwise, also ensure it's not the root element itself.
    return allowRoot ? isElementContained : isElementContained && isNotRootElement;
  }

  /**
   * Implements a workaround that prevents DOM focus from leaving the Display in FullScreen mode. There is
   * a bug in some browsers where DOM focus can be permanently lost if tabbing out of the FullScreen element,
   * see https://github.com/phetsims/scenery/issues/883.
   */
  handleFullScreenNavigation(domEvent) {
    assert && assert(this.pdomRootElement, 'There must be a PDOM to support keyboard navigation');
    if (FullScreen.isFullScreen() && KeyboardUtils.isKeyEvent(domEvent, KeyboardUtils.KEY_TAB)) {
      const rootElement = this.pdomRootElement;
      const nextElement = domEvent.shiftKey ? PDOMUtils.getPreviousFocusable(rootElement || undefined) : PDOMUtils.getNextFocusable(rootElement || undefined);
      if (nextElement === domEvent.target) {
        domEvent.preventDefault();
      }
    }
  }

  /**
   * Returns the bitmask union of all renderers (canvas/svg/dom/webgl) that are used for display, excluding
   * BackboneDrawables (which would be DOM).
   */
  getUsedRenderersBitmask() {
    function renderersUnderBackbone(backbone) {
      let bitmask = 0;
      _.each(backbone.blocks, block => {
        if (block instanceof DOMBlock && block.domDrawable instanceof BackboneDrawable) {
          bitmask = bitmask | renderersUnderBackbone(block.domDrawable);
        } else {
          bitmask = bitmask | block.renderer;
        }
      });
      return bitmask;
    }

    // only return the renderer-specific portion (no other hints, etc)
    return renderersUnderBackbone(this._rootBackbone) & Renderer.bitmaskRendererArea;
  }

  /**
   * Called from Instances that will need a transform update (for listeners and precomputation). (scenery-internal)
   *
   * @param instance
   * @param passTransform - Whether we should pass the first transform root when validating transforms (should
   * be true if the instance is transformed)
   */
  markTransformRootDirty(instance, passTransform) {
    passTransform ? this._dirtyTransformRoots.push(instance) : this._dirtyTransformRootsWithoutPass.push(instance);
  }
  updateDirtyTransformRoots() {
    sceneryLog && sceneryLog.transformSystem && sceneryLog.transformSystem('updateDirtyTransformRoots');
    sceneryLog && sceneryLog.transformSystem && sceneryLog.push();
    while (this._dirtyTransformRoots.length) {
      this._dirtyTransformRoots.pop().relativeTransform.updateTransformListenersAndCompute(false, false, this._frameId, true);
    }
    while (this._dirtyTransformRootsWithoutPass.length) {
      this._dirtyTransformRootsWithoutPass.pop().relativeTransform.updateTransformListenersAndCompute(false, false, this._frameId, false);
    }
    sceneryLog && sceneryLog.transformSystem && sceneryLog.pop();
  }

  /**
   * (scenery-internal)
   */
  markDrawableChangedBlock(drawable) {
    sceneryLog && sceneryLog.Display && sceneryLog.Display(`markDrawableChangedBlock: ${drawable.toString()}`);
    this._drawablesToChangeBlock.push(drawable);
  }

  /**
   * Marks an item for later reduceReferences() calls at the end of Display.update().
   * (scenery-internal)
   */
  markForReducedReferences(item) {
    assert && assert(!!item.reduceReferences);
    this._reduceReferencesNeeded.push(item);
  }

  /**
   * (scenery-internal)
   */
  markInstanceRootForDisposal(instance) {
    sceneryLog && sceneryLog.Display && sceneryLog.Display(`markInstanceRootForDisposal: ${instance.toString()}`);
    this._instanceRootsToDispose.push(instance);
  }

  /**
   * (scenery-internal)
   */
  markDrawableForDisposal(drawable) {
    sceneryLog && sceneryLog.Display && sceneryLog.Display(`markDrawableForDisposal: ${drawable.toString()}`);
    this._drawablesToDispose.push(drawable);
  }

  /**
   * (scenery-internal)
   */
  markDrawableForLinksUpdate(drawable) {
    this._drawablesToUpdateLinks.push(drawable);
  }

  /**
   * Add a {ChangeInterval} for the "remove change interval info" phase (we don't want to leak memory/references)
   * (scenery-internal)
   */
  markChangeIntervalToDispose(changeInterval) {
    this._changeIntervalsToDispose.push(changeInterval);
  }
  updateBackgroundColor() {
    assert && assert(this._backgroundColor === null || typeof this._backgroundColor === 'string' || this._backgroundColor instanceof Color);
    const newBackgroundCSS = this._backgroundColor === null ? '' : this._backgroundColor.toCSS ? this._backgroundColor.toCSS() : this._backgroundColor;
    if (newBackgroundCSS !== this._currentBackgroundCSS) {
      this._currentBackgroundCSS = newBackgroundCSS;
      this._domElement.style.backgroundColor = newBackgroundCSS;
    }
  }

  /*---------------------------------------------------------------------------*
   * Cursors
   *----------------------------------------------------------------------------*/

  updateCursor() {
    if (this._input && this._input.mouse && this._input.mouse.point) {
      if (this._input.mouse.cursor) {
        sceneryLog && sceneryLog.Cursor && sceneryLog.Cursor(`set on pointer: ${this._input.mouse.cursor}`);
        this.setSceneCursor(this._input.mouse.cursor);
        return;
      }

      //OHTWO TODO: For a display, just return an instance and we can avoid the garbage collection/mutation at the cost of the linked-list traversal instead of an array https://github.com/phetsims/scenery/issues/1581
      const mouseTrail = this._rootNode.trailUnderPointer(this._input.mouse);
      if (mouseTrail) {
        for (let i = mouseTrail.getCursorCheckIndex(); i >= 0; i--) {
          const node = mouseTrail.nodes[i];
          const cursor = node.getEffectiveCursor();
          if (cursor) {
            sceneryLog && sceneryLog.Cursor && sceneryLog.Cursor(`${cursor} on ${node.constructor.name}#${node.id}`);
            this.setSceneCursor(cursor);
            return;
          }
        }
      }
      sceneryLog && sceneryLog.Cursor && sceneryLog.Cursor(`--- for ${mouseTrail ? mouseTrail.toString() : '(no hit)'}`);
    }

    // fallback case
    this.setSceneCursor(this._defaultCursor);
  }

  /**
   * Sets the cursor to be displayed when over the Display.
   */
  setElementCursor(cursor) {
    this._domElement.style.cursor = cursor;

    // In some cases, Chrome doesn't seem to respect the cursor set on the Display's domElement. If we are using the
    // full window, we can apply the workaround of controlling the body's style.
    // See https://github.com/phetsims/scenery/issues/983
    if (this._assumeFullWindow) {
      document.body.style.cursor = cursor;
    }
  }
  setSceneCursor(cursor) {
    if (cursor !== this._lastCursor) {
      this._lastCursor = cursor;
      const customCursors = CUSTOM_CURSORS[cursor];
      if (customCursors) {
        // go backwards, so the most desired cursor sticks
        for (let i = customCursors.length - 1; i >= 0; i--) {
          this.setElementCursor(customCursors[i]);
        }
      } else {
        this.setElementCursor(cursor);
      }
    }
  }
  applyCSSHacks() {
    // to use CSS3 transforms for performance, hide anything outside our bounds by default
    if (!this._allowSceneOverflow) {
      this._domElement.style.overflow = 'hidden';
    }

    // forward all pointer events
    // @ts-expect-error legacy
    this._domElement.style.msTouchAction = 'none';

    // don't allow browser to switch between font smoothing methods for text (see https://github.com/phetsims/scenery/issues/431)
    Features.setStyle(this._domElement, Features.fontSmoothing, 'antialiased');
    if (this._allowCSSHacks) {
      // Prevents selection cursor issues in Safari, see https://github.com/phetsims/scenery/issues/476
      document.onselectstart = () => false;

      // prevent any default zooming behavior from a trackpad on IE11 and Edge, all should be handled by scenery - must
      // be on the body, doesn't prevent behavior if on the display div
      // @ts-expect-error legacy
      document.body.style.msContentZooming = 'none';

      // some css hacks (inspired from https://github.com/EightMedia/hammer.js/blob/master/hammer.js).
      // modified to only apply the proper prefixed version instead of spamming all of them, and doesn't use jQuery.
      Features.setStyle(this._domElement, Features.userDrag, 'none');
      Features.setStyle(this._domElement, Features.userSelect, 'none');
      Features.setStyle(this._domElement, Features.touchAction, 'none');
      Features.setStyle(this._domElement, Features.touchCallout, 'none');
      Features.setStyle(this._domElement, Features.tapHighlightColor, 'rgba(0,0,0,0)');
    }
  }
  canvasDataURL(callback) {
    this.canvasSnapshot(canvas => {
      callback(canvas.toDataURL());
    });
  }

  /**
   * Renders what it can into a Canvas (so far, Canvas and SVG layers work fine)
   */
  canvasSnapshot(callback) {
    const canvas = document.createElement('canvas');
    canvas.width = this.size.width;
    canvas.height = this.size.height;
    const context = canvas.getContext('2d');

    //OHTWO TODO: allow actual background color directly, not having to check the style here!!! https://github.com/phetsims/scenery/issues/1581
    this._rootNode.renderToCanvas(canvas, context, () => {
      callback(canvas, context.getImageData(0, 0, canvas.width, canvas.height));
    }, this.domElement.style.backgroundColor);
  }

  /**
   * TODO: reduce code duplication for handling overlays https://github.com/phetsims/scenery/issues/1581
   */
  setPointerDisplayVisible(visibility) {
    const hasOverlay = !!this._pointerOverlay;
    if (visibility !== hasOverlay) {
      if (!visibility) {
        this.removeOverlay(this._pointerOverlay);
        this._pointerOverlay.dispose();
        this._pointerOverlay = null;
      } else {
        this._pointerOverlay = new PointerOverlay(this, this._rootNode);
        this.addOverlay(this._pointerOverlay);
      }
    }
  }

  /**
   * TODO: reduce code duplication for handling overlays https://github.com/phetsims/scenery/issues/1581
   */
  setPointerAreaDisplayVisible(visibility) {
    const hasOverlay = !!this._pointerAreaOverlay;
    if (visibility !== hasOverlay) {
      if (!visibility) {
        this.removeOverlay(this._pointerAreaOverlay);
        this._pointerAreaOverlay.dispose();
        this._pointerAreaOverlay = null;
      } else {
        this._pointerAreaOverlay = new PointerAreaOverlay(this, this._rootNode);
        this.addOverlay(this._pointerAreaOverlay);
      }
    }
  }

  /**
   * TODO: reduce code duplication for handling overlays https://github.com/phetsims/scenery/issues/1581
   */
  setHitAreaDisplayVisible(visibility) {
    const hasOverlay = !!this._hitAreaOverlay;
    if (visibility !== hasOverlay) {
      if (!visibility) {
        this.removeOverlay(this._hitAreaOverlay);
        this._hitAreaOverlay.dispose();
        this._hitAreaOverlay = null;
      } else {
        this._hitAreaOverlay = new HitAreaOverlay(this, this._rootNode);
        this.addOverlay(this._hitAreaOverlay);
      }
    }
  }

  /**
   * TODO: reduce code duplication for handling overlays https://github.com/phetsims/scenery/issues/1581
   */
  setCanvasNodeBoundsVisible(visibility) {
    const hasOverlay = !!this._canvasAreaBoundsOverlay;
    if (visibility !== hasOverlay) {
      if (!visibility) {
        this.removeOverlay(this._canvasAreaBoundsOverlay);
        this._canvasAreaBoundsOverlay.dispose();
        this._canvasAreaBoundsOverlay = null;
      } else {
        this._canvasAreaBoundsOverlay = new CanvasNodeBoundsOverlay(this, this._rootNode);
        this.addOverlay(this._canvasAreaBoundsOverlay);
      }
    }
  }

  /**
   * TODO: reduce code duplication for handling overlays https://github.com/phetsims/scenery/issues/1581
   */
  setFittedBlockBoundsVisible(visibility) {
    const hasOverlay = !!this._fittedBlockBoundsOverlay;
    if (visibility !== hasOverlay) {
      if (!visibility) {
        this.removeOverlay(this._fittedBlockBoundsOverlay);
        this._fittedBlockBoundsOverlay.dispose();
        this._fittedBlockBoundsOverlay = null;
      } else {
        this._fittedBlockBoundsOverlay = new FittedBlockBoundsOverlay(this, this._rootNode);
        this.addOverlay(this._fittedBlockBoundsOverlay);
      }
    }
  }

  /**
   * Sets up the Display to resize to whatever the window inner dimensions will be.
   */
  resizeOnWindowResize() {
    const resizer = () => {
      this.setWidthHeight(window.innerWidth, window.innerHeight); // eslint-disable-line bad-sim-text
    };
    window.addEventListener('resize', resizer);
    resizer();
  }

  /**
   * Updates on every request animation frame. If stepCallback is passed in, it is called before updateDisplay() with
   * stepCallback( timeElapsedInSeconds )
   */
  updateOnRequestAnimationFrame(stepCallback) {
    // keep track of how much time elapsed over the last frame
    let lastTime = 0;
    let timeElapsedInSeconds = 0;
    const self = this; // eslint-disable-line @typescript-eslint/no-this-alias
    (function step() {
      // @ts-expect-error LEGACY --- it would know to update just the DOM element's location if it's the second argument
      self._requestAnimationFrameID = window.requestAnimationFrame(step, self._domElement);

      // calculate how much time has elapsed since we rendered the last frame
      const timeNow = Date.now();
      if (lastTime !== 0) {
        timeElapsedInSeconds = (timeNow - lastTime) / 1000.0;
      }
      lastTime = timeNow;

      // step the timer that drives any time dependent updates of the Display
      stepTimer.emit(timeElapsedInSeconds);
      stepCallback && stepCallback(timeElapsedInSeconds);
      self.updateDisplay();
    })();
  }
  cancelUpdateOnRequestAnimationFrame() {
    window.cancelAnimationFrame(this._requestAnimationFrameID);
  }

  /**
   * Initializes event handling, and connects the browser's input event handlers to notify this Display of events.
   *
   * NOTE: This can be reversed with detachEvents().
   */
  initializeEvents(options) {
    assert && assert(!this._input, 'Events cannot be attached twice to a display (for now)');

    // TODO: refactor here https://github.com/phetsims/scenery/issues/1581
    const input = new Input(this, !this._listenToOnlyElement, this._batchDOMEvents, this._assumeFullWindow, this._passiveEvents, options);
    this._input = input;
    input.connectListeners();
  }

  /**
   * Detach already-attached input event handling (from initializeEvents()).
   */
  detachEvents() {
    assert && assert(this._input, 'detachEvents() should be called only when events are attached');
    this._input.disconnectListeners();
    this._input = null;
  }

  /**
   * Adds an input listener.
   */
  addInputListener(listener) {
    assert && assert(!_.includes(this._inputListeners, listener), 'Input listener already registered on this Display');

    // don't allow listeners to be added multiple times
    if (!_.includes(this._inputListeners, listener)) {
      this._inputListeners.push(listener);
    }
    return this;
  }

  /**
   * Removes an input listener that was previously added with addInputListener.
   */
  removeInputListener(listener) {
    // ensure the listener is in our list
    assert && assert(_.includes(this._inputListeners, listener));
    this._inputListeners.splice(_.indexOf(this._inputListeners, listener), 1);
    return this;
  }

  /**
   * Returns whether this input listener is currently listening to this Display.
   *
   * More efficient than checking display.inputListeners, as that includes a defensive copy.
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
   * Returns a copy of all of our input listeners.
   */
  getInputListeners() {
    return this._inputListeners.slice(0); // defensive copy
  }
  get inputListeners() {
    return this.getInputListeners();
  }

  /**
   * Interrupts all input listeners that are attached to this Display.
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
   * Interrupts all pointers associated with this Display, see https://github.com/phetsims/scenery/issues/1582.
   */
  interruptPointers() {
    this._input && this._input.interruptPointers();
    return this;
  }

  /**
   * Interrupts all pointers associated with this Display that are NOT currently having events executed.
   * see https://github.com/phetsims/scenery/issues/1582.
   *
   * If excludePointer is provided and is non-null, it's used as the "current" pointer that should be excluded from
   * interruption.
   */
  interruptOtherPointers(excludePointer = null) {
    this._input && this._input.interruptPointers(excludePointer || this._input.currentSceneryEvent?.pointer || null);
    return this;
  }
  static INTERRUPT_OTHER_POINTERS = event => {
    phet?.joist?.display?.interruptOtherPointers(event?.pointer);
  };

  /**
   * (scenery-internal)
   */
  ensureNotPainting() {
    assert && assert(!this._isPainting, 'This should not be run in the call tree of updateDisplay(). If you see this, it is likely that either the ' + 'last updateDisplay() had a thrown error and it is trying to be run again (in which case, investigate that ' + 'error), OR code was run/triggered from inside an updateDisplay() that has the potential to cause an infinite ' + 'loop, e.g. CanvasNode paintCanvas() call manipulating another Node, or a bounds listener that Scenery missed.');
  }

  /**
   * Triggers a loss of context for all WebGL blocks.
   *
   * NOTE: Should generally only be used for debugging.
   */
  loseWebGLContexts() {
    (function loseBackbone(backbone) {
      if (backbone.blocks) {
        backbone.blocks.forEach(block => {
          const gl = block.gl;
          if (gl) {
            Utils.loseContext(gl);
          }

          //TODO: pattern for this iteration https://github.com/phetsims/scenery/issues/1581
          for (let drawable = block.firstDrawable; drawable !== null; drawable = drawable.nextDrawable) {
            loseBackbone(drawable);
            if (drawable === block.lastDrawable) {
              break;
            }
          }
        });
      }
    })(this._rootBackbone);
  }

  /**
   * Makes this Display available for inspection.
   */
  inspect() {
    localStorage.scenerySnapshot = JSON.stringify(scenerySerialize(this));
  }

  /**
   * Returns an HTML fragment that includes a large amount of debugging information, including a view of the
   * instance tree and drawable tree.
   */
  getDebugHTML() {
    const headerStyle = 'font-weight: bold; font-size: 120%; margin-top: 5px;';
    let depth = 0;
    let result = '';
    result += `<div style="${headerStyle}">Display (${this.id}) Summary</div>`;
    result += `${this.size.toString()} frame:${this._frameId} input:${!!this._input} cursor:${this._lastCursor}<br/>`;
    function nodeCount(node) {
      let count = 1; // for us
      for (let i = 0; i < node.children.length; i++) {
        count += nodeCount(node.children[i]);
      }
      return count;
    }
    result += `Nodes: ${nodeCount(this._rootNode)}<br/>`;
    function instanceCount(instance) {
      let count = 1; // for us
      for (let i = 0; i < instance.children.length; i++) {
        count += instanceCount(instance.children[i]);
      }
      return count;
    }
    result += this._baseInstance ? `Instances: ${instanceCount(this._baseInstance)}<br/>` : '';
    function drawableCount(drawable) {
      let count = 1; // for us
      if (drawable.blocks) {
        // we're a backbone
        _.each(drawable.blocks, childDrawable => {
          count += drawableCount(childDrawable);
        });
      } else if (drawable.firstDrawable && drawable.lastDrawable) {
        // we're a block
        for (let childDrawable = drawable.firstDrawable; childDrawable !== drawable.lastDrawable; childDrawable = childDrawable.nextDrawable) {
          count += drawableCount(childDrawable);
        }
        count += drawableCount(drawable.lastDrawable);
      }
      return count;
    }

    // @ts-expect-error TODO BackboneDrawable https://github.com/phetsims/scenery/issues/1581
    result += this._rootBackbone ? `Drawables: ${drawableCount(this._rootBackbone)}<br/>` : '';
    const drawableCountMap = {}; // {string} drawable constructor name => {number} count of seen
    // increment the count in our map
    function countRetainedDrawable(drawable) {
      const name = drawable.constructor.name;
      if (drawableCountMap[name]) {
        drawableCountMap[name]++;
      } else {
        drawableCountMap[name] = 1;
      }
    }
    function retainedDrawableCount(instance) {
      let count = 0;
      if (instance.selfDrawable) {
        countRetainedDrawable(instance.selfDrawable);
        count++;
      }
      if (instance.groupDrawable) {
        countRetainedDrawable(instance.groupDrawable);
        count++;
      }
      if (instance.sharedCacheDrawable) {
        // @ts-expect-error TODO Instance https://github.com/phetsims/scenery/issues/1581
        countRetainedDrawable(instance.sharedCacheDrawable);
        count++;
      }
      for (let i = 0; i < instance.children.length; i++) {
        count += retainedDrawableCount(instance.children[i]);
      }
      return count;
    }
    result += this._baseInstance ? `Retained Drawables: ${retainedDrawableCount(this._baseInstance)}<br/>` : '';
    for (const drawableName in drawableCountMap) {
      result += `&nbsp;&nbsp;&nbsp;&nbsp;${drawableName}: ${drawableCountMap[drawableName]}<br/>`;
    }
    function blockSummary(block) {
      // ensure we are a block
      if (!block.firstDrawable || !block.lastDrawable) {
        return '';
      }

      // @ts-expect-error TODO display stuff https://github.com/phetsims/scenery/issues/1581
      const hasBackbone = block.domDrawable && block.domDrawable.blocks;
      let div = `<div style="margin-left: ${depth * 20}px">`;
      div += block.toString();
      if (!hasBackbone) {
        div += ` (${block.drawableCount} drawables)`;
      }
      div += '</div>';
      depth += 1;
      if (hasBackbone) {
        // @ts-expect-error TODO display stuff https://github.com/phetsims/scenery/issues/1581
        for (let k = 0; k < block.domDrawable.blocks.length; k++) {
          // @ts-expect-error TODO display stuff https://github.com/phetsims/scenery/issues/1581
          div += blockSummary(block.domDrawable.blocks[k]);
        }
      }
      depth -= 1;
      return div;
    }
    if (this._rootBackbone) {
      result += `<div style="${headerStyle}">Block Summary</div>`;
      for (let i = 0; i < this._rootBackbone.blocks.length; i++) {
        result += blockSummary(this._rootBackbone.blocks[i]);
      }
    }
    function instanceSummary(instance) {
      let iSummary = '';
      function addQualifier(text) {
        iSummary += ` <span style="color: #008">${text}</span>`;
      }
      const node = instance.node;
      iSummary += instance.id;
      iSummary += ` ${node.constructor.name ? node.constructor.name : '?'}`;
      iSummary += ` <span style="font-weight: ${node.isPainted() ? 'bold' : 'normal'}">${node.id}</span>`;
      iSummary += node.getDebugHTMLExtras();
      if (!node.visible) {
        addQualifier('invis');
      }
      if (!instance.visible) {
        addQualifier('I-invis');
      }
      if (!instance.relativeVisible) {
        addQualifier('I-rel-invis');
      }
      if (!instance.selfVisible) {
        addQualifier('I-self-invis');
      }
      if (!instance.fittability.ancestorsFittable) {
        addQualifier('nofit-ancestor');
      }
      if (!instance.fittability.selfFittable) {
        addQualifier('nofit-self');
      }
      if (node.pickable === true) {
        addQualifier('pickable');
      }
      if (node.pickable === false) {
        addQualifier('unpickable');
      }
      if (instance.trail.isPickable()) {
        addQualifier('<span style="color: #808">hits</span>');
      }
      if (node.getEffectiveCursor()) {
        addQualifier(`effectiveCursor:${node.getEffectiveCursor()}`);
      }
      if (node.clipArea) {
        addQualifier('clipArea');
      }
      if (node.mouseArea) {
        addQualifier('mouseArea');
      }
      if (node.touchArea) {
        addQualifier('touchArea');
      }
      if (node.getInputListeners().length) {
        addQualifier('inputListeners');
      }
      if (node.getRenderer()) {
        addQualifier(`renderer:${node.getRenderer()}`);
      }
      if (node.isLayerSplit()) {
        addQualifier('layerSplit');
      }
      if (node.opacity < 1) {
        addQualifier(`opacity:${node.opacity}`);
      }
      if (node.disabledOpacity < 1) {
        addQualifier(`disabledOpacity:${node.disabledOpacity}`);
      }
      if (node._boundsEventCount > 0) {
        addQualifier(`<span style="color: #800">boundsListen:${node._boundsEventCount}:${node._boundsEventSelfCount}</span>`);
      }
      let transformType = '';
      switch (node.transform.getMatrix().type) {
        case Matrix3Type.IDENTITY:
          transformType = '';
          break;
        case Matrix3Type.TRANSLATION_2D:
          transformType = 'translated';
          break;
        case Matrix3Type.SCALING:
          transformType = 'scale';
          break;
        case Matrix3Type.AFFINE:
          transformType = 'affine';
          break;
        case Matrix3Type.OTHER:
          transformType = 'other';
          break;
        default:
          throw new Error(`invalid matrix type: ${node.transform.getMatrix().type}`);
      }
      if (transformType) {
        iSummary += ` <span style="color: #88f" title="${node.transform.getMatrix().toString().replace('\n', '&#10;')}">${transformType}</span>`;
      }
      iSummary += ` <span style="color: #888">[Trail ${instance.trail.indices.join('.')}]</span>`;
      // iSummary += ` <span style="color: #c88">${str( instance.state )}</span>`;
      iSummary += ` <span style="color: #8c8">${node._rendererSummary.bitmask.toString(16)}${node._rendererBitmask !== Renderer.bitmaskNodeDefault ? ` (${node._rendererBitmask.toString(16)})` : ''}</span>`;
      return iSummary;
    }
    function drawableSummary(drawable) {
      let drawableString = drawable.toString();
      if (drawable.visible) {
        drawableString = `<strong>${drawableString}</strong>`;
      }
      if (drawable.dirty) {
        drawableString += drawable.dirty ? ' <span style="color: #c00;">[x]</span>' : '';
      }
      if (!drawable.fittable) {
        drawableString += drawable.dirty ? ' <span style="color: #0c0;">[no-fit]</span>' : '';
      }
      return drawableString;
    }
    function printInstanceSubtree(instance) {
      let div = `<div style="margin-left: ${depth * 20}px">`;
      function addDrawable(name, drawable) {
        div += ` <span style="color: #888">${name}:${drawableSummary(drawable)}</span>`;
      }
      div += instanceSummary(instance);
      instance.selfDrawable && addDrawable('self', instance.selfDrawable);
      instance.groupDrawable && addDrawable('group', instance.groupDrawable);
      // @ts-expect-error TODO Instance https://github.com/phetsims/scenery/issues/1581
      instance.sharedCacheDrawable && addDrawable('sharedCache', instance.sharedCacheDrawable);
      div += '</div>';
      result += div;
      depth += 1;
      _.each(instance.children, childInstance => {
        printInstanceSubtree(childInstance);
      });
      depth -= 1;
    }
    if (this._baseInstance) {
      result += `<div style="${headerStyle}">Root Instance Tree</div>`;
      printInstanceSubtree(this._baseInstance);
    }
    _.each(this._sharedCanvasInstances, instance => {
      result += `<div style="${headerStyle}">Shared Canvas Instance Tree</div>`;
      printInstanceSubtree(instance);
    });
    function printDrawableSubtree(drawable) {
      let div = `<div style="margin-left: ${depth * 20}px">`;
      div += drawableSummary(drawable);
      if (drawable.instance) {
        div += ` <span style="color: #0a0;">(${drawable.instance.trail.toPathString()})</span>`;
        div += `&nbsp;&nbsp;&nbsp;${instanceSummary(drawable.instance)}`;
      } else if (drawable.backboneInstance) {
        div += ` <span style="color: #a00;">(${drawable.backboneInstance.trail.toPathString()})</span>`;
        div += `&nbsp;&nbsp;&nbsp;${instanceSummary(drawable.backboneInstance)}`;
      }
      div += '</div>';
      result += div;
      if (drawable.blocks) {
        // we're a backbone
        depth += 1;
        _.each(drawable.blocks, childDrawable => {
          printDrawableSubtree(childDrawable);
        });
        depth -= 1;
      } else if (drawable.firstDrawable && drawable.lastDrawable) {
        // we're a block
        depth += 1;
        for (let childDrawable = drawable.firstDrawable; childDrawable !== drawable.lastDrawable; childDrawable = childDrawable.nextDrawable) {
          printDrawableSubtree(childDrawable);
        }
        printDrawableSubtree(drawable.lastDrawable); // wasn't hit in our simplified (and safer) loop
        depth -= 1;
      }
    }
    if (this._rootBackbone) {
      result += '<div style="font-weight: bold;">Root Drawable Tree</div>';
      // @ts-expect-error TODO BackboneDrawable https://github.com/phetsims/scenery/issues/1581
      printDrawableSubtree(this._rootBackbone);
    }

    //OHTWO TODO: add shared cache drawable trees https://github.com/phetsims/scenery/issues/1581

    return result;
  }

  /**
   * Returns the getDebugHTML() information, but wrapped into a full HTML page included in a data URI.
   */
  getDebugURI() {
    return `data:text/html;charset=utf-8,${encodeURIComponent(`${'<!DOCTYPE html>' + '<html lang="en">' + '<head><title>Scenery Debug Snapshot</title></head>' + '<body style="font-size: 12px;">'}${this.getDebugHTML()}</body>` + '</html>')}`;
  }

  /**
   * Attempts to open a popup with the getDebugHTML() information.
   */
  popupDebug() {
    window.open(this.getDebugURI());
  }

  /**
   * Attempts to open an iframe popup with the getDebugHTML() information in the same window. This is similar to
   * popupDebug(), but should work in browsers that block popups, or prevent that type of data URI being opened.
   */
  iframeDebug() {
    const iframe = document.createElement('iframe');
    iframe.width = '' + window.innerWidth; // eslint-disable-line bad-sim-text
    iframe.height = '' + window.innerHeight; // eslint-disable-line bad-sim-text
    iframe.style.position = 'absolute';
    iframe.style.left = '0';
    iframe.style.top = '0';
    iframe.style.zIndex = '10000';
    document.body.appendChild(iframe);
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(this.getDebugHTML());
    iframe.contentWindow.document.close();
    iframe.contentWindow.document.body.style.background = 'white';
    const closeButton = document.createElement('button');
    closeButton.style.position = 'absolute';
    closeButton.style.top = '0';
    closeButton.style.right = '0';
    closeButton.style.zIndex = '10001';
    document.body.appendChild(closeButton);
    closeButton.textContent = 'close';

    // A normal 'click' event listener doesn't seem to be working. This is less-than-ideal.
    ['pointerdown', 'click', 'touchdown'].forEach(eventType => {
      closeButton.addEventListener(eventType, () => {
        document.body.removeChild(iframe);
        document.body.removeChild(closeButton);
      }, true);
    });
  }
  getPDOMDebugHTML() {
    let result = '';
    const headerStyle = 'font-weight: bold; font-size: 120%; margin-top: 5px;';
    const indent = '&nbsp;&nbsp;&nbsp;&nbsp;';
    result += `<div style="${headerStyle}">Accessible Instances</div><br>`;
    recurse(this._rootPDOMInstance, '');
    function recurse(instance, indentation) {
      result += `${indentation + escapeHTML(`${instance.isRootInstance ? '' : instance.node.tagName} ${instance.toString()}`)}<br>`;
      instance.children.forEach(child => {
        recurse(child, indentation + indent);
      });
    }
    result += `<br><div style="${headerStyle}">Parallel DOM</div><br>`;
    let parallelDOM = this._rootPDOMInstance.peer.primarySibling.outerHTML;
    parallelDOM = parallelDOM.replace(/></g, '>\n<');
    const lines = parallelDOM.split('\n');
    let indentation = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isEndTag = line.startsWith('</');
      if (isEndTag) {
        indentation = indentation.slice(indent.length);
      }
      result += `${indentation + escapeHTML(line)}<br>`;
      if (!isEndTag) {
        indentation += indent;
      }
    }
    return result;
  }

  /**
   * Will attempt to call callback( {string} dataURI ) with the rasterization of the entire Display's DOM structure,
   * used for internal testing. Will call-back null if there was an error
   *
   * Only tested on recent Chrome and Firefox, not recommended for general use. Guaranteed not to work for IE <= 10.
   *
   * See https://github.com/phetsims/scenery/issues/394 for some details.
   */
  foreignObjectRasterization(callback) {
    // Scan our drawable tree for Canvases. We'll rasterize them here (to data URLs) so we can replace them later in
    // the HTML tree (with images) before putting that in the foreignObject. That way, we can actually display
    // things rendered in Canvas in our rasterization.
    const canvasUrlMap = {};
    let unknownIds = 0;
    function addCanvas(canvas) {
      if (!canvas.id) {
        canvas.id = `unknown-canvas-${unknownIds++}`;
      }
      canvasUrlMap[canvas.id] = canvas.toDataURL();
    }
    function scanForCanvases(drawable) {
      if (drawable instanceof BackboneDrawable) {
        // we're a backbone
        _.each(drawable.blocks, childDrawable => {
          scanForCanvases(childDrawable);
        });
      } else if (drawable instanceof Block && drawable.firstDrawable && drawable.lastDrawable) {
        // we're a block
        for (let childDrawable = drawable.firstDrawable; childDrawable !== drawable.lastDrawable; childDrawable = childDrawable.nextDrawable) {
          scanForCanvases(childDrawable);
        }
        scanForCanvases(drawable.lastDrawable); // wasn't hit in our simplified (and safer) loop

        if ((drawable instanceof CanvasBlock || drawable instanceof WebGLBlock) && drawable.canvas && drawable.canvas instanceof window.HTMLCanvasElement) {
          addCanvas(drawable.canvas);
        }
      }
      if (DOMDrawable && drawable instanceof DOMDrawable) {
        if (drawable.domElement instanceof window.HTMLCanvasElement) {
          addCanvas(drawable.domElement);
        }
        Array.prototype.forEach.call(drawable.domElement.getElementsByTagName('canvas'), canvas => {
          addCanvas(canvas);
        });
      }
    }

    // @ts-expect-error TODO BackboneDrawable https://github.com/phetsims/scenery/issues/1581
    scanForCanvases(this._rootBackbone);

    // Create a new document, so that we can (1) serialize it to XHTML, and (2) manipulate it independently.
    // Inspired by http://cburgmer.github.io/rasterizeHTML.js/
    const doc = document.implementation.createHTMLDocument('');
    doc.documentElement.innerHTML = this.domElement.outerHTML;
    doc.documentElement.setAttribute('xmlns', doc.documentElement.namespaceURI);

    // Hide the PDOM
    doc.documentElement.appendChild(document.createElement('style')).innerHTML = `.${PDOMSiblingStyle.ROOT_CLASS_NAME} { display:none; } `;

    // Replace each <canvas> with an <img> that has src=canvas.toDataURL() and the same style
    let displayCanvases = doc.documentElement.getElementsByTagName('canvas');
    displayCanvases = Array.prototype.slice.call(displayCanvases); // don't use a live HTMLCollection copy!
    for (let i = 0; i < displayCanvases.length; i++) {
      const displayCanvas = displayCanvases[i];
      const cssText = displayCanvas.style.cssText;
      const displayImg = doc.createElement('img');
      const src = canvasUrlMap[displayCanvas.id];
      assert && assert(src, 'Must have missed a toDataURL() on a Canvas');
      displayImg.src = src;
      displayImg.setAttribute('style', cssText);
      displayCanvas.parentNode.replaceChild(displayImg, displayCanvas);
    }
    const displayWidth = this.width;
    const displayHeight = this.height;
    const completeFunction = () => {
      Display.elementToSVGDataURL(doc.documentElement, displayWidth, displayHeight, callback);
    };

    // Convert each <image>'s xlink:href so that it's a data URL with the relevant data, e.g.
    // <image ... xlink:href="http://localhost:8080/scenery-phet/images/batteryDCell.png?bust=1476308407988"/>
    // gets replaced with a data URL.
    // See https://github.com/phetsims/scenery/issues/573
    let replacedImages = 0; // Count how many images get replaced. We'll decrement with each finished image.
    let hasReplacedImages = false; // Whether any images are replaced
    const displaySVGImages = Array.prototype.slice.call(doc.documentElement.getElementsByTagName('image'));
    for (let j = 0; j < displaySVGImages.length; j++) {
      const displaySVGImage = displaySVGImages[j];
      const currentHref = displaySVGImage.getAttribute('xlink:href');
      if (currentHref.slice(0, 5) !== 'data:') {
        replacedImages++;
        hasReplacedImages = true;
        (() => {
          // eslint-disable-line @typescript-eslint/no-loop-func
          // Closure variables need to be stored for each individual SVG image.
          const refImage = new window.Image();
          const svgImage = displaySVGImage;
          refImage.onload = () => {
            // Get a Canvas
            const refCanvas = document.createElement('canvas');
            refCanvas.width = refImage.width;
            refCanvas.height = refImage.height;
            const refContext = refCanvas.getContext('2d');

            // Draw the (now loaded) image into the Canvas
            refContext.drawImage(refImage, 0, 0);

            // Replace the <image>'s href with the Canvas' data.
            svgImage.setAttribute('xlink:href', refCanvas.toDataURL());

            // If it's the last replaced image, go to the next step
            if (--replacedImages === 0) {
              completeFunction();
            }
            assert && assert(replacedImages >= 0);
          };
          refImage.onerror = () => {
            // NOTE: not much we can do, leave this element alone.

            // If it's the last replaced image, go to the next step
            if (--replacedImages === 0) {
              completeFunction();
            }
            assert && assert(replacedImages >= 0);
          };

          // Kick off loading of the image.
          refImage.src = currentHref;
        })();
      }
    }

    // If no images are replaced, we need to call our callback through this route.
    if (!hasReplacedImages) {
      completeFunction();
    }
  }
  popupRasterization() {
    this.foreignObjectRasterization(url => {
      if (url) {
        window.open(url);
      }
    });
  }

  /**
   * Will return null if the string of indices isn't part of the PDOMInstance tree
   */
  getTrailFromPDOMIndicesString(indicesString) {
    // No PDOMInstance tree if the display isn't accessible
    if (!this._rootPDOMInstance) {
      return null;
    }
    let instance = this._rootPDOMInstance;
    const indexStrings = indicesString.split(PDOMUtils.PDOM_UNIQUE_ID_SEPARATOR);
    for (let i = 0; i < indexStrings.length; i++) {
      const digit = Number(indexStrings[i]);
      instance = instance.children[digit];
      if (!instance) {
        return null;
      }
    }
    return instance && instance.trail ? instance.trail : null;
  }

  /**
   * Forces SVG elements to have their visual contents refreshed, by changing state in a non-visually-apparent way.
   * It should trick browsers into re-rendering the SVG elements.
   *
   * See https://github.com/phetsims/scenery/issues/1507
   */
  refreshSVG() {
    this._refreshSVGEmitter.emit();
  }

  /**
   * Similar to refreshSVG (see docs above), but will do so on the next frame.
   */
  refreshSVGOnNextFrame() {
    this._refreshSVGPending = true;
  }

  /**
   * Releases references.
   *
   * TODO: this dispose function is not complete. https://github.com/phetsims/scenery/issues/1581
   */
  dispose() {
    if (assert) {
      assert(!this._isDisposing);
      assert(!this._isDisposed);
      this._isDisposing = true;
    }
    if (this._input) {
      this.detachEvents();
    }
    this._rootNode.removeRootedDisplay(this);
    if (this._accessible) {
      assert && assert(this._boundHandleFullScreenNavigation, '_boundHandleFullScreenNavigation was not added to the keyStateTracker');
      globalKeyStateTracker.keydownEmitter.removeListener(this._boundHandleFullScreenNavigation);
      this._rootPDOMInstance.dispose();
    }
    this._focusOverlay && this._focusOverlay.dispose();
    this.sizeProperty.dispose();

    // Will immediately dispose recursively, all Instances AND their attached drawables, which will include the
    // rootBackbone.
    this._baseInstance && this._baseInstance.dispose();
    this.descriptionUtteranceQueue.dispose();
    this.focusManager && this.focusManager.dispose();
    if (assert) {
      this._isDisposing = false;
      this._isDisposed = true;
    }
  }

  /**
   * Takes a given DOM element, and asynchronously renders it to a string that is a data URL representing an SVG
   * file.
   *
   * @param domElement
   * @param width - The width of the output SVG
   * @param height - The height of the output SVG
   * @param callback - Called as callback( url: {string} ), where the URL will be the encoded SVG file.
   */
  static elementToSVGDataURL(domElement, width, height, callback) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    // Serialize it to XHTML that can be used in foreignObject (HTML can't be)
    const xhtml = new window.XMLSerializer().serializeToString(domElement);

    // Create an SVG container with a foreignObject.
    const data = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` + '<foreignObject width="100%" height="100%">' + `<div xmlns="http://www.w3.org/1999/xhtml">${xhtml}</div>` + '</foreignObject>' + '</svg>';

    // Load an <img> with the SVG data URL, and when loaded draw it into our Canvas
    const img = new window.Image();
    img.onload = () => {
      context.drawImage(img, 0, 0);
      callback(canvas.toDataURL()); // Endpoint here
    };
    img.onerror = () => {
      callback(null);
    };

    // We can't btoa() arbitrary unicode, so we need another solution,
    // see https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_.22Unicode_Problem.22
    // @ts-expect-error - Exterior lib
    const uint8array = new window.TextEncoderLite('utf-8').encode(data);
    // @ts-expect-error - Exterior lib
    const base64 = window.fromByteArray(uint8array);

    // turn it to base64 and wrap it in the data URL format
    img.src = `data:image/svg+xml;base64,${base64}`;
  }

  /**
   * Returns true when NO nodes in the subtree are disposed.
   */
  static assertSubtreeDisposed(node) {
    assert && assert(!node.isDisposed, 'Disposed nodes should not be included in a scene graph to display.');
    if (assert) {
      for (let i = 0; i < node.children.length; i++) {
        Display.assertSubtreeDisposed(node.children[i]);
      }
    }
  }

  /**
   * Adds an input listener to be fired for ANY Display
   */
  static addInputListener(listener) {
    assert && assert(!_.includes(Display.inputListeners, listener), 'Input listener already registered');

    // don't allow listeners to be added multiple times
    if (!_.includes(Display.inputListeners, listener)) {
      Display.inputListeners.push(listener);
    }
  }

  /**
   * Removes an input listener that was previously added with Display.addInputListener.
   */
  static removeInputListener(listener) {
    // ensure the listener is in our list
    assert && assert(_.includes(Display.inputListeners, listener));
    Display.inputListeners.splice(_.indexOf(Display.inputListeners, listener), 1);
  }

  /**
   * Interrupts all input listeners that are attached to all Displays.
   */
  static interruptInput() {
    const listenersCopy = Display.inputListeners.slice(0);
    for (let i = 0; i < listenersCopy.length; i++) {
      const listener = listenersCopy[i];
      listener.interrupt && listener.interrupt();
    }
  }

  // Fires when we detect an input event that would be considered a "user gesture" by Chrome, so
  // that we can trigger browser actions that are only allowed as a result.
  // See https://github.com/phetsims/scenery/issues/802 and https://github.com/phetsims/vibe/issues/32 for more
  // information.

  // Listeners that will be called for every event on ANY Display, see
  // https://github.com/phetsims/scenery/issues/1149. Do not directly modify this!
}
scenery.register('Display', Display);
Display.userGestureEmitter = new Emitter();
Display.inputListeners = [];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFbWl0dGVyIiwic3RlcFRpbWVyIiwiVGlueVByb3BlcnR5IiwiRGltZW5zaW9uMiIsIk1hdHJpeDNUeXBlIiwiZXNjYXBlSFRNTCIsIm9wdGlvbml6ZSIsInBsYXRmb3JtIiwiQXJpYUxpdmVBbm5vdW5jZXIiLCJVdHRlcmFuY2VRdWV1ZSIsIkJhY2tib25lRHJhd2FibGUiLCJCbG9jayIsIkNhbnZhc0Jsb2NrIiwiQ2FudmFzTm9kZUJvdW5kc092ZXJsYXkiLCJDb2xvciIsIkRPTUJsb2NrIiwiRE9NRHJhd2FibGUiLCJGZWF0dXJlcyIsIkZpdHRlZEJsb2NrQm91bmRzT3ZlcmxheSIsIkZvY3VzTWFuYWdlciIsIkZ1bGxTY3JlZW4iLCJnbG9iYWxLZXlTdGF0ZVRyYWNrZXIiLCJIaWdobGlnaHRPdmVybGF5IiwiSGl0QXJlYU92ZXJsYXkiLCJJbnB1dCIsIkluc3RhbmNlIiwiS2V5Ym9hcmRVdGlscyIsIk5vZGUiLCJQRE9NSW5zdGFuY2UiLCJQRE9NU2libGluZ1N0eWxlIiwiUERPTVRyZWUiLCJQRE9NVXRpbHMiLCJQb2ludGVyQXJlYU92ZXJsYXkiLCJQb2ludGVyT3ZlcmxheSIsIlJlbmRlcmVyIiwic2NlbmVyeSIsInNjZW5lcnlTZXJpYWxpemUiLCJUcmFpbCIsIlV0aWxzIiwiV2ViR0xCbG9jayIsIlNhZmFyaVdvcmthcm91bmRPdmVybGF5IiwiQ1VTVE9NX0NVUlNPUlMiLCJnbG9iYWxJZENvdW50ZXIiLCJEaXNwbGF5IiwiX3JlZnJlc2hTVkdFbWl0dGVyIiwiX3JlZnJlc2hTVkdQZW5kaW5nIiwiY29uc3RydWN0b3IiLCJyb290Tm9kZSIsInByb3ZpZGVkT3B0aW9ucyIsImFzc2VydCIsIm9wdGlvbnMiLCJ3aWR0aCIsImNvbnRhaW5lciIsImNsaWVudFdpZHRoIiwiaGVpZ2h0IiwiY2xpZW50SGVpZ2h0IiwiYWxsb3dDU1NIYWNrcyIsImFsbG93U2FmYXJpUmVkcmF3V29ya2Fyb3VuZCIsImFsbG93U2NlbmVPdmVyZmxvdyIsImFsbG93TGF5ZXJGaXR0aW5nIiwiZm9yY2VTVkdSZWZyZXNoIiwiZGVmYXVsdEN1cnNvciIsImJhY2tncm91bmRDb2xvciIsInByZXNlcnZlRHJhd2luZ0J1ZmZlciIsImFsbG93V2ViR0wiLCJhY2Nlc3NpYmlsaXR5Iiwic3VwcG9ydHNJbnRlcmFjdGl2ZUhpZ2hsaWdodHMiLCJpbnRlcmFjdGl2ZSIsImxpc3RlblRvT25seUVsZW1lbnQiLCJiYXRjaERPTUV2ZW50cyIsImFzc3VtZUZ1bGxXaW5kb3ciLCJhZ2dyZXNzaXZlQ29udGV4dFJlY3JlYXRpb24iLCJwYXNzaXZlRXZlbnRzIiwic2FmYXJpIiwiYWxsb3dCYWNraW5nU2NhbGVBbnRpYWxpYXNpbmciLCJpZCIsIl9hY2Nlc3NpYmxlIiwiX3ByZXNlcnZlRHJhd2luZ0J1ZmZlciIsIl9hbGxvd1dlYkdMIiwiX2FsbG93Q1NTSGFja3MiLCJfYWxsb3dTY2VuZU92ZXJmbG93IiwiX2RlZmF1bHRDdXJzb3IiLCJzaXplUHJvcGVydHkiLCJfY3VycmVudFNpemUiLCJfcm9vdE5vZGUiLCJhZGRSb290ZWREaXNwbGF5IiwiX3Jvb3RCYWNrYm9uZSIsIl9kb21FbGVtZW50IiwicmVwdXJwb3NlQmFja2JvbmVDb250YWluZXIiLCJjcmVhdGVEaXZCYWNrYm9uZSIsIl9zaGFyZWRDYW52YXNJbnN0YW5jZXMiLCJfYmFzZUluc3RhbmNlIiwiX2ZyYW1lSWQiLCJfZGlydHlUcmFuc2Zvcm1Sb290cyIsIl9kaXJ0eVRyYW5zZm9ybVJvb3RzV2l0aG91dFBhc3MiLCJfaW5zdGFuY2VSb290c1RvRGlzcG9zZSIsIl9yZWR1Y2VSZWZlcmVuY2VzTmVlZGVkIiwiX2RyYXdhYmxlc1RvRGlzcG9zZSIsIl9kcmF3YWJsZXNUb0NoYW5nZUJsb2NrIiwiX2RyYXdhYmxlc1RvVXBkYXRlTGlua3MiLCJfY2hhbmdlSW50ZXJ2YWxzVG9EaXNwb3NlIiwiX2xhc3RDdXJzb3IiLCJfY3VycmVudEJhY2tncm91bmRDU1MiLCJfYmFja2dyb3VuZENvbG9yIiwiX3JlcXVlc3RBbmltYXRpb25GcmFtZUlEIiwiX2lucHV0IiwiX2lucHV0TGlzdGVuZXJzIiwiX2ludGVyYWN0aXZlIiwiX2xpc3RlblRvT25seUVsZW1lbnQiLCJfYmF0Y2hET01FdmVudHMiLCJfYXNzdW1lRnVsbFdpbmRvdyIsIl9wYXNzaXZlRXZlbnRzIiwiX2FnZ3Jlc3NpdmVDb250ZXh0UmVjcmVhdGlvbiIsIl9hbGxvd0JhY2tpbmdTY2FsZUFudGlhbGlhc2luZyIsIl9hbGxvd0xheWVyRml0dGluZyIsIl9mb3JjZVNWR1JlZnJlc2giLCJfb3ZlcmxheXMiLCJfcG9pbnRlck92ZXJsYXkiLCJfcG9pbnRlckFyZWFPdmVybGF5IiwiX2hpdEFyZWFPdmVybGF5IiwiX2NhbnZhc0FyZWFCb3VuZHNPdmVybGF5IiwiX2ZpdHRlZEJsb2NrQm91bmRzT3ZlcmxheSIsIl9pc1BhaW50aW5nIiwiX2lzRGlzcG9zaW5nIiwiX2lzRGlzcG9zZWQiLCJhcHBseUNTU0hhY2tzIiwic2V0QmFja2dyb3VuZENvbG9yIiwiYXJpYUxpdmVBbm5vdW5jZXIiLCJkZXNjcmlwdGlvblV0dGVyYW5jZVF1ZXVlIiwiaW5pdGlhbGl6ZSIsImZlYXR1cmVTcGVjaWZpY0Fubm91bmNpbmdDb250cm9sUHJvcGVydHlOYW1lIiwiYWRkT3ZlcmxheSIsImZvY3VzTWFuYWdlciIsIl9mb2N1c1Jvb3ROb2RlIiwiX2ZvY3VzT3ZlcmxheSIsInBkb21Gb2N1c0hpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHkiLCJpbnRlcmFjdGl2ZUhpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHkiLCJyZWFkaW5nQmxvY2tIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5IiwiX3Jvb3RQRE9NSW5zdGFuY2UiLCJwb29sIiwiY3JlYXRlIiwic2NlbmVyeUxvZyIsInRvU3RyaW5nIiwicmVidWlsZEluc3RhbmNlVHJlZSIsInBlZXIiLCJhcHBlbmRDaGlsZCIsInByaW1hcnlTaWJsaW5nIiwiYXJpYUxpdmVDb250YWluZXIiLCJzdHlsZSIsInVzZXJTZWxlY3QiLCJfYm91bmRIYW5kbGVGdWxsU2NyZWVuTmF2aWdhdGlvbiIsImhhbmRsZUZ1bGxTY3JlZW5OYXZpZ2F0aW9uIiwiYmluZCIsImtleWRvd25FbWl0dGVyIiwiYWRkTGlzdGVuZXIiLCJnZXRET01FbGVtZW50IiwiZG9tRWxlbWVudCIsInVwZGF0ZURpc3BsYXkiLCJpc0xvZ2dpbmdQZXJmb3JtYW5jZSIsInBlcmZTeW5jVHJlZUNvdW50IiwicGVyZlN0aXRjaENvdW50IiwicGVyZkludGVydmFsQ291bnQiLCJwZXJmRHJhd2FibGVCbG9ja0NoYW5nZUNvdW50IiwicGVyZkRyYXdhYmxlT2xkSW50ZXJ2YWxDb3VudCIsInBlcmZEcmF3YWJsZU5ld0ludGVydmFsQ291bnQiLCJhc3NlcnRTdWJ0cmVlRGlzcG9zZWQiLCJwdXNoIiwiZmlyc3RSdW4iLCJ2YWxpZGF0ZVBvaW50ZXJzIiwidXBkYXRlU3VidHJlZVBvc2l0aW9uaW5nIiwidmFsaWRhdGVXYXRjaGVkQm91bmRzIiwiYXNzZXJ0U2xvdyIsImF1ZGl0Um9vdCIsIl9waWNrZXIiLCJhdWRpdCIsImNyZWF0ZUZyb21Qb29sIiwiYmFzZVN5bmNUcmVlIiwibWFya1RyYW5zZm9ybVJvb3REaXJ0eSIsImlzVHJhbnNmb3JtZWQiLCJsZW5ndGgiLCJwb3AiLCJ1cGRhdGVMaW5rcyIsImRpc3Bvc2UiLCJncm91cERyYXdhYmxlIiwiY2hhbmdlZCIsInVwZGF0ZUJsb2NrIiwidXBkYXRlRGlydHlUcmFuc2Zvcm1Sb290cyIsInVwZGF0ZVZpc2liaWxpdHkiLCJhdWRpdFZpc2liaWxpdHkiLCJhdWRpdEluc3RhbmNlU3VidHJlZUZvckRpc3BsYXkiLCJ1cGRhdGUiLCJ1cGRhdGVDdXJzb3IiLCJ1cGRhdGVCYWNrZ3JvdW5kQ29sb3IiLCJ1cGRhdGVTaXplIiwiekluZGV4IiwibGFzdFpJbmRleCIsImkiLCJvdmVybGF5IiwicmVkdWNlUmVmZXJlbmNlcyIsInN5bmNUcmVlTWVzc2FnZSIsIlBlcmZDcml0aWNhbCIsIlBlcmZNYWpvciIsIlBlcmZNaW5vciIsIlBlcmZWZXJib3NlIiwiZHJhd2FibGVCbG9ja0NvdW50TWVzc2FnZSIsImF1ZGl0UERPTURpc3BsYXlzIiwicmVmcmVzaFNWRyIsImdldFBoZXRpb0VsZW1lbnRBdCIsInBvaW50Iiwibm9kZSIsImdldFBoZXRpb01vdXNlSGl0IiwiaXNQaGV0aW9JbnN0cnVtZW50ZWQiLCJzaXplRGlydHkiLCJzaXplIiwiY2xpcCIsImlzV2ViR0xBbGxvd2VkIiwid2ViZ2xBbGxvd2VkIiwiZ2V0Um9vdE5vZGUiLCJnZXRSb290QmFja2JvbmUiLCJyb290QmFja2JvbmUiLCJnZXRTaXplIiwidmFsdWUiLCJnZXRCb3VuZHMiLCJ0b0JvdW5kcyIsImJvdW5kcyIsInNldFNpemUiLCJzZXRXaWR0aEhlaWdodCIsImdldFdpZHRoIiwic2V0V2lkdGgiLCJnZXRIZWlnaHQiLCJzZXRIZWlnaHQiLCJjb2xvciIsImdldEJhY2tncm91bmRDb2xvciIsInJlY3Vyc2l2ZURpc2FibGUiLCJpbnRlcnJ1cHRQb2ludGVycyIsImNsZWFyQmF0Y2hlZEV2ZW50cyIsInJlbW92ZVRlbXBvcmFyeVBvaW50ZXJzIiwiaW50ZXJydXB0U3VidHJlZUlucHV0IiwiaW50ZXJydXB0SW5wdXQiLCJzZXRBdHRyaWJ1dGUiLCJyZW1vdmVPdmVybGF5IiwicmVtb3ZlQ2hpbGQiLCJzcGxpY2UiLCJfIiwiaW5kZXhPZiIsImdldFBET01Sb290RWxlbWVudCIsInBkb21Sb290RWxlbWVudCIsImlzQWNjZXNzaWJsZSIsImlzRWxlbWVudFVuZGVyUERPTSIsImVsZW1lbnQiLCJhbGxvd1Jvb3QiLCJpc0VsZW1lbnRDb250YWluZWQiLCJjb250YWlucyIsImlzTm90Um9vdEVsZW1lbnQiLCJkb21FdmVudCIsImlzRnVsbFNjcmVlbiIsImlzS2V5RXZlbnQiLCJLRVlfVEFCIiwicm9vdEVsZW1lbnQiLCJuZXh0RWxlbWVudCIsInNoaWZ0S2V5IiwiZ2V0UHJldmlvdXNGb2N1c2FibGUiLCJ1bmRlZmluZWQiLCJnZXROZXh0Rm9jdXNhYmxlIiwidGFyZ2V0IiwicHJldmVudERlZmF1bHQiLCJnZXRVc2VkUmVuZGVyZXJzQml0bWFzayIsInJlbmRlcmVyc1VuZGVyQmFja2JvbmUiLCJiYWNrYm9uZSIsImJpdG1hc2siLCJlYWNoIiwiYmxvY2tzIiwiYmxvY2siLCJkb21EcmF3YWJsZSIsInJlbmRlcmVyIiwiYml0bWFza1JlbmRlcmVyQXJlYSIsImluc3RhbmNlIiwicGFzc1RyYW5zZm9ybSIsInRyYW5zZm9ybVN5c3RlbSIsInJlbGF0aXZlVHJhbnNmb3JtIiwidXBkYXRlVHJhbnNmb3JtTGlzdGVuZXJzQW5kQ29tcHV0ZSIsIm1hcmtEcmF3YWJsZUNoYW5nZWRCbG9jayIsImRyYXdhYmxlIiwibWFya0ZvclJlZHVjZWRSZWZlcmVuY2VzIiwiaXRlbSIsIm1hcmtJbnN0YW5jZVJvb3RGb3JEaXNwb3NhbCIsIm1hcmtEcmF3YWJsZUZvckRpc3Bvc2FsIiwibWFya0RyYXdhYmxlRm9yTGlua3NVcGRhdGUiLCJtYXJrQ2hhbmdlSW50ZXJ2YWxUb0Rpc3Bvc2UiLCJjaGFuZ2VJbnRlcnZhbCIsIm5ld0JhY2tncm91bmRDU1MiLCJ0b0NTUyIsIm1vdXNlIiwiY3Vyc29yIiwiQ3Vyc29yIiwic2V0U2NlbmVDdXJzb3IiLCJtb3VzZVRyYWlsIiwidHJhaWxVbmRlclBvaW50ZXIiLCJnZXRDdXJzb3JDaGVja0luZGV4Iiwibm9kZXMiLCJnZXRFZmZlY3RpdmVDdXJzb3IiLCJuYW1lIiwic2V0RWxlbWVudEN1cnNvciIsImRvY3VtZW50IiwiYm9keSIsImN1c3RvbUN1cnNvcnMiLCJvdmVyZmxvdyIsIm1zVG91Y2hBY3Rpb24iLCJzZXRTdHlsZSIsImZvbnRTbW9vdGhpbmciLCJvbnNlbGVjdHN0YXJ0IiwibXNDb250ZW50Wm9vbWluZyIsInVzZXJEcmFnIiwidG91Y2hBY3Rpb24iLCJ0b3VjaENhbGxvdXQiLCJ0YXBIaWdobGlnaHRDb2xvciIsImNhbnZhc0RhdGFVUkwiLCJjYWxsYmFjayIsImNhbnZhc1NuYXBzaG90IiwiY2FudmFzIiwidG9EYXRhVVJMIiwiY3JlYXRlRWxlbWVudCIsImNvbnRleHQiLCJnZXRDb250ZXh0IiwicmVuZGVyVG9DYW52YXMiLCJnZXRJbWFnZURhdGEiLCJzZXRQb2ludGVyRGlzcGxheVZpc2libGUiLCJ2aXNpYmlsaXR5IiwiaGFzT3ZlcmxheSIsInNldFBvaW50ZXJBcmVhRGlzcGxheVZpc2libGUiLCJzZXRIaXRBcmVhRGlzcGxheVZpc2libGUiLCJzZXRDYW52YXNOb2RlQm91bmRzVmlzaWJsZSIsInNldEZpdHRlZEJsb2NrQm91bmRzVmlzaWJsZSIsInJlc2l6ZU9uV2luZG93UmVzaXplIiwicmVzaXplciIsIndpbmRvdyIsImlubmVyV2lkdGgiLCJpbm5lckhlaWdodCIsImFkZEV2ZW50TGlzdGVuZXIiLCJ1cGRhdGVPblJlcXVlc3RBbmltYXRpb25GcmFtZSIsInN0ZXBDYWxsYmFjayIsImxhc3RUaW1lIiwidGltZUVsYXBzZWRJblNlY29uZHMiLCJzZWxmIiwic3RlcCIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsInRpbWVOb3ciLCJEYXRlIiwibm93IiwiZW1pdCIsImNhbmNlbFVwZGF0ZU9uUmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJpbml0aWFsaXplRXZlbnRzIiwiaW5wdXQiLCJjb25uZWN0TGlzdGVuZXJzIiwiZGV0YWNoRXZlbnRzIiwiZGlzY29ubmVjdExpc3RlbmVycyIsImFkZElucHV0TGlzdGVuZXIiLCJsaXN0ZW5lciIsImluY2x1ZGVzIiwicmVtb3ZlSW5wdXRMaXN0ZW5lciIsImhhc0lucHV0TGlzdGVuZXIiLCJnZXRJbnB1dExpc3RlbmVycyIsInNsaWNlIiwiaW5wdXRMaXN0ZW5lcnMiLCJsaXN0ZW5lcnNDb3B5IiwiaW50ZXJydXB0IiwiaW50ZXJydXB0T3RoZXJQb2ludGVycyIsImV4Y2x1ZGVQb2ludGVyIiwiY3VycmVudFNjZW5lcnlFdmVudCIsInBvaW50ZXIiLCJJTlRFUlJVUFRfT1RIRVJfUE9JTlRFUlMiLCJldmVudCIsInBoZXQiLCJqb2lzdCIsImRpc3BsYXkiLCJlbnN1cmVOb3RQYWludGluZyIsImxvc2VXZWJHTENvbnRleHRzIiwibG9zZUJhY2tib25lIiwiZm9yRWFjaCIsImdsIiwibG9zZUNvbnRleHQiLCJmaXJzdERyYXdhYmxlIiwibmV4dERyYXdhYmxlIiwibGFzdERyYXdhYmxlIiwiaW5zcGVjdCIsImxvY2FsU3RvcmFnZSIsInNjZW5lcnlTbmFwc2hvdCIsIkpTT04iLCJzdHJpbmdpZnkiLCJnZXREZWJ1Z0hUTUwiLCJoZWFkZXJTdHlsZSIsImRlcHRoIiwicmVzdWx0Iiwibm9kZUNvdW50IiwiY291bnQiLCJjaGlsZHJlbiIsImluc3RhbmNlQ291bnQiLCJkcmF3YWJsZUNvdW50IiwiY2hpbGREcmF3YWJsZSIsImRyYXdhYmxlQ291bnRNYXAiLCJjb3VudFJldGFpbmVkRHJhd2FibGUiLCJyZXRhaW5lZERyYXdhYmxlQ291bnQiLCJzZWxmRHJhd2FibGUiLCJzaGFyZWRDYWNoZURyYXdhYmxlIiwiZHJhd2FibGVOYW1lIiwiYmxvY2tTdW1tYXJ5IiwiaGFzQmFja2JvbmUiLCJkaXYiLCJrIiwiaW5zdGFuY2VTdW1tYXJ5IiwiaVN1bW1hcnkiLCJhZGRRdWFsaWZpZXIiLCJ0ZXh0IiwiaXNQYWludGVkIiwiZ2V0RGVidWdIVE1MRXh0cmFzIiwidmlzaWJsZSIsInJlbGF0aXZlVmlzaWJsZSIsInNlbGZWaXNpYmxlIiwiZml0dGFiaWxpdHkiLCJhbmNlc3RvcnNGaXR0YWJsZSIsInNlbGZGaXR0YWJsZSIsInBpY2thYmxlIiwidHJhaWwiLCJpc1BpY2thYmxlIiwiY2xpcEFyZWEiLCJtb3VzZUFyZWEiLCJ0b3VjaEFyZWEiLCJnZXRSZW5kZXJlciIsImlzTGF5ZXJTcGxpdCIsIm9wYWNpdHkiLCJkaXNhYmxlZE9wYWNpdHkiLCJfYm91bmRzRXZlbnRDb3VudCIsIl9ib3VuZHNFdmVudFNlbGZDb3VudCIsInRyYW5zZm9ybVR5cGUiLCJ0cmFuc2Zvcm0iLCJnZXRNYXRyaXgiLCJ0eXBlIiwiSURFTlRJVFkiLCJUUkFOU0xBVElPTl8yRCIsIlNDQUxJTkciLCJBRkZJTkUiLCJPVEhFUiIsIkVycm9yIiwicmVwbGFjZSIsImluZGljZXMiLCJqb2luIiwiX3JlbmRlcmVyU3VtbWFyeSIsIl9yZW5kZXJlckJpdG1hc2siLCJiaXRtYXNrTm9kZURlZmF1bHQiLCJkcmF3YWJsZVN1bW1hcnkiLCJkcmF3YWJsZVN0cmluZyIsImRpcnR5IiwiZml0dGFibGUiLCJwcmludEluc3RhbmNlU3VidHJlZSIsImFkZERyYXdhYmxlIiwiY2hpbGRJbnN0YW5jZSIsInByaW50RHJhd2FibGVTdWJ0cmVlIiwidG9QYXRoU3RyaW5nIiwiYmFja2JvbmVJbnN0YW5jZSIsImdldERlYnVnVVJJIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwicG9wdXBEZWJ1ZyIsIm9wZW4iLCJpZnJhbWVEZWJ1ZyIsImlmcmFtZSIsInBvc2l0aW9uIiwibGVmdCIsInRvcCIsImNvbnRlbnRXaW5kb3ciLCJ3cml0ZSIsImNsb3NlIiwiYmFja2dyb3VuZCIsImNsb3NlQnV0dG9uIiwicmlnaHQiLCJ0ZXh0Q29udGVudCIsImV2ZW50VHlwZSIsImdldFBET01EZWJ1Z0hUTUwiLCJpbmRlbnQiLCJyZWN1cnNlIiwiaW5kZW50YXRpb24iLCJpc1Jvb3RJbnN0YW5jZSIsInRhZ05hbWUiLCJjaGlsZCIsInBhcmFsbGVsRE9NIiwib3V0ZXJIVE1MIiwibGluZXMiLCJzcGxpdCIsImxpbmUiLCJpc0VuZFRhZyIsInN0YXJ0c1dpdGgiLCJmb3JlaWduT2JqZWN0UmFzdGVyaXphdGlvbiIsImNhbnZhc1VybE1hcCIsInVua25vd25JZHMiLCJhZGRDYW52YXMiLCJzY2FuRm9yQ2FudmFzZXMiLCJIVE1MQ2FudmFzRWxlbWVudCIsIkFycmF5IiwicHJvdG90eXBlIiwiY2FsbCIsImdldEVsZW1lbnRzQnlUYWdOYW1lIiwiZG9jIiwiaW1wbGVtZW50YXRpb24iLCJjcmVhdGVIVE1MRG9jdW1lbnQiLCJkb2N1bWVudEVsZW1lbnQiLCJpbm5lckhUTUwiLCJuYW1lc3BhY2VVUkkiLCJST09UX0NMQVNTX05BTUUiLCJkaXNwbGF5Q2FudmFzZXMiLCJkaXNwbGF5Q2FudmFzIiwiY3NzVGV4dCIsImRpc3BsYXlJbWciLCJzcmMiLCJwYXJlbnROb2RlIiwicmVwbGFjZUNoaWxkIiwiZGlzcGxheVdpZHRoIiwiZGlzcGxheUhlaWdodCIsImNvbXBsZXRlRnVuY3Rpb24iLCJlbGVtZW50VG9TVkdEYXRhVVJMIiwicmVwbGFjZWRJbWFnZXMiLCJoYXNSZXBsYWNlZEltYWdlcyIsImRpc3BsYXlTVkdJbWFnZXMiLCJqIiwiZGlzcGxheVNWR0ltYWdlIiwiY3VycmVudEhyZWYiLCJnZXRBdHRyaWJ1dGUiLCJyZWZJbWFnZSIsIkltYWdlIiwic3ZnSW1hZ2UiLCJvbmxvYWQiLCJyZWZDYW52YXMiLCJyZWZDb250ZXh0IiwiZHJhd0ltYWdlIiwib25lcnJvciIsInBvcHVwUmFzdGVyaXphdGlvbiIsInVybCIsImdldFRyYWlsRnJvbVBET01JbmRpY2VzU3RyaW5nIiwiaW5kaWNlc1N0cmluZyIsImluZGV4U3RyaW5ncyIsIlBET01fVU5JUVVFX0lEX1NFUEFSQVRPUiIsImRpZ2l0IiwiTnVtYmVyIiwicmVmcmVzaFNWR09uTmV4dEZyYW1lIiwicmVtb3ZlUm9vdGVkRGlzcGxheSIsInJlbW92ZUxpc3RlbmVyIiwieGh0bWwiLCJYTUxTZXJpYWxpemVyIiwic2VyaWFsaXplVG9TdHJpbmciLCJkYXRhIiwiaW1nIiwidWludDhhcnJheSIsIlRleHRFbmNvZGVyTGl0ZSIsImVuY29kZSIsImJhc2U2NCIsImZyb21CeXRlQXJyYXkiLCJpc0Rpc3Bvc2VkIiwicmVnaXN0ZXIiLCJ1c2VyR2VzdHVyZUVtaXR0ZXIiXSwic291cmNlcyI6WyJEaXNwbGF5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEEgcGVyc2lzdGVudCBkaXNwbGF5IG9mIGEgc3BlY2lmaWMgTm9kZSBhbmQgaXRzIGRlc2NlbmRhbnRzLCB3aGljaCBpcyB1cGRhdGVkIGF0IGRpc2NyZXRlIHBvaW50cyBpbiB0aW1lLlxyXG4gKlxyXG4gKiBVc2UgZGlzcGxheS5nZXRET01FbGVtZW50IG9yIGRpc3BsYXkuZG9tRWxlbWVudCB0byByZXRyaWV2ZSB0aGUgRGlzcGxheSdzIERPTSByZXByZXNlbnRhdGlvbi5cclxuICogVXNlIGRpc3BsYXkudXBkYXRlRGlzcGxheSgpIHRvIHRyaWdnZXIgdGhlIHZpc3VhbCB1cGRhdGUgaW4gdGhlIERpc3BsYXkncyBET00gZWxlbWVudC5cclxuICpcclxuICogQSBzdGFuZGFyZCB3YXkgb2YgdXNpbmcgYSBEaXNwbGF5IHdpdGggU2NlbmVyeSBpcyB0bzpcclxuICogMS4gQ3JlYXRlIGEgTm9kZSB0aGF0IHdpbGwgYmUgdGhlIHJvb3RcclxuICogMi4gQ3JlYXRlIGEgRGlzcGxheSwgcmVmZXJlbmNpbmcgdGhhdCBub2RlXHJcbiAqIDMuIE1ha2UgY2hhbmdlcyB0byB0aGUgc2NlbmUgZ3JhcGhcclxuICogNC4gQ2FsbCBkaXNwbGF5LnVwZGF0ZURpc3BsYXkoKSB0byBkcmF3IHRoZSBzY2VuZSBncmFwaCBpbnRvIHRoZSBEaXNwbGF5XHJcbiAqIDUuIEdvIHRvICgzKVxyXG4gKlxyXG4gKiBDb21tb24gd2F5cyB0byBzaW1wbGlmeSB0aGUgY2hhbmdlL3VwZGF0ZSBsb29wIHdvdWxkIGJlIHRvOlxyXG4gKiAtIFVzZSBOb2RlLWJhc2VkIGV2ZW50cy4gSW5pdGlhbGl6ZSBpdCB3aXRoIERpc3BsYXkuaW5pdGlhbGl6ZUV2ZW50cygpLCB0aGVuXHJcbiAqICAgYWRkIGlucHV0IGxpc3RlbmVycyB0byBwYXJ0cyBvZiB0aGUgc2NlbmUgZ3JhcGggKHNlZSBOb2RlLmFkZElucHV0TGlzdGVuZXIpLlxyXG4gKiAtIEV4ZWN1dGUgY29kZSAoYW5kIHVwZGF0ZSB0aGUgZGlzcGxheSBhZnRlcndhcmRzKSBieSB1c2luZyBEaXNwbGF5LnVwZGF0ZU9uUmVxdWVzdEFuaW1hdGlvbkZyYW1lLlxyXG4gKlxyXG4gKiBJbnRlcm5hbCBkb2N1bWVudGF0aW9uOlxyXG4gKlxyXG4gKiBMaWZlY3ljbGUgaW5mb3JtYXRpb246XHJcbiAqICAgSW5zdGFuY2UgKGNyZWF0ZSxkaXNwb3NlKVxyXG4gKiAgICAgLSBvdXQgb2YgdXBkYXRlOiAgICAgICAgICAgIFN0YXRlbGVzcyBzdHViIGlzIGNyZWF0ZWQgc3luY2hyb25vdXNseSB3aGVuIGEgTm9kZSdzIGNoaWxkcmVuIGFyZSBhZGRlZCB3aGVyZSB3ZVxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhdmUgbm8gcmVsZXZhbnQgSW5zdGFuY2UuXHJcbiAqICAgICAtIHN0YXJ0IG9mIHVwZGF0ZTogICAgICAgICAgQ3JlYXRlcyBmaXJzdCAocm9vdCkgaW5zdGFuY2UgaWYgaXQgZG9lc24ndCBleGlzdCAoc3RhdGVsZXNzIHN0dWIpLlxyXG4gKiAgICAgLSBzeW5jdHJlZTogICAgICAgICAgICAgICAgIENyZWF0ZSBkZXNjZW5kYW50IGluc3RhbmNlcyB1bmRlciBzdHVicywgZmlsbHMgaW4gc3RhdGUsIGFuZCBtYXJrcyByZW1vdmVkIHN1YnRyZWVcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290cyBmb3IgZGlzcG9zYWwuXHJcbiAqICAgICAtIHVwZGF0ZSBpbnN0YW5jZSBkaXNwb3NhbDogRGlzcG9zZXMgcm9vdCBpbnN0YW5jZXMgdGhhdCB3ZXJlIG1hcmtlZC4gVGhpcyBhbHNvIGRpc3Bvc2VzIGFsbCBkZXNjZW5kYW50XHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2VzLCBhbmQgZm9yIGV2ZXJ5IGluc3RhbmNlLFxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0IGRpc3Bvc2VzIHRoZSBjdXJyZW50bHktYXR0YWNoZWQgZHJhd2FibGVzLlxyXG4gKiAgIERyYXdhYmxlIChjcmVhdGUsZGlzcG9zZSlcclxuICogICAgIC0gc3luY3RyZWU6ICAgICAgICAgICAgICAgICBDcmVhdGVzIGFsbCBkcmF3YWJsZXMgd2hlcmUgbmVjZXNzYXJ5LiBJZiBpdCByZXBsYWNlcyBhIHNlbGYvZ3JvdXAvc2hhcmVkIGRyYXdhYmxlIG9uXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIGluc3RhbmNlLFxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQgb2xkIGRyYXdhYmxlIGlzIG1hcmtlZCBmb3IgZGlzcG9zYWwuXHJcbiAqICAgICAtIHVwZGF0ZSBpbnN0YW5jZSBkaXNwb3NhbDogQW55IGRyYXdhYmxlcyBhdHRhY2hlZCB0byBkaXNwb3NlZCBpbnN0YW5jZXMgYXJlIGRpc3Bvc2VkIHRoZW1zZWx2ZXMgKHNlZSBJbnN0YW5jZVxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpZmVjeWNsZSkuXHJcbiAqICAgICAtIHVwZGF0ZSBkcmF3YWJsZSBkaXNwb3NhbDogQW55IG1hcmtlZCBkcmF3YWJsZXMgdGhhdCB3ZXJlIHJlcGxhY2VkIG9yIHJlbW92ZWQgZnJvbSBhbiBpbnN0YW5jZSAoaXQgZGlkbid0XHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFpbnRhaW4gYSByZWZlcmVuY2UpIGFyZSBkaXNwb3NlZC5cclxuICpcclxuICogICBhZGQvcmVtb3ZlIGRyYXdhYmxlcyBmcm9tIGJsb2NrczpcclxuICogICAgIC0gc3RpdGNoaW5nIGNoYW5nZXMgcGVuZGluZyBcInBhcmVudHNcIiwgbWFya3MgZm9yIGJsb2NrIHVwZGF0ZVxyXG4gKiAgICAgLSBiYWNrYm9uZXMgbWFya2VkIGZvciBkaXNwb3NhbCAoZS5nLiBpbnN0YW5jZSBpcyBzdGlsbCB0aGVyZSwganVzdCBjaGFuZ2VkIHRvIG5vdCBoYXZlIGEgYmFja2JvbmUpIHdpbGwgbWFya1xyXG4gKiAgICAgICAgIGRyYXdhYmxlcyBmb3IgYmxvY2sgdXBkYXRlc1xyXG4gKiAgICAgLSBhZGQvcmVtb3ZlIGRyYXdhYmxlcyBwaGFzZSB1cGRhdGVzIGRyYXdhYmxlcyB0aGF0IHdlcmUgbWFya2VkXHJcbiAqICAgICAtIGRpc3Bvc2VkIGJhY2tib25lIGluc3RhbmNlcyB3aWxsIG9ubHkgcmVtb3ZlIGRyYXdhYmxlcyBpZiB0aGV5IHdlcmVuJ3QgbWFya2VkIGZvciByZW1vdmFsIHByZXZpb3VzbHkgKGUuZy4gaW5cclxuICogICAgICAgICBjYXNlIHdlIGFyZSBmcm9tIGEgcmVtb3ZlZCBpbnN0YW5jZSlcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBFbWl0dGVyIGZyb20gJy4uLy4uLy4uL2F4b24vanMvRW1pdHRlci5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IFRQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBzdGVwVGltZXIgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9zdGVwVGltZXIuanMnO1xyXG5pbXBvcnQgVGlueVByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvVGlueVByb3BlcnR5LmpzJztcclxuaW1wb3J0IEJvdW5kczIgZnJvbSAnLi4vLi4vLi4vZG90L2pzL0JvdW5kczIuanMnO1xyXG5pbXBvcnQgRGltZW5zaW9uMiBmcm9tICcuLi8uLi8uLi9kb3QvanMvRGltZW5zaW9uMi5qcyc7XHJcbmltcG9ydCB7IE1hdHJpeDNUeXBlIH0gZnJvbSAnLi4vLi4vLi4vZG90L2pzL01hdHJpeDMuanMnO1xyXG5pbXBvcnQgVmVjdG9yMiBmcm9tICcuLi8uLi8uLi9kb3QvanMvVmVjdG9yMi5qcyc7XHJcbmltcG9ydCBlc2NhcGVIVE1MIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9lc2NhcGVIVE1MLmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IHBsYXRmb3JtIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9wbGF0Zm9ybS5qcyc7XHJcbmltcG9ydCBQaGV0aW9PYmplY3QsIHsgUGhldGlvT2JqZWN0T3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy9QaGV0aW9PYmplY3QuanMnO1xyXG5pbXBvcnQgQXJpYUxpdmVBbm5vdW5jZXIgZnJvbSAnLi4vLi4vLi4vdXR0ZXJhbmNlLXF1ZXVlL2pzL0FyaWFMaXZlQW5ub3VuY2VyLmpzJztcclxuaW1wb3J0IFV0dGVyYW5jZVF1ZXVlIGZyb20gJy4uLy4uLy4uL3V0dGVyYW5jZS1xdWV1ZS9qcy9VdHRlcmFuY2VRdWV1ZS5qcyc7XHJcbmltcG9ydCB7IEJhY2tib25lRHJhd2FibGUsIEJsb2NrLCBDYW52YXNCbG9jaywgQ2FudmFzTm9kZUJvdW5kc092ZXJsYXksIENoYW5nZUludGVydmFsLCBDb2xvciwgRE9NQmxvY2ssIERPTURyYXdhYmxlLCBEcmF3YWJsZSwgRmVhdHVyZXMsIEZpdHRlZEJsb2NrQm91bmRzT3ZlcmxheSwgRm9jdXNNYW5hZ2VyLCBGdWxsU2NyZWVuLCBnbG9iYWxLZXlTdGF0ZVRyYWNrZXIsIEhpZ2hsaWdodE92ZXJsYXksIEhpdEFyZWFPdmVybGF5LCBJbnB1dCwgSW5wdXRPcHRpb25zLCBJbnN0YW5jZSwgS2V5Ym9hcmRVdGlscywgTm9kZSwgUERPTUluc3RhbmNlLCBQRE9NU2libGluZ1N0eWxlLCBQRE9NVHJlZSwgUERPTVV0aWxzLCBQb2ludGVyLCBQb2ludGVyQXJlYU92ZXJsYXksIFBvaW50ZXJPdmVybGF5LCBSZW5kZXJlciwgc2NlbmVyeSwgU2NlbmVyeUV2ZW50LCBzY2VuZXJ5U2VyaWFsaXplLCBTZWxmRHJhd2FibGUsIFRJbnB1dExpc3RlbmVyLCBUT3ZlcmxheSwgVHJhaWwsIFV0aWxzLCBXZWJHTEJsb2NrIH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBURW1pdHRlciBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RFbWl0dGVyLmpzJztcclxuaW1wb3J0IFNhZmFyaVdvcmthcm91bmRPdmVybGF5IGZyb20gJy4uL292ZXJsYXlzL1NhZmFyaVdvcmthcm91bmRPdmVybGF5LmpzJztcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcbiAgLy8gSW5pdGlhbCAob3Igb3ZlcnJpZGUpIGRpc3BsYXkgd2lkdGhcclxuICB3aWR0aD86IG51bWJlcjtcclxuXHJcbiAgLy8gSW5pdGlhbCAob3Igb3ZlcnJpZGUpIGRpc3BsYXkgaGVpZ2h0XHJcbiAgaGVpZ2h0PzogbnVtYmVyO1xyXG5cclxuICAvLyBBcHBsaWVzIENTUyBzdHlsZXMgdG8gdGhlIHJvb3QgRE9NIGVsZW1lbnQgdGhhdCBtYWtlIGl0IGFtZW5hYmxlIHRvIGludGVyYWN0aXZlIGNvbnRlbnRcclxuICBhbGxvd0NTU0hhY2tzPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gV2hldGhlciB3ZSBhbGxvdyB0aGUgZGlzcGxheSB0byBwdXQgYSByZWN0YW5nbGUgaW4gZnJvbnQgb2YgZXZlcnl0aGluZyB0aGF0IHN1YnRseSBzaGlmdHMgZXZlcnkgZnJhbWUsIGluIG9yZGVyIHRvXHJcbiAgLy8gZm9yY2UgcmVwYWludHMgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9nZW9tZXRyaWMtb3B0aWNzLWJhc2ljcy9pc3N1ZXMvMzEuXHJcbiAgYWxsb3dTYWZhcmlSZWRyYXdXb3JrYXJvdW5kPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gVXN1YWxseSBhbnl0aGluZyBkaXNwbGF5ZWQgb3V0c2lkZSBvdXIgZG9tIGVsZW1lbnQgaXMgaGlkZGVuIHdpdGggQ1NTIG92ZXJmbG93LlxyXG4gIGFsbG93U2NlbmVPdmVyZmxvdz86IGJvb2xlYW47XHJcblxyXG4gIC8vIElmIGZhbHNlLCB0aGlzIHdpbGwgZGlzYWJsZSBsYXllciBmaXR0aW5nIChsaWtlIHB1dHRpbmcgcHJldmVudEZpdDogdHJ1ZSBvbiBOb2RlcywgYnV0IGZvciB0aGUgZW50aXJlIERpc3BsYXkpLlxyXG4gIC8vIExheWVyIGZpdHRpbmcgaGFzIGNhdXNlZCBzb21lIHVuc2lnaHRseSBqaXR0ZXJpbmcgKGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xMjg5KSwgc28gdGhpc1xyXG4gIC8vIGFsbG93cyBpdCB0byBiZSB0dXJuZWQgb24gaW4gYSBjYXNlLWJ5LWNhc2UgbWFubmVyLlxyXG4gIGFsbG93TGF5ZXJGaXR0aW5nPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gV2hhdCBjdXJzb3IgaXMgdXNlZCB3aGVuIG5vIG90aGVyIGN1cnNvciBpcyBzcGVjaWZpZWRcclxuICBkZWZhdWx0Q3Vyc29yPzogc3RyaW5nO1xyXG5cclxuICAvLyBGb3JjZXMgU1ZHIGVsZW1lbnRzIHRvIGJlIHJlZnJlc2hlZCBldmVyeSBmcmFtZSwgd2hpY2ggY2FuIGZvcmNlIHJlcGFpbnRpbmcgYW5kIGRldGVjdCAob3IgcG90ZW50aWFsbHkgaW4gc29tZVxyXG4gIC8vIGNhc2VzIHdvcmsgYXJvdW5kKSBTVkcgcmVuZGVyaW5nIGJyb3dzZXIgYnVncy4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTA3XHJcbiAgZm9yY2VTVkdSZWZyZXNoPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gSW5pdGlhbCBiYWNrZ3JvdW5kIGNvbG9yXHJcbiAgYmFja2dyb3VuZENvbG9yPzogQ29sb3IgfCBzdHJpbmcgfCBudWxsO1xyXG5cclxuICAvLyBXaGV0aGVyIFdlYkdMIHdpbGwgcHJlc2VydmUgdGhlIGRyYXdpbmcgYnVmZmVyXHJcbiAgLy8gV0FSTklORyE6IFRoaXMgY2FuIHNpZ25pZmljYW50bHkgcmVkdWNlIHBlcmZvcm1hbmNlIGlmIHNldCB0byB0cnVlLlxyXG4gIHByZXNlcnZlRHJhd2luZ0J1ZmZlcj86IGJvb2xlYW47XHJcblxyXG4gIC8vIFdoZXRoZXIgV2ViR0wgaXMgZW5hYmxlZCBhdCBhbGwgZm9yIGRyYXdhYmxlcyBpbiB0aGlzIERpc3BsYXlcclxuICAvLyBNYWtlcyBpdCBwb3NzaWJsZSB0byBkaXNhYmxlIFdlYkdMIGZvciBlYXNlIG9mIHRlc3Rpbmcgb24gbm9uLVdlYkdMIHBsYXRmb3Jtcywgc2VlICMyODlcclxuICBhbGxvd1dlYkdMPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gRW5hYmxlcyBhY2Nlc3NpYmlsaXR5IGZlYXR1cmVzXHJcbiAgYWNjZXNzaWJpbGl0eT86IGJvb2xlYW47XHJcblxyXG4gIC8vIHtib29sZWFufSAtIEVuYWJsZXMgSW50ZXJhY3RpdmUgSGlnaGxpZ2h0cyBpbiB0aGUgSGlnaGxpZ2h0T3ZlcmxheS4gVGhlc2UgYXJlIGhpZ2hsaWdodHMgdGhhdCBzdXJyb3VuZFxyXG4gIC8vIGludGVyYWN0aXZlIGNvbXBvbmVudHMgd2hlbiB1c2luZyBtb3VzZSBvciB0b3VjaCB3aGljaCBpbXByb3ZlcyBsb3cgdmlzaW9uIGFjY2Vzcy5cclxuICBzdXBwb3J0c0ludGVyYWN0aXZlSGlnaGxpZ2h0cz86IGJvb2xlYW47XHJcblxyXG4gIC8vIFdoZXRoZXIgbW91c2UvdG91Y2gva2V5Ym9hcmQgaW5wdXRzIGFyZSBlbmFibGVkIChpZiBpbnB1dCBoYXMgYmVlbiBhZGRlZCkuXHJcbiAgaW50ZXJhY3RpdmU/OiBib29sZWFuO1xyXG5cclxuICAvLyBJZiB0cnVlLCBpbnB1dCBldmVudCBsaXN0ZW5lcnMgd2lsbCBiZSBhdHRhY2hlZCB0byB0aGUgRGlzcGxheSdzIERPTSBlbGVtZW50IGluc3RlYWQgb2YgdGhlIHdpbmRvdy5cclxuICAvLyBOb3JtYWxseSwgYXR0YWNoaW5nIGxpc3RlbmVycyB0byB0aGUgd2luZG93IGlzIHByZWZlcnJlZCAoaXQgd2lsbCBzZWUgbW91c2UgbW92ZXMvdXBzIG91dHNpZGUgb2YgdGhlIGJyb3dzZXJcclxuICAvLyB3aW5kb3csIGFsbG93aW5nIGNvcnJlY3QgYnV0dG9uIHRyYWNraW5nKSwgaG93ZXZlciB0aGVyZSBtYXkgYmUgaW5zdGFuY2VzIHdoZXJlIGEgZ2xvYmFsIGxpc3RlbmVyIGlzIG5vdFxyXG4gIC8vIHByZWZlcnJlZC5cclxuICBsaXN0ZW5Ub09ubHlFbGVtZW50PzogYm9vbGVhbjtcclxuXHJcbiAgLy8gRm9yd2FyZGVkIHRvIElucHV0OiBJZiB0cnVlLCBtb3N0IGV2ZW50IHR5cGVzIHdpbGwgYmUgYmF0Y2hlZCB1bnRpbCBvdGhlcndpc2UgdHJpZ2dlcmVkLlxyXG4gIGJhdGNoRE9NRXZlbnRzPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gSWYgdHJ1ZSwgdGhlIGlucHV0IGV2ZW50IGxvY2F0aW9uIChiYXNlZCBvbiB0aGUgdG9wLWxlZnQgb2YgdGhlIGJyb3dzZXIgdGFiJ3Mgdmlld3BvcnQsIHdpdGggbm9cclxuICAvLyBzY2FsaW5nIGFwcGxpZWQpIHdpbGwgYmUgdXNlZC4gVXN1YWxseSwgdGhpcyBpcyBub3QgYSBzYWZlIGFzc3VtcHRpb24sIHNvIHdoZW4gZmFsc2UgdGhlIGxvY2F0aW9uIG9mIHRoZVxyXG4gIC8vIGRpc3BsYXkncyBET00gZWxlbWVudCB3aWxsIGJlIHVzZWQgdG8gZ2V0IHRoZSBjb3JyZWN0IGV2ZW50IGxvY2F0aW9uLiBUaGVyZSBpcyBhIHNsaWdodCBwZXJmb3JtYW5jZSBoaXQgdG9cclxuICAvLyBkb2luZyBzbywgdGh1cyB0aGlzIG9wdGlvbiBpcyBwcm92aWRlZCBpZiB0aGUgdG9wLWxlZnQgbG9jYXRpb24gY2FuIGJlIGd1YXJhbnRlZWQuXHJcbiAgLy8gTk9URTogUm90YXRpb24gb2YgdGhlIERpc3BsYXkncyBET00gZWxlbWVudCAoZS5nLiB3aXRoIGEgQ1NTIHRyYW5zZm9ybSkgd2lsbCByZXN1bHQgaW4gYW4gaW5jb3JyZWN0IGV2ZW50XHJcbiAgLy8gICAgICAgbWFwcGluZywgYXMgZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkgY2FuJ3Qgd29yayB3aXRoIHRoaXMuIGdldEJveFF1YWRzKCkgc2hvdWxkIGZpeCB0aGlzIHdoZW4gYnJvd3NlclxyXG4gIC8vICAgICAgIHN1cHBvcnQgaXMgYXZhaWxhYmxlLlxyXG4gIGFzc3VtZUZ1bGxXaW5kb3c/OiBib29sZWFuO1xyXG5cclxuICAvLyBXaGV0aGVyIFNjZW5lcnkgd2lsbCB0cnkgdG8gYWdncmVzc2l2ZWx5IHJlLWNyZWF0ZSBXZWJHTCBDYW52YXMvY29udGV4dCBpbnN0ZWFkIG9mIHdhaXRpbmcgZm9yXHJcbiAgLy8gYSBjb250ZXh0IHJlc3RvcmVkIGV2ZW50LiBTb21ldGltZXMgY29udGV4dCBsb3NzZXMgY2FuIG9jY3VyIHdpdGhvdXQgYSByZXN0b3JhdGlvbiBhZnRlcndhcmRzLCBidXQgdGhpcyBjYW5cclxuICAvLyBqdW1wLXN0YXJ0IHRoZSBwcm9jZXNzLlxyXG4gIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMzQ3LlxyXG4gIGFnZ3Jlc3NpdmVDb250ZXh0UmVjcmVhdGlvbj86IGJvb2xlYW47XHJcblxyXG4gIC8vIFdoZXRoZXIgdGhlIGBwYXNzaXZlYCBmbGFnIHNob3VsZCBiZSBzZXQgd2hlbiBhZGRpbmcgYW5kIHJlbW92aW5nIERPTSBldmVudCBsaXN0ZW5lcnMuXHJcbiAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy83NzAgZm9yIG1vcmUgZGV0YWlscy5cclxuICAvLyBJZiBpdCBpcyB0cnVlIG9yIGZhbHNlLCB0aGF0IGlzIHRoZSB2YWx1ZSBvZiB0aGUgcGFzc2l2ZSBmbGFnIHRoYXQgd2lsbCBiZSB1c2VkLiBJZiBpdCBpcyBudWxsLCB0aGUgZGVmYXVsdFxyXG4gIC8vIGJlaGF2aW9yIG9mIHRoZSBicm93c2VyIHdpbGwgYmUgdXNlZC5cclxuICAvL1xyXG4gIC8vIFNhZmFyaSBkb2Vzbid0IHN1cHBvcnQgdG91Y2gtYWN0aW9uOiBub25lLCBzbyB3ZSBORUVEIHRvIG5vdCB1c2UgcGFzc2l2ZSBldmVudHMgKHdoaWNoIHdvdWxkIG5vdCBhbGxvd1xyXG4gIC8vIHByZXZlbnREZWZhdWx0IHRvIGRvIGFueXRoaW5nLCBzbyBkcmFncyBhY3R1YWxseSBjYW4gc2Nyb2xsIHRoZSBzaW0pLlxyXG4gIC8vIENocm9tZSBhbHNvIGRpZCB0aGUgc2FtZSBcInBhc3NpdmUgYnkgZGVmYXVsdFwiLCBidXQgYmVjYXVzZSB3ZSBoYXZlIGB0b3VjaC1hY3Rpb246IG5vbmVgIGluIHBsYWNlLCBpdCBkb2Vzbid0XHJcbiAgLy8gYWZmZWN0IHVzLCBhbmQgd2UgY2FuIHBvdGVudGlhbGx5IGdldCBwZXJmb3JtYW5jZSBpbXByb3ZlbWVudHMgYnkgYWxsb3dpbmcgcGFzc2l2ZSBldmVudHMuXHJcbiAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy83NzAgZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgcGFzc2l2ZUV2ZW50cz86IGJvb2xlYW4gfCBudWxsO1xyXG5cclxuICAvLyBXaGV0aGVyLCBpZiBubyBXZWJHTCBhbnRpYWxpYXNpbmcgaXMgZGV0ZWN0ZWQsIHRoZSBiYWNraW5nIHNjYWxlIGNhbiBiZSBpbmNyZWFzZWQgdG8gcHJvdmlkZSBzb21lXHJcbiAgLy8gYW50aWFsaWFzaW5nIGJlbmVmaXQuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvODU5LlxyXG4gIGFsbG93QmFja2luZ1NjYWxlQW50aWFsaWFzaW5nPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gQW4gSFRNTEVsZW1lbnQgdXNlZCB0byBjb250YWluIHRoZSBjb250ZW50cyBvZiB0aGUgRGlzcGxheVxyXG4gIGNvbnRhaW5lcj86IEhUTUxFbGVtZW50O1xyXG59O1xyXG5cclxudHlwZSBQYXJlbnRPcHRpb25zID0gUGljazxQaGV0aW9PYmplY3RPcHRpb25zLCAndGFuZGVtJz47XHJcbmV4cG9ydCB0eXBlIERpc3BsYXlPcHRpb25zID0gU2VsZk9wdGlvbnMgJiBQYXJlbnRPcHRpb25zO1xyXG5cclxuY29uc3QgQ1VTVE9NX0NVUlNPUlMgPSB7XHJcbiAgJ3NjZW5lcnktZ3JhYi1wb2ludGVyJzogWyAnZ3JhYicsICctbW96LWdyYWInLCAnLXdlYmtpdC1ncmFiJywgJ3BvaW50ZXInIF0sXHJcbiAgJ3NjZW5lcnktZ3JhYmJpbmctcG9pbnRlcic6IFsgJ2dyYWJiaW5nJywgJy1tb3otZ3JhYmJpbmcnLCAnLXdlYmtpdC1ncmFiYmluZycsICdwb2ludGVyJyBdXHJcbn0gYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nW10+O1xyXG5cclxubGV0IGdsb2JhbElkQ291bnRlciA9IDE7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEaXNwbGF5IHtcclxuXHJcbiAgLy8gdW5pcXVlIElEIGZvciB0aGUgZGlzcGxheSBpbnN0YW5jZSwgKHNjZW5lcnktaW50ZXJuYWwpLCBhbmQgdXNlZnVsIGZvciBkZWJ1Z2dpbmcgd2l0aCBtdWx0aXBsZSBkaXNwbGF5cy5cclxuICBwdWJsaWMgcmVhZG9ubHkgaWQ6IG51bWJlcjtcclxuXHJcbiAgLy8gVGhlIChpbnRlZ3JhbCwgPiAwKSBkaW1lbnNpb25zIG9mIHRoZSBEaXNwbGF5J3MgRE9NIGVsZW1lbnQgKG9ubHkgdXBkYXRlcyB0aGUgRE9NIGVsZW1lbnQgb24gdXBkYXRlRGlzcGxheSgpKVxyXG4gIHB1YmxpYyByZWFkb25seSBzaXplUHJvcGVydHk6IFRQcm9wZXJ0eTxEaW1lbnNpb24yPjtcclxuXHJcbiAgLy8gZGF0YSBzdHJ1Y3R1cmUgZm9yIG1hbmFnaW5nIGFyaWEtbGl2ZSBhbGVydHMgdGhlIHRoaXMgRGlzcGxheSBpbnN0YW5jZVxyXG4gIHB1YmxpYyBkZXNjcmlwdGlvblV0dGVyYW5jZVF1ZXVlOiBVdHRlcmFuY2VRdWV1ZTtcclxuXHJcbiAgLy8gTWFuYWdlcyB0aGUgdmFyaW91cyB0eXBlcyBvZiBGb2N1cyB0aGF0IGNhbiBnbyB0aHJvdWdoIHRoZSBEaXNwbGF5LCBhcyB3ZWxsIGFzIFByb3BlcnRpZXNcclxuICAvLyBjb250cm9sbGluZyB3aGljaCBmb3JtcyBvZiBmb2N1cyBzaG91bGQgYmUgZGlzcGxheWVkIGluIHRoZSBIaWdobGlnaHRPdmVybGF5LlxyXG4gIHB1YmxpYyBmb2N1c01hbmFnZXI6IEZvY3VzTWFuYWdlcjtcclxuXHJcbiAgLy8gKHBoZXQtaW8sc2NlbmVyeSkgLSBXaWxsIGJlIGZpbGxlZCBpbiB3aXRoIGEgcGhldC5zY2VuZXJ5LklucHV0IGlmIGV2ZW50IGhhbmRsaW5nIGlzIGVuYWJsZWRcclxuICBwdWJsaWMgX2lucHV0OiBJbnB1dCB8IG51bGw7XHJcblxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKSBXaGV0aGVyIGFjY2Vzc2liaWxpdHkgaXMgZW5hYmxlZCBmb3IgdGhpcyBwYXJ0aWN1bGFyIGRpc3BsYXkuXHJcbiAgcHVibGljIHJlYWRvbmx5IF9hY2Nlc3NpYmxlOiBib29sZWFuO1xyXG5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgcmVhZG9ubHkgX3ByZXNlcnZlRHJhd2luZ0J1ZmZlcjogYm9vbGVhbjtcclxuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpIG1hcCBmcm9tIE5vZGUgSUQgdG8gSW5zdGFuY2UsIGZvciBmYXN0IGxvb2t1cFxyXG4gIHB1YmxpYyBfc2hhcmVkQ2FudmFzSW5zdGFuY2VzOiBSZWNvcmQ8bnVtYmVyLCBJbnN0YW5jZT47XHJcblxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKSAtIFdlIGhhdmUgYSBtb25vdG9uaWNhbGx5LWluY3JlYXNpbmcgZnJhbWUgSUQsIGdlbmVyYWxseSBmb3IgdXNlIHdpdGggYSBwYXR0ZXJuXHJcbiAgLy8gd2hlcmUgd2UgY2FuIG1hcmsgb2JqZWN0cyB3aXRoIHRoaXMgdG8gbm90ZSB0aGF0IHRoZXkgYXJlIGVpdGhlciB1cC10by1kYXRlIG9yIG5lZWQgcmVmcmVzaGluZyBkdWUgdG8gdGhpc1xyXG4gIC8vIHBhcnRpY3VsYXIgZnJhbWUgKHdpdGhvdXQgaGF2aW5nIHRvIGNsZWFyIHRoYXQgaW5mb3JtYXRpb24gYWZ0ZXIgdXNlKS4gVGhpcyBpcyBpbmNyZW1lbnRlZCBldmVyeSBmcmFtZVxyXG4gIHB1YmxpYyBfZnJhbWVJZDogbnVtYmVyO1xyXG5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX2FnZ3Jlc3NpdmVDb250ZXh0UmVjcmVhdGlvbjogYm9vbGVhbjtcclxuICBwdWJsaWMgX2FsbG93QmFja2luZ1NjYWxlQW50aWFsaWFzaW5nOiBib29sZWFuO1xyXG4gIHB1YmxpYyBfYWxsb3dMYXllckZpdHRpbmc6IGJvb2xlYW47XHJcbiAgcHVibGljIF9mb3JjZVNWR1JlZnJlc2g6IGJvb2xlYW47XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgX2FsbG93V2ViR0w6IGJvb2xlYW47XHJcbiAgcHJpdmF0ZSByZWFkb25seSBfYWxsb3dDU1NIYWNrczogYm9vbGVhbjtcclxuICBwcml2YXRlIHJlYWRvbmx5IF9hbGxvd1NjZW5lT3ZlcmZsb3c6IGJvb2xlYW47XHJcbiAgcHJpdmF0ZSByZWFkb25seSBfZGVmYXVsdEN1cnNvcjogc3RyaW5nO1xyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IF9yb290Tm9kZTogTm9kZTtcclxuICBwcml2YXRlIF9yb290QmFja2JvbmU6IEJhY2tib25lRHJhd2FibGUgfCBudWxsOyAvLyB0byBiZSBmaWxsZWQgaW4gbGF0ZXJcclxuICBwcml2YXRlIHJlYWRvbmx5IF9kb21FbGVtZW50OiBIVE1MRWxlbWVudDtcclxuICBwcml2YXRlIF9iYXNlSW5zdGFuY2U6IEluc3RhbmNlIHwgbnVsbDsgLy8gd2lsbCBiZSBmaWxsZWQgd2l0aCB0aGUgcm9vdCBJbnN0YW5jZVxyXG5cclxuICAvLyBVc2VkIHRvIGNoZWNrIGFnYWluc3QgbmV3IHNpemUgdG8gc2VlIHdoYXQgd2UgbmVlZCB0byBjaGFuZ2VcclxuICBwcml2YXRlIF9jdXJyZW50U2l6ZTogRGltZW5zaW9uMjtcclxuXHJcbiAgcHJpdmF0ZSBfZGlydHlUcmFuc2Zvcm1Sb290czogSW5zdGFuY2VbXTtcclxuICBwcml2YXRlIF9kaXJ0eVRyYW5zZm9ybVJvb3RzV2l0aG91dFBhc3M6IEluc3RhbmNlW107XHJcbiAgcHJpdmF0ZSBfaW5zdGFuY2VSb290c1RvRGlzcG9zZTogSW5zdGFuY2VbXTtcclxuXHJcbiAgLy8gQXQgdGhlIGVuZCBvZiBEaXNwbGF5LnVwZGF0ZSwgcmVkdWNlUmVmZXJlbmNlcyB3aWxsIGJlIGNhbGxlZCBvbiBhbGwgb2YgdGhlc2UuIEl0J3MgbWVhbnQgdG9cclxuICAvLyBjYXRjaCB2YXJpb3VzIG9iamVjdHMgdGhhdCB3b3VsZCB1c3VhbGx5IGhhdmUgdXBkYXRlKCkgY2FsbGVkLCBidXQgaWYgdGhleSBhcmUgaW52aXNpYmxlIG9yIG90aGVyd2lzZSBub3QgdXBkYXRlZFxyXG4gIC8vIGZvciBwZXJmb3JtYW5jZSwgdGhleSBtYXkgbmVlZCB0byByZWxlYXNlIHJlZmVyZW5jZXMgYW5vdGhlciB3YXkgaW5zdGVhZC5cclxuICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2VuZXJneS1mb3Jtcy1hbmQtY2hhbmdlcy9pc3N1ZXMvMzU2XHJcbiAgcHJpdmF0ZSBfcmVkdWNlUmVmZXJlbmNlc05lZWRlZDogeyByZWR1Y2VSZWZlcmVuY2VzOiAoKSA9PiB2b2lkIH1bXTtcclxuXHJcbiAgcHJpdmF0ZSBfZHJhd2FibGVzVG9EaXNwb3NlOiBEcmF3YWJsZVtdO1xyXG5cclxuICAvLyBCbG9jayBjaGFuZ2VzIGFyZSBoYW5kbGVkIGJ5IGNoYW5naW5nIHRoZSBcInBlbmRpbmdcIiBibG9jay9iYWNrYm9uZSBvbiBkcmF3YWJsZXMuIFdlXHJcbiAgLy8gd2FudCB0byBjaGFuZ2UgdGhlbSBhbGwgYWZ0ZXIgdGhlIG1haW4gc3RpdGNoIHByb2Nlc3MgaGFzIGNvbXBsZXRlZCwgc28gd2UgY2FuIGd1YXJhbnRlZSB0aGF0IGEgc2luZ2xlIGRyYXdhYmxlIGlzXHJcbiAgLy8gcmVtb3ZlZCBmcm9tIGl0cyBwcmV2aW91cyBibG9jayBiZWZvcmUgYmVpbmcgYWRkZWQgdG8gYSBuZXcgb25lLiBUaGlzIGlzIHRha2VuIGNhcmUgb2YgaW4gYW4gdXBkYXRlRGlzcGxheSBwYXNzXHJcbiAgLy8gYWZ0ZXIgc3luY1RyZWUgLyBzdGl0Y2hpbmcuXHJcbiAgcHJpdmF0ZSBfZHJhd2FibGVzVG9DaGFuZ2VCbG9jazogRHJhd2FibGVbXTtcclxuXHJcbiAgLy8gRHJhd2FibGVzIGhhdmUgdHdvIGltcGxpY2l0IGxpbmtlZC1saXN0cywgXCJjdXJyZW50XCIgYW5kIFwib2xkXCIuIHN5bmNUcmVlIG1vZGlmaWVzIHRoZVxyXG4gIC8vIFwiY3VycmVudFwiIGxpbmtlZC1saXN0IGluZm9ybWF0aW9uIHNvIGl0IGlzIHVwLXRvLWRhdGUsIGJ1dCBuZWVkcyB0byB1c2UgdGhlIFwib2xkXCIgaW5mb3JtYXRpb24gYWxzby4gV2UgbW92ZVxyXG4gIC8vIHVwZGF0aW5nIHRoZSBcImN1cnJlbnRcIiA9PiBcIm9sZFwiIGxpbmtlZC1saXN0IGluZm9ybWF0aW9uIHVudGlsIGFmdGVyIHN5bmNUcmVlIGFuZCBzdGl0Y2hpbmcgaXMgY29tcGxldGUsIGFuZCBpc1xyXG4gIC8vIHRha2VuIGNhcmUgb2YgaW4gYW4gdXBkYXRlRGlzcGxheSBwYXNzLlxyXG4gIHByaXZhdGUgX2RyYXdhYmxlc1RvVXBkYXRlTGlua3M6IERyYXdhYmxlW107XHJcblxyXG4gIC8vIFdlIHN0b3JlIGluZm9ybWF0aW9uIG9uIHtDaGFuZ2VJbnRlcnZhbH1zIHRoYXQgcmVjb3JkcyBjaGFuZ2UgaW50ZXJ2YWxcclxuICAvLyBpbmZvcm1hdGlvbiwgdGhhdCBtYXkgY29udGFpbiByZWZlcmVuY2VzLiBXZSBkb24ndCB3YW50IHRvIGxlYXZlIHRob3NlIHJlZmVyZW5jZXMgZGFuZ2xpbmcgYWZ0ZXIgd2UgZG9uJ3QgbmVlZFxyXG4gIC8vIHRoZW0sIHNvIHRoZXkgYXJlIHJlY29yZGVkIGFuZCBjbGVhbmVkIGluIG9uZSBvZiB1cGRhdGVEaXNwbGF5J3MgcGhhc2VzLlxyXG4gIHByaXZhdGUgX2NoYW5nZUludGVydmFsc1RvRGlzcG9zZTogQ2hhbmdlSW50ZXJ2YWxbXTtcclxuXHJcbiAgcHJpdmF0ZSBfbGFzdEN1cnNvcjogc3RyaW5nIHwgbnVsbDtcclxuICBwcml2YXRlIF9jdXJyZW50QmFja2dyb3VuZENTUzogc3RyaW5nIHwgbnVsbDtcclxuXHJcbiAgcHJpdmF0ZSBfYmFja2dyb3VuZENvbG9yOiBDb2xvciB8IHN0cmluZyB8IG51bGw7XHJcblxyXG4gIC8vIFVzZWQgZm9yIHNob3J0Y3V0IGFuaW1hdGlvbiBmcmFtZSBmdW5jdGlvbnNcclxuICBwcml2YXRlIF9yZXF1ZXN0QW5pbWF0aW9uRnJhbWVJRDogbnVtYmVyO1xyXG5cclxuICAvLyBMaXN0ZW5lcnMgdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZXZlcnkgZXZlbnQuXHJcbiAgcHJpdmF0ZSBfaW5wdXRMaXN0ZW5lcnM6IFRJbnB1dExpc3RlbmVyW107XHJcblxyXG4gIC8vIFdoZXRoZXIgbW91c2UvdG91Y2gva2V5Ym9hcmQgaW5wdXRzIGFyZSBlbmFibGVkIChpZiBpbnB1dCBoYXMgYmVlbiBhZGRlZCkuIFNpbXVsYXRpb24gd2lsbCBzdGlsbCBzdGVwLlxyXG4gIHByaXZhdGUgX2ludGVyYWN0aXZlOiBib29sZWFuO1xyXG5cclxuICAvLyBQYXNzZWQgdGhyb3VnaCB0byBJbnB1dFxyXG4gIHByaXZhdGUgX2xpc3RlblRvT25seUVsZW1lbnQ6IGJvb2xlYW47XHJcbiAgcHJpdmF0ZSBfYmF0Y2hET01FdmVudHM6IGJvb2xlYW47XHJcbiAgcHJpdmF0ZSBfYXNzdW1lRnVsbFdpbmRvdzogYm9vbGVhbjtcclxuICBwcml2YXRlIF9wYXNzaXZlRXZlbnRzOiBib29sZWFuIHwgbnVsbDtcclxuXHJcbiAgLy8gT3ZlcmxheXMgY3VycmVudGx5IGJlaW5nIGRpc3BsYXllZC5cclxuICBwcml2YXRlIF9vdmVybGF5czogVE92ZXJsYXlbXTtcclxuXHJcbiAgcHJpdmF0ZSBfcG9pbnRlck92ZXJsYXk6IFBvaW50ZXJPdmVybGF5IHwgbnVsbDtcclxuICBwcml2YXRlIF9wb2ludGVyQXJlYU92ZXJsYXk6IFBvaW50ZXJBcmVhT3ZlcmxheSB8IG51bGw7XHJcbiAgcHJpdmF0ZSBfaGl0QXJlYU92ZXJsYXk6IEhpdEFyZWFPdmVybGF5IHwgbnVsbDtcclxuICBwcml2YXRlIF9jYW52YXNBcmVhQm91bmRzT3ZlcmxheTogQ2FudmFzTm9kZUJvdW5kc092ZXJsYXkgfCBudWxsO1xyXG4gIHByaXZhdGUgX2ZpdHRlZEJsb2NrQm91bmRzT3ZlcmxheTogRml0dGVkQmxvY2tCb3VuZHNPdmVybGF5IHwgbnVsbDtcclxuXHJcbiAgLy8gQGFzc2VydGlvbi1vbmx5IC0gV2hldGhlciB3ZSBhcmUgcnVubmluZyB0aGUgcGFpbnQgcGhhc2Ugb2YgdXBkYXRlRGlzcGxheSgpIGZvciB0aGlzIERpc3BsYXkuXHJcbiAgcHJpdmF0ZSBfaXNQYWludGluZz86IGJvb2xlYW47XHJcblxyXG4gIC8vIEBhc3NlcnRpb24tb25seVxyXG4gIHB1YmxpYyBfaXNEaXNwb3Npbmc/OiBib29sZWFuO1xyXG5cclxuICAvLyBAYXNzZXJ0aW9uLW9ubHkgV2hldGhlciBkaXNwb3NhbCBoYXMgc3RhcnRlZCAoYnV0IG5vdCBmaW5pc2hlZClcclxuICBwdWJsaWMgX2lzRGlzcG9zZWQ/OiBib29sZWFuO1xyXG5cclxuICAvLyBJZiBhY2Nlc3NpYmxlXHJcbiAgcHJpdmF0ZSBfZm9jdXNSb290Tm9kZT86IE5vZGU7XHJcbiAgcHJpdmF0ZSBfZm9jdXNPdmVybGF5PzogSGlnaGxpZ2h0T3ZlcmxheTtcclxuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwsIGlmIGFjY2Vzc2libGUpXHJcbiAgcHVibGljIF9yb290UERPTUluc3RhbmNlPzogUERPTUluc3RhbmNlO1xyXG5cclxuICAvLyAoaWYgYWNjZXNzaWJsZSlcclxuICBwcml2YXRlIF9ib3VuZEhhbmRsZUZ1bGxTY3JlZW5OYXZpZ2F0aW9uPzogKCBkb21FdmVudDogS2V5Ym9hcmRFdmVudCApID0+IHZvaWQ7XHJcblxyXG4gIC8vIElmIGxvZ2dpbmcgcGVyZm9ybWFuY2VcclxuICBwcml2YXRlIHBlcmZTeW5jVHJlZUNvdW50PzogbnVtYmVyO1xyXG4gIHByaXZhdGUgcGVyZlN0aXRjaENvdW50PzogbnVtYmVyO1xyXG4gIHByaXZhdGUgcGVyZkludGVydmFsQ291bnQ/OiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBwZXJmRHJhd2FibGVCbG9ja0NoYW5nZUNvdW50PzogbnVtYmVyO1xyXG4gIHByaXZhdGUgcGVyZkRyYXdhYmxlT2xkSW50ZXJ2YWxDb3VudD86IG51bWJlcjtcclxuICBwcml2YXRlIHBlcmZEcmF3YWJsZU5ld0ludGVydmFsQ291bnQ/OiBudW1iZXI7XHJcblxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKSBXaGVuIGZpcmVkLCBmb3JjZXMgYW4gU1ZHIHJlZnJlc2gsIHRvIHRyeSB0byB3b3JrIGFyb3VuZCBpc3N1ZXNcclxuICAvLyBsaWtlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTA3XHJcbiAgcHVibGljIHJlYWRvbmx5IF9yZWZyZXNoU1ZHRW1pdHRlciA9IG5ldyBFbWl0dGVyKCk7XHJcblxyXG4gIC8vIElmIHRydWUsIHdlIHdpbGwgcmVmcmVzaCB0aGUgU1ZHIGVsZW1lbnRzIG9uIHRoZSBuZXh0IGZyYW1lXHJcbiAgcHJpdmF0ZSBfcmVmcmVzaFNWR1BlbmRpbmcgPSBmYWxzZTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3RydWN0cyBhIERpc3BsYXkgdGhhdCB3aWxsIHNob3cgdGhlIHJvb3ROb2RlIGFuZCBpdHMgc3VidHJlZSBpbiBhIHZpc3VhbCBzdGF0ZS4gRGVmYXVsdCBvcHRpb25zIHByb3ZpZGVkIGJlbG93XHJcbiAgICpcclxuICAgKiBAcGFyYW0gcm9vdE5vZGUgLSBEaXNwbGF5cyB0aGlzIG5vZGUgYW5kIGFsbCBvZiBpdHMgZGVzY2VuZGFudHNcclxuICAgKiBAcGFyYW0gW3Byb3ZpZGVkT3B0aW9uc11cclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHJvb3ROb2RlOiBOb2RlLCBwcm92aWRlZE9wdGlvbnM/OiBEaXNwbGF5T3B0aW9ucyApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHJvb3ROb2RlLCAncm9vdE5vZGUgaXMgYSByZXF1aXJlZCBwYXJhbWV0ZXInICk7XHJcblxyXG4gICAgLy9PSFRXTyBUT0RPOiBoeWJyaWQgYmF0Y2hpbmcgKG9wdGlvbiB0byBiYXRjaCB1bnRpbCBhbiBldmVudCBsaWtlICd1cCcgdGhhdCBtaWdodCBiZSBuZWVkZWQgZm9yIHNlY3VyaXR5IGlzc3VlcykgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPERpc3BsYXlPcHRpb25zLCBTdHJpY3RPbWl0PFNlbGZPcHRpb25zLCAnY29udGFpbmVyJz4sIFBhcmVudE9wdGlvbnM+KCkoIHtcclxuICAgICAgLy8ge251bWJlcn0gLSBJbml0aWFsIGRpc3BsYXkgd2lkdGhcclxuICAgICAgd2lkdGg6ICggcHJvdmlkZWRPcHRpb25zICYmIHByb3ZpZGVkT3B0aW9ucy5jb250YWluZXIgJiYgcHJvdmlkZWRPcHRpb25zLmNvbnRhaW5lci5jbGllbnRXaWR0aCApIHx8IDY0MCxcclxuXHJcbiAgICAgIC8vIHtudW1iZXJ9IC0gSW5pdGlhbCBkaXNwbGF5IGhlaWdodFxyXG4gICAgICBoZWlnaHQ6ICggcHJvdmlkZWRPcHRpb25zICYmIHByb3ZpZGVkT3B0aW9ucy5jb250YWluZXIgJiYgcHJvdmlkZWRPcHRpb25zLmNvbnRhaW5lci5jbGllbnRIZWlnaHQgKSB8fCA0ODAsXHJcblxyXG4gICAgICAvLyB7Ym9vbGVhbn0gLSBBcHBsaWVzIENTUyBzdHlsZXMgdG8gdGhlIHJvb3QgRE9NIGVsZW1lbnQgdGhhdCBtYWtlIGl0IGFtZW5hYmxlIHRvIGludGVyYWN0aXZlIGNvbnRlbnRcclxuICAgICAgYWxsb3dDU1NIYWNrczogdHJ1ZSxcclxuXHJcbiAgICAgIGFsbG93U2FmYXJpUmVkcmF3V29ya2Fyb3VuZDogZmFsc2UsXHJcblxyXG4gICAgICAvLyB7Ym9vbGVhbn0gLSBVc3VhbGx5IGFueXRoaW5nIGRpc3BsYXllZCBvdXRzaWRlIG9mIG91ciBkb20gZWxlbWVudCBpcyBoaWRkZW4gd2l0aCBDU1Mgb3ZlcmZsb3dcclxuICAgICAgYWxsb3dTY2VuZU92ZXJmbG93OiBmYWxzZSxcclxuXHJcbiAgICAgIGFsbG93TGF5ZXJGaXR0aW5nOiBmYWxzZSxcclxuXHJcbiAgICAgIGZvcmNlU1ZHUmVmcmVzaDogZmFsc2UsXHJcblxyXG4gICAgICAvLyB7c3RyaW5nfSAtIFdoYXQgY3Vyc29yIGlzIHVzZWQgd2hlbiBubyBvdGhlciBjdXJzb3IgaXMgc3BlY2lmaWVkXHJcbiAgICAgIGRlZmF1bHRDdXJzb3I6ICdkZWZhdWx0JyxcclxuXHJcbiAgICAgIC8vIHtDb2xvckRlZn0gLSBJbml0aWFsIGJhY2tncm91bmQgY29sb3JcclxuICAgICAgYmFja2dyb3VuZENvbG9yOiBudWxsLFxyXG5cclxuICAgICAgLy8ge2Jvb2xlYW59IC0gV2hldGhlciBXZWJHTCB3aWxsIHByZXNlcnZlIHRoZSBkcmF3aW5nIGJ1ZmZlclxyXG4gICAgICBwcmVzZXJ2ZURyYXdpbmdCdWZmZXI6IGZhbHNlLFxyXG5cclxuICAgICAgLy8ge2Jvb2xlYW59IC0gV2hldGhlciBXZWJHTCBpcyBlbmFibGVkIGF0IGFsbCBmb3IgZHJhd2FibGVzIGluIHRoaXMgRGlzcGxheVxyXG4gICAgICBhbGxvd1dlYkdMOiB0cnVlLFxyXG5cclxuICAgICAgLy8ge2Jvb2xlYW59IC0gRW5hYmxlcyBhY2Nlc3NpYmlsaXR5IGZlYXR1cmVzXHJcbiAgICAgIGFjY2Vzc2liaWxpdHk6IHRydWUsXHJcblxyXG4gICAgICAvLyB7Ym9vbGVhbn0gLSBTZWUgZGVjbGFyYXRpb24uXHJcbiAgICAgIHN1cHBvcnRzSW50ZXJhY3RpdmVIaWdobGlnaHRzOiBmYWxzZSxcclxuXHJcbiAgICAgIC8vIHtib29sZWFufSAtIFdoZXRoZXIgbW91c2UvdG91Y2gva2V5Ym9hcmQgaW5wdXRzIGFyZSBlbmFibGVkIChpZiBpbnB1dCBoYXMgYmVlbiBhZGRlZCkuXHJcbiAgICAgIGludGVyYWN0aXZlOiB0cnVlLFxyXG5cclxuICAgICAgLy8ge2Jvb2xlYW59IC0gSWYgdHJ1ZSwgaW5wdXQgZXZlbnQgbGlzdGVuZXJzIHdpbGwgYmUgYXR0YWNoZWQgdG8gdGhlIERpc3BsYXkncyBET00gZWxlbWVudCBpbnN0ZWFkIG9mIHRoZSB3aW5kb3cuXHJcbiAgICAgIC8vIE5vcm1hbGx5LCBhdHRhY2hpbmcgbGlzdGVuZXJzIHRvIHRoZSB3aW5kb3cgaXMgcHJlZmVycmVkIChpdCB3aWxsIHNlZSBtb3VzZSBtb3Zlcy91cHMgb3V0c2lkZSBvZiB0aGUgYnJvd3NlclxyXG4gICAgICAvLyB3aW5kb3csIGFsbG93aW5nIGNvcnJlY3QgYnV0dG9uIHRyYWNraW5nKSwgaG93ZXZlciB0aGVyZSBtYXkgYmUgaW5zdGFuY2VzIHdoZXJlIGEgZ2xvYmFsIGxpc3RlbmVyIGlzIG5vdFxyXG4gICAgICAvLyBwcmVmZXJyZWQuXHJcbiAgICAgIGxpc3RlblRvT25seUVsZW1lbnQ6IGZhbHNlLFxyXG5cclxuICAgICAgLy8ge2Jvb2xlYW59IC0gRm9yd2FyZGVkIHRvIElucHV0OiBJZiB0cnVlLCBtb3N0IGV2ZW50IHR5cGVzIHdpbGwgYmUgYmF0Y2hlZCB1bnRpbCBvdGhlcndpc2UgdHJpZ2dlcmVkLlxyXG4gICAgICBiYXRjaERPTUV2ZW50czogZmFsc2UsXHJcblxyXG4gICAgICAvLyB7Ym9vbGVhbn0gLSBJZiB0cnVlLCB0aGUgaW5wdXQgZXZlbnQgbG9jYXRpb24gKGJhc2VkIG9uIHRoZSB0b3AtbGVmdCBvZiB0aGUgYnJvd3NlciB0YWIncyB2aWV3cG9ydCwgd2l0aCBub1xyXG4gICAgICAvLyBzY2FsaW5nIGFwcGxpZWQpIHdpbGwgYmUgdXNlZC4gVXN1YWxseSwgdGhpcyBpcyBub3QgYSBzYWZlIGFzc3VtcHRpb24sIHNvIHdoZW4gZmFsc2UgdGhlIGxvY2F0aW9uIG9mIHRoZVxyXG4gICAgICAvLyBkaXNwbGF5J3MgRE9NIGVsZW1lbnQgd2lsbCBiZSB1c2VkIHRvIGdldCB0aGUgY29ycmVjdCBldmVudCBsb2NhdGlvbi4gVGhlcmUgaXMgYSBzbGlnaHQgcGVyZm9ybWFuY2UgaGl0IHRvXHJcbiAgICAgIC8vIGRvaW5nIHNvLCB0aHVzIHRoaXMgb3B0aW9uIGlzIHByb3ZpZGVkIGlmIHRoZSB0b3AtbGVmdCBsb2NhdGlvbiBjYW4gYmUgZ3VhcmFudGVlZC5cclxuICAgICAgLy8gTk9URTogUm90YXRpb24gb2YgdGhlIERpc3BsYXkncyBET00gZWxlbWVudCAoZS5nLiB3aXRoIGEgQ1NTIHRyYW5zZm9ybSkgd2lsbCByZXN1bHQgaW4gYW4gaW5jb3JyZWN0IGV2ZW50XHJcbiAgICAgIC8vICAgICAgIG1hcHBpbmcsIGFzIGdldEJvdW5kaW5nQ2xpZW50UmVjdCgpIGNhbid0IHdvcmsgd2l0aCB0aGlzLiBnZXRCb3hRdWFkcygpIHNob3VsZCBmaXggdGhpcyB3aGVuIGJyb3dzZXJcclxuICAgICAgLy8gICAgICAgc3VwcG9ydCBpcyBhdmFpbGFibGUuXHJcbiAgICAgIGFzc3VtZUZ1bGxXaW5kb3c6IGZhbHNlLFxyXG5cclxuICAgICAgLy8ge2Jvb2xlYW59IC0gV2hldGhlciBTY2VuZXJ5IHdpbGwgdHJ5IHRvIGFnZ3Jlc3NpdmVseSByZS1jcmVhdGUgV2ViR0wgQ2FudmFzL2NvbnRleHQgaW5zdGVhZCBvZiB3YWl0aW5nIGZvclxyXG4gICAgICAvLyBhIGNvbnRleHQgcmVzdG9yZWQgZXZlbnQuIFNvbWV0aW1lcyBjb250ZXh0IGxvc3NlcyBjYW4gb2NjdXIgd2l0aG91dCBhIHJlc3RvcmF0aW9uIGFmdGVyd2FyZHMsIGJ1dCB0aGlzIGNhblxyXG4gICAgICAvLyBqdW1wLXN0YXJ0IHRoZSBwcm9jZXNzLlxyXG4gICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzM0Ny5cclxuICAgICAgYWdncmVzc2l2ZUNvbnRleHRSZWNyZWF0aW9uOiB0cnVlLFxyXG5cclxuICAgICAgLy8ge2Jvb2xlYW58bnVsbH0gLSBXaGV0aGVyIHRoZSBgcGFzc2l2ZWAgZmxhZyBzaG91bGQgYmUgc2V0IHdoZW4gYWRkaW5nIGFuZCByZW1vdmluZyBET00gZXZlbnQgbGlzdGVuZXJzLlxyXG4gICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzc3MCBmb3IgbW9yZSBkZXRhaWxzLlxyXG4gICAgICAvLyBJZiBpdCBpcyB0cnVlIG9yIGZhbHNlLCB0aGF0IGlzIHRoZSB2YWx1ZSBvZiB0aGUgcGFzc2l2ZSBmbGFnIHRoYXQgd2lsbCBiZSB1c2VkLiBJZiBpdCBpcyBudWxsLCB0aGUgZGVmYXVsdFxyXG4gICAgICAvLyBiZWhhdmlvciBvZiB0aGUgYnJvd3NlciB3aWxsIGJlIHVzZWQuXHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIFNhZmFyaSBkb2Vzbid0IHN1cHBvcnQgdG91Y2gtYWN0aW9uOiBub25lLCBzbyB3ZSBORUVEIHRvIG5vdCB1c2UgcGFzc2l2ZSBldmVudHMgKHdoaWNoIHdvdWxkIG5vdCBhbGxvd1xyXG4gICAgICAvLyBwcmV2ZW50RGVmYXVsdCB0byBkbyBhbnl0aGluZywgc28gZHJhZ3MgYWN0dWFsbHkgY2FuIHNjcm9sbCB0aGUgc2ltKS5cclxuICAgICAgLy8gQ2hyb21lIGFsc28gZGlkIHRoZSBzYW1lIFwicGFzc2l2ZSBieSBkZWZhdWx0XCIsIGJ1dCBiZWNhdXNlIHdlIGhhdmUgYHRvdWNoLWFjdGlvbjogbm9uZWAgaW4gcGxhY2UsIGl0IGRvZXNuJ3RcclxuICAgICAgLy8gYWZmZWN0IHVzLCBhbmQgd2UgY2FuIHBvdGVudGlhbGx5IGdldCBwZXJmb3JtYW5jZSBpbXByb3ZlbWVudHMgYnkgYWxsb3dpbmcgcGFzc2l2ZSBldmVudHMuXHJcbiAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvNzcwIGZvciBtb3JlIGluZm9ybWF0aW9uLlxyXG4gICAgICBwYXNzaXZlRXZlbnRzOiBwbGF0Zm9ybS5zYWZhcmkgPyBmYWxzZSA6IG51bGwsXHJcblxyXG4gICAgICAvLyB7Ym9vbGVhbn0gLSBXaGV0aGVyLCBpZiBubyBXZWJHTCBhbnRpYWxpYXNpbmcgaXMgZGV0ZWN0ZWQsIHRoZSBiYWNraW5nIHNjYWxlIGNhbiBiZSBpbmNyZWFzZWQgc28gYXMgdG9cclxuICAgICAgLy8gICAgICAgICAgICAgcHJvdmlkZSBzb21lIGFudGlhbGlhc2luZyBiZW5lZml0LiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzg1OS5cclxuICAgICAgYWxsb3dCYWNraW5nU2NhbGVBbnRpYWxpYXNpbmc6IHRydWVcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIHRoaXMuaWQgPSBnbG9iYWxJZENvdW50ZXIrKztcclxuXHJcbiAgICB0aGlzLl9hY2Nlc3NpYmxlID0gb3B0aW9ucy5hY2Nlc3NpYmlsaXR5O1xyXG4gICAgdGhpcy5fcHJlc2VydmVEcmF3aW5nQnVmZmVyID0gb3B0aW9ucy5wcmVzZXJ2ZURyYXdpbmdCdWZmZXI7XHJcbiAgICB0aGlzLl9hbGxvd1dlYkdMID0gb3B0aW9ucy5hbGxvd1dlYkdMO1xyXG4gICAgdGhpcy5fYWxsb3dDU1NIYWNrcyA9IG9wdGlvbnMuYWxsb3dDU1NIYWNrcztcclxuICAgIHRoaXMuX2FsbG93U2NlbmVPdmVyZmxvdyA9IG9wdGlvbnMuYWxsb3dTY2VuZU92ZXJmbG93O1xyXG5cclxuICAgIHRoaXMuX2RlZmF1bHRDdXJzb3IgPSBvcHRpb25zLmRlZmF1bHRDdXJzb3I7XHJcblxyXG4gICAgdGhpcy5zaXplUHJvcGVydHkgPSBuZXcgVGlueVByb3BlcnR5KCBuZXcgRGltZW5zaW9uMiggb3B0aW9ucy53aWR0aCwgb3B0aW9ucy5oZWlnaHQgKSApO1xyXG5cclxuICAgIHRoaXMuX2N1cnJlbnRTaXplID0gbmV3IERpbWVuc2lvbjIoIC0xLCAtMSApO1xyXG4gICAgdGhpcy5fcm9vdE5vZGUgPSByb290Tm9kZTtcclxuICAgIHRoaXMuX3Jvb3ROb2RlLmFkZFJvb3RlZERpc3BsYXkoIHRoaXMgKTtcclxuICAgIHRoaXMuX3Jvb3RCYWNrYm9uZSA9IG51bGw7IC8vIHRvIGJlIGZpbGxlZCBpbiBsYXRlclxyXG4gICAgdGhpcy5fZG9tRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyID9cclxuICAgICAgICAgICAgICAgICAgICAgICBCYWNrYm9uZURyYXdhYmxlLnJlcHVycG9zZUJhY2tib25lQ29udGFpbmVyKCBvcHRpb25zLmNvbnRhaW5lciApIDpcclxuICAgICAgICAgICAgICAgICAgICAgICBCYWNrYm9uZURyYXdhYmxlLmNyZWF0ZURpdkJhY2tib25lKCk7XHJcblxyXG4gICAgdGhpcy5fc2hhcmVkQ2FudmFzSW5zdGFuY2VzID0ge307XHJcbiAgICB0aGlzLl9iYXNlSW5zdGFuY2UgPSBudWxsOyAvLyB3aWxsIGJlIGZpbGxlZCB3aXRoIHRoZSByb290IEluc3RhbmNlXHJcbiAgICB0aGlzLl9mcmFtZUlkID0gMDtcclxuICAgIHRoaXMuX2RpcnR5VHJhbnNmb3JtUm9vdHMgPSBbXTtcclxuICAgIHRoaXMuX2RpcnR5VHJhbnNmb3JtUm9vdHNXaXRob3V0UGFzcyA9IFtdO1xyXG4gICAgdGhpcy5faW5zdGFuY2VSb290c1RvRGlzcG9zZSA9IFtdO1xyXG4gICAgdGhpcy5fcmVkdWNlUmVmZXJlbmNlc05lZWRlZCA9IFtdO1xyXG4gICAgdGhpcy5fZHJhd2FibGVzVG9EaXNwb3NlID0gW107XHJcbiAgICB0aGlzLl9kcmF3YWJsZXNUb0NoYW5nZUJsb2NrID0gW107XHJcbiAgICB0aGlzLl9kcmF3YWJsZXNUb1VwZGF0ZUxpbmtzID0gW107XHJcbiAgICB0aGlzLl9jaGFuZ2VJbnRlcnZhbHNUb0Rpc3Bvc2UgPSBbXTtcclxuICAgIHRoaXMuX2xhc3RDdXJzb3IgPSBudWxsO1xyXG4gICAgdGhpcy5fY3VycmVudEJhY2tncm91bmRDU1MgPSBudWxsO1xyXG4gICAgdGhpcy5fYmFja2dyb3VuZENvbG9yID0gbnVsbDtcclxuICAgIHRoaXMuX3JlcXVlc3RBbmltYXRpb25GcmFtZUlEID0gMDtcclxuICAgIHRoaXMuX2lucHV0ID0gbnVsbDtcclxuICAgIHRoaXMuX2lucHV0TGlzdGVuZXJzID0gW107XHJcbiAgICB0aGlzLl9pbnRlcmFjdGl2ZSA9IG9wdGlvbnMuaW50ZXJhY3RpdmU7XHJcbiAgICB0aGlzLl9saXN0ZW5Ub09ubHlFbGVtZW50ID0gb3B0aW9ucy5saXN0ZW5Ub09ubHlFbGVtZW50O1xyXG4gICAgdGhpcy5fYmF0Y2hET01FdmVudHMgPSBvcHRpb25zLmJhdGNoRE9NRXZlbnRzO1xyXG4gICAgdGhpcy5fYXNzdW1lRnVsbFdpbmRvdyA9IG9wdGlvbnMuYXNzdW1lRnVsbFdpbmRvdztcclxuICAgIHRoaXMuX3Bhc3NpdmVFdmVudHMgPSBvcHRpb25zLnBhc3NpdmVFdmVudHM7XHJcbiAgICB0aGlzLl9hZ2dyZXNzaXZlQ29udGV4dFJlY3JlYXRpb24gPSBvcHRpb25zLmFnZ3Jlc3NpdmVDb250ZXh0UmVjcmVhdGlvbjtcclxuICAgIHRoaXMuX2FsbG93QmFja2luZ1NjYWxlQW50aWFsaWFzaW5nID0gb3B0aW9ucy5hbGxvd0JhY2tpbmdTY2FsZUFudGlhbGlhc2luZztcclxuICAgIHRoaXMuX2FsbG93TGF5ZXJGaXR0aW5nID0gb3B0aW9ucy5hbGxvd0xheWVyRml0dGluZztcclxuICAgIHRoaXMuX2ZvcmNlU1ZHUmVmcmVzaCA9IG9wdGlvbnMuZm9yY2VTVkdSZWZyZXNoO1xyXG4gICAgdGhpcy5fb3ZlcmxheXMgPSBbXTtcclxuICAgIHRoaXMuX3BvaW50ZXJPdmVybGF5ID0gbnVsbDtcclxuICAgIHRoaXMuX3BvaW50ZXJBcmVhT3ZlcmxheSA9IG51bGw7XHJcbiAgICB0aGlzLl9oaXRBcmVhT3ZlcmxheSA9IG51bGw7XHJcbiAgICB0aGlzLl9jYW52YXNBcmVhQm91bmRzT3ZlcmxheSA9IG51bGw7XHJcbiAgICB0aGlzLl9maXR0ZWRCbG9ja0JvdW5kc092ZXJsYXkgPSBudWxsO1xyXG5cclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICB0aGlzLl9pc1BhaW50aW5nID0gZmFsc2U7XHJcbiAgICAgIHRoaXMuX2lzRGlzcG9zaW5nID0gZmFsc2U7XHJcbiAgICAgIHRoaXMuX2lzRGlzcG9zZWQgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmFwcGx5Q1NTSGFja3MoKTtcclxuXHJcbiAgICB0aGlzLnNldEJhY2tncm91bmRDb2xvciggb3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3IgKTtcclxuXHJcbiAgICBjb25zdCBhcmlhTGl2ZUFubm91bmNlciA9IG5ldyBBcmlhTGl2ZUFubm91bmNlcigpO1xyXG4gICAgdGhpcy5kZXNjcmlwdGlvblV0dGVyYW5jZVF1ZXVlID0gbmV3IFV0dGVyYW5jZVF1ZXVlKCBhcmlhTGl2ZUFubm91bmNlciwge1xyXG4gICAgICBpbml0aWFsaXplOiB0aGlzLl9hY2Nlc3NpYmxlLFxyXG4gICAgICBmZWF0dXJlU3BlY2lmaWNBbm5vdW5jaW5nQ29udHJvbFByb3BlcnR5TmFtZTogJ2Rlc2NyaXB0aW9uQ2FuQW5ub3VuY2VQcm9wZXJ0eSdcclxuICAgIH0gKTtcclxuXHJcbiAgICBpZiAoIHBsYXRmb3JtLnNhZmFyaSAmJiBvcHRpb25zLmFsbG93U2FmYXJpUmVkcmF3V29ya2Fyb3VuZCApIHtcclxuICAgICAgdGhpcy5hZGRPdmVybGF5KCBuZXcgU2FmYXJpV29ya2Fyb3VuZE92ZXJsYXkoIHRoaXMgKSApO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZm9jdXNNYW5hZ2VyID0gbmV3IEZvY3VzTWFuYWdlcigpO1xyXG5cclxuICAgIC8vIEZlYXR1cmVzIHRoYXQgcmVxdWlyZSB0aGUgSGlnaGxpZ2h0T3ZlcmxheVxyXG4gICAgaWYgKCB0aGlzLl9hY2Nlc3NpYmxlIHx8IG9wdGlvbnMuc3VwcG9ydHNJbnRlcmFjdGl2ZUhpZ2hsaWdodHMgKSB7XHJcbiAgICAgIHRoaXMuX2ZvY3VzUm9vdE5vZGUgPSBuZXcgTm9kZSgpO1xyXG4gICAgICB0aGlzLl9mb2N1c092ZXJsYXkgPSBuZXcgSGlnaGxpZ2h0T3ZlcmxheSggdGhpcywgdGhpcy5fZm9jdXNSb290Tm9kZSwge1xyXG4gICAgICAgIHBkb21Gb2N1c0hpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHk6IHRoaXMuZm9jdXNNYW5hZ2VyLnBkb21Gb2N1c0hpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHksXHJcbiAgICAgICAgaW50ZXJhY3RpdmVIaWdobGlnaHRzVmlzaWJsZVByb3BlcnR5OiB0aGlzLmZvY3VzTWFuYWdlci5pbnRlcmFjdGl2ZUhpZ2hsaWdodHNWaXNpYmxlUHJvcGVydHksXHJcbiAgICAgICAgcmVhZGluZ0Jsb2NrSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eTogdGhpcy5mb2N1c01hbmFnZXIucmVhZGluZ0Jsb2NrSGlnaGxpZ2h0c1Zpc2libGVQcm9wZXJ0eVxyXG4gICAgICB9ICk7XHJcbiAgICAgIHRoaXMuYWRkT3ZlcmxheSggdGhpcy5fZm9jdXNPdmVybGF5ICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0aGlzLl9hY2Nlc3NpYmxlICkge1xyXG4gICAgICB0aGlzLl9yb290UERPTUluc3RhbmNlID0gUERPTUluc3RhbmNlLnBvb2wuY3JlYXRlKCBudWxsLCB0aGlzLCBuZXcgVHJhaWwoKSApO1xyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUERPTUluc3RhbmNlICYmIHNjZW5lcnlMb2cuUERPTUluc3RhbmNlKFxyXG4gICAgICAgIGBEaXNwbGF5IHJvb3QgaW5zdGFuY2U6ICR7dGhpcy5fcm9vdFBET01JbnN0YW5jZS50b1N0cmluZygpfWAgKTtcclxuICAgICAgUERPTVRyZWUucmVidWlsZEluc3RhbmNlVHJlZSggdGhpcy5fcm9vdFBET01JbnN0YW5jZSApO1xyXG5cclxuICAgICAgLy8gYWRkIHRoZSBhY2Nlc3NpYmxlIERPTSBhcyBhIGNoaWxkIG9mIHRoaXMgRE9NIGVsZW1lbnRcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fcm9vdFBET01JbnN0YW5jZS5wZWVyLCAnUGVlciBzaG91bGQgYmUgY3JlYXRlZCBmcm9tIGNyZWF0ZUZyb21Qb29sJyApO1xyXG4gICAgICB0aGlzLl9kb21FbGVtZW50LmFwcGVuZENoaWxkKCB0aGlzLl9yb290UERPTUluc3RhbmNlLnBlZXIhLnByaW1hcnlTaWJsaW5nISApO1xyXG5cclxuICAgICAgY29uc3QgYXJpYUxpdmVDb250YWluZXIgPSBhcmlhTGl2ZUFubm91bmNlci5hcmlhTGl2ZUNvbnRhaW5lcjtcclxuXHJcbiAgICAgIC8vIGFkZCBhcmlhLWxpdmUgZWxlbWVudHMgdG8gdGhlIGRpc3BsYXlcclxuICAgICAgdGhpcy5fZG9tRWxlbWVudC5hcHBlbmRDaGlsZCggYXJpYUxpdmVDb250YWluZXIgKTtcclxuXHJcbiAgICAgIC8vIHNldCBgdXNlci1zZWxlY3Q6IG5vbmVgIG9uIHRoZSBhcmlhLWxpdmUgY29udGFpbmVyIHRvIHByZXZlbnQgaU9TIHRleHQgc2VsZWN0aW9uIGlzc3VlLCBzZWVcclxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzEwMDZcclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICBhcmlhTGl2ZUNvbnRhaW5lci5zdHlsZVsgRmVhdHVyZXMudXNlclNlbGVjdCBdID0gJ25vbmUnO1xyXG5cclxuICAgICAgLy8gUHJldmVudCBmb2N1cyBmcm9tIGJlaW5nIGxvc3QgaW4gRnVsbFNjcmVlbiBtb2RlLCBsaXN0ZW5lciBvbiB0aGUgZ2xvYmFsS2V5U3RhdGVUcmFja2VyXHJcbiAgICAgIC8vIGJlY2F1c2UgdGFiIG5hdmlnYXRpb24gbWF5IGhhcHBlbiBiZWZvcmUgZm9jdXMgaXMgd2l0aGluIHRoZSBQRE9NLiBTZWUgaGFuZGxlRnVsbFNjcmVlbk5hdmlnYXRpb25cclxuICAgICAgLy8gZm9yIG1vcmUuXHJcbiAgICAgIHRoaXMuX2JvdW5kSGFuZGxlRnVsbFNjcmVlbk5hdmlnYXRpb24gPSB0aGlzLmhhbmRsZUZ1bGxTY3JlZW5OYXZpZ2F0aW9uLmJpbmQoIHRoaXMgKTtcclxuICAgICAgZ2xvYmFsS2V5U3RhdGVUcmFja2VyLmtleWRvd25FbWl0dGVyLmFkZExpc3RlbmVyKCB0aGlzLl9ib3VuZEhhbmRsZUZ1bGxTY3JlZW5OYXZpZ2F0aW9uICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0RE9NRWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XHJcbiAgICByZXR1cm4gdGhpcy5fZG9tRWxlbWVudDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZG9tRWxlbWVudCgpOiBIVE1MRWxlbWVudCB7IHJldHVybiB0aGlzLmdldERPTUVsZW1lbnQoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBVcGRhdGVzIHRoZSBkaXNwbGF5J3MgRE9NIGVsZW1lbnQgd2l0aCB0aGUgY3VycmVudCB2aXN1YWwgc3RhdGUgb2YgdGhlIGF0dGFjaGVkIHJvb3Qgbm9kZSBhbmQgaXRzIGRlc2NlbmRhbnRzXHJcbiAgICovXHJcbiAgcHVibGljIHVwZGF0ZURpc3BsYXkoKTogdm9pZCB7XHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIHNjZW5lcnkgbmFtZXNwYWNlXHJcbiAgICBpZiAoIHNjZW5lcnlMb2cgJiYgc2NlbmVyeS5pc0xvZ2dpbmdQZXJmb3JtYW5jZSgpICkge1xyXG4gICAgICB0aGlzLnBlcmZTeW5jVHJlZUNvdW50ID0gMDtcclxuICAgICAgdGhpcy5wZXJmU3RpdGNoQ291bnQgPSAwO1xyXG4gICAgICB0aGlzLnBlcmZJbnRlcnZhbENvdW50ID0gMDtcclxuICAgICAgdGhpcy5wZXJmRHJhd2FibGVCbG9ja0NoYW5nZUNvdW50ID0gMDtcclxuICAgICAgdGhpcy5wZXJmRHJhd2FibGVPbGRJbnRlcnZhbENvdW50ID0gMDtcclxuICAgICAgdGhpcy5wZXJmRHJhd2FibGVOZXdJbnRlcnZhbENvdW50ID0gMDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIGFzc2VydCApIHtcclxuICAgICAgRGlzcGxheS5hc3NlcnRTdWJ0cmVlRGlzcG9zZWQoIHRoaXMuX3Jvb3ROb2RlICk7XHJcbiAgICB9XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkgJiYgc2NlbmVyeUxvZy5EaXNwbGF5KCBgdXBkYXRlRGlzcGxheSBmcmFtZSAke3RoaXMuX2ZyYW1lSWR9YCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgY29uc3QgZmlyc3RSdW4gPSAhIXRoaXMuX2Jhc2VJbnN0YW5jZTtcclxuXHJcbiAgICAvLyBjaGVjayB0byBzZWUgd2hldGhlciBjb250ZW50cyB1bmRlciBwb2ludGVycyBjaGFuZ2VkIChhbmQgaWYgc28sIHNlbmQgdGhlIGVudGVyL2V4aXQgZXZlbnRzKSB0b1xyXG4gICAgLy8gbWFpbnRhaW4gY29uc2lzdGVudCBzdGF0ZVxyXG4gICAgaWYgKCB0aGlzLl9pbnB1dCApIHtcclxuICAgICAgLy8gVE9ETzogU2hvdWxkIHRoaXMgYmUgaGFuZGxlZCBlbHNld2hlcmU/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAgIHRoaXMuX2lucHV0LnZhbGlkYXRlUG9pbnRlcnMoKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHRoaXMuX2FjY2Vzc2libGUgKSB7XHJcblxyXG4gICAgICAvLyB1cGRhdGUgcG9zaXRpb25pbmcgb2YgZm9jdXNhYmxlIHBlZXIgc2libGluZ3Mgc28gdGhleSBhcmUgZGlzY292ZXJhYmxlIG9uIG1vYmlsZSBhc3Npc3RpdmUgZGV2aWNlc1xyXG4gICAgICB0aGlzLl9yb290UERPTUluc3RhbmNlIS5wZWVyIS51cGRhdGVTdWJ0cmVlUG9zaXRpb25pbmcoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyB2YWxpZGF0ZSBib3VuZHMgZm9yIGV2ZXJ5d2hlcmUgdGhhdCBjb3VsZCB0cmlnZ2VyIGJvdW5kcyBsaXN0ZW5lcnMuIHdlIHdhbnQgdG8gZmx1c2ggb3V0IGFueSBjaGFuZ2VzLCBzbyB0aGF0IHdlIGNhbiBjYWxsIHZhbGlkYXRlQm91bmRzKClcclxuICAgIC8vIGZyb20gY29kZSBiZWxvdyB3aXRob3V0IHRyaWdnZXJpbmcgc2lkZSBlZmZlY3RzICh3ZSBhc3N1bWUgdGhhdCB3ZSBhcmUgbm90IHJlZW50cmFudCkuXHJcbiAgICB0aGlzLl9yb290Tm9kZS52YWxpZGF0ZVdhdGNoZWRCb3VuZHMoKTtcclxuXHJcbiAgICBpZiAoIGFzc2VydFNsb3cgKSB7IHRoaXMuX2FjY2Vzc2libGUgJiYgdGhpcy5fcm9vdFBET01JbnN0YW5jZSEuYXVkaXRSb290KCk7IH1cclxuXHJcbiAgICBpZiAoIGFzc2VydFNsb3cgKSB7IHRoaXMuX3Jvb3ROb2RlLl9waWNrZXIuYXVkaXQoKTsgfVxyXG5cclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgVE9ETyBJbnN0YW5jZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgdGhpcy5fYmFzZUluc3RhbmNlID0gdGhpcy5fYmFzZUluc3RhbmNlIHx8IEluc3RhbmNlLmNyZWF0ZUZyb21Qb29sKCB0aGlzLCBuZXcgVHJhaWwoIHRoaXMuX3Jvb3ROb2RlICksIHRydWUsIGZhbHNlICk7XHJcbiAgICB0aGlzLl9iYXNlSW5zdGFuY2UhLmJhc2VTeW5jVHJlZSgpO1xyXG4gICAgaWYgKCBmaXJzdFJ1biApIHtcclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBUT0RPIGluc3RhbmNlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAgIHRoaXMubWFya1RyYW5zZm9ybVJvb3REaXJ0eSggdGhpcy5fYmFzZUluc3RhbmNlISwgdGhpcy5fYmFzZUluc3RhbmNlIS5pc1RyYW5zZm9ybWVkICk7IC8vIG1hcmtzIHRoZSB0cmFuc2Zvcm0gcm9vdCBhcyBkaXJ0eSAoc2luY2UgaXQgaXMpXHJcbiAgICB9XHJcblxyXG4gICAgLy8gdXBkYXRlIG91ciBkcmF3YWJsZSdzIGxpbmtlZCBsaXN0cyB3aGVyZSBuZWNlc3NhcnlcclxuICAgIHdoaWxlICggdGhpcy5fZHJhd2FibGVzVG9VcGRhdGVMaW5rcy5sZW5ndGggKSB7XHJcbiAgICAgIHRoaXMuX2RyYXdhYmxlc1RvVXBkYXRlTGlua3MucG9wKCkhLnVwZGF0ZUxpbmtzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY2xlYW4gY2hhbmdlLWludGVydmFsIGluZm9ybWF0aW9uIGZyb20gaW5zdGFuY2VzLCBzbyB3ZSBkb24ndCBsZWFrIG1lbW9yeS9yZWZlcmVuY2VzXHJcbiAgICB3aGlsZSAoIHRoaXMuX2NoYW5nZUludGVydmFsc1RvRGlzcG9zZS5sZW5ndGggKSB7XHJcbiAgICAgIHRoaXMuX2NoYW5nZUludGVydmFsc1RvRGlzcG9zZS5wb3AoKSEuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX3Jvb3RCYWNrYm9uZSA9IHRoaXMuX3Jvb3RCYWNrYm9uZSB8fCB0aGlzLl9iYXNlSW5zdGFuY2UhLmdyb3VwRHJhd2FibGU7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9yb290QmFja2JvbmUsICdXZSBhcmUgZ3VhcmFudGVlZCBhIHJvb3QgYmFja2JvbmUgYXMgdGhlIGdyb3VwRHJhd2FibGUgb24gdGhlIGJhc2UgaW5zdGFuY2UnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9yb290QmFja2JvbmUgPT09IHRoaXMuX2Jhc2VJbnN0YW5jZSEuZ3JvdXBEcmF3YWJsZSwgJ1dlIGRvblxcJ3Qgd2FudCB0aGUgYmFzZSBpbnN0YW5jZVxcJ3MgZ3JvdXBEcmF3YWJsZSB0byBjaGFuZ2UnICk7XHJcblxyXG5cclxuICAgIGlmICggYXNzZXJ0U2xvdyApIHsgdGhpcy5fcm9vdEJhY2tib25lIS5hdWRpdCggdHJ1ZSwgZmFsc2UsIHRydWUgKTsgfSAvLyBhbGxvdyBwZW5kaW5nIGJsb2NrcyAvIGRpcnR5XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkgJiYgc2NlbmVyeUxvZy5EaXNwbGF5KCAnZHJhd2FibGUgYmxvY2sgY2hhbmdlIHBoYXNlJyApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcbiAgICB3aGlsZSAoIHRoaXMuX2RyYXdhYmxlc1RvQ2hhbmdlQmxvY2subGVuZ3RoICkge1xyXG4gICAgICBjb25zdCBjaGFuZ2VkID0gdGhpcy5fZHJhd2FibGVzVG9DaGFuZ2VCbG9jay5wb3AoKSEudXBkYXRlQmxvY2soKTtcclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBzY2VuZXJ5IG5hbWVzcGFjZVxyXG4gICAgICBpZiAoIHNjZW5lcnlMb2cgJiYgc2NlbmVyeS5pc0xvZ2dpbmdQZXJmb3JtYW5jZSgpICYmIGNoYW5nZWQgKSB7XHJcbiAgICAgICAgdGhpcy5wZXJmRHJhd2FibGVCbG9ja0NoYW5nZUNvdW50ISsrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuRGlzcGxheSAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG5cclxuICAgIGlmICggYXNzZXJ0U2xvdyApIHsgdGhpcy5fcm9vdEJhY2tib25lIS5hdWRpdCggZmFsc2UsIGZhbHNlLCB0cnVlICk7IH0gLy8gYWxsb3cgb25seSBkaXJ0eVxyXG4gICAgaWYgKCBhc3NlcnRTbG93ICkgeyB0aGlzLl9iYXNlSW5zdGFuY2UhLmF1ZGl0KCB0aGlzLl9mcmFtZUlkLCBmYWxzZSApOyB9XHJcblxyXG4gICAgLy8gcHJlLXJlcGFpbnQgcGhhc2U6IHVwZGF0ZSByZWxhdGl2ZSB0cmFuc2Zvcm0gaW5mb3JtYXRpb24gZm9yIGxpc3RlbmVycyAobm90aWZpY2F0aW9uKSBhbmQgcHJlY29tcHV0YXRpb24gd2hlcmUgZGVzaXJlZFxyXG4gICAgdGhpcy51cGRhdGVEaXJ0eVRyYW5zZm9ybVJvb3RzKCk7XHJcbiAgICAvLyBwcmUtcmVwYWludCBwaGFzZSB1cGRhdGUgdmlzaWJpbGl0eSBpbmZvcm1hdGlvbiBvbiBpbnN0YW5jZXNcclxuICAgIHRoaXMuX2Jhc2VJbnN0YW5jZSEudXBkYXRlVmlzaWJpbGl0eSggdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgZmFsc2UgKTtcclxuICAgIGlmICggYXNzZXJ0U2xvdyApIHsgdGhpcy5fYmFzZUluc3RhbmNlIS5hdWRpdFZpc2liaWxpdHkoIHRydWUgKTsgfVxyXG5cclxuICAgIGlmICggYXNzZXJ0U2xvdyApIHsgdGhpcy5fYmFzZUluc3RhbmNlIS5hdWRpdCggdGhpcy5fZnJhbWVJZCwgdHJ1ZSApOyB9XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkgJiYgc2NlbmVyeUxvZy5EaXNwbGF5KCAnaW5zdGFuY2Ugcm9vdCBkaXNwb3NhbCBwaGFzZScgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5EaXNwbGF5ICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG4gICAgLy8gZGlzcG9zZSBhbGwgb2Ygb3VyIGluc3RhbmNlcy4gZGlzcG9zaW5nIHRoZSByb290IHdpbGwgY2F1c2UgYWxsIGRlc2NlbmRhbnRzIHRvIGFsc28gYmUgZGlzcG9zZWQuXHJcbiAgICAvLyB3aWxsIGFsc28gZGlzcG9zZSBhdHRhY2hlZCBkcmF3YWJsZXMgKHNlbGYvZ3JvdXAvZXRjLilcclxuICAgIHdoaWxlICggdGhpcy5faW5zdGFuY2VSb290c1RvRGlzcG9zZS5sZW5ndGggKSB7XHJcbiAgICAgIHRoaXMuX2luc3RhbmNlUm9vdHNUb0Rpc3Bvc2UucG9wKCkhLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5EaXNwbGF5ICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcblxyXG4gICAgaWYgKCBhc3NlcnRTbG93ICkgeyB0aGlzLl9yb290Tm9kZS5hdWRpdEluc3RhbmNlU3VidHJlZUZvckRpc3BsYXkoIHRoaXMgKTsgfSAvLyBtYWtlIHN1cmUgdHJhaWxzIGFyZSB2YWxpZFxyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5EaXNwbGF5ICYmIHNjZW5lcnlMb2cuRGlzcGxheSggJ2RyYXdhYmxlIGRpc3Bvc2FsIHBoYXNlJyApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcbiAgICAvLyBkaXNwb3NlIGFsbCBvZiBvdXIgb3RoZXIgZHJhd2FibGVzLlxyXG4gICAgd2hpbGUgKCB0aGlzLl9kcmF3YWJsZXNUb0Rpc3Bvc2UubGVuZ3RoICkge1xyXG4gICAgICB0aGlzLl9kcmF3YWJsZXNUb0Rpc3Bvc2UucG9wKCkhLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5EaXNwbGF5ICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcblxyXG4gICAgaWYgKCBhc3NlcnRTbG93ICkgeyB0aGlzLl9iYXNlSW5zdGFuY2UhLmF1ZGl0KCB0aGlzLl9mcmFtZUlkLCBmYWxzZSApOyB9XHJcblxyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgIGFzc2VydCggIXRoaXMuX2lzUGFpbnRpbmcsICdEaXNwbGF5IHdhcyBhbHJlYWR5IHVwZGF0aW5nIHBhaW50LCBtYXkgaGF2ZSB0aHJvd24gYW4gZXJyb3Igb24gdGhlIGxhc3QgdXBkYXRlJyApO1xyXG4gICAgICB0aGlzLl9pc1BhaW50aW5nID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyByZXBhaW50IHBoYXNlXHJcbiAgICAvL09IVFdPIFRPRE86IGNhbiBhbnl0aGluZyBiZSB1cGRhdGVkIG1vcmUgZWZmaWNpZW50bHkgYnkgdHJhY2tpbmcgYXQgdGhlIERpc3BsYXkgbGV2ZWw/IFJlbWVtYmVyLCB3ZSBoYXZlIHJlY3Vyc2l2ZSB1cGRhdGVzIHNvIHRoaW5ncyBnZXQgdXBkYXRlZCBpbiB0aGUgcmlnaHQgb3JkZXIhIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuRGlzcGxheSAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkoICdyZXBhaW50IHBoYXNlJyApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcbiAgICB0aGlzLl9yb290QmFja2JvbmUhLnVwZGF0ZSgpO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuXHJcbiAgICBpZiAoIGFzc2VydCApIHtcclxuICAgICAgdGhpcy5faXNQYWludGluZyA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggYXNzZXJ0U2xvdyApIHsgdGhpcy5fcm9vdEJhY2tib25lIS5hdWRpdCggZmFsc2UsIGZhbHNlLCBmYWxzZSApOyB9IC8vIGFsbG93IG5vdGhpbmdcclxuICAgIGlmICggYXNzZXJ0U2xvdyApIHsgdGhpcy5fYmFzZUluc3RhbmNlIS5hdWRpdCggdGhpcy5fZnJhbWVJZCwgZmFsc2UgKTsgfVxyXG5cclxuICAgIHRoaXMudXBkYXRlQ3Vyc29yKCk7XHJcbiAgICB0aGlzLnVwZGF0ZUJhY2tncm91bmRDb2xvcigpO1xyXG5cclxuICAgIHRoaXMudXBkYXRlU2l6ZSgpO1xyXG5cclxuICAgIGlmICggdGhpcy5fb3ZlcmxheXMubGVuZ3RoICkge1xyXG4gICAgICBsZXQgekluZGV4ID0gdGhpcy5fcm9vdEJhY2tib25lIS5sYXN0WkluZGV4ITtcclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5fb3ZlcmxheXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgLy8gbGF5ZXIgdGhlIG92ZXJsYXlzIHByb3Blcmx5XHJcbiAgICAgICAgY29uc3Qgb3ZlcmxheSA9IHRoaXMuX292ZXJsYXlzWyBpIF07XHJcbiAgICAgICAgb3ZlcmxheS5kb21FbGVtZW50LnN0eWxlLnpJbmRleCA9ICcnICsgKCB6SW5kZXgrKyApO1xyXG5cclxuICAgICAgICBvdmVybGF5LnVwZGF0ZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWZ0ZXIgb3VyIHVwZGF0ZSBhbmQgZGlzcG9zYWxzLCB3ZSB3YW50IHRvIGVsaW1pbmF0ZSBhbnkgbWVtb3J5IGxlYWtzIGZyb20gYW55dGhpbmcgdGhhdCB3YXNuJ3QgdXBkYXRlZC5cclxuICAgIHdoaWxlICggdGhpcy5fcmVkdWNlUmVmZXJlbmNlc05lZWRlZC5sZW5ndGggKSB7XHJcbiAgICAgIHRoaXMuX3JlZHVjZVJlZmVyZW5jZXNOZWVkZWQucG9wKCkhLnJlZHVjZVJlZmVyZW5jZXMoKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9mcmFtZUlkKys7XHJcblxyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciBUT0RPIHNjZW5lcnkgbmFtZXNwYWNlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICBpZiAoIHNjZW5lcnlMb2cgJiYgc2NlbmVyeS5pc0xvZ2dpbmdQZXJmb3JtYW5jZSgpICkge1xyXG4gICAgICBjb25zdCBzeW5jVHJlZU1lc3NhZ2UgPSBgc3luY1RyZWUgY291bnQ6ICR7dGhpcy5wZXJmU3luY1RyZWVDb3VudH1gO1xyXG4gICAgICBpZiAoIHRoaXMucGVyZlN5bmNUcmVlQ291bnQhID4gNTAwICkge1xyXG4gICAgICAgIHNjZW5lcnlMb2cuUGVyZkNyaXRpY2FsICYmIHNjZW5lcnlMb2cuUGVyZkNyaXRpY2FsKCBzeW5jVHJlZU1lc3NhZ2UgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggdGhpcy5wZXJmU3luY1RyZWVDb3VudCEgPiAxMDAgKSB7XHJcbiAgICAgICAgc2NlbmVyeUxvZy5QZXJmTWFqb3IgJiYgc2NlbmVyeUxvZy5QZXJmTWFqb3IoIHN5bmNUcmVlTWVzc2FnZSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCB0aGlzLnBlcmZTeW5jVHJlZUNvdW50ISA+IDIwICkge1xyXG4gICAgICAgIHNjZW5lcnlMb2cuUGVyZk1pbm9yICYmIHNjZW5lcnlMb2cuUGVyZk1pbm9yKCBzeW5jVHJlZU1lc3NhZ2UgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggdGhpcy5wZXJmU3luY1RyZWVDb3VudCEgPiAwICkge1xyXG4gICAgICAgIHNjZW5lcnlMb2cuUGVyZlZlcmJvc2UgJiYgc2NlbmVyeUxvZy5QZXJmVmVyYm9zZSggc3luY1RyZWVNZXNzYWdlICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGRyYXdhYmxlQmxvY2tDb3VudE1lc3NhZ2UgPSBgZHJhd2FibGUgYmxvY2sgY2hhbmdlczogJHt0aGlzLnBlcmZEcmF3YWJsZUJsb2NrQ2hhbmdlQ291bnR9IGZvcmAgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYCAtJHt0aGlzLnBlcmZEcmF3YWJsZU9sZEludGVydmFsQ291bnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gKyR7dGhpcy5wZXJmRHJhd2FibGVOZXdJbnRlcnZhbENvdW50fWA7XHJcbiAgICAgIGlmICggdGhpcy5wZXJmRHJhd2FibGVCbG9ja0NoYW5nZUNvdW50ISA+IDIwMCApIHtcclxuICAgICAgICBzY2VuZXJ5TG9nLlBlcmZDcml0aWNhbCAmJiBzY2VuZXJ5TG9nLlBlcmZDcml0aWNhbCggZHJhd2FibGVCbG9ja0NvdW50TWVzc2FnZSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCB0aGlzLnBlcmZEcmF3YWJsZUJsb2NrQ2hhbmdlQ291bnQhID4gNjAgKSB7XHJcbiAgICAgICAgc2NlbmVyeUxvZy5QZXJmTWFqb3IgJiYgc2NlbmVyeUxvZy5QZXJmTWFqb3IoIGRyYXdhYmxlQmxvY2tDb3VudE1lc3NhZ2UgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggdGhpcy5wZXJmRHJhd2FibGVCbG9ja0NoYW5nZUNvdW50ISA+IDEwICkge1xyXG4gICAgICAgIHNjZW5lcnlMb2cuUGVyZk1pbm9yICYmIHNjZW5lcnlMb2cuUGVyZk1pbm9yKCBkcmF3YWJsZUJsb2NrQ291bnRNZXNzYWdlICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIHRoaXMucGVyZkRyYXdhYmxlQmxvY2tDaGFuZ2VDb3VudCEgPiAwICkge1xyXG4gICAgICAgIHNjZW5lcnlMb2cuUGVyZlZlcmJvc2UgJiYgc2NlbmVyeUxvZy5QZXJmVmVyYm9zZSggZHJhd2FibGVCbG9ja0NvdW50TWVzc2FnZSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgUERPTVRyZWUuYXVkaXRQRE9NRGlzcGxheXMoIHRoaXMucm9vdE5vZGUgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX2ZvcmNlU1ZHUmVmcmVzaCB8fCB0aGlzLl9yZWZyZXNoU1ZHUGVuZGluZyApIHtcclxuICAgICAgdGhpcy5fcmVmcmVzaFNWR1BlbmRpbmcgPSBmYWxzZTtcclxuXHJcbiAgICAgIHRoaXMucmVmcmVzaFNWRygpO1xyXG4gICAgfVxyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5EaXNwbGF5ICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvLyBVc2VkIGZvciBTdHVkaW8gQXV0b3NlbGVjdCB0byBkZXRlcm1pbmUgdGhlIGxlYWZpZXN0IFBoRVQtaU8gRWxlbWVudCB1bmRlciB0aGUgbW91c2VcclxuICBwdWJsaWMgZ2V0UGhldGlvRWxlbWVudEF0KCBwb2ludDogVmVjdG9yMiApOiBQaGV0aW9PYmplY3QgfCBudWxsIHtcclxuICAgIGNvbnN0IG5vZGUgPSB0aGlzLl9yb290Tm9kZS5nZXRQaGV0aW9Nb3VzZUhpdCggcG9pbnQgKTtcclxuXHJcbiAgICBpZiAoIG5vZGUgPT09ICdwaGV0aW9Ob3RTZWxlY3RhYmxlJyApIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBub2RlICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBub2RlLmlzUGhldGlvSW5zdHJ1bWVudGVkKCksICdhIFBoZXRpb01vdXNlSGl0IHNob3VsZCBiZSBpbnN0cnVtZW50ZWQnICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbm9kZTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgdXBkYXRlU2l6ZSgpOiB2b2lkIHtcclxuICAgIGxldCBzaXplRGlydHkgPSBmYWxzZTtcclxuICAgIC8vT0hUV08gVE9ETzogaWYgd2UgYXJlbid0IGNsaXBwaW5nIG9yIHNldHRpbmcgYmFja2dyb3VuZCBjb2xvcnMsIGNhbiB3ZSBnZXQgYXdheSB3aXRoIGhhdmluZyBhIDB4MCBjb250YWluZXIgZGl2IGFuZCB1c2luZyBhYnNvbHV0ZWx5LXBvc2l0aW9uZWQgY2hpbGRyZW4/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICBpZiAoIHRoaXMuc2l6ZS53aWR0aCAhPT0gdGhpcy5fY3VycmVudFNpemUud2lkdGggKSB7XHJcbiAgICAgIHNpemVEaXJ0eSA9IHRydWU7XHJcbiAgICAgIHRoaXMuX2N1cnJlbnRTaXplLndpZHRoID0gdGhpcy5zaXplLndpZHRoO1xyXG4gICAgICB0aGlzLl9kb21FbGVtZW50LnN0eWxlLndpZHRoID0gYCR7dGhpcy5zaXplLndpZHRofXB4YDtcclxuICAgIH1cclxuICAgIGlmICggdGhpcy5zaXplLmhlaWdodCAhPT0gdGhpcy5fY3VycmVudFNpemUuaGVpZ2h0ICkge1xyXG4gICAgICBzaXplRGlydHkgPSB0cnVlO1xyXG4gICAgICB0aGlzLl9jdXJyZW50U2l6ZS5oZWlnaHQgPSB0aGlzLnNpemUuaGVpZ2h0O1xyXG4gICAgICB0aGlzLl9kb21FbGVtZW50LnN0eWxlLmhlaWdodCA9IGAke3RoaXMuc2l6ZS5oZWlnaHR9cHhgO1xyXG4gICAgfVxyXG4gICAgaWYgKCBzaXplRGlydHkgJiYgIXRoaXMuX2FsbG93U2NlbmVPdmVyZmxvdyApIHtcclxuICAgICAgLy8gdG8gcHJldmVudCBvdmVyZmxvdywgd2UgYWRkIGEgQ1NTIGNsaXBcclxuICAgICAgLy9UT0RPOiAwcHggPT4gMD8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgdGhpcy5fZG9tRWxlbWVudC5zdHlsZS5jbGlwID0gYHJlY3QoMHB4LCR7dGhpcy5zaXplLndpZHRofXB4LCR7dGhpcy5zaXplLmhlaWdodH1weCwwcHgpYDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZXRoZXIgV2ViR0wgaXMgYWxsb3dlZCB0byBiZSB1c2VkIGluIGRyYXdhYmxlcyBmb3IgdGhpcyBEaXNwbGF5XHJcbiAgICovXHJcbiAgcHVibGljIGlzV2ViR0xBbGxvd2VkKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2FsbG93V2ViR0w7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHdlYmdsQWxsb3dlZCgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuaXNXZWJHTEFsbG93ZWQoKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0Um9vdE5vZGUoKTogTm9kZSB7XHJcbiAgICByZXR1cm4gdGhpcy5fcm9vdE5vZGU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHJvb3ROb2RlKCk6IE5vZGUgeyByZXR1cm4gdGhpcy5nZXRSb290Tm9kZSgpOyB9XHJcblxyXG4gIHB1YmxpYyBnZXRSb290QmFja2JvbmUoKTogQmFja2JvbmVEcmF3YWJsZSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9yb290QmFja2JvbmUgKTtcclxuICAgIHJldHVybiB0aGlzLl9yb290QmFja2JvbmUhO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCByb290QmFja2JvbmUoKTogQmFja2JvbmVEcmF3YWJsZSB7IHJldHVybiB0aGlzLmdldFJvb3RCYWNrYm9uZSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBkaW1lbnNpb25zIG9mIHRoZSBEaXNwbGF5J3MgRE9NIGVsZW1lbnRcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0U2l6ZSgpOiBEaW1lbnNpb24yIHtcclxuICAgIHJldHVybiB0aGlzLnNpemVQcm9wZXJ0eS52YWx1ZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgc2l6ZSgpOiBEaW1lbnNpb24yIHsgcmV0dXJuIHRoaXMuZ2V0U2l6ZSgpOyB9XHJcblxyXG4gIHB1YmxpYyBnZXRCb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5zaXplLnRvQm91bmRzKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGJvdW5kcygpOiBCb3VuZHMyIHsgcmV0dXJuIHRoaXMuZ2V0Qm91bmRzKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2hhbmdlcyB0aGUgc2l6ZSB0aGF0IHRoZSBEaXNwbGF5J3MgRE9NIGVsZW1lbnQgd2lsbCBiZSBhZnRlciB0aGUgbmV4dCB1cGRhdGVEaXNwbGF5KClcclxuICAgKi9cclxuICBwdWJsaWMgc2V0U2l6ZSggc2l6ZTogRGltZW5zaW9uMiApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHNpemUud2lkdGggJSAxID09PSAwLCAnRGlzcGxheS53aWR0aCBzaG91bGQgYmUgYW4gaW50ZWdlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHNpemUud2lkdGggPiAwLCAnRGlzcGxheS53aWR0aCBzaG91bGQgYmUgZ3JlYXRlciB0aGFuIHplcm8nICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBzaXplLmhlaWdodCAlIDEgPT09IDAsICdEaXNwbGF5LmhlaWdodCBzaG91bGQgYmUgYW4gaW50ZWdlcicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHNpemUuaGVpZ2h0ID4gMCwgJ0Rpc3BsYXkuaGVpZ2h0IHNob3VsZCBiZSBncmVhdGVyIHRoYW4gemVybycgKTtcclxuXHJcbiAgICB0aGlzLnNpemVQcm9wZXJ0eS52YWx1ZSA9IHNpemU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDaGFuZ2VzIHRoZSBzaXplIHRoYXQgdGhlIERpc3BsYXkncyBET00gZWxlbWVudCB3aWxsIGJlIGFmdGVyIHRoZSBuZXh0IHVwZGF0ZURpc3BsYXkoKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRXaWR0aEhlaWdodCggd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICB0aGlzLnNldFNpemUoIG5ldyBEaW1lbnNpb24yKCB3aWR0aCwgaGVpZ2h0ICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSB3aWR0aCBvZiB0aGUgRGlzcGxheSdzIERPTSBlbGVtZW50XHJcbiAgICovXHJcbiAgcHVibGljIGdldFdpZHRoKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5zaXplLndpZHRoO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCB3aWR0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRXaWR0aCgpOyB9XHJcblxyXG4gIHB1YmxpYyBzZXQgd2lkdGgoIHZhbHVlOiBudW1iZXIgKSB7IHRoaXMuc2V0V2lkdGgoIHZhbHVlICk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgd2lkdGggdGhhdCB0aGUgRGlzcGxheSdzIERPTSBlbGVtZW50IHdpbGwgYmUgYWZ0ZXIgdGhlIG5leHQgdXBkYXRlRGlzcGxheSgpLiBTaG91bGQgYmUgYW4gaW50ZWdyYWwgdmFsdWUuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFdpZHRoKCB3aWR0aDogbnVtYmVyICk6IHRoaXMge1xyXG5cclxuICAgIGlmICggdGhpcy5nZXRXaWR0aCgpICE9PSB3aWR0aCApIHtcclxuICAgICAgdGhpcy5zZXRTaXplKCBuZXcgRGltZW5zaW9uMiggd2lkdGgsIHRoaXMuZ2V0SGVpZ2h0KCkgKSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGhlaWdodCBvZiB0aGUgRGlzcGxheSdzIERPTSBlbGVtZW50XHJcbiAgICovXHJcbiAgcHVibGljIGdldEhlaWdodCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuc2l6ZS5oZWlnaHQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGhlaWdodCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRIZWlnaHQoKTsgfVxyXG5cclxuICBwdWJsaWMgc2V0IGhlaWdodCggdmFsdWU6IG51bWJlciApIHsgdGhpcy5zZXRIZWlnaHQoIHZhbHVlICk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgaGVpZ2h0IHRoYXQgdGhlIERpc3BsYXkncyBET00gZWxlbWVudCB3aWxsIGJlIGFmdGVyIHRoZSBuZXh0IHVwZGF0ZURpc3BsYXkoKS4gU2hvdWxkIGJlIGFuIGludGVncmFsIHZhbHVlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRIZWlnaHQoIGhlaWdodDogbnVtYmVyICk6IHRoaXMge1xyXG5cclxuICAgIGlmICggdGhpcy5nZXRIZWlnaHQoKSAhPT0gaGVpZ2h0ICkge1xyXG4gICAgICB0aGlzLnNldFNpemUoIG5ldyBEaW1lbnNpb24yKCB0aGlzLmdldFdpZHRoKCksIGhlaWdodCApICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaWxsIGJlIGFwcGxpZWQgdG8gdGhlIHJvb3QgRE9NIGVsZW1lbnQgb24gdXBkYXRlRGlzcGxheSgpLCBhbmQgbm8gc29vbmVyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRCYWNrZ3JvdW5kQ29sb3IoIGNvbG9yOiBDb2xvciB8IHN0cmluZyB8IG51bGwgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBjb2xvciA9PT0gbnVsbCB8fCB0eXBlb2YgY29sb3IgPT09ICdzdHJpbmcnIHx8IGNvbG9yIGluc3RhbmNlb2YgQ29sb3IgKTtcclxuXHJcbiAgICB0aGlzLl9iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvcjtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgYmFja2dyb3VuZENvbG9yKCB2YWx1ZTogQ29sb3IgfCBzdHJpbmcgfCBudWxsICkgeyB0aGlzLnNldEJhY2tncm91bmRDb2xvciggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGJhY2tncm91bmRDb2xvcigpOiBDb2xvciB8IHN0cmluZyB8IG51bGwgeyByZXR1cm4gdGhpcy5nZXRCYWNrZ3JvdW5kQ29sb3IoKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0QmFja2dyb3VuZENvbG9yKCk6IENvbG9yIHwgc3RyaW5nIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5fYmFja2dyb3VuZENvbG9yO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBpbnRlcmFjdGl2ZSgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX2ludGVyYWN0aXZlOyB9XHJcblxyXG4gIHB1YmxpYyBzZXQgaW50ZXJhY3RpdmUoIHZhbHVlOiBib29sZWFuICkge1xyXG4gICAgaWYgKCB0aGlzLl9hY2Nlc3NpYmxlICYmIHZhbHVlICE9PSB0aGlzLl9pbnRlcmFjdGl2ZSApIHtcclxuICAgICAgdGhpcy5fcm9vdFBET01JbnN0YW5jZSEucGVlciEucmVjdXJzaXZlRGlzYWJsZSggIXZhbHVlICk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5faW50ZXJhY3RpdmUgPSB2YWx1ZTtcclxuICAgIGlmICggIXRoaXMuX2ludGVyYWN0aXZlICYmIHRoaXMuX2lucHV0ICkge1xyXG4gICAgICB0aGlzLl9pbnB1dC5pbnRlcnJ1cHRQb2ludGVycygpO1xyXG4gICAgICB0aGlzLl9pbnB1dC5jbGVhckJhdGNoZWRFdmVudHMoKTtcclxuICAgICAgdGhpcy5faW5wdXQucmVtb3ZlVGVtcG9yYXJ5UG9pbnRlcnMoKTtcclxuICAgICAgdGhpcy5fcm9vdE5vZGUuaW50ZXJydXB0U3VidHJlZUlucHV0KCk7XHJcbiAgICAgIHRoaXMuaW50ZXJydXB0SW5wdXQoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYW4gb3ZlcmxheSB0byB0aGUgRGlzcGxheS4gRWFjaCBvdmVybGF5IHNob3VsZCBoYXZlIGEgLmRvbUVsZW1lbnQgKHRoZSBET00gZWxlbWVudCB0aGF0IHdpbGwgYmUgdXNlZCBmb3JcclxuICAgKiBkaXNwbGF5KSBhbmQgYW4gLnVwZGF0ZSgpIG1ldGhvZC5cclxuICAgKi9cclxuICBwdWJsaWMgYWRkT3ZlcmxheSggb3ZlcmxheTogVE92ZXJsYXkgKTogdm9pZCB7XHJcbiAgICB0aGlzLl9vdmVybGF5cy5wdXNoKCBvdmVybGF5ICk7XHJcbiAgICB0aGlzLl9kb21FbGVtZW50LmFwcGVuZENoaWxkKCBvdmVybGF5LmRvbUVsZW1lbnQgKTtcclxuXHJcbiAgICAvLyBlbnN1cmUgdGhhdCB0aGUgb3ZlcmxheSBpcyBoaWRkZW4gZnJvbSBzY3JlZW4gcmVhZGVycywgYWxsIGFjY2Vzc2libGUgY29udGVudCBzaG91bGQgYmUgaW4gdGhlIGRvbSBlbGVtZW50XHJcbiAgICAvLyBvZiB0aGUgdGhpcy5fcm9vdFBET01JbnN0YW5jZVxyXG4gICAgb3ZlcmxheS5kb21FbGVtZW50LnNldEF0dHJpYnV0ZSggJ2FyaWEtaGlkZGVuJywgJ3RydWUnICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmVzIGFuIG92ZXJsYXkgZnJvbSB0aGUgZGlzcGxheS5cclxuICAgKi9cclxuICBwdWJsaWMgcmVtb3ZlT3ZlcmxheSggb3ZlcmxheTogVE92ZXJsYXkgKTogdm9pZCB7XHJcbiAgICB0aGlzLl9kb21FbGVtZW50LnJlbW92ZUNoaWxkKCBvdmVybGF5LmRvbUVsZW1lbnQgKTtcclxuICAgIHRoaXMuX292ZXJsYXlzLnNwbGljZSggXy5pbmRleE9mKCB0aGlzLl9vdmVybGF5cywgb3ZlcmxheSApLCAxICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIHJvb3QgYWNjZXNzaWJsZSBET00gZWxlbWVudCB3aGljaCByZXByZXNlbnRzIHRoaXMgZGlzcGxheSBhbmQgcHJvdmlkZXMgc2VtYW50aWNzIGZvciBhc3Npc3RpdmVcclxuICAgKiB0ZWNobm9sb2d5LiBJZiB0aGlzIERpc3BsYXkgaXMgbm90IGFjY2Vzc2libGUsIHJldHVybnMgbnVsbC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0UERPTVJvb3RFbGVtZW50KCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5fYWNjZXNzaWJsZSA/IHRoaXMuX3Jvb3RQRE9NSW5zdGFuY2UhLnBlZXIhLnByaW1hcnlTaWJsaW5nIDogbnVsbDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcGRvbVJvb3RFbGVtZW50KCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7IHJldHVybiB0aGlzLmdldFBET01Sb290RWxlbWVudCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhcyB0aGlzIERpc3BsYXkgZW5hYmxlZCBhY2Nlc3NpYmlsaXR5IGZlYXR1cmVzIGxpa2UgUERPTSBjcmVhdGlvbiBhbmQgc3VwcG9ydC5cclxuICAgKi9cclxuICBwdWJsaWMgaXNBY2Nlc3NpYmxlKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2FjY2Vzc2libGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIGVsZW1lbnQgaXMgaW4gdGhlIFBET00uIFRoYXQgaXMgb25seSBwb3NzaWJsZSBpZiB0aGUgZGlzcGxheSBpcyBhY2Nlc3NpYmxlLlxyXG4gICAqIEBwYXJhbSBlbGVtZW50XHJcbiAgICogQHBhcmFtIGFsbG93Um9vdCAtIElmIHRydWUsIHRoZSByb290IG9mIHRoZSBQRE9NIGlzIGFsc28gY29uc2lkZXJlZCB0byBiZSBcInVuZGVyXCIgdGhlIFBET00uXHJcbiAgICovXHJcbiAgcHVibGljIGlzRWxlbWVudFVuZGVyUERPTSggZWxlbWVudDogRWxlbWVudCwgYWxsb3dSb290OiBib29sZWFuICk6IGJvb2xlYW4ge1xyXG4gICAgaWYgKCAhdGhpcy5fYWNjZXNzaWJsZSApIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGlzRWxlbWVudENvbnRhaW5lZCA9IHRoaXMucGRvbVJvb3RFbGVtZW50IS5jb250YWlucyggZWxlbWVudCApO1xyXG4gICAgY29uc3QgaXNOb3RSb290RWxlbWVudCA9IGVsZW1lbnQgIT09IHRoaXMucGRvbVJvb3RFbGVtZW50O1xyXG5cclxuICAgIC8vIElmIGFsbG93Um9vdCBpcyB0cnVlLCBqdXN0IHJldHVybiBpZiB0aGUgZWxlbWVudCBpcyBjb250YWluZWQuXHJcbiAgICAvLyBPdGhlcndpc2UsIGFsc28gZW5zdXJlIGl0J3Mgbm90IHRoZSByb290IGVsZW1lbnQgaXRzZWxmLlxyXG4gICAgcmV0dXJuIGFsbG93Um9vdCA/IGlzRWxlbWVudENvbnRhaW5lZCA6ICggaXNFbGVtZW50Q29udGFpbmVkICYmIGlzTm90Um9vdEVsZW1lbnQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEltcGxlbWVudHMgYSB3b3JrYXJvdW5kIHRoYXQgcHJldmVudHMgRE9NIGZvY3VzIGZyb20gbGVhdmluZyB0aGUgRGlzcGxheSBpbiBGdWxsU2NyZWVuIG1vZGUuIFRoZXJlIGlzXHJcbiAgICogYSBidWcgaW4gc29tZSBicm93c2VycyB3aGVyZSBET00gZm9jdXMgY2FuIGJlIHBlcm1hbmVudGx5IGxvc3QgaWYgdGFiYmluZyBvdXQgb2YgdGhlIEZ1bGxTY3JlZW4gZWxlbWVudCxcclxuICAgKiBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzg4My5cclxuICAgKi9cclxuICBwcml2YXRlIGhhbmRsZUZ1bGxTY3JlZW5OYXZpZ2F0aW9uKCBkb21FdmVudDogS2V5Ym9hcmRFdmVudCApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMucGRvbVJvb3RFbGVtZW50LCAnVGhlcmUgbXVzdCBiZSBhIFBET00gdG8gc3VwcG9ydCBrZXlib2FyZCBuYXZpZ2F0aW9uJyApO1xyXG5cclxuICAgIGlmICggRnVsbFNjcmVlbi5pc0Z1bGxTY3JlZW4oKSAmJiBLZXlib2FyZFV0aWxzLmlzS2V5RXZlbnQoIGRvbUV2ZW50LCBLZXlib2FyZFV0aWxzLktFWV9UQUIgKSApIHtcclxuICAgICAgY29uc3Qgcm9vdEVsZW1lbnQgPSB0aGlzLnBkb21Sb290RWxlbWVudDtcclxuICAgICAgY29uc3QgbmV4dEVsZW1lbnQgPSBkb21FdmVudC5zaGlmdEtleSA/IFBET01VdGlscy5nZXRQcmV2aW91c0ZvY3VzYWJsZSggcm9vdEVsZW1lbnQgfHwgdW5kZWZpbmVkICkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFBET01VdGlscy5nZXROZXh0Rm9jdXNhYmxlKCByb290RWxlbWVudCB8fCB1bmRlZmluZWQgKTtcclxuICAgICAgaWYgKCBuZXh0RWxlbWVudCA9PT0gZG9tRXZlbnQudGFyZ2V0ICkge1xyXG4gICAgICAgIGRvbUV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGJpdG1hc2sgdW5pb24gb2YgYWxsIHJlbmRlcmVycyAoY2FudmFzL3N2Zy9kb20vd2ViZ2wpIHRoYXQgYXJlIHVzZWQgZm9yIGRpc3BsYXksIGV4Y2x1ZGluZ1xyXG4gICAqIEJhY2tib25lRHJhd2FibGVzICh3aGljaCB3b3VsZCBiZSBET00pLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRVc2VkUmVuZGVyZXJzQml0bWFzaygpOiBudW1iZXIge1xyXG4gICAgZnVuY3Rpb24gcmVuZGVyZXJzVW5kZXJCYWNrYm9uZSggYmFja2JvbmU6IEJhY2tib25lRHJhd2FibGUgKTogbnVtYmVyIHtcclxuICAgICAgbGV0IGJpdG1hc2sgPSAwO1xyXG4gICAgICBfLmVhY2goIGJhY2tib25lLmJsb2NrcywgYmxvY2sgPT4ge1xyXG4gICAgICAgIGlmICggYmxvY2sgaW5zdGFuY2VvZiBET01CbG9jayAmJiBibG9jay5kb21EcmF3YWJsZSBpbnN0YW5jZW9mIEJhY2tib25lRHJhd2FibGUgKSB7XHJcbiAgICAgICAgICBiaXRtYXNrID0gYml0bWFzayB8IHJlbmRlcmVyc1VuZGVyQmFja2JvbmUoIGJsb2NrLmRvbURyYXdhYmxlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgYml0bWFzayA9IGJpdG1hc2sgfCBibG9jay5yZW5kZXJlcjtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuICAgICAgcmV0dXJuIGJpdG1hc2s7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gb25seSByZXR1cm4gdGhlIHJlbmRlcmVyLXNwZWNpZmljIHBvcnRpb24gKG5vIG90aGVyIGhpbnRzLCBldGMpXHJcbiAgICByZXR1cm4gcmVuZGVyZXJzVW5kZXJCYWNrYm9uZSggdGhpcy5fcm9vdEJhY2tib25lISApICYgUmVuZGVyZXIuYml0bWFza1JlbmRlcmVyQXJlYTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCBmcm9tIEluc3RhbmNlcyB0aGF0IHdpbGwgbmVlZCBhIHRyYW5zZm9ybSB1cGRhdGUgKGZvciBsaXN0ZW5lcnMgYW5kIHByZWNvbXB1dGF0aW9uKS4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICpcclxuICAgKiBAcGFyYW0gaW5zdGFuY2VcclxuICAgKiBAcGFyYW0gcGFzc1RyYW5zZm9ybSAtIFdoZXRoZXIgd2Ugc2hvdWxkIHBhc3MgdGhlIGZpcnN0IHRyYW5zZm9ybSByb290IHdoZW4gdmFsaWRhdGluZyB0cmFuc2Zvcm1zIChzaG91bGRcclxuICAgKiBiZSB0cnVlIGlmIHRoZSBpbnN0YW5jZSBpcyB0cmFuc2Zvcm1lZClcclxuICAgKi9cclxuICBwdWJsaWMgbWFya1RyYW5zZm9ybVJvb3REaXJ0eSggaW5zdGFuY2U6IEluc3RhbmNlLCBwYXNzVHJhbnNmb3JtOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgcGFzc1RyYW5zZm9ybSA/IHRoaXMuX2RpcnR5VHJhbnNmb3JtUm9vdHMucHVzaCggaW5zdGFuY2UgKSA6IHRoaXMuX2RpcnR5VHJhbnNmb3JtUm9vdHNXaXRob3V0UGFzcy5wdXNoKCBpbnN0YW5jZSApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSB1cGRhdGVEaXJ0eVRyYW5zZm9ybVJvb3RzKCk6IHZvaWQge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLnRyYW5zZm9ybVN5c3RlbSAmJiBzY2VuZXJ5TG9nLnRyYW5zZm9ybVN5c3RlbSggJ3VwZGF0ZURpcnR5VHJhbnNmb3JtUm9vdHMnICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cudHJhbnNmb3JtU3lzdGVtICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG4gICAgd2hpbGUgKCB0aGlzLl9kaXJ0eVRyYW5zZm9ybVJvb3RzLmxlbmd0aCApIHtcclxuICAgICAgdGhpcy5fZGlydHlUcmFuc2Zvcm1Sb290cy5wb3AoKSEucmVsYXRpdmVUcmFuc2Zvcm0udXBkYXRlVHJhbnNmb3JtTGlzdGVuZXJzQW5kQ29tcHV0ZSggZmFsc2UsIGZhbHNlLCB0aGlzLl9mcmFtZUlkLCB0cnVlICk7XHJcbiAgICB9XHJcbiAgICB3aGlsZSAoIHRoaXMuX2RpcnR5VHJhbnNmb3JtUm9vdHNXaXRob3V0UGFzcy5sZW5ndGggKSB7XHJcbiAgICAgIHRoaXMuX2RpcnR5VHJhbnNmb3JtUm9vdHNXaXRob3V0UGFzcy5wb3AoKSEucmVsYXRpdmVUcmFuc2Zvcm0udXBkYXRlVHJhbnNmb3JtTGlzdGVuZXJzQW5kQ29tcHV0ZSggZmFsc2UsIGZhbHNlLCB0aGlzLl9mcmFtZUlkLCBmYWxzZSApO1xyXG4gICAgfVxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLnRyYW5zZm9ybVN5c3RlbSAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIG1hcmtEcmF3YWJsZUNoYW5nZWRCbG9jayggZHJhd2FibGU6IERyYXdhYmxlICk6IHZvaWQge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkgJiYgc2NlbmVyeUxvZy5EaXNwbGF5KCBgbWFya0RyYXdhYmxlQ2hhbmdlZEJsb2NrOiAke2RyYXdhYmxlLnRvU3RyaW5nKCl9YCApO1xyXG4gICAgdGhpcy5fZHJhd2FibGVzVG9DaGFuZ2VCbG9jay5wdXNoKCBkcmF3YWJsZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFya3MgYW4gaXRlbSBmb3IgbGF0ZXIgcmVkdWNlUmVmZXJlbmNlcygpIGNhbGxzIGF0IHRoZSBlbmQgb2YgRGlzcGxheS51cGRhdGUoKS5cclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgbWFya0ZvclJlZHVjZWRSZWZlcmVuY2VzKCBpdGVtOiB7IHJlZHVjZVJlZmVyZW5jZXM6ICgpID0+IHZvaWQgfSApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICEhaXRlbS5yZWR1Y2VSZWZlcmVuY2VzICk7XHJcblxyXG4gICAgdGhpcy5fcmVkdWNlUmVmZXJlbmNlc05lZWRlZC5wdXNoKCBpdGVtICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgbWFya0luc3RhbmNlUm9vdEZvckRpc3Bvc2FsKCBpbnN0YW5jZTogSW5zdGFuY2UgKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuRGlzcGxheSAmJiBzY2VuZXJ5TG9nLkRpc3BsYXkoIGBtYXJrSW5zdGFuY2VSb290Rm9yRGlzcG9zYWw6ICR7aW5zdGFuY2UudG9TdHJpbmcoKX1gICk7XHJcbiAgICB0aGlzLl9pbnN0YW5jZVJvb3RzVG9EaXNwb3NlLnB1c2goIGluc3RhbmNlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgbWFya0RyYXdhYmxlRm9yRGlzcG9zYWwoIGRyYXdhYmxlOiBEcmF3YWJsZSApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5EaXNwbGF5ICYmIHNjZW5lcnlMb2cuRGlzcGxheSggYG1hcmtEcmF3YWJsZUZvckRpc3Bvc2FsOiAke2RyYXdhYmxlLnRvU3RyaW5nKCl9YCApO1xyXG4gICAgdGhpcy5fZHJhd2FibGVzVG9EaXNwb3NlLnB1c2goIGRyYXdhYmxlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgbWFya0RyYXdhYmxlRm9yTGlua3NVcGRhdGUoIGRyYXdhYmxlOiBEcmF3YWJsZSApOiB2b2lkIHtcclxuICAgIHRoaXMuX2RyYXdhYmxlc1RvVXBkYXRlTGlua3MucHVzaCggZHJhd2FibGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZCBhIHtDaGFuZ2VJbnRlcnZhbH0gZm9yIHRoZSBcInJlbW92ZSBjaGFuZ2UgaW50ZXJ2YWwgaW5mb1wiIHBoYXNlICh3ZSBkb24ndCB3YW50IHRvIGxlYWsgbWVtb3J5L3JlZmVyZW5jZXMpXHJcbiAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIG1hcmtDaGFuZ2VJbnRlcnZhbFRvRGlzcG9zZSggY2hhbmdlSW50ZXJ2YWw6IENoYW5nZUludGVydmFsICk6IHZvaWQge1xyXG4gICAgdGhpcy5fY2hhbmdlSW50ZXJ2YWxzVG9EaXNwb3NlLnB1c2goIGNoYW5nZUludGVydmFsICk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHVwZGF0ZUJhY2tncm91bmRDb2xvcigpOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2JhY2tncm91bmRDb2xvciA9PT0gbnVsbCB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHRoaXMuX2JhY2tncm91bmRDb2xvciA9PT0gJ3N0cmluZycgfHxcclxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2JhY2tncm91bmRDb2xvciBpbnN0YW5jZW9mIENvbG9yICk7XHJcblxyXG4gICAgY29uc3QgbmV3QmFja2dyb3VuZENTUyA9IHRoaXMuX2JhY2tncm91bmRDb2xvciA9PT0gbnVsbCA/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJycgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICggKCB0aGlzLl9iYWNrZ3JvdW5kQ29sb3IgYXMgQ29sb3IgKS50b0NTUyA/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoIHRoaXMuX2JhY2tncm91bmRDb2xvciBhcyBDb2xvciApLnRvQ1NTKCkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYmFja2dyb3VuZENvbG9yIGFzIHN0cmluZyApO1xyXG4gICAgaWYgKCBuZXdCYWNrZ3JvdW5kQ1NTICE9PSB0aGlzLl9jdXJyZW50QmFja2dyb3VuZENTUyApIHtcclxuICAgICAgdGhpcy5fY3VycmVudEJhY2tncm91bmRDU1MgPSBuZXdCYWNrZ3JvdW5kQ1NTO1xyXG5cclxuICAgICAgdGhpcy5fZG9tRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBuZXdCYWNrZ3JvdW5kQ1NTO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qXHJcbiAgICogQ3Vyc29yc1xyXG4gICAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG4gIHByaXZhdGUgdXBkYXRlQ3Vyc29yKCk6IHZvaWQge1xyXG4gICAgaWYgKCB0aGlzLl9pbnB1dCAmJiB0aGlzLl9pbnB1dC5tb3VzZSAmJiB0aGlzLl9pbnB1dC5tb3VzZS5wb2ludCApIHtcclxuICAgICAgaWYgKCB0aGlzLl9pbnB1dC5tb3VzZS5jdXJzb3IgKSB7XHJcbiAgICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkN1cnNvciAmJiBzY2VuZXJ5TG9nLkN1cnNvciggYHNldCBvbiBwb2ludGVyOiAke3RoaXMuX2lucHV0Lm1vdXNlLmN1cnNvcn1gICk7XHJcbiAgICAgICAgdGhpcy5zZXRTY2VuZUN1cnNvciggdGhpcy5faW5wdXQubW91c2UuY3Vyc29yICk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvL09IVFdPIFRPRE86IEZvciBhIGRpc3BsYXksIGp1c3QgcmV0dXJuIGFuIGluc3RhbmNlIGFuZCB3ZSBjYW4gYXZvaWQgdGhlIGdhcmJhZ2UgY29sbGVjdGlvbi9tdXRhdGlvbiBhdCB0aGUgY29zdCBvZiB0aGUgbGlua2VkLWxpc3QgdHJhdmVyc2FsIGluc3RlYWQgb2YgYW4gYXJyYXkgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgY29uc3QgbW91c2VUcmFpbCA9IHRoaXMuX3Jvb3ROb2RlLnRyYWlsVW5kZXJQb2ludGVyKCB0aGlzLl9pbnB1dC5tb3VzZSApO1xyXG5cclxuICAgICAgaWYgKCBtb3VzZVRyYWlsICkge1xyXG4gICAgICAgIGZvciAoIGxldCBpID0gbW91c2VUcmFpbC5nZXRDdXJzb3JDaGVja0luZGV4KCk7IGkgPj0gMDsgaS0tICkge1xyXG4gICAgICAgICAgY29uc3Qgbm9kZSA9IG1vdXNlVHJhaWwubm9kZXNbIGkgXTtcclxuICAgICAgICAgIGNvbnN0IGN1cnNvciA9IG5vZGUuZ2V0RWZmZWN0aXZlQ3Vyc29yKCk7XHJcblxyXG4gICAgICAgICAgaWYgKCBjdXJzb3IgKSB7XHJcbiAgICAgICAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5DdXJzb3IgJiYgc2NlbmVyeUxvZy5DdXJzb3IoIGAke2N1cnNvcn0gb24gJHtub2RlLmNvbnN0cnVjdG9yLm5hbWV9IyR7bm9kZS5pZH1gICk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0U2NlbmVDdXJzb3IoIGN1cnNvciApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuQ3Vyc29yICYmIHNjZW5lcnlMb2cuQ3Vyc29yKCBgLS0tIGZvciAke21vdXNlVHJhaWwgPyBtb3VzZVRyYWlsLnRvU3RyaW5nKCkgOiAnKG5vIGhpdCknfWAgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBmYWxsYmFjayBjYXNlXHJcbiAgICB0aGlzLnNldFNjZW5lQ3Vyc29yKCB0aGlzLl9kZWZhdWx0Q3Vyc29yICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBjdXJzb3IgdG8gYmUgZGlzcGxheWVkIHdoZW4gb3ZlciB0aGUgRGlzcGxheS5cclxuICAgKi9cclxuICBwcml2YXRlIHNldEVsZW1lbnRDdXJzb3IoIGN1cnNvcjogc3RyaW5nICk6IHZvaWQge1xyXG4gICAgdGhpcy5fZG9tRWxlbWVudC5zdHlsZS5jdXJzb3IgPSBjdXJzb3I7XHJcblxyXG4gICAgLy8gSW4gc29tZSBjYXNlcywgQ2hyb21lIGRvZXNuJ3Qgc2VlbSB0byByZXNwZWN0IHRoZSBjdXJzb3Igc2V0IG9uIHRoZSBEaXNwbGF5J3MgZG9tRWxlbWVudC4gSWYgd2UgYXJlIHVzaW5nIHRoZVxyXG4gICAgLy8gZnVsbCB3aW5kb3csIHdlIGNhbiBhcHBseSB0aGUgd29ya2Fyb3VuZCBvZiBjb250cm9sbGluZyB0aGUgYm9keSdzIHN0eWxlLlxyXG4gICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy85ODNcclxuICAgIGlmICggdGhpcy5fYXNzdW1lRnVsbFdpbmRvdyApIHtcclxuICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBjdXJzb3I7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHNldFNjZW5lQ3Vyc29yKCBjdXJzb3I6IHN0cmluZyApOiB2b2lkIHtcclxuICAgIGlmICggY3Vyc29yICE9PSB0aGlzLl9sYXN0Q3Vyc29yICkge1xyXG4gICAgICB0aGlzLl9sYXN0Q3Vyc29yID0gY3Vyc29yO1xyXG4gICAgICBjb25zdCBjdXN0b21DdXJzb3JzID0gQ1VTVE9NX0NVUlNPUlNbIGN1cnNvciBdO1xyXG4gICAgICBpZiAoIGN1c3RvbUN1cnNvcnMgKSB7XHJcbiAgICAgICAgLy8gZ28gYmFja3dhcmRzLCBzbyB0aGUgbW9zdCBkZXNpcmVkIGN1cnNvciBzdGlja3NcclxuICAgICAgICBmb3IgKCBsZXQgaSA9IGN1c3RvbUN1cnNvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0gKSB7XHJcbiAgICAgICAgICB0aGlzLnNldEVsZW1lbnRDdXJzb3IoIGN1c3RvbUN1cnNvcnNbIGkgXSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB0aGlzLnNldEVsZW1lbnRDdXJzb3IoIGN1cnNvciApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFwcGx5Q1NTSGFja3MoKTogdm9pZCB7XHJcbiAgICAvLyB0byB1c2UgQ1NTMyB0cmFuc2Zvcm1zIGZvciBwZXJmb3JtYW5jZSwgaGlkZSBhbnl0aGluZyBvdXRzaWRlIG91ciBib3VuZHMgYnkgZGVmYXVsdFxyXG4gICAgaWYgKCAhdGhpcy5fYWxsb3dTY2VuZU92ZXJmbG93ICkge1xyXG4gICAgICB0aGlzLl9kb21FbGVtZW50LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZm9yd2FyZCBhbGwgcG9pbnRlciBldmVudHNcclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgbGVnYWN5XHJcbiAgICB0aGlzLl9kb21FbGVtZW50LnN0eWxlLm1zVG91Y2hBY3Rpb24gPSAnbm9uZSc7XHJcblxyXG4gICAgLy8gZG9uJ3QgYWxsb3cgYnJvd3NlciB0byBzd2l0Y2ggYmV0d2VlbiBmb250IHNtb290aGluZyBtZXRob2RzIGZvciB0ZXh0IChzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzQzMSlcclxuICAgIEZlYXR1cmVzLnNldFN0eWxlKCB0aGlzLl9kb21FbGVtZW50LCBGZWF0dXJlcy5mb250U21vb3RoaW5nLCAnYW50aWFsaWFzZWQnICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9hbGxvd0NTU0hhY2tzICkge1xyXG4gICAgICAvLyBQcmV2ZW50cyBzZWxlY3Rpb24gY3Vyc29yIGlzc3VlcyBpbiBTYWZhcmksIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvNDc2XHJcbiAgICAgIGRvY3VtZW50Lm9uc2VsZWN0c3RhcnQgPSAoKSA9PiBmYWxzZTtcclxuXHJcbiAgICAgIC8vIHByZXZlbnQgYW55IGRlZmF1bHQgem9vbWluZyBiZWhhdmlvciBmcm9tIGEgdHJhY2twYWQgb24gSUUxMSBhbmQgRWRnZSwgYWxsIHNob3VsZCBiZSBoYW5kbGVkIGJ5IHNjZW5lcnkgLSBtdXN0XHJcbiAgICAgIC8vIGJlIG9uIHRoZSBib2R5LCBkb2Vzbid0IHByZXZlbnQgYmVoYXZpb3IgaWYgb24gdGhlIGRpc3BsYXkgZGl2XHJcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgbGVnYWN5XHJcbiAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUubXNDb250ZW50Wm9vbWluZyA9ICdub25lJztcclxuXHJcbiAgICAgIC8vIHNvbWUgY3NzIGhhY2tzIChpbnNwaXJlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9FaWdodE1lZGlhL2hhbW1lci5qcy9ibG9iL21hc3Rlci9oYW1tZXIuanMpLlxyXG4gICAgICAvLyBtb2RpZmllZCB0byBvbmx5IGFwcGx5IHRoZSBwcm9wZXIgcHJlZml4ZWQgdmVyc2lvbiBpbnN0ZWFkIG9mIHNwYW1taW5nIGFsbCBvZiB0aGVtLCBhbmQgZG9lc24ndCB1c2UgalF1ZXJ5LlxyXG4gICAgICBGZWF0dXJlcy5zZXRTdHlsZSggdGhpcy5fZG9tRWxlbWVudCwgRmVhdHVyZXMudXNlckRyYWcsICdub25lJyApO1xyXG4gICAgICBGZWF0dXJlcy5zZXRTdHlsZSggdGhpcy5fZG9tRWxlbWVudCwgRmVhdHVyZXMudXNlclNlbGVjdCwgJ25vbmUnICk7XHJcbiAgICAgIEZlYXR1cmVzLnNldFN0eWxlKCB0aGlzLl9kb21FbGVtZW50LCBGZWF0dXJlcy50b3VjaEFjdGlvbiwgJ25vbmUnICk7XHJcbiAgICAgIEZlYXR1cmVzLnNldFN0eWxlKCB0aGlzLl9kb21FbGVtZW50LCBGZWF0dXJlcy50b3VjaENhbGxvdXQsICdub25lJyApO1xyXG4gICAgICBGZWF0dXJlcy5zZXRTdHlsZSggdGhpcy5fZG9tRWxlbWVudCwgRmVhdHVyZXMudGFwSGlnaGxpZ2h0Q29sb3IsICdyZ2JhKDAsMCwwLDApJyApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIGNhbnZhc0RhdGFVUkwoIGNhbGxiYWNrOiAoIHN0cjogc3RyaW5nICkgPT4gdm9pZCApOiB2b2lkIHtcclxuICAgIHRoaXMuY2FudmFzU25hcHNob3QoICggY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCApID0+IHtcclxuICAgICAgY2FsbGJhY2soIGNhbnZhcy50b0RhdGFVUkwoKSApO1xyXG4gICAgfSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVuZGVycyB3aGF0IGl0IGNhbiBpbnRvIGEgQ2FudmFzIChzbyBmYXIsIENhbnZhcyBhbmQgU1ZHIGxheWVycyB3b3JrIGZpbmUpXHJcbiAgICovXHJcbiAgcHVibGljIGNhbnZhc1NuYXBzaG90KCBjYWxsYmFjazogKCBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50LCBpbWFnZURhdGE6IEltYWdlRGF0YSApID0+IHZvaWQgKTogdm9pZCB7XHJcbiAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApO1xyXG4gICAgY2FudmFzLndpZHRoID0gdGhpcy5zaXplLndpZHRoO1xyXG4gICAgY2FudmFzLmhlaWdodCA9IHRoaXMuc2l6ZS5oZWlnaHQ7XHJcblxyXG4gICAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCAnMmQnICkhO1xyXG5cclxuICAgIC8vT0hUV08gVE9ETzogYWxsb3cgYWN0dWFsIGJhY2tncm91bmQgY29sb3IgZGlyZWN0bHksIG5vdCBoYXZpbmcgdG8gY2hlY2sgdGhlIHN0eWxlIGhlcmUhISEgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgIHRoaXMuX3Jvb3ROb2RlLnJlbmRlclRvQ2FudmFzKCBjYW52YXMsIGNvbnRleHQsICgpID0+IHtcclxuICAgICAgY2FsbGJhY2soIGNhbnZhcywgY29udGV4dC5nZXRJbWFnZURhdGEoIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCApICk7XHJcbiAgICB9LCB0aGlzLmRvbUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUT0RPOiByZWR1Y2UgY29kZSBkdXBsaWNhdGlvbiBmb3IgaGFuZGxpbmcgb3ZlcmxheXMgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgKi9cclxuICBwdWJsaWMgc2V0UG9pbnRlckRpc3BsYXlWaXNpYmxlKCB2aXNpYmlsaXR5OiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgY29uc3QgaGFzT3ZlcmxheSA9ICEhdGhpcy5fcG9pbnRlck92ZXJsYXk7XHJcblxyXG4gICAgaWYgKCB2aXNpYmlsaXR5ICE9PSBoYXNPdmVybGF5ICkge1xyXG4gICAgICBpZiAoICF2aXNpYmlsaXR5ICkge1xyXG4gICAgICAgIHRoaXMucmVtb3ZlT3ZlcmxheSggdGhpcy5fcG9pbnRlck92ZXJsYXkhICk7XHJcbiAgICAgICAgdGhpcy5fcG9pbnRlck92ZXJsYXkhLmRpc3Bvc2UoKTtcclxuICAgICAgICB0aGlzLl9wb2ludGVyT3ZlcmxheSA9IG51bGw7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdGhpcy5fcG9pbnRlck92ZXJsYXkgPSBuZXcgUG9pbnRlck92ZXJsYXkoIHRoaXMsIHRoaXMuX3Jvb3ROb2RlICk7XHJcbiAgICAgICAgdGhpcy5hZGRPdmVybGF5KCB0aGlzLl9wb2ludGVyT3ZlcmxheSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUT0RPOiByZWR1Y2UgY29kZSBkdXBsaWNhdGlvbiBmb3IgaGFuZGxpbmcgb3ZlcmxheXMgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgKi9cclxuICBwdWJsaWMgc2V0UG9pbnRlckFyZWFEaXNwbGF5VmlzaWJsZSggdmlzaWJpbGl0eTogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIGNvbnN0IGhhc092ZXJsYXkgPSAhIXRoaXMuX3BvaW50ZXJBcmVhT3ZlcmxheTtcclxuXHJcbiAgICBpZiAoIHZpc2liaWxpdHkgIT09IGhhc092ZXJsYXkgKSB7XHJcbiAgICAgIGlmICggIXZpc2liaWxpdHkgKSB7XHJcbiAgICAgICAgdGhpcy5yZW1vdmVPdmVybGF5KCB0aGlzLl9wb2ludGVyQXJlYU92ZXJsYXkhICk7XHJcbiAgICAgICAgdGhpcy5fcG9pbnRlckFyZWFPdmVybGF5IS5kaXNwb3NlKCk7XHJcbiAgICAgICAgdGhpcy5fcG9pbnRlckFyZWFPdmVybGF5ID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB0aGlzLl9wb2ludGVyQXJlYU92ZXJsYXkgPSBuZXcgUG9pbnRlckFyZWFPdmVybGF5KCB0aGlzLCB0aGlzLl9yb290Tm9kZSApO1xyXG4gICAgICAgIHRoaXMuYWRkT3ZlcmxheSggdGhpcy5fcG9pbnRlckFyZWFPdmVybGF5ICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRPRE86IHJlZHVjZSBjb2RlIGR1cGxpY2F0aW9uIGZvciBoYW5kbGluZyBvdmVybGF5cyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRIaXRBcmVhRGlzcGxheVZpc2libGUoIHZpc2liaWxpdHk6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICBjb25zdCBoYXNPdmVybGF5ID0gISF0aGlzLl9oaXRBcmVhT3ZlcmxheTtcclxuXHJcbiAgICBpZiAoIHZpc2liaWxpdHkgIT09IGhhc092ZXJsYXkgKSB7XHJcbiAgICAgIGlmICggIXZpc2liaWxpdHkgKSB7XHJcbiAgICAgICAgdGhpcy5yZW1vdmVPdmVybGF5KCB0aGlzLl9oaXRBcmVhT3ZlcmxheSEgKTtcclxuICAgICAgICB0aGlzLl9oaXRBcmVhT3ZlcmxheSEuZGlzcG9zZSgpO1xyXG4gICAgICAgIHRoaXMuX2hpdEFyZWFPdmVybGF5ID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB0aGlzLl9oaXRBcmVhT3ZlcmxheSA9IG5ldyBIaXRBcmVhT3ZlcmxheSggdGhpcywgdGhpcy5fcm9vdE5vZGUgKTtcclxuICAgICAgICB0aGlzLmFkZE92ZXJsYXkoIHRoaXMuX2hpdEFyZWFPdmVybGF5ICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRPRE86IHJlZHVjZSBjb2RlIGR1cGxpY2F0aW9uIGZvciBoYW5kbGluZyBvdmVybGF5cyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRDYW52YXNOb2RlQm91bmRzVmlzaWJsZSggdmlzaWJpbGl0eTogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIGNvbnN0IGhhc092ZXJsYXkgPSAhIXRoaXMuX2NhbnZhc0FyZWFCb3VuZHNPdmVybGF5O1xyXG5cclxuICAgIGlmICggdmlzaWJpbGl0eSAhPT0gaGFzT3ZlcmxheSApIHtcclxuICAgICAgaWYgKCAhdmlzaWJpbGl0eSApIHtcclxuICAgICAgICB0aGlzLnJlbW92ZU92ZXJsYXkoIHRoaXMuX2NhbnZhc0FyZWFCb3VuZHNPdmVybGF5ISApO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhc0FyZWFCb3VuZHNPdmVybGF5IS5kaXNwb3NlKCk7XHJcbiAgICAgICAgdGhpcy5fY2FudmFzQXJlYUJvdW5kc092ZXJsYXkgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHRoaXMuX2NhbnZhc0FyZWFCb3VuZHNPdmVybGF5ID0gbmV3IENhbnZhc05vZGVCb3VuZHNPdmVybGF5KCB0aGlzLCB0aGlzLl9yb290Tm9kZSApO1xyXG4gICAgICAgIHRoaXMuYWRkT3ZlcmxheSggdGhpcy5fY2FudmFzQXJlYUJvdW5kc092ZXJsYXkgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVE9ETzogcmVkdWNlIGNvZGUgZHVwbGljYXRpb24gZm9yIGhhbmRsaW5nIG92ZXJsYXlzIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICovXHJcbiAgcHVibGljIHNldEZpdHRlZEJsb2NrQm91bmRzVmlzaWJsZSggdmlzaWJpbGl0eTogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIGNvbnN0IGhhc092ZXJsYXkgPSAhIXRoaXMuX2ZpdHRlZEJsb2NrQm91bmRzT3ZlcmxheTtcclxuXHJcbiAgICBpZiAoIHZpc2liaWxpdHkgIT09IGhhc092ZXJsYXkgKSB7XHJcbiAgICAgIGlmICggIXZpc2liaWxpdHkgKSB7XHJcbiAgICAgICAgdGhpcy5yZW1vdmVPdmVybGF5KCB0aGlzLl9maXR0ZWRCbG9ja0JvdW5kc092ZXJsYXkhICk7XHJcbiAgICAgICAgdGhpcy5fZml0dGVkQmxvY2tCb3VuZHNPdmVybGF5IS5kaXNwb3NlKCk7XHJcbiAgICAgICAgdGhpcy5fZml0dGVkQmxvY2tCb3VuZHNPdmVybGF5ID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB0aGlzLl9maXR0ZWRCbG9ja0JvdW5kc092ZXJsYXkgPSBuZXcgRml0dGVkQmxvY2tCb3VuZHNPdmVybGF5KCB0aGlzLCB0aGlzLl9yb290Tm9kZSApO1xyXG4gICAgICAgIHRoaXMuYWRkT3ZlcmxheSggdGhpcy5fZml0dGVkQmxvY2tCb3VuZHNPdmVybGF5ICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdXAgdGhlIERpc3BsYXkgdG8gcmVzaXplIHRvIHdoYXRldmVyIHRoZSB3aW5kb3cgaW5uZXIgZGltZW5zaW9ucyB3aWxsIGJlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyByZXNpemVPbldpbmRvd1Jlc2l6ZSgpOiB2b2lkIHtcclxuICAgIGNvbnN0IHJlc2l6ZXIgPSAoKSA9PiB7XHJcbiAgICAgIHRoaXMuc2V0V2lkdGhIZWlnaHQoIHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBiYWQtc2ltLXRleHRcclxuICAgIH07XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ3Jlc2l6ZScsIHJlc2l6ZXIgKTtcclxuICAgIHJlc2l6ZXIoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwZGF0ZXMgb24gZXZlcnkgcmVxdWVzdCBhbmltYXRpb24gZnJhbWUuIElmIHN0ZXBDYWxsYmFjayBpcyBwYXNzZWQgaW4sIGl0IGlzIGNhbGxlZCBiZWZvcmUgdXBkYXRlRGlzcGxheSgpIHdpdGhcclxuICAgKiBzdGVwQ2FsbGJhY2soIHRpbWVFbGFwc2VkSW5TZWNvbmRzIClcclxuICAgKi9cclxuICBwdWJsaWMgdXBkYXRlT25SZXF1ZXN0QW5pbWF0aW9uRnJhbWUoIHN0ZXBDYWxsYmFjaz86ICggZHQ6IG51bWJlciApID0+IHZvaWQgKTogdm9pZCB7XHJcbiAgICAvLyBrZWVwIHRyYWNrIG9mIGhvdyBtdWNoIHRpbWUgZWxhcHNlZCBvdmVyIHRoZSBsYXN0IGZyYW1lXHJcbiAgICBsZXQgbGFzdFRpbWUgPSAwO1xyXG4gICAgbGV0IHRpbWVFbGFwc2VkSW5TZWNvbmRzID0gMDtcclxuXHJcbiAgICBjb25zdCBzZWxmID0gdGhpczsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdGhpcy1hbGlhc1xyXG4gICAgKCBmdW5jdGlvbiBzdGVwKCkge1xyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIExFR0FDWSAtLS0gaXQgd291bGQga25vdyB0byB1cGRhdGUganVzdCB0aGUgRE9NIGVsZW1lbnQncyBsb2NhdGlvbiBpZiBpdCdzIHRoZSBzZWNvbmQgYXJndW1lbnRcclxuICAgICAgc2VsZi5fcmVxdWVzdEFuaW1hdGlvbkZyYW1lSUQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCBzdGVwLCBzZWxmLl9kb21FbGVtZW50ICk7XHJcblxyXG4gICAgICAvLyBjYWxjdWxhdGUgaG93IG11Y2ggdGltZSBoYXMgZWxhcHNlZCBzaW5jZSB3ZSByZW5kZXJlZCB0aGUgbGFzdCBmcmFtZVxyXG4gICAgICBjb25zdCB0aW1lTm93ID0gRGF0ZS5ub3coKTtcclxuICAgICAgaWYgKCBsYXN0VGltZSAhPT0gMCApIHtcclxuICAgICAgICB0aW1lRWxhcHNlZEluU2Vjb25kcyA9ICggdGltZU5vdyAtIGxhc3RUaW1lICkgLyAxMDAwLjA7XHJcbiAgICAgIH1cclxuICAgICAgbGFzdFRpbWUgPSB0aW1lTm93O1xyXG5cclxuICAgICAgLy8gc3RlcCB0aGUgdGltZXIgdGhhdCBkcml2ZXMgYW55IHRpbWUgZGVwZW5kZW50IHVwZGF0ZXMgb2YgdGhlIERpc3BsYXlcclxuICAgICAgc3RlcFRpbWVyLmVtaXQoIHRpbWVFbGFwc2VkSW5TZWNvbmRzICk7XHJcblxyXG4gICAgICBzdGVwQ2FsbGJhY2sgJiYgc3RlcENhbGxiYWNrKCB0aW1lRWxhcHNlZEluU2Vjb25kcyApO1xyXG4gICAgICBzZWxmLnVwZGF0ZURpc3BsYXkoKTtcclxuICAgIH0gKSgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGNhbmNlbFVwZGF0ZU9uUmVxdWVzdEFuaW1hdGlvbkZyYW1lKCk6IHZvaWQge1xyXG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKCB0aGlzLl9yZXF1ZXN0QW5pbWF0aW9uRnJhbWVJRCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgZXZlbnQgaGFuZGxpbmcsIGFuZCBjb25uZWN0cyB0aGUgYnJvd3NlcidzIGlucHV0IGV2ZW50IGhhbmRsZXJzIHRvIG5vdGlmeSB0aGlzIERpc3BsYXkgb2YgZXZlbnRzLlxyXG4gICAqXHJcbiAgICogTk9URTogVGhpcyBjYW4gYmUgcmV2ZXJzZWQgd2l0aCBkZXRhY2hFdmVudHMoKS5cclxuICAgKi9cclxuICBwdWJsaWMgaW5pdGlhbGl6ZUV2ZW50cyggb3B0aW9ucz86IElucHV0T3B0aW9ucyApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLl9pbnB1dCwgJ0V2ZW50cyBjYW5ub3QgYmUgYXR0YWNoZWQgdHdpY2UgdG8gYSBkaXNwbGF5IChmb3Igbm93KScgKTtcclxuXHJcbiAgICAvLyBUT0RPOiByZWZhY3RvciBoZXJlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICBjb25zdCBpbnB1dCA9IG5ldyBJbnB1dCggdGhpcywgIXRoaXMuX2xpc3RlblRvT25seUVsZW1lbnQsIHRoaXMuX2JhdGNoRE9NRXZlbnRzLCB0aGlzLl9hc3N1bWVGdWxsV2luZG93LCB0aGlzLl9wYXNzaXZlRXZlbnRzLCBvcHRpb25zICk7XHJcbiAgICB0aGlzLl9pbnB1dCA9IGlucHV0O1xyXG5cclxuICAgIGlucHV0LmNvbm5lY3RMaXN0ZW5lcnMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERldGFjaCBhbHJlYWR5LWF0dGFjaGVkIGlucHV0IGV2ZW50IGhhbmRsaW5nIChmcm9tIGluaXRpYWxpemVFdmVudHMoKSkuXHJcbiAgICovXHJcbiAgcHVibGljIGRldGFjaEV2ZW50cygpOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2lucHV0LCAnZGV0YWNoRXZlbnRzKCkgc2hvdWxkIGJlIGNhbGxlZCBvbmx5IHdoZW4gZXZlbnRzIGFyZSBhdHRhY2hlZCcgKTtcclxuXHJcbiAgICB0aGlzLl9pbnB1dCEuZGlzY29ubmVjdExpc3RlbmVycygpO1xyXG4gICAgdGhpcy5faW5wdXQgPSBudWxsO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYW4gaW5wdXQgbGlzdGVuZXIuXHJcbiAgICovXHJcbiAgcHVibGljIGFkZElucHV0TGlzdGVuZXIoIGxpc3RlbmVyOiBUSW5wdXRMaXN0ZW5lciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFfLmluY2x1ZGVzKCB0aGlzLl9pbnB1dExpc3RlbmVycywgbGlzdGVuZXIgKSwgJ0lucHV0IGxpc3RlbmVyIGFscmVhZHkgcmVnaXN0ZXJlZCBvbiB0aGlzIERpc3BsYXknICk7XHJcblxyXG4gICAgLy8gZG9uJ3QgYWxsb3cgbGlzdGVuZXJzIHRvIGJlIGFkZGVkIG11bHRpcGxlIHRpbWVzXHJcbiAgICBpZiAoICFfLmluY2x1ZGVzKCB0aGlzLl9pbnB1dExpc3RlbmVycywgbGlzdGVuZXIgKSApIHtcclxuICAgICAgdGhpcy5faW5wdXRMaXN0ZW5lcnMucHVzaCggbGlzdGVuZXIgKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyBhbiBpbnB1dCBsaXN0ZW5lciB0aGF0IHdhcyBwcmV2aW91c2x5IGFkZGVkIHdpdGggYWRkSW5wdXRMaXN0ZW5lci5cclxuICAgKi9cclxuICBwdWJsaWMgcmVtb3ZlSW5wdXRMaXN0ZW5lciggbGlzdGVuZXI6IFRJbnB1dExpc3RlbmVyICk6IHRoaXMge1xyXG4gICAgLy8gZW5zdXJlIHRoZSBsaXN0ZW5lciBpcyBpbiBvdXIgbGlzdFxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggXy5pbmNsdWRlcyggdGhpcy5faW5wdXRMaXN0ZW5lcnMsIGxpc3RlbmVyICkgKTtcclxuXHJcbiAgICB0aGlzLl9pbnB1dExpc3RlbmVycy5zcGxpY2UoIF8uaW5kZXhPZiggdGhpcy5faW5wdXRMaXN0ZW5lcnMsIGxpc3RlbmVyICksIDEgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciB0aGlzIGlucHV0IGxpc3RlbmVyIGlzIGN1cnJlbnRseSBsaXN0ZW5pbmcgdG8gdGhpcyBEaXNwbGF5LlxyXG4gICAqXHJcbiAgICogTW9yZSBlZmZpY2llbnQgdGhhbiBjaGVja2luZyBkaXNwbGF5LmlucHV0TGlzdGVuZXJzLCBhcyB0aGF0IGluY2x1ZGVzIGEgZGVmZW5zaXZlIGNvcHkuXHJcbiAgICovXHJcbiAgcHVibGljIGhhc0lucHV0TGlzdGVuZXIoIGxpc3RlbmVyOiBUSW5wdXRMaXN0ZW5lciApOiBib29sZWFuIHtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuX2lucHV0TGlzdGVuZXJzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBpZiAoIHRoaXMuX2lucHV0TGlzdGVuZXJzWyBpIF0gPT09IGxpc3RlbmVyICkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgY29weSBvZiBhbGwgb2Ygb3VyIGlucHV0IGxpc3RlbmVycy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0SW5wdXRMaXN0ZW5lcnMoKTogVElucHV0TGlzdGVuZXJbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5faW5wdXRMaXN0ZW5lcnMuc2xpY2UoIDAgKTsgLy8gZGVmZW5zaXZlIGNvcHlcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgaW5wdXRMaXN0ZW5lcnMoKTogVElucHV0TGlzdGVuZXJbXSB7IHJldHVybiB0aGlzLmdldElucHV0TGlzdGVuZXJzKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW50ZXJydXB0cyBhbGwgaW5wdXQgbGlzdGVuZXJzIHRoYXQgYXJlIGF0dGFjaGVkIHRvIHRoaXMgRGlzcGxheS5cclxuICAgKi9cclxuICBwdWJsaWMgaW50ZXJydXB0SW5wdXQoKTogdGhpcyB7XHJcbiAgICBjb25zdCBsaXN0ZW5lcnNDb3B5ID0gdGhpcy5pbnB1dExpc3RlbmVycztcclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBsaXN0ZW5lcnNDb3B5Lmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBsaXN0ZW5lciA9IGxpc3RlbmVyc0NvcHlbIGkgXTtcclxuXHJcbiAgICAgIGxpc3RlbmVyLmludGVycnVwdCAmJiBsaXN0ZW5lci5pbnRlcnJ1cHQoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEludGVycnVwdHMgYWxsIHBvaW50ZXJzIGFzc29jaWF0ZWQgd2l0aCB0aGlzIERpc3BsYXksIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4Mi5cclxuICAgKi9cclxuICBwdWJsaWMgaW50ZXJydXB0UG9pbnRlcnMoKTogdGhpcyB7XHJcbiAgICB0aGlzLl9pbnB1dCAmJiB0aGlzLl9pbnB1dC5pbnRlcnJ1cHRQb2ludGVycygpO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW50ZXJydXB0cyBhbGwgcG9pbnRlcnMgYXNzb2NpYXRlZCB3aXRoIHRoaXMgRGlzcGxheSB0aGF0IGFyZSBOT1QgY3VycmVudGx5IGhhdmluZyBldmVudHMgZXhlY3V0ZWQuXHJcbiAgICogc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgyLlxyXG4gICAqXHJcbiAgICogSWYgZXhjbHVkZVBvaW50ZXIgaXMgcHJvdmlkZWQgYW5kIGlzIG5vbi1udWxsLCBpdCdzIHVzZWQgYXMgdGhlIFwiY3VycmVudFwiIHBvaW50ZXIgdGhhdCBzaG91bGQgYmUgZXhjbHVkZWQgZnJvbVxyXG4gICAqIGludGVycnVwdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgaW50ZXJydXB0T3RoZXJQb2ludGVycyggZXhjbHVkZVBvaW50ZXI6IFBvaW50ZXIgfCBudWxsID0gbnVsbCApOiB0aGlzIHtcclxuICAgIHRoaXMuX2lucHV0ICYmIHRoaXMuX2lucHV0LmludGVycnVwdFBvaW50ZXJzKFxyXG4gICAgICAoIGV4Y2x1ZGVQb2ludGVyIHx8IHRoaXMuX2lucHV0LmN1cnJlbnRTY2VuZXJ5RXZlbnQ/LnBvaW50ZXIgKSB8fCBudWxsXHJcbiAgICApO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBJTlRFUlJVUFRfT1RIRVJfUE9JTlRFUlMgPSAoIGV2ZW50OiBTY2VuZXJ5RXZlbnQgKTogdm9pZCA9PiB7XHJcbiAgICBwaGV0Py5qb2lzdD8uZGlzcGxheT8uaW50ZXJydXB0T3RoZXJQb2ludGVycyggZXZlbnQ/LnBvaW50ZXIgKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgZW5zdXJlTm90UGFpbnRpbmcoKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5faXNQYWludGluZyxcclxuICAgICAgJ1RoaXMgc2hvdWxkIG5vdCBiZSBydW4gaW4gdGhlIGNhbGwgdHJlZSBvZiB1cGRhdGVEaXNwbGF5KCkuIElmIHlvdSBzZWUgdGhpcywgaXQgaXMgbGlrZWx5IHRoYXQgZWl0aGVyIHRoZSAnICtcclxuICAgICAgJ2xhc3QgdXBkYXRlRGlzcGxheSgpIGhhZCBhIHRocm93biBlcnJvciBhbmQgaXQgaXMgdHJ5aW5nIHRvIGJlIHJ1biBhZ2FpbiAoaW4gd2hpY2ggY2FzZSwgaW52ZXN0aWdhdGUgdGhhdCAnICtcclxuICAgICAgJ2Vycm9yKSwgT1IgY29kZSB3YXMgcnVuL3RyaWdnZXJlZCBmcm9tIGluc2lkZSBhbiB1cGRhdGVEaXNwbGF5KCkgdGhhdCBoYXMgdGhlIHBvdGVudGlhbCB0byBjYXVzZSBhbiBpbmZpbml0ZSAnICtcclxuICAgICAgJ2xvb3AsIGUuZy4gQ2FudmFzTm9kZSBwYWludENhbnZhcygpIGNhbGwgbWFuaXB1bGF0aW5nIGFub3RoZXIgTm9kZSwgb3IgYSBib3VuZHMgbGlzdGVuZXIgdGhhdCBTY2VuZXJ5IG1pc3NlZC4nICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmlnZ2VycyBhIGxvc3Mgb2YgY29udGV4dCBmb3IgYWxsIFdlYkdMIGJsb2Nrcy5cclxuICAgKlxyXG4gICAqIE5PVEU6IFNob3VsZCBnZW5lcmFsbHkgb25seSBiZSB1c2VkIGZvciBkZWJ1Z2dpbmcuXHJcbiAgICovXHJcbiAgcHVibGljIGxvc2VXZWJHTENvbnRleHRzKCk6IHZvaWQge1xyXG4gICAgKCBmdW5jdGlvbiBsb3NlQmFja2JvbmUoIGJhY2tib25lOiBCYWNrYm9uZURyYXdhYmxlICkge1xyXG4gICAgICBpZiAoIGJhY2tib25lLmJsb2NrcyApIHtcclxuICAgICAgICBiYWNrYm9uZS5ibG9ja3MuZm9yRWFjaCggKCBibG9jazogQmxvY2sgKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBnbCA9ICggYmxvY2sgYXMgdW5rbm93biBhcyBXZWJHTEJsb2NrICkuZ2w7XHJcbiAgICAgICAgICBpZiAoIGdsICkge1xyXG4gICAgICAgICAgICBVdGlscy5sb3NlQ29udGV4dCggZ2wgKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvL1RPRE86IHBhdHRlcm4gZm9yIHRoaXMgaXRlcmF0aW9uIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAgICAgICBmb3IgKCBsZXQgZHJhd2FibGUgPSBibG9jay5maXJzdERyYXdhYmxlOyBkcmF3YWJsZSAhPT0gbnVsbDsgZHJhd2FibGUgPSBkcmF3YWJsZS5uZXh0RHJhd2FibGUgKSB7XHJcbiAgICAgICAgICAgIGxvc2VCYWNrYm9uZSggZHJhd2FibGUgKTtcclxuICAgICAgICAgICAgaWYgKCBkcmF3YWJsZSA9PT0gYmxvY2subGFzdERyYXdhYmxlICkgeyBicmVhazsgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG4gICAgfSApKCB0aGlzLl9yb290QmFja2JvbmUhICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNYWtlcyB0aGlzIERpc3BsYXkgYXZhaWxhYmxlIGZvciBpbnNwZWN0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbnNwZWN0KCk6IHZvaWQge1xyXG4gICAgbG9jYWxTdG9yYWdlLnNjZW5lcnlTbmFwc2hvdCA9IEpTT04uc3RyaW5naWZ5KCBzY2VuZXJ5U2VyaWFsaXplKCB0aGlzICkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gSFRNTCBmcmFnbWVudCB0aGF0IGluY2x1ZGVzIGEgbGFyZ2UgYW1vdW50IG9mIGRlYnVnZ2luZyBpbmZvcm1hdGlvbiwgaW5jbHVkaW5nIGEgdmlldyBvZiB0aGVcclxuICAgKiBpbnN0YW5jZSB0cmVlIGFuZCBkcmF3YWJsZSB0cmVlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXREZWJ1Z0hUTUwoKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IGhlYWRlclN0eWxlID0gJ2ZvbnQtd2VpZ2h0OiBib2xkOyBmb250LXNpemU6IDEyMCU7IG1hcmdpbi10b3A6IDVweDsnO1xyXG5cclxuICAgIGxldCBkZXB0aCA9IDA7XHJcblxyXG4gICAgbGV0IHJlc3VsdCA9ICcnO1xyXG5cclxuICAgIHJlc3VsdCArPSBgPGRpdiBzdHlsZT1cIiR7aGVhZGVyU3R5bGV9XCI+RGlzcGxheSAoJHt0aGlzLmlkfSkgU3VtbWFyeTwvZGl2PmA7XHJcbiAgICByZXN1bHQgKz0gYCR7dGhpcy5zaXplLnRvU3RyaW5nKCl9IGZyYW1lOiR7dGhpcy5fZnJhbWVJZH0gaW5wdXQ6JHshIXRoaXMuX2lucHV0fSBjdXJzb3I6JHt0aGlzLl9sYXN0Q3Vyc29yfTxici8+YDtcclxuXHJcbiAgICBmdW5jdGlvbiBub2RlQ291bnQoIG5vZGU6IE5vZGUgKTogbnVtYmVyIHtcclxuICAgICAgbGV0IGNvdW50ID0gMTsgLy8gZm9yIHVzXHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgY291bnQgKz0gbm9kZUNvdW50KCBub2RlLmNoaWxkcmVuWyBpIF0gKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gY291bnQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmVzdWx0ICs9IGBOb2RlczogJHtub2RlQ291bnQoIHRoaXMuX3Jvb3ROb2RlICl9PGJyLz5gO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluc3RhbmNlQ291bnQoIGluc3RhbmNlOiBJbnN0YW5jZSApOiBudW1iZXIge1xyXG4gICAgICBsZXQgY291bnQgPSAxOyAvLyBmb3IgdXNcclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgaW5zdGFuY2UuY2hpbGRyZW4ubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgY291bnQgKz0gaW5zdGFuY2VDb3VudCggaW5zdGFuY2UuY2hpbGRyZW5bIGkgXSApO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBjb3VudDtcclxuICAgIH1cclxuXHJcbiAgICByZXN1bHQgKz0gdGhpcy5fYmFzZUluc3RhbmNlID8gKCBgSW5zdGFuY2VzOiAke2luc3RhbmNlQ291bnQoIHRoaXMuX2Jhc2VJbnN0YW5jZSApfTxici8+YCApIDogJyc7XHJcblxyXG4gICAgZnVuY3Rpb24gZHJhd2FibGVDb3VudCggZHJhd2FibGU6IERyYXdhYmxlICk6IG51bWJlciB7XHJcbiAgICAgIGxldCBjb3VudCA9IDE7IC8vIGZvciB1c1xyXG4gICAgICBpZiAoICggZHJhd2FibGUgYXMgdW5rbm93biBhcyBCYWNrYm9uZURyYXdhYmxlICkuYmxvY2tzICkge1xyXG4gICAgICAgIC8vIHdlJ3JlIGEgYmFja2JvbmVcclxuICAgICAgICBfLmVhY2goICggZHJhd2FibGUgYXMgdW5rbm93biBhcyBCYWNrYm9uZURyYXdhYmxlICkuYmxvY2tzLCBjaGlsZERyYXdhYmxlID0+IHtcclxuICAgICAgICAgIGNvdW50ICs9IGRyYXdhYmxlQ291bnQoIGNoaWxkRHJhd2FibGUgKTtcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoICggZHJhd2FibGUgYXMgdW5rbm93biBhcyBCbG9jayApLmZpcnN0RHJhd2FibGUgJiYgKCBkcmF3YWJsZSBhcyB1bmtub3duIGFzIEJsb2NrICkubGFzdERyYXdhYmxlICkge1xyXG4gICAgICAgIC8vIHdlJ3JlIGEgYmxvY2tcclxuICAgICAgICBmb3IgKCBsZXQgY2hpbGREcmF3YWJsZSA9ICggZHJhd2FibGUgYXMgdW5rbm93biBhcyBCbG9jayApLmZpcnN0RHJhd2FibGU7IGNoaWxkRHJhd2FibGUgIT09ICggZHJhd2FibGUgYXMgdW5rbm93biBhcyBCbG9jayApLmxhc3REcmF3YWJsZTsgY2hpbGREcmF3YWJsZSA9IGNoaWxkRHJhd2FibGUubmV4dERyYXdhYmxlICkge1xyXG4gICAgICAgICAgY291bnQgKz0gZHJhd2FibGVDb3VudCggY2hpbGREcmF3YWJsZSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb3VudCArPSBkcmF3YWJsZUNvdW50KCAoIGRyYXdhYmxlIGFzIHVua25vd24gYXMgQmxvY2sgKS5sYXN0RHJhd2FibGUhICk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGNvdW50O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgVE9ETyBCYWNrYm9uZURyYXdhYmxlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICByZXN1bHQgKz0gdGhpcy5fcm9vdEJhY2tib25lID8gKCBgRHJhd2FibGVzOiAke2RyYXdhYmxlQ291bnQoIHRoaXMuX3Jvb3RCYWNrYm9uZSApfTxici8+YCApIDogJyc7XHJcblxyXG4gICAgY29uc3QgZHJhd2FibGVDb3VudE1hcDogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9OyAvLyB7c3RyaW5nfSBkcmF3YWJsZSBjb25zdHJ1Y3RvciBuYW1lID0+IHtudW1iZXJ9IGNvdW50IG9mIHNlZW5cclxuICAgIC8vIGluY3JlbWVudCB0aGUgY291bnQgaW4gb3VyIG1hcFxyXG4gICAgZnVuY3Rpb24gY291bnRSZXRhaW5lZERyYXdhYmxlKCBkcmF3YWJsZTogRHJhd2FibGUgKTogdm9pZCB7XHJcbiAgICAgIGNvbnN0IG5hbWUgPSBkcmF3YWJsZS5jb25zdHJ1Y3Rvci5uYW1lO1xyXG4gICAgICBpZiAoIGRyYXdhYmxlQ291bnRNYXBbIG5hbWUgXSApIHtcclxuICAgICAgICBkcmF3YWJsZUNvdW50TWFwWyBuYW1lIF0rKztcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBkcmF3YWJsZUNvdW50TWFwWyBuYW1lIF0gPSAxO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmV0YWluZWREcmF3YWJsZUNvdW50KCBpbnN0YW5jZTogSW5zdGFuY2UgKTogbnVtYmVyIHtcclxuICAgICAgbGV0IGNvdW50ID0gMDtcclxuICAgICAgaWYgKCBpbnN0YW5jZS5zZWxmRHJhd2FibGUgKSB7XHJcbiAgICAgICAgY291bnRSZXRhaW5lZERyYXdhYmxlKCBpbnN0YW5jZS5zZWxmRHJhd2FibGUgKTtcclxuICAgICAgICBjb3VudCsrO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggaW5zdGFuY2UuZ3JvdXBEcmF3YWJsZSApIHtcclxuICAgICAgICBjb3VudFJldGFpbmVkRHJhd2FibGUoIGluc3RhbmNlLmdyb3VwRHJhd2FibGUgKTtcclxuICAgICAgICBjb3VudCsrO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggaW5zdGFuY2Uuc2hhcmVkQ2FjaGVEcmF3YWJsZSApIHtcclxuICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIFRPRE8gSW5zdGFuY2UgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgICBjb3VudFJldGFpbmVkRHJhd2FibGUoIGluc3RhbmNlLnNoYXJlZENhY2hlRHJhd2FibGUgKTtcclxuICAgICAgICBjb3VudCsrO1xyXG4gICAgICB9XHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGluc3RhbmNlLmNoaWxkcmVuLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIGNvdW50ICs9IHJldGFpbmVkRHJhd2FibGVDb3VudCggaW5zdGFuY2UuY2hpbGRyZW5bIGkgXSApO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBjb3VudDtcclxuICAgIH1cclxuXHJcbiAgICByZXN1bHQgKz0gdGhpcy5fYmFzZUluc3RhbmNlID8gKCBgUmV0YWluZWQgRHJhd2FibGVzOiAke3JldGFpbmVkRHJhd2FibGVDb3VudCggdGhpcy5fYmFzZUluc3RhbmNlICl9PGJyLz5gICkgOiAnJztcclxuICAgIGZvciAoIGNvbnN0IGRyYXdhYmxlTmFtZSBpbiBkcmF3YWJsZUNvdW50TWFwICkge1xyXG4gICAgICByZXN1bHQgKz0gYCZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwOyR7ZHJhd2FibGVOYW1lfTogJHtkcmF3YWJsZUNvdW50TWFwWyBkcmF3YWJsZU5hbWUgXX08YnIvPmA7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYmxvY2tTdW1tYXJ5KCBibG9jazogQmxvY2sgKTogc3RyaW5nIHtcclxuICAgICAgLy8gZW5zdXJlIHdlIGFyZSBhIGJsb2NrXHJcbiAgICAgIGlmICggIWJsb2NrLmZpcnN0RHJhd2FibGUgfHwgIWJsb2NrLmxhc3REcmF3YWJsZSApIHtcclxuICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgVE9ETyBkaXNwbGF5IHN0dWZmIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAgIGNvbnN0IGhhc0JhY2tib25lID0gYmxvY2suZG9tRHJhd2FibGUgJiYgYmxvY2suZG9tRHJhd2FibGUuYmxvY2tzO1xyXG5cclxuICAgICAgbGV0IGRpdiA9IGA8ZGl2IHN0eWxlPVwibWFyZ2luLWxlZnQ6ICR7ZGVwdGggKiAyMH1weFwiPmA7XHJcblxyXG4gICAgICBkaXYgKz0gYmxvY2sudG9TdHJpbmcoKTtcclxuICAgICAgaWYgKCAhaGFzQmFja2JvbmUgKSB7XHJcbiAgICAgICAgZGl2ICs9IGAgKCR7YmxvY2suZHJhd2FibGVDb3VudH0gZHJhd2FibGVzKWA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGRpdiArPSAnPC9kaXY+JztcclxuXHJcbiAgICAgIGRlcHRoICs9IDE7XHJcbiAgICAgIGlmICggaGFzQmFja2JvbmUgKSB7XHJcbiAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBUT0RPIGRpc3BsYXkgc3R1ZmYgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgICBmb3IgKCBsZXQgayA9IDA7IGsgPCBibG9jay5kb21EcmF3YWJsZS5ibG9ja3MubGVuZ3RoOyBrKysgKSB7XHJcbiAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIFRPRE8gZGlzcGxheSBzdHVmZiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICAgICAgZGl2ICs9IGJsb2NrU3VtbWFyeSggYmxvY2suZG9tRHJhd2FibGUuYmxvY2tzWyBrIF0gKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZGVwdGggLT0gMTtcclxuXHJcbiAgICAgIHJldHVybiBkaXY7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0aGlzLl9yb290QmFja2JvbmUgKSB7XHJcbiAgICAgIHJlc3VsdCArPSBgPGRpdiBzdHlsZT1cIiR7aGVhZGVyU3R5bGV9XCI+QmxvY2sgU3VtbWFyeTwvZGl2PmA7XHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuX3Jvb3RCYWNrYm9uZS5ibG9ja3MubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgcmVzdWx0ICs9IGJsb2NrU3VtbWFyeSggdGhpcy5fcm9vdEJhY2tib25lLmJsb2Nrc1sgaSBdICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpbnN0YW5jZVN1bW1hcnkoIGluc3RhbmNlOiBJbnN0YW5jZSApOiBzdHJpbmcge1xyXG4gICAgICBsZXQgaVN1bW1hcnkgPSAnJztcclxuXHJcbiAgICAgIGZ1bmN0aW9uIGFkZFF1YWxpZmllciggdGV4dDogc3RyaW5nICk6IHZvaWQge1xyXG4gICAgICAgIGlTdW1tYXJ5ICs9IGAgPHNwYW4gc3R5bGU9XCJjb2xvcjogIzAwOFwiPiR7dGV4dH08L3NwYW4+YDtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3Qgbm9kZSA9IGluc3RhbmNlLm5vZGUhO1xyXG5cclxuICAgICAgaVN1bW1hcnkgKz0gaW5zdGFuY2UuaWQ7XHJcbiAgICAgIGlTdW1tYXJ5ICs9IGAgJHtub2RlLmNvbnN0cnVjdG9yLm5hbWUgPyBub2RlLmNvbnN0cnVjdG9yLm5hbWUgOiAnPyd9YDtcclxuICAgICAgaVN1bW1hcnkgKz0gYCA8c3BhbiBzdHlsZT1cImZvbnQtd2VpZ2h0OiAke25vZGUuaXNQYWludGVkKCkgPyAnYm9sZCcgOiAnbm9ybWFsJ31cIj4ke25vZGUuaWR9PC9zcGFuPmA7XHJcbiAgICAgIGlTdW1tYXJ5ICs9IG5vZGUuZ2V0RGVidWdIVE1MRXh0cmFzKCk7XHJcblxyXG4gICAgICBpZiAoICFub2RlLnZpc2libGUgKSB7XHJcbiAgICAgICAgYWRkUXVhbGlmaWVyKCAnaW52aXMnICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCAhaW5zdGFuY2UudmlzaWJsZSApIHtcclxuICAgICAgICBhZGRRdWFsaWZpZXIoICdJLWludmlzJyApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggIWluc3RhbmNlLnJlbGF0aXZlVmlzaWJsZSApIHtcclxuICAgICAgICBhZGRRdWFsaWZpZXIoICdJLXJlbC1pbnZpcycgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoICFpbnN0YW5jZS5zZWxmVmlzaWJsZSApIHtcclxuICAgICAgICBhZGRRdWFsaWZpZXIoICdJLXNlbGYtaW52aXMnICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCAhaW5zdGFuY2UuZml0dGFiaWxpdHkuYW5jZXN0b3JzRml0dGFibGUgKSB7XHJcbiAgICAgICAgYWRkUXVhbGlmaWVyKCAnbm9maXQtYW5jZXN0b3InICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCAhaW5zdGFuY2UuZml0dGFiaWxpdHkuc2VsZkZpdHRhYmxlICkge1xyXG4gICAgICAgIGFkZFF1YWxpZmllciggJ25vZml0LXNlbGYnICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBub2RlLnBpY2thYmxlID09PSB0cnVlICkge1xyXG4gICAgICAgIGFkZFF1YWxpZmllciggJ3BpY2thYmxlJyApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggbm9kZS5waWNrYWJsZSA9PT0gZmFsc2UgKSB7XHJcbiAgICAgICAgYWRkUXVhbGlmaWVyKCAndW5waWNrYWJsZScgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIGluc3RhbmNlLnRyYWlsIS5pc1BpY2thYmxlKCkgKSB7XHJcbiAgICAgICAgYWRkUXVhbGlmaWVyKCAnPHNwYW4gc3R5bGU9XCJjb2xvcjogIzgwOFwiPmhpdHM8L3NwYW4+JyApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggbm9kZS5nZXRFZmZlY3RpdmVDdXJzb3IoKSApIHtcclxuICAgICAgICBhZGRRdWFsaWZpZXIoIGBlZmZlY3RpdmVDdXJzb3I6JHtub2RlLmdldEVmZmVjdGl2ZUN1cnNvcigpfWAgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIG5vZGUuY2xpcEFyZWEgKSB7XHJcbiAgICAgICAgYWRkUXVhbGlmaWVyKCAnY2xpcEFyZWEnICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBub2RlLm1vdXNlQXJlYSApIHtcclxuICAgICAgICBhZGRRdWFsaWZpZXIoICdtb3VzZUFyZWEnICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBub2RlLnRvdWNoQXJlYSApIHtcclxuICAgICAgICBhZGRRdWFsaWZpZXIoICd0b3VjaEFyZWEnICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBub2RlLmdldElucHV0TGlzdGVuZXJzKCkubGVuZ3RoICkge1xyXG4gICAgICAgIGFkZFF1YWxpZmllciggJ2lucHV0TGlzdGVuZXJzJyApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggbm9kZS5nZXRSZW5kZXJlcigpICkge1xyXG4gICAgICAgIGFkZFF1YWxpZmllciggYHJlbmRlcmVyOiR7bm9kZS5nZXRSZW5kZXJlcigpfWAgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIG5vZGUuaXNMYXllclNwbGl0KCkgKSB7XHJcbiAgICAgICAgYWRkUXVhbGlmaWVyKCAnbGF5ZXJTcGxpdCcgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIG5vZGUub3BhY2l0eSA8IDEgKSB7XHJcbiAgICAgICAgYWRkUXVhbGlmaWVyKCBgb3BhY2l0eToke25vZGUub3BhY2l0eX1gICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBub2RlLmRpc2FibGVkT3BhY2l0eSA8IDEgKSB7XHJcbiAgICAgICAgYWRkUXVhbGlmaWVyKCBgZGlzYWJsZWRPcGFjaXR5OiR7bm9kZS5kaXNhYmxlZE9wYWNpdHl9YCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIG5vZGUuX2JvdW5kc0V2ZW50Q291bnQgPiAwICkge1xyXG4gICAgICAgIGFkZFF1YWxpZmllciggYDxzcGFuIHN0eWxlPVwiY29sb3I6ICM4MDBcIj5ib3VuZHNMaXN0ZW46JHtub2RlLl9ib3VuZHNFdmVudENvdW50fToke25vZGUuX2JvdW5kc0V2ZW50U2VsZkNvdW50fTwvc3Bhbj5gICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGxldCB0cmFuc2Zvcm1UeXBlID0gJyc7XHJcbiAgICAgIHN3aXRjaCggbm9kZS50cmFuc2Zvcm0uZ2V0TWF0cml4KCkudHlwZSApIHtcclxuICAgICAgICBjYXNlIE1hdHJpeDNUeXBlLklERU5USVRZOlxyXG4gICAgICAgICAgdHJhbnNmb3JtVHlwZSA9ICcnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBNYXRyaXgzVHlwZS5UUkFOU0xBVElPTl8yRDpcclxuICAgICAgICAgIHRyYW5zZm9ybVR5cGUgPSAndHJhbnNsYXRlZCc7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIE1hdHJpeDNUeXBlLlNDQUxJTkc6XHJcbiAgICAgICAgICB0cmFuc2Zvcm1UeXBlID0gJ3NjYWxlJztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgTWF0cml4M1R5cGUuQUZGSU5FOlxyXG4gICAgICAgICAgdHJhbnNmb3JtVHlwZSA9ICdhZmZpbmUnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBNYXRyaXgzVHlwZS5PVEhFUjpcclxuICAgICAgICAgIHRyYW5zZm9ybVR5cGUgPSAnb3RoZXInO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciggYGludmFsaWQgbWF0cml4IHR5cGU6ICR7bm9kZS50cmFuc2Zvcm0uZ2V0TWF0cml4KCkudHlwZX1gICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCB0cmFuc2Zvcm1UeXBlICkge1xyXG4gICAgICAgIGlTdW1tYXJ5ICs9IGAgPHNwYW4gc3R5bGU9XCJjb2xvcjogIzg4ZlwiIHRpdGxlPVwiJHtub2RlLnRyYW5zZm9ybS5nZXRNYXRyaXgoKS50b1N0cmluZygpLnJlcGxhY2UoICdcXG4nLCAnJiMxMDsnICl9XCI+JHt0cmFuc2Zvcm1UeXBlfTwvc3Bhbj5gO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpU3VtbWFyeSArPSBgIDxzcGFuIHN0eWxlPVwiY29sb3I6ICM4ODhcIj5bVHJhaWwgJHtpbnN0YW5jZS50cmFpbCEuaW5kaWNlcy5qb2luKCAnLicgKX1dPC9zcGFuPmA7XHJcbiAgICAgIC8vIGlTdW1tYXJ5ICs9IGAgPHNwYW4gc3R5bGU9XCJjb2xvcjogI2M4OFwiPiR7c3RyKCBpbnN0YW5jZS5zdGF0ZSApfTwvc3Bhbj5gO1xyXG4gICAgICBpU3VtbWFyeSArPSBgIDxzcGFuIHN0eWxlPVwiY29sb3I6ICM4YzhcIj4ke25vZGUuX3JlbmRlcmVyU3VtbWFyeS5iaXRtYXNrLnRvU3RyaW5nKCAxNiApfSR7bm9kZS5fcmVuZGVyZXJCaXRtYXNrICE9PSBSZW5kZXJlci5iaXRtYXNrTm9kZURlZmF1bHQgPyBgICgke25vZGUuX3JlbmRlcmVyQml0bWFzay50b1N0cmluZyggMTYgKX0pYCA6ICcnfTwvc3Bhbj5gO1xyXG5cclxuICAgICAgcmV0dXJuIGlTdW1tYXJ5O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRyYXdhYmxlU3VtbWFyeSggZHJhd2FibGU6IERyYXdhYmxlICk6IHN0cmluZyB7XHJcbiAgICAgIGxldCBkcmF3YWJsZVN0cmluZyA9IGRyYXdhYmxlLnRvU3RyaW5nKCk7XHJcbiAgICAgIGlmICggZHJhd2FibGUudmlzaWJsZSApIHtcclxuICAgICAgICBkcmF3YWJsZVN0cmluZyA9IGA8c3Ryb25nPiR7ZHJhd2FibGVTdHJpbmd9PC9zdHJvbmc+YDtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIGRyYXdhYmxlLmRpcnR5ICkge1xyXG4gICAgICAgIGRyYXdhYmxlU3RyaW5nICs9ICggZHJhd2FibGUuZGlydHkgPyAnIDxzcGFuIHN0eWxlPVwiY29sb3I6ICNjMDA7XCI+W3hdPC9zcGFuPicgOiAnJyApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggIWRyYXdhYmxlLmZpdHRhYmxlICkge1xyXG4gICAgICAgIGRyYXdhYmxlU3RyaW5nICs9ICggZHJhd2FibGUuZGlydHkgPyAnIDxzcGFuIHN0eWxlPVwiY29sb3I6ICMwYzA7XCI+W25vLWZpdF08L3NwYW4+JyA6ICcnICk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGRyYXdhYmxlU3RyaW5nO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHByaW50SW5zdGFuY2VTdWJ0cmVlKCBpbnN0YW5jZTogSW5zdGFuY2UgKTogdm9pZCB7XHJcbiAgICAgIGxldCBkaXYgPSBgPGRpdiBzdHlsZT1cIm1hcmdpbi1sZWZ0OiAke2RlcHRoICogMjB9cHhcIj5gO1xyXG5cclxuICAgICAgZnVuY3Rpb24gYWRkRHJhd2FibGUoIG5hbWU6IHN0cmluZywgZHJhd2FibGU6IERyYXdhYmxlICk6IHZvaWQge1xyXG4gICAgICAgIGRpdiArPSBgIDxzcGFuIHN0eWxlPVwiY29sb3I6ICM4ODhcIj4ke25hbWV9OiR7ZHJhd2FibGVTdW1tYXJ5KCBkcmF3YWJsZSApfTwvc3Bhbj5gO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBkaXYgKz0gaW5zdGFuY2VTdW1tYXJ5KCBpbnN0YW5jZSApO1xyXG5cclxuICAgICAgaW5zdGFuY2Uuc2VsZkRyYXdhYmxlICYmIGFkZERyYXdhYmxlKCAnc2VsZicsIGluc3RhbmNlLnNlbGZEcmF3YWJsZSApO1xyXG4gICAgICBpbnN0YW5jZS5ncm91cERyYXdhYmxlICYmIGFkZERyYXdhYmxlKCAnZ3JvdXAnLCBpbnN0YW5jZS5ncm91cERyYXdhYmxlICk7XHJcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgVE9ETyBJbnN0YW5jZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICBpbnN0YW5jZS5zaGFyZWRDYWNoZURyYXdhYmxlICYmIGFkZERyYXdhYmxlKCAnc2hhcmVkQ2FjaGUnLCBpbnN0YW5jZS5zaGFyZWRDYWNoZURyYXdhYmxlICk7XHJcblxyXG4gICAgICBkaXYgKz0gJzwvZGl2Pic7XHJcbiAgICAgIHJlc3VsdCArPSBkaXY7XHJcblxyXG4gICAgICBkZXB0aCArPSAxO1xyXG4gICAgICBfLmVhY2goIGluc3RhbmNlLmNoaWxkcmVuLCBjaGlsZEluc3RhbmNlID0+IHtcclxuICAgICAgICBwcmludEluc3RhbmNlU3VidHJlZSggY2hpbGRJbnN0YW5jZSApO1xyXG4gICAgICB9ICk7XHJcbiAgICAgIGRlcHRoIC09IDE7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0aGlzLl9iYXNlSW5zdGFuY2UgKSB7XHJcbiAgICAgIHJlc3VsdCArPSBgPGRpdiBzdHlsZT1cIiR7aGVhZGVyU3R5bGV9XCI+Um9vdCBJbnN0YW5jZSBUcmVlPC9kaXY+YDtcclxuICAgICAgcHJpbnRJbnN0YW5jZVN1YnRyZWUoIHRoaXMuX2Jhc2VJbnN0YW5jZSApO1xyXG4gICAgfVxyXG5cclxuICAgIF8uZWFjaCggdGhpcy5fc2hhcmVkQ2FudmFzSW5zdGFuY2VzLCBpbnN0YW5jZSA9PiB7XHJcbiAgICAgIHJlc3VsdCArPSBgPGRpdiBzdHlsZT1cIiR7aGVhZGVyU3R5bGV9XCI+U2hhcmVkIENhbnZhcyBJbnN0YW5jZSBUcmVlPC9kaXY+YDtcclxuICAgICAgcHJpbnRJbnN0YW5jZVN1YnRyZWUoIGluc3RhbmNlICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgZnVuY3Rpb24gcHJpbnREcmF3YWJsZVN1YnRyZWUoIGRyYXdhYmxlOiBEcmF3YWJsZSApOiB2b2lkIHtcclxuICAgICAgbGV0IGRpdiA9IGA8ZGl2IHN0eWxlPVwibWFyZ2luLWxlZnQ6ICR7ZGVwdGggKiAyMH1weFwiPmA7XHJcblxyXG4gICAgICBkaXYgKz0gZHJhd2FibGVTdW1tYXJ5KCBkcmF3YWJsZSApO1xyXG4gICAgICBpZiAoICggZHJhd2FibGUgYXMgdW5rbm93biBhcyBTZWxmRHJhd2FibGUgKS5pbnN0YW5jZSApIHtcclxuICAgICAgICBkaXYgKz0gYCA8c3BhbiBzdHlsZT1cImNvbG9yOiAjMGEwO1wiPigkeyggZHJhd2FibGUgYXMgdW5rbm93biBhcyBTZWxmRHJhd2FibGUgKS5pbnN0YW5jZS50cmFpbC50b1BhdGhTdHJpbmcoKX0pPC9zcGFuPmA7XHJcbiAgICAgICAgZGl2ICs9IGAmbmJzcDsmbmJzcDsmbmJzcDske2luc3RhbmNlU3VtbWFyeSggKCBkcmF3YWJsZSBhcyB1bmtub3duIGFzIFNlbGZEcmF3YWJsZSApLmluc3RhbmNlICl9YDtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggKCBkcmF3YWJsZSBhcyB1bmtub3duIGFzIEJhY2tib25lRHJhd2FibGUgKS5iYWNrYm9uZUluc3RhbmNlICkge1xyXG4gICAgICAgIGRpdiArPSBgIDxzcGFuIHN0eWxlPVwiY29sb3I6ICNhMDA7XCI+KCR7KCBkcmF3YWJsZSBhcyB1bmtub3duIGFzIEJhY2tib25lRHJhd2FibGUgKS5iYWNrYm9uZUluc3RhbmNlLnRyYWlsLnRvUGF0aFN0cmluZygpfSk8L3NwYW4+YDtcclxuICAgICAgICBkaXYgKz0gYCZuYnNwOyZuYnNwOyZuYnNwOyR7aW5zdGFuY2VTdW1tYXJ5KCAoIGRyYXdhYmxlIGFzIHVua25vd24gYXMgQmFja2JvbmVEcmF3YWJsZSApLmJhY2tib25lSW5zdGFuY2UgKX1gO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBkaXYgKz0gJzwvZGl2Pic7XHJcbiAgICAgIHJlc3VsdCArPSBkaXY7XHJcblxyXG4gICAgICBpZiAoICggZHJhd2FibGUgYXMgdW5rbm93biBhcyBCYWNrYm9uZURyYXdhYmxlICkuYmxvY2tzICkge1xyXG4gICAgICAgIC8vIHdlJ3JlIGEgYmFja2JvbmVcclxuICAgICAgICBkZXB0aCArPSAxO1xyXG4gICAgICAgIF8uZWFjaCggKCBkcmF3YWJsZSBhcyB1bmtub3duIGFzIEJhY2tib25lRHJhd2FibGUgKS5ibG9ja3MsIGNoaWxkRHJhd2FibGUgPT4ge1xyXG4gICAgICAgICAgcHJpbnREcmF3YWJsZVN1YnRyZWUoIGNoaWxkRHJhd2FibGUgKTtcclxuICAgICAgICB9ICk7XHJcbiAgICAgICAgZGVwdGggLT0gMTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggKCBkcmF3YWJsZSBhcyB1bmtub3duIGFzIEJsb2NrICkuZmlyc3REcmF3YWJsZSAmJiAoIGRyYXdhYmxlIGFzIHVua25vd24gYXMgQmxvY2sgKS5sYXN0RHJhd2FibGUgKSB7XHJcbiAgICAgICAgLy8gd2UncmUgYSBibG9ja1xyXG4gICAgICAgIGRlcHRoICs9IDE7XHJcbiAgICAgICAgZm9yICggbGV0IGNoaWxkRHJhd2FibGUgPSAoIGRyYXdhYmxlIGFzIHVua25vd24gYXMgQmxvY2sgKS5maXJzdERyYXdhYmxlOyBjaGlsZERyYXdhYmxlICE9PSAoIGRyYXdhYmxlIGFzIHVua25vd24gYXMgQmxvY2sgKS5sYXN0RHJhd2FibGU7IGNoaWxkRHJhd2FibGUgPSBjaGlsZERyYXdhYmxlLm5leHREcmF3YWJsZSApIHtcclxuICAgICAgICAgIHByaW50RHJhd2FibGVTdWJ0cmVlKCBjaGlsZERyYXdhYmxlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaW50RHJhd2FibGVTdWJ0cmVlKCAoIGRyYXdhYmxlIGFzIHVua25vd24gYXMgQmxvY2sgKS5sYXN0RHJhd2FibGUhICk7IC8vIHdhc24ndCBoaXQgaW4gb3VyIHNpbXBsaWZpZWQgKGFuZCBzYWZlcikgbG9vcFxyXG4gICAgICAgIGRlcHRoIC09IDE7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHRoaXMuX3Jvb3RCYWNrYm9uZSApIHtcclxuICAgICAgcmVzdWx0ICs9ICc8ZGl2IHN0eWxlPVwiZm9udC13ZWlnaHQ6IGJvbGQ7XCI+Um9vdCBEcmF3YWJsZSBUcmVlPC9kaXY+JztcclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBUT0RPIEJhY2tib25lRHJhd2FibGUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgcHJpbnREcmF3YWJsZVN1YnRyZWUoIHRoaXMuX3Jvb3RCYWNrYm9uZSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vT0hUV08gVE9ETzogYWRkIHNoYXJlZCBjYWNoZSBkcmF3YWJsZSB0cmVlcyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBnZXREZWJ1Z0hUTUwoKSBpbmZvcm1hdGlvbiwgYnV0IHdyYXBwZWQgaW50byBhIGZ1bGwgSFRNTCBwYWdlIGluY2x1ZGVkIGluIGEgZGF0YSBVUkkuXHJcbiAgICovXHJcbiAgcHVibGljIGdldERlYnVnVVJJKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gYGRhdGE6dGV4dC9odG1sO2NoYXJzZXQ9dXRmLTgsJHtlbmNvZGVVUklDb21wb25lbnQoXHJcbiAgICAgIGAkeyc8IURPQ1RZUEUgaHRtbD4nICtcclxuICAgICAgJzxodG1sIGxhbmc9XCJlblwiPicgK1xyXG4gICAgICAnPGhlYWQ+PHRpdGxlPlNjZW5lcnkgRGVidWcgU25hcHNob3Q8L3RpdGxlPjwvaGVhZD4nICtcclxuICAgICAgJzxib2R5IHN0eWxlPVwiZm9udC1zaXplOiAxMnB4O1wiPid9JHt0aGlzLmdldERlYnVnSFRNTCgpfTwvYm9keT5gICtcclxuICAgICAgJzwvaHRtbD4nXHJcbiAgICApfWA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBdHRlbXB0cyB0byBvcGVuIGEgcG9wdXAgd2l0aCB0aGUgZ2V0RGVidWdIVE1MKCkgaW5mb3JtYXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIHBvcHVwRGVidWcoKTogdm9pZCB7XHJcbiAgICB3aW5kb3cub3BlbiggdGhpcy5nZXREZWJ1Z1VSSSgpICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBdHRlbXB0cyB0byBvcGVuIGFuIGlmcmFtZSBwb3B1cCB3aXRoIHRoZSBnZXREZWJ1Z0hUTUwoKSBpbmZvcm1hdGlvbiBpbiB0aGUgc2FtZSB3aW5kb3cuIFRoaXMgaXMgc2ltaWxhciB0b1xyXG4gICAqIHBvcHVwRGVidWcoKSwgYnV0IHNob3VsZCB3b3JrIGluIGJyb3dzZXJzIHRoYXQgYmxvY2sgcG9wdXBzLCBvciBwcmV2ZW50IHRoYXQgdHlwZSBvZiBkYXRhIFVSSSBiZWluZyBvcGVuZWQuXHJcbiAgICovXHJcbiAgcHVibGljIGlmcmFtZURlYnVnKCk6IHZvaWQge1xyXG4gICAgY29uc3QgaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2lmcmFtZScgKTtcclxuICAgIGlmcmFtZS53aWR0aCA9ICcnICsgd2luZG93LmlubmVyV2lkdGg7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYmFkLXNpbS10ZXh0XHJcbiAgICBpZnJhbWUuaGVpZ2h0ID0gJycgKyB3aW5kb3cuaW5uZXJIZWlnaHQ7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYmFkLXNpbS10ZXh0XHJcbiAgICBpZnJhbWUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xyXG4gICAgaWZyYW1lLnN0eWxlLmxlZnQgPSAnMCc7XHJcbiAgICBpZnJhbWUuc3R5bGUudG9wID0gJzAnO1xyXG4gICAgaWZyYW1lLnN0eWxlLnpJbmRleCA9ICcxMDAwMCc7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCBpZnJhbWUgKTtcclxuXHJcbiAgICBpZnJhbWUuY29udGVudFdpbmRvdyEuZG9jdW1lbnQub3BlbigpO1xyXG4gICAgaWZyYW1lLmNvbnRlbnRXaW5kb3chLmRvY3VtZW50LndyaXRlKCB0aGlzLmdldERlYnVnSFRNTCgpICk7XHJcbiAgICBpZnJhbWUuY29udGVudFdpbmRvdyEuZG9jdW1lbnQuY2xvc2UoKTtcclxuXHJcbiAgICBpZnJhbWUuY29udGVudFdpbmRvdyEuZG9jdW1lbnQuYm9keS5zdHlsZS5iYWNrZ3JvdW5kID0gJ3doaXRlJztcclxuXHJcbiAgICBjb25zdCBjbG9zZUJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdidXR0b24nICk7XHJcbiAgICBjbG9zZUJ1dHRvbi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcbiAgICBjbG9zZUJ1dHRvbi5zdHlsZS50b3AgPSAnMCc7XHJcbiAgICBjbG9zZUJ1dHRvbi5zdHlsZS5yaWdodCA9ICcwJztcclxuICAgIGNsb3NlQnV0dG9uLnN0eWxlLnpJbmRleCA9ICcxMDAwMSc7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCBjbG9zZUJ1dHRvbiApO1xyXG5cclxuICAgIGNsb3NlQnV0dG9uLnRleHRDb250ZW50ID0gJ2Nsb3NlJztcclxuXHJcbiAgICAvLyBBIG5vcm1hbCAnY2xpY2snIGV2ZW50IGxpc3RlbmVyIGRvZXNuJ3Qgc2VlbSB0byBiZSB3b3JraW5nLiBUaGlzIGlzIGxlc3MtdGhhbi1pZGVhbC5cclxuICAgIFsgJ3BvaW50ZXJkb3duJywgJ2NsaWNrJywgJ3RvdWNoZG93bicgXS5mb3JFYWNoKCBldmVudFR5cGUgPT4ge1xyXG4gICAgICBjbG9zZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCBldmVudFR5cGUsICgpID0+IHtcclxuICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKCBpZnJhbWUgKTtcclxuICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKCBjbG9zZUJ1dHRvbiApO1xyXG4gICAgICB9LCB0cnVlICk7XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0UERPTURlYnVnSFRNTCgpOiBzdHJpbmcge1xyXG4gICAgbGV0IHJlc3VsdCA9ICcnO1xyXG5cclxuICAgIGNvbnN0IGhlYWRlclN0eWxlID0gJ2ZvbnQtd2VpZ2h0OiBib2xkOyBmb250LXNpemU6IDEyMCU7IG1hcmdpbi10b3A6IDVweDsnO1xyXG4gICAgY29uc3QgaW5kZW50ID0gJyZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwOyc7XHJcblxyXG4gICAgcmVzdWx0ICs9IGA8ZGl2IHN0eWxlPVwiJHtoZWFkZXJTdHlsZX1cIj5BY2Nlc3NpYmxlIEluc3RhbmNlczwvZGl2Pjxicj5gO1xyXG5cclxuICAgIHJlY3Vyc2UoIHRoaXMuX3Jvb3RQRE9NSW5zdGFuY2UhLCAnJyApO1xyXG5cclxuICAgIGZ1bmN0aW9uIHJlY3Vyc2UoIGluc3RhbmNlOiBQRE9NSW5zdGFuY2UsIGluZGVudGF0aW9uOiBzdHJpbmcgKTogdm9pZCB7XHJcbiAgICAgIHJlc3VsdCArPSBgJHtpbmRlbnRhdGlvbiArIGVzY2FwZUhUTUwoIGAke2luc3RhbmNlLmlzUm9vdEluc3RhbmNlID8gJycgOiBpbnN0YW5jZS5ub2RlIS50YWdOYW1lfSAke2luc3RhbmNlLnRvU3RyaW5nKCl9YCApfTxicj5gO1xyXG4gICAgICBpbnN0YW5jZS5jaGlsZHJlbi5mb3JFYWNoKCAoIGNoaWxkOiBQRE9NSW5zdGFuY2UgKSA9PiB7XHJcbiAgICAgICAgcmVjdXJzZSggY2hpbGQsIGluZGVudGF0aW9uICsgaW5kZW50ICk7XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuXHJcbiAgICByZXN1bHQgKz0gYDxicj48ZGl2IHN0eWxlPVwiJHtoZWFkZXJTdHlsZX1cIj5QYXJhbGxlbCBET008L2Rpdj48YnI+YDtcclxuXHJcbiAgICBsZXQgcGFyYWxsZWxET00gPSB0aGlzLl9yb290UERPTUluc3RhbmNlIS5wZWVyIS5wcmltYXJ5U2libGluZyEub3V0ZXJIVE1MO1xyXG4gICAgcGFyYWxsZWxET00gPSBwYXJhbGxlbERPTS5yZXBsYWNlKCAvPjwvZywgJz5cXG48JyApO1xyXG4gICAgY29uc3QgbGluZXMgPSBwYXJhbGxlbERPTS5zcGxpdCggJ1xcbicgKTtcclxuXHJcbiAgICBsZXQgaW5kZW50YXRpb24gPSAnJztcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBsaW5lID0gbGluZXNbIGkgXTtcclxuICAgICAgY29uc3QgaXNFbmRUYWcgPSBsaW5lLnN0YXJ0c1dpdGgoICc8LycgKTtcclxuXHJcbiAgICAgIGlmICggaXNFbmRUYWcgKSB7XHJcbiAgICAgICAgaW5kZW50YXRpb24gPSBpbmRlbnRhdGlvbi5zbGljZSggaW5kZW50Lmxlbmd0aCApO1xyXG4gICAgICB9XHJcbiAgICAgIHJlc3VsdCArPSBgJHtpbmRlbnRhdGlvbiArIGVzY2FwZUhUTUwoIGxpbmUgKX08YnI+YDtcclxuICAgICAgaWYgKCAhaXNFbmRUYWcgKSB7XHJcbiAgICAgICAgaW5kZW50YXRpb24gKz0gaW5kZW50O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV2lsbCBhdHRlbXB0IHRvIGNhbGwgY2FsbGJhY2soIHtzdHJpbmd9IGRhdGFVUkkgKSB3aXRoIHRoZSByYXN0ZXJpemF0aW9uIG9mIHRoZSBlbnRpcmUgRGlzcGxheSdzIERPTSBzdHJ1Y3R1cmUsXHJcbiAgICogdXNlZCBmb3IgaW50ZXJuYWwgdGVzdGluZy4gV2lsbCBjYWxsLWJhY2sgbnVsbCBpZiB0aGVyZSB3YXMgYW4gZXJyb3JcclxuICAgKlxyXG4gICAqIE9ubHkgdGVzdGVkIG9uIHJlY2VudCBDaHJvbWUgYW5kIEZpcmVmb3gsIG5vdCByZWNvbW1lbmRlZCBmb3IgZ2VuZXJhbCB1c2UuIEd1YXJhbnRlZWQgbm90IHRvIHdvcmsgZm9yIElFIDw9IDEwLlxyXG4gICAqXHJcbiAgICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8zOTQgZm9yIHNvbWUgZGV0YWlscy5cclxuICAgKi9cclxuICBwdWJsaWMgZm9yZWlnbk9iamVjdFJhc3Rlcml6YXRpb24oIGNhbGxiYWNrOiAoIHVybDogc3RyaW5nIHwgbnVsbCApID0+IHZvaWQgKTogdm9pZCB7XHJcbiAgICAvLyBTY2FuIG91ciBkcmF3YWJsZSB0cmVlIGZvciBDYW52YXNlcy4gV2UnbGwgcmFzdGVyaXplIHRoZW0gaGVyZSAodG8gZGF0YSBVUkxzKSBzbyB3ZSBjYW4gcmVwbGFjZSB0aGVtIGxhdGVyIGluXHJcbiAgICAvLyB0aGUgSFRNTCB0cmVlICh3aXRoIGltYWdlcykgYmVmb3JlIHB1dHRpbmcgdGhhdCBpbiB0aGUgZm9yZWlnbk9iamVjdC4gVGhhdCB3YXksIHdlIGNhbiBhY3R1YWxseSBkaXNwbGF5XHJcbiAgICAvLyB0aGluZ3MgcmVuZGVyZWQgaW4gQ2FudmFzIGluIG91ciByYXN0ZXJpemF0aW9uLlxyXG4gICAgY29uc3QgY2FudmFzVXJsTWFwOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XHJcblxyXG4gICAgbGV0IHVua25vd25JZHMgPSAwO1xyXG5cclxuICAgIGZ1bmN0aW9uIGFkZENhbnZhcyggY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCApOiB2b2lkIHtcclxuICAgICAgaWYgKCAhY2FudmFzLmlkICkge1xyXG4gICAgICAgIGNhbnZhcy5pZCA9IGB1bmtub3duLWNhbnZhcy0ke3Vua25vd25JZHMrK31gO1xyXG4gICAgICB9XHJcbiAgICAgIGNhbnZhc1VybE1hcFsgY2FudmFzLmlkIF0gPSBjYW52YXMudG9EYXRhVVJMKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc2NhbkZvckNhbnZhc2VzKCBkcmF3YWJsZTogRHJhd2FibGUgKTogdm9pZCB7XHJcbiAgICAgIGlmICggZHJhd2FibGUgaW5zdGFuY2VvZiBCYWNrYm9uZURyYXdhYmxlICkge1xyXG4gICAgICAgIC8vIHdlJ3JlIGEgYmFja2JvbmVcclxuICAgICAgICBfLmVhY2goIGRyYXdhYmxlLmJsb2NrcywgY2hpbGREcmF3YWJsZSA9PiB7XHJcbiAgICAgICAgICBzY2FuRm9yQ2FudmFzZXMoIGNoaWxkRHJhd2FibGUgKTtcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIGRyYXdhYmxlIGluc3RhbmNlb2YgQmxvY2sgJiYgZHJhd2FibGUuZmlyc3REcmF3YWJsZSAmJiBkcmF3YWJsZS5sYXN0RHJhd2FibGUgKSB7XHJcbiAgICAgICAgLy8gd2UncmUgYSBibG9ja1xyXG4gICAgICAgIGZvciAoIGxldCBjaGlsZERyYXdhYmxlID0gZHJhd2FibGUuZmlyc3REcmF3YWJsZTsgY2hpbGREcmF3YWJsZSAhPT0gZHJhd2FibGUubGFzdERyYXdhYmxlOyBjaGlsZERyYXdhYmxlID0gY2hpbGREcmF3YWJsZS5uZXh0RHJhd2FibGUgKSB7XHJcbiAgICAgICAgICBzY2FuRm9yQ2FudmFzZXMoIGNoaWxkRHJhd2FibGUgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc2NhbkZvckNhbnZhc2VzKCBkcmF3YWJsZS5sYXN0RHJhd2FibGUgKTsgLy8gd2Fzbid0IGhpdCBpbiBvdXIgc2ltcGxpZmllZCAoYW5kIHNhZmVyKSBsb29wXHJcblxyXG4gICAgICAgIGlmICggKCBkcmF3YWJsZSBpbnN0YW5jZW9mIENhbnZhc0Jsb2NrIHx8IGRyYXdhYmxlIGluc3RhbmNlb2YgV2ViR0xCbG9jayApICYmIGRyYXdhYmxlLmNhbnZhcyAmJiBkcmF3YWJsZS5jYW52YXMgaW5zdGFuY2VvZiB3aW5kb3cuSFRNTENhbnZhc0VsZW1lbnQgKSB7XHJcbiAgICAgICAgICBhZGRDYW52YXMoIGRyYXdhYmxlLmNhbnZhcyApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCBET01EcmF3YWJsZSAmJiBkcmF3YWJsZSBpbnN0YW5jZW9mIERPTURyYXdhYmxlICkge1xyXG4gICAgICAgIGlmICggZHJhd2FibGUuZG9tRWxlbWVudCBpbnN0YW5jZW9mIHdpbmRvdy5IVE1MQ2FudmFzRWxlbWVudCApIHtcclxuICAgICAgICAgIGFkZENhbnZhcyggZHJhd2FibGUuZG9tRWxlbWVudCApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKCBkcmF3YWJsZS5kb21FbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCAnY2FudmFzJyApLCBjYW52YXMgPT4ge1xyXG4gICAgICAgICAgYWRkQ2FudmFzKCBjYW52YXMgKTtcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIFRPRE8gQmFja2JvbmVEcmF3YWJsZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgc2NhbkZvckNhbnZhc2VzKCB0aGlzLl9yb290QmFja2JvbmUhICk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGEgbmV3IGRvY3VtZW50LCBzbyB0aGF0IHdlIGNhbiAoMSkgc2VyaWFsaXplIGl0IHRvIFhIVE1MLCBhbmQgKDIpIG1hbmlwdWxhdGUgaXQgaW5kZXBlbmRlbnRseS5cclxuICAgIC8vIEluc3BpcmVkIGJ5IGh0dHA6Ly9jYnVyZ21lci5naXRodWIuaW8vcmFzdGVyaXplSFRNTC5qcy9cclxuICAgIGNvbnN0IGRvYyA9IGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZUhUTUxEb2N1bWVudCggJycgKTtcclxuICAgIGRvYy5kb2N1bWVudEVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5kb21FbGVtZW50Lm91dGVySFRNTDtcclxuICAgIGRvYy5kb2N1bWVudEVsZW1lbnQuc2V0QXR0cmlidXRlKCAneG1sbnMnLCBkb2MuZG9jdW1lbnRFbGVtZW50Lm5hbWVzcGFjZVVSSSEgKTtcclxuXHJcbiAgICAvLyBIaWRlIHRoZSBQRE9NXHJcbiAgICBkb2MuZG9jdW1lbnRFbGVtZW50LmFwcGVuZENoaWxkKCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnc3R5bGUnICkgKS5pbm5lckhUTUwgPSBgLiR7UERPTVNpYmxpbmdTdHlsZS5ST09UX0NMQVNTX05BTUV9IHsgZGlzcGxheTpub25lOyB9IGA7XHJcblxyXG4gICAgLy8gUmVwbGFjZSBlYWNoIDxjYW52YXM+IHdpdGggYW4gPGltZz4gdGhhdCBoYXMgc3JjPWNhbnZhcy50b0RhdGFVUkwoKSBhbmQgdGhlIHNhbWUgc3R5bGVcclxuICAgIGxldCBkaXNwbGF5Q2FudmFzZXM6IEhUTUxFbGVtZW50W10gfCBIVE1MQ29sbGVjdGlvbiA9IGRvYy5kb2N1bWVudEVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoICdjYW52YXMnICk7XHJcbiAgICBkaXNwbGF5Q2FudmFzZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCggZGlzcGxheUNhbnZhc2VzICk7IC8vIGRvbid0IHVzZSBhIGxpdmUgSFRNTENvbGxlY3Rpb24gY29weSFcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGRpc3BsYXlDYW52YXNlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgZGlzcGxheUNhbnZhcyA9IGRpc3BsYXlDYW52YXNlc1sgaSBdO1xyXG5cclxuICAgICAgY29uc3QgY3NzVGV4dCA9IGRpc3BsYXlDYW52YXMuc3R5bGUuY3NzVGV4dDtcclxuXHJcbiAgICAgIGNvbnN0IGRpc3BsYXlJbWcgPSBkb2MuY3JlYXRlRWxlbWVudCggJ2ltZycgKTtcclxuICAgICAgY29uc3Qgc3JjID0gY2FudmFzVXJsTWFwWyBkaXNwbGF5Q2FudmFzLmlkIF07XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHNyYywgJ011c3QgaGF2ZSBtaXNzZWQgYSB0b0RhdGFVUkwoKSBvbiBhIENhbnZhcycgKTtcclxuXHJcbiAgICAgIGRpc3BsYXlJbWcuc3JjID0gc3JjO1xyXG4gICAgICBkaXNwbGF5SW1nLnNldEF0dHJpYnV0ZSggJ3N0eWxlJywgY3NzVGV4dCApO1xyXG5cclxuICAgICAgZGlzcGxheUNhbnZhcy5wYXJlbnROb2RlIS5yZXBsYWNlQ2hpbGQoIGRpc3BsYXlJbWcsIGRpc3BsYXlDYW52YXMgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkaXNwbGF5V2lkdGggPSB0aGlzLndpZHRoO1xyXG4gICAgY29uc3QgZGlzcGxheUhlaWdodCA9IHRoaXMuaGVpZ2h0O1xyXG4gICAgY29uc3QgY29tcGxldGVGdW5jdGlvbiA9ICgpID0+IHtcclxuICAgICAgRGlzcGxheS5lbGVtZW50VG9TVkdEYXRhVVJMKCBkb2MuZG9jdW1lbnRFbGVtZW50LCBkaXNwbGF5V2lkdGgsIGRpc3BsYXlIZWlnaHQsIGNhbGxiYWNrICk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIENvbnZlcnQgZWFjaCA8aW1hZ2U+J3MgeGxpbms6aHJlZiBzbyB0aGF0IGl0J3MgYSBkYXRhIFVSTCB3aXRoIHRoZSByZWxldmFudCBkYXRhLCBlLmcuXHJcbiAgICAvLyA8aW1hZ2UgLi4uIHhsaW5rOmhyZWY9XCJodHRwOi8vbG9jYWxob3N0OjgwODAvc2NlbmVyeS1waGV0L2ltYWdlcy9iYXR0ZXJ5RENlbGwucG5nP2J1c3Q9MTQ3NjMwODQwNzk4OFwiLz5cclxuICAgIC8vIGdldHMgcmVwbGFjZWQgd2l0aCBhIGRhdGEgVVJMLlxyXG4gICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy81NzNcclxuICAgIGxldCByZXBsYWNlZEltYWdlcyA9IDA7IC8vIENvdW50IGhvdyBtYW55IGltYWdlcyBnZXQgcmVwbGFjZWQuIFdlJ2xsIGRlY3JlbWVudCB3aXRoIGVhY2ggZmluaXNoZWQgaW1hZ2UuXHJcbiAgICBsZXQgaGFzUmVwbGFjZWRJbWFnZXMgPSBmYWxzZTsgLy8gV2hldGhlciBhbnkgaW1hZ2VzIGFyZSByZXBsYWNlZFxyXG4gICAgY29uc3QgZGlzcGxheVNWR0ltYWdlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKCBkb2MuZG9jdW1lbnRFbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCAnaW1hZ2UnICkgKTtcclxuICAgIGZvciAoIGxldCBqID0gMDsgaiA8IGRpc3BsYXlTVkdJbWFnZXMubGVuZ3RoOyBqKysgKSB7XHJcbiAgICAgIGNvbnN0IGRpc3BsYXlTVkdJbWFnZSA9IGRpc3BsYXlTVkdJbWFnZXNbIGogXTtcclxuICAgICAgY29uc3QgY3VycmVudEhyZWYgPSBkaXNwbGF5U1ZHSW1hZ2UuZ2V0QXR0cmlidXRlKCAneGxpbms6aHJlZicgKTtcclxuICAgICAgaWYgKCBjdXJyZW50SHJlZi5zbGljZSggMCwgNSApICE9PSAnZGF0YTonICkge1xyXG4gICAgICAgIHJlcGxhY2VkSW1hZ2VzKys7XHJcbiAgICAgICAgaGFzUmVwbGFjZWRJbWFnZXMgPSB0cnVlO1xyXG5cclxuICAgICAgICAoICgpID0+IHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbG9vcC1mdW5jXHJcbiAgICAgICAgICAvLyBDbG9zdXJlIHZhcmlhYmxlcyBuZWVkIHRvIGJlIHN0b3JlZCBmb3IgZWFjaCBpbmRpdmlkdWFsIFNWRyBpbWFnZS5cclxuICAgICAgICAgIGNvbnN0IHJlZkltYWdlID0gbmV3IHdpbmRvdy5JbWFnZSgpO1xyXG4gICAgICAgICAgY29uc3Qgc3ZnSW1hZ2UgPSBkaXNwbGF5U1ZHSW1hZ2U7XHJcblxyXG4gICAgICAgICAgcmVmSW1hZ2Uub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAvLyBHZXQgYSBDYW52YXNcclxuICAgICAgICAgICAgY29uc3QgcmVmQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcclxuICAgICAgICAgICAgcmVmQ2FudmFzLndpZHRoID0gcmVmSW1hZ2Uud2lkdGg7XHJcbiAgICAgICAgICAgIHJlZkNhbnZhcy5oZWlnaHQgPSByZWZJbWFnZS5oZWlnaHQ7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlZkNvbnRleHQgPSByZWZDYW52YXMuZ2V0Q29udGV4dCggJzJkJyApITtcclxuXHJcbiAgICAgICAgICAgIC8vIERyYXcgdGhlIChub3cgbG9hZGVkKSBpbWFnZSBpbnRvIHRoZSBDYW52YXNcclxuICAgICAgICAgICAgcmVmQ29udGV4dC5kcmF3SW1hZ2UoIHJlZkltYWdlLCAwLCAwICk7XHJcblxyXG4gICAgICAgICAgICAvLyBSZXBsYWNlIHRoZSA8aW1hZ2U+J3MgaHJlZiB3aXRoIHRoZSBDYW52YXMnIGRhdGEuXHJcbiAgICAgICAgICAgIHN2Z0ltYWdlLnNldEF0dHJpYnV0ZSggJ3hsaW5rOmhyZWYnLCByZWZDYW52YXMudG9EYXRhVVJMKCkgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIElmIGl0J3MgdGhlIGxhc3QgcmVwbGFjZWQgaW1hZ2UsIGdvIHRvIHRoZSBuZXh0IHN0ZXBcclxuICAgICAgICAgICAgaWYgKCAtLXJlcGxhY2VkSW1hZ2VzID09PSAwICkge1xyXG4gICAgICAgICAgICAgIGNvbXBsZXRlRnVuY3Rpb24oKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggcmVwbGFjZWRJbWFnZXMgPj0gMCApO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIHJlZkltYWdlLm9uZXJyb3IgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIE5PVEU6IG5vdCBtdWNoIHdlIGNhbiBkbywgbGVhdmUgdGhpcyBlbGVtZW50IGFsb25lLlxyXG5cclxuICAgICAgICAgICAgLy8gSWYgaXQncyB0aGUgbGFzdCByZXBsYWNlZCBpbWFnZSwgZ28gdG8gdGhlIG5leHQgc3RlcFxyXG4gICAgICAgICAgICBpZiAoIC0tcmVwbGFjZWRJbWFnZXMgPT09IDAgKSB7XHJcbiAgICAgICAgICAgICAgY29tcGxldGVGdW5jdGlvbigpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCByZXBsYWNlZEltYWdlcyA+PSAwICk7XHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIC8vIEtpY2sgb2ZmIGxvYWRpbmcgb2YgdGhlIGltYWdlLlxyXG4gICAgICAgICAgcmVmSW1hZ2Uuc3JjID0gY3VycmVudEhyZWY7XHJcbiAgICAgICAgfSApKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiBubyBpbWFnZXMgYXJlIHJlcGxhY2VkLCB3ZSBuZWVkIHRvIGNhbGwgb3VyIGNhbGxiYWNrIHRocm91Z2ggdGhpcyByb3V0ZS5cclxuICAgIGlmICggIWhhc1JlcGxhY2VkSW1hZ2VzICkge1xyXG4gICAgICBjb21wbGV0ZUZ1bmN0aW9uKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcG9wdXBSYXN0ZXJpemF0aW9uKCk6IHZvaWQge1xyXG4gICAgdGhpcy5mb3JlaWduT2JqZWN0UmFzdGVyaXphdGlvbiggdXJsID0+IHtcclxuICAgICAgaWYgKCB1cmwgKSB7XHJcbiAgICAgICAgd2luZG93Lm9wZW4oIHVybCApO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaWxsIHJldHVybiBudWxsIGlmIHRoZSBzdHJpbmcgb2YgaW5kaWNlcyBpc24ndCBwYXJ0IG9mIHRoZSBQRE9NSW5zdGFuY2UgdHJlZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRUcmFpbEZyb21QRE9NSW5kaWNlc1N0cmluZyggaW5kaWNlc1N0cmluZzogc3RyaW5nICk6IFRyYWlsIHwgbnVsbCB7XHJcblxyXG4gICAgLy8gTm8gUERPTUluc3RhbmNlIHRyZWUgaWYgdGhlIGRpc3BsYXkgaXNuJ3QgYWNjZXNzaWJsZVxyXG4gICAgaWYgKCAhdGhpcy5fcm9vdFBET01JbnN0YW5jZSApIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGluc3RhbmNlID0gdGhpcy5fcm9vdFBET01JbnN0YW5jZTtcclxuICAgIGNvbnN0IGluZGV4U3RyaW5ncyA9IGluZGljZXNTdHJpbmcuc3BsaXQoIFBET01VdGlscy5QRE9NX1VOSVFVRV9JRF9TRVBBUkFUT1IgKTtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGluZGV4U3RyaW5ncy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgZGlnaXQgPSBOdW1iZXIoIGluZGV4U3RyaW5nc1sgaSBdICk7XHJcbiAgICAgIGluc3RhbmNlID0gaW5zdGFuY2UuY2hpbGRyZW5bIGRpZ2l0IF07XHJcbiAgICAgIGlmICggIWluc3RhbmNlICkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuICggaW5zdGFuY2UgJiYgaW5zdGFuY2UudHJhaWwgKSA/IGluc3RhbmNlLnRyYWlsIDogbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZvcmNlcyBTVkcgZWxlbWVudHMgdG8gaGF2ZSB0aGVpciB2aXN1YWwgY29udGVudHMgcmVmcmVzaGVkLCBieSBjaGFuZ2luZyBzdGF0ZSBpbiBhIG5vbi12aXN1YWxseS1hcHBhcmVudCB3YXkuXHJcbiAgICogSXQgc2hvdWxkIHRyaWNrIGJyb3dzZXJzIGludG8gcmUtcmVuZGVyaW5nIHRoZSBTVkcgZWxlbWVudHMuXHJcbiAgICpcclxuICAgKiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1MDdcclxuICAgKi9cclxuICBwdWJsaWMgcmVmcmVzaFNWRygpOiB2b2lkIHtcclxuICAgIHRoaXMuX3JlZnJlc2hTVkdFbWl0dGVyLmVtaXQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNpbWlsYXIgdG8gcmVmcmVzaFNWRyAoc2VlIGRvY3MgYWJvdmUpLCBidXQgd2lsbCBkbyBzbyBvbiB0aGUgbmV4dCBmcmFtZS5cclxuICAgKi9cclxuICBwdWJsaWMgcmVmcmVzaFNWR09uTmV4dEZyYW1lKCk6IHZvaWQge1xyXG4gICAgdGhpcy5fcmVmcmVzaFNWR1BlbmRpbmcgPSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVsZWFzZXMgcmVmZXJlbmNlcy5cclxuICAgKlxyXG4gICAqIFRPRE86IHRoaXMgZGlzcG9zZSBmdW5jdGlvbiBpcyBub3QgY29tcGxldGUuIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICovXHJcbiAgcHVibGljIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICBpZiAoIGFzc2VydCApIHtcclxuICAgICAgYXNzZXJ0KCAhdGhpcy5faXNEaXNwb3NpbmcgKTtcclxuICAgICAgYXNzZXJ0KCAhdGhpcy5faXNEaXNwb3NlZCApO1xyXG5cclxuICAgICAgdGhpcy5faXNEaXNwb3NpbmcgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggdGhpcy5faW5wdXQgKSB7XHJcbiAgICAgIHRoaXMuZGV0YWNoRXZlbnRzKCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLl9yb290Tm9kZS5yZW1vdmVSb290ZWREaXNwbGF5KCB0aGlzICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9hY2Nlc3NpYmxlICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9ib3VuZEhhbmRsZUZ1bGxTY3JlZW5OYXZpZ2F0aW9uLCAnX2JvdW5kSGFuZGxlRnVsbFNjcmVlbk5hdmlnYXRpb24gd2FzIG5vdCBhZGRlZCB0byB0aGUga2V5U3RhdGVUcmFja2VyJyApO1xyXG4gICAgICBnbG9iYWxLZXlTdGF0ZVRyYWNrZXIua2V5ZG93bkVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoIHRoaXMuX2JvdW5kSGFuZGxlRnVsbFNjcmVlbk5hdmlnYXRpb24hICk7XHJcbiAgICAgIHRoaXMuX3Jvb3RQRE9NSW5zdGFuY2UhLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9mb2N1c092ZXJsYXkgJiYgdGhpcy5fZm9jdXNPdmVybGF5LmRpc3Bvc2UoKTtcclxuXHJcbiAgICB0aGlzLnNpemVQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcblxyXG4gICAgLy8gV2lsbCBpbW1lZGlhdGVseSBkaXNwb3NlIHJlY3Vyc2l2ZWx5LCBhbGwgSW5zdGFuY2VzIEFORCB0aGVpciBhdHRhY2hlZCBkcmF3YWJsZXMsIHdoaWNoIHdpbGwgaW5jbHVkZSB0aGVcclxuICAgIC8vIHJvb3RCYWNrYm9uZS5cclxuICAgIHRoaXMuX2Jhc2VJbnN0YW5jZSAmJiB0aGlzLl9iYXNlSW5zdGFuY2UuZGlzcG9zZSgpO1xyXG5cclxuICAgIHRoaXMuZGVzY3JpcHRpb25VdHRlcmFuY2VRdWV1ZS5kaXNwb3NlKCk7XHJcblxyXG4gICAgdGhpcy5mb2N1c01hbmFnZXIgJiYgdGhpcy5mb2N1c01hbmFnZXIuZGlzcG9zZSgpO1xyXG5cclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICB0aGlzLl9pc0Rpc3Bvc2luZyA9IGZhbHNlO1xyXG4gICAgICB0aGlzLl9pc0Rpc3Bvc2VkID0gdHJ1ZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRha2VzIGEgZ2l2ZW4gRE9NIGVsZW1lbnQsIGFuZCBhc3luY2hyb25vdXNseSByZW5kZXJzIGl0IHRvIGEgc3RyaW5nIHRoYXQgaXMgYSBkYXRhIFVSTCByZXByZXNlbnRpbmcgYW4gU1ZHXHJcbiAgICogZmlsZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBkb21FbGVtZW50XHJcbiAgICogQHBhcmFtIHdpZHRoIC0gVGhlIHdpZHRoIG9mIHRoZSBvdXRwdXQgU1ZHXHJcbiAgICogQHBhcmFtIGhlaWdodCAtIFRoZSBoZWlnaHQgb2YgdGhlIG91dHB1dCBTVkdcclxuICAgKiBAcGFyYW0gY2FsbGJhY2sgLSBDYWxsZWQgYXMgY2FsbGJhY2soIHVybDoge3N0cmluZ30gKSwgd2hlcmUgdGhlIFVSTCB3aWxsIGJlIHRoZSBlbmNvZGVkIFNWRyBmaWxlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgZWxlbWVudFRvU1ZHRGF0YVVSTCggZG9tRWxlbWVudDogSFRNTEVsZW1lbnQsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBjYWxsYmFjazogKCB1cmw6IHN0cmluZyB8IG51bGwgKSA9PiB2b2lkICk6IHZvaWQge1xyXG4gICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcclxuICAgIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCggJzJkJyApITtcclxuICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuXHJcbiAgICAvLyBTZXJpYWxpemUgaXQgdG8gWEhUTUwgdGhhdCBjYW4gYmUgdXNlZCBpbiBmb3JlaWduT2JqZWN0IChIVE1MIGNhbid0IGJlKVxyXG4gICAgY29uc3QgeGh0bWwgPSBuZXcgd2luZG93LlhNTFNlcmlhbGl6ZXIoKS5zZXJpYWxpemVUb1N0cmluZyggZG9tRWxlbWVudCApO1xyXG5cclxuICAgIC8vIENyZWF0ZSBhbiBTVkcgY29udGFpbmVyIHdpdGggYSBmb3JlaWduT2JqZWN0LlxyXG4gICAgY29uc3QgZGF0YSA9IGA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB3aWR0aD1cIiR7d2lkdGh9XCIgaGVpZ2h0PVwiJHtoZWlnaHR9XCI+YCArXHJcbiAgICAgICAgICAgICAgICAgJzxmb3JlaWduT2JqZWN0IHdpZHRoPVwiMTAwJVwiIGhlaWdodD1cIjEwMCVcIj4nICtcclxuICAgICAgICAgICAgICAgICBgPGRpdiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWxcIj4ke1xyXG4gICAgICAgICAgICAgICAgICAgeGh0bWxcclxuICAgICAgICAgICAgICAgICB9PC9kaXY+YCArXHJcbiAgICAgICAgICAgICAgICAgJzwvZm9yZWlnbk9iamVjdD4nICtcclxuICAgICAgICAgICAgICAgICAnPC9zdmc+JztcclxuXHJcbiAgICAvLyBMb2FkIGFuIDxpbWc+IHdpdGggdGhlIFNWRyBkYXRhIFVSTCwgYW5kIHdoZW4gbG9hZGVkIGRyYXcgaXQgaW50byBvdXIgQ2FudmFzXHJcbiAgICBjb25zdCBpbWcgPSBuZXcgd2luZG93LkltYWdlKCk7XHJcbiAgICBpbWcub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICBjb250ZXh0LmRyYXdJbWFnZSggaW1nLCAwLCAwICk7XHJcbiAgICAgIGNhbGxiYWNrKCBjYW52YXMudG9EYXRhVVJMKCkgKTsgLy8gRW5kcG9pbnQgaGVyZVxyXG4gICAgfTtcclxuICAgIGltZy5vbmVycm9yID0gKCkgPT4ge1xyXG4gICAgICBjYWxsYmFjayggbnVsbCApO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBXZSBjYW4ndCBidG9hKCkgYXJiaXRyYXJ5IHVuaWNvZGUsIHNvIHdlIG5lZWQgYW5vdGhlciBzb2x1dGlvbixcclxuICAgIC8vIHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2luZG93QmFzZTY0L0Jhc2U2NF9lbmNvZGluZ19hbmRfZGVjb2RpbmcjVGhlXy4yMlVuaWNvZGVfUHJvYmxlbS4yMlxyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciAtIEV4dGVyaW9yIGxpYlxyXG4gICAgY29uc3QgdWludDhhcnJheSA9IG5ldyB3aW5kb3cuVGV4dEVuY29kZXJMaXRlKCAndXRmLTgnICkuZW5jb2RlKCBkYXRhICk7XHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gRXh0ZXJpb3IgbGliXHJcbiAgICBjb25zdCBiYXNlNjQgPSB3aW5kb3cuZnJvbUJ5dGVBcnJheSggdWludDhhcnJheSApO1xyXG5cclxuICAgIC8vIHR1cm4gaXQgdG8gYmFzZTY0IGFuZCB3cmFwIGl0IGluIHRoZSBkYXRhIFVSTCBmb3JtYXRcclxuICAgIGltZy5zcmMgPSBgZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCwke2Jhc2U2NH1gO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0cnVlIHdoZW4gTk8gbm9kZXMgaW4gdGhlIHN1YnRyZWUgYXJlIGRpc3Bvc2VkLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgc3RhdGljIGFzc2VydFN1YnRyZWVEaXNwb3NlZCggbm9kZTogTm9kZSApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFub2RlLmlzRGlzcG9zZWQsICdEaXNwb3NlZCBub2RlcyBzaG91bGQgbm90IGJlIGluY2x1ZGVkIGluIGEgc2NlbmUgZ3JhcGggdG8gZGlzcGxheS4nICk7XHJcblxyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgRGlzcGxheS5hc3NlcnRTdWJ0cmVlRGlzcG9zZWQoIG5vZGUuY2hpbGRyZW5bIGkgXSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGFuIGlucHV0IGxpc3RlbmVyIHRvIGJlIGZpcmVkIGZvciBBTlkgRGlzcGxheVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgYWRkSW5wdXRMaXN0ZW5lciggbGlzdGVuZXI6IFRJbnB1dExpc3RlbmVyICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIV8uaW5jbHVkZXMoIERpc3BsYXkuaW5wdXRMaXN0ZW5lcnMsIGxpc3RlbmVyICksICdJbnB1dCBsaXN0ZW5lciBhbHJlYWR5IHJlZ2lzdGVyZWQnICk7XHJcblxyXG4gICAgLy8gZG9uJ3QgYWxsb3cgbGlzdGVuZXJzIHRvIGJlIGFkZGVkIG11bHRpcGxlIHRpbWVzXHJcbiAgICBpZiAoICFfLmluY2x1ZGVzKCBEaXNwbGF5LmlucHV0TGlzdGVuZXJzLCBsaXN0ZW5lciApICkge1xyXG4gICAgICBEaXNwbGF5LmlucHV0TGlzdGVuZXJzLnB1c2goIGxpc3RlbmVyICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmVzIGFuIGlucHV0IGxpc3RlbmVyIHRoYXQgd2FzIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBEaXNwbGF5LmFkZElucHV0TGlzdGVuZXIuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyByZW1vdmVJbnB1dExpc3RlbmVyKCBsaXN0ZW5lcjogVElucHV0TGlzdGVuZXIgKTogdm9pZCB7XHJcbiAgICAvLyBlbnN1cmUgdGhlIGxpc3RlbmVyIGlzIGluIG91ciBsaXN0XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBfLmluY2x1ZGVzKCBEaXNwbGF5LmlucHV0TGlzdGVuZXJzLCBsaXN0ZW5lciApICk7XHJcblxyXG4gICAgRGlzcGxheS5pbnB1dExpc3RlbmVycy5zcGxpY2UoIF8uaW5kZXhPZiggRGlzcGxheS5pbnB1dExpc3RlbmVycywgbGlzdGVuZXIgKSwgMSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW50ZXJydXB0cyBhbGwgaW5wdXQgbGlzdGVuZXJzIHRoYXQgYXJlIGF0dGFjaGVkIHRvIGFsbCBEaXNwbGF5cy5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGludGVycnVwdElucHV0KCk6IHZvaWQge1xyXG4gICAgY29uc3QgbGlzdGVuZXJzQ29weSA9IERpc3BsYXkuaW5wdXRMaXN0ZW5lcnMuc2xpY2UoIDAgKTtcclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBsaXN0ZW5lcnNDb3B5Lmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBsaXN0ZW5lciA9IGxpc3RlbmVyc0NvcHlbIGkgXTtcclxuXHJcbiAgICAgIGxpc3RlbmVyLmludGVycnVwdCAmJiBsaXN0ZW5lci5pbnRlcnJ1cHQoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIEZpcmVzIHdoZW4gd2UgZGV0ZWN0IGFuIGlucHV0IGV2ZW50IHRoYXQgd291bGQgYmUgY29uc2lkZXJlZCBhIFwidXNlciBnZXN0dXJlXCIgYnkgQ2hyb21lLCBzb1xyXG4gIC8vIHRoYXQgd2UgY2FuIHRyaWdnZXIgYnJvd3NlciBhY3Rpb25zIHRoYXQgYXJlIG9ubHkgYWxsb3dlZCBhcyBhIHJlc3VsdC5cclxuICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzgwMiBhbmQgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3ZpYmUvaXNzdWVzLzMyIGZvciBtb3JlXHJcbiAgLy8gaW5mb3JtYXRpb24uXHJcbiAgcHVibGljIHN0YXRpYyB1c2VyR2VzdHVyZUVtaXR0ZXI6IFRFbWl0dGVyO1xyXG5cclxuICAvLyBMaXN0ZW5lcnMgdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZXZlcnkgZXZlbnQgb24gQU5ZIERpc3BsYXksIHNlZVxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xMTQ5LiBEbyBub3QgZGlyZWN0bHkgbW9kaWZ5IHRoaXMhXHJcbiAgcHVibGljIHN0YXRpYyBpbnB1dExpc3RlbmVyczogVElucHV0TGlzdGVuZXJbXTtcclxufVxyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ0Rpc3BsYXknLCBEaXNwbGF5ICk7XHJcblxyXG5EaXNwbGF5LnVzZXJHZXN0dXJlRW1pdHRlciA9IG5ldyBFbWl0dGVyKCk7XHJcbkRpc3BsYXkuaW5wdXRMaXN0ZW5lcnMgPSBbXTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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