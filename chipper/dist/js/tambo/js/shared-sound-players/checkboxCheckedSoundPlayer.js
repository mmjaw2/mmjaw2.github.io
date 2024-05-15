// Copyright 2019-2022, University of Colorado Boulder

/**
 * shared sound generator for checking a checkbox that uses the singleton pattern
 *
 * @author John Blanco (PhET Interactive Simulations)
 */

import checkboxChecked_mp3 from '../../sounds/checkboxChecked_mp3.js';
import SoundClipPlayer from '../sound-generators/SoundClipPlayer.js';
import tambo from '../tambo.js';

// create the shared sound instance
const checkboxCheckedSoundPlayer = new SoundClipPlayer(checkboxChecked_mp3, {
  soundClipOptions: {
    initialOutputLevel: 0.7
  },
  soundManagerOptions: {
    categoryName: 'user-interface'
  }
});
tambo.register('checkboxCheckedSoundPlayer', checkboxCheckedSoundPlayer);
export default checkboxCheckedSoundPlayer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjaGVja2JveENoZWNrZWRfbXAzIiwiU291bmRDbGlwUGxheWVyIiwidGFtYm8iLCJjaGVja2JveENoZWNrZWRTb3VuZFBsYXllciIsInNvdW5kQ2xpcE9wdGlvbnMiLCJpbml0aWFsT3V0cHV0TGV2ZWwiLCJzb3VuZE1hbmFnZXJPcHRpb25zIiwiY2F0ZWdvcnlOYW1lIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJjaGVja2JveENoZWNrZWRTb3VuZFBsYXllci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOS0yMDIyLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBzaGFyZWQgc291bmQgZ2VuZXJhdG9yIGZvciBjaGVja2luZyBhIGNoZWNrYm94IHRoYXQgdXNlcyB0aGUgc2luZ2xldG9uIHBhdHRlcm5cclxuICpcclxuICogQGF1dGhvciBKb2huIEJsYW5jbyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgY2hlY2tib3hDaGVja2VkX21wMyBmcm9tICcuLi8uLi9zb3VuZHMvY2hlY2tib3hDaGVja2VkX21wMy5qcyc7XHJcbmltcG9ydCBTb3VuZENsaXBQbGF5ZXIgZnJvbSAnLi4vc291bmQtZ2VuZXJhdG9ycy9Tb3VuZENsaXBQbGF5ZXIuanMnO1xyXG5pbXBvcnQgdGFtYm8gZnJvbSAnLi4vdGFtYm8uanMnO1xyXG5cclxuLy8gY3JlYXRlIHRoZSBzaGFyZWQgc291bmQgaW5zdGFuY2VcclxuY29uc3QgY2hlY2tib3hDaGVja2VkU291bmRQbGF5ZXIgPSBuZXcgU291bmRDbGlwUGxheWVyKCBjaGVja2JveENoZWNrZWRfbXAzLCB7XHJcbiAgc291bmRDbGlwT3B0aW9uczogeyBpbml0aWFsT3V0cHV0TGV2ZWw6IDAuNyB9LFxyXG4gIHNvdW5kTWFuYWdlck9wdGlvbnM6IHsgY2F0ZWdvcnlOYW1lOiAndXNlci1pbnRlcmZhY2UnIH1cclxufSApO1xyXG5cclxudGFtYm8ucmVnaXN0ZXIoICdjaGVja2JveENoZWNrZWRTb3VuZFBsYXllcicsIGNoZWNrYm94Q2hlY2tlZFNvdW5kUGxheWVyICk7XHJcbmV4cG9ydCBkZWZhdWx0IGNoZWNrYm94Q2hlY2tlZFNvdW5kUGxheWVyOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxtQkFBbUIsTUFBTSxxQ0FBcUM7QUFDckUsT0FBT0MsZUFBZSxNQUFNLHdDQUF3QztBQUNwRSxPQUFPQyxLQUFLLE1BQU0sYUFBYTs7QUFFL0I7QUFDQSxNQUFNQywwQkFBMEIsR0FBRyxJQUFJRixlQUFlLENBQUVELG1CQUFtQixFQUFFO0VBQzNFSSxnQkFBZ0IsRUFBRTtJQUFFQyxrQkFBa0IsRUFBRTtFQUFJLENBQUM7RUFDN0NDLG1CQUFtQixFQUFFO0lBQUVDLFlBQVksRUFBRTtFQUFpQjtBQUN4RCxDQUFFLENBQUM7QUFFSEwsS0FBSyxDQUFDTSxRQUFRLENBQUUsNEJBQTRCLEVBQUVMLDBCQUEyQixDQUFDO0FBQzFFLGVBQWVBLDBCQUEwQiIsImlnbm9yZUxpc3QiOltdfQ==