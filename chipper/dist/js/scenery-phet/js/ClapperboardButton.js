// Copyright 2022-2023, University of Colorado Boulder

/**
 * A Node that produces a variety of loud outputs to support data synchronizing during a recording.
 * This includes sound, visuals, and the PhET-iO data stream.
 *
 * This is prototype code and intended to be used in studies with users to assist with data collection.
 * Not a typical UI component.
 *
 * Next time this is used: Would be nice to emit a PhET-iO state when triggered
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
import OscillatorSoundGenerator from '../../tambo/js/sound-generators/OscillatorSoundGenerator.js';
import videoSolidShape from '../../sherpa/js/fontawesome-5/videoSolidShape.js';
import RectangularPushButton from '../../sun/js/buttons/RectangularPushButton.js';
import sceneryPhet from './sceneryPhet.js';
import { Node, Path, RichText } from '../../scenery/js/imports.js';
import soundManager from '../../tambo/js/soundManager.js';
import BackgroundNode from './BackgroundNode.js';
import stepTimer from '../../axon/js/stepTimer.js';
import Tandem from '../../tandem/js/Tandem.js';
const SOUND_DURATION = 1000;
const BUTTON_LABEL = 'Synchronize Recording';
class ClapperboardButton extends Node {
  constructor(providedOptions) {
    // A single waveform with a high pitch should hopefully be easy to find in recordings,
    // see https://github.com/phetsims/scenery-phet/issues/739#issuecomment-1142395903
    const soundGenerator = new OscillatorSoundGenerator({
      initialFrequency: 880
    });
    soundManager.addSoundGenerator(soundGenerator);
    const options = optionize()({
      excludeInvisibleChildrenFromBounds: true,
      visualNode: new BackgroundNode(new Path(videoSolidShape, {
        scale: 2,
        fill: 'red'
      }), {
        xMargin: 20,
        yMargin: 20,
        rectangleOptions: {
          fill: 'black',
          opacity: 1
        }
      }),
      synchronizeButtonOptions: {
        content: new RichText(BUTTON_LABEL),
        innerContent: BUTTON_LABEL,
        voicingNameResponse: BUTTON_LABEL,
        soundPlayer: {
          play: () => {
            soundGenerator.play();
          },
          stop: _.noop
        }
      },
      // phet-io
      tandem: Tandem.REQUIRED,
      tandemNameSuffix: 'Button'
    }, providedOptions);
    super(options);
    options.visualNode.visible = false;
    this.addChild(options.visualNode);
    const synchronizeButton = new RectangularPushButton(combineOptions({
      listener: () => {
        // so that this listener cannot be called more than once
        synchronizeButton.enabled = false;
        options.visualNode.visible = true;
        stepTimer.setTimeout(() => {
          options.visualNode.visible = false;
          soundGenerator.stop();
        }, SOUND_DURATION);
      },
      tandem: options.tandem.createTandem('synchronizeButton')
    }, options.synchronizeButtonOptions));
    this.addChild(synchronizeButton);
    this.disposeClapperboardButton = () => {
      synchronizeButton.dispose();
    };
  }
  dispose() {
    this.disposeClapperboardButton();
    super.dispose();
  }
}
sceneryPhet.register('ClapperboardButton', ClapperboardButton);
export default ClapperboardButton;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJvcHRpb25pemUiLCJjb21iaW5lT3B0aW9ucyIsIk9zY2lsbGF0b3JTb3VuZEdlbmVyYXRvciIsInZpZGVvU29saWRTaGFwZSIsIlJlY3Rhbmd1bGFyUHVzaEJ1dHRvbiIsInNjZW5lcnlQaGV0IiwiTm9kZSIsIlBhdGgiLCJSaWNoVGV4dCIsInNvdW5kTWFuYWdlciIsIkJhY2tncm91bmROb2RlIiwic3RlcFRpbWVyIiwiVGFuZGVtIiwiU09VTkRfRFVSQVRJT04iLCJCVVRUT05fTEFCRUwiLCJDbGFwcGVyYm9hcmRCdXR0b24iLCJjb25zdHJ1Y3RvciIsInByb3ZpZGVkT3B0aW9ucyIsInNvdW5kR2VuZXJhdG9yIiwiaW5pdGlhbEZyZXF1ZW5jeSIsImFkZFNvdW5kR2VuZXJhdG9yIiwib3B0aW9ucyIsImV4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMiLCJ2aXN1YWxOb2RlIiwic2NhbGUiLCJmaWxsIiwieE1hcmdpbiIsInlNYXJnaW4iLCJyZWN0YW5nbGVPcHRpb25zIiwib3BhY2l0eSIsInN5bmNocm9uaXplQnV0dG9uT3B0aW9ucyIsImNvbnRlbnQiLCJpbm5lckNvbnRlbnQiLCJ2b2ljaW5nTmFtZVJlc3BvbnNlIiwic291bmRQbGF5ZXIiLCJwbGF5Iiwic3RvcCIsIl8iLCJub29wIiwidGFuZGVtIiwiUkVRVUlSRUQiLCJ0YW5kZW1OYW1lU3VmZml4IiwidmlzaWJsZSIsImFkZENoaWxkIiwic3luY2hyb25pemVCdXR0b24iLCJsaXN0ZW5lciIsImVuYWJsZWQiLCJzZXRUaW1lb3V0IiwiY3JlYXRlVGFuZGVtIiwiZGlzcG9zZUNsYXBwZXJib2FyZEJ1dHRvbiIsImRpc3Bvc2UiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkNsYXBwZXJib2FyZEJ1dHRvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBIE5vZGUgdGhhdCBwcm9kdWNlcyBhIHZhcmlldHkgb2YgbG91ZCBvdXRwdXRzIHRvIHN1cHBvcnQgZGF0YSBzeW5jaHJvbml6aW5nIGR1cmluZyBhIHJlY29yZGluZy5cclxuICogVGhpcyBpbmNsdWRlcyBzb3VuZCwgdmlzdWFscywgYW5kIHRoZSBQaEVULWlPIGRhdGEgc3RyZWFtLlxyXG4gKlxyXG4gKiBUaGlzIGlzIHByb3RvdHlwZSBjb2RlIGFuZCBpbnRlbmRlZCB0byBiZSB1c2VkIGluIHN0dWRpZXMgd2l0aCB1c2VycyB0byBhc3Npc3Qgd2l0aCBkYXRhIGNvbGxlY3Rpb24uXHJcbiAqIE5vdCBhIHR5cGljYWwgVUkgY29tcG9uZW50LlxyXG4gKlxyXG4gKiBOZXh0IHRpbWUgdGhpcyBpcyB1c2VkOiBXb3VsZCBiZSBuaWNlIHRvIGVtaXQgYSBQaEVULWlPIHN0YXRlIHdoZW4gdHJpZ2dlcmVkXHJcbiAqXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgb3B0aW9uaXplLCB7IGNvbWJpbmVPcHRpb25zIH0gZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IE9zY2lsbGF0b3JTb3VuZEdlbmVyYXRvciBmcm9tICcuLi8uLi90YW1iby9qcy9zb3VuZC1nZW5lcmF0b3JzL09zY2lsbGF0b3JTb3VuZEdlbmVyYXRvci5qcyc7XHJcbmltcG9ydCB2aWRlb1NvbGlkU2hhcGUgZnJvbSAnLi4vLi4vc2hlcnBhL2pzL2ZvbnRhd2Vzb21lLTUvdmlkZW9Tb2xpZFNoYXBlLmpzJztcclxuaW1wb3J0IFJlY3Rhbmd1bGFyUHVzaEJ1dHRvbiwgeyBSZWN0YW5ndWxhclB1c2hCdXR0b25PcHRpb25zIH0gZnJvbSAnLi4vLi4vc3VuL2pzL2J1dHRvbnMvUmVjdGFuZ3VsYXJQdXNoQnV0dG9uLmpzJztcclxuaW1wb3J0IHNjZW5lcnlQaGV0IGZyb20gJy4vc2NlbmVyeVBoZXQuanMnO1xyXG5pbXBvcnQgeyBOb2RlLCBOb2RlT3B0aW9ucywgUGF0aCwgUmljaFRleHQgfSBmcm9tICcuLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgc291bmRNYW5hZ2VyIGZyb20gJy4uLy4uL3RhbWJvL2pzL3NvdW5kTWFuYWdlci5qcyc7XHJcbmltcG9ydCBCYWNrZ3JvdW5kTm9kZSBmcm9tICcuL0JhY2tncm91bmROb2RlLmpzJztcclxuaW1wb3J0IHN0ZXBUaW1lciBmcm9tICcuLi8uLi9heG9uL2pzL3N0ZXBUaW1lci5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcblxyXG5jb25zdCBTT1VORF9EVVJBVElPTiA9IDEwMDA7XHJcbmNvbnN0IEJVVFRPTl9MQUJFTCA9ICdTeW5jaHJvbml6ZSBSZWNvcmRpbmcnO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuICB2aXN1YWxOb2RlPzogTm9kZTtcclxuICBzeW5jaHJvbml6ZUJ1dHRvbk9wdGlvbnM/OiBTdHJpY3RPbWl0PFJlY3Rhbmd1bGFyUHVzaEJ1dHRvbk9wdGlvbnMsICdsaXN0ZW5lcicgfCAndGFuZGVtJz47XHJcbn07XHJcblxyXG50eXBlIENsYXBwZXJib2FyZEJ1dHRvbk9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIE5vZGVPcHRpb25zO1xyXG5cclxuY2xhc3MgQ2xhcHBlcmJvYXJkQnV0dG9uIGV4dGVuZHMgTm9kZSB7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNwb3NlQ2xhcHBlcmJvYXJkQnV0dG9uOiAoKSA9PiB2b2lkO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHByb3ZpZGVkT3B0aW9ucz86IENsYXBwZXJib2FyZEJ1dHRvbk9wdGlvbnMgKSB7XHJcblxyXG4gICAgLy8gQSBzaW5nbGUgd2F2ZWZvcm0gd2l0aCBhIGhpZ2ggcGl0Y2ggc2hvdWxkIGhvcGVmdWxseSBiZSBlYXN5IHRvIGZpbmQgaW4gcmVjb3JkaW5ncyxcclxuICAgIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS1waGV0L2lzc3Vlcy83MzkjaXNzdWVjb21tZW50LTExNDIzOTU5MDNcclxuICAgIGNvbnN0IHNvdW5kR2VuZXJhdG9yID0gbmV3IE9zY2lsbGF0b3JTb3VuZEdlbmVyYXRvcigge1xyXG4gICAgICBpbml0aWFsRnJlcXVlbmN5OiA4ODBcclxuICAgIH0gKTtcclxuICAgIHNvdW5kTWFuYWdlci5hZGRTb3VuZEdlbmVyYXRvciggc291bmRHZW5lcmF0b3IgKTtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPENsYXBwZXJib2FyZEJ1dHRvbk9wdGlvbnMsIFNlbGZPcHRpb25zLCBOb2RlT3B0aW9ucz4oKSgge1xyXG4gICAgICBleGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzOiB0cnVlLFxyXG4gICAgICB2aXN1YWxOb2RlOiBuZXcgQmFja2dyb3VuZE5vZGUoIG5ldyBQYXRoKCB2aWRlb1NvbGlkU2hhcGUsIHsgc2NhbGU6IDIsIGZpbGw6ICdyZWQnIH0gKSwge1xyXG4gICAgICAgIHhNYXJnaW46IDIwLFxyXG4gICAgICAgIHlNYXJnaW46IDIwLFxyXG4gICAgICAgIHJlY3RhbmdsZU9wdGlvbnM6IHtcclxuICAgICAgICAgIGZpbGw6ICdibGFjaycsXHJcbiAgICAgICAgICBvcGFjaXR5OiAxXHJcbiAgICAgICAgfVxyXG4gICAgICB9ICksXHJcbiAgICAgIHN5bmNocm9uaXplQnV0dG9uT3B0aW9uczoge1xyXG4gICAgICAgIGNvbnRlbnQ6IG5ldyBSaWNoVGV4dCggQlVUVE9OX0xBQkVMICksXHJcbiAgICAgICAgaW5uZXJDb250ZW50OiBCVVRUT05fTEFCRUwsXHJcbiAgICAgICAgdm9pY2luZ05hbWVSZXNwb25zZTogQlVUVE9OX0xBQkVMLFxyXG4gICAgICAgIHNvdW5kUGxheWVyOiB7XHJcbiAgICAgICAgICBwbGF5OiAoKSA9PiB7XHJcbiAgICAgICAgICAgIHNvdW5kR2VuZXJhdG9yLnBsYXkoKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzdG9wOiBfLm5vb3BcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBwaGV0LWlvXHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLlJFUVVJUkVELFxyXG4gICAgICB0YW5kZW1OYW1lU3VmZml4OiAnQnV0dG9uJ1xyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgc3VwZXIoIG9wdGlvbnMgKTtcclxuXHJcbiAgICBvcHRpb25zLnZpc3VhbE5vZGUudmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgdGhpcy5hZGRDaGlsZCggb3B0aW9ucy52aXN1YWxOb2RlICk7XHJcblxyXG4gICAgY29uc3Qgc3luY2hyb25pemVCdXR0b24gPSBuZXcgUmVjdGFuZ3VsYXJQdXNoQnV0dG9uKCBjb21iaW5lT3B0aW9uczxSZWN0YW5ndWxhclB1c2hCdXR0b25PcHRpb25zPigge1xyXG4gICAgICBsaXN0ZW5lcjogKCkgPT4ge1xyXG5cclxuICAgICAgICAvLyBzbyB0aGF0IHRoaXMgbGlzdGVuZXIgY2Fubm90IGJlIGNhbGxlZCBtb3JlIHRoYW4gb25jZVxyXG4gICAgICAgIHN5bmNocm9uaXplQnV0dG9uLmVuYWJsZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgb3B0aW9ucy52aXN1YWxOb2RlLnZpc2libGUgPSB0cnVlO1xyXG4gICAgICAgIHN0ZXBUaW1lci5zZXRUaW1lb3V0KCAoKSA9PiB7XHJcbiAgICAgICAgICBvcHRpb25zLnZpc3VhbE5vZGUudmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgICAgc291bmRHZW5lcmF0b3Iuc3RvcCgpO1xyXG4gICAgICAgIH0sIFNPVU5EX0RVUkFUSU9OICk7XHJcbiAgICAgIH0sXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAnc3luY2hyb25pemVCdXR0b24nIClcclxuICAgIH0sIG9wdGlvbnMuc3luY2hyb25pemVCdXR0b25PcHRpb25zICkgKTtcclxuICAgIHRoaXMuYWRkQ2hpbGQoIHN5bmNocm9uaXplQnV0dG9uICk7XHJcblxyXG4gICAgdGhpcy5kaXNwb3NlQ2xhcHBlcmJvYXJkQnV0dG9uID0gKCkgPT4ge1xyXG4gICAgICBzeW5jaHJvbml6ZUJ1dHRvbi5kaXNwb3NlKCk7XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmRpc3Bvc2VDbGFwcGVyYm9hcmRCdXR0b24oKTtcclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICB9XHJcbn1cclxuXHJcbnNjZW5lcnlQaGV0LnJlZ2lzdGVyKCAnQ2xhcHBlcmJvYXJkQnV0dG9uJywgQ2xhcHBlcmJvYXJkQnV0dG9uICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBDbGFwcGVyYm9hcmRCdXR0b247Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFNBQVMsSUFBSUMsY0FBYyxRQUFRLGlDQUFpQztBQUUzRSxPQUFPQyx3QkFBd0IsTUFBTSw2REFBNkQ7QUFDbEcsT0FBT0MsZUFBZSxNQUFNLGtEQUFrRDtBQUM5RSxPQUFPQyxxQkFBcUIsTUFBd0MsK0NBQStDO0FBQ25ILE9BQU9DLFdBQVcsTUFBTSxrQkFBa0I7QUFDMUMsU0FBU0MsSUFBSSxFQUFlQyxJQUFJLEVBQUVDLFFBQVEsUUFBUSw2QkFBNkI7QUFDL0UsT0FBT0MsWUFBWSxNQUFNLGdDQUFnQztBQUN6RCxPQUFPQyxjQUFjLE1BQU0scUJBQXFCO0FBQ2hELE9BQU9DLFNBQVMsTUFBTSw0QkFBNEI7QUFDbEQsT0FBT0MsTUFBTSxNQUFNLDJCQUEyQjtBQUU5QyxNQUFNQyxjQUFjLEdBQUcs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