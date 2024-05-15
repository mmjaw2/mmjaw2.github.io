// Copyright 2021-2024, University of Colorado Boulder

/**
 * A panel for the PreferencesDialog with controls for visual preferences. Includes features such as
 * "Interactive Highlights" and perhaps others in the future.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import merge from '../../../phet-core/js/merge.js';
import { Node, Text, VBox, VoicingText } from '../../../scenery/js/imports.js';
import joist from '../joist.js';
import JoistStrings from '../JoistStrings.js';
import PreferencesDialog from './PreferencesDialog.js';
import PreferencesPanelSection from './PreferencesPanelSection.js';
import PreferencesControl from './PreferencesControl.js';
import optionize, { combineOptions } from '../../../phet-core/js/optionize.js';
import ProjectorModeToggleSwitch from './ProjectorModeToggleSwitch.js';
import Tandem from '../../../tandem/js/Tandem.js';
import PreferencesPanel from './PreferencesPanel.js';
import PreferencesType from './PreferencesType.js';
import ToggleSwitch from '../../../sun/js/ToggleSwitch.js';
import PreferencesDialogConstants from './PreferencesDialogConstants.js';
import PatternStringProperty from '../../../axon/js/PatternStringProperty.js';

// constants
const interactiveHighlightsStringProperty = JoistStrings.preferences.tabs.visual.interactiveHighlightsStringProperty;
const interactiveHighlightsDescriptionStringProperty = JoistStrings.preferences.tabs.visual.interactiveHighlightsDescriptionStringProperty;
const interactiveHighlightsEnabledAlertStringProperty = JoistStrings.a11y.preferences.tabs.visual.interactiveHighlights.enabledAlertStringProperty;
const interactiveHighlightsDisabledAlertStringProperty = JoistStrings.a11y.preferences.tabs.visual.interactiveHighlights.disabledAlertStringProperty;
const labelledDescriptionPatternStringProperty = JoistStrings.a11y.preferences.tabs.labelledDescriptionPatternStringProperty;
class VisualPreferencesPanel extends PreferencesPanel {
  constructor(visualModel, selectedTabProperty, tabVisibleProperty, providedOptions) {
    const options = optionize()({
      labelContent: 'Visual'
    }, providedOptions);

    // Grab the required tandem for subcomponents but the tandem is NOT passed through to the super
    const tandem = options.tandem;
    options.tandem = Tandem.OPT_OUT;
    super(PreferencesType.VISUAL, selectedTabProperty, tabVisibleProperty, options);
    const contentNode = new VBox({
      spacing: PreferencesDialog.CONTENT_SPACING,
      align: 'left'
    });
    if (visualModel.supportsProjectorMode) {
      const projectorModeSwitch = new ProjectorModeToggleSwitch(visualModel.colorProfileProperty);
      contentNode.addChild(projectorModeSwitch);
    }
    if (visualModel.supportsInteractiveHighlights) {
      const label = new Text(interactiveHighlightsStringProperty, PreferencesDialog.PANEL_SECTION_LABEL_OPTIONS);
      const highlightsReadingBlockNameResponsePatternStringProperty = new PatternStringProperty(labelledDescriptionPatternStringProperty, {
        label: interactiveHighlightsStringProperty,
        description: interactiveHighlightsDescriptionStringProperty
      }, {
        tandem: Tandem.OPT_OUT
      });
      const interactiveHighlightsEnabledSwitchVoicingText = new VoicingText(interactiveHighlightsDescriptionStringProperty, merge({}, PreferencesDialog.PANEL_SECTION_CONTENT_OPTIONS, {
        readingBlockNameResponse: highlightsReadingBlockNameResponsePatternStringProperty
      }));
      const interactiveHighlightsEnabledSwitch = new ToggleSwitch(visualModel.interactiveHighlightsEnabledProperty, false, true, combineOptions({
        a11yName: interactiveHighlightsStringProperty,
        leftValueContextResponse: interactiveHighlightsDisabledAlertStringProperty,
        rightValueContextResponse: interactiveHighlightsEnabledAlertStringProperty
      }, PreferencesDialogConstants.TOGGLE_SWITCH_OPTIONS));
      const interactiveHighlightsEnabledControl = new PreferencesControl({
        labelNode: label,
        descriptionNode: interactiveHighlightsEnabledSwitchVoicingText,
        controlNode: interactiveHighlightsEnabledSwitch
      });
      contentNode.addChild(interactiveHighlightsEnabledControl);
    }
    visualModel.customPreferences.forEach(customPreference => {
      const customContent = customPreference.createContent(tandem);
      const node = new Node({
        children: [customContent]
      });
      contentNode.addChild(node);
    });
    const panelSection = new PreferencesPanelSection({
      contentNode: contentNode,
      // no title for this section so no indendation necessary
      contentLeftMargin: 0
    });
    this.addChild(panelSection);
  }
}
joist.register('VisualPreferencesPanel', VisualPreferencesPanel);
export default VisualPreferencesPanel;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJtZXJnZSIsIk5vZGUiLCJUZXh0IiwiVkJveCIsIlZvaWNpbmdUZXh0Iiwiam9pc3QiLCJKb2lzdFN0cmluZ3MiLCJQcmVmZXJlbmNlc0RpYWxvZyIsIlByZWZlcmVuY2VzUGFuZWxTZWN0aW9uIiwiUHJlZmVyZW5jZXNDb250cm9sIiwib3B0aW9uaXplIiwiY29tYmluZU9wdGlvbnMiLCJQcm9qZWN0b3JNb2RlVG9nZ2xlU3dpdGNoIiwiVGFuZGVtIiwiUHJlZmVyZW5jZXNQYW5lbCIsIlByZWZlcmVuY2VzVHlwZSIsIlRvZ2dsZVN3aXRjaCIsIlByZWZlcmVuY2VzRGlhbG9nQ29uc3RhbnRzIiwiUGF0dGVyblN0cmluZ1Byb3BlcnR5IiwiaW50ZXJhY3RpdmVIaWdobGlnaHRzU3RyaW5nUHJvcGVydHkiLCJwcmVmZXJlbmNlcyIsInRhYnMiLCJ2aXN1YWwiLCJpbnRlcmFjdGl2ZUhpZ2hsaWdodHNEZXNjcmlwdGlvblN0cmluZ1Byb3BlcnR5IiwiaW50ZXJhY3RpdmVIaWdobGlnaHRzRW5hYmxlZEFsZXJ0U3RyaW5nUHJvcGVydHkiLCJhMTF5IiwiaW50ZXJhY3RpdmVIaWdobGlnaHRzIiwiZW5hYmxlZEFsZXJ0U3RyaW5nUHJvcGVydHkiLCJpbnRlcmFjdGl2ZUhpZ2hsaWdodHNEaXNhYmxlZEFsZXJ0U3RyaW5nUHJvcGVydHkiLCJkaXNhYmxlZEFsZXJ0U3RyaW5nUHJvcGVydHkiLCJsYWJlbGxlZERlc2NyaXB0aW9uUGF0dGVyblN0cmluZ1Byb3BlcnR5IiwiVmlzdWFsUHJlZmVyZW5jZXNQYW5lbCIsImNvbnN0cnVjdG9yIiwidmlzdWFsTW9kZWwiLCJzZWxlY3RlZFRhYlByb3BlcnR5IiwidGFiVmlzaWJsZVByb3BlcnR5IiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsImxhYmVsQ29udGVudCIsInRhbmRlbSIsIk9QVF9PVVQiLCJWSVNVQUwiLCJjb250ZW50Tm9kZSIsInNwYWNpbmciLCJDT05URU5UX1NQQUNJTkciLCJhbGlnbiIsInN1cHBvcnRzUHJvamVjdG9yTW9kZSIsInByb2plY3Rvck1vZGVTd2l0Y2giLCJjb2xvclByb2ZpbGVQcm9wZXJ0eSIsImFkZENoaWxkIiwic3VwcG9ydHNJbnRlcmFjdGl2ZUhpZ2hsaWdodHMiLCJsYWJlbCIsIlBBTkVMX1NFQ1RJT05fTEFCRUxfT1BUSU9OUyIsImhpZ2hsaWdodHNSZWFkaW5nQmxvY2tOYW1lUmVzcG9uc2VQYXR0ZXJuU3RyaW5nUHJvcGVydHkiLCJkZXNjcmlwdGlvbiIsImludGVyYWN0aXZlSGlnaGxpZ2h0c0VuYWJsZWRTd2l0Y2hWb2ljaW5nVGV4dCIsIlBBTkVMX1NFQ1RJT05fQ09OVEVOVF9PUFRJT05TIiwicmVhZGluZ0Jsb2NrTmFtZVJlc3BvbnNlIiwiaW50ZXJhY3RpdmVIaWdobGlnaHRzRW5hYmxlZFN3aXRjaCIsImludGVyYWN0aXZlSGlnaGxpZ2h0c0VuYWJsZWRQcm9wZXJ0eSIsImExMXlOYW1lIiwibGVmdFZhbHVlQ29udGV4dFJlc3BvbnNlIiwicmlnaHRWYWx1ZUNvbnRleHRSZXNwb25zZSIsIlRPR0dMRV9TV0lUQ0hfT1BUSU9OUyIsImludGVyYWN0aXZlSGlnaGxpZ2h0c0VuYWJsZWRDb250cm9sIiwibGFiZWxOb2RlIiwiZGVzY3JpcHRpb25Ob2RlIiwiY29udHJvbE5vZGUiLCJjdXN0b21QcmVmZXJlbmNlcyIsImZvckVhY2giLCJjdXN0b21QcmVmZXJlbmNlIiwiY3VzdG9tQ29udGVudCIsImNyZWF0ZUNvbnRlbnQiLCJub2RlIiwiY2hpbGRyZW4iLCJwYW5lbFNlY3Rpb24iLCJjb250ZW50TGVmdE1hcmdpbiIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiVmlzdWFsUHJlZmVyZW5jZXNQYW5lbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMS0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBIHBhbmVsIGZvciB0aGUgUHJlZmVyZW5jZXNEaWFsb2cgd2l0aCBjb250cm9scyBmb3IgdmlzdWFsIHByZWZlcmVuY2VzLiBJbmNsdWRlcyBmZWF0dXJlcyBzdWNoIGFzXHJcbiAqIFwiSW50ZXJhY3RpdmUgSGlnaGxpZ2h0c1wiIGFuZCBwZXJoYXBzIG90aGVycyBpbiB0aGUgZnV0dXJlLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgbWVyZ2UgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL21lcmdlLmpzJztcclxuaW1wb3J0IHsgTm9kZSwgVGV4dCwgVkJveCwgVm9pY2luZ1RleHQgfSBmcm9tICcuLi8uLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgam9pc3QgZnJvbSAnLi4vam9pc3QuanMnO1xyXG5pbXBvcnQgSm9pc3RTdHJpbmdzIGZyb20gJy4uL0pvaXN0U3RyaW5ncy5qcyc7XHJcbmltcG9ydCBQcmVmZXJlbmNlc0RpYWxvZyBmcm9tICcuL1ByZWZlcmVuY2VzRGlhbG9nLmpzJztcclxuaW1wb3J0IFByZWZlcmVuY2VzUGFuZWxTZWN0aW9uIGZyb20gJy4vUHJlZmVyZW5jZXNQYW5lbFNlY3Rpb24uanMnO1xyXG5pbXBvcnQgUHJlZmVyZW5jZXNDb250cm9sIGZyb20gJy4vUHJlZmVyZW5jZXNDb250cm9sLmpzJztcclxuaW1wb3J0IHsgVmlzdWFsTW9kZWwgfSBmcm9tICcuL1ByZWZlcmVuY2VzTW9kZWwuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplLCB7IGNvbWJpbmVPcHRpb25zLCBFbXB0eVNlbGZPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBQcm9qZWN0b3JNb2RlVG9nZ2xlU3dpdGNoIGZyb20gJy4vUHJvamVjdG9yTW9kZVRvZ2dsZVN3aXRjaC5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcbmltcG9ydCBQcmVmZXJlbmNlc1BhbmVsLCB7IFByZWZlcmVuY2VzUGFuZWxPcHRpb25zIH0gZnJvbSAnLi9QcmVmZXJlbmNlc1BhbmVsLmpzJztcclxuaW1wb3J0IFRSZWFkT25seVByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgUHJlZmVyZW5jZXNUeXBlIGZyb20gJy4vUHJlZmVyZW5jZXNUeXBlLmpzJztcclxuaW1wb3J0IFBpY2tSZXF1aXJlZCBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvUGlja1JlcXVpcmVkLmpzJztcclxuaW1wb3J0IFRvZ2dsZVN3aXRjaCwgeyBUb2dnbGVTd2l0Y2hPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vc3VuL2pzL1RvZ2dsZVN3aXRjaC5qcyc7XHJcbmltcG9ydCBQcmVmZXJlbmNlc0RpYWxvZ0NvbnN0YW50cyBmcm9tICcuL1ByZWZlcmVuY2VzRGlhbG9nQ29uc3RhbnRzLmpzJztcclxuaW1wb3J0IFBhdHRlcm5TdHJpbmdQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1BhdHRlcm5TdHJpbmdQcm9wZXJ0eS5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgaW50ZXJhY3RpdmVIaWdobGlnaHRzU3RyaW5nUHJvcGVydHkgPSBKb2lzdFN0cmluZ3MucHJlZmVyZW5jZXMudGFicy52aXN1YWwuaW50ZXJhY3RpdmVIaWdobGlnaHRzU3RyaW5nUHJvcGVydHk7XHJcbmNvbnN0IGludGVyYWN0aXZlSGlnaGxpZ2h0c0Rlc2NyaXB0aW9uU3RyaW5nUHJvcGVydHkgPSBKb2lzdFN0cmluZ3MucHJlZmVyZW5jZXMudGFicy52aXN1YWwuaW50ZXJhY3RpdmVIaWdobGlnaHRzRGVzY3JpcHRpb25TdHJpbmdQcm9wZXJ0eTtcclxuY29uc3QgaW50ZXJhY3RpdmVIaWdobGlnaHRzRW5hYmxlZEFsZXJ0U3RyaW5nUHJvcGVydHkgPSBKb2lzdFN0cmluZ3MuYTExeS5wcmVmZXJlbmNlcy50YWJzLnZpc3VhbC5pbnRlcmFjdGl2ZUhpZ2hsaWdodHMuZW5hYmxlZEFsZXJ0U3RyaW5nUHJvcGVydHk7XHJcbmNvbnN0IGludGVyYWN0aXZlSGlnaGxpZ2h0c0Rpc2FibGVkQWxlcnRTdHJpbmdQcm9wZXJ0eSA9IEpvaXN0U3RyaW5ncy5hMTF5LnByZWZlcmVuY2VzLnRhYnMudmlzdWFsLmludGVyYWN0aXZlSGlnaGxpZ2h0cy5kaXNhYmxlZEFsZXJ0U3RyaW5nUHJvcGVydHk7XHJcbmNvbnN0IGxhYmVsbGVkRGVzY3JpcHRpb25QYXR0ZXJuU3RyaW5nUHJvcGVydHkgPSBKb2lzdFN0cmluZ3MuYTExeS5wcmVmZXJlbmNlcy50YWJzLmxhYmVsbGVkRGVzY3JpcHRpb25QYXR0ZXJuU3RyaW5nUHJvcGVydHk7XHJcblxyXG50eXBlIFZpc3VhbFByZWZlcmVuY2VzUGFuZWxPcHRpb25zID0gUGlja1JlcXVpcmVkPFByZWZlcmVuY2VzUGFuZWxPcHRpb25zLCAndGFuZGVtJz47XHJcblxyXG5jbGFzcyBWaXN1YWxQcmVmZXJlbmNlc1BhbmVsIGV4dGVuZHMgUHJlZmVyZW5jZXNQYW5lbCB7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggdmlzdWFsTW9kZWw6IFZpc3VhbE1vZGVsLCBzZWxlY3RlZFRhYlByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxQcmVmZXJlbmNlc1R5cGU+LCB0YWJWaXNpYmxlUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+LCBwcm92aWRlZE9wdGlvbnM/OiBWaXN1YWxQcmVmZXJlbmNlc1BhbmVsT3B0aW9ucyApIHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPFByZWZlcmVuY2VzUGFuZWxPcHRpb25zLCBFbXB0eVNlbGZPcHRpb25zLCBQcmVmZXJlbmNlc1BhbmVsT3B0aW9ucz4oKSgge1xyXG4gICAgICBsYWJlbENvbnRlbnQ6ICdWaXN1YWwnXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyBHcmFiIHRoZSByZXF1aXJlZCB0YW5kZW0gZm9yIHN1YmNvbXBvbmVudHMgYnV0IHRoZSB0YW5kZW0gaXMgTk9UIHBhc3NlZCB0aHJvdWdoIHRvIHRoZSBzdXBlclxyXG4gICAgY29uc3QgdGFuZGVtID0gb3B0aW9ucy50YW5kZW07XHJcbiAgICBvcHRpb25zLnRhbmRlbSA9IFRhbmRlbS5PUFRfT1VUO1xyXG5cclxuICAgIHN1cGVyKCBQcmVmZXJlbmNlc1R5cGUuVklTVUFMLCBzZWxlY3RlZFRhYlByb3BlcnR5LCB0YWJWaXNpYmxlUHJvcGVydHksIG9wdGlvbnMgKTtcclxuXHJcbiAgICBjb25zdCBjb250ZW50Tm9kZSA9IG5ldyBWQm94KCB7XHJcbiAgICAgIHNwYWNpbmc6IFByZWZlcmVuY2VzRGlhbG9nLkNPTlRFTlRfU1BBQ0lORyxcclxuICAgICAgYWxpZ246ICdsZWZ0J1xyXG4gICAgfSApO1xyXG5cclxuICAgIGlmICggdmlzdWFsTW9kZWwuc3VwcG9ydHNQcm9qZWN0b3JNb2RlICkge1xyXG4gICAgICBjb25zdCBwcm9qZWN0b3JNb2RlU3dpdGNoID0gbmV3IFByb2plY3Rvck1vZGVUb2dnbGVTd2l0Y2goIHZpc3VhbE1vZGVsLmNvbG9yUHJvZmlsZVByb3BlcnR5ICk7XHJcbiAgICAgIGNvbnRlbnROb2RlLmFkZENoaWxkKCBwcm9qZWN0b3JNb2RlU3dpdGNoICk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGlmICggdmlzdWFsTW9kZWwuc3VwcG9ydHNJbnRlcmFjdGl2ZUhpZ2hsaWdodHMgKSB7XHJcblxyXG4gICAgICBjb25zdCBsYWJlbCA9IG5ldyBUZXh0KCBpbnRlcmFjdGl2ZUhpZ2hsaWdodHNTdHJpbmdQcm9wZXJ0eSwgUHJlZmVyZW5jZXNEaWFsb2cuUEFORUxfU0VDVElPTl9MQUJFTF9PUFRJT05TICk7XHJcblxyXG4gICAgICBjb25zdCBoaWdobGlnaHRzUmVhZGluZ0Jsb2NrTmFtZVJlc3BvbnNlUGF0dGVyblN0cmluZ1Byb3BlcnR5ID0gbmV3IFBhdHRlcm5TdHJpbmdQcm9wZXJ0eSggbGFiZWxsZWREZXNjcmlwdGlvblBhdHRlcm5TdHJpbmdQcm9wZXJ0eSwge1xyXG4gICAgICAgIGxhYmVsOiBpbnRlcmFjdGl2ZUhpZ2hsaWdodHNTdHJpbmdQcm9wZXJ0eSxcclxuICAgICAgICBkZXNjcmlwdGlvbjogaW50ZXJhY3RpdmVIaWdobGlnaHRzRGVzY3JpcHRpb25TdHJpbmdQcm9wZXJ0eVxyXG4gICAgICB9LCB7IHRhbmRlbTogVGFuZGVtLk9QVF9PVVQgfSApO1xyXG4gICAgICBjb25zdCBpbnRlcmFjdGl2ZUhpZ2hsaWdodHNFbmFibGVkU3dpdGNoVm9pY2luZ1RleHQgPSBuZXcgVm9pY2luZ1RleHQoIGludGVyYWN0aXZlSGlnaGxpZ2h0c0Rlc2NyaXB0aW9uU3RyaW5nUHJvcGVydHksIG1lcmdlKCB7fSwgUHJlZmVyZW5jZXNEaWFsb2cuUEFORUxfU0VDVElPTl9DT05URU5UX09QVElPTlMsIHtcclxuICAgICAgICByZWFkaW5nQmxvY2tOYW1lUmVzcG9uc2U6IGhpZ2hsaWdodHNSZWFkaW5nQmxvY2tOYW1lUmVzcG9uc2VQYXR0ZXJuU3RyaW5nUHJvcGVydHlcclxuICAgICAgfSApICk7XHJcbiAgICAgIGNvbnN0IGludGVyYWN0aXZlSGlnaGxpZ2h0c0VuYWJsZWRTd2l0Y2ggPSBuZXcgVG9nZ2xlU3dpdGNoKCB2aXN1YWxNb2RlbC5pbnRlcmFjdGl2ZUhpZ2hsaWdodHNFbmFibGVkUHJvcGVydHksIGZhbHNlLCB0cnVlLCBjb21iaW5lT3B0aW9uczxUb2dnbGVTd2l0Y2hPcHRpb25zPigge1xyXG4gICAgICAgIGExMXlOYW1lOiBpbnRlcmFjdGl2ZUhpZ2hsaWdodHNTdHJpbmdQcm9wZXJ0eSxcclxuICAgICAgICBsZWZ0VmFsdWVDb250ZXh0UmVzcG9uc2U6IGludGVyYWN0aXZlSGlnaGxpZ2h0c0Rpc2FibGVkQWxlcnRTdHJpbmdQcm9wZXJ0eSxcclxuICAgICAgICByaWdodFZhbHVlQ29udGV4dFJlc3BvbnNlOiBpbnRlcmFjdGl2ZUhpZ2hsaWdodHNFbmFibGVkQWxlcnRTdHJpbmdQcm9wZXJ0eVxyXG4gICAgICB9LCBQcmVmZXJlbmNlc0RpYWxvZ0NvbnN0YW50cy5UT0dHTEVfU1dJVENIX09QVElPTlMgKSApO1xyXG5cclxuICAgICAgY29uc3QgaW50ZXJhY3RpdmVIaWdobGlnaHRzRW5hYmxlZENvbnRyb2wgPSBuZXcgUHJlZmVyZW5jZXNDb250cm9sKCB7XHJcbiAgICAgICAgbGFiZWxOb2RlOiBsYWJlbCxcclxuICAgICAgICBkZXNjcmlwdGlvbk5vZGU6IGludGVyYWN0aXZlSGlnaGxpZ2h0c0VuYWJsZWRTd2l0Y2hWb2ljaW5nVGV4dCxcclxuICAgICAgICBjb250cm9sTm9kZTogaW50ZXJhY3RpdmVIaWdobGlnaHRzRW5hYmxlZFN3aXRjaFxyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICBjb250ZW50Tm9kZS5hZGRDaGlsZCggaW50ZXJhY3RpdmVIaWdobGlnaHRzRW5hYmxlZENvbnRyb2wgKTtcclxuICAgIH1cclxuXHJcbiAgICB2aXN1YWxNb2RlbC5jdXN0b21QcmVmZXJlbmNlcy5mb3JFYWNoKCBjdXN0b21QcmVmZXJlbmNlID0+IHtcclxuICAgICAgY29uc3QgY3VzdG9tQ29udGVudCA9IGN1c3RvbVByZWZlcmVuY2UuY3JlYXRlQ29udGVudCggdGFuZGVtICk7XHJcbiAgICAgIGNvbnN0IG5vZGUgPSBuZXcgTm9kZSggeyBjaGlsZHJlbjogWyBjdXN0b21Db250ZW50IF0gfSApO1xyXG4gICAgICBjb250ZW50Tm9kZS5hZGRDaGlsZCggbm9kZSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IHBhbmVsU2VjdGlvbiA9IG5ldyBQcmVmZXJlbmNlc1BhbmVsU2VjdGlvbigge1xyXG4gICAgICBjb250ZW50Tm9kZTogY29udGVudE5vZGUsXHJcblxyXG4gICAgICAvLyBubyB0aXRsZSBmb3IgdGhpcyBzZWN0aW9uIHNvIG5vIGluZGVuZGF0aW9uIG5lY2Vzc2FyeVxyXG4gICAgICBjb250ZW50TGVmdE1hcmdpbjogMFxyXG4gICAgfSApO1xyXG4gICAgdGhpcy5hZGRDaGlsZCggcGFuZWxTZWN0aW9uICk7XHJcbiAgfVxyXG59XHJcblxyXG5qb2lzdC5yZWdpc3RlciggJ1Zpc3VhbFByZWZlcmVuY2VzUGFuZWwnLCBWaXN1YWxQcmVmZXJlbmNlc1BhbmVsICk7XHJcbmV4cG9ydCBkZWZhdWx0IFZpc3VhbFByZWZlcmVuY2VzUGFuZWw7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsS0FBSyxNQUFNLGdDQUFnQztBQUNsRCxTQUFTQyxJQUFJLEVBQUVDLElBQUksRUFBRUMsSUFBSSxFQUFFQyxXQUFXLFFBQVEsZ0NBQWdDO0FBQzlFLE9BQU9DLEtBQUssTUFBTSxhQUFhO0FBQy9CLE9BQU9DLFlBQVksTUFBTSxvQkFBb0I7QUFDN0MsT0FBT0MsaUJBQWlCLE1BQU0sd0JBQXdCO0FBQ3RELE9BQU9DLHVCQUF1QixNQUFNLDhCQUE4QjtBQUNsRSxPQUFPQyxrQkFBa0IsTUFBTSx5QkFBeUI7QUFFeEQsT0FBT0MsU0FBUyxJQUFJQyxjQUFjLFFBQTBCLG9DQUFvQztBQUNoRyxPQUFPQyx5QkFBeUIsTUFBTSxnQ0FBZ0M7QUFDdEUsT0FBT0MsTUFBTSxNQUFNLDhCQUE4QjtBQUNqRCxPQUFPQyxnQkFBZ0IsTUFBbUMsdUJBQXVCO0FBRWpGLE9BQU9DLGVBQWUsTUFBTSxzQkFBc0I7QUFFbEQsT0FBT0MsWUFBWSxNQUErQixpQ0FBaUM7QUFDbkYsT0FBT0MsMEJBQTBCLE1BQU0saUNBQWlDO0FBQ3hFLE9BQU9DLHFCQUFxQixNQUFNLDJDQUEyQzs7QUFFN0U7QUFDQSxNQUFNQyxtQ0FBbUMsR0FBR2IsWUFBWSxDQUFDYyxXQUFXLENBQUNDLElBQUksQ0FBQ0MsTUFBTSxDQUFDSCxtQ0FBbUM7QUFDcEgsTUFBTUksOENBQThDLEdBQUdqQixZQUFZLENBQUNjLFdBQVcsQ0FBQ0MsSUFBSSxDQUFDQyxNQUFNLENBQUNDLDhDQUE4QztBQUMxSSxNQUFNQywrQ0FBK0MsR0FBR2xC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