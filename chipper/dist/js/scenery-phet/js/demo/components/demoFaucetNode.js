// Copyright 2022-2024, University of Colorado Boulder

/**
 * Demo for FaucetNode
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import FaucetNode from '../../FaucetNode.js';
import PhetFont from '../../PhetFont.js';
import Range from '../../../../dot/js/Range.js';
import { HBox, RichText, Text, VBox } from '../../../../scenery/js/imports.js';
import Property from '../../../../axon/js/Property.js';
import Checkbox from '../../../../sun/js/Checkbox.js';
import { combineOptions } from '../../../../phet-core/js/optionize.js';
import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import Utils from '../../../../dot/js/Utils.js';
import Panel from '../../../../sun/js/Panel.js';
import NumberProperty from '../../../../axon/js/NumberProperty.js';
const MAX_FLOW_RATE = 10;
const FAUCET_NODE_SCALE = 0.7;
const FONT = new PhetFont(14);
export default function demoFaucetNode(layoutBounds) {
  const docText = new RichText('Options:<br><br>' + '<b>tapToDispenseEnabled</b>: when true, tapping the shooter dispenses some fluid<br><br>' + '<b>closeOnRelease</b>: when true, releasing the shooter closes the faucet', {
    font: FONT
  });

  // A panel for each combination of tapToDispenseEnabled and closeOnRelease behavior, to facilitate a11y design
  // discussion in https://github.com/phetsims/scenery-phet/issues/773.
  let panelNumber = 1;
  const panel1 = new FaucetDemoPanel(panelNumber++, {
    tapToDispenseEnabled: true,
    closeOnRelease: true
  });
  const panel2 = new FaucetDemoPanel(panelNumber++, {
    tapToDispenseEnabled: true,
    closeOnRelease: false
  });
  const panel3 = new FaucetDemoPanel(panelNumber++, {
    tapToDispenseEnabled: false,
    closeOnRelease: true
  });
  const panel4 = new FaucetDemoPanel(panelNumber++, {
    tapToDispenseEnabled: false,
    closeOnRelease: false
  });
  const panel5 = new FaucetDemoPanel(panelNumber++, {
    tapToDispenseEnabled: true,
    closeOnRelease: true,
    reverseAlternativeInput: true // Dragging the faucet shooter to the left will increase the flow rate.
  });
  const panelsBox = new HBox({
    children: [panel1, panel2, panel3, panel4, panel5],
    spacing: 15,
    maxWidth: layoutBounds.width - 20,
    resize: false
  });
  return new VBox({
    children: [docText, panelsBox],
    align: 'left',
    spacing: 35,
    center: layoutBounds.center
  });
}
class FaucetDemoPanel extends Panel {
  constructor(panelNumber, faucetNodeOptions) {
    const titleText = new Text(`Example ${panelNumber}`, {
      font: new PhetFont({
        size: 18,
        weight: 'bold'
      })
    });

    // Display the configuration values.
    const configurationText = new RichText(`tapToDispenseEnabled=${faucetNodeOptions.tapToDispenseEnabled}<br>` + `closeOnRelease=${faucetNodeOptions.closeOnRelease}`, {
      font: FONT
    });
    const flowRateProperty = new NumberProperty(0, {
      range: new Range(0, MAX_FLOW_RATE)
    });
    const faucetEnabledProperty = new Property(true);
    const faucetNode = new FaucetNode(MAX_FLOW_RATE, flowRateProperty, faucetEnabledProperty, combineOptions({
      scale: FAUCET_NODE_SCALE,
      shooterOptions: {
        touchAreaXDilation: 37,
        touchAreaYDilation: 60
      },
      keyboardStep: 1,
      shiftKeyboardStep: 0.1,
      pageKeyboardStep: 2
    }, faucetNodeOptions));

    // Make the faucet face left.
    if (faucetNodeOptions.reverseAlternativeInput) {
      faucetNode.setScaleMagnitude(-FAUCET_NODE_SCALE, FAUCET_NODE_SCALE);
    }
    const flowRateStringProperty = new DerivedProperty([flowRateProperty], flowRate => `flowRate=${Utils.toFixed(flowRate, 1)}`);
    const flowRateDisplay = new Text(flowRateStringProperty, {
      font: FONT
    });
    const enabledText = new Text('enabled', {
      font: FONT
    });
    const enabledCheckbox = new Checkbox(faucetEnabledProperty, enabledText, {
      boxWidth: 12
    });
    const content = new VBox({
      align: faucetNodeOptions.reverseAlternativeInput ? 'right' : 'left',
      spacing: 10,
      children: [titleText, configurationText, faucetNode, flowRateDisplay, enabledCheckbox]
    });
    super(content, {
      xMargin: 15,
      yMargin: 10
    });
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJGYXVjZXROb2RlIiwiUGhldEZvbnQiLCJSYW5nZSIsIkhCb3giLCJSaWNoVGV4dCIsIlRleHQiLCJWQm94IiwiUHJvcGVydHkiLCJDaGVja2JveCIsImNvbWJpbmVPcHRpb25zIiwiRGVyaXZlZFByb3BlcnR5IiwiVXRpbHMiLCJQYW5lbCIsIk51bWJlclByb3BlcnR5IiwiTUFYX0ZMT1dfUkFURSIsIkZBVUNFVF9OT0RFX1NDQUxFIiwiRk9OVCIsImRlbW9GYXVjZXROb2RlIiwibGF5b3V0Qm91bmRzIiwiZG9jVGV4dCIsImZvbnQiLCJwYW5lbE51bWJlciIsInBhbmVsMSIsIkZhdWNldERlbW9QYW5lbCIsInRhcFRvRGlzcGVuc2VFbmFibGVkIiwiY2xvc2VPblJlbGVhc2UiLCJwYW5lbDIiLCJwYW5lbDMiLCJwYW5lbDQiLCJwYW5lbDUiLCJyZXZlcnNlQWx0ZXJuYXRpdmVJbnB1dCIsInBhbmVsc0JveCIsImNoaWxkcmVuIiwic3BhY2luZyIsIm1heFdpZHRoIiwid2lkdGgiLCJyZXNpemUiLCJhbGlnbiIsImNlbnRlciIsImNvbnN0cnVjdG9yIiwiZmF1Y2V0Tm9kZU9wdGlvbnMiLCJ0aXRsZVRleHQiLCJzaXplIiwid2VpZ2h0IiwiY29uZmlndXJhdGlvblRleHQiLCJmbG93UmF0ZVByb3BlcnR5IiwicmFuZ2UiLCJmYXVjZXRFbmFibGVkUHJvcGVydHkiLCJmYXVjZXROb2RlIiwic2NhbGUiLCJzaG9vdGVyT3B0aW9ucyIsInRvdWNoQXJlYVhEaWxhdGlvbiIsInRvdWNoQXJlYVlEaWxhdGlvbiIsImtleWJvYXJkU3RlcCIsInNoaWZ0S2V5Ym9hcmRTdGVwIiwicGFnZUtleWJvYXJkU3RlcCIsInNldFNjYWxlTWFnbml0dWRlIiwiZmxvd1JhdGVTdHJpbmdQcm9wZXJ0eSIsImZsb3dSYXRlIiwidG9GaXhlZCIsImZsb3dSYXRlRGlzcGxheSIsImVuYWJsZWRUZXh0IiwiZW5hYmxlZENoZWNrYm94IiwiYm94V2lkdGgiLCJjb250ZW50IiwieE1hcmdpbiIsInlNYXJnaW4iXSwic291cmNlcyI6WyJkZW1vRmF1Y2V0Tm9kZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBEZW1vIGZvciBGYXVjZXROb2RlXHJcbiAqXHJcbiAqIEBhdXRob3IgQ2hyaXMgTWFsbGV5IChQaXhlbFpvb20sIEluYy4pXHJcbiAqL1xyXG5cclxuaW1wb3J0IEZhdWNldE5vZGUsIHsgRmF1Y2V0Tm9kZU9wdGlvbnMgfSBmcm9tICcuLi8uLi9GYXVjZXROb2RlLmpzJztcclxuaW1wb3J0IFBoZXRGb250IGZyb20gJy4uLy4uL1BoZXRGb250LmpzJztcclxuaW1wb3J0IEJvdW5kczIgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL0JvdW5kczIuanMnO1xyXG5pbXBvcnQgUmFuZ2UgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL1JhbmdlLmpzJztcclxuaW1wb3J0IHsgSEJveCwgTm9kZSwgUmljaFRleHQsIFRleHQsIFZCb3ggfSBmcm9tICcuLi8uLi8uLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBDaGVja2JveCBmcm9tICcuLi8uLi8uLi8uLi9zdW4vanMvQ2hlY2tib3guanMnO1xyXG5pbXBvcnQgeyBjb21iaW5lT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgRGVyaXZlZFByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvRGVyaXZlZFByb3BlcnR5LmpzJztcclxuaW1wb3J0IFV0aWxzIGZyb20gJy4uLy4uLy4uLy4uL2RvdC9qcy9VdGlscy5qcyc7XHJcbmltcG9ydCBQaWNrUmVxdWlyZWQgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1BpY2tSZXF1aXJlZC5qcyc7XHJcbmltcG9ydCBQYW5lbCBmcm9tICcuLi8uLi8uLi8uLi9zdW4vanMvUGFuZWwuanMnO1xyXG5pbXBvcnQgUGlja09wdGlvbmFsIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9QaWNrT3B0aW9uYWwuanMnO1xyXG5pbXBvcnQgTnVtYmVyUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9OdW1iZXJQcm9wZXJ0eS5qcyc7XHJcblxyXG5jb25zdCBNQVhfRkxPV19SQVRFID0gMTA7XHJcbmNvbnN0IEZBVUNFVF9OT0RFX1NDQUxFID0gMC43O1xyXG5jb25zdCBGT05UID0gbmV3IFBoZXRGb250KCAxNCApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZGVtb0ZhdWNldE5vZGUoIGxheW91dEJvdW5kczogQm91bmRzMiApOiBOb2RlIHtcclxuXHJcbiAgY29uc3QgZG9jVGV4dCA9IG5ldyBSaWNoVGV4dChcclxuICAgICdPcHRpb25zOjxicj48YnI+JyArXHJcbiAgICAnPGI+dGFwVG9EaXNwZW5zZUVuYWJsZWQ8L2I+OiB3aGVuIHRydWUsIHRhcHBpbmcgdGhlIHNob290ZXIgZGlzcGVuc2VzIHNvbWUgZmx1aWQ8YnI+PGJyPicgK1xyXG4gICAgJzxiPmNsb3NlT25SZWxlYXNlPC9iPjogd2hlbiB0cnVlLCByZWxlYXNpbmcgdGhlIHNob290ZXIgY2xvc2VzIHRoZSBmYXVjZXQnLCB7XHJcbiAgICAgIGZvbnQ6IEZPTlRcclxuICAgIH1cclxuICApO1xyXG5cclxuICAvLyBBIHBhbmVsIGZvciBlYWNoIGNvbWJpbmF0aW9uIG9mIHRhcFRvRGlzcGVuc2VFbmFibGVkIGFuZCBjbG9zZU9uUmVsZWFzZSBiZWhhdmlvciwgdG8gZmFjaWxpdGF0ZSBhMTF5IGRlc2lnblxyXG4gIC8vIGRpc2N1c3Npb24gaW4gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnktcGhldC9pc3N1ZXMvNzczLlxyXG4gIGxldCBwYW5lbE51bWJlciA9IDE7XHJcblxyXG4gIGNvbnN0IHBhbmVsMSA9IG5ldyBGYXVjZXREZW1vUGFuZWwoIHBhbmVsTnVtYmVyKyssIHtcclxuICAgIHRhcFRvRGlzcGVuc2VFbmFibGVkOiB0cnVlLFxyXG4gICAgY2xvc2VPblJlbGVhc2U6IHRydWVcclxuICB9ICk7XHJcblxyXG4gIGNvbnN0IHBhbmVsMiA9IG5ldyBGYXVjZXREZW1vUGFuZWwoIHBhbmVsTnVtYmVyKyssIHtcclxuICAgIHRhcFRvRGlzcGVuc2VFbmFibGVkOiB0cnVlLFxyXG4gICAgY2xvc2VPblJlbGVhc2U6IGZhbHNlXHJcbiAgfSApO1xyXG5cclxuICBjb25zdCBwYW5lbDMgPSBuZXcgRmF1Y2V0RGVtb1BhbmVsKCBwYW5lbE51bWJlcisrLCB7XHJcbiAgICB0YXBUb0Rpc3BlbnNlRW5hYmxlZDogZmFsc2UsXHJcbiAgICBjbG9zZU9uUmVsZWFzZTogdHJ1ZVxyXG4gIH0gKTtcclxuXHJcbiAgY29uc3QgcGFuZWw0ID0gbmV3IEZhdWNldERlbW9QYW5lbCggcGFuZWxOdW1iZXIrKywge1xyXG4gICAgdGFwVG9EaXNwZW5zZUVuYWJsZWQ6IGZhbHNlLFxyXG4gICAgY2xvc2VPblJlbGVhc2U6IGZhbHNlXHJcbiAgfSApO1xyXG5cclxuICBjb25zdCBwYW5lbDUgPSBuZXcgRmF1Y2V0RGVtb1BhbmVsKCBwYW5lbE51bWJlcisrLCB7XHJcbiAgICB0YXBUb0Rpc3BlbnNlRW5hYmxlZDogdHJ1ZSxcclxuICAgIGNsb3NlT25SZWxlYXNlOiB0cnVlLFxyXG4gICAgcmV2ZXJzZUFsdGVybmF0aXZlSW5wdXQ6IHRydWUgLy8gRHJhZ2dpbmcgdGhlIGZhdWNldCBzaG9vdGVyIHRvIHRoZSBsZWZ0IHdpbGwgaW5jcmVhc2UgdGhlIGZsb3cgcmF0ZS5cclxuICB9ICk7XHJcblxyXG4gIGNvbnN0IHBhbmVsc0JveCA9IG5ldyBIQm94KCB7XHJcbiAgICBjaGlsZHJlbjogWyBwYW5lbDEsIHBhbmVsMiwgcGFuZWwzLCBwYW5lbDQsIHBhbmVsNSBdLFxyXG4gICAgc3BhY2luZzogMTUsXHJcbiAgICBtYXhXaWR0aDogbGF5b3V0Qm91bmRzLndpZHRoIC0gMjAsXHJcbiAgICByZXNpemU6IGZhbHNlXHJcbiAgfSApO1xyXG5cclxuICByZXR1cm4gbmV3IFZCb3goIHtcclxuICAgIGNoaWxkcmVuOiBbIGRvY1RleHQsIHBhbmVsc0JveCBdLFxyXG4gICAgYWxpZ246ICdsZWZ0JyxcclxuICAgIHNwYWNpbmc6IDM1LFxyXG4gICAgY2VudGVyOiBsYXlvdXRCb3VuZHMuY2VudGVyXHJcbiAgfSApO1xyXG59XHJcblxyXG50eXBlIEZhdWNldERlbW9QYW5lbE9wdGlvbnMgPSBQaWNrUmVxdWlyZWQ8RmF1Y2V0Tm9kZU9wdGlvbnMsICd0YXBUb0Rpc3BlbnNlRW5hYmxlZCcgfCAnY2xvc2VPblJlbGVhc2UnPiAmXHJcbiAgUGlja09wdGlvbmFsPEZhdWNldE5vZGVPcHRpb25zLCAncmV2ZXJzZUFsdGVybmF0aXZlSW5wdXQnPjtcclxuXHJcbmNsYXNzIEZhdWNldERlbW9QYW5lbCBleHRlbmRzIFBhbmVsIHtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBwYW5lbE51bWJlcjogbnVtYmVyLCBmYXVjZXROb2RlT3B0aW9uczogRmF1Y2V0RGVtb1BhbmVsT3B0aW9ucyApIHtcclxuXHJcbiAgICBjb25zdCB0aXRsZVRleHQgPSBuZXcgVGV4dCggYEV4YW1wbGUgJHtwYW5lbE51bWJlcn1gLCB7XHJcbiAgICAgIGZvbnQ6IG5ldyBQaGV0Rm9udCgge1xyXG4gICAgICAgIHNpemU6IDE4LFxyXG4gICAgICAgIHdlaWdodDogJ2JvbGQnXHJcbiAgICAgIH0gKVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIERpc3BsYXkgdGhlIGNvbmZpZ3VyYXRpb24gdmFsdWVzLlxyXG4gICAgY29uc3QgY29uZmlndXJhdGlvblRleHQgPSBuZXcgUmljaFRleHQoXHJcbiAgICAgIGB0YXBUb0Rpc3BlbnNlRW5hYmxlZD0ke2ZhdWNldE5vZGVPcHRpb25zLnRhcFRvRGlzcGVuc2VFbmFibGVkfTxicj5gICtcclxuICAgICAgYGNsb3NlT25SZWxlYXNlPSR7ZmF1Y2V0Tm9kZU9wdGlvbnMuY2xvc2VPblJlbGVhc2V9YCwge1xyXG4gICAgICAgIGZvbnQ6IEZPTlRcclxuICAgICAgfSApO1xyXG5cclxuICAgIGNvbnN0IGZsb3dSYXRlUHJvcGVydHkgPSBuZXcgTnVtYmVyUHJvcGVydHkoIDAsIHtcclxuICAgICAgcmFuZ2U6IG5ldyBSYW5nZSggMCwgTUFYX0ZMT1dfUkFURSApXHJcbiAgICB9ICk7XHJcbiAgICBjb25zdCBmYXVjZXRFbmFibGVkUHJvcGVydHkgPSBuZXcgUHJvcGVydHkoIHRydWUgKTtcclxuXHJcbiAgICBjb25zdCBmYXVjZXROb2RlID0gbmV3IEZhdWNldE5vZGUoIE1BWF9GTE9XX1JBVEUsIGZsb3dSYXRlUHJvcGVydHksIGZhdWNldEVuYWJsZWRQcm9wZXJ0eSxcclxuICAgICAgY29tYmluZU9wdGlvbnM8RmF1Y2V0Tm9kZU9wdGlvbnM+KCB7XHJcbiAgICAgICAgc2NhbGU6IEZBVUNFVF9OT0RFX1NDQUxFLFxyXG4gICAgICAgIHNob290ZXJPcHRpb25zOiB7XHJcbiAgICAgICAgICB0b3VjaEFyZWFYRGlsYXRpb246IDM3LFxyXG4gICAgICAgICAgdG91Y2hBcmVhWURpbGF0aW9uOiA2MFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAga2V5Ym9hcmRTdGVwOiAxLFxyXG4gICAgICAgIHNoaWZ0S2V5Ym9hcmRTdGVwOiAwLjEsXHJcbiAgICAgICAgcGFnZUtleWJvYXJkU3RlcDogMlxyXG4gICAgICB9LCBmYXVjZXROb2RlT3B0aW9ucyApICk7XHJcblxyXG4gICAgLy8gTWFrZSB0aGUgZmF1Y2V0IGZhY2UgbGVmdC5cclxuICAgIGlmICggZmF1Y2V0Tm9kZU9wdGlvbnMucmV2ZXJzZUFsdGVybmF0aXZlSW5wdXQgKSB7XHJcbiAgICAgIGZhdWNldE5vZGUuc2V0U2NhbGVNYWduaXR1ZGUoIC1GQVVDRVRfTk9ERV9TQ0FMRSwgRkFVQ0VUX05PREVfU0NBTEUgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmbG93UmF0ZVN0cmluZ1Byb3BlcnR5ID0gbmV3IERlcml2ZWRQcm9wZXJ0eSggWyBmbG93UmF0ZVByb3BlcnR5IF0sXHJcbiAgICAgIGZsb3dSYXRlID0+IGBmbG93UmF0ZT0ke1V0aWxzLnRvRml4ZWQoIGZsb3dSYXRlLCAxICl9YCApO1xyXG4gICAgY29uc3QgZmxvd1JhdGVEaXNwbGF5ID0gbmV3IFRleHQoIGZsb3dSYXRlU3RyaW5nUHJvcGVydHksIHtcclxuICAgICAgZm9udDogRk9OVFxyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IGVuYWJsZWRUZXh0ID0gbmV3IFRleHQoICdlbmFibGVkJywgeyBmb250OiBGT05UIH0gKTtcclxuICAgIGNvbnN0IGVuYWJsZWRDaGVja2JveCA9IG5ldyBDaGVja2JveCggZmF1Y2V0RW5hYmxlZFByb3BlcnR5LCBlbmFibGVkVGV4dCwge1xyXG4gICAgICBib3hXaWR0aDogMTJcclxuICAgIH0gKTtcclxuXHJcbiAgICBjb25zdCBjb250ZW50ID0gbmV3IFZCb3goIHtcclxuICAgICAgYWxpZ246IGZhdWNldE5vZGVPcHRpb25zLnJldmVyc2VBbHRlcm5hdGl2ZUlucHV0ID8gJ3JpZ2h0JyA6ICdsZWZ0JyxcclxuICAgICAgc3BhY2luZzogMTAsXHJcbiAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgdGl0bGVUZXh0LFxyXG4gICAgICAgIGNvbmZpZ3VyYXRpb25UZXh0LFxyXG4gICAgICAgIGZhdWNldE5vZGUsXHJcbiAgICAgICAgZmxvd1JhdGVEaXNwbGF5LFxyXG4gICAgICAgIGVuYWJsZWRDaGVja2JveFxyXG4gICAgICBdXHJcbiAgICB9ICk7XHJcblxyXG4gICAgc3VwZXIoIGNvbnRlbnQsIHtcclxuICAgICAgeE1hcmdpbjogMTUsXHJcbiAgICAgIHlNYXJnaW46IDEwXHJcbiAgICB9ICk7XHJcbiAgfVxyXG59Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFVBQVUsTUFBNkIscUJBQXFCO0FBQ25FLE9BQU9DLFFBQVEsTUFBTSxtQkFBbUI7QUFFeEMsT0FBT0MsS0FBSyxNQUFNLDZCQUE2QjtBQUMvQyxTQUFTQyxJQUFJLEVBQVFDLFFBQVEsRUFBRUMsSUFBSSxFQUFFQyxJQUFJLFFBQVEsbUNBQW1DO0FBQ3BGLE9BQU9DLFFBQVEsTUFBTSxpQ0FBaUM7QUFDdEQsT0FBT0MsUUFBUSxNQUFNLGdDQUFnQztBQUNyRCxTQUFTQyxjQUFjLFFBQVEsdUNBQXVDO0FBQ3RFLE9BQU9DLGVBQWUsTUFBTSx3Q0FBd0M7QUFDcEUsT0FBT0MsS0FBSyxNQUFNLDZCQUE2QjtBQUUvQyxPQUFPQyxLQUFLLE1BQU0sNkJBQTZCO0FBRS9DLE9BQU9DLGNBQWMsTUFBTSx1Q0FBdUM7QUFFbEUsTUFBTUMsYUFBYSxHQUFHLEVBQUU7QUFDeEIsTUFBTUMsaUJBQWlCLEdBQUcsR0FBRztBQUM3QixNQUFNQyxJQUFJLEdBQUcsSUFBSWYsUUFBUSxDQUFFLEVBQUcsQ0FBQztBQUUvQixlQUFlLFNBQVNnQixjQUFjQSxDQUFFQyxZQUFxQixFQUFTO0VBRXBFLE1BQU1DLE9BQU8sR0FBRyxJQUFJZixRQUFRLENBQzFCLGtCQUFrQixHQUNsQiwwRkFBMEYsR0FDMUYsMkVBQTJFLEVBQUU7SUFDM0VnQixJQUFJLEVBQUVKO0VBQ1IsQ0FDRixDQUFDOztFQUVEO0VBQ0E7RUFDQSxJQUFJSyxXQUFXLEdBQUcsQ0FBQztFQUVuQixNQUFNQyxNQUFNLEdBQUcsSUFBSUMsZUFBZSxDQUFFRixXQUFXLEVBQUUsRUFBRTtJQUNqREcsb0JBQW9CLEVBQUUsSUFBSTtJQUMxQkMsY0FBYyxFQUFFO0VBQ2xCLENBQUUsQ0FBQztFQUVILE1BQU1DLE1BQU0sR0FBRyxJQUFJSCxlQUFlLENBQUVGLFdBQVcsRUFBRSxFQUFFO0lBQ2pERyxvQkFBb0IsRUFBRSxJQUFJO0lBQzFCQyxjQUFjLEVBQUU7RUFDbEIsQ0FBRSxDQUFDO0VBRUgsTUFBTUUsTUFBTSxHQUFHLElBQUlKLGVBQWUsQ0FBRUYsV0FBVyxFQUFFLEVBQUU7SUFDakRHLG9CQUFvQixFQUFFLEtBQUs7SUFDM0JDLGNBQWMsRUFBRTtFQUNsQixDQUFFLENBQUM7RUFFSCxNQUFNRyxNQUFNLEdBQUcsSUFBSUwsZUFBZSxDQUFFRixXQUFXLEVBQUUsRUFBRTtJQUNqREcsb0JBQW9CLEVBQUUsS0FBSztJQUMzQkMsY0FBYyxFQUFFO0VBQ2xCLENBQUUsQ0FBQztFQUVILE1BQU1JLE1BQU0sR0FBRyxJQUFJTixlQUFlLENBQUVGLFdBQVcsRUFBRSxFQUFFO0lBQ2pERyxvQkFBb0IsRUFBRSxJQUFJO0lBQzFCQyxjQUFjLEVBQUUsSUFBSTtJQUNwQkssdUJBQXVCLEVBQUUsSUFBSSxDQUFDO0VBQ2hDLENBQUUsQ0FBQztFQUVILE1BQU1DLFNBQVMsR0FBRyxJQUFJNUIsSUFBSSxDQUFFO0lBQzFCNkIsUUFBUSxFQUFFLENBQUVWLE1BQU0sRUFBRUksTUFBTSxFQUFFQyxNQUFNLEVBQUVDLE1BQU0sRUFBRUMsTUFBTSxDQUFFO0lBQ3BESSxPQUFPLEVBQUUsRUFBRTtJQUNYQyxRQUFRLEVBQUVoQixZQUFZLENBQUNpQixLQUFLLEdBQUcsRUFBRTtJQUNqQ0MsTUFBTSxFQUFFO0VBQ1YsQ0FBRSxDQUFDO0VBRUgsT0FBTyxJQUFJOUIsSUFBSSxDQUFFO0lBQ2YwQixRQUFRLEVBQUUsQ0FBRWIsT0FBTyxFQUFFWSxTQUFTLENBQUU7SUFDaENNLEtBQUssRUFBRSxNQUFNO0lBQ2JKLE9BQU8sRUFBRSxFQUFFO0lBQ1hLLE1BQU0sRUFBRXBCLFlBQVksQ0FBQ29CO0VBQ3ZCLENBQUUsQ0FBQztBQUNMO0FBS0EsTUFBTWYsZUFBZSxTQUFTWCxLQUFLLENBQUM7RUFFM0IyQixXQUFXQSxDQUFFbEIsV0FBbUIsRUFBRW1CLGlCQUF5QyxFQUFHO0lBRW5GLE1BQU1DLFNBQVMsR0FBRyxJQUFJcEMsSUFBSSxDQUFHLFdBQVVnQixXQUFZLEVBQUMsRUFBRTtNQUNwREQsSUFBSSxFQUFFLElBQUluQixRQUFRLENBQUU7UUFDbEJ5QyxJQUFJLEVBQUUsRUFBRTtRQUNSQyxNQUFNLEVBQUU7TUFDVixDQUFFO0lBQ0osQ0FBRSxDQUFDOztJQUVIO0lBQ0EsTUFBTUMsaUJBQWlCLEdBQUcsSUFBSXhDLFFBQVEsQ0FDbkMsd0JBQXVCb0MsaUJBQWlCLENBQUNoQixvQkFBcUIsTUFBSyxHQUNuRSxrQkFBaUJnQixpQkFBaUIsQ0FBQ2YsY0FBZSxFQUFDLEVBQUU7TUFDcERMLElBQUksRUFBRUo7SUFDUixDQUFFLENBQUM7SUFFTCxNQUFNNkIsZ0JBQWdCLEdBQUcsSUFBSWhDLGNBQWMsQ0FBRSxDQUFDLEVBQUU7TUFDOUNpQyxLQUFLLEVBQUUsSUFBSTVDLEtBQUssQ0FBRSxDQUFDLEVBQUVZLGFBQWM7SUFDckMsQ0FBRSxDQUFDO0lBQ0gsTUFBTWlDLHFCQUFxQixHQUFHLElBQUl4QyxRQUFRLENBQUUsSUFBSyxDQUFDO0lBRWxELE1BQU15QyxVQUFVLEdBQUcsSUFBSWhELFVBQVUsQ0FBRWMsYUFBYSxFQUFFK0IsZ0JBQWdCLEVBQUVFLHFCQUFxQixFQUN2RnRDLGNBQWMsQ0FBcUI7TUFDakN3QyxLQUFLLEVBQUVsQyxpQkFBaUI7TUFDeEJtQyxjQUFjLEVBQUU7UUFDZEMsa0JBQWtCLEVBQUUsRUFBRTtRQUN0QkMsa0JBQWtCLEVBQUU7TUFDdEIsQ0FBQztNQUNEQyxZQUFZLEVBQUUsQ0FBQztNQUNmQyxpQkFBaUIsRUFBRSxHQUFHO01BQ3RCQyxnQkFBZ0IsRUFBRTtJQUNwQixDQUFDLEVBQUVmLGlCQUFrQixDQUFFLENBQUM7O0lBRTFCO0lBQ0EsSUFBS0EsaUJBQWlCLENBQUNWLHVCQUF1QixFQUFHO01BQy9Da0IsVUFBVSxDQUFDUSxpQkFBaUIsQ0FBRSxDQUFDekMsaUJBQWlCLEVBQUVBLGlCQUFrQixDQUFDO0lBQ3ZFO0lBRUEsTUFBTTBDLHNCQUFzQixHQUFHLElBQUkvQyxlQUFlLENBQUUsQ0FBRW1DLGdCQUFnQixDQUFFLEVBQ3RFYSxRQUFRLElBQUssWUFBVy9DLEtBQUssQ0FBQ2dELE9BQU8sQ0FBRUQsUUFBUSxFQUFFLENBQUUsQ0FBRSxFQUFFLENBQUM7SUFDMUQsTUFBTUUsZUFBZSxHQUFHLElBQUl2RCxJQUFJLENBQUVvRCxzQkFBc0IsRUFBRTtNQUN4RHJDLElBQUksRUFBRUo7SUFDUixDQUFFLENBQUM7SUFFSCxNQUFNNkMsV0FBVyxHQUFHLElBQUl4RCxJQUFJLENBQUUsU0FBUyxFQUFFO01BQUVlLElBQUksRUFBRUo7SUFBSyxDQUFFLENBQUM7SUFDekQsTUFBTThDLGVBQWUsR0FBRyxJQUFJdEQsUUFBUSxDQUFFdUMscUJBQXFCLEVBQUVjLFdBQVcsRUFBRTtNQUN4RUUsUUFBUSxFQUFFO0lBQ1osQ0FBRSxDQUFDO0lBRUgsTUFBTUMsT0FBTyxHQUFHLElBQUkxRCxJQUFJLENBQUU7TUFDeEIrQixLQUFLLEVBQUVHLGlCQUFpQixDQUFDVix1QkFBdUIsR0FBRyxPQUFPLEdBQUcsTUFBTTtNQUNuRUcsT0FBTyxFQUFFLEVBQUU7TUFDWEQsUUFBUSxFQUFFLENBQ1JTLFNBQVMsRUFDVEcsaUJBQWlCLEVBQ2pCSSxVQUFVLEVBQ1ZZLGVBQWUsRUFDZkUsZUFBZTtJQUVuQixDQUFFLENBQUM7SUFFSCxLQUFLLENBQUVFLE9BQU8sRUFBRTtNQUNkQyxPQUFPLEVBQUUsRUFBRTtNQUNYQyxPQUFPLEVBQUU7SUFDWCxDQUFFLENBQUM7RUFDTDtBQUNGIiwiaWdub3JlTGlzdCI6W119