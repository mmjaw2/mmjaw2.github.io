// Copyright 2013-2024, University of Colorado Boulder

/**
 * Displays text that can be filled/stroked.
 *
 * For many font/text-related properties, it's helpful to understand the CSS equivalents (http://www.w3.org/TR/css3-fonts/).
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import StringProperty from '../../../axon/js/StringProperty.js';
import TinyForwardingProperty from '../../../axon/js/TinyForwardingProperty.js';
import escapeHTML from '../../../phet-core/js/escapeHTML.js';
import extendDefined from '../../../phet-core/js/extendDefined.js';
import platform from '../../../phet-core/js/platform.js';
import Tandem from '../../../tandem/js/Tandem.js';
import IOType from '../../../tandem/js/types/IOType.js';
import PhetioObject from '../../../tandem/js/PhetioObject.js';
import { Font, Node, Paintable, PAINTABLE_DRAWABLE_MARK_FLAGS, PAINTABLE_OPTION_KEYS, Renderer, scenery, TextBounds, TextCanvasDrawable, TextDOMDrawable, TextSVGDrawable } from '../imports.js';
import { combineOptions } from '../../../phet-core/js/optionize.js';
import phetioElementSelectionProperty from '../../../tandem/js/phetioElementSelectionProperty.js';
const STRING_PROPERTY_NAME = 'stringProperty'; // eslint-disable-line bad-sim-text

// constants
const TEXT_OPTION_KEYS = ['boundsMethod',
// {string} - Sets how bounds are determined for text, see setBoundsMethod() for more documentation
STRING_PROPERTY_NAME,
// {Property.<string>|null} - Sets forwarding of the stringProperty, see setStringProperty() for more documentation
'string',
// {string|number} - Sets the string to be displayed by this Text, see setString() for more documentation
'font',
// {Font|string} - Sets the font used for the text, see setFont() for more documentation
'fontWeight',
// {string|number} - Sets the weight of the current font, see setFont() for more documentation
'fontFamily',
// {string} - Sets the family of the current font, see setFont() for more documentation
'fontStretch',
// {string} - Sets the stretch of the current font, see setFont() for more documentation
'fontStyle',
// {string} - Sets the style of the current font, see setFont() for more documentation
'fontSize' // {string|number} - Sets the size of the current font, see setFont() for more documentation
];

// SVG bounds seems to be malfunctioning for Safari 5. Since we don't have a reproducible test machine for
// fast iteration, we'll guess the user agent and use DOM bounds instead of SVG.
// Hopefully the two constraints rule out any future Safari versions (fairly safe, but not impossible!)
const useDOMAsFastBounds = window.navigator.userAgent.includes('like Gecko) Version/5') && window.navigator.userAgent.includes('Safari/');
export default class Text extends Paintable(Node) {
  // The string to display

  // The font with which to display the text.
  // (scenery-internal)

  // (scenery-internal)

  // Whether the text is rendered as HTML or not. if defined (in a subtype constructor), use that value instead

  // The actual string displayed (can have non-breaking spaces and embedding marks rewritten).
  // When this is null, its value needs to be recomputed

  static STRING_PROPERTY_NAME = STRING_PROPERTY_NAME;
  static STRING_PROPERTY_TANDEM_NAME = STRING_PROPERTY_NAME;

  /**
   * @param string - See setString() for more documentation
   * @param [options] - Text-specific options are documented in TEXT_OPTION_KEYS above, and can be provided
   *                             along-side options for Node
   */
  constructor(string, options) {
    assert && assert(options === undefined || Object.getPrototypeOf(options) === Object.prototype, 'Extra prototype on Node options object is a code smell');
    super();

    // We'll initialize this by mutating.
    this._stringProperty = new TinyForwardingProperty('', true, this.onStringPropertyChange.bind(this));
    this._font = Font.DEFAULT;
    this._boundsMethod = 'hybrid';
    this._isHTML = false; // TODO: clean this up https://github.com/phetsims/scenery/issues/1581
    this._cachedRenderedText = null;
    const definedOptions = extendDefined({
      fill: '#000000',
      // Default to black filled string

      // phet-io
      tandemNameSuffix: 'Text',
      phetioType: Text.TextIO,
      phetioVisiblePropertyInstrumented: false
    }, options);
    assert && assert(!definedOptions.hasOwnProperty('string') && !definedOptions.hasOwnProperty(Text.STRING_PROPERTY_TANDEM_NAME), 'provide string and stringProperty through constructor arg please');
    if (typeof string === 'string' || typeof string === 'number') {
      definedOptions.string = string;
    } else {
      definedOptions.stringProperty = string;
    }
    this.mutate(definedOptions);
    this.invalidateSupportedRenderers(); // takes care of setting up supported renderers
  }
  mutate(options) {
    if (assert && options && options.hasOwnProperty('string') && options.hasOwnProperty(STRING_PROPERTY_NAME)) {
      assert && assert(options.stringProperty.value === options.string, 'If both string and stringProperty are provided, then values should match');
    }
    return super.mutate(options);
  }

  /**
   * Sets the string displayed by our node.
   *
   * @param string - The string to display. If it's a number, it will be cast to a string
   */
  setString(string) {
    assert && assert(string !== null && string !== undefined, 'String should be defined and non-null. Use the empty string if needed.');

    // cast it to a string (for numbers, etc., and do it before the change guard so we don't accidentally trigger on non-changed string)
    string = `${string}`;
    this._stringProperty.set(string);
    return this;
  }
  set string(value) {
    this.setString(value);
  }
  get string() {
    return this.getString();
  }

  /**
   * Returns the string displayed by our text Node.
   *
   * NOTE: If a number was provided to setString(), it will not be returned as a number here.
   */
  getString() {
    return this._stringProperty.value;
  }

  /**
   * Returns a potentially modified version of this.string, where spaces are replaced with non-breaking spaces,
   * and embedding marks are potentially simplified.
   */
  getRenderedText() {
    if (this._cachedRenderedText === null) {
      // Using the non-breaking space (&nbsp;) encoded as 0x00A0 in UTF-8
      this._cachedRenderedText = this.string.replace(' ', '\xA0');
      if (platform.edge) {
        // Simplify embedding marks to work around an Edge bug, see https://github.com/phetsims/scenery/issues/520
        this._cachedRenderedText = Text.simplifyEmbeddingMarks(this._cachedRenderedText);
      }
    }
    return this._cachedRenderedText;
  }
  get renderedText() {
    return this.getRenderedText();
  }

  /**
   * Called when our string Property changes values.
   */
  onStringPropertyChange() {
    this._cachedRenderedText = null;
    const stateLen = this._drawables.length;
    for (let i = 0; i < stateLen; i++) {
      this._drawables[i].markDirtyText();
    }
    this.invalidateText();
  }

  /**
   * See documentation for Node.setVisibleProperty, except this is for the text string.
   */
  setStringProperty(newTarget) {
    return this._stringProperty.setTargetProperty(newTarget, this, Text.STRING_PROPERTY_TANDEM_NAME);
  }
  set stringProperty(property) {
    this.setStringProperty(property);
  }
  get stringProperty() {
    return this.getStringProperty();
  }

  /**
   * Like Node.getVisibleProperty(), but for the text string. Note this is not the same as the Property provided in
   * setStringProperty. Thus is the nature of TinyForwardingProperty.
   */
  getStringProperty() {
    return this._stringProperty;
  }

  /**
   * See documentation and comments in Node.initializePhetioObject
   */
  initializePhetioObject(baseOptions, config) {
    // Track this, so we only override our stringProperty once.
    const wasInstrumented = this.isPhetioInstrumented();
    super.initializePhetioObject(baseOptions, config);
    if (Tandem.PHET_IO_ENABLED && !wasInstrumented && this.isPhetioInstrumented()) {
      this._stringProperty.initializePhetio(this, Text.STRING_PROPERTY_TANDEM_NAME, () => {
        return new StringProperty(this.string, combineOptions({
          // by default, texts should be readonly. Editable texts most likely pass in editable Properties from i18n model Properties, see https://github.com/phetsims/scenery/issues/1443
          phetioReadOnly: true,
          tandem: this.tandem.createTandem(Text.STRING_PROPERTY_TANDEM_NAME),
          phetioDocumentation: 'Property for the displayed text'
        }, config.stringPropertyOptions));
      });
    }
  }

  /**
   * Text supports a "string" selection mode, in which it will map to its stringProperty (if applicable), otherwise is
   * uses the default mouse-hit target from the supertype.
   */
  getPhetioMouseHitTarget(fromLinking = false) {
    return phetioElementSelectionProperty.value === 'string' ? this.getStringPropertyPhetioMouseHitTarget(fromLinking) : super.getPhetioMouseHitTarget(fromLinking);
  }
  getStringPropertyPhetioMouseHitTarget(fromLinking = false) {
    const targetStringProperty = this._stringProperty.getTargetProperty();

    // Even if this isn't PhET-iO instrumented, it still qualifies as this RichText's hit
    return targetStringProperty instanceof PhetioObject ? targetStringProperty.getPhetioMouseHitTarget(fromLinking) : 'phetioNotSelectable';
  }

  /**
   * Sets the method that is used to determine bounds from the text.
   *
   * Possible values:
   * - 'fast' - Measures using SVG, can be inaccurate. Can't be rendered in Canvas.
   * - 'fastCanvas' - Like 'fast', but allows rendering in Canvas.
   * - 'accurate' - Recursively renders to a Canvas to accurately determine bounds. Slow, but works with all renderers.
   * - 'hybrid' - [default] Cache SVG height, and uses Canvas measureText for the width.
   *
   * TODO: deprecate fast/fastCanvas options? https://github.com/phetsims/scenery/issues/1581
   *
   * NOTE: Most of these are unfortunately not hard guarantees that content is all inside of the returned bounds.
   *       'accurate' should probably be the only one where that guarantee can be assumed. Things like cyrillic in
   *       italic, combining marks and other unicode features can fail to be detected. This is particularly relevant
   *       for the height, as certain stacked accent marks or descenders can go outside of the prescribed range,
   *       and fast/canvasCanvas/hybrid will always return the same vertical bounds (top and bottom) for a given font
   *       when the text isn't the empty string.
   */
  setBoundsMethod(method) {
    assert && assert(method === 'fast' || method === 'fastCanvas' || method === 'accurate' || method === 'hybrid', 'Unknown Text boundsMethod');
    if (method !== this._boundsMethod) {
      this._boundsMethod = method;
      this.invalidateSupportedRenderers();
      const stateLen = this._drawables.length;
      for (let i = 0; i < stateLen; i++) {
        this._drawables[i].markDirtyBounds();
      }
      this.invalidateText();
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
   * Returns the current method to estimate the bounds of the text. See setBoundsMethod() for more information.
   */
  getBoundsMethod() {
    return this._boundsMethod;
  }

  /**
   * Returns a bitmask representing the supported renderers for the current configuration of the Text node.
   *
   * @returns - A bitmask that includes supported renderers, see Renderer for details.
   */
  getTextRendererBitmask() {
    let bitmask = 0;

    // canvas support (fast bounds may leak out of dirty rectangles)
    if (this._boundsMethod !== 'fast' && !this._isHTML) {
      bitmask |= Renderer.bitmaskCanvas;
    }
    if (!this._isHTML) {
      bitmask |= Renderer.bitmaskSVG;
    }

    // fill and stroke will determine whether we have DOM text support
    bitmask |= Renderer.bitmaskDOM;
    return bitmask;
  }

  /**
   * Triggers a check and update for what renderers the current configuration supports.
   * This should be called whenever something that could potentially change supported renderers happen (which can
   * be isHTML, boundsMethod, etc.)
   */
  invalidateSupportedRenderers() {
    this.setRendererBitmask(this.getFillRendererBitmask() & this.getStrokeRendererBitmask() & this.getTextRendererBitmask());
  }

  /**
   * Notifies that something about the text's potential bounds have changed (different string, different stroke or font,
   * etc.)
   */
  invalidateText() {
    this.invalidateSelf();

    // TODO: consider replacing this with a general dirty flag notification, and have DOM update bounds every frame? https://github.com/phetsims/scenery/issues/1581
    const stateLen = this._drawables.length;
    for (let i = 0; i < stateLen; i++) {
      this._drawables[i].markDirtyBounds();
    }

    // we may have changed renderers if parameters were changed!
    this.invalidateSupportedRenderers();
  }

  /**
   * Computes a more efficient selfBounds for our Text.
   *
   * @returns - Whether the self bounds changed.
   */
  updateSelfBounds() {
    // TODO: don't create another Bounds2 object just for this! https://github.com/phetsims/scenery/issues/1581
    let selfBounds;

    // investigate http://mudcu.be/journal/2011/01/html5-typographic-metrics/
    if (this._isHTML || useDOMAsFastBounds && this._boundsMethod !== 'accurate') {
      selfBounds = TextBounds.approximateDOMBounds(this._font, this.getDOMTextNode());
    } else if (this._boundsMethod === 'hybrid') {
      selfBounds = TextBounds.approximateHybridBounds(this._font, this.renderedText);
    } else if (this._boundsMethod === 'accurate') {
      selfBounds = TextBounds.accurateCanvasBounds(this);
    } else {
      assert && assert(this._boundsMethod === 'fast' || this._boundsMethod === 'fastCanvas');
      selfBounds = TextBounds.approximateSVGBounds(this._font, this.renderedText);
    }

    // for now, just add extra on, ignoring the possibility of mitered joints passing beyond
    if (this.hasStroke()) {
      selfBounds.dilate(this.getLineWidth() / 2);
    }
    const changed = !selfBounds.equals(this.selfBoundsProperty._value);
    if (changed) {
      this.selfBoundsProperty._value.set(selfBounds);
    }
    return changed;
  }

  /**
   * Called from (and overridden in) the Paintable trait, invalidates our current stroke, triggering recomputation of
   * anything that depended on the old stroke's value. (scenery-internal)
   */
  invalidateStroke() {
    // stroke can change both the bounds and renderer
    this.invalidateText();
    super.invalidateStroke();
  }

  /**
   * Called from (and overridden in) the Paintable trait, invalidates our current fill, triggering recomputation of
   * anything that depended on the old fill's value. (scenery-internal)
   */
  invalidateFill() {
    // fill type can change the renderer (gradient/fill not supported by DOM)
    this.invalidateText();
    super.invalidateFill();
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
    TextCanvasDrawable.prototype.paintCanvas(wrapper, this, matrix);
  }

  /**
   * Creates a DOM drawable for this Text. (scenery-internal)
   *
   * @param renderer - In the bitmask format specified by Renderer, which may contain additional bit flags.
   * @param instance - Instance object that will be associated with the drawable
   */
  createDOMDrawable(renderer, instance) {
    // @ts-expect-error
    return TextDOMDrawable.createFromPool(renderer, instance);
  }

  /**
   * Creates a SVG drawable for this Text. (scenery-internal)
   *
   * @param renderer - In the bitmask format specified by Renderer, which may contain additional bit flags.
   * @param instance - Instance object that will be associated with the drawable
   */
  createSVGDrawable(renderer, instance) {
    // @ts-expect-error
    return TextSVGDrawable.createFromPool(renderer, instance);
  }

  /**
   * Creates a Canvas drawable for this Text. (scenery-internal)
   *
   * @param renderer - In the bitmask format specified by Renderer, which may contain additional bit flags.
   * @param instance - Instance object that will be associated with the drawable
   */
  createCanvasDrawable(renderer, instance) {
    // @ts-expect-error
    return TextCanvasDrawable.createFromPool(renderer, instance);
  }

  /**
   * Returns a DOM element that contains the specified string. (scenery-internal)
   *
   * This is needed since we have to handle HTML text differently.
   */
  getDOMTextNode() {
    if (this._isHTML) {
      const span = document.createElement('span');
      span.innerHTML = this.string;
      return span;
    } else {
      return document.createTextNode(this.renderedText);
    }
  }

  /**
   * Returns a bounding box that should contain all self content in the local coordinate frame (our normal self bounds
   * aren't guaranteed this for Text)
   *
   * We need to add additional padding around the text when the text is in a container that could clip things badly
   * if the text is larger than the normal bounds computation.
   */
  getSafeSelfBounds() {
    const expansionFactor = 1; // we use a new bounding box with a new size of size * ( 1 + 2 * expansionFactor )

    const selfBounds = this.getSelfBounds();

    // NOTE: we'll keep this as an estimate for the bounds including stroke miters
    return selfBounds.dilatedXY(expansionFactor * selfBounds.width, expansionFactor * selfBounds.height);
  }

  /**
   * Sets the font of the Text node.
   *
   * This can either be a Scenery Font object, or a string. The string format is described by Font's constructor, and
   * is basically the CSS3 font shortcut format. If a string is provided, it will be wrapped with a new (immutable)
   * Scenery Font object.
   */
  setFont(font) {
    // We need to detect whether things have updated in a different way depending on whether we are passed a string
    // or a Font object.
    const changed = font !== (typeof font === 'string' ? this._font.toCSS() : this._font);
    if (changed) {
      // Wrap so that our _font is of type {Font}
      this._font = typeof font === 'string' ? Font.fromCSS(font) : font;
      const stateLen = this._drawables.length;
      for (let i = 0; i < stateLen; i++) {
        this._drawables[i].markDirtyFont();
      }
      this.invalidateText();
    }
    return this;
  }
  set font(value) {
    this.setFont(value);
  }
  get font() {
    return this.getFont();
  }

  /**
   * Returns a string representation of the current Font.
   *
   * This returns the CSS3 font shortcut that is a possible input to setFont(). See Font's constructor for detailed
   * information on the ordering of information.
   *
   * NOTE: If a Font object was provided to setFont(), this will not currently return it.
   * TODO: Can we refactor so we can have access to (a) the Font object, and possibly (b) the initially provided value. https://github.com/phetsims/scenery/issues/1581
   */
  getFont() {
    return this._font.getFont();
  }

  /**
   * Sets the weight of this node's font.
   *
   * The font weight supports the following options:
   *   'normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900',
   *   or a number that when cast to a string will be one of the strings above.
   */
  setFontWeight(weight) {
    return this.setFont(this._font.copy({
      weight: weight
    }));
  }
  set fontWeight(value) {
    this.setFontWeight(value);
  }
  get fontWeight() {
    return this.getFontWeight();
  }

  /**
   * Returns the weight of this node's font, see setFontWeight() for details.
   *
   * NOTE: If a numeric weight was passed in, it has been cast to a string, and a string will be returned here.
   */
  getFontWeight() {
    return this._font.getWeight();
  }

  /**
   * Sets the family of this node's font.
   *
   * @param family - A comma-separated list of families, which can include generic families (preferably at
   *                 the end) such as 'serif', 'sans-serif', 'cursive', 'fantasy' and 'monospace'. If there
   *                 is any question about escaping (such as spaces in a font name), the family should be
   *                 surrounded by double quotes.
   */
  setFontFamily(family) {
    return this.setFont(this._font.copy({
      family: family
    }));
  }
  set fontFamily(value) {
    this.setFontFamily(value);
  }
  get fontFamily() {
    return this.getFontFamily();
  }

  /**
   * Returns the family of this node's font, see setFontFamily() for details.
   */
  getFontFamily() {
    return this._font.getFamily();
  }

  /**
   * Sets the stretch of this node's font.
   *
   * The font stretch supports the following options:
   *   'normal', 'ultra-condensed', 'extra-condensed', 'condensed', 'semi-condensed',
   *   'semi-expanded', 'expanded', 'extra-expanded' or 'ultra-expanded'
   */
  setFontStretch(stretch) {
    return this.setFont(this._font.copy({
      stretch: stretch
    }));
  }
  set fontStretch(value) {
    this.setFontStretch(value);
  }
  get fontStretch() {
    return this.getFontStretch();
  }

  /**
   * Returns the stretch of this node's font, see setFontStretch() for details.
   */
  getFontStretch() {
    return this._font.getStretch();
  }

  /**
   * Sets the style of this node's font.
   *
   * The font style supports the following options: 'normal', 'italic' or 'oblique'
   */
  setFontStyle(style) {
    return this.setFont(this._font.copy({
      style: style
    }));
  }
  set fontStyle(value) {
    this.setFontStyle(value);
  }
  get fontStyle() {
    return this.getFontStyle();
  }

  /**
   * Returns the style of this node's font, see setFontStyle() for details.
   */
  getFontStyle() {
    return this._font.getStyle();
  }

  /**
   * Sets the size of this node's font.
   *
   * The size can either be a number (created as a quantity of 'px'), or any general CSS font-size string (for
   * example, '30pt', '5em', etc.)
   */
  setFontSize(size) {
    return this.setFont(this._font.copy({
      size: size
    }));
  }
  set fontSize(value) {
    this.setFontSize(value);
  }
  get fontSize() {
    return this.getFontSize();
  }

  /**
   * Returns the size of this node's font, see setFontSize() for details.
   *
   * NOTE: If a numeric size was passed in, it has been converted to a string with 'px', and a string will be
   * returned here.
   */
  getFontSize() {
    return this._font.getSize();
  }

  /**
   * Whether this Node itself is painted (displays something itself).
   */
  isPainted() {
    // Always true for Text nodes
    return true;
  }

  /**
   * Whether this Node's selfBounds are considered to be valid (always containing the displayed self content
   * of this node). Meant to be overridden in subtypes when this can change (e.g. Text).
   *
   * If this value would potentially change, please trigger the event 'selfBoundsValid'.
   */
  areSelfBoundsValid() {
    return this._boundsMethod === 'accurate';
  }

  /**
   * Override for extra information in the debugging output (from Display.getDebugHTML()). (scenery-internal)
   */
  getDebugHTMLExtras() {
    return ` "${escapeHTML(this.renderedText)}"${this._isHTML ? ' (html)' : ''}`;
  }
  dispose() {
    super.dispose();
    this._stringProperty.dispose();
  }

  /**
   * Replaces embedding mark characters with visible strings. Useful for debugging for strings with embedding marks.
   *
   * @returns - With embedding marks replaced.
   */
  static embeddedDebugString(string) {
    return string.replace(/\u202a/g, '[LTR]').replace(/\u202b/g, '[RTL]').replace(/\u202c/g, '[POP]');
  }

  /**
   * Returns a (potentially) modified string where embedding marks have been simplified.
   *
   * This simplification wouldn't usually be necessary, but we need to prevent cases like
   * https://github.com/phetsims/scenery/issues/520 where Edge decides to turn [POP][LTR] (after another [LTR]) into
   * a 'box' character, when nothing should be rendered.
   *
   * This will remove redundant nesting:
   *   e.g. [LTR][LTR]boo[POP][POP] => [LTR]boo[POP])
   * and will also combine adjacent directions:
   *   e.g. [LTR]Mail[POP][LTR]Man[POP] => [LTR]MailMan[Pop]
   *
   * Note that it will NOT combine in this way if there was a space between the two LTRs:
   *   e.g. [LTR]Mail[POP] [LTR]Man[Pop])
   * as in the general case, we'll want to preserve the break there between embeddings.
   *
   * TODO: A stack-based implementation that doesn't create a bunch of objects/closures would be nice for performance.
   */
  static simplifyEmbeddingMarks(string) {
    // First, we'll convert the string into a tree form, where each node is either a string object OR an object of the
    // node type { dir: {LTR||RTL}, children: {Array.<node>}, parent: {null|node} }. Thus each LTR...POP and RTL...POP
    // become a node with their interiors becoming children.

    // Root node (no direction, so we preserve root LTR/RTLs)
    const root = {
      dir: null,
      children: [],
      parent: null
    };
    let current = root;
    for (let i = 0; i < string.length; i++) {
      const chr = string.charAt(i);

      // Push a direction
      if (chr === LTR || chr === RTL) {
        const node = {
          dir: chr,
          children: [],
          parent: current
        };
        current.children.push(node);
        current = node;
      }
      // Pop a direction
      else if (chr === POP) {
        assert && assert(current.parent, `Bad nesting of embedding marks: ${Text.embeddedDebugString(string)}`);
        current = current.parent;
      }
      // Append characters to the current direction
      else {
        current.children.push(chr);
      }
    }
    assert && assert(current === root, `Bad nesting of embedding marks: ${Text.embeddedDebugString(string)}`);

    // Remove redundant nesting (e.g. [LTR][LTR]...[POP][POP])
    function collapseNesting(node) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        const child = node.children[i];
        if (typeof child !== 'string' && node.dir === child.dir) {
          node.children.splice(i, 1, ...child.children);
        }
      }
    }

    // Remove overridden nesting (e.g. [LTR][RTL]...[POP][POP]), since the outer one is not needed
    function collapseUnnecessary(node) {
      if (node.children.length === 1 && typeof node.children[0] !== 'string' && node.children[0].dir) {
        node.dir = node.children[0].dir;
        node.children = node.children[0].children;
      }
    }

    // Collapse adjacent matching dirs, e.g. [LTR]...[POP][LTR]...[POP]
    function collapseAdjacent(node) {
      for (let i = node.children.length - 1; i >= 1; i--) {
        const previousChild = node.children[i - 1];
        const child = node.children[i];
        if (typeof child !== 'string' && typeof previousChild !== 'string' && child.dir && previousChild.dir === child.dir) {
          previousChild.children = previousChild.children.concat(child.children);
          node.children.splice(i, 1);

          // Now try to collapse adjacent items in the child, since we combined children arrays
          collapseAdjacent(previousChild);
        }
      }
    }

    // Simplifies the tree using the above functions
    function simplify(node) {
      if (typeof node !== 'string') {
        for (let i = 0; i < node.children.length; i++) {
          simplify(node.children[i]);
        }
        collapseUnnecessary(node);
        collapseNesting(node);
        collapseAdjacent(node);
      }
      return node;
    }

    // Turns a tree into a string
    function stringify(node) {
      if (typeof node === 'string') {
        return node;
      }
      const childString = node.children.map(stringify).join('');
      if (node.dir) {
        return `${node.dir + childString}\u202c`;
      } else {
        return childString;
      }
    }
    return stringify(simplify(root));
  }
}

/**
 * {Array.<string>} - String keys for all of the allowed options that will be set by node.mutate( options ), in the
 * order they will be evaluated in.
 *
 * NOTE: See Node's _mutatorKeys documentation for more information on how this operates, and potential special
 *       cases that may apply.
 */
Text.prototype._mutatorKeys = [...PAINTABLE_OPTION_KEYS, ...TEXT_OPTION_KEYS, ...Node.prototype._mutatorKeys];

/**
 * {Array.<String>} - List of all dirty flags that should be available on drawables created from this node (or
 *                    subtype). Given a flag (e.g. radius), it indicates the existence of a function
 *                    drawable.markDirtyRadius() that will indicate to the drawable that the radius has changed.
 * (scenery-internal)
 * @override
 */
Text.prototype.drawableMarkFlags = [...Node.prototype.drawableMarkFlags, ...PAINTABLE_DRAWABLE_MARK_FLAGS, 'text', 'font', 'bounds'];
scenery.register('Text', Text);

// Unicode embedding marks that we can combine to work around the Edge issue.
// See https://github.com/phetsims/scenery/issues/520
const LTR = '\u202a';
const RTL = '\u202b';
const POP = '\u202c';

// Initialize computation of hybrid text
TextBounds.initializeTextBounds();
Text.TextIO = new IOType('TextIO', {
  valueType: Text,
  supertype: Node.NodeIO,
  documentation: 'Text that is displayed in the simulation. TextIO has a nested PropertyIO.&lt;String&gt; for ' + 'the current string value.'
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTdHJpbmdQcm9wZXJ0eSIsIlRpbnlGb3J3YXJkaW5nUHJvcGVydHkiLCJlc2NhcGVIVE1MIiwiZXh0ZW5kRGVmaW5lZCIsInBsYXRmb3JtIiwiVGFuZGVtIiwiSU9UeXBlIiwiUGhldGlvT2JqZWN0IiwiRm9udCIsIk5vZGUiLCJQYWludGFibGUiLCJQQUlOVEFCTEVfRFJBV0FCTEVfTUFSS19GTEFHUyIsIlBBSU5UQUJMRV9PUFRJT05fS0VZUyIsIlJlbmRlcmVyIiwic2NlbmVyeSIsIlRleHRCb3VuZHMiLCJUZXh0Q2FudmFzRHJhd2FibGUiLCJUZXh0RE9NRHJhd2FibGUiLCJUZXh0U1ZHRHJhd2FibGUiLCJjb21iaW5lT3B0aW9ucyIsInBoZXRpb0VsZW1lbnRTZWxlY3Rpb25Qcm9wZXJ0eSIsIlNUUklOR19QUk9QRVJUWV9OQU1FIiwiVEVYVF9PUFRJT05fS0VZUyIsInVzZURPTUFzRmFzdEJvdW5kcyIsIndpbmRvdyIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsImluY2x1ZGVzIiwiVGV4dCIsIlNUUklOR19QUk9QRVJUWV9UQU5ERU1fTkFNRSIsImNvbnN0cnVjdG9yIiwic3RyaW5nIiwib3B0aW9ucyIsImFzc2VydCIsInVuZGVmaW5lZCIsIk9iamVjdCIsImdldFByb3RvdHlwZU9mIiwicHJvdG90eXBlIiwiX3N0cmluZ1Byb3BlcnR5Iiwib25TdHJpbmdQcm9wZXJ0eUNoYW5nZSIsImJpbmQiLCJfZm9udCIsIkRFRkFVTFQiLCJfYm91bmRzTWV0aG9kIiwiX2lzSFRNTCIsIl9jYWNoZWRSZW5kZXJlZFRleHQiLCJkZWZpbmVkT3B0aW9ucyIsImZpbGwiLCJ0YW5kZW1OYW1lU3VmZml4IiwicGhldGlvVHlwZSIsIlRleHRJTyIsInBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZCIsImhhc093blByb3BlcnR5Iiwic3RyaW5nUHJvcGVydHkiLCJtdXRhdGUiLCJpbnZhbGlkYXRlU3VwcG9ydGVkUmVuZGVyZXJzIiwidmFsdWUiLCJzZXRTdHJpbmciLCJzZXQiLCJnZXRTdHJpbmciLCJnZXRSZW5kZXJlZFRleHQiLCJyZXBsYWNlIiwiZWRnZSIsInNpbXBsaWZ5RW1iZWRkaW5nTWFya3MiLCJyZW5kZXJlZFRleHQiLCJzdGF0ZUxlbiIsIl9kcmF3YWJsZXMiLCJsZW5ndGgiLCJpIiwibWFya0RpcnR5VGV4dCIsImludmFsaWRhdGVUZXh0Iiwic2V0U3RyaW5nUHJvcGVydHkiLCJuZXdUYXJnZXQiLCJzZXRUYXJnZXRQcm9wZXJ0eSIsInByb3BlcnR5IiwiZ2V0U3RyaW5nUHJvcGVydHkiLCJpbml0aWFsaXplUGhldGlvT2JqZWN0IiwiYmFzZU9wdGlvbnMiLCJjb25maWciLCJ3YXNJbnN0cnVtZW50ZWQiLCJpc1BoZXRpb0luc3RydW1lbnRlZCIsIlBIRVRfSU9fRU5BQkxFRCIsImluaXRpYWxpemVQaGV0aW8iLCJwaGV0aW9SZWFkT25seSIsInRhbmRlbSIsImNyZWF0ZVRhbmRlbSIsInBoZXRpb0RvY3VtZW50YXRpb24iLCJzdHJpbmdQcm9wZXJ0eU9wdGlvbnMiLCJnZXRQaGV0aW9Nb3VzZUhpdFRhcmdldCIsImZyb21MaW5raW5nIiwiZ2V0U3RyaW5nUHJvcGVydHlQaGV0aW9Nb3VzZUhpdFRhcmdldCIsInRhcmdldFN0cmluZ1Byb3BlcnR5IiwiZ2V0VGFyZ2V0UHJvcGVydHkiLCJzZXRCb3VuZHNNZXRob2QiLCJtZXRob2QiLCJtYXJrRGlydHlCb3VuZHMiLCJyZW5kZXJlclN1bW1hcnlSZWZyZXNoRW1pdHRlciIsImVtaXQiLCJib3VuZHNNZXRob2QiLCJnZXRCb3VuZHNNZXRob2QiLCJnZXRUZXh0UmVuZGVyZXJCaXRtYXNrIiwiYml0bWFzayIsImJpdG1hc2tDYW52YXMiLCJiaXRtYXNrU1ZHIiwiYml0bWFza0RPTSIsInNldFJlbmRlcmVyQml0bWFzayIsImdldEZpbGxSZW5kZXJlckJpdG1hc2siLCJnZXRTdHJva2VSZW5kZXJlckJpdG1hc2siLCJpbnZhbGlkYXRlU2VsZiIsInVwZGF0ZVNlbGZCb3VuZHMiLCJzZWxmQm91bmRzIiwiYXBwcm94aW1hdGVET01Cb3VuZHMiLCJnZXRET01UZXh0Tm9kZSIsImFwcHJveGltYXRlSHlicmlkQm91bmRzIiwiYWNjdXJhdGVDYW52YXNCb3VuZHMiLCJhcHByb3hpbWF0ZVNWR0JvdW5kcyIsImhhc1N0cm9rZSIsImRpbGF0ZSIsImdldExpbmVXaWR0aCIsImNoYW5nZWQiLCJlcXVhbHMiLCJzZWxmQm91bmRzUHJvcGVydHkiLCJfdmFsdWUiLCJpbnZhbGlkYXRlU3Ryb2tlIiwiaW52YWxpZGF0ZUZpbGwiLCJjYW52YXNQYWludFNlbGYiLCJ3cmFwcGVyIiwibWF0cml4IiwicGFpbnRDYW52YXMiLCJjcmVhdGVET01EcmF3YWJsZSIsInJlbmRlcmVyIiwiaW5zdGFuY2UiLCJjcmVhdGVGcm9tUG9vbCIsImNyZWF0ZVNWR0RyYXdhYmxlIiwiY3JlYXRlQ2FudmFzRHJhd2FibGUiLCJzcGFuIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiaW5uZXJIVE1MIiwiY3JlYXRlVGV4dE5vZGUiLCJnZXRTYWZlU2VsZkJvdW5kcyIsImV4cGFuc2lvbkZhY3RvciIsImdldFNlbGZCb3VuZHMiLCJkaWxhdGVkWFkiLCJ3aWR0aCIsImhlaWdodCIsInNldEZvbnQiLCJmb250IiwidG9DU1MiLCJmcm9tQ1NTIiwibWFya0RpcnR5Rm9udCIsImdldEZvbnQiLCJzZXRGb250V2VpZ2h0Iiwid2VpZ2h0IiwiY29weSIsImZvbnRXZWlnaHQiLCJnZXRGb250V2VpZ2h0IiwiZ2V0V2VpZ2h0Iiwic2V0Rm9udEZhbWlseSIsImZhbWlseSIsImZvbnRGYW1pbHkiLCJnZXRGb250RmFtaWx5IiwiZ2V0RmFtaWx5Iiwic2V0Rm9udFN0cmV0Y2giLCJzdHJldGNoIiwiZm9udFN0cmV0Y2giLCJnZXRGb250U3RyZXRjaCIsImdldFN0cmV0Y2giLCJzZXRGb250U3R5bGUiLCJzdHlsZSIsImZvbnRTdHlsZSIsImdldEZvbnRTdHlsZSIsImdldFN0eWxlIiwic2V0Rm9udFNpemUiLCJzaXplIiwiZm9udFNpemUiLCJnZXRGb250U2l6ZSIsImdldFNpemUiLCJpc1BhaW50ZWQiLCJhcmVTZWxmQm91bmRzVmFsaWQiLCJnZXREZWJ1Z0hUTUxFeHRyYXMiLCJkaXNwb3NlIiwiZW1iZWRkZWREZWJ1Z1N0cmluZyIsInJvb3QiLCJkaXIiLCJjaGlsZHJlbiIsInBhcmVudCIsImN1cnJlbnQiLCJjaHIiLCJjaGFyQXQiLCJMVFIiLCJSVEwiLCJub2RlIiwicHVzaCIsIlBPUCIsImNvbGxhcHNlTmVzdGluZyIsImNoaWxkIiwic3BsaWNlIiwiY29sbGFwc2VVbm5lY2Vzc2FyeSIsImNvbGxhcHNlQWRqYWNlbnQiLCJwcmV2aW91c0NoaWxkIiwiY29uY2F0Iiwic2ltcGxpZnkiLCJzdHJpbmdpZnkiLCJjaGlsZFN0cmluZyIsIm1hcCIsImpvaW4iLCJfbXV0YXRvcktleXMiLCJkcmF3YWJsZU1hcmtGbGFncyIsInJlZ2lzdGVyIiwiaW5pdGlhbGl6ZVRleHRCb3VuZHMiLCJ2YWx1ZVR5cGUiLCJzdXBlcnR5cGUiLCJOb2RlSU8iLCJkb2N1bWVudGF0aW9uIl0sInNvdXJjZXMiOlsiVGV4dC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxMy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBEaXNwbGF5cyB0ZXh0IHRoYXQgY2FuIGJlIGZpbGxlZC9zdHJva2VkLlxyXG4gKlxyXG4gKiBGb3IgbWFueSBmb250L3RleHQtcmVsYXRlZCBwcm9wZXJ0aWVzLCBpdCdzIGhlbHBmdWwgdG8gdW5kZXJzdGFuZCB0aGUgQ1NTIGVxdWl2YWxlbnRzIChodHRwOi8vd3d3LnczLm9yZy9UUi9jc3MzLWZvbnRzLykuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgU3RyaW5nUHJvcGVydHksIHsgU3RyaW5nUHJvcGVydHlPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9TdHJpbmdQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUaW55Rm9yd2FyZGluZ1Byb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvVGlueUZvcndhcmRpbmdQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBlc2NhcGVIVE1MIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9lc2NhcGVIVE1MLmpzJztcclxuaW1wb3J0IGV4dGVuZERlZmluZWQgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL2V4dGVuZERlZmluZWQuanMnO1xyXG5pbXBvcnQgcGxhdGZvcm0gZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL3BsYXRmb3JtLmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuaW1wb3J0IElPVHlwZSBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvdHlwZXMvSU9UeXBlLmpzJztcclxuaW1wb3J0IFBoZXRpb09iamVjdCwgeyBQaGV0aW9PYmplY3RPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL1BoZXRpb09iamVjdC5qcyc7XHJcbmltcG9ydCBUUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgTWF0cml4MyBmcm9tICcuLi8uLi8uLi9kb3QvanMvTWF0cml4My5qcyc7XHJcbmltcG9ydCBCb3VuZHMyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9Cb3VuZHMyLmpzJztcclxuaW1wb3J0IHsgQ2FudmFzQ29udGV4dFdyYXBwZXIsIENhbnZhc1NlbGZEcmF3YWJsZSwgRE9NU2VsZkRyYXdhYmxlLCBGb250LCBGb250U3RyZXRjaCwgRm9udFN0eWxlLCBGb250V2VpZ2h0LCBJbnN0YW5jZSwgTm9kZSwgTm9kZU9wdGlvbnMsIFBhaW50YWJsZSwgUEFJTlRBQkxFX0RSQVdBQkxFX01BUktfRkxBR1MsIFBBSU5UQUJMRV9PUFRJT05fS0VZUywgUGFpbnRhYmxlT3B0aW9ucywgUmVuZGVyZXIsIHNjZW5lcnksIFNWR1NlbGZEcmF3YWJsZSwgVGV4dEJvdW5kcywgVGV4dENhbnZhc0RyYXdhYmxlLCBUZXh0RE9NRHJhd2FibGUsIFRleHRTVkdEcmF3YWJsZSwgVFRleHREcmF3YWJsZSB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgeyBQcm9wZXJ0eU9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IHsgY29tYmluZU9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IFRSZWFkT25seVByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgcGhldGlvRWxlbWVudFNlbGVjdGlvblByb3BlcnR5IGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy9waGV0aW9FbGVtZW50U2VsZWN0aW9uUHJvcGVydHkuanMnO1xyXG5cclxuY29uc3QgU1RSSU5HX1BST1BFUlRZX05BTUUgPSAnc3RyaW5nUHJvcGVydHknOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJhZC1zaW0tdGV4dFxyXG5cclxuLy8gY29uc3RhbnRzXHJcbmNvbnN0IFRFWFRfT1BUSU9OX0tFWVMgPSBbXHJcbiAgJ2JvdW5kc01ldGhvZCcsIC8vIHtzdHJpbmd9IC0gU2V0cyBob3cgYm91bmRzIGFyZSBkZXRlcm1pbmVkIGZvciB0ZXh0LCBzZWUgc2V0Qm91bmRzTWV0aG9kKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gIFNUUklOR19QUk9QRVJUWV9OQU1FLCAvLyB7UHJvcGVydHkuPHN0cmluZz58bnVsbH0gLSBTZXRzIGZvcndhcmRpbmcgb2YgdGhlIHN0cmluZ1Byb3BlcnR5LCBzZWUgc2V0U3RyaW5nUHJvcGVydHkoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ3N0cmluZycsIC8vIHtzdHJpbmd8bnVtYmVyfSAtIFNldHMgdGhlIHN0cmluZyB0byBiZSBkaXNwbGF5ZWQgYnkgdGhpcyBUZXh0LCBzZWUgc2V0U3RyaW5nKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdmb250JywgLy8ge0ZvbnR8c3RyaW5nfSAtIFNldHMgdGhlIGZvbnQgdXNlZCBmb3IgdGhlIHRleHQsIHNlZSBzZXRGb250KCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdmb250V2VpZ2h0JywgLy8ge3N0cmluZ3xudW1iZXJ9IC0gU2V0cyB0aGUgd2VpZ2h0IG9mIHRoZSBjdXJyZW50IGZvbnQsIHNlZSBzZXRGb250KCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdmb250RmFtaWx5JywgLy8ge3N0cmluZ30gLSBTZXRzIHRoZSBmYW1pbHkgb2YgdGhlIGN1cnJlbnQgZm9udCwgc2VlIHNldEZvbnQoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ2ZvbnRTdHJldGNoJywgLy8ge3N0cmluZ30gLSBTZXRzIHRoZSBzdHJldGNoIG9mIHRoZSBjdXJyZW50IGZvbnQsIHNlZSBzZXRGb250KCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdmb250U3R5bGUnLCAvLyB7c3RyaW5nfSAtIFNldHMgdGhlIHN0eWxlIG9mIHRoZSBjdXJyZW50IGZvbnQsIHNlZSBzZXRGb250KCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdmb250U2l6ZScgLy8ge3N0cmluZ3xudW1iZXJ9IC0gU2V0cyB0aGUgc2l6ZSBvZiB0aGUgY3VycmVudCBmb250LCBzZWUgc2V0Rm9udCgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuXTtcclxuXHJcbi8vIFNWRyBib3VuZHMgc2VlbXMgdG8gYmUgbWFsZnVuY3Rpb25pbmcgZm9yIFNhZmFyaSA1LiBTaW5jZSB3ZSBkb24ndCBoYXZlIGEgcmVwcm9kdWNpYmxlIHRlc3QgbWFjaGluZSBmb3JcclxuLy8gZmFzdCBpdGVyYXRpb24sIHdlJ2xsIGd1ZXNzIHRoZSB1c2VyIGFnZW50IGFuZCB1c2UgRE9NIGJvdW5kcyBpbnN0ZWFkIG9mIFNWRy5cclxuLy8gSG9wZWZ1bGx5IHRoZSB0d28gY29uc3RyYWludHMgcnVsZSBvdXQgYW55IGZ1dHVyZSBTYWZhcmkgdmVyc2lvbnMgKGZhaXJseSBzYWZlLCBidXQgbm90IGltcG9zc2libGUhKVxyXG5jb25zdCB1c2VET01Bc0Zhc3RCb3VuZHMgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5pbmNsdWRlcyggJ2xpa2UgR2Vja28pIFZlcnNpb24vNScgKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5pbmNsdWRlcyggJ1NhZmFyaS8nICk7XHJcblxyXG5leHBvcnQgdHlwZSBUZXh0Qm91bmRzTWV0aG9kID0gJ2Zhc3QnIHwgJ2Zhc3RDYW52YXMnIHwgJ2FjY3VyYXRlJyB8ICdoeWJyaWQnO1xyXG50eXBlIFNlbGZPcHRpb25zID0ge1xyXG4gIGJvdW5kc01ldGhvZD86IFRleHRCb3VuZHNNZXRob2Q7XHJcbiAgc3RyaW5nUHJvcGVydHk/OiBUUmVhZE9ubHlQcm9wZXJ0eTxzdHJpbmc+IHwgbnVsbDtcclxuICBzdHJpbmc/OiBzdHJpbmcgfCBudW1iZXI7XHJcbiAgZm9udD86IEZvbnQgfCBzdHJpbmc7XHJcbiAgZm9udFdlaWdodD86IHN0cmluZyB8IG51bWJlcjtcclxuICBmb250RmFtaWx5Pzogc3RyaW5nO1xyXG4gIGZvbnRTdHJldGNoPzogc3RyaW5nO1xyXG4gIGZvbnRTdHlsZT86IHN0cmluZztcclxuICBmb250U2l6ZT86IHN0cmluZyB8IG51bWJlcjtcclxuICBzdHJpbmdQcm9wZXJ0eU9wdGlvbnM/OiBQcm9wZXJ0eU9wdGlvbnM8c3RyaW5nPjtcclxufTtcclxudHlwZSBQYXJlbnRPcHRpb25zID0gUGFpbnRhYmxlT3B0aW9ucyAmIE5vZGVPcHRpb25zO1xyXG5leHBvcnQgdHlwZSBUZXh0T3B0aW9ucyA9IFNlbGZPcHRpb25zICYgUGFyZW50T3B0aW9ucztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRleHQgZXh0ZW5kcyBQYWludGFibGUoIE5vZGUgKSB7XHJcblxyXG4gIC8vIFRoZSBzdHJpbmcgdG8gZGlzcGxheVxyXG4gIHByaXZhdGUgcmVhZG9ubHkgX3N0cmluZ1Byb3BlcnR5OiBUaW55Rm9yd2FyZGluZ1Byb3BlcnR5PHN0cmluZz47XHJcblxyXG4gIC8vIFRoZSBmb250IHdpdGggd2hpY2ggdG8gZGlzcGxheSB0aGUgdGV4dC5cclxuICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICBwdWJsaWMgX2ZvbnQ6IEZvbnQ7XHJcblxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyBfYm91bmRzTWV0aG9kOiBUZXh0Qm91bmRzTWV0aG9kO1xyXG5cclxuICAvLyBXaGV0aGVyIHRoZSB0ZXh0IGlzIHJlbmRlcmVkIGFzIEhUTUwgb3Igbm90LiBpZiBkZWZpbmVkIChpbiBhIHN1YnR5cGUgY29uc3RydWN0b3IpLCB1c2UgdGhhdCB2YWx1ZSBpbnN0ZWFkXHJcbiAgcHJpdmF0ZSBfaXNIVE1MOiBib29sZWFuO1xyXG5cclxuICAvLyBUaGUgYWN0dWFsIHN0cmluZyBkaXNwbGF5ZWQgKGNhbiBoYXZlIG5vbi1icmVha2luZyBzcGFjZXMgYW5kIGVtYmVkZGluZyBtYXJrcyByZXdyaXR0ZW4pLlxyXG4gIC8vIFdoZW4gdGhpcyBpcyBudWxsLCBpdHMgdmFsdWUgbmVlZHMgdG8gYmUgcmVjb21wdXRlZFxyXG4gIHByaXZhdGUgX2NhY2hlZFJlbmRlcmVkVGV4dDogc3RyaW5nIHwgbnVsbDtcclxuXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBTVFJJTkdfUFJPUEVSVFlfTkFNRSA9IFNUUklOR19QUk9QRVJUWV9OQU1FO1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgU1RSSU5HX1BST1BFUlRZX1RBTkRFTV9OQU1FID0gU1RSSU5HX1BST1BFUlRZX05BTUU7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBzdHJpbmcgLSBTZWUgc2V0U3RyaW5nKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICAqIEBwYXJhbSBbb3B0aW9uc10gLSBUZXh0LXNwZWNpZmljIG9wdGlvbnMgYXJlIGRvY3VtZW50ZWQgaW4gVEVYVF9PUFRJT05fS0VZUyBhYm92ZSwgYW5kIGNhbiBiZSBwcm92aWRlZFxyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbG9uZy1zaWRlIG9wdGlvbnMgZm9yIE5vZGVcclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHN0cmluZzogc3RyaW5nIHwgbnVtYmVyIHwgVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nPiwgb3B0aW9ucz86IFRleHRPcHRpb25zICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucyA9PT0gdW5kZWZpbmVkIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZiggb3B0aW9ucyApID09PSBPYmplY3QucHJvdG90eXBlLFxyXG4gICAgICAnRXh0cmEgcHJvdG90eXBlIG9uIE5vZGUgb3B0aW9ucyBvYmplY3QgaXMgYSBjb2RlIHNtZWxsJyApO1xyXG5cclxuICAgIHN1cGVyKCk7XHJcblxyXG4gICAgLy8gV2UnbGwgaW5pdGlhbGl6ZSB0aGlzIGJ5IG11dGF0aW5nLlxyXG4gICAgdGhpcy5fc3RyaW5nUHJvcGVydHkgPSBuZXcgVGlueUZvcndhcmRpbmdQcm9wZXJ0eSggJycsIHRydWUsIHRoaXMub25TdHJpbmdQcm9wZXJ0eUNoYW5nZS5iaW5kKCB0aGlzICkgKTtcclxuICAgIHRoaXMuX2ZvbnQgPSBGb250LkRFRkFVTFQ7XHJcbiAgICB0aGlzLl9ib3VuZHNNZXRob2QgPSAnaHlicmlkJztcclxuICAgIHRoaXMuX2lzSFRNTCA9IGZhbHNlOyAvLyBUT0RPOiBjbGVhbiB0aGlzIHVwIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICB0aGlzLl9jYWNoZWRSZW5kZXJlZFRleHQgPSBudWxsO1xyXG5cclxuICAgIGNvbnN0IGRlZmluZWRPcHRpb25zID0gZXh0ZW5kRGVmaW5lZDxUZXh0T3B0aW9ucz4oIHtcclxuICAgICAgZmlsbDogJyMwMDAwMDAnLCAvLyBEZWZhdWx0IHRvIGJsYWNrIGZpbGxlZCBzdHJpbmdcclxuXHJcbiAgICAgIC8vIHBoZXQtaW9cclxuICAgICAgdGFuZGVtTmFtZVN1ZmZpeDogJ1RleHQnLFxyXG4gICAgICBwaGV0aW9UeXBlOiBUZXh0LlRleHRJTyxcclxuICAgICAgcGhldGlvVmlzaWJsZVByb3BlcnR5SW5zdHJ1bWVudGVkOiBmYWxzZVxyXG4gICAgfSwgb3B0aW9ucyApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFkZWZpbmVkT3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSggJ3N0cmluZycgKSAmJiAhZGVmaW5lZE9wdGlvbnMuaGFzT3duUHJvcGVydHkoIFRleHQuU1RSSU5HX1BST1BFUlRZX1RBTkRFTV9OQU1FICksXHJcbiAgICAgICdwcm92aWRlIHN0cmluZyBhbmQgc3RyaW5nUHJvcGVydHkgdGhyb3VnaCBjb25zdHJ1Y3RvciBhcmcgcGxlYXNlJyApO1xyXG5cclxuICAgIGlmICggdHlwZW9mIHN0cmluZyA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHN0cmluZyA9PT0gJ251bWJlcicgKSB7XHJcbiAgICAgIGRlZmluZWRPcHRpb25zLnN0cmluZyA9IHN0cmluZztcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBkZWZpbmVkT3B0aW9ucy5zdHJpbmdQcm9wZXJ0eSA9IHN0cmluZztcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLm11dGF0ZSggZGVmaW5lZE9wdGlvbnMgKTtcclxuXHJcbiAgICB0aGlzLmludmFsaWRhdGVTdXBwb3J0ZWRSZW5kZXJlcnMoKTsgLy8gdGFrZXMgY2FyZSBvZiBzZXR0aW5nIHVwIHN1cHBvcnRlZCByZW5kZXJlcnNcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSBtdXRhdGUoIG9wdGlvbnM/OiBUZXh0T3B0aW9ucyApOiB0aGlzIHtcclxuXHJcbiAgICBpZiAoIGFzc2VydCAmJiBvcHRpb25zICYmIG9wdGlvbnMuaGFzT3duUHJvcGVydHkoICdzdHJpbmcnICkgJiYgb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSggU1RSSU5HX1BST1BFUlRZX05BTUUgKSApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5zdHJpbmdQcm9wZXJ0eSEudmFsdWUgPT09IG9wdGlvbnMuc3RyaW5nLCAnSWYgYm90aCBzdHJpbmcgYW5kIHN0cmluZ1Byb3BlcnR5IGFyZSBwcm92aWRlZCwgdGhlbiB2YWx1ZXMgc2hvdWxkIG1hdGNoJyApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHN1cGVyLm11dGF0ZSggb3B0aW9ucyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgc3RyaW5nIGRpc3BsYXllZCBieSBvdXIgbm9kZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBzdHJpbmcgLSBUaGUgc3RyaW5nIHRvIGRpc3BsYXkuIElmIGl0J3MgYSBudW1iZXIsIGl0IHdpbGwgYmUgY2FzdCB0byBhIHN0cmluZ1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRTdHJpbmcoIHN0cmluZzogc3RyaW5nIHwgbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggc3RyaW5nICE9PSBudWxsICYmIHN0cmluZyAhPT0gdW5kZWZpbmVkLCAnU3RyaW5nIHNob3VsZCBiZSBkZWZpbmVkIGFuZCBub24tbnVsbC4gVXNlIHRoZSBlbXB0eSBzdHJpbmcgaWYgbmVlZGVkLicgKTtcclxuXHJcbiAgICAvLyBjYXN0IGl0IHRvIGEgc3RyaW5nIChmb3IgbnVtYmVycywgZXRjLiwgYW5kIGRvIGl0IGJlZm9yZSB0aGUgY2hhbmdlIGd1YXJkIHNvIHdlIGRvbid0IGFjY2lkZW50YWxseSB0cmlnZ2VyIG9uIG5vbi1jaGFuZ2VkIHN0cmluZylcclxuICAgIHN0cmluZyA9IGAke3N0cmluZ31gO1xyXG5cclxuICAgIHRoaXMuX3N0cmluZ1Byb3BlcnR5LnNldCggc3RyaW5nICk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHN0cmluZyggdmFsdWU6IHN0cmluZyB8IG51bWJlciApIHsgdGhpcy5zZXRTdHJpbmcoIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBzdHJpbmcoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuZ2V0U3RyaW5nKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgc3RyaW5nIGRpc3BsYXllZCBieSBvdXIgdGV4dCBOb2RlLlxyXG4gICAqXHJcbiAgICogTk9URTogSWYgYSBudW1iZXIgd2FzIHByb3ZpZGVkIHRvIHNldFN0cmluZygpLCBpdCB3aWxsIG5vdCBiZSByZXR1cm5lZCBhcyBhIG51bWJlciBoZXJlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTdHJpbmcoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0aGlzLl9zdHJpbmdQcm9wZXJ0eS52YWx1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBwb3RlbnRpYWxseSBtb2RpZmllZCB2ZXJzaW9uIG9mIHRoaXMuc3RyaW5nLCB3aGVyZSBzcGFjZXMgYXJlIHJlcGxhY2VkIHdpdGggbm9uLWJyZWFraW5nIHNwYWNlcyxcclxuICAgKiBhbmQgZW1iZWRkaW5nIG1hcmtzIGFyZSBwb3RlbnRpYWxseSBzaW1wbGlmaWVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRSZW5kZXJlZFRleHQoKTogc3RyaW5nIHtcclxuICAgIGlmICggdGhpcy5fY2FjaGVkUmVuZGVyZWRUZXh0ID09PSBudWxsICkge1xyXG4gICAgICAvLyBVc2luZyB0aGUgbm9uLWJyZWFraW5nIHNwYWNlICgmbmJzcDspIGVuY29kZWQgYXMgMHgwMEEwIGluIFVURi04XHJcbiAgICAgIHRoaXMuX2NhY2hlZFJlbmRlcmVkVGV4dCA9IHRoaXMuc3RyaW5nLnJlcGxhY2UoICcgJywgJ1xceEEwJyApO1xyXG5cclxuICAgICAgaWYgKCBwbGF0Zm9ybS5lZGdlICkge1xyXG4gICAgICAgIC8vIFNpbXBsaWZ5IGVtYmVkZGluZyBtYXJrcyB0byB3b3JrIGFyb3VuZCBhbiBFZGdlIGJ1Zywgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy81MjBcclxuICAgICAgICB0aGlzLl9jYWNoZWRSZW5kZXJlZFRleHQgPSBUZXh0LnNpbXBsaWZ5RW1iZWRkaW5nTWFya3MoIHRoaXMuX2NhY2hlZFJlbmRlcmVkVGV4dCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuX2NhY2hlZFJlbmRlcmVkVGV4dDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcmVuZGVyZWRUZXh0KCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmdldFJlbmRlcmVkVGV4dCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCB3aGVuIG91ciBzdHJpbmcgUHJvcGVydHkgY2hhbmdlcyB2YWx1ZXMuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBvblN0cmluZ1Byb3BlcnR5Q2hhbmdlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5fY2FjaGVkUmVuZGVyZWRUZXh0ID0gbnVsbDtcclxuXHJcbiAgICBjb25zdCBzdGF0ZUxlbiA9IHRoaXMuX2RyYXdhYmxlcy5sZW5ndGg7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzdGF0ZUxlbjsgaSsrICkge1xyXG4gICAgICAoIHRoaXMuX2RyYXdhYmxlc1sgaSBdIGFzIHVua25vd24gYXMgVFRleHREcmF3YWJsZSApLm1hcmtEaXJ0eVRleHQoKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmludmFsaWRhdGVUZXh0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZWUgZG9jdW1lbnRhdGlvbiBmb3IgTm9kZS5zZXRWaXNpYmxlUHJvcGVydHksIGV4Y2VwdCB0aGlzIGlzIGZvciB0aGUgdGV4dCBzdHJpbmcuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFN0cmluZ1Byb3BlcnR5KCBuZXdUYXJnZXQ6IFRSZWFkT25seVByb3BlcnR5PHN0cmluZz4gfCBudWxsICk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHRoaXMuX3N0cmluZ1Byb3BlcnR5LnNldFRhcmdldFByb3BlcnR5KCBuZXdUYXJnZXQgYXMgVFByb3BlcnR5PHN0cmluZz4sIHRoaXMsIFRleHQuU1RSSU5HX1BST1BFUlRZX1RBTkRFTV9OQU1FICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHN0cmluZ1Byb3BlcnR5KCBwcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nPiB8IG51bGwgKSB7IHRoaXMuc2V0U3RyaW5nUHJvcGVydHkoIHByb3BlcnR5ICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBzdHJpbmdQcm9wZXJ0eSgpOiBUUHJvcGVydHk8c3RyaW5nPiB7IHJldHVybiB0aGlzLmdldFN0cmluZ1Byb3BlcnR5KCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogTGlrZSBOb2RlLmdldFZpc2libGVQcm9wZXJ0eSgpLCBidXQgZm9yIHRoZSB0ZXh0IHN0cmluZy4gTm90ZSB0aGlzIGlzIG5vdCB0aGUgc2FtZSBhcyB0aGUgUHJvcGVydHkgcHJvdmlkZWQgaW5cclxuICAgKiBzZXRTdHJpbmdQcm9wZXJ0eS4gVGh1cyBpcyB0aGUgbmF0dXJlIG9mIFRpbnlGb3J3YXJkaW5nUHJvcGVydHkuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFN0cmluZ1Byb3BlcnR5KCk6IFRQcm9wZXJ0eTxzdHJpbmc+IHtcclxuICAgIHJldHVybiB0aGlzLl9zdHJpbmdQcm9wZXJ0eTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlZSBkb2N1bWVudGF0aW9uIGFuZCBjb21tZW50cyBpbiBOb2RlLmluaXRpYWxpemVQaGV0aW9PYmplY3RcclxuICAgKi9cclxuICBwcm90ZWN0ZWQgb3ZlcnJpZGUgaW5pdGlhbGl6ZVBoZXRpb09iamVjdCggYmFzZU9wdGlvbnM6IFBhcnRpYWw8UGhldGlvT2JqZWN0T3B0aW9ucz4sIGNvbmZpZzogVGV4dE9wdGlvbnMgKTogdm9pZCB7XHJcblxyXG4gICAgLy8gVHJhY2sgdGhpcywgc28gd2Ugb25seSBvdmVycmlkZSBvdXIgc3RyaW5nUHJvcGVydHkgb25jZS5cclxuICAgIGNvbnN0IHdhc0luc3RydW1lbnRlZCA9IHRoaXMuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKTtcclxuXHJcbiAgICBzdXBlci5pbml0aWFsaXplUGhldGlvT2JqZWN0KCBiYXNlT3B0aW9ucywgY29uZmlnICk7XHJcblxyXG4gICAgaWYgKCBUYW5kZW0uUEhFVF9JT19FTkFCTEVEICYmICF3YXNJbnN0cnVtZW50ZWQgJiYgdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpICkge1xyXG4gICAgICB0aGlzLl9zdHJpbmdQcm9wZXJ0eS5pbml0aWFsaXplUGhldGlvKCB0aGlzLCBUZXh0LlNUUklOR19QUk9QRVJUWV9UQU5ERU1fTkFNRSwgKCkgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIG5ldyBTdHJpbmdQcm9wZXJ0eSggdGhpcy5zdHJpbmcsIGNvbWJpbmVPcHRpb25zPFN0cmluZ1Byb3BlcnR5T3B0aW9ucz4oIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGJ5IGRlZmF1bHQsIHRleHRzIHNob3VsZCBiZSByZWFkb25seS4gRWRpdGFibGUgdGV4dHMgbW9zdCBsaWtlbHkgcGFzcyBpbiBlZGl0YWJsZSBQcm9wZXJ0aWVzIGZyb20gaTE4biBtb2RlbCBQcm9wZXJ0aWVzLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE0NDNcclxuICAgICAgICAgICAgcGhldGlvUmVhZE9ubHk6IHRydWUsXHJcbiAgICAgICAgICAgIHRhbmRlbTogdGhpcy50YW5kZW0uY3JlYXRlVGFuZGVtKCBUZXh0LlNUUklOR19QUk9QRVJUWV9UQU5ERU1fTkFNRSApLFxyXG4gICAgICAgICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnUHJvcGVydHkgZm9yIHRoZSBkaXNwbGF5ZWQgdGV4dCdcclxuXHJcbiAgICAgICAgICB9LCBjb25maWcuc3RyaW5nUHJvcGVydHlPcHRpb25zICkgKTtcclxuICAgICAgICB9XHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUZXh0IHN1cHBvcnRzIGEgXCJzdHJpbmdcIiBzZWxlY3Rpb24gbW9kZSwgaW4gd2hpY2ggaXQgd2lsbCBtYXAgdG8gaXRzIHN0cmluZ1Byb3BlcnR5IChpZiBhcHBsaWNhYmxlKSwgb3RoZXJ3aXNlIGlzXHJcbiAgICogdXNlcyB0aGUgZGVmYXVsdCBtb3VzZS1oaXQgdGFyZ2V0IGZyb20gdGhlIHN1cGVydHlwZS5cclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgZ2V0UGhldGlvTW91c2VIaXRUYXJnZXQoIGZyb21MaW5raW5nID0gZmFsc2UgKTogUGhldGlvT2JqZWN0IHwgJ3BoZXRpb05vdFNlbGVjdGFibGUnIHtcclxuICAgIHJldHVybiBwaGV0aW9FbGVtZW50U2VsZWN0aW9uUHJvcGVydHkudmFsdWUgPT09ICdzdHJpbmcnID9cclxuICAgICAgICAgICB0aGlzLmdldFN0cmluZ1Byb3BlcnR5UGhldGlvTW91c2VIaXRUYXJnZXQoIGZyb21MaW5raW5nICkgOlxyXG4gICAgICAgICAgIHN1cGVyLmdldFBoZXRpb01vdXNlSGl0VGFyZ2V0KCBmcm9tTGlua2luZyApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBnZXRTdHJpbmdQcm9wZXJ0eVBoZXRpb01vdXNlSGl0VGFyZ2V0KCBmcm9tTGlua2luZyA9IGZhbHNlICk6IFBoZXRpb09iamVjdCB8ICdwaGV0aW9Ob3RTZWxlY3RhYmxlJyB7XHJcbiAgICBjb25zdCB0YXJnZXRTdHJpbmdQcm9wZXJ0eSA9IHRoaXMuX3N0cmluZ1Byb3BlcnR5LmdldFRhcmdldFByb3BlcnR5KCk7XHJcblxyXG4gICAgLy8gRXZlbiBpZiB0aGlzIGlzbid0IFBoRVQtaU8gaW5zdHJ1bWVudGVkLCBpdCBzdGlsbCBxdWFsaWZpZXMgYXMgdGhpcyBSaWNoVGV4dCdzIGhpdFxyXG4gICAgcmV0dXJuIHRhcmdldFN0cmluZ1Byb3BlcnR5IGluc3RhbmNlb2YgUGhldGlvT2JqZWN0ID9cclxuICAgICAgICAgICB0YXJnZXRTdHJpbmdQcm9wZXJ0eS5nZXRQaGV0aW9Nb3VzZUhpdFRhcmdldCggZnJvbUxpbmtpbmcgKSA6XHJcbiAgICAgICAgICAgJ3BoZXRpb05vdFNlbGVjdGFibGUnO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgbWV0aG9kIHRoYXQgaXMgdXNlZCB0byBkZXRlcm1pbmUgYm91bmRzIGZyb20gdGhlIHRleHQuXHJcbiAgICpcclxuICAgKiBQb3NzaWJsZSB2YWx1ZXM6XHJcbiAgICogLSAnZmFzdCcgLSBNZWFzdXJlcyB1c2luZyBTVkcsIGNhbiBiZSBpbmFjY3VyYXRlLiBDYW4ndCBiZSByZW5kZXJlZCBpbiBDYW52YXMuXHJcbiAgICogLSAnZmFzdENhbnZhcycgLSBMaWtlICdmYXN0JywgYnV0IGFsbG93cyByZW5kZXJpbmcgaW4gQ2FudmFzLlxyXG4gICAqIC0gJ2FjY3VyYXRlJyAtIFJlY3Vyc2l2ZWx5IHJlbmRlcnMgdG8gYSBDYW52YXMgdG8gYWNjdXJhdGVseSBkZXRlcm1pbmUgYm91bmRzLiBTbG93LCBidXQgd29ya3Mgd2l0aCBhbGwgcmVuZGVyZXJzLlxyXG4gICAqIC0gJ2h5YnJpZCcgLSBbZGVmYXVsdF0gQ2FjaGUgU1ZHIGhlaWdodCwgYW5kIHVzZXMgQ2FudmFzIG1lYXN1cmVUZXh0IGZvciB0aGUgd2lkdGguXHJcbiAgICpcclxuICAgKiBUT0RPOiBkZXByZWNhdGUgZmFzdC9mYXN0Q2FudmFzIG9wdGlvbnM/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICpcclxuICAgKiBOT1RFOiBNb3N0IG9mIHRoZXNlIGFyZSB1bmZvcnR1bmF0ZWx5IG5vdCBoYXJkIGd1YXJhbnRlZXMgdGhhdCBjb250ZW50IGlzIGFsbCBpbnNpZGUgb2YgdGhlIHJldHVybmVkIGJvdW5kcy5cclxuICAgKiAgICAgICAnYWNjdXJhdGUnIHNob3VsZCBwcm9iYWJseSBiZSB0aGUgb25seSBvbmUgd2hlcmUgdGhhdCBndWFyYW50ZWUgY2FuIGJlIGFzc3VtZWQuIFRoaW5ncyBsaWtlIGN5cmlsbGljIGluXHJcbiAgICogICAgICAgaXRhbGljLCBjb21iaW5pbmcgbWFya3MgYW5kIG90aGVyIHVuaWNvZGUgZmVhdHVyZXMgY2FuIGZhaWwgdG8gYmUgZGV0ZWN0ZWQuIFRoaXMgaXMgcGFydGljdWxhcmx5IHJlbGV2YW50XHJcbiAgICogICAgICAgZm9yIHRoZSBoZWlnaHQsIGFzIGNlcnRhaW4gc3RhY2tlZCBhY2NlbnQgbWFya3Mgb3IgZGVzY2VuZGVycyBjYW4gZ28gb3V0c2lkZSBvZiB0aGUgcHJlc2NyaWJlZCByYW5nZSxcclxuICAgKiAgICAgICBhbmQgZmFzdC9jYW52YXNDYW52YXMvaHlicmlkIHdpbGwgYWx3YXlzIHJldHVybiB0aGUgc2FtZSB2ZXJ0aWNhbCBib3VuZHMgKHRvcCBhbmQgYm90dG9tKSBmb3IgYSBnaXZlbiBmb250XHJcbiAgICogICAgICAgd2hlbiB0aGUgdGV4dCBpc24ndCB0aGUgZW1wdHkgc3RyaW5nLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRCb3VuZHNNZXRob2QoIG1ldGhvZDogVGV4dEJvdW5kc01ldGhvZCApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG1ldGhvZCA9PT0gJ2Zhc3QnIHx8IG1ldGhvZCA9PT0gJ2Zhc3RDYW52YXMnIHx8IG1ldGhvZCA9PT0gJ2FjY3VyYXRlJyB8fCBtZXRob2QgPT09ICdoeWJyaWQnLCAnVW5rbm93biBUZXh0IGJvdW5kc01ldGhvZCcgKTtcclxuICAgIGlmICggbWV0aG9kICE9PSB0aGlzLl9ib3VuZHNNZXRob2QgKSB7XHJcbiAgICAgIHRoaXMuX2JvdW5kc01ldGhvZCA9IG1ldGhvZDtcclxuICAgICAgdGhpcy5pbnZhbGlkYXRlU3VwcG9ydGVkUmVuZGVyZXJzKCk7XHJcblxyXG4gICAgICBjb25zdCBzdGF0ZUxlbiA9IHRoaXMuX2RyYXdhYmxlcy5sZW5ndGg7XHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHN0YXRlTGVuOyBpKysgKSB7XHJcbiAgICAgICAgKCB0aGlzLl9kcmF3YWJsZXNbIGkgXSBhcyB1bmtub3duIGFzIFRUZXh0RHJhd2FibGUgKS5tYXJrRGlydHlCb3VuZHMoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5pbnZhbGlkYXRlVGV4dCgpO1xyXG5cclxuICAgICAgdGhpcy5yZW5kZXJlclN1bW1hcnlSZWZyZXNoRW1pdHRlci5lbWl0KCk7IC8vIHdoZXRoZXIgb3VyIHNlbGYgYm91bmRzIGFyZSB2YWxpZCBtYXkgaGF2ZSBjaGFuZ2VkXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgYm91bmRzTWV0aG9kKCB2YWx1ZTogVGV4dEJvdW5kc01ldGhvZCApIHsgdGhpcy5zZXRCb3VuZHNNZXRob2QoIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBib3VuZHNNZXRob2QoKTogVGV4dEJvdW5kc01ldGhvZCB7IHJldHVybiB0aGlzLmdldEJvdW5kc01ldGhvZCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGN1cnJlbnQgbWV0aG9kIHRvIGVzdGltYXRlIHRoZSBib3VuZHMgb2YgdGhlIHRleHQuIFNlZSBzZXRCb3VuZHNNZXRob2QoKSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Qm91bmRzTWV0aG9kKCk6IFRleHRCb3VuZHNNZXRob2Qge1xyXG4gICAgcmV0dXJuIHRoaXMuX2JvdW5kc01ldGhvZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBiaXRtYXNrIHJlcHJlc2VudGluZyB0aGUgc3VwcG9ydGVkIHJlbmRlcmVycyBmb3IgdGhlIGN1cnJlbnQgY29uZmlndXJhdGlvbiBvZiB0aGUgVGV4dCBub2RlLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgLSBBIGJpdG1hc2sgdGhhdCBpbmNsdWRlcyBzdXBwb3J0ZWQgcmVuZGVyZXJzLCBzZWUgUmVuZGVyZXIgZm9yIGRldGFpbHMuXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIGdldFRleHRSZW5kZXJlckJpdG1hc2soKTogbnVtYmVyIHtcclxuICAgIGxldCBiaXRtYXNrID0gMDtcclxuXHJcbiAgICAvLyBjYW52YXMgc3VwcG9ydCAoZmFzdCBib3VuZHMgbWF5IGxlYWsgb3V0IG9mIGRpcnR5IHJlY3RhbmdsZXMpXHJcbiAgICBpZiAoIHRoaXMuX2JvdW5kc01ldGhvZCAhPT0gJ2Zhc3QnICYmICF0aGlzLl9pc0hUTUwgKSB7XHJcbiAgICAgIGJpdG1hc2sgfD0gUmVuZGVyZXIuYml0bWFza0NhbnZhcztcclxuICAgIH1cclxuICAgIGlmICggIXRoaXMuX2lzSFRNTCApIHtcclxuICAgICAgYml0bWFzayB8PSBSZW5kZXJlci5iaXRtYXNrU1ZHO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGZpbGwgYW5kIHN0cm9rZSB3aWxsIGRldGVybWluZSB3aGV0aGVyIHdlIGhhdmUgRE9NIHRleHQgc3VwcG9ydFxyXG4gICAgYml0bWFzayB8PSBSZW5kZXJlci5iaXRtYXNrRE9NO1xyXG5cclxuICAgIHJldHVybiBiaXRtYXNrO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJpZ2dlcnMgYSBjaGVjayBhbmQgdXBkYXRlIGZvciB3aGF0IHJlbmRlcmVycyB0aGUgY3VycmVudCBjb25maWd1cmF0aW9uIHN1cHBvcnRzLlxyXG4gICAqIFRoaXMgc2hvdWxkIGJlIGNhbGxlZCB3aGVuZXZlciBzb21ldGhpbmcgdGhhdCBjb3VsZCBwb3RlbnRpYWxseSBjaGFuZ2Ugc3VwcG9ydGVkIHJlbmRlcmVycyBoYXBwZW4gKHdoaWNoIGNhblxyXG4gICAqIGJlIGlzSFRNTCwgYm91bmRzTWV0aG9kLCBldGMuKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBpbnZhbGlkYXRlU3VwcG9ydGVkUmVuZGVyZXJzKCk6IHZvaWQge1xyXG4gICAgdGhpcy5zZXRSZW5kZXJlckJpdG1hc2soIHRoaXMuZ2V0RmlsbFJlbmRlcmVyQml0bWFzaygpICYgdGhpcy5nZXRTdHJva2VSZW5kZXJlckJpdG1hc2soKSAmIHRoaXMuZ2V0VGV4dFJlbmRlcmVyQml0bWFzaygpICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBOb3RpZmllcyB0aGF0IHNvbWV0aGluZyBhYm91dCB0aGUgdGV4dCdzIHBvdGVudGlhbCBib3VuZHMgaGF2ZSBjaGFuZ2VkIChkaWZmZXJlbnQgc3RyaW5nLCBkaWZmZXJlbnQgc3Ryb2tlIG9yIGZvbnQsXHJcbiAgICogZXRjLilcclxuICAgKi9cclxuICBwcml2YXRlIGludmFsaWRhdGVUZXh0KCk6IHZvaWQge1xyXG4gICAgdGhpcy5pbnZhbGlkYXRlU2VsZigpO1xyXG5cclxuICAgIC8vIFRPRE86IGNvbnNpZGVyIHJlcGxhY2luZyB0aGlzIHdpdGggYSBnZW5lcmFsIGRpcnR5IGZsYWcgbm90aWZpY2F0aW9uLCBhbmQgaGF2ZSBET00gdXBkYXRlIGJvdW5kcyBldmVyeSBmcmFtZT8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgIGNvbnN0IHN0YXRlTGVuID0gdGhpcy5fZHJhd2FibGVzLmxlbmd0aDtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHN0YXRlTGVuOyBpKysgKSB7XHJcbiAgICAgICggdGhpcy5fZHJhd2FibGVzWyBpIF0gYXMgdW5rbm93biBhcyBUVGV4dERyYXdhYmxlICkubWFya0RpcnR5Qm91bmRzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gd2UgbWF5IGhhdmUgY2hhbmdlZCByZW5kZXJlcnMgaWYgcGFyYW1ldGVycyB3ZXJlIGNoYW5nZWQhXHJcbiAgICB0aGlzLmludmFsaWRhdGVTdXBwb3J0ZWRSZW5kZXJlcnMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXB1dGVzIGEgbW9yZSBlZmZpY2llbnQgc2VsZkJvdW5kcyBmb3Igb3VyIFRleHQuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyAtIFdoZXRoZXIgdGhlIHNlbGYgYm91bmRzIGNoYW5nZWQuXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIG92ZXJyaWRlIHVwZGF0ZVNlbGZCb3VuZHMoKTogYm9vbGVhbiB7XHJcbiAgICAvLyBUT0RPOiBkb24ndCBjcmVhdGUgYW5vdGhlciBCb3VuZHMyIG9iamVjdCBqdXN0IGZvciB0aGlzISBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgbGV0IHNlbGZCb3VuZHM7XHJcblxyXG4gICAgLy8gaW52ZXN0aWdhdGUgaHR0cDovL211ZGN1LmJlL2pvdXJuYWwvMjAxMS8wMS9odG1sNS10eXBvZ3JhcGhpYy1tZXRyaWNzL1xyXG4gICAgaWYgKCB0aGlzLl9pc0hUTUwgfHwgKCB1c2VET01Bc0Zhc3RCb3VuZHMgJiYgdGhpcy5fYm91bmRzTWV0aG9kICE9PSAnYWNjdXJhdGUnICkgKSB7XHJcbiAgICAgIHNlbGZCb3VuZHMgPSBUZXh0Qm91bmRzLmFwcHJveGltYXRlRE9NQm91bmRzKCB0aGlzLl9mb250LCB0aGlzLmdldERPTVRleHROb2RlKCkgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0aGlzLl9ib3VuZHNNZXRob2QgPT09ICdoeWJyaWQnICkge1xyXG4gICAgICBzZWxmQm91bmRzID0gVGV4dEJvdW5kcy5hcHByb3hpbWF0ZUh5YnJpZEJvdW5kcyggdGhpcy5fZm9udCwgdGhpcy5yZW5kZXJlZFRleHQgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0aGlzLl9ib3VuZHNNZXRob2QgPT09ICdhY2N1cmF0ZScgKSB7XHJcbiAgICAgIHNlbGZCb3VuZHMgPSBUZXh0Qm91bmRzLmFjY3VyYXRlQ2FudmFzQm91bmRzKCB0aGlzICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fYm91bmRzTWV0aG9kID09PSAnZmFzdCcgfHwgdGhpcy5fYm91bmRzTWV0aG9kID09PSAnZmFzdENhbnZhcycgKTtcclxuICAgICAgc2VsZkJvdW5kcyA9IFRleHRCb3VuZHMuYXBwcm94aW1hdGVTVkdCb3VuZHMoIHRoaXMuX2ZvbnQsIHRoaXMucmVuZGVyZWRUZXh0ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZm9yIG5vdywganVzdCBhZGQgZXh0cmEgb24sIGlnbm9yaW5nIHRoZSBwb3NzaWJpbGl0eSBvZiBtaXRlcmVkIGpvaW50cyBwYXNzaW5nIGJleW9uZFxyXG4gICAgaWYgKCB0aGlzLmhhc1N0cm9rZSgpICkge1xyXG4gICAgICBzZWxmQm91bmRzLmRpbGF0ZSggdGhpcy5nZXRMaW5lV2lkdGgoKSAvIDIgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjaGFuZ2VkID0gIXNlbGZCb3VuZHMuZXF1YWxzKCB0aGlzLnNlbGZCb3VuZHNQcm9wZXJ0eS5fdmFsdWUgKTtcclxuICAgIGlmICggY2hhbmdlZCApIHtcclxuICAgICAgdGhpcy5zZWxmQm91bmRzUHJvcGVydHkuX3ZhbHVlLnNldCggc2VsZkJvdW5kcyApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNoYW5nZWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgZnJvbSAoYW5kIG92ZXJyaWRkZW4gaW4pIHRoZSBQYWludGFibGUgdHJhaXQsIGludmFsaWRhdGVzIG91ciBjdXJyZW50IHN0cm9rZSwgdHJpZ2dlcmluZyByZWNvbXB1dGF0aW9uIG9mXHJcbiAgICogYW55dGhpbmcgdGhhdCBkZXBlbmRlZCBvbiB0aGUgb2xkIHN0cm9rZSdzIHZhbHVlLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgaW52YWxpZGF0ZVN0cm9rZSgpOiB2b2lkIHtcclxuICAgIC8vIHN0cm9rZSBjYW4gY2hhbmdlIGJvdGggdGhlIGJvdW5kcyBhbmQgcmVuZGVyZXJcclxuICAgIHRoaXMuaW52YWxpZGF0ZVRleHQoKTtcclxuXHJcbiAgICBzdXBlci5pbnZhbGlkYXRlU3Ryb2tlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgZnJvbSAoYW5kIG92ZXJyaWRkZW4gaW4pIHRoZSBQYWludGFibGUgdHJhaXQsIGludmFsaWRhdGVzIG91ciBjdXJyZW50IGZpbGwsIHRyaWdnZXJpbmcgcmVjb21wdXRhdGlvbiBvZlxyXG4gICAqIGFueXRoaW5nIHRoYXQgZGVwZW5kZWQgb24gdGhlIG9sZCBmaWxsJ3MgdmFsdWUuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBpbnZhbGlkYXRlRmlsbCgpOiB2b2lkIHtcclxuICAgIC8vIGZpbGwgdHlwZSBjYW4gY2hhbmdlIHRoZSByZW5kZXJlciAoZ3JhZGllbnQvZmlsbCBub3Qgc3VwcG9ydGVkIGJ5IERPTSlcclxuICAgIHRoaXMuaW52YWxpZGF0ZVRleHQoKTtcclxuXHJcbiAgICBzdXBlci5pbnZhbGlkYXRlRmlsbCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRHJhd3MgdGhlIGN1cnJlbnQgTm9kZSdzIHNlbGYgcmVwcmVzZW50YXRpb24sIGFzc3VtaW5nIHRoZSB3cmFwcGVyJ3MgQ2FudmFzIGNvbnRleHQgaXMgYWxyZWFkeSBpbiB0aGUgbG9jYWxcclxuICAgKiBjb29yZGluYXRlIGZyYW1lIG9mIHRoaXMgbm9kZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB3cmFwcGVyXHJcbiAgICogQHBhcmFtIG1hdHJpeCAtIFRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggYWxyZWFkeSBhcHBsaWVkIHRvIHRoZSBjb250ZXh0LlxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBvdmVycmlkZSBjYW52YXNQYWludFNlbGYoIHdyYXBwZXI6IENhbnZhc0NvbnRleHRXcmFwcGVyLCBtYXRyaXg6IE1hdHJpeDMgKTogdm9pZCB7XHJcbiAgICAvL1RPRE86IEhhdmUgYSBzZXBhcmF0ZSBtZXRob2QgZm9yIHRoaXMsIGluc3RlYWQgb2YgdG91Y2hpbmcgdGhlIHByb3RvdHlwZS4gQ2FuIG1ha2UgJ3RoaXMnIHJlZmVyZW5jZXMgdG9vIGVhc2lseS4gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgIFRleHRDYW52YXNEcmF3YWJsZS5wcm90b3R5cGUucGFpbnRDYW52YXMoIHdyYXBwZXIsIHRoaXMsIG1hdHJpeCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIERPTSBkcmF3YWJsZSBmb3IgdGhpcyBUZXh0LiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKlxyXG4gICAqIEBwYXJhbSByZW5kZXJlciAtIEluIHRoZSBiaXRtYXNrIGZvcm1hdCBzcGVjaWZpZWQgYnkgUmVuZGVyZXIsIHdoaWNoIG1heSBjb250YWluIGFkZGl0aW9uYWwgYml0IGZsYWdzLlxyXG4gICAqIEBwYXJhbSBpbnN0YW5jZSAtIEluc3RhbmNlIG9iamVjdCB0aGF0IHdpbGwgYmUgYXNzb2NpYXRlZCB3aXRoIHRoZSBkcmF3YWJsZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBjcmVhdGVET01EcmF3YWJsZSggcmVuZGVyZXI6IG51bWJlciwgaW5zdGFuY2U6IEluc3RhbmNlICk6IERPTVNlbGZEcmF3YWJsZSB7XHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICByZXR1cm4gVGV4dERPTURyYXdhYmxlLmNyZWF0ZUZyb21Qb29sKCByZW5kZXJlciwgaW5zdGFuY2UgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBTVkcgZHJhd2FibGUgZm9yIHRoaXMgVGV4dC4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICpcclxuICAgKiBAcGFyYW0gcmVuZGVyZXIgLSBJbiB0aGUgYml0bWFzayBmb3JtYXQgc3BlY2lmaWVkIGJ5IFJlbmRlcmVyLCB3aGljaCBtYXkgY29udGFpbiBhZGRpdGlvbmFsIGJpdCBmbGFncy5cclxuICAgKiBAcGFyYW0gaW5zdGFuY2UgLSBJbnN0YW5jZSBvYmplY3QgdGhhdCB3aWxsIGJlIGFzc29jaWF0ZWQgd2l0aCB0aGUgZHJhd2FibGVcclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgY3JlYXRlU1ZHRHJhd2FibGUoIHJlbmRlcmVyOiBudW1iZXIsIGluc3RhbmNlOiBJbnN0YW5jZSApOiBTVkdTZWxmRHJhd2FibGUge1xyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgcmV0dXJuIFRleHRTVkdEcmF3YWJsZS5jcmVhdGVGcm9tUG9vbCggcmVuZGVyZXIsIGluc3RhbmNlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgQ2FudmFzIGRyYXdhYmxlIGZvciB0aGlzIFRleHQuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHJlbmRlcmVyIC0gSW4gdGhlIGJpdG1hc2sgZm9ybWF0IHNwZWNpZmllZCBieSBSZW5kZXJlciwgd2hpY2ggbWF5IGNvbnRhaW4gYWRkaXRpb25hbCBiaXQgZmxhZ3MuXHJcbiAgICogQHBhcmFtIGluc3RhbmNlIC0gSW5zdGFuY2Ugb2JqZWN0IHRoYXQgd2lsbCBiZSBhc3NvY2lhdGVkIHdpdGggdGhlIGRyYXdhYmxlXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGNyZWF0ZUNhbnZhc0RyYXdhYmxlKCByZW5kZXJlcjogbnVtYmVyLCBpbnN0YW5jZTogSW5zdGFuY2UgKTogQ2FudmFzU2VsZkRyYXdhYmxlIHtcclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgIHJldHVybiBUZXh0Q2FudmFzRHJhd2FibGUuY3JlYXRlRnJvbVBvb2woIHJlbmRlcmVyLCBpbnN0YW5jZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIERPTSBlbGVtZW50IHRoYXQgY29udGFpbnMgdGhlIHNwZWNpZmllZCBzdHJpbmcuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqXHJcbiAgICogVGhpcyBpcyBuZWVkZWQgc2luY2Ugd2UgaGF2ZSB0byBoYW5kbGUgSFRNTCB0ZXh0IGRpZmZlcmVudGx5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRET01UZXh0Tm9kZSgpOiBFbGVtZW50IHtcclxuICAgIGlmICggdGhpcy5faXNIVE1MICkge1xyXG4gICAgICBjb25zdCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ3NwYW4nICk7XHJcbiAgICAgIHNwYW4uaW5uZXJIVE1MID0gdGhpcy5zdHJpbmc7XHJcbiAgICAgIHJldHVybiBzcGFuO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSggdGhpcy5yZW5kZXJlZFRleHQgKSBhcyB1bmtub3duIGFzIEVsZW1lbnQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgYm91bmRpbmcgYm94IHRoYXQgc2hvdWxkIGNvbnRhaW4gYWxsIHNlbGYgY29udGVudCBpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSAob3VyIG5vcm1hbCBzZWxmIGJvdW5kc1xyXG4gICAqIGFyZW4ndCBndWFyYW50ZWVkIHRoaXMgZm9yIFRleHQpXHJcbiAgICpcclxuICAgKiBXZSBuZWVkIHRvIGFkZCBhZGRpdGlvbmFsIHBhZGRpbmcgYXJvdW5kIHRoZSB0ZXh0IHdoZW4gdGhlIHRleHQgaXMgaW4gYSBjb250YWluZXIgdGhhdCBjb3VsZCBjbGlwIHRoaW5ncyBiYWRseVxyXG4gICAqIGlmIHRoZSB0ZXh0IGlzIGxhcmdlciB0aGFuIHRoZSBub3JtYWwgYm91bmRzIGNvbXB1dGF0aW9uLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBnZXRTYWZlU2VsZkJvdW5kcygpOiBCb3VuZHMyIHtcclxuICAgIGNvbnN0IGV4cGFuc2lvbkZhY3RvciA9IDE7IC8vIHdlIHVzZSBhIG5ldyBib3VuZGluZyBib3ggd2l0aCBhIG5ldyBzaXplIG9mIHNpemUgKiAoIDEgKyAyICogZXhwYW5zaW9uRmFjdG9yIClcclxuXHJcbiAgICBjb25zdCBzZWxmQm91bmRzID0gdGhpcy5nZXRTZWxmQm91bmRzKCk7XHJcblxyXG4gICAgLy8gTk9URTogd2UnbGwga2VlcCB0aGlzIGFzIGFuIGVzdGltYXRlIGZvciB0aGUgYm91bmRzIGluY2x1ZGluZyBzdHJva2UgbWl0ZXJzXHJcbiAgICByZXR1cm4gc2VsZkJvdW5kcy5kaWxhdGVkWFkoIGV4cGFuc2lvbkZhY3RvciAqIHNlbGZCb3VuZHMud2lkdGgsIGV4cGFuc2lvbkZhY3RvciAqIHNlbGZCb3VuZHMuaGVpZ2h0ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBmb250IG9mIHRoZSBUZXh0IG5vZGUuXHJcbiAgICpcclxuICAgKiBUaGlzIGNhbiBlaXRoZXIgYmUgYSBTY2VuZXJ5IEZvbnQgb2JqZWN0LCBvciBhIHN0cmluZy4gVGhlIHN0cmluZyBmb3JtYXQgaXMgZGVzY3JpYmVkIGJ5IEZvbnQncyBjb25zdHJ1Y3RvciwgYW5kXHJcbiAgICogaXMgYmFzaWNhbGx5IHRoZSBDU1MzIGZvbnQgc2hvcnRjdXQgZm9ybWF0LiBJZiBhIHN0cmluZyBpcyBwcm92aWRlZCwgaXQgd2lsbCBiZSB3cmFwcGVkIHdpdGggYSBuZXcgKGltbXV0YWJsZSlcclxuICAgKiBTY2VuZXJ5IEZvbnQgb2JqZWN0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRGb250KCBmb250OiBGb250IHwgc3RyaW5nICk6IHRoaXMge1xyXG5cclxuICAgIC8vIFdlIG5lZWQgdG8gZGV0ZWN0IHdoZXRoZXIgdGhpbmdzIGhhdmUgdXBkYXRlZCBpbiBhIGRpZmZlcmVudCB3YXkgZGVwZW5kaW5nIG9uIHdoZXRoZXIgd2UgYXJlIHBhc3NlZCBhIHN0cmluZ1xyXG4gICAgLy8gb3IgYSBGb250IG9iamVjdC5cclxuICAgIGNvbnN0IGNoYW5nZWQgPSBmb250ICE9PSAoICggdHlwZW9mIGZvbnQgPT09ICdzdHJpbmcnICkgPyB0aGlzLl9mb250LnRvQ1NTKCkgOiB0aGlzLl9mb250ICk7XHJcbiAgICBpZiAoIGNoYW5nZWQgKSB7XHJcbiAgICAgIC8vIFdyYXAgc28gdGhhdCBvdXIgX2ZvbnQgaXMgb2YgdHlwZSB7Rm9udH1cclxuICAgICAgdGhpcy5fZm9udCA9ICggdHlwZW9mIGZvbnQgPT09ICdzdHJpbmcnICkgPyBGb250LmZyb21DU1MoIGZvbnQgKSA6IGZvbnQ7XHJcblxyXG4gICAgICBjb25zdCBzdGF0ZUxlbiA9IHRoaXMuX2RyYXdhYmxlcy5sZW5ndGg7XHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHN0YXRlTGVuOyBpKysgKSB7XHJcbiAgICAgICAgKCB0aGlzLl9kcmF3YWJsZXNbIGkgXSBhcyB1bmtub3duIGFzIFRUZXh0RHJhd2FibGUgKS5tYXJrRGlydHlGb250KCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZVRleHQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBmb250KCB2YWx1ZTogRm9udCB8IHN0cmluZyApIHsgdGhpcy5zZXRGb250KCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZm9udCgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5nZXRGb250KCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgY3VycmVudCBGb250LlxyXG4gICAqXHJcbiAgICogVGhpcyByZXR1cm5zIHRoZSBDU1MzIGZvbnQgc2hvcnRjdXQgdGhhdCBpcyBhIHBvc3NpYmxlIGlucHV0IHRvIHNldEZvbnQoKS4gU2VlIEZvbnQncyBjb25zdHJ1Y3RvciBmb3IgZGV0YWlsZWRcclxuICAgKiBpbmZvcm1hdGlvbiBvbiB0aGUgb3JkZXJpbmcgb2YgaW5mb3JtYXRpb24uXHJcbiAgICpcclxuICAgKiBOT1RFOiBJZiBhIEZvbnQgb2JqZWN0IHdhcyBwcm92aWRlZCB0byBzZXRGb250KCksIHRoaXMgd2lsbCBub3QgY3VycmVudGx5IHJldHVybiBpdC5cclxuICAgKiBUT0RPOiBDYW4gd2UgcmVmYWN0b3Igc28gd2UgY2FuIGhhdmUgYWNjZXNzIHRvIChhKSB0aGUgRm9udCBvYmplY3QsIGFuZCBwb3NzaWJseSAoYikgdGhlIGluaXRpYWxseSBwcm92aWRlZCB2YWx1ZS4gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Rm9udCgpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHRoaXMuX2ZvbnQuZ2V0Rm9udCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgd2VpZ2h0IG9mIHRoaXMgbm9kZSdzIGZvbnQuXHJcbiAgICpcclxuICAgKiBUaGUgZm9udCB3ZWlnaHQgc3VwcG9ydHMgdGhlIGZvbGxvd2luZyBvcHRpb25zOlxyXG4gICAqICAgJ25vcm1hbCcsICdib2xkJywgJ2JvbGRlcicsICdsaWdodGVyJywgJzEwMCcsICcyMDAnLCAnMzAwJywgJzQwMCcsICc1MDAnLCAnNjAwJywgJzcwMCcsICc4MDAnLCAnOTAwJyxcclxuICAgKiAgIG9yIGEgbnVtYmVyIHRoYXQgd2hlbiBjYXN0IHRvIGEgc3RyaW5nIHdpbGwgYmUgb25lIG9mIHRoZSBzdHJpbmdzIGFib3ZlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRGb250V2VpZ2h0KCB3ZWlnaHQ6IEZvbnRXZWlnaHQgfCBudW1iZXIgKTogdGhpcyB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRGb250KCB0aGlzLl9mb250LmNvcHkoIHtcclxuICAgICAgd2VpZ2h0OiB3ZWlnaHRcclxuICAgIH0gKSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBmb250V2VpZ2h0KCB2YWx1ZTogRm9udFdlaWdodCB8IG51bWJlciApIHsgdGhpcy5zZXRGb250V2VpZ2h0KCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZm9udFdlaWdodCgpOiBGb250V2VpZ2h0IHsgcmV0dXJuIHRoaXMuZ2V0Rm9udFdlaWdodCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHdlaWdodCBvZiB0aGlzIG5vZGUncyBmb250LCBzZWUgc2V0Rm9udFdlaWdodCgpIGZvciBkZXRhaWxzLlxyXG4gICAqXHJcbiAgICogTk9URTogSWYgYSBudW1lcmljIHdlaWdodCB3YXMgcGFzc2VkIGluLCBpdCBoYXMgYmVlbiBjYXN0IHRvIGEgc3RyaW5nLCBhbmQgYSBzdHJpbmcgd2lsbCBiZSByZXR1cm5lZCBoZXJlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRGb250V2VpZ2h0KCk6IEZvbnRXZWlnaHQge1xyXG4gICAgcmV0dXJuIHRoaXMuX2ZvbnQuZ2V0V2VpZ2h0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBmYW1pbHkgb2YgdGhpcyBub2RlJ3MgZm9udC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBmYW1pbHkgLSBBIGNvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIGZhbWlsaWVzLCB3aGljaCBjYW4gaW5jbHVkZSBnZW5lcmljIGZhbWlsaWVzIChwcmVmZXJhYmx5IGF0XHJcbiAgICogICAgICAgICAgICAgICAgIHRoZSBlbmQpIHN1Y2ggYXMgJ3NlcmlmJywgJ3NhbnMtc2VyaWYnLCAnY3Vyc2l2ZScsICdmYW50YXN5JyBhbmQgJ21vbm9zcGFjZScuIElmIHRoZXJlXHJcbiAgICogICAgICAgICAgICAgICAgIGlzIGFueSBxdWVzdGlvbiBhYm91dCBlc2NhcGluZyAoc3VjaCBhcyBzcGFjZXMgaW4gYSBmb250IG5hbWUpLCB0aGUgZmFtaWx5IHNob3VsZCBiZVxyXG4gICAqICAgICAgICAgICAgICAgICBzdXJyb3VuZGVkIGJ5IGRvdWJsZSBxdW90ZXMuXHJcbiAgICovXHJcbiAgcHVibGljIHNldEZvbnRGYW1pbHkoIGZhbWlseTogc3RyaW5nICk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0Rm9udCggdGhpcy5fZm9udC5jb3B5KCB7XHJcbiAgICAgIGZhbWlseTogZmFtaWx5XHJcbiAgICB9ICkgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgZm9udEZhbWlseSggdmFsdWU6IHN0cmluZyApIHsgdGhpcy5zZXRGb250RmFtaWx5KCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZm9udEZhbWlseSgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5nZXRGb250RmFtaWx5KCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgZmFtaWx5IG9mIHRoaXMgbm9kZSdzIGZvbnQsIHNlZSBzZXRGb250RmFtaWx5KCkgZm9yIGRldGFpbHMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEZvbnRGYW1pbHkoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0aGlzLl9mb250LmdldEZhbWlseSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgc3RyZXRjaCBvZiB0aGlzIG5vZGUncyBmb250LlxyXG4gICAqXHJcbiAgICogVGhlIGZvbnQgc3RyZXRjaCBzdXBwb3J0cyB0aGUgZm9sbG93aW5nIG9wdGlvbnM6XHJcbiAgICogICAnbm9ybWFsJywgJ3VsdHJhLWNvbmRlbnNlZCcsICdleHRyYS1jb25kZW5zZWQnLCAnY29uZGVuc2VkJywgJ3NlbWktY29uZGVuc2VkJyxcclxuICAgKiAgICdzZW1pLWV4cGFuZGVkJywgJ2V4cGFuZGVkJywgJ2V4dHJhLWV4cGFuZGVkJyBvciAndWx0cmEtZXhwYW5kZWQnXHJcbiAgICovXHJcbiAgcHVibGljIHNldEZvbnRTdHJldGNoKCBzdHJldGNoOiBGb250U3RyZXRjaCApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLnNldEZvbnQoIHRoaXMuX2ZvbnQuY29weSgge1xyXG4gICAgICBzdHJldGNoOiBzdHJldGNoXHJcbiAgICB9ICkgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgZm9udFN0cmV0Y2goIHZhbHVlOiBGb250U3RyZXRjaCApIHsgdGhpcy5zZXRGb250U3RyZXRjaCggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGZvbnRTdHJldGNoKCk6IEZvbnRTdHJldGNoIHsgcmV0dXJuIHRoaXMuZ2V0Rm9udFN0cmV0Y2goKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBzdHJldGNoIG9mIHRoaXMgbm9kZSdzIGZvbnQsIHNlZSBzZXRGb250U3RyZXRjaCgpIGZvciBkZXRhaWxzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRGb250U3RyZXRjaCgpOiBGb250U3RyZXRjaCB7XHJcbiAgICByZXR1cm4gdGhpcy5fZm9udC5nZXRTdHJldGNoKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBzdHlsZSBvZiB0aGlzIG5vZGUncyBmb250LlxyXG4gICAqXHJcbiAgICogVGhlIGZvbnQgc3R5bGUgc3VwcG9ydHMgdGhlIGZvbGxvd2luZyBvcHRpb25zOiAnbm9ybWFsJywgJ2l0YWxpYycgb3IgJ29ibGlxdWUnXHJcbiAgICovXHJcbiAgcHVibGljIHNldEZvbnRTdHlsZSggc3R5bGU6IEZvbnRTdHlsZSApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLnNldEZvbnQoIHRoaXMuX2ZvbnQuY29weSgge1xyXG4gICAgICBzdHlsZTogc3R5bGVcclxuICAgIH0gKSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBmb250U3R5bGUoIHZhbHVlOiBGb250U3R5bGUgKSB7IHRoaXMuc2V0Rm9udFN0eWxlKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZm9udFN0eWxlKCk6IEZvbnRTdHlsZSB7IHJldHVybiB0aGlzLmdldEZvbnRTdHlsZSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHN0eWxlIG9mIHRoaXMgbm9kZSdzIGZvbnQsIHNlZSBzZXRGb250U3R5bGUoKSBmb3IgZGV0YWlscy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Rm9udFN0eWxlKCk6IEZvbnRTdHlsZSB7XHJcbiAgICByZXR1cm4gdGhpcy5fZm9udC5nZXRTdHlsZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgc2l6ZSBvZiB0aGlzIG5vZGUncyBmb250LlxyXG4gICAqXHJcbiAgICogVGhlIHNpemUgY2FuIGVpdGhlciBiZSBhIG51bWJlciAoY3JlYXRlZCBhcyBhIHF1YW50aXR5IG9mICdweCcpLCBvciBhbnkgZ2VuZXJhbCBDU1MgZm9udC1zaXplIHN0cmluZyAoZm9yXHJcbiAgICogZXhhbXBsZSwgJzMwcHQnLCAnNWVtJywgZXRjLilcclxuICAgKi9cclxuICBwdWJsaWMgc2V0Rm9udFNpemUoIHNpemU6IHN0cmluZyB8IG51bWJlciApOiB0aGlzIHtcclxuICAgIHJldHVybiB0aGlzLnNldEZvbnQoIHRoaXMuX2ZvbnQuY29weSgge1xyXG4gICAgICBzaXplOiBzaXplXHJcbiAgICB9ICkgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgZm9udFNpemUoIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgKSB7IHRoaXMuc2V0Rm9udFNpemUoIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCBmb250U2l6ZSgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5nZXRGb250U2l6ZSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHNpemUgb2YgdGhpcyBub2RlJ3MgZm9udCwgc2VlIHNldEZvbnRTaXplKCkgZm9yIGRldGFpbHMuXHJcbiAgICpcclxuICAgKiBOT1RFOiBJZiBhIG51bWVyaWMgc2l6ZSB3YXMgcGFzc2VkIGluLCBpdCBoYXMgYmVlbiBjb252ZXJ0ZWQgdG8gYSBzdHJpbmcgd2l0aCAncHgnLCBhbmQgYSBzdHJpbmcgd2lsbCBiZVxyXG4gICAqIHJldHVybmVkIGhlcmUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldEZvbnRTaXplKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy5fZm9udC5nZXRTaXplKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGV0aGVyIHRoaXMgTm9kZSBpdHNlbGYgaXMgcGFpbnRlZCAoZGlzcGxheXMgc29tZXRoaW5nIGl0c2VsZikuXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGlzUGFpbnRlZCgpOiBib29sZWFuIHtcclxuICAgIC8vIEFsd2F5cyB0cnVlIGZvciBUZXh0IG5vZGVzXHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZXRoZXIgdGhpcyBOb2RlJ3Mgc2VsZkJvdW5kcyBhcmUgY29uc2lkZXJlZCB0byBiZSB2YWxpZCAoYWx3YXlzIGNvbnRhaW5pbmcgdGhlIGRpc3BsYXllZCBzZWxmIGNvbnRlbnRcclxuICAgKiBvZiB0aGlzIG5vZGUpLiBNZWFudCB0byBiZSBvdmVycmlkZGVuIGluIHN1YnR5cGVzIHdoZW4gdGhpcyBjYW4gY2hhbmdlIChlLmcuIFRleHQpLlxyXG4gICAqXHJcbiAgICogSWYgdGhpcyB2YWx1ZSB3b3VsZCBwb3RlbnRpYWxseSBjaGFuZ2UsIHBsZWFzZSB0cmlnZ2VyIHRoZSBldmVudCAnc2VsZkJvdW5kc1ZhbGlkJy5cclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgYXJlU2VsZkJvdW5kc1ZhbGlkKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2JvdW5kc01ldGhvZCA9PT0gJ2FjY3VyYXRlJztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE92ZXJyaWRlIGZvciBleHRyYSBpbmZvcm1hdGlvbiBpbiB0aGUgZGVidWdnaW5nIG91dHB1dCAoZnJvbSBEaXNwbGF5LmdldERlYnVnSFRNTCgpKS4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGdldERlYnVnSFRNTEV4dHJhcygpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGAgXCIke2VzY2FwZUhUTUwoIHRoaXMucmVuZGVyZWRUZXh0ICl9XCIke3RoaXMuX2lzSFRNTCA/ICcgKGh0bWwpJyA6ICcnfWA7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuXHJcbiAgICB0aGlzLl9zdHJpbmdQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXBsYWNlcyBlbWJlZGRpbmcgbWFyayBjaGFyYWN0ZXJzIHdpdGggdmlzaWJsZSBzdHJpbmdzLiBVc2VmdWwgZm9yIGRlYnVnZ2luZyBmb3Igc3RyaW5ncyB3aXRoIGVtYmVkZGluZyBtYXJrcy5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIC0gV2l0aCBlbWJlZGRpbmcgbWFya3MgcmVwbGFjZWQuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBlbWJlZGRlZERlYnVnU3RyaW5nKCBzdHJpbmc6IHN0cmluZyApOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKCAvXFx1MjAyYS9nLCAnW0xUUl0nICkucmVwbGFjZSggL1xcdTIwMmIvZywgJ1tSVExdJyApLnJlcGxhY2UoIC9cXHUyMDJjL2csICdbUE9QXScgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSAocG90ZW50aWFsbHkpIG1vZGlmaWVkIHN0cmluZyB3aGVyZSBlbWJlZGRpbmcgbWFya3MgaGF2ZSBiZWVuIHNpbXBsaWZpZWQuXHJcbiAgICpcclxuICAgKiBUaGlzIHNpbXBsaWZpY2F0aW9uIHdvdWxkbid0IHVzdWFsbHkgYmUgbmVjZXNzYXJ5LCBidXQgd2UgbmVlZCB0byBwcmV2ZW50IGNhc2VzIGxpa2VcclxuICAgKiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvNTIwIHdoZXJlIEVkZ2UgZGVjaWRlcyB0byB0dXJuIFtQT1BdW0xUUl0gKGFmdGVyIGFub3RoZXIgW0xUUl0pIGludG9cclxuICAgKiBhICdib3gnIGNoYXJhY3Rlciwgd2hlbiBub3RoaW5nIHNob3VsZCBiZSByZW5kZXJlZC5cclxuICAgKlxyXG4gICAqIFRoaXMgd2lsbCByZW1vdmUgcmVkdW5kYW50IG5lc3Rpbmc6XHJcbiAgICogICBlLmcuIFtMVFJdW0xUUl1ib29bUE9QXVtQT1BdID0+IFtMVFJdYm9vW1BPUF0pXHJcbiAgICogYW5kIHdpbGwgYWxzbyBjb21iaW5lIGFkamFjZW50IGRpcmVjdGlvbnM6XHJcbiAgICogICBlLmcuIFtMVFJdTWFpbFtQT1BdW0xUUl1NYW5bUE9QXSA9PiBbTFRSXU1haWxNYW5bUG9wXVxyXG4gICAqXHJcbiAgICogTm90ZSB0aGF0IGl0IHdpbGwgTk9UIGNvbWJpbmUgaW4gdGhpcyB3YXkgaWYgdGhlcmUgd2FzIGEgc3BhY2UgYmV0d2VlbiB0aGUgdHdvIExUUnM6XHJcbiAgICogICBlLmcuIFtMVFJdTWFpbFtQT1BdIFtMVFJdTWFuW1BvcF0pXHJcbiAgICogYXMgaW4gdGhlIGdlbmVyYWwgY2FzZSwgd2UnbGwgd2FudCB0byBwcmVzZXJ2ZSB0aGUgYnJlYWsgdGhlcmUgYmV0d2VlbiBlbWJlZGRpbmdzLlxyXG4gICAqXHJcbiAgICogVE9ETzogQSBzdGFjay1iYXNlZCBpbXBsZW1lbnRhdGlvbiB0aGF0IGRvZXNuJ3QgY3JlYXRlIGEgYnVuY2ggb2Ygb2JqZWN0cy9jbG9zdXJlcyB3b3VsZCBiZSBuaWNlIGZvciBwZXJmb3JtYW5jZS5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHNpbXBsaWZ5RW1iZWRkaW5nTWFya3MoIHN0cmluZzogc3RyaW5nICk6IHN0cmluZyB7XHJcbiAgICAvLyBGaXJzdCwgd2UnbGwgY29udmVydCB0aGUgc3RyaW5nIGludG8gYSB0cmVlIGZvcm0sIHdoZXJlIGVhY2ggbm9kZSBpcyBlaXRoZXIgYSBzdHJpbmcgb2JqZWN0IE9SIGFuIG9iamVjdCBvZiB0aGVcclxuICAgIC8vIG5vZGUgdHlwZSB7IGRpcjoge0xUUnx8UlRMfSwgY2hpbGRyZW46IHtBcnJheS48bm9kZT59LCBwYXJlbnQ6IHtudWxsfG5vZGV9IH0uIFRodXMgZWFjaCBMVFIuLi5QT1AgYW5kIFJUTC4uLlBPUFxyXG4gICAgLy8gYmVjb21lIGEgbm9kZSB3aXRoIHRoZWlyIGludGVyaW9ycyBiZWNvbWluZyBjaGlsZHJlbi5cclxuXHJcbiAgICB0eXBlIEVtYmVkTm9kZSA9IHtcclxuICAgICAgZGlyOiBudWxsIHwgJ1xcdTIwMmEnIHwgJ1xcdTIwMmInO1xyXG4gICAgICBjaGlsZHJlbjogKCBFbWJlZE5vZGUgfCBzdHJpbmcgKVtdO1xyXG4gICAgICBwYXJlbnQ6IEVtYmVkTm9kZSB8IG51bGw7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIFJvb3Qgbm9kZSAobm8gZGlyZWN0aW9uLCBzbyB3ZSBwcmVzZXJ2ZSByb290IExUUi9SVExzKVxyXG4gICAgY29uc3Qgcm9vdCA9IHtcclxuICAgICAgZGlyOiBudWxsLFxyXG4gICAgICBjaGlsZHJlbjogW10sXHJcbiAgICAgIHBhcmVudDogbnVsbFxyXG4gICAgfSBhcyBFbWJlZE5vZGU7XHJcbiAgICBsZXQgY3VycmVudDogRW1iZWROb2RlID0gcm9vdDtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHN0cmluZy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgY2hyID0gc3RyaW5nLmNoYXJBdCggaSApO1xyXG5cclxuICAgICAgLy8gUHVzaCBhIGRpcmVjdGlvblxyXG4gICAgICBpZiAoIGNociA9PT0gTFRSIHx8IGNociA9PT0gUlRMICkge1xyXG4gICAgICAgIGNvbnN0IG5vZGUgPSB7XHJcbiAgICAgICAgICBkaXI6IGNocixcclxuICAgICAgICAgIGNoaWxkcmVuOiBbXSxcclxuICAgICAgICAgIHBhcmVudDogY3VycmVudFxyXG4gICAgICAgIH0gYXMgRW1iZWROb2RlO1xyXG4gICAgICAgIGN1cnJlbnQuY2hpbGRyZW4ucHVzaCggbm9kZSApO1xyXG4gICAgICAgIGN1cnJlbnQgPSBub2RlO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIFBvcCBhIGRpcmVjdGlvblxyXG4gICAgICBlbHNlIGlmICggY2hyID09PSBQT1AgKSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggY3VycmVudC5wYXJlbnQsIGBCYWQgbmVzdGluZyBvZiBlbWJlZGRpbmcgbWFya3M6ICR7VGV4dC5lbWJlZGRlZERlYnVnU3RyaW5nKCBzdHJpbmcgKX1gICk7XHJcbiAgICAgICAgY3VycmVudCA9IGN1cnJlbnQucGFyZW50ITtcclxuICAgICAgfVxyXG4gICAgICAvLyBBcHBlbmQgY2hhcmFjdGVycyB0byB0aGUgY3VycmVudCBkaXJlY3Rpb25cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgY3VycmVudC5jaGlsZHJlbi5wdXNoKCBjaHIgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggY3VycmVudCA9PT0gcm9vdCwgYEJhZCBuZXN0aW5nIG9mIGVtYmVkZGluZyBtYXJrczogJHtUZXh0LmVtYmVkZGVkRGVidWdTdHJpbmcoIHN0cmluZyApfWAgKTtcclxuXHJcbiAgICAvLyBSZW1vdmUgcmVkdW5kYW50IG5lc3RpbmcgKGUuZy4gW0xUUl1bTFRSXS4uLltQT1BdW1BPUF0pXHJcbiAgICBmdW5jdGlvbiBjb2xsYXBzZU5lc3RpbmcoIG5vZGU6IEVtYmVkTm9kZSApOiB2b2lkIHtcclxuICAgICAgZm9yICggbGV0IGkgPSBub2RlLmNoaWxkcmVuLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tICkge1xyXG4gICAgICAgIGNvbnN0IGNoaWxkID0gbm9kZS5jaGlsZHJlblsgaSBdO1xyXG4gICAgICAgIGlmICggdHlwZW9mIGNoaWxkICE9PSAnc3RyaW5nJyAmJiBub2RlLmRpciA9PT0gY2hpbGQuZGlyICkge1xyXG4gICAgICAgICAgbm9kZS5jaGlsZHJlbi5zcGxpY2UoIGksIDEsIC4uLmNoaWxkLmNoaWxkcmVuICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmVtb3ZlIG92ZXJyaWRkZW4gbmVzdGluZyAoZS5nLiBbTFRSXVtSVExdLi4uW1BPUF1bUE9QXSksIHNpbmNlIHRoZSBvdXRlciBvbmUgaXMgbm90IG5lZWRlZFxyXG4gICAgZnVuY3Rpb24gY29sbGFwc2VVbm5lY2Vzc2FyeSggbm9kZTogRW1iZWROb2RlICk6IHZvaWQge1xyXG4gICAgICBpZiAoIG5vZGUuY2hpbGRyZW4ubGVuZ3RoID09PSAxICYmIHR5cGVvZiBub2RlLmNoaWxkcmVuWyAwIF0gIT09ICdzdHJpbmcnICYmIG5vZGUuY2hpbGRyZW5bIDAgXS5kaXIgKSB7XHJcbiAgICAgICAgbm9kZS5kaXIgPSBub2RlLmNoaWxkcmVuWyAwIF0uZGlyO1xyXG4gICAgICAgIG5vZGUuY2hpbGRyZW4gPSBub2RlLmNoaWxkcmVuWyAwIF0uY2hpbGRyZW47XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBDb2xsYXBzZSBhZGphY2VudCBtYXRjaGluZyBkaXJzLCBlLmcuIFtMVFJdLi4uW1BPUF1bTFRSXS4uLltQT1BdXHJcbiAgICBmdW5jdGlvbiBjb2xsYXBzZUFkamFjZW50KCBub2RlOiBFbWJlZE5vZGUgKTogdm9pZCB7XHJcbiAgICAgIGZvciAoIGxldCBpID0gbm9kZS5jaGlsZHJlbi5sZW5ndGggLSAxOyBpID49IDE7IGktLSApIHtcclxuICAgICAgICBjb25zdCBwcmV2aW91c0NoaWxkID0gbm9kZS5jaGlsZHJlblsgaSAtIDEgXTtcclxuICAgICAgICBjb25zdCBjaGlsZCA9IG5vZGUuY2hpbGRyZW5bIGkgXTtcclxuICAgICAgICBpZiAoIHR5cGVvZiBjaGlsZCAhPT0gJ3N0cmluZycgJiYgdHlwZW9mIHByZXZpb3VzQ2hpbGQgIT09ICdzdHJpbmcnICYmIGNoaWxkLmRpciAmJiBwcmV2aW91c0NoaWxkLmRpciA9PT0gY2hpbGQuZGlyICkge1xyXG4gICAgICAgICAgcHJldmlvdXNDaGlsZC5jaGlsZHJlbiA9IHByZXZpb3VzQ2hpbGQuY2hpbGRyZW4uY29uY2F0KCBjaGlsZC5jaGlsZHJlbiApO1xyXG4gICAgICAgICAgbm9kZS5jaGlsZHJlbi5zcGxpY2UoIGksIDEgKTtcclxuXHJcbiAgICAgICAgICAvLyBOb3cgdHJ5IHRvIGNvbGxhcHNlIGFkamFjZW50IGl0ZW1zIGluIHRoZSBjaGlsZCwgc2luY2Ugd2UgY29tYmluZWQgY2hpbGRyZW4gYXJyYXlzXHJcbiAgICAgICAgICBjb2xsYXBzZUFkamFjZW50KCBwcmV2aW91c0NoaWxkICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2ltcGxpZmllcyB0aGUgdHJlZSB1c2luZyB0aGUgYWJvdmUgZnVuY3Rpb25zXHJcbiAgICBmdW5jdGlvbiBzaW1wbGlmeSggbm9kZTogRW1iZWROb2RlIHwgc3RyaW5nICk6IHN0cmluZyB8IEVtYmVkTm9kZSB7XHJcbiAgICAgIGlmICggdHlwZW9mIG5vZGUgIT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICBzaW1wbGlmeSggbm9kZS5jaGlsZHJlblsgaSBdICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb2xsYXBzZVVubmVjZXNzYXJ5KCBub2RlICk7XHJcbiAgICAgICAgY29sbGFwc2VOZXN0aW5nKCBub2RlICk7XHJcbiAgICAgICAgY29sbGFwc2VBZGphY2VudCggbm9kZSApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gbm9kZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUdXJucyBhIHRyZWUgaW50byBhIHN0cmluZ1xyXG4gICAgZnVuY3Rpb24gc3RyaW5naWZ5KCBub2RlOiBFbWJlZE5vZGUgfCBzdHJpbmcgKTogc3RyaW5nIHtcclxuICAgICAgaWYgKCB0eXBlb2Ygbm9kZSA9PT0gJ3N0cmluZycgKSB7XHJcbiAgICAgICAgcmV0dXJuIG5vZGU7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgY2hpbGRTdHJpbmcgPSBub2RlLmNoaWxkcmVuLm1hcCggc3RyaW5naWZ5ICkuam9pbiggJycgKTtcclxuICAgICAgaWYgKCBub2RlLmRpciApIHtcclxuICAgICAgICByZXR1cm4gYCR7bm9kZS5kaXIgKyBjaGlsZFN0cmluZ31cXHUyMDJjYDtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gY2hpbGRTdHJpbmc7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc3RyaW5naWZ5KCBzaW1wbGlmeSggcm9vdCApICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIFRleHRJTzogSU9UeXBlO1xyXG59XHJcblxyXG4vKipcclxuICoge0FycmF5LjxzdHJpbmc+fSAtIFN0cmluZyBrZXlzIGZvciBhbGwgb2YgdGhlIGFsbG93ZWQgb3B0aW9ucyB0aGF0IHdpbGwgYmUgc2V0IGJ5IG5vZGUubXV0YXRlKCBvcHRpb25zICksIGluIHRoZVxyXG4gKiBvcmRlciB0aGV5IHdpbGwgYmUgZXZhbHVhdGVkIGluLlxyXG4gKlxyXG4gKiBOT1RFOiBTZWUgTm9kZSdzIF9tdXRhdG9yS2V5cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uIG9uIGhvdyB0aGlzIG9wZXJhdGVzLCBhbmQgcG90ZW50aWFsIHNwZWNpYWxcclxuICogICAgICAgY2FzZXMgdGhhdCBtYXkgYXBwbHkuXHJcbiAqL1xyXG5UZXh0LnByb3RvdHlwZS5fbXV0YXRvcktleXMgPSBbIC4uLlBBSU5UQUJMRV9PUFRJT05fS0VZUywgLi4uVEVYVF9PUFRJT05fS0VZUywgLi4uTm9kZS5wcm90b3R5cGUuX211dGF0b3JLZXlzIF07XHJcblxyXG4vKipcclxuICoge0FycmF5LjxTdHJpbmc+fSAtIExpc3Qgb2YgYWxsIGRpcnR5IGZsYWdzIHRoYXQgc2hvdWxkIGJlIGF2YWlsYWJsZSBvbiBkcmF3YWJsZXMgY3JlYXRlZCBmcm9tIHRoaXMgbm9kZSAob3JcclxuICogICAgICAgICAgICAgICAgICAgIHN1YnR5cGUpLiBHaXZlbiBhIGZsYWcgKGUuZy4gcmFkaXVzKSwgaXQgaW5kaWNhdGVzIHRoZSBleGlzdGVuY2Ugb2YgYSBmdW5jdGlvblxyXG4gKiAgICAgICAgICAgICAgICAgICAgZHJhd2FibGUubWFya0RpcnR5UmFkaXVzKCkgdGhhdCB3aWxsIGluZGljYXRlIHRvIHRoZSBkcmF3YWJsZSB0aGF0IHRoZSByYWRpdXMgaGFzIGNoYW5nZWQuXHJcbiAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gKiBAb3ZlcnJpZGVcclxuICovXHJcblRleHQucHJvdG90eXBlLmRyYXdhYmxlTWFya0ZsYWdzID0gWyAuLi5Ob2RlLnByb3RvdHlwZS5kcmF3YWJsZU1hcmtGbGFncywgLi4uUEFJTlRBQkxFX0RSQVdBQkxFX01BUktfRkxBR1MsICd0ZXh0JywgJ2ZvbnQnLCAnYm91bmRzJyBdO1xyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ1RleHQnLCBUZXh0ICk7XHJcblxyXG4vLyBVbmljb2RlIGVtYmVkZGluZyBtYXJrcyB0aGF0IHdlIGNhbiBjb21iaW5lIHRvIHdvcmsgYXJvdW5kIHRoZSBFZGdlIGlzc3VlLlxyXG4vLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzUyMFxyXG5jb25zdCBMVFIgPSAnXFx1MjAyYSc7XHJcbmNvbnN0IFJUTCA9ICdcXHUyMDJiJztcclxuY29uc3QgUE9QID0gJ1xcdTIwMmMnO1xyXG5cclxuLy8gSW5pdGlhbGl6ZSBjb21wdXRhdGlvbiBvZiBoeWJyaWQgdGV4dFxyXG5UZXh0Qm91bmRzLmluaXRpYWxpemVUZXh0Qm91bmRzKCk7XHJcblxyXG5UZXh0LlRleHRJTyA9IG5ldyBJT1R5cGUoICdUZXh0SU8nLCB7XHJcbiAgdmFsdWVUeXBlOiBUZXh0LFxyXG4gIHN1cGVydHlwZTogTm9kZS5Ob2RlSU8sXHJcbiAgZG9jdW1lbnRhdGlvbjogJ1RleHQgdGhhdCBpcyBkaXNwbGF5ZWQgaW4gdGhlIHNpbXVsYXRpb24uIFRleHRJTyBoYXMgYSBuZXN0ZWQgUHJvcGVydHlJTy4mbHQ7U3RyaW5nJmd0OyBmb3IgJyArXHJcbiAgICAgICAgICAgICAgICAgJ3RoZSBjdXJyZW50IHN0cmluZyB2YWx1ZS4nXHJcbn0gKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLGNBQWMsTUFBaUMsb0NBQW9DO0FBQzFGLE9BQU9DLHNCQUFzQixNQUFNLDRDQUE0QztBQUMvRSxPQUFPQyxVQUFVLE1BQU0scUNBQXFDO0FBQzVELE9BQU9DLGFBQWEsTUFBTSx3Q0FBd0M7QUFDbEUsT0FBT0MsUUFBUSxNQUFNLG1DQUFtQztBQUN4RCxPQUFPQyxNQUFNLE1BQU0sOEJBQThCO0FBQ2pELE9BQU9DLE1BQU0sTUFBTSxvQ0FBb0M7QUFDdkQsT0FBT0MsWUFBWSxNQUErQixvQ0FBb0M7QUFJdEYsU0FBb0VDLElBQUksRUFBZ0RDLElBQUksRUFBZUMsU0FBUyxFQUFFQyw2QkFBNkIsRUFBRUMscUJBQXFCLEVBQW9CQyxRQUFRLEVBQUVDLE9BQU8sRUFBbUJDLFVBQVUsRUFBRUMsa0JBQWtCLEVBQUVDLGVBQWUsRUFBRUMsZUFBZSxRQUF1QixlQUFlO0FBRXhXLFNBQVNDLGNBQWMsUUFBUSxvQ0FBb0M7QUFFbkUsT0FBT0MsOEJBQThCLE1BQU0sc0RBQXNEO0FBRWpHLE1BQU1DLG9CQUFvQixHQUFHLGdCQUFnQixDQUFDLENBQUM7O0FBRS9DO0FBQ0EsTUFBTUMsZ0JBQWdCLEdBQUcsQ0FDdkIsY0FBYztBQUFFO0FBQ2hCRCxvQkFBb0I7QUFBRTtBQUN0QixRQUFRO0FBQUU7QUFDVixNQUFNO0FBQUU7QUFDUixZQUFZO0FBQUU7QUFDZCxZQUFZO0FBQUU7QUFDZCxhQUFhO0FBQUU7QUFDZixXQUFXO0FBQUU7QUFDYixVQUFVLENBQUM7QUFBQSxDQUNaOztBQUVEO0FBQ0E7QUFDQTtB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