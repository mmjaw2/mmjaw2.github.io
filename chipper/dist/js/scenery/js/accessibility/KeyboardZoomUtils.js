// Copyright 2019-2023, University of Colorado Boulder

/**
 * Utilities specific to the keyboard for handling zoom/pan control.
 *
 * @author Jesse Greenberg
 */

import { KeyboardUtils, scenery } from '../imports.js';
const KeyboardZoomUtils = {
  /**
   * Returns true if the platform is most likely a Mac device. Pan/Zoom will use different modifier keys in this case.
   *
   * TODO: Move to platform if generally useful? https://github.com/phetsims/scenery/issues/1581
   */
  isPlatformMac: () => {
    return _.includes(window.navigator.platform, 'Mac');
  },
  /**
   * Get the 'meta' key for the platform that would indicate user wants to zoom. This is 'metaKey' on Mac and 'ctrl'
   * on Windows.
   *
   */
  getPlatformZoomMetaKey: () => {
    return KeyboardZoomUtils.isPlatformMac() ? 'metaKey' : 'ctrlKey';
  },
  /**
   * Returns true of the keyboard input indicates that a zoom command was initiated. Different keys are checked
   * on mac devices (which go through the Cmd key) and windows devices (which use the ctrl modifier).
   *
   * @param event
   * @param zoomIn - do you want to check for zoom in or zoom out?
   */
  isZoomCommand: (event, zoomIn) => {
    const zoomKey = zoomIn ? KeyboardUtils.KEY_EQUALS : KeyboardUtils.KEY_MINUS;
    const metaKey = KeyboardZoomUtils.getPlatformZoomMetaKey();

    // @ts-expect-error
    return event[metaKey] && KeyboardUtils.isKeyEvent(event, zoomKey);
  },
  /**
   * Returns true if the keyboard command indicates a "zoom reset". This is ctrl + 0 on Win and cmd + 0 on mac.
   */
  isZoomResetCommand: event => {
    const metaKey = KeyboardZoomUtils.getPlatformZoomMetaKey();

    // @ts-expect-error
    return event[metaKey] && KeyboardUtils.isKeyEvent(event, KeyboardUtils.KEY_0);
  }
};
scenery.register('KeyboardZoomUtils', KeyboardZoomUtils);
export default KeyboardZoomUtils;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJLZXlib2FyZFV0aWxzIiwic2NlbmVyeSIsIktleWJvYXJkWm9vbVV0aWxzIiwiaXNQbGF0Zm9ybU1hYyIsIl8iLCJpbmNsdWRlcyIsIndpbmRvdyIsIm5hdmlnYXRvciIsInBsYXRmb3JtIiwiZ2V0UGxhdGZvcm1ab29tTWV0YUtleSIsImlzWm9vbUNvbW1hbmQiLCJldmVudCIsInpvb21JbiIsInpvb21LZXkiLCJLRVlfRVFVQUxTIiwiS0VZX01JTlVTIiwibWV0YUtleSIsImlzS2V5RXZlbnQiLCJpc1pvb21SZXNldENvbW1hbmQiLCJLRVlfMCIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiS2V5Ym9hcmRab29tVXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVXRpbGl0aWVzIHNwZWNpZmljIHRvIHRoZSBrZXlib2FyZCBmb3IgaGFuZGxpbmcgem9vbS9wYW4gY29udHJvbC5cclxuICpcclxuICogQGF1dGhvciBKZXNzZSBHcmVlbmJlcmdcclxuICovXHJcblxyXG5pbXBvcnQgeyBLZXlib2FyZFV0aWxzLCBzY2VuZXJ5IH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcblxyXG5jb25zdCBLZXlib2FyZFpvb21VdGlscyA9IHtcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBwbGF0Zm9ybSBpcyBtb3N0IGxpa2VseSBhIE1hYyBkZXZpY2UuIFBhbi9ab29tIHdpbGwgdXNlIGRpZmZlcmVudCBtb2RpZmllciBrZXlzIGluIHRoaXMgY2FzZS5cclxuICAgKlxyXG4gICAqIFRPRE86IE1vdmUgdG8gcGxhdGZvcm0gaWYgZ2VuZXJhbGx5IHVzZWZ1bD8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgKi9cclxuICBpc1BsYXRmb3JtTWFjOiAoKTogYm9vbGVhbiA9PiB7XHJcbiAgICByZXR1cm4gXy5pbmNsdWRlcyggd2luZG93Lm5hdmlnYXRvci5wbGF0Zm9ybSwgJ01hYycgKTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlICdtZXRhJyBrZXkgZm9yIHRoZSBwbGF0Zm9ybSB0aGF0IHdvdWxkIGluZGljYXRlIHVzZXIgd2FudHMgdG8gem9vbS4gVGhpcyBpcyAnbWV0YUtleScgb24gTWFjIGFuZCAnY3RybCdcclxuICAgKiBvbiBXaW5kb3dzLlxyXG4gICAqXHJcbiAgICovXHJcbiAgZ2V0UGxhdGZvcm1ab29tTWV0YUtleTogKCk6IHN0cmluZyA9PiB7XHJcbiAgICByZXR1cm4gS2V5Ym9hcmRab29tVXRpbHMuaXNQbGF0Zm9ybU1hYygpID8gJ21ldGFLZXknIDogJ2N0cmxLZXknO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdHJ1ZSBvZiB0aGUga2V5Ym9hcmQgaW5wdXQgaW5kaWNhdGVzIHRoYXQgYSB6b29tIGNvbW1hbmQgd2FzIGluaXRpYXRlZC4gRGlmZmVyZW50IGtleXMgYXJlIGNoZWNrZWRcclxuICAgKiBvbiBtYWMgZGV2aWNlcyAod2hpY2ggZ28gdGhyb3VnaCB0aGUgQ21kIGtleSkgYW5kIHdpbmRvd3MgZGV2aWNlcyAod2hpY2ggdXNlIHRoZSBjdHJsIG1vZGlmaWVyKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBldmVudFxyXG4gICAqIEBwYXJhbSB6b29tSW4gLSBkbyB5b3Ugd2FudCB0byBjaGVjayBmb3Igem9vbSBpbiBvciB6b29tIG91dD9cclxuICAgKi9cclxuICBpc1pvb21Db21tYW5kOiAoIGV2ZW50OiBFdmVudCwgem9vbUluOiBib29sZWFuICk6IGJvb2xlYW4gPT4ge1xyXG4gICAgY29uc3Qgem9vbUtleSA9IHpvb21JbiA/IEtleWJvYXJkVXRpbHMuS0VZX0VRVUFMUyA6IEtleWJvYXJkVXRpbHMuS0VZX01JTlVTO1xyXG4gICAgY29uc3QgbWV0YUtleSA9IEtleWJvYXJkWm9vbVV0aWxzLmdldFBsYXRmb3JtWm9vbU1ldGFLZXkoKTtcclxuXHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICByZXR1cm4gZXZlbnRbIG1ldGFLZXkgXSAmJiBLZXlib2FyZFV0aWxzLmlzS2V5RXZlbnQoIGV2ZW50LCB6b29tS2V5ICk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBrZXlib2FyZCBjb21tYW5kIGluZGljYXRlcyBhIFwiem9vbSByZXNldFwiLiBUaGlzIGlzIGN0cmwgKyAwIG9uIFdpbiBhbmQgY21kICsgMCBvbiBtYWMuXHJcbiAgICovXHJcbiAgaXNab29tUmVzZXRDb21tYW5kOiAoIGV2ZW50OiBFdmVudCApOiBib29sZWFuID0+IHtcclxuICAgIGNvbnN0IG1ldGFLZXkgPSBLZXlib2FyZFpvb21VdGlscy5nZXRQbGF0Zm9ybVpvb21NZXRhS2V5KCk7XHJcblxyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgcmV0dXJuIGV2ZW50WyBtZXRhS2V5IF0gJiYgS2V5Ym9hcmRVdGlscy5pc0tleUV2ZW50KCBldmVudCwgS2V5Ym9hcmRVdGlscy5LRVlfMCApO1xyXG4gIH1cclxufTtcclxuXHJcbnNjZW5lcnkucmVnaXN0ZXIoICdLZXlib2FyZFpvb21VdGlscycsIEtleWJvYXJkWm9vbVV0aWxzICk7XHJcbmV4cG9ydCBkZWZhdWx0IEtleWJvYXJkWm9vbVV0aWxzOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxTQUFTQSxhQUFhLEVBQUVDLE9BQU8sUUFBUSxlQUFlO0FBRXRELE1BQU1DLGlCQUFpQixHQUFHO0VBRXhCO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRUMsYUFBYSxFQUFFQSxDQUFBLEtBQWU7SUFDNUIsT0FBT0MsQ0FBQyxDQUFDQyxRQUFRLENBQUVDLE1BQU0sQ0FBQ0MsU0FBUyxDQUFDQyxRQUFRLEVBQUUsS0FBTSxDQUFDO0VBQ3ZELENBQUM7RUFFRDtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0VDLHNCQUFzQixFQUFFQSxDQUFBLEtBQWM7SUFDcEMsT0FBT1AsaUJBQWlCLENBQUNDLGFBQWEsQ0FBQyxDQUFDLEdBQUcsU0FBUyxHQUFHLFNBQVM7RUFDbEUsQ0FBQztFQUVEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0VPLGFBQWEsRUFBRUEsQ0FBRUMsS0FBWSxFQUFFQyxNQUFlLEtBQWU7SUFDM0QsTUFBTUMsT0FBTyxHQUFHRCxNQUFNLEdBQUdaLGFBQWEsQ0FBQ2MsVUFBVSxHQUFHZCxhQUFhLENBQUNlLFNBQVM7SUFDM0UsTUFBTUMsT0FBTyxHQUFHZCxpQkFBaUIsQ0FBQ08sc0JBQXNCLENBQUMsQ0FBQzs7SUFFMUQ7SUFDQSxPQUFPRSxLQUFLLENBQUVLLE9BQU8sQ0FBRSxJQUFJaEIsYUFBYSxDQUFDaUIsVUFBVSxDQUFFTixLQUFLLEVBQUVFLE9BQVEsQ0FBQztFQUN2RSxDQUFDO0VBRUQ7QUFDRjtBQUNBO0VBQ0VLLGtCQUFrQixFQUFJUCxLQUFZLElBQWU7SUFDL0MsTUFBTUssT0FBTyxHQUFHZCxpQkFBaUIsQ0FBQ08sc0JBQXNCLENBQUMsQ0FBQzs7SUFFMUQ7SUFDQSxPQUFPRSxLQUFLLENBQUVLLE9BQU8sQ0FBRSxJQUFJaEIsYUFBYSxDQUFDaUIsVUFBVSxDQUFFTixLQUFLLEVBQUVYLGFBQWEsQ0FBQ21CLEtBQU0sQ0FBQztFQUNuRjtBQUNGLENBQUM7QUFFRGxCLE9BQU8sQ0FBQ21CLFFBQVEsQ0FBRSxtQkFBbUIsRUFBRWxCLGlCQUFrQixDQUFDO0FBQzFELGVBQWVBLGlCQUFpQiIsImlnbm9yZUxpc3QiOltdfQ==