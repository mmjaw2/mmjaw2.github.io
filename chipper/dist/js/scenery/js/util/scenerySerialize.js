// Copyright 2021-2024, University of Colorado Boulder

/**
 * Serializes a generalized object
 * @deprecated
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Matrix3 from '../../../dot/js/Matrix3.js';
import Bounds2 from '../../../dot/js/Bounds2.js';
import Vector2 from '../../../dot/js/Vector2.js';
import { Shape } from '../../../kite/js/imports.js';
import inheritance from '../../../phet-core/js/inheritance.js';
import { CanvasContextWrapper, CanvasNode, Circle, Color, Display, DOM, Gradient, Image, Line, LinearGradient, Node, Paint, PAINTABLE_DEFAULT_OPTIONS, Path, Pattern, RadialGradient, Rectangle, scenery, Text, WebGLNode } from '../imports.js';
import ReadOnlyProperty from '../../../axon/js/ReadOnlyProperty.js';
import TinyProperty from '../../../axon/js/TinyProperty.js';
const scenerySerialize = value => {
  if (value instanceof Vector2) {
    return {
      type: 'Vector2',
      x: value.x,
      y: value.y
    };
  } else if (value instanceof Matrix3) {
    return {
      type: 'Matrix3',
      m00: value.m00(),
      m01: value.m01(),
      m02: value.m02(),
      m10: value.m10(),
      m11: value.m11(),
      m12: value.m12(),
      m20: value.m20(),
      m21: value.m21(),
      m22: value.m22()
    };
  } else if (value instanceof Bounds2) {
    const bounds = value;
    return {
      type: 'Bounds2',
      maxX: bounds.maxX,
      maxY: bounds.maxY,
      minX: bounds.minX,
      minY: bounds.minY
    };
  } else if (value instanceof Shape) {
    return {
      type: 'Shape',
      path: value.getSVGPath()
    };
  } else if (Array.isArray(value)) {
    return {
      type: 'Array',
      value: value.map(scenerySerialize)
    };
  } else if (value instanceof Color) {
    return {
      type: 'Color',
      red: value.red,
      green: value.green,
      blue: value.blue,
      alpha: value.alpha
    };
  } else if (value instanceof ReadOnlyProperty) {
    return {
      type: 'Property',
      value: scenerySerialize(value.value)
    };
  } else if (value instanceof TinyProperty) {
    return {
      type: 'TinyProperty',
      value: scenerySerialize(value.value)
    };
  } else if (Paint && value instanceof Paint) {
    const paintSerialization = {};
    if (value.transformMatrix) {
      paintSerialization.transformMatrix = scenerySerialize(value.transformMatrix);
    }
    if (Gradient && (value instanceof RadialGradient || value instanceof LinearGradient)) {
      paintSerialization.stops = value.stops.map(stop => {
        return {
          ratio: stop.ratio,
          stop: scenerySerialize(stop.color)
        };
      });
      paintSerialization.start = scenerySerialize(value.start);
      paintSerialization.end = scenerySerialize(value.end);
      if (LinearGradient && value instanceof LinearGradient) {
        paintSerialization.type = 'LinearGradient';
      } else if (RadialGradient && value instanceof RadialGradient) {
        paintSerialization.type = 'RadialGradient';
        paintSerialization.startRadius = value.startRadius;
        paintSerialization.endRadius = value.endRadius;
      }
    }
    if (Pattern && value instanceof Pattern) {
      paintSerialization.type = 'Pattern';
      paintSerialization.url = value.image.src;
    }
    return paintSerialization;
  } else if (value instanceof Node) {
    const node = value;
    const options = {};
    const setup = {
      // maxWidth
      // maxHeight
      // clipArea
      // mouseArea
      // touchArea
      // matrix
      // localBounds
      // children {Array.<number>} - IDs
      // hasInputListeners {boolean}
    };
    ['visible', 'opacity', 'disabledOpacity', 'pickable', 'inputEnabled', 'cursor', 'transformBounds', 'renderer', 'usesOpacity', 'layerSplit', 'cssTransform', 'excludeInvisible', 'webglScale', 'preventFit'].forEach(simpleKey => {
      // @ts-expect-error
      if (node[simpleKey] !== Node.DEFAULT_NODE_OPTIONS[simpleKey]) {
        // @ts-expect-error
        options[simpleKey] = node[simpleKey];
      }
    });

    // From ParallelDOM
    ['tagName', 'innerContent', 'accessibleName', 'helpText'].forEach(simpleKey => {
      // All default to null
      // @ts-expect-error
      if (node[simpleKey] !== null) {
        // @ts-expect-error
        options[simpleKey] = node[simpleKey];
      }
    });
    ['maxWidth', 'maxHeight', 'clipArea', 'mouseArea', 'touchArea'].forEach(serializedKey => {
      // @ts-expect-error
      if (node[serializedKey] !== Node.DEFAULT_NODE_OPTIONS[serializedKey]) {
        // @ts-expect-error
        setup[serializedKey] = scenerySerialize(node[serializedKey]);
      }
    });
    if (!node.matrix.isIdentity()) {
      setup.matrix = scenerySerialize(node.matrix);
    }
    if (node._localBoundsOverridden) {
      setup.localBounds = scenerySerialize(node.localBounds);
    }
    setup.children = node.children.map(child => {
      return child.id;
    });
    setup.hasInputListeners = node.inputListeners.length > 0;
    const serialization = {
      id: node.id,
      type: 'Node',
      types: inheritance(node.constructor).map(type => type.name).filter(name => {
        return name && name !== 'Object' && name !== 'Node';
      }),
      name: node.constructor.name,
      options: options,
      setup: setup
    };
    if (Path && node instanceof Path) {
      serialization.type = 'Path';
      setup.path = scenerySerialize(node.shape);
      if (node.boundsMethod !== Path.DEFAULT_PATH_OPTIONS.boundsMethod) {
        options.boundsMethod = node.boundsMethod;
      }
    }
    if (Circle && node instanceof Circle) {
      serialization.type = 'Circle';
      options.radius = node.radius;
    }
    if (Line && node instanceof Line) {
      serialization.type = 'Line';
      options.x1 = node.x1;
      options.y1 = node.y1;
      options.x2 = node.x2;
      options.y2 = node.y2;
    }
    if (Rectangle && node instanceof Rectangle) {
      serialization.type = 'Rectangle';
      options.rectX = node.rectX;
      options.rectY = node.rectY;
      options.rectWidth = node.rectWidth;
      options.rectHeight = node.rectHeight;
      options.cornerXRadius = node.cornerXRadius;
      options.cornerYRadius = node.cornerYRadius;
    }
    if (Text && node instanceof Text) {
      serialization.type = 'Text';
      // TODO: defaults for Text? https://github.com/phetsims/scenery/issues/1581
      if (node.boundsMethod !== 'hybrid') {
        options.boundsMethod = node.boundsMethod;
      }
      options.string = node.string;
      options.font = node.font;
    }
    if (Image && node instanceof Image) {
      serialization.type = 'Image';
      ['imageOpacity', 'initialWidth', 'initialHeight', 'mipmapBias', 'mipmapInitialLevel', 'mipmapMaxLevel'].forEach(simpleKey => {
        // @ts-expect-error
        if (node[simpleKey] !== Image.DEFAULT_IMAGE_OPTIONS[simpleKey]) {
          // @ts-expect-error
          options[simpleKey] = node[simpleKey];
        }
      });
      setup.width = node.imageWidth;
      setup.height = node.imageHeight;

      // Initialized with a mipmap
      if (node._mipmapData) {
        setup.imageType = 'mipmapData';
        setup.mipmapData = node._mipmapData.map(level => {
          return {
            url: level.url,
            width: level.width,
            height: level.height
            // will reconstitute img {HTMLImageElement} and canvas {HTMLCanvasElement}
          };
        });
      } else {
        if (node._mipmap) {
          setup.generateMipmaps = true;
        }
        if (node._image instanceof HTMLImageElement) {
          setup.imageType = 'image';
          setup.src = node._image.src;
        } else if (node._image instanceof HTMLCanvasElement) {
          setup.imageType = 'canvas';
          setup.src = node._image.toDataURL();
        }
      }
    }
    if (CanvasNode && node instanceof CanvasNode || WebGLNode && node instanceof WebGLNode) {
      serialization.type = CanvasNode && node instanceof CanvasNode ? 'CanvasNode' : 'WebGLNode';
      setup.canvasBounds = scenerySerialize(node.canvasBounds);

      // Identify the approximate scale of the node
      // let scale = Math.min( 5, node._drawables.length ? ( 1 / _.mean( node._drawables.map( drawable => {
      //   const scaleVector = drawable.instance.trail.getMatrix().getScaleVector();
      //   return ( scaleVector.x + scaleVector.y ) / 2;
      // } ) ) ) : 1 );
      const scale = 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(node.canvasBounds.width * scale);
      canvas.height = Math.ceil(node.canvasBounds.height * scale);
      const context = canvas.getContext('2d');
      const wrapper = new CanvasContextWrapper(canvas, context);
      const matrix = Matrix3.scale(1 / scale);
      wrapper.context.setTransform(scale, 0, 0, scale, -node.canvasBounds.left, -node.canvasBounds.top);
      node.renderToCanvasSelf(wrapper, matrix);
      setup.url = canvas.toDataURL();
      setup.scale = scale;
      setup.offset = scenerySerialize(node.canvasBounds.leftTop);
    }
    if (DOM && node instanceof DOM) {
      serialization.type = 'DOM';
      serialization.element = new window.XMLSerializer().serializeToString(node.element);
      if (node.element instanceof window.HTMLCanvasElement) {
        serialization.dataURL = node.element.toDataURL();
      }
      options.preventTransform = node.preventTransform;
    }

    // Paintable
    if (Path && node instanceof Path || Text && node instanceof Text) {
      ['fillPickable', 'strokePickable', 'lineWidth', 'lineCap', 'lineJoin', 'lineDashOffset', 'miterLimit'].forEach(simpleKey => {
        // @ts-expect-error
        if (node[simpleKey] !== PAINTABLE_DEFAULT_OPTIONS[simpleKey]) {
          // @ts-expect-error
          options[simpleKey] = node[simpleKey];
        }
      });

      // Ignoring cachedPaints, since we'd 'double' it anyways

      if (node.fill !== PAINTABLE_DEFAULT_OPTIONS.fill) {
        setup.fill = scenerySerialize(node.fill);
      }
      if (node.stroke !== PAINTABLE_DEFAULT_OPTIONS.stroke) {
        setup.stroke = scenerySerialize(node.stroke);
      }
      if (node.lineDash.length) {
        setup.lineDash = scenerySerialize(node.lineDash);
      }
    }
    return serialization;
  } else if (value instanceof Display) {
    return {
      type: 'Display',
      width: value.width,
      height: value.height,
      backgroundColor: scenerySerialize(value.backgroundColor),
      tree: {
        type: 'Subtree',
        rootNodeId: value.rootNode.id,
        nodes: serializeConnectedNodes(value.rootNode)
      }
    };
  } else {
    return {
      type: 'value',
      value: value
    };
  }
};
const serializeConnectedNodes = rootNode => {
  return rootNode.getSubtreeNodes().map(scenerySerialize);
};
scenery.register('scenerySerialize', scenerySerialize);
export { scenerySerialize as default, serializeConnectedNodes };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNYXRyaXgzIiwiQm91bmRzMiIsIlZlY3RvcjIiLCJTaGFwZSIsImluaGVyaXRhbmNlIiwiQ2FudmFzQ29udGV4dFdyYXBwZXIiLCJDYW52YXNOb2RlIiwiQ2lyY2xlIiwiQ29sb3IiLCJEaXNwbGF5IiwiRE9NIiwiR3JhZGllbnQiLCJJbWFnZSIsIkxpbmUiLCJMaW5lYXJHcmFkaWVudCIsIk5vZGUiLCJQYWludCIsIlBBSU5UQUJMRV9ERUZBVUxUX09QVElPTlMiLCJQYXRoIiwiUGF0dGVybiIsIlJhZGlhbEdyYWRpZW50IiwiUmVjdGFuZ2xlIiwic2NlbmVyeSIsIlRleHQiLCJXZWJHTE5vZGUiLCJSZWFkT25seVByb3BlcnR5IiwiVGlueVByb3BlcnR5Iiwic2NlbmVyeVNlcmlhbGl6ZSIsInZhbHVlIiwidHlwZSIsIngiLCJ5IiwibTAwIiwibTAxIiwibTAyIiwibTEwIiwibTExIiwibTEyIiwibTIwIiwibTIxIiwibTIyIiwiYm91bmRzIiwibWF4WCIsIm1heFkiLCJtaW5YIiwibWluWSIsInBhdGgiLCJnZXRTVkdQYXRoIiwiQXJyYXkiLCJpc0FycmF5IiwibWFwIiwicmVkIiwiZ3JlZW4iLCJibHVlIiwiYWxwaGEiLCJwYWludFNlcmlhbGl6YXRpb24iLCJ0cmFuc2Zvcm1NYXRyaXgiLCJzdG9wcyIsInN0b3AiLCJyYXRpbyIsImNvbG9yIiwic3RhcnQiLCJlbmQiLCJzdGFydFJhZGl1cyIsImVuZFJhZGl1cyIsInVybCIsImltYWdlIiwic3JjIiwibm9kZSIsIm9wdGlvbnMiLCJzZXR1cCIsImZvckVhY2giLCJzaW1wbGVLZXkiLCJERUZBVUxUX05PREVfT1BUSU9OUyIsInNlcmlhbGl6ZWRLZXkiLCJtYXRyaXgiLCJpc0lkZW50aXR5IiwiX2xvY2FsQm91bmRzT3ZlcnJpZGRlbiIsImxvY2FsQm91bmRzIiwiY2hpbGRyZW4iLCJjaGlsZCIsImlkIiwiaGFzSW5wdXRMaXN0ZW5lcnMiLCJpbnB1dExpc3RlbmVycyIsImxlbmd0aCIsInNlcmlhbGl6YXRpb24iLCJ0eXBlcyIsImNvbnN0cnVjdG9yIiwibmFtZSIsImZpbHRlciIsInNoYXBlIiwiYm91bmRzTWV0aG9kIiwiREVGQVVMVF9QQVRIX09QVElPTlMiLCJyYWRpdXMiLCJ4MSIsInkxIiwieDIiLCJ5MiIsInJlY3RYIiwicmVjdFkiLCJyZWN0V2lkdGgiLCJyZWN0SGVpZ2h0IiwiY29ybmVyWFJhZGl1cyIsImNvcm5lcllSYWRpdXMiLCJzdHJpbmciLCJmb250IiwiREVGQVVMVF9JTUFHRV9PUFRJT05TIiwid2lkdGgiLCJpbWFnZVdpZHRoIiwiaGVpZ2h0IiwiaW1hZ2VIZWlnaHQiLCJfbWlwbWFwRGF0YSIsImltYWdlVHlwZSIsIm1pcG1hcERhdGEiLCJsZXZlbCIsIl9taXBtYXAiLCJnZW5lcmF0ZU1pcG1hcHMiLCJfaW1hZ2UiLCJIVE1MSW1hZ2VFbGVtZW50IiwiSFRNTENhbnZhc0VsZW1lbnQiLCJ0b0RhdGFVUkwiLCJjYW52YXNCb3VuZHMiLCJzY2FsZSIsImNhbnZhcyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsIk1hdGgiLCJjZWlsIiwiY29udGV4dCIsImdldENvbnRleHQiLCJ3cmFwcGVyIiwic2V0VHJhbnNmb3JtIiwibGVmdCIsInRvcCIsInJlbmRlclRvQ2FudmFzU2VsZiIsIm9mZnNldCIsImxlZnRUb3AiLCJlbGVtZW50Iiwid2luZG93IiwiWE1MU2VyaWFsaXplciIsInNlcmlhbGl6ZVRvU3RyaW5nIiwiZGF0YVVSTCIsInByZXZlbnRUcmFuc2Zvcm0iLCJmaWxsIiwic3Ryb2tlIiwibGluZURhc2giLCJiYWNrZ3JvdW5kQ29sb3IiLCJ0cmVlIiwicm9vdE5vZGVJZCIsInJvb3ROb2RlIiwibm9kZXMiLCJzZXJpYWxpemVDb25uZWN0ZWROb2RlcyIsImdldFN1YnRyZWVOb2RlcyIsInJlZ2lzdGVyIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbInNjZW5lcnlTZXJpYWxpemUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogU2VyaWFsaXplcyBhIGdlbmVyYWxpemVkIG9iamVjdFxyXG4gKiBAZGVwcmVjYXRlZFxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IE1hdHJpeDMgZnJvbSAnLi4vLi4vLi4vZG90L2pzL01hdHJpeDMuanMnO1xyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tICcuLi8uLi8uLi9raXRlL2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgaW5oZXJpdGFuY2UgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL2luaGVyaXRhbmNlLmpzJztcclxuaW1wb3J0IHsgQ2FudmFzQ29udGV4dFdyYXBwZXIsIENhbnZhc05vZGUsIENpcmNsZSwgQ29sb3IsIERpc3BsYXksIERPTSwgR3JhZGllbnQsIEltYWdlLCBMaW5lLCBMaW5lYXJHcmFkaWVudCwgTm9kZSwgUGFpbnQsIFBBSU5UQUJMRV9ERUZBVUxUX09QVElPTlMsIFBhdGgsIFBhdHRlcm4sIFJhZGlhbEdyYWRpZW50LCBSZWN0YW5nbGUsIHNjZW5lcnksIFRleHQsIFdlYkdMTm9kZSB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgSW50ZW50aW9uYWxBbnkgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL0ludGVudGlvbmFsQW55LmpzJztcclxuaW1wb3J0IFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9SZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IFRpbnlQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RpbnlQcm9wZXJ0eS5qcyc7XHJcblxyXG5jb25zdCBzY2VuZXJ5U2VyaWFsaXplID0gKCB2YWx1ZTogdW5rbm93biApOiBJbnRlbnRpb25hbEFueSA9PiB7XHJcbiAgaWYgKCB2YWx1ZSBpbnN0YW5jZW9mIFZlY3RvcjIgKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0eXBlOiAnVmVjdG9yMicsXHJcbiAgICAgIHg6ICggdmFsdWUgKS54LFxyXG4gICAgICB5OiAoIHZhbHVlICkueVxyXG4gICAgfTtcclxuICB9XHJcbiAgZWxzZSBpZiAoIHZhbHVlIGluc3RhbmNlb2YgTWF0cml4MyApIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHR5cGU6ICdNYXRyaXgzJyxcclxuICAgICAgbTAwOiB2YWx1ZS5tMDAoKSxcclxuICAgICAgbTAxOiB2YWx1ZS5tMDEoKSxcclxuICAgICAgbTAyOiB2YWx1ZS5tMDIoKSxcclxuICAgICAgbTEwOiB2YWx1ZS5tMTAoKSxcclxuICAgICAgbTExOiB2YWx1ZS5tMTEoKSxcclxuICAgICAgbTEyOiB2YWx1ZS5tMTIoKSxcclxuICAgICAgbTIwOiB2YWx1ZS5tMjAoKSxcclxuICAgICAgbTIxOiB2YWx1ZS5tMjEoKSxcclxuICAgICAgbTIyOiB2YWx1ZS5tMjIoKVxyXG4gICAgfTtcclxuICB9XHJcbiAgZWxzZSBpZiAoIHZhbHVlIGluc3RhbmNlb2YgQm91bmRzMiApIHtcclxuICAgIGNvbnN0IGJvdW5kcyA9IHZhbHVlO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdHlwZTogJ0JvdW5kczInLFxyXG4gICAgICBtYXhYOiBib3VuZHMubWF4WCxcclxuICAgICAgbWF4WTogYm91bmRzLm1heFksXHJcbiAgICAgIG1pblg6IGJvdW5kcy5taW5YLFxyXG4gICAgICBtaW5ZOiBib3VuZHMubWluWVxyXG4gICAgfTtcclxuICB9XHJcbiAgZWxzZSBpZiAoIHZhbHVlIGluc3RhbmNlb2YgU2hhcGUgKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0eXBlOiAnU2hhcGUnLFxyXG4gICAgICBwYXRoOiB2YWx1ZS5nZXRTVkdQYXRoKClcclxuICAgIH07XHJcbiAgfVxyXG4gIGVsc2UgaWYgKCBBcnJheS5pc0FycmF5KCB2YWx1ZSApICkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdHlwZTogJ0FycmF5JyxcclxuICAgICAgdmFsdWU6IHZhbHVlLm1hcCggc2NlbmVyeVNlcmlhbGl6ZSApXHJcbiAgICB9O1xyXG4gIH1cclxuICBlbHNlIGlmICggdmFsdWUgaW5zdGFuY2VvZiBDb2xvciApIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHR5cGU6ICdDb2xvcicsXHJcbiAgICAgIHJlZDogdmFsdWUucmVkLFxyXG4gICAgICBncmVlbjogdmFsdWUuZ3JlZW4sXHJcbiAgICAgIGJsdWU6IHZhbHVlLmJsdWUsXHJcbiAgICAgIGFscGhhOiB2YWx1ZS5hbHBoYVxyXG4gICAgfTtcclxuICB9XHJcbiAgZWxzZSBpZiAoIHZhbHVlIGluc3RhbmNlb2YgUmVhZE9ubHlQcm9wZXJ0eSApIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHR5cGU6ICdQcm9wZXJ0eScsXHJcbiAgICAgIHZhbHVlOiBzY2VuZXJ5U2VyaWFsaXplKCB2YWx1ZS52YWx1ZSApXHJcbiAgICB9O1xyXG4gIH1cclxuICBlbHNlIGlmICggdmFsdWUgaW5zdGFuY2VvZiBUaW55UHJvcGVydHkgKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0eXBlOiAnVGlueVByb3BlcnR5JyxcclxuICAgICAgdmFsdWU6IHNjZW5lcnlTZXJpYWxpemUoIHZhbHVlLnZhbHVlIClcclxuICAgIH07XHJcbiAgfVxyXG4gIGVsc2UgaWYgKCBQYWludCAmJiB2YWx1ZSBpbnN0YW5jZW9mIFBhaW50ICkge1xyXG4gICAgY29uc3QgcGFpbnRTZXJpYWxpemF0aW9uOiBJbnRlbnRpb25hbEFueSA9IHt9O1xyXG5cclxuICAgIGlmICggdmFsdWUudHJhbnNmb3JtTWF0cml4ICkge1xyXG4gICAgICBwYWludFNlcmlhbGl6YXRpb24udHJhbnNmb3JtTWF0cml4ID0gc2NlbmVyeVNlcmlhbGl6ZSggdmFsdWUudHJhbnNmb3JtTWF0cml4ICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBHcmFkaWVudCAmJiAoIHZhbHVlIGluc3RhbmNlb2YgUmFkaWFsR3JhZGllbnQgfHwgdmFsdWUgaW5zdGFuY2VvZiBMaW5lYXJHcmFkaWVudCApICkge1xyXG4gICAgICBwYWludFNlcmlhbGl6YXRpb24uc3RvcHMgPSB2YWx1ZS5zdG9wcy5tYXAoIHN0b3AgPT4ge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICByYXRpbzogc3RvcC5yYXRpbyxcclxuICAgICAgICAgIHN0b3A6IHNjZW5lcnlTZXJpYWxpemUoIHN0b3AuY29sb3IgKVxyXG4gICAgICAgIH07XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIHBhaW50U2VyaWFsaXphdGlvbi5zdGFydCA9IHNjZW5lcnlTZXJpYWxpemUoIHZhbHVlLnN0YXJ0ICk7XHJcbiAgICAgIHBhaW50U2VyaWFsaXphdGlvbi5lbmQgPSBzY2VuZXJ5U2VyaWFsaXplKCB2YWx1ZS5lbmQgKTtcclxuXHJcbiAgICAgIGlmICggTGluZWFyR3JhZGllbnQgJiYgdmFsdWUgaW5zdGFuY2VvZiBMaW5lYXJHcmFkaWVudCApIHtcclxuICAgICAgICBwYWludFNlcmlhbGl6YXRpb24udHlwZSA9ICdMaW5lYXJHcmFkaWVudCc7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIFJhZGlhbEdyYWRpZW50ICYmIHZhbHVlIGluc3RhbmNlb2YgUmFkaWFsR3JhZGllbnQgKSB7XHJcbiAgICAgICAgcGFpbnRTZXJpYWxpemF0aW9uLnR5cGUgPSAnUmFkaWFsR3JhZGllbnQnO1xyXG4gICAgICAgIHBhaW50U2VyaWFsaXphdGlvbi5zdGFydFJhZGl1cyA9IHZhbHVlLnN0YXJ0UmFkaXVzO1xyXG4gICAgICAgIHBhaW50U2VyaWFsaXphdGlvbi5lbmRSYWRpdXMgPSB2YWx1ZS5lbmRSYWRpdXM7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIFBhdHRlcm4gJiYgdmFsdWUgaW5zdGFuY2VvZiBQYXR0ZXJuICkge1xyXG4gICAgICBwYWludFNlcmlhbGl6YXRpb24udHlwZSA9ICdQYXR0ZXJuJztcclxuICAgICAgcGFpbnRTZXJpYWxpemF0aW9uLnVybCA9IHZhbHVlLmltYWdlLnNyYztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcGFpbnRTZXJpYWxpemF0aW9uO1xyXG4gIH1cclxuICBlbHNlIGlmICggdmFsdWUgaW5zdGFuY2VvZiBOb2RlICkge1xyXG4gICAgY29uc3Qgbm9kZSA9IHZhbHVlO1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnM6IEludGVudGlvbmFsQW55ID0ge307XHJcbiAgICBjb25zdCBzZXR1cDogSW50ZW50aW9uYWxBbnkgPSB7XHJcbiAgICAgIC8vIG1heFdpZHRoXHJcbiAgICAgIC8vIG1heEhlaWdodFxyXG4gICAgICAvLyBjbGlwQXJlYVxyXG4gICAgICAvLyBtb3VzZUFyZWFcclxuICAgICAgLy8gdG91Y2hBcmVhXHJcbiAgICAgIC8vIG1hdHJpeFxyXG4gICAgICAvLyBsb2NhbEJvdW5kc1xyXG4gICAgICAvLyBjaGlsZHJlbiB7QXJyYXkuPG51bWJlcj59IC0gSURzXHJcbiAgICAgIC8vIGhhc0lucHV0TGlzdGVuZXJzIHtib29sZWFufVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgW1xyXG4gICAgICAndmlzaWJsZScsXHJcbiAgICAgICdvcGFjaXR5JyxcclxuICAgICAgJ2Rpc2FibGVkT3BhY2l0eScsXHJcbiAgICAgICdwaWNrYWJsZScsXHJcbiAgICAgICdpbnB1dEVuYWJsZWQnLFxyXG4gICAgICAnY3Vyc29yJyxcclxuICAgICAgJ3RyYW5zZm9ybUJvdW5kcycsXHJcbiAgICAgICdyZW5kZXJlcicsXHJcbiAgICAgICd1c2VzT3BhY2l0eScsXHJcbiAgICAgICdsYXllclNwbGl0JyxcclxuICAgICAgJ2Nzc1RyYW5zZm9ybScsXHJcbiAgICAgICdleGNsdWRlSW52aXNpYmxlJyxcclxuICAgICAgJ3dlYmdsU2NhbGUnLFxyXG4gICAgICAncHJldmVudEZpdCdcclxuICAgIF0uZm9yRWFjaCggc2ltcGxlS2V5ID0+IHtcclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICBpZiAoIG5vZGVbIHNpbXBsZUtleSBdICE9PSBOb2RlLkRFRkFVTFRfTk9ERV9PUFRJT05TWyBzaW1wbGVLZXkgXSApIHtcclxuICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICAgICAgb3B0aW9uc1sgc2ltcGxlS2V5IF0gPSBub2RlWyBzaW1wbGVLZXkgXTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuXHJcbiAgICAvLyBGcm9tIFBhcmFsbGVsRE9NXHJcbiAgICBbXHJcbiAgICAgICd0YWdOYW1lJyxcclxuICAgICAgJ2lubmVyQ29udGVudCcsXHJcbiAgICAgICdhY2Nlc3NpYmxlTmFtZScsXHJcbiAgICAgICdoZWxwVGV4dCdcclxuICAgIF0uZm9yRWFjaCggc2ltcGxlS2V5ID0+IHtcclxuXHJcbiAgICAgIC8vIEFsbCBkZWZhdWx0IHRvIG51bGxcclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICBpZiAoIG5vZGVbIHNpbXBsZUtleSBdICE9PSBudWxsICkge1xyXG4gICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgICAgICBvcHRpb25zWyBzaW1wbGVLZXkgXSA9IG5vZGVbIHNpbXBsZUtleSBdO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgW1xyXG4gICAgICAnbWF4V2lkdGgnLFxyXG4gICAgICAnbWF4SGVpZ2h0JyxcclxuICAgICAgJ2NsaXBBcmVhJyxcclxuICAgICAgJ21vdXNlQXJlYScsXHJcbiAgICAgICd0b3VjaEFyZWEnXHJcbiAgICBdLmZvckVhY2goIHNlcmlhbGl6ZWRLZXkgPT4ge1xyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICAgIGlmICggbm9kZVsgc2VyaWFsaXplZEtleSBdICE9PSBOb2RlLkRFRkFVTFRfTk9ERV9PUFRJT05TWyBzZXJpYWxpemVkS2V5IF0gKSB7XHJcbiAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICAgIHNldHVwWyBzZXJpYWxpemVkS2V5IF0gPSBzY2VuZXJ5U2VyaWFsaXplKCBub2RlWyBzZXJpYWxpemVkS2V5IF0gKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gICAgaWYgKCAhbm9kZS5tYXRyaXguaXNJZGVudGl0eSgpICkge1xyXG4gICAgICBzZXR1cC5tYXRyaXggPSBzY2VuZXJ5U2VyaWFsaXplKCBub2RlLm1hdHJpeCApO1xyXG4gICAgfVxyXG4gICAgaWYgKCBub2RlLl9sb2NhbEJvdW5kc092ZXJyaWRkZW4gKSB7XHJcbiAgICAgIHNldHVwLmxvY2FsQm91bmRzID0gc2NlbmVyeVNlcmlhbGl6ZSggbm9kZS5sb2NhbEJvdW5kcyApO1xyXG4gICAgfVxyXG4gICAgc2V0dXAuY2hpbGRyZW4gPSBub2RlLmNoaWxkcmVuLm1hcCggY2hpbGQgPT4ge1xyXG4gICAgICByZXR1cm4gY2hpbGQuaWQ7XHJcbiAgICB9ICk7XHJcbiAgICBzZXR1cC5oYXNJbnB1dExpc3RlbmVycyA9IG5vZGUuaW5wdXRMaXN0ZW5lcnMubGVuZ3RoID4gMDtcclxuXHJcbiAgICBjb25zdCBzZXJpYWxpemF0aW9uOiBJbnRlbnRpb25hbEFueSA9IHtcclxuICAgICAgaWQ6IG5vZGUuaWQsXHJcbiAgICAgIHR5cGU6ICdOb2RlJyxcclxuICAgICAgdHlwZXM6IGluaGVyaXRhbmNlKCBub2RlLmNvbnN0cnVjdG9yICkubWFwKCB0eXBlID0+IHR5cGUubmFtZSApLmZpbHRlciggbmFtZSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIG5hbWUgJiYgbmFtZSAhPT0gJ09iamVjdCcgJiYgbmFtZSAhPT0gJ05vZGUnO1xyXG4gICAgICB9ICksXHJcbiAgICAgIG5hbWU6IG5vZGUuY29uc3RydWN0b3IubmFtZSxcclxuICAgICAgb3B0aW9uczogb3B0aW9ucyxcclxuICAgICAgc2V0dXA6IHNldHVwXHJcbiAgICB9O1xyXG5cclxuICAgIGlmICggUGF0aCAmJiBub2RlIGluc3RhbmNlb2YgUGF0aCApIHtcclxuICAgICAgc2VyaWFsaXphdGlvbi50eXBlID0gJ1BhdGgnO1xyXG4gICAgICBzZXR1cC5wYXRoID0gc2NlbmVyeVNlcmlhbGl6ZSggbm9kZS5zaGFwZSApO1xyXG4gICAgICBpZiAoIG5vZGUuYm91bmRzTWV0aG9kICE9PSBQYXRoLkRFRkFVTFRfUEFUSF9PUFRJT05TLmJvdW5kc01ldGhvZCApIHtcclxuICAgICAgICBvcHRpb25zLmJvdW5kc01ldGhvZCA9IG5vZGUuYm91bmRzTWV0aG9kO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBDaXJjbGUgJiYgbm9kZSBpbnN0YW5jZW9mIENpcmNsZSApIHtcclxuICAgICAgc2VyaWFsaXphdGlvbi50eXBlID0gJ0NpcmNsZSc7XHJcbiAgICAgIG9wdGlvbnMucmFkaXVzID0gbm9kZS5yYWRpdXM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBMaW5lICYmIG5vZGUgaW5zdGFuY2VvZiBMaW5lICkge1xyXG4gICAgICBzZXJpYWxpemF0aW9uLnR5cGUgPSAnTGluZSc7XHJcbiAgICAgIG9wdGlvbnMueDEgPSBub2RlLngxO1xyXG4gICAgICBvcHRpb25zLnkxID0gbm9kZS55MTtcclxuICAgICAgb3B0aW9ucy54MiA9IG5vZGUueDI7XHJcbiAgICAgIG9wdGlvbnMueTIgPSBub2RlLnkyO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggUmVjdGFuZ2xlICYmIG5vZGUgaW5zdGFuY2VvZiBSZWN0YW5nbGUgKSB7XHJcbiAgICAgIHNlcmlhbGl6YXRpb24udHlwZSA9ICdSZWN0YW5nbGUnO1xyXG4gICAgICBvcHRpb25zLnJlY3RYID0gbm9kZS5yZWN0WDtcclxuICAgICAgb3B0aW9ucy5yZWN0WSA9IG5vZGUucmVjdFk7XHJcbiAgICAgIG9wdGlvbnMucmVjdFdpZHRoID0gbm9kZS5yZWN0V2lkdGg7XHJcbiAgICAgIG9wdGlvbnMucmVjdEhlaWdodCA9IG5vZGUucmVjdEhlaWdodDtcclxuICAgICAgb3B0aW9ucy5jb3JuZXJYUmFkaXVzID0gbm9kZS5jb3JuZXJYUmFkaXVzO1xyXG4gICAgICBvcHRpb25zLmNvcm5lcllSYWRpdXMgPSBub2RlLmNvcm5lcllSYWRpdXM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBUZXh0ICYmIG5vZGUgaW5zdGFuY2VvZiBUZXh0ICkge1xyXG4gICAgICBzZXJpYWxpemF0aW9uLnR5cGUgPSAnVGV4dCc7XHJcbiAgICAgIC8vIFRPRE86IGRlZmF1bHRzIGZvciBUZXh0PyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gICAgICBpZiAoIG5vZGUuYm91bmRzTWV0aG9kICE9PSAnaHlicmlkJyApIHtcclxuICAgICAgICBvcHRpb25zLmJvdW5kc01ldGhvZCA9IG5vZGUuYm91bmRzTWV0aG9kO1xyXG4gICAgICB9XHJcbiAgICAgIG9wdGlvbnMuc3RyaW5nID0gbm9kZS5zdHJpbmc7XHJcbiAgICAgIG9wdGlvbnMuZm9udCA9IG5vZGUuZm9udDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIEltYWdlICYmIG5vZGUgaW5zdGFuY2VvZiBJbWFnZSApIHtcclxuICAgICAgc2VyaWFsaXphdGlvbi50eXBlID0gJ0ltYWdlJztcclxuICAgICAgW1xyXG4gICAgICAgICdpbWFnZU9wYWNpdHknLFxyXG4gICAgICAgICdpbml0aWFsV2lkdGgnLFxyXG4gICAgICAgICdpbml0aWFsSGVpZ2h0JyxcclxuICAgICAgICAnbWlwbWFwQmlhcycsXHJcbiAgICAgICAgJ21pcG1hcEluaXRpYWxMZXZlbCcsXHJcbiAgICAgICAgJ21pcG1hcE1heExldmVsJ1xyXG4gICAgICBdLmZvckVhY2goIHNpbXBsZUtleSA9PiB7XHJcbiAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICAgIGlmICggbm9kZVsgc2ltcGxlS2V5IF0gIT09IEltYWdlLkRFRkFVTFRfSU1BR0VfT1BUSU9OU1sgc2ltcGxlS2V5IF0gKSB7XHJcbiAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICAgICAgICBvcHRpb25zWyBzaW1wbGVLZXkgXSA9IG5vZGVbIHNpbXBsZUtleSBdO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG5cclxuICAgICAgc2V0dXAud2lkdGggPSBub2RlLmltYWdlV2lkdGg7XHJcbiAgICAgIHNldHVwLmhlaWdodCA9IG5vZGUuaW1hZ2VIZWlnaHQ7XHJcblxyXG4gICAgICAvLyBJbml0aWFsaXplZCB3aXRoIGEgbWlwbWFwXHJcbiAgICAgIGlmICggbm9kZS5fbWlwbWFwRGF0YSApIHtcclxuICAgICAgICBzZXR1cC5pbWFnZVR5cGUgPSAnbWlwbWFwRGF0YSc7XHJcbiAgICAgICAgc2V0dXAubWlwbWFwRGF0YSA9IG5vZGUuX21pcG1hcERhdGEubWFwKCBsZXZlbCA9PiB7XHJcbiAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB1cmw6IGxldmVsLnVybCxcclxuICAgICAgICAgICAgd2lkdGg6IGxldmVsLndpZHRoLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGxldmVsLmhlaWdodFxyXG4gICAgICAgICAgICAvLyB3aWxsIHJlY29uc3RpdHV0ZSBpbWcge0hUTUxJbWFnZUVsZW1lbnR9IGFuZCBjYW52YXMge0hUTUxDYW52YXNFbGVtZW50fVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgaWYgKCBub2RlLl9taXBtYXAgKSB7XHJcbiAgICAgICAgICBzZXR1cC5nZW5lcmF0ZU1pcG1hcHMgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIG5vZGUuX2ltYWdlIGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCApIHtcclxuICAgICAgICAgIHNldHVwLmltYWdlVHlwZSA9ICdpbWFnZSc7XHJcbiAgICAgICAgICBzZXR1cC5zcmMgPSBub2RlLl9pbWFnZS5zcmM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCBub2RlLl9pbWFnZSBpbnN0YW5jZW9mIEhUTUxDYW52YXNFbGVtZW50ICkge1xyXG4gICAgICAgICAgc2V0dXAuaW1hZ2VUeXBlID0gJ2NhbnZhcyc7XHJcbiAgICAgICAgICBzZXR1cC5zcmMgPSBub2RlLl9pbWFnZS50b0RhdGFVUkwoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoICggQ2FudmFzTm9kZSAmJiBub2RlIGluc3RhbmNlb2YgQ2FudmFzTm9kZSApIHx8XHJcbiAgICAgICAgICggV2ViR0xOb2RlICYmIG5vZGUgaW5zdGFuY2VvZiBXZWJHTE5vZGUgKSApIHtcclxuICAgICAgc2VyaWFsaXphdGlvbi50eXBlID0gKCBDYW52YXNOb2RlICYmIG5vZGUgaW5zdGFuY2VvZiBDYW52YXNOb2RlICkgPyAnQ2FudmFzTm9kZScgOiAnV2ViR0xOb2RlJztcclxuXHJcbiAgICAgIHNldHVwLmNhbnZhc0JvdW5kcyA9IHNjZW5lcnlTZXJpYWxpemUoIG5vZGUuY2FudmFzQm91bmRzICk7XHJcblxyXG4gICAgICAvLyBJZGVudGlmeSB0aGUgYXBwcm94aW1hdGUgc2NhbGUgb2YgdGhlIG5vZGVcclxuICAgICAgLy8gbGV0IHNjYWxlID0gTWF0aC5taW4oIDUsIG5vZGUuX2RyYXdhYmxlcy5sZW5ndGggPyAoIDEgLyBfLm1lYW4oIG5vZGUuX2RyYXdhYmxlcy5tYXAoIGRyYXdhYmxlID0+IHtcclxuICAgICAgLy8gICBjb25zdCBzY2FsZVZlY3RvciA9IGRyYXdhYmxlLmluc3RhbmNlLnRyYWlsLmdldE1hdHJpeCgpLmdldFNjYWxlVmVjdG9yKCk7XHJcbiAgICAgIC8vICAgcmV0dXJuICggc2NhbGVWZWN0b3IueCArIHNjYWxlVmVjdG9yLnkgKSAvIDI7XHJcbiAgICAgIC8vIH0gKSApICkgOiAxICk7XHJcbiAgICAgIGNvbnN0IHNjYWxlID0gMTtcclxuICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcclxuICAgICAgY2FudmFzLndpZHRoID0gTWF0aC5jZWlsKCBub2RlLmNhbnZhc0JvdW5kcy53aWR0aCAqIHNjYWxlICk7XHJcbiAgICAgIGNhbnZhcy5oZWlnaHQgPSBNYXRoLmNlaWwoIG5vZGUuY2FudmFzQm91bmRzLmhlaWdodCAqIHNjYWxlICk7XHJcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCggJzJkJyApITtcclxuICAgICAgY29uc3Qgd3JhcHBlciA9IG5ldyBDYW52YXNDb250ZXh0V3JhcHBlciggY2FudmFzLCBjb250ZXh0ICk7XHJcbiAgICAgIGNvbnN0IG1hdHJpeCA9IE1hdHJpeDMuc2NhbGUoIDEgLyBzY2FsZSApO1xyXG4gICAgICB3cmFwcGVyLmNvbnRleHQuc2V0VHJhbnNmb3JtKCBzY2FsZSwgMCwgMCwgc2NhbGUsIC1ub2RlLmNhbnZhc0JvdW5kcy5sZWZ0LCAtbm9kZS5jYW52YXNCb3VuZHMudG9wICk7XHJcbiAgICAgIG5vZGUucmVuZGVyVG9DYW52YXNTZWxmKCB3cmFwcGVyLCBtYXRyaXggKTtcclxuICAgICAgc2V0dXAudXJsID0gY2FudmFzLnRvRGF0YVVSTCgpO1xyXG4gICAgICBzZXR1cC5zY2FsZSA9IHNjYWxlO1xyXG4gICAgICBzZXR1cC5vZmZzZXQgPSBzY2VuZXJ5U2VyaWFsaXplKCBub2RlLmNhbnZhc0JvdW5kcy5sZWZ0VG9wICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBET00gJiYgbm9kZSBpbnN0YW5jZW9mIERPTSApIHtcclxuICAgICAgc2VyaWFsaXphdGlvbi50eXBlID0gJ0RPTSc7XHJcbiAgICAgIHNlcmlhbGl6YXRpb24uZWxlbWVudCA9IG5ldyB3aW5kb3cuWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKCBub2RlLmVsZW1lbnQgKTtcclxuICAgICAgaWYgKCBub2RlLmVsZW1lbnQgaW5zdGFuY2VvZiB3aW5kb3cuSFRNTENhbnZhc0VsZW1lbnQgKSB7XHJcbiAgICAgICAgc2VyaWFsaXphdGlvbi5kYXRhVVJMID0gbm9kZS5lbGVtZW50LnRvRGF0YVVSTCgpO1xyXG4gICAgICB9XHJcbiAgICAgIG9wdGlvbnMucHJldmVudFRyYW5zZm9ybSA9IG5vZGUucHJldmVudFRyYW5zZm9ybTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBQYWludGFibGVcclxuICAgIGlmICggKCBQYXRoICYmIG5vZGUgaW5zdGFuY2VvZiBQYXRoICkgfHxcclxuICAgICAgICAgKCBUZXh0ICYmIG5vZGUgaW5zdGFuY2VvZiBUZXh0ICkgKSB7XHJcblxyXG4gICAgICBbXHJcbiAgICAgICAgJ2ZpbGxQaWNrYWJsZScsXHJcbiAgICAgICAgJ3N0cm9rZVBpY2thYmxlJyxcclxuICAgICAgICAnbGluZVdpZHRoJyxcclxuICAgICAgICAnbGluZUNhcCcsXHJcbiAgICAgICAgJ2xpbmVKb2luJyxcclxuICAgICAgICAnbGluZURhc2hPZmZzZXQnLFxyXG4gICAgICAgICdtaXRlckxpbWl0J1xyXG4gICAgICBdLmZvckVhY2goIHNpbXBsZUtleSA9PiB7XHJcbiAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICAgIGlmICggbm9kZVsgc2ltcGxlS2V5IF0gIT09IFBBSU5UQUJMRV9ERUZBVUxUX09QVElPTlNbIHNpbXBsZUtleSBdICkge1xyXG4gICAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICAgICAgb3B0aW9uc1sgc2ltcGxlS2V5IF0gPSBub2RlWyBzaW1wbGVLZXkgXTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIC8vIElnbm9yaW5nIGNhY2hlZFBhaW50cywgc2luY2Ugd2UnZCAnZG91YmxlJyBpdCBhbnl3YXlzXHJcblxyXG4gICAgICBpZiAoIG5vZGUuZmlsbCAhPT0gUEFJTlRBQkxFX0RFRkFVTFRfT1BUSU9OUy5maWxsICkge1xyXG4gICAgICAgIHNldHVwLmZpbGwgPSBzY2VuZXJ5U2VyaWFsaXplKCBub2RlLmZpbGwgKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIG5vZGUuc3Ryb2tlICE9PSBQQUlOVEFCTEVfREVGQVVMVF9PUFRJT05TLnN0cm9rZSApIHtcclxuICAgICAgICBzZXR1cC5zdHJva2UgPSBzY2VuZXJ5U2VyaWFsaXplKCBub2RlLnN0cm9rZSApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggbm9kZS5saW5lRGFzaC5sZW5ndGggKSB7XHJcbiAgICAgICAgc2V0dXAubGluZURhc2ggPSBzY2VuZXJ5U2VyaWFsaXplKCBub2RlLmxpbmVEYXNoICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc2VyaWFsaXphdGlvbjtcclxuICB9XHJcbiAgZWxzZSBpZiAoIHZhbHVlIGluc3RhbmNlb2YgRGlzcGxheSApIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHR5cGU6ICdEaXNwbGF5JyxcclxuICAgICAgd2lkdGg6IHZhbHVlLndpZHRoLFxyXG4gICAgICBoZWlnaHQ6IHZhbHVlLmhlaWdodCxcclxuICAgICAgYmFja2dyb3VuZENvbG9yOiBzY2VuZXJ5U2VyaWFsaXplKCB2YWx1ZS5iYWNrZ3JvdW5kQ29sb3IgKSxcclxuICAgICAgdHJlZToge1xyXG4gICAgICAgIHR5cGU6ICdTdWJ0cmVlJyxcclxuICAgICAgICByb290Tm9kZUlkOiB2YWx1ZS5yb290Tm9kZS5pZCxcclxuICAgICAgICBub2Rlczogc2VyaWFsaXplQ29ubmVjdGVkTm9kZXMoIHZhbHVlLnJvb3ROb2RlIClcclxuICAgICAgfVxyXG4gICAgfTtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0eXBlOiAndmFsdWUnLFxyXG4gICAgICB2YWx1ZTogdmFsdWVcclxuICAgIH07XHJcbiAgfVxyXG59O1xyXG5cclxuY29uc3Qgc2VyaWFsaXplQ29ubmVjdGVkTm9kZXMgPSAoIHJvb3ROb2RlOiBOb2RlICk6IEludGVudGlvbmFsQW55ID0+IHtcclxuICByZXR1cm4gcm9vdE5vZGUuZ2V0U3VidHJlZU5vZGVzKCkubWFwKCBzY2VuZXJ5U2VyaWFsaXplICk7XHJcbn07XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnc2NlbmVyeVNlcmlhbGl6ZScsIHNjZW5lcnlTZXJpYWxpemUgKTtcclxuZXhwb3J0IHsgc2NlbmVyeVNlcmlhbGl6ZSBhcyBkZWZhdWx0LCBzZXJpYWxpemVDb25uZWN0ZWROb2RlcyB9OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLE9BQU8sTUFBTSw0QkFBNEI7QUFDaEQsT0FBT0MsT0FBTyxNQUFNLDRCQUE0QjtBQUNoRCxPQUFPQyxPQUFPLE1BQU0sNEJBQTRCO0FBQ2hELFNBQVNDLEtBQUssUUFBUSw2QkFBNkI7QUFDbkQsT0FBT0MsV0FBVyxNQUFNLHNDQUFzQztBQUM5RCxTQUFTQyxvQkFBb0IsRUFBRUMsVUFBVSxFQUFFQyxNQUFNLEVBQUVDLEtBQUssRUFBRUMsT0FBTyxFQUFFQyxHQUFHLEVBQUVDLFFBQVEsRUFBRUMsS0FBSyxFQUFFQyxJQUFJLEVBQUVDLGNBQWMsRUFBRUMsSUFBSSxFQUFFQyxLQUFLLEVBQUVDLHlCQUF5QixFQUFFQyxJQUFJLEVBQUVDLE9BQU8sRUFBRUMsY0FBYyxFQUFFQyxTQUFTLEVBQUVDLE9BQU8sRUFBRUMsSUFBSSxFQUFFQyxTQUFTLFFBQVEsZUFBZTtBQUVoUCxPQUFPQyxnQkFBZ0IsTUFBTSxzQ0FBc0M7QUFDbkUsT0FBT0MsWUFBWSxNQUFNLGtDQUFrQztBQUUzRCxNQUFNQyxnQkFBZ0IsR0FBS0MsS0FBYyxJQUFzQjtFQUM3RCxJQUFLQSxLQUFLLFlBQVkxQixPQUFPLEVBQUc7SUFDOUIsT0FBTztNQUNMMkIsSUFBSSxFQUFFLFNBQVM7TUFDZkMsQ0FBQyxFQUFJRixLQUFLLENBQUdFLENBQUM7TUFDZEMsQ0FBQyxFQUFJSCxLQUFLLENBQUdHO0lBQ2YsQ0FBQztFQUNILENBQUMsTUFDSSxJQUFLSCxLQUFLLFlBQVk1QixPQUFPLEVBQUc7SUFDbkMsT0FBTztNQUNMNkIsSUFBSSxFQUFFLFNBQVM7TUFDZkcsR0FBRyxFQUFFSixLQUFLLENBQUNJLEdBQUcsQ0FBQyxDQUFDO01BQ2hCQyxHQUFHLEVBQUVMLEtBQUssQ0FBQ0ssR0FBRyxDQUFDLENBQUM7TUFDaEJDLEdBQUcsRUFBRU4sS0FBSyxDQUFDTSxHQUFHLENBQUMsQ0FBQztNQUNoQkMsR0FBRyxFQUFFUCxLQUFLLENBQUNPLEdBQUcsQ0FBQyxDQUFDO01BQ2hCQyxHQUFHLEVBQUVSLEtBQUssQ0FBQ1EsR0FBRyxDQUFDLENBQUM7TUFDaEJDLEdBQUcsRUFBRVQsS0FBSyxDQUFDUyxHQUFHLENBQUMsQ0FBQztNQUNoQkMsR0FBRyxFQUFFVixLQUFLLENBQUNVLEdBQUcsQ0FBQyxDQUFDO01BQ2hCQyxHQUFHLEVBQUVYLEtBQUssQ0FBQ1csR0FBRyxDQUFDLENBQUM7TUFDaEJDLEdBQUcsRUFBRVosS0FBSyxDQUFDWSxHQUFHLENBQUM7SUFDakIsQ0FBQztFQUNILENBQUMsTUFDSSxJQUFLWixLQUFLLFlBQVkzQixPQUFPLEVBQUc7SUFDbkMsTUFBTXdDLE1BQU0sR0FBR2IsS0FBSztJQUNwQixPQUFPO01BQ0xDLElBQUksRUFBRSxTQUFTO01BQ2ZhLElBQUksRUFBRUQsTUFBTSxDQUFDQyxJQUFJO01BQ2pCQyxJQUFJLEVBQUVGLE1BQU0sQ0FBQ0UsSUFBSTtNQUNqQkMsSUFBSSxFQUFFSCxNQUFNLENBQUNHLElBQUk7TUFDakJDLElBQUksRUFBRUosTUFBTSxDQUFDSTtJQUNmLENBQUM7RUFDSCxDQUFDLE1BQ0ksSUFBS2pCLEtBQUssWUFBWXpCLEtBQUssRUFBRztJQUNqQyxPQUFPO01BQ0wwQixJQUFJLEVBQUUsT0FBTztNQUNiaUIsSUFBSSxFQUFFbEIsS0FBSyxDQUFDbUIsVUFBVSxDQUFDO0lBQ3pCLENBQUM7RUFDSCxDQUFDLE1BQ0ksSUFBS0MsS0FBSyxDQUFDQyxPQUFPLENBQUVyQixLQUFNLENBQUMsRUFBRztJQUNqQyxPQUFPO01BQ0xDLElBQUksRUFBRSxPQUFPO01BQ2JELEtBQUssRUFBRUEsS0FBSyxDQUFDc0IsR0FBRyxDQUFFdkIsZ0JBQWlCO0lBQ3JDLENBQUM7RUFDSCxDQUFDLE1BQ0ksSUFBS0MsS0FBSyxZQUFZcEIsS0FBSyxFQUFHO0lBQ2pDLE9BQU87TUFDTHFCLElBQUksRUFBRSxPQUFPO01BQ2JzQixHQUFHLEVBQUV2QixLQUFLLENBQUN1QixHQUFHO01BQ2RDLEtBQUssRUFBRXhCLEtBQUssQ0FBQ3dCLEtBQUs7TUFDbEJDLElBQUksRUFBRXpCLEtBQUssQ0FBQ3lCLElBQUk7TUFDaEJDLEtBQUssRUFBRTFCLEtBQUssQ0FBQzBCO0lBQ2YsQ0FBQztFQUNILENBQUMsTUFDSSxJQUFLMUIsS0FBSyxZQUFZSCxnQkFBZ0IsRUFBRztJQUM1QyxPQUFPO01BQ0xJLElBQUksRUFBRSxVQUFVO01BQ2hCRCxLQUFLLEVBQUVELGdCQUFnQixDQUFFQyxLQUFLLENBQUNBLEtBQU07SUFDdkMsQ0FBQztFQUNILENBQUMsTUFDSSxJQUFLQSxLQUFLLFlBQVlGLFlBQVksRUFBRztJQUN4QyxPQUFPO01BQ0xHLElBQUksRUFBRSxjQUFjO01BQ3BCRCxLQUFLLEVBQUVELGdCQUFnQixDQUFFQyxLQUFLLENBQUNBLEtBQU07SUFDdkMsQ0FBQztFQUNILENBQUMsTUFDSSxJQUFLWixLQUFLLElBQUlZLEtBQUssWUFBWVosS0FBSyxFQUFHO0lBQzFDLE1BQU11QyxrQkFBa0MsR0FBRyxDQUFDLENBQUM7SUFFN0MsSUFBSzNCLEtBQUssQ0FBQzRCLGVBQWUsRUFBRztNQUMzQkQsa0JBQWtCLENBQUNDLGVBQWUsR0FBRzdCLGdCQUFnQixDQUFFQyxLQUFLLENBQUM0QixlQUFnQixDQUFDO0lBQ2hGO0lBRUEsSUFBSzdDLFFBQVEsS0FBTWlCLEtBQUssWUFBWVIsY0FBYyxJQUFJUSxLQUFLLFlBQVlkLGNBQWMsQ0FBRSxFQUFHO01BQ3hGeUMsa0JBQWtCLENBQUNFLEtBQUssR0FBRzdCLEtBQUssQ0FBQzZCLEtBQUssQ0FBQ1AsR0FBRyxDQUFFUSxJQUFJLElBQUk7UUFDbEQsT0FBTztVQUNMQyxLQUFLLEVBQUVELElBQUksQ0FBQ0MsS0FBSztVQUNqQkQsSUFBSSxFQUFFL0IsZ0JBQWdCLENBQUUrQixJQUFJLENBQUNFLEtBQU07UUFDckMsQ0FBQztNQUNILENBQUUsQ0FBQztNQUVITCxrQkFBa0IsQ0FBQ00sS0FBSyxHQUFHbEMsZ0JBQWdCLENBQUVDLEtBQUssQ0FBQ2lDLEtBQU0sQ0FBQztNQUMxRE4sa0JBQWtCLENBQUNPLEdBQUcsR0FBR25DLGdCQUFnQixDQUFFQyxLQUFLLENBQUNrQyxHQUFJLENBQUM7TUFFdEQsSUFBS2hELGNBQWMsSUFBSWMsS0FBSyxZQUFZZCxjQUFjLEVBQUc7UUFDdkR5QyxrQkFBa0IsQ0FBQzFCLElBQUksR0FBRyxnQkFBZ0I7TUFDNUMsQ0FBQyxNQUNJLElBQUtULGNBQWMsSUFBSVEsS0FBSyxZQUFZUixjQUFjLEVBQUc7UUFDNURtQyxrQkFBa0IsQ0FBQzFCLElBQUksR0FBRyxnQkFBZ0I7UUFDMUMwQixrQkFBa0IsQ0FBQ1EsV0FBVyxHQUFHbkMsS0FBSyxDQUFDbUMsV0FBVztRQUNsRFIsa0JBQWtCLENBQUNTLFNBQVMsR0FBR3BDLEtBQUssQ0FBQ29DLFNBQVM7TUFDaEQ7SUFDRjtJQUVBLElBQUs3QyxPQUFPLElBQUlTLEtBQUssWUFBWVQsT0FBTyxFQUFHO01BQ3pDb0Msa0JBQWtCLENBQUMxQixJQUFJLEdBQUcsU0FBUztNQUNuQzBCLGtCQUFrQixDQUFDVSxHQUFHLEdBQUdyQyxLQUFLLENBQUNzQyxLQUFLLENBQUNDLEdBQUc7SUFDMUM7SUFFQSxPQUFPWixrQkFBa0I7RUFDM0IsQ0FBQyxNQUNJLElBQUszQixLQUFLLFlBQVliLElBQUksRUFBRztJQUNoQyxNQUFNcUQsSUFBSSxHQUFHeEMsS0FBSztJQUVsQixNQUFNeUMsT0FBdUIsR0FBRyxDQUFDLENBQUM7SUFDbEMsTUFBTUMsS0FBcUIsR0FBRztNQUM1QjtNQUNBO01BQ0E7TUFDQTtNQUNBO01BQ0E7TUFDQTtNQUNBO01BQ0E7SUFBQSxDQUVEO0lBRUQsQ0FDRSxTQUFTLEVBQ1QsU0FBUyxFQUNULGlCQUFpQixFQUNqQixVQUFVLEVBQ1YsY0FBYyxFQUNkLFFBQVEsRUFDUixpQkFBaUIsRUFDakIsVUFBVSxFQUNWLGFBQWEsRUFDYixZQUFZLEVBQ1osY0FBYyxFQUNkLGtCQUFrQixFQUNsQixZQUFZLEVBQ1osWUFBWSxDQUNiLENBQUNDLE9BQU8sQ0FBRUMsU0FBUyxJQUFJO01BQ3RCO01BQ0EsSUFBS0osSUFBSSxDQUFFSSxTQUFTLENBQUUsS0FBS3pELElBQUksQ0FBQzBELG9CQUFvQixDQUFFRCxTQUFTLENBQUUsRUFBRztRQUNsRTtRQUNBSCxPQUFPLENBQUVHLFNBQVMsQ0FBRSxHQUFHSixJQUFJLENBQUVJLFNBQVMsQ0FBRTtNQUMxQztJQUNGLENBQUUsQ0FBQzs7SUFHSDtJQUNBLENBQ0UsU0FBUyxFQUNULGNBQWMsRUFDZCxnQkFBZ0IsRUFDaEIsVUFBVSxDQUNYLENBQUNELE9BQU8sQ0FBRUMsU0FBUyxJQUFJO01BRXRCO01BQ0E7TUFDQSxJQUFLSixJQUFJLENBQUVJLFNBQVMsQ0FBRSxLQUFLLElBQUksRUFBRztRQUNoQztRQUNBSCxPQUFPLENBQUVHLFNBQVMsQ0FBRSxHQUFHSixJQUFJLENBQUVJLFNBQVMsQ0FBRTtNQUMxQztJQUNGLENBQUUsQ0FBQztJQUVILENBQ0UsVUFBVSxFQUNWLFdBQVcsRUFDWCxVQUFVLEVBQ1YsV0FBVyxFQUNYLFdBQVcsQ0FDWixDQUFDRCxPQUFPLENBQUVHLGFBQWEsSUFBSTtNQUMxQjtNQUNBLElBQUtOLElBQUksQ0FBRU0sYUFBYSxDQUFFLEtBQUszRCxJQUFJLENBQUMwRCxvQkFBb0IsQ0FBRUMsYUFBYSxDQUFFLEVBQUc7UUFDMUU7UUFDQUosS0FBSyxDQUFFSSxhQUFhLENBQUUsR0FBRy9DLGdCQUFnQixDQUFFeUMsSUFBSSxDQUFFTSxhQUFhLENBQUcsQ0FBQztNQUNwRTtJQUNGLENBQUUsQ0FBQztJQUNILElBQUssQ0FBQ04sSUFBSSxDQUFDTyxNQUFNLENBQUNDLFVBQVUsQ0FBQyxDQUFDLEVBQUc7TUFDL0JOLEtBQUssQ0FBQ0ssTUFBTSxHQUFHaEQsZ0JBQWdCLENBQUV5QyxJQUFJLENBQUNPLE1BQU8sQ0FBQztJQUNoRDtJQUNBLElBQUtQLElBQUksQ0FBQ1Msc0JBQXNCLEVBQUc7TUFDakNQLEtBQUssQ0FBQ1EsV0FBVyxHQUFHbkQsZ0JBQWdCLENBQUV5QyxJQUFJLENBQUNVLFdBQVksQ0FBQztJQUMxRDtJQUNBUixLQUFLLENBQUNTLFFBQVEsR0FBR1gsSUFBSSxDQUFDVyxRQUFRLENBQUM3QixHQUFHLENBQUU4QixLQUFLLElBQUk7TUFDM0MsT0FBT0EsS0FBSyxDQUFDQyxFQUFFO0lBQ2pCLENBQUUsQ0FBQztJQUNIWCxLQUFLLENBQUNZLGlCQUFpQixHQUFHZCxJQUFJLENBQUNlLGNBQWMsQ0FBQ0MsTUFBTSxHQUFHLENBQUM7SUFFeEQsTUFBTUMsYUFBNkIsR0FBRztNQUNwQ0osRUFBRSxFQUFFYixJQUFJLENBQUNhLEVBQUU7TUFDWHBELElBQUksRUFBRSxNQUFNO01BQ1p5RCxLQUFLLEVBQUVsRixXQUFXLENBQUVnRSxJQUFJLENBQUNtQixXQUFZLENBQUMsQ0FBQ3JDLEdBQUcsQ0FBRXJCLElBQUksSUFBSUEsSUFBSSxDQUFDMkQsSUFBSyxDQUFDLENBQUNDLE1BQU0sQ0FBRUQsSUFBSSxJQUFJO1FBQzlFLE9BQU9BLElBQUksSUFBSUEsSUFBSSxLQUFLLFFBQVEsSUFBSUEsSUFBSSxLQUFLLE1BQU07TUFDckQsQ0FBRSxDQUFDO01BQ0hBLElBQUksRUFBRXBCLElBQUksQ0FBQ21CLFdBQVcsQ0FBQ0MsSUFBSTtNQUMzQm5CLE9BQU8sRUFBRUEsT0FBTztNQUNoQkMsS0FBSyxFQUFFQTtJQUNULENBQUM7SUFFRCxJQUFLcEQsSUFBSSxJQUFJa0QsSUFBSSxZQUFZbEQsSUFBSSxFQUFHO01BQ2xDbUUsYUFBYSxDQUFDeEQsSUFBSSxHQUFHLE1BQU07TUFDM0J5QyxLQUFLLENBQUN4QixJQUFJLEdBQUduQixnQkFBZ0IsQ0FBRXlDLElBQUksQ0FBQ3NCLEtBQU0sQ0FBQztNQUMzQyxJQUFLdEIsSUFBSSxDQUFDdUIsWUFBWSxLQUFLekUsSUFBSSxDQUFDMEUsb0JBQW9CLENBQUNELFlBQVksRUFBRztRQUNsRXRCLE9BQU8sQ0FBQ3NCLFlBQVksR0FBR3ZCLElBQUksQ0FBQ3VCLFlBQVk7TUFDMUM7SUFDRjtJQUVBLElBQUtwRixNQUFNLElBQUk2RCxJQUFJLFlBQVk3RCxNQUFNLEVBQUc7TUFDdEM4RSxhQUFhLENBQUN4RCxJQUFJLEdBQUcsUUFBUTtNQUM3QndDLE9BQU8sQ0FBQ3dCLE1BQU0sR0FBR3pCLElBQUksQ0FBQ3lCLE1BQU07SUFDOUI7SUFFQSxJQUFLaEYsSUFBSSxJQUFJdUQsSUFBSSxZQUFZdkQsSUFBSSxFQUFHO01BQ2xDd0UsYUFBYSxDQUFDeEQsSUFBSSxHQUFHLE1BQU07TUFDM0J3QyxPQUFPLENBQUN5QixFQUFFLEdBQUcxQixJQUFJLENBQUMwQixFQUFFO01BQ3BCekIsT0FBTyxDQUFDMEIsRUFBRSxHQUFHM0IsSUFBSSxDQUFDMkIsRUFBRTtNQUNwQjFCLE9BQU8sQ0FBQzJCLEVBQUUsR0FBRzVCLElBQUksQ0FBQzRCLEVBQUU7TUFDcEIzQixPQUFPLENBQUM0QixFQUFFLEdBQUc3QixJQUFJLENBQUM2QixFQUFFO0lBQ3RCO0lBRUEsSUFBSzVFLFNBQVMsSUFBSStDLElBQUksWUFBWS9DLFNBQVMsRUFBRztNQUM1Q2dFLGFBQWEsQ0FBQ3hELElBQUksR0FBRyxXQUFXO01BQ2hDd0MsT0FBTyxDQUFDNkIsS0FBSyxHQUFHOUIsSUFBSSxDQUFDOEIsS0FBSztNQUMxQjdCLE9BQU8sQ0FBQzhCLEtBQUssR0FBRy9CLElBQUksQ0FBQytCLEtBQUs7TUFDMUI5QixPQUFPLENBQUMrQixTQUFTLEdBQUdoQyxJQUFJLENBQUNnQyxTQUFTO01BQ2xDL0IsT0FBTyxDQUFDZ0MsVUFBVSxHQUFHakMsSUFBSSxDQUFDaUMsVUFBVTtNQUNwQ2hDLE9BQU8sQ0FBQ2lDLGFBQWEsR0FBR2xDLElBQUksQ0FBQ2tDLGFBQWE7TUFDMUNqQyxPQUFPLENBQUNrQyxhQUFhLEdBQUduQyxJQUFJLENBQUNtQyxhQUFhO0lBQzVDO0lBRUEsSUFBS2hGLElBQUksSUFBSTZDLElBQUksWUFBWTdDLElBQUksRUFBRztNQUNsQzhELGFBQWEsQ0FBQ3hELElBQUksR0FBRyxNQUFNO01BQzNCO01BQ0EsSUFBS3VDLElBQUksQ0FBQ3VCLFlBQVksS0FBSyxRQUFRLEVBQUc7UUFDcEN0QixPQUFPLENBQUNzQixZQUFZLEdBQUd2QixJQUFJLENBQUN1QixZQUFZO01BQzFDO01BQ0F0QixPQUFPLENBQUNtQyxNQUFNLEdBQUdwQyxJQUFJLENBQUNvQyxNQUFNO01BQzVCbkMsT0FBTyxDQUFDb0MsSUFBSSxHQUFHckMsSUFBSSxDQUFDcUMsSUFBSTtJQUMxQjtJQUVBLElBQUs3RixLQUFLLElBQUl3RCxJQUFJLFlBQVl4RCxLQUFLLEVBQUc7TUFDcEN5RSxhQUFhLENBQUN4RCxJQUFJLEdBQUcsT0FBTztNQUM1QixDQUNFLGNBQWMsRUFDZCxjQUFjLEVBQ2QsZUFBZSxFQUNmLFlBQVksRUFDWixvQkFBb0IsRUFDcEIsZ0JBQWdCLENBQ2pCLENBQUMwQyxPQUFPLENBQUVDLFNBQVMsSUFBSTtRQUN0QjtRQUNBLElBQUtKLElBQUksQ0FBRUksU0FBUyxDQUFFLEtBQUs1RCxLQUFLLENBQUM4RixxQkFBcUIsQ0FBRWxDLFNBQVMsQ0FBRSxFQUFHO1VBQ3BFO1VBQ0FILE9BQU8sQ0FBRUcsU0FBUyxDQUFFLEdBQUdKLElBQUksQ0FBRUksU0FBUyxDQUFFO1FBQzFDO01BQ0YsQ0FBRSxDQUFDO01BRUhGLEtBQUssQ0FBQ3FDLEtBQUssR0FBR3ZDLElBQUksQ0FBQ3dDLFVBQVU7TUFDN0J0QyxLQUFLLENBQUN1QyxNQUFNLEdBQUd6QyxJQUFJLENBQUMwQyxXQUFXOztNQUUvQjtNQUNBLElBQUsxQyxJQUFJLENBQUMyQyxXQUFXLEVBQUc7UUFDdEJ6QyxLQUFLLENBQUMwQyxTQUFTLEdBQUcsWUFBWTtRQUM5QjFDLEtBQUssQ0FBQzJDLFVBQVUsR0FBRzdDLElBQUksQ0FBQzJDLFdBQVcsQ0FBQzdELEdBQUcsQ0FBRWdFLEtBQUssSUFBSTtVQUNoRCxPQUFPO1lBQ0xqRCxHQUFHLEVBQUVpRCxLQUFLLENBQUNqRCxHQUFHO1lBQ2QwQyxLQUFLLEVBQUVPLEtBQUssQ0FBQ1AsS0FBSztZQUNsQkUsTUFBTSxFQUFFSyxLQUFLLENBQUNMO1lBQ2Q7VUFDRixDQUFDO1FBQ0gsQ0FBRSxDQUFDO01BQ0wsQ0FBQyxNQUNJO1FBQ0gsSUFBS3pDLElBQUksQ0FBQytDLE9BQU8sRUFBRztVQUNsQjdDLEtBQUssQ0FBQzhDLGVBQWUsR0FBRyxJQUFJO1FBQzlCO1FBQ0EsSUFBS2hELElBQUksQ0FBQ2lELE1BQU0sWUFBWUMsZ0JBQWdCLEVBQUc7VUFDN0NoRCxLQUFLLENBQUMwQyxTQUFTLEdBQUcsT0FBTztVQUN6QjFDLEtBQUssQ0FBQ0gsR0FBRyxHQUFHQyxJQUFJLENBQUNpRCxNQUFNLENBQUNsRCxHQUFHO1FBQzdCLENBQUMsTUFDSSxJQUFLQyxJQUFJLENBQUNpRCxNQUFNLFlBQVlFLGlCQUFpQixFQUFHO1VBQ25EakQsS0FBSyxDQUFDMEMsU0FBUyxHQUFHLFFBQVE7VUFDMUIxQyxLQUFLLENBQUNILEdBQUcsR0FBR0MsSUFBSSxDQUFDaUQsTUFBTSxDQUFDRyxTQUFTLENBQUMsQ0FBQztRQUNyQztNQUNGO0lBQ0Y7SUFFQSxJQUFPbEgsVUFBVSxJQUFJOEQsSUFBSSxZQUFZOUQsVUFBVSxJQUN4Q2tCLFNBQVMsSUFBSTRDLElBQUksWUFBWTVDLFNBQVcsRUFBRztNQUNoRDZELGFBQWEsQ0FBQ3hELElBQUksR0FBS3ZCLFVBQVUsSUFBSThELElBQUksWUFBWTlELFVBQVUsR0FBSyxZQUFZLEdBQUcsV0FBVztNQUU5RmdFLEtBQUssQ0FBQ21ELFlBQVksR0FBRzlGLGdCQUFnQixDQUFFeUMsSUFBSSxDQUFDcUQsWUFBYSxDQUFDOztNQUUxRDtNQUNBO01BQ0E7TUFDQTtNQUNBO01BQ0EsTUFBTUMsS0FBSyxHQUFHLENBQUM7TUFDZixNQUFNQyxNQUFNLEdBQUdDLFFBQVEsQ0FBQ0MsYUFBYSxDQUFFLFFBQVMsQ0FBQztNQUNqREYsTUFBTSxDQUFDaEIsS0FBSyxHQUFHbUIsSUFBSSxDQUFDQyxJQUFJLENBQUUzRCxJQUFJLENBQUNxRCxZQUFZLENBQUNkLEtBQUssR0FBR2UsS0FBTSxDQUFDO01BQzNEQyxNQUFNLENBQUNkLE1BQU0sR0FBR2lCLElBQUksQ0FBQ0MsSUFBSSxDQUFFM0QsSUFBSSxDQUFDcUQsWUFBWSxDQUFDWixNQUFNLEdBQUdhLEtBQU0sQ0FBQztNQUM3RCxNQUFNTSxPQUFPLEdBQUdMLE1BQU0sQ0FBQ00sVUFBVSxDQUFFLElBQUssQ0FBRTtNQUMxQyxNQUFNQyxPQUFPLEdBQUcsSUFBSTdILG9CQUFvQixDQUFFc0gsTUFBTSxFQUFFSyxPQUFRLENBQUM7TUFDM0QsTUFBTXJELE1BQU0sR0FBRzNFLE9BQU8sQ0FBQzBILEtBQUssQ0FBRSxDQUFDLEdBQUdBLEtBQU0sQ0FBQztNQUN6Q1EsT0FBTyxDQUFDRixPQUFPLENBQUNHLFlBQVksQ0FBRVQsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUVBLEtBQUssRUFBRSxDQUFDdEQsSUFBSSxDQUFDcUQsWUFBWSxDQUFDVyxJQUFJLEVBQUUsQ0FBQ2hFLElBQUksQ0FBQ3FELFlBQVksQ0FBQ1ksR0FBSSxDQUFDO01BQ25HakUsSUFBSSxDQUFDa0Usa0JBQWtCLENBQUVKLE9BQU8sRUFBRXZELE1BQU8sQ0FBQztNQUMxQ0wsS0FBSyxDQUFDTCxHQUFHLEdBQUcwRCxNQUFNLENBQUNILFNBQVMsQ0FBQyxDQUFDO01BQzlCbEQsS0FBSyxDQUFDb0QsS0FBSyxHQUFHQSxLQUFLO01BQ25CcEQsS0FBSyxDQUFDaUUsTUFBTSxHQUFHNUcsZ0JBQWdCLENBQUV5QyxJQUFJLENBQUNxRCxZQUFZLENBQUNlLE9BQVEsQ0FBQztJQUM5RDtJQUVBLElBQUs5SCxHQUFHLElBQUkwRCxJQUFJLFlBQVkxRCxHQUFHLEVBQUc7TUFDaEMyRSxhQUFhLENBQUN4RCxJQUFJLEdBQUcsS0FBSztNQUMxQndELGFBQWEsQ0FBQ29ELE9BQU8sR0FBRyxJQUFJQyxNQUFNLENBQUNDLGFBQWEsQ0FBQyxDQUFDLENBQUNDLGlCQUFpQixDQUFFeEUsSUFBSSxDQUFDcUUsT0FBUSxDQUFDO01BQ3BGLElBQUtyRSxJQUFJLENBQUNxRSxPQUFPLFlBQVlDLE1BQU0sQ0FBQ25CLGlCQUFpQixFQUFHO1FBQ3REbEMsYUFBYSxDQUFDd0QsT0FBTyxHQUFHekUsSUFBSSxDQUFDcUUsT0FBTyxDQUFDakIsU0FBUyxDQUFDLENBQUM7TUFDbEQ7TUFDQW5ELE9BQU8sQ0FBQ3lFLGdCQUFnQixHQUFHMUUsSUFBSSxDQUFDMEUsZ0JBQWdCO0lBQ2xEOztJQUVBO0lBQ0EsSUFBTzVILElBQUksSUFBSWtELElBQUksWUFBWWxELElBQUksSUFDNUJLLElBQUksSUFBSTZDLElBQUksWUFBWTdDLElBQU0sRUFBRztNQUV0QyxDQUNFLGNBQWMsRUFDZCxnQkFBZ0IsRUFDaEIsV0FBVyxFQUNYLFNBQVMsRUFDVCxVQUFVLEVBQ1YsZ0JBQWdCLEVBQ2hCLFlBQVksQ0FDYixDQUFDZ0QsT0FBTyxDQUFFQyxTQUFTLElBQUk7UUFDdEI7UUFDQSxJQUFLSixJQUFJLENBQUVJLFNBQVMsQ0FBRSxLQUFLdkQseUJBQXlCLENBQUV1RCxTQUFTLENBQUUsRUFBRztVQUNsRTtVQUNBSCxPQUFPLENBQUVHLFNBQVMsQ0FBRSxHQUFHSixJQUFJLENBQUVJLFNBQVMsQ0FBRTtRQUMxQztNQUNGLENBQUUsQ0FBQzs7TUFFSDs7TUFFQSxJQUFLSixJQUFJLENBQUMyRSxJQUFJLEtBQUs5SCx5QkFBeUIsQ0FBQzhILElBQUksRUFBRztRQUNsRHpFLEtBQUssQ0FBQ3lFLElBQUksR0FBR3BILGdCQUFnQixDQUFFeUMsSUFBSSxDQUFDMkUsSUFBSyxDQUFDO01BQzVDO01BQ0EsSUFBSzNFLElBQUksQ0FBQzRFLE1BQU0sS0FBSy9ILHlCQUF5QixDQUFDK0gsTUFBTSxFQUFHO1FBQ3REMUUsS0FBSyxDQUFDMEUsTUFBTSxHQUFHckgsZ0JBQWdCLENBQUV5QyxJQUFJLENBQUM0RSxNQUFPLENBQUM7TUFDaEQ7TUFDQSxJQUFLNUUsSUFBSSxDQUFDNkUsUUFBUSxDQUFDN0QsTUFBTSxFQUFHO1FBQzFCZCxLQUFLLENBQUMyRSxRQUFRLEdBQUd0SCxnQkFBZ0IsQ0FBRXlDLElBQUksQ0FBQzZFLFFBQVMsQ0FBQztNQUNwRDtJQUNGO0lBRUEsT0FBTzVELGFBQWE7RUFDdEIsQ0FBQyxNQUNJLElBQUt6RCxLQUFLLFlBQVluQixPQUFPLEVBQUc7SUFDbkMsT0FBTztNQUNMb0IsSUFBSSxFQUFFLFNBQVM7TUFDZjhFLEtBQUssRUFBRS9FLEtBQUssQ0FBQytFLEtBQUs7TUFDbEJFLE1BQU0sRUFBRWpGLEtBQUssQ0FBQ2lGLE1BQU07TUFDcEJxQyxlQUFlLEVBQUV2SCxnQkFBZ0IsQ0FBRUMsS0FBSyxDQUFDc0gsZUFBZ0IsQ0FBQztNQUMxREMsSUFBSSxFQUFFO1FBQ0p0SCxJQUFJLEVBQUUsU0FBUztRQUNmdUgsVUFBVSxFQUFFeEgsS0FBSyxDQUFDeUgsUUFBUSxDQUFDcEUsRUFBRTtRQUM3QnFFLEtBQUssRUFBRUMsdUJBQXVCLENBQUUzSCxLQUFLLENBQUN5SCxRQUFTO01BQ2pEO0lBQ0YsQ0FBQztFQUNILENBQUMsTUFDSTtJQUNILE9BQU87TUFDTHhILElBQUksRUFBRSxPQUFPO01BQ2JELEtBQUssRUFBRUE7SUFDVCxDQUFDO0VBQ0g7QUFDRixDQUFDO0FBRUQsTUFBTTJILHVCQUF1QixHQUFLRixRQUFjLElBQXNCO0VBQ3BFLE9BQU9BLFFBQVEsQ0FBQ0csZUFBZSxDQUFDLENBQUMsQ0FBQ3RHLEdBQUcsQ0FBRXZCLGdCQUFpQixDQUFDO0FBQzNELENBQUM7QUFFREwsT0FBTyxDQUFDbUksUUFBUSxDQUFFLGtCQUFrQixFQUFFOUgsZ0JBQWlCLENBQUM7QUFDeEQsU0FBU0EsZ0JBQWdCLElBQUkrSCxPQUFPLEVBQUVILHVCQUF1QiIsImlnbm9yZUxpc3QiOltdfQ==