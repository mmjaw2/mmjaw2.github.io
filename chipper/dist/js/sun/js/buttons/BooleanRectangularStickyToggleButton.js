// Copyright 2014-2022, University of Colorado Boulder

/**
 * A rectangular toggle button that switches the value of a boolean Property.  It sticks in the down position when
 * pressed, popping back up when pressed again.
 *
 * This class inherits from the more general RectangularStickyToggleButton, which can take any values.
 *
 * @author John Blanco (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import sun from '../sun.js';
import RectangularStickyToggleButton from './RectangularStickyToggleButton.js';
export default class BooleanRectangularStickyToggleButton extends RectangularStickyToggleButton {
  constructor(booleanProperty, providedOptions) {
    super(booleanProperty, false, true, providedOptions);
  }
}
sun.register('BooleanRectangularStickyToggleButton', BooleanRectangularStickyToggleButton);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJzdW4iLCJSZWN0YW5ndWxhclN0aWNreVRvZ2dsZUJ1dHRvbiIsIkJvb2xlYW5SZWN0YW5ndWxhclN0aWNreVRvZ2dsZUJ1dHRvbiIsImNvbnN0cnVjdG9yIiwiYm9vbGVhblByb3BlcnR5IiwicHJvdmlkZWRPcHRpb25zIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJCb29sZWFuUmVjdGFuZ3VsYXJTdGlja3lUb2dnbGVCdXR0b24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTQtMjAyMiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSByZWN0YW5ndWxhciB0b2dnbGUgYnV0dG9uIHRoYXQgc3dpdGNoZXMgdGhlIHZhbHVlIG9mIGEgYm9vbGVhbiBQcm9wZXJ0eS4gIEl0IHN0aWNrcyBpbiB0aGUgZG93biBwb3NpdGlvbiB3aGVuXHJcbiAqIHByZXNzZWQsIHBvcHBpbmcgYmFjayB1cCB3aGVuIHByZXNzZWQgYWdhaW4uXHJcbiAqXHJcbiAqIFRoaXMgY2xhc3MgaW5oZXJpdHMgZnJvbSB0aGUgbW9yZSBnZW5lcmFsIFJlY3Rhbmd1bGFyU3RpY2t5VG9nZ2xlQnV0dG9uLCB3aGljaCBjYW4gdGFrZSBhbnkgdmFsdWVzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvaG4gQmxhbmNvIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBUUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgeyBFbXB0eVNlbGZPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBzdW4gZnJvbSAnLi4vc3VuLmpzJztcclxuaW1wb3J0IFJlY3Rhbmd1bGFyU3RpY2t5VG9nZ2xlQnV0dG9uLCB7IFJlY3Rhbmd1bGFyU3RpY2t5VG9nZ2xlQnV0dG9uT3B0aW9ucyB9IGZyb20gJy4vUmVjdGFuZ3VsYXJTdGlja3lUb2dnbGVCdXR0b24uanMnO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IEVtcHR5U2VsZk9wdGlvbnM7XHJcblxyXG5leHBvcnQgdHlwZSBCb29sZWFuUmVjdGFuZ3VsYXJTdGlja3lUb2dnbGVCdXR0b25PcHRpb25zID0gU2VsZk9wdGlvbnMgJiBSZWN0YW5ndWxhclN0aWNreVRvZ2dsZUJ1dHRvbk9wdGlvbnM7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCb29sZWFuUmVjdGFuZ3VsYXJTdGlja3lUb2dnbGVCdXR0b24gZXh0ZW5kcyBSZWN0YW5ndWxhclN0aWNreVRvZ2dsZUJ1dHRvbjxib29sZWFuPiB7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBib29sZWFuUHJvcGVydHk6IFRQcm9wZXJ0eTxib29sZWFuPiwgcHJvdmlkZWRPcHRpb25zPzogQm9vbGVhblJlY3Rhbmd1bGFyU3RpY2t5VG9nZ2xlQnV0dG9uT3B0aW9ucyApIHtcclxuICAgIHN1cGVyKCBib29sZWFuUHJvcGVydHksIGZhbHNlLCB0cnVlLCBwcm92aWRlZE9wdGlvbnMgKTtcclxuICB9XHJcbn1cclxuXHJcbnN1bi5yZWdpc3RlciggJ0Jvb2xlYW5SZWN0YW5ndWxhclN0aWNreVRvZ2dsZUJ1dHRvbicsIEJvb2xlYW5SZWN0YW5ndWxhclN0aWNreVRvZ2dsZUJ1dHRvbiApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUlBLE9BQU9BLEdBQUcsTUFBTSxXQUFXO0FBQzNCLE9BQU9DLDZCQUE2QixNQUFnRCxvQ0FBb0M7QUFNeEgsZUFBZSxNQUFNQyxvQ0FBb0MsU0FBU0QsNkJBQTZCLENBQVU7RUFDaEdFLFdBQVdBLENBQUVDLGVBQW1DLEVBQUVDLGVBQTZELEVBQUc7SUFDdkgsS0FBSyxDQUFFRCxlQUFlLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRUMsZUFBZ0IsQ0FBQztFQUN4RDtBQUNGO0FBRUFMLEdBQUcsQ0FBQ00sUUFBUSxDQUFFLHNDQUFzQyxFQUFFSixvQ0FBcUMsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==