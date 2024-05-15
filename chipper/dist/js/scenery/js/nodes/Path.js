// Copyright 2013-2024, University of Colorado Boulder

/**
 * A Path draws a Shape with a specific type of fill and stroke. Mixes in Paintable.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Bounds2 from '../../../dot/js/Bounds2.js';
import { Shape } from '../../../kite/js/imports.js';
import { Node, Paint, Paintable, PAINTABLE_DRAWABLE_MARK_FLAGS, PAINTABLE_OPTION_KEYS, PathCanvasDrawable, PathSVGDrawable, Renderer, scenery } from '../imports.js';
import optionize, { combineOptions } from '../../../phet-core/js/optionize.js';
import { isTReadOnlyProperty } from '../../../axon/js/TReadOnlyProperty.js';
import TinyForwardingProperty from '../../../axon/js/TinyForwardingProperty.js';
const PATH_OPTION_KEYS = ['boundsMethod', 'shape', 'shapeProperty'];
const DEFAULT_OPTIONS = {
  shape: null,
  boundsMethod: 'accurate'
};

/**
 * The valid parameter types are:
 * - Shape: (from Kite), normally used.
 * - string: Uses the SVG Path format, see https://www.w3.org/TR/SVG/paths.html (the PATH part of <path d="PATH"/>).
 *           This will immediately be converted to a Shape object when set, and getShape() or equivalents will return
 *           the parsed Shape instance instead of the original string. See "ParsedShape"
 * - null: Indicates that there is no Shape, and nothing is drawn. Usually used as a placeholder.
 *
 * NOTE: Be aware of the potential for memory leaks. If a Shape is not marked as immutable (with makeImmutable()),
 *       Path will add a listener so that it is updated when the Shape itself changes. If there is a listener
 *       added, keeping a reference to the Shape will also keep a reference to the Path object (and thus whatever
 *       Nodes are connected to the Path). For now, set path.shape = null if you need to release the reference
 *       that the Shape would have, or call dispose() on the Path if it is not needed anymore.
 */

/**
 * See InputShape for details, but this type differs in that it only supports a Shape, and any "string" data will
 * be parsed into a Shape instance.
 */

// Provide these as an option.

export default class Path extends Paintable(Node) {
  // The Shape used for displaying this Path.
  // NOTE: _shape can be lazily constructed in subtypes (may be null) if hasShape() is overridden to return true,
  //       like in Rectangle. This is because usually the actual Shape is already implied by other parameters,
  //       so it is best to not have to compute it on changes.
  // NOTE: Please use hasShape() to determine if we are actually drawing things, as it is subtype-safe.
  // (scenery-internal)

  // For shapeProperty

  // This stores a stroked copy of the Shape which is lazily computed. This can be required for computing bounds
  // of a Shape with a stroke.

  // (scenery-internal)

  // Used as a listener to Shapes for when they are invalidated. The listeners are not added if the Shape is
  // immutable, and if the Shape becomes immutable, then the listeners are removed.

  // Whether our shape listener is attached to a shape.

  /**
   * Creates a Path with a given shape specifier (a Shape, a string in the SVG path format, or null to indicate no
   * shape).
   *
   * Path has two additional options (above what Node provides):
   * - shape: The actual Shape (or a string representing an SVG path, or null).
   * - boundsMethod: Determines how the bounds of a shape are determined.
   *
   * @param shape - The initial Shape to display. See onShapePropertyChange() for more details and documentation.
   * @param [providedOptions] - Path-specific options are documented in PATH_OPTION_KEYS above, and can be provided
   *                             along-side options for Node
   */
  constructor(shape, providedOptions) {
    assert && assert(providedOptions === undefined || Object.getPrototypeOf(providedOptions) === Object.prototype, 'Extra prototype on Node options object is a code smell');
    if (shape || providedOptions?.shape) {
      assert && assert(!shape || !providedOptions?.shape, 'Do not define shape twice. Check constructor and providedOptions.');
    }
    const initPathOptions = {
      boundsMethod: DEFAULT_OPTIONS.boundsMethod
    };
    if (isTReadOnlyProperty(shape)) {
      initPathOptions.shapeProperty = shape;
    } else {
      initPathOptions.shape = shape;
    }

    // Strict omit because one WILL be defined
    const options = optionize()(initPathOptions, providedOptions);
    super();

    // We'll initialize this by mutating.
    this._shapeProperty = new TinyForwardingProperty(null, false, this.onShapePropertyChange.bind(this));
    this._shape = DEFAULT_OPTIONS.shape;
    this._strokedShape = null;
    this._boundsMethod = DEFAULT_OPTIONS.boundsMethod;
    this._invalidShapeListener = this.invalidateShape.bind(this);
    this._invalidShapeListenerAttached = false;
    this.invalidateSupportedRenderers();
    this.mutate(options);
  }
  setShape(shape) {
    assert && assert(shape === null || typeof shape === 'string' || shape instanceof Shape, 'A path\'s shape should either be null, a string, or a Shape');
    this._shapeProperty.value = shape;
    return this;
  }
  set shape(value) {
    this.setShape(value);
  }
  get shape() {
    return this.getShape();
  }

  /**
   * Returns the shape that was set for this Path (or for subtypes like Line and Rectangle, will return an immutable
   * Shape that is equivalent in appearance).
   *
   * It is best to generally assume modifications to the Shape returned is not supported. If there is no shape
   * currently, null will be returned.
   */
  getShape() {
    return this._shape;
  }
  onShapePropertyChange(shape) {
    assert && assert(shape === null || typeof shape === 'string' || shape instanceof Shape, 'A path\'s shape should either be null, a string, or a Shape');
    if (this._shape !== shape) {
      // Remove Shape invalidation listener if applicable
      if (this._invalidShapeListenerAttached) {
        this.detachShapeListener();
      }
      if (typeof shape === 'string') {
        // be content with onShapePropertyChange always invalidating the shape?
        shape = new Shape(shape);
      }
      this._shape = shape;
      this.invalidateShape();

      // Add Shape invalidation listener if applicable
      if (this._shape && !this._shape.isImmutable()) {
        this.attachShapeListener();
      }
    }
  }

  /**
   * See documentation for Node.setVisibleProperty, except this is for the shape
   */
  setShapeProperty(newTarget) {
    return this._shapeProperty.setTargetProperty(newTarget);
  }
  set shapeProperty(property) {
    this.setShapeProperty(property);
  }
  get shapeProperty() {
    return this.getShapeProperty();
  }

  /**
   * Like Node.getVisibleProperty(), but for the shape. Note this is not the same as the Property provided in
   * setShapeProperty. Thus is the nature of TinyForwardingProperty.
   */
  getShapeProperty() {
    return this._shapeProperty;
  }

  /**
   * Returns a lazily-created Shape that has the appearance of the Path's shape but stroked using the current
   * stroke style of the Path.
   *
   * NOTE: It is invalid to call this on a Path that does not currently have a Shape (usually a Path where
   *       the shape is set to null).
   */
  getStrokedShape() {
    assert && assert(this.hasShape(), 'We cannot stroke a non-existing shape');

    // Lazily compute the stroked shape. It should be set to null when we need to recompute it
    if (!this._strokedShape) {
      this._strokedShape = this.getShape().getStrokedShape(this._lineDrawingStyles);
    }
    return this._strokedShape;
  }

  /**
   * Returns a bitmask representing the supported renderers for the current configuration of the Path or subtype.
   *
   * Should be overridden by subtypes to either extend or restrict renderers, depending on what renderers are
   * supported.
   *
   * @returns - A bitmask that includes supported renderers, see Renderer for details.
   */
  getPathRendererBitmask() {
    // By default, Canvas and SVG are accepted.
    return Renderer.bitmaskCanvas | Renderer.bitmaskSVG;
  }

  /**
   * Triggers a check and update for what renderers the current configuration of this Path or subtype supports.
   * This should be called whenever something that could potentially change supported renderers happen (which can
   * be the shape, properties of the strokes or fills, etc.)
   */
  invalidateSupportedRenderers() {
    this.setRendererBitmask(this.getFillRendererBitmask() & this.getStrokeRendererBitmask() & this.getPathRendererBitmask());
  }

  /**
   * Notifies the Path that the Shape has changed (either the Shape itself has be mutated, a new Shape has been
   * provided).
   *
   * NOTE: This should not be called on subtypes of Path after they have been constructed, like Line, Rectangle, etc.
   */
  invalidateShape() {
    this.invalidatePath();
    const stateLen = this._drawables.length;
    for (let i = 0; i < stateLen; i++) {
      this._drawables[i].markDirtyShape(); // subtypes of Path may not have this, but it's called during construction
    }

    // Disconnect our Shape listener if our Shape has become immutable.
    // see https://github.com/phetsims/sun/issues/270#issuecomment-250266174
    if (this._invalidShapeListenerAttached && this._shape && this._shape.isImmutable()) {
      this.detachShapeListener();
    }
  }

  /**
   * Invalidates the node's self-bounds and any other recorded metadata about the outline or bounds of the Shape.
   *
   * This is meant to be used for all Path subtypes (unlike invalidateShape).
   */
  invalidatePath() {
    this._strokedShape = null;
    this.invalidateSelf(); // We don't immediately compute the bounds
  }

  /**
   * Attaches a listener to our Shape that will be called whenever the Shape changes.
   */
  attachShapeListener() {
    assert && assert(!this._invalidShapeListenerAttached, 'We do not want to have two listeners attached!');

    // Do not attach shape listeners if we are disposed
    if (!this.isDisposed) {
      this._shape.invalidatedEmitter.addListener(this._invalidShapeListener);
      this._invalidShapeListenerAttached = true;
    }
  }

  /**
   * Detaches a previously-attached listener added to our Shape (see attachShapeListener).
   */
  detachShapeListener() {
    assert && assert(this._invalidShapeListenerAttached, 'We cannot detach an unattached listener');
    this._shape.invalidatedEmitter.removeListener(this._invalidShapeListener);
    this._invalidShapeListenerAttached = false;
  }

  /**
   * Computes a more efficient selfBounds for our Path.
   *
   * @returns - Whether the self bounds changed.
   */
  updateSelfBounds() {
    const selfBounds = this.hasShape() ? this.computeShapeBounds() : Bounds2.NOTHING;
    const changed = !selfBounds.equals(this.selfBoundsProperty._value);
    if (changed) {
      this.selfBoundsProperty._value.set(selfBounds);
    }
    return changed;
  }
  setBoundsMethod(boundsMethod) {
    assert && assert(boundsMethod === 'accurate' || boundsMethod === 'unstroked' || boundsMethod === 'tightPadding' || boundsMethod === 'safePadding' || boundsMethod === 'none');
    if (this._boundsMethod !== boundsMethod) {
      this._boundsMethod = boundsMethod;
      this.invalidatePath();
      this.rendererSummaryRefreshEmitter.emit(); // whether our self bounds are valid may have changed
    }
    return this;
  }
  set boundsMethod(value) {
    this.setBoundsMethod(value);
  }
  get boundsMethod() {
    return this.getBoundsMethod();
  }

  /**
   * Returns the current bounds method. See setBoundsMethod for details.
   */
  getBoundsMethod() {
    return this._boundsMethod;
  }

  /**
   * Computes the bounds of the Path (or subtype when overridden). Meant to be overridden in subtypes for more
   * efficient bounds computations (but this will work as a fallback). Includes the stroked region if there is a
   * stroke applied to the Path.
   */
  computeShapeBounds() {
    const shape = this.getShape();
    // boundsMethod: 'none' will return no bounds
    if (this._boundsMethod === 'none' || !shape) {
      return Bounds2.NOTHING;
    } else {
      // boundsMethod: 'unstroked', or anything without a stroke will then just use the normal shape bounds
      if (!this.hasPaintableStroke() || this._boundsMethod === 'unstroked') {
        return shape.bounds;
      } else {
        // 'accurate' will always require computing the full stroked shape, and taking its bounds
        if (this._boundsMethod === 'accurate') {
          return shape.getStrokedBounds(this.getLineStyles());
        }
        // Otherwise we compute bounds based on 'tightPadding' and 'safePadding', the one difference being that
        // 'safePadding' will include whatever bounds necessary to include miters. Square line-cap requires a
        // slightly extended bounds in either case.
        else {
          let factor;
          // If miterLength (inside corner to outside corner) exceeds miterLimit * strokeWidth, it will get turned to
          // a bevel, so our factor will be based just on the miterLimit.
          if (this._boundsMethod === 'safePadding' && this.getLineJoin() === 'miter') {
            factor = this.getMiterLimit();
          } else if (this.getLineCap() === 'square') {
            factor = Math.SQRT2;
          } else {
            factor = 1;
          }
          return shape.bounds.dilated(factor * this.getLineWidth() / 2);
        }
      }
    }
  }

  /**
   * Whether this Node's selfBounds are considered to be valid (always containing the displayed self content
   * of this node). Meant to be overridden in subtypes when this can change (e.g. Text).
   *
   * If this value would potentially change, please trigger the event 'selfBoundsValid'.
   */
  areSelfBoundsValid() {
    if (this._boundsMethod === 'accurate' || this._boundsMethod === 'safePadding') {
      return true;
    } else if (this._boundsMethod === 'none') {
      return false;
    } else {
      return !this.hasStroke(); // 'tightPadding' and 'unstroked' options
    }
  }

  /**
   * Returns our self bounds when our rendered self is transformed by the matrix.
   */
  getTransformedSelfBounds(matrix) {
    assert && assert(this.hasShape());
    return (this._stroke ? this.getStrokedShape() : this.getShape()).getBoundsWithTransform(matrix);
  }

  /**
   * Returns our safe self bounds when our rendered self is transformed by the matrix.
   */
  getTransformedSafeSelfBounds(matrix) {
    return this.getTransformedSelfBounds(matrix);
  }

  /**
   * Called from (and overridden in) the Paintable trait, invalidates our current stroke, triggering recomputation of
   * anything that depended on the old stroke's value. (scenery-internal)
   */
  invalidateStroke() {
    this.invalidatePath();
    this.rendererSummaryRefreshEmitter.emit(); // Stroke changing could have changed our self-bounds-validitity (unstroked/etc)

    super.invalidateStroke();
  }

  /**
   * Returns whether this Path has an associated Shape (instead of no shape, represented by null)
   */
  hasShape() {
    return !!this._shape;
  }

  /**
   * Draws the current Node's self representation, assuming the wrapper's Canvas context is already in the local
   * coordinate frame of this node.
   *
   * @param wrapper
   * @param matrix - The transformation matrix already applied to the context.
   */
  canvasPaintSelf(wrapper, matrix) {
    //TODO: Have a separate method for this, instead of touching the prototype. Can make 'this' references too easily. https://github.com/phetsims/scenery/issues/1581
    PathCanvasDrawable.prototype.paintCanvas(wrapper, this, matrix);
  }

  /**
   * Creates a SVG drawable for this Path. (scenery-internal)
   *
   * @param renderer - In the bitmask format specified by Renderer, which may contain additional bit flags.
   * @param instance - Instance object that will be associated with the drawable
   */
  createSVGDrawable(renderer, instance) {
    // @ts-expect-error
    return PathSVGDrawable.createFromPool(renderer, instance);
  }

  /**
   * Creates a Canvas drawable for this Path. (scenery-internal)
   *
   * @param renderer - In the bitmask format specified by Renderer, which may contain additional bit flags.
   * @param instance - Instance object that will be associated with the drawable
   */
  createCanvasDrawable(renderer, instance) {
    // @ts-expect-error
    return PathCanvasDrawable.createFromPool(renderer, instance);
  }

  /**
   * Whether this Node itself is painted (displays something itself).
   */
  isPainted() {
    // Always true for Path nodes
    return true;
  }

  /**
   * Computes whether the provided point is "inside" (contained) in this Path's self content, or "outside".
   *
   * @param point - Considered to be in the local coordinate frame
   */
  containsPointSelf(point) {
    let result = false;
    if (!this.hasShape()) {
      return result;
    }

    // if this node is fillPickable, we will return true if the point is inside our fill area
    if (this._fillPickable) {
      result = this.getShape().containsPoint(point);
    }

    // also include the stroked region in the hit area if strokePickable
    if (!result && this._strokePickable) {
      result = this.getStrokedShape().containsPoint(point);
    }
    return result;
  }

  /**
   * Returns a Shape that represents the area covered by containsPointSelf.
   */
  getSelfShape() {
    return Shape.union([...(this.hasShape() && this._fillPickable ? [this.getShape()] : []), ...(this.hasShape() && this._strokePickable ? [this.getStrokedShape()] : [])]);
  }

  /**
   * Returns whether this Path's selfBounds is intersected by the specified bounds.
   *
   * @param bounds - Bounds to test, assumed to be in the local coordinate frame.
   */
  intersectsBoundsSelf(bounds) {
    // TODO: should a shape's stroke be included? https://github.com/phetsims/scenery/issues/1581
    return this._shape ? this._shape.intersectsBounds(bounds) : false;
  }

  /**
   * Returns whether we need to apply a transform workaround for https://github.com/phetsims/scenery/issues/196, which
   * only applies when we have a pattern or gradient (e.g. subtypes of Paint).
   */
  requiresSVGBoundsWorkaround() {
    if (!this._stroke || !(this._stroke instanceof Paint) || !this.hasShape()) {
      return false;
    }
    const bounds = this.computeShapeBounds();
    return bounds.width * bounds.height === 0; // at least one of them was zero, so the bounding box has no area
  }

  /**
   * Override for extra information in the debugging output (from Display.getDebugHTML()). (scenery-internal)
   */
  getDebugHTMLExtras() {
    return this._shape ? ` (<span style="color: #88f" onclick="window.open( 'data:text/plain;charset=utf-8,' + encodeURIComponent( '${this._shape.getSVGPath()}' ) );">path</span>)` : '';
  }

  /**
   * Disposes the path, releasing shape listeners if needed (and preventing new listeners from being added).
   */
  dispose() {
    if (this._invalidShapeListenerAttached) {
      this.detachShapeListener();
    }
    this._shapeProperty.dispose();
    super.dispose();
  }
  mutate(options) {
    return super.mutate(options);
  }

  // Initial values for most Node mutator options
  static DEFAULT_PATH_OPTIONS = combineOptions({}, Node.DEFAULT_NODE_OPTIONS, DEFAULT_OPTIONS);
}

/**
 * {Array.<string>} - String keys for all of the allowed options that will be set by node.mutate( options ), in the
 * order they will be evaluated in.
 *
 * NOTE: See Node's _mutatorKeys documentation for more information on how this operates, and potential special
 *       cases that may apply.
 */
Path.prototype._mutatorKeys = [...PAINTABLE_OPTION_KEYS, ...PATH_OPTION_KEYS, ...Node.prototype._mutatorKeys];

/**
 * {Array.<String>} - List of all dirty flags that should be available on drawables created from this node (or
 *                    subtype). Given a flag (e.g. radius), it indicates the existence of a function
 *                    drawable.markDirtyRadius() that will indicate to the drawable that the radius has changed.
 * (scenery-internal)
 * @override
 */
Path.prototype.drawableMarkFlags = [...Node.prototype.drawableMarkFlags, ...PAINTABLE_DRAWABLE_MARK_FLAGS, 'shape'];
scenery.register('Path', Path);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb3VuZHMyIiwiU2hhcGUiLCJOb2RlIiwiUGFpbnQiLCJQYWludGFibGUiLCJQQUlOVEFCTEVfRFJBV0FCTEVfTUFSS19GTEFHUyIsIlBBSU5UQUJMRV9PUFRJT05fS0VZUyIsIlBhdGhDYW52YXNEcmF3YWJsZSIsIlBhdGhTVkdEcmF3YWJsZSIsIlJlbmRlcmVyIiwic2NlbmVyeSIsIm9wdGlvbml6ZSIsImNvbWJpbmVPcHRpb25zIiwiaXNUUmVhZE9ubHlQcm9wZXJ0eSIsIlRpbnlGb3J3YXJkaW5nUHJvcGVydHkiLCJQQVRIX09QVElPTl9LRVlTIiwiREVGQVVMVF9PUFRJT05TIiwic2hhcGUiLCJib3VuZHNNZXRob2QiLCJQYXRoIiwiY29uc3RydWN0b3IiLCJwcm92aWRlZE9wdGlvbnMiLCJhc3NlcnQiLCJ1bmRlZmluZWQiLCJPYmplY3QiLCJnZXRQcm90b3R5cGVPZiIsInByb3RvdHlwZSIsImluaXRQYXRoT3B0aW9ucyIsInNoYXBlUHJvcGVydHkiLCJvcHRpb25zIiwiX3NoYXBlUHJvcGVydHkiLCJvblNoYXBlUHJvcGVydHlDaGFuZ2UiLCJiaW5kIiwiX3NoYXBlIiwiX3N0cm9rZWRTaGFwZSIsIl9ib3VuZHNNZXRob2QiLCJfaW52YWxpZFNoYXBlTGlzdGVuZXIiLCJpbnZhbGlkYXRlU2hhcGUiLCJfaW52YWxpZFNoYXBlTGlzdGVuZXJBdHRhY2hlZCIsImludmFsaWRhdGVTdXBwb3J0ZWRSZW5kZXJlcnMiLCJtdXRhdGUiLCJzZXRTaGFwZSIsInZhbHVlIiwiZ2V0U2hhcGUiLCJkZXRhY2hTaGFwZUxpc3RlbmVyIiwiaXNJbW11dGFibGUiLCJhdHRhY2hTaGFwZUxpc3RlbmVyIiwic2V0U2hhcGVQcm9wZXJ0eSIsIm5ld1RhcmdldCIsInNldFRhcmdldFByb3BlcnR5IiwicHJvcGVydHkiLCJnZXRTaGFwZVByb3BlcnR5IiwiZ2V0U3Ryb2tlZFNoYXBlIiwiaGFzU2hhcGUiLCJfbGluZURyYXdpbmdTdHlsZXMiLCJnZXRQYXRoUmVuZGVyZXJCaXRtYXNrIiwiYml0bWFza0NhbnZhcyIsImJpdG1hc2tTVkciLCJzZXRSZW5kZXJlckJpdG1hc2siLCJnZXRGaWxsUmVuZGVyZXJCaXRtYXNrIiwiZ2V0U3Ryb2tlUmVuZGVyZXJCaXRtYXNrIiwiaW52YWxpZGF0ZVBhdGgiLCJzdGF0ZUxlbiIsIl9kcmF3YWJsZXMiLCJsZW5ndGgiLCJpIiwibWFya0RpcnR5U2hhcGUiLCJpbnZhbGlkYXRlU2VsZiIsImlzRGlzcG9zZWQiLCJpbnZhbGlkYXRlZEVtaXR0ZXIiLCJhZGRMaXN0ZW5lciIsInJlbW92ZUxpc3RlbmVyIiwidXBkYXRlU2VsZkJvdW5kcyIsInNlbGZCb3VuZHMiLCJjb21wdXRlU2hhcGVCb3VuZHMiLCJOT1RISU5HIiwiY2hhbmdlZCIsImVxdWFscyIsInNlbGZCb3VuZHNQcm9wZXJ0eSIsIl92YWx1ZSIsInNldCIsInNldEJvdW5kc01ldGhvZCIsInJlbmRlcmVyU3VtbWFyeVJlZnJlc2hFbWl0dGVyIiwiZW1pdCIsImdldEJvdW5kc01ldGhvZCIsImhhc1BhaW50YWJsZVN0cm9rZSIsImJvdW5kcyIsImdldFN0cm9rZWRCb3VuZHMiLCJnZXRMaW5lU3R5bGVzIiwiZmFjdG9yIiwiZ2V0TGluZUpvaW4iLCJnZXRNaXRlckxpbWl0IiwiZ2V0TGluZUNhcCIsIk1hdGgiLCJTUVJUMiIsImRpbGF0ZWQiLCJnZXRMaW5lV2lkdGgiLCJhcmVTZWxmQm91bmRzVmFsaWQiLCJoYXNTdHJva2UiLCJnZXRUcmFuc2Zvcm1lZFNlbGZCb3VuZHMiLCJtYXRyaXgiLCJfc3Ryb2tlIiwiZ2V0Qm91bmRzV2l0aFRyYW5zZm9ybSIsImdldFRyYW5zZm9ybWVkU2FmZVNlbGZCb3VuZHMiLCJpbnZhbGlkYXRlU3Ryb2tlIiwiY2FudmFzUGFpbnRTZWxmIiwid3JhcHBlciIsInBhaW50Q2FudmFzIiwiY3JlYXRlU1ZHRHJhd2FibGUiLCJyZW5kZXJlciIsImluc3RhbmNlIiwiY3JlYXRlRnJvbVBvb2wiLCJjcmVhdGVDYW52YXNEcmF3YWJsZSIsImlzUGFpbnRlZCIsImNvbnRhaW5zUG9pbnRTZWxmIiwicG9pbnQiLCJyZXN1bHQiLCJfZmlsbFBpY2thYmxlIiwiY29udGFpbnNQb2ludCIsIl9zdHJva2VQaWNrYWJsZSIsImdldFNlbGZTaGFwZSIsInVuaW9uIiwiaW50ZXJzZWN0c0JvdW5kc1NlbGYiLCJpbnRlcnNlY3RzQm91bmRzIiwicmVxdWlyZXNTVkdCb3VuZHNXb3JrYXJvdW5kIiwid2lkdGgiLCJoZWlnaHQiLCJnZXREZWJ1Z0hUTUxFeHRyYXMiLCJnZXRTVkdQYXRoIiwiZGlzcG9zZSIsIkRFRkFVTFRfUEFUSF9PUFRJT05TIiwiREVGQVVMVF9OT0RFX09QVElPTlMiLCJfbXV0YXRvcktleXMiLCJkcmF3YWJsZU1hcmtGbGFncyIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiUGF0aC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxMy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBIFBhdGggZHJhd3MgYSBTaGFwZSB3aXRoIGEgc3BlY2lmaWMgdHlwZSBvZiBmaWxsIGFuZCBzdHJva2UuIE1peGVzIGluIFBhaW50YWJsZS5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBCb3VuZHMyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9Cb3VuZHMyLmpzJztcclxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tICcuLi8uLi8uLi9raXRlL2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgTWF0cml4MyBmcm9tICcuLi8uLi8uLi9kb3QvanMvTWF0cml4My5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IHsgQ2FudmFzQ29udGV4dFdyYXBwZXIsIENhbnZhc1NlbGZEcmF3YWJsZSwgSW5zdGFuY2UsIE5vZGUsIE5vZGVPcHRpb25zLCBQYWludCwgUGFpbnRhYmxlLCBQQUlOVEFCTEVfRFJBV0FCTEVfTUFSS19GTEFHUywgUEFJTlRBQkxFX09QVElPTl9LRVlTLCBQYWludGFibGVPcHRpb25zLCBQYXRoQ2FudmFzRHJhd2FibGUsIFBhdGhTVkdEcmF3YWJsZSwgUmVuZGVyZXIsIHNjZW5lcnksIFNWR1NlbGZEcmF3YWJsZSwgVFBhdGhEcmF3YWJsZSB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplLCB7IGNvbWJpbmVPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBUUmVhZE9ubHlQcm9wZXJ0eSwgeyBpc1RSZWFkT25seVByb3BlcnR5IH0gZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBXaXRoUmVxdWlyZWQgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1dpdGhSZXF1aXJlZC5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IFRpbnlGb3J3YXJkaW5nUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UaW55Rm9yd2FyZGluZ1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IFRQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RQcm9wZXJ0eS5qcyc7XHJcblxyXG5jb25zdCBQQVRIX09QVElPTl9LRVlTID0gW1xyXG4gICdib3VuZHNNZXRob2QnLFxyXG4gICdzaGFwZScsXHJcbiAgJ3NoYXBlUHJvcGVydHknXHJcbl07XHJcblxyXG5jb25zdCBERUZBVUxUX09QVElPTlMgPSB7XHJcbiAgc2hhcGU6IG51bGwsXHJcbiAgYm91bmRzTWV0aG9kOiAnYWNjdXJhdGUnIGFzIGNvbnN0XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBQYXRoQm91bmRzTWV0aG9kID0gJ2FjY3VyYXRlJyB8ICd1bnN0cm9rZWQnIHwgJ3RpZ2h0UGFkZGluZycgfCAnc2FmZVBhZGRpbmcnIHwgJ25vbmUnO1xyXG5cclxuLyoqXHJcbiAqIFRoZSB2YWxpZCBwYXJhbWV0ZXIgdHlwZXMgYXJlOlxyXG4gKiAtIFNoYXBlOiAoZnJvbSBLaXRlKSwgbm9ybWFsbHkgdXNlZC5cclxuICogLSBzdHJpbmc6IFVzZXMgdGhlIFNWRyBQYXRoIGZvcm1hdCwgc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9TVkcvcGF0aHMuaHRtbCAodGhlIFBBVEggcGFydCBvZiA8cGF0aCBkPVwiUEFUSFwiLz4pLlxyXG4gKiAgICAgICAgICAgVGhpcyB3aWxsIGltbWVkaWF0ZWx5IGJlIGNvbnZlcnRlZCB0byBhIFNoYXBlIG9iamVjdCB3aGVuIHNldCwgYW5kIGdldFNoYXBlKCkgb3IgZXF1aXZhbGVudHMgd2lsbCByZXR1cm5cclxuICogICAgICAgICAgIHRoZSBwYXJzZWQgU2hhcGUgaW5zdGFuY2UgaW5zdGVhZCBvZiB0aGUgb3JpZ2luYWwgc3RyaW5nLiBTZWUgXCJQYXJzZWRTaGFwZVwiXHJcbiAqIC0gbnVsbDogSW5kaWNhdGVzIHRoYXQgdGhlcmUgaXMgbm8gU2hhcGUsIGFuZCBub3RoaW5nIGlzIGRyYXduLiBVc3VhbGx5IHVzZWQgYXMgYSBwbGFjZWhvbGRlci5cclxuICpcclxuICogTk9URTogQmUgYXdhcmUgb2YgdGhlIHBvdGVudGlhbCBmb3IgbWVtb3J5IGxlYWtzLiBJZiBhIFNoYXBlIGlzIG5vdCBtYXJrZWQgYXMgaW1tdXRhYmxlICh3aXRoIG1ha2VJbW11dGFibGUoKSksXHJcbiAqICAgICAgIFBhdGggd2lsbCBhZGQgYSBsaXN0ZW5lciBzbyB0aGF0IGl0IGlzIHVwZGF0ZWQgd2hlbiB0aGUgU2hhcGUgaXRzZWxmIGNoYW5nZXMuIElmIHRoZXJlIGlzIGEgbGlzdGVuZXJcclxuICogICAgICAgYWRkZWQsIGtlZXBpbmcgYSByZWZlcmVuY2UgdG8gdGhlIFNoYXBlIHdpbGwgYWxzbyBrZWVwIGEgcmVmZXJlbmNlIHRvIHRoZSBQYXRoIG9iamVjdCAoYW5kIHRodXMgd2hhdGV2ZXJcclxuICogICAgICAgTm9kZXMgYXJlIGNvbm5lY3RlZCB0byB0aGUgUGF0aCkuIEZvciBub3csIHNldCBwYXRoLnNoYXBlID0gbnVsbCBpZiB5b3UgbmVlZCB0byByZWxlYXNlIHRoZSByZWZlcmVuY2VcclxuICogICAgICAgdGhhdCB0aGUgU2hhcGUgd291bGQgaGF2ZSwgb3IgY2FsbCBkaXNwb3NlKCkgb24gdGhlIFBhdGggaWYgaXQgaXMgbm90IG5lZWRlZCBhbnltb3JlLlxyXG4gKi9cclxudHlwZSBJbnB1dFNoYXBlID0gU2hhcGUgfCBzdHJpbmcgfCBudWxsO1xyXG5cclxuLyoqXHJcbiAqIFNlZSBJbnB1dFNoYXBlIGZvciBkZXRhaWxzLCBidXQgdGhpcyB0eXBlIGRpZmZlcnMgaW4gdGhhdCBpdCBvbmx5IHN1cHBvcnRzIGEgU2hhcGUsIGFuZCBhbnkgXCJzdHJpbmdcIiBkYXRhIHdpbGxcclxuICogYmUgcGFyc2VkIGludG8gYSBTaGFwZSBpbnN0YW5jZS5cclxuICovXHJcbnR5cGUgUGFyc2VkU2hhcGUgPSBTaGFwZSB8IG51bGw7XHJcblxyXG4vLyBQcm92aWRlIHRoZXNlIGFzIGFuIG9wdGlvbi5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuXHJcbiAgLyoqXHJcbiAgICogVGhpcyBzZXRzIHRoZSBzaGFwZSBvZiB0aGUgUGF0aCwgd2hpY2ggZGV0ZXJtaW5lcyB0aGUgc2hhcGUgb2YgaXRzIGFwcGVhcmFuY2UuIEl0IHNob3VsZCBnZW5lcmFsbHkgbm90IGJlIGNhbGxlZFxyXG4gICAqIG9uIFBhdGggc3VidHlwZXMgbGlrZSBMaW5lLCBSZWN0YW5nbGUsIGV0Yy4gU2VlIElucHV0U2hhcGUgZm9yIGRldGFpbHMgYWJvdXQgd2hhdCB0byBwcm92aWRlIGZvciB0aGUgc2hhcGUuXHJcbiAgICpcclxuICAgKiBOT1RFOiBXaGVuIHlvdSBjcmVhdGUgYSBQYXRoIHdpdGggYSBzaGFwZSBpbiB0aGUgY29uc3RydWN0b3IsIHRoaXMgc2V0dGVyIHdpbGwgYmUgY2FsbGVkIChkb24ndCBvdmVybG9hZCB0aGUgb3B0aW9uKS5cclxuICAgKi9cclxuICBzaGFwZT86IElucHV0U2hhcGU7XHJcblxyXG4gIC8qKlxyXG4gICAqIFNpbWlsYXIgdG8gYHNoYXBlYCwgYnV0IGFsbG93cyBzZXR0aW5nIHRoZSBzaGFwZSBhcyBhIFByb3BlcnR5LlxyXG4gICAqL1xyXG4gIHNoYXBlUHJvcGVydHk/OiBUUmVhZE9ubHlQcm9wZXJ0eTxJbnB1dFNoYXBlPjtcclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgYm91bmRzIG1ldGhvZCBmb3IgdGhlIFBhdGguIFRoaXMgZGV0ZXJtaW5lcyBob3cgb3VyIChzZWxmKSBib3VuZHMgYXJlIGNvbXB1dGVkLCBhbmQgY2FuIHBhcnRpY3VsYXJseVxyXG4gICAqIGRldGVybWluZSBob3cgZXhwZW5zaXZlIHRvIGNvbXB1dGUgb3VyIGJvdW5kcyBhcmUgaWYgd2UgaGF2ZSBhIHN0cm9rZS5cclxuICAgKlxyXG4gICAqIFRoZXJlIGFyZSB0aGUgZm9sbG93aW5nIG9wdGlvbnM6XHJcbiAgICogLSAnYWNjdXJhdGUnIC0gQWx3YXlzIHVzZXMgdGhlIG1vc3QgYWNjdXJhdGUgd2F5IG9mIGdldHRpbmcgYm91bmRzLiBDb21wdXRlcyB0aGUgZXhhY3Qgc3Ryb2tlZCBib3VuZHMuXHJcbiAgICogLSAndW5zdHJva2VkJyAtIElnbm9yZXMgYW55IHN0cm9rZSwganVzdCBnaXZlcyB0aGUgZmlsbGVkIGJvdW5kcy5cclxuICAgKiAgICAgICAgICAgICAgICAgSWYgdGhlcmUgaXMgYSBzdHJva2UsIHRoZSBib3VuZHMgd2lsbCBiZSBtYXJrZWQgYXMgaW5hY2N1cmF0ZVxyXG4gICAqIC0gJ3RpZ2h0UGFkZGluZycgLSBQYWRzIHRoZSBmaWxsZWQgYm91bmRzIGJ5IGVub3VnaCB0byBjb3ZlciBldmVyeXRoaW5nIGV4Y2VwdCBtaXRlcmVkIGpvaW50cy5cclxuICAgKiAgICAgICAgICAgICAgICAgICAgIElmIHRoZXJlIGlzIGEgc3Ryb2tlLCB0aGUgYm91bmRzIHdpbCBiZSBtYXJrZWQgYXMgaW5hY2N1cmF0ZS5cclxuICAgKiAtICdzYWZlUGFkZGluZycgLSBQYWRzIHRoZSBmaWxsZWQgYm91bmRzIGJ5IGVub3VnaCB0byBjb3ZlciBhbGwgbGluZSBqb2lucy9jYXBzLlxyXG4gICAqIC0gJ25vbmUnIC0gUmV0dXJucyBCb3VuZHMyLk5PVEhJTkcuIFRoZSBib3VuZHMgd2lsbCBiZSBtYXJrZWQgYXMgaW5hY2N1cmF0ZS5cclxuICAgKiAgICAgICAgICAgIE5PVEU6IEl0J3MgaW1wb3J0YW50IHRvIHByb3ZpZGUgYSBsb2NhbEJvdW5kcyBvdmVycmlkZSBpZiB5b3UgdXNlIHRoaXMgb3B0aW9uLCBzbyBpdHMgYm91bmRzIGNvdmVyIHRoZVxyXG4gICAqICAgICAgICAgICAgUGF0aCdzIHNoYXBlLiAocGF0aC5sb2NhbEJvdW5kcyA9IC4uLilcclxuICAgKi9cclxuICBib3VuZHNNZXRob2Q/OiBQYXRoQm91bmRzTWV0aG9kO1xyXG59O1xyXG50eXBlIFBhcmVudE9wdGlvbnMgPSBQYWludGFibGVPcHRpb25zICYgTm9kZU9wdGlvbnM7XHJcbmV4cG9ydCB0eXBlIFBhdGhPcHRpb25zID0gU2VsZk9wdGlvbnMgJiBQYXJlbnRPcHRpb25zO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGF0aCBleHRlbmRzIFBhaW50YWJsZSggTm9kZSApIHtcclxuXHJcbiAgLy8gVGhlIFNoYXBlIHVzZWQgZm9yIGRpc3BsYXlpbmcgdGhpcyBQYXRoLlxyXG4gIC8vIE5PVEU6IF9zaGFwZSBjYW4gYmUgbGF6aWx5IGNvbnN0cnVjdGVkIGluIHN1YnR5cGVzIChtYXkgYmUgbnVsbCkgaWYgaGFzU2hhcGUoKSBpcyBvdmVycmlkZGVuIHRvIHJldHVybiB0cnVlLFxyXG4gIC8vICAgICAgIGxpa2UgaW4gUmVjdGFuZ2xlLiBUaGlzIGlzIGJlY2F1c2UgdXN1YWxseSB0aGUgYWN0dWFsIFNoYXBlIGlzIGFscmVhZHkgaW1wbGllZCBieSBvdGhlciBwYXJhbWV0ZXJzLFxyXG4gIC8vICAgICAgIHNvIGl0IGlzIGJlc3QgdG8gbm90IGhhdmUgdG8gY29tcHV0ZSBpdCBvbiBjaGFuZ2VzLlxyXG4gIC8vIE5PVEU6IFBsZWFzZSB1c2UgaGFzU2hhcGUoKSB0byBkZXRlcm1pbmUgaWYgd2UgYXJlIGFjdHVhbGx5IGRyYXdpbmcgdGhpbmdzLCBhcyBpdCBpcyBzdWJ0eXBlLXNhZmUuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIF9zaGFwZTogUGFyc2VkU2hhcGU7XHJcblxyXG4gIC8vIEZvciBzaGFwZVByb3BlcnR5XHJcbiAgcHJpdmF0ZSByZWFkb25seSBfc2hhcGVQcm9wZXJ0eTogVGlueUZvcndhcmRpbmdQcm9wZXJ0eTxJbnB1dFNoYXBlPjtcclxuXHJcbiAgLy8gVGhpcyBzdG9yZXMgYSBzdHJva2VkIGNvcHkgb2YgdGhlIFNoYXBlIHdoaWNoIGlzIGxhemlseSBjb21wdXRlZC4gVGhpcyBjYW4gYmUgcmVxdWlyZWQgZm9yIGNvbXB1dGluZyBib3VuZHNcclxuICAvLyBvZiBhIFNoYXBlIHdpdGggYSBzdHJva2UuXHJcbiAgcHJpdmF0ZSBfc3Ryb2tlZFNoYXBlOiBQYXJzZWRTaGFwZTtcclxuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIF9ib3VuZHNNZXRob2Q6IFBhdGhCb3VuZHNNZXRob2Q7XHJcblxyXG4gIC8vIFVzZWQgYXMgYSBsaXN0ZW5lciB0byBTaGFwZXMgZm9yIHdoZW4gdGhleSBhcmUgaW52YWxpZGF0ZWQuIFRoZSBsaXN0ZW5lcnMgYXJlIG5vdCBhZGRlZCBpZiB0aGUgU2hhcGUgaXNcclxuICAvLyBpbW11dGFibGUsIGFuZCBpZiB0aGUgU2hhcGUgYmVjb21lcyBpbW11dGFibGUsIHRoZW4gdGhlIGxpc3RlbmVycyBhcmUgcmVtb3ZlZC5cclxuICBwcml2YXRlIHJlYWRvbmx5IF9pbnZhbGlkU2hhcGVMaXN0ZW5lcjogKCkgPT4gdm9pZDtcclxuXHJcbiAgLy8gV2hldGhlciBvdXIgc2hhcGUgbGlzdGVuZXIgaXMgYXR0YWNoZWQgdG8gYSBzaGFwZS5cclxuICBwcml2YXRlIF9pbnZhbGlkU2hhcGVMaXN0ZW5lckF0dGFjaGVkOiBib29sZWFuO1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgUGF0aCB3aXRoIGEgZ2l2ZW4gc2hhcGUgc3BlY2lmaWVyIChhIFNoYXBlLCBhIHN0cmluZyBpbiB0aGUgU1ZHIHBhdGggZm9ybWF0LCBvciBudWxsIHRvIGluZGljYXRlIG5vXHJcbiAgICogc2hhcGUpLlxyXG4gICAqXHJcbiAgICogUGF0aCBoYXMgdHdvIGFkZGl0aW9uYWwgb3B0aW9ucyAoYWJvdmUgd2hhdCBOb2RlIHByb3ZpZGVzKTpcclxuICAgKiAtIHNoYXBlOiBUaGUgYWN0dWFsIFNoYXBlIChvciBhIHN0cmluZyByZXByZXNlbnRpbmcgYW4gU1ZHIHBhdGgsIG9yIG51bGwpLlxyXG4gICAqIC0gYm91bmRzTWV0aG9kOiBEZXRlcm1pbmVzIGhvdyB0aGUgYm91bmRzIG9mIGEgc2hhcGUgYXJlIGRldGVybWluZWQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gc2hhcGUgLSBUaGUgaW5pdGlhbCBTaGFwZSB0byBkaXNwbGF5LiBTZWUgb25TaGFwZVByb3BlcnR5Q2hhbmdlKCkgZm9yIG1vcmUgZGV0YWlscyBhbmQgZG9jdW1lbnRhdGlvbi5cclxuICAgKiBAcGFyYW0gW3Byb3ZpZGVkT3B0aW9uc10gLSBQYXRoLXNwZWNpZmljIG9wdGlvbnMgYXJlIGRvY3VtZW50ZWQgaW4gUEFUSF9PUFRJT05fS0VZUyBhYm92ZSwgYW5kIGNhbiBiZSBwcm92aWRlZFxyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbG9uZy1zaWRlIG9wdGlvbnMgZm9yIE5vZGVcclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHNoYXBlOiBJbnB1dFNoYXBlIHwgVFJlYWRPbmx5UHJvcGVydHk8SW5wdXRTaGFwZT4sIHByb3ZpZGVkT3B0aW9ucz86IFBhdGhPcHRpb25zICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcHJvdmlkZWRPcHRpb25zID09PSB1bmRlZmluZWQgfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKCBwcm92aWRlZE9wdGlvbnMgKSA9PT0gT2JqZWN0LnByb3RvdHlwZSxcclxuICAgICAgJ0V4dHJhIHByb3RvdHlwZSBvbiBOb2RlIG9wdGlvbnMgb2JqZWN0IGlzIGEgY29kZSBzbWVsbCcgKTtcclxuXHJcbiAgICBpZiAoIHNoYXBlIHx8IHByb3ZpZGVkT3B0aW9ucz8uc2hhcGUgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoICFzaGFwZSB8fCAhcHJvdmlkZWRPcHRpb25zPy5zaGFwZSwgJ0RvIG5vdCBkZWZpbmUgc2hhcGUgdHdpY2UuIENoZWNrIGNvbnN0cnVjdG9yIGFuZCBwcm92aWRlZE9wdGlvbnMuJyApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGluaXRQYXRoT3B0aW9uczogV2l0aFJlcXVpcmVkPFBhdGhPcHRpb25zLCAnYm91bmRzTWV0aG9kJz4gPSB7XHJcbiAgICAgIGJvdW5kc01ldGhvZDogREVGQVVMVF9PUFRJT05TLmJvdW5kc01ldGhvZFxyXG4gICAgfTtcclxuICAgIGlmICggaXNUUmVhZE9ubHlQcm9wZXJ0eSggc2hhcGUgKSApIHtcclxuICAgICAgaW5pdFBhdGhPcHRpb25zLnNoYXBlUHJvcGVydHkgPSBzaGFwZTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBpbml0UGF0aE9wdGlvbnMuc2hhcGUgPSBzaGFwZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdHJpY3Qgb21pdCBiZWNhdXNlIG9uZSBXSUxMIGJlIGRlZmluZWRcclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8UGF0aE9wdGlvbnMsIFN0cmljdE9taXQ8U2VsZk9wdGlvbnMsICdzaGFwZScgfCAnc2hhcGVQcm9wZXJ0eSc+LCBQYXJlbnRPcHRpb25zPigpKCBpbml0UGF0aE9wdGlvbnMsIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIHN1cGVyKCk7XHJcblxyXG4gICAgLy8gV2UnbGwgaW5pdGlhbGl6ZSB0aGlzIGJ5IG11dGF0aW5nLlxyXG4gICAgdGhpcy5fc2hhcGVQcm9wZXJ0eSA9IG5ldyBUaW55Rm9yd2FyZGluZ1Byb3BlcnR5PElucHV0U2hhcGU+KCBudWxsLCBmYWxzZSwgdGhpcy5vblNoYXBlUHJvcGVydHlDaGFuZ2UuYmluZCggdGhpcyApICk7XHJcblxyXG4gICAgdGhpcy5fc2hhcGUgPSBERUZBVUxUX09QVElPTlMuc2hhcGU7XHJcbiAgICB0aGlzLl9zdHJva2VkU2hhcGUgPSBudWxsO1xyXG4gICAgdGhpcy5fYm91bmRzTWV0aG9kID0gREVGQVVMVF9PUFRJT05TLmJvdW5kc01ldGhvZDtcclxuICAgIHRoaXMuX2ludmFsaWRTaGFwZUxpc3RlbmVyID0gdGhpcy5pbnZhbGlkYXRlU2hhcGUuYmluZCggdGhpcyApO1xyXG4gICAgdGhpcy5faW52YWxpZFNoYXBlTGlzdGVuZXJBdHRhY2hlZCA9IGZhbHNlO1xyXG5cclxuICAgIHRoaXMuaW52YWxpZGF0ZVN1cHBvcnRlZFJlbmRlcmVycygpO1xyXG5cclxuICAgIHRoaXMubXV0YXRlKCBvcHRpb25zICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0U2hhcGUoIHNoYXBlOiBJbnB1dFNoYXBlICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggc2hhcGUgPT09IG51bGwgfHwgdHlwZW9mIHNoYXBlID09PSAnc3RyaW5nJyB8fCBzaGFwZSBpbnN0YW5jZW9mIFNoYXBlLFxyXG4gICAgICAnQSBwYXRoXFwncyBzaGFwZSBzaG91bGQgZWl0aGVyIGJlIG51bGwsIGEgc3RyaW5nLCBvciBhIFNoYXBlJyApO1xyXG5cclxuICAgIHRoaXMuX3NoYXBlUHJvcGVydHkudmFsdWUgPSBzaGFwZTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgc2hhcGUoIHZhbHVlOiBJbnB1dFNoYXBlICkgeyB0aGlzLnNldFNoYXBlKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgc2hhcGUoKTogUGFyc2VkU2hhcGUgeyByZXR1cm4gdGhpcy5nZXRTaGFwZSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHNoYXBlIHRoYXQgd2FzIHNldCBmb3IgdGhpcyBQYXRoIChvciBmb3Igc3VidHlwZXMgbGlrZSBMaW5lIGFuZCBSZWN0YW5nbGUsIHdpbGwgcmV0dXJuIGFuIGltbXV0YWJsZVxyXG4gICAqIFNoYXBlIHRoYXQgaXMgZXF1aXZhbGVudCBpbiBhcHBlYXJhbmNlKS5cclxuICAgKlxyXG4gICAqIEl0IGlzIGJlc3QgdG8gZ2VuZXJhbGx5IGFzc3VtZSBtb2RpZmljYXRpb25zIHRvIHRoZSBTaGFwZSByZXR1cm5lZCBpcyBub3Qgc3VwcG9ydGVkLiBJZiB0aGVyZSBpcyBubyBzaGFwZVxyXG4gICAqIGN1cnJlbnRseSwgbnVsbCB3aWxsIGJlIHJldHVybmVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTaGFwZSgpOiBQYXJzZWRTaGFwZSB7XHJcbiAgICByZXR1cm4gdGhpcy5fc2hhcGU7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG9uU2hhcGVQcm9wZXJ0eUNoYW5nZSggc2hhcGU6IElucHV0U2hhcGUgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBzaGFwZSA9PT0gbnVsbCB8fCB0eXBlb2Ygc2hhcGUgPT09ICdzdHJpbmcnIHx8IHNoYXBlIGluc3RhbmNlb2YgU2hhcGUsXHJcbiAgICAgICdBIHBhdGhcXCdzIHNoYXBlIHNob3VsZCBlaXRoZXIgYmUgbnVsbCwgYSBzdHJpbmcsIG9yIGEgU2hhcGUnICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9zaGFwZSAhPT0gc2hhcGUgKSB7XHJcbiAgICAgIC8vIFJlbW92ZSBTaGFwZSBpbnZhbGlkYXRpb24gbGlzdGVuZXIgaWYgYXBwbGljYWJsZVxyXG4gICAgICBpZiAoIHRoaXMuX2ludmFsaWRTaGFwZUxpc3RlbmVyQXR0YWNoZWQgKSB7XHJcbiAgICAgICAgdGhpcy5kZXRhY2hTaGFwZUxpc3RlbmVyKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggdHlwZW9mIHNoYXBlID09PSAnc3RyaW5nJyApIHtcclxuICAgICAgICAvLyBiZSBjb250ZW50IHdpdGggb25TaGFwZVByb3BlcnR5Q2hhbmdlIGFsd2F5cyBpbnZhbGlkYXRpbmcgdGhlIHNoYXBlP1xyXG4gICAgICAgIHNoYXBlID0gbmV3IFNoYXBlKCBzaGFwZSApO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuX3NoYXBlID0gc2hhcGU7XHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZVNoYXBlKCk7XHJcblxyXG4gICAgICAvLyBBZGQgU2hhcGUgaW52YWxpZGF0aW9uIGxpc3RlbmVyIGlmIGFwcGxpY2FibGVcclxuICAgICAgaWYgKCB0aGlzLl9zaGFwZSAmJiAhdGhpcy5fc2hhcGUuaXNJbW11dGFibGUoKSApIHtcclxuICAgICAgICB0aGlzLmF0dGFjaFNoYXBlTGlzdGVuZXIoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIGRvY3VtZW50YXRpb24gZm9yIE5vZGUuc2V0VmlzaWJsZVByb3BlcnR5LCBleGNlcHQgdGhpcyBpcyBmb3IgdGhlIHNoYXBlXHJcbiAgICovXHJcbiAgcHVibGljIHNldFNoYXBlUHJvcGVydHkoIG5ld1RhcmdldDogVFJlYWRPbmx5UHJvcGVydHk8SW5wdXRTaGFwZT4gfCBudWxsICk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHRoaXMuX3NoYXBlUHJvcGVydHkuc2V0VGFyZ2V0UHJvcGVydHkoIG5ld1RhcmdldCBhcyBUUHJvcGVydHk8SW5wdXRTaGFwZT4gKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgc2hhcGVQcm9wZXJ0eSggcHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PElucHV0U2hhcGU+IHwgbnVsbCApIHsgdGhpcy5zZXRTaGFwZVByb3BlcnR5KCBwcm9wZXJ0eSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgc2hhcGVQcm9wZXJ0eSgpOiBUUHJvcGVydHk8SW5wdXRTaGFwZT4geyByZXR1cm4gdGhpcy5nZXRTaGFwZVByb3BlcnR5KCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogTGlrZSBOb2RlLmdldFZpc2libGVQcm9wZXJ0eSgpLCBidXQgZm9yIHRoZSBzaGFwZS4gTm90ZSB0aGlzIGlzIG5vdCB0aGUgc2FtZSBhcyB0aGUgUHJvcGVydHkgcHJvdmlkZWQgaW5cclxuICAgKiBzZXRTaGFwZVByb3BlcnR5LiBUaHVzIGlzIHRoZSBuYXR1cmUgb2YgVGlueUZvcndhcmRpbmdQcm9wZXJ0eS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0U2hhcGVQcm9wZXJ0eSgpOiBUUHJvcGVydHk8SW5wdXRTaGFwZT4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX3NoYXBlUHJvcGVydHk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgbGF6aWx5LWNyZWF0ZWQgU2hhcGUgdGhhdCBoYXMgdGhlIGFwcGVhcmFuY2Ugb2YgdGhlIFBhdGgncyBzaGFwZSBidXQgc3Ryb2tlZCB1c2luZyB0aGUgY3VycmVudFxyXG4gICAqIHN0cm9rZSBzdHlsZSBvZiB0aGUgUGF0aC5cclxuICAgKlxyXG4gICAqIE5PVEU6IEl0IGlzIGludmFsaWQgdG8gY2FsbCB0aGlzIG9uIGEgUGF0aCB0aGF0IGRvZXMgbm90IGN1cnJlbnRseSBoYXZlIGEgU2hhcGUgKHVzdWFsbHkgYSBQYXRoIHdoZXJlXHJcbiAgICogICAgICAgdGhlIHNoYXBlIGlzIHNldCB0byBudWxsKS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0U3Ryb2tlZFNoYXBlKCk6IFNoYXBlIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuaGFzU2hhcGUoKSwgJ1dlIGNhbm5vdCBzdHJva2UgYSBub24tZXhpc3Rpbmcgc2hhcGUnICk7XHJcblxyXG4gICAgLy8gTGF6aWx5IGNvbXB1dGUgdGhlIHN0cm9rZWQgc2hhcGUuIEl0IHNob3VsZCBiZSBzZXQgdG8gbnVsbCB3aGVuIHdlIG5lZWQgdG8gcmVjb21wdXRlIGl0XHJcbiAgICBpZiAoICF0aGlzLl9zdHJva2VkU2hhcGUgKSB7XHJcbiAgICAgIHRoaXMuX3N0cm9rZWRTaGFwZSA9IHRoaXMuZ2V0U2hhcGUoKSEuZ2V0U3Ryb2tlZFNoYXBlKCB0aGlzLl9saW5lRHJhd2luZ1N0eWxlcyApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzLl9zdHJva2VkU2hhcGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgYml0bWFzayByZXByZXNlbnRpbmcgdGhlIHN1cHBvcnRlZCByZW5kZXJlcnMgZm9yIHRoZSBjdXJyZW50IGNvbmZpZ3VyYXRpb24gb2YgdGhlIFBhdGggb3Igc3VidHlwZS5cclxuICAgKlxyXG4gICAqIFNob3VsZCBiZSBvdmVycmlkZGVuIGJ5IHN1YnR5cGVzIHRvIGVpdGhlciBleHRlbmQgb3IgcmVzdHJpY3QgcmVuZGVyZXJzLCBkZXBlbmRpbmcgb24gd2hhdCByZW5kZXJlcnMgYXJlXHJcbiAgICogc3VwcG9ydGVkLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgLSBBIGJpdG1hc2sgdGhhdCBpbmNsdWRlcyBzdXBwb3J0ZWQgcmVuZGVyZXJzLCBzZWUgUmVuZGVyZXIgZm9yIGRldGFpbHMuXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIGdldFBhdGhSZW5kZXJlckJpdG1hc2soKTogbnVtYmVyIHtcclxuICAgIC8vIEJ5IGRlZmF1bHQsIENhbnZhcyBhbmQgU1ZHIGFyZSBhY2NlcHRlZC5cclxuICAgIHJldHVybiBSZW5kZXJlci5iaXRtYXNrQ2FudmFzIHwgUmVuZGVyZXIuYml0bWFza1NWRztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyaWdnZXJzIGEgY2hlY2sgYW5kIHVwZGF0ZSBmb3Igd2hhdCByZW5kZXJlcnMgdGhlIGN1cnJlbnQgY29uZmlndXJhdGlvbiBvZiB0aGlzIFBhdGggb3Igc3VidHlwZSBzdXBwb3J0cy5cclxuICAgKiBUaGlzIHNob3VsZCBiZSBjYWxsZWQgd2hlbmV2ZXIgc29tZXRoaW5nIHRoYXQgY291bGQgcG90ZW50aWFsbHkgY2hhbmdlIHN1cHBvcnRlZCByZW5kZXJlcnMgaGFwcGVuICh3aGljaCBjYW5cclxuICAgKiBiZSB0aGUgc2hhcGUsIHByb3BlcnRpZXMgb2YgdGhlIHN0cm9rZXMgb3IgZmlsbHMsIGV0Yy4pXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGludmFsaWRhdGVTdXBwb3J0ZWRSZW5kZXJlcnMoKTogdm9pZCB7XHJcbiAgICB0aGlzLnNldFJlbmRlcmVyQml0bWFzayggdGhpcy5nZXRGaWxsUmVuZGVyZXJCaXRtYXNrKCkgJiB0aGlzLmdldFN0cm9rZVJlbmRlcmVyQml0bWFzaygpICYgdGhpcy5nZXRQYXRoUmVuZGVyZXJCaXRtYXNrKCkgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE5vdGlmaWVzIHRoZSBQYXRoIHRoYXQgdGhlIFNoYXBlIGhhcyBjaGFuZ2VkIChlaXRoZXIgdGhlIFNoYXBlIGl0c2VsZiBoYXMgYmUgbXV0YXRlZCwgYSBuZXcgU2hhcGUgaGFzIGJlZW5cclxuICAgKiBwcm92aWRlZCkuXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIHNob3VsZCBub3QgYmUgY2FsbGVkIG9uIHN1YnR5cGVzIG9mIFBhdGggYWZ0ZXIgdGhleSBoYXZlIGJlZW4gY29uc3RydWN0ZWQsIGxpa2UgTGluZSwgUmVjdGFuZ2xlLCBldGMuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBpbnZhbGlkYXRlU2hhcGUoKTogdm9pZCB7XHJcbiAgICB0aGlzLmludmFsaWRhdGVQYXRoKCk7XHJcblxyXG4gICAgY29uc3Qgc3RhdGVMZW4gPSB0aGlzLl9kcmF3YWJsZXMubGVuZ3RoO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgc3RhdGVMZW47IGkrKyApIHtcclxuICAgICAgKCB0aGlzLl9kcmF3YWJsZXNbIGkgXSBhcyB1bmtub3duIGFzIFRQYXRoRHJhd2FibGUgKS5tYXJrRGlydHlTaGFwZSgpOyAvLyBzdWJ0eXBlcyBvZiBQYXRoIG1heSBub3QgaGF2ZSB0aGlzLCBidXQgaXQncyBjYWxsZWQgZHVyaW5nIGNvbnN0cnVjdGlvblxyXG4gICAgfVxyXG5cclxuICAgIC8vIERpc2Nvbm5lY3Qgb3VyIFNoYXBlIGxpc3RlbmVyIGlmIG91ciBTaGFwZSBoYXMgYmVjb21lIGltbXV0YWJsZS5cclxuICAgIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc3VuL2lzc3Vlcy8yNzAjaXNzdWVjb21tZW50LTI1MDI2NjE3NFxyXG4gICAgaWYgKCB0aGlzLl9pbnZhbGlkU2hhcGVMaXN0ZW5lckF0dGFjaGVkICYmIHRoaXMuX3NoYXBlICYmIHRoaXMuX3NoYXBlLmlzSW1tdXRhYmxlKCkgKSB7XHJcbiAgICAgIHRoaXMuZGV0YWNoU2hhcGVMaXN0ZW5lcigpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW52YWxpZGF0ZXMgdGhlIG5vZGUncyBzZWxmLWJvdW5kcyBhbmQgYW55IG90aGVyIHJlY29yZGVkIG1ldGFkYXRhIGFib3V0IHRoZSBvdXRsaW5lIG9yIGJvdW5kcyBvZiB0aGUgU2hhcGUuXHJcbiAgICpcclxuICAgKiBUaGlzIGlzIG1lYW50IHRvIGJlIHVzZWQgZm9yIGFsbCBQYXRoIHN1YnR5cGVzICh1bmxpa2UgaW52YWxpZGF0ZVNoYXBlKS5cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgaW52YWxpZGF0ZVBhdGgoKTogdm9pZCB7XHJcbiAgICB0aGlzLl9zdHJva2VkU2hhcGUgPSBudWxsO1xyXG5cclxuICAgIHRoaXMuaW52YWxpZGF0ZVNlbGYoKTsgLy8gV2UgZG9uJ3QgaW1tZWRpYXRlbHkgY29tcHV0ZSB0aGUgYm91bmRzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBdHRhY2hlcyBhIGxpc3RlbmVyIHRvIG91ciBTaGFwZSB0aGF0IHdpbGwgYmUgY2FsbGVkIHdoZW5ldmVyIHRoZSBTaGFwZSBjaGFuZ2VzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgYXR0YWNoU2hhcGVMaXN0ZW5lcigpOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLl9pbnZhbGlkU2hhcGVMaXN0ZW5lckF0dGFjaGVkLCAnV2UgZG8gbm90IHdhbnQgdG8gaGF2ZSB0d28gbGlzdGVuZXJzIGF0dGFjaGVkIScgKTtcclxuXHJcbiAgICAvLyBEbyBub3QgYXR0YWNoIHNoYXBlIGxpc3RlbmVycyBpZiB3ZSBhcmUgZGlzcG9zZWRcclxuICAgIGlmICggIXRoaXMuaXNEaXNwb3NlZCApIHtcclxuICAgICAgdGhpcy5fc2hhcGUhLmludmFsaWRhdGVkRW1pdHRlci5hZGRMaXN0ZW5lciggdGhpcy5faW52YWxpZFNoYXBlTGlzdGVuZXIgKTtcclxuICAgICAgdGhpcy5faW52YWxpZFNoYXBlTGlzdGVuZXJBdHRhY2hlZCA9IHRydWU7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXRhY2hlcyBhIHByZXZpb3VzbHktYXR0YWNoZWQgbGlzdGVuZXIgYWRkZWQgdG8gb3VyIFNoYXBlIChzZWUgYXR0YWNoU2hhcGVMaXN0ZW5lcikuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBkZXRhY2hTaGFwZUxpc3RlbmVyKCk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5faW52YWxpZFNoYXBlTGlzdGVuZXJBdHRhY2hlZCwgJ1dlIGNhbm5vdCBkZXRhY2ggYW4gdW5hdHRhY2hlZCBsaXN0ZW5lcicgKTtcclxuXHJcbiAgICB0aGlzLl9zaGFwZSEuaW52YWxpZGF0ZWRFbWl0dGVyLnJlbW92ZUxpc3RlbmVyKCB0aGlzLl9pbnZhbGlkU2hhcGVMaXN0ZW5lciApO1xyXG4gICAgdGhpcy5faW52YWxpZFNoYXBlTGlzdGVuZXJBdHRhY2hlZCA9IGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcHV0ZXMgYSBtb3JlIGVmZmljaWVudCBzZWxmQm91bmRzIGZvciBvdXIgUGF0aC5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIC0gV2hldGhlciB0aGUgc2VsZiBib3VuZHMgY2hhbmdlZC5cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgb3ZlcnJpZGUgdXBkYXRlU2VsZkJvdW5kcygpOiBib29sZWFuIHtcclxuICAgIGNvbnN0IHNlbGZCb3VuZHMgPSB0aGlzLmhhc1NoYXBlKCkgPyB0aGlzLmNvbXB1dGVTaGFwZUJvdW5kcygpIDogQm91bmRzMi5OT1RISU5HO1xyXG4gICAgY29uc3QgY2hhbmdlZCA9ICFzZWxmQm91bmRzLmVxdWFscyggdGhpcy5zZWxmQm91bmRzUHJvcGVydHkuX3ZhbHVlICk7XHJcbiAgICBpZiAoIGNoYW5nZWQgKSB7XHJcbiAgICAgIHRoaXMuc2VsZkJvdW5kc1Byb3BlcnR5Ll92YWx1ZS5zZXQoIHNlbGZCb3VuZHMgKTtcclxuICAgIH1cclxuICAgIHJldHVybiBjaGFuZ2VkO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldEJvdW5kc01ldGhvZCggYm91bmRzTWV0aG9kOiBQYXRoQm91bmRzTWV0aG9kICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggYm91bmRzTWV0aG9kID09PSAnYWNjdXJhdGUnIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICBib3VuZHNNZXRob2QgPT09ICd1bnN0cm9rZWQnIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICBib3VuZHNNZXRob2QgPT09ICd0aWdodFBhZGRpbmcnIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICBib3VuZHNNZXRob2QgPT09ICdzYWZlUGFkZGluZycgfHxcclxuICAgICAgICAgICAgICAgICAgICAgIGJvdW5kc01ldGhvZCA9PT0gJ25vbmUnICk7XHJcbiAgICBpZiAoIHRoaXMuX2JvdW5kc01ldGhvZCAhPT0gYm91bmRzTWV0aG9kICkge1xyXG4gICAgICB0aGlzLl9ib3VuZHNNZXRob2QgPSBib3VuZHNNZXRob2Q7XHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZVBhdGgoKTtcclxuXHJcbiAgICAgIHRoaXMucmVuZGVyZXJTdW1tYXJ5UmVmcmVzaEVtaXR0ZXIuZW1pdCgpOyAvLyB3aGV0aGVyIG91ciBzZWxmIGJvdW5kcyBhcmUgdmFsaWQgbWF5IGhhdmUgY2hhbmdlZFxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGJvdW5kc01ldGhvZCggdmFsdWU6IFBhdGhCb3VuZHNNZXRob2QgKSB7IHRoaXMuc2V0Qm91bmRzTWV0aG9kKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgYm91bmRzTWV0aG9kKCk6IFBhdGhCb3VuZHNNZXRob2QgeyByZXR1cm4gdGhpcy5nZXRCb3VuZHNNZXRob2QoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IGJvdW5kcyBtZXRob2QuIFNlZSBzZXRCb3VuZHNNZXRob2QgZm9yIGRldGFpbHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEJvdW5kc01ldGhvZCgpOiBQYXRoQm91bmRzTWV0aG9kIHtcclxuICAgIHJldHVybiB0aGlzLl9ib3VuZHNNZXRob2Q7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb21wdXRlcyB0aGUgYm91bmRzIG9mIHRoZSBQYXRoIChvciBzdWJ0eXBlIHdoZW4gb3ZlcnJpZGRlbikuIE1lYW50IHRvIGJlIG92ZXJyaWRkZW4gaW4gc3VidHlwZXMgZm9yIG1vcmVcclxuICAgKiBlZmZpY2llbnQgYm91bmRzIGNvbXB1dGF0aW9ucyAoYnV0IHRoaXMgd2lsbCB3b3JrIGFzIGEgZmFsbGJhY2spLiBJbmNsdWRlcyB0aGUgc3Ryb2tlZCByZWdpb24gaWYgdGhlcmUgaXMgYVxyXG4gICAqIHN0cm9rZSBhcHBsaWVkIHRvIHRoZSBQYXRoLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb21wdXRlU2hhcGVCb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICBjb25zdCBzaGFwZSA9IHRoaXMuZ2V0U2hhcGUoKTtcclxuICAgIC8vIGJvdW5kc01ldGhvZDogJ25vbmUnIHdpbGwgcmV0dXJuIG5vIGJvdW5kc1xyXG4gICAgaWYgKCB0aGlzLl9ib3VuZHNNZXRob2QgPT09ICdub25lJyB8fCAhc2hhcGUgKSB7XHJcbiAgICAgIHJldHVybiBCb3VuZHMyLk5PVEhJTkc7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgLy8gYm91bmRzTWV0aG9kOiAndW5zdHJva2VkJywgb3IgYW55dGhpbmcgd2l0aG91dCBhIHN0cm9rZSB3aWxsIHRoZW4ganVzdCB1c2UgdGhlIG5vcm1hbCBzaGFwZSBib3VuZHNcclxuICAgICAgaWYgKCAhdGhpcy5oYXNQYWludGFibGVTdHJva2UoKSB8fCB0aGlzLl9ib3VuZHNNZXRob2QgPT09ICd1bnN0cm9rZWQnICkge1xyXG4gICAgICAgIHJldHVybiBzaGFwZS5ib3VuZHM7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gJ2FjY3VyYXRlJyB3aWxsIGFsd2F5cyByZXF1aXJlIGNvbXB1dGluZyB0aGUgZnVsbCBzdHJva2VkIHNoYXBlLCBhbmQgdGFraW5nIGl0cyBib3VuZHNcclxuICAgICAgICBpZiAoIHRoaXMuX2JvdW5kc01ldGhvZCA9PT0gJ2FjY3VyYXRlJyApIHtcclxuICAgICAgICAgIHJldHVybiBzaGFwZS5nZXRTdHJva2VkQm91bmRzKCB0aGlzLmdldExpbmVTdHlsZXMoKSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICAgIC8vIE90aGVyd2lzZSB3ZSBjb21wdXRlIGJvdW5kcyBiYXNlZCBvbiAndGlnaHRQYWRkaW5nJyBhbmQgJ3NhZmVQYWRkaW5nJywgdGhlIG9uZSBkaWZmZXJlbmNlIGJlaW5nIHRoYXRcclxuICAgICAgICAgIC8vICdzYWZlUGFkZGluZycgd2lsbCBpbmNsdWRlIHdoYXRldmVyIGJvdW5kcyBuZWNlc3NhcnkgdG8gaW5jbHVkZSBtaXRlcnMuIFNxdWFyZSBsaW5lLWNhcCByZXF1aXJlcyBhXHJcbiAgICAgICAgLy8gc2xpZ2h0bHkgZXh0ZW5kZWQgYm91bmRzIGluIGVpdGhlciBjYXNlLlxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgbGV0IGZhY3RvcjtcclxuICAgICAgICAgIC8vIElmIG1pdGVyTGVuZ3RoIChpbnNpZGUgY29ybmVyIHRvIG91dHNpZGUgY29ybmVyKSBleGNlZWRzIG1pdGVyTGltaXQgKiBzdHJva2VXaWR0aCwgaXQgd2lsbCBnZXQgdHVybmVkIHRvXHJcbiAgICAgICAgICAvLyBhIGJldmVsLCBzbyBvdXIgZmFjdG9yIHdpbGwgYmUgYmFzZWQganVzdCBvbiB0aGUgbWl0ZXJMaW1pdC5cclxuICAgICAgICAgIGlmICggdGhpcy5fYm91bmRzTWV0aG9kID09PSAnc2FmZVBhZGRpbmcnICYmIHRoaXMuZ2V0TGluZUpvaW4oKSA9PT0gJ21pdGVyJyApIHtcclxuICAgICAgICAgICAgZmFjdG9yID0gdGhpcy5nZXRNaXRlckxpbWl0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIGlmICggdGhpcy5nZXRMaW5lQ2FwKCkgPT09ICdzcXVhcmUnICkge1xyXG4gICAgICAgICAgICBmYWN0b3IgPSBNYXRoLlNRUlQyO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGZhY3RvciA9IDE7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gc2hhcGUuYm91bmRzLmRpbGF0ZWQoIGZhY3RvciAqIHRoaXMuZ2V0TGluZVdpZHRoKCkgLyAyICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGV0aGVyIHRoaXMgTm9kZSdzIHNlbGZCb3VuZHMgYXJlIGNvbnNpZGVyZWQgdG8gYmUgdmFsaWQgKGFsd2F5cyBjb250YWluaW5nIHRoZSBkaXNwbGF5ZWQgc2VsZiBjb250ZW50XHJcbiAgICogb2YgdGhpcyBub2RlKS4gTWVhbnQgdG8gYmUgb3ZlcnJpZGRlbiBpbiBzdWJ0eXBlcyB3aGVuIHRoaXMgY2FuIGNoYW5nZSAoZS5nLiBUZXh0KS5cclxuICAgKlxyXG4gICAqIElmIHRoaXMgdmFsdWUgd291bGQgcG90ZW50aWFsbHkgY2hhbmdlLCBwbGVhc2UgdHJpZ2dlciB0aGUgZXZlbnQgJ3NlbGZCb3VuZHNWYWxpZCcuXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGFyZVNlbGZCb3VuZHNWYWxpZCgpOiBib29sZWFuIHtcclxuICAgIGlmICggdGhpcy5fYm91bmRzTWV0aG9kID09PSAnYWNjdXJhdGUnIHx8IHRoaXMuX2JvdW5kc01ldGhvZCA9PT0gJ3NhZmVQYWRkaW5nJyApIHtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggdGhpcy5fYm91bmRzTWV0aG9kID09PSAnbm9uZScgKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gIXRoaXMuaGFzU3Ryb2tlKCk7IC8vICd0aWdodFBhZGRpbmcnIGFuZCAndW5zdHJva2VkJyBvcHRpb25zXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIG91ciBzZWxmIGJvdW5kcyB3aGVuIG91ciByZW5kZXJlZCBzZWxmIGlzIHRyYW5zZm9ybWVkIGJ5IHRoZSBtYXRyaXguXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGdldFRyYW5zZm9ybWVkU2VsZkJvdW5kcyggbWF0cml4OiBNYXRyaXgzICk6IEJvdW5kczIge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5oYXNTaGFwZSgpICk7XHJcblxyXG4gICAgcmV0dXJuICggdGhpcy5fc3Ryb2tlID8gdGhpcy5nZXRTdHJva2VkU2hhcGUoKSA6IHRoaXMuZ2V0U2hhcGUoKSApIS5nZXRCb3VuZHNXaXRoVHJhbnNmb3JtKCBtYXRyaXggKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgb3VyIHNhZmUgc2VsZiBib3VuZHMgd2hlbiBvdXIgcmVuZGVyZWQgc2VsZiBpcyB0cmFuc2Zvcm1lZCBieSB0aGUgbWF0cml4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBnZXRUcmFuc2Zvcm1lZFNhZmVTZWxmQm91bmRzKCBtYXRyaXg6IE1hdHJpeDMgKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRUcmFuc2Zvcm1lZFNlbGZCb3VuZHMoIG1hdHJpeCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIGZyb20gKGFuZCBvdmVycmlkZGVuIGluKSB0aGUgUGFpbnRhYmxlIHRyYWl0LCBpbnZhbGlkYXRlcyBvdXIgY3VycmVudCBzdHJva2UsIHRyaWdnZXJpbmcgcmVjb21wdXRhdGlvbiBvZlxyXG4gICAqIGFueXRoaW5nIHRoYXQgZGVwZW5kZWQgb24gdGhlIG9sZCBzdHJva2UncyB2YWx1ZS4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGludmFsaWRhdGVTdHJva2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmludmFsaWRhdGVQYXRoKCk7XHJcblxyXG4gICAgdGhpcy5yZW5kZXJlclN1bW1hcnlSZWZyZXNoRW1pdHRlci5lbWl0KCk7IC8vIFN0cm9rZSBjaGFuZ2luZyBjb3VsZCBoYXZlIGNoYW5nZWQgb3VyIHNlbGYtYm91bmRzLXZhbGlkaXRpdHkgKHVuc3Ryb2tlZC9ldGMpXHJcblxyXG4gICAgc3VwZXIuaW52YWxpZGF0ZVN0cm9rZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoaXMgUGF0aCBoYXMgYW4gYXNzb2NpYXRlZCBTaGFwZSAoaW5zdGVhZCBvZiBubyBzaGFwZSwgcmVwcmVzZW50ZWQgYnkgbnVsbClcclxuICAgKi9cclxuICBwdWJsaWMgaGFzU2hhcGUoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gISF0aGlzLl9zaGFwZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERyYXdzIHRoZSBjdXJyZW50IE5vZGUncyBzZWxmIHJlcHJlc2VudGF0aW9uLCBhc3N1bWluZyB0aGUgd3JhcHBlcidzIENhbnZhcyBjb250ZXh0IGlzIGFscmVhZHkgaW4gdGhlIGxvY2FsXHJcbiAgICogY29vcmRpbmF0ZSBmcmFtZSBvZiB0aGlzIG5vZGUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gd3JhcHBlclxyXG4gICAqIEBwYXJhbSBtYXRyaXggLSBUaGUgdHJhbnNmb3JtYXRpb24gbWF0cml4IGFscmVhZHkgYXBwbGllZCB0byB0aGUgY29udGV4dC5cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgb3ZlcnJpZGUgY2FudmFzUGFpbnRTZWxmKCB3cmFwcGVyOiBDYW52YXNDb250ZXh0V3JhcHBlciwgbWF0cml4OiBNYXRyaXgzICk6IHZvaWQge1xyXG4gICAgLy9UT0RPOiBIYXZlIGEgc2VwYXJhdGUgbWV0aG9kIGZvciB0aGlzLCBpbnN0ZWFkIG9mIHRvdWNoaW5nIHRoZSBwcm90b3R5cGUuIENhbiBtYWtlICd0aGlzJyByZWZlcmVuY2VzIHRvbyBlYXNpbHkuIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICBQYXRoQ2FudmFzRHJhd2FibGUucHJvdG90eXBlLnBhaW50Q2FudmFzKCB3cmFwcGVyLCB0aGlzLCBtYXRyaXggKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBTVkcgZHJhd2FibGUgZm9yIHRoaXMgUGF0aC4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcmVuZGVyZXIgLSBJbiB0aGUgYml0bWFzayBmb3JtYXQgc3BlY2lmaWVkIGJ5IFJlbmRlcmVyLCB3aGljaCBtYXkgY29udGFpbiBhZGRpdGlvbmFsIGJpdCBmbGFncy5cclxuICAgKiBAcGFyYW0gaW5zdGFuY2UgLSBJbnN0YW5jZSBvYmplY3QgdGhhdCB3aWxsIGJlIGFzc29jaWF0ZWQgd2l0aCB0aGUgZHJhd2FibGVcclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgY3JlYXRlU1ZHRHJhd2FibGUoIHJlbmRlcmVyOiBudW1iZXIsIGluc3RhbmNlOiBJbnN0YW5jZSApOiBTVkdTZWxmRHJhd2FibGUge1xyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgcmV0dXJuIFBhdGhTVkdEcmF3YWJsZS5jcmVhdGVGcm9tUG9vbCggcmVuZGVyZXIsIGluc3RhbmNlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgQ2FudmFzIGRyYXdhYmxlIGZvciB0aGlzIFBhdGguIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHJlbmRlcmVyIC0gSW4gdGhlIGJpdG1hc2sgZm9ybWF0IHNwZWNpZmllZCBieSBSZW5kZXJlciwgd2hpY2ggbWF5IGNvbnRhaW4gYWRkaXRpb25hbCBiaXQgZmxhZ3MuXHJcbiAgICogQHBhcmFtIGluc3RhbmNlIC0gSW5zdGFuY2Ugb2JqZWN0IHRoYXQgd2lsbCBiZSBhc3NvY2lhdGVkIHdpdGggdGhlIGRyYXdhYmxlXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGNyZWF0ZUNhbnZhc0RyYXdhYmxlKCByZW5kZXJlcjogbnVtYmVyLCBpbnN0YW5jZTogSW5zdGFuY2UgKTogQ2FudmFzU2VsZkRyYXdhYmxlIHtcclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgIHJldHVybiBQYXRoQ2FudmFzRHJhd2FibGUuY3JlYXRlRnJvbVBvb2woIHJlbmRlcmVyLCBpbnN0YW5jZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV2hldGhlciB0aGlzIE5vZGUgaXRzZWxmIGlzIHBhaW50ZWQgKGRpc3BsYXlzIHNvbWV0aGluZyBpdHNlbGYpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBpc1BhaW50ZWQoKTogYm9vbGVhbiB7XHJcbiAgICAvLyBBbHdheXMgdHJ1ZSBmb3IgUGF0aCBub2Rlc1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb21wdXRlcyB3aGV0aGVyIHRoZSBwcm92aWRlZCBwb2ludCBpcyBcImluc2lkZVwiIChjb250YWluZWQpIGluIHRoaXMgUGF0aCdzIHNlbGYgY29udGVudCwgb3IgXCJvdXRzaWRlXCIuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcG9pbnQgLSBDb25zaWRlcmVkIHRvIGJlIGluIHRoZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGNvbnRhaW5zUG9pbnRTZWxmKCBwb2ludDogVmVjdG9yMiApOiBib29sZWFuIHtcclxuICAgIGxldCByZXN1bHQgPSBmYWxzZTtcclxuICAgIGlmICggIXRoaXMuaGFzU2hhcGUoKSApIHtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpZiB0aGlzIG5vZGUgaXMgZmlsbFBpY2thYmxlLCB3ZSB3aWxsIHJldHVybiB0cnVlIGlmIHRoZSBwb2ludCBpcyBpbnNpZGUgb3VyIGZpbGwgYXJlYVxyXG4gICAgaWYgKCB0aGlzLl9maWxsUGlja2FibGUgKSB7XHJcbiAgICAgIHJlc3VsdCA9IHRoaXMuZ2V0U2hhcGUoKSEuY29udGFpbnNQb2ludCggcG9pbnQgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBhbHNvIGluY2x1ZGUgdGhlIHN0cm9rZWQgcmVnaW9uIGluIHRoZSBoaXQgYXJlYSBpZiBzdHJva2VQaWNrYWJsZVxyXG4gICAgaWYgKCAhcmVzdWx0ICYmIHRoaXMuX3N0cm9rZVBpY2thYmxlICkge1xyXG4gICAgICByZXN1bHQgPSB0aGlzLmdldFN0cm9rZWRTaGFwZSgpLmNvbnRhaW5zUG9pbnQoIHBvaW50ICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIFNoYXBlIHRoYXQgcmVwcmVzZW50cyB0aGUgYXJlYSBjb3ZlcmVkIGJ5IGNvbnRhaW5zUG9pbnRTZWxmLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBnZXRTZWxmU2hhcGUoKTogU2hhcGUge1xyXG4gICAgcmV0dXJuIFNoYXBlLnVuaW9uKCBbXHJcbiAgICAgIC4uLiggKCB0aGlzLmhhc1NoYXBlKCkgJiYgdGhpcy5fZmlsbFBpY2thYmxlICkgPyBbIHRoaXMuZ2V0U2hhcGUoKSEgXSA6IFtdICksXHJcbiAgICAgIC4uLiggKCB0aGlzLmhhc1NoYXBlKCkgJiYgdGhpcy5fc3Ryb2tlUGlja2FibGUgKSA/IFsgdGhpcy5nZXRTdHJva2VkU2hhcGUoKSBdIDogW10gKVxyXG4gICAgXSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoaXMgUGF0aCdzIHNlbGZCb3VuZHMgaXMgaW50ZXJzZWN0ZWQgYnkgdGhlIHNwZWNpZmllZCBib3VuZHMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYm91bmRzIC0gQm91bmRzIHRvIHRlc3QsIGFzc3VtZWQgdG8gYmUgaW4gdGhlIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGludGVyc2VjdHNCb3VuZHNTZWxmKCBib3VuZHM6IEJvdW5kczIgKTogYm9vbGVhbiB7XHJcbiAgICAvLyBUT0RPOiBzaG91bGQgYSBzaGFwZSdzIHN0cm9rZSBiZSBpbmNsdWRlZD8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgIHJldHVybiB0aGlzLl9zaGFwZSA/IHRoaXMuX3NoYXBlLmludGVyc2VjdHNCb3VuZHMoIGJvdW5kcyApIDogZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHdoZXRoZXIgd2UgbmVlZCB0byBhcHBseSBhIHRyYW5zZm9ybSB3b3JrYXJvdW5kIGZvciBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTk2LCB3aGljaFxyXG4gICAqIG9ubHkgYXBwbGllcyB3aGVuIHdlIGhhdmUgYSBwYXR0ZXJuIG9yIGdyYWRpZW50IChlLmcuIHN1YnR5cGVzIG9mIFBhaW50KS5cclxuICAgKi9cclxuICBwcml2YXRlIHJlcXVpcmVzU1ZHQm91bmRzV29ya2Fyb3VuZCgpOiBib29sZWFuIHtcclxuICAgIGlmICggIXRoaXMuX3N0cm9rZSB8fCAhKCB0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBQYWludCApIHx8ICF0aGlzLmhhc1NoYXBlKCkgKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBib3VuZHMgPSB0aGlzLmNvbXB1dGVTaGFwZUJvdW5kcygpO1xyXG4gICAgcmV0dXJuICggYm91bmRzLndpZHRoICogYm91bmRzLmhlaWdodCApID09PSAwOyAvLyBhdCBsZWFzdCBvbmUgb2YgdGhlbSB3YXMgemVybywgc28gdGhlIGJvdW5kaW5nIGJveCBoYXMgbm8gYXJlYVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT3ZlcnJpZGUgZm9yIGV4dHJhIGluZm9ybWF0aW9uIGluIHRoZSBkZWJ1Z2dpbmcgb3V0cHV0IChmcm9tIERpc3BsYXkuZ2V0RGVidWdIVE1MKCkpLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgZ2V0RGVidWdIVE1MRXh0cmFzKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy5fc2hhcGUgPyBgICg8c3BhbiBzdHlsZT1cImNvbG9yOiAjODhmXCIgb25jbGljaz1cIndpbmRvdy5vcGVuKCAnZGF0YTp0ZXh0L3BsYWluO2NoYXJzZXQ9dXRmLTgsJyArIGVuY29kZVVSSUNvbXBvbmVudCggJyR7dGhpcy5fc2hhcGUuZ2V0U1ZHUGF0aCgpfScgKSApO1wiPnBhdGg8L3NwYW4+KWAgOiAnJztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERpc3Bvc2VzIHRoZSBwYXRoLCByZWxlYXNpbmcgc2hhcGUgbGlzdGVuZXJzIGlmIG5lZWRlZCAoYW5kIHByZXZlbnRpbmcgbmV3IGxpc3RlbmVycyBmcm9tIGJlaW5nIGFkZGVkKS5cclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy5faW52YWxpZFNoYXBlTGlzdGVuZXJBdHRhY2hlZCApIHtcclxuICAgICAgdGhpcy5kZXRhY2hTaGFwZUxpc3RlbmVyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fc2hhcGVQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcblxyXG4gICAgc3VwZXIuZGlzcG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG92ZXJyaWRlIG11dGF0ZSggb3B0aW9ucz86IFBhdGhPcHRpb25zICk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHN1cGVyLm11dGF0ZSggb3B0aW9ucyApO1xyXG4gIH1cclxuXHJcbiAgLy8gSW5pdGlhbCB2YWx1ZXMgZm9yIG1vc3QgTm9kZSBtdXRhdG9yIG9wdGlvbnNcclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfUEFUSF9PUFRJT05TID0gY29tYmluZU9wdGlvbnM8UGF0aE9wdGlvbnM+KCB7fSwgTm9kZS5ERUZBVUxUX05PREVfT1BUSU9OUywgREVGQVVMVF9PUFRJT05TICk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiB7QXJyYXkuPHN0cmluZz59IC0gU3RyaW5nIGtleXMgZm9yIGFsbCBvZiB0aGUgYWxsb3dlZCBvcHRpb25zIHRoYXQgd2lsbCBiZSBzZXQgYnkgbm9kZS5tdXRhdGUoIG9wdGlvbnMgKSwgaW4gdGhlXHJcbiAqIG9yZGVyIHRoZXkgd2lsbCBiZSBldmFsdWF0ZWQgaW4uXHJcbiAqXHJcbiAqIE5PVEU6IFNlZSBOb2RlJ3MgX211dGF0b3JLZXlzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24gb24gaG93IHRoaXMgb3BlcmF0ZXMsIGFuZCBwb3RlbnRpYWwgc3BlY2lhbFxyXG4gKiAgICAgICBjYXNlcyB0aGF0IG1heSBhcHBseS5cclxuICovXHJcblBhdGgucHJvdG90eXBlLl9tdXRhdG9yS2V5cyA9IFsgLi4uUEFJTlRBQkxFX09QVElPTl9LRVlTLCAuLi5QQVRIX09QVElPTl9LRVlTLCAuLi5Ob2RlLnByb3RvdHlwZS5fbXV0YXRvcktleXMgXTtcclxuXHJcbi8qKlxyXG4gKiB7QXJyYXkuPFN0cmluZz59IC0gTGlzdCBvZiBhbGwgZGlydHkgZmxhZ3MgdGhhdCBzaG91bGQgYmUgYXZhaWxhYmxlIG9uIGRyYXdhYmxlcyBjcmVhdGVkIGZyb20gdGhpcyBub2RlIChvclxyXG4gKiAgICAgICAgICAgICAgICAgICAgc3VidHlwZSkuIEdpdmVuIGEgZmxhZyAoZS5nLiByYWRpdXMpLCBpdCBpbmRpY2F0ZXMgdGhlIGV4aXN0ZW5jZSBvZiBhIGZ1bmN0aW9uXHJcbiAqICAgICAgICAgICAgICAgICAgICBkcmF3YWJsZS5tYXJrRGlydHlSYWRpdXMoKSB0aGF0IHdpbGwgaW5kaWNhdGUgdG8gdGhlIGRyYXdhYmxlIHRoYXQgdGhlIHJhZGl1cyBoYXMgY2hhbmdlZC5cclxuICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAqIEBvdmVycmlkZVxyXG4gKi9cclxuUGF0aC5wcm90b3R5cGUuZHJhd2FibGVNYXJrRmxhZ3MgPSBbIC4uLk5vZGUucHJvdG90eXBlLmRyYXdhYmxlTWFya0ZsYWdzLCAuLi5QQUlOVEFCTEVfRFJBV0FCTEVfTUFSS19GTEFHUywgJ3NoYXBlJyBdO1xyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ1BhdGgnLCBQYXRoICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLE9BQU8sTUFBTSw0QkFBNEI7QUFDaEQsU0FBU0MsS0FBSyxRQUFRLDZCQUE2QjtBQUduRCxTQUE2REMsSUFBSSxFQUFlQyxLQUFLLEVBQUVDLFNBQVMsRUFBRUMsNkJBQTZCLEVBQUVDLHFCQUFxQixFQUFv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