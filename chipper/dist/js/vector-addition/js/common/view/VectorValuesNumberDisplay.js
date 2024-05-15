// Copyright 2019-2023, University of Colorado Boulder

/**
 * VectorValuesNumberDisplay is a subclass of NumberDisplay for displaying a value that is associated with a Vector.
 * Instances appear in the 'Vector Values' toggle box.
 *
 * Displays a single vector attribute (i.e. magnitude etc.) of a single active vector that is on the specified graph.
 *
 * 'Is a' relationship with NumberDisplay but adds:
 *  - Functionality to change the active vector without having to recreate the number display;
 *    NumberDisplays don't support the ability to change the NumberProperty of the panel.
 *    Recreating new NumberDisplays every time the active vector changes is costly. This creates the number Property
 *    once and derives its value from the attribute of the active vector.
 *
 * This number display exists for the entire sim and is never disposed.
 *
 * @author Brandon Li
 */

import Property from '../../../../axon/js/Property.js';
import Range from '../../../../dot/js/Range.js';
import NumberDisplay from '../../../../scenery-phet/js/NumberDisplay.js';
import vectorAddition from '../../vectorAddition.js';
import VectorAdditionConstants from '../VectorAdditionConstants.js';
import VectorQuantities from './VectorQuantities.js';
export default class VectorValuesNumberDisplay extends NumberDisplay {
  /**
   * @param graph - the graph that contains the vectors to display
   * @param vectorQuantity - the vector quantity to display
   */
  constructor(graph, vectorQuantity) {
    //----------------------------------------------------------------------------------------
    // Calculate the range
    //----------------------------------------------------------------------------------------

    // Convenience variables. These are constant for the entire sim.
    const maxMagnitude = graph.graphModelBounds.rightTop.distance(graph.graphModelBounds.leftBottom);
    const graphWidth = graph.graphModelBounds.width;
    const graphHeight = graph.graphModelBounds.height;
    let numberDisplayRange;
    if (vectorQuantity === VectorQuantities.ANGLE) {
      numberDisplayRange = VectorAdditionConstants.ANGLE_RANGE;
    } else if (vectorQuantity === VectorQuantities.MAGNITUDE) {
      numberDisplayRange = new Range(0, maxMagnitude);
    } else if (vectorQuantity === VectorQuantities.X_COMPONENT) {
      numberDisplayRange = new Range(-graphWidth, graphWidth);
    } else {
      // vectorQuantity === VectorQuantities.Y_COMPONENT
      numberDisplayRange = new Range(-graphHeight, graphHeight);
    }

    //----------------------------------------------------------------------------------------
    // Create the number display
    //----------------------------------------------------------------------------------------

    // the value displayed by NumberDisplay, null if there is no active vector
    const numberDisplayProperty = new Property(null, {
      isValidValue: value => typeof value === 'number' || value === null
    });
    super(numberDisplayProperty, numberDisplayRange, {
      decimalPlaces: VectorAdditionConstants.VECTOR_VALUE_DECIMAL_PLACES,
      isDisposable: false
    });
    this.vectorQuantity = vectorQuantity;

    //----------------------------------------------------------------------------------------
    // Create links
    //----------------------------------------------------------------------------------------

    // Create function to update the number display value
    const activeVectorComponentsListener = () => {
      numberDisplayProperty.value = this.getNumberDisplayValue(graph.activeVectorProperty.value);
    };

    // Observe when the graph's active vector changes and update the vectorComponents link.
    // unlink is unnecessary, exists for the lifetime of the sim.
    graph.activeVectorProperty.link((activeVector, oldActiveVector) => {
      // unlink the previous link if the old active vector exists
      oldActiveVector && oldActiveVector.vectorComponentsProperty.unlink(activeVectorComponentsListener);

      // Observe when the active vector changes and update the number display value if and only if the active vector
      // exists. unlink is required when active vector changes.
      activeVector && activeVector.vectorComponentsProperty.link(activeVectorComponentsListener);
    });
  }

  /**
   * Gets the value to display based on the attribute display type and a vector
   */
  getNumberDisplayValue(activeVector) {
    if (!activeVector) {
      return null;
    }
    if (this.vectorQuantity === VectorQuantities.MAGNITUDE) {
      return activeVector.magnitude;
    } else if (this.vectorQuantity === VectorQuantities.ANGLE) {
      return activeVector.angleDegrees;
    } else if (this.vectorQuantity === VectorQuantities.X_COMPONENT) {
      return activeVector.xComponent;
    } else if (this.vectorQuantity === VectorQuantities.Y_COMPONENT) {
      return activeVector.yComponent;
    }
    throw new Error('invalid case for getNumberDisplayValue');
  }
}
vectorAddition.register('VectorValuesNumberDisplay', VectorValuesNumberDisplay);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQcm9wZXJ0eSIsIlJhbmdlIiwiTnVtYmVyRGlzcGxheSIsInZlY3RvckFkZGl0aW9uIiwiVmVjdG9yQWRkaXRpb25Db25zdGFudHMiLCJWZWN0b3JRdWFudGl0aWVzIiwiVmVjdG9yVmFsdWVzTnVtYmVyRGlzcGxheSIsImNvbnN0cnVjdG9yIiwiZ3JhcGgiLCJ2ZWN0b3JRdWFudGl0eSIsIm1heE1hZ25pdHVkZSIsImdyYXBoTW9kZWxCb3VuZHMiLCJyaWdodFRvcCIsImRpc3RhbmNlIiwibGVmdEJvdHRvbSIsImdyYXBoV2lkdGgiLCJ3aWR0aCIsImdyYXBoSGVpZ2h0IiwiaGVpZ2h0IiwibnVtYmVyRGlzcGxheVJhbmdlIiwiQU5HTEUiLCJBTkdMRV9SQU5HRSIsIk1BR05JVFVERSIsIlhfQ09NUE9ORU5UIiwibnVtYmVyRGlzcGxheVByb3BlcnR5IiwiaXNWYWxpZFZhbHVlIiwidmFsdWUiLCJkZWNpbWFsUGxhY2VzIiwiVkVDVE9SX1ZBTFVFX0RFQ0lNQUxfUExBQ0VTIiwiaXNEaXNwb3NhYmxlIiwiYWN0aXZlVmVjdG9yQ29tcG9uZW50c0xpc3RlbmVyIiwiZ2V0TnVtYmVyRGlzcGxheVZhbHVlIiwiYWN0aXZlVmVjdG9yUHJvcGVydHkiLCJsaW5rIiwiYWN0aXZlVmVjdG9yIiwib2xkQWN0aXZlVmVjdG9yIiwidmVjdG9yQ29tcG9uZW50c1Byb3BlcnR5IiwidW5saW5rIiwibWFnbml0dWRlIiwiYW5nbGVEZWdyZWVzIiwieENvbXBvbmVudCIsIllfQ09NUE9ORU5UIiwieUNvbXBvbmVudCIsIkVycm9yIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJWZWN0b3JWYWx1ZXNOdW1iZXJEaXNwbGF5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE5LTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFZlY3RvclZhbHVlc051bWJlckRpc3BsYXkgaXMgYSBzdWJjbGFzcyBvZiBOdW1iZXJEaXNwbGF5IGZvciBkaXNwbGF5aW5nIGEgdmFsdWUgdGhhdCBpcyBhc3NvY2lhdGVkIHdpdGggYSBWZWN0b3IuXHJcbiAqIEluc3RhbmNlcyBhcHBlYXIgaW4gdGhlICdWZWN0b3IgVmFsdWVzJyB0b2dnbGUgYm94LlxyXG4gKlxyXG4gKiBEaXNwbGF5cyBhIHNpbmdsZSB2ZWN0b3IgYXR0cmlidXRlIChpLmUuIG1hZ25pdHVkZSBldGMuKSBvZiBhIHNpbmdsZSBhY3RpdmUgdmVjdG9yIHRoYXQgaXMgb24gdGhlIHNwZWNpZmllZCBncmFwaC5cclxuICpcclxuICogJ0lzIGEnIHJlbGF0aW9uc2hpcCB3aXRoIE51bWJlckRpc3BsYXkgYnV0IGFkZHM6XHJcbiAqICAtIEZ1bmN0aW9uYWxpdHkgdG8gY2hhbmdlIHRoZSBhY3RpdmUgdmVjdG9yIHdpdGhvdXQgaGF2aW5nIHRvIHJlY3JlYXRlIHRoZSBudW1iZXIgZGlzcGxheTtcclxuICogICAgTnVtYmVyRGlzcGxheXMgZG9uJ3Qgc3VwcG9ydCB0aGUgYWJpbGl0eSB0byBjaGFuZ2UgdGhlIE51bWJlclByb3BlcnR5IG9mIHRoZSBwYW5lbC5cclxuICogICAgUmVjcmVhdGluZyBuZXcgTnVtYmVyRGlzcGxheXMgZXZlcnkgdGltZSB0aGUgYWN0aXZlIHZlY3RvciBjaGFuZ2VzIGlzIGNvc3RseS4gVGhpcyBjcmVhdGVzIHRoZSBudW1iZXIgUHJvcGVydHlcclxuICogICAgb25jZSBhbmQgZGVyaXZlcyBpdHMgdmFsdWUgZnJvbSB0aGUgYXR0cmlidXRlIG9mIHRoZSBhY3RpdmUgdmVjdG9yLlxyXG4gKlxyXG4gKiBUaGlzIG51bWJlciBkaXNwbGF5IGV4aXN0cyBmb3IgdGhlIGVudGlyZSBzaW0gYW5kIGlzIG5ldmVyIGRpc3Bvc2VkLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEJyYW5kb24gTGlcclxuICovXHJcblxyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBSYW5nZSBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvUmFuZ2UuanMnO1xyXG5pbXBvcnQgTnVtYmVyRGlzcGxheSBmcm9tICcuLi8uLi8uLi8uLi9zY2VuZXJ5LXBoZXQvanMvTnVtYmVyRGlzcGxheS5qcyc7XHJcbmltcG9ydCB2ZWN0b3JBZGRpdGlvbiBmcm9tICcuLi8uLi92ZWN0b3JBZGRpdGlvbi5qcyc7XHJcbmltcG9ydCBHcmFwaCBmcm9tICcuLi9tb2RlbC9HcmFwaC5qcyc7XHJcbmltcG9ydCBWZWN0b3IgZnJvbSAnLi4vbW9kZWwvVmVjdG9yLmpzJztcclxuaW1wb3J0IFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzIGZyb20gJy4uL1ZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLmpzJztcclxuaW1wb3J0IFZlY3RvclF1YW50aXRpZXMgZnJvbSAnLi9WZWN0b3JRdWFudGl0aWVzLmpzJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFZlY3RvclZhbHVlc051bWJlckRpc3BsYXkgZXh0ZW5kcyBOdW1iZXJEaXNwbGF5IHtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSB2ZWN0b3JRdWFudGl0eTogVmVjdG9yUXVhbnRpdGllcztcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIGdyYXBoIC0gdGhlIGdyYXBoIHRoYXQgY29udGFpbnMgdGhlIHZlY3RvcnMgdG8gZGlzcGxheVxyXG4gICAqIEBwYXJhbSB2ZWN0b3JRdWFudGl0eSAtIHRoZSB2ZWN0b3IgcXVhbnRpdHkgdG8gZGlzcGxheVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggZ3JhcGg6IEdyYXBoLCB2ZWN0b3JRdWFudGl0eTogVmVjdG9yUXVhbnRpdGllcyApIHtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIENhbGN1bGF0ZSB0aGUgcmFuZ2VcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIC8vIENvbnZlbmllbmNlIHZhcmlhYmxlcy4gVGhlc2UgYXJlIGNvbnN0YW50IGZvciB0aGUgZW50aXJlIHNpbS5cclxuICAgIGNvbnN0IG1heE1hZ25pdHVkZSA9IGdyYXBoLmdyYXBoTW9kZWxCb3VuZHMucmlnaHRUb3AuZGlzdGFuY2UoIGdyYXBoLmdyYXBoTW9kZWxCb3VuZHMubGVmdEJvdHRvbSApO1xyXG4gICAgY29uc3QgZ3JhcGhXaWR0aCA9IGdyYXBoLmdyYXBoTW9kZWxCb3VuZHMud2lkdGg7XHJcbiAgICBjb25zdCBncmFwaEhlaWdodCA9IGdyYXBoLmdyYXBoTW9kZWxCb3VuZHMuaGVpZ2h0O1xyXG5cclxuICAgIGxldCBudW1iZXJEaXNwbGF5UmFuZ2U6IFJhbmdlO1xyXG5cclxuICAgIGlmICggdmVjdG9yUXVhbnRpdHkgPT09IFZlY3RvclF1YW50aXRpZXMuQU5HTEUgKSB7XHJcbiAgICAgIG51bWJlckRpc3BsYXlSYW5nZSA9IFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLkFOR0xFX1JBTkdFO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHZlY3RvclF1YW50aXR5ID09PSBWZWN0b3JRdWFudGl0aWVzLk1BR05JVFVERSApIHtcclxuICAgICAgbnVtYmVyRGlzcGxheVJhbmdlID0gbmV3IFJhbmdlKCAwLCBtYXhNYWduaXR1ZGUgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB2ZWN0b3JRdWFudGl0eSA9PT0gVmVjdG9yUXVhbnRpdGllcy5YX0NPTVBPTkVOVCApIHtcclxuICAgICAgbnVtYmVyRGlzcGxheVJhbmdlID0gbmV3IFJhbmdlKCAtZ3JhcGhXaWR0aCwgZ3JhcGhXaWR0aCApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7IC8vIHZlY3RvclF1YW50aXR5ID09PSBWZWN0b3JRdWFudGl0aWVzLllfQ09NUE9ORU5UXHJcbiAgICAgIG51bWJlckRpc3BsYXlSYW5nZSA9IG5ldyBSYW5nZSggLWdyYXBoSGVpZ2h0LCBncmFwaEhlaWdodCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gQ3JlYXRlIHRoZSBudW1iZXIgZGlzcGxheVxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgLy8gdGhlIHZhbHVlIGRpc3BsYXllZCBieSBOdW1iZXJEaXNwbGF5LCBudWxsIGlmIHRoZXJlIGlzIG5vIGFjdGl2ZSB2ZWN0b3JcclxuICAgIGNvbnN0IG51bWJlckRpc3BsYXlQcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eTxudW1iZXIgfCBudWxsPiggbnVsbCwge1xyXG4gICAgICBpc1ZhbGlkVmFsdWU6IHZhbHVlID0+ICggdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyB8fCB2YWx1ZSA9PT0gbnVsbCApXHJcbiAgICB9ICk7XHJcblxyXG4gICAgc3VwZXIoIG51bWJlckRpc3BsYXlQcm9wZXJ0eSwgbnVtYmVyRGlzcGxheVJhbmdlLCB7XHJcbiAgICAgIGRlY2ltYWxQbGFjZXM6IFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLlZFQ1RPUl9WQUxVRV9ERUNJTUFMX1BMQUNFUyxcclxuICAgICAgaXNEaXNwb3NhYmxlOiBmYWxzZVxyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMudmVjdG9yUXVhbnRpdHkgPSB2ZWN0b3JRdWFudGl0eTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIENyZWF0ZSBsaW5rc1xyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgLy8gQ3JlYXRlIGZ1bmN0aW9uIHRvIHVwZGF0ZSB0aGUgbnVtYmVyIGRpc3BsYXkgdmFsdWVcclxuICAgIGNvbnN0IGFjdGl2ZVZlY3RvckNvbXBvbmVudHNMaXN0ZW5lciA9ICgpID0+IHtcclxuICAgICAgbnVtYmVyRGlzcGxheVByb3BlcnR5LnZhbHVlID0gdGhpcy5nZXROdW1iZXJEaXNwbGF5VmFsdWUoIGdyYXBoLmFjdGl2ZVZlY3RvclByb3BlcnR5LnZhbHVlICk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIE9ic2VydmUgd2hlbiB0aGUgZ3JhcGgncyBhY3RpdmUgdmVjdG9yIGNoYW5nZXMgYW5kIHVwZGF0ZSB0aGUgdmVjdG9yQ29tcG9uZW50cyBsaW5rLlxyXG4gICAgLy8gdW5saW5rIGlzIHVubmVjZXNzYXJ5LCBleGlzdHMgZm9yIHRoZSBsaWZldGltZSBvZiB0aGUgc2ltLlxyXG4gICAgZ3JhcGguYWN0aXZlVmVjdG9yUHJvcGVydHkubGluayggKCBhY3RpdmVWZWN0b3IsIG9sZEFjdGl2ZVZlY3RvciApID0+IHtcclxuXHJcbiAgICAgIC8vIHVubGluayB0aGUgcHJldmlvdXMgbGluayBpZiB0aGUgb2xkIGFjdGl2ZSB2ZWN0b3IgZXhpc3RzXHJcbiAgICAgIG9sZEFjdGl2ZVZlY3RvciAmJiBvbGRBY3RpdmVWZWN0b3IudmVjdG9yQ29tcG9uZW50c1Byb3BlcnR5LnVubGluayggYWN0aXZlVmVjdG9yQ29tcG9uZW50c0xpc3RlbmVyICk7XHJcblxyXG4gICAgICAvLyBPYnNlcnZlIHdoZW4gdGhlIGFjdGl2ZSB2ZWN0b3IgY2hhbmdlcyBhbmQgdXBkYXRlIHRoZSBudW1iZXIgZGlzcGxheSB2YWx1ZSBpZiBhbmQgb25seSBpZiB0aGUgYWN0aXZlIHZlY3RvclxyXG4gICAgICAvLyBleGlzdHMuIHVubGluayBpcyByZXF1aXJlZCB3aGVuIGFjdGl2ZSB2ZWN0b3IgY2hhbmdlcy5cclxuICAgICAgYWN0aXZlVmVjdG9yICYmIGFjdGl2ZVZlY3Rvci52ZWN0b3JDb21wb25lbnRzUHJvcGVydHkubGluayggYWN0aXZlVmVjdG9yQ29tcG9uZW50c0xpc3RlbmVyICk7XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSB2YWx1ZSB0byBkaXNwbGF5IGJhc2VkIG9uIHRoZSBhdHRyaWJ1dGUgZGlzcGxheSB0eXBlIGFuZCBhIHZlY3RvclxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2V0TnVtYmVyRGlzcGxheVZhbHVlKCBhY3RpdmVWZWN0b3I6IFZlY3RvciB8IG51bGwgKTogbnVtYmVyIHwgbnVsbCB7XHJcblxyXG4gICAgaWYgKCAhYWN0aXZlVmVjdG9yICkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHRoaXMudmVjdG9yUXVhbnRpdHkgPT09IFZlY3RvclF1YW50aXRpZXMuTUFHTklUVURFICkge1xyXG4gICAgICByZXR1cm4gYWN0aXZlVmVjdG9yLm1hZ25pdHVkZTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0aGlzLnZlY3RvclF1YW50aXR5ID09PSBWZWN0b3JRdWFudGl0aWVzLkFOR0xFICkge1xyXG4gICAgICByZXR1cm4gYWN0aXZlVmVjdG9yLmFuZ2xlRGVncmVlcztcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0aGlzLnZlY3RvclF1YW50aXR5ID09PSBWZWN0b3JRdWFudGl0aWVzLlhfQ09NUE9ORU5UICkge1xyXG4gICAgICByZXR1cm4gYWN0aXZlVmVjdG9yLnhDb21wb25lbnQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggdGhpcy52ZWN0b3JRdWFudGl0eSA9PT0gVmVjdG9yUXVhbnRpdGllcy5ZX0NPTVBPTkVOVCApIHtcclxuICAgICAgcmV0dXJuIGFjdGl2ZVZlY3Rvci55Q29tcG9uZW50O1xyXG4gICAgfVxyXG4gICAgdGhyb3cgbmV3IEVycm9yKCAnaW52YWxpZCBjYXNlIGZvciBnZXROdW1iZXJEaXNwbGF5VmFsdWUnICk7XHJcbiAgfVxyXG59XHJcblxyXG52ZWN0b3JBZGRpdGlvbi5yZWdpc3RlciggJ1ZlY3RvclZhbHVlc051bWJlckRpc3BsYXknLCBWZWN0b3JWYWx1ZXNOdW1iZXJEaXNwbGF5ICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxRQUFRLE1BQU0saUNBQWlDO0FBQ3RELE9BQU9DLEtBQUssTUFBTSw2QkFBNkI7QUFDL0MsT0FBT0MsYUFBYSxNQUFNLDhDQUE4QztBQUN4RSxPQUFPQyxjQUFjLE1BQU0seUJBQXlCO0FBR3BELE9BQU9DLHVCQUF1QixNQUFNLCtCQUErQjtBQUNuRSxPQUFPQyxnQkFBZ0IsTUFBTSx1QkFBdUI7QUFFcEQsZUFBZSxNQUFNQyx5QkFBeUIsU0FBU0osYUFBYSxDQUFDO0VBSW5FO0FBQ0Y7QUFDQTtBQUNBO0VBQ1NLLFdBQVdBLENBQUVDLEtBQVksRUFBRUMsY0FBZ0MsRUFBRztJQUVuRTtJQUNBO0lBQ0E7O0lBRUE7SUFDQSxNQUFNQyxZQUFZLEdBQUdGLEtBQUssQ0FBQ0csZ0JBQWdCLENBQUNDLFFBQVEsQ0FBQ0MsUUFBUSxDQUFFTCxLQUFLLENBQUNHLGdCQUFnQixDQUFDRyxVQUFXLENBQUM7SUFDbEcsTUFBTUMsVUFBVSxHQUFHUCxLQUFLLENBQUNHLGdCQUFnQixDQUFDSyxLQUFLO0lBQy9DLE1BQU1DLFdBQVcsR0FBR1QsS0FBSyxDQUFDRyxnQkFBZ0IsQ0FBQ08sTUFBTTtJQUVqRCxJQUFJQyxrQkFBeUI7SUFFN0IsSUFBS1YsY0FBYyxLQUFLSixnQkFBZ0IsQ0FBQ2UsS0FBSyxFQUFHO01BQy9DRCxrQkFBa0Is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