// Copyright 2013-2024, University of Colorado Boulder

/**
 * Displays CanvasNode bounds.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { Shape } from '../../../kite/js/imports.js';
import { CanvasNode, scenery, ShapeBasedOverlay, Trail } from '../imports.js';
export default class CanvasNodeBoundsOverlay extends ShapeBasedOverlay {
  constructor(display, rootNode) {
    super(display, rootNode, 'canvasNodeBoundsOverlay');
  }
  addShapes() {
    new Trail(this.rootNode).eachTrailUnder(trail => {
      const node = trail.lastNode();
      if (!node.isVisible()) {
        // skip this subtree if the node is invisible
        return true;
      }
      if (node instanceof CanvasNode && trail.isVisible()) {
        const transform = trail.getTransform();
        this.addShape(transform.transformShape(Shape.bounds(node.selfBounds)), 'rgba(0,255,0,0.8)', true);
      }
      return false;
    });
  }
}
scenery.register('CanvasNodeBoundsOverlay', CanvasNodeBoundsOverlay);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTaGFwZSIsIkNhbnZhc05vZGUiLCJzY2VuZXJ5IiwiU2hhcGVCYXNlZE92ZXJsYXkiLCJUcmFpbCIsIkNhbnZhc05vZGVCb3VuZHNPdmVybGF5IiwiY29uc3RydWN0b3IiLCJkaXNwbGF5Iiwicm9vdE5vZGUiLCJhZGRTaGFwZXMiLCJlYWNoVHJhaWxVbmRlciIsInRyYWlsIiwibm9kZSIsImxhc3ROb2RlIiwiaXNWaXNpYmxlIiwidHJhbnNmb3JtIiwiZ2V0VHJhbnNmb3JtIiwiYWRkU2hhcGUiLCJ0cmFuc2Zvcm1TaGFwZSIsImJvdW5kcyIsInNlbGZCb3VuZHMiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkNhbnZhc05vZGVCb3VuZHNPdmVybGF5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIERpc3BsYXlzIENhbnZhc05vZGUgYm91bmRzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tICcuLi8uLi8uLi9raXRlL2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgeyBDYW52YXNOb2RlLCBEaXNwbGF5LCBOb2RlLCBzY2VuZXJ5LCBTaGFwZUJhc2VkT3ZlcmxheSwgVE92ZXJsYXksIFRyYWlsIH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDYW52YXNOb2RlQm91bmRzT3ZlcmxheSBleHRlbmRzIFNoYXBlQmFzZWRPdmVybGF5IGltcGxlbWVudHMgVE92ZXJsYXkge1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggZGlzcGxheTogRGlzcGxheSwgcm9vdE5vZGU6IE5vZGUgKSB7XHJcbiAgICBzdXBlciggZGlzcGxheSwgcm9vdE5vZGUsICdjYW52YXNOb2RlQm91bmRzT3ZlcmxheScgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhZGRTaGFwZXMoKTogdm9pZCB7XHJcbiAgICBuZXcgVHJhaWwoIHRoaXMucm9vdE5vZGUgKS5lYWNoVHJhaWxVbmRlciggdHJhaWwgPT4ge1xyXG4gICAgICBjb25zdCBub2RlID0gdHJhaWwubGFzdE5vZGUoKTtcclxuICAgICAgaWYgKCAhbm9kZS5pc1Zpc2libGUoKSApIHtcclxuICAgICAgICAvLyBza2lwIHRoaXMgc3VidHJlZSBpZiB0aGUgbm9kZSBpcyBpbnZpc2libGVcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoICggbm9kZSBpbnN0YW5jZW9mIENhbnZhc05vZGUgKSAmJiB0cmFpbC5pc1Zpc2libGUoKSApIHtcclxuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSB0cmFpbC5nZXRUcmFuc2Zvcm0oKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRTaGFwZSggdHJhbnNmb3JtLnRyYW5zZm9ybVNoYXBlKCBTaGFwZS5ib3VuZHMoIG5vZGUuc2VsZkJvdW5kcyApICksICdyZ2JhKDAsMjU1LDAsMC44KScsIHRydWUgKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9ICk7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnQ2FudmFzTm9kZUJvdW5kc092ZXJsYXknLCBDYW52YXNOb2RlQm91bmRzT3ZlcmxheSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxTQUFTQSxLQUFLLFFBQVEsNkJBQTZCO0FBQ25ELFNBQVNDLFVBQVUsRUFBaUJDLE9BQU8sRUFBRUMsaUJBQWlCLEVBQVlDLEtBQUssUUFBUSxlQUFlO0FBRXRHLGVBQWUsTUFBTUMsdUJBQXVCLFNBQVNGLGlCQUFpQixDQUFxQjtFQUNsRkcsV0FBV0EsQ0FBRUMsT0FBZ0IsRUFBRUMsUUFBYyxFQUFHO0lBQ3JELEtBQUssQ0FBRUQsT0FBTyxFQUFFQyxRQUFRLEVBQUUseUJBQTBCLENBQUM7RUFDdkQ7RUFFT0MsU0FBU0EsQ0FBQSxFQUFTO0lBQ3ZCLElBQUlMLEtBQUssQ0FBRSxJQUFJLENBQUNJLFFBQVMsQ0FBQyxDQUFDRSxjQUFjLENBQUVDLEtBQUssSUFBSTtNQUNsRCxNQUFNQyxJQUFJLEdBQUdELEtBQUssQ0FBQ0UsUUFBUSxDQUFDLENBQUM7TUFDN0IsSUFBSyxDQUFDRCxJQUFJLENBQUNFLFNBQVMsQ0FBQyxDQUFDLEVBQUc7UUFDdkI7UUFDQSxPQUFPLElBQUk7TUFDYjtNQUNBLElBQU9GLElBQUksWUFBWVgsVUFBVSxJQUFNVSxLQUFLLENBQUNHLFNBQVMsQ0FBQyxDQUFDLEVBQUc7UUFDekQsTUFBTUMsU0FBUyxHQUFHSixLQUFLLENBQUNLLFlBQVksQ0FBQyxDQUFDO1FBRXRDLElBQUksQ0FBQ0MsUUFBUSxDQUFFRixTQUFTLENBQUNHLGNBQWMsQ0FBRWxCLEtBQUssQ0FBQ21CLE1BQU0sQ0FBRVAsSUFBSSxDQUFDUSxVQUFXLENBQUUsQ0FBQyxFQUFFLG1CQUFtQixFQUFFLElBQUssQ0FBQztNQUN6RztNQUNBLE9BQU8sS0FBSztJQUNkLENBQUUsQ0FBQztFQUNMO0FBQ0Y7QUFFQWxCLE9BQU8sQ0FBQ21CLFFBQVEsQ0FBRSx5QkFBeUIsRUFBRWhCLHVCQUF3QixDQUFDIiwiaWdub3JlTGlzdCI6W119