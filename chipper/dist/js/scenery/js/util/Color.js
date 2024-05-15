// Copyright 2012-2024, University of Colorado Boulder

/**
 * A color with RGBA values, assuming the sRGB color space is used.
 *
 * See http://www.w3.org/TR/css3-color/
 *
 * TODO: make a getHue, getSaturation, getLightness. we can then expose them via ES5! https://github.com/phetsims/scenery/issues/1581
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import TinyEmitter from '../../../axon/js/TinyEmitter.js';
import Utils from '../../../dot/js/Utils.js';
import IOType from '../../../tandem/js/types/IOType.js';
import NumberIO from '../../../tandem/js/types/NumberIO.js';
import { scenery } from '../imports.js';
import { isTReadOnlyProperty } from '../../../axon/js/TReadOnlyProperty.js';

// constants
const clamp = Utils.clamp;
const linear = Utils.linear;
// regex utilities
const rgbNumber = '(-?\\d{1,3}%?)'; // syntax allows negative integers and percentages
const aNumber = '(\\d+|\\d*\\.\\d+)'; // decimal point number. technically we allow for '255', even though this will be clamped to 1.
const rawNumber = '(\\d{1,3})'; // a 1-3 digit number

// handles negative and percentage values
function parseRGBNumber(str) {
  let multiplier = 1;

  // if it's a percentage, strip it off and handle it that way
  if (str.endsWith('%')) {
    multiplier = 2.55;
    str = str.slice(0, str.length - 1);
  }
  return Utils.roundSymmetric(Number(str) * multiplier);
}
export default class Color {
  // RGBA values

  // For caching and performance

  // If assertions are enabled

  // Fires when the color is changed

  /**
   * Creates a Color with an initial value. Multiple different types of parameters are supported:
   * - new Color( color ) is a copy constructor, for a {Color}
   * - new Color( string ) will parse the string assuming it's a CSS-compatible color, e.g. set( 'red' )
   * - new Color( r, g, b ) is equivalent to setRGBA( r, g, b, 1 ), e.g. set( 255, 0, 128 )
   * - new Color( r, g, b, a ) is equivalent to setRGBA( r, g, b, a ), e.g. set( 255, 0, 128, 0.5 )
   * - new Color( hex ) will set RGB with alpha=1, e.g. set( 0xFF0000 )
   * - new Color( hex, a ) will set RGBA, e.g. set( 0xFF0000, 1 )
   * - new Color( null ) will be transparent
   *
   * The 'r', 'g', and 'b' values stand for red, green and blue respectively, and will be clamped to integers in 0-255.
   * The 'a' value stands for alpha, and will be clamped to 0-1 (floating point)
   * 'hex' indicates a 6-decimal-digit format hex number, for example 0xFFAA00 is equivalent to r=255, g=170, b=0.
   *
   * @param r - See above for the possible overloaded values
   * @param [g] - If provided, should be the green value (or the alpha value if a hex color is given)
   * @param [b] - If provided, should be the blue value
   * @param [a] - If provided, should be the alpha value
   */

  constructor(r, g, b, a) {
    // {Emitter}
    this.changeEmitter = new TinyEmitter();
    this.set(r, g, b, a);
  }

  /**
   * Returns a copy of this color.
   */
  copy() {
    return new Color(this.r, this.g, this.b, this.a);
  }

  /**
   * Sets the values of this Color. Supported styles:
   *
   * - set( color ) is a copy constructor
   * - set( string ) will parse the string assuming it's a CSS-compatible color, e.g. set( 'red' )
   * - set( r, g, b ) is equivalent to setRGBA( r, g, b, 1 ), e.g. set( 255, 0, 128 )
   * - set( r, g, b, a ) is equivalent to setRGBA( r, g, b, a ), e.g. set( 255, 0, 128, 0.5 )
   * - set( hex ) will set RGB with alpha=1, e.g. set( 0xFF0000 )
   * - set( hex, alpha ) will set RGBA, e.g. set( 0xFF0000, 1 )
   * - set( null ) will be transparent
   *
   * @param r - See above for the possible overloaded values
   * @param [g] - If provided, should be the green value (or the alpha value if a hex color is given)
   * @param [b] - If provided, should be the blue value
   * @param [a] - If provided, should be the alpha value
   */
  set(r, g, b, a) {
    assert && assert(r !== undefined, 'Can\'t call Color.set( undefined )');
    if (r === null) {
      this.setRGBA(0, 0, 0, 0);
    }
    // support for set( string )
    else if (typeof r === 'string') {
      this.setCSS(r);
    }
    // support for set( color )
    else if (r instanceof Color) {
      this.setRGBA(r.r, r.g, r.b, r.a);
    }
    // support for set( hex ) and set( hex, alpha )
    else if (b === undefined) {
      assert && assert(g === undefined || typeof g === 'number');
      const red = r >> 16 & 0xFF;
      const green = r >> 8 & 0xFF;
      const blue = r >> 0 & 0xFF;
      const alpha = g === undefined ? 1 : g;
      this.setRGBA(red, green, blue, alpha);
    }
    // support for set( r, g, b ) and set( r, g, b, a )
    else {
      assert && assert(a === undefined || typeof a === 'number');
      this.setRGBA(r, g, b, a === undefined ? 1 : a);
    }
    return this; // support chaining
  }

  /**
   * Returns the red value as an integer between 0 and 255
   */
  getRed() {
    return this.r;
  }
  get red() {
    return this.getRed();
  }
  set red(value) {
    this.setRed(value);
  }

  /**
   * Sets the red value.
   *
   * @param value - Will be clamped to an integer between 0 and 255
   */
  setRed(value) {
    return this.setRGBA(value, this.g, this.b, this.a);
  }

  /**
   * Returns the green value as an integer between 0 and 255
   */
  getGreen() {
    return this.g;
  }
  get green() {
    return this.getGreen();
  }
  set green(value) {
    this.setGreen(value);
  }

  /**
   * Sets the green value.
   *
   * @param value - Will be clamped to an integer between 0 and 255
   */
  setGreen(value) {
    return this.setRGBA(this.r, value, this.b, this.a);
  }

  /**
   * Returns the blue value as an integer between 0 and 255
   */
  getBlue() {
    return this.b;
  }
  get blue() {
    return this.getBlue();
  }
  set blue(value) {
    this.setBlue(value);
  }

  /**
   * Sets the blue value.
   *
   * @param value - Will be clamped to an integer between 0 and 255
   */
  setBlue(value) {
    return this.setRGBA(this.r, this.g, value, this.a);
  }

  /**
   * Returns the alpha value as a floating-point value between 0 and 1
   */
  getAlpha() {
    return this.a;
  }
  get alpha() {
    return this.getAlpha();
  }
  set alpha(value) {
    this.setAlpha(value);
  }

  /**
   * Sets the alpha value.
   *
   * @param value - Will be clamped between 0 and 1
   */
  setAlpha(value) {
    return this.setRGBA(this.r, this.g, this.b, value);
  }

  /**
   * Sets the value of this Color using RGB integral between 0-255, alpha (float) between 0-1.
   */
  setRGBA(red, green, blue, alpha) {
    this.r = Utils.roundSymmetric(clamp(red, 0, 255));
    this.g = Utils.roundSymmetric(clamp(green, 0, 255));
    this.b = Utils.roundSymmetric(clamp(blue, 0, 255));
    this.a = clamp(alpha, 0, 1);
    this.updateColor(); // update the cached value

    return this; // allow chaining
  }

  /**
   * A linear (gamma-corrected) interpolation between this color (ratio=0) and another color (ratio=1).
   *
   * @param otherColor
   * @param ratio - Not necessarily constrained in [0, 1]
   */
  blend(otherColor, ratio) {
    const gamma = 2.4;
    const linearRedA = Math.pow(this.r, gamma);
    const linearRedB = Math.pow(otherColor.r, gamma);
    const linearGreenA = Math.pow(this.g, gamma);
    const linearGreenB = Math.pow(otherColor.g, gamma);
    const linearBlueA = Math.pow(this.b, gamma);
    const linearBlueB = Math.pow(otherColor.b, gamma);
    const r = Math.pow(linearRedA + (linearRedB - linearRedA) * ratio, 1 / gamma);
    const g = Math.pow(linearGreenA + (linearGreenB - linearGreenA) * ratio, 1 / gamma);
    const b = Math.pow(linearBlueA + (linearBlueB - linearBlueA) * ratio, 1 / gamma);
    const a = this.a + (otherColor.a - this.a) * ratio;
    return new Color(r, g, b, a);
  }

  /**
   * Used internally to compute the CSS string for this color. Use toCSS()
   */
  computeCSS() {
    if (this.a === 1) {
      return `rgb(${this.r},${this.g},${this.b})`;
    } else {
      // Since SVG doesn't support parsing scientific notation (e.g. 7e5), we need to output fixed decimal-point strings.
      // Since this needs to be done quickly, and we don't particularly care about slight rounding differences (it's
      // being used for display purposes only, and is never shown to the user), we use the built-in JS toFixed instead of
      // Dot's version of toFixed. See https://github.com/phetsims/kite/issues/50
      let alpha = this.a.toFixed(20); // eslint-disable-line bad-sim-text
      while (alpha.length >= 2 && alpha.endsWith('0') && alpha[alpha.length - 2] !== '.') {
        alpha = alpha.slice(0, alpha.length - 1);
      }
      const alphaString = this.a === 0 || this.a === 1 ? this.a : alpha;
      return `rgba(${this.r},${this.g},${this.b},${alphaString})`;
    }
  }

  /**
   * Returns the value of this Color as a CSS string.
   */
  toCSS() {
    // verify that the cached value is correct (in debugging builds only, defeats the point of caching otherwise)
    assert && assert(this._css === this.computeCSS(), `CSS cached value is ${this._css}, but the computed value appears to be ${this.computeCSS()}`);
    return this._css;
  }

  /**
   * Sets this color for a CSS color string.
   */
  setCSS(cssString) {
    let success = false;
    const str = Color.preprocessCSS(cssString);

    // run through the available text formats
    for (let i = 0; i < Color.formatParsers.length; i++) {
      const parser = Color.formatParsers[i];
      const matches = parser.regexp.exec(str);
      if (matches) {
        parser.apply(this, matches);
        success = true;
        break;
      }
    }
    if (!success) {
      throw new Error(`Color unable to parse color string: ${cssString}`);
    }
    this.updateColor(); // update the cached value

    return this;
  }

  /**
   * Returns this color's RGB information in the hexadecimal number equivalent, e.g. 0xFF00FF
   */
  toNumber() {
    return (this.r << 16) + (this.g << 8) + this.b;
  }

  /**
   * Called to update the internally cached CSS value
   */
  updateColor() {
    assert && assert(!this.immutable, 'Cannot modify an immutable color. Likely caused by trying to mutate a color after it was used for a node fill/stroke');
    assert && assert(typeof this.red === 'number' && typeof this.green === 'number' && typeof this.blue === 'number' && typeof this.alpha === 'number', `Ensure color components are numeric: ${this.toString()}`);
    assert && assert(isFinite(this.red) && isFinite(this.green) && isFinite(this.blue) && isFinite(this.alpha), 'Ensure color components are finite and not NaN');
    assert && assert(this.red >= 0 && this.red <= 255 && this.green >= 0 && this.green <= 255 && this.red >= 0 && this.red <= 255 && this.alpha >= 0 && this.alpha <= 1, `Ensure color components are in the proper ranges: ${this.toString()}`);
    const oldCSS = this._css;
    this._css = this.computeCSS();

    // notify listeners if it changed
    if (oldCSS !== this._css) {
      this.changeEmitter.emit();
    }
  }

  /**
   * Allow setting this Color to be immutable when assertions are disabled. any change will throw an error
   */
  setImmutable() {
    if (assert) {
      this.immutable = true;
    }
    return this; // allow chaining
  }

  /**
   * Returns an object that can be passed to a Canvas context's fillStyle or strokeStyle.
   */
  getCanvasStyle() {
    return this.toCSS(); // should be inlined, leave like this for future maintainability
  }

  /**
   * Sets this color using HSLA values.
   *
   * TODO: make a getHue, getSaturation, getLightness. we can then expose them via ES5! https://github.com/phetsims/scenery/issues/1581
   *
   * @param hue - integer modulo 360
   * @param saturation - percentage
   * @param lightness - percentage
   * @param alpha
   */
  setHSLA(hue, saturation, lightness, alpha) {
    hue = hue % 360 / 360;
    saturation = clamp(saturation / 100, 0, 1);
    lightness = clamp(lightness / 100, 0, 1);

    // see http://www.w3.org/TR/css3-color/
    let m2;
    if (lightness < 0.5) {
      m2 = lightness * (saturation + 1);
    } else {
      m2 = lightness + saturation - lightness * saturation;
    }
    const m1 = lightness * 2 - m2;
    this.r = Utils.roundSymmetric(Color.hueToRGB(m1, m2, hue + 1 / 3) * 255);
    this.g = Utils.roundSymmetric(Color.hueToRGB(m1, m2, hue) * 255);
    this.b = Utils.roundSymmetric(Color.hueToRGB(m1, m2, hue - 1 / 3) * 255);
    this.a = clamp(alpha, 0, 1);
    this.updateColor(); // update the cached value

    return this; // allow chaining
  }
  equals(color) {
    return this.r === color.r && this.g === color.g && this.b === color.b && this.a === color.a;
  }

  /**
   * Returns a copy of this color with a different alpha value.
   */
  withAlpha(alpha) {
    return new Color(this.r, this.g, this.b, alpha);
  }
  checkFactor(factor) {
    assert && assert(factor === undefined || factor >= 0 && factor <= 1, `factor must be between 0 and 1: ${factor}`);
    return factor === undefined ? 0.7 : factor;
  }

  /**
   * Matches Java's Color.brighter()
   */
  brighterColor(factor) {
    factor = this.checkFactor(factor);
    const red = Math.min(255, Math.floor(this.r / factor));
    const green = Math.min(255, Math.floor(this.g / factor));
    const blue = Math.min(255, Math.floor(this.b / factor));
    return new Color(red, green, blue, this.a);
  }

  /**
   * Brightens a color in RGB space. Useful when creating gradients from a single base color.
   *
   * @param [factor] - 0 (no change) to 1 (white)
   * @returns - (closer to white) version of the original color.
   */
  colorUtilsBrighter(factor) {
    factor = this.checkFactor(factor);
    const red = Math.min(255, this.getRed() + Math.floor(factor * (255 - this.getRed())));
    const green = Math.min(255, this.getGreen() + Math.floor(factor * (255 - this.getGreen())));
    const blue = Math.min(255, this.getBlue() + Math.floor(factor * (255 - this.getBlue())));
    return new Color(red, green, blue, this.getAlpha());
  }

  /**
   * Matches Java's Color.darker()
   */
  darkerColor(factor) {
    factor = this.checkFactor(factor);
    const red = Math.max(0, Math.floor(factor * this.r));
    const green = Math.max(0, Math.floor(factor * this.g));
    const blue = Math.max(0, Math.floor(factor * this.b));
    return new Color(red, green, blue, this.a);
  }

  /**
   * Darken a color in RGB space. Useful when creating gradients from a single
   * base color.
   *
   * @param [factor] - 0 (no change) to 1 (black)
   * @returns - darker (closer to black) version of the original color.
   */
  colorUtilsDarker(factor) {
    factor = this.checkFactor(factor);
    const red = Math.max(0, this.getRed() - Math.floor(factor * this.getRed()));
    const green = Math.max(0, this.getGreen() - Math.floor(factor * this.getGreen()));
    const blue = Math.max(0, this.getBlue() - Math.floor(factor * this.getBlue()));
    return new Color(red, green, blue, this.getAlpha());
  }

  /**
   * Like colorUtilsBrighter/Darker, however factor should be in the range -1 to 1, and it will call:
   *   colorUtilsBrighter( factor )   for factor >  0
   *   this                           for factor == 0
   *   colorUtilsDarker( -factor )    for factor <  0
   *
   * @param factor from -1 (black), to 0 (no change), to 1 (white)
   */
  colorUtilsBrightness(factor) {
    if (factor === 0) {
      return this;
    } else if (factor > 0) {
      return this.colorUtilsBrighter(factor);
    } else {
      return this.colorUtilsDarker(-factor);
    }
  }

  /**
   * Returns a string form of this object
   */
  toString() {
    return `${this.constructor.name}[r:${this.r} g:${this.g} b:${this.b} a:${this.a}]`;
  }

  /**
   * Convert to a hex string, that starts with "#".
   */
  toHexString() {
    let hexString = this.toNumber().toString(16);
    while (hexString.length < 6) {
      hexString = `0${hexString}`;
    }
    return `#${hexString}`;
  }
  toStateObject() {
    return {
      r: this.r,
      g: this.g,
      b: this.b,
      a: this.a
    };
  }

  /**
   * Utility function, see http://www.w3.org/TR/css3-color/
   */
  static hueToRGB(m1, m2, h) {
    if (h < 0) {
      h = h + 1;
    }
    if (h > 1) {
      h = h - 1;
    }
    if (h * 6 < 1) {
      return m1 + (m2 - m1) * h * 6;
    }
    if (h * 2 < 1) {
      return m2;
    }
    if (h * 3 < 2) {
      return m1 + (m2 - m1) * (2 / 3 - h) * 6;
    }
    return m1;
  }

  /**
   * Convenience function that converts a color spec to a color object if necessary, or simply returns the color object
   * if not.
   *
   * Please note there is no defensive copy when a color is passed in unlike PaintDef.
   */
  static toColor(colorSpec) {
    if (colorSpec === null) {
      return Color.TRANSPARENT;
    } else if (colorSpec instanceof Color) {
      return colorSpec;
    } else if (typeof colorSpec === 'string') {
      return new Color(colorSpec);
    } else {
      return Color.toColor(colorSpec.value);
    }
  }

  /**
   * Interpolates between 2 colors in RGBA space. When distance is 0, color1 is returned. When distance is 1, color2 is
   * returned. Other values of distance return a color somewhere between color1 and color2. Each color component is
   * interpolated separately.
   *
   * @param color1
   * @param color2
   * @param distance distance between color1 and color2, 0 <= distance <= 1
   */
  static interpolateRGBA(color1, color2, distance) {
    if (distance < 0 || distance > 1) {
      throw new Error(`distance must be between 0 and 1: ${distance}`);
    }
    const r = Math.floor(linear(0, 1, color1.r, color2.r, distance));
    const g = Math.floor(linear(0, 1, color1.g, color2.g, distance));
    const b = Math.floor(linear(0, 1, color1.b, color2.b, distance));
    const a = linear(0, 1, color1.a, color2.a, distance);
    return new Color(r, g, b, a);
  }

  /**
   * Returns a blended color as a mix between the given colors.
   */
  static supersampleBlend(colors) {
    // hard-coded gamma (assuming the exponential part of the sRGB curve as a simplification)
    const GAMMA = 2.2;

    // maps to [0,1] linear colorspace
    const reds = colors.map(color => Math.pow(color.r / 255, GAMMA));
    const greens = colors.map(color => Math.pow(color.g / 255, GAMMA));
    const blues = colors.map(color => Math.pow(color.b / 255, GAMMA));
    const alphas = colors.map(color => Math.pow(color.a, GAMMA));
    const alphaSum = _.sum(alphas);
    if (alphaSum === 0) {
      return new Color(0, 0, 0, 0);
    }

    // blending of pixels, weighted by alphas
    const red = _.sum(_.range(0, colors.length).map(i => reds[i] * alphas[i])) / alphaSum;
    const green = _.sum(_.range(0, colors.length).map(i => greens[i] * alphas[i])) / alphaSum;
    const blue = _.sum(_.range(0, colors.length).map(i => blues[i] * alphas[i])) / alphaSum;
    const alpha = alphaSum / colors.length; // average of alphas

    return new Color(Math.floor(Math.pow(red, 1 / GAMMA) * 255), Math.floor(Math.pow(green, 1 / GAMMA) * 255), Math.floor(Math.pow(blue, 1 / GAMMA) * 255), Math.pow(alpha, 1 / GAMMA));
  }
  static fromStateObject(stateObject) {
    return new Color(stateObject.r, stateObject.g, stateObject.b, stateObject.a);
  }
  static hsla(hue, saturation, lightness, alpha) {
    return new Color(0, 0, 0, 1).setHSLA(hue, saturation, lightness, alpha);
  }
  static checkPaintString(cssString) {
    if (assert) {
      try {
        scratchColor.setCSS(cssString);
      } catch (e) {
        assert(false, `The CSS string is an invalid color: ${cssString}`);
      }
    }
  }

  /**
   * A Paint of the type that Paintable accepts as fills or strokes
   */
  static checkPaint(paint) {
    if (typeof paint === 'string') {
      Color.checkPaintString(paint);
    } else if (isTReadOnlyProperty(paint) && typeof paint.value === 'string') {
      Color.checkPaintString(paint.value);
    }
  }

  /**
   * Gets the luminance of a color, per ITU-R recommendation BT.709, https://en.wikipedia.org/wiki/Rec._709.
   * Green contributes the most to the intensity perceived by humans, and blue the least.
   * This algorithm works correctly with a grayscale color because the RGB coefficients sum to 1.
   *
   * @returns - a value in the range [0,255]
   */
  static getLuminance(color) {
    const sceneryColor = Color.toColor(color);
    const luminance = sceneryColor.red * 0.2126 + sceneryColor.green * 0.7152 + sceneryColor.blue * 0.0722;
    assert && assert(luminance >= 0 && luminance <= 255, `unexpected luminance: ${luminance}`);
    return luminance;
  }

  /**
   * Converts a color to grayscale.
   */
  static toGrayscale(color) {
    const luminance = Color.getLuminance(color);
    return new Color(luminance, luminance, luminance);
  }

  /**
   * Determines whether a color is 'dark'.
   *
   * @param color - colors with luminance < this value are dark, range [0,255], default 186
   * @param luminanceThreshold - colors with luminance < this value are dark, range [0,255], default 186
   */
  static isDarkColor(color, luminanceThreshold = 186) {
    assert && assert(luminanceThreshold >= 0 && luminanceThreshold <= 255, 'invalid luminanceThreshold');
    return Color.getLuminance(color) < luminanceThreshold;
  }

  /**
   * Determines whether a color is 'light'.
   *
   * @param color
   * @param [luminanceThreshold] - colors with luminance >= this value are light, range [0,255], default 186
   */
  static isLightColor(color, luminanceThreshold) {
    return !Color.isDarkColor(color, luminanceThreshold);
  }

  /**
   * Creates a Color that is a shade of gray.
   * @param rgb - used for red, blue, and green components
   * @param [a] - defaults to 1
   */
  static grayColor(rgb, a) {
    return new Color(rgb, rgb, rgb, a);
  }

  /**
   * Converts a CSS color string into a standard format, lower-casing and keyword-matching it.
   */
  static preprocessCSS(cssString) {
    let str = cssString.replace(/ /g, '').toLowerCase();

    // replace colors based on keywords
    const keywordMatch = Color.colorKeywords[str];
    if (keywordMatch) {
      str = `#${keywordMatch}`;
    }
    return str;
  }

  /**
   * Whether the specified CSS string is a valid CSS color string
   */
  static isCSSColorString(cssString) {
    const str = Color.preprocessCSS(cssString);

    // run through the available text formats
    for (let i = 0; i < Color.formatParsers.length; i++) {
      const parser = Color.formatParsers[i];
      const matches = parser.regexp.exec(str);
      if (matches) {
        return true;
      }
    }
    return false;
  }
  static formatParsers = [{
    // 'transparent'
    regexp: /^transparent$/,
    apply: (color, matches) => {
      color.setRGBA(0, 0, 0, 0);
    }
  }, {
    // short hex form, a la '#fff'
    regexp: /^#(\w{1})(\w{1})(\w{1})$/,
    apply: (color, matches) => {
      color.setRGBA(parseInt(matches[1] + matches[1], 16), parseInt(matches[2] + matches[2], 16), parseInt(matches[3] + matches[3], 16), 1);
    }
  }, {
    // long hex form, a la '#ffffff'
    regexp: /^#(\w{2})(\w{2})(\w{2})$/,
    apply: (color, matches) => {
      color.setRGBA(parseInt(matches[1], 16), parseInt(matches[2], 16), parseInt(matches[3], 16), 1);
    }
  }, {
    // rgb(...)
    regexp: new RegExp(`^rgb\\(${rgbNumber},${rgbNumber},${rgbNumber}\\)$`),
    apply: (color, matches) => {
      color.setRGBA(parseRGBNumber(matches[1]), parseRGBNumber(matches[2]), parseRGBNumber(matches[3]), 1);
    }
  }, {
    // rgba(...)
    regexp: new RegExp(`^rgba\\(${rgbNumber},${rgbNumber},${rgbNumber},${aNumber}\\)$`),
    apply: (color, matches) => {
      color.setRGBA(parseRGBNumber(matches[1]), parseRGBNumber(matches[2]), parseRGBNumber(matches[3]), Number(matches[4]));
    }
  }, {
    // hsl(...)
    regexp: new RegExp(`^hsl\\(${rawNumber},${rawNumber}%,${rawNumber}%\\)$`),
    apply: (color, matches) => {
      color.setHSLA(Number(matches[1]), Number(matches[2]), Number(matches[3]), 1);
    }
  }, {
    // hsla(...)
    regexp: new RegExp(`^hsla\\(${rawNumber},${rawNumber}%,${rawNumber}%,${aNumber}\\)$`),
    apply: (color, matches) => {
      color.setHSLA(Number(matches[1]), Number(matches[2]), Number(matches[3]), Number(matches[4]));
    }
  }];
  static basicColorKeywords = {
    aqua: '00ffff',
    black: '000000',
    blue: '0000ff',
    fuchsia: 'ff00ff',
    gray: '808080',
    green: '008000',
    lime: '00ff00',
    maroon: '800000',
    navy: '000080',
    olive: '808000',
    purple: '800080',
    red: 'ff0000',
    silver: 'c0c0c0',
    teal: '008080',
    white: 'ffffff',
    yellow: 'ffff00'
  };
  static colorKeywords = {
    aliceblue: 'f0f8ff',
    antiquewhite: 'faebd7',
    aqua: '00ffff',
    aquamarine: '7fffd4',
    azure: 'f0ffff',
    beige: 'f5f5dc',
    bisque: 'ffe4c4',
    black: '000000',
    blanchedalmond: 'ffebcd',
    blue: '0000ff',
    blueviolet: '8a2be2',
    brown: 'a52a2a',
    burlywood: 'deb887',
    cadetblue: '5f9ea0',
    chartreuse: '7fff00',
    chocolate: 'd2691e',
    coral: 'ff7f50',
    cornflowerblue: '6495ed',
    cornsilk: 'fff8dc',
    crimson: 'dc143c',
    cyan: '00ffff',
    darkblue: '00008b',
    darkcyan: '008b8b',
    darkgoldenrod: 'b8860b',
    darkgray: 'a9a9a9',
    darkgreen: '006400',
    darkgrey: 'a9a9a9',
    darkkhaki: 'bdb76b',
    darkmagenta: '8b008b',
    darkolivegreen: '556b2f',
    darkorange: 'ff8c00',
    darkorchid: '9932cc',
    darkred: '8b0000',
    darksalmon: 'e9967a',
    darkseagreen: '8fbc8f',
    darkslateblue: '483d8b',
    darkslategray: '2f4f4f',
    darkslategrey: '2f4f4f',
    darkturquoise: '00ced1',
    darkviolet: '9400d3',
    deeppink: 'ff1493',
    deepskyblue: '00bfff',
    dimgray: '696969',
    dimgrey: '696969',
    dodgerblue: '1e90ff',
    firebrick: 'b22222',
    floralwhite: 'fffaf0',
    forestgreen: '228b22',
    fuchsia: 'ff00ff',
    gainsboro: 'dcdcdc',
    ghostwhite: 'f8f8ff',
    gold: 'ffd700',
    goldenrod: 'daa520',
    gray: '808080',
    green: '008000',
    greenyellow: 'adff2f',
    grey: '808080',
    honeydew: 'f0fff0',
    hotpink: 'ff69b4',
    indianred: 'cd5c5c',
    indigo: '4b0082',
    ivory: 'fffff0',
    khaki: 'f0e68c',
    lavender: 'e6e6fa',
    lavenderblush: 'fff0f5',
    lawngreen: '7cfc00',
    lemonchiffon: 'fffacd',
    lightblue: 'add8e6',
    lightcoral: 'f08080',
    lightcyan: 'e0ffff',
    lightgoldenrodyellow: 'fafad2',
    lightgray: 'd3d3d3',
    lightgreen: '90ee90',
    lightgrey: 'd3d3d3',
    lightpink: 'ffb6c1',
    lightsalmon: 'ffa07a',
    lightseagreen: '20b2aa',
    lightskyblue: '87cefa',
    lightslategray: '778899',
    lightslategrey: '778899',
    lightsteelblue: 'b0c4de',
    lightyellow: 'ffffe0',
    lime: '00ff00',
    limegreen: '32cd32',
    linen: 'faf0e6',
    magenta: 'ff00ff',
    maroon: '800000',
    mediumaquamarine: '66cdaa',
    mediumblue: '0000cd',
    mediumorchid: 'ba55d3',
    mediumpurple: '9370db',
    mediumseagreen: '3cb371',
    mediumslateblue: '7b68ee',
    mediumspringgreen: '00fa9a',
    mediumturquoise: '48d1cc',
    mediumvioletred: 'c71585',
    midnightblue: '191970',
    mintcream: 'f5fffa',
    mistyrose: 'ffe4e1',
    moccasin: 'ffe4b5',
    navajowhite: 'ffdead',
    navy: '000080',
    oldlace: 'fdf5e6',
    olive: '808000',
    olivedrab: '6b8e23',
    orange: 'ffa500',
    orangered: 'ff4500',
    orchid: 'da70d6',
    palegoldenrod: 'eee8aa',
    palegreen: '98fb98',
    paleturquoise: 'afeeee',
    palevioletred: 'db7093',
    papayawhip: 'ffefd5',
    peachpuff: 'ffdab9',
    peru: 'cd853f',
    pink: 'ffc0cb',
    plum: 'dda0dd',
    powderblue: 'b0e0e6',
    purple: '800080',
    red: 'ff0000',
    rosybrown: 'bc8f8f',
    royalblue: '4169e1',
    saddlebrown: '8b4513',
    salmon: 'fa8072',
    sandybrown: 'f4a460',
    seagreen: '2e8b57',
    seashell: 'fff5ee',
    sienna: 'a0522d',
    silver: 'c0c0c0',
    skyblue: '87ceeb',
    slateblue: '6a5acd',
    slategray: '708090',
    slategrey: '708090',
    snow: 'fffafa',
    springgreen: '00ff7f',
    steelblue: '4682b4',
    tan: 'd2b48c',
    teal: '008080',
    thistle: 'd8bfd8',
    tomato: 'ff6347',
    turquoise: '40e0d0',
    violet: 'ee82ee',
    wheat: 'f5deb3',
    white: 'ffffff',
    whitesmoke: 'f5f5f5',
    yellow: 'ffff00',
    yellowgreen: '9acd32'
  };

  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
  // eslint-disable-line uppercase-statics-should-be-readonly
}
scenery.register('Color', Color);

// Java compatibility
Color.BLACK = Color.black = new Color(0, 0, 0).setImmutable();
Color.BLUE = Color.blue = new Color(0, 0, 255).setImmutable();
Color.CYAN = Color.cyan = new Color(0, 255, 255).setImmutable();
Color.DARK_GRAY = Color.darkGray = new Color(64, 64, 64).setImmutable();
Color.GRAY = Color.gray = new Color(128, 128, 128).setImmutable();
Color.GREEN = Color.green = new Color(0, 255, 0).setImmutable();
Color.LIGHT_GRAY = Color.lightGray = new Color(192, 192, 192).setImmutable();
Color.MAGENTA = Color.magenta = new Color(255, 0, 255).setImmutable();
Color.ORANGE = Color.orange = new Color(255, 200, 0).setImmutable();
Color.PINK = Color.pink = new Color(255, 175, 175).setImmutable();
Color.RED = Color.red = new Color(255, 0, 0).setImmutable();
Color.WHITE = Color.white = new Color(255, 255, 255).setImmutable();
Color.YELLOW = Color.yellow = new Color(255, 255, 0).setImmutable();

// Helper for transparent colors
Color.TRANSPARENT = Color.transparent = new Color(0, 0, 0, 0).setImmutable();
const scratchColor = new Color('blue');
Color.ColorIO = new IOType('ColorIO', {
  valueType: Color,
  documentation: 'A color, with rgba',
  toStateObject: color => color.toStateObject(),
  fromStateObject: stateObject => new Color(stateObject.r, stateObject.g, stateObject.b, stateObject.a),
  stateSchema: {
    r: NumberIO,
    g: NumberIO,
    b: NumberIO,
    a: NumberIO
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUaW55RW1pdHRlciIsIlV0aWxzIiwiSU9UeXBlIiwiTnVtYmVySU8iLCJzY2VuZXJ5IiwiaXNUUmVhZE9ubHlQcm9wZXJ0eSIsImNsYW1wIiwibGluZWFyIiwicmdiTnVtYmVyIiwiYU51bWJlciIsInJhd051bWJlciIsInBhcnNlUkdCTnVtYmVyIiwic3RyIiwibXVsdGlwbGllciIsImVuZHNXaXRoIiwic2xpY2UiLCJsZW5ndGgiLCJyb3VuZFN5bW1ldHJpYyIsIk51bWJlciIsIkNvbG9yIiwiY29uc3RydWN0b3IiLCJyIiwiZyIsImIiLCJhIiwiY2hhbmdlRW1pdHRlciIsInNldCIsImNvcHkiLCJhc3NlcnQiLCJ1bmRlZmluZWQiLCJzZXRSR0JBIiwic2V0Q1NTIiwicmVkIiwiZ3JlZW4iLCJibHVlIiwiYWxwaGEiLCJnZXRSZWQiLCJ2YWx1ZSIsInNldFJlZCIsImdldEdyZWVuIiwic2V0R3JlZW4iLCJnZXRCbHVlIiwic2V0Qmx1ZSIsImdldEFscGhhIiwic2V0QWxwaGEiLCJ1cGRhdGVDb2xvciIsImJsZW5kIiwib3RoZXJDb2xvciIsInJhdGlvIiwiZ2FtbWEiLCJsaW5lYXJSZWRBIiwiTWF0aCIsInBvdyIsImxpbmVhclJlZEIiLCJsaW5lYXJHcmVlbkEiLCJsaW5lYXJHcmVlbkIiLCJsaW5lYXJCbHVlQSIsImxpbmVhckJsdWVCIiwiY29tcHV0ZUNTUyIsInRvRml4ZWQiLCJhbHBoYVN0cmluZyIsInRvQ1NTIiwiX2NzcyIsImNzc1N0cmluZyIsInN1Y2Nlc3MiLCJwcmVwcm9jZXNzQ1NTIiwiaSIsImZvcm1hdFBhcnNlcnMiLCJwYXJzZXIiLCJtYXRjaGVzIiwicmVnZXhwIiwiZXhlYyIsImFwcGx5IiwiRXJyb3IiLCJ0b051bWJlciIsImltbXV0YWJsZSIsInRvU3RyaW5nIiwiaXNGaW5pdGUiLCJvbGRDU1MiLCJlbWl0Iiwic2V0SW1tdXRhYmxlIiwiZ2V0Q2FudmFzU3R5bGUiLCJzZXRIU0xBIiwiaHVlIiwic2F0dXJhdGlvbiIsImxpZ2h0bmVzcyIsIm0yIiwibTEiLCJodWVUb1JHQiIsImVxdWFscyIsImNvbG9yIiwid2l0aEFscGhhIiwiY2hlY2tGYWN0b3IiLCJmYWN0b3IiLCJicmlnaHRlckNvbG9yIiwibWluIiwiZmxvb3IiLCJjb2xvclV0aWxzQnJpZ2h0ZXIiLCJkYXJrZXJDb2xvciIsIm1heCIsImNvbG9yVXRpbHNEYXJrZXIiLCJjb2xvclV0aWxzQnJpZ2h0bmVzcyIsIm5hbWUiLCJ0b0hleFN0cmluZyIsImhleFN0cmluZyIsInRvU3RhdGVPYmplY3QiLCJoIiwidG9Db2xvciIsImNvbG9yU3BlYyIsIlRSQU5TUEFSRU5UIiwiaW50ZXJwb2xhdGVSR0JBIiwiY29sb3IxIiwiY29sb3IyIiwiZGlzdGFuY2UiLCJzdXBlcnNhbXBsZUJsZW5kIiwiY29sb3JzIiwiR0FNTUEiLCJyZWRzIiwibWFwIiwiZ3JlZW5zIiwiYmx1ZXMiLCJhbHBoYXMiLCJhbHBoYVN1bSIsIl8iLCJzdW0iLCJyYW5nZSIsImZyb21TdGF0ZU9iamVjdCIsInN0YXRlT2JqZWN0IiwiaHNsYSIsImNoZWNrUGFpbnRTdHJpbmciLCJzY3JhdGNoQ29sb3IiLCJlIiwiY2hlY2tQYWludCIsInBhaW50IiwiZ2V0THVtaW5hbmNlIiwic2NlbmVyeUNvbG9yIiwibHVtaW5hbmNlIiwidG9HcmF5c2NhbGUiLCJpc0RhcmtDb2xvciIsImx1bWluYW5jZVRocmVzaG9sZCIsImlzTGlnaHRDb2xvciIsImdyYXlDb2xvciIsInJnYiIsInJlcGxhY2UiLCJ0b0xvd2VyQ2FzZSIsImtleXdvcmRNYXRjaCIsImNvbG9yS2V5d29yZHMiLCJpc0NTU0NvbG9yU3RyaW5nIiwicGFyc2VJbnQiLCJSZWdFeHAiLCJiYXNpY0NvbG9yS2V5d29yZHMiLCJhcXVhIiwiYmxhY2siLCJmdWNoc2lhIiwiZ3JheSIsImxpbWUiLCJtYXJvb24iLCJuYXZ5Iiwib2xpdmUiLCJwdXJwbGUiLCJzaWx2ZXIiLCJ0ZWFsIiwid2hpdGUiLCJ5ZWxsb3ciLCJhbGljZWJsdWUiLCJhbnRpcXVld2hpdGUiLCJhcXVhbWFyaW5lIiwiYXp1cmUiLCJiZWlnZSIsImJpc3F1ZSIsImJsYW5jaGVkYWxtb25kIiwiYmx1ZXZpb2xldCIsImJyb3duIiwiYnVybHl3b29kIiwiY2FkZXRibHVlIiwiY2hhcnRyZXVzZSIsImNob2NvbGF0ZSIsImNvcmFsIiwiY29ybmZsb3dlcmJsdWUiLCJjb3Juc2lsayIsImNyaW1zb24iLCJjeWFuIiwiZGFya2JsdWUiLCJkYXJrY3lhbiIsImRhcmtnb2xkZW5yb2QiLCJkYXJrZ3JheSIsImRhcmtncmVlbiIsImRhcmtncmV5IiwiZGFya2toYWtpIiwiZGFya21hZ2VudGEiLCJkYXJrb2xpdmVncmVlbiIsImRhcmtvcmFuZ2UiLCJkYXJrb3JjaGlkIiwiZGFya3JlZCIsImRhcmtzYWxtb24iLCJkYXJrc2VhZ3JlZW4iLCJkYXJrc2xhdGVibHVlIiwiZGFya3NsYXRlZ3JheSIsImRhcmtzbGF0ZWdyZXkiLCJkYXJrdHVycXVvaXNlIiwiZGFya3Zpb2xldCIsImRlZXBwaW5rIiwiZGVlcHNreWJsdWUiLCJkaW1ncmF5IiwiZGltZ3JleSIsImRvZGdlcmJsdWUiLCJmaXJlYnJpY2siLCJmbG9yYWx3aGl0ZSIsImZvcmVzdGdyZWVuIiwiZ2FpbnNib3JvIiwiZ2hvc3R3aGl0ZSIsImdvbGQiLCJnb2xkZW5yb2QiLCJncmVlbnllbGxvdyIsImdyZXkiLCJob25leWRldyIsImhvdHBpbmsiLCJpbmRpYW5yZWQiLCJpbmRpZ28iLCJpdm9yeSIsImtoYWtpIiwibGF2ZW5kZXIiLCJsYXZlbmRlcmJsdXNoIiwibGF3bmdyZWVuIiwibGVtb25jaGlmZm9uIiwibGlnaHRibHVlIiwibGlnaHRjb3JhbCIsImxpZ2h0Y3lhbiIsImxpZ2h0Z29sZGVucm9keWVsbG93IiwibGlnaHRncmF5IiwibGlnaHRncmVlbiIsImxpZ2h0Z3JleSIsImxpZ2h0cGluayIsImxpZ2h0c2FsbW9uIiwibGlnaHRzZWFncmVlbiIsImxpZ2h0c2t5Ymx1ZSIsImxpZ2h0c2xhdGVncmF5IiwibGlnaHRzbGF0ZWdyZXkiLCJsaWdodHN0ZWVsYmx1ZSIsImxpZ2h0eWVsbG93IiwibGltZWdyZWVuIiwibGluZW4iLCJtYWdlbnRhIiwibWVkaXVtYXF1YW1hcmluZSIsIm1lZGl1bWJsdWUiLCJtZWRpdW1vcmNoaWQiLCJtZWRpdW1wdXJwbGUiLCJtZWRpdW1zZWFncmVlbiIsIm1lZGl1bXNsYXRlYmx1ZSIsIm1lZGl1bXNwcmluZ2dyZWVuIiwibWVkaXVtdHVycXVvaXNlIiwibWVkaXVtdmlvbGV0cmVkIiwibWlkbmlnaHRibHVlIiwibWludGNyZWFtIiwibWlzdHlyb3NlIiwibW9jY2FzaW4iLCJuYXZham93aGl0ZSIsIm9sZGxhY2UiLCJvbGl2ZWRyYWIiLCJvcmFuZ2UiLCJvcmFuZ2VyZWQiLCJvcmNoaWQiLCJwYWxlZ29sZGVucm9kIiwicGFsZWdyZWVuIiwicGFsZXR1cnF1b2lzZSIsInBhbGV2aW9sZXRyZWQiLCJwYXBheWF3aGlwIiwicGVhY2hwdWZmIiwicGVydSIsInBpbmsiLCJwbHVtIiwicG93ZGVyYmx1ZSIsInJvc3licm93biIsInJveWFsYmx1ZSIsInNhZGRsZWJyb3duIiwic2FsbW9uIiwic2FuZHlicm93biIsInNlYWdyZWVuIiwic2Vhc2hlbGwiLCJzaWVubmEiLCJza3libHVlIiwic2xhdGVibHVlIiwic2xhdGVncmF5Iiwic2xhdGVncmV5Iiwic25vdyIsInNwcmluZ2dyZWVuIiwic3RlZWxibHVlIiwidGFuIiwidGhpc3RsZSIsInRvbWF0byIsInR1cnF1b2lzZSIsInZpb2xldCIsIndoZWF0Iiwid2hpdGVzbW9rZSIsInllbGxvd2dyZWVuIiwicmVnaXN0ZXIiLCJCTEFDSyIsIkJMVUUiLCJDWUFOIiwiREFSS19HUkFZIiwiZGFya0dyYXkiLCJHUkFZIiwiR1JFRU4iLCJMSUdIVF9HUkFZIiwibGlnaHRHcmF5IiwiTUFHRU5UQSIsIk9SQU5HRSIsIlBJTksiLCJSRUQiLCJXSElURSIsIllFTExPVyIsInRyYW5zcGFyZW50IiwiQ29sb3JJTyIsInZhbHVlVHlwZSIsImRvY3VtZW50YXRpb24iLCJzdGF0ZVNjaGVtYSJdLCJzb3VyY2VzIjpbIkNvbG9yLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEyLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEEgY29sb3Igd2l0aCBSR0JBIHZhbHVlcywgYXNzdW1pbmcgdGhlIHNSR0IgY29sb3Igc3BhY2UgaXMgdXNlZC5cclxuICpcclxuICogU2VlIGh0dHA6Ly93d3cudzMub3JnL1RSL2NzczMtY29sb3IvXHJcbiAqXHJcbiAqIFRPRE86IG1ha2UgYSBnZXRIdWUsIGdldFNhdHVyYXRpb24sIGdldExpZ2h0bmVzcy4gd2UgY2FuIHRoZW4gZXhwb3NlIHRoZW0gdmlhIEVTNSEgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBURW1pdHRlciBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RFbWl0dGVyLmpzJztcclxuaW1wb3J0IFRpbnlFbWl0dGVyIGZyb20gJy4uLy4uLy4uL2F4b24vanMvVGlueUVtaXR0ZXIuanMnO1xyXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vLi4vZG90L2pzL1V0aWxzLmpzJztcclxuaW1wb3J0IElPVHlwZSBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvdHlwZXMvSU9UeXBlLmpzJztcclxuaW1wb3J0IE51bWJlcklPIGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy90eXBlcy9OdW1iZXJJTy5qcyc7XHJcbmltcG9ydCB7IHNjZW5lcnksIFRQYWludCB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgVENvbG9yIGZyb20gJy4vVENvbG9yLmpzJztcclxuaW1wb3J0IHsgaXNUUmVhZE9ubHlQcm9wZXJ0eSB9IGZyb20gJy4uLy4uLy4uL2F4b24vanMvVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5cclxuLy8gY29uc3RhbnRzXHJcbmNvbnN0IGNsYW1wID0gVXRpbHMuY2xhbXA7XHJcbmNvbnN0IGxpbmVhciA9IFV0aWxzLmxpbmVhcjtcclxuXHJcbnR5cGUgRm9ybWF0UGFyc2VyID0ge1xyXG4gIHJlZ2V4cDogUmVnRXhwO1xyXG4gIGFwcGx5OiAoIGNvbG9yOiBDb2xvciwgbWF0Y2hlczogUmVnRXhwRXhlY0FycmF5ICkgPT4gdm9pZDtcclxufTtcclxuXHJcbi8vIHJlZ2V4IHV0aWxpdGllc1xyXG5jb25zdCByZ2JOdW1iZXIgPSAnKC0/XFxcXGR7MSwzfSU/KSc7IC8vIHN5bnRheCBhbGxvd3MgbmVnYXRpdmUgaW50ZWdlcnMgYW5kIHBlcmNlbnRhZ2VzXHJcbmNvbnN0IGFOdW1iZXIgPSAnKFxcXFxkK3xcXFxcZCpcXFxcLlxcXFxkKyknOyAvLyBkZWNpbWFsIHBvaW50IG51bWJlci4gdGVjaG5pY2FsbHkgd2UgYWxsb3cgZm9yICcyNTUnLCBldmVuIHRob3VnaCB0aGlzIHdpbGwgYmUgY2xhbXBlZCB0byAxLlxyXG5jb25zdCByYXdOdW1iZXIgPSAnKFxcXFxkezEsM30pJzsgLy8gYSAxLTMgZGlnaXQgbnVtYmVyXHJcblxyXG4vLyBoYW5kbGVzIG5lZ2F0aXZlIGFuZCBwZXJjZW50YWdlIHZhbHVlc1xyXG5mdW5jdGlvbiBwYXJzZVJHQk51bWJlciggc3RyOiBzdHJpbmcgKTogbnVtYmVyIHtcclxuICBsZXQgbXVsdGlwbGllciA9IDE7XHJcblxyXG4gIC8vIGlmIGl0J3MgYSBwZXJjZW50YWdlLCBzdHJpcCBpdCBvZmYgYW5kIGhhbmRsZSBpdCB0aGF0IHdheVxyXG4gIGlmICggc3RyLmVuZHNXaXRoKCAnJScgKSApIHtcclxuICAgIG11bHRpcGxpZXIgPSAyLjU1O1xyXG4gICAgc3RyID0gc3RyLnNsaWNlKCAwLCBzdHIubGVuZ3RoIC0gMSApO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFV0aWxzLnJvdW5kU3ltbWV0cmljKCBOdW1iZXIoIHN0ciApICogbXVsdGlwbGllciApO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb2xvciB7XHJcbiAgLy8gUkdCQSB2YWx1ZXNcclxuICBwdWJsaWMgciE6IG51bWJlcjtcclxuICBwdWJsaWMgZyE6IG51bWJlcjtcclxuICBwdWJsaWMgYiE6IG51bWJlcjtcclxuICBwdWJsaWMgYSE6IG51bWJlcjtcclxuXHJcbiAgLy8gRm9yIGNhY2hpbmcgYW5kIHBlcmZvcm1hbmNlXHJcbiAgcHJpdmF0ZSBfY3NzPzogc3RyaW5nO1xyXG5cclxuICAvLyBJZiBhc3NlcnRpb25zIGFyZSBlbmFibGVkXHJcbiAgcHJpdmF0ZSBpbW11dGFibGU/OiBib29sZWFuO1xyXG5cclxuICAvLyBGaXJlcyB3aGVuIHRoZSBjb2xvciBpcyBjaGFuZ2VkXHJcbiAgcHVibGljIHJlYWRvbmx5IGNoYW5nZUVtaXR0ZXI6IFRFbWl0dGVyO1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgQ29sb3Igd2l0aCBhbiBpbml0aWFsIHZhbHVlLiBNdWx0aXBsZSBkaWZmZXJlbnQgdHlwZXMgb2YgcGFyYW1ldGVycyBhcmUgc3VwcG9ydGVkOlxyXG4gICAqIC0gbmV3IENvbG9yKCBjb2xvciApIGlzIGEgY29weSBjb25zdHJ1Y3RvciwgZm9yIGEge0NvbG9yfVxyXG4gICAqIC0gbmV3IENvbG9yKCBzdHJpbmcgKSB3aWxsIHBhcnNlIHRoZSBzdHJpbmcgYXNzdW1pbmcgaXQncyBhIENTUy1jb21wYXRpYmxlIGNvbG9yLCBlLmcuIHNldCggJ3JlZCcgKVxyXG4gICAqIC0gbmV3IENvbG9yKCByLCBnLCBiICkgaXMgZXF1aXZhbGVudCB0byBzZXRSR0JBKCByLCBnLCBiLCAxICksIGUuZy4gc2V0KCAyNTUsIDAsIDEyOCApXHJcbiAgICogLSBuZXcgQ29sb3IoIHIsIGcsIGIsIGEgKSBpcyBlcXVpdmFsZW50IHRvIHNldFJHQkEoIHIsIGcsIGIsIGEgKSwgZS5nLiBzZXQoIDI1NSwgMCwgMTI4LCAwLjUgKVxyXG4gICAqIC0gbmV3IENvbG9yKCBoZXggKSB3aWxsIHNldCBSR0Igd2l0aCBhbHBoYT0xLCBlLmcuIHNldCggMHhGRjAwMDAgKVxyXG4gICAqIC0gbmV3IENvbG9yKCBoZXgsIGEgKSB3aWxsIHNldCBSR0JBLCBlLmcuIHNldCggMHhGRjAwMDAsIDEgKVxyXG4gICAqIC0gbmV3IENvbG9yKCBudWxsICkgd2lsbCBiZSB0cmFuc3BhcmVudFxyXG4gICAqXHJcbiAgICogVGhlICdyJywgJ2cnLCBhbmQgJ2InIHZhbHVlcyBzdGFuZCBmb3IgcmVkLCBncmVlbiBhbmQgYmx1ZSByZXNwZWN0aXZlbHksIGFuZCB3aWxsIGJlIGNsYW1wZWQgdG8gaW50ZWdlcnMgaW4gMC0yNTUuXHJcbiAgICogVGhlICdhJyB2YWx1ZSBzdGFuZHMgZm9yIGFscGhhLCBhbmQgd2lsbCBiZSBjbGFtcGVkIHRvIDAtMSAoZmxvYXRpbmcgcG9pbnQpXHJcbiAgICogJ2hleCcgaW5kaWNhdGVzIGEgNi1kZWNpbWFsLWRpZ2l0IGZvcm1hdCBoZXggbnVtYmVyLCBmb3IgZXhhbXBsZSAweEZGQUEwMCBpcyBlcXVpdmFsZW50IHRvIHI9MjU1LCBnPTE3MCwgYj0wLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHIgLSBTZWUgYWJvdmUgZm9yIHRoZSBwb3NzaWJsZSBvdmVybG9hZGVkIHZhbHVlc1xyXG4gICAqIEBwYXJhbSBbZ10gLSBJZiBwcm92aWRlZCwgc2hvdWxkIGJlIHRoZSBncmVlbiB2YWx1ZSAob3IgdGhlIGFscGhhIHZhbHVlIGlmIGEgaGV4IGNvbG9yIGlzIGdpdmVuKVxyXG4gICAqIEBwYXJhbSBbYl0gLSBJZiBwcm92aWRlZCwgc2hvdWxkIGJlIHRoZSBibHVlIHZhbHVlXHJcbiAgICogQHBhcmFtIFthXSAtIElmIHByb3ZpZGVkLCBzaG91bGQgYmUgdGhlIGFscGhhIHZhbHVlXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBjb2xvcjogQ29sb3IgKTtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHN0cmluZzogc3RyaW5nICk7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCByOiBudW1iZXIsIGc6IG51bWJlciwgYjogbnVtYmVyLCBhPzogbnVtYmVyICk7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBoZXg6IG51bWJlciwgYT86IG51bWJlciApO1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggdHJhbnNwYXJlbnQ6IG51bGwgKTtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHI6IG51bWJlciB8IENvbG9yIHwgc3RyaW5nIHwgbnVsbCwgZz86IG51bWJlciwgYj86IG51bWJlciwgYT86IG51bWJlciApIHtcclxuXHJcbiAgICAvLyB7RW1pdHRlcn1cclxuICAgIHRoaXMuY2hhbmdlRW1pdHRlciA9IG5ldyBUaW55RW1pdHRlcigpO1xyXG5cclxuICAgIHRoaXMuc2V0KCByLCBnLCBiLCBhICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgY29weSBvZiB0aGlzIGNvbG9yLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb3B5KCk6IENvbG9yIHtcclxuICAgIHJldHVybiBuZXcgQ29sb3IoIHRoaXMuciwgdGhpcy5nLCB0aGlzLmIsIHRoaXMuYSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgdmFsdWVzIG9mIHRoaXMgQ29sb3IuIFN1cHBvcnRlZCBzdHlsZXM6XHJcbiAgICpcclxuICAgKiAtIHNldCggY29sb3IgKSBpcyBhIGNvcHkgY29uc3RydWN0b3JcclxuICAgKiAtIHNldCggc3RyaW5nICkgd2lsbCBwYXJzZSB0aGUgc3RyaW5nIGFzc3VtaW5nIGl0J3MgYSBDU1MtY29tcGF0aWJsZSBjb2xvciwgZS5nLiBzZXQoICdyZWQnIClcclxuICAgKiAtIHNldCggciwgZywgYiApIGlzIGVxdWl2YWxlbnQgdG8gc2V0UkdCQSggciwgZywgYiwgMSApLCBlLmcuIHNldCggMjU1LCAwLCAxMjggKVxyXG4gICAqIC0gc2V0KCByLCBnLCBiLCBhICkgaXMgZXF1aXZhbGVudCB0byBzZXRSR0JBKCByLCBnLCBiLCBhICksIGUuZy4gc2V0KCAyNTUsIDAsIDEyOCwgMC41IClcclxuICAgKiAtIHNldCggaGV4ICkgd2lsbCBzZXQgUkdCIHdpdGggYWxwaGE9MSwgZS5nLiBzZXQoIDB4RkYwMDAwIClcclxuICAgKiAtIHNldCggaGV4LCBhbHBoYSApIHdpbGwgc2V0IFJHQkEsIGUuZy4gc2V0KCAweEZGMDAwMCwgMSApXHJcbiAgICogLSBzZXQoIG51bGwgKSB3aWxsIGJlIHRyYW5zcGFyZW50XHJcbiAgICpcclxuICAgKiBAcGFyYW0gciAtIFNlZSBhYm92ZSBmb3IgdGhlIHBvc3NpYmxlIG92ZXJsb2FkZWQgdmFsdWVzXHJcbiAgICogQHBhcmFtIFtnXSAtIElmIHByb3ZpZGVkLCBzaG91bGQgYmUgdGhlIGdyZWVuIHZhbHVlIChvciB0aGUgYWxwaGEgdmFsdWUgaWYgYSBoZXggY29sb3IgaXMgZ2l2ZW4pXHJcbiAgICogQHBhcmFtIFtiXSAtIElmIHByb3ZpZGVkLCBzaG91bGQgYmUgdGhlIGJsdWUgdmFsdWVcclxuICAgKiBAcGFyYW0gW2FdIC0gSWYgcHJvdmlkZWQsIHNob3VsZCBiZSB0aGUgYWxwaGEgdmFsdWVcclxuICAgKi9cclxuICBwdWJsaWMgc2V0KCByOiBudW1iZXIgfCBDb2xvciB8IHN0cmluZyB8IG51bGwsIGc/OiBudW1iZXIsIGI/OiBudW1iZXIsIGE/OiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCByICE9PSB1bmRlZmluZWQsICdDYW5cXCd0IGNhbGwgQ29sb3Iuc2V0KCB1bmRlZmluZWQgKScgKTtcclxuXHJcbiAgICBpZiAoIHIgPT09IG51bGwgKSB7XHJcbiAgICAgIHRoaXMuc2V0UkdCQSggMCwgMCwgMCwgMCApO1xyXG4gICAgfVxyXG4gICAgLy8gc3VwcG9ydCBmb3Igc2V0KCBzdHJpbmcgKVxyXG4gICAgZWxzZSBpZiAoIHR5cGVvZiByID09PSAnc3RyaW5nJyApIHtcclxuICAgICAgdGhpcy5zZXRDU1MoIHIgKTtcclxuICAgIH1cclxuICAgIC8vIHN1cHBvcnQgZm9yIHNldCggY29sb3IgKVxyXG4gICAgZWxzZSBpZiAoIHIgaW5zdGFuY2VvZiBDb2xvciApIHtcclxuICAgICAgdGhpcy5zZXRSR0JBKCByLnIsIHIuZywgci5iLCByLmEgKTtcclxuICAgIH1cclxuICAgIC8vIHN1cHBvcnQgZm9yIHNldCggaGV4ICkgYW5kIHNldCggaGV4LCBhbHBoYSApXHJcbiAgICBlbHNlIGlmICggYiA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBnID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIGcgPT09ICdudW1iZXInICk7XHJcblxyXG4gICAgICBjb25zdCByZWQgPSAoIHIgPj4gMTYgKSAmIDB4RkY7XHJcbiAgICAgIGNvbnN0IGdyZWVuID0gKCByID4+IDggKSAmIDB4RkY7XHJcbiAgICAgIGNvbnN0IGJsdWUgPSAoIHIgPj4gMCApICYgMHhGRjtcclxuICAgICAgY29uc3QgYWxwaGEgPSAoIGcgPT09IHVuZGVmaW5lZCApID8gMSA6IGc7XHJcbiAgICAgIHRoaXMuc2V0UkdCQSggcmVkLCBncmVlbiwgYmx1ZSwgYWxwaGEgKTtcclxuICAgIH1cclxuICAgIC8vIHN1cHBvcnQgZm9yIHNldCggciwgZywgYiApIGFuZCBzZXQoIHIsIGcsIGIsIGEgKVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGEgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgYSA9PT0gJ251bWJlcicgKTtcclxuICAgICAgdGhpcy5zZXRSR0JBKCByLCBnISwgYiwgKCBhID09PSB1bmRlZmluZWQgKSA/IDEgOiBhICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIHN1cHBvcnQgY2hhaW5pbmdcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHJlZCB2YWx1ZSBhcyBhbiBpbnRlZ2VyIGJldHdlZW4gMCBhbmQgMjU1XHJcbiAgICovXHJcbiAgcHVibGljIGdldFJlZCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMucjtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcmVkKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldFJlZCgpOyB9XHJcblxyXG4gIHB1YmxpYyBzZXQgcmVkKCB2YWx1ZTogbnVtYmVyICkgeyB0aGlzLnNldFJlZCggdmFsdWUgKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSByZWQgdmFsdWUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdmFsdWUgLSBXaWxsIGJlIGNsYW1wZWQgdG8gYW4gaW50ZWdlciBiZXR3ZWVuIDAgYW5kIDI1NVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRSZWQoIHZhbHVlOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRSR0JBKCB2YWx1ZSwgdGhpcy5nLCB0aGlzLmIsIHRoaXMuYSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgZ3JlZW4gdmFsdWUgYXMgYW4gaW50ZWdlciBiZXR3ZWVuIDAgYW5kIDI1NVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRHcmVlbigpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZ3JlZW4oKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0R3JlZW4oKTsgfVxyXG5cclxuICBwdWJsaWMgc2V0IGdyZWVuKCB2YWx1ZTogbnVtYmVyICkgeyB0aGlzLnNldEdyZWVuKCB2YWx1ZSApOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGdyZWVuIHZhbHVlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHZhbHVlIC0gV2lsbCBiZSBjbGFtcGVkIHRvIGFuIGludGVnZXIgYmV0d2VlbiAwIGFuZCAyNTVcclxuICAgKi9cclxuICBwdWJsaWMgc2V0R3JlZW4oIHZhbHVlOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXRSR0JBKCB0aGlzLnIsIHZhbHVlLCB0aGlzLmIsIHRoaXMuYSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgYmx1ZSB2YWx1ZSBhcyBhbiBpbnRlZ2VyIGJldHdlZW4gMCBhbmQgMjU1XHJcbiAgICovXHJcbiAgcHVibGljIGdldEJsdWUoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmI7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGJsdWUoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0Qmx1ZSgpOyB9XHJcblxyXG4gIHB1YmxpYyBzZXQgYmx1ZSggdmFsdWU6IG51bWJlciApIHsgdGhpcy5zZXRCbHVlKCB2YWx1ZSApOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGJsdWUgdmFsdWUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdmFsdWUgLSBXaWxsIGJlIGNsYW1wZWQgdG8gYW4gaW50ZWdlciBiZXR3ZWVuIDAgYW5kIDI1NVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRCbHVlKCB2YWx1ZTogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0UkdCQSggdGhpcy5yLCB0aGlzLmcsIHZhbHVlLCB0aGlzLmEgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGFscGhhIHZhbHVlIGFzIGEgZmxvYXRpbmctcG9pbnQgdmFsdWUgYmV0d2VlbiAwIGFuZCAxXHJcbiAgICovXHJcbiAgcHVibGljIGdldEFscGhhKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5hO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBhbHBoYSgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRBbHBoYSgpOyB9XHJcblxyXG4gIHB1YmxpYyBzZXQgYWxwaGEoIHZhbHVlOiBudW1iZXIgKSB7IHRoaXMuc2V0QWxwaGEoIHZhbHVlICk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgYWxwaGEgdmFsdWUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdmFsdWUgLSBXaWxsIGJlIGNsYW1wZWQgYmV0d2VlbiAwIGFuZCAxXHJcbiAgICovXHJcbiAgcHVibGljIHNldEFscGhhKCB2YWx1ZTogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHRoaXMuc2V0UkdCQSggdGhpcy5yLCB0aGlzLmcsIHRoaXMuYiwgdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHZhbHVlIG9mIHRoaXMgQ29sb3IgdXNpbmcgUkdCIGludGVncmFsIGJldHdlZW4gMC0yNTUsIGFscGhhIChmbG9hdCkgYmV0d2VlbiAwLTEuXHJcbiAgICovXHJcbiAgcHVibGljIHNldFJHQkEoIHJlZDogbnVtYmVyLCBncmVlbjogbnVtYmVyLCBibHVlOiBudW1iZXIsIGFscGhhOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICB0aGlzLnIgPSBVdGlscy5yb3VuZFN5bW1ldHJpYyggY2xhbXAoIHJlZCwgMCwgMjU1ICkgKTtcclxuICAgIHRoaXMuZyA9IFV0aWxzLnJvdW5kU3ltbWV0cmljKCBjbGFtcCggZ3JlZW4sIDAsIDI1NSApICk7XHJcbiAgICB0aGlzLmIgPSBVdGlscy5yb3VuZFN5bW1ldHJpYyggY2xhbXAoIGJsdWUsIDAsIDI1NSApICk7XHJcbiAgICB0aGlzLmEgPSBjbGFtcCggYWxwaGEsIDAsIDEgKTtcclxuXHJcbiAgICB0aGlzLnVwZGF0ZUNvbG9yKCk7IC8vIHVwZGF0ZSB0aGUgY2FjaGVkIHZhbHVlXHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBIGxpbmVhciAoZ2FtbWEtY29ycmVjdGVkKSBpbnRlcnBvbGF0aW9uIGJldHdlZW4gdGhpcyBjb2xvciAocmF0aW89MCkgYW5kIGFub3RoZXIgY29sb3IgKHJhdGlvPTEpLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIG90aGVyQ29sb3JcclxuICAgKiBAcGFyYW0gcmF0aW8gLSBOb3QgbmVjZXNzYXJpbHkgY29uc3RyYWluZWQgaW4gWzAsIDFdXHJcbiAgICovXHJcbiAgcHVibGljIGJsZW5kKCBvdGhlckNvbG9yOiBDb2xvciwgcmF0aW86IG51bWJlciApOiBDb2xvciB7XHJcbiAgICBjb25zdCBnYW1tYSA9IDIuNDtcclxuICAgIGNvbnN0IGxpbmVhclJlZEEgPSBNYXRoLnBvdyggdGhpcy5yLCBnYW1tYSApO1xyXG4gICAgY29uc3QgbGluZWFyUmVkQiA9IE1hdGgucG93KCBvdGhlckNvbG9yLnIsIGdhbW1hICk7XHJcbiAgICBjb25zdCBsaW5lYXJHcmVlbkEgPSBNYXRoLnBvdyggdGhpcy5nLCBnYW1tYSApO1xyXG4gICAgY29uc3QgbGluZWFyR3JlZW5CID0gTWF0aC5wb3coIG90aGVyQ29sb3IuZywgZ2FtbWEgKTtcclxuICAgIGNvbnN0IGxpbmVhckJsdWVBID0gTWF0aC5wb3coIHRoaXMuYiwgZ2FtbWEgKTtcclxuICAgIGNvbnN0IGxpbmVhckJsdWVCID0gTWF0aC5wb3coIG90aGVyQ29sb3IuYiwgZ2FtbWEgKTtcclxuXHJcbiAgICBjb25zdCByID0gTWF0aC5wb3coIGxpbmVhclJlZEEgKyAoIGxpbmVhclJlZEIgLSBsaW5lYXJSZWRBICkgKiByYXRpbywgMSAvIGdhbW1hICk7XHJcbiAgICBjb25zdCBnID0gTWF0aC5wb3coIGxpbmVhckdyZWVuQSArICggbGluZWFyR3JlZW5CIC0gbGluZWFyR3JlZW5BICkgKiByYXRpbywgMSAvIGdhbW1hICk7XHJcbiAgICBjb25zdCBiID0gTWF0aC5wb3coIGxpbmVhckJsdWVBICsgKCBsaW5lYXJCbHVlQiAtIGxpbmVhckJsdWVBICkgKiByYXRpbywgMSAvIGdhbW1hICk7XHJcbiAgICBjb25zdCBhID0gdGhpcy5hICsgKCBvdGhlckNvbG9yLmEgLSB0aGlzLmEgKSAqIHJhdGlvO1xyXG5cclxuICAgIHJldHVybiBuZXcgQ29sb3IoIHIsIGcsIGIsIGEgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVzZWQgaW50ZXJuYWxseSB0byBjb21wdXRlIHRoZSBDU1Mgc3RyaW5nIGZvciB0aGlzIGNvbG9yLiBVc2UgdG9DU1MoKVxyXG4gICAqL1xyXG4gIHByaXZhdGUgY29tcHV0ZUNTUygpOiBzdHJpbmcge1xyXG4gICAgaWYgKCB0aGlzLmEgPT09IDEgKSB7XHJcbiAgICAgIHJldHVybiBgcmdiKCR7dGhpcy5yfSwke3RoaXMuZ30sJHt0aGlzLmJ9KWA7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgLy8gU2luY2UgU1ZHIGRvZXNuJ3Qgc3VwcG9ydCBwYXJzaW5nIHNjaWVudGlmaWMgbm90YXRpb24gKGUuZy4gN2U1KSwgd2UgbmVlZCB0byBvdXRwdXQgZml4ZWQgZGVjaW1hbC1wb2ludCBzdHJpbmdzLlxyXG4gICAgICAvLyBTaW5jZSB0aGlzIG5lZWRzIHRvIGJlIGRvbmUgcXVpY2tseSwgYW5kIHdlIGRvbid0IHBhcnRpY3VsYXJseSBjYXJlIGFib3V0IHNsaWdodCByb3VuZGluZyBkaWZmZXJlbmNlcyAoaXQnc1xyXG4gICAgICAvLyBiZWluZyB1c2VkIGZvciBkaXNwbGF5IHB1cnBvc2VzIG9ubHksIGFuZCBpcyBuZXZlciBzaG93biB0byB0aGUgdXNlciksIHdlIHVzZSB0aGUgYnVpbHQtaW4gSlMgdG9GaXhlZCBpbnN0ZWFkIG9mXHJcbiAgICAgIC8vIERvdCdzIHZlcnNpb24gb2YgdG9GaXhlZC4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy81MFxyXG4gICAgICBsZXQgYWxwaGEgPSB0aGlzLmEudG9GaXhlZCggMjAgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBiYWQtc2ltLXRleHRcclxuICAgICAgd2hpbGUgKCBhbHBoYS5sZW5ndGggPj0gMiAmJiBhbHBoYS5lbmRzV2l0aCggJzAnICkgJiYgYWxwaGFbIGFscGhhLmxlbmd0aCAtIDIgXSAhPT0gJy4nICkge1xyXG4gICAgICAgIGFscGhhID0gYWxwaGEuc2xpY2UoIDAsIGFscGhhLmxlbmd0aCAtIDEgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgYWxwaGFTdHJpbmcgPSB0aGlzLmEgPT09IDAgfHwgdGhpcy5hID09PSAxID8gdGhpcy5hIDogYWxwaGE7XHJcbiAgICAgIHJldHVybiBgcmdiYSgke3RoaXMucn0sJHt0aGlzLmd9LCR7dGhpcy5ifSwke2FscGhhU3RyaW5nfSlgO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgdmFsdWUgb2YgdGhpcyBDb2xvciBhcyBhIENTUyBzdHJpbmcuXHJcbiAgICovXHJcbiAgcHVibGljIHRvQ1NTKCk6IHN0cmluZyB7XHJcbiAgICAvLyB2ZXJpZnkgdGhhdCB0aGUgY2FjaGVkIHZhbHVlIGlzIGNvcnJlY3QgKGluIGRlYnVnZ2luZyBidWlsZHMgb25seSwgZGVmZWF0cyB0aGUgcG9pbnQgb2YgY2FjaGluZyBvdGhlcndpc2UpXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9jc3MgPT09IHRoaXMuY29tcHV0ZUNTUygpLCBgQ1NTIGNhY2hlZCB2YWx1ZSBpcyAke3RoaXMuX2Nzc30sIGJ1dCB0aGUgY29tcHV0ZWQgdmFsdWUgYXBwZWFycyB0byBiZSAke3RoaXMuY29tcHV0ZUNTUygpfWAgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5fY3NzITtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhpcyBjb2xvciBmb3IgYSBDU1MgY29sb3Igc3RyaW5nLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRDU1MoIGNzc1N0cmluZzogc3RyaW5nICk6IHRoaXMge1xyXG4gICAgbGV0IHN1Y2Nlc3MgPSBmYWxzZTtcclxuICAgIGNvbnN0IHN0ciA9IENvbG9yLnByZXByb2Nlc3NDU1MoIGNzc1N0cmluZyApO1xyXG5cclxuICAgIC8vIHJ1biB0aHJvdWdoIHRoZSBhdmFpbGFibGUgdGV4dCBmb3JtYXRzXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBDb2xvci5mb3JtYXRQYXJzZXJzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBwYXJzZXIgPSBDb2xvci5mb3JtYXRQYXJzZXJzWyBpIF07XHJcblxyXG4gICAgICBjb25zdCBtYXRjaGVzID0gcGFyc2VyLnJlZ2V4cC5leGVjKCBzdHIgKTtcclxuICAgICAgaWYgKCBtYXRjaGVzICkge1xyXG4gICAgICAgIHBhcnNlci5hcHBseSggdGhpcywgbWF0Y2hlcyApO1xyXG4gICAgICAgIHN1Y2Nlc3MgPSB0cnVlO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCAhc3VjY2VzcyApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCBgQ29sb3IgdW5hYmxlIHRvIHBhcnNlIGNvbG9yIHN0cmluZzogJHtjc3NTdHJpbmd9YCApO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudXBkYXRlQ29sb3IoKTsgLy8gdXBkYXRlIHRoZSBjYWNoZWQgdmFsdWVcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhpcyBjb2xvcidzIFJHQiBpbmZvcm1hdGlvbiBpbiB0aGUgaGV4YWRlY2ltYWwgbnVtYmVyIGVxdWl2YWxlbnQsIGUuZy4gMHhGRjAwRkZcclxuICAgKi9cclxuICBwdWJsaWMgdG9OdW1iZXIoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiAoIHRoaXMuciA8PCAxNiApICsgKCB0aGlzLmcgPDwgOCApICsgdGhpcy5iO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIHRvIHVwZGF0ZSB0aGUgaW50ZXJuYWxseSBjYWNoZWQgQ1NTIHZhbHVlXHJcbiAgICovXHJcbiAgcHJpdmF0ZSB1cGRhdGVDb2xvcigpOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLmltbXV0YWJsZSxcclxuICAgICAgJ0Nhbm5vdCBtb2RpZnkgYW4gaW1tdXRhYmxlIGNvbG9yLiBMaWtlbHkgY2F1c2VkIGJ5IHRyeWluZyB0byBtdXRhdGUgYSBjb2xvciBhZnRlciBpdCB3YXMgdXNlZCBmb3IgYSBub2RlIGZpbGwvc3Ryb2tlJyApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiB0aGlzLnJlZCA9PT0gJ251bWJlcicgJiZcclxuICAgIHR5cGVvZiB0aGlzLmdyZWVuID09PSAnbnVtYmVyJyAmJlxyXG4gICAgdHlwZW9mIHRoaXMuYmx1ZSA9PT0gJ251bWJlcicgJiZcclxuICAgIHR5cGVvZiB0aGlzLmFscGhhID09PSAnbnVtYmVyJyxcclxuICAgICAgYEVuc3VyZSBjb2xvciBjb21wb25lbnRzIGFyZSBudW1lcmljOiAke3RoaXMudG9TdHJpbmcoKX1gICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHRoaXMucmVkICkgJiYgaXNGaW5pdGUoIHRoaXMuZ3JlZW4gKSAmJiBpc0Zpbml0ZSggdGhpcy5ibHVlICkgJiYgaXNGaW5pdGUoIHRoaXMuYWxwaGEgKSxcclxuICAgICAgJ0Vuc3VyZSBjb2xvciBjb21wb25lbnRzIGFyZSBmaW5pdGUgYW5kIG5vdCBOYU4nICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5yZWQgPj0gMCAmJiB0aGlzLnJlZCA8PSAyNTUgJiZcclxuICAgIHRoaXMuZ3JlZW4gPj0gMCAmJiB0aGlzLmdyZWVuIDw9IDI1NSAmJlxyXG4gICAgdGhpcy5yZWQgPj0gMCAmJiB0aGlzLnJlZCA8PSAyNTUgJiZcclxuICAgIHRoaXMuYWxwaGEgPj0gMCAmJiB0aGlzLmFscGhhIDw9IDEsXHJcbiAgICAgIGBFbnN1cmUgY29sb3IgY29tcG9uZW50cyBhcmUgaW4gdGhlIHByb3BlciByYW5nZXM6ICR7dGhpcy50b1N0cmluZygpfWAgKTtcclxuXHJcbiAgICBjb25zdCBvbGRDU1MgPSB0aGlzLl9jc3M7XHJcbiAgICB0aGlzLl9jc3MgPSB0aGlzLmNvbXB1dGVDU1MoKTtcclxuXHJcbiAgICAvLyBub3RpZnkgbGlzdGVuZXJzIGlmIGl0IGNoYW5nZWRcclxuICAgIGlmICggb2xkQ1NTICE9PSB0aGlzLl9jc3MgKSB7XHJcbiAgICAgIHRoaXMuY2hhbmdlRW1pdHRlci5lbWl0KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBbGxvdyBzZXR0aW5nIHRoaXMgQ29sb3IgdG8gYmUgaW1tdXRhYmxlIHdoZW4gYXNzZXJ0aW9ucyBhcmUgZGlzYWJsZWQuIGFueSBjaGFuZ2Ugd2lsbCB0aHJvdyBhbiBlcnJvclxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRJbW11dGFibGUoKTogdGhpcyB7XHJcbiAgICBpZiAoIGFzc2VydCApIHtcclxuICAgICAgdGhpcy5pbW11dGFibGUgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzOyAvLyBhbGxvdyBjaGFpbmluZ1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBvYmplY3QgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIGEgQ2FudmFzIGNvbnRleHQncyBmaWxsU3R5bGUgb3Igc3Ryb2tlU3R5bGUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldENhbnZhc1N0eWxlKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy50b0NTUygpOyAvLyBzaG91bGQgYmUgaW5saW5lZCwgbGVhdmUgbGlrZSB0aGlzIGZvciBmdXR1cmUgbWFpbnRhaW5hYmlsaXR5XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoaXMgY29sb3IgdXNpbmcgSFNMQSB2YWx1ZXMuXHJcbiAgICpcclxuICAgKiBUT0RPOiBtYWtlIGEgZ2V0SHVlLCBnZXRTYXR1cmF0aW9uLCBnZXRMaWdodG5lc3MuIHdlIGNhbiB0aGVuIGV4cG9zZSB0aGVtIHZpYSBFUzUhIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICpcclxuICAgKiBAcGFyYW0gaHVlIC0gaW50ZWdlciBtb2R1bG8gMzYwXHJcbiAgICogQHBhcmFtIHNhdHVyYXRpb24gLSBwZXJjZW50YWdlXHJcbiAgICogQHBhcmFtIGxpZ2h0bmVzcyAtIHBlcmNlbnRhZ2VcclxuICAgKiBAcGFyYW0gYWxwaGFcclxuICAgKi9cclxuICBwdWJsaWMgc2V0SFNMQSggaHVlOiBudW1iZXIsIHNhdHVyYXRpb246IG51bWJlciwgbGlnaHRuZXNzOiBudW1iZXIsIGFscGhhOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICBodWUgPSAoIGh1ZSAlIDM2MCApIC8gMzYwO1xyXG4gICAgc2F0dXJhdGlvbiA9IGNsYW1wKCBzYXR1cmF0aW9uIC8gMTAwLCAwLCAxICk7XHJcbiAgICBsaWdodG5lc3MgPSBjbGFtcCggbGlnaHRuZXNzIC8gMTAwLCAwLCAxICk7XHJcblxyXG4gICAgLy8gc2VlIGh0dHA6Ly93d3cudzMub3JnL1RSL2NzczMtY29sb3IvXHJcbiAgICBsZXQgbTI7XHJcbiAgICBpZiAoIGxpZ2h0bmVzcyA8IDAuNSApIHtcclxuICAgICAgbTIgPSBsaWdodG5lc3MgKiAoIHNhdHVyYXRpb24gKyAxICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgbTIgPSBsaWdodG5lc3MgKyBzYXR1cmF0aW9uIC0gbGlnaHRuZXNzICogc2F0dXJhdGlvbjtcclxuICAgIH1cclxuICAgIGNvbnN0IG0xID0gbGlnaHRuZXNzICogMiAtIG0yO1xyXG5cclxuICAgIHRoaXMuciA9IFV0aWxzLnJvdW5kU3ltbWV0cmljKCBDb2xvci5odWVUb1JHQiggbTEsIG0yLCBodWUgKyAxIC8gMyApICogMjU1ICk7XHJcbiAgICB0aGlzLmcgPSBVdGlscy5yb3VuZFN5bW1ldHJpYyggQ29sb3IuaHVlVG9SR0IoIG0xLCBtMiwgaHVlICkgKiAyNTUgKTtcclxuICAgIHRoaXMuYiA9IFV0aWxzLnJvdW5kU3ltbWV0cmljKCBDb2xvci5odWVUb1JHQiggbTEsIG0yLCBodWUgLSAxIC8gMyApICogMjU1ICk7XHJcbiAgICB0aGlzLmEgPSBjbGFtcCggYWxwaGEsIDAsIDEgKTtcclxuXHJcbiAgICB0aGlzLnVwZGF0ZUNvbG9yKCk7IC8vIHVwZGF0ZSB0aGUgY2FjaGVkIHZhbHVlXHJcblxyXG4gICAgcmV0dXJuIHRoaXM7IC8vIGFsbG93IGNoYWluaW5nXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZXF1YWxzKCBjb2xvcjogQ29sb3IgKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5yID09PSBjb2xvci5yICYmIHRoaXMuZyA9PT0gY29sb3IuZyAmJiB0aGlzLmIgPT09IGNvbG9yLmIgJiYgdGhpcy5hID09PSBjb2xvci5hO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIGNvcHkgb2YgdGhpcyBjb2xvciB3aXRoIGEgZGlmZmVyZW50IGFscGhhIHZhbHVlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB3aXRoQWxwaGEoIGFscGhhOiBudW1iZXIgKTogQ29sb3Ige1xyXG4gICAgcmV0dXJuIG5ldyBDb2xvciggdGhpcy5yLCB0aGlzLmcsIHRoaXMuYiwgYWxwaGEgKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgY2hlY2tGYWN0b3IoIGZhY3Rvcj86IG51bWJlciApOiBudW1iZXIge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggZmFjdG9yID09PSB1bmRlZmluZWQgfHwgKCBmYWN0b3IgPj0gMCAmJiBmYWN0b3IgPD0gMSApLCBgZmFjdG9yIG11c3QgYmUgYmV0d2VlbiAwIGFuZCAxOiAke2ZhY3Rvcn1gICk7XHJcblxyXG4gICAgcmV0dXJuICggZmFjdG9yID09PSB1bmRlZmluZWQgKSA/IDAuNyA6IGZhY3RvcjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1hdGNoZXMgSmF2YSdzIENvbG9yLmJyaWdodGVyKClcclxuICAgKi9cclxuICBwdWJsaWMgYnJpZ2h0ZXJDb2xvciggZmFjdG9yPzogbnVtYmVyICk6IENvbG9yIHtcclxuICAgIGZhY3RvciA9IHRoaXMuY2hlY2tGYWN0b3IoIGZhY3RvciApO1xyXG4gICAgY29uc3QgcmVkID0gTWF0aC5taW4oIDI1NSwgTWF0aC5mbG9vciggdGhpcy5yIC8gZmFjdG9yICkgKTtcclxuICAgIGNvbnN0IGdyZWVuID0gTWF0aC5taW4oIDI1NSwgTWF0aC5mbG9vciggdGhpcy5nIC8gZmFjdG9yICkgKTtcclxuICAgIGNvbnN0IGJsdWUgPSBNYXRoLm1pbiggMjU1LCBNYXRoLmZsb29yKCB0aGlzLmIgLyBmYWN0b3IgKSApO1xyXG4gICAgcmV0dXJuIG5ldyBDb2xvciggcmVkLCBncmVlbiwgYmx1ZSwgdGhpcy5hICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBCcmlnaHRlbnMgYSBjb2xvciBpbiBSR0Igc3BhY2UuIFVzZWZ1bCB3aGVuIGNyZWF0aW5nIGdyYWRpZW50cyBmcm9tIGEgc2luZ2xlIGJhc2UgY29sb3IuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gW2ZhY3Rvcl0gLSAwIChubyBjaGFuZ2UpIHRvIDEgKHdoaXRlKVxyXG4gICAqIEByZXR1cm5zIC0gKGNsb3NlciB0byB3aGl0ZSkgdmVyc2lvbiBvZiB0aGUgb3JpZ2luYWwgY29sb3IuXHJcbiAgICovXHJcbiAgcHVibGljIGNvbG9yVXRpbHNCcmlnaHRlciggZmFjdG9yPzogbnVtYmVyICk6IENvbG9yIHtcclxuICAgIGZhY3RvciA9IHRoaXMuY2hlY2tGYWN0b3IoIGZhY3RvciApO1xyXG4gICAgY29uc3QgcmVkID0gTWF0aC5taW4oIDI1NSwgdGhpcy5nZXRSZWQoKSArIE1hdGguZmxvb3IoIGZhY3RvciAqICggMjU1IC0gdGhpcy5nZXRSZWQoKSApICkgKTtcclxuICAgIGNvbnN0IGdyZWVuID0gTWF0aC5taW4oIDI1NSwgdGhpcy5nZXRHcmVlbigpICsgTWF0aC5mbG9vciggZmFjdG9yICogKCAyNTUgLSB0aGlzLmdldEdyZWVuKCkgKSApICk7XHJcbiAgICBjb25zdCBibHVlID0gTWF0aC5taW4oIDI1NSwgdGhpcy5nZXRCbHVlKCkgKyBNYXRoLmZsb29yKCBmYWN0b3IgKiAoIDI1NSAtIHRoaXMuZ2V0Qmx1ZSgpICkgKSApO1xyXG4gICAgcmV0dXJuIG5ldyBDb2xvciggcmVkLCBncmVlbiwgYmx1ZSwgdGhpcy5nZXRBbHBoYSgpICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNYXRjaGVzIEphdmEncyBDb2xvci5kYXJrZXIoKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBkYXJrZXJDb2xvciggZmFjdG9yPzogbnVtYmVyICk6IENvbG9yIHtcclxuICAgIGZhY3RvciA9IHRoaXMuY2hlY2tGYWN0b3IoIGZhY3RvciApO1xyXG4gICAgY29uc3QgcmVkID0gTWF0aC5tYXgoIDAsIE1hdGguZmxvb3IoIGZhY3RvciAqIHRoaXMuciApICk7XHJcbiAgICBjb25zdCBncmVlbiA9IE1hdGgubWF4KCAwLCBNYXRoLmZsb29yKCBmYWN0b3IgKiB0aGlzLmcgKSApO1xyXG4gICAgY29uc3QgYmx1ZSA9IE1hdGgubWF4KCAwLCBNYXRoLmZsb29yKCBmYWN0b3IgKiB0aGlzLmIgKSApO1xyXG4gICAgcmV0dXJuIG5ldyBDb2xvciggcmVkLCBncmVlbiwgYmx1ZSwgdGhpcy5hICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEYXJrZW4gYSBjb2xvciBpbiBSR0Igc3BhY2UuIFVzZWZ1bCB3aGVuIGNyZWF0aW5nIGdyYWRpZW50cyBmcm9tIGEgc2luZ2xlXHJcbiAgICogYmFzZSBjb2xvci5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBbZmFjdG9yXSAtIDAgKG5vIGNoYW5nZSkgdG8gMSAoYmxhY2spXHJcbiAgICogQHJldHVybnMgLSBkYXJrZXIgKGNsb3NlciB0byBibGFjaykgdmVyc2lvbiBvZiB0aGUgb3JpZ2luYWwgY29sb3IuXHJcbiAgICovXHJcbiAgcHVibGljIGNvbG9yVXRpbHNEYXJrZXIoIGZhY3Rvcj86IG51bWJlciApOiBDb2xvciB7XHJcbiAgICBmYWN0b3IgPSB0aGlzLmNoZWNrRmFjdG9yKCBmYWN0b3IgKTtcclxuICAgIGNvbnN0IHJlZCA9IE1hdGgubWF4KCAwLCB0aGlzLmdldFJlZCgpIC0gTWF0aC5mbG9vciggZmFjdG9yICogdGhpcy5nZXRSZWQoKSApICk7XHJcbiAgICBjb25zdCBncmVlbiA9IE1hdGgubWF4KCAwLCB0aGlzLmdldEdyZWVuKCkgLSBNYXRoLmZsb29yKCBmYWN0b3IgKiB0aGlzLmdldEdyZWVuKCkgKSApO1xyXG4gICAgY29uc3QgYmx1ZSA9IE1hdGgubWF4KCAwLCB0aGlzLmdldEJsdWUoKSAtIE1hdGguZmxvb3IoIGZhY3RvciAqIHRoaXMuZ2V0Qmx1ZSgpICkgKTtcclxuICAgIHJldHVybiBuZXcgQ29sb3IoIHJlZCwgZ3JlZW4sIGJsdWUsIHRoaXMuZ2V0QWxwaGEoKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTGlrZSBjb2xvclV0aWxzQnJpZ2h0ZXIvRGFya2VyLCBob3dldmVyIGZhY3RvciBzaG91bGQgYmUgaW4gdGhlIHJhbmdlIC0xIHRvIDEsIGFuZCBpdCB3aWxsIGNhbGw6XHJcbiAgICogICBjb2xvclV0aWxzQnJpZ2h0ZXIoIGZhY3RvciApICAgZm9yIGZhY3RvciA+ICAwXHJcbiAgICogICB0aGlzICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIGZhY3RvciA9PSAwXHJcbiAgICogICBjb2xvclV0aWxzRGFya2VyKCAtZmFjdG9yICkgICAgZm9yIGZhY3RvciA8ICAwXHJcbiAgICpcclxuICAgKiBAcGFyYW0gZmFjdG9yIGZyb20gLTEgKGJsYWNrKSwgdG8gMCAobm8gY2hhbmdlKSwgdG8gMSAod2hpdGUpXHJcbiAgICovXHJcbiAgcHVibGljIGNvbG9yVXRpbHNCcmlnaHRuZXNzKCBmYWN0b3I6IG51bWJlciApOiBDb2xvciB7XHJcbiAgICBpZiAoIGZhY3RvciA9PT0gMCApIHtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggZmFjdG9yID4gMCApIHtcclxuICAgICAgcmV0dXJuIHRoaXMuY29sb3JVdGlsc0JyaWdodGVyKCBmYWN0b3IgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gdGhpcy5jb2xvclV0aWxzRGFya2VyKCAtZmFjdG9yICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIGZvcm0gb2YgdGhpcyBvYmplY3RcclxuICAgKi9cclxuICBwdWJsaWMgdG9TdHJpbmcoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9W3I6JHt0aGlzLnJ9IGc6JHt0aGlzLmd9IGI6JHt0aGlzLmJ9IGE6JHt0aGlzLmF9XWA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb252ZXJ0IHRvIGEgaGV4IHN0cmluZywgdGhhdCBzdGFydHMgd2l0aCBcIiNcIi5cclxuICAgKi9cclxuICBwdWJsaWMgdG9IZXhTdHJpbmcoKTogc3RyaW5nIHtcclxuICAgIGxldCBoZXhTdHJpbmcgPSB0aGlzLnRvTnVtYmVyKCkudG9TdHJpbmcoIDE2ICk7XHJcbiAgICB3aGlsZSAoIGhleFN0cmluZy5sZW5ndGggPCA2ICkge1xyXG4gICAgICBoZXhTdHJpbmcgPSBgMCR7aGV4U3RyaW5nfWA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYCMke2hleFN0cmluZ31gO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHRvU3RhdGVPYmplY3QoKTogeyByOiBudW1iZXI7IGc6IG51bWJlcjsgYjogbnVtYmVyOyBhOiBudW1iZXIgfSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICByOiB0aGlzLnIsXHJcbiAgICAgIGc6IHRoaXMuZyxcclxuICAgICAgYjogdGhpcy5iLFxyXG4gICAgICBhOiB0aGlzLmFcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVdGlsaXR5IGZ1bmN0aW9uLCBzZWUgaHR0cDovL3d3dy53My5vcmcvVFIvY3NzMy1jb2xvci9cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGh1ZVRvUkdCKCBtMTogbnVtYmVyLCBtMjogbnVtYmVyLCBoOiBudW1iZXIgKTogbnVtYmVyIHtcclxuICAgIGlmICggaCA8IDAgKSB7XHJcbiAgICAgIGggPSBoICsgMTtcclxuICAgIH1cclxuICAgIGlmICggaCA+IDEgKSB7XHJcbiAgICAgIGggPSBoIC0gMTtcclxuICAgIH1cclxuICAgIGlmICggaCAqIDYgPCAxICkge1xyXG4gICAgICByZXR1cm4gbTEgKyAoIG0yIC0gbTEgKSAqIGggKiA2O1xyXG4gICAgfVxyXG4gICAgaWYgKCBoICogMiA8IDEgKSB7XHJcbiAgICAgIHJldHVybiBtMjtcclxuICAgIH1cclxuICAgIGlmICggaCAqIDMgPCAyICkge1xyXG4gICAgICByZXR1cm4gbTEgKyAoIG0yIC0gbTEgKSAqICggMiAvIDMgLSBoICkgKiA2O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG0xO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29udmVuaWVuY2UgZnVuY3Rpb24gdGhhdCBjb252ZXJ0cyBhIGNvbG9yIHNwZWMgdG8gYSBjb2xvciBvYmplY3QgaWYgbmVjZXNzYXJ5LCBvciBzaW1wbHkgcmV0dXJucyB0aGUgY29sb3Igb2JqZWN0XHJcbiAgICogaWYgbm90LlxyXG4gICAqXHJcbiAgICogUGxlYXNlIG5vdGUgdGhlcmUgaXMgbm8gZGVmZW5zaXZlIGNvcHkgd2hlbiBhIGNvbG9yIGlzIHBhc3NlZCBpbiB1bmxpa2UgUGFpbnREZWYuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyB0b0NvbG9yKCBjb2xvclNwZWM6IFRDb2xvciApOiBDb2xvciB7XHJcbiAgICBpZiAoIGNvbG9yU3BlYyA9PT0gbnVsbCApIHtcclxuICAgICAgcmV0dXJuIENvbG9yLlRSQU5TUEFSRU5UO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGNvbG9yU3BlYyBpbnN0YW5jZW9mIENvbG9yICkge1xyXG4gICAgICByZXR1cm4gY29sb3JTcGVjO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHR5cGVvZiBjb2xvclNwZWMgPT09ICdzdHJpbmcnICkge1xyXG4gICAgICByZXR1cm4gbmV3IENvbG9yKCBjb2xvclNwZWMgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gQ29sb3IudG9Db2xvciggY29sb3JTcGVjLnZhbHVlICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbnRlcnBvbGF0ZXMgYmV0d2VlbiAyIGNvbG9ycyBpbiBSR0JBIHNwYWNlLiBXaGVuIGRpc3RhbmNlIGlzIDAsIGNvbG9yMSBpcyByZXR1cm5lZC4gV2hlbiBkaXN0YW5jZSBpcyAxLCBjb2xvcjIgaXNcclxuICAgKiByZXR1cm5lZC4gT3RoZXIgdmFsdWVzIG9mIGRpc3RhbmNlIHJldHVybiBhIGNvbG9yIHNvbWV3aGVyZSBiZXR3ZWVuIGNvbG9yMSBhbmQgY29sb3IyLiBFYWNoIGNvbG9yIGNvbXBvbmVudCBpc1xyXG4gICAqIGludGVycG9sYXRlZCBzZXBhcmF0ZWx5LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNvbG9yMVxyXG4gICAqIEBwYXJhbSBjb2xvcjJcclxuICAgKiBAcGFyYW0gZGlzdGFuY2UgZGlzdGFuY2UgYmV0d2VlbiBjb2xvcjEgYW5kIGNvbG9yMiwgMCA8PSBkaXN0YW5jZSA8PSAxXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBpbnRlcnBvbGF0ZVJHQkEoIGNvbG9yMTogQ29sb3IsIGNvbG9yMjogQ29sb3IsIGRpc3RhbmNlOiBudW1iZXIgKTogQ29sb3Ige1xyXG4gICAgaWYgKCBkaXN0YW5jZSA8IDAgfHwgZGlzdGFuY2UgPiAxICkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoIGBkaXN0YW5jZSBtdXN0IGJlIGJldHdlZW4gMCBhbmQgMTogJHtkaXN0YW5jZX1gICk7XHJcbiAgICB9XHJcbiAgICBjb25zdCByID0gTWF0aC5mbG9vciggbGluZWFyKCAwLCAxLCBjb2xvcjEuciwgY29sb3IyLnIsIGRpc3RhbmNlICkgKTtcclxuICAgIGNvbnN0IGcgPSBNYXRoLmZsb29yKCBsaW5lYXIoIDAsIDEsIGNvbG9yMS5nLCBjb2xvcjIuZywgZGlzdGFuY2UgKSApO1xyXG4gICAgY29uc3QgYiA9IE1hdGguZmxvb3IoIGxpbmVhciggMCwgMSwgY29sb3IxLmIsIGNvbG9yMi5iLCBkaXN0YW5jZSApICk7XHJcbiAgICBjb25zdCBhID0gbGluZWFyKCAwLCAxLCBjb2xvcjEuYSwgY29sb3IyLmEsIGRpc3RhbmNlICk7XHJcbiAgICByZXR1cm4gbmV3IENvbG9yKCByLCBnLCBiLCBhICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgYmxlbmRlZCBjb2xvciBhcyBhIG1peCBiZXR3ZWVuIHRoZSBnaXZlbiBjb2xvcnMuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBzdXBlcnNhbXBsZUJsZW5kKCBjb2xvcnM6IENvbG9yW10gKTogQ29sb3Ige1xyXG4gICAgLy8gaGFyZC1jb2RlZCBnYW1tYSAoYXNzdW1pbmcgdGhlIGV4cG9uZW50aWFsIHBhcnQgb2YgdGhlIHNSR0IgY3VydmUgYXMgYSBzaW1wbGlmaWNhdGlvbilcclxuICAgIGNvbnN0IEdBTU1BID0gMi4yO1xyXG5cclxuICAgIC8vIG1hcHMgdG8gWzAsMV0gbGluZWFyIGNvbG9yc3BhY2VcclxuICAgIGNvbnN0IHJlZHMgPSBjb2xvcnMubWFwKCBjb2xvciA9PiBNYXRoLnBvdyggY29sb3IuciAvIDI1NSwgR0FNTUEgKSApO1xyXG4gICAgY29uc3QgZ3JlZW5zID0gY29sb3JzLm1hcCggY29sb3IgPT4gTWF0aC5wb3coIGNvbG9yLmcgLyAyNTUsIEdBTU1BICkgKTtcclxuICAgIGNvbnN0IGJsdWVzID0gY29sb3JzLm1hcCggY29sb3IgPT4gTWF0aC5wb3coIGNvbG9yLmIgLyAyNTUsIEdBTU1BICkgKTtcclxuICAgIGNvbnN0IGFscGhhcyA9IGNvbG9ycy5tYXAoIGNvbG9yID0+IE1hdGgucG93KCBjb2xvci5hLCBHQU1NQSApICk7XHJcblxyXG4gICAgY29uc3QgYWxwaGFTdW0gPSBfLnN1bSggYWxwaGFzICk7XHJcblxyXG4gICAgaWYgKCBhbHBoYVN1bSA9PT0gMCApIHtcclxuICAgICAgcmV0dXJuIG5ldyBDb2xvciggMCwgMCwgMCwgMCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGJsZW5kaW5nIG9mIHBpeGVscywgd2VpZ2h0ZWQgYnkgYWxwaGFzXHJcbiAgICBjb25zdCByZWQgPSBfLnN1bSggXy5yYW5nZSggMCwgY29sb3JzLmxlbmd0aCApLm1hcCggaSA9PiByZWRzWyBpIF0gKiBhbHBoYXNbIGkgXSApICkgLyBhbHBoYVN1bTtcclxuICAgIGNvbnN0IGdyZWVuID0gXy5zdW0oIF8ucmFuZ2UoIDAsIGNvbG9ycy5sZW5ndGggKS5tYXAoIGkgPT4gZ3JlZW5zWyBpIF0gKiBhbHBoYXNbIGkgXSApICkgLyBhbHBoYVN1bTtcclxuICAgIGNvbnN0IGJsdWUgPSBfLnN1bSggXy5yYW5nZSggMCwgY29sb3JzLmxlbmd0aCApLm1hcCggaSA9PiBibHVlc1sgaSBdICogYWxwaGFzWyBpIF0gKSApIC8gYWxwaGFTdW07XHJcbiAgICBjb25zdCBhbHBoYSA9IGFscGhhU3VtIC8gY29sb3JzLmxlbmd0aDsgLy8gYXZlcmFnZSBvZiBhbHBoYXNcclxuXHJcbiAgICByZXR1cm4gbmV3IENvbG9yKFxyXG4gICAgICBNYXRoLmZsb29yKCBNYXRoLnBvdyggcmVkLCAxIC8gR0FNTUEgKSAqIDI1NSApLFxyXG4gICAgICBNYXRoLmZsb29yKCBNYXRoLnBvdyggZ3JlZW4sIDEgLyBHQU1NQSApICogMjU1ICksXHJcbiAgICAgIE1hdGguZmxvb3IoIE1hdGgucG93KCBibHVlLCAxIC8gR0FNTUEgKSAqIDI1NSApLFxyXG4gICAgICBNYXRoLnBvdyggYWxwaGEsIDEgLyBHQU1NQSApXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyBmcm9tU3RhdGVPYmplY3QoIHN0YXRlT2JqZWN0OiB7IHI6IG51bWJlcjsgZzogbnVtYmVyOyBiOiBudW1iZXI7IGE6IG51bWJlciB9ICk6IENvbG9yIHtcclxuICAgIHJldHVybiBuZXcgQ29sb3IoIHN0YXRlT2JqZWN0LnIsIHN0YXRlT2JqZWN0LmcsIHN0YXRlT2JqZWN0LmIsIHN0YXRlT2JqZWN0LmEgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgaHNsYSggaHVlOiBudW1iZXIsIHNhdHVyYXRpb246IG51bWJlciwgbGlnaHRuZXNzOiBudW1iZXIsIGFscGhhOiBudW1iZXIgKTogQ29sb3Ige1xyXG4gICAgcmV0dXJuIG5ldyBDb2xvciggMCwgMCwgMCwgMSApLnNldEhTTEEoIGh1ZSwgc2F0dXJhdGlvbiwgbGlnaHRuZXNzLCBhbHBoYSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyBjaGVja1BhaW50U3RyaW5nKCBjc3NTdHJpbmc6IHN0cmluZyApOiB2b2lkIHtcclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHNjcmF0Y2hDb2xvci5zZXRDU1MoIGNzc1N0cmluZyApO1xyXG4gICAgICB9XHJcbiAgICAgIGNhdGNoKCBlICkge1xyXG4gICAgICAgIGFzc2VydCggZmFsc2UsIGBUaGUgQ1NTIHN0cmluZyBpcyBhbiBpbnZhbGlkIGNvbG9yOiAke2Nzc1N0cmluZ31gICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgUGFpbnQgb2YgdGhlIHR5cGUgdGhhdCBQYWludGFibGUgYWNjZXB0cyBhcyBmaWxscyBvciBzdHJva2VzXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBjaGVja1BhaW50KCBwYWludDogVFBhaW50ICk6IHZvaWQge1xyXG4gICAgaWYgKCB0eXBlb2YgcGFpbnQgPT09ICdzdHJpbmcnICkge1xyXG4gICAgICBDb2xvci5jaGVja1BhaW50U3RyaW5nKCBwYWludCApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoICggaXNUUmVhZE9ubHlQcm9wZXJ0eSggcGFpbnQgKSApICYmICggdHlwZW9mIHBhaW50LnZhbHVlID09PSAnc3RyaW5nJyApICkge1xyXG4gICAgICBDb2xvci5jaGVja1BhaW50U3RyaW5nKCBwYWludC52YWx1ZSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgbHVtaW5hbmNlIG9mIGEgY29sb3IsIHBlciBJVFUtUiByZWNvbW1lbmRhdGlvbiBCVC43MDksIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1JlYy5fNzA5LlxyXG4gICAqIEdyZWVuIGNvbnRyaWJ1dGVzIHRoZSBtb3N0IHRvIHRoZSBpbnRlbnNpdHkgcGVyY2VpdmVkIGJ5IGh1bWFucywgYW5kIGJsdWUgdGhlIGxlYXN0LlxyXG4gICAqIFRoaXMgYWxnb3JpdGhtIHdvcmtzIGNvcnJlY3RseSB3aXRoIGEgZ3JheXNjYWxlIGNvbG9yIGJlY2F1c2UgdGhlIFJHQiBjb2VmZmljaWVudHMgc3VtIHRvIDEuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyAtIGEgdmFsdWUgaW4gdGhlIHJhbmdlIFswLDI1NV1cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGdldEx1bWluYW5jZSggY29sb3I6IENvbG9yIHwgc3RyaW5nICk6IG51bWJlciB7XHJcbiAgICBjb25zdCBzY2VuZXJ5Q29sb3IgPSBDb2xvci50b0NvbG9yKCBjb2xvciApO1xyXG4gICAgY29uc3QgbHVtaW5hbmNlID0gKCBzY2VuZXJ5Q29sb3IucmVkICogMC4yMTI2ICsgc2NlbmVyeUNvbG9yLmdyZWVuICogMC43MTUyICsgc2NlbmVyeUNvbG9yLmJsdWUgKiAwLjA3MjIgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGx1bWluYW5jZSA+PSAwICYmIGx1bWluYW5jZSA8PSAyNTUsIGB1bmV4cGVjdGVkIGx1bWluYW5jZTogJHtsdW1pbmFuY2V9YCApO1xyXG4gICAgcmV0dXJuIGx1bWluYW5jZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnZlcnRzIGEgY29sb3IgdG8gZ3JheXNjYWxlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgdG9HcmF5c2NhbGUoIGNvbG9yOiBDb2xvciB8IHN0cmluZyApOiBDb2xvciB7XHJcbiAgICBjb25zdCBsdW1pbmFuY2UgPSBDb2xvci5nZXRMdW1pbmFuY2UoIGNvbG9yICk7XHJcbiAgICByZXR1cm4gbmV3IENvbG9yKCBsdW1pbmFuY2UsIGx1bWluYW5jZSwgbHVtaW5hbmNlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgYSBjb2xvciBpcyAnZGFyaycuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY29sb3IgLSBjb2xvcnMgd2l0aCBsdW1pbmFuY2UgPCB0aGlzIHZhbHVlIGFyZSBkYXJrLCByYW5nZSBbMCwyNTVdLCBkZWZhdWx0IDE4NlxyXG4gICAqIEBwYXJhbSBsdW1pbmFuY2VUaHJlc2hvbGQgLSBjb2xvcnMgd2l0aCBsdW1pbmFuY2UgPCB0aGlzIHZhbHVlIGFyZSBkYXJrLCByYW5nZSBbMCwyNTVdLCBkZWZhdWx0IDE4NlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgaXNEYXJrQ29sb3IoIGNvbG9yOiBDb2xvciB8IHN0cmluZywgbHVtaW5hbmNlVGhyZXNob2xkID0gMTg2ICk6IGJvb2xlYW4ge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbHVtaW5hbmNlVGhyZXNob2xkID49IDAgJiYgbHVtaW5hbmNlVGhyZXNob2xkIDw9IDI1NSxcclxuICAgICAgJ2ludmFsaWQgbHVtaW5hbmNlVGhyZXNob2xkJyApO1xyXG4gICAgcmV0dXJuICggQ29sb3IuZ2V0THVtaW5hbmNlKCBjb2xvciApIDwgbHVtaW5hbmNlVGhyZXNob2xkICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgYSBjb2xvciBpcyAnbGlnaHQnLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGNvbG9yXHJcbiAgICogQHBhcmFtIFtsdW1pbmFuY2VUaHJlc2hvbGRdIC0gY29sb3JzIHdpdGggbHVtaW5hbmNlID49IHRoaXMgdmFsdWUgYXJlIGxpZ2h0LCByYW5nZSBbMCwyNTVdLCBkZWZhdWx0IDE4NlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgaXNMaWdodENvbG9yKCBjb2xvcjogQ29sb3IgfCBzdHJpbmcsIGx1bWluYW5jZVRocmVzaG9sZD86IG51bWJlciApOiBib29sZWFuIHtcclxuICAgIHJldHVybiAhQ29sb3IuaXNEYXJrQ29sb3IoIGNvbG9yLCBsdW1pbmFuY2VUaHJlc2hvbGQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBDb2xvciB0aGF0IGlzIGEgc2hhZGUgb2YgZ3JheS5cclxuICAgKiBAcGFyYW0gcmdiIC0gdXNlZCBmb3IgcmVkLCBibHVlLCBhbmQgZ3JlZW4gY29tcG9uZW50c1xyXG4gICAqIEBwYXJhbSBbYV0gLSBkZWZhdWx0cyB0byAxXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBncmF5Q29sb3IoIHJnYjogbnVtYmVyLCBhPzogbnVtYmVyICk6IENvbG9yIHtcclxuICAgIHJldHVybiBuZXcgQ29sb3IoIHJnYiwgcmdiLCByZ2IsIGEgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnZlcnRzIGEgQ1NTIGNvbG9yIHN0cmluZyBpbnRvIGEgc3RhbmRhcmQgZm9ybWF0LCBsb3dlci1jYXNpbmcgYW5kIGtleXdvcmQtbWF0Y2hpbmcgaXQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBzdGF0aWMgcHJlcHJvY2Vzc0NTUyggY3NzU3RyaW5nOiBzdHJpbmcgKTogc3RyaW5nIHtcclxuICAgIGxldCBzdHIgPSBjc3NTdHJpbmcucmVwbGFjZSggLyAvZywgJycgKS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgIC8vIHJlcGxhY2UgY29sb3JzIGJhc2VkIG9uIGtleXdvcmRzXHJcbiAgICBjb25zdCBrZXl3b3JkTWF0Y2ggPSBDb2xvci5jb2xvcktleXdvcmRzWyBzdHIgXTtcclxuICAgIGlmICgga2V5d29yZE1hdGNoICkge1xyXG4gICAgICBzdHIgPSBgIyR7a2V5d29yZE1hdGNofWA7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHN0cjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZXRoZXIgdGhlIHNwZWNpZmllZCBDU1Mgc3RyaW5nIGlzIGEgdmFsaWQgQ1NTIGNvbG9yIHN0cmluZ1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgaXNDU1NDb2xvclN0cmluZyggY3NzU3RyaW5nOiBzdHJpbmcgKTogYm9vbGVhbiB7XHJcbiAgICBjb25zdCBzdHIgPSBDb2xvci5wcmVwcm9jZXNzQ1NTKCBjc3NTdHJpbmcgKTtcclxuXHJcbiAgICAvLyBydW4gdGhyb3VnaCB0aGUgYXZhaWxhYmxlIHRleHQgZm9ybWF0c1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgQ29sb3IuZm9ybWF0UGFyc2Vycy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgcGFyc2VyID0gQ29sb3IuZm9ybWF0UGFyc2Vyc1sgaSBdO1xyXG5cclxuICAgICAgY29uc3QgbWF0Y2hlcyA9IHBhcnNlci5yZWdleHAuZXhlYyggc3RyICk7XHJcbiAgICAgIGlmICggbWF0Y2hlcyApIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgZm9ybWF0UGFyc2VyczogRm9ybWF0UGFyc2VyW10gPSBbXHJcbiAgICB7XHJcbiAgICAgIC8vICd0cmFuc3BhcmVudCdcclxuICAgICAgcmVnZXhwOiAvXnRyYW5zcGFyZW50JC8sXHJcbiAgICAgIGFwcGx5OiAoIGNvbG9yOiBDb2xvciwgbWF0Y2hlczogUmVnRXhwRXhlY0FycmF5ICk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGNvbG9yLnNldFJHQkEoIDAsIDAsIDAsIDAgKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgLy8gc2hvcnQgaGV4IGZvcm0sIGEgbGEgJyNmZmYnXHJcbiAgICAgIHJlZ2V4cDogL14jKFxcd3sxfSkoXFx3ezF9KShcXHd7MX0pJC8sXHJcbiAgICAgIGFwcGx5OiAoIGNvbG9yOiBDb2xvciwgbWF0Y2hlczogUmVnRXhwRXhlY0FycmF5ICk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGNvbG9yLnNldFJHQkEoXHJcbiAgICAgICAgICBwYXJzZUludCggbWF0Y2hlc1sgMSBdICsgbWF0Y2hlc1sgMSBdLCAxNiApLFxyXG4gICAgICAgICAgcGFyc2VJbnQoIG1hdGNoZXNbIDIgXSArIG1hdGNoZXNbIDIgXSwgMTYgKSxcclxuICAgICAgICAgIHBhcnNlSW50KCBtYXRjaGVzWyAzIF0gKyBtYXRjaGVzWyAzIF0sIDE2ICksXHJcbiAgICAgICAgICAxICk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIC8vIGxvbmcgaGV4IGZvcm0sIGEgbGEgJyNmZmZmZmYnXHJcbiAgICAgIHJlZ2V4cDogL14jKFxcd3syfSkoXFx3ezJ9KShcXHd7Mn0pJC8sXHJcbiAgICAgIGFwcGx5OiAoIGNvbG9yOiBDb2xvciwgbWF0Y2hlczogUmVnRXhwRXhlY0FycmF5ICk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGNvbG9yLnNldFJHQkEoXHJcbiAgICAgICAgICBwYXJzZUludCggbWF0Y2hlc1sgMSBdLCAxNiApLFxyXG4gICAgICAgICAgcGFyc2VJbnQoIG1hdGNoZXNbIDIgXSwgMTYgKSxcclxuICAgICAgICAgIHBhcnNlSW50KCBtYXRjaGVzWyAzIF0sIDE2ICksXHJcbiAgICAgICAgICAxICk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIC8vIHJnYiguLi4pXHJcbiAgICAgIHJlZ2V4cDogbmV3IFJlZ0V4cCggYF5yZ2JcXFxcKCR7cmdiTnVtYmVyfSwke3JnYk51bWJlcn0sJHtyZ2JOdW1iZXJ9XFxcXCkkYCApLFxyXG4gICAgICBhcHBseTogKCBjb2xvcjogQ29sb3IsIG1hdGNoZXM6IFJlZ0V4cEV4ZWNBcnJheSApOiB2b2lkID0+IHtcclxuICAgICAgICBjb2xvci5zZXRSR0JBKFxyXG4gICAgICAgICAgcGFyc2VSR0JOdW1iZXIoIG1hdGNoZXNbIDEgXSApLFxyXG4gICAgICAgICAgcGFyc2VSR0JOdW1iZXIoIG1hdGNoZXNbIDIgXSApLFxyXG4gICAgICAgICAgcGFyc2VSR0JOdW1iZXIoIG1hdGNoZXNbIDMgXSApLFxyXG4gICAgICAgICAgMSApO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAvLyByZ2JhKC4uLilcclxuICAgICAgcmVnZXhwOiBuZXcgUmVnRXhwKCBgXnJnYmFcXFxcKCR7cmdiTnVtYmVyfSwke3JnYk51bWJlcn0sJHtyZ2JOdW1iZXJ9LCR7YU51bWJlcn1cXFxcKSRgICksXHJcbiAgICAgIGFwcGx5OiAoIGNvbG9yOiBDb2xvciwgbWF0Y2hlczogUmVnRXhwRXhlY0FycmF5ICk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGNvbG9yLnNldFJHQkEoXHJcbiAgICAgICAgICBwYXJzZVJHQk51bWJlciggbWF0Y2hlc1sgMSBdICksXHJcbiAgICAgICAgICBwYXJzZVJHQk51bWJlciggbWF0Y2hlc1sgMiBdICksXHJcbiAgICAgICAgICBwYXJzZVJHQk51bWJlciggbWF0Y2hlc1sgMyBdICksXHJcbiAgICAgICAgICBOdW1iZXIoIG1hdGNoZXNbIDQgXSApICk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIC8vIGhzbCguLi4pXHJcbiAgICAgIHJlZ2V4cDogbmV3IFJlZ0V4cCggYF5oc2xcXFxcKCR7cmF3TnVtYmVyfSwke3Jhd051bWJlcn0lLCR7cmF3TnVtYmVyfSVcXFxcKSRgICksXHJcbiAgICAgIGFwcGx5OiAoIGNvbG9yOiBDb2xvciwgbWF0Y2hlczogUmVnRXhwRXhlY0FycmF5ICk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGNvbG9yLnNldEhTTEEoXHJcbiAgICAgICAgICBOdW1iZXIoIG1hdGNoZXNbIDEgXSApLFxyXG4gICAgICAgICAgTnVtYmVyKCBtYXRjaGVzWyAyIF0gKSxcclxuICAgICAgICAgIE51bWJlciggbWF0Y2hlc1sgMyBdICksXHJcbiAgICAgICAgICAxICk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIC8vIGhzbGEoLi4uKVxyXG4gICAgICByZWdleHA6IG5ldyBSZWdFeHAoIGBeaHNsYVxcXFwoJHtyYXdOdW1iZXJ9LCR7cmF3TnVtYmVyfSUsJHtyYXdOdW1iZXJ9JSwke2FOdW1iZXJ9XFxcXCkkYCApLFxyXG4gICAgICBhcHBseTogKCBjb2xvcjogQ29sb3IsIG1hdGNoZXM6IFJlZ0V4cEV4ZWNBcnJheSApOiB2b2lkID0+IHtcclxuICAgICAgICBjb2xvci5zZXRIU0xBKFxyXG4gICAgICAgICAgTnVtYmVyKCBtYXRjaGVzWyAxIF0gKSxcclxuICAgICAgICAgIE51bWJlciggbWF0Y2hlc1sgMiBdICksXHJcbiAgICAgICAgICBOdW1iZXIoIG1hdGNoZXNbIDMgXSApLFxyXG4gICAgICAgICAgTnVtYmVyKCBtYXRjaGVzWyA0IF0gKSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgXTtcclxuXHJcbiAgcHVibGljIHN0YXRpYyBiYXNpY0NvbG9yS2V5d29yZHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XHJcbiAgICBhcXVhOiAnMDBmZmZmJyxcclxuICAgIGJsYWNrOiAnMDAwMDAwJyxcclxuICAgIGJsdWU6ICcwMDAwZmYnLFxyXG4gICAgZnVjaHNpYTogJ2ZmMDBmZicsXHJcbiAgICBncmF5OiAnODA4MDgwJyxcclxuICAgIGdyZWVuOiAnMDA4MDAwJyxcclxuICAgIGxpbWU6ICcwMGZmMDAnLFxyXG4gICAgbWFyb29uOiAnODAwMDAwJyxcclxuICAgIG5hdnk6ICcwMDAwODAnLFxyXG4gICAgb2xpdmU6ICc4MDgwMDAnLFxyXG4gICAgcHVycGxlOiAnODAwMDgwJyxcclxuICAgIHJlZDogJ2ZmMDAwMCcsXHJcbiAgICBzaWx2ZXI6ICdjMGMwYzAnLFxyXG4gICAgdGVhbDogJzAwODA4MCcsXHJcbiAgICB3aGl0ZTogJ2ZmZmZmZicsXHJcbiAgICB5ZWxsb3c6ICdmZmZmMDAnXHJcbiAgfTtcclxuXHJcbiAgcHVibGljIHN0YXRpYyBjb2xvcktleXdvcmRzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xyXG4gICAgYWxpY2VibHVlOiAnZjBmOGZmJyxcclxuICAgIGFudGlxdWV3aGl0ZTogJ2ZhZWJkNycsXHJcbiAgICBhcXVhOiAnMDBmZmZmJyxcclxuICAgIGFxdWFtYXJpbmU6ICc3ZmZmZDQnLFxyXG4gICAgYXp1cmU6ICdmMGZmZmYnLFxyXG4gICAgYmVpZ2U6ICdmNWY1ZGMnLFxyXG4gICAgYmlzcXVlOiAnZmZlNGM0JyxcclxuICAgIGJsYWNrOiAnMDAwMDAwJyxcclxuICAgIGJsYW5jaGVkYWxtb25kOiAnZmZlYmNkJyxcclxuICAgIGJsdWU6ICcwMDAwZmYnLFxyXG4gICAgYmx1ZXZpb2xldDogJzhhMmJlMicsXHJcbiAgICBicm93bjogJ2E1MmEyYScsXHJcbiAgICBidXJseXdvb2Q6ICdkZWI4ODcnLFxyXG4gICAgY2FkZXRibHVlOiAnNWY5ZWEwJyxcclxuICAgIGNoYXJ0cmV1c2U6ICc3ZmZmMDAnLFxyXG4gICAgY2hvY29sYXRlOiAnZDI2OTFlJyxcclxuICAgIGNvcmFsOiAnZmY3ZjUwJyxcclxuICAgIGNvcm5mbG93ZXJibHVlOiAnNjQ5NWVkJyxcclxuICAgIGNvcm5zaWxrOiAnZmZmOGRjJyxcclxuICAgIGNyaW1zb246ICdkYzE0M2MnLFxyXG4gICAgY3lhbjogJzAwZmZmZicsXHJcbiAgICBkYXJrYmx1ZTogJzAwMDA4YicsXHJcbiAgICBkYXJrY3lhbjogJzAwOGI4YicsXHJcbiAgICBkYXJrZ29sZGVucm9kOiAnYjg4NjBiJyxcclxuICAgIGRhcmtncmF5OiAnYTlhOWE5JyxcclxuICAgIGRhcmtncmVlbjogJzAwNjQwMCcsXHJcbiAgICBkYXJrZ3JleTogJ2E5YTlhOScsXHJcbiAgICBkYXJra2hha2k6ICdiZGI3NmInLFxyXG4gICAgZGFya21hZ2VudGE6ICc4YjAwOGInLFxyXG4gICAgZGFya29saXZlZ3JlZW46ICc1NTZiMmYnLFxyXG4gICAgZGFya29yYW5nZTogJ2ZmOGMwMCcsXHJcbiAgICBkYXJrb3JjaGlkOiAnOTkzMmNjJyxcclxuICAgIGRhcmtyZWQ6ICc4YjAwMDAnLFxyXG4gICAgZGFya3NhbG1vbjogJ2U5OTY3YScsXHJcbiAgICBkYXJrc2VhZ3JlZW46ICc4ZmJjOGYnLFxyXG4gICAgZGFya3NsYXRlYmx1ZTogJzQ4M2Q4YicsXHJcbiAgICBkYXJrc2xhdGVncmF5OiAnMmY0ZjRmJyxcclxuICAgIGRhcmtzbGF0ZWdyZXk6ICcyZjRmNGYnLFxyXG4gICAgZGFya3R1cnF1b2lzZTogJzAwY2VkMScsXHJcbiAgICBkYXJrdmlvbGV0OiAnOTQwMGQzJyxcclxuICAgIGRlZXBwaW5rOiAnZmYxNDkzJyxcclxuICAgIGRlZXBza3libHVlOiAnMDBiZmZmJyxcclxuICAgIGRpbWdyYXk6ICc2OTY5NjknLFxyXG4gICAgZGltZ3JleTogJzY5Njk2OScsXHJcbiAgICBkb2RnZXJibHVlOiAnMWU5MGZmJyxcclxuICAgIGZpcmVicmljazogJ2IyMjIyMicsXHJcbiAgICBmbG9yYWx3aGl0ZTogJ2ZmZmFmMCcsXHJcbiAgICBmb3Jlc3RncmVlbjogJzIyOGIyMicsXHJcbiAgICBmdWNoc2lhOiAnZmYwMGZmJyxcclxuICAgIGdhaW5zYm9ybzogJ2RjZGNkYycsXHJcbiAgICBnaG9zdHdoaXRlOiAnZjhmOGZmJyxcclxuICAgIGdvbGQ6ICdmZmQ3MDAnLFxyXG4gICAgZ29sZGVucm9kOiAnZGFhNTIwJyxcclxuICAgIGdyYXk6ICc4MDgwODAnLFxyXG4gICAgZ3JlZW46ICcwMDgwMDAnLFxyXG4gICAgZ3JlZW55ZWxsb3c6ICdhZGZmMmYnLFxyXG4gICAgZ3JleTogJzgwODA4MCcsXHJcbiAgICBob25leWRldzogJ2YwZmZmMCcsXHJcbiAgICBob3RwaW5rOiAnZmY2OWI0JyxcclxuICAgIGluZGlhbnJlZDogJ2NkNWM1YycsXHJcbiAgICBpbmRpZ286ICc0YjAwODInLFxyXG4gICAgaXZvcnk6ICdmZmZmZjAnLFxyXG4gICAga2hha2k6ICdmMGU2OGMnLFxyXG4gICAgbGF2ZW5kZXI6ICdlNmU2ZmEnLFxyXG4gICAgbGF2ZW5kZXJibHVzaDogJ2ZmZjBmNScsXHJcbiAgICBsYXduZ3JlZW46ICc3Y2ZjMDAnLFxyXG4gICAgbGVtb25jaGlmZm9uOiAnZmZmYWNkJyxcclxuICAgIGxpZ2h0Ymx1ZTogJ2FkZDhlNicsXHJcbiAgICBsaWdodGNvcmFsOiAnZjA4MDgwJyxcclxuICAgIGxpZ2h0Y3lhbjogJ2UwZmZmZicsXHJcbiAgICBsaWdodGdvbGRlbnJvZHllbGxvdzogJ2ZhZmFkMicsXHJcbiAgICBsaWdodGdyYXk6ICdkM2QzZDMnLFxyXG4gICAgbGlnaHRncmVlbjogJzkwZWU5MCcsXHJcbiAgICBsaWdodGdyZXk6ICdkM2QzZDMnLFxyXG4gICAgbGlnaHRwaW5rOiAnZmZiNmMxJyxcclxuICAgIGxpZ2h0c2FsbW9uOiAnZmZhMDdhJyxcclxuICAgIGxpZ2h0c2VhZ3JlZW46ICcyMGIyYWEnLFxyXG4gICAgbGlnaHRza3libHVlOiAnODdjZWZhJyxcclxuICAgIGxpZ2h0c2xhdGVncmF5OiAnNzc4ODk5JyxcclxuICAgIGxpZ2h0c2xhdGVncmV5OiAnNzc4ODk5JyxcclxuICAgIGxpZ2h0c3RlZWxibHVlOiAnYjBjNGRlJyxcclxuICAgIGxpZ2h0eWVsbG93OiAnZmZmZmUwJyxcclxuICAgIGxpbWU6ICcwMGZmMDAnLFxyXG4gICAgbGltZWdyZWVuOiAnMzJjZDMyJyxcclxuICAgIGxpbmVuOiAnZmFmMGU2JyxcclxuICAgIG1hZ2VudGE6ICdmZjAwZmYnLFxyXG4gICAgbWFyb29uOiAnODAwMDAwJyxcclxuICAgIG1lZGl1bWFxdWFtYXJpbmU6ICc2NmNkYWEnLFxyXG4gICAgbWVkaXVtYmx1ZTogJzAwMDBjZCcsXHJcbiAgICBtZWRpdW1vcmNoaWQ6ICdiYTU1ZDMnLFxyXG4gICAgbWVkaXVtcHVycGxlOiAnOTM3MGRiJyxcclxuICAgIG1lZGl1bXNlYWdyZWVuOiAnM2NiMzcxJyxcclxuICAgIG1lZGl1bXNsYXRlYmx1ZTogJzdiNjhlZScsXHJcbiAgICBtZWRpdW1zcHJpbmdncmVlbjogJzAwZmE5YScsXHJcbiAgICBtZWRpdW10dXJxdW9pc2U6ICc0OGQxY2MnLFxyXG4gICAgbWVkaXVtdmlvbGV0cmVkOiAnYzcxNTg1JyxcclxuICAgIG1pZG5pZ2h0Ymx1ZTogJzE5MTk3MCcsXHJcbiAgICBtaW50Y3JlYW06ICdmNWZmZmEnLFxyXG4gICAgbWlzdHlyb3NlOiAnZmZlNGUxJyxcclxuICAgIG1vY2Nhc2luOiAnZmZlNGI1JyxcclxuICAgIG5hdmFqb3doaXRlOiAnZmZkZWFkJyxcclxuICAgIG5hdnk6ICcwMDAwODAnLFxyXG4gICAgb2xkbGFjZTogJ2ZkZjVlNicsXHJcbiAgICBvbGl2ZTogJzgwODAwMCcsXHJcbiAgICBvbGl2ZWRyYWI6ICc2YjhlMjMnLFxyXG4gICAgb3JhbmdlOiAnZmZhNTAwJyxcclxuICAgIG9yYW5nZXJlZDogJ2ZmNDUwMCcsXHJcbiAgICBvcmNoaWQ6ICdkYTcwZDYnLFxyXG4gICAgcGFsZWdvbGRlbnJvZDogJ2VlZThhYScsXHJcbiAgICBwYWxlZ3JlZW46ICc5OGZiOTgnLFxyXG4gICAgcGFsZXR1cnF1b2lzZTogJ2FmZWVlZScsXHJcbiAgICBwYWxldmlvbGV0cmVkOiAnZGI3MDkzJyxcclxuICAgIHBhcGF5YXdoaXA6ICdmZmVmZDUnLFxyXG4gICAgcGVhY2hwdWZmOiAnZmZkYWI5JyxcclxuICAgIHBlcnU6ICdjZDg1M2YnLFxyXG4gICAgcGluazogJ2ZmYzBjYicsXHJcbiAgICBwbHVtOiAnZGRhMGRkJyxcclxuICAgIHBvd2RlcmJsdWU6ICdiMGUwZTYnLFxyXG4gICAgcHVycGxlOiAnODAwMDgwJyxcclxuICAgIHJlZDogJ2ZmMDAwMCcsXHJcbiAgICByb3N5YnJvd246ICdiYzhmOGYnLFxyXG4gICAgcm95YWxibHVlOiAnNDE2OWUxJyxcclxuICAgIHNhZGRsZWJyb3duOiAnOGI0NTEzJyxcclxuICAgIHNhbG1vbjogJ2ZhODA3MicsXHJcbiAgICBzYW5keWJyb3duOiAnZjRhNDYwJyxcclxuICAgIHNlYWdyZWVuOiAnMmU4YjU3JyxcclxuICAgIHNlYXNoZWxsOiAnZmZmNWVlJyxcclxuICAgIHNpZW5uYTogJ2EwNTIyZCcsXHJcbiAgICBzaWx2ZXI6ICdjMGMwYzAnLFxyXG4gICAgc2t5Ymx1ZTogJzg3Y2VlYicsXHJcbiAgICBzbGF0ZWJsdWU6ICc2YTVhY2QnLFxyXG4gICAgc2xhdGVncmF5OiAnNzA4MDkwJyxcclxuICAgIHNsYXRlZ3JleTogJzcwODA5MCcsXHJcbiAgICBzbm93OiAnZmZmYWZhJyxcclxuICAgIHNwcmluZ2dyZWVuOiAnMDBmZjdmJyxcclxuICAgIHN0ZWVsYmx1ZTogJzQ2ODJiNCcsXHJcbiAgICB0YW46ICdkMmI0OGMnLFxyXG4gICAgdGVhbDogJzAwODA4MCcsXHJcbiAgICB0aGlzdGxlOiAnZDhiZmQ4JyxcclxuICAgIHRvbWF0bzogJ2ZmNjM0NycsXHJcbiAgICB0dXJxdW9pc2U6ICc0MGUwZDAnLFxyXG4gICAgdmlvbGV0OiAnZWU4MmVlJyxcclxuICAgIHdoZWF0OiAnZjVkZWIzJyxcclxuICAgIHdoaXRlOiAnZmZmZmZmJyxcclxuICAgIHdoaXRlc21va2U6ICdmNWY1ZjUnLFxyXG4gICAgeWVsbG93OiAnZmZmZjAwJyxcclxuICAgIHllbGxvd2dyZWVuOiAnOWFjZDMyJ1xyXG4gIH07XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgQkxBQ0s6IENvbG9yOyAgLy8gZXNsaW50LWRpc2FibGUtbGluZSB1cHBlcmNhc2Utc3RhdGljcy1zaG91bGQtYmUtcmVhZG9ubHlcclxuICBwdWJsaWMgc3RhdGljIEJMVUU6IENvbG9yOyAgLy8gZXNsaW50LWRpc2FibGUtbGluZSB1cHBlcmNhc2Utc3RhdGljcy1zaG91bGQtYmUtcmVhZG9ubHlcclxuICBwdWJsaWMgc3RhdGljIENZQU46IENvbG9yOyAgLy8gZXNsaW50LWRpc2FibGUtbGluZSB1cHBlcmNhc2Utc3RhdGljcy1zaG91bGQtYmUtcmVhZG9ubHlcclxuICBwdWJsaWMgc3RhdGljIERBUktfR1JBWTogQ29sb3I7ICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHVwcGVyY2FzZS1zdGF0aWNzLXNob3VsZC1iZS1yZWFkb25seVxyXG4gIHB1YmxpYyBzdGF0aWMgR1JBWTogQ29sb3I7ICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHVwcGVyY2FzZS1zdGF0aWNzLXNob3VsZC1iZS1yZWFkb25seVxyXG4gIHB1YmxpYyBzdGF0aWMgR1JFRU46IENvbG9yOyAgLy8gZXNsaW50LWRpc2FibGUtbGluZSB1cHBlcmNhc2Utc3RhdGljcy1zaG91bGQtYmUtcmVhZG9ubHlcclxuICBwdWJsaWMgc3RhdGljIExJR0hUX0dSQVk6IENvbG9yOyAgLy8gZXNsaW50LWRpc2FibGUtbGluZSB1cHBlcmNhc2Utc3RhdGljcy1zaG91bGQtYmUtcmVhZG9ubHlcclxuICBwdWJsaWMgc3RhdGljIE1BR0VOVEE6IENvbG9yOyAgLy8gZXNsaW50LWRpc2FibGUtbGluZSB1cHBlcmNhc2Utc3RhdGljcy1zaG91bGQtYmUtcmVhZG9ubHlcclxuICBwdWJsaWMgc3RhdGljIE9SQU5HRTogQ29sb3I7ICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHVwcGVyY2FzZS1zdGF0aWNzLXNob3VsZC1iZS1yZWFkb25seVxyXG4gIHB1YmxpYyBzdGF0aWMgUElOSzogQ29sb3I7ICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHVwcGVyY2FzZS1zdGF0aWNzLXNob3VsZC1iZS1yZWFkb25seVxyXG4gIHB1YmxpYyBzdGF0aWMgUkVEOiBDb2xvcjsgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdXBwZXJjYXNlLXN0YXRpY3Mtc2hvdWxkLWJlLXJlYWRvbmx5XHJcbiAgcHVibGljIHN0YXRpYyBXSElURTogQ29sb3I7ICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHVwcGVyY2FzZS1zdGF0aWNzLXNob3VsZC1iZS1yZWFkb25seVxyXG4gIHB1YmxpYyBzdGF0aWMgWUVMTE9XOiBDb2xvcjsgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdXBwZXJjYXNlLXN0YXRpY3Mtc2hvdWxkLWJlLXJlYWRvbmx5XHJcbiAgcHVibGljIHN0YXRpYyBUUkFOU1BBUkVOVDogQ29sb3I7ICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHVwcGVyY2FzZS1zdGF0aWNzLXNob3VsZC1iZS1yZWFkb25seVxyXG5cclxuICBwdWJsaWMgc3RhdGljIGJsYWNrOiBDb2xvcjtcclxuICBwdWJsaWMgc3RhdGljIGJsdWU6IENvbG9yO1xyXG4gIHB1YmxpYyBzdGF0aWMgY3lhbjogQ29sb3I7XHJcbiAgcHVibGljIHN0YXRpYyBkYXJrR3JheTogQ29sb3I7XHJcbiAgcHVibGljIHN0YXRpYyBncmF5OiBDb2xvcjtcclxuICBwdWJsaWMgc3RhdGljIGdyZWVuOiBDb2xvcjtcclxuICBwdWJsaWMgc3RhdGljIGxpZ2h0R3JheTogQ29sb3I7XHJcbiAgcHVibGljIHN0YXRpYyBtYWdlbnRhOiBDb2xvcjtcclxuICBwdWJsaWMgc3RhdGljIG9yYW5nZTogQ29sb3I7XHJcbiAgcHVibGljIHN0YXRpYyBwaW5rOiBDb2xvcjtcclxuICBwdWJsaWMgc3RhdGljIHJlZDogQ29sb3I7XHJcbiAgcHVibGljIHN0YXRpYyB3aGl0ZTogQ29sb3I7XHJcbiAgcHVibGljIHN0YXRpYyB5ZWxsb3c6IENvbG9yO1xyXG4gIHB1YmxpYyBzdGF0aWMgdHJhbnNwYXJlbnQ6IENvbG9yO1xyXG5cclxuICBwdWJsaWMgc3RhdGljIENvbG9ySU86IElPVHlwZTtcclxufVxyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ0NvbG9yJywgQ29sb3IgKTtcclxuXHJcbi8vIEphdmEgY29tcGF0aWJpbGl0eVxyXG5Db2xvci5CTEFDSyA9IENvbG9yLmJsYWNrID0gbmV3IENvbG9yKCAwLCAwLCAwICkuc2V0SW1tdXRhYmxlKCk7XHJcbkNvbG9yLkJMVUUgPSBDb2xvci5ibHVlID0gbmV3IENvbG9yKCAwLCAwLCAyNTUgKS5zZXRJbW11dGFibGUoKTtcclxuQ29sb3IuQ1lBTiA9IENvbG9yLmN5YW4gPSBuZXcgQ29sb3IoIDAsIDI1NSwgMjU1ICkuc2V0SW1tdXRhYmxlKCk7XHJcbkNvbG9yLkRBUktfR1JBWSA9IENvbG9yLmRhcmtHcmF5ID0gbmV3IENvbG9yKCA2NCwgNjQsIDY0ICkuc2V0SW1tdXRhYmxlKCk7XHJcbkNvbG9yLkdSQVkgPSBDb2xvci5ncmF5ID0gbmV3IENvbG9yKCAxMjgsIDEyOCwgMTI4ICkuc2V0SW1tdXRhYmxlKCk7XHJcbkNvbG9yLkdSRUVOID0gQ29sb3IuZ3JlZW4gPSBuZXcgQ29sb3IoIDAsIDI1NSwgMCApLnNldEltbXV0YWJsZSgpO1xyXG5Db2xvci5MSUdIVF9HUkFZID0gQ29sb3IubGlnaHRHcmF5ID0gbmV3IENvbG9yKCAxOTIsIDE5MiwgMTkyICkuc2V0SW1tdXRhYmxlKCk7XHJcbkNvbG9yLk1BR0VOVEEgPSBDb2xvci5tYWdlbnRhID0gbmV3IENvbG9yKCAyNTUsIDAsIDI1NSApLnNldEltbXV0YWJsZSgpO1xyXG5Db2xvci5PUkFOR0UgPSBDb2xvci5vcmFuZ2UgPSBuZXcgQ29sb3IoIDI1NSwgMjAwLCAwICkuc2V0SW1tdXRhYmxlKCk7XHJcbkNvbG9yLlBJTksgPSBDb2xvci5waW5rID0gbmV3IENvbG9yKCAyNTUsIDE3NSwgMTc1ICkuc2V0SW1tdXRhYmxlKCk7XHJcbkNvbG9yLlJFRCA9IENvbG9yLnJlZCA9IG5ldyBDb2xvciggMjU1LCAwLCAwICkuc2V0SW1tdXRhYmxlKCk7XHJcbkNvbG9yLldISVRFID0gQ29sb3Iud2hpdGUgPSBuZXcgQ29sb3IoIDI1NSwgMjU1LCAyNTUgKS5zZXRJbW11dGFibGUoKTtcclxuQ29sb3IuWUVMTE9XID0gQ29sb3IueWVsbG93ID0gbmV3IENvbG9yKCAyNTUsIDI1NSwgMCApLnNldEltbXV0YWJsZSgpO1xyXG5cclxuLy8gSGVscGVyIGZvciB0cmFuc3BhcmVudCBjb2xvcnNcclxuQ29sb3IuVFJBTlNQQVJFTlQgPSBDb2xvci50cmFuc3BhcmVudCA9IG5ldyBDb2xvciggMCwgMCwgMCwgMCApLnNldEltbXV0YWJsZSgpO1xyXG5cclxuY29uc3Qgc2NyYXRjaENvbG9yID0gbmV3IENvbG9yKCAnYmx1ZScgKTtcclxuXHJcbmV4cG9ydCB0eXBlIENvbG9yU3RhdGUgPSB7XHJcbiAgcjogbnVtYmVyO1xyXG4gIGc6IG51bWJlcjtcclxuICBiOiBudW1iZXI7XHJcbiAgYTogbnVtYmVyO1xyXG59O1xyXG5cclxuQ29sb3IuQ29sb3JJTyA9IG5ldyBJT1R5cGU8Q29sb3IsIENvbG9yU3RhdGU+KCAnQ29sb3JJTycsIHtcclxuICB2YWx1ZVR5cGU6IENvbG9yLFxyXG4gIGRvY3VtZW50YXRpb246ICdBIGNvbG9yLCB3aXRoIHJnYmEnLFxyXG4gIHRvU3RhdGVPYmplY3Q6IGNvbG9yID0+IGNvbG9yLnRvU3RhdGVPYmplY3QoKSxcclxuICBmcm9tU3RhdGVPYmplY3Q6IHN0YXRlT2JqZWN0ID0+IG5ldyBDb2xvciggc3RhdGVPYmplY3Quciwgc3RhdGVPYmplY3QuZywgc3RhdGVPYmplY3QuYiwgc3RhdGVPYmplY3QuYSApLFxyXG4gIHN0YXRlU2NoZW1hOiB7XHJcbiAgICByOiBOdW1iZXJJTyxcclxuICAgIGc6IE51bWJlcklPLFxyXG4gICAgYjogTnVtYmVySU8sXHJcbiAgICBhOiBOdW1iZXJJT1xyXG4gIH1cclxufSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUdBLE9BQU9BLFdBQVcsTUFBTSxpQ0FBaUM7QUFDekQsT0FBT0MsS0FBSyxNQUFNLDBCQUEwQjtBQUM1QyxPQUFPQyxNQUFNLE1BQU0sb0NBQW9DO0FBQ3ZELE9BQU9DLFFBQVEsTUFBTSxzQ0FBc0M7QUFDM0QsU0FBU0MsT0FBTyxRQUFnQixlQUFlO0FBRS9DLFNBQVNDLG1CQUFtQixRQUFRLHVDQUF1Qzs7QUFFM0U7QUFDQSxNQUFNQyxLQUFLLEdBQUdMLEtBQUssQ0FBQ0ssS0FBSztBQUN6QixNQUFNQyxNQUFNLEdBQUdOLEtBQUssQ0FBQ00sTUFBTTtBQU8zQjtBQUNBLE1BQU1D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