// Copyright 2021-2023, University of Colorado Boulder

/**
 * Section of the "Audio" panel of the PreferencesDialog related to sound.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import PatternStringProperty from '../../../axon/js/PatternStringProperty.js';
import merge from '../../../phet-core/js/merge.js';
import optionize, { combineOptions } from '../../../phet-core/js/optionize.js';
import { Text, VBox, VoicingRichText, VoicingText } from '../../../scenery/js/imports.js';
import Checkbox from '../../../sun/js/Checkbox.js';
import ToggleSwitch from '../../../sun/js/ToggleSwitch.js';
import Tandem from '../../../tandem/js/Tandem.js';
import joist from '../joist.js';
import JoistStrings from '../JoistStrings.js';
import PreferencesDialog from './PreferencesDialog.js';
import PreferencesPanelSection from './PreferencesPanelSection.js';
import PreferencesControl from './PreferencesControl.js';
import PreferencesDialogConstants from './PreferencesDialogConstants.js';

// constants
const soundsLabelStringProperty = JoistStrings.preferences.tabs.audio.sounds.titleStringProperty;
const extraSoundsLabelStringProperty = JoistStrings.preferences.tabs.audio.sounds.extraSounds.titleStringProperty;
const soundDescriptionStringProperty = JoistStrings.preferences.tabs.audio.sounds.descriptionStringProperty;
const extraSoundsDescriptionStringProperty = JoistStrings.preferences.tabs.audio.sounds.extraSounds.descriptionStringProperty;
const soundsOnStringProperty = JoistStrings.a11y.preferences.tabs.audio.sounds.soundsOnStringProperty;
const soundsOffStringProperty = JoistStrings.a11y.preferences.tabs.audio.sounds.soundsOffStringProperty;
const extraSoundsOnStringProperty = JoistStrings.a11y.preferences.tabs.audio.sounds.extraSounds.extraSoundsOnStringProperty;
const extraSoundsOffStringProperty = JoistStrings.a11y.preferences.tabs.audio.sounds.extraSounds.extraSoundsOffStringProperty;
const labelledDescriptionPatternStringProperty = JoistStrings.a11y.preferences.tabs.labelledDescriptionPatternStringProperty;
class SoundPanelSection extends PreferencesPanelSection {
  /**
   * @param audioModel - configuration for audio preferences, see PreferencesModel
   * @param [providedOptions]
   */
  constructor(audioModel, providedOptions) {
    const options = optionize()({
      includeTitleToggleSwitch: true
    }, providedOptions);
    const soundLabel = new Text(soundsLabelStringProperty, PreferencesDialog.PANEL_SECTION_LABEL_OPTIONS);
    const soundEnabledStringProperty = new PatternStringProperty(labelledDescriptionPatternStringProperty, {
      label: soundsLabelStringProperty,
      description: soundDescriptionStringProperty
    }, {
      tandem: Tandem.OPT_OUT
    });
    const soundEnabledVoicingText = new VoicingText(soundDescriptionStringProperty, merge({}, PreferencesDialog.PANEL_SECTION_CONTENT_OPTIONS, {
      readingBlockNameResponse: soundEnabledStringProperty
    }));
    const soundEnabledSwitch = new ToggleSwitch(audioModel.soundEnabledProperty, false, true, combineOptions({
      visible: options.includeTitleToggleSwitch,
      a11yName: soundsLabelStringProperty,
      leftValueContextResponse: soundsOffStringProperty,
      rightValueContextResponse: soundsOnStringProperty
    }, PreferencesDialogConstants.TOGGLE_SWITCH_OPTIONS));
    const soundEnabledControl = new PreferencesControl({
      labelNode: soundLabel,
      descriptionNode: soundEnabledVoicingText,
      controlNode: soundEnabledSwitch
    });
    let extraSoundContent = null;
    if (audioModel.supportsExtraSound) {
      const enhancedSoundLabel = new Text(extraSoundsLabelStringProperty, PreferencesDialog.PANEL_SECTION_CONTENT_OPTIONS);
      const extraSoundCheckbox = new Checkbox(audioModel.extraSoundEnabledProperty, enhancedSoundLabel, {
        // pdom
        labelTagName: 'label',
        labelContent: extraSoundsLabelStringProperty,
        // voicing
        voicingNameResponse: extraSoundsLabelStringProperty,
        voicingIgnoreVoicingManagerProperties: true,
        // Always speak Preferences responses so control function is clear
        voiceNameResponseOnSelection: false,
        // both voicing and pdom
        checkedContextResponse: extraSoundsOnStringProperty,
        uncheckedContextResponse: extraSoundsOffStringProperty,
        // phet-io
        tandem: Tandem.OPT_OUT // We don't want to instrument components for preferences, https://github.com/phetsims/joist/issues/744#issuecomment-1196028362
      });
      const extraSoundReadingBlockNameResponsePatternStringProperty = new PatternStringProperty(labelledDescriptionPatternStringProperty, {
        label: extraSoundsLabelStringProperty,
        description: extraSoundsDescriptionStringProperty
      }, {
        tandem: Tandem.OPT_OUT
      });
      const extraSoundDescription = new VoicingRichText(extraSoundsDescriptionStringProperty, merge({}, PreferencesDialog.PANEL_SECTION_CONTENT_OPTIONS, {
        lineWrap: 300,
        maxHeight: 100,
        readingBlockNameResponse: extraSoundReadingBlockNameResponsePatternStringProperty
      }));
      extraSoundContent = new VBox({
        children: [extraSoundCheckbox, extraSoundDescription],
        align: 'left',
        spacing: 5,
        tagName: 'div' // Must have PDOM content to support toggling enabled in the PDOM. Could be removed after https://github.com/phetsims/scenery/issues/1514
      });
      const extraSoundEnabledListener = enabled => {
        extraSoundContent.enabled = enabled;

        // TODO: Workaround for now, see https://github.com/phetsims/scenery/issues/1514. PDOM does not
        //       correctly propagate enabled state to descendants when ancestor becomes disabled.
        extraSoundCheckbox.inputEnabled = enabled;
      };
      audioModel.soundEnabledProperty.link(extraSoundEnabledListener);
    }
    super({
      titleNode: soundEnabledControl,
      contentNode: extraSoundContent
    });
  }
}
joist.register('SoundPanelSection', SoundPanelSection);
export default SoundPanelSection;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQYXR0ZXJuU3RyaW5nUHJvcGVydHkiLCJtZXJnZSIsIm9wdGlvbml6ZSIsImNvbWJpbmVPcHRpb25zIiwiVGV4dCIsIlZCb3giLCJWb2ljaW5nUmljaFRleHQiLCJWb2ljaW5nVGV4dCIsIkNoZWNrYm94IiwiVG9nZ2xlU3dpdGNoIiwiVGFuZGVtIiwiam9pc3QiLCJKb2lzdFN0cmluZ3MiLCJQcmVmZXJlbmNlc0RpYWxvZyIsIlByZWZlcmVuY2VzUGFuZWxTZWN0aW9uIiwiUHJlZmVyZW5jZXNDb250cm9sIiwiUHJlZmVyZW5jZXNEaWFsb2dDb25zdGFudHMiLCJzb3VuZHNMYWJlbFN0cmluZ1Byb3BlcnR5IiwicHJlZmVyZW5jZXMiLCJ0YWJzIiwiYXVkaW8iLCJzb3VuZHMiLCJ0aXRsZVN0cmluZ1Byb3BlcnR5IiwiZXh0cmFTb3VuZHNMYWJlbFN0cmluZ1Byb3BlcnR5IiwiZXh0cmFTb3VuZHMiLCJzb3VuZERlc2NyaXB0aW9uU3RyaW5nUHJvcGVydHkiLCJkZXNjcmlwdGlvblN0cmluZ1Byb3BlcnR5IiwiZXh0cmFTb3VuZHNEZXNjcmlwdGlvblN0cmluZ1Byb3BlcnR5Iiwic291bmRzT25TdHJpbmdQcm9wZXJ0eSIsImExMXkiLCJzb3VuZHNPZmZTdHJpbmdQcm9wZXJ0eSIsImV4dHJhU291bmRzT25TdHJpbmdQcm9wZXJ0eSIsImV4dHJhU291bmRzT2ZmU3RyaW5nUHJvcGVydHkiLCJsYWJlbGxlZERlc2NyaXB0aW9uUGF0dGVyblN0cmluZ1Byb3BlcnR5IiwiU291bmRQYW5lbFNlY3Rpb24iLCJjb25zdHJ1Y3RvciIsImF1ZGlvTW9kZWwiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwiaW5jbHVkZVRpdGxlVG9nZ2xlU3dpdGNoIiwic291bmRMYWJlbCIsIlBBTkVMX1NFQ1RJT05fTEFCRUxfT1BUSU9OUyIsInNvdW5kRW5hYmxlZFN0cmluZ1Byb3BlcnR5IiwibGFiZWwiLCJkZXNjcmlwdGlvbiIsInRhbmRlbSIsIk9QVF9PVVQiLCJzb3VuZEVuYWJsZWRWb2ljaW5nVGV4dCIsIlBBTkVMX1NFQ1RJT05fQ09OVEVOVF9PUFRJT05TIiwicmVhZGluZ0Jsb2NrTmFtZVJlc3BvbnNlIiwic291bmRFbmFibGVkU3dpdGNoIiwic291bmRFbmFibGVkUHJvcGVydHkiLCJ2aXNpYmxlIiwiYTExeU5hbWUiLCJsZWZ0VmFsdWVDb250ZXh0UmVzcG9uc2UiLCJyaWdodFZhbHVlQ29udGV4dFJlc3BvbnNlIiwiVE9HR0xFX1NXSVRDSF9PUFRJT05TIiwic291bmRFbmFibGVkQ29udHJvbCIsImxhYmVsTm9kZSIsImRlc2NyaXB0aW9uTm9kZSIsImNvbnRyb2xOb2RlIiwiZXh0cmFTb3VuZENvbnRlbnQiLCJzdXBwb3J0c0V4dHJhU291bmQiLCJlbmhhbmNlZFNvdW5kTGFiZWwiLCJleHRyYVNvdW5kQ2hlY2tib3giLCJleHRyYVNvdW5kRW5hYmxlZFByb3BlcnR5IiwibGFiZWxUYWdOYW1lIiwibGFiZWxDb250ZW50Iiwidm9pY2luZ05hbWVSZXNwb25zZSIsInZvaWNpbmdJZ25vcmVWb2ljaW5nTWFuYWdlclByb3BlcnRpZXMiLCJ2b2ljZU5hbWVSZXNwb25zZU9uU2VsZWN0aW9uIiwiY2hlY2tlZENvbnRleHRSZXNwb25zZSIsInVuY2hlY2tlZENvbnRleHRSZXNwb25zZSIsImV4dHJhU291bmRSZWFkaW5nQmxvY2tOYW1lUmVzcG9uc2VQYXR0ZXJuU3RyaW5nUHJvcGVydHkiLCJleHRyYVNvdW5kRGVzY3JpcHRpb24iLCJsaW5lV3JhcCIsIm1heEhlaWdodCIsImNoaWxkcmVuIiwiYWxpZ24iLCJzcGFjaW5nIiwidGFnTmFtZSIsImV4dHJhU291bmRFbmFibGVkTGlzdGVuZXIiLCJlbmFibGVkIiwiaW5wdXRFbmFibGVkIiwibGluayIsInRpdGxlTm9kZSIsImNvbnRlbnROb2RlIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJTb3VuZFBhbmVsU2VjdGlvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMS0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBTZWN0aW9uIG9mIHRoZSBcIkF1ZGlvXCIgcGFuZWwgb2YgdGhlIFByZWZlcmVuY2VzRGlhbG9nIHJlbGF0ZWQgdG8gc291bmQuXHJcbiAqXHJcbiAqIEBhdXRob3IgSmVzc2UgR3JlZW5iZXJnIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBQYXR0ZXJuU3RyaW5nUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9QYXR0ZXJuU3RyaW5nUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgbWVyZ2UgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL21lcmdlLmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBjb21iaW5lT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgeyBOb2RlLCBUZXh0LCBWQm94LCBWb2ljaW5nUmljaFRleHQsIFZvaWNpbmdUZXh0IH0gZnJvbSAnLi4vLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IENoZWNrYm94IGZyb20gJy4uLy4uLy4uL3N1bi9qcy9DaGVja2JveC5qcyc7XHJcbmltcG9ydCBUb2dnbGVTd2l0Y2gsIHsgVG9nZ2xlU3dpdGNoT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL3N1bi9qcy9Ub2dnbGVTd2l0Y2guanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgam9pc3QgZnJvbSAnLi4vam9pc3QuanMnO1xyXG5pbXBvcnQgSm9pc3RTdHJpbmdzIGZyb20gJy4uL0pvaXN0U3RyaW5ncy5qcyc7XHJcbmltcG9ydCBQcmVmZXJlbmNlc0RpYWxvZyBmcm9tICcuL1ByZWZlcmVuY2VzRGlhbG9nLmpzJztcclxuaW1wb3J0IHsgQXVkaW9Nb2RlbCB9IGZyb20gJy4vUHJlZmVyZW5jZXNNb2RlbC5qcyc7XHJcbmltcG9ydCBQcmVmZXJlbmNlc1BhbmVsU2VjdGlvbiwgeyBQcmVmZXJlbmNlc1BhbmVsU2VjdGlvbk9wdGlvbnMgfSBmcm9tICcuL1ByZWZlcmVuY2VzUGFuZWxTZWN0aW9uLmpzJztcclxuaW1wb3J0IFByZWZlcmVuY2VzQ29udHJvbCBmcm9tICcuL1ByZWZlcmVuY2VzQ29udHJvbC5qcyc7XHJcbmltcG9ydCBQcmVmZXJlbmNlc0RpYWxvZ0NvbnN0YW50cyBmcm9tICcuL1ByZWZlcmVuY2VzRGlhbG9nQ29uc3RhbnRzLmpzJztcclxuXHJcbi8vIGNvbnN0YW50c1xyXG5jb25zdCBzb3VuZHNMYWJlbFN0cmluZ1Byb3BlcnR5ID0gSm9pc3RTdHJpbmdzLnByZWZlcmVuY2VzLnRhYnMuYXVkaW8uc291bmRzLnRpdGxlU3RyaW5nUHJvcGVydHk7XHJcbmNvbnN0IGV4dHJhU291bmRzTGFiZWxTdHJpbmdQcm9wZXJ0eSA9IEpvaXN0U3RyaW5ncy5wcmVmZXJlbmNlcy50YWJzLmF1ZGlvLnNvdW5kcy5leHRyYVNvdW5kcy50aXRsZVN0cmluZ1Byb3BlcnR5O1xyXG5jb25zdCBzb3VuZERlc2NyaXB0aW9uU3RyaW5nUHJvcGVydHkgPSBKb2lzdFN0cmluZ3MucHJlZmVyZW5jZXMudGFicy5hdWRpby5zb3VuZHMuZGVzY3JpcHRpb25TdHJpbmdQcm9wZXJ0eTtcclxuY29uc3QgZXh0cmFTb3VuZHNEZXNjcmlwdGlvblN0cmluZ1Byb3BlcnR5ID0gSm9pc3RTdHJpbmdzLnByZWZlcmVuY2VzLnRhYnMuYXVkaW8uc291bmRzLmV4dHJhU291bmRzLmRlc2NyaXB0aW9uU3RyaW5nUHJvcGVydHk7XHJcbmNvbnN0IHNvdW5kc09uU3RyaW5nUHJvcGVydHkgPSBKb2lzdFN0cmluZ3MuYTExeS5wcmVmZXJlbmNlcy50YWJzLmF1ZGlvLnNvdW5kcy5zb3VuZHNPblN0cmluZ1Byb3BlcnR5O1xyXG5jb25zdCBzb3VuZHNPZmZTdHJpbmdQcm9wZXJ0eSA9IEpvaXN0U3RyaW5ncy5hMTF5LnByZWZlcmVuY2VzLnRhYnMuYXVkaW8uc291bmRzLnNvdW5kc09mZlN0cmluZ1Byb3BlcnR5O1xyXG5jb25zdCBleHRyYVNvdW5kc09uU3RyaW5nUHJvcGVydHkgPSBKb2lzdFN0cmluZ3MuYTExeS5wcmVmZXJlbmNlcy50YWJzLmF1ZGlvLnNvdW5kcy5leHRyYVNvdW5kcy5leHRyYVNvdW5kc09uU3RyaW5nUHJvcGVydHk7XHJcbmNvbnN0IGV4dHJhU291bmRzT2ZmU3RyaW5nUHJvcGVydHkgPSBKb2lzdFN0cmluZ3MuYTExeS5wcmVmZXJlbmNlcy50YWJzLmF1ZGlvLnNvdW5kcy5leHRyYVNvdW5kcy5leHRyYVNvdW5kc09mZlN0cmluZ1Byb3BlcnR5O1xyXG5jb25zdCBsYWJlbGxlZERlc2NyaXB0aW9uUGF0dGVyblN0cmluZ1Byb3BlcnR5ID0gSm9pc3RTdHJpbmdzLmExMXkucHJlZmVyZW5jZXMudGFicy5sYWJlbGxlZERlc2NyaXB0aW9uUGF0dGVyblN0cmluZ1Byb3BlcnR5O1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuXHJcbiAgLy8gV2hldGhlciB0byBpbmNsdWRlIHRoZSB0b2dnbGUgc3dpdGNoIGluIHRoZSB0aXRsZSBjb250ZW50IGZvciB0aGlzIFByZWZlcmVuY2VzUGFuZWxTZWN0aW9uLiBJdCBpcyBwb3NzaWJsZSB0aGF0XHJcbiAgLy8gdGhlIHRvZ2dsZSBmb3IgU291bmQgY2FuIGJlIHJlZHVuZGFudCB3aGVuIFNvdW5kIGlzIHRoZSBvbmx5IEF1ZGlvIGZlYXR1cmUgc3VwcG9ydGVkLiBJbiB0aGF0IGNhc2UsIGNvbnRyb2wgb2ZcclxuICAvLyBTb3VuZCBzaG91bGQgZ28gdGhyb3VnaCB0aGUgXCJBbGwgQXVkaW9cIiB0b2dnbGUuXHJcbiAgaW5jbHVkZVRpdGxlVG9nZ2xlU3dpdGNoPzogYm9vbGVhbjtcclxufTtcclxuXHJcbnR5cGUgU291bmRQYW5lbFNlY3Rpb25PcHRpb25zID0gU2VsZk9wdGlvbnMgJiBQcmVmZXJlbmNlc1BhbmVsU2VjdGlvbk9wdGlvbnM7XHJcblxyXG5jbGFzcyBTb3VuZFBhbmVsU2VjdGlvbiBleHRlbmRzIFByZWZlcmVuY2VzUGFuZWxTZWN0aW9uIHtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIGF1ZGlvTW9kZWwgLSBjb25maWd1cmF0aW9uIGZvciBhdWRpbyBwcmVmZXJlbmNlcywgc2VlIFByZWZlcmVuY2VzTW9kZWxcclxuICAgKiBAcGFyYW0gW3Byb3ZpZGVkT3B0aW9uc11cclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIGF1ZGlvTW9kZWw6IEF1ZGlvTW9kZWwsIHByb3ZpZGVkT3B0aW9ucz86IFNvdW5kUGFuZWxTZWN0aW9uT3B0aW9ucyApIHtcclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8U291bmRQYW5lbFNlY3Rpb25PcHRpb25zLCBTZWxmT3B0aW9ucywgUHJlZmVyZW5jZXNQYW5lbFNlY3Rpb25PcHRpb25zPigpKCB7XHJcbiAgICAgIGluY2x1ZGVUaXRsZVRvZ2dsZVN3aXRjaDogdHJ1ZVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgY29uc3Qgc291bmRMYWJlbCA9IG5ldyBUZXh0KCBzb3VuZHNMYWJlbFN0cmluZ1Byb3BlcnR5LCBQcmVmZXJlbmNlc0RpYWxvZy5QQU5FTF9TRUNUSU9OX0xBQkVMX09QVElPTlMgKTtcclxuXHJcbiAgICBjb25zdCBzb3VuZEVuYWJsZWRTdHJpbmdQcm9wZXJ0eSA9IG5ldyBQYXR0ZXJuU3RyaW5nUHJvcGVydHkoIGxhYmVsbGVkRGVzY3JpcHRpb25QYXR0ZXJuU3RyaW5nUHJvcGVydHksIHtcclxuICAgICAgbGFiZWw6IHNvdW5kc0xhYmVsU3RyaW5nUHJvcGVydHksXHJcbiAgICAgIGRlc2NyaXB0aW9uOiBzb3VuZERlc2NyaXB0aW9uU3RyaW5nUHJvcGVydHlcclxuICAgIH0sIHsgdGFuZGVtOiBUYW5kZW0uT1BUX09VVCB9ICk7XHJcbiAgICBjb25zdCBzb3VuZEVuYWJsZWRWb2ljaW5nVGV4dCA9IG5ldyBWb2ljaW5nVGV4dCggc291bmREZXNjcmlwdGlvblN0cmluZ1Byb3BlcnR5LCBtZXJnZSgge30sIFByZWZlcmVuY2VzRGlhbG9nLlBBTkVMX1NFQ1RJT05fQ09OVEVOVF9PUFRJT05TLCB7XHJcbiAgICAgIHJlYWRpbmdCbG9ja05hbWVSZXNwb25zZTogc291bmRFbmFibGVkU3RyaW5nUHJvcGVydHlcclxuICAgIH0gKSApO1xyXG4gICAgY29uc3Qgc291bmRFbmFibGVkU3dpdGNoID0gbmV3IFRvZ2dsZVN3aXRjaCggYXVkaW9Nb2RlbC5zb3VuZEVuYWJsZWRQcm9wZXJ0eSwgZmFsc2UsIHRydWUsIGNvbWJpbmVPcHRpb25zPFRvZ2dsZVN3aXRjaE9wdGlvbnM+KCB7XHJcbiAgICAgIHZpc2libGU6IG9wdGlvbnMuaW5jbHVkZVRpdGxlVG9nZ2xlU3dpdGNoLFxyXG4gICAgICBhMTF5TmFtZTogc291bmRzTGFiZWxTdHJpbmdQcm9wZXJ0eSxcclxuICAgICAgbGVmdFZhbHVlQ29udGV4dFJlc3BvbnNlOiBzb3VuZHNPZmZTdHJpbmdQcm9wZXJ0eSxcclxuICAgICAgcmlnaHRWYWx1ZUNvbnRleHRSZXNwb25zZTogc291bmRzT25TdHJpbmdQcm9wZXJ0eVxyXG4gICAgfSwgUHJlZmVyZW5jZXNEaWFsb2dDb25zdGFudHMuVE9HR0xFX1NXSVRDSF9PUFRJT05TICkgKTtcclxuICAgIGNvbnN0IHNvdW5kRW5hYmxlZENvbnRyb2wgPSBuZXcgUHJlZmVyZW5jZXNDb250cm9sKCB7XHJcbiAgICAgIGxhYmVsTm9kZTogc291bmRMYWJlbCxcclxuICAgICAgZGVzY3JpcHRpb25Ob2RlOiBzb3VuZEVuYWJsZWRWb2ljaW5nVGV4dCxcclxuICAgICAgY29udHJvbE5vZGU6IHNvdW5kRW5hYmxlZFN3aXRjaFxyXG4gICAgfSApO1xyXG5cclxuICAgIGxldCBleHRyYVNvdW5kQ29udGVudDogTm9kZSB8IG51bGwgPSBudWxsO1xyXG4gICAgaWYgKCBhdWRpb01vZGVsLnN1cHBvcnRzRXh0cmFTb3VuZCApIHtcclxuICAgICAgY29uc3QgZW5oYW5jZWRTb3VuZExhYmVsID0gbmV3IFRleHQoIGV4dHJhU291bmRzTGFiZWxTdHJpbmdQcm9wZXJ0eSwgUHJlZmVyZW5jZXNEaWFsb2cuUEFORUxfU0VDVElPTl9DT05URU5UX09QVElPTlMgKTtcclxuICAgICAgY29uc3QgZXh0cmFTb3VuZENoZWNrYm94ID0gbmV3IENoZWNrYm94KCBhdWRpb01vZGVsLmV4dHJhU291bmRFbmFibGVkUHJvcGVydHksIGVuaGFuY2VkU291bmRMYWJlbCwge1xyXG5cclxuICAgICAgICAvLyBwZG9tXHJcbiAgICAgICAgbGFiZWxUYWdOYW1lOiAnbGFiZWwnLFxyXG4gICAgICAgIGxhYmVsQ29udGVudDogZXh0cmFTb3VuZHNMYWJlbFN0cmluZ1Byb3BlcnR5LFxyXG5cclxuICAgICAgICAvLyB2b2ljaW5nXHJcbiAgICAgICAgdm9pY2luZ05hbWVSZXNwb25zZTogZXh0cmFTb3VuZHNMYWJlbFN0cmluZ1Byb3BlcnR5LFxyXG4gICAgICAgIHZvaWNpbmdJZ25vcmVWb2ljaW5nTWFuYWdlclByb3BlcnRpZXM6IHRydWUsIC8vIEFsd2F5cyBzcGVhayBQcmVmZXJlbmNlcyByZXNwb25zZXMgc28gY29udHJvbCBmdW5jdGlvbiBpcyBjbGVhclxyXG4gICAgICAgIHZvaWNlTmFtZVJlc3BvbnNlT25TZWxlY3Rpb246IGZhbHNlLFxyXG5cclxuICAgICAgICAvLyBib3RoIHZvaWNpbmcgYW5kIHBkb21cclxuICAgICAgICBjaGVja2VkQ29udGV4dFJlc3BvbnNlOiBleHRyYVNvdW5kc09uU3RyaW5nUHJvcGVydHksXHJcbiAgICAgICAgdW5jaGVja2VkQ29udGV4dFJlc3BvbnNlOiBleHRyYVNvdW5kc09mZlN0cmluZ1Byb3BlcnR5LFxyXG5cclxuICAgICAgICAvLyBwaGV0LWlvXHJcbiAgICAgICAgdGFuZGVtOiBUYW5kZW0uT1BUX09VVCAvLyBXZSBkb24ndCB3YW50IHRvIGluc3RydW1lbnQgY29tcG9uZW50cyBmb3IgcHJlZmVyZW5jZXMsIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9qb2lzdC9pc3N1ZXMvNzQ0I2lzc3VlY29tbWVudC0xMTk2MDI4MzYyXHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGNvbnN0IGV4dHJhU291bmRSZWFkaW5nQmxvY2tOYW1lUmVzcG9uc2VQYXR0ZXJuU3RyaW5nUHJvcGVydHkgPSBuZXcgUGF0dGVyblN0cmluZ1Byb3BlcnR5KCBsYWJlbGxlZERlc2NyaXB0aW9uUGF0dGVyblN0cmluZ1Byb3BlcnR5LCB7XHJcbiAgICAgICAgbGFiZWw6IGV4dHJhU291bmRzTGFiZWxTdHJpbmdQcm9wZXJ0eSxcclxuICAgICAgICBkZXNjcmlwdGlvbjogZXh0cmFTb3VuZHNEZXNjcmlwdGlvblN0cmluZ1Byb3BlcnR5XHJcbiAgICAgIH0sIHsgdGFuZGVtOiBUYW5kZW0uT1BUX09VVCB9ICk7XHJcbiAgICAgIGNvbnN0IGV4dHJhU291bmREZXNjcmlwdGlvbiA9IG5ldyBWb2ljaW5nUmljaFRleHQoIGV4dHJhU291bmRzRGVzY3JpcHRpb25TdHJpbmdQcm9wZXJ0eSwgbWVyZ2UoIHt9LCBQcmVmZXJlbmNlc0RpYWxvZy5QQU5FTF9TRUNUSU9OX0NPTlRFTlRfT1BUSU9OUywge1xyXG4gICAgICAgIGxpbmVXcmFwOiAzMDAsXHJcbiAgICAgICAgbWF4SGVpZ2h0OiAxMDAsXHJcbiAgICAgICAgcmVhZGluZ0Jsb2NrTmFtZVJlc3BvbnNlOiBleHRyYVNvdW5kUmVhZGluZ0Jsb2NrTmFtZVJlc3BvbnNlUGF0dGVyblN0cmluZ1Byb3BlcnR5XHJcbiAgICAgIH0gKSApO1xyXG5cclxuICAgICAgZXh0cmFTb3VuZENvbnRlbnQgPSBuZXcgVkJveCgge1xyXG4gICAgICAgIGNoaWxkcmVuOiBbIGV4dHJhU291bmRDaGVja2JveCwgZXh0cmFTb3VuZERlc2NyaXB0aW9uIF0sXHJcbiAgICAgICAgYWxpZ246ICdsZWZ0JyxcclxuICAgICAgICBzcGFjaW5nOiA1LFxyXG4gICAgICAgIHRhZ05hbWU6ICdkaXYnIC8vIE11c3QgaGF2ZSBQRE9NIGNvbnRlbnQgdG8gc3VwcG9ydCB0b2dnbGluZyBlbmFibGVkIGluIHRoZSBQRE9NLiBDb3VsZCBiZSByZW1vdmVkIGFmdGVyIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTE0XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGNvbnN0IGV4dHJhU291bmRFbmFibGVkTGlzdGVuZXIgPSAoIGVuYWJsZWQ6IGJvb2xlYW4gKSA9PiB7XHJcbiAgICAgICAgZXh0cmFTb3VuZENvbnRlbnQhLmVuYWJsZWQgPSBlbmFibGVkO1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBXb3JrYXJvdW5kIGZvciBub3csIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTUxNC4gUERPTSBkb2VzIG5vdFxyXG4gICAgICAgIC8vICAgICAgIGNvcnJlY3RseSBwcm9wYWdhdGUgZW5hYmxlZCBzdGF0ZSB0byBkZXNjZW5kYW50cyB3aGVuIGFuY2VzdG9yIGJlY29tZXMgZGlzYWJsZWQuXHJcbiAgICAgICAgZXh0cmFTb3VuZENoZWNrYm94LmlucHV0RW5hYmxlZCA9IGVuYWJsZWQ7XHJcbiAgICAgIH07XHJcbiAgICAgIGF1ZGlvTW9kZWwuc291bmRFbmFibGVkUHJvcGVydHkubGluayggZXh0cmFTb3VuZEVuYWJsZWRMaXN0ZW5lciApO1xyXG4gICAgfVxyXG5cclxuICAgIHN1cGVyKCB7XHJcbiAgICAgIHRpdGxlTm9kZTogc291bmRFbmFibGVkQ29udHJvbCxcclxuICAgICAgY29udGVudE5vZGU6IGV4dHJhU291bmRDb250ZW50XHJcbiAgICB9ICk7XHJcbiAgfVxyXG59XHJcblxyXG5qb2lzdC5yZWdpc3RlciggJ1NvdW5kUGFuZWxTZWN0aW9uJywgU291bmRQYW5lbFNlY3Rpb24gKTtcclxuZXhwb3J0IGRlZmF1bHQgU291bmRQYW5lbFNlY3Rpb247Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztB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