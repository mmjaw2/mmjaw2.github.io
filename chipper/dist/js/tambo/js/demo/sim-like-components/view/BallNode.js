// Copyright 2018-2024, University of Colorado Boulder

/**
 * a Scenery node that represents a ball in the view
 *
 * @author John Blanco (PhET Interactive Simulations)
 */

import { Circle } from '../../../../../scenery/js/imports.js';
import boundaryReached_mp3 from '../../../../sounds/boundaryReached_mp3.js';
import ceilingFloorContact_mp3 from '../../../../sounds/ceilingFloorContact_mp3.js';
import wallContact_mp3 from '../../../../sounds/wallContact_mp3.js';
import SoundClip from '../../../sound-generators/SoundClip.js';
import soundManager from '../../../soundManager.js';
import tambo from '../../../tambo.js';
// constants
const BALL_BOUNCE_OUTPUT_LEVEL = 0.3;
class BallNode extends Circle {
  // sounds for wall contact

  // sound for ceiling contact

  // dispose

  constructor(ball, modelViewTransform) {
    // Create a circle node to represent the ball.
    const radius = modelViewTransform.modelToViewDeltaX(ball.radius);
    super(radius, {
      fill: ball.color,
      stroke: 'gray'
    });

    // Move this node as the model position changes.
    const updatePosition = position => {
      this.center = modelViewTransform.modelToViewPosition(position);
    };
    ball.positionProperty.link(updatePosition);

    // Create the sound clips used when the balls hit the ceiling or the wall.
    this.wallContactSoundClips = [new SoundClip(wallContact_mp3, {
      initialOutputLevel: BALL_BOUNCE_OUTPUT_LEVEL
    }), new SoundClip(boundaryReached_mp3, {
      initialOutputLevel: BALL_BOUNCE_OUTPUT_LEVEL
    }), new SoundClip(ceilingFloorContact_mp3, {
      initialOutputLevel: BALL_BOUNCE_OUTPUT_LEVEL
    })];
    this.ceilingFloorContactSoundClip = new SoundClip(ceilingFloorContact_mp3, {
      initialOutputLevel: BALL_BOUNCE_OUTPUT_LEVEL
    });

    // Add the sound generators.
    this.wallContactSoundClips.forEach(clip => {
      soundManager.addSoundGenerator(clip);
    });
    soundManager.addSoundGenerator(this.ceilingFloorContactSoundClip);

    // Play bounce sounds when the ball bounces on the wall or ceiling.
    const bounceListener = bounceSurface => {
      if (bounceSurface === 'left-wall' || bounceSurface === 'right-wall') {
        // play the sound that was selected via the preferences control
        this.wallContactSoundClips[phet.tambo.soundIndexForWallBounceProperty.value].play();
      } else if (bounceSurface === 'floor' || bounceSurface === 'ceiling') {
        this.ceilingFloorContactSoundClip.play();
      }
    };
    ball.bounceEmitter.addListener(bounceListener);
    this.disposeBallNode = () => {
      ball.positionProperty.unlink(updatePosition);
      ball.bounceEmitter.removeListener(bounceListener);
      this.wallContactSoundClips.forEach(clip => {
        clip.stop();
        soundManager.removeSoundGenerator(clip);
      });
      this.ceilingFloorContactSoundClip.stop();
      soundManager.removeSoundGenerator(this.ceilingFloorContactSoundClip);
    };
  }

  /**
   * Clean up memory references to avoid leaks.
   */
  dispose() {
    this.disposeBallNode();
    super.dispose();
  }
}
tambo.register('BallNode', BallNode);
export default BallNode;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJDaXJjbGUiLCJib3VuZGFyeVJlYWNoZWRfbXAzIiwiY2VpbGluZ0Zsb29yQ29udGFjdF9tcDMiLCJ3YWxsQ29udGFjdF9tcDMiLCJTb3VuZENsaXAiLCJzb3VuZE1hbmFnZXIiLCJ0YW1ibyIsIkJBTExfQk9VTkNFX09VVFBVVF9MRVZFTCIsIkJhbGxOb2RlIiwiY29uc3RydWN0b3IiLCJiYWxsIiwibW9kZWxWaWV3VHJhbnNmb3JtIiwicmFkaXVzIiwibW9kZWxUb1ZpZXdEZWx0YVgiLCJmaWxsIiwiY29sb3IiLCJzdHJva2UiLCJ1cGRhdGVQb3NpdGlvbiIsInBvc2l0aW9uIiwiY2VudGVyIiwibW9kZWxUb1ZpZXdQb3NpdGlvbiIsInBvc2l0aW9uUHJvcGVydHkiLCJsaW5rIiwid2FsbENvbnRhY3RTb3VuZENsaXBzIiwiaW5pdGlhbE91dHB1dExldmVsIiwiY2VpbGluZ0Zsb29yQ29udGFjdFNvdW5kQ2xpcCIsImZvckVhY2giLCJjbGlwIiwiYWRkU291bmRHZW5lcmF0b3IiLCJib3VuY2VMaXN0ZW5lciIsImJvdW5jZVN1cmZhY2UiLCJwaGV0Iiwic291bmRJbmRleEZvcldhbGxCb3VuY2VQcm9wZXJ0eSIsInZhbHVlIiwicGxheSIsImJvdW5jZUVtaXR0ZXIiLCJhZGRMaXN0ZW5lciIsImRpc3Bvc2VCYWxsTm9kZSIsInVubGluayIsInJlbW92ZUxpc3RlbmVyIiwic3RvcCIsInJlbW92ZVNvdW5kR2VuZXJhdG9yIiwiZGlzcG9zZSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiQmFsbE5vZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogYSBTY2VuZXJ5IG5vZGUgdGhhdCByZXByZXNlbnRzIGEgYmFsbCBpbiB0aGUgdmlld1xyXG4gKlxyXG4gKiBAYXV0aG9yIEpvaG4gQmxhbmNvIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IE1vZGVsVmlld1RyYW5zZm9ybTIgZnJvbSAnLi4vLi4vLi4vLi4vLi4vcGhldGNvbW1vbi9qcy92aWV3L01vZGVsVmlld1RyYW5zZm9ybTIuanMnO1xyXG5pbXBvcnQgeyBDaXJjbGUgfSBmcm9tICcuLi8uLi8uLi8uLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgYm91bmRhcnlSZWFjaGVkX21wMyBmcm9tICcuLi8uLi8uLi8uLi9zb3VuZHMvYm91bmRhcnlSZWFjaGVkX21wMy5qcyc7XHJcbmltcG9ydCBjZWlsaW5nRmxvb3JDb250YWN0X21wMyBmcm9tICcuLi8uLi8uLi8uLi9zb3VuZHMvY2VpbGluZ0Zsb29yQ29udGFjdF9tcDMuanMnO1xyXG5pbXBvcnQgd2FsbENvbnRhY3RfbXAzIGZyb20gJy4uLy4uLy4uLy4uL3NvdW5kcy93YWxsQ29udGFjdF9tcDMuanMnO1xyXG5pbXBvcnQgU291bmRDbGlwIGZyb20gJy4uLy4uLy4uL3NvdW5kLWdlbmVyYXRvcnMvU291bmRDbGlwLmpzJztcclxuaW1wb3J0IHNvdW5kTWFuYWdlciBmcm9tICcuLi8uLi8uLi9zb3VuZE1hbmFnZXIuanMnO1xyXG5pbXBvcnQgdGFtYm8gZnJvbSAnLi4vLi4vLi4vdGFtYm8uanMnO1xyXG5pbXBvcnQgQmFsbCBmcm9tICcuLi9tb2RlbC9CYWxsLmpzJztcclxuXHJcbi8vIGNvbnN0YW50c1xyXG5jb25zdCBCQUxMX0JPVU5DRV9PVVRQVVRfTEVWRUwgPSAwLjM7XHJcblxyXG5jbGFzcyBCYWxsTm9kZSBleHRlbmRzIENpcmNsZSB7XHJcblxyXG4gIC8vIHNvdW5kcyBmb3Igd2FsbCBjb250YWN0XHJcbiAgcHJpdmF0ZSByZWFkb25seSB3YWxsQ29udGFjdFNvdW5kQ2xpcHM6IFNvdW5kQ2xpcFtdO1xyXG5cclxuICAvLyBzb3VuZCBmb3IgY2VpbGluZyBjb250YWN0XHJcbiAgcHJpdmF0ZSByZWFkb25seSBjZWlsaW5nRmxvb3JDb250YWN0U291bmRDbGlwOiBTb3VuZENsaXA7XHJcblxyXG4gIC8vIGRpc3Bvc2VcclxuICBwcml2YXRlIHJlYWRvbmx5IGRpc3Bvc2VCYWxsTm9kZTogKCkgPT4gdm9pZDtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBiYWxsOiBCYWxsLCBtb2RlbFZpZXdUcmFuc2Zvcm06IE1vZGVsVmlld1RyYW5zZm9ybTIgKSB7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGEgY2lyY2xlIG5vZGUgdG8gcmVwcmVzZW50IHRoZSBiYWxsLlxyXG4gICAgY29uc3QgcmFkaXVzID0gbW9kZWxWaWV3VHJhbnNmb3JtLm1vZGVsVG9WaWV3RGVsdGFYKCBiYWxsLnJhZGl1cyApO1xyXG4gICAgc3VwZXIoIHJhZGl1cywgeyBmaWxsOiBiYWxsLmNvbG9yLCBzdHJva2U6ICdncmF5JyB9ICk7XHJcblxyXG4gICAgLy8gTW92ZSB0aGlzIG5vZGUgYXMgdGhlIG1vZGVsIHBvc2l0aW9uIGNoYW5nZXMuXHJcbiAgICBjb25zdCB1cGRhdGVQb3NpdGlvbiA9ICggcG9zaXRpb246IFZlY3RvcjIgKSA9PiB7XHJcbiAgICAgIHRoaXMuY2VudGVyID0gbW9kZWxWaWV3VHJhbnNmb3JtLm1vZGVsVG9WaWV3UG9zaXRpb24oIHBvc2l0aW9uICk7XHJcbiAgICB9O1xyXG4gICAgYmFsbC5wb3NpdGlvblByb3BlcnR5LmxpbmsoIHVwZGF0ZVBvc2l0aW9uICk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIHRoZSBzb3VuZCBjbGlwcyB1c2VkIHdoZW4gdGhlIGJhbGxzIGhpdCB0aGUgY2VpbGluZyBvciB0aGUgd2FsbC5cclxuICAgIHRoaXMud2FsbENvbnRhY3RTb3VuZENsaXBzID0gW1xyXG4gICAgICBuZXcgU291bmRDbGlwKCB3YWxsQ29udGFjdF9tcDMsIHsgaW5pdGlhbE91dHB1dExldmVsOiBCQUxMX0JPVU5DRV9PVVRQVVRfTEVWRUwgfSApLFxyXG4gICAgICBuZXcgU291bmRDbGlwKCBib3VuZGFyeVJlYWNoZWRfbXAzLCB7IGluaXRpYWxPdXRwdXRMZXZlbDogQkFMTF9CT1VOQ0VfT1VUUFVUX0xFVkVMIH0gKSxcclxuICAgICAgbmV3IFNvdW5kQ2xpcCggY2VpbGluZ0Zsb29yQ29udGFjdF9tcDMsIHsgaW5pdGlhbE91dHB1dExldmVsOiBCQUxMX0JPVU5DRV9PVVRQVVRfTEVWRUwgfSApXHJcbiAgICBdO1xyXG4gICAgdGhpcy5jZWlsaW5nRmxvb3JDb250YWN0U291bmRDbGlwID0gbmV3IFNvdW5kQ2xpcCggY2VpbGluZ0Zsb29yQ29udGFjdF9tcDMsIHtcclxuICAgICAgaW5pdGlhbE91dHB1dExldmVsOiBCQUxMX0JPVU5DRV9PVVRQVVRfTEVWRUxcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBBZGQgdGhlIHNvdW5kIGdlbmVyYXRvcnMuXHJcbiAgICB0aGlzLndhbGxDb250YWN0U291bmRDbGlwcy5mb3JFYWNoKCBjbGlwID0+IHtcclxuICAgICAgc291bmRNYW5hZ2VyLmFkZFNvdW5kR2VuZXJhdG9yKCBjbGlwICk7XHJcbiAgICB9ICk7XHJcbiAgICBzb3VuZE1hbmFnZXIuYWRkU291bmRHZW5lcmF0b3IoIHRoaXMuY2VpbGluZ0Zsb29yQ29udGFjdFNvdW5kQ2xpcCApO1xyXG5cclxuICAgIC8vIFBsYXkgYm91bmNlIHNvdW5kcyB3aGVuIHRoZSBiYWxsIGJvdW5jZXMgb24gdGhlIHdhbGwgb3IgY2VpbGluZy5cclxuICAgIGNvbnN0IGJvdW5jZUxpc3RlbmVyID0gKCBib3VuY2VTdXJmYWNlOiBzdHJpbmcgKSA9PiB7XHJcbiAgICAgIGlmICggYm91bmNlU3VyZmFjZSA9PT0gJ2xlZnQtd2FsbCcgfHwgYm91bmNlU3VyZmFjZSA9PT0gJ3JpZ2h0LXdhbGwnICkge1xyXG5cclxuICAgICAgICAvLyBwbGF5IHRoZSBzb3VuZCB0aGF0IHdhcyBzZWxlY3RlZCB2aWEgdGhlIHByZWZlcmVuY2VzIGNvbnRyb2xcclxuICAgICAgICB0aGlzLndhbGxDb250YWN0U291bmRDbGlwc1sgcGhldC50YW1iby5zb3VuZEluZGV4Rm9yV2FsbEJvdW5jZVByb3BlcnR5LnZhbHVlIF0ucGxheSgpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCBib3VuY2VTdXJmYWNlID09PSAnZmxvb3InIHx8IGJvdW5jZVN1cmZhY2UgPT09ICdjZWlsaW5nJyApIHtcclxuICAgICAgICB0aGlzLmNlaWxpbmdGbG9vckNvbnRhY3RTb3VuZENsaXAucGxheSgpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgYmFsbC5ib3VuY2VFbWl0dGVyLmFkZExpc3RlbmVyKCBib3VuY2VMaXN0ZW5lciApO1xyXG5cclxuICAgIHRoaXMuZGlzcG9zZUJhbGxOb2RlID0gKCkgPT4ge1xyXG4gICAgICBiYWxsLnBvc2l0aW9uUHJvcGVydHkudW5saW5rKCB1cGRhdGVQb3NpdGlvbiApO1xyXG4gICAgICBiYWxsLmJvdW5jZUVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoIGJvdW5jZUxpc3RlbmVyICk7XHJcbiAgICAgIHRoaXMud2FsbENvbnRhY3RTb3VuZENsaXBzLmZvckVhY2goIGNsaXAgPT4ge1xyXG4gICAgICAgIGNsaXAuc3RvcCgpO1xyXG4gICAgICAgIHNvdW5kTWFuYWdlci5yZW1vdmVTb3VuZEdlbmVyYXRvciggY2xpcCApO1xyXG4gICAgICB9ICk7XHJcbiAgICAgIHRoaXMuY2VpbGluZ0Zsb29yQ29udGFjdFNvdW5kQ2xpcC5zdG9wKCk7XHJcbiAgICAgIHNvdW5kTWFuYWdlci5yZW1vdmVTb3VuZEdlbmVyYXRvciggdGhpcy5jZWlsaW5nRmxvb3JDb250YWN0U291bmRDbGlwICk7XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xlYW4gdXAgbWVtb3J5IHJlZmVyZW5jZXMgdG8gYXZvaWQgbGVha3MuXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmRpc3Bvc2VCYWxsTm9kZSgpO1xyXG4gICAgc3VwZXIuZGlzcG9zZSgpO1xyXG4gIH1cclxufVxyXG5cclxudGFtYm8ucmVnaXN0ZXIoICdCYWxsTm9kZScsIEJhbGxOb2RlICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBCYWxsTm9kZTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBSUEsU0FBU0EsTUFBTSxRQUFRLHNDQUFzQztBQUM3RCxPQUFPQyxtQkFBbUIsTUFBTSwyQ0FBMkM7QUFDM0UsT0FBT0MsdUJBQXVCLE1BQU0sK0NBQStDO0FBQ25GLE9BQU9DLGVBQWUsTUFBTSx1Q0FBdUM7QUFDbkUsT0FBT0MsU0FBUyxNQUFNLHdDQUF3QztBQUM5RCxPQUFPQyxZQUFZLE1BQU0sMEJBQTBCO0FBQ25ELE9BQU9DLEtBQUssTUFBTSxtQkFBbUI7QUFHckM7QUFDQSxNQUFNQyx3QkFBd0IsR0FBRyxHQUFHO0FBRXBDLE1BQU1DLFFBQVEsU0FBU1IsTUFBTSxDQUFDO0VBRTVCOztFQUdBOztFQUdBOztFQUdPUyxXQUFXQSxDQUFFQyxJQUFVLEVBQUVDLGtCQUF1QyxFQUFHO0lBRXhFO0lBQ0EsTUFBTUMsTUFBTSxHQUFHRCxrQkFBa0IsQ0FBQ0UsaUJBQWlCLENBQUVILElBQUksQ0FBQ0UsTUFBTyxDQUFDO0lBQ2xFLEtBQUssQ0FBRUEsTUFBTSxFQUFFO01BQUVFLElBQUksRUFBRUosSUFBSSxDQUFDSyxLQUFLO01BQUVDLE1BQU0sRUFBRTtJQUFPLENBQUUsQ0FBQzs7SUFFckQ7SUFDQSxNQUFNQyxjQUFjLEdBQUtDLFFBQWlCLElBQU07TUFDOUMsSUFBSSxDQUFDQyxNQUFNLEdBQUdSLGtCQUFrQixDQUFDUyxtQkFBbUIsQ0FBRUYsUUFBUyxDQUFDO0lBQ2xFLENBQUM7SUFDRFIsSUFBSSxDQUFDVyxnQkFBZ0IsQ0FBQ0MsSUFBSSxDQUFFTCxjQUFlLENBQUM7O0lBRTVDO0lBQ0EsSUFBSSxDQUFDTSxxQkFBcUIsR0FBRyxDQUMzQixJQUFJbkIsU0FBUyxDQUFFRCxlQUFlLEVBQUU7TUFBRXFCLGtCQUFrQixFQUFFakI7SUFBeUIsQ0FBRSxDQUFDLEVBQ2xGLElBQUlILFNBQVMsQ0FBRUgsbUJBQW1CLEVBQUU7TUFBRXVCLGtCQUFrQixFQUFFakI7SUFBeUIsQ0FBRSxDQUFDLEVBQ3RGLElBQUlILFNBQVMsQ0FBRUYsdUJBQXVCLEVBQUU7TUFBRXNCLGtCQUFrQixFQUFFakI7SUFBeUIsQ0FBRSxDQUFDLENBQzNGO0lBQ0QsSUFBSSxDQUFDa0IsNEJBQTRCLEdBQUcsSUFBSXJCLFNBQVMsQ0FBRUYsdUJBQXVCLEVBQUU7TUFDMUVzQixrQkFBa0IsRUFBRWpCO0lBQ3RCLENBQUUsQ0FBQzs7SUFFSDtJQUNBLElBQUksQ0FBQ2dCLHFCQUFxQixDQUFDRyxPQUFPLENBQUVDLElBQUksSUFBSTtNQUMxQ3RCLFlBQVksQ0FBQ3VCLGlCQUFpQixDQUFFRCxJQUFLLENBQUM7SUFDeEMsQ0FBRSxDQUFDO0lBQ0h0QixZQUFZLENBQUN1QixpQkFBaUIsQ0FBRSxJQUFJLENBQUNILDRCQUE2QixDQUFDOztJQUVuRTtJQUNBLE1BQU1JLGNBQWMsR0FBS0MsYUFBcUIsSUFBTTtNQUNsRCxJQUFLQSxhQUFhLEtBQUssV0FBVyxJQUFJQSxhQUFhLEtBQUssWUFBWSxFQUFHO1FBRXJFO1FBQ0EsSUFBSSxDQUFDUCxxQkFBcUIsQ0FBRVEsSUFBSSxDQUFDekIsS0FBSyxDQUFDMEIsK0JBQStCLENBQUNDLEtBQUssQ0FBRSxDQUFDQyxJQUFJLENBQUMsQ0FBQztNQUN2RixDQUFDLE1BQ0ksSUFBS0osYUFBYSxLQUFLLE9BQU8sSUFBSUEsYUFBYSxLQUFLLFNBQVMsRUFBRztRQUNuRSxJQUFJLENBQUNMLDRCQUE0QixDQUFDUyxJQUFJLENBQUMsQ0FBQztNQUMxQztJQUNGLENBQUM7SUFDRHhCLElBQUksQ0FBQ3lCLGFBQWEsQ0FBQ0MsV0FBVyxDQUFFUCxjQUFlLENBQUM7SUFFaEQsSUFBSSxDQUFDUSxlQUFlLEdBQUcsTUFBTTtNQUMzQjNCLElBQUksQ0FBQ1csZ0JBQWdCLENBQUNpQixNQUFNLENBQUVyQixjQUFlLENBQUM7TUFDOUNQLElBQUksQ0FBQ3lCLGFBQWEsQ0FBQ0ksY0FBYyxDQUFFVixjQUFlLENBQUM7TUFDbkQsSUFBSSxDQUFDTixxQkFBcUIsQ0FBQ0csT0FBTyxDQUFFQyxJQUFJLElBQUk7UUFDMUNBLElBQUksQ0FBQ2EsSUFBSSxDQUFDLENBQUM7UUFDWG5DLFlBQVksQ0FBQ29DLG9CQUFvQixDQUFFZCxJQUFLLENBQUM7TUFDM0MsQ0FBRSxDQUFDO01BQ0gsSUFBSSxDQUFDRiw0QkFBNEIsQ0FBQ2UsSUFBSSxDQUFDLENBQUM7TUFDeENuQyxZQUFZLENBQUNvQyxvQkFBb0IsQ0FBRSxJQUFJLENBQUNoQiw0QkFBNkIsQ0FBQztJQUN4RSxDQUFDO0VBQ0g7O0VBRUE7QUFDRjtBQUNBO0VBQ2tCaUIsT0FBT0EsQ0FBQSxFQUFTO0lBQzlCLElBQUksQ0FBQ0wsZUFBZSxDQUFDLENBQUM7SUFDdEIsS0FBSyxDQUFDSyxPQUFPLENBQUMsQ0FBQztFQUNqQjtBQUNGO0FBRUFwQyxLQUFLLENBQUNxQyxRQUFRLENBQUUsVUFBVSxFQUFFbkMsUUFBUyxDQUFDO0FBRXRDLGVBQWVBLFFBQVEiLCJpZ25vcmVMaXN0IjpbXX0=