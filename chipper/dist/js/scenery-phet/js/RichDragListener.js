// Copyright 2024, University of Colorado Boulder

/**
 * RichDragListener extends DragListener to integrate PhET-specific features that should be broadly applied to
 * DragListener instances in PhET sims.
 *
 * For grab and release sounds, responsibilities include:
 * - provide default sound files
 * - create SoundClips and register them with soundManager
 * - dispose of SoundClips and deregister them with soundManager
 *
 * @author Agustín Vallejo
 * @author Michael Kauzmann
 * @author Chris Malley (PixelZoom, Inc.)
 */

import sceneryPhet from './sceneryPhet.js';
import { DragListener } from '../../scenery/js/imports.js';
import optionize from '../../phet-core/js/optionize.js';
import SoundClip from '../../tambo/js/sound-generators/SoundClip.js';
import grab_mp3 from '../../tambo/sounds/grab_mp3.js';
import release_mp3 from '../../tambo/sounds/release_mp3.js';
import soundManager from '../../tambo/js/soundManager.js';
const DEFAULT_DRAG_CLIP_OPTIONS = {
  initialOutputLevel: 0.4
};
const DEFAULT_ADD_SOUND_GENERATOR_OPTIONS = {
  categoryName: 'user-interface'
};

// Pattern followed from DragListenerOptions.

export default class RichDragListener extends DragListener {
  constructor(providedOptions) {
    const options = optionize()({
      // SelfOptions
      grabSound: grab_mp3,
      releaseSound: release_mp3,
      grabSoundClipOptions: DEFAULT_DRAG_CLIP_OPTIONS,
      releaseSoundClipOptions: DEFAULT_DRAG_CLIP_OPTIONS,
      grabSoundGeneratorAddOptions: DEFAULT_ADD_SOUND_GENERATOR_OPTIONS,
      releaseSoundGeneratorAddOptions: DEFAULT_ADD_SOUND_GENERATOR_OPTIONS
    }, providedOptions);

    // Create the grab SoundClip and wire it into the start function for the drag cycle.
    let grabClip;
    if (options.grabSound) {
      grabClip = new SoundClip(options.grabSound, options.grabSoundClipOptions);
      soundManager.addSoundGenerator(grabClip, options.grabSoundGeneratorAddOptions);
      const previousStart = options.start;
      options.start = (...args) => {
        previousStart && previousStart(...args);
        grabClip.play();
      };
    }

    // Create the release SoundClip and wire it into the end function for the drag cycle.
    let releaseClip;
    if (options.releaseSound) {
      releaseClip = new SoundClip(options.releaseSound, options.releaseSoundClipOptions);
      soundManager.addSoundGenerator(releaseClip, options.releaseSoundGeneratorAddOptions);
      const previousEnd = options.end;
      options.end = (...args) => {
        previousEnd && previousEnd(...args);
        !this.interrupted && releaseClip.play();
      };
    }
    super(options);

    // Clean up SoundClips when this RichDragListener is disposed.
    this.disposeEmitter.addListener(() => {
      if (grabClip) {
        grabClip.dispose();
        soundManager.removeSoundGenerator(grabClip);
      }
      if (releaseClip) {
        releaseClip.dispose();
        soundManager.removeSoundGenerator(releaseClip);
      }
    });
  }
}
sceneryPhet.register('RichDragListener', RichDragListener);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJzY2VuZXJ5UGhldCIsIkRyYWdMaXN0ZW5lciIsIm9wdGlvbml6ZSIsIlNvdW5kQ2xpcCIsImdyYWJfbXAzIiwicmVsZWFzZV9tcDMiLCJzb3VuZE1hbmFnZXIiLCJERUZBVUxUX0RSQUdfQ0xJUF9PUFRJT05TIiwiaW5pdGlhbE91dHB1dExldmVsIiwiREVGQVVMVF9BRERfU09VTkRfR0VORVJBVE9SX09QVElPTlMiLCJjYXRlZ29yeU5hbWUiLCJSaWNoRHJhZ0xpc3RlbmVyIiwiY29uc3RydWN0b3IiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwiZ3JhYlNvdW5kIiwicmVsZWFzZVNvdW5kIiwiZ3JhYlNvdW5kQ2xpcE9wdGlvbnMiLCJyZWxlYXNlU291bmRDbGlwT3B0aW9ucyIsImdyYWJTb3VuZEdlbmVyYXRvckFkZE9wdGlvbnMiLCJyZWxlYXNlU291bmRHZW5lcmF0b3JBZGRPcHRpb25zIiwiZ3JhYkNsaXAiLCJhZGRTb3VuZEdlbmVyYXRvciIsInByZXZpb3VzU3RhcnQiLCJzdGFydCIsImFyZ3MiLCJwbGF5IiwicmVsZWFzZUNsaXAiLCJwcmV2aW91c0VuZCIsImVuZCIsImludGVycnVwdGVkIiwiZGlzcG9zZUVtaXR0ZXIiLCJhZGRMaXN0ZW5lciIsImRpc3Bvc2UiLCJyZW1vdmVTb3VuZEdlbmVyYXRvciIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiUmljaERyYWdMaXN0ZW5lci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUmljaERyYWdMaXN0ZW5lciBleHRlbmRzIERyYWdMaXN0ZW5lciB0byBpbnRlZ3JhdGUgUGhFVC1zcGVjaWZpYyBmZWF0dXJlcyB0aGF0IHNob3VsZCBiZSBicm9hZGx5IGFwcGxpZWQgdG9cclxuICogRHJhZ0xpc3RlbmVyIGluc3RhbmNlcyBpbiBQaEVUIHNpbXMuXHJcbiAqXHJcbiAqIEZvciBncmFiIGFuZCByZWxlYXNlIHNvdW5kcywgcmVzcG9uc2liaWxpdGllcyBpbmNsdWRlOlxyXG4gKiAtIHByb3ZpZGUgZGVmYXVsdCBzb3VuZCBmaWxlc1xyXG4gKiAtIGNyZWF0ZSBTb3VuZENsaXBzIGFuZCByZWdpc3RlciB0aGVtIHdpdGggc291bmRNYW5hZ2VyXHJcbiAqIC0gZGlzcG9zZSBvZiBTb3VuZENsaXBzIGFuZCBkZXJlZ2lzdGVyIHRoZW0gd2l0aCBzb3VuZE1hbmFnZXJcclxuICpcclxuICogQGF1dGhvciBBZ3VzdMOtbiBWYWxsZWpvXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFublxyXG4gKiBAYXV0aG9yIENocmlzIE1hbGxleSAoUGl4ZWxab29tLCBJbmMuKVxyXG4gKi9cclxuXHJcbmltcG9ydCBzY2VuZXJ5UGhldCBmcm9tICcuL3NjZW5lcnlQaGV0LmpzJztcclxuaW1wb3J0IHsgRHJhZ0xpc3RlbmVyLCBEcmFnTGlzdGVuZXJPcHRpb25zLCBQcmVzc2VkRHJhZ0xpc3RlbmVyIH0gZnJvbSAnLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IFNvdW5kQ2xpcCwgeyBTb3VuZENsaXBPcHRpb25zIH0gZnJvbSAnLi4vLi4vdGFtYm8vanMvc291bmQtZ2VuZXJhdG9ycy9Tb3VuZENsaXAuanMnO1xyXG5pbXBvcnQgZ3JhYl9tcDMgZnJvbSAnLi4vLi4vdGFtYm8vc291bmRzL2dyYWJfbXAzLmpzJztcclxuaW1wb3J0IHJlbGVhc2VfbXAzIGZyb20gJy4uLy4uL3RhbWJvL3NvdW5kcy9yZWxlYXNlX21wMy5qcyc7XHJcbmltcG9ydCBzb3VuZE1hbmFnZXIsIHsgU291bmRHZW5lcmF0b3JBZGRPcHRpb25zIH0gZnJvbSAnLi4vLi4vdGFtYm8vanMvc291bmRNYW5hZ2VyLmpzJztcclxuaW1wb3J0IFdyYXBwZWRBdWRpb0J1ZmZlciBmcm9tICcuLi8uLi90YW1iby9qcy9XcmFwcGVkQXVkaW9CdWZmZXIuanMnO1xyXG5cclxuY29uc3QgREVGQVVMVF9EUkFHX0NMSVBfT1BUSU9OUzogU291bmRDbGlwT3B0aW9ucyA9IHtcclxuICBpbml0aWFsT3V0cHV0TGV2ZWw6IDAuNFxyXG59O1xyXG5jb25zdCBERUZBVUxUX0FERF9TT1VORF9HRU5FUkFUT1JfT1BUSU9OUzogU291bmRHZW5lcmF0b3JBZGRPcHRpb25zID0geyBjYXRlZ29yeU5hbWU6ICd1c2VyLWludGVyZmFjZScgfTtcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcblxyXG4gIC8vIEdyYWIgYW5kIHJlbGVhc2Ugc291bmRzLiBudWxsIG1lYW5zIG5vIHNvdW5kLlxyXG4gIGdyYWJTb3VuZD86IFdyYXBwZWRBdWRpb0J1ZmZlciB8IG51bGw7XHJcbiAgcmVsZWFzZVNvdW5kPzogV3JhcHBlZEF1ZGlvQnVmZmVyIHwgbnVsbDtcclxuXHJcbiAgLy8gUGFzc2VkIHRvIHRoZSBncmFiIGFuZCByZWxlYXNlIFNvdW5kQ2xpcCBpbnN0YW5jZXMuXHJcbiAgZ3JhYlNvdW5kQ2xpcE9wdGlvbnM/OiBTb3VuZENsaXBPcHRpb25zO1xyXG4gIHJlbGVhc2VTb3VuZENsaXBPcHRpb25zPzogU291bmRDbGlwT3B0aW9ucztcclxuXHJcbiAgLy8gYWRkU291bmRHZW5lcmF0b3JPcHRpb25zXHJcbiAgZ3JhYlNvdW5kR2VuZXJhdG9yQWRkT3B0aW9ucz86IFNvdW5kR2VuZXJhdG9yQWRkT3B0aW9ucztcclxuICByZWxlYXNlU291bmRHZW5lcmF0b3JBZGRPcHRpb25zPzogU291bmRHZW5lcmF0b3JBZGRPcHRpb25zO1xyXG59O1xyXG5cclxuLy8gUGF0dGVybiBmb2xsb3dlZCBmcm9tIERyYWdMaXN0ZW5lck9wdGlvbnMuXHJcbmV4cG9ydCB0eXBlIFByZXNzZWRSaWNoRHJhZ0xpc3RlbmVyID0gUmljaERyYWdMaXN0ZW5lciAmIFByZXNzZWREcmFnTGlzdGVuZXI7XHJcblxyXG5leHBvcnQgdHlwZSBSaWNoRHJhZ0xpc3RlbmVyT3B0aW9uczxMaXN0ZW5lciBleHRlbmRzIFByZXNzZWRSaWNoRHJhZ0xpc3RlbmVyID0gUHJlc3NlZFJpY2hEcmFnTGlzdGVuZXI+ID0gU2VsZk9wdGlvbnMgJiBEcmFnTGlzdGVuZXJPcHRpb25zPExpc3RlbmVyPjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJpY2hEcmFnTGlzdGVuZXIgZXh0ZW5kcyBEcmFnTGlzdGVuZXIge1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHByb3ZpZGVkT3B0aW9uczogUmljaERyYWdMaXN0ZW5lck9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxSaWNoRHJhZ0xpc3RlbmVyT3B0aW9ucywgU2VsZk9wdGlvbnMsIERyYWdMaXN0ZW5lck9wdGlvbnM8UHJlc3NlZFJpY2hEcmFnTGlzdGVuZXI+PigpKCB7XHJcblxyXG4gICAgICAvLyBTZWxmT3B0aW9uc1xyXG4gICAgICBncmFiU291bmQ6IGdyYWJfbXAzLFxyXG4gICAgICByZWxlYXNlU291bmQ6IHJlbGVhc2VfbXAzLFxyXG4gICAgICBncmFiU291bmRDbGlwT3B0aW9uczogREVGQVVMVF9EUkFHX0NMSVBfT1BUSU9OUyxcclxuICAgICAgcmVsZWFzZVNvdW5kQ2xpcE9wdGlvbnM6IERFRkFVTFRfRFJBR19DTElQX09QVElPTlMsXHJcbiAgICAgIGdyYWJTb3VuZEdlbmVyYXRvckFkZE9wdGlvbnM6IERFRkFVTFRfQUREX1NPVU5EX0dFTkVSQVRPUl9PUFRJT05TLFxyXG4gICAgICByZWxlYXNlU291bmRHZW5lcmF0b3JBZGRPcHRpb25zOiBERUZBVUxUX0FERF9TT1VORF9HRU5FUkFUT1JfT1BUSU9OU1xyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIHRoZSBncmFiIFNvdW5kQ2xpcCBhbmQgd2lyZSBpdCBpbnRvIHRoZSBzdGFydCBmdW5jdGlvbiBmb3IgdGhlIGRyYWcgY3ljbGUuXHJcbiAgICBsZXQgZ3JhYkNsaXA6IFNvdW5kQ2xpcDtcclxuICAgIGlmICggb3B0aW9ucy5ncmFiU291bmQgKSB7XHJcblxyXG4gICAgICBncmFiQ2xpcCA9IG5ldyBTb3VuZENsaXAoIG9wdGlvbnMuZ3JhYlNvdW5kLCBvcHRpb25zLmdyYWJTb3VuZENsaXBPcHRpb25zICk7XHJcbiAgICAgIHNvdW5kTWFuYWdlci5hZGRTb3VuZEdlbmVyYXRvciggZ3JhYkNsaXAsIG9wdGlvbnMuZ3JhYlNvdW5kR2VuZXJhdG9yQWRkT3B0aW9ucyApO1xyXG5cclxuICAgICAgY29uc3QgcHJldmlvdXNTdGFydCA9IG9wdGlvbnMuc3RhcnQ7XHJcbiAgICAgIG9wdGlvbnMuc3RhcnQgPSAoIC4uLmFyZ3MgKSA9PiB7XHJcbiAgICAgICAgcHJldmlvdXNTdGFydCAmJiBwcmV2aW91c1N0YXJ0KCAuLi5hcmdzICk7XHJcbiAgICAgICAgZ3JhYkNsaXAucGxheSgpO1xyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENyZWF0ZSB0aGUgcmVsZWFzZSBTb3VuZENsaXAgYW5kIHdpcmUgaXQgaW50byB0aGUgZW5kIGZ1bmN0aW9uIGZvciB0aGUgZHJhZyBjeWNsZS5cclxuICAgIGxldCByZWxlYXNlQ2xpcDogU291bmRDbGlwO1xyXG4gICAgaWYgKCBvcHRpb25zLnJlbGVhc2VTb3VuZCApIHtcclxuXHJcbiAgICAgIHJlbGVhc2VDbGlwID0gbmV3IFNvdW5kQ2xpcCggb3B0aW9ucy5yZWxlYXNlU291bmQsIG9wdGlvbnMucmVsZWFzZVNvdW5kQ2xpcE9wdGlvbnMgKTtcclxuICAgICAgc291bmRNYW5hZ2VyLmFkZFNvdW5kR2VuZXJhdG9yKCByZWxlYXNlQ2xpcCwgb3B0aW9ucy5yZWxlYXNlU291bmRHZW5lcmF0b3JBZGRPcHRpb25zICk7XHJcblxyXG4gICAgICBjb25zdCBwcmV2aW91c0VuZCA9IG9wdGlvbnMuZW5kO1xyXG4gICAgICBvcHRpb25zLmVuZCA9ICggLi4uYXJncyApID0+IHtcclxuICAgICAgICBwcmV2aW91c0VuZCAmJiBwcmV2aW91c0VuZCggLi4uYXJncyApO1xyXG4gICAgICAgICF0aGlzLmludGVycnVwdGVkICYmIHJlbGVhc2VDbGlwLnBsYXkoKTtcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBzdXBlciggb3B0aW9ucyApO1xyXG5cclxuICAgIC8vIENsZWFuIHVwIFNvdW5kQ2xpcHMgd2hlbiB0aGlzIFJpY2hEcmFnTGlzdGVuZXIgaXMgZGlzcG9zZWQuXHJcbiAgICB0aGlzLmRpc3Bvc2VFbWl0dGVyLmFkZExpc3RlbmVyKCAoKSA9PiB7XHJcbiAgICAgIGlmICggZ3JhYkNsaXAgKSB7XHJcbiAgICAgICAgZ3JhYkNsaXAuZGlzcG9zZSgpO1xyXG4gICAgICAgIHNvdW5kTWFuYWdlci5yZW1vdmVTb3VuZEdlbmVyYXRvciggZ3JhYkNsaXAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCByZWxlYXNlQ2xpcCApIHtcclxuICAgICAgICByZWxlYXNlQ2xpcC5kaXNwb3NlKCk7XHJcbiAgICAgICAgc291bmRNYW5hZ2VyLnJlbW92ZVNvdW5kR2VuZXJhdG9yKCByZWxlYXNlQ2xpcCApO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5UGhldC5yZWdpc3RlciggJ1JpY2hEcmFnTGlzdGVuZXInLCBSaWNoRHJhZ0xpc3RlbmVyICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxXQUFXLE1BQU0sa0JBQWtCO0FBQzFDLFNBQVNDLFlBQVksUUFBa0QsNkJBQTZCO0FBQ3BHLE9BQU9DLFNBQVMsTUFBTSxpQ0FBaUM7QUFDdkQsT0FBT0MsU0FBUyxNQUE0Qiw4Q0FBOEM7QUFDMUYsT0FBT0MsUUFBUSxNQUFNLGdDQUFnQztBQUNyRCxPQUFPQyxXQUFXLE1BQU0sbUNBQW1DO0FBQzNELE9BQU9DLFlB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