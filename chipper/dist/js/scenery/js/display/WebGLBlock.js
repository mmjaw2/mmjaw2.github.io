// Copyright 2013-2023, University of Colorado Boulder

/**
 * Renders a visual layer of WebGL drawables.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Sharfudeen Ashraf (For Ghent University)
 */

import TinyEmitter from '../../../axon/js/TinyEmitter.js';
import Matrix3 from '../../../dot/js/Matrix3.js';
import cleanArray from '../../../phet-core/js/cleanArray.js';
import Poolable from '../../../phet-core/js/Poolable.js';
import { FittedBlock, Renderer, scenery, ShaderProgram, SpriteSheet, Utils } from '../imports.js';
class WebGLBlock extends FittedBlock {
  /**
   * @mixes Poolable
   *
   * @param {Display} display
   * @param {number} renderer
   * @param {Instance} transformRootInstance
   * @param {Instance} filterRootInstance
   */
  constructor(display, renderer, transformRootInstance, filterRootInstance) {
    super();
    this.initialize(display, renderer, transformRootInstance, filterRootInstance);
  }

  /**
   * @public
   *
   * @param {Display} display
   * @param {number} renderer
   * @param {Instance} transformRootInstance
   * @param {Instance} filterRootInstance
   * @returns {WebGLBlock} - For chaining
   */
  initialize(display, renderer, transformRootInstance, filterRootInstance) {
    sceneryLog && sceneryLog.WebGLBlock && sceneryLog.WebGLBlock(`initialize #${this.id}`);
    sceneryLog && sceneryLog.WebGLBlock && sceneryLog.push();

    // WebGLBlocks are hard-coded to take the full display size (as opposed to svg and canvas)
    // Since we saw some jitter on iPad, see #318 and generally expect WebGL layers to span the entire display
    // In the future, it would be good to understand what was causing the problem and make webgl consistent
    // with svg and canvas again.
    super.initialize(display, renderer, transformRootInstance, FittedBlock.FULL_DISPLAY);

    // TODO: Uhh, is this not used? https://github.com/phetsims/scenery/issues/1581
    this.filterRootInstance = filterRootInstance;

    // {boolean} - Whether we pass this flag to the WebGL Context. It will store the contents displayed on the screen,
    // so that canvas.toDataURL() will work. It also requires clearing the context manually ever frame. Both incur
    // performance costs, so it should be false by default.
    // TODO: This block can be shared across displays, so we need to handle preserveDrawingBuffer separately? https://github.com/phetsims/scenery/issues/1581
    this.preserveDrawingBuffer = display._preserveDrawingBuffer;

    // list of {Drawable}s that need to be updated before we update
    this.dirtyDrawables = cleanArray(this.dirtyDrawables);

    // {Array.<SpriteSheet>}, permanent list of spritesheets for this block
    this.spriteSheets = this.spriteSheets || [];

    // Projection {Matrix3} that maps from Scenery's global coordinate frame to normalized device coordinates,
    // where x,y are both in the range [-1,1] from one side of the Canvas to the other.
    this.projectionMatrix = this.projectionMatrix || new Matrix3();

    // @private {Float32Array} - Column-major 3x3 array specifying our projection matrix for 2D points
    // (homogenized to (x,y,1))
    this.projectionMatrixArray = new Float32Array(9);

    // processor for custom WebGL drawables (e.g. WebGLNode)
    this.customProcessor = this.customProcessor || new CustomProcessor();

    // processor for drawing vertex-colored triangles (e.g. Path types)
    this.vertexColorPolygonsProcessor = this.vertexColorPolygonsProcessor || new VertexColorPolygons(this.projectionMatrixArray);

    // processor for drawing textured triangles (e.g. Image)
    this.texturedTrianglesProcessor = this.texturedTrianglesProcessor || new TexturedTrianglesProcessor(this.projectionMatrixArray);

    // @public {Emitter} - Called when the WebGL context changes to a new context.
    this.glChangedEmitter = new TinyEmitter();

    // @private {boolean}
    this.isContextLost = false;

    // @private {function}
    this.contextLostListener = this.onContextLoss.bind(this);
    this.contextRestoreListener = this.onContextRestoration.bind(this);
    if (!this.domElement) {
      // @public (scenery-internal) {HTMLCanvasElement} - Div wrapper used so we can switch out Canvases if necessary.
      this.domElement = document.createElement('div');
      this.domElement.className = 'webgl-container';
      this.domElement.style.position = 'absolute';
      this.domElement.style.left = '0';
      this.domElement.style.top = '0';
      this.rebuildCanvas();
    }

    // clear buffers when we are reinitialized
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // reset any fit transforms that were applied
    Utils.prepareForTransform(this.canvas); // Apply CSS needed for future CSS transforms to work properly.
    Utils.unsetTransform(this.canvas); // clear out any transforms that could have been previously applied

    sceneryLog && sceneryLog.WebGLBlock && sceneryLog.pop();
    return this;
  }

  /**
   * Forces a rebuild of the Canvas and its context (as long as a context can be obtained).
   * @private
   *
   * This can be necessary when the browser won't restore our context that was lost (and we need to create another
   * canvas to get a valid context).
   */
  rebuildCanvas() {
    sceneryLog && sceneryLog.WebGLBlock && sceneryLog.WebGLBlock(`rebuildCanvas #${this.id}`);
    sceneryLog && sceneryLog.WebGLBlock && sceneryLog.push();
    const canvas = document.createElement('canvas');
    const gl = this.getContextFromCanvas(canvas);

    // Don't assert-failure out if this is not our first attempt (we're testing to see if we can recreate)
    assert && assert(gl || this.canvas, 'We should have a WebGL context by now');

    // If we're aggressively trying to rebuild, we need to ignore context creation failure.
    if (gl) {
      if (this.canvas) {
        this.domElement.removeChild(this.canvas);
        this.canvas.removeEventListener('webglcontextlost', this.contextLostListener, false);
        this.canvas.removeEventListener('webglcontextrestored', this.contextRestoreListener, false);
      }

      // @private {HTMLCanvasElement}
      this.canvas = canvas;
      this.canvas.style.pointerEvents = 'none';

      // @private {number} - unique ID so that we can support rasterization with Display.foreignObjectRasterization
      this.canvasId = this.canvas.id = `scenery-webgl${this.id}`;
      this.canvas.addEventListener('webglcontextlost', this.contextLostListener, false);
      this.canvas.addEventListener('webglcontextrestored', this.contextRestoreListener, false);
      this.domElement.appendChild(this.canvas);
      this.setupContext(gl);
    }
    sceneryLog && sceneryLog.WebGLBlock && sceneryLog.pop();
  }

  /**
   * Takes a fresh WebGL context switches the WebGL block over to use it.
   * @private
   *
   * @param {WebGLRenderingContext} gl
   */
  setupContext(gl) {
    sceneryLog && sceneryLog.WebGLBlock && sceneryLog.WebGLBlock(`setupContext #${this.id}`);
    sceneryLog && sceneryLog.WebGLBlock && sceneryLog.push();
    assert && assert(gl, 'Should have an actual context if this is called');
    this.isContextLost = false;

    // @private {WebGLRenderingContext}
    this.gl = gl;

    // @private {number} - How much larger our Canvas will be compared to the CSS pixel dimensions, so that our
    // Canvas maps one of its pixels to a physical pixel (for Retina devices, etc.).
    this.backingScale = Utils.backingScale(this.gl);

    // Double the backing scale size if we detect no built-in antialiasing.
    // See https://github.com/phetsims/circuit-construction-kit-dc/issues/139 and
    // https://github.com/phetsims/scenery/issues/859.
    if (this.display._allowBackingScaleAntialiasing && gl.getParameter(gl.SAMPLES) === 0) {
      this.backingScale *= 2;
    }

    // @private {number}
    this.originalBackingScale = this.backingScale;
    Utils.applyWebGLContextDefaults(this.gl); // blending defaults, etc.

    // When the context changes, we need to force certain refreshes
    this.markDirty();
    this.dirtyFit = true; // Force re-fitting

    // Update the context references on the processors
    this.customProcessor.initializeContext(this.gl);
    this.vertexColorPolygonsProcessor.initializeContext(this.gl);
    this.texturedTrianglesProcessor.initializeContext(this.gl);

    // Notify spritesheets of the new context
    for (let i = 0; i < this.spriteSheets.length; i++) {
      this.spriteSheets[i].initializeContext(this.gl);
    }

    // Notify (e.g. WebGLNode painters need to be recreated)
    this.glChangedEmitter.emit();
    sceneryLog && sceneryLog.WebGLBlock && sceneryLog.pop();
  }

  /**
   * Attempts to force a Canvas rebuild to get a new Canvas/context pair.
   * @private
   */
  delayedRebuildCanvas() {
    sceneryLog && sceneryLog.WebGLBlock && sceneryLog.WebGLBlock(`Delaying rebuilding of Canvas #${this.id}`);
    const self = this;

    // TODO: Can we move this to before the update() step? Could happen same-frame in that case. https://github.com/phetsims/scenery/issues/1581
    // NOTE: We don't want to rely on a common timer, so we're using the built-in form on purpose.
    window.setTimeout(function () {
      // eslint-disable-line bad-sim-text
      sceneryLog && sceneryLog.WebGLBlock && sceneryLog.WebGLBlock(`Executing delayed rebuilding #${this.id}`);
      sceneryLog && sceneryLog.WebGLBlock && sceneryLog.push();
      self.rebuildCanvas();
      sceneryLog && sceneryLog.WebGLBlock && sceneryLog.pop();
    });
  }

  /**
   * Callback for whenever our WebGL context is lost.
   * @private
   *
   * @param {WebGLContextEvent} domEvent
   */
  onContextLoss(domEvent) {
    if (!this.isContextLost) {
      sceneryLog && sceneryLog.WebGLBlock && sceneryLog.WebGLBlock(`Context lost #${this.id}`);
      sceneryLog && sceneryLog.WebGLBlock && sceneryLog.push();
      this.isContextLost = true;

      // Preventing default is super-important, otherwise it never attempts to restore the context
      domEvent.preventDefault();
      this.canvas.style.display = 'none';
      this.markDirty();
      sceneryLog && sceneryLog.WebGLBlock && sceneryLog.pop();
    }
  }

  /**
   * Callback for whenever our WebGL context is restored.
   * @private
   *
   * @param {WebGLContextEvent} domEvent
   */
  onContextRestoration(domEvent) {
    if (this.isContextLost) {
      sceneryLog && sceneryLog.WebGLBlock && sceneryLog.WebGLBlock(`Context restored #${this.id}`);
      sceneryLog && sceneryLog.WebGLBlock && sceneryLog.push();
      const gl = this.getContextFromCanvas(this.canvas);
      assert && assert(gl, 'We were told the context was restored, so this should work');
      this.setupContext(gl);
      this.canvas.style.display = '';
      sceneryLog && sceneryLog.WebGLBlock && sceneryLog.pop();
    }
  }

  /**
   * Attempts to get a WebGL context from a Canvas.
   * @private
   *
   * @param {HTMLCanvasElement}
   * @returns {WebGLRenderingContext|*} - If falsy, it did not succeed.
   */
  getContextFromCanvas(canvas) {
    const contextOptions = {
      antialias: true,
      preserveDrawingBuffer: this.preserveDrawingBuffer
      // NOTE: we use premultiplied alpha since it should have better performance AND it appears to be the only one
      // truly compatible with texture filtering/interpolation.
      // See https://github.com/phetsims/energy-skate-park/issues/39, https://github.com/phetsims/scenery/issues/397
      // and https://stackoverflow.com/questions/39341564/webgl-how-to-correctly-blend-alpha-channel-png
    };

    // we've already committed to using a WebGLBlock, so no use in a try-catch around our context attempt
    return canvas.getContext('webgl', contextOptions) || canvas.getContext('experimental-webgl', contextOptions);
  }

  /**
   * @public
   * @override
   */
  setSizeFullDisplay() {
    const size = this.display.getSize();
    this.canvas.width = Math.ceil(size.width * this.backingScale);
    this.canvas.height = Math.ceil(size.height * this.backingScale);
    this.canvas.style.width = `${size.width}px`;
    this.canvas.style.height = `${size.height}px`;
  }

  /**
   * @public
   * @override
   */
  setSizeFitBounds() {
    throw new Error('setSizeFitBounds unimplemented for WebGLBlock');
  }

  /**
   * Updates the DOM appearance of this drawable (whether by preparing/calling draw calls, DOM element updates, etc.)
   * @public
   * @override
   *
   * @returns {boolean} - Whether the update should continue (if false, further updates in supertype steps should not
   *                      be done).
   */
  update() {
    // See if we need to actually update things (will bail out if we are not dirty, or if we've been disposed)
    if (!super.update()) {
      return false;
    }
    sceneryLog && sceneryLog.WebGLBlock && sceneryLog.WebGLBlock(`update #${this.id}`);
    sceneryLog && sceneryLog.WebGLBlock && sceneryLog.push();
    const gl = this.gl;
    if (this.isContextLost && this.display._aggressiveContextRecreation) {
      this.delayedRebuildCanvas();
    }

    // update drawables, so that they have vertex arrays up to date, etc.
    while (this.dirtyDrawables.length) {
      this.dirtyDrawables.pop().update();
    }

    // ensure sprite sheet textures are up-to-date
    const numSpriteSheets = this.spriteSheets.length;
    for (let i = 0; i < numSpriteSheets; i++) {
      this.spriteSheets[i].updateTexture();
    }

    // temporary hack for supporting webglScale
    if (this.firstDrawable && this.firstDrawable === this.lastDrawable && this.firstDrawable.node && this.firstDrawable.node._webglScale !== null && this.backingScale !== this.originalBackingScale * this.firstDrawable.node._webglScale) {
      this.backingScale = this.originalBackingScale * this.firstDrawable.node._webglScale;
      this.dirtyFit = true;
    }

    // udpate the fit BEFORE drawing, since it may change our offset
    this.updateFit();

    // finalX = 2 * x / display.width - 1
    // finalY = 1 - 2 * y / display.height
    // result = matrix * ( x, y, 1 )
    this.projectionMatrix.rowMajor(2 / this.display.width, 0, -1, 0, -2 / this.display.height, 1, 0, 0, 1);
    this.projectionMatrix.copyToArray(this.projectionMatrixArray);

    // if we created the context with preserveDrawingBuffer, we need to clear before rendering
    if (this.preserveDrawingBuffer) {
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.viewport(0.0, 0.0, this.canvas.width, this.canvas.height);

    // We switch between processors for drawables based on each drawable's webglRenderer property. Each processor
    // will be activated, will process a certain number of adjacent drawables with that processor's webglRenderer,
    // and then will be deactivated. This allows us to switch back-and-forth between different shader programs,
    // and allows us to trigger draw calls for each grouping of drawables in an efficient way.
    let currentProcessor = null;
    // How many draw calls have been executed. If no draw calls are executed while updating, it means nothing should
    // be drawn, and we'll have to manually clear the Canvas if we are not preserving the drawing buffer.
    let cumulativeDrawCount = 0;
    // Iterate through all of our drawables (linked list)
    //OHTWO TODO: PERFORMANCE: create an array for faster drawable iteration (this is probably a hellish memory access pattern) https://github.com/phetsims/scenery/issues/1581
    for (let drawable = this.firstDrawable; drawable !== null; drawable = drawable.nextDrawable) {
      // ignore invisible drawables
      if (drawable.visible) {
        // select our desired processor
        let desiredProcessor = null;
        if (drawable.webglRenderer === Renderer.webglTexturedTriangles) {
          desiredProcessor = this.texturedTrianglesProcessor;
        } else if (drawable.webglRenderer === Renderer.webglCustom) {
          desiredProcessor = this.customProcessor;
        } else if (drawable.webglRenderer === Renderer.webglVertexColorPolygons) {
          desiredProcessor = this.vertexColorPolygonsProcessor;
        }
        assert && assert(desiredProcessor);

        // swap processors if necessary
        if (desiredProcessor !== currentProcessor) {
          // deactivate any old processors
          if (currentProcessor) {
            cumulativeDrawCount += currentProcessor.deactivate();
          }
          // activate the new processor
          currentProcessor = desiredProcessor;
          currentProcessor.activate();
        }

        // process our current drawable with the current processor
        currentProcessor.processDrawable(drawable);
      }

      // exit loop end case
      if (drawable === this.lastDrawable) {
        break;
      }
    }
    // deactivate any processor that still has drawables that need to be handled
    if (currentProcessor) {
      cumulativeDrawCount += currentProcessor.deactivate();
    }

    // If we executed no draw calls AND we aren't preserving the drawing buffer, we'll need to manually clear the
    // drawing buffer ourself.
    if (cumulativeDrawCount === 0 && !this.preserveDrawingBuffer) {
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.flush();
    sceneryLog && sceneryLog.WebGLBlock && sceneryLog.pop();
    return true;
  }

  /**
   * Releases references
   * @public
   */
  dispose() {
    sceneryLog && sceneryLog.WebGLBlock && sceneryLog.WebGLBlock(`dispose #${this.id}`);

    // TODO: many things to dispose!? https://github.com/phetsims/scenery/issues/1581

    // clear references
    cleanArray(this.dirtyDrawables);
    super.dispose();
  }

  /**
   * @public
   *
   * @param {Drawable} drawable
   */
  markDirtyDrawable(drawable) {
    sceneryLog && sceneryLog.dirty && sceneryLog.dirty(`markDirtyDrawable on WebGLBlock#${this.id} with ${drawable.toString()}`);
    assert && assert(drawable);
    assert && assert(!drawable.isDisposed);

    // TODO: instance check to see if it is a canvas cache (usually we don't need to call update on our drawables) https://github.com/phetsims/scenery/issues/1581
    this.dirtyDrawables.push(drawable);
    this.markDirty();
  }

  /**
   * @public
   * @override
   *
   * @param {Drawable} drawable
   */
  addDrawable(drawable) {
    sceneryLog && sceneryLog.WebGLBlock && sceneryLog.WebGLBlock(`#${this.id}.addDrawable ${drawable.toString()}`);
    super.addDrawable(drawable);

    // will trigger changes to the spritesheets for images, or initialization for others
    drawable.onAddToBlock(this);
  }

  /**
   * @public
   * @override
   *
   * @param {Drawable} drawable
   */
  removeDrawable(drawable) {
    sceneryLog && sceneryLog.WebGLBlock && sceneryLog.WebGLBlock(`#${this.id}.removeDrawable ${drawable.toString()}`);

    // Ensure a removed drawable is not present in the dirtyDrawables array afterwards. Don't want to update it.
    // See https://github.com/phetsims/scenery/issues/635
    let index = 0;
    while ((index = this.dirtyDrawables.indexOf(drawable, index)) >= 0) {
      this.dirtyDrawables.splice(index, 1);
    }

    // wil trigger removal from spritesheets
    drawable.onRemoveFromBlock(this);
    super.removeDrawable(drawable);
  }

  /**
   * Ensures we have an allocated part of a SpriteSheet for this image. If a SpriteSheet already contains this image,
   * we'll just increase the reference count. Otherwise, we'll attempt to add it into one of our SpriteSheets. If
   * it doesn't fit, we'll add a new SpriteSheet and add the image to it.
   * @public
   *
   * @param {HTMLImageElement | HTMLCanvasElement} image
   * @param {number} width
   * @param {number} height
   *
   * @returns {Sprite} - Throws an error if we can't accommodate the image
   */
  addSpriteSheetImage(image, width, height) {
    let sprite = null;
    const numSpriteSheets = this.spriteSheets.length;
    // TODO: check for SpriteSheet containment first? https://github.com/phetsims/scenery/issues/1581
    for (let i = 0; i < numSpriteSheets; i++) {
      const spriteSheet = this.spriteSheets[i];
      sprite = spriteSheet.addImage(image, width, height);
      if (sprite) {
        break;
      }
    }
    if (!sprite) {
      const newSpriteSheet = new SpriteSheet(true); // use mipmaps for now?
      sprite = newSpriteSheet.addImage(image, width, height);
      newSpriteSheet.initializeContext(this.gl);
      this.spriteSheets.push(newSpriteSheet);
      if (!sprite) {
        // TODO: renderer flags should change for very large images https://github.com/phetsims/scenery/issues/1581
        throw new Error('Attempt to load image that is too large for sprite sheets');
      }
    }
    return sprite;
  }

  /**
   * Removes the reference to the sprite in our spritesheets.
   * @public
   *
   * @param {Sprite} sprite
   */
  removeSpriteSheetImage(sprite) {
    sprite.spriteSheet.removeImage(sprite.image);
  }

  /**
   * @public
   * @override
   *
   * @param {Drawable} firstDrawable
   * @param {Drawable} lastDrawable
   */
  onIntervalChange(firstDrawable, lastDrawable) {
    sceneryLog && sceneryLog.WebGLBlock && sceneryLog.WebGLBlock(`#${this.id}.onIntervalChange ${firstDrawable.toString()} to ${lastDrawable.toString()}`);
    super.onIntervalChange(firstDrawable, lastDrawable);
    this.markDirty();
  }

  /**
   * @public
   *
   * @param {Drawable} drawable
   */
  onPotentiallyMovedDrawable(drawable) {
    sceneryLog && sceneryLog.WebGLBlock && sceneryLog.WebGLBlock(`#${this.id}.onPotentiallyMovedDrawable ${drawable.toString()}`);
    sceneryLog && sceneryLog.WebGLBlock && sceneryLog.push();
    assert && assert(drawable.parentDrawable === this);
    this.markDirty();
    sceneryLog && sceneryLog.WebGLBlock && sceneryLog.pop();
  }

  /**
   * Returns a string form of this object
   * @public
   *
   * @returns {string}
   */
  toString() {
    return `WebGLBlock#${this.id}-${FittedBlock.fitString[this.fit]}`;
  }
}
scenery.register('WebGLBlock', WebGLBlock);

/**---------------------------------------------------------------------------*
 * Processors rely on the following lifecycle:
 * 1. activate()
 * 2. processDrawable() - 0 or more times
 * 3. deactivate()
 * Once deactivated, they should have executed all of the draw calls they need to make.
 *---------------------------------------------------------------------------*/
class Processor {
  /**
   * @public
   */
  activate() {}

  /**
   * Sets the WebGL context that this processor should use.
   * @public
   *
   * NOTE: This can be called multiple times on a single processor, in the case where the previous context was lost.
   *       We should not need to dispose anything from that.
   *
   * @param {WebGLRenderingContext} gl
   */
  initializeContext(gl) {}

  /**
   * @public
   *
   * @param {Drawable} drawable
   */
  processDrawable(drawable) {}

  /**
   * @public
   */
  deactivate() {}
}
class CustomProcessor extends Processor {
  constructor() {
    super();

    // @private {Drawable}
    this.drawable = null;
  }

  /**
   * @public
   * @override
   */
  activate() {
    this.drawCount = 0;
  }

  /**
   * @public
   * @override
   *
   * @param {Drawable} drawable
   */
  processDrawable(drawable) {
    assert && assert(drawable.webglRenderer === Renderer.webglCustom);
    this.drawable = drawable;
    this.draw();
  }

  /**
   * @public
   * @override
   */
  deactivate() {
    return this.drawCount;
  }

  /**
   * @private
   */
  draw() {
    if (this.drawable) {
      const count = this.drawable.draw();
      assert && assert(typeof count === 'number');
      this.drawCount += count;
      this.drawable = null;
    }
  }
}
class VertexColorPolygons extends Processor {
  /**
   * @param {Float32Array} projectionMatrixArray - Projection matrix entries
   */
  constructor(projectionMatrixArray) {
    assert && assert(projectionMatrixArray instanceof Float32Array);
    super();

    // @private {Float32Array}
    this.projectionMatrixArray = projectionMatrixArray;

    // @private {number} - Initial length of the vertex buffer. May increase as needed.
    this.lastArrayLength = 128;

    // @private {Float32Array}
    this.vertexArray = new Float32Array(this.lastArrayLength);
  }

  /**
   * Sets the WebGL context that this processor should use.
   * @public
   * @override
   *
   * NOTE: This can be called multiple times on a single processor, in the case where the previous context was lost.
   *       We should not need to dispose anything from that.
   *
   * @param {WebGLRenderingContext} gl
   */
  initializeContext(gl) {
    assert && assert(gl, 'Should be an actual context');

    // @private {WebGLRenderingContext}
    this.gl = gl;

    // @private {ShaderProgram}
    this.shaderProgram = new ShaderProgram(gl, [
    // vertex shader
    'attribute vec2 aVertex;', 'attribute vec4 aColor;', 'varying vec4 vColor;', 'uniform mat3 uProjectionMatrix;', 'void main() {', '  vColor = aColor;', '  vec3 ndc = uProjectionMatrix * vec3( aVertex, 1.0 );',
    // homogeneous map to to normalized device coordinates
    '  gl_Position = vec4( ndc.xy, 0.0, 1.0 );', '}'].join('\n'), [
    // fragment shader
    'precision mediump float;', 'varying vec4 vColor;', 'void main() {',
    // NOTE: Premultiplying alpha here is needed since we're going back to the standard blend functions.
    // See https://github.com/phetsims/energy-skate-park/issues/39, https://github.com/phetsims/scenery/issues/397
    // and https://stackoverflow.com/questions/39341564/webgl-how-to-correctly-blend-alpha-channel-png
    '  gl_FragColor = vec4( vColor.rgb * vColor.a, vColor.a );', '}'].join('\n'), {
      attributes: ['aVertex', 'aColor'],
      uniforms: ['uProjectionMatrix']
    });

    // @private {WebGLBuffer}
    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertexArray, gl.DYNAMIC_DRAW); // fully buffer at the start
  }

  /**
   * @public
   * @override
   */
  activate() {
    this.shaderProgram.use();
    this.vertexArrayIndex = 0;
    this.drawCount = 0;
  }

  /**
   * @public
   * @override
   *
   * @param {Drawable} drawable
   */
  processDrawable(drawable) {
    if (drawable.includeVertices) {
      const vertexData = drawable.vertexArray;

      // if our vertex data won't fit, keep doubling the size until it fits
      while (vertexData.length + this.vertexArrayIndex > this.vertexArray.length) {
        const newVertexArray = new Float32Array(this.vertexArray.length * 2);
        newVertexArray.set(this.vertexArray);
        this.vertexArray = newVertexArray;
      }

      // copy our vertex data into the main array
      this.vertexArray.set(vertexData, this.vertexArrayIndex);
      this.vertexArrayIndex += vertexData.length;
      this.drawCount++;
    }
  }

  /**
   * @public
   * @override
   */
  deactivate() {
    if (this.drawCount) {
      this.draw();
    }
    this.shaderProgram.unuse();
    return this.drawCount;
  }

  /**
   * @private
   */
  draw() {
    const gl = this.gl;

    // (uniform) projection transform into normalized device coordinates
    gl.uniformMatrix3fv(this.shaderProgram.uniformLocations.uProjectionMatrix, false, this.projectionMatrixArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    // if we increased in length, we need to do a full bufferData to resize it on the GPU side
    if (this.vertexArray.length > this.lastArrayLength) {
      gl.bufferData(gl.ARRAY_BUFFER, this.vertexArray, gl.DYNAMIC_DRAW); // fully buffer at the start
    }
    // otherwise do a more efficient update that only sends part of the array over
    else {
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertexArray.subarray(0, this.vertexArrayIndex));
    }
    const sizeOfFloat = Float32Array.BYTES_PER_ELEMENT;
    const stride = 6 * sizeOfFloat;
    gl.vertexAttribPointer(this.shaderProgram.attributeLocations.aVertex, 2, gl.FLOAT, false, stride, 0 * sizeOfFloat);
    gl.vertexAttribPointer(this.shaderProgram.attributeLocations.aColor, 4, gl.FLOAT, false, stride, 2 * sizeOfFloat);
    gl.drawArrays(gl.TRIANGLES, 0, this.vertexArrayIndex / 6);
    this.vertexArrayIndex = 0;
  }
}
class TexturedTrianglesProcessor extends Processor {
  /**
   * @param {Float32Array} projectionMatrixArray - Projection matrix entries
   */
  constructor(projectionMatrixArray) {
    assert && assert(projectionMatrixArray instanceof Float32Array);
    super();

    // @private {Float32Array}
    this.projectionMatrixArray = projectionMatrixArray;

    // @private {number} - Initial length of the vertex buffer. May increase as needed.
    this.lastArrayLength = 128;

    // @private {Float32Array}
    this.vertexArray = new Float32Array(this.lastArrayLength);
  }

  /**
   * Sets the WebGL context that this processor should use.
   * @public
   * @override
   *
   * NOTE: This can be called multiple times on a single processor, in the case where the previous context was lost.
   *       We should not need to dispose anything from that.
   *
   * @param {WebGLRenderingContext} gl
   */
  initializeContext(gl) {
    assert && assert(gl, 'Should be an actual context');

    // @private {WebGLRenderingContext}
    this.gl = gl;

    // @private {ShaderProgram}
    this.shaderProgram = new ShaderProgram(gl, [
    // vertex shader
    'attribute vec2 aVertex;', 'attribute vec2 aTextureCoord;', 'attribute float aAlpha;', 'varying vec2 vTextureCoord;', 'varying float vAlpha;', 'uniform mat3 uProjectionMatrix;', 'void main() {', '  vTextureCoord = aTextureCoord;', '  vAlpha = aAlpha;', '  vec3 ndc = uProjectionMatrix * vec3( aVertex, 1.0 );',
    // homogeneous map to to normalized device coordinates
    '  gl_Position = vec4( ndc.xy, 0.0, 1.0 );', '}'].join('\n'), [
    // fragment shader
    'precision mediump float;', 'varying vec2 vTextureCoord;', 'varying float vAlpha;', 'uniform sampler2D uTexture;', 'void main() {', '  vec4 color = texture2D( uTexture, vTextureCoord, -0.7 );',
    // mipmap LOD bias of -0.7 (for now)
    '  color.a *= vAlpha;', '  gl_FragColor = color;',
    // don't premultiply alpha (we are loading the textures as premultiplied already)
    '}'].join('\n'), {
      // attributes: [ 'aVertex', 'aTextureCoord' ],
      attributes: ['aVertex', 'aTextureCoord', 'aAlpha'],
      uniforms: ['uTexture', 'uProjectionMatrix']
    });

    // @private {WebGLBuffer}
    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertexArray, gl.DYNAMIC_DRAW); // fully buffer at the start
  }

  /**
   * @public
   * @override
   */
  activate() {
    this.shaderProgram.use();
    this.currentSpriteSheet = null;
    this.vertexArrayIndex = 0;
    this.drawCount = 0;
  }

  /**
   * @public
   * @override
   *
   * @param {Drawable} drawable
   */
  processDrawable(drawable) {
    // skip unloaded images or sprites
    if (!drawable.sprite) {
      return;
    }
    assert && assert(drawable.webglRenderer === Renderer.webglTexturedTriangles);
    if (this.currentSpriteSheet && drawable.sprite.spriteSheet !== this.currentSpriteSheet) {
      this.draw();
    }
    this.currentSpriteSheet = drawable.sprite.spriteSheet;
    const vertexData = drawable.vertexArray;

    // if our vertex data won't fit, keep doubling the size until it fits
    while (vertexData.length + this.vertexArrayIndex > this.vertexArray.length) {
      const newVertexArray = new Float32Array(this.vertexArray.length * 2);
      newVertexArray.set(this.vertexArray);
      this.vertexArray = newVertexArray;
    }

    // copy our vertex data into the main array
    this.vertexArray.set(vertexData, this.vertexArrayIndex);
    this.vertexArrayIndex += vertexData.length;
  }

  /**
   * @public
   * @override
   */
  deactivate() {
    if (this.currentSpriteSheet) {
      this.draw();
    }
    this.shaderProgram.unuse();
    return this.drawCount;
  }

  /**
   * @private
   */
  draw() {
    assert && assert(this.currentSpriteSheet);
    const gl = this.gl;

    // (uniform) projection transform into normalized device coordinates
    gl.uniformMatrix3fv(this.shaderProgram.uniformLocations.uProjectionMatrix, false, this.projectionMatrixArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    // if we increased in length, we need to do a full bufferData to resize it on the GPU side
    if (this.vertexArray.length > this.lastArrayLength) {
      gl.bufferData(gl.ARRAY_BUFFER, this.vertexArray, gl.DYNAMIC_DRAW); // fully buffer at the start
    }
    // otherwise do a more efficient update that only sends part of the array over
    else {
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertexArray.subarray(0, this.vertexArrayIndex));
    }
    const numComponents = 5;
    const sizeOfFloat = Float32Array.BYTES_PER_ELEMENT;
    const stride = numComponents * sizeOfFloat;
    gl.vertexAttribPointer(this.shaderProgram.attributeLocations.aVertex, 2, gl.FLOAT, false, stride, 0 * sizeOfFloat);
    gl.vertexAttribPointer(this.shaderProgram.attributeLocations.aTextureCoord, 2, gl.FLOAT, false, stride, 2 * sizeOfFloat);
    gl.vertexAttribPointer(this.shaderProgram.attributeLocations.aAlpha, 1, gl.FLOAT, false, stride, 4 * sizeOfFloat);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.currentSpriteSheet.texture);
    gl.uniform1i(this.shaderProgram.uniformLocations.uTexture, 0);
    gl.drawArrays(gl.TRIANGLES, 0, this.vertexArrayIndex / numComponents);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.drawCount++;
    this.currentSpriteSheet = null;
    this.vertexArrayIndex = 0;
  }
}
Poolable.mixInto(WebGLBlock);
export default WebGLBlock;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUaW55RW1pdHRlciIsIk1hdHJpeDMiLCJjbGVhbkFycmF5IiwiUG9vbGFibGUiLCJGaXR0ZWRCbG9jayIsIlJlbmRlcmVyIiwic2NlbmVyeSIsIlNoYWRlclByb2dyYW0iLCJTcHJpdGVTaGVldCIsIlV0aWxzIiwiV2ViR0xCbG9jayIsImNvbnN0cnVjdG9yIiwiZGlzcGxheSIsInJlbmRlcmVyIiwidHJhbnNmb3JtUm9vdEluc3RhbmNlIiwiZmlsdGVyUm9vdEluc3RhbmNlIiwiaW5pdGlhbGl6ZSIsInNjZW5lcnlMb2ciLCJpZCIsInB1c2giLCJGVUxMX0RJU1BMQVkiLCJwcmVzZXJ2ZURyYXdpbmdCdWZmZXIiLCJfcHJlc2VydmVEcmF3aW5nQnVmZmVyIiwiZGlydHlEcmF3YWJsZXMiLCJzcHJpdGVTaGVldHMiLCJwcm9qZWN0aW9uTWF0cml4IiwicHJvamVjdGlvbk1hdHJpeEFycmF5IiwiRmxvYXQzMkFycmF5IiwiY3VzdG9tUHJvY2Vzc29yIiwiQ3VzdG9tUHJvY2Vzc29yIiwidmVydGV4Q29sb3JQb2x5Z29uc1Byb2Nlc3NvciIsIlZlcnRleENvbG9yUG9seWdvbnMiLCJ0ZXh0dXJlZFRyaWFuZ2xlc1Byb2Nlc3NvciIsIlRleHR1cmVkVHJpYW5nbGVzUHJvY2Vzc29yIiwiZ2xDaGFuZ2VkRW1pdHRlciIsImlzQ29udGV4dExvc3QiLCJjb250ZXh0TG9zdExpc3RlbmVyIiwib25Db250ZXh0TG9zcyIsImJpbmQiLCJjb250ZXh0UmVzdG9yZUxpc3RlbmVyIiwib25Db250ZXh0UmVzdG9yYXRpb24iLCJkb21FbGVtZW50IiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiY2xhc3NOYW1lIiwic3R5bGUiLCJwb3NpdGlvbiIsImxlZnQiLCJ0b3AiLCJyZWJ1aWxkQ2FudmFzIiwiZ2wiLCJjbGVhciIsIkNPTE9SX0JVRkZFUl9CSVQiLCJwcmVwYXJlRm9yVHJhbnNmb3JtIiwiY2FudmFzIiwidW5zZXRUcmFuc2Zvcm0iLCJwb3AiLCJnZXRDb250ZXh0RnJvbUNhbnZhcyIsImFzc2VydCIsInJlbW92ZUNoaWxkIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsInBvaW50ZXJFdmVudHMiLCJjYW52YXNJZCIsImFkZEV2ZW50TGlzdGVuZXIiLCJhcHBlbmRDaGlsZCIsInNldHVwQ29udGV4dCIsImJhY2tpbmdTY2FsZSIsIl9hbGxvd0JhY2tpbmdTY2FsZUFudGlhbGlhc2luZyIsImdldFBhcmFtZXRlciIsIlNBTVBMRVMiLCJvcmlnaW5hbEJhY2tpbmdTY2FsZSIsImFwcGx5V2ViR0xDb250ZXh0RGVmYXVsdHMiLCJtYXJrRGlydHkiLCJkaXJ0eUZpdCIsImluaXRpYWxpemVDb250ZXh0IiwiaSIsImxlbmd0aCIsImVtaXQiLCJkZWxheWVkUmVidWlsZENhbnZhcyIsInNlbGYiLCJ3aW5kb3ciLCJzZXRUaW1lb3V0IiwiZG9tRXZlbnQiLCJwcmV2ZW50RGVmYXVsdCIsImNvbnRleHRPcHRpb25zIiwiYW50aWFsaWFzIiwiZ2V0Q29udGV4dCIsInNldFNpemVGdWxsRGlzcGxheSIsInNpemUiLCJnZXRTaXplIiwid2lkdGgiLCJNYXRoIiwiY2VpbCIsImhlaWdodCIsInNldFNpemVGaXRCb3VuZHMiLCJFcnJvciIsInVwZGF0ZSIsIl9hZ2dyZXNzaXZlQ29udGV4dFJlY3JlYXRpb24iLCJudW1TcHJpdGVTaGVldHMiLCJ1cGRhdGVUZXh0dXJlIiwiZmlyc3REcmF3YWJsZSIsImxhc3REcmF3YWJsZSIsIm5vZGUiLCJfd2ViZ2xTY2FsZSIsInVwZGF0ZUZpdCIsInJvd01ham9yIiwiY29weVRvQXJyYXkiLCJ2aWV3cG9ydCIsImN1cnJlbnRQcm9jZXNzb3IiLCJjdW11bGF0aXZlRHJhd0NvdW50IiwiZHJhd2FibGUiLCJuZXh0RHJhd2FibGUiLCJ2aXNpYmxlIiwiZGVzaXJlZFByb2Nlc3NvciIsIndlYmdsUmVuZGVyZXIiLCJ3ZWJnbFRleHR1cmVkVHJpYW5nbGVzIiwid2ViZ2xDdXN0b20iLCJ3ZWJnbFZlcnRleENvbG9yUG9seWdvbnMiLCJkZWFjdGl2YXRlIiwiYWN0aXZhdGUiLCJwcm9jZXNzRHJhd2FibGUiLCJmbHVzaCIsImRpc3Bvc2UiLCJtYXJrRGlydHlEcmF3YWJsZSIsImRpcnR5IiwidG9TdHJpbmciLCJpc0Rpc3Bvc2VkIiwiYWRkRHJhd2FibGUiLCJvbkFkZFRvQmxvY2siLCJyZW1vdmVEcmF3YWJsZSIsImluZGV4IiwiaW5kZXhPZiIsInNwbGljZSIsIm9uUmVtb3ZlRnJvbUJsb2NrIiwiYWRkU3ByaXRlU2hlZXRJbWFnZSIsImltYWdlIiwic3ByaXRlIiwic3ByaXRlU2hlZXQiLCJhZGRJbWFnZSIsIm5ld1Nwcml0ZVNoZWV0IiwicmVtb3ZlU3ByaXRlU2hlZXRJbWFnZSIsInJlbW92ZUltYWdlIiwib25JbnRlcnZhbENoYW5nZSIsIm9uUG90ZW50aWFsbHlNb3ZlZERyYXdhYmxlIiwicGFyZW50RHJhd2FibGUiLCJmaXRTdHJpbmciLCJmaXQiLCJyZWdpc3RlciIsIlByb2Nlc3NvciIsImRyYXdDb3VudCIsImRyYXciLCJjb3VudCIsImxhc3RBcnJheUxlbmd0aCIsInZlcnRleEFycmF5Iiwic2hhZGVyUHJvZ3JhbSIsImpvaW4iLCJhdHRyaWJ1dGVzIiwidW5pZm9ybXMiLCJ2ZXJ0ZXhCdWZmZXIiLCJjcmVhdGVCdWZmZXIiLCJiaW5kQnVmZmVyIiwiQVJSQVlfQlVGRkVSIiwiYnVmZmVyRGF0YSIsIkRZTkFNSUNfRFJBVyIsInVzZSIsInZlcnRleEFycmF5SW5kZXgiLCJpbmNsdWRlVmVydGljZXMiLCJ2ZXJ0ZXhEYXRhIiwibmV3VmVydGV4QXJyYXkiLCJzZXQiLCJ1bnVzZSIsInVuaWZvcm1NYXRyaXgzZnYiLCJ1bmlmb3JtTG9jYXRpb25zIiwidVByb2plY3Rpb25NYXRyaXgiLCJidWZmZXJTdWJEYXRhIiwic3ViYXJyYXkiLCJzaXplT2ZGbG9hdCIsIkJZVEVTX1BFUl9FTEVNRU5UIiwic3RyaWRlIiwidmVydGV4QXR0cmliUG9pbnRlciIsImF0dHJpYnV0ZUxvY2F0aW9ucyIsImFWZXJ0ZXgiLCJGTE9BVCIsImFDb2xvciIsImRyYXdBcnJheXMiLCJUUklBTkdMRVMiLCJjdXJyZW50U3ByaXRlU2hlZXQiLCJudW1Db21wb25lbnRzIiwiYVRleHR1cmVDb29yZCIsImFBbHBoYSIsImFjdGl2ZVRleHR1cmUiLCJURVhUVVJFMCIsImJpbmRUZXh0dXJlIiwiVEVYVFVSRV8yRCIsInRleHR1cmUiLCJ1bmlmb3JtMWkiLCJ1VGV4dHVyZSIsIm1peEludG8iXSwic291cmNlcyI6WyJXZWJHTEJsb2NrLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEzLTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFJlbmRlcnMgYSB2aXN1YWwgbGF5ZXIgb2YgV2ViR0wgZHJhd2FibGVzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgU2hhcmZ1ZGVlbiBBc2hyYWYgKEZvciBHaGVudCBVbml2ZXJzaXR5KVxyXG4gKi9cclxuXHJcbmltcG9ydCBUaW55RW1pdHRlciBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RpbnlFbWl0dGVyLmpzJztcclxuaW1wb3J0IE1hdHJpeDMgZnJvbSAnLi4vLi4vLi4vZG90L2pzL01hdHJpeDMuanMnO1xyXG5pbXBvcnQgY2xlYW5BcnJheSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvY2xlYW5BcnJheS5qcyc7XHJcbmltcG9ydCBQb29sYWJsZSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvUG9vbGFibGUuanMnO1xyXG5pbXBvcnQgeyBGaXR0ZWRCbG9jaywgUmVuZGVyZXIsIHNjZW5lcnksIFNoYWRlclByb2dyYW0sIFNwcml0ZVNoZWV0LCBVdGlscyB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5cclxuY2xhc3MgV2ViR0xCbG9jayBleHRlbmRzIEZpdHRlZEJsb2NrIHtcclxuICAvKipcclxuICAgKiBAbWl4ZXMgUG9vbGFibGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7RGlzcGxheX0gZGlzcGxheVxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByZW5kZXJlclxyXG4gICAqIEBwYXJhbSB7SW5zdGFuY2V9IHRyYW5zZm9ybVJvb3RJbnN0YW5jZVxyXG4gICAqIEBwYXJhbSB7SW5zdGFuY2V9IGZpbHRlclJvb3RJbnN0YW5jZVxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKCBkaXNwbGF5LCByZW5kZXJlciwgdHJhbnNmb3JtUm9vdEluc3RhbmNlLCBmaWx0ZXJSb290SW5zdGFuY2UgKSB7XHJcbiAgICBzdXBlcigpO1xyXG5cclxuICAgIHRoaXMuaW5pdGlhbGl6ZSggZGlzcGxheSwgcmVuZGVyZXIsIHRyYW5zZm9ybVJvb3RJbnN0YW5jZSwgZmlsdGVyUm9vdEluc3RhbmNlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0Rpc3BsYXl9IGRpc3BsYXlcclxuICAgKiBAcGFyYW0ge251bWJlcn0gcmVuZGVyZXJcclxuICAgKiBAcGFyYW0ge0luc3RhbmNlfSB0cmFuc2Zvcm1Sb290SW5zdGFuY2VcclxuICAgKiBAcGFyYW0ge0luc3RhbmNlfSBmaWx0ZXJSb290SW5zdGFuY2VcclxuICAgKiBAcmV0dXJucyB7V2ViR0xCbG9ja30gLSBGb3IgY2hhaW5pbmdcclxuICAgKi9cclxuICBpbml0aWFsaXplKCBkaXNwbGF5LCByZW5kZXJlciwgdHJhbnNmb3JtUm9vdEluc3RhbmNlLCBmaWx0ZXJSb290SW5zdGFuY2UgKSB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuV2ViR0xCbG9jayAmJiBzY2VuZXJ5TG9nLldlYkdMQmxvY2soIGBpbml0aWFsaXplICMke3RoaXMuaWR9YCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLldlYkdMQmxvY2sgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgLy8gV2ViR0xCbG9ja3MgYXJlIGhhcmQtY29kZWQgdG8gdGFrZSB0aGUgZnVsbCBkaXNwbGF5IHNpemUgKGFzIG9wcG9zZWQgdG8gc3ZnIGFuZCBjYW52YXMpXHJcbiAgICAvLyBTaW5jZSB3ZSBzYXcgc29tZSBqaXR0ZXIgb24gaVBhZCwgc2VlICMzMTggYW5kIGdlbmVyYWxseSBleHBlY3QgV2ViR0wgbGF5ZXJzIHRvIHNwYW4gdGhlIGVudGlyZSBkaXNwbGF5XHJcbiAgICAvLyBJbiB0aGUgZnV0dXJlLCBpdCB3b3VsZCBiZSBnb29kIHRvIHVuZGVyc3RhbmQgd2hhdCB3YXMgY2F1c2luZyB0aGUgcHJvYmxlbSBhbmQgbWFrZSB3ZWJnbCBjb25zaXN0ZW50XHJcbiAgICAvLyB3aXRoIHN2ZyBhbmQgY2FudmFzIGFnYWluLlxyXG4gICAgc3VwZXIuaW5pdGlhbGl6ZSggZGlzcGxheSwgcmVuZGVyZXIsIHRyYW5zZm9ybVJvb3RJbnN0YW5jZSwgRml0dGVkQmxvY2suRlVMTF9ESVNQTEFZICk7XHJcblxyXG4gICAgLy8gVE9ETzogVWhoLCBpcyB0aGlzIG5vdCB1c2VkPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgdGhpcy5maWx0ZXJSb290SW5zdGFuY2UgPSBmaWx0ZXJSb290SW5zdGFuY2U7XHJcblxyXG4gICAgLy8ge2Jvb2xlYW59IC0gV2hldGhlciB3ZSBwYXNzIHRoaXMgZmxhZyB0byB0aGUgV2ViR0wgQ29udGV4dC4gSXQgd2lsbCBzdG9yZSB0aGUgY29udGVudHMgZGlzcGxheWVkIG9uIHRoZSBzY3JlZW4sXHJcbiAgICAvLyBzbyB0aGF0IGNhbnZhcy50b0RhdGFVUkwoKSB3aWxsIHdvcmsuIEl0IGFsc28gcmVxdWlyZXMgY2xlYXJpbmcgdGhlIGNvbnRleHQgbWFudWFsbHkgZXZlciBmcmFtZS4gQm90aCBpbmN1clxyXG4gICAgLy8gcGVyZm9ybWFuY2UgY29zdHMsIHNvIGl0IHNob3VsZCBiZSBmYWxzZSBieSBkZWZhdWx0LlxyXG4gICAgLy8gVE9ETzogVGhpcyBibG9jayBjYW4gYmUgc2hhcmVkIGFjcm9zcyBkaXNwbGF5cywgc28gd2UgbmVlZCB0byBoYW5kbGUgcHJlc2VydmVEcmF3aW5nQnVmZmVyIHNlcGFyYXRlbHk/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICB0aGlzLnByZXNlcnZlRHJhd2luZ0J1ZmZlciA9IGRpc3BsYXkuX3ByZXNlcnZlRHJhd2luZ0J1ZmZlcjtcclxuXHJcbiAgICAvLyBsaXN0IG9mIHtEcmF3YWJsZX1zIHRoYXQgbmVlZCB0byBiZSB1cGRhdGVkIGJlZm9yZSB3ZSB1cGRhdGVcclxuICAgIHRoaXMuZGlydHlEcmF3YWJsZXMgPSBjbGVhbkFycmF5KCB0aGlzLmRpcnR5RHJhd2FibGVzICk7XHJcblxyXG4gICAgLy8ge0FycmF5LjxTcHJpdGVTaGVldD59LCBwZXJtYW5lbnQgbGlzdCBvZiBzcHJpdGVzaGVldHMgZm9yIHRoaXMgYmxvY2tcclxuICAgIHRoaXMuc3ByaXRlU2hlZXRzID0gdGhpcy5zcHJpdGVTaGVldHMgfHwgW107XHJcblxyXG4gICAgLy8gUHJvamVjdGlvbiB7TWF0cml4M30gdGhhdCBtYXBzIGZyb20gU2NlbmVyeSdzIGdsb2JhbCBjb29yZGluYXRlIGZyYW1lIHRvIG5vcm1hbGl6ZWQgZGV2aWNlIGNvb3JkaW5hdGVzLFxyXG4gICAgLy8gd2hlcmUgeCx5IGFyZSBib3RoIGluIHRoZSByYW5nZSBbLTEsMV0gZnJvbSBvbmUgc2lkZSBvZiB0aGUgQ2FudmFzIHRvIHRoZSBvdGhlci5cclxuICAgIHRoaXMucHJvamVjdGlvbk1hdHJpeCA9IHRoaXMucHJvamVjdGlvbk1hdHJpeCB8fCBuZXcgTWF0cml4MygpO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtGbG9hdDMyQXJyYXl9IC0gQ29sdW1uLW1ham9yIDN4MyBhcnJheSBzcGVjaWZ5aW5nIG91ciBwcm9qZWN0aW9uIG1hdHJpeCBmb3IgMkQgcG9pbnRzXHJcbiAgICAvLyAoaG9tb2dlbml6ZWQgdG8gKHgseSwxKSlcclxuICAgIHRoaXMucHJvamVjdGlvbk1hdHJpeEFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSggOSApO1xyXG5cclxuICAgIC8vIHByb2Nlc3NvciBmb3IgY3VzdG9tIFdlYkdMIGRyYXdhYmxlcyAoZS5nLiBXZWJHTE5vZGUpXHJcbiAgICB0aGlzLmN1c3RvbVByb2Nlc3NvciA9IHRoaXMuY3VzdG9tUHJvY2Vzc29yIHx8IG5ldyBDdXN0b21Qcm9jZXNzb3IoKTtcclxuXHJcbiAgICAvLyBwcm9jZXNzb3IgZm9yIGRyYXdpbmcgdmVydGV4LWNvbG9yZWQgdHJpYW5nbGVzIChlLmcuIFBhdGggdHlwZXMpXHJcbiAgICB0aGlzLnZlcnRleENvbG9yUG9seWdvbnNQcm9jZXNzb3IgPSB0aGlzLnZlcnRleENvbG9yUG9seWdvbnNQcm9jZXNzb3IgfHwgbmV3IFZlcnRleENvbG9yUG9seWdvbnMoIHRoaXMucHJvamVjdGlvbk1hdHJpeEFycmF5ICk7XHJcblxyXG4gICAgLy8gcHJvY2Vzc29yIGZvciBkcmF3aW5nIHRleHR1cmVkIHRyaWFuZ2xlcyAoZS5nLiBJbWFnZSlcclxuICAgIHRoaXMudGV4dHVyZWRUcmlhbmdsZXNQcm9jZXNzb3IgPSB0aGlzLnRleHR1cmVkVHJpYW5nbGVzUHJvY2Vzc29yIHx8IG5ldyBUZXh0dXJlZFRyaWFuZ2xlc1Byb2Nlc3NvciggdGhpcy5wcm9qZWN0aW9uTWF0cml4QXJyYXkgKTtcclxuXHJcbiAgICAvLyBAcHVibGljIHtFbWl0dGVyfSAtIENhbGxlZCB3aGVuIHRoZSBXZWJHTCBjb250ZXh0IGNoYW5nZXMgdG8gYSBuZXcgY29udGV4dC5cclxuICAgIHRoaXMuZ2xDaGFuZ2VkRW1pdHRlciA9IG5ldyBUaW55RW1pdHRlcigpO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtib29sZWFufVxyXG4gICAgdGhpcy5pc0NvbnRleHRMb3N0ID0gZmFsc2U7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge2Z1bmN0aW9ufVxyXG4gICAgdGhpcy5jb250ZXh0TG9zdExpc3RlbmVyID0gdGhpcy5vbkNvbnRleHRMb3NzLmJpbmQoIHRoaXMgKTtcclxuICAgIHRoaXMuY29udGV4dFJlc3RvcmVMaXN0ZW5lciA9IHRoaXMub25Db250ZXh0UmVzdG9yYXRpb24uYmluZCggdGhpcyApO1xyXG5cclxuICAgIGlmICggIXRoaXMuZG9tRWxlbWVudCApIHtcclxuICAgICAgLy8gQHB1YmxpYyAoc2NlbmVyeS1pbnRlcm5hbCkge0hUTUxDYW52YXNFbGVtZW50fSAtIERpdiB3cmFwcGVyIHVzZWQgc28gd2UgY2FuIHN3aXRjaCBvdXQgQ2FudmFzZXMgaWYgbmVjZXNzYXJ5LlxyXG4gICAgICB0aGlzLmRvbUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xyXG4gICAgICB0aGlzLmRvbUVsZW1lbnQuY2xhc3NOYW1lID0gJ3dlYmdsLWNvbnRhaW5lcic7XHJcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5sZWZ0ID0gJzAnO1xyXG4gICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUudG9wID0gJzAnO1xyXG5cclxuICAgICAgdGhpcy5yZWJ1aWxkQ2FudmFzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY2xlYXIgYnVmZmVycyB3aGVuIHdlIGFyZSByZWluaXRpYWxpemVkXHJcbiAgICB0aGlzLmdsLmNsZWFyKCB0aGlzLmdsLkNPTE9SX0JVRkZFUl9CSVQgKTtcclxuXHJcbiAgICAvLyByZXNldCBhbnkgZml0IHRyYW5zZm9ybXMgdGhhdCB3ZXJlIGFwcGxpZWRcclxuICAgIFV0aWxzLnByZXBhcmVGb3JUcmFuc2Zvcm0oIHRoaXMuY2FudmFzICk7IC8vIEFwcGx5IENTUyBuZWVkZWQgZm9yIGZ1dHVyZSBDU1MgdHJhbnNmb3JtcyB0byB3b3JrIHByb3Blcmx5LlxyXG4gICAgVXRpbHMudW5zZXRUcmFuc2Zvcm0oIHRoaXMuY2FudmFzICk7IC8vIGNsZWFyIG91dCBhbnkgdHJhbnNmb3JtcyB0aGF0IGNvdWxkIGhhdmUgYmVlbiBwcmV2aW91c2x5IGFwcGxpZWRcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuV2ViR0xCbG9jayAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRm9yY2VzIGEgcmVidWlsZCBvZiB0aGUgQ2FudmFzIGFuZCBpdHMgY29udGV4dCAoYXMgbG9uZyBhcyBhIGNvbnRleHQgY2FuIGJlIG9idGFpbmVkKS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogVGhpcyBjYW4gYmUgbmVjZXNzYXJ5IHdoZW4gdGhlIGJyb3dzZXIgd29uJ3QgcmVzdG9yZSBvdXIgY29udGV4dCB0aGF0IHdhcyBsb3N0IChhbmQgd2UgbmVlZCB0byBjcmVhdGUgYW5vdGhlclxyXG4gICAqIGNhbnZhcyB0byBnZXQgYSB2YWxpZCBjb250ZXh0KS5cclxuICAgKi9cclxuICByZWJ1aWxkQ2FudmFzKCkge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLldlYkdMQmxvY2sgJiYgc2NlbmVyeUxvZy5XZWJHTEJsb2NrKCBgcmVidWlsZENhbnZhcyAjJHt0aGlzLmlkfWAgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5XZWJHTEJsb2NrICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdjYW52YXMnICk7XHJcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2V0Q29udGV4dEZyb21DYW52YXMoIGNhbnZhcyApO1xyXG5cclxuICAgIC8vIERvbid0IGFzc2VydC1mYWlsdXJlIG91dCBpZiB0aGlzIGlzIG5vdCBvdXIgZmlyc3QgYXR0ZW1wdCAod2UncmUgdGVzdGluZyB0byBzZWUgaWYgd2UgY2FuIHJlY3JlYXRlKVxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggZ2wgfHwgdGhpcy5jYW52YXMsICdXZSBzaG91bGQgaGF2ZSBhIFdlYkdMIGNvbnRleHQgYnkgbm93JyApO1xyXG5cclxuICAgIC8vIElmIHdlJ3JlIGFnZ3Jlc3NpdmVseSB0cnlpbmcgdG8gcmVidWlsZCwgd2UgbmVlZCB0byBpZ25vcmUgY29udGV4dCBjcmVhdGlvbiBmYWlsdXJlLlxyXG4gICAgaWYgKCBnbCApIHtcclxuICAgICAgaWYgKCB0aGlzLmNhbnZhcyApIHtcclxuICAgICAgICB0aGlzLmRvbUVsZW1lbnQucmVtb3ZlQ2hpbGQoIHRoaXMuY2FudmFzICk7XHJcbiAgICAgICAgdGhpcy5jYW52YXMucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ3dlYmdsY29udGV4dGxvc3QnLCB0aGlzLmNvbnRleHRMb3N0TGlzdGVuZXIsIGZhbHNlICk7XHJcbiAgICAgICAgdGhpcy5jYW52YXMucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ3dlYmdsY29udGV4dHJlc3RvcmVkJywgdGhpcy5jb250ZXh0UmVzdG9yZUxpc3RlbmVyLCBmYWxzZSApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBAcHJpdmF0ZSB7SFRNTENhbnZhc0VsZW1lbnR9XHJcbiAgICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xyXG4gICAgICB0aGlzLmNhbnZhcy5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xyXG5cclxuICAgICAgLy8gQHByaXZhdGUge251bWJlcn0gLSB1bmlxdWUgSUQgc28gdGhhdCB3ZSBjYW4gc3VwcG9ydCByYXN0ZXJpemF0aW9uIHdpdGggRGlzcGxheS5mb3JlaWduT2JqZWN0UmFzdGVyaXphdGlvblxyXG4gICAgICB0aGlzLmNhbnZhc0lkID0gdGhpcy5jYW52YXMuaWQgPSBgc2NlbmVyeS13ZWJnbCR7dGhpcy5pZH1gO1xyXG5cclxuICAgICAgdGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lciggJ3dlYmdsY29udGV4dGxvc3QnLCB0aGlzLmNvbnRleHRMb3N0TGlzdGVuZXIsIGZhbHNlICk7XHJcbiAgICAgIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoICd3ZWJnbGNvbnRleHRyZXN0b3JlZCcsIHRoaXMuY29udGV4dFJlc3RvcmVMaXN0ZW5lciwgZmFsc2UgKTtcclxuXHJcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZCggdGhpcy5jYW52YXMgKTtcclxuXHJcbiAgICAgIHRoaXMuc2V0dXBDb250ZXh0KCBnbCApO1xyXG4gICAgfVxyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5XZWJHTEJsb2NrICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUYWtlcyBhIGZyZXNoIFdlYkdMIGNvbnRleHQgc3dpdGNoZXMgdGhlIFdlYkdMIGJsb2NrIG92ZXIgdG8gdXNlIGl0LlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2xcclxuICAgKi9cclxuICBzZXR1cENvbnRleHQoIGdsICkge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLldlYkdMQmxvY2sgJiYgc2NlbmVyeUxvZy5XZWJHTEJsb2NrKCBgc2V0dXBDb250ZXh0ICMke3RoaXMuaWR9YCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLldlYkdMQmxvY2sgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggZ2wsICdTaG91bGQgaGF2ZSBhbiBhY3R1YWwgY29udGV4dCBpZiB0aGlzIGlzIGNhbGxlZCcgKTtcclxuXHJcbiAgICB0aGlzLmlzQ29udGV4dExvc3QgPSBmYWxzZTtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fVxyXG4gICAgdGhpcy5nbCA9IGdsO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtudW1iZXJ9IC0gSG93IG11Y2ggbGFyZ2VyIG91ciBDYW52YXMgd2lsbCBiZSBjb21wYXJlZCB0byB0aGUgQ1NTIHBpeGVsIGRpbWVuc2lvbnMsIHNvIHRoYXQgb3VyXHJcbiAgICAvLyBDYW52YXMgbWFwcyBvbmUgb2YgaXRzIHBpeGVscyB0byBhIHBoeXNpY2FsIHBpeGVsIChmb3IgUmV0aW5hIGRldmljZXMsIGV0Yy4pLlxyXG4gICAgdGhpcy5iYWNraW5nU2NhbGUgPSBVdGlscy5iYWNraW5nU2NhbGUoIHRoaXMuZ2wgKTtcclxuXHJcbiAgICAvLyBEb3VibGUgdGhlIGJhY2tpbmcgc2NhbGUgc2l6ZSBpZiB3ZSBkZXRlY3Qgbm8gYnVpbHQtaW4gYW50aWFsaWFzaW5nLlxyXG4gICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9jaXJjdWl0LWNvbnN0cnVjdGlvbi1raXQtZGMvaXNzdWVzLzEzOSBhbmRcclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy84NTkuXHJcbiAgICBpZiAoIHRoaXMuZGlzcGxheS5fYWxsb3dCYWNraW5nU2NhbGVBbnRpYWxpYXNpbmcgJiYgZ2wuZ2V0UGFyYW1ldGVyKCBnbC5TQU1QTEVTICkgPT09IDAgKSB7XHJcbiAgICAgIHRoaXMuYmFja2luZ1NjYWxlICo9IDI7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQHByaXZhdGUge251bWJlcn1cclxuICAgIHRoaXMub3JpZ2luYWxCYWNraW5nU2NhbGUgPSB0aGlzLmJhY2tpbmdTY2FsZTtcclxuXHJcbiAgICBVdGlscy5hcHBseVdlYkdMQ29udGV4dERlZmF1bHRzKCB0aGlzLmdsICk7IC8vIGJsZW5kaW5nIGRlZmF1bHRzLCBldGMuXHJcblxyXG4gICAgLy8gV2hlbiB0aGUgY29udGV4dCBjaGFuZ2VzLCB3ZSBuZWVkIHRvIGZvcmNlIGNlcnRhaW4gcmVmcmVzaGVzXHJcbiAgICB0aGlzLm1hcmtEaXJ0eSgpO1xyXG4gICAgdGhpcy5kaXJ0eUZpdCA9IHRydWU7IC8vIEZvcmNlIHJlLWZpdHRpbmdcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIGNvbnRleHQgcmVmZXJlbmNlcyBvbiB0aGUgcHJvY2Vzc29yc1xyXG4gICAgdGhpcy5jdXN0b21Qcm9jZXNzb3IuaW5pdGlhbGl6ZUNvbnRleHQoIHRoaXMuZ2wgKTtcclxuICAgIHRoaXMudmVydGV4Q29sb3JQb2x5Z29uc1Byb2Nlc3Nvci5pbml0aWFsaXplQ29udGV4dCggdGhpcy5nbCApO1xyXG4gICAgdGhpcy50ZXh0dXJlZFRyaWFuZ2xlc1Byb2Nlc3Nvci5pbml0aWFsaXplQ29udGV4dCggdGhpcy5nbCApO1xyXG5cclxuICAgIC8vIE5vdGlmeSBzcHJpdGVzaGVldHMgb2YgdGhlIG5ldyBjb250ZXh0XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLnNwcml0ZVNoZWV0cy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgdGhpcy5zcHJpdGVTaGVldHNbIGkgXS5pbml0aWFsaXplQ29udGV4dCggdGhpcy5nbCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE5vdGlmeSAoZS5nLiBXZWJHTE5vZGUgcGFpbnRlcnMgbmVlZCB0byBiZSByZWNyZWF0ZWQpXHJcbiAgICB0aGlzLmdsQ2hhbmdlZEVtaXR0ZXIuZW1pdCgpO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5XZWJHTEJsb2NrICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBdHRlbXB0cyB0byBmb3JjZSBhIENhbnZhcyByZWJ1aWxkIHRvIGdldCBhIG5ldyBDYW52YXMvY29udGV4dCBwYWlyLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgZGVsYXllZFJlYnVpbGRDYW52YXMoKSB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuV2ViR0xCbG9jayAmJiBzY2VuZXJ5TG9nLldlYkdMQmxvY2soIGBEZWxheWluZyByZWJ1aWxkaW5nIG9mIENhbnZhcyAjJHt0aGlzLmlkfWAgKTtcclxuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIC8vIFRPRE86IENhbiB3ZSBtb3ZlIHRoaXMgdG8gYmVmb3JlIHRoZSB1cGRhdGUoKSBzdGVwPyBDb3VsZCBoYXBwZW4gc2FtZS1mcmFtZSBpbiB0aGF0IGNhc2UuIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICAvLyBOT1RFOiBXZSBkb24ndCB3YW50IHRvIHJlbHkgb24gYSBjb21tb24gdGltZXIsIHNvIHdlJ3JlIHVzaW5nIHRoZSBidWlsdC1pbiBmb3JtIG9uIHB1cnBvc2UuXHJcbiAgICB3aW5kb3cuc2V0VGltZW91dCggZnVuY3Rpb24oKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYmFkLXNpbS10ZXh0XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5XZWJHTEJsb2NrICYmIHNjZW5lcnlMb2cuV2ViR0xCbG9jayggYEV4ZWN1dGluZyBkZWxheWVkIHJlYnVpbGRpbmcgIyR7dGhpcy5pZH1gICk7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5XZWJHTEJsb2NrICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG4gICAgICBzZWxmLnJlYnVpbGRDYW52YXMoKTtcclxuICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLldlYkdMQmxvY2sgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxiYWNrIGZvciB3aGVuZXZlciBvdXIgV2ViR0wgY29udGV4dCBpcyBsb3N0LlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1dlYkdMQ29udGV4dEV2ZW50fSBkb21FdmVudFxyXG4gICAqL1xyXG4gIG9uQ29udGV4dExvc3MoIGRvbUV2ZW50ICkge1xyXG4gICAgaWYgKCAhdGhpcy5pc0NvbnRleHRMb3N0ICkge1xyXG4gICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuV2ViR0xCbG9jayAmJiBzY2VuZXJ5TG9nLldlYkdMQmxvY2soIGBDb250ZXh0IGxvc3QgIyR7dGhpcy5pZH1gICk7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5XZWJHTEJsb2NrICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgICAgdGhpcy5pc0NvbnRleHRMb3N0ID0gdHJ1ZTtcclxuXHJcbiAgICAgIC8vIFByZXZlbnRpbmcgZGVmYXVsdCBpcyBzdXBlci1pbXBvcnRhbnQsIG90aGVyd2lzZSBpdCBuZXZlciBhdHRlbXB0cyB0byByZXN0b3JlIHRoZSBjb250ZXh0XHJcbiAgICAgIGRvbUV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICB0aGlzLmNhbnZhcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG5cclxuICAgICAgdGhpcy5tYXJrRGlydHkoKTtcclxuXHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5XZWJHTEJsb2NrICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsYmFjayBmb3Igd2hlbmV2ZXIgb3VyIFdlYkdMIGNvbnRleHQgaXMgcmVzdG9yZWQuXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7V2ViR0xDb250ZXh0RXZlbnR9IGRvbUV2ZW50XHJcbiAgICovXHJcbiAgb25Db250ZXh0UmVzdG9yYXRpb24oIGRvbUV2ZW50ICkge1xyXG4gICAgaWYgKCB0aGlzLmlzQ29udGV4dExvc3QgKSB7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5XZWJHTEJsb2NrICYmIHNjZW5lcnlMb2cuV2ViR0xCbG9jayggYENvbnRleHQgcmVzdG9yZWQgIyR7dGhpcy5pZH1gICk7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5XZWJHTEJsb2NrICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgICAgY29uc3QgZ2wgPSB0aGlzLmdldENvbnRleHRGcm9tQ2FudmFzKCB0aGlzLmNhbnZhcyApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBnbCwgJ1dlIHdlcmUgdG9sZCB0aGUgY29udGV4dCB3YXMgcmVzdG9yZWQsIHNvIHRoaXMgc2hvdWxkIHdvcmsnICk7XHJcblxyXG4gICAgICB0aGlzLnNldHVwQ29udGV4dCggZ2wgKTtcclxuXHJcbiAgICAgIHRoaXMuY2FudmFzLnN0eWxlLmRpc3BsYXkgPSAnJztcclxuXHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5XZWJHTEJsb2NrICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBdHRlbXB0cyB0byBnZXQgYSBXZWJHTCBjb250ZXh0IGZyb20gYSBDYW52YXMuXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7SFRNTENhbnZhc0VsZW1lbnR9XHJcbiAgICogQHJldHVybnMge1dlYkdMUmVuZGVyaW5nQ29udGV4dHwqfSAtIElmIGZhbHN5LCBpdCBkaWQgbm90IHN1Y2NlZWQuXHJcbiAgICovXHJcbiAgZ2V0Q29udGV4dEZyb21DYW52YXMoIGNhbnZhcyApIHtcclxuICAgIGNvbnN0IGNvbnRleHRPcHRpb25zID0ge1xyXG4gICAgICBhbnRpYWxpYXM6IHRydWUsXHJcbiAgICAgIHByZXNlcnZlRHJhd2luZ0J1ZmZlcjogdGhpcy5wcmVzZXJ2ZURyYXdpbmdCdWZmZXJcclxuICAgICAgLy8gTk9URTogd2UgdXNlIHByZW11bHRpcGxpZWQgYWxwaGEgc2luY2UgaXQgc2hvdWxkIGhhdmUgYmV0dGVyIHBlcmZvcm1hbmNlIEFORCBpdCBhcHBlYXJzIHRvIGJlIHRoZSBvbmx5IG9uZVxyXG4gICAgICAvLyB0cnVseSBjb21wYXRpYmxlIHdpdGggdGV4dHVyZSBmaWx0ZXJpbmcvaW50ZXJwb2xhdGlvbi5cclxuICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9lbmVyZ3ktc2thdGUtcGFyay9pc3N1ZXMvMzksIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8zOTdcclxuICAgICAgLy8gYW5kIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM5MzQxNTY0L3dlYmdsLWhvdy10by1jb3JyZWN0bHktYmxlbmQtYWxwaGEtY2hhbm5lbC1wbmdcclxuICAgIH07XHJcblxyXG4gICAgLy8gd2UndmUgYWxyZWFkeSBjb21taXR0ZWQgdG8gdXNpbmcgYSBXZWJHTEJsb2NrLCBzbyBubyB1c2UgaW4gYSB0cnktY2F0Y2ggYXJvdW5kIG91ciBjb250ZXh0IGF0dGVtcHRcclxuICAgIHJldHVybiBjYW52YXMuZ2V0Q29udGV4dCggJ3dlYmdsJywgY29udGV4dE9wdGlvbnMgKSB8fCBjYW52YXMuZ2V0Q29udGV4dCggJ2V4cGVyaW1lbnRhbC13ZWJnbCcsIGNvbnRleHRPcHRpb25zICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICogQG92ZXJyaWRlXHJcbiAgICovXHJcbiAgc2V0U2l6ZUZ1bGxEaXNwbGF5KCkge1xyXG4gICAgY29uc3Qgc2l6ZSA9IHRoaXMuZGlzcGxheS5nZXRTaXplKCk7XHJcbiAgICB0aGlzLmNhbnZhcy53aWR0aCA9IE1hdGguY2VpbCggc2l6ZS53aWR0aCAqIHRoaXMuYmFja2luZ1NjYWxlICk7XHJcbiAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSBNYXRoLmNlaWwoIHNpemUuaGVpZ2h0ICogdGhpcy5iYWNraW5nU2NhbGUgKTtcclxuICAgIHRoaXMuY2FudmFzLnN0eWxlLndpZHRoID0gYCR7c2l6ZS53aWR0aH1weGA7XHJcbiAgICB0aGlzLmNhbnZhcy5zdHlsZS5oZWlnaHQgPSBgJHtzaXplLmhlaWdodH1weGA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICogQG92ZXJyaWRlXHJcbiAgICovXHJcbiAgc2V0U2l6ZUZpdEJvdW5kcygpIHtcclxuICAgIHRocm93IG5ldyBFcnJvciggJ3NldFNpemVGaXRCb3VuZHMgdW5pbXBsZW1lbnRlZCBmb3IgV2ViR0xCbG9jaycgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwZGF0ZXMgdGhlIERPTSBhcHBlYXJhbmNlIG9mIHRoaXMgZHJhd2FibGUgKHdoZXRoZXIgYnkgcHJlcGFyaW5nL2NhbGxpbmcgZHJhdyBjYWxscywgRE9NIGVsZW1lbnQgdXBkYXRlcywgZXRjLilcclxuICAgKiBAcHVibGljXHJcbiAgICogQG92ZXJyaWRlXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSB1cGRhdGUgc2hvdWxkIGNvbnRpbnVlIChpZiBmYWxzZSwgZnVydGhlciB1cGRhdGVzIGluIHN1cGVydHlwZSBzdGVwcyBzaG91bGQgbm90XHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgYmUgZG9uZSkuXHJcbiAgICovXHJcbiAgdXBkYXRlKCkge1xyXG4gICAgLy8gU2VlIGlmIHdlIG5lZWQgdG8gYWN0dWFsbHkgdXBkYXRlIHRoaW5ncyAod2lsbCBiYWlsIG91dCBpZiB3ZSBhcmUgbm90IGRpcnR5LCBvciBpZiB3ZSd2ZSBiZWVuIGRpc3Bvc2VkKVxyXG4gICAgaWYgKCAhc3VwZXIudXBkYXRlKCkgKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuV2ViR0xCbG9jayAmJiBzY2VuZXJ5TG9nLldlYkdMQmxvY2soIGB1cGRhdGUgIyR7dGhpcy5pZH1gICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuV2ViR0xCbG9jayAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XHJcblxyXG4gICAgaWYgKCB0aGlzLmlzQ29udGV4dExvc3QgJiYgdGhpcy5kaXNwbGF5Ll9hZ2dyZXNzaXZlQ29udGV4dFJlY3JlYXRpb24gKSB7XHJcbiAgICAgIHRoaXMuZGVsYXllZFJlYnVpbGRDYW52YXMoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyB1cGRhdGUgZHJhd2FibGVzLCBzbyB0aGF0IHRoZXkgaGF2ZSB2ZXJ0ZXggYXJyYXlzIHVwIHRvIGRhdGUsIGV0Yy5cclxuICAgIHdoaWxlICggdGhpcy5kaXJ0eURyYXdhYmxlcy5sZW5ndGggKSB7XHJcbiAgICAgIHRoaXMuZGlydHlEcmF3YWJsZXMucG9wKCkudXBkYXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZW5zdXJlIHNwcml0ZSBzaGVldCB0ZXh0dXJlcyBhcmUgdXAtdG8tZGF0ZVxyXG4gICAgY29uc3QgbnVtU3ByaXRlU2hlZXRzID0gdGhpcy5zcHJpdGVTaGVldHMubGVuZ3RoO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbnVtU3ByaXRlU2hlZXRzOyBpKysgKSB7XHJcbiAgICAgIHRoaXMuc3ByaXRlU2hlZXRzWyBpIF0udXBkYXRlVGV4dHVyZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHRlbXBvcmFyeSBoYWNrIGZvciBzdXBwb3J0aW5nIHdlYmdsU2NhbGVcclxuICAgIGlmICggdGhpcy5maXJzdERyYXdhYmxlICYmXHJcbiAgICAgICAgIHRoaXMuZmlyc3REcmF3YWJsZSA9PT0gdGhpcy5sYXN0RHJhd2FibGUgJiZcclxuICAgICAgICAgdGhpcy5maXJzdERyYXdhYmxlLm5vZGUgJiZcclxuICAgICAgICAgdGhpcy5maXJzdERyYXdhYmxlLm5vZGUuX3dlYmdsU2NhbGUgIT09IG51bGwgJiZcclxuICAgICAgICAgdGhpcy5iYWNraW5nU2NhbGUgIT09IHRoaXMub3JpZ2luYWxCYWNraW5nU2NhbGUgKiB0aGlzLmZpcnN0RHJhd2FibGUubm9kZS5fd2ViZ2xTY2FsZSApIHtcclxuICAgICAgdGhpcy5iYWNraW5nU2NhbGUgPSB0aGlzLm9yaWdpbmFsQmFja2luZ1NjYWxlICogdGhpcy5maXJzdERyYXdhYmxlLm5vZGUuX3dlYmdsU2NhbGU7XHJcbiAgICAgIHRoaXMuZGlydHlGaXQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHVkcGF0ZSB0aGUgZml0IEJFRk9SRSBkcmF3aW5nLCBzaW5jZSBpdCBtYXkgY2hhbmdlIG91ciBvZmZzZXRcclxuICAgIHRoaXMudXBkYXRlRml0KCk7XHJcblxyXG4gICAgLy8gZmluYWxYID0gMiAqIHggLyBkaXNwbGF5LndpZHRoIC0gMVxyXG4gICAgLy8gZmluYWxZID0gMSAtIDIgKiB5IC8gZGlzcGxheS5oZWlnaHRcclxuICAgIC8vIHJlc3VsdCA9IG1hdHJpeCAqICggeCwgeSwgMSApXHJcbiAgICB0aGlzLnByb2plY3Rpb25NYXRyaXgucm93TWFqb3IoXHJcbiAgICAgIDIgLyB0aGlzLmRpc3BsYXkud2lkdGgsIDAsIC0xLFxyXG4gICAgICAwLCAtMiAvIHRoaXMuZGlzcGxheS5oZWlnaHQsIDEsXHJcbiAgICAgIDAsIDAsIDEgKTtcclxuICAgIHRoaXMucHJvamVjdGlvbk1hdHJpeC5jb3B5VG9BcnJheSggdGhpcy5wcm9qZWN0aW9uTWF0cml4QXJyYXkgKTtcclxuXHJcbiAgICAvLyBpZiB3ZSBjcmVhdGVkIHRoZSBjb250ZXh0IHdpdGggcHJlc2VydmVEcmF3aW5nQnVmZmVyLCB3ZSBuZWVkIHRvIGNsZWFyIGJlZm9yZSByZW5kZXJpbmdcclxuICAgIGlmICggdGhpcy5wcmVzZXJ2ZURyYXdpbmdCdWZmZXIgKSB7XHJcbiAgICAgIGdsLmNsZWFyKCBnbC5DT0xPUl9CVUZGRVJfQklUICk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2wudmlld3BvcnQoIDAuMCwgMC4wLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0ICk7XHJcblxyXG4gICAgLy8gV2Ugc3dpdGNoIGJldHdlZW4gcHJvY2Vzc29ycyBmb3IgZHJhd2FibGVzIGJhc2VkIG9uIGVhY2ggZHJhd2FibGUncyB3ZWJnbFJlbmRlcmVyIHByb3BlcnR5LiBFYWNoIHByb2Nlc3NvclxyXG4gICAgLy8gd2lsbCBiZSBhY3RpdmF0ZWQsIHdpbGwgcHJvY2VzcyBhIGNlcnRhaW4gbnVtYmVyIG9mIGFkamFjZW50IGRyYXdhYmxlcyB3aXRoIHRoYXQgcHJvY2Vzc29yJ3Mgd2ViZ2xSZW5kZXJlcixcclxuICAgIC8vIGFuZCB0aGVuIHdpbGwgYmUgZGVhY3RpdmF0ZWQuIFRoaXMgYWxsb3dzIHVzIHRvIHN3aXRjaCBiYWNrLWFuZC1mb3J0aCBiZXR3ZWVuIGRpZmZlcmVudCBzaGFkZXIgcHJvZ3JhbXMsXHJcbiAgICAvLyBhbmQgYWxsb3dzIHVzIHRvIHRyaWdnZXIgZHJhdyBjYWxscyBmb3IgZWFjaCBncm91cGluZyBvZiBkcmF3YWJsZXMgaW4gYW4gZWZmaWNpZW50IHdheS5cclxuICAgIGxldCBjdXJyZW50UHJvY2Vzc29yID0gbnVsbDtcclxuICAgIC8vIEhvdyBtYW55IGRyYXcgY2FsbHMgaGF2ZSBiZWVuIGV4ZWN1dGVkLiBJZiBubyBkcmF3IGNhbGxzIGFyZSBleGVjdXRlZCB3aGlsZSB1cGRhdGluZywgaXQgbWVhbnMgbm90aGluZyBzaG91bGRcclxuICAgIC8vIGJlIGRyYXduLCBhbmQgd2UnbGwgaGF2ZSB0byBtYW51YWxseSBjbGVhciB0aGUgQ2FudmFzIGlmIHdlIGFyZSBub3QgcHJlc2VydmluZyB0aGUgZHJhd2luZyBidWZmZXIuXHJcbiAgICBsZXQgY3VtdWxhdGl2ZURyYXdDb3VudCA9IDA7XHJcbiAgICAvLyBJdGVyYXRlIHRocm91Z2ggYWxsIG9mIG91ciBkcmF3YWJsZXMgKGxpbmtlZCBsaXN0KVxyXG4gICAgLy9PSFRXTyBUT0RPOiBQRVJGT1JNQU5DRTogY3JlYXRlIGFuIGFycmF5IGZvciBmYXN0ZXIgZHJhd2FibGUgaXRlcmF0aW9uICh0aGlzIGlzIHByb2JhYmx5IGEgaGVsbGlzaCBtZW1vcnkgYWNjZXNzIHBhdHRlcm4pIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICBmb3IgKCBsZXQgZHJhd2FibGUgPSB0aGlzLmZpcnN0RHJhd2FibGU7IGRyYXdhYmxlICE9PSBudWxsOyBkcmF3YWJsZSA9IGRyYXdhYmxlLm5leHREcmF3YWJsZSApIHtcclxuICAgICAgLy8gaWdub3JlIGludmlzaWJsZSBkcmF3YWJsZXNcclxuICAgICAgaWYgKCBkcmF3YWJsZS52aXNpYmxlICkge1xyXG4gICAgICAgIC8vIHNlbGVjdCBvdXIgZGVzaXJlZCBwcm9jZXNzb3JcclxuICAgICAgICBsZXQgZGVzaXJlZFByb2Nlc3NvciA9IG51bGw7XHJcbiAgICAgICAgaWYgKCBkcmF3YWJsZS53ZWJnbFJlbmRlcmVyID09PSBSZW5kZXJlci53ZWJnbFRleHR1cmVkVHJpYW5nbGVzICkge1xyXG4gICAgICAgICAgZGVzaXJlZFByb2Nlc3NvciA9IHRoaXMudGV4dHVyZWRUcmlhbmdsZXNQcm9jZXNzb3I7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCBkcmF3YWJsZS53ZWJnbFJlbmRlcmVyID09PSBSZW5kZXJlci53ZWJnbEN1c3RvbSApIHtcclxuICAgICAgICAgIGRlc2lyZWRQcm9jZXNzb3IgPSB0aGlzLmN1c3RvbVByb2Nlc3NvcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIGRyYXdhYmxlLndlYmdsUmVuZGVyZXIgPT09IFJlbmRlcmVyLndlYmdsVmVydGV4Q29sb3JQb2x5Z29ucyApIHtcclxuICAgICAgICAgIGRlc2lyZWRQcm9jZXNzb3IgPSB0aGlzLnZlcnRleENvbG9yUG9seWdvbnNQcm9jZXNzb3I7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGRlc2lyZWRQcm9jZXNzb3IgKTtcclxuXHJcbiAgICAgICAgLy8gc3dhcCBwcm9jZXNzb3JzIGlmIG5lY2Vzc2FyeVxyXG4gICAgICAgIGlmICggZGVzaXJlZFByb2Nlc3NvciAhPT0gY3VycmVudFByb2Nlc3NvciApIHtcclxuICAgICAgICAgIC8vIGRlYWN0aXZhdGUgYW55IG9sZCBwcm9jZXNzb3JzXHJcbiAgICAgICAgICBpZiAoIGN1cnJlbnRQcm9jZXNzb3IgKSB7XHJcbiAgICAgICAgICAgIGN1bXVsYXRpdmVEcmF3Q291bnQgKz0gY3VycmVudFByb2Nlc3Nvci5kZWFjdGl2YXRlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBhY3RpdmF0ZSB0aGUgbmV3IHByb2Nlc3NvclxyXG4gICAgICAgICAgY3VycmVudFByb2Nlc3NvciA9IGRlc2lyZWRQcm9jZXNzb3I7XHJcbiAgICAgICAgICBjdXJyZW50UHJvY2Vzc29yLmFjdGl2YXRlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBwcm9jZXNzIG91ciBjdXJyZW50IGRyYXdhYmxlIHdpdGggdGhlIGN1cnJlbnQgcHJvY2Vzc29yXHJcbiAgICAgICAgY3VycmVudFByb2Nlc3Nvci5wcm9jZXNzRHJhd2FibGUoIGRyYXdhYmxlICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGV4aXQgbG9vcCBlbmQgY2FzZVxyXG4gICAgICBpZiAoIGRyYXdhYmxlID09PSB0aGlzLmxhc3REcmF3YWJsZSApIHsgYnJlYWs7IH1cclxuICAgIH1cclxuICAgIC8vIGRlYWN0aXZhdGUgYW55IHByb2Nlc3NvciB0aGF0IHN0aWxsIGhhcyBkcmF3YWJsZXMgdGhhdCBuZWVkIHRvIGJlIGhhbmRsZWRcclxuICAgIGlmICggY3VycmVudFByb2Nlc3NvciApIHtcclxuICAgICAgY3VtdWxhdGl2ZURyYXdDb3VudCArPSBjdXJyZW50UHJvY2Vzc29yLmRlYWN0aXZhdGUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiB3ZSBleGVjdXRlZCBubyBkcmF3IGNhbGxzIEFORCB3ZSBhcmVuJ3QgcHJlc2VydmluZyB0aGUgZHJhd2luZyBidWZmZXIsIHdlJ2xsIG5lZWQgdG8gbWFudWFsbHkgY2xlYXIgdGhlXHJcbiAgICAvLyBkcmF3aW5nIGJ1ZmZlciBvdXJzZWxmLlxyXG4gICAgaWYgKCBjdW11bGF0aXZlRHJhd0NvdW50ID09PSAwICYmICF0aGlzLnByZXNlcnZlRHJhd2luZ0J1ZmZlciApIHtcclxuICAgICAgZ2wuY2xlYXIoIGdsLkNPTE9SX0JVRkZFUl9CSVQgKTtcclxuICAgIH1cclxuXHJcbiAgICBnbC5mbHVzaCgpO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5XZWJHTEJsb2NrICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcblxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWxlYXNlcyByZWZlcmVuY2VzXHJcbiAgICogQHB1YmxpY1xyXG4gICAqL1xyXG4gIGRpc3Bvc2UoKSB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuV2ViR0xCbG9jayAmJiBzY2VuZXJ5TG9nLldlYkdMQmxvY2soIGBkaXNwb3NlICMke3RoaXMuaWR9YCApO1xyXG5cclxuICAgIC8vIFRPRE86IG1hbnkgdGhpbmdzIHRvIGRpc3Bvc2UhPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG5cclxuICAgIC8vIGNsZWFyIHJlZmVyZW5jZXNcclxuICAgIGNsZWFuQXJyYXkoIHRoaXMuZGlydHlEcmF3YWJsZXMgKTtcclxuXHJcbiAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0RyYXdhYmxlfSBkcmF3YWJsZVxyXG4gICAqL1xyXG4gIG1hcmtEaXJ0eURyYXdhYmxlKCBkcmF3YWJsZSApIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5kaXJ0eSAmJiBzY2VuZXJ5TG9nLmRpcnR5KCBgbWFya0RpcnR5RHJhd2FibGUgb24gV2ViR0xCbG9jayMke3RoaXMuaWR9IHdpdGggJHtkcmF3YWJsZS50b1N0cmluZygpfWAgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBkcmF3YWJsZSApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIWRyYXdhYmxlLmlzRGlzcG9zZWQgKTtcclxuXHJcbiAgICAvLyBUT0RPOiBpbnN0YW5jZSBjaGVjayB0byBzZWUgaWYgaXQgaXMgYSBjYW52YXMgY2FjaGUgKHVzdWFsbHkgd2UgZG9uJ3QgbmVlZCB0byBjYWxsIHVwZGF0ZSBvbiBvdXIgZHJhd2FibGVzKSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgdGhpcy5kaXJ0eURyYXdhYmxlcy5wdXNoKCBkcmF3YWJsZSApO1xyXG4gICAgdGhpcy5tYXJrRGlydHkoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKiBAb3ZlcnJpZGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7RHJhd2FibGV9IGRyYXdhYmxlXHJcbiAgICovXHJcbiAgYWRkRHJhd2FibGUoIGRyYXdhYmxlICkge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLldlYkdMQmxvY2sgJiYgc2NlbmVyeUxvZy5XZWJHTEJsb2NrKCBgIyR7dGhpcy5pZH0uYWRkRHJhd2FibGUgJHtkcmF3YWJsZS50b1N0cmluZygpfWAgKTtcclxuXHJcbiAgICBzdXBlci5hZGREcmF3YWJsZSggZHJhd2FibGUgKTtcclxuXHJcbiAgICAvLyB3aWxsIHRyaWdnZXIgY2hhbmdlcyB0byB0aGUgc3ByaXRlc2hlZXRzIGZvciBpbWFnZXMsIG9yIGluaXRpYWxpemF0aW9uIGZvciBvdGhlcnNcclxuICAgIGRyYXdhYmxlLm9uQWRkVG9CbG9jayggdGhpcyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqIEBvdmVycmlkZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtEcmF3YWJsZX0gZHJhd2FibGVcclxuICAgKi9cclxuICByZW1vdmVEcmF3YWJsZSggZHJhd2FibGUgKSB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuV2ViR0xCbG9jayAmJiBzY2VuZXJ5TG9nLldlYkdMQmxvY2soIGAjJHt0aGlzLmlkfS5yZW1vdmVEcmF3YWJsZSAke2RyYXdhYmxlLnRvU3RyaW5nKCl9YCApO1xyXG5cclxuICAgIC8vIEVuc3VyZSBhIHJlbW92ZWQgZHJhd2FibGUgaXMgbm90IHByZXNlbnQgaW4gdGhlIGRpcnR5RHJhd2FibGVzIGFycmF5IGFmdGVyd2FyZHMuIERvbid0IHdhbnQgdG8gdXBkYXRlIGl0LlxyXG4gICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy82MzVcclxuICAgIGxldCBpbmRleCA9IDA7XHJcbiAgICB3aGlsZSAoICggaW5kZXggPSB0aGlzLmRpcnR5RHJhd2FibGVzLmluZGV4T2YoIGRyYXdhYmxlLCBpbmRleCApICkgPj0gMCApIHtcclxuICAgICAgdGhpcy5kaXJ0eURyYXdhYmxlcy5zcGxpY2UoIGluZGV4LCAxICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gd2lsIHRyaWdnZXIgcmVtb3ZhbCBmcm9tIHNwcml0ZXNoZWV0c1xyXG4gICAgZHJhd2FibGUub25SZW1vdmVGcm9tQmxvY2soIHRoaXMgKTtcclxuXHJcbiAgICBzdXBlci5yZW1vdmVEcmF3YWJsZSggZHJhd2FibGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEVuc3VyZXMgd2UgaGF2ZSBhbiBhbGxvY2F0ZWQgcGFydCBvZiBhIFNwcml0ZVNoZWV0IGZvciB0aGlzIGltYWdlLiBJZiBhIFNwcml0ZVNoZWV0IGFscmVhZHkgY29udGFpbnMgdGhpcyBpbWFnZSxcclxuICAgKiB3ZSdsbCBqdXN0IGluY3JlYXNlIHRoZSByZWZlcmVuY2UgY291bnQuIE90aGVyd2lzZSwgd2UnbGwgYXR0ZW1wdCB0byBhZGQgaXQgaW50byBvbmUgb2Ygb3VyIFNwcml0ZVNoZWV0cy4gSWZcclxuICAgKiBpdCBkb2Vzbid0IGZpdCwgd2UnbGwgYWRkIGEgbmV3IFNwcml0ZVNoZWV0IGFuZCBhZGQgdGhlIGltYWdlIHRvIGl0LlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7SFRNTEltYWdlRWxlbWVudCB8IEhUTUxDYW52YXNFbGVtZW50fSBpbWFnZVxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aFxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHRcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtTcHJpdGV9IC0gVGhyb3dzIGFuIGVycm9yIGlmIHdlIGNhbid0IGFjY29tbW9kYXRlIHRoZSBpbWFnZVxyXG4gICAqL1xyXG4gIGFkZFNwcml0ZVNoZWV0SW1hZ2UoIGltYWdlLCB3aWR0aCwgaGVpZ2h0ICkge1xyXG4gICAgbGV0IHNwcml0ZSA9IG51bGw7XHJcbiAgICBjb25zdCBudW1TcHJpdGVTaGVldHMgPSB0aGlzLnNwcml0ZVNoZWV0cy5sZW5ndGg7XHJcbiAgICAvLyBUT0RPOiBjaGVjayBmb3IgU3ByaXRlU2hlZXQgY29udGFpbm1lbnQgZmlyc3Q/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBudW1TcHJpdGVTaGVldHM7IGkrKyApIHtcclxuICAgICAgY29uc3Qgc3ByaXRlU2hlZXQgPSB0aGlzLnNwcml0ZVNoZWV0c1sgaSBdO1xyXG4gICAgICBzcHJpdGUgPSBzcHJpdGVTaGVldC5hZGRJbWFnZSggaW1hZ2UsIHdpZHRoLCBoZWlnaHQgKTtcclxuICAgICAgaWYgKCBzcHJpdGUgKSB7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICggIXNwcml0ZSApIHtcclxuICAgICAgY29uc3QgbmV3U3ByaXRlU2hlZXQgPSBuZXcgU3ByaXRlU2hlZXQoIHRydWUgKTsgLy8gdXNlIG1pcG1hcHMgZm9yIG5vdz9cclxuICAgICAgc3ByaXRlID0gbmV3U3ByaXRlU2hlZXQuYWRkSW1hZ2UoIGltYWdlLCB3aWR0aCwgaGVpZ2h0ICk7XHJcbiAgICAgIG5ld1Nwcml0ZVNoZWV0LmluaXRpYWxpemVDb250ZXh0KCB0aGlzLmdsICk7XHJcbiAgICAgIHRoaXMuc3ByaXRlU2hlZXRzLnB1c2goIG5ld1Nwcml0ZVNoZWV0ICk7XHJcbiAgICAgIGlmICggIXNwcml0ZSApIHtcclxuICAgICAgICAvLyBUT0RPOiByZW5kZXJlciBmbGFncyBzaG91bGQgY2hhbmdlIGZvciB2ZXJ5IGxhcmdlIGltYWdlcyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvciggJ0F0dGVtcHQgdG8gbG9hZCBpbWFnZSB0aGF0IGlzIHRvbyBsYXJnZSBmb3Igc3ByaXRlIHNoZWV0cycgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNwcml0ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgdGhlIHJlZmVyZW5jZSB0byB0aGUgc3ByaXRlIGluIG91ciBzcHJpdGVzaGVldHMuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtTcHJpdGV9IHNwcml0ZVxyXG4gICAqL1xyXG4gIHJlbW92ZVNwcml0ZVNoZWV0SW1hZ2UoIHNwcml0ZSApIHtcclxuICAgIHNwcml0ZS5zcHJpdGVTaGVldC5yZW1vdmVJbWFnZSggc3ByaXRlLmltYWdlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICogQG92ZXJyaWRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0RyYXdhYmxlfSBmaXJzdERyYXdhYmxlXHJcbiAgICogQHBhcmFtIHtEcmF3YWJsZX0gbGFzdERyYXdhYmxlXHJcbiAgICovXHJcbiAgb25JbnRlcnZhbENoYW5nZSggZmlyc3REcmF3YWJsZSwgbGFzdERyYXdhYmxlICkge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLldlYkdMQmxvY2sgJiYgc2NlbmVyeUxvZy5XZWJHTEJsb2NrKCBgIyR7dGhpcy5pZH0ub25JbnRlcnZhbENoYW5nZSAke2ZpcnN0RHJhd2FibGUudG9TdHJpbmcoKX0gdG8gJHtsYXN0RHJhd2FibGUudG9TdHJpbmcoKX1gICk7XHJcblxyXG4gICAgc3VwZXIub25JbnRlcnZhbENoYW5nZSggZmlyc3REcmF3YWJsZSwgbGFzdERyYXdhYmxlICk7XHJcblxyXG4gICAgdGhpcy5tYXJrRGlydHkoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7RHJhd2FibGV9IGRyYXdhYmxlXHJcbiAgICovXHJcbiAgb25Qb3RlbnRpYWxseU1vdmVkRHJhd2FibGUoIGRyYXdhYmxlICkge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLldlYkdMQmxvY2sgJiYgc2NlbmVyeUxvZy5XZWJHTEJsb2NrKCBgIyR7dGhpcy5pZH0ub25Qb3RlbnRpYWxseU1vdmVkRHJhd2FibGUgJHtkcmF3YWJsZS50b1N0cmluZygpfWAgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5XZWJHTEJsb2NrICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGRyYXdhYmxlLnBhcmVudERyYXdhYmxlID09PSB0aGlzICk7XHJcblxyXG4gICAgdGhpcy5tYXJrRGlydHkoKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuV2ViR0xCbG9jayAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHN0cmluZyBmb3JtIG9mIHRoaXMgb2JqZWN0XHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgKi9cclxuICB0b1N0cmluZygpIHtcclxuICAgIHJldHVybiBgV2ViR0xCbG9jayMke3RoaXMuaWR9LSR7Rml0dGVkQmxvY2suZml0U3RyaW5nWyB0aGlzLmZpdCBdfWA7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnV2ViR0xCbG9jaycsIFdlYkdMQmxvY2sgKTtcclxuXHJcbi8qKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSpcclxuICogUHJvY2Vzc29ycyByZWx5IG9uIHRoZSBmb2xsb3dpbmcgbGlmZWN5Y2xlOlxyXG4gKiAxLiBhY3RpdmF0ZSgpXHJcbiAqIDIuIHByb2Nlc3NEcmF3YWJsZSgpIC0gMCBvciBtb3JlIHRpbWVzXHJcbiAqIDMuIGRlYWN0aXZhdGUoKVxyXG4gKiBPbmNlIGRlYWN0aXZhdGVkLCB0aGV5IHNob3VsZCBoYXZlIGV4ZWN1dGVkIGFsbCBvZiB0aGUgZHJhdyBjYWxscyB0aGV5IG5lZWQgdG8gbWFrZS5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5jbGFzcyBQcm9jZXNzb3Ige1xyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICBhY3RpdmF0ZSgpIHtcclxuXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBXZWJHTCBjb250ZXh0IHRoYXQgdGhpcyBwcm9jZXNzb3Igc2hvdWxkIHVzZS5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIGNhbiBiZSBjYWxsZWQgbXVsdGlwbGUgdGltZXMgb24gYSBzaW5nbGUgcHJvY2Vzc29yLCBpbiB0aGUgY2FzZSB3aGVyZSB0aGUgcHJldmlvdXMgY29udGV4dCB3YXMgbG9zdC5cclxuICAgKiAgICAgICBXZSBzaG91bGQgbm90IG5lZWQgdG8gZGlzcG9zZSBhbnl0aGluZyBmcm9tIHRoYXQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2xcclxuICAgKi9cclxuICBpbml0aWFsaXplQ29udGV4dCggZ2wgKSB7XHJcblxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtEcmF3YWJsZX0gZHJhd2FibGVcclxuICAgKi9cclxuICBwcm9jZXNzRHJhd2FibGUoIGRyYXdhYmxlICkge1xyXG5cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICBkZWFjdGl2YXRlKCkge1xyXG5cclxuICB9XHJcbn1cclxuXHJcbmNsYXNzIEN1c3RvbVByb2Nlc3NvciBleHRlbmRzIFByb2Nlc3NvciB7XHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICBzdXBlcigpO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtEcmF3YWJsZX1cclxuICAgIHRoaXMuZHJhd2FibGUgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqIEBvdmVycmlkZVxyXG4gICAqL1xyXG4gIGFjdGl2YXRlKCkge1xyXG4gICAgdGhpcy5kcmF3Q291bnQgPSAwO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqIEBvdmVycmlkZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtEcmF3YWJsZX0gZHJhd2FibGVcclxuICAgKi9cclxuICBwcm9jZXNzRHJhd2FibGUoIGRyYXdhYmxlICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggZHJhd2FibGUud2ViZ2xSZW5kZXJlciA9PT0gUmVuZGVyZXIud2ViZ2xDdXN0b20gKTtcclxuXHJcbiAgICB0aGlzLmRyYXdhYmxlID0gZHJhd2FibGU7XHJcbiAgICB0aGlzLmRyYXcoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKiBAb3ZlcnJpZGVcclxuICAgKi9cclxuICBkZWFjdGl2YXRlKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZHJhd0NvdW50O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBkcmF3KCkge1xyXG4gICAgaWYgKCB0aGlzLmRyYXdhYmxlICkge1xyXG4gICAgICBjb25zdCBjb3VudCA9IHRoaXMuZHJhd2FibGUuZHJhdygpO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2YgY291bnQgPT09ICdudW1iZXInICk7XHJcbiAgICAgIHRoaXMuZHJhd0NvdW50ICs9IGNvdW50O1xyXG4gICAgICB0aGlzLmRyYXdhYmxlID0gbnVsbDtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmNsYXNzIFZlcnRleENvbG9yUG9seWdvbnMgZXh0ZW5kcyBQcm9jZXNzb3Ige1xyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fSBwcm9qZWN0aW9uTWF0cml4QXJyYXkgLSBQcm9qZWN0aW9uIG1hdHJpeCBlbnRyaWVzXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoIHByb2plY3Rpb25NYXRyaXhBcnJheSApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHByb2plY3Rpb25NYXRyaXhBcnJheSBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSApO1xyXG5cclxuICAgIHN1cGVyKCk7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge0Zsb2F0MzJBcnJheX1cclxuICAgIHRoaXMucHJvamVjdGlvbk1hdHJpeEFycmF5ID0gcHJvamVjdGlvbk1hdHJpeEFycmF5O1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtudW1iZXJ9IC0gSW5pdGlhbCBsZW5ndGggb2YgdGhlIHZlcnRleCBidWZmZXIuIE1heSBpbmNyZWFzZSBhcyBuZWVkZWQuXHJcbiAgICB0aGlzLmxhc3RBcnJheUxlbmd0aCA9IDEyODtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7RmxvYXQzMkFycmF5fVxyXG4gICAgdGhpcy52ZXJ0ZXhBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoIHRoaXMubGFzdEFycmF5TGVuZ3RoICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBXZWJHTCBjb250ZXh0IHRoYXQgdGhpcyBwcm9jZXNzb3Igc2hvdWxkIHVzZS5cclxuICAgKiBAcHVibGljXHJcbiAgICogQG92ZXJyaWRlXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIGNhbiBiZSBjYWxsZWQgbXVsdGlwbGUgdGltZXMgb24gYSBzaW5nbGUgcHJvY2Vzc29yLCBpbiB0aGUgY2FzZSB3aGVyZSB0aGUgcHJldmlvdXMgY29udGV4dCB3YXMgbG9zdC5cclxuICAgKiAgICAgICBXZSBzaG91bGQgbm90IG5lZWQgdG8gZGlzcG9zZSBhbnl0aGluZyBmcm9tIHRoYXQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2xcclxuICAgKi9cclxuICBpbml0aWFsaXplQ29udGV4dCggZ2wgKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBnbCwgJ1Nob3VsZCBiZSBhbiBhY3R1YWwgY29udGV4dCcgKTtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fVxyXG4gICAgdGhpcy5nbCA9IGdsO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtTaGFkZXJQcm9ncmFtfVxyXG4gICAgdGhpcy5zaGFkZXJQcm9ncmFtID0gbmV3IFNoYWRlclByb2dyYW0oIGdsLCBbXHJcbiAgICAgIC8vIHZlcnRleCBzaGFkZXJcclxuICAgICAgJ2F0dHJpYnV0ZSB2ZWMyIGFWZXJ0ZXg7JyxcclxuICAgICAgJ2F0dHJpYnV0ZSB2ZWM0IGFDb2xvcjsnLFxyXG4gICAgICAndmFyeWluZyB2ZWM0IHZDb2xvcjsnLFxyXG4gICAgICAndW5pZm9ybSBtYXQzIHVQcm9qZWN0aW9uTWF0cml4OycsXHJcblxyXG4gICAgICAndm9pZCBtYWluKCkgeycsXHJcbiAgICAgICcgIHZDb2xvciA9IGFDb2xvcjsnLFxyXG4gICAgICAnICB2ZWMzIG5kYyA9IHVQcm9qZWN0aW9uTWF0cml4ICogdmVjMyggYVZlcnRleCwgMS4wICk7JywgLy8gaG9tb2dlbmVvdXMgbWFwIHRvIHRvIG5vcm1hbGl6ZWQgZGV2aWNlIGNvb3JkaW5hdGVzXHJcbiAgICAgICcgIGdsX1Bvc2l0aW9uID0gdmVjNCggbmRjLnh5LCAwLjAsIDEuMCApOycsXHJcbiAgICAgICd9J1xyXG4gICAgXS5qb2luKCAnXFxuJyApLCBbXHJcbiAgICAgIC8vIGZyYWdtZW50IHNoYWRlclxyXG4gICAgICAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7JyxcclxuICAgICAgJ3ZhcnlpbmcgdmVjNCB2Q29sb3I7JyxcclxuXHJcbiAgICAgICd2b2lkIG1haW4oKSB7JyxcclxuICAgICAgLy8gTk9URTogUHJlbXVsdGlwbHlpbmcgYWxwaGEgaGVyZSBpcyBuZWVkZWQgc2luY2Ugd2UncmUgZ29pbmcgYmFjayB0byB0aGUgc3RhbmRhcmQgYmxlbmQgZnVuY3Rpb25zLlxyXG4gICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2VuZXJneS1za2F0ZS1wYXJrL2lzc3Vlcy8zOSwgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzM5N1xyXG4gICAgICAvLyBhbmQgaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzkzNDE1NjQvd2ViZ2wtaG93LXRvLWNvcnJlY3RseS1ibGVuZC1hbHBoYS1jaGFubmVsLXBuZ1xyXG4gICAgICAnICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCB2Q29sb3IucmdiICogdkNvbG9yLmEsIHZDb2xvci5hICk7JyxcclxuICAgICAgJ30nXHJcbiAgICBdLmpvaW4oICdcXG4nICksIHtcclxuICAgICAgYXR0cmlidXRlczogWyAnYVZlcnRleCcsICdhQ29sb3InIF0sXHJcbiAgICAgIHVuaWZvcm1zOiBbICd1UHJvamVjdGlvbk1hdHJpeCcgXVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtXZWJHTEJ1ZmZlcn1cclxuICAgIHRoaXMudmVydGV4QnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XHJcblxyXG4gICAgZ2wuYmluZEJ1ZmZlciggZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnZlcnRleEJ1ZmZlciApO1xyXG4gICAgZ2wuYnVmZmVyRGF0YSggZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnZlcnRleEFycmF5LCBnbC5EWU5BTUlDX0RSQVcgKTsgLy8gZnVsbHkgYnVmZmVyIGF0IHRoZSBzdGFydFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqIEBvdmVycmlkZVxyXG4gICAqL1xyXG4gIGFjdGl2YXRlKCkge1xyXG4gICAgdGhpcy5zaGFkZXJQcm9ncmFtLnVzZSgpO1xyXG5cclxuICAgIHRoaXMudmVydGV4QXJyYXlJbmRleCA9IDA7XHJcbiAgICB0aGlzLmRyYXdDb3VudCA9IDA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICogQG92ZXJyaWRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0RyYXdhYmxlfSBkcmF3YWJsZVxyXG4gICAqL1xyXG4gIHByb2Nlc3NEcmF3YWJsZSggZHJhd2FibGUgKSB7XHJcbiAgICBpZiAoIGRyYXdhYmxlLmluY2x1ZGVWZXJ0aWNlcyApIHtcclxuICAgICAgY29uc3QgdmVydGV4RGF0YSA9IGRyYXdhYmxlLnZlcnRleEFycmF5O1xyXG5cclxuICAgICAgLy8gaWYgb3VyIHZlcnRleCBkYXRhIHdvbid0IGZpdCwga2VlcCBkb3VibGluZyB0aGUgc2l6ZSB1bnRpbCBpdCBmaXRzXHJcbiAgICAgIHdoaWxlICggdmVydGV4RGF0YS5sZW5ndGggKyB0aGlzLnZlcnRleEFycmF5SW5kZXggPiB0aGlzLnZlcnRleEFycmF5Lmxlbmd0aCApIHtcclxuICAgICAgICBjb25zdCBuZXdWZXJ0ZXhBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoIHRoaXMudmVydGV4QXJyYXkubGVuZ3RoICogMiApO1xyXG4gICAgICAgIG5ld1ZlcnRleEFycmF5LnNldCggdGhpcy52ZXJ0ZXhBcnJheSApO1xyXG4gICAgICAgIHRoaXMudmVydGV4QXJyYXkgPSBuZXdWZXJ0ZXhBcnJheTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gY29weSBvdXIgdmVydGV4IGRhdGEgaW50byB0aGUgbWFpbiBhcnJheVxyXG4gICAgICB0aGlzLnZlcnRleEFycmF5LnNldCggdmVydGV4RGF0YSwgdGhpcy52ZXJ0ZXhBcnJheUluZGV4ICk7XHJcbiAgICAgIHRoaXMudmVydGV4QXJyYXlJbmRleCArPSB2ZXJ0ZXhEYXRhLmxlbmd0aDtcclxuXHJcbiAgICAgIHRoaXMuZHJhd0NvdW50Kys7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICogQG92ZXJyaWRlXHJcbiAgICovXHJcbiAgZGVhY3RpdmF0ZSgpIHtcclxuICAgIGlmICggdGhpcy5kcmF3Q291bnQgKSB7XHJcbiAgICAgIHRoaXMuZHJhdygpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc2hhZGVyUHJvZ3JhbS51bnVzZSgpO1xyXG5cclxuICAgIHJldHVybiB0aGlzLmRyYXdDb3VudDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgZHJhdygpIHtcclxuICAgIGNvbnN0IGdsID0gdGhpcy5nbDtcclxuXHJcbiAgICAvLyAodW5pZm9ybSkgcHJvamVjdGlvbiB0cmFuc2Zvcm0gaW50byBub3JtYWxpemVkIGRldmljZSBjb29yZGluYXRlc1xyXG4gICAgZ2wudW5pZm9ybU1hdHJpeDNmdiggdGhpcy5zaGFkZXJQcm9ncmFtLnVuaWZvcm1Mb2NhdGlvbnMudVByb2plY3Rpb25NYXRyaXgsIGZhbHNlLCB0aGlzLnByb2plY3Rpb25NYXRyaXhBcnJheSApO1xyXG5cclxuICAgIGdsLmJpbmRCdWZmZXIoIGdsLkFSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0ZXhCdWZmZXIgKTtcclxuICAgIC8vIGlmIHdlIGluY3JlYXNlZCBpbiBsZW5ndGgsIHdlIG5lZWQgdG8gZG8gYSBmdWxsIGJ1ZmZlckRhdGEgdG8gcmVzaXplIGl0IG9uIHRoZSBHUFUgc2lkZVxyXG4gICAgaWYgKCB0aGlzLnZlcnRleEFycmF5Lmxlbmd0aCA+IHRoaXMubGFzdEFycmF5TGVuZ3RoICkge1xyXG4gICAgICBnbC5idWZmZXJEYXRhKCBnbC5BUlJBWV9CVUZGRVIsIHRoaXMudmVydGV4QXJyYXksIGdsLkRZTkFNSUNfRFJBVyApOyAvLyBmdWxseSBidWZmZXIgYXQgdGhlIHN0YXJ0XHJcbiAgICB9XHJcbiAgICAvLyBvdGhlcndpc2UgZG8gYSBtb3JlIGVmZmljaWVudCB1cGRhdGUgdGhhdCBvbmx5IHNlbmRzIHBhcnQgb2YgdGhlIGFycmF5IG92ZXJcclxuICAgIGVsc2Uge1xyXG4gICAgICBnbC5idWZmZXJTdWJEYXRhKCBnbC5BUlJBWV9CVUZGRVIsIDAsIHRoaXMudmVydGV4QXJyYXkuc3ViYXJyYXkoIDAsIHRoaXMudmVydGV4QXJyYXlJbmRleCApICk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBzaXplT2ZGbG9hdCA9IEZsb2F0MzJBcnJheS5CWVRFU19QRVJfRUxFTUVOVDtcclxuICAgIGNvbnN0IHN0cmlkZSA9IDYgKiBzaXplT2ZGbG9hdDtcclxuICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoIHRoaXMuc2hhZGVyUHJvZ3JhbS5hdHRyaWJ1dGVMb2NhdGlvbnMuYVZlcnRleCwgMiwgZ2wuRkxPQVQsIGZhbHNlLCBzdHJpZGUsIDAgKiBzaXplT2ZGbG9hdCApO1xyXG4gICAgZ2wudmVydGV4QXR0cmliUG9pbnRlciggdGhpcy5zaGFkZXJQcm9ncmFtLmF0dHJpYnV0ZUxvY2F0aW9ucy5hQ29sb3IsIDQsIGdsLkZMT0FULCBmYWxzZSwgc3RyaWRlLCAyICogc2l6ZU9mRmxvYXQgKTtcclxuXHJcbiAgICBnbC5kcmF3QXJyYXlzKCBnbC5UUklBTkdMRVMsIDAsIHRoaXMudmVydGV4QXJyYXlJbmRleCAvIDYgKTtcclxuXHJcbiAgICB0aGlzLnZlcnRleEFycmF5SW5kZXggPSAwO1xyXG4gIH1cclxufVxyXG5cclxuY2xhc3MgVGV4dHVyZWRUcmlhbmdsZXNQcm9jZXNzb3IgZXh0ZW5kcyBQcm9jZXNzb3Ige1xyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fSBwcm9qZWN0aW9uTWF0cml4QXJyYXkgLSBQcm9qZWN0aW9uIG1hdHJpeCBlbnRyaWVzXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoIHByb2plY3Rpb25NYXRyaXhBcnJheSApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHByb2plY3Rpb25NYXRyaXhBcnJheSBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSApO1xyXG5cclxuICAgIHN1cGVyKCk7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge0Zsb2F0MzJBcnJheX1cclxuICAgIHRoaXMucHJvamVjdGlvbk1hdHJpeEFycmF5ID0gcHJvamVjdGlvbk1hdHJpeEFycmF5O1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtudW1iZXJ9IC0gSW5pdGlhbCBsZW5ndGggb2YgdGhlIHZlcnRleCBidWZmZXIuIE1heSBpbmNyZWFzZSBhcyBuZWVkZWQuXHJcbiAgICB0aGlzLmxhc3RBcnJheUxlbmd0aCA9IDEyODtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7RmxvYXQzMkFycmF5fVxyXG4gICAgdGhpcy52ZXJ0ZXhBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoIHRoaXMubGFzdEFycmF5TGVuZ3RoICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBXZWJHTCBjb250ZXh0IHRoYXQgdGhpcyBwcm9jZXNzb3Igc2hvdWxkIHVzZS5cclxuICAgKiBAcHVibGljXHJcbiAgICogQG92ZXJyaWRlXHJcbiAgICpcclxuICAgKiBOT1RFOiBUaGlzIGNhbiBiZSBjYWxsZWQgbXVsdGlwbGUgdGltZXMgb24gYSBzaW5nbGUgcHJvY2Vzc29yLCBpbiB0aGUgY2FzZSB3aGVyZSB0aGUgcHJldmlvdXMgY29udGV4dCB3YXMgbG9zdC5cclxuICAgKiAgICAgICBXZSBzaG91bGQgbm90IG5lZWQgdG8gZGlzcG9zZSBhbnl0aGluZyBmcm9tIHRoYXQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2xcclxuICAgKi9cclxuICBpbml0aWFsaXplQ29udGV4dCggZ2wgKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBnbCwgJ1Nob3VsZCBiZSBhbiBhY3R1YWwgY29udGV4dCcgKTtcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fVxyXG4gICAgdGhpcy5nbCA9IGdsO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIHtTaGFkZXJQcm9ncmFtfVxyXG4gICAgdGhpcy5zaGFkZXJQcm9ncmFtID0gbmV3IFNoYWRlclByb2dyYW0oIGdsLCBbXHJcbiAgICAgIC8vIHZlcnRleCBzaGFkZXJcclxuICAgICAgJ2F0dHJpYnV0ZSB2ZWMyIGFWZXJ0ZXg7JyxcclxuICAgICAgJ2F0dHJpYnV0ZSB2ZWMyIGFUZXh0dXJlQ29vcmQ7JyxcclxuICAgICAgJ2F0dHJpYnV0ZSBmbG9hdCBhQWxwaGE7JyxcclxuICAgICAgJ3ZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkOycsXHJcbiAgICAgICd2YXJ5aW5nIGZsb2F0IHZBbHBoYTsnLFxyXG4gICAgICAndW5pZm9ybSBtYXQzIHVQcm9qZWN0aW9uTWF0cml4OycsXHJcblxyXG4gICAgICAndm9pZCBtYWluKCkgeycsXHJcbiAgICAgICcgIHZUZXh0dXJlQ29vcmQgPSBhVGV4dHVyZUNvb3JkOycsXHJcbiAgICAgICcgIHZBbHBoYSA9IGFBbHBoYTsnLFxyXG4gICAgICAnICB2ZWMzIG5kYyA9IHVQcm9qZWN0aW9uTWF0cml4ICogdmVjMyggYVZlcnRleCwgMS4wICk7JywgLy8gaG9tb2dlbmVvdXMgbWFwIHRvIHRvIG5vcm1hbGl6ZWQgZGV2aWNlIGNvb3JkaW5hdGVzXHJcbiAgICAgICcgIGdsX1Bvc2l0aW9uID0gdmVjNCggbmRjLnh5LCAwLjAsIDEuMCApOycsXHJcbiAgICAgICd9J1xyXG4gICAgXS5qb2luKCAnXFxuJyApLCBbXHJcbiAgICAgIC8vIGZyYWdtZW50IHNoYWRlclxyXG4gICAgICAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7JyxcclxuICAgICAgJ3ZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkOycsXHJcbiAgICAgICd2YXJ5aW5nIGZsb2F0IHZBbHBoYTsnLFxyXG4gICAgICAndW5pZm9ybSBzYW1wbGVyMkQgdVRleHR1cmU7JyxcclxuXHJcbiAgICAgICd2b2lkIG1haW4oKSB7JyxcclxuICAgICAgJyAgdmVjNCBjb2xvciA9IHRleHR1cmUyRCggdVRleHR1cmUsIHZUZXh0dXJlQ29vcmQsIC0wLjcgKTsnLCAvLyBtaXBtYXAgTE9EIGJpYXMgb2YgLTAuNyAoZm9yIG5vdylcclxuICAgICAgJyAgY29sb3IuYSAqPSB2QWxwaGE7JyxcclxuICAgICAgJyAgZ2xfRnJhZ0NvbG9yID0gY29sb3I7JywgLy8gZG9uJ3QgcHJlbXVsdGlwbHkgYWxwaGEgKHdlIGFyZSBsb2FkaW5nIHRoZSB0ZXh0dXJlcyBhcyBwcmVtdWx0aXBsaWVkIGFscmVhZHkpXHJcbiAgICAgICd9J1xyXG4gICAgXS5qb2luKCAnXFxuJyApLCB7XHJcbiAgICAgIC8vIGF0dHJpYnV0ZXM6IFsgJ2FWZXJ0ZXgnLCAnYVRleHR1cmVDb29yZCcgXSxcclxuICAgICAgYXR0cmlidXRlczogWyAnYVZlcnRleCcsICdhVGV4dHVyZUNvb3JkJywgJ2FBbHBoYScgXSxcclxuICAgICAgdW5pZm9ybXM6IFsgJ3VUZXh0dXJlJywgJ3VQcm9qZWN0aW9uTWF0cml4JyBdXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gQHByaXZhdGUge1dlYkdMQnVmZmVyfVxyXG4gICAgdGhpcy52ZXJ0ZXhCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcclxuXHJcbiAgICBnbC5iaW5kQnVmZmVyKCBnbC5BUlJBWV9CVUZGRVIsIHRoaXMudmVydGV4QnVmZmVyICk7XHJcbiAgICBnbC5idWZmZXJEYXRhKCBnbC5BUlJBWV9CVUZGRVIsIHRoaXMudmVydGV4QXJyYXksIGdsLkRZTkFNSUNfRFJBVyApOyAvLyBmdWxseSBidWZmZXIgYXQgdGhlIHN0YXJ0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICogQG92ZXJyaWRlXHJcbiAgICovXHJcbiAgYWN0aXZhdGUoKSB7XHJcbiAgICB0aGlzLnNoYWRlclByb2dyYW0udXNlKCk7XHJcblxyXG4gICAgdGhpcy5jdXJyZW50U3ByaXRlU2hlZXQgPSBudWxsO1xyXG4gICAgdGhpcy52ZXJ0ZXhBcnJheUluZGV4ID0gMDtcclxuICAgIHRoaXMuZHJhd0NvdW50ID0gMDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKiBAb3ZlcnJpZGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7RHJhd2FibGV9IGRyYXdhYmxlXHJcbiAgICovXHJcbiAgcHJvY2Vzc0RyYXdhYmxlKCBkcmF3YWJsZSApIHtcclxuICAgIC8vIHNraXAgdW5sb2FkZWQgaW1hZ2VzIG9yIHNwcml0ZXNcclxuICAgIGlmICggIWRyYXdhYmxlLnNwcml0ZSApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGRyYXdhYmxlLndlYmdsUmVuZGVyZXIgPT09IFJlbmRlcmVyLndlYmdsVGV4dHVyZWRUcmlhbmdsZXMgKTtcclxuICAgIGlmICggdGhpcy5jdXJyZW50U3ByaXRlU2hlZXQgJiYgZHJhd2FibGUuc3ByaXRlLnNwcml0ZVNoZWV0ICE9PSB0aGlzLmN1cnJlbnRTcHJpdGVTaGVldCApIHtcclxuICAgICAgdGhpcy5kcmF3KCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmN1cnJlbnRTcHJpdGVTaGVldCA9IGRyYXdhYmxlLnNwcml0ZS5zcHJpdGVTaGVldDtcclxuXHJcbiAgICBjb25zdCB2ZXJ0ZXhEYXRhID0gZHJhd2FibGUudmVydGV4QXJyYXk7XHJcblxyXG4gICAgLy8gaWYgb3VyIHZlcnRleCBkYXRhIHdvbid0IGZpdCwga2VlcCBkb3VibGluZyB0aGUgc2l6ZSB1bnRpbCBpdCBmaXRzXHJcbiAgICB3aGlsZSAoIHZlcnRleERhdGEubGVuZ3RoICsgdGhpcy52ZXJ0ZXhBcnJheUluZGV4ID4gdGhpcy52ZXJ0ZXhBcnJheS5sZW5ndGggKSB7XHJcbiAgICAgIGNvbnN0IG5ld1ZlcnRleEFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSggdGhpcy52ZXJ0ZXhBcnJheS5sZW5ndGggKiAyICk7XHJcbiAgICAgIG5ld1ZlcnRleEFycmF5LnNldCggdGhpcy52ZXJ0ZXhBcnJheSApO1xyXG4gICAgICB0aGlzLnZlcnRleEFycmF5ID0gbmV3VmVydGV4QXJyYXk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29weSBvdXIgdmVydGV4IGRhdGEgaW50byB0aGUgbWFpbiBhcnJheVxyXG4gICAgdGhpcy52ZXJ0ZXhBcnJheS5zZXQoIHZlcnRleERhdGEsIHRoaXMudmVydGV4QXJyYXlJbmRleCApO1xyXG4gICAgdGhpcy52ZXJ0ZXhBcnJheUluZGV4ICs9IHZlcnRleERhdGEubGVuZ3RoO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqIEBvdmVycmlkZVxyXG4gICAqL1xyXG4gIGRlYWN0aXZhdGUoKSB7XHJcbiAgICBpZiAoIHRoaXMuY3VycmVudFNwcml0ZVNoZWV0ICkge1xyXG4gICAgICB0aGlzLmRyYXcoKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnNoYWRlclByb2dyYW0udW51c2UoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5kcmF3Q291bnQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIGRyYXcoKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmN1cnJlbnRTcHJpdGVTaGVldCApO1xyXG4gICAgY29uc3QgZ2wgPSB0aGlzLmdsO1xyXG5cclxuICAgIC8vICh1bmlmb3JtKSBwcm9qZWN0aW9uIHRyYW5zZm9ybSBpbnRvIG5vcm1hbGl6ZWQgZGV2aWNlIGNvb3JkaW5hdGVzXHJcbiAgICBnbC51bmlmb3JtTWF0cml4M2Z2KCB0aGlzLnNoYWRlclByb2dyYW0udW5pZm9ybUxvY2F0aW9ucy51UHJvamVjdGlvbk1hdHJpeCwgZmFsc2UsIHRoaXMucHJvamVjdGlvbk1hdHJpeEFycmF5ICk7XHJcblxyXG4gICAgZ2wuYmluZEJ1ZmZlciggZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnZlcnRleEJ1ZmZlciApO1xyXG4gICAgLy8gaWYgd2UgaW5jcmVhc2VkIGluIGxlbmd0aCwgd2UgbmVlZCB0byBkbyBhIGZ1bGwgYnVmZmVyRGF0YSB0byByZXNpemUgaXQgb24gdGhlIEdQVSBzaWRlXHJcbiAgICBpZiAoIHRoaXMudmVydGV4QXJyYXkubGVuZ3RoID4gdGhpcy5sYXN0QXJyYXlMZW5ndGggKSB7XHJcbiAgICAgIGdsLmJ1ZmZlckRhdGEoIGdsLkFSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0ZXhBcnJheSwgZ2wuRFlOQU1JQ19EUkFXICk7IC8vIGZ1bGx5IGJ1ZmZlciBhdCB0aGUgc3RhcnRcclxuICAgIH1cclxuICAgIC8vIG90aGVyd2lzZSBkbyBhIG1vcmUgZWZmaWNpZW50IHVwZGF0ZSB0aGF0IG9ubHkgc2VuZHMgcGFydCBvZiB0aGUgYXJyYXkgb3ZlclxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGdsLmJ1ZmZlclN1YkRhdGEoIGdsLkFSUkFZX0JVRkZFUiwgMCwgdGhpcy52ZXJ0ZXhBcnJheS5zdWJhcnJheSggMCwgdGhpcy52ZXJ0ZXhBcnJheUluZGV4ICkgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBudW1Db21wb25lbnRzID0gNTtcclxuICAgIGNvbnN0IHNpemVPZkZsb2F0ID0gRmxvYXQzMkFycmF5LkJZVEVTX1BFUl9FTEVNRU5UO1xyXG4gICAgY29uc3Qgc3RyaWRlID0gbnVtQ29tcG9uZW50cyAqIHNpemVPZkZsb2F0O1xyXG4gICAgZ2wudmVydGV4QXR0cmliUG9pbnRlciggdGhpcy5zaGFkZXJQcm9ncmFtLmF0dHJpYnV0ZUxvY2F0aW9ucy5hVmVydGV4LCAyLCBnbC5GTE9BVCwgZmFsc2UsIHN0cmlkZSwgMCAqIHNpemVPZkZsb2F0ICk7XHJcbiAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKCB0aGlzLnNoYWRlclByb2dyYW0uYXR0cmlidXRlTG9jYXRpb25zLmFUZXh0dXJlQ29vcmQsIDIsIGdsLkZMT0FULCBmYWxzZSwgc3RyaWRlLCAyICogc2l6ZU9mRmxvYXQgKTtcclxuICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoIHRoaXMuc2hhZGVyUHJvZ3JhbS5hdHRyaWJ1dGVMb2NhdGlvbnMuYUFscGhhLCAxLCBnbC5GTE9BVCwgZmFsc2UsIHN0cmlkZSwgNCAqIHNpemVPZkZsb2F0ICk7XHJcblxyXG4gICAgZ2wuYWN0aXZlVGV4dHVyZSggZ2wuVEVYVFVSRTAgKTtcclxuICAgIGdsLmJpbmRUZXh0dXJlKCBnbC5URVhUVVJFXzJELCB0aGlzLmN1cnJlbnRTcHJpdGVTaGVldC50ZXh0dXJlICk7XHJcbiAgICBnbC51bmlmb3JtMWkoIHRoaXMuc2hhZGVyUHJvZ3JhbS51bmlmb3JtTG9jYXRpb25zLnVUZXh0dXJlLCAwICk7XHJcblxyXG4gICAgZ2wuZHJhd0FycmF5cyggZ2wuVFJJQU5HTEVTLCAwLCB0aGlzLnZlcnRleEFycmF5SW5kZXggLyBudW1Db21wb25lbnRzICk7XHJcblxyXG4gICAgZ2wuYmluZFRleHR1cmUoIGdsLlRFWFRVUkVfMkQsIG51bGwgKTtcclxuXHJcbiAgICB0aGlzLmRyYXdDb3VudCsrO1xyXG5cclxuICAgIHRoaXMuY3VycmVudFNwcml0ZVNoZWV0ID0gbnVsbDtcclxuICAgIHRoaXMudmVydGV4QXJyYXlJbmRleCA9IDA7XHJcbiAgfVxyXG59XHJcblxyXG5Qb29sYWJsZS5taXhJbnRvKCBXZWJHTEJsb2NrICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBXZWJHTEJsb2NrOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsV0FBVyxNQUFNLGlD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