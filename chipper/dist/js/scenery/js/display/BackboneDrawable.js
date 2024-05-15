// Copyright 2013-2023, University of Colorado Boulder

/**
 * A DOM drawable (div element) that contains child blocks (and is placed in the main DOM tree when visible). It should
 * use z-index for properly ordering its blocks in the correct stacking order.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import toSVGNumber from '../../../dot/js/toSVGNumber.js';
import cleanArray from '../../../phet-core/js/cleanArray.js';
import Poolable from '../../../phet-core/js/Poolable.js';
import { Drawable, GreedyStitcher, RebuildStitcher, scenery, Stitcher, Utils } from '../imports.js';

// constants
const useGreedyStitcher = true;
class BackboneDrawable extends Drawable {
  /**
   * @mixes Poolable
   *
   * @param {Display} display
   * @param {Instance} backboneInstance
   * @param {Instance} transformRootInstance
   * @param {number} renderer
   * @param {boolean} isDisplayRoot
   */
  constructor(display, backboneInstance, transformRootInstance, renderer, isDisplayRoot) {
    super();
    this.initialize(display, backboneInstance, transformRootInstance, renderer, isDisplayRoot);
  }

  /**
   * @public
   *
   * @param {Display} display
   * @param {Instance} backboneInstance
   * @param {Instance} transformRootInstance
   * @param {number} renderer
   * @param {boolean} isDisplayRoot
   */
  initialize(display, backboneInstance, transformRootInstance, renderer, isDisplayRoot) {
    super.initialize(renderer);
    this.display = display;

    // @public {Instance} - reference to the instance that controls this backbone
    this.backboneInstance = backboneInstance;

    // @public {Instance} - where is the transform root for our generated blocks?
    this.transformRootInstance = transformRootInstance;

    // @private {Instance} - where have filters been applied to up? our responsibility is to apply filters between this
    // and our backboneInstance
    this.filterRootAncestorInstance = backboneInstance.parent ? backboneInstance.parent.getFilterRootInstance() : backboneInstance;

    // where have transforms been applied up to? our responsibility is to apply transforms between this and our backboneInstance
    this.transformRootAncestorInstance = backboneInstance.parent ? backboneInstance.parent.getTransformRootInstance() : backboneInstance;
    this.willApplyTransform = this.transformRootAncestorInstance !== this.transformRootInstance;
    this.willApplyFilters = this.filterRootAncestorInstance !== this.backboneInstance;
    this.transformListener = this.transformListener || this.markTransformDirty.bind(this);
    if (this.willApplyTransform) {
      this.backboneInstance.relativeTransform.addListener(this.transformListener); // when our relative transform changes, notify us in the pre-repaint phase
      this.backboneInstance.relativeTransform.addPrecompute(); // trigger precomputation of the relative transform, since we will always need it when it is updated
    }
    this.backboneVisibilityListener = this.backboneVisibilityListener || this.updateBackboneVisibility.bind(this);
    this.backboneInstance.relativeVisibleEmitter.addListener(this.backboneVisibilityListener);
    this.updateBackboneVisibility();
    this.visibilityDirty = true;
    this.renderer = renderer;
    this.domElement = isDisplayRoot ? display.domElement : BackboneDrawable.createDivBackbone();
    this.isDisplayRoot = isDisplayRoot;
    this.dirtyDrawables = cleanArray(this.dirtyDrawables);

    // Apply CSS needed for future CSS transforms to work properly.
    Utils.prepareForTransform(this.domElement);

    // Ff we need to, watch nodes below us (and including us) and apply their filters (opacity/visibility/clip) to the
    // backbone. Order will be important, since we'll visit them in the order of filter application
    this.watchedFilterNodes = cleanArray(this.watchedFilterNodes);

    // @private {boolean}
    this.filterDirty = true;

    // @private {boolean}
    this.clipDirty = true;
    this.filterDirtyListener = this.filterDirtyListener || this.onFilterDirty.bind(this);
    this.clipDirtyListener = this.clipDirtyListener || this.onClipDirty.bind(this);
    if (this.willApplyFilters) {
      assert && assert(this.filterRootAncestorInstance.trail.nodes.length < this.backboneInstance.trail.nodes.length, 'Our backboneInstance should be deeper if we are applying filters');

      // walk through to see which instances we'll need to watch for filter changes
      // NOTE: order is important, so that the filters are applied in the correct order!
      for (let instance = this.backboneInstance; instance !== this.filterRootAncestorInstance; instance = instance.parent) {
        const node = instance.node;
        this.watchedFilterNodes.push(node);
        node.filterChangeEmitter.addListener(this.filterDirtyListener);
        node.clipAreaProperty.lazyLink(this.clipDirtyListener);
      }
    }
    this.lastZIndex = 0; // our last zIndex is stored, so that overlays can be added easily

    this.blocks = this.blocks || []; // we are responsible for their disposal

    // the first/last drawables for the last the this backbone was stitched
    this.previousFirstDrawable = null;
    this.previousLastDrawable = null;

    // We track whether our drawables were marked for removal (in which case, they should all be removed by the time we dispose).
    // If removedDrawables = false during disposal, it means we need to remove the drawables manually (this should only happen if an instance tree is removed)
    this.removedDrawables = false;
    this.stitcher = this.stitcher || (useGreedyStitcher ? new GreedyStitcher() : new RebuildStitcher());
    sceneryLog && sceneryLog.BackboneDrawable && sceneryLog.BackboneDrawable(`initialized ${this.toString()}`);
  }

  /**
   * Releases references
   * @public
   */
  dispose() {
    sceneryLog && sceneryLog.BackboneDrawable && sceneryLog.BackboneDrawable(`dispose ${this.toString()}`);
    sceneryLog && sceneryLog.BackboneDrawable && sceneryLog.push();
    while (this.watchedFilterNodes.length) {
      const node = this.watchedFilterNodes.pop();
      node.filterChangeEmitter.removeListener(this.filterDirtyListener);
      node.clipAreaProperty.unlink(this.clipDirtyListener);
    }
    this.backboneInstance.relativeVisibleEmitter.removeListener(this.backboneVisibilityListener);

    // if we need to remove drawables from the blocks, do so
    if (!this.removedDrawables) {
      for (let d = this.previousFirstDrawable; d !== null; d = d.nextDrawable) {
        d.parentDrawable.removeDrawable(d);
        if (d === this.previousLastDrawable) {
          break;
        }
      }
    }
    this.markBlocksForDisposal();
    if (this.willApplyTransform) {
      this.backboneInstance.relativeTransform.removeListener(this.transformListener);
      this.backboneInstance.relativeTransform.removePrecompute();
    }
    this.backboneInstance = null;
    this.transformRootInstance = null;
    this.filterRootAncestorInstance = null;
    this.transformRootAncestorInstance = null;
    cleanArray(this.dirtyDrawables);
    cleanArray(this.watchedFilterNodes);
    this.previousFirstDrawable = null;
    this.previousLastDrawable = null;
    super.dispose();
    sceneryLog && sceneryLog.BackboneDrawable && sceneryLog.pop();
  }

  /**
   * Dispose all of the blocks while clearing our references to them
   * @public
   */
  markBlocksForDisposal() {
    while (this.blocks.length) {
      const block = this.blocks.pop();
      sceneryLog && sceneryLog.BackboneDrawable && sceneryLog.BackboneDrawable(`${this.toString()} removing block: ${block.toString()}`);
      //TODO: PERFORMANCE: does this cause reflows / style calculation https://github.com/phetsims/scenery/issues/1581
      if (block.domElement.parentNode === this.domElement) {
        // guarded, since we may have a (new) child drawable add it before we can remove it
        this.domElement.removeChild(block.domElement);
      }
      block.markForDisposal(this.display);
    }
  }

  /**
   * @private
   */
  updateBackboneVisibility() {
    this.visible = this.backboneInstance.relativeVisible;
    if (!this.visibilityDirty) {
      this.visibilityDirty = true;
      this.markDirty();
    }
  }

  /**
   * Marks this backbone for disposal.
   * @public
   * @override
   *
   * NOTE: Should be called during syncTree
   *
   * @param {Display} display
   */
  markForDisposal(display) {
    for (let d = this.previousFirstDrawable; d !== null; d = d.oldNextDrawable) {
      d.notePendingRemoval(this.display);
      if (d === this.previousLastDrawable) {
        break;
      }
    }
    this.removedDrawables = true;

    // super call
    super.markForDisposal(display);
  }

  /**
   * Marks a drawable as dirty.
   * @public
   *
   * @param {Drawable} drawable
   */
  markDirtyDrawable(drawable) {
    if (assert) {
      // Catch infinite loops
      this.display.ensureNotPainting();
    }
    this.dirtyDrawables.push(drawable);
    this.markDirty();
  }

  /**
   * Marks our transform as dirty.
   * @public
   */
  markTransformDirty() {
    assert && assert(this.willApplyTransform, 'Sanity check for willApplyTransform');

    // relative matrix on backbone instance should be up to date, since we added the compute flags
    Utils.applyPreparedTransform(this.backboneInstance.relativeTransform.matrix, this.domElement);
  }

  /**
   * Marks our opacity as dirty.
   * @private
   */
  onFilterDirty() {
    if (!this.filterDirty) {
      this.filterDirty = true;
      this.markDirty();
    }
  }

  /**
   * Marks our clip as dirty.
   * @private
   */
  onClipDirty() {
    if (!this.clipDirty) {
      this.clipDirty = true;
      this.markDirty();
    }
  }

  /**
   * Updates the DOM appearance of this drawable (whether by preparing/calling draw calls, DOM element updates, etc.)
   * @public
   * @override
   *
   * @returns {boolean} - Whether the update should continue (if false, further updates in supertype steps should not
   *                      be done).
   */
  update() {
    // See if we need to actually update things (will bail out if we are not dirty, or if we've been disposed)
    if (!super.update()) {
      return false;
    }
    while (this.dirtyDrawables.length) {
      this.dirtyDrawables.pop().update();
    }
    if (this.filterDirty) {
      this.filterDirty = false;
      let filterString = '';
      const len = this.watchedFilterNodes.length;
      for (let i = 0; i < len; i++) {
        const node = this.watchedFilterNodes[i];
        const opacity = node.getEffectiveOpacity();
        for (let j = 0; j < node._filters.length; j++) {
          filterString += `${filterString ? ' ' : ''}${node._filters[j].getCSSFilterString()}`;
        }

        // Apply opacity after other effects
        if (opacity !== 1) {
          filterString += `${filterString ? ' ' : ''}opacity(${toSVGNumber(opacity)})`;
        }
      }
      this.domElement.style.filter = filterString;
    }
    if (this.visibilityDirty) {
      this.visibilityDirty = false;
      this.domElement.style.display = this.visible ? '' : 'none';
    }
    if (this.clipDirty) {
      this.clipDirty = false;

      // var clip = this.willApplyFilters ? this.getFilterClip() : '';

      //OHTWO TODO: CSS clip-path/mask support here. see http://www.html5rocks.com/en/tutorials/masking/adobe/ https://github.com/phetsims/scenery/issues/1581
      // this.domElement.style.clipPath = clip; // yikes! temporary, since we already threw something?
    }
    return true;
  }

  /**
   * Returns the combined visibility of nodes "above us" that will need to be taken into account for displaying this
   * backbone.
   * @public
   *
   * @returns {boolean}
   */
  getFilterVisibility() {
    const len = this.watchedFilterNodes.length;
    for (let i = 0; i < len; i++) {
      if (!this.watchedFilterNodes[i].isVisible()) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns the combined clipArea (string???) for nodes "above us".
   * @public
   *
   * @returns {string}
   */
  getFilterClip() {
    const clip = '';

    //OHTWO TODO: proper clipping support https://github.com/phetsims/scenery/issues/1581
    // var len = this.watchedFilterNodes.length;
    // for ( var i = 0; i < len; i++ ) {
    //   if ( this.watchedFilterNodes[i].clipArea ) {
    //     throw new Error( 'clip-path for backbones unimplemented, and with questionable browser support!' );
    //   }
    // }

    return clip;
  }

  /**
   * Ensures that z-indices are strictly increasing, while trying to minimize the number of times we must change it
   * @public
   */
  reindexBlocks() {
    // full-pass change for zindex.
    let zIndex = 0; // don't start below 1 (we ensure > in loop)
    for (let k = 0; k < this.blocks.length; k++) {
      const block = this.blocks[k];
      if (block.zIndex <= zIndex) {
        const newIndex = k + 1 < this.blocks.length && this.blocks[k + 1].zIndex - 1 > zIndex ? Math.ceil((zIndex + this.blocks[k + 1].zIndex) / 2) : zIndex + 20;

        // NOTE: this should give it its own stacking index (which is what we want)
        block.domElement.style.zIndex = block.zIndex = newIndex;
      }
      zIndex = block.zIndex;
      if (assert) {
        assert(this.blocks[k].zIndex % 1 === 0, 'z-indices should be integers');
        assert(this.blocks[k].zIndex > 0, 'z-indices should be greater than zero for our needs (see spec)');
        if (k > 0) {
          assert(this.blocks[k - 1].zIndex < this.blocks[k].zIndex, 'z-indices should be strictly increasing');
        }
      }
    }

    // sanity check
    this.lastZIndex = zIndex + 1;
  }

  /**
   * Stitches multiple change intervals.
   * @public
   *
   * @param {Drawable} firstDrawable
   * @param {Drawable} lastDrawable
   * @param {ChangeInterval} firstChangeInterval
   * @param {ChangeInterval} lastChangeInterval
   */
  stitch(firstDrawable, lastDrawable, firstChangeInterval, lastChangeInterval) {
    // no stitch necessary if there are no change intervals
    if (firstChangeInterval === null || lastChangeInterval === null) {
      assert && assert(firstChangeInterval === null);
      assert && assert(lastChangeInterval === null);
      return;
    }
    assert && assert(lastChangeInterval.nextChangeInterval === null, 'This allows us to have less checks in the loop');
    if (sceneryLog && sceneryLog.Stitch) {
      sceneryLog.Stitch(`Stitch intervals before constricting: ${this.toString()}`);
      sceneryLog.push();
      Stitcher.debugIntervals(firstChangeInterval);
      sceneryLog.pop();
    }

    // Make the intervals as small as possible by skipping areas without changes, and collapse the interval
    // linked list
    let lastNonemptyInterval = null;
    let interval = firstChangeInterval;
    let intervalsChanged = false;
    while (interval) {
      intervalsChanged = interval.constrict() || intervalsChanged;
      if (interval.isEmpty()) {
        assert && assert(intervalsChanged);
        if (lastNonemptyInterval) {
          // skip it, hook the correct reference
          lastNonemptyInterval.nextChangeInterval = interval.nextChangeInterval;
        }
      } else {
        // our first non-empty interval will be our new firstChangeInterval
        if (!lastNonemptyInterval) {
          firstChangeInterval = interval;
        }
        lastNonemptyInterval = interval;
      }
      interval = interval.nextChangeInterval;
    }
    if (!lastNonemptyInterval) {
      // eek, no nonempty change intervals. do nothing (good to catch here, but ideally there shouldn't be change
      // intervals that all collapse).
      return;
    }
    lastChangeInterval = lastNonemptyInterval;
    lastChangeInterval.nextChangeInterval = null;
    if (sceneryLog && sceneryLog.Stitch && intervalsChanged) {
      sceneryLog.Stitch(`Stitch intervals after constricting: ${this.toString()}`);
      sceneryLog.push();
      Stitcher.debugIntervals(firstChangeInterval);
      sceneryLog.pop();
    }
    if (sceneryLog && scenery.isLoggingPerformance()) {
      this.display.perfStitchCount++;
      let dInterval = firstChangeInterval;
      while (dInterval) {
        this.display.perfIntervalCount++;
        this.display.perfDrawableOldIntervalCount += dInterval.getOldInternalDrawableCount(this.previousFirstDrawable, this.previousLastDrawable);
        this.display.perfDrawableNewIntervalCount += dInterval.getNewInternalDrawableCount(firstDrawable, lastDrawable);
        dInterval = dInterval.nextChangeInterval;
      }
    }
    this.stitcher.stitch(this, firstDrawable, lastDrawable, this.previousFirstDrawable, this.previousLastDrawable, firstChangeInterval, lastChangeInterval);
  }

  /**
   * Runs checks on the drawable, based on certain flags.
   * @public
   * @override
   *
   * @param {boolean} allowPendingBlock
   * @param {boolean} allowPendingList
   * @param {boolean} allowDirty
   */
  audit(allowPendingBlock, allowPendingList, allowDirty) {
    if (assertSlow) {
      super.audit(allowPendingBlock, allowPendingList, allowDirty);
      assertSlow && assertSlow(this.backboneInstance.isBackbone, 'We should reference an instance that requires a backbone');
      assertSlow && assertSlow(this.transformRootInstance.isTransformed, 'Transform root should be transformed');
      for (let i = 0; i < this.blocks.length; i++) {
        this.blocks[i].audit(allowPendingBlock, allowPendingList, allowDirty);
      }
    }
  }

  /**
   * Creates a base DOM element for a backbone.
   * @public
   *
   * @returns {HTMLDivElement}
   */
  static createDivBackbone() {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.left = '0';
    div.style.top = '0';
    div.style.width = '0';
    div.style.height = '0';
    return div;
  }

  /**
   * Given an external element, we apply the necessary style to make it compatible as a backbone DOM element.
   * @public
   *
   * @param {HTMLElement} element
   * @returns {HTMLElement} - For chaining
   */
  static repurposeBackboneContainer(element) {
    if (element.style.position !== 'relative' || element.style.position !== 'absolute') {
      element.style.position = 'relative';
    }
    element.style.left = '0';
    element.style.top = '0';
    return element;
  }
}
scenery.register('BackboneDrawable', BackboneDrawable);
Poolable.mixInto(BackboneDrawable);
export default BackboneDrawable;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ0b1NWR051bWJlciIsImNsZWFuQXJyYXkiLCJQb29sYWJsZSIsIkRyYXdhYmxlIiwiR3JlZWR5U3RpdGNoZXIiLCJSZWJ1aWxkU3RpdGNoZXIiLCJzY2VuZXJ5IiwiU3RpdGNoZXIiLCJVdGlscyIsInVzZUdyZWVkeVN0aXRjaGVyIiwiQmFja2JvbmVEcmF3YWJsZSIsImNvbnN0cnVjdG9yIiwiZGlzcGxheSIsImJhY2tib25lSW5zdGFuY2UiLCJ0cmFuc2Zvcm1Sb290SW5zdGFuY2UiLCJyZW5kZXJlciIsImlzRGlzcGxheVJvb3QiLCJpbml0aWFsaXplIiwiZmlsdGVyUm9vdEFuY2VzdG9ySW5zdGFuY2UiLCJwYXJlbnQiLCJnZXRGaWx0ZXJSb290SW5zdGFuY2UiLCJ0cmFuc2Zvcm1Sb290QW5jZXN0b3JJbnN0YW5jZSIsImdldFRyYW5zZm9ybVJvb3RJbnN0YW5jZSIsIndpbGxBcHBseVRyYW5zZm9ybSIsIndpbGxBcHBseUZpbHRlcnMiLCJ0cmFuc2Zvcm1MaXN0ZW5lciIsIm1hcmtUcmFuc2Zvcm1EaXJ0eSIsImJpbmQiLCJyZWxhdGl2ZVRyYW5zZm9ybSIsImFkZExpc3RlbmVyIiwiYWRkUHJlY29tcHV0ZSIsImJhY2tib25lVmlzaWJpbGl0eUxpc3RlbmVyIiwidXBkYXRlQmFja2JvbmVWaXNpYmlsaXR5IiwicmVsYXRpdmVWaXNpYmxlRW1pdHRlciIsInZpc2liaWxpdHlEaXJ0eSIsImRvbUVsZW1lbnQiLCJjcmVhdGVEaXZCYWNrYm9uZSIsImRpcnR5RHJhd2FibGVzIiwicHJlcGFyZUZvclRyYW5zZm9ybSIsIndhdGNoZWRGaWx0ZXJOb2RlcyIsImZpbHRlckRpcnR5IiwiY2xpcERpcnR5IiwiZmlsdGVyRGlydHlMaXN0ZW5lciIsIm9uRmlsdGVyRGlydHkiLCJjbGlwRGlydHlMaXN0ZW5lciIsIm9uQ2xpcERpcnR5IiwiYXNzZXJ0IiwidHJhaWwiLCJub2RlcyIsImxlbmd0aCIsImluc3RhbmNlIiwibm9kZSIsInB1c2giLCJmaWx0ZXJDaGFuZ2VFbWl0dGVyIiwiY2xpcEFyZWFQcm9wZXJ0eSIsImxhenlMaW5rIiwibGFzdFpJbmRleCIsImJsb2NrcyIsInByZXZpb3VzRmlyc3REcmF3YWJsZSIsInByZXZpb3VzTGFzdERyYXdhYmxlIiwicmVtb3ZlZERyYXdhYmxlcyIsInN0aXRjaGVyIiwic2NlbmVyeUxvZyIsInRvU3RyaW5nIiwiZGlzcG9zZSIsInBvcCIsInJlbW92ZUxpc3RlbmVyIiwidW5saW5rIiwiZCIsIm5leHREcmF3YWJsZSIsInBhcmVudERyYXdhYmxlIiwicmVtb3ZlRHJhd2FibGUiLCJtYXJrQmxvY2tzRm9yRGlzcG9zYWwiLCJyZW1vdmVQcmVjb21wdXRlIiwiYmxvY2siLCJwYXJlbnROb2RlIiwicmVtb3ZlQ2hpbGQiLCJtYXJrRm9yRGlzcG9zYWwiLCJ2aXNpYmxlIiwicmVsYXRpdmVWaXNpYmxlIiwibWFya0RpcnR5Iiwib2xkTmV4dERyYXdhYmxlIiwibm90ZVBlbmRpbmdSZW1vdmFsIiwibWFya0RpcnR5RHJhd2FibGUiLCJkcmF3YWJsZSIsImVuc3VyZU5vdFBhaW50aW5nIiwiYXBwbHlQcmVwYXJlZFRyYW5zZm9ybSIsIm1hdHJpeCIsInVwZGF0ZSIsImZpbHRlclN0cmluZyIsImxlbiIsImkiLCJvcGFjaXR5IiwiZ2V0RWZmZWN0aXZlT3BhY2l0eSIsImoiLCJfZmlsdGVycyIsImdldENTU0ZpbHRlclN0cmluZyIsInN0eWxlIiwiZmlsdGVyIiwiZ2V0RmlsdGVyVmlzaWJpbGl0eSIsImlzVmlzaWJsZSIsImdldEZpbHRlckNsaXAiLCJjbGlwIiwicmVpbmRleEJsb2NrcyIsInpJbmRleCIsImsiLCJuZXdJbmRleCIsIk1hdGgiLCJjZWlsIiwic3RpdGNoIiwiZmlyc3REcmF3YWJsZSIsImxhc3REcmF3YWJsZSIsImZpcnN0Q2hhbmdlSW50ZXJ2YWwiLCJsYXN0Q2hhbmdlSW50ZXJ2YWwiLCJuZXh0Q2hhbmdlSW50ZXJ2YWwiLCJTdGl0Y2giLCJkZWJ1Z0ludGVydmFscyIsImxhc3ROb25lbXB0eUludGVydmFsIiwiaW50ZXJ2YWwiLCJpbnRlcnZhbHNDaGFuZ2VkIiwiY29uc3RyaWN0IiwiaXNFbXB0eSIsImlzTG9nZ2luZ1BlcmZvcm1hbmNlIiwicGVyZlN0aXRjaENvdW50IiwiZEludGVydmFsIiwicGVyZkludGVydmFsQ291bnQiLCJwZXJmRHJhd2FibGVPbGRJbnRlcnZhbENvdW50IiwiZ2V0T2xkSW50ZXJuYWxEcmF3YWJsZUNvdW50IiwicGVyZkRyYXdhYmxlTmV3SW50ZXJ2YWxDb3VudCIsImdldE5ld0ludGVybmFsRHJhd2FibGVDb3VudCIsImF1ZGl0IiwiYWxsb3dQZW5kaW5nQmxvY2siLCJhbGxvd1BlbmRpbmdMaXN0IiwiYWxsb3dEaXJ0eSIsImFzc2VydFNsb3ciLCJpc0JhY2tib25lIiwiaXNUcmFuc2Zvcm1lZCIsImRpdiIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsInBvc2l0aW9uIiwibGVmdCIsInRvcCIsIndpZHRoIiwiaGVpZ2h0IiwicmVwdXJwb3NlQmFja2JvbmVDb250YWluZXIiLCJlbGVtZW50IiwicmVnaXN0ZXIiLCJtaXhJbnRvIl0sInNvdXJjZXMiOlsiQmFja2JvbmVEcmF3YWJsZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxMy0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBIERPTSBkcmF3YWJsZSAoZGl2IGVsZW1lbnQpIHRoYXQgY29udGFpbnMgY2hpbGQgYmxvY2tzIChhbmQgaXMgcGxhY2VkIGluIHRoZSBtYWluIERPTSB0cmVlIHdoZW4gdmlzaWJsZSkuIEl0IHNob3VsZFxyXG4gKiB1c2Ugei1pbmRleCBmb3IgcHJvcGVybHkgb3JkZXJpbmcgaXRzIGJsb2NrcyBpbiB0aGUgY29ycmVjdCBzdGFja2luZyBvcmRlci5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCB0b1NWR051bWJlciBmcm9tICcuLi8uLi8uLi9kb3QvanMvdG9TVkdOdW1iZXIuanMnO1xyXG5pbXBvcnQgY2xlYW5BcnJheSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvY2xlYW5BcnJheS5qcyc7XHJcbmltcG9ydCBQb29sYWJsZSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvUG9vbGFibGUuanMnO1xyXG5pbXBvcnQgeyBEcmF3YWJsZSwgR3JlZWR5U3RpdGNoZXIsIFJlYnVpbGRTdGl0Y2hlciwgc2NlbmVyeSwgU3RpdGNoZXIsIFV0aWxzIH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgdXNlR3JlZWR5U3RpdGNoZXIgPSB0cnVlO1xyXG5cclxuY2xhc3MgQmFja2JvbmVEcmF3YWJsZSBleHRlbmRzIERyYXdhYmxlIHtcclxuICAvKipcclxuICAgKiBAbWl4ZXMgUG9vbGFibGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7RGlzcGxheX0gZGlzcGxheVxyXG4gICAqIEBwYXJhbSB7SW5zdGFuY2V9IGJhY2tib25lSW5zdGFuY2VcclxuICAgKiBAcGFyYW0ge0luc3RhbmNlfSB0cmFuc2Zvcm1Sb290SW5zdGFuY2VcclxuICAgKiBAcGFyYW0ge251bWJlcn0gcmVuZGVyZXJcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzRGlzcGxheVJvb3RcclxuICAgKi9cclxuICBjb25zdHJ1Y3RvciggZGlzcGxheSwgYmFja2JvbmVJbnN0YW5jZSwgdHJhbnNmb3JtUm9vdEluc3RhbmNlLCByZW5kZXJlciwgaXNEaXNwbGF5Um9vdCApIHtcclxuICAgIHN1cGVyKCk7XHJcblxyXG4gICAgdGhpcy5pbml0aWFsaXplKCBkaXNwbGF5LCBiYWNrYm9uZUluc3RhbmNlLCB0cmFuc2Zvcm1Sb290SW5zdGFuY2UsIHJlbmRlcmVyLCBpc0Rpc3BsYXlSb290ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0Rpc3BsYXl9IGRpc3BsYXlcclxuICAgKiBAcGFyYW0ge0luc3RhbmNlfSBiYWNrYm9uZUluc3RhbmNlXHJcbiAgICogQHBhcmFtIHtJbnN0YW5jZX0gdHJhbnNmb3JtUm9vdEluc3RhbmNlXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHJlbmRlcmVyXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBpc0Rpc3BsYXlSb290XHJcbiAgICovXHJcbiAgaW5pdGlhbGl6ZSggZGlzcGxheSwgYmFja2JvbmVJbnN0YW5jZSwgdHJhbnNmb3JtUm9vdEluc3RhbmNlLCByZW5kZXJlciwgaXNEaXNwbGF5Um9vdCApIHtcclxuICAgIHN1cGVyLmluaXRpYWxpemUoIHJlbmRlcmVyICk7XHJcblxyXG4gICAgdGhpcy5kaXNwbGF5ID0gZGlzcGxheTtcclxuXHJcbiAgICAvLyBAcHVibGljIHtJbnN0YW5jZX0gLSByZWZlcmVuY2UgdG8gdGhlIGluc3RhbmNlIHRoYXQgY29udHJvbHMgdGhpcyBiYWNrYm9uZVxyXG4gICAgdGhpcy5iYWNrYm9uZUluc3RhbmNlID0gYmFja2JvbmVJbnN0YW5jZTtcclxuXHJcbiAgICAvLyBAcHVibGljIHtJbnN0YW5jZX0gLSB3aGVyZSBpcyB0aGUgdHJhbnNmb3JtIHJvb3QgZm9yIG91ciBnZW5lcmF0ZWQgYmxvY2tzP1xyXG4gICAgdGhpcy50cmFuc2Zvcm1Sb290SW5zdGFuY2UgPSB0cmFuc2Zvcm1Sb290SW5zdGFuY2U7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge0luc3RhbmNlfSAtIHdoZXJlIGhhdmUgZmlsdGVycyBiZWVuIGFwcGxpZWQgdG8gdXA/IG91ciByZXNwb25zaWJpbGl0eSBpcyB0byBhcHBseSBmaWx0ZXJzIGJldHdlZW4gdGhpc1xyXG4gICAgLy8gYW5kIG91ciBiYWNrYm9uZUluc3RhbmNlXHJcbiAgICB0aGlzLmZpbHRlclJvb3RBbmNlc3Rvckluc3RhbmNlID0gYmFja2JvbmVJbnN0YW5jZS5wYXJlbnQgPyBiYWNrYm9uZUluc3RhbmNlLnBhcmVudC5nZXRGaWx0ZXJSb290SW5zdGFuY2UoKSA6IGJhY2tib25lSW5zdGFuY2U7XHJcblxyXG4gICAgLy8gd2hlcmUgaGF2ZSB0cmFuc2Zvcm1zIGJlZW4gYXBwbGllZCB1cCB0bz8gb3VyIHJlc3BvbnNpYmlsaXR5IGlzIHRvIGFwcGx5IHRyYW5zZm9ybXMgYmV0d2VlbiB0aGlzIGFuZCBvdXIgYmFja2JvbmVJbnN0YW5jZVxyXG4gICAgdGhpcy50cmFuc2Zvcm1Sb290QW5jZXN0b3JJbnN0YW5jZSA9IGJhY2tib25lSW5zdGFuY2UucGFyZW50ID8gYmFja2JvbmVJbnN0YW5jZS5wYXJlbnQuZ2V0VHJhbnNmb3JtUm9vdEluc3RhbmNlKCkgOiBiYWNrYm9uZUluc3RhbmNlO1xyXG5cclxuICAgIHRoaXMud2lsbEFwcGx5VHJhbnNmb3JtID0gdGhpcy50cmFuc2Zvcm1Sb290QW5jZXN0b3JJbnN0YW5jZSAhPT0gdGhpcy50cmFuc2Zvcm1Sb290SW5zdGFuY2U7XHJcbiAgICB0aGlzLndpbGxBcHBseUZpbHRlcnMgPSB0aGlzLmZpbHRlclJvb3RBbmNlc3Rvckluc3RhbmNlICE9PSB0aGlzLmJhY2tib25lSW5zdGFuY2U7XHJcblxyXG4gICAgdGhpcy50cmFuc2Zvcm1MaXN0ZW5lciA9IHRoaXMudHJhbnNmb3JtTGlzdGVuZXIgfHwgdGhpcy5tYXJrVHJhbnNmb3JtRGlydHkuYmluZCggdGhpcyApO1xyXG4gICAgaWYgKCB0aGlzLndpbGxBcHBseVRyYW5zZm9ybSApIHtcclxuICAgICAgdGhpcy5iYWNrYm9uZUluc3RhbmNlLnJlbGF0aXZlVHJhbnNmb3JtLmFkZExpc3RlbmVyKCB0aGlzLnRyYW5zZm9ybUxpc3RlbmVyICk7IC8vIHdoZW4gb3VyIHJlbGF0aXZlIHRyYW5zZm9ybSBjaGFuZ2VzLCBub3RpZnkgdXMgaW4gdGhlIHByZS1yZXBhaW50IHBoYXNlXHJcbiAgICAgIHRoaXMuYmFja2JvbmVJbnN0YW5jZS5yZWxhdGl2ZVRyYW5zZm9ybS5hZGRQcmVjb21wdXRlKCk7IC8vIHRyaWdnZXIgcHJlY29tcHV0YXRpb24gb2YgdGhlIHJlbGF0aXZlIHRyYW5zZm9ybSwgc2luY2Ugd2Ugd2lsbCBhbHdheXMgbmVlZCBpdCB3aGVuIGl0IGlzIHVwZGF0ZWRcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmJhY2tib25lVmlzaWJpbGl0eUxpc3RlbmVyID0gdGhpcy5iYWNrYm9uZVZpc2liaWxpdHlMaXN0ZW5lciB8fCB0aGlzLnVwZGF0ZUJhY2tib25lVmlzaWJpbGl0eS5iaW5kKCB0aGlzICk7XHJcbiAgICB0aGlzLmJhY2tib25lSW5zdGFuY2UucmVsYXRpdmVWaXNpYmxlRW1pdHRlci5hZGRMaXN0ZW5lciggdGhpcy5iYWNrYm9uZVZpc2liaWxpdHlMaXN0ZW5lciApO1xyXG4gICAgdGhpcy51cGRhdGVCYWNrYm9uZVZpc2liaWxpdHkoKTtcclxuICAgIHRoaXMudmlzaWJpbGl0eURpcnR5ID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLnJlbmRlcmVyID0gcmVuZGVyZXI7XHJcbiAgICB0aGlzLmRvbUVsZW1lbnQgPSBpc0Rpc3BsYXlSb290ID8gZGlzcGxheS5kb21FbGVtZW50IDogQmFja2JvbmVEcmF3YWJsZS5jcmVhdGVEaXZCYWNrYm9uZSgpO1xyXG4gICAgdGhpcy5pc0Rpc3BsYXlSb290ID0gaXNEaXNwbGF5Um9vdDtcclxuICAgIHRoaXMuZGlydHlEcmF3YWJsZXMgPSBjbGVhbkFycmF5KCB0aGlzLmRpcnR5RHJhd2FibGVzICk7XHJcblxyXG4gICAgLy8gQXBwbHkgQ1NTIG5lZWRlZCBmb3IgZnV0dXJlIENTUyB0cmFuc2Zvcm1zIHRvIHdvcmsgcHJvcGVybHkuXHJcbiAgICBVdGlscy5wcmVwYXJlRm9yVHJhbnNmb3JtKCB0aGlzLmRvbUVsZW1lbnQgKTtcclxuXHJcbiAgICAvLyBGZiB3ZSBuZWVkIHRvLCB3YXRjaCBub2RlcyBiZWxvdyB1cyAoYW5kIGluY2x1ZGluZyB1cykgYW5kIGFwcGx5IHRoZWlyIGZpbHRlcnMgKG9wYWNpdHkvdmlzaWJpbGl0eS9jbGlwKSB0byB0aGVcclxuICAgIC8vIGJhY2tib25lLiBPcmRlciB3aWxsIGJlIGltcG9ydGFudCwgc2luY2Ugd2UnbGwgdmlzaXQgdGhlbSBpbiB0aGUgb3JkZXIgb2YgZmlsdGVyIGFwcGxpY2F0aW9uXHJcbiAgICB0aGlzLndhdGNoZWRGaWx0ZXJOb2RlcyA9IGNsZWFuQXJyYXkoIHRoaXMud2F0Y2hlZEZpbHRlck5vZGVzICk7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge2Jvb2xlYW59XHJcbiAgICB0aGlzLmZpbHRlckRpcnR5ID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7Ym9vbGVhbn1cclxuICAgIHRoaXMuY2xpcERpcnR5ID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLmZpbHRlckRpcnR5TGlzdGVuZXIgPSB0aGlzLmZpbHRlckRpcnR5TGlzdGVuZXIgfHwgdGhpcy5vbkZpbHRlckRpcnR5LmJpbmQoIHRoaXMgKTtcclxuICAgIHRoaXMuY2xpcERpcnR5TGlzdGVuZXIgPSB0aGlzLmNsaXBEaXJ0eUxpc3RlbmVyIHx8IHRoaXMub25DbGlwRGlydHkuYmluZCggdGhpcyApO1xyXG4gICAgaWYgKCB0aGlzLndpbGxBcHBseUZpbHRlcnMgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuZmlsdGVyUm9vdEFuY2VzdG9ySW5zdGFuY2UudHJhaWwubm9kZXMubGVuZ3RoIDwgdGhpcy5iYWNrYm9uZUluc3RhbmNlLnRyYWlsLm5vZGVzLmxlbmd0aCxcclxuICAgICAgICAnT3VyIGJhY2tib25lSW5zdGFuY2Ugc2hvdWxkIGJlIGRlZXBlciBpZiB3ZSBhcmUgYXBwbHlpbmcgZmlsdGVycycgKTtcclxuXHJcbiAgICAgIC8vIHdhbGsgdGhyb3VnaCB0byBzZWUgd2hpY2ggaW5zdGFuY2VzIHdlJ2xsIG5lZWQgdG8gd2F0Y2ggZm9yIGZpbHRlciBjaGFuZ2VzXHJcbiAgICAgIC8vIE5PVEU6IG9yZGVyIGlzIGltcG9ydGFudCwgc28gdGhhdCB0aGUgZmlsdGVycyBhcmUgYXBwbGllZCBpbiB0aGUgY29ycmVjdCBvcmRlciFcclxuICAgICAgZm9yICggbGV0IGluc3RhbmNlID0gdGhpcy5iYWNrYm9uZUluc3RhbmNlOyBpbnN0YW5jZSAhPT0gdGhpcy5maWx0ZXJSb290QW5jZXN0b3JJbnN0YW5jZTsgaW5zdGFuY2UgPSBpbnN0YW5jZS5wYXJlbnQgKSB7XHJcbiAgICAgICAgY29uc3Qgbm9kZSA9IGluc3RhbmNlLm5vZGU7XHJcblxyXG4gICAgICAgIHRoaXMud2F0Y2hlZEZpbHRlck5vZGVzLnB1c2goIG5vZGUgKTtcclxuICAgICAgICBub2RlLmZpbHRlckNoYW5nZUVtaXR0ZXIuYWRkTGlzdGVuZXIoIHRoaXMuZmlsdGVyRGlydHlMaXN0ZW5lciApO1xyXG4gICAgICAgIG5vZGUuY2xpcEFyZWFQcm9wZXJ0eS5sYXp5TGluayggdGhpcy5jbGlwRGlydHlMaXN0ZW5lciApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5sYXN0WkluZGV4ID0gMDsgLy8gb3VyIGxhc3QgekluZGV4IGlzIHN0b3JlZCwgc28gdGhhdCBvdmVybGF5cyBjYW4gYmUgYWRkZWQgZWFzaWx5XHJcblxyXG4gICAgdGhpcy5ibG9ja3MgPSB0aGlzLmJsb2NrcyB8fCBbXTsgLy8gd2UgYXJlIHJlc3BvbnNpYmxlIGZvciB0aGVpciBkaXNwb3NhbFxyXG5cclxuICAgIC8vIHRoZSBmaXJzdC9sYXN0IGRyYXdhYmxlcyBmb3IgdGhlIGxhc3QgdGhlIHRoaXMgYmFja2JvbmUgd2FzIHN0aXRjaGVkXHJcbiAgICB0aGlzLnByZXZpb3VzRmlyc3REcmF3YWJsZSA9IG51bGw7XHJcbiAgICB0aGlzLnByZXZpb3VzTGFzdERyYXdhYmxlID0gbnVsbDtcclxuXHJcbiAgICAvLyBXZSB0cmFjayB3aGV0aGVyIG91ciBkcmF3YWJsZXMgd2VyZSBtYXJrZWQgZm9yIHJlbW92YWwgKGluIHdoaWNoIGNhc2UsIHRoZXkgc2hvdWxkIGFsbCBiZSByZW1vdmVkIGJ5IHRoZSB0aW1lIHdlIGRpc3Bvc2UpLlxyXG4gICAgLy8gSWYgcmVtb3ZlZERyYXdhYmxlcyA9IGZhbHNlIGR1cmluZyBkaXNwb3NhbCwgaXQgbWVhbnMgd2UgbmVlZCB0byByZW1vdmUgdGhlIGRyYXdhYmxlcyBtYW51YWxseSAodGhpcyBzaG91bGQgb25seSBoYXBwZW4gaWYgYW4gaW5zdGFuY2UgdHJlZSBpcyByZW1vdmVkKVxyXG4gICAgdGhpcy5yZW1vdmVkRHJhd2FibGVzID0gZmFsc2U7XHJcblxyXG4gICAgdGhpcy5zdGl0Y2hlciA9IHRoaXMuc3RpdGNoZXIgfHwgKCB1c2VHcmVlZHlTdGl0Y2hlciA/IG5ldyBHcmVlZHlTdGl0Y2hlcigpIDogbmV3IFJlYnVpbGRTdGl0Y2hlcigpICk7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkJhY2tib25lRHJhd2FibGUgJiYgc2NlbmVyeUxvZy5CYWNrYm9uZURyYXdhYmxlKCBgaW5pdGlhbGl6ZWQgJHt0aGlzLnRvU3RyaW5nKCl9YCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVsZWFzZXMgcmVmZXJlbmNlc1xyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICBkaXNwb3NlKCkge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkJhY2tib25lRHJhd2FibGUgJiYgc2NlbmVyeUxvZy5CYWNrYm9uZURyYXdhYmxlKCBgZGlzcG9zZSAke3RoaXMudG9TdHJpbmcoKX1gICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuQmFja2JvbmVEcmF3YWJsZSAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcblxyXG4gICAgd2hpbGUgKCB0aGlzLndhdGNoZWRGaWx0ZXJOb2Rlcy5sZW5ndGggKSB7XHJcbiAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLndhdGNoZWRGaWx0ZXJOb2Rlcy5wb3AoKTtcclxuXHJcbiAgICAgIG5vZGUuZmlsdGVyQ2hhbmdlRW1pdHRlci5yZW1vdmVMaXN0ZW5lciggdGhpcy5maWx0ZXJEaXJ0eUxpc3RlbmVyICk7XHJcbiAgICAgIG5vZGUuY2xpcEFyZWFQcm9wZXJ0eS51bmxpbmsoIHRoaXMuY2xpcERpcnR5TGlzdGVuZXIgKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmJhY2tib25lSW5zdGFuY2UucmVsYXRpdmVWaXNpYmxlRW1pdHRlci5yZW1vdmVMaXN0ZW5lciggdGhpcy5iYWNrYm9uZVZpc2liaWxpdHlMaXN0ZW5lciApO1xyXG5cclxuICAgIC8vIGlmIHdlIG5lZWQgdG8gcmVtb3ZlIGRyYXdhYmxlcyBmcm9tIHRoZSBibG9ja3MsIGRvIHNvXHJcbiAgICBpZiAoICF0aGlzLnJlbW92ZWREcmF3YWJsZXMgKSB7XHJcbiAgICAgIGZvciAoIGxldCBkID0gdGhpcy5wcmV2aW91c0ZpcnN0RHJhd2FibGU7IGQgIT09IG51bGw7IGQgPSBkLm5leHREcmF3YWJsZSApIHtcclxuICAgICAgICBkLnBhcmVudERyYXdhYmxlLnJlbW92ZURyYXdhYmxlKCBkICk7XHJcbiAgICAgICAgaWYgKCBkID09PSB0aGlzLnByZXZpb3VzTGFzdERyYXdhYmxlICkgeyBicmVhazsgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5tYXJrQmxvY2tzRm9yRGlzcG9zYWwoKTtcclxuXHJcbiAgICBpZiAoIHRoaXMud2lsbEFwcGx5VHJhbnNmb3JtICkge1xyXG4gICAgICB0aGlzLmJhY2tib25lSW5zdGFuY2UucmVsYXRpdmVUcmFuc2Zvcm0ucmVtb3ZlTGlzdGVuZXIoIHRoaXMudHJhbnNmb3JtTGlzdGVuZXIgKTtcclxuICAgICAgdGhpcy5iYWNrYm9uZUluc3RhbmNlLnJlbGF0aXZlVHJhbnNmb3JtLnJlbW92ZVByZWNvbXB1dGUoKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmJhY2tib25lSW5zdGFuY2UgPSBudWxsO1xyXG4gICAgdGhpcy50cmFuc2Zvcm1Sb290SW5zdGFuY2UgPSBudWxsO1xyXG4gICAgdGhpcy5maWx0ZXJSb290QW5jZXN0b3JJbnN0YW5jZSA9IG51bGw7XHJcbiAgICB0aGlzLnRyYW5zZm9ybVJvb3RBbmNlc3Rvckluc3RhbmNlID0gbnVsbDtcclxuICAgIGNsZWFuQXJyYXkoIHRoaXMuZGlydHlEcmF3YWJsZXMgKTtcclxuICAgIGNsZWFuQXJyYXkoIHRoaXMud2F0Y2hlZEZpbHRlck5vZGVzICk7XHJcblxyXG4gICAgdGhpcy5wcmV2aW91c0ZpcnN0RHJhd2FibGUgPSBudWxsO1xyXG4gICAgdGhpcy5wcmV2aW91c0xhc3REcmF3YWJsZSA9IG51bGw7XHJcblxyXG4gICAgc3VwZXIuZGlzcG9zZSgpO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5CYWNrYm9uZURyYXdhYmxlICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEaXNwb3NlIGFsbCBvZiB0aGUgYmxvY2tzIHdoaWxlIGNsZWFyaW5nIG91ciByZWZlcmVuY2VzIHRvIHRoZW1cclxuICAgKiBAcHVibGljXHJcbiAgICovXHJcbiAgbWFya0Jsb2Nrc0ZvckRpc3Bvc2FsKCkge1xyXG4gICAgd2hpbGUgKCB0aGlzLmJsb2Nrcy5sZW5ndGggKSB7XHJcbiAgICAgIGNvbnN0IGJsb2NrID0gdGhpcy5ibG9ja3MucG9wKCk7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5CYWNrYm9uZURyYXdhYmxlICYmIHNjZW5lcnlMb2cuQmFja2JvbmVEcmF3YWJsZSggYCR7dGhpcy50b1N0cmluZygpfSByZW1vdmluZyBibG9jazogJHtibG9jay50b1N0cmluZygpfWAgKTtcclxuICAgICAgLy9UT0RPOiBQRVJGT1JNQU5DRTogZG9lcyB0aGlzIGNhdXNlIHJlZmxvd3MgLyBzdHlsZSBjYWxjdWxhdGlvbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICBpZiAoIGJsb2NrLmRvbUVsZW1lbnQucGFyZW50Tm9kZSA9PT0gdGhpcy5kb21FbGVtZW50ICkge1xyXG4gICAgICAgIC8vIGd1YXJkZWQsIHNpbmNlIHdlIG1heSBoYXZlIGEgKG5ldykgY2hpbGQgZHJhd2FibGUgYWRkIGl0IGJlZm9yZSB3ZSBjYW4gcmVtb3ZlIGl0XHJcbiAgICAgICAgdGhpcy5kb21FbGVtZW50LnJlbW92ZUNoaWxkKCBibG9jay5kb21FbGVtZW50ICk7XHJcbiAgICAgIH1cclxuICAgICAgYmxvY2subWFya0ZvckRpc3Bvc2FsKCB0aGlzLmRpc3BsYXkgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgdXBkYXRlQmFja2JvbmVWaXNpYmlsaXR5KCkge1xyXG4gICAgdGhpcy52aXNpYmxlID0gdGhpcy5iYWNrYm9uZUluc3RhbmNlLnJlbGF0aXZlVmlzaWJsZTtcclxuXHJcbiAgICBpZiAoICF0aGlzLnZpc2liaWxpdHlEaXJ0eSApIHtcclxuICAgICAgdGhpcy52aXNpYmlsaXR5RGlydHkgPSB0cnVlO1xyXG4gICAgICB0aGlzLm1hcmtEaXJ0eSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFya3MgdGhpcyBiYWNrYm9uZSBmb3IgZGlzcG9zYWwuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqIEBvdmVycmlkZVxyXG4gICAqXHJcbiAgICogTk9URTogU2hvdWxkIGJlIGNhbGxlZCBkdXJpbmcgc3luY1RyZWVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7RGlzcGxheX0gZGlzcGxheVxyXG4gICAqL1xyXG4gIG1hcmtGb3JEaXNwb3NhbCggZGlzcGxheSApIHtcclxuICAgIGZvciAoIGxldCBkID0gdGhpcy5wcmV2aW91c0ZpcnN0RHJhd2FibGU7IGQgIT09IG51bGw7IGQgPSBkLm9sZE5leHREcmF3YWJsZSApIHtcclxuICAgICAgZC5ub3RlUGVuZGluZ1JlbW92YWwoIHRoaXMuZGlzcGxheSApO1xyXG4gICAgICBpZiAoIGQgPT09IHRoaXMucHJldmlvdXNMYXN0RHJhd2FibGUgKSB7IGJyZWFrOyB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnJlbW92ZWREcmF3YWJsZXMgPSB0cnVlO1xyXG5cclxuICAgIC8vIHN1cGVyIGNhbGxcclxuICAgIHN1cGVyLm1hcmtGb3JEaXNwb3NhbCggZGlzcGxheSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFya3MgYSBkcmF3YWJsZSBhcyBkaXJ0eS5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0RyYXdhYmxlfSBkcmF3YWJsZVxyXG4gICAqL1xyXG4gIG1hcmtEaXJ0eURyYXdhYmxlKCBkcmF3YWJsZSApIHtcclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICAvLyBDYXRjaCBpbmZpbml0ZSBsb29wc1xyXG4gICAgICB0aGlzLmRpc3BsYXkuZW5zdXJlTm90UGFpbnRpbmcoKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmRpcnR5RHJhd2FibGVzLnB1c2goIGRyYXdhYmxlICk7XHJcbiAgICB0aGlzLm1hcmtEaXJ0eSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFya3Mgb3VyIHRyYW5zZm9ybSBhcyBkaXJ0eS5cclxuICAgKiBAcHVibGljXHJcbiAgICovXHJcbiAgbWFya1RyYW5zZm9ybURpcnR5KCkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy53aWxsQXBwbHlUcmFuc2Zvcm0sICdTYW5pdHkgY2hlY2sgZm9yIHdpbGxBcHBseVRyYW5zZm9ybScgKTtcclxuXHJcbiAgICAvLyByZWxhdGl2ZSBtYXRyaXggb24gYmFja2JvbmUgaW5zdGFuY2Ugc2hvdWxkIGJlIHVwIHRvIGRhdGUsIHNpbmNlIHdlIGFkZGVkIHRoZSBjb21wdXRlIGZsYWdzXHJcbiAgICBVdGlscy5hcHBseVByZXBhcmVkVHJhbnNmb3JtKCB0aGlzLmJhY2tib25lSW5zdGFuY2UucmVsYXRpdmVUcmFuc2Zvcm0ubWF0cml4LCB0aGlzLmRvbUVsZW1lbnQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1hcmtzIG91ciBvcGFjaXR5IGFzIGRpcnR5LlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgb25GaWx0ZXJEaXJ0eSgpIHtcclxuICAgIGlmICggIXRoaXMuZmlsdGVyRGlydHkgKSB7XHJcbiAgICAgIHRoaXMuZmlsdGVyRGlydHkgPSB0cnVlO1xyXG4gICAgICB0aGlzLm1hcmtEaXJ0eSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFya3Mgb3VyIGNsaXAgYXMgZGlydHkuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBvbkNsaXBEaXJ0eSgpIHtcclxuICAgIGlmICggIXRoaXMuY2xpcERpcnR5ICkge1xyXG4gICAgICB0aGlzLmNsaXBEaXJ0eSA9IHRydWU7XHJcbiAgICAgIHRoaXMubWFya0RpcnR5KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVcGRhdGVzIHRoZSBET00gYXBwZWFyYW5jZSBvZiB0aGlzIGRyYXdhYmxlICh3aGV0aGVyIGJ5IHByZXBhcmluZy9jYWxsaW5nIGRyYXcgY2FsbHMsIERPTSBlbGVtZW50IHVwZGF0ZXMsIGV0Yy4pXHJcbiAgICogQHB1YmxpY1xyXG4gICAqIEBvdmVycmlkZVxyXG4gICAqXHJcbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gV2hldGhlciB0aGUgdXBkYXRlIHNob3VsZCBjb250aW51ZSAoaWYgZmFsc2UsIGZ1cnRoZXIgdXBkYXRlcyBpbiBzdXBlcnR5cGUgc3RlcHMgc2hvdWxkIG5vdFxyXG4gICAqICAgICAgICAgICAgICAgICAgICAgIGJlIGRvbmUpLlxyXG4gICAqL1xyXG4gIHVwZGF0ZSgpIHtcclxuICAgIC8vIFNlZSBpZiB3ZSBuZWVkIHRvIGFjdHVhbGx5IHVwZGF0ZSB0aGluZ3MgKHdpbGwgYmFpbCBvdXQgaWYgd2UgYXJlIG5vdCBkaXJ0eSwgb3IgaWYgd2UndmUgYmVlbiBkaXNwb3NlZClcclxuICAgIGlmICggIXN1cGVyLnVwZGF0ZSgpICkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgd2hpbGUgKCB0aGlzLmRpcnR5RHJhd2FibGVzLmxlbmd0aCApIHtcclxuICAgICAgdGhpcy5kaXJ0eURyYXdhYmxlcy5wb3AoKS51cGRhdGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHRoaXMuZmlsdGVyRGlydHkgKSB7XHJcbiAgICAgIHRoaXMuZmlsdGVyRGlydHkgPSBmYWxzZTtcclxuXHJcbiAgICAgIGxldCBmaWx0ZXJTdHJpbmcgPSAnJztcclxuXHJcbiAgICAgIGNvbnN0IGxlbiA9IHRoaXMud2F0Y2hlZEZpbHRlck5vZGVzLmxlbmd0aDtcclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbGVuOyBpKysgKSB7XHJcbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMud2F0Y2hlZEZpbHRlck5vZGVzWyBpIF07XHJcbiAgICAgICAgY29uc3Qgb3BhY2l0eSA9IG5vZGUuZ2V0RWZmZWN0aXZlT3BhY2l0eSgpO1xyXG5cclxuICAgICAgICBmb3IgKCBsZXQgaiA9IDA7IGogPCBub2RlLl9maWx0ZXJzLmxlbmd0aDsgaisrICkge1xyXG4gICAgICAgICAgZmlsdGVyU3RyaW5nICs9IGAke2ZpbHRlclN0cmluZyA/ICcgJyA6ICcnfSR7bm9kZS5fZmlsdGVyc1sgaiBdLmdldENTU0ZpbHRlclN0cmluZygpfWA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBBcHBseSBvcGFjaXR5IGFmdGVyIG90aGVyIGVmZmVjdHNcclxuICAgICAgICBpZiAoIG9wYWNpdHkgIT09IDEgKSB7XHJcbiAgICAgICAgICBmaWx0ZXJTdHJpbmcgKz0gYCR7ZmlsdGVyU3RyaW5nID8gJyAnIDogJyd9b3BhY2l0eSgke3RvU1ZHTnVtYmVyKCBvcGFjaXR5ICl9KWA7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUuZmlsdGVyID0gZmlsdGVyU3RyaW5nO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggdGhpcy52aXNpYmlsaXR5RGlydHkgKSB7XHJcbiAgICAgIHRoaXMudmlzaWJpbGl0eURpcnR5ID0gZmFsc2U7XHJcblxyXG4gICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IHRoaXMudmlzaWJsZSA/ICcnIDogJ25vbmUnO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggdGhpcy5jbGlwRGlydHkgKSB7XHJcbiAgICAgIHRoaXMuY2xpcERpcnR5ID0gZmFsc2U7XHJcblxyXG4gICAgICAvLyB2YXIgY2xpcCA9IHRoaXMud2lsbEFwcGx5RmlsdGVycyA/IHRoaXMuZ2V0RmlsdGVyQ2xpcCgpIDogJyc7XHJcblxyXG4gICAgICAvL09IVFdPIFRPRE86IENTUyBjbGlwLXBhdGgvbWFzayBzdXBwb3J0IGhlcmUuIHNlZSBodHRwOi8vd3d3Lmh0bWw1cm9ja3MuY29tL2VuL3R1dG9yaWFscy9tYXNraW5nL2Fkb2JlLyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICAvLyB0aGlzLmRvbUVsZW1lbnQuc3R5bGUuY2xpcFBhdGggPSBjbGlwOyAvLyB5aWtlcyEgdGVtcG9yYXJ5LCBzaW5jZSB3ZSBhbHJlYWR5IHRocmV3IHNvbWV0aGluZz9cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGNvbWJpbmVkIHZpc2liaWxpdHkgb2Ygbm9kZXMgXCJhYm92ZSB1c1wiIHRoYXQgd2lsbCBuZWVkIHRvIGJlIHRha2VuIGludG8gYWNjb3VudCBmb3IgZGlzcGxheWluZyB0aGlzXHJcbiAgICogYmFja2JvbmUuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICovXHJcbiAgZ2V0RmlsdGVyVmlzaWJpbGl0eSgpIHtcclxuICAgIGNvbnN0IGxlbiA9IHRoaXMud2F0Y2hlZEZpbHRlck5vZGVzLmxlbmd0aDtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGxlbjsgaSsrICkge1xyXG4gICAgICBpZiAoICF0aGlzLndhdGNoZWRGaWx0ZXJOb2Rlc1sgaSBdLmlzVmlzaWJsZSgpICkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY29tYmluZWQgY2xpcEFyZWEgKHN0cmluZz8/PykgZm9yIG5vZGVzIFwiYWJvdmUgdXNcIi5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAqL1xyXG4gIGdldEZpbHRlckNsaXAoKSB7XHJcbiAgICBjb25zdCBjbGlwID0gJyc7XHJcblxyXG4gICAgLy9PSFRXTyBUT0RPOiBwcm9wZXIgY2xpcHBpbmcgc3VwcG9ydCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgLy8gdmFyIGxlbiA9IHRoaXMud2F0Y2hlZEZpbHRlck5vZGVzLmxlbmd0aDtcclxuICAgIC8vIGZvciAoIHZhciBpID0gMDsgaSA8IGxlbjsgaSsrICkge1xyXG4gICAgLy8gICBpZiAoIHRoaXMud2F0Y2hlZEZpbHRlck5vZGVzW2ldLmNsaXBBcmVhICkge1xyXG4gICAgLy8gICAgIHRocm93IG5ldyBFcnJvciggJ2NsaXAtcGF0aCBmb3IgYmFja2JvbmVzIHVuaW1wbGVtZW50ZWQsIGFuZCB3aXRoIHF1ZXN0aW9uYWJsZSBicm93c2VyIHN1cHBvcnQhJyApO1xyXG4gICAgLy8gICB9XHJcbiAgICAvLyB9XHJcblxyXG4gICAgcmV0dXJuIGNsaXA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFbnN1cmVzIHRoYXQgei1pbmRpY2VzIGFyZSBzdHJpY3RseSBpbmNyZWFzaW5nLCB3aGlsZSB0cnlpbmcgdG8gbWluaW1pemUgdGhlIG51bWJlciBvZiB0aW1lcyB3ZSBtdXN0IGNoYW5nZSBpdFxyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICByZWluZGV4QmxvY2tzKCkge1xyXG4gICAgLy8gZnVsbC1wYXNzIGNoYW5nZSBmb3IgemluZGV4LlxyXG4gICAgbGV0IHpJbmRleCA9IDA7IC8vIGRvbid0IHN0YXJ0IGJlbG93IDEgKHdlIGVuc3VyZSA+IGluIGxvb3ApXHJcbiAgICBmb3IgKCBsZXQgayA9IDA7IGsgPCB0aGlzLmJsb2Nrcy5sZW5ndGg7IGsrKyApIHtcclxuICAgICAgY29uc3QgYmxvY2sgPSB0aGlzLmJsb2Nrc1sgayBdO1xyXG4gICAgICBpZiAoIGJsb2NrLnpJbmRleCA8PSB6SW5kZXggKSB7XHJcbiAgICAgICAgY29uc3QgbmV3SW5kZXggPSAoIGsgKyAxIDwgdGhpcy5ibG9ja3MubGVuZ3RoICYmIHRoaXMuYmxvY2tzWyBrICsgMSBdLnpJbmRleCAtIDEgPiB6SW5kZXggKSA/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLmNlaWwoICggekluZGV4ICsgdGhpcy5ibG9ja3NbIGsgKyAxIF0uekluZGV4ICkgLyAyICkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgekluZGV4ICsgMjA7XHJcblxyXG4gICAgICAgIC8vIE5PVEU6IHRoaXMgc2hvdWxkIGdpdmUgaXQgaXRzIG93biBzdGFja2luZyBpbmRleCAod2hpY2ggaXMgd2hhdCB3ZSB3YW50KVxyXG4gICAgICAgIGJsb2NrLmRvbUVsZW1lbnQuc3R5bGUuekluZGV4ID0gYmxvY2suekluZGV4ID0gbmV3SW5kZXg7XHJcbiAgICAgIH1cclxuICAgICAgekluZGV4ID0gYmxvY2suekluZGV4O1xyXG5cclxuICAgICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgICAgYXNzZXJ0KCB0aGlzLmJsb2Nrc1sgayBdLnpJbmRleCAlIDEgPT09IDAsICd6LWluZGljZXMgc2hvdWxkIGJlIGludGVnZXJzJyApO1xyXG4gICAgICAgIGFzc2VydCggdGhpcy5ibG9ja3NbIGsgXS56SW5kZXggPiAwLCAnei1pbmRpY2VzIHNob3VsZCBiZSBncmVhdGVyIHRoYW4gemVybyBmb3Igb3VyIG5lZWRzIChzZWUgc3BlYyknICk7XHJcbiAgICAgICAgaWYgKCBrID4gMCApIHtcclxuICAgICAgICAgIGFzc2VydCggdGhpcy5ibG9ja3NbIGsgLSAxIF0uekluZGV4IDwgdGhpcy5ibG9ja3NbIGsgXS56SW5kZXgsICd6LWluZGljZXMgc2hvdWxkIGJlIHN0cmljdGx5IGluY3JlYXNpbmcnICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc2FuaXR5IGNoZWNrXHJcbiAgICB0aGlzLmxhc3RaSW5kZXggPSB6SW5kZXggKyAxO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU3RpdGNoZXMgbXVsdGlwbGUgY2hhbmdlIGludGVydmFscy5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0RyYXdhYmxlfSBmaXJzdERyYXdhYmxlXHJcbiAgICogQHBhcmFtIHtEcmF3YWJsZX0gbGFzdERyYXdhYmxlXHJcbiAgICogQHBhcmFtIHtDaGFuZ2VJbnRlcnZhbH0gZmlyc3RDaGFuZ2VJbnRlcnZhbFxyXG4gICAqIEBwYXJhbSB7Q2hhbmdlSW50ZXJ2YWx9IGxhc3RDaGFuZ2VJbnRlcnZhbFxyXG4gICAqL1xyXG4gIHN0aXRjaCggZmlyc3REcmF3YWJsZSwgbGFzdERyYXdhYmxlLCBmaXJzdENoYW5nZUludGVydmFsLCBsYXN0Q2hhbmdlSW50ZXJ2YWwgKSB7XHJcbiAgICAvLyBubyBzdGl0Y2ggbmVjZXNzYXJ5IGlmIHRoZXJlIGFyZSBubyBjaGFuZ2UgaW50ZXJ2YWxzXHJcbiAgICBpZiAoIGZpcnN0Q2hhbmdlSW50ZXJ2YWwgPT09IG51bGwgfHwgbGFzdENoYW5nZUludGVydmFsID09PSBudWxsICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBmaXJzdENoYW5nZUludGVydmFsID09PSBudWxsICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGxhc3RDaGFuZ2VJbnRlcnZhbCA9PT0gbnVsbCApO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbGFzdENoYW5nZUludGVydmFsLm5leHRDaGFuZ2VJbnRlcnZhbCA9PT0gbnVsbCwgJ1RoaXMgYWxsb3dzIHVzIHRvIGhhdmUgbGVzcyBjaGVja3MgaW4gdGhlIGxvb3AnICk7XHJcblxyXG4gICAgaWYgKCBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuU3RpdGNoICkge1xyXG4gICAgICBzY2VuZXJ5TG9nLlN0aXRjaCggYFN0aXRjaCBpbnRlcnZhbHMgYmVmb3JlIGNvbnN0cmljdGluZzogJHt0aGlzLnRvU3RyaW5nKCl9YCApO1xyXG4gICAgICBzY2VuZXJ5TG9nLnB1c2goKTtcclxuICAgICAgU3RpdGNoZXIuZGVidWdJbnRlcnZhbHMoIGZpcnN0Q2hhbmdlSW50ZXJ2YWwgKTtcclxuICAgICAgc2NlbmVyeUxvZy5wb3AoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBNYWtlIHRoZSBpbnRlcnZhbHMgYXMgc21hbGwgYXMgcG9zc2libGUgYnkgc2tpcHBpbmcgYXJlYXMgd2l0aG91dCBjaGFuZ2VzLCBhbmQgY29sbGFwc2UgdGhlIGludGVydmFsXHJcbiAgICAvLyBsaW5rZWQgbGlzdFxyXG4gICAgbGV0IGxhc3ROb25lbXB0eUludGVydmFsID0gbnVsbDtcclxuICAgIGxldCBpbnRlcnZhbCA9IGZpcnN0Q2hhbmdlSW50ZXJ2YWw7XHJcbiAgICBsZXQgaW50ZXJ2YWxzQ2hhbmdlZCA9IGZhbHNlO1xyXG4gICAgd2hpbGUgKCBpbnRlcnZhbCApIHtcclxuICAgICAgaW50ZXJ2YWxzQ2hhbmdlZCA9IGludGVydmFsLmNvbnN0cmljdCgpIHx8IGludGVydmFsc0NoYW5nZWQ7XHJcblxyXG4gICAgICBpZiAoIGludGVydmFsLmlzRW1wdHkoKSApIHtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpbnRlcnZhbHNDaGFuZ2VkICk7XHJcblxyXG4gICAgICAgIGlmICggbGFzdE5vbmVtcHR5SW50ZXJ2YWwgKSB7XHJcbiAgICAgICAgICAvLyBza2lwIGl0LCBob29rIHRoZSBjb3JyZWN0IHJlZmVyZW5jZVxyXG4gICAgICAgICAgbGFzdE5vbmVtcHR5SW50ZXJ2YWwubmV4dENoYW5nZUludGVydmFsID0gaW50ZXJ2YWwubmV4dENoYW5nZUludGVydmFsO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICAvLyBvdXIgZmlyc3Qgbm9uLWVtcHR5IGludGVydmFsIHdpbGwgYmUgb3VyIG5ldyBmaXJzdENoYW5nZUludGVydmFsXHJcbiAgICAgICAgaWYgKCAhbGFzdE5vbmVtcHR5SW50ZXJ2YWwgKSB7XHJcbiAgICAgICAgICBmaXJzdENoYW5nZUludGVydmFsID0gaW50ZXJ2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxhc3ROb25lbXB0eUludGVydmFsID0gaW50ZXJ2YWw7XHJcbiAgICAgIH1cclxuICAgICAgaW50ZXJ2YWwgPSBpbnRlcnZhbC5uZXh0Q2hhbmdlSW50ZXJ2YWw7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCAhbGFzdE5vbmVtcHR5SW50ZXJ2YWwgKSB7XHJcbiAgICAgIC8vIGVlaywgbm8gbm9uZW1wdHkgY2hhbmdlIGludGVydmFscy4gZG8gbm90aGluZyAoZ29vZCB0byBjYXRjaCBoZXJlLCBidXQgaWRlYWxseSB0aGVyZSBzaG91bGRuJ3QgYmUgY2hhbmdlXHJcbiAgICAgIC8vIGludGVydmFscyB0aGF0IGFsbCBjb2xsYXBzZSkuXHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBsYXN0Q2hhbmdlSW50ZXJ2YWwgPSBsYXN0Tm9uZW1wdHlJbnRlcnZhbDtcclxuICAgIGxhc3RDaGFuZ2VJbnRlcnZhbC5uZXh0Q2hhbmdlSW50ZXJ2YWwgPSBudWxsO1xyXG5cclxuICAgIGlmICggc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlN0aXRjaCAmJiBpbnRlcnZhbHNDaGFuZ2VkICkge1xyXG4gICAgICBzY2VuZXJ5TG9nLlN0aXRjaCggYFN0aXRjaCBpbnRlcnZhbHMgYWZ0ZXIgY29uc3RyaWN0aW5nOiAke3RoaXMudG9TdHJpbmcoKX1gICk7XHJcbiAgICAgIHNjZW5lcnlMb2cucHVzaCgpO1xyXG4gICAgICBTdGl0Y2hlci5kZWJ1Z0ludGVydmFscyggZmlyc3RDaGFuZ2VJbnRlcnZhbCApO1xyXG4gICAgICBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggc2NlbmVyeUxvZyAmJiBzY2VuZXJ5LmlzTG9nZ2luZ1BlcmZvcm1hbmNlKCkgKSB7XHJcbiAgICAgIHRoaXMuZGlzcGxheS5wZXJmU3RpdGNoQ291bnQrKztcclxuXHJcbiAgICAgIGxldCBkSW50ZXJ2YWwgPSBmaXJzdENoYW5nZUludGVydmFsO1xyXG5cclxuICAgICAgd2hpbGUgKCBkSW50ZXJ2YWwgKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwbGF5LnBlcmZJbnRlcnZhbENvdW50Kys7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcGxheS5wZXJmRHJhd2FibGVPbGRJbnRlcnZhbENvdW50ICs9IGRJbnRlcnZhbC5nZXRPbGRJbnRlcm5hbERyYXdhYmxlQ291bnQoIHRoaXMucHJldmlvdXNGaXJzdERyYXdhYmxlLCB0aGlzLnByZXZpb3VzTGFzdERyYXdhYmxlICk7XHJcbiAgICAgICAgdGhpcy5kaXNwbGF5LnBlcmZEcmF3YWJsZU5ld0ludGVydmFsQ291bnQgKz0gZEludGVydmFsLmdldE5ld0ludGVybmFsRHJhd2FibGVDb3VudCggZmlyc3REcmF3YWJsZSwgbGFzdERyYXdhYmxlICk7XHJcblxyXG4gICAgICAgIGRJbnRlcnZhbCA9IGRJbnRlcnZhbC5uZXh0Q2hhbmdlSW50ZXJ2YWw7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnN0aXRjaGVyLnN0aXRjaCggdGhpcywgZmlyc3REcmF3YWJsZSwgbGFzdERyYXdhYmxlLCB0aGlzLnByZXZpb3VzRmlyc3REcmF3YWJsZSwgdGhpcy5wcmV2aW91c0xhc3REcmF3YWJsZSwgZmlyc3RDaGFuZ2VJbnRlcnZhbCwgbGFzdENoYW5nZUludGVydmFsICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSdW5zIGNoZWNrcyBvbiB0aGUgZHJhd2FibGUsIGJhc2VkIG9uIGNlcnRhaW4gZmxhZ3MuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqIEBvdmVycmlkZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBhbGxvd1BlbmRpbmdCbG9ja1xyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gYWxsb3dQZW5kaW5nTGlzdFxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gYWxsb3dEaXJ0eVxyXG4gICAqL1xyXG4gIGF1ZGl0KCBhbGxvd1BlbmRpbmdCbG9jaywgYWxsb3dQZW5kaW5nTGlzdCwgYWxsb3dEaXJ0eSApIHtcclxuICAgIGlmICggYXNzZXJ0U2xvdyApIHtcclxuICAgICAgc3VwZXIuYXVkaXQoIGFsbG93UGVuZGluZ0Jsb2NrLCBhbGxvd1BlbmRpbmdMaXN0LCBhbGxvd0RpcnR5ICk7XHJcblxyXG4gICAgICBhc3NlcnRTbG93ICYmIGFzc2VydFNsb3coIHRoaXMuYmFja2JvbmVJbnN0YW5jZS5pc0JhY2tib25lLCAnV2Ugc2hvdWxkIHJlZmVyZW5jZSBhbiBpbnN0YW5jZSB0aGF0IHJlcXVpcmVzIGEgYmFja2JvbmUnICk7XHJcbiAgICAgIGFzc2VydFNsb3cgJiYgYXNzZXJ0U2xvdyggdGhpcy50cmFuc2Zvcm1Sb290SW5zdGFuY2UuaXNUcmFuc2Zvcm1lZCwgJ1RyYW5zZm9ybSByb290IHNob3VsZCBiZSB0cmFuc2Zvcm1lZCcgKTtcclxuXHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuYmxvY2tzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIHRoaXMuYmxvY2tzWyBpIF0uYXVkaXQoIGFsbG93UGVuZGluZ0Jsb2NrLCBhbGxvd1BlbmRpbmdMaXN0LCBhbGxvd0RpcnR5ICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBiYXNlIERPTSBlbGVtZW50IGZvciBhIGJhY2tib25lLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtIVE1MRGl2RWxlbWVudH1cclxuICAgKi9cclxuICBzdGF0aWMgY3JlYXRlRGl2QmFja2JvbmUoKSB7XHJcbiAgICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xyXG4gICAgZGl2LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcclxuICAgIGRpdi5zdHlsZS5sZWZ0ID0gJzAnO1xyXG4gICAgZGl2LnN0eWxlLnRvcCA9ICcwJztcclxuICAgIGRpdi5zdHlsZS53aWR0aCA9ICcwJztcclxuICAgIGRpdi5zdHlsZS5oZWlnaHQgPSAnMCc7XHJcbiAgICByZXR1cm4gZGl2O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2l2ZW4gYW4gZXh0ZXJuYWwgZWxlbWVudCwgd2UgYXBwbHkgdGhlIG5lY2Vzc2FyeSBzdHlsZSB0byBtYWtlIGl0IGNvbXBhdGlibGUgYXMgYSBiYWNrYm9uZSBET00gZWxlbWVudC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XHJcbiAgICogQHJldHVybnMge0hUTUxFbGVtZW50fSAtIEZvciBjaGFpbmluZ1xyXG4gICAqL1xyXG4gIHN0YXRpYyByZXB1cnBvc2VCYWNrYm9uZUNvbnRhaW5lciggZWxlbWVudCApIHtcclxuICAgIGlmICggZWxlbWVudC5zdHlsZS5wb3NpdGlvbiAhPT0gJ3JlbGF0aXZlJyB8fCBlbGVtZW50LnN0eWxlLnBvc2l0aW9uICE9PSAnYWJzb2x1dGUnICkge1xyXG4gICAgICBlbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcclxuICAgIH1cclxuICAgIGVsZW1lbnQuc3R5bGUubGVmdCA9ICcwJztcclxuICAgIGVsZW1lbnQuc3R5bGUudG9wID0gJzAnO1xyXG4gICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnQmFja2JvbmVEcmF3YWJsZScsIEJhY2tib25lRHJhd2FibGUgKTtcclxuXHJcblBvb2xhYmxlLm1peEludG8oIEJhY2tib25lRHJhd2FibGUgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IEJhY2tib25lRHJhd2FibGU7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsV0FBVyxNQUFNLGdDQUFnQztBQUN4RCxPQUFPQyxVQUFVLE1BQU0scUNBQXFDO0FBQzVELE9BQU9DLFFBQVEsTUFBTSxtQ0FBbUM7QUFDeEQsU0FBU0MsUUFBUSxFQUFFQyxjQUFjLEVBQUVDLGVBQWUsRUFBRUMsT0FBTyxFQUFFQyxRQUFRLEVBQUVDLEtBQUssUUFBUSxlQUFlOztBQUVuRztBQUNBLE1BQU1DLGlCQUFpQixHQUFHLElBQUk7QUFFOUIsTUFBTUMsZ0JBQWdCLFNBQVNQLFFBQVEsQ0FBQztFQUN0QztBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRVEsV0FBV0EsQ0FBRUMsT0FBTyxFQUFFQyxnQkFBZ0IsRUFBRUMscUJBQXFCLEVBQUVDLFFBQVEsRUFBRUMsYUFBYSxFQUFHO0lBQ3ZGLEtBQUssQ0FBQyxDQUFDO0lBRVAsSUFBSSxDQUFDQyxVQUFVLENBQUVMLE9BQU8sRUFBRUMsZ0JBQWdCLEVBQUVDLHFCQUFxQixFQUFFQyxRQUFRLEVBQUVDLGFBQWMsQ0FBQztFQUM5Rjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRUMsVUFBVUEsQ0FBRUwsT0FBTyxFQUFFQyxnQkFBZ0IsRUFBRUMscUJBQXFCLEVBQUVDLFFBQVEsRUFBRUMsYUFBYSxFQUFHO0lBQ3RGLEtBQUssQ0FBQ0MsVUFBVSxDQUFFRixRQUFTLENBQUM7SUFF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