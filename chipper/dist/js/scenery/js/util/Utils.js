// Copyright 2013-2024, University of Colorado Boulder

/**
 * General utility functions for Scenery
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Bounds2 from '../../../dot/js/Bounds2.js';
import Matrix3 from '../../../dot/js/Matrix3.js';
import Transform3 from '../../../dot/js/Transform3.js';
import Vector2 from '../../../dot/js/Vector2.js';
import platform from '../../../phet-core/js/platform.js';
import { Features, scenery } from '../imports.js';

// convenience function
function p(x, y) {
  return new Vector2(x, y);
}

// TODO: remove flag and tests after we're done https://github.com/phetsims/scenery/issues/1581
const debugChromeBoundsScanning = false;

// detect properly prefixed transform and transformOrigin properties
const transformProperty = Features.transform;
const transformOriginProperty = Features.transformOrigin || 'transformOrigin'; // fallback, so we don't try to set an empty string property later

// Scenery applications that do not use WebGL may trigger a ~ 0.5 second pause shortly after launch on some platforms.
// Webgl is enabled by default but may be shut off for applications that know they will not want to use it
// see https://github.com/phetsims/scenery/issues/621
let webglEnabled = true;
let _extensionlessWebGLSupport; // lazily computed

const Utils = {
  /*---------------------------------------------------------------------------*
   * Transformation Utilities (TODO: separate file) https://github.com/phetsims/scenery/issues/1581
   *---------------------------------------------------------------------------*/

  /**
   * Prepares a DOM element for use with applyPreparedTransform(). Applies some CSS styles that are required, but
   * that we don't want to set while animating.
   */
  prepareForTransform(element) {
    // @ts-expect-error
    element.style[transformOriginProperty] = 'top left';
  },
  /**
   * Applies the CSS transform of the matrix to the element, with optional forcing of acceleration.
   * NOTE: prepareForTransform should be called at least once on the element before this method is used.
   */
  applyPreparedTransform(matrix, element) {
    // NOTE: not applying translateZ, see http://stackoverflow.com/questions/10014461/why-does-enabling-hardware-acceleration-in-css3-slow-down-performance
    // @ts-expect-error
    element.style[transformProperty] = matrix.getCSSTransform();
  },
  /**
   * Applies a CSS transform value string to a DOM element.
   * NOTE: prepareForTransform should be called at least once on the element before this method is used.
   */
  setTransform(transformString, element) {
    // @ts-expect-error
    element.style[transformProperty] = transformString;
  },
  /**
   * Removes a CSS transform from a DOM element.
   */
  unsetTransform(element) {
    // @ts-expect-error
    element.style[transformProperty] = '';
  },
  /**
   * Ensures that window.requestAnimationFrame and window.cancelAnimationFrame use a native implementation if possible,
   * otherwise using a simple setTimeout internally. See https://github.com/phetsims/scenery/issues/426
   */
  polyfillRequestAnimationFrame() {
    if (!window.requestAnimationFrame || !window.cancelAnimationFrame) {
      // Fallback implementation if no prefixed version is available
      if (!Features.requestAnimationFrame || !Features.cancelAnimationFrame) {
        window.requestAnimationFrame = callback => {
          const timeAtStart = Date.now();

          // NOTE: We don't want to rely on a common timer, so we're using the built-in form on purpose.
          return window.setTimeout(() => {
            // eslint-disable-line bad-sim-text
            callback(Date.now() - timeAtStart);
          }, 16);
        };
        window.cancelAnimationFrame = clearTimeout;
      }
      // Fill in the non-prefixed names with the prefixed versions
      else {
        // @ts-expect-error
        window.requestAnimationFrame = window[Features.requestAnimationFrame];
        // @ts-expect-error
        window.cancelAnimationFrame = window[Features.cancelAnimationFrame];
      }
    }
  },
  /**
   * Returns the relative size of the context's backing store compared to the actual Canvas. For example, if it's 2,
   * the backing store has 2x2 the amount of pixels (4 times total).
   *
   * @returns The backing store pixel ratio.
   */
  backingStorePixelRatio(context) {
    // @ts-expect-error
    return context.webkitBackingStorePixelRatio ||
    // @ts-expect-error
    context.mozBackingStorePixelRatio ||
    // @ts-expect-error
    context.msBackingStorePixelRatio ||
    // @ts-expect-error
    context.oBackingStorePixelRatio ||
    // @ts-expect-error
    context.backingStorePixelRatio || 1;
  },
  /**
   * Returns the scaling factor that needs to be applied for handling a HiDPI Canvas
   * See see http://developer.apple.com/library/safari/#documentation/AudioVideo/Conceptual/HTML-canvas-guide/SettingUptheCanvas/SettingUptheCanvas.html#//apple_ref/doc/uid/TP40010542-CH2-SW5
   * And it's updated based on http://www.html5rocks.com/en/tutorials/canvas/hidpi/
   */
  backingScale(context) {
    if ('devicePixelRatio' in window) {
      const backingStoreRatio = Utils.backingStorePixelRatio(context);
      return window.devicePixelRatio / backingStoreRatio;
    }
    return 1;
  },
  /**
   * Whether the native Canvas HTML5 API supports the 'filter' attribute (similar to the CSS/SVG filter attribute).
   */
  supportsNativeCanvasFilter() {
    return !!Features.canvasFilter;
  },
  /**
   * Whether we can handle arbitrary filters in Canvas by manipulating the ImageData returned. If we have a backing
   * store pixel ratio that is non-1, we'll be blurring out things during that operation, which would be unacceptable.
   */
  supportsImageDataCanvasFilter() {
    // @ts-expect-error TODO: scenery and typing https://github.com/phetsims/scenery/issues/1581
    return Utils.backingStorePixelRatio(scenery.scratchContext) === 1;
  },
  /*---------------------------------------------------------------------------*
   * Text bounds utilities (TODO: separate file) https://github.com/phetsims/scenery/issues/1581
   *---------------------------------------------------------------------------*/

  /**
   * Given a data snapshot and transform, calculate range on how large / small the bounds can be. It's
   * very conservative, with an effective 1px extra range to allow for differences in anti-aliasing
   * for performance concerns, this does not support skews / rotations / anything but translation and scaling
   */
  scanBounds(imageData, resolution, transform) {
    // entry will be true if any pixel with the given x or y value is non-rgba(0,0,0,0)
    const dirtyX = _.map(_.range(resolution), () => false);
    const dirtyY = _.map(_.range(resolution), () => false);
    for (let x = 0; x < resolution; x++) {
      for (let y = 0; y < resolution; y++) {
        const offset = 4 * (y * resolution + x);
        if (imageData.data[offset] !== 0 || imageData.data[offset + 1] !== 0 || imageData.data[offset + 2] !== 0 || imageData.data[offset + 3] !== 0) {
          dirtyX[x] = true;
          dirtyY[y] = true;
        }
      }
    }
    const minX = _.indexOf(dirtyX, true);
    const maxX = _.lastIndexOf(dirtyX, true);
    const minY = _.indexOf(dirtyY, true);
    const maxY = _.lastIndexOf(dirtyY, true);

    // based on pixel boundaries. for minBounds, the inner edge of the dirty pixel. for maxBounds, the outer edge of the adjacent non-dirty pixel
    // results in a spread of 2 for the identity transform (or any translated form)
    const extraSpread = resolution / 16; // is Chrome antialiasing really like this? dear god... TODO!!! https://github.com/phetsims/scenery/issues/1581
    return {
      minBounds: new Bounds2(minX < 1 || minX >= resolution - 1 ? Number.POSITIVE_INFINITY : transform.inversePosition2(p(minX + 1 + extraSpread, 0)).x, minY < 1 || minY >= resolution - 1 ? Number.POSITIVE_INFINITY : transform.inversePosition2(p(0, minY + 1 + extraSpread)).y, maxX < 1 || maxX >= resolution - 1 ? Number.NEGATIVE_INFINITY : transform.inversePosition2(p(maxX - extraSpread, 0)).x, maxY < 1 || maxY >= resolution - 1 ? Number.NEGATIVE_INFINITY : transform.inversePosition2(p(0, maxY - extraSpread)).y),
      maxBounds: new Bounds2(minX < 1 || minX >= resolution - 1 ? Number.NEGATIVE_INFINITY : transform.inversePosition2(p(minX - 1 - extraSpread, 0)).x, minY < 1 || minY >= resolution - 1 ? Number.NEGATIVE_INFINITY : transform.inversePosition2(p(0, minY - 1 - extraSpread)).y, maxX < 1 || maxX >= resolution - 1 ? Number.POSITIVE_INFINITY : transform.inversePosition2(p(maxX + 2 + extraSpread, 0)).x, maxY < 1 || maxY >= resolution - 1 ? Number.POSITIVE_INFINITY : transform.inversePosition2(p(0, maxY + 2 + extraSpread)).y)
    };
  },
  /**
   * Measures accurate bounds of a function that draws things to a Canvas.
   */
  canvasAccurateBounds(renderToContext, options) {
    // how close to the actual bounds do we need to be?
    const precision = options && options.precision ? options.precision : 0.001;

    // 512x512 default square resolution
    const resolution = options && options.resolution ? options.resolution : 128;

    // at 1/16x default, we want to be able to get the bounds accurately for something as large as 16x our initial resolution
    // divisible by 2 so hopefully we avoid more quirks from Canvas rendering engines
    const initialScale = options && options.initialScale ? options.initialScale : 1 / 16;
    let minBounds = Bounds2.NOTHING;
    let maxBounds = Bounds2.EVERYTHING;
    const canvas = document.createElement('canvas');
    canvas.width = resolution;
    canvas.height = resolution;
    const context = canvas.getContext('2d');
    if (debugChromeBoundsScanning) {
      $(window).ready(() => {
        const header = document.createElement('h2');
        $(header).text('Bounds Scan');
        $('#display').append(header);
      });
    }

    // TODO: Don't use Transform3 unless it is necessary https://github.com/phetsims/scenery/issues/1581
    function scan(transform) {
      // save/restore, in case the render tries to do any funny stuff like clipping, etc.
      context.save();
      transform.matrix.canvasSetTransform(context);
      renderToContext(context);
      context.restore();
      const data = context.getImageData(0, 0, resolution, resolution);
      const minMaxBounds = Utils.scanBounds(data, resolution, transform);
      function snapshotToCanvas(snapshot) {
        const canvas = document.createElement('canvas');
        canvas.width = resolution;
        canvas.height = resolution;
        const context = canvas.getContext('2d');
        context.putImageData(snapshot, 0, 0);
        $(canvas).css('border', '1px solid black');
        $(window).ready(() => {
          //$( '#display' ).append( $( document.createElement( 'div' ) ).text( 'Bounds: ' +  ) );
          $('#display').append(canvas);
        });
      }

      // TODO: remove after debug https://github.com/phetsims/scenery/issues/1581
      if (debugChromeBoundsScanning) {
        snapshotToCanvas(data);
      }
      context.clearRect(0, 0, resolution, resolution);
      return minMaxBounds;
    }

    // attempts to map the bounds specified to the entire testing canvas (minus a fine border), so we can nail down the location quickly
    function idealTransform(bounds) {
      // so that the bounds-edge doesn't land squarely on the boundary
      const borderSize = 2;
      const scaleX = (resolution - borderSize * 2) / (bounds.maxX - bounds.minX);
      const scaleY = (resolution - borderSize * 2) / (bounds.maxY - bounds.minY);
      const translationX = -scaleX * bounds.minX + borderSize;
      const translationY = -scaleY * bounds.minY + borderSize;
      return new Transform3(Matrix3.translation(translationX, translationY).timesMatrix(Matrix3.scaling(scaleX, scaleY)));
    }
    const initialTransform = new Transform3();
    // make sure to initially center our object, so we don't miss the bounds
    initialTransform.append(Matrix3.translation(resolution / 2, resolution / 2));
    initialTransform.append(Matrix3.scaling(initialScale));
    const coarseBounds = scan(initialTransform);
    minBounds = minBounds.union(coarseBounds.minBounds);
    maxBounds = maxBounds.intersection(coarseBounds.maxBounds);
    let tempMin;
    let tempMax;
    let refinedBounds;

    // minX
    tempMin = maxBounds.minY;
    tempMax = maxBounds.maxY;
    while (isFinite(minBounds.minX) && isFinite(maxBounds.minX) && Math.abs(minBounds.minX - maxBounds.minX) > precision) {
      // use maximum bounds except for the x direction, so we don't miss things that we are looking for
      refinedBounds = scan(idealTransform(new Bounds2(maxBounds.minX, tempMin, minBounds.minX, tempMax)));
      if (minBounds.minX <= refinedBounds.minBounds.minX && maxBounds.minX >= refinedBounds.maxBounds.minX) {
        // sanity check - break out of an infinite loop!
        if (debugChromeBoundsScanning) {
          console.log('warning, exiting infinite loop!');
          console.log(`transformed "min" minX: ${idealTransform(new Bounds2(maxBounds.minX, maxBounds.minY, minBounds.minX, maxBounds.maxY)).transformPosition2(p(minBounds.minX, 0))}`);
          console.log(`transformed "max" minX: ${idealTransform(new Bounds2(maxBounds.minX, maxBounds.minY, minBounds.minX, maxBounds.maxY)).transformPosition2(p(maxBounds.minX, 0))}`);
        }
        break;
      }
      minBounds = minBounds.withMinX(Math.min(minBounds.minX, refinedBounds.minBounds.minX));
      maxBounds = maxBounds.withMinX(Math.max(maxBounds.minX, refinedBounds.maxBounds.minX));
      tempMin = Math.max(tempMin, refinedBounds.maxBounds.minY);
      tempMax = Math.min(tempMax, refinedBounds.maxBounds.maxY);
    }

    // maxX
    tempMin = maxBounds.minY;
    tempMax = maxBounds.maxY;
    while (isFinite(minBounds.maxX) && isFinite(maxBounds.maxX) && Math.abs(minBounds.maxX - maxBounds.maxX) > precision) {
      // use maximum bounds except for the x direction, so we don't miss things that we are looking for
      refinedBounds = scan(idealTransform(new Bounds2(minBounds.maxX, tempMin, maxBounds.maxX, tempMax)));
      if (minBounds.maxX >= refinedBounds.minBounds.maxX && maxBounds.maxX <= refinedBounds.maxBounds.maxX) {
        // sanity check - break out of an infinite loop!
        if (debugChromeBoundsScanning) {
          console.log('warning, exiting infinite loop!');
        }
        break;
      }
      minBounds = minBounds.withMaxX(Math.max(minBounds.maxX, refinedBounds.minBounds.maxX));
      maxBounds = maxBounds.withMaxX(Math.min(maxBounds.maxX, refinedBounds.maxBounds.maxX));
      tempMin = Math.max(tempMin, refinedBounds.maxBounds.minY);
      tempMax = Math.min(tempMax, refinedBounds.maxBounds.maxY);
    }

    // minY
    tempMin = maxBounds.minX;
    tempMax = maxBounds.maxX;
    while (isFinite(minBounds.minY) && isFinite(maxBounds.minY) && Math.abs(minBounds.minY - maxBounds.minY) > precision) {
      // use maximum bounds except for the y direction, so we don't miss things that we are looking for
      refinedBounds = scan(idealTransform(new Bounds2(tempMin, maxBounds.minY, tempMax, minBounds.minY)));
      if (minBounds.minY <= refinedBounds.minBounds.minY && maxBounds.minY >= refinedBounds.maxBounds.minY) {
        // sanity check - break out of an infinite loop!
        if (debugChromeBoundsScanning) {
          console.log('warning, exiting infinite loop!');
        }
        break;
      }
      minBounds = minBounds.withMinY(Math.min(minBounds.minY, refinedBounds.minBounds.minY));
      maxBounds = maxBounds.withMinY(Math.max(maxBounds.minY, refinedBounds.maxBounds.minY));
      tempMin = Math.max(tempMin, refinedBounds.maxBounds.minX);
      tempMax = Math.min(tempMax, refinedBounds.maxBounds.maxX);
    }

    // maxY
    tempMin = maxBounds.minX;
    tempMax = maxBounds.maxX;
    while (isFinite(minBounds.maxY) && isFinite(maxBounds.maxY) && Math.abs(minBounds.maxY - maxBounds.maxY) > precision) {
      // use maximum bounds except for the y direction, so we don't miss things that we are looking for
      refinedBounds = scan(idealTransform(new Bounds2(tempMin, minBounds.maxY, tempMax, maxBounds.maxY)));
      if (minBounds.maxY >= refinedBounds.minBounds.maxY && maxBounds.maxY <= refinedBounds.maxBounds.maxY) {
        // sanity check - break out of an infinite loop!
        if (debugChromeBoundsScanning) {
          console.log('warning, exiting infinite loop!');
        }
        break;
      }
      minBounds = minBounds.withMaxY(Math.max(minBounds.maxY, refinedBounds.minBounds.maxY));
      maxBounds = maxBounds.withMaxY(Math.min(maxBounds.maxY, refinedBounds.maxBounds.maxY));
      tempMin = Math.max(tempMin, refinedBounds.maxBounds.minX);
      tempMax = Math.min(tempMax, refinedBounds.maxBounds.maxX);
    }
    if (debugChromeBoundsScanning) {
      console.log(`minBounds: ${minBounds}`);
      console.log(`maxBounds: ${maxBounds}`);
    }

    // @ts-expect-error
    const result = new Bounds2(
    // Do finite checks so we don't return NaN
    isFinite(minBounds.minX) && isFinite(maxBounds.minX) ? (minBounds.minX + maxBounds.minX) / 2 : Number.POSITIVE_INFINITY, isFinite(minBounds.minY) && isFinite(maxBounds.minY) ? (minBounds.minY + maxBounds.minY) / 2 : Number.POSITIVE_INFINITY, isFinite(minBounds.maxX) && isFinite(maxBounds.maxX) ? (minBounds.maxX + maxBounds.maxX) / 2 : Number.NEGATIVE_INFINITY, isFinite(minBounds.maxY) && isFinite(maxBounds.maxY) ? (minBounds.maxY + maxBounds.maxY) / 2 : Number.NEGATIVE_INFINITY);

    // extra data about our bounds
    result.minBounds = minBounds;
    result.maxBounds = maxBounds;
    result.isConsistent = maxBounds.containsBounds(minBounds);
    result.precision = Math.max(Math.abs(minBounds.minX - maxBounds.minX), Math.abs(minBounds.minY - maxBounds.minY), Math.abs(minBounds.maxX - maxBounds.maxX), Math.abs(minBounds.maxY - maxBounds.maxY));

    // return the average
    return result;
  },
  /*---------------------------------------------------------------------------*
   * WebGL utilities (TODO: separate file) https://github.com/phetsims/scenery/issues/1581
   *---------------------------------------------------------------------------*/

  /**
   * Finds the smallest power of 2 that is at least as large as n.
   *
   * @returns The smallest power of 2 that is greater than or equal n
   */
  toPowerOf2(n) {
    let result = 1;
    while (result < n) {
      result *= 2;
    }
    return result;
  },
  /**
   * Creates and compiles a GLSL Shader object in WebGL.
   */
  createShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log('GLSL compile error:');
      console.log(gl.getShaderInfoLog(shader));
      console.log(source);

      // Normally it would be best to throw an exception here, but a context loss could cause the shader parameter check
      // to fail, and we must handle context loss gracefully between any adjacent pair of gl calls.
      // Therefore, we simply report the errors to the console.  See #279
    }
    return shader;
  },
  applyWebGLContextDefaults(gl) {
    // What color gets set when we call gl.clear()
    gl.clearColor(0, 0, 0, 0);

    // Blending similar to http://localhost/phet/git/webgl-blendfunctions/blendfuncseparate.html
    gl.enable(gl.BLEND);

    // NOTE: We switched back to a fully premultiplied setup, so we have the corresponding blend function.
    // For normal colors (and custom WebGLNode handling), it is necessary to use premultiplied values (multiplying the
    // RGB values by the alpha value for gl_FragColor). For textured triangles, it is assumed that the texture is
    // already premultiplied, so the built-in shader does not do the extra premultiplication.
    // See https://github.com/phetsims/energy-skate-park/issues/39, https://github.com/phetsims/scenery/issues/397
    // and https://stackoverflow.com/questions/39341564/webgl-how-to-correctly-blend-alpha-channel-png
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  },
  /**
   * Set whether webgl should be enabled, see docs for webglEnabled
   */
  setWebGLEnabled(_webglEnabled) {
    webglEnabled = _webglEnabled;
  },
  /**
   * Check to see whether webgl is supported, using the same strategy as mrdoob and pixi.js
   *
   * @param [extensions] - A list of WebGL extensions that need to be supported
   */
  checkWebGLSupport(extensions) {
    // The webgl check can be shut off, please see docs at webglEnabled declaration site
    if (!webglEnabled) {
      return false;
    }
    const canvas = document.createElement('canvas');
    const args = {
      failIfMajorPerformanceCaveat: true
    };
    try {
      // @ts-expect-error
      const gl = !!window.WebGLRenderingContext && (canvas.getContext('webgl', args) || canvas.getContext('experimental-webgl', args));
      if (!gl) {
        return false;
      }
      if (extensions) {
        for (let i = 0; i < extensions.length; i++) {
          if (gl.getExtension(extensions[i]) === null) {
            return false;
          }
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  },
  /**
   * Check to see whether IE11 has proper clearStencil support (required for three.js to work well).
   */
  checkIE11StencilSupport() {
    const canvas = document.createElement('canvas');
    try {
      // @ts-expect-error
      const gl = !!window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      if (!gl) {
        return false;
      }

      // Failure for https://github.com/mrdoob/three.js/issues/3600 / https://github.com/phetsims/molecule-shapes/issues/133
      gl.clearStencil(0);
      return gl.getError() === 0;
    } catch (e) {
      return false;
    }
  },
  /**
   * Whether WebGL (with decent performance) is supported by the platform
   */
  get isWebGLSupported() {
    if (_extensionlessWebGLSupport === undefined) {
      _extensionlessWebGLSupport = Utils.checkWebGLSupport();
    }
    return _extensionlessWebGLSupport;
  },
  /**
   * Triggers a loss of a WebGL context, with a delayed restoration.
   *
   * NOTE: Only use this for debugging. Should not be called normally.
   */
  loseContext(gl) {
    const extension = gl.getExtension('WEBGL_lose_context');
    if (extension) {
      extension.loseContext();

      // NOTE: We don't want to rely on a common timer, so we're using the built-in form on purpose.
      setTimeout(() => {
        // eslint-disable-line bad-sim-text
        extension.restoreContext();
      }, 1000);
    }
  },
  /**
   * Creates a string useful for working around https://github.com/phetsims/collision-lab/issues/177.
   */
  safariEmbeddingMarkWorkaround(str) {
    if (platform.safari) {
      // NOTE: I don't believe it's likely/possible a valid UTF-8 string will contain these code points adjacently,
      // due to the property that you can start reading UTF-8 from any byte. So we're safe to split it and break it
      // into UTF-16 code units, since we're not mucking with surrogate pairs.
      const utf16CodeUnits = str.split('');
      let result = '';

      // NOTE: We're only inserting zero-width spaces between embedding marks, since prior to this our insertion between
      // certain code points was causing issues with Safari (https://github.com/phetsims/website-meteor/issues/656)
      let lastIsEmbeddingMark = false;
      for (let i = 0; i < utf16CodeUnits.length; i++) {
        const next = utf16CodeUnits[i];
        const nextIsEmbeddingMark = next === '\u202a' || next === '\u202b' || next === '\u202c';

        // Add in zero-width spaces for Safari, so it doesn't have adjacent embedding marks ever (which seems to prevent
        // things).
        if (lastIsEmbeddingMark && nextIsEmbeddingMark) {
          result += '\u200B';
        }
        result += next;
        lastIsEmbeddingMark = nextIsEmbeddingMark;
      }
      return result;
    } else {
      return str;
    }
  }
};
scenery.register('Utils', Utils);
export default Utils;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb3VuZHMyIiwiTWF0cml4MyIsIlRyYW5zZm9ybTMiLCJWZWN0b3IyIiwicGxhdGZvcm0iLCJGZWF0dXJlcyIsInNjZW5lcnkiLCJwIiwieCIsInkiLCJkZWJ1Z0Nocm9tZUJvdW5kc1NjYW5uaW5nIiwidHJhbnNmb3JtUHJvcGVydHkiLCJ0cmFuc2Zvcm0iLCJ0cmFuc2Zvcm1PcmlnaW5Qcm9wZXJ0eSIsInRyYW5zZm9ybU9yaWdpbiIsIndlYmdsRW5hYmxlZCIsIl9leHRlbnNpb25sZXNzV2ViR0xTdXBwb3J0IiwiVXRpbHMiLCJwcmVwYXJlRm9yVHJhbnNmb3JtIiwiZWxlbWVudCIsInN0eWxlIiwiYXBwbHlQcmVwYXJlZFRyYW5zZm9ybSIsIm1hdHJpeCIsImdldENTU1RyYW5zZm9ybSIsInNldFRyYW5zZm9ybSIsInRyYW5zZm9ybVN0cmluZyIsInVuc2V0VHJhbnNmb3JtIiwicG9seWZpbGxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJ3aW5kb3ciLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJjYW5jZWxBbmltYXRpb25GcmFtZSIsImNhbGxiYWNrIiwidGltZUF0U3RhcnQiLCJEYXRlIiwibm93Iiwic2V0VGltZW91dCIsImNsZWFyVGltZW91dCIsImJhY2tpbmdTdG9yZVBpeGVsUmF0aW8iLCJjb250ZXh0Iiwid2Via2l0QmFja2luZ1N0b3JlUGl4ZWxSYXRpbyIsIm1vekJhY2tpbmdTdG9yZVBpeGVsUmF0aW8iLCJtc0JhY2tpbmdTdG9yZVBpeGVsUmF0aW8iLCJvQmFja2luZ1N0b3JlUGl4ZWxSYXRpbyIsImJhY2tpbmdTY2FsZSIsImJhY2tpbmdTdG9yZVJhdGlvIiwiZGV2aWNlUGl4ZWxSYXRpbyIsInN1cHBvcnRzTmF0aXZlQ2FudmFzRmlsdGVyIiwiY2FudmFzRmlsdGVyIiwic3VwcG9ydHNJbWFnZURhdGFDYW52YXNGaWx0ZXIiLCJzY3JhdGNoQ29udGV4dCIsInNjYW5Cb3VuZHMiLCJpbWFnZURhdGEiLCJyZXNvbHV0aW9uIiwiZGlydHlYIiwiXyIsIm1hcCIsInJhbmdlIiwiZGlydHlZIiwib2Zmc2V0IiwiZGF0YSIsIm1pblgiLCJpbmRleE9mIiwibWF4WCIsImxhc3RJbmRleE9mIiwibWluWSIsIm1heFkiLCJleHRyYVNwcmVhZCIsIm1pbkJvdW5kcyIsIk51bWJlciIsIlBPU0lUSVZFX0lORklOSVRZIiwiaW52ZXJzZVBvc2l0aW9uMiIsIk5FR0FUSVZFX0lORklOSVRZIiwibWF4Qm91bmRzIiwiY2FudmFzQWNjdXJhdGVCb3VuZHMiLCJyZW5kZXJUb0NvbnRleHQiLCJvcHRpb25zIiwicHJlY2lzaW9uIiwiaW5pdGlhbFNjYWxlIiwiTk9USElORyIsIkVWRVJZVEhJTkciLCJjYW52YXMiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJ3aWR0aCIsImhlaWdodCIsImdldENvbnRleHQiLCIkIiwicmVhZHkiLCJoZWFkZXIiLCJ0ZXh0IiwiYXBwZW5kIiwic2NhbiIsInNhdmUiLCJjYW52YXNTZXRUcmFuc2Zvcm0iLCJyZXN0b3JlIiwiZ2V0SW1hZ2VEYXRhIiwibWluTWF4Qm91bmRzIiwic25hcHNob3RUb0NhbnZhcyIsInNuYXBzaG90IiwicHV0SW1hZ2VEYXRhIiwiY3NzIiwiY2xlYXJSZWN0IiwiaWRlYWxUcmFuc2Zvcm0iLCJib3VuZHMiLCJib3JkZXJTaXplIiwic2NhbGVYIiwic2NhbGVZIiwidHJhbnNsYXRpb25YIiwidHJhbnNsYXRpb25ZIiwidHJhbnNsYXRpb24iLCJ0aW1lc01hdHJpeCIsInNjYWxpbmciLCJpbml0aWFsVHJhbnNmb3JtIiwiY29hcnNlQm91bmRzIiwidW5pb24iLCJpbnRlcnNlY3Rpb24iLCJ0ZW1wTWluIiwidGVtcE1heCIsInJlZmluZWRCb3VuZHMiLCJpc0Zpbml0ZSIsIk1hdGgiLCJhYnMiLCJjb25zb2xlIiwibG9nIiwidHJhbnNmb3JtUG9zaXRpb24yIiwid2l0aE1pblgiLCJtaW4iLCJtYXgiLCJ3aXRoTWF4WCIsIndpdGhNaW5ZIiwid2l0aE1heFkiLCJyZXN1bHQiLCJpc0NvbnNpc3RlbnQiLCJjb250YWluc0JvdW5kcyIsInRvUG93ZXJPZjIiLCJuIiwiY3JlYXRlU2hhZGVyIiwiZ2wiLCJzb3VyY2UiLCJ0eXBlIiwic2hhZGVyIiwic2hhZGVyU291cmNlIiwiY29tcGlsZVNoYWRlciIsImdldFNoYWRlclBhcmFtZXRlciIsIkNPTVBJTEVfU1RBVFVTIiwiZ2V0U2hhZGVySW5mb0xvZyIsImFwcGx5V2ViR0xDb250ZXh0RGVmYXVsdHMiLCJjbGVhckNvbG9yIiwiZW5hYmxlIiwiQkxFTkQiLCJibGVuZEZ1bmMiLCJPTkUiLCJPTkVfTUlOVVNfU1JDX0FMUEhBIiwic2V0V2ViR0xFbmFibGVkIiwiX3dlYmdsRW5hYmxlZCIsImNoZWNrV2ViR0xTdXBwb3J0IiwiZXh0ZW5zaW9ucyIsImFyZ3MiLCJmYWlsSWZNYWpvclBlcmZvcm1hbmNlQ2F2ZWF0IiwiV2ViR0xSZW5kZXJpbmdDb250ZXh0IiwiaSIsImxlbmd0aCIsImdldEV4dGVuc2lvbiIsImUiLCJjaGVja0lFMTFTdGVuY2lsU3VwcG9ydCIsImNsZWFyU3RlbmNpbCIsImdldEVycm9yIiwiaXNXZWJHTFN1cHBvcnRlZCIsInVuZGVmaW5lZCIsImxvc2VDb250ZXh0IiwiZXh0ZW5zaW9uIiwicmVzdG9yZUNvbnRleHQiLCJzYWZhcmlFbWJlZGRpbmdNYXJrV29ya2Fyb3VuZCIsInN0ciIsInNhZmFyaSIsInV0ZjE2Q29kZVVuaXRzIiwic3BsaXQiLCJsYXN0SXNFbWJlZGRpbmdNYXJrIiwibmV4dCIsIm5leHRJc0VtYmVkZGluZ01hcmsiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlV0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEdlbmVyYWwgdXRpbGl0eSBmdW5jdGlvbnMgZm9yIFNjZW5lcnlcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBCb3VuZHMyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9Cb3VuZHMyLmpzJztcclxuaW1wb3J0IE1hdHJpeDMgZnJvbSAnLi4vLi4vLi4vZG90L2pzL01hdHJpeDMuanMnO1xyXG5pbXBvcnQgVHJhbnNmb3JtMyBmcm9tICcuLi8uLi8uLi9kb3QvanMvVHJhbnNmb3JtMy5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IHBsYXRmb3JtIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9wbGF0Zm9ybS5qcyc7XHJcbmltcG9ydCB7IEZlYXR1cmVzLCBzY2VuZXJ5IH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcblxyXG4vLyBjb252ZW5pZW5jZSBmdW5jdGlvblxyXG5mdW5jdGlvbiBwKCB4OiBudW1iZXIsIHk6IG51bWJlciApOiBWZWN0b3IyIHtcclxuICByZXR1cm4gbmV3IFZlY3RvcjIoIHgsIHkgKTtcclxufVxyXG5cclxuLy8gVE9ETzogcmVtb3ZlIGZsYWcgYW5kIHRlc3RzIGFmdGVyIHdlJ3JlIGRvbmUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuY29uc3QgZGVidWdDaHJvbWVCb3VuZHNTY2FubmluZyA9IGZhbHNlO1xyXG5cclxuLy8gZGV0ZWN0IHByb3Blcmx5IHByZWZpeGVkIHRyYW5zZm9ybSBhbmQgdHJhbnNmb3JtT3JpZ2luIHByb3BlcnRpZXNcclxuY29uc3QgdHJhbnNmb3JtUHJvcGVydHkgPSBGZWF0dXJlcy50cmFuc2Zvcm07XHJcbmNvbnN0IHRyYW5zZm9ybU9yaWdpblByb3BlcnR5ID0gRmVhdHVyZXMudHJhbnNmb3JtT3JpZ2luIHx8ICd0cmFuc2Zvcm1PcmlnaW4nOyAvLyBmYWxsYmFjaywgc28gd2UgZG9uJ3QgdHJ5IHRvIHNldCBhbiBlbXB0eSBzdHJpbmcgcHJvcGVydHkgbGF0ZXJcclxuXHJcbi8vIFNjZW5lcnkgYXBwbGljYXRpb25zIHRoYXQgZG8gbm90IHVzZSBXZWJHTCBtYXkgdHJpZ2dlciBhIH4gMC41IHNlY29uZCBwYXVzZSBzaG9ydGx5IGFmdGVyIGxhdW5jaCBvbiBzb21lIHBsYXRmb3Jtcy5cclxuLy8gV2ViZ2wgaXMgZW5hYmxlZCBieSBkZWZhdWx0IGJ1dCBtYXkgYmUgc2h1dCBvZmYgZm9yIGFwcGxpY2F0aW9ucyB0aGF0IGtub3cgdGhleSB3aWxsIG5vdCB3YW50IHRvIHVzZSBpdFxyXG4vLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzYyMVxyXG5sZXQgd2ViZ2xFbmFibGVkID0gdHJ1ZTtcclxuXHJcbmxldCBfZXh0ZW5zaW9ubGVzc1dlYkdMU3VwcG9ydDogYm9vbGVhbiB8IHVuZGVmaW5lZDsgLy8gbGF6aWx5IGNvbXB1dGVkXHJcblxyXG5jb25zdCBVdGlscyA9IHtcclxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcclxuICAgKiBUcmFuc2Zvcm1hdGlvbiBVdGlsaXRpZXMgKFRPRE86IHNlcGFyYXRlIGZpbGUpIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuICAvKipcclxuICAgKiBQcmVwYXJlcyBhIERPTSBlbGVtZW50IGZvciB1c2Ugd2l0aCBhcHBseVByZXBhcmVkVHJhbnNmb3JtKCkuIEFwcGxpZXMgc29tZSBDU1Mgc3R5bGVzIHRoYXQgYXJlIHJlcXVpcmVkLCBidXRcclxuICAgKiB0aGF0IHdlIGRvbid0IHdhbnQgdG8gc2V0IHdoaWxlIGFuaW1hdGluZy5cclxuICAgKi9cclxuICBwcmVwYXJlRm9yVHJhbnNmb3JtKCBlbGVtZW50OiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnQgKTogdm9pZCB7XHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICBlbGVtZW50LnN0eWxlWyB0cmFuc2Zvcm1PcmlnaW5Qcm9wZXJ0eSBdID0gJ3RvcCBsZWZ0JztcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBBcHBsaWVzIHRoZSBDU1MgdHJhbnNmb3JtIG9mIHRoZSBtYXRyaXggdG8gdGhlIGVsZW1lbnQsIHdpdGggb3B0aW9uYWwgZm9yY2luZyBvZiBhY2NlbGVyYXRpb24uXHJcbiAgICogTk9URTogcHJlcGFyZUZvclRyYW5zZm9ybSBzaG91bGQgYmUgY2FsbGVkIGF0IGxlYXN0IG9uY2Ugb24gdGhlIGVsZW1lbnQgYmVmb3JlIHRoaXMgbWV0aG9kIGlzIHVzZWQuXHJcbiAgICovXHJcbiAgYXBwbHlQcmVwYXJlZFRyYW5zZm9ybSggbWF0cml4OiBNYXRyaXgzLCBlbGVtZW50OiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnQgKTogdm9pZCB7XHJcbiAgICAvLyBOT1RFOiBub3QgYXBwbHlpbmcgdHJhbnNsYXRlWiwgc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTAwMTQ0NjEvd2h5LWRvZXMtZW5hYmxpbmctaGFyZHdhcmUtYWNjZWxlcmF0aW9uLWluLWNzczMtc2xvdy1kb3duLXBlcmZvcm1hbmNlXHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICBlbGVtZW50LnN0eWxlWyB0cmFuc2Zvcm1Qcm9wZXJ0eSBdID0gbWF0cml4LmdldENTU1RyYW5zZm9ybSgpO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEFwcGxpZXMgYSBDU1MgdHJhbnNmb3JtIHZhbHVlIHN0cmluZyB0byBhIERPTSBlbGVtZW50LlxyXG4gICAqIE5PVEU6IHByZXBhcmVGb3JUcmFuc2Zvcm0gc2hvdWxkIGJlIGNhbGxlZCBhdCBsZWFzdCBvbmNlIG9uIHRoZSBlbGVtZW50IGJlZm9yZSB0aGlzIG1ldGhvZCBpcyB1c2VkLlxyXG4gICAqL1xyXG4gIHNldFRyYW5zZm9ybSggdHJhbnNmb3JtU3RyaW5nOiBzdHJpbmcsIGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudCApOiB2b2lkIHtcclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgIGVsZW1lbnQuc3R5bGVbIHRyYW5zZm9ybVByb3BlcnR5IF0gPSB0cmFuc2Zvcm1TdHJpbmc7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyBhIENTUyB0cmFuc2Zvcm0gZnJvbSBhIERPTSBlbGVtZW50LlxyXG4gICAqL1xyXG4gIHVuc2V0VHJhbnNmb3JtKCBlbGVtZW50OiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnQgKTogdm9pZCB7XHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICBlbGVtZW50LnN0eWxlWyB0cmFuc2Zvcm1Qcm9wZXJ0eSBdID0gJyc7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogRW5zdXJlcyB0aGF0IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgYW5kIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB1c2UgYSBuYXRpdmUgaW1wbGVtZW50YXRpb24gaWYgcG9zc2libGUsXHJcbiAgICogb3RoZXJ3aXNlIHVzaW5nIGEgc2ltcGxlIHNldFRpbWVvdXQgaW50ZXJuYWxseS4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy80MjZcclxuICAgKi9cclxuICBwb2x5ZmlsbFJlcXVlc3RBbmltYXRpb25GcmFtZSgpOiB2b2lkIHtcclxuICAgIGlmICggIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgIXdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSApIHtcclxuICAgICAgLy8gRmFsbGJhY2sgaW1wbGVtZW50YXRpb24gaWYgbm8gcHJlZml4ZWQgdmVyc2lvbiBpcyBhdmFpbGFibGVcclxuICAgICAgaWYgKCAhRmVhdHVyZXMucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8ICFGZWF0dXJlcy5jYW5jZWxBbmltYXRpb25GcmFtZSApIHtcclxuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gY2FsbGJhY2sgPT4ge1xyXG4gICAgICAgICAgY29uc3QgdGltZUF0U3RhcnQgPSBEYXRlLm5vdygpO1xyXG5cclxuICAgICAgICAgIC8vIE5PVEU6IFdlIGRvbid0IHdhbnQgdG8gcmVseSBvbiBhIGNvbW1vbiB0aW1lciwgc28gd2UncmUgdXNpbmcgdGhlIGJ1aWx0LWluIGZvcm0gb24gcHVycG9zZS5cclxuICAgICAgICAgIHJldHVybiB3aW5kb3cuc2V0VGltZW91dCggKCkgPT4geyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJhZC1zaW0tdGV4dFxyXG4gICAgICAgICAgICBjYWxsYmFjayggRGF0ZS5ub3coKSAtIHRpbWVBdFN0YXJ0ICk7XHJcbiAgICAgICAgICB9LCAxNiApO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gY2xlYXJUaW1lb3V0O1xyXG4gICAgICB9XHJcbiAgICAgIC8vIEZpbGwgaW4gdGhlIG5vbi1wcmVmaXhlZCBuYW1lcyB3aXRoIHRoZSBwcmVmaXhlZCB2ZXJzaW9uc1xyXG4gICAgICBlbHNlIHtcclxuICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1sgRmVhdHVyZXMucmVxdWVzdEFuaW1hdGlvbkZyYW1lIF07XHJcbiAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvd1sgRmVhdHVyZXMuY2FuY2VsQW5pbWF0aW9uRnJhbWUgXTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHJlbGF0aXZlIHNpemUgb2YgdGhlIGNvbnRleHQncyBiYWNraW5nIHN0b3JlIGNvbXBhcmVkIHRvIHRoZSBhY3R1YWwgQ2FudmFzLiBGb3IgZXhhbXBsZSwgaWYgaXQncyAyLFxyXG4gICAqIHRoZSBiYWNraW5nIHN0b3JlIGhhcyAyeDIgdGhlIGFtb3VudCBvZiBwaXhlbHMgKDQgdGltZXMgdG90YWwpLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIGJhY2tpbmcgc3RvcmUgcGl4ZWwgcmF0aW8uXHJcbiAgICovXHJcbiAgYmFja2luZ1N0b3JlUGl4ZWxSYXRpbyggY29udGV4dDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEIHwgV2ViR0xSZW5kZXJpbmdDb250ZXh0ICk6IG51bWJlciB7XHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICByZXR1cm4gY29udGV4dC53ZWJraXRCYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8XHJcbiAgICAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICAgICAgIGNvbnRleHQubW96QmFja2luZ1N0b3JlUGl4ZWxSYXRpbyB8fFxyXG4gICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgICAgICAgICBjb250ZXh0Lm1zQmFja2luZ1N0b3JlUGl4ZWxSYXRpbyB8fFxyXG4gICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgICAgICAgICBjb250ZXh0Lm9CYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8XHJcbiAgICAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICAgICAgIGNvbnRleHQuYmFja2luZ1N0b3JlUGl4ZWxSYXRpbyB8fCAxO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHNjYWxpbmcgZmFjdG9yIHRoYXQgbmVlZHMgdG8gYmUgYXBwbGllZCBmb3IgaGFuZGxpbmcgYSBIaURQSSBDYW52YXNcclxuICAgKiBTZWUgc2VlIGh0dHA6Ly9kZXZlbG9wZXIuYXBwbGUuY29tL2xpYnJhcnkvc2FmYXJpLyNkb2N1bWVudGF0aW9uL0F1ZGlvVmlkZW8vQ29uY2VwdHVhbC9IVE1MLWNhbnZhcy1ndWlkZS9TZXR0aW5nVXB0aGVDYW52YXMvU2V0dGluZ1VwdGhlQ2FudmFzLmh0bWwjLy9hcHBsZV9yZWYvZG9jL3VpZC9UUDQwMDEwNTQyLUNIMi1TVzVcclxuICAgKiBBbmQgaXQncyB1cGRhdGVkIGJhc2VkIG9uIGh0dHA6Ly93d3cuaHRtbDVyb2Nrcy5jb20vZW4vdHV0b3JpYWxzL2NhbnZhcy9oaWRwaS9cclxuICAgKi9cclxuICBiYWNraW5nU2NhbGUoIGNvbnRleHQ6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCB8IFdlYkdMUmVuZGVyaW5nQ29udGV4dCApOiBudW1iZXIge1xyXG4gICAgaWYgKCAnZGV2aWNlUGl4ZWxSYXRpbycgaW4gd2luZG93ICkge1xyXG4gICAgICBjb25zdCBiYWNraW5nU3RvcmVSYXRpbyA9IFV0aWxzLmJhY2tpbmdTdG9yZVBpeGVsUmF0aW8oIGNvbnRleHQgKTtcclxuXHJcbiAgICAgIHJldHVybiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyAvIGJhY2tpbmdTdG9yZVJhdGlvO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIDE7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogV2hldGhlciB0aGUgbmF0aXZlIENhbnZhcyBIVE1MNSBBUEkgc3VwcG9ydHMgdGhlICdmaWx0ZXInIGF0dHJpYnV0ZSAoc2ltaWxhciB0byB0aGUgQ1NTL1NWRyBmaWx0ZXIgYXR0cmlidXRlKS5cclxuICAgKi9cclxuICBzdXBwb3J0c05hdGl2ZUNhbnZhc0ZpbHRlcigpOiBib29sZWFuIHtcclxuICAgIHJldHVybiAhIUZlYXR1cmVzLmNhbnZhc0ZpbHRlcjtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBXaGV0aGVyIHdlIGNhbiBoYW5kbGUgYXJiaXRyYXJ5IGZpbHRlcnMgaW4gQ2FudmFzIGJ5IG1hbmlwdWxhdGluZyB0aGUgSW1hZ2VEYXRhIHJldHVybmVkLiBJZiB3ZSBoYXZlIGEgYmFja2luZ1xyXG4gICAqIHN0b3JlIHBpeGVsIHJhdGlvIHRoYXQgaXMgbm9uLTEsIHdlJ2xsIGJlIGJsdXJyaW5nIG91dCB0aGluZ3MgZHVyaW5nIHRoYXQgb3BlcmF0aW9uLCB3aGljaCB3b3VsZCBiZSB1bmFjY2VwdGFibGUuXHJcbiAgICovXHJcbiAgc3VwcG9ydHNJbWFnZURhdGFDYW52YXNGaWx0ZXIoKTogYm9vbGVhbiB7XHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIFRPRE86IHNjZW5lcnkgYW5kIHR5cGluZyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgcmV0dXJuIFV0aWxzLmJhY2tpbmdTdG9yZVBpeGVsUmF0aW8oIHNjZW5lcnkuc2NyYXRjaENvbnRleHQgKSA9PT0gMTtcclxuICB9LFxyXG5cclxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcclxuICAgKiBUZXh0IGJvdW5kcyB1dGlsaXRpZXMgKFRPRE86IHNlcGFyYXRlIGZpbGUpIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuICAvKipcclxuICAgKiBHaXZlbiBhIGRhdGEgc25hcHNob3QgYW5kIHRyYW5zZm9ybSwgY2FsY3VsYXRlIHJhbmdlIG9uIGhvdyBsYXJnZSAvIHNtYWxsIHRoZSBib3VuZHMgY2FuIGJlLiBJdCdzXHJcbiAgICogdmVyeSBjb25zZXJ2YXRpdmUsIHdpdGggYW4gZWZmZWN0aXZlIDFweCBleHRyYSByYW5nZSB0byBhbGxvdyBmb3IgZGlmZmVyZW5jZXMgaW4gYW50aS1hbGlhc2luZ1xyXG4gICAqIGZvciBwZXJmb3JtYW5jZSBjb25jZXJucywgdGhpcyBkb2VzIG5vdCBzdXBwb3J0IHNrZXdzIC8gcm90YXRpb25zIC8gYW55dGhpbmcgYnV0IHRyYW5zbGF0aW9uIGFuZCBzY2FsaW5nXHJcbiAgICovXHJcbiAgc2NhbkJvdW5kcyggaW1hZ2VEYXRhOiBJbWFnZURhdGEsIHJlc29sdXRpb246IG51bWJlciwgdHJhbnNmb3JtOiBUcmFuc2Zvcm0zICk6IHsgbWluQm91bmRzOiBCb3VuZHMyOyBtYXhCb3VuZHM6IEJvdW5kczIgfSB7XHJcblxyXG4gICAgLy8gZW50cnkgd2lsbCBiZSB0cnVlIGlmIGFueSBwaXhlbCB3aXRoIHRoZSBnaXZlbiB4IG9yIHkgdmFsdWUgaXMgbm9uLXJnYmEoMCwwLDAsMClcclxuICAgIGNvbnN0IGRpcnR5WCA9IF8ubWFwKCBfLnJhbmdlKCByZXNvbHV0aW9uICksICgpID0+IGZhbHNlICk7XHJcbiAgICBjb25zdCBkaXJ0eVkgPSBfLm1hcCggXy5yYW5nZSggcmVzb2x1dGlvbiApLCAoKSA9PiBmYWxzZSApO1xyXG5cclxuICAgIGZvciAoIGxldCB4ID0gMDsgeCA8IHJlc29sdXRpb247IHgrKyApIHtcclxuICAgICAgZm9yICggbGV0IHkgPSAwOyB5IDwgcmVzb2x1dGlvbjsgeSsrICkge1xyXG4gICAgICAgIGNvbnN0IG9mZnNldCA9IDQgKiAoIHkgKiByZXNvbHV0aW9uICsgeCApO1xyXG4gICAgICAgIGlmICggaW1hZ2VEYXRhLmRhdGFbIG9mZnNldCBdICE9PSAwIHx8IGltYWdlRGF0YS5kYXRhWyBvZmZzZXQgKyAxIF0gIT09IDAgfHwgaW1hZ2VEYXRhLmRhdGFbIG9mZnNldCArIDIgXSAhPT0gMCB8fCBpbWFnZURhdGEuZGF0YVsgb2Zmc2V0ICsgMyBdICE9PSAwICkge1xyXG4gICAgICAgICAgZGlydHlYWyB4IF0gPSB0cnVlO1xyXG4gICAgICAgICAgZGlydHlZWyB5IF0gPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1pblggPSBfLmluZGV4T2YoIGRpcnR5WCwgdHJ1ZSApO1xyXG4gICAgY29uc3QgbWF4WCA9IF8ubGFzdEluZGV4T2YoIGRpcnR5WCwgdHJ1ZSApO1xyXG4gICAgY29uc3QgbWluWSA9IF8uaW5kZXhPZiggZGlydHlZLCB0cnVlICk7XHJcbiAgICBjb25zdCBtYXhZID0gXy5sYXN0SW5kZXhPZiggZGlydHlZLCB0cnVlICk7XHJcblxyXG4gICAgLy8gYmFzZWQgb24gcGl4ZWwgYm91bmRhcmllcy4gZm9yIG1pbkJvdW5kcywgdGhlIGlubmVyIGVkZ2Ugb2YgdGhlIGRpcnR5IHBpeGVsLiBmb3IgbWF4Qm91bmRzLCB0aGUgb3V0ZXIgZWRnZSBvZiB0aGUgYWRqYWNlbnQgbm9uLWRpcnR5IHBpeGVsXHJcbiAgICAvLyByZXN1bHRzIGluIGEgc3ByZWFkIG9mIDIgZm9yIHRoZSBpZGVudGl0eSB0cmFuc2Zvcm0gKG9yIGFueSB0cmFuc2xhdGVkIGZvcm0pXHJcbiAgICBjb25zdCBleHRyYVNwcmVhZCA9IHJlc29sdXRpb24gLyAxNjsgLy8gaXMgQ2hyb21lIGFudGlhbGlhc2luZyByZWFsbHkgbGlrZSB0aGlzPyBkZWFyIGdvZC4uLiBUT0RPISEhIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBtaW5Cb3VuZHM6IG5ldyBCb3VuZHMyKFxyXG4gICAgICAgICggbWluWCA8IDEgfHwgbWluWCA+PSByZXNvbHV0aW9uIC0gMSApID8gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZIDogdHJhbnNmb3JtLmludmVyc2VQb3NpdGlvbjIoIHAoIG1pblggKyAxICsgZXh0cmFTcHJlYWQsIDAgKSApLngsXHJcbiAgICAgICAgKCBtaW5ZIDwgMSB8fCBtaW5ZID49IHJlc29sdXRpb24gLSAxICkgPyBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkgOiB0cmFuc2Zvcm0uaW52ZXJzZVBvc2l0aW9uMiggcCggMCwgbWluWSArIDEgKyBleHRyYVNwcmVhZCApICkueSxcclxuICAgICAgICAoIG1heFggPCAxIHx8IG1heFggPj0gcmVzb2x1dGlvbiAtIDEgKSA/IE51bWJlci5ORUdBVElWRV9JTkZJTklUWSA6IHRyYW5zZm9ybS5pbnZlcnNlUG9zaXRpb24yKCBwKCBtYXhYIC0gZXh0cmFTcHJlYWQsIDAgKSApLngsXHJcbiAgICAgICAgKCBtYXhZIDwgMSB8fCBtYXhZID49IHJlc29sdXRpb24gLSAxICkgPyBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFkgOiB0cmFuc2Zvcm0uaW52ZXJzZVBvc2l0aW9uMiggcCggMCwgbWF4WSAtIGV4dHJhU3ByZWFkICkgKS55XHJcbiAgICAgICksXHJcbiAgICAgIG1heEJvdW5kczogbmV3IEJvdW5kczIoXHJcbiAgICAgICAgKCBtaW5YIDwgMSB8fCBtaW5YID49IHJlc29sdXRpb24gLSAxICkgPyBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFkgOiB0cmFuc2Zvcm0uaW52ZXJzZVBvc2l0aW9uMiggcCggbWluWCAtIDEgLSBleHRyYVNwcmVhZCwgMCApICkueCxcclxuICAgICAgICAoIG1pblkgPCAxIHx8IG1pblkgPj0gcmVzb2x1dGlvbiAtIDEgKSA/IE51bWJlci5ORUdBVElWRV9JTkZJTklUWSA6IHRyYW5zZm9ybS5pbnZlcnNlUG9zaXRpb24yKCBwKCAwLCBtaW5ZIC0gMSAtIGV4dHJhU3ByZWFkICkgKS55LFxyXG4gICAgICAgICggbWF4WCA8IDEgfHwgbWF4WCA+PSByZXNvbHV0aW9uIC0gMSApID8gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZIDogdHJhbnNmb3JtLmludmVyc2VQb3NpdGlvbjIoIHAoIG1heFggKyAyICsgZXh0cmFTcHJlYWQsIDAgKSApLngsXHJcbiAgICAgICAgKCBtYXhZIDwgMSB8fCBtYXhZID49IHJlc29sdXRpb24gLSAxICkgPyBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkgOiB0cmFuc2Zvcm0uaW52ZXJzZVBvc2l0aW9uMiggcCggMCwgbWF4WSArIDIgKyBleHRyYVNwcmVhZCApICkueVxyXG4gICAgICApXHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIE1lYXN1cmVzIGFjY3VyYXRlIGJvdW5kcyBvZiBhIGZ1bmN0aW9uIHRoYXQgZHJhd3MgdGhpbmdzIHRvIGEgQ2FudmFzLlxyXG4gICAqL1xyXG4gIGNhbnZhc0FjY3VyYXRlQm91bmRzKCByZW5kZXJUb0NvbnRleHQ6ICggY29udGV4dDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEICkgPT4gdm9pZCwgb3B0aW9ucz86IHsgcHJlY2lzaW9uPzogbnVtYmVyOyByZXNvbHV0aW9uPzogbnVtYmVyOyBpbml0aWFsU2NhbGU/OiBudW1iZXIgfSApOiBCb3VuZHMyICYgeyBtaW5Cb3VuZHM6IEJvdW5kczI7IG1heEJvdW5kczogQm91bmRzMjsgaXNDb25zaXN0ZW50OiBib29sZWFuOyBwcmVjaXNpb246IG51bWJlciB9IHtcclxuICAgIC8vIGhvdyBjbG9zZSB0byB0aGUgYWN0dWFsIGJvdW5kcyBkbyB3ZSBuZWVkIHRvIGJlP1xyXG4gICAgY29uc3QgcHJlY2lzaW9uID0gKCBvcHRpb25zICYmIG9wdGlvbnMucHJlY2lzaW9uICkgPyBvcHRpb25zLnByZWNpc2lvbiA6IDAuMDAxO1xyXG5cclxuICAgIC8vIDUxMng1MTIgZGVmYXVsdCBzcXVhcmUgcmVzb2x1dGlvblxyXG4gICAgY29uc3QgcmVzb2x1dGlvbiA9ICggb3B0aW9ucyAmJiBvcHRpb25zLnJlc29sdXRpb24gKSA/IG9wdGlvbnMucmVzb2x1dGlvbiA6IDEyODtcclxuXHJcbiAgICAvLyBhdCAxLzE2eCBkZWZhdWx0LCB3ZSB3YW50IHRvIGJlIGFibGUgdG8gZ2V0IHRoZSBib3VuZHMgYWNjdXJhdGVseSBmb3Igc29tZXRoaW5nIGFzIGxhcmdlIGFzIDE2eCBvdXIgaW5pdGlhbCByZXNvbHV0aW9uXHJcbiAgICAvLyBkaXZpc2libGUgYnkgMiBzbyBob3BlZnVsbHkgd2UgYXZvaWQgbW9yZSBxdWlya3MgZnJvbSBDYW52YXMgcmVuZGVyaW5nIGVuZ2luZXNcclxuICAgIGNvbnN0IGluaXRpYWxTY2FsZSA9ICggb3B0aW9ucyAmJiBvcHRpb25zLmluaXRpYWxTY2FsZSApID8gb3B0aW9ucy5pbml0aWFsU2NhbGUgOiAoIDEgLyAxNiApO1xyXG5cclxuICAgIGxldCBtaW5Cb3VuZHMgPSBCb3VuZHMyLk5PVEhJTkc7XHJcbiAgICBsZXQgbWF4Qm91bmRzID0gQm91bmRzMi5FVkVSWVRISU5HO1xyXG5cclxuICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdjYW52YXMnICk7XHJcbiAgICBjYW52YXMud2lkdGggPSByZXNvbHV0aW9uO1xyXG4gICAgY2FudmFzLmhlaWdodCA9IHJlc29sdXRpb247XHJcbiAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoICcyZCcgKSE7XHJcblxyXG4gICAgaWYgKCBkZWJ1Z0Nocm9tZUJvdW5kc1NjYW5uaW5nICkge1xyXG4gICAgICAkKCB3aW5kb3cgKS5yZWFkeSggKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdoMicgKTtcclxuICAgICAgICAkKCBoZWFkZXIgKS50ZXh0KCAnQm91bmRzIFNjYW4nICk7XHJcbiAgICAgICAgJCggJyNkaXNwbGF5JyApLmFwcGVuZCggaGVhZGVyICk7XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUT0RPOiBEb24ndCB1c2UgVHJhbnNmb3JtMyB1bmxlc3MgaXQgaXMgbmVjZXNzYXJ5IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICBmdW5jdGlvbiBzY2FuKCB0cmFuc2Zvcm06IFRyYW5zZm9ybTMgKTogeyBtaW5Cb3VuZHM6IEJvdW5kczI7IG1heEJvdW5kczogQm91bmRzMiB9IHtcclxuICAgICAgLy8gc2F2ZS9yZXN0b3JlLCBpbiBjYXNlIHRoZSByZW5kZXIgdHJpZXMgdG8gZG8gYW55IGZ1bm55IHN0dWZmIGxpa2UgY2xpcHBpbmcsIGV0Yy5cclxuICAgICAgY29udGV4dC5zYXZlKCk7XHJcbiAgICAgIHRyYW5zZm9ybS5tYXRyaXguY2FudmFzU2V0VHJhbnNmb3JtKCBjb250ZXh0ICk7XHJcbiAgICAgIHJlbmRlclRvQ29udGV4dCggY29udGV4dCApO1xyXG4gICAgICBjb250ZXh0LnJlc3RvcmUoKTtcclxuXHJcbiAgICAgIGNvbnN0IGRhdGEgPSBjb250ZXh0LmdldEltYWdlRGF0YSggMCwgMCwgcmVzb2x1dGlvbiwgcmVzb2x1dGlvbiApO1xyXG4gICAgICBjb25zdCBtaW5NYXhCb3VuZHMgPSBVdGlscy5zY2FuQm91bmRzKCBkYXRhLCByZXNvbHV0aW9uLCB0cmFuc2Zvcm0gKTtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIHNuYXBzaG90VG9DYW52YXMoIHNuYXBzaG90OiBJbWFnZURhdGEgKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcclxuICAgICAgICBjYW52YXMud2lkdGggPSByZXNvbHV0aW9uO1xyXG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSByZXNvbHV0aW9uO1xyXG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCggJzJkJyApITtcclxuICAgICAgICBjb250ZXh0LnB1dEltYWdlRGF0YSggc25hcHNob3QsIDAsIDAgKTtcclxuICAgICAgICAkKCBjYW52YXMgKS5jc3MoICdib3JkZXInLCAnMXB4IHNvbGlkIGJsYWNrJyApO1xyXG4gICAgICAgICQoIHdpbmRvdyApLnJlYWR5KCAoKSA9PiB7XHJcbiAgICAgICAgICAvLyQoICcjZGlzcGxheScgKS5hcHBlbmQoICQoIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICkgKS50ZXh0KCAnQm91bmRzOiAnICsgICkgKTtcclxuICAgICAgICAgICQoICcjZGlzcGxheScgKS5hcHBlbmQoIGNhbnZhcyApO1xyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gVE9ETzogcmVtb3ZlIGFmdGVyIGRlYnVnIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAgIGlmICggZGVidWdDaHJvbWVCb3VuZHNTY2FubmluZyApIHtcclxuICAgICAgICBzbmFwc2hvdFRvQ2FudmFzKCBkYXRhICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnRleHQuY2xlYXJSZWN0KCAwLCAwLCByZXNvbHV0aW9uLCByZXNvbHV0aW9uICk7XHJcblxyXG4gICAgICByZXR1cm4gbWluTWF4Qm91bmRzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGF0dGVtcHRzIHRvIG1hcCB0aGUgYm91bmRzIHNwZWNpZmllZCB0byB0aGUgZW50aXJlIHRlc3RpbmcgY2FudmFzIChtaW51cyBhIGZpbmUgYm9yZGVyKSwgc28gd2UgY2FuIG5haWwgZG93biB0aGUgbG9jYXRpb24gcXVpY2tseVxyXG4gICAgZnVuY3Rpb24gaWRlYWxUcmFuc2Zvcm0oIGJvdW5kczogQm91bmRzMiApOiBUcmFuc2Zvcm0zIHtcclxuICAgICAgLy8gc28gdGhhdCB0aGUgYm91bmRzLWVkZ2UgZG9lc24ndCBsYW5kIHNxdWFyZWx5IG9uIHRoZSBib3VuZGFyeVxyXG4gICAgICBjb25zdCBib3JkZXJTaXplID0gMjtcclxuXHJcbiAgICAgIGNvbnN0IHNjYWxlWCA9ICggcmVzb2x1dGlvbiAtIGJvcmRlclNpemUgKiAyICkgLyAoIGJvdW5kcy5tYXhYIC0gYm91bmRzLm1pblggKTtcclxuICAgICAgY29uc3Qgc2NhbGVZID0gKCByZXNvbHV0aW9uIC0gYm9yZGVyU2l6ZSAqIDIgKSAvICggYm91bmRzLm1heFkgLSBib3VuZHMubWluWSApO1xyXG4gICAgICBjb25zdCB0cmFuc2xhdGlvblggPSAtc2NhbGVYICogYm91bmRzLm1pblggKyBib3JkZXJTaXplO1xyXG4gICAgICBjb25zdCB0cmFuc2xhdGlvblkgPSAtc2NhbGVZICogYm91bmRzLm1pblkgKyBib3JkZXJTaXplO1xyXG5cclxuICAgICAgcmV0dXJuIG5ldyBUcmFuc2Zvcm0zKCBNYXRyaXgzLnRyYW5zbGF0aW9uKCB0cmFuc2xhdGlvblgsIHRyYW5zbGF0aW9uWSApLnRpbWVzTWF0cml4KCBNYXRyaXgzLnNjYWxpbmcoIHNjYWxlWCwgc2NhbGVZICkgKSApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGluaXRpYWxUcmFuc2Zvcm0gPSBuZXcgVHJhbnNmb3JtMygpO1xyXG4gICAgLy8gbWFrZSBzdXJlIHRvIGluaXRpYWxseSBjZW50ZXIgb3VyIG9iamVjdCwgc28gd2UgZG9uJ3QgbWlzcyB0aGUgYm91bmRzXHJcbiAgICBpbml0aWFsVHJhbnNmb3JtLmFwcGVuZCggTWF0cml4My50cmFuc2xhdGlvbiggcmVzb2x1dGlvbiAvIDIsIHJlc29sdXRpb24gLyAyICkgKTtcclxuICAgIGluaXRpYWxUcmFuc2Zvcm0uYXBwZW5kKCBNYXRyaXgzLnNjYWxpbmcoIGluaXRpYWxTY2FsZSApICk7XHJcblxyXG4gICAgY29uc3QgY29hcnNlQm91bmRzID0gc2NhbiggaW5pdGlhbFRyYW5zZm9ybSApO1xyXG5cclxuICAgIG1pbkJvdW5kcyA9IG1pbkJvdW5kcy51bmlvbiggY29hcnNlQm91bmRzLm1pbkJvdW5kcyApO1xyXG4gICAgbWF4Qm91bmRzID0gbWF4Qm91bmRzLmludGVyc2VjdGlvbiggY29hcnNlQm91bmRzLm1heEJvdW5kcyApO1xyXG5cclxuICAgIGxldCB0ZW1wTWluO1xyXG4gICAgbGV0IHRlbXBNYXg7XHJcbiAgICBsZXQgcmVmaW5lZEJvdW5kcztcclxuXHJcbiAgICAvLyBtaW5YXHJcbiAgICB0ZW1wTWluID0gbWF4Qm91bmRzLm1pblk7XHJcbiAgICB0ZW1wTWF4ID0gbWF4Qm91bmRzLm1heFk7XHJcbiAgICB3aGlsZSAoIGlzRmluaXRlKCBtaW5Cb3VuZHMubWluWCApICYmIGlzRmluaXRlKCBtYXhCb3VuZHMubWluWCApICYmIE1hdGguYWJzKCBtaW5Cb3VuZHMubWluWCAtIG1heEJvdW5kcy5taW5YICkgPiBwcmVjaXNpb24gKSB7XHJcbiAgICAgIC8vIHVzZSBtYXhpbXVtIGJvdW5kcyBleGNlcHQgZm9yIHRoZSB4IGRpcmVjdGlvbiwgc28gd2UgZG9uJ3QgbWlzcyB0aGluZ3MgdGhhdCB3ZSBhcmUgbG9va2luZyBmb3JcclxuICAgICAgcmVmaW5lZEJvdW5kcyA9IHNjYW4oIGlkZWFsVHJhbnNmb3JtKCBuZXcgQm91bmRzMiggbWF4Qm91bmRzLm1pblgsIHRlbXBNaW4sIG1pbkJvdW5kcy5taW5YLCB0ZW1wTWF4ICkgKSApO1xyXG5cclxuICAgICAgaWYgKCBtaW5Cb3VuZHMubWluWCA8PSByZWZpbmVkQm91bmRzLm1pbkJvdW5kcy5taW5YICYmIG1heEJvdW5kcy5taW5YID49IHJlZmluZWRCb3VuZHMubWF4Qm91bmRzLm1pblggKSB7XHJcbiAgICAgICAgLy8gc2FuaXR5IGNoZWNrIC0gYnJlYWsgb3V0IG9mIGFuIGluZmluaXRlIGxvb3AhXHJcbiAgICAgICAgaWYgKCBkZWJ1Z0Nocm9tZUJvdW5kc1NjYW5uaW5nICkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coICd3YXJuaW5nLCBleGl0aW5nIGluZmluaXRlIGxvb3AhJyApO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coIGB0cmFuc2Zvcm1lZCBcIm1pblwiIG1pblg6ICR7aWRlYWxUcmFuc2Zvcm0oIG5ldyBCb3VuZHMyKCBtYXhCb3VuZHMubWluWCwgbWF4Qm91bmRzLm1pblksIG1pbkJvdW5kcy5taW5YLCBtYXhCb3VuZHMubWF4WSApICkudHJhbnNmb3JtUG9zaXRpb24yKCBwKCBtaW5Cb3VuZHMubWluWCwgMCApICl9YCApO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coIGB0cmFuc2Zvcm1lZCBcIm1heFwiIG1pblg6ICR7aWRlYWxUcmFuc2Zvcm0oIG5ldyBCb3VuZHMyKCBtYXhCb3VuZHMubWluWCwgbWF4Qm91bmRzLm1pblksIG1pbkJvdW5kcy5taW5YLCBtYXhCb3VuZHMubWF4WSApICkudHJhbnNmb3JtUG9zaXRpb24yKCBwKCBtYXhCb3VuZHMubWluWCwgMCApICl9YCApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG5cclxuICAgICAgbWluQm91bmRzID0gbWluQm91bmRzLndpdGhNaW5YKCBNYXRoLm1pbiggbWluQm91bmRzLm1pblgsIHJlZmluZWRCb3VuZHMubWluQm91bmRzLm1pblggKSApO1xyXG4gICAgICBtYXhCb3VuZHMgPSBtYXhCb3VuZHMud2l0aE1pblgoIE1hdGgubWF4KCBtYXhCb3VuZHMubWluWCwgcmVmaW5lZEJvdW5kcy5tYXhCb3VuZHMubWluWCApICk7XHJcbiAgICAgIHRlbXBNaW4gPSBNYXRoLm1heCggdGVtcE1pbiwgcmVmaW5lZEJvdW5kcy5tYXhCb3VuZHMubWluWSApO1xyXG4gICAgICB0ZW1wTWF4ID0gTWF0aC5taW4oIHRlbXBNYXgsIHJlZmluZWRCb3VuZHMubWF4Qm91bmRzLm1heFkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBtYXhYXHJcbiAgICB0ZW1wTWluID0gbWF4Qm91bmRzLm1pblk7XHJcbiAgICB0ZW1wTWF4ID0gbWF4Qm91bmRzLm1heFk7XHJcbiAgICB3aGlsZSAoIGlzRmluaXRlKCBtaW5Cb3VuZHMubWF4WCApICYmIGlzRmluaXRlKCBtYXhCb3VuZHMubWF4WCApICYmIE1hdGguYWJzKCBtaW5Cb3VuZHMubWF4WCAtIG1heEJvdW5kcy5tYXhYICkgPiBwcmVjaXNpb24gKSB7XHJcbiAgICAgIC8vIHVzZSBtYXhpbXVtIGJvdW5kcyBleGNlcHQgZm9yIHRoZSB4IGRpcmVjdGlvbiwgc28gd2UgZG9uJ3QgbWlzcyB0aGluZ3MgdGhhdCB3ZSBhcmUgbG9va2luZyBmb3JcclxuICAgICAgcmVmaW5lZEJvdW5kcyA9IHNjYW4oIGlkZWFsVHJhbnNmb3JtKCBuZXcgQm91bmRzMiggbWluQm91bmRzLm1heFgsIHRlbXBNaW4sIG1heEJvdW5kcy5tYXhYLCB0ZW1wTWF4ICkgKSApO1xyXG5cclxuICAgICAgaWYgKCBtaW5Cb3VuZHMubWF4WCA+PSByZWZpbmVkQm91bmRzLm1pbkJvdW5kcy5tYXhYICYmIG1heEJvdW5kcy5tYXhYIDw9IHJlZmluZWRCb3VuZHMubWF4Qm91bmRzLm1heFggKSB7XHJcbiAgICAgICAgLy8gc2FuaXR5IGNoZWNrIC0gYnJlYWsgb3V0IG9mIGFuIGluZmluaXRlIGxvb3AhXHJcbiAgICAgICAgaWYgKCBkZWJ1Z0Nocm9tZUJvdW5kc1NjYW5uaW5nICkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coICd3YXJuaW5nLCBleGl0aW5nIGluZmluaXRlIGxvb3AhJyApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG5cclxuICAgICAgbWluQm91bmRzID0gbWluQm91bmRzLndpdGhNYXhYKCBNYXRoLm1heCggbWluQm91bmRzLm1heFgsIHJlZmluZWRCb3VuZHMubWluQm91bmRzLm1heFggKSApO1xyXG4gICAgICBtYXhCb3VuZHMgPSBtYXhCb3VuZHMud2l0aE1heFgoIE1hdGgubWluKCBtYXhCb3VuZHMubWF4WCwgcmVmaW5lZEJvdW5kcy5tYXhCb3VuZHMubWF4WCApICk7XHJcbiAgICAgIHRlbXBNaW4gPSBNYXRoLm1heCggdGVtcE1pbiwgcmVmaW5lZEJvdW5kcy5tYXhCb3VuZHMubWluWSApO1xyXG4gICAgICB0ZW1wTWF4ID0gTWF0aC5taW4oIHRlbXBNYXgsIHJlZmluZWRCb3VuZHMubWF4Qm91bmRzLm1heFkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBtaW5ZXHJcbiAgICB0ZW1wTWluID0gbWF4Qm91bmRzLm1pblg7XHJcbiAgICB0ZW1wTWF4ID0gbWF4Qm91bmRzLm1heFg7XHJcbiAgICB3aGlsZSAoIGlzRmluaXRlKCBtaW5Cb3VuZHMubWluWSApICYmIGlzRmluaXRlKCBtYXhCb3VuZHMubWluWSApICYmIE1hdGguYWJzKCBtaW5Cb3VuZHMubWluWSAtIG1heEJvdW5kcy5taW5ZICkgPiBwcmVjaXNpb24gKSB7XHJcbiAgICAgIC8vIHVzZSBtYXhpbXVtIGJvdW5kcyBleGNlcHQgZm9yIHRoZSB5IGRpcmVjdGlvbiwgc28gd2UgZG9uJ3QgbWlzcyB0aGluZ3MgdGhhdCB3ZSBhcmUgbG9va2luZyBmb3JcclxuICAgICAgcmVmaW5lZEJvdW5kcyA9IHNjYW4oIGlkZWFsVHJhbnNmb3JtKCBuZXcgQm91bmRzMiggdGVtcE1pbiwgbWF4Qm91bmRzLm1pblksIHRlbXBNYXgsIG1pbkJvdW5kcy5taW5ZICkgKSApO1xyXG5cclxuICAgICAgaWYgKCBtaW5Cb3VuZHMubWluWSA8PSByZWZpbmVkQm91bmRzLm1pbkJvdW5kcy5taW5ZICYmIG1heEJvdW5kcy5taW5ZID49IHJlZmluZWRCb3VuZHMubWF4Qm91bmRzLm1pblkgKSB7XHJcbiAgICAgICAgLy8gc2FuaXR5IGNoZWNrIC0gYnJlYWsgb3V0IG9mIGFuIGluZmluaXRlIGxvb3AhXHJcbiAgICAgICAgaWYgKCBkZWJ1Z0Nocm9tZUJvdW5kc1NjYW5uaW5nICkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coICd3YXJuaW5nLCBleGl0aW5nIGluZmluaXRlIGxvb3AhJyApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG5cclxuICAgICAgbWluQm91bmRzID0gbWluQm91bmRzLndpdGhNaW5ZKCBNYXRoLm1pbiggbWluQm91bmRzLm1pblksIHJlZmluZWRCb3VuZHMubWluQm91bmRzLm1pblkgKSApO1xyXG4gICAgICBtYXhCb3VuZHMgPSBtYXhCb3VuZHMud2l0aE1pblkoIE1hdGgubWF4KCBtYXhCb3VuZHMubWluWSwgcmVmaW5lZEJvdW5kcy5tYXhCb3VuZHMubWluWSApICk7XHJcbiAgICAgIHRlbXBNaW4gPSBNYXRoLm1heCggdGVtcE1pbiwgcmVmaW5lZEJvdW5kcy5tYXhCb3VuZHMubWluWCApO1xyXG4gICAgICB0ZW1wTWF4ID0gTWF0aC5taW4oIHRlbXBNYXgsIHJlZmluZWRCb3VuZHMubWF4Qm91bmRzLm1heFggKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBtYXhZXHJcbiAgICB0ZW1wTWluID0gbWF4Qm91bmRzLm1pblg7XHJcbiAgICB0ZW1wTWF4ID0gbWF4Qm91bmRzLm1heFg7XHJcbiAgICB3aGlsZSAoIGlzRmluaXRlKCBtaW5Cb3VuZHMubWF4WSApICYmIGlzRmluaXRlKCBtYXhCb3VuZHMubWF4WSApICYmIE1hdGguYWJzKCBtaW5Cb3VuZHMubWF4WSAtIG1heEJvdW5kcy5tYXhZICkgPiBwcmVjaXNpb24gKSB7XHJcbiAgICAgIC8vIHVzZSBtYXhpbXVtIGJvdW5kcyBleGNlcHQgZm9yIHRoZSB5IGRpcmVjdGlvbiwgc28gd2UgZG9uJ3QgbWlzcyB0aGluZ3MgdGhhdCB3ZSBhcmUgbG9va2luZyBmb3JcclxuICAgICAgcmVmaW5lZEJvdW5kcyA9IHNjYW4oIGlkZWFsVHJhbnNmb3JtKCBuZXcgQm91bmRzMiggdGVtcE1pbiwgbWluQm91bmRzLm1heFksIHRlbXBNYXgsIG1heEJvdW5kcy5tYXhZICkgKSApO1xyXG5cclxuICAgICAgaWYgKCBtaW5Cb3VuZHMubWF4WSA+PSByZWZpbmVkQm91bmRzLm1pbkJvdW5kcy5tYXhZICYmIG1heEJvdW5kcy5tYXhZIDw9IHJlZmluZWRCb3VuZHMubWF4Qm91bmRzLm1heFkgKSB7XHJcbiAgICAgICAgLy8gc2FuaXR5IGNoZWNrIC0gYnJlYWsgb3V0IG9mIGFuIGluZmluaXRlIGxvb3AhXHJcbiAgICAgICAgaWYgKCBkZWJ1Z0Nocm9tZUJvdW5kc1NjYW5uaW5nICkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coICd3YXJuaW5nLCBleGl0aW5nIGluZmluaXRlIGxvb3AhJyApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG5cclxuICAgICAgbWluQm91bmRzID0gbWluQm91bmRzLndpdGhNYXhZKCBNYXRoLm1heCggbWluQm91bmRzLm1heFksIHJlZmluZWRCb3VuZHMubWluQm91bmRzLm1heFkgKSApO1xyXG4gICAgICBtYXhCb3VuZHMgPSBtYXhCb3VuZHMud2l0aE1heFkoIE1hdGgubWluKCBtYXhCb3VuZHMubWF4WSwgcmVmaW5lZEJvdW5kcy5tYXhCb3VuZHMubWF4WSApICk7XHJcbiAgICAgIHRlbXBNaW4gPSBNYXRoLm1heCggdGVtcE1pbiwgcmVmaW5lZEJvdW5kcy5tYXhCb3VuZHMubWluWCApO1xyXG4gICAgICB0ZW1wTWF4ID0gTWF0aC5taW4oIHRlbXBNYXgsIHJlZmluZWRCb3VuZHMubWF4Qm91bmRzLm1heFggKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIGRlYnVnQ2hyb21lQm91bmRzU2Nhbm5pbmcgKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCBgbWluQm91bmRzOiAke21pbkJvdW5kc31gICk7XHJcbiAgICAgIGNvbnNvbGUubG9nKCBgbWF4Qm91bmRzOiAke21heEJvdW5kc31gICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgY29uc3QgcmVzdWx0OiBCb3VuZHMyICYgeyBtaW5Cb3VuZHM6IEJvdW5kczI7IG1heEJvdW5kczogQm91bmRzMjsgaXNDb25zaXN0ZW50OiBib29sZWFuOyBwcmVjaXNpb246IG51bWJlciB9ID0gbmV3IEJvdW5kczIoXHJcbiAgICAgIC8vIERvIGZpbml0ZSBjaGVja3Mgc28gd2UgZG9uJ3QgcmV0dXJuIE5hTlxyXG4gICAgICAoIGlzRmluaXRlKCBtaW5Cb3VuZHMubWluWCApICYmIGlzRmluaXRlKCBtYXhCb3VuZHMubWluWCApICkgPyAoIG1pbkJvdW5kcy5taW5YICsgbWF4Qm91bmRzLm1pblggKSAvIDIgOiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXHJcbiAgICAgICggaXNGaW5pdGUoIG1pbkJvdW5kcy5taW5ZICkgJiYgaXNGaW5pdGUoIG1heEJvdW5kcy5taW5ZICkgKSA/ICggbWluQm91bmRzLm1pblkgKyBtYXhCb3VuZHMubWluWSApIC8gMiA6IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSxcclxuICAgICAgKCBpc0Zpbml0ZSggbWluQm91bmRzLm1heFggKSAmJiBpc0Zpbml0ZSggbWF4Qm91bmRzLm1heFggKSApID8gKCBtaW5Cb3VuZHMubWF4WCArIG1heEJvdW5kcy5tYXhYICkgLyAyIDogTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZLFxyXG4gICAgICAoIGlzRmluaXRlKCBtaW5Cb3VuZHMubWF4WSApICYmIGlzRmluaXRlKCBtYXhCb3VuZHMubWF4WSApICkgPyAoIG1pbkJvdW5kcy5tYXhZICsgbWF4Qm91bmRzLm1heFkgKSAvIDIgOiBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFlcclxuICAgICk7XHJcblxyXG4gICAgLy8gZXh0cmEgZGF0YSBhYm91dCBvdXIgYm91bmRzXHJcbiAgICByZXN1bHQubWluQm91bmRzID0gbWluQm91bmRzO1xyXG4gICAgcmVzdWx0Lm1heEJvdW5kcyA9IG1heEJvdW5kcztcclxuICAgIHJlc3VsdC5pc0NvbnNpc3RlbnQgPSBtYXhCb3VuZHMuY29udGFpbnNCb3VuZHMoIG1pbkJvdW5kcyApO1xyXG4gICAgcmVzdWx0LnByZWNpc2lvbiA9IE1hdGgubWF4KFxyXG4gICAgICBNYXRoLmFicyggbWluQm91bmRzLm1pblggLSBtYXhCb3VuZHMubWluWCApLFxyXG4gICAgICBNYXRoLmFicyggbWluQm91bmRzLm1pblkgLSBtYXhCb3VuZHMubWluWSApLFxyXG4gICAgICBNYXRoLmFicyggbWluQm91bmRzLm1heFggLSBtYXhCb3VuZHMubWF4WCApLFxyXG4gICAgICBNYXRoLmFicyggbWluQm91bmRzLm1heFkgLSBtYXhCb3VuZHMubWF4WSApXHJcbiAgICApO1xyXG5cclxuICAgIC8vIHJldHVybiB0aGUgYXZlcmFnZVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9LFxyXG5cclxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcclxuICAgKiBXZWJHTCB1dGlsaXRpZXMgKFRPRE86IHNlcGFyYXRlIGZpbGUpIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuICAvKipcclxuICAgKiBGaW5kcyB0aGUgc21hbGxlc3QgcG93ZXIgb2YgMiB0aGF0IGlzIGF0IGxlYXN0IGFzIGxhcmdlIGFzIG4uXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgc21hbGxlc3QgcG93ZXIgb2YgMiB0aGF0IGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCBuXHJcbiAgICovXHJcbiAgdG9Qb3dlck9mMiggbjogbnVtYmVyICk6IG51bWJlciB7XHJcbiAgICBsZXQgcmVzdWx0ID0gMTtcclxuICAgIHdoaWxlICggcmVzdWx0IDwgbiApIHtcclxuICAgICAgcmVzdWx0ICo9IDI7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW5kIGNvbXBpbGVzIGEgR0xTTCBTaGFkZXIgb2JqZWN0IGluIFdlYkdMLlxyXG4gICAqL1xyXG4gIGNyZWF0ZVNoYWRlciggZ2w6IFdlYkdMUmVuZGVyaW5nQ29udGV4dCwgc291cmNlOiBzdHJpbmcsIHR5cGU6IG51bWJlciApOiBXZWJHTFNoYWRlciB7XHJcbiAgICBjb25zdCBzaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIoIHR5cGUgKSE7XHJcbiAgICBnbC5zaGFkZXJTb3VyY2UoIHNoYWRlciwgc291cmNlICk7XHJcbiAgICBnbC5jb21waWxlU2hhZGVyKCBzaGFkZXIgKTtcclxuXHJcbiAgICBpZiAoICFnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoIHNoYWRlciwgZ2wuQ09NUElMRV9TVEFUVVMgKSApIHtcclxuICAgICAgY29uc29sZS5sb2coICdHTFNMIGNvbXBpbGUgZXJyb3I6JyApO1xyXG4gICAgICBjb25zb2xlLmxvZyggZ2wuZ2V0U2hhZGVySW5mb0xvZyggc2hhZGVyICkgKTtcclxuICAgICAgY29uc29sZS5sb2coIHNvdXJjZSApO1xyXG5cclxuICAgICAgLy8gTm9ybWFsbHkgaXQgd291bGQgYmUgYmVzdCB0byB0aHJvdyBhbiBleGNlcHRpb24gaGVyZSwgYnV0IGEgY29udGV4dCBsb3NzIGNvdWxkIGNhdXNlIHRoZSBzaGFkZXIgcGFyYW1ldGVyIGNoZWNrXHJcbiAgICAgIC8vIHRvIGZhaWwsIGFuZCB3ZSBtdXN0IGhhbmRsZSBjb250ZXh0IGxvc3MgZ3JhY2VmdWxseSBiZXR3ZWVuIGFueSBhZGphY2VudCBwYWlyIG9mIGdsIGNhbGxzLlxyXG4gICAgICAvLyBUaGVyZWZvcmUsIHdlIHNpbXBseSByZXBvcnQgdGhlIGVycm9ycyB0byB0aGUgY29uc29sZS4gIFNlZSAjMjc5XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHNoYWRlcjtcclxuICB9LFxyXG5cclxuICBhcHBseVdlYkdMQ29udGV4dERlZmF1bHRzKCBnbDogV2ViR0xSZW5kZXJpbmdDb250ZXh0ICk6IHZvaWQge1xyXG4gICAgLy8gV2hhdCBjb2xvciBnZXRzIHNldCB3aGVuIHdlIGNhbGwgZ2wuY2xlYXIoKVxyXG4gICAgZ2wuY2xlYXJDb2xvciggMCwgMCwgMCwgMCApO1xyXG5cclxuICAgIC8vIEJsZW5kaW5nIHNpbWlsYXIgdG8gaHR0cDovL2xvY2FsaG9zdC9waGV0L2dpdC93ZWJnbC1ibGVuZGZ1bmN0aW9ucy9ibGVuZGZ1bmNzZXBhcmF0ZS5odG1sXHJcbiAgICBnbC5lbmFibGUoIGdsLkJMRU5EICk7XHJcblxyXG4gICAgLy8gTk9URTogV2Ugc3dpdGNoZWQgYmFjayB0byBhIGZ1bGx5IHByZW11bHRpcGxpZWQgc2V0dXAsIHNvIHdlIGhhdmUgdGhlIGNvcnJlc3BvbmRpbmcgYmxlbmQgZnVuY3Rpb24uXHJcbiAgICAvLyBGb3Igbm9ybWFsIGNvbG9ycyAoYW5kIGN1c3RvbSBXZWJHTE5vZGUgaGFuZGxpbmcpLCBpdCBpcyBuZWNlc3NhcnkgdG8gdXNlIHByZW11bHRpcGxpZWQgdmFsdWVzIChtdWx0aXBseWluZyB0aGVcclxuICAgIC8vIFJHQiB2YWx1ZXMgYnkgdGhlIGFscGhhIHZhbHVlIGZvciBnbF9GcmFnQ29sb3IpLiBGb3IgdGV4dHVyZWQgdHJpYW5nbGVzLCBpdCBpcyBhc3N1bWVkIHRoYXQgdGhlIHRleHR1cmUgaXNcclxuICAgIC8vIGFscmVhZHkgcHJlbXVsdGlwbGllZCwgc28gdGhlIGJ1aWx0LWluIHNoYWRlciBkb2VzIG5vdCBkbyB0aGUgZXh0cmEgcHJlbXVsdGlwbGljYXRpb24uXHJcbiAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2VuZXJneS1za2F0ZS1wYXJrL2lzc3Vlcy8zOSwgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzM5N1xyXG4gICAgLy8gYW5kIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM5MzQxNTY0L3dlYmdsLWhvdy10by1jb3JyZWN0bHktYmxlbmQtYWxwaGEtY2hhbm5lbC1wbmdcclxuICAgIGdsLmJsZW5kRnVuYyggZ2wuT05FLCBnbC5PTkVfTUlOVVNfU1JDX0FMUEhBICk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHdoZXRoZXIgd2ViZ2wgc2hvdWxkIGJlIGVuYWJsZWQsIHNlZSBkb2NzIGZvciB3ZWJnbEVuYWJsZWRcclxuICAgKi9cclxuICBzZXRXZWJHTEVuYWJsZWQoIF93ZWJnbEVuYWJsZWQ6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICB3ZWJnbEVuYWJsZWQgPSBfd2ViZ2xFbmFibGVkO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrIHRvIHNlZSB3aGV0aGVyIHdlYmdsIGlzIHN1cHBvcnRlZCwgdXNpbmcgdGhlIHNhbWUgc3RyYXRlZ3kgYXMgbXJkb29iIGFuZCBwaXhpLmpzXHJcbiAgICpcclxuICAgKiBAcGFyYW0gW2V4dGVuc2lvbnNdIC0gQSBsaXN0IG9mIFdlYkdMIGV4dGVuc2lvbnMgdGhhdCBuZWVkIHRvIGJlIHN1cHBvcnRlZFxyXG4gICAqL1xyXG4gIGNoZWNrV2ViR0xTdXBwb3J0KCBleHRlbnNpb25zPzogc3RyaW5nW10gKTogYm9vbGVhbiB7XHJcblxyXG4gICAgLy8gVGhlIHdlYmdsIGNoZWNrIGNhbiBiZSBzaHV0IG9mZiwgcGxlYXNlIHNlZSBkb2NzIGF0IHdlYmdsRW5hYmxlZCBkZWNsYXJhdGlvbiBzaXRlXHJcbiAgICBpZiAoICF3ZWJnbEVuYWJsZWQgKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdjYW52YXMnICk7XHJcblxyXG4gICAgY29uc3QgYXJncyA9IHsgZmFpbElmTWFqb3JQZXJmb3JtYW5jZUNhdmVhdDogdHJ1ZSB9O1xyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICBjb25zdCBnbDogV2ViR0xSZW5kZXJpbmdDb250ZXh0IHwgbnVsbCA9ICEhd2luZG93LldlYkdMUmVuZGVyaW5nQ29udGV4dCAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICggY2FudmFzLmdldENvbnRleHQoICd3ZWJnbCcsIGFyZ3MgKSB8fCBjYW52YXMuZ2V0Q29udGV4dCggJ2V4cGVyaW1lbnRhbC13ZWJnbCcsIGFyZ3MgKSApO1xyXG5cclxuICAgICAgaWYgKCAhZ2wgKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIGV4dGVuc2lvbnMgKSB7XHJcbiAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgZXh0ZW5zaW9ucy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgIGlmICggZ2wuZ2V0RXh0ZW5zaW9uKCBleHRlbnNpb25zWyBpIF0gKSA9PT0gbnVsbCApIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBjYXRjaCggZSApIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrIHRvIHNlZSB3aGV0aGVyIElFMTEgaGFzIHByb3BlciBjbGVhclN0ZW5jaWwgc3VwcG9ydCAocmVxdWlyZWQgZm9yIHRocmVlLmpzIHRvIHdvcmsgd2VsbCkuXHJcbiAgICovXHJcbiAgY2hlY2tJRTExU3RlbmNpbFN1cHBvcnQoKTogYm9vbGVhbiB7XHJcbiAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgICAgY29uc3QgZ2w6IFdlYkdMUmVuZGVyaW5nQ29udGV4dCB8IG51bGwgPSAhIXdpbmRvdy5XZWJHTFJlbmRlcmluZ0NvbnRleHQgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoIGNhbnZhcy5nZXRDb250ZXh0KCAnd2ViZ2wnICkgfHwgY2FudmFzLmdldENvbnRleHQoICdleHBlcmltZW50YWwtd2ViZ2wnICkgKTtcclxuXHJcbiAgICAgIGlmICggIWdsICkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gRmFpbHVyZSBmb3IgaHR0cHM6Ly9naXRodWIuY29tL21yZG9vYi90aHJlZS5qcy9pc3N1ZXMvMzYwMCAvIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9tb2xlY3VsZS1zaGFwZXMvaXNzdWVzLzEzM1xyXG4gICAgICBnbC5jbGVhclN0ZW5jaWwoIDAgKTtcclxuICAgICAgcmV0dXJuIGdsLmdldEVycm9yKCkgPT09IDA7XHJcbiAgICB9XHJcbiAgICBjYXRjaCggZSApIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZXRoZXIgV2ViR0wgKHdpdGggZGVjZW50IHBlcmZvcm1hbmNlKSBpcyBzdXBwb3J0ZWQgYnkgdGhlIHBsYXRmb3JtXHJcbiAgICovXHJcbiAgZ2V0IGlzV2ViR0xTdXBwb3J0ZWQoKTogYm9vbGVhbiB7XHJcbiAgICBpZiAoIF9leHRlbnNpb25sZXNzV2ViR0xTdXBwb3J0ID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgIF9leHRlbnNpb25sZXNzV2ViR0xTdXBwb3J0ID0gVXRpbHMuY2hlY2tXZWJHTFN1cHBvcnQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBfZXh0ZW5zaW9ubGVzc1dlYkdMU3VwcG9ydDtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBUcmlnZ2VycyBhIGxvc3Mgb2YgYSBXZWJHTCBjb250ZXh0LCB3aXRoIGEgZGVsYXllZCByZXN0b3JhdGlvbi5cclxuICAgKlxyXG4gICAqIE5PVEU6IE9ubHkgdXNlIHRoaXMgZm9yIGRlYnVnZ2luZy4gU2hvdWxkIG5vdCBiZSBjYWxsZWQgbm9ybWFsbHkuXHJcbiAgICovXHJcbiAgbG9zZUNvbnRleHQoIGdsOiBXZWJHTFJlbmRlcmluZ0NvbnRleHQgKTogdm9pZCB7XHJcbiAgICBjb25zdCBleHRlbnNpb24gPSBnbC5nZXRFeHRlbnNpb24oICdXRUJHTF9sb3NlX2NvbnRleHQnICk7XHJcbiAgICBpZiAoIGV4dGVuc2lvbiApIHtcclxuICAgICAgZXh0ZW5zaW9uLmxvc2VDb250ZXh0KCk7XHJcblxyXG4gICAgICAvLyBOT1RFOiBXZSBkb24ndCB3YW50IHRvIHJlbHkgb24gYSBjb21tb24gdGltZXIsIHNvIHdlJ3JlIHVzaW5nIHRoZSBidWlsdC1pbiBmb3JtIG9uIHB1cnBvc2UuXHJcbiAgICAgIHNldFRpbWVvdXQoICgpID0+IHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBiYWQtc2ltLXRleHRcclxuICAgICAgICBleHRlbnNpb24ucmVzdG9yZUNvbnRleHQoKTtcclxuICAgICAgfSwgMTAwMCApO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBzdHJpbmcgdXNlZnVsIGZvciB3b3JraW5nIGFyb3VuZCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvY29sbGlzaW9uLWxhYi9pc3N1ZXMvMTc3LlxyXG4gICAqL1xyXG4gIHNhZmFyaUVtYmVkZGluZ01hcmtXb3JrYXJvdW5kKCBzdHI6IHN0cmluZyApOiBzdHJpbmcge1xyXG4gICAgaWYgKCBwbGF0Zm9ybS5zYWZhcmkgKSB7XHJcbiAgICAgIC8vIE5PVEU6IEkgZG9uJ3QgYmVsaWV2ZSBpdCdzIGxpa2VseS9wb3NzaWJsZSBhIHZhbGlkIFVURi04IHN0cmluZyB3aWxsIGNvbnRhaW4gdGhlc2UgY29kZSBwb2ludHMgYWRqYWNlbnRseSxcclxuICAgICAgLy8gZHVlIHRvIHRoZSBwcm9wZXJ0eSB0aGF0IHlvdSBjYW4gc3RhcnQgcmVhZGluZyBVVEYtOCBmcm9tIGFueSBieXRlLiBTbyB3ZSdyZSBzYWZlIHRvIHNwbGl0IGl0IGFuZCBicmVhayBpdFxyXG4gICAgICAvLyBpbnRvIFVURi0xNiBjb2RlIHVuaXRzLCBzaW5jZSB3ZSdyZSBub3QgbXVja2luZyB3aXRoIHN1cnJvZ2F0ZSBwYWlycy5cclxuICAgICAgY29uc3QgdXRmMTZDb2RlVW5pdHMgPSBzdHIuc3BsaXQoICcnICk7XHJcbiAgICAgIGxldCByZXN1bHQgPSAnJztcclxuXHJcbiAgICAgIC8vIE5PVEU6IFdlJ3JlIG9ubHkgaW5zZXJ0aW5nIHplcm8td2lkdGggc3BhY2VzIGJldHdlZW4gZW1iZWRkaW5nIG1hcmtzLCBzaW5jZSBwcmlvciB0byB0aGlzIG91ciBpbnNlcnRpb24gYmV0d2VlblxyXG4gICAgICAvLyBjZXJ0YWluIGNvZGUgcG9pbnRzIHdhcyBjYXVzaW5nIGlzc3VlcyB3aXRoIFNhZmFyaSAoaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3dlYnNpdGUtbWV0ZW9yL2lzc3Vlcy82NTYpXHJcbiAgICAgIGxldCBsYXN0SXNFbWJlZGRpbmdNYXJrID0gZmFsc2U7XHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHV0ZjE2Q29kZVVuaXRzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIGNvbnN0IG5leHQgPSB1dGYxNkNvZGVVbml0c1sgaSBdO1xyXG4gICAgICAgIGNvbnN0IG5leHRJc0VtYmVkZGluZ01hcmsgPSBuZXh0ID09PSAnXFx1MjAyYScgfHwgbmV4dCA9PT0gJ1xcdTIwMmInIHx8IG5leHQgPT09ICdcXHUyMDJjJztcclxuXHJcbiAgICAgICAgLy8gQWRkIGluIHplcm8td2lkdGggc3BhY2VzIGZvciBTYWZhcmksIHNvIGl0IGRvZXNuJ3QgaGF2ZSBhZGphY2VudCBlbWJlZGRpbmcgbWFya3MgZXZlciAod2hpY2ggc2VlbXMgdG8gcHJldmVudFxyXG4gICAgICAgIC8vIHRoaW5ncykuXHJcbiAgICAgICAgaWYgKCBsYXN0SXNFbWJlZGRpbmdNYXJrICYmIG5leHRJc0VtYmVkZGluZ01hcmsgKSB7XHJcbiAgICAgICAgICByZXN1bHQgKz0gJ1xcdTIwMEInO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXN1bHQgKz0gbmV4dDtcclxuXHJcbiAgICAgICAgbGFzdElzRW1iZWRkaW5nTWFyayA9IG5leHRJc0VtYmVkZGluZ01hcms7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIHN0cjtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnVXRpbHMnLCBVdGlscyApO1xyXG5leHBvcnQgZGVmYXVsdCBVdGlsczsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsT0FBTyxNQUFNLDRC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WTtJQUM5QixJQUFLdkosMEJBQTBCLEtBQUt3SixTQUFTLEVBQUc7TUFDOUN4SiwwQkFBMEIsR0FBR0MsS0FBSyxDQUFDMEksaUJBQWlCLENBQUMsQ0FBQztJQUN4RDtJQUNBLE9BQU8zSSwwQkFBMEI7RUFDbkMsQ0FBQztFQUVEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRXlKLFdBQVdBLENBQUVoQyxFQUF5QixFQUFTO0lBQzdDLE1BQU1pQyxTQUFTLEdBQUdqQyxFQUFFLENBQUN5QixZQUFZLENBQUUsb0JBQXFCLENBQUM7SUFDekQsSUFBS1EsU0FBUyxFQUFHO01BQ2ZBLFNBQVMsQ0FBQ0QsV0FBVyxDQUFDLENBQUM7O01BRXZCO01BQ0F0SSxVQUFVLENBQUUsTUFBTTtRQUFFO1FBQ2xCdUksU0FBUyxDQUFDQyxjQUFjLENBQUMsQ0FBQztNQUM1QixDQUFDLEVBQUUsSUFBSyxDQUFDO0lBQ1g7RUFDRixDQUFDO0VBRUQ7QUFDRjtBQUNBO0VBQ0VDLDZCQUE2QkEsQ0FBRUMsR0FBVyxFQUFXO0lBQ25ELElBQUt6SyxRQUFRLENBQUMwSyxNQUFNLEVBQUc7TUFDckI7TUFDQTtNQUNBO01BQ0EsTUFBTUMsY0FBYyxHQUFHRixHQUFHLENBQUNHLEtBQUssQ0FBRSxFQUFHLENBQUM7TUFDdEMsSUFBSTdDLE1BQU0sR0FBRyxFQUFFOztNQUVmO01BQ0E7TUFDQSxJQUFJOEMsbUJBQW1CLEdBQUcsS0FBSztNQUMvQixLQUFNLElBQUlqQixDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdlLGNBQWMsQ0FBQ2QsTUFBTSxFQUFFRCxDQUFDLEVBQUUsRUFBRztRQUNoRCxNQUFNa0IsSUFBSSxHQUFHSCxjQUFjLENBQUVmLENBQUMsQ0FBRTtRQUNoQyxNQUFNbUIsbUJBQW1CLEdBQUdELElBQUksS0FBSyxRQUFRLElBQUlBLElBQUksS0FBSyxRQUFRLElBQUlBLElBQUksS0FBSyxRQUFROztRQUV2RjtRQUNBO1FBQ0EsSUFBS0QsbUJBQW1CLElBQUlFLG1CQUFtQixFQUFHO1VBQ2hEaEQsTUFBTSxJQUFJLFFBQVE7UUFDcEI7UUFDQUEsTUFBTSxJQUFJK0MsSUFBSTtRQUVkRCxtQkFBbUIsR0FBR0UsbUJBQW1CO01BQzNDO01BRUEsT0FBT2hELE1BQU07SUFDZixDQUFDLE1BQ0k7TUFDSCxPQUFPMEMsR0FBRztJQUNaO0VBQ0Y7QUFDRixDQUFDO0FBRUR2SyxPQUFPLENBQUM4SyxRQUFRLENBQUUsT0FBTyxFQUFFbkssS0FBTSxDQUFDO0FBQ2xDLGVBQWVBLEtBQUsiLCJpZ25vcmVMaXN0IjpbXX0=