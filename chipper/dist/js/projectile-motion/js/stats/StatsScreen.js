// Copyright 2022-2024, University of Colorado Boulder

/**
 * The 'Stats' screen.
 *
 * @author Matthew Blackman (PhET Interactive Simulations)
 */

import Property from '../../../axon/js/Property.js';
import Screen from '../../../joist/js/Screen.js';
import ScreenIcon from '../../../joist/js/ScreenIcon.js';
import projectileMotion from '../projectileMotion.js';
import ProjectileMotionStrings from '../ProjectileMotionStrings.js';
import StatsModel from './model/StatsModel.js';
import StatsIconNode from './view/StatsIconNode.js';
import StatsScreenView from './view/StatsScreenView.js';
class StatsScreen extends Screen {
  /**
   * @param {Tandem} tandem
   */
  constructor(tandem) {
    const options = {
      name: ProjectileMotionStrings.screen.statsStringProperty,
      backgroundColorProperty: new Property('white'),
      homeScreenIcon: new ScreenIcon(new StatsIconNode('screen'), {
        maxIconWidthProportion: 1,
        maxIconHeightProportion: 1
      }),
      navigationBarIcon: new ScreenIcon(new StatsIconNode('nav'), {
        maxIconWidthProportion: 1,
        maxIconHeightProportion: 1
      }),
      tandem: tandem
    };
    super(() => new StatsModel(tandem.createTandem('model')), model => new StatsScreenView(model, {
      tandem: tandem.createTandem('view')
    }), options);
  }
}
projectileMotion.register('StatsScreen', StatsScreen);
export default StatsScreen;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQcm9wZXJ0eSIsIlNjcmVlbiIsIlNjcmVlbkljb24iLCJwcm9qZWN0aWxlTW90aW9uIiwiUHJvamVjdGlsZU1vdGlvblN0cmluZ3MiLCJTdGF0c01vZGVsIiwiU3RhdHNJY29uTm9kZSIsIlN0YXRzU2NyZWVuVmlldyIsIlN0YXRzU2NyZWVuIiwiY29uc3RydWN0b3IiLCJ0YW5kZW0iLCJvcHRpb25zIiwibmFtZSIsInNjcmVlbiIsInN0YXRzU3RyaW5nUHJvcGVydHkiLCJiYWNrZ3JvdW5kQ29sb3JQcm9wZXJ0eSIsImhvbWVTY3JlZW5JY29uIiwibWF4SWNvbldpZHRoUHJvcG9ydGlvbiIsIm1heEljb25IZWlnaHRQcm9wb3J0aW9uIiwibmF2aWdhdGlvbkJhckljb24iLCJjcmVhdGVUYW5kZW0iLCJtb2RlbCIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiU3RhdHNTY3JlZW4uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjItMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVGhlICdTdGF0cycgc2NyZWVuLlxyXG4gKlxyXG4gKiBAYXV0aG9yIE1hdHRoZXcgQmxhY2ttYW4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IFByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgU2NyZWVuIGZyb20gJy4uLy4uLy4uL2pvaXN0L2pzL1NjcmVlbi5qcyc7XHJcbmltcG9ydCBTY3JlZW5JY29uIGZyb20gJy4uLy4uLy4uL2pvaXN0L2pzL1NjcmVlbkljb24uanMnO1xyXG5pbXBvcnQgcHJvamVjdGlsZU1vdGlvbiBmcm9tICcuLi9wcm9qZWN0aWxlTW90aW9uLmpzJztcclxuaW1wb3J0IFByb2plY3RpbGVNb3Rpb25TdHJpbmdzIGZyb20gJy4uL1Byb2plY3RpbGVNb3Rpb25TdHJpbmdzLmpzJztcclxuaW1wb3J0IFN0YXRzTW9kZWwgZnJvbSAnLi9tb2RlbC9TdGF0c01vZGVsLmpzJztcclxuaW1wb3J0IFN0YXRzSWNvbk5vZGUgZnJvbSAnLi92aWV3L1N0YXRzSWNvbk5vZGUuanMnO1xyXG5pbXBvcnQgU3RhdHNTY3JlZW5WaWV3IGZyb20gJy4vdmlldy9TdGF0c1NjcmVlblZpZXcuanMnO1xyXG5cclxuY2xhc3MgU3RhdHNTY3JlZW4gZXh0ZW5kcyBTY3JlZW4ge1xyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSB7VGFuZGVtfSB0YW5kZW1cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvciggdGFuZGVtICkge1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgbmFtZTogUHJvamVjdGlsZU1vdGlvblN0cmluZ3Muc2NyZWVuLnN0YXRzU3RyaW5nUHJvcGVydHksXHJcbiAgICAgIGJhY2tncm91bmRDb2xvclByb3BlcnR5OiBuZXcgUHJvcGVydHkoICd3aGl0ZScgKSxcclxuICAgICAgaG9tZVNjcmVlbkljb246IG5ldyBTY3JlZW5JY29uKCBuZXcgU3RhdHNJY29uTm9kZSggJ3NjcmVlbicgKSwge1xyXG4gICAgICAgIG1heEljb25XaWR0aFByb3BvcnRpb246IDEsXHJcbiAgICAgICAgbWF4SWNvbkhlaWdodFByb3BvcnRpb246IDFcclxuICAgICAgfSApLFxyXG4gICAgICBuYXZpZ2F0aW9uQmFySWNvbjogbmV3IFNjcmVlbkljb24oIG5ldyBTdGF0c0ljb25Ob2RlKCAnbmF2JyApLCB7XHJcbiAgICAgICAgbWF4SWNvbldpZHRoUHJvcG9ydGlvbjogMSxcclxuICAgICAgICBtYXhJY29uSGVpZ2h0UHJvcG9ydGlvbjogMVxyXG4gICAgICB9ICksXHJcbiAgICAgIHRhbmRlbTogdGFuZGVtXHJcbiAgICB9O1xyXG5cclxuICAgIHN1cGVyKFxyXG4gICAgICAoKSA9PiBuZXcgU3RhdHNNb2RlbCggdGFuZGVtLmNyZWF0ZVRhbmRlbSggJ21vZGVsJyApICksXHJcbiAgICAgIG1vZGVsID0+IG5ldyBTdGF0c1NjcmVlblZpZXcoIG1vZGVsLCB7IHRhbmRlbTogdGFuZGVtLmNyZWF0ZVRhbmRlbSggJ3ZpZXcnICkgfSApLFxyXG4gICAgICBvcHRpb25zXHJcbiAgICApO1xyXG4gIH1cclxufVxyXG5cclxucHJvamVjdGlsZU1vdGlvbi5yZWdpc3RlciggJ1N0YXRzU2NyZWVuJywgU3RhdHNTY3JlZW4gKTtcclxuZXhwb3J0IGRlZmF1bHQgU3RhdHNTY3JlZW47Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFFBQVEsTUFBTSw4QkFBOEI7QUFDbkQsT0FBT0MsTUFBTSxNQUFNLDZCQUE2QjtBQUNoRCxPQUFPQyxVQUFVLE1BQU0saUNBQWlDO0FBQ3hELE9BQU9DLGdCQUFnQixNQUFNLHdCQUF3QjtBQUNyRCxPQUFPQyx1QkFBdUIsTUFBTSwrQkFBK0I7QUFDbkUsT0FBT0MsVUFBVSxNQUFNLHVCQUF1QjtBQUM5QyxPQUFPQyxhQUFhLE1BQU0seUJBQXlCO0FBQ25ELE9BQU9DLGVBQWUsTUFBTSwyQkFBMkI7QUFFdkQsTUFBTUMsV0FBVyxTQUFTUCxNQUFNLENBQUM7RUFDL0I7QUFDRjtBQUNBO0VBQ0VRLFdBQVdBLENBQUVDLE1BQU0sRUFBRztJQUNwQixNQUFNQyxPQUFPLEdBQUc7TUFDZEMsSUFBSSxFQUFFUix1QkFBdUIsQ0FBQ1MsTUFBTSxDQUFDQyxtQkFBbUI7TUFDeERDLHVCQUF1QixFQUFFLElBQUlmLFFBQVEsQ0FBRSxPQUFRLENBQUM7TUFDaERnQixjQUFjLEVBQUUsSUFBSWQsVUFBVSxDQUFFLElBQUlJLGFBQWEsQ0FBRSxRQUFTLENBQUMsRUFBRTtRQUM3RFcsc0JBQXNCLEVBQUUsQ0FBQztRQUN6QkMsdUJBQXVCLEVBQUU7TUFDM0IsQ0FBRSxDQUFDO01BQ0hDLGlCQUFpQixFQUFFLElBQUlqQixVQUFVLENBQUUsSUFBSUksYUFBYSxDQUFFLEtBQU0sQ0FBQyxFQUFFO1FBQzdEVyxzQkFBc0IsRUFBRSxDQUFDO1FBQ3pCQyx1QkFBdUIsRUFBRTtNQUMzQixDQUFFLENBQUM7TUFDSFIsTUFBTSxFQUFFQTtJQUNWLENBQUM7SUFFRCxLQUFLLENBQ0gsTUFBTSxJQUFJTCxVQUFVLENBQUVLLE1BQU0sQ0FBQ1UsWUFBWSxDQUFFLE9BQVEsQ0FBRSxDQUFDLEVBQ3REQyxLQUFLLElBQUksSUFBSWQsZUFBZSxDQUFFYyxLQUFLLEVBQUU7TUFBRVgsTUFBTSxFQUFFQSxNQUFNLENBQUNVLFlBQVksQ0FBRSxNQUFPO0lBQUUsQ0FBRSxDQUFDLEVBQ2hGVCxPQUNGLENBQUM7RUFDSDtBQUNGO0FBRUFSLGdCQUFnQixDQUFDbUIsUUFBUSxDQUFFLGFBQWEsRUFBRWQsV0FBWSxDQUFDO0FBQ3ZELGVBQWVBLFdBQVciLCJpZ25vcmVMaXN0IjpbXX0=