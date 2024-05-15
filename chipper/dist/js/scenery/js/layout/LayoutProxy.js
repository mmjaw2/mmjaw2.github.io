// Copyright 2022-2024, University of Colorado Boulder

/**
 * A stand-in for the layout-based fields of a Node, but where everything is done in the coordinate frame of the
 * "root" of the Trail. It is a pooled object, so it can be reused to avoid memory issues.
 *
 * NOTE: For layout, these trails usually have the "root" Node equal to the children of the layout constraint's ancestor
 * Node. Therefore, the coordinate space is typically the local coordinate frame of the ancestorNode of the
 * LayoutConstraint. This is not the same as the "global" coordinates for a Scenery Node in general (as most of the root
 * nodes of the trails provided to LayoutProxy will have parents!)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Orientation from '../../../phet-core/js/Orientation.js';
import Pool from '../../../phet-core/js/Pool.js';
import { isHeightSizable, isWidthSizable, scenery } from '../imports.js';
export default class LayoutProxy {
  // Nulled out when disposed

  /**
   * @param trail - The wrapped Node is the leaf-most node, but coordinates will be handled in the global frame
   * of the trail itself.
   */
  constructor(trail) {
    this.initialize(trail);
  }

  /**
   * This is where the logic of a poolable type's "initializer" will go. It will be potentially run MULTIPLE times,
   * as if it was constructing multiple different objects. It will be put back in the pool with dispose().
   * It will go through cycles of:
   * - constructor(...) => initialize(...) --- only at the start
   * - dispose()
   * - initialize(...)
   * - dispose()
   * - initialize(...)
   * - dispose()
   * and so on.
   *
   * DO not call it twice without in-between disposals (follow the above pattern).
   */
  initialize(trail) {
    this.trail = trail;
    return this;
  }
  checkPreconditions() {
    assert && assert(this.trail, 'Should not be disposed');
    assert && assert(this.trail.getParentMatrix().isAxisAligned(), 'Transforms with LayoutProxy need to be axis-aligned');
  }
  get node() {
    assert && this.checkPreconditions();
    return this.trail.lastNode();
  }

  /**
   * Returns the bounds of the last node in the trail, but in the root coordinate frame.
   */
  get bounds() {
    assert && this.checkPreconditions();
    return this.trail.parentToGlobalBounds(this.node.bounds);
  }

  /**
   * Returns the visibleBounds of the last node in the trail, but in the root coordinate frame.
   */
  get visibleBounds() {
    assert && this.checkPreconditions();
    return this.trail.parentToGlobalBounds(this.node.visibleBounds);
  }

  /**
   * Returns the width of the last node in the trail, but in the root coordinate frame.
   */
  get width() {
    return this.bounds.width;
  }

  /**
   * Returns the height of the last node in the trail, but in the root coordinate frame.
   */
  get height() {
    return this.bounds.height;
  }

  /**
   * Returns the x of the last node in the trail, but in the root coordinate frame.
   */
  get x() {
    assert && this.checkPreconditions();
    return this.trail.getParentTransform().transformX(this.node.x);
  }

  /**
   * Sets the x of the last node in the trail, but in the root coordinate frame.
   */
  set x(value) {
    assert && this.checkPreconditions();
    this.node.x = this.trail.getParentTransform().inverseX(value);
  }

  /**
   * Returns the y of the last node in the trail, but in the root coordinate frame.
   */
  get y() {
    assert && this.checkPreconditions();
    return this.trail.getParentTransform().transformY(this.node.y);
  }

  /**
   * Sets the y of the last node in the trail, but in the root coordinate frame.
   */
  set y(value) {
    assert && this.checkPreconditions();
    this.node.y = this.trail.getParentTransform().inverseY(value);
  }

  /**
   * Returns the translation of the last node in the trail, but in the root coordinate frame.
   */
  get translation() {
    assert && this.checkPreconditions();
    return this.trail.getParentTransform().transformPosition2(this.node.translation);
  }

  /**
   * Sets the translation of the last node in the trail, but in the root coordinate frame.
   */
  set translation(value) {
    assert && this.checkPreconditions();
    this.node.translation = this.trail.getParentTransform().inversePosition2(value);
  }

  /**
   * Returns the left of the last node in the trail, but in the root coordinate frame.
   */
  get left() {
    assert && this.checkPreconditions();
    return this.trail.getParentTransform().transformX(this.node.left);
  }

  /**
   * Sets the left of the last node in the trail, but in the root coordinate frame.
   */
  set left(value) {
    this.node.left = this.trail.getParentTransform().inverseX(value);
  }

  /**
   * Returns the right of the last node in the trail, but in the root coordinate frame.
   */
  get right() {
    assert && this.checkPreconditions();
    return this.trail.getParentTransform().transformX(this.node.right);
  }

  /**
   * Sets the right of the last node in the trail, but in the root coordinate frame.
   */
  set right(value) {
    assert && this.checkPreconditions();
    this.node.right = this.trail.getParentTransform().inverseX(value);
  }

  /**
   * Returns the centerX of the last node in the trail, but in the root coordinate frame.
   */
  get centerX() {
    assert && this.checkPreconditions();
    return this.trail.getParentTransform().transformX(this.node.centerX);
  }

  /**
   * Sets the centerX of the last node in the trail, but in the root coordinate frame.
   */
  set centerX(value) {
    assert && this.checkPreconditions();
    this.node.centerX = this.trail.getParentTransform().inverseX(value);
  }

  /**
   * Returns the top of the last node in the trail, but in the root coordinate frame.
   */
  get top() {
    assert && this.checkPreconditions();
    return this.trail.getParentTransform().transformY(this.node.top);
  }

  /**
   * Sets the top of the last node in the trail, but in the root coordinate frame.
   */
  set top(value) {
    assert && this.checkPreconditions();
    this.node.top = this.trail.getParentTransform().inverseY(value);
  }

  /**
   * Returns the bottom of the last node in the trail, but in the root coordinate frame.
   */
  get bottom() {
    assert && this.checkPreconditions();
    return this.trail.getParentTransform().transformY(this.node.bottom);
  }

  /**
   * Sets the bottom of the last node in the trail, but in the root coordinate frame.
   */
  set bottom(value) {
    assert && this.checkPreconditions();
    this.node.bottom = this.trail.getParentTransform().inverseY(value);
  }

  /**
   * Returns the centerY of the last node in the trail, but in the root coordinate frame.
   */
  get centerY() {
    assert && this.checkPreconditions();
    return this.trail.getParentTransform().transformY(this.node.centerY);
  }

  /**
   * Sets the centerY of the last node in the trail, but in the root coordinate frame.
   */
  set centerY(value) {
    assert && this.checkPreconditions();
    this.node.centerY = this.trail.getParentTransform().inverseY(value);
  }

  /**
   * Returns the leftTop of the last node in the trail, but in the root coordinate frame.
   */
  get leftTop() {
    assert && this.checkPreconditions();
    return this.trail.getParentTransform().transformPosition2(this.node.leftTop);
  }

  /**
   * Sets the leftTop of the last node in the trail, but in the root coordinate frame.
   */
  set leftTop(value) {
    assert && this.checkPreconditions();
    this.node.leftTop = this.trail.getParentTransform().inversePosition2(value);
  }

  /**
   * Returns the centerTop of the last node in the trail, but in the root coordinate frame.
   */
  get centerTop() {
    assert && this.checkPreconditions();
    return this.trail.getParentTransform().transformPosition2(this.node.centerTop);
  }

  /**
   * Sets the centerTop of the last node in the trail, but in the root coordinate frame.
   */
  set centerTop(value) {
    assert && this.checkPreconditions();
    this.node.centerTop = this.trail.getParentTransform().inversePosition2(value);
  }

  /**
   * Returns the rightTop of the last node in the trail, but in the root coordinate frame.
   */
  get rightTop() {
    assert && this.checkPreconditions();
    return this.trail.getParentTransform().transformPosition2(this.node.rightTop);
  }

  /**
   * Sets the rightTop of the last node in the trail, but in the root coordinate frame.
   */
  set rightTop(value) {
    assert && this.checkPreconditions();
    this.node.rightTop = this.trail.getParentTransform().inversePosition2(value);
  }

  /**
   * Returns the leftCenter of the last node in the trail, but in the root coordinate frame.
   */
  get leftCenter() {
    assert && this.checkPreconditions();
    return this.trail.getParentTransform().transformPosition2(this.node.leftCenter);
  }

  /**
   * Sets the leftCenter of the last node in the trail, but in the root coordinate frame.
   */
  set leftCenter(value) {
    assert && this.checkPreconditions();
    this.node.leftCenter = this.trail.getParentTransform().inversePosition2(value);
  }

  /**
   * Returns the center of the last node in the trail, but in the root coordinate frame.
   */
  get center() {
    assert && this.checkPreconditions();
    return this.trail.getParentTransform().transformPosition2(this.node.center);
  }

  /**
   * Sets the center of the last node in the trail, but in the root coordinate frame.
   */
  set center(value) {
    assert && this.checkPreconditions();
    this.node.center = this.trail.getParentTransform().inversePosition2(value);
  }

  /**
   * Returns the rightCenter of the last node in the trail, but in the root coordinate frame.
   */
  get rightCenter() {
    assert && this.checkPreconditions();
    return this.trail.getParentTransform().transformPosition2(this.node.rightCenter);
  }

  /**
   * Sets the rightCenter of the last node in the trail, but in the root coordinate frame.
   */
  set rightCenter(value) {
    assert && this.checkPreconditions();
    this.node.rightCenter = this.trail.getParentTransform().inversePosition2(value);
  }

  /**
   * Returns the leftBottom of the last node in the trail, but in the root coordinate frame.
   */
  get leftBottom() {
    assert && this.checkPreconditions();
    return this.trail.getParentTransform().transformPosition2(this.node.leftBottom);
  }

  /**
   * Sets the leftBottom of the last node in the trail, but in the root coordinate frame.
   */
  set leftBottom(value) {
    assert && this.checkPreconditions();
    this.node.leftBottom = this.trail.getParentTransform().inversePosition2(value);
  }

  /**
   * Returns the centerBottom of the last node in the trail, but in the root coordinate frame.
   */
  get centerBottom() {
    assert && this.checkPreconditions();
    return this.trail.getParentTransform().transformPosition2(this.node.centerBottom);
  }

  /**
   * Sets the centerBottom of the last node in the trail, but in the root coordinate frame.
   */
  set centerBottom(value) {
    assert && this.checkPreconditions();
    this.node.centerBottom = this.trail.getParentTransform().inversePosition2(value);
  }

  /**
   * Returns the rightBottom of the last node in the trail, but in the root coordinate frame.
   */
  get rightBottom() {
    assert && this.checkPreconditions();
    return this.trail.getParentTransform().transformPosition2(this.node.rightBottom);
  }

  /**
   * Sets the rightBottom of the last node in the trail, but in the root coordinate frame.
   */
  set rightBottom(value) {
    assert && this.checkPreconditions();
    this.node.rightBottom = this.trail.getParentTransform().inversePosition2(value);
  }
  get widthSizable() {
    return this.node.widthSizable;
  }
  get heightSizable() {
    return this.node.heightSizable;
  }
  get preferredWidth() {
    assert && this.checkPreconditions();
    assert && assert(isWidthSizable(this.node));
    const preferredWidth = this.node.preferredWidth;
    return preferredWidth === null ? null : Math.abs(this.trail.getParentTransform().transformDeltaX(preferredWidth));
  }
  set preferredWidth(preferredWidth) {
    assert && this.checkPreconditions();
    assert && assert(isWidthSizable(this.node));
    this.node.preferredWidth = preferredWidth === null ? null : Math.abs(this.trail.getParentTransform().inverseDeltaX(preferredWidth));
  }
  get preferredHeight() {
    assert && this.checkPreconditions();
    assert && assert(isHeightSizable(this.node));
    const preferredHeight = this.node.preferredHeight;
    return preferredHeight === null ? null : Math.abs(this.trail.getParentTransform().transformDeltaY(preferredHeight));
  }
  set preferredHeight(preferredHeight) {
    assert && this.checkPreconditions();
    assert && assert(isHeightSizable(this.node));
    this.node.preferredHeight = preferredHeight === null ? null : Math.abs(this.trail.getParentTransform().inverseDeltaY(preferredHeight));
  }
  get minimumWidth() {
    assert && this.checkPreconditions();
    const minimumWidth = isWidthSizable(this.node) ? this.node.minimumWidth || 0 : this.node.width;
    return Math.abs(this.trail.getParentTransform().transformDeltaX(minimumWidth));
  }
  get minimumHeight() {
    assert && this.checkPreconditions();
    const minimumHeight = isHeightSizable(this.node) ? this.node.minimumHeight || 0 : this.node.height;
    return Math.abs(this.trail.getParentTransform().transformDeltaY(minimumHeight));
  }
  getMinimum(orientation) {
    return orientation === Orientation.HORIZONTAL ? this.minimumWidth : this.minimumHeight;
  }
  get maxWidth() {
    assert && this.checkPreconditions();
    if (this.node.maxWidth === null) {
      return null;
    } else {
      return Math.abs(this.trail.getParentTransform().transformDeltaX(this.node.maxWidth));
    }
  }
  set maxWidth(value) {
    assert && this.checkPreconditions();
    this.node.maxWidth = value === null ? null : Math.abs(this.trail.getParentTransform().inverseDeltaX(value));
  }
  get maxHeight() {
    assert && this.checkPreconditions();
    if (this.node.maxHeight === null) {
      return null;
    } else {
      return Math.abs(this.trail.getParentTransform().transformDeltaY(this.node.maxHeight));
    }
  }
  set maxHeight(value) {
    assert && this.checkPreconditions();
    this.node.maxHeight = value === null ? null : Math.abs(this.trail.getParentTransform().inverseDeltaY(value));
  }

  /**
   * Returns either the maxWidth or maxHeight depending on the orientation
   */
  getMax(orientation) {
    return orientation === Orientation.HORIZONTAL ? this.maxWidth : this.maxHeight;
  }
  get visible() {
    return this.node.visible;
  }
  set visible(value) {
    this.node.visible = value;
  }

  /**
   * Releases references, and frees it to the pool.
   */
  dispose() {
    this.trail = null;
    this.freeToPool();
  }
  freeToPool() {
    LayoutProxy.pool.freeToPool(this);
  }
  static pool = new Pool(LayoutProxy, {
    maxSize: 1000
  });
}
scenery.register('LayoutProxy', LayoutProxy);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJPcmllbnRhdGlvbiIsIlBvb2wiLCJpc0hlaWdodFNpemFibGUiLCJpc1dpZHRoU2l6YWJsZSIsInNjZW5lcnkiLCJMYXlvdXRQcm94eSIsImNvbnN0cnVjdG9yIiwidHJhaWwiLCJpbml0aWFsaXplIiwiY2hlY2tQcmVjb25kaXRpb25zIiwiYXNzZXJ0IiwiZ2V0UGFyZW50TWF0cml4IiwiaXNBeGlzQWxpZ25lZCIsIm5vZGUiLCJsYXN0Tm9kZSIsImJvdW5kcyIsInBhcmVudFRvR2xvYmFsQm91bmRzIiwidmlzaWJsZUJvdW5kcyIsIndpZHRoIiwiaGVpZ2h0IiwieCIsImdldFBhcmVudFRyYW5zZm9ybSIsInRyYW5zZm9ybVgiLCJ2YWx1ZSIsImludmVyc2VYIiwieSIsInRyYW5zZm9ybVkiLCJpbnZlcnNlWSIsInRyYW5zbGF0aW9uIiwidHJhbnNmb3JtUG9zaXRpb24yIiwiaW52ZXJzZVBvc2l0aW9uMiIsImxlZnQiLCJyaWdodCIsImNlbnRlclgiLCJ0b3AiLCJib3R0b20iLCJjZW50ZXJZIiwibGVmdFRvcCIsImNlbnRlclRvcCIsInJpZ2h0VG9wIiwibGVmdENlbnRlciIsImNlbnRlciIsInJpZ2h0Q2VudGVyIiwibGVmdEJvdHRvbSIsImNlbnRlckJvdHRvbSIsInJpZ2h0Qm90dG9tIiwid2lkdGhTaXphYmxlIiwiaGVpZ2h0U2l6YWJsZSIsInByZWZlcnJlZFdpZHRoIiwiTWF0aCIsImFicyIsInRyYW5zZm9ybURlbHRhWCIsImludmVyc2VEZWx0YVgiLCJwcmVmZXJyZWRIZWlnaHQiLCJ0cmFuc2Zvcm1EZWx0YVkiLCJpbnZlcnNlRGVsdGFZIiwibWluaW11bVdpZHRoIiwibWluaW11bUhlaWdodCIsImdldE1pbmltdW0iLCJvcmllbnRhdGlvbiIsIkhPUklaT05UQUwiLCJtYXhXaWR0aCIsIm1heEhlaWdodCIsImdldE1heCIsInZpc2libGUiLCJkaXNwb3NlIiwiZnJlZVRvUG9vbCIsInBvb2wiLCJtYXhTaXplIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJMYXlvdXRQcm94eS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBIHN0YW5kLWluIGZvciB0aGUgbGF5b3V0LWJhc2VkIGZpZWxkcyBvZiBhIE5vZGUsIGJ1dCB3aGVyZSBldmVyeXRoaW5nIGlzIGRvbmUgaW4gdGhlIGNvb3JkaW5hdGUgZnJhbWUgb2YgdGhlXHJcbiAqIFwicm9vdFwiIG9mIHRoZSBUcmFpbC4gSXQgaXMgYSBwb29sZWQgb2JqZWN0LCBzbyBpdCBjYW4gYmUgcmV1c2VkIHRvIGF2b2lkIG1lbW9yeSBpc3N1ZXMuXHJcbiAqXHJcbiAqIE5PVEU6IEZvciBsYXlvdXQsIHRoZXNlIHRyYWlscyB1c3VhbGx5IGhhdmUgdGhlIFwicm9vdFwiIE5vZGUgZXF1YWwgdG8gdGhlIGNoaWxkcmVuIG9mIHRoZSBsYXlvdXQgY29uc3RyYWludCdzIGFuY2VzdG9yXHJcbiAqIE5vZGUuIFRoZXJlZm9yZSwgdGhlIGNvb3JkaW5hdGUgc3BhY2UgaXMgdHlwaWNhbGx5IHRoZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lIG9mIHRoZSBhbmNlc3Rvck5vZGUgb2YgdGhlXHJcbiAqIExheW91dENvbnN0cmFpbnQuIFRoaXMgaXMgbm90IHRoZSBzYW1lIGFzIHRoZSBcImdsb2JhbFwiIGNvb3JkaW5hdGVzIGZvciBhIFNjZW5lcnkgTm9kZSBpbiBnZW5lcmFsIChhcyBtb3N0IG9mIHRoZSByb290XHJcbiAqIG5vZGVzIG9mIHRoZSB0cmFpbHMgcHJvdmlkZWQgdG8gTGF5b3V0UHJveHkgd2lsbCBoYXZlIHBhcmVudHMhKVxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IEJvdW5kczIgZnJvbSAnLi4vLi4vLi4vZG90L2pzL0JvdW5kczIuanMnO1xyXG5pbXBvcnQgVmVjdG9yMiBmcm9tICcuLi8uLi8uLi9kb3QvanMvVmVjdG9yMi5qcyc7XHJcbmltcG9ydCBPcmllbnRhdGlvbiBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvT3JpZW50YXRpb24uanMnO1xyXG5pbXBvcnQgUG9vbCBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvUG9vbC5qcyc7XHJcbmltcG9ydCB7IEhlaWdodFNpemFibGVOb2RlLCBpc0hlaWdodFNpemFibGUsIGlzV2lkdGhTaXphYmxlLCBOb2RlLCBzY2VuZXJ5LCBUcmFpbCwgV2lkdGhTaXphYmxlTm9kZSB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGF5b3V0UHJveHkge1xyXG5cclxuICAvLyBOdWxsZWQgb3V0IHdoZW4gZGlzcG9zZWRcclxuICBwdWJsaWMgdHJhaWwhOiBUcmFpbCB8IG51bGw7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSB0cmFpbCAtIFRoZSB3cmFwcGVkIE5vZGUgaXMgdGhlIGxlYWYtbW9zdCBub2RlLCBidXQgY29vcmRpbmF0ZXMgd2lsbCBiZSBoYW5kbGVkIGluIHRoZSBnbG9iYWwgZnJhbWVcclxuICAgKiBvZiB0aGUgdHJhaWwgaXRzZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggdHJhaWw6IFRyYWlsICkge1xyXG4gICAgdGhpcy5pbml0aWFsaXplKCB0cmFpbCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhpcyBpcyB3aGVyZSB0aGUgbG9naWMgb2YgYSBwb29sYWJsZSB0eXBlJ3MgXCJpbml0aWFsaXplclwiIHdpbGwgZ28uIEl0IHdpbGwgYmUgcG90ZW50aWFsbHkgcnVuIE1VTFRJUExFIHRpbWVzLFxyXG4gICAqIGFzIGlmIGl0IHdhcyBjb25zdHJ1Y3RpbmcgbXVsdGlwbGUgZGlmZmVyZW50IG9iamVjdHMuIEl0IHdpbGwgYmUgcHV0IGJhY2sgaW4gdGhlIHBvb2wgd2l0aCBkaXNwb3NlKCkuXHJcbiAgICogSXQgd2lsbCBnbyB0aHJvdWdoIGN5Y2xlcyBvZjpcclxuICAgKiAtIGNvbnN0cnVjdG9yKC4uLikgPT4gaW5pdGlhbGl6ZSguLi4pIC0tLSBvbmx5IGF0IHRoZSBzdGFydFxyXG4gICAqIC0gZGlzcG9zZSgpXHJcbiAgICogLSBpbml0aWFsaXplKC4uLilcclxuICAgKiAtIGRpc3Bvc2UoKVxyXG4gICAqIC0gaW5pdGlhbGl6ZSguLi4pXHJcbiAgICogLSBkaXNwb3NlKClcclxuICAgKiBhbmQgc28gb24uXHJcbiAgICpcclxuICAgKiBETyBub3QgY2FsbCBpdCB0d2ljZSB3aXRob3V0IGluLWJldHdlZW4gZGlzcG9zYWxzIChmb2xsb3cgdGhlIGFib3ZlIHBhdHRlcm4pLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbml0aWFsaXplKCB0cmFpbDogVHJhaWwgKTogdGhpcyB7XHJcbiAgICB0aGlzLnRyYWlsID0gdHJhaWw7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGNoZWNrUHJlY29uZGl0aW9ucygpOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMudHJhaWwsICdTaG91bGQgbm90IGJlIGRpc3Bvc2VkJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy50cmFpbCEuZ2V0UGFyZW50TWF0cml4KCkuaXNBeGlzQWxpZ25lZCgpLCAnVHJhbnNmb3JtcyB3aXRoIExheW91dFByb3h5IG5lZWQgdG8gYmUgYXhpcy1hbGlnbmVkJyApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBub2RlKCk6IE5vZGUge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMudHJhaWwhLmxhc3ROb2RlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBib3VuZHMgb2YgdGhlIGxhc3Qgbm9kZSBpbiB0aGUgdHJhaWwsIGJ1dCBpbiB0aGUgcm9vdCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgYm91bmRzKCk6IEJvdW5kczIge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMudHJhaWwhLnBhcmVudFRvR2xvYmFsQm91bmRzKCB0aGlzLm5vZGUuYm91bmRzICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB2aXNpYmxlQm91bmRzIG9mIHRoZSBsYXN0IG5vZGUgaW4gdGhlIHRyYWlsLCBidXQgaW4gdGhlIHJvb3QgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IHZpc2libGVCb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICBhc3NlcnQgJiYgdGhpcy5jaGVja1ByZWNvbmRpdGlvbnMoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy50cmFpbCEucGFyZW50VG9HbG9iYWxCb3VuZHMoIHRoaXMubm9kZS52aXNpYmxlQm91bmRzICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB3aWR0aCBvZiB0aGUgbGFzdCBub2RlIGluIHRoZSB0cmFpbCwgYnV0IGluIHRoZSByb290IGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldCB3aWR0aCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuYm91bmRzLndpZHRoO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgaGVpZ2h0IG9mIHRoZSBsYXN0IG5vZGUgaW4gdGhlIHRyYWlsLCBidXQgaW4gdGhlIHJvb3QgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGhlaWdodCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuYm91bmRzLmhlaWdodDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHggb2YgdGhlIGxhc3Qgbm9kZSBpbiB0aGUgdHJhaWwsIGJ1dCBpbiB0aGUgcm9vdCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgeCgpOiBudW1iZXIge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMudHJhaWwhLmdldFBhcmVudFRyYW5zZm9ybSgpLnRyYW5zZm9ybVgoIHRoaXMubm9kZS54ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB4IG9mIHRoZSBsYXN0IG5vZGUgaW4gdGhlIHRyYWlsLCBidXQgaW4gdGhlIHJvb3QgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IHgoIHZhbHVlOiBudW1iZXIgKSB7XHJcbiAgICBhc3NlcnQgJiYgdGhpcy5jaGVja1ByZWNvbmRpdGlvbnMoKTtcclxuXHJcbiAgICB0aGlzLm5vZGUueCA9IHRoaXMudHJhaWwhLmdldFBhcmVudFRyYW5zZm9ybSgpLmludmVyc2VYKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgeSBvZiB0aGUgbGFzdCBub2RlIGluIHRoZSB0cmFpbCwgYnV0IGluIHRoZSByb290IGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldCB5KCk6IG51bWJlciB7XHJcbiAgICBhc3NlcnQgJiYgdGhpcy5jaGVja1ByZWNvbmRpdGlvbnMoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy50cmFpbCEuZ2V0UGFyZW50VHJhbnNmb3JtKCkudHJhbnNmb3JtWSggdGhpcy5ub2RlLnkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHkgb2YgdGhlIGxhc3Qgbm9kZSBpbiB0aGUgdHJhaWwsIGJ1dCBpbiB0aGUgcm9vdCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgeSggdmFsdWU6IG51bWJlciApIHtcclxuICAgIGFzc2VydCAmJiB0aGlzLmNoZWNrUHJlY29uZGl0aW9ucygpO1xyXG5cclxuICAgIHRoaXMubm9kZS55ID0gdGhpcy50cmFpbCEuZ2V0UGFyZW50VHJhbnNmb3JtKCkuaW52ZXJzZVkoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB0cmFuc2xhdGlvbiBvZiB0aGUgbGFzdCBub2RlIGluIHRoZSB0cmFpbCwgYnV0IGluIHRoZSByb290IGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldCB0cmFuc2xhdGlvbigpOiBWZWN0b3IyIHtcclxuICAgIGFzc2VydCAmJiB0aGlzLmNoZWNrUHJlY29uZGl0aW9ucygpO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS50cmFuc2Zvcm1Qb3NpdGlvbjIoIHRoaXMubm9kZS50cmFuc2xhdGlvbiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgdHJhbnNsYXRpb24gb2YgdGhlIGxhc3Qgbm9kZSBpbiB0aGUgdHJhaWwsIGJ1dCBpbiB0aGUgcm9vdCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgdHJhbnNsYXRpb24oIHZhbHVlOiBWZWN0b3IyICkge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcblxyXG4gICAgdGhpcy5ub2RlLnRyYW5zbGF0aW9uID0gdGhpcy50cmFpbCEuZ2V0UGFyZW50VHJhbnNmb3JtKCkuaW52ZXJzZVBvc2l0aW9uMiggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGxlZnQgb2YgdGhlIGxhc3Qgbm9kZSBpbiB0aGUgdHJhaWwsIGJ1dCBpbiB0aGUgcm9vdCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgbGVmdCgpOiBudW1iZXIge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMudHJhaWwhLmdldFBhcmVudFRyYW5zZm9ybSgpLnRyYW5zZm9ybVgoIHRoaXMubm9kZS5sZWZ0ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBsZWZ0IG9mIHRoZSBsYXN0IG5vZGUgaW4gdGhlIHRyYWlsLCBidXQgaW4gdGhlIHJvb3QgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGxlZnQoIHZhbHVlOiBudW1iZXIgKSB7XHJcbiAgICB0aGlzLm5vZGUubGVmdCA9IHRoaXMudHJhaWwhLmdldFBhcmVudFRyYW5zZm9ybSgpLmludmVyc2VYKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgcmlnaHQgb2YgdGhlIGxhc3Qgbm9kZSBpbiB0aGUgdHJhaWwsIGJ1dCBpbiB0aGUgcm9vdCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgcmlnaHQoKTogbnVtYmVyIHtcclxuICAgIGFzc2VydCAmJiB0aGlzLmNoZWNrUHJlY29uZGl0aW9ucygpO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS50cmFuc2Zvcm1YKCB0aGlzLm5vZGUucmlnaHQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHJpZ2h0IG9mIHRoZSBsYXN0IG5vZGUgaW4gdGhlIHRyYWlsLCBidXQgaW4gdGhlIHJvb3QgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IHJpZ2h0KCB2YWx1ZTogbnVtYmVyICkge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcblxyXG4gICAgdGhpcy5ub2RlLnJpZ2h0ID0gdGhpcy50cmFpbCEuZ2V0UGFyZW50VHJhbnNmb3JtKCkuaW52ZXJzZVgoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjZW50ZXJYIG9mIHRoZSBsYXN0IG5vZGUgaW4gdGhlIHRyYWlsLCBidXQgaW4gdGhlIHJvb3QgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGNlbnRlclgoKTogbnVtYmVyIHtcclxuICAgIGFzc2VydCAmJiB0aGlzLmNoZWNrUHJlY29uZGl0aW9ucygpO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS50cmFuc2Zvcm1YKCB0aGlzLm5vZGUuY2VudGVyWCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgY2VudGVyWCBvZiB0aGUgbGFzdCBub2RlIGluIHRoZSB0cmFpbCwgYnV0IGluIHRoZSByb290IGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBjZW50ZXJYKCB2YWx1ZTogbnVtYmVyICkge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcblxyXG4gICAgdGhpcy5ub2RlLmNlbnRlclggPSB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS5pbnZlcnNlWCggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHRvcCBvZiB0aGUgbGFzdCBub2RlIGluIHRoZSB0cmFpbCwgYnV0IGluIHRoZSByb290IGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldCB0b3AoKTogbnVtYmVyIHtcclxuICAgIGFzc2VydCAmJiB0aGlzLmNoZWNrUHJlY29uZGl0aW9ucygpO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS50cmFuc2Zvcm1ZKCB0aGlzLm5vZGUudG9wICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB0b3Agb2YgdGhlIGxhc3Qgbm9kZSBpbiB0aGUgdHJhaWwsIGJ1dCBpbiB0aGUgcm9vdCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgdG9wKCB2YWx1ZTogbnVtYmVyICkge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcblxyXG4gICAgdGhpcy5ub2RlLnRvcCA9IHRoaXMudHJhaWwhLmdldFBhcmVudFRyYW5zZm9ybSgpLmludmVyc2VZKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYm90dG9tIG9mIHRoZSBsYXN0IG5vZGUgaW4gdGhlIHRyYWlsLCBidXQgaW4gdGhlIHJvb3QgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGJvdHRvbSgpOiBudW1iZXIge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMudHJhaWwhLmdldFBhcmVudFRyYW5zZm9ybSgpLnRyYW5zZm9ybVkoIHRoaXMubm9kZS5ib3R0b20gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGJvdHRvbSBvZiB0aGUgbGFzdCBub2RlIGluIHRoZSB0cmFpbCwgYnV0IGluIHRoZSByb290IGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBib3R0b20oIHZhbHVlOiBudW1iZXIgKSB7XHJcbiAgICBhc3NlcnQgJiYgdGhpcy5jaGVja1ByZWNvbmRpdGlvbnMoKTtcclxuXHJcbiAgICB0aGlzLm5vZGUuYm90dG9tID0gdGhpcy50cmFpbCEuZ2V0UGFyZW50VHJhbnNmb3JtKCkuaW52ZXJzZVkoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjZW50ZXJZIG9mIHRoZSBsYXN0IG5vZGUgaW4gdGhlIHRyYWlsLCBidXQgaW4gdGhlIHJvb3QgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGNlbnRlclkoKTogbnVtYmVyIHtcclxuICAgIGFzc2VydCAmJiB0aGlzLmNoZWNrUHJlY29uZGl0aW9ucygpO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS50cmFuc2Zvcm1ZKCB0aGlzLm5vZGUuY2VudGVyWSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgY2VudGVyWSBvZiB0aGUgbGFzdCBub2RlIGluIHRoZSB0cmFpbCwgYnV0IGluIHRoZSByb290IGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBjZW50ZXJZKCB2YWx1ZTogbnVtYmVyICkge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcblxyXG4gICAgdGhpcy5ub2RlLmNlbnRlclkgPSB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS5pbnZlcnNlWSggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGxlZnRUb3Agb2YgdGhlIGxhc3Qgbm9kZSBpbiB0aGUgdHJhaWwsIGJ1dCBpbiB0aGUgcm9vdCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgbGVmdFRvcCgpOiBWZWN0b3IyIHtcclxuICAgIGFzc2VydCAmJiB0aGlzLmNoZWNrUHJlY29uZGl0aW9ucygpO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS50cmFuc2Zvcm1Qb3NpdGlvbjIoIHRoaXMubm9kZS5sZWZ0VG9wICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBsZWZ0VG9wIG9mIHRoZSBsYXN0IG5vZGUgaW4gdGhlIHRyYWlsLCBidXQgaW4gdGhlIHJvb3QgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGxlZnRUb3AoIHZhbHVlOiBWZWN0b3IyICkge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcblxyXG4gICAgdGhpcy5ub2RlLmxlZnRUb3AgPSB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS5pbnZlcnNlUG9zaXRpb24yKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY2VudGVyVG9wIG9mIHRoZSBsYXN0IG5vZGUgaW4gdGhlIHRyYWlsLCBidXQgaW4gdGhlIHJvb3QgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGNlbnRlclRvcCgpOiBWZWN0b3IyIHtcclxuICAgIGFzc2VydCAmJiB0aGlzLmNoZWNrUHJlY29uZGl0aW9ucygpO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS50cmFuc2Zvcm1Qb3NpdGlvbjIoIHRoaXMubm9kZS5jZW50ZXJUb3AgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGNlbnRlclRvcCBvZiB0aGUgbGFzdCBub2RlIGluIHRoZSB0cmFpbCwgYnV0IGluIHRoZSByb290IGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBjZW50ZXJUb3AoIHZhbHVlOiBWZWN0b3IyICkge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcblxyXG4gICAgdGhpcy5ub2RlLmNlbnRlclRvcCA9IHRoaXMudHJhaWwhLmdldFBhcmVudFRyYW5zZm9ybSgpLmludmVyc2VQb3NpdGlvbjIoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSByaWdodFRvcCBvZiB0aGUgbGFzdCBub2RlIGluIHRoZSB0cmFpbCwgYnV0IGluIHRoZSByb290IGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldCByaWdodFRvcCgpOiBWZWN0b3IyIHtcclxuICAgIGFzc2VydCAmJiB0aGlzLmNoZWNrUHJlY29uZGl0aW9ucygpO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS50cmFuc2Zvcm1Qb3NpdGlvbjIoIHRoaXMubm9kZS5yaWdodFRvcCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgcmlnaHRUb3Agb2YgdGhlIGxhc3Qgbm9kZSBpbiB0aGUgdHJhaWwsIGJ1dCBpbiB0aGUgcm9vdCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgcmlnaHRUb3AoIHZhbHVlOiBWZWN0b3IyICkge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcblxyXG4gICAgdGhpcy5ub2RlLnJpZ2h0VG9wID0gdGhpcy50cmFpbCEuZ2V0UGFyZW50VHJhbnNmb3JtKCkuaW52ZXJzZVBvc2l0aW9uMiggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGxlZnRDZW50ZXIgb2YgdGhlIGxhc3Qgbm9kZSBpbiB0aGUgdHJhaWwsIGJ1dCBpbiB0aGUgcm9vdCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgbGVmdENlbnRlcigpOiBWZWN0b3IyIHtcclxuICAgIGFzc2VydCAmJiB0aGlzLmNoZWNrUHJlY29uZGl0aW9ucygpO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS50cmFuc2Zvcm1Qb3NpdGlvbjIoIHRoaXMubm9kZS5sZWZ0Q2VudGVyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBsZWZ0Q2VudGVyIG9mIHRoZSBsYXN0IG5vZGUgaW4gdGhlIHRyYWlsLCBidXQgaW4gdGhlIHJvb3QgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGxlZnRDZW50ZXIoIHZhbHVlOiBWZWN0b3IyICkge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcblxyXG4gICAgdGhpcy5ub2RlLmxlZnRDZW50ZXIgPSB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS5pbnZlcnNlUG9zaXRpb24yKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY2VudGVyIG9mIHRoZSBsYXN0IG5vZGUgaW4gdGhlIHRyYWlsLCBidXQgaW4gdGhlIHJvb3QgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGNlbnRlcigpOiBWZWN0b3IyIHtcclxuICAgIGFzc2VydCAmJiB0aGlzLmNoZWNrUHJlY29uZGl0aW9ucygpO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS50cmFuc2Zvcm1Qb3NpdGlvbjIoIHRoaXMubm9kZS5jZW50ZXIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGNlbnRlciBvZiB0aGUgbGFzdCBub2RlIGluIHRoZSB0cmFpbCwgYnV0IGluIHRoZSByb290IGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBjZW50ZXIoIHZhbHVlOiBWZWN0b3IyICkge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcblxyXG4gICAgdGhpcy5ub2RlLmNlbnRlciA9IHRoaXMudHJhaWwhLmdldFBhcmVudFRyYW5zZm9ybSgpLmludmVyc2VQb3NpdGlvbjIoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSByaWdodENlbnRlciBvZiB0aGUgbGFzdCBub2RlIGluIHRoZSB0cmFpbCwgYnV0IGluIHRoZSByb290IGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldCByaWdodENlbnRlcigpOiBWZWN0b3IyIHtcclxuICAgIGFzc2VydCAmJiB0aGlzLmNoZWNrUHJlY29uZGl0aW9ucygpO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS50cmFuc2Zvcm1Qb3NpdGlvbjIoIHRoaXMubm9kZS5yaWdodENlbnRlciApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgcmlnaHRDZW50ZXIgb2YgdGhlIGxhc3Qgbm9kZSBpbiB0aGUgdHJhaWwsIGJ1dCBpbiB0aGUgcm9vdCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgcmlnaHRDZW50ZXIoIHZhbHVlOiBWZWN0b3IyICkge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcblxyXG4gICAgdGhpcy5ub2RlLnJpZ2h0Q2VudGVyID0gdGhpcy50cmFpbCEuZ2V0UGFyZW50VHJhbnNmb3JtKCkuaW52ZXJzZVBvc2l0aW9uMiggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGxlZnRCb3R0b20gb2YgdGhlIGxhc3Qgbm9kZSBpbiB0aGUgdHJhaWwsIGJ1dCBpbiB0aGUgcm9vdCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgbGVmdEJvdHRvbSgpOiBWZWN0b3IyIHtcclxuICAgIGFzc2VydCAmJiB0aGlzLmNoZWNrUHJlY29uZGl0aW9ucygpO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS50cmFuc2Zvcm1Qb3NpdGlvbjIoIHRoaXMubm9kZS5sZWZ0Qm90dG9tICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBsZWZ0Qm90dG9tIG9mIHRoZSBsYXN0IG5vZGUgaW4gdGhlIHRyYWlsLCBidXQgaW4gdGhlIHJvb3QgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGxlZnRCb3R0b20oIHZhbHVlOiBWZWN0b3IyICkge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcblxyXG4gICAgdGhpcy5ub2RlLmxlZnRCb3R0b20gPSB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS5pbnZlcnNlUG9zaXRpb24yKCB2YWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY2VudGVyQm90dG9tIG9mIHRoZSBsYXN0IG5vZGUgaW4gdGhlIHRyYWlsLCBidXQgaW4gdGhlIHJvb3QgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGNlbnRlckJvdHRvbSgpOiBWZWN0b3IyIHtcclxuICAgIGFzc2VydCAmJiB0aGlzLmNoZWNrUHJlY29uZGl0aW9ucygpO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS50cmFuc2Zvcm1Qb3NpdGlvbjIoIHRoaXMubm9kZS5jZW50ZXJCb3R0b20gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGNlbnRlckJvdHRvbSBvZiB0aGUgbGFzdCBub2RlIGluIHRoZSB0cmFpbCwgYnV0IGluIHRoZSByb290IGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICovXHJcbiAgcHVibGljIHNldCBjZW50ZXJCb3R0b20oIHZhbHVlOiBWZWN0b3IyICkge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcblxyXG4gICAgdGhpcy5ub2RlLmNlbnRlckJvdHRvbSA9IHRoaXMudHJhaWwhLmdldFBhcmVudFRyYW5zZm9ybSgpLmludmVyc2VQb3NpdGlvbjIoIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSByaWdodEJvdHRvbSBvZiB0aGUgbGFzdCBub2RlIGluIHRoZSB0cmFpbCwgYnV0IGluIHRoZSByb290IGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldCByaWdodEJvdHRvbSgpOiBWZWN0b3IyIHtcclxuICAgIGFzc2VydCAmJiB0aGlzLmNoZWNrUHJlY29uZGl0aW9ucygpO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS50cmFuc2Zvcm1Qb3NpdGlvbjIoIHRoaXMubm9kZS5yaWdodEJvdHRvbSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgcmlnaHRCb3R0b20gb2YgdGhlIGxhc3Qgbm9kZSBpbiB0aGUgdHJhaWwsIGJ1dCBpbiB0aGUgcm9vdCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXQgcmlnaHRCb3R0b20oIHZhbHVlOiBWZWN0b3IyICkge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcblxyXG4gICAgdGhpcy5ub2RlLnJpZ2h0Qm90dG9tID0gdGhpcy50cmFpbCEuZ2V0UGFyZW50VHJhbnNmb3JtKCkuaW52ZXJzZVBvc2l0aW9uMiggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgd2lkdGhTaXphYmxlKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMubm9kZS53aWR0aFNpemFibGU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGhlaWdodFNpemFibGUoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5ub2RlLmhlaWdodFNpemFibGU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHByZWZlcnJlZFdpZHRoKCk6IG51bWJlciB8IG51bGwge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc1dpZHRoU2l6YWJsZSggdGhpcy5ub2RlICkgKTtcclxuXHJcbiAgICBjb25zdCBwcmVmZXJyZWRXaWR0aCA9ICggdGhpcy5ub2RlIGFzIFdpZHRoU2l6YWJsZU5vZGUgKS5wcmVmZXJyZWRXaWR0aDtcclxuXHJcbiAgICByZXR1cm4gcHJlZmVycmVkV2lkdGggPT09IG51bGwgPyBudWxsIDogTWF0aC5hYnMoIHRoaXMudHJhaWwhLmdldFBhcmVudFRyYW5zZm9ybSgpLnRyYW5zZm9ybURlbHRhWCggcHJlZmVycmVkV2lkdGggKSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBwcmVmZXJyZWRXaWR0aCggcHJlZmVycmVkV2lkdGg6IG51bWJlciB8IG51bGwgKSB7XHJcbiAgICBhc3NlcnQgJiYgdGhpcy5jaGVja1ByZWNvbmRpdGlvbnMoKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzV2lkdGhTaXphYmxlKCB0aGlzLm5vZGUgKSApO1xyXG5cclxuICAgICggdGhpcy5ub2RlIGFzIFdpZHRoU2l6YWJsZU5vZGUgKS5wcmVmZXJyZWRXaWR0aCA9IHByZWZlcnJlZFdpZHRoID09PSBudWxsID8gbnVsbCA6IE1hdGguYWJzKCB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS5pbnZlcnNlRGVsdGFYKCBwcmVmZXJyZWRXaWR0aCApICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHByZWZlcnJlZEhlaWdodCgpOiBudW1iZXIgfCBudWxsIHtcclxuICAgIGFzc2VydCAmJiB0aGlzLmNoZWNrUHJlY29uZGl0aW9ucygpO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNIZWlnaHRTaXphYmxlKCB0aGlzLm5vZGUgKSApO1xyXG5cclxuICAgIGNvbnN0IHByZWZlcnJlZEhlaWdodCA9ICggdGhpcy5ub2RlIGFzIEhlaWdodFNpemFibGVOb2RlICkucHJlZmVycmVkSGVpZ2h0O1xyXG5cclxuICAgIHJldHVybiBwcmVmZXJyZWRIZWlnaHQgPT09IG51bGwgPyBudWxsIDogTWF0aC5hYnMoIHRoaXMudHJhaWwhLmdldFBhcmVudFRyYW5zZm9ybSgpLnRyYW5zZm9ybURlbHRhWSggcHJlZmVycmVkSGVpZ2h0ICkgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgcHJlZmVycmVkSGVpZ2h0KCBwcmVmZXJyZWRIZWlnaHQ6IG51bWJlciB8IG51bGwgKSB7XHJcbiAgICBhc3NlcnQgJiYgdGhpcy5jaGVja1ByZWNvbmRpdGlvbnMoKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzSGVpZ2h0U2l6YWJsZSggdGhpcy5ub2RlICkgKTtcclxuXHJcbiAgICAoIHRoaXMubm9kZSBhcyBIZWlnaHRTaXphYmxlTm9kZSApLnByZWZlcnJlZEhlaWdodCA9IHByZWZlcnJlZEhlaWdodCA9PT0gbnVsbCA/IG51bGwgOiBNYXRoLmFicyggdGhpcy50cmFpbCEuZ2V0UGFyZW50VHJhbnNmb3JtKCkuaW52ZXJzZURlbHRhWSggcHJlZmVycmVkSGVpZ2h0ICkgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgbWluaW11bVdpZHRoKCk6IG51bWJlciB7XHJcbiAgICBhc3NlcnQgJiYgdGhpcy5jaGVja1ByZWNvbmRpdGlvbnMoKTtcclxuXHJcbiAgICBjb25zdCBtaW5pbXVtV2lkdGggPSBpc1dpZHRoU2l6YWJsZSggdGhpcy5ub2RlICkgPyB0aGlzLm5vZGUubWluaW11bVdpZHRoIHx8IDAgOiB0aGlzLm5vZGUud2lkdGg7XHJcblxyXG4gICAgcmV0dXJuIE1hdGguYWJzKCB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS50cmFuc2Zvcm1EZWx0YVgoIG1pbmltdW1XaWR0aCApICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IG1pbmltdW1IZWlnaHQoKTogbnVtYmVyIHtcclxuICAgIGFzc2VydCAmJiB0aGlzLmNoZWNrUHJlY29uZGl0aW9ucygpO1xyXG5cclxuICAgIGNvbnN0IG1pbmltdW1IZWlnaHQgPSBpc0hlaWdodFNpemFibGUoIHRoaXMubm9kZSApID8gdGhpcy5ub2RlLm1pbmltdW1IZWlnaHQgfHwgMCA6IHRoaXMubm9kZS5oZWlnaHQ7XHJcblxyXG4gICAgcmV0dXJuIE1hdGguYWJzKCB0aGlzLnRyYWlsIS5nZXRQYXJlbnRUcmFuc2Zvcm0oKS50cmFuc2Zvcm1EZWx0YVkoIG1pbmltdW1IZWlnaHQgKSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldE1pbmltdW0oIG9yaWVudGF0aW9uOiBPcmllbnRhdGlvbiApOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIG9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5IT1JJWk9OVEFMID8gdGhpcy5taW5pbXVtV2lkdGggOiB0aGlzLm1pbmltdW1IZWlnaHQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IG1heFdpZHRoKCk6IG51bWJlciB8IG51bGwge1xyXG4gICAgYXNzZXJ0ICYmIHRoaXMuY2hlY2tQcmVjb25kaXRpb25zKCk7XHJcblxyXG4gICAgaWYgKCB0aGlzLm5vZGUubWF4V2lkdGggPT09IG51bGwgKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBNYXRoLmFicyggdGhpcy50cmFpbCEuZ2V0UGFyZW50VHJhbnNmb3JtKCkudHJhbnNmb3JtRGVsdGFYKCB0aGlzLm5vZGUubWF4V2lkdGggKSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBtYXhXaWR0aCggdmFsdWU6IG51bWJlciB8IG51bGwgKSB7XHJcbiAgICBhc3NlcnQgJiYgdGhpcy5jaGVja1ByZWNvbmRpdGlvbnMoKTtcclxuXHJcbiAgICB0aGlzLm5vZGUubWF4V2lkdGggPSB2YWx1ZSA9PT0gbnVsbCA/IG51bGwgOiBNYXRoLmFicyggdGhpcy50cmFpbCEuZ2V0UGFyZW50VHJhbnNmb3JtKCkuaW52ZXJzZURlbHRhWCggdmFsdWUgKSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBtYXhIZWlnaHQoKTogbnVtYmVyIHwgbnVsbCB7XHJcbiAgICBhc3NlcnQgJiYgdGhpcy5jaGVja1ByZWNvbmRpdGlvbnMoKTtcclxuXHJcbiAgICBpZiAoIHRoaXMubm9kZS5tYXhIZWlnaHQgPT09IG51bGwgKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBNYXRoLmFicyggdGhpcy50cmFpbCEuZ2V0UGFyZW50VHJhbnNmb3JtKCkudHJhbnNmb3JtRGVsdGFZKCB0aGlzLm5vZGUubWF4SGVpZ2h0ICkgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgbWF4SGVpZ2h0KCB2YWx1ZTogbnVtYmVyIHwgbnVsbCApIHtcclxuICAgIGFzc2VydCAmJiB0aGlzLmNoZWNrUHJlY29uZGl0aW9ucygpO1xyXG5cclxuICAgIHRoaXMubm9kZS5tYXhIZWlnaHQgPSB2YWx1ZSA9PT0gbnVsbCA/IG51bGwgOiBNYXRoLmFicyggdGhpcy50cmFpbCEuZ2V0UGFyZW50VHJhbnNmb3JtKCkuaW52ZXJzZURlbHRhWSggdmFsdWUgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBlaXRoZXIgdGhlIG1heFdpZHRoIG9yIG1heEhlaWdodCBkZXBlbmRpbmcgb24gdGhlIG9yaWVudGF0aW9uXHJcbiAgICovXHJcbiAgcHVibGljIGdldE1heCggb3JpZW50YXRpb246IE9yaWVudGF0aW9uICk6IG51bWJlciB8IG51bGwge1xyXG4gICAgcmV0dXJuIG9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5IT1JJWk9OVEFMID8gdGhpcy5tYXhXaWR0aCA6IHRoaXMubWF4SGVpZ2h0O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCB2aXNpYmxlKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMubm9kZS52aXNpYmxlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCB2aXNpYmxlKCB2YWx1ZTogYm9vbGVhbiApIHtcclxuICAgIHRoaXMubm9kZS52aXNpYmxlID0gdmFsdWU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWxlYXNlcyByZWZlcmVuY2VzLCBhbmQgZnJlZXMgaXQgdG8gdGhlIHBvb2wuXHJcbiAgICovXHJcbiAgcHVibGljIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLnRyYWlsID0gbnVsbDtcclxuXHJcbiAgICB0aGlzLmZyZWVUb1Bvb2woKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBmcmVlVG9Qb29sKCk6IHZvaWQge1xyXG4gICAgTGF5b3V0UHJveHkucG9vbC5mcmVlVG9Qb29sKCB0aGlzICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IHBvb2wgPSBuZXcgUG9vbCggTGF5b3V0UHJveHksIHtcclxuICAgIG1heFNpemU6IDEwMDBcclxuICB9ICk7XHJcbn1cclxuXHJcbnNjZW5lcnkucmVnaXN0ZXIoICdMYXlvdXRQcm94eScsIExheW91dFByb3h5ICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUlBLE9BQU9BLFdBQVcsTUFBTSxzQ0FBc0M7QUFDOUQsT0FBT0MsSUFBSSxNQUFNLCtCQUErQjtBQUNoRCxTQUE0QkMsZUFBZSxFQUFFQyxjQUFjLEVBQVFDLE9BQU8sUUFBaUMsZUFBZTtBQUUxSCxlQUFlLE1BQU1DLFdBQVcsQ0FBQztFQUUvQjs7RUFHQTtBQUNGO0FBQ0E7QUFDQTtFQUNTQyxXQUFXQSxDQUFFQyxLQUFZLEVBQUc7SUFDakMsSUFBSSxDQUFDQyxVQUFVLENBQUVELEtBQU0sQ0FBQztFQUMxQjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1NDLFVBQVVBLENBQUVELEtBQVksRUFBUztJQUN0QyxJQUFJLENBQUNBLEtBQUssR0FBR0EsS0FBSztJQUVsQixPQUFPLElBQUk7RUFDYjtFQUVRRSxrQkFBa0JBLENBQUEsRUFBUztJQUNqQ0MsTUFBTSxJQUFJQSxN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