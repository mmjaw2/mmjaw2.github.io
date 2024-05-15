// Copyright 2020-2023, University of Colorado Boulder

/**
 * Help section for explaining how to use a keyboard to interact with a ComboBox.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import PatternStringProperty from '../../../../axon/js/PatternStringProperty.js';
import StringProperty from '../../../../axon/js/StringProperty.js';
import optionize from '../../../../phet-core/js/optionize.js';
import sceneryPhet from '../../sceneryPhet.js';
import SceneryPhetStrings from '../../SceneryPhetStrings.js';
import TextKeyNode from '../TextKeyNode.js';
import KeyboardHelpIconFactory from './KeyboardHelpIconFactory.js';
import KeyboardHelpSection from './KeyboardHelpSection.js';
import KeyboardHelpSectionRow from './KeyboardHelpSectionRow.js';
import Tandem from '../../../../tandem/js/Tandem.js';
export default class ComboBoxKeyboardHelpSection extends KeyboardHelpSection {
  constructor(providedOptions) {
    const options = optionize()({
      // SelfOptions
      headingString: SceneryPhetStrings.keyboardHelpDialog.comboBox.headingStringStringProperty,
      thingAsLowerCaseSingular: SceneryPhetStrings.keyboardHelpDialog.comboBox.optionStringProperty,
      thingAsLowerCasePlural: SceneryPhetStrings.keyboardHelpDialog.comboBox.optionsStringProperty,
      // KeyboardHelpSectionOptions
      a11yContentTagName: 'ol',
      // ordered list
      vBoxOptions: {
        spacing: 8 // A bit tighter so that it looks like one set of instructions
      }
    }, providedOptions);

    // options may be string or TReadOnlyProperty<string>, so ensure that we have a TReadOnlyProperty<string>.
    const thingAsLowerCasePluralStringProperty = typeof options.thingAsLowerCasePlural === 'string' ? new StringProperty(options.thingAsLowerCasePlural) : options.thingAsLowerCasePlural;
    const thingAsLowerCaseSingularStringProperty = typeof options.thingAsLowerCaseSingular === 'string' ? new StringProperty(options.thingAsLowerCaseSingular) : options.thingAsLowerCaseSingular;

    // Create a PatternStringProperty that fills in a plural/singular pattern, and support dynamic locale.
    const createPatternStringProperty = providedStringProperty => {
      return new PatternStringProperty(providedStringProperty, {
        thingPlural: thingAsLowerCasePluralStringProperty,
        thingSingular: thingAsLowerCaseSingularStringProperty
      }, {
        tandem: Tandem.OPT_OUT
      });
    };
    const spaceKeyNode = TextKeyNode.space();
    const enterKeyNode = TextKeyNode.enter();
    const spaceOrEnterIcon = KeyboardHelpIconFactory.iconOrIcon(spaceKeyNode, enterKeyNode);
    const popUpList = KeyboardHelpSectionRow.labelWithIcon(createPatternStringProperty(SceneryPhetStrings.keyboardHelpDialog.comboBox.popUpListPatternStringProperty), spaceOrEnterIcon, {
      labelInnerContent: createPatternStringProperty(SceneryPhetStrings.a11y.keyboardHelpDialog.comboBox.popUpListPatternDescriptionStringProperty)
    });
    const moveThrough = KeyboardHelpSectionRow.labelWithIcon(createPatternStringProperty(SceneryPhetStrings.keyboardHelpDialog.comboBox.moveThroughPatternStringProperty), KeyboardHelpIconFactory.upDownArrowKeysRowIcon(), {
      labelInnerContent: createPatternStringProperty(SceneryPhetStrings.a11y.keyboardHelpDialog.comboBox.moveThroughPatternDescriptionStringProperty)
    });
    const chooseNew = KeyboardHelpSectionRow.labelWithIcon(createPatternStringProperty(SceneryPhetStrings.keyboardHelpDialog.comboBox.chooseNewPatternStringProperty), enterKeyNode, {
      labelInnerContent: createPatternStringProperty(SceneryPhetStrings.a11y.keyboardHelpDialog.comboBox.chooseNewPatternDescriptionStringProperty)
    });
    const escapeKeyNode = TextKeyNode.esc();
    const closeWithoutChanging = KeyboardHelpSectionRow.labelWithIcon(SceneryPhetStrings.keyboardHelpDialog.comboBox.closeWithoutChangingStringProperty, escapeKeyNode, {
      labelInnerContent: SceneryPhetStrings.a11y.keyboardHelpDialog.comboBox.closeWithoutChangingDescriptionStringProperty
    });

    // order the rows of content
    const rows = [popUpList, moveThrough, chooseNew, closeWithoutChanging];
    super(options.headingString, rows, options);
  }
}
sceneryPhet.register('ComboBoxKeyboardHelpSection', ComboBoxKeyboardHelpSection);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQYXR0ZXJuU3RyaW5nUHJvcGVydHkiLCJTdHJpbmdQcm9wZXJ0eSIsIm9wdGlvbml6ZSIsInNjZW5lcnlQaGV0IiwiU2NlbmVyeVBoZXRTdHJpbmdzIiwiVGV4dEtleU5vZGUiLCJLZXlib2FyZEhlbHBJY29uRmFjdG9yeSIsIktleWJvYXJkSGVscFNlY3Rpb24iLCJLZXlib2FyZEhlbHBTZWN0aW9uUm93IiwiVGFuZGVtIiwiQ29tYm9Cb3hLZXlib2FyZEhlbHBTZWN0aW9uIiwiY29uc3RydWN0b3IiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwiaGVhZGluZ1N0cmluZyIsImtleWJvYXJkSGVscERpYWxvZyIsImNvbWJvQm94IiwiaGVhZGluZ1N0cmluZ1N0cmluZ1Byb3BlcnR5IiwidGhpbmdBc0xvd2VyQ2FzZVNpbmd1bGFyIiwib3B0aW9uU3RyaW5nUHJvcGVydHkiLCJ0aGluZ0FzTG93ZXJDYXNlUGx1cmFsIiwib3B0aW9uc1N0cmluZ1Byb3BlcnR5IiwiYTExeUNvbnRlbnRUYWdOYW1lIiwidkJveE9wdGlvbnMiLCJzcGFjaW5nIiwidGhpbmdBc0xvd2VyQ2FzZVBsdXJhbFN0cmluZ1Byb3BlcnR5IiwidGhpbmdBc0xvd2VyQ2FzZVNpbmd1bGFyU3RyaW5nUHJvcGVydHkiLCJjcmVhdGVQYXR0ZXJuU3RyaW5nUHJvcGVydHkiLCJwcm92aWRlZFN0cmluZ1Byb3BlcnR5IiwidGhpbmdQbHVyYWwiLCJ0aGluZ1Npbmd1bGFyIiwidGFuZGVtIiwiT1BUX09VVCIsInNwYWNlS2V5Tm9kZSIsInNwYWNlIiwiZW50ZXJLZXlOb2RlIiwiZW50ZXIiLCJzcGFjZU9yRW50ZXJJY29uIiwiaWNvbk9ySWNvbiIsInBvcFVwTGlzdCIsImxhYmVsV2l0aEljb24iLCJwb3BVcExpc3RQYXR0ZXJuU3RyaW5nUHJvcGVydHkiLCJsYWJlbElubmVyQ29udGVudCIsImExMXkiLCJwb3BVcExpc3RQYXR0ZXJuRGVzY3JpcHRpb25TdHJpbmdQcm9wZXJ0eSIsIm1vdmVUaHJvdWdoIiwibW92ZVRocm91Z2hQYXR0ZXJuU3RyaW5nUHJvcGVydHkiLCJ1cERvd25BcnJvd0tleXNSb3dJY29uIiwibW92ZVRocm91Z2hQYXR0ZXJuRGVzY3JpcHRpb25TdHJpbmdQcm9wZXJ0eSIsImNob29zZU5ldyIsImNob29zZU5ld1BhdHRlcm5TdHJpbmdQcm9wZXJ0eSIsImNob29zZU5ld1BhdHRlcm5EZXNjcmlwdGlvblN0cmluZ1Byb3BlcnR5IiwiZXNjYXBlS2V5Tm9kZSIsImVzYyIsImNsb3NlV2l0aG91dENoYW5naW5nIiwiY2xvc2VXaXRob3V0Q2hhbmdpbmdTdHJpbmdQcm9wZXJ0eSIsImNsb3NlV2l0aG91dENoYW5naW5nRGVzY3JpcHRpb25TdHJpbmdQcm9wZXJ0eSIsInJvd3MiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkNvbWJvQm94S2V5Ym9hcmRIZWxwU2VjdGlvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMC0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBIZWxwIHNlY3Rpb24gZm9yIGV4cGxhaW5pbmcgaG93IHRvIHVzZSBhIGtleWJvYXJkIHRvIGludGVyYWN0IHdpdGggYSBDb21ib0JveC5cclxuICpcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBQYXR0ZXJuU3RyaW5nUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9QYXR0ZXJuU3RyaW5nUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgU3RyaW5nUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9TdHJpbmdQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUUmVhZE9ubHlQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IHNjZW5lcnlQaGV0IGZyb20gJy4uLy4uL3NjZW5lcnlQaGV0LmpzJztcclxuaW1wb3J0IFNjZW5lcnlQaGV0U3RyaW5ncyBmcm9tICcuLi8uLi9TY2VuZXJ5UGhldFN0cmluZ3MuanMnO1xyXG5pbXBvcnQgVGV4dEtleU5vZGUgZnJvbSAnLi4vVGV4dEtleU5vZGUuanMnO1xyXG5pbXBvcnQgS2V5Ym9hcmRIZWxwSWNvbkZhY3RvcnkgZnJvbSAnLi9LZXlib2FyZEhlbHBJY29uRmFjdG9yeS5qcyc7XHJcbmltcG9ydCBLZXlib2FyZEhlbHBTZWN0aW9uLCB7IEtleWJvYXJkSGVscFNlY3Rpb25PcHRpb25zIH0gZnJvbSAnLi9LZXlib2FyZEhlbHBTZWN0aW9uLmpzJztcclxuaW1wb3J0IEtleWJvYXJkSGVscFNlY3Rpb25Sb3cgZnJvbSAnLi9LZXlib2FyZEhlbHBTZWN0aW9uUm93LmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi8uLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcblxyXG4gIC8vIEhlYWRpbmcgZm9yIHRoZSBzZWN0aW9uLCBzaG91bGQgYmUgY2FwaXRhbGl6ZWQgYXMgYSB0aXRsZVxyXG4gIGhlYWRpbmdTdHJpbmc/OiBzdHJpbmcgfCBUUmVhZE9ubHlQcm9wZXJ0eTxzdHJpbmc+O1xyXG5cclxuICAvLyB0aGUgaXRlbSBiZWluZyBjaGFuZ2VkIGJ5IHRoZSBjb21ibyBib3gsIGxvd2VyIGNhc2UgYXMgdXNlZCBpbiBhIHNlbnRlbmNlXHJcbiAgdGhpbmdBc0xvd2VyQ2FzZVNpbmd1bGFyPzogc3RyaW5nIHwgVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nPjtcclxuXHJcbiAgLy8gcGx1cmFsIHZlcnNpb24gb2YgdGhpbmdBc0xvd2VyQ2FzZVNpbmd1bGFyXHJcbiAgdGhpbmdBc0xvd2VyQ2FzZVBsdXJhbD86IHN0cmluZyB8IFRSZWFkT25seVByb3BlcnR5PHN0cmluZz47XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBDb21ib0JveEtleWJvYXJkSGVscFNlY3Rpb25PcHRpb25zID0gU2VsZk9wdGlvbnMgJiBLZXlib2FyZEhlbHBTZWN0aW9uT3B0aW9ucztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbWJvQm94S2V5Ym9hcmRIZWxwU2VjdGlvbiBleHRlbmRzIEtleWJvYXJkSGVscFNlY3Rpb24ge1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHByb3ZpZGVkT3B0aW9ucz86IENvbWJvQm94S2V5Ym9hcmRIZWxwU2VjdGlvbk9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxDb21ib0JveEtleWJvYXJkSGVscFNlY3Rpb25PcHRpb25zLCBTZWxmT3B0aW9ucywgS2V5Ym9hcmRIZWxwU2VjdGlvbk9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgIC8vIFNlbGZPcHRpb25zXHJcbiAgICAgIGhlYWRpbmdTdHJpbmc6IFNjZW5lcnlQaGV0U3RyaW5ncy5rZXlib2FyZEhlbHBEaWFsb2cuY29tYm9Cb3guaGVhZGluZ1N0cmluZ1N0cmluZ1Byb3BlcnR5LFxyXG4gICAgICB0aGluZ0FzTG93ZXJDYXNlU2luZ3VsYXI6IFNjZW5lcnlQaGV0U3RyaW5ncy5rZXlib2FyZEhlbHBEaWFsb2cuY29tYm9Cb3gub3B0aW9uU3RyaW5nUHJvcGVydHksXHJcbiAgICAgIHRoaW5nQXNMb3dlckNhc2VQbHVyYWw6IFNjZW5lcnlQaGV0U3RyaW5ncy5rZXlib2FyZEhlbHBEaWFsb2cuY29tYm9Cb3gub3B0aW9uc1N0cmluZ1Byb3BlcnR5LFxyXG5cclxuICAgICAgLy8gS2V5Ym9hcmRIZWxwU2VjdGlvbk9wdGlvbnNcclxuICAgICAgYTExeUNvbnRlbnRUYWdOYW1lOiAnb2wnLCAvLyBvcmRlcmVkIGxpc3RcclxuICAgICAgdkJveE9wdGlvbnM6IHtcclxuICAgICAgICBzcGFjaW5nOiA4IC8vIEEgYml0IHRpZ2h0ZXIgc28gdGhhdCBpdCBsb29rcyBsaWtlIG9uZSBzZXQgb2YgaW5zdHJ1Y3Rpb25zXHJcbiAgICAgIH1cclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIC8vIG9wdGlvbnMgbWF5IGJlIHN0cmluZyBvciBUUmVhZE9ubHlQcm9wZXJ0eTxzdHJpbmc+LCBzbyBlbnN1cmUgdGhhdCB3ZSBoYXZlIGEgVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nPi5cclxuICAgIGNvbnN0IHRoaW5nQXNMb3dlckNhc2VQbHVyYWxTdHJpbmdQcm9wZXJ0eSA9ICggdHlwZW9mIG9wdGlvbnMudGhpbmdBc0xvd2VyQ2FzZVBsdXJhbCA9PT0gJ3N0cmluZycgKSA/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgU3RyaW5nUHJvcGVydHkoIG9wdGlvbnMudGhpbmdBc0xvd2VyQ2FzZVBsdXJhbCApIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMudGhpbmdBc0xvd2VyQ2FzZVBsdXJhbDtcclxuICAgIGNvbnN0IHRoaW5nQXNMb3dlckNhc2VTaW5ndWxhclN0cmluZ1Byb3BlcnR5ID0gKCB0eXBlb2Ygb3B0aW9ucy50aGluZ0FzTG93ZXJDYXNlU2luZ3VsYXIgPT09ICdzdHJpbmcnICkgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgU3RyaW5nUHJvcGVydHkoIG9wdGlvbnMudGhpbmdBc0xvd2VyQ2FzZVNpbmd1bGFyICkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnRoaW5nQXNMb3dlckNhc2VTaW5ndWxhcjtcclxuXHJcbiAgICAvLyBDcmVhdGUgYSBQYXR0ZXJuU3RyaW5nUHJvcGVydHkgdGhhdCBmaWxscyBpbiBhIHBsdXJhbC9zaW5ndWxhciBwYXR0ZXJuLCBhbmQgc3VwcG9ydCBkeW5hbWljIGxvY2FsZS5cclxuICAgIGNvbnN0IGNyZWF0ZVBhdHRlcm5TdHJpbmdQcm9wZXJ0eSA9ICggcHJvdmlkZWRTdHJpbmdQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nPiApID0+IHtcclxuICAgICAgcmV0dXJuIG5ldyBQYXR0ZXJuU3RyaW5nUHJvcGVydHkoXHJcbiAgICAgICAgcHJvdmlkZWRTdHJpbmdQcm9wZXJ0eSwge1xyXG4gICAgICAgICAgdGhpbmdQbHVyYWw6IHRoaW5nQXNMb3dlckNhc2VQbHVyYWxTdHJpbmdQcm9wZXJ0eSxcclxuICAgICAgICAgIHRoaW5nU2luZ3VsYXI6IHRoaW5nQXNMb3dlckNhc2VTaW5ndWxhclN0cmluZ1Byb3BlcnR5XHJcbiAgICAgICAgfSwgeyB0YW5kZW06IFRhbmRlbS5PUFRfT1VUIH0gKTtcclxuICAgIH07XHJcblxyXG4gICAgY29uc3Qgc3BhY2VLZXlOb2RlID0gVGV4dEtleU5vZGUuc3BhY2UoKTtcclxuICAgIGNvbnN0IGVudGVyS2V5Tm9kZSA9IFRleHRLZXlOb2RlLmVudGVyKCk7XHJcbiAgICBjb25zdCBzcGFjZU9yRW50ZXJJY29uID0gS2V5Ym9hcmRIZWxwSWNvbkZhY3RvcnkuaWNvbk9ySWNvbiggc3BhY2VLZXlOb2RlLCBlbnRlcktleU5vZGUgKTtcclxuXHJcbiAgICBjb25zdCBwb3BVcExpc3QgPSBLZXlib2FyZEhlbHBTZWN0aW9uUm93LmxhYmVsV2l0aEljb24oXHJcbiAgICAgIGNyZWF0ZVBhdHRlcm5TdHJpbmdQcm9wZXJ0eSggU2NlbmVyeVBoZXRTdHJpbmdzLmtleWJvYXJkSGVscERpYWxvZy5jb21ib0JveC5wb3BVcExpc3RQYXR0ZXJuU3RyaW5nUHJvcGVydHkgKSxcclxuICAgICAgc3BhY2VPckVudGVySWNvbiwge1xyXG4gICAgICAgIGxhYmVsSW5uZXJDb250ZW50OiBjcmVhdGVQYXR0ZXJuU3RyaW5nUHJvcGVydHkoIFNjZW5lcnlQaGV0U3RyaW5ncy5hMTF5LmtleWJvYXJkSGVscERpYWxvZy5jb21ib0JveC5wb3BVcExpc3RQYXR0ZXJuRGVzY3JpcHRpb25TdHJpbmdQcm9wZXJ0eSApXHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICBjb25zdCBtb3ZlVGhyb3VnaCA9IEtleWJvYXJkSGVscFNlY3Rpb25Sb3cubGFiZWxXaXRoSWNvbihcclxuICAgICAgY3JlYXRlUGF0dGVyblN0cmluZ1Byb3BlcnR5KCBTY2VuZXJ5UGhldFN0cmluZ3Mua2V5Ym9hcmRIZWxwRGlhbG9nLmNvbWJvQm94Lm1vdmVUaHJvdWdoUGF0dGVyblN0cmluZ1Byb3BlcnR5ICksXHJcbiAgICAgIEtleWJvYXJkSGVscEljb25GYWN0b3J5LnVwRG93bkFycm93S2V5c1Jvd0ljb24oKSwge1xyXG4gICAgICAgIGxhYmVsSW5uZXJDb250ZW50OiBjcmVhdGVQYXR0ZXJuU3RyaW5nUHJvcGVydHkoIFNjZW5lcnlQaGV0U3RyaW5ncy5hMTF5LmtleWJvYXJkSGVscERpYWxvZy5jb21ib0JveC5tb3ZlVGhyb3VnaFBhdHRlcm5EZXNjcmlwdGlvblN0cmluZ1Byb3BlcnR5IClcclxuICAgICAgfSApO1xyXG5cclxuICAgIGNvbnN0IGNob29zZU5ldyA9IEtleWJvYXJkSGVscFNlY3Rpb25Sb3cubGFiZWxXaXRoSWNvbihcclxuICAgICAgY3JlYXRlUGF0dGVyblN0cmluZ1Byb3BlcnR5KCBTY2VuZXJ5UGhldFN0cmluZ3Mua2V5Ym9hcmRIZWxwRGlhbG9nLmNvbWJvQm94LmNob29zZU5ld1BhdHRlcm5TdHJpbmdQcm9wZXJ0eSApLFxyXG4gICAgICBlbnRlcktleU5vZGUsIHtcclxuICAgICAgICBsYWJlbElubmVyQ29udGVudDogY3JlYXRlUGF0dGVyblN0cmluZ1Byb3BlcnR5KCBTY2VuZXJ5UGhldFN0cmluZ3MuYTExeS5rZXlib2FyZEhlbHBEaWFsb2cuY29tYm9Cb3guY2hvb3NlTmV3UGF0dGVybkRlc2NyaXB0aW9uU3RyaW5nUHJvcGVydHkgKVxyXG4gICAgICB9ICk7XHJcblxyXG4gICAgY29uc3QgZXNjYXBlS2V5Tm9kZSA9IFRleHRLZXlOb2RlLmVzYygpO1xyXG4gICAgY29uc3QgY2xvc2VXaXRob3V0Q2hhbmdpbmcgPSBLZXlib2FyZEhlbHBTZWN0aW9uUm93LmxhYmVsV2l0aEljb24oXHJcbiAgICAgIFNjZW5lcnlQaGV0U3RyaW5ncy5rZXlib2FyZEhlbHBEaWFsb2cuY29tYm9Cb3guY2xvc2VXaXRob3V0Q2hhbmdpbmdTdHJpbmdQcm9wZXJ0eSxcclxuICAgICAgZXNjYXBlS2V5Tm9kZSwge1xyXG4gICAgICAgIGxhYmVsSW5uZXJDb250ZW50OiBTY2VuZXJ5UGhldFN0cmluZ3MuYTExeS5rZXlib2FyZEhlbHBEaWFsb2cuY29tYm9Cb3guY2xvc2VXaXRob3V0Q2hhbmdpbmdEZXNjcmlwdGlvblN0cmluZ1Byb3BlcnR5XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAvLyBvcmRlciB0aGUgcm93cyBvZiBjb250ZW50XHJcbiAgICBjb25zdCByb3dzID0gWyBwb3BVcExpc3QsIG1vdmVUaHJvdWdoLCBjaG9vc2VOZXcsIGNsb3NlV2l0aG91dENoYW5naW5nIF07XHJcbiAgICBzdXBlciggb3B0aW9ucy5oZWFkaW5nU3RyaW5nLCByb3dzLCBvcHRpb25zICk7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5UGhldC5yZWdpc3RlciggJ0NvbWJvQm94S2V5Ym9hcmRIZWxwU2VjdGlvbicsIENvbWJvQm94S2V5Ym9hcmRIZWxwU2VjdGlvbiApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxxQkFBcUIsTUFBTSw4Q0FBOEM7QUFDaEYsT0FBT0MsY0FBYyxNQUFNLHVDQUF1QztBQUVsRSxPQUFPQyxTQUFTLE1BQU0sdUNBQXVDO0FBQzdELE9BQU9DLFdBQVcsTUFBTSxzQkFBc0I7QUFDOUMsT0FBT0Msa0JBQWtCLE1BQU0sNkJBQTZCO0FBQzVELE9BQU9DLFdBQVcsTUFBTSxtQkFBbUI7QUFDM0MsT0FBT0Ms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