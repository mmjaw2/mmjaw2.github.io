// Copyright 2014-2024, University of Colorado Boulder

/**
 * Generalized button for stepping forward or back.  While this class is not private, clients will generally use the
 * convenience subclasses: StepForwardButton and StepBackwardButton
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import { Shape } from '../../../kite/js/imports.js';
import InstanceRegistry from '../../../phet-core/js/documentation/InstanceRegistry.js';
import optionize from '../../../phet-core/js/optionize.js';
import { HBox, Path, Rectangle } from '../../../scenery/js/imports.js';
import RoundPushButton from '../../../sun/js/buttons/RoundPushButton.js';
import stepForwardSoundPlayer from '../../../tambo/js/shared-sound-players/stepForwardSoundPlayer.js';
import sceneryPhet from '../sceneryPhet.js';
import SceneryPhetStrings from '../SceneryPhetStrings.js';
const DEFAULT_RADIUS = 20;
const MARGIN_COEFFICIENT = 10.5 / DEFAULT_RADIUS;
export default class StepButton extends RoundPushButton {
  constructor(providedOptions) {
    // these options are used in computation of other default options
    const options = optionize()({
      // SelfOptions
      radius: DEFAULT_RADIUS,
      direction: 'forward',
      iconFill: 'black',
      // RoundPushButtonOptions
      fireOnHold: true,
      soundPlayer: stepForwardSoundPlayer,
      innerContent: SceneryPhetStrings.a11y.stepButton.stepForwardStringProperty,
      appendDescription: true
    }, providedOptions);
    assert && assert(options.direction === 'forward' || options.direction === 'backward', `unsupported direction: ${options.direction}`);

    // shift the content to center align, assumes 3D appearance and specific content
    options.xContentOffset = options.direction === 'forward' ? 0.075 * options.radius : -0.15 * options.radius;
    assert && assert(options.xMargin === undefined && options.yMargin === undefined, 'StepButton sets margins');
    options.xMargin = options.yMargin = options.radius * MARGIN_COEFFICIENT;

    // step icon is sized relative to the radius
    const BAR_WIDTH = options.radius * 0.15;
    const BAR_HEIGHT = options.radius * 0.9;
    const TRIANGLE_WIDTH = options.radius * 0.65;
    const TRIANGLE_HEIGHT = BAR_HEIGHT;

    // icon, in 'forward' orientation
    const barPath = new Rectangle(0, 0, BAR_WIDTH, BAR_HEIGHT, {
      fill: options.iconFill
    });
    const trianglePath = new Path(new Shape().moveTo(0, TRIANGLE_HEIGHT / 2).lineTo(TRIANGLE_WIDTH, 0).lineTo(0, -TRIANGLE_HEIGHT / 2).close(), {
      fill: options.iconFill
    });
    options.content = new HBox({
      children: [barPath, trianglePath],
      spacing: BAR_WIDTH,
      rotation: options.direction === 'forward' ? 0 : Math.PI
    });
    super(options);

    // support for binder documentation, stripped out in builds and only runs when ?binder is specified
    assert && phet?.chipper?.queryParameters?.binder && InstanceRegistry.registerDataURL('scenery-phet', 'StepButton', this);
  }
}
sceneryPhet.register('StepButton', StepButton);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTaGFwZSIsIkluc3RhbmNlUmVnaXN0cnkiLCJvcHRpb25pemUiLCJIQm94IiwiUGF0aCIsIlJlY3RhbmdsZSIsIlJvdW5kUHVzaEJ1dHRvbiIsInN0ZXBGb3J3YXJkU291bmRQbGF5ZXIiLCJzY2VuZXJ5UGhldCIsIlNjZW5lcnlQaGV0U3RyaW5ncyIsIkRFRkFVTFRfUkFESVVTIiwiTUFSR0lOX0NPRUZGSUNJRU5UIiwiU3RlcEJ1dHRvbiIsImNvbnN0cnVjdG9yIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsInJhZGl1cyIsImRpcmVjdGlvbiIsImljb25GaWxsIiwiZmlyZU9uSG9sZCIsInNvdW5kUGxheWVyIiwiaW5uZXJDb250ZW50IiwiYTExeSIsInN0ZXBCdXR0b24iLCJzdGVwRm9yd2FyZFN0cmluZ1Byb3BlcnR5IiwiYXBwZW5kRGVzY3JpcHRpb24iLCJhc3NlcnQiLCJ4Q29udGVudE9mZnNldCIsInhNYXJnaW4iLCJ1bmRlZmluZWQiLCJ5TWFyZ2luIiwiQkFSX1dJRFRIIiwiQkFSX0hFSUdIVCIsIlRSSUFOR0xFX1dJRFRIIiwiVFJJQU5HTEVfSEVJR0hUIiwiYmFyUGF0aCIsImZpbGwiLCJ0cmlhbmdsZVBhdGgiLCJtb3ZlVG8iLCJsaW5lVG8iLCJjbG9zZSIsImNvbnRlbnQiLCJjaGlsZHJlbiIsInNwYWNpbmciLCJyb3RhdGlvbiIsIk1hdGgiLCJQSSIsInBoZXQiLCJjaGlwcGVyIiwicXVlcnlQYXJhbWV0ZXJzIiwiYmluZGVyIiwicmVnaXN0ZXJEYXRhVVJMIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJTdGVwQnV0dG9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE0LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEdlbmVyYWxpemVkIGJ1dHRvbiBmb3Igc3RlcHBpbmcgZm9yd2FyZCBvciBiYWNrLiAgV2hpbGUgdGhpcyBjbGFzcyBpcyBub3QgcHJpdmF0ZSwgY2xpZW50cyB3aWxsIGdlbmVyYWxseSB1c2UgdGhlXHJcbiAqIGNvbnZlbmllbmNlIHN1YmNsYXNzZXM6IFN0ZXBGb3J3YXJkQnV0dG9uIGFuZCBTdGVwQmFja3dhcmRCdXR0b25cclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICovXHJcblxyXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gJy4uLy4uLy4uL2tpdGUvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IEluc3RhbmNlUmVnaXN0cnkgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL2RvY3VtZW50YXRpb24vSW5zdGFuY2VSZWdpc3RyeS5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCB7IEhCb3gsIFRQYWludCwgUGF0aCwgUmVjdGFuZ2xlIH0gZnJvbSAnLi4vLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IFJvdW5kUHVzaEJ1dHRvbiwgeyBSb3VuZFB1c2hCdXR0b25PcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vc3VuL2pzL2J1dHRvbnMvUm91bmRQdXNoQnV0dG9uLmpzJztcclxuaW1wb3J0IHN0ZXBGb3J3YXJkU291bmRQbGF5ZXIgZnJvbSAnLi4vLi4vLi4vdGFtYm8vanMvc2hhcmVkLXNvdW5kLXBsYXllcnMvc3RlcEZvcndhcmRTb3VuZFBsYXllci5qcyc7XHJcbmltcG9ydCBzY2VuZXJ5UGhldCBmcm9tICcuLi9zY2VuZXJ5UGhldC5qcyc7XHJcbmltcG9ydCBTY2VuZXJ5UGhldFN0cmluZ3MgZnJvbSAnLi4vU2NlbmVyeVBoZXRTdHJpbmdzLmpzJztcclxuXHJcbmNvbnN0IERFRkFVTFRfUkFESVVTID0gMjA7XHJcbmNvbnN0IE1BUkdJTl9DT0VGRklDSUVOVCA9IDEwLjUgLyBERUZBVUxUX1JBRElVUztcclxuXHJcbnR5cGUgRGlyZWN0aW9uID0gJ2ZvcndhcmQnIHwgJ2JhY2t3YXJkJztcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcbiAgcmFkaXVzPzogbnVtYmVyO1xyXG4gIGRpcmVjdGlvbj86IERpcmVjdGlvbjtcclxuICBpY29uRmlsbD86IFRQYWludDtcclxufTtcclxuXHJcbmV4cG9ydCB0eXBlIFN0ZXBCdXR0b25PcHRpb25zID0gU2VsZk9wdGlvbnMgJlxyXG4gIFN0cmljdE9taXQ8Um91bmRQdXNoQnV0dG9uT3B0aW9ucywgJ2NvbnRlbnQnIHwgJ3hDb250ZW50T2Zmc2V0JyB8ICd4TWFyZ2luJyB8ICd5TWFyZ2luJz47XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTdGVwQnV0dG9uIGV4dGVuZHMgUm91bmRQdXNoQnV0dG9uIHtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBwcm92aWRlZE9wdGlvbnM/OiBTdGVwQnV0dG9uT3B0aW9ucyApIHtcclxuXHJcbiAgICAvLyB0aGVzZSBvcHRpb25zIGFyZSB1c2VkIGluIGNvbXB1dGF0aW9uIG9mIG90aGVyIGRlZmF1bHQgb3B0aW9uc1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxTdGVwQnV0dG9uT3B0aW9ucywgU2VsZk9wdGlvbnMsIFJvdW5kUHVzaEJ1dHRvbk9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgIC8vIFNlbGZPcHRpb25zXHJcbiAgICAgIHJhZGl1czogREVGQVVMVF9SQURJVVMsXHJcbiAgICAgIGRpcmVjdGlvbjogJ2ZvcndhcmQnLFxyXG4gICAgICBpY29uRmlsbDogJ2JsYWNrJyxcclxuXHJcbiAgICAgIC8vIFJvdW5kUHVzaEJ1dHRvbk9wdGlvbnNcclxuICAgICAgZmlyZU9uSG9sZDogdHJ1ZSxcclxuICAgICAgc291bmRQbGF5ZXI6IHN0ZXBGb3J3YXJkU291bmRQbGF5ZXIsXHJcbiAgICAgIGlubmVyQ29udGVudDogU2NlbmVyeVBoZXRTdHJpbmdzLmExMXkuc3RlcEJ1dHRvbi5zdGVwRm9yd2FyZFN0cmluZ1Byb3BlcnR5LFxyXG4gICAgICBhcHBlbmREZXNjcmlwdGlvbjogdHJ1ZVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5kaXJlY3Rpb24gPT09ICdmb3J3YXJkJyB8fCBvcHRpb25zLmRpcmVjdGlvbiA9PT0gJ2JhY2t3YXJkJyxcclxuICAgICAgYHVuc3VwcG9ydGVkIGRpcmVjdGlvbjogJHtvcHRpb25zLmRpcmVjdGlvbn1gICk7XHJcblxyXG4gICAgLy8gc2hpZnQgdGhlIGNvbnRlbnQgdG8gY2VudGVyIGFsaWduLCBhc3N1bWVzIDNEIGFwcGVhcmFuY2UgYW5kIHNwZWNpZmljIGNvbnRlbnRcclxuICAgIG9wdGlvbnMueENvbnRlbnRPZmZzZXQgPSAoIG9wdGlvbnMuZGlyZWN0aW9uID09PSAnZm9yd2FyZCcgKSA/ICggMC4wNzUgKiBvcHRpb25zLnJhZGl1cyApIDogKCAtMC4xNSAqIG9wdGlvbnMucmFkaXVzICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy54TWFyZ2luID09PSB1bmRlZmluZWQgJiYgb3B0aW9ucy55TWFyZ2luID09PSB1bmRlZmluZWQsICdTdGVwQnV0dG9uIHNldHMgbWFyZ2lucycgKTtcclxuICAgIG9wdGlvbnMueE1hcmdpbiA9IG9wdGlvbnMueU1hcmdpbiA9IG9wdGlvbnMucmFkaXVzICogTUFSR0lOX0NPRUZGSUNJRU5UO1xyXG5cclxuICAgIC8vIHN0ZXAgaWNvbiBpcyBzaXplZCByZWxhdGl2ZSB0byB0aGUgcmFkaXVzXHJcbiAgICBjb25zdCBCQVJfV0lEVEggPSBvcHRpb25zLnJhZGl1cyAqIDAuMTU7XHJcbiAgICBjb25zdCBCQVJfSEVJR0hUID0gb3B0aW9ucy5yYWRpdXMgKiAwLjk7XHJcbiAgICBjb25zdCBUUklBTkdMRV9XSURUSCA9IG9wdGlvbnMucmFkaXVzICogMC42NTtcclxuICAgIGNvbnN0IFRSSUFOR0xFX0hFSUdIVCA9IEJBUl9IRUlHSFQ7XHJcblxyXG4gICAgLy8gaWNvbiwgaW4gJ2ZvcndhcmQnIG9yaWVudGF0aW9uXHJcbiAgICBjb25zdCBiYXJQYXRoID0gbmV3IFJlY3RhbmdsZSggMCwgMCwgQkFSX1dJRFRILCBCQVJfSEVJR0hULCB7IGZpbGw6IG9wdGlvbnMuaWNvbkZpbGwgfSApO1xyXG4gICAgY29uc3QgdHJpYW5nbGVQYXRoID0gbmV3IFBhdGgoIG5ldyBTaGFwZSgpXHJcbiAgICAgIC5tb3ZlVG8oIDAsIFRSSUFOR0xFX0hFSUdIVCAvIDIgKVxyXG4gICAgICAubGluZVRvKCBUUklBTkdMRV9XSURUSCwgMCApXHJcbiAgICAgIC5saW5lVG8oIDAsIC1UUklBTkdMRV9IRUlHSFQgLyAyIClcclxuICAgICAgLmNsb3NlKCksIHtcclxuICAgICAgZmlsbDogb3B0aW9ucy5pY29uRmlsbFxyXG4gICAgfSApO1xyXG4gICAgb3B0aW9ucy5jb250ZW50ID0gbmV3IEhCb3goIHtcclxuICAgICAgY2hpbGRyZW46IFsgYmFyUGF0aCwgdHJpYW5nbGVQYXRoIF0sXHJcbiAgICAgIHNwYWNpbmc6IEJBUl9XSURUSCxcclxuICAgICAgcm90YXRpb246ICggb3B0aW9ucy5kaXJlY3Rpb24gPT09ICdmb3J3YXJkJyApID8gMCA6IE1hdGguUElcclxuICAgIH0gKTtcclxuXHJcbiAgICBzdXBlciggb3B0aW9ucyApO1xyXG5cclxuICAgIC8vIHN1cHBvcnQgZm9yIGJpbmRlciBkb2N1bWVudGF0aW9uLCBzdHJpcHBlZCBvdXQgaW4gYnVpbGRzIGFuZCBvbmx5IHJ1bnMgd2hlbiA/YmluZGVyIGlzIHNwZWNpZmllZFxyXG4gICAgYXNzZXJ0ICYmIHBoZXQ/LmNoaXBwZXI/LnF1ZXJ5UGFyYW1ldGVycz8uYmluZGVyICYmIEluc3RhbmNlUmVnaXN0cnkucmVnaXN0ZXJEYXRhVVJMKCAnc2NlbmVyeS1waGV0JywgJ1N0ZXBCdXR0b24nLCB0aGlzICk7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5UGhldC5yZWdpc3RlciggJ1N0ZXBCdXR0b24nLCBTdGVwQnV0dG9uICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxTQUFTQSxLQUFLLFFBQVEsNkJBQTZCO0FBRW5ELE9BQU9DLGdCQUFnQixNQUFNLHlEQUF5RDtBQUN0RixPQUFPQyxTQUFTLE1BQU0sb0NBQW9DO0FBQzFELFNBQVNDLElBQUksRUFBVUMsSUFBSSxFQUFFQyxTQUFTLFFBQVEsZ0NBQWdDO0FBQzlFLE9BQU9DLGVBQWUsTUFBa0MsNENBQTRDO0FBQ3BHLE9BQU9DLHNCQUFzQixNQUFNLGtFQUFrRTtBQUNyRyxPQUFPQyxXQUFXLE1BQU0sbUJBQW1CO0FBQzNDLE9BQU9DLGtCQUFrQixNQUFNLDBCQUEwQjtBQUV6RCxNQUFNQyxjQUFjLEdBQUcsRUFBRTtBQUN6QixNQUFNQyxrQkFBa0IsR0FBRyxJQUFJLEdBQUdELGNBQWM7QUFhaEQsZUFBZSxNQUFNRSxVQUFVLFNBQVNOLGVBQWUsQ0FBQztFQUUvQ08sV0FBV0EsQ0FBRUMsZUFBbUMsRUFBRztJQUV4RDtJQUNBLE1BQU1DLE9BQU8sR0FBR2IsU0FBUyxDQUF5RCxDQUFDLENBQUU7TUFFbkY7TUFDQWMsTUFBTSxFQUFFTixjQUFjO01BQ3RCTyxTQUFTLEVBQUUsU0FBUztNQUNwQkMsUUFBUSxFQUFFLE9BQU87TUFFakI7TUFDQUMsVUFBVSxFQUFFLElBQUk7TUFDaEJDLFdBQVcsRUFBRWIsc0JBQXNCO01BQ25DYyxZQUFZLEVBQUVaLGtCQUFrQixDQUFDYSxJQUFJLENBQUNDLFVBQVUsQ0FBQ0MseUJBQXlCO01BQzFFQyxpQkFBaUIsRUFBRTtJQUNyQixDQUFDLEVBQUVYLGVBQWdCLENBQUM7SUFFcEJZLE1BQU0sSUFBSUEsTUFBTSxDQUFFWCxPQUFPLENBQUNFLFNBQVMsS0FBSyxTQUFTLElBQUlGLE9BQU8sQ0FBQ0UsU0FBUyxLQUFLLFVBQVUsRUFDbEYsMEJBQXlCRixPQUFPLENBQUNFLFNBQVUsRUFBRSxDQUFDOztJQUVqRDtJQUNBRixPQUFPLENBQUNZLGNBQWMsR0FBS1osT0FBTyxDQUFDRSxTQUFTLEtBQUssU0FBUyxHQUFPLEtBQUssR0FBR0YsT0FBTyxDQUFDQyxNQUFNLEdBQU8sQ0FBQyxJQUFJLEdBQUdELE9BQU8sQ0FBQ0MsTUFBUTtJQUV0SFUsTUFBTSxJQUFJQSxNQUFNLENBQUVYLE9BQU8sQ0FBQ2EsT0FBTyxLQUFLQyxTQUFTLElBQUlkLE9BQU8sQ0FBQ2UsT0FBTyxLQUFLRCxTQUFTLEVBQUUseUJBQTBCLENBQUM7SUFDN0dkLE9BQU8sQ0FBQ2EsT0FBTyxHQUFHYixPQUFPLENBQUNlLE9BQU8sR0FBR2YsT0FBTyxDQUFDQyxNQUFNLEdBQUdMLGtCQUFrQjs7SUFFdkU7SUFDQSxNQUFNb0IsU0FBUyxHQUFHaEIsT0FBTyxDQUFDQyxNQUFNLEdBQUcsSUFBSTtJQUN2QyxNQUFNZ0IsVUFBVSxHQUFHakIsT0FBTyxDQUFDQyxNQUFNLEdBQUcsR0FBRztJQUN2QyxNQUFNaUIsY0FBYyxHQUFHbEIsT0FBTyxDQUFDQyxNQUFNLEdBQUcsSUFBSTtJQUM1QyxNQUFNa0IsZUFBZSxHQUFHRixVQUFVOztJQUVsQztJQUNBLE1BQU1HLE9BQU8sR0FBRyxJQUFJOUIsU0FBUyxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUwQixTQUFTLEVBQUVDLFVBQVUsRUFBRTtNQUFFSSxJQUFJLEVBQUVyQixPQUFPLENBQUNHO0lBQVMsQ0FBRSxDQUFDO0lBQ3hGLE1BQU1tQixZQUFZLEdBQUcsSUFBSWpDLElBQUksQ0FBRSxJQUFJSixLQUFLLENBQUMsQ0FBQyxDQUN2Q3NDLE1BQU0sQ0FBRSxDQUFDLEVBQUVKLGVBQWUsR0FBRyxDQUFFLENBQUMsQ0FDaENLLE1BQU0sQ0FBRU4sY0FBYyxFQUFFLENBQUUsQ0FBQyxDQUMzQk0sTUFBTSxDQUFFLENBQUMsRUFBRSxDQUFDTCxlQUFlLEdBQUcsQ0FBRSxDQUFDLENBQ2pDTSxLQUFLLENBQUMsQ0FBQyxFQUFFO01BQ1ZKLElBQUksRUFBRXJCLE9BQU8sQ0FBQ0c7SUFDaEIsQ0FBRSxDQUFDO0lBQ0hILE9BQU8sQ0FBQzBCLE9BQU8sR0FBRyxJQUFJdEMsSUFBSSxDQUFFO01BQzFCdUMsUUFBUSxFQUFFLENBQUVQLE9BQU8sRUFBRUUsWUFBWSxDQUFFO01BQ25DTSxPQUFPLEVBQUVaLFNBQVM7TUFDbEJhLFFBQVEsRUFBSTdCLE9BQU8sQ0FBQ0UsU0FBUyxLQUFLLFNBQVMsR0FBSyxDQUFDLEdBQUc0QixJQUFJLENBQUNDO0lBQzNELENBQUUsQ0FBQztJQUVILEtBQUssQ0FBRS9CLE9BQVEsQ0FBQzs7SUFFaEI7SUFDQVcsTUFBTSxJQUFJcUIsSUFBSSxFQUFFQyxPQUFPLEVBQUVDLGVBQWUsRUFBRUMsTUFBTSxJQUFJakQsZ0JBQWdCLENBQUNrRCxlQUFlLENBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxJQUFLLENBQUM7RUFDNUg7QUFDRjtBQUVBM0MsV0FBVyxDQUFDNEMsUUFBUSxDQUFFLFlBQVksRUFBRXhDLFVBQVcsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==