// Copyright 2015-2024, University of Colorado Boulder

/**
 * An instance that is synchronously created, for handling accessibility needs.
 *
 * Consider the following example:
 *
 * We have a node structure:
 * A
 *  B ( accessible )
 *    C (accessible )
 *      D
 *        E (accessible)
 *         G (accessible)
 *        F
 *          H (accessible)
 *
 *
 * Which has an equivalent accessible instance tree:
 * root
 *  AB
 *    ABC
 *      ABCDE
 *        ABCDEG
 *      ABCDFH
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import dotRandom from '../../../../dot/js/dotRandom.js';
import cleanArray from '../../../../phet-core/js/cleanArray.js';
import Enumeration from '../../../../phet-core/js/Enumeration.js';
import EnumerationValue from '../../../../phet-core/js/EnumerationValue.js';
import Pool from '../../../../phet-core/js/Pool.js';
import { FocusManager, Node, PDOMPeer, PDOMUtils, scenery, Trail, TransformTracker } from '../../imports.js';

// PDOMInstances support two different styles of unique IDs, each with their own tradeoffs, https://github.com/phetsims/phet-io/issues/1851
class PDOMUniqueIdStrategy extends EnumerationValue {
  static INDICES = new PDOMUniqueIdStrategy();
  static TRAIL_ID = new PDOMUniqueIdStrategy();
  static enumeration = new Enumeration(PDOMUniqueIdStrategy);
}

// A type representing a fake instance, for some aggressive auditing (under ?assertslow)

// This constant is set up to allow us to change our unique id strategy. Both strategies have trade-offs that are
// described in https://github.com/phetsims/phet-io/issues/1847#issuecomment-1068377336. TRAIL_ID is our path forward
// currently, but will break PhET-iO playback if any Nodes are created in the recorded sim OR playback sim but not
// both. Further information in the above issue and https://github.com/phetsims/phet-io/issues/1851.
const UNIQUE_ID_STRATEGY = PDOMUniqueIdStrategy.TRAIL_ID;
let globalId = 1;
class PDOMInstance {
  // unique ID

  // {Display}

  // {number} - The number of nodes in our trail that are NOT in our parent's trail and do NOT have our
  // display in their pdomDisplays. For non-root instances, this is initialized later in the constructor.

  // {Array.<Node>} - Nodes that are in our trail (but not those of our parent)
  relativeNodes = [];

  // {Array.<boolean>} - Whether our display is in the respective relativeNodes' pdomDisplays
  relativeVisibilities = [];

  // {function} - The listeners added to the respective relativeNodes
  relativeListeners = [];

  // (scenery-internal) {TransformTracker|null} - Used to quickly compute the global matrix of this
  // instance's transform source Node and observe when the transform changes. Used by PDOMPeer to update
  // positioning of sibling elements. By default, watches this PDOMInstance's visual trail.
  transformTracker = null;

  // {boolean} - Whether we are currently in a "disposed" (in the pool) state, or are available to be
  // re-initialized

  /**
   * Constructor for PDOMInstance, uses an initialize method for pooling.
   *
   * @param parent - parent of this instance, null if root of PDOMInstance tree
   * @param display
   * @param trail - trail to the node for this PDOMInstance
   */
  constructor(parent, display, trail) {
    this.initializePDOMInstance(parent, display, trail);
  }

  /**
   * Initializes a PDOMInstance, implements construction for pooling.
   *
   * @param parent - null if this PDOMInstance is root of PDOMInstance tree
   * @param display
   * @param trail - trail to node for this PDOMInstance
   * @returns - Returns 'this' reference, for chaining
   */
  initializePDOMInstance(parent, display, trail) {
    assert && assert(!this.id || this.isDisposed, 'If we previously existed, we need to have been disposed');

    // unique ID
    this.id = this.id || globalId++;
    this.parent = parent;

    // {Display}
    this.display = display;

    // {Trail}
    this.trail = trail;

    // {boolean}
    this.isRootInstance = parent === null;

    // {Node|null}
    this.node = this.isRootInstance ? null : trail.lastNode();

    // {Array.<PDOMInstance>}
    this.children = cleanArray(this.children);

    // If we are the root accessible instance, we won't actually have a reference to a node.
    if (this.node) {
      this.node.addPDOMInstance(this);
    }

    // {number} - The number of nodes in our trail that are NOT in our parent's trail and do NOT have our
    // display in their pdomDisplays. For non-root instances, this is initialized later in the constructor.
    this.invisibleCount = 0;

    // {Array.<Node>} - Nodes that are in our trail (but not those of our parent)
    this.relativeNodes = [];

    // {Array.<boolean>} - Whether our display is in the respective relativeNodes' pdomDisplays
    this.relativeVisibilities = [];

    // {function} - The listeners added to the respective relativeNodes
    this.relativeListeners = [];

    // (scenery-internal) {TransformTracker|null} - Used to quickly compute the global matrix of this
    // instance's transform source Node and observe when the transform changes. Used by PDOMPeer to update
    // positioning of sibling elements. By default, watches this PDOMInstance's visual trail.
    this.transformTracker = null;
    this.updateTransformTracker(this.node ? this.node.pdomTransformSourceNode : null);

    // {boolean} - Whether we are currently in a "disposed" (in the pool) state, or are available to be
    // re-initialized
    this.isDisposed = false;
    if (this.isRootInstance) {
      const accessibilityContainer = document.createElement('div');

      // @ts-expect-error - Poolable is a mixin and TypeScript doesn't have good mixin support
      this.peer = PDOMPeer.createFromPool(this, {
        primarySibling: accessibilityContainer
      });
    } else {
      // @ts-expect-error - Poolable a mixin and TypeScript doesn't have good mixin support
      this.peer = PDOMPeer.createFromPool(this);

      // The peer is not fully constructed until this update function is called, see https://github.com/phetsims/scenery/issues/832
      // Trail Ids will never change, so update them eagerly, a single time during construction.
      this.peer.update(UNIQUE_ID_STRATEGY === PDOMUniqueIdStrategy.TRAIL_ID);
      assert && assert(this.peer.primarySibling, 'accessible peer must have a primarySibling upon completion of construction');

      // Scan over all of the nodes in our trail (that are NOT in our parent's trail) to check for pdomDisplays
      // so we can initialize our invisibleCount and add listeners.
      const parentTrail = this.parent.trail;
      for (let i = parentTrail.length; i < trail.length; i++) {
        const relativeNode = trail.nodes[i];
        this.relativeNodes.push(relativeNode);
        const pdomDisplays = relativeNode._pdomDisplaysInfo.pdomDisplays;
        const isVisible = _.includes(pdomDisplays, display);
        this.relativeVisibilities.push(isVisible);
        if (!isVisible) {
          this.invisibleCount++;
        }
        const listener = this.checkAccessibleDisplayVisibility.bind(this, i - parentTrail.length);
        relativeNode.pdomDisplaysEmitter.addListener(listener);
        this.relativeListeners.push(listener);
      }
      this.updateVisibility();
    }
    sceneryLog && sceneryLog.PDOMInstance && sceneryLog.PDOMInstance(`Initialized ${this.toString()}`);
    return this;
  }

  /**
   * Adds a series of (sorted) accessible instances as children.
   */
  addConsecutiveInstances(pdomInstances) {
    sceneryLog && sceneryLog.PDOMInstance && sceneryLog.PDOMInstance(`addConsecutiveInstances on ${this.toString()} with: ${pdomInstances.map(inst => inst.toString()).join(',')}`);
    sceneryLog && sceneryLog.PDOMInstance && sceneryLog.push();
    const hadChildren = this.children.length > 0;
    Array.prototype.push.apply(this.children, pdomInstances);
    for (let i = 0; i < pdomInstances.length; i++) {
      // Append the container parent to the end (so that, when provided in order, we don't have to resort below
      // when initializing).
      assert && assert(!!this.peer.primarySibling, 'Primary sibling must be defined to insert elements.');

      // @ts-expect-error - when PDOMPeer is converted to TS this ts-expect-error can probably be removed
      PDOMUtils.insertElements(this.peer.primarySibling, pdomInstances[i].peer.topLevelElements);
    }
    if (hadChildren) {
      this.sortChildren();
    }
    if (assert && this.node) {
      assert && assert(this.node instanceof Node);

      // We do not support rendering children into a Node that has innerContent.
      // If you hit this when mutating both children and innerContent at the same time, it is an issue with scenery.
      // Remove one in a single step and them add then other in the next step.
      this.children.length > 0 && assert(!this.node.innerContent, `${this.children.length} child PDOMInstances present but this node has innerContent: ${this.node.innerContent}`);
    }
    if (UNIQUE_ID_STRATEGY === PDOMUniqueIdStrategy.INDICES) {
      // This kills performance if there are enough PDOMInstances
      this.updateDescendantPeerIds(pdomInstances);
    }
    sceneryLog && sceneryLog.PDOMInstance && sceneryLog.pop();
  }

  /**
   * Removes any child instances that are based on the provided trail.
   */
  removeInstancesForTrail(trail) {
    sceneryLog && sceneryLog.PDOMInstance && sceneryLog.PDOMInstance(`removeInstancesForTrail on ${this.toString()} with trail ${trail.toString()}`);
    sceneryLog && sceneryLog.PDOMInstance && sceneryLog.push();
    for (let i = 0; i < this.children.length; i++) {
      const childInstance = this.children[i];
      const childTrail = childInstance.trail;

      // Not worth it to inspect before our trail ends, since it should be (!) guaranteed to be equal
      let differs = childTrail.length < trail.length;
      if (!differs) {
        for (let j = this.trail.length; j < trail.length; j++) {
          if (trail.nodes[j] !== childTrail.nodes[j]) {
            differs = true;
            break;
          }
        }
      }
      if (!differs) {
        this.children.splice(i, 1);
        childInstance.dispose();
        i -= 1;
      }
    }
    sceneryLog && sceneryLog.PDOMInstance && sceneryLog.pop();
  }

  /**
   * Removes all of the children.
   */
  removeAllChildren() {
    sceneryLog && sceneryLog.PDOMInstance && sceneryLog.PDOMInstance(`removeAllChildren on ${this.toString()}`);
    sceneryLog && sceneryLog.PDOMInstance && sceneryLog.push();
    while (this.children.length) {
      this.children.pop().dispose();
    }
    sceneryLog && sceneryLog.PDOMInstance && sceneryLog.pop();
  }

  /**
   * Returns a PDOMInstance child (if one exists with the given Trail), or null otherwise.
   */
  findChildWithTrail(trail) {
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      if (child.trail.equals(trail)) {
        return child;
      }
    }
    return null;
  }

  /**
   * Remove a subtree of PDOMInstances from this PDOMInstance
   *
   * @param trail - children of this PDOMInstance will be removed if the child trails are extensions
   *                        of the trail.
   * (scenery-internal)
   */
  removeSubtree(trail) {
    sceneryLog && sceneryLog.PDOMInstance && sceneryLog.PDOMInstance(`removeSubtree on ${this.toString()} with trail ${trail.toString()}`);
    sceneryLog && sceneryLog.PDOMInstance && sceneryLog.push();
    for (let i = this.children.length - 1; i >= 0; i--) {
      const childInstance = this.children[i];
      if (childInstance.trail.isExtensionOf(trail, true)) {
        sceneryLog && sceneryLog.PDOMInstance && sceneryLog.PDOMInstance(`Remove parent: ${this.toString()}, child: ${childInstance.toString()}`);
        this.children.splice(i, 1); // remove it from the children array

        // Dispose the entire subtree of PDOMInstances
        childInstance.dispose();
      }
    }
    sceneryLog && sceneryLog.PDOMInstance && sceneryLog.pop();
  }

  /**
   * Checks to see whether our visibility needs an update based on a pdomDisplays change.
   *
   * @param index - Index into the relativeNodes array (which node had the notification)
   */
  checkAccessibleDisplayVisibility(index) {
    const isNodeVisible = _.includes(this.relativeNodes[index]._pdomDisplaysInfo.pdomDisplays, this.display);
    const wasNodeVisible = this.relativeVisibilities[index];
    if (isNodeVisible !== wasNodeVisible) {
      this.relativeVisibilities[index] = isNodeVisible;
      const wasVisible = this.invisibleCount === 0;
      this.invisibleCount += isNodeVisible ? -1 : 1;
      assert && assert(this.invisibleCount >= 0 && this.invisibleCount <= this.relativeNodes.length);
      const isVisible = this.invisibleCount === 0;
      if (isVisible !== wasVisible) {
        this.updateVisibility();
      }
    }
  }

  /**
   * Update visibility of this peer's accessible DOM content. The hidden attribute will hide all of the descendant
   * DOM content, so it is not necessary to update the subtree of PDOMInstances since the browser
   * will do this for us.
   */
  updateVisibility() {
    assert && assert(!!this.peer, 'Peer needs to be available on update visibility.');
    this.peer.setVisible(this.invisibleCount <= 0);

    // if we hid a parent element, blur focus if active element was an ancestor
    if (!this.peer.isVisible() && FocusManager.pdomFocusedNode) {
      assert && assert(FocusManager.pdomFocusedNode.pdomInstances.length === 1, 'focusable Nodes do not support DAG, and should be connected with an instance if focused.');

      // NOTE: We don't seem to be able to import normally here
      if (FocusManager.pdomFocusedNode.pdomInstances[0].trail.containsNode(this.node)) {
        FocusManager.pdomFocus = null;
      }
    }
  }

  /**
   * Returns whether the parallel DOM for this instance and its ancestors are not hidden.
   */
  isGloballyVisible() {
    assert && assert(!!this.peer, 'PDOMPeer needs to be available, has this PDOMInstance been disposed?');

    // If this peer is hidden, then return because that attribute will bubble down to children,
    // otherwise recurse to parent.
    if (!this.peer.isVisible()) {
      return false;
    } else if (this.parent) {
      return this.parent.isGloballyVisible();
    } else {
      // base case at root
      return true;
    }
  }

  /**
   * Returns what our list of children (after sorting) should be.
   *
   * @param trail - A partial trail, where the root of the trail is either this.node or the display's root
   *                        node (if we are the root PDOMInstance)
   */
  getChildOrdering(trail) {
    const node = trail.lastNode();
    const effectiveChildren = node.getEffectiveChildren();
    let i;
    const instances = [];

    // base case, node has accessible content, but don't match the "root" node of this accessible instance
    if (node.hasPDOMContent && node !== this.node) {
      const potentialInstances = node.pdomInstances;
      instanceLoop:
      // eslint-disable-line no-labels
      for (i = 0; i < potentialInstances.length; i++) {
        const potentialInstance = potentialInstances[i];
        if (potentialInstance.parent !== this) {
          continue;
        }
        for (let j = 0; j < trail.length; j++) {
          if (trail.nodes[j] !== potentialInstance.trail.nodes[j + potentialInstance.trail.length - trail.length]) {
            continue instanceLoop; // eslint-disable-line no-labels
          }
        }
        instances.push(potentialInstance); // length will always be 1
      }
      assert && assert(instances.length <= 1, 'If we select more than one this way, we have problems');
    } else {
      for (i = 0; i < effectiveChildren.length; i++) {
        trail.addDescendant(effectiveChildren[i], i);
        Array.prototype.push.apply(instances, this.getChildOrdering(trail));
        trail.removeDescendant();
      }
    }
    return instances;
  }

  /**
   * Sort our child accessible instances in the order they should appear in the parallel DOM. We do this by
   * creating a comparison function between two accessible instances. The function walks along the trails
   * of the children, looking for specified accessible orders that would determine the ordering for the two
   * PDOMInstances.
   *
   * (scenery-internal)
   */
  sortChildren() {
    // It's simpler/faster to just grab our order directly with one recursion, rather than specifying a sorting
    // function (since a lot gets re-evaluated in that case).

    assert && assert(this.peer !== null, 'peer required for sort');
    let nodeForTrail;
    if (this.isRootInstance) {
      assert && assert(this.display !== null, 'Display should be available for the root');
      nodeForTrail = this.display.rootNode;
    } else {
      assert && assert(this.node !== null, 'Node should be defined, were we disposed?');
      nodeForTrail = this.node;
    }
    const targetChildren = this.getChildOrdering(new Trail(nodeForTrail));
    assert && assert(targetChildren.length === this.children.length, 'sorting should not change number of children');

    // {Array.<PDOMInstance>}
    this.children = targetChildren;

    // the DOMElement to add the child DOMElements to.
    const primarySibling = this.peer.primarySibling;

    // Ignore DAG for focused trail. We need to know if there is a focused child instance so that we can avoid
    // temporarily detaching the focused element from the DOM. See https://github.com/phetsims/my-solar-system/issues/142
    const focusedTrail = FocusManager.pdomFocusedNode?.pdomInstances[0]?.trail || null;

    // "i" will keep track of the "collapsed" index when all DOMElements for all PDOMInstance children are
    // added to a single parent DOMElement (this PDOMInstance's PDOMPeer's primarySibling)
    let i = primarySibling.childNodes.length - 1;
    const focusedChildInstance = focusedTrail && _.find(this.children, child => focusedTrail.containsNode(child.peer.node));
    if (focusedChildInstance) {
      // If there's a focused child instance, we need to make sure that its primarySibling is not detached from the DOM
      // (this has caused focus issues, see https://github.com/phetsims/my-solar-system/issues/142).
      // Since this doesn't happen often, we can just recompute the full order, and move every other element.

      const desiredOrder = _.flatten(this.children.map(child => child.peer.topLevelElements));
      const needsOrderChange = !_.every(desiredOrder, (desiredElement, index) => primarySibling.children[index] === desiredElement);
      if (needsOrderChange) {
        const pivotElement = focusedChildInstance.peer.getTopLevelElementContainingPrimarySibling();
        const pivotIndex = desiredOrder.indexOf(pivotElement);
        assert && assert(pivotIndex >= 0);

        // Insert all elements before the pivot element
        for (let j = 0; j < pivotIndex; j++) {
          primarySibling.insertBefore(desiredOrder[j], pivotElement);
        }

        // Insert all elements after the pivot element
        for (let j = pivotIndex + 1; j < desiredOrder.length; j++) {
          primarySibling.appendChild(desiredOrder[j]);
        }
      }
    } else {
      // Iterate through all PDOMInstance children
      for (let peerIndex = this.children.length - 1; peerIndex >= 0; peerIndex--) {
        const peer = this.children[peerIndex].peer;

        // Iterate through all top level elements of a PDOMInstance's peer
        for (let elementIndex = peer.topLevelElements.length - 1; elementIndex >= 0; elementIndex--) {
          const element = peer.topLevelElements[elementIndex];

          // Reorder DOM elements in a way that doesn't do any work if they are already in a sorted order.
          // No need to reinsert if `element` is already in the right order
          if (primarySibling.childNodes[i] !== element) {
            primarySibling.insertBefore(element, primarySibling.childNodes[i + 1]);
          }

          // Decrement so that it is easier to place elements using the browser's Node.insertBefore API
          i--;
        }
      }
    }
    if (assert) {
      const desiredOrder = _.flatten(this.children.map(child => child.peer.topLevelElements));

      // Verify the order
      assert(_.every(desiredOrder, (desiredElement, index) => primarySibling.children[index] === desiredElement));
    }
    if (UNIQUE_ID_STRATEGY === PDOMUniqueIdStrategy.INDICES) {
      // This kills performance if there are enough PDOMInstances
      this.updateDescendantPeerIds(this.children);
    }
  }

  /**
   * Create a new TransformTracker that will observe transforms along the trail of this PDOMInstance OR
   * the provided pdomTransformSourceNode. See ParallelDOM.setPDOMTransformSourceNode(). The The source Node
   * must not use DAG so that its trail is unique.
   */
  updateTransformTracker(pdomTransformSourceNode) {
    this.transformTracker && this.transformTracker.dispose();
    let trackedTrail = null;
    if (pdomTransformSourceNode) {
      trackedTrail = pdomTransformSourceNode.getUniqueTrail();
    } else {
      trackedTrail = PDOMInstance.guessVisualTrail(this.trail, this.display.rootNode);
    }
    this.transformTracker = new TransformTracker(trackedTrail);
  }

  /**
   * Depending on what the unique ID strategy is, formulate the correct id for this PDOM instance.
   */
  getPDOMInstanceUniqueId() {
    if (UNIQUE_ID_STRATEGY === PDOMUniqueIdStrategy.INDICES) {
      const indicesString = [];
      let pdomInstance = this; // eslint-disable-line consistent-this, @typescript-eslint/no-this-alias

      while (pdomInstance.parent) {
        const indexOf = pdomInstance.parent.children.indexOf(pdomInstance);
        if (indexOf === -1) {
          return 'STILL_BEING_CREATED' + dotRandom.nextDouble();
        }
        indicesString.unshift(indexOf);
        pdomInstance = pdomInstance.parent;
      }
      return indicesString.join(PDOMUtils.PDOM_UNIQUE_ID_SEPARATOR);
    } else {
      assert && assert(UNIQUE_ID_STRATEGY === PDOMUniqueIdStrategy.TRAIL_ID);
      return this.trail.getUniqueId();
    }
  }

  /**
   * Using indices requires updating whenever the PDOMInstance tree changes, so recursively update all descendant
   * ids from such a change. Update peer ids for provided instances and all descendants of provided instances.
   */
  updateDescendantPeerIds(pdomInstances) {
    assert && assert(UNIQUE_ID_STRATEGY === PDOMUniqueIdStrategy.INDICES, 'method should not be used with uniqueId comes from TRAIL_ID');
    const toUpdate = Array.from(pdomInstances);
    while (toUpdate.length > 0) {
      const pdomInstance = toUpdate.shift();
      pdomInstance.peer.updateIndicesStringAndElementIds();
      toUpdate.push(...pdomInstance.children);
    }
  }

  /**
   * @param display
   * @param uniqueId - value returned from PDOMInstance.getPDOMInstanceUniqueId()
   * @returns null if there is no path to the unique id provided.
   */
  static uniqueIdToTrail(display, uniqueId) {
    if (UNIQUE_ID_STRATEGY === PDOMUniqueIdStrategy.INDICES) {
      return display.getTrailFromPDOMIndicesString(uniqueId);
    } else {
      assert && assert(UNIQUE_ID_STRATEGY === PDOMUniqueIdStrategy.TRAIL_ID);
      return Trail.fromUniqueId(display.rootNode, uniqueId);
    }
  }

  /**
   * Recursive disposal, to make eligible for garbage collection.
   *
   * (scenery-internal)
   */
  dispose() {
    sceneryLog && sceneryLog.PDOMInstance && sceneryLog.PDOMInstance(`Disposing ${this.toString()}`);
    sceneryLog && sceneryLog.PDOMInstance && sceneryLog.push();
    assert && assert(!!this.peer, 'PDOMPeer required, were we already disposed?');
    const thisPeer = this.peer;

    // Disconnect DOM and remove listeners
    if (!this.isRootInstance) {
      // remove this peer's primary sibling DOM Element (or its container parent) from the parent peer's
      // primary sibling (or its child container)
      PDOMUtils.removeElements(this.parent.peer.primarySibling, thisPeer.topLevelElements);
      for (let i = 0; i < this.relativeNodes.length; i++) {
        this.relativeNodes[i].pdomDisplaysEmitter.removeListener(this.relativeListeners[i]);
      }
    }
    while (this.children.length) {
      this.children.pop().dispose();
    }

    // NOTE: We dispose OUR peer after disposing children, so our peer can be available for our children during
    // disposal.
    thisPeer.dispose();

    // dispose after the peer so the peer can remove any listeners from it
    this.transformTracker.dispose();
    this.transformTracker = null;

    // If we are the root accessible instance, we won't actually have a reference to a node.
    if (this.node) {
      this.node.removePDOMInstance(this);
    }
    this.relativeNodes = null;
    this.display = null;
    this.trail = null;
    this.node = null;
    this.peer = null;
    this.isDisposed = true;
    this.freeToPool();
    sceneryLog && sceneryLog.PDOMInstance && sceneryLog.pop();
  }

  /**
   * For debugging purposes.
   */
  toString() {
    return `${this.id}#{${this.trail.toString()}}`;
  }

  /**
   * For debugging purposes, inspect the tree of PDOMInstances from the root.
   *
   * Only ever called from the _rootPDOMInstance of the display.
   *
   * (scenery-internal)
   */
  auditRoot() {
    if (!assert) {
      return;
    }
    const rootNode = this.display.rootNode;
    assert(this.trail.length === 0, 'Should only call auditRoot() on the root PDOMInstance for a display');
    function audit(fakeInstance, pdomInstance) {
      assert && assert(fakeInstance.children.length === pdomInstance.children.length, 'Different number of children in accessible instance');
      assert && assert(fakeInstance.node === pdomInstance.node, 'Node mismatch for PDOMInstance');
      for (let i = 0; i < pdomInstance.children.length; i++) {
        audit(fakeInstance.children[i], pdomInstance.children[i]);
      }
      const isVisible = pdomInstance.isGloballyVisible();
      let shouldBeVisible = true;
      for (let i = 0; i < pdomInstance.trail.length; i++) {
        const node = pdomInstance.trail.nodes[i];
        const trails = node.getTrailsTo(rootNode).filter(trail => trail.isPDOMVisible());
        if (trails.length === 0) {
          shouldBeVisible = false;
          break;
        }
      }
      assert && assert(isVisible === shouldBeVisible, 'Instance visibility mismatch');
    }
    audit(PDOMInstance.createFakePDOMTree(rootNode), this);
  }

  /**
   * Since a "Trail" on PDOMInstance can have discontinuous jumps (due to pdomOrder), this finds the best
   * actual visual Trail to use, from the trail of a PDOMInstance to the root of a Display.
   *
   * @param trail - trail of the PDOMInstance, which can containe "gaps"
   * @param rootNode - root of a Display
   */
  static guessVisualTrail(trail, rootNode) {
    trail.reindex();

    // Search for places in the trail where adjacent nodes do NOT have a parent-child relationship, i.e.
    // !nodes[ n ].hasChild( nodes[ n + 1 ] ).
    // NOTE: This index points to the parent where this is the case, because the indices in the trail are such that:
    // trail.nodes[ n ].children[ trail.indices[ n ] ] = trail.nodes[ n + 1 ]
    const lastBadIndex = trail.indices.lastIndexOf(-1);

    // If we have no bad indices, just return our trail immediately.
    if (lastBadIndex < 0) {
      return trail;
    }
    const firstGoodIndex = lastBadIndex + 1;
    const firstGoodNode = trail.nodes[firstGoodIndex];
    const baseTrails = firstGoodNode.getTrailsTo(rootNode);

    // firstGoodNode might not be attached to a Display either! Maybe client just hasn't gotten to it yet, so we
    // fail gracefully-ish?
    // assert && assert( baseTrails.length > 0, '"good node" in trail with gap not attached to root')
    if (baseTrails.length === 0) {
      return trail;
    }

    // Add the rest of the trail back in
    const baseTrail = baseTrails[0];
    for (let i = firstGoodIndex + 1; i < trail.length; i++) {
      baseTrail.addDescendant(trail.nodes[i]);
    }
    assert && assert(baseTrail.isValid(), `trail not valid: ${trail.uniqueId}`);
    return baseTrail;
  }

  /**
   * Creates a fake PDOMInstance-like tree structure (with the equivalent nodes and children structure).
   * For debugging.
   *
   * @returns Type FakePDOMInstance: { node: {Node}, children: {Array.<FakePDOMInstance>} }
   */
  static createFakePDOMTree(rootNode) {
    function createFakeTree(node) {
      let fakeInstances = _.flatten(node.getEffectiveChildren().map(createFakeTree));
      if (node.hasPDOMContent) {
        fakeInstances = [{
          node: node,
          children: fakeInstances
        }];
      }
      return fakeInstances;
    }
    return {
      node: null,
      // @ts-expect-error
      children: createFakeTree(rootNode)
    };
  }
  freeToPool() {
    PDOMInstance.pool.freeToPool(this);
  }
  static pool = new Pool(PDOMInstance, {
    initialize: PDOMInstance.prototype.initializePDOMInstance
  });
}
scenery.register('PDOMInstance', PDOMInstance);
export default PDOMInstance;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJkb3RSYW5kb20iLCJjbGVhbkFycmF5IiwiRW51bWVyYXRpb24iLCJFbnVtZXJhdGlvblZhbHVlIiwiUG9vbCIsIkZvY3VzTWFuYWdlciIsIk5vZGUiLCJQRE9NUGVlciIsIlBET01VdGlscyIsInNjZW5lcnkiLCJUcmFpbCIsIlRyYW5zZm9ybVRyYWNrZXIiLCJQRE9NVW5pcXVlSWRTdHJhdGVneSIsIklORElDRVMiLCJUUkFJTF9JRCIsImVudW1lcmF0aW9uIiwiVU5JUVVFX0lEX1NUUkFURUdZIiwiZ2xvYmFsSWQiLCJQRE9NSW5zdGFuY2UiLCJyZWxhdGl2ZU5vZGVzIiwicmVsYXRpdmVWaXNpYmlsaXRpZXMiLCJyZWxhdGl2ZUxpc3RlbmVycyIsInRyYW5zZm9ybVRyYWNrZXIiLCJjb25zdHJ1Y3RvciIsInBhcmVudCIsImRpc3BsYXkiLCJ0cmFpbCIsImluaXRpYWxpemVQRE9NSW5zdGFuY2UiLCJhc3NlcnQiLCJpZCIsImlzRGlzcG9zZWQiLCJpc1Jvb3RJbnN0YW5jZSIsIm5vZGUiLCJsYXN0Tm9kZSIsImNoaWxkcmVuIiwiYWRkUERPTUluc3RhbmNlIiwiaW52aXNpYmxlQ291bnQiLCJ1cGRhdGVUcmFuc2Zvcm1UcmFja2VyIiwicGRvbVRyYW5zZm9ybVNvdXJjZU5vZGUiLCJhY2Nlc3NpYmlsaXR5Q29udGFpbmVyIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwicGVlciIsImNyZWF0ZUZyb21Qb29sIiwicHJpbWFyeVNpYmxpbmciLCJ1cGRhdGUiLCJwYXJlbnRUcmFpbCIsImkiLCJsZW5ndGgiLCJyZWxhdGl2ZU5vZGUiLCJub2RlcyIsInB1c2giLCJwZG9tRGlzcGxheXMiLCJfcGRvbURpc3BsYXlzSW5mbyIsImlzVmlzaWJsZSIsIl8iLCJpbmNsdWRlcyIsImxpc3RlbmVyIiwiY2hlY2tBY2Nlc3NpYmxlRGlzcGxheVZpc2liaWxpdHkiLCJiaW5kIiwicGRvbURpc3BsYXlzRW1pdHRlciIsImFkZExpc3RlbmVyIiwidXBkYXRlVmlzaWJpbGl0eSIsInNjZW5lcnlMb2ciLCJ0b1N0cmluZyIsImFkZENvbnNlY3V0aXZlSW5zdGFuY2VzIiwicGRvbUluc3RhbmNlcyIsIm1hcCIsImluc3QiLCJqb2luIiwiaGFkQ2hpbGRyZW4iLCJBcnJheSIsInByb3RvdHlwZSIsImFwcGx5IiwiaW5zZXJ0RWxlbWVudHMiLCJ0b3BMZXZlbEVsZW1lbnRzIiwic29ydENoaWxkcmVuIiwiaW5uZXJDb250ZW50IiwidXBkYXRlRGVzY2VuZGFudFBlZXJJZHMiLCJwb3AiLCJyZW1vdmVJbnN0YW5jZXNGb3JUcmFpbCIsImNoaWxkSW5zdGFuY2UiLCJjaGlsZFRyYWlsIiwiZGlmZmVycyIsImoiLCJzcGxpY2UiLCJkaXNwb3NlIiwicmVtb3ZlQWxsQ2hpbGRyZW4iLCJmaW5kQ2hpbGRXaXRoVHJhaWwiLCJjaGlsZCIsImVxdWFscyIsInJlbW92ZVN1YnRyZWUiLCJpc0V4dGVuc2lvbk9mIiwiaW5kZXgiLCJpc05vZGVWaXNpYmxlIiwid2FzTm9kZVZpc2libGUiLCJ3YXNWaXNpYmxlIiwic2V0VmlzaWJsZSIsInBkb21Gb2N1c2VkTm9kZSIsImNvbnRhaW5zTm9kZSIsInBkb21Gb2N1cyIsImlzR2xvYmFsbHlWaXNpYmxlIiwiZ2V0Q2hpbGRPcmRlcmluZyIsImVmZmVjdGl2ZUNoaWxkcmVuIiwiZ2V0RWZmZWN0aXZlQ2hpbGRyZW4iLCJpbnN0YW5jZXMiLCJoYXNQRE9NQ29udGVudCIsInBvdGVudGlhbEluc3RhbmNlcyIsImluc3RhbmNlTG9vcCIsInBvdGVudGlhbEluc3RhbmNlIiwiYWRkRGVzY2VuZGFudCIsInJlbW92ZURlc2NlbmRhbnQiLCJub2RlRm9yVHJhaWwiLCJyb290Tm9kZSIsInRhcmdldENoaWxkcmVuIiwiZm9jdXNlZFRyYWlsIiwiY2hpbGROb2RlcyIsImZvY3VzZWRDaGlsZEluc3RhbmNlIiwiZmluZCIsImRlc2lyZWRPcmRlciIsImZsYXR0ZW4iLCJuZWVkc09yZGVyQ2hhbmdlIiwiZXZlcnkiLCJkZXNpcmVkRWxlbWVudCIsInBpdm90RWxlbWVudCIsImdldFRvcExldmVsRWxlbWVudENvbnRhaW5pbmdQcmltYXJ5U2libGluZyIsInBpdm90SW5kZXgiLCJpbmRleE9mIiwiaW5zZXJ0QmVmb3JlIiwiYXBwZW5kQ2hpbGQiLCJwZWVySW5kZXgiLCJlbGVtZW50SW5kZXgiLCJlbGVtZW50IiwidHJhY2tlZFRyYWlsIiwiZ2V0VW5pcXVlVHJhaWwiLCJndWVzc1Zpc3VhbFRyYWlsIiwiZ2V0UERPTUluc3RhbmNlVW5pcXVlSWQiLCJpbmRpY2VzU3RyaW5nIiwicGRvbUluc3RhbmNlIiwibmV4dERvdWJsZSIsInVuc2hpZnQiLCJQRE9NX1VOSVFVRV9JRF9TRVBBUkFUT1IiLCJnZXRVbmlxdWVJZCIsInRvVXBkYXRlIiwiZnJvbSIsInNoaWZ0IiwidXBkYXRlSW5kaWNlc1N0cmluZ0FuZEVsZW1lbnRJZHMiLCJ1bmlxdWVJZFRvVHJhaWwiLCJ1bmlxdWVJZCIsImdldFRyYWlsRnJvbVBET01JbmRpY2VzU3RyaW5nIiwiZnJvbVVuaXF1ZUlkIiwidGhpc1BlZXIiLCJyZW1vdmVFbGVtZW50cyIsInJlbW92ZUxpc3RlbmVyIiwicmVtb3ZlUERPTUluc3RhbmNlIiwiZnJlZVRvUG9vbCIsImF1ZGl0Um9vdCIsImF1ZGl0IiwiZmFrZUluc3RhbmNlIiwic2hvdWxkQmVWaXNpYmxlIiwidHJhaWxzIiwiZ2V0VHJhaWxzVG8iLCJmaWx0ZXIiLCJpc1BET01WaXNpYmxlIiwiY3JlYXRlRmFrZVBET01UcmVlIiwicmVpbmRleCIsImxhc3RCYWRJbmRleCIsImluZGljZXMiLCJsYXN0SW5kZXhPZiIsImZpcnN0R29vZEluZGV4IiwiZmlyc3RHb29kTm9kZSIsImJhc2VUcmFpbHMiLCJiYXNlVHJhaWwiLCJpc1ZhbGlkIiwiY3JlYXRlRmFrZVRyZWUiLCJmYWtlSW5zdGFuY2VzIiwicG9vbCIsImluaXRpYWxpemUiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlBET01JbnN0YW5jZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNS0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBbiBpbnN0YW5jZSB0aGF0IGlzIHN5bmNocm9ub3VzbHkgY3JlYXRlZCwgZm9yIGhhbmRsaW5nIGFjY2Vzc2liaWxpdHkgbmVlZHMuXHJcbiAqXHJcbiAqIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgZXhhbXBsZTpcclxuICpcclxuICogV2UgaGF2ZSBhIG5vZGUgc3RydWN0dXJlOlxyXG4gKiBBXHJcbiAqICBCICggYWNjZXNzaWJsZSApXHJcbiAqICAgIEMgKGFjY2Vzc2libGUgKVxyXG4gKiAgICAgIERcclxuICogICAgICAgIEUgKGFjY2Vzc2libGUpXHJcbiAqICAgICAgICAgRyAoYWNjZXNzaWJsZSlcclxuICogICAgICAgIEZcclxuICogICAgICAgICAgSCAoYWNjZXNzaWJsZSlcclxuICpcclxuICpcclxuICogV2hpY2ggaGFzIGFuIGVxdWl2YWxlbnQgYWNjZXNzaWJsZSBpbnN0YW5jZSB0cmVlOlxyXG4gKiByb290XHJcbiAqICBBQlxyXG4gKiAgICBBQkNcclxuICogICAgICBBQkNERVxyXG4gKiAgICAgICAgQUJDREVHXHJcbiAqICAgICAgQUJDREZIXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgZG90UmFuZG9tIGZyb20gJy4uLy4uLy4uLy4uL2RvdC9qcy9kb3RSYW5kb20uanMnO1xyXG5pbXBvcnQgY2xlYW5BcnJheSBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvY2xlYW5BcnJheS5qcyc7XHJcbmltcG9ydCBFbnVtZXJhdGlvbiBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvRW51bWVyYXRpb24uanMnO1xyXG5pbXBvcnQgRW51bWVyYXRpb25WYWx1ZSBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvRW51bWVyYXRpb25WYWx1ZS5qcyc7XHJcbmltcG9ydCBQb29sIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9Qb29sLmpzJztcclxuaW1wb3J0IHsgRGlzcGxheSwgRm9jdXNNYW5hZ2VyLCBOb2RlLCBQRE9NUGVlciwgUERPTVV0aWxzLCBzY2VuZXJ5LCBUcmFpbCwgVHJhbnNmb3JtVHJhY2tlciB9IGZyb20gJy4uLy4uL2ltcG9ydHMuanMnO1xyXG5cclxuLy8gUERPTUluc3RhbmNlcyBzdXBwb3J0IHR3byBkaWZmZXJlbnQgc3R5bGVzIG9mIHVuaXF1ZSBJRHMsIGVhY2ggd2l0aCB0aGVpciBvd24gdHJhZGVvZmZzLCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvMTg1MVxyXG5jbGFzcyBQRE9NVW5pcXVlSWRTdHJhdGVneSBleHRlbmRzIEVudW1lcmF0aW9uVmFsdWUge1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgSU5ESUNFUyA9IG5ldyBQRE9NVW5pcXVlSWRTdHJhdGVneSgpO1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVFJBSUxfSUQgPSBuZXcgUERPTVVuaXF1ZUlkU3RyYXRlZ3koKTtcclxuXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBlbnVtZXJhdGlvbiA9IG5ldyBFbnVtZXJhdGlvbiggUERPTVVuaXF1ZUlkU3RyYXRlZ3kgKTtcclxufVxyXG5cclxuLy8gQSB0eXBlIHJlcHJlc2VudGluZyBhIGZha2UgaW5zdGFuY2UsIGZvciBzb21lIGFnZ3Jlc3NpdmUgYXVkaXRpbmcgKHVuZGVyID9hc3NlcnRzbG93KVxyXG50eXBlIEZha2VJbnN0YW5jZSA9IHtcclxuICBub2RlOiBOb2RlIHwgbnVsbDtcclxuICBjaGlsZHJlbjogRmFrZUluc3RhbmNlW107XHJcbn07XHJcblxyXG4vLyBUaGlzIGNvbnN0YW50IGlzIHNldCB1cCB0byBhbGxvdyB1cyB0byBjaGFuZ2Ugb3VyIHVuaXF1ZSBpZCBzdHJhdGVneS4gQm90aCBzdHJhdGVnaWVzIGhhdmUgdHJhZGUtb2ZmcyB0aGF0IGFyZVxyXG4vLyBkZXNjcmliZWQgaW4gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXQtaW8vaXNzdWVzLzE4NDcjaXNzdWVjb21tZW50LTEwNjgzNzczMzYuIFRSQUlMX0lEIGlzIG91ciBwYXRoIGZvcndhcmRcclxuLy8gY3VycmVudGx5LCBidXQgd2lsbCBicmVhayBQaEVULWlPIHBsYXliYWNrIGlmIGFueSBOb2RlcyBhcmUgY3JlYXRlZCBpbiB0aGUgcmVjb3JkZWQgc2ltIE9SIHBsYXliYWNrIHNpbSBidXQgbm90XHJcbi8vIGJvdGguIEZ1cnRoZXIgaW5mb3JtYXRpb24gaW4gdGhlIGFib3ZlIGlzc3VlIGFuZCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvMTg1MS5cclxuY29uc3QgVU5JUVVFX0lEX1NUUkFURUdZID0gUERPTVVuaXF1ZUlkU3RyYXRlZ3kuVFJBSUxfSUQ7XHJcblxyXG5sZXQgZ2xvYmFsSWQgPSAxO1xyXG5cclxuY2xhc3MgUERPTUluc3RhbmNlIHtcclxuXHJcbiAgLy8gdW5pcXVlIElEXHJcbiAgcHJpdmF0ZSBpZCE6IG51bWJlcjtcclxuXHJcbiAgcHVibGljIHBhcmVudCE6IFBET01JbnN0YW5jZSB8IG51bGw7XHJcblxyXG4gIC8vIHtEaXNwbGF5fVxyXG4gIHByaXZhdGUgZGlzcGxheSE6IERpc3BsYXkgfCBudWxsO1xyXG5cclxuICBwdWJsaWMgdHJhaWwhOiBUcmFpbCB8IG51bGw7XHJcbiAgcHVibGljIGlzUm9vdEluc3RhbmNlITogYm9vbGVhbjtcclxuICBwdWJsaWMgbm9kZSE6IE5vZGUgfCBudWxsO1xyXG4gIHB1YmxpYyBjaGlsZHJlbiE6IFBET01JbnN0YW5jZVtdO1xyXG4gIHB1YmxpYyBwZWVyITogUERPTVBlZXIgfCBudWxsO1xyXG5cclxuICAvLyB7bnVtYmVyfSAtIFRoZSBudW1iZXIgb2Ygbm9kZXMgaW4gb3VyIHRyYWlsIHRoYXQgYXJlIE5PVCBpbiBvdXIgcGFyZW50J3MgdHJhaWwgYW5kIGRvIE5PVCBoYXZlIG91clxyXG4gIC8vIGRpc3BsYXkgaW4gdGhlaXIgcGRvbURpc3BsYXlzLiBGb3Igbm9uLXJvb3QgaW5zdGFuY2VzLCB0aGlzIGlzIGluaXRpYWxpemVkIGxhdGVyIGluIHRoZSBjb25zdHJ1Y3Rvci5cclxuICBwcml2YXRlIGludmlzaWJsZUNvdW50ITogbnVtYmVyO1xyXG5cclxuICAvLyB7QXJyYXkuPE5vZGU+fSAtIE5vZGVzIHRoYXQgYXJlIGluIG91ciB0cmFpbCAoYnV0IG5vdCB0aG9zZSBvZiBvdXIgcGFyZW50KVxyXG4gIHByaXZhdGUgcmVsYXRpdmVOb2RlczogTm9kZVtdIHwgbnVsbCA9IFtdO1xyXG5cclxuICAvLyB7QXJyYXkuPGJvb2xlYW4+fSAtIFdoZXRoZXIgb3VyIGRpc3BsYXkgaXMgaW4gdGhlIHJlc3BlY3RpdmUgcmVsYXRpdmVOb2RlcycgcGRvbURpc3BsYXlzXHJcbiAgcHJpdmF0ZSByZWxhdGl2ZVZpc2liaWxpdGllczogYm9vbGVhbltdID0gW107XHJcblxyXG4gIC8vIHtmdW5jdGlvbn0gLSBUaGUgbGlzdGVuZXJzIGFkZGVkIHRvIHRoZSByZXNwZWN0aXZlIHJlbGF0aXZlTm9kZXNcclxuICBwcml2YXRlIHJlbGF0aXZlTGlzdGVuZXJzOiAoICgpID0+IHZvaWQgKVtdID0gW107XHJcblxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKSB7VHJhbnNmb3JtVHJhY2tlcnxudWxsfSAtIFVzZWQgdG8gcXVpY2tseSBjb21wdXRlIHRoZSBnbG9iYWwgbWF0cml4IG9mIHRoaXNcclxuICAvLyBpbnN0YW5jZSdzIHRyYW5zZm9ybSBzb3VyY2UgTm9kZSBhbmQgb2JzZXJ2ZSB3aGVuIHRoZSB0cmFuc2Zvcm0gY2hhbmdlcy4gVXNlZCBieSBQRE9NUGVlciB0byB1cGRhdGVcclxuICAvLyBwb3NpdGlvbmluZyBvZiBzaWJsaW5nIGVsZW1lbnRzLiBCeSBkZWZhdWx0LCB3YXRjaGVzIHRoaXMgUERPTUluc3RhbmNlJ3MgdmlzdWFsIHRyYWlsLlxyXG4gIHB1YmxpYyB0cmFuc2Zvcm1UcmFja2VyOiBUcmFuc2Zvcm1UcmFja2VyIHwgbnVsbCA9IG51bGw7XHJcblxyXG4gIC8vIHtib29sZWFufSAtIFdoZXRoZXIgd2UgYXJlIGN1cnJlbnRseSBpbiBhIFwiZGlzcG9zZWRcIiAoaW4gdGhlIHBvb2wpIHN0YXRlLCBvciBhcmUgYXZhaWxhYmxlIHRvIGJlXHJcbiAgLy8gcmUtaW5pdGlhbGl6ZWRcclxuICBwcml2YXRlIGlzRGlzcG9zZWQhOiBib29sZWFuO1xyXG5cclxuICAvKipcclxuICAgKiBDb25zdHJ1Y3RvciBmb3IgUERPTUluc3RhbmNlLCB1c2VzIGFuIGluaXRpYWxpemUgbWV0aG9kIGZvciBwb29saW5nLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHBhcmVudCAtIHBhcmVudCBvZiB0aGlzIGluc3RhbmNlLCBudWxsIGlmIHJvb3Qgb2YgUERPTUluc3RhbmNlIHRyZWVcclxuICAgKiBAcGFyYW0gZGlzcGxheVxyXG4gICAqIEBwYXJhbSB0cmFpbCAtIHRyYWlsIHRvIHRoZSBub2RlIGZvciB0aGlzIFBET01JbnN0YW5jZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggcGFyZW50OiBQRE9NSW5zdGFuY2UgfCBudWxsLCBkaXNwbGF5OiBEaXNwbGF5LCB0cmFpbDogVHJhaWwgKSB7XHJcbiAgICB0aGlzLmluaXRpYWxpemVQRE9NSW5zdGFuY2UoIHBhcmVudCwgZGlzcGxheSwgdHJhaWwgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIGEgUERPTUluc3RhbmNlLCBpbXBsZW1lbnRzIGNvbnN0cnVjdGlvbiBmb3IgcG9vbGluZy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBwYXJlbnQgLSBudWxsIGlmIHRoaXMgUERPTUluc3RhbmNlIGlzIHJvb3Qgb2YgUERPTUluc3RhbmNlIHRyZWVcclxuICAgKiBAcGFyYW0gZGlzcGxheVxyXG4gICAqIEBwYXJhbSB0cmFpbCAtIHRyYWlsIHRvIG5vZGUgZm9yIHRoaXMgUERPTUluc3RhbmNlXHJcbiAgICogQHJldHVybnMgLSBSZXR1cm5zICd0aGlzJyByZWZlcmVuY2UsIGZvciBjaGFpbmluZ1xyXG4gICAqL1xyXG4gIHB1YmxpYyBpbml0aWFsaXplUERPTUluc3RhbmNlKCBwYXJlbnQ6IFBET01JbnN0YW5jZSB8IG51bGwsIGRpc3BsYXk6IERpc3BsYXksIHRyYWlsOiBUcmFpbCApOiBQRE9NSW5zdGFuY2Uge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMuaWQgfHwgdGhpcy5pc0Rpc3Bvc2VkLCAnSWYgd2UgcHJldmlvdXNseSBleGlzdGVkLCB3ZSBuZWVkIHRvIGhhdmUgYmVlbiBkaXNwb3NlZCcgKTtcclxuXHJcbiAgICAvLyB1bmlxdWUgSURcclxuICAgIHRoaXMuaWQgPSB0aGlzLmlkIHx8IGdsb2JhbElkKys7XHJcblxyXG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XHJcblxyXG4gICAgLy8ge0Rpc3BsYXl9XHJcbiAgICB0aGlzLmRpc3BsYXkgPSBkaXNwbGF5O1xyXG5cclxuICAgIC8vIHtUcmFpbH1cclxuICAgIHRoaXMudHJhaWwgPSB0cmFpbDtcclxuXHJcbiAgICAvLyB7Ym9vbGVhbn1cclxuICAgIHRoaXMuaXNSb290SW5zdGFuY2UgPSBwYXJlbnQgPT09IG51bGw7XHJcblxyXG4gICAgLy8ge05vZGV8bnVsbH1cclxuICAgIHRoaXMubm9kZSA9IHRoaXMuaXNSb290SW5zdGFuY2UgPyBudWxsIDogdHJhaWwubGFzdE5vZGUoKTtcclxuXHJcbiAgICAvLyB7QXJyYXkuPFBET01JbnN0YW5jZT59XHJcbiAgICB0aGlzLmNoaWxkcmVuID0gY2xlYW5BcnJheSggdGhpcy5jaGlsZHJlbiApO1xyXG5cclxuICAgIC8vIElmIHdlIGFyZSB0aGUgcm9vdCBhY2Nlc3NpYmxlIGluc3RhbmNlLCB3ZSB3b24ndCBhY3R1YWxseSBoYXZlIGEgcmVmZXJlbmNlIHRvIGEgbm9kZS5cclxuICAgIGlmICggdGhpcy5ub2RlICkge1xyXG4gICAgICB0aGlzLm5vZGUuYWRkUERPTUluc3RhbmNlKCB0aGlzICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8ge251bWJlcn0gLSBUaGUgbnVtYmVyIG9mIG5vZGVzIGluIG91ciB0cmFpbCB0aGF0IGFyZSBOT1QgaW4gb3VyIHBhcmVudCdzIHRyYWlsIGFuZCBkbyBOT1QgaGF2ZSBvdXJcclxuICAgIC8vIGRpc3BsYXkgaW4gdGhlaXIgcGRvbURpc3BsYXlzLiBGb3Igbm9uLXJvb3QgaW5zdGFuY2VzLCB0aGlzIGlzIGluaXRpYWxpemVkIGxhdGVyIGluIHRoZSBjb25zdHJ1Y3Rvci5cclxuICAgIHRoaXMuaW52aXNpYmxlQ291bnQgPSAwO1xyXG5cclxuICAgIC8vIHtBcnJheS48Tm9kZT59IC0gTm9kZXMgdGhhdCBhcmUgaW4gb3VyIHRyYWlsIChidXQgbm90IHRob3NlIG9mIG91ciBwYXJlbnQpXHJcbiAgICB0aGlzLnJlbGF0aXZlTm9kZXMgPSBbXTtcclxuXHJcbiAgICAvLyB7QXJyYXkuPGJvb2xlYW4+fSAtIFdoZXRoZXIgb3VyIGRpc3BsYXkgaXMgaW4gdGhlIHJlc3BlY3RpdmUgcmVsYXRpdmVOb2RlcycgcGRvbURpc3BsYXlzXHJcbiAgICB0aGlzLnJlbGF0aXZlVmlzaWJpbGl0aWVzID0gW107XHJcblxyXG4gICAgLy8ge2Z1bmN0aW9ufSAtIFRoZSBsaXN0ZW5lcnMgYWRkZWQgdG8gdGhlIHJlc3BlY3RpdmUgcmVsYXRpdmVOb2Rlc1xyXG4gICAgdGhpcy5yZWxhdGl2ZUxpc3RlbmVycyA9IFtdO1xyXG5cclxuICAgIC8vIChzY2VuZXJ5LWludGVybmFsKSB7VHJhbnNmb3JtVHJhY2tlcnxudWxsfSAtIFVzZWQgdG8gcXVpY2tseSBjb21wdXRlIHRoZSBnbG9iYWwgbWF0cml4IG9mIHRoaXNcclxuICAgIC8vIGluc3RhbmNlJ3MgdHJhbnNmb3JtIHNvdXJjZSBOb2RlIGFuZCBvYnNlcnZlIHdoZW4gdGhlIHRyYW5zZm9ybSBjaGFuZ2VzLiBVc2VkIGJ5IFBET01QZWVyIHRvIHVwZGF0ZVxyXG4gICAgLy8gcG9zaXRpb25pbmcgb2Ygc2libGluZyBlbGVtZW50cy4gQnkgZGVmYXVsdCwgd2F0Y2hlcyB0aGlzIFBET01JbnN0YW5jZSdzIHZpc3VhbCB0cmFpbC5cclxuICAgIHRoaXMudHJhbnNmb3JtVHJhY2tlciA9IG51bGw7XHJcbiAgICB0aGlzLnVwZGF0ZVRyYW5zZm9ybVRyYWNrZXIoIHRoaXMubm9kZSA/IHRoaXMubm9kZS5wZG9tVHJhbnNmb3JtU291cmNlTm9kZSA6IG51bGwgKTtcclxuXHJcbiAgICAvLyB7Ym9vbGVhbn0gLSBXaGV0aGVyIHdlIGFyZSBjdXJyZW50bHkgaW4gYSBcImRpc3Bvc2VkXCIgKGluIHRoZSBwb29sKSBzdGF0ZSwgb3IgYXJlIGF2YWlsYWJsZSB0byBiZVxyXG4gICAgLy8gcmUtaW5pdGlhbGl6ZWRcclxuICAgIHRoaXMuaXNEaXNwb3NlZCA9IGZhbHNlO1xyXG5cclxuICAgIGlmICggdGhpcy5pc1Jvb3RJbnN0YW5jZSApIHtcclxuICAgICAgY29uc3QgYWNjZXNzaWJpbGl0eUNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XHJcblxyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gUG9vbGFibGUgaXMgYSBtaXhpbiBhbmQgVHlwZVNjcmlwdCBkb2Vzbid0IGhhdmUgZ29vZCBtaXhpbiBzdXBwb3J0XHJcbiAgICAgIHRoaXMucGVlciA9IFBET01QZWVyLmNyZWF0ZUZyb21Qb29sKCB0aGlzLCB7XHJcbiAgICAgICAgcHJpbWFyeVNpYmxpbmc6IGFjY2Vzc2liaWxpdHlDb250YWluZXJcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcblxyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gUG9vbGFibGUgYSBtaXhpbiBhbmQgVHlwZVNjcmlwdCBkb2Vzbid0IGhhdmUgZ29vZCBtaXhpbiBzdXBwb3J0XHJcbiAgICAgIHRoaXMucGVlciA9IFBET01QZWVyLmNyZWF0ZUZyb21Qb29sKCB0aGlzICk7XHJcblxyXG4gICAgICAvLyBUaGUgcGVlciBpcyBub3QgZnVsbHkgY29uc3RydWN0ZWQgdW50aWwgdGhpcyB1cGRhdGUgZnVuY3Rpb24gaXMgY2FsbGVkLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzgzMlxyXG4gICAgICAvLyBUcmFpbCBJZHMgd2lsbCBuZXZlciBjaGFuZ2UsIHNvIHVwZGF0ZSB0aGVtIGVhZ2VybHksIGEgc2luZ2xlIHRpbWUgZHVyaW5nIGNvbnN0cnVjdGlvbi5cclxuICAgICAgdGhpcy5wZWVyIS51cGRhdGUoIFVOSVFVRV9JRF9TVFJBVEVHWSA9PT0gUERPTVVuaXF1ZUlkU3RyYXRlZ3kuVFJBSUxfSUQgKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5wZWVyIS5wcmltYXJ5U2libGluZywgJ2FjY2Vzc2libGUgcGVlciBtdXN0IGhhdmUgYSBwcmltYXJ5U2libGluZyB1cG9uIGNvbXBsZXRpb24gb2YgY29uc3RydWN0aW9uJyApO1xyXG5cclxuICAgICAgLy8gU2NhbiBvdmVyIGFsbCBvZiB0aGUgbm9kZXMgaW4gb3VyIHRyYWlsICh0aGF0IGFyZSBOT1QgaW4gb3VyIHBhcmVudCdzIHRyYWlsKSB0byBjaGVjayBmb3IgcGRvbURpc3BsYXlzXHJcbiAgICAgIC8vIHNvIHdlIGNhbiBpbml0aWFsaXplIG91ciBpbnZpc2libGVDb3VudCBhbmQgYWRkIGxpc3RlbmVycy5cclxuICAgICAgY29uc3QgcGFyZW50VHJhaWwgPSB0aGlzLnBhcmVudCEudHJhaWwhO1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IHBhcmVudFRyYWlsLmxlbmd0aDsgaSA8IHRyYWlsLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIGNvbnN0IHJlbGF0aXZlTm9kZSA9IHRyYWlsLm5vZGVzWyBpIF07XHJcbiAgICAgICAgdGhpcy5yZWxhdGl2ZU5vZGVzLnB1c2goIHJlbGF0aXZlTm9kZSApO1xyXG5cclxuICAgICAgICBjb25zdCBwZG9tRGlzcGxheXMgPSByZWxhdGl2ZU5vZGUuX3Bkb21EaXNwbGF5c0luZm8ucGRvbURpc3BsYXlzO1xyXG4gICAgICAgIGNvbnN0IGlzVmlzaWJsZSA9IF8uaW5jbHVkZXMoIHBkb21EaXNwbGF5cywgZGlzcGxheSApO1xyXG4gICAgICAgIHRoaXMucmVsYXRpdmVWaXNpYmlsaXRpZXMucHVzaCggaXNWaXNpYmxlICk7XHJcbiAgICAgICAgaWYgKCAhaXNWaXNpYmxlICkge1xyXG4gICAgICAgICAgdGhpcy5pbnZpc2libGVDb3VudCsrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgbGlzdGVuZXIgPSB0aGlzLmNoZWNrQWNjZXNzaWJsZURpc3BsYXlWaXNpYmlsaXR5LmJpbmQoIHRoaXMsIGkgLSBwYXJlbnRUcmFpbC5sZW5ndGggKTtcclxuICAgICAgICByZWxhdGl2ZU5vZGUucGRvbURpc3BsYXlzRW1pdHRlci5hZGRMaXN0ZW5lciggbGlzdGVuZXIgKTtcclxuICAgICAgICB0aGlzLnJlbGF0aXZlTGlzdGVuZXJzLnB1c2goIGxpc3RlbmVyICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMudXBkYXRlVmlzaWJpbGl0eSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5QRE9NSW5zdGFuY2UoXHJcbiAgICAgIGBJbml0aWFsaXplZCAke3RoaXMudG9TdHJpbmcoKX1gICk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGEgc2VyaWVzIG9mIChzb3J0ZWQpIGFjY2Vzc2libGUgaW5zdGFuY2VzIGFzIGNoaWxkcmVuLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGRDb25zZWN1dGl2ZUluc3RhbmNlcyggcGRvbUluc3RhbmNlczogUERPTUluc3RhbmNlW10gKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUERPTUluc3RhbmNlICYmIHNjZW5lcnlMb2cuUERPTUluc3RhbmNlKFxyXG4gICAgICBgYWRkQ29uc2VjdXRpdmVJbnN0YW5jZXMgb24gJHt0aGlzLnRvU3RyaW5nKCl9IHdpdGg6ICR7cGRvbUluc3RhbmNlcy5tYXAoIGluc3QgPT4gaW5zdC50b1N0cmluZygpICkuam9pbiggJywnICl9YCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlBET01JbnN0YW5jZSAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICBjb25zdCBoYWRDaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoID4gMDtcclxuXHJcbiAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSggdGhpcy5jaGlsZHJlbiwgcGRvbUluc3RhbmNlcyApO1xyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHBkb21JbnN0YW5jZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIC8vIEFwcGVuZCB0aGUgY29udGFpbmVyIHBhcmVudCB0byB0aGUgZW5kIChzbyB0aGF0LCB3aGVuIHByb3ZpZGVkIGluIG9yZGVyLCB3ZSBkb24ndCBoYXZlIHRvIHJlc29ydCBiZWxvd1xyXG4gICAgICAvLyB3aGVuIGluaXRpYWxpemluZykuXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoICEhdGhpcy5wZWVyIS5wcmltYXJ5U2libGluZywgJ1ByaW1hcnkgc2libGluZyBtdXN0IGJlIGRlZmluZWQgdG8gaW5zZXJ0IGVsZW1lbnRzLicgKTtcclxuXHJcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSB3aGVuIFBET01QZWVyIGlzIGNvbnZlcnRlZCB0byBUUyB0aGlzIHRzLWV4cGVjdC1lcnJvciBjYW4gcHJvYmFibHkgYmUgcmVtb3ZlZFxyXG4gICAgICBQRE9NVXRpbHMuaW5zZXJ0RWxlbWVudHMoIHRoaXMucGVlci5wcmltYXJ5U2libGluZyEsIHBkb21JbnN0YW5jZXNbIGkgXS5wZWVyLnRvcExldmVsRWxlbWVudHMgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIGhhZENoaWxkcmVuICkge1xyXG4gICAgICB0aGlzLnNvcnRDaGlsZHJlbigpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggYXNzZXJ0ICYmIHRoaXMubm9kZSApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5ub2RlIGluc3RhbmNlb2YgTm9kZSApO1xyXG5cclxuICAgICAgLy8gV2UgZG8gbm90IHN1cHBvcnQgcmVuZGVyaW5nIGNoaWxkcmVuIGludG8gYSBOb2RlIHRoYXQgaGFzIGlubmVyQ29udGVudC5cclxuICAgICAgLy8gSWYgeW91IGhpdCB0aGlzIHdoZW4gbXV0YXRpbmcgYm90aCBjaGlsZHJlbiBhbmQgaW5uZXJDb250ZW50IGF0IHRoZSBzYW1lIHRpbWUsIGl0IGlzIGFuIGlzc3VlIHdpdGggc2NlbmVyeS5cclxuICAgICAgLy8gUmVtb3ZlIG9uZSBpbiBhIHNpbmdsZSBzdGVwIGFuZCB0aGVtIGFkZCB0aGVuIG90aGVyIGluIHRoZSBuZXh0IHN0ZXAuXHJcbiAgICAgIHRoaXMuY2hpbGRyZW4ubGVuZ3RoID4gMCAmJiBhc3NlcnQoICF0aGlzLm5vZGUuaW5uZXJDb250ZW50LFxyXG4gICAgICAgIGAke3RoaXMuY2hpbGRyZW4ubGVuZ3RofSBjaGlsZCBQRE9NSW5zdGFuY2VzIHByZXNlbnQgYnV0IHRoaXMgbm9kZSBoYXMgaW5uZXJDb250ZW50OiAke3RoaXMubm9kZS5pbm5lckNvbnRlbnR9YCApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggVU5JUVVFX0lEX1NUUkFURUdZID09PSBQRE9NVW5pcXVlSWRTdHJhdGVneS5JTkRJQ0VTICkge1xyXG5cclxuICAgICAgLy8gVGhpcyBraWxscyBwZXJmb3JtYW5jZSBpZiB0aGVyZSBhcmUgZW5vdWdoIFBET01JbnN0YW5jZXNcclxuICAgICAgdGhpcy51cGRhdGVEZXNjZW5kYW50UGVlcklkcyggcGRvbUluc3RhbmNlcyApO1xyXG4gICAgfVxyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgYW55IGNoaWxkIGluc3RhbmNlcyB0aGF0IGFyZSBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgdHJhaWwuXHJcbiAgICovXHJcbiAgcHVibGljIHJlbW92ZUluc3RhbmNlc0ZvclRyYWlsKCB0cmFpbDogVHJhaWwgKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUERPTUluc3RhbmNlICYmIHNjZW5lcnlMb2cuUERPTUluc3RhbmNlKFxyXG4gICAgICBgcmVtb3ZlSW5zdGFuY2VzRm9yVHJhaWwgb24gJHt0aGlzLnRvU3RyaW5nKCl9IHdpdGggdHJhaWwgJHt0cmFpbC50b1N0cmluZygpfWAgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgY2hpbGRJbnN0YW5jZSA9IHRoaXMuY2hpbGRyZW5bIGkgXTtcclxuICAgICAgY29uc3QgY2hpbGRUcmFpbCA9IGNoaWxkSW5zdGFuY2UudHJhaWw7XHJcblxyXG4gICAgICAvLyBOb3Qgd29ydGggaXQgdG8gaW5zcGVjdCBiZWZvcmUgb3VyIHRyYWlsIGVuZHMsIHNpbmNlIGl0IHNob3VsZCBiZSAoISkgZ3VhcmFudGVlZCB0byBiZSBlcXVhbFxyXG4gICAgICBsZXQgZGlmZmVycyA9IGNoaWxkVHJhaWwhLmxlbmd0aCA8IHRyYWlsLmxlbmd0aDtcclxuICAgICAgaWYgKCAhZGlmZmVycyApIHtcclxuICAgICAgICBmb3IgKCBsZXQgaiA9IHRoaXMudHJhaWwhLmxlbmd0aDsgaiA8IHRyYWlsLmxlbmd0aDsgaisrICkge1xyXG4gICAgICAgICAgaWYgKCB0cmFpbC5ub2Rlc1sgaiBdICE9PSBjaGlsZFRyYWlsIS5ub2Rlc1sgaiBdICkge1xyXG4gICAgICAgICAgICBkaWZmZXJzID0gdHJ1ZTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoICFkaWZmZXJzICkge1xyXG4gICAgICAgIHRoaXMuY2hpbGRyZW4uc3BsaWNlKCBpLCAxICk7XHJcbiAgICAgICAgY2hpbGRJbnN0YW5jZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgaSAtPSAxO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlBET01JbnN0YW5jZSAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyBhbGwgb2YgdGhlIGNoaWxkcmVuLlxyXG4gICAqL1xyXG4gIHB1YmxpYyByZW1vdmVBbGxDaGlsZHJlbigpOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5QRE9NSW5zdGFuY2UoIGByZW1vdmVBbGxDaGlsZHJlbiBvbiAke3RoaXMudG9TdHJpbmcoKX1gICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUERPTUluc3RhbmNlICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIHdoaWxlICggdGhpcy5jaGlsZHJlbi5sZW5ndGggKSB7XHJcbiAgICAgIHRoaXMuY2hpbGRyZW4ucG9wKCkhLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUERPTUluc3RhbmNlICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgUERPTUluc3RhbmNlIGNoaWxkIChpZiBvbmUgZXhpc3RzIHdpdGggdGhlIGdpdmVuIFRyYWlsKSwgb3IgbnVsbCBvdGhlcndpc2UuXHJcbiAgICovXHJcbiAgcHVibGljIGZpbmRDaGlsZFdpdGhUcmFpbCggdHJhaWw6IFRyYWlsICk6IFBET01JbnN0YW5jZSB8IG51bGwge1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgY2hpbGQgPSB0aGlzLmNoaWxkcmVuWyBpIF07XHJcbiAgICAgIGlmICggY2hpbGQudHJhaWwhLmVxdWFscyggdHJhaWwgKSApIHtcclxuICAgICAgICByZXR1cm4gY2hpbGQ7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlIGEgc3VidHJlZSBvZiBQRE9NSW5zdGFuY2VzIGZyb20gdGhpcyBQRE9NSW5zdGFuY2VcclxuICAgKlxyXG4gICAqIEBwYXJhbSB0cmFpbCAtIGNoaWxkcmVuIG9mIHRoaXMgUERPTUluc3RhbmNlIHdpbGwgYmUgcmVtb3ZlZCBpZiB0aGUgY2hpbGQgdHJhaWxzIGFyZSBleHRlbnNpb25zXHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgICBvZiB0aGUgdHJhaWwuXHJcbiAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIHJlbW92ZVN1YnRyZWUoIHRyYWlsOiBUcmFpbCApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5QRE9NSW5zdGFuY2UoXHJcbiAgICAgIGByZW1vdmVTdWJ0cmVlIG9uICR7dGhpcy50b1N0cmluZygpfSB3aXRoIHRyYWlsICR7dHJhaWwudG9TdHJpbmcoKX1gICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUERPTUluc3RhbmNlICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIGZvciAoIGxldCBpID0gdGhpcy5jaGlsZHJlbi5sZW5ndGggLSAxOyBpID49IDA7IGktLSApIHtcclxuICAgICAgY29uc3QgY2hpbGRJbnN0YW5jZSA9IHRoaXMuY2hpbGRyZW5bIGkgXTtcclxuICAgICAgaWYgKCBjaGlsZEluc3RhbmNlLnRyYWlsIS5pc0V4dGVuc2lvbk9mKCB0cmFpbCwgdHJ1ZSApICkge1xyXG4gICAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NSW5zdGFuY2UgJiYgc2NlbmVyeUxvZy5QRE9NSW5zdGFuY2UoXHJcbiAgICAgICAgICBgUmVtb3ZlIHBhcmVudDogJHt0aGlzLnRvU3RyaW5nKCl9LCBjaGlsZDogJHtjaGlsZEluc3RhbmNlLnRvU3RyaW5nKCl9YCApO1xyXG4gICAgICAgIHRoaXMuY2hpbGRyZW4uc3BsaWNlKCBpLCAxICk7IC8vIHJlbW92ZSBpdCBmcm9tIHRoZSBjaGlsZHJlbiBhcnJheVxyXG5cclxuICAgICAgICAvLyBEaXNwb3NlIHRoZSBlbnRpcmUgc3VidHJlZSBvZiBQRE9NSW5zdGFuY2VzXHJcbiAgICAgICAgY2hpbGRJbnN0YW5jZS5kaXNwb3NlKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUERPTUluc3RhbmNlICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDaGVja3MgdG8gc2VlIHdoZXRoZXIgb3VyIHZpc2liaWxpdHkgbmVlZHMgYW4gdXBkYXRlIGJhc2VkIG9uIGEgcGRvbURpc3BsYXlzIGNoYW5nZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBpbmRleCAtIEluZGV4IGludG8gdGhlIHJlbGF0aXZlTm9kZXMgYXJyYXkgKHdoaWNoIG5vZGUgaGFkIHRoZSBub3RpZmljYXRpb24pXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBjaGVja0FjY2Vzc2libGVEaXNwbGF5VmlzaWJpbGl0eSggaW5kZXg6IG51bWJlciApOiB2b2lkIHtcclxuICAgIGNvbnN0IGlzTm9kZVZpc2libGUgPSBfLmluY2x1ZGVzKCB0aGlzLnJlbGF0aXZlTm9kZXMhWyBpbmRleCBdLl9wZG9tRGlzcGxheXNJbmZvLnBkb21EaXNwbGF5cywgdGhpcy5kaXNwbGF5ICk7XHJcbiAgICBjb25zdCB3YXNOb2RlVmlzaWJsZSA9IHRoaXMucmVsYXRpdmVWaXNpYmlsaXRpZXNbIGluZGV4IF07XHJcblxyXG4gICAgaWYgKCBpc05vZGVWaXNpYmxlICE9PSB3YXNOb2RlVmlzaWJsZSApIHtcclxuICAgICAgdGhpcy5yZWxhdGl2ZVZpc2liaWxpdGllc1sgaW5kZXggXSA9IGlzTm9kZVZpc2libGU7XHJcblxyXG4gICAgICBjb25zdCB3YXNWaXNpYmxlID0gdGhpcy5pbnZpc2libGVDb3VudCA9PT0gMDtcclxuXHJcbiAgICAgIHRoaXMuaW52aXNpYmxlQ291bnQgKz0gKCBpc05vZGVWaXNpYmxlID8gLTEgOiAxICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuaW52aXNpYmxlQ291bnQgPj0gMCAmJiB0aGlzLmludmlzaWJsZUNvdW50IDw9IHRoaXMucmVsYXRpdmVOb2RlcyEubGVuZ3RoICk7XHJcblxyXG4gICAgICBjb25zdCBpc1Zpc2libGUgPSB0aGlzLmludmlzaWJsZUNvdW50ID09PSAwO1xyXG5cclxuICAgICAgaWYgKCBpc1Zpc2libGUgIT09IHdhc1Zpc2libGUgKSB7XHJcbiAgICAgICAgdGhpcy51cGRhdGVWaXNpYmlsaXR5KCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwZGF0ZSB2aXNpYmlsaXR5IG9mIHRoaXMgcGVlcidzIGFjY2Vzc2libGUgRE9NIGNvbnRlbnQuIFRoZSBoaWRkZW4gYXR0cmlidXRlIHdpbGwgaGlkZSBhbGwgb2YgdGhlIGRlc2NlbmRhbnRcclxuICAgKiBET00gY29udGVudCwgc28gaXQgaXMgbm90IG5lY2Vzc2FyeSB0byB1cGRhdGUgdGhlIHN1YnRyZWUgb2YgUERPTUluc3RhbmNlcyBzaW5jZSB0aGUgYnJvd3NlclxyXG4gICAqIHdpbGwgZG8gdGhpcyBmb3IgdXMuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSB1cGRhdGVWaXNpYmlsaXR5KCk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggISF0aGlzLnBlZXIsICdQZWVyIG5lZWRzIHRvIGJlIGF2YWlsYWJsZSBvbiB1cGRhdGUgdmlzaWJpbGl0eS4nICk7XHJcbiAgICB0aGlzLnBlZXIhLnNldFZpc2libGUoIHRoaXMuaW52aXNpYmxlQ291bnQgPD0gMCApO1xyXG5cclxuICAgIC8vIGlmIHdlIGhpZCBhIHBhcmVudCBlbGVtZW50LCBibHVyIGZvY3VzIGlmIGFjdGl2ZSBlbGVtZW50IHdhcyBhbiBhbmNlc3RvclxyXG4gICAgaWYgKCAhdGhpcy5wZWVyIS5pc1Zpc2libGUoKSAmJiBGb2N1c01hbmFnZXIucGRvbUZvY3VzZWROb2RlICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBGb2N1c01hbmFnZXIucGRvbUZvY3VzZWROb2RlLnBkb21JbnN0YW5jZXMubGVuZ3RoID09PSAxLFxyXG4gICAgICAgICdmb2N1c2FibGUgTm9kZXMgZG8gbm90IHN1cHBvcnQgREFHLCBhbmQgc2hvdWxkIGJlIGNvbm5lY3RlZCB3aXRoIGFuIGluc3RhbmNlIGlmIGZvY3VzZWQuJyApO1xyXG5cclxuICAgICAgLy8gTk9URTogV2UgZG9uJ3Qgc2VlbSB0byBiZSBhYmxlIHRvIGltcG9ydCBub3JtYWxseSBoZXJlXHJcbiAgICAgIGlmICggRm9jdXNNYW5hZ2VyLnBkb21Gb2N1c2VkTm9kZS5wZG9tSW5zdGFuY2VzWyAwIF0udHJhaWwhLmNvbnRhaW5zTm9kZSggdGhpcy5ub2RlISApICkge1xyXG4gICAgICAgIEZvY3VzTWFuYWdlci5wZG9tRm9jdXMgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIHBhcmFsbGVsIERPTSBmb3IgdGhpcyBpbnN0YW5jZSBhbmQgaXRzIGFuY2VzdG9ycyBhcmUgbm90IGhpZGRlbi5cclxuICAgKi9cclxuICBwdWJsaWMgaXNHbG9iYWxseVZpc2libGUoKTogYm9vbGVhbiB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhIXRoaXMucGVlciwgJ1BET01QZWVyIG5lZWRzIHRvIGJlIGF2YWlsYWJsZSwgaGFzIHRoaXMgUERPTUluc3RhbmNlIGJlZW4gZGlzcG9zZWQ/JyApO1xyXG5cclxuICAgIC8vIElmIHRoaXMgcGVlciBpcyBoaWRkZW4sIHRoZW4gcmV0dXJuIGJlY2F1c2UgdGhhdCBhdHRyaWJ1dGUgd2lsbCBidWJibGUgZG93biB0byBjaGlsZHJlbixcclxuICAgIC8vIG90aGVyd2lzZSByZWN1cnNlIHRvIHBhcmVudC5cclxuICAgIGlmICggIXRoaXMucGVlciEuaXNWaXNpYmxlKCkgKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0aGlzLnBhcmVudCApIHtcclxuICAgICAgcmV0dXJuIHRoaXMucGFyZW50LmlzR2xvYmFsbHlWaXNpYmxlKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHsgLy8gYmFzZSBjYXNlIGF0IHJvb3RcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoYXQgb3VyIGxpc3Qgb2YgY2hpbGRyZW4gKGFmdGVyIHNvcnRpbmcpIHNob3VsZCBiZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB0cmFpbCAtIEEgcGFydGlhbCB0cmFpbCwgd2hlcmUgdGhlIHJvb3Qgb2YgdGhlIHRyYWlsIGlzIGVpdGhlciB0aGlzLm5vZGUgb3IgdGhlIGRpc3BsYXkncyByb290XHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgICBub2RlIChpZiB3ZSBhcmUgdGhlIHJvb3QgUERPTUluc3RhbmNlKVxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2V0Q2hpbGRPcmRlcmluZyggdHJhaWw6IFRyYWlsICk6IFBET01JbnN0YW5jZVtdIHtcclxuICAgIGNvbnN0IG5vZGUgPSB0cmFpbC5sYXN0Tm9kZSgpO1xyXG4gICAgY29uc3QgZWZmZWN0aXZlQ2hpbGRyZW4gPSBub2RlLmdldEVmZmVjdGl2ZUNoaWxkcmVuKCk7XHJcbiAgICBsZXQgaTtcclxuICAgIGNvbnN0IGluc3RhbmNlczogUERPTUluc3RhbmNlW10gPSBbXTtcclxuXHJcbiAgICAvLyBiYXNlIGNhc2UsIG5vZGUgaGFzIGFjY2Vzc2libGUgY29udGVudCwgYnV0IGRvbid0IG1hdGNoIHRoZSBcInJvb3RcIiBub2RlIG9mIHRoaXMgYWNjZXNzaWJsZSBpbnN0YW5jZVxyXG4gICAgaWYgKCBub2RlLmhhc1BET01Db250ZW50ICYmIG5vZGUgIT09IHRoaXMubm9kZSApIHtcclxuICAgICAgY29uc3QgcG90ZW50aWFsSW5zdGFuY2VzID0gbm9kZS5wZG9tSW5zdGFuY2VzO1xyXG5cclxuICAgICAgaW5zdGFuY2VMb29wOiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWxhYmVsc1xyXG4gICAgICAgIGZvciAoIGkgPSAwOyBpIDwgcG90ZW50aWFsSW5zdGFuY2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgY29uc3QgcG90ZW50aWFsSW5zdGFuY2UgPSBwb3RlbnRpYWxJbnN0YW5jZXNbIGkgXTtcclxuICAgICAgICAgIGlmICggcG90ZW50aWFsSW5zdGFuY2UucGFyZW50ICE9PSB0aGlzICkge1xyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBmb3IgKCBsZXQgaiA9IDA7IGogPCB0cmFpbC5sZW5ndGg7IGorKyApIHtcclxuICAgICAgICAgICAgaWYgKCB0cmFpbC5ub2Rlc1sgaiBdICE9PSBwb3RlbnRpYWxJbnN0YW5jZS50cmFpbCEubm9kZXNbIGogKyBwb3RlbnRpYWxJbnN0YW5jZS50cmFpbCEubGVuZ3RoIC0gdHJhaWwubGVuZ3RoIF0gKSB7XHJcbiAgICAgICAgICAgICAgY29udGludWUgaW5zdGFuY2VMb29wOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWxhYmVsc1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaW5zdGFuY2VzLnB1c2goIHBvdGVudGlhbEluc3RhbmNlICk7IC8vIGxlbmd0aCB3aWxsIGFsd2F5cyBiZSAxXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggaW5zdGFuY2VzLmxlbmd0aCA8PSAxLCAnSWYgd2Ugc2VsZWN0IG1vcmUgdGhhbiBvbmUgdGhpcyB3YXksIHdlIGhhdmUgcHJvYmxlbXMnICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgZm9yICggaSA9IDA7IGkgPCBlZmZlY3RpdmVDaGlsZHJlbi5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICB0cmFpbC5hZGREZXNjZW5kYW50KCBlZmZlY3RpdmVDaGlsZHJlblsgaSBdLCBpICk7XHJcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoIGluc3RhbmNlcywgdGhpcy5nZXRDaGlsZE9yZGVyaW5nKCB0cmFpbCApICk7XHJcbiAgICAgICAgdHJhaWwucmVtb3ZlRGVzY2VuZGFudCgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGluc3RhbmNlcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNvcnQgb3VyIGNoaWxkIGFjY2Vzc2libGUgaW5zdGFuY2VzIGluIHRoZSBvcmRlciB0aGV5IHNob3VsZCBhcHBlYXIgaW4gdGhlIHBhcmFsbGVsIERPTS4gV2UgZG8gdGhpcyBieVxyXG4gICAqIGNyZWF0aW5nIGEgY29tcGFyaXNvbiBmdW5jdGlvbiBiZXR3ZWVuIHR3byBhY2Nlc3NpYmxlIGluc3RhbmNlcy4gVGhlIGZ1bmN0aW9uIHdhbGtzIGFsb25nIHRoZSB0cmFpbHNcclxuICAgKiBvZiB0aGUgY2hpbGRyZW4sIGxvb2tpbmcgZm9yIHNwZWNpZmllZCBhY2Nlc3NpYmxlIG9yZGVycyB0aGF0IHdvdWxkIGRldGVybWluZSB0aGUgb3JkZXJpbmcgZm9yIHRoZSB0d29cclxuICAgKiBQRE9NSW5zdGFuY2VzLlxyXG4gICAqXHJcbiAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIHNvcnRDaGlsZHJlbigpOiB2b2lkIHtcclxuICAgIC8vIEl0J3Mgc2ltcGxlci9mYXN0ZXIgdG8ganVzdCBncmFiIG91ciBvcmRlciBkaXJlY3RseSB3aXRoIG9uZSByZWN1cnNpb24sIHJhdGhlciB0aGFuIHNwZWNpZnlpbmcgYSBzb3J0aW5nXHJcbiAgICAvLyBmdW5jdGlvbiAoc2luY2UgYSBsb3QgZ2V0cyByZS1ldmFsdWF0ZWQgaW4gdGhhdCBjYXNlKS5cclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLnBlZXIgIT09IG51bGwsICdwZWVyIHJlcXVpcmVkIGZvciBzb3J0JyApO1xyXG4gICAgbGV0IG5vZGVGb3JUcmFpbDogTm9kZTtcclxuICAgIGlmICggdGhpcy5pc1Jvb3RJbnN0YW5jZSApIHtcclxuXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuZGlzcGxheSAhPT0gbnVsbCwgJ0Rpc3BsYXkgc2hvdWxkIGJlIGF2YWlsYWJsZSBmb3IgdGhlIHJvb3QnICk7XHJcbiAgICAgIG5vZGVGb3JUcmFpbCA9IHRoaXMuZGlzcGxheSEucm9vdE5vZGU7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5ub2RlICE9PSBudWxsLCAnTm9kZSBzaG91bGQgYmUgZGVmaW5lZCwgd2VyZSB3ZSBkaXNwb3NlZD8nICk7XHJcbiAgICAgIG5vZGVGb3JUcmFpbCA9IHRoaXMubm9kZSE7XHJcbiAgICB9XHJcbiAgICBjb25zdCB0YXJnZXRDaGlsZHJlbiA9IHRoaXMuZ2V0Q2hpbGRPcmRlcmluZyggbmV3IFRyYWlsKCBub2RlRm9yVHJhaWwgKSApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRhcmdldENoaWxkcmVuLmxlbmd0aCA9PT0gdGhpcy5jaGlsZHJlbi5sZW5ndGgsICdzb3J0aW5nIHNob3VsZCBub3QgY2hhbmdlIG51bWJlciBvZiBjaGlsZHJlbicgKTtcclxuXHJcbiAgICAvLyB7QXJyYXkuPFBET01JbnN0YW5jZT59XHJcbiAgICB0aGlzLmNoaWxkcmVuID0gdGFyZ2V0Q2hpbGRyZW47XHJcblxyXG4gICAgLy8gdGhlIERPTUVsZW1lbnQgdG8gYWRkIHRoZSBjaGlsZCBET01FbGVtZW50cyB0by5cclxuICAgIGNvbnN0IHByaW1hcnlTaWJsaW5nID0gdGhpcy5wZWVyIS5wcmltYXJ5U2libGluZyE7XHJcblxyXG4gICAgLy8gSWdub3JlIERBRyBmb3IgZm9jdXNlZCB0cmFpbC4gV2UgbmVlZCB0byBrbm93IGlmIHRoZXJlIGlzIGEgZm9jdXNlZCBjaGlsZCBpbnN0YW5jZSBzbyB0aGF0IHdlIGNhbiBhdm9pZFxyXG4gICAgLy8gdGVtcG9yYXJpbHkgZGV0YWNoaW5nIHRoZSBmb2N1c2VkIGVsZW1lbnQgZnJvbSB0aGUgRE9NLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL215LXNvbGFyLXN5c3RlbS9pc3N1ZXMvMTQyXHJcbiAgICBjb25zdCBmb2N1c2VkVHJhaWwgPSBGb2N1c01hbmFnZXIucGRvbUZvY3VzZWROb2RlPy5wZG9tSW5zdGFuY2VzWyAwIF0/LnRyYWlsIHx8IG51bGw7XHJcblxyXG4gICAgLy8gXCJpXCIgd2lsbCBrZWVwIHRyYWNrIG9mIHRoZSBcImNvbGxhcHNlZFwiIGluZGV4IHdoZW4gYWxsIERPTUVsZW1lbnRzIGZvciBhbGwgUERPTUluc3RhbmNlIGNoaWxkcmVuIGFyZVxyXG4gICAgLy8gYWRkZWQgdG8gYSBzaW5nbGUgcGFyZW50IERPTUVsZW1lbnQgKHRoaXMgUERPTUluc3RhbmNlJ3MgUERPTVBlZXIncyBwcmltYXJ5U2libGluZylcclxuICAgIGxldCBpID0gcHJpbWFyeVNpYmxpbmcuY2hpbGROb2Rlcy5sZW5ndGggLSAxO1xyXG5cclxuICAgIGNvbnN0IGZvY3VzZWRDaGlsZEluc3RhbmNlID0gZm9jdXNlZFRyYWlsICYmIF8uZmluZCggdGhpcy5jaGlsZHJlbiwgY2hpbGQgPT4gZm9jdXNlZFRyYWlsLmNvbnRhaW5zTm9kZSggY2hpbGQucGVlciEubm9kZSEgKSApO1xyXG4gICAgaWYgKCBmb2N1c2VkQ2hpbGRJbnN0YW5jZSApIHtcclxuICAgICAgLy8gSWYgdGhlcmUncyBhIGZvY3VzZWQgY2hpbGQgaW5zdGFuY2UsIHdlIG5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgaXRzIHByaW1hcnlTaWJsaW5nIGlzIG5vdCBkZXRhY2hlZCBmcm9tIHRoZSBET01cclxuICAgICAgLy8gKHRoaXMgaGFzIGNhdXNlZCBmb2N1cyBpc3N1ZXMsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvbXktc29sYXItc3lzdGVtL2lzc3Vlcy8xNDIpLlxyXG4gICAgICAvLyBTaW5jZSB0aGlzIGRvZXNuJ3QgaGFwcGVuIG9mdGVuLCB3ZSBjYW4ganVzdCByZWNvbXB1dGUgdGhlIGZ1bGwgb3JkZXIsIGFuZCBtb3ZlIGV2ZXJ5IG90aGVyIGVsZW1lbnQuXHJcblxyXG4gICAgICBjb25zdCBkZXNpcmVkT3JkZXIgPSBfLmZsYXR0ZW4oIHRoaXMuY2hpbGRyZW4ubWFwKCBjaGlsZCA9PiBjaGlsZC5wZWVyIS50b3BMZXZlbEVsZW1lbnRzISApICk7XHJcbiAgICAgIGNvbnN0IG5lZWRzT3JkZXJDaGFuZ2UgPSAhXy5ldmVyeSggZGVzaXJlZE9yZGVyLCAoIGRlc2lyZWRFbGVtZW50LCBpbmRleCApID0+IHByaW1hcnlTaWJsaW5nLmNoaWxkcmVuWyBpbmRleCBdID09PSBkZXNpcmVkRWxlbWVudCApO1xyXG5cclxuICAgICAgaWYgKCBuZWVkc09yZGVyQ2hhbmdlICkge1xyXG4gICAgICAgIGNvbnN0IHBpdm90RWxlbWVudCA9IGZvY3VzZWRDaGlsZEluc3RhbmNlLnBlZXIhLmdldFRvcExldmVsRWxlbWVudENvbnRhaW5pbmdQcmltYXJ5U2libGluZygpO1xyXG4gICAgICAgIGNvbnN0IHBpdm90SW5kZXggPSBkZXNpcmVkT3JkZXIuaW5kZXhPZiggcGl2b3RFbGVtZW50ICk7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggcGl2b3RJbmRleCA+PSAwICk7XHJcblxyXG4gICAgICAgIC8vIEluc2VydCBhbGwgZWxlbWVudHMgYmVmb3JlIHRoZSBwaXZvdCBlbGVtZW50XHJcbiAgICAgICAgZm9yICggbGV0IGogPSAwOyBqIDwgcGl2b3RJbmRleDsgaisrICkge1xyXG4gICAgICAgICAgcHJpbWFyeVNpYmxpbmcuaW5zZXJ0QmVmb3JlKCBkZXNpcmVkT3JkZXJbIGogXSwgcGl2b3RFbGVtZW50ICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJbnNlcnQgYWxsIGVsZW1lbnRzIGFmdGVyIHRoZSBwaXZvdCBlbGVtZW50XHJcbiAgICAgICAgZm9yICggbGV0IGogPSBwaXZvdEluZGV4ICsgMTsgaiA8IGRlc2lyZWRPcmRlci5sZW5ndGg7IGorKyApIHtcclxuICAgICAgICAgIHByaW1hcnlTaWJsaW5nLmFwcGVuZENoaWxkKCBkZXNpcmVkT3JkZXJbIGogXSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBhbGwgUERPTUluc3RhbmNlIGNoaWxkcmVuXHJcbiAgICAgIGZvciAoIGxldCBwZWVySW5kZXggPSB0aGlzLmNoaWxkcmVuLmxlbmd0aCAtIDE7IHBlZXJJbmRleCA+PSAwOyBwZWVySW5kZXgtLSApIHtcclxuICAgICAgICBjb25zdCBwZWVyID0gdGhpcy5jaGlsZHJlblsgcGVlckluZGV4IF0ucGVlciE7XHJcblxyXG4gICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBhbGwgdG9wIGxldmVsIGVsZW1lbnRzIG9mIGEgUERPTUluc3RhbmNlJ3MgcGVlclxyXG4gICAgICAgIGZvciAoIGxldCBlbGVtZW50SW5kZXggPSBwZWVyLnRvcExldmVsRWxlbWVudHMhLmxlbmd0aCAtIDE7IGVsZW1lbnRJbmRleCA+PSAwOyBlbGVtZW50SW5kZXgtLSApIHtcclxuICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBwZWVyLnRvcExldmVsRWxlbWVudHMhWyBlbGVtZW50SW5kZXggXTtcclxuXHJcbiAgICAgICAgICAvLyBSZW9yZGVyIERPTSBlbGVtZW50cyBpbiBhIHdheSB0aGF0IGRvZXNuJ3QgZG8gYW55IHdvcmsgaWYgdGhleSBhcmUgYWxyZWFkeSBpbiBhIHNvcnRlZCBvcmRlci5cclxuICAgICAgICAgIC8vIE5vIG5lZWQgdG8gcmVpbnNlcnQgaWYgYGVsZW1lbnRgIGlzIGFscmVhZHkgaW4gdGhlIHJpZ2h0IG9yZGVyXHJcbiAgICAgICAgICBpZiAoIHByaW1hcnlTaWJsaW5nLmNoaWxkTm9kZXNbIGkgXSAhPT0gZWxlbWVudCApIHtcclxuICAgICAgICAgICAgcHJpbWFyeVNpYmxpbmcuaW5zZXJ0QmVmb3JlKCBlbGVtZW50LCBwcmltYXJ5U2libGluZy5jaGlsZE5vZGVzWyBpICsgMSBdICk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gRGVjcmVtZW50IHNvIHRoYXQgaXQgaXMgZWFzaWVyIHRvIHBsYWNlIGVsZW1lbnRzIHVzaW5nIHRoZSBicm93c2VyJ3MgTm9kZS5pbnNlcnRCZWZvcmUgQVBJXHJcbiAgICAgICAgICBpLS07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgIGNvbnN0IGRlc2lyZWRPcmRlciA9IF8uZmxhdHRlbiggdGhpcy5jaGlsZHJlbi5tYXAoIGNoaWxkID0+IGNoaWxkLnBlZXIhLnRvcExldmVsRWxlbWVudHMhICkgKTtcclxuXHJcbiAgICAgIC8vIFZlcmlmeSB0aGUgb3JkZXJcclxuICAgICAgYXNzZXJ0KCBfLmV2ZXJ5KCBkZXNpcmVkT3JkZXIsICggZGVzaXJlZEVsZW1lbnQsIGluZGV4ICkgPT4gcHJpbWFyeVNpYmxpbmcuY2hpbGRyZW5bIGluZGV4IF0gPT09IGRlc2lyZWRFbGVtZW50ICkgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIFVOSVFVRV9JRF9TVFJBVEVHWSA9PT0gUERPTVVuaXF1ZUlkU3RyYXRlZ3kuSU5ESUNFUyApIHtcclxuXHJcbiAgICAgIC8vIFRoaXMga2lsbHMgcGVyZm9ybWFuY2UgaWYgdGhlcmUgYXJlIGVub3VnaCBQRE9NSW5zdGFuY2VzXHJcbiAgICAgIHRoaXMudXBkYXRlRGVzY2VuZGFudFBlZXJJZHMoIHRoaXMuY2hpbGRyZW4gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZSBhIG5ldyBUcmFuc2Zvcm1UcmFja2VyIHRoYXQgd2lsbCBvYnNlcnZlIHRyYW5zZm9ybXMgYWxvbmcgdGhlIHRyYWlsIG9mIHRoaXMgUERPTUluc3RhbmNlIE9SXHJcbiAgICogdGhlIHByb3ZpZGVkIHBkb21UcmFuc2Zvcm1Tb3VyY2VOb2RlLiBTZWUgUGFyYWxsZWxET00uc2V0UERPTVRyYW5zZm9ybVNvdXJjZU5vZGUoKS4gVGhlIFRoZSBzb3VyY2UgTm9kZVxyXG4gICAqIG11c3Qgbm90IHVzZSBEQUcgc28gdGhhdCBpdHMgdHJhaWwgaXMgdW5pcXVlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB1cGRhdGVUcmFuc2Zvcm1UcmFja2VyKCBwZG9tVHJhbnNmb3JtU291cmNlTm9kZTogTm9kZSB8IG51bGwgKTogdm9pZCB7XHJcbiAgICB0aGlzLnRyYW5zZm9ybVRyYWNrZXIgJiYgdGhpcy50cmFuc2Zvcm1UcmFja2VyLmRpc3Bvc2UoKTtcclxuXHJcbiAgICBsZXQgdHJhY2tlZFRyYWlsID0gbnVsbDtcclxuICAgIGlmICggcGRvbVRyYW5zZm9ybVNvdXJjZU5vZGUgKSB7XHJcbiAgICAgIHRyYWNrZWRUcmFpbCA9IHBkb21UcmFuc2Zvcm1Tb3VyY2VOb2RlLmdldFVuaXF1ZVRyYWlsKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdHJhY2tlZFRyYWlsID0gUERPTUluc3RhbmNlLmd1ZXNzVmlzdWFsVHJhaWwoIHRoaXMudHJhaWwhLCB0aGlzLmRpc3BsYXkhLnJvb3ROb2RlICk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy50cmFuc2Zvcm1UcmFja2VyID0gbmV3IFRyYW5zZm9ybVRyYWNrZXIoIHRyYWNrZWRUcmFpbCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVwZW5kaW5nIG9uIHdoYXQgdGhlIHVuaXF1ZSBJRCBzdHJhdGVneSBpcywgZm9ybXVsYXRlIHRoZSBjb3JyZWN0IGlkIGZvciB0aGlzIFBET00gaW5zdGFuY2UuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFBET01JbnN0YW5jZVVuaXF1ZUlkKCk6IHN0cmluZyB7XHJcblxyXG4gICAgaWYgKCBVTklRVUVfSURfU1RSQVRFR1kgPT09IFBET01VbmlxdWVJZFN0cmF0ZWd5LklORElDRVMgKSB7XHJcblxyXG4gICAgICBjb25zdCBpbmRpY2VzU3RyaW5nID0gW107XHJcblxyXG4gICAgICBsZXQgcGRvbUluc3RhbmNlOiBQRE9NSW5zdGFuY2UgPSB0aGlzOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNvbnNpc3RlbnQtdGhpcywgQHR5cGVzY3JpcHQtZXNsaW50L25vLXRoaXMtYWxpYXNcclxuXHJcbiAgICAgIHdoaWxlICggcGRvbUluc3RhbmNlLnBhcmVudCApIHtcclxuICAgICAgICBjb25zdCBpbmRleE9mID0gcGRvbUluc3RhbmNlLnBhcmVudC5jaGlsZHJlbi5pbmRleE9mKCBwZG9tSW5zdGFuY2UgKTtcclxuICAgICAgICBpZiAoIGluZGV4T2YgPT09IC0xICkge1xyXG4gICAgICAgICAgcmV0dXJuICdTVElMTF9CRUlOR19DUkVBVEVEJyArIGRvdFJhbmRvbS5uZXh0RG91YmxlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGluZGljZXNTdHJpbmcudW5zaGlmdCggaW5kZXhPZiApO1xyXG4gICAgICAgIHBkb21JbnN0YW5jZSA9IHBkb21JbnN0YW5jZS5wYXJlbnQ7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGluZGljZXNTdHJpbmcuam9pbiggUERPTVV0aWxzLlBET01fVU5JUVVFX0lEX1NFUEFSQVRPUiApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIFVOSVFVRV9JRF9TVFJBVEVHWSA9PT0gUERPTVVuaXF1ZUlkU3RyYXRlZ3kuVFJBSUxfSUQgKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLnRyYWlsIS5nZXRVbmlxdWVJZCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXNpbmcgaW5kaWNlcyByZXF1aXJlcyB1cGRhdGluZyB3aGVuZXZlciB0aGUgUERPTUluc3RhbmNlIHRyZWUgY2hhbmdlcywgc28gcmVjdXJzaXZlbHkgdXBkYXRlIGFsbCBkZXNjZW5kYW50XHJcbiAgICogaWRzIGZyb20gc3VjaCBhIGNoYW5nZS4gVXBkYXRlIHBlZXIgaWRzIGZvciBwcm92aWRlZCBpbnN0YW5jZXMgYW5kIGFsbCBkZXNjZW5kYW50cyBvZiBwcm92aWRlZCBpbnN0YW5jZXMuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSB1cGRhdGVEZXNjZW5kYW50UGVlcklkcyggcGRvbUluc3RhbmNlczogUERPTUluc3RhbmNlW10gKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBVTklRVUVfSURfU1RSQVRFR1kgPT09IFBET01VbmlxdWVJZFN0cmF0ZWd5LklORElDRVMsICdtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkIHdpdGggdW5pcXVlSWQgY29tZXMgZnJvbSBUUkFJTF9JRCcgKTtcclxuICAgIGNvbnN0IHRvVXBkYXRlID0gQXJyYXkuZnJvbSggcGRvbUluc3RhbmNlcyApO1xyXG4gICAgd2hpbGUgKCB0b1VwZGF0ZS5sZW5ndGggPiAwICkge1xyXG4gICAgICBjb25zdCBwZG9tSW5zdGFuY2UgPSB0b1VwZGF0ZS5zaGlmdCgpITtcclxuICAgICAgcGRvbUluc3RhbmNlLnBlZXIhLnVwZGF0ZUluZGljZXNTdHJpbmdBbmRFbGVtZW50SWRzKCk7XHJcbiAgICAgIHRvVXBkYXRlLnB1c2goIC4uLnBkb21JbnN0YW5jZS5jaGlsZHJlbiApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIGRpc3BsYXlcclxuICAgKiBAcGFyYW0gdW5pcXVlSWQgLSB2YWx1ZSByZXR1cm5lZCBmcm9tIFBET01JbnN0YW5jZS5nZXRQRE9NSW5zdGFuY2VVbmlxdWVJZCgpXHJcbiAgICogQHJldHVybnMgbnVsbCBpZiB0aGVyZSBpcyBubyBwYXRoIHRvIHRoZSB1bmlxdWUgaWQgcHJvdmlkZWQuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyB1bmlxdWVJZFRvVHJhaWwoIGRpc3BsYXk6IERpc3BsYXksIHVuaXF1ZUlkOiBzdHJpbmcgKTogVHJhaWwgfCBudWxsIHtcclxuICAgIGlmICggVU5JUVVFX0lEX1NUUkFURUdZID09PSBQRE9NVW5pcXVlSWRTdHJhdGVneS5JTkRJQ0VTICkge1xyXG4gICAgICByZXR1cm4gZGlzcGxheS5nZXRUcmFpbEZyb21QRE9NSW5kaWNlc1N0cmluZyggdW5pcXVlSWQgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBVTklRVUVfSURfU1RSQVRFR1kgPT09IFBET01VbmlxdWVJZFN0cmF0ZWd5LlRSQUlMX0lEICk7XHJcbiAgICAgIHJldHVybiBUcmFpbC5mcm9tVW5pcXVlSWQoIGRpc3BsYXkucm9vdE5vZGUsIHVuaXF1ZUlkICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWN1cnNpdmUgZGlzcG9zYWwsIHRvIG1ha2UgZWxpZ2libGUgZm9yIGdhcmJhZ2UgY29sbGVjdGlvbi5cclxuICAgKlxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlBET01JbnN0YW5jZSAmJiBzY2VuZXJ5TG9nLlBET01JbnN0YW5jZShcclxuICAgICAgYERpc3Bvc2luZyAke3RoaXMudG9TdHJpbmcoKX1gICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUERPTUluc3RhbmNlICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICEhdGhpcy5wZWVyLCAnUERPTVBlZXIgcmVxdWlyZWQsIHdlcmUgd2UgYWxyZWFkeSBkaXNwb3NlZD8nICk7XHJcbiAgICBjb25zdCB0aGlzUGVlciA9IHRoaXMucGVlciE7XHJcblxyXG4gICAgLy8gRGlzY29ubmVjdCBET00gYW5kIHJlbW92ZSBsaXN0ZW5lcnNcclxuICAgIGlmICggIXRoaXMuaXNSb290SW5zdGFuY2UgKSB7XHJcblxyXG4gICAgICAvLyByZW1vdmUgdGhpcyBwZWVyJ3MgcHJpbWFyeSBzaWJsaW5nIERPTSBFbGVtZW50IChvciBpdHMgY29udGFpbmVyIHBhcmVudCkgZnJvbSB0aGUgcGFyZW50IHBlZXInc1xyXG4gICAgICAvLyBwcmltYXJ5IHNpYmxpbmcgKG9yIGl0cyBjaGlsZCBjb250YWluZXIpXHJcbiAgICAgIFBET01VdGlscy5yZW1vdmVFbGVtZW50cyggdGhpcy5wYXJlbnQhLnBlZXIhLnByaW1hcnlTaWJsaW5nISwgdGhpc1BlZXIudG9wTGV2ZWxFbGVtZW50cyEgKTtcclxuXHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMucmVsYXRpdmVOb2RlcyEubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgdGhpcy5yZWxhdGl2ZU5vZGVzIVsgaSBdLnBkb21EaXNwbGF5c0VtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoIHRoaXMucmVsYXRpdmVMaXN0ZW5lcnNbIGkgXSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgd2hpbGUgKCB0aGlzLmNoaWxkcmVuLmxlbmd0aCApIHtcclxuICAgICAgdGhpcy5jaGlsZHJlbi5wb3AoKSEuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE5PVEU6IFdlIGRpc3Bvc2UgT1VSIHBlZXIgYWZ0ZXIgZGlzcG9zaW5nIGNoaWxkcmVuLCBzbyBvdXIgcGVlciBjYW4gYmUgYXZhaWxhYmxlIGZvciBvdXIgY2hpbGRyZW4gZHVyaW5nXHJcbiAgICAvLyBkaXNwb3NhbC5cclxuICAgIHRoaXNQZWVyLmRpc3Bvc2UoKTtcclxuXHJcbiAgICAvLyBkaXNwb3NlIGFmdGVyIHRoZSBwZWVyIHNvIHRoZSBwZWVyIGNhbiByZW1vdmUgYW55IGxpc3RlbmVycyBmcm9tIGl0XHJcbiAgICB0aGlzLnRyYW5zZm9ybVRyYWNrZXIhLmRpc3Bvc2UoKTtcclxuICAgIHRoaXMudHJhbnNmb3JtVHJhY2tlciA9IG51bGw7XHJcblxyXG4gICAgLy8gSWYgd2UgYXJlIHRoZSByb290IGFjY2Vzc2libGUgaW5zdGFuY2UsIHdlIHdvbid0IGFjdHVhbGx5IGhhdmUgYSByZWZlcmVuY2UgdG8gYSBub2RlLlxyXG4gICAgaWYgKCB0aGlzLm5vZGUgKSB7XHJcbiAgICAgIHRoaXMubm9kZS5yZW1vdmVQRE9NSW5zdGFuY2UoIHRoaXMgKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnJlbGF0aXZlTm9kZXMgPSBudWxsO1xyXG4gICAgdGhpcy5kaXNwbGF5ID0gbnVsbDtcclxuICAgIHRoaXMudHJhaWwgPSBudWxsO1xyXG4gICAgdGhpcy5ub2RlID0gbnVsbDtcclxuXHJcbiAgICB0aGlzLnBlZXIgPSBudWxsO1xyXG4gICAgdGhpcy5pc0Rpc3Bvc2VkID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLmZyZWVUb1Bvb2woKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUERPTUluc3RhbmNlICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGb3IgZGVidWdnaW5nIHB1cnBvc2VzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB0b1N0cmluZygpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGAke3RoaXMuaWR9I3ske3RoaXMudHJhaWwhLnRvU3RyaW5nKCl9fWA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGb3IgZGVidWdnaW5nIHB1cnBvc2VzLCBpbnNwZWN0IHRoZSB0cmVlIG9mIFBET01JbnN0YW5jZXMgZnJvbSB0aGUgcm9vdC5cclxuICAgKlxyXG4gICAqIE9ubHkgZXZlciBjYWxsZWQgZnJvbSB0aGUgX3Jvb3RQRE9NSW5zdGFuY2Ugb2YgdGhlIGRpc3BsYXkuXHJcbiAgICpcclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgYXVkaXRSb290KCk6IHZvaWQge1xyXG4gICAgaWYgKCAhYXNzZXJ0ICkgeyByZXR1cm47IH1cclxuXHJcbiAgICBjb25zdCByb290Tm9kZSA9IHRoaXMuZGlzcGxheSEucm9vdE5vZGU7XHJcblxyXG4gICAgYXNzZXJ0KCB0aGlzLnRyYWlsIS5sZW5ndGggPT09IDAsXHJcbiAgICAgICdTaG91bGQgb25seSBjYWxsIGF1ZGl0Um9vdCgpIG9uIHRoZSByb290IFBET01JbnN0YW5jZSBmb3IgYSBkaXNwbGF5JyApO1xyXG5cclxuICAgIGZ1bmN0aW9uIGF1ZGl0KCBmYWtlSW5zdGFuY2U6IEZha2VJbnN0YW5jZSwgcGRvbUluc3RhbmNlOiBQRE9NSW5zdGFuY2UgKTogdm9pZCB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGZha2VJbnN0YW5jZS5jaGlsZHJlbi5sZW5ndGggPT09IHBkb21JbnN0YW5jZS5jaGlsZHJlbi5sZW5ndGgsXHJcbiAgICAgICAgJ0RpZmZlcmVudCBudW1iZXIgb2YgY2hpbGRyZW4gaW4gYWNjZXNzaWJsZSBpbnN0YW5jZScgKTtcclxuXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGZha2VJbnN0YW5jZS5ub2RlID09PSBwZG9tSW5zdGFuY2Uubm9kZSwgJ05vZGUgbWlzbWF0Y2ggZm9yIFBET01JbnN0YW5jZScgKTtcclxuXHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHBkb21JbnN0YW5jZS5jaGlsZHJlbi5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICBhdWRpdCggZmFrZUluc3RhbmNlLmNoaWxkcmVuWyBpIF0sIHBkb21JbnN0YW5jZS5jaGlsZHJlblsgaSBdICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGlzVmlzaWJsZSA9IHBkb21JbnN0YW5jZS5pc0dsb2JhbGx5VmlzaWJsZSgpO1xyXG5cclxuICAgICAgbGV0IHNob3VsZEJlVmlzaWJsZSA9IHRydWU7XHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHBkb21JbnN0YW5jZS50cmFpbCEubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgY29uc3Qgbm9kZSA9IHBkb21JbnN0YW5jZS50cmFpbCEubm9kZXNbIGkgXTtcclxuICAgICAgICBjb25zdCB0cmFpbHMgPSBub2RlLmdldFRyYWlsc1RvKCByb290Tm9kZSApLmZpbHRlciggdHJhaWwgPT4gdHJhaWwuaXNQRE9NVmlzaWJsZSgpICk7XHJcbiAgICAgICAgaWYgKCB0cmFpbHMubGVuZ3RoID09PSAwICkge1xyXG4gICAgICAgICAgc2hvdWxkQmVWaXNpYmxlID0gZmFsc2U7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzVmlzaWJsZSA9PT0gc2hvdWxkQmVWaXNpYmxlLCAnSW5zdGFuY2UgdmlzaWJpbGl0eSBtaXNtYXRjaCcgKTtcclxuICAgIH1cclxuXHJcbiAgICBhdWRpdCggUERPTUluc3RhbmNlLmNyZWF0ZUZha2VQRE9NVHJlZSggcm9vdE5vZGUgKSwgdGhpcyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2luY2UgYSBcIlRyYWlsXCIgb24gUERPTUluc3RhbmNlIGNhbiBoYXZlIGRpc2NvbnRpbnVvdXMganVtcHMgKGR1ZSB0byBwZG9tT3JkZXIpLCB0aGlzIGZpbmRzIHRoZSBiZXN0XHJcbiAgICogYWN0dWFsIHZpc3VhbCBUcmFpbCB0byB1c2UsIGZyb20gdGhlIHRyYWlsIG9mIGEgUERPTUluc3RhbmNlIHRvIHRoZSByb290IG9mIGEgRGlzcGxheS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB0cmFpbCAtIHRyYWlsIG9mIHRoZSBQRE9NSW5zdGFuY2UsIHdoaWNoIGNhbiBjb250YWluZSBcImdhcHNcIlxyXG4gICAqIEBwYXJhbSByb290Tm9kZSAtIHJvb3Qgb2YgYSBEaXNwbGF5XHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBndWVzc1Zpc3VhbFRyYWlsKCB0cmFpbDogVHJhaWwsIHJvb3ROb2RlOiBOb2RlICk6IFRyYWlsIHtcclxuICAgIHRyYWlsLnJlaW5kZXgoKTtcclxuXHJcbiAgICAvLyBTZWFyY2ggZm9yIHBsYWNlcyBpbiB0aGUgdHJhaWwgd2hlcmUgYWRqYWNlbnQgbm9kZXMgZG8gTk9UIGhhdmUgYSBwYXJlbnQtY2hpbGQgcmVsYXRpb25zaGlwLCBpLmUuXHJcbiAgICAvLyAhbm9kZXNbIG4gXS5oYXNDaGlsZCggbm9kZXNbIG4gKyAxIF0gKS5cclxuICAgIC8vIE5PVEU6IFRoaXMgaW5kZXggcG9pbnRzIHRvIHRoZSBwYXJlbnQgd2hlcmUgdGhpcyBpcyB0aGUgY2FzZSwgYmVjYXVzZSB0aGUgaW5kaWNlcyBpbiB0aGUgdHJhaWwgYXJlIHN1Y2ggdGhhdDpcclxuICAgIC8vIHRyYWlsLm5vZGVzWyBuIF0uY2hpbGRyZW5bIHRyYWlsLmluZGljZXNbIG4gXSBdID0gdHJhaWwubm9kZXNbIG4gKyAxIF1cclxuICAgIGNvbnN0IGxhc3RCYWRJbmRleCA9IHRyYWlsLmluZGljZXMubGFzdEluZGV4T2YoIC0xICk7XHJcblxyXG4gICAgLy8gSWYgd2UgaGF2ZSBubyBiYWQgaW5kaWNlcywganVzdCByZXR1cm4gb3VyIHRyYWlsIGltbWVkaWF0ZWx5LlxyXG4gICAgaWYgKCBsYXN0QmFkSW5kZXggPCAwICkge1xyXG4gICAgICByZXR1cm4gdHJhaWw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZmlyc3RHb29kSW5kZXggPSBsYXN0QmFkSW5kZXggKyAxO1xyXG4gICAgY29uc3QgZmlyc3RHb29kTm9kZSA9IHRyYWlsLm5vZGVzWyBmaXJzdEdvb2RJbmRleCBdO1xyXG4gICAgY29uc3QgYmFzZVRyYWlscyA9IGZpcnN0R29vZE5vZGUuZ2V0VHJhaWxzVG8oIHJvb3ROb2RlICk7XHJcblxyXG4gICAgLy8gZmlyc3RHb29kTm9kZSBtaWdodCBub3QgYmUgYXR0YWNoZWQgdG8gYSBEaXNwbGF5IGVpdGhlciEgTWF5YmUgY2xpZW50IGp1c3QgaGFzbid0IGdvdHRlbiB0byBpdCB5ZXQsIHNvIHdlXHJcbiAgICAvLyBmYWlsIGdyYWNlZnVsbHktaXNoP1xyXG4gICAgLy8gYXNzZXJ0ICYmIGFzc2VydCggYmFzZVRyYWlscy5sZW5ndGggPiAwLCAnXCJnb29kIG5vZGVcIiBpbiB0cmFpbCB3aXRoIGdhcCBub3QgYXR0YWNoZWQgdG8gcm9vdCcpXHJcbiAgICBpZiAoIGJhc2VUcmFpbHMubGVuZ3RoID09PSAwICkge1xyXG4gICAgICByZXR1cm4gdHJhaWw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWRkIHRoZSByZXN0IG9mIHRoZSB0cmFpbCBiYWNrIGluXHJcbiAgICBjb25zdCBiYXNlVHJhaWwgPSBiYXNlVHJhaWxzWyAwIF07XHJcbiAgICBmb3IgKCBsZXQgaSA9IGZpcnN0R29vZEluZGV4ICsgMTsgaSA8IHRyYWlsLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBiYXNlVHJhaWwuYWRkRGVzY2VuZGFudCggdHJhaWwubm9kZXNbIGkgXSApO1xyXG4gICAgfVxyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGJhc2VUcmFpbC5pc1ZhbGlkKCksIGB0cmFpbCBub3QgdmFsaWQ6ICR7dHJhaWwudW5pcXVlSWR9YCApO1xyXG5cclxuICAgIHJldHVybiBiYXNlVHJhaWw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgZmFrZSBQRE9NSW5zdGFuY2UtbGlrZSB0cmVlIHN0cnVjdHVyZSAod2l0aCB0aGUgZXF1aXZhbGVudCBub2RlcyBhbmQgY2hpbGRyZW4gc3RydWN0dXJlKS5cclxuICAgKiBGb3IgZGVidWdnaW5nLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVHlwZSBGYWtlUERPTUluc3RhbmNlOiB7IG5vZGU6IHtOb2RlfSwgY2hpbGRyZW46IHtBcnJheS48RmFrZVBET01JbnN0YW5jZT59IH1cclxuICAgKi9cclxuICBwcml2YXRlIHN0YXRpYyBjcmVhdGVGYWtlUERPTVRyZWUoIHJvb3ROb2RlOiBOb2RlICk6IEZha2VJbnN0YW5jZSB7XHJcbiAgICBmdW5jdGlvbiBjcmVhdGVGYWtlVHJlZSggbm9kZTogTm9kZSApOiBvYmplY3Qge1xyXG4gICAgICBsZXQgZmFrZUluc3RhbmNlcyA9IF8uZmxhdHRlbiggbm9kZS5nZXRFZmZlY3RpdmVDaGlsZHJlbigpLm1hcCggY3JlYXRlRmFrZVRyZWUgKSApIGFzIEZha2VJbnN0YW5jZVtdO1xyXG4gICAgICBpZiAoIG5vZGUuaGFzUERPTUNvbnRlbnQgKSB7XHJcbiAgICAgICAgZmFrZUluc3RhbmNlcyA9IFsge1xyXG4gICAgICAgICAgbm9kZTogbm9kZSxcclxuICAgICAgICAgIGNoaWxkcmVuOiBmYWtlSW5zdGFuY2VzXHJcbiAgICAgICAgfSBdO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBmYWtlSW5zdGFuY2VzO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIG5vZGU6IG51bGwsXHJcblxyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICAgIGNoaWxkcmVuOiBjcmVhdGVGYWtlVHJlZSggcm9vdE5vZGUgKVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBmcmVlVG9Qb29sKCk6IHZvaWQge1xyXG4gICAgUERPTUluc3RhbmNlLnBvb2wuZnJlZVRvUG9vbCggdGhpcyApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBwb29sID0gbmV3IFBvb2woIFBET01JbnN0YW5jZSwge1xyXG4gICAgaW5pdGlhbGl6ZTogUERPTUluc3RhbmNlLnByb3RvdHlwZS5pbml0aWFsaXplUERPTUluc3RhbmNlXHJcbiAgfSApO1xyXG59XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnUERPTUluc3RhbmNlJywgUERPTUluc3RhbmNlICk7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgUERPTUluc3RhbmNlOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxTQUFTLE1BQU0saUNBQWlDO0FBQ3ZELE9BQU9DLFVBQVUsTUFBTSx3Q0FBd0M7QUFDL0QsT0FBT0MsV0FBVyxNQUFNLHlDQUF5QztBQUNqRSxPQUFPQyxnQkFBZ0IsTUFBTSw4Q0FBOEM7QUFDM0UsT0FBT0MsSUFBSSxNQUFNLGtDQUFrQztBQUNuRCxTQUFrQkMsWUFBWSxFQUFFQyxJQUFJLEVBQUVDLFFBQVEsRUFBRUMsU0FBUyxFQUFFQyxPQUFPLEVBQUVDLEtBQUssRUFBRUMsZ0JBQWdCLFFBQVEsa0JBQWtCOztBQUVySDtBQUNBLE1BQU1DLG9CQUFvQixTQUFTVCxnQkFBZ0IsQ0FBQztFQUNsRCxPQUF1QlUsT0FBTyxHQUFHLElBQUlELG9CQUFvQixDQUFDLENBQUM7RUFDM0QsT0FBdUJFLFFBQVEsR0FBRyxJQUFJRixvQkFBb0IsQ0FBQyxDQUFDO0VBRTVELE9BQXVCRyxXQUFXLEdBQUcsSUFBSWIsV0FBVyxDQUFFVSxvQkFBcUIsQ0FBQztBQUM5RTs7QUFFQTs7QUFNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU1JLGtCQUFrQixHQUFHSixvQkFBb0IsQ0FBQ0UsUUFBUTtBQUV4RCxJQUFJRyxRQUFRLEdBQUcsQ0FBQztBQUVoQixNQUFNQyxZQUFZLENBQUM7RUFFakI7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