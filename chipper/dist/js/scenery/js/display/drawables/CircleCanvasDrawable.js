// Copyright 2016-2022, University of Colorado Boulder

/**
 * Canvas drawable for Circle nodes.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Poolable from '../../../../phet-core/js/Poolable.js';
import { CanvasSelfDrawable, Node, PaintableStatelessDrawable, scenery } from '../../imports.js';
class CircleCanvasDrawable extends PaintableStatelessDrawable(CanvasSelfDrawable) {
  /**
   * Paints this drawable to a Canvas (the wrapper contains both a Canvas reference and its drawing context).
   * @public
   *
   * Assumes that the Canvas's context is already in the proper local coordinate frame for the node, and that any
   * other required effects (opacity, clipping, etc.) have already been prepared.
   *
   * This is part of the CanvasSelfDrawable API required to be implemented for subtypes.
   *
   * @param {CanvasContextWrapper} wrapper - Contains the Canvas and its drawing context
   * @param {Node} node - Our node that is being drawn
   * @param {Matrix3} matrix - The transformation matrix applied for this node's coordinate system.
   */
  paintCanvas(wrapper, node, matrix) {
    assert && assert(node instanceof Node);
    const context = wrapper.context;
    context.beginPath();
    context.arc(0, 0, node._radius, 0, Math.PI * 2, false);
    context.closePath();
    if (node.hasFill()) {
      node.beforeCanvasFill(wrapper); // defined in Paintable
      context.fill();
      node.afterCanvasFill(wrapper); // defined in Paintable
    }
    if (node.hasPaintableStroke()) {
      node.beforeCanvasStroke(wrapper); // defined in Paintable
      context.stroke();
      node.afterCanvasStroke(wrapper); // defined in Paintable
    }
  }

  /**
   * Called when the radius of the circle changes.
   * @public
   */
  markDirtyRadius() {
    this.markPaintDirty();
  }

  /**
   * Disposes the drawable.
   * @public
   * @override
   */
  dispose() {
    super.dispose();
  }
}
scenery.register('CircleCanvasDrawable', CircleCanvasDrawable);
Poolable.mixInto(CircleCanvasDrawable);
export default CircleCanvasDrawable;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQb29sYWJsZSIsIkNhbnZhc1NlbGZEcmF3YWJsZSIsIk5vZGUiLCJQYWludGFibGVTdGF0ZWxlc3NEcmF3YWJsZSIsInNjZW5lcnkiLCJDaXJjbGVDYW52YXNEcmF3YWJsZSIsInBhaW50Q2FudmFzIiwid3JhcHBlciIsIm5vZGUiLCJtYXRyaXgiLCJhc3NlcnQiLCJjb250ZXh0IiwiYmVnaW5QYXRoIiwiYXJjIiwiX3JhZGl1cyIsIk1hdGgiLCJQSSIsImNsb3NlUGF0aCIsImhhc0ZpbGwiLCJiZWZvcmVDYW52YXNGaWxsIiwiZmlsbCIsImFmdGVyQ2FudmFzRmlsbCIsImhhc1BhaW50YWJsZVN0cm9rZSIsImJlZm9yZUNhbnZhc1N0cm9rZSIsInN0cm9rZSIsImFmdGVyQ2FudmFzU3Ryb2tlIiwibWFya0RpcnR5UmFkaXVzIiwibWFya1BhaW50RGlydHkiLCJkaXNwb3NlIiwicmVnaXN0ZXIiLCJtaXhJbnRvIl0sInNvdXJjZXMiOlsiQ2lyY2xlQ2FudmFzRHJhd2FibGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTYtMjAyMiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQ2FudmFzIGRyYXdhYmxlIGZvciBDaXJjbGUgbm9kZXMuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgUG9vbGFibGUgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL1Bvb2xhYmxlLmpzJztcclxuaW1wb3J0IHsgQ2FudmFzU2VsZkRyYXdhYmxlLCBOb2RlLCBQYWludGFibGVTdGF0ZWxlc3NEcmF3YWJsZSwgc2NlbmVyeSB9IGZyb20gJy4uLy4uL2ltcG9ydHMuanMnO1xyXG5cclxuY2xhc3MgQ2lyY2xlQ2FudmFzRHJhd2FibGUgZXh0ZW5kcyBQYWludGFibGVTdGF0ZWxlc3NEcmF3YWJsZSggQ2FudmFzU2VsZkRyYXdhYmxlICkge1xyXG4gIC8qKlxyXG4gICAqIFBhaW50cyB0aGlzIGRyYXdhYmxlIHRvIGEgQ2FudmFzICh0aGUgd3JhcHBlciBjb250YWlucyBib3RoIGEgQ2FudmFzIHJlZmVyZW5jZSBhbmQgaXRzIGRyYXdpbmcgY29udGV4dCkuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQXNzdW1lcyB0aGF0IHRoZSBDYW52YXMncyBjb250ZXh0IGlzIGFscmVhZHkgaW4gdGhlIHByb3BlciBsb2NhbCBjb29yZGluYXRlIGZyYW1lIGZvciB0aGUgbm9kZSwgYW5kIHRoYXQgYW55XHJcbiAgICogb3RoZXIgcmVxdWlyZWQgZWZmZWN0cyAob3BhY2l0eSwgY2xpcHBpbmcsIGV0Yy4pIGhhdmUgYWxyZWFkeSBiZWVuIHByZXBhcmVkLlxyXG4gICAqXHJcbiAgICogVGhpcyBpcyBwYXJ0IG9mIHRoZSBDYW52YXNTZWxmRHJhd2FibGUgQVBJIHJlcXVpcmVkIHRvIGJlIGltcGxlbWVudGVkIGZvciBzdWJ0eXBlcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7Q2FudmFzQ29udGV4dFdyYXBwZXJ9IHdyYXBwZXIgLSBDb250YWlucyB0aGUgQ2FudmFzIGFuZCBpdHMgZHJhd2luZyBjb250ZXh0XHJcbiAgICogQHBhcmFtIHtOb2RlfSBub2RlIC0gT3VyIG5vZGUgdGhhdCBpcyBiZWluZyBkcmF3blxyXG4gICAqIEBwYXJhbSB7TWF0cml4M30gbWF0cml4IC0gVGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCBhcHBsaWVkIGZvciB0aGlzIG5vZGUncyBjb29yZGluYXRlIHN5c3RlbS5cclxuICAgKi9cclxuICBwYWludENhbnZhcyggd3JhcHBlciwgbm9kZSwgbWF0cml4ICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbm9kZSBpbnN0YW5jZW9mIE5vZGUgKTtcclxuICAgIGNvbnN0IGNvbnRleHQgPSB3cmFwcGVyLmNvbnRleHQ7XHJcblxyXG4gICAgY29udGV4dC5iZWdpblBhdGgoKTtcclxuICAgIGNvbnRleHQuYXJjKCAwLCAwLCBub2RlLl9yYWRpdXMsIDAsIE1hdGguUEkgKiAyLCBmYWxzZSApO1xyXG4gICAgY29udGV4dC5jbG9zZVBhdGgoKTtcclxuXHJcbiAgICBpZiAoIG5vZGUuaGFzRmlsbCgpICkge1xyXG4gICAgICBub2RlLmJlZm9yZUNhbnZhc0ZpbGwoIHdyYXBwZXIgKTsgLy8gZGVmaW5lZCBpbiBQYWludGFibGVcclxuICAgICAgY29udGV4dC5maWxsKCk7XHJcbiAgICAgIG5vZGUuYWZ0ZXJDYW52YXNGaWxsKCB3cmFwcGVyICk7IC8vIGRlZmluZWQgaW4gUGFpbnRhYmxlXHJcbiAgICB9XHJcbiAgICBpZiAoIG5vZGUuaGFzUGFpbnRhYmxlU3Ryb2tlKCkgKSB7XHJcbiAgICAgIG5vZGUuYmVmb3JlQ2FudmFzU3Ryb2tlKCB3cmFwcGVyICk7IC8vIGRlZmluZWQgaW4gUGFpbnRhYmxlXHJcbiAgICAgIGNvbnRleHQuc3Ryb2tlKCk7XHJcbiAgICAgIG5vZGUuYWZ0ZXJDYW52YXNTdHJva2UoIHdyYXBwZXIgKTsgLy8gZGVmaW5lZCBpbiBQYWludGFibGVcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCB3aGVuIHRoZSByYWRpdXMgb2YgdGhlIGNpcmNsZSBjaGFuZ2VzLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICBtYXJrRGlydHlSYWRpdXMoKSB7XHJcbiAgICB0aGlzLm1hcmtQYWludERpcnR5KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEaXNwb3NlcyB0aGUgZHJhd2FibGUuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqIEBvdmVycmlkZVxyXG4gICAqL1xyXG4gIGRpc3Bvc2UoKSB7XHJcbiAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnQ2lyY2xlQ2FudmFzRHJhd2FibGUnLCBDaXJjbGVDYW52YXNEcmF3YWJsZSApO1xyXG5cclxuUG9vbGFibGUubWl4SW50byggQ2lyY2xlQ2FudmFzRHJhd2FibGUgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IENpcmNsZUNhbnZhc0RyYXdhYmxlOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxRQUFRLE1BQU0sc0NBQXNDO0FBQzNELFNBQVNDLGtCQUFrQixFQUFFQyxJQUFJLEVBQUVDLDBCQUEwQixFQUFFQyxPQUFPLFFBQVEsa0JBQWtCO0FBRWhHLE1BQU1DLG9CQUFvQixTQUFTRiwwQkFBMEIsQ0FBRUYsa0JBQW1CLENBQUMsQ0FBQztFQUNsRjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFSyxXQUFXQSxDQUFFQyxPQUFPLEVBQUVDLElBQUksRUFBRUMsTUFBTSxFQUFHO0lBQ25DQyxNQUFNLElBQUlBLE1BQU0sQ0FBRUYsSUFBSSxZQUFZTixJQUFLLENBQUM7SUFDeEMsTUFBTVMsT0FBTyxHQUFHSixPQUFPLENBQUNJLE9BQU87SUFFL0JBLE9BQU8sQ0FBQ0MsU0FBUyxDQUFDLENBQUM7SUFDbkJELE9BQU8sQ0FBQ0UsR0FBRyxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUVMLElBQUksQ0FBQ00sT0FBTyxFQUFFLENBQUMsRUFBRUMsSUFBSSxDQUFDQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEtBQU0sQ0FBQztJQUN4REwsT0FBTyxDQUFDTSxTQUFTLENBQUMsQ0FBQztJQUVuQixJQUFLVCxJQUFJLENBQUNVLE9BQU8sQ0FBQyxDQUFDLEVBQUc7TUFDcEJWLElBQUksQ0FBQ1csZ0JBQWdCLENBQUVaLE9BQVEsQ0FBQyxDQUFDLENBQUM7TUFDbENJLE9BQU8sQ0FBQ1MsSUFBSSxDQUFDLENBQUM7TUFDZFosSUFBSSxDQUFDYSxlQUFlLENBQUVkLE9BQVEsQ0FBQyxDQUFDLENBQUM7SUFDbkM7SUFDQSxJQUFLQyxJQUFJLENBQUNjLGtCQUFrQixDQUFDLENBQUMsRUFBRztNQUMvQmQsSUFBSSxDQUFDZSxrQkFBa0IsQ0FBRWhCLE9BQVEsQ0FBQyxDQUFDLENBQUM7TUFDcENJLE9BQU8sQ0FBQ2EsTUFBTSxDQUFDLENBQUM7TUFDaEJoQixJQUFJLENBQUNpQixpQkFBaUIsQ0FBRWxCLE9BQVEsQ0FBQyxDQUFDLENBQUM7SUFDckM7RUFDRjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtFQUNFbUIsZUFBZUEsQ0FBQSxFQUFHO0lBQ2hCLElBQUksQ0FBQ0MsY0FBYyxDQUFDLENBQUM7RUFDdkI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNFQyxPQUFPQSxDQUFBLEVBQUc7SUFDUixLQUFLLENBQUNBLE9BQU8sQ0FBQyxDQUFDO0VBQ2pCO0FBQ0Y7QUFFQXhCLE9BQU8sQ0FBQ3lCLFFBQVEsQ0FBRSxzQkFBc0IsRUFBRXhCLG9CQUFxQixDQUFDO0FBRWhFTCxRQUFRLENBQUM4QixPQUFPLENBQUV6QixvQkFBcUIsQ0FBQztBQUV4QyxlQUFlQSxvQkFBb0IiLCJpZ25vcmVMaXN0IjpbXX0=