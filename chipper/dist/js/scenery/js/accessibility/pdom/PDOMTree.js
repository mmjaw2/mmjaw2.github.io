// Copyright 2018-2024, University of Colorado Boulder

/**
 * The main logic for maintaining the PDOM instance tree (see https://github.com/phetsims/scenery-phet/issues/365)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import arrayDifference from '../../../../phet-core/js/arrayDifference.js';
import { BrowserEvents, FocusManager, Node, PartialPDOMTrail, PDOMInstance, scenery, Trail } from '../../imports.js';
const PDOMTree = {
  /**
   * Called when a child node is added to a parent node (and the child is likely to have pdom content).
   * @public
   *
   * @param {Node} parent
   * @param {Node} child
   */
  addChild(parent, child) {
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.PDOMTree(`addChild parent:n#${parent._id}, child:n#${child._id}`);
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.push();
    assert && assert(parent instanceof Node);
    assert && assert(child instanceof Node);
    assert && assert(!child._rendererSummary.hasNoPDOM());
    const focusedNode = PDOMTree.beforeOp();
    if (!child._pdomParent) {
      PDOMTree.addTree(parent, child);
    }
    PDOMTree.afterOp(focusedNode);
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.pop();
  },
  /**
   * Called when a child node is removed from a parent node (and the child is likely to have pdom content).
   * @public
   *
   * @param {Node} parent
   * @param {Node} child
   */
  removeChild(parent, child) {
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.PDOMTree(`removeChild parent:n#${parent._id}, child:n#${child._id}`);
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.push();
    assert && assert(parent instanceof Node);
    assert && assert(child instanceof Node);
    assert && assert(!child._rendererSummary.hasNoPDOM());
    const focusedNode = PDOMTree.beforeOp();
    if (!child._pdomParent) {
      PDOMTree.removeTree(parent, child);
    }
    PDOMTree.afterOp(focusedNode);
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.pop();
  },
  /**
   * Called when a node's children are reordered (no additions/removals).
   * @public
   *
   * @param {Node} node
   */
  childrenOrderChange(node) {
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.PDOMTree(`childrenOrderChange node:n#${node._id}`);
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.push();
    assert && assert(node instanceof Node);
    assert && assert(!node._rendererSummary.hasNoPDOM());
    const focusedNode = PDOMTree.beforeOp();
    PDOMTree.reorder(node);
    PDOMTree.afterOp(focusedNode);
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.pop();
  },
  /**
   * Called when a node has a pdomOrder change.
   * @public
   *
   * @param {Node} node
   * @param {Array.<Node|null>|null} oldOrder
   * @param {Array.<Node|null>|null} newOrder
   */
  pdomOrderChange(node, oldOrder, newOrder) {
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.PDOMTree(`pdomOrderChange n#${node._id}: ${PDOMTree.debugOrder(oldOrder)},${PDOMTree.debugOrder(newOrder)}`);
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.push();
    assert && assert(node instanceof Node);
    const focusedNode = PDOMTree.beforeOp();
    const removedItems = []; // {Array.<Node|null>} - May contain the placeholder null
    const addedItems = []; // {Array.<Node|null>} - May contain the placeholder null

    arrayDifference(oldOrder || [], newOrder || [], removedItems, addedItems);
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.PDOMTree(`removed: ${PDOMTree.debugOrder(removedItems)}`);
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.PDOMTree(`added: ${PDOMTree.debugOrder(addedItems)}`);
    let i;
    let j;

    // Check some initial conditions
    if (assert) {
      for (i = 0; i < removedItems; i++) {
        assert(removedItems[i] === null || removedItems[i]._pdomParent === node, 'Node should have had a pdomOrder');
      }
      for (i = 0; i < addedItems; i++) {
        assert(addedItems[i] === null || addedItems[i]._pdomParent === null, 'Node is already specified in a pdomOrder');
      }
    }

    // NOTE: Performance could be improved in some cases if we can avoid rebuilding a pdom tree for DIRECT children
    // when changing whether they are present in the pdomOrder. Basically, if something is a child and NOT
    // in a pdomOrder, changing its parent's order to include it (or vice versa) triggers a rebuild when it
    // would not strictly be necessary.

    const pdomTrails = PDOMTree.findPDOMTrails(node);

    // Remove subtrees from us (that were removed)
    for (i = 0; i < removedItems.length; i++) {
      const removedItemToRemove = removedItems[i];
      if (removedItemToRemove) {
        PDOMTree.removeTree(node, removedItemToRemove, pdomTrails);
        removedItemToRemove._pdomParent = null;
        removedItemToRemove.pdomParentChangedEmitter.emit();
      }
    }

    // Remove subtrees from their parents (that will be added here instead)
    for (i = 0; i < addedItems.length; i++) {
      const addedItemToRemove = addedItems[i];
      if (addedItemToRemove) {
        const removedParents = addedItemToRemove._parents;
        for (j = 0; j < removedParents.length; j++) {
          PDOMTree.removeTree(removedParents[j], addedItemToRemove);
        }
        addedItemToRemove._pdomParent = node;
        addedItemToRemove.pdomParentChangedEmitter.emit();
      }
    }

    // Add subtrees to their parents (that were removed from our order)
    for (i = 0; i < removedItems.length; i++) {
      const removedItemToAdd = removedItems[i];
      if (removedItemToAdd) {
        const addedParents = removedItemToAdd._parents;
        for (j = 0; j < addedParents.length; j++) {
          PDOMTree.addTree(addedParents[j], removedItemToAdd);
        }
      }
    }

    // Add subtrees to us (that were added in this order change)
    for (i = 0; i < addedItems.length; i++) {
      const addedItemToAdd = addedItems[i];
      addedItemToAdd && PDOMTree.addTree(node, addedItemToAdd, pdomTrails);
    }
    PDOMTree.reorder(node, pdomTrails);
    PDOMTree.afterOp(focusedNode);
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.pop();
  },
  /**
   * Called when a node has a pdomContent change.
   * @public
   *
   * @param {Node} node
   */
  pdomContentChange(node) {
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.PDOMTree(`pdomContentChange n#${node._id}`);
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.push();
    assert && assert(node instanceof Node);
    const focusedNode = PDOMTree.beforeOp();
    let i;
    const parents = node._pdomParent ? [node._pdomParent] : node._parents;
    const pdomTrailsList = []; // pdomTrailsList[ i ] := PDOMTree.findPDOMTrails( parents[ i ] )

    // For now, just regenerate the full tree. Could optimize in the future, if we can swap the content for an
    // PDOMInstance.
    for (i = 0; i < parents.length; i++) {
      const parent = parents[i];
      const pdomTrails = PDOMTree.findPDOMTrails(parent);
      pdomTrailsList.push(pdomTrails);
      PDOMTree.removeTree(parent, node, pdomTrails);
    }

    // Do all removals before adding anything back in.
    for (i = 0; i < parents.length; i++) {
      PDOMTree.addTree(parents[i], node, pdomTrailsList[i]);
    }

    // An edge case is where we change the rootNode of the display (and don't have an effective parent)
    for (i = 0; i < node._rootedDisplays.length; i++) {
      const display = node._rootedDisplays[i];
      if (display._accessible) {
        PDOMTree.rebuildInstanceTree(display._rootPDOMInstance);
      }
    }
    PDOMTree.afterOp(focusedNode);
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.pop();
  },
  /**
   * Sets up a root instance with a given root node.
   * @public
   *
   * @param {PDOMInstance} rootInstance
   */
  rebuildInstanceTree(rootInstance) {
    const rootNode = rootInstance.display.rootNode;
    assert && assert(rootNode);
    rootInstance.removeAllChildren();
    rootInstance.addConsecutiveInstances(PDOMTree.createTree(new Trail(rootNode), rootInstance.display, rootInstance));
  },
  /**
   * Handles the conceptual addition of a pdom subtree.
   * @private
   *
   * @param {Node} parent
   * @param {Node} child
   * @param {Array.<PartialPDOMTrail>} [pdomTrails] - Will be computed if needed
   */
  addTree(parent, child, pdomTrails) {
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.PDOMTree(`addTree parent:n#${parent._id}, child:n#${child._id}`);
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.push();
    assert && PDOMTree.auditNodeForPDOMCycles(parent);
    pdomTrails = pdomTrails || PDOMTree.findPDOMTrails(parent);
    for (let i = 0; i < pdomTrails.length; i++) {
      sceneryLog && sceneryLog.PDOMTree && sceneryLog.PDOMTree(`trail: ${pdomTrails[i].trail.toString()} full:${pdomTrails[i].fullTrail.toString()} for ${pdomTrails[i].pdomInstance.toString()} root:${pdomTrails[i].isRoot}`);
      sceneryLog && sceneryLog.PDOMTree && sceneryLog.push();
      const partialTrail = pdomTrails[i];
      const parentInstance = partialTrail.pdomInstance;

      // The full trail doesn't have the child in it, so we temporarily add that for tree creation
      partialTrail.fullTrail.addDescendant(child);
      const childInstances = PDOMTree.createTree(partialTrail.fullTrail, parentInstance.display, parentInstance);
      partialTrail.fullTrail.removeDescendant(child);
      parentInstance.addConsecutiveInstances(childInstances);
      sceneryLog && sceneryLog.PDOMTree && sceneryLog.pop();
    }
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.pop();
  },
  /**
   * Handles the conceptual removal of a pdom subtree.
   * @private
   *
   * @param {Node} parent
   * @param {Node} child
   * @param {Array.<PartialPDOMTrail>} [pdomTrails] - Will be computed if needed
   */
  removeTree(parent, child, pdomTrails) {
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.PDOMTree(`removeTree parent:n#${parent._id}, child:n#${child._id}`);
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.push();
    pdomTrails = pdomTrails || PDOMTree.findPDOMTrails(parent);
    for (let i = 0; i < pdomTrails.length; i++) {
      const partialTrail = pdomTrails[i];

      // The full trail doesn't have the child in it, so we temporarily add that for tree removal
      partialTrail.fullTrail.addDescendant(child);
      partialTrail.pdomInstance.removeInstancesForTrail(partialTrail.fullTrail);
      partialTrail.fullTrail.removeDescendant(child);
    }
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.pop();
  },
  /**
   * Handles the conceptual sorting of a pdom subtree.
   * @private
   *
   * @param {Node} node
   * @param {Array.<PartialPDOMTrail>} [pdomTrails] - Will be computed if needed
   */
  reorder(node, pdomTrails) {
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.PDOMTree(`reorder n#${node._id}`);
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.push();
    pdomTrails = pdomTrails || PDOMTree.findPDOMTrails(node);
    for (let i = 0; i < pdomTrails.length; i++) {
      const partialTrail = pdomTrails[i];

      // TODO: does it optimize things to pass the partial trail in (so we scan less)? https://github.com/phetsims/scenery/issues/1581
      partialTrail.pdomInstance.sortChildren();
    }
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.pop();
  },
  /**
   * Creates PDOM instances, returning an array of instances that should be added to the next level.
   * @private
   *
   * NOTE: Trails for which an already-existing instance exists will NOT create a new instance here. We only want to
   * fill in the "missing" structure. There are cases (a.children=[b,c], b.children=[c]) where removing an
   * pdomOrder can trigger addTree(a,b) AND addTree(b,c), and we can't create duplicate content.
   *
   * @param {Trail} trail
   * @param {Display} display
   * @param {PDOMInstance} parentInstance - Since we don't create the root here, can't be null
   * @returns {Array.<PDOMInstance>}
   */
  createTree(trail, display, parentInstance) {
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.PDOMTree(`createTree ${trail.toString()} parent:${parentInstance ? parentInstance.toString() : 'null'}`);
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.push();
    const node = trail.lastNode();
    const effectiveChildren = node.getEffectiveChildren();
    sceneryLog && sceneryLog.PDOMTree && sceneryLog.PDOMTree(`effectiveChildren: ${PDOMTree.debugOrder(effectiveChildren)}`);

    // If we have pdom content ourself, we need to create the instance (so we can provide it to child instances).
    let instance;
    let existed = false;
    if (node.hasPDOMContent) {
      instance = parentInstance.findChildWithTrail(trail);
      if (instance) {
        existed = true;
      } else {
        instance = PDOMInstance.pool.create(parentInstance, display, trail.copy());
      }

      // If there was an instance, then it should be the parent to effective children, otherwise, it isn't part of the
      // trail.
      parentInstance = instance;
    }

    // Create all of the direct-child instances.
    const childInstances = [];
    for (let i = 0; i < effectiveChildren.length; i++) {
      trail.addDescendant(effectiveChildren[i], i);
      Array.prototype.push.apply(childInstances, PDOMTree.createTree(trail, display, parentInstance));
      trail.removeDescendant();
    }

    // If we have an instance, hook things up, and return just it.
    if (instance) {
      instance.addConsecutiveInstances(childInstances);
      sceneryLog && sceneryLog.PDOMTree && sceneryLog.pop();
      return existed ? [] : [instance];
    }
    // Otherwise pass things forward so they can be added as children by the parentInstance
    else {
      sceneryLog && sceneryLog.PDOMTree && sceneryLog.pop();
      return childInstances;
    }
  },
  /**
   * Prepares for a pdom-tree-changing operation (saving some state). During DOM operations we don't want Display
   * input to dispatch events as focus changes.
   * @private
   * @returns {Node|null}
   */
  beforeOp() {
    BrowserEvents.blockFocusCallbacks = true;
    return FocusManager.pdomFocusedNode;
  },
  /**
   * Finalizes a pdom-tree-changing operation (restoring some state).
   * @param {Node|null} focusedNode
   * @private
   */
  afterOp(focusedNode) {
    focusedNode && focusedNode.focusable && focusedNode.focus();
    BrowserEvents.blockFocusCallbacks = false;
  },
  /**
   * Returns all "pdom" trails from this node ancestor-wise to nodes that have display roots.
   * @private
   *
   * NOTE: "pdom" trails may not have strict parent-child relationships between adjacent nodes, as remapping of
   * the tree can have a "PDOM parent" and "pdom child" case (the child is in the parent's pdomOrder).
   *
   * @param {Node} node
   * @returns {Array.<PartialPDOMTrail>}
   */
  findPDOMTrails(node) {
    const trails = [];
    PDOMTree.recursivePDOMTrailSearch(trails, new Trail(node));
    return trails;
  },
  /**
   * Finds all partial "pdom" trails
   * @private
   *
   * @param {Array.<PartialPDOMTrail>} trailResults - Mutated, this is how we "return" our value.
   * @param {Trail} trail - Where to start from
   */
  recursivePDOMTrailSearch(trailResults, trail) {
    const root = trail.rootNode();
    let i;

    // If we find pdom content, our search ends here. IF it is connected to any accessible pdom displays somehow, it
    // will have pdom instances. We only care about these pdom instances, as they already have any DAG
    // deduplication applied.
    if (root.hasPDOMContent) {
      const instances = root.pdomInstances;
      for (i = 0; i < instances.length; i++) {
        trailResults.push(new PartialPDOMTrail(instances[i], trail.copy(), false));
      }
      return;
    }
    // Otherwise check for accessible pdom displays for which our node is the rootNode.
    else {
      const rootedDisplays = root.rootedDisplays;
      for (i = 0; i < rootedDisplays.length; i++) {
        const display = rootedDisplays[i];
        if (display._accessible) {
          trailResults.push(new PartialPDOMTrail(display._rootPDOMInstance, trail.copy(), true));
        }
      }
    }
    const parents = root._pdomParent ? [root._pdomParent] : root._parents;
    const parentCount = parents.length;
    for (i = 0; i < parentCount; i++) {
      const parent = parents[i];
      trail.addAncestor(parent);
      PDOMTree.recursivePDOMTrailSearch(trailResults, trail);
      trail.removeAncestor();
    }
  },
  /**
   * Ensures that the pdomDisplays on the node (and its subtree) are accurate.
   * @public
   */
  auditPDOMDisplays(node) {
    if (assertSlow) {
      if (node._pdomDisplaysInfo.canHavePDOMDisplays()) {
        let i;
        const displays = [];

        // Concatenation of our parents' pdomDisplays
        for (i = 0; i < node._parents.length; i++) {
          Array.prototype.push.apply(displays, node._parents[i]._pdomDisplaysInfo.pdomDisplays);
        }

        // And concatenation of any rooted displays (that support pdom)
        for (i = 0; i < node._rootedDisplays.length; i++) {
          const display = node._rootedDisplays[i];
          if (display._accessible) {
            displays.push(display);
          }
        }
        const actualArray = node._pdomDisplaysInfo.pdomDisplays.slice();
        const expectedArray = displays.slice(); // slice helps in debugging
        assertSlow(actualArray.length === expectedArray.length);
        for (i = 0; i < expectedArray.length; i++) {
          for (let j = 0; j < actualArray.length; j++) {
            if (expectedArray[i] === actualArray[j]) {
              expectedArray.splice(i, 1);
              actualArray.splice(j, 1);
              i--;
              break;
            }
          }
        }
        assertSlow(actualArray.length === 0 && expectedArray.length === 0, 'Mismatch with accessible pdom displays');
      } else {
        assertSlow(node._pdomDisplaysInfo.pdomDisplays.length === 0, 'Invisible/nonaccessible things should have no displays');
      }
    }
  },
  /**
   * Checks a given Node (with assertions) to ensure it is not part of a cycle in the combined graph with edges
   * defined by "there is a parent-child or pdomParent-pdomOrder" relationship between the two nodes.
   * @public (scenery-internal)
   *
   * See https://github.com/phetsims/scenery/issues/787 for more information (and for some detail on the cases
   * that we want to catch).
   *
   * @param {Node} node
   */
  auditNodeForPDOMCycles(node) {
    if (assert) {
      const trail = new Trail(node);
      (function recursiveSearch() {
        const root = trail.rootNode();
        assert(trail.length <= 1 || root !== node, `${'Accessible PDOM graph cycle detected. The combined scene-graph DAG with pdomOrder defining additional ' + 'parent-child relationships should still be a DAG. Cycle detected with the trail: '}${trail.toString()} path: ${trail.toPathString()}`);
        const parentCount = root._parents.length;
        for (let i = 0; i < parentCount; i++) {
          const parent = root._parents[i];
          trail.addAncestor(parent);
          recursiveSearch();
          trail.removeAncestor();
        }
        // Only visit the pdomParent if we didn't already visit it as a parent.
        if (root._pdomParent && !root._pdomParent.hasChild(root)) {
          trail.addAncestor(root._pdomParent);
          recursiveSearch();
          trail.removeAncestor();
        }
      })();
    }
  },
  /**
   * Returns a string representation of an order (using Node ids) for debugging.
   * @private
   *
   * @param {Array.<Node|null>|null} pdomOrder
   * @returns {string}
   */
  debugOrder(pdomOrder) {
    if (pdomOrder === null) {
      return 'null';
    }
    return `[${pdomOrder.map(nodeOrNull => nodeOrNull === null ? 'null' : nodeOrNull._id).join(',')}]`;
  }
};
scenery.register('PDOMTree', PDOMTree);
export default PDOMTree;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhcnJheURpZmZlcmVuY2UiLCJCcm93c2VyRXZlbnRzIiwiRm9jdXNNYW5hZ2VyIiwiTm9kZSIsIlBhcnRpYWxQRE9NVHJhaWwiLCJQRE9NSW5zdGFuY2UiLCJzY2VuZXJ5IiwiVHJhaWwiLCJQRE9NVHJlZSIsImFkZENoaWxkIiwicGFyZW50IiwiY2hpbGQiLCJzY2VuZXJ5TG9nIiwiX2lkIiwicHVzaCIsImFzc2VydCIsIl9yZW5kZXJlclN1bW1hcnkiLCJoYXNOb1BET00iLCJmb2N1c2VkTm9kZSIsImJlZm9yZU9wIiwiX3Bkb21QYXJlbnQiLCJhZGRUcmVlIiwiYWZ0ZXJPcCIsInBvcCIsInJlbW92ZUNoaWxkIiwicmVtb3ZlVHJlZSIsImNoaWxkcmVuT3JkZXJDaGFuZ2UiLCJub2RlIiwicmVvcmRlciIsInBkb21PcmRlckNoYW5nZSIsIm9sZE9yZGVyIiwibmV3T3JkZXIiLCJkZWJ1Z09yZGVyIiwicmVtb3ZlZEl0ZW1zIiwiYWRkZWRJdGVtcyIsImkiLCJqIiwicGRvbVRyYWlscyIsImZpbmRQRE9NVHJhaWxzIiwibGVuZ3RoIiwicmVtb3ZlZEl0ZW1Ub1JlbW92ZSIsInBkb21QYXJlbnRDaGFuZ2VkRW1pdHRlciIsImVtaXQiLCJhZGRlZEl0ZW1Ub1JlbW92ZSIsInJlbW92ZWRQYXJlbnRzIiwiX3BhcmVudHMiLCJyZW1vdmVkSXRlbVRvQWRkIiwiYWRkZWRQYXJlbnRzIiwiYWRkZWRJdGVtVG9BZGQiLCJwZG9tQ29udGVudENoYW5nZSIsInBhcmVudHMiLCJwZG9tVHJhaWxzTGlzdCIsIl9yb290ZWREaXNwbGF5cyIsImRpc3BsYXkiLCJfYWNjZXNzaWJsZSIsInJlYnVpbGRJbnN0YW5jZVRyZWUiLCJfcm9vdFBET01JbnN0YW5jZSIsInJvb3RJbnN0YW5jZSIsInJvb3ROb2RlIiwicmVtb3ZlQWxsQ2hpbGRyZW4iLCJhZGRDb25zZWN1dGl2ZUluc3RhbmNlcyIsImNyZWF0ZVRyZWUiLCJhdWRpdE5vZGVGb3JQRE9NQ3ljbGVzIiwidHJhaWwiLCJ0b1N0cmluZyIsImZ1bGxUcmFpbCIsInBkb21JbnN0YW5jZSIsImlzUm9vdCIsInBhcnRpYWxUcmFpbCIsInBhcmVudEluc3RhbmNlIiwiYWRkRGVzY2VuZGFudCIsImNoaWxkSW5zdGFuY2VzIiwicmVtb3ZlRGVzY2VuZGFudCIsInJlbW92ZUluc3RhbmNlc0ZvclRyYWlsIiwic29ydENoaWxkcmVuIiwibGFzdE5vZGUiLCJlZmZlY3RpdmVDaGlsZHJlbiIsImdldEVmZmVjdGl2ZUNoaWxkcmVuIiwiaW5zdGFuY2UiLCJleGlzdGVkIiwiaGFzUERPTUNvbnRlbnQiLCJmaW5kQ2hpbGRXaXRoVHJhaWwiLCJwb29sIiwiY3JlYXRlIiwiY29weSIsIkFycmF5IiwicHJvdG90eXBlIiwiYXBwbHkiLCJibG9ja0ZvY3VzQ2FsbGJhY2tzIiwicGRvbUZvY3VzZWROb2RlIiwiZm9jdXNhYmxlIiwiZm9jdXMiLCJ0cmFpbHMiLCJyZWN1cnNpdmVQRE9NVHJhaWxTZWFyY2giLCJ0cmFpbFJlc3VsdHMiLCJyb290IiwiaW5zdGFuY2VzIiwicGRvbUluc3RhbmNlcyIsInJvb3RlZERpc3BsYXlzIiwicGFyZW50Q291bnQiLCJhZGRBbmNlc3RvciIsInJlbW92ZUFuY2VzdG9yIiwiYXVkaXRQRE9NRGlzcGxheXMiLCJhc3NlcnRTbG93IiwiX3Bkb21EaXNwbGF5c0luZm8iLCJjYW5IYXZlUERPTURpc3BsYXlzIiwiZGlzcGxheXMiLCJwZG9tRGlzcGxheXMiLCJhY3R1YWxBcnJheSIsInNsaWNlIiwiZXhwZWN0ZWRBcnJheSIsInNwbGljZSIsInJlY3Vyc2l2ZVNlYXJjaCIsInRvUGF0aFN0cmluZyIsImhhc0NoaWxkIiwicGRvbU9yZGVyIiwibWFwIiwibm9kZU9yTnVsbCIsImpvaW4iLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlBET01UcmVlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFRoZSBtYWluIGxvZ2ljIGZvciBtYWludGFpbmluZyB0aGUgUERPTSBpbnN0YW5jZSB0cmVlIChzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnktcGhldC9pc3N1ZXMvMzY1KVxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IGFycmF5RGlmZmVyZW5jZSBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvYXJyYXlEaWZmZXJlbmNlLmpzJztcclxuaW1wb3J0IHsgQnJvd3NlckV2ZW50cywgRm9jdXNNYW5hZ2VyLCBOb2RlLCBQYXJ0aWFsUERPTVRyYWlsLCBQRE9NSW5zdGFuY2UsIHNjZW5lcnksIFRyYWlsIH0gZnJvbSAnLi4vLi4vaW1wb3J0cy5qcyc7XHJcblxyXG5jb25zdCBQRE9NVHJlZSA9IHtcclxuICAvKipcclxuICAgKiBDYWxsZWQgd2hlbiBhIGNoaWxkIG5vZGUgaXMgYWRkZWQgdG8gYSBwYXJlbnQgbm9kZSAoYW5kIHRoZSBjaGlsZCBpcyBsaWtlbHkgdG8gaGF2ZSBwZG9tIGNvbnRlbnQpLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7Tm9kZX0gcGFyZW50XHJcbiAgICogQHBhcmFtIHtOb2RlfSBjaGlsZFxyXG4gICAqL1xyXG4gIGFkZENoaWxkKCBwYXJlbnQsIGNoaWxkICkge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlBET01UcmVlICYmIHNjZW5lcnlMb2cuUERPTVRyZWUoIGBhZGRDaGlsZCBwYXJlbnQ6biMke3BhcmVudC5faWR9LCBjaGlsZDpuIyR7Y2hpbGQuX2lkfWAgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NVHJlZSAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBwYXJlbnQgaW5zdGFuY2VvZiBOb2RlICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBjaGlsZCBpbnN0YW5jZW9mIE5vZGUgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFjaGlsZC5fcmVuZGVyZXJTdW1tYXJ5Lmhhc05vUERPTSgpICk7XHJcblxyXG4gICAgY29uc3QgZm9jdXNlZE5vZGUgPSBQRE9NVHJlZS5iZWZvcmVPcCgpO1xyXG5cclxuICAgIGlmICggIWNoaWxkLl9wZG9tUGFyZW50ICkge1xyXG4gICAgICBQRE9NVHJlZS5hZGRUcmVlKCBwYXJlbnQsIGNoaWxkICk7XHJcbiAgICB9XHJcblxyXG4gICAgUERPTVRyZWUuYWZ0ZXJPcCggZm9jdXNlZE5vZGUgKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUERPTVRyZWUgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgd2hlbiBhIGNoaWxkIG5vZGUgaXMgcmVtb3ZlZCBmcm9tIGEgcGFyZW50IG5vZGUgKGFuZCB0aGUgY2hpbGQgaXMgbGlrZWx5IHRvIGhhdmUgcGRvbSBjb250ZW50KS5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge05vZGV9IHBhcmVudFxyXG4gICAqIEBwYXJhbSB7Tm9kZX0gY2hpbGRcclxuICAgKi9cclxuICByZW1vdmVDaGlsZCggcGFyZW50LCBjaGlsZCApIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NVHJlZSAmJiBzY2VuZXJ5TG9nLlBET01UcmVlKCBgcmVtb3ZlQ2hpbGQgcGFyZW50Om4jJHtwYXJlbnQuX2lkfSwgY2hpbGQ6biMke2NoaWxkLl9pZH1gICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUERPTVRyZWUgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcGFyZW50IGluc3RhbmNlb2YgTm9kZSApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggY2hpbGQgaW5zdGFuY2VvZiBOb2RlICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhY2hpbGQuX3JlbmRlcmVyU3VtbWFyeS5oYXNOb1BET00oKSApO1xyXG5cclxuICAgIGNvbnN0IGZvY3VzZWROb2RlID0gUERPTVRyZWUuYmVmb3JlT3AoKTtcclxuXHJcbiAgICBpZiAoICFjaGlsZC5fcGRvbVBhcmVudCApIHtcclxuICAgICAgUERPTVRyZWUucmVtb3ZlVHJlZSggcGFyZW50LCBjaGlsZCApO1xyXG4gICAgfVxyXG5cclxuICAgIFBET01UcmVlLmFmdGVyT3AoIGZvY3VzZWROb2RlICk7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlBET01UcmVlICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIHdoZW4gYSBub2RlJ3MgY2hpbGRyZW4gYXJlIHJlb3JkZXJlZCAobm8gYWRkaXRpb25zL3JlbW92YWxzKS5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge05vZGV9IG5vZGVcclxuICAgKi9cclxuICBjaGlsZHJlbk9yZGVyQ2hhbmdlKCBub2RlICkge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlBET01UcmVlICYmIHNjZW5lcnlMb2cuUERPTVRyZWUoIGBjaGlsZHJlbk9yZGVyQ2hhbmdlIG5vZGU6biMke25vZGUuX2lkfWAgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NVHJlZSAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBub2RlIGluc3RhbmNlb2YgTm9kZSApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIW5vZGUuX3JlbmRlcmVyU3VtbWFyeS5oYXNOb1BET00oKSApO1xyXG5cclxuICAgIGNvbnN0IGZvY3VzZWROb2RlID0gUERPTVRyZWUuYmVmb3JlT3AoKTtcclxuXHJcbiAgICBQRE9NVHJlZS5yZW9yZGVyKCBub2RlICk7XHJcblxyXG4gICAgUERPTVRyZWUuYWZ0ZXJPcCggZm9jdXNlZE5vZGUgKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUERPTVRyZWUgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgd2hlbiBhIG5vZGUgaGFzIGEgcGRvbU9yZGVyIGNoYW5nZS5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge05vZGV9IG5vZGVcclxuICAgKiBAcGFyYW0ge0FycmF5LjxOb2RlfG51bGw+fG51bGx9IG9sZE9yZGVyXHJcbiAgICogQHBhcmFtIHtBcnJheS48Tm9kZXxudWxsPnxudWxsfSBuZXdPcmRlclxyXG4gICAqL1xyXG4gIHBkb21PcmRlckNoYW5nZSggbm9kZSwgb2xkT3JkZXIsIG5ld09yZGVyICkge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlBET01UcmVlICYmIHNjZW5lcnlMb2cuUERPTVRyZWUoIGBwZG9tT3JkZXJDaGFuZ2UgbiMke25vZGUuX2lkfTogJHtQRE9NVHJlZS5kZWJ1Z09yZGVyKCBvbGRPcmRlciApfSwke1BET01UcmVlLmRlYnVnT3JkZXIoIG5ld09yZGVyICl9YCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlBET01UcmVlICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG5vZGUgaW5zdGFuY2VvZiBOb2RlICk7XHJcblxyXG4gICAgY29uc3QgZm9jdXNlZE5vZGUgPSBQRE9NVHJlZS5iZWZvcmVPcCgpO1xyXG5cclxuICAgIGNvbnN0IHJlbW92ZWRJdGVtcyA9IFtdOyAvLyB7QXJyYXkuPE5vZGV8bnVsbD59IC0gTWF5IGNvbnRhaW4gdGhlIHBsYWNlaG9sZGVyIG51bGxcclxuICAgIGNvbnN0IGFkZGVkSXRlbXMgPSBbXTsgLy8ge0FycmF5LjxOb2RlfG51bGw+fSAtIE1heSBjb250YWluIHRoZSBwbGFjZWhvbGRlciBudWxsXHJcblxyXG4gICAgYXJyYXlEaWZmZXJlbmNlKCBvbGRPcmRlciB8fCBbXSwgbmV3T3JkZXIgfHwgW10sIHJlbW92ZWRJdGVtcywgYWRkZWRJdGVtcyApO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NVHJlZSAmJiBzY2VuZXJ5TG9nLlBET01UcmVlKCBgcmVtb3ZlZDogJHtQRE9NVHJlZS5kZWJ1Z09yZGVyKCByZW1vdmVkSXRlbXMgKX1gICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUERPTVRyZWUgJiYgc2NlbmVyeUxvZy5QRE9NVHJlZSggYGFkZGVkOiAke1BET01UcmVlLmRlYnVnT3JkZXIoIGFkZGVkSXRlbXMgKX1gICk7XHJcblxyXG4gICAgbGV0IGk7XHJcbiAgICBsZXQgajtcclxuXHJcbiAgICAvLyBDaGVjayBzb21lIGluaXRpYWwgY29uZGl0aW9uc1xyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgIGZvciAoIGkgPSAwOyBpIDwgcmVtb3ZlZEl0ZW1zOyBpKysgKSB7XHJcbiAgICAgICAgYXNzZXJ0KCByZW1vdmVkSXRlbXNbIGkgXSA9PT0gbnVsbCB8fCByZW1vdmVkSXRlbXNbIGkgXS5fcGRvbVBhcmVudCA9PT0gbm9kZSxcclxuICAgICAgICAgICdOb2RlIHNob3VsZCBoYXZlIGhhZCBhIHBkb21PcmRlcicgKTtcclxuICAgICAgfVxyXG4gICAgICBmb3IgKCBpID0gMDsgaSA8IGFkZGVkSXRlbXM7IGkrKyApIHtcclxuICAgICAgICBhc3NlcnQoIGFkZGVkSXRlbXNbIGkgXSA9PT0gbnVsbCB8fCBhZGRlZEl0ZW1zWyBpIF0uX3Bkb21QYXJlbnQgPT09IG51bGwsXHJcbiAgICAgICAgICAnTm9kZSBpcyBhbHJlYWR5IHNwZWNpZmllZCBpbiBhIHBkb21PcmRlcicgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIE5PVEU6IFBlcmZvcm1hbmNlIGNvdWxkIGJlIGltcHJvdmVkIGluIHNvbWUgY2FzZXMgaWYgd2UgY2FuIGF2b2lkIHJlYnVpbGRpbmcgYSBwZG9tIHRyZWUgZm9yIERJUkVDVCBjaGlsZHJlblxyXG4gICAgLy8gd2hlbiBjaGFuZ2luZyB3aGV0aGVyIHRoZXkgYXJlIHByZXNlbnQgaW4gdGhlIHBkb21PcmRlci4gQmFzaWNhbGx5LCBpZiBzb21ldGhpbmcgaXMgYSBjaGlsZCBhbmQgTk9UXHJcbiAgICAvLyBpbiBhIHBkb21PcmRlciwgY2hhbmdpbmcgaXRzIHBhcmVudCdzIG9yZGVyIHRvIGluY2x1ZGUgaXQgKG9yIHZpY2UgdmVyc2EpIHRyaWdnZXJzIGEgcmVidWlsZCB3aGVuIGl0XHJcbiAgICAvLyB3b3VsZCBub3Qgc3RyaWN0bHkgYmUgbmVjZXNzYXJ5LlxyXG5cclxuICAgIGNvbnN0IHBkb21UcmFpbHMgPSBQRE9NVHJlZS5maW5kUERPTVRyYWlscyggbm9kZSApO1xyXG5cclxuICAgIC8vIFJlbW92ZSBzdWJ0cmVlcyBmcm9tIHVzICh0aGF0IHdlcmUgcmVtb3ZlZClcclxuICAgIGZvciAoIGkgPSAwOyBpIDwgcmVtb3ZlZEl0ZW1zLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCByZW1vdmVkSXRlbVRvUmVtb3ZlID0gcmVtb3ZlZEl0ZW1zWyBpIF07XHJcbiAgICAgIGlmICggcmVtb3ZlZEl0ZW1Ub1JlbW92ZSApIHtcclxuICAgICAgICBQRE9NVHJlZS5yZW1vdmVUcmVlKCBub2RlLCByZW1vdmVkSXRlbVRvUmVtb3ZlLCBwZG9tVHJhaWxzICk7XHJcbiAgICAgICAgcmVtb3ZlZEl0ZW1Ub1JlbW92ZS5fcGRvbVBhcmVudCA9IG51bGw7XHJcbiAgICAgICAgcmVtb3ZlZEl0ZW1Ub1JlbW92ZS5wZG9tUGFyZW50Q2hhbmdlZEVtaXR0ZXIuZW1pdCgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmVtb3ZlIHN1YnRyZWVzIGZyb20gdGhlaXIgcGFyZW50cyAodGhhdCB3aWxsIGJlIGFkZGVkIGhlcmUgaW5zdGVhZClcclxuICAgIGZvciAoIGkgPSAwOyBpIDwgYWRkZWRJdGVtcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgYWRkZWRJdGVtVG9SZW1vdmUgPSBhZGRlZEl0ZW1zWyBpIF07XHJcbiAgICAgIGlmICggYWRkZWRJdGVtVG9SZW1vdmUgKSB7XHJcbiAgICAgICAgY29uc3QgcmVtb3ZlZFBhcmVudHMgPSBhZGRlZEl0ZW1Ub1JlbW92ZS5fcGFyZW50cztcclxuICAgICAgICBmb3IgKCBqID0gMDsgaiA8IHJlbW92ZWRQYXJlbnRzLmxlbmd0aDsgaisrICkge1xyXG4gICAgICAgICAgUERPTVRyZWUucmVtb3ZlVHJlZSggcmVtb3ZlZFBhcmVudHNbIGogXSwgYWRkZWRJdGVtVG9SZW1vdmUgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYWRkZWRJdGVtVG9SZW1vdmUuX3Bkb21QYXJlbnQgPSBub2RlO1xyXG4gICAgICAgIGFkZGVkSXRlbVRvUmVtb3ZlLnBkb21QYXJlbnRDaGFuZ2VkRW1pdHRlci5lbWl0KCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBBZGQgc3VidHJlZXMgdG8gdGhlaXIgcGFyZW50cyAodGhhdCB3ZXJlIHJlbW92ZWQgZnJvbSBvdXIgb3JkZXIpXHJcbiAgICBmb3IgKCBpID0gMDsgaSA8IHJlbW92ZWRJdGVtcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgcmVtb3ZlZEl0ZW1Ub0FkZCA9IHJlbW92ZWRJdGVtc1sgaSBdO1xyXG4gICAgICBpZiAoIHJlbW92ZWRJdGVtVG9BZGQgKSB7XHJcbiAgICAgICAgY29uc3QgYWRkZWRQYXJlbnRzID0gcmVtb3ZlZEl0ZW1Ub0FkZC5fcGFyZW50cztcclxuICAgICAgICBmb3IgKCBqID0gMDsgaiA8IGFkZGVkUGFyZW50cy5sZW5ndGg7IGorKyApIHtcclxuICAgICAgICAgIFBET01UcmVlLmFkZFRyZWUoIGFkZGVkUGFyZW50c1sgaiBdLCByZW1vdmVkSXRlbVRvQWRkICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWRkIHN1YnRyZWVzIHRvIHVzICh0aGF0IHdlcmUgYWRkZWQgaW4gdGhpcyBvcmRlciBjaGFuZ2UpXHJcbiAgICBmb3IgKCBpID0gMDsgaSA8IGFkZGVkSXRlbXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGFkZGVkSXRlbVRvQWRkID0gYWRkZWRJdGVtc1sgaSBdO1xyXG4gICAgICBhZGRlZEl0ZW1Ub0FkZCAmJiBQRE9NVHJlZS5hZGRUcmVlKCBub2RlLCBhZGRlZEl0ZW1Ub0FkZCwgcGRvbVRyYWlscyApO1xyXG4gICAgfVxyXG5cclxuICAgIFBET01UcmVlLnJlb3JkZXIoIG5vZGUsIHBkb21UcmFpbHMgKTtcclxuXHJcbiAgICBQRE9NVHJlZS5hZnRlck9wKCBmb2N1c2VkTm9kZSApO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NVHJlZSAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCB3aGVuIGEgbm9kZSBoYXMgYSBwZG9tQ29udGVudCBjaGFuZ2UuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtOb2RlfSBub2RlXHJcbiAgICovXHJcbiAgcGRvbUNvbnRlbnRDaGFuZ2UoIG5vZGUgKSB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUERPTVRyZWUgJiYgc2NlbmVyeUxvZy5QRE9NVHJlZSggYHBkb21Db250ZW50Q2hhbmdlIG4jJHtub2RlLl9pZH1gICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUERPTVRyZWUgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbm9kZSBpbnN0YW5jZW9mIE5vZGUgKTtcclxuXHJcbiAgICBjb25zdCBmb2N1c2VkTm9kZSA9IFBET01UcmVlLmJlZm9yZU9wKCk7XHJcblxyXG4gICAgbGV0IGk7XHJcbiAgICBjb25zdCBwYXJlbnRzID0gbm9kZS5fcGRvbVBhcmVudCA/IFsgbm9kZS5fcGRvbVBhcmVudCBdIDogbm9kZS5fcGFyZW50cztcclxuICAgIGNvbnN0IHBkb21UcmFpbHNMaXN0ID0gW107IC8vIHBkb21UcmFpbHNMaXN0WyBpIF0gOj0gUERPTVRyZWUuZmluZFBET01UcmFpbHMoIHBhcmVudHNbIGkgXSApXHJcblxyXG4gICAgLy8gRm9yIG5vdywganVzdCByZWdlbmVyYXRlIHRoZSBmdWxsIHRyZWUuIENvdWxkIG9wdGltaXplIGluIHRoZSBmdXR1cmUsIGlmIHdlIGNhbiBzd2FwIHRoZSBjb250ZW50IGZvciBhblxyXG4gICAgLy8gUERPTUluc3RhbmNlLlxyXG4gICAgZm9yICggaSA9IDA7IGkgPCBwYXJlbnRzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBwYXJlbnQgPSBwYXJlbnRzWyBpIF07XHJcblxyXG4gICAgICBjb25zdCBwZG9tVHJhaWxzID0gUERPTVRyZWUuZmluZFBET01UcmFpbHMoIHBhcmVudCApO1xyXG4gICAgICBwZG9tVHJhaWxzTGlzdC5wdXNoKCBwZG9tVHJhaWxzICk7XHJcblxyXG4gICAgICBQRE9NVHJlZS5yZW1vdmVUcmVlKCBwYXJlbnQsIG5vZGUsIHBkb21UcmFpbHMgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEbyBhbGwgcmVtb3ZhbHMgYmVmb3JlIGFkZGluZyBhbnl0aGluZyBiYWNrIGluLlxyXG4gICAgZm9yICggaSA9IDA7IGkgPCBwYXJlbnRzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBQRE9NVHJlZS5hZGRUcmVlKCBwYXJlbnRzWyBpIF0sIG5vZGUsIHBkb21UcmFpbHNMaXN0WyBpIF0gKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBbiBlZGdlIGNhc2UgaXMgd2hlcmUgd2UgY2hhbmdlIHRoZSByb290Tm9kZSBvZiB0aGUgZGlzcGxheSAoYW5kIGRvbid0IGhhdmUgYW4gZWZmZWN0aXZlIHBhcmVudClcclxuICAgIGZvciAoIGkgPSAwOyBpIDwgbm9kZS5fcm9vdGVkRGlzcGxheXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGRpc3BsYXkgPSBub2RlLl9yb290ZWREaXNwbGF5c1sgaSBdO1xyXG4gICAgICBpZiAoIGRpc3BsYXkuX2FjY2Vzc2libGUgKSB7XHJcbiAgICAgICAgUERPTVRyZWUucmVidWlsZEluc3RhbmNlVHJlZSggZGlzcGxheS5fcm9vdFBET01JbnN0YW5jZSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgUERPTVRyZWUuYWZ0ZXJPcCggZm9jdXNlZE5vZGUgKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUERPTVRyZWUgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHVwIGEgcm9vdCBpbnN0YW5jZSB3aXRoIGEgZ2l2ZW4gcm9vdCBub2RlLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7UERPTUluc3RhbmNlfSByb290SW5zdGFuY2VcclxuICAgKi9cclxuICByZWJ1aWxkSW5zdGFuY2VUcmVlKCByb290SW5zdGFuY2UgKSB7XHJcbiAgICBjb25zdCByb290Tm9kZSA9IHJvb3RJbnN0YW5jZS5kaXNwbGF5LnJvb3ROb2RlO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcm9vdE5vZGUgKTtcclxuXHJcbiAgICByb290SW5zdGFuY2UucmVtb3ZlQWxsQ2hpbGRyZW4oKTtcclxuXHJcbiAgICByb290SW5zdGFuY2UuYWRkQ29uc2VjdXRpdmVJbnN0YW5jZXMoIFBET01UcmVlLmNyZWF0ZVRyZWUoIG5ldyBUcmFpbCggcm9vdE5vZGUgKSwgcm9vdEluc3RhbmNlLmRpc3BsYXksIHJvb3RJbnN0YW5jZSApICk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlcyB0aGUgY29uY2VwdHVhbCBhZGRpdGlvbiBvZiBhIHBkb20gc3VidHJlZS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtOb2RlfSBwYXJlbnRcclxuICAgKiBAcGFyYW0ge05vZGV9IGNoaWxkXHJcbiAgICogQHBhcmFtIHtBcnJheS48UGFydGlhbFBET01UcmFpbD59IFtwZG9tVHJhaWxzXSAtIFdpbGwgYmUgY29tcHV0ZWQgaWYgbmVlZGVkXHJcbiAgICovXHJcbiAgYWRkVHJlZSggcGFyZW50LCBjaGlsZCwgcGRvbVRyYWlscyApIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NVHJlZSAmJiBzY2VuZXJ5TG9nLlBET01UcmVlKCBgYWRkVHJlZSBwYXJlbnQ6biMke3BhcmVudC5faWR9LCBjaGlsZDpuIyR7Y2hpbGQuX2lkfWAgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NVHJlZSAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgUERPTVRyZWUuYXVkaXROb2RlRm9yUERPTUN5Y2xlcyggcGFyZW50ICk7XHJcblxyXG4gICAgcGRvbVRyYWlscyA9IHBkb21UcmFpbHMgfHwgUERPTVRyZWUuZmluZFBET01UcmFpbHMoIHBhcmVudCApO1xyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHBkb21UcmFpbHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NVHJlZSAmJiBzY2VuZXJ5TG9nLlBET01UcmVlKCBgdHJhaWw6ICR7cGRvbVRyYWlsc1sgaSBdLnRyYWlsLnRvU3RyaW5nKCl9IGZ1bGw6JHtwZG9tVHJhaWxzWyBpIF0uZnVsbFRyYWlsLnRvU3RyaW5nKCl9IGZvciAke3Bkb21UcmFpbHNbIGkgXS5wZG9tSW5zdGFuY2UudG9TdHJpbmcoKX0gcm9vdDoke3Bkb21UcmFpbHNbIGkgXS5pc1Jvb3R9YCApO1xyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUERPTVRyZWUgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgICBjb25zdCBwYXJ0aWFsVHJhaWwgPSBwZG9tVHJhaWxzWyBpIF07XHJcbiAgICAgIGNvbnN0IHBhcmVudEluc3RhbmNlID0gcGFydGlhbFRyYWlsLnBkb21JbnN0YW5jZTtcclxuXHJcbiAgICAgIC8vIFRoZSBmdWxsIHRyYWlsIGRvZXNuJ3QgaGF2ZSB0aGUgY2hpbGQgaW4gaXQsIHNvIHdlIHRlbXBvcmFyaWx5IGFkZCB0aGF0IGZvciB0cmVlIGNyZWF0aW9uXHJcbiAgICAgIHBhcnRpYWxUcmFpbC5mdWxsVHJhaWwuYWRkRGVzY2VuZGFudCggY2hpbGQgKTtcclxuICAgICAgY29uc3QgY2hpbGRJbnN0YW5jZXMgPSBQRE9NVHJlZS5jcmVhdGVUcmVlKCBwYXJ0aWFsVHJhaWwuZnVsbFRyYWlsLCBwYXJlbnRJbnN0YW5jZS5kaXNwbGF5LCBwYXJlbnRJbnN0YW5jZSApO1xyXG4gICAgICBwYXJ0aWFsVHJhaWwuZnVsbFRyYWlsLnJlbW92ZURlc2NlbmRhbnQoIGNoaWxkICk7XHJcblxyXG4gICAgICBwYXJlbnRJbnN0YW5jZS5hZGRDb25zZWN1dGl2ZUluc3RhbmNlcyggY2hpbGRJbnN0YW5jZXMgKTtcclxuXHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NVHJlZSAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NVHJlZSAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZXMgdGhlIGNvbmNlcHR1YWwgcmVtb3ZhbCBvZiBhIHBkb20gc3VidHJlZS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtOb2RlfSBwYXJlbnRcclxuICAgKiBAcGFyYW0ge05vZGV9IGNoaWxkXHJcbiAgICogQHBhcmFtIHtBcnJheS48UGFydGlhbFBET01UcmFpbD59IFtwZG9tVHJhaWxzXSAtIFdpbGwgYmUgY29tcHV0ZWQgaWYgbmVlZGVkXHJcbiAgICovXHJcbiAgcmVtb3ZlVHJlZSggcGFyZW50LCBjaGlsZCwgcGRvbVRyYWlscyApIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NVHJlZSAmJiBzY2VuZXJ5TG9nLlBET01UcmVlKCBgcmVtb3ZlVHJlZSBwYXJlbnQ6biMke3BhcmVudC5faWR9LCBjaGlsZDpuIyR7Y2hpbGQuX2lkfWAgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NVHJlZSAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICBwZG9tVHJhaWxzID0gcGRvbVRyYWlscyB8fCBQRE9NVHJlZS5maW5kUERPTVRyYWlscyggcGFyZW50ICk7XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgcGRvbVRyYWlscy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgcGFydGlhbFRyYWlsID0gcGRvbVRyYWlsc1sgaSBdO1xyXG5cclxuICAgICAgLy8gVGhlIGZ1bGwgdHJhaWwgZG9lc24ndCBoYXZlIHRoZSBjaGlsZCBpbiBpdCwgc28gd2UgdGVtcG9yYXJpbHkgYWRkIHRoYXQgZm9yIHRyZWUgcmVtb3ZhbFxyXG4gICAgICBwYXJ0aWFsVHJhaWwuZnVsbFRyYWlsLmFkZERlc2NlbmRhbnQoIGNoaWxkICk7XHJcbiAgICAgIHBhcnRpYWxUcmFpbC5wZG9tSW5zdGFuY2UucmVtb3ZlSW5zdGFuY2VzRm9yVHJhaWwoIHBhcnRpYWxUcmFpbC5mdWxsVHJhaWwgKTtcclxuICAgICAgcGFydGlhbFRyYWlsLmZ1bGxUcmFpbC5yZW1vdmVEZXNjZW5kYW50KCBjaGlsZCApO1xyXG4gICAgfVxyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NVHJlZSAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZXMgdGhlIGNvbmNlcHR1YWwgc29ydGluZyBvZiBhIHBkb20gc3VidHJlZS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtOb2RlfSBub2RlXHJcbiAgICogQHBhcmFtIHtBcnJheS48UGFydGlhbFBET01UcmFpbD59IFtwZG9tVHJhaWxzXSAtIFdpbGwgYmUgY29tcHV0ZWQgaWYgbmVlZGVkXHJcbiAgICovXHJcbiAgcmVvcmRlciggbm9kZSwgcGRvbVRyYWlscyApIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QRE9NVHJlZSAmJiBzY2VuZXJ5TG9nLlBET01UcmVlKCBgcmVvcmRlciBuIyR7bm9kZS5faWR9YCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlBET01UcmVlICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIHBkb21UcmFpbHMgPSBwZG9tVHJhaWxzIHx8IFBET01UcmVlLmZpbmRQRE9NVHJhaWxzKCBub2RlICk7XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgcGRvbVRyYWlscy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgcGFydGlhbFRyYWlsID0gcGRvbVRyYWlsc1sgaSBdO1xyXG5cclxuICAgICAgLy8gVE9ETzogZG9lcyBpdCBvcHRpbWl6ZSB0aGluZ3MgdG8gcGFzcyB0aGUgcGFydGlhbCB0cmFpbCBpbiAoc28gd2Ugc2NhbiBsZXNzKT8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgcGFydGlhbFRyYWlsLnBkb21JbnN0YW5jZS5zb3J0Q2hpbGRyZW4oKTtcclxuICAgIH1cclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUERPTVRyZWUgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIFBET00gaW5zdGFuY2VzLCByZXR1cm5pbmcgYW4gYXJyYXkgb2YgaW5zdGFuY2VzIHRoYXQgc2hvdWxkIGJlIGFkZGVkIHRvIHRoZSBuZXh0IGxldmVsLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBOT1RFOiBUcmFpbHMgZm9yIHdoaWNoIGFuIGFscmVhZHktZXhpc3RpbmcgaW5zdGFuY2UgZXhpc3RzIHdpbGwgTk9UIGNyZWF0ZSBhIG5ldyBpbnN0YW5jZSBoZXJlLiBXZSBvbmx5IHdhbnQgdG9cclxuICAgKiBmaWxsIGluIHRoZSBcIm1pc3NpbmdcIiBzdHJ1Y3R1cmUuIFRoZXJlIGFyZSBjYXNlcyAoYS5jaGlsZHJlbj1bYixjXSwgYi5jaGlsZHJlbj1bY10pIHdoZXJlIHJlbW92aW5nIGFuXHJcbiAgICogcGRvbU9yZGVyIGNhbiB0cmlnZ2VyIGFkZFRyZWUoYSxiKSBBTkQgYWRkVHJlZShiLGMpLCBhbmQgd2UgY2FuJ3QgY3JlYXRlIGR1cGxpY2F0ZSBjb250ZW50LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtUcmFpbH0gdHJhaWxcclxuICAgKiBAcGFyYW0ge0Rpc3BsYXl9IGRpc3BsYXlcclxuICAgKiBAcGFyYW0ge1BET01JbnN0YW5jZX0gcGFyZW50SW5zdGFuY2UgLSBTaW5jZSB3ZSBkb24ndCBjcmVhdGUgdGhlIHJvb3QgaGVyZSwgY2FuJ3QgYmUgbnVsbFxyXG4gICAqIEByZXR1cm5zIHtBcnJheS48UERPTUluc3RhbmNlPn1cclxuICAgKi9cclxuICBjcmVhdGVUcmVlKCB0cmFpbCwgZGlzcGxheSwgcGFyZW50SW5zdGFuY2UgKSB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUERPTVRyZWUgJiYgc2NlbmVyeUxvZy5QRE9NVHJlZSggYGNyZWF0ZVRyZWUgJHt0cmFpbC50b1N0cmluZygpfSBwYXJlbnQ6JHtwYXJlbnRJbnN0YW5jZSA/IHBhcmVudEluc3RhbmNlLnRvU3RyaW5nKCkgOiAnbnVsbCd9YCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlBET01UcmVlICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIGNvbnN0IG5vZGUgPSB0cmFpbC5sYXN0Tm9kZSgpO1xyXG4gICAgY29uc3QgZWZmZWN0aXZlQ2hpbGRyZW4gPSBub2RlLmdldEVmZmVjdGl2ZUNoaWxkcmVuKCk7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlBET01UcmVlICYmIHNjZW5lcnlMb2cuUERPTVRyZWUoIGBlZmZlY3RpdmVDaGlsZHJlbjogJHtQRE9NVHJlZS5kZWJ1Z09yZGVyKCBlZmZlY3RpdmVDaGlsZHJlbiApfWAgKTtcclxuXHJcbiAgICAvLyBJZiB3ZSBoYXZlIHBkb20gY29udGVudCBvdXJzZWxmLCB3ZSBuZWVkIHRvIGNyZWF0ZSB0aGUgaW5zdGFuY2UgKHNvIHdlIGNhbiBwcm92aWRlIGl0IHRvIGNoaWxkIGluc3RhbmNlcykuXHJcbiAgICBsZXQgaW5zdGFuY2U7XHJcbiAgICBsZXQgZXhpc3RlZCA9IGZhbHNlO1xyXG4gICAgaWYgKCBub2RlLmhhc1BET01Db250ZW50ICkge1xyXG4gICAgICBpbnN0YW5jZSA9IHBhcmVudEluc3RhbmNlLmZpbmRDaGlsZFdpdGhUcmFpbCggdHJhaWwgKTtcclxuICAgICAgaWYgKCBpbnN0YW5jZSApIHtcclxuICAgICAgICBleGlzdGVkID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBpbnN0YW5jZSA9IFBET01JbnN0YW5jZS5wb29sLmNyZWF0ZSggcGFyZW50SW5zdGFuY2UsIGRpc3BsYXksIHRyYWlsLmNvcHkoKSApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJZiB0aGVyZSB3YXMgYW4gaW5zdGFuY2UsIHRoZW4gaXQgc2hvdWxkIGJlIHRoZSBwYXJlbnQgdG8gZWZmZWN0aXZlIGNoaWxkcmVuLCBvdGhlcndpc2UsIGl0IGlzbid0IHBhcnQgb2YgdGhlXHJcbiAgICAgIC8vIHRyYWlsLlxyXG4gICAgICBwYXJlbnRJbnN0YW5jZSA9IGluc3RhbmNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENyZWF0ZSBhbGwgb2YgdGhlIGRpcmVjdC1jaGlsZCBpbnN0YW5jZXMuXHJcbiAgICBjb25zdCBjaGlsZEluc3RhbmNlcyA9IFtdO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgZWZmZWN0aXZlQ2hpbGRyZW4ubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIHRyYWlsLmFkZERlc2NlbmRhbnQoIGVmZmVjdGl2ZUNoaWxkcmVuWyBpIF0sIGkgKTtcclxuICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoIGNoaWxkSW5zdGFuY2VzLCBQRE9NVHJlZS5jcmVhdGVUcmVlKCB0cmFpbCwgZGlzcGxheSwgcGFyZW50SW5zdGFuY2UgKSApO1xyXG4gICAgICB0cmFpbC5yZW1vdmVEZXNjZW5kYW50KCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSWYgd2UgaGF2ZSBhbiBpbnN0YW5jZSwgaG9vayB0aGluZ3MgdXAsIGFuZCByZXR1cm4ganVzdCBpdC5cclxuICAgIGlmICggaW5zdGFuY2UgKSB7XHJcbiAgICAgIGluc3RhbmNlLmFkZENvbnNlY3V0aXZlSW5zdGFuY2VzKCBjaGlsZEluc3RhbmNlcyApO1xyXG5cclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlBET01UcmVlICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgICAgIHJldHVybiBleGlzdGVkID8gW10gOiBbIGluc3RhbmNlIF07XHJcbiAgICB9XHJcbiAgICAvLyBPdGhlcndpc2UgcGFzcyB0aGluZ3MgZm9yd2FyZCBzbyB0aGV5IGNhbiBiZSBhZGRlZCBhcyBjaGlsZHJlbiBieSB0aGUgcGFyZW50SW5zdGFuY2VcclxuICAgIGVsc2Uge1xyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUERPTVRyZWUgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICAgICAgcmV0dXJuIGNoaWxkSW5zdGFuY2VzO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFByZXBhcmVzIGZvciBhIHBkb20tdHJlZS1jaGFuZ2luZyBvcGVyYXRpb24gKHNhdmluZyBzb21lIHN0YXRlKS4gRHVyaW5nIERPTSBvcGVyYXRpb25zIHdlIGRvbid0IHdhbnQgRGlzcGxheVxyXG4gICAqIGlucHV0IHRvIGRpc3BhdGNoIGV2ZW50cyBhcyBmb2N1cyBjaGFuZ2VzLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQHJldHVybnMge05vZGV8bnVsbH1cclxuICAgKi9cclxuICBiZWZvcmVPcCgpIHtcclxuICAgIEJyb3dzZXJFdmVudHMuYmxvY2tGb2N1c0NhbGxiYWNrcyA9IHRydWU7XHJcbiAgICByZXR1cm4gRm9jdXNNYW5hZ2VyLnBkb21Gb2N1c2VkTm9kZTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBGaW5hbGl6ZXMgYSBwZG9tLXRyZWUtY2hhbmdpbmcgb3BlcmF0aW9uIChyZXN0b3Jpbmcgc29tZSBzdGF0ZSkuXHJcbiAgICogQHBhcmFtIHtOb2RlfG51bGx9IGZvY3VzZWROb2RlXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBhZnRlck9wKCBmb2N1c2VkTm9kZSApIHtcclxuICAgIGZvY3VzZWROb2RlICYmIGZvY3VzZWROb2RlLmZvY3VzYWJsZSAmJiBmb2N1c2VkTm9kZS5mb2N1cygpO1xyXG4gICAgQnJvd3NlckV2ZW50cy5ibG9ja0ZvY3VzQ2FsbGJhY2tzID0gZmFsc2U7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbGwgXCJwZG9tXCIgdHJhaWxzIGZyb20gdGhpcyBub2RlIGFuY2VzdG9yLXdpc2UgdG8gbm9kZXMgdGhhdCBoYXZlIGRpc3BsYXkgcm9vdHMuXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIE5PVEU6IFwicGRvbVwiIHRyYWlscyBtYXkgbm90IGhhdmUgc3RyaWN0IHBhcmVudC1jaGlsZCByZWxhdGlvbnNoaXBzIGJldHdlZW4gYWRqYWNlbnQgbm9kZXMsIGFzIHJlbWFwcGluZyBvZlxyXG4gICAqIHRoZSB0cmVlIGNhbiBoYXZlIGEgXCJQRE9NIHBhcmVudFwiIGFuZCBcInBkb20gY2hpbGRcIiBjYXNlICh0aGUgY2hpbGQgaXMgaW4gdGhlIHBhcmVudCdzIHBkb21PcmRlcikuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge05vZGV9IG5vZGVcclxuICAgKiBAcmV0dXJucyB7QXJyYXkuPFBhcnRpYWxQRE9NVHJhaWw+fVxyXG4gICAqL1xyXG4gIGZpbmRQRE9NVHJhaWxzKCBub2RlICkge1xyXG4gICAgY29uc3QgdHJhaWxzID0gW107XHJcbiAgICBQRE9NVHJlZS5yZWN1cnNpdmVQRE9NVHJhaWxTZWFyY2goIHRyYWlscywgbmV3IFRyYWlsKCBub2RlICkgKTtcclxuICAgIHJldHVybiB0cmFpbHM7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogRmluZHMgYWxsIHBhcnRpYWwgXCJwZG9tXCIgdHJhaWxzXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7QXJyYXkuPFBhcnRpYWxQRE9NVHJhaWw+fSB0cmFpbFJlc3VsdHMgLSBNdXRhdGVkLCB0aGlzIGlzIGhvdyB3ZSBcInJldHVyblwiIG91ciB2YWx1ZS5cclxuICAgKiBAcGFyYW0ge1RyYWlsfSB0cmFpbCAtIFdoZXJlIHRvIHN0YXJ0IGZyb21cclxuICAgKi9cclxuICByZWN1cnNpdmVQRE9NVHJhaWxTZWFyY2goIHRyYWlsUmVzdWx0cywgdHJhaWwgKSB7XHJcbiAgICBjb25zdCByb290ID0gdHJhaWwucm9vdE5vZGUoKTtcclxuICAgIGxldCBpO1xyXG5cclxuICAgIC8vIElmIHdlIGZpbmQgcGRvbSBjb250ZW50LCBvdXIgc2VhcmNoIGVuZHMgaGVyZS4gSUYgaXQgaXMgY29ubmVjdGVkIHRvIGFueSBhY2Nlc3NpYmxlIHBkb20gZGlzcGxheXMgc29tZWhvdywgaXRcclxuICAgIC8vIHdpbGwgaGF2ZSBwZG9tIGluc3RhbmNlcy4gV2Ugb25seSBjYXJlIGFib3V0IHRoZXNlIHBkb20gaW5zdGFuY2VzLCBhcyB0aGV5IGFscmVhZHkgaGF2ZSBhbnkgREFHXHJcbiAgICAvLyBkZWR1cGxpY2F0aW9uIGFwcGxpZWQuXHJcbiAgICBpZiAoIHJvb3QuaGFzUERPTUNvbnRlbnQgKSB7XHJcbiAgICAgIGNvbnN0IGluc3RhbmNlcyA9IHJvb3QucGRvbUluc3RhbmNlcztcclxuXHJcbiAgICAgIGZvciAoIGkgPSAwOyBpIDwgaW5zdGFuY2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIHRyYWlsUmVzdWx0cy5wdXNoKCBuZXcgUGFydGlhbFBET01UcmFpbCggaW5zdGFuY2VzWyBpIF0sIHRyYWlsLmNvcHkoKSwgZmFsc2UgKSApO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIC8vIE90aGVyd2lzZSBjaGVjayBmb3IgYWNjZXNzaWJsZSBwZG9tIGRpc3BsYXlzIGZvciB3aGljaCBvdXIgbm9kZSBpcyB0aGUgcm9vdE5vZGUuXHJcbiAgICBlbHNlIHtcclxuICAgICAgY29uc3Qgcm9vdGVkRGlzcGxheXMgPSByb290LnJvb3RlZERpc3BsYXlzO1xyXG4gICAgICBmb3IgKCBpID0gMDsgaSA8IHJvb3RlZERpc3BsYXlzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIGNvbnN0IGRpc3BsYXkgPSByb290ZWREaXNwbGF5c1sgaSBdO1xyXG5cclxuICAgICAgICBpZiAoIGRpc3BsYXkuX2FjY2Vzc2libGUgKSB7XHJcbiAgICAgICAgICB0cmFpbFJlc3VsdHMucHVzaCggbmV3IFBhcnRpYWxQRE9NVHJhaWwoIGRpc3BsYXkuX3Jvb3RQRE9NSW5zdGFuY2UsIHRyYWlsLmNvcHkoKSwgdHJ1ZSApICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcGFyZW50cyA9IHJvb3QuX3Bkb21QYXJlbnQgPyBbIHJvb3QuX3Bkb21QYXJlbnQgXSA6IHJvb3QuX3BhcmVudHM7XHJcbiAgICBjb25zdCBwYXJlbnRDb3VudCA9IHBhcmVudHMubGVuZ3RoO1xyXG4gICAgZm9yICggaSA9IDA7IGkgPCBwYXJlbnRDb3VudDsgaSsrICkge1xyXG4gICAgICBjb25zdCBwYXJlbnQgPSBwYXJlbnRzWyBpIF07XHJcblxyXG4gICAgICB0cmFpbC5hZGRBbmNlc3RvciggcGFyZW50ICk7XHJcbiAgICAgIFBET01UcmVlLnJlY3Vyc2l2ZVBET01UcmFpbFNlYXJjaCggdHJhaWxSZXN1bHRzLCB0cmFpbCApO1xyXG4gICAgICB0cmFpbC5yZW1vdmVBbmNlc3RvcigpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEVuc3VyZXMgdGhhdCB0aGUgcGRvbURpc3BsYXlzIG9uIHRoZSBub2RlIChhbmQgaXRzIHN1YnRyZWUpIGFyZSBhY2N1cmF0ZS5cclxuICAgKiBAcHVibGljXHJcbiAgICovXHJcbiAgYXVkaXRQRE9NRGlzcGxheXMoIG5vZGUgKSB7XHJcbiAgICBpZiAoIGFzc2VydFNsb3cgKSB7XHJcbiAgICAgIGlmICggbm9kZS5fcGRvbURpc3BsYXlzSW5mby5jYW5IYXZlUERPTURpc3BsYXlzKCkgKSB7XHJcblxyXG4gICAgICAgIGxldCBpO1xyXG4gICAgICAgIGNvbnN0IGRpc3BsYXlzID0gW107XHJcblxyXG4gICAgICAgIC8vIENvbmNhdGVuYXRpb24gb2Ygb3VyIHBhcmVudHMnIHBkb21EaXNwbGF5c1xyXG4gICAgICAgIGZvciAoIGkgPSAwOyBpIDwgbm9kZS5fcGFyZW50cy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KCBkaXNwbGF5cywgbm9kZS5fcGFyZW50c1sgaSBdLl9wZG9tRGlzcGxheXNJbmZvLnBkb21EaXNwbGF5cyApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQW5kIGNvbmNhdGVuYXRpb24gb2YgYW55IHJvb3RlZCBkaXNwbGF5cyAodGhhdCBzdXBwb3J0IHBkb20pXHJcbiAgICAgICAgZm9yICggaSA9IDA7IGkgPCBub2RlLl9yb290ZWREaXNwbGF5cy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgIGNvbnN0IGRpc3BsYXkgPSBub2RlLl9yb290ZWREaXNwbGF5c1sgaSBdO1xyXG4gICAgICAgICAgaWYgKCBkaXNwbGF5Ll9hY2Nlc3NpYmxlICkge1xyXG4gICAgICAgICAgICBkaXNwbGF5cy5wdXNoKCBkaXNwbGF5ICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBhY3R1YWxBcnJheSA9IG5vZGUuX3Bkb21EaXNwbGF5c0luZm8ucGRvbURpc3BsYXlzLnNsaWNlKCk7XHJcbiAgICAgICAgY29uc3QgZXhwZWN0ZWRBcnJheSA9IGRpc3BsYXlzLnNsaWNlKCk7IC8vIHNsaWNlIGhlbHBzIGluIGRlYnVnZ2luZ1xyXG4gICAgICAgIGFzc2VydFNsb3coIGFjdHVhbEFycmF5Lmxlbmd0aCA9PT0gZXhwZWN0ZWRBcnJheS5sZW5ndGggKTtcclxuXHJcbiAgICAgICAgZm9yICggaSA9IDA7IGkgPCBleHBlY3RlZEFycmF5Lmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgZm9yICggbGV0IGogPSAwOyBqIDwgYWN0dWFsQXJyYXkubGVuZ3RoOyBqKysgKSB7XHJcbiAgICAgICAgICAgIGlmICggZXhwZWN0ZWRBcnJheVsgaSBdID09PSBhY3R1YWxBcnJheVsgaiBdICkge1xyXG4gICAgICAgICAgICAgIGV4cGVjdGVkQXJyYXkuc3BsaWNlKCBpLCAxICk7XHJcbiAgICAgICAgICAgICAgYWN0dWFsQXJyYXkuc3BsaWNlKCBqLCAxICk7XHJcbiAgICAgICAgICAgICAgaS0tO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhc3NlcnRTbG93KCBhY3R1YWxBcnJheS5sZW5ndGggPT09IDAgJiYgZXhwZWN0ZWRBcnJheS5sZW5ndGggPT09IDAsICdNaXNtYXRjaCB3aXRoIGFjY2Vzc2libGUgcGRvbSBkaXNwbGF5cycgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBhc3NlcnRTbG93KCBub2RlLl9wZG9tRGlzcGxheXNJbmZvLnBkb21EaXNwbGF5cy5sZW5ndGggPT09IDAsICdJbnZpc2libGUvbm9uYWNjZXNzaWJsZSB0aGluZ3Mgc2hvdWxkIGhhdmUgbm8gZGlzcGxheXMnICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBDaGVja3MgYSBnaXZlbiBOb2RlICh3aXRoIGFzc2VydGlvbnMpIHRvIGVuc3VyZSBpdCBpcyBub3QgcGFydCBvZiBhIGN5Y2xlIGluIHRoZSBjb21iaW5lZCBncmFwaCB3aXRoIGVkZ2VzXHJcbiAgICogZGVmaW5lZCBieSBcInRoZXJlIGlzIGEgcGFyZW50LWNoaWxkIG9yIHBkb21QYXJlbnQtcGRvbU9yZGVyXCIgcmVsYXRpb25zaGlwIGJldHdlZW4gdGhlIHR3byBub2Rlcy5cclxuICAgKiBAcHVibGljIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy83ODcgZm9yIG1vcmUgaW5mb3JtYXRpb24gKGFuZCBmb3Igc29tZSBkZXRhaWwgb24gdGhlIGNhc2VzXHJcbiAgICogdGhhdCB3ZSB3YW50IHRvIGNhdGNoKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7Tm9kZX0gbm9kZVxyXG4gICAqL1xyXG4gIGF1ZGl0Tm9kZUZvclBET01DeWNsZXMoIG5vZGUgKSB7XHJcbiAgICBpZiAoIGFzc2VydCApIHtcclxuICAgICAgY29uc3QgdHJhaWwgPSBuZXcgVHJhaWwoIG5vZGUgKTtcclxuXHJcbiAgICAgICggZnVuY3Rpb24gcmVjdXJzaXZlU2VhcmNoKCkge1xyXG4gICAgICAgIGNvbnN0IHJvb3QgPSB0cmFpbC5yb290Tm9kZSgpO1xyXG5cclxuICAgICAgICBhc3NlcnQoIHRyYWlsLmxlbmd0aCA8PSAxIHx8IHJvb3QgIT09IG5vZGUsXHJcbiAgICAgICAgICBgJHsnQWNjZXNzaWJsZSBQRE9NIGdyYXBoIGN5Y2xlIGRldGVjdGVkLiBUaGUgY29tYmluZWQgc2NlbmUtZ3JhcGggREFHIHdpdGggcGRvbU9yZGVyIGRlZmluaW5nIGFkZGl0aW9uYWwgJyArXHJcbiAgICAgICAgICAgICAncGFyZW50LWNoaWxkIHJlbGF0aW9uc2hpcHMgc2hvdWxkIHN0aWxsIGJlIGEgREFHLiBDeWNsZSBkZXRlY3RlZCB3aXRoIHRoZSB0cmFpbDogJ30ke3RyYWlsLnRvU3RyaW5nKClcclxuICAgICAgICAgIH0gcGF0aDogJHt0cmFpbC50b1BhdGhTdHJpbmcoKX1gICk7XHJcblxyXG4gICAgICAgIGNvbnN0IHBhcmVudENvdW50ID0gcm9vdC5fcGFyZW50cy5sZW5ndGg7XHJcbiAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgcGFyZW50Q291bnQ7IGkrKyApIHtcclxuICAgICAgICAgIGNvbnN0IHBhcmVudCA9IHJvb3QuX3BhcmVudHNbIGkgXTtcclxuXHJcbiAgICAgICAgICB0cmFpbC5hZGRBbmNlc3RvciggcGFyZW50ICk7XHJcbiAgICAgICAgICByZWN1cnNpdmVTZWFyY2goKTtcclxuICAgICAgICAgIHRyYWlsLnJlbW92ZUFuY2VzdG9yKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIE9ubHkgdmlzaXQgdGhlIHBkb21QYXJlbnQgaWYgd2UgZGlkbid0IGFscmVhZHkgdmlzaXQgaXQgYXMgYSBwYXJlbnQuXHJcbiAgICAgICAgaWYgKCByb290Ll9wZG9tUGFyZW50ICYmICFyb290Ll9wZG9tUGFyZW50Lmhhc0NoaWxkKCByb290ICkgKSB7XHJcbiAgICAgICAgICB0cmFpbC5hZGRBbmNlc3Rvciggcm9vdC5fcGRvbVBhcmVudCApO1xyXG4gICAgICAgICAgcmVjdXJzaXZlU2VhcmNoKCk7XHJcbiAgICAgICAgICB0cmFpbC5yZW1vdmVBbmNlc3RvcigpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhbiBvcmRlciAodXNpbmcgTm9kZSBpZHMpIGZvciBkZWJ1Z2dpbmcuXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7QXJyYXkuPE5vZGV8bnVsbD58bnVsbH0gcGRvbU9yZGVyXHJcbiAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgKi9cclxuICBkZWJ1Z09yZGVyKCBwZG9tT3JkZXIgKSB7XHJcbiAgICBpZiAoIHBkb21PcmRlciA9PT0gbnVsbCApIHsgcmV0dXJuICdudWxsJzsgfVxyXG5cclxuICAgIHJldHVybiBgWyR7cGRvbU9yZGVyLm1hcCggbm9kZU9yTnVsbCA9PiBub2RlT3JOdWxsID09PSBudWxsID8gJ251bGwnIDogbm9kZU9yTnVsbC5faWQgKS5qb2luKCAnLCcgKX1dYDtcclxuICB9XHJcbn07XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnUERPTVRyZWUnLCBQRE9NVHJlZSApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgUERPTVRyZWU7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLGVBQWUsTUFBTSw2Q0FBNkM7QUFDekUsU0FBU0MsYUFBYSxFQUFFQyxZQUFZLEVBQUVDLElBQUksRUFBRUMsZ0JBQWdCLEVBQUVDLFlBQVksRUFBRUMsT0FBTyxFQUFFQyxLQUFLLFFBQVEsa0JBQWtCO0FBRXBILE1BQU1DLFFBQVEsR0FBRztFQUNmO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0VDLFFBQVFBLENBQUVDLE1BQU0sRUFBRUMsS0FBSyxFQUFHO0lBQ3hCQyxVQUFVLElBQUlBLFVBQVUsQ0FBQ0osUUFBUSxJQUFJSSxVQUFVLENBQUNKLFFBQVEsQ0FBRyxxQkFBb0JFLE1BQU0sQ0FBQ0csR0FBSSxhQUFZRixLQUFLLENBQUNFLEdBQUksRUFBRSxDQUFDO0lBQ25IRCxVQUFVLElBQUlBLFVBQVUsQ0FBQ0osUUFBUSxJQUFJSSxVQUFVLENBQUNFLElBQUksQ0FBQyxDQUFDO0lBRXREQyxNQUFNLElBQUlBLE1BQU0s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