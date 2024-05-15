// Copyright 2022-2024, University of Colorado Boulder

/**
 * A Property in which the output can be variable depending on a provided function. Statistical variation is quite
 * helpful in PhET sims to convey "real world" settings.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import axon from './axon.js';
import NumberProperty from './NumberProperty.js';
export default class VarianceNumberProperty extends NumberProperty {
  constructor(value, computeVariance, options) {
    super(value, options);
    this.computeVariance = computeVariance;
  }
  getRandomizedValue() {
    return this.computeVariance ? this.computeVariance(super.get()) : this.get();
  }
}
axon.register('VarianceNumberProperty', VarianceNumberProperty);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJheG9uIiwiTnVtYmVyUHJvcGVydHkiLCJWYXJpYW5jZU51bWJlclByb3BlcnR5IiwiY29uc3RydWN0b3IiLCJ2YWx1ZSIsImNvbXB1dGVWYXJpYW5jZSIsIm9wdGlvbnMiLCJnZXRSYW5kb21pemVkVmFsdWUiLCJnZXQiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlZhcmlhbmNlTnVtYmVyUHJvcGVydHkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjItMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBQcm9wZXJ0eSBpbiB3aGljaCB0aGUgb3V0cHV0IGNhbiBiZSB2YXJpYWJsZSBkZXBlbmRpbmcgb24gYSBwcm92aWRlZCBmdW5jdGlvbi4gU3RhdGlzdGljYWwgdmFyaWF0aW9uIGlzIHF1aXRlXHJcbiAqIGhlbHBmdWwgaW4gUGhFVCBzaW1zIHRvIGNvbnZleSBcInJlYWwgd29ybGRcIiBzZXR0aW5ncy5cclxuICpcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBheG9uIGZyb20gJy4vYXhvbi5qcyc7XHJcbmltcG9ydCBOdW1iZXJQcm9wZXJ0eSwgeyBOdW1iZXJQcm9wZXJ0eU9wdGlvbnMgfSBmcm9tICcuL051bWJlclByb3BlcnR5LmpzJztcclxuXHJcbnR5cGUgVmFyaWFuY2VDb21wdXRlciA9ICggdmFsdWU6IG51bWJlciApID0+IG51bWJlcjtcclxuXHJcbnR5cGUgVmFyaWFuY2VOdW1iZXJQcm9wZXJ0eU9wdGlvbnMgPSBOdW1iZXJQcm9wZXJ0eU9wdGlvbnM7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWYXJpYW5jZU51bWJlclByb3BlcnR5IGV4dGVuZHMgTnVtYmVyUHJvcGVydHkge1xyXG5cclxuICBwdWJsaWMgcmVhZG9ubHkgY29tcHV0ZVZhcmlhbmNlOiBWYXJpYW5jZUNvbXB1dGVyIHwgbnVsbDtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCB2YWx1ZTogbnVtYmVyLCBjb21wdXRlVmFyaWFuY2U6IFZhcmlhbmNlQ29tcHV0ZXIsIG9wdGlvbnM/OiBWYXJpYW5jZU51bWJlclByb3BlcnR5T3B0aW9ucyApIHtcclxuICAgIHN1cGVyKCB2YWx1ZSwgb3B0aW9ucyApO1xyXG5cclxuICAgIHRoaXMuY29tcHV0ZVZhcmlhbmNlID0gY29tcHV0ZVZhcmlhbmNlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldFJhbmRvbWl6ZWRWYWx1ZSgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuY29tcHV0ZVZhcmlhbmNlID8gdGhpcy5jb21wdXRlVmFyaWFuY2UoIHN1cGVyLmdldCgpICkgOiB0aGlzLmdldCgpO1xyXG4gIH1cclxufVxyXG5cclxuYXhvbi5yZWdpc3RlciggJ1ZhcmlhbmNlTnVtYmVyUHJvcGVydHknLCBWYXJpYW5jZU51bWJlclByb3BlcnR5ICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsSUFBSSxNQUFNLFdBQVc7QUFDNUIsT0FBT0MsY0FBYyxNQUFpQyxxQkFBcUI7QUFNM0UsZUFBZSxNQUFNQyxzQkFBc0IsU0FBU0QsY0FBYyxDQUFDO0VBSTFERSxXQUFXQSxDQUFFQyxLQUFhLEVBQUVDLGVBQWlDLEVBQUVDLE9BQXVDLEVBQUc7SUFDOUcsS0FBSyxDQUFFRixLQUFLLEVBQUVFLE9BQVEsQ0FBQztJQUV2QixJQUFJLENBQUNELGVBQWUsR0FBR0EsZUFBZTtFQUN4QztFQUVPRSxrQkFBa0JBLENBQUEsRUFBVztJQUNsQyxPQUFPLElBQUksQ0FBQ0YsZUFBZSxHQUFHLElBQUksQ0FBQ0EsZUFBZSxDQUFFLEtBQUssQ0FBQ0csR0FBRyxDQUFDLENBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQ0EsR0FBRyxDQUFDLENBQUM7RUFDaEY7QUFDRjtBQUVBUixJQUFJLENBQUNTLFFBQVEsQ0FBRSx3QkFBd0IsRUFBRVAsc0JBQXVCLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=