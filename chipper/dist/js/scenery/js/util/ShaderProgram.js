// Copyright 2014-2024, University of Colorado Boulder

/**
 * Abstraction over the shader program
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import optionize from '../../../phet-core/js/optionize.js';
import { scenery, Utils } from '../imports.js';
export default class ShaderProgram {
  // store parameters so that we can recreate the shader program on context loss

  // whether they are enabled

  constructor(gl, vertexSource, fragmentSource, providedOptions) {
    const options = optionize()({
      attributes: [],
      uniforms: []
    }, providedOptions);
    this.vertexSource = vertexSource;
    this.fragmentSource = fragmentSource;
    this.attributeNames = options.attributes;
    this.uniformNames = options.uniforms;
    this.initialize(gl);
  }

  /**
   * Initializes (or reinitializes) the WebGL state and uniform/attribute references.
   */
  initialize(gl) {
    this.gl = gl; // TODO: create them with separate contexts https://github.com/phetsims/scenery/issues/1581

    this.used = false;
    this.program = this.gl.createProgram();
    this.vertexShader = Utils.createShader(this.gl, this.vertexSource, this.gl.VERTEX_SHADER);
    this.fragmentShader = Utils.createShader(this.gl, this.fragmentSource, this.gl.FRAGMENT_SHADER);
    this.gl.attachShader(this.program, this.vertexShader);
    this.gl.attachShader(this.program, this.fragmentShader);
    this.gl.linkProgram(this.program);
    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.log('GLSL link error:');
      console.log(this.gl.getProgramInfoLog(this.program));
      console.log('for vertex shader');
      console.log(this.vertexSource);
      console.log('for fragment shader');
      console.log(this.fragmentSource);

      // Normally it would be best to throw an exception here, but a context loss could cause the shader parameter check
      // to fail, and we must handle context loss gracefully between any adjacent pair of gl calls.
      // Therefore, we simply report the errors to the console.  See #279
    }

    // clean these up, they aren't needed after the link
    this.gl.deleteShader(this.vertexShader);
    this.gl.deleteShader(this.fragmentShader);

    // {Object}
    this.uniformLocations = {}; // map name => uniform location for program
    this.attributeLocations = {}; // map name => attribute location for program
    this.activeAttributes = {}; // map name => boolean (enabled)

    _.each(this.attributeNames, attributeName => {
      this.attributeLocations[attributeName] = this.gl.getAttribLocation(this.program, attributeName);
      this.activeAttributes[attributeName] = true; // default to enabled
    });
    _.each(this.uniformNames, uniformName => {
      this.uniformLocations[uniformName] = this.gl.getUniformLocation(this.program, uniformName);
    });
    this.isInitialized = true;
  }

  /**
   */
  use() {
    if (this.used) {
      return;
    }
    this.used = true;
    this.gl.useProgram(this.program);

    // enable the active attributes
    _.each(this.attributeNames, attributeName => {
      if (this.activeAttributes[attributeName]) {
        this.enableVertexAttribArray(attributeName);
      }
    });
  }
  activateAttribute(attributeName) {
    // guarded so we don't enable twice
    if (!this.activeAttributes[attributeName]) {
      this.activeAttributes[attributeName] = true;
      if (this.used) {
        this.enableVertexAttribArray(attributeName);
      }
    }
  }
  enableVertexAttribArray(attributeName) {
    this.gl.enableVertexAttribArray(this.attributeLocations[attributeName]);
  }
  unuse() {
    if (!this.used) {
      return;
    }
    this.used = false;
    _.each(this.attributeNames, attributeName => {
      if (this.activeAttributes[attributeName]) {
        this.disableVertexAttribArray(attributeName);
      }
    });
  }
  disableVertexAttribArray(attributeName) {
    this.gl.disableVertexAttribArray(this.attributeLocations[attributeName]);
  }
  deactivateAttribute(attributeName) {
    // guarded so we don't disable twice
    if (this.activeAttributes[attributeName]) {
      this.activeAttributes[attributeName] = false;
      if (this.used) {
        this.disableVertexAttribArray(attributeName);
      }
    }
  }

  /**
   * Releases references
   */
  dispose() {
    this.gl.deleteProgram(this.program);
  }
}
scenery.register('ShaderProgram', ShaderProgram);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJvcHRpb25pemUiLCJzY2VuZXJ5IiwiVXRpbHMiLCJTaGFkZXJQcm9ncmFtIiwiY29uc3RydWN0b3IiLCJnbCIsInZlcnRleFNvdXJjZSIsImZyYWdtZW50U291cmNlIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsImF0dHJpYnV0ZXMiLCJ1bmlmb3JtcyIsImF0dHJpYnV0ZU5hbWVzIiwidW5pZm9ybU5hbWVzIiwiaW5pdGlhbGl6ZSIsInVzZWQiLCJwcm9ncmFtIiwiY3JlYXRlUHJvZ3JhbSIsInZlcnRleFNoYWRlciIsImNyZWF0ZVNoYWRlciIsIlZFUlRFWF9TSEFERVIiLCJmcmFnbWVudFNoYWRlciIsIkZSQUdNRU5UX1NIQURFUiIsImF0dGFjaFNoYWRlciIsImxpbmtQcm9ncmFtIiwiZ2V0UHJvZ3JhbVBhcmFtZXRlciIsIkxJTktfU1RBVFVTIiwiY29uc29sZSIsImxvZyIsImdldFByb2dyYW1JbmZvTG9nIiwiZGVsZXRlU2hhZGVyIiwidW5pZm9ybUxvY2F0aW9ucyIsImF0dHJpYnV0ZUxvY2F0aW9ucyIsImFjdGl2ZUF0dHJpYnV0ZXMiLCJfIiwiZWFjaCIsImF0dHJpYnV0ZU5hbWUiLCJnZXRBdHRyaWJMb2NhdGlvbiIsInVuaWZvcm1OYW1lIiwiZ2V0VW5pZm9ybUxvY2F0aW9uIiwiaXNJbml0aWFsaXplZCIsInVzZSIsInVzZVByb2dyYW0iLCJlbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSIsImFjdGl2YXRlQXR0cmlidXRlIiwidW51c2UiLCJkaXNhYmxlVmVydGV4QXR0cmliQXJyYXkiLCJkZWFjdGl2YXRlQXR0cmlidXRlIiwiZGlzcG9zZSIsImRlbGV0ZVByb2dyYW0iLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlNoYWRlclByb2dyYW0udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTQtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQWJzdHJhY3Rpb24gb3ZlciB0aGUgc2hhZGVyIHByb2dyYW1cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCB7IHNjZW5lcnksIFV0aWxzIH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcblxyXG5leHBvcnQgdHlwZSBTaGFkZXJQcm9ncmFtT3B0aW9ucyA9IHtcclxuICAvLyAodmVydGV4KSBhdHRyaWJ1dGUgbmFtZXMgaW4gdGhlIHNoYWRlciBzb3VyY2VcclxuICBhdHRyaWJ1dGVzPzogc3RyaW5nW107XHJcblxyXG4gIC8vIHVuaWZvcm0gbmFtZXMgaW4gdGhlIHNoYWRlciBzb3VyY2VcclxuICB1bmlmb3Jtcz86IHN0cmluZ1tdO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2hhZGVyUHJvZ3JhbSB7XHJcblxyXG4gIC8vIHN0b3JlIHBhcmFtZXRlcnMgc28gdGhhdCB3ZSBjYW4gcmVjcmVhdGUgdGhlIHNoYWRlciBwcm9ncmFtIG9uIGNvbnRleHQgbG9zc1xyXG4gIHByaXZhdGUgdmVydGV4U291cmNlOiBzdHJpbmc7XHJcbiAgcHJpdmF0ZSBmcmFnbWVudFNvdXJjZTogc3RyaW5nO1xyXG4gIHByaXZhdGUgYXR0cmlidXRlTmFtZXM6IHN0cmluZ1tdO1xyXG4gIHByaXZhdGUgdW5pZm9ybU5hbWVzOiBzdHJpbmdbXTtcclxuXHJcbiAgcHJpdmF0ZSBnbCE6IFdlYkdMUmVuZGVyaW5nQ29udGV4dDtcclxuICBwcml2YXRlIHVzZWQhOiBib29sZWFuO1xyXG4gIHByaXZhdGUgcHJvZ3JhbSE6IFdlYkdMUHJvZ3JhbTtcclxuICBwcml2YXRlIHZlcnRleFNoYWRlciE6IFdlYkdMU2hhZGVyO1xyXG4gIHByaXZhdGUgZnJhZ21lbnRTaGFkZXIhOiBXZWJHTFNoYWRlcjtcclxuXHJcbiAgcHVibGljIHVuaWZvcm1Mb2NhdGlvbnMhOiBSZWNvcmQ8c3RyaW5nLCBXZWJHTFVuaWZvcm1Mb2NhdGlvbj47XHJcbiAgcHVibGljIGF0dHJpYnV0ZUxvY2F0aW9ucyE6IFJlY29yZDxzdHJpbmcsIG51bWJlcj47XHJcbiAgcHVibGljIGFjdGl2ZUF0dHJpYnV0ZXMhOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPjsgLy8gd2hldGhlciB0aGV5IGFyZSBlbmFibGVkXHJcblxyXG4gIHByaXZhdGUgaXNJbml0aWFsaXplZCE6IGJvb2xlYW47XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggZ2w6IFdlYkdMUmVuZGVyaW5nQ29udGV4dCwgdmVydGV4U291cmNlOiBzdHJpbmcsIGZyYWdtZW50U291cmNlOiBzdHJpbmcsIHByb3ZpZGVkT3B0aW9ucz86IFNoYWRlclByb2dyYW1PcHRpb25zICkge1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxTaGFkZXJQcm9ncmFtT3B0aW9ucz4oKSgge1xyXG4gICAgICBhdHRyaWJ1dGVzOiBbXSxcclxuICAgICAgdW5pZm9ybXM6IFtdXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICB0aGlzLnZlcnRleFNvdXJjZSA9IHZlcnRleFNvdXJjZTtcclxuICAgIHRoaXMuZnJhZ21lbnRTb3VyY2UgPSBmcmFnbWVudFNvdXJjZTtcclxuICAgIHRoaXMuYXR0cmlidXRlTmFtZXMgPSBvcHRpb25zLmF0dHJpYnV0ZXM7XHJcbiAgICB0aGlzLnVuaWZvcm1OYW1lcyA9IG9wdGlvbnMudW5pZm9ybXM7XHJcblxyXG4gICAgdGhpcy5pbml0aWFsaXplKCBnbCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgKG9yIHJlaW5pdGlhbGl6ZXMpIHRoZSBXZWJHTCBzdGF0ZSBhbmQgdW5pZm9ybS9hdHRyaWJ1dGUgcmVmZXJlbmNlcy5cclxuICAgKi9cclxuICBwdWJsaWMgaW5pdGlhbGl6ZSggZ2w6IFdlYkdMUmVuZGVyaW5nQ29udGV4dCApOiB2b2lkIHtcclxuXHJcbiAgICB0aGlzLmdsID0gZ2w7IC8vIFRPRE86IGNyZWF0ZSB0aGVtIHdpdGggc2VwYXJhdGUgY29udGV4dHMgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuXHJcbiAgICB0aGlzLnVzZWQgPSBmYWxzZTtcclxuXHJcbiAgICB0aGlzLnByb2dyYW0gPSB0aGlzLmdsLmNyZWF0ZVByb2dyYW0oKSE7XHJcblxyXG4gICAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSBVdGlscy5jcmVhdGVTaGFkZXIoIHRoaXMuZ2wsIHRoaXMudmVydGV4U291cmNlLCB0aGlzLmdsLlZFUlRFWF9TSEFERVIgKTtcclxuICAgIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSBVdGlscy5jcmVhdGVTaGFkZXIoIHRoaXMuZ2wsIHRoaXMuZnJhZ21lbnRTb3VyY2UsIHRoaXMuZ2wuRlJBR01FTlRfU0hBREVSICk7XHJcblxyXG4gICAgdGhpcy5nbC5hdHRhY2hTaGFkZXIoIHRoaXMucHJvZ3JhbSwgdGhpcy52ZXJ0ZXhTaGFkZXIgKTtcclxuICAgIHRoaXMuZ2wuYXR0YWNoU2hhZGVyKCB0aGlzLnByb2dyYW0sIHRoaXMuZnJhZ21lbnRTaGFkZXIgKTtcclxuXHJcbiAgICB0aGlzLmdsLmxpbmtQcm9ncmFtKCB0aGlzLnByb2dyYW0gKTtcclxuXHJcbiAgICBpZiAoICF0aGlzLmdsLmdldFByb2dyYW1QYXJhbWV0ZXIoIHRoaXMucHJvZ3JhbSwgdGhpcy5nbC5MSU5LX1NUQVRVUyApICkge1xyXG4gICAgICBjb25zb2xlLmxvZyggJ0dMU0wgbGluayBlcnJvcjonICk7XHJcbiAgICAgIGNvbnNvbGUubG9nKCB0aGlzLmdsLmdldFByb2dyYW1JbmZvTG9nKCB0aGlzLnByb2dyYW0gKSApO1xyXG4gICAgICBjb25zb2xlLmxvZyggJ2ZvciB2ZXJ0ZXggc2hhZGVyJyApO1xyXG4gICAgICBjb25zb2xlLmxvZyggdGhpcy52ZXJ0ZXhTb3VyY2UgKTtcclxuICAgICAgY29uc29sZS5sb2coICdmb3IgZnJhZ21lbnQgc2hhZGVyJyApO1xyXG4gICAgICBjb25zb2xlLmxvZyggdGhpcy5mcmFnbWVudFNvdXJjZSApO1xyXG5cclxuICAgICAgLy8gTm9ybWFsbHkgaXQgd291bGQgYmUgYmVzdCB0byB0aHJvdyBhbiBleGNlcHRpb24gaGVyZSwgYnV0IGEgY29udGV4dCBsb3NzIGNvdWxkIGNhdXNlIHRoZSBzaGFkZXIgcGFyYW1ldGVyIGNoZWNrXHJcbiAgICAgIC8vIHRvIGZhaWwsIGFuZCB3ZSBtdXN0IGhhbmRsZSBjb250ZXh0IGxvc3MgZ3JhY2VmdWxseSBiZXR3ZWVuIGFueSBhZGphY2VudCBwYWlyIG9mIGdsIGNhbGxzLlxyXG4gICAgICAvLyBUaGVyZWZvcmUsIHdlIHNpbXBseSByZXBvcnQgdGhlIGVycm9ycyB0byB0aGUgY29uc29sZS4gIFNlZSAjMjc5XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY2xlYW4gdGhlc2UgdXAsIHRoZXkgYXJlbid0IG5lZWRlZCBhZnRlciB0aGUgbGlua1xyXG4gICAgdGhpcy5nbC5kZWxldGVTaGFkZXIoIHRoaXMudmVydGV4U2hhZGVyICk7XHJcbiAgICB0aGlzLmdsLmRlbGV0ZVNoYWRlciggdGhpcy5mcmFnbWVudFNoYWRlciApO1xyXG5cclxuICAgIC8vIHtPYmplY3R9XHJcbiAgICB0aGlzLnVuaWZvcm1Mb2NhdGlvbnMgPSB7fTsgLy8gbWFwIG5hbWUgPT4gdW5pZm9ybSBsb2NhdGlvbiBmb3IgcHJvZ3JhbVxyXG4gICAgdGhpcy5hdHRyaWJ1dGVMb2NhdGlvbnMgPSB7fTsgLy8gbWFwIG5hbWUgPT4gYXR0cmlidXRlIGxvY2F0aW9uIGZvciBwcm9ncmFtXHJcbiAgICB0aGlzLmFjdGl2ZUF0dHJpYnV0ZXMgPSB7fTsgLy8gbWFwIG5hbWUgPT4gYm9vbGVhbiAoZW5hYmxlZClcclxuXHJcbiAgICBfLmVhY2goIHRoaXMuYXR0cmlidXRlTmFtZXMsIGF0dHJpYnV0ZU5hbWUgPT4ge1xyXG4gICAgICB0aGlzLmF0dHJpYnV0ZUxvY2F0aW9uc1sgYXR0cmlidXRlTmFtZSBdID0gdGhpcy5nbC5nZXRBdHRyaWJMb2NhdGlvbiggdGhpcy5wcm9ncmFtLCBhdHRyaWJ1dGVOYW1lICk7XHJcbiAgICAgIHRoaXMuYWN0aXZlQXR0cmlidXRlc1sgYXR0cmlidXRlTmFtZSBdID0gdHJ1ZTsgLy8gZGVmYXVsdCB0byBlbmFibGVkXHJcbiAgICB9ICk7XHJcbiAgICBfLmVhY2goIHRoaXMudW5pZm9ybU5hbWVzLCB1bmlmb3JtTmFtZSA9PiB7XHJcbiAgICAgIHRoaXMudW5pZm9ybUxvY2F0aW9uc1sgdW5pZm9ybU5hbWUgXSA9IHRoaXMuZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKCB0aGlzLnByb2dyYW0sIHVuaWZvcm1OYW1lICkhO1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuaXNJbml0aWFsaXplZCA9IHRydWU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKi9cclxuICBwdWJsaWMgdXNlKCk6IHZvaWQge1xyXG4gICAgaWYgKCB0aGlzLnVzZWQgKSB7IHJldHVybjsgfVxyXG5cclxuICAgIHRoaXMudXNlZCA9IHRydWU7XHJcblxyXG4gICAgdGhpcy5nbC51c2VQcm9ncmFtKCB0aGlzLnByb2dyYW0gKTtcclxuXHJcbiAgICAvLyBlbmFibGUgdGhlIGFjdGl2ZSBhdHRyaWJ1dGVzXHJcbiAgICBfLmVhY2goIHRoaXMuYXR0cmlidXRlTmFtZXMsIGF0dHJpYnV0ZU5hbWUgPT4ge1xyXG4gICAgICBpZiAoIHRoaXMuYWN0aXZlQXR0cmlidXRlc1sgYXR0cmlidXRlTmFtZSBdICkge1xyXG4gICAgICAgIHRoaXMuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoIGF0dHJpYnV0ZU5hbWUgKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFjdGl2YXRlQXR0cmlidXRlKCBhdHRyaWJ1dGVOYW1lOiBzdHJpbmcgKTogdm9pZCB7XHJcbiAgICAvLyBndWFyZGVkIHNvIHdlIGRvbid0IGVuYWJsZSB0d2ljZVxyXG4gICAgaWYgKCAhdGhpcy5hY3RpdmVBdHRyaWJ1dGVzWyBhdHRyaWJ1dGVOYW1lIF0gKSB7XHJcbiAgICAgIHRoaXMuYWN0aXZlQXR0cmlidXRlc1sgYXR0cmlidXRlTmFtZSBdID0gdHJ1ZTtcclxuXHJcbiAgICAgIGlmICggdGhpcy51c2VkICkge1xyXG4gICAgICAgIHRoaXMuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoIGF0dHJpYnV0ZU5hbWUgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIGVuYWJsZVZlcnRleEF0dHJpYkFycmF5KCBhdHRyaWJ1dGVOYW1lOiBzdHJpbmcgKTogdm9pZCB7XHJcbiAgICB0aGlzLmdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KCB0aGlzLmF0dHJpYnV0ZUxvY2F0aW9uc1sgYXR0cmlidXRlTmFtZSBdICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgdW51c2UoKTogdm9pZCB7XHJcbiAgICBpZiAoICF0aGlzLnVzZWQgKSB7IHJldHVybjsgfVxyXG5cclxuICAgIHRoaXMudXNlZCA9IGZhbHNlO1xyXG5cclxuICAgIF8uZWFjaCggdGhpcy5hdHRyaWJ1dGVOYW1lcywgYXR0cmlidXRlTmFtZSA9PiB7XHJcbiAgICAgIGlmICggdGhpcy5hY3RpdmVBdHRyaWJ1dGVzWyBhdHRyaWJ1dGVOYW1lIF0gKSB7XHJcbiAgICAgICAgdGhpcy5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkoIGF0dHJpYnV0ZU5hbWUgKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGRpc2FibGVWZXJ0ZXhBdHRyaWJBcnJheSggYXR0cmlidXRlTmFtZTogc3RyaW5nICk6IHZvaWQge1xyXG4gICAgdGhpcy5nbC5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkoIHRoaXMuYXR0cmlidXRlTG9jYXRpb25zWyBhdHRyaWJ1dGVOYW1lIF0gKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBkZWFjdGl2YXRlQXR0cmlidXRlKCBhdHRyaWJ1dGVOYW1lOiBzdHJpbmcgKTogdm9pZCB7XHJcbiAgICAvLyBndWFyZGVkIHNvIHdlIGRvbid0IGRpc2FibGUgdHdpY2VcclxuICAgIGlmICggdGhpcy5hY3RpdmVBdHRyaWJ1dGVzWyBhdHRyaWJ1dGVOYW1lIF0gKSB7XHJcbiAgICAgIHRoaXMuYWN0aXZlQXR0cmlidXRlc1sgYXR0cmlidXRlTmFtZSBdID0gZmFsc2U7XHJcblxyXG4gICAgICBpZiAoIHRoaXMudXNlZCApIHtcclxuICAgICAgICB0aGlzLmRpc2FibGVWZXJ0ZXhBdHRyaWJBcnJheSggYXR0cmlidXRlTmFtZSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWxlYXNlcyByZWZlcmVuY2VzXHJcbiAgICovXHJcbiAgcHVibGljIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmdsLmRlbGV0ZVByb2dyYW0oIHRoaXMucHJvZ3JhbSApO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ1NoYWRlclByb2dyYW0nLCBTaGFkZXJQcm9ncmFtICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFNBQVMsTUFBTSxvQ0FBb0M7QUFDMUQsU0FBU0MsT0FBTyxFQUFFQyxLQUFLLFFBQVEsZUFBZTtBQVU5QyxlQUFlLE1BQU1DLGFBQWEsQ0FBQztFQUVqQzs7RUFjbUQ7O0VBSTVDQyxXQUFXQSxDQUFFQyxFQUF5QixFQUFFQyxZQUFvQixFQUFFQyxjQUFzQixFQUFFQyxlQUFzQyxFQUFHO0lBQ3BJLE1BQU1DLE9BQU8sR0FBR1QsU0FBUyxDQUF1QixDQUFDLENBQUU7TUFDakRVLFVBQVUsRUFBRSxFQUFFO01BQ2RDLFFBQVEsRUFBRTtJQUNaLENBQUMsRUFBRUgsZUFBZ0IsQ0FBQztJQUVwQixJQUFJLENBQUNGLFlBQVksR0FBR0EsWUFBWTtJQUNoQyxJQUFJLENBQUNDLGNBQWMs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