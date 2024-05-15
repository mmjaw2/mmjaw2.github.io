// Copyright 2016-2023, University of Colorado Boulder

/**
 * WebGL drawable for WebGLNode.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Poolable from '../../../../phet-core/js/Poolable.js';
import { Renderer, scenery, WebGLNode, WebGLSelfDrawable } from '../../imports.js';
class WebGLNodeDrawable extends WebGLSelfDrawable {
  /**
   * @public
   * @override
   *
   * @param {number} renderer
   * @param {Instance} instance
   */
  initialize(renderer, instance) {
    super.initialize(renderer, instance);

    // @private {function}
    this.contextChangeListener = this.contextChangeListener || this.onWebGLContextChange.bind(this);

    // @private {*} - Will be set to whatever type node.painterType is.
    this.painter = null;
  }

  /**
   * Creates an instance of our Node's "painter" type.
   * @private
   *
   * @returns {*} - Whatever node.painterType is will be the type.
   */
  createPainter() {
    const PainterType = this.node.painterType;
    return new PainterType(this.webGLBlock.gl, this.node);
  }

  /**
   * Callback for when the WebGL context changes. We'll reconstruct the painter.
   * @public
   */
  onWebGLContextChange() {
    //TODO: Should a function be added for "disposeNonWebGL"? https://github.com/phetsims/scenery/issues/1581

    // Create the new painter
    this.painter = this.createPainter();
  }

  /**
   * @public
   *
   * @param {WebGLBlock} webGLBlock
   */
  onAddToBlock(webGLBlock) {
    // @private {WebGLBlock}
    this.webGLBlock = webGLBlock;
    this.painter = this.createPainter();
    webGLBlock.glChangedEmitter.addListener(this.contextChangeListener);
  }

  /**
   * @public
   *
   * @param {WebGLBlock} webGLBlock
   */
  onRemoveFromBlock(webGLBlock) {
    webGLBlock.glChangedEmitter.removeListener(this.contextChangeListener);
  }

  /**
   * @public
   *
   * @returns {WebGLNode.PAINTED_NOTHING|WebGLNode.PAINTED_SOMETHING}
   */
  draw() {
    // we have a precompute need
    const matrix = this.instance.relativeTransform.matrix;
    const painted = this.painter.paint(matrix, this.webGLBlock.projectionMatrix);
    assert && assert(painted === WebGLNode.PAINTED_SOMETHING || painted === WebGLNode.PAINTED_NOTHING);
    assert && assert(WebGLNode.PAINTED_NOTHING === 0 && WebGLNode.PAINTED_SOMETHING === 1, 'Ensure we can pass the value through directly to indicate whether draw calls were made');
    return painted;
  }

  /**
   * Disposes the drawable.
   * @public
   * @override
   */
  dispose() {
    this.painter.dispose();
    this.painter = null;
    if (this.webGLBlock) {
      this.webGLBlock = null;
    }

    // super
    super.dispose();
  }

  /**
   * A "catch-all" dirty method that directly marks the paintDirty flag and triggers propagation of dirty
   * information. This can be used by other mark* methods, or directly itself if the paintDirty flag is checked.
   * @public
   *
   * It should be fired (indirectly or directly) for anything besides transforms that needs to make a drawable
   * dirty.
   */
  markPaintDirty() {
    this.markDirty();
  }

  // forward call to the WebGLNode
  get shaderAttributes() {
    return this.node.shaderAttributes;
  }
}

// We use a custom renderer for the needed flexibility
WebGLNodeDrawable.prototype.webglRenderer = Renderer.webglCustom;
scenery.register('WebGLNodeDrawable', WebGLNodeDrawable);
Poolable.mixInto(WebGLNodeDrawable);
export default WebGLNodeDrawable;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQb29sYWJsZSIsIlJlbmRlcmVyIiwic2NlbmVyeSIsIldlYkdMTm9kZSIsIldlYkdMU2VsZkRyYXdhYmxlIiwiV2ViR0xOb2RlRHJhd2FibGUiLCJpbml0aWFsaXplIiwicmVuZGVyZXIiLCJpbnN0YW5jZSIsImNvbnRleHRDaGFuZ2VMaXN0ZW5lciIsIm9uV2ViR0xDb250ZXh0Q2hhbmdlIiwiYmluZCIsInBhaW50ZXIiLCJjcmVhdGVQYWludGVyIiwiUGFpbnRlclR5cGUiLCJub2RlIiwicGFpbnRlclR5cGUiLCJ3ZWJHTEJsb2NrIiwiZ2wiLCJvbkFkZFRvQmxvY2siLCJnbENoYW5nZWRFbWl0dGVyIiwiYWRkTGlzdGVuZXIiLCJvblJlbW92ZUZyb21CbG9jayIsInJlbW92ZUxpc3RlbmVyIiwiZHJhdyIsIm1hdHJpeCIsInJlbGF0aXZlVHJhbnNmb3JtIiwicGFpbnRlZCIsInBhaW50IiwicHJvamVjdGlvbk1hdHJpeCIsImFzc2VydCIsIlBBSU5URURfU09NRVRISU5HIiwiUEFJTlRFRF9OT1RISU5HIiwiZGlzcG9zZSIsIm1hcmtQYWludERpcnR5IiwibWFya0RpcnR5Iiwic2hhZGVyQXR0cmlidXRlcyIsInByb3RvdHlwZSIsIndlYmdsUmVuZGVyZXIiLCJ3ZWJnbEN1c3RvbSIsInJlZ2lzdGVyIiwibWl4SW50byJdLCJzb3VyY2VzIjpbIldlYkdMTm9kZURyYXdhYmxlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE2LTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFdlYkdMIGRyYXdhYmxlIGZvciBXZWJHTE5vZGUuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgUG9vbGFibGUgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL1Bvb2xhYmxlLmpzJztcclxuaW1wb3J0IHsgUmVuZGVyZXIsIHNjZW5lcnksIFdlYkdMTm9kZSwgV2ViR0xTZWxmRHJhd2FibGUgfSBmcm9tICcuLi8uLi9pbXBvcnRzLmpzJztcclxuXHJcbmNsYXNzIFdlYkdMTm9kZURyYXdhYmxlIGV4dGVuZHMgV2ViR0xTZWxmRHJhd2FibGUge1xyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKiBAb3ZlcnJpZGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByZW5kZXJlclxyXG4gICAqIEBwYXJhbSB7SW5zdGFuY2V9IGluc3RhbmNlXHJcbiAgICovXHJcbiAgaW5pdGlhbGl6ZSggcmVuZGVyZXIsIGluc3RhbmNlICkge1xyXG4gICAgc3VwZXIuaW5pdGlhbGl6ZSggcmVuZGVyZXIsIGluc3RhbmNlICk7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge2Z1bmN0aW9ufVxyXG4gICAgdGhpcy5jb250ZXh0Q2hhbmdlTGlzdGVuZXIgPSB0aGlzLmNvbnRleHRDaGFuZ2VMaXN0ZW5lciB8fCB0aGlzLm9uV2ViR0xDb250ZXh0Q2hhbmdlLmJpbmQoIHRoaXMgKTtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7Kn0gLSBXaWxsIGJlIHNldCB0byB3aGF0ZXZlciB0eXBlIG5vZGUucGFpbnRlclR5cGUgaXMuXHJcbiAgICB0aGlzLnBhaW50ZXIgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBvdXIgTm9kZSdzIFwicGFpbnRlclwiIHR5cGUuXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHsqfSAtIFdoYXRldmVyIG5vZGUucGFpbnRlclR5cGUgaXMgd2lsbCBiZSB0aGUgdHlwZS5cclxuICAgKi9cclxuICBjcmVhdGVQYWludGVyKCkge1xyXG4gICAgY29uc3QgUGFpbnRlclR5cGUgPSB0aGlzLm5vZGUucGFpbnRlclR5cGU7XHJcbiAgICByZXR1cm4gbmV3IFBhaW50ZXJUeXBlKCB0aGlzLndlYkdMQmxvY2suZ2wsIHRoaXMubm9kZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGJhY2sgZm9yIHdoZW4gdGhlIFdlYkdMIGNvbnRleHQgY2hhbmdlcy4gV2UnbGwgcmVjb25zdHJ1Y3QgdGhlIHBhaW50ZXIuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqL1xyXG4gIG9uV2ViR0xDb250ZXh0Q2hhbmdlKCkge1xyXG4gICAgLy9UT0RPOiBTaG91bGQgYSBmdW5jdGlvbiBiZSBhZGRlZCBmb3IgXCJkaXNwb3NlTm9uV2ViR0xcIj8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuXHJcbiAgICAvLyBDcmVhdGUgdGhlIG5ldyBwYWludGVyXHJcbiAgICB0aGlzLnBhaW50ZXIgPSB0aGlzLmNyZWF0ZVBhaW50ZXIoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7V2ViR0xCbG9ja30gd2ViR0xCbG9ja1xyXG4gICAqL1xyXG4gIG9uQWRkVG9CbG9jayggd2ViR0xCbG9jayApIHtcclxuICAgIC8vIEBwcml2YXRlIHtXZWJHTEJsb2NrfVxyXG4gICAgdGhpcy53ZWJHTEJsb2NrID0gd2ViR0xCbG9jaztcclxuXHJcbiAgICB0aGlzLnBhaW50ZXIgPSB0aGlzLmNyZWF0ZVBhaW50ZXIoKTtcclxuXHJcbiAgICB3ZWJHTEJsb2NrLmdsQ2hhbmdlZEVtaXR0ZXIuYWRkTGlzdGVuZXIoIHRoaXMuY29udGV4dENoYW5nZUxpc3RlbmVyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1dlYkdMQmxvY2t9IHdlYkdMQmxvY2tcclxuICAgKi9cclxuICBvblJlbW92ZUZyb21CbG9jayggd2ViR0xCbG9jayApIHtcclxuICAgIHdlYkdMQmxvY2suZ2xDaGFuZ2VkRW1pdHRlci5yZW1vdmVMaXN0ZW5lciggdGhpcy5jb250ZXh0Q2hhbmdlTGlzdGVuZXIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtXZWJHTE5vZGUuUEFJTlRFRF9OT1RISU5HfFdlYkdMTm9kZS5QQUlOVEVEX1NPTUVUSElOR31cclxuICAgKi9cclxuICBkcmF3KCkge1xyXG4gICAgLy8gd2UgaGF2ZSBhIHByZWNvbXB1dGUgbmVlZFxyXG4gICAgY29uc3QgbWF0cml4ID0gdGhpcy5pbnN0YW5jZS5yZWxhdGl2ZVRyYW5zZm9ybS5tYXRyaXg7XHJcblxyXG4gICAgY29uc3QgcGFpbnRlZCA9IHRoaXMucGFpbnRlci5wYWludCggbWF0cml4LCB0aGlzLndlYkdMQmxvY2sucHJvamVjdGlvbk1hdHJpeCApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHBhaW50ZWQgPT09IFdlYkdMTm9kZS5QQUlOVEVEX1NPTUVUSElORyB8fCBwYWludGVkID09PSBXZWJHTE5vZGUuUEFJTlRFRF9OT1RISU5HICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBXZWJHTE5vZGUuUEFJTlRFRF9OT1RISU5HID09PSAwICYmIFdlYkdMTm9kZS5QQUlOVEVEX1NPTUVUSElORyA9PT0gMSxcclxuICAgICAgJ0Vuc3VyZSB3ZSBjYW4gcGFzcyB0aGUgdmFsdWUgdGhyb3VnaCBkaXJlY3RseSB0byBpbmRpY2F0ZSB3aGV0aGVyIGRyYXcgY2FsbHMgd2VyZSBtYWRlJyApO1xyXG5cclxuICAgIHJldHVybiBwYWludGVkO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGlzcG9zZXMgdGhlIGRyYXdhYmxlLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKiBAb3ZlcnJpZGVcclxuICAgKi9cclxuICBkaXNwb3NlKCkge1xyXG4gICAgdGhpcy5wYWludGVyLmRpc3Bvc2UoKTtcclxuICAgIHRoaXMucGFpbnRlciA9IG51bGw7XHJcblxyXG4gICAgaWYgKCB0aGlzLndlYkdMQmxvY2sgKSB7XHJcbiAgICAgIHRoaXMud2ViR0xCbG9jayA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc3VwZXJcclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgXCJjYXRjaC1hbGxcIiBkaXJ0eSBtZXRob2QgdGhhdCBkaXJlY3RseSBtYXJrcyB0aGUgcGFpbnREaXJ0eSBmbGFnIGFuZCB0cmlnZ2VycyBwcm9wYWdhdGlvbiBvZiBkaXJ0eVxyXG4gICAqIGluZm9ybWF0aW9uLiBUaGlzIGNhbiBiZSB1c2VkIGJ5IG90aGVyIG1hcmsqIG1ldGhvZHMsIG9yIGRpcmVjdGx5IGl0c2VsZiBpZiB0aGUgcGFpbnREaXJ0eSBmbGFnIGlzIGNoZWNrZWQuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogSXQgc2hvdWxkIGJlIGZpcmVkIChpbmRpcmVjdGx5IG9yIGRpcmVjdGx5KSBmb3IgYW55dGhpbmcgYmVzaWRlcyB0cmFuc2Zvcm1zIHRoYXQgbmVlZHMgdG8gbWFrZSBhIGRyYXdhYmxlXHJcbiAgICogZGlydHkuXHJcbiAgICovXHJcbiAgbWFya1BhaW50RGlydHkoKSB7XHJcbiAgICB0aGlzLm1hcmtEaXJ0eSgpO1xyXG4gIH1cclxuXHJcbiAgLy8gZm9yd2FyZCBjYWxsIHRvIHRoZSBXZWJHTE5vZGVcclxuICBnZXQgc2hhZGVyQXR0cmlidXRlcygpIHtcclxuICAgIHJldHVybiB0aGlzLm5vZGUuc2hhZGVyQXR0cmlidXRlcztcclxuICB9XHJcbn1cclxuXHJcbi8vIFdlIHVzZSBhIGN1c3RvbSByZW5kZXJlciBmb3IgdGhlIG5lZWRlZCBmbGV4aWJpbGl0eVxyXG5XZWJHTE5vZGVEcmF3YWJsZS5wcm90b3R5cGUud2ViZ2xSZW5kZXJlciA9IFJlbmRlcmVyLndlYmdsQ3VzdG9tO1xyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ1dlYkdMTm9kZURyYXdhYmxlJywgV2ViR0xOb2RlRHJhd2FibGUgKTtcclxuXHJcblBvb2xhYmxlLm1peEludG8oIFdlYkdMTm9kZURyYXdhYmxlICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBXZWJHTE5vZGVEcmF3YWJsZTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxRQUFRLE1BQU0sc0NBQXNDO0FBQzNELFNBQVNDLFFBQVEsRUFBRUMsT0FBTyxFQUFFQyxTQUFTLEVBQUVDLGlCQUFpQixRQUFRLGtCQUFrQjtBQUVsRixNQUFNQyxpQkFBaUIsU0FBU0QsaUJBQWlCLENBQUM7RUFDaEQ7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRUUsVUFBVUEsQ0FBRUMsUUFBUSxFQUFFQyxRQUFRLEVBQUc7SUFDL0IsS0FBSyxDQUFDRixVQUFVLENBQUVDLFFBQVEsRUFBRUMsUUFBUyxDQUFDOztJQUV0QztJQUNBLElBQUksQ0FBQ0MscUJBQXFCLEdBQUcsSUFBSSxDQUFDQSxxQkFBcUIsSUFBSSxJQUFJLENBQUNDLG9CQUFvQixDQUFDQyxJQUFJLENBQUUsSUFBSyxDQUFDOztJQUVqRztJQUNBLElBQUksQ0FBQ0MsT0FBTyxHQUFHLElBQUk7RUFDckI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0VDLGFBQWFBLENBQUEsRUFBRztJQUNkLE1BQU1DLFdBQVcsR0FBRyxJQUFJLENBQUNDLElBQUksQ0FBQ0MsV0FBVztJQUN6QyxPQUFPLElBQUlGLFdBQVcsQ0FBRSxJQUFJLENBQUNHLFVBQVUsQ0FBQ0MsRUFBRSxFQUFFLElBQUksQ0FBQ0gsSUFBSyxDQUFDO0VBQ3pEOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0VBQ0VMLG9CQUFvQkEsQ0FBQSxFQUFHO0lBQ3JCOztJQUVBO0lBQ0EsSUFBSSxDQUFDRSxPQUFPLEdBQUcsSUFBSSxDQUFDQyxhQUFhLENBQUMsQ0FBQztFQUNyQzs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0VNLFlBQVlBLENBQUVGLFVBQVUsRUFBRztJQUN6QjtJQUNBLElBQUksQ0FBQ0EsVUFBVSxHQUFHQSxVQUFVO0lBRTVCLElBQUksQ0FBQ0wsT0FBTyxHQUFHLElBQUksQ0FBQ0MsYUFBYSxDQUFDLENBQUM7SUFFbkNJLFVBQVUsQ0FBQ0csZ0JBQWdCLENBQUNDLFdBQVcsQ0FBRSxJQUFJLENBQUNaLHFCQUFzQixDQUFDO0VBQ3ZFOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRWEsaUJBQWlCQSxDQUFFTCxVQUFVLEVBQUc7SUFDOUJBLFVBQVUsQ0FBQ0csZ0JBQWdCLENBQUNHLGNBQWMsQ0FBRSxJQUFJLENBQUNkLHFCQUFzQixDQUFDO0VBQzFFOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRWUsSUFBSUEsQ0FBQSxFQUFHO0lBQ0w7SUFDQSxNQUFNQyxNQUFNLEdBQUcsSUFBSSxDQUFDakIsUUFBUSxDQUFDa0IsaUJBQWlCLENBQUNELE1BQU07SUFFckQsTUFBTUUsT0FBTyxHQUFHLElBQUksQ0FBQ2YsT0FBTyxDQUFDZ0IsS0FBSyxDQUFFSCxNQUFNLEVBQUUsSUFBSSxDQUFDUixVQUFVLENBQUNZLGdCQUFpQixDQUFDO0lBRTlFQyxNQUFNLElBQUlBLE1BQU0sQ0FBRUgsT0FBTyxLQUFLeEIsU0FBUyxDQUFDNEIsaUJBQWlCLElBQUlKLE9BQU8sS0FBS3hCLFNBQVMsQ0FBQzZCLGVBQWdCLENBQUM7SUFDcEdGLE1BQU0sSUFBSUEsTUFBTSxDQUFFM0IsU0FBUyxDQUFDNkIsZUFBZSxLQUFLLENBQUMsSUFBSTdCLFNBQVMsQ0FBQzRCLGlCQUFpQixLQUFLLENBQUMsRUFDcEYsd0ZBQXlGLENBQUM7SUFFNUYsT0FBT0osT0FBTztFQUNoQjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0VNLE9BQU9BLENBQUEsRUFBRztJQUNSLElBQUksQ0FBQ3JCLE9BQU8sQ0FBQ3FCLE9BQU8sQ0FBQyxDQUFDO0lBQ3RCLElBQUksQ0FBQ3JCLE9BQU8sR0FBRyxJQUFJO0lBRW5CLElBQUssSUFBSSxDQUFDSyxVQUFVLEVBQUc7TUFDckIsSUFBSSxDQUFDQSxVQUFVLEdBQUcsSUFBSTtJQUN4Qjs7SUFFQTtJQUNBLEtBQUssQ0FBQ2dCLE9BQU8sQ0FBQyxDQUFDO0VBQ2pCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRUMsY0FBY0EsQ0FBQSxFQUFHO0lBQ2YsSUFBSSxDQUFDQyxTQUFTLENBQUMsQ0FBQztFQUNsQjs7RUFFQTtFQUNBLElBQUlDLGdCQUFnQkEsQ0FBQSxFQUFHO0lBQ3JCLE9BQU8sSUFBSSxDQUFDckIsSUFBSSxDQUFDcUIsZ0JBQWdCO0VBQ25DO0FBQ0Y7O0FBRUE7QUFDQS9CLGlCQUFpQixDQUFDZ0MsU0FBUyxDQUFDQyxhQUFhLEdBQUdyQyxRQUFRLENBQUNzQyxXQUFXO0FBRWhFckMsT0FBTyxDQUFDc0MsUUFBUSxDQUFFLG1CQUFtQixFQUFFbkMsaUJBQWtCLENBQUM7QUFFMURMLFFBQVEsQ0FBQ3lDLE9BQU8sQ0FBRXBDLGlCQUFrQixDQUFDO0FBRXJDLGVBQWVBLGlCQUFpQiIsImlnbm9yZUxpc3QiOltdfQ==