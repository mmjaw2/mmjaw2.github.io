// Copyright 2019-2023, University of Colorado Boulder

/**
 * View for the component of the sum vector.
 *
 * Extends ComponentVectorNode but adds the following functionality:
 *  - a distinct appearance
 *  - toggle visibility based on the sumVisibleProperty
 *  - disables ability to take the sum vector node off of the graph
 *
 * @author Brandon Li
 */

import Multilink from '../../../../axon/js/Multilink.js';
import merge from '../../../../phet-core/js/merge.js';
import vectorAddition from '../../vectorAddition.js';
import ComponentVectorStyles from '../model/ComponentVectorStyles.js';
import VectorAdditionConstants from '../VectorAdditionConstants.js';
import ComponentVectorNode from './ComponentVectorNode.js';
import optionize from '../../../../phet-core/js/optionize.js';
import SumVector from '../model/SumVector.js';
export default class SumComponentVectorNode extends ComponentVectorNode {
  constructor(componentVector, graph, componentStyleProperty, valuesVisibleProperty, sumVisibleProperty, providedOptions) {
    const options = optionize()({
      // ComponentVectorNodeOptions
      arrowOptions: merge({}, VectorAdditionConstants.SUM_COMPONENT_VECTOR_ARROW_OPTIONS, {
        fill: componentVector.vectorColorPalette.sumComponentFill
      })
    }, providedOptions);
    super(componentVector, graph, componentStyleProperty, valuesVisibleProperty, options);
    this.sumVisibleProperty = sumVisibleProperty;
    const sumVector = componentVector.parentVector;
    assert && assert(sumVector instanceof SumVector); // eslint-disable-line no-simple-type-checking-assertions

    // Update when the sum becomes visible or defined.
    // unlink is unnecessary, exists for the lifetime of the sim.
    Multilink.multilink([sumVisibleProperty, sumVector.isDefinedProperty], () => this.updateComponentVector(componentVector, graph.modelViewTransformProperty.value, componentStyleProperty.value, componentVector.isParentVectorActiveProperty.value));
  }

  /**
   * Handles visibility of sum component vectors.
   */
  updateComponentVector(componentVector, modelViewTransform, componentStyle, isParentActive) {
    super.updateComponentVector(componentVector, modelViewTransform, componentStyle, isParentActive);
    const sumVector = componentVector.parentVector;
    assert && assert(sumVector instanceof SumVector); // eslint-disable-line no-simple-type-checking-assertions

    this.visible =
    // components are visible
    componentStyle !== ComponentVectorStyles.INVISIBLE &&
    // sum is visible
    !!this.sumVisibleProperty && this.sumVisibleProperty.value &&
    // sum is defined
    sumVector.isDefinedProperty.value;
  }
}
vectorAddition.register('SumComponentVectorNode', SumComponentVectorNode);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNdWx0aWxpbmsiLCJtZXJnZSIsInZlY3RvckFkZGl0aW9uIiwiQ29tcG9uZW50VmVjdG9yU3R5bGVzIiwiVmVjdG9yQWRkaXRpb25Db25zdGFudHMiLCJDb21wb25lbnRWZWN0b3JOb2RlIiwib3B0aW9uaXplIiwiU3VtVmVjdG9yIiwiU3VtQ29tcG9uZW50VmVjdG9yTm9kZSIsImNvbnN0cnVjdG9yIiwiY29tcG9uZW50VmVjdG9yIiwiZ3JhcGgiLCJjb21wb25lbnRTdHlsZVByb3BlcnR5IiwidmFsdWVzVmlzaWJsZVByb3BlcnR5Iiwic3VtVmlzaWJsZVByb3BlcnR5IiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsImFycm93T3B0aW9ucyIsIlNVTV9DT01QT05FTlRfVkVDVE9SX0FSUk9XX09QVElPTlMiLCJmaWxsIiwidmVjdG9yQ29sb3JQYWxldHRlIiwic3VtQ29tcG9uZW50RmlsbCIsInN1bVZlY3RvciIsInBhcmVudFZlY3RvciIsImFzc2VydCIsIm11bHRpbGluayIsImlzRGVmaW5lZFByb3BlcnR5IiwidXBkYXRlQ29tcG9uZW50VmVjdG9yIiwibW9kZWxWaWV3VHJhbnNmb3JtUHJvcGVydHkiLCJ2YWx1ZSIsImlzUGFyZW50VmVjdG9yQWN0aXZlUHJvcGVydHkiLCJtb2RlbFZpZXdUcmFuc2Zvcm0iLCJjb21wb25lbnRTdHlsZSIsImlzUGFyZW50QWN0aXZlIiwidmlzaWJsZSIsIklOVklTSUJMRSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiU3VtQ29tcG9uZW50VmVjdG9yTm9kZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOS0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBWaWV3IGZvciB0aGUgY29tcG9uZW50IG9mIHRoZSBzdW0gdmVjdG9yLlxyXG4gKlxyXG4gKiBFeHRlbmRzIENvbXBvbmVudFZlY3Rvck5vZGUgYnV0IGFkZHMgdGhlIGZvbGxvd2luZyBmdW5jdGlvbmFsaXR5OlxyXG4gKiAgLSBhIGRpc3RpbmN0IGFwcGVhcmFuY2VcclxuICogIC0gdG9nZ2xlIHZpc2liaWxpdHkgYmFzZWQgb24gdGhlIHN1bVZpc2libGVQcm9wZXJ0eVxyXG4gKiAgLSBkaXNhYmxlcyBhYmlsaXR5IHRvIHRha2UgdGhlIHN1bSB2ZWN0b3Igbm9kZSBvZmYgb2YgdGhlIGdyYXBoXHJcbiAqXHJcbiAqIEBhdXRob3IgQnJhbmRvbiBMaVxyXG4gKi9cclxuXHJcbmltcG9ydCBNdWx0aWxpbmsgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9NdWx0aWxpbmsuanMnO1xyXG5pbXBvcnQgbWVyZ2UgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL21lcmdlLmpzJztcclxuaW1wb3J0IHZlY3RvckFkZGl0aW9uIGZyb20gJy4uLy4uL3ZlY3RvckFkZGl0aW9uLmpzJztcclxuaW1wb3J0IENvbXBvbmVudFZlY3RvclN0eWxlcyBmcm9tICcuLi9tb2RlbC9Db21wb25lbnRWZWN0b3JTdHlsZXMuanMnO1xyXG5pbXBvcnQgVmVjdG9yQWRkaXRpb25Db25zdGFudHMgZnJvbSAnLi4vVmVjdG9yQWRkaXRpb25Db25zdGFudHMuanMnO1xyXG5pbXBvcnQgQ29tcG9uZW50VmVjdG9yTm9kZSwgeyBDb21wb25lbnRWZWN0b3JOb2RlT3B0aW9ucyB9IGZyb20gJy4vQ29tcG9uZW50VmVjdG9yTm9kZS5qcyc7XHJcbmltcG9ydCBUUmVhZE9ubHlQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IEVudW1lcmF0aW9uUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9FbnVtZXJhdGlvblByb3BlcnR5LmpzJztcclxuaW1wb3J0IEdyYXBoIGZyb20gJy4uL21vZGVsL0dyYXBoLmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBFbXB0eVNlbGZPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBDb21wb25lbnRWZWN0b3IgZnJvbSAnLi4vbW9kZWwvQ29tcG9uZW50VmVjdG9yLmpzJztcclxuaW1wb3J0IE1vZGVsVmlld1RyYW5zZm9ybTIgZnJvbSAnLi4vLi4vLi4vLi4vcGhldGNvbW1vbi9qcy92aWV3L01vZGVsVmlld1RyYW5zZm9ybTIuanMnO1xyXG5pbXBvcnQgU3VtVmVjdG9yIGZyb20gJy4uL21vZGVsL1N1bVZlY3Rvci5qcyc7XHJcblxyXG50eXBlIFNlbGZPcHRpb25zID0gRW1wdHlTZWxmT3B0aW9ucztcclxudHlwZSBTdW1Db21wb25lbnRWZWN0b3JOb2RlT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgQ29tcG9uZW50VmVjdG9yTm9kZU9wdGlvbnM7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTdW1Db21wb25lbnRWZWN0b3JOb2RlIGV4dGVuZHMgQ29tcG9uZW50VmVjdG9yTm9kZSB7XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgc3VtVmlzaWJsZVByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuPjtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBjb21wb25lbnRWZWN0b3I6IENvbXBvbmVudFZlY3RvcixcclxuICAgICAgICAgICAgICAgICAgICAgIGdyYXBoOiBHcmFwaCxcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFN0eWxlUHJvcGVydHk6IEVudW1lcmF0aW9uUHJvcGVydHk8Q29tcG9uZW50VmVjdG9yU3R5bGVzPixcclxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlc1Zpc2libGVQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj4sXHJcbiAgICAgICAgICAgICAgICAgICAgICBzdW1WaXNpYmxlUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+LFxyXG4gICAgICAgICAgICAgICAgICAgICAgcHJvdmlkZWRPcHRpb25zPzogU3VtQ29tcG9uZW50VmVjdG9yTm9kZU9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxTdW1Db21wb25lbnRWZWN0b3JOb2RlT3B0aW9ucywgU2VsZk9wdGlvbnMsIENvbXBvbmVudFZlY3Rvck5vZGVPcHRpb25zPigpKCB7XHJcblxyXG4gICAgICAvLyBDb21wb25lbnRWZWN0b3JOb2RlT3B0aW9uc1xyXG4gICAgICBhcnJvd09wdGlvbnM6IG1lcmdlKCB7fSwgVmVjdG9yQWRkaXRpb25Db25zdGFudHMuU1VNX0NPTVBPTkVOVF9WRUNUT1JfQVJST1dfT1BUSU9OUywge1xyXG4gICAgICAgIGZpbGw6IGNvbXBvbmVudFZlY3Rvci52ZWN0b3JDb2xvclBhbGV0dGUuc3VtQ29tcG9uZW50RmlsbFxyXG4gICAgICB9IClcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIHN1cGVyKCBjb21wb25lbnRWZWN0b3IsIGdyYXBoLCBjb21wb25lbnRTdHlsZVByb3BlcnR5LCB2YWx1ZXNWaXNpYmxlUHJvcGVydHksIG9wdGlvbnMgKTtcclxuXHJcbiAgICB0aGlzLnN1bVZpc2libGVQcm9wZXJ0eSA9IHN1bVZpc2libGVQcm9wZXJ0eTtcclxuXHJcbiAgICBjb25zdCBzdW1WZWN0b3IgPSBjb21wb25lbnRWZWN0b3IucGFyZW50VmVjdG9yIGFzIFN1bVZlY3RvcjtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHN1bVZlY3RvciBpbnN0YW5jZW9mIFN1bVZlY3RvciApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNpbXBsZS10eXBlLWNoZWNraW5nLWFzc2VydGlvbnNcclxuXHJcbiAgICAvLyBVcGRhdGUgd2hlbiB0aGUgc3VtIGJlY29tZXMgdmlzaWJsZSBvciBkZWZpbmVkLlxyXG4gICAgLy8gdW5saW5rIGlzIHVubmVjZXNzYXJ5LCBleGlzdHMgZm9yIHRoZSBsaWZldGltZSBvZiB0aGUgc2ltLlxyXG4gICAgTXVsdGlsaW5rLm11bHRpbGluayhcclxuICAgICAgWyBzdW1WaXNpYmxlUHJvcGVydHksIHN1bVZlY3Rvci5pc0RlZmluZWRQcm9wZXJ0eSBdLFxyXG4gICAgICAoKSA9PiB0aGlzLnVwZGF0ZUNvbXBvbmVudFZlY3RvciggY29tcG9uZW50VmVjdG9yLFxyXG4gICAgICAgIGdyYXBoLm1vZGVsVmlld1RyYW5zZm9ybVByb3BlcnR5LnZhbHVlLFxyXG4gICAgICAgIGNvbXBvbmVudFN0eWxlUHJvcGVydHkudmFsdWUsXHJcbiAgICAgICAgY29tcG9uZW50VmVjdG9yLmlzUGFyZW50VmVjdG9yQWN0aXZlUHJvcGVydHkudmFsdWUgKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZXMgdmlzaWJpbGl0eSBvZiBzdW0gY29tcG9uZW50IHZlY3RvcnMuXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIG92ZXJyaWRlIHVwZGF0ZUNvbXBvbmVudFZlY3RvciggY29tcG9uZW50VmVjdG9yOiBDb21wb25lbnRWZWN0b3IsIG1vZGVsVmlld1RyYW5zZm9ybTogTW9kZWxWaWV3VHJhbnNmb3JtMixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRTdHlsZTogQ29tcG9uZW50VmVjdG9yU3R5bGVzLCBpc1BhcmVudEFjdGl2ZTogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIHN1cGVyLnVwZGF0ZUNvbXBvbmVudFZlY3RvciggY29tcG9uZW50VmVjdG9yLCBtb2RlbFZpZXdUcmFuc2Zvcm0sIGNvbXBvbmVudFN0eWxlLCBpc1BhcmVudEFjdGl2ZSApO1xyXG5cclxuICAgIGNvbnN0IHN1bVZlY3RvciA9IGNvbXBvbmVudFZlY3Rvci5wYXJlbnRWZWN0b3IgYXMgU3VtVmVjdG9yO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggc3VtVmVjdG9yIGluc3RhbmNlb2YgU3VtVmVjdG9yICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2ltcGxlLXR5cGUtY2hlY2tpbmctYXNzZXJ0aW9uc1xyXG5cclxuICAgIHRoaXMudmlzaWJsZSA9IChcclxuICAgICAgLy8gY29tcG9uZW50cyBhcmUgdmlzaWJsZVxyXG4gICAgICAoIGNvbXBvbmVudFN0eWxlICE9PSBDb21wb25lbnRWZWN0b3JTdHlsZXMuSU5WSVNJQkxFICkgJiZcclxuICAgICAgLy8gc3VtIGlzIHZpc2libGVcclxuICAgICAgKCAhIXRoaXMuc3VtVmlzaWJsZVByb3BlcnR5ICYmIHRoaXMuc3VtVmlzaWJsZVByb3BlcnR5LnZhbHVlICkgJiZcclxuICAgICAgLy8gc3VtIGlzIGRlZmluZWRcclxuICAgICAgc3VtVmVjdG9yLmlzRGVmaW5lZFByb3BlcnR5LnZhbHVlXHJcbiAgICApO1xyXG4gIH1cclxufVxyXG5cclxudmVjdG9yQWRkaXRpb24ucmVnaXN0ZXIoICdTdW1Db21wb25lbnRWZWN0b3JOb2RlJywgU3VtQ29tcG9uZW50VmVjdG9yTm9kZSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsU0FBUyxNQUFNLGtDQUFrQztBQUN4RCxPQUFPQyxLQUFLLE1BQU0sbUNBQW1DO0FBQ3JELE9BQU9DLGNBQWMsTUFBTSx5QkFBeUI7QUFDcEQsT0FBT0MscUJBQXFCLE1BQU0sbUNBQW1DO0FBQ3JFLE9BQU9DLHVCQUF1QixNQUFNLCtCQUErQjtBQUNuRSxPQUFPQyxtQkFBbUIsTUFBc0MsMEJBQTBCO0FBSTFGLE9BQU9DLFNBQVMsTUFBNEIsdUNBQXVDO0FBR25GLE9BQU9DLFNBQVMsTUFBTSx1QkFBdUI7QUFLN0MsZUFBZSxNQUFNQyxzQkFBc0IsU0FBU0gsbUJBQW1CLENBQUM7RUFJL0RJLFdBQVdBLENBQUVDLGVBQWdDLEVBQ2hDQyxLQUFZLEVBQ1pDLHNCQUFrRSxFQUNsRUMscUJBQWlELEVBQ2pEQyxrQkFBOEMsRUFDOUNDLGVBQStDLEVBQUc7SUFFcEUsTUFBTUMsT0FBTyxHQUFHVixTQUFTLENBQXlFLENBQUMsQ0FBRTtNQUVuRztNQUNBVyxZQUFZLEVBQUVoQixLQUFLLENBQUUsQ0FBQyxDQUFDLEVBQUVHLHVCQUF1QixDQUFDYyxrQ0FBa0MsRUFBRTtRQUNuRkMsSUFBSSxFQUFFVCxlQUFlLENBQUNVLGtCQUFrQixDQUFDQztNQUMzQyxDQUFFO0lBQ0osQ0FBQyxFQUFFTixlQUFnQixDQUFDO0lBRXBCLEtBQUssQ0FBRUwsZUFBZSxFQUFFQyxLQUFLLEVBQUVDLHNCQUFzQixFQUFFQyxxQkFBcUIsRUFBRUcsT0FBUSxDQUFDO0lBRXZGLElBQUksQ0FBQ0Ysa0JBQWtCLEdBQUdBLGtCQUFrQjtJQUU1QyxNQUFNUSxTQUFTLEdBQUdaLGVBQWUsQ0FBQ2EsWUFBeUI7SUFDM0RDLE1BQU0sSUFBSUEsTUFBTSxDQUFFRixTQUFTLFlBQVlmLFNBQVUsQ0FBQyxDQUFDLENBQUM7O0lBRXBEO0lBQ0E7SUFDQVAsU0FBUyxDQUFDeUIsU0FBUyxDQUNqQixDQUFFWCxrQkFBa0IsRUFBRVEsU0FBUyxDQUFDSSxpQkFBaUIsQ0FBRSxFQUNuRCxNQUFNLElBQUksQ0FBQ0MscUJBQXFCLENBQUVqQixlQUFlLEVBQy9DQyxLQUFLLENBQUNpQiwwQkFBMEIsQ0FBQ0MsS0FBSyxFQUN0Q2pCLHNCQUFzQixDQUFDaUIsS0FBSyxFQUM1Qm5CLGVBQWUsQ0FBQ29CLDRCQUE0QixDQUFDRCxLQUFNLENBQ3ZELENBQUM7RUFDSDs7RUFFQTtBQUNGO0FBQ0E7RUFDcUJGLHFCQUFxQkEsQ0FBRWpCLGVBQWdDLEVBQUVxQixrQkFBdUMsRUFDekVDLGNBQXFDLEVBQUVDLGNBQXVCLEVBQVM7SUFDL0csS0FBSyxDQUFDTixxQkFBcUIsQ0FBRWpCLGVBQWUsRUFBRXFCLGtCQUFrQixFQUFFQyxjQUFjLEVBQUVDLGNBQWUsQ0FBQztJQUVsRyxNQUFNWCxTQUFTLEdBQUdaLGVBQWUsQ0FBQ2EsWUFBeUI7SUFDM0RDLE1BQU0sSUFBSUEsTUFBTSxDQUFFRixTQUFTLFlBQVlmLFNBQVUsQ0FBQyxDQUFDLENBQUM7O0lBRXBELElBQUksQ0FBQzJCLE9BQU87SUFDVjtJQUNFRixjQUFjLEtBQUs3QixxQkFBcUIsQ0FBQ2dDLFNBQVM7SUFDcEQ7SUFDRSxDQUFDLENBQUMsSUFBSSxDQUFDckIsa0JBQWtCLElBQUksSUFBSSxDQUFDQSxrQkFBa0IsQ0FBQ2UsS0FBTztJQUM5RDtJQUNBUCxTQUFTLENBQUNJLGlCQUFpQixDQUFDRyxLQUM3QjtFQUNIO0FBQ0Y7QUFFQTNCLGNBQWMsQ0FBQ2tDLFFBQVEsQ0FBRSx3QkFBd0IsRUFBRTVCLHNCQUF1QixDQUFDIiwiaWdub3JlTGlzdCI6W119