// Copyright 2019-2023, University of Colorado Boulder

/**
 * ComboBoxDisplay is the lovechild of a ComboBox and a NumberDisplay. It allows the user to choose one of N dynamic
 * numeric values. ComboBox was designed to display static choices, so this component ensures that none of its items
 * grow wider/taller than their initial size.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
import ComboBox from '../../sun/js/ComboBox.js';
import NumberDisplay from './NumberDisplay.js';
import PhetFont from './PhetFont.js';
import sceneryPhet from './sceneryPhet.js';
import SceneryPhetStrings from './SceneryPhetStrings.js';
import StringProperty from '../../axon/js/StringProperty.js';
import PatternStringProperty from '../../axon/js/PatternStringProperty.js';
import Tandem from '../../tandem/js/Tandem.js';

// constants
const DEFAULT_FONT = new PhetFont(14);

// Describes an item in the ComboBoxDisplay

export default class ComboBoxDisplay extends ComboBox {
  /**
   * @param choiceProperty - determines which item is currently selected
   * @param items - describes the items that appear in the ComboBox
   * @param listParent - parent for the ComboBox list
   * @param providedOptions?
   */
  constructor(choiceProperty, items, listParent, providedOptions) {
    const options = optionize()({
      // SelfOptions
      numberDisplayOptions: {
        backgroundFill: null,
        backgroundStroke: null,
        textOptions: {
          font: DEFAULT_FONT
        },
        align: 'right',
        xMargin: 0,
        yMargin: 0
      },
      // ComboBoxOptions
      align: 'right' // we typically want numbers to be right aligned
    }, providedOptions);

    // Convert ComboBoxDisplayItems to ComboBoxItems
    const comboBoxItems = [];
    const valuePatternStringProperties = [];
    items.forEach(item => {
      const unitsProperty = typeof item.units === 'string' ? new StringProperty(item.units) : item.units;
      const valuePatternStringProperty = new PatternStringProperty(SceneryPhetStrings.comboBoxDisplay.valueUnitsStringProperty, {
        units: unitsProperty
      }, {
        tandem: Tandem.OPT_OUT
      });
      valuePatternStringProperties.push(valuePatternStringProperty);
      const itemNode = new NumberDisplay(item.numberProperty, item.range, combineOptions({
        valuePattern: valuePatternStringProperty
      }, options.numberDisplayOptions, item.numberDisplayOptions));

      // Don't allow the NumberDisplay to grow, since it's in a ComboBox
      itemNode.maxWidth = itemNode.width;
      itemNode.maxHeight = itemNode.height;
      comboBoxItems.push({
        value: item.choice,
        createNode: () => itemNode,
        tandemName: item.tandemName
      });
    });
    super(choiceProperty, comboBoxItems, listParent, options);
    this.disposeComboBoxDisplay = () => {
      valuePatternStringProperties.forEach(property => property.dispose());
    };
  }
  dispose() {
    this.disposeComboBoxDisplay();
    super.dispose();
  }
}
sceneryPhet.register('ComboBoxDisplay', ComboBoxDisplay);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJvcHRpb25pemUiLCJjb21iaW5lT3B0aW9ucyIsIkNvbWJvQm94IiwiTnVtYmVyRGlzcGxheSIsIlBoZXRGb250Iiwic2NlbmVyeVBoZXQiLCJTY2VuZXJ5UGhldFN0cmluZ3MiLCJTdHJpbmdQcm9wZXJ0eSIsIlBhdHRlcm5TdHJpbmdQcm9wZXJ0eSIsIlRhbmRlbSIsIkRFRkFVTFRfRk9OVCIsIkNvbWJvQm94RGlzcGxheSIsImNvbnN0cnVjdG9yIiwiY2hvaWNlUHJvcGVydHkiLCJpdGVtcyIsImxpc3RQYXJlbnQiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwibnVtYmVyRGlzcGxheU9wdGlvbnMiLCJiYWNrZ3JvdW5kRmlsbCIsImJhY2tncm91bmRTdHJva2UiLCJ0ZXh0T3B0aW9ucyIsImZvbnQiLCJhbGlnbiIsInhNYXJnaW4iLCJ5TWFyZ2luIiwiY29tYm9Cb3hJdGVtcyIsInZhbHVlUGF0dGVyblN0cmluZ1Byb3BlcnRpZXMiLCJmb3JFYWNoIiwiaXRlbSIsInVuaXRzUHJvcGVydHkiLCJ1bml0cyIsInZhbHVlUGF0dGVyblN0cmluZ1Byb3BlcnR5IiwiY29tYm9Cb3hEaXNwbGF5IiwidmFsdWVVbml0c1N0cmluZ1Byb3BlcnR5IiwidGFuZGVtIiwiT1BUX09VVCIsInB1c2giLCJpdGVtTm9kZSIsIm51bWJlclByb3BlcnR5IiwicmFuZ2UiLCJ2YWx1ZVBhdHRlcm4iLCJtYXhXaWR0aCIsIndpZHRoIiwibWF4SGVpZ2h0IiwiaGVpZ2h0IiwidmFsdWUiLCJjaG9pY2UiLCJjcmVhdGVOb2RlIiwidGFuZGVtTmFtZSIsImRpc3Bvc2VDb21ib0JveERpc3BsYXkiLCJwcm9wZXJ0eSIsImRpc3Bvc2UiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkNvbWJvQm94RGlzcGxheS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOS0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBDb21ib0JveERpc3BsYXkgaXMgdGhlIGxvdmVjaGlsZCBvZiBhIENvbWJvQm94IGFuZCBhIE51bWJlckRpc3BsYXkuIEl0IGFsbG93cyB0aGUgdXNlciB0byBjaG9vc2Ugb25lIG9mIE4gZHluYW1pY1xyXG4gKiBudW1lcmljIHZhbHVlcy4gQ29tYm9Cb3ggd2FzIGRlc2lnbmVkIHRvIGRpc3BsYXkgc3RhdGljIGNob2ljZXMsIHNvIHRoaXMgY29tcG9uZW50IGVuc3VyZXMgdGhhdCBub25lIG9mIGl0cyBpdGVtc1xyXG4gKiBncm93IHdpZGVyL3RhbGxlciB0aGFuIHRoZWlyIGluaXRpYWwgc2l6ZS5cclxuICpcclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICovXHJcblxyXG5pbXBvcnQgUmFuZ2UgZnJvbSAnLi4vLi4vZG90L2pzL1JhbmdlLmpzJztcclxuaW1wb3J0IFN0cmljdE9taXQgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1N0cmljdE9taXQuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplLCB7IGNvbWJpbmVPcHRpb25zIH0gZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCB7IE5vZGUgfSBmcm9tICcuLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgQ29tYm9Cb3gsIHsgQ29tYm9Cb3hJdGVtLCBDb21ib0JveE9wdGlvbnMgfSBmcm9tICcuLi8uLi9zdW4vanMvQ29tYm9Cb3guanMnO1xyXG5pbXBvcnQgTnVtYmVyRGlzcGxheSwgeyBOdW1iZXJEaXNwbGF5T3B0aW9ucyB9IGZyb20gJy4vTnVtYmVyRGlzcGxheS5qcyc7XHJcbmltcG9ydCBQaGV0Rm9udCBmcm9tICcuL1BoZXRGb250LmpzJztcclxuaW1wb3J0IHNjZW5lcnlQaGV0IGZyb20gJy4vc2NlbmVyeVBoZXQuanMnO1xyXG5pbXBvcnQgU2NlbmVyeVBoZXRTdHJpbmdzIGZyb20gJy4vU2NlbmVyeVBoZXRTdHJpbmdzLmpzJztcclxuaW1wb3J0IFByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBTdHJpbmdQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1N0cmluZ1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IFBhdHRlcm5TdHJpbmdQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1BhdHRlcm5TdHJpbmdQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgREVGQVVMVF9GT05UID0gbmV3IFBoZXRGb250KCAxNCApO1xyXG5cclxudHlwZSBTdWJzZXRPZk51bWJlckRpc3BsYXlPcHRpb25zID0gU3RyaWN0T21pdDxOdW1iZXJEaXNwbGF5T3B0aW9ucywgJ3ZhbHVlUGF0dGVybic+O1xyXG5cclxuLy8gRGVzY3JpYmVzIGFuIGl0ZW0gaW4gdGhlIENvbWJvQm94RGlzcGxheVxyXG5leHBvcnQgdHlwZSBDb21ib0JveERpc3BsYXlJdGVtPFQ+ID0ge1xyXG5cclxuICAvLyBhIHZhbHVlIG9mIGNob2ljZVByb3BlcnR5IHRoYXQgY29ycmVzcG9uZHMgdG8gdGhlIGl0ZW1cclxuICBjaG9pY2U6IFQ7XHJcblxyXG4gIC8vIHRoZSBpdGVtJ3MgbnVtZXJpYyB2YWx1ZVxyXG4gIG51bWJlclByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxudW1iZXIgfCBudWxsPjtcclxuXHJcbiAgLy8gdGhlIHJhbmdlIG9mIHRoZSBpdGVtJ3MgbnVtZXJpYyB2YWx1ZVxyXG4gIHJhbmdlOiBSYW5nZTtcclxuXHJcbiAgLy8gdGhlIHVuaXRzIHVzZWQgdG8gbGFiZWwgdGhlIGl0ZW0ncyBudW1lcmljIHZhbHVlXHJcbiAgdW5pdHM6IHN0cmluZyB8IFRSZWFkT25seVByb3BlcnR5PHN0cmluZz47XHJcblxyXG4gIC8vIG9wdGlvbnMgcGFzc2VkIHRvIHRoaXMgaXRlbSdzIE51bWJlckRpc3BsYXksIHRoZXNlIG92ZXJyaWRlIENvbWJvQm94RGlzcGxheU9wdGlvbnMubnVtYmVyRGlzcGxheU9wdGlvbnNcclxuICBudW1iZXJEaXNwbGF5T3B0aW9ucz86IFN1YnNldE9mTnVtYmVyRGlzcGxheU9wdGlvbnM7XHJcblxyXG4gIC8vIHRhbmRlbSBuYW1lIGZvciB0aGUgaXRlbVxyXG4gIHRhbmRlbU5hbWU/OiBzdHJpbmc7XHJcbn07XHJcblxyXG50eXBlIFNlbGZPcHRpb25zID0ge1xyXG5cclxuICAvLyBwcm9wYWdhdGVkIHRvIGFsbCBOdW1iZXJEaXNwbGF5IHN1YmNvbXBvbmVudHMsIHdpbGwgYmUgb3ZlcnJpZGRlbiBieSBDb21ib0JveERpc3BsYXlJdGVtLm51bWJlckRpc3BsYXlPcHRpb25zXHJcbiAgbnVtYmVyRGlzcGxheU9wdGlvbnM/OiBTdWJzZXRPZk51bWJlckRpc3BsYXlPcHRpb25zO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgQ29tYm9Cb3hEaXNwbGF5T3B0aW9ucyA9IFNlbGZPcHRpb25zICYgQ29tYm9Cb3hPcHRpb25zO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29tYm9Cb3hEaXNwbGF5PFQ+IGV4dGVuZHMgQ29tYm9Cb3g8VD4ge1xyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IGRpc3Bvc2VDb21ib0JveERpc3BsYXk6ICgpID0+IHZvaWQ7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBjaG9pY2VQcm9wZXJ0eSAtIGRldGVybWluZXMgd2hpY2ggaXRlbSBpcyBjdXJyZW50bHkgc2VsZWN0ZWRcclxuICAgKiBAcGFyYW0gaXRlbXMgLSBkZXNjcmliZXMgdGhlIGl0ZW1zIHRoYXQgYXBwZWFyIGluIHRoZSBDb21ib0JveFxyXG4gICAqIEBwYXJhbSBsaXN0UGFyZW50IC0gcGFyZW50IGZvciB0aGUgQ29tYm9Cb3ggbGlzdFxyXG4gICAqIEBwYXJhbSBwcm92aWRlZE9wdGlvbnM/XHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBjaG9pY2VQcm9wZXJ0eTogUHJvcGVydHk8VD4sIGl0ZW1zOiBDb21ib0JveERpc3BsYXlJdGVtPFQ+W10sIGxpc3RQYXJlbnQ6IE5vZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICBwcm92aWRlZE9wdGlvbnM/OiBDb21ib0JveERpc3BsYXlPcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8Q29tYm9Cb3hEaXNwbGF5T3B0aW9ucywgU2VsZk9wdGlvbnMsIENvbWJvQm94T3B0aW9ucz4oKSgge1xyXG5cclxuICAgICAgLy8gU2VsZk9wdGlvbnNcclxuICAgICAgbnVtYmVyRGlzcGxheU9wdGlvbnM6IHtcclxuICAgICAgICBiYWNrZ3JvdW5kRmlsbDogbnVsbCxcclxuICAgICAgICBiYWNrZ3JvdW5kU3Ryb2tlOiBudWxsLFxyXG4gICAgICAgIHRleHRPcHRpb25zOiB7XHJcbiAgICAgICAgICBmb250OiBERUZBVUxUX0ZPTlRcclxuICAgICAgICB9LFxyXG4gICAgICAgIGFsaWduOiAncmlnaHQnLFxyXG4gICAgICAgIHhNYXJnaW46IDAsXHJcbiAgICAgICAgeU1hcmdpbjogMFxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gQ29tYm9Cb3hPcHRpb25zXHJcbiAgICAgIGFsaWduOiAncmlnaHQnIC8vIHdlIHR5cGljYWxseSB3YW50IG51bWJlcnMgdG8gYmUgcmlnaHQgYWxpZ25lZFxyXG5cclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIC8vIENvbnZlcnQgQ29tYm9Cb3hEaXNwbGF5SXRlbXMgdG8gQ29tYm9Cb3hJdGVtc1xyXG4gICAgY29uc3QgY29tYm9Cb3hJdGVtczogQ29tYm9Cb3hJdGVtPFQ+W10gPSBbXTtcclxuICAgIGNvbnN0IHZhbHVlUGF0dGVyblN0cmluZ1Byb3BlcnRpZXM6IFRSZWFkT25seVByb3BlcnR5PHN0cmluZz5bXSA9IFtdO1xyXG4gICAgaXRlbXMuZm9yRWFjaCggaXRlbSA9PiB7XHJcblxyXG4gICAgICBjb25zdCB1bml0c1Byb3BlcnR5ID0gKCB0eXBlb2YgaXRlbS51bml0cyA9PT0gJ3N0cmluZycgKSA/IG5ldyBTdHJpbmdQcm9wZXJ0eSggaXRlbS51bml0cyApIDogaXRlbS51bml0cztcclxuICAgICAgY29uc3QgdmFsdWVQYXR0ZXJuU3RyaW5nUHJvcGVydHkgPSBuZXcgUGF0dGVyblN0cmluZ1Byb3BlcnR5KCBTY2VuZXJ5UGhldFN0cmluZ3MuY29tYm9Cb3hEaXNwbGF5LnZhbHVlVW5pdHNTdHJpbmdQcm9wZXJ0eSwge1xyXG4gICAgICAgIHVuaXRzOiB1bml0c1Byb3BlcnR5XHJcbiAgICAgIH0sIHsgdGFuZGVtOiBUYW5kZW0uT1BUX09VVCB9ICk7XHJcbiAgICAgIHZhbHVlUGF0dGVyblN0cmluZ1Byb3BlcnRpZXMucHVzaCggdmFsdWVQYXR0ZXJuU3RyaW5nUHJvcGVydHkgKTtcclxuXHJcbiAgICAgIGNvbnN0IGl0ZW1Ob2RlID0gbmV3IE51bWJlckRpc3BsYXkoIGl0ZW0ubnVtYmVyUHJvcGVydHksIGl0ZW0ucmFuZ2UsXHJcbiAgICAgICAgY29tYmluZU9wdGlvbnM8TnVtYmVyRGlzcGxheU9wdGlvbnM+KCB7XHJcbiAgICAgICAgICB2YWx1ZVBhdHRlcm46IHZhbHVlUGF0dGVyblN0cmluZ1Byb3BlcnR5XHJcbiAgICAgICAgfSwgb3B0aW9ucy5udW1iZXJEaXNwbGF5T3B0aW9ucywgaXRlbS5udW1iZXJEaXNwbGF5T3B0aW9ucyApXHJcbiAgICAgICk7XHJcblxyXG4gICAgICAvLyBEb24ndCBhbGxvdyB0aGUgTnVtYmVyRGlzcGxheSB0byBncm93LCBzaW5jZSBpdCdzIGluIGEgQ29tYm9Cb3hcclxuICAgICAgaXRlbU5vZGUubWF4V2lkdGggPSBpdGVtTm9kZS53aWR0aDtcclxuICAgICAgaXRlbU5vZGUubWF4SGVpZ2h0ID0gaXRlbU5vZGUuaGVpZ2h0O1xyXG5cclxuICAgICAgY29tYm9Cb3hJdGVtcy5wdXNoKCB7XHJcbiAgICAgICAgdmFsdWU6IGl0ZW0uY2hvaWNlLFxyXG4gICAgICAgIGNyZWF0ZU5vZGU6ICgpID0+IGl0ZW1Ob2RlLFxyXG4gICAgICAgIHRhbmRlbU5hbWU6IGl0ZW0udGFuZGVtTmFtZVxyXG4gICAgICB9ICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgc3VwZXIoIGNob2ljZVByb3BlcnR5LCBjb21ib0JveEl0ZW1zLCBsaXN0UGFyZW50LCBvcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy5kaXNwb3NlQ29tYm9Cb3hEaXNwbGF5ID0gKCkgPT4ge1xyXG4gICAgICB2YWx1ZVBhdHRlcm5TdHJpbmdQcm9wZXJ0aWVzLmZvckVhY2goIHByb3BlcnR5ID0+IHByb3BlcnR5LmRpc3Bvc2UoKSApO1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5kaXNwb3NlQ29tYm9Cb3hEaXNwbGF5KCk7XHJcbiAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5UGhldC5yZWdpc3RlciggJ0NvbWJvQm94RGlzcGxheScsIENvbWJvQm94RGlzcGxheSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBSUEsT0FBT0EsU0FBUyxJQUFJQyxjQUFjLFFBQVEsaUNBQWlDO0FBRTNFLE9BQU9DLFFBQVEsTUFBeUMsMEJBQTBCO0FBQ2xGLE9BQU9DLGFBQWEsTUFBZ0Msb0JBQW9CO0FBQ3hFLE9BQU9DLFFBQVEsTUFBTSxlQUFlO0FBQ3BDLE9BQU9DLFdBQVcsTUFBTSxrQkFBa0I7QUFDMUMsT0FBT0Msa0JBQWtCLE1BQU0seUJBQXlCO0FBR3hELE9BQU9DLGNBQWMsTUFBTSxpQ0FBaUM7QUFDNUQsT0FBT0MscUJBQXFCLE1BQU0sd0NBQXdDO0FBQzFFLE9BQU9DLE1BQU0s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