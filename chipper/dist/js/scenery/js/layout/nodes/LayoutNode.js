// Copyright 2022-2024, University of Colorado Boulder

/**
 * Supertype for layout Nodes
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Vector2 from '../../../../dot/js/Vector2.js';
import Vector2Property from '../../../../dot/js/Vector2Property.js';
import { Node, scenery, Sizable } from '../../imports.js';
export const LAYOUT_NODE_OPTION_KEYS = ['resize', 'layoutOrigin'];
export default class LayoutNode extends Sizable(Node) {
  // Can't be readonly because the subtype sets this

  layoutOriginProperty = new Vector2Property(Vector2.ZERO);
  constructor(providedOptions) {
    super(providedOptions);
  }
  linkLayoutBounds() {
    // Adjust the localBounds to be the laid-out area (defined by the constraint)
    this._constraint.layoutBoundsProperty.link(layoutBounds => {
      this.localBounds = layoutBounds;
    });
  }
  setExcludeInvisibleChildrenFromBounds(excludeInvisibleChildrenFromBounds) {
    super.setExcludeInvisibleChildrenFromBounds(excludeInvisibleChildrenFromBounds);
    this._constraint.excludeInvisible = excludeInvisibleChildrenFromBounds;
  }
  setChildren(children) {
    // If the layout is already locked, we need to bail and only call Node's setChildren. This is fine, our layout will
    // be handled once whatever locked us unlocks (so we don't have to override to handle layout or locking/unlocking.
    if (this.constraint.isLocked) {
      return super.setChildren(children);
    }
    const oldChildren = this.getChildren(); // defensive copy

    // Lock layout while the children are removed and added
    this.constraint.lock();
    super.setChildren(children);
    this.constraint.unlock();

    // Determine if the children array has changed. We'll gain a performance benefit by not triggering layout when
    // the children haven't changed.
    if (!_.isEqual(oldChildren, children)) {
      this.constraint.updateLayoutAutomatically();
    }
    return this;
  }

  /**
   * Manually run the layout (for instance, if resize:false is currently set, or if there is other hackery going on).
   */
  updateLayout() {
    this._constraint.updateLayout();
  }
  get resize() {
    return this._constraint.enabled;
  }
  set resize(value) {
    this._constraint.enabled = value;
  }
  get layoutOrigin() {
    return this.layoutOriginProperty.value;
  }
  set layoutOrigin(value) {
    this.layoutOriginProperty.value = value;
  }

  /**
   * Manual access to the constraint. This is needed by subtypes to lock/unlock or force layout updates, but may also
   * be needed to read layout information out (for overlays, GridBackgroundNode, etc.)
   */
  get constraint() {
    return this._constraint;
  }

  /**
   * Releases references
   */
  dispose() {
    this._constraint.dispose();
    super.dispose();
  }
}
scenery.register('LayoutNode', LayoutNode);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJWZWN0b3IyIiwiVmVjdG9yMlByb3BlcnR5IiwiTm9kZSIsInNjZW5lcnkiLCJTaXphYmxlIiwiTEFZT1VUX05PREVfT1BUSU9OX0tFWVMiLCJMYXlvdXROb2RlIiwibGF5b3V0T3JpZ2luUHJvcGVydHkiLCJaRVJPIiwiY29uc3RydWN0b3IiLCJwcm92aWRlZE9wdGlvbnMiLCJsaW5rTGF5b3V0Qm91bmRzIiwiX2NvbnN0cmFpbnQiLCJsYXlvdXRCb3VuZHNQcm9wZXJ0eSIsImxpbmsiLCJsYXlvdXRCb3VuZHMiLCJsb2NhbEJvdW5kcyIsInNldEV4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMiLCJleGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzIiwiZXhjbHVkZUludmlzaWJsZSIsInNldENoaWxkcmVuIiwiY2hpbGRyZW4iLCJjb25zdHJhaW50IiwiaXNMb2NrZWQiLCJvbGRDaGlsZHJlbiIsImdldENoaWxkcmVuIiwibG9jayIsInVubG9jayIsIl8iLCJpc0VxdWFsIiwidXBkYXRlTGF5b3V0QXV0b21hdGljYWxseSIsInVwZGF0ZUxheW91dCIsInJlc2l6ZSIsImVuYWJsZWQiLCJ2YWx1ZSIsImxheW91dE9yaWdpbiIsImRpc3Bvc2UiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkxheW91dE5vZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjItMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogU3VwZXJ0eXBlIGZvciBsYXlvdXQgTm9kZXNcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBUUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9UUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgVmVjdG9yMiBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvVmVjdG9yMi5qcyc7XHJcbmltcG9ydCBWZWN0b3IyUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL1ZlY3RvcjJQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCB7IE5vZGUsIE5vZGVMYXlvdXRDb25zdHJhaW50LCBOb2RlT3B0aW9ucywgc2NlbmVyeSwgU2l6YWJsZSwgU2l6YWJsZU9wdGlvbnMgfSBmcm9tICcuLi8uLi9pbXBvcnRzLmpzJztcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcbiAgLy8gQ29udHJvbHMgd2hldGhlciB0aGUgbGF5b3V0IGNvbnRhaW5lciB3aWxsIHJlLXRyaWdnZXIgbGF5b3V0IGF1dG9tYXRpY2FsbHkgYWZ0ZXIgdGhlIFwiZmlyc3RcIiBsYXlvdXQgZHVyaW5nXHJcbiAgLy8gY29uc3RydWN0aW9uLiBUaGUgbGF5b3V0IGNvbnRhaW5lciB3aWxsIGxheW91dCBvbmNlIGFmdGVyIHByb2Nlc3NpbmcgdGhlIG9wdGlvbnMgb2JqZWN0LCBidXQgaWYgcmVzaXplOmZhbHNlLFxyXG4gIC8vIHRoZW4gYWZ0ZXIgdGhhdCBtYW51YWwgbGF5b3V0IGNhbGxzIHdpbGwgbmVlZCB0byBiZSBkb25lICh3aXRoIHVwZGF0ZUxheW91dCgpKVxyXG4gIHJlc2l6ZT86IGJvb2xlYW47XHJcblxyXG4gIC8vIENvbnRyb2xzIHdoZXJlIHRoZSBvcmlnaW4gb2YgdGhlIFwibGF5b3V0XCIgaXMgcGxhY2VkICh1c3VhbGx5IHdpdGhpbiB0aGUgTm9kZSBpdHNlbGYpLiBGb3IgdHlwaWNhbCB1c2FnZXMsIHRoaXMgd2lsbFxyXG4gIC8vIGJlICgwLDApIGFuZCB0aGUgdXBwZXItbGVmdCBvZiB0aGUgY29udGVudCB3aWxsIGJlIHBsYWNlZCB0aGVyZS4gYGxheW91dE9yaWdpbmAgd2lsbCBhZGp1c3QgdGhpcyBwb2ludC5cclxuICAvLyBOT1RFOiBJZiB0aGVyZSBpcyBvcmlnaW4tYmFzZWQgY29udGVudCwgdGhhdCBjb250ZW50IHdpbGwgYmUgcGxhY2VkIGF0IHRoaXMgb3JpZ2luIChhbmQgbWF5IGdvIHRvIHRoZSB0b3AvbGVmdCBvZlxyXG4gIC8vIHRoaXMgbGF5b3V0T3JpZ2luKS5cclxuICBsYXlvdXRPcmlnaW4/OiBWZWN0b3IyO1xyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IExBWU9VVF9OT0RFX09QVElPTl9LRVlTID0gWyAncmVzaXplJywgJ2xheW91dE9yaWdpbicgXSBhcyBjb25zdDtcclxuXHJcbnR5cGUgUGFyZW50T3B0aW9ucyA9IE5vZGVPcHRpb25zICYgU2l6YWJsZU9wdGlvbnM7XHJcblxyXG5leHBvcnQgdHlwZSBMYXlvdXROb2RlT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgUGFyZW50T3B0aW9ucztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFic3RyYWN0IGNsYXNzIExheW91dE5vZGU8Q29uc3RyYWludCBleHRlbmRzIE5vZGVMYXlvdXRDb25zdHJhaW50PiBleHRlbmRzIFNpemFibGUoIE5vZGUgKSB7XHJcblxyXG4gIHByb3RlY3RlZCBfY29uc3RyYWludCE6IENvbnN0cmFpbnQ7IC8vIENhbid0IGJlIHJlYWRvbmx5IGJlY2F1c2UgdGhlIHN1YnR5cGUgc2V0cyB0aGlzXHJcblxyXG4gIHB1YmxpYyByZWFkb25seSBsYXlvdXRPcmlnaW5Qcm9wZXJ0eTogVFByb3BlcnR5PFZlY3RvcjI+ID0gbmV3IFZlY3RvcjJQcm9wZXJ0eSggVmVjdG9yMi5aRVJPICk7XHJcblxyXG4gIHByb3RlY3RlZCBjb25zdHJ1Y3RvciggcHJvdmlkZWRPcHRpb25zPzogTGF5b3V0Tm9kZU9wdGlvbnMgKSB7XHJcbiAgICBzdXBlciggcHJvdmlkZWRPcHRpb25zICk7XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgbGlua0xheW91dEJvdW5kcygpOiB2b2lkIHtcclxuICAgIC8vIEFkanVzdCB0aGUgbG9jYWxCb3VuZHMgdG8gYmUgdGhlIGxhaWQtb3V0IGFyZWEgKGRlZmluZWQgYnkgdGhlIGNvbnN0cmFpbnQpXHJcbiAgICB0aGlzLl9jb25zdHJhaW50LmxheW91dEJvdW5kc1Byb3BlcnR5LmxpbmsoIGxheW91dEJvdW5kcyA9PiB7XHJcbiAgICAgIHRoaXMubG9jYWxCb3VuZHMgPSBsYXlvdXRCb3VuZHM7XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgc2V0RXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcyggZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kczogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIHN1cGVyLnNldEV4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMoIGV4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMgKTtcclxuXHJcbiAgICB0aGlzLl9jb25zdHJhaW50LmV4Y2x1ZGVJbnZpc2libGUgPSBleGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG92ZXJyaWRlIHNldENoaWxkcmVuKCBjaGlsZHJlbjogTm9kZVtdICk6IHRoaXMge1xyXG5cclxuICAgIC8vIElmIHRoZSBsYXlvdXQgaXMgYWxyZWFkeSBsb2NrZWQsIHdlIG5lZWQgdG8gYmFpbCBhbmQgb25seSBjYWxsIE5vZGUncyBzZXRDaGlsZHJlbi4gVGhpcyBpcyBmaW5lLCBvdXIgbGF5b3V0IHdpbGxcclxuICAgIC8vIGJlIGhhbmRsZWQgb25jZSB3aGF0ZXZlciBsb2NrZWQgdXMgdW5sb2NrcyAoc28gd2UgZG9uJ3QgaGF2ZSB0byBvdmVycmlkZSB0byBoYW5kbGUgbGF5b3V0IG9yIGxvY2tpbmcvdW5sb2NraW5nLlxyXG4gICAgaWYgKCB0aGlzLmNvbnN0cmFpbnQuaXNMb2NrZWQgKSB7XHJcbiAgICAgIHJldHVybiBzdXBlci5zZXRDaGlsZHJlbiggY2hpbGRyZW4gKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBvbGRDaGlsZHJlbiA9IHRoaXMuZ2V0Q2hpbGRyZW4oKTsgLy8gZGVmZW5zaXZlIGNvcHlcclxuXHJcbiAgICAvLyBMb2NrIGxheW91dCB3aGlsZSB0aGUgY2hpbGRyZW4gYXJlIHJlbW92ZWQgYW5kIGFkZGVkXHJcbiAgICB0aGlzLmNvbnN0cmFpbnQubG9jaygpO1xyXG4gICAgc3VwZXIuc2V0Q2hpbGRyZW4oIGNoaWxkcmVuICk7XHJcbiAgICB0aGlzLmNvbnN0cmFpbnQudW5sb2NrKCk7XHJcblxyXG4gICAgLy8gRGV0ZXJtaW5lIGlmIHRoZSBjaGlsZHJlbiBhcnJheSBoYXMgY2hhbmdlZC4gV2UnbGwgZ2FpbiBhIHBlcmZvcm1hbmNlIGJlbmVmaXQgYnkgbm90IHRyaWdnZXJpbmcgbGF5b3V0IHdoZW5cclxuICAgIC8vIHRoZSBjaGlsZHJlbiBoYXZlbid0IGNoYW5nZWQuXHJcbiAgICBpZiAoICFfLmlzRXF1YWwoIG9sZENoaWxkcmVuLCBjaGlsZHJlbiApICkge1xyXG4gICAgICB0aGlzLmNvbnN0cmFpbnQudXBkYXRlTGF5b3V0QXV0b21hdGljYWxseSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFudWFsbHkgcnVuIHRoZSBsYXlvdXQgKGZvciBpbnN0YW5jZSwgaWYgcmVzaXplOmZhbHNlIGlzIGN1cnJlbnRseSBzZXQsIG9yIGlmIHRoZXJlIGlzIG90aGVyIGhhY2tlcnkgZ29pbmcgb24pLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB1cGRhdGVMYXlvdXQoKTogdm9pZCB7XHJcbiAgICB0aGlzLl9jb25zdHJhaW50LnVwZGF0ZUxheW91dCgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCByZXNpemUoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5fY29uc3RyYWludC5lbmFibGVkO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCByZXNpemUoIHZhbHVlOiBib29sZWFuICkge1xyXG4gICAgdGhpcy5fY29uc3RyYWludC5lbmFibGVkID0gdmFsdWU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGxheW91dE9yaWdpbigpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLmxheW91dE9yaWdpblByb3BlcnR5LnZhbHVlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBsYXlvdXRPcmlnaW4oIHZhbHVlOiBWZWN0b3IyICkge1xyXG4gICAgdGhpcy5sYXlvdXRPcmlnaW5Qcm9wZXJ0eS52YWx1ZSA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFudWFsIGFjY2VzcyB0byB0aGUgY29uc3RyYWludC4gVGhpcyBpcyBuZWVkZWQgYnkgc3VidHlwZXMgdG8gbG9jay91bmxvY2sgb3IgZm9yY2UgbGF5b3V0IHVwZGF0ZXMsIGJ1dCBtYXkgYWxzb1xyXG4gICAqIGJlIG5lZWRlZCB0byByZWFkIGxheW91dCBpbmZvcm1hdGlvbiBvdXQgKGZvciBvdmVybGF5cywgR3JpZEJhY2tncm91bmROb2RlLCBldGMuKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgY29uc3RyYWludCgpOiBDb25zdHJhaW50IHtcclxuICAgIHJldHVybiB0aGlzLl9jb25zdHJhaW50O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVsZWFzZXMgcmVmZXJlbmNlc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5fY29uc3RyYWludC5kaXNwb3NlKCk7XHJcblxyXG4gICAgc3VwZXIuZGlzcG9zZSgpO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ0xheW91dE5vZGUnLCBMYXlvdXROb2RlICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUdBLE9BQU9BLE9BQU8sTUFBTSwrQkFBK0I7QUFDbkQsT0FBT0MsZUFBZSxNQUFNLHVDQUF1QztBQUNuRSxTQUFTQyxJQUFJLEVBQXFDQyxPQUFPLEVBQUVDLE9BQU8sUUFBd0Isa0JBQWtCO0FBZTVHLE9BQU8sTUFBTUMsdUJBQXVCLEdBQUcsQ0FBRSxRQUFR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