// Copyright 2024, University of Colorado Boulder

/**
 * Creates a double-headed, dashed arrow used to cue sorting in the "group sort" interaction.
 *
 * @author Marla Schulz (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import { HBox, Rectangle } from '../../../../../scenery/js/imports.js';
import TriangleNode from '../../../TriangleNode.js';
import optionize, { combineOptions } from '../../../../../phet-core/js/optionize.js';
import sceneryPhet from '../../../sceneryPhet.js';
export default class SortCueArrowNode extends HBox {
  constructor(providedOptions) {
    const options = optionize()({
      dashHeight: 2,
      dashWidth: 2,
      triangleNodeOptions: {},
      isDisposable: false
    }, providedOptions);
    const createArrowHead = pointDirection => {
      const triangleNodeOptions = combineOptions({
        pointDirection: pointDirection,
        triangleWidth: 6,
        triangleHeight: 5,
        fill: 'black'
      }, options.triangleNodeOptions);
      return new TriangleNode(triangleNodeOptions);
    };
    const dashes = [];
    _.times(options.numberOfDashes, () => {
      dashes.push(new Rectangle(0, 0, options.dashWidth, options.dashHeight, {
        fill: 'black'
      }));
    });
    const superOptions = combineOptions({
      children: [...(options.doubleHead ? [createArrowHead('left')] : []), ...dashes, createArrowHead('right')],
      spacing: 2
    }, providedOptions);
    super(superOptions);
  }
}
sceneryPhet.register('SortCueArrowNode', SortCueArrowNode);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJIQm94IiwiUmVjdGFuZ2xlIiwiVHJpYW5nbGVOb2RlIiwib3B0aW9uaXplIiwiY29tYmluZU9wdGlvbnMiLCJzY2VuZXJ5UGhldCIsIlNvcnRDdWVBcnJvd05vZGUiLCJjb25zdHJ1Y3RvciIsInByb3ZpZGVkT3B0aW9ucyIsIm9wdGlvbnMiLCJkYXNoSGVpZ2h0IiwiZGFzaFdpZHRoIiwidHJpYW5nbGVOb2RlT3B0aW9ucyIsImlzRGlzcG9zYWJsZSIsImNyZWF0ZUFycm93SGVhZCIsInBvaW50RGlyZWN0aW9uIiwidHJpYW5nbGVXaWR0aCIsInRyaWFuZ2xlSGVpZ2h0IiwiZmlsbCIsImRhc2hlcyIsIl8iLCJ0aW1lcyIsIm51bWJlck9mRGFzaGVzIiwicHVzaCIsInN1cGVyT3B0aW9ucyIsImNoaWxkcmVuIiwiZG91YmxlSGVhZCIsInNwYWNpbmciLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlNvcnRDdWVBcnJvd05vZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBkb3VibGUtaGVhZGVkLCBkYXNoZWQgYXJyb3cgdXNlZCB0byBjdWUgc29ydGluZyBpbiB0aGUgXCJncm91cCBzb3J0XCIgaW50ZXJhY3Rpb24uXHJcbiAqXHJcbiAqIEBhdXRob3IgTWFybGEgU2NodWx6IChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIE1pY2hhZWwgS2F1em1hbm4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgSEJveCwgSEJveE9wdGlvbnMsIE5vZGUsIFJlY3RhbmdsZSB9IGZyb20gJy4uLy4uLy4uLy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBUcmlhbmdsZU5vZGUsIHsgVHJpYW5nbGVOb2RlT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL1RyaWFuZ2xlTm9kZS5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUsIHsgY29tYmluZU9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IFN0cmljdE9taXQgZnJvbSAnLi4vLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1N0cmljdE9taXQuanMnO1xyXG5pbXBvcnQgc2NlbmVyeVBoZXQgZnJvbSAnLi4vLi4vLi4vc2NlbmVyeVBoZXQuanMnO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuICBudW1iZXJPZkRhc2hlczogbnVtYmVyO1xyXG4gIGRvdWJsZUhlYWQ6IGJvb2xlYW47XHJcbiAgZGFzaEhlaWdodD86IG51bWJlcjtcclxuICBkYXNoV2lkdGg/OiBudW1iZXI7XHJcbiAgdHJpYW5nbGVOb2RlT3B0aW9ucz86IFRyaWFuZ2xlTm9kZU9wdGlvbnM7XHJcbn07XHJcblxyXG50eXBlIFNvcnRDdWVBcnJvd05vZGVPcHRpb25zID0gU2VsZk9wdGlvbnMgJiBTdHJpY3RPbWl0PEhCb3hPcHRpb25zLCAnY2hpbGRyZW4nPjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNvcnRDdWVBcnJvd05vZGUgZXh0ZW5kcyBIQm94IHtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBwcm92aWRlZE9wdGlvbnM6IFNvcnRDdWVBcnJvd05vZGVPcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8U29ydEN1ZUFycm93Tm9kZU9wdGlvbnMsIFNlbGZPcHRpb25zLCBIQm94T3B0aW9ucz4oKSgge1xyXG4gICAgICBkYXNoSGVpZ2h0OiAyLFxyXG4gICAgICBkYXNoV2lkdGg6IDIsXHJcbiAgICAgIHRyaWFuZ2xlTm9kZU9wdGlvbnM6IHt9LFxyXG5cclxuICAgICAgaXNEaXNwb3NhYmxlOiBmYWxzZVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgY29uc3QgY3JlYXRlQXJyb3dIZWFkID0gKCBwb2ludERpcmVjdGlvbjogJ3JpZ2h0JyB8ICdsZWZ0JyApID0+IHtcclxuXHJcbiAgICAgIGNvbnN0IHRyaWFuZ2xlTm9kZU9wdGlvbnMgPSBjb21iaW5lT3B0aW9uczxUcmlhbmdsZU5vZGVPcHRpb25zPigge1xyXG4gICAgICAgIHBvaW50RGlyZWN0aW9uOiBwb2ludERpcmVjdGlvbixcclxuICAgICAgICB0cmlhbmdsZVdpZHRoOiA2LFxyXG4gICAgICAgIHRyaWFuZ2xlSGVpZ2h0OiA1LFxyXG4gICAgICAgIGZpbGw6ICdibGFjaydcclxuICAgICAgfSwgb3B0aW9ucy50cmlhbmdsZU5vZGVPcHRpb25zICk7XHJcblxyXG4gICAgICByZXR1cm4gbmV3IFRyaWFuZ2xlTm9kZSggdHJpYW5nbGVOb2RlT3B0aW9ucyApO1xyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBkYXNoZXM6IE5vZGVbXSA9IFtdO1xyXG5cclxuICAgIF8udGltZXMoIG9wdGlvbnMubnVtYmVyT2ZEYXNoZXMsICgpID0+IHtcclxuICAgICAgZGFzaGVzLnB1c2goIG5ldyBSZWN0YW5nbGUoIDAsIDAsIG9wdGlvbnMuZGFzaFdpZHRoLCBvcHRpb25zLmRhc2hIZWlnaHQsIHsgZmlsbDogJ2JsYWNrJyB9ICkgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICBjb25zdCBzdXBlck9wdGlvbnMgPSBjb21iaW5lT3B0aW9uczxIQm94T3B0aW9ucz4oIHtcclxuICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICAuLi4oIG9wdGlvbnMuZG91YmxlSGVhZCA/IFsgY3JlYXRlQXJyb3dIZWFkKCAnbGVmdCcgKSBdIDogW10gKSxcclxuICAgICAgICAuLi5kYXNoZXMsXHJcbiAgICAgICAgY3JlYXRlQXJyb3dIZWFkKCAncmlnaHQnIClcclxuICAgICAgXSxcclxuICAgICAgc3BhY2luZzogMlxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgc3VwZXIoIHN1cGVyT3B0aW9ucyApO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeVBoZXQucmVnaXN0ZXIoICdTb3J0Q3VlQXJyb3dOb2RlJywgU29ydEN1ZUFycm93Tm9kZSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFNBQVNBLElBQUksRUFBcUJDLFNBQVMsUUFBUSxzQ0FBc0M7QUFDekYsT0FBT0MsWUFBWSxNQUErQiwwQkFBMEI7QUFDNUUsT0FBT0MsU0FBUyxJQUFJQyxjQUFjLFFBQVEsMENBQTBDO0FBRXBGLE9BQU9DLFdBQVcsTUFBTSx5QkFBeUI7QUFZakQsZUFBZSxNQUFNQyxnQkFBZ0IsU0FBU04sSUFBSSxDQUFDO0VBRTFDTyxXQUFXQSxDQUFFQyxlQUF3QyxFQUFHO0lBRTdELE1BQU1DLE9BQU8sR0FBR04sU0FBUyxDQUFvRCxDQUFDLENBQUU7TUFDOUVPLFVBQVUsRUFBRSxDQUFDO01BQ2JDLFNBQVMsRUFBRSxDQUFDO01BQ1pDLG1CQUFtQixFQUFFLENBQUMsQ0FBQztNQUV2QkMsWUFBWSxFQUFFO0lBQ2hCLENBQUMsRUFBRUwsZUFBZ0IsQ0FBQztJQUVwQixNQUFNTSxlQUFlLEdBQUtDLGNBQWdDLElBQU07TUFFOUQsTUFBTUgsbUJBQW1CLEdBQUdSLGNBQWMsQ0FBdUI7UUFDL0RXLGNBQWMsRUFBRUEsY0FBYztRQUM5QkMsYUFBYSxFQUFFLENBQUM7UUFDaEJDLGNBQWMsRUFBRSxDQUFDO1FBQ2pCQyxJQUFJLEVBQUU7TUFDUixDQUFDLEVBQUVULE9BQU8sQ0FBQ0csbUJBQW9CLENBQUM7TUFFaEMsT0FBTyxJQUFJVixZQUFZLENBQUVVLG1CQUFvQixDQUFDO0lBQ2hELENBQUM7SUFFRCxNQUFNTyxNQUFjLEdBQUcsRUFBRTtJQUV6QkMsQ0FBQyxDQUFDQyxLQUFLLENBQUVaLE9BQU8sQ0FBQ2EsY0FBYyxFQUFFLE1BQU07TUFDckNILE1BQU0sQ0FBQ0ksSUFBSSxDQUFFLElBQUl0QixTQUFTLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRVEsT0FBTyxDQUFDRSxTQUFTLEVBQUVGLE9BQU8sQ0FBQ0MsVUFBVSxFQUFFO1FBQUVRLElBQUksRUFBRTtNQUFRLENBQUUsQ0FBRSxDQUFDO0lBQ2hHLENBQUUsQ0FBQztJQUVILE1BQU1NLFlBQVksR0FBR3BCLGNBQWMsQ0FBZTtNQUNoRHFCLFFBQVEsRUFBRSxDQUNSLElBQUtoQixPQUFPLENBQUNpQixVQUFVLEdBQUcsQ0FBRVosZUFBZSxDQUFFLE1BQU8sQ0FBQyxDQUFFLEdBQUcsRUFBRSxDQUFFLEVBQzlELEdBQUdLLE1BQU0sRUFDVEwsZUFBZSxDQUFFLE9BQVEsQ0FBQyxDQUMzQjtNQUNEYSxPQUFPLEVBQUU7SUFDWCxDQUFDLEVBQUVuQixlQUFnQixDQUFDO0lBRXBCLEtBQUssQ0FBRWdCLFlBQWEsQ0FBQztFQUN2QjtBQUNGO0FBRUFuQixXQUFXLENBQUN1QixRQUFRLENBQUUsa0JBQWtCLEVBQUV0QixnQkFBaUIsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==