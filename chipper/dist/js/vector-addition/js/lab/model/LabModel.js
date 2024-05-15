// Copyright 2019-2023, University of Colorado Boulder

/**
 * LabModel is the model for the 'Lab' screen.
 *
 * @author Martin Veillette
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import CoordinateSnapModes from '../../common/model/CoordinateSnapModes.js';
import VectorAdditionModel from '../../common/model/VectorAdditionModel.js';
import VectorAdditionColors from '../../common/VectorAdditionColors.js';
import VectorAdditionConstants from '../../common/VectorAdditionConstants.js';
import vectorAddition from '../../vectorAddition.js';
import LabGraph from './LabGraph.js';
export default class LabModel extends VectorAdditionModel {
  // visibility of the sum for the first vector set

  // visibility of the sum for the second vector set

  // graph for Cartesian snap mode

  // graph for Polar snap mode

  constructor(tandem) {
    super(tandem);
    this.sum1VisibleProperty = new BooleanProperty(VectorAdditionConstants.DEFAULT_SUM_VISIBLE);
    this.sum2VisibleProperty = new BooleanProperty(VectorAdditionConstants.DEFAULT_SUM_VISIBLE);
    this.cartesianVectorColorPalette1 = VectorAdditionColors.BLUE_COLOR_PALETTE;
    this.cartesianVectorColorPalette2 = VectorAdditionColors.ORANGE_COLOR_PALETTE;
    this.polarVectorColorPalette1 = VectorAdditionColors.PINK_COLOR_PALETTE;
    this.polarVectorColorPalette2 = VectorAdditionColors.GREEN_COLOR_PALETTE;
    this.cartesianGraph = new LabGraph(CoordinateSnapModes.CARTESIAN, this.componentStyleProperty, this.sum1VisibleProperty, this.sum2VisibleProperty, this.cartesianVectorColorPalette1, this.cartesianVectorColorPalette2);
    this.polarGraph = new LabGraph(CoordinateSnapModes.POLAR, this.componentStyleProperty, this.sum1VisibleProperty, this.sum2VisibleProperty, this.polarVectorColorPalette1, this.polarVectorColorPalette2);
  }
  reset() {
    super.reset();
    this.sum1VisibleProperty.reset();
    this.sum2VisibleProperty.reset();
    this.cartesianGraph.reset();
    this.polarGraph.reset();
  }
}
vectorAddition.register('LabModel', LabModel);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJDb29yZGluYXRlU25hcE1vZGVzIiwiVmVjdG9yQWRkaXRpb25Nb2RlbCIsIlZlY3RvckFkZGl0aW9uQ29sb3JzIiwiVmVjdG9yQWRkaXRpb25Db25zdGFudHMiLCJ2ZWN0b3JBZGRpdGlvbiIsIkxhYkdyYXBoIiwiTGFiTW9kZWwiLCJjb25zdHJ1Y3RvciIsInRhbmRlbSIsInN1bTFWaXNpYmxlUHJvcGVydHkiLCJERUZBVUxUX1NVTV9WSVNJQkxFIiwic3VtMlZpc2libGVQcm9wZXJ0eSIsImNhcnRlc2lhblZlY3RvckNvbG9yUGFsZXR0ZTEiLCJCTFVFX0NPTE9SX1BBTEVUVEUiLCJjYXJ0ZXNpYW5WZWN0b3JDb2xvclBhbGV0dGUyIiwiT1JBTkdFX0NPTE9SX1BBTEVUVEUiLCJwb2xhclZlY3RvckNvbG9yUGFsZXR0ZTEiLCJQSU5LX0NPTE9SX1BBTEVUVEUiLCJwb2xhclZlY3RvckNvbG9yUGFsZXR0ZTIiLCJHUkVFTl9DT0xPUl9QQUxFVFRFIiwiY2FydGVzaWFuR3JhcGgiLCJDQVJURVNJQU4iLCJjb21wb25lbnRTdHlsZVByb3BlcnR5IiwicG9sYXJHcmFwaCIsIlBPTEFSIiwicmVzZXQiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkxhYk1vZGVsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE5LTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIExhYk1vZGVsIGlzIHRoZSBtb2RlbCBmb3IgdGhlICdMYWInIHNjcmVlbi5cclxuICpcclxuICogQGF1dGhvciBNYXJ0aW4gVmVpbGxldHRlXHJcbiAqL1xyXG5cclxuaW1wb3J0IEJvb2xlYW5Qcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL0Jvb2xlYW5Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcbmltcG9ydCBDb29yZGluYXRlU25hcE1vZGVzIGZyb20gJy4uLy4uL2NvbW1vbi9tb2RlbC9Db29yZGluYXRlU25hcE1vZGVzLmpzJztcclxuaW1wb3J0IFZlY3RvckFkZGl0aW9uTW9kZWwgZnJvbSAnLi4vLi4vY29tbW9uL21vZGVsL1ZlY3RvckFkZGl0aW9uTW9kZWwuanMnO1xyXG5pbXBvcnQgVmVjdG9yQWRkaXRpb25Db2xvcnMgZnJvbSAnLi4vLi4vY29tbW9uL1ZlY3RvckFkZGl0aW9uQ29sb3JzLmpzJztcclxuaW1wb3J0IFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzIGZyb20gJy4uLy4uL2NvbW1vbi9WZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5qcyc7XHJcbmltcG9ydCB2ZWN0b3JBZGRpdGlvbiBmcm9tICcuLi8uLi92ZWN0b3JBZGRpdGlvbi5qcyc7XHJcbmltcG9ydCBMYWJHcmFwaCBmcm9tICcuL0xhYkdyYXBoLmpzJztcclxuaW1wb3J0IFByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgVmVjdG9yQ29sb3JQYWxldHRlIGZyb20gJy4uLy4uL2NvbW1vbi9tb2RlbC9WZWN0b3JDb2xvclBhbGV0dGUuanMnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGFiTW9kZWwgZXh0ZW5kcyBWZWN0b3JBZGRpdGlvbk1vZGVsIHtcclxuXHJcbiAgLy8gdmlzaWJpbGl0eSBvZiB0aGUgc3VtIGZvciB0aGUgZmlyc3QgdmVjdG9yIHNldFxyXG4gIHB1YmxpYyByZWFkb25seSBzdW0xVmlzaWJsZVByb3BlcnR5OiBQcm9wZXJ0eTxib29sZWFuPjtcclxuXHJcbiAgLy8gdmlzaWJpbGl0eSBvZiB0aGUgc3VtIGZvciB0aGUgc2Vjb25kIHZlY3RvciBzZXRcclxuICBwdWJsaWMgcmVhZG9ubHkgc3VtMlZpc2libGVQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIHB1YmxpYyByZWFkb25seSBjYXJ0ZXNpYW5WZWN0b3JDb2xvclBhbGV0dGUxOiBWZWN0b3JDb2xvclBhbGV0dGU7XHJcbiAgcHVibGljIHJlYWRvbmx5IGNhcnRlc2lhblZlY3RvckNvbG9yUGFsZXR0ZTI6IFZlY3RvckNvbG9yUGFsZXR0ZTtcclxuICBwdWJsaWMgcmVhZG9ubHkgcG9sYXJWZWN0b3JDb2xvclBhbGV0dGUxOiBWZWN0b3JDb2xvclBhbGV0dGU7XHJcbiAgcHVibGljIHJlYWRvbmx5IHBvbGFyVmVjdG9yQ29sb3JQYWxldHRlMjogVmVjdG9yQ29sb3JQYWxldHRlO1xyXG5cclxuICAvLyBncmFwaCBmb3IgQ2FydGVzaWFuIHNuYXAgbW9kZVxyXG4gIHB1YmxpYyByZWFkb25seSBjYXJ0ZXNpYW5HcmFwaDogTGFiR3JhcGg7XHJcblxyXG4gIC8vIGdyYXBoIGZvciBQb2xhciBzbmFwIG1vZGVcclxuICBwdWJsaWMgcmVhZG9ubHkgcG9sYXJHcmFwaDogTGFiR3JhcGg7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggdGFuZGVtOiBUYW5kZW0gKSB7XHJcblxyXG4gICAgc3VwZXIoIHRhbmRlbSApO1xyXG5cclxuICAgIHRoaXMuc3VtMVZpc2libGVQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLkRFRkFVTFRfU1VNX1ZJU0lCTEUgKTtcclxuICAgIHRoaXMuc3VtMlZpc2libGVQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLkRFRkFVTFRfU1VNX1ZJU0lCTEUgKTtcclxuXHJcbiAgICB0aGlzLmNhcnRlc2lhblZlY3RvckNvbG9yUGFsZXR0ZTEgPSBWZWN0b3JBZGRpdGlvbkNvbG9ycy5CTFVFX0NPTE9SX1BBTEVUVEU7XHJcbiAgICB0aGlzLmNhcnRlc2lhblZlY3RvckNvbG9yUGFsZXR0ZTIgPSBWZWN0b3JBZGRpdGlvbkNvbG9ycy5PUkFOR0VfQ09MT1JfUEFMRVRURTtcclxuICAgIHRoaXMucG9sYXJWZWN0b3JDb2xvclBhbGV0dGUxID0gVmVjdG9yQWRkaXRpb25Db2xvcnMuUElOS19DT0xPUl9QQUxFVFRFO1xyXG4gICAgdGhpcy5wb2xhclZlY3RvckNvbG9yUGFsZXR0ZTIgPSBWZWN0b3JBZGRpdGlvbkNvbG9ycy5HUkVFTl9DT0xPUl9QQUxFVFRFO1xyXG5cclxuICAgIHRoaXMuY2FydGVzaWFuR3JhcGggPSBuZXcgTGFiR3JhcGgoXHJcbiAgICAgIENvb3JkaW5hdGVTbmFwTW9kZXMuQ0FSVEVTSUFOLFxyXG4gICAgICB0aGlzLmNvbXBvbmVudFN0eWxlUHJvcGVydHksXHJcbiAgICAgIHRoaXMuc3VtMVZpc2libGVQcm9wZXJ0eSxcclxuICAgICAgdGhpcy5zdW0yVmlzaWJsZVByb3BlcnR5LFxyXG4gICAgICB0aGlzLmNhcnRlc2lhblZlY3RvckNvbG9yUGFsZXR0ZTEsXHJcbiAgICAgIHRoaXMuY2FydGVzaWFuVmVjdG9yQ29sb3JQYWxldHRlMlxyXG4gICAgKTtcclxuXHJcbiAgICB0aGlzLnBvbGFyR3JhcGggPSBuZXcgTGFiR3JhcGgoXHJcbiAgICAgIENvb3JkaW5hdGVTbmFwTW9kZXMuUE9MQVIsXHJcbiAgICAgIHRoaXMuY29tcG9uZW50U3R5bGVQcm9wZXJ0eSxcclxuICAgICAgdGhpcy5zdW0xVmlzaWJsZVByb3BlcnR5LFxyXG4gICAgICB0aGlzLnN1bTJWaXNpYmxlUHJvcGVydHksXHJcbiAgICAgIHRoaXMucG9sYXJWZWN0b3JDb2xvclBhbGV0dGUxLFxyXG4gICAgICB0aGlzLnBvbGFyVmVjdG9yQ29sb3JQYWxldHRlMlxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSByZXNldCgpOiB2b2lkIHtcclxuICAgIHN1cGVyLnJlc2V0KCk7XHJcbiAgICB0aGlzLnN1bTFWaXNpYmxlUHJvcGVydHkucmVzZXQoKTtcclxuICAgIHRoaXMuc3VtMlZpc2libGVQcm9wZXJ0eS5yZXNldCgpO1xyXG4gICAgdGhpcy5jYXJ0ZXNpYW5HcmFwaC5yZXNldCgpO1xyXG4gICAgdGhpcy5wb2xhckdyYXBoLnJlc2V0KCk7XHJcbiAgfVxyXG59XHJcblxyXG52ZWN0b3JBZGRpdGlvbi5yZWdpc3RlciggJ0xhYk1vZGVsJywgTGFiTW9kZWwgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsZUFBZSxNQUFNLHdDQUF3QztBQUVwRSxPQUFPQyxtQkFBbUIsTUFBTSwyQ0FBMkM7QUFDM0UsT0FBT0MsbUJBQW1CLE1BQU0sMkNBQTJDO0FBQzNFLE9BQU9DLG9CQUFvQixNQUFNLHNDQUFzQztBQUN2RSxPQUFPQyx1QkFBdUIsTUFBTSx5Q0FBeUM7QUFDN0UsT0FBT0MsY0FBYyxNQUFNLHlCQUF5QjtBQUNwRCxPQUFPQyxRQUFRLE1BQU0sZUFBZTtBQUlwQyxlQUFlLE1BQU1DLFFBQVEsU0FBU0wsbUJBQW1CLENBQUM7RUFFeEQ7O0VBR0E7O0VBUUE7O0VBR0E7O0VBR09NLFdBQVdBLENBQUVDLE1BQWMsRUFBRztJQUVuQyxLQUFLLENBQUVBLE1BQU8sQ0FBQztJQUVmLElBQUksQ0FBQ0MsbUJBQW1CLEdBQUcsSUFBSVYsZUFBZSxDQUFFSSx1QkFBdUIsQ0FBQ08sbUJBQW9CLENBQUM7SUFDN0YsSUFBSSxDQUFDQyxtQkFBbUIsR0FBRyxJQUFJWixlQUFlLENBQUVJLHVCQUF1QixDQUFDTyxtQkFBb0IsQ0FBQztJQUU3RixJQUFJLENBQUNFLDRCQUE0QixHQUFHVixvQkFBb0IsQ0FBQ1csa0JBQWtCO0lBQzNFLElBQUksQ0FBQ0MsNEJBQTRCLEdBQUdaLG9CQUFvQixDQUFDYSxvQkFBb0I7SUFDN0UsSUFBSSxDQUFDQyx3QkFBd0IsR0FBR2Qsb0JBQW9CLENBQUNlLGtCQUFrQjtJQUN2RSxJQUFJLENBQUNDLHdCQUF3QixHQUFHaEIsb0JBQW9CLENBQUNpQixtQkFBbUI7SUFFeEUsSUFBSSxDQUFDQyxjQUFjLEdBQUcsSUFBSWYsUUFBUSxDQUNoQ0wsbUJBQW1CLENBQUNxQixTQUFTLEVBQzdCLElBQUksQ0FBQ0Msc0JBQXNCLEVBQzNCLElBQUksQ0FBQ2IsbUJBQW1CLEVBQ3hCLElBQUksQ0FBQ0UsbUJBQW1CLEVBQ3hCLElBQUksQ0FBQ0MsNEJBQTRCLEVBQ2pDLElBQUksQ0FBQ0UsNEJBQ1AsQ0FBQztJQUVELElBQUksQ0FBQ1MsVUFBVSxHQUFHLElBQUlsQixRQUFRLENBQzVCTCxtQkFBbUIsQ0FBQ3dCLEtBQUssRUFDekIsSUFBSSxDQUFDRixzQkFBc0IsRUFDM0IsSUFBSSxDQUFDYixtQkFBbUIsRUFDeEIsSUFBSSxDQUFDRSxtQkFBbUIsRUFDeEIsSUFBSSxDQUFDSyx3QkFBd0IsRUFDN0IsSUFBSSxDQUFDRSx3QkFDUCxDQUFDO0VBQ0g7RUFFZ0JPLEtBQUtBLENBQUEsRUFBUztJQUM1QixLQUFLLENBQUNBLEtBQUssQ0FBQyxDQUFDO0lBQ2IsSUFBSSxDQUFDaEIsbUJBQW1CLENBQUNnQixLQUFLLENBQUMsQ0FBQztJQUNoQyxJQUFJLENBQUNkLG1CQUFtQixDQUFDYyxLQUFLLENBQUMsQ0FBQztJQUNoQyxJQUFJLENBQUNMLGNBQWMsQ0FBQ0ssS0FBSyxDQUFDLENBQUM7SUFDM0IsSUFBSSxDQUFDRixVQUFVLENBQUNFLEtBQUssQ0FBQyxDQUFDO0VBQ3pCO0FBQ0Y7QUFFQXJCLGNBQWMsQ0FBQ3NCLFFBQVEsQ0FBRSxVQUFVLEVBQUVwQixRQUFTLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=