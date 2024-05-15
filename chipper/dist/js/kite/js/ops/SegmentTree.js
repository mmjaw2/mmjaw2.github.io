// Copyright 2022-2024, University of Colorado Boulder

/**
 * An accelerated data structure of items where it supports fast queries of "what items overlap wth x values",
 * so we don't have to iterate through all items.
 *
 * This effectively combines an interval/segment tree with red-black tree balancing for insertion.
 *
 * For proper red-black constraints, we handle ranges from -infinity to infinity.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import arrayRemove from '../../../phet-core/js/arrayRemove.js';
import cleanArray from '../../../phet-core/js/cleanArray.js';
import Pool from '../../../phet-core/js/Pool.js';
import { kite } from '../imports.js';
let globalId = 1;
const scratchArray = [];
export default class SegmentTree {
  // Our epsilon, used to expand the bounds of segments so we have some non-zero amount of "overlap" for our segments

  // All items currently in the tree

  /**
   * @param epsilon - Used to expand the bounds of segments so we have some non-zero amount of "overlap" for our
   *                  segments
   */
  constructor(epsilon = 1e-6) {
    this.rootNode = SegmentNode.pool.create(this, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
    this.rootNode.isBlack = true;
    this.epsilon = epsilon;
    this.items = new Set();
  }
  /**
   * Calls interruptableCallback in turn for every "possibly overlapping" item stored in this tree.
   *
   * @param item - The item to use for the bounds range.
   * @param interruptableCallback - When this returns true, the search will be aborted
   */
  query(item, interruptableCallback) {
    const id = globalId++;
    if (this.rootNode) {
      return this.rootNode.query(item, this.getMinX(item, this.epsilon), this.getMaxX(item, this.epsilon), id, interruptableCallback);
    } else {
      return false;
    }
  }
  addItem(item) {
    const min = this.getMinX(item, this.epsilon);
    const max = this.getMaxX(item, this.epsilon);

    // TOOD: consider adding into one traversal
    this.rootNode.split(min, this);
    this.rootNode.split(max, this);
    this.rootNode.addItem(item, min, max);
    this.items.add(item);
  }
  removeItem(item) {
    this.rootNode.removeItem(item, this.getMinX(item, this.epsilon), this.getMaxX(item, this.epsilon));
    this.items.delete(item);
  }

  /**
   * For assertion purposes
   */
  audit() {
    this.rootNode.audit(this.epsilon, this.items, []);
  }
  toString() {
    let spacing = 0;
    let string = '';
    (function recurse(node) {
      string += `${_.repeat('  ', spacing)}${node.toString()}\n`;
      spacing++;
      if (node.hasChildren()) {
        recurse(node.left);
        recurse(node.right);
      }
      spacing--;
    })(this.rootNode);
    return string;
  }
}

// The nodes in our tree
class SegmentNode {
  // The minimum x value of this subtree

  // The maximum x value of this subtree

  // Child nodes (not specified if we have no children or splitValue). Left value is defined as the smaller range.

  // Parent node (root will have null)

  // The value where we split our interval into our children (so if we are 0-10, and a split value of 5, our left child
  // will have 0-5 and our right child will have 5-10.

  // All items that cover this full range of our min-max. These will be stored as high up in the tree as possible.

  // Red-black tree color information, for self-balancing

  constructor(tree, min, max) {
    this.items = [];
    this.initialize(tree, min, max);
  }
  initialize(tree, min, max) {
    this.min = min;
    this.max = max;
    this.splitValue = null;
    this.left = null;
    this.right = null;
    this.parent = null;
    this.tree = tree;
    this.isBlack = false;
    cleanArray(this.items);
    return this;
  }
  contains(n) {
    return n >= this.min && n <= this.max;
  }
  hasChildren() {
    return this.splitValue !== null;
  }

  /**
   * Iterates through interruptableCallback for every potentially overlapping edge - aborts when it returns true
   *
   * @param item
   * @param min - computed min for the item
   * @param max - computed max for the item
   * @param id - our 1-time id that we use to not repeat calls with the same item
   * @param interruptableCallback
   * @returns whether we were aborted
   */
  query(item, min, max, id, interruptableCallback) {
    let abort = false;

    // Partial containment works for everything checking for possible overlap
    if (this.min <= max && this.max >= min) {
      // Do an interruptable iteration
      for (let i = 0; i < this.items.length; i++) {
        const item = this.items[i];
        // @ts-expect-error
        if (!item.internalData?.segmentId || item.internalData?.segmentId < id) {
          // @ts-expect-error
          item.internalData.segmentId = id;
          abort = interruptableCallback(item);
          if (abort) {
            return true;
          }
        }
      }
      if (this.hasChildren()) {
        if (!abort) {
          abort = this.left.query(item, min, max, id, interruptableCallback);
        }
        if (!abort) {
          abort = this.right.query(item, min, max, id, interruptableCallback);
        }
      }
    }
    return abort;
  }

  /**
   * Replaces one child with another
   */
  swapChild(oldChild, newChild) {
    assert && assert(this.left === oldChild || this.right === oldChild);
    if (this.left === oldChild) {
      this.left = newChild;
    } else {
      this.right = newChild;
    }
  }
  hasChild(node) {
    return this.left === node || this.right === node;
  }
  otherChild(node) {
    assert && assert(this.hasChild(node));
    return this.left === node ? this.right : this.left;
  }

  /**
   * Tree operation needed for red-black self-balancing
   */
  leftRotate(tree) {
    assert && assert(this.hasChildren() && this.right.hasChildren());
    if (this.right.hasChildren()) {
      const y = this.right;
      const alpha = this.left;
      const beta = y.left;
      const gamma = y.right;

      // Recreate parent/child connections
      y.parent = this.parent;
      if (this.parent) {
        this.parent.swapChild(this, y);
      } else {
        tree.rootNode = y;
      }
      this.parent = y;
      beta.parent = this;
      y.left = this;
      this.left = alpha;
      this.right = beta;

      // Recompute min/max/splitValue
      this.max = beta.max;
      this.splitValue = alpha.max;
      y.min = this.min;
      y.splitValue = this.max;

      // Start recomputation of stored items
      const xEdges = cleanArray(scratchArray);
      xEdges.push(...this.items);
      cleanArray(this.items);

      // combine alpha-beta into x
      for (let i = alpha.items.length - 1; i >= 0; i--) {
        const edge = alpha.items[i];
        const index = beta.items.indexOf(edge);
        if (index >= 0) {
          alpha.items.splice(i, 1);
          beta.items.splice(index, 1);
          this.items.push(edge);
        }
      }

      // push y to beta and gamma
      beta.items.push(...y.items);
      gamma.items.push(...y.items);
      cleanArray(y.items);

      // x items to y
      y.items.push(...xEdges);
    }
  }

  /**
   * Tree operation needed for red-black self-balancing
   */
  rightRotate(tree) {
    assert && assert(this.hasChildren() && this.left.hasChildren());
    const x = this.left;
    const gamma = this.right;
    const alpha = x.left;
    const beta = x.right;

    // Recreate parent/child connections
    x.parent = this.parent;
    if (this.parent) {
      this.parent.swapChild(this, x);
    } else {
      tree.rootNode = x;
    }
    this.parent = x;
    beta.parent = this;
    x.right = this;
    this.left = beta;
    this.right = gamma;

    // Recompute min/max/splitValue
    this.min = beta.min;
    this.splitValue = gamma.min;
    x.max = this.max;
    x.splitValue = this.min;

    // Start recomputation of stored items
    const yEdges = cleanArray(scratchArray);
    yEdges.push(...this.items);
    cleanArray(this.items);

    // combine beta-gamma into y
    for (let i = gamma.items.length - 1; i >= 0; i--) {
      const edge = gamma.items[i];
      const index = beta.items.indexOf(edge);
      if (index >= 0) {
        gamma.items.splice(i, 1);
        beta.items.splice(index, 1);
        this.items.push(edge);
      }
    }

    // push x to alpha and beta
    alpha.items.push(...x.items);
    beta.items.push(...x.items);
    cleanArray(x.items);

    // y items to x
    x.items.push(...yEdges);
  }

  /**
   * Called after an insertion (or potentially deletion in the future) that handles red-black tree rebalancing.
   */
  fixRedBlack(tree) {
    assert && assert(!this.isBlack);
    if (!this.parent) {
      this.isBlack = true;
    } else {
      const parent = this.parent;
      if (!parent.isBlack) {
        // Due to red-black nature, grandparent should exist since if parent was the root, it would be black.
        const grandparent = parent.parent;
        const uncle = grandparent.otherChild(parent);
        if (!uncle.isBlack) {
          // case 1
          parent.isBlack = true;
          uncle.isBlack = true;
          grandparent.isBlack = false;
          grandparent.fixRedBlack(tree);
        } else {
          if (parent === grandparent.left) {
            if (this === parent.right) {
              // case 2
              parent.leftRotate(tree);
              parent.parent.isBlack = true;
              parent.parent.parent.isBlack = false;
              parent.parent.parent.rightRotate(tree);
            } else {
              // case 3
              parent.isBlack = true;
              grandparent.isBlack = false;
              grandparent.rightRotate(tree);
            }
          } else {
            if (this === parent.left) {
              // case 2
              parent.rightRotate(tree);
              parent.parent.isBlack = true;
              parent.parent.parent.isBlack = false;
              parent.parent.parent.leftRotate(tree);
            } else {
              // case 3
              parent.isBlack = true;
              grandparent.isBlack = false;
              grandparent.leftRotate(tree);
            }
          }
        }
      }
    }
  }

  /**
   * Triggers a split of whatever interval contains this value (or is a no-op if we already split at it before).
   */
  split(n, tree) {
    assert && assert(this.contains(n));

    // Ignore splits if we are already split on them
    if (n === this.min || n === this.max) {
      return;
    }
    if (this.hasChildren()) {
      // If our split value is the same as our current one, we've already split on that
      if (this.splitValue !== n) {
        (n > this.splitValue ? this.right : this.left).split(n, tree);
      }
    } else {
      this.splitValue = n;
      const newLeft = SegmentNode.pool.create(this.tree, this.min, n);
      newLeft.parent = this;
      this.left = newLeft;
      const newRight = SegmentNode.pool.create(this.tree, n, this.max);
      newRight.parent = this;
      this.right = newRight;

      // Check if we need to do red-black tree balancing
      if (!this.isBlack && this.parent) {
        const parent = this.parent;
        const sibling = parent.otherChild(this);
        if (sibling.isBlack) {
          if (this === parent.left) {
            parent.rightRotate(tree);
            newLeft.isBlack = true;
          } else {
            parent.leftRotate(tree);
            newRight.isBlack = true;
          }
          this.fixRedBlack(tree);
        } else {
          // case 1
          this.isBlack = true;
          sibling.isBlack = true;
          parent.isBlack = false;
          parent.fixRedBlack(tree);
        }
      }
    }
  }

  /**
   * Recursively adds an item
   */
  addItem(item, min, max) {
    // Ignore no-overlap cases
    if (this.min > max || this.max < min) {
      return;
    }
    if (this.min >= min && this.max <= max) {
      // We are fully contained
      this.items.push(item);
    } else if (this.hasChildren()) {
      this.left.addItem(item, min, max);
      this.right.addItem(item, min, max);
    }
  }

  /**
   * Recursively removes an item
   */
  removeItem(item, min, max) {
    // Ignore no-overlap cases
    if (this.min > max || this.max < min) {
      return;
    }
    if (this.min >= min && this.max <= max) {
      // We are fully contained
      assert && assert(this.items.includes(item));
      arrayRemove(this.items, item);
    } else if (this.hasChildren()) {
      this.left.removeItem(item, min, max);
      this.right.removeItem(item, min, max);
    }
  }

  /**
   * Recursively audits with assertions, checking all of our assumptions.
   *
   * @param epsilon
   * @param allItems - All items in the tree
   * @param presentItems - Edges that were present in ancestors
   */
  audit(epsilon, allItems, presentItems = []) {
    if (assert) {
      for (const item of presentItems) {
        assert(!this.items.includes(item));
      }
      for (const item of this.items) {
        // Containment check, this node should be fully contained
        assert(this.tree.getMinX(item, epsilon) <= this.min);
        assert(this.tree.getMaxX(item, epsilon) >= this.max);
      }
      for (const item of presentItems) {
        if (this.tree.getMinX(item, epsilon) <= this.min && this.tree.getMaxX(item, epsilon) >= this.max) {
          assert(allItems.has(item) || this.items.includes(item));
        }
      }
      assert(this.hasChildren() === (this.left !== null));
      assert(this.hasChildren() === (this.right !== null));
      assert(this.hasChildren() === (this.splitValue !== null));
      assert(this.min < this.max);
      if (this.parent) {
        assert(this.parent.hasChild(this));
        assert(this.isBlack || this.parent.isBlack);
      }
      if (this.hasChildren()) {
        assert(this.left.parent === this);
        assert(this.right.parent === this);
        assert(this.min === this.left.min);
        assert(this.max === this.right.max);
        assert(this.splitValue === this.left.max);
        assert(this.splitValue === this.right.min);
        for (const item of this.left.items) {
          assert(!this.right.items.includes(item), 'We shouldn\'t have two children with the same item');
        }
        const childPresentItems = [...presentItems, ...this.items];
        this.left.audit(epsilon, allItems, childPresentItems);
        this.right.audit(epsilon, allItems, childPresentItems);
      }
    }
  }
  toString() {
    return `[${this.min} ${this.max}] split:${this.splitValue} ${this.isBlack ? 'black' : 'red'} ${this.items}`;
  }
  freeToPool() {
    SegmentNode.pool.freeToPool(this);
  }
  static pool = new Pool(SegmentNode);
}
kite.register('SegmentTree', SegmentTree);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhcnJheVJlbW92ZSIsImNsZWFuQXJyYXkiLCJQb29sIiwia2l0ZSIsImdsb2JhbElkIiwic2NyYXRjaEFycmF5IiwiU2VnbWVudFRyZWUiLCJjb25zdHJ1Y3RvciIsImVwc2lsb24iLCJyb290Tm9kZSIsIlNlZ21lbnROb2RlIiwicG9vbCIsImNyZWF0ZSIsIk51bWJlciIsIk5FR0FUSVZFX0lORklOSVRZIiwiUE9TSVRJVkVfSU5GSU5JVFkiLCJpc0JsYWNrIiwiaXRlbXMiLCJTZXQiLCJxdWVyeSIsIml0ZW0iLCJpbnRlcnJ1cHRhYmxlQ2FsbGJhY2siLCJpZCIsImdldE1pblgiLCJnZXRNYXhYIiwiYWRkSXRlbSIsIm1pbiIsIm1heCIsInNwbGl0IiwiYWRkIiwicmVtb3ZlSXRlbSIsImRlbGV0ZSIsImF1ZGl0IiwidG9TdHJpbmciLCJzcGFjaW5nIiwic3RyaW5nIiwicmVjdXJzZSIsIm5vZGUiLCJfIiwicmVwZWF0IiwiaGFzQ2hpbGRyZW4iLCJsZWZ0IiwicmlnaHQiLCJ0cmVlIiwiaW5pdGlhbGl6ZSIsInNwbGl0VmFsdWUiLCJwYXJlbnQiLCJjb250YWlucyIsIm4iLCJhYm9ydCIsImkiLCJsZW5ndGgiLCJpbnRlcm5hbERhdGEiLCJzZWdtZW50SWQiLCJzd2FwQ2hpbGQiLCJvbGRDaGlsZCIsIm5ld0NoaWxkIiwiYXNzZXJ0IiwiaGFzQ2hpbGQiLCJvdGhlckNoaWxkIiwibGVmdFJvdGF0ZSIsInkiLCJhbHBoYSIsImJldGEiLCJnYW1tYSIsInhFZGdlcyIsInB1c2giLCJlZGdlIiwiaW5kZXgiLCJpbmRleE9mIiwic3BsaWNlIiwicmlnaHRSb3RhdGUiLCJ4IiwieUVkZ2VzIiwiZml4UmVkQmxhY2siLCJncmFuZHBhcmVudCIsInVuY2xlIiwibmV3TGVmdCIsIm5ld1JpZ2h0Iiwic2libGluZyIsImluY2x1ZGVzIiwiYWxsSXRlbXMiLCJwcmVzZW50SXRlbXMiLCJoYXMiLCJjaGlsZFByZXNlbnRJdGVtcyIsImZyZWVUb1Bvb2wiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlNlZ21lbnRUcmVlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIyLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEFuIGFjY2VsZXJhdGVkIGRhdGEgc3RydWN0dXJlIG9mIGl0ZW1zIHdoZXJlIGl0IHN1cHBvcnRzIGZhc3QgcXVlcmllcyBvZiBcIndoYXQgaXRlbXMgb3ZlcmxhcCB3dGggeCB2YWx1ZXNcIixcclxuICogc28gd2UgZG9uJ3QgaGF2ZSB0byBpdGVyYXRlIHRocm91Z2ggYWxsIGl0ZW1zLlxyXG4gKlxyXG4gKiBUaGlzIGVmZmVjdGl2ZWx5IGNvbWJpbmVzIGFuIGludGVydmFsL3NlZ21lbnQgdHJlZSB3aXRoIHJlZC1ibGFjayB0cmVlIGJhbGFuY2luZyBmb3IgaW5zZXJ0aW9uLlxyXG4gKlxyXG4gKiBGb3IgcHJvcGVyIHJlZC1ibGFjayBjb25zdHJhaW50cywgd2UgaGFuZGxlIHJhbmdlcyBmcm9tIC1pbmZpbml0eSB0byBpbmZpbml0eS5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBhcnJheVJlbW92ZSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvYXJyYXlSZW1vdmUuanMnO1xyXG5pbXBvcnQgY2xlYW5BcnJheSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvY2xlYW5BcnJheS5qcyc7XHJcbmltcG9ydCBQb29sIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9Qb29sLmpzJztcclxuaW1wb3J0IHsgRWRnZSwga2l0ZSB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5cclxubGV0IGdsb2JhbElkID0gMTtcclxuY29uc3Qgc2NyYXRjaEFycmF5OiBFZGdlW10gPSBbXTtcclxuXHJcbnR5cGUgU2VnbWVudEluZm88VD4gPSB7XHJcbiAgZ2V0TWluWDogKCBpdGVtOiBULCBlcHNpbG9uOiBudW1iZXIgKSA9PiBudW1iZXI7XHJcbiAgZ2V0TWF4WDogKCBpdGVtOiBULCBlcHNpbG9uOiBudW1iZXIgKSA9PiBudW1iZXI7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhYnN0cmFjdCBjbGFzcyBTZWdtZW50VHJlZTxUPiBpbXBsZW1lbnRzIFNlZ21lbnRJbmZvPFQ+IHtcclxuXHJcbiAgcHVibGljIHJvb3ROb2RlOiBTZWdtZW50Tm9kZTxUPjtcclxuXHJcbiAgLy8gT3VyIGVwc2lsb24sIHVzZWQgdG8gZXhwYW5kIHRoZSBib3VuZHMgb2Ygc2VnbWVudHMgc28gd2UgaGF2ZSBzb21lIG5vbi16ZXJvIGFtb3VudCBvZiBcIm92ZXJsYXBcIiBmb3Igb3VyIHNlZ21lbnRzXHJcbiAgcHJpdmF0ZSByZWFkb25seSBlcHNpbG9uOiBudW1iZXI7XHJcblxyXG4gIC8vIEFsbCBpdGVtcyBjdXJyZW50bHkgaW4gdGhlIHRyZWVcclxuICBwcml2YXRlIHJlYWRvbmx5IGl0ZW1zOiBTZXQ8VD47XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBlcHNpbG9uIC0gVXNlZCB0byBleHBhbmQgdGhlIGJvdW5kcyBvZiBzZWdtZW50cyBzbyB3ZSBoYXZlIHNvbWUgbm9uLXplcm8gYW1vdW50IG9mIFwib3ZlcmxhcFwiIGZvciBvdXJcclxuICAgKiAgICAgICAgICAgICAgICAgIHNlZ21lbnRzXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBlcHNpbG9uID0gMWUtNiApIHtcclxuICAgIHRoaXMucm9vdE5vZGUgPSBTZWdtZW50Tm9kZS5wb29sLmNyZWF0ZSggdGhpcywgTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZLCBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkgKSBhcyBTZWdtZW50Tm9kZTxUPjtcclxuICAgIHRoaXMucm9vdE5vZGUuaXNCbGFjayA9IHRydWU7XHJcblxyXG4gICAgdGhpcy5lcHNpbG9uID0gZXBzaWxvbjtcclxuXHJcbiAgICB0aGlzLml0ZW1zID0gbmV3IFNldDxUPigpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFic3RyYWN0IGdldE1pblgoIGl0ZW06IFQsIGVwc2lsb246IG51bWJlciApOiBudW1iZXI7XHJcblxyXG4gIHB1YmxpYyBhYnN0cmFjdCBnZXRNYXhYKCBpdGVtOiBULCBlcHNpbG9uOiBudW1iZXIgKTogbnVtYmVyO1xyXG5cclxuICAvKipcclxuICAgKiBDYWxscyBpbnRlcnJ1cHRhYmxlQ2FsbGJhY2sgaW4gdHVybiBmb3IgZXZlcnkgXCJwb3NzaWJseSBvdmVybGFwcGluZ1wiIGl0ZW0gc3RvcmVkIGluIHRoaXMgdHJlZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBpdGVtIC0gVGhlIGl0ZW0gdG8gdXNlIGZvciB0aGUgYm91bmRzIHJhbmdlLlxyXG4gICAqIEBwYXJhbSBpbnRlcnJ1cHRhYmxlQ2FsbGJhY2sgLSBXaGVuIHRoaXMgcmV0dXJucyB0cnVlLCB0aGUgc2VhcmNoIHdpbGwgYmUgYWJvcnRlZFxyXG4gICAqL1xyXG4gIHB1YmxpYyBxdWVyeSggaXRlbTogVCwgaW50ZXJydXB0YWJsZUNhbGxiYWNrOiAoIGl0ZW06IFQgKSA9PiBib29sZWFuICk6IGJvb2xlYW4ge1xyXG4gICAgY29uc3QgaWQgPSBnbG9iYWxJZCsrO1xyXG5cclxuICAgIGlmICggdGhpcy5yb290Tm9kZSApIHtcclxuICAgICAgcmV0dXJuIHRoaXMucm9vdE5vZGUucXVlcnkoIGl0ZW0sIHRoaXMuZ2V0TWluWCggaXRlbSwgdGhpcy5lcHNpbG9uICksIHRoaXMuZ2V0TWF4WCggaXRlbSwgdGhpcy5lcHNpbG9uICksIGlkLCBpbnRlcnJ1cHRhYmxlQ2FsbGJhY2sgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYWRkSXRlbSggaXRlbTogVCApOiB2b2lkIHtcclxuICAgIGNvbnN0IG1pbiA9IHRoaXMuZ2V0TWluWCggaXRlbSwgdGhpcy5lcHNpbG9uICk7XHJcbiAgICBjb25zdCBtYXggPSB0aGlzLmdldE1heFgoIGl0ZW0sIHRoaXMuZXBzaWxvbiApO1xyXG5cclxuICAgIC8vIFRPT0Q6IGNvbnNpZGVyIGFkZGluZyBpbnRvIG9uZSB0cmF2ZXJzYWxcclxuICAgIHRoaXMucm9vdE5vZGUuc3BsaXQoIG1pbiwgdGhpcyApO1xyXG4gICAgdGhpcy5yb290Tm9kZS5zcGxpdCggbWF4LCB0aGlzICk7XHJcbiAgICB0aGlzLnJvb3ROb2RlLmFkZEl0ZW0oIGl0ZW0sIG1pbiwgbWF4ICk7XHJcblxyXG4gICAgdGhpcy5pdGVtcy5hZGQoIGl0ZW0gKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyByZW1vdmVJdGVtKCBpdGVtOiBUICk6IHZvaWQge1xyXG4gICAgdGhpcy5yb290Tm9kZS5yZW1vdmVJdGVtKCBpdGVtLCB0aGlzLmdldE1pblgoIGl0ZW0sIHRoaXMuZXBzaWxvbiApLCB0aGlzLmdldE1heFgoIGl0ZW0sIHRoaXMuZXBzaWxvbiApICk7XHJcbiAgICB0aGlzLml0ZW1zLmRlbGV0ZSggaXRlbSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRm9yIGFzc2VydGlvbiBwdXJwb3Nlc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBhdWRpdCgpOiB2b2lkIHtcclxuICAgIHRoaXMucm9vdE5vZGUuYXVkaXQoIHRoaXMuZXBzaWxvbiwgdGhpcy5pdGVtcywgW10gKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyB0b1N0cmluZygpOiBzdHJpbmcge1xyXG4gICAgbGV0IHNwYWNpbmcgPSAwO1xyXG4gICAgbGV0IHN0cmluZyA9ICcnO1xyXG5cclxuICAgICggZnVuY3Rpb24gcmVjdXJzZSggbm9kZTogU2VnbWVudE5vZGU8VD4gKSB7XHJcbiAgICAgIHN0cmluZyArPSBgJHtfLnJlcGVhdCggJyAgJywgc3BhY2luZyApfSR7bm9kZS50b1N0cmluZygpfVxcbmA7XHJcbiAgICAgIHNwYWNpbmcrKztcclxuICAgICAgaWYgKCBub2RlLmhhc0NoaWxkcmVuKCkgKSB7XHJcbiAgICAgICAgcmVjdXJzZSggbm9kZS5sZWZ0ISApO1xyXG4gICAgICAgIHJlY3Vyc2UoIG5vZGUucmlnaHQhICk7XHJcbiAgICAgIH1cclxuICAgICAgc3BhY2luZy0tO1xyXG4gICAgfSApKCB0aGlzLnJvb3ROb2RlICk7XHJcblxyXG4gICAgcmV0dXJuIHN0cmluZztcclxuICB9XHJcbn1cclxuXHJcbi8vIFRoZSBub2RlcyBpbiBvdXIgdHJlZVxyXG5jbGFzcyBTZWdtZW50Tm9kZTxUPiB7XHJcblxyXG4gIC8vIFRoZSBtaW5pbXVtIHggdmFsdWUgb2YgdGhpcyBzdWJ0cmVlXHJcbiAgcHVibGljIG1pbiE6IG51bWJlcjtcclxuXHJcbiAgLy8gVGhlIG1heGltdW0geCB2YWx1ZSBvZiB0aGlzIHN1YnRyZWVcclxuICBwdWJsaWMgbWF4ITogbnVtYmVyO1xyXG5cclxuICAvLyBDaGlsZCBub2RlcyAobm90IHNwZWNpZmllZCBpZiB3ZSBoYXZlIG5vIGNoaWxkcmVuIG9yIHNwbGl0VmFsdWUpLiBMZWZ0IHZhbHVlIGlzIGRlZmluZWQgYXMgdGhlIHNtYWxsZXIgcmFuZ2UuXHJcbiAgcHVibGljIGxlZnQhOiBTZWdtZW50Tm9kZTxUPiB8IG51bGw7XHJcbiAgcHVibGljIHJpZ2h0ITogU2VnbWVudE5vZGU8VD4gfCBudWxsO1xyXG5cclxuICAvLyBQYXJlbnQgbm9kZSAocm9vdCB3aWxsIGhhdmUgbnVsbClcclxuICBwdWJsaWMgcGFyZW50ITogU2VnbWVudE5vZGU8VD4gfCBudWxsO1xyXG5cclxuICAvLyBUaGUgdmFsdWUgd2hlcmUgd2Ugc3BsaXQgb3VyIGludGVydmFsIGludG8gb3VyIGNoaWxkcmVuIChzbyBpZiB3ZSBhcmUgMC0xMCwgYW5kIGEgc3BsaXQgdmFsdWUgb2YgNSwgb3VyIGxlZnQgY2hpbGRcclxuICAvLyB3aWxsIGhhdmUgMC01IGFuZCBvdXIgcmlnaHQgY2hpbGQgd2lsbCBoYXZlIDUtMTAuXHJcbiAgcHVibGljIHNwbGl0VmFsdWUhOiBudW1iZXIgfCBudWxsO1xyXG5cclxuICAvLyBBbGwgaXRlbXMgdGhhdCBjb3ZlciB0aGlzIGZ1bGwgcmFuZ2Ugb2Ygb3VyIG1pbi1tYXguIFRoZXNlIHdpbGwgYmUgc3RvcmVkIGFzIGhpZ2ggdXAgaW4gdGhlIHRyZWUgYXMgcG9zc2libGUuXHJcbiAgcHVibGljIGl0ZW1zOiBUW107XHJcblxyXG4gIC8vIFJlZC1ibGFjayB0cmVlIGNvbG9yIGluZm9ybWF0aW9uLCBmb3Igc2VsZi1iYWxhbmNpbmdcclxuICBwdWJsaWMgaXNCbGFjayE6IGJvb2xlYW47XHJcblxyXG4gIHB1YmxpYyB0cmVlITogU2VnbWVudFRyZWU8VD47XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggdHJlZTogU2VnbWVudFRyZWU8VD4sIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlciApIHtcclxuICAgIHRoaXMuaXRlbXMgPSBbXTtcclxuXHJcbiAgICB0aGlzLmluaXRpYWxpemUoIHRyZWUsIG1pbiwgbWF4ICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaW5pdGlhbGl6ZSggdHJlZTogU2VnbWVudFRyZWU8VD4sIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlciApOiB0aGlzIHtcclxuICAgIHRoaXMubWluID0gbWluO1xyXG4gICAgdGhpcy5tYXggPSBtYXg7XHJcblxyXG4gICAgdGhpcy5zcGxpdFZhbHVlID0gbnVsbDtcclxuICAgIHRoaXMubGVmdCA9IG51bGw7XHJcbiAgICB0aGlzLnJpZ2h0ID0gbnVsbDtcclxuICAgIHRoaXMucGFyZW50ID0gbnVsbDtcclxuICAgIHRoaXMudHJlZSA9IHRyZWU7XHJcblxyXG4gICAgdGhpcy5pc0JsYWNrID0gZmFsc2U7XHJcblxyXG4gICAgY2xlYW5BcnJheSggdGhpcy5pdGVtcyApO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGNvbnRhaW5zKCBuOiBudW1iZXIgKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gbiA+PSB0aGlzLm1pbiAmJiBuIDw9IHRoaXMubWF4O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGhhc0NoaWxkcmVuKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5zcGxpdFZhbHVlICE9PSBudWxsOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEl0ZXJhdGVzIHRocm91Z2ggaW50ZXJydXB0YWJsZUNhbGxiYWNrIGZvciBldmVyeSBwb3RlbnRpYWxseSBvdmVybGFwcGluZyBlZGdlIC0gYWJvcnRzIHdoZW4gaXQgcmV0dXJucyB0cnVlXHJcbiAgICpcclxuICAgKiBAcGFyYW0gaXRlbVxyXG4gICAqIEBwYXJhbSBtaW4gLSBjb21wdXRlZCBtaW4gZm9yIHRoZSBpdGVtXHJcbiAgICogQHBhcmFtIG1heCAtIGNvbXB1dGVkIG1heCBmb3IgdGhlIGl0ZW1cclxuICAgKiBAcGFyYW0gaWQgLSBvdXIgMS10aW1lIGlkIHRoYXQgd2UgdXNlIHRvIG5vdCByZXBlYXQgY2FsbHMgd2l0aCB0aGUgc2FtZSBpdGVtXHJcbiAgICogQHBhcmFtIGludGVycnVwdGFibGVDYWxsYmFja1xyXG4gICAqIEByZXR1cm5zIHdoZXRoZXIgd2Ugd2VyZSBhYm9ydGVkXHJcbiAgICovXHJcbiAgcHVibGljIHF1ZXJ5KCBpdGVtOiBULCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIsIGlkOiBudW1iZXIsIGludGVycnVwdGFibGVDYWxsYmFjazogKCBpdGVtOiBUICkgPT4gYm9vbGVhbiApOiBib29sZWFuIHtcclxuICAgIGxldCBhYm9ydCA9IGZhbHNlO1xyXG5cclxuICAgIC8vIFBhcnRpYWwgY29udGFpbm1lbnQgd29ya3MgZm9yIGV2ZXJ5dGhpbmcgY2hlY2tpbmcgZm9yIHBvc3NpYmxlIG92ZXJsYXBcclxuICAgIGlmICggdGhpcy5taW4gPD0gbWF4ICYmIHRoaXMubWF4ID49IG1pbiApIHtcclxuXHJcbiAgICAgIC8vIERvIGFuIGludGVycnVwdGFibGUgaXRlcmF0aW9uXHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuaXRlbXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuaXRlbXNbIGkgXTtcclxuICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICAgICAgaWYgKCAhaXRlbS5pbnRlcm5hbERhdGE/LnNlZ21lbnRJZCB8fCBpdGVtLmludGVybmFsRGF0YT8uc2VnbWVudElkIDwgaWQgKSB7XHJcbiAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICAgICAgICBpdGVtLmludGVybmFsRGF0YS5zZWdtZW50SWQgPSBpZDtcclxuICAgICAgICAgIGFib3J0ID0gaW50ZXJydXB0YWJsZUNhbGxiYWNrKCBpdGVtICk7XHJcbiAgICAgICAgICBpZiAoIGFib3J0ICkge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggdGhpcy5oYXNDaGlsZHJlbigpICkge1xyXG4gICAgICAgIGlmICggIWFib3J0ICkge1xyXG4gICAgICAgICAgYWJvcnQgPSB0aGlzLmxlZnQhLnF1ZXJ5KCBpdGVtLCBtaW4sIG1heCwgaWQsIGludGVycnVwdGFibGVDYWxsYmFjayApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCAhYWJvcnQgKSB7XHJcbiAgICAgICAgICBhYm9ydCA9IHRoaXMucmlnaHQhLnF1ZXJ5KCBpdGVtLCBtaW4sIG1heCwgaWQsIGludGVycnVwdGFibGVDYWxsYmFjayApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhYm9ydDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlcGxhY2VzIG9uZSBjaGlsZCB3aXRoIGFub3RoZXJcclxuICAgKi9cclxuICBwdWJsaWMgc3dhcENoaWxkKCBvbGRDaGlsZDogU2VnbWVudE5vZGU8VD4sIG5ld0NoaWxkOiBTZWdtZW50Tm9kZTxUPiApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMubGVmdCA9PT0gb2xkQ2hpbGQgfHwgdGhpcy5yaWdodCA9PT0gb2xkQ2hpbGQgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMubGVmdCA9PT0gb2xkQ2hpbGQgKSB7XHJcbiAgICAgIHRoaXMubGVmdCA9IG5ld0NoaWxkO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRoaXMucmlnaHQgPSBuZXdDaGlsZDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBoYXNDaGlsZCggbm9kZTogU2VnbWVudE5vZGU8VD4gKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5sZWZ0ID09PSBub2RlIHx8IHRoaXMucmlnaHQgPT09IG5vZGU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3RoZXJDaGlsZCggbm9kZTogU2VnbWVudE5vZGU8VD4gKTogU2VnbWVudE5vZGU8VD4ge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5oYXNDaGlsZCggbm9kZSApICk7XHJcblxyXG4gICAgcmV0dXJuICggKCB0aGlzLmxlZnQgPT09IG5vZGUgKSA/IHRoaXMucmlnaHQgOiB0aGlzLmxlZnQgKSE7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmVlIG9wZXJhdGlvbiBuZWVkZWQgZm9yIHJlZC1ibGFjayBzZWxmLWJhbGFuY2luZ1xyXG4gICAqL1xyXG4gIHB1YmxpYyBsZWZ0Um90YXRlKCB0cmVlOiBTZWdtZW50VHJlZTxUPiApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuaGFzQ2hpbGRyZW4oKSAmJiB0aGlzLnJpZ2h0IS5oYXNDaGlsZHJlbigpICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLnJpZ2h0IS5oYXNDaGlsZHJlbigpICkge1xyXG4gICAgICBjb25zdCB5ID0gdGhpcy5yaWdodCE7XHJcbiAgICAgIGNvbnN0IGFscGhhID0gdGhpcy5sZWZ0ITtcclxuICAgICAgY29uc3QgYmV0YSA9IHkubGVmdCE7XHJcbiAgICAgIGNvbnN0IGdhbW1hID0geS5yaWdodCE7XHJcblxyXG4gICAgICAvLyBSZWNyZWF0ZSBwYXJlbnQvY2hpbGQgY29ubmVjdGlvbnNcclxuICAgICAgeS5wYXJlbnQgPSB0aGlzLnBhcmVudDtcclxuICAgICAgaWYgKCB0aGlzLnBhcmVudCApIHtcclxuICAgICAgICB0aGlzLnBhcmVudC5zd2FwQ2hpbGQoIHRoaXMsIHkgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB0cmVlLnJvb3ROb2RlID0geTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLnBhcmVudCA9IHk7XHJcbiAgICAgIGJldGEucGFyZW50ID0gdGhpcztcclxuXHJcbiAgICAgIHkubGVmdCA9IHRoaXM7XHJcbiAgICAgIHRoaXMubGVmdCA9IGFscGhhO1xyXG4gICAgICB0aGlzLnJpZ2h0ID0gYmV0YTtcclxuXHJcbiAgICAgIC8vIFJlY29tcHV0ZSBtaW4vbWF4L3NwbGl0VmFsdWVcclxuICAgICAgdGhpcy5tYXggPSBiZXRhLm1heDtcclxuICAgICAgdGhpcy5zcGxpdFZhbHVlID0gYWxwaGEubWF4O1xyXG4gICAgICB5Lm1pbiA9IHRoaXMubWluO1xyXG4gICAgICB5LnNwbGl0VmFsdWUgPSB0aGlzLm1heDtcclxuXHJcbiAgICAgIC8vIFN0YXJ0IHJlY29tcHV0YXRpb24gb2Ygc3RvcmVkIGl0ZW1zXHJcbiAgICAgIGNvbnN0IHhFZGdlcyA9IGNsZWFuQXJyYXkoIHNjcmF0Y2hBcnJheSBhcyBUW10gKTtcclxuICAgICAgeEVkZ2VzLnB1c2goIC4uLnRoaXMuaXRlbXMgKTtcclxuICAgICAgY2xlYW5BcnJheSggdGhpcy5pdGVtcyApO1xyXG5cclxuICAgICAgLy8gY29tYmluZSBhbHBoYS1iZXRhIGludG8geFxyXG4gICAgICBmb3IgKCBsZXQgaSA9IGFscGhhLml0ZW1zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tICkge1xyXG4gICAgICAgIGNvbnN0IGVkZ2UgPSBhbHBoYS5pdGVtc1sgaSBdO1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gYmV0YS5pdGVtcy5pbmRleE9mKCBlZGdlICk7XHJcbiAgICAgICAgaWYgKCBpbmRleCA+PSAwICkge1xyXG4gICAgICAgICAgYWxwaGEuaXRlbXMuc3BsaWNlKCBpLCAxICk7XHJcbiAgICAgICAgICBiZXRhLml0ZW1zLnNwbGljZSggaW5kZXgsIDEgKTtcclxuICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggZWRnZSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gcHVzaCB5IHRvIGJldGEgYW5kIGdhbW1hXHJcbiAgICAgIGJldGEuaXRlbXMucHVzaCggLi4ueS5pdGVtcyApO1xyXG4gICAgICBnYW1tYS5pdGVtcy5wdXNoKCAuLi55Lml0ZW1zICk7XHJcbiAgICAgIGNsZWFuQXJyYXkoIHkuaXRlbXMgKTtcclxuXHJcbiAgICAgIC8vIHggaXRlbXMgdG8geVxyXG4gICAgICB5Lml0ZW1zLnB1c2goIC4uLnhFZGdlcyApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJlZSBvcGVyYXRpb24gbmVlZGVkIGZvciByZWQtYmxhY2sgc2VsZi1iYWxhbmNpbmdcclxuICAgKi9cclxuICBwdWJsaWMgcmlnaHRSb3RhdGUoIHRyZWU6IFNlZ21lbnRUcmVlPFQ+ICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5oYXNDaGlsZHJlbigpICYmIHRoaXMubGVmdCEuaGFzQ2hpbGRyZW4oKSApO1xyXG5cclxuICAgIGNvbnN0IHggPSB0aGlzLmxlZnQhO1xyXG4gICAgY29uc3QgZ2FtbWEgPSB0aGlzLnJpZ2h0ITtcclxuICAgIGNvbnN0IGFscGhhID0geC5sZWZ0ITtcclxuICAgIGNvbnN0IGJldGEgPSB4LnJpZ2h0ITtcclxuXHJcbiAgICAvLyBSZWNyZWF0ZSBwYXJlbnQvY2hpbGQgY29ubmVjdGlvbnNcclxuICAgIHgucGFyZW50ID0gdGhpcy5wYXJlbnQ7XHJcbiAgICBpZiAoIHRoaXMucGFyZW50ICkge1xyXG4gICAgICB0aGlzLnBhcmVudC5zd2FwQ2hpbGQoIHRoaXMsIHggKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0cmVlLnJvb3ROb2RlID0geDtcclxuICAgIH1cclxuICAgIHRoaXMucGFyZW50ID0geDtcclxuICAgIGJldGEucGFyZW50ID0gdGhpcztcclxuXHJcbiAgICB4LnJpZ2h0ID0gdGhpcztcclxuICAgIHRoaXMubGVmdCA9IGJldGE7XHJcbiAgICB0aGlzLnJpZ2h0ID0gZ2FtbWE7XHJcblxyXG4gICAgLy8gUmVjb21wdXRlIG1pbi9tYXgvc3BsaXRWYWx1ZVxyXG4gICAgdGhpcy5taW4gPSBiZXRhLm1pbjtcclxuICAgIHRoaXMuc3BsaXRWYWx1ZSA9IGdhbW1hLm1pbjtcclxuICAgIHgubWF4ID0gdGhpcy5tYXg7XHJcbiAgICB4LnNwbGl0VmFsdWUgPSB0aGlzLm1pbjtcclxuXHJcbiAgICAvLyBTdGFydCByZWNvbXB1dGF0aW9uIG9mIHN0b3JlZCBpdGVtc1xyXG4gICAgY29uc3QgeUVkZ2VzID0gY2xlYW5BcnJheSggc2NyYXRjaEFycmF5IGFzIFRbXSApO1xyXG4gICAgeUVkZ2VzLnB1c2goIC4uLnRoaXMuaXRlbXMgKTtcclxuICAgIGNsZWFuQXJyYXkoIHRoaXMuaXRlbXMgKTtcclxuXHJcbiAgICAvLyBjb21iaW5lIGJldGEtZ2FtbWEgaW50byB5XHJcbiAgICBmb3IgKCBsZXQgaSA9IGdhbW1hLml0ZW1zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tICkge1xyXG4gICAgICBjb25zdCBlZGdlID0gZ2FtbWEuaXRlbXNbIGkgXTtcclxuICAgICAgY29uc3QgaW5kZXggPSBiZXRhLml0ZW1zLmluZGV4T2YoIGVkZ2UgKTtcclxuICAgICAgaWYgKCBpbmRleCA+PSAwICkge1xyXG4gICAgICAgIGdhbW1hLml0ZW1zLnNwbGljZSggaSwgMSApO1xyXG4gICAgICAgIGJldGEuaXRlbXMuc3BsaWNlKCBpbmRleCwgMSApO1xyXG4gICAgICAgIHRoaXMuaXRlbXMucHVzaCggZWRnZSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcHVzaCB4IHRvIGFscGhhIGFuZCBiZXRhXHJcbiAgICBhbHBoYS5pdGVtcy5wdXNoKCAuLi54Lml0ZW1zICk7XHJcbiAgICBiZXRhLml0ZW1zLnB1c2goIC4uLnguaXRlbXMgKTtcclxuICAgIGNsZWFuQXJyYXkoIHguaXRlbXMgKTtcclxuXHJcbiAgICAvLyB5IGl0ZW1zIHRvIHhcclxuICAgIHguaXRlbXMucHVzaCggLi4ueUVkZ2VzICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgYWZ0ZXIgYW4gaW5zZXJ0aW9uIChvciBwb3RlbnRpYWxseSBkZWxldGlvbiBpbiB0aGUgZnV0dXJlKSB0aGF0IGhhbmRsZXMgcmVkLWJsYWNrIHRyZWUgcmViYWxhbmNpbmcuXHJcbiAgICovXHJcbiAgcHVibGljIGZpeFJlZEJsYWNrKCB0cmVlOiBTZWdtZW50VHJlZTxUPiApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLmlzQmxhY2sgKTtcclxuXHJcbiAgICBpZiAoICF0aGlzLnBhcmVudCApIHtcclxuICAgICAgdGhpcy5pc0JsYWNrID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLnBhcmVudDtcclxuXHJcbiAgICAgIGlmICggIXBhcmVudC5pc0JsYWNrICkge1xyXG4gICAgICAgIC8vIER1ZSB0byByZWQtYmxhY2sgbmF0dXJlLCBncmFuZHBhcmVudCBzaG91bGQgZXhpc3Qgc2luY2UgaWYgcGFyZW50IHdhcyB0aGUgcm9vdCwgaXQgd291bGQgYmUgYmxhY2suXHJcbiAgICAgICAgY29uc3QgZ3JhbmRwYXJlbnQgPSBwYXJlbnQucGFyZW50ITtcclxuICAgICAgICBjb25zdCB1bmNsZSA9IGdyYW5kcGFyZW50Lm90aGVyQ2hpbGQoIHBhcmVudCApO1xyXG5cclxuICAgICAgICBpZiAoICF1bmNsZS5pc0JsYWNrICkge1xyXG4gICAgICAgICAgLy8gY2FzZSAxXHJcbiAgICAgICAgICBwYXJlbnQuaXNCbGFjayA9IHRydWU7XHJcbiAgICAgICAgICB1bmNsZS5pc0JsYWNrID0gdHJ1ZTtcclxuICAgICAgICAgIGdyYW5kcGFyZW50LmlzQmxhY2sgPSBmYWxzZTtcclxuICAgICAgICAgIGdyYW5kcGFyZW50LmZpeFJlZEJsYWNrKCB0cmVlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgaWYgKCBwYXJlbnQgPT09IGdyYW5kcGFyZW50LmxlZnQgKSB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcyA9PT0gcGFyZW50LnJpZ2h0ICkge1xyXG4gICAgICAgICAgICAgIC8vIGNhc2UgMlxyXG4gICAgICAgICAgICAgIHBhcmVudC5sZWZ0Um90YXRlKCB0cmVlICk7XHJcbiAgICAgICAgICAgICAgcGFyZW50LnBhcmVudCEuaXNCbGFjayA9IHRydWU7XHJcbiAgICAgICAgICAgICAgcGFyZW50LnBhcmVudCEucGFyZW50IS5pc0JsYWNrID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgcGFyZW50LnBhcmVudCEucGFyZW50IS5yaWdodFJvdGF0ZSggdHJlZSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgIC8vIGNhc2UgM1xyXG4gICAgICAgICAgICAgIHBhcmVudC5pc0JsYWNrID0gdHJ1ZTtcclxuICAgICAgICAgICAgICBncmFuZHBhcmVudC5pc0JsYWNrID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgZ3JhbmRwYXJlbnQucmlnaHRSb3RhdGUoIHRyZWUgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcyA9PT0gcGFyZW50LmxlZnQgKSB7XHJcbiAgICAgICAgICAgICAgLy8gY2FzZSAyXHJcbiAgICAgICAgICAgICAgcGFyZW50LnJpZ2h0Um90YXRlKCB0cmVlICk7XHJcbiAgICAgICAgICAgICAgcGFyZW50LnBhcmVudCEuaXNCbGFjayA9IHRydWU7XHJcbiAgICAgICAgICAgICAgcGFyZW50LnBhcmVudCEucGFyZW50IS5pc0JsYWNrID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgcGFyZW50LnBhcmVudCEucGFyZW50IS5sZWZ0Um90YXRlKCB0cmVlICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgLy8gY2FzZSAzXHJcbiAgICAgICAgICAgICAgcGFyZW50LmlzQmxhY2sgPSB0cnVlO1xyXG4gICAgICAgICAgICAgIGdyYW5kcGFyZW50LmlzQmxhY2sgPSBmYWxzZTtcclxuICAgICAgICAgICAgICBncmFuZHBhcmVudC5sZWZ0Um90YXRlKCB0cmVlICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyaWdnZXJzIGEgc3BsaXQgb2Ygd2hhdGV2ZXIgaW50ZXJ2YWwgY29udGFpbnMgdGhpcyB2YWx1ZSAob3IgaXMgYSBuby1vcCBpZiB3ZSBhbHJlYWR5IHNwbGl0IGF0IGl0IGJlZm9yZSkuXHJcbiAgICovXHJcbiAgcHVibGljIHNwbGl0KCBuOiBudW1iZXIsIHRyZWU6IFNlZ21lbnRUcmVlPFQ+ICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5jb250YWlucyggbiApICk7XHJcblxyXG4gICAgLy8gSWdub3JlIHNwbGl0cyBpZiB3ZSBhcmUgYWxyZWFkeSBzcGxpdCBvbiB0aGVtXHJcbiAgICBpZiAoIG4gPT09IHRoaXMubWluIHx8IG4gPT09IHRoaXMubWF4ICkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0aGlzLmhhc0NoaWxkcmVuKCkgKSB7XHJcbiAgICAgIC8vIElmIG91ciBzcGxpdCB2YWx1ZSBpcyB0aGUgc2FtZSBhcyBvdXIgY3VycmVudCBvbmUsIHdlJ3ZlIGFscmVhZHkgc3BsaXQgb24gdGhhdFxyXG4gICAgICBpZiAoIHRoaXMuc3BsaXRWYWx1ZSAhPT0gbiApIHtcclxuICAgICAgICAoIG4gPiB0aGlzLnNwbGl0VmFsdWUhID8gdGhpcy5yaWdodCA6IHRoaXMubGVmdCApIS5zcGxpdCggbiwgdHJlZSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy5zcGxpdFZhbHVlID0gbjtcclxuXHJcbiAgICAgIGNvbnN0IG5ld0xlZnQgPSBTZWdtZW50Tm9kZS5wb29sLmNyZWF0ZSggdGhpcy50cmVlLCB0aGlzLm1pbiwgbiApIGFzIFNlZ21lbnROb2RlPFQ+O1xyXG4gICAgICBuZXdMZWZ0LnBhcmVudCA9IHRoaXM7XHJcbiAgICAgIHRoaXMubGVmdCA9IG5ld0xlZnQ7XHJcblxyXG4gICAgICBjb25zdCBuZXdSaWdodCA9IFNlZ21lbnROb2RlLnBvb2wuY3JlYXRlKCB0aGlzLnRyZWUsIG4sIHRoaXMubWF4ICkgYXMgU2VnbWVudE5vZGU8VD47XHJcbiAgICAgIG5ld1JpZ2h0LnBhcmVudCA9IHRoaXM7XHJcbiAgICAgIHRoaXMucmlnaHQgPSBuZXdSaWdodDtcclxuXHJcbiAgICAgIC8vIENoZWNrIGlmIHdlIG5lZWQgdG8gZG8gcmVkLWJsYWNrIHRyZWUgYmFsYW5jaW5nXHJcbiAgICAgIGlmICggIXRoaXMuaXNCbGFjayAmJiB0aGlzLnBhcmVudCApIHtcclxuICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLnBhcmVudDtcclxuICAgICAgICBjb25zdCBzaWJsaW5nID0gcGFyZW50Lm90aGVyQ2hpbGQoIHRoaXMgKTtcclxuICAgICAgICBpZiAoIHNpYmxpbmcuaXNCbGFjayApIHtcclxuICAgICAgICAgIGlmICggdGhpcyA9PT0gcGFyZW50LmxlZnQgKSB7XHJcbiAgICAgICAgICAgIHBhcmVudC5yaWdodFJvdGF0ZSggdHJlZSApO1xyXG4gICAgICAgICAgICBuZXdMZWZ0LmlzQmxhY2sgPSB0cnVlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHBhcmVudC5sZWZ0Um90YXRlKCB0cmVlICk7XHJcbiAgICAgICAgICAgIG5ld1JpZ2h0LmlzQmxhY2sgPSB0cnVlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdGhpcy5maXhSZWRCbGFjayggdHJlZSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIC8vIGNhc2UgMVxyXG4gICAgICAgICAgdGhpcy5pc0JsYWNrID0gdHJ1ZTtcclxuICAgICAgICAgIHNpYmxpbmcuaXNCbGFjayA9IHRydWU7XHJcbiAgICAgICAgICBwYXJlbnQuaXNCbGFjayA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgIHBhcmVudC5maXhSZWRCbGFjayggdHJlZSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVjdXJzaXZlbHkgYWRkcyBhbiBpdGVtXHJcbiAgICovXHJcbiAgcHVibGljIGFkZEl0ZW0oIGl0ZW06IFQsIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlciApOiB2b2lkIHtcclxuICAgIC8vIElnbm9yZSBuby1vdmVybGFwIGNhc2VzXHJcbiAgICBpZiAoIHRoaXMubWluID4gbWF4IHx8IHRoaXMubWF4IDwgbWluICkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0aGlzLm1pbiA+PSBtaW4gJiYgdGhpcy5tYXggPD0gbWF4ICkge1xyXG4gICAgICAvLyBXZSBhcmUgZnVsbHkgY29udGFpbmVkXHJcbiAgICAgIHRoaXMuaXRlbXMucHVzaCggaXRlbSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHRoaXMuaGFzQ2hpbGRyZW4oKSApIHtcclxuICAgICAgdGhpcy5sZWZ0IS5hZGRJdGVtKCBpdGVtLCBtaW4sIG1heCApO1xyXG4gICAgICB0aGlzLnJpZ2h0IS5hZGRJdGVtKCBpdGVtLCBtaW4sIG1heCApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVjdXJzaXZlbHkgcmVtb3ZlcyBhbiBpdGVtXHJcbiAgICovXHJcbiAgcHVibGljIHJlbW92ZUl0ZW0oIGl0ZW06IFQsIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlciApOiB2b2lkIHtcclxuICAgIC8vIElnbm9yZSBuby1vdmVybGFwIGNhc2VzXHJcbiAgICBpZiAoIHRoaXMubWluID4gbWF4IHx8IHRoaXMubWF4IDwgbWluICkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0aGlzLm1pbiA+PSBtaW4gJiYgdGhpcy5tYXggPD0gbWF4ICkge1xyXG4gICAgICAvLyBXZSBhcmUgZnVsbHkgY29udGFpbmVkXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuaXRlbXMuaW5jbHVkZXMoIGl0ZW0gKSApO1xyXG4gICAgICBhcnJheVJlbW92ZSggdGhpcy5pdGVtcywgaXRlbSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHRoaXMuaGFzQ2hpbGRyZW4oKSApIHtcclxuICAgICAgdGhpcy5sZWZ0IS5yZW1vdmVJdGVtKCBpdGVtLCBtaW4sIG1heCApO1xyXG4gICAgICB0aGlzLnJpZ2h0IS5yZW1vdmVJdGVtKCBpdGVtLCBtaW4sIG1heCApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVjdXJzaXZlbHkgYXVkaXRzIHdpdGggYXNzZXJ0aW9ucywgY2hlY2tpbmcgYWxsIG9mIG91ciBhc3N1bXB0aW9ucy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBlcHNpbG9uXHJcbiAgICogQHBhcmFtIGFsbEl0ZW1zIC0gQWxsIGl0ZW1zIGluIHRoZSB0cmVlXHJcbiAgICogQHBhcmFtIHByZXNlbnRJdGVtcyAtIEVkZ2VzIHRoYXQgd2VyZSBwcmVzZW50IGluIGFuY2VzdG9yc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBhdWRpdCggZXBzaWxvbjogbnVtYmVyLCBhbGxJdGVtczogU2V0PFQ+LCBwcmVzZW50SXRlbXM6IFRbXSA9IFtdICk6IHZvaWQge1xyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgIGZvciAoIGNvbnN0IGl0ZW0gb2YgcHJlc2VudEl0ZW1zICkge1xyXG4gICAgICAgIGFzc2VydCggIXRoaXMuaXRlbXMuaW5jbHVkZXMoIGl0ZW0gKSApO1xyXG4gICAgICB9XHJcbiAgICAgIGZvciAoIGNvbnN0IGl0ZW0gb2YgdGhpcy5pdGVtcyApIHtcclxuICAgICAgICAvLyBDb250YWlubWVudCBjaGVjaywgdGhpcyBub2RlIHNob3VsZCBiZSBmdWxseSBjb250YWluZWRcclxuICAgICAgICBhc3NlcnQoIHRoaXMudHJlZS5nZXRNaW5YKCBpdGVtLCBlcHNpbG9uICkgPD0gdGhpcy5taW4gKTtcclxuICAgICAgICBhc3NlcnQoIHRoaXMudHJlZS5nZXRNYXhYKCBpdGVtLCBlcHNpbG9uICkgPj0gdGhpcy5tYXggKTtcclxuICAgICAgfVxyXG4gICAgICBmb3IgKCBjb25zdCBpdGVtIG9mIHByZXNlbnRJdGVtcyApIHtcclxuICAgICAgICBpZiAoIHRoaXMudHJlZS5nZXRNaW5YKCBpdGVtLCBlcHNpbG9uICkgPD0gdGhpcy5taW4gJiYgdGhpcy50cmVlLmdldE1heFgoIGl0ZW0sIGVwc2lsb24gKSA+PSB0aGlzLm1heCApIHtcclxuICAgICAgICAgIGFzc2VydCggYWxsSXRlbXMuaGFzKCBpdGVtICkgfHwgdGhpcy5pdGVtcy5pbmNsdWRlcyggaXRlbSApICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBhc3NlcnQoIHRoaXMuaGFzQ2hpbGRyZW4oKSA9PT0gKCB0aGlzLmxlZnQgIT09IG51bGwgKSApO1xyXG4gICAgICBhc3NlcnQoIHRoaXMuaGFzQ2hpbGRyZW4oKSA9PT0gKCB0aGlzLnJpZ2h0ICE9PSBudWxsICkgKTtcclxuICAgICAgYXNzZXJ0KCB0aGlzLmhhc0NoaWxkcmVuKCkgPT09ICggdGhpcy5zcGxpdFZhbHVlICE9PSBudWxsICkgKTtcclxuICAgICAgYXNzZXJ0KCB0aGlzLm1pbiA8IHRoaXMubWF4ICk7XHJcblxyXG4gICAgICBpZiAoIHRoaXMucGFyZW50ICkge1xyXG4gICAgICAgIGFzc2VydCggdGhpcy5wYXJlbnQuaGFzQ2hpbGQoIHRoaXMgKSApO1xyXG4gICAgICAgIGFzc2VydCggdGhpcy5pc0JsYWNrIHx8IHRoaXMucGFyZW50LmlzQmxhY2sgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIHRoaXMuaGFzQ2hpbGRyZW4oKSApIHtcclxuICAgICAgICBhc3NlcnQoIHRoaXMubGVmdCEucGFyZW50ID09PSB0aGlzICk7XHJcbiAgICAgICAgYXNzZXJ0KCB0aGlzLnJpZ2h0IS5wYXJlbnQgPT09IHRoaXMgKTtcclxuICAgICAgICBhc3NlcnQoIHRoaXMubWluID09PSB0aGlzLmxlZnQhLm1pbiApO1xyXG4gICAgICAgIGFzc2VydCggdGhpcy5tYXggPT09IHRoaXMucmlnaHQhLm1heCApO1xyXG4gICAgICAgIGFzc2VydCggdGhpcy5zcGxpdFZhbHVlID09PSB0aGlzLmxlZnQhLm1heCApO1xyXG4gICAgICAgIGFzc2VydCggdGhpcy5zcGxpdFZhbHVlID09PSB0aGlzLnJpZ2h0IS5taW4gKTtcclxuXHJcbiAgICAgICAgZm9yICggY29uc3QgaXRlbSBvZiB0aGlzLmxlZnQhLml0ZW1zICkge1xyXG4gICAgICAgICAgYXNzZXJ0KCAhdGhpcy5yaWdodCEuaXRlbXMuaW5jbHVkZXMoIGl0ZW0gKSwgJ1dlIHNob3VsZG5cXCd0IGhhdmUgdHdvIGNoaWxkcmVuIHdpdGggdGhlIHNhbWUgaXRlbScgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGNoaWxkUHJlc2VudEl0ZW1zID0gWyAuLi5wcmVzZW50SXRlbXMsIC4uLnRoaXMuaXRlbXMgXTtcclxuICAgICAgICB0aGlzLmxlZnQhLmF1ZGl0KCBlcHNpbG9uLCBhbGxJdGVtcywgY2hpbGRQcmVzZW50SXRlbXMgKTtcclxuICAgICAgICB0aGlzLnJpZ2h0IS5hdWRpdCggZXBzaWxvbiwgYWxsSXRlbXMsIGNoaWxkUHJlc2VudEl0ZW1zICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyB0b1N0cmluZygpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGBbJHt0aGlzLm1pbn0gJHt0aGlzLm1heH1dIHNwbGl0OiR7dGhpcy5zcGxpdFZhbHVlfSAke3RoaXMuaXNCbGFjayA/ICdibGFjaycgOiAncmVkJ30gJHt0aGlzLml0ZW1zfWA7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZnJlZVRvUG9vbCgpOiB2b2lkIHtcclxuICAgIFNlZ21lbnROb2RlLnBvb2wuZnJlZVRvUG9vbCggdGhpcyApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBwb29sID0gbmV3IFBvb2woIFNlZ21lbnROb2RlICk7XHJcblxyXG59XHJcblxyXG5raXRlLnJlZ2lzdGVyKCAnU2VnbWVudFRyZWUnLCBTZWdtZW50VHJlZSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsV0FBVyxNQUFNLHNDQUFzQztBQUM5RCxPQUFPQyxVQUFVLE1BQU0scUNBQXFDO0FBQzVELE9BQU9DLElBQUksTUFBTSwrQkFBK0I7QUFDaEQsU0FBZUMsSUFBSSxRQUFRLGVBQWU7QUFFMUMsSUFBSUMsUUFBUSxHQUFHLENBQUM7QUFDaEIsTUFBTUMsWUFBb0IsR0FBRyxFQUFFO0FBTy9CLGVBQWUsTUFBZUMsV0FBVyxDQUE4QjtFQUlyRTs7RUFHQTs7RUFHQTtBQUNGO0FBQ0E7QUFDQTtFQUNTQyxXQUFXQSxDQUFFQyxPQUFPLEdBQUcsSUFBSSxFQUFHO0lBQ25DLElBQUksQ0FBQ0MsUUFBUSxHQUFHQyxXQUFXLENBQUNDLElBQUksQ0FBQ0MsTUFBTSxDQUFF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