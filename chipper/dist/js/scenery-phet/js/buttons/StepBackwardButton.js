// Copyright 2014-2022, University of Colorado Boulder

/**
 * Step backward button.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import optionize from '../../../phet-core/js/optionize.js';
import stepBackwardSoundPlayer from '../../../tambo/js/shared-sound-players/stepBackwardSoundPlayer.js';
import sceneryPhet from '../sceneryPhet.js';
import StepButton from './StepButton.js';
export default class StepBackwardButton extends StepButton {
  constructor(providedOptions) {
    const options = optionize()({
      // StepButtonOptions
      direction: 'backward',
      soundPlayer: stepBackwardSoundPlayer
    }, providedOptions);
    super(options);
  }
}
sceneryPhet.register('StepBackwardButton', StepBackwardButton);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJvcHRpb25pemUiLCJzdGVwQmFja3dhcmRTb3VuZFBsYXllciIsInNjZW5lcnlQaGV0IiwiU3RlcEJ1dHRvbiIsIlN0ZXBCYWNrd2FyZEJ1dHRvbiIsImNvbnN0cnVjdG9yIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsImRpcmVjdGlvbiIsInNvdW5kUGxheWVyIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJTdGVwQmFja3dhcmRCdXR0b24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTQtMjAyMiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogU3RlcCBiYWNrd2FyZCBidXR0b24uXHJcbiAqXHJcbiAqIEBhdXRob3IgQ2hyaXMgTWFsbGV5IChQaXhlbFpvb20sIEluYy4pXHJcbiAqL1xyXG5cclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBFbXB0eVNlbGZPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IHN0ZXBCYWNrd2FyZFNvdW5kUGxheWVyIGZyb20gJy4uLy4uLy4uL3RhbWJvL2pzL3NoYXJlZC1zb3VuZC1wbGF5ZXJzL3N0ZXBCYWNrd2FyZFNvdW5kUGxheWVyLmpzJztcclxuaW1wb3J0IHNjZW5lcnlQaGV0IGZyb20gJy4uL3NjZW5lcnlQaGV0LmpzJztcclxuaW1wb3J0IFN0ZXBCdXR0b24sIHsgU3RlcEJ1dHRvbk9wdGlvbnMgfSBmcm9tICcuL1N0ZXBCdXR0b24uanMnO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IEVtcHR5U2VsZk9wdGlvbnM7XHJcblxyXG5leHBvcnQgdHlwZSBTdGVwQmFja3dhcmRCdXR0b25PcHRpb25zID0gU2VsZk9wdGlvbnMgJiBTdHJpY3RPbWl0PFN0ZXBCdXR0b25PcHRpb25zLCAnZGlyZWN0aW9uJz47XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTdGVwQmFja3dhcmRCdXR0b24gZXh0ZW5kcyBTdGVwQnV0dG9uIHtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBwcm92aWRlZE9wdGlvbnM/OiBTdGVwQmFja3dhcmRCdXR0b25PcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8U3RlcEJhY2t3YXJkQnV0dG9uT3B0aW9ucywgU2VsZk9wdGlvbnMsIFN0ZXBCdXR0b25PcHRpb25zPigpKCB7XHJcblxyXG4gICAgICAvLyBTdGVwQnV0dG9uT3B0aW9uc1xyXG4gICAgICBkaXJlY3Rpb246ICdiYWNrd2FyZCcsXHJcbiAgICAgIHNvdW5kUGxheWVyOiBzdGVwQmFja3dhcmRTb3VuZFBsYXllclxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgc3VwZXIoIG9wdGlvbnMgKTtcclxuICB9XHJcbn1cclxuXHJcbnNjZW5lcnlQaGV0LnJlZ2lzdGVyKCAnU3RlcEJhY2t3YXJkQnV0dG9uJywgU3RlcEJhY2t3YXJkQnV0dG9uICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFNBQVMsTUFBNEIsb0NBQW9DO0FBRWhGLE9BQU9DLHVCQUF1QixNQUFNLG1FQUFtRTtBQUN2RyxPQUFPQyxXQUFXLE1BQU0sbUJBQW1CO0FBQzNDLE9BQU9DLFVBQVUsTUFBNkIsaUJBQWlCO0FBTS9ELGVBQWUsTUFBTUMsa0JBQWtCLFNBQVNELFVBQVUsQ0FBQztFQUVsREUsV0FBV0EsQ0FBRUMsZUFBMkMsRUFBRztJQUVoRSxNQUFNQyxPQUFPLEdBQUdQLFNBQVMsQ0FBNEQsQ0FBQyxDQUFFO01BRXRGO01BQ0FRLFNBQVMsRUFBRSxVQUFVO01BQ3JCQyxXQUFXLEVBQUVSO0lBQ2YsQ0FBQyxFQUFFSyxlQUFnQixDQUFDO0lBRXBCLEtBQUssQ0FBRUMsT0FBUSxDQUFDO0VBQ2xCO0FBQ0Y7QUFFQUwsV0FBVyxDQUFDUSxRQUFRLENBQUUsb0JBQW9CLEVBQUVOLGtCQUFtQixDQUFDIiwiaWdub3JlTGlzdCI6W119