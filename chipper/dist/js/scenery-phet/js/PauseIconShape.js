// Copyright 2018-2022, University of Colorado Boulder

/**
 * Shape for the 'pause' icon that appears on buttons and other UI components.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import { Shape } from '../../kite/js/imports.js';
import sceneryPhet from './sceneryPhet.js';
export default class PauseIconShape extends Shape {
  constructor(width, height) {
    super();

    // 2 vertical bars
    const barWidth = width / 3;
    this.rect(0, 0, barWidth, height);
    this.rect(2 * barWidth, 0, barWidth, height);
  }
}
sceneryPhet.register('PauseIconShape', PauseIconShape);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTaGFwZSIsInNjZW5lcnlQaGV0IiwiUGF1c2VJY29uU2hhcGUiLCJjb25zdHJ1Y3RvciIsIndpZHRoIiwiaGVpZ2h0IiwiYmFyV2lkdGgiLCJyZWN0IiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJQYXVzZUljb25TaGFwZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBTaGFwZSBmb3IgdGhlICdwYXVzZScgaWNvbiB0aGF0IGFwcGVhcnMgb24gYnV0dG9ucyBhbmQgb3RoZXIgVUkgY29tcG9uZW50cy5cclxuICpcclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICovXHJcblxyXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gJy4uLy4uL2tpdGUvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBzY2VuZXJ5UGhldCBmcm9tICcuL3NjZW5lcnlQaGV0LmpzJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBhdXNlSWNvblNoYXBlIGV4dGVuZHMgU2hhcGUge1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyICkge1xyXG4gICAgc3VwZXIoKTtcclxuXHJcbiAgICAvLyAyIHZlcnRpY2FsIGJhcnNcclxuICAgIGNvbnN0IGJhcldpZHRoID0gd2lkdGggLyAzO1xyXG4gICAgdGhpcy5yZWN0KCAwLCAwLCBiYXJXaWR0aCwgaGVpZ2h0ICk7XHJcbiAgICB0aGlzLnJlY3QoIDIgKiBiYXJXaWR0aCwgMCwgYmFyV2lkdGgsIGhlaWdodCApO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeVBoZXQucmVnaXN0ZXIoICdQYXVzZUljb25TaGFwZScsIFBhdXNlSWNvblNoYXBlICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFNBQVNBLEtBQUssUUFBUSwwQkFBMEI7QUFDaEQsT0FBT0MsV0FBVyxNQUFNLGtCQUFrQjtBQUUxQyxlQUFlLE1BQU1DLGNBQWMsU0FBU0YsS0FBSyxDQUFDO0VBRXpDRyxXQUFXQSxDQUFFQyxLQUFhLEVBQUVDLE1BQWMsRUFBRztJQUNsRCxLQUFLLENBQUMsQ0FBQzs7SUFFUDtJQUNBLE1BQU1DLFFBQVEsR0FBR0YsS0FBSyxHQUFHLENBQUM7SUFDMUIsSUFBSSxDQUFDRyxJQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRUQsUUFBUSxFQUFFRCxNQUFPLENBQUM7SUFDbkMsSUFBSSxDQUFDRSxJQUFJLENBQUUsQ0FBQyxHQUFHRCxRQUFRLEVBQUUsQ0FBQyxFQUFFQSxRQUFRLEVBQUVELE1BQU8sQ0FBQztFQUNoRDtBQUNGO0FBRUFKLFdBQVcsQ0FBQ08sUUFBUSxDQUFFLGdCQUFnQixFQUFFTixjQUFlLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=