// Copyright 2015-2024, University of Colorado Boulder

/**
 * Light bulb, made to 'glow' by modulating opacity of the 'on' image.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Utils from '../../dot/js/Utils.js';
import InstanceRegistry from '../../phet-core/js/documentation/InstanceRegistry.js';
import optionize from '../../phet-core/js/optionize.js';
import { Image, Node } from '../../scenery/js/imports.js';
import lightBulbOff_png from '../mipmaps/lightBulbOff_png.js';
import lightBulbOn_png from '../mipmaps/lightBulbOn_png.js';
import LightRaysNode from './LightRaysNode.js';
import sceneryPhet from './sceneryPhet.js';
export default class LightBulbNode extends Node {
  /**
   * @param brightnessProperty - brightness of the bulb, 0 (off) to 1 (full brightness)
   * @param [providedOptions]
   */
  constructor(brightnessProperty, providedOptions) {
    const options = optionize()({
      bulbImageScale: 0.33,
      lightBulbOnImage: lightBulbOn_png,
      lightBulbOffImage: lightBulbOff_png
    }, providedOptions);
    const onNode = new Image(options.lightBulbOnImage, {
      scale: options.bulbImageScale,
      centerX: 0,
      bottom: 0
    });
    const offNode = new Image(options.lightBulbOffImage, {
      scale: options.bulbImageScale,
      centerX: onNode.centerX,
      bottom: onNode.bottom
    });

    // rays
    const bulbRadius = offNode.width / 2; // use 'off' node, the 'on' node is wider because it has a glow around it.
    const raysNode = new LightRaysNode(bulbRadius, optionize()({
      x: onNode.centerX,
      y: offNode.top + bulbRadius
    }, options.lightRaysNodeOptions));
    options.children = [raysNode, offNode, onNode];
    super(options);
    this.onNode = onNode;
    this.raysNode = raysNode;
    this.brightnessProperty = brightnessProperty;

    // Updates this Node when it becomes visible.
    this.visibleProperty.link(visible => visible && this.update());
    const brightnessObserver = brightness => this.update();
    brightnessProperty.link(brightnessObserver);
    this.disposeLightBulbNode = () => {
      brightnessProperty.unlink(brightnessObserver);
    };

    // support for binder documentation, stripped out in builds and only runs when ?binder is specified
    assert && phet?.chipper?.queryParameters?.binder && InstanceRegistry.registerDataURL('scenery-phet', 'LightBulbNode', this);
  }
  dispose() {
    this.disposeLightBulbNode();
    super.dispose();
  }

  /**
   * Updates the bulb. For performance, this is a no-op when the bulb is not visible.
   */
  update() {
    if (this.visible) {
      const brightness = this.brightnessProperty.value;
      assert && assert(brightness >= 0 && brightness <= 1);
      this.onNode.visible = brightness > 0;
      if (this.onNode.visible) {
        this.onNode.opacity = Utils.linear(0, 1, 0.3, 1, brightness);
      }
      this.raysNode.setBrightness(brightness);
    }
  }
}
sceneryPhet.register('LightBulbNode', LightBulbNode);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJVdGlscyIsIkluc3RhbmNlUmVnaXN0cnkiLCJvcHRpb25pemUiLCJJbWFnZSIsIk5vZGUiLCJsaWdodEJ1bGJPZmZfcG5nIiwibGlnaHRCdWxiT25fcG5nIiwiTGlnaHRSYXlzTm9kZSIsInNjZW5lcnlQaGV0IiwiTGlnaHRCdWxiTm9kZSIsImNvbnN0cnVjdG9yIiwiYnJpZ2h0bmVzc1Byb3BlcnR5IiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsImJ1bGJJbWFnZVNjYWxlIiwibGlnaHRCdWxiT25JbWFnZSIsImxpZ2h0QnVsYk9mZkltYWdlIiwib25Ob2RlIiwic2NhbGUiLCJjZW50ZXJYIiwiYm90dG9tIiwib2ZmTm9kZSIsImJ1bGJSYWRpdXMiLCJ3aWR0aCIsInJheXNOb2RlIiwieCIsInkiLCJ0b3AiLCJsaWdodFJheXNOb2RlT3B0aW9ucyIsImNoaWxkcmVuIiwidmlzaWJsZVByb3BlcnR5IiwibGluayIsInZpc2libGUiLCJ1cGRhdGUiLCJicmlnaHRuZXNzT2JzZXJ2ZXIiLCJicmlnaHRuZXNzIiwiZGlzcG9zZUxpZ2h0QnVsYk5vZGUiLCJ1bmxpbmsiLCJhc3NlcnQiLCJwaGV0IiwiY2hpcHBlciIsInF1ZXJ5UGFyYW1ldGVycyIsImJpbmRlciIsInJlZ2lzdGVyRGF0YVVSTCIsImRpc3Bvc2UiLCJ2YWx1ZSIsIm9wYWNpdHkiLCJsaW5lYXIiLCJzZXRCcmlnaHRuZXNzIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJMaWdodEJ1bGJOb2RlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE1LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIExpZ2h0IGJ1bGIsIG1hZGUgdG8gJ2dsb3cnIGJ5IG1vZHVsYXRpbmcgb3BhY2l0eSBvZiB0aGUgJ29uJyBpbWFnZS5cclxuICpcclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICovXHJcblxyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBVdGlscyBmcm9tICcuLi8uLi9kb3QvanMvVXRpbHMuanMnO1xyXG5pbXBvcnQgSW5zdGFuY2VSZWdpc3RyeSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvZG9jdW1lbnRhdGlvbi9JbnN0YW5jZVJlZ2lzdHJ5LmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBFbXB0eVNlbGZPcHRpb25zIH0gZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IHsgSW1hZ2UsIEltYWdlYWJsZUltYWdlLCBOb2RlLCBOb2RlT3B0aW9ucyB9IGZyb20gJy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBsaWdodEJ1bGJPZmZfcG5nIGZyb20gJy4uL21pcG1hcHMvbGlnaHRCdWxiT2ZmX3BuZy5qcyc7XHJcbmltcG9ydCBsaWdodEJ1bGJPbl9wbmcgZnJvbSAnLi4vbWlwbWFwcy9saWdodEJ1bGJPbl9wbmcuanMnO1xyXG5pbXBvcnQgTGlnaHRSYXlzTm9kZSwgeyBMaWdodFJheXNOb2RlT3B0aW9ucyB9IGZyb20gJy4vTGlnaHRSYXlzTm9kZS5qcyc7XHJcbmltcG9ydCBzY2VuZXJ5UGhldCBmcm9tICcuL3NjZW5lcnlQaGV0LmpzJztcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcbiAgYnVsYkltYWdlU2NhbGU/OiBudW1iZXI7XHJcbiAgbGlnaHRSYXlzTm9kZU9wdGlvbnM/OiBMaWdodFJheXNOb2RlT3B0aW9ucztcclxuICBsaWdodEJ1bGJPbkltYWdlPzogSW1hZ2VhYmxlSW1hZ2U7XHJcbiAgbGlnaHRCdWxiT2ZmSW1hZ2U/OiBJbWFnZWFibGVJbWFnZTtcclxufTtcclxuZXhwb3J0IHR5cGUgTGlnaHRCdWxiTm9kZU9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIFN0cmljdE9taXQ8Tm9kZU9wdGlvbnMsICdjaGlsZHJlbic+O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGlnaHRCdWxiTm9kZSBleHRlbmRzIE5vZGUge1xyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IG9uTm9kZTogTm9kZTtcclxuICBwcml2YXRlIHJlYWRvbmx5IHJheXNOb2RlOiBMaWdodFJheXNOb2RlO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgYnJpZ2h0bmVzc1Byb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxudW1iZXI+O1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzcG9zZUxpZ2h0QnVsYk5vZGU6ICgpID0+IHZvaWQ7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBicmlnaHRuZXNzUHJvcGVydHkgLSBicmlnaHRuZXNzIG9mIHRoZSBidWxiLCAwIChvZmYpIHRvIDEgKGZ1bGwgYnJpZ2h0bmVzcylcclxuICAgKiBAcGFyYW0gW3Byb3ZpZGVkT3B0aW9uc11cclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIGJyaWdodG5lc3NQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8bnVtYmVyPiwgcHJvdmlkZWRPcHRpb25zPzogTGlnaHRCdWxiTm9kZU9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxMaWdodEJ1bGJOb2RlT3B0aW9ucywgU3RyaWN0T21pdDxTZWxmT3B0aW9ucywgJ2xpZ2h0UmF5c05vZGVPcHRpb25zJz4sIE5vZGVPcHRpb25zPigpKCB7XHJcbiAgICAgIGJ1bGJJbWFnZVNjYWxlOiAwLjMzLFxyXG4gICAgICBsaWdodEJ1bGJPbkltYWdlOiBsaWdodEJ1bGJPbl9wbmcsXHJcbiAgICAgIGxpZ2h0QnVsYk9mZkltYWdlOiBsaWdodEJ1bGJPZmZfcG5nXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBjb25zdCBvbk5vZGUgPSBuZXcgSW1hZ2UoIG9wdGlvbnMubGlnaHRCdWxiT25JbWFnZSwge1xyXG4gICAgICBzY2FsZTogb3B0aW9ucy5idWxiSW1hZ2VTY2FsZSxcclxuICAgICAgY2VudGVyWDogMCxcclxuICAgICAgYm90dG9tOiAwXHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3Qgb2ZmTm9kZSA9IG5ldyBJbWFnZSggb3B0aW9ucy5saWdodEJ1bGJPZmZJbWFnZSwge1xyXG4gICAgICBzY2FsZTogb3B0aW9ucy5idWxiSW1hZ2VTY2FsZSxcclxuICAgICAgY2VudGVyWDogb25Ob2RlLmNlbnRlclgsXHJcbiAgICAgIGJvdHRvbTogb25Ob2RlLmJvdHRvbVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIHJheXNcclxuICAgIGNvbnN0IGJ1bGJSYWRpdXMgPSBvZmZOb2RlLndpZHRoIC8gMjsgLy8gdXNlICdvZmYnIG5vZGUsIHRoZSAnb24nIG5vZGUgaXMgd2lkZXIgYmVjYXVzZSBpdCBoYXMgYSBnbG93IGFyb3VuZCBpdC5cclxuICAgIGNvbnN0IHJheXNOb2RlID0gbmV3IExpZ2h0UmF5c05vZGUoIGJ1bGJSYWRpdXMsXHJcbiAgICAgIG9wdGlvbml6ZTxMaWdodFJheXNOb2RlT3B0aW9ucywgRW1wdHlTZWxmT3B0aW9ucywgTGlnaHRSYXlzTm9kZU9wdGlvbnM+KCkoIHtcclxuICAgICAgICB4OiBvbk5vZGUuY2VudGVyWCxcclxuICAgICAgICB5OiBvZmZOb2RlLnRvcCArIGJ1bGJSYWRpdXNcclxuICAgICAgfSwgb3B0aW9ucy5saWdodFJheXNOb2RlT3B0aW9ucyApICk7XHJcblxyXG4gICAgb3B0aW9ucy5jaGlsZHJlbiA9IFsgcmF5c05vZGUsIG9mZk5vZGUsIG9uTm9kZSBdO1xyXG5cclxuICAgIHN1cGVyKCBvcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy5vbk5vZGUgPSBvbk5vZGU7XHJcbiAgICB0aGlzLnJheXNOb2RlID0gcmF5c05vZGU7XHJcbiAgICB0aGlzLmJyaWdodG5lc3NQcm9wZXJ0eSA9IGJyaWdodG5lc3NQcm9wZXJ0eTtcclxuXHJcbiAgICAvLyBVcGRhdGVzIHRoaXMgTm9kZSB3aGVuIGl0IGJlY29tZXMgdmlzaWJsZS5cclxuICAgIHRoaXMudmlzaWJsZVByb3BlcnR5LmxpbmsoIHZpc2libGUgPT4gdmlzaWJsZSAmJiB0aGlzLnVwZGF0ZSgpICk7XHJcblxyXG4gICAgY29uc3QgYnJpZ2h0bmVzc09ic2VydmVyID0gKCBicmlnaHRuZXNzOiBudW1iZXIgKSA9PiB0aGlzLnVwZGF0ZSgpO1xyXG4gICAgYnJpZ2h0bmVzc1Byb3BlcnR5LmxpbmsoIGJyaWdodG5lc3NPYnNlcnZlciApO1xyXG5cclxuICAgIHRoaXMuZGlzcG9zZUxpZ2h0QnVsYk5vZGUgPSAoKSA9PiB7XHJcbiAgICAgIGJyaWdodG5lc3NQcm9wZXJ0eS51bmxpbmsoIGJyaWdodG5lc3NPYnNlcnZlciApO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBzdXBwb3J0IGZvciBiaW5kZXIgZG9jdW1lbnRhdGlvbiwgc3RyaXBwZWQgb3V0IGluIGJ1aWxkcyBhbmQgb25seSBydW5zIHdoZW4gP2JpbmRlciBpcyBzcGVjaWZpZWRcclxuICAgIGFzc2VydCAmJiBwaGV0Py5jaGlwcGVyPy5xdWVyeVBhcmFtZXRlcnM/LmJpbmRlciAmJiBJbnN0YW5jZVJlZ2lzdHJ5LnJlZ2lzdGVyRGF0YVVSTCggJ3NjZW5lcnktcGhldCcsICdMaWdodEJ1bGJOb2RlJywgdGhpcyApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmRpc3Bvc2VMaWdodEJ1bGJOb2RlKCk7XHJcbiAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVcGRhdGVzIHRoZSBidWxiLiBGb3IgcGVyZm9ybWFuY2UsIHRoaXMgaXMgYSBuby1vcCB3aGVuIHRoZSBidWxiIGlzIG5vdCB2aXNpYmxlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgdXBkYXRlKCk6IHZvaWQge1xyXG4gICAgaWYgKCB0aGlzLnZpc2libGUgKSB7XHJcbiAgICAgIGNvbnN0IGJyaWdodG5lc3MgPSB0aGlzLmJyaWdodG5lc3NQcm9wZXJ0eS52YWx1ZTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggYnJpZ2h0bmVzcyA+PSAwICYmIGJyaWdodG5lc3MgPD0gMSApO1xyXG4gICAgICB0aGlzLm9uTm9kZS52aXNpYmxlID0gKCBicmlnaHRuZXNzID4gMCApO1xyXG4gICAgICBpZiAoIHRoaXMub25Ob2RlLnZpc2libGUgKSB7XHJcbiAgICAgICAgdGhpcy5vbk5vZGUub3BhY2l0eSA9IFV0aWxzLmxpbmVhciggMCwgMSwgMC4zLCAxLCBicmlnaHRuZXNzICk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5yYXlzTm9kZS5zZXRCcmlnaHRuZXNzKCBicmlnaHRuZXNzICk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5UGhldC5yZWdpc3RlciggJ0xpZ2h0QnVsYk5vZGUnLCBMaWdodEJ1bGJOb2RlICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUdBLE9BQU9BLEtBQUssTUFBTSx1QkFBdUI7QUFDekMsT0FBT0MsZ0JBQWdCLE1BQU0sc0RBQXNEO0FBQ25GLE9BQU9DLFNBQVMsTUFBNEIsaUNBQWlDO0FBRTdFLFNBQVNDLEtBQUssRUFBa0JDLElBQUksUUFBcUIsNkJBQTZCO0FBQ3RGLE9BQU9DLGdCQUFnQixNQUFNLGdDQUFnQztBQUM3RCxPQUFPQyxlQUFlLE1BQU0sK0JBQStCO0FBQzNELE9BQU9DLGFBQWEsTUFBZ0Msb0JBQW9CO0FBQ3hFLE9BQU9DLFdBQVcsTUFBTSxrQkFBa0I7QUFVMUMsZUFBZSxNQUFNQyxhQUFhLFNBQVNMLElBQUksQ0FBQztFQU85QztBQUNGO0FBQ0E7QUFDQTtFQUNTTSxXQUFXQSxDQUFFQyxrQkFBNkMsRUFBRUMsZUFBc0MsRUFBRztJQUUxRyxNQUFNQyxPQUFPLEdBQUdYLFNBQVMsQ0FBcUYsQ0FBQyxDQUFFO01BQy9HWSxjQUFjLEVBQUUsSUFBSTtNQUNwQkMsZ0JBQWdCLEVBQUVULGVBQWU7TUFDakNVLGlCQUFpQixFQUFFWDtJQUNyQixDQUFDLEVBQUVPLGVBQWdCLENBQUM7SUFFcEIsTUFBTUssTUFBTSxHQUFHLElBQUlkLEtBQUssQ0FBRVUsT0FBTyxDQUFDRSxnQkFBZ0IsRUFBRTtNQUNsREcsS0FBSyxFQUFFTCxPQUFPLENBQUNDLGNBQWM7TUFDN0JLLE9BQU8sRUFBRSxDQUFDO01BQ1ZDLE1BQU0sRUFBRTtJQUNWLENBQUUsQ0FBQztJQUVILE1BQU1DLE9BQU8sR0FBRyxJQUFJbEIsS0FBSyxDQUFFVSxPQUFPLENBQUNHLGlCQUFpQixFQUFFO01BQ3BERSxLQUFLLEVBQUVMLE9BQU8sQ0FBQ0MsY0FBYztNQUM3QkssT0FBTyxFQUFFRixNQUFNLENBQUNFLE9BQU87TUFDdkJDLE1BQU0sRUFBRUgsTUFBTSxDQUFDRztJQUNqQixDQUFFLENBQUM7O0lBRUg7SUFDQSxNQUFNRSxVQUFVLEdBQUdELE9BQU8sQ0FBQ0UsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLE1BQU1DLFFBQVEsR0FBRyxJQUFJakIsYUFBYSxDQUFFZSxVQUFVLEVBQzVDcEIsU0FBUyxDQUErRCxDQUFDLENBQUU7TUFDekV1QixDQUFDLEVBQUVSLE1BQU0sQ0FBQ0UsT0FBTztNQUNqQk8sQ0FBQyxFQUFFTCxPQUFPLENBQUNNLEdBQUcsR0FBR0w7SUFDbkIsQ0FBQyxFQUFFVCxPQUFPLENBQUNlLG9CQUFxQixDQUFFLENBQUM7SUFFckNmLE9BQU8sQ0FBQ2dCLFFBQVEsR0FBRyxDQUFFTCxRQUFRLEVBQUVILE9BQU8sRUFBRUosTUFBTSxDQUFFO0lBRWhELEtBQUssQ0FBRUosT0FBUSxDQUFDO0lBRWhCLElBQUksQ0FBQ0ksTUFBTSxHQUFHQSxNQUFNO0lBQ3BCLElBQUksQ0FBQ08sUUFBUSxHQUFHQSxRQUFRO0lBQ3hCLElBQUksQ0FBQ2Isa0JBQWtCLEdBQUdBLGtCQUFrQjs7SUFFNUM7SUFDQSxJQUFJLENBQUNtQixlQUFlLENBQUNDLElBQUksQ0FBRUMsT0FBTyxJQUFJQSxPQUFPLElBQUksSUFBSSxDQUFDQyxNQUFNLENBQUMsQ0FBRSxDQUFDO0lBRWhFLE1BQU1DLGtCQUFrQixHQUFLQyxVQUFrQixJQUFNLElBQUksQ0FBQ0YsTUFBTSxDQUFDLENBQUM7SUFDbEV0QixrQkFBa0IsQ0FBQ29CLElBQUksQ0FBRUcsa0JBQW1CLENBQUM7SUFFN0MsSUFBSSxDQUFDRSxvQkFBb0IsR0FBRyxNQUFNO01BQ2hDekIsa0JBQWtCLENBQUMwQixNQUFNLENBQUVILGtCQUFtQixDQUFDO0lBQ2pELENBQUM7O0lBRUQ7SUFDQUksTUFBTSxJQUFJQyxJQUFJLEVBQUVDLE9BQU8sRUFBRUMsZUFBZSxFQUFFQyxNQUFNLElBQUl6QyxnQkFBZ0IsQ0FBQzBDLGVBQWUsQ0FBRSxjQUFjLEVBQUUsZUFBZSxFQUFFLElBQUssQ0FBQztFQUMvSDtFQUVnQkMsT0FBT0EsQ0FBQSxFQUFTO0lBQzlCLElBQUksQ0FBQ1Isb0JBQW9CLENBQUMsQ0FBQztJQUMzQixLQUFLLENBQUNRLE9BQU8sQ0FBQyxDQUFDO0VBQ2pCOztFQUVBO0FBQ0Y7QUFDQTtFQUNVWCxNQUFNQSxDQUFBLEVBQVM7SUFDckIsSUFBSyxJQUFJLENBQUNELE9BQU8sRUFBRztNQUNsQixNQUFNRyxVQUFVLEdBQUcsSUFBSSxDQUFDeEIsa0JBQWtCLENBQUNrQyxLQUFLO01BQ2hEUCxNQUFNLElBQUlBLE1BQU0sQ0FBRUgsVUFBVSxJQUFJLENBQUMsSUFBSUEsVUFBVSxJQUFJLENBQUUsQ0FBQztNQUN0RCxJQUFJLENBQUNsQixNQUFNLENBQUNlLE9BQU8sR0FBS0csVUFBVSxHQUFHLENBQUc7TUFDeEMsSUFBSyxJQUFJLENBQUNsQixNQUFNLENBQUNlLE9BQU8sRUFBRztRQUN6QixJQUFJLENBQUNmLE1BQU0sQ0FBQzZCLE9BQU8sR0FBRzlDLEtBQUssQ0FBQytDLE1BQU0sQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUVaLFVBQVcsQ0FBQztNQUNoRTtNQUNBLElBQUksQ0FBQ1gsUUFBUSxDQUFDd0IsYUFBYSxDQUFFYixVQUFXLENBQUM7SUFDM0M7RUFDRjtBQUNGO0FBRUEzQixXQUFXLENBQUN5QyxRQUFRLENBQUUsZUFBZSxFQUFFeEMsYUFBYyxDQUFDIiwiaWdub3JlTGlzdCI6W119