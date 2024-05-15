// Copyright 2019-2023, University of Colorado Boulder

/**
 * VectorValuesToggleBox is the toggle box at the top of the screen. It displays the active vector's magnitude,
 * angle, x component, and y component.
 *
 * 'Is a' relationship with ToggleBox
 *    - when closed, displays 'Vector Values'
 *    - when open either displays 'select a vector' or the active vector's attributes
 *      (a series of labels and VectorValuesNumberDisplays)
 *
 * This panel exists for the entire sim and is never disposed.
 *
 * @author Martin Veillette
 * @author Brandon Li
 */

import Bounds2 from '../../../../dot/js/Bounds2.js';
import MathSymbols from '../../../../scenery-phet/js/MathSymbols.js';
import { AlignBox, HBox, Node, Text } from '../../../../scenery/js/imports.js';
import vectorAddition from '../../vectorAddition.js';
import VectorAdditionStrings from '../../VectorAdditionStrings.js';
import VectorAdditionConstants from '../VectorAdditionConstants.js';
import ToggleBox from './ToggleBox.js';
import VectorQuantities from './VectorQuantities.js';
import VectorSymbolNode from './VectorSymbolNode.js';
import VectorValuesNumberDisplay from './VectorValuesNumberDisplay.js';
import optionize from '../../../../phet-core/js/optionize.js';
import EquationsVector from '../../equations/model/EquationsVector.js';

//----------------------------------------------------------------------------------------
// constants

// margin from the label to the number label (ltr)
const LABEL_RIGHT_MARGIN = 7;

// margin from the number display to the label (ltr)
const LABEL_LEFT_MARGIN = 17;

// width of the magnitude label
const MAGNITUDE_LABEL_WIDTH = 50;

// width of the angle label
const ANGLE_LABEL_WIDTH = 15;

// width of the component labels
const COMPONENT_LABEL_WIDTH = 35;
export default class VectorValuesToggleBox extends ToggleBox {
  constructor(graph, providedOptions) {
    const options = optionize()({
      // ToggleBoxOptions
      contentFixedWidth: 500,
      contentFixedHeight: 45,
      isDisposable: false
    }, providedOptions);
    const contentFixedHeight = options.contentFixedHeight;
    assert && assert(contentFixedHeight !== null);

    //----------------------------------------------------------------------------------------
    // Create the scenery node for when the panel is closed, which is the inspectVectorText
    const inspectVectorText = new Text(VectorAdditionStrings.vectorValues, {
      font: VectorAdditionConstants.TITLE_FONT
    });

    //----------------------------------------------------------------------------------------
    // Create the scenery nodes for when the panel is open

    // Text for when there isn't a vector that is active
    const selectVectorText = new Text(VectorAdditionStrings.noVectorSelected, {
      font: VectorAdditionConstants.TITLE_FONT
    });

    // Container for the labels and number displays that display the vector's attributes
    const vectorAttributesContainer = new HBox({
      spacing: LABEL_LEFT_MARGIN
    });

    // Create the content container for the open content
    const panelOpenContent = new Node();
    panelOpenContent.setChildren([selectVectorText, vectorAttributesContainer]);

    //----------------------------------------------------------------------------------------
    // Create the scenery nodes to display the vector. Each attribute has a label and a VectorValuesNumberDisplay
    //----------------------------------------------------------------------------------------

    const magnitudeDisplayNode = new VectorSymbolNode({
      includeAbsoluteValueBars: true
    });
    const magnitudeNumberDisplay = new VectorValuesNumberDisplay(graph, VectorQuantities.MAGNITUDE);
    const angleText = new Text(MathSymbols.THETA, {
      font: VectorAdditionConstants.EQUATION_SYMBOL_FONT
    });
    const angleNumberDisplay = new VectorValuesNumberDisplay(graph, VectorQuantities.ANGLE);
    const xComponentText = new VectorSymbolNode({
      showVectorArrow: false
    });
    const xComponentNumberDisplay = new VectorValuesNumberDisplay(graph, VectorQuantities.X_COMPONENT);
    const yComponentText = new VectorSymbolNode({
      showVectorArrow: false
    });
    const yComponentNumberDisplay = new VectorValuesNumberDisplay(graph, VectorQuantities.Y_COMPONENT);

    //----------------------------------------------------------------------------------------
    // Add the new scenery nodes
    //----------------------------------------------------------------------------------------

    // Function that adds a label and display container combo, putting the label in a fixed sized AlignBox
    const addNumberDisplayAndLabel = (label, numberDisplay, labelWidth) => {
      // Align the label in a AlignBox to set a fixed width
      const fixedWidthLabel = new AlignBox(label, {
        xAlign: 'right',
        yAlign: 'center',
        alignBounds: new Bounds2(0, 0, labelWidth, contentFixedHeight),
        maxWidth: labelWidth
      });
      label.maxWidth = labelWidth;
      vectorAttributesContainer.addChild(new HBox({
        spacing: LABEL_RIGHT_MARGIN,
        children: [fixedWidthLabel, numberDisplay]
      }));
    };
    addNumberDisplayAndLabel(magnitudeDisplayNode, magnitudeNumberDisplay, MAGNITUDE_LABEL_WIDTH);
    addNumberDisplayAndLabel(angleText, angleNumberDisplay, ANGLE_LABEL_WIDTH);
    addNumberDisplayAndLabel(xComponentText, xComponentNumberDisplay, COMPONENT_LABEL_WIDTH);
    addNumberDisplayAndLabel(yComponentText, yComponentNumberDisplay, COMPONENT_LABEL_WIDTH);

    //----------------------------------------------------------------------------------------

    const updateCoefficient = coefficient => {
      magnitudeDisplayNode.setCoefficient(coefficient);
      xComponentText.setCoefficient(coefficient);
      yComponentText.setCoefficient(coefficient);
    };

    // Observe changes to when the graphs active vector Property changes to update the panel.
    // unlink is unnecessary, exists for the lifetime of the sim.
    graph.activeVectorProperty.link((activeVector, oldActiveVector) => {
      if (activeVector !== null) {
        vectorAttributesContainer.visible = true;
        selectVectorText.visible = false;

        // Get the vector symbol
        const vectorSymbol = activeVector.symbol ? activeVector.symbol : activeVector.fallBackSymbol;

        // Update labels (angle label is the same)
        magnitudeDisplayNode.setSymbol(vectorSymbol);
        xComponentText.setSymbol(`${vectorSymbol}<sub>${VectorAdditionStrings.symbol.x}</sub>`);
        yComponentText.setSymbol(`${vectorSymbol}<sub>${VectorAdditionStrings.symbol.y}</sub>`);
      } else {
        vectorAttributesContainer.visible = false;
        selectVectorText.visible = true;
      }
      selectVectorText.centerY = panelOpenContent.centerY;
      vectorAttributesContainer.centerY = panelOpenContent.centerY;
      if (activeVector && activeVector instanceof EquationsVector) {
        activeVector.coefficientProperty.link(updateCoefficient); // unlink required when active vector changes
      }
      if (oldActiveVector && oldActiveVector instanceof EquationsVector) {
        oldActiveVector.coefficientProperty.unlink(updateCoefficient);
        // reset
        updateCoefficient(activeVector && activeVector instanceof EquationsVector ? activeVector.coefficientProperty.value : 1);
      }
    });
    selectVectorText.centerY = panelOpenContent.centerY;
    vectorAttributesContainer.centerY = panelOpenContent.centerY;

    //----------------------------------------------------------------------------------------
    // Create the inspect a vector panel
    //----------------------------------------------------------------------------------------

    super(inspectVectorText, panelOpenContent, options);
  }
}
vectorAddition.register('VectorValuesToggleBox', VectorValuesToggleBox);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb3VuZHMyIiwiTWF0aFN5bWJvbHMiLCJBbGlnbkJveCIsIkhCb3giLCJOb2RlIiwiVGV4dCIsInZlY3RvckFkZGl0aW9uIiwiVmVjdG9yQWRkaXRpb25TdHJpbmdzIiwiVmVjdG9yQWRkaXRpb25Db25zdGFudHMiLCJUb2dnbGVCb3giLCJWZWN0b3JRdWFudGl0aWVzIiwiVmVjdG9yU3ltYm9sTm9kZSIsIlZlY3RvclZhbHVlc051bWJlckRpc3BsYXkiLCJvcHRpb25pemUiLCJFcXVhdGlvbnNWZWN0b3IiLCJMQUJFTF9SSUdIVF9NQVJHSU4iLCJMQUJFTF9MRUZUX01BUkdJTiIsIk1BR05JVFVERV9MQUJFTF9XSURUSCIsIkFOR0xFX0xBQkVMX1dJRFRIIiwiQ09NUE9ORU5UX0xBQkVMX1dJRFRIIiwiVmVjdG9yVmFsdWVzVG9nZ2xlQm94IiwiY29uc3RydWN0b3IiLCJncmFwaCIsInByb3ZpZGVkT3B0aW9ucyIsIm9wdGlvbnMiLCJjb250ZW50Rml4ZWRXaWR0aCIsImNvbnRlbnRGaXhlZEhlaWdodCIsImlzRGlzcG9zYWJsZSIsImFzc2VydCIsImluc3BlY3RWZWN0b3JUZXh0IiwidmVjdG9yVmFsdWVzIiwiZm9udCIsIlRJVExFX0ZPTlQiLCJzZWxlY3RWZWN0b3JUZXh0Iiwibm9WZWN0b3JTZWxlY3RlZCIsInZlY3RvckF0dHJpYnV0ZXNDb250YWluZXIiLCJzcGFjaW5nIiwicGFuZWxPcGVuQ29udGVudCIsInNldENoaWxkcmVuIiwibWFnbml0dWRlRGlzcGxheU5vZGUiLCJpbmNsdWRlQWJzb2x1dGVWYWx1ZUJhcnMiLCJtYWduaXR1ZGVOdW1iZXJEaXNwbGF5IiwiTUFHTklUVURFIiwiYW5nbGVUZXh0IiwiVEhFVEEiLCJFUVVBVElPTl9TWU1CT0xfRk9OVCIsImFuZ2xlTnVtYmVyRGlzcGxheSIsIkFOR0xFIiwieENvbXBvbmVudFRleHQiLCJzaG93VmVjdG9yQXJyb3ciLCJ4Q29tcG9uZW50TnVtYmVyRGlzcGxheSIsIlhfQ09NUE9ORU5UIiwieUNvbXBvbmVudFRleHQiLCJ5Q29tcG9uZW50TnVtYmVyRGlzcGxheSIsIllfQ09NUE9ORU5UIiwiYWRkTnVtYmVyRGlzcGxheUFuZExhYmVsIiwibGFiZWwiLCJudW1iZXJEaXNwbGF5IiwibGFiZWxXaWR0aCIsImZpeGVkV2lkdGhMYWJlbCIsInhBbGlnbiIsInlBbGlnbiIsImFsaWduQm91bmRzIiwibWF4V2lkdGgiLCJhZGRDaGlsZCIsImNoaWxkcmVuIiwidXBkYXRlQ29lZmZpY2llbnQiLCJjb2VmZmljaWVudCIsInNldENvZWZmaWNpZW50IiwiYWN0aXZlVmVjdG9yUHJvcGVydHkiLCJsaW5rIiwiYWN0aXZlVmVjdG9yIiwib2xkQWN0aXZlVmVjdG9yIiwidmlzaWJsZSIsInZlY3RvclN5bWJvbCIsInN5bWJvbCIsImZhbGxCYWNrU3ltYm9sIiwic2V0U3ltYm9sIiwieCIsInkiLCJjZW50ZXJZIiwiY29lZmZpY2llbnRQcm9wZXJ0eSIsInVubGluayIsInZhbHVlIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJWZWN0b3JWYWx1ZXNUb2dnbGVCb3gudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVmVjdG9yVmFsdWVzVG9nZ2xlQm94IGlzIHRoZSB0b2dnbGUgYm94IGF0IHRoZSB0b3Agb2YgdGhlIHNjcmVlbi4gSXQgZGlzcGxheXMgdGhlIGFjdGl2ZSB2ZWN0b3IncyBtYWduaXR1ZGUsXHJcbiAqIGFuZ2xlLCB4IGNvbXBvbmVudCwgYW5kIHkgY29tcG9uZW50LlxyXG4gKlxyXG4gKiAnSXMgYScgcmVsYXRpb25zaGlwIHdpdGggVG9nZ2xlQm94XHJcbiAqICAgIC0gd2hlbiBjbG9zZWQsIGRpc3BsYXlzICdWZWN0b3IgVmFsdWVzJ1xyXG4gKiAgICAtIHdoZW4gb3BlbiBlaXRoZXIgZGlzcGxheXMgJ3NlbGVjdCBhIHZlY3Rvcicgb3IgdGhlIGFjdGl2ZSB2ZWN0b3IncyBhdHRyaWJ1dGVzXHJcbiAqICAgICAgKGEgc2VyaWVzIG9mIGxhYmVscyBhbmQgVmVjdG9yVmFsdWVzTnVtYmVyRGlzcGxheXMpXHJcbiAqXHJcbiAqIFRoaXMgcGFuZWwgZXhpc3RzIGZvciB0aGUgZW50aXJlIHNpbSBhbmQgaXMgbmV2ZXIgZGlzcG9zZWQuXHJcbiAqXHJcbiAqIEBhdXRob3IgTWFydGluIFZlaWxsZXR0ZVxyXG4gKiBAYXV0aG9yIEJyYW5kb24gTGlcclxuICovXHJcblxyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBNYXRoU3ltYm9scyBmcm9tICcuLi8uLi8uLi8uLi9zY2VuZXJ5LXBoZXQvanMvTWF0aFN5bWJvbHMuanMnO1xyXG5pbXBvcnQgeyBBbGlnbkJveCwgSEJveCwgTm9kZSwgVGV4dCB9IGZyb20gJy4uLy4uLy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCB2ZWN0b3JBZGRpdGlvbiBmcm9tICcuLi8uLi92ZWN0b3JBZGRpdGlvbi5qcyc7XHJcbmltcG9ydCBWZWN0b3JBZGRpdGlvblN0cmluZ3MgZnJvbSAnLi4vLi4vVmVjdG9yQWRkaXRpb25TdHJpbmdzLmpzJztcclxuaW1wb3J0IEdyYXBoIGZyb20gJy4uL21vZGVsL0dyYXBoLmpzJztcclxuaW1wb3J0IFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzIGZyb20gJy4uL1ZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLmpzJztcclxuaW1wb3J0IFRvZ2dsZUJveCwgeyBUb2dnbGVCb3hPcHRpb25zIH0gZnJvbSAnLi9Ub2dnbGVCb3guanMnO1xyXG5pbXBvcnQgVmVjdG9yUXVhbnRpdGllcyBmcm9tICcuL1ZlY3RvclF1YW50aXRpZXMuanMnO1xyXG5pbXBvcnQgVmVjdG9yU3ltYm9sTm9kZSBmcm9tICcuL1ZlY3RvclN5bWJvbE5vZGUuanMnO1xyXG5pbXBvcnQgVmVjdG9yVmFsdWVzTnVtYmVyRGlzcGxheSBmcm9tICcuL1ZlY3RvclZhbHVlc051bWJlckRpc3BsYXkuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplLCB7IEVtcHR5U2VsZk9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IE51bWJlckRpc3BsYXkgZnJvbSAnLi4vLi4vLi4vLi4vc2NlbmVyeS1waGV0L2pzL051bWJlckRpc3BsYXkuanMnO1xyXG5pbXBvcnQgRXF1YXRpb25zVmVjdG9yIGZyb20gJy4uLy4uL2VxdWF0aW9ucy9tb2RlbC9FcXVhdGlvbnNWZWN0b3IuanMnO1xyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8vIGNvbnN0YW50c1xyXG5cclxuLy8gbWFyZ2luIGZyb20gdGhlIGxhYmVsIHRvIHRoZSBudW1iZXIgbGFiZWwgKGx0cilcclxuY29uc3QgTEFCRUxfUklHSFRfTUFSR0lOID0gNztcclxuXHJcbi8vIG1hcmdpbiBmcm9tIHRoZSBudW1iZXIgZGlzcGxheSB0byB0aGUgbGFiZWwgKGx0cilcclxuY29uc3QgTEFCRUxfTEVGVF9NQVJHSU4gPSAxNztcclxuXHJcbi8vIHdpZHRoIG9mIHRoZSBtYWduaXR1ZGUgbGFiZWxcclxuY29uc3QgTUFHTklUVURFX0xBQkVMX1dJRFRIID0gNTA7XHJcblxyXG4vLyB3aWR0aCBvZiB0aGUgYW5nbGUgbGFiZWxcclxuY29uc3QgQU5HTEVfTEFCRUxfV0lEVEggPSAxNTtcclxuXHJcbi8vIHdpZHRoIG9mIHRoZSBjb21wb25lbnQgbGFiZWxzXHJcbmNvbnN0IENPTVBPTkVOVF9MQUJFTF9XSURUSCA9IDM1O1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IEVtcHR5U2VsZk9wdGlvbnM7XHJcblxyXG50eXBlIFZlY3RvclZhbHVlc1RvZ2dsZUJveE9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIFRvZ2dsZUJveE9wdGlvbnM7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWZWN0b3JWYWx1ZXNUb2dnbGVCb3ggZXh0ZW5kcyBUb2dnbGVCb3gge1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIGdyYXBoOiBHcmFwaCwgcHJvdmlkZWRPcHRpb25zPzogVmVjdG9yVmFsdWVzVG9nZ2xlQm94T3B0aW9ucyApIHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPFZlY3RvclZhbHVlc1RvZ2dsZUJveE9wdGlvbnMsIFNlbGZPcHRpb25zLCBUb2dnbGVCb3hPcHRpb25zPigpKCB7XHJcblxyXG4gICAgICAvLyBUb2dnbGVCb3hPcHRpb25zXHJcbiAgICAgIGNvbnRlbnRGaXhlZFdpZHRoOiA1MDAsXHJcbiAgICAgIGNvbnRlbnRGaXhlZEhlaWdodDogNDUsXHJcbiAgICAgIGlzRGlzcG9zYWJsZTogZmFsc2VcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIGNvbnN0IGNvbnRlbnRGaXhlZEhlaWdodCA9IG9wdGlvbnMuY29udGVudEZpeGVkSGVpZ2h0ITtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGNvbnRlbnRGaXhlZEhlaWdodCAhPT0gbnVsbCApO1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gQ3JlYXRlIHRoZSBzY2VuZXJ5IG5vZGUgZm9yIHdoZW4gdGhlIHBhbmVsIGlzIGNsb3NlZCwgd2hpY2ggaXMgdGhlIGluc3BlY3RWZWN0b3JUZXh0XHJcbiAgICBjb25zdCBpbnNwZWN0VmVjdG9yVGV4dCA9IG5ldyBUZXh0KCBWZWN0b3JBZGRpdGlvblN0cmluZ3MudmVjdG9yVmFsdWVzLCB7XHJcbiAgICAgIGZvbnQ6IFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLlRJVExFX0ZPTlRcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIENyZWF0ZSB0aGUgc2NlbmVyeSBub2RlcyBmb3Igd2hlbiB0aGUgcGFuZWwgaXMgb3BlblxyXG5cclxuICAgIC8vIFRleHQgZm9yIHdoZW4gdGhlcmUgaXNuJ3QgYSB2ZWN0b3IgdGhhdCBpcyBhY3RpdmVcclxuICAgIGNvbnN0IHNlbGVjdFZlY3RvclRleHQgPSBuZXcgVGV4dCggVmVjdG9yQWRkaXRpb25TdHJpbmdzLm5vVmVjdG9yU2VsZWN0ZWQsIHtcclxuICAgICAgZm9udDogVmVjdG9yQWRkaXRpb25Db25zdGFudHMuVElUTEVfRk9OVFxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIENvbnRhaW5lciBmb3IgdGhlIGxhYmVscyBhbmQgbnVtYmVyIGRpc3BsYXlzIHRoYXQgZGlzcGxheSB0aGUgdmVjdG9yJ3MgYXR0cmlidXRlc1xyXG4gICAgY29uc3QgdmVjdG9yQXR0cmlidXRlc0NvbnRhaW5lciA9IG5ldyBIQm94KCB7IHNwYWNpbmc6IExBQkVMX0xFRlRfTUFSR0lOIH0gKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgdGhlIGNvbnRlbnQgY29udGFpbmVyIGZvciB0aGUgb3BlbiBjb250ZW50XHJcbiAgICBjb25zdCBwYW5lbE9wZW5Db250ZW50ID0gbmV3IE5vZGUoKTtcclxuICAgIHBhbmVsT3BlbkNvbnRlbnQuc2V0Q2hpbGRyZW4oIFsgc2VsZWN0VmVjdG9yVGV4dCwgdmVjdG9yQXR0cmlidXRlc0NvbnRhaW5lciBdICk7XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBDcmVhdGUgdGhlIHNjZW5lcnkgbm9kZXMgdG8gZGlzcGxheSB0aGUgdmVjdG9yLiBFYWNoIGF0dHJpYnV0ZSBoYXMgYSBsYWJlbCBhbmQgYSBWZWN0b3JWYWx1ZXNOdW1iZXJEaXNwbGF5XHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBjb25zdCBtYWduaXR1ZGVEaXNwbGF5Tm9kZSA9IG5ldyBWZWN0b3JTeW1ib2xOb2RlKCB7XHJcbiAgICAgIGluY2x1ZGVBYnNvbHV0ZVZhbHVlQmFyczogdHJ1ZVxyXG4gICAgfSApO1xyXG4gICAgY29uc3QgbWFnbml0dWRlTnVtYmVyRGlzcGxheSA9IG5ldyBWZWN0b3JWYWx1ZXNOdW1iZXJEaXNwbGF5KCBncmFwaCwgVmVjdG9yUXVhbnRpdGllcy5NQUdOSVRVREUgKTtcclxuXHJcbiAgICBjb25zdCBhbmdsZVRleHQgPSBuZXcgVGV4dCggTWF0aFN5bWJvbHMuVEhFVEEsIHsgZm9udDogVmVjdG9yQWRkaXRpb25Db25zdGFudHMuRVFVQVRJT05fU1lNQk9MX0ZPTlQgfSApO1xyXG4gICAgY29uc3QgYW5nbGVOdW1iZXJEaXNwbGF5ID0gbmV3IFZlY3RvclZhbHVlc051bWJlckRpc3BsYXkoIGdyYXBoLCBWZWN0b3JRdWFudGl0aWVzLkFOR0xFICk7XHJcblxyXG4gICAgY29uc3QgeENvbXBvbmVudFRleHQgPSBuZXcgVmVjdG9yU3ltYm9sTm9kZSggeyBzaG93VmVjdG9yQXJyb3c6IGZhbHNlIH0gKTtcclxuICAgIGNvbnN0IHhDb21wb25lbnROdW1iZXJEaXNwbGF5ID0gbmV3IFZlY3RvclZhbHVlc051bWJlckRpc3BsYXkoIGdyYXBoLCBWZWN0b3JRdWFudGl0aWVzLlhfQ09NUE9ORU5UICk7XHJcblxyXG4gICAgY29uc3QgeUNvbXBvbmVudFRleHQgPSBuZXcgVmVjdG9yU3ltYm9sTm9kZSggeyBzaG93VmVjdG9yQXJyb3c6IGZhbHNlIH0gKTtcclxuICAgIGNvbnN0IHlDb21wb25lbnROdW1iZXJEaXNwbGF5ID0gbmV3IFZlY3RvclZhbHVlc051bWJlckRpc3BsYXkoIGdyYXBoLCBWZWN0b3JRdWFudGl0aWVzLllfQ09NUE9ORU5UICk7XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBBZGQgdGhlIG5ldyBzY2VuZXJ5IG5vZGVzXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAvLyBGdW5jdGlvbiB0aGF0IGFkZHMgYSBsYWJlbCBhbmQgZGlzcGxheSBjb250YWluZXIgY29tYm8sIHB1dHRpbmcgdGhlIGxhYmVsIGluIGEgZml4ZWQgc2l6ZWQgQWxpZ25Cb3hcclxuICAgIGNvbnN0IGFkZE51bWJlckRpc3BsYXlBbmRMYWJlbCA9ICggbGFiZWw6IE5vZGUsIG51bWJlckRpc3BsYXk6IE51bWJlckRpc3BsYXksIGxhYmVsV2lkdGg6IG51bWJlciApID0+IHtcclxuXHJcbiAgICAgIC8vIEFsaWduIHRoZSBsYWJlbCBpbiBhIEFsaWduQm94IHRvIHNldCBhIGZpeGVkIHdpZHRoXHJcbiAgICAgIGNvbnN0IGZpeGVkV2lkdGhMYWJlbCA9IG5ldyBBbGlnbkJveCggbGFiZWwsIHtcclxuICAgICAgICB4QWxpZ246ICdyaWdodCcsXHJcbiAgICAgICAgeUFsaWduOiAnY2VudGVyJyxcclxuICAgICAgICBhbGlnbkJvdW5kczogbmV3IEJvdW5kczIoIDAsIDAsIGxhYmVsV2lkdGgsIGNvbnRlbnRGaXhlZEhlaWdodCApLFxyXG4gICAgICAgIG1heFdpZHRoOiBsYWJlbFdpZHRoXHJcbiAgICAgIH0gKTtcclxuICAgICAgbGFiZWwubWF4V2lkdGggPSBsYWJlbFdpZHRoO1xyXG4gICAgICB2ZWN0b3JBdHRyaWJ1dGVzQ29udGFpbmVyLmFkZENoaWxkKCBuZXcgSEJveCgge1xyXG4gICAgICAgIHNwYWNpbmc6IExBQkVMX1JJR0hUX01BUkdJTixcclxuICAgICAgICBjaGlsZHJlbjogWyBmaXhlZFdpZHRoTGFiZWwsIG51bWJlckRpc3BsYXkgXVxyXG4gICAgICB9ICkgKTtcclxuICAgIH07XHJcblxyXG4gICAgYWRkTnVtYmVyRGlzcGxheUFuZExhYmVsKCBtYWduaXR1ZGVEaXNwbGF5Tm9kZSwgbWFnbml0dWRlTnVtYmVyRGlzcGxheSwgTUFHTklUVURFX0xBQkVMX1dJRFRIICk7XHJcbiAgICBhZGROdW1iZXJEaXNwbGF5QW5kTGFiZWwoIGFuZ2xlVGV4dCwgYW5nbGVOdW1iZXJEaXNwbGF5LCBBTkdMRV9MQUJFTF9XSURUSCApO1xyXG4gICAgYWRkTnVtYmVyRGlzcGxheUFuZExhYmVsKCB4Q29tcG9uZW50VGV4dCwgeENvbXBvbmVudE51bWJlckRpc3BsYXksIENPTVBPTkVOVF9MQUJFTF9XSURUSCApO1xyXG4gICAgYWRkTnVtYmVyRGlzcGxheUFuZExhYmVsKCB5Q29tcG9uZW50VGV4dCwgeUNvbXBvbmVudE51bWJlckRpc3BsYXksIENPTVBPTkVOVF9MQUJFTF9XSURUSCApO1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGNvbnN0IHVwZGF0ZUNvZWZmaWNpZW50ID0gKCBjb2VmZmljaWVudDogbnVtYmVyICkgPT4ge1xyXG4gICAgICBtYWduaXR1ZGVEaXNwbGF5Tm9kZS5zZXRDb2VmZmljaWVudCggY29lZmZpY2llbnQgKTtcclxuICAgICAgeENvbXBvbmVudFRleHQuc2V0Q29lZmZpY2llbnQoIGNvZWZmaWNpZW50ICk7XHJcbiAgICAgIHlDb21wb25lbnRUZXh0LnNldENvZWZmaWNpZW50KCBjb2VmZmljaWVudCApO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBPYnNlcnZlIGNoYW5nZXMgdG8gd2hlbiB0aGUgZ3JhcGhzIGFjdGl2ZSB2ZWN0b3IgUHJvcGVydHkgY2hhbmdlcyB0byB1cGRhdGUgdGhlIHBhbmVsLlxyXG4gICAgLy8gdW5saW5rIGlzIHVubmVjZXNzYXJ5LCBleGlzdHMgZm9yIHRoZSBsaWZldGltZSBvZiB0aGUgc2ltLlxyXG4gICAgZ3JhcGguYWN0aXZlVmVjdG9yUHJvcGVydHkubGluayggKCBhY3RpdmVWZWN0b3IsIG9sZEFjdGl2ZVZlY3RvciApID0+IHtcclxuXHJcbiAgICAgIGlmICggYWN0aXZlVmVjdG9yICE9PSBudWxsICkge1xyXG4gICAgICAgIHZlY3RvckF0dHJpYnV0ZXNDb250YWluZXIudmlzaWJsZSA9IHRydWU7XHJcbiAgICAgICAgc2VsZWN0VmVjdG9yVGV4dC52aXNpYmxlID0gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIEdldCB0aGUgdmVjdG9yIHN5bWJvbFxyXG4gICAgICAgIGNvbnN0IHZlY3RvclN5bWJvbCA9IGFjdGl2ZVZlY3Rvci5zeW1ib2wgPyBhY3RpdmVWZWN0b3Iuc3ltYm9sIDogYWN0aXZlVmVjdG9yLmZhbGxCYWNrU3ltYm9sO1xyXG5cclxuICAgICAgICAvLyBVcGRhdGUgbGFiZWxzIChhbmdsZSBsYWJlbCBpcyB0aGUgc2FtZSlcclxuICAgICAgICBtYWduaXR1ZGVEaXNwbGF5Tm9kZS5zZXRTeW1ib2woIHZlY3RvclN5bWJvbCApO1xyXG4gICAgICAgIHhDb21wb25lbnRUZXh0LnNldFN5bWJvbCggYCR7dmVjdG9yU3ltYm9sfTxzdWI+JHtWZWN0b3JBZGRpdGlvblN0cmluZ3Muc3ltYm9sLnh9PC9zdWI+YCApO1xyXG4gICAgICAgIHlDb21wb25lbnRUZXh0LnNldFN5bWJvbCggYCR7dmVjdG9yU3ltYm9sfTxzdWI+JHtWZWN0b3JBZGRpdGlvblN0cmluZ3Muc3ltYm9sLnl9PC9zdWI+YCApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHZlY3RvckF0dHJpYnV0ZXNDb250YWluZXIudmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgIHNlbGVjdFZlY3RvclRleHQudmlzaWJsZSA9IHRydWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHNlbGVjdFZlY3RvclRleHQuY2VudGVyWSA9IHBhbmVsT3BlbkNvbnRlbnQuY2VudGVyWTtcclxuICAgICAgdmVjdG9yQXR0cmlidXRlc0NvbnRhaW5lci5jZW50ZXJZID0gcGFuZWxPcGVuQ29udGVudC5jZW50ZXJZO1xyXG5cclxuICAgICAgaWYgKCBhY3RpdmVWZWN0b3IgJiYgYWN0aXZlVmVjdG9yIGluc3RhbmNlb2YgRXF1YXRpb25zVmVjdG9yICkge1xyXG4gICAgICAgIGFjdGl2ZVZlY3Rvci5jb2VmZmljaWVudFByb3BlcnR5LmxpbmsoIHVwZGF0ZUNvZWZmaWNpZW50ICk7IC8vIHVubGluayByZXF1aXJlZCB3aGVuIGFjdGl2ZSB2ZWN0b3IgY2hhbmdlc1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIG9sZEFjdGl2ZVZlY3RvciAmJiBvbGRBY3RpdmVWZWN0b3IgaW5zdGFuY2VvZiBFcXVhdGlvbnNWZWN0b3IgKSB7XHJcbiAgICAgICAgb2xkQWN0aXZlVmVjdG9yLmNvZWZmaWNpZW50UHJvcGVydHkudW5saW5rKCB1cGRhdGVDb2VmZmljaWVudCApO1xyXG4gICAgICAgIC8vIHJlc2V0XHJcbiAgICAgICAgdXBkYXRlQ29lZmZpY2llbnQoICggYWN0aXZlVmVjdG9yICYmIGFjdGl2ZVZlY3RvciBpbnN0YW5jZW9mIEVxdWF0aW9uc1ZlY3RvciApID8gYWN0aXZlVmVjdG9yLmNvZWZmaWNpZW50UHJvcGVydHkudmFsdWUgOiAxICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICBzZWxlY3RWZWN0b3JUZXh0LmNlbnRlclkgPSBwYW5lbE9wZW5Db250ZW50LmNlbnRlclk7XHJcbiAgICB2ZWN0b3JBdHRyaWJ1dGVzQ29udGFpbmVyLmNlbnRlclkgPSBwYW5lbE9wZW5Db250ZW50LmNlbnRlclk7XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBDcmVhdGUgdGhlIGluc3BlY3QgYSB2ZWN0b3IgcGFuZWxcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHN1cGVyKCBpbnNwZWN0VmVjdG9yVGV4dCwgcGFuZWxPcGVuQ29udGVudCwgb3B0aW9ucyApO1xyXG4gIH1cclxufVxyXG5cclxudmVjdG9yQWRkaXRpb24ucmVnaXN0ZXIoICdWZWN0b3JWYWx1ZXNUb2dnbGVCb3gnLCBWZWN0b3JWYWx1ZXNUb2dnbGVCb3ggKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsT0FBTyxNQUFNLCtCQUErQjtBQUNuRCxPQUFPQyxXQUFXLE1BQU0sNENBQTRDO0FBQ3BFLFNBQVNDLFFBQVEsRUFBRUMsSUFBSSxFQUFFQyxJQUFJLEVBQUVDLElBQUksUUFBUSxtQ0FBbUM7QUFDOUUsT0FBT0MsY0FBYyxNQUFNLHlCQUF5QjtBQUNwRCxPQUFPQyxxQkFBcUIsTUFBTSxnQ0FBZ0M7QUFFbEUsT0FBT0MsdUJBQXVCLE1BQU0sK0JBQStCO0FBQ25FLE9BQU9DLFNBQVMsTUFBNEIsZ0JBQWdCO0FBQzVELE9BQU9DLGdCQUFnQixNQUFNLHVCQUF1QjtBQUNwRCxPQUFPQyxnQkFBZ0IsTUFBTSx1QkFBdUI7QUFDcEQsT0FBT0MseUJBQXlCLE1BQU0sZ0NBQWdDO0FBQ3RFLE9BQU9DLFNBQVMsTUFBNEIsdUNBQXVDO0FBRW5GLE9BQU9DLGVBQWUsTUFB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QyxPQUFPLEdBQUcsS0FBSzs7UUFFaEM7UUFDQSxNQUFNQyxZQUFZLEdBQUdILFlBQVksQ0FBQ0ksTUFBTSxHQUFHSixZQUFZLENBQUNJLE1BQU0sR0FBR0osWUFBWSxDQUFDSyxjQUFjOztRQUU1RjtRQUNBckMsb0JBQW9CLENBQUNzQyxTQUFTLENBQUVILFlBQWEsQ0FBQztRQUM5QzFCLGNBQWMsQ0FBQzZCLFNBQVMsQ0FBRyxHQUFFSCxZQUFhLFFBQU9uRSxxQkFBcUIsQ0FBQ29FLE1BQU0sQ0FBQ0csQ0FBRSxRQUFRLENBQUM7UUFDekYxQixjQUFjLENBQUN5QixTQUFTLENBQUcsR0FBRUgsWUFBYSxRQUFPbkUscUJBQXFCLENBQUNvRSxNQUFNLENBQUNJLENBQUUsUUFBUSxDQUFDO01BQzNGLENBQUMsTUFDSTtRQUNINUMseUJBQXlCLENBQUNzQyxPQUFPLEdBQUcsS0FBSztRQUN6Q3hDLGdCQUFnQixDQUFDd0MsT0FBTyxHQUFHLElBQUk7TUFDakM7TUFFQXhDLGdCQUFnQixDQUFDK0MsT0FBTyxHQUFHM0MsZ0JBQWdCLENBQUMyQyxPQUFPO01BQ25EN0MseUJBQXlCLENBQUM2QyxPQUFPLEdBQUczQyxnQkFBZ0IsQ0FBQzJDLE9BQU87TUFFNUQsSUFBS1QsWUFBWSxJQUFJQSxZQUFZLFlBQVl6RCxlQUFlLEVBQUc7UUFDN0R5RCxZQUFZLENBQUNVLG1CQUFtQixDQUFDWCxJQUFJLENBQUVKLGlCQUFrQixDQUFDLENBQUMsQ0FBQztNQUM5RDtNQUVBLElBQUtNLGVBQWUsSUFBSUEsZUFBZSxZQUFZMUQsZUFBZSxFQUFHO1FBQ25FMEQsZUFBZSxDQUFDUyxtQkFBbUIsQ0FBQ0MsTUFBTSxDQUFFaEIsaUJBQWtCLENBQUM7UUFDL0Q7UUFDQUEsaUJBQWlCLENBQUlLLFlBQVksSUFBSUEsWUFBWSxZQUFZekQsZUFBZSxHQUFLeUQsWUFBWSxDQUFDVSxtQkFBbUIsQ0FBQ0UsS0FBSyxHQUFHLENBQUUsQ0FBQztNQUMvSDtJQUNGLENBQUUsQ0FBQztJQUVIbEQsZ0JBQWdCLENBQUMrQyxPQUFPLEdBQUczQyxnQkFBZ0IsQ0FBQzJDLE9BQU87SUFDbkQ3Qyx5QkFBeUIsQ0FBQzZDLE9BQU8sR0FBRzNDLGdCQUFnQixDQUFDMkMsT0FBTzs7SUFFNUQ7SUFDQTtJQUNBOztJQUVBLEtBQUssQ0FBRW5ELGlCQUFpQixFQUFFUSxnQkFBZ0IsRUFBRWIsT0FBUSxDQUFDO0VBQ3ZEO0FBQ0Y7QUFFQWxCLGNBQWMsQ0FBQzhFLFFBQVEsQ0FBRSx1QkFBdUIsRUFBRWhFLHFCQUFzQixDQUFDIiwiaWdub3JlTGlzdCI6W119