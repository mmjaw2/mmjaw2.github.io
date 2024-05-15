// Copyright 2016-2023, University of Colorado Boulder

/**
 * Fire button, just a simple subtype of RectangularPushButton.
 *
 * @author Andrea Lin (PhET Interactive Simulations)
 */

import optionize from '../../../../phet-core/js/optionize.js';
import { Image } from '../../../../scenery/js/imports.js';
import RectangularPushButton from '../../../../sun/js/buttons/RectangularPushButton.js';
import fireButton_png from '../../../mipmaps/fireButton_png.js';
import projectileMotion from '../../projectileMotion.js';
class FireButton extends RectangularPushButton {
  constructor(providedOptions) {
    const options = optionize()({
      baseColor: 'rgb( 234,33,38 )',
      // cannon red
      iconWidth: 20 // width of icon, used for scaling, the aspect ratio will determine height
    }, providedOptions);

    // fire button icon
    assert && assert(!options.content, 'this type sets its own content');
    options.content = new Image(fireButton_png);
    options.content.scale(options.iconWidth / options.content.width);
    super(options);
  }
}
projectileMotion.register('FireButton', FireButton);
export default FireButton;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJvcHRpb25pemUiLCJJbWFnZSIsIlJlY3Rhbmd1bGFyUHVzaEJ1dHRvbiIsImZpcmVCdXR0b25fcG5nIiwicHJvamVjdGlsZU1vdGlvbiIsIkZpcmVCdXR0b24iLCJjb25zdHJ1Y3RvciIsInByb3ZpZGVkT3B0aW9ucyIsIm9wdGlvbnMiLCJiYXNlQ29sb3IiLCJpY29uV2lkdGgiLCJhc3NlcnQiLCJjb250ZW50Iiwic2NhbGUiLCJ3aWR0aCIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiRmlyZUJ1dHRvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNi0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBGaXJlIGJ1dHRvbiwganVzdCBhIHNpbXBsZSBzdWJ0eXBlIG9mIFJlY3Rhbmd1bGFyUHVzaEJ1dHRvbi5cclxuICpcclxuICogQGF1dGhvciBBbmRyZWEgTGluIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCB7IEltYWdlIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IFJlY3Rhbmd1bGFyUHVzaEJ1dHRvbiwgeyBSZWN0YW5ndWxhclB1c2hCdXR0b25PcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vLi4vc3VuL2pzL2J1dHRvbnMvUmVjdGFuZ3VsYXJQdXNoQnV0dG9uLmpzJztcclxuaW1wb3J0IGZpcmVCdXR0b25fcG5nIGZyb20gJy4uLy4uLy4uL21pcG1hcHMvZmlyZUJ1dHRvbl9wbmcuanMnO1xyXG5pbXBvcnQgcHJvamVjdGlsZU1vdGlvbiBmcm9tICcuLi8uLi9wcm9qZWN0aWxlTW90aW9uLmpzJztcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcbiAgYmFzZUNvbG9yPzogc3RyaW5nO1xyXG4gIGljb25XaWR0aD86IG51bWJlcjtcclxufTtcclxudHlwZSBGaXJlQnV0dG9uT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgUmVjdGFuZ3VsYXJQdXNoQnV0dG9uT3B0aW9ucztcclxuXHJcbmNsYXNzIEZpcmVCdXR0b24gZXh0ZW5kcyBSZWN0YW5ndWxhclB1c2hCdXR0b24ge1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggcHJvdmlkZWRPcHRpb25zPzogRmlyZUJ1dHRvbk9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxGaXJlQnV0dG9uT3B0aW9ucywgU2VsZk9wdGlvbnMsIFJlY3Rhbmd1bGFyUHVzaEJ1dHRvbk9wdGlvbnM+KCkoIHtcclxuICAgICAgYmFzZUNvbG9yOiAncmdiKCAyMzQsMzMsMzggKScsIC8vIGNhbm5vbiByZWRcclxuICAgICAgaWNvbldpZHRoOiAyMCAvLyB3aWR0aCBvZiBpY29uLCB1c2VkIGZvciBzY2FsaW5nLCB0aGUgYXNwZWN0IHJhdGlvIHdpbGwgZGV0ZXJtaW5lIGhlaWdodFxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgLy8gZmlyZSBidXR0b24gaWNvblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIW9wdGlvbnMuY29udGVudCwgJ3RoaXMgdHlwZSBzZXRzIGl0cyBvd24gY29udGVudCcgKTtcclxuICAgIG9wdGlvbnMuY29udGVudCA9IG5ldyBJbWFnZSggZmlyZUJ1dHRvbl9wbmcgKTtcclxuICAgIG9wdGlvbnMuY29udGVudC5zY2FsZSggb3B0aW9ucy5pY29uV2lkdGggLyBvcHRpb25zLmNvbnRlbnQud2lkdGggKTtcclxuXHJcbiAgICBzdXBlciggb3B0aW9ucyApO1xyXG4gIH1cclxufVxyXG5cclxucHJvamVjdGlsZU1vdGlvbi5yZWdpc3RlciggJ0ZpcmVCdXR0b24nLCBGaXJlQnV0dG9uICk7XHJcbmV4cG9ydCBkZWZhdWx0IEZpcmVCdXR0b247Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFNBQVMsTUFBTSx1Q0FBdUM7QUFDN0QsU0FBU0MsS0FBSyxRQUFRLG1DQUFtQztBQUN6RCxPQUFPQyxxQkFBcUIsTUFBd0MscURBQXFEO0FBQ3pILE9BQU9DLGNBQWMsTUFBTSxvQ0FBb0M7QUFDL0QsT0FBT0MsZ0JBQWdCLE1BQU0sMkJBQTJCO0FBUXhELE1BQU1DLFVBQVUsU0FBU0gscUJBQXFCLENBQUM7RUFDdENJLFdBQVdBLENBQUVDLGVBQW1DLEVBQUc7SUFFeEQsTUFBTUMsT0FBTyxHQUFHUixTQUFTLENBQStELENBQUMsQ0FBRTtNQUN6RlMsU0FBUyxFQUFFLGtCQUFrQjtNQUFFO01BQy9CQyxTQUFTLEVBQUUsRUFBRSxDQUFDO0lBQ2hCLENBQUMsRUFBRUgsZUFBZ0IsQ0FBQzs7SUFFcEI7SUFDQUksTUFBTSxJQUFJQSxNQUFNLENBQUUsQ0FBQ0gsT0FBTyxDQUFDSSxPQUFPLEVBQUUsZ0NBQWlDLENBQUM7SUFDdEVKLE9BQU8sQ0FBQ0ksT0FBTyxHQUFHLElBQUlYLEtBQUssQ0FBRUUsY0FBZSxDQUFDO0lBQzdDSyxPQUFPLENBQUNJLE9BQU8sQ0FBQ0MsS0FBSyxDQUFFTCxPQUFPLENBQUNFLFNBQVMsR0FBR0YsT0FBTyxDQUFDSSxPQUFPLENBQUNFLEtBQU0sQ0FBQztJQUVsRSxLQUFLLENBQUVOLE9BQVEsQ0FBQztFQUNsQjtBQUNGO0FBRUFKLGdCQUFnQixDQUFDVyxRQUFRLENBQUUsWUFBWSxFQUFFVixVQUFXLENBQUM7QUFDckQsZUFBZUEsVUFBVSIsImlnbm9yZUxpc3QiOltdfQ==