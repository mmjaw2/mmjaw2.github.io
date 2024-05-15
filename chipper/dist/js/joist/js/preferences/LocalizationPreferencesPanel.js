// Copyright 2022-2024, University of Colorado Boulder

/**
 * The content for the "Localization" tab in the PreferencesDialog.
 *
 * This is still being designed and developed. We expect it to contain a UI component to change the
 * language on the fly when running in the "_all" file. There may also be controls to change out
 * a character set or other artwork to match certain cultures or regions.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import { Node, RichText, Text, VBox } from '../../../scenery/js/imports.js';
import joist from '../joist.js';
import PreferencesPanelSection from './PreferencesPanelSection.js';
import RegionAndCultureComboBox from './RegionAndCultureComboBox.js';
import LocalePanel from './LocalePanel.js';
import PreferencesDialog from './PreferencesDialog.js';
import PreferencesPanel from './PreferencesPanel.js';
import PreferencesType from './PreferencesType.js';
import JoistStrings from '../JoistStrings.js';
import optionize from '../../../phet-core/js/optionize.js';
import PreferencesDialogConstants from './PreferencesDialogConstants.js';
import PreferencesControl from './PreferencesControl.js';
import { supportedRegionAndCultureValues } from '../i18n/regionAndCultureProperty.js';

// constants
const localizationTitleStringProperty = JoistStrings.preferences.tabs.localization.titleStringProperty;
const regionAndCultureTitleStringProperty = JoistStrings.preferences.tabs.localization.regionAndCulture.titleStringProperty;
const regionAndCultureDescriptionStringProperty = JoistStrings.preferences.tabs.localization.regionAndCulture.descriptionStringProperty;
class LocalizationPreferencesPanel extends PreferencesPanel {
  constructor(localizationModel, selectedTabProperty, tabVisibleProperty, providedOptions) {
    const options = optionize()({
      labelContent: localizationTitleStringProperty,
      phetioVisiblePropertyInstrumented: false
    }, providedOptions);
    super(PreferencesType.LOCALIZATION, selectedTabProperty, tabVisibleProperty, options);
    const contentNode = new VBox({
      spacing: PreferencesDialog.CONTENT_SPACING
    });

    // Add 'Region and Culture' combo box if there are at least 2 values.
    if (supportedRegionAndCultureValues.length > 1) {
      const comboBox = new RegionAndCultureComboBox();
      const labelNode = new Text(regionAndCultureTitleStringProperty, PreferencesDialogConstants.CONTROL_LABEL_OPTIONS);
      const descriptionNode = new RichText(regionAndCultureDescriptionStringProperty, PreferencesDialogConstants.CONTROL_DESCRIPTION_OPTIONS);
      contentNode.addChild(new PreferencesControl({
        labelNode: labelNode,
        controlNode: comboBox,
        descriptionNode: descriptionNode
      }));
    }
    if (localizationModel.supportsDynamicLocale && localizationModel.includeLocalePanel) {
      // The language selection provided by LocalePanel does not follow the PreferencesControl pattern because it is a
      // much larger custom UI component that does not fit in the standard PreferencesControl layout.
      const localeLabel = new Text(JoistStrings.a11y.preferences.tabs.localization.languageSelection.labelStringProperty, PreferencesDialogConstants.CONTROL_LABEL_OPTIONS);
      const localeDescription = new RichText(JoistStrings.a11y.preferences.tabs.localization.languageSelection.descriptionStringProperty, PreferencesDialogConstants.CONTROL_DESCRIPTION_OPTIONS);
      const localePanel = new LocalePanel(localizationModel.localeProperty);
      const localeVBox = new VBox({
        children: [localeLabel, localeDescription, localePanel],
        align: 'left',
        spacing: 5,
        stretch: true,
        layoutOptions: {
          stretch: true
        }
      });
      contentNode.addChild(localeVBox);
    }
    localizationModel.customPreferences.forEach(customPreference => {
      const customContent = customPreference.createContent(providedOptions.tandem);
      contentNode.addChild(new Node({
        children: [customContent]
      }));
    });

    // center align within this content if there is only one item, otherwise left align all items
    contentNode.align = contentNode.children.length > 1 ? 'left' : 'center';
    const panelSection = new PreferencesPanelSection({
      contentNode: contentNode,
      // Without a title no indentation is necessary
      contentLeftMargin: 0
    });
    this.addChild(panelSection);
  }
}
joist.register('LocalizationPreferencesPanel', LocalizationPreferencesPanel);
export default LocalizationPreferencesPanel;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJOb2RlIiwiUmljaFRleHQiLCJUZXh0IiwiVkJveCIsImpvaXN0IiwiUHJlZmVyZW5jZXNQYW5lbFNlY3Rpb24iLCJSZWdpb25BbmRDdWx0dXJlQ29tYm9Cb3giLCJMb2NhbGVQYW5lbCIsIlByZWZlcmVuY2VzRGlhbG9nIiwiUHJlZmVyZW5jZXNQYW5lbCIsIlByZWZlcmVuY2VzVHlwZSIsIkpvaXN0U3RyaW5ncyIsIm9wdGlvbml6ZSIsIlByZWZlcmVuY2VzRGlhbG9nQ29uc3RhbnRzIiwiUHJlZmVyZW5jZXNDb250cm9sIiwic3VwcG9ydGVkUmVnaW9uQW5kQ3VsdHVyZVZhbHVlcyIsImxvY2FsaXphdGlvblRpdGxlU3RyaW5nUHJvcGVydHkiLCJwcmVmZXJlbmNlcyIsInRhYnMiLCJsb2NhbGl6YXRpb24iLCJ0aXRsZVN0cmluZ1Byb3BlcnR5IiwicmVnaW9uQW5kQ3VsdHVyZVRpdGxlU3RyaW5nUHJvcGVydHkiLCJyZWdpb25BbmRDdWx0dXJlIiwicmVnaW9uQW5kQ3VsdHVyZURlc2NyaXB0aW9uU3RyaW5nUHJvcGVydHkiLCJkZXNjcmlwdGlvblN0cmluZ1Byb3BlcnR5IiwiTG9jYWxpemF0aW9uUHJlZmVyZW5jZXNQYW5lbCIsImNvbnN0cnVjdG9yIiwibG9jYWxpemF0aW9uTW9kZWwiLCJzZWxlY3RlZFRhYlByb3BlcnR5IiwidGFiVmlzaWJsZVByb3BlcnR5IiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsImxhYmVsQ29udGVudCIsInBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZCIsIkxPQ0FMSVpBVElPTiIsImNvbnRlbnROb2RlIiwic3BhY2luZyIsIkNPTlRFTlRfU1BBQ0lORyIsImxlbmd0aCIsImNvbWJvQm94IiwibGFiZWxOb2RlIiwiQ09OVFJPTF9MQUJFTF9PUFRJT05TIiwiZGVzY3JpcHRpb25Ob2RlIiwiQ09OVFJPTF9ERVNDUklQVElPTl9PUFRJT05TIiwiYWRkQ2hpbGQiLCJjb250cm9sTm9kZSIsInN1cHBvcnRzRHluYW1pY0xvY2FsZSIsImluY2x1ZGVMb2NhbGVQYW5lbCIsImxvY2FsZUxhYmVsIiwiYTExeSIsImxhbmd1YWdlU2VsZWN0aW9uIiwibGFiZWxTdHJpbmdQcm9wZXJ0eSIsImxvY2FsZURlc2NyaXB0aW9uIiwibG9jYWxlUGFuZWwiLCJsb2NhbGVQcm9wZXJ0eSIsImxvY2FsZVZCb3giLCJjaGlsZHJlbiIsImFsaWduIiwic3RyZXRjaCIsImxheW91dE9wdGlvbnMiLCJjdXN0b21QcmVmZXJlbmNlcyIsImZvckVhY2giLCJjdXN0b21QcmVmZXJlbmNlIiwiY3VzdG9tQ29udGVudCIsImNyZWF0ZUNvbnRlbnQiLCJ0YW5kZW0iLCJwYW5lbFNlY3Rpb24iLCJjb250ZW50TGVmdE1hcmdpbiIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiTG9jYWxpemF0aW9uUHJlZmVyZW5jZXNQYW5lbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBUaGUgY29udGVudCBmb3IgdGhlIFwiTG9jYWxpemF0aW9uXCIgdGFiIGluIHRoZSBQcmVmZXJlbmNlc0RpYWxvZy5cclxuICpcclxuICogVGhpcyBpcyBzdGlsbCBiZWluZyBkZXNpZ25lZCBhbmQgZGV2ZWxvcGVkLiBXZSBleHBlY3QgaXQgdG8gY29udGFpbiBhIFVJIGNvbXBvbmVudCB0byBjaGFuZ2UgdGhlXHJcbiAqIGxhbmd1YWdlIG9uIHRoZSBmbHkgd2hlbiBydW5uaW5nIGluIHRoZSBcIl9hbGxcIiBmaWxlLiBUaGVyZSBtYXkgYWxzbyBiZSBjb250cm9scyB0byBjaGFuZ2Ugb3V0XHJcbiAqIGEgY2hhcmFjdGVyIHNldCBvciBvdGhlciBhcnR3b3JrIHRvIG1hdGNoIGNlcnRhaW4gY3VsdHVyZXMgb3IgcmVnaW9ucy5cclxuICpcclxuICogQGF1dGhvciBKZXNzZSBHcmVlbmJlcmcgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgTm9kZSwgUmljaFRleHQsIFRleHQsIFZCb3ggfSBmcm9tICcuLi8uLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgam9pc3QgZnJvbSAnLi4vam9pc3QuanMnO1xyXG5pbXBvcnQgeyBMb2NhbGl6YXRpb25Nb2RlbCB9IGZyb20gJy4vUHJlZmVyZW5jZXNNb2RlbC5qcyc7XHJcbmltcG9ydCBQcmVmZXJlbmNlc1BhbmVsU2VjdGlvbiBmcm9tICcuL1ByZWZlcmVuY2VzUGFuZWxTZWN0aW9uLmpzJztcclxuaW1wb3J0IFJlZ2lvbkFuZEN1bHR1cmVDb21ib0JveCBmcm9tICcuL1JlZ2lvbkFuZEN1bHR1cmVDb21ib0JveC5qcyc7XHJcbmltcG9ydCBMb2NhbGVQYW5lbCBmcm9tICcuL0xvY2FsZVBhbmVsLmpzJztcclxuaW1wb3J0IFBpY2tSZXF1aXJlZCBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvUGlja1JlcXVpcmVkLmpzJztcclxuaW1wb3J0IFByZWZlcmVuY2VzRGlhbG9nIGZyb20gJy4vUHJlZmVyZW5jZXNEaWFsb2cuanMnO1xyXG5pbXBvcnQgUHJlZmVyZW5jZXNQYW5lbCwgeyBQcmVmZXJlbmNlc1BhbmVsT3B0aW9ucyB9IGZyb20gJy4vUHJlZmVyZW5jZXNQYW5lbC5qcyc7XHJcbmltcG9ydCBUUmVhZE9ubHlQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IFByZWZlcmVuY2VzVHlwZSBmcm9tICcuL1ByZWZlcmVuY2VzVHlwZS5qcyc7XHJcbmltcG9ydCBKb2lzdFN0cmluZ3MgZnJvbSAnLi4vSm9pc3RTdHJpbmdzLmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBFbXB0eVNlbGZPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBQcmVmZXJlbmNlc0RpYWxvZ0NvbnN0YW50cyBmcm9tICcuL1ByZWZlcmVuY2VzRGlhbG9nQ29uc3RhbnRzLmpzJztcclxuaW1wb3J0IFByZWZlcmVuY2VzQ29udHJvbCBmcm9tICcuL1ByZWZlcmVuY2VzQ29udHJvbC5qcyc7XHJcbmltcG9ydCB7IHN1cHBvcnRlZFJlZ2lvbkFuZEN1bHR1cmVWYWx1ZXMgfSBmcm9tICcuLi9pMThuL3JlZ2lvbkFuZEN1bHR1cmVQcm9wZXJ0eS5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgbG9jYWxpemF0aW9uVGl0bGVTdHJpbmdQcm9wZXJ0eSA9IEpvaXN0U3RyaW5ncy5wcmVmZXJlbmNlcy50YWJzLmxvY2FsaXphdGlvbi50aXRsZVN0cmluZ1Byb3BlcnR5O1xyXG5jb25zdCByZWdpb25BbmRDdWx0dXJlVGl0bGVTdHJpbmdQcm9wZXJ0eSA9IEpvaXN0U3RyaW5ncy5wcmVmZXJlbmNlcy50YWJzLmxvY2FsaXphdGlvbi5yZWdpb25BbmRDdWx0dXJlLnRpdGxlU3RyaW5nUHJvcGVydHk7XHJcbmNvbnN0IHJlZ2lvbkFuZEN1bHR1cmVEZXNjcmlwdGlvblN0cmluZ1Byb3BlcnR5ID0gSm9pc3RTdHJpbmdzLnByZWZlcmVuY2VzLnRhYnMubG9jYWxpemF0aW9uLnJlZ2lvbkFuZEN1bHR1cmUuZGVzY3JpcHRpb25TdHJpbmdQcm9wZXJ0eTtcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSBFbXB0eVNlbGZPcHRpb25zO1xyXG5cclxudHlwZSBMb2NhbGl6YXRpb25QcmVmZXJlbmNlc1BhbmVsT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgUGlja1JlcXVpcmVkPFByZWZlcmVuY2VzUGFuZWxPcHRpb25zLCAndGFuZGVtJz47XHJcblxyXG5jbGFzcyBMb2NhbGl6YXRpb25QcmVmZXJlbmNlc1BhbmVsIGV4dGVuZHMgUHJlZmVyZW5jZXNQYW5lbCB7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggbG9jYWxpemF0aW9uTW9kZWw6IExvY2FsaXphdGlvbk1vZGVsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRUYWJQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8UHJlZmVyZW5jZXNUeXBlPixcclxuICAgICAgICAgICAgICAgICAgICAgIHRhYlZpc2libGVQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj4sXHJcbiAgICAgICAgICAgICAgICAgICAgICBwcm92aWRlZE9wdGlvbnM6IExvY2FsaXphdGlvblByZWZlcmVuY2VzUGFuZWxPcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8TG9jYWxpemF0aW9uUHJlZmVyZW5jZXNQYW5lbE9wdGlvbnMsIFNlbGZPcHRpb25zLCBQcmVmZXJlbmNlc1BhbmVsT3B0aW9ucz4oKSgge1xyXG4gICAgICBsYWJlbENvbnRlbnQ6IGxvY2FsaXphdGlvblRpdGxlU3RyaW5nUHJvcGVydHksXHJcbiAgICAgIHBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZDogZmFsc2VcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIHN1cGVyKCBQcmVmZXJlbmNlc1R5cGUuTE9DQUxJWkFUSU9OLCBzZWxlY3RlZFRhYlByb3BlcnR5LCB0YWJWaXNpYmxlUHJvcGVydHksIG9wdGlvbnMgKTtcclxuXHJcbiAgICBjb25zdCBjb250ZW50Tm9kZSA9IG5ldyBWQm94KCB7XHJcbiAgICAgIHNwYWNpbmc6IFByZWZlcmVuY2VzRGlhbG9nLkNPTlRFTlRfU1BBQ0lOR1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIEFkZCAnUmVnaW9uIGFuZCBDdWx0dXJlJyBjb21ibyBib3ggaWYgdGhlcmUgYXJlIGF0IGxlYXN0IDIgdmFsdWVzLlxyXG4gICAgaWYgKCBzdXBwb3J0ZWRSZWdpb25BbmRDdWx0dXJlVmFsdWVzLmxlbmd0aCA+IDEgKSB7XHJcbiAgICAgIGNvbnN0IGNvbWJvQm94ID0gbmV3IFJlZ2lvbkFuZEN1bHR1cmVDb21ib0JveCgpO1xyXG4gICAgICBjb25zdCBsYWJlbE5vZGUgPSBuZXcgVGV4dCggcmVnaW9uQW5kQ3VsdHVyZVRpdGxlU3RyaW5nUHJvcGVydHksIFByZWZlcmVuY2VzRGlhbG9nQ29uc3RhbnRzLkNPTlRST0xfTEFCRUxfT1BUSU9OUyApO1xyXG4gICAgICBjb25zdCBkZXNjcmlwdGlvbk5vZGUgPSBuZXcgUmljaFRleHQoIHJlZ2lvbkFuZEN1bHR1cmVEZXNjcmlwdGlvblN0cmluZ1Byb3BlcnR5LCBQcmVmZXJlbmNlc0RpYWxvZ0NvbnN0YW50cy5DT05UUk9MX0RFU0NSSVBUSU9OX09QVElPTlMgKTtcclxuICAgICAgY29udGVudE5vZGUuYWRkQ2hpbGQoIG5ldyBQcmVmZXJlbmNlc0NvbnRyb2woIHtcclxuICAgICAgICBsYWJlbE5vZGU6IGxhYmVsTm9kZSxcclxuICAgICAgICBjb250cm9sTm9kZTogY29tYm9Cb3gsXHJcbiAgICAgICAgZGVzY3JpcHRpb25Ob2RlOiBkZXNjcmlwdGlvbk5vZGVcclxuICAgICAgfSApICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBsb2NhbGl6YXRpb25Nb2RlbC5zdXBwb3J0c0R5bmFtaWNMb2NhbGUgJiYgbG9jYWxpemF0aW9uTW9kZWwuaW5jbHVkZUxvY2FsZVBhbmVsICkge1xyXG5cclxuICAgICAgLy8gVGhlIGxhbmd1YWdlIHNlbGVjdGlvbiBwcm92aWRlZCBieSBMb2NhbGVQYW5lbCBkb2VzIG5vdCBmb2xsb3cgdGhlIFByZWZlcmVuY2VzQ29udHJvbCBwYXR0ZXJuIGJlY2F1c2UgaXQgaXMgYVxyXG4gICAgICAvLyBtdWNoIGxhcmdlciBjdXN0b20gVUkgY29tcG9uZW50IHRoYXQgZG9lcyBub3QgZml0IGluIHRoZSBzdGFuZGFyZCBQcmVmZXJlbmNlc0NvbnRyb2wgbGF5b3V0LlxyXG4gICAgICBjb25zdCBsb2NhbGVMYWJlbCA9IG5ldyBUZXh0KCBKb2lzdFN0cmluZ3MuYTExeS5wcmVmZXJlbmNlcy50YWJzLmxvY2FsaXphdGlvbi5sYW5ndWFnZVNlbGVjdGlvbi5sYWJlbFN0cmluZ1Byb3BlcnR5LFxyXG4gICAgICAgIFByZWZlcmVuY2VzRGlhbG9nQ29uc3RhbnRzLkNPTlRST0xfTEFCRUxfT1BUSU9OUyApO1xyXG4gICAgICBjb25zdCBsb2NhbGVEZXNjcmlwdGlvbiA9IG5ldyBSaWNoVGV4dCggSm9pc3RTdHJpbmdzLmExMXkucHJlZmVyZW5jZXMudGFicy5sb2NhbGl6YXRpb24ubGFuZ3VhZ2VTZWxlY3Rpb24uZGVzY3JpcHRpb25TdHJpbmdQcm9wZXJ0eSxcclxuICAgICAgICBQcmVmZXJlbmNlc0RpYWxvZ0NvbnN0YW50cy5DT05UUk9MX0RFU0NSSVBUSU9OX09QVElPTlMgKTtcclxuICAgICAgY29uc3QgbG9jYWxlUGFuZWwgPSBuZXcgTG9jYWxlUGFuZWwoIGxvY2FsaXphdGlvbk1vZGVsLmxvY2FsZVByb3BlcnR5ICk7XHJcblxyXG4gICAgICBjb25zdCBsb2NhbGVWQm94ID0gbmV3IFZCb3goIHtcclxuICAgICAgICBjaGlsZHJlbjogWyBsb2NhbGVMYWJlbCwgbG9jYWxlRGVzY3JpcHRpb24sIGxvY2FsZVBhbmVsIF0sXHJcbiAgICAgICAgYWxpZ246ICdsZWZ0JyxcclxuICAgICAgICBzcGFjaW5nOiA1LFxyXG4gICAgICAgIHN0cmV0Y2g6IHRydWUsXHJcbiAgICAgICAgbGF5b3V0T3B0aW9uczoge1xyXG4gICAgICAgICAgc3RyZXRjaDogdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG4gICAgICBjb250ZW50Tm9kZS5hZGRDaGlsZCggbG9jYWxlVkJveCApO1xyXG4gICAgfVxyXG5cclxuICAgIGxvY2FsaXphdGlvbk1vZGVsLmN1c3RvbVByZWZlcmVuY2VzLmZvckVhY2goIGN1c3RvbVByZWZlcmVuY2UgPT4ge1xyXG4gICAgICBjb25zdCBjdXN0b21Db250ZW50ID0gY3VzdG9tUHJlZmVyZW5jZS5jcmVhdGVDb250ZW50KCBwcm92aWRlZE9wdGlvbnMudGFuZGVtICk7XHJcbiAgICAgIGNvbnRlbnROb2RlLmFkZENoaWxkKCBuZXcgTm9kZSgge1xyXG4gICAgICAgIGNoaWxkcmVuOiBbIGN1c3RvbUNvbnRlbnQgXVxyXG4gICAgICB9ICkgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBjZW50ZXIgYWxpZ24gd2l0aGluIHRoaXMgY29udGVudCBpZiB0aGVyZSBpcyBvbmx5IG9uZSBpdGVtLCBvdGhlcndpc2UgbGVmdCBhbGlnbiBhbGwgaXRlbXNcclxuICAgIGNvbnRlbnROb2RlLmFsaWduID0gY29udGVudE5vZGUuY2hpbGRyZW4ubGVuZ3RoID4gMSA/ICdsZWZ0JyA6ICdjZW50ZXInO1xyXG5cclxuICAgIGNvbnN0IHBhbmVsU2VjdGlvbiA9IG5ldyBQcmVmZXJlbmNlc1BhbmVsU2VjdGlvbigge1xyXG4gICAgICBjb250ZW50Tm9kZTogY29udGVudE5vZGUsXHJcblxyXG4gICAgICAvLyBXaXRob3V0IGEgdGl0bGUgbm8gaW5kZW50YXRpb24gaXMgbmVjZXNzYXJ5XHJcbiAgICAgIGNvbnRlbnRMZWZ0TWFyZ2luOiAwXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5hZGRDaGlsZCggcGFuZWxTZWN0aW9uICk7XHJcbiAgfVxyXG59XHJcblxyXG5qb2lzdC5yZWdpc3RlciggJ0xvY2FsaXphdGlvblByZWZlcmVuY2VzUGFuZWwnLCBMb2NhbGl6YXRpb25QcmVmZXJlbmNlc1BhbmVsICk7XHJcbmV4cG9ydCBkZWZhdWx0IExvY2FsaXphdGlvblByZWZlcmVuY2VzUGFuZWw7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsU0FBU0EsSUFBSSxFQUFFQyxRQUFRLEVBQUVDLElBQUksRUFBRUMsSUFBSSxRQUFRLGdDQUFnQztBQUMzRSxPQUFPQyxLQUFLLE1BQU0sYUFBYTtBQUUvQixPQUFPQyx1QkFBdUIsTUFBTSw4QkFBOEI7QUFDbEUsT0FBT0Msd0JBQXdCLE1BQU0sK0JBQStCO0FBQ3BFLE9BQU9DLFdBQVcsTUFBTSxrQkFBa0I7QUFFMUMsT0FBT0MsaUJBQWlCLE1B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