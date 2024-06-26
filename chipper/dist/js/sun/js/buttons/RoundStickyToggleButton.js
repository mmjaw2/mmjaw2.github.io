// Copyright 2014-2024, University of Colorado Boulder

/**
 * RoundStickyToggleButton is a round toggle button that toggles the value of a Property between 2 values.
 * It has a different look (referred to as 'up' and 'down') for the 2 values.
 *
 * @author John Blanco (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import optionize from '../../../phet-core/js/optionize.js';
import pushButtonSoundPlayer from '../../../tambo/js/shared-sound-players/pushButtonSoundPlayer.js';
import Tandem from '../../../tandem/js/Tandem.js';
import sun from '../sun.js';
import RoundButton from './RoundButton.js';
import StickyToggleButtonInteractionStateProperty from './StickyToggleButtonInteractionStateProperty.js';
import StickyToggleButtonModel from './StickyToggleButtonModel.js';
export default class RoundStickyToggleButton extends RoundButton {
  /**
   * @param valueProperty - axon Property that can be either valueUp or valueDown.
   * @param valueUp - value when the toggle is in the 'up' position
   * @param valueDown - value when the toggle is in the 'down' position
   * @param providedOptions?
   */
  constructor(valueProperty, valueUp, valueDown, providedOptions) {
    assert && assert(valueProperty.valueComparisonStrategy === 'reference', 'RoundStickyToggleButton depends on "===" equality for value comparison');
    const options = optionize()({
      // SelfOptions
      soundPlayer: pushButtonSoundPlayer,
      // RoundButtonOptions
      tandem: Tandem.REQUIRED
    }, providedOptions);

    // Note it shares a tandem with this, so the emitter will be instrumented as a child of the button
    const toggleButtonModel = new StickyToggleButtonModel(valueUp, valueDown, valueProperty, options);
    const stickyToggleButtonInteractionStateProperty = new StickyToggleButtonInteractionStateProperty(toggleButtonModel);
    super(toggleButtonModel, stickyToggleButtonInteractionStateProperty, options);

    // sound generation
    const playSound = () => options.soundPlayer.play();
    toggleButtonModel.produceSoundEmitter.addListener(playSound);

    // pdom - signify button is 'pressed' when down
    const setAriaPressed = () => this.setPDOMAttribute('aria-pressed', valueProperty.value === valueDown);
    valueProperty.link(setAriaPressed);
    this.disposeRoundStickyToggleButton = () => {
      valueProperty.unlink(setAriaPressed);
      toggleButtonModel.produceSoundEmitter.removeListener(playSound);
      toggleButtonModel.dispose();
    };
  }
  dispose() {
    this.disposeRoundStickyToggleButton();
    super.dispose();
  }
}
sun.register('RoundStickyToggleButton', RoundStickyToggleButton);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJvcHRpb25pemUiLCJwdXNoQnV0dG9uU291bmRQbGF5ZXIiLCJUYW5kZW0iLCJzdW4iLCJSb3VuZEJ1dHRvbiIsIlN0aWNreVRvZ2dsZUJ1dHRvbkludGVyYWN0aW9uU3RhdGVQcm9wZXJ0eSIsIlN0aWNreVRvZ2dsZUJ1dHRvbk1vZGVsIiwiUm91bmRTdGlja3lUb2dnbGVCdXR0b24iLCJjb25zdHJ1Y3RvciIsInZhbHVlUHJvcGVydHkiLCJ2YWx1ZVVwIiwidmFsdWVEb3duIiwicHJvdmlkZWRPcHRpb25zIiwiYXNzZXJ0IiwidmFsdWVDb21wYXJpc29uU3RyYXRlZ3kiLCJvcHRpb25zIiwic291bmRQbGF5ZXIiLCJ0YW5kZW0iLCJSRVFVSVJFRCIsInRvZ2dsZUJ1dHRvbk1vZGVsIiwic3RpY2t5VG9nZ2xlQnV0dG9uSW50ZXJhY3Rpb25TdGF0ZVByb3BlcnR5IiwicGxheVNvdW5kIiwicGxheSIsInByb2R1Y2VTb3VuZEVtaXR0ZXIiLCJhZGRMaXN0ZW5lciIsInNldEFyaWFQcmVzc2VkIiwic2V0UERPTUF0dHJpYnV0ZSIsInZhbHVlIiwibGluayIsImRpc3Bvc2VSb3VuZFN0aWNreVRvZ2dsZUJ1dHRvbiIsInVubGluayIsInJlbW92ZUxpc3RlbmVyIiwiZGlzcG9zZSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiUm91bmRTdGlja3lUb2dnbGVCdXR0b24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTQtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUm91bmRTdGlja3lUb2dnbGVCdXR0b24gaXMgYSByb3VuZCB0b2dnbGUgYnV0dG9uIHRoYXQgdG9nZ2xlcyB0aGUgdmFsdWUgb2YgYSBQcm9wZXJ0eSBiZXR3ZWVuIDIgdmFsdWVzLlxyXG4gKiBJdCBoYXMgYSBkaWZmZXJlbnQgbG9vayAocmVmZXJyZWQgdG8gYXMgJ3VwJyBhbmQgJ2Rvd24nKSBmb3IgdGhlIDIgdmFsdWVzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvaG4gQmxhbmNvIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBUUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgVFNvdW5kUGxheWVyIGZyb20gJy4uLy4uLy4uL3RhbWJvL2pzL1RTb3VuZFBsYXllci5qcyc7XHJcbmltcG9ydCBwdXNoQnV0dG9uU291bmRQbGF5ZXIgZnJvbSAnLi4vLi4vLi4vdGFtYm8vanMvc2hhcmVkLXNvdW5kLXBsYXllcnMvcHVzaEJ1dHRvblNvdW5kUGxheWVyLmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuaW1wb3J0IHN1biBmcm9tICcuLi9zdW4uanMnO1xyXG5pbXBvcnQgUm91bmRCdXR0b24sIHsgUm91bmRCdXR0b25PcHRpb25zIH0gZnJvbSAnLi9Sb3VuZEJ1dHRvbi5qcyc7XHJcbmltcG9ydCBTdGlja3lUb2dnbGVCdXR0b25JbnRlcmFjdGlvblN0YXRlUHJvcGVydHkgZnJvbSAnLi9TdGlja3lUb2dnbGVCdXR0b25JbnRlcmFjdGlvblN0YXRlUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgU3RpY2t5VG9nZ2xlQnV0dG9uTW9kZWwgZnJvbSAnLi9TdGlja3lUb2dnbGVCdXR0b25Nb2RlbC5qcyc7XHJcblxyXG50eXBlIFNlbGZPcHRpb25zID0ge1xyXG4gIHNvdW5kUGxheWVyPzogVFNvdW5kUGxheWVyO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgUm91bmRTdGlja3lUb2dnbGVCdXR0b25PcHRpb25zID0gU2VsZk9wdGlvbnMgJiBSb3VuZEJ1dHRvbk9wdGlvbnM7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSb3VuZFN0aWNreVRvZ2dsZUJ1dHRvbjxUPiBleHRlbmRzIFJvdW5kQnV0dG9uIHtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNwb3NlUm91bmRTdGlja3lUb2dnbGVCdXR0b246ICgpID0+IHZvaWQ7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSB2YWx1ZVByb3BlcnR5IC0gYXhvbiBQcm9wZXJ0eSB0aGF0IGNhbiBiZSBlaXRoZXIgdmFsdWVVcCBvciB2YWx1ZURvd24uXHJcbiAgICogQHBhcmFtIHZhbHVlVXAgLSB2YWx1ZSB3aGVuIHRoZSB0b2dnbGUgaXMgaW4gdGhlICd1cCcgcG9zaXRpb25cclxuICAgKiBAcGFyYW0gdmFsdWVEb3duIC0gdmFsdWUgd2hlbiB0aGUgdG9nZ2xlIGlzIGluIHRoZSAnZG93bicgcG9zaXRpb25cclxuICAgKiBAcGFyYW0gcHJvdmlkZWRPcHRpb25zP1xyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggdmFsdWVQcm9wZXJ0eTogVFByb3BlcnR5PFQ+LCB2YWx1ZVVwOiBULCB2YWx1ZURvd246IFQsIHByb3ZpZGVkT3B0aW9ucz86IFJvdW5kU3RpY2t5VG9nZ2xlQnV0dG9uT3B0aW9ucyApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHZhbHVlUHJvcGVydHkudmFsdWVDb21wYXJpc29uU3RyYXRlZ3kgPT09ICdyZWZlcmVuY2UnLFxyXG4gICAgICAnUm91bmRTdGlja3lUb2dnbGVCdXR0b24gZGVwZW5kcyBvbiBcIj09PVwiIGVxdWFsaXR5IGZvciB2YWx1ZSBjb21wYXJpc29uJyApO1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8Um91bmRTdGlja3lUb2dnbGVCdXR0b25PcHRpb25zLCBTZWxmT3B0aW9ucywgUm91bmRCdXR0b25PcHRpb25zPigpKCB7XHJcblxyXG4gICAgICAvLyBTZWxmT3B0aW9uc1xyXG4gICAgICBzb3VuZFBsYXllcjogcHVzaEJ1dHRvblNvdW5kUGxheWVyLFxyXG5cclxuICAgICAgLy8gUm91bmRCdXR0b25PcHRpb25zXHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLlJFUVVJUkVEXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyBOb3RlIGl0IHNoYXJlcyBhIHRhbmRlbSB3aXRoIHRoaXMsIHNvIHRoZSBlbWl0dGVyIHdpbGwgYmUgaW5zdHJ1bWVudGVkIGFzIGEgY2hpbGQgb2YgdGhlIGJ1dHRvblxyXG4gICAgY29uc3QgdG9nZ2xlQnV0dG9uTW9kZWwgPSBuZXcgU3RpY2t5VG9nZ2xlQnV0dG9uTW9kZWwoIHZhbHVlVXAsIHZhbHVlRG93biwgdmFsdWVQcm9wZXJ0eSwgb3B0aW9ucyApO1xyXG4gICAgY29uc3Qgc3RpY2t5VG9nZ2xlQnV0dG9uSW50ZXJhY3Rpb25TdGF0ZVByb3BlcnR5ID0gbmV3IFN0aWNreVRvZ2dsZUJ1dHRvbkludGVyYWN0aW9uU3RhdGVQcm9wZXJ0eSggdG9nZ2xlQnV0dG9uTW9kZWwgKTtcclxuXHJcbiAgICBzdXBlciggdG9nZ2xlQnV0dG9uTW9kZWwsIHN0aWNreVRvZ2dsZUJ1dHRvbkludGVyYWN0aW9uU3RhdGVQcm9wZXJ0eSwgb3B0aW9ucyApO1xyXG5cclxuICAgIC8vIHNvdW5kIGdlbmVyYXRpb25cclxuICAgIGNvbnN0IHBsYXlTb3VuZCA9ICgpID0+IG9wdGlvbnMuc291bmRQbGF5ZXIucGxheSgpO1xyXG4gICAgdG9nZ2xlQnV0dG9uTW9kZWwucHJvZHVjZVNvdW5kRW1pdHRlci5hZGRMaXN0ZW5lciggcGxheVNvdW5kICk7XHJcblxyXG4gICAgLy8gcGRvbSAtIHNpZ25pZnkgYnV0dG9uIGlzICdwcmVzc2VkJyB3aGVuIGRvd25cclxuICAgIGNvbnN0IHNldEFyaWFQcmVzc2VkID0gKCkgPT4gdGhpcy5zZXRQRE9NQXR0cmlidXRlKCAnYXJpYS1wcmVzc2VkJywgdmFsdWVQcm9wZXJ0eS52YWx1ZSA9PT0gdmFsdWVEb3duICk7XHJcbiAgICB2YWx1ZVByb3BlcnR5LmxpbmsoIHNldEFyaWFQcmVzc2VkICk7XHJcblxyXG4gICAgdGhpcy5kaXNwb3NlUm91bmRTdGlja3lUb2dnbGVCdXR0b24gPSAoKSA9PiB7XHJcbiAgICAgIHZhbHVlUHJvcGVydHkudW5saW5rKCBzZXRBcmlhUHJlc3NlZCApO1xyXG4gICAgICB0b2dnbGVCdXR0b25Nb2RlbC5wcm9kdWNlU291bmRFbWl0dGVyLnJlbW92ZUxpc3RlbmVyKCBwbGF5U291bmQgKTtcclxuICAgICAgdG9nZ2xlQnV0dG9uTW9kZWwuZGlzcG9zZSgpO1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5kaXNwb3NlUm91bmRTdGlja3lUb2dnbGVCdXR0b24oKTtcclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICB9XHJcbn1cclxuXHJcbnN1bi5yZWdpc3RlciggJ1JvdW5kU3RpY2t5VG9nZ2xlQnV0dG9uJywgUm91bmRTdGlja3lUb2dnbGVCdXR0b24gKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUdBLE9BQU9BLFNBQVMsTUFBTSxvQ0FBb0M7QUFFMUQsT0FBT0MscUJBQXFCLE1BQU0saUVBQWlFO0FBQ25HLE9BQU9DLE1BQU0sTUFBTSw4QkFBOEI7QUFDakQsT0FBT0MsR0FBRyxNQUFNLFdBQVc7QUFDM0IsT0FBT0MsV0FBVyxNQUE4QixrQkFBa0I7QUFDbEUsT0FBT0MsMENBQTBDLE1BQU0saURBQWlEO0FBQ3hHLE9BQU9DLHVCQUF1QixNQUFNLDhCQUE4QjtBQVFsRSxlQUFlLE1BQU1DLHVCQUF1QixTQUFZSCxXQUFXLENBQUM7RUFJbEU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1NJLFdBQVdBLENBQUVDLGFBQTJCLEVBQUVDLE9BQVUsRUFBRUMsU0FBWSxFQUFFQyxlQUFnRCxFQUFHO0lBQzVIQyxNQUFNLElBQUlBLE1BQU0sQ0FBRUosYUFBYSxDQUFDSyx1QkFBdUIsS0FBSyxXQUFXLEVBQ3JFLHdFQUF5RSxDQUFDO0lBRTVFLE1BQU1DLE9BQU8sR0FBR2YsU0FBUyxDQUFrRSxDQUFDLENBQUU7TUFFNUY7TUFDQWdCLFdBQVcsRUFBRWYscUJBQXFCO01BRWxDO01BQ0FnQixNQUFNLEVBQUVmLE1BQU0sQ0FBQ2dCO0lBQ2pCLENBQUMsRUFBRU4sZUFBZ0IsQ0FBQzs7SUFFcEI7SUFDQSxNQUFNTyxpQkFBaUIsR0FBRyxJQUFJYix1QkFBdUIsQ0FBRUksT0FBTyxFQUFFQyxTQUFTLEVBQUVGLGFBQWEsRUFBRU0sT0FBUSxDQUFDO0lBQ25HLE1BQU1LLDBDQUEwQyxHQUFHLElBQUlmLDBDQUEwQyxDQUFFYyxpQkFBa0IsQ0FBQztJQUV0SCxLQUFLLENBQUVBLGlCQUFpQixFQUFFQywwQ0FBMEMsRUFBRUwsT0FBUSxDQUFDOztJQUUvRTtJQUNBLE1BQU1NLFNBQVMsR0FBR0EsQ0FBQSxLQUFNTixPQUFPLENBQUNDLFdBQVcsQ0FBQ00sSUFBSSxDQUFDLENBQUM7SUFDbERILGlCQUFpQixDQUFDSSxtQkFBbUIsQ0FBQ0MsV0FBVyxDQUFFSCxTQUFVLENBQUM7O0lBRTlEO0lBQ0EsTUFBTUksY0FBYyxHQUFHQSxDQUFBLEtBQU0sSUFBSSxDQUFDQyxnQkFBZ0IsQ0FBRSxjQUFjLEVBQUVqQixhQUFhLENBQUNrQixLQUFLLEtBQUtoQixTQUFVLENBQUM7SUFDdkdGLGFBQWEsQ0FBQ21CLElBQUksQ0FBRUgsY0FBZSxDQUFDO0lBRXBDLElBQUksQ0FBQ0ksOEJBQThCLEdBQUcsTUFBTTtNQUMxQ3BCLGFBQWEsQ0FBQ3FCLE1BQU0sQ0FBRUwsY0FBZSxDQUFDO01BQ3RDTixpQkFBaUIsQ0FBQ0ksbUJBQW1CLENBQUNRLGNBQWMsQ0FBRVYsU0FBVSxDQUFDO01BQ2pFRixpQkFBaUIsQ0FBQ2EsT0FBTyxDQUFDLENBQUM7SUFDN0IsQ0FBQztFQUNIO0VBRWdCQSxPQUFPQSxDQUFBLEVBQVM7SUFDOUIsSUFBSSxDQUFDSCw4QkFBOEIsQ0FBQyxDQUFDO0lBQ3JDLEtBQUssQ0FBQ0csT0FBTyxDQUFDLENBQUM7RUFDakI7QUFDRjtBQUVBN0IsR0FBRyxDQUFDOEIsUUFBUSxDQUFFLHlCQUF5QixFQUFFMUIsdUJBQXdCLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=