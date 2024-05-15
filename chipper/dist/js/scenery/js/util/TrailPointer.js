// Copyright 2013-2024, University of Colorado Boulder

/**
 * Points to a specific node (with a trail), and whether it is conceptually before or after the node.
 *
 * There are two orderings:
 * - rendering order: the order that node selves would be rendered, matching the Trail implicit order
 * - nesting order:   the order in depth first with entering a node being "before" and exiting a node being "after"
 *
 * TODO: more seamless handling of the orders. or just exclusively use the nesting order https://github.com/phetsims/scenery/issues/1581
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { scenery } from '../imports.js';
export default class TrailPointer {
  /**
   * @param trail
   * @param isBefore - whether this points to before the node (and its children) have been rendered, or after
   */
  constructor(trail, isBefore) {
    this.trail = trail;
    this.setBefore(isBefore);
  }
  isActive() {
    return !!this.trail;
  }
  copy() {
    assert && assert(this.isActive());
    return new TrailPointer(this.trail.copy(), this.isBefore);
  }
  setBefore(isBefore) {
    this.isBefore = isBefore;
    this.isAfter = !isBefore;
  }

  /**
   * Return the equivalent pointer that swaps before and after (may return null if it doesn't exist)
   */
  getRenderSwappedPointer() {
    assert && assert(this.isActive());
    const activeSelf = this;
    const newTrail = this.isBefore ? activeSelf.trail.previous() : activeSelf.trail.next();
    if (newTrail === null) {
      return null;
    } else {
      return new TrailPointer(newTrail, !this.isBefore);
    }
  }
  getRenderBeforePointer() {
    return this.isBefore ? this : this.getRenderSwappedPointer();
  }
  getRenderAfterPointer() {
    return this.isAfter ? this : this.getRenderSwappedPointer();
  }

  /**
   * In the render order, will return 0 if the pointers are equivalent, -1 if this pointer is before the
   * other pointer, and 1 if this pointer is after the other pointer.
   */
  compareRender(other) {
    assert && assert(other !== null);
    const a = this.getRenderBeforePointer();
    const b = other.getRenderBeforePointer();
    if (a !== null && b !== null) {
      assert && assert(a.isActive() && b.isActive());

      // normal (non-degenerate) case
      return a.trail.compare(b.trail);
    } else {
      // null "before" point is equivalent to the "after" pointer on the last rendered node.
      if (a === b) {
        return 0; // uniqueness guarantees they were the same
      } else {
        return a === null ? 1 : -1;
      }
    }
  }

  /**
   * Like compareRender, but for the nested (depth-first) order
   *
   * TODO: optimization? https://github.com/phetsims/scenery/issues/1581
   */
  compareNested(other) {
    assert && assert(other);
    assert && assert(this.isActive() && other.isActive());
    const activeSelf = this;
    const activeOther = other;
    const comparison = activeSelf.trail.compare(activeOther.trail);
    if (comparison === 0) {
      // if trails are equal, just compare before/after
      if (this.isBefore === other.isBefore) {
        return 0;
      } else {
        return this.isBefore ? -1 : 1;
      }
    } else {
      // if one is an extension of the other, the shorter isBefore flag determines the order completely
      if (activeSelf.trail.isExtensionOf(activeOther.trail)) {
        return other.isBefore ? 1 : -1;
      } else if (activeOther.trail.isExtensionOf(activeSelf.trail)) {
        return this.isBefore ? -1 : 1;
      } else {
        // neither is a subtrail of the other, so a straight trail comparison should give the answer
        return comparison;
      }
    }
  }
  equalsRender(other) {
    return this.compareRender(other) === 0;
  }
  equalsNested(other) {
    return this.compareNested(other) === 0;
  }

  /**
   * Will return false if this pointer has gone off of the beginning or end of the tree (will be marked with isAfter or
   * isBefore though)
   */
  hasTrail() {
    return !!this.trail;
  }

  /**
   * Moves this pointer forwards one step in the nested order
   *
   * TODO: refactor with "Side"-like handling https://github.com/phetsims/scenery/issues/1581
   */
  nestedForwards() {
    assert && assert(this.isActive());
    const activeSelf = this;
    if (this.isBefore) {
      const children = activeSelf.trail.lastNode()._children;
      if (children.length > 0) {
        // stay as before, just walk to the first child
        activeSelf.trail.addDescendant(children[0], 0);
      } else {
        // stay on the same node, but switch to after
        this.setBefore(false);
      }
    } else {
      if (activeSelf.trail.indices.length === 0) {
        // nothing else to jump to below, so indicate the lack of existence
        this.trail = null;
        // stays isAfter
        return null;
      } else {
        const index = activeSelf.trail.indices[activeSelf.trail.indices.length - 1];
        activeSelf.trail.removeDescendant();
        const children = activeSelf.trail.lastNode()._children;
        if (children.length > index + 1) {
          // more siblings, switch to the beginning of the next one
          activeSelf.trail.addDescendant(children[index + 1], index + 1);
          this.setBefore(true);
        } else {
          // no more siblings. exit on parent. nothing else needed since we're already isAfter
        }
      }
    }
    return this;
  }

  /**
   * Moves this pointer backwards one step in the nested order
   */
  nestedBackwards() {
    assert && assert(this.isActive());
    const activeSelf = this;
    if (this.isBefore) {
      if (activeSelf.trail.indices.length === 0) {
        // jumping off the front
        this.trail = null;
        // stays isBefore
        return null;
      } else {
        const index = activeSelf.trail.indices[activeSelf.trail.indices.length - 1];
        activeSelf.trail.removeDescendant();
        if (index - 1 >= 0) {
          // more siblings, switch to the beginning of the previous one and switch to isAfter
          activeSelf.trail.addDescendant(activeSelf.trail.lastNode()._children[index - 1], index - 1);
          this.setBefore(false);
        } else {
          // no more siblings. enter on parent. nothing else needed since we're already isBefore
        }
      }
    } else {
      if (activeSelf.trail.lastNode()._children.length > 0) {
        // stay isAfter, but walk to the last child
        const children = activeSelf.trail.lastNode()._children;
        activeSelf.trail.addDescendant(children[children.length - 1], children.length - 1);
      } else {
        // switch to isBefore, since this is a leaf node
        this.setBefore(true);
      }
    }
    return this;
  }

  /**
   * Treats the pointer as render-ordered (includes the start pointer 'before' if applicable, excludes the end pointer
   * 'before' if applicable
   */
  eachNodeBetween(other, callback) {
    this.eachTrailBetween(other, trail => callback(trail.lastNode()));
  }

  /**
   * Treats the pointer as render-ordered (includes the start pointer 'before' if applicable, excludes the end pointer
   * 'before' if applicable
   */
  eachTrailBetween(other, callback) {
    // this should trigger on all pointers that have the 'before' flag, except a pointer equal to 'other'.

    // since we exclude endpoints in the depthFirstUntil call, we need to fire this off first
    if (this.isBefore) {
      assert && assert(this.isActive());
      callback(this.trail);
    }
    this.depthFirstUntil(other, pointer => {
      if (pointer.isBefore) {
        return callback(pointer.trail);
      }
      return false;
    }, true); // exclude the endpoints so we can ignore the ending 'before' case
  }

  /**
   * Recursively (depth-first) iterates over all pointers between this pointer and 'other', calling
   * callback( pointer ) for each pointer. If excludeEndpoints is truthy, the callback will not be
   * called if pointer is equivalent to this pointer or 'other'.
   *
   * If the callback returns a truthy value, the subtree for the current pointer will be skipped
   * (applies only to before-pointers)
   */
  depthFirstUntil(other, callback, excludeEndpoints) {
    assert && assert(this.isActive() && other.isActive());
    const activeSelf = this;
    const activeOther = other;

    // make sure this pointer is before the other, but allow start === end if we are not excluding endpoints
    assert && assert(this.compareNested(other) <= (excludeEndpoints ? -1 : 0), 'TrailPointer.depthFirstUntil pointers out of order, possibly in both meanings of the phrase!');
    assert && assert(activeSelf.trail.rootNode() === activeOther.trail.rootNode(), 'TrailPointer.depthFirstUntil takes pointers with the same root');

    // sanity check TODO: remove later https://github.com/phetsims/scenery/issues/1581
    activeSelf.trail.reindex();
    activeOther.trail.reindex();
    const pointer = this.copy();
    pointer.trail.setMutable(); // this trail will be modified in the iteration, so references to it may be modified

    let first = true;
    while (!pointer.equalsNested(other)) {
      assert && assert(pointer.compareNested(other) !== 1, 'skipped in depthFirstUntil');
      let skipSubtree = false; // eslint-disable-line @typescript-eslint/no-invalid-void-type

      if (first) {
        // start point
        if (!excludeEndpoints) {
          skipSubtree = callback(pointer);
        }
        first = false;
      } else {
        // between point
        skipSubtree = callback(pointer);
      }
      if (skipSubtree && pointer.isBefore) {
        // to skip the subtree, we just change to isAfter
        pointer.setBefore(false);

        // if we skip a subtree, make sure we don't run past the ending pointer
        if (pointer.compareNested(other) === 1) {
          break;
        }
      } else {
        pointer.nestedForwards();
      }
    }

    // end point
    if (!excludeEndpoints) {
      callback(pointer);
    }
  }

  /**
   * Returns a string form of this object
   */
  toString() {
    assert && assert(this.isActive());
    return `[${this.isBefore ? 'before' : 'after'} ${this.trail.toString().slice(1)}`;
  }

  /**
   * Same as new TrailPointer( trailA, isBeforeA ).compareNested( new TrailPointer( trailB, isBeforeB ) )
   */
  static compareNested(trailA, isBeforeA, trailB, isBeforeB) {
    const comparison = trailA.compare(trailB);
    if (comparison === 0) {
      // if trails are equal, just compare before/after
      if (isBeforeA === isBeforeB) {
        return 0;
      } else {
        return isBeforeA ? -1 : 1;
      }
    } else {
      // if one is an extension of the other, the shorter isBefore flag determines the order completely
      if (trailA.isExtensionOf(trailB)) {
        return isBeforeB ? 1 : -1;
      } else if (trailB.isExtensionOf(trailA)) {
        return isBeforeA ? -1 : 1;
      } else {
        // neither is a subtrail of the other, so a straight trail comparison should give the answer
        return comparison;
      }
    }
  }
}
scenery.register('TrailPointer', TrailPointer);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJzY2VuZXJ5IiwiVHJhaWxQb2ludGVyIiwiY29uc3RydWN0b3IiLCJ0cmFpbCIsImlzQmVmb3JlIiwic2V0QmVmb3JlIiwiaXNBY3RpdmUiLCJjb3B5IiwiYXNzZXJ0IiwiaXNBZnRlciIsImdldFJlbmRlclN3YXBwZWRQb2ludGVyIiwiYWN0aXZlU2VsZiIsIm5ld1RyYWlsIiwicHJldmlvdXMiLCJuZXh0IiwiZ2V0UmVuZGVyQmVmb3JlUG9pbnRlciIsImdldFJlbmRlckFmdGVyUG9pbnRlciIsImNvbXBhcmVSZW5kZXIiLCJvdGhlciIsImEiLCJiIiwiY29tcGFyZSIsImNvbXBhcmVOZXN0ZWQiLCJhY3RpdmVPdGhlciIsImNvbXBhcmlzb24iLCJpc0V4dGVuc2lvbk9mIiwiZXF1YWxzUmVuZGVyIiwiZXF1YWxzTmVzdGVkIiwiaGFzVHJhaWwiLCJuZXN0ZWRGb3J3YXJkcyIsImNoaWxkcmVuIiwibGFzdE5vZGUiLCJfY2hpbGRyZW4iLCJsZW5ndGgiLCJhZGREZXNjZW5kYW50IiwiaW5kaWNlcyIsImluZGV4IiwicmVtb3ZlRGVzY2VuZGFudCIsIm5lc3RlZEJhY2t3YXJkcyIsImVhY2hOb2RlQmV0d2VlbiIsImNhbGxiYWNrIiwiZWFjaFRyYWlsQmV0d2VlbiIsImRlcHRoRmlyc3RVbnRpbCIsInBvaW50ZXIiLCJleGNsdWRlRW5kcG9pbnRzIiwicm9vdE5vZGUiLCJyZWluZGV4Iiwic2V0TXV0YWJsZSIsImZpcnN0Iiwic2tpcFN1YnRyZWUiLCJ0b1N0cmluZyIsInNsaWNlIiwidHJhaWxBIiwiaXNCZWZvcmVBIiwidHJhaWxCIiwiaXNCZWZvcmVCIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJUcmFpbFBvaW50ZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUG9pbnRzIHRvIGEgc3BlY2lmaWMgbm9kZSAod2l0aCBhIHRyYWlsKSwgYW5kIHdoZXRoZXIgaXQgaXMgY29uY2VwdHVhbGx5IGJlZm9yZSBvciBhZnRlciB0aGUgbm9kZS5cclxuICpcclxuICogVGhlcmUgYXJlIHR3byBvcmRlcmluZ3M6XHJcbiAqIC0gcmVuZGVyaW5nIG9yZGVyOiB0aGUgb3JkZXIgdGhhdCBub2RlIHNlbHZlcyB3b3VsZCBiZSByZW5kZXJlZCwgbWF0Y2hpbmcgdGhlIFRyYWlsIGltcGxpY2l0IG9yZGVyXHJcbiAqIC0gbmVzdGluZyBvcmRlcjogICB0aGUgb3JkZXIgaW4gZGVwdGggZmlyc3Qgd2l0aCBlbnRlcmluZyBhIG5vZGUgYmVpbmcgXCJiZWZvcmVcIiBhbmQgZXhpdGluZyBhIG5vZGUgYmVpbmcgXCJhZnRlclwiXHJcbiAqXHJcbiAqIFRPRE86IG1vcmUgc2VhbWxlc3MgaGFuZGxpbmcgb2YgdGhlIG9yZGVycy4gb3IganVzdCBleGNsdXNpdmVseSB1c2UgdGhlIG5lc3Rpbmcgb3JkZXIgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBXaXRob3V0TnVsbCBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvV2l0aG91dE51bGwuanMnO1xyXG5pbXBvcnQgeyBOb2RlLCBzY2VuZXJ5LCBUcmFpbCB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgeyBUcmFpbENhbGxiYWNrIH0gZnJvbSAnLi9UcmFpbC5qcyc7XHJcblxyXG5leHBvcnQgdHlwZSBBY3RpdmVUcmFpbFBvaW50ZXIgPSBXaXRob3V0TnVsbDxUcmFpbFBvaW50ZXIsICd0cmFpbCc+O1xyXG5cclxudHlwZSBBY3RpdmVUcmFpbFBvaW50ZXJDYWxsYmFjayA9ICggKCB0cmFpbFBvaW50ZXI6IEFjdGl2ZVRyYWlsUG9pbnRlciApID0+IGJvb2xlYW4gKSB8ICggKCB0cmFpbFBvaW50ZXI6IEFjdGl2ZVRyYWlsUG9pbnRlciApID0+IHZvaWQgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRyYWlsUG9pbnRlciB7XHJcblxyXG4gIHB1YmxpYyB0cmFpbDogVHJhaWwgfCBudWxsO1xyXG4gIHB1YmxpYyBpc0JlZm9yZSE6IGJvb2xlYW47XHJcbiAgcHVibGljIGlzQWZ0ZXIhOiBib29sZWFuO1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gdHJhaWxcclxuICAgKiBAcGFyYW0gaXNCZWZvcmUgLSB3aGV0aGVyIHRoaXMgcG9pbnRzIHRvIGJlZm9yZSB0aGUgbm9kZSAoYW5kIGl0cyBjaGlsZHJlbikgaGF2ZSBiZWVuIHJlbmRlcmVkLCBvciBhZnRlclxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggdHJhaWw6IFRyYWlsLCBpc0JlZm9yZTogYm9vbGVhbiApIHtcclxuICAgIHRoaXMudHJhaWwgPSB0cmFpbDtcclxuICAgIHRoaXMuc2V0QmVmb3JlKCBpc0JlZm9yZSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGlzQWN0aXZlKCk6IHRoaXMgaXMgQWN0aXZlVHJhaWxQb2ludGVyIHtcclxuICAgIHJldHVybiAhIXRoaXMudHJhaWw7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgY29weSgpOiBUcmFpbFBvaW50ZXIge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5pc0FjdGl2ZSgpICk7XHJcbiAgICByZXR1cm4gbmV3IFRyYWlsUG9pbnRlciggKCB0aGlzIGFzIEFjdGl2ZVRyYWlsUG9pbnRlciApLnRyYWlsLmNvcHkoKSwgdGhpcy5pc0JlZm9yZSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldEJlZm9yZSggaXNCZWZvcmU6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICB0aGlzLmlzQmVmb3JlID0gaXNCZWZvcmU7XHJcbiAgICB0aGlzLmlzQWZ0ZXIgPSAhaXNCZWZvcmU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm4gdGhlIGVxdWl2YWxlbnQgcG9pbnRlciB0aGF0IHN3YXBzIGJlZm9yZSBhbmQgYWZ0ZXIgKG1heSByZXR1cm4gbnVsbCBpZiBpdCBkb2Vzbid0IGV4aXN0KVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRSZW5kZXJTd2FwcGVkUG9pbnRlcigpOiBUcmFpbFBvaW50ZXIgfCBudWxsIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuaXNBY3RpdmUoKSApO1xyXG4gICAgY29uc3QgYWN0aXZlU2VsZiA9IHRoaXMgYXMgQWN0aXZlVHJhaWxQb2ludGVyO1xyXG5cclxuICAgIGNvbnN0IG5ld1RyYWlsID0gdGhpcy5pc0JlZm9yZSA/IGFjdGl2ZVNlbGYudHJhaWwucHJldmlvdXMoKSA6IGFjdGl2ZVNlbGYudHJhaWwubmV4dCgpO1xyXG5cclxuICAgIGlmICggbmV3VHJhaWwgPT09IG51bGwgKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBuZXcgVHJhaWxQb2ludGVyKCBuZXdUcmFpbCwgIXRoaXMuaXNCZWZvcmUgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXRSZW5kZXJCZWZvcmVQb2ludGVyKCk6IFRyYWlsUG9pbnRlciB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuaXNCZWZvcmUgPyB0aGlzIDogdGhpcy5nZXRSZW5kZXJTd2FwcGVkUG9pbnRlcigpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldFJlbmRlckFmdGVyUG9pbnRlcigpOiBUcmFpbFBvaW50ZXIgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLmlzQWZ0ZXIgPyB0aGlzIDogdGhpcy5nZXRSZW5kZXJTd2FwcGVkUG9pbnRlcigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW4gdGhlIHJlbmRlciBvcmRlciwgd2lsbCByZXR1cm4gMCBpZiB0aGUgcG9pbnRlcnMgYXJlIGVxdWl2YWxlbnQsIC0xIGlmIHRoaXMgcG9pbnRlciBpcyBiZWZvcmUgdGhlXHJcbiAgICogb3RoZXIgcG9pbnRlciwgYW5kIDEgaWYgdGhpcyBwb2ludGVyIGlzIGFmdGVyIHRoZSBvdGhlciBwb2ludGVyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb21wYXJlUmVuZGVyKCBvdGhlcjogVHJhaWxQb2ludGVyICk6IG51bWJlciB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvdGhlciAhPT0gbnVsbCApO1xyXG5cclxuICAgIGNvbnN0IGEgPSB0aGlzLmdldFJlbmRlckJlZm9yZVBvaW50ZXIoKTtcclxuICAgIGNvbnN0IGIgPSBvdGhlci5nZXRSZW5kZXJCZWZvcmVQb2ludGVyKCk7XHJcblxyXG4gICAgaWYgKCBhICE9PSBudWxsICYmIGIgIT09IG51bGwgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGEuaXNBY3RpdmUoKSAmJiBiLmlzQWN0aXZlKCkgKTtcclxuXHJcbiAgICAgIC8vIG5vcm1hbCAobm9uLWRlZ2VuZXJhdGUpIGNhc2VcclxuICAgICAgcmV0dXJuICggYSBhcyBBY3RpdmVUcmFpbFBvaW50ZXIgKS50cmFpbC5jb21wYXJlKCAoIGIgYXMgQWN0aXZlVHJhaWxQb2ludGVyICkudHJhaWwgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyBudWxsIFwiYmVmb3JlXCIgcG9pbnQgaXMgZXF1aXZhbGVudCB0byB0aGUgXCJhZnRlclwiIHBvaW50ZXIgb24gdGhlIGxhc3QgcmVuZGVyZWQgbm9kZS5cclxuICAgICAgaWYgKCBhID09PSBiICkge1xyXG4gICAgICAgIHJldHVybiAwOyAvLyB1bmlxdWVuZXNzIGd1YXJhbnRlZXMgdGhleSB3ZXJlIHRoZSBzYW1lXHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGEgPT09IG51bGwgPyAxIDogLTE7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIExpa2UgY29tcGFyZVJlbmRlciwgYnV0IGZvciB0aGUgbmVzdGVkIChkZXB0aC1maXJzdCkgb3JkZXJcclxuICAgKlxyXG4gICAqIFRPRE86IG9wdGltaXphdGlvbj8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgKi9cclxuICBwdWJsaWMgY29tcGFyZU5lc3RlZCggb3RoZXI6IFRyYWlsUG9pbnRlciApOiBudW1iZXIge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb3RoZXIgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmlzQWN0aXZlKCkgJiYgb3RoZXIuaXNBY3RpdmUoKSApO1xyXG4gICAgY29uc3QgYWN0aXZlU2VsZiA9IHRoaXMgYXMgQWN0aXZlVHJhaWxQb2ludGVyO1xyXG4gICAgY29uc3QgYWN0aXZlT3RoZXIgPSBvdGhlciBhcyBBY3RpdmVUcmFpbFBvaW50ZXI7XHJcblxyXG4gICAgY29uc3QgY29tcGFyaXNvbiA9IGFjdGl2ZVNlbGYudHJhaWwuY29tcGFyZSggYWN0aXZlT3RoZXIudHJhaWwgKTtcclxuXHJcbiAgICBpZiAoIGNvbXBhcmlzb24gPT09IDAgKSB7XHJcbiAgICAgIC8vIGlmIHRyYWlscyBhcmUgZXF1YWwsIGp1c3QgY29tcGFyZSBiZWZvcmUvYWZ0ZXJcclxuICAgICAgaWYgKCB0aGlzLmlzQmVmb3JlID09PSBvdGhlci5pc0JlZm9yZSApIHtcclxuICAgICAgICByZXR1cm4gMDtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pc0JlZm9yZSA/IC0xIDogMTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIGlmIG9uZSBpcyBhbiBleHRlbnNpb24gb2YgdGhlIG90aGVyLCB0aGUgc2hvcnRlciBpc0JlZm9yZSBmbGFnIGRldGVybWluZXMgdGhlIG9yZGVyIGNvbXBsZXRlbHlcclxuICAgICAgaWYgKCBhY3RpdmVTZWxmLnRyYWlsLmlzRXh0ZW5zaW9uT2YoIGFjdGl2ZU90aGVyLnRyYWlsICkgKSB7XHJcbiAgICAgICAgcmV0dXJuIG90aGVyLmlzQmVmb3JlID8gMSA6IC0xO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCBhY3RpdmVPdGhlci50cmFpbC5pc0V4dGVuc2lvbk9mKCBhY3RpdmVTZWxmLnRyYWlsICkgKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNCZWZvcmUgPyAtMSA6IDE7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gbmVpdGhlciBpcyBhIHN1YnRyYWlsIG9mIHRoZSBvdGhlciwgc28gYSBzdHJhaWdodCB0cmFpbCBjb21wYXJpc29uIHNob3VsZCBnaXZlIHRoZSBhbnN3ZXJcclxuICAgICAgICByZXR1cm4gY29tcGFyaXNvbjtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIGVxdWFsc1JlbmRlciggb3RoZXI6IFRyYWlsUG9pbnRlciApOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmNvbXBhcmVSZW5kZXIoIG90aGVyICkgPT09IDA7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZXF1YWxzTmVzdGVkKCBvdGhlcjogVHJhaWxQb2ludGVyICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuY29tcGFyZU5lc3RlZCggb3RoZXIgKSA9PT0gMDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdpbGwgcmV0dXJuIGZhbHNlIGlmIHRoaXMgcG9pbnRlciBoYXMgZ29uZSBvZmYgb2YgdGhlIGJlZ2lubmluZyBvciBlbmQgb2YgdGhlIHRyZWUgKHdpbGwgYmUgbWFya2VkIHdpdGggaXNBZnRlciBvclxyXG4gICAqIGlzQmVmb3JlIHRob3VnaClcclxuICAgKi9cclxuICBwdWJsaWMgaGFzVHJhaWwoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gISF0aGlzLnRyYWlsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTW92ZXMgdGhpcyBwb2ludGVyIGZvcndhcmRzIG9uZSBzdGVwIGluIHRoZSBuZXN0ZWQgb3JkZXJcclxuICAgKlxyXG4gICAqIFRPRE86IHJlZmFjdG9yIHdpdGggXCJTaWRlXCItbGlrZSBoYW5kbGluZyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAqL1xyXG4gIHB1YmxpYyBuZXN0ZWRGb3J3YXJkcygpOiB0aGlzIHwgbnVsbCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmlzQWN0aXZlKCkgKTtcclxuICAgIGNvbnN0IGFjdGl2ZVNlbGYgPSB0aGlzIGFzIEFjdGl2ZVRyYWlsUG9pbnRlcjtcclxuXHJcbiAgICBpZiAoIHRoaXMuaXNCZWZvcmUgKSB7XHJcbiAgICAgIGNvbnN0IGNoaWxkcmVuID0gYWN0aXZlU2VsZi50cmFpbC5sYXN0Tm9kZSgpLl9jaGlsZHJlbjtcclxuICAgICAgaWYgKCBjaGlsZHJlbi5sZW5ndGggPiAwICkge1xyXG4gICAgICAgIC8vIHN0YXkgYXMgYmVmb3JlLCBqdXN0IHdhbGsgdG8gdGhlIGZpcnN0IGNoaWxkXHJcbiAgICAgICAgYWN0aXZlU2VsZi50cmFpbC5hZGREZXNjZW5kYW50KCBjaGlsZHJlblsgMCBdLCAwICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gc3RheSBvbiB0aGUgc2FtZSBub2RlLCBidXQgc3dpdGNoIHRvIGFmdGVyXHJcbiAgICAgICAgdGhpcy5zZXRCZWZvcmUoIGZhbHNlICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBpZiAoIGFjdGl2ZVNlbGYudHJhaWwuaW5kaWNlcy5sZW5ndGggPT09IDAgKSB7XHJcbiAgICAgICAgLy8gbm90aGluZyBlbHNlIHRvIGp1bXAgdG8gYmVsb3csIHNvIGluZGljYXRlIHRoZSBsYWNrIG9mIGV4aXN0ZW5jZVxyXG4gICAgICAgIHRoaXMudHJhaWwgPSBudWxsO1xyXG4gICAgICAgIC8vIHN0YXlzIGlzQWZ0ZXJcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IGFjdGl2ZVNlbGYudHJhaWwuaW5kaWNlc1sgYWN0aXZlU2VsZi50cmFpbC5pbmRpY2VzLmxlbmd0aCAtIDEgXTtcclxuICAgICAgICBhY3RpdmVTZWxmLnRyYWlsLnJlbW92ZURlc2NlbmRhbnQoKTtcclxuXHJcbiAgICAgICAgY29uc3QgY2hpbGRyZW4gPSBhY3RpdmVTZWxmLnRyYWlsLmxhc3ROb2RlKCkuX2NoaWxkcmVuO1xyXG4gICAgICAgIGlmICggY2hpbGRyZW4ubGVuZ3RoID4gaW5kZXggKyAxICkge1xyXG4gICAgICAgICAgLy8gbW9yZSBzaWJsaW5ncywgc3dpdGNoIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIG5leHQgb25lXHJcbiAgICAgICAgICBhY3RpdmVTZWxmLnRyYWlsLmFkZERlc2NlbmRhbnQoIGNoaWxkcmVuWyBpbmRleCArIDEgXSwgaW5kZXggKyAxICk7XHJcbiAgICAgICAgICB0aGlzLnNldEJlZm9yZSggdHJ1ZSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIC8vIG5vIG1vcmUgc2libGluZ3MuIGV4aXQgb24gcGFyZW50LiBub3RoaW5nIGVsc2UgbmVlZGVkIHNpbmNlIHdlJ3JlIGFscmVhZHkgaXNBZnRlclxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNb3ZlcyB0aGlzIHBvaW50ZXIgYmFja3dhcmRzIG9uZSBzdGVwIGluIHRoZSBuZXN0ZWQgb3JkZXJcclxuICAgKi9cclxuICBwdWJsaWMgbmVzdGVkQmFja3dhcmRzKCk6IHRoaXMgfCBudWxsIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuaXNBY3RpdmUoKSApO1xyXG4gICAgY29uc3QgYWN0aXZlU2VsZiA9IHRoaXMgYXMgQWN0aXZlVHJhaWxQb2ludGVyO1xyXG5cclxuICAgIGlmICggdGhpcy5pc0JlZm9yZSApIHtcclxuICAgICAgaWYgKCBhY3RpdmVTZWxmLnRyYWlsLmluZGljZXMubGVuZ3RoID09PSAwICkge1xyXG4gICAgICAgIC8vIGp1bXBpbmcgb2ZmIHRoZSBmcm9udFxyXG4gICAgICAgIHRoaXMudHJhaWwgPSBudWxsO1xyXG4gICAgICAgIC8vIHN0YXlzIGlzQmVmb3JlXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSBhY3RpdmVTZWxmLnRyYWlsLmluZGljZXNbIGFjdGl2ZVNlbGYudHJhaWwuaW5kaWNlcy5sZW5ndGggLSAxIF07XHJcbiAgICAgICAgYWN0aXZlU2VsZi50cmFpbC5yZW1vdmVEZXNjZW5kYW50KCk7XHJcblxyXG4gICAgICAgIGlmICggaW5kZXggLSAxID49IDAgKSB7XHJcbiAgICAgICAgICAvLyBtb3JlIHNpYmxpbmdzLCBzd2l0Y2ggdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgcHJldmlvdXMgb25lIGFuZCBzd2l0Y2ggdG8gaXNBZnRlclxyXG4gICAgICAgICAgYWN0aXZlU2VsZi50cmFpbC5hZGREZXNjZW5kYW50KCBhY3RpdmVTZWxmLnRyYWlsLmxhc3ROb2RlKCkuX2NoaWxkcmVuWyBpbmRleCAtIDEgXSwgaW5kZXggLSAxICk7XHJcbiAgICAgICAgICB0aGlzLnNldEJlZm9yZSggZmFsc2UgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAvLyBubyBtb3JlIHNpYmxpbmdzLiBlbnRlciBvbiBwYXJlbnQuIG5vdGhpbmcgZWxzZSBuZWVkZWQgc2luY2Ugd2UncmUgYWxyZWFkeSBpc0JlZm9yZVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGlmICggYWN0aXZlU2VsZi50cmFpbC5sYXN0Tm9kZSgpLl9jaGlsZHJlbi5sZW5ndGggPiAwICkge1xyXG4gICAgICAgIC8vIHN0YXkgaXNBZnRlciwgYnV0IHdhbGsgdG8gdGhlIGxhc3QgY2hpbGRcclxuICAgICAgICBjb25zdCBjaGlsZHJlbiA9IGFjdGl2ZVNlbGYudHJhaWwubGFzdE5vZGUoKS5fY2hpbGRyZW47XHJcbiAgICAgICAgYWN0aXZlU2VsZi50cmFpbC5hZGREZXNjZW5kYW50KCBjaGlsZHJlblsgY2hpbGRyZW4ubGVuZ3RoIC0gMSBdLCBjaGlsZHJlbi5sZW5ndGggLSAxICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gc3dpdGNoIHRvIGlzQmVmb3JlLCBzaW5jZSB0aGlzIGlzIGEgbGVhZiBub2RlXHJcbiAgICAgICAgdGhpcy5zZXRCZWZvcmUoIHRydWUgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmVhdHMgdGhlIHBvaW50ZXIgYXMgcmVuZGVyLW9yZGVyZWQgKGluY2x1ZGVzIHRoZSBzdGFydCBwb2ludGVyICdiZWZvcmUnIGlmIGFwcGxpY2FibGUsIGV4Y2x1ZGVzIHRoZSBlbmQgcG9pbnRlclxyXG4gICAqICdiZWZvcmUnIGlmIGFwcGxpY2FibGVcclxuICAgKi9cclxuICBwdWJsaWMgZWFjaE5vZGVCZXR3ZWVuKCBvdGhlcjogVHJhaWxQb2ludGVyLCBjYWxsYmFjazogKCBub2RlOiBOb2RlICkgPT4gdm9pZCApOiB2b2lkIHtcclxuICAgIHRoaXMuZWFjaFRyYWlsQmV0d2Vlbiggb3RoZXIsICggdHJhaWw6IFRyYWlsICkgPT4gY2FsbGJhY2soIHRyYWlsLmxhc3ROb2RlKCkgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJlYXRzIHRoZSBwb2ludGVyIGFzIHJlbmRlci1vcmRlcmVkIChpbmNsdWRlcyB0aGUgc3RhcnQgcG9pbnRlciAnYmVmb3JlJyBpZiBhcHBsaWNhYmxlLCBleGNsdWRlcyB0aGUgZW5kIHBvaW50ZXJcclxuICAgKiAnYmVmb3JlJyBpZiBhcHBsaWNhYmxlXHJcbiAgICovXHJcbiAgcHVibGljIGVhY2hUcmFpbEJldHdlZW4oIG90aGVyOiBUcmFpbFBvaW50ZXIsIGNhbGxiYWNrOiBUcmFpbENhbGxiYWNrICk6IHZvaWQge1xyXG4gICAgLy8gdGhpcyBzaG91bGQgdHJpZ2dlciBvbiBhbGwgcG9pbnRlcnMgdGhhdCBoYXZlIHRoZSAnYmVmb3JlJyBmbGFnLCBleGNlcHQgYSBwb2ludGVyIGVxdWFsIHRvICdvdGhlcicuXHJcblxyXG4gICAgLy8gc2luY2Ugd2UgZXhjbHVkZSBlbmRwb2ludHMgaW4gdGhlIGRlcHRoRmlyc3RVbnRpbCBjYWxsLCB3ZSBuZWVkIHRvIGZpcmUgdGhpcyBvZmYgZmlyc3RcclxuICAgIGlmICggdGhpcy5pc0JlZm9yZSApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5pc0FjdGl2ZSgpICk7XHJcbiAgICAgIGNhbGxiYWNrKCAoIHRoaXMgYXMgQWN0aXZlVHJhaWxQb2ludGVyICkudHJhaWwgKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmRlcHRoRmlyc3RVbnRpbCggb3RoZXIsICggcG9pbnRlcjogQWN0aXZlVHJhaWxQb2ludGVyICkgPT4ge1xyXG4gICAgICBpZiAoIHBvaW50ZXIuaXNCZWZvcmUgKSB7XHJcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCBwb2ludGVyLnRyYWlsICk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSwgdHJ1ZSApOyAvLyBleGNsdWRlIHRoZSBlbmRwb2ludHMgc28gd2UgY2FuIGlnbm9yZSB0aGUgZW5kaW5nICdiZWZvcmUnIGNhc2VcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlY3Vyc2l2ZWx5IChkZXB0aC1maXJzdCkgaXRlcmF0ZXMgb3ZlciBhbGwgcG9pbnRlcnMgYmV0d2VlbiB0aGlzIHBvaW50ZXIgYW5kICdvdGhlcicsIGNhbGxpbmdcclxuICAgKiBjYWxsYmFjayggcG9pbnRlciApIGZvciBlYWNoIHBvaW50ZXIuIElmIGV4Y2x1ZGVFbmRwb2ludHMgaXMgdHJ1dGh5LCB0aGUgY2FsbGJhY2sgd2lsbCBub3QgYmVcclxuICAgKiBjYWxsZWQgaWYgcG9pbnRlciBpcyBlcXVpdmFsZW50IHRvIHRoaXMgcG9pbnRlciBvciAnb3RoZXInLlxyXG4gICAqXHJcbiAgICogSWYgdGhlIGNhbGxiYWNrIHJldHVybnMgYSB0cnV0aHkgdmFsdWUsIHRoZSBzdWJ0cmVlIGZvciB0aGUgY3VycmVudCBwb2ludGVyIHdpbGwgYmUgc2tpcHBlZFxyXG4gICAqIChhcHBsaWVzIG9ubHkgdG8gYmVmb3JlLXBvaW50ZXJzKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBkZXB0aEZpcnN0VW50aWwoIG90aGVyOiBUcmFpbFBvaW50ZXIsIGNhbGxiYWNrOiBBY3RpdmVUcmFpbFBvaW50ZXJDYWxsYmFjaywgZXhjbHVkZUVuZHBvaW50czogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuaXNBY3RpdmUoKSAmJiBvdGhlci5pc0FjdGl2ZSgpICk7XHJcbiAgICBjb25zdCBhY3RpdmVTZWxmID0gdGhpcyBhcyBBY3RpdmVUcmFpbFBvaW50ZXI7XHJcbiAgICBjb25zdCBhY3RpdmVPdGhlciA9IG90aGVyIGFzIEFjdGl2ZVRyYWlsUG9pbnRlcjtcclxuXHJcbiAgICAvLyBtYWtlIHN1cmUgdGhpcyBwb2ludGVyIGlzIGJlZm9yZSB0aGUgb3RoZXIsIGJ1dCBhbGxvdyBzdGFydCA9PT0gZW5kIGlmIHdlIGFyZSBub3QgZXhjbHVkaW5nIGVuZHBvaW50c1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5jb21wYXJlTmVzdGVkKCBvdGhlciApIDw9ICggZXhjbHVkZUVuZHBvaW50cyA/IC0xIDogMCApLCAnVHJhaWxQb2ludGVyLmRlcHRoRmlyc3RVbnRpbCBwb2ludGVycyBvdXQgb2Ygb3JkZXIsIHBvc3NpYmx5IGluIGJvdGggbWVhbmluZ3Mgb2YgdGhlIHBocmFzZSEnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhY3RpdmVTZWxmLnRyYWlsLnJvb3ROb2RlKCkgPT09IGFjdGl2ZU90aGVyLnRyYWlsLnJvb3ROb2RlKCksICdUcmFpbFBvaW50ZXIuZGVwdGhGaXJzdFVudGlsIHRha2VzIHBvaW50ZXJzIHdpdGggdGhlIHNhbWUgcm9vdCcgKTtcclxuXHJcbiAgICAvLyBzYW5pdHkgY2hlY2sgVE9ETzogcmVtb3ZlIGxhdGVyIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICBhY3RpdmVTZWxmLnRyYWlsLnJlaW5kZXgoKTtcclxuICAgIGFjdGl2ZU90aGVyLnRyYWlsLnJlaW5kZXgoKTtcclxuXHJcbiAgICBjb25zdCBwb2ludGVyID0gdGhpcy5jb3B5KCkgYXMgQWN0aXZlVHJhaWxQb2ludGVyO1xyXG4gICAgcG9pbnRlci50cmFpbC5zZXRNdXRhYmxlKCk7IC8vIHRoaXMgdHJhaWwgd2lsbCBiZSBtb2RpZmllZCBpbiB0aGUgaXRlcmF0aW9uLCBzbyByZWZlcmVuY2VzIHRvIGl0IG1heSBiZSBtb2RpZmllZFxyXG5cclxuICAgIGxldCBmaXJzdCA9IHRydWU7XHJcblxyXG4gICAgd2hpbGUgKCAhcG9pbnRlci5lcXVhbHNOZXN0ZWQoIG90aGVyICkgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHBvaW50ZXIuY29tcGFyZU5lc3RlZCggb3RoZXIgKSAhPT0gMSwgJ3NraXBwZWQgaW4gZGVwdGhGaXJzdFVudGlsJyApO1xyXG4gICAgICBsZXQgc2tpcFN1YnRyZWU6IGJvb2xlYW4gfCB2b2lkID0gZmFsc2U7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWludmFsaWQtdm9pZC10eXBlXHJcblxyXG4gICAgICBpZiAoIGZpcnN0ICkge1xyXG4gICAgICAgIC8vIHN0YXJ0IHBvaW50XHJcbiAgICAgICAgaWYgKCAhZXhjbHVkZUVuZHBvaW50cyApIHtcclxuICAgICAgICAgIHNraXBTdWJ0cmVlID0gY2FsbGJhY2soIHBvaW50ZXIgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZmlyc3QgPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICAvLyBiZXR3ZWVuIHBvaW50XHJcbiAgICAgICAgc2tpcFN1YnRyZWUgPSBjYWxsYmFjayggcG9pbnRlciApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIHNraXBTdWJ0cmVlICYmIHBvaW50ZXIuaXNCZWZvcmUgKSB7XHJcbiAgICAgICAgLy8gdG8gc2tpcCB0aGUgc3VidHJlZSwgd2UganVzdCBjaGFuZ2UgdG8gaXNBZnRlclxyXG4gICAgICAgIHBvaW50ZXIuc2V0QmVmb3JlKCBmYWxzZSApO1xyXG5cclxuICAgICAgICAvLyBpZiB3ZSBza2lwIGEgc3VidHJlZSwgbWFrZSBzdXJlIHdlIGRvbid0IHJ1biBwYXN0IHRoZSBlbmRpbmcgcG9pbnRlclxyXG4gICAgICAgIGlmICggcG9pbnRlci5jb21wYXJlTmVzdGVkKCBvdGhlciApID09PSAxICkge1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHBvaW50ZXIubmVzdGVkRm9yd2FyZHMoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGVuZCBwb2ludFxyXG4gICAgaWYgKCAhZXhjbHVkZUVuZHBvaW50cyApIHtcclxuICAgICAgY2FsbGJhY2soIHBvaW50ZXIgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBzdHJpbmcgZm9ybSBvZiB0aGlzIG9iamVjdFxyXG4gICAqL1xyXG4gIHB1YmxpYyB0b1N0cmluZygpOiBzdHJpbmcge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5pc0FjdGl2ZSgpICk7XHJcblxyXG4gICAgcmV0dXJuIGBbJHt0aGlzLmlzQmVmb3JlID8gJ2JlZm9yZScgOiAnYWZ0ZXInfSAkeyggdGhpcyBhcyBBY3RpdmVUcmFpbFBvaW50ZXIgKS50cmFpbC50b1N0cmluZygpLnNsaWNlKCAxICl9YDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNhbWUgYXMgbmV3IFRyYWlsUG9pbnRlciggdHJhaWxBLCBpc0JlZm9yZUEgKS5jb21wYXJlTmVzdGVkKCBuZXcgVHJhaWxQb2ludGVyKCB0cmFpbEIsIGlzQmVmb3JlQiApIClcclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGNvbXBhcmVOZXN0ZWQoIHRyYWlsQTogVHJhaWwsIGlzQmVmb3JlQTogYm9vbGVhbiwgdHJhaWxCOiBUcmFpbCwgaXNCZWZvcmVCOiBib29sZWFuICk6IG51bWJlciB7XHJcbiAgICBjb25zdCBjb21wYXJpc29uID0gdHJhaWxBLmNvbXBhcmUoIHRyYWlsQiApO1xyXG5cclxuICAgIGlmICggY29tcGFyaXNvbiA9PT0gMCApIHtcclxuICAgICAgLy8gaWYgdHJhaWxzIGFyZSBlcXVhbCwganVzdCBjb21wYXJlIGJlZm9yZS9hZnRlclxyXG4gICAgICBpZiAoIGlzQmVmb3JlQSA9PT0gaXNCZWZvcmVCICkge1xyXG4gICAgICAgIHJldHVybiAwO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBpc0JlZm9yZUEgPyAtMSA6IDE7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyBpZiBvbmUgaXMgYW4gZXh0ZW5zaW9uIG9mIHRoZSBvdGhlciwgdGhlIHNob3J0ZXIgaXNCZWZvcmUgZmxhZyBkZXRlcm1pbmVzIHRoZSBvcmRlciBjb21wbGV0ZWx5XHJcbiAgICAgIGlmICggdHJhaWxBLmlzRXh0ZW5zaW9uT2YoIHRyYWlsQiApICkge1xyXG4gICAgICAgIHJldHVybiBpc0JlZm9yZUIgPyAxIDogLTE7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIHRyYWlsQi5pc0V4dGVuc2lvbk9mKCB0cmFpbEEgKSApIHtcclxuICAgICAgICByZXR1cm4gaXNCZWZvcmVBID8gLTEgOiAxO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIC8vIG5laXRoZXIgaXMgYSBzdWJ0cmFpbCBvZiB0aGUgb3RoZXIsIHNvIGEgc3RyYWlnaHQgdHJhaWwgY29tcGFyaXNvbiBzaG91bGQgZ2l2ZSB0aGUgYW5zd2VyXHJcbiAgICAgICAgcmV0dXJuIGNvbXBhcmlzb247XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbnNjZW5lcnkucmVnaXN0ZXIoICdUcmFpbFBvaW50ZXInLCBUcmFpbFBvaW50ZXIgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBR0EsU0FBZUEsT0FBTyxRQUFlLGVBQWU7QUFPcEQsZUFBZSxNQUFNQyxZQUFZLENBQUM7RUFNaEM7QUFDRjtBQUNBO0FBQ0E7RUFDU0MsV0FBV0EsQ0FBRUMsS0FBWSxFQUFFQyxRQUFpQixFQUFHO0lBQ3BELElBQUksQ0FBQ0QsS0FBSyxHQUFHQSxLQUFLO0lBQ2xCLElBQUksQ0FBQ0UsU0FBUyxDQUFFRCxRQUFTLENBQUM7RUFDNUI7RUFFT0UsUUFBUUEsQ0FBQSxFQUErQjtJQUM1QyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUNILEtBQUs7RUFDckI7RUFFT0ksSUFBSUEsQ0FBQSxFQUFpQjtJQUMxQkMsTUFBTSxJQUFJQSxNQUFNLENBQUUsSUFBSSxDQUFDRixRQUFRLENBQUMsQ0FBRSxDQUFDO0lBQ25DLE9BQU8sSUFBSUwsWUFBWSxDQUFJLElBQUksQ0FBeUJFLEtBQUssQ0FBQ0ksSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUNILFFBQVMsQ0FBQztFQUN2RjtFQUVPQyxTQUFTQSxDQUFFRCxRQUFpQixFQUFTO0lBQzFDLElBQUksQ0FBQ0EsUUFBUSxHQUFHQSxRQUFRO0lBQ3hCLElBQUksQ0FBQ0ssT0FB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