// Copyright 2013-2024, University of Colorado Boulder

/**
 * Handles a visual SVG layer of drawables.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import cleanArray from '../../../phet-core/js/cleanArray.js';
import Poolable from '../../../phet-core/js/Poolable.js';
import dotRandom from '../../../dot/js/dotRandom.js';
import { CountMap, FittedBlock, scenery, SVGGroup, svgns, Utils } from '../imports.js';
class SVGBlock extends FittedBlock {
  /**
   * @mixes Poolable
   *
   * @param {Display} display - the scenery Display this SVGBlock will appear in
   * @param {number} renderer - the bitmask for the renderer, see Renderer.js
   * @param {Instance} transformRootInstance - TODO: Documentation https://github.com/phetsims/scenery/issues/1581
   * @param {Instance} filterRootInstance - TODO: Documentation
   */
  constructor(display, renderer, transformRootInstance, filterRootInstance) {
    super();
    this.initialize(display, renderer, transformRootInstance, filterRootInstance);
  }

  /**
   * @public
   *
   * @param {Display} display - the scenery Display this SVGBlock will appear in
   * @param {number} renderer - the bitmask for the renderer, see Renderer.js
   * @param {Instance} transformRootInstance - TODO: Documentation https://github.com/phetsims/scenery/issues/1581
   * @param {Instance} filterRootInstance - TODO: Documentation
   * @returns {FittedBlock}
   */
  initialize(display, renderer, transformRootInstance, filterRootInstance) {
    super.initialize(display, renderer, transformRootInstance, FittedBlock.COMMON_ANCESTOR);

    // @public {Instance}
    this.filterRootInstance = filterRootInstance;

    // @private {Array.<SVGGradient>}
    this.dirtyGradients = cleanArray(this.dirtyGradients);

    // @private {Array.<SVGGroup>}
    this.dirtyGroups = cleanArray(this.dirtyGroups);

    // @private {Array.<Drawable>}
    this.dirtyDrawables = cleanArray(this.dirtyDrawables);

    // @private {CountMap.<Paint,SVGGradient|SVGPattern>}
    this.paintCountMap = this.paintCountMap || new CountMap(this.onAddPaint.bind(this), this.onRemovePaint.bind(this));

    // @private {boolean} - Tracks whether we have no dirty objects that would require cleanup or releases
    this.areReferencesReduced = true;
    if (!this.domElement) {
      // main SVG element
      this.svg = document.createElementNS(svgns, 'svg');
      this.svg.style.pointerEvents = 'none';
      this.svg.style.position = 'absolute';
      this.svg.style.left = '0';
      this.svg.style.top = '0';

      // pdom - make sure the element is not focusable (it is focusable by default in IE11 full screen mode)
      this.svg.setAttribute('focusable', false);

      // @public {SVGDefsElement} - the <defs> block that we will be stuffing gradients and patterns into
      this.defs = document.createElementNS(svgns, 'defs');
      this.svg.appendChild(this.defs);
      this.baseTransformGroup = document.createElementNS(svgns, 'g');
      this.svg.appendChild(this.baseTransformGroup);
      this.domElement = this.svg;
    }

    // Forces SVG elements to be refreshed every frame, which can force repainting and detect (or potentially in some
    // cases work around) SVG rendering browser bugs. See https://github.com/phetsims/scenery/issues/1507
    // @private {function} - Forces a color change on the 0x0 rect
    this.forceRefreshListener = () => {
      // Lazily add this, so we're not incurring any performance penalties until we actually need it
      if (!this.workaroundRect) {
        const workaroundGroup = document.createElementNS(svgns, 'g');
        this.svg.appendChild(workaroundGroup);
        this.workaroundRect = document.createElementNS(svgns, 'rect');
        this.workaroundRect.setAttribute('width', '0');
        this.workaroundRect.setAttribute('height', '0');
        this.workaroundRect.setAttribute('fill', 'none');
        workaroundGroup.appendChild(this.workaroundRect);
      }
      const red = dotRandom.nextIntBetween(0, 255);
      const green = dotRandom.nextIntBetween(0, 255);
      const blue = dotRandom.nextIntBetween(0, 255);
      this.workaroundRect.setAttribute('fill', `rgba(${red},${green},${blue},0.02)`);
    };
    this.display._refreshSVGEmitter.addListener(this.forceRefreshListener);

    // reset what layer fitting can do
    Utils.prepareForTransform(this.svg); // Apply CSS needed for future CSS transforms to work properly.

    Utils.unsetTransform(this.svg); // clear out any transforms that could have been previously applied
    this.baseTransformGroup.setAttribute('transform', ''); // no base transform

    const instanceClosestToRoot = transformRootInstance.trail.nodes.length > filterRootInstance.trail.nodes.length ? filterRootInstance : transformRootInstance;
    this.rootGroup = SVGGroup.createFromPool(this, instanceClosestToRoot, null);
    this.baseTransformGroup.appendChild(this.rootGroup.svgGroup);

    // TODO: dirty list of nodes (each should go dirty only once, easier than scanning all?) https://github.com/phetsims/scenery/issues/1581

    sceneryLog && sceneryLog.SVGBlock && sceneryLog.SVGBlock(`initialized #${this.id}`);
    return this;
  }

  /**
   * Callback for paintCountMap's create
   * @private
   *
   * @param {Paint} paint
   * @returns {SVGGradient|SVGPattern}
   */
  onAddPaint(paint) {
    const svgPaint = paint.createSVGPaint(this);
    svgPaint.definition.setAttribute('id', `${paint.id}-${this.id}`);
    this.defs.appendChild(svgPaint.definition);
    return svgPaint;
  }

  /**
   * Callback for paintCountMap's destroy
   * @private
   *
   * @param {Paint} paint
   * @param {SVGGradient|SVGPattern} svgPaint
   */
  onRemovePaint(paint, svgPaint) {
    this.defs.removeChild(svgPaint.definition);
    svgPaint.dispose();
  }

  /*
   * Increases our reference count for the specified {Paint}. If it didn't exist before, we'll add the SVG def to the
   * paint can be referenced by SVG id.
   * @public
   *
   * @param {Paint} paint
   */
  incrementPaint(paint) {
    assert && assert(paint.isPaint);
    sceneryLog && sceneryLog.Paints && sceneryLog.Paints(`incrementPaint ${this} ${paint}`);
    this.paintCountMap.increment(paint);
  }

  /*
   * Decreases our reference count for the specified {Paint}. If this was the last reference, we'll remove the SVG def
   * from our SVG tree to prevent memory leaks, etc.
   * @public
   *
   * @param {Paint} paint
   */
  decrementPaint(paint) {
    assert && assert(paint.isPaint);
    sceneryLog && sceneryLog.Paints && sceneryLog.Paints(`decrementPaint ${this} ${paint}`);
    this.paintCountMap.decrement(paint);
  }

  /**
   * @public
   *
   * @param {SVGGradient} gradient
   */
  markDirtyGradient(gradient) {
    this.dirtyGradients.push(gradient);
    this.markDirty();
  }

  /**
   * @public
   *
   * @param {Block} block
   */
  markDirtyGroup(block) {
    this.dirtyGroups.push(block);
    this.markDirty();
    if (this.areReferencesReduced) {
      this.display.markForReducedReferences(this);
    }
    this.areReferencesReduced = false;
  }

  /**
   * @public
   *
   * @param {Drawable} drawable
   */
  markDirtyDrawable(drawable) {
    sceneryLog && sceneryLog.dirty && sceneryLog.dirty(`markDirtyDrawable on SVGBlock#${this.id} with ${drawable.toString()}`);
    this.dirtyDrawables.push(drawable);
    this.markDirty();
    if (this.areReferencesReduced) {
      this.display.markForReducedReferences(this);
    }
    this.areReferencesReduced = false;
  }

  /**
   * @public
   * @override
   */
  setSizeFullDisplay() {
    sceneryLog && sceneryLog.SVGBlock && sceneryLog.SVGBlock(`setSizeFullDisplay #${this.id}`);
    this.baseTransformGroup.removeAttribute('transform');
    Utils.unsetTransform(this.svg);
    const size = this.display.getSize();
    this.svg.setAttribute('width', size.width);
    this.svg.setAttribute('height', size.height);
  }

  /**
   * @public
   * @override
   */
  setSizeFitBounds() {
    sceneryLog && sceneryLog.SVGBlock && sceneryLog.SVGBlock(`setSizeFitBounds #${this.id} with ${this.fitBounds.toString()}`);
    const x = this.fitBounds.minX;
    const y = this.fitBounds.minY;
    assert && assert(isFinite(x) && isFinite(y), 'Invalid SVG transform for SVGBlock');
    assert && assert(this.fitBounds.isValid(), 'Invalid fitBounds');
    this.baseTransformGroup.setAttribute('transform', `translate(${-x},${-y})`); // subtract off so we have a tight fit
    Utils.setTransform(`matrix(1,0,0,1,${x},${y})`, this.svg); // reapply the translation as a CSS transform
    this.svg.setAttribute('width', this.fitBounds.width);
    this.svg.setAttribute('height', this.fitBounds.height);
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
    sceneryLog && sceneryLog.SVGBlock && sceneryLog.SVGBlock(`update #${this.id}`);

    //OHTWO TODO: call here! https://github.com/phetsims/scenery/issues/1581
    // TODO: What does the above TODO mean? https://github.com/phetsims/scenery/issues/1581
    while (this.dirtyGroups.length) {
      const group = this.dirtyGroups.pop();

      // if this group has been disposed or moved to another block, don't mess with it
      if (group.block === this) {
        group.update();
      }
    }
    while (this.dirtyGradients.length) {
      this.dirtyGradients.pop().update();
    }
    while (this.dirtyDrawables.length) {
      const drawable = this.dirtyDrawables.pop();

      // if this drawable has been disposed or moved to another block, don't mess with it
      // TODO: If it was moved to another block, why might it still appear in our list?  Shouldn't that be an assertion check? https://github.com/phetsims/scenery/issues/1581
      if (drawable.parentDrawable === this) {
        drawable.update();
      }
    }
    this.areReferencesReduced = true; // Once we've iterated through things, we've automatically reduced our references.

    // checks will be done in updateFit() to see whether it is needed
    this.updateFit();
    return true;
  }

  /**
   * Looks to remove dirty objects that may have been disposed.
   * See https://github.com/phetsims/energy-forms-and-changes/issues/356
   * @public
   *
   * @public
   */
  reduceReferences() {
    // no-op if we had an update first
    if (this.areReferencesReduced) {
      return;
    }

    // Attempts to do this in a high-performance way, where we're not shifting array contents around (so we'll do this
    // in one scan).

    let inspectionIndex = 0;
    let replacementIndex = 0;
    while (inspectionIndex < this.dirtyGroups.length) {
      const group = this.dirtyGroups[inspectionIndex];

      // Only keep things that reference our block.
      if (group.block === this) {
        // If the indices are the same, don't do the operation
        if (replacementIndex !== inspectionIndex) {
          this.dirtyGroups[replacementIndex] = group;
        }
        replacementIndex++;
      }
      inspectionIndex++;
    }

    // Our array should be only that length now
    while (this.dirtyGroups.length > replacementIndex) {
      this.dirtyGroups.pop();
    }

    // Do a similar thing with dirtyDrawables (not optimized out because for right now we want to maximize performance).
    inspectionIndex = 0;
    replacementIndex = 0;
    while (inspectionIndex < this.dirtyDrawables.length) {
      const drawable = this.dirtyDrawables[inspectionIndex];

      // Only keep things that reference our block as the parentDrawable.
      if (drawable.parentDrawable === this) {
        // If the indices are the same, don't do the operation
        if (replacementIndex !== inspectionIndex) {
          this.dirtyDrawables[replacementIndex] = drawable;
        }
        replacementIndex++;
      }
      inspectionIndex++;
    }

    // Our array should be only that length now
    while (this.dirtyDrawables.length > replacementIndex) {
      this.dirtyDrawables.pop();
    }
    this.areReferencesReduced = true;
  }

  /**
   * Releases references
   * @public
   */
  dispose() {
    sceneryLog && sceneryLog.SVGBlock && sceneryLog.SVGBlock(`dispose #${this.id}`);

    // make it take up zero area, so that we don't use up excess memory
    this.svg.setAttribute('width', '0');
    this.svg.setAttribute('height', '0');

    // clear references
    this.filterRootInstance = null;
    cleanArray(this.dirtyGradients);
    cleanArray(this.dirtyGroups);
    cleanArray(this.dirtyDrawables);
    this.paintCountMap.clear();
    this.display._refreshSVGEmitter.removeListener(this.forceRefreshListener);
    this.baseTransformGroup.removeChild(this.rootGroup.svgGroup);
    this.rootGroup.dispose();
    this.rootGroup = null;

    // since we may not properly remove all defs yet
    while (this.defs.childNodes.length) {
      this.defs.removeChild(this.defs.childNodes[0]);
    }
    super.dispose();
  }

  /**
   * @public
   * @override
   *
   * @param {Drawable} drawable
   */
  addDrawable(drawable) {
    sceneryLog && sceneryLog.SVGBlock && sceneryLog.SVGBlock(`#${this.id}.addDrawable ${drawable.toString()}`);
    super.addDrawable(drawable);
    SVGGroup.addDrawable(this, drawable);
    drawable.updateSVGBlock(this);
  }

  /**
   * @public
   * @override
   *
   * @param {Drawable} drawable
   */
  removeDrawable(drawable) {
    sceneryLog && sceneryLog.SVGBlock && sceneryLog.SVGBlock(`#${this.id}.removeDrawable ${drawable.toString()}`);
    SVGGroup.removeDrawable(this, drawable);
    super.removeDrawable(drawable);

    // NOTE: we don't unset the drawable's defs here, since it will either be disposed (will clear it)
    // or will be added to another SVGBlock (which will overwrite it)
  }

  /**
   * @public
   * @override
   *
   * @param {Drawable} firstDrawable
   * @param {Drawable} lastDrawable
   */
  onIntervalChange(firstDrawable, lastDrawable) {
    sceneryLog && sceneryLog.SVGBlock && sceneryLog.SVGBlock(`#${this.id}.onIntervalChange ${firstDrawable.toString()} to ${lastDrawable.toString()}`);
    super.onIntervalChange(firstDrawable, lastDrawable);
  }

  /**
   * Returns a string form of this object
   * @public
   *
   * @returns {string}
   */
  toString() {
    return `SVGBlock#${this.id}-${FittedBlock.fitString[this.fit]}`;
  }
}
scenery.register('SVGBlock', SVGBlock);
Poolable.mixInto(SVGBlock);
export default SVGBlock;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjbGVhbkFycmF5IiwiUG9vbGFibGUiLCJkb3RSYW5kb20iLCJDb3VudE1hcCIsIkZpdHRlZEJsb2NrIiwic2NlbmVyeSIsIlNWR0dyb3VwIiwic3ZnbnMiLCJVdGlscyIsIlNWR0Jsb2NrIiwiY29uc3RydWN0b3IiLCJkaXNwbGF5IiwicmVuZGVyZXIiLCJ0cmFuc2Zvcm1Sb290SW5zdGFuY2UiLCJmaWx0ZXJSb290SW5zdGFuY2UiLCJpbml0aWFsaXplIiwiQ09NTU9OX0FOQ0VTVE9SIiwiZGlydHlHcmFkaWVudHMiLCJkaXJ0eUdyb3VwcyIsImRpcnR5RHJhd2FibGVzIiwicGFpbnRDb3VudE1hcCIsIm9uQWRkUGFpbnQiLCJiaW5kIiwib25SZW1vdmVQYWludCIsImFyZVJlZmVyZW5jZXNSZWR1Y2VkIiwiZG9tRWxlbWVudCIsInN2ZyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudE5TIiwic3R5bGUiLCJwb2ludGVyRXZlbnRzIiwicG9zaXRpb24iLCJsZWZ0IiwidG9wIiwic2V0QXR0cmlidXRlIiwiZGVmcyIsImFwcGVuZENoaWxkIiwiYmFzZVRyYW5zZm9ybUdyb3VwIiwiZm9yY2VSZWZyZXNoTGlzdGVuZXIiLCJ3b3JrYXJvdW5kUmVjdCIsIndvcmthcm91bmRHcm91cCIsInJlZCIsIm5leHRJbnRCZXR3ZWVuIiwiZ3JlZW4iLCJibHVlIiwiX3JlZnJlc2hTVkdFbWl0dGVyIiwiYWRkTGlzdGVuZXIiLCJwcmVwYXJlRm9yVHJhbnNmb3JtIiwidW5zZXRUcmFuc2Zvcm0iLCJpbnN0YW5jZUNsb3Nlc3RUb1Jvb3QiLCJ0cmFpbCIsIm5vZGVzIiwibGVuZ3RoIiwicm9vdEdyb3VwIiwiY3JlYXRlRnJvbVBvb2wiLCJzdmdHcm91cCIsInNjZW5lcnlMb2ciLCJpZCIsInBhaW50Iiwic3ZnUGFpbnQiLCJjcmVhdGVTVkdQYWludCIsImRlZmluaXRpb24iLCJyZW1vdmVDaGlsZCIsImRpc3Bvc2UiLCJpbmNyZW1lbnRQYWludCIsImFzc2VydCIsImlzUGFpbnQiLCJQYWludHMiLCJpbmNyZW1lbnQiLCJkZWNyZW1lbnRQYWludCIsImRlY3JlbWVudCIsIm1hcmtEaXJ0eUdyYWRpZW50IiwiZ3JhZGllbnQiLCJwdXNoIiwibWFya0RpcnR5IiwibWFya0RpcnR5R3JvdXAiLCJibG9jayIsIm1hcmtGb3JSZWR1Y2VkUmVmZXJlbmNlcyIsIm1hcmtEaXJ0eURyYXdhYmxlIiwiZHJhd2FibGUiLCJkaXJ0eSIsInRvU3RyaW5nIiwic2V0U2l6ZUZ1bGxEaXNwbGF5IiwicmVtb3ZlQXR0cmlidXRlIiwic2l6ZSIsImdldFNpemUiLCJ3aWR0aCIsImhlaWdodCIsInNldFNpemVGaXRCb3VuZHMiLCJmaXRCb3VuZHMiLCJ4IiwibWluWCIsInkiLCJtaW5ZIiwiaXNGaW5pdGUiLCJpc1ZhbGlkIiwic2V0VHJhbnNmb3JtIiwidXBkYXRlIiwiZ3JvdXAiLCJwb3AiLCJwYXJlbnREcmF3YWJsZSIsInVwZGF0ZUZpdCIsInJlZHVjZVJlZmVyZW5jZXMiLCJpbnNwZWN0aW9uSW5kZXgiLCJyZXBsYWNlbWVudEluZGV4IiwiY2xlYXIiLCJyZW1vdmVMaXN0ZW5lciIsImNoaWxkTm9kZXMiLCJhZGREcmF3YWJsZSIsInVwZGF0ZVNWR0Jsb2NrIiwicmVtb3ZlRHJhd2FibGUiLCJvbkludGVydmFsQ2hhbmdlIiwiZmlyc3REcmF3YWJsZSIsImxhc3REcmF3YWJsZSIsImZpdFN0cmluZyIsImZpdCIsInJlZ2lzdGVyIiwibWl4SW50byJdLCJzb3VyY2VzIjpbIlNWR0Jsb2NrLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEhhbmRsZXMgYSB2aXN1YWwgU1ZHIGxheWVyIG9mIGRyYXdhYmxlcy5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBjbGVhbkFycmF5IGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9jbGVhbkFycmF5LmpzJztcclxuaW1wb3J0IFBvb2xhYmxlIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9Qb29sYWJsZS5qcyc7XHJcbmltcG9ydCBkb3RSYW5kb20gZnJvbSAnLi4vLi4vLi4vZG90L2pzL2RvdFJhbmRvbS5qcyc7XHJcbmltcG9ydCB7IENvdW50TWFwLCBGaXR0ZWRCbG9jaywgc2NlbmVyeSwgU1ZHR3JvdXAsIHN2Z25zLCBVdGlscyB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5cclxuY2xhc3MgU1ZHQmxvY2sgZXh0ZW5kcyBGaXR0ZWRCbG9jayB7XHJcbiAgLyoqXHJcbiAgICogQG1peGVzIFBvb2xhYmxlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0Rpc3BsYXl9IGRpc3BsYXkgLSB0aGUgc2NlbmVyeSBEaXNwbGF5IHRoaXMgU1ZHQmxvY2sgd2lsbCBhcHBlYXIgaW5cclxuICAgKiBAcGFyYW0ge251bWJlcn0gcmVuZGVyZXIgLSB0aGUgYml0bWFzayBmb3IgdGhlIHJlbmRlcmVyLCBzZWUgUmVuZGVyZXIuanNcclxuICAgKiBAcGFyYW0ge0luc3RhbmNlfSB0cmFuc2Zvcm1Sb290SW5zdGFuY2UgLSBUT0RPOiBEb2N1bWVudGF0aW9uIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICogQHBhcmFtIHtJbnN0YW5jZX0gZmlsdGVyUm9vdEluc3RhbmNlIC0gVE9ETzogRG9jdW1lbnRhdGlvblxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKCBkaXNwbGF5LCByZW5kZXJlciwgdHJhbnNmb3JtUm9vdEluc3RhbmNlLCBmaWx0ZXJSb290SW5zdGFuY2UgKSB7XHJcbiAgICBzdXBlcigpO1xyXG5cclxuICAgIHRoaXMuaW5pdGlhbGl6ZSggZGlzcGxheSwgcmVuZGVyZXIsIHRyYW5zZm9ybVJvb3RJbnN0YW5jZSwgZmlsdGVyUm9vdEluc3RhbmNlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0Rpc3BsYXl9IGRpc3BsYXkgLSB0aGUgc2NlbmVyeSBEaXNwbGF5IHRoaXMgU1ZHQmxvY2sgd2lsbCBhcHBlYXIgaW5cclxuICAgKiBAcGFyYW0ge251bWJlcn0gcmVuZGVyZXIgLSB0aGUgYml0bWFzayBmb3IgdGhlIHJlbmRlcmVyLCBzZWUgUmVuZGVyZXIuanNcclxuICAgKiBAcGFyYW0ge0luc3RhbmNlfSB0cmFuc2Zvcm1Sb290SW5zdGFuY2UgLSBUT0RPOiBEb2N1bWVudGF0aW9uIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICogQHBhcmFtIHtJbnN0YW5jZX0gZmlsdGVyUm9vdEluc3RhbmNlIC0gVE9ETzogRG9jdW1lbnRhdGlvblxyXG4gICAqIEByZXR1cm5zIHtGaXR0ZWRCbG9ja31cclxuICAgKi9cclxuICBpbml0aWFsaXplKCBkaXNwbGF5LCByZW5kZXJlciwgdHJhbnNmb3JtUm9vdEluc3RhbmNlLCBmaWx0ZXJSb290SW5zdGFuY2UgKSB7XHJcbiAgICBzdXBlci5pbml0aWFsaXplKCBkaXNwbGF5LCByZW5kZXJlciwgdHJhbnNmb3JtUm9vdEluc3RhbmNlLCBGaXR0ZWRCbG9jay5DT01NT05fQU5DRVNUT1IgKTtcclxuXHJcbiAgICAvLyBAcHVibGljIHtJbnN0YW5jZX1cclxuICAgIHRoaXMuZmlsdGVyUm9vdEluc3RhbmNlID0gZmlsdGVyUm9vdEluc3RhbmNlO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtBcnJheS48U1ZHR3JhZGllbnQ+fVxyXG4gICAgdGhpcy5kaXJ0eUdyYWRpZW50cyA9IGNsZWFuQXJyYXkoIHRoaXMuZGlydHlHcmFkaWVudHMgKTtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7QXJyYXkuPFNWR0dyb3VwPn1cclxuICAgIHRoaXMuZGlydHlHcm91cHMgPSBjbGVhbkFycmF5KCB0aGlzLmRpcnR5R3JvdXBzICk7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge0FycmF5LjxEcmF3YWJsZT59XHJcbiAgICB0aGlzLmRpcnR5RHJhd2FibGVzID0gY2xlYW5BcnJheSggdGhpcy5kaXJ0eURyYXdhYmxlcyApO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtDb3VudE1hcC48UGFpbnQsU1ZHR3JhZGllbnR8U1ZHUGF0dGVybj59XHJcbiAgICB0aGlzLnBhaW50Q291bnRNYXAgPSB0aGlzLnBhaW50Q291bnRNYXAgfHwgbmV3IENvdW50TWFwKFxyXG4gICAgICB0aGlzLm9uQWRkUGFpbnQuYmluZCggdGhpcyApLFxyXG4gICAgICB0aGlzLm9uUmVtb3ZlUGFpbnQuYmluZCggdGhpcyApXHJcbiAgICApO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtib29sZWFufSAtIFRyYWNrcyB3aGV0aGVyIHdlIGhhdmUgbm8gZGlydHkgb2JqZWN0cyB0aGF0IHdvdWxkIHJlcXVpcmUgY2xlYW51cCBvciByZWxlYXNlc1xyXG4gICAgdGhpcy5hcmVSZWZlcmVuY2VzUmVkdWNlZCA9IHRydWU7XHJcblxyXG4gICAgaWYgKCAhdGhpcy5kb21FbGVtZW50ICkge1xyXG5cclxuICAgICAgLy8gbWFpbiBTVkcgZWxlbWVudFxyXG4gICAgICB0aGlzLnN2ZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyggc3ZnbnMsICdzdmcnICk7XHJcbiAgICAgIHRoaXMuc3ZnLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XHJcbiAgICAgIHRoaXMuc3ZnLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcclxuICAgICAgdGhpcy5zdmcuc3R5bGUubGVmdCA9ICcwJztcclxuICAgICAgdGhpcy5zdmcuc3R5bGUudG9wID0gJzAnO1xyXG5cclxuICAgICAgLy8gcGRvbSAtIG1ha2Ugc3VyZSB0aGUgZWxlbWVudCBpcyBub3QgZm9jdXNhYmxlIChpdCBpcyBmb2N1c2FibGUgYnkgZGVmYXVsdCBpbiBJRTExIGZ1bGwgc2NyZWVuIG1vZGUpXHJcbiAgICAgIHRoaXMuc3ZnLnNldEF0dHJpYnV0ZSggJ2ZvY3VzYWJsZScsIGZhbHNlICk7XHJcblxyXG4gICAgICAvLyBAcHVibGljIHtTVkdEZWZzRWxlbWVudH0gLSB0aGUgPGRlZnM+IGJsb2NrIHRoYXQgd2Ugd2lsbCBiZSBzdHVmZmluZyBncmFkaWVudHMgYW5kIHBhdHRlcm5zIGludG9cclxuICAgICAgdGhpcy5kZWZzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCBzdmducywgJ2RlZnMnICk7XHJcbiAgICAgIHRoaXMuc3ZnLmFwcGVuZENoaWxkKCB0aGlzLmRlZnMgKTtcclxuXHJcbiAgICAgIHRoaXMuYmFzZVRyYW5zZm9ybUdyb3VwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCBzdmducywgJ2cnICk7XHJcbiAgICAgIHRoaXMuc3ZnLmFwcGVuZENoaWxkKCB0aGlzLmJhc2VUcmFuc2Zvcm1Hcm91cCApO1xyXG5cclxuICAgICAgdGhpcy5kb21FbGVtZW50ID0gdGhpcy5zdmc7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRm9yY2VzIFNWRyBlbGVtZW50cyB0byBiZSByZWZyZXNoZWQgZXZlcnkgZnJhbWUsIHdoaWNoIGNhbiBmb3JjZSByZXBhaW50aW5nIGFuZCBkZXRlY3QgKG9yIHBvdGVudGlhbGx5IGluIHNvbWVcclxuICAgIC8vIGNhc2VzIHdvcmsgYXJvdW5kKSBTVkcgcmVuZGVyaW5nIGJyb3dzZXIgYnVncy4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTA3XHJcbiAgICAvLyBAcHJpdmF0ZSB7ZnVuY3Rpb259IC0gRm9yY2VzIGEgY29sb3IgY2hhbmdlIG9uIHRoZSAweDAgcmVjdFxyXG4gICAgdGhpcy5mb3JjZVJlZnJlc2hMaXN0ZW5lciA9ICgpID0+IHtcclxuICAgICAgLy8gTGF6aWx5IGFkZCB0aGlzLCBzbyB3ZSdyZSBub3QgaW5jdXJyaW5nIGFueSBwZXJmb3JtYW5jZSBwZW5hbHRpZXMgdW50aWwgd2UgYWN0dWFsbHkgbmVlZCBpdFxyXG4gICAgICBpZiAoICF0aGlzLndvcmthcm91bmRSZWN0ICkge1xyXG4gICAgICAgIGNvbnN0IHdvcmthcm91bmRHcm91cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyggc3ZnbnMsICdnJyApO1xyXG4gICAgICAgIHRoaXMuc3ZnLmFwcGVuZENoaWxkKCB3b3JrYXJvdW5kR3JvdXAgKTtcclxuXHJcbiAgICAgICAgdGhpcy53b3JrYXJvdW5kUmVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyggc3ZnbnMsICdyZWN0JyApO1xyXG4gICAgICAgIHRoaXMud29ya2Fyb3VuZFJlY3Quc2V0QXR0cmlidXRlKCAnd2lkdGgnLCAnMCcgKTtcclxuICAgICAgICB0aGlzLndvcmthcm91bmRSZWN0LnNldEF0dHJpYnV0ZSggJ2hlaWdodCcsICcwJyApO1xyXG4gICAgICAgIHRoaXMud29ya2Fyb3VuZFJlY3Quc2V0QXR0cmlidXRlKCAnZmlsbCcsICdub25lJyApO1xyXG4gICAgICAgIHdvcmthcm91bmRHcm91cC5hcHBlbmRDaGlsZCggdGhpcy53b3JrYXJvdW5kUmVjdCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCByZWQgPSBkb3RSYW5kb20ubmV4dEludEJldHdlZW4oIDAsIDI1NSApO1xyXG4gICAgICBjb25zdCBncmVlbiA9IGRvdFJhbmRvbS5uZXh0SW50QmV0d2VlbiggMCwgMjU1ICk7XHJcbiAgICAgIGNvbnN0IGJsdWUgPSBkb3RSYW5kb20ubmV4dEludEJldHdlZW4oIDAsIDI1NSApO1xyXG4gICAgICB0aGlzLndvcmthcm91bmRSZWN0LnNldEF0dHJpYnV0ZSggJ2ZpbGwnLCBgcmdiYSgke3JlZH0sJHtncmVlbn0sJHtibHVlfSwwLjAyKWAgKTtcclxuICAgIH07XHJcbiAgICB0aGlzLmRpc3BsYXkuX3JlZnJlc2hTVkdFbWl0dGVyLmFkZExpc3RlbmVyKCB0aGlzLmZvcmNlUmVmcmVzaExpc3RlbmVyICk7XHJcblxyXG4gICAgLy8gcmVzZXQgd2hhdCBsYXllciBmaXR0aW5nIGNhbiBkb1xyXG4gICAgVXRpbHMucHJlcGFyZUZvclRyYW5zZm9ybSggdGhpcy5zdmcgKTsgLy8gQXBwbHkgQ1NTIG5lZWRlZCBmb3IgZnV0dXJlIENTUyB0cmFuc2Zvcm1zIHRvIHdvcmsgcHJvcGVybHkuXHJcblxyXG4gICAgVXRpbHMudW5zZXRUcmFuc2Zvcm0oIHRoaXMuc3ZnICk7IC8vIGNsZWFyIG91dCBhbnkgdHJhbnNmb3JtcyB0aGF0IGNvdWxkIGhhdmUgYmVlbiBwcmV2aW91c2x5IGFwcGxpZWRcclxuICAgIHRoaXMuYmFzZVRyYW5zZm9ybUdyb3VwLnNldEF0dHJpYnV0ZSggJ3RyYW5zZm9ybScsICcnICk7IC8vIG5vIGJhc2UgdHJhbnNmb3JtXHJcblxyXG4gICAgY29uc3QgaW5zdGFuY2VDbG9zZXN0VG9Sb290ID0gdHJhbnNmb3JtUm9vdEluc3RhbmNlLnRyYWlsLm5vZGVzLmxlbmd0aCA+IGZpbHRlclJvb3RJbnN0YW5jZS50cmFpbC5ub2Rlcy5sZW5ndGggP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyUm9vdEluc3RhbmNlIDogdHJhbnNmb3JtUm9vdEluc3RhbmNlO1xyXG5cclxuICAgIHRoaXMucm9vdEdyb3VwID0gU1ZHR3JvdXAuY3JlYXRlRnJvbVBvb2woIHRoaXMsIGluc3RhbmNlQ2xvc2VzdFRvUm9vdCwgbnVsbCApO1xyXG4gICAgdGhpcy5iYXNlVHJhbnNmb3JtR3JvdXAuYXBwZW5kQ2hpbGQoIHRoaXMucm9vdEdyb3VwLnN2Z0dyb3VwICk7XHJcblxyXG4gICAgLy8gVE9ETzogZGlydHkgbGlzdCBvZiBub2RlcyAoZWFjaCBzaG91bGQgZ28gZGlydHkgb25seSBvbmNlLCBlYXNpZXIgdGhhbiBzY2FubmluZyBhbGw/KSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5TVkdCbG9jayAmJiBzY2VuZXJ5TG9nLlNWR0Jsb2NrKCBgaW5pdGlhbGl6ZWQgIyR7dGhpcy5pZH1gICk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsYmFjayBmb3IgcGFpbnRDb3VudE1hcCdzIGNyZWF0ZVxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1BhaW50fSBwYWludFxyXG4gICAqIEByZXR1cm5zIHtTVkdHcmFkaWVudHxTVkdQYXR0ZXJufVxyXG4gICAqL1xyXG4gIG9uQWRkUGFpbnQoIHBhaW50ICkge1xyXG4gICAgY29uc3Qgc3ZnUGFpbnQgPSBwYWludC5jcmVhdGVTVkdQYWludCggdGhpcyApO1xyXG4gICAgc3ZnUGFpbnQuZGVmaW5pdGlvbi5zZXRBdHRyaWJ1dGUoICdpZCcsIGAke3BhaW50LmlkfS0ke3RoaXMuaWR9YCApO1xyXG4gICAgdGhpcy5kZWZzLmFwcGVuZENoaWxkKCBzdmdQYWludC5kZWZpbml0aW9uICk7XHJcblxyXG4gICAgcmV0dXJuIHN2Z1BhaW50O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGJhY2sgZm9yIHBhaW50Q291bnRNYXAncyBkZXN0cm95XHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7UGFpbnR9IHBhaW50XHJcbiAgICogQHBhcmFtIHtTVkdHcmFkaWVudHxTVkdQYXR0ZXJufSBzdmdQYWludFxyXG4gICAqL1xyXG4gIG9uUmVtb3ZlUGFpbnQoIHBhaW50LCBzdmdQYWludCApIHtcclxuICAgIHRoaXMuZGVmcy5yZW1vdmVDaGlsZCggc3ZnUGFpbnQuZGVmaW5pdGlvbiApO1xyXG4gICAgc3ZnUGFpbnQuZGlzcG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgLypcclxuICAgKiBJbmNyZWFzZXMgb3VyIHJlZmVyZW5jZSBjb3VudCBmb3IgdGhlIHNwZWNpZmllZCB7UGFpbnR9LiBJZiBpdCBkaWRuJ3QgZXhpc3QgYmVmb3JlLCB3ZSdsbCBhZGQgdGhlIFNWRyBkZWYgdG8gdGhlXHJcbiAgICogcGFpbnQgY2FuIGJlIHJlZmVyZW5jZWQgYnkgU1ZHIGlkLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7UGFpbnR9IHBhaW50XHJcbiAgICovXHJcbiAgaW5jcmVtZW50UGFpbnQoIHBhaW50ICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcGFpbnQuaXNQYWludCApO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5QYWludHMgJiYgc2NlbmVyeUxvZy5QYWludHMoIGBpbmNyZW1lbnRQYWludCAke3RoaXN9ICR7cGFpbnR9YCApO1xyXG5cclxuICAgIHRoaXMucGFpbnRDb3VudE1hcC5pbmNyZW1lbnQoIHBhaW50ICk7XHJcbiAgfVxyXG5cclxuICAvKlxyXG4gICAqIERlY3JlYXNlcyBvdXIgcmVmZXJlbmNlIGNvdW50IGZvciB0aGUgc3BlY2lmaWVkIHtQYWludH0uIElmIHRoaXMgd2FzIHRoZSBsYXN0IHJlZmVyZW5jZSwgd2UnbGwgcmVtb3ZlIHRoZSBTVkcgZGVmXHJcbiAgICogZnJvbSBvdXIgU1ZHIHRyZWUgdG8gcHJldmVudCBtZW1vcnkgbGVha3MsIGV0Yy5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1BhaW50fSBwYWludFxyXG4gICAqL1xyXG4gIGRlY3JlbWVudFBhaW50KCBwYWludCApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHBhaW50LmlzUGFpbnQgKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuUGFpbnRzICYmIHNjZW5lcnlMb2cuUGFpbnRzKCBgZGVjcmVtZW50UGFpbnQgJHt0aGlzfSAke3BhaW50fWAgKTtcclxuXHJcbiAgICB0aGlzLnBhaW50Q291bnRNYXAuZGVjcmVtZW50KCBwYWludCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtTVkdHcmFkaWVudH0gZ3JhZGllbnRcclxuICAgKi9cclxuICBtYXJrRGlydHlHcmFkaWVudCggZ3JhZGllbnQgKSB7XHJcbiAgICB0aGlzLmRpcnR5R3JhZGllbnRzLnB1c2goIGdyYWRpZW50ICk7XHJcbiAgICB0aGlzLm1hcmtEaXJ0eSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtCbG9ja30gYmxvY2tcclxuICAgKi9cclxuICBtYXJrRGlydHlHcm91cCggYmxvY2sgKSB7XHJcbiAgICB0aGlzLmRpcnR5R3JvdXBzLnB1c2goIGJsb2NrICk7XHJcbiAgICB0aGlzLm1hcmtEaXJ0eSgpO1xyXG5cclxuICAgIGlmICggdGhpcy5hcmVSZWZlcmVuY2VzUmVkdWNlZCApIHtcclxuICAgICAgdGhpcy5kaXNwbGF5Lm1hcmtGb3JSZWR1Y2VkUmVmZXJlbmNlcyggdGhpcyApO1xyXG4gICAgfVxyXG4gICAgdGhpcy5hcmVSZWZlcmVuY2VzUmVkdWNlZCA9IGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtEcmF3YWJsZX0gZHJhd2FibGVcclxuICAgKi9cclxuICBtYXJrRGlydHlEcmF3YWJsZSggZHJhd2FibGUgKSB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuZGlydHkgJiYgc2NlbmVyeUxvZy5kaXJ0eSggYG1hcmtEaXJ0eURyYXdhYmxlIG9uIFNWR0Jsb2NrIyR7dGhpcy5pZH0gd2l0aCAke2RyYXdhYmxlLnRvU3RyaW5nKCl9YCApO1xyXG4gICAgdGhpcy5kaXJ0eURyYXdhYmxlcy5wdXNoKCBkcmF3YWJsZSApO1xyXG4gICAgdGhpcy5tYXJrRGlydHkoKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuYXJlUmVmZXJlbmNlc1JlZHVjZWQgKSB7XHJcbiAgICAgIHRoaXMuZGlzcGxheS5tYXJrRm9yUmVkdWNlZFJlZmVyZW5jZXMoIHRoaXMgKTtcclxuICAgIH1cclxuICAgIHRoaXMuYXJlUmVmZXJlbmNlc1JlZHVjZWQgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKiBAb3ZlcnJpZGVcclxuICAgKi9cclxuICBzZXRTaXplRnVsbERpc3BsYXkoKSB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuU1ZHQmxvY2sgJiYgc2NlbmVyeUxvZy5TVkdCbG9jayggYHNldFNpemVGdWxsRGlzcGxheSAjJHt0aGlzLmlkfWAgKTtcclxuXHJcbiAgICB0aGlzLmJhc2VUcmFuc2Zvcm1Hcm91cC5yZW1vdmVBdHRyaWJ1dGUoICd0cmFuc2Zvcm0nICk7XHJcbiAgICBVdGlscy51bnNldFRyYW5zZm9ybSggdGhpcy5zdmcgKTtcclxuXHJcbiAgICBjb25zdCBzaXplID0gdGhpcy5kaXNwbGF5LmdldFNpemUoKTtcclxuICAgIHRoaXMuc3ZnLnNldEF0dHJpYnV0ZSggJ3dpZHRoJywgc2l6ZS53aWR0aCApO1xyXG4gICAgdGhpcy5zdmcuc2V0QXR0cmlidXRlKCAnaGVpZ2h0Jywgc2l6ZS5oZWlnaHQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKiBAb3ZlcnJpZGVcclxuICAgKi9cclxuICBzZXRTaXplRml0Qm91bmRzKCkge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlNWR0Jsb2NrICYmIHNjZW5lcnlMb2cuU1ZHQmxvY2soIGBzZXRTaXplRml0Qm91bmRzICMke3RoaXMuaWR9IHdpdGggJHt0aGlzLmZpdEJvdW5kcy50b1N0cmluZygpfWAgKTtcclxuXHJcbiAgICBjb25zdCB4ID0gdGhpcy5maXRCb3VuZHMubWluWDtcclxuICAgIGNvbnN0IHkgPSB0aGlzLmZpdEJvdW5kcy5taW5ZO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCB4ICkgJiYgaXNGaW5pdGUoIHkgKSwgJ0ludmFsaWQgU1ZHIHRyYW5zZm9ybSBmb3IgU1ZHQmxvY2snICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmZpdEJvdW5kcy5pc1ZhbGlkKCksICdJbnZhbGlkIGZpdEJvdW5kcycgKTtcclxuXHJcbiAgICB0aGlzLmJhc2VUcmFuc2Zvcm1Hcm91cC5zZXRBdHRyaWJ1dGUoICd0cmFuc2Zvcm0nLCBgdHJhbnNsYXRlKCR7LXh9LCR7LXl9KWAgKTsgLy8gc3VidHJhY3Qgb2ZmIHNvIHdlIGhhdmUgYSB0aWdodCBmaXRcclxuICAgIFV0aWxzLnNldFRyYW5zZm9ybSggYG1hdHJpeCgxLDAsMCwxLCR7eH0sJHt5fSlgLCB0aGlzLnN2ZyApOyAvLyByZWFwcGx5IHRoZSB0cmFuc2xhdGlvbiBhcyBhIENTUyB0cmFuc2Zvcm1cclxuICAgIHRoaXMuc3ZnLnNldEF0dHJpYnV0ZSggJ3dpZHRoJywgdGhpcy5maXRCb3VuZHMud2lkdGggKTtcclxuICAgIHRoaXMuc3ZnLnNldEF0dHJpYnV0ZSggJ2hlaWdodCcsIHRoaXMuZml0Qm91bmRzLmhlaWdodCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXBkYXRlcyB0aGUgRE9NIGFwcGVhcmFuY2Ugb2YgdGhpcyBkcmF3YWJsZSAod2hldGhlciBieSBwcmVwYXJpbmcvY2FsbGluZyBkcmF3IGNhbGxzLCBET00gZWxlbWVudCB1cGRhdGVzLCBldGMuKVxyXG4gICAqIEBwdWJsaWNcclxuICAgKiBAb3ZlcnJpZGVcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAtIFdoZXRoZXIgdGhlIHVwZGF0ZSBzaG91bGQgY29udGludWUgKGlmIGZhbHNlLCBmdXJ0aGVyIHVwZGF0ZXMgaW4gc3VwZXJ0eXBlIHN0ZXBzIHNob3VsZCBub3RcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICBiZSBkb25lKS5cclxuICAgKi9cclxuICB1cGRhdGUoKSB7XHJcbiAgICAvLyBTZWUgaWYgd2UgbmVlZCB0byBhY3R1YWxseSB1cGRhdGUgdGhpbmdzICh3aWxsIGJhaWwgb3V0IGlmIHdlIGFyZSBub3QgZGlydHksIG9yIGlmIHdlJ3ZlIGJlZW4gZGlzcG9zZWQpXHJcbiAgICBpZiAoICFzdXBlci51cGRhdGUoKSApIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5TVkdCbG9jayAmJiBzY2VuZXJ5TG9nLlNWR0Jsb2NrKCBgdXBkYXRlICMke3RoaXMuaWR9YCApO1xyXG5cclxuICAgIC8vT0hUV08gVE9ETzogY2FsbCBoZXJlISBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgLy8gVE9ETzogV2hhdCBkb2VzIHRoZSBhYm92ZSBUT0RPIG1lYW4/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICB3aGlsZSAoIHRoaXMuZGlydHlHcm91cHMubGVuZ3RoICkge1xyXG4gICAgICBjb25zdCBncm91cCA9IHRoaXMuZGlydHlHcm91cHMucG9wKCk7XHJcblxyXG4gICAgICAvLyBpZiB0aGlzIGdyb3VwIGhhcyBiZWVuIGRpc3Bvc2VkIG9yIG1vdmVkIHRvIGFub3RoZXIgYmxvY2ssIGRvbid0IG1lc3Mgd2l0aCBpdFxyXG4gICAgICBpZiAoIGdyb3VwLmJsb2NrID09PSB0aGlzICkge1xyXG4gICAgICAgIGdyb3VwLnVwZGF0ZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB3aGlsZSAoIHRoaXMuZGlydHlHcmFkaWVudHMubGVuZ3RoICkge1xyXG4gICAgICB0aGlzLmRpcnR5R3JhZGllbnRzLnBvcCgpLnVwZGF0ZSgpO1xyXG4gICAgfVxyXG4gICAgd2hpbGUgKCB0aGlzLmRpcnR5RHJhd2FibGVzLmxlbmd0aCApIHtcclxuICAgICAgY29uc3QgZHJhd2FibGUgPSB0aGlzLmRpcnR5RHJhd2FibGVzLnBvcCgpO1xyXG5cclxuICAgICAgLy8gaWYgdGhpcyBkcmF3YWJsZSBoYXMgYmVlbiBkaXNwb3NlZCBvciBtb3ZlZCB0byBhbm90aGVyIGJsb2NrLCBkb24ndCBtZXNzIHdpdGggaXRcclxuICAgICAgLy8gVE9ETzogSWYgaXQgd2FzIG1vdmVkIHRvIGFub3RoZXIgYmxvY2ssIHdoeSBtaWdodCBpdCBzdGlsbCBhcHBlYXIgaW4gb3VyIGxpc3Q/ICBTaG91bGRuJ3QgdGhhdCBiZSBhbiBhc3NlcnRpb24gY2hlY2s/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAgIGlmICggZHJhd2FibGUucGFyZW50RHJhd2FibGUgPT09IHRoaXMgKSB7XHJcbiAgICAgICAgZHJhd2FibGUudXBkYXRlKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmFyZVJlZmVyZW5jZXNSZWR1Y2VkID0gdHJ1ZTsgLy8gT25jZSB3ZSd2ZSBpdGVyYXRlZCB0aHJvdWdoIHRoaW5ncywgd2UndmUgYXV0b21hdGljYWxseSByZWR1Y2VkIG91ciByZWZlcmVuY2VzLlxyXG5cclxuICAgIC8vIGNoZWNrcyB3aWxsIGJlIGRvbmUgaW4gdXBkYXRlRml0KCkgdG8gc2VlIHdoZXRoZXIgaXQgaXMgbmVlZGVkXHJcbiAgICB0aGlzLnVwZGF0ZUZpdCgpO1xyXG5cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTG9va3MgdG8gcmVtb3ZlIGRpcnR5IG9iamVjdHMgdGhhdCBtYXkgaGF2ZSBiZWVuIGRpc3Bvc2VkLlxyXG4gICAqIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZW5lcmd5LWZvcm1zLWFuZC1jaGFuZ2VzL2lzc3Vlcy8zNTZcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcHVibGljXHJcbiAgICovXHJcbiAgcmVkdWNlUmVmZXJlbmNlcygpIHtcclxuICAgIC8vIG5vLW9wIGlmIHdlIGhhZCBhbiB1cGRhdGUgZmlyc3RcclxuICAgIGlmICggdGhpcy5hcmVSZWZlcmVuY2VzUmVkdWNlZCApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEF0dGVtcHRzIHRvIGRvIHRoaXMgaW4gYSBoaWdoLXBlcmZvcm1hbmNlIHdheSwgd2hlcmUgd2UncmUgbm90IHNoaWZ0aW5nIGFycmF5IGNvbnRlbnRzIGFyb3VuZCAoc28gd2UnbGwgZG8gdGhpc1xyXG4gICAgLy8gaW4gb25lIHNjYW4pLlxyXG5cclxuICAgIGxldCBpbnNwZWN0aW9uSW5kZXggPSAwO1xyXG4gICAgbGV0IHJlcGxhY2VtZW50SW5kZXggPSAwO1xyXG5cclxuICAgIHdoaWxlICggaW5zcGVjdGlvbkluZGV4IDwgdGhpcy5kaXJ0eUdyb3Vwcy5sZW5ndGggKSB7XHJcbiAgICAgIGNvbnN0IGdyb3VwID0gdGhpcy5kaXJ0eUdyb3Vwc1sgaW5zcGVjdGlvbkluZGV4IF07XHJcblxyXG4gICAgICAvLyBPbmx5IGtlZXAgdGhpbmdzIHRoYXQgcmVmZXJlbmNlIG91ciBibG9jay5cclxuICAgICAgaWYgKCBncm91cC5ibG9jayA9PT0gdGhpcyApIHtcclxuICAgICAgICAvLyBJZiB0aGUgaW5kaWNlcyBhcmUgdGhlIHNhbWUsIGRvbid0IGRvIHRoZSBvcGVyYXRpb25cclxuICAgICAgICBpZiAoIHJlcGxhY2VtZW50SW5kZXggIT09IGluc3BlY3Rpb25JbmRleCApIHtcclxuICAgICAgICAgIHRoaXMuZGlydHlHcm91cHNbIHJlcGxhY2VtZW50SW5kZXggXSA9IGdyb3VwO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXBsYWNlbWVudEluZGV4Kys7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGluc3BlY3Rpb25JbmRleCsrO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE91ciBhcnJheSBzaG91bGQgYmUgb25seSB0aGF0IGxlbmd0aCBub3dcclxuICAgIHdoaWxlICggdGhpcy5kaXJ0eUdyb3Vwcy5sZW5ndGggPiByZXBsYWNlbWVudEluZGV4ICkge1xyXG4gICAgICB0aGlzLmRpcnR5R3JvdXBzLnBvcCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERvIGEgc2ltaWxhciB0aGluZyB3aXRoIGRpcnR5RHJhd2FibGVzIChub3Qgb3B0aW1pemVkIG91dCBiZWNhdXNlIGZvciByaWdodCBub3cgd2Ugd2FudCB0byBtYXhpbWl6ZSBwZXJmb3JtYW5jZSkuXHJcbiAgICBpbnNwZWN0aW9uSW5kZXggPSAwO1xyXG4gICAgcmVwbGFjZW1lbnRJbmRleCA9IDA7XHJcblxyXG4gICAgd2hpbGUgKCBpbnNwZWN0aW9uSW5kZXggPCB0aGlzLmRpcnR5RHJhd2FibGVzLmxlbmd0aCApIHtcclxuICAgICAgY29uc3QgZHJhd2FibGUgPSB0aGlzLmRpcnR5RHJhd2FibGVzWyBpbnNwZWN0aW9uSW5kZXggXTtcclxuXHJcbiAgICAgIC8vIE9ubHkga2VlcCB0aGluZ3MgdGhhdCByZWZlcmVuY2Ugb3VyIGJsb2NrIGFzIHRoZSBwYXJlbnREcmF3YWJsZS5cclxuICAgICAgaWYgKCBkcmF3YWJsZS5wYXJlbnREcmF3YWJsZSA9PT0gdGhpcyApIHtcclxuICAgICAgICAvLyBJZiB0aGUgaW5kaWNlcyBhcmUgdGhlIHNhbWUsIGRvbid0IGRvIHRoZSBvcGVyYXRpb25cclxuICAgICAgICBpZiAoIHJlcGxhY2VtZW50SW5kZXggIT09IGluc3BlY3Rpb25JbmRleCApIHtcclxuICAgICAgICAgIHRoaXMuZGlydHlEcmF3YWJsZXNbIHJlcGxhY2VtZW50SW5kZXggXSA9IGRyYXdhYmxlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXBsYWNlbWVudEluZGV4Kys7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGluc3BlY3Rpb25JbmRleCsrO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE91ciBhcnJheSBzaG91bGQgYmUgb25seSB0aGF0IGxlbmd0aCBub3dcclxuICAgIHdoaWxlICggdGhpcy5kaXJ0eURyYXdhYmxlcy5sZW5ndGggPiByZXBsYWNlbWVudEluZGV4ICkge1xyXG4gICAgICB0aGlzLmRpcnR5RHJhd2FibGVzLnBvcCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuYXJlUmVmZXJlbmNlc1JlZHVjZWQgPSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVsZWFzZXMgcmVmZXJlbmNlc1xyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICBkaXNwb3NlKCkge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLlNWR0Jsb2NrICYmIHNjZW5lcnlMb2cuU1ZHQmxvY2soIGBkaXNwb3NlICMke3RoaXMuaWR9YCApO1xyXG5cclxuICAgIC8vIG1ha2UgaXQgdGFrZSB1cCB6ZXJvIGFyZWEsIHNvIHRoYXQgd2UgZG9uJ3QgdXNlIHVwIGV4Y2VzcyBtZW1vcnlcclxuICAgIHRoaXMuc3ZnLnNldEF0dHJpYnV0ZSggJ3dpZHRoJywgJzAnICk7XHJcbiAgICB0aGlzLnN2Zy5zZXRBdHRyaWJ1dGUoICdoZWlnaHQnLCAnMCcgKTtcclxuXHJcbiAgICAvLyBjbGVhciByZWZlcmVuY2VzXHJcbiAgICB0aGlzLmZpbHRlclJvb3RJbnN0YW5jZSA9IG51bGw7XHJcblxyXG4gICAgY2xlYW5BcnJheSggdGhpcy5kaXJ0eUdyYWRpZW50cyApO1xyXG4gICAgY2xlYW5BcnJheSggdGhpcy5kaXJ0eUdyb3VwcyApO1xyXG4gICAgY2xlYW5BcnJheSggdGhpcy5kaXJ0eURyYXdhYmxlcyApO1xyXG5cclxuICAgIHRoaXMucGFpbnRDb3VudE1hcC5jbGVhcigpO1xyXG5cclxuICAgIHRoaXMuZGlzcGxheS5fcmVmcmVzaFNWR0VtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoIHRoaXMuZm9yY2VSZWZyZXNoTGlzdGVuZXIgKTtcclxuXHJcbiAgICB0aGlzLmJhc2VUcmFuc2Zvcm1Hcm91cC5yZW1vdmVDaGlsZCggdGhpcy5yb290R3JvdXAuc3ZnR3JvdXAgKTtcclxuICAgIHRoaXMucm9vdEdyb3VwLmRpc3Bvc2UoKTtcclxuICAgIHRoaXMucm9vdEdyb3VwID0gbnVsbDtcclxuXHJcbiAgICAvLyBzaW5jZSB3ZSBtYXkgbm90IHByb3Blcmx5IHJlbW92ZSBhbGwgZGVmcyB5ZXRcclxuICAgIHdoaWxlICggdGhpcy5kZWZzLmNoaWxkTm9kZXMubGVuZ3RoICkge1xyXG4gICAgICB0aGlzLmRlZnMucmVtb3ZlQ2hpbGQoIHRoaXMuZGVmcy5jaGlsZE5vZGVzWyAwIF0gKTtcclxuICAgIH1cclxuXHJcbiAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICogQG92ZXJyaWRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0RyYXdhYmxlfSBkcmF3YWJsZVxyXG4gICAqL1xyXG4gIGFkZERyYXdhYmxlKCBkcmF3YWJsZSApIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5TVkdCbG9jayAmJiBzY2VuZXJ5TG9nLlNWR0Jsb2NrKCBgIyR7dGhpcy5pZH0uYWRkRHJhd2FibGUgJHtkcmF3YWJsZS50b1N0cmluZygpfWAgKTtcclxuXHJcbiAgICBzdXBlci5hZGREcmF3YWJsZSggZHJhd2FibGUgKTtcclxuXHJcbiAgICBTVkdHcm91cC5hZGREcmF3YWJsZSggdGhpcywgZHJhd2FibGUgKTtcclxuICAgIGRyYXdhYmxlLnVwZGF0ZVNWR0Jsb2NrKCB0aGlzICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICogQG92ZXJyaWRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0RyYXdhYmxlfSBkcmF3YWJsZVxyXG4gICAqL1xyXG4gIHJlbW92ZURyYXdhYmxlKCBkcmF3YWJsZSApIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5TVkdCbG9jayAmJiBzY2VuZXJ5TG9nLlNWR0Jsb2NrKCBgIyR7dGhpcy5pZH0ucmVtb3ZlRHJhd2FibGUgJHtkcmF3YWJsZS50b1N0cmluZygpfWAgKTtcclxuXHJcbiAgICBTVkdHcm91cC5yZW1vdmVEcmF3YWJsZSggdGhpcywgZHJhd2FibGUgKTtcclxuXHJcbiAgICBzdXBlci5yZW1vdmVEcmF3YWJsZSggZHJhd2FibGUgKTtcclxuXHJcbiAgICAvLyBOT1RFOiB3ZSBkb24ndCB1bnNldCB0aGUgZHJhd2FibGUncyBkZWZzIGhlcmUsIHNpbmNlIGl0IHdpbGwgZWl0aGVyIGJlIGRpc3Bvc2VkICh3aWxsIGNsZWFyIGl0KVxyXG4gICAgLy8gb3Igd2lsbCBiZSBhZGRlZCB0byBhbm90aGVyIFNWR0Jsb2NrICh3aGljaCB3aWxsIG92ZXJ3cml0ZSBpdClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKiBAb3ZlcnJpZGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7RHJhd2FibGV9IGZpcnN0RHJhd2FibGVcclxuICAgKiBAcGFyYW0ge0RyYXdhYmxlfSBsYXN0RHJhd2FibGVcclxuICAgKi9cclxuICBvbkludGVydmFsQ2hhbmdlKCBmaXJzdERyYXdhYmxlLCBsYXN0RHJhd2FibGUgKSB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuU1ZHQmxvY2sgJiYgc2NlbmVyeUxvZy5TVkdCbG9jayggYCMke3RoaXMuaWR9Lm9uSW50ZXJ2YWxDaGFuZ2UgJHtmaXJzdERyYXdhYmxlLnRvU3RyaW5nKCl9IHRvICR7bGFzdERyYXdhYmxlLnRvU3RyaW5nKCl9YCApO1xyXG5cclxuICAgIHN1cGVyLm9uSW50ZXJ2YWxDaGFuZ2UoIGZpcnN0RHJhd2FibGUsIGxhc3REcmF3YWJsZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHN0cmluZyBmb3JtIG9mIHRoaXMgb2JqZWN0XHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgKi9cclxuICB0b1N0cmluZygpIHtcclxuICAgIHJldHVybiBgU1ZHQmxvY2sjJHt0aGlzLmlkfS0ke0ZpdHRlZEJsb2NrLmZpdFN0cmluZ1sgdGhpcy5maXQgXX1gO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ1NWR0Jsb2NrJywgU1ZHQmxvY2sgKTtcclxuXHJcblBvb2xhYmxlLm1peElu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