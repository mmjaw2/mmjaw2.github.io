// Copyright 2014-2024, University of Colorado Boulder

/**
 * An abstract node (should be subtyped) that is drawn by user-provided custom WebGL code.
 *
 * The region that can be drawn in is handled manually, by controlling the canvasBounds property of this WebGLNode.
 * Any regions outside of the canvasBounds will not be guaranteed to be drawn. This can be set with canvasBounds in the
 * constructor, or later with node.canvasBounds = bounds or setCanvasBounds( bounds ).
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Matrix3 from '../../../dot/js/Matrix3.js';
import { Shape } from '../../../kite/js/imports.js';
import { Node, Renderer, scenery, Utils, WebGLNodeDrawable } from '../imports.js';
const WEBGL_NODE_OPTION_KEYS = ['canvasBounds' // {Bounds2} - Sets the available Canvas bounds that content will show up in. See setCanvasBounds()
];

// NOTE: the `node` will be the `this` type, but there doesn't seem to be a good way to annotate that

export default class WebGLNode extends Node {
  // Used to create the painters

  /**
   *
   * It is required to pass a canvasBounds option and/or keep canvasBounds such that it will cover the entirety of the
   * Node. This will also set its self bounds.
   *
   * A "Painter" type should be passed to the constructor. It will be responsible for creating individual "painters"
   * that are used with different WebGL contexts to paint. This is helpful, since each context will need to have its
   * own buffers/textures/etc.
   *
   * painterType will be called with new painterType( gl, node ). Should contain the following methods:
   *
   * paint( modelViewMatrix, projectionMatrix )
   *   {Matrix3} modelViewMatrix - Transforms from the node's local coordinate frame to Scenery's global coordinate
   *                               frame.
   *   {Matrix3} projectionMatrix - Transforms from the global coordinate frame to normalized device coordinates.
   *   Returns either WebGLNode.PAINTED_NOTHING or WebGLNode.PAINTED_SOMETHING.
   * dispose()
   *
   * NOTE: If any alpha values are non-1, please note that Scenery's canvases uses blending/settings for premultiplied
   * alpha. This means that if you want a color to look like (r,g,b,a), the value passed to gl_FragColor should be
   * (r/a,g/a,b/a,a).
   *
   * @param painterType - The type (constructor) for the painters that will be used for this node.
   * @param [options] - WebGLNode-specific options are documented in LINE_OPTION_KEYS above, and can be
   *                    provided along-side options for Node
   */
  constructor(painterType, options) {
    super(options);

    // Only support rendering in WebGL
    this.setRendererBitmask(Renderer.bitmaskWebGL);
    this.painterType = painterType;
  }

  /**
   * Sets the bounds that are used for layout/repainting.
   *
   * These bounds should always cover at least the area where the WebGLNode will draw in. If this is violated, this
   * node may be partially or completely invisible in Scenery's output.
   */
  setCanvasBounds(selfBounds) {
    this.invalidateSelf(selfBounds);
    return this;
  }
  set canvasBounds(value) {
    this.setCanvasBounds(value);
  }
  get canvasBounds() {
    return this.getCanvasBounds();
  }

  /**
   * Returns the previously-set canvasBounds, or Bounds2.NOTHING if it has not been set yet.
   */
  getCanvasBounds() {
    return this.getSelfBounds();
  }

  /**
   * Whether this Node itself is painted (displays something itself).
   */
  isPainted() {
    // Always true for WebGL nodes
    return true;
  }

  /**
   * Should be called when this node needs to be repainted. When not called, Scenery assumes that this node does
   * NOT need to be repainted (although Scenery may repaint it due to other nodes needing to be repainted).
   *
   * This sets a "dirty" flag, so that it will be repainted the next time it would be displayed.
   */
  invalidatePaint() {
    const stateLen = this._drawables.length;
    for (let i = 0; i < stateLen; i++) {
      this._drawables[i].markDirty();
    }
  }

  /**
   * Computes whether the provided point is "inside" (contained) in this Node's self content, or "outside".
   *
   * If WebGLNode subtypes want to support being picked or hit-tested, it should override this function.
   *
   * @param point - Considered to be in the local coordinate frame
   */
  containsPointSelf(point) {
    return false;
  }

  /**
   * Returns a Shape that represents the area covered by containsPointSelf.
   */
  getSelfShape() {
    return new Shape();
  }

  /**
   * Draws the current Node's self representation, assuming the wrapper's Canvas context is already in the local
   * coordinate frame of this node. (scenery-internal)
   *
   * @param wrapper
   * @param matrix - The transformation matrix already applied to the context.
   */
  canvasPaintSelf(wrapper, matrix) {
    // TODO: see https://github.com/phetsims/scenery/issues/308
    assert && assert(false, 'unimplemented: canvasPaintSelf in WebGLNode');
  }

  /**
   * Renders this Node only (its self) into the Canvas wrapper, in its local coordinate frame.
   *
   * @param wrapper
   * @param matrix - The current transformation matrix associated with the wrapper
   */
  renderToCanvasSelf(wrapper, matrix) {
    const width = wrapper.canvas.width;
    const height = wrapper.canvas.height;

    // TODO: Can we reuse the same Canvas? That might save some context creations? https://github.com/phetsims/scenery/issues/1581
    const scratchCanvas = document.createElement('canvas');
    scratchCanvas.width = width;
    scratchCanvas.height = height;
    const contextOptions = {
      antialias: true,
      preserveDrawingBuffer: true // so we can get the data and render it to the Canvas
    };
    const gl = scratchCanvas.getContext('webgl', contextOptions) || scratchCanvas.getContext('experimental-webgl', contextOptions);
    Utils.applyWebGLContextDefaults(gl); // blending, etc.

    const projectionMatrix = new Matrix3().rowMajor(2 / width, 0, -1, 0, -2 / height, 1, 0, 0, 1);
    gl.viewport(0, 0, width, height);
    const PainterType = this.painterType;
    const painter = new PainterType(gl, this);
    painter.paint(matrix, projectionMatrix);
    painter.dispose();
    projectionMatrix.freeToPool();
    gl.flush();
    wrapper.context.setTransform(1, 0, 0, 1, 0, 0); // identity
    wrapper.context.drawImage(scratchCanvas, 0, 0);
    wrapper.context.restore();
  }

  /**
   * Creates a WebGL drawable for this WebGLNode. (scenery-internal)
   *
   * @param renderer - In the bitmask format specified by Renderer, which may contain additional bit flags.
   * @param instance - Instance object that will be associated with the drawable
   */
  createWebGLDrawable(renderer, instance) {
    // @ts-expect-error TODO: pooling https://github.com/phetsims/scenery/issues/1581
    return WebGLNodeDrawable.createFromPool(renderer, instance);
  }
  mutate(options) {
    return super.mutate(options);
  }

  // Return code from painter.paint() when nothing was painted to the WebGL context.
  static PAINTED_NOTHING = 0;

  // Return code from painter.paint() when something was painted to the WebGL context.
  static PAINTED_SOMETHING = 1;
}

/**
 * {Array.<string>} - String keys for all the allowed options that will be set by node.mutate( options ), in the
 * order they will be evaluated in.
 *
 * NOTE: See Node's _mutatorKeys documentation for more information on how this operates, and potential special
 *       cases that may apply.
 */
WebGLNode.prototype._mutatorKeys = WEBGL_NODE_OPTION_KEYS.concat(Node.prototype._mutatorKeys);
scenery.register('WebGLNode', WebGLNode);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNYXRyaXgzIiwiU2hhcGUiLCJOb2RlIiwiUmVuZGVyZXIiLCJzY2VuZXJ5IiwiVXRpbHMiLCJXZWJHTE5vZGVEcmF3YWJsZSIsIldFQkdMX05PREVfT1BUSU9OX0tFWVMiLCJXZWJHTE5vZGUiLCJjb25zdHJ1Y3RvciIsInBhaW50ZXJUeXBlIiwib3B0aW9ucyIsInNldFJlbmRlcmVyQml0bWFzayIsImJpdG1hc2tXZWJHTCIsInNldENhbnZhc0JvdW5kcyIsInNlbGZCb3VuZHMiLCJpbnZhbGlkYXRlU2VsZiIsImNhbnZhc0JvdW5kcyIsInZhbHVlIiwiZ2V0Q2FudmFzQm91bmRzIiwiZ2V0U2VsZkJvdW5kcyIsImlzUGFpbnRlZCIsImludmFsaWRhdGVQYWludCIsInN0YXRlTGVuIiwiX2RyYXdhYmxlcyIsImxlbmd0aCIsImkiLCJtYXJrRGlydHkiLCJjb250YWluc1BvaW50U2VsZiIsInBvaW50IiwiZ2V0U2VsZlNoYXBlIiwiY2FudmFzUGFpbnRTZWxmIiwid3JhcHBlciIsIm1hdHJpeCIsImFzc2VydCIsInJlbmRlclRvQ2FudmFzU2VsZiIsIndpZHRoIiwiY2FudmFzIiwiaGVpZ2h0Iiwic2NyYXRjaENhbnZhcyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImNvbnRleHRPcHRpb25zIiwiYW50aWFsaWFzIiwicHJlc2VydmVEcmF3aW5nQnVmZmVyIiwiZ2wiLCJnZXRDb250ZXh0IiwiYXBwbHlXZWJHTENvbnRleHREZWZhdWx0cyIsInByb2plY3Rpb25NYXRyaXgiLCJyb3dNYWpvciIsInZpZXdwb3J0IiwiUGFpbnRlclR5cGUiLCJwYWludGVyIiwicGFpbnQiLCJkaXNwb3NlIiwiZnJlZVRvUG9vbCIsImZsdXNoIiwiY29udGV4dCIsInNldFRyYW5zZm9ybSIsImRyYXdJbWFnZSIsInJlc3RvcmUiLCJjcmVhdGVXZWJHTERyYXdhYmxlIiwicmVuZGVyZXIiLCJpbnN0YW5jZSIsImNyZWF0ZUZyb21Qb29sIiwibXV0YXRlIiwiUEFJTlRFRF9OT1RISU5HIiwiUEFJTlRFRF9TT01FVEhJTkciLCJwcm90b3R5cGUiLCJfbXV0YXRvcktleXMiLCJjb25jYXQiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIldlYkdMTm9kZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNC0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBbiBhYnN0cmFjdCBub2RlIChzaG91bGQgYmUgc3VidHlwZWQpIHRoYXQgaXMgZHJhd24gYnkgdXNlci1wcm92aWRlZCBjdXN0b20gV2ViR0wgY29kZS5cclxuICpcclxuICogVGhlIHJlZ2lvbiB0aGF0IGNhbiBiZSBkcmF3biBpbiBpcyBoYW5kbGVkIG1hbnVhbGx5LCBieSBjb250cm9sbGluZyB0aGUgY2FudmFzQm91bmRzIHByb3BlcnR5IG9mIHRoaXMgV2ViR0xOb2RlLlxyXG4gKiBBbnkgcmVnaW9ucyBvdXRzaWRlIG9mIHRoZSBjYW52YXNCb3VuZHMgd2lsbCBub3QgYmUgZ3VhcmFudGVlZCB0byBiZSBkcmF3bi4gVGhpcyBjYW4gYmUgc2V0IHdpdGggY2FudmFzQm91bmRzIGluIHRoZVxyXG4gKiBjb25zdHJ1Y3Rvciwgb3IgbGF0ZXIgd2l0aCBub2RlLmNhbnZhc0JvdW5kcyA9IGJvdW5kcyBvciBzZXRDYW52YXNCb3VuZHMoIGJvdW5kcyApLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IEJvdW5kczIgZnJvbSAnLi4vLi4vLi4vZG90L2pzL0JvdW5kczIuanMnO1xyXG5pbXBvcnQgTWF0cml4MyBmcm9tICcuLi8uLi8uLi9kb3QvanMvTWF0cml4My5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tICcuLi8uLi8uLi9raXRlL2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgeyBDYW52YXNDb250ZXh0V3JhcHBlciwgSW5zdGFuY2UsIE5vZGUsIE5vZGVPcHRpb25zLCBSZW5kZXJlciwgc2NlbmVyeSwgVXRpbHMsIFdlYkdMTm9kZURyYXdhYmxlLCBXZWJHTFNlbGZEcmF3YWJsZSB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5cclxuY29uc3QgV0VCR0xfTk9ERV9PUFRJT05fS0VZUyA9IFtcclxuICAnY2FudmFzQm91bmRzJyAvLyB7Qm91bmRzMn0gLSBTZXRzIHRoZSBhdmFpbGFibGUgQ2FudmFzIGJvdW5kcyB0aGF0IGNvbnRlbnQgd2lsbCBzaG93IHVwIGluLiBTZWUgc2V0Q2FudmFzQm91bmRzKClcclxuXTtcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcbiAgY2FudmFzQm91bmRzPzogQm91bmRzMjtcclxufTtcclxuXHJcbmV4cG9ydCB0eXBlIFdlYkdMTm9kZU9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIE5vZGVPcHRpb25zO1xyXG5leHBvcnQgdHlwZSBXZWJHTE5vZGVQYWludGVyUmVzdWx0ID0gMCB8IDE7XHJcblxyXG5leHBvcnQgdHlwZSBXZWJHTE5vZGVQYWludGVyID0ge1xyXG4gIHBhaW50OiAoIG1vZGVsVmlld01hdHJpeDogTWF0cml4MywgcHJvamVjdGlvbk1hdHJpeDogTWF0cml4MyApID0+IFdlYkdMTm9kZVBhaW50ZXJSZXN1bHQ7XHJcbiAgZGlzcG9zZTogKCkgPT4gdm9pZDtcclxufTtcclxuLy8gTk9URTogdGhlIGBub2RlYCB3aWxsIGJlIHRoZSBgdGhpc2AgdHlwZSwgYnV0IHRoZXJlIGRvZXNuJ3Qgc2VlbSB0byBiZSBhIGdvb2Qgd2F5IHRvIGFubm90YXRlIHRoYXRcclxudHlwZSBXZWJHTE5vZGVQYWludGVyVHlwZSA9IG5ldyAoIGdsOiBXZWJHTFJlbmRlcmluZ0NvbnRleHQsIG5vZGU6IG5ldmVyICkgPT4gV2ViR0xOb2RlUGFpbnRlcjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFic3RyYWN0IGNsYXNzIFdlYkdMTm9kZSBleHRlbmRzIE5vZGUge1xyXG5cclxuICAvLyBVc2VkIHRvIGNyZWF0ZSB0aGUgcGFpbnRlcnNcclxuICBwcml2YXRlIHBhaW50ZXJUeXBlOiBXZWJHTE5vZGVQYWludGVyVHlwZTtcclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBJdCBpcyByZXF1aXJlZCB0byBwYXNzIGEgY2FudmFzQm91bmRzIG9wdGlvbiBhbmQvb3Iga2VlcCBjYW52YXNCb3VuZHMgc3VjaCB0aGF0IGl0IHdpbGwgY292ZXIgdGhlIGVudGlyZXR5IG9mIHRoZVxyXG4gICAqIE5vZGUuIFRoaXMgd2lsbCBhbHNvIHNldCBpdHMgc2VsZiBib3VuZHMuXHJcbiAgICpcclxuICAgKiBBIFwiUGFpbnRlclwiIHR5cGUgc2hvdWxkIGJlIHBhc3NlZCB0byB0aGUgY29uc3RydWN0b3IuIEl0IHdpbGwgYmUgcmVzcG9uc2libGUgZm9yIGNyZWF0aW5nIGluZGl2aWR1YWwgXCJwYWludGVyc1wiXHJcbiAgICogdGhhdCBhcmUgdXNlZCB3aXRoIGRpZmZlcmVudCBXZWJHTCBjb250ZXh0cyB0byBwYWludC4gVGhpcyBpcyBoZWxwZnVsLCBzaW5jZSBlYWNoIGNvbnRleHQgd2lsbCBuZWVkIHRvIGhhdmUgaXRzXHJcbiAgICogb3duIGJ1ZmZlcnMvdGV4dHVyZXMvZXRjLlxyXG4gICAqXHJcbiAgICogcGFpbnRlclR5cGUgd2lsbCBiZSBjYWxsZWQgd2l0aCBuZXcgcGFpbnRlclR5cGUoIGdsLCBub2RlICkuIFNob3VsZCBjb250YWluIHRoZSBmb2xsb3dpbmcgbWV0aG9kczpcclxuICAgKlxyXG4gICAqIHBhaW50KCBtb2RlbFZpZXdNYXRyaXgsIHByb2plY3Rpb25NYXRyaXggKVxyXG4gICAqICAge01hdHJpeDN9IG1vZGVsVmlld01hdHJpeCAtIFRyYW5zZm9ybXMgZnJvbSB0aGUgbm9kZSdzIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUgdG8gU2NlbmVyeSdzIGdsb2JhbCBjb29yZGluYXRlXHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWUuXHJcbiAgICogICB7TWF0cml4M30gcHJvamVjdGlvbk1hdHJpeCAtIFRyYW5zZm9ybXMgZnJvbSB0aGUgZ2xvYmFsIGNvb3JkaW5hdGUgZnJhbWUgdG8gbm9ybWFsaXplZCBkZXZpY2UgY29vcmRpbmF0ZXMuXHJcbiAgICogICBSZXR1cm5zIGVpdGhlciBXZWJHTE5vZGUuUEFJTlRFRF9OT1RISU5HIG9yIFdlYkdMTm9kZS5QQUlOVEVEX1NPTUVUSElORy5cclxuICAgKiBkaXNwb3NlKClcclxuICAgKlxyXG4gICAqIE5PVEU6IElmIGFueSBhbHBoYSB2YWx1ZXMgYXJlIG5vbi0xLCBwbGVhc2Ugbm90ZSB0aGF0IFNjZW5lcnkncyBjYW52YXNlcyB1c2VzIGJsZW5kaW5nL3NldHRpbmdzIGZvciBwcmVtdWx0aXBsaWVkXHJcbiAgICogYWxwaGEuIFRoaXMgbWVhbnMgdGhhdCBpZiB5b3Ugd2FudCBhIGNvbG9yIHRvIGxvb2sgbGlrZSAocixnLGIsYSksIHRoZSB2YWx1ZSBwYXNzZWQgdG8gZ2xfRnJhZ0NvbG9yIHNob3VsZCBiZVxyXG4gICAqIChyL2EsZy9hLGIvYSxhKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBwYWludGVyVHlwZSAtIFRoZSB0eXBlIChjb25zdHJ1Y3RvcikgZm9yIHRoZSBwYWludGVycyB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgdGhpcyBub2RlLlxyXG4gICAqIEBwYXJhbSBbb3B0aW9uc10gLSBXZWJHTE5vZGUtc3BlY2lmaWMgb3B0aW9ucyBhcmUgZG9jdW1lbnRlZCBpbiBMSU5FX09QVElPTl9LRVlTIGFib3ZlLCBhbmQgY2FuIGJlXHJcbiAgICogICAgICAgICAgICAgICAgICAgIHByb3ZpZGVkIGFsb25nLXNpZGUgb3B0aW9ucyBmb3IgTm9kZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggcGFpbnRlclR5cGU6IFdlYkdMTm9kZVBhaW50ZXJUeXBlLCBvcHRpb25zPzogV2ViR0xOb2RlT3B0aW9ucyApIHtcclxuICAgIHN1cGVyKCBvcHRpb25zICk7XHJcblxyXG4gICAgLy8gT25seSBzdXBwb3J0IHJlbmRlcmluZyBpbiBXZWJHTFxyXG4gICAgdGhpcy5zZXRSZW5kZXJlckJpdG1hc2soIFJlbmRlcmVyLmJpdG1hc2tXZWJHTCApO1xyXG5cclxuICAgIHRoaXMucGFpbnRlclR5cGUgPSBwYWludGVyVHlwZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGJvdW5kcyB0aGF0IGFyZSB1c2VkIGZvciBsYXlvdXQvcmVwYWludGluZy5cclxuICAgKlxyXG4gICAqIFRoZXNlIGJvdW5kcyBzaG91bGQgYWx3YXlzIGNvdmVyIGF0IGxlYXN0IHRoZSBhcmVhIHdoZXJlIHRoZSBXZWJHTE5vZGUgd2lsbCBkcmF3IGluLiBJZiB0aGlzIGlzIHZpb2xhdGVkLCB0aGlzXHJcbiAgICogbm9kZSBtYXkgYmUgcGFydGlhbGx5IG9yIGNvbXBsZXRlbHkgaW52aXNpYmxlIGluIFNjZW5lcnkncyBvdXRwdXQuXHJcbiAgICovXHJcbiAgcHVibGljIHNldENhbnZhc0JvdW5kcyggc2VsZkJvdW5kczogQm91bmRzMiApOiB0aGlzIHtcclxuICAgIHRoaXMuaW52YWxpZGF0ZVNlbGYoIHNlbGZCb3VuZHMgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgY2FudmFzQm91bmRzKCB2YWx1ZTogQm91bmRzMiApIHsgdGhpcy5zZXRDYW52YXNCb3VuZHMoIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBjYW52YXNCb3VuZHMoKTogQm91bmRzMiB7IHJldHVybiB0aGlzLmdldENhbnZhc0JvdW5kcygpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHByZXZpb3VzbHktc2V0IGNhbnZhc0JvdW5kcywgb3IgQm91bmRzMi5OT1RISU5HIGlmIGl0IGhhcyBub3QgYmVlbiBzZXQgeWV0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDYW52YXNCb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRTZWxmQm91bmRzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGV0aGVyIHRoaXMgTm9kZSBpdHNlbGYgaXMgcGFpbnRlZCAoZGlzcGxheXMgc29tZXRoaW5nIGl0c2VsZikuXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGlzUGFpbnRlZCgpOiBib29sZWFuIHtcclxuICAgIC8vIEFsd2F5cyB0cnVlIGZvciBXZWJHTCBub2Rlc1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTaG91bGQgYmUgY2FsbGVkIHdoZW4gdGhpcyBub2RlIG5lZWRzIHRvIGJlIHJlcGFpbnRlZC4gV2hlbiBub3QgY2FsbGVkLCBTY2VuZXJ5IGFzc3VtZXMgdGhhdCB0aGlzIG5vZGUgZG9lc1xyXG4gICAqIE5PVCBuZWVkIHRvIGJlIHJlcGFpbnRlZCAoYWx0aG91Z2ggU2NlbmVyeSBtYXkgcmVwYWludCBpdCBkdWUgdG8gb3RoZXIgbm9kZXMgbmVlZGluZyB0byBiZSByZXBhaW50ZWQpLlxyXG4gICAqXHJcbiAgICogVGhpcyBzZXRzIGEgXCJkaXJ0eVwiIGZsYWcsIHNvIHRoYXQgaXQgd2lsbCBiZSByZXBhaW50ZWQgdGhlIG5leHQgdGltZSBpdCB3b3VsZCBiZSBkaXNwbGF5ZWQuXHJcbiAgICovXHJcbiAgcHVibGljIGludmFsaWRhdGVQYWludCgpOiB2b2lkIHtcclxuICAgIGNvbnN0IHN0YXRlTGVuID0gdGhpcy5fZHJhd2FibGVzLmxlbmd0aDtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHN0YXRlTGVuOyBpKysgKSB7XHJcbiAgICAgIHRoaXMuX2RyYXdhYmxlc1sgaSBdLm1hcmtEaXJ0eSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcHV0ZXMgd2hldGhlciB0aGUgcHJvdmlkZWQgcG9pbnQgaXMgXCJpbnNpZGVcIiAoY29udGFpbmVkKSBpbiB0aGlzIE5vZGUncyBzZWxmIGNvbnRlbnQsIG9yIFwib3V0c2lkZVwiLlxyXG4gICAqXHJcbiAgICogSWYgV2ViR0xOb2RlIHN1YnR5cGVzIHdhbnQgdG8gc3VwcG9ydCBiZWluZyBwaWNrZWQgb3IgaGl0LXRlc3RlZCwgaXQgc2hvdWxkIG92ZXJyaWRlIHRoaXMgZnVuY3Rpb24uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcG9pbnQgLSBDb25zaWRlcmVkIHRvIGJlIGluIHRoZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGNvbnRhaW5zUG9pbnRTZWxmKCBwb2ludDogVmVjdG9yMiApOiBib29sZWFuIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBTaGFwZSB0aGF0IHJlcHJlc2VudHMgdGhlIGFyZWEgY292ZXJlZCBieSBjb250YWluc1BvaW50U2VsZi5cclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgZ2V0U2VsZlNoYXBlKCk6IFNoYXBlIHtcclxuICAgIHJldHVybiBuZXcgU2hhcGUoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERyYXdzIHRoZSBjdXJyZW50IE5vZGUncyBzZWxmIHJlcHJlc2VudGF0aW9uLCBhc3N1bWluZyB0aGUgd3JhcHBlcidzIENhbnZhcyBjb250ZXh0IGlzIGFscmVhZHkgaW4gdGhlIGxvY2FsXHJcbiAgICogY29vcmRpbmF0ZSBmcmFtZSBvZiB0aGlzIG5vZGUuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHdyYXBwZXJcclxuICAgKiBAcGFyYW0gbWF0cml4IC0gVGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCBhbHJlYWR5IGFwcGxpZWQgdG8gdGhlIGNvbnRleHQuXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIG92ZXJyaWRlIGNhbnZhc1BhaW50U2VsZiggd3JhcHBlcjogQ2FudmFzQ29udGV4dFdyYXBwZXIsIG1hdHJpeDogTWF0cml4MyApOiB2b2lkIHtcclxuICAgIC8vIFRPRE86IHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMzA4XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBmYWxzZSwgJ3VuaW1wbGVtZW50ZWQ6IGNhbnZhc1BhaW50U2VsZiBpbiBXZWJHTE5vZGUnICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW5kZXJzIHRoaXMgTm9kZSBvbmx5IChpdHMgc2VsZikgaW50byB0aGUgQ2FudmFzIHdyYXBwZXIsIGluIGl0cyBsb2NhbCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHdyYXBwZXJcclxuICAgKiBAcGFyYW0gbWF0cml4IC0gVGhlIGN1cnJlbnQgdHJhbnNmb3JtYXRpb24gbWF0cml4IGFzc29jaWF0ZWQgd2l0aCB0aGUgd3JhcHBlclxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSByZW5kZXJUb0NhbnZhc1NlbGYoIHdyYXBwZXI6IENhbnZhc0NvbnRleHRXcmFwcGVyLCBtYXRyaXg6IE1hdHJpeDMgKTogdm9pZCB7XHJcbiAgICBjb25zdCB3aWR0aCA9IHdyYXBwZXIuY2FudmFzLndpZHRoO1xyXG4gICAgY29uc3QgaGVpZ2h0ID0gd3JhcHBlci5jYW52YXMuaGVpZ2h0O1xyXG5cclxuICAgIC8vIFRPRE86IENhbiB3ZSByZXVzZSB0aGUgc2FtZSBDYW52YXM/IFRoYXQgbWlnaHQgc2F2ZSBzb21lIGNvbnRleHQgY3JlYXRpb25zPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgY29uc3Qgc2NyYXRjaENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdjYW52YXMnICk7XHJcbiAgICBzY3JhdGNoQ2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICBzY3JhdGNoQ2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuICAgIGNvbnN0IGNvbnRleHRPcHRpb25zID0ge1xyXG4gICAgICBhbnRpYWxpYXM6IHRydWUsXHJcbiAgICAgIHByZXNlcnZlRHJhd2luZ0J1ZmZlcjogdHJ1ZSAvLyBzbyB3ZSBjYW4gZ2V0IHRoZSBkYXRhIGFuZCByZW5kZXIgaXQgdG8gdGhlIENhbnZhc1xyXG4gICAgfTtcclxuICAgIGNvbnN0IGdsID0gKCBzY3JhdGNoQ2FudmFzLmdldENvbnRleHQoICd3ZWJnbCcsIGNvbnRleHRPcHRpb25zICkgfHwgc2NyYXRjaENhbnZhcy5nZXRDb250ZXh0KCAnZXhwZXJpbWVudGFsLXdlYmdsJywgY29udGV4dE9wdGlvbnMgKSApIGFzIFdlYkdMUmVuZGVyaW5nQ29udGV4dDtcclxuICAgIFV0aWxzLmFwcGx5V2ViR0xDb250ZXh0RGVmYXVsdHMoIGdsICk7IC8vIGJsZW5kaW5nLCBldGMuXHJcblxyXG4gICAgY29uc3QgcHJvamVjdGlvbk1hdHJpeCA9IG5ldyBNYXRyaXgzKCkucm93TWFqb3IoXHJcbiAgICAgIDIgLyB3aWR0aCwgMCwgLTEsXHJcbiAgICAgIDAsIC0yIC8gaGVpZ2h0LCAxLFxyXG4gICAgICAwLCAwLCAxICk7XHJcbiAgICBnbC52aWV3cG9ydCggMCwgMCwgd2lkdGgsIGhlaWdodCApO1xyXG5cclxuICAgIGNvbnN0IFBhaW50ZXJUeXBlID0gdGhpcy5wYWludGVyVHlwZTtcclxuICAgIGNvbnN0IHBhaW50ZXIgPSBuZXcgUGFpbnRlclR5cGUoIGdsLCB0aGlzIGFzIG5ldmVyICk7XHJcblxyXG4gICAgcGFpbnRlci5wYWludCggbWF0cml4LCBwcm9qZWN0aW9uTWF0cml4ICk7XHJcbiAgICBwYWludGVyLmRpc3Bvc2UoKTtcclxuXHJcbiAgICBwcm9qZWN0aW9uTWF0cml4LmZyZWVUb1Bvb2woKTtcclxuXHJcbiAgICBnbC5mbHVzaCgpO1xyXG5cclxuICAgIHdyYXBwZXIuY29udGV4dC5zZXRUcmFuc2Zvcm0oIDEsIDAsIDAsIDEsIDAsIDAgKTsgLy8gaWRlbnRpdHlcclxuICAgIHdyYXBwZXIuY29udGV4dC5kcmF3SW1hZ2UoIHNjcmF0Y2hDYW52YXMsIDAsIDAgKTtcclxuICAgIHdyYXBwZXIuY29udGV4dC5yZXN0b3JlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgV2ViR0wgZHJhd2FibGUgZm9yIHRoaXMgV2ViR0xOb2RlLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKlxyXG4gICAqIEBwYXJhbSByZW5kZXJlciAtIEluIHRoZSBiaXRtYXNrIGZvcm1hdCBzcGVjaWZpZWQgYnkgUmVuZGVyZXIsIHdoaWNoIG1heSBjb250YWluIGFkZGl0aW9uYWwgYml0IGZsYWdzLlxyXG4gICAqIEBwYXJhbSBpbnN0YW5jZSAtIEluc3RhbmNlIG9iamVjdCB0aGF0IHdpbGwgYmUgYXNzb2NpYXRlZCB3aXRoIHRoZSBkcmF3YWJsZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBjcmVhdGVXZWJHTERyYXdhYmxlKCByZW5kZXJlcjogbnVtYmVyLCBpbnN0YW5jZTogSW5zdGFuY2UgKTogV2ViR0xTZWxmRHJhd2FibGUge1xyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciBUT0RPOiBwb29saW5nIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICByZXR1cm4gV2ViR0xOb2RlRHJhd2FibGUuY3JlYXRlRnJvbVBvb2woIHJlbmRlcmVyLCBpbnN0YW5jZSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG92ZXJyaWRlIG11dGF0ZSggb3B0aW9ucz86IFdlYkdMTm9kZU9wdGlvbnMgKTogdGhpcyB7XHJcbiAgICByZXR1cm4gc3VwZXIubXV0YXRlKCBvcHRpb25zICk7XHJcbiAgfVxyXG5cclxuICAvLyBSZXR1cm4gY29kZSBmcm9tIHBhaW50ZXIucGFpbnQoKSB3aGVuIG5vdGhpbmcgd2FzIHBhaW50ZWQgdG8gdGhlIFdlYkdMIGNvbnRleHQuXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBQQUlOVEVEX05PVEhJTkcgPSAwIGFzIGNvbnN0O1xyXG5cclxuICAvLyBSZXR1cm4gY29kZSBmcm9tIHBhaW50ZXIucGFpbnQoKSB3aGVuIHNvbWV0aGluZyB3YXMgcGFpbnRlZCB0byB0aGUgV2ViR0wgY29udGV4dC5cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFBBSU5URURfU09NRVRISU5HID0gMSBhcyBjb25zdDtcclxufVxyXG5cclxuLyoqXHJcbiAqIHtBcnJheS48c3RyaW5nPn0gLSBTdHJpbmcga2V5cyBmb3IgYWxsIHRoZSBhbGxvd2VkIG9wdGlvbnMgdGhhdCB3aWxsIGJlIHNldCBieSBub2RlLm11dGF0ZSggb3B0aW9ucyApLCBpbiB0aGVcclxuICogb3JkZXIgdGhleSB3aWxsIGJlIGV2YWx1YXRlZCBpbi5cclxuICpcclxuICogTk9URTogU2VlIE5vZGUncyBfbXV0YXRvcktleXMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiBob3cgdGhpcyBvcGVyYXRlcywgYW5kIHBvdGVudGlhbCBzcGVjaWFsXHJcbiAqICAgICAgIGNhc2VzIHRoYXQgbWF5IGFwcGx5LlxyXG4gKi9cclxuV2ViR0xOb2RlLnByb3RvdHlwZS5fbXV0YXRvcktleXMgPSBXRUJHTF9OT0RFX09QVElPTl9LRVlTLmNvbmNhdCggTm9kZS5wcm90b3R5cGUuX211dGF0b3JLZXlzICk7XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnV2ViR0xOb2RlJywgV2ViR0xOb2RlICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQSxPQUFPQSxPQUFPLE1BQU0sNEJBQTRCO0FBRWhELFNBQVNDLEtBQUssUUFBUSw2QkFBNkI7QUFDbkQsU0FBeUNDLElBQUksRUFBZUMsUUFBUSxFQUFFQyxPQUFPLEVBQUVDLEtBQUssRUFBRUMs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