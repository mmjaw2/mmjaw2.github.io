// Copyright 2013-2023, University of Colorado Boulder

/**
 * Contains information about what renderers (and a few other flags) are supported for an entire subtree.
 *
 * We effectively do this by tracking bitmask changes from scenery.js (used for rendering properties in general). In particular, we count
 * how many zeros in the bitmask we have in key places.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { Node, Renderer, scenery } from '../imports.js';
const summaryBits = [
// renderer bits ("Is renderer X supported by the entire sub-tree?")
Renderer.bitmaskCanvas, Renderer.bitmaskSVG, Renderer.bitmaskDOM, Renderer.bitmaskWebGL,
// summary bits (added to the renderer bitmask to handle special flags for the summary)
Renderer.bitmaskSingleCanvas, Renderer.bitmaskSingleSVG, Renderer.bitmaskNotPainted, Renderer.bitmaskBoundsValid,
// NOTE: This could be separated out into its own implementation for this flag, since
// there are cases where we actually have nothing fromt he PDOM DUE to things being pulled out by another pdom order.
// This is generally NOT the case, so I've left this in here because it significantly simplifies the implementation.
Renderer.bitmaskNoPDOM,
// inverse renderer bits ("Do all painted nodes NOT support renderer X in this sub-tree?")
Renderer.bitmaskLacksCanvas, Renderer.bitmaskLacksSVG, Renderer.bitmaskLacksDOM, Renderer.bitmaskLacksWebGL];
const summaryBitIndices = {};
summaryBits.forEach((bit, index) => {
  summaryBitIndices[bit] = index;
});
const numSummaryBits = summaryBits.length;

// A bitmask with all of the bits set that we record
let bitmaskAll = 0;
for (let l = 0; l < numSummaryBits; l++) {
  bitmaskAll |= summaryBits[l];
}
class RendererSummary {
  /**
   * @param {Node} node
   */
  constructor(node) {
    assert && assert(node instanceof Node);

    // NOTE: assumes that we are created in the Node constructor
    assert && assert(node._rendererBitmask === Renderer.bitmaskNodeDefault, 'Node must have a default bitmask when creating a RendererSummary');
    assert && assert(node._children.length === 0, 'Node cannot have children when creating a RendererSummary');

    // @private {Node}
    this.node = node;

    // @private Int16Array, maps bitmask indices (see summaryBitIndices, the index of the bitmask in summaryBits) to
    // a count of how many children (or self) have that property (e.g. can't renderer all of their contents with Canvas)
    this._counts = new Int16Array(numSummaryBits);

    // @public {number} (scenery-internal)
    this.bitmask = bitmaskAll;

    // @private {number}
    this.selfBitmask = RendererSummary.summaryBitmaskForNodeSelf(node);
    this.summaryChange(this.bitmask, this.selfBitmask);

    // required listeners to update our summary based on painted/non-painted information
    const listener = this.selfChange.bind(this);
    this.node.filterChangeEmitter.addListener(listener);
    this.node.clipAreaProperty.lazyLink(listener);
    this.node.rendererSummaryRefreshEmitter.addListener(listener);
  }

  /**
   * Use a bitmask of all 1s to represent 'does not exist' since we count zeros
   * @public
   *
   * @param {number} oldBitmask
   * @param {number} newBitmask
   */
  summaryChange(oldBitmask, newBitmask) {
    assert && this.audit();
    const changeBitmask = oldBitmask ^ newBitmask; // bit set only if it changed

    let ancestorOldMask = 0;
    let ancestorNewMask = 0;
    for (let i = 0; i < numSummaryBits; i++) {
      const bit = summaryBits[i];
      const bitIndex = summaryBitIndices[bit];

      // If the bit for the renderer has changed
      if (bit & changeBitmask) {
        // If it is now set (wasn't before), gained support for the renderer
        if (bit & newBitmask) {
          this._counts[bitIndex]--; // reduce count, since we count the number of 0s (unsupported)
          if (this._counts[bitIndex] === 0) {
            ancestorNewMask |= bit; // add our bit to the "new" mask we will send to ancestors
          }
        }
        // It was set before (now isn't), lost support for the renderer
        else {
          this._counts[bitIndex]++; // increment the count, since we count the number of 0s (unsupported)
          if (this._counts[bitIndex] === 1) {
            ancestorOldMask |= bit; // add our bit to the "old" mask we will send to ancestors
          }
        }
      }
    }
    if (ancestorOldMask || ancestorNewMask) {
      const oldSubtreeBitmask = this.bitmask;
      assert && assert(oldSubtreeBitmask !== undefined);
      for (let j = 0; j < numSummaryBits; j++) {
        const ancestorBit = summaryBits[j];
        // Check for added bits
        if (ancestorNewMask & ancestorBit) {
          this.bitmask |= ancestorBit;
        }

        // Check for removed bits
        if (ancestorOldMask & ancestorBit) {
          this.bitmask ^= ancestorBit;
          assert && assert(!(this.bitmask & ancestorBit), 'Should be cleared, doing cheaper XOR assuming it already was set');
        }
      }
      this.node.instanceRefreshEmitter.emit();
      this.node.onSummaryChange(oldSubtreeBitmask, this.bitmask);
      const len = this.node._parents.length;
      for (let k = 0; k < len; k++) {
        this.node._parents[k]._rendererSummary.summaryChange(ancestorOldMask, ancestorNewMask);
      }
      assert && assert(this.bitmask === this.computeBitmask(), 'Sanity check');
    }
    assert && this.audit();
  }

  /**
   * @public
   */
  selfChange() {
    const oldBitmask = this.selfBitmask;
    const newBitmask = RendererSummary.summaryBitmaskForNodeSelf(this.node);
    if (oldBitmask !== newBitmask) {
      this.summaryChange(oldBitmask, newBitmask);
      this.selfBitmask = newBitmask;
    }
  }

  /**
   * @private
   *
   * @returns {number}
   */
  computeBitmask() {
    let bitmask = 0;
    for (let i = 0; i < numSummaryBits; i++) {
      if (this._counts[i] === 0) {
        bitmask |= summaryBits[i];
      }
    }
    return bitmask;
  }

  /**
   * @public
   * Is the renderer compatible with every single painted node under this subtree?
   * (Can this entire sub-tree be rendered with just this renderer)
   *
   * @param {number} renderer - Single bit preferred. If multiple bits set, requires ALL painted nodes are compatible
   *                            with ALL of the bits.
   */
  isSubtreeFullyCompatible(renderer) {
    return !!(renderer & this.bitmask);
  }

  /**
   * @public
   * Is the renderer compatible with at least one painted node under this subtree?
   *
   * @param {number} renderer - Single bit preferred. If multiple bits set, will return if a single painted node is
   *                            compatible with at least one of the bits.
   */
  isSubtreeContainingCompatible(renderer) {
    return !(renderer << Renderer.bitmaskLacksShift & this.bitmask);
  }

  /**
   * @public
   *
   * @returns {boolean}
   */
  isSingleCanvasSupported() {
    return !!(Renderer.bitmaskSingleCanvas & this.bitmask);
  }

  /**
   * @public
   *
   * @returns {boolean}
   */
  isSingleSVGSupported() {
    return !!(Renderer.bitmaskSingleSVG & this.bitmask);
  }

  /**
   * @public
   *
   * @returns {boolean}
   */
  isNotPainted() {
    return !!(Renderer.bitmaskNotPainted & this.bitmask);
  }

  /**
   * @public
   *
   * @returns {boolean}
   */
  hasNoPDOM() {
    return !!(Renderer.bitmaskNoPDOM & this.bitmask);
  }

  /**
   * @public
   *
   * @returns {boolean}
   */
  areBoundsValid() {
    return !!(Renderer.bitmaskBoundsValid & this.bitmask);
  }

  /**
   * Given a bitmask representing a list of ordered preferred renderers, we check to see if all of our nodes can be
   * displayed in a single SVG block, AND that given the preferred renderers, that it will actually happen in our
   * rendering process.
   * @public
   *
   * @param {number} preferredRenderers
   * @returns {boolean}
   */
  isSubtreeRenderedExclusivelySVG(preferredRenderers) {
    // Check if we have anything that would PREVENT us from having a single SVG block
    if (!this.isSingleSVGSupported()) {
      return false;
    }

    // Check for any renderer preferences that would CAUSE us to choose not to display with a single SVG block
    for (let i = 0; i < Renderer.numActiveRenderers; i++) {
      // Grab the next-most preferred renderer
      const renderer = Renderer.bitmaskOrder(preferredRenderers, i);

      // If it's SVG, congrats! Everything will render in SVG (since SVG is supported, as noted above)
      if (Renderer.bitmaskSVG & renderer) {
        return true;
      }

      // Since it's not SVG, if there's a single painted node that supports this renderer (which is preferred over SVG),
      // then it will be rendered with this renderer, NOT SVG.
      if (this.isSubtreeContainingCompatible(renderer)) {
        return false;
      }
    }
    return false; // sanity check
  }

  /**
   * Given a bitmask representing a list of ordered preferred renderers, we check to see if all of our nodes can be
   * displayed in a single Canvas block, AND that given the preferred renderers, that it will actually happen in our
   * rendering process.
   * @public
   *
   * @param {number} preferredRenderers
   * @returns {boolean}
   */
  isSubtreeRenderedExclusivelyCanvas(preferredRenderers) {
    // Check if we have anything that would PREVENT us from having a single Canvas block
    if (!this.isSingleCanvasSupported()) {
      return false;
    }

    // Check for any renderer preferences that would CAUSE us to choose not to display with a single Canvas block
    for (let i = 0; i < Renderer.numActiveRenderers; i++) {
      // Grab the next-most preferred renderer
      const renderer = Renderer.bitmaskOrder(preferredRenderers, i);

      // If it's Canvas, congrats! Everything will render in Canvas (since Canvas is supported, as noted above)
      if (Renderer.bitmaskCanvas & renderer) {
        return true;
      }

      // Since it's not Canvas, if there's a single painted node that supports this renderer (which is preferred over Canvas),
      // then it will be rendered with this renderer, NOT Canvas.
      if (this.isSubtreeContainingCompatible(renderer)) {
        return false;
      }
    }
    return false; // sanity check
  }

  /**
   * For debugging purposes
   * @public
   */
  audit() {
    if (assert) {
      for (let i = 0; i < numSummaryBits; i++) {
        const bit = summaryBits[i];
        const countIsZero = this._counts[i] === 0;
        const bitmaskContainsBit = !!(this.bitmask & bit);
        assert(countIsZero === bitmaskContainsBit, 'Bits should be set if count is zero');
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
    let result = RendererSummary.bitmaskToString(this.bitmask);
    for (let i = 0; i < numSummaryBits; i++) {
      const bit = summaryBits[i];
      const countForBit = this._counts[i];
      if (countForBit !== 0) {
        result += ` ${RendererSummary.bitToString(bit)}:${countForBit}`;
      }
    }
    return result;
  }

  /**
   * Determines which of the summary bits can be set for a specific Node (ignoring children/ancestors).
   * For instance, for bitmaskSingleSVG, we only don't include the flag if THIS node prevents its usage
   * (even though child nodes may prevent it in the renderer summary itself).
   * @public
   *
   * @param {Node} node
   */
  static summaryBitmaskForNodeSelf(node) {
    let bitmask = node._rendererBitmask;
    if (node.isPainted()) {
      bitmask |= (node._rendererBitmask & Renderer.bitmaskCurrentRendererArea ^ Renderer.bitmaskCurrentRendererArea) << Renderer.bitmaskLacksShift;
    } else {
      bitmask |= Renderer.bitmaskCurrentRendererArea << Renderer.bitmaskLacksShift;
    }

    // NOTE: If changing, see Instance.updateRenderingState
    const requiresSplit = node._cssTransform || node._layerSplit;
    const rendererHint = node._renderer;

    // Whether this subtree will be able to support a single SVG element
    // NOTE: If changing, see Instance.updateRenderingState
    if (!requiresSplit &&
    // Can't have a single SVG element if we are split
    Renderer.isSVG(node._rendererBitmask) && (
    // If our node doesn't support SVG, can't do it
    !rendererHint || Renderer.isSVG(rendererHint))) {
      // Can't if a renderer hint is set to something else
      bitmask |= Renderer.bitmaskSingleSVG;
    }

    // Whether this subtree will be able to support a single Canvas element
    // NOTE: If changing, see Instance.updateRenderingState
    if (!requiresSplit &&
    // Can't have a single SVG element if we are split
    Renderer.isCanvas(node._rendererBitmask) && (
    // If our node doesn't support Canvas, can't do it
    !rendererHint || Renderer.isCanvas(rendererHint))) {
      // Can't if a renderer hint is set to something else
      bitmask |= Renderer.bitmaskSingleCanvas;
    }
    if (!node.isPainted()) {
      bitmask |= Renderer.bitmaskNotPainted;
    }
    if (node.areSelfBoundsValid()) {
      bitmask |= Renderer.bitmaskBoundsValid;
    }
    if (!node.hasPDOMContent && !node.hasPDOMOrder()) {
      bitmask |= Renderer.bitmaskNoPDOM;
    }
    return bitmask;
  }

  /**
   * For debugging purposes
   * @public
   *
   * @param {number} bit
   * @returns {string}
   */
  static bitToString(bit) {
    if (bit === Renderer.bitmaskCanvas) {
      return 'Canvas';
    }
    if (bit === Renderer.bitmaskSVG) {
      return 'SVG';
    }
    if (bit === Renderer.bitmaskDOM) {
      return 'DOM';
    }
    if (bit === Renderer.bitmaskWebGL) {
      return 'WebGL';
    }
    if (bit === Renderer.bitmaskLacksCanvas) {
      return '(-Canvas)';
    }
    if (bit === Renderer.bitmaskLacksSVG) {
      return '(-SVG)';
    }
    if (bit === Renderer.bitmaskLacksDOM) {
      return '(-DOM)';
    }
    if (bit === Renderer.bitmaskLacksWebGL) {
      return '(-WebGL)';
    }
    if (bit === Renderer.bitmaskSingleCanvas) {
      return 'SingleCanvas';
    }
    if (bit === Renderer.bitmaskSingleSVG) {
      return 'SingleSVG';
    }
    if (bit === Renderer.bitmaskNotPainted) {
      return 'NotPainted';
    }
    if (bit === Renderer.bitmaskBoundsValid) {
      return 'BoundsValid';
    }
    if (bit === Renderer.bitmaskNoPDOM) {
      return 'NotAccessible';
    }
    return '?';
  }

  /**
   * For debugging purposes
   * @public
   *
   * @param {number} bitmask
   * @returns {string}
   */
  static bitmaskToString(bitmask) {
    let result = '';
    for (let i = 0; i < numSummaryBits; i++) {
      const bit = summaryBits[i];
      if (bitmask & bit) {
        result += `${RendererSummary.bitToString(bit)} `;
      }
    }
    return result;
  }
}

// @public {number}
RendererSummary.bitmaskAll = bitmaskAll;
scenery.register('RendererSummary', RendererSummary);
export default RendererSummary;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJOb2RlIiwiUmVuZGVyZXIiLCJzY2VuZXJ5Iiwic3VtbWFyeUJpdHMiLCJiaXRtYXNrQ2FudmFzIiwiYml0bWFza1NWRyIsImJpdG1hc2tET00iLCJiaXRtYXNrV2ViR0wiLCJiaXRtYXNrU2luZ2xlQ2FudmFzIiwiYml0bWFza1NpbmdsZVNWRyIsImJpdG1hc2tOb3RQYWludGVkIiwiYml0bWFza0JvdW5kc1ZhbGlkIiwiYml0bWFza05vUERPTSIsImJpdG1hc2tMYWNrc0NhbnZhcyIsImJpdG1hc2tMYWNrc1NWRyIsImJpdG1hc2tMYWNrc0RPTSIsImJpdG1hc2tMYWNrc1dlYkdMIiwic3VtbWFyeUJpdEluZGljZXMiLCJmb3JFYWNoIiwiYml0IiwiaW5kZXgiLCJudW1TdW1tYXJ5Qml0cyIsImxlbmd0aCIsImJpdG1hc2tBbGwiLCJsIiwiUmVuZGVyZXJTdW1tYXJ5IiwiY29uc3RydWN0b3IiLCJub2RlIiwiYXNzZXJ0IiwiX3JlbmRlcmVyQml0bWFzayIsImJpdG1hc2tOb2RlRGVmYXVsdCIsIl9jaGlsZHJlbiIsIl9jb3VudHMiLCJJbnQxNkFycmF5IiwiYml0bWFzayIsInNlbGZCaXRtYXNrIiwic3VtbWFyeUJpdG1hc2tGb3JOb2RlU2VsZiIsInN1bW1hcnlDaGFuZ2UiLCJsaXN0ZW5lciIsInNlbGZDaGFuZ2UiLCJiaW5kIiwiZmlsdGVyQ2hhbmdlRW1pdHRlciIsImFkZExpc3RlbmVyIiwiY2xpcEFyZWFQcm9wZXJ0eSIsImxhenlMaW5rIiwicmVuZGVyZXJTdW1tYXJ5UmVmcmVzaEVtaXR0ZXIiLCJvbGRCaXRtYXNrIiwibmV3Qml0bWFzayIsImF1ZGl0IiwiY2hhbmdlQml0bWFzayIsImFuY2VzdG9yT2xkTWFzayIsImFuY2VzdG9yTmV3TWFzayIsImkiLCJiaXRJbmRleCIsIm9sZFN1YnRyZWVCaXRtYXNrIiwidW5kZWZpbmVkIiwiaiIsImFuY2VzdG9yQml0IiwiaW5zdGFuY2VSZWZyZXNoRW1pdHRlciIsImVtaXQiLCJvblN1bW1hcnlDaGFuZ2UiLCJsZW4iLCJfcGFyZW50cyIsImsiLCJfcmVuZGVyZXJTdW1tYXJ5IiwiY29tcHV0ZUJpdG1hc2siLCJpc1N1YnRyZWVGdWxseUNvbXBhdGlibGUiLCJyZW5kZXJlciIsImlzU3VidHJlZUNvbnRhaW5pbmdDb21wYXRpYmxlIiwiYml0bWFza0xhY2tzU2hpZnQiLCJpc1NpbmdsZUNhbnZhc1N1cHBvcnRlZCIsImlzU2luZ2xlU1ZHU3VwcG9ydGVkIiwiaXNOb3RQYWludGVkIiwiaGFzTm9QRE9NIiwiYXJlQm91bmRzVmFsaWQiLCJpc1N1YnRyZWVSZW5kZXJlZEV4Y2x1c2l2ZWx5U1ZHIiwicHJlZmVycmVkUmVuZGVyZXJzIiwibnVtQWN0aXZlUmVuZGVyZXJzIiwiYml0bWFza09yZGVyIiwiaXNTdWJ0cmVlUmVuZGVyZWRFeGNsdXNpdmVseUNhbnZhcyIsImNvdW50SXNaZXJvIiwiYml0bWFza0NvbnRhaW5zQml0IiwidG9TdHJpbmciLCJyZXN1bHQiLCJiaXRtYXNrVG9TdHJpbmciLCJjb3VudEZvckJpdCIsImJpdFRvU3RyaW5nIiwiaXNQYWludGVkIiwiYml0bWFza0N1cnJlbnRSZW5kZXJlckFyZWEiLCJyZXF1aXJlc1NwbGl0IiwiX2Nzc1RyYW5zZm9ybSIsIl9sYXllclNwbGl0IiwicmVuZGVyZXJIaW50IiwiX3JlbmRlcmVyIiwiaXNTVkciLCJpc0NhbnZhcyIsImFyZVNlbGZCb3VuZHNWYWxpZCIsImhhc1BET01Db250ZW50IiwiaGFzUERPTU9yZGVyIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJSZW5kZXJlclN1bW1hcnkuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQ29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgd2hhdCByZW5kZXJlcnMgKGFuZCBhIGZldyBvdGhlciBmbGFncykgYXJlIHN1cHBvcnRlZCBmb3IgYW4gZW50aXJlIHN1YnRyZWUuXHJcbiAqXHJcbiAqIFdlIGVmZmVjdGl2ZWx5IGRvIHRoaXMgYnkgdHJhY2tpbmcgYml0bWFzayBjaGFuZ2VzIGZyb20gc2NlbmVyeS5qcyAodXNlZCBmb3IgcmVuZGVyaW5nIHByb3BlcnRpZXMgaW4gZ2VuZXJhbCkuIEluIHBhcnRpY3VsYXIsIHdlIGNvdW50XHJcbiAqIGhvdyBtYW55IHplcm9zIGluIHRoZSBiaXRtYXNrIHdlIGhhdmUgaW4ga2V5IHBsYWNlcy5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCB7IE5vZGUsIFJlbmRlcmVyLCBzY2VuZXJ5IH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcblxyXG5jb25zdCBzdW1tYXJ5Qml0cyA9IFtcclxuICAvLyByZW5kZXJlciBiaXRzIChcIklzIHJlbmRlcmVyIFggc3VwcG9ydGVkIGJ5IHRoZSBlbnRpcmUgc3ViLXRyZWU/XCIpXHJcbiAgUmVuZGVyZXIuYml0bWFza0NhbnZhcyxcclxuICBSZW5kZXJlci5iaXRtYXNrU1ZHLFxyXG4gIFJlbmRlcmVyLmJpdG1hc2tET00sXHJcbiAgUmVuZGVyZXIuYml0bWFza1dlYkdMLFxyXG5cclxuICAvLyBzdW1tYXJ5IGJpdHMgKGFkZGVkIHRvIHRoZSByZW5kZXJlciBiaXRtYXNrIHRvIGhhbmRsZSBzcGVjaWFsIGZsYWdzIGZvciB0aGUgc3VtbWFyeSlcclxuICBSZW5kZXJlci5iaXRtYXNrU2luZ2xlQ2FudmFzLFxyXG4gIFJlbmRlcmVyLmJpdG1hc2tTaW5nbGVTVkcsXHJcbiAgUmVuZGVyZXIuYml0bWFza05vdFBhaW50ZWQsXHJcbiAgUmVuZGVyZXIuYml0bWFza0JvdW5kc1ZhbGlkLFxyXG4gIC8vIE5PVEU6IFRoaXMgY291bGQgYmUgc2VwYXJhdGVkIG91dCBpbnRvIGl0cyBvd24gaW1wbGVtZW50YXRpb24gZm9yIHRoaXMgZmxhZywgc2luY2VcclxuICAvLyB0aGVyZSBhcmUgY2FzZXMgd2hlcmUgd2UgYWN0dWFsbHkgaGF2ZSBub3RoaW5nIGZyb210IGhlIFBET00gRFVFIHRvIHRoaW5ncyBiZWluZyBwdWxsZWQgb3V0IGJ5IGFub3RoZXIgcGRvbSBvcmRlci5cclxuICAvLyBUaGlzIGlzIGdlbmVyYWxseSBOT1QgdGhlIGNhc2UsIHNvIEkndmUgbGVmdCB0aGlzIGluIGhlcmUgYmVjYXVzZSBpdCBzaWduaWZpY2FudGx5IHNpbXBsaWZpZXMgdGhlIGltcGxlbWVudGF0aW9uLlxyXG4gIFJlbmRlcmVyLmJpdG1hc2tOb1BET00sXHJcblxyXG4gIC8vIGludmVyc2UgcmVuZGVyZXIgYml0cyAoXCJEbyBhbGwgcGFpbnRlZCBub2RlcyBOT1Qgc3VwcG9ydCByZW5kZXJlciBYIGluIHRoaXMgc3ViLXRyZWU/XCIpXHJcbiAgUmVuZGVyZXIuYml0bWFza0xhY2tzQ2FudmFzLFxyXG4gIFJlbmRlcmVyLmJpdG1hc2tMYWNrc1NWRyxcclxuICBSZW5kZXJlci5iaXRtYXNrTGFja3NET00sXHJcbiAgUmVuZGVyZXIuYml0bWFza0xhY2tzV2ViR0xcclxuXTtcclxuXHJcbmNvbnN0IHN1bW1hcnlCaXRJbmRpY2VzID0ge307XHJcbnN1bW1hcnlCaXRzLmZvckVhY2goICggYml0LCBpbmRleCApID0+IHtcclxuICBzdW1tYXJ5Qml0SW5kaWNlc1sgYml0IF0gPSBpbmRleDtcclxufSApO1xyXG5cclxuY29uc3QgbnVtU3VtbWFyeUJpdHMgPSBzdW1tYXJ5Qml0cy5sZW5ndGg7XHJcblxyXG4vLyBBIGJpdG1hc2sgd2l0aCBhbGwgb2YgdGhlIGJpdHMgc2V0IHRoYXQgd2UgcmVjb3JkXHJcbmxldCBiaXRtYXNrQWxsID0gMDtcclxuZm9yICggbGV0IGwgPSAwOyBsIDwgbnVtU3VtbWFyeUJpdHM7IGwrKyApIHtcclxuICBiaXRtYXNrQWxsIHw9IHN1bW1hcnlCaXRzWyBsIF07XHJcbn1cclxuXHJcbmNsYXNzIFJlbmRlcmVyU3VtbWFyeSB7XHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHtOb2RlfSBub2RlXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoIG5vZGUgKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBub2RlIGluc3RhbmNlb2YgTm9kZSApO1xyXG5cclxuICAgIC8vIE5PVEU6IGFzc3VtZXMgdGhhdCB3ZSBhcmUgY3JlYXRlZCBpbiB0aGUgTm9kZSBjb25zdHJ1Y3RvclxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbm9kZS5fcmVuZGVyZXJCaXRtYXNrID09PSBSZW5kZXJlci5iaXRtYXNrTm9kZURlZmF1bHQsICdOb2RlIG11c3QgaGF2ZSBhIGRlZmF1bHQgYml0bWFzayB3aGVuIGNyZWF0aW5nIGEgUmVuZGVyZXJTdW1tYXJ5JyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbm9kZS5fY2hpbGRyZW4ubGVuZ3RoID09PSAwLCAnTm9kZSBjYW5ub3QgaGF2ZSBjaGlsZHJlbiB3aGVuIGNyZWF0aW5nIGEgUmVuZGVyZXJTdW1tYXJ5JyApO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtOb2RlfVxyXG4gICAgdGhpcy5ub2RlID0gbm9kZTtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSBJbnQxNkFycmF5LCBtYXBzIGJpdG1hc2sgaW5kaWNlcyAoc2VlIHN1bW1hcnlCaXRJbmRpY2VzLCB0aGUgaW5kZXggb2YgdGhlIGJpdG1hc2sgaW4gc3VtbWFyeUJpdHMpIHRvXHJcbiAgICAvLyBhIGNvdW50IG9mIGhvdyBtYW55IGNoaWxkcmVuIChvciBzZWxmKSBoYXZlIHRoYXQgcHJvcGVydHkgKGUuZy4gY2FuJ3QgcmVuZGVyZXIgYWxsIG9mIHRoZWlyIGNvbnRlbnRzIHdpdGggQ2FudmFzKVxyXG4gICAgdGhpcy5fY291bnRzID0gbmV3IEludDE2QXJyYXkoIG51bVN1bW1hcnlCaXRzICk7XHJcblxyXG4gICAgLy8gQHB1YmxpYyB7bnVtYmVyfSAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgIHRoaXMuYml0bWFzayA9IGJpdG1hc2tBbGw7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge251bWJlcn1cclxuICAgIHRoaXMuc2VsZkJpdG1hc2sgPSBSZW5kZXJlclN1bW1hcnkuc3VtbWFyeUJpdG1hc2tGb3JOb2RlU2VsZiggbm9kZSApO1xyXG5cclxuICAgIHRoaXMuc3VtbWFyeUNoYW5nZSggdGhpcy5iaXRtYXNrLCB0aGlzLnNlbGZCaXRtYXNrICk7XHJcblxyXG4gICAgLy8gcmVxdWlyZWQgbGlzdGVuZXJzIHRvIHVwZGF0ZSBvdXIgc3VtbWFyeSBiYXNlZCBvbiBwYWludGVkL25vbi1wYWludGVkIGluZm9ybWF0aW9uXHJcbiAgICBjb25zdCBsaXN0ZW5lciA9IHRoaXMuc2VsZkNoYW5nZS5iaW5kKCB0aGlzICk7XHJcbiAgICB0aGlzLm5vZGUuZmlsdGVyQ2hhbmdlRW1pdHRlci5hZGRMaXN0ZW5lciggbGlzdGVuZXIgKTtcclxuICAgIHRoaXMubm9kZS5jbGlwQXJlYVByb3BlcnR5LmxhenlMaW5rKCBsaXN0ZW5lciApO1xyXG4gICAgdGhpcy5ub2RlLnJlbmRlcmVyU3VtbWFyeVJlZnJlc2hFbWl0dGVyLmFkZExpc3RlbmVyKCBsaXN0ZW5lciApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXNlIGEgYml0bWFzayBvZiBhbGwgMXMgdG8gcmVwcmVzZW50ICdkb2VzIG5vdCBleGlzdCcgc2luY2Ugd2UgY291bnQgemVyb3NcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gb2xkQml0bWFza1xyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBuZXdCaXRtYXNrXHJcbiAgICovXHJcbiAgc3VtbWFyeUNoYW5nZSggb2xkQml0bWFzaywgbmV3Qml0bWFzayApIHtcclxuICAgIGFzc2VydCAmJiB0aGlzLmF1ZGl0KCk7XHJcblxyXG4gICAgY29uc3QgY2hhbmdlQml0bWFzayA9IG9sZEJpdG1hc2sgXiBuZXdCaXRtYXNrOyAvLyBiaXQgc2V0IG9ubHkgaWYgaXQgY2hhbmdlZFxyXG5cclxuICAgIGxldCBhbmNlc3Rvck9sZE1hc2sgPSAwO1xyXG4gICAgbGV0IGFuY2VzdG9yTmV3TWFzayA9IDA7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBudW1TdW1tYXJ5Qml0czsgaSsrICkge1xyXG4gICAgICBjb25zdCBiaXQgPSBzdW1tYXJ5Qml0c1sgaSBdO1xyXG4gICAgICBjb25zdCBiaXRJbmRleCA9IHN1bW1hcnlCaXRJbmRpY2VzWyBiaXQgXTtcclxuXHJcbiAgICAgIC8vIElmIHRoZSBiaXQgZm9yIHRoZSByZW5kZXJlciBoYXMgY2hhbmdlZFxyXG4gICAgICBpZiAoIGJpdCAmIGNoYW5nZUJpdG1hc2sgKSB7XHJcblxyXG4gICAgICAgIC8vIElmIGl0IGlzIG5vdyBzZXQgKHdhc24ndCBiZWZvcmUpLCBnYWluZWQgc3VwcG9ydCBmb3IgdGhlIHJlbmRlcmVyXHJcbiAgICAgICAgaWYgKCBiaXQgJiBuZXdCaXRtYXNrICkge1xyXG4gICAgICAgICAgdGhpcy5fY291bnRzWyBiaXRJbmRleCBdLS07IC8vIHJlZHVjZSBjb3VudCwgc2luY2Ugd2UgY291bnQgdGhlIG51bWJlciBvZiAwcyAodW5zdXBwb3J0ZWQpXHJcbiAgICAgICAgICBpZiAoIHRoaXMuX2NvdW50c1sgYml0SW5kZXggXSA9PT0gMCApIHtcclxuICAgICAgICAgICAgYW5jZXN0b3JOZXdNYXNrIHw9IGJpdDsgLy8gYWRkIG91ciBiaXQgdG8gdGhlIFwibmV3XCIgbWFzayB3ZSB3aWxsIHNlbmQgdG8gYW5jZXN0b3JzXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEl0IHdhcyBzZXQgYmVmb3JlIChub3cgaXNuJ3QpLCBsb3N0IHN1cHBvcnQgZm9yIHRoZSByZW5kZXJlclxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5fY291bnRzWyBiaXRJbmRleCBdKys7IC8vIGluY3JlbWVudCB0aGUgY291bnQsIHNpbmNlIHdlIGNvdW50IHRoZSBudW1iZXIgb2YgMHMgKHVuc3VwcG9ydGVkKVxyXG4gICAgICAgICAgaWYgKCB0aGlzLl9jb3VudHNbIGJpdEluZGV4IF0gPT09IDEgKSB7XHJcbiAgICAgICAgICAgIGFuY2VzdG9yT2xkTWFzayB8PSBiaXQ7IC8vIGFkZCBvdXIgYml0IHRvIHRoZSBcIm9sZFwiIG1hc2sgd2Ugd2lsbCBzZW5kIHRvIGFuY2VzdG9yc1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICggYW5jZXN0b3JPbGRNYXNrIHx8IGFuY2VzdG9yTmV3TWFzayApIHtcclxuXHJcbiAgICAgIGNvbnN0IG9sZFN1YnRyZWVCaXRtYXNrID0gdGhpcy5iaXRtYXNrO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvbGRTdWJ0cmVlQml0bWFzayAhPT0gdW5kZWZpbmVkICk7XHJcblxyXG4gICAgICBmb3IgKCBsZXQgaiA9IDA7IGogPCBudW1TdW1tYXJ5Qml0czsgaisrICkge1xyXG4gICAgICAgIGNvbnN0IGFuY2VzdG9yQml0ID0gc3VtbWFyeUJpdHNbIGogXTtcclxuICAgICAgICAvLyBDaGVjayBmb3IgYWRkZWQgYml0c1xyXG4gICAgICAgIGlmICggYW5jZXN0b3JOZXdNYXNrICYgYW5jZXN0b3JCaXQgKSB7XHJcbiAgICAgICAgICB0aGlzLmJpdG1hc2sgfD0gYW5jZXN0b3JCaXQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDaGVjayBmb3IgcmVtb3ZlZCBiaXRzXHJcbiAgICAgICAgaWYgKCBhbmNlc3Rvck9sZE1hc2sgJiBhbmNlc3RvckJpdCApIHtcclxuICAgICAgICAgIHRoaXMuYml0bWFzayBePSBhbmNlc3RvckJpdDtcclxuICAgICAgICAgIGFzc2VydCAmJiBhc3NlcnQoICEoIHRoaXMuYml0bWFzayAmIGFuY2VzdG9yQml0ICksXHJcbiAgICAgICAgICAgICdTaG91bGQgYmUgY2xlYXJlZCwgZG9pbmcgY2hlYXBlciBYT1IgYXNzdW1pbmcgaXQgYWxyZWFkeSB3YXMgc2V0JyApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5ub2RlLmluc3RhbmNlUmVmcmVzaEVtaXR0ZXIuZW1pdCgpO1xyXG4gICAgICB0aGlzLm5vZGUub25TdW1tYXJ5Q2hhbmdlKCBvbGRTdWJ0cmVlQml0bWFzaywgdGhpcy5iaXRtYXNrICk7XHJcblxyXG4gICAgICBjb25zdCBsZW4gPSB0aGlzLm5vZGUuX3BhcmVudHMubGVuZ3RoO1xyXG4gICAgICBmb3IgKCBsZXQgayA9IDA7IGsgPCBsZW47IGsrKyApIHtcclxuICAgICAgICB0aGlzLm5vZGUuX3BhcmVudHNbIGsgXS5fcmVuZGVyZXJTdW1tYXJ5LnN1bW1hcnlDaGFuZ2UoIGFuY2VzdG9yT2xkTWFzaywgYW5jZXN0b3JOZXdNYXNrICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuYml0bWFzayA9PT0gdGhpcy5jb21wdXRlQml0bWFzaygpLCAnU2FuaXR5IGNoZWNrJyApO1xyXG4gICAgfVxyXG5cclxuICAgIGFzc2VydCAmJiB0aGlzLmF1ZGl0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICovXHJcbiAgc2VsZkNoYW5nZSgpIHtcclxuICAgIGNvbnN0IG9sZEJpdG1hc2sgPSB0aGlzLnNlbGZCaXRtYXNrO1xyXG4gICAgY29uc3QgbmV3Qml0bWFzayA9IFJlbmRlcmVyU3VtbWFyeS5zdW1tYXJ5Qml0bWFza0Zvck5vZGVTZWxmKCB0aGlzLm5vZGUgKTtcclxuICAgIGlmICggb2xkQml0bWFzayAhPT0gbmV3Qml0bWFzayApIHtcclxuICAgICAgdGhpcy5zdW1tYXJ5Q2hhbmdlKCBvbGRCaXRtYXNrLCBuZXdCaXRtYXNrICk7XHJcbiAgICAgIHRoaXMuc2VsZkJpdG1hc2sgPSBuZXdCaXRtYXNrO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgY29tcHV0ZUJpdG1hc2soKSB7XHJcbiAgICBsZXQgYml0bWFzayA9IDA7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBudW1TdW1tYXJ5Qml0czsgaSsrICkge1xyXG4gICAgICBpZiAoIHRoaXMuX2NvdW50c1sgaSBdID09PSAwICkge1xyXG4gICAgICAgIGJpdG1hc2sgfD0gc3VtbWFyeUJpdHNbIGkgXTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJpdG1hc2s7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICogSXMgdGhlIHJlbmRlcmVyIGNvbXBhdGlibGUgd2l0aCBldmVyeSBzaW5nbGUgcGFpbnRlZCBub2RlIHVuZGVyIHRoaXMgc3VidHJlZT9cclxuICAgKiAoQ2FuIHRoaXMgZW50aXJlIHN1Yi10cmVlIGJlIHJlbmRlcmVkIHdpdGgganVzdCB0aGlzIHJlbmRlcmVyKVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHJlbmRlcmVyIC0gU2luZ2xlIGJpdCBwcmVmZXJyZWQuIElmIG11bHRpcGxlIGJpdHMgc2V0LCByZXF1aXJlcyBBTEwgcGFpbnRlZCBub2RlcyBhcmUgY29tcGF0aWJsZVxyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpdGggQUxMIG9mIHRoZSBiaXRzLlxyXG4gICAqL1xyXG4gIGlzU3VidHJlZUZ1bGx5Q29tcGF0aWJsZSggcmVuZGVyZXIgKSB7XHJcbiAgICByZXR1cm4gISEoIHJlbmRlcmVyICYgdGhpcy5iaXRtYXNrICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICogSXMgdGhlIHJlbmRlcmVyIGNvbXBhdGlibGUgd2l0aCBhdCBsZWFzdCBvbmUgcGFpbnRlZCBub2RlIHVuZGVyIHRoaXMgc3VidHJlZT9cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByZW5kZXJlciAtIFNpbmdsZSBiaXQgcHJlZmVycmVkLiBJZiBtdWx0aXBsZSBiaXRzIHNldCwgd2lsbCByZXR1cm4gaWYgYSBzaW5nbGUgcGFpbnRlZCBub2RlIGlzXHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcGF0aWJsZSB3aXRoIGF0IGxlYXN0IG9uZSBvZiB0aGUgYml0cy5cclxuICAgKi9cclxuICBpc1N1YnRyZWVDb250YWluaW5nQ29tcGF0aWJsZSggcmVuZGVyZXIgKSB7XHJcbiAgICByZXR1cm4gISggKCByZW5kZXJlciA8PCBSZW5kZXJlci5iaXRtYXNrTGFja3NTaGlmdCApICYgdGhpcy5iaXRtYXNrICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgKi9cclxuICBpc1NpbmdsZUNhbnZhc1N1cHBvcnRlZCgpIHtcclxuICAgIHJldHVybiAhISggUmVuZGVyZXIuYml0bWFza1NpbmdsZUNhbnZhcyAmIHRoaXMuYml0bWFzayApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICovXHJcbiAgaXNTaW5nbGVTVkdTdXBwb3J0ZWQoKSB7XHJcbiAgICByZXR1cm4gISEoIFJlbmRlcmVyLmJpdG1hc2tTaW5nbGVTVkcgJiB0aGlzLmJpdG1hc2sgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAqL1xyXG4gIGlzTm90UGFpbnRlZCgpIHtcclxuICAgIHJldHVybiAhISggUmVuZGVyZXIuYml0bWFza05vdFBhaW50ZWQgJiB0aGlzLmJpdG1hc2sgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAqL1xyXG4gIGhhc05vUERPTSgpIHtcclxuICAgIHJldHVybiAhISggUmVuZGVyZXIuYml0bWFza05vUERPTSAmIHRoaXMuYml0bWFzayApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICovXHJcbiAgYXJlQm91bmRzVmFsaWQoKSB7XHJcbiAgICByZXR1cm4gISEoIFJlbmRlcmVyLmJpdG1hc2tCb3VuZHNWYWxpZCAmIHRoaXMuYml0bWFzayApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2l2ZW4gYSBiaXRtYXNrIHJlcHJlc2VudGluZyBhIGxpc3Qgb2Ygb3JkZXJlZCBwcmVmZXJyZWQgcmVuZGVyZXJzLCB3ZSBjaGVjayB0byBzZWUgaWYgYWxsIG9mIG91ciBub2RlcyBjYW4gYmVcclxuICAgKiBkaXNwbGF5ZWQgaW4gYSBzaW5nbGUgU1ZHIGJsb2NrLCBBTkQgdGhhdCBnaXZlbiB0aGUgcHJlZmVycmVkIHJlbmRlcmVycywgdGhhdCBpdCB3aWxsIGFjdHVhbGx5IGhhcHBlbiBpbiBvdXJcclxuICAgKiByZW5kZXJpbmcgcHJvY2Vzcy5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gcHJlZmVycmVkUmVuZGVyZXJzXHJcbiAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICovXHJcbiAgaXNTdWJ0cmVlUmVuZGVyZWRFeGNsdXNpdmVseVNWRyggcHJlZmVycmVkUmVuZGVyZXJzICkge1xyXG4gICAgLy8gQ2hlY2sgaWYgd2UgaGF2ZSBhbnl0aGluZyB0aGF0IHdvdWxkIFBSRVZFTlQgdXMgZnJvbSBoYXZpbmcgYSBzaW5nbGUgU1ZHIGJsb2NrXHJcbiAgICBpZiAoICF0aGlzLmlzU2luZ2xlU1ZHU3VwcG9ydGVkKCkgKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDaGVjayBmb3IgYW55IHJlbmRlcmVyIHByZWZlcmVuY2VzIHRoYXQgd291bGQgQ0FVU0UgdXMgdG8gY2hvb3NlIG5vdCB0byBkaXNwbGF5IHdpdGggYSBzaW5nbGUgU1ZHIGJsb2NrXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBSZW5kZXJlci5udW1BY3RpdmVSZW5kZXJlcnM7IGkrKyApIHtcclxuICAgICAgLy8gR3JhYiB0aGUgbmV4dC1tb3N0IHByZWZlcnJlZCByZW5kZXJlclxyXG4gICAgICBjb25zdCByZW5kZXJlciA9IFJlbmRlcmVyLmJpdG1hc2tPcmRlciggcHJlZmVycmVkUmVuZGVyZXJzLCBpICk7XHJcblxyXG4gICAgICAvLyBJZiBpdCdzIFNWRywgY29uZ3JhdHMhIEV2ZXJ5dGhpbmcgd2lsbCByZW5kZXIgaW4gU1ZHIChzaW5jZSBTVkcgaXMgc3VwcG9ydGVkLCBhcyBub3RlZCBhYm92ZSlcclxuICAgICAgaWYgKCBSZW5kZXJlci5iaXRtYXNrU1ZHICYgcmVuZGVyZXIgKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFNpbmNlIGl0J3Mgbm90IFNWRywgaWYgdGhlcmUncyBhIHNpbmdsZSBwYWludGVkIG5vZGUgdGhhdCBzdXBwb3J0cyB0aGlzIHJlbmRlcmVyICh3aGljaCBpcyBwcmVmZXJyZWQgb3ZlciBTVkcpLFxyXG4gICAgICAvLyB0aGVuIGl0IHdpbGwgYmUgcmVuZGVyZWQgd2l0aCB0aGlzIHJlbmRlcmVyLCBOT1QgU1ZHLlxyXG4gICAgICBpZiAoIHRoaXMuaXNTdWJ0cmVlQ29udGFpbmluZ0NvbXBhdGlibGUoIHJlbmRlcmVyICkgKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlOyAvLyBzYW5pdHkgY2hlY2tcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIGEgYml0bWFzayByZXByZXNlbnRpbmcgYSBsaXN0IG9mIG9yZGVyZWQgcHJlZmVycmVkIHJlbmRlcmVycywgd2UgY2hlY2sgdG8gc2VlIGlmIGFsbCBvZiBvdXIgbm9kZXMgY2FuIGJlXHJcbiAgICogZGlzcGxheWVkIGluIGEgc2luZ2xlIENhbnZhcyBibG9jaywgQU5EIHRoYXQgZ2l2ZW4gdGhlIHByZWZlcnJlZCByZW5kZXJlcnMsIHRoYXQgaXQgd2lsbCBhY3R1YWxseSBoYXBwZW4gaW4gb3VyXHJcbiAgICogcmVuZGVyaW5nIHByb2Nlc3MuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHByZWZlcnJlZFJlbmRlcmVyc1xyXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAqL1xyXG4gIGlzU3VidHJlZVJlbmRlcmVkRXhjbHVzaXZlbHlDYW52YXMoIHByZWZlcnJlZFJlbmRlcmVycyApIHtcclxuICAgIC8vIENoZWNrIGlmIHdlIGhhdmUgYW55dGhpbmcgdGhhdCB3b3VsZCBQUkVWRU5UIHVzIGZyb20gaGF2aW5nIGEgc2luZ2xlIENhbnZhcyBibG9ja1xyXG4gICAgaWYgKCAhdGhpcy5pc1NpbmdsZUNhbnZhc1N1cHBvcnRlZCgpICkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2hlY2sgZm9yIGFueSByZW5kZXJlciBwcmVmZXJlbmNlcyB0aGF0IHdvdWxkIENBVVNFIHVzIHRvIGNob29zZSBub3QgdG8gZGlzcGxheSB3aXRoIGEgc2luZ2xlIENhbnZhcyBibG9ja1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgUmVuZGVyZXIubnVtQWN0aXZlUmVuZGVyZXJzOyBpKysgKSB7XHJcbiAgICAgIC8vIEdyYWIgdGhlIG5leHQtbW9zdCBwcmVmZXJyZWQgcmVuZGVyZXJcclxuICAgICAgY29uc3QgcmVuZGVyZXIgPSBSZW5kZXJlci5iaXRtYXNrT3JkZXIoIHByZWZlcnJlZFJlbmRlcmVycywgaSApO1xyXG5cclxuICAgICAgLy8gSWYgaXQncyBDYW52YXMsIGNvbmdyYXRzISBFdmVyeXRoaW5nIHdpbGwgcmVuZGVyIGluIENhbnZhcyAoc2luY2UgQ2FudmFzIGlzIHN1cHBvcnRlZCwgYXMgbm90ZWQgYWJvdmUpXHJcbiAgICAgIGlmICggUmVuZGVyZXIuYml0bWFza0NhbnZhcyAmIHJlbmRlcmVyICkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBTaW5jZSBpdCdzIG5vdCBDYW52YXMsIGlmIHRoZXJlJ3MgYSBzaW5nbGUgcGFpbnRlZCBub2RlIHRoYXQgc3VwcG9ydHMgdGhpcyByZW5kZXJlciAod2hpY2ggaXMgcHJlZmVycmVkIG92ZXIgQ2FudmFzKSxcclxuICAgICAgLy8gdGhlbiBpdCB3aWxsIGJlIHJlbmRlcmVkIHdpdGggdGhpcyByZW5kZXJlciwgTk9UIENhbnZhcy5cclxuICAgICAgaWYgKCB0aGlzLmlzU3VidHJlZUNvbnRhaW5pbmdDb21wYXRpYmxlKCByZW5kZXJlciApICkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmYWxzZTsgLy8gc2FuaXR5IGNoZWNrXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGb3IgZGVidWdnaW5nIHB1cnBvc2VzXHJcbiAgICogQHB1YmxpY1xyXG4gICAqL1xyXG4gIGF1ZGl0KCkge1xyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IG51bVN1bW1hcnlCaXRzOyBpKysgKSB7XHJcbiAgICAgICAgY29uc3QgYml0ID0gc3VtbWFyeUJpdHNbIGkgXTtcclxuICAgICAgICBjb25zdCBjb3VudElzWmVybyA9IHRoaXMuX2NvdW50c1sgaSBdID09PSAwO1xyXG4gICAgICAgIGNvbnN0IGJpdG1hc2tDb250YWluc0JpdCA9ICEhKCB0aGlzLmJpdG1hc2sgJiBiaXQgKTtcclxuICAgICAgICBhc3NlcnQoIGNvdW50SXNaZXJvID09PSBiaXRtYXNrQ29udGFpbnNCaXQsICdCaXRzIHNob3VsZCBiZSBzZXQgaWYgY291bnQgaXMgemVybycgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHN0cmluZyBmb3JtIG9mIHRoaXMgb2JqZWN0XHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgKi9cclxuICB0b1N0cmluZygpIHtcclxuICAgIGxldCByZXN1bHQgPSBSZW5kZXJlclN1bW1hcnkuYml0bWFza1RvU3RyaW5nKCB0aGlzLmJpdG1hc2sgKTtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IG51bVN1bW1hcnlCaXRzOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGJpdCA9IHN1bW1hcnlCaXRzWyBpIF07XHJcbiAgICAgIGNvbnN0IGNvdW50Rm9yQml0ID0gdGhpcy5fY291bnRzWyBpIF07XHJcbiAgICAgIGlmICggY291bnRGb3JCaXQgIT09IDAgKSB7XHJcbiAgICAgICAgcmVzdWx0ICs9IGAgJHtSZW5kZXJlclN1bW1hcnkuYml0VG9TdHJpbmcoIGJpdCApfToke2NvdW50Rm9yQml0fWA7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmVzIHdoaWNoIG9mIHRoZSBzdW1tYXJ5IGJpdHMgY2FuIGJlIHNldCBmb3IgYSBzcGVjaWZpYyBOb2RlIChpZ25vcmluZyBjaGlsZHJlbi9hbmNlc3RvcnMpLlxyXG4gICAqIEZvciBpbnN0YW5jZSwgZm9yIGJpdG1hc2tTaW5nbGVTVkcsIHdlIG9ubHkgZG9uJ3QgaW5jbHVkZSB0aGUgZmxhZyBpZiBUSElTIG5vZGUgcHJldmVudHMgaXRzIHVzYWdlXHJcbiAgICogKGV2ZW4gdGhvdWdoIGNoaWxkIG5vZGVzIG1heSBwcmV2ZW50IGl0IGluIHRoZSByZW5kZXJlciBzdW1tYXJ5IGl0c2VsZikuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtOb2RlfSBub2RlXHJcbiAgICovXHJcbiAgc3RhdGljIHN1bW1hcnlCaXRtYXNrRm9yTm9kZVNlbGYoIG5vZGUgKSB7XHJcbiAgICBsZXQgYml0bWFzayA9IG5vZGUuX3JlbmRlcmVyQml0bWFzaztcclxuXHJcbiAgICBpZiAoIG5vZGUuaXNQYWludGVkKCkgKSB7XHJcbiAgICAgIGJpdG1hc2sgfD0gKCAoIG5vZGUuX3JlbmRlcmVyQml0bWFzayAmIFJlbmRlcmVyLmJpdG1hc2tDdXJyZW50UmVuZGVyZXJBcmVhICkgXiBSZW5kZXJlci5iaXRtYXNrQ3VycmVudFJlbmRlcmVyQXJlYSApIDw8IFJlbmRlcmVyLmJpdG1hc2tMYWNrc1NoaWZ0O1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGJpdG1hc2sgfD0gUmVuZGVyZXIuYml0bWFza0N1cnJlbnRSZW5kZXJlckFyZWEgPDwgUmVuZGVyZXIuYml0bWFza0xhY2tzU2hpZnQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTk9URTogSWYgY2hhbmdpbmcsIHNlZSBJbnN0YW5jZS51cGRhdGVSZW5kZXJpbmdTdGF0ZVxyXG4gICAgY29uc3QgcmVxdWlyZXNTcGxpdCA9IG5vZGUuX2Nzc1RyYW5zZm9ybSB8fCBub2RlLl9sYXllclNwbGl0O1xyXG4gICAgY29uc3QgcmVuZGVyZXJIaW50ID0gbm9kZS5fcmVuZGVyZXI7XHJcblxyXG4gICAgLy8gV2hldGhlciB0aGlzIHN1YnRyZWUgd2lsbCBiZSBhYmxlIHRvIHN1cHBvcnQgYSBzaW5nbGUgU1ZHIGVsZW1lbnRcclxuICAgIC8vIE5PVEU6IElmIGNoYW5naW5nLCBzZWUgSW5zdGFuY2UudXBkYXRlUmVuZGVyaW5nU3RhdGVcclxuICAgIGlmICggIXJlcXVpcmVzU3BsaXQgJiYgLy8gQ2FuJ3QgaGF2ZSBhIHNpbmdsZSBTVkcgZWxlbWVudCBpZiB3ZSBhcmUgc3BsaXRcclxuICAgICAgICAgUmVuZGVyZXIuaXNTVkcoIG5vZGUuX3JlbmRlcmVyQml0bWFzayApICYmIC8vIElmIG91ciBub2RlIGRvZXNuJ3Qgc3VwcG9ydCBTVkcsIGNhbid0IGRvIGl0XHJcbiAgICAgICAgICggIXJlbmRlcmVySGludCB8fCBSZW5kZXJlci5pc1NWRyggcmVuZGVyZXJIaW50ICkgKSApIHsgLy8gQ2FuJ3QgaWYgYSByZW5kZXJlciBoaW50IGlzIHNldCB0byBzb21ldGhpbmcgZWxzZVxyXG4gICAgICBiaXRtYXNrIHw9IFJlbmRlcmVyLmJpdG1hc2tTaW5nbGVTVkc7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gV2hldGhlciB0aGlzIHN1YnRyZWUgd2lsbCBiZSBhYmxlIHRvIHN1cHBvcnQgYSBzaW5nbGUgQ2FudmFzIGVsZW1lbnRcclxuICAgIC8vIE5PVEU6IElmIGNoYW5naW5nLCBzZWUgSW5zdGFuY2UudXBkYXRlUmVuZGVyaW5nU3RhdGVcclxuICAgIGlmICggIXJlcXVpcmVzU3BsaXQgJiYgLy8gQ2FuJ3QgaGF2ZSBhIHNpbmdsZSBTVkcgZWxlbWVudCBpZiB3ZSBhcmUgc3BsaXRcclxuICAgICAgICAgUmVuZGVyZXIuaXNDYW52YXMoIG5vZGUuX3JlbmRlcmVyQml0bWFzayApICYmIC8vIElmIG91ciBub2RlIGRvZXNuJ3Qgc3VwcG9ydCBDYW52YXMsIGNhbid0IGRvIGl0XHJcbiAgICAgICAgICggIXJlbmRlcmVySGludCB8fCBSZW5kZXJlci5pc0NhbnZhcyggcmVuZGVyZXJIaW50ICkgKSApIHsgLy8gQ2FuJ3QgaWYgYSByZW5kZXJlciBoaW50IGlzIHNldCB0byBzb21ldGhpbmcgZWxzZVxyXG4gICAgICBiaXRtYXNrIHw9IFJlbmRlcmVyLmJpdG1hc2tTaW5nbGVDYW52YXM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCAhbm9kZS5pc1BhaW50ZWQoKSApIHtcclxuICAgICAgYml0bWFzayB8PSBSZW5kZXJlci5iaXRtYXNrTm90UGFpbnRlZDtcclxuICAgIH1cclxuICAgIGlmICggbm9kZS5hcmVTZWxmQm91bmRzVmFsaWQoKSApIHtcclxuICAgICAgYml0bWFzayB8PSBSZW5kZXJlci5iaXRtYXNrQm91bmRzVmFsaWQ7XHJcbiAgICB9XHJcbiAgICBpZiAoICFub2RlLmhhc1BET01Db250ZW50ICYmICFub2RlLmhhc1BET01PcmRlcigpICkge1xyXG4gICAgICBiaXRtYXNrIHw9IFJlbmRlcmVyLmJpdG1hc2tOb1BET007XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGJpdG1hc2s7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGb3IgZGVidWdnaW5nIHB1cnBvc2VzXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGJpdFxyXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICovXHJcbiAgc3RhdGljIGJpdFRvU3RyaW5nKCBiaXQgKSB7XHJcbiAgICBpZiAoIGJpdCA9PT0gUmVuZGVyZXIuYml0bWFza0NhbnZhcyApIHsgcmV0dXJuICdDYW52YXMnOyB9XHJcbiAgICBpZiAoIGJpdCA9PT0gUmVuZGVyZXIuYml0bWFza1NWRyApIHsgcmV0dXJuICdTVkcnOyB9XHJcbiAgICBpZiAoIGJpdCA9PT0gUmVuZGVyZXIuYml0bWFza0RPTSApIHsgcmV0dXJuICdET00nOyB9XHJcbiAgICBpZiAoIGJpdCA9PT0gUmVuZGVyZXIuYml0bWFza1dlYkdMICkgeyByZXR1cm4gJ1dlYkdMJzsgfVxyXG4gICAgaWYgKCBiaXQgPT09IFJlbmRlcmVyLmJpdG1hc2tMYWNrc0NhbnZhcyApIHsgcmV0dXJuICcoLUNhbnZhcyknOyB9XHJcbiAgICBpZiAoIGJpdCA9PT0gUmVuZGVyZXIuYml0bWFza0xhY2tzU1ZHICkgeyByZXR1cm4gJygtU1ZHKSc7IH1cclxuICAgIGlmICggYml0ID09PSBSZW5kZXJlci5iaXRtYXNrTGFja3NET00gKSB7IHJldHVybiAnKC1ET00pJzsgfVxyXG4gICAgaWYgKCBiaXQgPT09IFJlbmRlcmVyLmJpdG1hc2tMYWNrc1dlYkdMICkgeyByZXR1cm4gJygtV2ViR0wpJzsgfVxyXG4gICAgaWYgKCBiaXQgPT09IFJlbmRlcmVyLmJpdG1hc2tTaW5nbGVDYW52YXMgKSB7IHJldHVybiAnU2luZ2xlQ2FudmFzJzsgfVxyXG4gICAgaWYgKCBiaXQgPT09IFJlbmRlcmVyLmJpdG1hc2tTaW5nbGVTVkcgKSB7IHJldHVybiAnU2luZ2xlU1ZHJzsgfVxyXG4gICAgaWYgKCBiaXQgPT09IFJlbmRlcmVyLmJpdG1hc2tOb3RQYWludGVkICkgeyByZXR1cm4gJ05vdFBhaW50ZWQnOyB9XHJcbiAgICBpZiAoIGJpdCA9PT0gUmVuZGVyZXIuYml0bWFza0JvdW5kc1ZhbGlkICkgeyByZXR1cm4gJ0JvdW5kc1ZhbGlkJzsgfVxyXG4gICAgaWYgKCBiaXQgPT09IFJlbmRlcmVyLmJpdG1hc2tOb1BET00gKSB7IHJldHVybiAnTm90QWNjZXNzaWJsZSc7IH1cclxuICAgIHJldHVybiAnPyc7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGb3IgZGVidWdnaW5nIHB1cnBvc2VzXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGJpdG1hc2tcclxuICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAqL1xyXG4gIHN0YXRpYyBiaXRtYXNrVG9TdHJpbmcoIGJpdG1hc2sgKSB7XHJcbiAgICBsZXQgcmVzdWx0ID0gJyc7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBudW1TdW1tYXJ5Qml0czsgaSsrICkge1xyXG4gICAgICBjb25zdCBiaXQgPSBzdW1tYXJ5Qml0c1sgaSBdO1xyXG4gICAgICBpZiAoIGJpdG1hc2sgJiBiaXQgKSB7XHJcbiAgICAgICAgcmVzdWx0ICs9IGAke1JlbmRlcmVyU3VtbWFyeS5iaXRUb1N0cmluZyggYml0ICl9IGA7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBAcHVibGljIHtudW1iZXJ9XHJcblJlbmRlcmVyU3VtbWFyeS5iaXRtYXNrQWxsID0gYml0bWFza0FsbDtcclxuXHJcbnNjZW5lcnkucmVnaXN0ZXIoICdSZW5kZXJlclN1bW1hcnknLCBSZW5kZXJlclN1bW1hcnkgKTtcclxuZXhwb3J0IGRlZmF1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