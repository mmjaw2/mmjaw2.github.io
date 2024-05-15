// Copyright 2013-2024, University of Colorado Boulder

/**
 * Immutable font object.
 *
 * Examples:
 * new phet.scenery.Font().font                      // "10px sans-serif" (the default)
 * new phet.scenery.Font( { family: 'serif' } ).font // "10px serif"
 * new phet.scenery.Font( { weight: 'bold' } ).font  // "bold 10px sans-serif"
 * new phet.scenery.Font( { size: 16 } ).font        // "16px sans-serif"
 * var font = new phet.scenery.Font( {
 *   family: '"Times New Roman", serif',
 *   style: 'italic',
 *   lineHeight: 10
 * } );
 * font.font;                                   // "italic 10px/10 'Times New Roman', serif"
 * font.family;                                 // "'Times New Roman', serif"
 * font.weight;                                 // 400 (the default)
 *
 * Useful specs:
 * http://www.w3.org/TR/css3-fonts/
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import optionize, { combineOptions } from '../../../phet-core/js/optionize.js';
import PhetioObject from '../../../tandem/js/PhetioObject.js';
import IOType from '../../../tandem/js/types/IOType.js';
import StringIO from '../../../tandem/js/types/StringIO.js';
import { scenery } from '../imports.js';

// Valid values for the 'style' property of Font
const VALID_STYLES = ['normal', 'italic', 'oblique'];

// Valid values for the 'variant' property of Font
const VALID_VARIANTS = ['normal', 'small-caps'];

// Valid values for the 'weight' property of Font
const VALID_WEIGHTS = ['normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

// Valid values for the 'stretch' property of Font
const VALID_STRETCHES = ['normal', 'ultra-condensed', 'extra-condensed', 'condensed', 'semi-condensed', 'semi-expanded', 'expanded', 'extra-expanded', 'ultra-expanded'];
export default class Font extends PhetioObject {
  // See https://www.w3.org/TR/css-fonts-3/#propdef-font-style

  // See https://www.w3.org/TR/css-fonts-3/#font-variant-css21-values

  // See https://www.w3.org/TR/css-fonts-3/#propdef-font-weight

  // See https://www.w3.org/TR/css-fonts-3/#propdef-font-stretch

  // See https://www.w3.org/TR/css-fonts-3/#propdef-font-size

  // See https://www.w3.org/TR/CSS2/visudet.html#propdef-line-height

  // See https://www.w3.org/TR/css-fonts-3/#propdef-font-family

  // Shorthand font property

  constructor(providedOptions) {
    assert && assert(providedOptions === undefined || typeof providedOptions === 'object' && Object.getPrototypeOf(providedOptions) === Object.prototype, 'options, if provided, should be a raw object');
    const options = optionize()({
      // {string} - 'normal', 'italic' or 'oblique'
      style: 'normal',
      // {string} - 'normal' or 'small-caps'
      variant: 'normal',
      // {number|string} - 'normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700',
      // '800', '900', or a number that when cast to a string will be one of the strings above.
      weight: 'normal',
      // {string} - 'normal', 'ultra-condensed', 'extra-condensed', 'condensed', 'semi-condensed', 'semi-expanded',
      // 'expanded', 'extra-expanded' or 'ultra-expanded'
      stretch: 'normal',
      // {number|string} - A valid CSS font-size string, or a number representing a quantity of 'px'.
      size: '10px',
      // {string} - A valid CSS line-height, typically 'normal', a number, a CSS length (e.g. '15px'), or a percentage
      // of the normal height.
      lineHeight: 'normal',
      // {string} - A comma-separated list of families, which can include generic families (preferably at the end) such
      // as 'serif', 'sans-serif', 'cursive', 'fantasy' and 'monospace'. If there is any question about escaping (such
      // as spaces in a font name), the family should be surrounded by double quotes.
      family: 'sans-serif',
      phetioType: Font.FontIO
    }, providedOptions);
    assert && assert(typeof options.weight === 'string' || typeof options.weight === 'number', 'Font weight should be specified as a string or number');
    assert && assert(typeof options.size === 'string' || typeof options.size === 'number', 'Font size should be specified as a string or number');
    super(options);
    this._style = options.style;
    this._variant = options.variant;
    this._weight = `${options.weight}`; // cast to string, we'll double check it later
    this._stretch = options.stretch;
    this._size = Font.castSize(options.size);
    this._lineHeight = options.lineHeight;
    this._family = options.family;

    // sanity checks to prevent errors in interpretation or in the font shorthand usage
    assert && assert(typeof this._style === 'string' && _.includes(VALID_STYLES, this._style), 'Font style must be one of "normal", "italic", or "oblique"');
    assert && assert(typeof this._variant === 'string' && _.includes(VALID_VARIANTS, this._variant), 'Font variant must be "normal" or "small-caps"');
    assert && assert(typeof this._weight === 'string' && _.includes(VALID_WEIGHTS, this._weight), 'Font weight must be one of "normal", "bold", "bolder", "lighter", "100", "200", "300", "400", "500", "600", "700", "800", or "900"');
    assert && assert(typeof this._stretch === 'string' && _.includes(VALID_STRETCHES, this._stretch), 'Font stretch must be one of "normal", "ultra-condensed", "extra-condensed", "condensed", "semi-condensed", "semi-expanded", "expanded", "extra-expanded", or "ultra-expanded"');
    assert && assert(typeof this._size === 'string' && !_.includes(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], this._size[this._size.length - 1]), 'Font size must be either passed as a number (not a string, interpreted as px), or must contain a suffix for percentage, absolute or relative units, or an explicit size constant');
    assert && assert(typeof this._lineHeight === 'string');
    assert && assert(typeof this._family === 'string');

    // Initialize the shorthand font property
    this._font = this.computeShorthand();
  }

  /**
   * Returns this font's CSS shorthand, which includes all of the font's information reduced into a single string.
   *
   * This can be used for CSS as the 'font' attribute, or is needed to set Canvas fonts.
   *
   * https://www.w3.org/TR/css-fonts-3/#propdef-font contains detailed information on how this is formatted.
   */
  getFont() {
    return this._font;
  }
  get font() {
    return this.getFont();
  }

  /**
   * Returns this font's style. See the constructor for more details on valid values.
   */
  getStyle() {
    return this._style;
  }
  get style() {
    return this.getStyle();
  }

  /**
   * Returns this font's variant. See the constructor for more details on valid values.
   */
  getVariant() {
    return this._variant;
  }
  get variant() {
    return this.getVariant();
  }

  /**
   * Returns this font's weight. See the constructor for more details on valid values.
   *
   * NOTE: If a numeric weight was passed in, it has been cast to a string, and a string will be returned here.
   */
  getWeight() {
    return this._weight;
  }
  get weight() {
    return this.getWeight();
  }

  /**
   * Returns this font's stretch. See the constructor for more details on valid values.
   */
  getStretch() {
    return this._stretch;
  }
  get stretch() {
    return this.getStretch();
  }

  /**
   * Returns this font's size. See the constructor for more details on valid values.
   *
   * NOTE: If a numeric size was passed in, it has been cast to a string, and a string will be returned here.
   */
  getSize() {
    return this._size;
  }
  get size() {
    return this.getSize();
  }

  /**
   * Returns an approximate value of this font's size in px.
   */
  getNumericSize() {
    const pxMatch = this._size.match(/^(\d+)px$/);
    if (pxMatch) {
      return Number(pxMatch[1]);
    }
    const ptMatch = this._size.match(/^(\d+)pt$/);
    if (ptMatch) {
      return 0.75 * Number(ptMatch[1]);
    }
    const emMatch = this._size.match(/^(\d+)em$/);
    if (emMatch) {
      return Number(emMatch[1]) / 16;
    }
    return 12; // a guess?
  }
  get numericSize() {
    return this.getNumericSize();
  }

  /**
   * Returns this font's line-height. See the constructor for more details on valid values.
   */
  getLineHeight() {
    return this._lineHeight;
  }
  get lineHeight() {
    return this.getLineHeight();
  }

  /**
   * Returns this font's family. See the constructor for more details on valid values.
   */
  getFamily() {
    return this._family;
  }
  get family() {
    return this.getFamily();
  }

  /**
   * Returns a new Font object, which is a copy of this object. If options are provided, they override the current
   * values in this object.
   */
  copy(options) {
    // TODO: get merge working in typescript https://github.com/phetsims/scenery/issues/1581
    return new Font(combineOptions({
      style: this._style,
      variant: this._variant,
      weight: this._weight,
      stretch: this._stretch,
      size: this._size,
      lineHeight: this._lineHeight,
      family: this._family
    }, options));
  }

  /**
   * Computes the combined CSS shorthand font string.
   *
   * https://www.w3.org/TR/css-fonts-3/#propdef-font contains details about the format.
   */
  computeShorthand() {
    let ret = '';
    if (this._style !== 'normal') {
      ret += `${this._style} `;
    }
    if (this._variant !== 'normal') {
      ret += `${this._variant} `;
    }
    if (this._weight !== 'normal') {
      ret += `${this._weight} `;
    }
    if (this._stretch !== 'normal') {
      ret += `${this._stretch} `;
    }
    ret += this._size;
    if (this._lineHeight !== 'normal') {
      ret += `/${this._lineHeight}`;
    }
    ret += ` ${this._family}`;
    return ret;
  }

  /**
   * Returns this font's CSS shorthand, which includes all of the font's information reduced into a single string.
   *
   * NOTE: This is an alias of getFont().
   *
   * This can be used for CSS as the 'font' attribute, or is needed to set Canvas fonts.
   *
   * https://www.w3.org/TR/css-fonts-3/#propdef-font contains detailed information on how this is formatted.
   */
  toCSS() {
    return this.getFont();
  }

  /**
   * Converts a generic size to a specific CSS pixel string, assuming 'px' for numbers.
   *
   * @param size - If it's a number, 'px' will be appended
   */
  static castSize(size) {
    if (typeof size === 'number') {
      return `${size}px`; // add the pixels suffix by default for numbers
    } else {
      return size; // assume that it's a valid to-spec string
    }
  }
  static isFontStyle(style) {
    return VALID_STYLES.includes(style);
  }
  static isFontVariant(variant) {
    return VALID_VARIANTS.includes(variant);
  }
  static isFontWeight(weight) {
    return VALID_WEIGHTS.includes(weight);
  }
  static isFontStretch(stretch) {
    return VALID_STRETCHES.includes(stretch);
  }

  /**
   * Parses a CSS-compliant "font" shorthand string into a Font object.
   *
   * Font strings should be a valid CSS3 font declaration value (see http://www.w3.org/TR/css3-fonts/) which consists
   * of the following pattern:
   *   [ [ <‘font-style’> || <font-variant-css21> || <‘font-weight’> || <‘font-stretch’> ]? <‘font-size’>
   *   [ / <‘line-height’> ]? <‘font-family’> ]
   */
  static fromCSS(cssString) {
    // parse a somewhat proper CSS3 form (not guaranteed to handle it precisely the same as browsers yet)

    const options = {};

    // split based on whitespace allowed by CSS spec (more restrictive than regular regexp whitespace)
    const tokens = _.filter(cssString.split(/[\x09\x0A\x0C\x0D\x20]/), token => token.length > 0); // eslint-disable-line no-control-regex

    // pull tokens out until we reach something that doesn't match. that must be the font size (according to spec)
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token === 'normal') {
        // nothing has to be done, everything already normal as default
      } else if (Font.isFontStyle(token)) {
        assert && assert(options.style === undefined, `Style cannot be applied twice. Already set to "${options.style}", attempt to replace with "${token}"`);
        options.style = token;
      } else if (Font.isFontVariant(token)) {
        assert && assert(options.variant === undefined, `Variant cannot be applied twice. Already set to "${options.variant}", attempt to replace with "${token}"`);
        options.variant = token;
      } else if (Font.isFontWeight(token)) {
        assert && assert(options.weight === undefined, `Weight cannot be applied twice. Already set to "${options.weight}", attempt to replace with "${token}"`);
        options.weight = token;
      } else if (Font.isFontStretch(token)) {
        assert && assert(options.stretch === undefined, `Stretch cannot be applied twice. Already set to "${options.stretch}", attempt to replace with "${token}"`);
        options.stretch = token;
      } else {
        // not a style/variant/weight/stretch, must be a font size, possibly with an included line-height
        const subtokens = token.split(/\//); // extract font size from any line-height
        options.size = subtokens[0];
        if (subtokens[1]) {
          options.lineHeight = subtokens[1];
        }
        // all future tokens are guaranteed to be part of the font-family if it is given according to spec
        options.family = tokens.slice(i + 1).join(' ');
        break;
      }
    }
    return new Font(options);
  }
  // {Font} - Default Font object (since they are immutable).
  static DEFAULT = new Font();
}
scenery.register('Font', Font);
Font.FontIO = new IOType('FontIO', {
  valueType: Font,
  documentation: 'Font handling for text drawing. Options:' + '<ul>' + '<li><strong>style:</strong> normal      &mdash; normal | italic | oblique </li>' + '<li><strong>variant:</strong> normal    &mdash; normal | small-caps </li>' + '<li><strong>weight:</strong> normal     &mdash; normal | bold | bolder | lighter | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 </li>' + '<li><strong>stretch:</strong> normal    &mdash; normal | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded </li>' + '<li><strong>size:</strong> 10px         &mdash; absolute-size | relative-size | length | percentage -- unitless number interpreted as px. absolute suffixes: cm, mm, in, pt, pc, px. relative suffixes: em, ex, ch, rem, vw, vh, vmin, vmax. </li>' + '<li><strong>lineHeight:</strong> normal &mdash; normal | number | length | percentage -- NOTE: Canvas spec forces line-height to normal </li>' + '<li><strong>family:</strong> sans-serif &mdash; comma-separated list of families, including generic families (serif, sans-serif, cursive, fantasy, monospace). ideally escape with double-quotes</li>' + '</ul>',
  toStateObject: font => ({
    style: font.getStyle(),
    variant: font.getVariant(),
    weight: font.getWeight(),
    stretch: font.getStretch(),
    size: font.getSize(),
    lineHeight: font.getLineHeight(),
    family: font.getFamily()
  }),
  fromStateObject(stateObject) {
    return new Font(stateObject);
  },
  stateSchema: {
    style: StringIO,
    variant: StringIO,
    weight: StringIO,
    stretch: StringIO,
    size: StringIO,
    lineHeight: StringIO,
    family: StringIO
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJvcHRpb25pemUiLCJjb21iaW5lT3B0aW9ucyIsIlBoZXRpb09iamVjdCIsIklPVHlwZSIsIlN0cmluZ0lPIiwic2NlbmVyeSIsIlZBTElEX1NUWUxFUyIsIlZBTElEX1ZBUklBTlRTIiwiVkFMSURfV0VJR0hUUyIsIlZBTElEX1NUUkVUQ0hFUyIsIkZvbnQiLCJjb25zdHJ1Y3RvciIsInByb3ZpZGVkT3B0aW9ucyIsImFzc2VydCIsInVuZGVmaW5lZCIsIk9iamVjdCIsImdldFByb3RvdHlwZU9mIiwicHJvdG90eXBlIiwib3B0aW9ucyIsInN0eWxlIiwidmFyaWFudCIsIndlaWdodCIsInN0cmV0Y2giLCJzaXplIiwibGluZUhlaWdodCIsImZhbWlseSIsInBoZXRpb1R5cGUiLCJGb250SU8iLCJfc3R5bGUiLCJfdmFyaWFudCIsIl93ZWlnaHQiLCJfc3RyZXRjaCIsIl9zaXplIiwiY2FzdFNpemUiLCJfbGluZUhlaWdodCIsIl9mYW1pbHkiLCJfIiwiaW5jbHVkZXMiLCJsZW5ndGgiLCJfZm9udCIsImNvbXB1dGVTaG9ydGhhbmQiLCJnZXRGb250IiwiZm9udCIsImdldFN0eWxlIiwiZ2V0VmFyaWFudCIsImdldFdlaWdodCIsImdldFN0cmV0Y2giLCJnZXRTaXplIiwiZ2V0TnVtZXJpY1NpemUiLCJweE1hdGNoIiwibWF0Y2giLCJOdW1iZXIiLCJwdE1hdGNoIiwiZW1NYXRjaCIsIm51bWVyaWNTaXplIiwiZ2V0TGluZUhlaWdodCIsImdldEZhbWlseSIsImNvcHkiLCJyZXQiLCJ0b0NTUyIsImlzRm9udFN0eWxlIiwiaXNGb250VmFyaWFudCIsImlzRm9udFdlaWdodCIsImlzRm9udFN0cmV0Y2giLCJmcm9tQ1NTIiwiY3NzU3RyaW5nIiwidG9rZW5zIiwiZmlsdGVyIiwic3BsaXQiLCJ0b2tlbiIsImkiLCJzdWJ0b2tlbnMiLCJzbGljZSIsImpvaW4iLCJERUZBVUxUIiwicmVnaXN0ZXIiLCJ2YWx1ZVR5cGUiLCJkb2N1bWVudGF0aW9uIiwidG9TdGF0ZU9iamVjdCIsImZyb21TdGF0ZU9iamVjdCIsInN0YXRlT2JqZWN0Iiwic3RhdGVTY2hlbWEiXSwic291cmNlcyI6WyJGb250LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEltbXV0YWJsZSBmb250IG9iamVjdC5cclxuICpcclxuICogRXhhbXBsZXM6XHJcbiAqIG5ldyBwaGV0LnNjZW5lcnkuRm9udCgpLmZvbnQgICAgICAgICAgICAgICAgICAgICAgLy8gXCIxMHB4IHNhbnMtc2VyaWZcIiAodGhlIGRlZmF1bHQpXHJcbiAqIG5ldyBwaGV0LnNjZW5lcnkuRm9udCggeyBmYW1pbHk6ICdzZXJpZicgfSApLmZvbnQgLy8gXCIxMHB4IHNlcmlmXCJcclxuICogbmV3IHBoZXQuc2NlbmVyeS5Gb250KCB7IHdlaWdodDogJ2JvbGQnIH0gKS5mb250ICAvLyBcImJvbGQgMTBweCBzYW5zLXNlcmlmXCJcclxuICogbmV3IHBoZXQuc2NlbmVyeS5Gb250KCB7IHNpemU6IDE2IH0gKS5mb250ICAgICAgICAvLyBcIjE2cHggc2Fucy1zZXJpZlwiXHJcbiAqIHZhciBmb250ID0gbmV3IHBoZXQuc2NlbmVyeS5Gb250KCB7XHJcbiAqICAgZmFtaWx5OiAnXCJUaW1lcyBOZXcgUm9tYW5cIiwgc2VyaWYnLFxyXG4gKiAgIHN0eWxlOiAnaXRhbGljJyxcclxuICogICBsaW5lSGVpZ2h0OiAxMFxyXG4gKiB9ICk7XHJcbiAqIGZvbnQuZm9udDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFwiaXRhbGljIDEwcHgvMTAgJ1RpbWVzIE5ldyBSb21hbicsIHNlcmlmXCJcclxuICogZm9udC5mYW1pbHk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gXCInVGltZXMgTmV3IFJvbWFuJywgc2VyaWZcIlxyXG4gKiBmb250LndlaWdodDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyA0MDAgKHRoZSBkZWZhdWx0KVxyXG4gKlxyXG4gKiBVc2VmdWwgc3BlY3M6XHJcbiAqIGh0dHA6Ly93d3cudzMub3JnL1RSL2NzczMtZm9udHMvXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgb3B0aW9uaXplLCB7IGNvbWJpbmVPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBQaGV0aW9PYmplY3QsIHsgUGhldGlvT2JqZWN0T3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy9QaGV0aW9PYmplY3QuanMnO1xyXG5pbXBvcnQgSU9UeXBlIGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy90eXBlcy9JT1R5cGUuanMnO1xyXG5pbXBvcnQgU3RyaW5nSU8gZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL3R5cGVzL1N0cmluZ0lPLmpzJztcclxuaW1wb3J0IHsgc2NlbmVyeSB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5cclxuLy8gVmFsaWQgdmFsdWVzIGZvciB0aGUgJ3N0eWxlJyBwcm9wZXJ0eSBvZiBGb250XHJcbmNvbnN0IFZBTElEX1NUWUxFUyA9IFsgJ25vcm1hbCcsICdpdGFsaWMnLCAnb2JsaXF1ZScgXTtcclxuXHJcbi8vIFZhbGlkIHZhbHVlcyBmb3IgdGhlICd2YXJpYW50JyBwcm9wZXJ0eSBvZiBGb250XHJcbmNvbnN0IFZBTElEX1ZBUklBTlRTID0gWyAnbm9ybWFsJywgJ3NtYWxsLWNhcHMnIF07XHJcblxyXG4vLyBWYWxpZCB2YWx1ZXMgZm9yIHRoZSAnd2VpZ2h0JyBwcm9wZXJ0eSBvZiBGb250XHJcbmNvbnN0IFZBTElEX1dFSUdIVFMgPSBbICdub3JtYWwnLCAnYm9sZCcsICdib2xkZXInLCAnbGlnaHRlcicsXHJcbiAgJzEwMCcsICcyMDAnLCAnMzAwJywgJzQwMCcsICc1MDAnLCAnNjAwJywgJzcwMCcsICc4MDAnLCAnOTAwJyBdO1xyXG5cclxuLy8gVmFsaWQgdmFsdWVzIGZvciB0aGUgJ3N0cmV0Y2gnIHByb3BlcnR5IG9mIEZvbnRcclxuY29uc3QgVkFMSURfU1RSRVRDSEVTID0gWyAnbm9ybWFsJywgJ3VsdHJhLWNvbmRlbnNlZCcsICdleHRyYS1jb25kZW5zZWQnLCAnY29uZGVuc2VkJywgJ3NlbWktY29uZGVuc2VkJyxcclxuICAnc2VtaS1leHBhbmRlZCcsICdleHBhbmRlZCcsICdleHRyYS1leHBhbmRlZCcsICd1bHRyYS1leHBhbmRlZCcgXTtcclxuXHJcbmV4cG9ydCB0eXBlIEZvbnRTdHlsZSA9ICdub3JtYWwnIHwgJ2l0YWxpYycgfCAnb2JsaXF1ZSc7XHJcbmV4cG9ydCB0eXBlIEZvbnRWYXJpYW50ID0gJ25vcm1hbCcgfCAnc21hbGwtY2Fwcyc7XHJcbmV4cG9ydCB0eXBlIEZvbnRXZWlnaHQgPVxyXG4gICdub3JtYWwnXHJcbiAgfCAnYm9sZCdcclxuICB8ICdib2xkZXInXHJcbiAgfCAnbGlnaHRlcidcclxuICB8ICcxMDAnXHJcbiAgfCAnMjAwJ1xyXG4gIHwgJzMwMCdcclxuICB8ICc0MDAnXHJcbiAgfCAnNTAwJ1xyXG4gIHwgJzYwMCdcclxuICB8ICc3MDAnXHJcbiAgfCAnODAwJ1xyXG4gIHwgJzkwMCc7XHJcbmV4cG9ydCB0eXBlIEZvbnRTdHJldGNoID1cclxuICAnbm9ybWFsJ1xyXG4gIHwgJ3VsdHJhLWNvbmRlbnNlZCdcclxuICB8ICdleHRyYS1jb25kZW5zZWQnXHJcbiAgfCAnY29uZGVuc2VkJ1xyXG4gIHwgJ3NlbWktY29uZGVuc2VkJ1xyXG4gIHwgJ3NlbWktZXhwYW5kZWQnXHJcbiAgfCAnZXhwYW5kZWQnXHJcbiAgfCAnZXh0cmEtZXhwYW5kZWQnXHJcbiAgfCAndWx0cmEtZXhwYW5kZWQnO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuICBzdHlsZT86IEZvbnRTdHlsZTtcclxuICB2YXJpYW50PzogRm9udFZhcmlhbnQ7XHJcbiAgd2VpZ2h0PzogbnVtYmVyIHwgRm9udFdlaWdodDtcclxuICBzdHJldGNoPzogRm9udFN0cmV0Y2g7XHJcbiAgc2l6ZT86IG51bWJlciB8IHN0cmluZztcclxuICBsaW5lSGVpZ2h0Pzogc3RyaW5nO1xyXG4gIGZhbWlseT86IHN0cmluZztcclxufTtcclxuZXhwb3J0IHR5cGUgRm9udE9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIFBoZXRpb09iamVjdE9wdGlvbnM7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGb250IGV4dGVuZHMgUGhldGlvT2JqZWN0IHtcclxuXHJcbiAgLy8gU2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9jc3MtZm9udHMtMy8jcHJvcGRlZi1mb250LXN0eWxlXHJcbiAgcHJpdmF0ZSByZWFkb25seSBfc3R5bGU6IEZvbnRTdHlsZTtcclxuXHJcbiAgLy8gU2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9jc3MtZm9udHMtMy8jZm9udC12YXJpYW50LWNzczIxLXZhbHVlc1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgX3ZhcmlhbnQ6IEZvbnRWYXJpYW50O1xyXG5cclxuICAvLyBTZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL2Nzcy1mb250cy0zLyNwcm9wZGVmLWZvbnQtd2VpZ2h0XHJcbiAgcHJpdmF0ZSByZWFkb25seSBfd2VpZ2h0OiBGb250V2VpZ2h0O1xyXG5cclxuICAvLyBTZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL2Nzcy1mb250cy0zLyNwcm9wZGVmLWZvbnQtc3RyZXRjaFxyXG4gIHByaXZhdGUgcmVhZG9ubHkgX3N0cmV0Y2g6IEZvbnRTdHJldGNoO1xyXG5cclxuICAvLyBTZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL2Nzcy1mb250cy0zLyNwcm9wZGVmLWZvbnQtc2l6ZVxyXG4gIHByaXZhdGUgcmVhZG9ubHkgX3NpemU6IHN0cmluZztcclxuXHJcbiAgLy8gU2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9DU1MyL3Zpc3VkZXQuaHRtbCNwcm9wZGVmLWxpbmUtaGVpZ2h0XHJcbiAgcHJpdmF0ZSByZWFkb25seSBfbGluZUhlaWdodDogc3RyaW5nO1xyXG5cclxuICAvLyBTZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL2Nzcy1mb250cy0zLyNwcm9wZGVmLWZvbnQtZmFtaWx5XHJcbiAgcHJpdmF0ZSByZWFkb25seSBfZmFtaWx5OiBzdHJpbmc7XHJcblxyXG4gIC8vIFNob3J0aGFuZCBmb250IHByb3BlcnR5XHJcbiAgcHJpdmF0ZSByZWFkb25seSBfZm9udDogc3RyaW5nO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHByb3ZpZGVkT3B0aW9ucz86IEZvbnRPcHRpb25zICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcHJvdmlkZWRPcHRpb25zID09PSB1bmRlZmluZWQgfHwgKCB0eXBlb2YgcHJvdmlkZWRPcHRpb25zID09PSAnb2JqZWN0JyAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoIHByb3ZpZGVkT3B0aW9ucyApID09PSBPYmplY3QucHJvdG90eXBlICksXHJcbiAgICAgICdvcHRpb25zLCBpZiBwcm92aWRlZCwgc2hvdWxkIGJlIGEgcmF3IG9iamVjdCcgKTtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPEZvbnRPcHRpb25zLCBTZWxmT3B0aW9ucywgUGhldGlvT2JqZWN0T3B0aW9ucz4oKSgge1xyXG4gICAgICAvLyB7c3RyaW5nfSAtICdub3JtYWwnLCAnaXRhbGljJyBvciAnb2JsaXF1ZSdcclxuICAgICAgc3R5bGU6ICdub3JtYWwnLFxyXG5cclxuICAgICAgLy8ge3N0cmluZ30gLSAnbm9ybWFsJyBvciAnc21hbGwtY2FwcydcclxuICAgICAgdmFyaWFudDogJ25vcm1hbCcsXHJcblxyXG4gICAgICAvLyB7bnVtYmVyfHN0cmluZ30gLSAnbm9ybWFsJywgJ2JvbGQnLCAnYm9sZGVyJywgJ2xpZ2h0ZXInLCAnMTAwJywgJzIwMCcsICczMDAnLCAnNDAwJywgJzUwMCcsICc2MDAnLCAnNzAwJyxcclxuICAgICAgLy8gJzgwMCcsICc5MDAnLCBvciBhIG51bWJlciB0aGF0IHdoZW4gY2FzdCB0byBhIHN0cmluZyB3aWxsIGJlIG9uZSBvZiB0aGUgc3RyaW5ncyBhYm92ZS5cclxuICAgICAgd2VpZ2h0OiAnbm9ybWFsJyxcclxuXHJcbiAgICAgIC8vIHtzdHJpbmd9IC0gJ25vcm1hbCcsICd1bHRyYS1jb25kZW5zZWQnLCAnZXh0cmEtY29uZGVuc2VkJywgJ2NvbmRlbnNlZCcsICdzZW1pLWNvbmRlbnNlZCcsICdzZW1pLWV4cGFuZGVkJyxcclxuICAgICAgLy8gJ2V4cGFuZGVkJywgJ2V4dHJhLWV4cGFuZGVkJyBvciAndWx0cmEtZXhwYW5kZWQnXHJcbiAgICAgIHN0cmV0Y2g6ICdub3JtYWwnLFxyXG5cclxuICAgICAgLy8ge251bWJlcnxzdHJpbmd9IC0gQSB2YWxpZCBDU1MgZm9udC1zaXplIHN0cmluZywgb3IgYSBudW1iZXIgcmVwcmVzZW50aW5nIGEgcXVhbnRpdHkgb2YgJ3B4Jy5cclxuICAgICAgc2l6ZTogJzEwcHgnLFxyXG5cclxuICAgICAgLy8ge3N0cmluZ30gLSBBIHZhbGlkIENTUyBsaW5lLWhlaWdodCwgdHlwaWNhbGx5ICdub3JtYWwnLCBhIG51bWJlciwgYSBDU1MgbGVuZ3RoIChlLmcuICcxNXB4JyksIG9yIGEgcGVyY2VudGFnZVxyXG4gICAgICAvLyBvZiB0aGUgbm9ybWFsIGhlaWdodC5cclxuICAgICAgbGluZUhlaWdodDogJ25vcm1hbCcsXHJcblxyXG4gICAgICAvLyB7c3RyaW5nfSAtIEEgY29tbWEtc2VwYXJhdGVkIGxpc3Qgb2YgZmFtaWxpZXMsIHdoaWNoIGNhbiBpbmNsdWRlIGdlbmVyaWMgZmFtaWxpZXMgKHByZWZlcmFibHkgYXQgdGhlIGVuZCkgc3VjaFxyXG4gICAgICAvLyBhcyAnc2VyaWYnLCAnc2Fucy1zZXJpZicsICdjdXJzaXZlJywgJ2ZhbnRhc3knIGFuZCAnbW9ub3NwYWNlJy4gSWYgdGhlcmUgaXMgYW55IHF1ZXN0aW9uIGFib3V0IGVzY2FwaW5nIChzdWNoXHJcbiAgICAgIC8vIGFzIHNwYWNlcyBpbiBhIGZvbnQgbmFtZSksIHRoZSBmYW1pbHkgc2hvdWxkIGJlIHN1cnJvdW5kZWQgYnkgZG91YmxlIHF1b3Rlcy5cclxuICAgICAgZmFtaWx5OiAnc2Fucy1zZXJpZicsXHJcblxyXG4gICAgICBwaGV0aW9UeXBlOiBGb250LkZvbnRJT1xyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIG9wdGlvbnMud2VpZ2h0ID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygb3B0aW9ucy53ZWlnaHQgPT09ICdudW1iZXInLCAnRm9udCB3ZWlnaHQgc2hvdWxkIGJlIHNwZWNpZmllZCBhcyBhIHN0cmluZyBvciBudW1iZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2Ygb3B0aW9ucy5zaXplID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygb3B0aW9ucy5zaXplID09PSAnbnVtYmVyJywgJ0ZvbnQgc2l6ZSBzaG91bGQgYmUgc3BlY2lmaWVkIGFzIGEgc3RyaW5nIG9yIG51bWJlcicgKTtcclxuXHJcbiAgICBzdXBlciggb3B0aW9ucyApO1xyXG5cclxuICAgIHRoaXMuX3N0eWxlID0gb3B0aW9ucy5zdHlsZTtcclxuICAgIHRoaXMuX3ZhcmlhbnQgPSBvcHRpb25zLnZhcmlhbnQ7XHJcbiAgICB0aGlzLl93ZWlnaHQgPSBgJHtvcHRpb25zLndlaWdodH1gIGFzIEZvbnRXZWlnaHQ7IC8vIGNhc3QgdG8gc3RyaW5nLCB3ZSdsbCBkb3VibGUgY2hlY2sgaXQgbGF0ZXJcclxuICAgIHRoaXMuX3N0cmV0Y2ggPSBvcHRpb25zLnN0cmV0Y2g7XHJcbiAgICB0aGlzLl9zaXplID0gRm9udC5jYXN0U2l6ZSggb3B0aW9ucy5zaXplICk7XHJcbiAgICB0aGlzLl9saW5lSGVpZ2h0ID0gb3B0aW9ucy5saW5lSGVpZ2h0O1xyXG4gICAgdGhpcy5fZmFtaWx5ID0gb3B0aW9ucy5mYW1pbHk7XHJcblxyXG4gICAgLy8gc2FuaXR5IGNoZWNrcyB0byBwcmV2ZW50IGVycm9ycyBpbiBpbnRlcnByZXRhdGlvbiBvciBpbiB0aGUgZm9udCBzaG9ydGhhbmQgdXNhZ2VcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiB0aGlzLl9zdHlsZSA9PT0gJ3N0cmluZycgJiYgXy5pbmNsdWRlcyggVkFMSURfU1RZTEVTLCB0aGlzLl9zdHlsZSApLFxyXG4gICAgICAnRm9udCBzdHlsZSBtdXN0IGJlIG9uZSBvZiBcIm5vcm1hbFwiLCBcIml0YWxpY1wiLCBvciBcIm9ibGlxdWVcIicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiB0aGlzLl92YXJpYW50ID09PSAnc3RyaW5nJyAmJiBfLmluY2x1ZGVzKCBWQUxJRF9WQVJJQU5UUywgdGhpcy5fdmFyaWFudCApLFxyXG4gICAgICAnRm9udCB2YXJpYW50IG11c3QgYmUgXCJub3JtYWxcIiBvciBcInNtYWxsLWNhcHNcIicgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiB0aGlzLl93ZWlnaHQgPT09ICdzdHJpbmcnICYmIF8uaW5jbHVkZXMoIFZBTElEX1dFSUdIVFMsIHRoaXMuX3dlaWdodCApLFxyXG4gICAgICAnRm9udCB3ZWlnaHQgbXVzdCBiZSBvbmUgb2YgXCJub3JtYWxcIiwgXCJib2xkXCIsIFwiYm9sZGVyXCIsIFwibGlnaHRlclwiLCBcIjEwMFwiLCBcIjIwMFwiLCBcIjMwMFwiLCBcIjQwMFwiLCBcIjUwMFwiLCBcIjYwMFwiLCBcIjcwMFwiLCBcIjgwMFwiLCBvciBcIjkwMFwiJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIHRoaXMuX3N0cmV0Y2ggPT09ICdzdHJpbmcnICYmIF8uaW5jbHVkZXMoIFZBTElEX1NUUkVUQ0hFUywgdGhpcy5fc3RyZXRjaCApLFxyXG4gICAgICAnRm9udCBzdHJldGNoIG11c3QgYmUgb25lIG9mIFwibm9ybWFsXCIsIFwidWx0cmEtY29uZGVuc2VkXCIsIFwiZXh0cmEtY29uZGVuc2VkXCIsIFwiY29uZGVuc2VkXCIsIFwic2VtaS1jb25kZW5zZWRcIiwgXCJzZW1pLWV4cGFuZGVkXCIsIFwiZXhwYW5kZWRcIiwgXCJleHRyYS1leHBhbmRlZFwiLCBvciBcInVsdHJhLWV4cGFuZGVkXCInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2YgdGhpcy5fc2l6ZSA9PT0gJ3N0cmluZycgJiYgIV8uaW5jbHVkZXMoIFsgJzAnLCAnMScsICcyJywgJzMnLCAnNCcsICc1JywgJzYnLCAnNycsICc4JywgJzknIF0sIHRoaXMuX3NpemVbIHRoaXMuX3NpemUubGVuZ3RoIC0gMSBdICksXHJcbiAgICAgICdGb250IHNpemUgbXVzdCBiZSBlaXRoZXIgcGFzc2VkIGFzIGEgbnVtYmVyIChub3QgYSBzdHJpbmcsIGludGVycHJldGVkIGFzIHB4KSwgb3IgbXVzdCBjb250YWluIGEgc3VmZml4IGZvciBwZXJjZW50YWdlLCBhYnNvbHV0ZSBvciByZWxhdGl2ZSB1bml0cywgb3IgYW4gZXhwbGljaXQgc2l6ZSBjb25zdGFudCcgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiB0aGlzLl9saW5lSGVpZ2h0ID09PSAnc3RyaW5nJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZW9mIHRoaXMuX2ZhbWlseSA9PT0gJ3N0cmluZycgKTtcclxuXHJcbiAgICAvLyBJbml0aWFsaXplIHRoZSBzaG9ydGhhbmQgZm9udCBwcm9wZXJ0eVxyXG4gICAgdGhpcy5fZm9udCA9IHRoaXMuY29tcHV0ZVNob3J0aGFuZCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGlzIGZvbnQncyBDU1Mgc2hvcnRoYW5kLCB3aGljaCBpbmNsdWRlcyBhbGwgb2YgdGhlIGZvbnQncyBpbmZvcm1hdGlvbiByZWR1Y2VkIGludG8gYSBzaW5nbGUgc3RyaW5nLlxyXG4gICAqXHJcbiAgICogVGhpcyBjYW4gYmUgdXNlZCBmb3IgQ1NTIGFzIHRoZSAnZm9udCcgYXR0cmlidXRlLCBvciBpcyBuZWVkZWQgdG8gc2V0IENhbnZhcyBmb250cy5cclxuICAgKlxyXG4gICAqIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9jc3MtZm9udHMtMy8jcHJvcGRlZi1mb250IGNvbnRhaW5zIGRldGFpbGVkIGluZm9ybWF0aW9uIG9uIGhvdyB0aGlzIGlzIGZvcm1hdHRlZC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Rm9udCgpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHRoaXMuX2ZvbnQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGZvbnQoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuZ2V0Rm9udCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhpcyBmb250J3Mgc3R5bGUuIFNlZSB0aGUgY29uc3RydWN0b3IgZm9yIG1vcmUgZGV0YWlscyBvbiB2YWxpZCB2YWx1ZXMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFN0eWxlKCk6IEZvbnRTdHlsZSB7XHJcbiAgICByZXR1cm4gdGhpcy5fc3R5bGU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHN0eWxlKCk6IEZvbnRTdHlsZSB7IHJldHVybiB0aGlzLmdldFN0eWxlKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGlzIGZvbnQncyB2YXJpYW50LiBTZWUgdGhlIGNvbnN0cnVjdG9yIGZvciBtb3JlIGRldGFpbHMgb24gdmFsaWQgdmFsdWVzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRWYXJpYW50KCk6IEZvbnRWYXJpYW50IHtcclxuICAgIHJldHVybiB0aGlzLl92YXJpYW50O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCB2YXJpYW50KCk6IEZvbnRWYXJpYW50IHsgcmV0dXJuIHRoaXMuZ2V0VmFyaWFudCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhpcyBmb250J3Mgd2VpZ2h0LiBTZWUgdGhlIGNvbnN0cnVjdG9yIGZvciBtb3JlIGRldGFpbHMgb24gdmFsaWQgdmFsdWVzLlxyXG4gICAqXHJcbiAgICogTk9URTogSWYgYSBudW1lcmljIHdlaWdodCB3YXMgcGFzc2VkIGluLCBpdCBoYXMgYmVlbiBjYXN0IHRvIGEgc3RyaW5nLCBhbmQgYSBzdHJpbmcgd2lsbCBiZSByZXR1cm5lZCBoZXJlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRXZWlnaHQoKTogRm9udFdlaWdodCB7XHJcbiAgICByZXR1cm4gdGhpcy5fd2VpZ2h0O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCB3ZWlnaHQoKTogRm9udFdlaWdodCB7IHJldHVybiB0aGlzLmdldFdlaWdodCgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhpcyBmb250J3Mgc3RyZXRjaC4gU2VlIHRoZSBjb25zdHJ1Y3RvciBmb3IgbW9yZSBkZXRhaWxzIG9uIHZhbGlkIHZhbHVlcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0U3RyZXRjaCgpOiBGb250U3RyZXRjaCB7XHJcbiAgICByZXR1cm4gdGhpcy5fc3RyZXRjaDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgc3RyZXRjaCgpOiBGb250U3RyZXRjaCB7IHJldHVybiB0aGlzLmdldFN0cmV0Y2goKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoaXMgZm9udCdzIHNpemUuIFNlZSB0aGUgY29uc3RydWN0b3IgZm9yIG1vcmUgZGV0YWlscyBvbiB2YWxpZCB2YWx1ZXMuXHJcbiAgICpcclxuICAgKiBOT1RFOiBJZiBhIG51bWVyaWMgc2l6ZSB3YXMgcGFzc2VkIGluLCBpdCBoYXMgYmVlbiBjYXN0IHRvIGEgc3RyaW5nLCBhbmQgYSBzdHJpbmcgd2lsbCBiZSByZXR1cm5lZCBoZXJlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRTaXplKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy5fc2l6ZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgc2l6ZSgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5nZXRTaXplKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBhcHByb3hpbWF0ZSB2YWx1ZSBvZiB0aGlzIGZvbnQncyBzaXplIGluIHB4LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXROdW1lcmljU2l6ZSgpOiBudW1iZXIge1xyXG4gICAgY29uc3QgcHhNYXRjaCA9IHRoaXMuX3NpemUubWF0Y2goIC9eKFxcZCspcHgkLyApO1xyXG4gICAgaWYgKCBweE1hdGNoICkge1xyXG4gICAgICByZXR1cm4gTnVtYmVyKCBweE1hdGNoWyAxIF0gKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwdE1hdGNoID0gdGhpcy5fc2l6ZS5tYXRjaCggL14oXFxkKylwdCQvICk7XHJcbiAgICBpZiAoIHB0TWF0Y2ggKSB7XHJcbiAgICAgIHJldHVybiAwLjc1ICogTnVtYmVyKCBwdE1hdGNoWyAxIF0gKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBlbU1hdGNoID0gdGhpcy5fc2l6ZS5tYXRjaCggL14oXFxkKyllbSQvICk7XHJcbiAgICBpZiAoIGVtTWF0Y2ggKSB7XHJcbiAgICAgIHJldHVybiBOdW1iZXIoIGVtTWF0Y2hbIDEgXSApIC8gMTY7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIDEyOyAvLyBhIGd1ZXNzP1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBudW1lcmljU2l6ZSgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXROdW1lcmljU2l6ZSgpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhpcyBmb250J3MgbGluZS1oZWlnaHQuIFNlZSB0aGUgY29uc3RydWN0b3IgZm9yIG1vcmUgZGV0YWlscyBvbiB2YWxpZCB2YWx1ZXMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExpbmVIZWlnaHQoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0aGlzLl9saW5lSGVpZ2h0O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBsaW5lSGVpZ2h0KCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmdldExpbmVIZWlnaHQoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoaXMgZm9udCdzIGZhbWlseS4gU2VlIHRoZSBjb25zdHJ1Y3RvciBmb3IgbW9yZSBkZXRhaWxzIG9uIHZhbGlkIHZhbHVlcy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0RmFtaWx5KCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy5fZmFtaWx5O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBmYW1pbHkoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuZ2V0RmFtaWx5KCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIG5ldyBGb250IG9iamVjdCwgd2hpY2ggaXMgYSBjb3B5IG9mIHRoaXMgb2JqZWN0LiBJZiBvcHRpb25zIGFyZSBwcm92aWRlZCwgdGhleSBvdmVycmlkZSB0aGUgY3VycmVudFxyXG4gICAqIHZhbHVlcyBpbiB0aGlzIG9iamVjdC5cclxuICAgKi9cclxuICBwdWJsaWMgY29weSggb3B0aW9ucz86IEZvbnRPcHRpb25zICk6IEZvbnQge1xyXG4gICAgLy8gVE9ETzogZ2V0IG1lcmdlIHdvcmtpbmcgaW4gdHlwZXNjcmlwdCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgcmV0dXJuIG5ldyBGb250KCBjb21iaW5lT3B0aW9uczxGb250T3B0aW9ucz4oIHtcclxuICAgICAgc3R5bGU6IHRoaXMuX3N0eWxlLFxyXG4gICAgICB2YXJpYW50OiB0aGlzLl92YXJpYW50LFxyXG4gICAgICB3ZWlnaHQ6IHRoaXMuX3dlaWdodCxcclxuICAgICAgc3RyZXRjaDogdGhpcy5fc3RyZXRjaCxcclxuICAgICAgc2l6ZTogdGhpcy5fc2l6ZSxcclxuICAgICAgbGluZUhlaWdodDogdGhpcy5fbGluZUhlaWdodCxcclxuICAgICAgZmFtaWx5OiB0aGlzLl9mYW1pbHlcclxuICAgIH0sIG9wdGlvbnMgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcHV0ZXMgdGhlIGNvbWJpbmVkIENTUyBzaG9ydGhhbmQgZm9udCBzdHJpbmcuXHJcbiAgICpcclxuICAgKiBodHRwczovL3d3dy53My5vcmcvVFIvY3NzLWZvbnRzLTMvI3Byb3BkZWYtZm9udCBjb250YWlucyBkZXRhaWxzIGFib3V0IHRoZSBmb3JtYXQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBjb21wdXRlU2hvcnRoYW5kKCk6IHN0cmluZyB7XHJcbiAgICBsZXQgcmV0ID0gJyc7XHJcbiAgICBpZiAoIHRoaXMuX3N0eWxlICE9PSAnbm9ybWFsJyApIHsgcmV0ICs9IGAke3RoaXMuX3N0eWxlfSBgOyB9XHJcbiAgICBpZiAoIHRoaXMuX3ZhcmlhbnQgIT09ICdub3JtYWwnICkgeyByZXQgKz0gYCR7dGhpcy5fdmFyaWFudH0gYDsgfVxyXG4gICAgaWYgKCB0aGlzLl93ZWlnaHQgIT09ICdub3JtYWwnICkgeyByZXQgKz0gYCR7dGhpcy5fd2VpZ2h0fSBgOyB9XHJcbiAgICBpZiAoIHRoaXMuX3N0cmV0Y2ggIT09ICdub3JtYWwnICkgeyByZXQgKz0gYCR7dGhpcy5fc3RyZXRjaH0gYDsgfVxyXG4gICAgcmV0ICs9IHRoaXMuX3NpemU7XHJcbiAgICBpZiAoIHRoaXMuX2xpbmVIZWlnaHQgIT09ICdub3JtYWwnICkgeyByZXQgKz0gYC8ke3RoaXMuX2xpbmVIZWlnaHR9YDsgfVxyXG4gICAgcmV0ICs9IGAgJHt0aGlzLl9mYW1pbHl9YDtcclxuICAgIHJldHVybiByZXQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoaXMgZm9udCdzIENTUyBzaG9ydGhhbmQsIHdoaWNoIGluY2x1ZGVzIGFsbCBvZiB0aGUgZm9udCdzIGluZm9ybWF0aW9uIHJlZHVjZWQgaW50byBhIHNpbmdsZSBzdHJpbmcuXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIGlzIGFuIGFsaWFzIG9mIGdldEZvbnQoKS5cclxuICAgKlxyXG4gICAqIFRoaXMgY2FuIGJlIHVzZWQgZm9yIENTUyBhcyB0aGUgJ2ZvbnQnIGF0dHJpYnV0ZSwgb3IgaXMgbmVlZGVkIHRvIHNldCBDYW52YXMgZm9udHMuXHJcbiAgICpcclxuICAgKiBodHRwczovL3d3dy53My5vcmcvVFIvY3NzLWZvbnRzLTMvI3Byb3BkZWYtZm9udCBjb250YWlucyBkZXRhaWxlZCBpbmZvcm1hdGlvbiBvbiBob3cgdGhpcyBpcyBmb3JtYXR0ZWQuXHJcbiAgICovXHJcbiAgcHVibGljIHRvQ1NTKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRGb250KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb252ZXJ0cyBhIGdlbmVyaWMgc2l6ZSB0byBhIHNwZWNpZmljIENTUyBwaXhlbCBzdHJpbmcsIGFzc3VtaW5nICdweCcgZm9yIG51bWJlcnMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gc2l6ZSAtIElmIGl0J3MgYSBudW1iZXIsICdweCcgd2lsbCBiZSBhcHBlbmRlZFxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgY2FzdFNpemUoIHNpemU6IHN0cmluZyB8IG51bWJlciApOiBzdHJpbmcge1xyXG4gICAgaWYgKCB0eXBlb2Ygc2l6ZSA9PT0gJ251bWJlcicgKSB7XHJcbiAgICAgIHJldHVybiBgJHtzaXplfXB4YDsgLy8gYWRkIHRoZSBwaXhlbHMgc3VmZml4IGJ5IGRlZmF1bHQgZm9yIG51bWJlcnNcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gc2l6ZTsgLy8gYXNzdW1lIHRoYXQgaXQncyBhIHZhbGlkIHRvLXNwZWMgc3RyaW5nXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIGlzRm9udFN0eWxlKCBzdHlsZTogc3RyaW5nICk6IHN0eWxlIGlzIEZvbnRTdHlsZSB7XHJcbiAgICByZXR1cm4gVkFMSURfU1RZTEVTLmluY2x1ZGVzKCBzdHlsZSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyBpc0ZvbnRWYXJpYW50KCB2YXJpYW50OiBzdHJpbmcgKTogdmFyaWFudCBpcyBGb250VmFyaWFudCB7XHJcbiAgICByZXR1cm4gVkFMSURfVkFSSUFOVFMuaW5jbHVkZXMoIHZhcmlhbnQgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgaXNGb250V2VpZ2h0KCB3ZWlnaHQ6IHN0cmluZyApOiB3ZWlnaHQgaXMgRm9udFdlaWdodCB7XHJcbiAgICByZXR1cm4gVkFMSURfV0VJR0hUUy5pbmNsdWRlcyggd2VpZ2h0ICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIGlzRm9udFN0cmV0Y2goIHN0cmV0Y2g6IHN0cmluZyApOiBzdHJldGNoIGlzIEZvbnRTdHJldGNoIHtcclxuICAgIHJldHVybiBWQUxJRF9TVFJFVENIRVMuaW5jbHVkZXMoIHN0cmV0Y2ggKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFBhcnNlcyBhIENTUy1jb21wbGlhbnQgXCJmb250XCIgc2hvcnRoYW5kIHN0cmluZyBpbnRvIGEgRm9udCBvYmplY3QuXHJcbiAgICpcclxuICAgKiBGb250IHN0cmluZ3Mgc2hvdWxkIGJlIGEgdmFsaWQgQ1NTMyBmb250IGRlY2xhcmF0aW9uIHZhbHVlIChzZWUgaHR0cDovL3d3dy53My5vcmcvVFIvY3NzMy1mb250cy8pIHdoaWNoIGNvbnNpc3RzXHJcbiAgICogb2YgdGhlIGZvbGxvd2luZyBwYXR0ZXJuOlxyXG4gICAqICAgWyBbIDzigJhmb250LXN0eWxl4oCZPiB8fCA8Zm9udC12YXJpYW50LWNzczIxPiB8fCA84oCYZm9udC13ZWlnaHTigJk+IHx8IDzigJhmb250LXN0cmV0Y2jigJk+IF0/IDzigJhmb250LXNpemXigJk+XHJcbiAgICogICBbIC8gPOKAmGxpbmUtaGVpZ2h04oCZPiBdPyA84oCYZm9udC1mYW1pbHnigJk+IF1cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGZyb21DU1MoIGNzc1N0cmluZzogc3RyaW5nICk6IEZvbnQge1xyXG4gICAgLy8gcGFyc2UgYSBzb21ld2hhdCBwcm9wZXIgQ1NTMyBmb3JtIChub3QgZ3VhcmFudGVlZCB0byBoYW5kbGUgaXQgcHJlY2lzZWx5IHRoZSBzYW1lIGFzIGJyb3dzZXJzIHlldClcclxuXHJcbiAgICBjb25zdCBvcHRpb25zOiBGb250T3B0aW9ucyA9IHt9O1xyXG5cclxuICAgIC8vIHNwbGl0IGJhc2VkIG9uIHdoaXRlc3BhY2UgYWxsb3dlZCBieSBDU1Mgc3BlYyAobW9yZSByZXN0cmljdGl2ZSB0aGFuIHJlZ3VsYXIgcmVnZXhwIHdoaXRlc3BhY2UpXHJcbiAgICBjb25zdCB0b2tlbnMgPSBfLmZpbHRlciggY3NzU3RyaW5nLnNwbGl0KCAvW1xceDA5XFx4MEFcXHgwQ1xceDBEXFx4MjBdLyApLCB0b2tlbiA9PiB0b2tlbi5sZW5ndGggPiAwICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29udHJvbC1yZWdleFxyXG5cclxuICAgIC8vIHB1bGwgdG9rZW5zIG91dCB1bnRpbCB3ZSByZWFjaCBzb21ldGhpbmcgdGhhdCBkb2Vzbid0IG1hdGNoLiB0aGF0IG11c3QgYmUgdGhlIGZvbnQgc2l6ZSAoYWNjb3JkaW5nIHRvIHNwZWMpXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IHRva2VuID0gdG9rZW5zWyBpIF07XHJcbiAgICAgIGlmICggdG9rZW4gPT09ICdub3JtYWwnICkge1xyXG4gICAgICAgIC8vIG5vdGhpbmcgaGFzIHRvIGJlIGRvbmUsIGV2ZXJ5dGhpbmcgYWxyZWFkeSBub3JtYWwgYXMgZGVmYXVsdFxyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCBGb250LmlzRm9udFN0eWxlKCB0b2tlbiApICkge1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIG9wdGlvbnMuc3R5bGUgPT09IHVuZGVmaW5lZCwgYFN0eWxlIGNhbm5vdCBiZSBhcHBsaWVkIHR3aWNlLiBBbHJlYWR5IHNldCB0byBcIiR7b3B0aW9ucy5zdHlsZX1cIiwgYXR0ZW1wdCB0byByZXBsYWNlIHdpdGggXCIke3Rva2VufVwiYCApO1xyXG4gICAgICAgIG9wdGlvbnMuc3R5bGUgPSB0b2tlbjtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggRm9udC5pc0ZvbnRWYXJpYW50KCB0b2tlbiApICkge1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIG9wdGlvbnMudmFyaWFudCA9PT0gdW5kZWZpbmVkLCBgVmFyaWFudCBjYW5ub3QgYmUgYXBwbGllZCB0d2ljZS4gQWxyZWFkeSBzZXQgdG8gXCIke29wdGlvbnMudmFyaWFudH1cIiwgYXR0ZW1wdCB0byByZXBsYWNlIHdpdGggXCIke3Rva2VufVwiYCApO1xyXG4gICAgICAgIG9wdGlvbnMudmFyaWFudCA9IHRva2VuO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCBGb250LmlzRm9udFdlaWdodCggdG9rZW4gKSApIHtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLndlaWdodCA9PT0gdW5kZWZpbmVkLCBgV2VpZ2h0IGNhbm5vdCBiZSBhcHBsaWVkIHR3aWNlLiBBbHJlYWR5IHNldCB0byBcIiR7b3B0aW9ucy53ZWlnaHR9XCIsIGF0dGVtcHQgdG8gcmVwbGFjZSB3aXRoIFwiJHt0b2tlbn1cImAgKTtcclxuICAgICAgICBvcHRpb25zLndlaWdodCA9IHRva2VuO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCBGb250LmlzRm9udFN0cmV0Y2goIHRva2VuICkgKSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5zdHJldGNoID09PSB1bmRlZmluZWQsIGBTdHJldGNoIGNhbm5vdCBiZSBhcHBsaWVkIHR3aWNlLiBBbHJlYWR5IHNldCB0byBcIiR7b3B0aW9ucy5zdHJldGNofVwiLCBhdHRlbXB0IHRvIHJlcGxhY2Ugd2l0aCBcIiR7dG9rZW59XCJgICk7XHJcbiAgICAgICAgb3B0aW9ucy5zdHJldGNoID0gdG9rZW47XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gbm90IGEgc3R5bGUvdmFyaWFudC93ZWlnaHQvc3RyZXRjaCwgbXVzdCBiZSBhIGZvbnQgc2l6ZSwgcG9zc2libHkgd2l0aCBhbiBpbmNsdWRlZCBsaW5lLWhlaWdodFxyXG4gICAgICAgIGNvbnN0IHN1YnRva2VucyA9IHRva2VuLnNwbGl0KCAvXFwvLyApOyAvLyBleHRyYWN0IGZvbnQgc2l6ZSBmcm9tIGFueSBsaW5lLWhlaWdodFxyXG4gICAgICAgIG9wdGlvbnMuc2l6ZSA9IHN1YnRva2Vuc1sgMCBdO1xyXG4gICAgICAgIGlmICggc3VidG9rZW5zWyAxIF0gKSB7XHJcbiAgICAgICAgICBvcHRpb25zLmxpbmVIZWlnaHQgPSBzdWJ0b2tlbnNbIDEgXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gYWxsIGZ1dHVyZSB0b2tlbnMgYXJlIGd1YXJhbnRlZWQgdG8gYmUgcGFydCBvZiB0aGUgZm9udC1mYW1pbHkgaWYgaXQgaXMgZ2l2ZW4gYWNjb3JkaW5nIHRvIHNwZWNcclxuICAgICAgICBvcHRpb25zLmZhbWlseSA9IHRva2Vucy5zbGljZSggaSArIDEgKS5qb2luKCAnICcgKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgRm9udCggb3B0aW9ucyApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyBGb250SU86IElPVHlwZTxGb250LCBGb250U3RhdGU+O1xyXG5cclxuICAvLyB7Rm9udH0gLSBEZWZhdWx0IEZvbnQgb2JqZWN0IChzaW5jZSB0aGV5IGFyZSBpbW11dGFibGUpLlxyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVCA9IG5ldyBGb250KCk7XHJcbn1cclxuXHJcbnR5cGUgRm9udFN0YXRlID0gUmVxdWlyZWQ8U2VsZk9wdGlvbnM+O1xyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ0ZvbnQnLCBGb250ICk7XHJcblxyXG5Gb250LkZvbnRJTyA9IG5ldyBJT1R5cGU8Rm9udCwgRm9udFN0YXRlPiggJ0ZvbnRJTycsIHtcclxuICB2YWx1ZVR5cGU6IEZvbnQsXHJcbiAgZG9jdW1lbnRhdGlvbjogJ0ZvbnQgaGFuZGxpbmcgZm9yIHRleHQgZHJhd2luZy4gT3B0aW9uczonICtcclxuICAgICAgICAgICAgICAgICAnPHVsPicgK1xyXG4gICAgICAgICAgICAgICAgICc8bGk+PHN0cm9uZz5zdHlsZTo8L3N0cm9uZz4gbm9ybWFsICAgICAgJm1kYXNoOyBub3JtYWwgfCBpdGFsaWMgfCBvYmxpcXVlIDwvbGk+JyArXHJcbiAgICAgICAgICAgICAgICAgJzxsaT48c3Ryb25nPnZhcmlhbnQ6PC9zdHJvbmc+IG5vcm1hbCAgICAmbWRhc2g7IG5vcm1hbCB8IHNtYWxsLWNhcHMgPC9saT4nICtcclxuICAgICAgICAgICAgICAgICAnPGxpPjxzdHJvbmc+d2VpZ2h0Ojwvc3Ryb25nPiBub3JtYWwgICAgICZtZGFzaDsgbm9ybWFsIHwgYm9sZCB8IGJvbGRlciB8IGxpZ2h0ZXIgfCAxMDAgfCAyMDAgfCAzMDAgfCA0MDAgfCA1MDAgfCA2MDAgfCA3MDAgfCA4MDAgfCA5MDAgPC9saT4nICtcclxuICAgICAgICAgICAgICAgICAnPGxpPjxzdHJvbmc+c3RyZXRjaDo8L3N0cm9uZz4gbm9ybWFsICAgICZtZGFzaDsgbm9ybWFsIHwgdWx0cmEtY29uZGVuc2VkIHwgZXh0cmEtY29uZGVuc2VkIHwgY29uZGVuc2VkIHwgc2VtaS1jb25kZW5zZWQgfCBzZW1pLWV4cGFuZGVkIHwgZXhwYW5kZWQgfCBleHRyYS1leHBhbmRlZCB8IHVsdHJhLWV4cGFuZGVkIDwvbGk+JyArXHJcbiAgICAgICAgICAgICAgICAgJzxsaT48c3Ryb25nPnNpemU6PC9zdHJvbmc+IDEwcHggICAgICAgICAmbWRhc2g7IGFic29sdXRlLXNpemUgfCByZWxhdGl2ZS1zaXplIHwgbGVuZ3RoIHwgcGVyY2VudGFnZSAtLSB1bml0bGVzcyBudW1iZXIgaW50ZXJwcmV0ZWQgYXMgcHguIGFic29sdXRlIHN1ZmZpeGVzOiBjbSwgbW0sIGluLCBwdCwgcGMsIHB4LiByZWxhdGl2ZSBzdWZmaXhlczogZW0sIGV4LCBjaCwgcmVtLCB2dywgdmgsIHZtaW4sIHZtYXguIDwvbGk+JyArXHJcbiAgICAgICAgICAgICAgICAgJzxsaT48c3Ryb25nPmxpbmVIZWlnaHQ6PC9zdHJvbmc+IG5vcm1hbCAmbWRhc2g7IG5vcm1hbCB8IG51bWJlciB8IGxlbmd0aCB8IHBlcmNlbnRhZ2UgLS0gTk9URTogQ2FudmFzIHNwZWMgZm9yY2VzIGxpbmUtaGVpZ2h0IHRvIG5vcm1hbCA8L2xpPicgK1xyXG4gICAgICAgICAgICAgICAgICc8bGk+PHN0cm9uZz5mYW1pbHk6PC9zdHJvbmc+IHNhbnMtc2VyaWYgJm1kYXNoOyBjb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBmYW1pbGllcywgaW5jbHVkaW5nIGdlbmVyaWMgZmFtaWxpZXMgKHNlcmlmLCBzYW5zLXNlcmlmLCBjdXJzaXZlLCBmYW50YXN5LCBtb25vc3BhY2UpLiBpZGVhbGx5IGVzY2FwZSB3aXRoIGRvdWJsZS1xdW90ZXM8L2xpPicgK1xyXG4gICAgICAgICAgICAgICAgICc8L3VsPicsXHJcbiAgdG9TdGF0ZU9iamVjdDogKCBmb250OiBGb250ICk6IEZvbnRTdGF0ZSA9PiAoIHtcclxuICAgIHN0eWxlOiBmb250LmdldFN0eWxlKCksXHJcbiAgICB2YXJpYW50OiBmb250LmdldFZhcmlhbnQoKSxcclxuICAgIHdlaWdodDogZm9udC5nZXRXZWlnaHQoKSxcclxuICAgIHN0cmV0Y2g6IGZvbnQuZ2V0U3RyZXRjaCgpLFxyXG4gICAgc2l6ZTogZm9udC5nZXRTaXplKCksXHJcbiAgICBsaW5lSGVpZ2h0OiBmb250LmdldExpbmVIZWlnaHQoKSxcclxuICAgIGZhbWlseTogZm9udC5nZXRGYW1pbHkoKVxyXG4gIH0gKSxcclxuXHJcbiAgZnJvbVN0YXRlT2JqZWN0KCBzdGF0ZU9iamVjdDogRm9udFN0YXRlICkge1xyXG4gICAgcmV0dXJuIG5ldyBGb250KCBzdGF0ZU9iamVjdCApO1xyXG4gIH0sXHJcblxyXG4gIHN0YXRlU2NoZW1hOiB7XHJcbiAgICBzdHlsZTogU3RyaW5nSU8sXHJcbiAgICB2YXJpYW50OiBTdHJpbmdJTyxcclxuICAgIHdlaWdodDogU3RyaW5nSU8sXHJcbiAgICBzdHJldGNoOiBTdHJpbmdJTyxcclxuICAgIHNpemU6IFN0cmluZ0lPLFxyXG4gICAgbGluZUhlaWdodDogU3RyaW5nSU8sXHJcbiAgICBmYW1pbHk6IFN0cmluZ0lPXHJcbiAgfVxyXG59ICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxTQUFTLElBQUlDLGNBQWMsUUFBUSxvQ0FBb0M7QUFDOUUsT0FBT0MsWUFBWSxNQUErQixvQ0FBb0M7QUFDdEYsT0FBT0MsTUFBTSxNQUFNLG9DQUFvQztBQUN2RCxPQUFPQyxRQUFRLE1BQU0sc0NBQXNDO0FBQzNELFNBQVNDLE9BQU8sUUFBUSxlQUFlOztBQUV2QztBQUNBLE1BQU1DLFlBQVksR0FBRyxDQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFFOztBQUV0RDtBQUNBLE1BQU1DLGNBQWMsR0FBRyxDQUFFLFFBQVEsRUFBRSxZQUFZLENBQUU7O0FBRWpEO0FBQ0EsTUFBTUMsYUFBYSxHQUFHLENBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUMzRCxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBRTs7QUFFakU7QUFDQSxNQUFNQyxlQUFlLEdBQUcsQ0FBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsaUJBQWlCLEVBQUUsV0FBVyxFQUFFLGdC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UUFDQXJELE9BQU8sQ0FBQ08sTUFBTSxHQUFHeUMsTUFBTSxDQUFDTSxLQUFLLENBQUVGLENBQUMsR0FBRyxDQUFFLENBQUMsQ0FBQ0csSUFBSSxDQUFFLEdBQUksQ0FBQztRQUNsRDtNQUNGO0lBQ0Y7SUFFQSxPQUFPLElBQUkvRCxJQUFJLENBQUVRLE9BQVEsQ0FBQztFQUM1QjtFQUlBO0VBQ0EsT0FBdUJ3RCxPQUFPLEdBQUcsSUFBSWhFLElBQUksQ0FBQyxDQUFDO0FBQzdDO0FBSUFMLE9BQU8sQ0FBQ3NFLFFBQVEsQ0FBRSxNQUFNLEVBQUVqRSxJQUFLLENBQUM7QUFFaENBLElBQUksQ0FBQ2lCLE1BQU0sR0FBRyxJQUFJeEIsTUFBTSxDQUFtQixRQUFRLEVBQUU7RUFDbkR5RSxTQUFTLEVBQUVsRSxJQUFJO0VBQ2ZtRSxhQUFhLEVBQUUsMENBQTBDLEdBQzFDLE1BQU0sR0FDTixpRkFBaUYsR0FDakYsMkVBQTJFLEdBQzNFLDhJQUE4SSxHQUM5SSw0TEFBNEwsR0FDNUwsb1BBQW9QLEdBQ3BQLCtJQUErSSxHQUMvSSx1TUFBdU0sR0FDdk0sT0FBTztFQUN0QkMsYUFBYSxFQUFJcEMsSUFBVSxLQUFtQjtJQUM1Q3ZCLEtBQUssRUFBRXVCLElBQUksQ0FBQ0MsUUFBUSxDQUFDLENBQUM7SUFDdEJ2QixPQUFPLEVBQUVzQixJQUFJLENBQUNFLFVBQVUsQ0FBQyxDQUFDO0lBQzFCdkIsTUFBTSxFQUFFcUIsSUFBSSxDQUFDRyxTQUFTLENBQUMsQ0FBQztJQUN4QnZCLE9BQU8sRUFBRW9CLElBQUksQ0FBQ0ksVUFBVSxDQUFDLENBQUM7SUFDMUJ2QixJQUFJLEVBQUVtQixJQUFJLENBQUNLLE9BQU8sQ0FBQyxDQUFDO0lBQ3BCdkIsVUFBVSxFQUFFa0IsSUFBSSxDQUFDYSxhQUFhLENBQUMsQ0FBQztJQUNoQzlCLE1BQU0sRUFBRWlCLElBQUksQ0FBQ2MsU0FBUyxDQUFDO0VBQ3pCLENBQUMsQ0FBRTtFQUVIdUIsZUFBZUEsQ0FBRUMsV0FBc0IsRUFBRztJQUN4QyxPQUFPLElBQUl0RSxJQUFJLENBQUVzRSxXQUFZLENBQUM7RUFDaEMsQ0FBQztFQUVEQyxXQUFXLEVBQUU7SUFDWDlELEtBQUssRUFBRWYsUUFBUTtJQUNmZ0IsT0FBTyxFQUFFaEIsUUFBUTtJQUNqQmlCLE1BQU0sRUFBRWpCLFFBQVE7SUFDaEJrQixPQUFPLEVBQUVsQixRQUFRO0lBQ2pCbUIsSUFBSSxFQUFFbkIsUUFBUTtJQUNkb0IsVUFBVSxFQUFFcEIsUUFBUTtJQUNwQnFCLE1BQU0sRUFBRXJCO0VBQ1Y7QUFDRixDQUFFLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=