// Copyright 2013-2024, University of Colorado Boulder

/**
 * Wraps the context and contains a reference to the canvas, so that we can absorb unnecessary state changes,
 * and possibly combine certain fill operations.
 *
 * TODO: performance analysis, possibly axe this and use direct modification. https://github.com/phetsims/scenery/issues/1581
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { isTReadOnlyProperty } from '../../../axon/js/TReadOnlyProperty.js';
import { scenery } from '../imports.js';
class CanvasContextWrapper {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {CanvasRenderingContext2D} context
   */
  constructor(canvas, context) {
    // @public {HTMLCanvasElement}
    this.canvas = canvas;

    // @public {CanvasRenderingContext2D}
    this.context = context;
    this.resetStyles();
  }

  /**
   * Set local styles to undefined, so that they will be invalidated later
   * @public
   */
  resetStyles() {
    this.fillStyle = undefined; // null
    this.strokeStyle = undefined; // null
    this.lineWidth = undefined; // 1
    this.lineCap = undefined; // 'butt'
    this.lineJoin = undefined; // 'miter'
    this.lineDash = undefined; // []
    this.lineDashOffset = undefined; // 0
    this.miterLimit = undefined; // 10

    this.font = undefined; // '10px sans-serif'
    this.direction = undefined; // 'inherit'
  }

  /**
   * Sets a (possibly) new width and height, and clears the canvas.
   * @public
   *
   * @param {number} width
   * @param {number} height
   */
  setDimensions(width, height) {
    //Don't guard against width and height, because we need to clear the canvas.
    //TODO: Is it expensive to clear by setting both the width and the height?  Maybe we just need to set the width to clear it. https://github.com/phetsims/scenery/issues/1581
    this.canvas.width = width;
    this.canvas.height = height;

    // assume all persistent data could have changed
    this.resetStyles();
  }

  /**
   * @public
   *
   * @param {string|Color|Property.<string>} style
   */
  setFillStyle(style) {
    // turn {Property}s into their values when necessary
    if (style && isTReadOnlyProperty(style)) {
      style = style.value;
    }

    // turn {Color}s into strings when necessary
    if (style && style.getCanvasStyle) {
      style = style.getCanvasStyle();
    }
    if (this.fillStyle !== style) {
      this.fillStyle = style;

      // allow gradients / patterns
      this.context.fillStyle = style;
    }
  }

  /**
   * @public
   *
   * @param {string|Color|Property.<string>} style
   */
  setStrokeStyle(style) {
    // turn {Property}s into their values when necessary
    if (style && isTReadOnlyProperty(style)) {
      style = style.value;
    }

    // turn {Color}s into strings when necessary
    if (style && style.getCanvasStyle) {
      style = style.getCanvasStyle();
    }
    if (this.strokeStyle !== style) {
      this.strokeStyle = style;

      // allow gradients / patterns
      this.context.strokeStyle = style;
    }
  }

  /**
   * @public
   *
   * @param {number} width
   */
  setLineWidth(width) {
    if (this.lineWidth !== width) {
      this.lineWidth = width;
      this.context.lineWidth = width;
    }
  }

  /**
   * @public
   *
   * @param {string} cap
   */
  setLineCap(cap) {
    if (this.lineCap !== cap) {
      this.lineCap = cap;
      this.context.lineCap = cap;
    }
  }

  /**
   * @public
   *
   * @param {string} join
   */
  setLineJoin(join) {
    if (this.lineJoin !== join) {
      this.lineJoin = join;
      this.context.lineJoin = join;
    }
  }

  /**
   * @public
   *
   * @param {number} miterLimit
   */
  setMiterLimit(miterLimit) {
    assert && assert(typeof miterLimit === 'number');
    if (this.miterLimit !== miterLimit) {
      this.miterLimit = miterLimit;
      this.context.miterLimit = miterLimit;
    }
  }

  /**
   * @public
   *
   * @param {Array.<number>|null} dash
   */
  setLineDash(dash) {
    assert && assert(dash !== undefined, 'undefined line dash would cause hard-to-trace errors');
    if (this.lineDash !== dash) {
      this.lineDash = dash;
      if (this.context.setLineDash) {
        this.context.setLineDash(dash === null ? [] : dash); // see https://github.com/phetsims/scenery/issues/101 for null line-dash workaround
      } else if (this.context.mozDash !== undefined) {
        this.context.mozDash = dash;
      } else if (this.context.webkitLineDash !== undefined) {
        this.context.webkitLineDash = dash ? dash : [];
      } else {
        // unsupported line dash! do... nothing?
      }
    }
  }

  /**
   * @public
   *
   * @param {number} lineDashOffset
   */
  setLineDashOffset(lineDashOffset) {
    if (this.lineDashOffset !== lineDashOffset) {
      this.lineDashOffset = lineDashOffset;
      if (this.context.lineDashOffset !== undefined) {
        this.context.lineDashOffset = lineDashOffset;
      } else if (this.context.webkitLineDashOffset !== undefined) {
        this.context.webkitLineDashOffset = lineDashOffset;
      } else {
        // unsupported line dash! do... nothing?
      }
    }
  }

  /**
   * @public
   *
   * @param {string} font
   */
  setFont(font) {
    if (this.font !== font) {
      this.font = font;
      this.context.font = font;
    }
  }

  /**
   * @public
   *
   * @param {string} direction
   */
  setDirection(direction) {
    if (this.direction !== direction) {
      this.direction = direction;
      this.context.direction = direction;
    }
  }
}
scenery.register('CanvasContextWrapper', CanvasContextWrapper);
export default CanvasContextWrapper;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJpc1RSZWFkT25seVByb3BlcnR5Iiwic2NlbmVyeSIsIkNhbnZhc0NvbnRleHRXcmFwcGVyIiwiY29uc3RydWN0b3IiLCJjYW52YXMiLCJjb250ZXh0IiwicmVzZXRTdHlsZXMiLCJmaWxsU3R5bGUiLCJ1bmRlZmluZWQiLCJzdHJva2VTdHlsZSIsImxpbmVXaWR0aCIsImxpbmVDYXAiLCJsaW5lSm9pbiIsImxpbmVEYXNoIiwibGluZURhc2hPZmZzZXQiLCJtaXRlckxpbWl0IiwiZm9udCIsImRpcmVjdGlvbiIsInNldERpbWVuc2lvbnMiLCJ3aWR0aCIsImhlaWdodCIsInNldEZpbGxTdHlsZSIsInN0eWxlIiwidmFsdWUiLCJnZXRDYW52YXNTdHlsZSIsInNldFN0cm9rZVN0eWxlIiwic2V0TGluZVdpZHRoIiwic2V0TGluZUNhcCIsImNhcCIsInNldExpbmVKb2luIiwiam9pbiIsInNldE1pdGVyTGltaXQiLCJhc3NlcnQiLCJzZXRMaW5lRGFzaCIsImRhc2giLCJtb3pEYXNoIiwid2Via2l0TGluZURhc2giLCJzZXRMaW5lRGFzaE9mZnNldCIsIndlYmtpdExpbmVEYXNoT2Zmc2V0Iiwic2V0Rm9udCIsInNldERpcmVjdGlvbiIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiQ2FudmFzQ29udGV4dFdyYXBwZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG5cclxuLyoqXHJcbiAqIFdyYXBzIHRoZSBjb250ZXh0IGFuZCBjb250YWlucyBhIHJlZmVyZW5jZSB0byB0aGUgY2FudmFzLCBzbyB0aGF0IHdlIGNhbiBhYnNvcmIgdW5uZWNlc3Nhcnkgc3RhdGUgY2hhbmdlcyxcclxuICogYW5kIHBvc3NpYmx5IGNvbWJpbmUgY2VydGFpbiBmaWxsIG9wZXJhdGlvbnMuXHJcbiAqXHJcbiAqIFRPRE86IHBlcmZvcm1hbmNlIGFuYWx5c2lzLCBwb3NzaWJseSBheGUgdGhpcyBhbmQgdXNlIGRpcmVjdCBtb2RpZmljYXRpb24uIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgeyBpc1RSZWFkT25seVByb3BlcnR5IH0gZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCB7IHNjZW5lcnkgfSBmcm9tICcuLi9pbXBvcnRzLmpzJztcclxuXHJcbmNsYXNzIENhbnZhc0NvbnRleHRXcmFwcGVyIHtcclxuICAvKipcclxuICAgKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fSBjYW52YXNcclxuICAgKiBAcGFyYW0ge0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY29udGV4dFxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKCBjYW52YXMsIGNvbnRleHQgKSB7XHJcblxyXG4gICAgLy8gQHB1YmxpYyB7SFRNTENhbnZhc0VsZW1lbnR9XHJcbiAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcclxuXHJcbiAgICAvLyBAcHVibGljIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9XHJcbiAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG5cclxuICAgIHRoaXMucmVzZXRTdHlsZXMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCBsb2NhbCBzdHlsZXMgdG8gdW5kZWZpbmVkLCBzbyB0aGF0IHRoZXkgd2lsbCBiZSBpbnZhbGlkYXRlZCBsYXRlclxyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICByZXNldFN0eWxlcygpIHtcclxuICAgIHRoaXMuZmlsbFN0eWxlID0gdW5kZWZpbmVkOyAvLyBudWxsXHJcbiAgICB0aGlzLnN0cm9rZVN0eWxlID0gdW5kZWZpbmVkOyAvLyBudWxsXHJcbiAgICB0aGlzLmxpbmVXaWR0aCA9IHVuZGVmaW5lZDsgLy8gMVxyXG4gICAgdGhpcy5saW5lQ2FwID0gdW5kZWZpbmVkOyAvLyAnYnV0dCdcclxuICAgIHRoaXMubGluZUpvaW4gPSB1bmRlZmluZWQ7IC8vICdtaXRlcidcclxuICAgIHRoaXMubGluZURhc2ggPSB1bmRlZmluZWQ7IC8vIFtdXHJcbiAgICB0aGlzLmxpbmVEYXNoT2Zmc2V0ID0gdW5kZWZpbmVkOyAvLyAwXHJcbiAgICB0aGlzLm1pdGVyTGltaXQgPSB1bmRlZmluZWQ7IC8vIDEwXHJcblxyXG4gICAgdGhpcy5mb250ID0gdW5kZWZpbmVkOyAvLyAnMTBweCBzYW5zLXNlcmlmJ1xyXG4gICAgdGhpcy5kaXJlY3Rpb24gPSB1bmRlZmluZWQ7IC8vICdpbmhlcml0J1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyBhIChwb3NzaWJseSkgbmV3IHdpZHRoIGFuZCBoZWlnaHQsIGFuZCBjbGVhcnMgdGhlIGNhbnZhcy5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGhcclxuICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0XHJcbiAgICovXHJcbiAgc2V0RGltZW5zaW9ucyggd2lkdGgsIGhlaWdodCApIHtcclxuXHJcbiAgICAvL0Rvbid0IGd1YXJkIGFnYWluc3Qgd2lkdGggYW5kIGhlaWdodCwgYmVjYXVzZSB3ZSBuZWVkIHRvIGNsZWFyIHRoZSBjYW52YXMuXHJcbiAgICAvL1RPRE86IElzIGl0IGV4cGVuc2l2ZSB0byBjbGVhciBieSBzZXR0aW5nIGJvdGggdGhlIHdpZHRoIGFuZCB0aGUgaGVpZ2h0PyAgTWF5YmUgd2UganVzdCBuZWVkIHRvIHNldCB0aGUgd2lkdGggdG8gY2xlYXIgaXQuIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xNTgxXHJcbiAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG5cclxuICAgIC8vIGFzc3VtZSBhbGwgcGVyc2lzdGVudCBkYXRhIGNvdWxkIGhhdmUgY2hhbmdlZFxyXG4gICAgdGhpcy5yZXNldFN0eWxlcygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8Q29sb3J8UHJvcGVydHkuPHN0cmluZz59IHN0eWxlXHJcbiAgICovXHJcbiAgc2V0RmlsbFN0eWxlKCBzdHlsZSApIHtcclxuICAgIC8vIHR1cm4ge1Byb3BlcnR5fXMgaW50byB0aGVpciB2YWx1ZXMgd2hlbiBuZWNlc3NhcnlcclxuICAgIGlmICggc3R5bGUgJiYgaXNUUmVhZE9ubHlQcm9wZXJ0eSggc3R5bGUgKSApIHtcclxuICAgICAgc3R5bGUgPSBzdHlsZS52YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyB0dXJuIHtDb2xvcn1zIGludG8gc3RyaW5ncyB3aGVuIG5lY2Vzc2FyeVxyXG4gICAgaWYgKCBzdHlsZSAmJiBzdHlsZS5nZXRDYW52YXNTdHlsZSApIHtcclxuICAgICAgc3R5bGUgPSBzdHlsZS5nZXRDYW52YXNTdHlsZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggdGhpcy5maWxsU3R5bGUgIT09IHN0eWxlICkge1xyXG4gICAgICB0aGlzLmZpbGxTdHlsZSA9IHN0eWxlO1xyXG5cclxuICAgICAgLy8gYWxsb3cgZ3JhZGllbnRzIC8gcGF0dGVybnNcclxuICAgICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IHN0eWxlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8Q29sb3J8UHJvcGVydHkuPHN0cmluZz59IHN0eWxlXHJcbiAgICovXHJcbiAgc2V0U3Ryb2tlU3R5bGUoIHN0eWxlICkge1xyXG4gICAgLy8gdHVybiB7UHJvcGVydHl9cyBpbnRvIHRoZWlyIHZhbHVlcyB3aGVuIG5lY2Vzc2FyeVxyXG4gICAgaWYgKCBzdHlsZSAmJiBpc1RSZWFkT25seVByb3BlcnR5KCBzdHlsZSApICkge1xyXG4gICAgICBzdHlsZSA9IHN0eWxlLnZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHR1cm4ge0NvbG9yfXMgaW50byBzdHJpbmdzIHdoZW4gbmVjZXNzYXJ5XHJcbiAgICBpZiAoIHN0eWxlICYmIHN0eWxlLmdldENhbnZhc1N0eWxlICkge1xyXG4gICAgICBzdHlsZSA9IHN0eWxlLmdldENhbnZhc1N0eWxlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0aGlzLnN0cm9rZVN0eWxlICE9PSBzdHlsZSApIHtcclxuICAgICAgdGhpcy5zdHJva2VTdHlsZSA9IHN0eWxlO1xyXG5cclxuICAgICAgLy8gYWxsb3cgZ3JhZGllbnRzIC8gcGF0dGVybnNcclxuICAgICAgdGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlID0gc3R5bGU7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGhcclxuICAgKi9cclxuICBzZXRMaW5lV2lkdGgoIHdpZHRoICkge1xyXG4gICAgaWYgKCB0aGlzLmxpbmVXaWR0aCAhPT0gd2lkdGggKSB7XHJcbiAgICAgIHRoaXMubGluZVdpZHRoID0gd2lkdGg7XHJcbiAgICAgIHRoaXMuY29udGV4dC5saW5lV2lkdGggPSB3aWR0aDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjYXBcclxuICAgKi9cclxuICBzZXRMaW5lQ2FwKCBjYXAgKSB7XHJcbiAgICBpZiAoIHRoaXMubGluZUNhcCAhPT0gY2FwICkge1xyXG4gICAgICB0aGlzLmxpbmVDYXAgPSBjYXA7XHJcbiAgICAgIHRoaXMuY29udGV4dC5saW5lQ2FwID0gY2FwO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGpvaW5cclxuICAgKi9cclxuICBzZXRMaW5lSm9pbiggam9pbiApIHtcclxuICAgIGlmICggdGhpcy5saW5lSm9pbiAhPT0gam9pbiApIHtcclxuICAgICAgdGhpcy5saW5lSm9pbiA9IGpvaW47XHJcbiAgICAgIHRoaXMuY29udGV4dC5saW5lSm9pbiA9IGpvaW47XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gbWl0ZXJMaW1pdFxyXG4gICAqL1xyXG4gIHNldE1pdGVyTGltaXQoIG1pdGVyTGltaXQgKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2YgbWl0ZXJMaW1pdCA9PT0gJ251bWJlcicgKTtcclxuICAgIGlmICggdGhpcy5taXRlckxpbWl0ICE9PSBtaXRlckxpbWl0ICkge1xyXG4gICAgICB0aGlzLm1pdGVyTGltaXQgPSBtaXRlckxpbWl0O1xyXG4gICAgICB0aGlzLmNvbnRleHQubWl0ZXJMaW1pdCA9IG1pdGVyTGltaXQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0FycmF5LjxudW1iZXI+fG51bGx9IGRhc2hcclxuICAgKi9cclxuICBzZXRMaW5lRGFzaCggZGFzaCApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGRhc2ggIT09IHVuZGVmaW5lZCwgJ3VuZGVmaW5lZCBsaW5lIGRhc2ggd291bGQgY2F1c2UgaGFyZC10by10cmFjZSBlcnJvcnMnICk7XHJcbiAgICBpZiAoIHRoaXMubGluZURhc2ggIT09IGRhc2ggKSB7XHJcbiAgICAgIHRoaXMubGluZURhc2ggPSBkYXNoO1xyXG4gICAgICBpZiAoIHRoaXMuY29udGV4dC5zZXRMaW5lRGFzaCApIHtcclxuICAgICAgICB0aGlzLmNvbnRleHQuc2V0TGluZURhc2goIGRhc2ggPT09IG51bGwgPyBbXSA6IGRhc2ggKTsgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xMDEgZm9yIG51bGwgbGluZS1kYXNoIHdvcmthcm91bmRcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggdGhpcy5jb250ZXh0Lm1vekRhc2ggIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICB0aGlzLmNvbnRleHQubW96RGFzaCA9IGRhc2g7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIHRoaXMuY29udGV4dC53ZWJraXRMaW5lRGFzaCAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgIHRoaXMuY29udGV4dC53ZWJraXRMaW5lRGFzaCA9IGRhc2ggPyBkYXNoIDogW107XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gdW5zdXBwb3J0ZWQgbGluZSBkYXNoISBkby4uLiBub3RoaW5nP1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gbGluZURhc2hPZmZzZXRcclxuICAgKi9cclxuICBzZXRMaW5lRGFzaE9mZnNldCggbGluZURhc2hPZmZzZXQgKSB7XHJcbiAgICBpZiAoIHRoaXMubGluZURhc2hPZmZzZXQgIT09IGxpbmVEYXNoT2Zmc2V0ICkge1xyXG4gICAgICB0aGlzLmxpbmVEYXNoT2Zmc2V0ID0gbGluZURhc2hPZmZzZXQ7XHJcbiAgICAgIGlmICggdGhpcy5jb250ZXh0LmxpbmVEYXNoT2Zmc2V0ICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgdGhpcy5jb250ZXh0LmxpbmVEYXNoT2Zmc2V0ID0gbGluZURhc2hPZmZzZXQ7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIHRoaXMuY29udGV4dC53ZWJraXRMaW5lRGFzaE9mZnNldCAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgIHRoaXMuY29udGV4dC53ZWJraXRMaW5lRGFzaE9mZnNldCA9IGxpbmVEYXNoT2Zmc2V0O1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIC8vIHVuc3VwcG9ydGVkIGxpbmUgZGFzaCEgZG8uLi4gbm90aGluZz9cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZvbnRcclxuICAgKi9cclxuICBzZXRGb250KCBmb250ICkge1xyXG4gICAgaWYgKCB0aGlzLmZvbnQgIT09IGZvbnQgKSB7XHJcbiAgICAgIHRoaXMuZm9udCA9IGZvbnQ7XHJcbiAgICAgIHRoaXMuY29udGV4dC5mb250ID0gZm9udDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBkaXJlY3Rpb25cclxuICAgKi9cclxuICBzZXREaXJlY3Rpb24oIGRpcmVjdGlvbiApIHtcclxuICAgIGlmICggdGhpcy5kaXJlY3Rpb24gIT09IGRpcmVjdGlvbiApIHtcclxuICAgICAgdGhpcy5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XHJcbiAgICAgIHRoaXMuY29udGV4dC5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnQ2FudmFzQ29udGV4dFdyYXBwZXInLCBDYW52YXNDb250ZXh0V3JhcHBlciApO1xyXG5leHBvcnQgZGVmYXVsdCBDYW52YXNDb250ZXh0V3JhcHBlcjsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsU0FBU0EsbUJBQW1CLFFBQVEsdUNBQXVDO0FBQzNFLFNBQVNDLE9BQU8sUUFBUSxlQUFlO0FBRXZDLE1BQU1DLG9CQUFvQixDQUFDO0VBQ3pCO0FBQ0Y7QUFDQTtBQUNBO0VBQ0VDLFdBQVdBLENBQUVDLE1BQU0sRUFBRUMsT0FBTyxFQUFHO0lBRTdCO0lBQ0EsSUFBSSxDQUFDRCxNQUFNLEdBQUdBLE1BQU07O0lBRXBCO0lBQ0EsSUFBSSxDQUFDQyxPQUFPLEdBQUdBLE9BQU87SUFFdEIsSUFBSSxDQUFDQyxXQUFXLENBQUMsQ0FBQztFQUNwQjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtFQUNFQSxXQUFXQSxDQUFBLEVBQUc7SUFDWixJQUFJLENBQUNDLFNBQVMsR0FBR0MsU0FBUyxDQUFDLENBQUM7SUFDNUIsSUFBSSxDQUFDQyxXQUFXLEdBQUdELFNBQVMsQ0FBQyxDQUFDO0lBQzlCLElBQUksQ0FBQ0UsU0FBUyxHQUFHRixTQUFTLENBQUMsQ0FBQztJQUM1QixJQUFJLENBQUNHLE9BQU8sR0FBR0gsU0FBUyxDQUFDLENBQUM7SUFDMUIsSUFBSSxDQUFDSSxRQUFRLEdBQUdKLFNBQVMsQ0FBQyxDQUFDO0lBQzNCLElBQUksQ0FBQ0ssUUFBUSxHQUFHTCxTQUFTLENBQUMsQ0FBQztJQUMzQixJQUFJLENBQUNNLGNBQWMsR0FBR04sU0FBUyxDQUFDLENBQUM7SUFDakMsSUFBSSxDQUFDTyxVQUFVLEdBQUdQLFNBQVMsQ0FBQyxDQUFDOztJQUU3QixJQUFJLENBQUNRLElBQUksR0FBR1IsU0FBUyxDQUFDLENBQUM7SUFDdkIsSUFBSSxDQUFDUyxTQUFTLEdBQUdULFNBQVMsQ0FBQyxDQUFDO0VBQzlCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0VVLGFBQWFBLENBQUVDLEtBQUssRUFBRUMsTUFBTSxFQUFHO0lBRTdCO0lBQ0E7SUFDQSxJQUFJLENBQUNoQixNQUFNLENBQUNlLEtBQUssR0FBR0EsS0FBSztJQUN6QixJQUFJLENBQUNmLE1BQU0sQ0FBQ2dCLE1BQU0sR0FBR0EsTUFBTTs7SUFFM0I7SUFDQSxJQUFJLENBQUNkLFdBQVcsQ0FBQyxDQUFDO0VBQ3BCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRWUsWUFBWUEsQ0FBRUMsS0FBSyxFQUFHO0lBQ3BCO0lBQ0EsSUFBS0EsS0FBSyxJQUFJdEIsbUJBQW1CLENBQUVzQixLQUFNLENBQUMsRUFBRztNQUMzQ0EsS0FBSyxHQUFHQSxLQUFLLENBQUNDLEtBQUs7SUFDckI7O0lBRUE7SUFDQSxJQUFLRCxLQUFLLElBQUlBLEtBQUssQ0FBQ0UsY0FBYyxFQUFHO01BQ25DRixLQUFLLEdBQUdBLEtBQUssQ0FBQ0UsY0FBYyxDQUFDLENBQUM7SUFDaEM7SUFFQSxJQUFLLElBQUksQ0FBQ2pCLFNBQVMsS0FBS2UsS0FBSyxFQUFHO01BQzlCLElBQUksQ0FBQ2YsU0FBUyxHQUFHZSxLQUFLOztNQUV0QjtNQUNBLElBQUksQ0FBQ2pCLE9BQU8sQ0FBQ0UsU0FBUyxHQUFHZSxLQUFLO0lBQ2hDO0VBQ0Y7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNFRyxjQUFjQSxDQUFFSCxLQUFLLEVBQUc7SUFDdEI7SUFDQSxJQUFLQSxLQUFLLElBQUl0QixtQkFBbUIsQ0FBRXNCLEtBQU0sQ0FBQyxFQUFHO01BQzNDQSxLQUFLLEdBQUdBLEtBQUssQ0FBQ0MsS0FBSztJQUNyQjs7SUFFQTtJQUNBLElBQUtELEtBQUssSUFBSUEsS0FBSyxDQUFDRSxjQUFjLEVBQUc7TUFDbkNGLEtBQUssR0FBR0EsS0FBSyxDQUFDRSxjQUFjLENBQUMsQ0FBQztJQUNoQztJQUVBLElBQUssSUFBSSxDQUFDZixXQUFXLEtBQUthLEtBQUssRUFBRztNQUNoQyxJQUFJLENBQUNiLFdBQVcsR0FBR2EsS0FBSzs7TUFFeEI7TUFDQSxJQUFJLENBQUNqQixPQUFPLENBQUNJLFdBQVcsR0FBR2EsS0FBSztJQUNsQztFQUNGOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRUksWUFBWUEsQ0FBRVAsS0FBSyxFQUFHO0lBQ3BCLElBQUssSUFBSSxDQUFDVCxTQUFTLEtBQUtTLEtBQUssRUFBRztNQUM5QixJQUFJLENBQUNULFNBQVMsR0FBR1MsS0FBSztNQUN0QixJQUFJLENBQUNkLE9BQU8sQ0FBQ0ssU0FBUyxHQUFHUyxLQUFLO0lBQ2hDO0VBQ0Y7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNFUSxVQUFVQSxDQUFFQyxHQUFHLEVBQUc7SUFDaEIsSUFBSyxJQUFJLENBQUNqQixPQUFPLEtBQUtpQixHQUFHLEVBQUc7TUFDMUIsSUFBSSxDQUFDakIsT0FBTyxHQUFHaUIsR0FBRztNQUNsQixJQUFJLENBQUN2QixPQUFPLENBQUNNLE9BQU8sR0FBR2lCLEdBQUc7SUFDNUI7RUFDRjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0VDLFdBQVdBLENBQUVDLElBQUksRUFBRztJQUNsQixJQUFLLElBQUksQ0FBQ2xCLFFBQVEsS0FBS2tCLElBQUksRUFBRztNQUM1QixJQUFJLENBQUNsQixRQUFRLEdBQUdrQixJQUFJO01BQ3BCLElBQUksQ0FBQ3pCLE9BQU8sQ0FBQ08sUUFBUSxHQUFHa0IsSUFBSTtJQUM5QjtFQUNGOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRUMsYUFBYUEsQ0FBRWhCLFVBQVUsRUFBRztJQUMxQmlCLE1BQU0sSUFBSUEsTUFBTSxDQUFFLE9BQU9qQixVQUFVLEtBQUssUUFBUyxDQUFDO0lBQ2xELElBQUssSUFBSSxDQUFDQSxVQUFVLEtBQUtBLFVBQVUsRUFBRztNQUNwQyxJQUFJLENBQUNBLFVBQVUsR0FBR0EsVUFBVTtNQUM1QixJQUFJLENBQUNWLE9BQU8sQ0FBQ1UsVUFBVSxHQUFHQSxVQUFVO0lBQ3RDO0VBQ0Y7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNFa0IsV0FBV0EsQ0FBRUMsSUFBSSxFQUFHO0lBQ2xCRixNQUFNLElBQUlBLE1BQU0sQ0FBRUUsSUFBSSxLQUFLMUIsU0FBUyxFQUFFLHNEQUF1RCxDQUFDO0lBQzlGLElBQUssSUFBSSxDQUFDSyxRQUFRLEtBQUtxQixJQUFJLEVBQUc7TUFDNUIsSUFBSSxDQUFDckIsUUFBUSxHQUFHcUIsSUFBSTtNQUNwQixJQUFLLElBQUksQ0FBQzdCLE9BQU8sQ0FBQzRCLFdBQVcsRUFBRztRQUM5QixJQUFJLENBQUM1QixPQUFPLENBQUM0QixXQUFXLENBQUVDLElBQUksS0FBSyxJQUFJLEdBQUcsRUFBRSxHQUFHQSxJQUFLLENBQUMsQ0FBQyxDQUFDO01BQ3pELENBQUMsTUFDSSxJQUFLLElBQUksQ0FBQzdCLE9BQU8sQ0FBQzhCLE9BQU8sS0FBSzNCLFNBQVMsRUFBRztRQUM3QyxJQUFJLENBQUNILE9BQU8sQ0FBQzhCLE9BQU8sR0FBR0QsSUFBSTtNQUM3QixDQUFDLE1BQ0ksSUFBSyxJQUFJLENBQUM3QixPQUFPLENBQUMrQixjQUFjLEtBQUs1QixTQUFTLEVBQUc7UUFDcEQsSUFBSSxDQUFDSCxPQUFPLENBQUMrQixjQUFjLEdBQUdGLElBQUksR0FBR0EsSUFBSSxHQUFHLEVBQUU7TUFDaEQsQ0FBQyxNQUNJO1FBQ0g7TUFBQTtJQUVKO0VBQ0Y7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNFRyxpQkFBaUJBLENBQUV2QixjQUFjLEVBQUc7SUFDbEMsSUFBSyxJQUFJLENBQUNBLGNBQWMsS0FBS0EsY0FBYyxFQUFHO01BQzVDLElBQUksQ0FBQ0EsY0FBYyxHQUFHQSxjQUFjO01BQ3BDLElBQUssSUFBSSxDQUFDVCxPQUFPLENBQUNTLGNBQWMsS0FBS04sU0FBUyxFQUFHO1FBQy9DLElBQUksQ0FBQ0gsT0FBTyxDQUFDUyxjQUFjLEdBQUdBLGNBQWM7TUFDOUMsQ0FBQyxNQUNJLElBQUssSUFBSSxDQUFDVCxPQUFPLENBQUNpQyxvQkFBb0IsS0FBSzlCLFNBQVMsRUFBRztRQUMxRCxJQUFJLENBQUNILE9BQU8sQ0FBQ2lDLG9CQUFvQixHQUFHeEIsY0FBYztNQUNwRCxDQUFDLE1BQ0k7UUFDSDtNQUFBO0lBRUo7RUFDRjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0V5QixPQUFPQSxDQUFFdkIsSUFBSSxFQUFHO0lBQ2QsSUFBSyxJQUFJLENBQUNBLElBQUksS0FBS0EsSUFBSSxFQUFHO01BQ3hCLElBQUksQ0FBQ0EsSUFBSSxHQUFHQSxJQUFJO01BQ2hCLElBQUksQ0FBQ1gsT0FBTyxDQUFDVyxJQUFJLEdBQUdBLElBQUk7SUFDMUI7RUFDRjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0V3QixZQUFZQSxDQUFFdkIsU0FBUyxFQUFHO0lBQ3hCLElBQUssSUFBSSxDQUFDQSxTQUFTLEtBQUtBLFNBQVMsRUFBRztNQUNsQyxJQUFJLENBQUNBLFNBQVMsR0FBR0EsU0FBUztNQUMxQixJQUFJLENBQUNaLE9BQU8sQ0FBQ1ksU0FBUyxHQUFHQSxTQUFTO0lBQ3BDO0VBQ0Y7QUFDRjtBQUVBaEIsT0FBTyxDQUFDd0MsUUFBUSxDQUFFLHNCQUFzQixFQUFFdkMsb0JBQXFCLENBQUM7QUFDaEUsZUFBZUEsb0JBQW9CIiwiaWdub3JlTGlzdCI6W119