// Copyright 2020-2024, University of Colorado Boulder

/**
 * Isolates Image handling with HTML/Canvas images, with mipmaps and general support.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import TinyEmitter from '../../../axon/js/TinyEmitter.js';
import Utils from '../../../dot/js/Utils.js';
import { Shape } from '../../../kite/js/imports.js';
import cleanArray from '../../../phet-core/js/cleanArray.js';
import { scenery, svgns, xlinkns } from '../imports.js';
import TinyForwardingProperty from '../../../axon/js/TinyForwardingProperty.js';
// Need to poly-fill on some browsers
const log2 = Math.log2 || function (x) {
  return Math.log(x) / Math.LN2;
};
const DEFAULT_OPTIONS = {
  imageOpacity: 1,
  initialWidth: 0,
  initialHeight: 0,
  mipmap: false,
  mipmapBias: 0,
  mipmapInitialLevel: 4,
  mipmapMaxLevel: 5,
  hitTestPixels: false
};

// Lazy scratch canvas/context (so we don't incur the startup cost of canvas/context creation)
let scratchCanvas = null;
let scratchContext = null;
const getScratchCanvas = () => {
  if (!scratchCanvas) {
    scratchCanvas = document.createElement('canvas');
  }
  return scratchCanvas;
};
const getScratchContext = () => {
  if (!scratchContext) {
    scratchContext = getScratchCanvas().getContext('2d', {
      willReadFrequently: true
    });
  }
  return scratchContext;
};

/**
 * The available ways to specify an image as an input to Imageable. See onImagePropertyChange() for parsing logic.
 * We support a few different 'image' types that can be passed in:
 *
 * HTMLImageElement - A normal HTML <img>. If it hasn't been fully loaded yet, Scenery will take care of adding a
 *   listener that will update Scenery with its width/height (and load its data) when the image is fully loaded.
 *   NOTE that if you just created the <img>, it probably isn't loaded yet, particularly in Safari. If the Image
 *   node is constructed with an <img> that hasn't fully loaded, it will have a width and height of 0, which may
 *   cause issues if you are using bounds for layout. Please see initialWidth/initialHeight notes below.
 *
 * URL - Provide a {string}, and Scenery will assume it is a URL. This can be a normal URL, or a data URI, both will
 *   work. Please note that this has the same loading-order issues as using HTMLImageElement, but that it's almost
 *   always guaranteed to not have a width/height when you create the Image node. Note that data URI support for
 *   formats depends on the browser - only JPEG and PNG are supported broadly. Please see initialWidth/initialHeight
 *   notes below.
 *   Additionally, note that if a URL is provided, accessing image.getImage() or image.image will result not in the
 *   original URL (currently), but with the automatically created HTMLImageElement.
 *
 * HTMLCanvasElement - It's possible to pass an HTML5 Canvas directly into the Image node. It will immediately be
 *   aware of the width/height (bounds) of the Canvas, but NOTE that the Image node will not listen to Canvas size
 *   changes. It is assumed that after you pass in a Canvas to an Image node that it will not be modified further.
 *   Additionally, the Image node will only be rendered using Canvas or WebGL if a Canvas is used as input.
 *
 * Mipmap data structure - Image supports a mipmap data structure that provides rasterized mipmap levels. The 'top'
 *   level (level 0) is the entire full-size image, and every other level is twice as small in every direction
 *   (~1/4 the pixels), rounding dimensions up. This is useful for browsers that display the image badly if the
 *   image is too large. Instead, Scenery will dynamically pick the most appropriate size of the image to use,
 *   which improves the image appearance.
 *   The passed in 'image' should be an Array of mipmap objects of the format:
 *   {
 *     img: {HTMLImageElement}, // preferably preloaded, but it isn't required
 *     url: {string}, // URL (usually a data URL) for the image level
 *     width: {number}, // width of the mipmap level, in pixels
 *     height: {number} // height of the mipmap level, in pixels,
 *     canvas: {HTMLCanvasElement} // Canvas element containing the image data for the img.
 *     [updateCanvas]: {function} // If available, should be called before using the Canvas directly.
 *   }
 *   At least one level is required (level 0), and each mipmap level corresponds to the index in the array, e.g.:
 *   [
 *     level 0 (full size, e.g. 100x64)
 *     level 1 (half size, e.g. 50x32)
 *     level 2 (quarter size, e.g. 25x16)
 *     level 3 (eighth size, e.g. 13x8 - note the rounding up)
 *     ...
 *     level N (single pixel, e.g. 1x1 - this is the smallest level permitted, and there should only be one)
 *   ]
 *   Additionally, note that (currently) image.getImage() will return the HTMLImageElement from the first level,
 *   not the mipmap data.
 *
 *  Also note that if the underlying image (like Canvas data) has changed, it is recommended to call
 *  invalidateImage() instead of changing the image reference (calling setImage() multiple times)
 */

// The output image type from parsing the input "ImageableImage", see onImagePropertyChange()

// Normally our project prefers type aliases to interfaces, but interfaces are necessary for correct usage of "this", see https://github.com/phetsims/tasks/issues/1132
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions

const Imageable = type => {
  return class ImageableMixin extends type {
    // (scenery-internal) Internal stateful value, see onImagePropertyChange()

    // For imageProperty

    // Internal stateful value, see setInitialWidth() for documentation.

    // Internal stateful value, see setInitialHeight() for documentation.

    // (scenery-internal) Internal stateful value, see setImageOpacity() for documentation.

    // (scenery-internal) Internal stateful value, see setMipmap() for documentation.

    // (scenery-internal) Internal stateful value, see setMipmapBias() for documentation.

    // (scenery-internal) Internal stateful value, see setMipmapInitialLevel() for documentation.

    // (scenery-internal) Internal stateful value, see setMipmapMaxLevel() for documentation

    // Internal stateful value, see setHitTestPixels() for documentation.
    // @mixin-protected - made public for use in the mixin only

    // Array of Canvases for each level, constructed internally so that Canvas-based drawables (Canvas, WebGL) can quickly draw mipmaps.

    // Array of URLs for each level, where each URL will display an image (and is typically a data URI or blob URI), so
    // that we can handle mipmaps in SVG where URLs are required.

    // (scenery-internal) Mipmap data if it is passed into our image. Will be stored here for processing

    // Listener for invalidating our bounds whenever an image is invalidated.

    // Whether our _imageLoadListener has been attached as a listener to the current image.

    // Used for pixel hit testing.
    // @mixin-protected - made public for use in the mixin only

    // Emits when mipmaps are (re)generated

    // For compatibility

    constructor(...args) {
      super(...args);

      // We'll initialize this by mutating.
      this._imageProperty = new TinyForwardingProperty(null, false, this.onImagePropertyChange.bind(this));
      this._image = null;
      this._initialWidth = DEFAULT_OPTIONS.initialWidth;
      this._initialHeight = DEFAULT_OPTIONS.initialHeight;
      this._imageOpacity = DEFAULT_OPTIONS.imageOpacity;
      this._mipmap = DEFAULT_OPTIONS.mipmap;
      this._mipmapBias = DEFAULT_OPTIONS.mipmapBias;
      this._mipmapInitialLevel = DEFAULT_OPTIONS.mipmapInitialLevel;
      this._mipmapMaxLevel = DEFAULT_OPTIONS.mipmapMaxLevel;
      this._hitTestPixels = DEFAULT_OPTIONS.hitTestPixels;
      this._mipmapCanvases = [];
      this._mipmapURLs = [];
      this._mipmapData = null;
      this._imageLoadListener = this._onImageLoad.bind(this);
      this._imageLoadListenerAttached = false;
      this._hitTestImageData = null;
      this.mipmapEmitter = new TinyEmitter();
    }

    /**
     * Sets the current image to be displayed by this Image node. See ImageableImage for details on provided image value.
     *
     */
    setImage(image) {
      assert && assert(image, 'image should be available');
      this._imageProperty.value = image;
      return this;
    }
    set image(value) {
      this.setImage(value);
    }
    get image() {
      return this.getImage();
    }

    /**
     * Returns the current image's representation as either a Canvas or img element.
     *
     * NOTE: If a URL or mipmap data was provided, this currently doesn't return the original input to setImage(), but
     *       instead provides the mapped result (or first mipmap level's image). If you need the original, use
     *       imageProperty instead.
     */
    getImage() {
      assert && assert(this._image !== null);
      return this._image;
    }
    onImagePropertyChange(image) {
      assert && assert(image, 'image should be available');

      // Generally, if a different value for image is provided, it has changed
      let hasImageChanged = this._image !== image;

      // Except in some cases, where the provided image is a string. If our current image has the same .src as the
      // "new" image, it's basically the same (as we promote string images to HTMLImageElements).
      if (hasImageChanged && typeof image === 'string' && this._image && this._image instanceof HTMLImageElement && image === this._image.src) {
        hasImageChanged = false;
      }

      // Or if our current mipmap data is the same as the input, then we aren't changing it
      if (hasImageChanged && image === this._mipmapData) {
        hasImageChanged = false;
      }
      if (hasImageChanged) {
        // Reset the initial dimensions, since we have a new image that may have different dimensions.
        this._initialWidth = 0;
        this._initialHeight = 0;

        // Don't leak memory by referencing old images
        if (this._image && this._imageLoadListenerAttached) {
          this._detachImageLoadListener();
        }

        // clear old mipmap data references
        this._mipmapData = null;

        // Convert string => HTMLImageElement
        if (typeof image === 'string') {
          // create an image with the assumed URL
          const src = image;
          image = document.createElement('img');
          image.src = src;
        }
        // Handle the provided mipmap
        else if (Array.isArray(image)) {
          // mipmap data!
          this._mipmapData = image;
          image = image[0].img; // presumes we are already loaded

          // force initialization of mipmapping parameters, since invalidateMipmaps() is guaranteed to run below
          this._mipmapInitialLevel = this._mipmapMaxLevel = this._mipmapData.length;
          this._mipmap = true;
        }

        // We ruled out the string | Mipmap cases above
        this._image = image;

        // If our image is an HTML image that hasn't loaded yet, attach a load listener.
        if (this._image instanceof HTMLImageElement && (!this._image.width || !this._image.height)) {
          this._attachImageLoadListener();
        }

        // Try recomputing bounds (may give a 0x0 if we aren't yet loaded)
        this.invalidateImage();
      }
    }

    /**
     * See documentation for Node.setVisibleProperty, except this is for the image
     */
    setImageProperty(newTarget) {
      // This is awkward, we are NOT guaranteed a Node.
      return this._imageProperty.setTargetProperty(newTarget);
    }
    set imageProperty(property) {
      this.setImageProperty(property);
    }
    get imageProperty() {
      return this.getImageProperty();
    }

    /**
     * Like Node.getVisibleProperty(), but for the image. Note this is not the same as the Property provided in
     * setImageProperty. Thus is the nature of TinyForwardingProperty.
     */
    getImageProperty() {
      return this._imageProperty;
    }

    /**
     * Triggers recomputation of the image's bounds and refreshes any displays output of the image.
     *
     * Generally this can trigger recomputation of mipmaps, will mark any drawables as needing repaints, and will
     * cause a spritesheet change for WebGL.
     *
     * This should be done when the underlying image has changed appearance (usually the case with a Canvas changing,
     * but this is also triggered by our actual image reference changing).
     */
    invalidateImage() {
      this.invalidateMipmaps();
      this._invalidateHitTestData();
    }

    /**
     * Sets the image with additional information about dimensions used before the image has loaded.
     *
     * This is essentially the same as setImage(), but also updates the initial dimensions. See setImage()'s
     * documentation for details on the image parameter.
     *
     * NOTE: setImage() will first reset the initial dimensions to 0, which will then be overridden later in this
     *       function. This may trigger bounds changes, even if the previous and next image (and image dimensions)
     *       are the same.
     *
     * @param image - See ImageableImage's type documentation
     * @param width - Initial width of the image. See setInitialWidth() for more documentation
     * @param height - Initial height of the image. See setInitialHeight() for more documentation
     */
    setImageWithSize(image, width, height) {
      // First, setImage(), as it will reset the initial width and height
      this.setImage(image);

      // Then apply the initial dimensions
      this.setInitialWidth(width);
      this.setInitialHeight(height);
      return this;
    }

    /**
     * Sets an opacity that is applied only to this image (will not affect children or the rest of the node's subtree).
     *
     * This should generally be preferred over Node's opacity if it has the same result, as modifying this will be much
     * faster, and will not force additional Canvases or intermediate steps in display.
     *
     * @param imageOpacity - Should be a number between 0 (transparent) and 1 (opaque), just like normal
     *                                opacity.
     */
    setImageOpacity(imageOpacity) {
      assert && assert(isFinite(imageOpacity) && imageOpacity >= 0 && imageOpacity <= 1, `imageOpacity out of range: ${imageOpacity}`);
      if (this._imageOpacity !== imageOpacity) {
        this._imageOpacity = imageOpacity;
      }
    }
    set imageOpacity(value) {
      this.setImageOpacity(value);
    }
    get imageOpacity() {
      return this.getImageOpacity();
    }

    /**
     * Returns the opacity applied only to this image (not including children).
     *
     * See setImageOpacity() documentation for more information.
     */
    getImageOpacity() {
      return this._imageOpacity;
    }

    /**
     * Provides an initial width for an image that has not loaded yet.
     *
     * If the input image hasn't loaded yet, but the (expected) size is known, providing an initialWidth will cause the
     * Image node to have the correct bounds (width) before the pixel data has been fully loaded. A value of 0 will be
     * ignored.
     *
     * This is required for many browsers, as images can show up as a 0x0 (like Safari does for unloaded images).
     *
     * NOTE: setImage will reset this value to 0 (ignored), since it's potentially likely the new image has different
     *       dimensions than the current image.
     *
     * NOTE: If these dimensions end up being different than the actual image width/height once it has been loaded, an
     *       assertion will fail. Only the correct dimensions should be provided. If the width/height is unknown,
     *       please use the localBounds override or a transparent rectangle for taking up the (approximate) bounds.
     *
     * @param width - Expected width of the image's unloaded content
     */
    setInitialWidth(width) {
      assert && assert(width >= 0 && width % 1 === 0, 'initialWidth should be a non-negative integer');
      if (width !== this._initialWidth) {
        this._initialWidth = width;
        this.invalidateImage();
      }
      return this;
    }
    set initialWidth(value) {
      this.setInitialWidth(value);
    }
    get initialWidth() {
      return this.getInitialWidth();
    }

    /**
     * Returns the initialWidth value set from setInitialWidth().
     *
     * See setInitialWidth() for more documentation. A value of 0 is ignored.
     */
    getInitialWidth() {
      return this._initialWidth;
    }

    /**
     * Provides an initial height for an image that has not loaded yet.
     *
     * If the input image hasn't loaded yet, but the (expected) size is known, providing an initialWidth will cause the
     * Image node to have the correct bounds (height) before the pixel data has been fully loaded. A value of 0 will be
     * ignored.
     *
     * This is required for many browsers, as images can show up as a 0x0 (like Safari does for unloaded images).
     *
     * NOTE: setImage will reset this value to 0 (ignored), since it's potentially likely the new image has different
     *       dimensions than the current image.
     *
     * NOTE: If these dimensions end up being different than the actual image width/height once it has been loaded, an
     *       assertion will fail. Only the correct dimensions should be provided. If the width/height is unknown,
     *       please use the localBounds override or a transparent rectangle for taking up the (approximate) bounds.
     *
     * @param height - Expected height of the image's unloaded content
     */
    setInitialHeight(height) {
      assert && assert(height >= 0 && height % 1 === 0, 'initialHeight should be a non-negative integer');
      if (height !== this._initialHeight) {
        this._initialHeight = height;
        this.invalidateImage();
      }
      return this;
    }
    set initialHeight(value) {
      this.setInitialHeight(value);
    }
    get initialHeight() {
      return this.getInitialHeight();
    }

    /**
     * Returns the initialHeight value set from setInitialHeight().
     *
     * See setInitialHeight() for more documentation. A value of 0 is ignored.
     */
    getInitialHeight() {
      return this._initialHeight;
    }

    /**
     * Sets whether mipmapping is supported.
     *
     * This defaults to false, but is automatically set to true when a mipmap is provided to setImage(). Setting it to
     * true on non-mipmap images will trigger creation of a medium-quality mipmap that will be used.
     *
     * NOTE: This mipmap generation is slow and CPU-intensive. Providing precomputed mipmap resources to an Image node
     *       will be much faster, and of higher quality.
     *
     * @param mipmap - Whether mipmapping is supported
     */
    setMipmap(mipmap) {
      if (this._mipmap !== mipmap) {
        this._mipmap = mipmap;
        this.invalidateMipmaps();
      }
      return this;
    }
    set mipmap(value) {
      this.setMipmap(value);
    }
    get mipmap() {
      return this.isMipmap();
    }

    /**
     * Returns whether mipmapping is supported.
     *
     * See setMipmap() for more documentation.
     */
    isMipmap() {
      return this._mipmap;
    }

    /**
     * Sets how much level-of-detail is displayed for mipmapping.
     *
     * When displaying mipmapped images as output, a certain source level of the mipmap needs to be used. Using a level
     * with too much resolution can create an aliased look (but will generally be sharper). Using a level with too
     * little resolution will be blurrier (but not aliased).
     *
     * The value of the mipmap bias is added on to the computed "ideal" mipmap level, and:
     * - A negative bias will typically increase the displayed resolution
     * - A positive bias will typically decrease the displayed resolution
     *
     * This is done approximately like the following formula:
     *   mipmapLevel = Utils.roundSymmetric( computedMipmapLevel + mipmapBias )
     */
    setMipmapBias(bias) {
      if (this._mipmapBias !== bias) {
        this._mipmapBias = bias;
        this.invalidateMipmaps();
      }
      return this;
    }
    set mipmapBias(value) {
      this.setMipmapBias(value);
    }
    get mipmapBias() {
      return this.getMipmapBias();
    }

    /**
     * Returns the current mipmap bias.
     *
     * See setMipmapBias() for more documentation.
     */
    getMipmapBias() {
      return this._mipmapBias;
    }

    /**
     * The number of initial mipmap levels to compute (if Scenery generates the mipmaps by setting mipmap:true on a
     * non-mipmapped input).
     *
     * @param level - A non-negative integer representing the number of mipmap levels to precompute.
     */
    setMipmapInitialLevel(level) {
      assert && assert(level % 1 === 0 && level >= 0, 'mipmapInitialLevel should be a non-negative integer');
      if (this._mipmapInitialLevel !== level) {
        this._mipmapInitialLevel = level;
        this.invalidateMipmaps();
      }
      return this;
    }
    set mipmapInitialLevel(value) {
      this.setMipmapInitialLevel(value);
    }
    get mipmapInitialLevel() {
      return this.getMipmapInitialLevel();
    }

    /**
     * Returns the current initial mipmap level.
     *
     * See setMipmapInitialLevel() for more documentation.
     */
    getMipmapInitialLevel() {
      return this._mipmapInitialLevel;
    }

    /**
     * The maximum (lowest-resolution) level that Scenery will compute if it generates mipmaps (e.g. by setting
     * mipmap:true on a non-mipmapped input).
     *
     * The default will precompute all default levels (from mipmapInitialLevel), so that we ideally don't hit mipmap
     * generation during animation.
     *
     * @param level - A non-negative integer representing the maximum mipmap level to compute.
     */
    setMipmapMaxLevel(level) {
      assert && assert(level % 1 === 0 && level >= 0, 'mipmapMaxLevel should be a non-negative integer');
      if (this._mipmapMaxLevel !== level) {
        this._mipmapMaxLevel = level;
        this.invalidateMipmaps();
      }
      return this;
    }
    set mipmapMaxLevel(value) {
      this.setMipmapMaxLevel(value);
    }
    get mipmapMaxLevel() {
      return this.getMipmapMaxLevel();
    }

    /**
     * Returns the current maximum mipmap level.
     *
     * See setMipmapMaxLevel() for more documentation.
     */
    getMipmapMaxLevel() {
      return this._mipmapMaxLevel;
    }

    /**
     * Controls whether either any pixel in the image will be marked as contained (when false), or whether transparent
     * pixels will be counted as "not contained in the image" for hit-testing (when true).
     *
     * See https://github.com/phetsims/scenery/issues/1049 for more information.
     */
    setHitTestPixels(hitTestPixels) {
      if (this._hitTestPixels !== hitTestPixels) {
        this._hitTestPixels = hitTestPixels;
        this._invalidateHitTestData();
      }
      return this;
    }
    set hitTestPixels(value) {
      this.setHitTestPixels(value);
    }
    get hitTestPixels() {
      return this.getHitTestPixels();
    }

    /**
     * Returns whether pixels are checked for hit testing.
     *
     * See setHitTestPixels() for more documentation.
     */
    getHitTestPixels() {
      return this._hitTestPixels;
    }

    /**
     * Constructs the next available (uncomputed) mipmap level, as long as the previous level was larger than 1x1.
     */
    _constructNextMipmap() {
      const level = this._mipmapCanvases.length;
      const biggerCanvas = this._mipmapCanvases[level - 1];

      // ignore any 1x1 canvases (or smaller?!?)
      if (biggerCanvas.width * biggerCanvas.height > 2) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(biggerCanvas.width / 2);
        canvas.height = Math.ceil(biggerCanvas.height / 2);

        // sanity check
        if (canvas.width > 0 && canvas.height > 0) {
          // Draw half-scale into the smaller Canvas
          const context = canvas.getContext('2d');
          context.scale(0.5, 0.5);
          context.drawImage(biggerCanvas, 0, 0);
          this._mipmapCanvases.push(canvas);
          this._mipmapURLs.push(canvas.toDataURL());
        }
      }
    }

    /**
     * Triggers recomputation of mipmaps (as long as mipmapping is enabled)
     */
    invalidateMipmaps() {
      // Clean output arrays
      cleanArray(this._mipmapCanvases);
      cleanArray(this._mipmapURLs);
      if (this._image && this._mipmap) {
        // If we have mipmap data as an input
        if (this._mipmapData) {
          for (let k = 0; k < this._mipmapData.length; k++) {
            const url = this._mipmapData[k].url;
            this._mipmapURLs.push(url);
            const updateCanvas = this._mipmapData[k].updateCanvas;
            updateCanvas && updateCanvas();
            this._mipmapCanvases.push(this._mipmapData[k].canvas);
          }
        }
        // Otherwise, we have an image (not mipmap) as our input, so we'll need to construct mipmap levels.
        else {
          const baseCanvas = document.createElement('canvas');
          baseCanvas.width = this.getImageWidth();
          baseCanvas.height = this.getImageHeight();

          // if we are not loaded yet, just ignore
          if (baseCanvas.width && baseCanvas.height) {
            const baseContext = baseCanvas.getContext('2d');
            baseContext.drawImage(this._image, 0, 0);
            this._mipmapCanvases.push(baseCanvas);
            this._mipmapURLs.push(baseCanvas.toDataURL());
            let level = 0;
            while (++level < this._mipmapInitialLevel) {
              this._constructNextMipmap();
            }
          }
        }
      }
      this.mipmapEmitter.emit();
    }

    /**
     * Returns the desired mipmap level (0-indexed) that should be used for the particular relative transform. (scenery-internal)
     *
     * @param matrix - The relative transformation matrix of the node.
     * @param [additionalBias] - Can be provided to get per-call bias (we want some of this for Canvas output)
     */
    getMipmapLevel(matrix, additionalBias = 0) {
      assert && assert(this._mipmap, 'Assumes mipmaps can be used');

      // Handle high-dpi devices like retina with correct mipmap levels.
      const scale = Imageable.getApproximateMatrixScale(matrix) * (window.devicePixelRatio || 1);
      return this.getMipmapLevelFromScale(scale, additionalBias);
    }

    /**
     * Returns the desired mipmap level (0-indexed) that should be used for the particular scale
     */
    getMipmapLevelFromScale(scale, additionalBias = 0) {
      assert && assert(scale > 0, 'scale should be a positive number');

      // If we are shown larger than scale, ALWAYS choose the highest resolution
      if (scale >= 1) {
        return 0;
      }

      // our approximate level of detail
      let level = log2(1 / scale);

      // convert to an integer level (-0.7 is a good default)
      level = Utils.roundSymmetric(level + this._mipmapBias + additionalBias - 0.7);
      if (level < 0) {
        level = 0;
      }
      if (level > this._mipmapMaxLevel) {
        level = this._mipmapMaxLevel;
      }

      // If necessary, do lazy construction of the mipmap level
      if (this.mipmap && !this._mipmapCanvases[level]) {
        let currentLevel = this._mipmapCanvases.length - 1;
        while (++currentLevel <= level) {
          this._constructNextMipmap();
        }
        // Sanity check, since _constructNextMipmap() may have had to bail out. We had to compute some, so use the last
        return Math.min(level, this._mipmapCanvases.length - 1);
      }
      // Should already be constructed, or isn't needed
      else {
        return level;
      }
    }

    /**
     * Returns a matching Canvas element for the given level-of-detail. (scenery-internal)
     *
     * @param level - Non-negative integer representing the mipmap level
     * @returns - Matching <canvas> for the level of detail
     */
    getMipmapCanvas(level) {
      assert && assert(level >= 0 && level < this._mipmapCanvases.length && level % 1 === 0);

      // Sanity check to make sure we have copied the image data in if necessary.
      if (this._mipmapData) {
        // level may not exist (it was generated), and updateCanvas may not exist
        const updateCanvas = this._mipmapData[level] && this._mipmapData[level].updateCanvas;
        updateCanvas && updateCanvas();
      }
      return this._mipmapCanvases[level];
    }

    /**
     * Returns a matching URL string for an image for the given level-of-detail. (scenery-internal)
     *
     * @param level - Non-negative integer representing the mipmap level
     * @returns - Matching data URL for the level of detail
     */
    getMipmapURL(level) {
      assert && assert(level >= 0 && level < this._mipmapCanvases.length && level % 1 === 0);
      return this._mipmapURLs[level];
    }

    /**
     * Returns whether there are mipmap levels that have been computed. (scenery-internal)
     */
    hasMipmaps() {
      return this._mipmapCanvases.length > 0;
    }

    /**
     * Triggers recomputation of hit test data
     */
    _invalidateHitTestData() {
      // Only compute this if we are hit-testing pixels
      if (!this._hitTestPixels) {
        return;
      }
      if (this._image !== null) {
        this._hitTestImageData = Imageable.getHitTestData(this._image, this.imageWidth, this.imageHeight);
      }
    }

    /**
     * Returns the width of the displayed image (not related to how this node is transformed).
     *
     * NOTE: If the image is not loaded and an initialWidth was provided, that width will be used.
     */
    getImageWidth() {
      if (this._image === null) {
        return 0;
      }
      const detectedWidth = this._mipmapData ? this._mipmapData[0].width : ('naturalWidth' in this._image ? this._image.naturalWidth : 0) || this._image.width;
      if (detectedWidth === 0) {
        return this._initialWidth; // either 0 (default), or the overridden value
      } else {
        assert && assert(this._initialWidth === 0 || this._initialWidth === detectedWidth, 'Bad Image.initialWidth');
        return detectedWidth;
      }
    }
    get imageWidth() {
      return this.getImageWidth();
    }

    /**
     * Returns the height of the displayed image (not related to how this node is transformed).
     *
     * NOTE: If the image is not loaded and an initialHeight was provided, that height will be used.
     */
    getImageHeight() {
      if (this._image === null) {
        return 0;
      }
      const detectedHeight = this._mipmapData ? this._mipmapData[0].height : ('naturalHeight' in this._image ? this._image.naturalHeight : 0) || this._image.height;
      if (detectedHeight === 0) {
        return this._initialHeight; // either 0 (default), or the overridden value
      } else {
        assert && assert(this._initialHeight === 0 || this._initialHeight === detectedHeight, 'Bad Image.initialHeight');
        return detectedHeight;
      }
    }
    get imageHeight() {
      return this.getImageHeight();
    }

    /**
     * If our provided image is an HTMLImageElement, returns its URL (src). (scenery-internal)
     */
    getImageURL() {
      assert && assert(this._image instanceof HTMLImageElement, 'Only supported for HTML image elements');
      return this._image.src;
    }

    /**
     * Attaches our on-load listener to our current image.
     */
    _attachImageLoadListener() {
      assert && assert(!this._imageLoadListenerAttached, 'Should only be attached to one thing at a time');
      if (!this.isDisposed) {
        this._image.addEventListener('load', this._imageLoadListener);
        this._imageLoadListenerAttached = true;
      }
    }

    /**
     * Detaches our on-load listener from our current image.
     */
    _detachImageLoadListener() {
      assert && assert(this._imageLoadListenerAttached, 'Needs to be attached first to be detached.');
      this._image.removeEventListener('load', this._imageLoadListener);
      this._imageLoadListenerAttached = false;
    }

    /**
     * Called when our image has loaded (it was not yet loaded with then listener was added)
     */
    _onImageLoad() {
      assert && assert(this._imageLoadListenerAttached, 'If _onImageLoad is firing, it should be attached');
      this.invalidateImage();
      this._detachImageLoadListener();
    }

    /**
     * Disposes the path, releasing image listeners if needed (and preventing new listeners from being added).
     */
    dispose() {
      if (this._image && this._imageLoadListenerAttached) {
        this._detachImageLoadListener();
      }
      this._imageProperty.dispose();

      // @ts-expect-error
      super.dispose && super.dispose();
    }
  };
};

/**
 * Optionally returns an ImageData object useful for hit-testing the pixel data of an image.
 *
 * @param image
 * @param width - logical width of the image
 * @param height - logical height of the image
 */
Imageable.getHitTestData = (image, width, height) => {
  // If the image isn't loaded yet, we don't want to try loading anything
  if (!(('naturalWidth' in image ? image.naturalWidth : 0) || image.width) || !(('naturalHeight' in image ? image.naturalHeight : 0) || image.height)) {
    return null;
  }
  const canvas = getScratchCanvas();
  const context = getScratchContext();
  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, width, height);
};

/**
 * Tests whether a given pixel in an ImageData is at all non-transparent.
 *
 * @param imageData
 * @param width - logical width of the image
 * @param height - logical height of the image
 * @param point
 */
Imageable.testHitTestData = (imageData, width, height, point) => {
  // For sanity, map it based on the image dimensions and image data dimensions, and carefully clamp in case things are weird.
  const x = Utils.clamp(Math.floor(point.x / width * imageData.width), 0, imageData.width - 1);
  const y = Utils.clamp(Math.floor(point.y / height * imageData.height), 0, imageData.height - 1);
  const index = 4 * (x + y * imageData.width) + 3;
  return imageData.data[index] !== 0;
};

/**
 * Turns the ImageData into a Shape showing where hit testing would succeed.
 *
 * @param imageData
 * @param width - logical width of the image
 * @param height - logical height of the image
 */
Imageable.hitTestDataToShape = (imageData, width, height) => {
  const widthScale = width / imageData.width;
  const heightScale = height / imageData.height;
  const shape = new Shape();

  // Create rows at a time, so that if we have 50 adjacent pixels "on", then we'll just make a rectangle 50-wide.
  // This lets us do the CAG faster.
  let active = false;
  let min = 0;

  // NOTE: Rows are more helpful for CAG, even though columns would have better cache behavior when accessing the
  // imageData.

  for (let y = 0; y < imageData.height; y++) {
    for (let x = 0; x < imageData.width; x++) {
      const index = 4 * (x + y * imageData.width) + 3;
      if (imageData.data[index] !== 0) {
        // If our last pixel was empty, and now we're "on", start our rectangle
        if (!active) {
          active = true;
          min = x;
        }
      } else if (active) {
        // Finish a rectangle once we reach an "off" pixel
        active = false;
        shape.rect(min * widthScale, y * widthScale, widthScale * (x - min), heightScale);
      }
    }
    if (active) {
      // We'll need to finish rectangles at the end of each row anyway.
      active = false;
      shape.rect(min * widthScale, y * widthScale, widthScale * (imageData.width - min), heightScale);
    }
  }
  return shape.getSimplifiedAreaShape();
};

/**
 * Creates an SVG image element with a given URL and dimensions
 *
 * @param url - The URL for the image
 * @param width - Non-negative integer for the image's width
 * @param height - Non-negative integer for the image's height
 */
Imageable.createSVGImage = (url, width, height) => {
  assert && assert(isFinite(width) && width >= 0 && width % 1 === 0, 'width should be a non-negative finite integer');
  assert && assert(isFinite(height) && height >= 0 && height % 1 === 0, 'height should be a non-negative finite integer');
  const element = document.createElementNS(svgns, 'image');
  element.setAttribute('x', '0');
  element.setAttribute('y', '0');
  element.setAttribute('width', `${width}px`);
  element.setAttribute('height', `${height}px`);
  element.setAttributeNS(xlinkns, 'xlink:href', url);
  return element;
};

/**
 * Creates an object suitable to be passed to Image as a mipmap (from a Canvas)
 */
Imageable.createFastMipmapFromCanvas = baseCanvas => {
  const mipmaps = [];
  const baseURL = baseCanvas.toDataURL();
  const baseImage = new window.Image();
  baseImage.src = baseURL;

  // base level
  mipmaps.push({
    img: baseImage,
    url: baseURL,
    width: baseCanvas.width,
    height: baseCanvas.height,
    canvas: baseCanvas
  });
  let largeCanvas = baseCanvas;
  while (largeCanvas.width >= 2 && largeCanvas.height >= 2) {
    // draw half-size
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(largeCanvas.width / 2);
    canvas.height = Math.ceil(largeCanvas.height / 2);
    const context = canvas.getContext('2d');
    context.setTransform(0.5, 0, 0, 0.5, 0, 0);
    context.drawImage(largeCanvas, 0, 0);

    // smaller level
    const mipmapLevel = {
      width: canvas.width,
      height: canvas.height,
      canvas: canvas,
      url: canvas.toDataURL(),
      img: new window.Image()
    };
    // set up the image and url
    mipmapLevel.img.src = mipmapLevel.url;
    largeCanvas = canvas;
    mipmaps.push(mipmapLevel);
  }
  return mipmaps;
};

/**
 * Returns a sense of "average" scale, which should be exact if there is no asymmetric scale/shear applied
 */
Imageable.getApproximateMatrixScale = matrix => {
  return (Math.sqrt(matrix.m00() * matrix.m00() + matrix.m10() * matrix.m10()) + Math.sqrt(matrix.m01() * matrix.m01() + matrix.m11() * matrix.m11())) / 2;
};

// {number} - We include this for additional smoothing that seems to be needed for Canvas image quality
Imageable.CANVAS_MIPMAP_BIAS_ADJUSTMENT = 0.5;

// {Object} - Initial values for most Node mutator options
Imageable.DEFAULT_OPTIONS = DEFAULT_OPTIONS;
scenery.register('Imageable', Imageable);
export default Imageable;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUaW55RW1pdHRlciIsIlV0aWxzIiwiU2hhcGUiLCJjbGVhbkFycmF5Iiwic2NlbmVyeSIsInN2Z25zIiwieGxpbmtucyIsIlRpbnlGb3J3YXJkaW5nUHJvcGVydHkiLCJsb2cyIiwiTWF0aCIsIngiLCJsb2ciLCJMTjIiLCJERUZBVUxUX09QVElPTlMiLCJpbWFnZU9wYWNpdHkiLCJpbml0aWFsV2lkdGgiLCJpbml0aWFsSGVpZ2h0IiwibWlwbWFwIiwibWlwbWFwQmlhcyIsIm1pcG1hcEluaXRpYWxMZXZlbCIsIm1pcG1hcE1heExldmVsIiwiaGl0VGVzdFBpeGVscyIsInNjcmF0Y2hDYW52YXMiLCJzY3JhdGNoQ29udGV4dCIsImdldFNjcmF0Y2hDYW52YXMiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJnZXRTY3JhdGNoQ29udGV4dCIsImdldENvbnRleHQiLCJ3aWxsUmVhZEZyZXF1ZW50bHkiLCJJbWFnZWFibGUiLCJ0eXBlIiwiSW1hZ2VhYmxlTWl4aW4iLCJjb25zdHJ1Y3RvciIsImFyZ3MiLCJfaW1hZ2VQcm9wZXJ0eSIsIm9uSW1hZ2VQcm9wZXJ0eUNoYW5nZSIsImJpbmQiLCJfaW1hZ2UiLCJfaW5pdGlhbFdpZHRoIiwiX2luaXRpYWxIZWlnaHQiLCJfaW1hZ2VPcGFjaXR5IiwiX21pcG1hcCIsIl9taXBtYXBCaWFzIiwiX21pcG1hcEluaXRpYWxMZXZlbCIsIl9taXBtYXBNYXhMZXZlbCIsIl9oaXRUZXN0UGl4ZWxzIiwiX21pcG1hcENhbnZhc2VzIiwiX21pcG1hcFVSTHMiLCJfbWlwbWFwRGF0YSIsIl9pbWFnZUxvYWRMaXN0ZW5lciIsIl9vbkltYWdlTG9hZCIsIl9pbWFnZUxvYWRMaXN0ZW5lckF0dGFjaGVkIiwiX2hpdFRlc3RJbWFnZURhdGEiLCJtaXBtYXBFbWl0dGVyIiwic2V0SW1hZ2UiLCJpbWFnZSIsImFzc2VydCIsInZhbHVlIiwiZ2V0SW1hZ2UiLCJoYXNJbWFnZUNoYW5nZWQiLCJIVE1MSW1hZ2VFbGVtZW50Iiwic3JjIiwiX2RldGFjaEltYWdlTG9hZExpc3RlbmVyIiwiQXJyYXkiLCJpc0FycmF5IiwiaW1nIiwibGVuZ3RoIiwid2lkdGgiLCJoZWlnaHQiLCJfYXR0YWNoSW1hZ2VMb2FkTGlzdGVuZXIiLCJpbnZhbGlkYXRlSW1hZ2UiLCJzZXRJbWFnZVByb3BlcnR5IiwibmV3VGFyZ2V0Iiwic2V0VGFyZ2V0UHJvcGVydHkiLCJpbWFnZVByb3BlcnR5IiwicHJvcGVydHkiLCJnZXRJbWFnZVByb3BlcnR5IiwiaW52YWxpZGF0ZU1pcG1hcHMiLCJfaW52YWxpZGF0ZUhpdFRlc3REYXRhIiwic2V0SW1hZ2VXaXRoU2l6ZSIsInNldEluaXRpYWxXaWR0aCIsInNldEluaXRpYWxIZWlnaHQiLCJzZXRJbWFnZU9wYWNpdHkiLCJpc0Zpbml0ZSIsImdldEltYWdlT3BhY2l0eSIsImdldEluaXRpYWxXaWR0aCIsImdldEluaXRpYWxIZWlnaHQiLCJzZXRNaXBtYXAiLCJpc01pcG1hcCIsInNldE1pcG1hcEJpYXMiLCJiaWFzIiwiZ2V0TWlwbWFwQmlhcyIsInNldE1pcG1hcEluaXRpYWxMZXZlbCIsImxldmVsIiwiZ2V0TWlwbWFwSW5pdGlhbExldmVsIiwic2V0TWlwbWFwTWF4TGV2ZWwiLCJnZXRNaXBtYXBNYXhMZXZlbCIsInNldEhpdFRlc3RQaXhlbHMiLCJnZXRIaXRUZXN0UGl4ZWxzIiwiX2NvbnN0cnVjdE5leHRNaXBtYXAiLCJiaWdnZXJDYW52YXMiLCJjYW52YXMiLCJjZWlsIiwiY29udGV4dCIsInNjYWxlIiwiZHJhd0ltYWdlIiwicHVzaCIsInRvRGF0YVVSTCIsImsiLCJ1cmwiLCJ1cGRhdGVDYW52YXMiLCJiYXNlQ2FudmFzIiwiZ2V0SW1hZ2VXaWR0aCIsImdldEltYWdlSGVpZ2h0IiwiYmFzZUNvbnRleHQiLCJlbWl0IiwiZ2V0TWlwbWFwTGV2ZWwiLCJtYXRyaXgiLCJhZGRpdGlvbmFsQmlhcyIsImdldEFwcHJveGltYXRlTWF0cml4U2NhbGUiLCJ3aW5kb3ciLCJkZXZpY2VQaXhlbFJhdGlvIiwiZ2V0TWlwbWFwTGV2ZWxGcm9tU2NhbGUiLCJyb3VuZFN5bW1ldHJpYyIsImN1cnJlbnRMZXZlbCIsIm1pbiIsImdldE1pcG1hcENhbnZhcyIsImdldE1pcG1hcFVSTCIsImhhc01pcG1hcHMiLCJnZXRIaXRUZXN0RGF0YSIsImltYWdlV2lkdGgiLCJpbWFnZUhlaWdodCIsImRldGVjdGVkV2lkdGgiLCJuYXR1cmFsV2lkdGgiLCJkZXRlY3RlZEhlaWdodCIsIm5hdHVyYWxIZWlnaHQiLCJnZXRJbWFnZVVSTCIsImlzRGlzcG9zZWQiLCJhZGRFdmVudExpc3RlbmVyIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImRpc3Bvc2UiLCJnZXRJbWFnZURhdGEiLCJ0ZXN0SGl0VGVzdERhdGEiLCJpbWFnZURhdGEiLCJwb2ludCIsImNsYW1wIiwiZmxvb3IiLCJ5IiwiaW5kZXgiLCJkYXRhIiwiaGl0VGVzdERhdGFUb1NoYXBlIiwid2lkdGhTY2FsZSIsImhlaWdodFNjYWxlIiwic2hhcGUiLCJhY3RpdmUiLCJyZWN0IiwiZ2V0U2ltcGxpZmllZEFyZWFTaGFwZSIsImNyZWF0ZVNWR0ltYWdlIiwiZWxlbWVudCIsImNyZWF0ZUVsZW1lbnROUyIsInNldEF0dHJpYnV0ZSIsInNldEF0dHJpYnV0ZU5TIiwiY3JlYXRlRmFzdE1pcG1hcEZyb21DYW52YXMiLCJtaXBtYXBzIiwiYmFzZVVSTCIsImJhc2VJbWFnZSIsIkltYWdlIiwibGFyZ2VDYW52YXMiLCJzZXRUcmFuc2Zvcm0iLCJtaXBtYXBMZXZlbCIsInNxcnQiLCJtMDAiLCJtMTAiLCJtMDEiLCJtMTEiLCJDQU5WQVNfTUlQTUFQX0JJQVNfQURKVVNUTUVOVCIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiSW1hZ2VhYmxlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIwLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIElzb2xhdGVzIEltYWdlIGhhbmRsaW5nIHdpdGggSFRNTC9DYW52YXMgaW1hZ2VzLCB3aXRoIG1pcG1hcHMgYW5kIGdlbmVyYWwgc3VwcG9ydC5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBUaW55RW1pdHRlciBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RpbnlFbWl0dGVyLmpzJztcclxuaW1wb3J0IFV0aWxzIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9VdGlscy5qcyc7XHJcbmltcG9ydCB7IFNoYXBlIH0gZnJvbSAnLi4vLi4vLi4va2l0ZS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IGNsZWFuQXJyYXkgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL2NsZWFuQXJyYXkuanMnO1xyXG5pbXBvcnQgTWF0cml4MyBmcm9tICcuLi8uLi8uLi9kb3QvanMvTWF0cml4My5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IHsgc2NlbmVyeSwgc3ZnbnMsIHhsaW5rbnMgfSBmcm9tICcuLi9pbXBvcnRzLmpzJztcclxuaW1wb3J0IEludGVudGlvbmFsQW55IGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9JbnRlbnRpb25hbEFueS5qcyc7XHJcbmltcG9ydCBURW1pdHRlciBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RFbWl0dGVyLmpzJztcclxuaW1wb3J0IFRpbnlGb3J3YXJkaW5nUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UaW55Rm9yd2FyZGluZ1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IFRSZWFkT25seVByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgVFByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvVFByb3BlcnR5LmpzJztcclxuaW1wb3J0IENvbnN0cnVjdG9yIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9Db25zdHJ1Y3Rvci5qcyc7XHJcblxyXG4vLyBOZWVkIHRvIHBvbHktZmlsbCBvbiBzb21lIGJyb3dzZXJzXHJcbmNvbnN0IGxvZzIgPSBNYXRoLmxvZzIgfHwgZnVuY3Rpb24oIHg6IG51bWJlciApIHsgcmV0dXJuIE1hdGgubG9nKCB4ICkgLyBNYXRoLkxOMjsgfTtcclxuXHJcbmNvbnN0IERFRkFVTFRfT1BUSU9OUyA9IHtcclxuICBpbWFnZU9wYWNpdHk6IDEsXHJcbiAgaW5pdGlhbFdpZHRoOiAwLFxyXG4gIGluaXRpYWxIZWlnaHQ6IDAsXHJcbiAgbWlwbWFwOiBmYWxzZSxcclxuICBtaXBtYXBCaWFzOiAwLFxyXG4gIG1pcG1hcEluaXRpYWxMZXZlbDogNCxcclxuICBtaXBtYXBNYXhMZXZlbDogNSxcclxuICBoaXRUZXN0UGl4ZWxzOiBmYWxzZVxyXG59IGFzIGNvbnN0O1xyXG5cclxuLy8gTGF6eSBzY3JhdGNoIGNhbnZhcy9jb250ZXh0IChzbyB3ZSBkb24ndCBpbmN1ciB0aGUgc3RhcnR1cCBjb3N0IG9mIGNhbnZhcy9jb250ZXh0IGNyZWF0aW9uKVxyXG5sZXQgc2NyYXRjaENhbnZhczogSFRNTENhbnZhc0VsZW1lbnQgfCBudWxsID0gbnVsbDtcclxubGV0IHNjcmF0Y2hDb250ZXh0OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQgfCBudWxsID0gbnVsbDtcclxuY29uc3QgZ2V0U2NyYXRjaENhbnZhcyA9ICgpOiBIVE1MQ2FudmFzRWxlbWVudCA9PiB7XHJcbiAgaWYgKCAhc2NyYXRjaENhbnZhcyApIHtcclxuICAgIHNjcmF0Y2hDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApO1xyXG4gIH1cclxuICByZXR1cm4gc2NyYXRjaENhbnZhcztcclxufTtcclxuY29uc3QgZ2V0U2NyYXRjaENvbnRleHQgPSAoKSA9PiB7XHJcbiAgaWYgKCAhc2NyYXRjaENvbnRleHQgKSB7XHJcbiAgICBzY3JhdGNoQ29udGV4dCA9IGdldFNjcmF0Y2hDYW52YXMoKS5nZXRDb250ZXh0KCAnMmQnLCB7XHJcbiAgICAgIHdpbGxSZWFkRnJlcXVlbnRseTogdHJ1ZVxyXG4gICAgfSApITtcclxuICB9XHJcbiAgcmV0dXJuIHNjcmF0Y2hDb250ZXh0O1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgTWlwbWFwID0ge1xyXG4gIHdpZHRoOiBudW1iZXI7XHJcbiAgaGVpZ2h0OiBudW1iZXI7XHJcbiAgdXJsOiBzdHJpbmc7XHJcbiAgY2FudmFzPzogSFRNTENhbnZhc0VsZW1lbnQ7XHJcbiAgaW1nPzogSFRNTEltYWdlRWxlbWVudDtcclxuICB1cGRhdGVDYW52YXM/OiAoKSA9PiB2b2lkO1xyXG59W107XHJcblxyXG4vKipcclxuICogVGhlIGF2YWlsYWJsZSB3YXlzIHRvIHNwZWNpZnkgYW4gaW1hZ2UgYXMgYW4gaW5wdXQgdG8gSW1hZ2VhYmxlLiBTZWUgb25JbWFnZVByb3BlcnR5Q2hhbmdlKCkgZm9yIHBhcnNpbmcgbG9naWMuXHJcbiAqIFdlIHN1cHBvcnQgYSBmZXcgZGlmZmVyZW50ICdpbWFnZScgdHlwZXMgdGhhdCBjYW4gYmUgcGFzc2VkIGluOlxyXG4gKlxyXG4gKiBIVE1MSW1hZ2VFbGVtZW50IC0gQSBub3JtYWwgSFRNTCA8aW1nPi4gSWYgaXQgaGFzbid0IGJlZW4gZnVsbHkgbG9hZGVkIHlldCwgU2NlbmVyeSB3aWxsIHRha2UgY2FyZSBvZiBhZGRpbmcgYVxyXG4gKiAgIGxpc3RlbmVyIHRoYXQgd2lsbCB1cGRhdGUgU2NlbmVyeSB3aXRoIGl0cyB3aWR0aC9oZWlnaHQgKGFuZCBsb2FkIGl0cyBkYXRhKSB3aGVuIHRoZSBpbWFnZSBpcyBmdWxseSBsb2FkZWQuXHJcbiAqICAgTk9URSB0aGF0IGlmIHlvdSBqdXN0IGNyZWF0ZWQgdGhlIDxpbWc+LCBpdCBwcm9iYWJseSBpc24ndCBsb2FkZWQgeWV0LCBwYXJ0aWN1bGFybHkgaW4gU2FmYXJpLiBJZiB0aGUgSW1hZ2VcclxuICogICBub2RlIGlzIGNvbnN0cnVjdGVkIHdpdGggYW4gPGltZz4gdGhhdCBoYXNuJ3QgZnVsbHkgbG9hZGVkLCBpdCB3aWxsIGhhdmUgYSB3aWR0aCBhbmQgaGVpZ2h0IG9mIDAsIHdoaWNoIG1heVxyXG4gKiAgIGNhdXNlIGlzc3VlcyBpZiB5b3UgYXJlIHVzaW5nIGJvdW5kcyBmb3IgbGF5b3V0LiBQbGVhc2Ugc2VlIGluaXRpYWxXaWR0aC9pbml0aWFsSGVpZ2h0IG5vdGVzIGJlbG93LlxyXG4gKlxyXG4gKiBVUkwgLSBQcm92aWRlIGEge3N0cmluZ30sIGFuZCBTY2VuZXJ5IHdpbGwgYXNzdW1lIGl0IGlzIGEgVVJMLiBUaGlzIGNhbiBiZSBhIG5vcm1hbCBVUkwsIG9yIGEgZGF0YSBVUkksIGJvdGggd2lsbFxyXG4gKiAgIHdvcmsuIFBsZWFzZSBub3RlIHRoYXQgdGhpcyBoYXMgdGhlIHNhbWUgbG9hZGluZy1vcmRlciBpc3N1ZXMgYXMgdXNpbmcgSFRNTEltYWdlRWxlbWVudCwgYnV0IHRoYXQgaXQncyBhbG1vc3RcclxuICogICBhbHdheXMgZ3VhcmFudGVlZCB0byBub3QgaGF2ZSBhIHdpZHRoL2hlaWdodCB3aGVuIHlvdSBjcmVhdGUgdGhlIEltYWdlIG5vZGUuIE5vdGUgdGhhdCBkYXRhIFVSSSBzdXBwb3J0IGZvclxyXG4gKiAgIGZvcm1hdHMgZGVwZW5kcyBvbiB0aGUgYnJvd3NlciAtIG9ubHkgSlBFRyBhbmQgUE5HIGFyZSBzdXBwb3J0ZWQgYnJvYWRseS4gUGxlYXNlIHNlZSBpbml0aWFsV2lkdGgvaW5pdGlhbEhlaWdodFxyXG4gKiAgIG5vdGVzIGJlbG93LlxyXG4gKiAgIEFkZGl0aW9uYWxseSwgbm90ZSB0aGF0IGlmIGEgVVJMIGlzIHByb3ZpZGVkLCBhY2Nlc3NpbmcgaW1hZ2UuZ2V0SW1hZ2UoKSBvciBpbWFnZS5pbWFnZSB3aWxsIHJlc3VsdCBub3QgaW4gdGhlXHJcbiAqICAgb3JpZ2luYWwgVVJMIChjdXJyZW50bHkpLCBidXQgd2l0aCB0aGUgYXV0b21hdGljYWxseSBjcmVhdGVkIEhUTUxJbWFnZUVsZW1lbnQuXHJcbiAqXHJcbiAqIEhUTUxDYW52YXNFbGVtZW50IC0gSXQncyBwb3NzaWJsZSB0byBwYXNzIGFuIEhUTUw1IENhbnZhcyBkaXJlY3RseSBpbnRvIHRoZSBJbWFnZSBub2RlLiBJdCB3aWxsIGltbWVkaWF0ZWx5IGJlXHJcbiAqICAgYXdhcmUgb2YgdGhlIHdpZHRoL2hlaWdodCAoYm91bmRzKSBvZiB0aGUgQ2FudmFzLCBidXQgTk9URSB0aGF0IHRoZSBJbWFnZSBub2RlIHdpbGwgbm90IGxpc3RlbiB0byBDYW52YXMgc2l6ZVxyXG4gKiAgIGNoYW5nZXMuIEl0IGlzIGFzc3VtZWQgdGhhdCBhZnRlciB5b3UgcGFzcyBpbiBhIENhbnZhcyB0byBhbiBJbWFnZSBub2RlIHRoYXQgaXQgd2lsbCBub3QgYmUgbW9kaWZpZWQgZnVydGhlci5cclxuICogICBBZGRpdGlvbmFsbHksIHRoZSBJbWFnZSBub2RlIHdpbGwgb25seSBiZSByZW5kZXJlZCB1c2luZyBDYW52YXMgb3IgV2ViR0wgaWYgYSBDYW52YXMgaXMgdXNlZCBhcyBpbnB1dC5cclxuICpcclxuICogTWlwbWFwIGRhdGEgc3RydWN0dXJlIC0gSW1hZ2Ugc3VwcG9ydHMgYSBtaXBtYXAgZGF0YSBzdHJ1Y3R1cmUgdGhhdCBwcm92aWRlcyByYXN0ZXJpemVkIG1pcG1hcCBsZXZlbHMuIFRoZSAndG9wJ1xyXG4gKiAgIGxldmVsIChsZXZlbCAwKSBpcyB0aGUgZW50aXJlIGZ1bGwtc2l6ZSBpbWFnZSwgYW5kIGV2ZXJ5IG90aGVyIGxldmVsIGlzIHR3aWNlIGFzIHNtYWxsIGluIGV2ZXJ5IGRpcmVjdGlvblxyXG4gKiAgICh+MS80IHRoZSBwaXhlbHMpLCByb3VuZGluZyBkaW1lbnNpb25zIHVwLiBUaGlzIGlzIHVzZWZ1bCBmb3IgYnJvd3NlcnMgdGhhdCBkaXNwbGF5IHRoZSBpbWFnZSBiYWRseSBpZiB0aGVcclxuICogICBpbWFnZSBpcyB0b28gbGFyZ2UuIEluc3RlYWQsIFNjZW5lcnkgd2lsbCBkeW5hbWljYWxseSBwaWNrIHRoZSBtb3N0IGFwcHJvcHJpYXRlIHNpemUgb2YgdGhlIGltYWdlIHRvIHVzZSxcclxuICogICB3aGljaCBpbXByb3ZlcyB0aGUgaW1hZ2UgYXBwZWFyYW5jZS5cclxuICogICBUaGUgcGFzc2VkIGluICdpbWFnZScgc2hvdWxkIGJlIGFuIEFycmF5IG9mIG1pcG1hcCBvYmplY3RzIG9mIHRoZSBmb3JtYXQ6XHJcbiAqICAge1xyXG4gKiAgICAgaW1nOiB7SFRNTEltYWdlRWxlbWVudH0sIC8vIHByZWZlcmFibHkgcHJlbG9hZGVkLCBidXQgaXQgaXNuJ3QgcmVxdWlyZWRcclxuICogICAgIHVybDoge3N0cmluZ30sIC8vIFVSTCAodXN1YWxseSBhIGRhdGEgVVJMKSBmb3IgdGhlIGltYWdlIGxldmVsXHJcbiAqICAgICB3aWR0aDoge251bWJlcn0sIC8vIHdpZHRoIG9mIHRoZSBtaXBtYXAgbGV2ZWwsIGluIHBpeGVsc1xyXG4gKiAgICAgaGVpZ2h0OiB7bnVtYmVyfSAvLyBoZWlnaHQgb2YgdGhlIG1pcG1hcCBsZXZlbCwgaW4gcGl4ZWxzLFxyXG4gKiAgICAgY2FudmFzOiB7SFRNTENhbnZhc0VsZW1lbnR9IC8vIENhbnZhcyBlbGVtZW50IGNvbnRhaW5pbmcgdGhlIGltYWdlIGRhdGEgZm9yIHRoZSBpbWcuXHJcbiAqICAgICBbdXBkYXRlQ2FudmFzXToge2Z1bmN0aW9ufSAvLyBJZiBhdmFpbGFibGUsIHNob3VsZCBiZSBjYWxsZWQgYmVmb3JlIHVzaW5nIHRoZSBDYW52YXMgZGlyZWN0bHkuXHJcbiAqICAgfVxyXG4gKiAgIEF0IGxlYXN0IG9uZSBsZXZlbCBpcyByZXF1aXJlZCAobGV2ZWwgMCksIGFuZCBlYWNoIG1pcG1hcCBsZXZlbCBjb3JyZXNwb25kcyB0byB0aGUgaW5kZXggaW4gdGhlIGFycmF5LCBlLmcuOlxyXG4gKiAgIFtcclxuICogICAgIGxldmVsIDAgKGZ1bGwgc2l6ZSwgZS5nLiAxMDB4NjQpXHJcbiAqICAgICBsZXZlbCAxIChoYWxmIHNpemUsIGUuZy4gNTB4MzIpXHJcbiAqICAgICBsZXZlbCAyIChxdWFydGVyIHNpemUsIGUuZy4gMjV4MTYpXHJcbiAqICAgICBsZXZlbCAzIChlaWdodGggc2l6ZSwgZS5nLiAxM3g4IC0gbm90ZSB0aGUgcm91bmRpbmcgdXApXHJcbiAqICAgICAuLi5cclxuICogICAgIGxldmVsIE4gKHNpbmdsZSBwaXhlbCwgZS5nLiAxeDEgLSB0aGlzIGlzIHRoZSBzbWFsbGVzdCBsZXZlbCBwZXJtaXR0ZWQsIGFuZCB0aGVyZSBzaG91bGQgb25seSBiZSBvbmUpXHJcbiAqICAgXVxyXG4gKiAgIEFkZGl0aW9uYWxseSwgbm90ZSB0aGF0IChjdXJyZW50bHkpIGltYWdlLmdldEltYWdlKCkgd2lsbCByZXR1cm4gdGhlIEhUTUxJbWFnZUVsZW1lbnQgZnJvbSB0aGUgZmlyc3QgbGV2ZWwsXHJcbiAqICAgbm90IHRoZSBtaXBtYXAgZGF0YS5cclxuICpcclxuICogIEFsc28gbm90ZSB0aGF0IGlmIHRoZSB1bmRlcmx5aW5nIGltYWdlIChsaWtlIENhbnZhcyBkYXRhKSBoYXMgY2hhbmdlZCwgaXQgaXMgcmVjb21tZW5kZWQgdG8gY2FsbFxyXG4gKiAgaW52YWxpZGF0ZUltYWdlKCkgaW5zdGVhZCBvZiBjaGFuZ2luZyB0aGUgaW1hZ2UgcmVmZXJlbmNlIChjYWxsaW5nIHNldEltYWdlKCkgbXVsdGlwbGUgdGltZXMpXHJcbiAqL1xyXG5leHBvcnQgdHlwZSBJbWFnZWFibGVJbWFnZSA9IHN0cmluZyB8IEhUTUxJbWFnZUVsZW1lbnQgfCBIVE1MQ2FudmFzRWxlbWVudCB8IE1pcG1hcDtcclxuXHJcbi8vIFRoZSBvdXRwdXQgaW1hZ2UgdHlwZSBmcm9tIHBhcnNpbmcgdGhlIGlucHV0IFwiSW1hZ2VhYmxlSW1hZ2VcIiwgc2VlIG9uSW1hZ2VQcm9wZXJ0eUNoYW5nZSgpXHJcbnR5cGUgUGFyc2VkSW1hZ2UgPSBIVE1MSW1hZ2VFbGVtZW50IHwgSFRNTENhbnZhc0VsZW1lbnQ7XHJcblxyXG5leHBvcnQgdHlwZSBJbWFnZWFibGVPcHRpb25zID0ge1xyXG4gIGltYWdlPzogSW1hZ2VhYmxlSW1hZ2U7XHJcbiAgaW1hZ2VQcm9wZXJ0eT86IFRSZWFkT25seVByb3BlcnR5PEltYWdlYWJsZUltYWdlPjtcclxuICBpbWFnZU9wYWNpdHk/OiBudW1iZXI7XHJcbiAgaW5pdGlhbFdpZHRoPzogbnVtYmVyO1xyXG4gIGluaXRpYWxIZWlnaHQ/OiBudW1iZXI7XHJcbiAgbWlwbWFwPzogYm9vbGVhbjtcclxuICBtaXBtYXBCaWFzPzogbnVtYmVyO1xyXG4gIG1pcG1hcEluaXRpYWxMZXZlbD86IG51bWJlcjtcclxuICBtaXBtYXBNYXhMZXZlbD86IG51bWJlcjtcclxuICBoaXRUZXN0UGl4ZWxzPzogYm9vbGVhbjtcclxufTtcclxuXHJcbi8vIE5vcm1hbGx5IG91ciBwcm9qZWN0IHByZWZlcnMgdHlwZSBhbGlhc2VzIHRvIGludGVyZmFjZXMsIGJ1dCBpbnRlcmZhY2VzIGFyZSBuZWNlc3NhcnkgZm9yIGNvcnJlY3QgdXNhZ2Ugb2YgXCJ0aGlzXCIsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvdGFza3MvaXNzdWVzLzExMzJcclxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9jb25zaXN0ZW50LXR5cGUtZGVmaW5pdGlvbnNcclxuZXhwb3J0IGludGVyZmFjZSBUSW1hZ2VhYmxlIHtcclxuICBfaW1hZ2U6IFBhcnNlZEltYWdlIHwgbnVsbDtcclxuICBfaW1hZ2VPcGFjaXR5OiBudW1iZXI7XHJcbiAgX21pcG1hcDogYm9vbGVhbjtcclxuICBfbWlwbWFwQmlhczogbnVtYmVyO1xyXG4gIF9taXBtYXBJbml0aWFsTGV2ZWw6IG51bWJlcjtcclxuICBfbWlwbWFwTWF4TGV2ZWw6IG51bWJlcjtcclxuICBfaGl0VGVzdFBpeGVsczogYm9vbGVhbjtcclxuICBfbWlwbWFwRGF0YTogTWlwbWFwIHwgbnVsbDtcclxuICBfaGl0VGVzdEltYWdlRGF0YTogSW1hZ2VEYXRhIHwgbnVsbDtcclxuICBtaXBtYXBFbWl0dGVyOiBURW1pdHRlcjtcclxuICBpc0Rpc3Bvc2VkPzogYm9vbGVhbjtcclxuXHJcbiAgc2V0SW1hZ2UoIGltYWdlOiBJbWFnZWFibGVJbWFnZSApOiB0aGlzO1xyXG5cclxuICBzZXQgaW1hZ2UoIHZhbHVlOiBJbWFnZWFibGVJbWFnZSApO1xyXG5cclxuICBnZXQgaW1hZ2UoKTogUGFyc2VkSW1hZ2U7XHJcblxyXG4gIGdldEltYWdlKCk6IFBhcnNlZEltYWdlO1xyXG5cclxuICBzZXRJbWFnZVByb3BlcnR5KCBuZXdUYXJnZXQ6IFRSZWFkT25seVByb3BlcnR5PEltYWdlYWJsZUltYWdlPiB8IG51bGwgKTogbnVsbDtcclxuXHJcbiAgc2V0IGltYWdlUHJvcGVydHkoIHByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxJbWFnZWFibGVJbWFnZT4gfCBudWxsICk7XHJcblxyXG4gIGdldCBpbWFnZVByb3BlcnR5KCk6IFRQcm9wZXJ0eTxJbWFnZWFibGVJbWFnZT47XHJcblxyXG4gIGdldEltYWdlUHJvcGVydHkoKTogVFByb3BlcnR5PEltYWdlYWJsZUltYWdlPjtcclxuXHJcbiAgaW52YWxpZGF0ZUltYWdlKCk6IHZvaWQ7XHJcblxyXG4gIHNldEltYWdlV2l0aFNpemUoIGltYWdlOiBJbWFnZWFibGVJbWFnZSwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIgKTogdGhpcztcclxuXHJcbiAgc2V0SW1hZ2VPcGFjaXR5KCBpbWFnZU9wYWNpdHk6IG51bWJlciApOiB2b2lkO1xyXG5cclxuICBzZXQgaW1hZ2VPcGFjaXR5KCB2YWx1ZTogbnVtYmVyICk7XHJcblxyXG4gIGdldCBpbWFnZU9wYWNpdHkoKTogbnVtYmVyO1xyXG5cclxuICBnZXRJbWFnZU9wYWNpdHkoKTogbnVtYmVyO1xyXG5cclxuICBzZXRJbml0aWFsV2lkdGgoIHdpZHRoOiBudW1iZXIgKTogdGhpcztcclxuXHJcbiAgc2V0IGluaXRpYWxXaWR0aCggdmFsdWU6IG51bWJlciApO1xyXG5cclxuICBnZXQgaW5pdGlhbFdpZHRoKCk6IG51bWJlcjtcclxuXHJcbiAgZ2V0SW5pdGlhbFdpZHRoKCk6IG51bWJlcjtcclxuXHJcbiAgc2V0SW5pdGlhbEhlaWdodCggaGVpZ2h0OiBudW1iZXIgKTogdGhpcztcclxuXHJcbiAgc2V0IGluaXRpYWxIZWlnaHQoIHZhbHVlOiBudW1iZXIgKTtcclxuXHJcbiAgZ2V0IGluaXRpYWxIZWlnaHQoKTogbnVtYmVyO1xyXG5cclxuICBnZXRJbml0aWFsSGVpZ2h0KCk6IG51bWJlcjtcclxuXHJcbiAgc2V0TWlwbWFwKCBtaXBtYXA6IGJvb2xlYW4gKTogdGhpcztcclxuXHJcbiAgc2V0IG1pcG1hcCggdmFsdWU6IGJvb2xlYW4gKTtcclxuXHJcbiAgZ2V0IG1pcG1hcCgpOiBib29sZWFuO1xyXG5cclxuICBpc01pcG1hcCgpOiBib29sZWFuO1xyXG5cclxuICBzZXRNaXBtYXBCaWFzKCBiaWFzOiBudW1iZXIgKTogdGhpcztcclxuXHJcbiAgc2V0IG1pcG1hcEJpYXMoIHZhbHVlOiBudW1iZXIgKTtcclxuXHJcbiAgZ2V0IG1pcG1hcEJpYXMoKTogbnVtYmVyO1xyXG5cclxuICBnZXRNaXBtYXBCaWFzKCk6IG51bWJlcjtcclxuXHJcbiAgc2V0TWlwbWFwSW5pdGlhbExldmVsKCBsZXZlbDogbnVtYmVyICk6IHRoaXM7XHJcblxyXG4gIHNldCBtaXBtYXBJbml0aWFsTGV2ZWwoIHZhbHVlOiBudW1iZXIgKTtcclxuXHJcbiAgZ2V0IG1pcG1hcEluaXRpYWxMZXZlbCgpOiBudW1iZXI7XHJcblxyXG4gIGdldE1pcG1hcEluaXRpYWxMZXZlbCgpOiBudW1iZXI7XHJcblxyXG4gIHNldE1pcG1hcE1heExldmVsKCBsZXZlbDogbnVtYmVyICk6IHRoaXM7XHJcblxyXG4gIHNldCBtaXBtYXBNYXhMZXZlbCggdmFsdWU6IG51bWJlciApO1xyXG5cclxuICBnZXQgbWlwbWFwTWF4TGV2ZWwoKTogbnVtYmVyO1xyXG5cclxuICBnZXRNaXBtYXBNYXhMZXZlbCgpOiBudW1iZXI7XHJcblxyXG4vLyBAbWl4aW4tcHJvdGVjdGVkIC0gbWFkZSBwdWJsaWMgZm9yIHVzZSBpbiB0aGUgbWl4aW4gb25seVxyXG4gIHNldEhpdFRlc3RQaXhlbHMoIGhpdFRlc3RQaXhlbHM6IGJvb2xlYW4gKTogdGhpcztcclxuXHJcbi8vIEBtaXhpbi1wcm90ZWN0ZWQgLSBtYWRlIHB1YmxpYyBmb3IgdXNlIGluIHRoZSBtaXhpbiBvbmx5XHJcbiAgc2V0IGhpdFRlc3RQaXhlbHMoIHZhbHVlOiBib29sZWFuICk7XHJcblxyXG4gIGdldCBoaXRUZXN0UGl4ZWxzKCk6IGJvb2xlYW47XHJcblxyXG4gIGdldEhpdFRlc3RQaXhlbHMoKTogYm9vbGVhbjtcclxuXHJcbiAgaW52YWxpZGF0ZU1pcG1hcHMoKTogdm9pZDtcclxuXHJcbiAgZ2V0TWlwbWFwTGV2ZWwoIG1hdHJpeDogTWF0cml4MywgYWRkaXRpb25hbEJpYXM/OiBudW1iZXIgKTogbnVtYmVyO1xyXG5cclxuICBnZXRNaXBtYXBMZXZlbEZyb21TY2FsZSggc2NhbGU6IG51bWJlciwgYWRkaXRpb25hbEJpYXM/OiBudW1iZXIgKTogbnVtYmVyO1xyXG5cclxuICBnZXRNaXBtYXBDYW52YXMoIGxldmVsOiBudW1iZXIgKTogSFRNTENhbnZhc0VsZW1lbnQ7XHJcblxyXG4gIGdldE1pcG1hcFVSTCggbGV2ZWw6IG51bWJlciApOiBzdHJpbmc7XHJcblxyXG4gIGhhc01pcG1hcHMoKTogYm9vbGVhbjtcclxuXHJcbiAgZ2V0SW1hZ2VXaWR0aCgpOiBudW1iZXI7XHJcblxyXG4gIGdldCBpbWFnZVdpZHRoKCk6IG51bWJlcjtcclxuXHJcbiAgZ2V0SW1hZ2VIZWlnaHQoKTogbnVtYmVyO1xyXG5cclxuICBnZXQgaW1hZ2VIZWlnaHQoKTogbnVtYmVyO1xyXG5cclxuICBnZXRJbWFnZVVSTCgpOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNvbnN0IEltYWdlYWJsZSA9IDxTdXBlclR5cGUgZXh0ZW5kcyBDb25zdHJ1Y3Rvcj4oIHR5cGU6IFN1cGVyVHlwZSApOiBTdXBlclR5cGUgJiBDb25zdHJ1Y3RvcjxUSW1hZ2VhYmxlPiA9PiB7XHJcbiAgcmV0dXJuIGNsYXNzIEltYWdlYWJsZU1peGluIGV4dGVuZHMgdHlwZSBpbXBsZW1lbnRzIFRJbWFnZWFibGUge1xyXG5cclxuICAgIC8vIChzY2VuZXJ5LWludGVybmFsKSBJbnRlcm5hbCBzdGF0ZWZ1bCB2YWx1ZSwgc2VlIG9uSW1hZ2VQcm9wZXJ0eUNoYW5nZSgpXHJcbiAgICBwdWJsaWMgX2ltYWdlOiBQYXJzZWRJbWFnZSB8IG51bGw7XHJcblxyXG4gICAgLy8gRm9yIGltYWdlUHJvcGVydHlcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2ltYWdlUHJvcGVydHk6IFRpbnlGb3J3YXJkaW5nUHJvcGVydHk8SW1hZ2VhYmxlSW1hZ2U+O1xyXG5cclxuICAgIC8vIEludGVybmFsIHN0YXRlZnVsIHZhbHVlLCBzZWUgc2V0SW5pdGlhbFdpZHRoKCkgZm9yIGRvY3VtZW50YXRpb24uXHJcbiAgICBwcml2YXRlIF9pbml0aWFsV2lkdGg6IG51bWJlcjtcclxuXHJcbiAgICAvLyBJbnRlcm5hbCBzdGF0ZWZ1bCB2YWx1ZSwgc2VlIHNldEluaXRpYWxIZWlnaHQoKSBmb3IgZG9jdW1lbnRhdGlvbi5cclxuICAgIHByaXZhdGUgX2luaXRpYWxIZWlnaHQ6IG51bWJlcjtcclxuXHJcbiAgICAvLyAoc2NlbmVyeS1pbnRlcm5hbCkgSW50ZXJuYWwgc3RhdGVmdWwgdmFsdWUsIHNlZSBzZXRJbWFnZU9wYWNpdHkoKSBmb3IgZG9jdW1lbnRhdGlvbi5cclxuICAgIHB1YmxpYyBfaW1hZ2VPcGFjaXR5OiBudW1iZXI7XHJcblxyXG4gICAgLy8gKHNjZW5lcnktaW50ZXJuYWwpIEludGVybmFsIHN0YXRlZnVsIHZhbHVlLCBzZWUgc2V0TWlwbWFwKCkgZm9yIGRvY3VtZW50YXRpb24uXHJcbiAgICBwdWJsaWMgX21pcG1hcDogYm9vbGVhbjtcclxuXHJcbiAgICAvLyAoc2NlbmVyeS1pbnRlcm5hbCkgSW50ZXJuYWwgc3RhdGVmdWwgdmFsdWUsIHNlZSBzZXRNaXBtYXBCaWFzKCkgZm9yIGRvY3VtZW50YXRpb24uXHJcbiAgICBwdWJsaWMgX21pcG1hcEJpYXM6IG51bWJlcjtcclxuXHJcbiAgICAvLyAoc2NlbmVyeS1pbnRlcm5hbCkgSW50ZXJuYWwgc3RhdGVmdWwgdmFsdWUsIHNlZSBzZXRNaXBtYXBJbml0aWFsTGV2ZWwoKSBmb3IgZG9jdW1lbnRhdGlvbi5cclxuICAgIHB1YmxpYyBfbWlwbWFwSW5pdGlhbExldmVsOiBudW1iZXI7XHJcblxyXG4gICAgLy8gKHNjZW5lcnktaW50ZXJuYWwpIEludGVybmFsIHN0YXRlZnVsIHZhbHVlLCBzZWUgc2V0TWlwbWFwTWF4TGV2ZWwoKSBmb3IgZG9jdW1lbnRhdGlvblxyXG4gICAgcHVibGljIF9taXBtYXBNYXhMZXZlbDogbnVtYmVyO1xyXG5cclxuICAgIC8vIEludGVybmFsIHN0YXRlZnVsIHZhbHVlLCBzZWUgc2V0SGl0VGVzdFBpeGVscygpIGZvciBkb2N1bWVudGF0aW9uLlxyXG4gICAgLy8gQG1peGluLXByb3RlY3RlZCAtIG1hZGUgcHVibGljIGZvciB1c2UgaW4gdGhlIG1peGluIG9ubHlcclxuICAgIHB1YmxpYyBfaGl0VGVzdFBpeGVsczogYm9vbGVhbjtcclxuXHJcbiAgICAvLyBBcnJheSBvZiBDYW52YXNlcyBmb3IgZWFjaCBsZXZlbCwgY29uc3RydWN0ZWQgaW50ZXJuYWxseSBzbyB0aGF0IENhbnZhcy1iYXNlZCBkcmF3YWJsZXMgKENhbnZhcywgV2ViR0wpIGNhbiBxdWlja2x5IGRyYXcgbWlwbWFwcy5cclxuICAgIHByaXZhdGUgX21pcG1hcENhbnZhc2VzOiBIVE1MQ2FudmFzRWxlbWVudFtdO1xyXG5cclxuICAgIC8vIEFycmF5IG9mIFVSTHMgZm9yIGVhY2ggbGV2ZWwsIHdoZXJlIGVhY2ggVVJMIHdpbGwgZGlzcGxheSBhbiBpbWFnZSAoYW5kIGlzIHR5cGljYWxseSBhIGRhdGEgVVJJIG9yIGJsb2IgVVJJKSwgc29cclxuICAgIC8vIHRoYXQgd2UgY2FuIGhhbmRsZSBtaXBtYXBzIGluIFNWRyB3aGVyZSBVUkxzIGFyZSByZXF1aXJlZC5cclxuICAgIHByaXZhdGUgX21pcG1hcFVSTHM6IHN0cmluZ1tdO1xyXG5cclxuICAgIC8vIChzY2VuZXJ5LWludGVybmFsKSBNaXBtYXAgZGF0YSBpZiBpdCBpcyBwYXNzZWQgaW50byBvdXIgaW1hZ2UuIFdpbGwgYmUgc3RvcmVkIGhlcmUgZm9yIHByb2Nlc3NpbmdcclxuICAgIHB1YmxpYyBfbWlwbWFwRGF0YTogTWlwbWFwIHwgbnVsbDtcclxuXHJcbiAgICAvLyBMaXN0ZW5lciBmb3IgaW52YWxpZGF0aW5nIG91ciBib3VuZHMgd2hlbmV2ZXIgYW4gaW1hZ2UgaXMgaW52YWxpZGF0ZWQuXHJcbiAgICBwcml2YXRlIF9pbWFnZUxvYWRMaXN0ZW5lcjogKCkgPT4gdm9pZDtcclxuXHJcbiAgICAvLyBXaGV0aGVyIG91ciBfaW1hZ2VMb2FkTGlzdGVuZXIgaGFzIGJlZW4gYXR0YWNoZWQgYXMgYSBsaXN0ZW5lciB0byB0aGUgY3VycmVudCBpbWFnZS5cclxuICAgIHByaXZhdGUgX2ltYWdlTG9hZExpc3RlbmVyQXR0YWNoZWQ6IGJvb2xlYW47XHJcblxyXG4gICAgLy8gVXNlZCBmb3IgcGl4ZWwgaGl0IHRlc3RpbmcuXHJcbiAgICAvLyBAbWl4aW4tcHJvdGVjdGVkIC0gbWFkZSBwdWJsaWMgZm9yIHVzZSBpbiB0aGUgbWl4aW4gb25seVxyXG4gICAgcHVibGljIF9oaXRUZXN0SW1hZ2VEYXRhOiBJbWFnZURhdGEgfCBudWxsO1xyXG5cclxuICAgIC8vIEVtaXRzIHdoZW4gbWlwbWFwcyBhcmUgKHJlKWdlbmVyYXRlZFxyXG4gICAgcHVibGljIG1pcG1hcEVtaXR0ZXI6IFRFbWl0dGVyO1xyXG5cclxuICAgIC8vIEZvciBjb21wYXRpYmlsaXR5XHJcbiAgICBwdWJsaWMgaXNEaXNwb3NlZD86IGJvb2xlYW47XHJcblxyXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKCAuLi5hcmdzOiBJbnRlbnRpb25hbEFueVtdICkge1xyXG5cclxuICAgICAgc3VwZXIoIC4uLmFyZ3MgKTtcclxuXHJcbiAgICAgIC8vIFdlJ2xsIGluaXRpYWxpemUgdGhpcyBieSBtdXRhdGluZy5cclxuICAgICAgdGhpcy5faW1hZ2VQcm9wZXJ0eSA9IG5ldyBUaW55Rm9yd2FyZGluZ1Byb3BlcnR5KCBudWxsIGFzIHVua25vd24gYXMgSW1hZ2VhYmxlSW1hZ2UsIGZhbHNlLCB0aGlzLm9uSW1hZ2VQcm9wZXJ0eUNoYW5nZS5iaW5kKCB0aGlzICkgKTtcclxuXHJcbiAgICAgIHRoaXMuX2ltYWdlID0gbnVsbDtcclxuICAgICAgdGhpcy5faW5pdGlhbFdpZHRoID0gREVGQVVMVF9PUFRJT05TLmluaXRpYWxXaWR0aDtcclxuICAgICAgdGhpcy5faW5pdGlhbEhlaWdodCA9IERFRkFVTFRfT1BUSU9OUy5pbml0aWFsSGVpZ2h0O1xyXG4gICAgICB0aGlzLl9pbWFnZU9wYWNpdHkgPSBERUZBVUxUX09QVElPTlMuaW1hZ2VPcGFjaXR5O1xyXG4gICAgICB0aGlzLl9taXBtYXAgPSBERUZBVUxUX09QVElPTlMubWlwbWFwO1xyXG4gICAgICB0aGlzLl9taXBtYXBCaWFzID0gREVGQVVMVF9PUFRJT05TLm1pcG1hcEJpYXM7XHJcbiAgICAgIHRoaXMuX21pcG1hcEluaXRpYWxMZXZlbCA9IERFRkFVTFRfT1BUSU9OUy5taXBtYXBJbml0aWFsTGV2ZWw7XHJcbiAgICAgIHRoaXMuX21pcG1hcE1heExldmVsID0gREVGQVVMVF9PUFRJT05TLm1pcG1hcE1heExldmVsO1xyXG4gICAgICB0aGlzLl9oaXRUZXN0UGl4ZWxzID0gREVGQVVMVF9PUFRJT05TLmhpdFRlc3RQaXhlbHM7XHJcbiAgICAgIHRoaXMuX21pcG1hcENhbnZhc2VzID0gW107XHJcbiAgICAgIHRoaXMuX21pcG1hcFVSTHMgPSBbXTtcclxuICAgICAgdGhpcy5fbWlwbWFwRGF0YSA9IG51bGw7XHJcbiAgICAgIHRoaXMuX2ltYWdlTG9hZExpc3RlbmVyID0gdGhpcy5fb25JbWFnZUxvYWQuYmluZCggdGhpcyApO1xyXG4gICAgICB0aGlzLl9pbWFnZUxvYWRMaXN0ZW5lckF0dGFjaGVkID0gZmFsc2U7XHJcbiAgICAgIHRoaXMuX2hpdFRlc3RJbWFnZURhdGEgPSBudWxsO1xyXG4gICAgICB0aGlzLm1pcG1hcEVtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXIoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgdGhlIGN1cnJlbnQgaW1hZ2UgdG8gYmUgZGlzcGxheWVkIGJ5IHRoaXMgSW1hZ2Ugbm9kZS4gU2VlIEltYWdlYWJsZUltYWdlIGZvciBkZXRhaWxzIG9uIHByb3ZpZGVkIGltYWdlIHZhbHVlLlxyXG4gICAgICpcclxuICAgICAqL1xyXG4gICAgcHVibGljIHNldEltYWdlKCBpbWFnZTogSW1hZ2VhYmxlSW1hZ2UgKTogdGhpcyB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGltYWdlLCAnaW1hZ2Ugc2hvdWxkIGJlIGF2YWlsYWJsZScgKTtcclxuXHJcbiAgICAgIHRoaXMuX2ltYWdlUHJvcGVydHkudmFsdWUgPSBpbWFnZTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXQgaW1hZ2UoIHZhbHVlOiBJbWFnZWFibGVJbWFnZSApIHsgdGhpcy5zZXRJbWFnZSggdmFsdWUgKTsgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgaW1hZ2UoKTogUGFyc2VkSW1hZ2UgeyByZXR1cm4gdGhpcy5nZXRJbWFnZSgpOyB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IGltYWdlJ3MgcmVwcmVzZW50YXRpb24gYXMgZWl0aGVyIGEgQ2FudmFzIG9yIGltZyBlbGVtZW50LlxyXG4gICAgICpcclxuICAgICAqIE5PVEU6IElmIGEgVVJMIG9yIG1pcG1hcCBkYXRhIHdhcyBwcm92aWRlZCwgdGhpcyBjdXJyZW50bHkgZG9lc24ndCByZXR1cm4gdGhlIG9yaWdpbmFsIGlucHV0IHRvIHNldEltYWdlKCksIGJ1dFxyXG4gICAgICogICAgICAgaW5zdGVhZCBwcm92aWRlcyB0aGUgbWFwcGVkIHJlc3VsdCAob3IgZmlyc3QgbWlwbWFwIGxldmVsJ3MgaW1hZ2UpLiBJZiB5b3UgbmVlZCB0aGUgb3JpZ2luYWwsIHVzZVxyXG4gICAgICogICAgICAgaW1hZ2VQcm9wZXJ0eSBpbnN0ZWFkLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0SW1hZ2UoKTogUGFyc2VkSW1hZ2Uge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9pbWFnZSAhPT0gbnVsbCApO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuX2ltYWdlITtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uSW1hZ2VQcm9wZXJ0eUNoYW5nZSggaW1hZ2U6IEltYWdlYWJsZUltYWdlICk6IHZvaWQge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpbWFnZSwgJ2ltYWdlIHNob3VsZCBiZSBhdmFpbGFibGUnICk7XHJcblxyXG4gICAgICAvLyBHZW5lcmFsbHksIGlmIGEgZGlmZmVyZW50IHZhbHVlIGZvciBpbWFnZSBpcyBwcm92aWRlZCwgaXQgaGFzIGNoYW5nZWRcclxuICAgICAgbGV0IGhhc0ltYWdlQ2hhbmdlZCA9IHRoaXMuX2ltYWdlICE9PSBpbWFnZTtcclxuXHJcbiAgICAgIC8vIEV4Y2VwdCBpbiBzb21lIGNhc2VzLCB3aGVyZSB0aGUgcHJvdmlkZWQgaW1hZ2UgaXMgYSBzdHJpbmcuIElmIG91ciBjdXJyZW50IGltYWdlIGhhcyB0aGUgc2FtZSAuc3JjIGFzIHRoZVxyXG4gICAgICAvLyBcIm5ld1wiIGltYWdlLCBpdCdzIGJhc2ljYWxseSB0aGUgc2FtZSAoYXMgd2UgcHJvbW90ZSBzdHJpbmcgaW1hZ2VzIHRvIEhUTUxJbWFnZUVsZW1lbnRzKS5cclxuICAgICAgaWYgKCBoYXNJbWFnZUNoYW5nZWQgJiYgdHlwZW9mIGltYWdlID09PSAnc3RyaW5nJyAmJiB0aGlzLl9pbWFnZSAmJiB0aGlzLl9pbWFnZSBpbnN0YW5jZW9mIEhUTUxJbWFnZUVsZW1lbnQgJiYgaW1hZ2UgPT09IHRoaXMuX2ltYWdlLnNyYyApIHtcclxuICAgICAgICBoYXNJbWFnZUNoYW5nZWQgPSBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gT3IgaWYgb3VyIGN1cnJlbnQgbWlwbWFwIGRhdGEgaXMgdGhlIHNhbWUgYXMgdGhlIGlucHV0LCB0aGVuIHdlIGFyZW4ndCBjaGFuZ2luZyBpdFxyXG4gICAgICBpZiAoIGhhc0ltYWdlQ2hhbmdlZCAmJiBpbWFnZSA9PT0gdGhpcy5fbWlwbWFwRGF0YSApIHtcclxuICAgICAgICBoYXNJbWFnZUNoYW5nZWQgPSBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCBoYXNJbWFnZUNoYW5nZWQgKSB7XHJcbiAgICAgICAgLy8gUmVzZXQgdGhlIGluaXRpYWwgZGltZW5zaW9ucywgc2luY2Ugd2UgaGF2ZSBhIG5ldyBpbWFnZSB0aGF0IG1heSBoYXZlIGRpZmZlcmVudCBkaW1lbnNpb25zLlxyXG4gICAgICAgIHRoaXMuX2luaXRpYWxXaWR0aCA9IDA7XHJcbiAgICAgICAgdGhpcy5faW5pdGlhbEhlaWdodCA9IDA7XHJcblxyXG4gICAgICAgIC8vIERvbid0IGxlYWsgbWVtb3J5IGJ5IHJlZmVyZW5jaW5nIG9sZCBpbWFnZXNcclxuICAgICAgICBpZiAoIHRoaXMuX2ltYWdlICYmIHRoaXMuX2ltYWdlTG9hZExpc3RlbmVyQXR0YWNoZWQgKSB7XHJcbiAgICAgICAgICB0aGlzLl9kZXRhY2hJbWFnZUxvYWRMaXN0ZW5lcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gY2xlYXIgb2xkIG1pcG1hcCBkYXRhIHJlZmVyZW5jZXNcclxuICAgICAgICB0aGlzLl9taXBtYXBEYXRhID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gQ29udmVydCBzdHJpbmcgPT4gSFRNTEltYWdlRWxlbWVudFxyXG4gICAgICAgIGlmICggdHlwZW9mIGltYWdlID09PSAnc3RyaW5nJyApIHtcclxuICAgICAgICAgIC8vIGNyZWF0ZSBhbiBpbWFnZSB3aXRoIHRoZSBhc3N1bWVkIFVSTFxyXG4gICAgICAgICAgY29uc3Qgc3JjID0gaW1hZ2U7XHJcbiAgICAgICAgICBpbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdpbWcnICk7XHJcbiAgICAgICAgICBpbWFnZS5zcmMgPSBzcmM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEhhbmRsZSB0aGUgcHJvdmlkZWQgbWlwbWFwXHJcbiAgICAgICAgZWxzZSBpZiAoIEFycmF5LmlzQXJyYXkoIGltYWdlICkgKSB7XHJcbiAgICAgICAgICAvLyBtaXBtYXAgZGF0YSFcclxuICAgICAgICAgIHRoaXMuX21pcG1hcERhdGEgPSBpbWFnZTtcclxuICAgICAgICAgIGltYWdlID0gaW1hZ2VbIDAgXS5pbWchOyAvLyBwcmVzdW1lcyB3ZSBhcmUgYWxyZWFkeSBsb2FkZWRcclxuXHJcbiAgICAgICAgICAvLyBmb3JjZSBpbml0aWFsaXphdGlvbiBvZiBtaXBtYXBwaW5nIHBhcmFtZXRlcnMsIHNpbmNlIGludmFsaWRhdGVNaXBtYXBzKCkgaXMgZ3VhcmFudGVlZCB0byBydW4gYmVsb3dcclxuICAgICAgICAgIHRoaXMuX21pcG1hcEluaXRpYWxMZXZlbCA9IHRoaXMuX21pcG1hcE1heExldmVsID0gdGhpcy5fbWlwbWFwRGF0YS5sZW5ndGg7XHJcbiAgICAgICAgICB0aGlzLl9taXBtYXAgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gV2UgcnVsZWQgb3V0IHRoZSBzdHJpbmcgfCBNaXBtYXAgY2FzZXMgYWJvdmVcclxuICAgICAgICB0aGlzLl9pbWFnZSA9IGltYWdlO1xyXG5cclxuICAgICAgICAvLyBJZiBvdXIgaW1hZ2UgaXMgYW4gSFRNTCBpbWFnZSB0aGF0IGhhc24ndCBsb2FkZWQgeWV0LCBhdHRhY2ggYSBsb2FkIGxpc3RlbmVyLlxyXG4gICAgICAgIGlmICggdGhpcy5faW1hZ2UgaW5zdGFuY2VvZiBIVE1MSW1hZ2VFbGVtZW50ICYmICggIXRoaXMuX2ltYWdlLndpZHRoIHx8ICF0aGlzLl9pbWFnZS5oZWlnaHQgKSApIHtcclxuICAgICAgICAgIHRoaXMuX2F0dGFjaEltYWdlTG9hZExpc3RlbmVyKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBUcnkgcmVjb21wdXRpbmcgYm91bmRzIChtYXkgZ2l2ZSBhIDB4MCBpZiB3ZSBhcmVuJ3QgeWV0IGxvYWRlZClcclxuICAgICAgICB0aGlzLmludmFsaWRhdGVJbWFnZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZWUgZG9jdW1lbnRhdGlvbiBmb3IgTm9kZS5zZXRWaXNpYmxlUHJvcGVydHksIGV4Y2VwdCB0aGlzIGlzIGZvciB0aGUgaW1hZ2VcclxuICAgICAqL1xyXG4gICAgcHVibGljIHNldEltYWdlUHJvcGVydHkoIG5ld1RhcmdldDogVFJlYWRPbmx5UHJvcGVydHk8SW1hZ2VhYmxlSW1hZ2U+IHwgbnVsbCApOiBudWxsIHtcclxuICAgICAgLy8gVGhpcyBpcyBhd2t3YXJkLCB3ZSBhcmUgTk9UIGd1YXJhbnRlZWQgYSBOb2RlLlxyXG4gICAgICByZXR1cm4gdGhpcy5faW1hZ2VQcm9wZXJ0eS5zZXRUYXJnZXRQcm9wZXJ0eSggbmV3VGFyZ2V0IGFzIFRQcm9wZXJ0eTxJbWFnZWFibGVJbWFnZT4gKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0IGltYWdlUHJvcGVydHkoIHByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxJbWFnZWFibGVJbWFnZT4gfCBudWxsICkgeyB0aGlzLnNldEltYWdlUHJvcGVydHkoIHByb3BlcnR5ICk7IH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGltYWdlUHJvcGVydHkoKTogVFByb3BlcnR5PEltYWdlYWJsZUltYWdlPiB7IHJldHVybiB0aGlzLmdldEltYWdlUHJvcGVydHkoKTsgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTGlrZSBOb2RlLmdldFZpc2libGVQcm9wZXJ0eSgpLCBidXQgZm9yIHRoZSBpbWFnZS4gTm90ZSB0aGlzIGlzIG5vdCB0aGUgc2FtZSBhcyB0aGUgUHJvcGVydHkgcHJvdmlkZWQgaW5cclxuICAgICAqIHNldEltYWdlUHJvcGVydHkuIFRodXMgaXMgdGhlIG5hdHVyZSBvZiBUaW55Rm9yd2FyZGluZ1Byb3BlcnR5LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0SW1hZ2VQcm9wZXJ0eSgpOiBUUHJvcGVydHk8SW1hZ2VhYmxlSW1hZ2U+IHtcclxuICAgICAgcmV0dXJuIHRoaXMuX2ltYWdlUHJvcGVydHk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmlnZ2VycyByZWNvbXB1dGF0aW9uIG9mIHRoZSBpbWFnZSdzIGJvdW5kcyBhbmQgcmVmcmVzaGVzIGFueSBkaXNwbGF5cyBvdXRwdXQgb2YgdGhlIGltYWdlLlxyXG4gICAgICpcclxuICAgICAqIEdlbmVyYWxseSB0aGlzIGNhbiB0cmlnZ2VyIHJlY29tcHV0YXRpb24gb2YgbWlwbWFwcywgd2lsbCBtYXJrIGFueSBkcmF3YWJsZXMgYXMgbmVlZGluZyByZXBhaW50cywgYW5kIHdpbGxcclxuICAgICAqIGNhdXNlIGEgc3ByaXRlc2hlZXQgY2hhbmdlIGZvciBXZWJHTC5cclxuICAgICAqXHJcbiAgICAgKiBUaGlzIHNob3VsZCBiZSBkb25lIHdoZW4gdGhlIHVuZGVybHlpbmcgaW1hZ2UgaGFzIGNoYW5nZWQgYXBwZWFyYW5jZSAodXN1YWxseSB0aGUgY2FzZSB3aXRoIGEgQ2FudmFzIGNoYW5naW5nLFxyXG4gICAgICogYnV0IHRoaXMgaXMgYWxzbyB0cmlnZ2VyZWQgYnkgb3VyIGFjdHVhbCBpbWFnZSByZWZlcmVuY2UgY2hhbmdpbmcpLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgaW52YWxpZGF0ZUltYWdlKCk6IHZvaWQge1xyXG4gICAgICB0aGlzLmludmFsaWRhdGVNaXBtYXBzKCk7XHJcbiAgICAgIHRoaXMuX2ludmFsaWRhdGVIaXRUZXN0RGF0YSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0cyB0aGUgaW1hZ2Ugd2l0aCBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIGFib3V0IGRpbWVuc2lvbnMgdXNlZCBiZWZvcmUgdGhlIGltYWdlIGhhcyBsb2FkZWQuXHJcbiAgICAgKlxyXG4gICAgICogVGhpcyBpcyBlc3NlbnRpYWxseSB0aGUgc2FtZSBhcyBzZXRJbWFnZSgpLCBidXQgYWxzbyB1cGRhdGVzIHRoZSBpbml0aWFsIGRpbWVuc2lvbnMuIFNlZSBzZXRJbWFnZSgpJ3NcclxuICAgICAqIGRvY3VtZW50YXRpb24gZm9yIGRldGFpbHMgb24gdGhlIGltYWdlIHBhcmFtZXRlci5cclxuICAgICAqXHJcbiAgICAgKiBOT1RFOiBzZXRJbWFnZSgpIHdpbGwgZmlyc3QgcmVzZXQgdGhlIGluaXRpYWwgZGltZW5zaW9ucyB0byAwLCB3aGljaCB3aWxsIHRoZW4gYmUgb3ZlcnJpZGRlbiBsYXRlciBpbiB0aGlzXHJcbiAgICAgKiAgICAgICBmdW5jdGlvbi4gVGhpcyBtYXkgdHJpZ2dlciBib3VuZHMgY2hhbmdlcywgZXZlbiBpZiB0aGUgcHJldmlvdXMgYW5kIG5leHQgaW1hZ2UgKGFuZCBpbWFnZSBkaW1lbnNpb25zKVxyXG4gICAgICogICAgICAgYXJlIHRoZSBzYW1lLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBpbWFnZSAtIFNlZSBJbWFnZWFibGVJbWFnZSdzIHR5cGUgZG9jdW1lbnRhdGlvblxyXG4gICAgICogQHBhcmFtIHdpZHRoIC0gSW5pdGlhbCB3aWR0aCBvZiB0aGUgaW1hZ2UuIFNlZSBzZXRJbml0aWFsV2lkdGgoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgICAgKiBAcGFyYW0gaGVpZ2h0IC0gSW5pdGlhbCBoZWlnaHQgb2YgdGhlIGltYWdlLiBTZWUgc2V0SW5pdGlhbEhlaWdodCgpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAgICAqL1xyXG4gICAgcHVibGljIHNldEltYWdlV2l0aFNpemUoIGltYWdlOiBJbWFnZWFibGVJbWFnZSwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICAgIC8vIEZpcnN0LCBzZXRJbWFnZSgpLCBhcyBpdCB3aWxsIHJlc2V0IHRoZSBpbml0aWFsIHdpZHRoIGFuZCBoZWlnaHRcclxuICAgICAgdGhpcy5zZXRJbWFnZSggaW1hZ2UgKTtcclxuXHJcbiAgICAgIC8vIFRoZW4gYXBwbHkgdGhlIGluaXRpYWwgZGltZW5zaW9uc1xyXG4gICAgICB0aGlzLnNldEluaXRpYWxXaWR0aCggd2lkdGggKTtcclxuICAgICAgdGhpcy5zZXRJbml0aWFsSGVpZ2h0KCBoZWlnaHQgKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0cyBhbiBvcGFjaXR5IHRoYXQgaXMgYXBwbGllZCBvbmx5IHRvIHRoaXMgaW1hZ2UgKHdpbGwgbm90IGFmZmVjdCBjaGlsZHJlbiBvciB0aGUgcmVzdCBvZiB0aGUgbm9kZSdzIHN1YnRyZWUpLlxyXG4gICAgICpcclxuICAgICAqIFRoaXMgc2hvdWxkIGdlbmVyYWxseSBiZSBwcmVmZXJyZWQgb3ZlciBOb2RlJ3Mgb3BhY2l0eSBpZiBpdCBoYXMgdGhlIHNhbWUgcmVzdWx0LCBhcyBtb2RpZnlpbmcgdGhpcyB3aWxsIGJlIG11Y2hcclxuICAgICAqIGZhc3RlciwgYW5kIHdpbGwgbm90IGZvcmNlIGFkZGl0aW9uYWwgQ2FudmFzZXMgb3IgaW50ZXJtZWRpYXRlIHN0ZXBzIGluIGRpc3BsYXkuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIGltYWdlT3BhY2l0eSAtIFNob3VsZCBiZSBhIG51bWJlciBiZXR3ZWVuIDAgKHRyYW5zcGFyZW50KSBhbmQgMSAob3BhcXVlKSwganVzdCBsaWtlIG5vcm1hbFxyXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wYWNpdHkuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzZXRJbWFnZU9wYWNpdHkoIGltYWdlT3BhY2l0eTogbnVtYmVyICk6IHZvaWQge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggaW1hZ2VPcGFjaXR5ICkgJiYgaW1hZ2VPcGFjaXR5ID49IDAgJiYgaW1hZ2VPcGFjaXR5IDw9IDEsXHJcbiAgICAgICAgYGltYWdlT3BhY2l0eSBvdXQgb2YgcmFuZ2U6ICR7aW1hZ2VPcGFjaXR5fWAgKTtcclxuXHJcbiAgICAgIGlmICggdGhpcy5faW1hZ2VPcGFjaXR5ICE9PSBpbWFnZU9wYWNpdHkgKSB7XHJcbiAgICAgICAgdGhpcy5faW1hZ2VPcGFjaXR5ID0gaW1hZ2VPcGFjaXR5O1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldCBpbWFnZU9wYWNpdHkoIHZhbHVlOiBudW1iZXIgKSB7IHRoaXMuc2V0SW1hZ2VPcGFjaXR5KCB2YWx1ZSApOyB9XHJcblxyXG4gICAgcHVibGljIGdldCBpbWFnZU9wYWNpdHkoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0SW1hZ2VPcGFjaXR5KCk7IH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIG9wYWNpdHkgYXBwbGllZCBvbmx5IHRvIHRoaXMgaW1hZ2UgKG5vdCBpbmNsdWRpbmcgY2hpbGRyZW4pLlxyXG4gICAgICpcclxuICAgICAqIFNlZSBzZXRJbWFnZU9wYWNpdHkoKSBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0SW1hZ2VPcGFjaXR5KCk6IG51bWJlciB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9pbWFnZU9wYWNpdHk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQcm92aWRlcyBhbiBpbml0aWFsIHdpZHRoIGZvciBhbiBpbWFnZSB0aGF0IGhhcyBub3QgbG9hZGVkIHlldC5cclxuICAgICAqXHJcbiAgICAgKiBJZiB0aGUgaW5wdXQgaW1hZ2UgaGFzbid0IGxvYWRlZCB5ZXQsIGJ1dCB0aGUgKGV4cGVjdGVkKSBzaXplIGlzIGtub3duLCBwcm92aWRpbmcgYW4gaW5pdGlhbFdpZHRoIHdpbGwgY2F1c2UgdGhlXHJcbiAgICAgKiBJbWFnZSBub2RlIHRvIGhhdmUgdGhlIGNvcnJlY3QgYm91bmRzICh3aWR0aCkgYmVmb3JlIHRoZSBwaXhlbCBkYXRhIGhhcyBiZWVuIGZ1bGx5IGxvYWRlZC4gQSB2YWx1ZSBvZiAwIHdpbGwgYmVcclxuICAgICAqIGlnbm9yZWQuXHJcbiAgICAgKlxyXG4gICAgICogVGhpcyBpcyByZXF1aXJlZCBmb3IgbWFueSBicm93c2VycywgYXMgaW1hZ2VzIGNhbiBzaG93IHVwIGFzIGEgMHgwIChsaWtlIFNhZmFyaSBkb2VzIGZvciB1bmxvYWRlZCBpbWFnZXMpLlxyXG4gICAgICpcclxuICAgICAqIE5PVEU6IHNldEltYWdlIHdpbGwgcmVzZXQgdGhpcyB2YWx1ZSB0byAwIChpZ25vcmVkKSwgc2luY2UgaXQncyBwb3RlbnRpYWxseSBsaWtlbHkgdGhlIG5ldyBpbWFnZSBoYXMgZGlmZmVyZW50XHJcbiAgICAgKiAgICAgICBkaW1lbnNpb25zIHRoYW4gdGhlIGN1cnJlbnQgaW1hZ2UuXHJcbiAgICAgKlxyXG4gICAgICogTk9URTogSWYgdGhlc2UgZGltZW5zaW9ucyBlbmQgdXAgYmVpbmcgZGlmZmVyZW50IHRoYW4gdGhlIGFjdHVhbCBpbWFnZSB3aWR0aC9oZWlnaHQgb25jZSBpdCBoYXMgYmVlbiBsb2FkZWQsIGFuXHJcbiAgICAgKiAgICAgICBhc3NlcnRpb24gd2lsbCBmYWlsLiBPbmx5IHRoZSBjb3JyZWN0IGRpbWVuc2lvbnMgc2hvdWxkIGJlIHByb3ZpZGVkLiBJZiB0aGUgd2lkdGgvaGVpZ2h0IGlzIHVua25vd24sXHJcbiAgICAgKiAgICAgICBwbGVhc2UgdXNlIHRoZSBsb2NhbEJvdW5kcyBvdmVycmlkZSBvciBhIHRyYW5zcGFyZW50IHJlY3RhbmdsZSBmb3IgdGFraW5nIHVwIHRoZSAoYXBwcm94aW1hdGUpIGJvdW5kcy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gd2lkdGggLSBFeHBlY3RlZCB3aWR0aCBvZiB0aGUgaW1hZ2UncyB1bmxvYWRlZCBjb250ZW50XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzZXRJbml0aWFsV2lkdGgoIHdpZHRoOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHdpZHRoID49IDAgJiYgKCB3aWR0aCAlIDEgPT09IDAgKSwgJ2luaXRpYWxXaWR0aCBzaG91bGQgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlcicgKTtcclxuXHJcbiAgICAgIGlmICggd2lkdGggIT09IHRoaXMuX2luaXRpYWxXaWR0aCApIHtcclxuICAgICAgICB0aGlzLl9pbml0aWFsV2lkdGggPSB3aWR0aDtcclxuXHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlSW1hZ2UoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldCBpbml0aWFsV2lkdGgoIHZhbHVlOiBudW1iZXIgKSB7IHRoaXMuc2V0SW5pdGlhbFdpZHRoKCB2YWx1ZSApOyB9XHJcblxyXG4gICAgcHVibGljIGdldCBpbml0aWFsV2lkdGgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0SW5pdGlhbFdpZHRoKCk7IH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIGluaXRpYWxXaWR0aCB2YWx1ZSBzZXQgZnJvbSBzZXRJbml0aWFsV2lkdGgoKS5cclxuICAgICAqXHJcbiAgICAgKiBTZWUgc2V0SW5pdGlhbFdpZHRoKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvbi4gQSB2YWx1ZSBvZiAwIGlzIGlnbm9yZWQuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXRJbml0aWFsV2lkdGgoKTogbnVtYmVyIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX2luaXRpYWxXaWR0aDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFByb3ZpZGVzIGFuIGluaXRpYWwgaGVpZ2h0IGZvciBhbiBpbWFnZSB0aGF0IGhhcyBub3QgbG9hZGVkIHlldC5cclxuICAgICAqXHJcbiAgICAgKiBJZiB0aGUgaW5wdXQgaW1hZ2UgaGFzbid0IGxvYWRlZCB5ZXQsIGJ1dCB0aGUgKGV4cGVjdGVkKSBzaXplIGlzIGtub3duLCBwcm92aWRpbmcgYW4gaW5pdGlhbFdpZHRoIHdpbGwgY2F1c2UgdGhlXHJcbiAgICAgKiBJbWFnZSBub2RlIHRvIGhhdmUgdGhlIGNvcnJlY3QgYm91bmRzIChoZWlnaHQpIGJlZm9yZSB0aGUgcGl4ZWwgZGF0YSBoYXMgYmVlbiBmdWxseSBsb2FkZWQuIEEgdmFsdWUgb2YgMCB3aWxsIGJlXHJcbiAgICAgKiBpZ25vcmVkLlxyXG4gICAgICpcclxuICAgICAqIFRoaXMgaXMgcmVxdWlyZWQgZm9yIG1hbnkgYnJvd3NlcnMsIGFzIGltYWdlcyBjYW4gc2hvdyB1cCBhcyBhIDB4MCAobGlrZSBTYWZhcmkgZG9lcyBmb3IgdW5sb2FkZWQgaW1hZ2VzKS5cclxuICAgICAqXHJcbiAgICAgKiBOT1RFOiBzZXRJbWFnZSB3aWxsIHJlc2V0IHRoaXMgdmFsdWUgdG8gMCAoaWdub3JlZCksIHNpbmNlIGl0J3MgcG90ZW50aWFsbHkgbGlrZWx5IHRoZSBuZXcgaW1hZ2UgaGFzIGRpZmZlcmVudFxyXG4gICAgICogICAgICAgZGltZW5zaW9ucyB0aGFuIHRoZSBjdXJyZW50IGltYWdlLlxyXG4gICAgICpcclxuICAgICAqIE5PVEU6IElmIHRoZXNlIGRpbWVuc2lvbnMgZW5kIHVwIGJlaW5nIGRpZmZlcmVudCB0aGFuIHRoZSBhY3R1YWwgaW1hZ2Ugd2lkdGgvaGVpZ2h0IG9uY2UgaXQgaGFzIGJlZW4gbG9hZGVkLCBhblxyXG4gICAgICogICAgICAgYXNzZXJ0aW9uIHdpbGwgZmFpbC4gT25seSB0aGUgY29ycmVjdCBkaW1lbnNpb25zIHNob3VsZCBiZSBwcm92aWRlZC4gSWYgdGhlIHdpZHRoL2hlaWdodCBpcyB1bmtub3duLFxyXG4gICAgICogICAgICAgcGxlYXNlIHVzZSB0aGUgbG9jYWxCb3VuZHMgb3ZlcnJpZGUgb3IgYSB0cmFuc3BhcmVudCByZWN0YW5nbGUgZm9yIHRha2luZyB1cCB0aGUgKGFwcHJveGltYXRlKSBib3VuZHMuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIGhlaWdodCAtIEV4cGVjdGVkIGhlaWdodCBvZiB0aGUgaW1hZ2UncyB1bmxvYWRlZCBjb250ZW50XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzZXRJbml0aWFsSGVpZ2h0KCBoZWlnaHQ6IG51bWJlciApOiB0aGlzIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggaGVpZ2h0ID49IDAgJiYgKCBoZWlnaHQgJSAxID09PSAwICksICdpbml0aWFsSGVpZ2h0IHNob3VsZCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyJyApO1xyXG5cclxuICAgICAgaWYgKCBoZWlnaHQgIT09IHRoaXMuX2luaXRpYWxIZWlnaHQgKSB7XHJcbiAgICAgICAgdGhpcy5faW5pdGlhbEhlaWdodCA9IGhlaWdodDtcclxuXHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlSW1hZ2UoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldCBpbml0aWFsSGVpZ2h0KCB2YWx1ZTogbnVtYmVyICkgeyB0aGlzLnNldEluaXRpYWxIZWlnaHQoIHZhbHVlICk7IH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGluaXRpYWxIZWlnaHQoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0SW5pdGlhbEhlaWdodCgpOyB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBpbml0aWFsSGVpZ2h0IHZhbHVlIHNldCBmcm9tIHNldEluaXRpYWxIZWlnaHQoKS5cclxuICAgICAqXHJcbiAgICAgKiBTZWUgc2V0SW5pdGlhbEhlaWdodCgpIGZvciBtb3JlIGRvY3VtZW50YXRpb24uIEEgdmFsdWUgb2YgMCBpcyBpZ25vcmVkLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0SW5pdGlhbEhlaWdodCgpOiBudW1iZXIge1xyXG4gICAgICByZXR1cm4gdGhpcy5faW5pdGlhbEhlaWdodDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgd2hldGhlciBtaXBtYXBwaW5nIGlzIHN1cHBvcnRlZC5cclxuICAgICAqXHJcbiAgICAgKiBUaGlzIGRlZmF1bHRzIHRvIGZhbHNlLCBidXQgaXMgYXV0b21hdGljYWxseSBzZXQgdG8gdHJ1ZSB3aGVuIGEgbWlwbWFwIGlzIHByb3ZpZGVkIHRvIHNldEltYWdlKCkuIFNldHRpbmcgaXQgdG9cclxuICAgICAqIHRydWUgb24gbm9uLW1pcG1hcCBpbWFnZXMgd2lsbCB0cmlnZ2VyIGNyZWF0aW9uIG9mIGEgbWVkaXVtLXF1YWxpdHkgbWlwbWFwIHRoYXQgd2lsbCBiZSB1c2VkLlxyXG4gICAgICpcclxuICAgICAqIE5PVEU6IFRoaXMgbWlwbWFwIGdlbmVyYXRpb24gaXMgc2xvdyBhbmQgQ1BVLWludGVuc2l2ZS4gUHJvdmlkaW5nIHByZWNvbXB1dGVkIG1pcG1hcCByZXNvdXJjZXMgdG8gYW4gSW1hZ2Ugbm9kZVxyXG4gICAgICogICAgICAgd2lsbCBiZSBtdWNoIGZhc3RlciwgYW5kIG9mIGhpZ2hlciBxdWFsaXR5LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBtaXBtYXAgLSBXaGV0aGVyIG1pcG1hcHBpbmcgaXMgc3VwcG9ydGVkXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzZXRNaXBtYXAoIG1pcG1hcDogYm9vbGVhbiApOiB0aGlzIHtcclxuICAgICAgaWYgKCB0aGlzLl9taXBtYXAgIT09IG1pcG1hcCApIHtcclxuICAgICAgICB0aGlzLl9taXBtYXAgPSBtaXBtYXA7XHJcblxyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZU1pcG1hcHMoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldCBtaXBtYXAoIHZhbHVlOiBib29sZWFuICkgeyB0aGlzLnNldE1pcG1hcCggdmFsdWUgKTsgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgbWlwbWFwKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5pc01pcG1hcCgpOyB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgbWlwbWFwcGluZyBpcyBzdXBwb3J0ZWQuXHJcbiAgICAgKlxyXG4gICAgICogU2VlIHNldE1pcG1hcCgpIGZvciBtb3JlIGRvY3VtZW50YXRpb24uXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBpc01pcG1hcCgpOiBib29sZWFuIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX21pcG1hcDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgaG93IG11Y2ggbGV2ZWwtb2YtZGV0YWlsIGlzIGRpc3BsYXllZCBmb3IgbWlwbWFwcGluZy5cclxuICAgICAqXHJcbiAgICAgKiBXaGVuIGRpc3BsYXlpbmcgbWlwbWFwcGVkIGltYWdlcyBhcyBvdXRwdXQsIGEgY2VydGFpbiBzb3VyY2UgbGV2ZWwgb2YgdGhlIG1pcG1hcCBuZWVkcyB0byBiZSB1c2VkLiBVc2luZyBhIGxldmVsXHJcbiAgICAgKiB3aXRoIHRvbyBtdWNoIHJlc29sdXRpb24gY2FuIGNyZWF0ZSBhbiBhbGlhc2VkIGxvb2sgKGJ1dCB3aWxsIGdlbmVyYWxseSBiZSBzaGFycGVyKS4gVXNpbmcgYSBsZXZlbCB3aXRoIHRvb1xyXG4gICAgICogbGl0dGxlIHJlc29sdXRpb24gd2lsbCBiZSBibHVycmllciAoYnV0IG5vdCBhbGlhc2VkKS5cclxuICAgICAqXHJcbiAgICAgKiBUaGUgdmFsdWUgb2YgdGhlIG1pcG1hcCBiaWFzIGlzIGFkZGVkIG9uIHRvIHRoZSBjb21wdXRlZCBcImlkZWFsXCIgbWlwbWFwIGxldmVsLCBhbmQ6XHJcbiAgICAgKiAtIEEgbmVnYXRpdmUgYmlhcyB3aWxsIHR5cGljYWxseSBpbmNyZWFzZSB0aGUgZGlzcGxheWVkIHJlc29sdXRpb25cclxuICAgICAqIC0gQSBwb3NpdGl2ZSBiaWFzIHdpbGwgdHlwaWNhbGx5IGRlY3JlYXNlIHRoZSBkaXNwbGF5ZWQgcmVzb2x1dGlvblxyXG4gICAgICpcclxuICAgICAqIFRoaXMgaXMgZG9uZSBhcHByb3hpbWF0ZWx5IGxpa2UgdGhlIGZvbGxvd2luZyBmb3JtdWxhOlxyXG4gICAgICogICBtaXBtYXBMZXZlbCA9IFV0aWxzLnJvdW5kU3ltbWV0cmljKCBjb21wdXRlZE1pcG1hcExldmVsICsgbWlwbWFwQmlhcyApXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzZXRNaXBtYXBCaWFzKCBiaWFzOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICAgIGlmICggdGhpcy5fbWlwbWFwQmlhcyAhPT0gYmlhcyApIHtcclxuICAgICAgICB0aGlzLl9taXBtYXBCaWFzID0gYmlhcztcclxuXHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlTWlwbWFwcygpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0IG1pcG1hcEJpYXMoIHZhbHVlOiBudW1iZXIgKSB7IHRoaXMuc2V0TWlwbWFwQmlhcyggdmFsdWUgKTsgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgbWlwbWFwQmlhcygpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRNaXBtYXBCaWFzKCk7IH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgbWlwbWFwIGJpYXMuXHJcbiAgICAgKlxyXG4gICAgICogU2VlIHNldE1pcG1hcEJpYXMoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0TWlwbWFwQmlhcygpOiBudW1iZXIge1xyXG4gICAgICByZXR1cm4gdGhpcy5fbWlwbWFwQmlhcztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBudW1iZXIgb2YgaW5pdGlhbCBtaXBtYXAgbGV2ZWxzIHRvIGNvbXB1dGUgKGlmIFNjZW5lcnkgZ2VuZXJhdGVzIHRoZSBtaXBtYXBzIGJ5IHNldHRpbmcgbWlwbWFwOnRydWUgb24gYVxyXG4gICAgICogbm9uLW1pcG1hcHBlZCBpbnB1dCkuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIGxldmVsIC0gQSBub24tbmVnYXRpdmUgaW50ZWdlciByZXByZXNlbnRpbmcgdGhlIG51bWJlciBvZiBtaXBtYXAgbGV2ZWxzIHRvIHByZWNvbXB1dGUuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzZXRNaXBtYXBJbml0aWFsTGV2ZWwoIGxldmVsOiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGxldmVsICUgMSA9PT0gMCAmJiBsZXZlbCA+PSAwLFxyXG4gICAgICAgICdtaXBtYXBJbml0aWFsTGV2ZWwgc2hvdWxkIGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXInICk7XHJcblxyXG4gICAgICBpZiAoIHRoaXMuX21pcG1hcEluaXRpYWxMZXZlbCAhPT0gbGV2ZWwgKSB7XHJcbiAgICAgICAgdGhpcy5fbWlwbWFwSW5pdGlhbExldmVsID0gbGV2ZWw7XHJcblxyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZU1pcG1hcHMoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldCBtaXBtYXBJbml0aWFsTGV2ZWwoIHZhbHVlOiBudW1iZXIgKSB7IHRoaXMuc2V0TWlwbWFwSW5pdGlhbExldmVsKCB2YWx1ZSApOyB9XHJcblxyXG4gICAgcHVibGljIGdldCBtaXBtYXBJbml0aWFsTGV2ZWwoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuZ2V0TWlwbWFwSW5pdGlhbExldmVsKCk7IH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgaW5pdGlhbCBtaXBtYXAgbGV2ZWwuXHJcbiAgICAgKlxyXG4gICAgICogU2VlIHNldE1pcG1hcEluaXRpYWxMZXZlbCgpIGZvciBtb3JlIGRvY3VtZW50YXRpb24uXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXRNaXBtYXBJbml0aWFsTGV2ZWwoKTogbnVtYmVyIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX21pcG1hcEluaXRpYWxMZXZlbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBtYXhpbXVtIChsb3dlc3QtcmVzb2x1dGlvbikgbGV2ZWwgdGhhdCBTY2VuZXJ5IHdpbGwgY29tcHV0ZSBpZiBpdCBnZW5lcmF0ZXMgbWlwbWFwcyAoZS5nLiBieSBzZXR0aW5nXHJcbiAgICAgKiBtaXBtYXA6dHJ1ZSBvbiBhIG5vbi1taXBtYXBwZWQgaW5wdXQpLlxyXG4gICAgICpcclxuICAgICAqIFRoZSBkZWZhdWx0IHdpbGwgcHJlY29tcHV0ZSBhbGwgZGVmYXVsdCBsZXZlbHMgKGZyb20gbWlwbWFwSW5pdGlhbExldmVsKSwgc28gdGhhdCB3ZSBpZGVhbGx5IGRvbid0IGhpdCBtaXBtYXBcclxuICAgICAqIGdlbmVyYXRpb24gZHVyaW5nIGFuaW1hdGlvbi5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gbGV2ZWwgLSBBIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyIHJlcHJlc2VudGluZyB0aGUgbWF4aW11bSBtaXBtYXAgbGV2ZWwgdG8gY29tcHV0ZS5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHNldE1pcG1hcE1heExldmVsKCBsZXZlbDogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBsZXZlbCAlIDEgPT09IDAgJiYgbGV2ZWwgPj0gMCxcclxuICAgICAgICAnbWlwbWFwTWF4TGV2ZWwgc2hvdWxkIGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXInICk7XHJcblxyXG4gICAgICBpZiAoIHRoaXMuX21pcG1hcE1heExldmVsICE9PSBsZXZlbCApIHtcclxuICAgICAgICB0aGlzLl9taXBtYXBNYXhMZXZlbCA9IGxldmVsO1xyXG5cclxuICAgICAgICB0aGlzLmludmFsaWRhdGVNaXBtYXBzKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXQgbWlwbWFwTWF4TGV2ZWwoIHZhbHVlOiBudW1iZXIgKSB7IHRoaXMuc2V0TWlwbWFwTWF4TGV2ZWwoIHZhbHVlICk7IH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IG1pcG1hcE1heExldmVsKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldE1pcG1hcE1heExldmVsKCk7IH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgbWF4aW11bSBtaXBtYXAgbGV2ZWwuXHJcbiAgICAgKlxyXG4gICAgICogU2VlIHNldE1pcG1hcE1heExldmVsKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvbi5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldE1pcG1hcE1heExldmVsKCk6IG51bWJlciB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9taXBtYXBNYXhMZXZlbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnRyb2xzIHdoZXRoZXIgZWl0aGVyIGFueSBwaXhlbCBpbiB0aGUgaW1hZ2Ugd2lsbCBiZSBtYXJrZWQgYXMgY29udGFpbmVkICh3aGVuIGZhbHNlKSwgb3Igd2hldGhlciB0cmFuc3BhcmVudFxyXG4gICAgICogcGl4ZWxzIHdpbGwgYmUgY291bnRlZCBhcyBcIm5vdCBjb250YWluZWQgaW4gdGhlIGltYWdlXCIgZm9yIGhpdC10ZXN0aW5nICh3aGVuIHRydWUpLlxyXG4gICAgICpcclxuICAgICAqIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTA0OSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHNldEhpdFRlc3RQaXhlbHMoIGhpdFRlc3RQaXhlbHM6IGJvb2xlYW4gKTogdGhpcyB7XHJcblxyXG4gICAgICBpZiAoIHRoaXMuX2hpdFRlc3RQaXhlbHMgIT09IGhpdFRlc3RQaXhlbHMgKSB7XHJcbiAgICAgICAgdGhpcy5faGl0VGVzdFBpeGVscyA9IGhpdFRlc3RQaXhlbHM7XHJcblxyXG4gICAgICAgIHRoaXMuX2ludmFsaWRhdGVIaXRUZXN0RGF0YSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0IGhpdFRlc3RQaXhlbHMoIHZhbHVlOiBib29sZWFuICkgeyB0aGlzLnNldEhpdFRlc3RQaXhlbHMoIHZhbHVlICk7IH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGhpdFRlc3RQaXhlbHMoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmdldEhpdFRlc3RQaXhlbHMoKTsgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB3aGV0aGVyIHBpeGVscyBhcmUgY2hlY2tlZCBmb3IgaGl0IHRlc3RpbmcuXHJcbiAgICAgKlxyXG4gICAgICogU2VlIHNldEhpdFRlc3RQaXhlbHMoKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0SGl0VGVzdFBpeGVscygpOiBib29sZWFuIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX2hpdFRlc3RQaXhlbHM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb25zdHJ1Y3RzIHRoZSBuZXh0IGF2YWlsYWJsZSAodW5jb21wdXRlZCkgbWlwbWFwIGxldmVsLCBhcyBsb25nIGFzIHRoZSBwcmV2aW91cyBsZXZlbCB3YXMgbGFyZ2VyIHRoYW4gMXgxLlxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIF9jb25zdHJ1Y3ROZXh0TWlwbWFwKCk6IHZvaWQge1xyXG4gICAgICBjb25zdCBsZXZlbCA9IHRoaXMuX21pcG1hcENhbnZhc2VzLmxlbmd0aDtcclxuICAgICAgY29uc3QgYmlnZ2VyQ2FudmFzID0gdGhpcy5fbWlwbWFwQ2FudmFzZXNbIGxldmVsIC0gMSBdO1xyXG5cclxuICAgICAgLy8gaWdub3JlIGFueSAxeDEgY2FudmFzZXMgKG9yIHNtYWxsZXI/IT8pXHJcbiAgICAgIGlmICggYmlnZ2VyQ2FudmFzLndpZHRoICogYmlnZ2VyQ2FudmFzLmhlaWdodCA+IDIgKSB7XHJcbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcclxuICAgICAgICBjYW52YXMud2lkdGggPSBNYXRoLmNlaWwoIGJpZ2dlckNhbnZhcy53aWR0aCAvIDIgKTtcclxuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gTWF0aC5jZWlsKCBiaWdnZXJDYW52YXMuaGVpZ2h0IC8gMiApO1xyXG5cclxuICAgICAgICAvLyBzYW5pdHkgY2hlY2tcclxuICAgICAgICBpZiAoIGNhbnZhcy53aWR0aCA+IDAgJiYgY2FudmFzLmhlaWdodCA+IDAgKSB7XHJcbiAgICAgICAgICAvLyBEcmF3IGhhbGYtc2NhbGUgaW50byB0aGUgc21hbGxlciBDYW52YXNcclxuICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCggJzJkJyApITtcclxuICAgICAgICAgIGNvbnRleHQuc2NhbGUoIDAuNSwgMC41ICk7XHJcbiAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZSggYmlnZ2VyQ2FudmFzLCAwLCAwICk7XHJcblxyXG4gICAgICAgICAgdGhpcy5fbWlwbWFwQ2FudmFzZXMucHVzaCggY2FudmFzICk7XHJcbiAgICAgICAgICB0aGlzLl9taXBtYXBVUkxzLnB1c2goIGNhbnZhcy50b0RhdGFVUkwoKSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJpZ2dlcnMgcmVjb21wdXRhdGlvbiBvZiBtaXBtYXBzIChhcyBsb25nIGFzIG1pcG1hcHBpbmcgaXMgZW5hYmxlZClcclxuICAgICAqL1xyXG4gICAgcHVibGljIGludmFsaWRhdGVNaXBtYXBzKCk6IHZvaWQge1xyXG4gICAgICAvLyBDbGVhbiBvdXRwdXQgYXJyYXlzXHJcbiAgICAgIGNsZWFuQXJyYXkoIHRoaXMuX21pcG1hcENhbnZhc2VzICk7XHJcbiAgICAgIGNsZWFuQXJyYXkoIHRoaXMuX21pcG1hcFVSTHMgKTtcclxuXHJcbiAgICAgIGlmICggdGhpcy5faW1hZ2UgJiYgdGhpcy5fbWlwbWFwICkge1xyXG4gICAgICAgIC8vIElmIHdlIGhhdmUgbWlwbWFwIGRhdGEgYXMgYW4gaW5wdXRcclxuICAgICAgICBpZiAoIHRoaXMuX21pcG1hcERhdGEgKSB7XHJcbiAgICAgICAgICBmb3IgKCBsZXQgayA9IDA7IGsgPCB0aGlzLl9taXBtYXBEYXRhLmxlbmd0aDsgaysrICkge1xyXG4gICAgICAgICAgICBjb25zdCB1cmwgPSB0aGlzLl9taXBtYXBEYXRhWyBrIF0udXJsO1xyXG4gICAgICAgICAgICB0aGlzLl9taXBtYXBVUkxzLnB1c2goIHVybCApO1xyXG4gICAgICAgICAgICBjb25zdCB1cGRhdGVDYW52YXMgPSB0aGlzLl9taXBtYXBEYXRhWyBrIF0udXBkYXRlQ2FudmFzO1xyXG4gICAgICAgICAgICB1cGRhdGVDYW52YXMgJiYgdXBkYXRlQ2FudmFzKCk7XHJcbiAgICAgICAgICAgIHRoaXMuX21pcG1hcENhbnZhc2VzLnB1c2goIHRoaXMuX21pcG1hcERhdGFbIGsgXS5jYW52YXMhICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIE90aGVyd2lzZSwgd2UgaGF2ZSBhbiBpbWFnZSAobm90IG1pcG1hcCkgYXMgb3VyIGlucHV0LCBzbyB3ZSdsbCBuZWVkIHRvIGNvbnN0cnVjdCBtaXBtYXAgbGV2ZWxzLlxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgY29uc3QgYmFzZUNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdjYW52YXMnICk7XHJcbiAgICAgICAgICBiYXNlQ2FudmFzLndpZHRoID0gdGhpcy5nZXRJbWFnZVdpZHRoKCk7XHJcbiAgICAgICAgICBiYXNlQ2FudmFzLmhlaWdodCA9IHRoaXMuZ2V0SW1hZ2VIZWlnaHQoKTtcclxuXHJcbiAgICAgICAgICAvLyBpZiB3ZSBhcmUgbm90IGxvYWRlZCB5ZXQsIGp1c3QgaWdub3JlXHJcbiAgICAgICAgICBpZiAoIGJhc2VDYW52YXMud2lkdGggJiYgYmFzZUNhbnZhcy5oZWlnaHQgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJhc2VDb250ZXh0ID0gYmFzZUNhbnZhcy5nZXRDb250ZXh0KCAnMmQnICkhO1xyXG4gICAgICAgICAgICBiYXNlQ29udGV4dC5kcmF3SW1hZ2UoIHRoaXMuX2ltYWdlLCAwLCAwICk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9taXBtYXBDYW52YXNlcy5wdXNoKCBiYXNlQ2FudmFzICk7XHJcbiAgICAgICAgICAgIHRoaXMuX21pcG1hcFVSTHMucHVzaCggYmFzZUNhbnZhcy50b0RhdGFVUkwoKSApO1xyXG5cclxuICAgICAgICAgICAgbGV0IGxldmVsID0gMDtcclxuICAgICAgICAgICAgd2hpbGUgKCArK2xldmVsIDwgdGhpcy5fbWlwbWFwSW5pdGlhbExldmVsICkge1xyXG4gICAgICAgICAgICAgIHRoaXMuX2NvbnN0cnVjdE5leHRNaXBtYXAoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5taXBtYXBFbWl0dGVyLmVtaXQoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIGRlc2lyZWQgbWlwbWFwIGxldmVsICgwLWluZGV4ZWQpIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIHRoZSBwYXJ0aWN1bGFyIHJlbGF0aXZlIHRyYW5zZm9ybS4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIG1hdHJpeCAtIFRoZSByZWxhdGl2ZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggb2YgdGhlIG5vZGUuXHJcbiAgICAgKiBAcGFyYW0gW2FkZGl0aW9uYWxCaWFzXSAtIENhbiBiZSBwcm92aWRlZCB0byBnZXQgcGVyLWNhbGwgYmlhcyAod2Ugd2FudCBzb21lIG9mIHRoaXMgZm9yIENhbnZhcyBvdXRwdXQpXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXRNaXBtYXBMZXZlbCggbWF0cml4OiBNYXRyaXgzLCBhZGRpdGlvbmFsQmlhcyA9IDAgKTogbnVtYmVyIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fbWlwbWFwLCAnQXNzdW1lcyBtaXBtYXBzIGNhbiBiZSB1c2VkJyApO1xyXG5cclxuICAgICAgLy8gSGFuZGxlIGhpZ2gtZHBpIGRldmljZXMgbGlrZSByZXRpbmEgd2l0aCBjb3JyZWN0IG1pcG1hcCBsZXZlbHMuXHJcbiAgICAgIGNvbnN0IHNjYWxlID0gSW1hZ2VhYmxlLmdldEFwcHJveGltYXRlTWF0cml4U2NhbGUoIG1hdHJpeCApICogKCB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyB8fCAxICk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5nZXRNaXBtYXBMZXZlbEZyb21TY2FsZSggc2NhbGUsIGFkZGl0aW9uYWxCaWFzICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBkZXNpcmVkIG1pcG1hcCBsZXZlbCAoMC1pbmRleGVkKSB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciB0aGUgcGFydGljdWxhciBzY2FsZVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0TWlwbWFwTGV2ZWxGcm9tU2NhbGUoIHNjYWxlOiBudW1iZXIsIGFkZGl0aW9uYWxCaWFzID0gMCApOiBudW1iZXIge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBzY2FsZSA+IDAsICdzY2FsZSBzaG91bGQgYmUgYSBwb3NpdGl2ZSBudW1iZXInICk7XHJcblxyXG4gICAgICAvLyBJZiB3ZSBhcmUgc2hvd24gbGFyZ2VyIHRoYW4gc2NhbGUsIEFMV0FZUyBjaG9vc2UgdGhlIGhpZ2hlc3QgcmVzb2x1dGlvblxyXG4gICAgICBpZiAoIHNjYWxlID49IDEgKSB7XHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIG91ciBhcHByb3hpbWF0ZSBsZXZlbCBvZiBkZXRhaWxcclxuICAgICAgbGV0IGxldmVsID0gbG9nMiggMSAvIHNjYWxlICk7XHJcblxyXG4gICAgICAvLyBjb252ZXJ0IHRvIGFuIGludGVnZXIgbGV2ZWwgKC0wLjcgaXMgYSBnb29kIGRlZmF1bHQpXHJcbiAgICAgIGxldmVsID0gVXRpbHMucm91bmRTeW1tZXRyaWMoIGxldmVsICsgdGhpcy5fbWlwbWFwQmlhcyArIGFkZGl0aW9uYWxCaWFzIC0gMC43ICk7XHJcblxyXG4gICAgICBpZiAoIGxldmVsIDwgMCApIHtcclxuICAgICAgICBsZXZlbCA9IDA7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBsZXZlbCA+IHRoaXMuX21pcG1hcE1heExldmVsICkge1xyXG4gICAgICAgIGxldmVsID0gdGhpcy5fbWlwbWFwTWF4TGV2ZWw7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIElmIG5lY2Vzc2FyeSwgZG8gbGF6eSBjb25zdHJ1Y3Rpb24gb2YgdGhlIG1pcG1hcCBsZXZlbFxyXG4gICAgICBpZiAoIHRoaXMubWlwbWFwICYmICF0aGlzLl9taXBtYXBDYW52YXNlc1sgbGV2ZWwgXSApIHtcclxuICAgICAgICBsZXQgY3VycmVudExldmVsID0gdGhpcy5fbWlwbWFwQ2FudmFzZXMubGVuZ3RoIC0gMTtcclxuICAgICAgICB3aGlsZSAoICsrY3VycmVudExldmVsIDw9IGxldmVsICkge1xyXG4gICAgICAgICAgdGhpcy5fY29uc3RydWN0TmV4dE1pcG1hcCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBTYW5pdHkgY2hlY2ssIHNpbmNlIF9jb25zdHJ1Y3ROZXh0TWlwbWFwKCkgbWF5IGhhdmUgaGFkIHRvIGJhaWwgb3V0LiBXZSBoYWQgdG8gY29tcHV0ZSBzb21lLCBzbyB1c2UgdGhlIGxhc3RcclxuICAgICAgICByZXR1cm4gTWF0aC5taW4oIGxldmVsLCB0aGlzLl9taXBtYXBDYW52YXNlcy5sZW5ndGggLSAxICk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gU2hvdWxkIGFscmVhZHkgYmUgY29uc3RydWN0ZWQsIG9yIGlzbid0IG5lZWRlZFxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gbGV2ZWw7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgYSBtYXRjaGluZyBDYW52YXMgZWxlbWVudCBmb3IgdGhlIGdpdmVuIGxldmVsLW9mLWRldGFpbC4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIGxldmVsIC0gTm9uLW5lZ2F0aXZlIGludGVnZXIgcmVwcmVzZW50aW5nIHRoZSBtaXBtYXAgbGV2ZWxcclxuICAgICAqIEByZXR1cm5zIC0gTWF0Y2hpbmcgPGNhbnZhcz4gZm9yIHRoZSBsZXZlbCBvZiBkZXRhaWxcclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldE1pcG1hcENhbnZhcyggbGV2ZWw6IG51bWJlciApOiBIVE1MQ2FudmFzRWxlbWVudCB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGxldmVsID49IDAgJiZcclxuICAgICAgbGV2ZWwgPCB0aGlzLl9taXBtYXBDYW52YXNlcy5sZW5ndGggJiZcclxuICAgICAgKCBsZXZlbCAlIDEgKSA9PT0gMCApO1xyXG5cclxuICAgICAgLy8gU2FuaXR5IGNoZWNrIHRvIG1ha2Ugc3VyZSB3ZSBoYXZlIGNvcGllZCB0aGUgaW1hZ2UgZGF0YSBpbiBpZiBuZWNlc3NhcnkuXHJcbiAgICAgIGlmICggdGhpcy5fbWlwbWFwRGF0YSApIHtcclxuICAgICAgICAvLyBsZXZlbCBtYXkgbm90IGV4aXN0IChpdCB3YXMgZ2VuZXJhdGVkKSwgYW5kIHVwZGF0ZUNhbnZhcyBtYXkgbm90IGV4aXN0XHJcbiAgICAgICAgY29uc3QgdXBkYXRlQ2FudmFzID0gdGhpcy5fbWlwbWFwRGF0YVsgbGV2ZWwgXSAmJiB0aGlzLl9taXBtYXBEYXRhWyBsZXZlbCBdLnVwZGF0ZUNhbnZhcztcclxuICAgICAgICB1cGRhdGVDYW52YXMgJiYgdXBkYXRlQ2FudmFzKCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXMuX21pcG1hcENhbnZhc2VzWyBsZXZlbCBdO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBhIG1hdGNoaW5nIFVSTCBzdHJpbmcgZm9yIGFuIGltYWdlIGZvciB0aGUgZ2l2ZW4gbGV2ZWwtb2YtZGV0YWlsLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gbGV2ZWwgLSBOb24tbmVnYXRpdmUgaW50ZWdlciByZXByZXNlbnRpbmcgdGhlIG1pcG1hcCBsZXZlbFxyXG4gICAgICogQHJldHVybnMgLSBNYXRjaGluZyBkYXRhIFVSTCBmb3IgdGhlIGxldmVsIG9mIGRldGFpbFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0TWlwbWFwVVJMKCBsZXZlbDogbnVtYmVyICk6IHN0cmluZyB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGxldmVsID49IDAgJiZcclxuICAgICAgbGV2ZWwgPCB0aGlzLl9taXBtYXBDYW52YXNlcy5sZW5ndGggJiZcclxuICAgICAgKCBsZXZlbCAlIDEgKSA9PT0gMCApO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuX21pcG1hcFVSTHNbIGxldmVsIF07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlcmUgYXJlIG1pcG1hcCBsZXZlbHMgdGhhdCBoYXZlIGJlZW4gY29tcHV0ZWQuIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgaGFzTWlwbWFwcygpOiBib29sZWFuIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX21pcG1hcENhbnZhc2VzLmxlbmd0aCA+IDA7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmlnZ2VycyByZWNvbXB1dGF0aW9uIG9mIGhpdCB0ZXN0IGRhdGFcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBfaW52YWxpZGF0ZUhpdFRlc3REYXRhKCk6IHZvaWQge1xyXG4gICAgICAvLyBPbmx5IGNvbXB1dGUgdGhpcyBpZiB3ZSBhcmUgaGl0LXRlc3RpbmcgcGl4ZWxzXHJcbiAgICAgIGlmICggIXRoaXMuX2hpdFRlc3RQaXhlbHMgKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIHRoaXMuX2ltYWdlICE9PSBudWxsICkge1xyXG4gICAgICAgIHRoaXMuX2hpdFRlc3RJbWFnZURhdGEgPSBJbWFnZWFibGUuZ2V0SGl0VGVzdERhdGEoIHRoaXMuX2ltYWdlLCB0aGlzLmltYWdlV2lkdGgsIHRoaXMuaW1hZ2VIZWlnaHQgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgd2lkdGggb2YgdGhlIGRpc3BsYXllZCBpbWFnZSAobm90IHJlbGF0ZWQgdG8gaG93IHRoaXMgbm9kZSBpcyB0cmFuc2Zvcm1lZCkuXHJcbiAgICAgKlxyXG4gICAgICogTk9URTogSWYgdGhlIGltYWdlIGlzIG5vdCBsb2FkZWQgYW5kIGFuIGluaXRpYWxXaWR0aCB3YXMgcHJvdmlkZWQsIHRoYXQgd2lkdGggd2lsbCBiZSB1c2VkLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0SW1hZ2VXaWR0aCgpOiBudW1iZXIge1xyXG4gICAgICBpZiAoIHRoaXMuX2ltYWdlID09PSBudWxsICkge1xyXG4gICAgICAgIHJldHVybiAwO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBkZXRlY3RlZFdpZHRoID0gdGhpcy5fbWlwbWFwRGF0YSA/IHRoaXMuX21pcG1hcERhdGFbIDAgXS53aWR0aCA6ICggKCAnbmF0dXJhbFdpZHRoJyBpbiB0aGlzLl9pbWFnZSA/IHRoaXMuX2ltYWdlLm5hdHVyYWxXaWR0aCA6IDAgKSB8fCB0aGlzLl9pbWFnZS53aWR0aCApO1xyXG4gICAgICBpZiAoIGRldGVjdGVkV2lkdGggPT09IDAgKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2luaXRpYWxXaWR0aDsgLy8gZWl0aGVyIDAgKGRlZmF1bHQpLCBvciB0aGUgb3ZlcnJpZGRlbiB2YWx1ZVxyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2luaXRpYWxXaWR0aCA9PT0gMCB8fCB0aGlzLl9pbml0aWFsV2lkdGggPT09IGRldGVjdGVkV2lkdGgsICdCYWQgSW1hZ2UuaW5pdGlhbFdpZHRoJyApO1xyXG5cclxuICAgICAgICByZXR1cm4gZGV0ZWN0ZWRXaWR0aDtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgaW1hZ2VXaWR0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRJbWFnZVdpZHRoKCk7IH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIGhlaWdodCBvZiB0aGUgZGlzcGxheWVkIGltYWdlIChub3QgcmVsYXRlZCB0byBob3cgdGhpcyBub2RlIGlzIHRyYW5zZm9ybWVkKS5cclxuICAgICAqXHJcbiAgICAgKiBOT1RFOiBJZiB0aGUgaW1hZ2UgaXMgbm90IGxvYWRlZCBhbmQgYW4gaW5pdGlhbEhlaWdodCB3YXMgcHJvdmlkZWQsIHRoYXQgaGVpZ2h0IHdpbGwgYmUgdXNlZC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldEltYWdlSGVpZ2h0KCk6IG51bWJlciB7XHJcbiAgICAgIGlmICggdGhpcy5faW1hZ2UgPT09IG51bGwgKSB7XHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGRldGVjdGVkSGVpZ2h0ID0gdGhpcy5fbWlwbWFwRGF0YSA/IHRoaXMuX21pcG1hcERhdGFbIDAgXS5oZWlnaHQgOiAoICggJ25hdHVyYWxIZWlnaHQnIGluIHRoaXMuX2ltYWdlID8gdGhpcy5faW1hZ2UubmF0dXJhbEhlaWdodCA6IDAgKSB8fCB0aGlzLl9pbWFnZS5oZWlnaHQgKTtcclxuICAgICAgaWYgKCBkZXRlY3RlZEhlaWdodCA9PT0gMCApIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faW5pdGlhbEhlaWdodDsgLy8gZWl0aGVyIDAgKGRlZmF1bHQpLCBvciB0aGUgb3ZlcnJpZGRlbiB2YWx1ZVxyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2luaXRpYWxIZWlnaHQgPT09IDAgfHwgdGhpcy5faW5pdGlhbEhlaWdodCA9PT0gZGV0ZWN0ZWRIZWlnaHQsICdCYWQgSW1hZ2UuaW5pdGlhbEhlaWdodCcgKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGRldGVjdGVkSGVpZ2h0O1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBpbWFnZUhlaWdodCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRJbWFnZUhlaWdodCgpOyB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJZiBvdXIgcHJvdmlkZWQgaW1hZ2UgaXMgYW4gSFRNTEltYWdlRWxlbWVudCwgcmV0dXJucyBpdHMgVVJMIChzcmMpLiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldEltYWdlVVJMKCk6IHN0cmluZyB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2ltYWdlIGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCwgJ09ubHkgc3VwcG9ydGVkIGZvciBIVE1MIGltYWdlIGVsZW1lbnRzJyApO1xyXG5cclxuICAgICAgcmV0dXJuICggdGhpcy5faW1hZ2UgYXMgSFRNTEltYWdlRWxlbWVudCApLnNyYztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEF0dGFjaGVzIG91ciBvbi1sb2FkIGxpc3RlbmVyIHRvIG91ciBjdXJyZW50IGltYWdlLlxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIF9hdHRhY2hJbWFnZUxvYWRMaXN0ZW5lcigpOiB2b2lkIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMuX2ltYWdlTG9hZExpc3RlbmVyQXR0YWNoZWQsICdTaG91bGQgb25seSBiZSBhdHRhY2hlZCB0byBvbmUgdGhpbmcgYXQgYSB0aW1lJyApO1xyXG5cclxuICAgICAgaWYgKCAhdGhpcy5pc0Rpc3Bvc2VkICkge1xyXG4gICAgICAgICggdGhpcy5faW1hZ2UgYXMgSFRNTEltYWdlRWxlbWVudCApLmFkZEV2ZW50TGlzdGVuZXIoICdsb2FkJywgdGhpcy5faW1hZ2VMb2FkTGlzdGVuZXIgKTtcclxuICAgICAgICB0aGlzLl9pbWFnZUxvYWRMaXN0ZW5lckF0dGFjaGVkID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGV0YWNoZXMgb3VyIG9uLWxvYWQgbGlzdGVuZXIgZnJvbSBvdXIgY3VycmVudCBpbWFnZS5cclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBfZGV0YWNoSW1hZ2VMb2FkTGlzdGVuZXIoKTogdm9pZCB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2ltYWdlTG9hZExpc3RlbmVyQXR0YWNoZWQsICdOZWVkcyB0byBiZSBhdHRhY2hlZCBmaXJzdCB0byBiZSBkZXRhY2hlZC4nICk7XHJcblxyXG4gICAgICAoIHRoaXMuX2ltYWdlIGFzIEhUTUxJbWFnZUVsZW1lbnQgKS5yZW1vdmVFdmVudExpc3RlbmVyKCAnbG9hZCcsIHRoaXMuX2ltYWdlTG9hZExpc3RlbmVyICk7XHJcbiAgICAgIHRoaXMuX2ltYWdlTG9hZExpc3RlbmVyQXR0YWNoZWQgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGxlZCB3aGVuIG91ciBpbWFnZSBoYXMgbG9hZGVkIChpdCB3YXMgbm90IHlldCBsb2FkZWQgd2l0aCB0aGVuIGxpc3RlbmVyIHdhcyBhZGRlZClcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBfb25JbWFnZUxvYWQoKTogdm9pZCB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2ltYWdlTG9hZExpc3RlbmVyQXR0YWNoZWQsICdJZiBfb25JbWFnZUxvYWQgaXMgZmlyaW5nLCBpdCBzaG91bGQgYmUgYXR0YWNoZWQnICk7XHJcblxyXG4gICAgICB0aGlzLmludmFsaWRhdGVJbWFnZSgpO1xyXG4gICAgICB0aGlzLl9kZXRhY2hJbWFnZUxvYWRMaXN0ZW5lcigpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGlzcG9zZXMgdGhlIHBhdGgsIHJlbGVhc2luZyBpbWFnZSBsaXN0ZW5lcnMgaWYgbmVlZGVkIChhbmQgcHJldmVudGluZyBuZXcgbGlzdGVuZXJzIGZyb20gYmVpbmcgYWRkZWQpLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgICAgaWYgKCB0aGlzLl9pbWFnZSAmJiB0aGlzLl9pbWFnZUxvYWRMaXN0ZW5lckF0dGFjaGVkICkge1xyXG4gICAgICAgIHRoaXMuX2RldGFjaEltYWdlTG9hZExpc3RlbmVyKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuX2ltYWdlUHJvcGVydHkuZGlzcG9zZSgpO1xyXG5cclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICBzdXBlci5kaXNwb3NlICYmIHN1cGVyLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE9wdGlvbmFsbHkgcmV0dXJucyBhbiBJbWFnZURhdGEgb2JqZWN0IHVzZWZ1bCBmb3IgaGl0LXRlc3RpbmcgdGhlIHBpeGVsIGRhdGEgb2YgYW4gaW1hZ2UuXHJcbiAqXHJcbiAqIEBwYXJhbSBpbWFnZVxyXG4gKiBAcGFyYW0gd2lkdGggLSBsb2dpY2FsIHdpZHRoIG9mIHRoZSBpbWFnZVxyXG4gKiBAcGFyYW0gaGVpZ2h0IC0gbG9naWNhbCBoZWlnaHQgb2YgdGhlIGltYWdlXHJcbiAqL1xyXG5JbWFnZWFibGUuZ2V0SGl0VGVzdERhdGEgPSAoIGltYWdlOiBQYXJzZWRJbWFnZSwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIgKTogSW1hZ2VEYXRhIHwgbnVsbCA9PiB7XHJcbiAgLy8gSWYgdGhlIGltYWdlIGlzbid0IGxvYWRlZCB5ZXQsIHdlIGRvbid0IHdhbnQgdG8gdHJ5IGxvYWRpbmcgYW55dGhpbmdcclxuICBpZiAoICEoICggJ25hdHVyYWxXaWR0aCcgaW4gaW1hZ2UgPyBpbWFnZS5uYXR1cmFsV2lkdGggOiAwICkgfHwgaW1hZ2Uud2lkdGggKSB8fCAhKCAoICduYXR1cmFsSGVpZ2h0JyBpbiBpbWFnZSA/IGltYWdlLm5hdHVyYWxIZWlnaHQgOiAwICkgfHwgaW1hZ2UuaGVpZ2h0ICkgKSB7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIGNvbnN0IGNhbnZhcyA9IGdldFNjcmF0Y2hDYW52YXMoKTtcclxuICBjb25zdCBjb250ZXh0ID0gZ2V0U2NyYXRjaENvbnRleHQoKTtcclxuXHJcbiAgY2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuICBjb250ZXh0LmRyYXdJbWFnZSggaW1hZ2UsIDAsIDAgKTtcclxuXHJcbiAgcmV0dXJuIGNvbnRleHQuZ2V0SW1hZ2VEYXRhKCAwLCAwLCB3aWR0aCwgaGVpZ2h0ICk7XHJcbn07XHJcblxyXG4vKipcclxuICogVGVzdHMgd2hldGhlciBhIGdpdmVuIHBpeGVsIGluIGFuIEltYWdlRGF0YSBpcyBhdCBhbGwgbm9uLXRyYW5zcGFyZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0gaW1hZ2VEYXRhXHJcbiAqIEBwYXJhbSB3aWR0aCAtIGxvZ2ljYWwgd2lkdGggb2YgdGhlIGltYWdlXHJcbiAqIEBwYXJhbSBoZWlnaHQgLSBsb2dpY2FsIGhlaWdodCBvZiB0aGUgaW1hZ2VcclxuICogQHBhcmFtIHBvaW50XHJcbiAqL1xyXG5JbWFnZWFibGUudGVzdEhpdFRlc3REYXRhID0gKCBpbWFnZURhdGE6IEltYWdlRGF0YSwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIHBvaW50OiBWZWN0b3IyICk6IGJvb2xlYW4gPT4ge1xyXG4gIC8vIEZvciBzYW5pdHksIG1hcCBpdCBiYXNlZCBvbiB0aGUgaW1hZ2UgZGltZW5zaW9ucyBhbmQgaW1hZ2UgZGF0YSBkaW1lbnNpb25zLCBhbmQgY2FyZWZ1bGx5IGNsYW1wIGluIGNhc2UgdGhpbmdzIGFyZSB3ZWlyZC5cclxuICBjb25zdCB4ID0gVXRpbHMuY2xhbXAoIE1hdGguZmxvb3IoICggcG9pbnQueCAvIHdpZHRoICkgKiBpbWFnZURhdGEud2lkdGggKSwgMCwgaW1hZ2VEYXRhLndpZHRoIC0gMSApO1xyXG4gIGNvbnN0IHkgPSBVdGlscy5jbGFtcCggTWF0aC5mbG9vciggKCBwb2ludC55IC8gaGVpZ2h0ICkgKiBpbWFnZURhdGEuaGVpZ2h0ICksIDAsIGltYWdlRGF0YS5oZWlnaHQgLSAxICk7XHJcblxyXG4gIGNvbnN0IGluZGV4ID0gNCAqICggeCArIHkgKiBpbWFnZURhdGEud2lkdGggKSArIDM7XHJcblxyXG4gIHJldHVybiBpbWFnZURhdGEuZGF0YVsgaW5kZXggXSAhPT0gMDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUdXJucyB0aGUgSW1hZ2VEYXRhIGludG8gYSBTaGFwZSBzaG93aW5nIHdoZXJlIGhpdCB0ZXN0aW5nIHdvdWxkIHN1Y2NlZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSBpbWFnZURhdGFcclxuICogQHBhcmFtIHdpZHRoIC0gbG9naWNhbCB3aWR0aCBvZiB0aGUgaW1hZ2VcclxuICogQHBhcmFtIGhlaWdodCAtIGxvZ2ljYWwgaGVpZ2h0IG9mIHRoZSBpbWFnZVxyXG4gKi9cclxuSW1hZ2VhYmxlLmhpdFRlc3REYXRhVG9TaGFwZSA9ICggaW1hZ2VEYXRhOiBJbWFnZURhdGEsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyICk6IFNoYXBlID0+IHtcclxuICBjb25zdCB3aWR0aFNjYWxlID0gd2lkdGggLyBpbWFnZURhdGEud2lkdGg7XHJcbiAgY29uc3QgaGVpZ2h0U2NhbGUgPSBoZWlnaHQgLyBpbWFnZURhdGEuaGVpZ2h0O1xyXG5cclxuICBjb25zdCBzaGFwZSA9IG5ldyBTaGFwZSgpO1xyXG5cclxuICAvLyBDcmVhdGUgcm93cyBhdCBhIHRpbWUsIHNvIHRoYXQgaWYgd2UgaGF2ZSA1MCBhZGphY2VudCBwaXhlbHMgXCJvblwiLCB0aGVuIHdlJ2xsIGp1c3QgbWFrZSBhIHJlY3RhbmdsZSA1MC13aWRlLlxyXG4gIC8vIFRoaXMgbGV0cyB1cyBkbyB0aGUgQ0FHIGZhc3Rlci5cclxuICBsZXQgYWN0aXZlID0gZmFsc2U7XHJcbiAgbGV0IG1pbiA9IDA7XHJcblxyXG4gIC8vIE5PVEU6IFJvd3MgYXJlIG1vcmUgaGVscGZ1bCBmb3IgQ0FHLCBldmVuIHRob3VnaCBjb2x1bW5zIHdvdWxkIGhhdmUgYmV0dGVyIGNhY2hlIGJlaGF2aW9yIHdoZW4gYWNjZXNzaW5nIHRoZVxyXG4gIC8vIGltYWdlRGF0YS5cclxuXHJcbiAgZm9yICggbGV0IHkgPSAwOyB5IDwgaW1hZ2VEYXRhLmhlaWdodDsgeSsrICkge1xyXG4gICAgZm9yICggbGV0IHggPSAwOyB4IDwgaW1hZ2VEYXRhLndpZHRoOyB4KysgKSB7XHJcbiAgICAgIGNvbnN0IGluZGV4ID0gNCAqICggeCArIHkgKiBpbWFnZURhdGEud2lkdGggKSArIDM7XHJcblxyXG4gICAgICBpZiAoIGltYWdlRGF0YS5kYXRhWyBpbmRleCBdICE9PSAwICkge1xyXG4gICAgICAgIC8vIElmIG91ciBsYXN0IHBpeGVsIHdhcyBlbXB0eSwgYW5kIG5vdyB3ZSdyZSBcIm9uXCIsIHN0YXJ0IG91ciByZWN0YW5nbGVcclxuICAgICAgICBpZiAoICFhY3RpdmUgKSB7XHJcbiAgICAgICAgICBhY3RpdmUgPSB0cnVlO1xyXG4gICAgICAgICAgbWluID0geDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIGFjdGl2ZSApIHtcclxuICAgICAgICAvLyBGaW5pc2ggYSByZWN0YW5nbGUgb25jZSB3ZSByZWFjaCBhbiBcIm9mZlwiIHBpeGVsXHJcbiAgICAgICAgYWN0aXZlID0gZmFsc2U7XHJcbiAgICAgICAgc2hhcGUucmVjdCggbWluICogd2lkdGhTY2FsZSwgeSAqIHdpZHRoU2NhbGUsIHdpZHRoU2NhbGUgKiAoIHggLSBtaW4gKSwgaGVpZ2h0U2NhbGUgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKCBhY3RpdmUgKSB7XHJcbiAgICAgIC8vIFdlJ2xsIG5lZWQgdG8gZmluaXNoIHJlY3RhbmdsZXMgYXQgdGhlIGVuZCBvZiBlYWNoIHJvdyBhbnl3YXkuXHJcbiAgICAgIGFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICBzaGFwZS5yZWN0KCBtaW4gKiB3aWR0aFNjYWxlLCB5ICogd2lkdGhTY2FsZSwgd2lkdGhTY2FsZSAqICggaW1hZ2VEYXRhLndpZHRoIC0gbWluICksIGhlaWdodFNjYWxlICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gc2hhcGUuZ2V0U2ltcGxpZmllZEFyZWFTaGFwZSgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYW4gU1ZHIGltYWdlIGVsZW1lbnQgd2l0aCBhIGdpdmVuIFVSTCBhbmQgZGltZW5zaW9uc1xyXG4gKlxyXG4gKiBAcGFyYW0gdXJsIC0gVGhlIFVSTCBmb3IgdGhlIGltYWdlXHJcbiAqIEBwYXJhbSB3aWR0aCAtIE5vbi1uZWdhdGl2ZSBpbnRlZ2VyIGZvciB0aGUgaW1hZ2UncyB3aWR0aFxyXG4gKiBAcGFyYW0gaGVpZ2h0IC0gTm9uLW5lZ2F0aXZlIGludGVnZXIgZm9yIHRoZSBpbWFnZSdzIGhlaWdodFxyXG4gKi9cclxuSW1hZ2VhYmxlLmNyZWF0ZVNWR0ltYWdlID0gKCB1cmw6IHN0cmluZywgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIgKTogU1ZHSW1hZ2VFbGVtZW50ID0+IHtcclxuICBhc3NlcnQgJiYgYXNzZXJ0KCBpc0Zpbml0ZSggd2lkdGggKSAmJiB3aWR0aCA+PSAwICYmICggd2lkdGggJSAxICkgPT09IDAsXHJcbiAgICAnd2lkdGggc2hvdWxkIGJlIGEgbm9uLW5lZ2F0aXZlIGZpbml0ZSBpbnRlZ2VyJyApO1xyXG4gIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBoZWlnaHQgKSAmJiBoZWlnaHQgPj0gMCAmJiAoIGhlaWdodCAlIDEgKSA9PT0gMCxcclxuICAgICdoZWlnaHQgc2hvdWxkIGJlIGEgbm9uLW5lZ2F0aXZlIGZpbml0ZSBpbnRlZ2VyJyApO1xyXG5cclxuICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCBzdmducywgJ2ltYWdlJyApO1xyXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKCAneCcsICcwJyApO1xyXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKCAneScsICcwJyApO1xyXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKCAnd2lkdGgnLCBgJHt3aWR0aH1weGAgKTtcclxuICBlbGVtZW50LnNldEF0dHJpYnV0ZSggJ2hlaWdodCcsIGAke2hlaWdodH1weGAgKTtcclxuICBlbGVtZW50LnNldEF0dHJpYnV0ZU5TKCB4bGlua25zLCAneGxpbms6aHJlZicsIHVybCApO1xyXG5cclxuICByZXR1cm4gZWxlbWVudDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGFuIG9iamVjdCBzdWl0YWJsZSB0byBiZSBwYXNzZWQgdG8gSW1hZ2UgYXMgYSBtaXBtYXAgKGZyb20gYSBDYW52YXMpXHJcbiAqL1xyXG5JbWFnZWFibGUuY3JlYXRlRmFzdE1pcG1hcEZyb21DYW52YXMgPSAoIGJhc2VDYW52YXM6IEhUTUxDYW52YXNFbGVtZW50ICk6IE1pcG1hcCA9PiB7XHJcbiAgY29uc3QgbWlwbWFwczogTWlwbWFwID0gW107XHJcblxyXG4gIGNvbnN0IGJhc2VVUkwgPSBiYXNlQ2FudmFzLnRvRGF0YVVSTCgpO1xyXG4gIGNvbnN0IGJhc2VJbWFnZSA9IG5ldyB3aW5kb3cuSW1hZ2UoKTtcclxuICBiYXNlSW1hZ2Uuc3JjID0gYmFzZVVSTDtcclxuXHJcbiAgLy8gYmFzZSBsZXZlbFxyXG4gIG1pcG1hcHMucHVzaCgge1xyXG4gICAgaW1nOiBiYXNlSW1hZ2UsXHJcbiAgICB1cmw6IGJhc2VVUkwsXHJcbiAgICB3aWR0aDogYmFzZUNhbnZhcy53aWR0aCxcclxuICAgIGhlaWdodDogYmFzZUNhbnZhcy5oZWlnaHQsXHJcbiAgICBjYW52YXM6IGJhc2VDYW52YXNcclxuICB9ICk7XHJcblxyXG4gIGxldCBsYXJnZUNhbnZhcyA9IGJhc2VDYW52YXM7XHJcbiAgd2hpbGUgKCBsYXJnZUNhbnZhcy53aWR0aCA+PSAyICYmIGxhcmdlQ2FudmFzLmhlaWdodCA+PSAyICkge1xyXG5cclxuICAgIC8vIGRyYXcgaGFsZi1zaXplXHJcbiAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApO1xyXG4gICAgY2FudmFzLndpZHRoID0gTWF0aC5jZWlsKCBsYXJnZUNhbnZhcy53aWR0aCAvIDIgKTtcclxuICAgIGNhbnZhcy5oZWlnaHQgPSBNYXRoLmNlaWwoIGxhcmdlQ2FudmFzLmhlaWdodCAvIDIgKTtcclxuICAgIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCggJzJkJyApITtcclxuICAgIGNvbnRleHQuc2V0VHJhbnNmb3JtKCAwLjUsIDAsIDAsIDAuNSwgMCwgMCApO1xyXG4gICAgY29udGV4dC5kcmF3SW1hZ2UoIGxhcmdlQ2FudmFzLCAwLCAwICk7XHJcblxyXG4gICAgLy8gc21hbGxlciBsZXZlbFxyXG4gICAgY29uc3QgbWlwbWFwTGV2ZWwgPSB7XHJcbiAgICAgIHdpZHRoOiBjYW52YXMud2lkdGgsXHJcbiAgICAgIGhlaWdodDogY2FudmFzLmhlaWdodCxcclxuICAgICAgY2FudmFzOiBjYW52YXMsXHJcbiAgICAgIHVybDogY2FudmFzLnRvRGF0YVVSTCgpLFxyXG4gICAgICBpbWc6IG5ldyB3aW5kb3cuSW1hZ2UoKVxyXG4gICAgfTtcclxuICAgIC8vIHNldCB1cCB0aGUgaW1hZ2UgYW5kIHVybFxyXG4gICAgbWlwbWFwTGV2ZWwuaW1nLnNyYyA9IG1pcG1hcExldmVsLnVybDtcclxuXHJcbiAgICBsYXJnZUNhbnZhcyA9IGNhbnZhcztcclxuICAgIG1pcG1hcHMucHVzaCggbWlwbWFwTGV2ZWwgKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBtaXBtYXBzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgYSBzZW5zZSBvZiBcImF2ZXJhZ2VcIiBzY2FsZSwgd2hpY2ggc2hvdWxkIGJlIGV4YWN0IGlmIHRoZXJlIGlzIG5vIGFzeW1tZXRyaWMgc2NhbGUvc2hlYXIgYXBwbGllZFxyXG4gKi9cclxuSW1hZ2VhYmxlLmdldEFwcHJveGltYXRlTWF0cml4U2NhbGUgPSAoIG1hdHJpeDogTWF0cml4MyApOiBudW1iZXIgPT4ge1xyXG4gIHJldHVybiAoIE1hdGguc3FydCggbWF0cml4Lm0wMCgpICogbWF0cml4Lm0wMCgpICsgbWF0cml4Lm0xMCgpICogbWF0cml4Lm0xMCgpICkgK1xyXG4gICAgICAgICAgIE1hdGguc3FydCggbWF0cml4Lm0wMSgpICogbWF0cml4Lm0wMSgpICsgbWF0cml4Lm0xMSgpICogbWF0cml4Lm0xMSgpICkgKSAvIDI7XHJcbn07XHJcblxyXG4vLyB7bnVtYmVyfSAtIFdlIGluY2x1ZGUgdGhpcyBmb3IgYWRkaXRpb25hbCBzbW9vdGhpbmcgdGhhdCBzZWVtcyB0byBiZSBuZWVkZWQgZm9yIENhbnZhcyBpbWFnZSBxdWFsaXR5XHJcbkltYWdlYWJsZS5DQU5WQVNfTUlQTUFQX0JJQVNfQURKVVNUTUVOVCA9IDAuNTtcclxuXHJcbi8vIHtPYmplY3R9IC0gSW5pdGlhbCB2YWx1ZXMgZm9yIG1vc3QgTm9kZSBtdXRhdG9yIG9wdGlvbnNcclxuSW1hZ2VhYmxlLkRFRkFVTFRfT1BUSU9OUyA9IERFRkFVTFRfT1BUSU9OUztcclxuXHJcbnNjZW5lcnkucmVnaXN0ZXIoICdJbWFnZWFibGUnLCBJbWFnZWFibGUgKTtcclxuZXhwb3J0IGRlZmF1bHQgSW1hZ2VhYmxlOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxXQUFXLE1BQU0saUNBQWlDO0FBQ3pELE9BQU9DLEtBQUssTUFBTSwwQkFBMEI7QUFDNUMsU0FBU0MsS0FBSyxRQUFRLDZCQUE2QjtBQUNuRCxPQUFPQyxVQUFVLE1BQU0scUNBQXFDO0FBRzVELFNBQVNDLE9BQU8sRUFBRUMsS0FBSyxFQUFFQyxPQUFPLFFBQVEsZUFBZTtBQUd2RCxPQUFPQyxzQkFBc0IsTUFBTSw0Q0FBNEM7QUFLL0U7QUFDQSxNQUFNQyxJQUFJLEdBQUdDLElBQUksQ0FBQ0QsSUFBSSxJQUFJLFVBQVVFLENBQVMsRUFBRztFQUFFLE9BQU9ELElBQUksQ0FBQ0UsR0FBRyxDQUFFRCxDQUFFLENBQUMsR0FBR0QsSUFBSSxDQUFDRyxHQUFHO0FBQUUsQ0FBQztBQUVwRixNQUFNQyxlQUFlLEdBQUc7RUFDdEJDLFlBQVksRUFBRSxDQUFDO0VBQ2ZDLFlBQVksRUFBRSxDQUFDO0VBQ2ZDLGFBQWEsRUFBRSxDQUFDO0VBQ2hCQyxNQUFNLEVBQUUsS0FBSztFQUNiQyxVQUFVLEVBQUUsQ0FBQztFQUNiQyxrQkFBa0IsRUFBRSxDQUFDO0VBQ3JCQyxjQUFjLEVBQUUsQ0FBQztFQUNqQkMsYUFBYSxFQUFFO0FBQ2pCLENBQVU7O0FBRVY7QUFDQSxJQUFJQyxhQUF1QyxHQUFHLElBQUk7QUFDbEQsSUFBSUMsY0FBK0MsR0FBRyxJQUFJO0FBQzFELE1BQU1DLGdCQUFnQixHQUFHQSxDQUFBLEtBQXlCO0VBQ2hELElBQUssQ0FBQ0YsYUFBYSxFQUFHO0lBQ3BCQSxhQUFhLEdBQUdHLFFBQVEsQ0FBQ0MsYUFBYSxDQUFFLFFBQVMsQ0FBQztFQUNwRDtFQUNBLE9BQU9KLGFBQWE7QUFDdEIsQ0FBQztBQUNELE1BQU1LLGlCQUFpQixHQUFHQSxDQUFBLEtBQU07RUFDOUIsSUFBSyxDQUFDSixjQUFjLEVBQUc7SUFDckJBLGNBQWMsR0FBR0MsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDSSxVQUFVLENBQUUsSUFBSSxFQUFFO01BQ3BEQyxrQkFBa0IsRUFBRTtJQUN0QixDQUFFLENBQUU7RUFDTjtFQUNBLE9BQU9OLGNBQWM7QUFDdkIsQ0FBQzs7QUFXRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQTs7QUFnQkE7QUFDQTs7QUEySEEsTUFBTU8sU0FBUyxHQUFvQ0MsSUFBZSxJQUEyQztFQUMzRyxPQUFPLE1BQU1DLGNBQWMsU0FBU0QsSUFBSSxDQUF1QjtJQUU3RDs7SUFHQTs7SUFHQTs7SUFHQTs7SUFHQTs7SUFHQTs7SUFHQTs7SUFHQTs7SUFHQTs7SUFHQTtJQUNBOztJQUdBOztJQUdBO0lBQ0E7O0lBR0E7O0lBR0E7O0lBR0E7O0lBR0E7SUFDQTs7SUFHQTs7SUFHQTs7SUFHT0UsV0FBV0EsQ0FBRSxHQUFHQyxJQUFzQixFQUFHO01BRTlDLEtBQUssQ0FBRSxHQUFHQSxJQUFLLENBQUM7O01BRWhCO01BQ0EsSUFBSSxDQUFDQyxjQUFjLEdBQUcsSUFBSTVCLHNCQUFzQixDQUFFLElBQUksRUFBK0IsS0FBSyxFQUFFLElBQUksQ0FBQzZCLHFCQUFxQixDQUFDQyxJQUFJLENBQUUsSUFBSyxDQUFFLENBQUM7TUFFckksSUFBSSxDQUFDQyxNQUFNLEdBQUcsSUFBSTtNQUNsQixJQUFJLENBQUNDLGFBQWEsR0FBRzFCLGVBQWUsQ0FBQ0UsWUFBWTtNQUNqRCxJQUFJLENBQUN5QixjQUFjLEdBQUczQixlQUFlLENBQUNHLGFBQWE7TUFDbkQsSUFBSSxDQUFDeUIsYUFBYSxHQUFHNUIsZUFBZSxDQUFDQyxZQUFZO01BQ2pELElBQUksQ0FBQzRCLE9BQU8sR0FBRzdCLGVBQWUsQ0FBQ0ksTUFBTTtNQUNyQyxJQUFJLENBQUMwQixXQUFXLEdBQUc5QixlQUFlLENBQUNLLFVBQVU7TUFDN0MsSUFBSSxDQUFDMEIsbUJBQW1CLEdBQUcvQixlQUFlLENBQUNNLGtCQUFrQjtNQUM3RCxJQUFJLENBQUMwQixlQUFlLEdBQUdoQyxlQUFlLENBQUNPLGNBQWM7TUFDckQsSUFBSSxDQUFDMEIsY0FBYyxHQUFHakMsZUFBZSxDQUFDUSxhQUFhO01BQ25ELElBQUksQ0FBQzBCLGVBQWUsR0FBRyxFQUFFO01BQ3pCLElBQUksQ0FBQ0MsV0FBVyxHQUFHLEVBQUU7TUFDckIsSUFBSSxDQUFDQyxXQUFXLEdBQUcsSUFBSTtNQUN2QixJQUFJLENBQUNDLGtCQUFrQixHQUFHLElBQUksQ0FBQ0MsWUFBWSxDQUFDZCxJQUFJLENBQUUsSUFBSyxDQUFDO01BQ3hELElBQUksQ0FBQ2UsMEJBQTBCLEdBQUcsS0FBSztNQUN2QyxJQUFJLENBQUNDLGlCQUFpQixHQUFHLElBQUk7TUFDN0IsSUFBSSxDQUFDQyxhQUFhLEdBQUcsSUFBSXRELFdBQVcsQ0FBQyxDQUFDO0lBQ3hDOztJQUVBO0FBQ0o7QUFDQTtBQUNBO0lBQ1d1RCxRQUFRQSxDQUFFQyxLQUFxQixFQUFTO01BQzdDQyxNQUFNLElBQUlBLE1BQU0sQ0FBRUQsS0FBSyxFQUFFLDJCQUE0QixDQUFDO01BRXRELElBQUksQ0FBQ3JCLGNBQWMsQ0FBQ3VCLEtBQUssR0FBR0YsS0FBSztNQUVqQyxPQUFPLElBQUk7SUFDYjtJQUVBLElBQVdBLEtBQUtBLENBQUVFLEtBQXFCLEVBQUc7TUFBRSxJQUFJLENBQUNILFFBQVEsQ0FBRUcsS0FBTSxDQUFDO0lBQUU7SUFFcEUsSUFBV0YsS0FBS0EsQ0FBQSxFQUFnQjtNQUFFLE9BQU8sSUFBSSxDQUFDRyxRQUFRLENBQUMsQ0FBQztJQUFFOztJQUUxRDtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNXQSxRQUFRQSxDQUFBLEVBQWdCO01BQzdCRixNQUFNLElBQUlBLE1BQU0sQ0FBRSxJQUFJLENBQUNuQixNQUFNLEtBQUssSUFBSyxDQUFDO01BRXhDLE9BQU8sSUFBSSxDQUFDQSxNQUFNO0lBQ3BCO0lBRVFGLHFCQUFxQkEsQ0FBRW9CLEtBQXFCLEVBQVM7TUFDM0RDLE1BQU0sSUFBSUEsTUFBTSxDQUFFRCxLQUFLLEVBQUUsMkJBQTRCLENBQUM7O01BRXREO01BQ0EsSUFBSUksZUFBZSxHQUFHLElBQUksQ0FBQ3RCLE1BQU0sS0FBS2tCLEtBQUs7O01BRTNDO01BQ0E7TUFDQSxJQUFLSSxlQUFlLElBQUksT0FBT0osS0FBSyxLQUFLLFFBQVEsSUFBSSxJQUFJLENBQUNsQixNQUFNLElBQUksSUFBSSxDQUFDQSxNQUFNLFlBQVl1QixnQkFBZ0IsSUFBSUwsS0FBSyxLQUFLLElBQUksQ0FBQ2xCLE1BQU0sQ0FBQ3dCLEdBQUcsRUFBRztRQUN6SUYsZUFBZSxHQUFHLEtBQUs7TUFDekI7O01BRUE7TUFDQSxJQUFLQSxlQUFlLElBQUlKLEtBQUssS0FBSyxJQUFJLENBQUNQLFdBQVcsRUFBRztRQUNuRFcsZUFBZSxHQUFHLEtBQUs7TUFDekI7TUFFQSxJQUFLQSxlQUFlLEVBQUc7UUFDckI7UUFDQSxJQUFJLENBQUNyQixhQUFhLEdBQUcsQ0FBQztRQUN0QixJQUFJLENBQUNDLGNBQWMsR0FBRyxDQUFDOztRQUV2QjtRQUNBLElBQUssSUFBSSxDQUFDRixNQUFNLElBQUksSUFBSSxDQUFDYywwQkFBMEIsRUFBRztVQUNwRCxJQUFJLENBQUNXLHdCQUF3QixDQUFDLENBQUM7UUFDakM7O1FBRUE7UUFDQSxJQUFJLENBQUNkLFdBQVcsR0FBRyxJQUFJOztRQUV2QjtRQUNBLElBQUssT0FBT08sS0FBSyxLQUFLLFFBQVEsRUFBRztVQUMvQjtVQUNBLE1BQU1NLEdBQUcsR0FBR04sS0FBSztVQUNqQkEsS0FBSyxHQUFHL0IsUUFBUSxDQUFDQyxhQUFhLENBQUUsS0FBTSxDQUFDO1VBQ3ZDOEIsS0FBSyxDQUFDTSxHQUFHLEdBQUdBLEdBQUc7UUFDakI7UUFDQTtRQUFBLEtBQ0ssSUFBS0UsS0FBSyxDQUFDQyxPQUFPLENBQUVULEtBQU0sQ0FBQyxFQUFHO1VBQ2pDO1VBQ0EsSUFBSSxDQUFDUCxXQUFXLEdBQUdPLEtBQUs7VUFDeEJBLEtBQUssR0FBR0EsS0FBSyxDQUFFLENBQUMsQ0FBRSxDQUFDVSxHQUFJLENBQUMsQ0FBQzs7VUFFekI7VUFDQSxJQUFJLENBQUN0QixtQkFBbUIsR0FBRyxJQUFJLENBQUNDLGVBQWUsR0FBRyxJQUFJLENBQUNJLFdBQVcsQ0FBQ2tCLE1BQU07VUFDekUsSUFBSSxDQUFDekIsT0FBTyxHQUFHLElBQUk7UUFDckI7O1FBRUE7UUFDQSxJQUFJLENBQUNKLE1BQU0sR0FBR2tCLEtBQUs7O1FBRW5CO1FBQ0EsSUFBSyxJQUFJLENBQUNsQixNQUFNLFlBQVl1QixnQkFBZ0IsS0FBTSxDQUFDLElBQUksQ0FBQ3ZCLE1BQU0sQ0FBQzhCLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQzlCLE1BQU0sQ0FBQytCLE1BQU0sQ0FBRSxFQUFHO1VBQzlGLElBQUksQ0FBQ0Msd0JBQXdCLENBQUMsQ0FBQztRQUNqQzs7UUFFQTtRQUNBLElBQUksQ0FBQ0MsZUFBZSxDQUFDLENBQUM7TUFDeEI7SUFDRjs7SUFFQTtBQUNKO0FBQ0E7SUFDV0MsZ0JBQWdCQSxDQUFFQyxTQUFtRCxFQUFTO01BQ25GO01BQ0EsT0FBTyxJQUFJLENBQUN0QyxjQUFjLENBQUN1QyxpQkFBaUIsQ0FBRUQsU0FBdUMsQ0FBQztJQUN4RjtJQUVBLElBQVdFLGFBQWFBLENBQUVDLFFBQWtELEVBQUc7TUFBRSxJQUFJLENBQUNKLGdCQUFnQixDQUFFSSxRQUFTLENBQUM7SUFBRTtJQUVwSCxJQUFXRCxhQUFhQSxDQUFBLEVBQThCO01BQUUsT0FBTyxJQUFJLENBQUNFLGdCQUFnQixDQUFDLENBQUM7SUFBRTs7SUFFeEY7QUFDSjtBQUNBO0FBQ0E7SUFDV0EsZ0JBQWdCQSxDQUFBLEVBQThCO01BQ25ELE9BQU8sSUFBSSxDQUFDMUMsY0FBYztJQUM1Qjs7SUFFQTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDV29DLGVBQWVBLENBQUEsRUFBUztNQUM3QixJQUFJLENBQUNPLGlCQUFpQixDQUFDLENBQUM7TUFDeEIsSUFBSSxDQUFDQyxzQkFBc0IsQ0FBQyxDQUFDO0lBQy9COztJQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDV0MsZ0JBQWdCQSxDQUFFeEIsS0FBcUIsRUFBRVksS0FBYSxFQUFFQyxNQUFjLEVBQVM7TUFDcEY7TUFDQSxJQUFJLENBQUNkLFFBQVEsQ0FBRUMsS0FBTSxDQUFDOztNQUV0QjtNQUNBLElBQUksQ0FBQ3lCLGVBQWUsQ0FBRWIsS0FBTSxDQUFDO01BQzdCLElBQUksQ0FBQ2MsZ0JBQWdCLENBQUViLE1BQU8sQ0FBQztNQUUvQixPQUFPLElBQUk7SUFDYjs7SUFFQTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDV2MsZUFBZUEsQ0FBRXJFLFlBQW9CLEVBQVM7TUFDbkQyQyxNQUFNLElBQUlBLE1BQU0sQ0FBRTJCLFFBQVEsQ0FBRXRFLFlBQWEsQ0FBQyxJQUFJQSxZQUFZLElBQUksQ0FBQyxJQUFJQSxZQUFZLElBQUksQ0FBQyxFQUNqRiw4QkFBNkJBLFlBQWEsRUFBRSxDQUFDO01BRWhELElBQUssSUFBSSxDQUFDMkIsYUFBYSxLQUFLM0IsWUFBWSxFQUFHO1FBQ3pDLElBQUksQ0FBQzJCLGFBQWEsR0FBRzNCLFlBQVk7TUFDbkM7SUFDRjtJQUVBLElBQVdBLFlBQVlBLENBQUU0QyxLQUFhLEVBQUc7TUFBRSxJQUFJLENBQUN5QixlQUFlLENBQUV6QixLQUFNLENBQUM7SUFBRTtJQUUxRSxJQUFXNUMsWUFBWUEsQ0FBQSxFQUFXO01BQUUsT0FBTyxJQUFJLENBQUN1RSxlQUFlLENBQUMsQ0FBQztJQUFFOztJQUVuRTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0lBQ1dBLGVBQWVBLENBQUEsRUFBVztNQUMvQixPQUFPLElBQUksQ0FBQzVDLGFBQWE7SUFDM0I7O0lBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBQ1d3QyxlQUFlQSxDQUFFYixLQUFhLEVBQVM7TUFDNUNYLE1BQU0sSUFBSUEsTUFBTSxDQUFFVyxLQUFLLElBQUksQ0FBQyxJQUFNQSxLQUFLLEdBQUcsQ0FBQyxLQUFLLENBQUcsRUFBRSwrQ0FBZ0QsQ0FBQztNQUV0RyxJQUFLQSxLQUFLLEtBQUssSUFBSSxDQUFDN0IsYUFBYSxFQUFHO1FBQ2xDLElBQUksQ0FBQ0EsYUFBYSxHQUFHNkIsS0FBSztRQUUxQixJQUFJLENBQUNHLGVBQWUsQ0FBQyxDQUFDO01BQ3hCO01BRUEsT0FBTyxJQUFJO0lBQ2I7SUFFQSxJQUFXeEQsWUFBWUEsQ0FBRTJDLEtBQWEsRUFBRztNQUFFLElBQUksQ0FBQ3VCLGVBQWUsQ0FBRXZCLEtBQU0sQ0FBQztJQUFFO0lBRTFFLElBQVczQyxZQUFZQSxDQUFBLEVBQVc7TUFBRSxPQUFPLElBQUksQ0FBQ3VFLGVBQWUsQ0FBQyxDQUFDO0lBQUU7O0lBRW5FO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7SUFDV0EsZUFBZUEsQ0FBQSxFQUFXO01BQy9CLE9BQU8sSUFBSSxDQUFDL0MsYUFBYTtJQUMzQjs7SUFFQTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDVzJDLGdCQUFnQkEsQ0FBRWIsTUFBYyxFQUFTO01BQzlDWixNQUFNLElBQUlBLE1BQU0sQ0FBRVksTUFBTSxJQUFJLENBQUMsSUFBTUEsTUFBTSxHQUFHLENBQUMsS0FBSyxDQUFHLEVBQUUsZ0RBQWlELENBQUM7TUFFekcsSUFBS0EsTUFBTSxLQUFLLElBQUksQ0FBQzdCLGNBQWMsRUFBRztRQUNwQyxJQUFJLENBQUNBLGNBQWMsR0FBRzZCLE1BQU07UUFFNUIsSUFBSSxDQUFDRSxlQUFlLENBQUMsQ0FBQztNQUN4QjtNQUVBLE9BQU8sSUFBSTtJQUNiO0lBRUEsSUFBV3ZELGFBQWFBLENBQUUwQyxLQUFhLEVBQUc7TUFBRSxJQUFJLENBQUN3QixnQkFBZ0IsQ0FBRXhCLEtBQU0sQ0FBQztJQUFFO0lBRTVFLElBQVcxQyxhQUFhQSxDQUFBLEVBQVc7TUFBRSxPQUFPLElBQUksQ0FBQ3VFLGdCQUFnQixDQUFDLENBQUM7SUFBRTs7SUFFckU7QUFDSjtBQUNBO0FBQ0E7QUFDQTtJQUNXQSxnQkFBZ0JBLENBQUEsRUFBVztNQUNoQyxPQUFPLElBQUksQ0FBQy9DLGNBQWM7SUFDNUI7O0lBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNXZ0QsU0FBU0EsQ0FBRXZFLE1BQWUsRUFBUztNQUN4QyxJQUFLLElBQUksQ0FBQ3lCLE9BQU8sS0FBS3pCLE1BQU0sRUFBRztRQUM3QixJQUFJLENBQUN5QixPQUFPLEdBQUd6QixNQUFNO1FBRXJCLElBQUksQ0FBQzZELGlCQUFpQixDQUFDLENBQUM7TUFDMUI7TUFFQSxPQUFPLElBQUk7SUFDYjtJQUVBLElBQVc3RCxNQUFNQSxDQUFFeUMsS0FBYyxFQUFHO01BQUUsSUFBSSxDQUFDOEIsU0FBUyxDQUFFOUIsS0FBTSxDQUFDO0lBQUU7SUFFL0QsSUFBV3pDLE1BQU1BLENBQUEsRUFBWTtNQUFFLE9BQU8sSUFBSSxDQUFDd0UsUUFBUSxDQUFDLENBQUM7SUFBRTs7SUFFdkQ7QUFDSjtBQUNBO0FBQ0E7QUFDQTtJQUNXQSxRQUFRQSxDQUFBLEVBQVk7TUFDekIsT0FBTyxJQUFJLENBQUMvQyxPQUFPO0lBQ3JCOztJQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDV2dELGFBQWFBLENBQUVDLElBQVksRUFBUztNQUN6QyxJQUFLLElBQUksQ0FBQ2hELFdBQVcsS0FBS2dELElBQUksRUFBRztRQUMvQixJQUFJLENBQUNoRCxXQUFXLEdBQUdnRCxJQUFJO1FBRXZCLElBQUksQ0FBQ2IsaUJBQWlCLENBQUMsQ0FBQztNQUMxQjtNQUVBLE9BQU8sSUFBSTtJQUNiO0lBRUEsSUFBVzVELFVBQVVBLENBQUV3QyxLQUFhLEVBQUc7TUFBRSxJQUFJLENBQUNnQyxhQUFhLENBQUVoQyxLQUFNLENBQUM7SUFBRTtJQUV0RSxJQUFXeEMsVUFBVUEsQ0FBQSxFQUFXO01BQUUsT0FBTyxJQUFJLENBQUMwRSxhQUFhLENBQUMsQ0FBQztJQUFFOztJQUUvRDtBQUNKO0FBQ0E7QUFDQTtBQUNBO0lBQ1dBLGFBQWFBLENBQUEsRUFBVztNQUM3QixPQUFPLElBQUksQ0FBQ2pELFdBQVc7SUFDekI7O0lBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBQ1drRCxxQkFBcUJBLENBQUVDLEtBQWEsRUFBUztNQUNsRHJDLE1BQU0sSUFBSUEsTUFBTSxDQUFFcUMsS0FBSyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUlBLEtBQUssSUFBSSxDQUFDLEVBQzdDLHFEQUFzRCxDQUFDO01BRXpELElBQUssSUFBSSxDQUFDbEQsbUJBQW1CLEtBQUtrRCxLQUFLLEVBQUc7UUFDeEMsSUFBSSxDQUFDbEQsbUJBQW1CLEdBQUdrRCxLQUFLO1FBRWhDLElBQUksQ0FBQ2hCLGlCQUFpQixDQUFDLENBQUM7TUFDMUI7TUFFQSxPQUFPLElBQUk7SUFDYjtJQUVBLElBQVczRCxrQkFBa0JBLENBQUV1QyxLQUFhLEVBQUc7TUFBRSxJQUFJLENBQUNtQyxxQkFBcUIsQ0FBRW5DLEtBQU0sQ0FBQztJQUFFO0lBRXRGLElBQVd2QyxrQkFBa0JBLENBQUEsRUFBVztNQUFFLE9BQU8sSUFBSSxDQUFDNEUscUJBQXFCLENBQUMsQ0FBQztJQUFFOztJQUUvRTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0lBQ1dBLHFCQUFxQkEsQ0FBQSxFQUFXO01BQ3JDLE9BQU8sSUFBSSxDQUFDbkQsbUJBQW1CO0lBQ2pDOztJQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNXb0QsaUJBQWlCQSxDQUFFRixLQUFhLEVBQVM7TUFDOUNyQyxNQUFNLElBQUlBLE1BQU0sQ0FBRXFDLEtBQUssR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJQSxLQUFLLElBQUksQ0FBQyxFQUM3QyxpREFBa0QsQ0FBQztNQUVyRCxJQUFLLElBQUksQ0FBQ2pELGVBQWUsS0FBS2lELEtBQUssRUFBRztRQUNwQyxJQUFJLENBQUNqRCxlQUFlLEdBQUdpRCxLQUFLO1FBRTVCLElBQUksQ0FBQ2hCLGlCQUFpQixDQUFDLENBQUM7TUFDMUI7TUFFQSxPQUFPLElBQUk7SUFDYjtJQUVBLElBQVcxRCxjQUFjQSxDQUFFc0MsS0FBYSxFQUFHO01BQUUsSUFBSSxDQUFDc0MsaUJBQWlCLENBQUV0QyxLQUFNLENBQUM7SUFBRTtJQUU5RSxJQUFXdEMsY0FBY0EsQ0FBQSxFQUFXO01BQUUsT0FBTyxJQUFJLENBQUM2RSxpQkFBaUIsQ0FBQyxDQUFDO0lBQUU7O0lBRXZFO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7SUFDV0EsaUJBQWlCQSxDQUFBLEVBQVc7TUFDakMsT0FBTyxJQUFJLENBQUNwRCxlQUFlO0lBQzdCOztJQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNXcUQsZ0JBQWdCQSxDQUFFN0UsYUFBc0IsRUFBUztNQUV0RCxJQUFLLElBQUksQ0FBQ3lCLGNBQWMsS0FBS3pCLGFBQWEsRUFBRztRQUMzQyxJQUFJLENBQUN5QixjQUFjLEdBQUd6QixhQUFhO1FBRW5DLElBQUksQ0FBQzBELHNCQUFzQixDQUFDLENBQUM7TUFDL0I7TUFFQSxPQUFPLElBQUk7SUFDYjtJQUVBLElBQVcxRCxhQUFhQSxDQUFFcUMsS0FBYyxFQUFHO01BQUUsSUFBSSxDQUFDd0MsZ0JBQWdCLENBQUV4QyxLQUFNLENBQUM7SUFBRTtJQUU3RSxJQUFXckMsYUFBYUEsQ0FBQSxFQUFZO01BQUUsT0FBTyxJQUFJLENBQUM4RSxnQkFBZ0IsQ0FBQyxDQUFDO0lBQUU7O0lBRXRFO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7SUFDV0EsZ0JBQWdCQSxDQUFBLEVBQVk7TUFDakMsT0FBTyxJQUFJLENBQUNyRCxjQUFjO0lBQzVCOztJQUVBO0FBQ0o7QUFDQTtJQUNZc0Qsb0JBQW9CQSxDQUFBLEVBQVM7TUFDbkMsTUFBTU4sS0FBSyxHQUFHLElBQUksQ0FBQy9DLGVBQWUsQ0FBQ29CLE1BQU07TUFDekMsTUFBTWtDLFlBQVksR0FBRyxJQUFJLENBQUN0RCxlQUFlLENBQUUrQyxLQUFLLEdBQUcsQ0FBQyxDQUFFOztNQUV0RDtNQUNBLElBQUtPLFlBQVksQ0FBQ2pDLEtBQUssR0FBR2lDLFlBQVksQ0FBQ2hDLE1BQU0sR0FBRyxDQUFDLEVBQUc7UUFDbEQsTUFBTWlDLE1BQU0sR0FBRzdFLFFBQVEsQ0FBQ0MsYUFBYSxDQUFFLFFBQVMsQ0FBQztRQUNqRDRFLE1BQU0sQ0FBQ2xDLEtBQUssR0FBRzNELElBQUksQ0FBQzhGLElBQUksQ0FBRUYsWUFBWSxDQUFDakMsS0FBSyxHQUFHLENBQUUsQ0FBQztRQUNsRGtDLE1BQU0sQ0FBQ2pDLE1BQU0sR0FBRzVELElBQUksQ0FBQzhGLElBQUksQ0FBRUYsWUFBWSxDQUFDaEMsTUFBTSxHQUFHLENBQUUsQ0FBQzs7UUFFcEQ7UUFDQSxJQUFLaUMsTUFBTSxDQUFDbEMsS0FBSyxHQUFHLENBQUMsSUFBSWtDLE1BQU0sQ0FBQ2pDLE1BQU0sR0FBRyxDQUFDLEVBQUc7VUFDM0M7VUFDQSxNQUFNbUMsT0FBTyxHQUFHRixNQUFNLENBQUMxRSxVQUFVLENBQUUsSUFBSyxDQUFFO1VBQzFDNEUsT0FBTyxDQUFDQyxLQUFLLENBQUUsR0FBRyxFQUFFLEdBQUksQ0FBQztVQUN6QkQsT0FBTyxDQUFDRSxTQUFTLENBQUVMLFlBQVksRUFBRSxDQUFDLEVBQUUsQ0FBRSxDQUFDO1VBRXZDLElBQUksQ0FBQ3RELGVBQWUsQ0FBQzRELElBQUksQ0FBRUwsTUFBTyxDQUFDO1VBQ25DLElBQUksQ0FBQ3RELFdBQVcsQ0FBQzJELElBQUksQ0FBRUwsTUFBTSxDQUFDTSxTQUFTLENBQUMsQ0FBRSxDQUFDO1FBQzdDO01BQ0Y7SUFDRjs7SUFFQTtBQUNKO0FBQ0E7SUFDVzlCLGlCQUFpQkEsQ0FBQSxFQUFTO01BQy9CO01BQ0EzRSxVQUFVLENBQUUsSUFBSSxDQUFDNEMsZUFBZ0IsQ0FBQztNQUNsQzVDLFVBQVUsQ0FBRSxJQUFJLENBQUM2QyxXQUFZLENBQUM7TUFFOUIsSUFBSyxJQUFJLENBQUNWLE1BQU0sSUFBSSxJQUFJLENBQUNJLE9BQU8sRUFBRztRQUNqQztRQUNBLElBQUssSUFBSSxDQUFDTyxXQUFXLEVBQUc7VUFDdEIsS0FBTSxJQUFJNEQsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHLElBQUksQ0FBQzVELFdBQVcsQ0FBQ2tCLE1BQU0sRUFBRTBDLENBQUMsRUFBRSxFQUFHO1lBQ2xELE1BQU1DLEdBQUcsR0FBRyxJQUFJLENBQUM3RCxXQUFXLENBQUU0RCxDQUFDLENBQUUsQ0FBQ0MsR0FBRztZQUNyQyxJQUFJLENBQUM5RCxXQUFXLENBQUMyRCxJQUFJLENBQUVHLEdBQUksQ0FBQztZQUM1QixNQUFNQyxZQUFZLEdBQUcsSUFBSSxDQUFDOUQsV0FBVyxDQUFFNEQsQ0FBQyxDQUFFLENBQUNFLFlBQVk7WUFDdkRBLFlBQVksSUFBSUEsWUFBWSxDQUFDLENBQUM7WUFDOUIsSUFBSSxDQUFDaEUsZUFBZSxDQUFDNEQsSUFBSSxDQUFFLElBQUksQ0FBQzFELFdBQVcsQ0FBRTRELENBQUMsQ0FBRSxDQUFDUCxNQUFRLENBQUM7VUFDNUQ7UUFDRjtRQUNBO1FBQUEsS0FDSztVQUNILE1BQU1VLFVBQVUsR0FBR3ZGLFFBQVEsQ0FBQ0MsYUFBYSxDQUFFLFFBQVMsQ0FBQztVQUNyRHNGLFVBQVUsQ0FBQzVDLEtBQUssR0FBRyxJQUFJLENBQUM2QyxhQUFhLENBQUMsQ0FBQztVQUN2Q0QsVUFBVSxDQUFDM0MsTUFBTSxHQUFHLElBQUksQ0FBQzZDLGNBQWMsQ0FBQyxDQUFDOztVQUV6QztVQUNBLElBQUtGLFVBQVUsQ0FBQzVDLEtBQUssSUFBSTRDLFVBQVUsQ0FBQzNDLE1BQU0sRUFBRztZQUMzQyxNQUFNOEMsV0FBVyxHQUFHSCxVQUFVLENBQUNwRixVQUFVLENBQUUsSUFBSyxDQUFFO1lBQ2xEdUYsV0FBVyxDQUFDVCxTQUFTLENBQUUsSUFBSSxDQUFDcEUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFFLENBQUM7WUFFMUMsSUFBSSxDQUFDUyxlQUFlLENBQUM0RCxJQUFJLENBQUVLLFVBQVcsQ0FBQztZQUN2QyxJQUFJLENBQUNoRSxXQUFXLENBQUMyRCxJQUFJLENBQUVLLFVBQVUsQ0FBQ0osU0FBUyxDQUFDLENBQUUsQ0FBQztZQUUvQyxJQUFJZCxLQUFLLEdBQUcsQ0FBQztZQUNiLE9BQVEsRUFBRUEsS0FBSyxHQUFHLElBQUksQ0FBQ2xELG1CQUFtQixFQUFHO2NBQzNDLElBQUksQ0FBQ3dELG9CQUFvQixDQUFDLENBQUM7WUFDN0I7VUFDRjtRQUNGO01BQ0Y7TUFFQSxJQUFJLENBQUM5QyxhQUFhLENBQUM4RCxJQUFJLENBQUMsQ0FBQztJQUMzQjs7SUFFQTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDV0MsY0FBY0EsQ0FBRUMsTUFBZSxFQUFFQyxjQUFjLEdBQUcsQ0FBQyxFQUFXO01BQ25FOUQsTUFBTSxJQUFJQSxNQUFNLENBQUUsSUFBSSxDQUFDZixPQUFPLEVBQUUsNkJBQThCLENBQUM7O01BRS9EO01BQ0EsTUFBTStELEtBQUssR0FBRzNFLFNBQVMsQ0FBQzBGLHlCQUF5QixDQUFFRixNQUFPLENBQUMsSUFBS0csTUFBTSxDQUFDQyxnQkFBZ0IsSUFBSSxDQUFDLENBQUU7TUFFOUYsT0FBTyxJQUFJLENBQUNDLHVCQUF1QixDQUFFbEIsS0FBSyxFQUFFYyxjQUFlLENBQUM7SUFDOUQ7O0lBRUE7QUFDSjtBQUNBO0lBQ1dJLHVCQUF1QkEsQ0FBRWxCLEtBQWEsRUFBRWMsY0FBYyxHQUFHLENBQUMsRUFBVztNQUMxRTlELE1BQU0sSUFBSUEsTUFBTSxDQUFFZ0QsS0FBSyxHQUFHLENBQUMsRUFBRSxtQ0FBb0MsQ0FBQzs7TUFFbEU7TUFDQSxJQUFLQSxLQUFLLElBQUksQ0FBQyxFQUFHO1FBQ2hCLE9BQU8sQ0FBQztNQUNWOztNQUVBO01BQ0EsSUFBSVgsS0FBSyxHQUFHdEYsSUFBSSxDQUFFLENBQUMsR0FBR2lHLEtBQU0sQ0FBQzs7TUFFN0I7TUFDQVgsS0FBSyxHQUFHN0YsS0FBSyxDQUFDMkgsY0FBYyxDQUFFOUIsS0FBSyxHQUFHLElBQUksQ0FBQ25ELFdBQVcsR0FBRzRFLGNBQWMsR0FBRyxHQUFJLENBQUM7TUFFL0UsSUFBS3pCLEtBQUssR0FBRyxDQUFDLEVBQUc7UUFDZkEsS0FBSyxHQUFHLENBQUM7TUFDWDtNQUNBLElBQUtBLEtBQUssR0FBRyxJQUFJLENBQUNqRCxlQUFlLEVBQUc7UUFDbENpRCxLQUFLLEdBQUcsSUFBSSxDQUFDakQsZUFBZTtNQUM5Qjs7TUFFQTtNQUNBLElBQUssSUFBSSxDQUFDNUIsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDOEIsZUFBZSxDQUFFK0MsS0FBSyxDQUFFLEVBQUc7UUFDbkQsSUFBSStCLFlBQVksR0FBRyxJQUFJLENBQUM5RSxlQUFlLENBQUNvQixNQUFNLEdBQUcsQ0FBQztRQUNsRCxPQUFRLEVBQUUwRCxZQUFZLElBQUkvQixLQUFLLEVBQUc7VUFDaEMsSUFBSSxDQUFDTSxvQkFBb0IsQ0FBQyxDQUFDO1FBQzdCO1FBQ0E7UUFDQSxPQUFPM0YsSUFBSSxDQUFDcUgsR0FBRyxDQUFFaEMsS0FBSyxFQUFFLElBQUksQ0FBQy9DLGVBQWUsQ0FBQ29CLE1BQU0sR0FBRyxDQUFFLENBQUM7TUFDM0Q7TUFDQTtNQUFBLEtBQ0s7UUFDSCxPQUFPMkIsS0FBSztNQUNkO0lBQ0Y7O0lBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0lBQ1dpQyxlQUFlQSxDQUFFakMsS0FBYSxFQUFzQjtNQUN6RHJDLE1BQU0sSUFBSUEsTUFBTSxDQUFFcUMsS0FBSyxJQUFJLENBQUMsSUFDNUJBLEtBQUssR0FBRyxJQUFJLENBQUMvQyxlQUFlLENBQUNvQixNQUFNLElBQ2pDMkIsS0FBSyxHQUFHLENBQUMsS0FBTyxDQUFFLENBQUM7O01BRXJCO01BQ0EsSUFBSyxJQUFJLENBQUM3QyxXQUFXLEVBQUc7UUFDdEI7UUFDQSxNQUFNOEQsWUFBWSxHQUFHLElBQUksQ0FBQzlELFdBQVcsQ0FBRTZDLEtBQUssQ0FBRSxJQUFJLElBQUksQ0FBQzdDLFdBQVcsQ0FBRTZDLEtBQUssQ0FBRSxDQUFDaUIsWUFBWTtRQUN4RkEsWUFBWSxJQUFJQSxZQUFZLENBQUMsQ0FBQztNQUNoQztNQUNBLE9BQU8sSUFBSSxDQUFDaEUsZUFBZSxDQUFFK0MsS0FBSyxDQUFFO0lBQ3RDOztJQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNXa0MsWUFBWUEsQ0FBRWxDLEtBQWEsRUFBVztNQUMzQ3JDLE1BQU0sSUFBSUEsTUFBTSxDQUFFcUMsS0FBSyxJQUFJLENBQUMsSUFDNUJBLEtBQUssR0FBRyxJQUFJLENBQUMvQyxlQUFlLENBQUNvQixNQUFNLElBQ2pDMkIsS0FBSyxHQUFHLENBQUMsS0FBTyxDQUFFLENBQUM7TUFFckIsT0FBTyxJQUFJLENBQUM5QyxXQUFXLENBQUU4QyxLQUFLLENBQUU7SUFDbEM7O0lBRUE7QUFDSjtBQUNBO0lBQ1dtQyxVQUFVQSxDQUFBLEVBQVk7TUFDM0IsT0FBTyxJQUFJLENBQUNsRixlQUFlLENBQUNvQixNQUFNLEdBQUcsQ0FBQztJQUN4Qzs7SUFFQTtBQUNKO0FBQ0E7SUFDWVksc0JBQXNCQSxDQUFBLEVBQVM7TUFDckM7TUFDQSxJQUFLLENBQUMsSUFBSSxDQUFDakMsY0FBYyxFQUFHO1FBQzFCO01BQ0Y7TUFFQSxJQUFLLElBQUksQ0FBQ1IsTUFBTSxLQUFLLElBQUksRUFBRztRQUMxQixJQUFJLENBQUNlLGlCQUFpQixHQUFHdkIsU0FBUyxDQUFDb0csY0FBYyxDQUFFLElBQUksQ0FBQzVGLE1BQU0sRUFBRSxJQUFJLENBQUM2RixVQUFVLEVBQUUsSUFBSSxDQUFDQyxXQUFZLENBQUM7TUFDckc7SUFDRjs7SUFFQTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0lBQ1duQixhQUFhQSxDQUFBLEVBQVc7TUFDN0IsSUFBSyxJQUFJLENBQUMzRSxNQUFNLEtBQUssSUFBSSxFQUFHO1FBQzFCLE9BQU8sQ0FBQztNQUNWO01BRUEsTUFBTStGLGFBQWEsR0FBRyxJQUFJLENBQUNwRixXQUFXLEdBQUcsSUFBSSxDQUFDQSxXQUFXLENBQUUsQ0FBQyxDQUFFLENBQUNtQixLQUFLLEdBQUssQ0FBRSxjQUFjLElBQUksSUFBSSxDQUFDOUIsTUFBTSxHQUFHLElBQUksQ0FBQ0EsTUFBTSxDQUFDZ0csWUFBWSxHQUFHLENBQUMsS0FBTSxJQUFJLENBQUNoRyxNQUFNLENBQUM4QixLQUFPO01BQ2hLLElBQUtpRSxhQUFhLEtBQUssQ0FBQyxFQUFHO1FBQ3pCLE9BQU8sSUFBSSxDQUFDOUYsYUFBYSxDQUFDLENBQUM7TUFDN0IsQ0FBQyxNQUNJO1FBQ0hrQixNQUFNLElBQUlBLE1BQU0sQ0FBRSxJQUFJLENBQUNsQixhQUFhLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQ0EsYUFBYSxLQUFLOEYsYUFBYSxFQUFFLHdCQUF5QixDQUFDO1FBRTlHLE9BQU9BLGFBQWE7TUFDdEI7SUFDRjtJQUVBLElBQVdGLFVBQVVBLENBQUEsRUFBVztNQUFFLE9BQU8sSUFBSSxDQUFDbEIsYUFBYSxDQUFDLENBQUM7SUFBRTs7SUFFL0Q7QUFDSjtBQUNBO0FBQ0E7QUFDQTtJQUNXQyxjQUFjQSxDQUFBLEVBQVc7TUFDOUIsSUFBSyxJQUFJLENBQUM1RSxNQUFNLEtBQUssSUFBSSxFQUFHO1FBQzFCLE9BQU8sQ0FBQztNQUNWO01BRUEsTUFBTWlHLGNBQWMsR0FBRyxJQUFJLENBQUN0RixXQUFXLEdBQUcsSUFBSSxDQUFDQSxXQUFXLENBQUUsQ0FBQyxDQUFFLENBQUNvQixNQUFNLEdBQUssQ0FBRSxlQUFlLElBQUksSUFBSSxDQUFDL0IsTUFBTSxHQUFHLElBQUksQ0FBQ0EsTUFBTSxDQUFDa0csYUFBYSxHQUFHLENBQUMsS0FBTSxJQUFJLENBQUNsRyxNQUFNLENBQUMrQixNQUFRO01BQ3JLLElBQUtrRSxjQUFjLEtBQUssQ0FBQyxFQUFHO1FBQzFCLE9BQU8sSUFBSSxDQUFDL0YsY0FBYyxDQUFDLENBQUM7TUFDOUIsQ0FBQyxNQUNJO1FBQ0hpQixNQUFNLElBQUlBLE1BQU0sQ0FBRSxJQUFJLENBQUNqQixjQUFjLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQ0EsY0FBYyxLQUFLK0YsY0FBYyxFQUFFLHlCQUEwQixDQUFDO1FBRWxILE9BQU9BLGNBQWM7TUFDdkI7SUFDRjtJQUVBLElBQVdILFdBQVdBLENBQUEsRUFBVztNQUFFLE9BQU8sSUFBSSxDQUFDbEIsY0FBYyxDQUFDLENBQUM7SUFBRTs7SUFFakU7QUFDSjtBQUNBO0lBQ1d1QixXQUFXQSxDQUFBLEVBQVc7TUFDM0JoRixNQUFNLElBQUlBLE1BQU0sQ0FBRSxJQUFJLENBQUNuQixNQUFNLFlBQVl1QixnQkFBZ0IsRUFBRSx3Q0FBeUMsQ0FBQztNQUVyRyxPQUFTLElBQUksQ0FBQ3ZCLE1BQU0sQ0FBdUJ3QixHQUFHO0lBQ2hEOztJQUVBO0FBQ0o7QUFDQTtJQUNZUSx3QkFBd0JBLENBQUEsRUFBUztNQUN2Q2IsTUFBTSxJQUFJQSxNQUFNLENBQUUsQ0FBQyxJQUFJLENBQUNMLDBCQUEwQixFQUFFLGdEQUFpRCxDQUFDO01BRXRHLElBQUssQ0FBQyxJQUFJLENBQUNzRixVQUFVLEVBQUc7UUFDcEIsSUFBSSxDQUFDcEcsTUFBTSxDQUF1QnFHLGdCQUFnQixDQUFFLE1BQU0sRUFBRSxJQUFJLENBQUN6RixrQkFBbUIsQ0FBQztRQUN2RixJQUFJLENBQUNFLDBCQUEwQixHQUFHLElBQUk7TUFDeEM7SUFDRjs7SUFFQTtBQUNKO0FBQ0E7SUFDWVcsd0JBQXdCQSxDQUFBLEVBQVM7TUFDdkNOLE1BQU0sSUFBSUEsTUFBTSxDQUFFLElBQUksQ0FBQ0wsMEJBQTBCLEVBQUUsNENBQTZDLENBQUM7TUFFL0YsSUFBSSxDQUFDZCxNQUFNLENBQXVCc0csbUJBQW1CLENBQUUsTUFBTSxFQUFFLElBQUksQ0FBQzFGLGtCQUFtQixDQUFDO01BQzFGLElBQUksQ0FBQ0UsMEJBQTBCLEdBQUcsS0FBSztJQUN6Qzs7SUFFQTtBQUNKO0FBQ0E7SUFDWUQsWUFBWUEsQ0FBQSxFQUFTO01BQzNCTSxNQUFNLElBQUlBLE1BQU0sQ0FBRSxJQUFJLENBQUNMLDBCQUEwQixFQUFFLGtEQUFtRCxDQUFDO01BRXZHLElBQUksQ0FBQ21CLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUksQ0FBQ1Isd0JBQXdCLENBQUMsQ0FBQztJQUNqQzs7SUFFQTtBQUNKO0FBQ0E7SUFDVzhFLE9BQU9BLENBQUEsRUFBUztNQUNyQixJQUFLLElBQUksQ0FBQ3ZHLE1BQU0sSUFBSSxJQUFJLENBQUNjLDBCQUEwQixFQUFHO1FBQ3BELElBQUksQ0FBQ1csd0JBQXdCLENBQUMsQ0FBQztNQUNqQztNQUVBLElBQUksQ0FBQzVCLGNBQWMsQ0FBQzBHLE9BQU8sQ0FBQyxDQUFDOztNQUU3QjtNQUNBLEtBQUssQ0FBQ0EsT0FBTyxJQUFJLEtBQUssQ0FBQ0EsT0FBTyxDQUFDLENBQUM7SUFDbEM7RUFDRixDQUFDO0FBQ0gsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBL0csU0FBUyxDQUFDb0csY0FBYyxHQUFHLENBQUUxRSxLQUFrQixFQUFFWSxLQUFhLEVBQUVDLE1BQWMsS0FBd0I7RUFDcEc7RUFDQSxJQUFLLEVBQUcsQ0FBRSxjQUFjLElBQUliLEtBQUssR0FBR0EsS0FBSyxDQUFDOEUsWUFBWSxHQUFHLENBQUMsS0FBTTlFLEtBQUssQ0FBQ1ksS0FBSyxDQUFFLElBQUksRUFBRyxDQUFFLGVBQWUsSUFBSVosS0FBSyxHQUFHQSxLQUFLLENBQUNnRixhQUFhLEdBQUcsQ0FBQyxLQUFNaEYsS0FBSyxDQUFDYSxNQUFNLENBQUUsRUFBRztJQUM3SixPQUFPLElBQUk7RUFDYjtFQUVBLE1BQU1pQyxNQUFNLEdBQUc5RSxnQkFBZ0IsQ0FBQyxDQUFDO0VBQ2pDLE1BQU1nRixPQUFPLEdBQUc3RSxpQkFBaUIsQ0FBQyxDQUFDO0VBRW5DMkUsTUFBTSxDQUFDbEMsS0FBSyxHQUFHQSxLQUFLO0VBQ3BCa0MsTUFBTSxDQUFDakMsTUFBTSxHQUFHQSxNQUFNO0VBQ3RCbUMsT0FBTyxDQUFDRSxTQUFTLENBQUVsRCxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUUsQ0FBQztFQUVoQyxPQUFPZ0QsT0FBTyxDQUFDc0MsWUFBWSxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUxRSxLQUFLLEVBQUVDLE1BQU8sQ0FBQztBQUNwRCxDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQXZDLFNBQVMsQ0FBQ2lILGVBQWUsR0FBRyxDQUFFQyxTQUFvQixFQUFFNUUsS0FBYSxFQUFFQyxNQUFjLEVBQUU0RSxLQUFjLEtBQWU7RUFDOUc7RUFDQSxNQUFNdkksQ0FBQyxHQUFHVCxLQUFLLENBQUNpSixLQUFLLENBQUV6SSxJQUFJLENBQUMwSSxLQUFLLENBQUlGLEtBQUssQ0FBQ3ZJLENBQUMsR0FBRzBELEtBQUssR0FBSzRFLFNBQVMsQ0FBQzVFLEtBQU0sQ0FBQyxFQUFFLENBQUMsRUFBRTRFLFNBQVMsQ0FBQzVFLEtBQUssR0FBRyxDQUFFLENBQUM7RUFDcEcsTUFBTWdGLENBQUMsR0FBR25KLEtBQUssQ0FBQ2lKLEtBQUssQ0FBRXpJLElBQUksQ0FBQzBJLEtBQUssQ0FBSUYsS0FBSyxDQUFDRyxDQUFDLEdBQUcvRSxNQUFNLEdBQUsyRSxTQUFTLENBQUMzRSxNQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUyRSxTQUFTLENBQUMzRSxNQUFNLEdBQUcsQ0FBRSxDQUFDO0VBRXZHLE1BQU1nRixLQUFLLEdBQUcsQ0FBQyxJQUFLM0ksQ0FBQyxHQUFHMEksQ0FBQyxHQUFHSixTQUFTLENBQUM1RSxLQUFLLENBQUUsR0FBRyxDQUFDO0VBRWpELE9BQU80RSxTQUFTLENBQUNNLElBQUksQ0FBRUQsS0FBSyxDQUFFLEtBQUssQ0FBQztBQUN0QyxDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0F2SCxTQUFTLENBQUN5SCxrQkFBa0IsR0FBRyxDQUFFUCxTQUFvQixFQUFFNUUsS0FBYSxFQUFFQyxNQUFjLEtBQWE7RUFDL0YsTUFBTW1GLFVBQVUsR0FBR3BGLEtBQUssR0FBRzRFLFNBQVMsQ0FBQzVFLEtBQUs7RUFDMUMsTUFBTXFGLFdBQVcsR0FBR3BGLE1BQU0sR0FBRzJFLFNBQVMsQ0FBQzNFLE1BQU07RUFFN0MsTUFBTXFGLEtBQUssR0FBRyxJQUFJeEosS0FBSyxDQUFDLENBQUM7O0VBRXpCO0VBQ0E7RUFDQSxJQUFJeUosTUFBTSxHQUFHLEtBQUs7RUFDbEIsSUFBSTdCLEdBQUcsR0FBRyxDQUFDOztFQUVYO0VBQ0E7O0VBRUEsS0FBTSxJQUFJc0IsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHSixTQUFTLENBQUMzRSxNQUFNLEVBQUUrRSxDQUFDLEVBQUUsRUFBRztJQUMzQyxLQUFNLElBQUkxSSxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdzSSxTQUFTLENBQUM1RSxLQUFLLEVBQUUxRCxDQUFDLEVBQUUsRUFBRztNQUMxQyxNQUFNMkksS0FBSyxHQUFHLENBQUMsSUFBSzNJLENBQUMsR0FBRzBJLENBQUMsR0FBR0osU0FBUyxDQUFDNUUsS0FBSyxDQUFFLEdBQUcsQ0FBQztNQUVqRCxJQUFLNEUsU0FBUyxDQUFDTSxJQUFJLENBQUVELEtBQUssQ0FBRSxLQUFLLENBQUMsRUFBRztRQUNuQztRQUNBLElBQUssQ0FBQ00sTUFBTSxFQUFHO1VBQ2JBLE1BQU0sR0FBRyxJQUFJO1VBQ2I3QixHQUFHLEdBQUdwSCxDQUFDO1FBQ1Q7TUFDRixDQUFDLE1BQ0ksSUFBS2lKLE1BQU0sRUFBRztRQUNqQjtRQUNBQSxNQUFNLEdBQUcsS0FBSztRQUNkRCxLQUFLLENBQUNFLElBQUksQ0FBRTlCLEdBQUcsR0FBRzBCLFVBQVUsRUFBRUosQ0FBQyxHQUFHSSxVQUFVLEVBQUVBLFVBQVUsSUFBSzlJLENBQUMsR0FBR29ILEdBQUcsQ0FBRSxFQUFFMkIsV0FBWSxDQUFDO01BQ3ZGO0lBQ0Y7SUFDQSxJQUFLRSxNQUFNLEVBQUc7TUFDWjtNQUNBQSxNQUFNLEdBQUcsS0FBSztNQUNkRCxLQUFLLENBQUNFLElBQUksQ0FBRTlCLEdBQUcsR0FBRzBCLFVBQVUsRUFBRUosQ0FBQyxHQUFHSSxVQUFVLEVBQUVBLFVBQVUsSUFBS1IsU0FBUyxDQUFDNUUsS0FBSyxHQUFHMEQsR0FBRyxDQUFFLEVBQUUyQixXQUFZLENBQUM7SUFDckc7RUFDRjtFQUVBLE9BQU9DLEtBQUssQ0FBQ0csc0JBQXNCLENBQUMsQ0FBQztBQUN2QyxDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EvSCxTQUFTLENBQUNnSSxjQUFjLEdBQUcsQ0FBRWhELEdBQVcsRUFBRTFDLEtBQWEsRUFBRUMsTUFBYyxLQUF1QjtFQUM1RlosTUFBTSxJQUFJQSxNQUFNLENBQUUyQixRQUFRLENBQUVoQixLQUFNLENBQUMsSUFBSUEsS0FBSyxJQUFJLENBQUMsSUFBTUEsS0FBSyxHQUFHLENBQUMsS0FBTyxDQUFDLEVBQ3RFLCtDQUFnRCxDQUFDO0VBQ25EWCxNQUFNLElBQUlBLE1BQU0sQ0FBRTJCLFFBQVEsQ0FBRWYsTUFBTyxDQUFDLElBQUlBLE1BQU0sSUFBSSxDQUFDLElBQU1BLE1BQU0sR0FBRyxDQUFDLEtBQU8sQ0FBQyxFQUN6RSxnREFBaUQsQ0FBQztFQUVwRCxNQUFNMEYsT0FBTyxHQUFHdEksUUFBUSxDQUFDdUksZUFBZSxDQUFFM0osS0FBSyxFQUFFLE9BQVEsQ0FBQztFQUMxRDBKLE9BQU8sQ0FBQ0UsWUFBWSxDQUFFLEdBQUcsRUFBRSxHQUFJLENBQUM7RUFDaENGLE9BQU8sQ0FBQ0UsWUFBWSxDQUFFLEdBQUcsRUFBRSxHQUFJLENBQUM7RUFDaENGLE9BQU8sQ0FBQ0UsWUFBWSxDQUFFLE9BQU8sRUFBRyxHQUFFN0YsS0FBTSxJQUFJLENBQUM7RUFDN0MyRixPQUFPLENBQUNFLFlBQVksQ0FBRSxRQUFRLEVBQUcsR0FBRTVGLE1BQU8sSUFBSSxDQUFDO0VBQy9DMEYsT0FBTyxDQUFDRyxjQUFjLENBQUU1SixPQUFPLEVBQUUsWUFBWSxFQUFFd0csR0FBSSxDQUFDO0VBRXBELE9BQU9pRCxPQUFPO0FBQ2hCLENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0FqSSxTQUFTLENBQUNxSSwwQkFBMEIsR0FBS25ELFVBQTZCLElBQWM7RUFDbEYsTUFBTW9ELE9BQWUsR0FBRyxFQUFFO0VBRTFCLE1BQU1DLE9BQU8sR0FBR3JELFVBQVUsQ0FBQ0osU0FBUyxDQUFDLENBQUM7RUFDdEMsTUFBTTBELFNBQVMsR0FBRyxJQUFJN0MsTUFBTSxDQUFDOEMsS0FBSyxDQUFDLENBQUM7RUFDcENELFNBQVMsQ0FBQ3hHLEdBQUcsR0FBR3VHLE9BQU87O0VBRXZCO0VBQ0FELE9BQU8sQ0FBQ3pELElBQUksQ0FBRTtJQUNaekMsR0FBRyxFQUFFb0csU0FBUztJQUNkeEQsR0FBRyxFQUFFdUQsT0FBTztJQUNaakcsS0FBSyxFQUFFNEMsVUFBVSxDQUFDNUMsS0FBSztJQUN2QkMsTUFBTSxFQUFFMkMsVUFBVSxDQUFDM0MsTUFBTTtJQUN6QmlDLE1BQU0sRUFBRVU7RUFDVixDQUFFLENBQUM7RUFFSCxJQUFJd0QsV0FBVyxHQUFHeEQsVUFBVTtFQUM1QixPQUFRd0QsV0FBVyxDQUFDcEcsS0FBSyxJQUFJLENBQUMsSUFBSW9HLFdBQVcsQ0FBQ25HLE1BQU0sSUFBSSxDQUFDLEVBQUc7SUFFMUQ7SUFDQSxNQUFNaUMsTUFBTSxHQUFHN0UsUUFBUSxDQUFDQyxhQUFhLENBQUUsUUFBUyxDQUFDO0lBQ2pENEUsTUFBTSxDQUFDbEMsS0FBSyxHQUFHM0QsSUFBSSxDQUFDOEYsSUFBSSxDQUFFaUUsV0FBVyxDQUFDcEcsS0FBSyxHQUFHLENBQUUsQ0FBQztJQUNqRGtDLE1BQU0sQ0FBQ2pDLE1BQU0sR0FBRzVELElBQUksQ0FBQzhGLElBQUksQ0FBRWlFLFdBQVcsQ0FBQ25HLE1BQU0sR0FBRyxDQUFFLENBQUM7SUFDbkQsTUFBTW1DLE9BQU8sR0FBR0YsTUFBTSxDQUFDMUUsVUFBVSxDQUFFLElBQUssQ0FBRTtJQUMxQzRFLE9BQU8sQ0FBQ2lFLFlBQVksQ0FBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUUsQ0FBQztJQUM1Q2pFLE9BQU8sQ0FBQ0UsU0FBUyxDQUFFOEQsV0FBVyxFQUFFLENBQUMsRUFBRSxDQUFFLENBQUM7O0lBRXRDO0lBQ0EsTUFBTUUsV0FBVyxHQUFHO01BQ2xCdEcsS0FBSyxFQUFFa0MsTUFBTSxDQUFDbEMsS0FBSztNQUNuQkMsTUFBTSxFQUFFaUMsTUFBTSxDQUFDakMsTUFBTTtNQUNyQmlDLE1BQU0sRUFBRUEsTUFBTTtNQUNkUSxHQUFHLEVBQUVSLE1BQU0sQ0FBQ00sU0FBUyxDQUFDLENBQUM7TUFDdkIxQyxHQUFHLEVBQUUsSUFBSXVELE1BQU0sQ0FBQzhDLEtBQUssQ0FBQztJQUN4QixDQUFDO0lBQ0Q7SUFDQUcsV0FBVyxDQUFDeEcsR0FBRyxDQUFDSixHQUFHLEdBQUc0RyxXQUFXLENBQUM1RCxHQUFHO0lBRXJDMEQsV0FBVyxHQUFHbEUsTUFBTTtJQUNwQjhELE9BQU8sQ0FBQ3pELElBQUksQ0FBRStELFdBQVksQ0FBQztFQUM3QjtFQUVBLE9BQU9OLE9BQU87QUFDaEIsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQXRJLFNBQVMsQ0FBQzBGLHlCQUF5QixHQUFLRixNQUFlLElBQWM7RUFDbkUsT0FBTyxDQUFFN0csSUFBSSxDQUFDa0ssSUFBSSxDQUFFckQsTUFBTSxDQUFDc0QsR0FBRyxDQUFDLENBQUMsR0FBR3RELE1BQU0sQ0FBQ3NELEdBQUcsQ0FBQyxDQUFDLEdBQUd0RCxNQUFNLENBQUN1RCxHQUFHLENBQUMsQ0FBQyxHQUFHdkQsTUFBTSxDQUFDdUQsR0FBRyxDQUFDLENBQUUsQ0FBQyxHQUN0RXBLLElBQUksQ0FBQ2tLLElBQUksQ0FBRXJELE1BQU0sQ0FBQ3dELEdBQUcsQ0FBQyxDQUFDLEdBQUd4RCxNQUFNLENBQUN3RCxHQUFHLENBQUMsQ0FBQyxHQUFHeEQsTUFBTSxDQUFDeUQsR0FBRyxDQUFDLENBQUMsR0FBR3pELE1BQU0sQ0FBQ3lELEdBQUcsQ0FBQyxDQUFFLENBQUMsSUFBSyxDQUFDO0FBQ3ZGLENBQUM7O0FBRUQ7QUFDQWpKLFNBQVMsQ0FBQ2tKLDZCQUE2QixHQUFHLEdBQUc7O0FBRTdDO0FBQ0FsSixTQUFTLENBQUNqQixlQUFlLEdBQUdBLGVBQWU7QUFFM0NULE9BQU8sQ0FBQzZLLFFBQVEsQ0FBRSxXQUFXLEVBQUVuSixTQUFVLENBQUM7QUFDMUMsZUFBZUEsU0FBUyIsImlnbm9yZUxpc3QiOltdfQ==