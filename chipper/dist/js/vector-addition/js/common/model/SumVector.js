// Copyright 2019-2023, University of Colorado Boulder

/**
 * SumVector is the model of a sum vector. A sum vector is the sum of all vectors for one VectorSet.
 * However, it's not as simple as just a quick add up, as vectors can change states and go from being on the graph to
 * off of the graph or vise versa.
 *
 * SumVectors can be directly manipulated. They can be translated, but not rotated or scale.
 *
 * SumVectors are created at the start of the sim, and exist for the lifetime of the sim.
 *
 * @author Martin Veillette
 * @author Brandon Li
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import Multilink from '../../../../axon/js/Multilink.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import merge from '../../../../phet-core/js/merge.js';
import vectorAddition from '../../vectorAddition.js';
import Vector from './Vector.js';
// constants
const SUM_VECTOR_OPTIONS = {
  isTipDraggable: false,
  // Sum vectors are not draggable by the tip.
  isRemovable: false,
  // Sum vectors are not removable which means they are also not disposable
  isOnGraphInitially: true,
  // Sum vectors are always on the graph
  isDisposable: false
};
export default class SumVector extends Vector {
  // Whether the sum is defined.  The sum is defined if there is at least one vector on the graph. It would be
  // preferable to set its Vector2 value to null, but this was discovered very late in development, when that
  // was not practical. See https://github.com/phetsims/vector-addition/issues/187

  /**
   * @param initialTailPosition - starting tail position of the vector
   * @param graph - graph the sum vector belongs to
   * @param vectorSet - the VectorSet that the sum represents
   * @param symbol - the symbol for the sum vector (e.g. 's', 'c', 'f')
   */
  constructor(initialTailPosition, graph, vectorSet, symbol) {
    // Initialize an arbitrary vector model. Its components and magnitude to be set later.
    super(initialTailPosition, Vector2.ZERO, graph, vectorSet, symbol, SUM_VECTOR_OPTIONS);
    this.isDefinedProperty = new BooleanProperty(vectorSet.vectors.lengthProperty.value > 0);

    // Observe changes to the vector array. Never removed because SumVectors exists for the lifetime of the sim.
    vectorSet.vectors.addItemAddedListener(addedVector => {
      // When the vector changes, update the sum calculation. unmultilink is required when the vector is removed.
      const addedVectorMultilink = Multilink.multilink([addedVector.vectorComponentsProperty, addedVector.isOnGraphProperty], () => {
        this.updateSum(vectorSet.vectors);
      });

      // If the vector is removed, dispose of the multilink
      const vectorRemovedListener = removedVector => {
        if (removedVector === addedVector) {
          // Recalculate the sum
          this.updateSum(vectorSet.vectors);
          Multilink.unmultilink(addedVectorMultilink);
          vectorSet.vectors.removeItemRemovedListener(vectorRemovedListener);
        }
      };
      vectorSet.vectors.addItemRemovedListener(vectorRemovedListener);
    });
  }

  /**
   * Update the sum vector components. Calculated from all the vectors that are on the graph.
   */
  updateSum(vectors) {
    // Filter to get only the vectors that are on the graph
    const onGraphVectors = vectors.filter(vector => {
      return vector.isOnGraphProperty.value;
    });

    // Loop through and calculate the sum of all vectors that are on the graph
    const sumVectorComponents = new Vector2(0, 0);
    onGraphVectors.forEach(vector => {
      sumVectorComponents.add(vector.vectorComponents);
    });

    // Set the sum to the calculated sum
    this.vectorComponents = sumVectorComponents;

    // The sum is defined if there is at least one vector on the graph.
    this.isDefinedProperty.value = onGraphVectors.length > 0;
  }

  /**
   * See RootVector.getLabelDisplayData for details.
   */
  getLabelDisplayData(valuesVisible) {
    // The sum vector displays its symbol when:
    // - there is only one sum vector on the graph (see #241), or
    // - the sum vector is selected, or
    // - a vector in the sum's vector set is selected
    const activeVector = this.graph.activeVectorProperty.value;
    const isSymbolDisplayed = this.graph.vectorSets.length === 1 || activeVector === this || this.vectorSet.vectors.some(vector => vector === activeVector);
    if (isSymbolDisplayed) {
      // No change in behavior - do like we do for other vectors.
      return super.getLabelDisplayData(valuesVisible);
    } else {
      // Omit the symbol, display only the value, if values are visible.
      return merge(super.getLabelDisplayData(valuesVisible), {
        symbol: null,
        includeAbsoluteValueBars: false,
        magnitude: valuesVisible ? this.magnitude : null
      });
    }
  }
}
vectorAddition.register('SumVector', SumVector);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJNdWx0aWxpbmsiLCJWZWN0b3IyIiwibWVyZ2UiLCJ2ZWN0b3JBZGRpdGlvbiIsIlZlY3RvciIsIlNVTV9WRUNUT1JfT1BUSU9OUyIsImlzVGlwRHJhZ2dhYmxlIiwiaXNSZW1vdmFibGUiLCJpc09uR3JhcGhJbml0aWFsbHkiLCJpc0Rpc3Bvc2FibGUiLCJTdW1WZWN0b3IiLCJjb25zdHJ1Y3RvciIsImluaXRpYWxUYWlsUG9zaXRpb24iLCJncmFwaCIsInZlY3RvclNldCIsInN5bWJvbCIsIlpFUk8iLCJpc0RlZmluZWRQcm9wZXJ0eSIsInZlY3RvcnMiLCJsZW5ndGhQcm9wZXJ0eSIsInZhbHVlIiwiYWRkSXRlbUFkZGVkTGlzdGVuZXIiLCJhZGRlZFZlY3RvciIsImFkZGVkVmVjdG9yTXVsdGlsaW5rIiwibXVsdGlsaW5rIiwidmVjdG9yQ29tcG9uZW50c1Byb3BlcnR5IiwiaXNPbkdyYXBoUHJvcGVydHkiLCJ1cGRhdGVTdW0iLCJ2ZWN0b3JSZW1vdmVkTGlzdGVuZXIiLCJyZW1vdmVkVmVjdG9yIiwidW5tdWx0aWxpbmsiLCJyZW1vdmVJdGVtUmVtb3ZlZExpc3RlbmVyIiwiYWRkSXRlbVJlbW92ZWRMaXN0ZW5lciIsIm9uR3JhcGhWZWN0b3JzIiwiZmlsdGVyIiwidmVjdG9yIiwic3VtVmVjdG9yQ29tcG9uZW50cyIsImZvckVhY2giLCJhZGQiLCJ2ZWN0b3JDb21wb25lbnRzIiwibGVuZ3RoIiwiZ2V0TGFiZWxEaXNwbGF5RGF0YSIsInZhbHVlc1Zpc2libGUiLCJhY3RpdmVWZWN0b3IiLCJhY3RpdmVWZWN0b3JQcm9wZXJ0eSIsImlzU3ltYm9sRGlzcGxheWVkIiwidmVjdG9yU2V0cyIsInNvbWUiLCJpbmNsdWRlQWJzb2x1dGVWYWx1ZUJhcnMiLCJtYWduaXR1ZGUiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlN1bVZlY3Rvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOS0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBTdW1WZWN0b3IgaXMgdGhlIG1vZGVsIG9mIGEgc3VtIHZlY3Rvci4gQSBzdW0gdmVjdG9yIGlzIHRoZSBzdW0gb2YgYWxsIHZlY3RvcnMgZm9yIG9uZSBWZWN0b3JTZXQuXHJcbiAqIEhvd2V2ZXIsIGl0J3Mgbm90IGFzIHNpbXBsZSBhcyBqdXN0IGEgcXVpY2sgYWRkIHVwLCBhcyB2ZWN0b3JzIGNhbiBjaGFuZ2Ugc3RhdGVzIGFuZCBnbyBmcm9tIGJlaW5nIG9uIHRoZSBncmFwaCB0b1xyXG4gKiBvZmYgb2YgdGhlIGdyYXBoIG9yIHZpc2UgdmVyc2EuXHJcbiAqXHJcbiAqIFN1bVZlY3RvcnMgY2FuIGJlIGRpcmVjdGx5IG1hbmlwdWxhdGVkLiBUaGV5IGNhbiBiZSB0cmFuc2xhdGVkLCBidXQgbm90IHJvdGF0ZWQgb3Igc2NhbGUuXHJcbiAqXHJcbiAqIFN1bVZlY3RvcnMgYXJlIGNyZWF0ZWQgYXQgdGhlIHN0YXJ0IG9mIHRoZSBzaW0sIGFuZCBleGlzdCBmb3IgdGhlIGxpZmV0aW1lIG9mIHRoZSBzaW0uXHJcbiAqXHJcbiAqIEBhdXRob3IgTWFydGluIFZlaWxsZXR0ZVxyXG4gKiBAYXV0aG9yIEJyYW5kb24gTGlcclxuICovXHJcblxyXG5pbXBvcnQgQm9vbGVhblByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvQm9vbGVhblByb3BlcnR5LmpzJztcclxuaW1wb3J0IE11bHRpbGluayBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL011bHRpbGluay5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IG1lcmdlIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9tZXJnZS5qcyc7XHJcbmltcG9ydCB2ZWN0b3JBZGRpdGlvbiBmcm9tICcuLi8uLi92ZWN0b3JBZGRpdGlvbi5qcyc7XHJcbmltcG9ydCBWZWN0b3IgZnJvbSAnLi9WZWN0b3IuanMnO1xyXG5pbXBvcnQgR3JhcGggZnJvbSAnLi9HcmFwaC5qcyc7XHJcbmltcG9ydCBWZWN0b3JTZXQgZnJvbSAnLi9WZWN0b3JTZXQuanMnO1xyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCB7IE9ic2VydmFibGVBcnJheSB9IGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvY3JlYXRlT2JzZXJ2YWJsZUFycmF5LmpzJztcclxuaW1wb3J0IHsgTGFiZWxEaXNwbGF5RGF0YSB9IGZyb20gJy4vUm9vdFZlY3Rvci5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgU1VNX1ZFQ1RPUl9PUFRJT05TID0ge1xyXG4gIGlzVGlwRHJhZ2dhYmxlOiBmYWxzZSwgLy8gU3VtIHZlY3RvcnMgYXJlIG5vdCBkcmFnZ2FibGUgYnkgdGhlIHRpcC5cclxuICBpc1JlbW92YWJsZTogZmFsc2UsIC8vIFN1bSB2ZWN0b3JzIGFyZSBub3QgcmVtb3ZhYmxlIHdoaWNoIG1lYW5zIHRoZXkgYXJlIGFsc28gbm90IGRpc3Bvc2FibGVcclxuICBpc09uR3JhcGhJbml0aWFsbHk6IHRydWUsIC8vIFN1bSB2ZWN0b3JzIGFyZSBhbHdheXMgb24gdGhlIGdyYXBoXHJcbiAgaXNEaXNwb3NhYmxlOiBmYWxzZVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3VtVmVjdG9yIGV4dGVuZHMgVmVjdG9yIHtcclxuXHJcbiAgLy8gV2hldGhlciB0aGUgc3VtIGlzIGRlZmluZWQuICBUaGUgc3VtIGlzIGRlZmluZWQgaWYgdGhlcmUgaXMgYXQgbGVhc3Qgb25lIHZlY3RvciBvbiB0aGUgZ3JhcGguIEl0IHdvdWxkIGJlXHJcbiAgLy8gcHJlZmVyYWJsZSB0byBzZXQgaXRzIFZlY3RvcjIgdmFsdWUgdG8gbnVsbCwgYnV0IHRoaXMgd2FzIGRpc2NvdmVyZWQgdmVyeSBsYXRlIGluIGRldmVsb3BtZW50LCB3aGVuIHRoYXRcclxuICAvLyB3YXMgbm90IHByYWN0aWNhbC4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy92ZWN0b3ItYWRkaXRpb24vaXNzdWVzLzE4N1xyXG4gIHB1YmxpYyByZWFkb25seSBpc0RlZmluZWRQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBpbml0aWFsVGFpbFBvc2l0aW9uIC0gc3RhcnRpbmcgdGFpbCBwb3NpdGlvbiBvZiB0aGUgdmVjdG9yXHJcbiAgICogQHBhcmFtIGdyYXBoIC0gZ3JhcGggdGhlIHN1bSB2ZWN0b3IgYmVsb25ncyB0b1xyXG4gICAqIEBwYXJhbSB2ZWN0b3JTZXQgLSB0aGUgVmVjdG9yU2V0IHRoYXQgdGhlIHN1bSByZXByZXNlbnRzXHJcbiAgICogQHBhcmFtIHN5bWJvbCAtIHRoZSBzeW1ib2wgZm9yIHRoZSBzdW0gdmVjdG9yIChlLmcuICdzJywgJ2MnLCAnZicpXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBpbml0aWFsVGFpbFBvc2l0aW9uOiBWZWN0b3IyLCBncmFwaDogR3JhcGgsIHZlY3RvclNldDogVmVjdG9yU2V0LCBzeW1ib2w6IHN0cmluZyB8IG51bGwgKSB7XHJcblxyXG4gICAgLy8gSW5pdGlhbGl6ZSBhbiBhcmJpdHJhcnkgdmVjdG9yIG1vZGVsLiBJdHMgY29tcG9uZW50cyBhbmQgbWFnbml0dWRlIHRvIGJlIHNldCBsYXRlci5cclxuICAgIHN1cGVyKCBpbml0aWFsVGFpbFBvc2l0aW9uLCBWZWN0b3IyLlpFUk8sIGdyYXBoLCB2ZWN0b3JTZXQsIHN5bWJvbCwgU1VNX1ZFQ1RPUl9PUFRJT05TICk7XHJcblxyXG4gICAgdGhpcy5pc0RlZmluZWRQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIHZlY3RvclNldC52ZWN0b3JzLmxlbmd0aFByb3BlcnR5LnZhbHVlID4gMCApO1xyXG5cclxuICAgIC8vIE9ic2VydmUgY2hhbmdlcyB0byB0aGUgdmVjdG9yIGFycmF5LiBOZXZlciByZW1vdmVkIGJlY2F1c2UgU3VtVmVjdG9ycyBleGlzdHMgZm9yIHRoZSBsaWZldGltZSBvZiB0aGUgc2ltLlxyXG4gICAgdmVjdG9yU2V0LnZlY3RvcnMuYWRkSXRlbUFkZGVkTGlzdGVuZXIoIGFkZGVkVmVjdG9yID0+IHtcclxuXHJcbiAgICAgIC8vIFdoZW4gdGhlIHZlY3RvciBjaGFuZ2VzLCB1cGRhdGUgdGhlIHN1bSBjYWxjdWxhdGlvbi4gdW5tdWx0aWxpbmsgaXMgcmVxdWlyZWQgd2hlbiB0aGUgdmVjdG9yIGlzIHJlbW92ZWQuXHJcbiAgICAgIGNvbnN0IGFkZGVkVmVjdG9yTXVsdGlsaW5rID0gTXVsdGlsaW5rLm11bHRpbGluayhcclxuICAgICAgICBbIGFkZGVkVmVjdG9yLnZlY3RvckNvbXBvbmVudHNQcm9wZXJ0eSwgYWRkZWRWZWN0b3IuaXNPbkdyYXBoUHJvcGVydHkgXSwgKCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy51cGRhdGVTdW0oIHZlY3RvclNldC52ZWN0b3JzICk7XHJcbiAgICAgICAgfSApO1xyXG5cclxuICAgICAgLy8gSWYgdGhlIHZlY3RvciBpcyByZW1vdmVkLCBkaXNwb3NlIG9mIHRoZSBtdWx0aWxpbmtcclxuICAgICAgY29uc3QgdmVjdG9yUmVtb3ZlZExpc3RlbmVyID0gKCByZW1vdmVkVmVjdG9yOiBWZWN0b3IgKSA9PiB7XHJcbiAgICAgICAgaWYgKCByZW1vdmVkVmVjdG9yID09PSBhZGRlZFZlY3RvciApIHtcclxuXHJcbiAgICAgICAgICAvLyBSZWNhbGN1bGF0ZSB0aGUgc3VtXHJcbiAgICAgICAgICB0aGlzLnVwZGF0ZVN1bSggdmVjdG9yU2V0LnZlY3RvcnMgKTtcclxuXHJcbiAgICAgICAgICBNdWx0aWxpbmsudW5tdWx0aWxpbmsoIGFkZGVkVmVjdG9yTXVsdGlsaW5rICk7XHJcbiAgICAgICAgICB2ZWN0b3JTZXQudmVjdG9ycy5yZW1vdmVJdGVtUmVtb3ZlZExpc3RlbmVyKCB2ZWN0b3JSZW1vdmVkTGlzdGVuZXIgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICB2ZWN0b3JTZXQudmVjdG9ycy5hZGRJdGVtUmVtb3ZlZExpc3RlbmVyKCB2ZWN0b3JSZW1vdmVkTGlzdGVuZXIgKTtcclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwZGF0ZSB0aGUgc3VtIHZlY3RvciBjb21wb25lbnRzLiBDYWxjdWxhdGVkIGZyb20gYWxsIHRoZSB2ZWN0b3JzIHRoYXQgYXJlIG9uIHRoZSBncmFwaC5cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgdXBkYXRlU3VtKCB2ZWN0b3JzOiBPYnNlcnZhYmxlQXJyYXk8VmVjdG9yPiApOiB2b2lkIHtcclxuXHJcbiAgICAvLyBGaWx0ZXIgdG8gZ2V0IG9ubHkgdGhlIHZlY3RvcnMgdGhhdCBhcmUgb24gdGhlIGdyYXBoXHJcbiAgICBjb25zdCBvbkdyYXBoVmVjdG9ycyA9IHZlY3RvcnMuZmlsdGVyKCB2ZWN0b3IgPT4ge1xyXG4gICAgICByZXR1cm4gdmVjdG9yLmlzT25HcmFwaFByb3BlcnR5LnZhbHVlO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIExvb3AgdGhyb3VnaCBhbmQgY2FsY3VsYXRlIHRoZSBzdW0gb2YgYWxsIHZlY3RvcnMgdGhhdCBhcmUgb24gdGhlIGdyYXBoXHJcbiAgICBjb25zdCBzdW1WZWN0b3JDb21wb25lbnRzID0gbmV3IFZlY3RvcjIoIDAsIDAgKTtcclxuXHJcbiAgICBvbkdyYXBoVmVjdG9ycy5mb3JFYWNoKCB2ZWN0b3IgPT4ge1xyXG4gICAgICBzdW1WZWN0b3JDb21wb25lbnRzLmFkZCggdmVjdG9yLnZlY3RvckNvbXBvbmVudHMgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBTZXQgdGhlIHN1bSB0byB0aGUgY2FsY3VsYXRlZCBzdW1cclxuICAgIHRoaXMudmVjdG9yQ29tcG9uZW50cyA9IHN1bVZlY3RvckNvbXBvbmVudHM7XHJcblxyXG4gICAgLy8gVGhlIHN1bSBpcyBkZWZpbmVkIGlmIHRoZXJlIGlzIGF0IGxlYXN0IG9uZSB2ZWN0b3Igb24gdGhlIGdyYXBoLlxyXG4gICAgdGhpcy5pc0RlZmluZWRQcm9wZXJ0eS52YWx1ZSA9ICggb25HcmFwaFZlY3RvcnMubGVuZ3RoID4gMCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIFJvb3RWZWN0b3IuZ2V0TGFiZWxEaXNwbGF5RGF0YSBmb3IgZGV0YWlscy5cclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgZ2V0TGFiZWxEaXNwbGF5RGF0YSggdmFsdWVzVmlzaWJsZTogYm9vbGVhbiApOiBMYWJlbERpc3BsYXlEYXRhIHtcclxuXHJcbiAgICAvLyBUaGUgc3VtIHZlY3RvciBkaXNwbGF5cyBpdHMgc3ltYm9sIHdoZW46XHJcbiAgICAvLyAtIHRoZXJlIGlzIG9ubHkgb25lIHN1bSB2ZWN0b3Igb24gdGhlIGdyYXBoIChzZWUgIzI0MSksIG9yXHJcbiAgICAvLyAtIHRoZSBzdW0gdmVjdG9yIGlzIHNlbGVjdGVkLCBvclxyXG4gICAgLy8gLSBhIHZlY3RvciBpbiB0aGUgc3VtJ3MgdmVjdG9yIHNldCBpcyBzZWxlY3RlZFxyXG4gICAgY29uc3QgYWN0aXZlVmVjdG9yID0gdGhpcy5ncmFwaC5hY3RpdmVWZWN0b3JQcm9wZXJ0eS52YWx1ZTtcclxuICAgIGNvbnN0IGlzU3ltYm9sRGlzcGxheWVkID0gdGhpcy5ncmFwaC52ZWN0b3JTZXRzLmxlbmd0aCA9PT0gMSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmVWZWN0b3IgPT09IHRoaXMgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52ZWN0b3JTZXQudmVjdG9ycy5zb21lKCB2ZWN0b3IgPT4gdmVjdG9yID09PSBhY3RpdmVWZWN0b3IgKTtcclxuXHJcbiAgICBpZiAoIGlzU3ltYm9sRGlzcGxheWVkICkge1xyXG5cclxuICAgICAgLy8gTm8gY2hhbmdlIGluIGJlaGF2aW9yIC0gZG8gbGlrZSB3ZSBkbyBmb3Igb3RoZXIgdmVjdG9ycy5cclxuICAgICAgcmV0dXJuIHN1cGVyLmdldExhYmVsRGlzcGxheURhdGEoIHZhbHVlc1Zpc2libGUgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG5cclxuICAgICAgLy8gT21pdCB0aGUgc3ltYm9sLCBkaXNwbGF5IG9ubHkgdGhlIHZhbHVlLCBpZiB2YWx1ZXMgYXJlIHZpc2libGUuXHJcbiAgICAgIHJldHVybiBtZXJnZSggc3VwZXIuZ2V0TGFiZWxEaXNwbGF5RGF0YSggdmFsdWVzVmlzaWJsZSApLCB7XHJcbiAgICAgICAgc3ltYm9sOiBudWxsLFxyXG4gICAgICAgIGluY2x1ZGVBYnNvbHV0ZVZhbHVlQmFyczogZmFsc2UsXHJcbiAgICAgICAgbWFnbml0dWRlOiB2YWx1ZXNWaXNpYmxlID8gdGhpcy5tYWduaXR1ZGUgOiBudWxsXHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbnZlY3RvckFkZGl0aW9uLnJlZ2lzdGVyKCAnU3VtVmVjdG9yJywgU3VtVmVjdG9yICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsZUFBZSxNQUFNLHdDQUF3QztBQUNwRSxPQUFPQyxTQUFTLE1BQU0sa0NBQWtDO0FBQ3hELE9BQU9DLE9BQU8sTUFBTSwrQkFBK0I7QUFDbkQsT0FBT0MsS0FBSyxNQUFNLG1DQUFtQztBQUNyRCxPQUFPQyxjQUFjLE1BQU0seUJBQXlCO0FBQ3BELE9BQU9DLE1BQU0sTUFBTSxhQUFhO0FBT2hDO0FBQ0EsTUFBTUMsa0JBQWtCLEdBQUc7RUFDekJDLGNBQWMsRUFBRSxLQUFLO0VBQUU7RUFDdkJDLFdBQVcsRUFBRSxLQUFLO0VBQUU7RUFDcEJDLGtCQUFrQixFQUFFLElBQUk7RUFBRTtFQUMxQkMsWUFBWSxFQUFFO0FBQ2hCLENBQUM7QUFFRCxlQUFlLE1BQU1DLFNBQVMsU0FBU04sTUFBTSxDQUFDO0VBRTVDO0VBQ0E7RUFDQTs7RUFHQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDU08sV0FBV0EsQ0FBRUMsbUJBQTRCLEVBQUVDLEtBQVksRUFBRUMsU0FBb0IsRUFBRUMsTUFBcUIsRUFBRztJQUU1RztJQUNBLEtBQUssQ0FBRUgsbUJBQW1CLEVBQUVYLE9BQU8sQ0FBQ2UsSUFBSSxFQUFFSCxLQUFLLEVBQUVDLFNBQVMsRUFBRUMsTUFBTSxFQUFFVixrQkFBbUIsQ0FBQztJQUV4RixJQUFJLENBQUNZLGlCQUFpQixHQUFHLElBQUlsQixlQUFlLENBQUVlLFNBQVMsQ0FBQ0ksT0FBTyxDQUFDQyxjQUFjLENBQUNDLEtBQUssR0FBRyxDQUFFLENBQUM7O0lBRTFGO0lBQ0FOLFNBQVMsQ0FBQ0ksT0FBTyxDQUFDRyxvQkFBb0IsQ0FBRUMsV0FBVyxJQUFJO01BRXJEO01BQ0EsTUFBTUMsb0JBQW9CLEdBQUd2QixTQUFTLENBQUN3QixTQUFTLENBQzlDLENBQUVGLFdBQVcsQ0FBQ0csd0JBQXdCLEVBQUVILFdBQVcsQ0FBQ0ksaUJBQWlCLENBQUUsRUFBRSxNQUFNO1FBQzdFLElBQUksQ0FBQ0MsU0FBUyxDQUFFYixTQUFTLENBQUNJLE9BQVEsQ0FBQztNQUNyQyxDQUFFLENBQUM7O01BRUw7TUFDQSxNQUFNVSxxQkFBcUIsR0FBS0MsYUFBcUIsSUFBTTtRQUN6RCxJQUFLQSxhQUFhLEtBQUtQLFdBQVcsRUFBRztVQUVuQztVQUNBLElBQUksQ0FBQ0ssU0FBUyxDQUFFYixTQUFTLENBQUNJLE9BQVEsQ0FBQztVQUVuQ2xCLFNBQVMsQ0FBQzhCLFdBQVcsQ0FBRVAsb0JBQXFCLENBQUM7VUFDN0NULFNBQVMsQ0FBQ0ksT0FBTyxDQUFDYSx5QkFBeUIsQ0FBRUgscUJBQXNCLENBQUM7UUFDdEU7TUFDRixDQUFDO01BRURkLFNBQVMsQ0FBQ0ksT0FBTyxDQUFDYyxzQkFBc0IsQ0FBRUoscUJBQXNCLENBQUM7SUFDbkUsQ0FBRSxDQUFDO0VBQ0w7O0VBRUE7QUFDRjtBQUNBO0VBQ1lELFNBQVNBLENBQUVULE9BQWdDLEVBQVM7SUFFNUQ7SUFDQSxNQUFNZSxjQUFjLEdBQUdmLE9BQU8sQ0FBQ2dCLE1BQU0sQ0FBRUMsTUFBTSxJQUFJO01BQy9DLE9BQU9BLE1BQU0sQ0FBQ1QsaUJBQWlCLENBQUNOLEtBQUs7SUFDdkMsQ0FBRSxDQUFDOztJQUVIO0lBQ0EsTUFBTWdCLG1CQUFtQixHQUFHLElBQUluQyxPQUFPLENBQUUsQ0FBQyxFQUFFLENBQUUsQ0FBQztJQUUvQ2dDLGNBQWMsQ0FBQ0ksT0FBTyxDQUFFRixNQUFNLElBQUk7TUFDaENDLG1CQUFtQixDQUFDRSxHQUFHLENBQUVILE1BQU0sQ0FBQ0ksZ0JBQWlCLENBQUM7SUFDcEQsQ0FBRSxDQUFDOztJQUVIO0lBQ0EsSUFBSSxDQUFDQSxnQkFBZ0IsR0FBR0gsbUJBQW1COztJQUUzQztJQUNBLElBQUksQ0FBQ25CLGlCQUFpQixDQUFDRyxLQUFLLEdBQUthLGNBQWMsQ0FBQ08sTUFBTSxHQUFHLENBQUc7RUFDOUQ7O0VBRUE7QUFDRjtBQUNBO0VBQ2tCQyxtQkFBbUJBLENBQUVDLGFBQXNCLEVBQXFCO0lBRTlFO0lBQ0E7SUFDQTtJQUNBO0lBQ0EsTUFBTUMsWUFBWSxHQUFHLElBQUksQ0FBQzlCLEtBQUssQ0FBQytCLG9CQUFvQixDQUFDeEIsS0FBSztJQUMxRCxNQUFNeUIsaUJBQWlCLEdBQUcsSUFBSSxDQUFDaEMsS0FBSyxDQUFDaUMsVUFBVSxDQUFDTixNQUFNLEtBQUssQ0FBQyxJQUNsQ0csWUFBWSxLQUFLLElBQUksSUFDckIsSUFBSSxDQUFDN0IsU0FBUyxDQUFDSSxPQUFPLENBQUM2QixJQUFJLENBQUVaLE1BQU0sSUFBSUEsTUFBTSxLQUFLUSxZQUFhLENBQUM7SUFFMUYsSUFBS0UsaUJBQWlCLEVBQUc7TUFFdkI7TUFDQSxPQUFPLEtBQUssQ0FBQ0osbUJBQW1CLENBQUVDLGFBQWMsQ0FBQztJQUNuRCxDQUFDLE1BQ0k7TUFFSDtNQUNBLE9BQU94QyxLQUFLLENBQUUsS0FBSyxDQUFDdUMsbUJBQW1CLENBQUVDLGFBQWMsQ0FBQyxFQUFFO1FBQ3hEM0IsTUFBTSxFQUFFLElBQUk7UUFDWmlDLHdCQUF3QixFQUFFLEtBQUs7UUFDL0JDLFNBQVMsRUFBRVAsYUFBYSxHQUFHLElBQUksQ0FBQ08sU0FBUyxHQUFHO01BQzlDLENBQUUsQ0FBQztJQUNMO0VBQ0Y7QUFDRjtBQUVBOUMsY0FBYyxDQUFDK0MsUUFBUSxDQUFFLFdBQVcsRUFBRXhDLFNBQVUsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==