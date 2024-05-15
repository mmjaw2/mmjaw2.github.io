// Copyright 2022-2023, University of Colorado Boulder

/**
 * Demo for Sprites
 *
 * @author Jonathan Olson
 */

import NumberProperty from '../../../../axon/js/NumberProperty.js';
import stepTimer from '../../../../axon/js/stepTimer.js';
import Bounds2 from '../../../../dot/js/Bounds2.js';
import dotRandom from '../../../../dot/js/dotRandom.js';
import Range from '../../../../dot/js/Range.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import arrayRemove from '../../../../phet-core/js/arrayRemove.js';
import { DragListener, Node, Rectangle, Sprite, SpriteImage, SpriteInstance, SpriteListenable, Sprites, VBox } from '../../../../scenery/js/imports.js';
import Panel from '../../../../sun/js/Panel.js';
import flame_png from '../../../images/flame_png.js';
import iceCubeStack_png from '../../../images/iceCubeStack_png.js';
import measuringTape_png from '../../../images/measuringTape_png.js';
import NumberControl from '../../NumberControl.js';
export default function demoSprites(layoutBounds) {
  const spriteCountProperty = new NumberProperty(500, {
    range: new Range(0, 10000)
  });
  const spriteSpeedProperty = new NumberProperty(15, {
    range: new Range(0, 100)
  });
  const spriteScaleProperty = new NumberProperty(0.5, {
    range: new Range(0.01, 1)
  });
  const getAvailableWidth = () => layoutBounds.width / spriteScaleProperty.value;
  const getAvailableHeight = () => layoutBounds.height / spriteScaleProperty.value;

  // SpriteImage references
  const flameSpriteImage = new SpriteImage(flame_png, new Vector2(44, 42), {
    hitTestPixels: true
  });
  const measuringTapeSpriteImage = new SpriteImage(measuringTape_png, new Vector2(50, 40), {
    hitTestPixels: true
  });
  const iceCubeStackSpriteImage = new SpriteImage(iceCubeStack_png, new Vector2(25, 25), {
    hitTestPixels: true
  });

  // Example of how to create a SpriteImage from a non-HTMLImageElement, as recommended by @jonathanolson
  // in https://github.com/phetsims/beers-law-lab/issues/276#issuecomment-1347071650
  // Add additional parameters for the toCanvas callback if you need resolution scaling.
  const particleRectangle = new Rectangle(0, 0, 50, 50, {
    fill: 'red',
    stroke: 'black'
  });
  let particleSpriteImage;
  particleRectangle.toCanvas(canvas => {
    particleSpriteImage = new SpriteImage(canvas, particleRectangle.center);
  });

  // Sprites
  const sprite0 = new Sprite(flameSpriteImage);
  const sprite1 = new Sprite(measuringTapeSpriteImage);
  const sprite2 = new Sprite(iceCubeStackSpriteImage);
  const sprite3 = new Sprite(particleSpriteImage);
  const createSpriteInstance = () => {
    const instance = SpriteInstance.pool.create();
    instance.sprite = dotRandom.sample([sprite0, sprite1, sprite2, sprite3]);
    instance.matrix.setToTranslation(dotRandom.nextDouble() * getAvailableWidth(), dotRandom.nextDouble() * getAvailableHeight());

    // Put a custom velocity on each one
    instance.velocity = Vector2.createPolar(1, dotRandom.nextDouble() * 2 * Math.PI);
    return instance;
  };

  // We'll hold our SpriteInstances here in this array (the reference to this exact array will be used)
  const instances = _.range(0, spriteCountProperty.value).map(createSpriteInstance);

  // Adjust sprite count dynamically
  spriteCountProperty.lazyLink((value, oldValue) => {
    const delta = value - oldValue;
    if (delta > 0) {
      _.range(0, delta).forEach(() => instances.push(createSpriteInstance()));
    } else {
      _.range(0, -delta).forEach(() => instances.pop());
    }
  });
  let selectedInstance = null;

  // Create the 'Sprites' node
  const sprites = new Sprites({
    // The sprites we have available (fixed, won't change)
    sprites: [sprite0, sprite1, sprite2, sprite3],
    spriteInstances: instances,
    canvasBounds: layoutBounds.dilated(200),
    hitTestSprites: true,
    cursor: 'pointer',
    // Mix in SpriteListenable, so we (a) have access to the SpriteInstance and (b) will only interact when there is one
    inputListeners: [new (SpriteListenable(DragListener))({
      applyOffset: false,
      start: (event, listener) => {
        const myListener = listener;
        selectedInstance = myListener.spriteInstance;

        // e.g. moveToFront
        arrayRemove(instances, selectedInstance);
        instances.push(selectedInstance);
      },
      drag: (event, listener) => {
        // translate the selected instance
        const matrix = selectedInstance.matrix;
        matrix.set02(matrix.m02() + listener.modelDelta.x / spriteScaleProperty.value);
        matrix.set12(matrix.m12() + listener.modelDelta.y / spriteScaleProperty.value);
        sprites.invalidatePaint();
      },
      end: () => {
        selectedInstance = null;
      }
    })]
  });
  spriteScaleProperty.link((scale, oldScale) => {
    sprites.setScaleMagnitude(scale, scale);
    sprites.canvasBounds = Bounds2.rect(0, 0, getAvailableWidth(), getAvailableHeight()).dilated(200);

    // rescale positions
    if (oldScale) {
      instances.forEach(instance => {
        instance.matrix.set02(instance.matrix.m02() * oldScale / scale);
        instance.matrix.set12(instance.matrix.m12() * oldScale / scale);
      });
    }
  });
  sprites.invalidatePaint();
  const listener = dt => {
    const distance = dt * spriteSpeedProperty.value / spriteScaleProperty.value;
    const width = getAvailableWidth();
    const height = getAvailableHeight();
    for (let i = instances.length - 1; i >= 0; i--) {
      const instance = instances[i];
      if (instance !== selectedInstance) {
        const matrix = instance.matrix;

        // Optimized translation
        matrix.set02((matrix.m02() + instance.velocity.x * distance + width) % width);
        matrix.set12((matrix.m12() + instance.velocity.y * distance + height) % height);
      }
    }

    // We modified our instances, so we need this to repaint
    sprites.invalidatePaint();
  };
  stepTimer.addListener(listener);
  sprites.dispose = () => {
    stepTimer.removeListener(listener);
    Node.prototype.dispose.call(node);
  };
  const controlPanel = new Panel(new VBox({
    spacing: 10,
    children: [new NumberControl('Sprite Count:', spriteCountProperty, spriteCountProperty.range), new NumberControl('Sprite Speed:', spriteSpeedProperty, spriteSpeedProperty.range), new NumberControl('Sprite Scale:', spriteScaleProperty, spriteScaleProperty.range, {
      delta: 0.01,
      numberDisplayOptions: {
        decimalPlaces: 2
      }
    })]
  }), {
    bottom: layoutBounds.bottom - 10,
    right: layoutBounds.right - 10
  });
  const node = new Node({
    children: [sprites, controlPanel]
  });
  return node;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJOdW1iZXJQcm9wZXJ0eSIsInN0ZXBUaW1lciIsIkJvdW5kczIiLCJkb3RSYW5kb20iLCJSYW5nZSIsIlZlY3RvcjIiLCJhcnJheVJlbW92ZSIsIkRyYWdMaXN0ZW5lciIsIk5vZGUiLCJSZWN0YW5nbGUiLCJTcHJpdGUiLCJTcHJpdGVJbWFnZSIsIlNwcml0ZUluc3RhbmNlIiwiU3ByaXRlTGlzdGVuYWJsZSIsIlNwcml0ZXMiLCJWQm94IiwiUGFuZWwiLCJmbGFtZV9wbmciLCJpY2VDdWJlU3RhY2tfcG5nIiwibWVhc3VyaW5nVGFwZV9wbmciLCJOdW1iZXJDb250cm9sIiwiZGVtb1Nwcml0ZXMiLCJsYXlvdXRCb3VuZHMiLCJzcHJpdGVDb3VudFByb3BlcnR5IiwicmFuZ2UiLCJzcHJpdGVTcGVlZFByb3BlcnR5Iiwic3ByaXRlU2NhbGVQcm9wZXJ0eSIsImdldEF2YWlsYWJsZVdpZHRoIiwid2lkdGgiLCJ2YWx1ZSIsImdldEF2YWlsYWJsZUhlaWdodCIsImhlaWdodCIsImZsYW1lU3ByaXRlSW1hZ2UiLCJoaXRUZXN0UGl4ZWxzIiwibWVhc3VyaW5nVGFwZVNwcml0ZUltYWdlIiwiaWNlQ3ViZVN0YWNrU3ByaXRlSW1hZ2UiLCJwYXJ0aWNsZVJlY3RhbmdsZSIsImZpbGwiLCJzdHJva2UiLCJwYXJ0aWNsZVNwcml0ZUltYWdlIiwidG9DYW52YXMiLCJjYW52YXMiLCJjZW50ZXIiLCJzcHJpdGUwIiwic3ByaXRlMSIsInNwcml0ZTIiLCJzcHJpdGUzIiwiY3JlYXRlU3ByaXRlSW5zdGFuY2UiLCJpbnN0YW5jZSIsInBvb2wiLCJjcmVhdGUiLCJzcHJpdGUiLCJzYW1wbGUiLCJtYXRyaXgiLCJzZXRUb1RyYW5zbGF0aW9uIiwibmV4dERvdWJsZSIsInZlbG9jaXR5IiwiY3JlYXRlUG9sYXIiLCJNYXRoIiwiUEkiLCJpbnN0YW5jZXMiLCJfIiwibWFwIiwibGF6eUxpbmsiLCJvbGRWYWx1ZSIsImRlbHRhIiwiZm9yRWFjaCIsInB1c2giLCJwb3AiLCJzZWxlY3RlZEluc3RhbmNlIiwic3ByaXRlcyIsInNwcml0ZUluc3RhbmNlcyIsImNhbnZhc0JvdW5kcyIsImRpbGF0ZWQiLCJoaXRUZXN0U3ByaXRlcyIsImN1cnNvciIsImlucHV0TGlzdGVuZXJzIiwiYXBwbHlPZmZzZXQiLCJzdGFydCIsImV2ZW50IiwibGlzdGVuZXIiLCJteUxpc3RlbmVyIiwic3ByaXRlSW5zdGFuY2UiLCJkcmFnIiwic2V0MDIiLCJtMDIiLCJtb2RlbERlbHRhIiwieCIsInNldDEyIiwibTEyIiwieSIsImludmFsaWRhdGVQYWludCIsImVuZCIsImxpbmsiLCJzY2FsZSIsIm9sZFNjYWxlIiwic2V0U2NhbGVNYWduaXR1ZGUiLCJyZWN0IiwiZHQiLCJkaXN0YW5jZSIsImkiLCJsZW5ndGgiLCJhZGRMaXN0ZW5lciIsImRpc3Bvc2UiLCJyZW1vdmVMaXN0ZW5lciIsInByb3RvdHlwZSIsImNhbGwiLCJub2RlIiwiY29udHJvbFBhbmVsIiwic3BhY2luZyIsImNoaWxkcmVuIiwibnVtYmVyRGlzcGxheU9wdGlvbnMiLCJkZWNpbWFsUGxhY2VzIiwiYm90dG9tIiwicmlnaHQiXSwic291cmNlcyI6WyJkZW1vU3ByaXRlcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBEZW1vIGZvciBTcHJpdGVzXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb25cclxuICovXHJcblxyXG5pbXBvcnQgTnVtYmVyUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9OdW1iZXJQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBzdGVwVGltZXIgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9zdGVwVGltZXIuanMnO1xyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBkb3RSYW5kb20gZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL2RvdFJhbmRvbS5qcyc7XHJcbmltcG9ydCBSYW5nZSBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvUmFuZ2UuanMnO1xyXG5pbXBvcnQgVmVjdG9yMiBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvVmVjdG9yMi5qcyc7XHJcbmltcG9ydCBhcnJheVJlbW92ZSBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvYXJyYXlSZW1vdmUuanMnO1xyXG5pbXBvcnQgeyBEcmFnTGlzdGVuZXIsIE5vZGUsIFByZXNzZWREcmFnTGlzdGVuZXIsIFJlY3RhbmdsZSwgU3ByaXRlLCBTcHJpdGVJbWFnZSwgU3ByaXRlSW5zdGFuY2UsIFNwcml0ZUxpc3RlbmFibGUsIFNwcml0ZXMsIFZCb3ggfSBmcm9tICcuLi8uLi8uLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgUGFuZWwgZnJvbSAnLi4vLi4vLi4vLi4vc3VuL2pzL1BhbmVsLmpzJztcclxuaW1wb3J0IGZsYW1lX3BuZyBmcm9tICcuLi8uLi8uLi9pbWFnZXMvZmxhbWVfcG5nLmpzJztcclxuaW1wb3J0IGljZUN1YmVTdGFja19wbmcgZnJvbSAnLi4vLi4vLi4vaW1hZ2VzL2ljZUN1YmVTdGFja19wbmcuanMnO1xyXG5pbXBvcnQgbWVhc3VyaW5nVGFwZV9wbmcgZnJvbSAnLi4vLi4vLi4vaW1hZ2VzL21lYXN1cmluZ1RhcGVfcG5nLmpzJztcclxuaW1wb3J0IE51bWJlckNvbnRyb2wgZnJvbSAnLi4vLi4vTnVtYmVyQ29udHJvbC5qcyc7XHJcblxyXG50eXBlIFNwcml0ZUluc3RhbmNlV2l0aFZlbG9jaXR5ID0gU3ByaXRlSW5zdGFuY2UgJiB7IHZlbG9jaXR5OiBWZWN0b3IyIH07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBkZW1vU3ByaXRlcyggbGF5b3V0Qm91bmRzOiBCb3VuZHMyICk6IE5vZGUge1xyXG5cclxuICBjb25zdCBzcHJpdGVDb3VudFByb3BlcnR5ID0gbmV3IE51bWJlclByb3BlcnR5KCA1MDAsIHtcclxuICAgIHJhbmdlOiBuZXcgUmFuZ2UoIDAsIDEwMDAwIClcclxuICB9ICk7XHJcbiAgY29uc3Qgc3ByaXRlU3BlZWRQcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggMTUsIHtcclxuICAgIHJhbmdlOiBuZXcgUmFuZ2UoIDAsIDEwMCApXHJcbiAgfSApO1xyXG4gIGNvbnN0IHNwcml0ZVNjYWxlUHJvcGVydHkgPSBuZXcgTnVtYmVyUHJvcGVydHkoIDAuNSwge1xyXG4gICAgcmFuZ2U6IG5ldyBSYW5nZSggMC4wMSwgMSApXHJcbiAgfSApO1xyXG5cclxuICBjb25zdCBnZXRBdmFpbGFibGVXaWR0aCA9ICgpID0+IGxheW91dEJvdW5kcy53aWR0aCAvIHNwcml0ZVNjYWxlUHJvcGVydHkudmFsdWU7XHJcbiAgY29uc3QgZ2V0QXZhaWxhYmxlSGVpZ2h0ID0gKCkgPT4gbGF5b3V0Qm91bmRzLmhlaWdodCAvIHNwcml0ZVNjYWxlUHJvcGVydHkudmFsdWU7XHJcblxyXG4gIC8vIFNwcml0ZUltYWdlIHJlZmVyZW5jZXNcclxuICBjb25zdCBmbGFtZVNwcml0ZUltYWdlID0gbmV3IFNwcml0ZUltYWdlKCBmbGFtZV9wbmcsIG5ldyBWZWN0b3IyKCA0NCwgNDIgKSwgeyBoaXRUZXN0UGl4ZWxzOiB0cnVlIH0gKTtcclxuICBjb25zdCBtZWFzdXJpbmdUYXBlU3ByaXRlSW1hZ2UgPSBuZXcgU3ByaXRlSW1hZ2UoIG1lYXN1cmluZ1RhcGVfcG5nLCBuZXcgVmVjdG9yMiggNTAsIDQwICksIHsgaGl0VGVzdFBpeGVsczogdHJ1ZSB9ICk7XHJcbiAgY29uc3QgaWNlQ3ViZVN0YWNrU3ByaXRlSW1hZ2UgPSBuZXcgU3ByaXRlSW1hZ2UoIGljZUN1YmVTdGFja19wbmcsIG5ldyBWZWN0b3IyKCAyNSwgMjUgKSwgeyBoaXRUZXN0UGl4ZWxzOiB0cnVlIH0gKTtcclxuXHJcbiAgLy8gRXhhbXBsZSBvZiBob3cgdG8gY3JlYXRlIGEgU3ByaXRlSW1hZ2UgZnJvbSBhIG5vbi1IVE1MSW1hZ2VFbGVtZW50LCBhcyByZWNvbW1lbmRlZCBieSBAam9uYXRoYW5vbHNvblxyXG4gIC8vIGluIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9iZWVycy1sYXctbGFiL2lzc3Vlcy8yNzYjaXNzdWVjb21tZW50LTEzNDcwNzE2NTBcclxuICAvLyBBZGQgYWRkaXRpb25hbCBwYXJhbWV0ZXJzIGZvciB0aGUgdG9DYW52YXMgY2FsbGJhY2sgaWYgeW91IG5lZWQgcmVzb2x1dGlvbiBzY2FsaW5nLlxyXG4gIGNvbnN0IHBhcnRpY2xlUmVjdGFuZ2xlID0gbmV3IFJlY3RhbmdsZSggMCwgMCwgNTAsIDUwLCB7XHJcbiAgICBmaWxsOiAncmVkJyxcclxuICAgIHN0cm9rZTogJ2JsYWNrJ1xyXG4gIH0gKTtcclxuICBsZXQgcGFydGljbGVTcHJpdGVJbWFnZTogU3ByaXRlSW1hZ2U7XHJcbiAgcGFydGljbGVSZWN0YW5nbGUudG9DYW52YXMoIGNhbnZhcyA9PiB7XHJcbiAgICBwYXJ0aWNsZVNwcml0ZUltYWdlID0gbmV3IFNwcml0ZUltYWdlKCBjYW52YXMsIHBhcnRpY2xlUmVjdGFuZ2xlLmNlbnRlciApO1xyXG4gIH0gKTtcclxuXHJcbiAgLy8gU3ByaXRlc1xyXG4gIGNvbnN0IHNwcml0ZTAgPSBuZXcgU3ByaXRlKCBmbGFtZVNwcml0ZUltYWdlICk7XHJcbiAgY29uc3Qgc3ByaXRlMSA9IG5ldyBTcHJpdGUoIG1lYXN1cmluZ1RhcGVTcHJpdGVJbWFnZSApO1xyXG4gIGNvbnN0IHNwcml0ZTIgPSBuZXcgU3ByaXRlKCBpY2VDdWJlU3RhY2tTcHJpdGVJbWFnZSApO1xyXG4gIGNvbnN0IHNwcml0ZTMgPSBuZXcgU3ByaXRlKCBwYXJ0aWNsZVNwcml0ZUltYWdlISApO1xyXG5cclxuICBjb25zdCBjcmVhdGVTcHJpdGVJbnN0YW5jZSA9ICgpOiBTcHJpdGVJbnN0YW5jZVdpdGhWZWxvY2l0eSA9PiB7XHJcbiAgICBjb25zdCBpbnN0YW5jZSA9IFNwcml0ZUluc3RhbmNlLnBvb2wuY3JlYXRlKCkgYXMgU3ByaXRlSW5zdGFuY2VXaXRoVmVsb2NpdHk7XHJcbiAgICBpbnN0YW5jZS5zcHJpdGUgPSBkb3RSYW5kb20uc2FtcGxlKCBbIHNwcml0ZTAsIHNwcml0ZTEsIHNwcml0ZTIsIHNwcml0ZTMgXSApO1xyXG4gICAgaW5zdGFuY2UubWF0cml4LnNldFRvVHJhbnNsYXRpb24oIGRvdFJhbmRvbS5uZXh0RG91YmxlKCkgKiBnZXRBdmFpbGFibGVXaWR0aCgpLCBkb3RSYW5kb20ubmV4dERvdWJsZSgpICogZ2V0QXZhaWxhYmxlSGVpZ2h0KCkgKTtcclxuXHJcbiAgICAvLyBQdXQgYSBjdXN0b20gdmVsb2NpdHkgb24gZWFjaCBvbmVcclxuICAgIGluc3RhbmNlLnZlbG9jaXR5ID0gVmVjdG9yMi5jcmVhdGVQb2xhciggMSwgZG90UmFuZG9tLm5leHREb3VibGUoKSAqIDIgKiBNYXRoLlBJICk7XHJcblxyXG4gICAgcmV0dXJuIGluc3RhbmNlO1xyXG4gIH07XHJcblxyXG4gIC8vIFdlJ2xsIGhvbGQgb3VyIFNwcml0ZUluc3RhbmNlcyBoZXJlIGluIHRoaXMgYXJyYXkgKHRoZSByZWZlcmVuY2UgdG8gdGhpcyBleGFjdCBhcnJheSB3aWxsIGJlIHVzZWQpXHJcbiAgY29uc3QgaW5zdGFuY2VzID0gXy5yYW5nZSggMCwgc3ByaXRlQ291bnRQcm9wZXJ0eS52YWx1ZSApLm1hcCggY3JlYXRlU3ByaXRlSW5zdGFuY2UgKTtcclxuXHJcbiAgLy8gQWRqdXN0IHNwcml0ZSBjb3VudCBkeW5hbWljYWxseVxyXG4gIHNwcml0ZUNvdW50UHJvcGVydHkubGF6eUxpbmsoICggdmFsdWUsIG9sZFZhbHVlICkgPT4ge1xyXG4gICAgY29uc3QgZGVsdGEgPSB2YWx1ZSAtIG9sZFZhbHVlO1xyXG4gICAgaWYgKCBkZWx0YSA+IDAgKSB7XHJcbiAgICAgIF8ucmFuZ2UoIDAsIGRlbHRhICkuZm9yRWFjaCggKCkgPT4gaW5zdGFuY2VzLnB1c2goIGNyZWF0ZVNwcml0ZUluc3RhbmNlKCkgKSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIF8ucmFuZ2UoIDAsIC1kZWx0YSApLmZvckVhY2goICgpID0+IGluc3RhbmNlcy5wb3AoKSApO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuXHJcbiAgbGV0IHNlbGVjdGVkSW5zdGFuY2U6IFNwcml0ZUluc3RhbmNlV2l0aFZlbG9jaXR5IHwgbnVsbCA9IG51bGw7XHJcblxyXG4gIC8vIENyZWF0ZSB0aGUgJ1Nwcml0ZXMnIG5vZGVcclxuICBjb25zdCBzcHJpdGVzID0gbmV3IFNwcml0ZXMoIHtcclxuXHJcbiAgICAvLyBUaGUgc3ByaXRlcyB3ZSBoYXZlIGF2YWlsYWJsZSAoZml4ZWQsIHdvbid0IGNoYW5nZSlcclxuICAgIHNwcml0ZXM6IFsgc3ByaXRlMCwgc3ByaXRlMSwgc3ByaXRlMiwgc3ByaXRlMyBdLFxyXG4gICAgc3ByaXRlSW5zdGFuY2VzOiBpbnN0YW5jZXMsXHJcbiAgICBjYW52YXNCb3VuZHM6IGxheW91dEJvdW5kcy5kaWxhdGVkKCAyMDAgKSxcclxuICAgIGhpdFRlc3RTcHJpdGVzOiB0cnVlLFxyXG4gICAgY3Vyc29yOiAncG9pbnRlcicsXHJcblxyXG4gICAgLy8gTWl4IGluIFNwcml0ZUxpc3RlbmFibGUsIHNvIHdlIChhKSBoYXZlIGFjY2VzcyB0byB0aGUgU3ByaXRlSW5zdGFuY2UgYW5kIChiKSB3aWxsIG9ubHkgaW50ZXJhY3Qgd2hlbiB0aGVyZSBpcyBvbmVcclxuICAgIGlucHV0TGlzdGVuZXJzOiBbIG5ldyAoIFNwcml0ZUxpc3RlbmFibGUoIERyYWdMaXN0ZW5lciApICkoIHtcclxuICAgICAgYXBwbHlPZmZzZXQ6IGZhbHNlLFxyXG5cclxuICAgICAgc3RhcnQ6ICggZXZlbnQsIGxpc3RlbmVyOiBQcmVzc2VkRHJhZ0xpc3RlbmVyICkgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBteUxpc3RlbmVyID0gbGlzdGVuZXIgYXMgUHJlc3NlZERyYWdMaXN0ZW5lciAmIHsgc3ByaXRlSW5zdGFuY2U6IFNwcml0ZUluc3RhbmNlV2l0aFZlbG9jaXR5IH07XHJcbiAgICAgICAgc2VsZWN0ZWRJbnN0YW5jZSA9IG15TGlzdGVuZXIuc3ByaXRlSW5zdGFuY2U7XHJcblxyXG4gICAgICAgIC8vIGUuZy4gbW92ZVRvRnJvbnRcclxuICAgICAgICBhcnJheVJlbW92ZSggaW5zdGFuY2VzLCBzZWxlY3RlZEluc3RhbmNlICk7XHJcbiAgICAgICAgaW5zdGFuY2VzLnB1c2goIHNlbGVjdGVkSW5zdGFuY2UgKTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIGRyYWc6ICggZXZlbnQsIGxpc3RlbmVyICkgPT4ge1xyXG4gICAgICAgIC8vIHRyYW5zbGF0ZSB0aGUgc2VsZWN0ZWQgaW5zdGFuY2VcclxuICAgICAgICBjb25zdCBtYXRyaXggPSBzZWxlY3RlZEluc3RhbmNlIS5tYXRyaXg7XHJcbiAgICAgICAgbWF0cml4LnNldDAyKCBtYXRyaXgubTAyKCkgKyBsaXN0ZW5lci5tb2RlbERlbHRhLnggLyBzcHJpdGVTY2FsZVByb3BlcnR5LnZhbHVlICk7XHJcbiAgICAgICAgbWF0cml4LnNldDEyKCBtYXRyaXgubTEyKCkgKyBsaXN0ZW5lci5tb2RlbERlbHRhLnkgLyBzcHJpdGVTY2FsZVByb3BlcnR5LnZhbHVlICk7XHJcblxyXG4gICAgICAgIHNwcml0ZXMuaW52YWxpZGF0ZVBhaW50KCk7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBlbmQ6ICgpID0+IHtcclxuICAgICAgICBzZWxlY3RlZEluc3RhbmNlID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfSApIF1cclxuICB9ICk7XHJcblxyXG4gIHNwcml0ZVNjYWxlUHJvcGVydHkubGluayggKCBzY2FsZSwgb2xkU2NhbGUgKSA9PiB7XHJcbiAgICBzcHJpdGVzLnNldFNjYWxlTWFnbml0dWRlKCBzY2FsZSwgc2NhbGUgKTtcclxuICAgIHNwcml0ZXMuY2FudmFzQm91bmRzID0gQm91bmRzMi5yZWN0KCAwLCAwLCBnZXRBdmFpbGFibGVXaWR0aCgpLCBnZXRBdmFpbGFibGVIZWlnaHQoKSApLmRpbGF0ZWQoIDIwMCApO1xyXG5cclxuICAgIC8vIHJlc2NhbGUgcG9zaXRpb25zXHJcbiAgICBpZiAoIG9sZFNjYWxlICkge1xyXG4gICAgICBpbnN0YW5jZXMuZm9yRWFjaCggaW5zdGFuY2UgPT4ge1xyXG4gICAgICAgIGluc3RhbmNlLm1hdHJpeC5zZXQwMiggaW5zdGFuY2UubWF0cml4Lm0wMigpICogb2xkU2NhbGUgLyBzY2FsZSApO1xyXG4gICAgICAgIGluc3RhbmNlLm1hdHJpeC5zZXQxMiggaW5zdGFuY2UubWF0cml4Lm0xMigpICogb2xkU2NhbGUgLyBzY2FsZSApO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcbiAgfSApO1xyXG5cclxuICBzcHJpdGVzLmludmFsaWRhdGVQYWludCgpO1xyXG5cclxuICBjb25zdCBsaXN0ZW5lciA9ICggZHQ6IG51bWJlciApID0+IHtcclxuXHJcbiAgICBjb25zdCBkaXN0YW5jZSA9IGR0ICogc3ByaXRlU3BlZWRQcm9wZXJ0eS52YWx1ZSAvIHNwcml0ZVNjYWxlUHJvcGVydHkudmFsdWU7XHJcbiAgICBjb25zdCB3aWR0aCA9IGdldEF2YWlsYWJsZVdpZHRoKCk7XHJcbiAgICBjb25zdCBoZWlnaHQgPSBnZXRBdmFpbGFibGVIZWlnaHQoKTtcclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IGluc3RhbmNlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSApIHtcclxuICAgICAgY29uc3QgaW5zdGFuY2UgPSBpbnN0YW5jZXNbIGkgXTtcclxuICAgICAgaWYgKCBpbnN0YW5jZSAhPT0gc2VsZWN0ZWRJbnN0YW5jZSApIHtcclxuICAgICAgICBjb25zdCBtYXRyaXggPSBpbnN0YW5jZS5tYXRyaXg7XHJcblxyXG4gICAgICAgIC8vIE9wdGltaXplZCB0cmFuc2xhdGlvblxyXG4gICAgICAgIG1hdHJpeC5zZXQwMiggKCBtYXRyaXgubTAyKCkgKyBpbnN0YW5jZS52ZWxvY2l0eS54ICogZGlzdGFuY2UgKyB3aWR0aCApICUgd2lkdGggKTtcclxuICAgICAgICBtYXRyaXguc2V0MTIoICggbWF0cml4Lm0xMigpICsgaW5zdGFuY2UudmVsb2NpdHkueSAqIGRpc3RhbmNlICsgaGVpZ2h0ICkgJSBoZWlnaHQgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFdlIG1vZGlmaWVkIG91ciBpbnN0YW5jZXMsIHNvIHdlIG5lZWQgdGhpcyB0byByZXBhaW50XHJcbiAgICBzcHJpdGVzLmludmFsaWRhdGVQYWludCgpO1xyXG4gIH07XHJcblxyXG4gIHN0ZXBUaW1lci5hZGRMaXN0ZW5lciggbGlzdGVuZXIgKTtcclxuXHJcbiAgc3ByaXRlcy5kaXNwb3NlID0gKCkgPT4ge1xyXG4gICAgc3RlcFRpbWVyLnJlbW92ZUxpc3RlbmVyKCBsaXN0ZW5lciApO1xyXG4gICAgTm9kZS5wcm90b3R5cGUuZGlzcG9zZS5jYWxsKCBub2RlICk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgY29udHJvbFBhbmVsID0gbmV3IFBhbmVsKCBuZXcgVkJveCgge1xyXG4gICAgc3BhY2luZzogMTAsXHJcbiAgICBjaGlsZHJlbjogW1xyXG4gICAgICBuZXcgTnVtYmVyQ29udHJvbCggJ1Nwcml0ZSBDb3VudDonLCBzcHJpdGVDb3VudFByb3BlcnR5LCBzcHJpdGVDb3VudFByb3BlcnR5LnJhbmdlICksXHJcbiAgICAgIG5ldyBOdW1iZXJDb250cm9sKCAnU3ByaXRlIFNwZWVkOicsIHNwcml0ZVNwZWVkUHJvcGVydHksIHNwcml0ZVNwZWVkUHJvcGVydHkucmFuZ2UgKSxcclxuICAgICAgbmV3IE51bWJlckNvbnRyb2woICdTcHJpdGUgU2NhbGU6Jywgc3ByaXRlU2NhbGVQcm9wZXJ0eSwgc3ByaXRlU2NhbGVQcm9wZXJ0eS5yYW5nZSwge1xyXG4gICAgICAgIGRlbHRhOiAwLjAxLFxyXG4gICAgICAgIG51bWJlckRpc3BsYXlPcHRpb25zOiB7XHJcbiAgICAgICAgICBkZWNpbWFsUGxhY2VzOiAyXHJcbiAgICAgICAgfVxyXG4gICAgICB9IClcclxuICAgIF1cclxuICB9ICksIHtcclxuICAgIGJvdHRvbTogbGF5b3V0Qm91bmRzLmJvdHRvbSAtIDEwLFxyXG4gICAgcmlnaHQ6IGxheW91dEJvdW5kcy5yaWdodCAtIDEwXHJcbiAgfSApO1xyXG5cclxuICBjb25zdCBub2RlID0gbmV3IE5vZGUoIHtcclxuICAgIGNoaWxkcmVuOiBbIHNwcml0ZXMsIGNvbnRyb2xQYW5lbCBdXHJcbiAgfSApO1xyXG4gIHJldHVybiBub2RlO1xyXG59Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLGNBQWMsTUFBTSx1Q0FBdUM7QUFDbEUsT0FBT0MsU0FBUyxNQUFNLGtDQUFrQztBQUN4RCxPQUFPQyxPQUFPLE1BQU0sK0JBQStCO0FBQ25ELE9BQU9DLFNBQVMsTUFBTSxpQ0FBaUM7QUFDdkQsT0FBT0MsS0FBSyxNQUFNLDZCQUE2QjtBQUMvQyxPQUFPQyxPQUFPLE1BQU0sK0JBQStCO0FBQ25ELE9BQU9DLFdBQVcsTUFBTSx5Q0FBeUM7QUFDakUsU0FBU0MsWUFBWSxFQUFFQyxJQUFJLEVBQXVCQyxTQUFTLEVBQUVDLE1BQU0sRUFBRUMsV0FBVyxFQUFFQyxjQUFjLEVBQUVDLGdCQUFnQixFQUFFQyxPQUFPLEVBQUVDLElBQUksUUFBUSxtQ0FBbUM7QUFDNUssT0FBT0MsS0FBSyxNQUFNLDZCQUE2QjtBQUMvQyxPQUFPQyxTQUFTLE1BQU0sOEJBQThCO0FBQ3BELE9BQU9DLGdCQUFnQixNQUFNLHFDQUFxQztBQUNsRSxPQUFPQyxpQkFBaUIsTUFBTSxzQ0FBc0M7QUFDcEUsT0FBT0MsYUFBYSxNQUFNLHdCQUF3QjtBQUlsRCxlQUFlLFNBQVNDLFdBQVdBLENBQUVDLFlBQXFCLEVBQVM7RUFFakUsTUFBTUMsbUJBQW1CLEdBQUcsSUFBSXZCLGNBQWMsQ0FBRSxHQUFHLEVBQUU7SUFDbkR3QixLQUFLLEVBQUUsSUFBSXBCLEtBQUssQ0FBRSxDQUFDLEVBQUUsS0FBTTtFQUM3QixDQUFFLENBQUM7RUFDSCxNQUFNcUIsbUJBQW1CLEdB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