// Copyright 2021-2024, University of Colorado Boulder

/**
 * RichText that composes ReadingBlock, adding support for Voicing and input listeners that speak content upon
 * user activation.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import optionize from '../../../../../phet-core/js/optionize.js';
import { ReadingBlock, ReadingBlockHighlight, RichText, scenery } from '../../../imports.js';

// focusHighlight will always be set by this class

class VoicingRichText extends ReadingBlock(RichText) {
  constructor(text, providedOptions) {
    const options = optionize()({
      // {string|null} - if provided, alternative text that will be read that is different from the
      // visually displayed text
      readingBlockNameResponse: text,
      // pdom
      innerContent: text,
      // voicing
      // default tag name for a ReadingBlock, but there are cases where you may want to override this (such as
      // RichText links)
      readingBlockTagName: 'button'
    }, providedOptions);
    super(text, options);
    this.focusHighlight = new ReadingBlockHighlight(this);
  }
}
scenery.register('VoicingRichText', VoicingRichText);
export default VoicingRichText;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJvcHRpb25pemUiLCJSZWFkaW5nQmxvY2siLCJSZWFkaW5nQmxvY2tIaWdobGlnaHQiLCJSaWNoVGV4dCIsInNjZW5lcnkiLCJWb2ljaW5nUmljaFRleHQiLCJjb25zdHJ1Y3RvciIsInRleHQiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwicmVhZGluZ0Jsb2NrTmFtZVJlc3BvbnNlIiwiaW5uZXJDb250ZW50IiwicmVhZGluZ0Jsb2NrVGFnTmFtZSIsImZvY3VzSGlnaGxpZ2h0IiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJWb2ljaW5nUmljaFRleHQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUmljaFRleHQgdGhhdCBjb21wb3NlcyBSZWFkaW5nQmxvY2ssIGFkZGluZyBzdXBwb3J0IGZvciBWb2ljaW5nIGFuZCBpbnB1dCBsaXN0ZW5lcnMgdGhhdCBzcGVhayBjb250ZW50IHVwb25cclxuICogdXNlciBhY3RpdmF0aW9uLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUsIHsgRW1wdHlTZWxmT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgeyBSZWFkaW5nQmxvY2ssIFJlYWRpbmdCbG9ja0hpZ2hsaWdodCwgUmVhZGluZ0Jsb2NrT3B0aW9ucywgUmljaFRleHQsIFJpY2hUZXh0T3B0aW9ucywgc2NlbmVyeSB9IGZyb20gJy4uLy4uLy4uL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgU3RyaWN0T21pdCBmcm9tICcuLi8uLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvU3RyaWN0T21pdC5qcyc7XHJcblxyXG50eXBlIFNlbGZPcHRpb25zID0gRW1wdHlTZWxmT3B0aW9ucztcclxuXHJcbi8vIGZvY3VzSGlnaGxpZ2h0IHdpbGwgYWx3YXlzIGJlIHNldCBieSB0aGlzIGNsYXNzXHJcbnR5cGUgUGFyZW50T3B0aW9ucyA9IFJlYWRpbmdCbG9ja09wdGlvbnMgJiBTdHJpY3RPbWl0PFJpY2hUZXh0T3B0aW9ucywgJ2ZvY3VzSGlnaGxpZ2h0Jz47XHJcbmV4cG9ydCB0eXBlIFZvaWNpbmdSaWNoVGV4dE9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIFBhcmVudE9wdGlvbnM7XHJcblxyXG5jbGFzcyBWb2ljaW5nUmljaFRleHQgZXh0ZW5kcyBSZWFkaW5nQmxvY2soIFJpY2hUZXh0ICkge1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHRleHQ6IHN0cmluZyB8IFRSZWFkT25seVByb3BlcnR5PHN0cmluZz4sIHByb3ZpZGVkT3B0aW9ucz86IFZvaWNpbmdSaWNoVGV4dE9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxWb2ljaW5nUmljaFRleHRPcHRpb25zLCBTZWxmT3B0aW9ucywgUGFyZW50T3B0aW9ucz4oKSgge1xyXG5cclxuICAgICAgLy8ge3N0cmluZ3xudWxsfSAtIGlmIHByb3ZpZGVkLCBhbHRlcm5hdGl2ZSB0ZXh0IHRoYXQgd2lsbCBiZSByZWFkIHRoYXQgaXMgZGlmZmVyZW50IGZyb20gdGhlXHJcbiAgICAgIC8vIHZpc3VhbGx5IGRpc3BsYXllZCB0ZXh0XHJcbiAgICAgIHJlYWRpbmdCbG9ja05hbWVSZXNwb25zZTogdGV4dCxcclxuXHJcbiAgICAgIC8vIHBkb21cclxuICAgICAgaW5uZXJDb250ZW50OiB0ZXh0LFxyXG5cclxuICAgICAgLy8gdm9pY2luZ1xyXG4gICAgICAvLyBkZWZhdWx0IHRhZyBuYW1lIGZvciBhIFJlYWRpbmdCbG9jaywgYnV0IHRoZXJlIGFyZSBjYXNlcyB3aGVyZSB5b3UgbWF5IHdhbnQgdG8gb3ZlcnJpZGUgdGhpcyAoc3VjaCBhc1xyXG4gICAgICAvLyBSaWNoVGV4dCBsaW5rcylcclxuICAgICAgcmVhZGluZ0Jsb2NrVGFnTmFtZTogJ2J1dHRvbidcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIHN1cGVyKCB0ZXh0LCBvcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy5mb2N1c0hpZ2hsaWdodCA9IG5ldyBSZWFkaW5nQmxvY2tIaWdobGlnaHQoIHRoaXMgKTtcclxuICB9XHJcbn1cclxuXHJcbnNjZW5lcnkucmVnaXN0ZXIoICdWb2ljaW5nUmljaFRleHQnLCBWb2ljaW5nUmljaFRleHQgKTtcclxuZXhwb3J0IGRlZmF1bHQgVm9pY2luZ1JpY2hUZXh0OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUdBLE9BQU9BLFNBQVMsTUFBNEIsMENBQTBDO0FBQ3RGLFNBQVNDLFlBQVksRUFBRUMscUJBQXFCLEVBQXVCQyxRQUFRLEVBQW1CQyxPQUFPLFFBQVEscUJBQXFCOztBQUtsSTs7QUFJQSxNQUFNQyxlQUFlLFNBQVNKLFlBQVksQ0FBRUUsUUFBUyxDQUFDLENBQUM7RUFFOUNHLFdBQVdBLENBQUVDLElBQXdDLEVBQUVDLGVBQXdDLEVBQUc7SUFFdkcsTUFBTUMsT0FBTyxHQUFHVCxTQUFTLENBQXFELENBQUMsQ0FBRTtNQUUvRTtNQUNBO01BQ0FVLHdCQUF3QixFQUFFSCxJQUFJO01BRTlCO01BQ0FJLFlBQVksRUFBRUosSUFBSTtNQUVsQjtNQUNBO01BQ0E7TUFDQUssbUJBQW1CLEVBQUU7SUFDdkIsQ0FBQyxFQUFFSixlQUFnQixDQUFDO0lBRXBCLEtBQUssQ0FBRUQsSUFBSSxFQUFFRSxPQUFRLENBQUM7SUFFdEIsSUFBSSxDQUFDSSxjQUFjLEdBQUcsSUFBSVgscUJBQXFCLENBQUUsSUFBSyxDQUFDO0VBQ3pEO0FBQ0Y7QUFFQUUsT0FBTyxDQUFDVSxRQUFRLENBQUUsaUJBQWlCLEVBQUVULGVBQWdCLENBQUM7QUFDdEQsZUFBZUEsZUFBZSIsImlnbm9yZUxpc3QiOltdfQ==