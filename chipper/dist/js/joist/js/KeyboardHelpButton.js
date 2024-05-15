// Copyright 2016-2024, University of Colorado Boulder

/**
 * The button that pops up the Keyboard Help Dialog, which appears in the right side of the navbar and
 * to the left of the PhetButton.
 *
 * @author Jesse Greenberg
 */

import optionize from '../../phet-core/js/optionize.js';
import { Color, Image } from '../../scenery/js/imports.js';
import Dialog from '../../sun/js/Dialog.js';
import PhetioCapsule from '../../tandem/js/PhetioCapsule.js';
import keyboardIconOnWhite_png from '../images/keyboardIconOnWhite_png.js'; // on a white navbar
import keyboardIcon_png from '../images/keyboardIcon_png.js'; // on a black navbar
import joist from './joist.js';
import JoistButton from './JoistButton.js';
import JoistStrings from './JoistStrings.js';
import KeyboardHelpDialog from './KeyboardHelpDialog.js';
// constants
const keyboardShortcutsStringProperty = JoistStrings.a11y.keyboardHelp.keyboardShortcutsStringProperty;
const ICON_DESIRED_HEIGHT = 17.085; // empirically determined

class KeyboardHelpButton extends JoistButton {
  constructor(screens, screenProperty, backgroundColorProperty, providedOptions) {
    const options = optionize()({
      highlightExtensionWidth: 5 + 3.6,
      highlightExtensionHeight: 10,
      // The keyboard button is not vertically symmetric, due to the cable on the top.
      // This offset adjusts the body of the keyboard to be in the center, so it
      // will align with the speaker button and the PhET logo
      highlightCenterOffsetY: 2,
      // phet-io
      visiblePropertyOptions: {
        phetioFeatured: true
      },
      // pdom
      innerContent: keyboardShortcutsStringProperty,
      // voicing
      voicingNameResponse: keyboardShortcutsStringProperty
    }, providedOptions);
    let keyboardHelpDialogCapsule = null; // set after calling super
    options.listener = () => {
      assert && assert(keyboardHelpDialogCapsule);
      const keyboardHelpDialog = keyboardHelpDialogCapsule.getElement();
      keyboardHelpDialog.show();
    };
    const icon = new Image(keyboardIcon_png, {
      scale: ICON_DESIRED_HEIGHT / keyboardIcon_png.height,
      pickable: false
    });
    super(icon, backgroundColorProperty, options);
    keyboardHelpDialogCapsule = new PhetioCapsule(tandem => {
      return new KeyboardHelpDialog(screens, screenProperty, {
        tandem: tandem,
        focusOnHideNode: this
      });
    }, [], {
      tandem: options.tandem.createTandem('keyboardHelpDialogCapsule'),
      phetioType: PhetioCapsule.PhetioCapsuleIO(Dialog.DialogIO),
      disposeOnClear: false
    });

    // change the icon so that it is visible when the background changes from dark to light
    backgroundColorProperty.link(backgroundColor => {
      icon.image = backgroundColor.equals(Color.BLACK) ? keyboardIcon_png : keyboardIconOnWhite_png;
    });

    // support for binder documentation, stripped out in builds and only runs when ?binder is specified
    assert && phet?.chipper?.queryParameters?.binder && keyboardHelpDialogCapsule.getElement();
  }
}
joist.register('KeyboardHelpButton', KeyboardHelpButton);
export default KeyboardHelpButton;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJvcHRpb25pemUiLCJDb2xvciIsIkltYWdlIiwiRGlhbG9nIiwiUGhldGlvQ2Fwc3VsZSIsImtleWJvYXJkSWNvbk9uV2hpdGVfcG5nIiwia2V5Ym9hcmRJY29uX3BuZyIsImpvaXN0IiwiSm9pc3RCdXR0b24iLCJKb2lzdFN0cmluZ3MiLCJLZXlib2FyZEhlbHBEaWFsb2ciLCJrZXlib2FyZFNob3J0Y3V0c1N0cmluZ1Byb3BlcnR5IiwiYTExeSIsImtleWJvYXJkSGVscCIsIklDT05fREVTSVJFRF9IRUlHSFQiLCJLZXlib2FyZEhlbHBCdXR0b24iLCJjb25zdHJ1Y3RvciIsInNjcmVlbnMiLCJzY3JlZW5Qcm9wZXJ0eSIsImJhY2tncm91bmRDb2xvclByb3BlcnR5IiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsImhpZ2hsaWdodEV4dGVuc2lvbldpZHRoIiwiaGlnaGxpZ2h0RXh0ZW5zaW9uSGVpZ2h0IiwiaGlnaGxpZ2h0Q2VudGVyT2Zmc2V0WSIsInZpc2libGVQcm9wZXJ0eU9wdGlvbnMiLCJwaGV0aW9GZWF0dXJlZCIsImlubmVyQ29udGVudCIsInZvaWNpbmdOYW1lUmVzcG9uc2UiLCJrZXlib2FyZEhlbHBEaWFsb2dDYXBzdWxlIiwibGlzdGVuZXIiLCJhc3NlcnQiLCJrZXlib2FyZEhlbHBEaWFsb2ciLCJnZXRFbGVtZW50Iiwic2hvdyIsImljb24iLCJzY2FsZSIsImhlaWdodCIsInBpY2thYmxlIiwidGFuZGVtIiwiZm9jdXNPbkhpZGVOb2RlIiwiY3JlYXRlVGFuZGVtIiwicGhldGlvVHlwZSIsIlBoZXRpb0NhcHN1bGVJTyIsIkRpYWxvZ0lPIiwiZGlzcG9zZU9uQ2xlYXIiLCJsaW5rIiwiYmFja2dyb3VuZENvbG9yIiwiaW1hZ2UiLCJlcXVhbHMiLCJCTEFDSyIsInBoZXQiLCJjaGlwcGVyIiwicXVlcnlQYXJhbWV0ZXJzIiwiYmluZGVyIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJLZXlib2FyZEhlbHBCdXR0b24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTYtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVGhlIGJ1dHRvbiB0aGF0IHBvcHMgdXAgdGhlIEtleWJvYXJkIEhlbHAgRGlhbG9nLCB3aGljaCBhcHBlYXJzIGluIHRoZSByaWdodCBzaWRlIG9mIHRoZSBuYXZiYXIgYW5kXHJcbiAqIHRvIHRoZSBsZWZ0IG9mIHRoZSBQaGV0QnV0dG9uLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZ1xyXG4gKi9cclxuXHJcbmltcG9ydCBQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBFbXB0eVNlbGZPcHRpb25zIH0gZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCB7IENvbG9yLCBJbWFnZSB9IGZyb20gJy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBEaWFsb2cgZnJvbSAnLi4vLi4vc3VuL2pzL0RpYWxvZy5qcyc7XHJcbmltcG9ydCBQaGV0aW9DYXBzdWxlIGZyb20gJy4uLy4uL3RhbmRlbS9qcy9QaGV0aW9DYXBzdWxlLmpzJztcclxuaW1wb3J0IGtleWJvYXJkSWNvbk9uV2hpdGVfcG5nIGZyb20gJy4uL2ltYWdlcy9rZXlib2FyZEljb25PbldoaXRlX3BuZy5qcyc7IC8vIG9uIGEgd2hpdGUgbmF2YmFyXHJcbmltcG9ydCBrZXlib2FyZEljb25fcG5nIGZyb20gJy4uL2ltYWdlcy9rZXlib2FyZEljb25fcG5nLmpzJzsgLy8gb24gYSBibGFjayBuYXZiYXJcclxuaW1wb3J0IGpvaXN0IGZyb20gJy4vam9pc3QuanMnO1xyXG5pbXBvcnQgSm9pc3RCdXR0b24sIHsgSm9pc3RCdXR0b25PcHRpb25zIH0gZnJvbSAnLi9Kb2lzdEJ1dHRvbi5qcyc7XHJcbmltcG9ydCBKb2lzdFN0cmluZ3MgZnJvbSAnLi9Kb2lzdFN0cmluZ3MuanMnO1xyXG5pbXBvcnQgS2V5Ym9hcmRIZWxwRGlhbG9nIGZyb20gJy4vS2V5Ym9hcmRIZWxwRGlhbG9nLmpzJztcclxuaW1wb3J0IHsgQW55U2NyZWVuIH0gZnJvbSAnLi9TY3JlZW4uanMnO1xyXG5pbXBvcnQgUGlja1JlcXVpcmVkIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9QaWNrUmVxdWlyZWQuanMnO1xyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3Qga2V5Ym9hcmRTaG9ydGN1dHNTdHJpbmdQcm9wZXJ0eSA9IEpvaXN0U3RyaW5ncy5hMTF5LmtleWJvYXJkSGVscC5rZXlib2FyZFNob3J0Y3V0c1N0cmluZ1Byb3BlcnR5O1xyXG5jb25zdCBJQ09OX0RFU0lSRURfSEVJR0hUID0gMTcuMDg1OyAvLyBlbXBpcmljYWxseSBkZXRlcm1pbmVkXHJcblxyXG50eXBlIFNlbGZPcHRpb25zID0gRW1wdHlTZWxmT3B0aW9ucztcclxuZXhwb3J0IHR5cGUgS2V5Ym9hcmRIZWxwQnV0dG9uT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgUGlja1JlcXVpcmVkPEpvaXN0QnV0dG9uT3B0aW9ucywgJ3RhbmRlbSc+ICYgUGljazxKb2lzdEJ1dHRvbk9wdGlvbnMsICdwb2ludGVyQXJlYURpbGF0aW9uWCcgfCAncG9pbnRlckFyZWFEaWxhdGlvblknPjtcclxuXHJcbmNsYXNzIEtleWJvYXJkSGVscEJ1dHRvbiBleHRlbmRzIEpvaXN0QnV0dG9uIHtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBzY3JlZW5zOiBBbnlTY3JlZW5bXSwgc2NyZWVuUHJvcGVydHk6IFByb3BlcnR5PEFueVNjcmVlbj4sXHJcbiAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3JQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8Q29sb3I+LFxyXG4gICAgICAgICAgICAgICAgICAgICAgcHJvdmlkZWRPcHRpb25zOiBLZXlib2FyZEhlbHBCdXR0b25PcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8S2V5Ym9hcmRIZWxwQnV0dG9uT3B0aW9ucywgU2VsZk9wdGlvbnMsIEpvaXN0QnV0dG9uT3B0aW9ucz4oKSgge1xyXG4gICAgICBoaWdobGlnaHRFeHRlbnNpb25XaWR0aDogNSArIDMuNixcclxuICAgICAgaGlnaGxpZ2h0RXh0ZW5zaW9uSGVpZ2h0OiAxMCxcclxuXHJcbiAgICAgIC8vIFRoZSBrZXlib2FyZCBidXR0b24gaXMgbm90IHZlcnRpY2FsbHkgc3ltbWV0cmljLCBkdWUgdG8gdGhlIGNhYmxlIG9uIHRoZSB0b3AuXHJcbiAgICAgIC8vIFRoaXMgb2Zmc2V0IGFkanVzdHMgdGhlIGJvZHkgb2YgdGhlIGtleWJvYXJkIHRvIGJlIGluIHRoZSBjZW50ZXIsIHNvIGl0XHJcbiAgICAgIC8vIHdpbGwgYWxpZ24gd2l0aCB0aGUgc3BlYWtlciBidXR0b24gYW5kIHRoZSBQaEVUIGxvZ29cclxuICAgICAgaGlnaGxpZ2h0Q2VudGVyT2Zmc2V0WTogMixcclxuXHJcbiAgICAgIC8vIHBoZXQtaW9cclxuICAgICAgdmlzaWJsZVByb3BlcnR5T3B0aW9uczogeyBwaGV0aW9GZWF0dXJlZDogdHJ1ZSB9LFxyXG5cclxuICAgICAgLy8gcGRvbVxyXG4gICAgICBpbm5lckNvbnRlbnQ6IGtleWJvYXJkU2hvcnRjdXRzU3RyaW5nUHJvcGVydHksXHJcblxyXG4gICAgICAvLyB2b2ljaW5nXHJcbiAgICAgIHZvaWNpbmdOYW1lUmVzcG9uc2U6IGtleWJvYXJkU2hvcnRjdXRzU3RyaW5nUHJvcGVydHlcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIGxldCBrZXlib2FyZEhlbHBEaWFsb2dDYXBzdWxlOiBQaGV0aW9DYXBzdWxlPEtleWJvYXJkSGVscERpYWxvZz4gfCBudWxsID0gbnVsbDsgLy8gc2V0IGFmdGVyIGNhbGxpbmcgc3VwZXJcclxuICAgIG9wdGlvbnMubGlzdGVuZXIgPSAoKSA9PiB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGtleWJvYXJkSGVscERpYWxvZ0NhcHN1bGUgKTtcclxuXHJcbiAgICAgIGNvbnN0IGtleWJvYXJkSGVscERpYWxvZyA9IGtleWJvYXJkSGVscERpYWxvZ0NhcHN1bGUhLmdldEVsZW1lbnQoKTtcclxuXHJcbiAgICAgIGtleWJvYXJkSGVscERpYWxvZy5zaG93KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IGljb24gPSBuZXcgSW1hZ2UoIGtleWJvYXJkSWNvbl9wbmcsIHtcclxuICAgICAgc2NhbGU6IElDT05fREVTSVJFRF9IRUlHSFQgLyBrZXlib2FyZEljb25fcG5nLmhlaWdodCxcclxuICAgICAgcGlja2FibGU6IGZhbHNlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgc3VwZXIoIGljb24sIGJhY2tncm91bmRDb2xvclByb3BlcnR5LCBvcHRpb25zICk7XHJcblxyXG4gICAga2V5Ym9hcmRIZWxwRGlhbG9nQ2Fwc3VsZSA9IG5ldyBQaGV0aW9DYXBzdWxlPEtleWJvYXJkSGVscERpYWxvZz4oIHRhbmRlbSA9PiB7XHJcbiAgICAgIHJldHVybiBuZXcgS2V5Ym9hcmRIZWxwRGlhbG9nKCBzY3JlZW5zLCBzY3JlZW5Qcm9wZXJ0eSwge1xyXG4gICAgICAgIHRhbmRlbTogdGFuZGVtLFxyXG4gICAgICAgIGZvY3VzT25IaWRlTm9kZTogdGhpc1xyXG4gICAgICB9ICk7XHJcbiAgICB9LCBbXSwge1xyXG4gICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ2tleWJvYXJkSGVscERpYWxvZ0NhcHN1bGUnICksXHJcbiAgICAgIHBoZXRpb1R5cGU6IFBoZXRpb0NhcHN1bGUuUGhldGlvQ2Fwc3VsZUlPKCBEaWFsb2cuRGlhbG9nSU8gKSxcclxuICAgICAgZGlzcG9zZU9uQ2xlYXI6IGZhbHNlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gY2hhbmdlIHRoZSBpY29uIHNvIHRoYXQgaXQgaXMgdmlzaWJsZSB3aGVuIHRoZSBiYWNrZ3JvdW5kIGNoYW5nZXMgZnJvbSBkYXJrIHRvIGxpZ2h0XHJcbiAgICBiYWNrZ3JvdW5kQ29sb3JQcm9wZXJ0eS5saW5rKCBiYWNrZ3JvdW5kQ29sb3IgPT4ge1xyXG4gICAgICBpY29uLmltYWdlID0gYmFja2dyb3VuZENvbG9yLmVxdWFscyggQ29sb3IuQkxBQ0sgKSA/IGtleWJvYXJkSWNvbl9wbmcgOiBrZXlib2FyZEljb25PbldoaXRlX3BuZztcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBzdXBwb3J0IGZvciBiaW5kZXIgZG9jdW1lbnRhdGlvbiwgc3RyaXBwZWQgb3V0IGluIGJ1aWxkcyBhbmQgb25seSBydW5zIHdoZW4gP2JpbmRlciBpcyBzcGVjaWZpZWRcclxuICAgIGFzc2VydCAmJiBwaGV0Py5jaGlwcGVyPy5xdWVyeVBhcmFtZXRlcnM/LmJpbmRlciAmJiBrZXlib2FyZEhlbHBEaWFsb2dDYXBzdWxlLmdldEVsZW1lbnQoKTtcclxuICB9XHJcbn1cclxuXHJcbmpvaXN0LnJlZ2lzdGVyKCAnS2V5Ym9hcmRIZWxwQnV0dG9uJywgS2V5Ym9hcmRIZWxwQnV0dG9uICk7XHJcbmV4cG9ydCBkZWZhdWx0IEtleWJvYXJkSGVscEJ1dHRvbjsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQSxPQUFPQSxTQUFTLE1BQTRCLGlDQUFpQztBQUM3RSxTQUFTQyxLQUFLLEVBQUVDLEtBQUssUUFBUSw2QkFBNkI7QUFDMUQsT0FBT0MsTUFBTSxNQUFNLHdCQUF3QjtBQUMzQyxPQUFPQyxhQUFhLE1BQU0sa0NBQWtDO0FBQzVELE9BQU9DLHVCQUF1QixNQUFNLHNDQUFzQyxDQUFDLENBQUM7QUFDNUUsT0FBT0MsZ0JBQWdCLE1BQU0sK0JBQStCLENBQUMsQ0FBQztBQUM5RCxPQUFPQyxLQUFLLE1BQU0sWUFBWTtBQUM5QixP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