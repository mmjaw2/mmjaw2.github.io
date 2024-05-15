// Copyright 2019-2022, University of Colorado Boulder

/**
 * shared sound generator for releasing something, uses the singleton pattern
 *
 * @author John Blanco (PhET Interactive Simulations)
 */

import release_mp3 from '../../sounds/release_mp3.js';
import SoundClipPlayer from '../sound-generators/SoundClipPlayer.js';
import tambo from '../tambo.js';

// create the shared sound instance
const releaseSoundPlayer = new SoundClipPlayer(release_mp3, {
  soundClipOptions: {
    initialOutputLevel: 0.7
  },
  soundManagerOptions: {
    categoryName: 'user-interface'
  }
});
tambo.register('releaseSoundPlayer', releaseSoundPlayer);
export default releaseSoundPlayer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJyZWxlYXNlX21wMyIsIlNvdW5kQ2xpcFBsYXllciIsInRhbWJvIiwicmVsZWFzZVNvdW5kUGxheWVyIiwic291bmRDbGlwT3B0aW9ucyIsImluaXRpYWxPdXRwdXRMZXZlbCIsInNvdW5kTWFuYWdlck9wdGlvbnMiLCJjYXRlZ29yeU5hbWUiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbInJlbGVhc2VTb3VuZFBsYXllci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOS0yMDIyLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBzaGFyZWQgc291bmQgZ2VuZXJhdG9yIGZvciByZWxlYXNpbmcgc29tZXRoaW5nLCB1c2VzIHRoZSBzaW5nbGV0b24gcGF0dGVyblxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvaG4gQmxhbmNvIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCByZWxlYXNlX21wMyBmcm9tICcuLi8uLi9zb3VuZHMvcmVsZWFzZV9tcDMuanMnO1xyXG5pbXBvcnQgU291bmRDbGlwUGxheWVyIGZyb20gJy4uL3NvdW5kLWdlbmVyYXRvcnMvU291bmRDbGlwUGxheWVyLmpzJztcclxuaW1wb3J0IHRhbWJvIGZyb20gJy4uL3RhbWJvLmpzJztcclxuXHJcbi8vIGNyZWF0ZSB0aGUgc2hhcmVkIHNvdW5kIGluc3RhbmNlXHJcbmNvbnN0IHJlbGVhc2VTb3VuZFBsYXllciA9IG5ldyBTb3VuZENsaXBQbGF5ZXIoIHJlbGVhc2VfbXAzLCB7XHJcbiAgc291bmRDbGlwT3B0aW9uczogeyBpbml0aWFsT3V0cHV0TGV2ZWw6IDAuNyB9LFxyXG4gIHNvdW5kTWFuYWdlck9wdGlvbnM6IHsgY2F0ZWdvcnlOYW1lOiAndXNlci1pbnRlcmZhY2UnIH1cclxufSApO1xyXG5cclxudGFtYm8ucmVnaXN0ZXIoICdyZWxlYXNlU291bmRQbGF5ZXInLCByZWxlYXNlU291bmRQbGF5ZXIgKTtcclxuZXhwb3J0IGRlZmF1bHQgcmVsZWFzZVNvdW5kUGxheWVyOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxXQUFXLE1BQU0sNkJBQTZCO0FBQ3JELE9BQU9DLGVBQWUsTUFBTSx3Q0FBd0M7QUFDcEUsT0FBT0MsS0FBSyxNQUFNLGFBQWE7O0FBRS9CO0FBQ0EsTUFBTUMsa0JBQWtCLEdBQUcsSUFBSUYsZUFBZSxDQUFFRCxXQUFXLEVBQUU7RUFDM0RJLGdCQUFnQixFQUFFO0lBQUVDLGtCQUFrQixFQUFFO0VBQUksQ0FBQztFQUM3Q0MsbUJBQW1CLEVBQUU7SUFBRUMsWUFBWSxFQUFFO0VBQWlCO0FBQ3hELENBQUUsQ0FBQztBQUVITCxLQUFLLENBQUNNLFFBQVEsQ0FBRSxvQkFBb0IsRUFBRUwsa0JBQW1CLENBQUM7QUFDMUQsZUFBZUEsa0JBQWtCIiwiaWdub3JlTGlzdCI6W119