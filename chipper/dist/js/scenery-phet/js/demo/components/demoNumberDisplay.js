// Copyright 2022-2024, University of Colorado Boulder

/**
 * Demo for NumberDisplay
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import NumberDisplay from '../../NumberDisplay.js';
import StopwatchNode from '../../StopwatchNode.js';
import { VBox } from '../../../../scenery/js/imports.js';
import Range from '../../../../dot/js/Range.js';
import Property from '../../../../axon/js/Property.js';
import NumberProperty from '../../../../axon/js/NumberProperty.js';
import Dimension2 from '../../../../dot/js/Dimension2.js';
import HSlider from '../../../../sun/js/HSlider.js';
import { combineOptions } from '../../../../phet-core/js/optionize.js';
import SceneryPhetStrings from '../../SceneryPhetStrings.js';
export default function demoNumberDisplay(layoutBounds) {
  const range = new Range(0, 1000);

  // Options for both NumberDisplay instances
  const numberDisplayOptions = {
    valuePattern: '{{value}} K',
    align: 'right'
  };

  // To demonstrate 'no value' options
  const noValueDisplay = new NumberDisplay(new Property(null), range, combineOptions({}, numberDisplayOptions, {
    noValueAlign: 'center',
    noValuePattern: '{{value}}'
  }));

  // To demonstrate numeric value display
  const property = new NumberProperty(1);
  const numberDisplay = new NumberDisplay(property, range, numberDisplayOptions);
  const numberDisplayTime = new NumberDisplay(property, range, {
    numberFormatter: StopwatchNode.PLAIN_TEXT_MINUTES_AND_SECONDS,
    align: 'center'
  });
  const numberDisplayTimeRich = new NumberDisplay(property, range, {
    numberFormatter: StopwatchNode.RICH_TEXT_MINUTES_AND_SECONDS,
    numberFormatterDependencies: [SceneryPhetStrings.stopwatchValueUnitsPatternStringProperty],
    useRichText: true,
    align: 'center'
  });

  // Test shrinking to fit
  const numberDisplayTimeRichUnits = new NumberDisplay(property, new Range(0, 10), {
    numberFormatter: StopwatchNode.createRichTextNumberFormatter({
      units: 'hours'
    }),
    numberFormatterDependencies: [SceneryPhetStrings.stopwatchValueUnitsPatternStringProperty],
    useRichText: true,
    align: 'center'
  });
  const slider = new HSlider(property, range, {
    trackSize: new Dimension2(400, 5)
  });
  return new VBox({
    spacing: 30,
    children: [noValueDisplay, numberDisplay, numberDisplayTime, numberDisplayTimeRich, numberDisplayTimeRichUnits, slider],
    center: layoutBounds.center
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJOdW1iZXJEaXNwbGF5IiwiU3RvcHdhdGNoTm9kZSIsIlZCb3giLCJSYW5nZSIsIlByb3BlcnR5IiwiTnVtYmVyUHJvcGVydHkiLCJEaW1lbnNpb24yIiwiSFNsaWRlciIsImNvbWJpbmVPcHRpb25zIiwiU2NlbmVyeVBoZXRTdHJpbmdzIiwiZGVtb051bWJlckRpc3BsYXkiLCJsYXlvdXRCb3VuZHMiLCJyYW5nZSIsIm51bWJlckRpc3BsYXlPcHRpb25zIiwidmFsdWVQYXR0ZXJuIiwiYWxpZ24iLCJub1ZhbHVlRGlzcGxheSIsIm5vVmFsdWVBbGlnbiIsIm5vVmFsdWVQYXR0ZXJuIiwicHJvcGVydHkiLCJudW1iZXJEaXNwbGF5IiwibnVtYmVyRGlzcGxheVRpbWUiLCJudW1iZXJGb3JtYXR0ZXIiLCJQTEFJTl9URVhUX01JTlVURVNfQU5EX1NFQ09ORFMiLCJudW1iZXJEaXNwbGF5VGltZVJpY2giLCJSSUNIX1RFWFRfTUlOVVRFU19BTkRfU0VDT05EUyIsIm51bWJlckZvcm1hdHRlckRlcGVuZGVuY2llcyIsInN0b3B3YXRjaFZhbHVlVW5pdHNQYXR0ZXJuU3RyaW5nUHJvcGVydHkiLCJ1c2VSaWNoVGV4dCIsIm51bWJlckRpc3BsYXlUaW1lUmljaFVuaXRzIiwiY3JlYXRlUmljaFRleHROdW1iZXJGb3JtYXR0ZXIiLCJ1bml0cyIsInNsaWRlciIsInRyYWNrU2l6ZSIsInNwYWNpbmciLCJjaGlsZHJlbiIsImNlbnRlciJdLCJzb3VyY2VzIjpbImRlbW9OdW1iZXJEaXNwbGF5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIyLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIERlbW8gZm9yIE51bWJlckRpc3BsYXlcclxuICpcclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICovXHJcblxyXG5pbXBvcnQgTnVtYmVyRGlzcGxheSwgeyBOdW1iZXJEaXNwbGF5T3B0aW9ucyB9IGZyb20gJy4uLy4uL051bWJlckRpc3BsYXkuanMnO1xyXG5pbXBvcnQgU3RvcHdhdGNoTm9kZSBmcm9tICcuLi8uLi9TdG9wd2F0Y2hOb2RlLmpzJztcclxuaW1wb3J0IHsgTm9kZSwgVkJveCB9IGZyb20gJy4uLy4uLy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBCb3VuZHMyIGZyb20gJy4uLy4uLy4uLy4uL2RvdC9qcy9Cb3VuZHMyLmpzJztcclxuaW1wb3J0IFJhbmdlIGZyb20gJy4uLy4uLy4uLy4uL2RvdC9qcy9SYW5nZS5qcyc7XHJcbmltcG9ydCBQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IE51bWJlclByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvTnVtYmVyUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgRGltZW5zaW9uMiBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvRGltZW5zaW9uMi5qcyc7XHJcbmltcG9ydCBIU2xpZGVyIGZyb20gJy4uLy4uLy4uLy4uL3N1bi9qcy9IU2xpZGVyLmpzJztcclxuaW1wb3J0IHsgY29tYmluZU9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IFNjZW5lcnlQaGV0U3RyaW5ncyBmcm9tICcuLi8uLi9TY2VuZXJ5UGhldFN0cmluZ3MuanMnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZGVtb051bWJlckRpc3BsYXkoIGxheW91dEJvdW5kczogQm91bmRzMiApOiBOb2RlIHtcclxuXHJcbiAgY29uc3QgcmFuZ2UgPSBuZXcgUmFuZ2UoIDAsIDEwMDAgKTtcclxuXHJcbiAgLy8gT3B0aW9ucyBmb3IgYm90aCBOdW1iZXJEaXNwbGF5IGluc3RhbmNlc1xyXG4gIGNvbnN0IG51bWJlckRpc3BsYXlPcHRpb25zOiBOdW1iZXJEaXNwbGF5T3B0aW9ucyA9IHtcclxuICAgIHZhbHVlUGF0dGVybjogJ3t7dmFsdWV9fSBLJyxcclxuICAgIGFsaWduOiAncmlnaHQnXHJcbiAgfTtcclxuXHJcbiAgLy8gVG8gZGVtb25zdHJhdGUgJ25vIHZhbHVlJyBvcHRpb25zXHJcbiAgY29uc3Qgbm9WYWx1ZURpc3BsYXkgPSBuZXcgTnVtYmVyRGlzcGxheSggbmV3IFByb3BlcnR5KCBudWxsICksIHJhbmdlLFxyXG4gICAgY29tYmluZU9wdGlvbnM8TnVtYmVyRGlzcGxheU9wdGlvbnM+KCB7fSwgbnVtYmVyRGlzcGxheU9wdGlvbnMsIHtcclxuICAgICAgbm9WYWx1ZUFsaWduOiAnY2VudGVyJyxcclxuICAgICAgbm9WYWx1ZVBhdHRlcm46ICd7e3ZhbHVlfX0nXHJcbiAgICB9ICkgKTtcclxuXHJcbiAgLy8gVG8gZGVtb25zdHJhdGUgbnVtZXJpYyB2YWx1ZSBkaXNwbGF5XHJcbiAgY29uc3QgcHJvcGVydHkgPSBuZXcgTnVtYmVyUHJvcGVydHkoIDEgKTtcclxuXHJcbiAgY29uc3QgbnVtYmVyRGlzcGxheSA9IG5ldyBOdW1iZXJEaXNwbGF5KCBwcm9wZXJ0eSwgcmFuZ2UsIG51bWJlckRpc3BsYXlPcHRpb25zICk7XHJcbiAgY29uc3QgbnVtYmVyRGlzcGxheVRpbWUgPSBuZXcgTnVtYmVyRGlzcGxheSggcHJvcGVydHksIHJhbmdlLCB7XHJcbiAgICBudW1iZXJGb3JtYXR0ZXI6IFN0b3B3YXRjaE5vZGUuUExBSU5fVEVYVF9NSU5VVEVTX0FORF9TRUNPTkRTLFxyXG4gICAgYWxpZ246ICdjZW50ZXInXHJcbiAgfSApO1xyXG4gIGNvbnN0IG51bWJlckRpc3BsYXlUaW1lUmljaCA9IG5ldyBOdW1iZXJEaXNwbGF5KCBwcm9wZXJ0eSwgcmFuZ2UsIHtcclxuICAgIG51bWJlckZvcm1hdHRlcjogU3RvcHdhdGNoTm9kZS5SSUNIX1RFWFRfTUlOVVRFU19BTkRfU0VDT05EUyxcclxuICAgIG51bWJlckZvcm1hdHRlckRlcGVuZGVuY2llczogWyBTY2VuZXJ5UGhldFN0cmluZ3Muc3RvcHdhdGNoVmFsdWVVbml0c1BhdHRlcm5TdHJpbmdQcm9wZXJ0eSBdLFxyXG4gICAgdXNlUmljaFRleHQ6IHRydWUsXHJcbiAgICBhbGlnbjogJ2NlbnRlcidcclxuICB9ICk7XHJcblxyXG4gIC8vIFRlc3Qgc2hyaW5raW5nIHRvIGZpdFxyXG4gIGNvbnN0IG51bWJlckRpc3BsYXlUaW1lUmljaFVuaXRzID0gbmV3IE51bWJlckRpc3BsYXkoIHByb3BlcnR5LCBuZXcgUmFuZ2UoIDAsIDEwICksIHtcclxuICAgIG51bWJlckZvcm1hdHRlcjogU3RvcHdhdGNoTm9kZS5jcmVhdGVSaWNoVGV4dE51bWJlckZvcm1hdHRlcigge1xyXG4gICAgICB1bml0czogJ2hvdXJzJ1xyXG4gICAgfSApLFxyXG4gICAgbnVtYmVyRm9ybWF0dGVyRGVwZW5kZW5jaWVzOiBbIFNjZW5lcnlQaGV0U3RyaW5ncy5zdG9wd2F0Y2hWYWx1ZVVuaXRzUGF0dGVyblN0cmluZ1Byb3BlcnR5IF0sXHJcbiAgICB1c2VSaWNoVGV4dDogdHJ1ZSxcclxuICAgIGFsaWduOiAnY2VudGVyJ1xyXG4gIH0gKTtcclxuICBjb25zdCBzbGlkZXIgPSBuZXcgSFNsaWRlciggcHJvcGVydHksIHJhbmdlLCB7XHJcbiAgICB0cmFja1NpemU6IG5ldyBEaW1lbnNpb24yKCA0MDAsIDUgKVxyXG4gIH0gKTtcclxuXHJcbiAgcmV0dXJuIG5ldyBWQm94KCB7XHJcbiAgICBzcGFjaW5nOiAzMCxcclxuICAgIGNoaWxkcmVuOiBbIG5vVmFsdWVEaXNwbGF5LCBudW1iZXJEaXNwbGF5LCBudW1iZXJEaXNwbGF5VGltZSwgbnVtYmVyRGlzcGxheVRpbWVSaWNoLCBudW1iZXJEaXNwbGF5VGltZVJpY2hVbml0cywgc2xpZGVyIF0sXHJcbiAgICBjZW50ZXI6IGxheW91dEJvdW5kcy5jZW50ZXJcclxuICB9ICk7XHJcbn0iXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsYUFBYSxN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