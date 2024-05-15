// Copyright 2019-2022, University of Colorado Boulder

/**
 * Content for a KeyboardHelpDialog that contains a BasicActionsKeyboardHelpSection and a SliderControlsKeyboardHelpSection.
 * Often sim interaction only involves sliders and basic tab and button interaction. For those sims, this
 * content will be usable for the Dialog.
 *
 * @author Jesse Greenberg
 */

import sceneryPhet from '../../sceneryPhet.js';
import BasicActionsKeyboardHelpSection from './BasicActionsKeyboardHelpSection.js';
import SliderControlsKeyboardHelpSection from './SliderControlsKeyboardHelpSection.js';
import TwoColumnKeyboardHelpContent from './TwoColumnKeyboardHelpContent.js';
export default class SliderControlsAndBasicActionsKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  constructor(providedOptions) {
    const options = providedOptions || {};
    const sliderHelpSection = new SliderControlsKeyboardHelpSection(options.sliderSectionOptions);
    const basicActionsHelpSection = new BasicActionsKeyboardHelpSection(options.generalSectionOptions);
    super([sliderHelpSection], [basicActionsHelpSection], options);
  }
}
sceneryPhet.register('SliderControlsAndBasicActionsKeyboardHelpContent', SliderControlsAndBasicActionsKeyboardHelpContent);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJzY2VuZXJ5UGhldCIsIkJhc2ljQWN0aW9uc0tleWJvYXJkSGVscFNlY3Rpb24iLCJTbGlkZXJDb250cm9sc0tleWJvYXJkSGVscFNlY3Rpb24iLCJUd29Db2x1bW5LZXlib2FyZEhlbHBDb250ZW50IiwiU2xpZGVyQ29udHJvbHNBbmRCYXNpY0FjdGlvbnNLZXlib2FyZEhlbHBDb250ZW50IiwiY29uc3RydWN0b3IiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwic2xpZGVySGVscFNlY3Rpb24iLCJzbGlkZXJTZWN0aW9uT3B0aW9ucyIsImJhc2ljQWN0aW9uc0hlbHBTZWN0aW9uIiwiZ2VuZXJhbFNlY3Rpb25PcHRpb25zIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJTbGlkZXJDb250cm9sc0FuZEJhc2ljQWN0aW9uc0tleWJvYXJkSGVscENvbnRlbnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyMiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQ29udGVudCBmb3IgYSBLZXlib2FyZEhlbHBEaWFsb2cgdGhhdCBjb250YWlucyBhIEJhc2ljQWN0aW9uc0tleWJvYXJkSGVscFNlY3Rpb24gYW5kIGEgU2xpZGVyQ29udHJvbHNLZXlib2FyZEhlbHBTZWN0aW9uLlxyXG4gKiBPZnRlbiBzaW0gaW50ZXJhY3Rpb24gb25seSBpbnZvbHZlcyBzbGlkZXJzIGFuZCBiYXNpYyB0YWIgYW5kIGJ1dHRvbiBpbnRlcmFjdGlvbi4gRm9yIHRob3NlIHNpbXMsIHRoaXNcclxuICogY29udGVudCB3aWxsIGJlIHVzYWJsZSBmb3IgdGhlIERpYWxvZy5cclxuICpcclxuICogQGF1dGhvciBKZXNzZSBHcmVlbmJlcmdcclxuICovXHJcblxyXG5pbXBvcnQgc2NlbmVyeVBoZXQgZnJvbSAnLi4vLi4vc2NlbmVyeVBoZXQuanMnO1xyXG5pbXBvcnQgQmFzaWNBY3Rpb25zS2V5Ym9hcmRIZWxwU2VjdGlvbiwgeyBCYXNpY0FjdGlvbnNLZXlib2FyZEhlbHBTZWN0aW9uT3B0aW9ucyB9IGZyb20gJy4vQmFzaWNBY3Rpb25zS2V5Ym9hcmRIZWxwU2VjdGlvbi5qcyc7XHJcbmltcG9ydCBTbGlkZXJDb250cm9sc0tleWJvYXJkSGVscFNlY3Rpb24sIHsgU2xpZGVyQ29udHJvbHNLZXlib2FyZEhlbHBTZWN0aW9uT3B0aW9ucyB9IGZyb20gJy4vU2xpZGVyQ29udHJvbHNLZXlib2FyZEhlbHBTZWN0aW9uLmpzJztcclxuaW1wb3J0IFR3b0NvbHVtbktleWJvYXJkSGVscENvbnRlbnQsIHsgVHdvQ29sdW1uS2V5Ym9hcmRIZWxwQ29udGVudE9wdGlvbnMgfSBmcm9tICcuL1R3b0NvbHVtbktleWJvYXJkSGVscENvbnRlbnQuanMnO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuXHJcbiAgLy8gb3B0aW9ucyBwYXNzZWQgdG8gdGhlIFNsaWRlckNvbnRyb2xzS2V5Ym9hcmRIZWxwU2VjdGlvblxyXG4gIHNsaWRlclNlY3Rpb25PcHRpb25zPzogU2xpZGVyQ29udHJvbHNLZXlib2FyZEhlbHBTZWN0aW9uT3B0aW9ucztcclxuXHJcbiAgLy8gb3B0aW9ucyBwYXNzZWQgdG8gdGhlIEJhc2ljQWN0aW9uc0tleWJvYXJkSGVscFNlY3Rpb25cclxuICBnZW5lcmFsU2VjdGlvbk9wdGlvbnM/OiBCYXNpY0FjdGlvbnNLZXlib2FyZEhlbHBTZWN0aW9uT3B0aW9ucztcclxufTtcclxuXHJcbmV4cG9ydCB0eXBlIFNsaWRlckNvbnRyb2xzQW5kQmFzaWNBY3Rpb25zS2V5Ym9hcmRIZWxwQ29udGVudE9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIFR3b0NvbHVtbktleWJvYXJkSGVscENvbnRlbnRPcHRpb25zO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2xpZGVyQ29udHJvbHNBbmRCYXNpY0FjdGlvbnNLZXlib2FyZEhlbHBDb250ZW50IGV4dGVuZHMgVHdvQ29sdW1uS2V5Ym9hcmRIZWxwQ29udGVudCB7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggcHJvdmlkZWRPcHRpb25zPzogU2xpZGVyQ29udHJvbHNBbmRCYXNpY0FjdGlvbnNLZXlib2FyZEhlbHBDb250ZW50T3B0aW9ucyApIHtcclxuICAgIGNvbnN0IG9wdGlvbnMgPSBwcm92aWRlZE9wdGlvbnMgfHwge307XHJcblxyXG4gICAgY29uc3Qgc2xpZGVySGVscFNlY3Rpb24gPSBuZXcgU2xpZGVyQ29udHJvbHNLZXlib2FyZEhlbHBTZWN0aW9uKCBvcHRpb25zLnNsaWRlclNlY3Rpb25PcHRpb25zICk7XHJcbiAgICBjb25zdCBiYXNpY0FjdGlvbnNIZWxwU2VjdGlvbiA9IG5ldyBCYXNpY0FjdGlvbnNLZXlib2FyZEhlbHBTZWN0aW9uKCBvcHRpb25zLmdlbmVyYWxTZWN0aW9uT3B0aW9ucyApO1xyXG5cclxuICAgIHN1cGVyKCBbIHNsaWRlckhlbHBTZWN0aW9uIF0sIFsgYmFzaWNBY3Rpb25zSGVscFNlY3Rpb24gXSwgb3B0aW9ucyApO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeVBoZXQucmVnaXN0ZXIoICdTbGlkZXJDb250cm9sc0FuZEJhc2ljQWN0aW9uc0tleWJvYXJkSGVscENvbnRlbnQnLCBTbGlkZXJDb250cm9sc0FuZEJhc2ljQWN0aW9uc0tleWJvYXJkSGVscENvbnRlbnQgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFdBQVcsTUFBTSxzQkFBc0I7QUFDOUMsT0FBT0MsK0JBQStCLE1BQWtELHNDQUFzQztBQUM5SCxPQUFPQyxpQ0FBaUMsTUFBb0Qsd0NBQXdDO0FBQ3BJLE9BQU9DLDRCQUE0QixNQUErQyxtQ0FBbUM7QUFhckgsZUFBZSxNQUFNQyxnREFBZ0QsU0FBU0QsNEJBQTRCLENBQUM7RUFFbEdFLFdBQVdBLENBQUVDLGVBQXlFLEVBQUc7SUFDOUYsTUFBTUMsT0FBTyxHQUFHRCxlQUFlLElBQUksQ0FBQyxDQUFDO0lBRXJDLE1BQU1FLGlCQUFpQixHQUFHLElBQUlOLGlDQUFpQyxDQUFFSyxPQUFPLENBQUNFLG9CQUFxQixDQUFDO0lBQy9GLE1BQU1DLHVCQUF1QixHQUFHLElBQUlULCtCQUErQixDQUFFTSxPQUFPLENBQUNJLHFCQUFzQixDQUFDO0lBRXBHLEtBQUssQ0FBRSxDQUFFSCxpQkFBaUIsQ0FBRSxFQUFFLENBQUVFLHVCQUF1QixDQUFFLEVBQUVILE9BQVEsQ0FBQztFQUN0RTtBQUNGO0FBRUFQLFdBQVcsQ0FBQ1ksUUFBUSxDQUFFLGtEQUFrRCxFQUFFUixnREFBaUQsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==