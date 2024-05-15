// Copyright 2013-2024, University of Colorado Boulder

/**
 * Represents a trail (path in the graph) from a 'root' node down to a descendant node.
 * In a DAG, or with different views, there can be more than one trail up from a node,
 * even to the same root node!
 *
 * It has an array of nodes, in order from the 'root' down to the last node,
 * a length, and an array of indices such that node_i.children[index_i] === node_{i+1}.
 *
 * The indices can sometimes become stale when nodes are added and removed, so Trails
 * can have their indices updated with reindex(). It's designed to be as fast as possible
 * on Trails that are already indexed accurately.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Matrix3 from '../../../dot/js/Matrix3.js';
import Transform3 from '../../../dot/js/Transform3.js';
import { Node, PDOMUtils, scenery, TrailPointer } from '../imports.js';

// constants
const ID_SEPARATOR = PDOMUtils.PDOM_UNIQUE_ID_SEPARATOR;
export default class Trail {
  // The main nodes of the trail, in order from root to leaf

  // Shortcut for the length of nodes.

  // A unique identifier that should only be shared by other trails that are identical to this one.

  // indices[x] stores the index of nodes[x] in nodes[x-1]'s children, e.g.
  // nodes[i].children[ indices[i] ] === nodes[i+1]

  // Controls the immutability of the trail.
  // If set to true, add/remove descendant/ancestor should fail if assertions are enabled
  // Use setImmutable() or setMutable() to signal a specific type of protection, so it cannot be changed later

  /**
   * @param [nodes]
   */
  constructor(nodes) {
    if (assert) {
      // Only do this if assertions are enabled, otherwise we won't access it at all
      this.immutable = undefined;
    }
    if (nodes instanceof Trail) {
      // copy constructor (takes advantage of already built index information)
      const otherTrail = nodes;
      this.nodes = otherTrail.nodes.slice(0);
      this.length = otherTrail.length;
      this.uniqueId = otherTrail.uniqueId;
      this.indices = otherTrail.indices.slice(0);
      return;
    }
    this.nodes = [];
    this.length = 0;
    this.uniqueId = '';
    this.indices = [];
    if (nodes) {
      if (nodes instanceof Node) {
        const node = nodes;

        // add just a single node in
        this.addDescendant(node);
      } else {
        // process it as an array
        const len = nodes.length;
        for (let i = 0; i < len; i++) {
          this.addDescendant(nodes[i]);
        }
      }
    }
  }

  /**
   * Returns a copy of this Trail that can be modified independently
   */
  copy() {
    return new Trail(this);
  }

  /**
   * Whether the leaf-most Node in our trail will render something (scenery-internal)
   */
  isPainted() {
    return this.lastNode().isPainted();
  }

  /**
   * Whether all nodes in the trail are still connected from the trail's root to its leaf.
   */
  isValid() {
    this.reindex();
    const indexLength = this.indices.length;
    for (let i = 0; i < indexLength; i++) {
      if (this.indices[i] < 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * This trail is visible only if all nodes on it are marked as visible
   */
  isVisible() {
    let i = this.nodes.length;
    while (i--) {
      if (!this.nodes[i].isVisible()) {
        return false;
      }
    }
    return true;
  }

  /**
   * This trail is pdomVisible only if all nodes on it are marked as pdomVisible
   */
  isPDOMVisible() {
    let i = this.nodes.length;
    while (i--) {
      if (!this.nodes[i].isVisible() || !this.nodes[i].isPDOMVisible()) {
        return false;
      }
    }
    return true;
  }
  getOpacity() {
    let opacity = 1;
    let i = this.nodes.length;
    while (i--) {
      opacity *= this.nodes[i].getOpacity();
    }
    return opacity;
  }

  /**
   * Essentially whether this node is visited in the hit-testing operation
   */
  isPickable() {
    // it won't be if it or any ancestor is pickable: false, or is invisible
    if (_.some(this.nodes, node => node.pickable === false || !node.visible)) {
      return false;
    }

    // if there is any listener or pickable: true, it will be pickable
    if (_.some(this.nodes, node => node._inputListeners.length > 0 || node.pickableProperty.value === true)) {
      return true;
    }

    // no listeners or pickable: true, so it will be pruned
    return false;
  }
  get(index) {
    if (index >= 0) {
      return this.nodes[index];
    } else {
      // negative index goes from the end of the array
      return this.nodes[this.nodes.length + index];
    }
  }
  slice(startIndex, endIndex) {
    return new Trail(this.nodes.slice(startIndex, endIndex));
  }

  /**
   * TODO: consider renaming to subtrailToExcluding and subtrailToIncluding? https://github.com/phetsims/scenery/issues/1581
   */
  subtrailTo(node, excludeNode = false) {
    return this.slice(0, _.indexOf(this.nodes, node) + (excludeNode ? 0 : 1));
  }
  isEmpty() {
    return this.nodes.length === 0;
  }

  /**
   * Returns the matrix multiplication of our selected nodes transformation matrices.
   *
   * @param startingIndex - Include nodes matrices starting from this index (inclusive)
   * @param endingIndex - Include nodes matrices up to this index (exclusive)
   */
  getMatrixConcatenation(startingIndex, endingIndex) {
    // TODO: performance: can we cache this ever? would need the rootNode to not really change in between https://github.com/phetsims/scenery/issues/1581
    // this matrix will be modified in place, so always start fresh
    const matrix = Matrix3.identity();

    // from the root up
    const nodes = this.nodes;
    for (let i = startingIndex; i < endingIndex; i++) {
      matrix.multiplyMatrix(nodes[i].getMatrix());
    }
    return matrix;
  }

  /**
   * From local to global
   *
   * e.g. local coordinate frame of the leaf node to the parent coordinate frame of the root node
   */
  getMatrix() {
    return this.getMatrixConcatenation(0, this.nodes.length);
  }

  /**
   * From local to next-to-global (ignores root node matrix)
   *
   * e.g. local coordinate frame of the leaf node to the local coordinate frame of the root node
   */
  getAncestorMatrix() {
    return this.getMatrixConcatenation(1, this.nodes.length);
  }

  /**
   * From parent to global
   *
   * e.g. parent coordinate frame of the leaf node to the parent coordinate frame of the root node
   */
  getParentMatrix() {
    return this.getMatrixConcatenation(0, this.nodes.length - 1);
  }

  /**
   * From parent to next-to-global (ignores root node matrix)
   *
   * e.g. parent coordinate frame of the leaf node to the local coordinate frame of the root node
   */
  getAncestorParentMatrix() {
    return this.getMatrixConcatenation(1, this.nodes.length - 1);
  }

  /**
   * From local to global
   *
   * e.g. local coordinate frame of the leaf node to the parent coordinate frame of the root node
   */
  getTransform() {
    return new Transform3(this.getMatrix());
  }

  /**
   * From parent to global
   *
   * e.g. parent coordinate frame of the leaf node to the parent coordinate frame of the root node
   */
  getParentTransform() {
    return new Transform3(this.getParentMatrix());
  }
  addAncestor(node, index) {
    assert && assert(!this.immutable, 'cannot modify an immutable Trail with addAncestor');
    assert && assert(node, 'cannot add falsy value to a Trail');
    if (this.nodes.length) {
      const oldRoot = this.nodes[0];
      this.indices.unshift(index === undefined ? _.indexOf(node._children, oldRoot) : index);
    }
    this.nodes.unshift(node);
    this.length++;
    // accelerated version of this.updateUniqueId()
    this.uniqueId = this.uniqueId ? node.id + ID_SEPARATOR + this.uniqueId : `${node.id}`;
    return this;
  }
  removeAncestor() {
    assert && assert(!this.immutable, 'cannot modify an immutable Trail with removeAncestor');
    assert && assert(this.length > 0, 'cannot remove a Node from an empty trail');
    this.nodes.shift();
    if (this.indices.length) {
      this.indices.shift();
    }
    this.length--;
    this.updateUniqueId();
    return this;
  }
  addDescendant(node, index) {
    assert && assert(!this.immutable, 'cannot modify an immutable Trail with addDescendant');
    assert && assert(node, 'cannot add falsy value to a Trail');
    if (this.nodes.length) {
      const parent = this.lastNode();
      this.indices.push(index === undefined ? _.indexOf(parent._children, node) : index);
    }
    this.nodes.push(node);
    this.length++;
    // accelerated version of this.updateUniqueId()
    this.uniqueId = this.uniqueId ? this.uniqueId + ID_SEPARATOR + node.id : `${node.id}`;
    return this;
  }
  removeDescendant() {
    assert && assert(!this.immutable, 'cannot modify an immutable Trail with removeDescendant');
    assert && assert(this.length > 0, 'cannot remove a Node from an empty trail');
    this.nodes.pop();
    if (this.indices.length) {
      this.indices.pop();
    }
    this.length--;
    this.updateUniqueId();
    return this;
  }
  addDescendantTrail(trail) {
    const length = trail.length;
    if (length) {
      this.addDescendant(trail.nodes[0]);
    }
    for (let i = 1; i < length; i++) {
      this.addDescendant(trail.nodes[i], this.indices[i - 1]);
    }
  }
  removeDescendantTrail(trail) {
    const length = trail.length;
    for (let i = length - 1; i >= 0; i--) {
      assert && assert(this.lastNode() === trail.nodes[i]);
      this.removeDescendant();
    }
  }

  /**
   * Refreshes the internal index references (important if any children arrays were modified!)
   */
  reindex() {
    const length = this.length;
    for (let i = 1; i < length; i++) {
      // only replace indices where they have changed (this was a performance hotspot)
      const currentIndex = this.indices[i - 1];
      const baseNode = this.nodes[i - 1];
      if (baseNode._children[currentIndex] !== this.nodes[i]) {
        this.indices[i - 1] = _.indexOf(baseNode._children, this.nodes[i]);
      }
    }
  }
  setImmutable() {
    // if assertions are disabled, we hope this is inlined as a no-op
    if (assert) {
      assert(this.immutable !== false, 'A trail cannot be made immutable after being flagged as mutable');
      this.immutable = true;
    }

    // TODO: consider setting mutators to null here instead of the function call check (for performance, and profile the differences) https://github.com/phetsims/scenery/issues/1581

    return this; // allow chaining
  }
  setMutable() {
    // if assertions are disabled, we hope this is inlined as a no-op
    if (assert) {
      assert(this.immutable !== true, 'A trail cannot be made mutable after being flagged as immutable');
      this.immutable = false;
    }
    return this; // allow chaining
  }
  areIndicesValid() {
    for (let i = 1; i < this.length; i++) {
      const currentIndex = this.indices[i - 1];
      if (this.nodes[i - 1]._children[currentIndex] !== this.nodes[i]) {
        return false;
      }
    }
    return true;
  }
  equals(other) {
    if (this.length !== other.length) {
      return false;
    }
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i] !== other.nodes[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns a new Trail from the root up to the parameter node.
   */
  upToNode(node) {
    const nodeIndex = _.indexOf(this.nodes, node);
    assert && assert(nodeIndex >= 0, 'Trail does not contain the node');
    return this.slice(0, _.indexOf(this.nodes, node) + 1);
  }

  /**
   * Whether this trail contains the complete 'other' trail, but with added descendants afterwards.
   *
   * @param other - is other a subset of this trail?
   * @param allowSameTrail
   */
  isExtensionOf(other, allowSameTrail) {
    if (this.length <= other.length - (allowSameTrail ? 1 : 0)) {
      return false;
    }
    for (let i = 0; i < other.nodes.length; i++) {
      if (this.nodes[i] !== other.nodes[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns whether a given node is contained in the trail.
   */
  containsNode(node) {
    return _.includes(this.nodes, node);
  }

  /**
   * A transform from our local coordinate frame to the other trail's local coordinate frame
   */
  getTransformTo(otherTrail) {
    return new Transform3(this.getMatrixTo(otherTrail));
  }

  /**
   * Returns a matrix that transforms a point in our last node's local coordinate frame to the other trail's last node's
   * local coordinate frame
   */
  getMatrixTo(otherTrail) {
    this.reindex();
    otherTrail.reindex();
    const branchIndex = this.getBranchIndexTo(otherTrail);
    let idx;
    let matrix = Matrix3.IDENTITY;

    // walk our transform down, prepending
    for (idx = this.length - 1; idx >= branchIndex; idx--) {
      matrix = this.nodes[idx].getMatrix().timesMatrix(matrix);
    }

    // walk our transform up, prepending inverses
    for (idx = branchIndex; idx < otherTrail.length; idx++) {
      matrix = otherTrail.nodes[idx].getTransform().getInverse().timesMatrix(matrix);
    }
    return matrix;
  }

  /**
   * Returns the first index that is different between this trail and the other trail.
   *
   * If the trails are identical, the index should be equal to the trail's length.
   */
  getBranchIndexTo(otherTrail) {
    assert && assert(this.nodes[0] === otherTrail.nodes[0], 'To get a branch index, the trails must have the same root');
    let branchIndex;
    const min = Math.min(this.length, otherTrail.length);
    for (branchIndex = 0; branchIndex < min; branchIndex++) {
      if (this.nodes[branchIndex] !== otherTrail.nodes[branchIndex]) {
        break;
      }
    }
    return branchIndex;
  }

  /**
   * Returns the last (largest) index into the trail's nodes that has inputEnabled=true.
   */
  getLastInputEnabledIndex() {
    // Determine how far up the Trail input is determined. The first node with !inputEnabled and after will not have
    // events fired (see https://github.com/phetsims/sun/issues/257)
    let trailStartIndex = -1;
    for (let j = 0; j < this.length; j++) {
      if (!this.nodes[j].inputEnabled) {
        break;
      }
      trailStartIndex = j;
    }
    return trailStartIndex;
  }

  /**
   * Returns the leaf-most index, unless there is a Node with inputEnabled=false (in which case, the lowest index
   * for those matching Nodes are returned).
   */
  getCursorCheckIndex() {
    return this.getLastInputEnabledIndex();
  }

  /**
   * TODO: phase out in favor of get() https://github.com/phetsims/scenery/issues/1581
   */
  nodeFromTop(offset) {
    return this.nodes[this.length - 1 - offset];
  }
  lastNode() {
    return this.nodeFromTop(0);
  }
  rootNode() {
    return this.nodes[0];
  }

  /**
   * Returns the previous graph trail in the order of self-rendering
   */
  previous() {
    if (this.nodes.length <= 1) {
      return null;
    }
    const top = this.nodeFromTop(0);
    const parent = this.nodeFromTop(1);
    const parentIndex = _.indexOf(parent._children, top);
    assert && assert(parentIndex !== -1);
    const arr = this.nodes.slice(0, this.nodes.length - 1);
    if (parentIndex === 0) {
      // we were the first child, so give it the trail to the parent
      return new Trail(arr);
    } else {
      // previous child
      arr.push(parent._children[parentIndex - 1]);

      // and find its last terminal
      while (arr[arr.length - 1]._children.length !== 0) {
        const last = arr[arr.length - 1];
        arr.push(last._children[last._children.length - 1]);
      }
      return new Trail(arr);
    }
  }

  /**
   * Like previous(), but keeps moving back until the trail goes to a node with isPainted() === true
   */
  previousPainted() {
    let result = this.previous();
    while (result && !result.isPainted()) {
      result = result.previous();
    }
    return result;
  }

  /**
   * In the order of self-rendering
   */
  next() {
    const arr = this.nodes.slice(0);
    const top = this.nodeFromTop(0);
    if (top._children.length > 0) {
      // if we have children, return the first child
      arr.push(top._children[0]);
      return new Trail(arr);
    } else {
      // walk down and attempt to find the next parent
      let depth = this.nodes.length - 1;
      while (depth > 0) {
        const node = this.nodes[depth];
        const parent = this.nodes[depth - 1];
        arr.pop(); // take off the node so we can add the next sibling if it exists

        const index = _.indexOf(parent._children, node);
        if (index !== parent._children.length - 1) {
          // there is another (later) sibling. use that!
          arr.push(parent._children[index + 1]);
          return new Trail(arr);
        } else {
          depth--;
        }
      }

      // if we didn't reach a later sibling by now, it doesn't exist
      return null;
    }
  }

  /**
   * Like next(), but keeps moving back until the trail goes to a node with isPainted() === true
   */
  nextPainted() {
    let result = this.next();
    while (result && !result.isPainted()) {
      result = result.next();
    }
    return result;
  }

  /**
   * Calls callback( trail ) for this trail, and each descendant trail. If callback returns true, subtree will be skipped
   */
  eachTrailUnder(callback) {
    // TODO: performance: should be optimized to be much faster, since we don't have to deal with the before/after https://github.com/phetsims/scenery/issues/1581
    new TrailPointer(this, true).eachTrailBetween(new TrailPointer(this, false), callback);
  }

  /**
   * Standard Java-style compare. -1 means this trail is before (under) the other trail, 0 means equal, and 1 means this trail is
   * after (on top of) the other trail.
   * A shorter subtrail will compare as -1.
   *
   * Assumes that the Trails are properly indexed. If not, please reindex them!
   *
   * Comparison is for the rendering order, so an ancestor is 'before' a descendant
   */
  compare(other) {
    assert && assert(!this.isEmpty(), 'cannot compare with an empty trail');
    assert && assert(!other.isEmpty(), 'cannot compare with an empty trail');
    assert && assert(this.nodes[0] === other.nodes[0], 'for Trail comparison, trails must have the same root node');
    assertSlow && assertSlow(this.areIndicesValid(), `Trail.compare this.areIndicesValid() failed on ${this.toString()}`);
    assertSlow && assertSlow(other.areIndicesValid(), `Trail.compare other.areIndicesValid() failed on ${other.toString()}`);
    const minNodeIndex = Math.min(this.nodes.length, other.nodes.length);
    for (let i = 0; i < minNodeIndex; i++) {
      if (this.nodes[i] !== other.nodes[i]) {
        if (this.nodes[i - 1].children.indexOf(this.nodes[i]) < other.nodes[i - 1].children.indexOf(other.nodes[i])) {
          return -1;
        } else {
          return 1;
        }
      }
    }

    // we scanned through and no nodes were different (one is a subtrail of the other)
    if (this.nodes.length < other.nodes.length) {
      return -1;
    } else if (this.nodes.length > other.nodes.length) {
      return 1;
    } else {
      return 0;
    }
  }
  isBefore(other) {
    return this.compare(other) === -1;
  }
  isAfter(other) {
    return this.compare(other) === 1;
  }
  localToGlobalPoint(point) {
    // TODO: performance: multiple timesVector2 calls up the chain is probably faster https://github.com/phetsims/scenery/issues/1581
    return this.getMatrix().timesVector2(point);
  }
  localToGlobalBounds(bounds) {
    return bounds.transformed(this.getMatrix());
  }
  globalToLocalPoint(point) {
    return this.getTransform().inversePosition2(point);
  }
  globalToLocalBounds(bounds) {
    return this.getTransform().inverseBounds2(bounds);
  }
  parentToGlobalPoint(point) {
    // TODO: performance: multiple timesVector2 calls up the chain is probably faster https://github.com/phetsims/scenery/issues/1581
    return this.getParentMatrix().timesVector2(point);
  }
  parentToGlobalBounds(bounds) {
    return bounds.transformed(this.getParentMatrix());
  }
  globalToParentPoint(point) {
    return this.getParentTransform().inversePosition2(point);
  }
  globalToParentBounds(bounds) {
    return this.getParentTransform().inverseBounds2(bounds);
  }
  updateUniqueId() {
    // string concatenation is faster, see http://jsperf.com/string-concat-vs-joins
    let result = '';
    const len = this.nodes.length;
    if (len > 0) {
      result += this.nodes[0]._id;
    }
    for (let i = 1; i < len; i++) {
      result += ID_SEPARATOR + this.nodes[i]._id;
    }
    this.uniqueId = result;
    // this.uniqueId = _.map( this.nodes, function( node ) { return node.getId(); } ).join( '-' );
  }

  /**
   * Concatenates the unique IDs of nodes in the trail, so that we can do id-based lookups
   */
  getUniqueId() {
    // sanity checks
    if (assert) {
      const oldUniqueId = this.uniqueId;
      this.updateUniqueId();
      assert(oldUniqueId === this.uniqueId);
    }
    return this.uniqueId;
  }

  /**
   * Returns a string form of this object
   */
  toString() {
    this.reindex();
    if (!this.length) {
      return 'Empty Trail';
    }
    return `[Trail ${this.indices.join('.')} ${this.getUniqueId()}]`;
  }

  /**
   * Cleaner string form which will show class names. Not optimized by any means, meant for debugging.
   */
  toPathString() {
    return _.map(this.nodes, n => {
      let string = n.constructor.name;
      if (string === 'Node') {
        string = '.';
      }
      return string;
    }).join('/');
  }

  /**
   * Returns a debugging string ideal for logged output.
   */
  toDebugString() {
    return `${this.toString()} ${this.toPathString()}`;
  }

  /**
   * Like eachTrailBetween, but only fires for painted trails. If callback returns true, subtree will be skipped
   */
  static eachPaintedTrailBetween(a, b, callback, excludeEndTrails, rootNode) {
    Trail.eachTrailBetween(a, b, trail => {
      if (trail.isPainted()) {
        return callback(trail);
      }
      return false;
    }, excludeEndTrails, rootNode);
  }

  /**
   * Global way of iterating across trails. when callback returns true, subtree will be skipped
   */
  static eachTrailBetween(a, b, callback, excludeEndTrails, rootNode) {
    const aPointer = a ? new TrailPointer(a.copy(), true) : new TrailPointer(new Trail(rootNode), true);
    const bPointer = b ? new TrailPointer(b.copy(), true) : new TrailPointer(new Trail(rootNode), false);

    // if we are excluding endpoints, just bump the pointers towards each other by one step
    if (excludeEndTrails) {
      aPointer.nestedForwards();
      bPointer.nestedBackwards();

      // they were adjacent, so no callbacks will be executed
      if (aPointer.compareNested(bPointer) === 1) {
        return;
      }
    }
    aPointer.depthFirstUntil(bPointer, pointer => {
      if (pointer.isBefore) {
        return callback(pointer.trail);
      }
      return false;
    }, false);
  }

  /**
   * The index at which the two trails diverge. If a.length === b.length === branchIndex, the trails are identical
   */
  static branchIndex(a, b) {
    assert && assert(a.nodes[0] === b.nodes[0], 'Branch changes require roots to be the same');
    let branchIndex;
    const shortestLength = Math.min(a.length, b.length);
    for (branchIndex = 0; branchIndex < shortestLength; branchIndex++) {
      if (a.nodes[branchIndex] !== b.nodes[branchIndex]) {
        break;
      }
    }
    return branchIndex;
  }

  /**
   * The subtrail from the root that both trails share
   */
  static sharedTrail(a, b) {
    return a.slice(0, Trail.branchIndex(a, b));
  }

  /**
   * @param trailResults - Will be muted by appending matching trails
   * @param trail
   * @param predicate
   */
  static appendAncestorTrailsWithPredicate(trailResults, trail, predicate) {
    const root = trail.rootNode();
    if (predicate(root)) {
      trailResults.push(trail.copy());
    }
    const parentCount = root._parents.length;
    for (let i = 0; i < parentCount; i++) {
      const parent = root._parents[i];
      trail.addAncestor(parent);
      Trail.appendAncestorTrailsWithPredicate(trailResults, trail, predicate);
      trail.removeAncestor();
    }
  }

  /**
   * @param trailResults - Will be muted by appending matching trails
   * @param trail
   * @param predicate
   */
  static appendDescendantTrailsWithPredicate(trailResults, trail, predicate) {
    const lastNode = trail.lastNode();
    if (predicate(lastNode)) {
      trailResults.push(trail.copy());
    }
    const childCount = lastNode._children.length;
    for (let i = 0; i < childCount; i++) {
      const child = lastNode._children[i];
      trail.addDescendant(child, i);
      Trail.appendDescendantTrailsWithPredicate(trailResults, trail, predicate);
      trail.removeDescendant();
    }
  }

  /*
   * Fires subtree(trail) or self(trail) on the callbacks to create disjoint subtrees (trails) that cover exactly the nodes
   * inclusively between a and b in rendering order.
   * We try to consolidate these as much as possible.
   *
   * "a" and "b" are treated like self painted trails in the rendering order
   *
   *
   * Example tree:
   *   a
   *   - b
   *   --- c
   *   --- d
   *   - e
   *   --- f
   *   ----- g
   *   ----- h
   *   ----- i
   *   --- j
   *   ----- k
   *   - l
   *   - m
   *   --- n
   *
   * spannedSubtrees( a, a ) -> self( a );
   * spannedSubtrees( c, n ) -> subtree( a ); NOTE: if b is painted, that wouldn't work!
   * spannedSubtrees( h, l ) -> subtree( h ); subtree( i ); subtree( j ); self( l );
   * spannedSubtrees( c, i ) -> [b,f] --- wait, include e self?
   */
  static spannedSubtrees(a, b) {
    // assert && assert( a.nodes[0] === b.nodes[0], 'Spanned subtrees for a and b requires that a and b have the same root' );

    // a.reindex();
    // b.reindex();

    // var subtrees = [];

    // var branchIndex = Trail.branchIndex( a, b );
    // assert && assert( branchIndex > 0, 'Branch index should always be > 0' );

    // if ( a.length === branchIndex && b.length === branchIndex ) {
    //   // the two trails are equal
    //   subtrees.push( a );
    // } else {
    //   // find the first place where our start isn't the first child
    //   for ( var before = a.length - 1; before >= branchIndex; before-- ) {
    //     if ( a.indices[before-1] !== 0 ) {
    //       break;
    //     }
    //   }

    //   // find the first place where our end isn't the last child
    //   for ( var after = a.length - 1; after >= branchIndex; after-- ) {
    //     if ( b.indices[after-1] !== b.nodes[after-1]._children.length - 1 ) {
    //       break;
    //     }
    //   }

    //   if ( before < branchIndex && after < branchIndex ) {
    //     // we span the entire tree up to nodes[branchIndex-1], so return only that subtree
    //     subtrees.push( a.slice( 0, branchIndex ) );
    //   } else {
    //     // walk the subtrees down from the start
    //     for ( var ia = before; ia >= branchIndex; ia-- ) {
    //       subtrees.push( a.slice( 0, ia + 1 ) );
    //     }

    //     // walk through the middle
    //     var iStart = a.indices[branchIndex-1];
    //     var iEnd = b.indices[branchIndex-1];
    //     var base = a.slice( 0, branchIndex );
    //     var children = base.lastNode()._children;
    //     for ( var im = iStart; im <= iEnd; im++ ) {
    //       subtrees.push( base.copy().addDescendant( children[im], im ) );
    //     }

    //     // walk the subtrees up to the end
    //     for ( var ib = branchIndex; ib <= after; ib++ ) {
    //       subtrees.push( b.slice( 0, ib + 1 ) );
    //     }
    //   }
    // }

    // return subtrees;
  }

  /**
   * Re-create a trail to a root node from an existing Trail id. The rootNode must have the same Id as the first
   * Node id of uniqueId.
   *
   * @param rootNode - the root of the trail being created
   * @param uniqueId - integers separated by ID_SEPARATOR, see getUniqueId
   */
  static fromUniqueId(rootNode, uniqueId) {
    const trailIds = uniqueId.split(ID_SEPARATOR);
    const trailIdNumbers = trailIds.map(id => Number(id));
    let currentNode = rootNode;
    const rootId = trailIdNumbers.shift();
    const nodes = [currentNode];
    assert && assert(rootId === rootNode.id);
    while (trailIdNumbers.length > 0) {
      const trailId = trailIdNumbers.shift();

      // if accessible order is set, the trail might not match the hierarchy of children - search through nodes
      // in pdomOrder first because pdomOrder is an override for scene graph structure
      const pdomOrder = currentNode.pdomOrder || [];
      const children = pdomOrder.concat(currentNode.children);
      for (let j = 0; j < children.length; j++) {
        // pdomOrder supports null entries to fill in with default order
        if (children[j] !== null && children[j].id === trailId) {
          const childAlongTrail = children[j];
          nodes.push(childAlongTrail);
          currentNode = childAlongTrail;
          break;
        }
        assert && assert(j !== children.length - 1, 'unable to find node from unique Trail id');
      }
    }
    return new Trail(nodes);
  }
}
scenery.register('Trail', Trail);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNYXRyaXgzIiwiVHJhbnNmb3JtMyIsIk5vZGUiLCJQRE9NVXRpbHMiLCJzY2VuZXJ5IiwiVHJhaWxQb2ludGVyIiwiSURfU0VQQVJBVE9SIiwiUERPTV9VTklRVUVfSURfU0VQQVJBVE9SIiwiVHJhaWwiLCJjb25zdHJ1Y3RvciIsIm5vZGVzIiwiYXNzZXJ0IiwiaW1tdXRhYmxlIiwidW5kZWZpbmVkIiwib3RoZXJUcmFpbCIsInNsaWNlIiwibGVuZ3RoIiwidW5pcXVlSWQiLCJpbmRpY2VzIiwibm9kZSIsImFkZERlc2NlbmRhbnQiLCJsZW4iLCJpIiwiY29weSIsImlzUGFpbnRlZCIsImxhc3ROb2RlIiwiaXNWYWxpZCIsInJlaW5kZXgiLCJpbmRleExlbmd0aCIsImlzVmlzaWJsZSIsImlzUERPTVZpc2libGUiLCJnZXRPcGFjaXR5Iiwib3BhY2l0eSIsImlzUGlja2FibGUiLCJfIiwic29tZSIsInBpY2thYmxlIiwidmlzaWJsZSIsIl9pbnB1dExpc3RlbmVycyIsInBpY2thYmxlUHJvcGVydHkiLCJ2YWx1ZSIsImdldCIsImluZGV4Iiwic3RhcnRJbmRleCIsImVuZEluZGV4Iiwic3VidHJhaWxUbyIsImV4Y2x1ZGVOb2RlIiwiaW5kZXhPZiIsImlzRW1wdHkiLCJnZXRNYXRyaXhDb25jYXRlbmF0aW9uIiwic3RhcnRpbmdJbmRleCIsImVuZGluZ0luZGV4IiwibWF0cml4IiwiaWRlbnRpdHkiLCJtdWx0aXBseU1hdHJpeCIsImdldE1hdHJpeCIsImdldEFuY2VzdG9yTWF0cml4IiwiZ2V0UGFyZW50TWF0cml4IiwiZ2V0QW5jZXN0b3JQYXJlbnRNYXRyaXgiLCJnZXRUcmFuc2Zvcm0iLCJnZXRQYXJlbnRUcmFuc2Zvcm0iLCJhZGRBbmNlc3RvciIsIm9sZFJvb3QiLCJ1bnNoaWZ0IiwiX2NoaWxkcmVuIiwiaWQiLCJyZW1vdmVBbmNlc3RvciIsInNoaWZ0IiwidXBkYXRlVW5pcXVlSWQiLCJwYXJlbnQiLCJwdXNoIiwicmVtb3ZlRGVzY2VuZGFudCIsInBvcCIsImFkZERlc2NlbmRhbnRUcmFpbCIsInRyYWlsIiwicmVtb3ZlRGVzY2VuZGFudFRyYWlsIiwiY3VycmVudEluZGV4IiwiYmFzZU5vZGUiLCJzZXRJbW11dGFibGUiLCJzZXRNdXRhYmxlIiwiYXJlSW5kaWNlc1ZhbGlkIiwiZXF1YWxzIiwib3RoZXIiLCJ1cFRvTm9kZSIsIm5vZGVJbmRleCIsImlzRXh0ZW5zaW9uT2YiLCJhbGxvd1NhbWVUcmFpbCIsImNvbnRhaW5zTm9kZSIsImluY2x1ZGVzIiwiZ2V0VHJhbnNmb3JtVG8iLCJnZXRNYXRyaXhUbyIsImJyYW5jaEluZGV4IiwiZ2V0QnJhbmNoSW5kZXhUbyIsImlkeCIsIklERU5USVRZIiwidGltZXNNYXRyaXgiLCJnZXRJbnZlcnNlIiwibWluIiwiTWF0aCIsImdldExhc3RJbnB1dEVuYWJsZWRJbmRleCIsInRyYWlsU3RhcnRJbmRleCIsImoiLCJpbnB1dEVuYWJsZWQiLCJnZXRDdXJzb3JDaGVja0luZGV4Iiwibm9kZUZyb21Ub3AiLCJvZmZzZXQiLCJyb290Tm9kZSIsInByZXZpb3VzIiwidG9wIiwicGFyZW50SW5kZXgiLCJhcnIiLCJsYXN0IiwicHJldmlvdXNQYWludGVkIiwicmVzdWx0IiwibmV4dCIsImRlcHRoIiwibmV4dFBhaW50ZWQiLCJlYWNoVHJhaWxVbmRlciIsImNhbGxiYWNrIiwiZWFjaFRyYWlsQmV0d2VlbiIsImNvbXBhcmUiLCJhc3NlcnRTbG93IiwidG9TdHJpbmciLCJtaW5Ob2RlSW5kZXgiLCJjaGlsZHJlbiIsImlzQmVmb3JlIiwiaXNBZnRlciIsImxvY2FsVG9HbG9iYWxQb2ludCIsInBvaW50IiwidGltZXNWZWN0b3IyIiwibG9jYWxUb0dsb2JhbEJvdW5kcyIsImJvdW5kcyIsInRyYW5zZm9ybWVkIiwiZ2xvYmFsVG9Mb2NhbFBvaW50IiwiaW52ZXJzZVBvc2l0aW9uMiIsImdsb2JhbFRvTG9jYWxCb3VuZHMiLCJpbnZlcnNlQm91bmRzMiIsInBhcmVudFRvR2xvYmFsUG9pbnQiLCJwYXJlbnRUb0dsb2JhbEJvdW5kcyIsImdsb2JhbFRvUGFyZW50UG9pbnQiLCJnbG9iYWxUb1BhcmVudEJvdW5kcyIsIl9pZCIsImdldFVuaXF1ZUlkIiwib2xkVW5pcXVlSWQiLCJqb2luIiwidG9QYXRoU3RyaW5nIiwibWFwIiwibiIsInN0cmluZyIsIm5hbWUiLCJ0b0RlYnVnU3RyaW5nIiwiZWFjaFBhaW50ZWRUcmFpbEJldHdlZW4iLCJhIiwiYiIsImV4Y2x1ZGVFbmRUcmFpbHMiLCJhUG9pbnRlciIsImJQb2ludGVyIiwibmVzdGVkRm9yd2FyZHMiLCJuZXN0ZWRCYWNrd2FyZHMiLCJjb21wYXJlTmVzdGVkIiwiZGVwdGhGaXJzdFVudGlsIiwicG9pbnRlciIsInNob3J0ZXN0TGVuZ3RoIiwic2hhcmVkVHJhaWwiLCJhcHBlbmRBbmNlc3RvclRyYWlsc1dpdGhQcmVkaWNhdGUiLCJ0cmFpbFJlc3VsdHMiLCJwcmVkaWNhdGUiLCJyb290IiwicGFyZW50Q291bnQiLCJfcGFyZW50cyIsImFwcGVuZERlc2NlbmRhbnRUcmFpbHNXaXRoUHJlZGljYXRlIiwiY2hpbGRDb3VudCIsImNoaWxkIiwic3Bhbm5lZFN1YnRyZWVzIiwiZnJvbVVuaXF1ZUlkIiwidHJhaWxJZHMiLCJzcGxpdCIsInRyYWlsSWROdW1iZXJzIiwiTnVtYmVyIiwiY3VycmVudE5vZGUiLCJyb290SWQiLCJ0cmFpbElkIiwicGRvbU9yZGVyIiwiY29uY2F0IiwiY2hpbGRBbG9uZ1RyYWlsIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJUcmFpbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxMy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBSZXByZXNlbnRzIGEgdHJhaWwgKHBhdGggaW4gdGhlIGdyYXBoKSBmcm9tIGEgJ3Jvb3QnIG5vZGUgZG93biB0byBhIGRlc2NlbmRhbnQgbm9kZS5cclxuICogSW4gYSBEQUcsIG9yIHdpdGggZGlmZmVyZW50IHZpZXdzLCB0aGVyZSBjYW4gYmUgbW9yZSB0aGFuIG9uZSB0cmFpbCB1cCBmcm9tIGEgbm9kZSxcclxuICogZXZlbiB0byB0aGUgc2FtZSByb290IG5vZGUhXHJcbiAqXHJcbiAqIEl0IGhhcyBhbiBhcnJheSBvZiBub2RlcywgaW4gb3JkZXIgZnJvbSB0aGUgJ3Jvb3QnIGRvd24gdG8gdGhlIGxhc3Qgbm9kZSxcclxuICogYSBsZW5ndGgsIGFuZCBhbiBhcnJheSBvZiBpbmRpY2VzIHN1Y2ggdGhhdCBub2RlX2kuY2hpbGRyZW5baW5kZXhfaV0gPT09IG5vZGVfe2krMX0uXHJcbiAqXHJcbiAqIFRoZSBpbmRpY2VzIGNhbiBzb21ldGltZXMgYmVjb21lIHN0YWxlIHdoZW4gbm9kZXMgYXJlIGFkZGVkIGFuZCByZW1vdmVkLCBzbyBUcmFpbHNcclxuICogY2FuIGhhdmUgdGhlaXIgaW5kaWNlcyB1cGRhdGVkIHdpdGggcmVpbmRleCgpLiBJdCdzIGRlc2lnbmVkIHRvIGJlIGFzIGZhc3QgYXMgcG9zc2libGVcclxuICogb24gVHJhaWxzIHRoYXQgYXJlIGFscmVhZHkgaW5kZXhlZCBhY2N1cmF0ZWx5LlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IEJvdW5kczIgZnJvbSAnLi4vLi4vLi4vZG90L2pzL0JvdW5kczIuanMnO1xyXG5pbXBvcnQgTWF0cml4MyBmcm9tICcuLi8uLi8uLi9kb3QvanMvTWF0cml4My5qcyc7XHJcbmltcG9ydCBUcmFuc2Zvcm0zIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9UcmFuc2Zvcm0zLmpzJztcclxuaW1wb3J0IFZlY3RvcjIgZnJvbSAnLi4vLi4vLi4vZG90L2pzL1ZlY3RvcjIuanMnO1xyXG5pbXBvcnQgeyBOb2RlLCBQRE9NVXRpbHMsIHNjZW5lcnksIFRyYWlsUG9pbnRlciB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5cclxuLy8gY29uc3RhbnRzXHJcbmNvbnN0IElEX1NFUEFSQVRPUiA9IFBET01VdGlscy5QRE9NX1VOSVFVRV9JRF9TRVBBUkFUT1I7XHJcblxyXG5leHBvcnQgdHlwZSBUcmFpbENhbGxiYWNrID0gKCAoIHRyYWlsOiBUcmFpbCApID0+IGJvb2xlYW4gKSB8ICggKCB0cmFpbDogVHJhaWwgKSA9PiB2b2lkICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUcmFpbCB7XHJcblxyXG4gIC8vIFRoZSBtYWluIG5vZGVzIG9mIHRoZSB0cmFpbCwgaW4gb3JkZXIgZnJvbSByb290IHRvIGxlYWZcclxuICBwdWJsaWMgbm9kZXM6IE5vZGVbXTtcclxuXHJcbiAgLy8gU2hvcnRjdXQgZm9yIHRoZSBsZW5ndGggb2Ygbm9kZXMuXHJcbiAgcHVibGljIGxlbmd0aDogbnVtYmVyO1xyXG5cclxuICAvLyBBIHVuaXF1ZSBpZGVudGlmaWVyIHRoYXQgc2hvdWxkIG9ubHkgYmUgc2hhcmVkIGJ5IG90aGVyIHRyYWlscyB0aGF0IGFyZSBpZGVudGljYWwgdG8gdGhpcyBvbmUuXHJcbiAgcHVibGljIHVuaXF1ZUlkOiBzdHJpbmc7XHJcblxyXG4gIC8vIGluZGljZXNbeF0gc3RvcmVzIHRoZSBpbmRleCBvZiBub2Rlc1t4XSBpbiBub2Rlc1t4LTFdJ3MgY2hpbGRyZW4sIGUuZy5cclxuICAvLyBub2Rlc1tpXS5jaGlsZHJlblsgaW5kaWNlc1tpXSBdID09PSBub2Rlc1tpKzFdXHJcbiAgcHVibGljIGluZGljZXM6IG51bWJlcltdO1xyXG5cclxuICAvLyBDb250cm9scyB0aGUgaW1tdXRhYmlsaXR5IG9mIHRoZSB0cmFpbC5cclxuICAvLyBJZiBzZXQgdG8gdHJ1ZSwgYWRkL3JlbW92ZSBkZXNjZW5kYW50L2FuY2VzdG9yIHNob3VsZCBmYWlsIGlmIGFzc2VydGlvbnMgYXJlIGVuYWJsZWRcclxuICAvLyBVc2Ugc2V0SW1tdXRhYmxlKCkgb3Igc2V0TXV0YWJsZSgpIHRvIHNpZ25hbCBhIHNwZWNpZmljIHR5cGUgb2YgcHJvdGVjdGlvbiwgc28gaXQgY2Fubm90IGJlIGNoYW5nZWQgbGF0ZXJcclxuICBwcml2YXRlIGltbXV0YWJsZT86IGJvb2xlYW47XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBbbm9kZXNdXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBub2Rlcz86IFRyYWlsIHwgTm9kZVtdIHwgTm9kZSApIHtcclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICAvLyBPbmx5IGRvIHRoaXMgaWYgYXNzZXJ0aW9ucyBhcmUgZW5hYmxlZCwgb3RoZXJ3aXNlIHdlIHdvbid0IGFjY2VzcyBpdCBhdCBhbGxcclxuICAgICAgdGhpcy5pbW11dGFibGUgPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBub2RlcyBpbnN0YW5jZW9mIFRyYWlsICkge1xyXG4gICAgICAvLyBjb3B5IGNvbnN0cnVjdG9yICh0YWtlcyBhZHZhbnRhZ2Ugb2YgYWxyZWFkeSBidWlsdCBpbmRleCBpbmZvcm1hdGlvbilcclxuICAgICAgY29uc3Qgb3RoZXJUcmFpbCA9IG5vZGVzO1xyXG5cclxuICAgICAgdGhpcy5ub2RlcyA9IG90aGVyVHJhaWwubm9kZXMuc2xpY2UoIDAgKTtcclxuICAgICAgdGhpcy5sZW5ndGggPSBvdGhlclRyYWlsLmxlbmd0aDtcclxuICAgICAgdGhpcy51bmlxdWVJZCA9IG90aGVyVHJhaWwudW5pcXVlSWQ7XHJcbiAgICAgIHRoaXMuaW5kaWNlcyA9IG90aGVyVHJhaWwuaW5kaWNlcy5zbGljZSggMCApO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5ub2RlcyA9IFtdO1xyXG4gICAgdGhpcy5sZW5ndGggPSAwO1xyXG4gICAgdGhpcy51bmlxdWVJZCA9ICcnO1xyXG4gICAgdGhpcy5pbmRpY2VzID0gW107XHJcblxyXG4gICAgaWYgKCBub2RlcyApIHtcclxuICAgICAgaWYgKCBub2RlcyBpbnN0YW5jZW9mIE5vZGUgKSB7XHJcbiAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzO1xyXG5cclxuICAgICAgICAvLyBhZGQganVzdCBhIHNpbmdsZSBub2RlIGluXHJcbiAgICAgICAgdGhpcy5hZGREZXNjZW5kYW50KCBub2RlICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gcHJvY2VzcyBpdCBhcyBhbiBhcnJheVxyXG4gICAgICAgIGNvbnN0IGxlbiA9IG5vZGVzLmxlbmd0aDtcclxuICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBsZW47IGkrKyApIHtcclxuICAgICAgICAgIHRoaXMuYWRkRGVzY2VuZGFudCggbm9kZXNbIGkgXSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGNvcHkgb2YgdGhpcyBUcmFpbCB0aGF0IGNhbiBiZSBtb2RpZmllZCBpbmRlcGVuZGVudGx5XHJcbiAgICovXHJcbiAgcHVibGljIGNvcHkoKTogVHJhaWwge1xyXG4gICAgcmV0dXJuIG5ldyBUcmFpbCggdGhpcyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV2hldGhlciB0aGUgbGVhZi1tb3N0IE5vZGUgaW4gb3VyIHRyYWlsIHdpbGwgcmVuZGVyIHNvbWV0aGluZyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgaXNQYWludGVkKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMubGFzdE5vZGUoKS5pc1BhaW50ZWQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZXRoZXIgYWxsIG5vZGVzIGluIHRoZSB0cmFpbCBhcmUgc3RpbGwgY29ubmVjdGVkIGZyb20gdGhlIHRyYWlsJ3Mgcm9vdCB0byBpdHMgbGVhZi5cclxuICAgKi9cclxuICBwdWJsaWMgaXNWYWxpZCgpOiBib29sZWFuIHtcclxuICAgIHRoaXMucmVpbmRleCgpO1xyXG5cclxuICAgIGNvbnN0IGluZGV4TGVuZ3RoID0gdGhpcy5pbmRpY2VzLmxlbmd0aDtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGluZGV4TGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGlmICggdGhpcy5pbmRpY2VzWyBpIF0gPCAwICkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhpcyB0cmFpbCBpcyB2aXNpYmxlIG9ubHkgaWYgYWxsIG5vZGVzIG9uIGl0IGFyZSBtYXJrZWQgYXMgdmlzaWJsZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBpc1Zpc2libGUoKTogYm9vbGVhbiB7XHJcbiAgICBsZXQgaSA9IHRoaXMubm9kZXMubGVuZ3RoO1xyXG4gICAgd2hpbGUgKCBpLS0gKSB7XHJcbiAgICAgIGlmICggIXRoaXMubm9kZXNbIGkgXS5pc1Zpc2libGUoKSApIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhpcyB0cmFpbCBpcyBwZG9tVmlzaWJsZSBvbmx5IGlmIGFsbCBub2RlcyBvbiBpdCBhcmUgbWFya2VkIGFzIHBkb21WaXNpYmxlXHJcbiAgICovXHJcbiAgcHVibGljIGlzUERPTVZpc2libGUoKTogYm9vbGVhbiB7XHJcbiAgICBsZXQgaSA9IHRoaXMubm9kZXMubGVuZ3RoO1xyXG4gICAgd2hpbGUgKCBpLS0gKSB7XHJcbiAgICAgIGlmICggIXRoaXMubm9kZXNbIGkgXS5pc1Zpc2libGUoKSB8fCAhdGhpcy5ub2Rlc1sgaSBdLmlzUERPTVZpc2libGUoKSApIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldE9wYWNpdHkoKTogbnVtYmVyIHtcclxuICAgIGxldCBvcGFjaXR5ID0gMTtcclxuICAgIGxldCBpID0gdGhpcy5ub2Rlcy5sZW5ndGg7XHJcbiAgICB3aGlsZSAoIGktLSApIHtcclxuICAgICAgb3BhY2l0eSAqPSB0aGlzLm5vZGVzWyBpIF0uZ2V0T3BhY2l0eSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9wYWNpdHk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFc3NlbnRpYWxseSB3aGV0aGVyIHRoaXMgbm9kZSBpcyB2aXNpdGVkIGluIHRoZSBoaXQtdGVzdGluZyBvcGVyYXRpb25cclxuICAgKi9cclxuICBwdWJsaWMgaXNQaWNrYWJsZSgpOiBib29sZWFuIHtcclxuICAgIC8vIGl0IHdvbid0IGJlIGlmIGl0IG9yIGFueSBhbmNlc3RvciBpcyBwaWNrYWJsZTogZmFsc2UsIG9yIGlzIGludmlzaWJsZVxyXG4gICAgaWYgKCBfLnNvbWUoIHRoaXMubm9kZXMsIG5vZGUgPT4gbm9kZS5waWNrYWJsZSA9PT0gZmFsc2UgfHwgIW5vZGUudmlzaWJsZSApICkgeyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgICAvLyBpZiB0aGVyZSBpcyBhbnkgbGlzdGVuZXIgb3IgcGlja2FibGU6IHRydWUsIGl0IHdpbGwgYmUgcGlja2FibGVcclxuICAgIGlmICggXy5zb21lKCB0aGlzLm5vZGVzLCBub2RlID0+IG5vZGUuX2lucHV0TGlzdGVuZXJzLmxlbmd0aCA+IDAgfHwgbm9kZS5waWNrYWJsZVByb3BlcnR5LnZhbHVlID09PSB0cnVlICkgKSB7IHJldHVybiB0cnVlOyB9XHJcblxyXG4gICAgLy8gbm8gbGlzdGVuZXJzIG9yIHBpY2thYmxlOiB0cnVlLCBzbyBpdCB3aWxsIGJlIHBydW5lZFxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCggaW5kZXg6IG51bWJlciApOiBOb2RlIHtcclxuICAgIGlmICggaW5kZXggPj0gMCApIHtcclxuICAgICAgcmV0dXJuIHRoaXMubm9kZXNbIGluZGV4IF07XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgLy8gbmVnYXRpdmUgaW5kZXggZ29lcyBmcm9tIHRoZSBlbmQgb2YgdGhlIGFycmF5XHJcbiAgICAgIHJldHVybiB0aGlzLm5vZGVzWyB0aGlzLm5vZGVzLmxlbmd0aCArIGluZGV4IF07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2xpY2UoIHN0YXJ0SW5kZXg6IG51bWJlciwgZW5kSW5kZXg/OiBudW1iZXIgKTogVHJhaWwge1xyXG4gICAgcmV0dXJuIG5ldyBUcmFpbCggdGhpcy5ub2Rlcy5zbGljZSggc3RhcnRJbmRleCwgZW5kSW5kZXggKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVE9ETzogY29uc2lkZXIgcmVuYW1pbmcgdG8gc3VidHJhaWxUb0V4Y2x1ZGluZyBhbmQgc3VidHJhaWxUb0luY2x1ZGluZz8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgKi9cclxuICBwdWJsaWMgc3VidHJhaWxUbyggbm9kZTogTm9kZSwgZXhjbHVkZU5vZGUgPSBmYWxzZSApOiBUcmFpbCB7XHJcbiAgICByZXR1cm4gdGhpcy5zbGljZSggMCwgXy5pbmRleE9mKCB0aGlzLm5vZGVzLCBub2RlICkgKyAoIGV4Y2x1ZGVOb2RlID8gMCA6IDEgKSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGlzRW1wdHkoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5ub2Rlcy5sZW5ndGggPT09IDA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBtYXRyaXggbXVsdGlwbGljYXRpb24gb2Ygb3VyIHNlbGVjdGVkIG5vZGVzIHRyYW5zZm9ybWF0aW9uIG1hdHJpY2VzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHN0YXJ0aW5nSW5kZXggLSBJbmNsdWRlIG5vZGVzIG1hdHJpY2VzIHN0YXJ0aW5nIGZyb20gdGhpcyBpbmRleCAoaW5jbHVzaXZlKVxyXG4gICAqIEBwYXJhbSBlbmRpbmdJbmRleCAtIEluY2x1ZGUgbm9kZXMgbWF0cmljZXMgdXAgdG8gdGhpcyBpbmRleCAoZXhjbHVzaXZlKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRNYXRyaXhDb25jYXRlbmF0aW9uKCBzdGFydGluZ0luZGV4OiBudW1iZXIsIGVuZGluZ0luZGV4OiBudW1iZXIgKTogTWF0cml4MyB7XHJcbiAgICAvLyBUT0RPOiBwZXJmb3JtYW5jZTogY2FuIHdlIGNhY2hlIHRoaXMgZXZlcj8gd291bGQgbmVlZCB0aGUgcm9vdE5vZGUgdG8gbm90IHJlYWxseSBjaGFuZ2UgaW4gYmV0d2VlbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgLy8gdGhpcyBtYXRyaXggd2lsbCBiZSBtb2RpZmllZCBpbiBwbGFjZSwgc28gYWx3YXlzIHN0YXJ0IGZyZXNoXHJcbiAgICBjb25zdCBtYXRyaXggPSBNYXRyaXgzLmlkZW50aXR5KCk7XHJcblxyXG4gICAgLy8gZnJvbSB0aGUgcm9vdCB1cFxyXG4gICAgY29uc3Qgbm9kZXMgPSB0aGlzLm5vZGVzO1xyXG4gICAgZm9yICggbGV0IGkgPSBzdGFydGluZ0luZGV4OyBpIDwgZW5kaW5nSW5kZXg7IGkrKyApIHtcclxuICAgICAgbWF0cml4Lm11bHRpcGx5TWF0cml4KCBub2Rlc1sgaSBdLmdldE1hdHJpeCgpICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbWF0cml4O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRnJvbSBsb2NhbCB0byBnbG9iYWxcclxuICAgKlxyXG4gICAqIGUuZy4gbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSBvZiB0aGUgbGVhZiBub2RlIHRvIHRoZSBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZSBvZiB0aGUgcm9vdCBub2RlXHJcbiAgICovXHJcbiAgcHVibGljIGdldE1hdHJpeCgpOiBNYXRyaXgzIHtcclxuICAgIHJldHVybiB0aGlzLmdldE1hdHJpeENvbmNhdGVuYXRpb24oIDAsIHRoaXMubm9kZXMubGVuZ3RoICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGcm9tIGxvY2FsIHRvIG5leHQtdG8tZ2xvYmFsIChpZ25vcmVzIHJvb3Qgbm9kZSBtYXRyaXgpXHJcbiAgICpcclxuICAgKiBlLmcuIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUgb2YgdGhlIGxlYWYgbm9kZSB0byB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSBvZiB0aGUgcm9vdCBub2RlXHJcbiAgICovXHJcbiAgcHVibGljIGdldEFuY2VzdG9yTWF0cml4KCk6IE1hdHJpeDMge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TWF0cml4Q29uY2F0ZW5hdGlvbiggMSwgdGhpcy5ub2Rlcy5sZW5ndGggKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZyb20gcGFyZW50IHRvIGdsb2JhbFxyXG4gICAqXHJcbiAgICogZS5nLiBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZSBvZiB0aGUgbGVhZiBub2RlIHRvIHRoZSBwYXJlbnQgY29vcmRpbmF0ZSBmcmFtZSBvZiB0aGUgcm9vdCBub2RlXHJcbiAgICovXHJcbiAgcHVibGljIGdldFBhcmVudE1hdHJpeCgpOiBNYXRyaXgzIHtcclxuICAgIHJldHVybiB0aGlzLmdldE1hdHJpeENvbmNhdGVuYXRpb24oIDAsIHRoaXMubm9kZXMubGVuZ3RoIC0gMSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRnJvbSBwYXJlbnQgdG8gbmV4dC10by1nbG9iYWwgKGlnbm9yZXMgcm9vdCBub2RlIG1hdHJpeClcclxuICAgKlxyXG4gICAqIGUuZy4gcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUgb2YgdGhlIGxlYWYgbm9kZSB0byB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSBvZiB0aGUgcm9vdCBub2RlXHJcbiAgICovXHJcbiAgcHVibGljIGdldEFuY2VzdG9yUGFyZW50TWF0cml4KCk6IE1hdHJpeDMge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TWF0cml4Q29uY2F0ZW5hdGlvbiggMSwgdGhpcy5ub2Rlcy5sZW5ndGggLSAxICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGcm9tIGxvY2FsIHRvIGdsb2JhbFxyXG4gICAqXHJcbiAgICogZS5nLiBsb2NhbCBjb29yZGluYXRlIGZyYW1lIG9mIHRoZSBsZWFmIG5vZGUgdG8gdGhlIHBhcmVudCBjb29yZGluYXRlIGZyYW1lIG9mIHRoZSByb290IG5vZGVcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0VHJhbnNmb3JtKCk6IFRyYW5zZm9ybTMge1xyXG4gICAgcmV0dXJuIG5ldyBUcmFuc2Zvcm0zKCB0aGlzLmdldE1hdHJpeCgpICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGcm9tIHBhcmVudCB0byBnbG9iYWxcclxuICAgKlxyXG4gICAqIGUuZy4gcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUgb2YgdGhlIGxlYWYgbm9kZSB0byB0aGUgcGFyZW50IGNvb3JkaW5hdGUgZnJhbWUgb2YgdGhlIHJvb3Qgbm9kZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRQYXJlbnRUcmFuc2Zvcm0oKTogVHJhbnNmb3JtMyB7XHJcbiAgICByZXR1cm4gbmV3IFRyYW5zZm9ybTMoIHRoaXMuZ2V0UGFyZW50TWF0cml4KCkgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhZGRBbmNlc3Rvciggbm9kZTogTm9kZSwgaW5kZXg/OiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5pbW11dGFibGUsICdjYW5ub3QgbW9kaWZ5IGFuIGltbXV0YWJsZSBUcmFpbCB3aXRoIGFkZEFuY2VzdG9yJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbm9kZSwgJ2Nhbm5vdCBhZGQgZmFsc3kgdmFsdWUgdG8gYSBUcmFpbCcgKTtcclxuXHJcblxyXG4gICAgaWYgKCB0aGlzLm5vZGVzLmxlbmd0aCApIHtcclxuICAgICAgY29uc3Qgb2xkUm9vdCA9IHRoaXMubm9kZXNbIDAgXTtcclxuICAgICAgdGhpcy5pbmRpY2VzLnVuc2hpZnQoIGluZGV4ID09PSB1bmRlZmluZWQgPyBfLmluZGV4T2YoIG5vZGUuX2NoaWxkcmVuLCBvbGRSb290ICkgOiBpbmRleCApO1xyXG4gICAgfVxyXG4gICAgdGhpcy5ub2Rlcy51bnNoaWZ0KCBub2RlICk7XHJcblxyXG4gICAgdGhpcy5sZW5ndGgrKztcclxuICAgIC8vIGFjY2VsZXJhdGVkIHZlcnNpb24gb2YgdGhpcy51cGRhdGVVbmlxdWVJZCgpXHJcbiAgICB0aGlzLnVuaXF1ZUlkID0gKCB0aGlzLnVuaXF1ZUlkID8gbm9kZS5pZCArIElEX1NFUEFSQVRPUiArIHRoaXMudW5pcXVlSWQgOiBgJHtub2RlLmlkfWAgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyByZW1vdmVBbmNlc3RvcigpOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLmltbXV0YWJsZSwgJ2Nhbm5vdCBtb2RpZnkgYW4gaW1tdXRhYmxlIFRyYWlsIHdpdGggcmVtb3ZlQW5jZXN0b3InICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmxlbmd0aCA+IDAsICdjYW5ub3QgcmVtb3ZlIGEgTm9kZSBmcm9tIGFuIGVtcHR5IHRyYWlsJyApO1xyXG5cclxuICAgIHRoaXMubm9kZXMuc2hpZnQoKTtcclxuICAgIGlmICggdGhpcy5pbmRpY2VzLmxlbmd0aCApIHtcclxuICAgICAgdGhpcy5pbmRpY2VzLnNoaWZ0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5sZW5ndGgtLTtcclxuICAgIHRoaXMudXBkYXRlVW5pcXVlSWQoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhZGREZXNjZW5kYW50KCBub2RlOiBOb2RlLCBpbmRleD86IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLmltbXV0YWJsZSwgJ2Nhbm5vdCBtb2RpZnkgYW4gaW1tdXRhYmxlIFRyYWlsIHdpdGggYWRkRGVzY2VuZGFudCcgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG5vZGUsICdjYW5ub3QgYWRkIGZhbHN5IHZhbHVlIHRvIGEgVHJhaWwnICk7XHJcblxyXG5cclxuICAgIGlmICggdGhpcy5ub2Rlcy5sZW5ndGggKSB7XHJcbiAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMubGFzdE5vZGUoKTtcclxuICAgICAgdGhpcy5pbmRpY2VzLnB1c2goIGluZGV4ID09PSB1bmRlZmluZWQgPyBfLmluZGV4T2YoIHBhcmVudC5fY2hpbGRyZW4sIG5vZGUgKSA6IGluZGV4ICk7XHJcbiAgICB9XHJcbiAgICB0aGlzLm5vZGVzLnB1c2goIG5vZGUgKTtcclxuXHJcbiAgICB0aGlzLmxlbmd0aCsrO1xyXG4gICAgLy8gYWNjZWxlcmF0ZWQgdmVyc2lvbiBvZiB0aGlzLnVwZGF0ZVVuaXF1ZUlkKClcclxuICAgIHRoaXMudW5pcXVlSWQgPSAoIHRoaXMudW5pcXVlSWQgPyB0aGlzLnVuaXF1ZUlkICsgSURfU0VQQVJBVE9SICsgbm9kZS5pZCA6IGAke25vZGUuaWR9YCApO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHJlbW92ZURlc2NlbmRhbnQoKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5pbW11dGFibGUsICdjYW5ub3QgbW9kaWZ5IGFuIGltbXV0YWJsZSBUcmFpbCB3aXRoIHJlbW92ZURlc2NlbmRhbnQnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmxlbmd0aCA+IDAsICdjYW5ub3QgcmVtb3ZlIGEgTm9kZSBmcm9tIGFuIGVtcHR5IHRyYWlsJyApO1xyXG5cclxuICAgIHRoaXMubm9kZXMucG9wKCk7XHJcbiAgICBpZiAoIHRoaXMuaW5kaWNlcy5sZW5ndGggKSB7XHJcbiAgICAgIHRoaXMuaW5kaWNlcy5wb3AoKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmxlbmd0aC0tO1xyXG4gICAgdGhpcy51cGRhdGVVbmlxdWVJZCgpO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFkZERlc2NlbmRhbnRUcmFpbCggdHJhaWw6IFRyYWlsICk6IHZvaWQge1xyXG4gICAgY29uc3QgbGVuZ3RoID0gdHJhaWwubGVuZ3RoO1xyXG4gICAgaWYgKCBsZW5ndGggKSB7XHJcbiAgICAgIHRoaXMuYWRkRGVzY2VuZGFudCggdHJhaWwubm9kZXNbIDAgXSApO1xyXG4gICAgfVxyXG4gICAgZm9yICggbGV0IGkgPSAxOyBpIDwgbGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIHRoaXMuYWRkRGVzY2VuZGFudCggdHJhaWwubm9kZXNbIGkgXSwgdGhpcy5pbmRpY2VzWyBpIC0gMSBdICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVtb3ZlRGVzY2VuZGFudFRyYWlsKCB0cmFpbDogVHJhaWwgKTogdm9pZCB7XHJcbiAgICBjb25zdCBsZW5ndGggPSB0cmFpbC5sZW5ndGg7XHJcbiAgICBmb3IgKCBsZXQgaSA9IGxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmxhc3ROb2RlKCkgPT09IHRyYWlsLm5vZGVzWyBpIF0gKTtcclxuXHJcbiAgICAgIHRoaXMucmVtb3ZlRGVzY2VuZGFudCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVmcmVzaGVzIHRoZSBpbnRlcm5hbCBpbmRleCByZWZlcmVuY2VzIChpbXBvcnRhbnQgaWYgYW55IGNoaWxkcmVuIGFycmF5cyB3ZXJlIG1vZGlmaWVkISlcclxuICAgKi9cclxuICBwdWJsaWMgcmVpbmRleCgpOiB2b2lkIHtcclxuICAgIGNvbnN0IGxlbmd0aCA9IHRoaXMubGVuZ3RoO1xyXG4gICAgZm9yICggbGV0IGkgPSAxOyBpIDwgbGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIC8vIG9ubHkgcmVwbGFjZSBpbmRpY2VzIHdoZXJlIHRoZXkgaGF2ZSBjaGFuZ2VkICh0aGlzIHdhcyBhIHBlcmZvcm1hbmNlIGhvdHNwb3QpXHJcbiAgICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IHRoaXMuaW5kaWNlc1sgaSAtIDEgXTtcclxuICAgICAgY29uc3QgYmFzZU5vZGUgPSB0aGlzLm5vZGVzWyBpIC0gMSBdO1xyXG5cclxuICAgICAgaWYgKCBiYXNlTm9kZS5fY2hpbGRyZW5bIGN1cnJlbnRJbmRleCBdICE9PSB0aGlzLm5vZGVzWyBpIF0gKSB7XHJcbiAgICAgICAgdGhpcy5pbmRpY2VzWyBpIC0gMSBdID0gXy5pbmRleE9mKCBiYXNlTm9kZS5fY2hpbGRyZW4sIHRoaXMubm9kZXNbIGkgXSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0SW1tdXRhYmxlKCk6IHRoaXMge1xyXG4gICAgLy8gaWYgYXNzZXJ0aW9ucyBhcmUgZGlzYWJsZWQsIHdlIGhvcGUgdGhpcyBpcyBpbmxpbmVkIGFzIGEgbm8tb3BcclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICBhc3NlcnQoIHRoaXMuaW1tdXRhYmxlICE9PSBmYWxzZSwgJ0EgdHJhaWwgY2Fubm90IGJlIG1hZGUgaW1tdXRhYmxlIGFmdGVyIGJlaW5nIGZsYWdnZWQgYXMgbXV0YWJsZScgKTtcclxuICAgICAgdGhpcy5pbW11dGFibGUgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFRPRE86IGNvbnNpZGVyIHNldHRpbmcgbXV0YXRvcnMgdG8gbnVsbCBoZXJlIGluc3RlYWQgb2YgdGhlIGZ1bmN0aW9uIGNhbGwgY2hlY2sgKGZvciBwZXJmb3JtYW5jZSwgYW5kIHByb2ZpbGUgdGhlIGRpZmZlcmVuY2VzKSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG5cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldE11dGFibGUoKTogdGhpcyB7XHJcbiAgICAvLyBpZiBhc3NlcnRpb25zIGFyZSBkaXNhYmxlZCwgd2UgaG9wZSB0aGlzIGlzIGlubGluZWQgYXMgYSBuby1vcFxyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgIGFzc2VydCggdGhpcy5pbW11dGFibGUgIT09IHRydWUsICdBIHRyYWlsIGNhbm5vdCBiZSBtYWRlIG11dGFibGUgYWZ0ZXIgYmVpbmcgZmxhZ2dlZCBhcyBpbW11dGFibGUnICk7XHJcbiAgICAgIHRoaXMuaW1tdXRhYmxlID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXJlSW5kaWNlc1ZhbGlkKCk6IGJvb2xlYW4ge1xyXG4gICAgZm9yICggbGV0IGkgPSAxOyBpIDwgdGhpcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgY3VycmVudEluZGV4ID0gdGhpcy5pbmRpY2VzWyBpIC0gMSBdO1xyXG4gICAgICBpZiAoIHRoaXMubm9kZXNbIGkgLSAxIF0uX2NoaWxkcmVuWyBjdXJyZW50SW5kZXggXSAhPT0gdGhpcy5ub2Rlc1sgaSBdICkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZXF1YWxzKCBvdGhlcjogVHJhaWwgKTogYm9vbGVhbiB7XHJcbiAgICBpZiAoIHRoaXMubGVuZ3RoICE9PSBvdGhlci5sZW5ndGggKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLm5vZGVzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBpZiAoIHRoaXMubm9kZXNbIGkgXSAhPT0gb3RoZXIubm9kZXNbIGkgXSApIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBuZXcgVHJhaWwgZnJvbSB0aGUgcm9vdCB1cCB0byB0aGUgcGFyYW1ldGVyIG5vZGUuXHJcbiAgICovXHJcbiAgcHVibGljIHVwVG9Ob2RlKCBub2RlOiBOb2RlICk6IFRyYWlsIHtcclxuICAgIGNvbnN0IG5vZGVJbmRleCA9IF8uaW5kZXhPZiggdGhpcy5ub2Rlcywgbm9kZSApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbm9kZUluZGV4ID49IDAsICdUcmFpbCBkb2VzIG5vdCBjb250YWluIHRoZSBub2RlJyApO1xyXG4gICAgcmV0dXJuIHRoaXMuc2xpY2UoIDAsIF8uaW5kZXhPZiggdGhpcy5ub2Rlcywgbm9kZSApICsgMSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV2hldGhlciB0aGlzIHRyYWlsIGNvbnRhaW5zIHRoZSBjb21wbGV0ZSAnb3RoZXInIHRyYWlsLCBidXQgd2l0aCBhZGRlZCBkZXNjZW5kYW50cyBhZnRlcndhcmRzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIG90aGVyIC0gaXMgb3RoZXIgYSBzdWJzZXQgb2YgdGhpcyB0cmFpbD9cclxuICAgKiBAcGFyYW0gYWxsb3dTYW1lVHJhaWxcclxuICAgKi9cclxuICBwdWJsaWMgaXNFeHRlbnNpb25PZiggb3RoZXI6IFRyYWlsLCBhbGxvd1NhbWVUcmFpbD86IGJvb2xlYW4gKTogYm9vbGVhbiB7XHJcbiAgICBpZiAoIHRoaXMubGVuZ3RoIDw9IG90aGVyLmxlbmd0aCAtICggYWxsb3dTYW1lVHJhaWwgPyAxIDogMCApICkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgb3RoZXIubm9kZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGlmICggdGhpcy5ub2Rlc1sgaSBdICE9PSBvdGhlci5ub2Rlc1sgaSBdICkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIGEgZ2l2ZW4gbm9kZSBpcyBjb250YWluZWQgaW4gdGhlIHRyYWlsLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb250YWluc05vZGUoIG5vZGU6IE5vZGUgKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gXy5pbmNsdWRlcyggdGhpcy5ub2Rlcywgbm9kZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSB0cmFuc2Zvcm0gZnJvbSBvdXIgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSB0byB0aGUgb3RoZXIgdHJhaWwncyBsb2NhbCBjb29yZGluYXRlIGZyYW1lXHJcbiAgICovXHJcbiAgcHVibGljIGdldFRyYW5zZm9ybVRvKCBvdGhlclRyYWlsOiBUcmFpbCApOiBUcmFuc2Zvcm0zIHtcclxuICAgIHJldHVybiBuZXcgVHJhbnNmb3JtMyggdGhpcy5nZXRNYXRyaXhUbyggb3RoZXJUcmFpbCApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgbWF0cml4IHRoYXQgdHJhbnNmb3JtcyBhIHBvaW50IGluIG91ciBsYXN0IG5vZGUncyBsb2NhbCBjb29yZGluYXRlIGZyYW1lIHRvIHRoZSBvdGhlciB0cmFpbCdzIGxhc3Qgbm9kZSdzXHJcbiAgICogbG9jYWwgY29vcmRpbmF0ZSBmcmFtZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRNYXRyaXhUbyggb3RoZXJUcmFpbDogVHJhaWwgKTogTWF0cml4MyB7XHJcbiAgICB0aGlzLnJlaW5kZXgoKTtcclxuICAgIG90aGVyVHJhaWwucmVpbmRleCgpO1xyXG5cclxuICAgIGNvbnN0IGJyYW5jaEluZGV4ID0gdGhpcy5nZXRCcmFuY2hJbmRleFRvKCBvdGhlclRyYWlsICk7XHJcbiAgICBsZXQgaWR4O1xyXG5cclxuICAgIGxldCBtYXRyaXggPSBNYXRyaXgzLklERU5USVRZO1xyXG5cclxuICAgIC8vIHdhbGsgb3VyIHRyYW5zZm9ybSBkb3duLCBwcmVwZW5kaW5nXHJcbiAgICBmb3IgKCBpZHggPSB0aGlzLmxlbmd0aCAtIDE7IGlkeCA+PSBicmFuY2hJbmRleDsgaWR4LS0gKSB7XHJcbiAgICAgIG1hdHJpeCA9IHRoaXMubm9kZXNbIGlkeCBdLmdldE1hdHJpeCgpLnRpbWVzTWF0cml4KCBtYXRyaXggKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyB3YWxrIG91ciB0cmFuc2Zvcm0gdXAsIHByZXBlbmRpbmcgaW52ZXJzZXNcclxuICAgIGZvciAoIGlkeCA9IGJyYW5jaEluZGV4OyBpZHggPCBvdGhlclRyYWlsLmxlbmd0aDsgaWR4KysgKSB7XHJcbiAgICAgIG1hdHJpeCA9IG90aGVyVHJhaWwubm9kZXNbIGlkeCBdLmdldFRyYW5zZm9ybSgpLmdldEludmVyc2UoKS50aW1lc01hdHJpeCggbWF0cml4ICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG1hdHJpeDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGZpcnN0IGluZGV4IHRoYXQgaXMgZGlmZmVyZW50IGJldHdlZW4gdGhpcyB0cmFpbCBhbmQgdGhlIG90aGVyIHRyYWlsLlxyXG4gICAqXHJcbiAgICogSWYgdGhlIHRyYWlscyBhcmUgaWRlbnRpY2FsLCB0aGUgaW5kZXggc2hvdWxkIGJlIGVxdWFsIHRvIHRoZSB0cmFpbCdzIGxlbmd0aC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0QnJhbmNoSW5kZXhUbyggb3RoZXJUcmFpbDogVHJhaWwgKTogbnVtYmVyIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMubm9kZXNbIDAgXSA9PT0gb3RoZXJUcmFpbC5ub2Rlc1sgMCBdLCAnVG8gZ2V0IGEgYnJhbmNoIGluZGV4LCB0aGUgdHJhaWxzIG11c3QgaGF2ZSB0aGUgc2FtZSByb290JyApO1xyXG5cclxuICAgIGxldCBicmFuY2hJbmRleDtcclxuXHJcbiAgICBjb25zdCBtaW4gPSBNYXRoLm1pbiggdGhpcy5sZW5ndGgsIG90aGVyVHJhaWwubGVuZ3RoICk7XHJcbiAgICBmb3IgKCBicmFuY2hJbmRleCA9IDA7IGJyYW5jaEluZGV4IDwgbWluOyBicmFuY2hJbmRleCsrICkge1xyXG4gICAgICBpZiAoIHRoaXMubm9kZXNbIGJyYW5jaEluZGV4IF0gIT09IG90aGVyVHJhaWwubm9kZXNbIGJyYW5jaEluZGV4IF0gKSB7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYnJhbmNoSW5kZXg7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBsYXN0IChsYXJnZXN0KSBpbmRleCBpbnRvIHRoZSB0cmFpbCdzIG5vZGVzIHRoYXQgaGFzIGlucHV0RW5hYmxlZD10cnVlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMYXN0SW5wdXRFbmFibGVkSW5kZXgoKTogbnVtYmVyIHtcclxuICAgIC8vIERldGVybWluZSBob3cgZmFyIHVwIHRoZSBUcmFpbCBpbnB1dCBpcyBkZXRlcm1pbmVkLiBUaGUgZmlyc3Qgbm9kZSB3aXRoICFpbnB1dEVuYWJsZWQgYW5kIGFmdGVyIHdpbGwgbm90IGhhdmVcclxuICAgIC8vIGV2ZW50cyBmaXJlZCAoc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zdW4vaXNzdWVzLzI1NylcclxuICAgIGxldCB0cmFpbFN0YXJ0SW5kZXggPSAtMTtcclxuICAgIGZvciAoIGxldCBqID0gMDsgaiA8IHRoaXMubGVuZ3RoOyBqKysgKSB7XHJcbiAgICAgIGlmICggIXRoaXMubm9kZXNbIGogXS5pbnB1dEVuYWJsZWQgKSB7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRyYWlsU3RhcnRJbmRleCA9IGo7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRyYWlsU3RhcnRJbmRleDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGxlYWYtbW9zdCBpbmRleCwgdW5sZXNzIHRoZXJlIGlzIGEgTm9kZSB3aXRoIGlucHV0RW5hYmxlZD1mYWxzZSAoaW4gd2hpY2ggY2FzZSwgdGhlIGxvd2VzdCBpbmRleFxyXG4gICAqIGZvciB0aG9zZSBtYXRjaGluZyBOb2RlcyBhcmUgcmV0dXJuZWQpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDdXJzb3JDaGVja0luZGV4KCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMYXN0SW5wdXRFbmFibGVkSW5kZXgoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRPRE86IHBoYXNlIG91dCBpbiBmYXZvciBvZiBnZXQoKSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAqL1xyXG4gIHB1YmxpYyBub2RlRnJvbVRvcCggb2Zmc2V0OiBudW1iZXIgKTogTm9kZSB7XHJcbiAgICByZXR1cm4gdGhpcy5ub2Rlc1sgdGhpcy5sZW5ndGggLSAxIC0gb2Zmc2V0IF07XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgbGFzdE5vZGUoKTogTm9kZSB7XHJcbiAgICByZXR1cm4gdGhpcy5ub2RlRnJvbVRvcCggMCApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHJvb3ROb2RlKCk6IE5vZGUge1xyXG4gICAgcmV0dXJuIHRoaXMubm9kZXNbIDAgXTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHByZXZpb3VzIGdyYXBoIHRyYWlsIGluIHRoZSBvcmRlciBvZiBzZWxmLXJlbmRlcmluZ1xyXG4gICAqL1xyXG4gIHB1YmxpYyBwcmV2aW91cygpOiBUcmFpbCB8IG51bGwge1xyXG4gICAgaWYgKCB0aGlzLm5vZGVzLmxlbmd0aCA8PSAxICkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0b3AgPSB0aGlzLm5vZGVGcm9tVG9wKCAwICk7XHJcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLm5vZGVGcm9tVG9wKCAxICk7XHJcblxyXG4gICAgY29uc3QgcGFyZW50SW5kZXggPSBfLmluZGV4T2YoIHBhcmVudC5fY2hpbGRyZW4sIHRvcCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcGFyZW50SW5kZXggIT09IC0xICk7XHJcbiAgICBjb25zdCBhcnIgPSB0aGlzLm5vZGVzLnNsaWNlKCAwLCB0aGlzLm5vZGVzLmxlbmd0aCAtIDEgKTtcclxuICAgIGlmICggcGFyZW50SW5kZXggPT09IDAgKSB7XHJcbiAgICAgIC8vIHdlIHdlcmUgdGhlIGZpcnN0IGNoaWxkLCBzbyBnaXZlIGl0IHRoZSB0cmFpbCB0byB0aGUgcGFyZW50XHJcbiAgICAgIHJldHVybiBuZXcgVHJhaWwoIGFyciApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIHByZXZpb3VzIGNoaWxkXHJcbiAgICAgIGFyci5wdXNoKCBwYXJlbnQuX2NoaWxkcmVuWyBwYXJlbnRJbmRleCAtIDEgXSApO1xyXG5cclxuICAgICAgLy8gYW5kIGZpbmQgaXRzIGxhc3QgdGVybWluYWxcclxuICAgICAgd2hpbGUgKCBhcnJbIGFyci5sZW5ndGggLSAxIF0uX2NoaWxkcmVuLmxlbmd0aCAhPT0gMCApIHtcclxuICAgICAgICBjb25zdCBsYXN0ID0gYXJyWyBhcnIubGVuZ3RoIC0gMSBdO1xyXG4gICAgICAgIGFyci5wdXNoKCBsYXN0Ll9jaGlsZHJlblsgbGFzdC5fY2hpbGRyZW4ubGVuZ3RoIC0gMSBdICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBuZXcgVHJhaWwoIGFyciApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTGlrZSBwcmV2aW91cygpLCBidXQga2VlcHMgbW92aW5nIGJhY2sgdW50aWwgdGhlIHRyYWlsIGdvZXMgdG8gYSBub2RlIHdpdGggaXNQYWludGVkKCkgPT09IHRydWVcclxuICAgKi9cclxuICBwdWJsaWMgcHJldmlvdXNQYWludGVkKCk6IFRyYWlsIHwgbnVsbCB7XHJcbiAgICBsZXQgcmVzdWx0ID0gdGhpcy5wcmV2aW91cygpO1xyXG4gICAgd2hpbGUgKCByZXN1bHQgJiYgIXJlc3VsdC5pc1BhaW50ZWQoKSApIHtcclxuICAgICAgcmVzdWx0ID0gcmVzdWx0LnByZXZpb3VzKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW4gdGhlIG9yZGVyIG9mIHNlbGYtcmVuZGVyaW5nXHJcbiAgICovXHJcbiAgcHVibGljIG5leHQoKTogVHJhaWwgfCBudWxsIHtcclxuICAgIGNvbnN0IGFyciA9IHRoaXMubm9kZXMuc2xpY2UoIDAgKTtcclxuXHJcbiAgICBjb25zdCB0b3AgPSB0aGlzLm5vZGVGcm9tVG9wKCAwICk7XHJcbiAgICBpZiAoIHRvcC5fY2hpbGRyZW4ubGVuZ3RoID4gMCApIHtcclxuICAgICAgLy8gaWYgd2UgaGF2ZSBjaGlsZHJlbiwgcmV0dXJuIHRoZSBmaXJzdCBjaGlsZFxyXG4gICAgICBhcnIucHVzaCggdG9wLl9jaGlsZHJlblsgMCBdICk7XHJcbiAgICAgIHJldHVybiBuZXcgVHJhaWwoIGFyciApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIHdhbGsgZG93biBhbmQgYXR0ZW1wdCB0byBmaW5kIHRoZSBuZXh0IHBhcmVudFxyXG4gICAgICBsZXQgZGVwdGggPSB0aGlzLm5vZGVzLmxlbmd0aCAtIDE7XHJcblxyXG4gICAgICB3aGlsZSAoIGRlcHRoID4gMCApIHtcclxuICAgICAgICBjb25zdCBub2RlID0gdGhpcy5ub2Rlc1sgZGVwdGggXTtcclxuICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLm5vZGVzWyBkZXB0aCAtIDEgXTtcclxuXHJcbiAgICAgICAgYXJyLnBvcCgpOyAvLyB0YWtlIG9mZiB0aGUgbm9kZSBzbyB3ZSBjYW4gYWRkIHRoZSBuZXh0IHNpYmxpbmcgaWYgaXQgZXhpc3RzXHJcblxyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gXy5pbmRleE9mKCBwYXJlbnQuX2NoaWxkcmVuLCBub2RlICk7XHJcbiAgICAgICAgaWYgKCBpbmRleCAhPT0gcGFyZW50Ll9jaGlsZHJlbi5sZW5ndGggLSAxICkge1xyXG4gICAgICAgICAgLy8gdGhlcmUgaXMgYW5vdGhlciAobGF0ZXIpIHNpYmxpbmcuIHVzZSB0aGF0IVxyXG4gICAgICAgICAgYXJyLnB1c2goIHBhcmVudC5fY2hpbGRyZW5bIGluZGV4ICsgMSBdICk7XHJcbiAgICAgICAgICByZXR1cm4gbmV3IFRyYWlsKCBhcnIgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBkZXB0aC0tO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gaWYgd2UgZGlkbid0IHJlYWNoIGEgbGF0ZXIgc2libGluZyBieSBub3csIGl0IGRvZXNuJ3QgZXhpc3RcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBMaWtlIG5leHQoKSwgYnV0IGtlZXBzIG1vdmluZyBiYWNrIHVudGlsIHRoZSB0cmFpbCBnb2VzIHRvIGEgbm9kZSB3aXRoIGlzUGFpbnRlZCgpID09PSB0cnVlXHJcbiAgICovXHJcbiAgcHVibGljIG5leHRQYWludGVkKCk6IFRyYWlsIHwgbnVsbCB7XHJcbiAgICBsZXQgcmVzdWx0ID0gdGhpcy5uZXh0KCk7XHJcbiAgICB3aGlsZSAoIHJlc3VsdCAmJiAhcmVzdWx0LmlzUGFpbnRlZCgpICkge1xyXG4gICAgICByZXN1bHQgPSByZXN1bHQubmV4dCgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIGNhbGxiYWNrKCB0cmFpbCApIGZvciB0aGlzIHRyYWlsLCBhbmQgZWFjaCBkZXNjZW5kYW50IHRyYWlsLiBJZiBjYWxsYmFjayByZXR1cm5zIHRydWUsIHN1YnRyZWUgd2lsbCBiZSBza2lwcGVkXHJcbiAgICovXHJcbiAgcHVibGljIGVhY2hUcmFpbFVuZGVyKCBjYWxsYmFjazogVHJhaWxDYWxsYmFjayApOiB2b2lkIHtcclxuICAgIC8vIFRPRE86IHBlcmZvcm1hbmNlOiBzaG91bGQgYmUgb3B0aW1pemVkIHRvIGJlIG11Y2ggZmFzdGVyLCBzaW5jZSB3ZSBkb24ndCBoYXZlIHRvIGRlYWwgd2l0aCB0aGUgYmVmb3JlL2FmdGVyIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICBuZXcgVHJhaWxQb2ludGVyKCB0aGlzLCB0cnVlICkuZWFjaFRyYWlsQmV0d2VlbiggbmV3IFRyYWlsUG9pbnRlciggdGhpcywgZmFsc2UgKSwgY2FsbGJhY2sgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN0YW5kYXJkIEphdmEtc3R5bGUgY29tcGFyZS4gLTEgbWVhbnMgdGhpcyB0cmFpbCBpcyBiZWZvcmUgKHVuZGVyKSB0aGUgb3RoZXIgdHJhaWwsIDAgbWVhbnMgZXF1YWwsIGFuZCAxIG1lYW5zIHRoaXMgdHJhaWwgaXNcclxuICAgKiBhZnRlciAob24gdG9wIG9mKSB0aGUgb3RoZXIgdHJhaWwuXHJcbiAgICogQSBzaG9ydGVyIHN1YnRyYWlsIHdpbGwgY29tcGFyZSBhcyAtMS5cclxuICAgKlxyXG4gICAqIEFzc3VtZXMgdGhhdCB0aGUgVHJhaWxzIGFyZSBwcm9wZXJseSBpbmRleGVkLiBJZiBub3QsIHBsZWFzZSByZWluZGV4IHRoZW0hXHJcbiAgICpcclxuICAgKiBDb21wYXJpc29uIGlzIGZvciB0aGUgcmVuZGVyaW5nIG9yZGVyLCBzbyBhbiBhbmNlc3RvciBpcyAnYmVmb3JlJyBhIGRlc2NlbmRhbnRcclxuICAgKi9cclxuICBwdWJsaWMgY29tcGFyZSggb3RoZXI6IFRyYWlsICk6IG51bWJlciB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5pc0VtcHR5KCksICdjYW5ub3QgY29tcGFyZSB3aXRoIGFuIGVtcHR5IHRyYWlsJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIW90aGVyLmlzRW1wdHkoKSwgJ2Nhbm5vdCBjb21wYXJlIHdpdGggYW4gZW1wdHkgdHJhaWwnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLm5vZGVzWyAwIF0gPT09IG90aGVyLm5vZGVzWyAwIF0sICdmb3IgVHJhaWwgY29tcGFyaXNvbiwgdHJhaWxzIG11c3QgaGF2ZSB0aGUgc2FtZSByb290IG5vZGUnICk7XHJcbiAgICBhc3NlcnRTbG93ICYmIGFzc2VydFNsb3coIHRoaXMuYXJlSW5kaWNlc1ZhbGlkKCksIGBUcmFpbC5jb21wYXJlIHRoaXMuYXJlSW5kaWNlc1ZhbGlkKCkgZmFpbGVkIG9uICR7dGhpcy50b1N0cmluZygpfWAgKTtcclxuICAgIGFzc2VydFNsb3cgJiYgYXNzZXJ0U2xvdyggb3RoZXIuYXJlSW5kaWNlc1ZhbGlkKCksIGBUcmFpbC5jb21wYXJlIG90aGVyLmFyZUluZGljZXNWYWxpZCgpIGZhaWxlZCBvbiAke290aGVyLnRvU3RyaW5nKCl9YCApO1xyXG5cclxuICAgIGNvbnN0IG1pbk5vZGVJbmRleCA9IE1hdGgubWluKCB0aGlzLm5vZGVzLmxlbmd0aCwgb3RoZXIubm9kZXMubGVuZ3RoICk7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBtaW5Ob2RlSW5kZXg7IGkrKyApIHtcclxuICAgICAgaWYgKCB0aGlzLm5vZGVzWyBpIF0gIT09IG90aGVyLm5vZGVzWyBpIF0gKSB7XHJcbiAgICAgICAgaWYgKCB0aGlzLm5vZGVzWyBpIC0gMSBdLmNoaWxkcmVuLmluZGV4T2YoIHRoaXMubm9kZXNbIGkgXSApIDwgb3RoZXIubm9kZXNbIGkgLSAxIF0uY2hpbGRyZW4uaW5kZXhPZiggb3RoZXIubm9kZXNbIGkgXSApICkge1xyXG4gICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHdlIHNjYW5uZWQgdGhyb3VnaCBhbmQgbm8gbm9kZXMgd2VyZSBkaWZmZXJlbnQgKG9uZSBpcyBhIHN1YnRyYWlsIG9mIHRoZSBvdGhlcilcclxuICAgIGlmICggdGhpcy5ub2Rlcy5sZW5ndGggPCBvdGhlci5ub2Rlcy5sZW5ndGggKSB7XHJcbiAgICAgIHJldHVybiAtMTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0aGlzLm5vZGVzLmxlbmd0aCA+IG90aGVyLm5vZGVzLmxlbmd0aCApIHtcclxuICAgICAgcmV0dXJuIDE7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIDA7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaXNCZWZvcmUoIG90aGVyOiBUcmFpbCApOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmNvbXBhcmUoIG90aGVyICkgPT09IC0xO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGlzQWZ0ZXIoIG90aGVyOiBUcmFpbCApOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmNvbXBhcmUoIG90aGVyICkgPT09IDE7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgbG9jYWxUb0dsb2JhbFBvaW50KCBwb2ludDogVmVjdG9yMiApOiBWZWN0b3IyIHtcclxuICAgIC8vIFRPRE86IHBlcmZvcm1hbmNlOiBtdWx0aXBsZSB0aW1lc1ZlY3RvcjIgY2FsbHMgdXAgdGhlIGNoYWluIGlzIHByb2JhYmx5IGZhc3RlciBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TWF0cml4KCkudGltZXNWZWN0b3IyKCBwb2ludCApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGxvY2FsVG9HbG9iYWxCb3VuZHMoIGJvdW5kczogQm91bmRzMiApOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiBib3VuZHMudHJhbnNmb3JtZWQoIHRoaXMuZ2V0TWF0cml4KCkgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnbG9iYWxUb0xvY2FsUG9pbnQoIHBvaW50OiBWZWN0b3IyICk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0VHJhbnNmb3JtKCkuaW52ZXJzZVBvc2l0aW9uMiggcG9pbnQgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnbG9iYWxUb0xvY2FsQm91bmRzKCBib3VuZHM6IEJvdW5kczIgKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRUcmFuc2Zvcm0oKS5pbnZlcnNlQm91bmRzMiggYm91bmRzICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcGFyZW50VG9HbG9iYWxQb2ludCggcG9pbnQ6IFZlY3RvcjIgKTogVmVjdG9yMiB7XHJcbiAgICAvLyBUT0RPOiBwZXJmb3JtYW5jZTogbXVsdGlwbGUgdGltZXNWZWN0b3IyIGNhbGxzIHVwIHRoZSBjaGFpbiBpcyBwcm9iYWJseSBmYXN0ZXIgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgIHJldHVybiB0aGlzLmdldFBhcmVudE1hdHJpeCgpLnRpbWVzVmVjdG9yMiggcG9pbnQgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBwYXJlbnRUb0dsb2JhbEJvdW5kcyggYm91bmRzOiBCb3VuZHMyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIGJvdW5kcy50cmFuc2Zvcm1lZCggdGhpcy5nZXRQYXJlbnRNYXRyaXgoKSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdsb2JhbFRvUGFyZW50UG9pbnQoIHBvaW50OiBWZWN0b3IyICk6IFZlY3RvcjIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0UGFyZW50VHJhbnNmb3JtKCkuaW52ZXJzZVBvc2l0aW9uMiggcG9pbnQgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnbG9iYWxUb1BhcmVudEJvdW5kcyggYm91bmRzOiBCb3VuZHMyICk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0UGFyZW50VHJhbnNmb3JtKCkuaW52ZXJzZUJvdW5kczIoIGJvdW5kcyApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSB1cGRhdGVVbmlxdWVJZCgpOiB2b2lkIHtcclxuICAgIC8vIHN0cmluZyBjb25jYXRlbmF0aW9uIGlzIGZhc3Rlciwgc2VlIGh0dHA6Ly9qc3BlcmYuY29tL3N0cmluZy1jb25jYXQtdnMtam9pbnNcclxuICAgIGxldCByZXN1bHQgPSAnJztcclxuICAgIGNvbnN0IGxlbiA9IHRoaXMubm9kZXMubGVuZ3RoO1xyXG4gICAgaWYgKCBsZW4gPiAwICkge1xyXG4gICAgICByZXN1bHQgKz0gdGhpcy5ub2Rlc1sgMCBdLl9pZDtcclxuICAgIH1cclxuICAgIGZvciAoIGxldCBpID0gMTsgaSA8IGxlbjsgaSsrICkge1xyXG4gICAgICByZXN1bHQgKz0gSURfU0VQQVJBVE9SICsgdGhpcy5ub2Rlc1sgaSBdLl9pZDtcclxuICAgIH1cclxuICAgIHRoaXMudW5pcXVlSWQgPSByZXN1bHQ7XHJcbiAgICAvLyB0aGlzLnVuaXF1ZUlkID0gXy5tYXAoIHRoaXMubm9kZXMsIGZ1bmN0aW9uKCBub2RlICkgeyByZXR1cm4gbm9kZS5nZXRJZCgpOyB9ICkuam9pbiggJy0nICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25jYXRlbmF0ZXMgdGhlIHVuaXF1ZSBJRHMgb2Ygbm9kZXMgaW4gdGhlIHRyYWlsLCBzbyB0aGF0IHdlIGNhbiBkbyBpZC1iYXNlZCBsb29rdXBzXHJcbiAgICovXHJcbiAgcHVibGljIGdldFVuaXF1ZUlkKCk6IHN0cmluZyB7XHJcbiAgICAvLyBzYW5pdHkgY2hlY2tzXHJcbiAgICBpZiAoIGFzc2VydCApIHtcclxuICAgICAgY29uc3Qgb2xkVW5pcXVlSWQgPSB0aGlzLnVuaXF1ZUlkO1xyXG4gICAgICB0aGlzLnVwZGF0ZVVuaXF1ZUlkKCk7XHJcbiAgICAgIGFzc2VydCggb2xkVW5pcXVlSWQgPT09IHRoaXMudW5pcXVlSWQgKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLnVuaXF1ZUlkO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHN0cmluZyBmb3JtIG9mIHRoaXMgb2JqZWN0XHJcbiAgICovXHJcbiAgcHVibGljIHRvU3RyaW5nKCk6IHN0cmluZyB7XHJcbiAgICB0aGlzLnJlaW5kZXgoKTtcclxuICAgIGlmICggIXRoaXMubGVuZ3RoICkge1xyXG4gICAgICByZXR1cm4gJ0VtcHR5IFRyYWlsJztcclxuICAgIH1cclxuICAgIHJldHVybiBgW1RyYWlsICR7dGhpcy5pbmRpY2VzLmpvaW4oICcuJyApfSAke3RoaXMuZ2V0VW5pcXVlSWQoKX1dYDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsZWFuZXIgc3RyaW5nIGZvcm0gd2hpY2ggd2lsbCBzaG93IGNsYXNzIG5hbWVzLiBOb3Qgb3B0aW1pemVkIGJ5IGFueSBtZWFucywgbWVhbnQgZm9yIGRlYnVnZ2luZy5cclxuICAgKi9cclxuICBwdWJsaWMgdG9QYXRoU3RyaW5nKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gXy5tYXAoIHRoaXMubm9kZXMsIG4gPT4ge1xyXG4gICAgICBsZXQgc3RyaW5nID0gbi5jb25zdHJ1Y3Rvci5uYW1lO1xyXG4gICAgICBpZiAoIHN0cmluZyA9PT0gJ05vZGUnICkge1xyXG4gICAgICAgIHN0cmluZyA9ICcuJztcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gc3RyaW5nO1xyXG4gICAgfSApLmpvaW4oICcvJyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGRlYnVnZ2luZyBzdHJpbmcgaWRlYWwgZm9yIGxvZ2dlZCBvdXRwdXQuXHJcbiAgICovXHJcbiAgcHVibGljIHRvRGVidWdTdHJpbmcoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBgJHt0aGlzLnRvU3RyaW5nKCl9ICR7dGhpcy50b1BhdGhTdHJpbmcoKX1gO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTGlrZSBlYWNoVHJhaWxCZXR3ZWVuLCBidXQgb25seSBmaXJlcyBmb3IgcGFpbnRlZCB0cmFpbHMuIElmIGNhbGxiYWNrIHJldHVybnMgdHJ1ZSwgc3VidHJlZSB3aWxsIGJlIHNraXBwZWRcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGVhY2hQYWludGVkVHJhaWxCZXR3ZWVuKCBhOiBUcmFpbCwgYjogVHJhaWwsIGNhbGxiYWNrOiAoIHRyYWlsOiBUcmFpbCApID0+IHZvaWQsIGV4Y2x1ZGVFbmRUcmFpbHM6IGJvb2xlYW4sIHJvb3ROb2RlOiBOb2RlICk6IHZvaWQge1xyXG4gICAgVHJhaWwuZWFjaFRyYWlsQmV0d2VlbiggYSwgYiwgKCB0cmFpbDogVHJhaWwgKSA9PiB7XHJcbiAgICAgIGlmICggdHJhaWwuaXNQYWludGVkKCkgKSB7XHJcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCB0cmFpbCApO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sIGV4Y2x1ZGVFbmRUcmFpbHMsIHJvb3ROb2RlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHbG9iYWwgd2F5IG9mIGl0ZXJhdGluZyBhY3Jvc3MgdHJhaWxzLiB3aGVuIGNhbGxiYWNrIHJldHVybnMgdHJ1ZSwgc3VidHJlZSB3aWxsIGJlIHNraXBwZWRcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGVhY2hUcmFpbEJldHdlZW4oIGE6IFRyYWlsLCBiOiBUcmFpbCwgY2FsbGJhY2s6ICggdHJhaWw6IFRyYWlsICkgPT4gdm9pZCwgZXhjbHVkZUVuZFRyYWlsczogYm9vbGVhbiwgcm9vdE5vZGU6IE5vZGUgKTogdm9pZCB7XHJcbiAgICBjb25zdCBhUG9pbnRlciA9IGEgPyBuZXcgVHJhaWxQb2ludGVyKCBhLmNvcHkoKSwgdHJ1ZSApIDogbmV3IFRyYWlsUG9pbnRlciggbmV3IFRyYWlsKCByb290Tm9kZSApLCB0cnVlICk7XHJcbiAgICBjb25zdCBiUG9pbnRlciA9IGIgPyBuZXcgVHJhaWxQb2ludGVyKCBiLmNvcHkoKSwgdHJ1ZSApIDogbmV3IFRyYWlsUG9pbnRlciggbmV3IFRyYWlsKCByb290Tm9kZSApLCBmYWxzZSApO1xyXG5cclxuICAgIC8vIGlmIHdlIGFyZSBleGNsdWRpbmcgZW5kcG9pbnRzLCBqdXN0IGJ1bXAgdGhlIHBvaW50ZXJzIHRvd2FyZHMgZWFjaCBvdGhlciBieSBvbmUgc3RlcFxyXG4gICAgaWYgKCBleGNsdWRlRW5kVHJhaWxzICkge1xyXG4gICAgICBhUG9pbnRlci5uZXN0ZWRGb3J3YXJkcygpO1xyXG4gICAgICBiUG9pbnRlci5uZXN0ZWRCYWNrd2FyZHMoKTtcclxuXHJcbiAgICAgIC8vIHRoZXkgd2VyZSBhZGphY2VudCwgc28gbm8gY2FsbGJhY2tzIHdpbGwgYmUgZXhlY3V0ZWRcclxuICAgICAgaWYgKCBhUG9pbnRlci5jb21wYXJlTmVzdGVkKCBiUG9pbnRlciApID09PSAxICkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFQb2ludGVyLmRlcHRoRmlyc3RVbnRpbCggYlBvaW50ZXIsIHBvaW50ZXIgPT4ge1xyXG4gICAgICBpZiAoIHBvaW50ZXIuaXNCZWZvcmUgKSB7XHJcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCBwb2ludGVyLnRyYWlsICk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSwgZmFsc2UgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBpbmRleCBhdCB3aGljaCB0aGUgdHdvIHRyYWlscyBkaXZlcmdlLiBJZiBhLmxlbmd0aCA9PT0gYi5sZW5ndGggPT09IGJyYW5jaEluZGV4LCB0aGUgdHJhaWxzIGFyZSBpZGVudGljYWxcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGJyYW5jaEluZGV4KCBhOiBUcmFpbCwgYjogVHJhaWwgKTogbnVtYmVyIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGEubm9kZXNbIDAgXSA9PT0gYi5ub2Rlc1sgMCBdLCAnQnJhbmNoIGNoYW5nZXMgcmVxdWlyZSByb290cyB0byBiZSB0aGUgc2FtZScgKTtcclxuXHJcbiAgICBsZXQgYnJhbmNoSW5kZXg7XHJcbiAgICBjb25zdCBzaG9ydGVzdExlbmd0aCA9IE1hdGgubWluKCBhLmxlbmd0aCwgYi5sZW5ndGggKTtcclxuICAgIGZvciAoIGJyYW5jaEluZGV4ID0gMDsgYnJhbmNoSW5kZXggPCBzaG9ydGVzdExlbmd0aDsgYnJhbmNoSW5kZXgrKyApIHtcclxuICAgICAgaWYgKCBhLm5vZGVzWyBicmFuY2hJbmRleCBdICE9PSBiLm5vZGVzWyBicmFuY2hJbmRleCBdICkge1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYnJhbmNoSW5kZXg7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgc3VidHJhaWwgZnJvbSB0aGUgcm9vdCB0aGF0IGJvdGggdHJhaWxzIHNoYXJlXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBzaGFyZWRUcmFpbCggYTogVHJhaWwsIGI6IFRyYWlsICk6IFRyYWlsIHtcclxuICAgIHJldHVybiBhLnNsaWNlKCAwLCBUcmFpbC5icmFuY2hJbmRleCggYSwgYiApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gdHJhaWxSZXN1bHRzIC0gV2lsbCBiZSBtdXRlZCBieSBhcHBlbmRpbmcgbWF0Y2hpbmcgdHJhaWxzXHJcbiAgICogQHBhcmFtIHRyYWlsXHJcbiAgICogQHBhcmFtIHByZWRpY2F0ZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgYXBwZW5kQW5jZXN0b3JUcmFpbHNXaXRoUHJlZGljYXRlKCB0cmFpbFJlc3VsdHM6IFRyYWlsW10sIHRyYWlsOiBUcmFpbCwgcHJlZGljYXRlOiAoIG5vZGU6IE5vZGUgKSA9PiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgY29uc3Qgcm9vdCA9IHRyYWlsLnJvb3ROb2RlKCk7XHJcblxyXG4gICAgaWYgKCBwcmVkaWNhdGUoIHJvb3QgKSApIHtcclxuICAgICAgdHJhaWxSZXN1bHRzLnB1c2goIHRyYWlsLmNvcHkoKSApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHBhcmVudENvdW50ID0gcm9vdC5fcGFyZW50cy5sZW5ndGg7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBwYXJlbnRDb3VudDsgaSsrICkge1xyXG4gICAgICBjb25zdCBwYXJlbnQgPSByb290Ll9wYXJlbnRzWyBpIF07XHJcblxyXG4gICAgICB0cmFpbC5hZGRBbmNlc3RvciggcGFyZW50ICk7XHJcbiAgICAgIFRyYWlsLmFwcGVuZEFuY2VzdG9yVHJhaWxzV2l0aFByZWRpY2F0ZSggdHJhaWxSZXN1bHRzLCB0cmFpbCwgcHJlZGljYXRlICk7XHJcbiAgICAgIHRyYWlsLnJlbW92ZUFuY2VzdG9yKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gdHJhaWxSZXN1bHRzIC0gV2lsbCBiZSBtdXRlZCBieSBhcHBlbmRpbmcgbWF0Y2hpbmcgdHJhaWxzXHJcbiAgICogQHBhcmFtIHRyYWlsXHJcbiAgICogQHBhcmFtIHByZWRpY2F0ZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgYXBwZW5kRGVzY2VuZGFudFRyYWlsc1dpdGhQcmVkaWNhdGUoIHRyYWlsUmVzdWx0czogVHJhaWxbXSwgdHJhaWw6IFRyYWlsLCBwcmVkaWNhdGU6ICggbm9kZTogTm9kZSApID0+IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICBjb25zdCBsYXN0Tm9kZSA9IHRyYWlsLmxhc3ROb2RlKCk7XHJcblxyXG4gICAgaWYgKCBwcmVkaWNhdGUoIGxhc3ROb2RlICkgKSB7XHJcbiAgICAgIHRyYWlsUmVzdWx0cy5wdXNoKCB0cmFpbC5jb3B5KCkgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjaGlsZENvdW50ID0gbGFzdE5vZGUuX2NoaWxkcmVuLmxlbmd0aDtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGNoaWxkQ291bnQ7IGkrKyApIHtcclxuICAgICAgY29uc3QgY2hpbGQgPSBsYXN0Tm9kZS5fY2hpbGRyZW5bIGkgXTtcclxuXHJcbiAgICAgIHRyYWlsLmFkZERlc2NlbmRhbnQoIGNoaWxkLCBpICk7XHJcbiAgICAgIFRyYWlsLmFwcGVuZERlc2NlbmRhbnRUcmFpbHNXaXRoUHJlZGljYXRlKCB0cmFpbFJlc3VsdHMsIHRyYWlsLCBwcmVkaWNhdGUgKTtcclxuICAgICAgdHJhaWwucmVtb3ZlRGVzY2VuZGFudCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLypcclxuICAgKiBGaXJlcyBzdWJ0cmVlKHRyYWlsKSBvciBzZWxmKHRyYWlsKSBvbiB0aGUgY2FsbGJhY2tzIHRvIGNyZWF0ZSBkaXNqb2ludCBzdWJ0cmVlcyAodHJhaWxzKSB0aGF0IGNvdmVyIGV4YWN0bHkgdGhlIG5vZGVzXHJcbiAgICogaW5jbHVzaXZlbHkgYmV0d2VlbiBhIGFuZCBiIGluIHJlbmRlcmluZyBvcmRlci5cclxuICAgKiBXZSB0cnkgdG8gY29uc29saWRhdGUgdGhlc2UgYXMgbXVjaCBhcyBwb3NzaWJsZS5cclxuICAgKlxyXG4gICAqIFwiYVwiIGFuZCBcImJcIiBhcmUgdHJlYXRlZCBsaWtlIHNlbGYgcGFpbnRlZCB0cmFpbHMgaW4gdGhlIHJlbmRlcmluZyBvcmRlclxyXG4gICAqXHJcbiAgICpcclxuICAgKiBFeGFtcGxlIHRyZWU6XHJcbiAgICogICBhXHJcbiAgICogICAtIGJcclxuICAgKiAgIC0tLSBjXHJcbiAgICogICAtLS0gZFxyXG4gICAqICAgLSBlXHJcbiAgICogICAtLS0gZlxyXG4gICAqICAgLS0tLS0gZ1xyXG4gICAqICAgLS0tLS0gaFxyXG4gICAqICAgLS0tLS0gaVxyXG4gICAqICAgLS0tIGpcclxuICAgKiAgIC0tLS0tIGtcclxuICAgKiAgIC0gbFxyXG4gICAqICAgLSBtXHJcbiAgICogICAtLS0gblxyXG4gICAqXHJcbiAgICogc3Bhbm5lZFN1YnRyZWVzKCBhLCBhICkgLT4gc2VsZiggYSApO1xyXG4gICAqIHNwYW5uZWRTdWJ0cmVlcyggYywgbiApIC0+IHN1YnRyZWUoIGEgKTsgTk9URTogaWYgYiBpcyBwYWludGVkLCB0aGF0IHdvdWxkbid0IHdvcmshXHJcbiAgICogc3Bhbm5lZFN1YnRyZWVzKCBoLCBsICkgLT4gc3VidHJlZSggaCApOyBzdWJ0cmVlKCBpICk7IHN1YnRyZWUoIGogKTsgc2VsZiggbCApO1xyXG4gICAqIHNwYW5uZWRTdWJ0cmVlcyggYywgaSApIC0+IFtiLGZdIC0tLSB3YWl0LCBpbmNsdWRlIGUgc2VsZj9cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHNwYW5uZWRTdWJ0cmVlcyggYTogVHJhaWwsIGI6IFRyYWlsICk6IHZvaWQge1xyXG4gICAgLy8gYXNzZXJ0ICYmIGFzc2VydCggYS5ub2Rlc1swXSA9PT0gYi5ub2Rlc1swXSwgJ1NwYW5uZWQgc3VidHJlZXMgZm9yIGEgYW5kIGIgcmVxdWlyZXMgdGhhdCBhIGFuZCBiIGhhdmUgdGhlIHNhbWUgcm9vdCcgKTtcclxuXHJcbiAgICAvLyBhLnJlaW5kZXgoKTtcclxuICAgIC8vIGIucmVpbmRleCgpO1xyXG5cclxuICAgIC8vIHZhciBzdWJ0cmVlcyA9IFtdO1xyXG5cclxuICAgIC8vIHZhciBicmFuY2hJbmRleCA9IFRyYWlsLmJyYW5jaEluZGV4KCBhLCBiICk7XHJcbiAgICAvLyBhc3NlcnQgJiYgYXNzZXJ0KCBicmFuY2hJbmRleCA+IDAsICdCcmFuY2ggaW5kZXggc2hvdWxkIGFsd2F5cyBiZSA+IDAnICk7XHJcblxyXG4gICAgLy8gaWYgKCBhLmxlbmd0aCA9PT0gYnJhbmNoSW5kZXggJiYgYi5sZW5ndGggPT09IGJyYW5jaEluZGV4ICkge1xyXG4gICAgLy8gICAvLyB0aGUgdHdvIHRyYWlscyBhcmUgZXF1YWxcclxuICAgIC8vICAgc3VidHJlZXMucHVzaCggYSApO1xyXG4gICAgLy8gfSBlbHNlIHtcclxuICAgIC8vICAgLy8gZmluZCB0aGUgZmlyc3QgcGxhY2Ugd2hlcmUgb3VyIHN0YXJ0IGlzbid0IHRoZSBmaXJzdCBjaGlsZFxyXG4gICAgLy8gICBmb3IgKCB2YXIgYmVmb3JlID0gYS5sZW5ndGggLSAxOyBiZWZvcmUgPj0gYnJhbmNoSW5kZXg7IGJlZm9yZS0tICkge1xyXG4gICAgLy8gICAgIGlmICggYS5pbmRpY2VzW2JlZm9yZS0xXSAhPT0gMCApIHtcclxuICAgIC8vICAgICAgIGJyZWFrO1xyXG4gICAgLy8gICAgIH1cclxuICAgIC8vICAgfVxyXG5cclxuICAgIC8vICAgLy8gZmluZCB0aGUgZmlyc3QgcGxhY2Ugd2hlcmUgb3VyIGVuZCBpc24ndCB0aGUgbGFzdCBjaGlsZFxyXG4gICAgLy8gICBmb3IgKCB2YXIgYWZ0ZXIgPSBhLmxlbmd0aCAtIDE7IGFmdGVyID49IGJyYW5jaEluZGV4OyBhZnRlci0tICkge1xyXG4gICAgLy8gICAgIGlmICggYi5pbmRpY2VzW2FmdGVyLTFdICE9PSBiLm5vZGVzW2FmdGVyLTFdLl9jaGlsZHJlbi5sZW5ndGggLSAxICkge1xyXG4gICAgLy8gICAgICAgYnJlYWs7XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gICB9XHJcblxyXG4gICAgLy8gICBpZiAoIGJlZm9yZSA8IGJyYW5jaEluZGV4ICYmIGFmdGVyIDwgYnJhbmNoSW5kZXggKSB7XHJcbiAgICAvLyAgICAgLy8gd2Ugc3BhbiB0aGUgZW50aXJlIHRyZWUgdXAgdG8gbm9kZXNbYnJhbmNoSW5kZXgtMV0sIHNvIHJldHVybiBvbmx5IHRoYXQgc3VidHJlZVxyXG4gICAgLy8gICAgIHN1YnRyZWVzLnB1c2goIGEuc2xpY2UoIDAsIGJyYW5jaEluZGV4ICkgKTtcclxuICAgIC8vICAgfSBlbHNlIHtcclxuICAgIC8vICAgICAvLyB3YWxrIHRoZSBzdWJ0cmVlcyBkb3duIGZyb20gdGhlIHN0YXJ0XHJcbiAgICAvLyAgICAgZm9yICggdmFyIGlhID0gYmVmb3JlOyBpYSA+PSBicmFuY2hJbmRleDsgaWEtLSApIHtcclxuICAgIC8vICAgICAgIHN1YnRyZWVzLnB1c2goIGEuc2xpY2UoIDAsIGlhICsgMSApICk7XHJcbiAgICAvLyAgICAgfVxyXG5cclxuICAgIC8vICAgICAvLyB3YWxrIHRocm91Z2ggdGhlIG1pZGRsZVxyXG4gICAgLy8gICAgIHZhciBpU3RhcnQgPSBhLmluZGljZXNbYnJhbmNoSW5kZXgtMV07XHJcbiAgICAvLyAgICAgdmFyIGlFbmQgPSBiLmluZGljZXNbYnJhbmNoSW5kZXgtMV07XHJcbiAgICAvLyAgICAgdmFyIGJhc2UgPSBhLnNsaWNlKCAwLCBicmFuY2hJbmRleCApO1xyXG4gICAgLy8gICAgIHZhciBjaGlsZHJlbiA9IGJhc2UubGFzdE5vZGUoKS5fY2hpbGRyZW47XHJcbiAgICAvLyAgICAgZm9yICggdmFyIGltID0gaVN0YXJ0OyBpbSA8PSBpRW5kOyBpbSsrICkge1xyXG4gICAgLy8gICAgICAgc3VidHJlZXMucHVzaCggYmFzZS5jb3B5KCkuYWRkRGVzY2VuZGFudCggY2hpbGRyZW5baW1dLCBpbSApICk7XHJcbiAgICAvLyAgICAgfVxyXG5cclxuICAgIC8vICAgICAvLyB3YWxrIHRoZSBzdWJ0cmVlcyB1cCB0byB0aGUgZW5kXHJcbiAgICAvLyAgICAgZm9yICggdmFyIGliID0gYnJhbmNoSW5kZXg7IGliIDw9IGFmdGVyOyBpYisrICkge1xyXG4gICAgLy8gICAgICAgc3VidHJlZXMucHVzaCggYi5zbGljZSggMCwgaWIgKyAxICkgKTtcclxuICAgIC8vICAgICB9XHJcbiAgICAvLyAgIH1cclxuICAgIC8vIH1cclxuXHJcbiAgICAvLyByZXR1cm4gc3VidHJlZXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZS1jcmVhdGUgYSB0cmFpbCB0byBhIHJvb3Qgbm9kZSBmcm9tIGFuIGV4aXN0aW5nIFRyYWlsIGlkLiBUaGUgcm9vdE5vZGUgbXVzdCBoYXZlIHRoZSBzYW1lIElkIGFzIHRoZSBmaXJzdFxyXG4gICAqIE5vZGUgaWQgb2YgdW5pcXVlSWQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcm9vdE5vZGUgLSB0aGUgcm9vdCBvZiB0aGUgdHJhaWwgYmVpbmcgY3JlYXRlZFxyXG4gICAqIEBwYXJhbSB1bmlxdWVJZCAtIGludGVnZXJzIHNlcGFyYXRlZCBieSBJRF9TRVBBUkFUT1IsIHNlZSBnZXRVbmlxdWVJZFxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgZnJvbVVuaXF1ZUlkKCByb290Tm9kZTogTm9kZSwgdW5pcXVlSWQ6IHN0cmluZyApOiBUcmFpbCB7XHJcbiAgICBjb25zdCB0cmFpbElkcyA9IHVuaXF1ZUlkLnNwbGl0KCBJRF9TRVBBUkFUT1IgKTtcclxuICAgIGNvbnN0IHRyYWlsSWROdW1iZXJzID0gdHJhaWxJZHMubWFwKCBpZCA9PiBOdW1iZXIoIGlkICkgKTtcclxuXHJcbiAgICBsZXQgY3VycmVudE5vZGUgPSByb290Tm9kZTtcclxuXHJcbiAgICBjb25zdCByb290SWQgPSB0cmFpbElkTnVtYmVycy5zaGlmdCgpO1xyXG4gICAgY29uc3Qgbm9kZXMgPSBbIGN1cnJlbnROb2RlIF07XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcm9vdElkID09PSByb290Tm9kZS5pZCApO1xyXG5cclxuICAgIHdoaWxlICggdHJhaWxJZE51bWJlcnMubGVuZ3RoID4gMCApIHtcclxuICAgICAgY29uc3QgdHJhaWxJZCA9IHRyYWlsSWROdW1iZXJzLnNoaWZ0KCk7XHJcblxyXG4gICAgICAvLyBpZiBhY2Nlc3NpYmxlIG9yZGVyIGlzIHNldCwgdGhlIHRyYWlsIG1pZ2h0IG5vdCBtYXRjaCB0aGUgaGllcmFyY2h5IG9mIGNoaWxkcmVuIC0gc2VhcmNoIHRocm91Z2ggbm9kZXNcclxuICAgICAgLy8gaW4gcGRvbU9yZGVyIGZpcnN0IGJlY2F1c2UgcGRvbU9yZGVyIGlzIGFuIG92ZXJyaWRlIGZvciBzY2VuZSBncmFwaCBzdHJ1Y3R1cmVcclxuICAgICAgY29uc3QgcGRvbU9yZGVyID0gY3VycmVudE5vZGUucGRvbU9yZGVyIHx8IFtdO1xyXG4gICAgICBjb25zdCBjaGlsZHJlbiA9IHBkb21PcmRlci5jb25jYXQoIGN1cnJlbnROb2RlLmNoaWxkcmVuICk7XHJcbiAgICAgIGZvciAoIGxldCBqID0gMDsgaiA8IGNoaWxkcmVuLmxlbmd0aDsgaisrICkge1xyXG5cclxuICAgICAgICAvLyBwZG9tT3JkZXIgc3VwcG9ydHMgbnVsbCBlbnRyaWVzIHRvIGZpbGwgaW4gd2l0aCBkZWZhdWx0IG9yZGVyXHJcbiAgICAgICAgaWYgKCBjaGlsZHJlblsgaiBdICE9PSBudWxsICYmIGNoaWxkcmVuWyBqIF0hLmlkID09PSB0cmFpbElkICkge1xyXG4gICAgICAgICAgY29uc3QgY2hpbGRBbG9uZ1RyYWlsID0gY2hpbGRyZW5bIGogXSE7XHJcbiAgICAgICAgICBub2Rlcy5wdXNoKCBjaGlsZEFsb25nVHJhaWwgKTtcclxuICAgICAgICAgIGN1cnJlbnROb2RlID0gY2hpbGRBbG9uZ1RyYWlsO1xyXG5cclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggaiAhPT0gY2hpbGRyZW4ubGVuZ3RoIC0gMSwgJ3VuYWJsZSB0byBmaW5kIG5vZGUgZnJvbSB1bmlxdWUgVHJhaWwgaWQnICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IFRyYWlsKCBub2RlcyApO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ1RyYWlsJywgVHJhaWwgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBR0EsT0FBT0EsT0FBTyxNQUFNLDRCQUE0QjtBQUNoRCxPQUFPQyxVQUFVLE1BQU0sK0JBQStCO0FBRXRELFNBQVNDLElBQUksRUFBRUMsU0FBUyxFQUFFQyxPQUFPLEVBQUVDLFlBQVksUUFBUSxlQUFlOztBQUV0RTtBQUNBLE1BQU1DLFlBQVksR0FBR0gsU0FBUyxDQUFDSSx3QkFBd0I7QUFJdkQsZUFBZSxNQUFNQyxLQUFLLENBQUM7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