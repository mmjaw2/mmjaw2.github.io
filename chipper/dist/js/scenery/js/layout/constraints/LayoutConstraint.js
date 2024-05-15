// Copyright 2021-2024, University of Colorado Boulder

/**
 * Abstract supertype for layout constraints. Provides a lot of assistance to layout handling, including adding/removing
 * listeners, and reentrancy detection/loop prevention.
 *
 * We'll also handle reentrancy somewhat specially. If code tries to enter a layout reentrantly (while a layout is
 * already executing), we'll instead IGNORE this second one (and set a flag). Once our first layout is done, we'll
 * attempt to run the layout again. In case the subtype needs to lock multiple times (if a layout is FORCED), we have
 * an integer count of how many "layout" calls we're in (_layoutLockCount). Once this reaches zero, we're effectively
 * unlocked and not inside any layout calls.
 *
 * NOTE: This can still trigger infinite loops nominally (if every layout call triggers another layout call), but we
 * have a practical assertion limit that will stop this and flag it as an error.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import TinyEmitter from '../../../../axon/js/TinyEmitter.js';
import { extendsHeightSizable, extendsWidthSizable, LayoutProxy, scenery } from '../../imports.js';
export default class LayoutConstraint {
  // The Node in whose local coordinate frame our layout computations are done.

  // Prevents layout() from running while greater than zero. Generally will be unlocked and laid out.
  // See the documentation at the top of the file for more on reentrancy.
  _layoutLockCount = 0;

  // Whether there was a layout attempt during the lock
  _layoutAttemptDuringLock = false;

  // When we are disabled (say, a layout container has resize:false), we won't automatically do layout
  _enabled = true;
  // Track Nodes we're listening to (for memory cleanup purposes)
  _listenedNodes = new Set();

  // (scenery-internal) - emits when we've finished layout
  finishedLayoutEmitter = new TinyEmitter();

  /**
   * (scenery-internal)
   */
  constructor(ancestorNode) {
    this.ancestorNode = ancestorNode;
    this._updateLayoutListener = this.updateLayoutAutomatically.bind(this);
  }

  /**
   * Adds listeners to a Node, so that our layout updates will happen if this Node's Properties
   * (bounds/visibility/minimum size) change. Will be cleared on disposal of this type.
   * (scenery-internal)
   *
   * @param node
   * @param addLock - If true, we'll mark the node as having this layout constraint as responsible for its layout.
   * It will be an assertion failure if another layout container tries to lock the same node (so that we don't run into
   * infinite loops where multiple constraints try to move a node back-and-forth).
   * See Node's _activeParentLayoutConstraint for more information.
   */
  addNode(node, addLock = true) {
    assert && assert(!this._listenedNodes.has(node));
    assert && assert(!addLock || !node._activeParentLayoutConstraint, 'This node is already managed by a layout container - make sure to wrap it in a Node if DAG, removing it from an old layout container, etc.');
    if (addLock) {
      node._activeParentLayoutConstraint = this;
    }
    node.boundsProperty.lazyLink(this._updateLayoutListener);
    node.visibleProperty.lazyLink(this._updateLayoutListener);
    if (extendsWidthSizable(node)) {
      node.minimumWidthProperty.lazyLink(this._updateLayoutListener);
      node.isWidthResizableProperty.lazyLink(this._updateLayoutListener);
    }
    if (extendsHeightSizable(node)) {
      node.minimumHeightProperty.lazyLink(this._updateLayoutListener);
      node.isHeightResizableProperty.lazyLink(this._updateLayoutListener);
    }
    this._listenedNodes.add(node);
  }

  /**
   * (scenery-internal)
   */
  removeNode(node) {
    assert && assert(this._listenedNodes.has(node));

    // Optional, since we might not have added the "lock" in addNode
    if (node._activeParentLayoutConstraint === this) {
      node._activeParentLayoutConstraint = null;
    }
    node.boundsProperty.unlink(this._updateLayoutListener);
    node.visibleProperty.unlink(this._updateLayoutListener);
    if (extendsWidthSizable(node)) {
      node.minimumWidthProperty.unlink(this._updateLayoutListener);
      node.isWidthResizableProperty.unlink(this._updateLayoutListener);
    }
    if (extendsHeightSizable(node)) {
      node.minimumHeightProperty.unlink(this._updateLayoutListener);
      node.isHeightResizableProperty.unlink(this._updateLayoutListener);
    }
    this._listenedNodes.delete(node);
  }

  /**
   * NOTE: DO NOT call from places other than super.layout() in overridden layout() OR from the existing call in
   *       updateLayout(). Doing so would break the lock mechanism.
   * NOTE: Cannot be marked as abstract due to how mixins work
   */
  layout() {
    // See subclass for implementation
  }

  /**
   * (scenery-internal)
   */
  get isLocked() {
    return this._layoutLockCount > 0;
  }

  /**
   * Locks the layout, so that automatic layout will NOT be triggered synchronously until unlock() is called and
   * the lock count returns to 0. This is set up so that if we trigger multiple reentrancy, we will only attempt to
   * re-layout once ALL of the layouts are finished.
   * (scenery-internal)
   */
  lock() {
    this._layoutLockCount++;
  }

  /**
   * Unlocks the layout. Generally (but not always), updateLayout() or updateLayoutAutomatically() should be called
   * after this, as locks are generally used for this purpose.
   * (scenery-internal)
   */
  unlock() {
    this._layoutLockCount--;
  }

  /**
   * Here for manual validation (say, in the devtools) - While some layouts are going on, this may not be correct, so it
   * could not be added to post-layout validation.
   * (scenery-internal)
   */
  validateLocalPreferredWidth(layoutContainer) {
    if (assert && layoutContainer.localBounds.isFinite() && !this._layoutAttemptDuringLock) {
      layoutContainer.validateLocalPreferredWidth();
    }
  }

  /**
   * Here for manual validation (say, in the devtools) - While some layouts are going on, this may not be correct, so it
   * could not be added to post-layout validation.
   * (scenery-internal)
   */
  validateLocalPreferredHeight(layoutContainer) {
    if (assert && layoutContainer.localBounds.isFinite() && !this._layoutAttemptDuringLock) {
      layoutContainer.validateLocalPreferredHeight();
    }
  }

  /**
   * Here for manual validation (say, in the devtools) - While some layouts are going on, this may not be correct, so it
   * could not be added to post-layout validation.
   * (scenery-internal)
   */
  validateLocalPreferredSize(layoutContainer) {
    if (assert && layoutContainer.localBounds.isFinite() && !this._layoutAttemptDuringLock) {
      layoutContainer.validateLocalPreferredSize();
    }
  }

  /**
   * Updates the layout of this constraint. Called automatically during initialization, when children change (if
   * resize is true), or when client wants to call this public method for any reason.
   */
  updateLayout() {
    let count = 0;

    // If we're locked AND someone tries to do layout, record this so we can attempt layout once we are not locked
    // anymore. We have some infinite-loop detection here for common development errors.
    if (this.isLocked) {
      assert && count++;
      assert && assert(++count < 500, 'Likely infinite loop detected, are we triggering layout within the layout?');
      this._layoutAttemptDuringLock = true;
    } else {
      this.lock();

      // Run layout until we didn't get a layout attempt during our last attempt. This component's layout should now
      // be correct and stable.
      do {
        this._layoutAttemptDuringLock = false;
        this.layout();
      }
      // If we got any layout attempts during the lock, we'll want to rerun the layout
      while (this._layoutAttemptDuringLock);
      this.unlock();
    }
  }

  /**
   * Called when we attempt to automatically layout components. (scenery-internal)
   */
  updateLayoutAutomatically() {
    if (this._enabled) {
      this.updateLayout();
    }
  }

  /**
   * Creates a LayoutProxy for a unique trail from our ancestorNode to this Node (or null if that's not possible)
   * (scenery-internal)
   */
  createLayoutProxy(node) {
    const trails = node.getTrails(n => n === this.ancestorNode);
    if (trails.length === 1) {
      return LayoutProxy.pool.create(trails[0].removeAncestor());
    } else {
      return null;
    }
  }
  get enabled() {
    return this._enabled;
  }
  set enabled(value) {
    if (this._enabled !== value) {
      this._enabled = value;
      this.updateLayoutAutomatically();
    }
  }

  /**
   * Releases references
   */
  dispose() {
    // Clean up listeners to any listened nodes
    const listenedNodes = [...this._listenedNodes.keys()];
    for (let i = 0; i < listenedNodes.length; i++) {
      this.removeNode(listenedNodes[i]);
    }
    this.finishedLayoutEmitter.dispose();
  }
}
scenery.register('LayoutConstraint', LayoutConstraint);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUaW55RW1pdHRlciIsImV4dGVuZHNIZWlnaHRTaXphYmxlIiwiZXh0ZW5kc1dpZHRoU2l6YWJsZSIsIkxheW91dFByb3h5Iiwic2NlbmVyeSIsIkxheW91dENvbnN0cmFpbnQiLCJfbGF5b3V0TG9ja0NvdW50IiwiX2xheW91dEF0dGVtcHREdXJpbmdMb2NrIiwiX2VuYWJsZWQiLCJfbGlzdGVuZWROb2RlcyIsIlNldCIsImZpbmlzaGVkTGF5b3V0RW1pdHRlciIsImNvbnN0cnVjdG9yIiwiYW5jZXN0b3JOb2RlIiwiX3VwZGF0ZUxheW91dExpc3RlbmVyIiwidXBkYXRlTGF5b3V0QXV0b21hdGljYWxseSIsImJpbmQiLCJhZGROb2RlIiwibm9kZSIsImFkZExvY2siLCJhc3NlcnQiLCJoYXMiLCJfYWN0aXZlUGFyZW50TGF5b3V0Q29uc3RyYWludCIsImJvdW5kc1Byb3BlcnR5IiwibGF6eUxpbmsiLCJ2aXNpYmxlUHJvcGVydHkiLCJtaW5pbXVtV2lkdGhQcm9wZXJ0eSIsImlzV2lkdGhSZXNpemFibGVQcm9wZXJ0eSIsIm1pbmltdW1IZWlnaHRQcm9wZXJ0eSIsImlzSGVpZ2h0UmVzaXphYmxlUHJvcGVydHkiLCJhZGQiLCJyZW1vdmVOb2RlIiwidW5saW5rIiwiZGVsZXRlIiwibGF5b3V0IiwiaXNMb2NrZWQiLCJsb2NrIiwidW5sb2NrIiwidmFsaWRhdGVMb2NhbFByZWZlcnJlZFdpZHRoIiwibGF5b3V0Q29udGFpbmVyIiwibG9jYWxCb3VuZHMiLCJpc0Zpbml0ZSIsInZhbGlkYXRlTG9jYWxQcmVmZXJyZWRIZWlnaHQiLCJ2YWxpZGF0ZUxvY2FsUHJlZmVycmVkU2l6ZSIsInVwZGF0ZUxheW91dCIsImNvdW50IiwiY3JlYXRlTGF5b3V0UHJveHkiLCJ0cmFpbHMiLCJnZXRUcmFpbHMiLCJuIiwibGVuZ3RoIiwicG9vbCIsImNyZWF0ZSIsInJlbW92ZUFuY2VzdG9yIiwiZW5hYmxlZCIsInZhbHVlIiwiZGlzcG9zZSIsImxpc3RlbmVkTm9kZXMiLCJrZXlzIiwiaSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiTGF5b3V0Q29uc3RyYWludC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMS0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBYnN0cmFjdCBzdXBlcnR5cGUgZm9yIGxheW91dCBjb25zdHJhaW50cy4gUHJvdmlkZXMgYSBsb3Qgb2YgYXNzaXN0YW5jZSB0byBsYXlvdXQgaGFuZGxpbmcsIGluY2x1ZGluZyBhZGRpbmcvcmVtb3ZpbmdcclxuICogbGlzdGVuZXJzLCBhbmQgcmVlbnRyYW5jeSBkZXRlY3Rpb24vbG9vcCBwcmV2ZW50aW9uLlxyXG4gKlxyXG4gKiBXZSdsbCBhbHNvIGhhbmRsZSByZWVudHJhbmN5IHNvbWV3aGF0IHNwZWNpYWxseS4gSWYgY29kZSB0cmllcyB0byBlbnRlciBhIGxheW91dCByZWVudHJhbnRseSAod2hpbGUgYSBsYXlvdXQgaXNcclxuICogYWxyZWFkeSBleGVjdXRpbmcpLCB3ZSdsbCBpbnN0ZWFkIElHTk9SRSB0aGlzIHNlY29uZCBvbmUgKGFuZCBzZXQgYSBmbGFnKS4gT25jZSBvdXIgZmlyc3QgbGF5b3V0IGlzIGRvbmUsIHdlJ2xsXHJcbiAqIGF0dGVtcHQgdG8gcnVuIHRoZSBsYXlvdXQgYWdhaW4uIEluIGNhc2UgdGhlIHN1YnR5cGUgbmVlZHMgdG8gbG9jayBtdWx0aXBsZSB0aW1lcyAoaWYgYSBsYXlvdXQgaXMgRk9SQ0VEKSwgd2UgaGF2ZVxyXG4gKiBhbiBpbnRlZ2VyIGNvdW50IG9mIGhvdyBtYW55IFwibGF5b3V0XCIgY2FsbHMgd2UncmUgaW4gKF9sYXlvdXRMb2NrQ291bnQpLiBPbmNlIHRoaXMgcmVhY2hlcyB6ZXJvLCB3ZSdyZSBlZmZlY3RpdmVseVxyXG4gKiB1bmxvY2tlZCBhbmQgbm90IGluc2lkZSBhbnkgbGF5b3V0IGNhbGxzLlxyXG4gKlxyXG4gKiBOT1RFOiBUaGlzIGNhbiBzdGlsbCB0cmlnZ2VyIGluZmluaXRlIGxvb3BzIG5vbWluYWxseSAoaWYgZXZlcnkgbGF5b3V0IGNhbGwgdHJpZ2dlcnMgYW5vdGhlciBsYXlvdXQgY2FsbCksIGJ1dCB3ZVxyXG4gKiBoYXZlIGEgcHJhY3RpY2FsIGFzc2VydGlvbiBsaW1pdCB0aGF0IHdpbGwgc3RvcCB0aGlzIGFuZCBmbGFnIGl0IGFzIGFuIGVycm9yLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IFRFbWl0dGVyIGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvVEVtaXR0ZXIuanMnO1xyXG5pbXBvcnQgVGlueUVtaXR0ZXIgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9UaW55RW1pdHRlci5qcyc7XHJcbmltcG9ydCB7IGV4dGVuZHNIZWlnaHRTaXphYmxlLCBleHRlbmRzV2lkdGhTaXphYmxlLCBIZWlnaHRTaXphYmxlTm9kZSwgTGF5b3V0UHJveHksIE5vZGUsIHNjZW5lcnksIFNpemFibGVOb2RlLCBXaWR0aFNpemFibGVOb2RlIH0gZnJvbSAnLi4vLi4vaW1wb3J0cy5qcyc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhYnN0cmFjdCBjbGFzcyBMYXlvdXRDb25zdHJhaW50IHtcclxuXHJcbiAgLy8gVGhlIE5vZGUgaW4gd2hvc2UgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSBvdXIgbGF5b3V0IGNvbXB1dGF0aW9ucyBhcmUgZG9uZS5cclxuICBwdWJsaWMgcmVhZG9ubHkgYW5jZXN0b3JOb2RlOiBOb2RlO1xyXG5cclxuICAvLyBQcmV2ZW50cyBsYXlvdXQoKSBmcm9tIHJ1bm5pbmcgd2hpbGUgZ3JlYXRlciB0aGFuIHplcm8uIEdlbmVyYWxseSB3aWxsIGJlIHVubG9ja2VkIGFuZCBsYWlkIG91dC5cclxuICAvLyBTZWUgdGhlIGRvY3VtZW50YXRpb24gYXQgdGhlIHRvcCBvZiB0aGUgZmlsZSBmb3IgbW9yZSBvbiByZWVudHJhbmN5LlxyXG4gIHByaXZhdGUgX2xheW91dExvY2tDb3VudCA9IDA7XHJcblxyXG4gIC8vIFdoZXRoZXIgdGhlcmUgd2FzIGEgbGF5b3V0IGF0dGVtcHQgZHVyaW5nIHRoZSBsb2NrXHJcbiAgcHJpdmF0ZSBfbGF5b3V0QXR0ZW1wdER1cmluZ0xvY2sgPSBmYWxzZTtcclxuXHJcbiAgLy8gV2hlbiB3ZSBhcmUgZGlzYWJsZWQgKHNheSwgYSBsYXlvdXQgY29udGFpbmVyIGhhcyByZXNpemU6ZmFsc2UpLCB3ZSB3b24ndCBhdXRvbWF0aWNhbGx5IGRvIGxheW91dFxyXG4gIHByaXZhdGUgX2VuYWJsZWQgPSB0cnVlO1xyXG5cclxuICBwcm90ZWN0ZWQgcmVhZG9ubHkgX3VwZGF0ZUxheW91dExpc3RlbmVyOiAoKSA9PiB2b2lkO1xyXG5cclxuICAvLyBUcmFjayBOb2RlcyB3ZSdyZSBsaXN0ZW5pbmcgdG8gKGZvciBtZW1vcnkgY2xlYW51cCBwdXJwb3NlcylcclxuICBwcml2YXRlIHJlYWRvbmx5IF9saXN0ZW5lZE5vZGVzOiBTZXQ8Tm9kZT4gPSBuZXcgU2V0PE5vZGU+KCk7XHJcblxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKSAtIGVtaXRzIHdoZW4gd2UndmUgZmluaXNoZWQgbGF5b3V0XHJcbiAgcHVibGljIHJlYWRvbmx5IGZpbmlzaGVkTGF5b3V0RW1pdHRlcjogVEVtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXIoKTtcclxuXHJcbiAgLyoqXHJcbiAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKCBhbmNlc3Rvck5vZGU6IE5vZGUgKSB7XHJcbiAgICB0aGlzLmFuY2VzdG9yTm9kZSA9IGFuY2VzdG9yTm9kZTtcclxuICAgIHRoaXMuX3VwZGF0ZUxheW91dExpc3RlbmVyID0gdGhpcy51cGRhdGVMYXlvdXRBdXRvbWF0aWNhbGx5LmJpbmQoIHRoaXMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgbGlzdGVuZXJzIHRvIGEgTm9kZSwgc28gdGhhdCBvdXIgbGF5b3V0IHVwZGF0ZXMgd2lsbCBoYXBwZW4gaWYgdGhpcyBOb2RlJ3MgUHJvcGVydGllc1xyXG4gICAqIChib3VuZHMvdmlzaWJpbGl0eS9taW5pbXVtIHNpemUpIGNoYW5nZS4gV2lsbCBiZSBjbGVhcmVkIG9uIGRpc3Bvc2FsIG9mIHRoaXMgdHlwZS5cclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKlxyXG4gICAqIEBwYXJhbSBub2RlXHJcbiAgICogQHBhcmFtIGFkZExvY2sgLSBJZiB0cnVlLCB3ZSdsbCBtYXJrIHRoZSBub2RlIGFzIGhhdmluZyB0aGlzIGxheW91dCBjb25zdHJhaW50IGFzIHJlc3BvbnNpYmxlIGZvciBpdHMgbGF5b3V0LlxyXG4gICAqIEl0IHdpbGwgYmUgYW4gYXNzZXJ0aW9uIGZhaWx1cmUgaWYgYW5vdGhlciBsYXlvdXQgY29udGFpbmVyIHRyaWVzIHRvIGxvY2sgdGhlIHNhbWUgbm9kZSAoc28gdGhhdCB3ZSBkb24ndCBydW4gaW50b1xyXG4gICAqIGluZmluaXRlIGxvb3BzIHdoZXJlIG11bHRpcGxlIGNvbnN0cmFpbnRzIHRyeSB0byBtb3ZlIGEgbm9kZSBiYWNrLWFuZC1mb3J0aCkuXHJcbiAgICogU2VlIE5vZGUncyBfYWN0aXZlUGFyZW50TGF5b3V0Q29uc3RyYWludCBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgYWRkTm9kZSggbm9kZTogTm9kZSwgYWRkTG9jayA9IHRydWUgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5fbGlzdGVuZWROb2Rlcy5oYXMoIG5vZGUgKSApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIWFkZExvY2sgfHwgIW5vZGUuX2FjdGl2ZVBhcmVudExheW91dENvbnN0cmFpbnQsICdUaGlzIG5vZGUgaXMgYWxyZWFkeSBtYW5hZ2VkIGJ5IGEgbGF5b3V0IGNvbnRhaW5lciAtIG1ha2Ugc3VyZSB0byB3cmFwIGl0IGluIGEgTm9kZSBpZiBEQUcsIHJlbW92aW5nIGl0IGZyb20gYW4gb2xkIGxheW91dCBjb250YWluZXIsIGV0Yy4nICk7XHJcblxyXG4gICAgaWYgKCBhZGRMb2NrICkge1xyXG4gICAgICBub2RlLl9hY3RpdmVQYXJlbnRMYXlvdXRDb25zdHJhaW50ID0gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBub2RlLmJvdW5kc1Byb3BlcnR5LmxhenlMaW5rKCB0aGlzLl91cGRhdGVMYXlvdXRMaXN0ZW5lciApO1xyXG4gICAgbm9kZS52aXNpYmxlUHJvcGVydHkubGF6eUxpbmsoIHRoaXMuX3VwZGF0ZUxheW91dExpc3RlbmVyICk7XHJcbiAgICBpZiAoIGV4dGVuZHNXaWR0aFNpemFibGUoIG5vZGUgKSApIHtcclxuICAgICAgbm9kZS5taW5pbXVtV2lkdGhQcm9wZXJ0eS5sYXp5TGluayggdGhpcy5fdXBkYXRlTGF5b3V0TGlzdGVuZXIgKTtcclxuICAgICAgbm9kZS5pc1dpZHRoUmVzaXphYmxlUHJvcGVydHkubGF6eUxpbmsoIHRoaXMuX3VwZGF0ZUxheW91dExpc3RlbmVyICk7XHJcbiAgICB9XHJcbiAgICBpZiAoIGV4dGVuZHNIZWlnaHRTaXphYmxlKCBub2RlICkgKSB7XHJcbiAgICAgIG5vZGUubWluaW11bUhlaWdodFByb3BlcnR5LmxhenlMaW5rKCB0aGlzLl91cGRhdGVMYXlvdXRMaXN0ZW5lciApO1xyXG4gICAgICBub2RlLmlzSGVpZ2h0UmVzaXphYmxlUHJvcGVydHkubGF6eUxpbmsoIHRoaXMuX3VwZGF0ZUxheW91dExpc3RlbmVyICk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fbGlzdGVuZWROb2Rlcy5hZGQoIG5vZGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyByZW1vdmVOb2RlKCBub2RlOiBOb2RlICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fbGlzdGVuZWROb2Rlcy5oYXMoIG5vZGUgKSApO1xyXG5cclxuICAgIC8vIE9wdGlvbmFsLCBzaW5jZSB3ZSBtaWdodCBub3QgaGF2ZSBhZGRlZCB0aGUgXCJsb2NrXCIgaW4gYWRkTm9kZVxyXG4gICAgaWYgKCBub2RlLl9hY3RpdmVQYXJlbnRMYXlvdXRDb25zdHJhaW50ID09PSB0aGlzICkge1xyXG4gICAgICBub2RlLl9hY3RpdmVQYXJlbnRMYXlvdXRDb25zdHJhaW50ID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBub2RlLmJvdW5kc1Byb3BlcnR5LnVubGluayggdGhpcy5fdXBkYXRlTGF5b3V0TGlzdGVuZXIgKTtcclxuICAgIG5vZGUudmlzaWJsZVByb3BlcnR5LnVubGluayggdGhpcy5fdXBkYXRlTGF5b3V0TGlzdGVuZXIgKTtcclxuICAgIGlmICggZXh0ZW5kc1dpZHRoU2l6YWJsZSggbm9kZSApICkge1xyXG4gICAgICBub2RlLm1pbmltdW1XaWR0aFByb3BlcnR5LnVubGluayggdGhpcy5fdXBkYXRlTGF5b3V0TGlzdGVuZXIgKTtcclxuICAgICAgbm9kZS5pc1dpZHRoUmVzaXphYmxlUHJvcGVydHkudW5saW5rKCB0aGlzLl91cGRhdGVMYXlvdXRMaXN0ZW5lciApO1xyXG4gICAgfVxyXG4gICAgaWYgKCBleHRlbmRzSGVpZ2h0U2l6YWJsZSggbm9kZSApICkge1xyXG4gICAgICBub2RlLm1pbmltdW1IZWlnaHRQcm9wZXJ0eS51bmxpbmsoIHRoaXMuX3VwZGF0ZUxheW91dExpc3RlbmVyICk7XHJcbiAgICAgIG5vZGUuaXNIZWlnaHRSZXNpemFibGVQcm9wZXJ0eS51bmxpbmsoIHRoaXMuX3VwZGF0ZUxheW91dExpc3RlbmVyICk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fbGlzdGVuZWROb2Rlcy5kZWxldGUoIG5vZGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE5PVEU6IERPIE5PVCBjYWxsIGZyb20gcGxhY2VzIG90aGVyIHRoYW4gc3VwZXIubGF5b3V0KCkgaW4gb3ZlcnJpZGRlbiBsYXlvdXQoKSBPUiBmcm9tIHRoZSBleGlzdGluZyBjYWxsIGluXHJcbiAgICogICAgICAgdXBkYXRlTGF5b3V0KCkuIERvaW5nIHNvIHdvdWxkIGJyZWFrIHRoZSBsb2NrIG1lY2hhbmlzbS5cclxuICAgKiBOT1RFOiBDYW5ub3QgYmUgbWFya2VkIGFzIGFic3RyYWN0IGR1ZSB0byBob3cgbWl4aW5zIHdvcmtcclxuICAgKi9cclxuICBwcm90ZWN0ZWQgbGF5b3V0KCk6IHZvaWQge1xyXG4gICAgLy8gU2VlIHN1YmNsYXNzIGZvciBpbXBsZW1lbnRhdGlvblxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBpc0xvY2tlZCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl9sYXlvdXRMb2NrQ291bnQgPiAwO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTG9ja3MgdGhlIGxheW91dCwgc28gdGhhdCBhdXRvbWF0aWMgbGF5b3V0IHdpbGwgTk9UIGJlIHRyaWdnZXJlZCBzeW5jaHJvbm91c2x5IHVudGlsIHVubG9jaygpIGlzIGNhbGxlZCBhbmRcclxuICAgKiB0aGUgbG9jayBjb3VudCByZXR1cm5zIHRvIDAuIFRoaXMgaXMgc2V0IHVwIHNvIHRoYXQgaWYgd2UgdHJpZ2dlciBtdWx0aXBsZSByZWVudHJhbmN5LCB3ZSB3aWxsIG9ubHkgYXR0ZW1wdCB0b1xyXG4gICAqIHJlLWxheW91dCBvbmNlIEFMTCBvZiB0aGUgbGF5b3V0cyBhcmUgZmluaXNoZWQuXHJcbiAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIGxvY2soKTogdm9pZCB7XHJcbiAgICB0aGlzLl9sYXlvdXRMb2NrQ291bnQrKztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVubG9ja3MgdGhlIGxheW91dC4gR2VuZXJhbGx5IChidXQgbm90IGFsd2F5cyksIHVwZGF0ZUxheW91dCgpIG9yIHVwZGF0ZUxheW91dEF1dG9tYXRpY2FsbHkoKSBzaG91bGQgYmUgY2FsbGVkXHJcbiAgICogYWZ0ZXIgdGhpcywgYXMgbG9ja3MgYXJlIGdlbmVyYWxseSB1c2VkIGZvciB0aGlzIHB1cnBvc2UuXHJcbiAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIHVubG9jaygpOiB2b2lkIHtcclxuICAgIHRoaXMuX2xheW91dExvY2tDb3VudC0tO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGVyZSBmb3IgbWFudWFsIHZhbGlkYXRpb24gKHNheSwgaW4gdGhlIGRldnRvb2xzKSAtIFdoaWxlIHNvbWUgbGF5b3V0cyBhcmUgZ29pbmcgb24sIHRoaXMgbWF5IG5vdCBiZSBjb3JyZWN0LCBzbyBpdFxyXG4gICAqIGNvdWxkIG5vdCBiZSBhZGRlZCB0byBwb3N0LWxheW91dCB2YWxpZGF0aW9uLlxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyB2YWxpZGF0ZUxvY2FsUHJlZmVycmVkV2lkdGgoIGxheW91dENvbnRhaW5lcjogV2lkdGhTaXphYmxlTm9kZSApOiB2b2lkIHtcclxuICAgIGlmICggYXNzZXJ0ICYmIGxheW91dENvbnRhaW5lci5sb2NhbEJvdW5kcy5pc0Zpbml0ZSgpICYmICF0aGlzLl9sYXlvdXRBdHRlbXB0RHVyaW5nTG9jayApIHtcclxuICAgICAgbGF5b3V0Q29udGFpbmVyLnZhbGlkYXRlTG9jYWxQcmVmZXJyZWRXaWR0aCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGVyZSBmb3IgbWFudWFsIHZhbGlkYXRpb24gKHNheSwgaW4gdGhlIGRldnRvb2xzKSAtIFdoaWxlIHNvbWUgbGF5b3V0cyBhcmUgZ29pbmcgb24sIHRoaXMgbWF5IG5vdCBiZSBjb3JyZWN0LCBzbyBpdFxyXG4gICAqIGNvdWxkIG5vdCBiZSBhZGRlZCB0byBwb3N0LWxheW91dCB2YWxpZGF0aW9uLlxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyB2YWxpZGF0ZUxvY2FsUHJlZmVycmVkSGVpZ2h0KCBsYXlvdXRDb250YWluZXI6IEhlaWdodFNpemFibGVOb2RlICk6IHZvaWQge1xyXG4gICAgaWYgKCBhc3NlcnQgJiYgbGF5b3V0Q29udGFpbmVyLmxvY2FsQm91bmRzLmlzRmluaXRlKCkgJiYgIXRoaXMuX2xheW91dEF0dGVtcHREdXJpbmdMb2NrICkge1xyXG4gICAgICBsYXlvdXRDb250YWluZXIudmFsaWRhdGVMb2NhbFByZWZlcnJlZEhlaWdodCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGVyZSBmb3IgbWFudWFsIHZhbGlkYXRpb24gKHNheSwgaW4gdGhlIGRldnRvb2xzKSAtIFdoaWxlIHNvbWUgbGF5b3V0cyBhcmUgZ29pbmcgb24sIHRoaXMgbWF5IG5vdCBiZSBjb3JyZWN0LCBzbyBpdFxyXG4gICAqIGNvdWxkIG5vdCBiZSBhZGRlZCB0byBwb3N0LWxheW91dCB2YWxpZGF0aW9uLlxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyB2YWxpZGF0ZUxvY2FsUHJlZmVycmVkU2l6ZSggbGF5b3V0Q29udGFpbmVyOiBTaXphYmxlTm9kZSApOiB2b2lkIHtcclxuICAgIGlmICggYXNzZXJ0ICYmIGxheW91dENvbnRhaW5lci5sb2NhbEJvdW5kcy5pc0Zpbml0ZSgpICYmICF0aGlzLl9sYXlvdXRBdHRlbXB0RHVyaW5nTG9jayApIHtcclxuICAgICAgbGF5b3V0Q29udGFpbmVyLnZhbGlkYXRlTG9jYWxQcmVmZXJyZWRTaXplKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVcGRhdGVzIHRoZSBsYXlvdXQgb2YgdGhpcyBjb25zdHJhaW50LiBDYWxsZWQgYXV0b21hdGljYWxseSBkdXJpbmcgaW5pdGlhbGl6YXRpb24sIHdoZW4gY2hpbGRyZW4gY2hhbmdlIChpZlxyXG4gICAqIHJlc2l6ZSBpcyB0cnVlKSwgb3Igd2hlbiBjbGllbnQgd2FudHMgdG8gY2FsbCB0aGlzIHB1YmxpYyBtZXRob2QgZm9yIGFueSByZWFzb24uXHJcbiAgICovXHJcbiAgcHVibGljIHVwZGF0ZUxheW91dCgpOiB2b2lkIHtcclxuICAgIGxldCBjb3VudCA9IDA7XHJcblxyXG4gICAgLy8gSWYgd2UncmUgbG9ja2VkIEFORCBzb21lb25lIHRyaWVzIHRvIGRvIGxheW91dCwgcmVjb3JkIHRoaXMgc28gd2UgY2FuIGF0dGVtcHQgbGF5b3V0IG9uY2Ugd2UgYXJlIG5vdCBsb2NrZWRcclxuICAgIC8vIGFueW1vcmUuIFdlIGhhdmUgc29tZSBpbmZpbml0ZS1sb29wIGRldGVjdGlvbiBoZXJlIGZvciBjb21tb24gZGV2ZWxvcG1lbnQgZXJyb3JzLlxyXG4gICAgaWYgKCB0aGlzLmlzTG9ja2VkICkge1xyXG4gICAgICBhc3NlcnQgJiYgY291bnQrKztcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggKytjb3VudCA8IDUwMCwgJ0xpa2VseSBpbmZpbml0ZSBsb29wIGRldGVjdGVkLCBhcmUgd2UgdHJpZ2dlcmluZyBsYXlvdXQgd2l0aGluIHRoZSBsYXlvdXQ/JyApO1xyXG4gICAgICB0aGlzLl9sYXlvdXRBdHRlbXB0RHVyaW5nTG9jayA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy5sb2NrKCk7XHJcblxyXG4gICAgICAvLyBSdW4gbGF5b3V0IHVudGlsIHdlIGRpZG4ndCBnZXQgYSBsYXlvdXQgYXR0ZW1wdCBkdXJpbmcgb3VyIGxhc3QgYXR0ZW1wdC4gVGhpcyBjb21wb25lbnQncyBsYXlvdXQgc2hvdWxkIG5vd1xyXG4gICAgICAvLyBiZSBjb3JyZWN0IGFuZCBzdGFibGUuXHJcbiAgICAgIGRvIHtcclxuICAgICAgICB0aGlzLl9sYXlvdXRBdHRlbXB0RHVyaW5nTG9jayA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMubGF5b3V0KCk7XHJcbiAgICAgIH1cclxuICAgICAgICAvLyBJZiB3ZSBnb3QgYW55IGxheW91dCBhdHRlbXB0cyBkdXJpbmcgdGhlIGxvY2ssIHdlJ2xsIHdhbnQgdG8gcmVydW4gdGhlIGxheW91dFxyXG4gICAgICB3aGlsZSAoIHRoaXMuX2xheW91dEF0dGVtcHREdXJpbmdMb2NrICk7XHJcblxyXG4gICAgICB0aGlzLnVubG9jaygpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIHdoZW4gd2UgYXR0ZW1wdCB0byBhdXRvbWF0aWNhbGx5IGxheW91dCBjb21wb25lbnRzLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgdXBkYXRlTGF5b3V0QXV0b21hdGljYWxseSgpOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy5fZW5hYmxlZCApIHtcclxuICAgICAgdGhpcy51cGRhdGVMYXlvdXQoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBMYXlvdXRQcm94eSBmb3IgYSB1bmlxdWUgdHJhaWwgZnJvbSBvdXIgYW5jZXN0b3JOb2RlIHRvIHRoaXMgTm9kZSAob3IgbnVsbCBpZiB0aGF0J3Mgbm90IHBvc3NpYmxlKVxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjcmVhdGVMYXlvdXRQcm94eSggbm9kZTogTm9kZSApOiBMYXlvdXRQcm94eSB8IG51bGwge1xyXG4gICAgY29uc3QgdHJhaWxzID0gbm9kZS5nZXRUcmFpbHMoIG4gPT4gbiA9PT0gdGhpcy5hbmNlc3Rvck5vZGUgKTtcclxuXHJcbiAgICBpZiAoIHRyYWlscy5sZW5ndGggPT09IDEgKSB7XHJcbiAgICAgIHJldHVybiBMYXlvdXRQcm94eS5wb29sLmNyZWF0ZSggdHJhaWxzWyAwIF0ucmVtb3ZlQW5jZXN0b3IoKSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBlbmFibGVkKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2VuYWJsZWQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGVuYWJsZWQoIHZhbHVlOiBib29sZWFuICkge1xyXG4gICAgaWYgKCB0aGlzLl9lbmFibGVkICE9PSB2YWx1ZSApIHtcclxuICAgICAgdGhpcy5fZW5hYmxlZCA9IHZhbHVlO1xyXG5cclxuICAgICAgdGhpcy51cGRhdGVMYXlvdXRBdXRvbWF0aWNhbGx5KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWxlYXNlcyByZWZlcmVuY2VzXHJcbiAgICovXHJcbiAgcHVibGljIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICAvLyBDbGVhbiB1cCBsaXN0ZW5lcnMgdG8gYW55IGxpc3RlbmVkIG5vZGVzXHJcbiAgICBjb25zdCBsaXN0ZW5lZE5vZGVzID0gWyAuLi50aGlzLl9saXN0ZW5lZE5vZGVzLmtleXMoKSBdO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbGlzdGVuZWROb2Rlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgdGhpcy5yZW1vdmVOb2RlKCBsaXN0ZW5lZE5vZGVzWyBpIF0gKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmZpbmlzaGVkTGF5b3V0RW1pdHRlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnTGF5b3V0Q29uc3RyYWludCcsIExheW91dENvbnN0cmFpbnQgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQSxPQUFPQSxXQUFXLE1BQU0sb0NBQW9DO0FBQzVELFNBQVNDLG9CQUFvQixFQUFFQyxtQkFBbUIsRUFBcUJDLFdBQVcsRUFBUUMsT0FBTyxRQUF1QyxrQkFBa0I7QUFFMUosZUFBZSxNQUFlQyxnQkFBZ0IsQ0FBQztFQUU3Qzs7RUFHQTtF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