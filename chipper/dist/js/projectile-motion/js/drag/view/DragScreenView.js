// Copyright 2016-2023, University of Colorado Boulder

/**
 * ScreenView for the 'Drag' screen.
 *
 * @author Andrea Lin (PhET Interactive Simulations)
 */

import ProjectileMotionScreenView from '../../common/view/ProjectileMotionScreenView.js';
import projectileMotion from '../../projectileMotion.js';
import DragProjectileControlPanel from './DragProjectileControlPanel.js';
import DragVectorsControlPanel from './DragVectorsControlPanel.js';
import DragViewProperties from './DragViewProperties.js';
class DragScreenView extends ProjectileMotionScreenView {
  /**
   * @param {DragModel} model
   * @param {Object} [options]
   */
  constructor(model, options) {
    // contains Properties about vector visibility, used in super class
    const visibilityProperties = new DragViewProperties(options.tandem.createTandem('viewProperties'));
    super(model, new DragProjectileControlPanel(model.selectedProjectileObjectTypeProperty, model.projectileDragCoefficientProperty, model.projectileDiameterProperty, model.projectileMassProperty, model.altitudeProperty, {
      tandem: options.tandem.createTandem('projectileControlPanel')
    }), new DragVectorsControlPanel(visibilityProperties, {
      tandem: options.tandem.createTandem('vectorsControlPanel')
    }), visibilityProperties, options);
  }
}
projectileMotion.register('DragScreenView', DragScreenView);
export default DragScreenView;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQcm9qZWN0aWxlTW90aW9uU2NyZWVuVmlldyIsInByb2plY3RpbGVNb3Rpb24iLCJEcmFnUHJvamVjdGlsZUNvbnRyb2xQYW5lbCIsIkRyYWdWZWN0b3JzQ29udHJvbFBhbmVsIiwiRHJhZ1ZpZXdQcm9wZXJ0aWVzIiwiRHJhZ1NjcmVlblZpZXciLCJjb25zdHJ1Y3RvciIsIm1vZGVsIiwib3B0aW9ucyIsInZpc2liaWxpdHlQcm9wZXJ0aWVzIiwidGFuZGVtIiwiY3JlYXRlVGFuZGVtIiwic2VsZWN0ZWRQcm9qZWN0aWxlT2JqZWN0VHlwZVByb3BlcnR5IiwicHJvamVjdGlsZURyYWdDb2VmZmljaWVudFByb3BlcnR5IiwicHJvamVjdGlsZURpYW1ldGVyUHJvcGVydHkiLCJwcm9qZWN0aWxlTWFzc1Byb3BlcnR5IiwiYWx0aXR1ZGVQcm9wZXJ0eSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiRHJhZ1NjcmVlblZpZXcuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTYtMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogU2NyZWVuVmlldyBmb3IgdGhlICdEcmFnJyBzY3JlZW4uXHJcbiAqXHJcbiAqIEBhdXRob3IgQW5kcmVhIExpbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgUHJvamVjdGlsZU1vdGlvblNjcmVlblZpZXcgZnJvbSAnLi4vLi4vY29tbW9uL3ZpZXcvUHJvamVjdGlsZU1vdGlvblNjcmVlblZpZXcuanMnO1xyXG5pbXBvcnQgcHJvamVjdGlsZU1vdGlvbiBmcm9tICcuLi8uLi9wcm9qZWN0aWxlTW90aW9uLmpzJztcclxuaW1wb3J0IERyYWdQcm9qZWN0aWxlQ29udHJvbFBhbmVsIGZyb20gJy4vRHJhZ1Byb2plY3RpbGVDb250cm9sUGFuZWwuanMnO1xyXG5pbXBvcnQgRHJhZ1ZlY3RvcnNDb250cm9sUGFuZWwgZnJvbSAnLi9EcmFnVmVjdG9yc0NvbnRyb2xQYW5lbC5qcyc7XHJcbmltcG9ydCBEcmFnVmlld1Byb3BlcnRpZXMgZnJvbSAnLi9EcmFnVmlld1Byb3BlcnRpZXMuanMnO1xyXG5cclxuY2xhc3MgRHJhZ1NjcmVlblZpZXcgZXh0ZW5kcyBQcm9qZWN0aWxlTW90aW9uU2NyZWVuVmlldyB7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSB7RHJhZ01vZGVsfSBtb2RlbFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvciggbW9kZWwsIG9wdGlvbnMgKSB7XHJcblxyXG4gICAgLy8gY29udGFpbnMgUHJvcGVydGllcyBhYm91dCB2ZWN0b3IgdmlzaWJpbGl0eSwgdXNlZCBpbiBzdXBlciBjbGFzc1xyXG4gICAgY29uc3QgdmlzaWJpbGl0eVByb3BlcnRpZXMgPSBuZXcgRHJhZ1ZpZXdQcm9wZXJ0aWVzKCBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICd2aWV3UHJvcGVydGllcycgKSApO1xyXG5cclxuICAgIHN1cGVyKFxyXG4gICAgICBtb2RlbCxcclxuICAgICAgbmV3IERyYWdQcm9qZWN0aWxlQ29udHJvbFBhbmVsKFxyXG4gICAgICAgIG1vZGVsLnNlbGVjdGVkUHJvamVjdGlsZU9iamVjdFR5cGVQcm9wZXJ0eSxcclxuICAgICAgICBtb2RlbC5wcm9qZWN0aWxlRHJhZ0NvZWZmaWNpZW50UHJvcGVydHksXHJcbiAgICAgICAgbW9kZWwucHJvamVjdGlsZURpYW1ldGVyUHJvcGVydHksXHJcbiAgICAgICAgbW9kZWwucHJvamVjdGlsZU1hc3NQcm9wZXJ0eSxcclxuICAgICAgICBtb2RlbC5hbHRpdHVkZVByb3BlcnR5LCB7XHJcbiAgICAgICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ3Byb2plY3RpbGVDb250cm9sUGFuZWwnIClcclxuICAgICAgICB9XHJcbiAgICAgICksXHJcbiAgICAgIG5ldyBEcmFnVmVjdG9yc0NvbnRyb2xQYW5lbCggdmlzaWJpbGl0eVByb3BlcnRpZXMsIHsgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICd2ZWN0b3JzQ29udHJvbFBhbmVsJyApIH0gKSxcclxuICAgICAgdmlzaWJpbGl0eVByb3BlcnRpZXMsXHJcbiAgICAgIG9wdGlvbnMgKTtcclxuICB9XHJcbn1cclxuXHJcbnByb2plY3RpbGVNb3Rpb24ucmVnaXN0ZXIoICdEcmFnU2NyZWVuVmlldycsIERyYWdTY3JlZW5WaWV3ICk7XHJcbmV4cG9ydCBkZWZhdWx0IERyYWdTY3JlZW5WaWV3OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSwwQkFBMEIsTUFBTSxpREFBaUQ7QUFDeEYsT0FBT0MsZ0JBQWdCLE1BQU0sMkJBQTJCO0FBQ3hELE9BQU9DLDBCQUEwQixNQUFNLGlDQUFpQztBQUN4RSxPQUFPQyx1QkFBdUIsTUFBTSw4QkFBOEI7QUFDbEUsT0FBT0Msa0JBQWtCLE1BQU0seUJBQXlCO0FBRXhELE1BQU1DLGNBQWMsU0FBU0wsMEJBQTBCLENBQUM7RUFFdEQ7QUFDRjtBQUNBO0FBQ0E7RUFDRU0sV0FBV0EsQ0FBRUMsS0FBSyxFQUFFQyxPQUFPLEVBQUc7SUFFNUI7SUFDQSxNQUFNQyxvQkFBb0IsR0FBRyxJQUFJTCxrQkFBa0IsQ0FBRUksT0FBTyxDQUFDRSxNQUFNLENBQUNDLFlBQVksQ0FBRSxnQkFBaUIsQ0FBRSxDQUFDO0lBRXRHLEtBQUssQ0FDSEosS0FBSyxFQUNMLElBQUlMLDBCQUEwQixDQUM1QkssS0FBSyxDQUFDSyxvQ0FBb0MsRUFDMUNMLEtBQUssQ0FBQ00saUNBQWlDLEVBQ3ZDTixLQUFLLENBQUNPLDBCQUEwQixFQUNoQ1AsS0FBSyxDQUFDUSxzQkFBc0IsRUFDNUJSLEtBQUssQ0FBQ1MsZ0JBQWdCLEVBQUU7TUFDdEJOLE1BQU0sRUFBRUYsT0FBTyxDQUFDRSxNQUFNLENBQUNDLFlBQVksQ0FBRSx3QkFBeUI7SUFDaEUsQ0FDRixDQUFDLEVBQ0QsSUFBSVIsdUJBQXVCLENBQUVNLG9CQUFvQixFQUFFO01BQUVDLE1BQU0sRUFBRUYsT0FBTyxDQUFDRSxNQUFNLENBQUNDLFlBQVksQ0FBRSxxQkFBc0I7SUFBRSxDQUFFLENBQUMsRUFDckhGLG9CQUFvQixFQUNwQkQsT0FBUSxDQUFDO0VBQ2I7QUFDRjtBQUVBUCxnQkFBZ0IsQ0FBQ2dCLFFBQVEsQ0FBRSxnQkFBZ0IsRUFBRVosY0FBZSxDQUFDO0FBQzdELGVBQWVBLGNBQWMiLCJpZ25vcmVMaXN0IjpbXX0=