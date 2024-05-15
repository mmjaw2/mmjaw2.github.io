// Copyright 2021-2024, University of Colorado Boulder

/**
 * Trait for Nodes that support a standard fill and/or stroke (e.g. Text, Path and Path subtypes).
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { LINE_STYLE_DEFAULT_OPTIONS, LineStyles } from '../../../kite/js/imports.js';
import arrayRemove from '../../../phet-core/js/arrayRemove.js';
import assertHasProperties from '../../../phet-core/js/assertHasProperties.js';
import inheritance from '../../../phet-core/js/inheritance.js';
import platform from '../../../phet-core/js/platform.js';
import memoize from '../../../phet-core/js/memoize.js';
import { Color, Gradient, Node, Paint, PaintDef, Pattern, Renderer, scenery } from '../imports.js';
import { isTReadOnlyProperty } from '../../../axon/js/TReadOnlyProperty.js';
const isSafari5 = platform.safari5;
const PAINTABLE_OPTION_KEYS = ['fill',
// {PaintDef} - Sets the fill of this Node, see setFill() for documentation.
'fillPickable',
// {boolean} - Sets whether the filled area of the Node will be treated as 'inside'. See setFillPickable()
'stroke',
// {PaintDef} - Sets the stroke of this Node, see setStroke() for documentation.
'strokePickable',
// {boolean} - Sets whether the stroked area of the Node will be treated as 'inside'. See setStrokePickable()
'lineWidth',
// {number} - Sets the width of the stroked area, see setLineWidth for documentation.
'lineCap',
// {string} - Sets the shape of the stroked area at the start/end of the path, see setLineCap() for documentation.
'lineJoin',
// {string} - Sets the shape of the stroked area at joints, see setLineJoin() for documentation.
'miterLimit',
// {number} - Sets when lineJoin will switch from miter to bevel, see setMiterLimit() for documentation.
'lineDash',
// {Array.<number>} - Sets a line-dash pattern for the stroke, see setLineDash() for documentation
'lineDashOffset',
// {number} - Sets the offset of the line-dash from the start of the stroke, see setLineDashOffset()
'cachedPaints' // {Array.<PaintDef>} - Sets which paints should be cached, even if not displayed. See setCachedPaints()
];
const DEFAULT_OPTIONS = {
  fill: null,
  fillPickable: true,
  stroke: null,
  strokePickable: false,
  // Not set initially, but they are the LineStyles defaults
  lineWidth: LINE_STYLE_DEFAULT_OPTIONS.lineWidth,
  lineCap: LINE_STYLE_DEFAULT_OPTIONS.lineCap,
  lineJoin: LINE_STYLE_DEFAULT_OPTIONS.lineJoin,
  lineDashOffset: LINE_STYLE_DEFAULT_OPTIONS.lineDashOffset,
  miterLimit: LINE_STYLE_DEFAULT_OPTIONS.miterLimit
};

// Workaround type since we can't detect mixins in the type system well

const PAINTABLE_DRAWABLE_MARK_FLAGS = ['fill', 'stroke', 'lineWidth', 'lineOptions', 'cachedPaints'];

// Normally our project prefers type aliases to interfaces, but interfaces are necessary for correct usage of "this", see https://github.com/phetsims/tasks/issues/1132
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions

const Paintable = memoize(Type => {
  assert && assert(_.includes(inheritance(Type), Node), 'Only Node subtypes should mix Paintable');
  return class PaintableMixin extends Type {
    // (scenery-internal)

    // (scenery-internal)

    // (scenery-internal)

    constructor(...args) {
      super(...args);
      assertHasProperties(this, ['_drawables']);
      this._fill = DEFAULT_OPTIONS.fill;
      this._fillPickable = DEFAULT_OPTIONS.fillPickable;
      this._stroke = DEFAULT_OPTIONS.stroke;
      this._strokePickable = DEFAULT_OPTIONS.strokePickable;
      this._cachedPaints = [];
      this._lineDrawingStyles = new LineStyles();
    }

    /**
     * Sets the fill color for the Node.
     *
     * The fill determines the appearance of the interior part of a Path or Text.
     *
     * Please use null for indicating "no fill" (that is the default). Strings and Scenery Color objects can be
     * provided for a single-color flat appearance, and can be wrapped with an Axon Property. Gradients and patterns
     * can also be provided.
     */
    setFill(fill) {
      assert && assert(PaintDef.isPaintDef(fill), 'Invalid fill type');
      if (assert && typeof fill === 'string') {
        Color.checkPaintString(fill);
      }

      // Instance equality used here since it would be more expensive to parse all CSS
      // colors and compare every time the fill changes. Right now, usually we don't have
      // to parse CSS colors. See https://github.com/phetsims/scenery/issues/255
      if (this._fill !== fill) {
        this._fill = fill;
        this.invalidateFill();
      }
      return this;
    }
    set fill(value) {
      this.setFill(value);
    }
    get fill() {
      return this.getFill();
    }

    /**
     * Returns the fill (if any) for this Node.
     */
    getFill() {
      return this._fill;
    }

    /**
     * Returns whether there is a fill applied to this Node.
     */
    hasFill() {
      return this.getFillValue() !== null;
    }

    /**
     * Returns a property-unwrapped fill if applicable.
     */
    getFillValue() {
      const fill = this.getFill();
      return isTReadOnlyProperty(fill) ? fill.get() : fill;
    }
    get fillValue() {
      return this.getFillValue();
    }

    /**
     * Sets the stroke color for the Node.
     *
     * The stroke determines the appearance of the region along the boundary of the Path or Text. The shape of the
     * stroked area depends on the base shape (that of the Path or Text) and multiple parameters:
     * lineWidth/lineCap/lineJoin/miterLimit/lineDash/lineDashOffset. It will be drawn on top of any fill on the
     * same Node.
     *
     * Please use null for indicating "no stroke" (that is the default). Strings and Scenery Color objects can be
     * provided for a single-color flat appearance, and can be wrapped with an Axon Property. Gradients and patterns
     * can also be provided.
     */
    setStroke(stroke) {
      assert && assert(PaintDef.isPaintDef(stroke), 'Invalid stroke type');
      if (assert && typeof stroke === 'string') {
        Color.checkPaintString(stroke);
      }

      // Instance equality used here since it would be more expensive to parse all CSS
      // colors and compare every time the fill changes. Right now, usually we don't have
      // to parse CSS colors. See https://github.com/phetsims/scenery/issues/255
      if (this._stroke !== stroke) {
        this._stroke = stroke;
        if (assert && stroke instanceof Paint && stroke.transformMatrix) {
          const scaleVector = stroke.transformMatrix.getScaleVector();
          assert(Math.abs(scaleVector.x - scaleVector.y) < 1e-7, 'You cannot specify a pattern or gradient to a stroke that does not have a symmetric scale.');
        }
        this.invalidateStroke();
      }
      return this;
    }
    set stroke(value) {
      this.setStroke(value);
    }
    get stroke() {
      return this.getStroke();
    }

    /**
     * Returns the stroke (if any) for this Node.
     */
    getStroke() {
      return this._stroke;
    }

    /**
     * Returns whether there is a stroke applied to this Node.
     */
    hasStroke() {
      return this.getStrokeValue() !== null;
    }

    /**
     * Returns whether there will appear to be a stroke for this Node. Properly handles the lineWidth:0 case.
     */
    hasPaintableStroke() {
      // Should not be stroked if the lineWidth is 0, see https://github.com/phetsims/scenery/issues/658
      // and https://github.com/phetsims/scenery/issues/523
      return this.hasStroke() && this.getLineWidth() > 0;
    }

    /**
     * Returns a property-unwrapped stroke if applicable.
     */
    getStrokeValue() {
      const stroke = this.getStroke();
      return isTReadOnlyProperty(stroke) ? stroke.get() : stroke;
    }
    get strokeValue() {
      return this.getStrokeValue();
    }

    /**
     * Sets whether the fill is marked as pickable.
     */
    setFillPickable(pickable) {
      if (this._fillPickable !== pickable) {
        this._fillPickable = pickable;

        // TODO: better way of indicating that only the Node under pointers could have changed, but no paint change is needed? https://github.com/phetsims/scenery/issues/1581
        this.invalidateFill();
      }
      return this;
    }
    set fillPickable(value) {
      this.setFillPickable(value);
    }
    get fillPickable() {
      return this.isFillPickable();
    }

    /**
     * Returns whether the fill is marked as pickable.
     */
    isFillPickable() {
      return this._fillPickable;
    }

    /**
     * Sets whether the stroke is marked as pickable.
     */
    setStrokePickable(pickable) {
      if (this._strokePickable !== pickable) {
        this._strokePickable = pickable;

        // TODO: better way of indicating that only the Node under pointers could have changed, but no paint change is needed? https://github.com/phetsims/scenery/issues/1581
        this.invalidateStroke();
      }
      return this;
    }
    set strokePickable(value) {
      this.setStrokePickable(value);
    }
    get strokePickable() {
      return this.isStrokePickable();
    }

    /**
     * Returns whether the stroke is marked as pickable.
     */
    isStrokePickable() {
      return this._strokePickable;
    }

    /**
     * Sets the line width that will be applied to strokes on this Node.
     */
    setLineWidth(lineWidth) {
      assert && assert(lineWidth >= 0, `lineWidth should be non-negative instead of ${lineWidth}`);
      if (this.getLineWidth() !== lineWidth) {
        this._lineDrawingStyles.lineWidth = lineWidth;
        this.invalidateStroke();
        const stateLen = this._drawables.length;
        for (let i = 0; i < stateLen; i++) {
          this._drawables[i].markDirtyLineWidth();
        }
      }
      return this;
    }
    set lineWidth(value) {
      this.setLineWidth(value);
    }
    get lineWidth() {
      return this.getLineWidth();
    }

    /**
     * Returns the line width that would be applied to strokes.
     */
    getLineWidth() {
      return this._lineDrawingStyles.lineWidth;
    }

    /**
     * Sets the line cap style. There are three options:
     * - 'butt' (the default) stops the line at the end point
     * - 'round' draws a semicircular arc around the end point
     * - 'square' draws a square outline around the end point (like butt, but extended by 1/2 line width out)
     */
    setLineCap(lineCap) {
      assert && assert(lineCap === 'butt' || lineCap === 'round' || lineCap === 'square', `lineCap should be one of "butt", "round" or "square", not ${lineCap}`);
      if (this._lineDrawingStyles.lineCap !== lineCap) {
        this._lineDrawingStyles.lineCap = lineCap;
        this.invalidateStroke();
        const stateLen = this._drawables.length;
        for (let i = 0; i < stateLen; i++) {
          this._drawables[i].markDirtyLineOptions();
        }
      }
      return this;
    }
    set lineCap(value) {
      this.setLineCap(value);
    }
    get lineCap() {
      return this.getLineCap();
    }

    /**
     * Returns the line cap style (controls appearance at the start/end of paths)
     */
    getLineCap() {
      return this._lineDrawingStyles.lineCap;
    }

    /**
     * Sets the line join style. There are three options:
     * - 'miter' (default) joins by extending the segments out in a line until they meet. For very sharp
     *           corners, they will be chopped off and will act like 'bevel', depending on what the miterLimit is.
     * - 'round' draws a circular arc to connect the two stroked areas.
     * - 'bevel' connects with a single line segment.
     */
    setLineJoin(lineJoin) {
      assert && assert(lineJoin === 'miter' || lineJoin === 'round' || lineJoin === 'bevel', `lineJoin should be one of "miter", "round" or "bevel", not ${lineJoin}`);
      if (this._lineDrawingStyles.lineJoin !== lineJoin) {
        this._lineDrawingStyles.lineJoin = lineJoin;
        this.invalidateStroke();
        const stateLen = this._drawables.length;
        for (let i = 0; i < stateLen; i++) {
          this._drawables[i].markDirtyLineOptions();
        }
      }
      return this;
    }
    set lineJoin(value) {
      this.setLineJoin(value);
    }
    get lineJoin() {
      return this.getLineJoin();
    }

    /**
     * Returns the current line join style (controls join appearance between drawn segments).
     */
    getLineJoin() {
      return this._lineDrawingStyles.lineJoin;
    }

    /**
     * Sets the miterLimit value. This determines how sharp a corner with lineJoin: 'miter' will need to be before
     * it gets cut off to the 'bevel' behavior.
     */
    setMiterLimit(miterLimit) {
      assert && assert(isFinite(miterLimit), 'miterLimit should be a finite number');
      if (this._lineDrawingStyles.miterLimit !== miterLimit) {
        this._lineDrawingStyles.miterLimit = miterLimit;
        this.invalidateStroke();
        const stateLen = this._drawables.length;
        for (let i = 0; i < stateLen; i++) {
          this._drawables[i].markDirtyLineOptions();
        }
      }
      return this;
    }
    set miterLimit(value) {
      this.setMiterLimit(value);
    }
    get miterLimit() {
      return this.getMiterLimit();
    }

    /**
     * Returns the miterLimit value.
     */
    getMiterLimit() {
      return this._lineDrawingStyles.miterLimit;
    }

    /**
     * Sets the line dash pattern. Should be an array of numbers "on" and "off" alternating. An empty array
     * indicates no dashing.
     */
    setLineDash(lineDash) {
      assert && assert(Array.isArray(lineDash) && lineDash.every(n => typeof n === 'number' && isFinite(n) && n >= 0), 'lineDash should be an array of finite non-negative numbers');
      if (this._lineDrawingStyles.lineDash !== lineDash) {
        this._lineDrawingStyles.lineDash = lineDash || [];
        this.invalidateStroke();
        const stateLen = this._drawables.length;
        for (let i = 0; i < stateLen; i++) {
          this._drawables[i].markDirtyLineOptions();
        }
      }
      return this;
    }
    set lineDash(value) {
      this.setLineDash(value);
    }
    get lineDash() {
      return this.getLineDash();
    }

    /**
     * Gets the line dash pattern. An empty array is the default, indicating no dashing.
     */
    getLineDash() {
      return this._lineDrawingStyles.lineDash;
    }

    /**
     * Returns whether the stroke will be dashed.
     */
    hasLineDash() {
      return !!this._lineDrawingStyles.lineDash.length;
    }

    /**
     * Sets the offset of the line dash pattern from the start of the stroke. Defaults to 0.
     */
    setLineDashOffset(lineDashOffset) {
      assert && assert(isFinite(lineDashOffset), `lineDashOffset should be a number, not ${lineDashOffset}`);
      if (this._lineDrawingStyles.lineDashOffset !== lineDashOffset) {
        this._lineDrawingStyles.lineDashOffset = lineDashOffset;
        this.invalidateStroke();
        const stateLen = this._drawables.length;
        for (let i = 0; i < stateLen; i++) {
          this._drawables[i].markDirtyLineOptions();
        }
      }
      return this;
    }
    set lineDashOffset(value) {
      this.setLineDashOffset(value);
    }
    get lineDashOffset() {
      return this.getLineDashOffset();
    }

    /**
     * Returns the offset of the line dash pattern from the start of the stroke.
     */
    getLineDashOffset() {
      return this._lineDrawingStyles.lineDashOffset;
    }

    /**
     * Sets the LineStyles object (it determines stroke appearance). The passed-in object will be mutated as needed.
     */
    setLineStyles(lineStyles) {
      this._lineDrawingStyles = lineStyles;
      this.invalidateStroke();
      return this;
    }
    set lineStyles(value) {
      this.setLineStyles(value);
    }
    get lineStyles() {
      return this.getLineStyles();
    }

    /**
     * Returns the composite {LineStyles} object, that determines stroke appearance.
     */
    getLineStyles() {
      return this._lineDrawingStyles;
    }

    /**
     * Sets the cached paints to the input array (a defensive copy). Note that it also filters out fills that are
     * not considered paints (e.g. strings, Colors, etc.).
     *
     * When this Node is displayed in SVG, it will force the presence of the cached paint to be stored in the SVG's
     * <defs> element, so that we can switch quickly to use the given paint (instead of having to create it on the
     * SVG-side whenever the switch is made).
     *
     * Also note that duplicate paints are acceptable, and don't need to be filtered out before-hand.
     */
    setCachedPaints(paints) {
      this._cachedPaints = paints.filter(paint => paint instanceof Paint);
      const stateLen = this._drawables.length;
      for (let i = 0; i < stateLen; i++) {
        this._drawables[i].markDirtyCachedPaints();
      }
      return this;
    }
    set cachedPaints(value) {
      this.setCachedPaints(value);
    }
    get cachedPaints() {
      return this.getCachedPaints();
    }

    /**
     * Returns the cached paints.
     */
    getCachedPaints() {
      return this._cachedPaints;
    }

    /**
     * Adds a cached paint. Does nothing if paint is just a normal fill (string, Color), but for gradients and
     * patterns, it will be made faster to switch to.
     *
     * When this Node is displayed in SVG, it will force the presence of the cached paint to be stored in the SVG's
     * <defs> element, so that we can switch quickly to use the given paint (instead of having to create it on the
     * SVG-side whenever the switch is made).
     *
     * Also note that duplicate paints are acceptable, and don't need to be filtered out before-hand.
     */
    addCachedPaint(paint) {
      if (paint instanceof Paint) {
        this._cachedPaints.push(paint);
        const stateLen = this._drawables.length;
        for (let i = 0; i < stateLen; i++) {
          this._drawables[i].markDirtyCachedPaints();
        }
      }
    }

    /**
     * Removes a cached paint. Does nothing if paint is just a normal fill (string, Color), but for gradients and
     * patterns it will remove any existing cached paint. If it was added more than once, it will need to be removed
     * more than once.
     *
     * When this Node is displayed in SVG, it will force the presence of the cached paint to be stored in the SVG's
     * <defs> element, so that we can switch quickly to use the given paint (instead of having to create it on the
     * SVG-side whenever the switch is made).
     */
    removeCachedPaint(paint) {
      if (paint instanceof Paint) {
        assert && assert(_.includes(this._cachedPaints, paint));
        arrayRemove(this._cachedPaints, paint);
        const stateLen = this._drawables.length;
        for (let i = 0; i < stateLen; i++) {
          this._drawables[i].markDirtyCachedPaints();
        }
      }
    }

    /**
     * Applies the fill to a Canvas context wrapper, before filling. (scenery-internal)
     */
    beforeCanvasFill(wrapper) {
      assert && assert(this.getFillValue() !== null);
      const fillValue = this.getFillValue();
      wrapper.setFillStyle(fillValue);
      // @ts-expect-error - For performance, we could check this by ruling out string and 'transformMatrix' in fillValue
      if (fillValue.transformMatrix) {
        wrapper.context.save();
        // @ts-expect-error
        fillValue.transformMatrix.canvasAppendTransform(wrapper.context);
      }
    }

    /**
     * Un-applies the fill to a Canvas context wrapper, after filling. (scenery-internal)
     */
    afterCanvasFill(wrapper) {
      const fillValue = this.getFillValue();

      // @ts-expect-error
      if (fillValue.transformMatrix) {
        wrapper.context.restore();
      }
    }

    /**
     * Applies the stroke to a Canvas context wrapper, before stroking. (scenery-internal)
     */
    beforeCanvasStroke(wrapper) {
      const strokeValue = this.getStrokeValue();

      // TODO: is there a better way of not calling so many things on each stroke? https://github.com/phetsims/scenery/issues/1581
      wrapper.setStrokeStyle(this._stroke);
      wrapper.setLineCap(this.getLineCap());
      wrapper.setLineJoin(this.getLineJoin());

      // @ts-expect-error - for performance
      if (strokeValue.transformMatrix) {
        // @ts-expect-error
        const scaleVector = strokeValue.transformMatrix.getScaleVector();
        assert && assert(Math.abs(scaleVector.x - scaleVector.y) < 1e-7, 'You cannot specify a pattern or gradient to a stroke that does not have a symmetric scale.');
        const matrixMultiplier = 1 / scaleVector.x;
        wrapper.context.save();
        // @ts-expect-error
        strokeValue.transformMatrix.canvasAppendTransform(wrapper.context);
        wrapper.setLineWidth(this.getLineWidth() * matrixMultiplier);
        wrapper.setMiterLimit(this.getMiterLimit() * matrixMultiplier);
        wrapper.setLineDash(this.getLineDash().map(dash => dash * matrixMultiplier));
        wrapper.setLineDashOffset(this.getLineDashOffset() * matrixMultiplier);
      } else {
        wrapper.setLineWidth(this.getLineWidth());
        wrapper.setMiterLimit(this.getMiterLimit());
        wrapper.setLineDash(this.getLineDash());
        wrapper.setLineDashOffset(this.getLineDashOffset());
      }
    }

    /**
     * Un-applies the stroke to a Canvas context wrapper, after stroking. (scenery-internal)
     */
    afterCanvasStroke(wrapper) {
      const strokeValue = this.getStrokeValue();

      // @ts-expect-error - for performance
      if (strokeValue.transformMatrix) {
        wrapper.context.restore();
      }
    }

    /**
     * If applicable, returns the CSS color for the fill.
     */
    getCSSFill() {
      const fillValue = this.getFillValue();
      // if it's a Color object, get the corresponding CSS
      // 'transparent' will make us invisible if the fill is null
      // @ts-expect-error - toCSS checks for color, left for performance
      return fillValue ? fillValue.toCSS ? fillValue.toCSS() : fillValue : 'transparent';
    }

    /**
     * If applicable, returns the CSS color for the stroke.
     */
    getSimpleCSSStroke() {
      const strokeValue = this.getStrokeValue();
      // if it's a Color object, get the corresponding CSS
      // 'transparent' will make us invisible if the fill is null
      // @ts-expect-error - toCSS checks for color, left for performance
      return strokeValue ? strokeValue.toCSS ? strokeValue.toCSS() : strokeValue : 'transparent';
    }

    /**
     * Returns the fill-specific property string for use with toString(). (scenery-internal)
     *
     * @param spaces - Whitespace to add
     * @param result
     */
    appendFillablePropString(spaces, result) {
      if (this._fill) {
        if (result) {
          result += ',\n';
        }
        if (typeof this.getFillValue() === 'string') {
          result += `${spaces}fill: '${this.getFillValue()}'`;
        } else {
          result += `${spaces}fill: ${this.getFillValue()}`;
        }
      }
      return result;
    }

    /**
     * Returns the stroke-specific property string for use with toString(). (scenery-internal)
     *
     * @param spaces - Whitespace to add
     * @param result
     */
    appendStrokablePropString(spaces, result) {
      function addProp(key, value, nowrap) {
        if (result) {
          result += ',\n';
        }
        if (!nowrap && typeof value === 'string') {
          result += `${spaces + key}: '${value}'`;
        } else {
          result += `${spaces + key}: ${value}`;
        }
      }
      if (this._stroke) {
        const defaultStyles = new LineStyles();
        const strokeValue = this.getStrokeValue();
        if (typeof strokeValue === 'string') {
          addProp('stroke', strokeValue);
        } else {
          addProp('stroke', strokeValue ? strokeValue.toString() : 'null', true);
        }
        _.each(['lineWidth', 'lineCap', 'miterLimit', 'lineJoin', 'lineDashOffset'], prop => {
          // @ts-expect-error
          if (this[prop] !== defaultStyles[prop]) {
            // @ts-expect-error
            addProp(prop, this[prop]);
          }
        });
        if (this.lineDash.length) {
          addProp('lineDash', JSON.stringify(this.lineDash), true);
        }
      }
      return result;
    }

    /**
     * Determines the default allowed renderers (returned via the Renderer bitmask) that are allowed, given the
     * current fill options. (scenery-internal)
     *
     * This will be used for all types that directly mix in Paintable (i.e. Path and Text), but may be overridden
     * by subtypes.
     *
     * @returns - Renderer bitmask, see Renderer for details
     */
    getFillRendererBitmask() {
      let bitmask = 0;

      // Safari 5 has buggy issues with SVG gradients
      if (!(isSafari5 && this._fill instanceof Gradient)) {
        bitmask |= Renderer.bitmaskSVG;
      }

      // we always have Canvas support?
      bitmask |= Renderer.bitmaskCanvas;
      if (!this.hasFill()) {
        // if there is no fill, it is supported by DOM and WebGL
        bitmask |= Renderer.bitmaskDOM;
        bitmask |= Renderer.bitmaskWebGL;
      } else if (this._fill instanceof Pattern) {
        // no pattern support for DOM or WebGL (for now!)
      } else if (this._fill instanceof Gradient) {
        // no gradient support for DOM or WebGL (for now!)
      } else {
        // solid fills always supported for DOM and WebGL
        bitmask |= Renderer.bitmaskDOM;
        bitmask |= Renderer.bitmaskWebGL;
      }
      return bitmask;
    }

    /**
     * Determines the default allowed renderers (returned via the Renderer bitmask) that are allowed, given the
     * current stroke options. (scenery-internal)
     *
     * This will be used for all types that directly mix in Paintable (i.e. Path and Text), but may be overridden
     * by subtypes.
     *
     * @returns - Renderer bitmask, see Renderer for details
     */
    getStrokeRendererBitmask() {
      let bitmask = 0;
      bitmask |= Renderer.bitmaskCanvas;

      // always have SVG support (for now?)
      bitmask |= Renderer.bitmaskSVG;
      if (!this.hasStroke()) {
        // allow DOM support if there is no stroke (since the fill will determine what is available)
        bitmask |= Renderer.bitmaskDOM;
        bitmask |= Renderer.bitmaskWebGL;
      }
      return bitmask;
    }

    /**
     * Invalidates our current fill, triggering recomputation of anything that depended on the old fill's value
     */
    invalidateFill() {
      this.invalidateSupportedRenderers();
      const stateLen = this._drawables.length;
      for (let i = 0; i < stateLen; i++) {
        this._drawables[i].markDirtyFill();
      }
    }

    /**
     * Invalidates our current stroke, triggering recomputation of anything that depended on the old stroke's value
     */
    invalidateStroke() {
      this.invalidateSupportedRenderers();
      const stateLen = this._drawables.length;
      for (let i = 0; i < stateLen; i++) {
        this._drawables[i].markDirtyStroke();
      }
    }
  };
});
scenery.register('Paintable', Paintable);

// @ts-expect-error
Paintable.DEFAULT_OPTIONS = DEFAULT_OPTIONS;
export { Paintable as default, PAINTABLE_DRAWABLE_MARK_FLAGS, PAINTABLE_OPTION_KEYS, DEFAULT_OPTIONS, DEFAULT_OPTIONS as PAINTABLE_DEFAULT_OPTIONS };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJMSU5FX1NUWUxFX0RFRkFVTFRfT1BUSU9OUyIsIkxpbmVTdHlsZXMiLCJhcnJheVJlbW92ZSIsImFzc2VydEhhc1Byb3BlcnRpZXMiLCJpbmhlcml0YW5jZSIsInBsYXRmb3JtIiwibWVtb2l6ZSIsIkNvbG9yIiwiR3JhZGllbnQiLCJOb2RlIiwiUGFpbnQiLCJQYWludERlZiIsIlBhdHRlcm4iLCJSZW5kZXJlciIsInNjZW5lcnkiLCJpc1RSZWFkT25seVByb3BlcnR5IiwiaXNTYWZhcmk1Iiwic2FmYXJpNSIsIlBBSU5UQUJMRV9PUFRJT05fS0VZUyIsIkRFRkFVTFRfT1BUSU9OUyIsImZpbGwiLCJmaWxsUGlja2FibGUiLCJzdHJva2UiLCJzdHJva2VQaWNrYWJsZSIsImxpbmVXaWR0aCIsImxpbmVDYXAiLCJsaW5lSm9pbiIsImxpbmVEYXNoT2Zmc2V0IiwibWl0ZXJMaW1pdCIsIlBBSU5UQUJMRV9EUkFXQUJMRV9NQVJLX0ZMQUdTIiwiUGFpbnRhYmxlIiwiVHlwZSIsImFzc2VydCIsIl8iLCJpbmNsdWRlcyIsIlBhaW50YWJsZU1peGluIiwiY29uc3RydWN0b3IiLCJhcmdzIiwiX2ZpbGwiLCJfZmlsbFBpY2thYmxlIiwiX3N0cm9rZSIsIl9zdHJva2VQaWNrYWJsZSIsIl9jYWNoZWRQYWludHMiLCJfbGluZURyYXdpbmdTdHlsZXMiLCJzZXRGaWxsIiwiaXNQYWludERlZiIsImNoZWNrUGFpbnRTdHJpbmciLCJpbnZhbGlkYXRlRmlsbCIsInZhbHVlIiwiZ2V0RmlsbCIsImhhc0ZpbGwiLCJnZXRGaWxsVmFsdWUiLCJnZXQiLCJmaWxsVmFsdWUiLCJzZXRTdHJva2UiLCJ0cmFuc2Zvcm1NYXRyaXgiLCJzY2FsZVZlY3RvciIsImdldFNjYWxlVmVjdG9yIiwiTWF0aCIsImFicyIsIngiLCJ5IiwiaW52YWxpZGF0ZVN0cm9rZSIsImdldFN0cm9rZSIsImhhc1N0cm9rZSIsImdldFN0cm9rZVZhbHVlIiwiaGFzUGFpbnRhYmxlU3Ryb2tlIiwiZ2V0TGluZVdpZHRoIiwic3Ryb2tlVmFsdWUiLCJzZXRGaWxsUGlja2FibGUiLCJwaWNrYWJsZSIsImlzRmlsbFBpY2thYmxlIiwic2V0U3Ryb2tlUGlja2FibGUiLCJpc1N0cm9rZVBpY2thYmxlIiwic2V0TGluZVdpZHRoIiwic3RhdGVMZW4iLCJfZHJhd2FibGVzIiwibGVuZ3RoIiwiaSIsIm1hcmtEaXJ0eUxpbmVXaWR0aCIsInNldExpbmVDYXAiLCJtYXJrRGlydHlMaW5lT3B0aW9ucyIsImdldExpbmVDYXAiLCJzZXRMaW5lSm9pbiIsImdldExpbmVKb2luIiwic2V0TWl0ZXJMaW1pdCIsImlzRmluaXRlIiwiZ2V0TWl0ZXJMaW1pdCIsInNldExpbmVEYXNoIiwibGluZURhc2giLCJBcnJheSIsImlzQXJyYXkiLCJldmVyeSIsIm4iLCJnZXRMaW5lRGFzaCIsImhhc0xpbmVEYXNoIiwic2V0TGluZURhc2hPZmZzZXQiLCJnZXRMaW5lRGFzaE9mZnNldCIsInNldExpbmVTdHlsZXMiLCJsaW5lU3R5bGVzIiwiZ2V0TGluZVN0eWxlcyIsInNldENhY2hlZFBhaW50cyIsInBhaW50cyIsImZpbHRlciIsInBhaW50IiwibWFya0RpcnR5Q2FjaGVkUGFpbnRzIiwiY2FjaGVkUGFpbnRzIiwiZ2V0Q2FjaGVkUGFpbnRzIiwiYWRkQ2FjaGVkUGFpbnQiLCJwdXNoIiwicmVtb3ZlQ2FjaGVkUGFpbnQiLCJiZWZvcmVDYW52YXNGaWxsIiwid3JhcHBlciIsInNldEZpbGxTdHlsZSIsImNvbnRleHQiLCJzYXZlIiwiY2FudmFzQXBwZW5kVHJhbnNmb3JtIiwiYWZ0ZXJDYW52YXNGaWxsIiwicmVzdG9yZSIsImJlZm9yZUNhbnZhc1N0cm9rZSIsInNldFN0cm9rZVN0eWxlIiwibWF0cml4TXVsdGlwbGllciIsIm1hcCIsImRhc2giLCJhZnRlckNhbnZhc1N0cm9rZSIsImdldENTU0ZpbGwiLCJ0b0NTUyIsImdldFNpbXBsZUNTU1N0cm9rZSIsImFwcGVuZEZpbGxhYmxlUHJvcFN0cmluZyIsInNwYWNlcyIsInJlc3VsdCIsImFwcGVuZFN0cm9rYWJsZVByb3BTdHJpbmciLCJhZGRQcm9wIiwia2V5Iiwibm93cmFwIiwiZGVmYXVsdFN0eWxlcyIsInRvU3RyaW5nIiwiZWFjaCIsInByb3AiLCJKU09OIiwic3RyaW5naWZ5IiwiZ2V0RmlsbFJlbmRlcmVyQml0bWFzayIsImJpdG1hc2siLCJiaXRtYXNrU1ZHIiwiYml0bWFza0NhbnZhcyIsImJpdG1hc2tET00iLCJiaXRtYXNrV2ViR0wiLCJnZXRTdHJva2VSZW5kZXJlckJpdG1hc2siLCJpbnZhbGlkYXRlU3VwcG9ydGVkUmVuZGVyZXJzIiwibWFya0RpcnR5RmlsbCIsIm1hcmtEaXJ0eVN0cm9rZSIsInJlZ2lzdGVyIiwiZGVmYXVsdCIsIlBBSU5UQUJMRV9ERUZBVUxUX09QVElPTlMiXSwic291cmNlcyI6WyJQYWludGFibGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVHJhaXQgZm9yIE5vZGVzIHRoYXQgc3VwcG9ydCBhIHN0YW5kYXJkIGZpbGwgYW5kL29yIHN0cm9rZSAoZS5nLiBUZXh0LCBQYXRoIGFuZCBQYXRoIHN1YnR5cGVzKS5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCB7IExJTkVfU1RZTEVfREVGQVVMVF9PUFRJT05TLCBMaW5lQ2FwLCBMaW5lSm9pbiwgTGluZVN0eWxlcyB9IGZyb20gJy4uLy4uLy4uL2tpdGUvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBhcnJheVJlbW92ZSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvYXJyYXlSZW1vdmUuanMnO1xyXG5pbXBvcnQgYXNzZXJ0SGFzUHJvcGVydGllcyBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvYXNzZXJ0SGFzUHJvcGVydGllcy5qcyc7XHJcbmltcG9ydCBpbmhlcml0YW5jZSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvaW5oZXJpdGFuY2UuanMnO1xyXG5pbXBvcnQgcGxhdGZvcm0gZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL3BsYXRmb3JtLmpzJztcclxuaW1wb3J0IG1lbW9pemUgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL21lbW9pemUuanMnO1xyXG5pbXBvcnQgeyBDYW52YXNDb250ZXh0V3JhcHBlciwgQ29sb3IsIEdyYWRpZW50LCBMaW5lYXJHcmFkaWVudCwgTm9kZSwgUGFpbnQsIFBhaW50RGVmLCBQYXRoLCBQYXR0ZXJuLCBSYWRpYWxHcmFkaWVudCwgUmVuZGVyZXIsIHNjZW5lcnksIFRleHQsIFRQYWludCwgVFBhaW50YWJsZURyYXdhYmxlIH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBDb25zdHJ1Y3RvciBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvQ29uc3RydWN0b3IuanMnO1xyXG5pbXBvcnQgSW50ZW50aW9uYWxBbnkgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL0ludGVudGlvbmFsQW55LmpzJztcclxuaW1wb3J0IFZlY3RvcjIgZnJvbSAnLi4vLi4vLi4vZG90L2pzL1ZlY3RvcjIuanMnO1xyXG5pbXBvcnQgeyBpc1RSZWFkT25seVByb3BlcnR5IH0gZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcblxyXG5jb25zdCBpc1NhZmFyaTUgPSBwbGF0Zm9ybS5zYWZhcmk1O1xyXG5cclxuY29uc3QgUEFJTlRBQkxFX09QVElPTl9LRVlTID0gW1xyXG4gICdmaWxsJywgLy8ge1BhaW50RGVmfSAtIFNldHMgdGhlIGZpbGwgb2YgdGhpcyBOb2RlLCBzZWUgc2V0RmlsbCgpIGZvciBkb2N1bWVudGF0aW9uLlxyXG4gICdmaWxsUGlja2FibGUnLCAvLyB7Ym9vbGVhbn0gLSBTZXRzIHdoZXRoZXIgdGhlIGZpbGxlZCBhcmVhIG9mIHRoZSBOb2RlIHdpbGwgYmUgdHJlYXRlZCBhcyAnaW5zaWRlJy4gU2VlIHNldEZpbGxQaWNrYWJsZSgpXHJcbiAgJ3N0cm9rZScsIC8vIHtQYWludERlZn0gLSBTZXRzIHRoZSBzdHJva2Ugb2YgdGhpcyBOb2RlLCBzZWUgc2V0U3Ryb2tlKCkgZm9yIGRvY3VtZW50YXRpb24uXHJcbiAgJ3N0cm9rZVBpY2thYmxlJywgLy8ge2Jvb2xlYW59IC0gU2V0cyB3aGV0aGVyIHRoZSBzdHJva2VkIGFyZWEgb2YgdGhlIE5vZGUgd2lsbCBiZSB0cmVhdGVkIGFzICdpbnNpZGUnLiBTZWUgc2V0U3Ryb2tlUGlja2FibGUoKVxyXG4gICdsaW5lV2lkdGgnLCAvLyB7bnVtYmVyfSAtIFNldHMgdGhlIHdpZHRoIG9mIHRoZSBzdHJva2VkIGFyZWEsIHNlZSBzZXRMaW5lV2lkdGggZm9yIGRvY3VtZW50YXRpb24uXHJcbiAgJ2xpbmVDYXAnLCAvLyB7c3RyaW5nfSAtIFNldHMgdGhlIHNoYXBlIG9mIHRoZSBzdHJva2VkIGFyZWEgYXQgdGhlIHN0YXJ0L2VuZCBvZiB0aGUgcGF0aCwgc2VlIHNldExpbmVDYXAoKSBmb3IgZG9jdW1lbnRhdGlvbi5cclxuICAnbGluZUpvaW4nLCAvLyB7c3RyaW5nfSAtIFNldHMgdGhlIHNoYXBlIG9mIHRoZSBzdHJva2VkIGFyZWEgYXQgam9pbnRzLCBzZWUgc2V0TGluZUpvaW4oKSBmb3IgZG9jdW1lbnRhdGlvbi5cclxuICAnbWl0ZXJMaW1pdCcsIC8vIHtudW1iZXJ9IC0gU2V0cyB3aGVuIGxpbmVKb2luIHdpbGwgc3dpdGNoIGZyb20gbWl0ZXIgdG8gYmV2ZWwsIHNlZSBzZXRNaXRlckxpbWl0KCkgZm9yIGRvY3VtZW50YXRpb24uXHJcbiAgJ2xpbmVEYXNoJywgLy8ge0FycmF5LjxudW1iZXI+fSAtIFNldHMgYSBsaW5lLWRhc2ggcGF0dGVybiBmb3IgdGhlIHN0cm9rZSwgc2VlIHNldExpbmVEYXNoKCkgZm9yIGRvY3VtZW50YXRpb25cclxuICAnbGluZURhc2hPZmZzZXQnLCAvLyB7bnVtYmVyfSAtIFNldHMgdGhlIG9mZnNldCBvZiB0aGUgbGluZS1kYXNoIGZyb20gdGhlIHN0YXJ0IG9mIHRoZSBzdHJva2UsIHNlZSBzZXRMaW5lRGFzaE9mZnNldCgpXHJcbiAgJ2NhY2hlZFBhaW50cycgLy8ge0FycmF5LjxQYWludERlZj59IC0gU2V0cyB3aGljaCBwYWludHMgc2hvdWxkIGJlIGNhY2hlZCwgZXZlbiBpZiBub3QgZGlzcGxheWVkLiBTZWUgc2V0Q2FjaGVkUGFpbnRzKClcclxuXTtcclxuXHJcbmNvbnN0IERFRkFVTFRfT1BUSU9OUyA9IHtcclxuICBmaWxsOiBudWxsLFxyXG4gIGZpbGxQaWNrYWJsZTogdHJ1ZSxcclxuICBzdHJva2U6IG51bGwsXHJcbiAgc3Ryb2tlUGlja2FibGU6IGZhbHNlLFxyXG5cclxuICAvLyBOb3Qgc2V0IGluaXRpYWxseSwgYnV0IHRoZXkgYXJlIHRoZSBMaW5lU3R5bGVzIGRlZmF1bHRzXHJcbiAgbGluZVdpZHRoOiBMSU5FX1NUWUxFX0RFRkFVTFRfT1BUSU9OUy5saW5lV2lkdGgsXHJcbiAgbGluZUNhcDogTElORV9TVFlMRV9ERUZBVUxUX09QVElPTlMubGluZUNhcCxcclxuICBsaW5lSm9pbjogTElORV9TVFlMRV9ERUZBVUxUX09QVElPTlMubGluZUpvaW4sXHJcbiAgbGluZURhc2hPZmZzZXQ6IExJTkVfU1RZTEVfREVGQVVMVF9PUFRJT05TLmxpbmVEYXNoT2Zmc2V0LFxyXG4gIG1pdGVyTGltaXQ6IExJTkVfU1RZTEVfREVGQVVMVF9PUFRJT05TLm1pdGVyTGltaXRcclxufTtcclxuXHJcbmV4cG9ydCB0eXBlIFBhaW50YWJsZU9wdGlvbnMgPSB7XHJcbiAgZmlsbD86IFRQYWludDtcclxuICBmaWxsUGlja2FibGU/OiBib29sZWFuO1xyXG4gIHN0cm9rZT86IFRQYWludDtcclxuICBzdHJva2VQaWNrYWJsZT86IGJvb2xlYW47XHJcbiAgbGluZVdpZHRoPzogbnVtYmVyO1xyXG4gIGxpbmVDYXA/OiBMaW5lQ2FwO1xyXG4gIGxpbmVKb2luPzogTGluZUpvaW47XHJcbiAgbWl0ZXJMaW1pdD86IG51bWJlcjtcclxuICBsaW5lRGFzaD86IG51bWJlcltdO1xyXG4gIGxpbmVEYXNoT2Zmc2V0PzogbnVtYmVyO1xyXG4gIGNhY2hlZFBhaW50cz86IFRQYWludFtdO1xyXG59O1xyXG5cclxuLy8gV29ya2Fyb3VuZCB0eXBlIHNpbmNlIHdlIGNhbid0IGRldGVjdCBtaXhpbnMgaW4gdGhlIHR5cGUgc3lzdGVtIHdlbGxcclxuZXhwb3J0IHR5cGUgUGFpbnRhYmxlTm9kZSA9IFBhdGggfCBUZXh0O1xyXG5cclxuY29uc3QgUEFJTlRBQkxFX0RSQVdBQkxFX01BUktfRkxBR1MgPSBbICdmaWxsJywgJ3N0cm9rZScsICdsaW5lV2lkdGgnLCAnbGluZU9wdGlvbnMnLCAnY2FjaGVkUGFpbnRzJyBdO1xyXG5cclxuLy8gTm9ybWFsbHkgb3VyIHByb2plY3QgcHJlZmVycyB0eXBlIGFsaWFzZXMgdG8gaW50ZXJmYWNlcywgYnV0IGludGVyZmFjZXMgYXJlIG5lY2Vzc2FyeSBmb3IgY29ycmVjdCB1c2FnZSBvZiBcInRoaXNcIiwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy90YXNrcy9pc3N1ZXMvMTEzMlxyXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2NvbnNpc3RlbnQtdHlwZS1kZWZpbml0aW9uc1xyXG5leHBvcnQgaW50ZXJmYWNlIFRQYWludGFibGUge1xyXG5cclxuICBfZmlsbDogVFBhaW50O1xyXG4gIF9maWxsUGlja2FibGU6IGJvb2xlYW47XHJcbiAgX3N0cm9rZTogVFBhaW50O1xyXG4gIF9zdHJva2VQaWNrYWJsZTogYm9vbGVhbjtcclxuICBfY2FjaGVkUGFpbnRzOiBQYWludFtdO1xyXG4gIF9saW5lRHJhd2luZ1N0eWxlczogTGluZVN0eWxlcztcclxuXHJcbiAgc2V0RmlsbCggZmlsbDogVFBhaW50ICk6IHRoaXM7XHJcblxyXG4gIGZpbGw6IFRQYWludDtcclxuXHJcbiAgZ2V0RmlsbCgpOiBUUGFpbnQ7XHJcblxyXG4gIGhhc0ZpbGwoKTogYm9vbGVhbjtcclxuXHJcbiAgZ2V0RmlsbFZhbHVlKCk6IG51bGwgfCBzdHJpbmcgfCBDb2xvciB8IExpbmVhckdyYWRpZW50IHwgUmFkaWFsR3JhZGllbnQgfCBQYXR0ZXJuIHwgUGFpbnQ7XHJcblxyXG4gIGdldCBmaWxsVmFsdWUoKTogbnVsbCB8IHN0cmluZyB8IENvbG9yIHwgTGluZWFyR3JhZGllbnQgfCBSYWRpYWxHcmFkaWVudCB8IFBhdHRlcm4gfCBQYWludDtcclxuXHJcbiAgc2V0U3Ryb2tlKCBzdHJva2U6IFRQYWludCApOiB0aGlzO1xyXG5cclxuICBzdHJva2U6IFRQYWludDtcclxuXHJcbiAgZ2V0U3Ryb2tlKCk6IFRQYWludDtcclxuXHJcbiAgaGFzU3Ryb2tlKCk6IGJvb2xlYW47XHJcblxyXG4gIGhhc1BhaW50YWJsZVN0cm9rZSgpOiBib29sZWFuO1xyXG5cclxuICBnZXRTdHJva2VWYWx1ZSgpOiBudWxsIHwgc3RyaW5nIHwgQ29sb3IgfCBMaW5lYXJHcmFkaWVudCB8IFJhZGlhbEdyYWRpZW50IHwgUGF0dGVybiB8IFBhaW50O1xyXG5cclxuICBnZXQgc3Ryb2tlVmFsdWUoKTogbnVsbCB8IHN0cmluZyB8IENvbG9yIHwgTGluZWFyR3JhZGllbnQgfCBSYWRpYWxHcmFkaWVudCB8IFBhdHRlcm4gfCBQYWludDtcclxuXHJcbiAgc2V0RmlsbFBpY2thYmxlKCBwaWNrYWJsZTogYm9vbGVhbiApOiB0aGlzO1xyXG5cclxuICBmaWxsUGlja2FibGU6IGJvb2xlYW47XHJcblxyXG4gIGlzRmlsbFBpY2thYmxlKCk6IGJvb2xlYW47XHJcblxyXG4gIHNldFN0cm9rZVBpY2thYmxlKCBwaWNrYWJsZTogYm9vbGVhbiApOiB0aGlzO1xyXG5cclxuICBzdHJva2VQaWNrYWJsZTogYm9vbGVhbjtcclxuXHJcbiAgaXNTdHJva2VQaWNrYWJsZSgpOiBib29sZWFuO1xyXG5cclxuICBzZXRMaW5lV2lkdGgoIGxpbmVXaWR0aDogbnVtYmVyICk6IHRoaXM7XHJcblxyXG4gIGxpbmVXaWR0aDogbnVtYmVyO1xyXG5cclxuICBnZXRMaW5lV2lkdGgoKTogbnVtYmVyO1xyXG5cclxuICBzZXRMaW5lQ2FwKCBsaW5lQ2FwOiBMaW5lQ2FwICk6IHRoaXM7XHJcblxyXG4gIGxpbmVDYXA6IExpbmVDYXA7XHJcblxyXG4gIGdldExpbmVDYXAoKTogTGluZUNhcDtcclxuXHJcbiAgc2V0TGluZUpvaW4oIGxpbmVKb2luOiBMaW5lSm9pbiApOiB0aGlzO1xyXG5cclxuICBsaW5lSm9pbjogTGluZUpvaW47XHJcblxyXG4gIGdldExpbmVKb2luKCk6IExpbmVKb2luO1xyXG5cclxuICBzZXRNaXRlckxpbWl0KCBtaXRlckxpbWl0OiBudW1iZXIgKTogdGhpcztcclxuXHJcbiAgbWl0ZXJMaW1pdDogbnVtYmVyO1xyXG5cclxuICBnZXRNaXRlckxpbWl0KCk6IG51bWJlcjtcclxuXHJcbiAgc2V0TGluZURhc2goIGxpbmVEYXNoOiBudW1iZXJbXSApOiB0aGlzO1xyXG5cclxuICBsaW5lRGFzaDogbnVtYmVyW107XHJcblxyXG4gIGdldExpbmVEYXNoKCk6IG51bWJlcltdO1xyXG5cclxuICBoYXNMaW5lRGFzaCgpOiBib29sZWFuO1xyXG5cclxuICBzZXRMaW5lRGFzaE9mZnNldCggbGluZURhc2hPZmZzZXQ6IG51bWJlciApOiB0aGlzO1xyXG5cclxuICBsaW5lRGFzaE9mZnNldDogbnVtYmVyO1xyXG5cclxuICBnZXRMaW5lRGFzaE9mZnNldCgpOiBudW1iZXI7XHJcblxyXG4gIHNldExpbmVTdHlsZXMoIGxpbmVTdHlsZXM6IExpbmVTdHlsZXMgKTogdGhpcztcclxuXHJcbiAgbGluZVN0eWxlczogTGluZVN0eWxlcztcclxuXHJcbiAgZ2V0TGluZVN0eWxlcygpOiBMaW5lU3R5bGVzO1xyXG5cclxuICBzZXRDYWNoZWRQYWludHMoIHBhaW50czogVFBhaW50W10gKTogdGhpcztcclxuXHJcbiAgY2FjaGVkUGFpbnRzOiBUUGFpbnRbXTtcclxuXHJcbiAgZ2V0Q2FjaGVkUGFpbnRzKCk6IFRQYWludFtdO1xyXG5cclxuICBhZGRDYWNoZWRQYWludCggcGFpbnQ6IFRQYWludCApOiB2b2lkO1xyXG5cclxuICByZW1vdmVDYWNoZWRQYWludCggcGFpbnQ6IFRQYWludCApOiB2b2lkO1xyXG5cclxuICBiZWZvcmVDYW52YXNGaWxsKCB3cmFwcGVyOiBDYW52YXNDb250ZXh0V3JhcHBlciApOiB2b2lkO1xyXG5cclxuICBhZnRlckNhbnZhc0ZpbGwoIHdyYXBwZXI6IENhbnZhc0NvbnRleHRXcmFwcGVyICk6IHZvaWQ7XHJcblxyXG4gIGJlZm9yZUNhbnZhc1N0cm9rZSggd3JhcHBlcjogQ2FudmFzQ29udGV4dFdyYXBwZXIgKTogdm9pZDtcclxuXHJcbiAgYWZ0ZXJDYW52YXNTdHJva2UoIHdyYXBwZXI6IENhbnZhc0NvbnRleHRXcmFwcGVyICk6IHZvaWQ7XHJcblxyXG4gIGdldENTU0ZpbGwoKTogc3RyaW5nO1xyXG5cclxuICBnZXRTaW1wbGVDU1NTdHJva2UoKTogc3RyaW5nO1xyXG5cclxuICBhcHBlbmRGaWxsYWJsZVByb3BTdHJpbmcoIHNwYWNlczogc3RyaW5nLCByZXN1bHQ6IHN0cmluZyApOiBzdHJpbmc7XHJcblxyXG4gIGFwcGVuZFN0cm9rYWJsZVByb3BTdHJpbmcoIHNwYWNlczogc3RyaW5nLCByZXN1bHQ6IHN0cmluZyApOiBzdHJpbmc7XHJcblxyXG4gIGdldEZpbGxSZW5kZXJlckJpdG1hc2soKTogbnVtYmVyO1xyXG5cclxuICBnZXRTdHJva2VSZW5kZXJlckJpdG1hc2soKTogbnVtYmVyO1xyXG5cclxuICBpbnZhbGlkYXRlRmlsbCgpOiB2b2lkO1xyXG5cclxuICBpbnZhbGlkYXRlU3Ryb2tlKCk6IHZvaWQ7XHJcbn1cclxuXHJcbmNvbnN0IFBhaW50YWJsZSA9IG1lbW9pemUoIDxTdXBlclR5cGUgZXh0ZW5kcyBDb25zdHJ1Y3RvcjxOb2RlPj4oIFR5cGU6IFN1cGVyVHlwZSApOiBTdXBlclR5cGUgJiBDb25zdHJ1Y3RvcjxUUGFpbnRhYmxlPiA9PiB7XHJcbiAgYXNzZXJ0ICYmIGFzc2VydCggXy5pbmNsdWRlcyggaW5oZXJpdGFuY2UoIFR5cGUgKSwgTm9kZSApLCAnT25seSBOb2RlIHN1YnR5cGVzIHNob3VsZCBtaXggUGFpbnRhYmxlJyApO1xyXG5cclxuICByZXR1cm4gY2xhc3MgUGFpbnRhYmxlTWl4aW4gZXh0ZW5kcyBUeXBlIGltcGxlbWVudHMgVFBhaW50YWJsZSB7XHJcblxyXG4gICAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICBwdWJsaWMgX2ZpbGw6IFRQYWludDtcclxuICAgIHB1YmxpYyBfZmlsbFBpY2thYmxlOiBib29sZWFuO1xyXG5cclxuICAgIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAgcHVibGljIF9zdHJva2U6IFRQYWludDtcclxuICAgIHB1YmxpYyBfc3Ryb2tlUGlja2FibGU6IGJvb2xlYW47XHJcblxyXG4gICAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICBwdWJsaWMgX2NhY2hlZFBhaW50czogUGFpbnRbXTtcclxuICAgIHB1YmxpYyBfbGluZURyYXdpbmdTdHlsZXM6IExpbmVTdHlsZXM7XHJcblxyXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKCAuLi5hcmdzOiBJbnRlbnRpb25hbEFueVtdICkge1xyXG4gICAgICBzdXBlciggLi4uYXJncyApO1xyXG5cclxuICAgICAgYXNzZXJ0SGFzUHJvcGVydGllcyggdGhpcywgWyAnX2RyYXdhYmxlcycgXSApO1xyXG5cclxuICAgICAgdGhpcy5fZmlsbCA9IERFRkFVTFRfT1BUSU9OUy5maWxsO1xyXG4gICAgICB0aGlzLl9maWxsUGlja2FibGUgPSBERUZBVUxUX09QVElPTlMuZmlsbFBpY2thYmxlO1xyXG5cclxuICAgICAgdGhpcy5fc3Ryb2tlID0gREVGQVVMVF9PUFRJT05TLnN0cm9rZTtcclxuICAgICAgdGhpcy5fc3Ryb2tlUGlja2FibGUgPSBERUZBVUxUX09QVElPTlMuc3Ryb2tlUGlja2FibGU7XHJcblxyXG4gICAgICB0aGlzLl9jYWNoZWRQYWludHMgPSBbXTtcclxuICAgICAgdGhpcy5fbGluZURyYXdpbmdTdHlsZXMgPSBuZXcgTGluZVN0eWxlcygpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0cyB0aGUgZmlsbCBjb2xvciBmb3IgdGhlIE5vZGUuXHJcbiAgICAgKlxyXG4gICAgICogVGhlIGZpbGwgZGV0ZXJtaW5lcyB0aGUgYXBwZWFyYW5jZSBvZiB0aGUgaW50ZXJpb3IgcGFydCBvZiBhIFBhdGggb3IgVGV4dC5cclxuICAgICAqXHJcbiAgICAgKiBQbGVhc2UgdXNlIG51bGwgZm9yIGluZGljYXRpbmcgXCJubyBmaWxsXCIgKHRoYXQgaXMgdGhlIGRlZmF1bHQpLiBTdHJpbmdzIGFuZCBTY2VuZXJ5IENvbG9yIG9iamVjdHMgY2FuIGJlXHJcbiAgICAgKiBwcm92aWRlZCBmb3IgYSBzaW5nbGUtY29sb3IgZmxhdCBhcHBlYXJhbmNlLCBhbmQgY2FuIGJlIHdyYXBwZWQgd2l0aCBhbiBBeG9uIFByb3BlcnR5LiBHcmFkaWVudHMgYW5kIHBhdHRlcm5zXHJcbiAgICAgKiBjYW4gYWxzbyBiZSBwcm92aWRlZC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHNldEZpbGwoIGZpbGw6IFRQYWludCApOiB0aGlzIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggUGFpbnREZWYuaXNQYWludERlZiggZmlsbCApLCAnSW52YWxpZCBmaWxsIHR5cGUnICk7XHJcblxyXG4gICAgICBpZiAoIGFzc2VydCAmJiB0eXBlb2YgZmlsbCA9PT0gJ3N0cmluZycgKSB7XHJcbiAgICAgICAgQ29sb3IuY2hlY2tQYWludFN0cmluZyggZmlsbCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJbnN0YW5jZSBlcXVhbGl0eSB1c2VkIGhlcmUgc2luY2UgaXQgd291bGQgYmUgbW9yZSBleHBlbnNpdmUgdG8gcGFyc2UgYWxsIENTU1xyXG4gICAgICAvLyBjb2xvcnMgYW5kIGNvbXBhcmUgZXZlcnkgdGltZSB0aGUgZmlsbCBjaGFuZ2VzLiBSaWdodCBub3csIHVzdWFsbHkgd2UgZG9uJ3QgaGF2ZVxyXG4gICAgICAvLyB0byBwYXJzZSBDU1MgY29sb3JzLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzI1NVxyXG4gICAgICBpZiAoIHRoaXMuX2ZpbGwgIT09IGZpbGwgKSB7XHJcbiAgICAgICAgdGhpcy5fZmlsbCA9IGZpbGw7XHJcblxyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZUZpbGwoKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0IGZpbGwoIHZhbHVlOiBUUGFpbnQgKSB7IHRoaXMuc2V0RmlsbCggdmFsdWUgKTsgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgZmlsbCgpOiBUUGFpbnQgeyByZXR1cm4gdGhpcy5nZXRGaWxsKCk7IH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIGZpbGwgKGlmIGFueSkgZm9yIHRoaXMgTm9kZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldEZpbGwoKTogVFBhaW50IHtcclxuICAgICAgcmV0dXJuIHRoaXMuX2ZpbGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlcmUgaXMgYSBmaWxsIGFwcGxpZWQgdG8gdGhpcyBOb2RlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgaGFzRmlsbCgpOiBib29sZWFuIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZ2V0RmlsbFZhbHVlKCkgIT09IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIGEgcHJvcGVydHktdW53cmFwcGVkIGZpbGwgaWYgYXBwbGljYWJsZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldEZpbGxWYWx1ZSgpOiBudWxsIHwgc3RyaW5nIHwgQ29sb3IgfCBMaW5lYXJHcmFkaWVudCB8IFJhZGlhbEdyYWRpZW50IHwgUGF0dGVybiB8IFBhaW50IHtcclxuICAgICAgY29uc3QgZmlsbCA9IHRoaXMuZ2V0RmlsbCgpO1xyXG5cclxuICAgICAgcmV0dXJuIGlzVFJlYWRPbmx5UHJvcGVydHkoIGZpbGwgKSA/IGZpbGwuZ2V0KCkgOiBmaWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgZmlsbFZhbHVlKCk6IG51bGwgfCBzdHJpbmcgfCBDb2xvciB8IExpbmVhckdyYWRpZW50IHwgUmFkaWFsR3JhZGllbnQgfCBQYXR0ZXJuIHwgUGFpbnQgeyByZXR1cm4gdGhpcy5nZXRGaWxsVmFsdWUoKTsgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0cyB0aGUgc3Ryb2tlIGNvbG9yIGZvciB0aGUgTm9kZS5cclxuICAgICAqXHJcbiAgICAgKiBUaGUgc3Ryb2tlIGRldGVybWluZXMgdGhlIGFwcGVhcmFuY2Ugb2YgdGhlIHJlZ2lvbiBhbG9uZyB0aGUgYm91bmRhcnkgb2YgdGhlIFBhdGggb3IgVGV4dC4gVGhlIHNoYXBlIG9mIHRoZVxyXG4gICAgICogc3Ryb2tlZCBhcmVhIGRlcGVuZHMgb24gdGhlIGJhc2Ugc2hhcGUgKHRoYXQgb2YgdGhlIFBhdGggb3IgVGV4dCkgYW5kIG11bHRpcGxlIHBhcmFtZXRlcnM6XHJcbiAgICAgKiBsaW5lV2lkdGgvbGluZUNhcC9saW5lSm9pbi9taXRlckxpbWl0L2xpbmVEYXNoL2xpbmVEYXNoT2Zmc2V0LiBJdCB3aWxsIGJlIGRyYXduIG9uIHRvcCBvZiBhbnkgZmlsbCBvbiB0aGVcclxuICAgICAqIHNhbWUgTm9kZS5cclxuICAgICAqXHJcbiAgICAgKiBQbGVhc2UgdXNlIG51bGwgZm9yIGluZGljYXRpbmcgXCJubyBzdHJva2VcIiAodGhhdCBpcyB0aGUgZGVmYXVsdCkuIFN0cmluZ3MgYW5kIFNjZW5lcnkgQ29sb3Igb2JqZWN0cyBjYW4gYmVcclxuICAgICAqIHByb3ZpZGVkIGZvciBhIHNpbmdsZS1jb2xvciBmbGF0IGFwcGVhcmFuY2UsIGFuZCBjYW4gYmUgd3JhcHBlZCB3aXRoIGFuIEF4b24gUHJvcGVydHkuIEdyYWRpZW50cyBhbmQgcGF0dGVybnNcclxuICAgICAqIGNhbiBhbHNvIGJlIHByb3ZpZGVkLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc2V0U3Ryb2tlKCBzdHJva2U6IFRQYWludCApOiB0aGlzIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggUGFpbnREZWYuaXNQYWludERlZiggc3Ryb2tlICksICdJbnZhbGlkIHN0cm9rZSB0eXBlJyApO1xyXG5cclxuICAgICAgaWYgKCBhc3NlcnQgJiYgdHlwZW9mIHN0cm9rZSA9PT0gJ3N0cmluZycgKSB7XHJcbiAgICAgICAgQ29sb3IuY2hlY2tQYWludFN0cmluZyggc3Ryb2tlICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEluc3RhbmNlIGVxdWFsaXR5IHVzZWQgaGVyZSBzaW5jZSBpdCB3b3VsZCBiZSBtb3JlIGV4cGVuc2l2ZSB0byBwYXJzZSBhbGwgQ1NTXHJcbiAgICAgIC8vIGNvbG9ycyBhbmQgY29tcGFyZSBldmVyeSB0aW1lIHRoZSBmaWxsIGNoYW5nZXMuIFJpZ2h0IG5vdywgdXN1YWxseSB3ZSBkb24ndCBoYXZlXHJcbiAgICAgIC8vIHRvIHBhcnNlIENTUyBjb2xvcnMuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMjU1XHJcbiAgICAgIGlmICggdGhpcy5fc3Ryb2tlICE9PSBzdHJva2UgKSB7XHJcbiAgICAgICAgdGhpcy5fc3Ryb2tlID0gc3Ryb2tlO1xyXG5cclxuICAgICAgICBpZiAoIGFzc2VydCAmJiBzdHJva2UgaW5zdGFuY2VvZiBQYWludCAmJiBzdHJva2UudHJhbnNmb3JtTWF0cml4ICkge1xyXG4gICAgICAgICAgY29uc3Qgc2NhbGVWZWN0b3IgPSBzdHJva2UudHJhbnNmb3JtTWF0cml4LmdldFNjYWxlVmVjdG9yKCk7XHJcbiAgICAgICAgICBhc3NlcnQoIE1hdGguYWJzKCBzY2FsZVZlY3Rvci54IC0gc2NhbGVWZWN0b3IueSApIDwgMWUtNywgJ1lvdSBjYW5ub3Qgc3BlY2lmeSBhIHBhdHRlcm4gb3IgZ3JhZGllbnQgdG8gYSBzdHJva2UgdGhhdCBkb2VzIG5vdCBoYXZlIGEgc3ltbWV0cmljIHNjYWxlLicgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlU3Ryb2tlKCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldCBzdHJva2UoIHZhbHVlOiBUUGFpbnQgKSB7IHRoaXMuc2V0U3Ryb2tlKCB2YWx1ZSApOyB9XHJcblxyXG4gICAgcHVibGljIGdldCBzdHJva2UoKTogVFBhaW50IHsgcmV0dXJuIHRoaXMuZ2V0U3Ryb2tlKCk7IH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIHN0cm9rZSAoaWYgYW55KSBmb3IgdGhpcyBOb2RlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0U3Ryb2tlKCk6IFRQYWludCB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9zdHJva2U7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlcmUgaXMgYSBzdHJva2UgYXBwbGllZCB0byB0aGlzIE5vZGUuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBoYXNTdHJva2UoKTogYm9vbGVhbiB7XHJcbiAgICAgIHJldHVybiB0aGlzLmdldFN0cm9rZVZhbHVlKCkgIT09IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlcmUgd2lsbCBhcHBlYXIgdG8gYmUgYSBzdHJva2UgZm9yIHRoaXMgTm9kZS4gUHJvcGVybHkgaGFuZGxlcyB0aGUgbGluZVdpZHRoOjAgY2FzZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGhhc1BhaW50YWJsZVN0cm9rZSgpOiBib29sZWFuIHtcclxuICAgICAgLy8gU2hvdWxkIG5vdCBiZSBzdHJva2VkIGlmIHRoZSBsaW5lV2lkdGggaXMgMCwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy82NThcclxuICAgICAgLy8gYW5kIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy81MjNcclxuICAgICAgcmV0dXJuIHRoaXMuaGFzU3Ryb2tlKCkgJiYgdGhpcy5nZXRMaW5lV2lkdGgoKSA+IDA7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIGEgcHJvcGVydHktdW53cmFwcGVkIHN0cm9rZSBpZiBhcHBsaWNhYmxlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0U3Ryb2tlVmFsdWUoKTogbnVsbCB8IHN0cmluZyB8IENvbG9yIHwgTGluZWFyR3JhZGllbnQgfCBSYWRpYWxHcmFkaWVudCB8IFBhdHRlcm4gfCBQYWludCB7XHJcbiAgICAgIGNvbnN0IHN0cm9rZSA9IHRoaXMuZ2V0U3Ryb2tlKCk7XHJcblxyXG4gICAgICByZXR1cm4gaXNUUmVhZE9ubHlQcm9wZXJ0eSggc3Ryb2tlICkgPyBzdHJva2UuZ2V0KCkgOiBzdHJva2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBzdHJva2VWYWx1ZSgpOiBudWxsIHwgc3RyaW5nIHwgQ29sb3IgfCBMaW5lYXJHcmFkaWVudCB8IFJhZGlhbEdyYWRpZW50IHwgUGF0dGVybiB8IFBhaW50IHsgcmV0dXJuIHRoaXMuZ2V0U3Ryb2tlVmFsdWUoKTsgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0cyB3aGV0aGVyIHRoZSBmaWxsIGlzIG1hcmtlZCBhcyBwaWNrYWJsZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHNldEZpbGxQaWNrYWJsZSggcGlja2FibGU6IGJvb2xlYW4gKTogdGhpcyB7XHJcbiAgICAgIGlmICggdGhpcy5fZmlsbFBpY2thYmxlICE9PSBwaWNrYWJsZSApIHtcclxuICAgICAgICB0aGlzLl9maWxsUGlja2FibGUgPSBwaWNrYWJsZTtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogYmV0dGVyIHdheSBvZiBpbmRpY2F0aW5nIHRoYXQgb25seSB0aGUgTm9kZSB1bmRlciBwb2ludGVycyBjb3VsZCBoYXZlIGNoYW5nZWQsIGJ1dCBubyBwYWludCBjaGFuZ2UgaXMgbmVlZGVkPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZUZpbGwoKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0IGZpbGxQaWNrYWJsZSggdmFsdWU6IGJvb2xlYW4gKSB7IHRoaXMuc2V0RmlsbFBpY2thYmxlKCB2YWx1ZSApOyB9XHJcblxyXG4gICAgcHVibGljIGdldCBmaWxsUGlja2FibGUoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmlzRmlsbFBpY2thYmxlKCk7IH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgd2hldGhlciB0aGUgZmlsbCBpcyBtYXJrZWQgYXMgcGlja2FibGUuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBpc0ZpbGxQaWNrYWJsZSgpOiBib29sZWFuIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX2ZpbGxQaWNrYWJsZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgd2hldGhlciB0aGUgc3Ryb2tlIGlzIG1hcmtlZCBhcyBwaWNrYWJsZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHNldFN0cm9rZVBpY2thYmxlKCBwaWNrYWJsZTogYm9vbGVhbiApOiB0aGlzIHtcclxuXHJcbiAgICAgIGlmICggdGhpcy5fc3Ryb2tlUGlja2FibGUgIT09IHBpY2thYmxlICkge1xyXG4gICAgICAgIHRoaXMuX3N0cm9rZVBpY2thYmxlID0gcGlja2FibGU7XHJcblxyXG4gICAgICAgIC8vIFRPRE86IGJldHRlciB3YXkgb2YgaW5kaWNhdGluZyB0aGF0IG9ubHkgdGhlIE5vZGUgdW5kZXIgcG9pbnRlcnMgY291bGQgaGF2ZSBjaGFuZ2VkLCBidXQgbm8gcGFpbnQgY2hhbmdlIGlzIG5lZWRlZD8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgICAgICB0aGlzLmludmFsaWRhdGVTdHJva2UoKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0IHN0cm9rZVBpY2thYmxlKCB2YWx1ZTogYm9vbGVhbiApIHsgdGhpcy5zZXRTdHJva2VQaWNrYWJsZSggdmFsdWUgKTsgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgc3Ryb2tlUGlja2FibGUoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmlzU3Ryb2tlUGlja2FibGUoKTsgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB3aGV0aGVyIHRoZSBzdHJva2UgaXMgbWFya2VkIGFzIHBpY2thYmxlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgaXNTdHJva2VQaWNrYWJsZSgpOiBib29sZWFuIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX3N0cm9rZVBpY2thYmxlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0cyB0aGUgbGluZSB3aWR0aCB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byBzdHJva2VzIG9uIHRoaXMgTm9kZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHNldExpbmVXaWR0aCggbGluZVdpZHRoOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGxpbmVXaWR0aCA+PSAwLCBgbGluZVdpZHRoIHNob3VsZCBiZSBub24tbmVnYXRpdmUgaW5zdGVhZCBvZiAke2xpbmVXaWR0aH1gICk7XHJcblxyXG4gICAgICBpZiAoIHRoaXMuZ2V0TGluZVdpZHRoKCkgIT09IGxpbmVXaWR0aCApIHtcclxuICAgICAgICB0aGlzLl9saW5lRHJhd2luZ1N0eWxlcy5saW5lV2lkdGggPSBsaW5lV2lkdGg7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlU3Ryb2tlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHN0YXRlTGVuID0gdGhpcy5fZHJhd2FibGVzLmxlbmd0aDtcclxuICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzdGF0ZUxlbjsgaSsrICkge1xyXG4gICAgICAgICAgKCB0aGlzLl9kcmF3YWJsZXNbIGkgXSBhcyB1bmtub3duIGFzIFRQYWludGFibGVEcmF3YWJsZSApLm1hcmtEaXJ0eUxpbmVXaWR0aCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0IGxpbmVXaWR0aCggdmFsdWU6IG51bWJlciApIHsgdGhpcy5zZXRMaW5lV2lkdGgoIHZhbHVlICk7IH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGxpbmVXaWR0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRMaW5lV2lkdGgoKTsgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgbGluZSB3aWR0aCB0aGF0IHdvdWxkIGJlIGFwcGxpZWQgdG8gc3Ryb2tlcy5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldExpbmVXaWR0aCgpOiBudW1iZXIge1xyXG4gICAgICByZXR1cm4gdGhpcy5fbGluZURyYXdpbmdTdHlsZXMubGluZVdpZHRoO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0cyB0aGUgbGluZSBjYXAgc3R5bGUuIFRoZXJlIGFyZSB0aHJlZSBvcHRpb25zOlxyXG4gICAgICogLSAnYnV0dCcgKHRoZSBkZWZhdWx0KSBzdG9wcyB0aGUgbGluZSBhdCB0aGUgZW5kIHBvaW50XHJcbiAgICAgKiAtICdyb3VuZCcgZHJhd3MgYSBzZW1pY2lyY3VsYXIgYXJjIGFyb3VuZCB0aGUgZW5kIHBvaW50XHJcbiAgICAgKiAtICdzcXVhcmUnIGRyYXdzIGEgc3F1YXJlIG91dGxpbmUgYXJvdW5kIHRoZSBlbmQgcG9pbnQgKGxpa2UgYnV0dCwgYnV0IGV4dGVuZGVkIGJ5IDEvMiBsaW5lIHdpZHRoIG91dClcclxuICAgICAqL1xyXG4gICAgcHVibGljIHNldExpbmVDYXAoIGxpbmVDYXA6IExpbmVDYXAgKTogdGhpcyB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGxpbmVDYXAgPT09ICdidXR0JyB8fCBsaW5lQ2FwID09PSAncm91bmQnIHx8IGxpbmVDYXAgPT09ICdzcXVhcmUnLFxyXG4gICAgICAgIGBsaW5lQ2FwIHNob3VsZCBiZSBvbmUgb2YgXCJidXR0XCIsIFwicm91bmRcIiBvciBcInNxdWFyZVwiLCBub3QgJHtsaW5lQ2FwfWAgKTtcclxuXHJcbiAgICAgIGlmICggdGhpcy5fbGluZURyYXdpbmdTdHlsZXMubGluZUNhcCAhPT0gbGluZUNhcCApIHtcclxuICAgICAgICB0aGlzLl9saW5lRHJhd2luZ1N0eWxlcy5saW5lQ2FwID0gbGluZUNhcDtcclxuICAgICAgICB0aGlzLmludmFsaWRhdGVTdHJva2UoKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc3RhdGVMZW4gPSB0aGlzLl9kcmF3YWJsZXMubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHN0YXRlTGVuOyBpKysgKSB7XHJcbiAgICAgICAgICAoIHRoaXMuX2RyYXdhYmxlc1sgaSBdIGFzIHVua25vd24gYXMgVFBhaW50YWJsZURyYXdhYmxlICkubWFya0RpcnR5TGluZU9wdGlvbnMoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldCBsaW5lQ2FwKCB2YWx1ZTogTGluZUNhcCApIHsgdGhpcy5zZXRMaW5lQ2FwKCB2YWx1ZSApOyB9XHJcblxyXG4gICAgcHVibGljIGdldCBsaW5lQ2FwKCk6IExpbmVDYXAgeyByZXR1cm4gdGhpcy5nZXRMaW5lQ2FwKCk7IH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIGxpbmUgY2FwIHN0eWxlIChjb250cm9scyBhcHBlYXJhbmNlIGF0IHRoZSBzdGFydC9lbmQgb2YgcGF0aHMpXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXRMaW5lQ2FwKCk6IExpbmVDYXAge1xyXG4gICAgICByZXR1cm4gdGhpcy5fbGluZURyYXdpbmdTdHlsZXMubGluZUNhcDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgdGhlIGxpbmUgam9pbiBzdHlsZS4gVGhlcmUgYXJlIHRocmVlIG9wdGlvbnM6XHJcbiAgICAgKiAtICdtaXRlcicgKGRlZmF1bHQpIGpvaW5zIGJ5IGV4dGVuZGluZyB0aGUgc2VnbWVudHMgb3V0IGluIGEgbGluZSB1bnRpbCB0aGV5IG1lZXQuIEZvciB2ZXJ5IHNoYXJwXHJcbiAgICAgKiAgICAgICAgICAgY29ybmVycywgdGhleSB3aWxsIGJlIGNob3BwZWQgb2ZmIGFuZCB3aWxsIGFjdCBsaWtlICdiZXZlbCcsIGRlcGVuZGluZyBvbiB3aGF0IHRoZSBtaXRlckxpbWl0IGlzLlxyXG4gICAgICogLSAncm91bmQnIGRyYXdzIGEgY2lyY3VsYXIgYXJjIHRvIGNvbm5lY3QgdGhlIHR3byBzdHJva2VkIGFyZWFzLlxyXG4gICAgICogLSAnYmV2ZWwnIGNvbm5lY3RzIHdpdGggYSBzaW5nbGUgbGluZSBzZWdtZW50LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc2V0TGluZUpvaW4oIGxpbmVKb2luOiBMaW5lSm9pbiApOiB0aGlzIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggbGluZUpvaW4gPT09ICdtaXRlcicgfHwgbGluZUpvaW4gPT09ICdyb3VuZCcgfHwgbGluZUpvaW4gPT09ICdiZXZlbCcsXHJcbiAgICAgICAgYGxpbmVKb2luIHNob3VsZCBiZSBvbmUgb2YgXCJtaXRlclwiLCBcInJvdW5kXCIgb3IgXCJiZXZlbFwiLCBub3QgJHtsaW5lSm9pbn1gICk7XHJcblxyXG4gICAgICBpZiAoIHRoaXMuX2xpbmVEcmF3aW5nU3R5bGVzLmxpbmVKb2luICE9PSBsaW5lSm9pbiApIHtcclxuICAgICAgICB0aGlzLl9saW5lRHJhd2luZ1N0eWxlcy5saW5lSm9pbiA9IGxpbmVKb2luO1xyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZVN0cm9rZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBzdGF0ZUxlbiA9IHRoaXMuX2RyYXdhYmxlcy5sZW5ndGg7XHJcbiAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgc3RhdGVMZW47IGkrKyApIHtcclxuICAgICAgICAgICggdGhpcy5fZHJhd2FibGVzWyBpIF0gYXMgdW5rbm93biBhcyBUUGFpbnRhYmxlRHJhd2FibGUgKS5tYXJrRGlydHlMaW5lT3B0aW9ucygpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0IGxpbmVKb2luKCB2YWx1ZTogTGluZUpvaW4gKSB7IHRoaXMuc2V0TGluZUpvaW4oIHZhbHVlICk7IH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGxpbmVKb2luKCk6IExpbmVKb2luIHsgcmV0dXJuIHRoaXMuZ2V0TGluZUpvaW4oKTsgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgY3VycmVudCBsaW5lIGpvaW4gc3R5bGUgKGNvbnRyb2xzIGpvaW4gYXBwZWFyYW5jZSBiZXR3ZWVuIGRyYXduIHNlZ21lbnRzKS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldExpbmVKb2luKCk6IExpbmVKb2luIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX2xpbmVEcmF3aW5nU3R5bGVzLmxpbmVKb2luO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0cyB0aGUgbWl0ZXJMaW1pdCB2YWx1ZS4gVGhpcyBkZXRlcm1pbmVzIGhvdyBzaGFycCBhIGNvcm5lciB3aXRoIGxpbmVKb2luOiAnbWl0ZXInIHdpbGwgbmVlZCB0byBiZSBiZWZvcmVcclxuICAgICAqIGl0IGdldHMgY3V0IG9mZiB0byB0aGUgJ2JldmVsJyBiZWhhdmlvci5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHNldE1pdGVyTGltaXQoIG1pdGVyTGltaXQ6IG51bWJlciApOiB0aGlzIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIG1pdGVyTGltaXQgKSwgJ21pdGVyTGltaXQgc2hvdWxkIGJlIGEgZmluaXRlIG51bWJlcicgKTtcclxuXHJcbiAgICAgIGlmICggdGhpcy5fbGluZURyYXdpbmdTdHlsZXMubWl0ZXJMaW1pdCAhPT0gbWl0ZXJMaW1pdCApIHtcclxuICAgICAgICB0aGlzLl9saW5lRHJhd2luZ1N0eWxlcy5taXRlckxpbWl0ID0gbWl0ZXJMaW1pdDtcclxuICAgICAgICB0aGlzLmludmFsaWRhdGVTdHJva2UoKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc3RhdGVMZW4gPSB0aGlzLl9kcmF3YWJsZXMubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHN0YXRlTGVuOyBpKysgKSB7XHJcbiAgICAgICAgICAoIHRoaXMuX2RyYXdhYmxlc1sgaSBdIGFzIHVua25vd24gYXMgVFBhaW50YWJsZURyYXdhYmxlICkubWFya0RpcnR5TGluZU9wdGlvbnMoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldCBtaXRlckxpbWl0KCB2YWx1ZTogbnVtYmVyICkgeyB0aGlzLnNldE1pdGVyTGltaXQoIHZhbHVlICk7IH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IG1pdGVyTGltaXQoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0TWl0ZXJMaW1pdCgpOyB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBtaXRlckxpbWl0IHZhbHVlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0TWl0ZXJMaW1pdCgpOiBudW1iZXIge1xyXG4gICAgICByZXR1cm4gdGhpcy5fbGluZURyYXdpbmdTdHlsZXMubWl0ZXJMaW1pdDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgdGhlIGxpbmUgZGFzaCBwYXR0ZXJuLiBTaG91bGQgYmUgYW4gYXJyYXkgb2YgbnVtYmVycyBcIm9uXCIgYW5kIFwib2ZmXCIgYWx0ZXJuYXRpbmcuIEFuIGVtcHR5IGFycmF5XHJcbiAgICAgKiBpbmRpY2F0ZXMgbm8gZGFzaGluZy5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHNldExpbmVEYXNoKCBsaW5lRGFzaDogbnVtYmVyW10gKTogdGhpcyB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIEFycmF5LmlzQXJyYXkoIGxpbmVEYXNoICkgJiYgbGluZURhc2guZXZlcnkoIG4gPT4gdHlwZW9mIG4gPT09ICdudW1iZXInICYmIGlzRmluaXRlKCBuICkgJiYgbiA+PSAwICksXHJcbiAgICAgICAgJ2xpbmVEYXNoIHNob3VsZCBiZSBhbiBhcnJheSBvZiBmaW5pdGUgbm9uLW5lZ2F0aXZlIG51bWJlcnMnICk7XHJcblxyXG4gICAgICBpZiAoIHRoaXMuX2xpbmVEcmF3aW5nU3R5bGVzLmxpbmVEYXNoICE9PSBsaW5lRGFzaCApIHtcclxuICAgICAgICB0aGlzLl9saW5lRHJhd2luZ1N0eWxlcy5saW5lRGFzaCA9IGxpbmVEYXNoIHx8IFtdO1xyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZVN0cm9rZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBzdGF0ZUxlbiA9IHRoaXMuX2RyYXdhYmxlcy5sZW5ndGg7XHJcbiAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgc3RhdGVMZW47IGkrKyApIHtcclxuICAgICAgICAgICggdGhpcy5fZHJhd2FibGVzWyBpIF0gYXMgdW5rbm93biBhcyBUUGFpbnRhYmxlRHJhd2FibGUgKS5tYXJrRGlydHlMaW5lT3B0aW9ucygpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0IGxpbmVEYXNoKCB2YWx1ZTogbnVtYmVyW10gKSB7IHRoaXMuc2V0TGluZURhc2goIHZhbHVlICk7IH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGxpbmVEYXNoKCk6IG51bWJlcltdIHsgcmV0dXJuIHRoaXMuZ2V0TGluZURhc2goKTsgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0cyB0aGUgbGluZSBkYXNoIHBhdHRlcm4uIEFuIGVtcHR5IGFycmF5IGlzIHRoZSBkZWZhdWx0LCBpbmRpY2F0aW5nIG5vIGRhc2hpbmcuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXRMaW5lRGFzaCgpOiBudW1iZXJbXSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9saW5lRHJhd2luZ1N0eWxlcy5saW5lRGFzaDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgd2hldGhlciB0aGUgc3Ryb2tlIHdpbGwgYmUgZGFzaGVkLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgaGFzTGluZURhc2goKTogYm9vbGVhbiB7XHJcbiAgICAgIHJldHVybiAhIXRoaXMuX2xpbmVEcmF3aW5nU3R5bGVzLmxpbmVEYXNoLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgdGhlIG9mZnNldCBvZiB0aGUgbGluZSBkYXNoIHBhdHRlcm4gZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHN0cm9rZS4gRGVmYXVsdHMgdG8gMC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHNldExpbmVEYXNoT2Zmc2V0KCBsaW5lRGFzaE9mZnNldDogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggbGluZURhc2hPZmZzZXQgKSxcclxuICAgICAgICBgbGluZURhc2hPZmZzZXQgc2hvdWxkIGJlIGEgbnVtYmVyLCBub3QgJHtsaW5lRGFzaE9mZnNldH1gICk7XHJcblxyXG4gICAgICBpZiAoIHRoaXMuX2xpbmVEcmF3aW5nU3R5bGVzLmxpbmVEYXNoT2Zmc2V0ICE9PSBsaW5lRGFzaE9mZnNldCApIHtcclxuICAgICAgICB0aGlzLl9saW5lRHJhd2luZ1N0eWxlcy5saW5lRGFzaE9mZnNldCA9IGxpbmVEYXNoT2Zmc2V0O1xyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZVN0cm9rZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBzdGF0ZUxlbiA9IHRoaXMuX2RyYXdhYmxlcy5sZW5ndGg7XHJcbiAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgc3RhdGVMZW47IGkrKyApIHtcclxuICAgICAgICAgICggdGhpcy5fZHJhd2FibGVzWyBpIF0gYXMgdW5rbm93biBhcyBUUGFpbnRhYmxlRHJhd2FibGUgKS5tYXJrRGlydHlMaW5lT3B0aW9ucygpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0IGxpbmVEYXNoT2Zmc2V0KCB2YWx1ZTogbnVtYmVyICkgeyB0aGlzLnNldExpbmVEYXNoT2Zmc2V0KCB2YWx1ZSApOyB9XHJcblxyXG4gICAgcHVibGljIGdldCBsaW5lRGFzaE9mZnNldCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRMaW5lRGFzaE9mZnNldCgpOyB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBvZmZzZXQgb2YgdGhlIGxpbmUgZGFzaCBwYXR0ZXJuIGZyb20gdGhlIHN0YXJ0IG9mIHRoZSBzdHJva2UuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXRMaW5lRGFzaE9mZnNldCgpOiBudW1iZXIge1xyXG4gICAgICByZXR1cm4gdGhpcy5fbGluZURyYXdpbmdTdHlsZXMubGluZURhc2hPZmZzZXQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXRzIHRoZSBMaW5lU3R5bGVzIG9iamVjdCAoaXQgZGV0ZXJtaW5lcyBzdHJva2UgYXBwZWFyYW5jZSkuIFRoZSBwYXNzZWQtaW4gb2JqZWN0IHdpbGwgYmUgbXV0YXRlZCBhcyBuZWVkZWQuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzZXRMaW5lU3R5bGVzKCBsaW5lU3R5bGVzOiBMaW5lU3R5bGVzICk6IHRoaXMge1xyXG4gICAgICB0aGlzLl9saW5lRHJhd2luZ1N0eWxlcyA9IGxpbmVTdHlsZXM7XHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZVN0cm9rZSgpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0IGxpbmVTdHlsZXMoIHZhbHVlOiBMaW5lU3R5bGVzICkgeyB0aGlzLnNldExpbmVTdHlsZXMoIHZhbHVlICk7IH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGxpbmVTdHlsZXMoKTogTGluZVN0eWxlcyB7IHJldHVybiB0aGlzLmdldExpbmVTdHlsZXMoKTsgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgY29tcG9zaXRlIHtMaW5lU3R5bGVzfSBvYmplY3QsIHRoYXQgZGV0ZXJtaW5lcyBzdHJva2UgYXBwZWFyYW5jZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldExpbmVTdHlsZXMoKTogTGluZVN0eWxlcyB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9saW5lRHJhd2luZ1N0eWxlcztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgdGhlIGNhY2hlZCBwYWludHMgdG8gdGhlIGlucHV0IGFycmF5IChhIGRlZmVuc2l2ZSBjb3B5KS4gTm90ZSB0aGF0IGl0IGFsc28gZmlsdGVycyBvdXQgZmlsbHMgdGhhdCBhcmVcclxuICAgICAqIG5vdCBjb25zaWRlcmVkIHBhaW50cyAoZS5nLiBzdHJpbmdzLCBDb2xvcnMsIGV0Yy4pLlxyXG4gICAgICpcclxuICAgICAqIFdoZW4gdGhpcyBOb2RlIGlzIGRpc3BsYXllZCBpbiBTVkcsIGl0IHdpbGwgZm9yY2UgdGhlIHByZXNlbmNlIG9mIHRoZSBjYWNoZWQgcGFpbnQgdG8gYmUgc3RvcmVkIGluIHRoZSBTVkcnc1xyXG4gICAgICogPGRlZnM+IGVsZW1lbnQsIHNvIHRoYXQgd2UgY2FuIHN3aXRjaCBxdWlja2x5IHRvIHVzZSB0aGUgZ2l2ZW4gcGFpbnQgKGluc3RlYWQgb2YgaGF2aW5nIHRvIGNyZWF0ZSBpdCBvbiB0aGVcclxuICAgICAqIFNWRy1zaWRlIHdoZW5ldmVyIHRoZSBzd2l0Y2ggaXMgbWFkZSkuXHJcbiAgICAgKlxyXG4gICAgICogQWxzbyBub3RlIHRoYXQgZHVwbGljYXRlIHBhaW50cyBhcmUgYWNjZXB0YWJsZSwgYW5kIGRvbid0IG5lZWQgdG8gYmUgZmlsdGVyZWQgb3V0IGJlZm9yZS1oYW5kLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc2V0Q2FjaGVkUGFpbnRzKCBwYWludHM6IFRQYWludFtdICk6IHRoaXMge1xyXG4gICAgICB0aGlzLl9jYWNoZWRQYWludHMgPSBwYWludHMuZmlsdGVyKCAoIHBhaW50OiBUUGFpbnQgKTogcGFpbnQgaXMgUGFpbnQgPT4gcGFpbnQgaW5zdGFuY2VvZiBQYWludCApO1xyXG5cclxuICAgICAgY29uc3Qgc3RhdGVMZW4gPSB0aGlzLl9kcmF3YWJsZXMubGVuZ3RoO1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzdGF0ZUxlbjsgaSsrICkge1xyXG4gICAgICAgICggdGhpcy5fZHJhd2FibGVzWyBpIF0gYXMgdW5rbm93biBhcyBUUGFpbnRhYmxlRHJhd2FibGUgKS5tYXJrRGlydHlDYWNoZWRQYWludHMoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldCBjYWNoZWRQYWludHMoIHZhbHVlOiBUUGFpbnRbXSApIHsgdGhpcy5zZXRDYWNoZWRQYWludHMoIHZhbHVlICk7IH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGNhY2hlZFBhaW50cygpOiBUUGFpbnRbXSB7IHJldHVybiB0aGlzLmdldENhY2hlZFBhaW50cygpOyB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBjYWNoZWQgcGFpbnRzLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0Q2FjaGVkUGFpbnRzKCk6IFRQYWludFtdIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX2NhY2hlZFBhaW50cztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZHMgYSBjYWNoZWQgcGFpbnQuIERvZXMgbm90aGluZyBpZiBwYWludCBpcyBqdXN0IGEgbm9ybWFsIGZpbGwgKHN0cmluZywgQ29sb3IpLCBidXQgZm9yIGdyYWRpZW50cyBhbmRcclxuICAgICAqIHBhdHRlcm5zLCBpdCB3aWxsIGJlIG1hZGUgZmFzdGVyIHRvIHN3aXRjaCB0by5cclxuICAgICAqXHJcbiAgICAgKiBXaGVuIHRoaXMgTm9kZSBpcyBkaXNwbGF5ZWQgaW4gU1ZHLCBpdCB3aWxsIGZvcmNlIHRoZSBwcmVzZW5jZSBvZiB0aGUgY2FjaGVkIHBhaW50IHRvIGJlIHN0b3JlZCBpbiB0aGUgU1ZHJ3NcclxuICAgICAqIDxkZWZzPiBlbGVtZW50LCBzbyB0aGF0IHdlIGNhbiBzd2l0Y2ggcXVpY2tseSB0byB1c2UgdGhlIGdpdmVuIHBhaW50IChpbnN0ZWFkIG9mIGhhdmluZyB0byBjcmVhdGUgaXQgb24gdGhlXHJcbiAgICAgKiBTVkctc2lkZSB3aGVuZXZlciB0aGUgc3dpdGNoIGlzIG1hZGUpLlxyXG4gICAgICpcclxuICAgICAqIEFsc28gbm90ZSB0aGF0IGR1cGxpY2F0ZSBwYWludHMgYXJlIGFjY2VwdGFibGUsIGFuZCBkb24ndCBuZWVkIHRvIGJlIGZpbHRlcmVkIG91dCBiZWZvcmUtaGFuZC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGFkZENhY2hlZFBhaW50KCBwYWludDogVFBhaW50ICk6IHZvaWQge1xyXG4gICAgICBpZiAoIHBhaW50IGluc3RhbmNlb2YgUGFpbnQgKSB7XHJcbiAgICAgICAgdGhpcy5fY2FjaGVkUGFpbnRzLnB1c2goIHBhaW50ICk7XHJcblxyXG4gICAgICAgIGNvbnN0IHN0YXRlTGVuID0gdGhpcy5fZHJhd2FibGVzLmxlbmd0aDtcclxuICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzdGF0ZUxlbjsgaSsrICkge1xyXG4gICAgICAgICAgKCB0aGlzLl9kcmF3YWJsZXNbIGkgXSBhcyB1bmtub3duIGFzIFRQYWludGFibGVEcmF3YWJsZSApLm1hcmtEaXJ0eUNhY2hlZFBhaW50cygpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlcyBhIGNhY2hlZCBwYWludC4gRG9lcyBub3RoaW5nIGlmIHBhaW50IGlzIGp1c3QgYSBub3JtYWwgZmlsbCAoc3RyaW5nLCBDb2xvciksIGJ1dCBmb3IgZ3JhZGllbnRzIGFuZFxyXG4gICAgICogcGF0dGVybnMgaXQgd2lsbCByZW1vdmUgYW55IGV4aXN0aW5nIGNhY2hlZCBwYWludC4gSWYgaXQgd2FzIGFkZGVkIG1vcmUgdGhhbiBvbmNlLCBpdCB3aWxsIG5lZWQgdG8gYmUgcmVtb3ZlZFxyXG4gICAgICogbW9yZSB0aGFuIG9uY2UuXHJcbiAgICAgKlxyXG4gICAgICogV2hlbiB0aGlzIE5vZGUgaXMgZGlzcGxheWVkIGluIFNWRywgaXQgd2lsbCBmb3JjZSB0aGUgcHJlc2VuY2Ugb2YgdGhlIGNhY2hlZCBwYWludCB0byBiZSBzdG9yZWQgaW4gdGhlIFNWRydzXHJcbiAgICAgKiA8ZGVmcz4gZWxlbWVudCwgc28gdGhhdCB3ZSBjYW4gc3dpdGNoIHF1aWNrbHkgdG8gdXNlIHRoZSBnaXZlbiBwYWludCAoaW5zdGVhZCBvZiBoYXZpbmcgdG8gY3JlYXRlIGl0IG9uIHRoZVxyXG4gICAgICogU1ZHLXNpZGUgd2hlbmV2ZXIgdGhlIHN3aXRjaCBpcyBtYWRlKS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlbW92ZUNhY2hlZFBhaW50KCBwYWludDogVFBhaW50ICk6IHZvaWQge1xyXG4gICAgICBpZiAoIHBhaW50IGluc3RhbmNlb2YgUGFpbnQgKSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggXy5pbmNsdWRlcyggdGhpcy5fY2FjaGVkUGFpbnRzLCBwYWludCApICk7XHJcblxyXG4gICAgICAgIGFycmF5UmVtb3ZlKCB0aGlzLl9jYWNoZWRQYWludHMsIHBhaW50ICk7XHJcblxyXG4gICAgICAgIGNvbnN0IHN0YXRlTGVuID0gdGhpcy5fZHJhd2FibGVzLmxlbmd0aDtcclxuICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzdGF0ZUxlbjsgaSsrICkge1xyXG4gICAgICAgICAgKCB0aGlzLl9kcmF3YWJsZXNbIGkgXSBhcyB1bmtub3duIGFzIFRQYWludGFibGVEcmF3YWJsZSApLm1hcmtEaXJ0eUNhY2hlZFBhaW50cygpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXBwbGllcyB0aGUgZmlsbCB0byBhIENhbnZhcyBjb250ZXh0IHdyYXBwZXIsIGJlZm9yZSBmaWxsaW5nLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgICAqL1xyXG4gICAgcHVibGljIGJlZm9yZUNhbnZhc0ZpbGwoIHdyYXBwZXI6IENhbnZhc0NvbnRleHRXcmFwcGVyICk6IHZvaWQge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmdldEZpbGxWYWx1ZSgpICE9PSBudWxsICk7XHJcblxyXG4gICAgICBjb25zdCBmaWxsVmFsdWUgPSB0aGlzLmdldEZpbGxWYWx1ZSgpITtcclxuXHJcbiAgICAgIHdyYXBwZXIuc2V0RmlsbFN0eWxlKCBmaWxsVmFsdWUgKTtcclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciAtIEZvciBwZXJmb3JtYW5jZSwgd2UgY291bGQgY2hlY2sgdGhpcyBieSBydWxpbmcgb3V0IHN0cmluZyBhbmQgJ3RyYW5zZm9ybU1hdHJpeCcgaW4gZmlsbFZhbHVlXHJcbiAgICAgIGlmICggZmlsbFZhbHVlLnRyYW5zZm9ybU1hdHJpeCApIHtcclxuICAgICAgICB3cmFwcGVyLmNvbnRleHQuc2F2ZSgpO1xyXG4gICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgICAgICBmaWxsVmFsdWUudHJhbnNmb3JtTWF0cml4LmNhbnZhc0FwcGVuZFRyYW5zZm9ybSggd3JhcHBlci5jb250ZXh0ICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFVuLWFwcGxpZXMgdGhlIGZpbGwgdG8gYSBDYW52YXMgY29udGV4dCB3cmFwcGVyLCBhZnRlciBmaWxsaW5nLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgICAqL1xyXG4gICAgcHVibGljIGFmdGVyQ2FudmFzRmlsbCggd3JhcHBlcjogQ2FudmFzQ29udGV4dFdyYXBwZXIgKTogdm9pZCB7XHJcbiAgICAgIGNvbnN0IGZpbGxWYWx1ZSA9IHRoaXMuZ2V0RmlsbFZhbHVlKCk7XHJcblxyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICAgIGlmICggZmlsbFZhbHVlLnRyYW5zZm9ybU1hdHJpeCApIHtcclxuICAgICAgICB3cmFwcGVyLmNvbnRleHQucmVzdG9yZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBcHBsaWVzIHRoZSBzdHJva2UgdG8gYSBDYW52YXMgY29udGV4dCB3cmFwcGVyLCBiZWZvcmUgc3Ryb2tpbmcuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgYmVmb3JlQ2FudmFzU3Ryb2tlKCB3cmFwcGVyOiBDYW52YXNDb250ZXh0V3JhcHBlciApOiB2b2lkIHtcclxuICAgICAgY29uc3Qgc3Ryb2tlVmFsdWUgPSB0aGlzLmdldFN0cm9rZVZhbHVlKCk7XHJcblxyXG4gICAgICAvLyBUT0RPOiBpcyB0aGVyZSBhIGJldHRlciB3YXkgb2Ygbm90IGNhbGxpbmcgc28gbWFueSB0aGluZ3Mgb24gZWFjaCBzdHJva2U/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAgIHdyYXBwZXIuc2V0U3Ryb2tlU3R5bGUoIHRoaXMuX3N0cm9rZSApO1xyXG4gICAgICB3cmFwcGVyLnNldExpbmVDYXAoIHRoaXMuZ2V0TGluZUNhcCgpICk7XHJcbiAgICAgIHdyYXBwZXIuc2V0TGluZUpvaW4oIHRoaXMuZ2V0TGluZUpvaW4oKSApO1xyXG5cclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciAtIGZvciBwZXJmb3JtYW5jZVxyXG4gICAgICBpZiAoIHN0cm9rZVZhbHVlLnRyYW5zZm9ybU1hdHJpeCApIHtcclxuXHJcbiAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICAgIGNvbnN0IHNjYWxlVmVjdG9yOiBWZWN0b3IyID0gc3Ryb2tlVmFsdWUudHJhbnNmb3JtTWF0cml4LmdldFNjYWxlVmVjdG9yKCk7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggTWF0aC5hYnMoIHNjYWxlVmVjdG9yLnggLSBzY2FsZVZlY3Rvci55ICkgPCAxZS03LCAnWW91IGNhbm5vdCBzcGVjaWZ5IGEgcGF0dGVybiBvciBncmFkaWVudCB0byBhIHN0cm9rZSB0aGF0IGRvZXMgbm90IGhhdmUgYSBzeW1tZXRyaWMgc2NhbGUuJyApO1xyXG4gICAgICAgIGNvbnN0IG1hdHJpeE11bHRpcGxpZXIgPSAxIC8gc2NhbGVWZWN0b3IueDtcclxuXHJcbiAgICAgICAgd3JhcHBlci5jb250ZXh0LnNhdmUoKTtcclxuICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICAgICAgc3Ryb2tlVmFsdWUudHJhbnNmb3JtTWF0cml4LmNhbnZhc0FwcGVuZFRyYW5zZm9ybSggd3JhcHBlci5jb250ZXh0ICk7XHJcblxyXG4gICAgICAgIHdyYXBwZXIuc2V0TGluZVdpZHRoKCB0aGlzLmdldExpbmVXaWR0aCgpICogbWF0cml4TXVsdGlwbGllciApO1xyXG4gICAgICAgIHdyYXBwZXIuc2V0TWl0ZXJMaW1pdCggdGhpcy5nZXRNaXRlckxpbWl0KCkgKiBtYXRyaXhNdWx0aXBsaWVyICk7XHJcbiAgICAgICAgd3JhcHBlci5zZXRMaW5lRGFzaCggdGhpcy5nZXRMaW5lRGFzaCgpLm1hcCggZGFzaCA9PiBkYXNoICogbWF0cml4TXVsdGlwbGllciApICk7XHJcbiAgICAgICAgd3JhcHBlci5zZXRMaW5lRGFzaE9mZnNldCggdGhpcy5nZXRMaW5lRGFzaE9mZnNldCgpICogbWF0cml4TXVsdGlwbGllciApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHdyYXBwZXIuc2V0TGluZVdpZHRoKCB0aGlzLmdldExpbmVXaWR0aCgpICk7XHJcbiAgICAgICAgd3JhcHBlci5zZXRNaXRlckxpbWl0KCB0aGlzLmdldE1pdGVyTGltaXQoKSApO1xyXG4gICAgICAgIHdyYXBwZXIuc2V0TGluZURhc2goIHRoaXMuZ2V0TGluZURhc2goKSApO1xyXG4gICAgICAgIHdyYXBwZXIuc2V0TGluZURhc2hPZmZzZXQoIHRoaXMuZ2V0TGluZURhc2hPZmZzZXQoKSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVbi1hcHBsaWVzIHRoZSBzdHJva2UgdG8gYSBDYW52YXMgY29udGV4dCB3cmFwcGVyLCBhZnRlciBzdHJva2luZy4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBhZnRlckNhbnZhc1N0cm9rZSggd3JhcHBlcjogQ2FudmFzQ29udGV4dFdyYXBwZXIgKTogdm9pZCB7XHJcbiAgICAgIGNvbnN0IHN0cm9rZVZhbHVlID0gdGhpcy5nZXRTdHJva2VWYWx1ZSgpO1xyXG5cclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciAtIGZvciBwZXJmb3JtYW5jZVxyXG4gICAgICBpZiAoIHN0cm9rZVZhbHVlLnRyYW5zZm9ybU1hdHJpeCApIHtcclxuICAgICAgICB3cmFwcGVyLmNvbnRleHQucmVzdG9yZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJZiBhcHBsaWNhYmxlLCByZXR1cm5zIHRoZSBDU1MgY29sb3IgZm9yIHRoZSBmaWxsLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0Q1NTRmlsbCgpOiBzdHJpbmcge1xyXG4gICAgICBjb25zdCBmaWxsVmFsdWUgPSB0aGlzLmdldEZpbGxWYWx1ZSgpO1xyXG4gICAgICAvLyBpZiBpdCdzIGEgQ29sb3Igb2JqZWN0LCBnZXQgdGhlIGNvcnJlc3BvbmRpbmcgQ1NTXHJcbiAgICAgIC8vICd0cmFuc3BhcmVudCcgd2lsbCBtYWtlIHVzIGludmlzaWJsZSBpZiB0aGUgZmlsbCBpcyBudWxsXHJcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSB0b0NTUyBjaGVja3MgZm9yIGNvbG9yLCBsZWZ0IGZvciBwZXJmb3JtYW5jZVxyXG4gICAgICByZXR1cm4gZmlsbFZhbHVlID8gKCBmaWxsVmFsdWUudG9DU1MgPyBmaWxsVmFsdWUudG9DU1MoKSA6IGZpbGxWYWx1ZSApIDogJ3RyYW5zcGFyZW50JztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIElmIGFwcGxpY2FibGUsIHJldHVybnMgdGhlIENTUyBjb2xvciBmb3IgdGhlIHN0cm9rZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldFNpbXBsZUNTU1N0cm9rZSgpOiBzdHJpbmcge1xyXG4gICAgICBjb25zdCBzdHJva2VWYWx1ZSA9IHRoaXMuZ2V0U3Ryb2tlVmFsdWUoKTtcclxuICAgICAgLy8gaWYgaXQncyBhIENvbG9yIG9iamVjdCwgZ2V0IHRoZSBjb3JyZXNwb25kaW5nIENTU1xyXG4gICAgICAvLyAndHJhbnNwYXJlbnQnIHdpbGwgbWFrZSB1cyBpbnZpc2libGUgaWYgdGhlIGZpbGwgaXMgbnVsbFxyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gdG9DU1MgY2hlY2tzIGZvciBjb2xvciwgbGVmdCBmb3IgcGVyZm9ybWFuY2VcclxuICAgICAgcmV0dXJuIHN0cm9rZVZhbHVlID8gKCBzdHJva2VWYWx1ZS50b0NTUyA/IHN0cm9rZVZhbHVlLnRvQ1NTKCkgOiBzdHJva2VWYWx1ZSApIDogJ3RyYW5zcGFyZW50JztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIGZpbGwtc3BlY2lmaWMgcHJvcGVydHkgc3RyaW5nIGZvciB1c2Ugd2l0aCB0b1N0cmluZygpLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gc3BhY2VzIC0gV2hpdGVzcGFjZSB0byBhZGRcclxuICAgICAqIEBwYXJhbSByZXN1bHRcclxuICAgICAqL1xyXG4gICAgcHVibGljIGFwcGVuZEZpbGxhYmxlUHJvcFN0cmluZyggc3BhY2VzOiBzdHJpbmcsIHJlc3VsdDogc3RyaW5nICk6IHN0cmluZyB7XHJcbiAgICAgIGlmICggdGhpcy5fZmlsbCApIHtcclxuICAgICAgICBpZiAoIHJlc3VsdCApIHtcclxuICAgICAgICAgIHJlc3VsdCArPSAnLFxcbic7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggdHlwZW9mIHRoaXMuZ2V0RmlsbFZhbHVlKCkgPT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgICAgcmVzdWx0ICs9IGAke3NwYWNlc31maWxsOiAnJHt0aGlzLmdldEZpbGxWYWx1ZSgpfSdgO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHJlc3VsdCArPSBgJHtzcGFjZXN9ZmlsbDogJHt0aGlzLmdldEZpbGxWYWx1ZSgpfWA7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgc3Ryb2tlLXNwZWNpZmljIHByb3BlcnR5IHN0cmluZyBmb3IgdXNlIHdpdGggdG9TdHJpbmcoKS4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHNwYWNlcyAtIFdoaXRlc3BhY2UgdG8gYWRkXHJcbiAgICAgKiBAcGFyYW0gcmVzdWx0XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBhcHBlbmRTdHJva2FibGVQcm9wU3RyaW5nKCBzcGFjZXM6IHN0cmluZywgcmVzdWx0OiBzdHJpbmcgKTogc3RyaW5nIHtcclxuICAgICAgZnVuY3Rpb24gYWRkUHJvcCgga2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcsIG5vd3JhcD86IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKCByZXN1bHQgKSB7XHJcbiAgICAgICAgICByZXN1bHQgKz0gJyxcXG4nO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoICFub3dyYXAgJiYgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyApIHtcclxuICAgICAgICAgIHJlc3VsdCArPSBgJHtzcGFjZXMgKyBrZXl9OiAnJHt2YWx1ZX0nYDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICByZXN1bHQgKz0gYCR7c3BhY2VzICsga2V5fTogJHt2YWx1ZX1gO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCB0aGlzLl9zdHJva2UgKSB7XHJcbiAgICAgICAgY29uc3QgZGVmYXVsdFN0eWxlcyA9IG5ldyBMaW5lU3R5bGVzKCk7XHJcbiAgICAgICAgY29uc3Qgc3Ryb2tlVmFsdWUgPSB0aGlzLmdldFN0cm9rZVZhbHVlKCk7XHJcbiAgICAgICAgaWYgKCB0eXBlb2Ygc3Ryb2tlVmFsdWUgPT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgICAgYWRkUHJvcCggJ3N0cm9rZScsIHN0cm9rZVZhbHVlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgYWRkUHJvcCggJ3N0cm9rZScsIHN0cm9rZVZhbHVlID8gc3Ryb2tlVmFsdWUudG9TdHJpbmcoKSA6ICdudWxsJywgdHJ1ZSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgXy5lYWNoKCBbICdsaW5lV2lkdGgnLCAnbGluZUNhcCcsICdtaXRlckxpbWl0JywgJ2xpbmVKb2luJywgJ2xpbmVEYXNoT2Zmc2V0JyBdLCBwcm9wID0+IHtcclxuICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgICAgICAgIGlmICggdGhpc1sgcHJvcCBdICE9PSBkZWZhdWx0U3R5bGVzWyBwcm9wIF0gKSB7XHJcbiAgICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgICAgICAgICAgYWRkUHJvcCggcHJvcCwgdGhpc1sgcHJvcCBdICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSApO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMubGluZURhc2gubGVuZ3RoICkge1xyXG4gICAgICAgICAgYWRkUHJvcCggJ2xpbmVEYXNoJywgSlNPTi5zdHJpbmdpZnkoIHRoaXMubGluZURhc2ggKSwgdHJ1ZSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIERldGVybWluZXMgdGhlIGRlZmF1bHQgYWxsb3dlZCByZW5kZXJlcnMgKHJldHVybmVkIHZpYSB0aGUgUmVuZGVyZXIgYml0bWFzaykgdGhhdCBhcmUgYWxsb3dlZCwgZ2l2ZW4gdGhlXHJcbiAgICAgKiBjdXJyZW50IGZpbGwgb3B0aW9ucy4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICAgKlxyXG4gICAgICogVGhpcyB3aWxsIGJlIHVzZWQgZm9yIGFsbCB0eXBlcyB0aGF0IGRpcmVjdGx5IG1peCBpbiBQYWludGFibGUgKGkuZS4gUGF0aCBhbmQgVGV4dCksIGJ1dCBtYXkgYmUgb3ZlcnJpZGRlblxyXG4gICAgICogYnkgc3VidHlwZXMuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMgLSBSZW5kZXJlciBiaXRtYXNrLCBzZWUgUmVuZGVyZXIgZm9yIGRldGFpbHNcclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldEZpbGxSZW5kZXJlckJpdG1hc2soKTogbnVtYmVyIHtcclxuICAgICAgbGV0IGJpdG1hc2sgPSAwO1xyXG5cclxuICAgICAgLy8gU2FmYXJpIDUgaGFzIGJ1Z2d5IGlzc3VlcyB3aXRoIFNWRyBncmFkaWVudHNcclxuICAgICAgaWYgKCAhKCBpc1NhZmFyaTUgJiYgdGhpcy5fZmlsbCBpbnN0YW5jZW9mIEdyYWRpZW50ICkgKSB7XHJcbiAgICAgICAgYml0bWFzayB8PSBSZW5kZXJlci5iaXRtYXNrU1ZHO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyB3ZSBhbHdheXMgaGF2ZSBDYW52YXMgc3VwcG9ydD9cclxuICAgICAgYml0bWFzayB8PSBSZW5kZXJlci5iaXRtYXNrQ2FudmFzO1xyXG5cclxuICAgICAgaWYgKCAhdGhpcy5oYXNGaWxsKCkgKSB7XHJcbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgbm8gZmlsbCwgaXQgaXMgc3VwcG9ydGVkIGJ5IERPTSBhbmQgV2ViR0xcclxuICAgICAgICBiaXRtYXNrIHw9IFJlbmRlcmVyLmJpdG1hc2tET007XHJcbiAgICAgICAgYml0bWFzayB8PSBSZW5kZXJlci5iaXRtYXNrV2ViR0w7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBQYXR0ZXJuICkge1xyXG4gICAgICAgIC8vIG5vIHBhdHRlcm4gc3VwcG9ydCBmb3IgRE9NIG9yIFdlYkdMIChmb3Igbm93ISlcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggdGhpcy5fZmlsbCBpbnN0YW5jZW9mIEdyYWRpZW50ICkge1xyXG4gICAgICAgIC8vIG5vIGdyYWRpZW50IHN1cHBvcnQgZm9yIERPTSBvciBXZWJHTCAoZm9yIG5vdyEpXHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gc29saWQgZmlsbHMgYWx3YXlzIHN1cHBvcnRlZCBmb3IgRE9NIGFuZCBXZWJHTFxyXG4gICAgICAgIGJpdG1hc2sgfD0gUmVuZGVyZXIuYml0bWFza0RPTTtcclxuICAgICAgICBiaXRtYXNrIHw9IFJlbmRlcmVyLmJpdG1hc2tXZWJHTDtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGJpdG1hc2s7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEZXRlcm1pbmVzIHRoZSBkZWZhdWx0IGFsbG93ZWQgcmVuZGVyZXJzIChyZXR1cm5lZCB2aWEgdGhlIFJlbmRlcmVyIGJpdG1hc2spIHRoYXQgYXJlIGFsbG93ZWQsIGdpdmVuIHRoZVxyXG4gICAgICogY3VycmVudCBzdHJva2Ugb3B0aW9ucy4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICAgKlxyXG4gICAgICogVGhpcyB3aWxsIGJlIHVzZWQgZm9yIGFsbCB0eXBlcyB0aGF0IGRpcmVjdGx5IG1peCBpbiBQYWludGFibGUgKGkuZS4gUGF0aCBhbmQgVGV4dCksIGJ1dCBtYXkgYmUgb3ZlcnJpZGRlblxyXG4gICAgICogYnkgc3VidHlwZXMuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMgLSBSZW5kZXJlciBiaXRtYXNrLCBzZWUgUmVuZGVyZXIgZm9yIGRldGFpbHNcclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldFN0cm9rZVJlbmRlcmVyQml0bWFzaygpOiBudW1iZXIge1xyXG4gICAgICBsZXQgYml0bWFzayA9IDA7XHJcblxyXG4gICAgICBiaXRtYXNrIHw9IFJlbmRlcmVyLmJpdG1hc2tDYW52YXM7XHJcblxyXG4gICAgICAvLyBhbHdheXMgaGF2ZSBTVkcgc3VwcG9ydCAoZm9yIG5vdz8pXHJcbiAgICAgIGJpdG1hc2sgfD0gUmVuZGVyZXIuYml0bWFza1NWRztcclxuXHJcbiAgICAgIGlmICggIXRoaXMuaGFzU3Ryb2tlKCkgKSB7XHJcbiAgICAgICAgLy8gYWxsb3cgRE9NIHN1cHBvcnQgaWYgdGhlcmUgaXMgbm8gc3Ryb2tlIChzaW5jZSB0aGUgZmlsbCB3aWxsIGRldGVybWluZSB3aGF0IGlzIGF2YWlsYWJsZSlcclxuICAgICAgICBiaXRtYXNrIHw9IFJlbmRlcmVyLmJpdG1hc2tET007XHJcbiAgICAgICAgYml0bWFzayB8PSBSZW5kZXJlci5iaXRtYXNrV2ViR0w7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBiaXRtYXNrO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW52YWxpZGF0ZXMgb3VyIGN1cnJlbnQgZmlsbCwgdHJpZ2dlcmluZyByZWNvbXB1dGF0aW9uIG9mIGFueXRoaW5nIHRoYXQgZGVwZW5kZWQgb24gdGhlIG9sZCBmaWxsJ3MgdmFsdWVcclxuICAgICAqL1xyXG4gICAgcHVibGljIGludmFsaWRhdGVGaWxsKCk6IHZvaWQge1xyXG4gICAgICB0aGlzLmludmFsaWRhdGVTdXBwb3J0ZWRSZW5kZXJlcnMoKTtcclxuXHJcbiAgICAgIGNvbnN0IHN0YXRlTGVuID0gdGhpcy5fZHJhd2FibGVzLmxlbmd0aDtcclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgc3RhdGVMZW47IGkrKyApIHtcclxuICAgICAgICAoIHRoaXMuX2RyYXdhYmxlc1sgaSBdIGFzIHVua25vd24gYXMgVFBhaW50YWJsZURyYXdhYmxlICkubWFya0RpcnR5RmlsbCgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbnZhbGlkYXRlcyBvdXIgY3VycmVudCBzdHJva2UsIHRyaWdnZXJpbmcgcmVjb21wdXRhdGlvbiBvZiBhbnl0aGluZyB0aGF0IGRlcGVuZGVkIG9uIHRoZSBvbGQgc3Ryb2tlJ3MgdmFsdWVcclxuICAgICAqL1xyXG4gICAgcHVibGljIGludmFsaWRhdGVTdHJva2UoKTogdm9pZCB7XHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZVN1cHBvcnRlZFJlbmRlcmVycygpO1xyXG5cclxuICAgICAgY29uc3Qgc3RhdGVMZW4gPSB0aGlzLl9kcmF3YWJsZXMubGVuZ3RoO1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzdGF0ZUxlbjsgaSsrICkge1xyXG4gICAgICAgICggdGhpcy5fZHJhd2FibGVzWyBpIF0gYXMgdW5rbm93biBhcyBUUGFpbnRhYmxlRHJhd2FibGUgKS5tYXJrRGlydHlTdHJva2UoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcbn0gKTtcclxuXHJcbnNjZW5lcnkucmVnaXN0ZXIoICdQYWludGFibGUnLCBQYWludGFibGUgKTtcclxuXHJcbi8vIEB0cy1leHBlY3QtZXJyb3JcclxuUGFpbnRhYmxlLkRFRkFVTFRfT1BUSU9OUyA9IERFRkFVTFRfT1BUSU9OUztcclxuXHJcbmV4cG9ydCB7XHJcbiAgUGFpbnRhYmxlIGFzIGRlZmF1bHQsXHJcbiAgUEFJTlRBQkxFX0RSQVdBQkxFX01BUktfRkxBR1MsXHJcbiAgUEFJTlRBQkxFX09QVElPTl9LRVlTLFxyXG4gIERFRkFVTFRfT1BUSU9OUyxcclxuICBERUZBVUxUX09QVElPTlMgYXMgUEFJTlRBQkxFX0RFRkFVTFRfT1BUSU9OU1xyXG59OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxTQUFTQSwwQkFBMEIsRUFBcUJDLFVBQVUsUUFBUSw2QkFBNkI7QUFDdkcsT0FBT0MsV0FBVyxNQUFNLHNDQUFzQztBQUM5RCxPQUFPQyxtQkFBbUIsTUFBTSw4Q0FBOEM7QUFDOUUsT0FBT0MsV0FBVyxNQUFNLHNDQUFzQztBQUM5RCxPQUFPQyxRQUFRLE1BQU0sbUNBQW1DO0FBQ3hELE9BQU9DLE9BQU8sTUFBTSxrQ0FBa0M7QUFDdEQsU0FBK0JDLEtBQUssRUFBRUMsUUFBUSxFQUFrQkMsSUFBSSxFQUFFQyxLQUFLLEVBQUVDLFFBQVEsRUFBUUMsT0FBTyxFQUFrQkMsUUFBUSxFQUFFQyxPQUFPLFFBQTBDLGVBQWU7QUFJaE0sU0FBU0MsbUJBQW1CLFFBQVEsdUNBQXVDO0FBRTNFLE1B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