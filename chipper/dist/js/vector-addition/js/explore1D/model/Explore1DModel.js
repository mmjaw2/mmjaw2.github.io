// Copyright 2019-2023, University of Colorado Boulder

/**
 * Explore1DModel is the model for the 'Explore 1D' screen.
 *
 * @author Martin Veillette
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import GraphOrientations from '../../common/model/GraphOrientations.js';
import VectorAdditionModel from '../../common/model/VectorAdditionModel.js';
import VectorAdditionColors from '../../common/VectorAdditionColors.js';
import VectorAdditionConstants from '../../common/VectorAdditionConstants.js';
import vectorAddition from '../../vectorAddition.js';
import Explore1DGraph from './Explore1DGraph.js';
export default class Explore1DModel extends VectorAdditionModel {
  // Property controlling the visibility of the sum for both Graph instances

  // graph for the horizontal (x-axis) orientation

  // graph for the vertical (y-axis) orientation

  constructor(tandem) {
    super(tandem);
    this.sumVisibleProperty = new BooleanProperty(VectorAdditionConstants.DEFAULT_SUM_VISIBLE);
    this.horizontalVectorColorPalette = VectorAdditionColors.BLUE_COLOR_PALETTE;
    this.verticalVectorColorPalette = VectorAdditionColors.BLUE_COLOR_PALETTE;
    this.horizontalGraph = new Explore1DGraph(GraphOrientations.HORIZONTAL, this.componentStyleProperty, this.sumVisibleProperty, this.horizontalVectorColorPalette);
    this.verticalGraph = new Explore1DGraph(GraphOrientations.VERTICAL, this.componentStyleProperty, this.sumVisibleProperty, this.verticalVectorColorPalette);
  }
  reset() {
    super.reset();
    this.sumVisibleProperty.reset();
    this.horizontalGraph.reset();
    this.verticalGraph.reset();
  }
}
vectorAddition.register('Explore1DModel', Explore1DModel);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJHcmFwaE9yaWVudGF0aW9ucyIsIlZlY3RvckFkZGl0aW9uTW9kZWwiLCJWZWN0b3JBZGRpdGlvbkNvbG9ycyIsIlZlY3RvckFkZGl0aW9uQ29uc3RhbnRzIiwidmVjdG9yQWRkaXRpb24iLCJFeHBsb3JlMURHcmFwaCIsIkV4cGxvcmUxRE1vZGVsIiwiY29uc3RydWN0b3IiLCJ0YW5kZW0iLCJzdW1WaXNpYmxlUHJvcGVydHkiLCJERUZBVUxUX1NVTV9WSVNJQkxFIiwiaG9yaXpvbnRhbFZlY3RvckNvbG9yUGFsZXR0ZSIsIkJMVUVfQ09MT1JfUEFMRVRURSIsInZlcnRpY2FsVmVjdG9yQ29sb3JQYWxldHRlIiwiaG9yaXpvbnRhbEdyYXBoIiwiSE9SSVpPTlRBTCIsImNvbXBvbmVudFN0eWxlUHJvcGVydHkiLCJ2ZXJ0aWNhbEdyYXBoIiwiVkVSVElDQUwiLCJyZXNldCIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiRXhwbG9yZTFETW9kZWwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogRXhwbG9yZTFETW9kZWwgaXMgdGhlIG1vZGVsIGZvciB0aGUgJ0V4cGxvcmUgMUQnIHNjcmVlbi5cclxuICpcclxuICogQGF1dGhvciBNYXJ0aW4gVmVpbGxldHRlXHJcbiAqL1xyXG5cclxuaW1wb3J0IEJvb2xlYW5Qcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL0Jvb2xlYW5Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcbmltcG9ydCBHcmFwaE9yaWVudGF0aW9ucyBmcm9tICcuLi8uLi9jb21tb24vbW9kZWwvR3JhcGhPcmllbnRhdGlvbnMuanMnO1xyXG5pbXBvcnQgVmVjdG9yQWRkaXRpb25Nb2RlbCBmcm9tICcuLi8uLi9jb21tb24vbW9kZWwvVmVjdG9yQWRkaXRpb25Nb2RlbC5qcyc7XHJcbmltcG9ydCBWZWN0b3JBZGRpdGlvbkNvbG9ycyBmcm9tICcuLi8uLi9jb21tb24vVmVjdG9yQWRkaXRpb25Db2xvcnMuanMnO1xyXG5pbXBvcnQgVmVjdG9yQWRkaXRpb25Db25zdGFudHMgZnJvbSAnLi4vLi4vY29tbW9uL1ZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLmpzJztcclxuaW1wb3J0IHZlY3RvckFkZGl0aW9uIGZyb20gJy4uLy4uL3ZlY3RvckFkZGl0aW9uLmpzJztcclxuaW1wb3J0IEV4cGxvcmUxREdyYXBoIGZyb20gJy4vRXhwbG9yZTFER3JhcGguanMnO1xyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBWZWN0b3JDb2xvclBhbGV0dGUgZnJvbSAnLi4vLi4vY29tbW9uL21vZGVsL1ZlY3RvckNvbG9yUGFsZXR0ZS5qcyc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFeHBsb3JlMURNb2RlbCBleHRlbmRzIFZlY3RvckFkZGl0aW9uTW9kZWwge1xyXG5cclxuICAvLyBQcm9wZXJ0eSBjb250cm9sbGluZyB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgc3VtIGZvciBib3RoIEdyYXBoIGluc3RhbmNlc1xyXG4gIHB1YmxpYyByZWFkb25seSBzdW1WaXNpYmxlUHJvcGVydHk6IFByb3BlcnR5PGJvb2xlYW4+O1xyXG5cclxuICBwdWJsaWMgcmVhZG9ubHkgaG9yaXpvbnRhbFZlY3RvckNvbG9yUGFsZXR0ZTogVmVjdG9yQ29sb3JQYWxldHRlO1xyXG4gIHB1YmxpYyByZWFkb25seSB2ZXJ0aWNhbFZlY3RvckNvbG9yUGFsZXR0ZTogVmVjdG9yQ29sb3JQYWxldHRlO1xyXG5cclxuICAvLyBncmFwaCBmb3IgdGhlIGhvcml6b250YWwgKHgtYXhpcykgb3JpZW50YXRpb25cclxuICBwdWJsaWMgcmVhZG9ubHkgaG9yaXpvbnRhbEdyYXBoOiBFeHBsb3JlMURHcmFwaDtcclxuXHJcbiAgLy8gZ3JhcGggZm9yIHRoZSB2ZXJ0aWNhbCAoeS1heGlzKSBvcmllbnRhdGlvblxyXG4gIHB1YmxpYyByZWFkb25seSB2ZXJ0aWNhbEdyYXBoOiBFeHBsb3JlMURHcmFwaDtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCB0YW5kZW06IFRhbmRlbSApIHtcclxuXHJcbiAgICBzdXBlciggdGFuZGVtICk7XHJcblxyXG4gICAgdGhpcy5zdW1WaXNpYmxlUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCBWZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5ERUZBVUxUX1NVTV9WSVNJQkxFICk7XHJcblxyXG4gICAgdGhpcy5ob3Jpem9udGFsVmVjdG9yQ29sb3JQYWxldHRlID0gVmVjdG9yQWRkaXRpb25Db2xvcnMuQkxVRV9DT0xPUl9QQUxFVFRFO1xyXG4gICAgdGhpcy52ZXJ0aWNhbFZlY3RvckNvbG9yUGFsZXR0ZSA9IFZlY3RvckFkZGl0aW9uQ29sb3JzLkJMVUVfQ09MT1JfUEFMRVRURTtcclxuXHJcbiAgICB0aGlzLmhvcml6b250YWxHcmFwaCA9IG5ldyBFeHBsb3JlMURHcmFwaCggR3JhcGhPcmllbnRhdGlvbnMuSE9SSVpPTlRBTCxcclxuICAgICAgdGhpcy5jb21wb25lbnRTdHlsZVByb3BlcnR5LFxyXG4gICAgICB0aGlzLnN1bVZpc2libGVQcm9wZXJ0eSxcclxuICAgICAgdGhpcy5ob3Jpem9udGFsVmVjdG9yQ29sb3JQYWxldHRlICk7XHJcblxyXG4gICAgdGhpcy52ZXJ0aWNhbEdyYXBoID0gbmV3IEV4cGxvcmUxREdyYXBoKCBHcmFwaE9yaWVudGF0aW9ucy5WRVJUSUNBTCxcclxuICAgICAgdGhpcy5jb21wb25lbnRTdHlsZVByb3BlcnR5LFxyXG4gICAgICB0aGlzLnN1bVZpc2libGVQcm9wZXJ0eSxcclxuICAgICAgdGhpcy52ZXJ0aWNhbFZlY3RvckNvbG9yUGFsZXR0ZSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG92ZXJyaWRlIHJlc2V0KCk6IHZvaWQge1xyXG4gICAgc3VwZXIucmVzZXQoKTtcclxuICAgIHRoaXMuc3VtVmlzaWJsZVByb3BlcnR5LnJlc2V0KCk7XHJcbiAgICB0aGlzLmhvcml6b250YWxHcmFwaC5yZXNldCgpO1xyXG4gICAgdGhpcy52ZXJ0aWNhbEdyYXBoLnJlc2V0KCk7XHJcbiAgfVxyXG59XHJcblxyXG52ZWN0b3JBZGRpdGlvbi5yZWdpc3RlciggJ0V4cGxvcmUxRE1vZGVsJywgRXhwbG9yZTFETW9kZWwgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsZUFBZSxNQUFNLHdDQUF3QztBQUVwRSxPQUFPQyxpQkFBaUIsTUFBTSx5Q0FBeUM7QUFDdkUsT0FBT0MsbUJBQW1CLE1BQU0sMkNBQTJDO0FBQzNFLE9BQU9DLG9CQUFvQixNQUFNLHNDQUFzQztBQUN2RSxPQUFPQyx1QkFBdUIsTUFBTSx5Q0FBeUM7QUFDN0UsT0FBT0MsY0FBYyxNQUFNLHlCQUF5QjtBQUNwRCxPQUFPQyxjQUFjLE1BQU0scUJBQXFCO0FBSWhELGVBQWUsTUFBTUMsY0FBYyxTQUFTTCxtQkFBbUIsQ0FBQztFQUU5RDs7RUFNQTs7RUFHQTs7RUFHT00sV0FBV0EsQ0FBRUMsTUFBYyxFQUFHO0lBRW5DLEtBQUssQ0FBRUEsTUFBTyxDQUFDO0lBRWYsSUFBSSxDQUFDQyxrQkFBa0IsR0FBRyxJQUFJVixlQUFlLENBQUVJLHVCQUF1QixDQUFDTyxtQkFBb0IsQ0FBQztJQUU1RixJQUFJLENBQUNDLDRCQUE0QixHQUFHVCxvQkFBb0IsQ0FBQ1Usa0JBQWtCO0lBQzNFLElBQUksQ0FBQ0MsMEJBQTBCLEdBQUdYLG9CQUFvQixDQUFDVSxrQkFBa0I7SUFFekUsSUFBSSxDQUFDRSxlQUFlLEdBQUcsSUFBSVQsY0FBYyxDQUFFTCxpQkFBaUIsQ0FBQ2UsVUFBVSxFQUNyRSxJQUFJLENBQUNDLHNCQUFzQixFQUMzQixJQUFJLENBQUNQLGtCQUFrQixFQUN2QixJQUFJLENBQUNFLDRCQUE2QixDQUFDO0lBRXJDLElBQUksQ0FBQ00sYUFBYSxHQUFHLElBQUlaLGNBQWMsQ0FBRUwsaUJBQWlCLENBQUNrQixRQUFRLEVBQ2pFLElBQUksQ0FBQ0Ysc0JBQXNCLEVBQzNCLElBQUksQ0FBQ1Asa0JBQWtCLEVBQ3ZCLElBQUksQ0FBQ0ksMEJBQTJCLENBQUM7RUFDckM7RUFFZ0JNLEtBQUtBLENBQUEsRUFBUztJQUM1QixLQUFLLENBQUNBLEtBQUssQ0FBQyxDQUFDO0lBQ2IsSUFBSSxDQUFDVixrQkFBa0IsQ0FBQ1UsS0FBSyxDQUFDLENBQUM7SUFDL0IsSUFBSSxDQUFDTCxlQUFlLENBQUNLLEtBQUssQ0FBQyxDQUFDO0lBQzVCLElBQUksQ0FBQ0YsYUFBYSxDQUFDRSxLQUFLLENBQUMsQ0FBQztFQUM1QjtBQUNGO0FBRUFmLGNBQWMsQ0FBQ2dCLFFBQVEsQ0FBRSxnQkFBZ0IsRUFBRWQsY0FBZSxDQUFDIiwiaWdub3JlTGlzdCI6W119