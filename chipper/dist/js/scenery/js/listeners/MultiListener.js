// Copyright 2017-2023, University of Colorado Boulder

/**
 * MultiListener is responsible for monitoring the mouse, touch, and other presses on the screen and determines the
 * operations to apply to a target Node from this input. Single touch dragging on the screen will initiate
 * panning. Multi-touch gestures will initiate scaling, translation, and potentially rotation depending on
 * the gesture.
 *
 * MultiListener will keep track of all "background" presses on the screen. When certain conditions are met, the
 * "background" presses become active and attached listeners may be interrupted so that the MultiListener
 * gestures take precedence. MultiListener uses the Intent feature of Pointer, so that the default behavior of this
 * listener can be prevented if necessary. Generally, you would use Pointer.reserveForDrag() to indicate
 * that your Node is intended for other input that should not be interrupted by this listener.
 *
 * For example usage, see scenery/examples/input.html. A typical "simple" MultiListener usage
 * would be something like:
 *
 *    display.addInputListener( new PressListener( targetNode ) );
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Jesse Greenberg
 */

import Property from '../../../axon/js/Property.js';
import Matrix from '../../../dot/js/Matrix.js';
import Matrix3 from '../../../dot/js/Matrix3.js';
import SingularValueDecomposition from '../../../dot/js/SingularValueDecomposition.js';
import Vector2 from '../../../dot/js/Vector2.js';
import arrayRemove from '../../../phet-core/js/arrayRemove.js';
import { Intent, Mouse, MultiListenerPress, scenery } from '../imports.js';
import optionize from '../../../phet-core/js/optionize.js';
import Tandem from '../../../tandem/js/Tandem.js';

// constants
// pointer must move this much to initiate a move interruption for panning, in the global coordinate frame
const MOVE_INTERRUPT_MAGNITUDE = 25;
class MultiListener {
  // the Node that will be transformed by this listener

  // see options

  // List of "active" Presses down from Pointer input which are actively changing the transformation of the target Node

  // List of "background" presses which are saved but not yet doing anything for the target Node transformation. If
  // the Pointer already has listeners, Presses are added to the background and wait to be converted to "active"
  // presses until we are allowed to interrupt the other listeners. Related to options "allowMoveInterrupt" and
  // "allowMultitouchInterrupt", where other Pointer listeners are interrupted in these cases.

  // {Property.<Matrix3>} - The matrix applied to the targetNode in response to various input for the MultiListener

  // Whether the listener was interrupted, in which case we may need to prevent certain behavior. If the listener was
  // interrupted, pointer listeners might still be called since input is dispatched to a defensive copy of the
  // Pointer's listeners. But presses will have been cleared in this case so we won't try to do any work on them.

  // attached to the Pointer when a Press is added

  // attached to the Pointer when presses are added - waits for certain conditions to be met before converting
  // background presses to active presses to enable multitouch listener behavior

  /**
   * @constructor
   *
   * @param targetNode - The Node that should be transformed by this MultiListener.
   * @param [providedOptions]
   */
  constructor(targetNode, providedOptions) {
    const options = optionize()({
      mouseButton: 0,
      pressCursor: 'pointer',
      allowScale: true,
      allowRotation: true,
      allowMultitouchInterruption: false,
      allowMoveInterruption: true,
      minScale: 1,
      maxScale: 4,
      tandem: Tandem.REQUIRED
    }, providedOptions);
    this._targetNode = targetNode;
    this._minScale = options.minScale;
    this._maxScale = options.maxScale;
    this._mouseButton = options.mouseButton;
    this._pressCursor = options.pressCursor;
    this._allowScale = options.allowScale;
    this._allowRotation = options.allowRotation;
    this._allowMultitouchInterruption = options.allowMultitouchInterruption;
    this._allowMoveInterruption = options.allowMoveInterruption;
    this._presses = [];
    this._backgroundPresses = [];
    this.matrixProperty = new Property(targetNode.matrix.copy(), {
      phetioValueType: Matrix3.Matrix3IO,
      tandem: options.tandem.createTandem('matrixProperty'),
      phetioReadOnly: true
    });

    // assign the matrix to the targetNode whenever it changes
    this.matrixProperty.link(matrix => {
      this._targetNode.matrix = matrix;
    });
    this._interrupted = false;
    this._pressListener = {
      move: event => {
        sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener pointer move');
        sceneryLog && sceneryLog.InputListener && sceneryLog.push();
        const press = this.findPress(event.pointer);
        assert && assert(press, 'Press should be found for move event');
        this.movePress(press);
        sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
      },
      up: event => {
        sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener pointer up');
        sceneryLog && sceneryLog.InputListener && sceneryLog.push();
        const press = this.findPress(event.pointer);
        assert && assert(press, 'Press should be found for up event');
        this.removePress(press);
        sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
      },
      cancel: event => {
        sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener pointer cancel');
        sceneryLog && sceneryLog.InputListener && sceneryLog.push();
        const press = this.findPress(event.pointer);
        assert && assert(press, 'Press should be found for cancel event');
        press.interrupted = true;
        this.removePress(press);
        sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
      },
      interrupt: () => {
        sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener pointer interrupt');
        sceneryLog && sceneryLog.InputListener && sceneryLog.push();

        // For the future, we could figure out how to track the pointer that calls this
        this.interrupt();
        sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
      }
    };
    this._backgroundListener = {
      up: event => {
        sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener background up');
        sceneryLog && sceneryLog.InputListener && sceneryLog.push();
        if (!this._interrupted) {
          const backgroundPress = this.findBackgroundPress(event.pointer);
          assert && assert(backgroundPress, 'Background press should be found for up event');
          this.removeBackgroundPress(backgroundPress);
        }
        sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
      },
      move: event => {
        // Any background press needs to meet certain conditions to be promoted to an actual press that pans/zooms
        const candidateBackgroundPresses = this._backgroundPresses.filter(press => {
          // Dragged pointers and pointers that haven't moved a certain distance are not candidates, and should not be
          // interrupted. We don't want to interrupt taps that might move a little bit
          return !press.pointer.hasIntent(Intent.DRAG) && press.initialPoint.distance(press.pointer.point) > MOVE_INTERRUPT_MAGNITUDE;
        });

        // If we are already zoomed in, we should promote any number of background presses to actual presses.
        // Otherwise, we'll need at least two presses to zoom
        // It is nice to allow down pointers to move around freely without interruption when there isn't any zoom,
        // but we still allow interruption if the number of background presses indicate the user is trying to
        // zoom in
        if (this.getCurrentScale() !== 1 || candidateBackgroundPresses.length >= 2) {
          sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener attached, interrupting for press');

          // Convert all candidate background presses to actual presses
          candidateBackgroundPresses.forEach(press => {
            this.removeBackgroundPress(press);
            this.interruptOtherListeners(press.pointer);
            this.addPress(press);
          });
        }
      },
      cancel: event => {
        sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener background cancel');
        sceneryLog && sceneryLog.InputListener && sceneryLog.push();
        if (!this._interrupted) {
          const backgroundPress = this.findBackgroundPress(event.pointer);
          assert && assert(backgroundPress, 'Background press should be found for cancel event');
          this.removeBackgroundPress(backgroundPress);
        }
        sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
      },
      interrupt: () => {
        sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener background interrupt');
        sceneryLog && sceneryLog.InputListener && sceneryLog.push();
        this.interrupt();
        sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
      }
    };
  }

  /**
   * Finds a Press by searching for the one with the provided Pointer.
   */
  findPress(pointer) {
    for (let i = 0; i < this._presses.length; i++) {
      if (this._presses[i].pointer === pointer) {
        return this._presses[i];
      }
    }
    return null;
  }

  /**
   * Find a background Press by searching for one with the provided Pointer. A background Press is one created
   * when we receive an event while a Pointer is already attached.
   */
  findBackgroundPress(pointer) {
    for (let i = 0; i < this._backgroundPresses.length; i++) {
      if (this._backgroundPresses[i].pointer === pointer) {
        return this._backgroundPresses[i];
      }
    }
    return null;
  }

  /**
   * Returns true if the press is already contained in one of this._backgroundPresses or this._presses. There are cases
   * where we may try to add the same pointer twice (user opened context menu, using a mouse during fuzz testing), and
   * we want to avoid adding a press again in those cases.
   */
  hasPress(press) {
    return _.some(this._presses.concat(this._backgroundPresses), existingPress => {
      return existingPress.pointer === press.pointer;
    });
  }

  /**
   * Interrupt all listeners on the pointer, except for background listeners that
   * were added by this MultiListener. Useful when it is time for this listener to
   * "take over" and interrupt any other listeners on the pointer.
   */
  interruptOtherListeners(pointer) {
    const listeners = pointer.getListeners();
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      if (listener !== this._backgroundListener) {
        listener.interrupt && listener.interrupt();
      }
    }
  }

  /**
   * Part of the scenery event API. (scenery-internal)
   */
  down(event) {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener down');
    if (event.pointer instanceof Mouse && event.domEvent instanceof MouseEvent && event.domEvent.button !== this._mouseButton) {
      sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener abort: wrong mouse button');
      return;
    }

    // clears the flag for MultiListener behavior
    this._interrupted = false;
    let pressTrail;
    if (!_.includes(event.trail.nodes, this._targetNode)) {
      // if the target Node is not in the event trail, we assume that the event went to the
      // Display or the root Node of the scene graph - this will throw an assertion if
      // there are more than one trails found
      pressTrail = this._targetNode.getUniqueTrailTo(event.target);
    } else {
      pressTrail = event.trail.subtrailTo(this._targetNode, false);
    }
    assert && assert(_.includes(pressTrail.nodes, this._targetNode), 'targetNode must be in the Trail for Press');
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();
    const press = new MultiListenerPress(event.pointer, pressTrail);
    if (!this._allowMoveInterruption && !this._allowMultitouchInterruption) {
      // most restrictive case, only allow presses if the pointer is not attached - Presses
      // are never added as background presses in this case because interruption is never allowed
      if (!event.pointer.isAttached()) {
        sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener unattached, using press');
        this.addPress(press);
      }
    } else {
      // we allow some form of interruption, add as background presses, and we will decide if they
      // should be converted to presses and interrupt other listeners on move event
      sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener attached, adding background press');
      this.addBackgroundPress(press);
    }
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Add a Press to this listener when a new Pointer is down.
   */
  addPress(press) {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener addPress');
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();
    if (!this.hasPress(press)) {
      this._presses.push(press);
      press.pointer.cursor = this._pressCursor;
      press.pointer.addInputListener(this._pressListener, true);
      this.recomputeLocals();
      this.reposition();
    }
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Reposition in response to movement of any Presses.
   */
  movePress(press) {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener movePress');
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();
    this.reposition();
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Remove a Press from this listener.
   */
  removePress(press) {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener removePress');
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();
    press.pointer.removeInputListener(this._pressListener);
    press.pointer.cursor = null;
    arrayRemove(this._presses, press);
    this.recomputeLocals();
    this.reposition();
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Add a background Press, a Press that we receive while a Pointer is already attached. Depending on background
   * Presses, we may interrupt the attached pointer to begin zoom operations.
   */
  addBackgroundPress(press) {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener addBackgroundPress');
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();

    // It's possible that the press pointer already has the listener - for instance in Chrome we fail to get
    // "up" events once the context menu is open (like after a right click), so only add to the Pointer
    // if it isn't already added
    if (!this.hasPress(press)) {
      this._backgroundPresses.push(press);
      press.pointer.addInputListener(this._backgroundListener, false);
    }
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Remove a background Press from this listener.
   */
  removeBackgroundPress(press) {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener removeBackgroundPress');
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();
    press.pointer.removeInputListener(this._backgroundListener);
    arrayRemove(this._backgroundPresses, press);
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Reposition the target Node (including all apsects of transformation) of this listener's target Node.
   */
  reposition() {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener reposition');
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();
    this.matrixProperty.set(this.computeMatrix());
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Recompute the local points of the Presses for this listener, relative to the target Node.
   */
  recomputeLocals() {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener recomputeLocals');
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();
    for (let i = 0; i < this._presses.length; i++) {
      this._presses[i].recomputeLocalPoint();
    }
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Interrupt this listener.
   */
  interrupt() {
    sceneryLog && sceneryLog.InputListener && sceneryLog.InputListener('MultiListener interrupt');
    sceneryLog && sceneryLog.InputListener && sceneryLog.push();
    while (this._presses.length) {
      this.removePress(this._presses[this._presses.length - 1]);
    }
    while (this._backgroundPresses.length) {
      this.removeBackgroundPress(this._backgroundPresses[this._backgroundPresses.length - 1]);
    }
    this._interrupted = true;
    sceneryLog && sceneryLog.InputListener && sceneryLog.pop();
  }

  /**
   * Compute the transformation matrix for the target Node based on Presses.
   */
  computeMatrix() {
    if (this._presses.length === 0) {
      return this._targetNode.getMatrix();
    } else if (this._presses.length === 1) {
      return this.computeSinglePressMatrix();
    } else if (this._allowScale && this._allowRotation) {
      return this.computeTranslationRotationScaleMatrix();
    } else if (this._allowScale) {
      return this.computeTranslationScaleMatrix();
    } else if (this._allowRotation) {
      return this.computeTranslationRotationMatrix();
    } else {
      return this.computeTranslationMatrix();
    }
  }

  /**
   * Compute a transformation matrix from a single press. Single press indicates translation (panning) for the
   * target Node.
   */
  computeSinglePressMatrix() {
    const singleTargetPoint = this._presses[0].targetPoint;
    const localPoint = this._presses[0].localPoint;
    assert && assert(localPoint, 'localPoint is not defined on the Press?');
    const singleMappedPoint = this._targetNode.localToParentPoint(localPoint);
    const delta = singleTargetPoint.minus(singleMappedPoint);
    return Matrix3.translationFromVector(delta).timesMatrix(this._targetNode.getMatrix());
  }

  /**
   * Compute a translation matrix from multiple presses. Usually multiple presses will have some scale or rotation
   * as well, but this is to be used if rotation and scale are not enabled for this listener.
   */
  computeTranslationMatrix() {
    // translation only. linear least-squares simplifies to sum of differences
    const sum = new Vector2(0, 0);
    for (let i = 0; i < this._presses.length; i++) {
      sum.add(this._presses[i].targetPoint);
      const localPoint = this._presses[i].localPoint;
      assert && assert(localPoint, 'localPoint is not defined on the Press?');
      sum.subtract(localPoint);
    }
    return Matrix3.translationFromVector(sum.dividedScalar(this._presses.length));
  }

  /**
   * A transformation matrix from multiple Presses that will translate and scale the target Node.
   */
  computeTranslationScaleMatrix() {
    const localPoints = this._presses.map(press => {
      assert && assert(press.localPoint, 'localPoint is not defined on the Press?');
      return press.localPoint;
    });
    const targetPoints = this._presses.map(press => press.targetPoint);
    const localCentroid = new Vector2(0, 0);
    const targetCentroid = new Vector2(0, 0);
    localPoints.forEach(localPoint => {
      localCentroid.add(localPoint);
    });
    targetPoints.forEach(targetPoint => {
      targetCentroid.add(targetPoint);
    });
    localCentroid.divideScalar(this._presses.length);
    targetCentroid.divideScalar(this._presses.length);
    let localSquaredDistance = 0;
    let targetSquaredDistance = 0;
    localPoints.forEach(localPoint => {
      localSquaredDistance += localPoint.distanceSquared(localCentroid);
    });
    targetPoints.forEach(targetPoint => {
      targetSquaredDistance += targetPoint.distanceSquared(targetCentroid);
    });

    // while fuzz testing, it is possible that the Press points are
    // exactly the same resulting in undefined scale - if that is the case
    // we will not adjust
    let scale = this.getCurrentScale();
    if (targetSquaredDistance !== 0) {
      scale = this.limitScale(Math.sqrt(targetSquaredDistance / localSquaredDistance));
    }
    const translateToTarget = Matrix3.translation(targetCentroid.x, targetCentroid.y);
    const translateFromLocal = Matrix3.translation(-localCentroid.x, -localCentroid.y);
    return translateToTarget.timesMatrix(Matrix3.scaling(scale)).timesMatrix(translateFromLocal);
  }

  /**
   * Limit the provided scale by constraints of this MultiListener.
   */
  limitScale(scale) {
    let correctedScale = Math.max(scale, this._minScale);
    correctedScale = Math.min(correctedScale, this._maxScale);
    return correctedScale;
  }

  /**
   * Compute a transformation matrix that will translate and scale the target Node from multiple presses. Should
   * be used when scaling is not enabled for this listener.
   */
  computeTranslationRotationMatrix() {
    let i;
    const localMatrix = new Matrix(2, this._presses.length);
    const targetMatrix = new Matrix(2, this._presses.length);
    const localCentroid = new Vector2(0, 0);
    const targetCentroid = new Vector2(0, 0);
    for (i = 0; i < this._presses.length; i++) {
      const localPoint = this._presses[i].localPoint;
      const targetPoint = this._presses[i].targetPoint;
      localCentroid.add(localPoint);
      targetCentroid.add(targetPoint);
      localMatrix.set(0, i, localPoint.x);
      localMatrix.set(1, i, localPoint.y);
      targetMatrix.set(0, i, targetPoint.x);
      targetMatrix.set(1, i, targetPoint.y);
    }
    localCentroid.divideScalar(this._presses.length);
    targetCentroid.divideScalar(this._presses.length);

    // determine offsets from the centroids
    for (i = 0; i < this._presses.length; i++) {
      localMatrix.set(0, i, localMatrix.get(0, i) - localCentroid.x);
      localMatrix.set(1, i, localMatrix.get(1, i) - localCentroid.y);
      targetMatrix.set(0, i, targetMatrix.get(0, i) - targetCentroid.x);
      targetMatrix.set(1, i, targetMatrix.get(1, i) - targetCentroid.y);
    }
    const covarianceMatrix = localMatrix.times(targetMatrix.transpose());
    const svd = new SingularValueDecomposition(covarianceMatrix);
    let rotation = svd.getV().times(svd.getU().transpose());
    if (rotation.det() < 0) {
      rotation = svd.getV().times(Matrix.diagonalMatrix([1, -1])).times(svd.getU().transpose());
    }
    const rotation3 = new Matrix3().rowMajor(rotation.get(0, 0), rotation.get(0, 1), 0, rotation.get(1, 0), rotation.get(1, 1), 0, 0, 0, 1);
    const translation = targetCentroid.minus(rotation3.timesVector2(localCentroid));
    rotation3.set02(translation.x);
    rotation3.set12(translation.y);
    return rotation3;
  }

  /**
   * Compute a transformation matrix that will translate, scale, and rotate the target Node from multiple Presses.
   */
  computeTranslationRotationScaleMatrix() {
    let i;
    const localMatrix = new Matrix(this._presses.length * 2, 4);
    for (i = 0; i < this._presses.length; i++) {
      // [ x  y 1 0 ]
      // [ y -x 0 1 ]
      const localPoint = this._presses[i].localPoint;
      localMatrix.set(2 * i + 0, 0, localPoint.x);
      localMatrix.set(2 * i + 0, 1, localPoint.y);
      localMatrix.set(2 * i + 0, 2, 1);
      localMatrix.set(2 * i + 1, 0, localPoint.y);
      localMatrix.set(2 * i + 1, 1, -localPoint.x);
      localMatrix.set(2 * i + 1, 3, 1);
    }
    const targetMatrix = new Matrix(this._presses.length * 2, 1);
    for (i = 0; i < this._presses.length; i++) {
      const targetPoint = this._presses[i].targetPoint;
      targetMatrix.set(2 * i + 0, 0, targetPoint.x);
      targetMatrix.set(2 * i + 1, 0, targetPoint.y);
    }
    const coefficientMatrix = SingularValueDecomposition.pseudoinverse(localMatrix).times(targetMatrix);
    const m11 = coefficientMatrix.get(0, 0);
    const m12 = coefficientMatrix.get(1, 0);
    const m13 = coefficientMatrix.get(2, 0);
    const m23 = coefficientMatrix.get(3, 0);
    return new Matrix3().rowMajor(m11, m12, m13, -m12, m11, m23, 0, 0, 1);
  }

  /**
   * Get the current scale on the target Node, assumes that there is isometric scaling in both x and y.
   */
  getCurrentScale() {
    return this._targetNode.getScaleVector().x;
  }

  /**
   * Reset transform on the target Node.
   */
  resetTransform() {
    this._targetNode.resetTransform();
    this.matrixProperty.set(this._targetNode.matrix.copy());
  }
}
scenery.register('MultiListener', MultiListener);
export default MultiListener;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQcm9wZXJ0eSIsIk1hdHJpeCIsIk1hdHJpeDMiLCJTaW5ndWxhclZhbHVlRGVjb21wb3NpdGlvbiIsIlZlY3RvcjIiLCJhcnJheVJlbW92ZSIsIkludGVudCIsIk1vdXNlIiwiTXVsdGlMaXN0ZW5lclByZXNzIiwic2NlbmVyeSIsIm9wdGlvbml6ZSIsIlRhbmRlbSIsIk1PVkVfSU5URVJSVVBUX01BR05JVFVERSIsIk11bHRpTGlzdGVuZXIiLCJjb25zdHJ1Y3RvciIsInRhcmdldE5vZGUiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwibW91c2VCdXR0b24iLCJwcmVzc0N1cnNvciIsImFsbG93U2NhbGUiLCJhbGxvd1JvdGF0aW9uIiwiYWxsb3dNdWx0aXRvdWNoSW50ZXJydXB0aW9uIiwiYWxsb3dNb3ZlSW50ZXJydXB0aW9uIiwibWluU2NhbGUiLCJtYXhTY2FsZSIsInRhbmRlbSIsIlJFUVVJUkVEIiwiX3RhcmdldE5vZGUiLCJfbWluU2NhbGUiLCJfbWF4U2NhbGUiLCJfbW91c2VCdXR0b24iLCJfcHJlc3NDdXJzb3IiLCJfYWxsb3dTY2FsZSIsIl9hbGxvd1JvdGF0aW9uIiwiX2FsbG93TXVsdGl0b3VjaEludGVycnVwdGlvbiIsIl9hbGxvd01vdmVJbnRlcnJ1cHRpb24iLCJfcHJlc3NlcyIsIl9iYWNrZ3JvdW5kUHJlc3NlcyIsIm1hdHJpeFByb3BlcnR5IiwibWF0cml4IiwiY29weSIsInBoZXRpb1ZhbHVlVHlwZSIsIk1hdHJpeDNJTyIsImNyZWF0ZVRhbmRlbSIsInBoZXRpb1JlYWRPbmx5IiwibGluayIsIl9pbnRlcnJ1cHRlZCIsIl9wcmVzc0xpc3RlbmVyIiwibW92ZSIsImV2ZW50Iiwic2NlbmVyeUxvZyIsIklucHV0TGlzdGVuZXIiLCJwdXNoIiwicHJlc3MiLCJmaW5kUHJlc3MiLCJwb2ludGVyIiwiYXNzZXJ0IiwibW92ZVByZXNzIiwicG9wIiwidXAiLCJyZW1vdmVQcmVzcyIsImNhbmNlbCIsImludGVycnVwdGVkIiwiaW50ZXJydXB0IiwiX2JhY2tncm91bmRMaXN0ZW5lciIsImJhY2tncm91bmRQcmVzcyIsImZpbmRCYWNrZ3JvdW5kUHJlc3MiLCJyZW1vdmVCYWNrZ3JvdW5kUHJlc3MiLCJjYW5kaWRhdGVCYWNrZ3JvdW5kUHJlc3NlcyIsImZpbHRlciIsImhhc0ludGVudCIsIkRSQUciLCJpbml0aWFsUG9pbnQiLCJkaXN0YW5jZSIsInBvaW50IiwiZ2V0Q3VycmVudFNjYWxlIiwibGVuZ3RoIiwiZm9yRWFjaCIsImludGVycnVwdE90aGVyTGlzdGVuZXJzIiwiYWRkUHJlc3MiLCJpIiwiaGFzUHJlc3MiLCJfIiwic29tZSIsImNvbmNhdCIsImV4aXN0aW5nUHJlc3MiLCJsaXN0ZW5lcnMiLCJnZXRMaXN0ZW5lcnMiLCJsaXN0ZW5lciIsImRvd24iLCJkb21FdmVudCIsIk1vdXNlRXZlbnQiLCJidXR0b24iLCJwcmVzc1RyYWlsIiwiaW5jbHVkZXMiLCJ0cmFpbCIsIm5vZGVzIiwiZ2V0VW5pcXVlVHJhaWxUbyIsInRhcmdldCIsInN1YnRyYWlsVG8iLCJpc0F0dGFjaGVkIiwiYWRkQmFja2dyb3VuZFByZXNzIiwiY3Vyc29yIiwiYWRkSW5wdXRMaXN0ZW5lciIsInJlY29tcHV0ZUxvY2FscyIsInJlcG9zaXRpb24iLCJyZW1vdmVJbnB1dExpc3RlbmVyIiwic2V0IiwiY29tcHV0ZU1hdHJpeCIsInJlY29tcHV0ZUxvY2FsUG9pbnQiLCJnZXRNYXRyaXgiLCJjb21wdXRlU2luZ2xlUHJlc3NNYXRyaXgiLCJjb21wdXRlVHJhbnNsYXRpb25Sb3RhdGlvblNjYWxlTWF0cml4IiwiY29tcHV0ZVRyYW5zbGF0aW9uU2NhbGVNYXRyaXgiLCJjb21wdXRlVHJhbnNsYXRpb25Sb3RhdGlvbk1hdHJpeCIsImNvbXB1dGVUcmFuc2xhdGlvbk1hdHJpeCIsInNpbmdsZVRhcmdldFBvaW50IiwidGFyZ2V0UG9pbnQiLCJsb2NhbFBvaW50Iiwic2luZ2xlTWFwcGVkUG9pbnQiLCJsb2NhbFRvUGFyZW50UG9pbnQiLCJkZWx0YSIsIm1pbnVzIiwidHJhbnNsYXRpb25Gcm9tVmVjdG9yIiwidGltZXNNYXRyaXgiLCJzdW0iLCJhZGQiLCJzdWJ0cmFjdCIsImRpdmlkZWRTY2FsYXIiLCJsb2NhbFBvaW50cyIsIm1hcCIsInRhcmdldFBvaW50cyIsImxvY2FsQ2VudHJvaWQiLCJ0YXJnZXRDZW50cm9pZCIsImRpdmlkZVNjYWxhciIsImxvY2FsU3F1YXJlZERpc3RhbmNlIiwidGFyZ2V0U3F1YXJlZERpc3RhbmNlIiwiZGlzdGFuY2VTcXVhcmVkIiwic2NhbGUiLCJsaW1pdFNjYWxlIiwiTWF0aCIsInNxcnQiLCJ0cmFuc2xhdGVUb1RhcmdldCIsInRyYW5zbGF0aW9uIiwieCIsInkiLCJ0cmFuc2xhdGVGcm9tTG9jYWwiLCJzY2FsaW5nIiwiY29ycmVjdGVkU2NhbGUiLCJtYXgiLCJtaW4iLCJsb2NhbE1hdHJpeCIsInRhcmdldE1hdHJpeCIsImdldCIsImNvdmFyaWFuY2VNYXRyaXgiLCJ0aW1lcyIsInRyYW5zcG9zZSIsInN2ZCIsInJvdGF0aW9uIiwiZ2V0ViIsImdldFUiLCJkZXQiLCJkaWFnb25hbE1hdHJpeCIsInJvdGF0aW9uMyIsInJvd01ham9yIiwidGltZXNWZWN0b3IyIiwic2V0MDIiLCJzZXQxMiIsImNvZWZmaWNpZW50TWF0cml4IiwicHNldWRvaW52ZXJzZSIsIm0xMSIsIm0xMiIsIm0xMyIsIm0yMyIsImdldFNjYWxlVmVjdG9yIiwicmVzZXRUcmFuc2Zvcm0iLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIk11bHRpTGlzdGVuZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogTXVsdGlMaXN0ZW5lciBpcyByZXNwb25zaWJsZSBmb3IgbW9uaXRvcmluZyB0aGUgbW91c2UsIHRvdWNoLCBhbmQgb3RoZXIgcHJlc3NlcyBvbiB0aGUgc2NyZWVuIGFuZCBkZXRlcm1pbmVzIHRoZVxyXG4gKiBvcGVyYXRpb25zIHRvIGFwcGx5IHRvIGEgdGFyZ2V0IE5vZGUgZnJvbSB0aGlzIGlucHV0LiBTaW5nbGUgdG91Y2ggZHJhZ2dpbmcgb24gdGhlIHNjcmVlbiB3aWxsIGluaXRpYXRlXHJcbiAqIHBhbm5pbmcuIE11bHRpLXRvdWNoIGdlc3R1cmVzIHdpbGwgaW5pdGlhdGUgc2NhbGluZywgdHJhbnNsYXRpb24sIGFuZCBwb3RlbnRpYWxseSByb3RhdGlvbiBkZXBlbmRpbmcgb25cclxuICogdGhlIGdlc3R1cmUuXHJcbiAqXHJcbiAqIE11bHRpTGlzdGVuZXIgd2lsbCBrZWVwIHRyYWNrIG9mIGFsbCBcImJhY2tncm91bmRcIiBwcmVzc2VzIG9uIHRoZSBzY3JlZW4uIFdoZW4gY2VydGFpbiBjb25kaXRpb25zIGFyZSBtZXQsIHRoZVxyXG4gKiBcImJhY2tncm91bmRcIiBwcmVzc2VzIGJlY29tZSBhY3RpdmUgYW5kIGF0dGFjaGVkIGxpc3RlbmVycyBtYXkgYmUgaW50ZXJydXB0ZWQgc28gdGhhdCB0aGUgTXVsdGlMaXN0ZW5lclxyXG4gKiBnZXN0dXJlcyB0YWtlIHByZWNlZGVuY2UuIE11bHRpTGlzdGVuZXIgdXNlcyB0aGUgSW50ZW50IGZlYXR1cmUgb2YgUG9pbnRlciwgc28gdGhhdCB0aGUgZGVmYXVsdCBiZWhhdmlvciBvZiB0aGlzXHJcbiAqIGxpc3RlbmVyIGNhbiBiZSBwcmV2ZW50ZWQgaWYgbmVjZXNzYXJ5LiBHZW5lcmFsbHksIHlvdSB3b3VsZCB1c2UgUG9pbnRlci5yZXNlcnZlRm9yRHJhZygpIHRvIGluZGljYXRlXHJcbiAqIHRoYXQgeW91ciBOb2RlIGlzIGludGVuZGVkIGZvciBvdGhlciBpbnB1dCB0aGF0IHNob3VsZCBub3QgYmUgaW50ZXJydXB0ZWQgYnkgdGhpcyBsaXN0ZW5lci5cclxuICpcclxuICogRm9yIGV4YW1wbGUgdXNhZ2UsIHNlZSBzY2VuZXJ5L2V4YW1wbGVzL2lucHV0Lmh0bWwuIEEgdHlwaWNhbCBcInNpbXBsZVwiIE11bHRpTGlzdGVuZXIgdXNhZ2VcclxuICogd291bGQgYmUgc29tZXRoaW5nIGxpa2U6XHJcbiAqXHJcbiAqICAgIGRpc3BsYXkuYWRkSW5wdXRMaXN0ZW5lciggbmV3IFByZXNzTGlzdGVuZXIoIHRhcmdldE5vZGUgKSApO1xyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqIEBhdXRob3IgSmVzc2UgR3JlZW5iZXJnXHJcbiAqL1xyXG5cclxuaW1wb3J0IFByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgTWF0cml4IGZyb20gJy4uLy4uLy4uL2RvdC9qcy9NYXRyaXguanMnO1xyXG5pbXBvcnQgTWF0cml4MyBmcm9tICcuLi8uLi8uLi9kb3QvanMvTWF0cml4My5qcyc7XHJcbmltcG9ydCBTaW5ndWxhclZhbHVlRGVjb21wb3NpdGlvbiBmcm9tICcuLi8uLi8uLi9kb3QvanMvU2luZ3VsYXJWYWx1ZURlY29tcG9zaXRpb24uanMnO1xyXG5pbXBvcnQgVmVjdG9yMiBmcm9tICcuLi8uLi8uLi9kb3QvanMvVmVjdG9yMi5qcyc7XHJcbmltcG9ydCBhcnJheVJlbW92ZSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvYXJyYXlSZW1vdmUuanMnO1xyXG5pbXBvcnQgeyBJbnRlbnQsIE1vdXNlLCBNdWx0aUxpc3RlbmVyUHJlc3MsIE5vZGUsIFBvaW50ZXIsIHNjZW5lcnksIFNjZW5lcnlFdmVudCwgVElucHV0TGlzdGVuZXIgfSBmcm9tICcuLi9pbXBvcnRzLmpzJztcclxuaW1wb3J0IHsgUGhldGlvT2JqZWN0T3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy9QaGV0aW9PYmplY3QuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5cclxuLy8gY29uc3RhbnRzXHJcbi8vIHBvaW50ZXIgbXVzdCBtb3ZlIHRoaXMgbXVjaCB0byBpbml0aWF0ZSBhIG1vdmUgaW50ZXJydXB0aW9uIGZvciBwYW5uaW5nLCBpbiB0aGUgZ2xvYmFsIGNvb3JkaW5hdGUgZnJhbWVcclxuY29uc3QgTU9WRV9JTlRFUlJVUFRfTUFHTklUVURFID0gMjU7XHJcblxyXG5leHBvcnQgdHlwZSBNdWx0aUxpc3RlbmVyT3B0aW9ucyA9IHtcclxuXHJcbiAgLy8ge251bWJlcn0gLSBSZXN0cmljdHMgaW5wdXQgdG8gdGhlIHNwZWNpZmllZCBtb3VzZSBidXR0b24gKGJ1dCBhbGxvd3MgYW55IHRvdWNoKS4gT25seSBvbmUgbW91c2UgYnV0dG9uIGlzXHJcbiAgLy8gYWxsb3dlZCBhdCBhIHRpbWUuIFRoZSBidXR0b24gbnVtYmVycyBhcmUgZGVmaW5lZCBpbiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvTW91c2VFdmVudC9idXR0b24sXHJcbiAgLy8gd2hlcmUgdHlwaWNhbGx5OlxyXG4gIC8vICAgMDogTGVmdCBtb3VzZSBidXR0b25cclxuICAvLyAgIDE6IE1pZGRsZSBtb3VzZSBidXR0b24gKG9yIHdoZWVsIHByZXNzKVxyXG4gIC8vICAgMjogUmlnaHQgbW91c2UgYnV0dG9uXHJcbiAgLy8gICAzKzogb3RoZXIgc3BlY2lmaWMgbnVtYmVyZWQgYnV0dG9ucyB0aGF0IGFyZSBtb3JlIHJhcmVcclxuICBtb3VzZUJ1dHRvbj86IG51bWJlcjtcclxuXHJcbiAgLy8ge3N0cmluZ30gLSBTZXRzIHRoZSBQb2ludGVyIGN1cnNvciB0byB0aGlzIGN1cnNvciB3aGVuIHRoZSBsaXN0ZW5lciBpcyBcInByZXNzZWRcIi5cclxuICBwcmVzc0N1cnNvcj86IHN0cmluZztcclxuXHJcbiAgLy8ge2Jvb2xlYW59IC0gSWYgdHJ1ZSwgdGhlIGxpc3RlbmVyIHdpbGwgc2NhbGUgdGhlIHRhcmdldE5vZGUgZnJvbSBpbnB1dFxyXG4gIGFsbG93U2NhbGU/OiBib29sZWFuO1xyXG5cclxuICAvLyB7Ym9vbGVhbn0gLSBJZiB0cnVlLCB0aGUgbGlzdGVuZXIgd2lsbCByb3RhdGUgdGhlIHRhcmdldE5vZGUgZnJvbSBpbnB1dFxyXG4gIGFsbG93Um90YXRpb24/OiBib29sZWFuO1xyXG5cclxuICAvLyB7Ym9vbGVhbn0gLSBpZiB0cnVlLCBtdWx0aXRvdWNoIHdpbGwgaW50ZXJydXB0IGFueSBhY3RpdmUgcG9pbnRlciBsaXN0ZW5lcnMgYW5kIGluaXRpYXRlIHRyYW5zbGF0aW9uXHJcbiAgLy8gYW5kIHNjYWxlIGZyb20gbXVsdGl0b3VjaCBnZXN0dXJlc1xyXG4gIGFsbG93TXVsdGl0b3VjaEludGVycnVwdGlvbj86IGJvb2xlYW47XHJcblxyXG4gIC8vIGlmIHRydWUsIGEgY2VydGFpbiBhbW91bnQgb2YgbW92ZW1lbnQgaW4gdGhlIGdsb2JhbCBjb29yZGluYXRlIGZyYW1lIHdpbGwgaW50ZXJydXB0IGFueSBwb2ludGVyIGxpc3RlbmVycyBhbmRcclxuICAvLyBpbml0aWF0ZSB0cmFuc2xhdGlvbiBmcm9tIHRoZSBwb2ludGVyLCB1bmxlc3MgZGVmYXVsdCBiZWhhdmlvciBoYXMgYmVlbiBwcmV2ZW50ZWQgYnkgc2V0dGluZyBJbnRlbnQgb24gdGhlIFBvaW50ZXIuXHJcbiAgYWxsb3dNb3ZlSW50ZXJydXB0aW9uPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gbWFnbml0dWRlIGxpbWl0cyBmb3Igc2NhbGluZyBpbiBib3RoIHggYW5kIHlcclxuICBtaW5TY2FsZT86IG51bWJlcjtcclxuICBtYXhTY2FsZT86IG51bWJlcjtcclxufSAmIFBpY2s8UGhldGlvT2JqZWN0T3B0aW9ucywgJ3RhbmRlbSc+O1xyXG5cclxuY2xhc3MgTXVsdGlMaXN0ZW5lciBpbXBsZW1lbnRzIFRJbnB1dExpc3RlbmVyIHtcclxuXHJcbiAgLy8gdGhlIE5vZGUgdGhhdCB3aWxsIGJlIHRyYW5zZm9ybWVkIGJ5IHRoaXMgbGlzdGVuZXJcclxuICBwcm90ZWN0ZWQgcmVhZG9ubHkgX3RhcmdldE5vZGU6IE5vZGU7XHJcblxyXG4gIC8vIHNlZSBvcHRpb25zXHJcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IF9taW5TY2FsZTogbnVtYmVyO1xyXG4gIHByb3RlY3RlZCByZWFkb25seSBfbWF4U2NhbGU6IG51bWJlcjtcclxuICBwcml2YXRlIHJlYWRvbmx5IF9tb3VzZUJ1dHRvbjogbnVtYmVyO1xyXG4gIHByb3RlY3RlZCByZWFkb25seSBfcHJlc3NDdXJzb3I6IHN0cmluZztcclxuICBwcml2YXRlIHJlYWRvbmx5IF9hbGxvd1NjYWxlOiBib29sZWFuO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgX2FsbG93Um90YXRpb246IGJvb2xlYW47XHJcbiAgcHJpdmF0ZSByZWFkb25seSBfYWxsb3dNdWx0aXRvdWNoSW50ZXJydXB0aW9uOiBib29sZWFuO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgX2FsbG93TW92ZUludGVycnVwdGlvbjogYm9vbGVhbjtcclxuXHJcbiAgLy8gTGlzdCBvZiBcImFjdGl2ZVwiIFByZXNzZXMgZG93biBmcm9tIFBvaW50ZXIgaW5wdXQgd2hpY2ggYXJlIGFjdGl2ZWx5IGNoYW5naW5nIHRoZSB0cmFuc2Zvcm1hdGlvbiBvZiB0aGUgdGFyZ2V0IE5vZGVcclxuICBwcm90ZWN0ZWQgcmVhZG9ubHkgX3ByZXNzZXM6IE11bHRpTGlzdGVuZXJQcmVzc1tdO1xyXG5cclxuICAvLyBMaXN0IG9mIFwiYmFja2dyb3VuZFwiIHByZXNzZXMgd2hpY2ggYXJlIHNhdmVkIGJ1dCBub3QgeWV0IGRvaW5nIGFueXRoaW5nIGZvciB0aGUgdGFyZ2V0IE5vZGUgdHJhbnNmb3JtYXRpb24uIElmXHJcbiAgLy8gdGhlIFBvaW50ZXIgYWxyZWFkeSBoYXMgbGlzdGVuZXJzLCBQcmVzc2VzIGFyZSBhZGRlZCB0byB0aGUgYmFja2dyb3VuZCBhbmQgd2FpdCB0byBiZSBjb252ZXJ0ZWQgdG8gXCJhY3RpdmVcIlxyXG4gIC8vIHByZXNzZXMgdW50aWwgd2UgYXJlIGFsbG93ZWQgdG8gaW50ZXJydXB0IHRoZSBvdGhlciBsaXN0ZW5lcnMuIFJlbGF0ZWQgdG8gb3B0aW9ucyBcImFsbG93TW92ZUludGVycnVwdFwiIGFuZFxyXG4gIC8vIFwiYWxsb3dNdWx0aXRvdWNoSW50ZXJydXB0XCIsIHdoZXJlIG90aGVyIFBvaW50ZXIgbGlzdGVuZXJzIGFyZSBpbnRlcnJ1cHRlZCBpbiB0aGVzZSBjYXNlcy5cclxuICBwcml2YXRlIHJlYWRvbmx5IF9iYWNrZ3JvdW5kUHJlc3NlczogTXVsdGlMaXN0ZW5lclByZXNzW107XHJcblxyXG4gIC8vIHtQcm9wZXJ0eS48TWF0cml4Mz59IC0gVGhlIG1hdHJpeCBhcHBsaWVkIHRvIHRoZSB0YXJnZXROb2RlIGluIHJlc3BvbnNlIHRvIHZhcmlvdXMgaW5wdXQgZm9yIHRoZSBNdWx0aUxpc3RlbmVyXHJcbiAgcHVibGljIHJlYWRvbmx5IG1hdHJpeFByb3BlcnR5OiBQcm9wZXJ0eTxNYXRyaXgzPjtcclxuXHJcbiAgLy8gV2hldGhlciB0aGUgbGlzdGVuZXIgd2FzIGludGVycnVwdGVkLCBpbiB3aGljaCBjYXNlIHdlIG1heSBuZWVkIHRvIHByZXZlbnQgY2VydGFpbiBiZWhhdmlvci4gSWYgdGhlIGxpc3RlbmVyIHdhc1xyXG4gIC8vIGludGVycnVwdGVkLCBwb2ludGVyIGxpc3RlbmVycyBtaWdodCBzdGlsbCBiZSBjYWxsZWQgc2luY2UgaW5wdXQgaXMgZGlzcGF0Y2hlZCB0byBhIGRlZmVuc2l2ZSBjb3B5IG9mIHRoZVxyXG4gIC8vIFBvaW50ZXIncyBsaXN0ZW5lcnMuIEJ1dCBwcmVzc2VzIHdpbGwgaGF2ZSBiZWVuIGNsZWFyZWQgaW4gdGhpcyBjYXNlIHNvIHdlIHdvbid0IHRyeSB0byBkbyBhbnkgd29yayBvbiB0aGVtLlxyXG4gIHByaXZhdGUgX2ludGVycnVwdGVkOiBib29sZWFuO1xyXG5cclxuICAvLyBhdHRhY2hlZCB0byB0aGUgUG9pbnRlciB3aGVuIGEgUHJlc3MgaXMgYWRkZWRcclxuICBwcml2YXRlIF9wcmVzc0xpc3RlbmVyOiBUSW5wdXRMaXN0ZW5lcjtcclxuXHJcbiAgLy8gYXR0YWNoZWQgdG8gdGhlIFBvaW50ZXIgd2hlbiBwcmVzc2VzIGFyZSBhZGRlZCAtIHdhaXRzIGZvciBjZXJ0YWluIGNvbmRpdGlvbnMgdG8gYmUgbWV0IGJlZm9yZSBjb252ZXJ0aW5nXHJcbiAgLy8gYmFja2dyb3VuZCBwcmVzc2VzIHRvIGFjdGl2ZSBwcmVzc2VzIHRvIGVuYWJsZSBtdWx0aXRvdWNoIGxpc3RlbmVyIGJlaGF2aW9yXHJcbiAgcHJpdmF0ZSBfYmFja2dyb3VuZExpc3RlbmVyOiBUSW5wdXRMaXN0ZW5lcjtcclxuXHJcbiAgLyoqXHJcbiAgICogQGNvbnN0cnVjdG9yXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdGFyZ2V0Tm9kZSAtIFRoZSBOb2RlIHRoYXQgc2hvdWxkIGJlIHRyYW5zZm9ybWVkIGJ5IHRoaXMgTXVsdGlMaXN0ZW5lci5cclxuICAgKiBAcGFyYW0gW3Byb3ZpZGVkT3B0aW9uc11cclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHRhcmdldE5vZGU6IE5vZGUsIHByb3ZpZGVkT3B0aW9ucz86IE11bHRpTGlzdGVuZXJPcHRpb25zICkge1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxNdWx0aUxpc3RlbmVyT3B0aW9ucz4oKSgge1xyXG4gICAgICBtb3VzZUJ1dHRvbjogMCxcclxuICAgICAgcHJlc3NDdXJzb3I6ICdwb2ludGVyJyxcclxuICAgICAgYWxsb3dTY2FsZTogdHJ1ZSxcclxuICAgICAgYWxsb3dSb3RhdGlvbjogdHJ1ZSxcclxuICAgICAgYWxsb3dNdWx0aXRvdWNoSW50ZXJydXB0aW9uOiBmYWxzZSxcclxuICAgICAgYWxsb3dNb3ZlSW50ZXJydXB0aW9uOiB0cnVlLFxyXG4gICAgICBtaW5TY2FsZTogMSxcclxuICAgICAgbWF4U2NhbGU6IDQsXHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLlJFUVVJUkVEXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICB0aGlzLl90YXJnZXROb2RlID0gdGFyZ2V0Tm9kZTtcclxuICAgIHRoaXMuX21pblNjYWxlID0gb3B0aW9ucy5taW5TY2FsZTtcclxuICAgIHRoaXMuX21heFNjYWxlID0gb3B0aW9ucy5tYXhTY2FsZTtcclxuICAgIHRoaXMuX21vdXNlQnV0dG9uID0gb3B0aW9ucy5tb3VzZUJ1dHRvbjtcclxuICAgIHRoaXMuX3ByZXNzQ3Vyc29yID0gb3B0aW9ucy5wcmVzc0N1cnNvcjtcclxuICAgIHRoaXMuX2FsbG93U2NhbGUgPSBvcHRpb25zLmFsbG93U2NhbGU7XHJcbiAgICB0aGlzLl9hbGxvd1JvdGF0aW9uID0gb3B0aW9ucy5hbGxvd1JvdGF0aW9uO1xyXG4gICAgdGhpcy5fYWxsb3dNdWx0aXRvdWNoSW50ZXJydXB0aW9uID0gb3B0aW9ucy5hbGxvd011bHRpdG91Y2hJbnRlcnJ1cHRpb247XHJcbiAgICB0aGlzLl9hbGxvd01vdmVJbnRlcnJ1cHRpb24gPSBvcHRpb25zLmFsbG93TW92ZUludGVycnVwdGlvbjtcclxuICAgIHRoaXMuX3ByZXNzZXMgPSBbXTtcclxuICAgIHRoaXMuX2JhY2tncm91bmRQcmVzc2VzID0gW107XHJcblxyXG4gICAgdGhpcy5tYXRyaXhQcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSggdGFyZ2V0Tm9kZS5tYXRyaXguY29weSgpLCB7XHJcbiAgICAgIHBoZXRpb1ZhbHVlVHlwZTogTWF0cml4My5NYXRyaXgzSU8sXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAnbWF0cml4UHJvcGVydHknICksXHJcbiAgICAgIHBoZXRpb1JlYWRPbmx5OiB0cnVlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gYXNzaWduIHRoZSBtYXRyaXggdG8gdGhlIHRhcmdldE5vZGUgd2hlbmV2ZXIgaXQgY2hhbmdlc1xyXG4gICAgdGhpcy5tYXRyaXhQcm9wZXJ0eS5saW5rKCBtYXRyaXggPT4ge1xyXG4gICAgICB0aGlzLl90YXJnZXROb2RlLm1hdHJpeCA9IG1hdHJpeDtcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLl9pbnRlcnJ1cHRlZCA9IGZhbHNlO1xyXG5cclxuICAgIHRoaXMuX3ByZXNzTGlzdGVuZXIgPSB7XHJcbiAgICAgIG1vdmU6IGV2ZW50ID0+IHtcclxuICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIoICdNdWx0aUxpc3RlbmVyIHBvaW50ZXIgbW92ZScgKTtcclxuICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICAgICAgY29uc3QgcHJlc3MgPSB0aGlzLmZpbmRQcmVzcyggZXZlbnQucG9pbnRlciApITtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBwcmVzcywgJ1ByZXNzIHNob3VsZCBiZSBmb3VuZCBmb3IgbW92ZSBldmVudCcgKTtcclxuICAgICAgICB0aGlzLm1vdmVQcmVzcyggcHJlc3MgKTtcclxuXHJcbiAgICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIHVwOiBldmVudCA9PiB7XHJcbiAgICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyKCAnTXVsdGlMaXN0ZW5lciBwb2ludGVyIHVwJyApO1xyXG4gICAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgICAgICBjb25zdCBwcmVzcyA9IHRoaXMuZmluZFByZXNzKCBldmVudC5wb2ludGVyICkhO1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHByZXNzLCAnUHJlc3Mgc2hvdWxkIGJlIGZvdW5kIGZvciB1cCBldmVudCcgKTtcclxuICAgICAgICB0aGlzLnJlbW92ZVByZXNzKCBwcmVzcyApO1xyXG5cclxuICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgY2FuY2VsOiBldmVudCA9PiB7XHJcbiAgICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyKCAnTXVsdGlMaXN0ZW5lciBwb2ludGVyIGNhbmNlbCcgKTtcclxuICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICAgICAgY29uc3QgcHJlc3MgPSB0aGlzLmZpbmRQcmVzcyggZXZlbnQucG9pbnRlciApITtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBwcmVzcywgJ1ByZXNzIHNob3VsZCBiZSBmb3VuZCBmb3IgY2FuY2VsIGV2ZW50JyApO1xyXG4gICAgICAgIHByZXNzLmludGVycnVwdGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdGhpcy5yZW1vdmVQcmVzcyggcHJlc3MgKTtcclxuXHJcbiAgICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIGludGVycnVwdDogKCkgPT4ge1xyXG4gICAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciggJ011bHRpTGlzdGVuZXIgcG9pbnRlciBpbnRlcnJ1cHQnICk7XHJcbiAgICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgICAgIC8vIEZvciB0aGUgZnV0dXJlLCB3ZSBjb3VsZCBmaWd1cmUgb3V0IGhvdyB0byB0cmFjayB0aGUgcG9pbnRlciB0aGF0IGNhbGxzIHRoaXNcclxuICAgICAgICB0aGlzLmludGVycnVwdCgpO1xyXG5cclxuICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuX2JhY2tncm91bmRMaXN0ZW5lciA9IHtcclxuICAgICAgdXA6IGV2ZW50ID0+IHtcclxuICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIoICdNdWx0aUxpc3RlbmVyIGJhY2tncm91bmQgdXAnICk7XHJcbiAgICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgICAgIGlmICggIXRoaXMuX2ludGVycnVwdGVkICkge1xyXG4gICAgICAgICAgY29uc3QgYmFja2dyb3VuZFByZXNzID0gdGhpcy5maW5kQmFja2dyb3VuZFByZXNzKCBldmVudC5wb2ludGVyICkhO1xyXG4gICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggYmFja2dyb3VuZFByZXNzLCAnQmFja2dyb3VuZCBwcmVzcyBzaG91bGQgYmUgZm91bmQgZm9yIHVwIGV2ZW50JyApO1xyXG4gICAgICAgICAgdGhpcy5yZW1vdmVCYWNrZ3JvdW5kUHJlc3MoIGJhY2tncm91bmRQcmVzcyApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIG1vdmU6IGV2ZW50ID0+IHtcclxuXHJcbiAgICAgICAgLy8gQW55IGJhY2tncm91bmQgcHJlc3MgbmVlZHMgdG8gbWVldCBjZXJ0YWluIGNvbmRpdGlvbnMgdG8gYmUgcHJvbW90ZWQgdG8gYW4gYWN0dWFsIHByZXNzIHRoYXQgcGFucy96b29tc1xyXG4gICAgICAgIGNvbnN0IGNhbmRpZGF0ZUJhY2tncm91bmRQcmVzc2VzID0gdGhpcy5fYmFja2dyb3VuZFByZXNzZXMuZmlsdGVyKCBwcmVzcyA9PiB7XHJcblxyXG4gICAgICAgICAgLy8gRHJhZ2dlZCBwb2ludGVycyBhbmQgcG9pbnRlcnMgdGhhdCBoYXZlbid0IG1vdmVkIGEgY2VydGFpbiBkaXN0YW5jZSBhcmUgbm90IGNhbmRpZGF0ZXMsIGFuZCBzaG91bGQgbm90IGJlXHJcbiAgICAgICAgICAvLyBpbnRlcnJ1cHRlZC4gV2UgZG9uJ3Qgd2FudCB0byBpbnRlcnJ1cHQgdGFwcyB0aGF0IG1pZ2h0IG1vdmUgYSBsaXR0bGUgYml0XHJcbiAgICAgICAgICByZXR1cm4gIXByZXNzLnBvaW50ZXIuaGFzSW50ZW50KCBJbnRlbnQuRFJBRyApICYmIHByZXNzLmluaXRpYWxQb2ludC5kaXN0YW5jZSggcHJlc3MucG9pbnRlci5wb2ludCApID4gTU9WRV9JTlRFUlJVUFRfTUFHTklUVURFO1xyXG4gICAgICAgIH0gKTtcclxuXHJcbiAgICAgICAgLy8gSWYgd2UgYXJlIGFscmVhZHkgem9vbWVkIGluLCB3ZSBzaG91bGQgcHJvbW90ZSBhbnkgbnVtYmVyIG9mIGJhY2tncm91bmQgcHJlc3NlcyB0byBhY3R1YWwgcHJlc3Nlcy5cclxuICAgICAgICAvLyBPdGhlcndpc2UsIHdlJ2xsIG5lZWQgYXQgbGVhc3QgdHdvIHByZXNzZXMgdG8gem9vbVxyXG4gICAgICAgIC8vIEl0IGlzIG5pY2UgdG8gYWxsb3cgZG93biBwb2ludGVycyB0byBtb3ZlIGFyb3VuZCBmcmVlbHkgd2l0aG91dCBpbnRlcnJ1cHRpb24gd2hlbiB0aGVyZSBpc24ndCBhbnkgem9vbSxcclxuICAgICAgICAvLyBidXQgd2Ugc3RpbGwgYWxsb3cgaW50ZXJydXB0aW9uIGlmIHRoZSBudW1iZXIgb2YgYmFja2dyb3VuZCBwcmVzc2VzIGluZGljYXRlIHRoZSB1c2VyIGlzIHRyeWluZyB0b1xyXG4gICAgICAgIC8vIHpvb20gaW5cclxuICAgICAgICBpZiAoIHRoaXMuZ2V0Q3VycmVudFNjYWxlKCkgIT09IDEgfHwgY2FuZGlkYXRlQmFja2dyb3VuZFByZXNzZXMubGVuZ3RoID49IDIgKSB7XHJcbiAgICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIoICdNdWx0aUxpc3RlbmVyIGF0dGFjaGVkLCBpbnRlcnJ1cHRpbmcgZm9yIHByZXNzJyApO1xyXG5cclxuICAgICAgICAgIC8vIENvbnZlcnQgYWxsIGNhbmRpZGF0ZSBiYWNrZ3JvdW5kIHByZXNzZXMgdG8gYWN0dWFsIHByZXNzZXNcclxuICAgICAgICAgIGNhbmRpZGF0ZUJhY2tncm91bmRQcmVzc2VzLmZvckVhY2goIHByZXNzID0+IHtcclxuICAgICAgICAgICAgdGhpcy5yZW1vdmVCYWNrZ3JvdW5kUHJlc3MoIHByZXNzICk7XHJcbiAgICAgICAgICAgIHRoaXMuaW50ZXJydXB0T3RoZXJMaXN0ZW5lcnMoIHByZXNzLnBvaW50ZXIgKTtcclxuICAgICAgICAgICAgdGhpcy5hZGRQcmVzcyggcHJlc3MgKTtcclxuICAgICAgICAgIH0gKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBjYW5jZWw6IGV2ZW50ID0+IHtcclxuICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIoICdNdWx0aUxpc3RlbmVyIGJhY2tncm91bmQgY2FuY2VsJyApO1xyXG4gICAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgICAgICBpZiAoICF0aGlzLl9pbnRlcnJ1cHRlZCApIHtcclxuICAgICAgICAgIGNvbnN0IGJhY2tncm91bmRQcmVzcyA9IHRoaXMuZmluZEJhY2tncm91bmRQcmVzcyggZXZlbnQucG9pbnRlciApITtcclxuICAgICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGJhY2tncm91bmRQcmVzcywgJ0JhY2tncm91bmQgcHJlc3Mgc2hvdWxkIGJlIGZvdW5kIGZvciBjYW5jZWwgZXZlbnQnICk7XHJcbiAgICAgICAgICB0aGlzLnJlbW92ZUJhY2tncm91bmRQcmVzcyggYmFja2dyb3VuZFByZXNzICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgaW50ZXJydXB0OiAoKSA9PiB7XHJcbiAgICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyKCAnTXVsdGlMaXN0ZW5lciBiYWNrZ3JvdW5kIGludGVycnVwdCcgKTtcclxuICAgICAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICAgICAgdGhpcy5pbnRlcnJ1cHQoKTtcclxuXHJcbiAgICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZpbmRzIGEgUHJlc3MgYnkgc2VhcmNoaW5nIGZvciB0aGUgb25lIHdpdGggdGhlIHByb3ZpZGVkIFBvaW50ZXIuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBmaW5kUHJlc3MoIHBvaW50ZXI6IFBvaW50ZXIgKTogTXVsdGlMaXN0ZW5lclByZXNzIHwgbnVsbCB7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLl9wcmVzc2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBpZiAoIHRoaXMuX3ByZXNzZXNbIGkgXS5wb2ludGVyID09PSBwb2ludGVyICkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9wcmVzc2VzWyBpIF07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmluZCBhIGJhY2tncm91bmQgUHJlc3MgYnkgc2VhcmNoaW5nIGZvciBvbmUgd2l0aCB0aGUgcHJvdmlkZWQgUG9pbnRlci4gQSBiYWNrZ3JvdW5kIFByZXNzIGlzIG9uZSBjcmVhdGVkXHJcbiAgICogd2hlbiB3ZSByZWNlaXZlIGFuIGV2ZW50IHdoaWxlIGEgUG9pbnRlciBpcyBhbHJlYWR5IGF0dGFjaGVkLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZmluZEJhY2tncm91bmRQcmVzcyggcG9pbnRlcjogUG9pbnRlciApOiBNdWx0aUxpc3RlbmVyUHJlc3MgfCBudWxsIHtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuX2JhY2tncm91bmRQcmVzc2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBpZiAoIHRoaXMuX2JhY2tncm91bmRQcmVzc2VzWyBpIF0ucG9pbnRlciA9PT0gcG9pbnRlciApIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYmFja2dyb3VuZFByZXNzZXNbIGkgXTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIHByZXNzIGlzIGFscmVhZHkgY29udGFpbmVkIGluIG9uZSBvZiB0aGlzLl9iYWNrZ3JvdW5kUHJlc3NlcyBvciB0aGlzLl9wcmVzc2VzLiBUaGVyZSBhcmUgY2FzZXNcclxuICAgKiB3aGVyZSB3ZSBtYXkgdHJ5IHRvIGFkZCB0aGUgc2FtZSBwb2ludGVyIHR3aWNlICh1c2VyIG9wZW5lZCBjb250ZXh0IG1lbnUsIHVzaW5nIGEgbW91c2UgZHVyaW5nIGZ1enogdGVzdGluZyksIGFuZFxyXG4gICAqIHdlIHdhbnQgdG8gYXZvaWQgYWRkaW5nIGEgcHJlc3MgYWdhaW4gaW4gdGhvc2UgY2FzZXMuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBoYXNQcmVzcyggcHJlc3M6IE11bHRpTGlzdGVuZXJQcmVzcyApOiBib29sZWFuIHtcclxuICAgIHJldHVybiBfLnNvbWUoIHRoaXMuX3ByZXNzZXMuY29uY2F0KCB0aGlzLl9iYWNrZ3JvdW5kUHJlc3NlcyApLCBleGlzdGluZ1ByZXNzID0+IHtcclxuICAgICAgcmV0dXJuIGV4aXN0aW5nUHJlc3MucG9pbnRlciA9PT0gcHJlc3MucG9pbnRlcjtcclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEludGVycnVwdCBhbGwgbGlzdGVuZXJzIG9uIHRoZSBwb2ludGVyLCBleGNlcHQgZm9yIGJhY2tncm91bmQgbGlzdGVuZXJzIHRoYXRcclxuICAgKiB3ZXJlIGFkZGVkIGJ5IHRoaXMgTXVsdGlMaXN0ZW5lci4gVXNlZnVsIHdoZW4gaXQgaXMgdGltZSBmb3IgdGhpcyBsaXN0ZW5lciB0b1xyXG4gICAqIFwidGFrZSBvdmVyXCIgYW5kIGludGVycnVwdCBhbnkgb3RoZXIgbGlzdGVuZXJzIG9uIHRoZSBwb2ludGVyLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgaW50ZXJydXB0T3RoZXJMaXN0ZW5lcnMoIHBvaW50ZXI6IFBvaW50ZXIgKTogdm9pZCB7XHJcbiAgICBjb25zdCBsaXN0ZW5lcnMgPSBwb2ludGVyLmdldExpc3RlbmVycygpO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBsaXN0ZW5lciA9IGxpc3RlbmVyc1sgaSBdO1xyXG4gICAgICBpZiAoIGxpc3RlbmVyICE9PSB0aGlzLl9iYWNrZ3JvdW5kTGlzdGVuZXIgKSB7XHJcbiAgICAgICAgbGlzdGVuZXIuaW50ZXJydXB0ICYmIGxpc3RlbmVyLmludGVycnVwdCgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQYXJ0IG9mIHRoZSBzY2VuZXJ5IGV2ZW50IEFQSS4gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIGRvd24oIGV2ZW50OiBTY2VuZXJ5RXZlbnQgKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIoICdNdWx0aUxpc3RlbmVyIGRvd24nICk7XHJcblxyXG4gICAgaWYgKCBldmVudC5wb2ludGVyIGluc3RhbmNlb2YgTW91c2UgJiYgZXZlbnQuZG9tRXZlbnQgaW5zdGFuY2VvZiBNb3VzZUV2ZW50ICYmIGV2ZW50LmRvbUV2ZW50LmJ1dHRvbiAhPT0gdGhpcy5fbW91c2VCdXR0b24gKSB7XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciggJ011bHRpTGlzdGVuZXIgYWJvcnQ6IHdyb25nIG1vdXNlIGJ1dHRvbicgKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGNsZWFycyB0aGUgZmxhZyBmb3IgTXVsdGlMaXN0ZW5lciBiZWhhdmlvclxyXG4gICAgdGhpcy5faW50ZXJydXB0ZWQgPSBmYWxzZTtcclxuXHJcbiAgICBsZXQgcHJlc3NUcmFpbDtcclxuICAgIGlmICggIV8uaW5jbHVkZXMoIGV2ZW50LnRyYWlsLm5vZGVzLCB0aGlzLl90YXJnZXROb2RlICkgKSB7XHJcblxyXG4gICAgICAvLyBpZiB0aGUgdGFyZ2V0IE5vZGUgaXMgbm90IGluIHRoZSBldmVudCB0cmFpbCwgd2UgYXNzdW1lIHRoYXQgdGhlIGV2ZW50IHdlbnQgdG8gdGhlXHJcbiAgICAgIC8vIERpc3BsYXkgb3IgdGhlIHJvb3QgTm9kZSBvZiB0aGUgc2NlbmUgZ3JhcGggLSB0aGlzIHdpbGwgdGhyb3cgYW4gYXNzZXJ0aW9uIGlmXHJcbiAgICAgIC8vIHRoZXJlIGFyZSBtb3JlIHRoYW4gb25lIHRyYWlscyBmb3VuZFxyXG4gICAgICBwcmVzc1RyYWlsID0gdGhpcy5fdGFyZ2V0Tm9kZS5nZXRVbmlxdWVUcmFpbFRvKCBldmVudC50YXJnZXQgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBwcmVzc1RyYWlsID0gZXZlbnQudHJhaWwuc3VidHJhaWxUbyggdGhpcy5fdGFyZ2V0Tm9kZSwgZmFsc2UgKTtcclxuICAgIH1cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIF8uaW5jbHVkZXMoIHByZXNzVHJhaWwubm9kZXMsIHRoaXMuX3RhcmdldE5vZGUgKSwgJ3RhcmdldE5vZGUgbXVzdCBiZSBpbiB0aGUgVHJhaWwgZm9yIFByZXNzJyApO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG4gICAgY29uc3QgcHJlc3MgPSBuZXcgTXVsdGlMaXN0ZW5lclByZXNzKCBldmVudC5wb2ludGVyLCBwcmVzc1RyYWlsICk7XHJcblxyXG4gICAgaWYgKCAhdGhpcy5fYWxsb3dNb3ZlSW50ZXJydXB0aW9uICYmICF0aGlzLl9hbGxvd011bHRpdG91Y2hJbnRlcnJ1cHRpb24gKSB7XHJcblxyXG4gICAgICAvLyBtb3N0IHJlc3RyaWN0aXZlIGNhc2UsIG9ubHkgYWxsb3cgcHJlc3NlcyBpZiB0aGUgcG9pbnRlciBpcyBub3QgYXR0YWNoZWQgLSBQcmVzc2VzXHJcbiAgICAgIC8vIGFyZSBuZXZlciBhZGRlZCBhcyBiYWNrZ3JvdW5kIHByZXNzZXMgaW4gdGhpcyBjYXNlIGJlY2F1c2UgaW50ZXJydXB0aW9uIGlzIG5ldmVyIGFsbG93ZWRcclxuICAgICAgaWYgKCAhZXZlbnQucG9pbnRlci5pc0F0dGFjaGVkKCkgKSB7XHJcbiAgICAgICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyKCAnTXVsdGlMaXN0ZW5lciB1bmF0dGFjaGVkLCB1c2luZyBwcmVzcycgKTtcclxuICAgICAgICB0aGlzLmFkZFByZXNzKCBwcmVzcyApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuXHJcbiAgICAgIC8vIHdlIGFsbG93IHNvbWUgZm9ybSBvZiBpbnRlcnJ1cHRpb24sIGFkZCBhcyBiYWNrZ3JvdW5kIHByZXNzZXMsIGFuZCB3ZSB3aWxsIGRlY2lkZSBpZiB0aGV5XHJcbiAgICAgIC8vIHNob3VsZCBiZSBjb252ZXJ0ZWQgdG8gcHJlc3NlcyBhbmQgaW50ZXJydXB0IG90aGVyIGxpc3RlbmVycyBvbiBtb3ZlIGV2ZW50XHJcbiAgICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciggJ011bHRpTGlzdGVuZXIgYXR0YWNoZWQsIGFkZGluZyBiYWNrZ3JvdW5kIHByZXNzJyApO1xyXG4gICAgICB0aGlzLmFkZEJhY2tncm91bmRQcmVzcyggcHJlc3MgKTtcclxuICAgIH1cclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkIGEgUHJlc3MgdG8gdGhpcyBsaXN0ZW5lciB3aGVuIGEgbmV3IFBvaW50ZXIgaXMgZG93bi5cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgYWRkUHJlc3MoIHByZXNzOiBNdWx0aUxpc3RlbmVyUHJlc3MgKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIoICdNdWx0aUxpc3RlbmVyIGFkZFByZXNzJyApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgaWYgKCAhdGhpcy5oYXNQcmVzcyggcHJlc3MgKSApIHtcclxuICAgICAgdGhpcy5fcHJlc3Nlcy5wdXNoKCBwcmVzcyApO1xyXG5cclxuICAgICAgcHJlc3MucG9pbnRlci5jdXJzb3IgPSB0aGlzLl9wcmVzc0N1cnNvcjtcclxuICAgICAgcHJlc3MucG9pbnRlci5hZGRJbnB1dExpc3RlbmVyKCB0aGlzLl9wcmVzc0xpc3RlbmVyLCB0cnVlICk7XHJcblxyXG4gICAgICB0aGlzLnJlY29tcHV0ZUxvY2FscygpO1xyXG4gICAgICB0aGlzLnJlcG9zaXRpb24oKTtcclxuICAgIH1cclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVwb3NpdGlvbiBpbiByZXNwb25zZSB0byBtb3ZlbWVudCBvZiBhbnkgUHJlc3Nlcy5cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgbW92ZVByZXNzKCBwcmVzczogTXVsdGlMaXN0ZW5lclByZXNzICk6IHZvaWQge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyKCAnTXVsdGlMaXN0ZW5lciBtb3ZlUHJlc3MnICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICB0aGlzLnJlcG9zaXRpb24oKTtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlIGEgUHJlc3MgZnJvbSB0aGlzIGxpc3RlbmVyLlxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCByZW1vdmVQcmVzcyggcHJlc3M6IE11bHRpTGlzdGVuZXJQcmVzcyApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciggJ011bHRpTGlzdGVuZXIgcmVtb3ZlUHJlc3MnICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICBwcmVzcy5wb2ludGVyLnJlbW92ZUlucHV0TGlzdGVuZXIoIHRoaXMuX3ByZXNzTGlzdGVuZXIgKTtcclxuICAgIHByZXNzLnBvaW50ZXIuY3Vyc29yID0gbnVsbDtcclxuXHJcbiAgICBhcnJheVJlbW92ZSggdGhpcy5fcHJlc3NlcywgcHJlc3MgKTtcclxuXHJcbiAgICB0aGlzLnJlY29tcHV0ZUxvY2FscygpO1xyXG4gICAgdGhpcy5yZXBvc2l0aW9uKCk7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZCBhIGJhY2tncm91bmQgUHJlc3MsIGEgUHJlc3MgdGhhdCB3ZSByZWNlaXZlIHdoaWxlIGEgUG9pbnRlciBpcyBhbHJlYWR5IGF0dGFjaGVkLiBEZXBlbmRpbmcgb24gYmFja2dyb3VuZFxyXG4gICAqIFByZXNzZXMsIHdlIG1heSBpbnRlcnJ1cHQgdGhlIGF0dGFjaGVkIHBvaW50ZXIgdG8gYmVnaW4gem9vbSBvcGVyYXRpb25zLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgYWRkQmFja2dyb3VuZFByZXNzKCBwcmVzczogTXVsdGlMaXN0ZW5lclByZXNzICk6IHZvaWQge1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyKCAnTXVsdGlMaXN0ZW5lciBhZGRCYWNrZ3JvdW5kUHJlc3MnICk7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICAvLyBJdCdzIHBvc3NpYmxlIHRoYXQgdGhlIHByZXNzIHBvaW50ZXIgYWxyZWFkeSBoYXMgdGhlIGxpc3RlbmVyIC0gZm9yIGluc3RhbmNlIGluIENocm9tZSB3ZSBmYWlsIHRvIGdldFxyXG4gICAgLy8gXCJ1cFwiIGV2ZW50cyBvbmNlIHRoZSBjb250ZXh0IG1lbnUgaXMgb3BlbiAobGlrZSBhZnRlciBhIHJpZ2h0IGNsaWNrKSwgc28gb25seSBhZGQgdG8gdGhlIFBvaW50ZXJcclxuICAgIC8vIGlmIGl0IGlzbid0IGFscmVhZHkgYWRkZWRcclxuICAgIGlmICggIXRoaXMuaGFzUHJlc3MoIHByZXNzICkgKSB7XHJcbiAgICAgIHRoaXMuX2JhY2tncm91bmRQcmVzc2VzLnB1c2goIHByZXNzICk7XHJcbiAgICAgIHByZXNzLnBvaW50ZXIuYWRkSW5wdXRMaXN0ZW5lciggdGhpcy5fYmFja2dyb3VuZExpc3RlbmVyLCBmYWxzZSApO1xyXG4gICAgfVxyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmUgYSBiYWNrZ3JvdW5kIFByZXNzIGZyb20gdGhpcyBsaXN0ZW5lci5cclxuICAgKi9cclxuICBwcml2YXRlIHJlbW92ZUJhY2tncm91bmRQcmVzcyggcHJlc3M6IE11bHRpTGlzdGVuZXJQcmVzcyApOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciggJ011bHRpTGlzdGVuZXIgcmVtb3ZlQmFja2dyb3VuZFByZXNzJyApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wdXNoKCk7XHJcblxyXG4gICAgcHJlc3MucG9pbnRlci5yZW1vdmVJbnB1dExpc3RlbmVyKCB0aGlzLl9iYWNrZ3JvdW5kTGlzdGVuZXIgKTtcclxuXHJcbiAgICBhcnJheVJlbW92ZSggdGhpcy5fYmFja2dyb3VuZFByZXNzZXMsIHByZXNzICk7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlcG9zaXRpb24gdGhlIHRhcmdldCBOb2RlIChpbmNsdWRpbmcgYWxsIGFwc2VjdHMgb2YgdHJhbnNmb3JtYXRpb24pIG9mIHRoaXMgbGlzdGVuZXIncyB0YXJnZXQgTm9kZS5cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgcmVwb3NpdGlvbigpOiB2b2lkIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciggJ011bHRpTGlzdGVuZXIgcmVwb3NpdGlvbicgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIHRoaXMubWF0cml4UHJvcGVydHkuc2V0KCB0aGlzLmNvbXB1dGVNYXRyaXgoKSApO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWNvbXB1dGUgdGhlIGxvY2FsIHBvaW50cyBvZiB0aGUgUHJlc3NlcyBmb3IgdGhpcyBsaXN0ZW5lciwgcmVsYXRpdmUgdG8gdGhlIHRhcmdldCBOb2RlLlxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCByZWNvbXB1dGVMb2NhbHMoKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIoICdNdWx0aUxpc3RlbmVyIHJlY29tcHV0ZUxvY2FscycgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuX3ByZXNzZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIHRoaXMuX3ByZXNzZXNbIGkgXS5yZWNvbXB1dGVMb2NhbFBvaW50KCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIgJiYgc2NlbmVyeUxvZy5wb3AoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEludGVycnVwdCB0aGlzIGxpc3RlbmVyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbnRlcnJ1cHQoKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuSW5wdXRMaXN0ZW5lciAmJiBzY2VuZXJ5TG9nLklucHV0TGlzdGVuZXIoICdNdWx0aUxpc3RlbmVyIGludGVycnVwdCcgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIHdoaWxlICggdGhpcy5fcHJlc3Nlcy5sZW5ndGggKSB7XHJcbiAgICAgIHRoaXMucmVtb3ZlUHJlc3MoIHRoaXMuX3ByZXNzZXNbIHRoaXMuX3ByZXNzZXMubGVuZ3RoIC0gMSBdICk7XHJcbiAgICB9XHJcblxyXG4gICAgd2hpbGUgKCB0aGlzLl9iYWNrZ3JvdW5kUHJlc3Nlcy5sZW5ndGggKSB7XHJcbiAgICAgIHRoaXMucmVtb3ZlQmFja2dyb3VuZFByZXNzKCB0aGlzLl9iYWNrZ3JvdW5kUHJlc3Nlc1sgdGhpcy5fYmFja2dyb3VuZFByZXNzZXMubGVuZ3RoIC0gMSBdICk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5faW50ZXJydXB0ZWQgPSB0cnVlO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5JbnB1dExpc3RlbmVyICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb21wdXRlIHRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggZm9yIHRoZSB0YXJnZXQgTm9kZSBiYXNlZCBvbiBQcmVzc2VzLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgY29tcHV0ZU1hdHJpeCgpOiBNYXRyaXgzIHtcclxuICAgIGlmICggdGhpcy5fcHJlc3Nlcy5sZW5ndGggPT09IDAgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl90YXJnZXROb2RlLmdldE1hdHJpeCgpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHRoaXMuX3ByZXNzZXMubGVuZ3RoID09PSAxICkge1xyXG4gICAgICByZXR1cm4gdGhpcy5jb21wdXRlU2luZ2xlUHJlc3NNYXRyaXgoKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0aGlzLl9hbGxvd1NjYWxlICYmIHRoaXMuX2FsbG93Um90YXRpb24gKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVUcmFuc2xhdGlvblJvdGF0aW9uU2NhbGVNYXRyaXgoKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0aGlzLl9hbGxvd1NjYWxlICkge1xyXG4gICAgICByZXR1cm4gdGhpcy5jb21wdXRlVHJhbnNsYXRpb25TY2FsZU1hdHJpeCgpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHRoaXMuX2FsbG93Um90YXRpb24gKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVUcmFuc2xhdGlvblJvdGF0aW9uTWF0cml4KCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIHRoaXMuY29tcHV0ZVRyYW5zbGF0aW9uTWF0cml4KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb21wdXRlIGEgdHJhbnNmb3JtYXRpb24gbWF0cml4IGZyb20gYSBzaW5nbGUgcHJlc3MuIFNpbmdsZSBwcmVzcyBpbmRpY2F0ZXMgdHJhbnNsYXRpb24gKHBhbm5pbmcpIGZvciB0aGVcclxuICAgKiB0YXJnZXQgTm9kZS5cclxuICAgKi9cclxuICBwcml2YXRlIGNvbXB1dGVTaW5nbGVQcmVzc01hdHJpeCgpOiBNYXRyaXgzIHtcclxuICAgIGNvbnN0IHNpbmdsZVRhcmdldFBvaW50ID0gdGhpcy5fcHJlc3Nlc1sgMCBdLnRhcmdldFBvaW50O1xyXG4gICAgY29uc3QgbG9jYWxQb2ludCA9IHRoaXMuX3ByZXNzZXNbIDAgXS5sb2NhbFBvaW50ITtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGxvY2FsUG9pbnQsICdsb2NhbFBvaW50IGlzIG5vdCBkZWZpbmVkIG9uIHRoZSBQcmVzcz8nICk7XHJcblxyXG4gICAgY29uc3Qgc2luZ2xlTWFwcGVkUG9pbnQgPSB0aGlzLl90YXJnZXROb2RlLmxvY2FsVG9QYXJlbnRQb2ludCggbG9jYWxQb2ludCApO1xyXG4gICAgY29uc3QgZGVsdGEgPSBzaW5nbGVUYXJnZXRQb2ludC5taW51cyggc2luZ2xlTWFwcGVkUG9pbnQgKTtcclxuICAgIHJldHVybiBNYXRyaXgzLnRyYW5zbGF0aW9uRnJvbVZlY3RvciggZGVsdGEgKS50aW1lc01hdHJpeCggdGhpcy5fdGFyZ2V0Tm9kZS5nZXRNYXRyaXgoKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcHV0ZSBhIHRyYW5zbGF0aW9uIG1hdHJpeCBmcm9tIG11bHRpcGxlIHByZXNzZXMuIFVzdWFsbHkgbXVsdGlwbGUgcHJlc3NlcyB3aWxsIGhhdmUgc29tZSBzY2FsZSBvciByb3RhdGlvblxyXG4gICAqIGFzIHdlbGwsIGJ1dCB0aGlzIGlzIHRvIGJlIHVzZWQgaWYgcm90YXRpb24gYW5kIHNjYWxlIGFyZSBub3QgZW5hYmxlZCBmb3IgdGhpcyBsaXN0ZW5lci5cclxuICAgKi9cclxuICBwdWJsaWMgY29tcHV0ZVRyYW5zbGF0aW9uTWF0cml4KCk6IE1hdHJpeDMge1xyXG4gICAgLy8gdHJhbnNsYXRpb24gb25seS4gbGluZWFyIGxlYXN0LXNxdWFyZXMgc2ltcGxpZmllcyB0byBzdW0gb2YgZGlmZmVyZW5jZXNcclxuICAgIGNvbnN0IHN1bSA9IG5ldyBWZWN0b3IyKCAwLCAwICk7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLl9wcmVzc2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBzdW0uYWRkKCB0aGlzLl9wcmVzc2VzWyBpIF0udGFyZ2V0UG9pbnQgKTtcclxuXHJcbiAgICAgIGNvbnN0IGxvY2FsUG9pbnQgPSB0aGlzLl9wcmVzc2VzWyBpIF0ubG9jYWxQb2ludCE7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGxvY2FsUG9pbnQsICdsb2NhbFBvaW50IGlzIG5vdCBkZWZpbmVkIG9uIHRoZSBQcmVzcz8nICk7XHJcbiAgICAgIHN1bS5zdWJ0cmFjdCggbG9jYWxQb2ludCApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIE1hdHJpeDMudHJhbnNsYXRpb25Gcm9tVmVjdG9yKCBzdW0uZGl2aWRlZFNjYWxhciggdGhpcy5fcHJlc3Nlcy5sZW5ndGggKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggZnJvbSBtdWx0aXBsZSBQcmVzc2VzIHRoYXQgd2lsbCB0cmFuc2xhdGUgYW5kIHNjYWxlIHRoZSB0YXJnZXQgTm9kZS5cclxuICAgKi9cclxuICBwcml2YXRlIGNvbXB1dGVUcmFuc2xhdGlvblNjYWxlTWF0cml4KCk6IE1hdHJpeDMge1xyXG4gICAgY29uc3QgbG9jYWxQb2ludHMgPSB0aGlzLl9wcmVzc2VzLm1hcCggcHJlc3MgPT4ge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBwcmVzcy5sb2NhbFBvaW50LCAnbG9jYWxQb2ludCBpcyBub3QgZGVmaW5lZCBvbiB0aGUgUHJlc3M/JyApO1xyXG4gICAgICByZXR1cm4gcHJlc3MubG9jYWxQb2ludCE7XHJcbiAgICB9ICk7XHJcbiAgICBjb25zdCB0YXJnZXRQb2ludHMgPSB0aGlzLl9wcmVzc2VzLm1hcCggcHJlc3MgPT4gcHJlc3MudGFyZ2V0UG9pbnQgKTtcclxuXHJcbiAgICBjb25zdCBsb2NhbENlbnRyb2lkID0gbmV3IFZlY3RvcjIoIDAsIDAgKTtcclxuICAgIGNvbnN0IHRhcmdldENlbnRyb2lkID0gbmV3IFZlY3RvcjIoIDAsIDAgKTtcclxuXHJcbiAgICBsb2NhbFBvaW50cy5mb3JFYWNoKCBsb2NhbFBvaW50ID0+IHsgbG9jYWxDZW50cm9pZC5hZGQoIGxvY2FsUG9pbnQgKTsgfSApO1xyXG4gICAgdGFyZ2V0UG9pbnRzLmZvckVhY2goIHRhcmdldFBvaW50ID0+IHsgdGFyZ2V0Q2VudHJvaWQuYWRkKCB0YXJnZXRQb2ludCApOyB9ICk7XHJcblxyXG4gICAgbG9jYWxDZW50cm9pZC5kaXZpZGVTY2FsYXIoIHRoaXMuX3ByZXNzZXMubGVuZ3RoICk7XHJcbiAgICB0YXJnZXRDZW50cm9pZC5kaXZpZGVTY2FsYXIoIHRoaXMuX3ByZXNzZXMubGVuZ3RoICk7XHJcblxyXG4gICAgbGV0IGxvY2FsU3F1YXJlZERpc3RhbmNlID0gMDtcclxuICAgIGxldCB0YXJnZXRTcXVhcmVkRGlzdGFuY2UgPSAwO1xyXG5cclxuICAgIGxvY2FsUG9pbnRzLmZvckVhY2goIGxvY2FsUG9pbnQgPT4geyBsb2NhbFNxdWFyZWREaXN0YW5jZSArPSBsb2NhbFBvaW50LmRpc3RhbmNlU3F1YXJlZCggbG9jYWxDZW50cm9pZCApOyB9ICk7XHJcbiAgICB0YXJnZXRQb2ludHMuZm9yRWFjaCggdGFyZ2V0UG9pbnQgPT4geyB0YXJnZXRTcXVhcmVkRGlzdGFuY2UgKz0gdGFyZ2V0UG9pbnQuZGlzdGFuY2VTcXVhcmVkKCB0YXJnZXRDZW50cm9pZCApOyB9ICk7XHJcblxyXG4gICAgLy8gd2hpbGUgZnV6eiB0ZXN0aW5nLCBpdCBpcyBwb3NzaWJsZSB0aGF0IHRoZSBQcmVzcyBwb2ludHMgYXJlXHJcbiAgICAvLyBleGFjdGx5IHRoZSBzYW1lIHJlc3VsdGluZyBpbiB1bmRlZmluZWQgc2NhbGUgLSBpZiB0aGF0IGlzIHRoZSBjYXNlXHJcbiAgICAvLyB3ZSB3aWxsIG5vdCBhZGp1c3RcclxuICAgIGxldCBzY2FsZSA9IHRoaXMuZ2V0Q3VycmVudFNjYWxlKCk7XHJcbiAgICBpZiAoIHRhcmdldFNxdWFyZWREaXN0YW5jZSAhPT0gMCApIHtcclxuICAgICAgc2NhbGUgPSB0aGlzLmxpbWl0U2NhbGUoIE1hdGguc3FydCggdGFyZ2V0U3F1YXJlZERpc3RhbmNlIC8gbG9jYWxTcXVhcmVkRGlzdGFuY2UgKSApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRyYW5zbGF0ZVRvVGFyZ2V0ID0gTWF0cml4My50cmFuc2xhdGlvbiggdGFyZ2V0Q2VudHJvaWQueCwgdGFyZ2V0Q2VudHJvaWQueSApO1xyXG4gICAgY29uc3QgdHJhbnNsYXRlRnJvbUxvY2FsID0gTWF0cml4My50cmFuc2xhdGlvbiggLWxvY2FsQ2VudHJvaWQueCwgLWxvY2FsQ2VudHJvaWQueSApO1xyXG5cclxuICAgIHJldHVybiB0cmFuc2xhdGVUb1RhcmdldC50aW1lc01hdHJpeCggTWF0cml4My5zY2FsaW5nKCBzY2FsZSApICkudGltZXNNYXRyaXgoIHRyYW5zbGF0ZUZyb21Mb2NhbCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTGltaXQgdGhlIHByb3ZpZGVkIHNjYWxlIGJ5IGNvbnN0cmFpbnRzIG9mIHRoaXMgTXVsdGlMaXN0ZW5lci5cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgbGltaXRTY2FsZSggc2NhbGU6IG51bWJlciApOiBudW1iZXIge1xyXG4gICAgbGV0IGNvcnJlY3RlZFNjYWxlID0gTWF0aC5tYXgoIHNjYWxlLCB0aGlzLl9taW5TY2FsZSApO1xyXG4gICAgY29ycmVjdGVkU2NhbGUgPSBNYXRoLm1pbiggY29ycmVjdGVkU2NhbGUsIHRoaXMuX21heFNjYWxlICk7XHJcbiAgICByZXR1cm4gY29ycmVjdGVkU2NhbGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb21wdXRlIGEgdHJhbnNmb3JtYXRpb24gbWF0cml4IHRoYXQgd2lsbCB0cmFuc2xhdGUgYW5kIHNjYWxlIHRoZSB0YXJnZXQgTm9kZSBmcm9tIG11bHRpcGxlIHByZXNzZXMuIFNob3VsZFxyXG4gICAqIGJlIHVzZWQgd2hlbiBzY2FsaW5nIGlzIG5vdCBlbmFibGVkIGZvciB0aGlzIGxpc3RlbmVyLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgY29tcHV0ZVRyYW5zbGF0aW9uUm90YXRpb25NYXRyaXgoKTogTWF0cml4MyB7XHJcbiAgICBsZXQgaTtcclxuICAgIGNvbnN0IGxvY2FsTWF0cml4ID0gbmV3IE1hdHJpeCggMiwgdGhpcy5fcHJlc3Nlcy5sZW5ndGggKTtcclxuICAgIGNvbnN0IHRhcmdldE1hdHJpeCA9IG5ldyBNYXRyaXgoIDIsIHRoaXMuX3ByZXNzZXMubGVuZ3RoICk7XHJcbiAgICBjb25zdCBsb2NhbENlbnRyb2lkID0gbmV3IFZlY3RvcjIoIDAsIDAgKTtcclxuICAgIGNvbnN0IHRhcmdldENlbnRyb2lkID0gbmV3IFZlY3RvcjIoIDAsIDAgKTtcclxuICAgIGZvciAoIGkgPSAwOyBpIDwgdGhpcy5fcHJlc3Nlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgbG9jYWxQb2ludCA9IHRoaXMuX3ByZXNzZXNbIGkgXS5sb2NhbFBvaW50ITtcclxuICAgICAgY29uc3QgdGFyZ2V0UG9pbnQgPSB0aGlzLl9wcmVzc2VzWyBpIF0udGFyZ2V0UG9pbnQ7XHJcbiAgICAgIGxvY2FsQ2VudHJvaWQuYWRkKCBsb2NhbFBvaW50ICk7XHJcbiAgICAgIHRhcmdldENlbnRyb2lkLmFkZCggdGFyZ2V0UG9pbnQgKTtcclxuICAgICAgbG9jYWxNYXRyaXguc2V0KCAwLCBpLCBsb2NhbFBvaW50LnggKTtcclxuICAgICAgbG9jYWxNYXRyaXguc2V0KCAxLCBpLCBsb2NhbFBvaW50LnkgKTtcclxuICAgICAgdGFyZ2V0TWF0cml4LnNldCggMCwgaSwgdGFyZ2V0UG9pbnQueCApO1xyXG4gICAgICB0YXJnZXRNYXRyaXguc2V0KCAxLCBpLCB0YXJnZXRQb2ludC55ICk7XHJcbiAgICB9XHJcbiAgICBsb2NhbENlbnRyb2lkLmRpdmlkZVNjYWxhciggdGhpcy5fcHJlc3Nlcy5sZW5ndGggKTtcclxuICAgIHRhcmdldENlbnRyb2lkLmRpdmlkZVNjYWxhciggdGhpcy5fcHJlc3Nlcy5sZW5ndGggKTtcclxuXHJcbiAgICAvLyBkZXRlcm1pbmUgb2Zmc2V0cyBmcm9tIHRoZSBjZW50cm9pZHNcclxuICAgIGZvciAoIGkgPSAwOyBpIDwgdGhpcy5fcHJlc3Nlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgbG9jYWxNYXRyaXguc2V0KCAwLCBpLCBsb2NhbE1hdHJpeC5nZXQoIDAsIGkgKSAtIGxvY2FsQ2VudHJvaWQueCApO1xyXG4gICAgICBsb2NhbE1hdHJpeC5zZXQoIDEsIGksIGxvY2FsTWF0cml4LmdldCggMSwgaSApIC0gbG9jYWxDZW50cm9pZC55ICk7XHJcbiAgICAgIHRhcmdldE1hdHJpeC5zZXQoIDAsIGksIHRhcmdldE1hdHJpeC5nZXQoIDAsIGkgKSAtIHRhcmdldENlbnRyb2lkLnggKTtcclxuICAgICAgdGFyZ2V0TWF0cml4LnNldCggMSwgaSwgdGFyZ2V0TWF0cml4LmdldCggMSwgaSApIC0gdGFyZ2V0Q2VudHJvaWQueSApO1xyXG4gICAgfVxyXG4gICAgY29uc3QgY292YXJpYW5jZU1hdHJpeCA9IGxvY2FsTWF0cml4LnRpbWVzKCB0YXJnZXRNYXRyaXgudHJhbnNwb3NlKCkgKTtcclxuICAgIGNvbnN0IHN2ZCA9IG5ldyBTaW5ndWxhclZhbHVlRGVjb21wb3NpdGlvbiggY292YXJpYW5jZU1hdHJpeCApO1xyXG4gICAgbGV0IHJvdGF0aW9uID0gc3ZkLmdldFYoKS50aW1lcyggc3ZkLmdldFUoKS50cmFuc3Bvc2UoKSApO1xyXG4gICAgaWYgKCByb3RhdGlvbi5kZXQoKSA8IDAgKSB7XHJcbiAgICAgIHJvdGF0aW9uID0gc3ZkLmdldFYoKS50aW1lcyggTWF0cml4LmRpYWdvbmFsTWF0cml4KCBbIDEsIC0xIF0gKSApLnRpbWVzKCBzdmQuZ2V0VSgpLnRyYW5zcG9zZSgpICk7XHJcbiAgICB9XHJcbiAgICBjb25zdCByb3RhdGlvbjMgPSBuZXcgTWF0cml4MygpLnJvd01ham9yKCByb3RhdGlvbi5nZXQoIDAsIDAgKSwgcm90YXRpb24uZ2V0KCAwLCAxICksIDAsXHJcbiAgICAgIHJvdGF0aW9uLmdldCggMSwgMCApLCByb3RhdGlvbi5nZXQoIDEsIDEgKSwgMCxcclxuICAgICAgMCwgMCwgMSApO1xyXG4gICAgY29uc3QgdHJhbnNsYXRpb24gPSB0YXJnZXRDZW50cm9pZC5taW51cyggcm90YXRpb24zLnRpbWVzVmVjdG9yMiggbG9jYWxDZW50cm9pZCApICk7XHJcbiAgICByb3RhdGlvbjMuc2V0MDIoIHRyYW5zbGF0aW9uLnggKTtcclxuICAgIHJvdGF0aW9uMy5zZXQxMiggdHJhbnNsYXRpb24ueSApO1xyXG4gICAgcmV0dXJuIHJvdGF0aW9uMztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXB1dGUgYSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggdGhhdCB3aWxsIHRyYW5zbGF0ZSwgc2NhbGUsIGFuZCByb3RhdGUgdGhlIHRhcmdldCBOb2RlIGZyb20gbXVsdGlwbGUgUHJlc3Nlcy5cclxuICAgKi9cclxuICBwcml2YXRlIGNvbXB1dGVUcmFuc2xhdGlvblJvdGF0aW9uU2NhbGVNYXRyaXgoKTogTWF0cml4MyB7XHJcbiAgICBsZXQgaTtcclxuICAgIGNvbnN0IGxvY2FsTWF0cml4ID0gbmV3IE1hdHJpeCggdGhpcy5fcHJlc3Nlcy5sZW5ndGggKiAyLCA0ICk7XHJcbiAgICBmb3IgKCBpID0gMDsgaSA8IHRoaXMuX3ByZXNzZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIC8vIFsgeCAgeSAxIDAgXVxyXG4gICAgICAvLyBbIHkgLXggMCAxIF1cclxuICAgICAgY29uc3QgbG9jYWxQb2ludCA9IHRoaXMuX3ByZXNzZXNbIGkgXS5sb2NhbFBvaW50ITtcclxuICAgICAgbG9jYWxNYXRyaXguc2V0KCAyICogaSArIDAsIDAsIGxvY2FsUG9pbnQueCApO1xyXG4gICAgICBsb2NhbE1hdHJpeC5zZXQoIDIgKiBpICsgMCwgMSwgbG9jYWxQb2ludC55ICk7XHJcbiAgICAgIGxvY2FsTWF0cml4LnNldCggMiAqIGkgKyAwLCAyLCAxICk7XHJcbiAgICAgIGxvY2FsTWF0cml4LnNldCggMiAqIGkgKyAxLCAwLCBsb2NhbFBvaW50LnkgKTtcclxuICAgICAgbG9jYWxNYXRyaXguc2V0KCAyICogaSArIDEsIDEsIC1sb2NhbFBvaW50LnggKTtcclxuICAgICAgbG9jYWxNYXRyaXguc2V0KCAyICogaSArIDEsIDMsIDEgKTtcclxuICAgIH1cclxuICAgIGNvbnN0IHRhcmdldE1hdHJpeCA9IG5ldyBNYXRyaXgoIHRoaXMuX3ByZXNzZXMubGVuZ3RoICogMiwgMSApO1xyXG4gICAgZm9yICggaSA9IDA7IGkgPCB0aGlzLl9wcmVzc2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCB0YXJnZXRQb2ludCA9IHRoaXMuX3ByZXNzZXNbIGkgXS50YXJnZXRQb2ludDtcclxuICAgICAgdGFyZ2V0TWF0cml4LnNldCggMiAqIGkgKyAwLCAwLCB0YXJnZXRQb2ludC54ICk7XHJcbiAgICAgIHRhcmdldE1hdHJpeC5zZXQoIDIgKiBpICsgMSwgMCwgdGFyZ2V0UG9pbnQueSApO1xyXG4gICAgfVxyXG4gICAgY29uc3QgY29lZmZpY2llbnRNYXRyaXggPSBTaW5ndWxhclZhbHVlRGVjb21wb3NpdGlvbi5wc2V1ZG9pbnZlcnNlKCBsb2NhbE1hdHJpeCApLnRpbWVzKCB0YXJnZXRNYXRyaXggKTtcclxuICAgIGNvbnN0IG0xMSA9IGNvZWZmaWNpZW50TWF0cml4LmdldCggMCwgMCApO1xyXG4gICAgY29uc3QgbTEyID0gY29lZmZpY2llbnRNYXRyaXguZ2V0KCAxLCAwICk7XHJcbiAgICBjb25zdCBtMTMgPSBjb2VmZmljaWVudE1hdHJpeC5nZXQoIDIsIDAgKTtcclxuICAgIGNvbnN0IG0yMyA9IGNvZWZmaWNpZW50TWF0cml4LmdldCggMywgMCApO1xyXG4gICAgcmV0dXJuIG5ldyBNYXRyaXgzKCkucm93TWFqb3IoIG0xMSwgbTEyLCBtMTMsXHJcbiAgICAgIC1tMTIsIG0xMSwgbTIzLFxyXG4gICAgICAwLCAwLCAxICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIGN1cnJlbnQgc2NhbGUgb24gdGhlIHRhcmdldCBOb2RlLCBhc3N1bWVzIHRoYXQgdGhlcmUgaXMgaXNvbWV0cmljIHNjYWxpbmcgaW4gYm90aCB4IGFuZCB5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRDdXJyZW50U2NhbGUoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl90YXJnZXROb2RlLmdldFNjYWxlVmVjdG9yKCkueDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc2V0IHRyYW5zZm9ybSBvbiB0aGUgdGFyZ2V0IE5vZGUuXHJcbiAgICovXHJcbiAgcHVibGljIHJlc2V0VHJhbnNmb3JtKCk6IHZvaWQge1xyXG4gICAgdGhpcy5fdGFyZ2V0Tm9kZS5yZXNldFRyYW5zZm9ybSgpO1xyXG4gICAgdGhpcy5tYXRyaXhQcm9wZXJ0eS5zZXQoIHRoaXMuX3RhcmdldE5vZGUubWF0cml4LmNvcHkoKSApO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ011bHRpTGlzdGVuZXInLCBNdWx0aUxpc3RlbmVyICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBNdWx0aUxpc3RlbmVyOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxRQUFRLE1B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