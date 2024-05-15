// Copyright 2019-2023, University of Colorado Boulder

/**
 * Vector is the model for a vector that can be directly manipulated.  It can be translated and (optionally)
 * scaled and rotated.
 *
 * Extends RootVector but adds the following functionality (annotated in the file):
 *  1. update the tail when the origin moves (modelViewTransformProperty)
 *  2. instantiate x and y component vectors
 *  3. ability to correctly drag the vector by the tail and the tip in both polar and Cartesian mode
 *  4. methods to drop a vector, to animate a vector, and to pop a vector off the graph
 *
 * @author Brandon Li
 * @author Martin Veillette
 * @author Chris Malley (PixelZoom, Inc.)
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import Utils from '../../../../dot/js/Utils.js';
import Animation from '../../../../twixt/js/Animation.js';
import Easing from '../../../../twixt/js/Easing.js';
import vectorAddition from '../../vectorAddition.js';
import VectorAdditionConstants from '../VectorAdditionConstants.js';
import VectorAdditionQueryParameters from '../VectorAdditionQueryParameters.js';
import ComponentVector from './ComponentVector.js';
import ComponentVectorTypes from './ComponentVectorTypes.js';
import CoordinateSnapModes from './CoordinateSnapModes.js';
import GraphOrientations from './GraphOrientations.js';
import RootVector from './RootVector.js';
import optionize from '../../../../phet-core/js/optionize.js';
//----------------------------------------------------------------------------------------
// constants
const AVERAGE_ANIMATION_SPEED = 1600; // in model coordinates
const MIN_ANIMATION_TIME = 0.9; // in seconds

// interval spacing of vector angle (in degrees) when vector is in polar mode
const POLAR_ANGLE_INTERVAL = VectorAdditionConstants.POLAR_ANGLE_INTERVAL;

// fall back symbol for the vector model if a symbol isn't provided. The reason this isn't translatable is:
// https://github.com/phetsims/vector-addition/issues/10.
const VECTOR_FALL_BACK_SYMBOL = 'v';

// maximum amount of dragging before the vector will be removed from the graph when attempting to drag a vector.
// See https://github.com/phetsims/vector-addition/issues/46 for more context.
const VECTOR_DRAG_THRESHOLD = VectorAdditionQueryParameters.vectorDragThreshold;

// distance between a vector's tail or tip to another vector/s tail or tip to snap to the other vectors in polar mode.
const POLAR_SNAP_DISTANCE = VectorAdditionQueryParameters.polarSnapDistance;
export default class Vector extends RootVector {
  // indicates if the tip can be dragged

  // indicates if the vector can be removed

  // fallBackSymbol - see declaration of VECTOR_FALL_BACK_SYMBOL for documentation

  // the graph that the vector model belongs to

  // the vector set that the vector belongs to

  // indicates whether the vector is on the graph

  // {Animation|null} reference to any animation that is currently in progress

  // indicates if the vector should be animated back to the toolbox

  // the vector's x and y component vectors

  /**
   * @param initialTailPosition - starting tail position of the vector
   * @param initialComponents - starting components of the vector
   * @param graph - the graph the vector belongs to
   * @param vectorSet - the vector set the vector belongs to
   * @param symbol - the symbol for the vector (i.e. 'a', 'b', 'c', ...)
   * @param [providedOptions] - not propagated to super!
   */
  constructor(initialTailPosition, initialComponents, graph, vectorSet, symbol, providedOptions) {
    const options = optionize()({
      // SelfOptions
      isTipDraggable: true,
      isRemovable: true,
      isOnGraphInitially: false
    }, providedOptions);
    super(initialTailPosition, initialComponents, vectorSet.vectorColorPalette, symbol);
    this.isTipDraggable = options.isTipDraggable;
    this.isRemovable = options.isRemovable;
    this.fallBackSymbol = VECTOR_FALL_BACK_SYMBOL;
    this.graph = graph;
    this.vectorSet = vectorSet;
    this.isOnGraphProperty = new BooleanProperty(options.isOnGraphInitially);
    this.inProgressAnimation = null;
    this.animateBackProperty = new BooleanProperty(false);
    this.xComponentVector = new ComponentVector(this, vectorSet.componentStyleProperty, graph.activeVectorProperty, ComponentVectorTypes.X_COMPONENT);
    this.yComponentVector = new ComponentVector(this, vectorSet.componentStyleProperty, graph.activeVectorProperty, ComponentVectorTypes.Y_COMPONENT);

    // When the graph's origin changes, update the tail position. unlink is required on dispose.
    const updateTailPosition = (newModelViewTransform, oldModelViewTransform) => {
      const tailPositionView = oldModelViewTransform.modelToViewPosition(this.tail);
      this.moveToTailPosition(newModelViewTransform.viewToModelPosition(tailPositionView));
    };
    this.graph.modelViewTransformProperty.lazyLink(updateTailPosition);
    this.disposeVector = () => {
      this.graph.modelViewTransformProperty.unlink(updateTailPosition);
      this.xComponentVector.dispose();
      this.yComponentVector.dispose();
      this.inProgressAnimation && this.inProgressAnimation.stop();
    };
  }
  dispose() {
    this.disposeVector();
  }

  /**
   * See RootVector.getLabelDisplayData for details.
   */
  getLabelDisplayData(valuesVisible) {
    // If the vector has a symbol or is active, the vector always displays a symbol.
    let symbol = null;
    if (this.symbol || this.graph.activeVectorProperty.value === this) {
      symbol = this.symbol || this.fallBackSymbol;
    }

    // If the values are on, the vector always displays a value.
    let magnitude = null;
    if (valuesVisible) {
      magnitude = this.magnitude;
    }
    return {
      coefficient: null,
      // vector models don't have coefficients
      symbol: symbol,
      magnitude: magnitude,
      includeAbsoluteValueBars: magnitude !== null && symbol !== null // absolute value bars if there is a magnitude
    };
  }

  /**
   * Sets the tip of the vector but ensures the vector satisfies invariants for polar/Cartesian mode.
   *
   * ## Common Invariants (for both Cartesian and polar mode):
   *  - Vector must not be set to the tail (0 magnitude)
   *
   * ## Invariants for Cartesian mode:
   *  - Vector tip must be on an exact model coordinate
   *
   * ## Invariants for polar mode:
   *  - Vector tip must be rounded to ensure the magnitude of the vector is a integer
   *  - Vector tip must be rounded to ensure the vector angle is a multiple of POLAR_ANGLE_INTERVAL
   */
  setTipWithInvariants(tipPosition) {
    assert && assert(!this.inProgressAnimation, 'this.inProgressAnimation must be false');

    // Flag to get the tip point that satisfies invariants (to be calculated below)
    let tipPositionWithInvariants;
    if (this.graph.coordinateSnapMode === CoordinateSnapModes.CARTESIAN) {
      // Ensure that the tipPosition is on the graph
      const tipPositionOnGraph = this.graph.graphModelBounds.closestPointTo(tipPosition);

      // Round the tip to integer grid values
      tipPositionWithInvariants = tipPositionOnGraph.roundedSymmetric();
    } else {
      // this.graph.coordinateSnapMode === CoordinateSnapModes.POLAR

      const vectorComponents = tipPosition.minus(this.tail);
      const roundedMagnitude = Utils.roundSymmetric(vectorComponents.magnitude);
      const angleInRadians = Utils.toRadians(POLAR_ANGLE_INTERVAL);
      const roundedAngle = angleInRadians * Utils.roundSymmetric(vectorComponents.angle / angleInRadians);

      // Calculate the rounded polar vector
      const polarVector = vectorComponents.setPolar(roundedMagnitude, roundedAngle);

      // Ensure that the new polar vector is in the bounds. Subtract one from the magnitude until the vector is inside
      while (!this.graph.graphModelBounds.containsPoint(this.tail.plus(polarVector))) {
        polarVector.setMagnitude(polarVector.magnitude - 1);
      }
      tipPositionWithInvariants = this.tail.plus(polarVector);
    }

    // Based on the vector orientation, constrain the dragging components
    if (this.graph.orientation === GraphOrientations.HORIZONTAL) {
      tipPositionWithInvariants.setY(this.tailY);
    } else if (this.graph.orientation === GraphOrientations.VERTICAL) {
      tipPositionWithInvariants.setX(this.tailX);
    }

    // Ensure vector tip must not be set to the tail (0 magnitude)
    if (!tipPositionWithInvariants.equals(this.tail)) {
      // Update the model tip
      this.tip = tipPositionWithInvariants;
    }
  }

  /**
   * Sets the tail of the vector but ensures the vector satisfies invariants for polar/Cartesian mode.
   *
   * ## Invariants for Cartesian mode:
   *  - Vector tail must be on an exact model coordinate
   *
   * ## Invariants for polar mode:
   *  - Vector's must snap to other vectors to allow tip to tail sum comparisons.
   *    See https://docs.google.com/document/d/1opnDgqIqIroo8VK0CbOyQ5608_g11MSGZXnFlI8k5Ds/edit?ts=5ced51e9#
   *  - Vector tail doesn't have to be on an exact model coordinate, but should when not snapping to other vectors
   */
  setTailWithInvariants(tailPosition) {
    assert && assert(!this.inProgressAnimation, 'this.inProgressAnimation must be false');
    const constrainedTailBounds = this.getConstrainedTailBounds();

    // Ensure the tail is set in a position so the tail and the tip are on the graph
    const tailPositionOnGraph = constrainedTailBounds.closestPointTo(tailPosition);
    if (this.graph.coordinateSnapMode === CoordinateSnapModes.POLAR) {
      // Get the tip of this vector
      const tipPositionOnGraph = tailPositionOnGraph.plus(this.vectorComponents);

      // Get all the vectors in the set, including the sum and excluding this vector
      const vectorsInVectorSet = this.vectorSet.vectors.filter(vector => {
        return vector !== this;
      });
      if (this.vectorSet.sumVector) {
        vectorsInVectorSet.push(this.vectorSet.sumVector);
      }

      //----------------------------------------------------------------------------------------
      // Vector's must snap to other vectors to allow tip to tail sum comparisons.
      for (let i = 0; i < vectorsInVectorSet.length; i++) {
        const vector = vectorsInVectorSet[i];

        // Snap tail to other vector's tails
        if (vector.tail.distance(tailPositionOnGraph) < POLAR_SNAP_DISTANCE) {
          this.moveToTailPosition(vector.tail);
          return;
        }

        // Snap tail to other vector's tip
        if (vector.tip.distance(tailPositionOnGraph) < POLAR_SNAP_DISTANCE) {
          this.moveToTailPosition(vector.tip);
          return;
        }

        // Snap tip to other vector's tail
        if (vector.tail.distance(tipPositionOnGraph) < POLAR_SNAP_DISTANCE) {
          this.moveToTailPosition(vector.tail.minus(this.vectorComponents));
          return;
        }
      }
    }
    this.moveToTailPosition(tailPositionOnGraph.roundedSymmetric());
  }

  /**
   * Moves the tip to this position but ensures it satisfies invariants for polar and Cartesian mode.
   */
  moveTipToPosition(tipPosition) {
    this.setTipWithInvariants(tipPosition);
  }

  /**
   * Moves the tail to this position but ensures it satisfies invariants for polar and Cartesian mode.
   */
  moveTailToPosition(tailPosition) {
    // Ensure that the tail satisfies invariants for polar/Cartesian mode
    this.setTailWithInvariants(tailPosition);

    // Add ability to remove vectors
    if (this.isRemovable) {
      const constrainedTailBounds = this.getConstrainedTailBounds();

      // Offset of the cursor to the vector. This allows users to remove vectors based on the displacement of the
      // cursor. See https://github.com/phetsims/vector-addition/issues/46#issuecomment-506726262
      const dragOffset = constrainedTailBounds.closestPointTo(tailPosition).minus(tailPosition);
      if (Math.abs(dragOffset.x) > VECTOR_DRAG_THRESHOLD || Math.abs(dragOffset.y) > VECTOR_DRAG_THRESHOLD) {
        this.popOffOfGraph();
      }
    }
  }

  /**
   * Gets the constrained bounds of the tail. The tail must be within VECTOR_TAIL_DRAG_MARGIN units of the edges
   * of the graph. See https://github.com/phetsims/vector-addition/issues/152
   */
  getConstrainedTailBounds() {
    return this.graph.graphModelBounds.eroded(VectorAdditionConstants.VECTOR_TAIL_DRAG_MARGIN);
  }

  /**
   * Animates the vector to a specific point. Called when the user fails to drop the vector in the graph.
   * @param point - animates the center of the vector to this point
   * @param finalComponents - animates the components to the final components
   * @param finishCallback - callback when the animation finishes naturally, not when stopped
   */
  animateToPoint(point, finalComponents, finishCallback) {
    assert && assert(!this.inProgressAnimation, 'Can\'t animate to position when we are in animation currently');
    assert && assert(!this.isOnGraphProperty.value, 'Can\'t animate when the vector is on the graph');

    // Calculate the tail position to animate to
    const tailPosition = point.minus(finalComponents.timesScalar(0.5));
    this.inProgressAnimation = new Animation({
      duration: _.max([MIN_ANIMATION_TIME, this.tail.distance(tailPosition) / AVERAGE_ANIMATION_SPEED]),
      targets: [{
        property: this.tailPositionProperty,
        easing: Easing.QUADRATIC_IN_OUT,
        to: tailPosition
      }, {
        property: this.vectorComponentsProperty,
        easing: Easing.QUADRATIC_IN_OUT,
        to: finalComponents
      }]
    }).start();

    // Called when the animation finishes naturally
    const finishListener = () => {
      this.inProgressAnimation.finishEmitter.removeListener(finishListener);
      this.inProgressAnimation = null;
      finishCallback();
    };
    this.inProgressAnimation.finishEmitter.addListener(finishListener);
  }

  /**
   * Drops the vector onto the graph.
   * @param tailPosition - the tail position to drop the vector onto
   */
  dropOntoGraph(tailPosition) {
    assert && assert(!this.isOnGraphProperty.value, 'vector is already on the graph');
    assert && assert(!this.inProgressAnimation, 'cannot drop vector when it\'s animating');
    this.isOnGraphProperty.value = true;

    // Ensure dropped tail position satisfies invariants
    this.setTailWithInvariants(tailPosition);

    // When the vector is first dropped, it is active
    this.graph.activeVectorProperty.value = this;
  }

  /**
   * Pops the vector off of the graph.
   */
  popOffOfGraph() {
    assert && assert(this.isOnGraphProperty.value, 'attempted pop off graph when vector was already off');
    assert && assert(!this.inProgressAnimation, 'cannot pop vector off when it\'s animating');
    this.isOnGraphProperty.value = false;
    this.graph.activeVectorProperty.value = null;
  }

  /**
   * Sets the offset from the x-axis and y-axis that is used for PROJECTION style for component vectors.
   * @param projectionXOffset - x offset, in model coordinates
   * @param projectionYOffset - y offset, in model coordinates
   */
  setProjectionOffsets(projectionXOffset, projectionYOffset) {
    this.xComponentVector.setProjectionOffsets(projectionXOffset, projectionYOffset);
    this.yComponentVector.setProjectionOffsets(projectionXOffset, projectionYOffset);
  }
}
vectorAddition.register('Vector', Vector);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJVdGlscyIsIkFuaW1hdGlvbiIsIkVhc2luZyIsInZlY3RvckFkZGl0aW9uIiwiVmVjdG9yQWRkaXRpb25Db25zdGFudHMiLCJWZWN0b3JBZGRpdGlvblF1ZXJ5UGFyYW1ldGVycyIsIkNvbXBvbmVudFZlY3RvciIsIkNvbXBvbmVudFZlY3RvclR5cGVzIiwiQ29vcmRpbmF0ZVNuYXBNb2RlcyIsIkdyYXBoT3JpZW50YXRpb25zIiwiUm9vdFZlY3RvciIsIm9wdGlvbml6ZSIsIkFWRVJBR0VfQU5JTUFUSU9OX1NQRUVEIiwiTUlOX0FOSU1BVElPTl9USU1FIiwiUE9MQVJfQU5HTEVfSU5URVJWQUwiLCJWRUNUT1JfRkFMTF9CQUNLX1NZTUJPTCIsIlZFQ1RPUl9EUkFHX1RIUkVTSE9MRCIsInZlY3RvckRyYWdUaHJlc2hvbGQiLCJQT0xBUl9TTkFQX0RJU1RBTkNFIiwicG9sYXJTbmFwRGlzdGFuY2UiLCJWZWN0b3IiLCJjb25zdHJ1Y3RvciIsImluaXRpYWxUYWlsUG9zaXRpb24iLCJpbml0aWFsQ29tcG9uZW50cyIsImdyYXBoIiwidmVjdG9yU2V0Iiwic3ltYm9sIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsImlzVGlwRHJhZ2dhYmxlIiwiaXNSZW1vdmFibGUiLCJpc09uR3JhcGhJbml0aWFsbHkiLCJ2ZWN0b3JDb2xvclBhbGV0dGUiLCJmYWxsQmFja1N5bWJvbCIsImlzT25HcmFwaFByb3BlcnR5IiwiaW5Qcm9ncmVzc0FuaW1hdGlvbiIsImFuaW1hdGVCYWNrUHJvcGVydHkiLCJ4Q29tcG9uZW50VmVjdG9yIiwiY29tcG9uZW50U3R5bGVQcm9wZXJ0eSIsImFjdGl2ZVZlY3RvclByb3BlcnR5IiwiWF9DT01QT05FTlQiLCJ5Q29tcG9uZW50VmVjdG9yIiwiWV9DT01QT05FTlQiLCJ1cGRhdGVUYWlsUG9zaXRpb24iLCJuZXdNb2RlbFZpZXdUcmFuc2Zvcm0iLCJvbGRNb2RlbFZpZXdUcmFuc2Zvcm0iLCJ0YWlsUG9zaXRpb25WaWV3IiwibW9kZWxUb1ZpZXdQb3NpdGlvbiIsInRhaWwiLCJtb3ZlVG9UYWlsUG9zaXRpb24iLCJ2aWV3VG9Nb2RlbFBvc2l0aW9uIiwibW9kZWxWaWV3VHJhbnNmb3JtUHJvcGVydHkiLCJsYXp5TGluayIsImRpc3Bvc2VWZWN0b3IiLCJ1bmxpbmsiLCJkaXNwb3NlIiwic3RvcCIsImdldExhYmVsRGlzcGxheURhdGEiLCJ2YWx1ZXNWaXNpYmxlIiwidmFsdWUiLCJtYWduaXR1ZGUiLCJjb2VmZmljaWVudCIsImluY2x1ZGVBYnNvbHV0ZVZhbHVlQmFycyIsInNldFRpcFdpdGhJbnZhcmlhbnRzIiwidGlwUG9zaXRpb24iLCJhc3NlcnQiLCJ0aXBQb3NpdGlvbldpdGhJbnZhcmlhbnRzIiwiY29vcmRpbmF0ZVNuYXBNb2RlIiwiQ0FSVEVTSUFOIiwidGlwUG9zaXRpb25PbkdyYXBoIiwiZ3JhcGhNb2RlbEJvdW5kcyIsImNsb3Nlc3RQb2ludFRvIiwicm91bmRlZFN5bW1ldHJpYyIsInZlY3RvckNvbXBvbmVudHMiLCJtaW51cyIsInJvdW5kZWRNYWduaXR1ZGUiLCJyb3VuZFN5bW1ldHJpYyIsImFuZ2xlSW5SYWRpYW5zIiwidG9SYWRpYW5zIiwicm91bmRlZEFuZ2xlIiwiYW5nbGUiLCJwb2xhclZlY3RvciIsInNldFBvbGFyIiwiY29udGFpbnNQb2ludCIsInBsdXMiLCJzZXRNYWduaXR1ZGUiLCJvcmllbnRhdGlvbiIsIkhPUklaT05UQUwiLCJzZXRZIiwidGFpbFkiLCJWRVJUSUNBTCIsInNldFgiLCJ0YWlsWCIsImVxdWFscyIsInRpcCIsInNldFRhaWxXaXRoSW52YXJpYW50cyIsInRhaWxQb3NpdGlvbiIsImNvbnN0cmFpbmVkVGFpbEJvdW5kcyIsImdldENvbnN0cmFpbmVkVGFpbEJvdW5kcyIsInRhaWxQb3NpdGlvbk9uR3JhcGgiLCJQT0xBUiIsInZlY3RvcnNJblZlY3RvclNldCIsInZlY3RvcnMiLCJmaWx0ZXIiLCJ2ZWN0b3IiLCJzdW1WZWN0b3IiLCJwdXNoIiwiaSIsImxlbmd0aCIsImRpc3RhbmNlIiwibW92ZVRpcFRvUG9zaXRpb24iLCJtb3ZlVGFpbFRvUG9zaXRpb24iLCJkcmFnT2Zmc2V0IiwiTWF0aCIsImFicyIsIngiLCJ5IiwicG9wT2ZmT2ZHcmFwaCIsImVyb2RlZCIsIlZFQ1RPUl9UQUlMX0RSQUdfTUFSR0lOIiwiYW5pbWF0ZVRvUG9pbnQiLCJwb2ludCIsImZpbmFsQ29tcG9uZW50cyIsImZpbmlzaENhbGxiYWNrIiwidGltZXNTY2FsYXIiLCJkdXJhdGlvbiIsIl8iLCJtYXgiLCJ0YXJnZXRzIiwicHJvcGVydHkiLCJ0YWlsUG9zaXRpb25Qcm9wZXJ0eSIsImVhc2luZyIsIlFVQURSQVRJQ19JTl9PVVQiLCJ0byIsInZlY3RvckNvbXBvbmVudHNQcm9wZXJ0eSIsInN0YXJ0IiwiZmluaXNoTGlzdGVuZXIiLCJmaW5pc2hFbWl0dGVyIiwicmVtb3ZlTGlzdGVuZXIiLCJhZGRMaXN0ZW5lciIsImRyb3BPbnRvR3JhcGgiLCJzZXRQcm9qZWN0aW9uT2Zmc2V0cyIsInByb2plY3Rpb25YT2Zmc2V0IiwicHJvamVjdGlvbllPZmZzZXQiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlZlY3Rvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOS0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBWZWN0b3IgaXMgdGhlIG1vZGVsIGZvciBhIHZlY3RvciB0aGF0IGNhbiBiZSBkaXJlY3RseSBtYW5pcHVsYXRlZC4gIEl0IGNhbiBiZSB0cmFuc2xhdGVkIGFuZCAob3B0aW9uYWxseSlcclxuICogc2NhbGVkIGFuZCByb3RhdGVkLlxyXG4gKlxyXG4gKiBFeHRlbmRzIFJvb3RWZWN0b3IgYnV0IGFkZHMgdGhlIGZvbGxvd2luZyBmdW5jdGlvbmFsaXR5IChhbm5vdGF0ZWQgaW4gdGhlIGZpbGUpOlxyXG4gKiAgMS4gdXBkYXRlIHRoZSB0YWlsIHdoZW4gdGhlIG9yaWdpbiBtb3ZlcyAobW9kZWxWaWV3VHJhbnNmb3JtUHJvcGVydHkpXHJcbiAqICAyLiBpbnN0YW50aWF0ZSB4IGFuZCB5IGNvbXBvbmVudCB2ZWN0b3JzXHJcbiAqICAzLiBhYmlsaXR5IHRvIGNvcnJlY3RseSBkcmFnIHRoZSB2ZWN0b3IgYnkgdGhlIHRhaWwgYW5kIHRoZSB0aXAgaW4gYm90aCBwb2xhciBhbmQgQ2FydGVzaWFuIG1vZGVcclxuICogIDQuIG1ldGhvZHMgdG8gZHJvcCBhIHZlY3RvciwgdG8gYW5pbWF0ZSBhIHZlY3RvciwgYW5kIHRvIHBvcCBhIHZlY3RvciBvZmYgdGhlIGdyYXBoXHJcbiAqXHJcbiAqIEBhdXRob3IgQnJhbmRvbiBMaVxyXG4gKiBAYXV0aG9yIE1hcnRpbiBWZWlsbGV0dGVcclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICovXHJcblxyXG5pbXBvcnQgQm9vbGVhblByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvQm9vbGVhblByb3BlcnR5LmpzJztcclxuaW1wb3J0IFV0aWxzIGZyb20gJy4uLy4uLy4uLy4uL2RvdC9qcy9VdGlscy5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IEFuaW1hdGlvbiBmcm9tICcuLi8uLi8uLi8uLi90d2l4dC9qcy9BbmltYXRpb24uanMnO1xyXG5pbXBvcnQgRWFzaW5nIGZyb20gJy4uLy4uLy4uLy4uL3R3aXh0L2pzL0Vhc2luZy5qcyc7XHJcbmltcG9ydCB2ZWN0b3JBZGRpdGlvbiBmcm9tICcuLi8uLi92ZWN0b3JBZGRpdGlvbi5qcyc7XHJcbmltcG9ydCBWZWN0b3JBZGRpdGlvbkNvbnN0YW50cyBmcm9tICcuLi9WZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5qcyc7XHJcbmltcG9ydCBWZWN0b3JBZGRpdGlvblF1ZXJ5UGFyYW1ldGVycyBmcm9tICcuLi9WZWN0b3JBZGRpdGlvblF1ZXJ5UGFyYW1ldGVycy5qcyc7XHJcbmltcG9ydCBDb21wb25lbnRWZWN0b3IgZnJvbSAnLi9Db21wb25lbnRWZWN0b3IuanMnO1xyXG5pbXBvcnQgQ29tcG9uZW50VmVjdG9yVHlwZXMgZnJvbSAnLi9Db21wb25lbnRWZWN0b3JUeXBlcy5qcyc7XHJcbmltcG9ydCBDb29yZGluYXRlU25hcE1vZGVzIGZyb20gJy4vQ29vcmRpbmF0ZVNuYXBNb2Rlcy5qcyc7XHJcbmltcG9ydCBHcmFwaE9yaWVudGF0aW9ucyBmcm9tICcuL0dyYXBoT3JpZW50YXRpb25zLmpzJztcclxuaW1wb3J0IFJvb3RWZWN0b3IsIHsgTGFiZWxEaXNwbGF5RGF0YSB9IGZyb20gJy4vUm9vdFZlY3Rvci5qcyc7XHJcbmltcG9ydCBHcmFwaCBmcm9tICcuL0dyYXBoLmpzJztcclxuaW1wb3J0IFZlY3RvclNldCBmcm9tICcuL1ZlY3RvclNldC5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IE1vZGVsVmlld1RyYW5zZm9ybTIgZnJvbSAnLi4vLi4vLi4vLi4vcGhldGNvbW1vbi9qcy92aWV3L01vZGVsVmlld1RyYW5zZm9ybTIuanMnO1xyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gY29uc3RhbnRzXHJcbmNvbnN0IEFWRVJBR0VfQU5JTUFUSU9OX1NQRUVEID0gMTYwMDsgLy8gaW4gbW9kZWwgY29vcmRpbmF0ZXNcclxuY29uc3QgTUlOX0FOSU1BVElPTl9USU1FID0gMC45OyAvLyBpbiBzZWNvbmRzXHJcblxyXG4vLyBpbnRlcnZhbCBzcGFjaW5nIG9mIHZlY3RvciBhbmdsZSAoaW4gZGVncmVlcykgd2hlbiB2ZWN0b3IgaXMgaW4gcG9sYXIgbW9kZVxyXG5jb25zdCBQT0xBUl9BTkdMRV9JTlRFUlZBTCA9IFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLlBPTEFSX0FOR0xFX0lOVEVSVkFMO1xyXG5cclxuLy8gZmFsbCBiYWNrIHN5bWJvbCBmb3IgdGhlIHZlY3RvciBtb2RlbCBpZiBhIHN5bWJvbCBpc24ndCBwcm92aWRlZC4gVGhlIHJlYXNvbiB0aGlzIGlzbid0IHRyYW5zbGF0YWJsZSBpczpcclxuLy8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3ZlY3Rvci1hZGRpdGlvbi9pc3N1ZXMvMTAuXHJcbmNvbnN0IFZFQ1RPUl9GQUxMX0JBQ0tfU1lNQk9MID0gJ3YnO1xyXG5cclxuLy8gbWF4aW11bSBhbW91bnQgb2YgZHJhZ2dpbmcgYmVmb3JlIHRoZSB2ZWN0b3Igd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGdyYXBoIHdoZW4gYXR0ZW1wdGluZyB0byBkcmFnIGEgdmVjdG9yLlxyXG4vLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3ZlY3Rvci1hZGRpdGlvbi9pc3N1ZXMvNDYgZm9yIG1vcmUgY29udGV4dC5cclxuY29uc3QgVkVDVE9SX0RSQUdfVEhSRVNIT0xEID0gVmVjdG9yQWRkaXRpb25RdWVyeVBhcmFtZXRlcnMudmVjdG9yRHJhZ1RocmVzaG9sZDtcclxuXHJcbi8vIGRpc3RhbmNlIGJldHdlZW4gYSB2ZWN0b3IncyB0YWlsIG9yIHRpcCB0byBhbm90aGVyIHZlY3Rvci9zIHRhaWwgb3IgdGlwIHRvIHNuYXAgdG8gdGhlIG90aGVyIHZlY3RvcnMgaW4gcG9sYXIgbW9kZS5cclxuY29uc3QgUE9MQVJfU05BUF9ESVNUQU5DRSA9IFZlY3RvckFkZGl0aW9uUXVlcnlQYXJhbWV0ZXJzLnBvbGFyU25hcERpc3RhbmNlO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuICBpc1RpcERyYWdnYWJsZT86IGJvb2xlYW47IC8vIGZsYWcgaW5kaWNhdGluZyBpZiB0aGUgdGlwIGNhbiBiZSBkcmFnZ2VkXHJcbiAgaXNSZW1vdmFibGU/OiBib29sZWFuOyAvLyBmbGFnIGluZGljYXRpbmcgaWYgdGhlIHZlY3RvciBjYW4gYmUgcmVtb3ZlZCBmcm9tIHRoZSBncmFwaFxyXG4gIGlzT25HcmFwaEluaXRpYWxseT86IGJvb2xlYW47IC8vIGZsYWcgaW5kaWNhdGluZyBpZiB0aGUgdmVjdG9yIGlzIG9uIHRoZSBncmFwaCB1cG9uIGluaXRpYWxpemF0aW9uXHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBWZWN0b3JPcHRpb25zID0gU2VsZk9wdGlvbnM7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWZWN0b3IgZXh0ZW5kcyBSb290VmVjdG9yIHtcclxuXHJcbiAgLy8gaW5kaWNhdGVzIGlmIHRoZSB0aXAgY2FuIGJlIGRyYWdnZWRcclxuICBwdWJsaWMgcmVhZG9ubHkgaXNUaXBEcmFnZ2FibGU6IGJvb2xlYW47XHJcblxyXG4gIC8vIGluZGljYXRlcyBpZiB0aGUgdmVjdG9yIGNhbiBiZSByZW1vdmVkXHJcbiAgcHVibGljIHJlYWRvbmx5IGlzUmVtb3ZhYmxlOiBib29sZWFuO1xyXG5cclxuICAvLyBmYWxsQmFja1N5bWJvbCAtIHNlZSBkZWNsYXJhdGlvbiBvZiBWRUNUT1JfRkFMTF9CQUNLX1NZTUJPTCBmb3IgZG9jdW1lbnRhdGlvblxyXG4gIHB1YmxpYyByZWFkb25seSBmYWxsQmFja1N5bWJvbDogc3RyaW5nO1xyXG5cclxuICAvLyB0aGUgZ3JhcGggdGhhdCB0aGUgdmVjdG9yIG1vZGVsIGJlbG9uZ3MgdG9cclxuICBwdWJsaWMgcmVhZG9ubHkgZ3JhcGg6IEdyYXBoO1xyXG5cclxuICAvLyB0aGUgdmVjdG9yIHNldCB0aGF0IHRoZSB2ZWN0b3IgYmVsb25ncyB0b1xyXG4gIHB1YmxpYyByZWFkb25seSB2ZWN0b3JTZXQ6IFZlY3RvclNldDtcclxuXHJcbiAgLy8gaW5kaWNhdGVzIHdoZXRoZXIgdGhlIHZlY3RvciBpcyBvbiB0aGUgZ3JhcGhcclxuICBwdWJsaWMgcmVhZG9ubHkgaXNPbkdyYXBoUHJvcGVydHk6IFByb3BlcnR5PGJvb2xlYW4+O1xyXG5cclxuICAvLyB7QW5pbWF0aW9ufG51bGx9IHJlZmVyZW5jZSB0byBhbnkgYW5pbWF0aW9uIHRoYXQgaXMgY3VycmVudGx5IGluIHByb2dyZXNzXHJcbiAgcHVibGljIGluUHJvZ3Jlc3NBbmltYXRpb246IEFuaW1hdGlvbiB8IG51bGw7XHJcblxyXG4gIC8vIGluZGljYXRlcyBpZiB0aGUgdmVjdG9yIHNob3VsZCBiZSBhbmltYXRlZCBiYWNrIHRvIHRoZSB0b29sYm94XHJcbiAgcHVibGljIHJlYWRvbmx5IGFuaW1hdGVCYWNrUHJvcGVydHk6IFByb3BlcnR5PGJvb2xlYW4+O1xyXG5cclxuICAvLyB0aGUgdmVjdG9yJ3MgeCBhbmQgeSBjb21wb25lbnQgdmVjdG9yc1xyXG4gIHB1YmxpYyByZWFkb25seSB4Q29tcG9uZW50VmVjdG9yOiBDb21wb25lbnRWZWN0b3I7XHJcbiAgcHVibGljIHJlYWRvbmx5IHlDb21wb25lbnRWZWN0b3I6IENvbXBvbmVudFZlY3RvcjtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNwb3NlVmVjdG9yOiAoKSA9PiB2b2lkO1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gaW5pdGlhbFRhaWxQb3NpdGlvbiAtIHN0YXJ0aW5nIHRhaWwgcG9zaXRpb24gb2YgdGhlIHZlY3RvclxyXG4gICAqIEBwYXJhbSBpbml0aWFsQ29tcG9uZW50cyAtIHN0YXJ0aW5nIGNvbXBvbmVudHMgb2YgdGhlIHZlY3RvclxyXG4gICAqIEBwYXJhbSBncmFwaCAtIHRoZSBncmFwaCB0aGUgdmVjdG9yIGJlbG9uZ3MgdG9cclxuICAgKiBAcGFyYW0gdmVjdG9yU2V0IC0gdGhlIHZlY3RvciBzZXQgdGhlIHZlY3RvciBiZWxvbmdzIHRvXHJcbiAgICogQHBhcmFtIHN5bWJvbCAtIHRoZSBzeW1ib2wgZm9yIHRoZSB2ZWN0b3IgKGkuZS4gJ2EnLCAnYicsICdjJywgLi4uKVxyXG4gICAqIEBwYXJhbSBbcHJvdmlkZWRPcHRpb25zXSAtIG5vdCBwcm9wYWdhdGVkIHRvIHN1cGVyIVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggaW5pdGlhbFRhaWxQb3NpdGlvbjogVmVjdG9yMiwgaW5pdGlhbENvbXBvbmVudHM6IFZlY3RvcjIsIGdyYXBoOiBHcmFwaCwgdmVjdG9yU2V0OiBWZWN0b3JTZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgICBzeW1ib2w6IHN0cmluZyB8IG51bGwsIHByb3ZpZGVkT3B0aW9ucz86IFZlY3Rvck9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxWZWN0b3JPcHRpb25zLCBTZWxmT3B0aW9ucz4oKSgge1xyXG5cclxuICAgICAgLy8gU2VsZk9wdGlvbnNcclxuICAgICAgaXNUaXBEcmFnZ2FibGU6IHRydWUsXHJcbiAgICAgIGlzUmVtb3ZhYmxlOiB0cnVlLFxyXG4gICAgICBpc09uR3JhcGhJbml0aWFsbHk6IGZhbHNlXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBzdXBlciggaW5pdGlhbFRhaWxQb3NpdGlvbiwgaW5pdGlhbENvbXBvbmVudHMsIHZlY3RvclNldC52ZWN0b3JDb2xvclBhbGV0dGUsIHN5bWJvbCApO1xyXG5cclxuICAgIHRoaXMuaXNUaXBEcmFnZ2FibGUgPSBvcHRpb25zLmlzVGlwRHJhZ2dhYmxlO1xyXG4gICAgdGhpcy5pc1JlbW92YWJsZSA9IG9wdGlvbnMuaXNSZW1vdmFibGU7XHJcbiAgICB0aGlzLmZhbGxCYWNrU3ltYm9sID0gVkVDVE9SX0ZBTExfQkFDS19TWU1CT0w7XHJcbiAgICB0aGlzLmdyYXBoID0gZ3JhcGg7XHJcbiAgICB0aGlzLnZlY3RvclNldCA9IHZlY3RvclNldDtcclxuICAgIHRoaXMuaXNPbkdyYXBoUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCBvcHRpb25zLmlzT25HcmFwaEluaXRpYWxseSApO1xyXG4gICAgdGhpcy5pblByb2dyZXNzQW5pbWF0aW9uID0gbnVsbDtcclxuICAgIHRoaXMuYW5pbWF0ZUJhY2tQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIGZhbHNlICk7XHJcblxyXG4gICAgdGhpcy54Q29tcG9uZW50VmVjdG9yID0gbmV3IENvbXBvbmVudFZlY3RvciggdGhpcyxcclxuICAgICAgdmVjdG9yU2V0LmNvbXBvbmVudFN0eWxlUHJvcGVydHksXHJcbiAgICAgIGdyYXBoLmFjdGl2ZVZlY3RvclByb3BlcnR5LFxyXG4gICAgICBDb21wb25lbnRWZWN0b3JUeXBlcy5YX0NPTVBPTkVOVFxyXG4gICAgKTtcclxuXHJcbiAgICB0aGlzLnlDb21wb25lbnRWZWN0b3IgPSBuZXcgQ29tcG9uZW50VmVjdG9yKCB0aGlzLFxyXG4gICAgICB2ZWN0b3JTZXQuY29tcG9uZW50U3R5bGVQcm9wZXJ0eSxcclxuICAgICAgZ3JhcGguYWN0aXZlVmVjdG9yUHJvcGVydHksXHJcbiAgICAgIENvbXBvbmVudFZlY3RvclR5cGVzLllfQ09NUE9ORU5UXHJcbiAgICApO1xyXG5cclxuICAgIC8vIFdoZW4gdGhlIGdyYXBoJ3Mgb3JpZ2luIGNoYW5nZXMsIHVwZGF0ZSB0aGUgdGFpbCBwb3NpdGlvbi4gdW5saW5rIGlzIHJlcXVpcmVkIG9uIGRpc3Bvc2UuXHJcbiAgICBjb25zdCB1cGRhdGVUYWlsUG9zaXRpb24gPSAoIG5ld01vZGVsVmlld1RyYW5zZm9ybTogTW9kZWxWaWV3VHJhbnNmb3JtMiwgb2xkTW9kZWxWaWV3VHJhbnNmb3JtOiBNb2RlbFZpZXdUcmFuc2Zvcm0yICkgPT4ge1xyXG4gICAgICBjb25zdCB0YWlsUG9zaXRpb25WaWV3ID0gb2xkTW9kZWxWaWV3VHJhbnNmb3JtLm1vZGVsVG9WaWV3UG9zaXRpb24oIHRoaXMudGFpbCApO1xyXG4gICAgICB0aGlzLm1vdmVUb1RhaWxQb3NpdGlvbiggbmV3TW9kZWxWaWV3VHJhbnNmb3JtLnZpZXdUb01vZGVsUG9zaXRpb24oIHRhaWxQb3NpdGlvblZpZXcgKSApO1xyXG4gICAgfTtcclxuICAgIHRoaXMuZ3JhcGgubW9kZWxWaWV3VHJhbnNmb3JtUHJvcGVydHkubGF6eUxpbmsoIHVwZGF0ZVRhaWxQb3NpdGlvbiApO1xyXG5cclxuICAgIHRoaXMuZGlzcG9zZVZlY3RvciA9ICgpID0+IHtcclxuICAgICAgdGhpcy5ncmFwaC5tb2RlbFZpZXdUcmFuc2Zvcm1Qcm9wZXJ0eS51bmxpbmsoIHVwZGF0ZVRhaWxQb3NpdGlvbiApO1xyXG4gICAgICB0aGlzLnhDb21wb25lbnRWZWN0b3IuZGlzcG9zZSgpO1xyXG4gICAgICB0aGlzLnlDb21wb25lbnRWZWN0b3IuZGlzcG9zZSgpO1xyXG4gICAgICB0aGlzLmluUHJvZ3Jlc3NBbmltYXRpb24gJiYgdGhpcy5pblByb2dyZXNzQW5pbWF0aW9uLnN0b3AoKTtcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuZGlzcG9zZVZlY3RvcigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VlIFJvb3RWZWN0b3IuZ2V0TGFiZWxEaXNwbGF5RGF0YSBmb3IgZGV0YWlscy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TGFiZWxEaXNwbGF5RGF0YSggdmFsdWVzVmlzaWJsZTogYm9vbGVhbiApOiBMYWJlbERpc3BsYXlEYXRhIHtcclxuXHJcbiAgICAvLyBJZiB0aGUgdmVjdG9yIGhhcyBhIHN5bWJvbCBvciBpcyBhY3RpdmUsIHRoZSB2ZWN0b3IgYWx3YXlzIGRpc3BsYXlzIGEgc3ltYm9sLlxyXG4gICAgbGV0IHN5bWJvbDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XHJcbiAgICBpZiAoIHRoaXMuc3ltYm9sIHx8IHRoaXMuZ3JhcGguYWN0aXZlVmVjdG9yUHJvcGVydHkudmFsdWUgPT09IHRoaXMgKSB7XHJcbiAgICAgIHN5bWJvbCA9ICggdGhpcy5zeW1ib2wgfHwgdGhpcy5mYWxsQmFja1N5bWJvbCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIHRoZSB2YWx1ZXMgYXJlIG9uLCB0aGUgdmVjdG9yIGFsd2F5cyBkaXNwbGF5cyBhIHZhbHVlLlxyXG4gICAgbGV0IG1hZ25pdHVkZTogbnVtYmVyIHwgbnVsbCA9IG51bGw7XHJcbiAgICBpZiAoIHZhbHVlc1Zpc2libGUgKSB7XHJcbiAgICAgIG1hZ25pdHVkZSA9IHRoaXMubWFnbml0dWRlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGNvZWZmaWNpZW50OiBudWxsLCAvLyB2ZWN0b3IgbW9kZWxzIGRvbid0IGhhdmUgY29lZmZpY2llbnRzXHJcbiAgICAgIHN5bWJvbDogc3ltYm9sLFxyXG4gICAgICBtYWduaXR1ZGU6IG1hZ25pdHVkZSxcclxuICAgICAgaW5jbHVkZUFic29sdXRlVmFsdWVCYXJzOiAoIG1hZ25pdHVkZSAhPT0gbnVsbCAmJiBzeW1ib2wgIT09IG51bGwgKSAvLyBhYnNvbHV0ZSB2YWx1ZSBiYXJzIGlmIHRoZXJlIGlzIGEgbWFnbml0dWRlXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgdGlwIG9mIHRoZSB2ZWN0b3IgYnV0IGVuc3VyZXMgdGhlIHZlY3RvciBzYXRpc2ZpZXMgaW52YXJpYW50cyBmb3IgcG9sYXIvQ2FydGVzaWFuIG1vZGUuXHJcbiAgICpcclxuICAgKiAjIyBDb21tb24gSW52YXJpYW50cyAoZm9yIGJvdGggQ2FydGVzaWFuIGFuZCBwb2xhciBtb2RlKTpcclxuICAgKiAgLSBWZWN0b3IgbXVzdCBub3QgYmUgc2V0IHRvIHRoZSB0YWlsICgwIG1hZ25pdHVkZSlcclxuICAgKlxyXG4gICAqICMjIEludmFyaWFudHMgZm9yIENhcnRlc2lhbiBtb2RlOlxyXG4gICAqICAtIFZlY3RvciB0aXAgbXVzdCBiZSBvbiBhbiBleGFjdCBtb2RlbCBjb29yZGluYXRlXHJcbiAgICpcclxuICAgKiAjIyBJbnZhcmlhbnRzIGZvciBwb2xhciBtb2RlOlxyXG4gICAqICAtIFZlY3RvciB0aXAgbXVzdCBiZSByb3VuZGVkIHRvIGVuc3VyZSB0aGUgbWFnbml0dWRlIG9mIHRoZSB2ZWN0b3IgaXMgYSBpbnRlZ2VyXHJcbiAgICogIC0gVmVjdG9yIHRpcCBtdXN0IGJlIHJvdW5kZWQgdG8gZW5zdXJlIHRoZSB2ZWN0b3IgYW5nbGUgaXMgYSBtdWx0aXBsZSBvZiBQT0xBUl9BTkdMRV9JTlRFUlZBTFxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBzZXRUaXBXaXRoSW52YXJpYW50cyggdGlwUG9zaXRpb246IFZlY3RvcjIgKTogdm9pZCB7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMuaW5Qcm9ncmVzc0FuaW1hdGlvbiwgJ3RoaXMuaW5Qcm9ncmVzc0FuaW1hdGlvbiBtdXN0IGJlIGZhbHNlJyApO1xyXG5cclxuICAgIC8vIEZsYWcgdG8gZ2V0IHRoZSB0aXAgcG9pbnQgdGhhdCBzYXRpc2ZpZXMgaW52YXJpYW50cyAodG8gYmUgY2FsY3VsYXRlZCBiZWxvdylcclxuICAgIGxldCB0aXBQb3NpdGlvbldpdGhJbnZhcmlhbnRzOiBWZWN0b3IyO1xyXG5cclxuICAgIGlmICggdGhpcy5ncmFwaC5jb29yZGluYXRlU25hcE1vZGUgPT09IENvb3JkaW5hdGVTbmFwTW9kZXMuQ0FSVEVTSUFOICkge1xyXG5cclxuICAgICAgLy8gRW5zdXJlIHRoYXQgdGhlIHRpcFBvc2l0aW9uIGlzIG9uIHRoZSBncmFwaFxyXG4gICAgICBjb25zdCB0aXBQb3NpdGlvbk9uR3JhcGggPSB0aGlzLmdyYXBoLmdyYXBoTW9kZWxCb3VuZHMuY2xvc2VzdFBvaW50VG8oIHRpcFBvc2l0aW9uICk7XHJcblxyXG4gICAgICAvLyBSb3VuZCB0aGUgdGlwIHRvIGludGVnZXIgZ3JpZCB2YWx1ZXNcclxuICAgICAgdGlwUG9zaXRpb25XaXRoSW52YXJpYW50cyA9IHRpcFBvc2l0aW9uT25HcmFwaC5yb3VuZGVkU3ltbWV0cmljKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgLy8gdGhpcy5ncmFwaC5jb29yZGluYXRlU25hcE1vZGUgPT09IENvb3JkaW5hdGVTbmFwTW9kZXMuUE9MQVJcclxuXHJcbiAgICAgIGNvbnN0IHZlY3RvckNvbXBvbmVudHMgPSB0aXBQb3NpdGlvbi5taW51cyggdGhpcy50YWlsICk7XHJcblxyXG4gICAgICBjb25zdCByb3VuZGVkTWFnbml0dWRlID0gVXRpbHMucm91bmRTeW1tZXRyaWMoIHZlY3RvckNvbXBvbmVudHMubWFnbml0dWRlICk7XHJcblxyXG4gICAgICBjb25zdCBhbmdsZUluUmFkaWFucyA9IFV0aWxzLnRvUmFkaWFucyggUE9MQVJfQU5HTEVfSU5URVJWQUwgKTtcclxuICAgICAgY29uc3Qgcm91bmRlZEFuZ2xlID0gYW5nbGVJblJhZGlhbnMgKiBVdGlscy5yb3VuZFN5bW1ldHJpYyggdmVjdG9yQ29tcG9uZW50cy5hbmdsZSAvIGFuZ2xlSW5SYWRpYW5zICk7XHJcblxyXG4gICAgICAvLyBDYWxjdWxhdGUgdGhlIHJvdW5kZWQgcG9sYXIgdmVjdG9yXHJcbiAgICAgIGNvbnN0IHBvbGFyVmVjdG9yID0gdmVjdG9yQ29tcG9uZW50cy5zZXRQb2xhciggcm91bmRlZE1hZ25pdHVkZSwgcm91bmRlZEFuZ2xlICk7XHJcblxyXG4gICAgICAvLyBFbnN1cmUgdGhhdCB0aGUgbmV3IHBvbGFyIHZlY3RvciBpcyBpbiB0aGUgYm91bmRzLiBTdWJ0cmFjdCBvbmUgZnJvbSB0aGUgbWFnbml0dWRlIHVudGlsIHRoZSB2ZWN0b3IgaXMgaW5zaWRlXHJcbiAgICAgIHdoaWxlICggIXRoaXMuZ3JhcGguZ3JhcGhNb2RlbEJvdW5kcy5jb250YWluc1BvaW50KCB0aGlzLnRhaWwucGx1cyggcG9sYXJWZWN0b3IgKSApICkge1xyXG4gICAgICAgIHBvbGFyVmVjdG9yLnNldE1hZ25pdHVkZSggcG9sYXJWZWN0b3IubWFnbml0dWRlIC0gMSApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aXBQb3NpdGlvbldpdGhJbnZhcmlhbnRzID0gdGhpcy50YWlsLnBsdXMoIHBvbGFyVmVjdG9yICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQmFzZWQgb24gdGhlIHZlY3RvciBvcmllbnRhdGlvbiwgY29uc3RyYWluIHRoZSBkcmFnZ2luZyBjb21wb25lbnRzXHJcbiAgICBpZiAoIHRoaXMuZ3JhcGgub3JpZW50YXRpb24gPT09IEdyYXBoT3JpZW50YXRpb25zLkhPUklaT05UQUwgKSB7XHJcbiAgICAgIHRpcFBvc2l0aW9uV2l0aEludmFyaWFudHMuc2V0WSggdGhpcy50YWlsWSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHRoaXMuZ3JhcGgub3JpZW50YXRpb24gPT09IEdyYXBoT3JpZW50YXRpb25zLlZFUlRJQ0FMICkge1xyXG4gICAgICB0aXBQb3NpdGlvbldpdGhJbnZhcmlhbnRzLnNldFgoIHRoaXMudGFpbFggKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBFbnN1cmUgdmVjdG9yIHRpcCBtdXN0IG5vdCBiZSBzZXQgdG8gdGhlIHRhaWwgKDAgbWFnbml0dWRlKVxyXG4gICAgaWYgKCAhdGlwUG9zaXRpb25XaXRoSW52YXJpYW50cy5lcXVhbHMoIHRoaXMudGFpbCApICkge1xyXG4gICAgICAvLyBVcGRhdGUgdGhlIG1vZGVsIHRpcFxyXG4gICAgICB0aGlzLnRpcCA9IHRpcFBvc2l0aW9uV2l0aEludmFyaWFudHM7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB0YWlsIG9mIHRoZSB2ZWN0b3IgYnV0IGVuc3VyZXMgdGhlIHZlY3RvciBzYXRpc2ZpZXMgaW52YXJpYW50cyBmb3IgcG9sYXIvQ2FydGVzaWFuIG1vZGUuXHJcbiAgICpcclxuICAgKiAjIyBJbnZhcmlhbnRzIGZvciBDYXJ0ZXNpYW4gbW9kZTpcclxuICAgKiAgLSBWZWN0b3IgdGFpbCBtdXN0IGJlIG9uIGFuIGV4YWN0IG1vZGVsIGNvb3JkaW5hdGVcclxuICAgKlxyXG4gICAqICMjIEludmFyaWFudHMgZm9yIHBvbGFyIG1vZGU6XHJcbiAgICogIC0gVmVjdG9yJ3MgbXVzdCBzbmFwIHRvIG90aGVyIHZlY3RvcnMgdG8gYWxsb3cgdGlwIHRvIHRhaWwgc3VtIGNvbXBhcmlzb25zLlxyXG4gICAqICAgIFNlZSBodHRwczovL2RvY3MuZ29vZ2xlLmNvbS9kb2N1bWVudC9kLzFvcG5EZ3FJcUlyb284VkswQ2JPeVE1NjA4X2cxMU1TR1pYbkZsSThrNURzL2VkaXQ/dHM9NWNlZDUxZTkjXHJcbiAgICogIC0gVmVjdG9yIHRhaWwgZG9lc24ndCBoYXZlIHRvIGJlIG9uIGFuIGV4YWN0IG1vZGVsIGNvb3JkaW5hdGUsIGJ1dCBzaG91bGQgd2hlbiBub3Qgc25hcHBpbmcgdG8gb3RoZXIgdmVjdG9yc1xyXG4gICAqL1xyXG4gIHByaXZhdGUgc2V0VGFpbFdpdGhJbnZhcmlhbnRzKCB0YWlsUG9zaXRpb246IFZlY3RvcjIgKTogdm9pZCB7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMuaW5Qcm9ncmVzc0FuaW1hdGlvbiwgJ3RoaXMuaW5Qcm9ncmVzc0FuaW1hdGlvbiBtdXN0IGJlIGZhbHNlJyApO1xyXG5cclxuICAgIGNvbnN0IGNvbnN0cmFpbmVkVGFpbEJvdW5kcyA9IHRoaXMuZ2V0Q29uc3RyYWluZWRUYWlsQm91bmRzKCk7XHJcblxyXG4gICAgLy8gRW5zdXJlIHRoZSB0YWlsIGlzIHNldCBpbiBhIHBvc2l0aW9uIHNvIHRoZSB0YWlsIGFuZCB0aGUgdGlwIGFyZSBvbiB0aGUgZ3JhcGhcclxuICAgIGNvbnN0IHRhaWxQb3NpdGlvbk9uR3JhcGggPSBjb25zdHJhaW5lZFRhaWxCb3VuZHMuY2xvc2VzdFBvaW50VG8oIHRhaWxQb3NpdGlvbiApO1xyXG5cclxuICAgIGlmICggdGhpcy5ncmFwaC5jb29yZGluYXRlU25hcE1vZGUgPT09IENvb3JkaW5hdGVTbmFwTW9kZXMuUE9MQVIgKSB7XHJcblxyXG4gICAgICAvLyBHZXQgdGhlIHRpcCBvZiB0aGlzIHZlY3RvclxyXG4gICAgICBjb25zdCB0aXBQb3NpdGlvbk9uR3JhcGggPSB0YWlsUG9zaXRpb25PbkdyYXBoLnBsdXMoIHRoaXMudmVjdG9yQ29tcG9uZW50cyApO1xyXG5cclxuICAgICAgLy8gR2V0IGFsbCB0aGUgdmVjdG9ycyBpbiB0aGUgc2V0LCBpbmNsdWRpbmcgdGhlIHN1bSBhbmQgZXhjbHVkaW5nIHRoaXMgdmVjdG9yXHJcbiAgICAgIGNvbnN0IHZlY3RvcnNJblZlY3RvclNldCA9IHRoaXMudmVjdG9yU2V0LnZlY3RvcnMuZmlsdGVyKCB2ZWN0b3IgPT4ge1xyXG4gICAgICAgIHJldHVybiB2ZWN0b3IgIT09IHRoaXM7XHJcbiAgICAgIH0gKTtcclxuICAgICAgaWYgKCB0aGlzLnZlY3RvclNldC5zdW1WZWN0b3IgKSB7XHJcbiAgICAgICAgdmVjdG9yc0luVmVjdG9yU2V0LnB1c2goIHRoaXMudmVjdG9yU2V0LnN1bVZlY3RvciApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgLy8gVmVjdG9yJ3MgbXVzdCBzbmFwIHRvIG90aGVyIHZlY3RvcnMgdG8gYWxsb3cgdGlwIHRvIHRhaWwgc3VtIGNvbXBhcmlzb25zLlxyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB2ZWN0b3JzSW5WZWN0b3JTZXQubGVuZ3RoOyBpKysgKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IHZlY3RvciA9IHZlY3RvcnNJblZlY3RvclNldFsgaSBdO1xyXG5cclxuICAgICAgICAvLyBTbmFwIHRhaWwgdG8gb3RoZXIgdmVjdG9yJ3MgdGFpbHNcclxuICAgICAgICBpZiAoIHZlY3Rvci50YWlsLmRpc3RhbmNlKCB0YWlsUG9zaXRpb25PbkdyYXBoICkgPCBQT0xBUl9TTkFQX0RJU1RBTkNFICkge1xyXG4gICAgICAgICAgdGhpcy5tb3ZlVG9UYWlsUG9zaXRpb24oIHZlY3Rvci50YWlsICk7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBTbmFwIHRhaWwgdG8gb3RoZXIgdmVjdG9yJ3MgdGlwXHJcbiAgICAgICAgaWYgKCB2ZWN0b3IudGlwLmRpc3RhbmNlKCB0YWlsUG9zaXRpb25PbkdyYXBoICkgPCBQT0xBUl9TTkFQX0RJU1RBTkNFICkge1xyXG4gICAgICAgICAgdGhpcy5tb3ZlVG9UYWlsUG9zaXRpb24oIHZlY3Rvci50aXAgKTtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFNuYXAgdGlwIHRvIG90aGVyIHZlY3RvcidzIHRhaWxcclxuICAgICAgICBpZiAoIHZlY3Rvci50YWlsLmRpc3RhbmNlKCB0aXBQb3NpdGlvbk9uR3JhcGggKSA8IFBPTEFSX1NOQVBfRElTVEFOQ0UgKSB7XHJcbiAgICAgICAgICB0aGlzLm1vdmVUb1RhaWxQb3NpdGlvbiggdmVjdG9yLnRhaWwubWludXMoIHRoaXMudmVjdG9yQ29tcG9uZW50cyApICk7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5tb3ZlVG9UYWlsUG9zaXRpb24oIHRhaWxQb3NpdGlvbk9uR3JhcGgucm91bmRlZFN5bW1ldHJpYygpICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBNb3ZlcyB0aGUgdGlwIHRvIHRoaXMgcG9zaXRpb24gYnV0IGVuc3VyZXMgaXQgc2F0aXNmaWVzIGludmFyaWFudHMgZm9yIHBvbGFyIGFuZCBDYXJ0ZXNpYW4gbW9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgbW92ZVRpcFRvUG9zaXRpb24oIHRpcFBvc2l0aW9uOiBWZWN0b3IyICk6IHZvaWQge1xyXG4gICAgdGhpcy5zZXRUaXBXaXRoSW52YXJpYW50cyggdGlwUG9zaXRpb24gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE1vdmVzIHRoZSB0YWlsIHRvIHRoaXMgcG9zaXRpb24gYnV0IGVuc3VyZXMgaXQgc2F0aXNmaWVzIGludmFyaWFudHMgZm9yIHBvbGFyIGFuZCBDYXJ0ZXNpYW4gbW9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgbW92ZVRhaWxUb1Bvc2l0aW9uKCB0YWlsUG9zaXRpb246IFZlY3RvcjIgKTogdm9pZCB7XHJcblxyXG4gICAgLy8gRW5zdXJlIHRoYXQgdGhlIHRhaWwgc2F0aXNmaWVzIGludmFyaWFudHMgZm9yIHBvbGFyL0NhcnRlc2lhbiBtb2RlXHJcbiAgICB0aGlzLnNldFRhaWxXaXRoSW52YXJpYW50cyggdGFpbFBvc2l0aW9uICk7XHJcblxyXG4gICAgLy8gQWRkIGFiaWxpdHkgdG8gcmVtb3ZlIHZlY3RvcnNcclxuICAgIGlmICggdGhpcy5pc1JlbW92YWJsZSApIHtcclxuICAgICAgY29uc3QgY29uc3RyYWluZWRUYWlsQm91bmRzID0gdGhpcy5nZXRDb25zdHJhaW5lZFRhaWxCb3VuZHMoKTtcclxuXHJcbiAgICAgIC8vIE9mZnNldCBvZiB0aGUgY3Vyc29yIHRvIHRoZSB2ZWN0b3IuIFRoaXMgYWxsb3dzIHVzZXJzIHRvIHJlbW92ZSB2ZWN0b3JzIGJhc2VkIG9uIHRoZSBkaXNwbGFjZW1lbnQgb2YgdGhlXHJcbiAgICAgIC8vIGN1cnNvci4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy92ZWN0b3ItYWRkaXRpb24vaXNzdWVzLzQ2I2lzc3VlY29tbWVudC01MDY3MjYyNjJcclxuICAgICAgY29uc3QgZHJhZ09mZnNldCA9IGNvbnN0cmFpbmVkVGFpbEJvdW5kcy5jbG9zZXN0UG9pbnRUbyggdGFpbFBvc2l0aW9uICkubWludXMoIHRhaWxQb3NpdGlvbiApO1xyXG5cclxuICAgICAgaWYgKCBNYXRoLmFicyggZHJhZ09mZnNldC54ICkgPiBWRUNUT1JfRFJBR19USFJFU0hPTEQgfHwgTWF0aC5hYnMoIGRyYWdPZmZzZXQueSApID4gVkVDVE9SX0RSQUdfVEhSRVNIT0xEICkge1xyXG4gICAgICAgIHRoaXMucG9wT2ZmT2ZHcmFwaCgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBjb25zdHJhaW5lZCBib3VuZHMgb2YgdGhlIHRhaWwuIFRoZSB0YWlsIG11c3QgYmUgd2l0aGluIFZFQ1RPUl9UQUlMX0RSQUdfTUFSR0lOIHVuaXRzIG9mIHRoZSBlZGdlc1xyXG4gICAqIG9mIHRoZSBncmFwaC4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy92ZWN0b3ItYWRkaXRpb24vaXNzdWVzLzE1MlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2V0Q29uc3RyYWluZWRUYWlsQm91bmRzKCk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ3JhcGguZ3JhcGhNb2RlbEJvdW5kcy5lcm9kZWQoIFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLlZFQ1RPUl9UQUlMX0RSQUdfTUFSR0lOICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBbmltYXRlcyB0aGUgdmVjdG9yIHRvIGEgc3BlY2lmaWMgcG9pbnQuIENhbGxlZCB3aGVuIHRoZSB1c2VyIGZhaWxzIHRvIGRyb3AgdGhlIHZlY3RvciBpbiB0aGUgZ3JhcGguXHJcbiAgICogQHBhcmFtIHBvaW50IC0gYW5pbWF0ZXMgdGhlIGNlbnRlciBvZiB0aGUgdmVjdG9yIHRvIHRoaXMgcG9pbnRcclxuICAgKiBAcGFyYW0gZmluYWxDb21wb25lbnRzIC0gYW5pbWF0ZXMgdGhlIGNvbXBvbmVudHMgdG8gdGhlIGZpbmFsIGNvbXBvbmVudHNcclxuICAgKiBAcGFyYW0gZmluaXNoQ2FsbGJhY2sgLSBjYWxsYmFjayB3aGVuIHRoZSBhbmltYXRpb24gZmluaXNoZXMgbmF0dXJhbGx5LCBub3Qgd2hlbiBzdG9wcGVkXHJcbiAgICovXHJcbiAgcHVibGljIGFuaW1hdGVUb1BvaW50KCBwb2ludDogVmVjdG9yMiwgZmluYWxDb21wb25lbnRzOiBWZWN0b3IyLCBmaW5pc2hDYWxsYmFjazogKCkgPT4gdm9pZCApOiB2b2lkIHtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5pblByb2dyZXNzQW5pbWF0aW9uLCAnQ2FuXFwndCBhbmltYXRlIHRvIHBvc2l0aW9uIHdoZW4gd2UgYXJlIGluIGFuaW1hdGlvbiBjdXJyZW50bHknICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5pc09uR3JhcGhQcm9wZXJ0eS52YWx1ZSwgJ0NhblxcJ3QgYW5pbWF0ZSB3aGVuIHRoZSB2ZWN0b3IgaXMgb24gdGhlIGdyYXBoJyApO1xyXG5cclxuICAgIC8vIENhbGN1bGF0ZSB0aGUgdGFpbCBwb3NpdGlvbiB0byBhbmltYXRlIHRvXHJcbiAgICBjb25zdCB0YWlsUG9zaXRpb24gPSBwb2ludC5taW51cyggZmluYWxDb21wb25lbnRzLnRpbWVzU2NhbGFyKCAwLjUgKSApO1xyXG5cclxuICAgIHRoaXMuaW5Qcm9ncmVzc0FuaW1hdGlvbiA9IG5ldyBBbmltYXRpb24oIHtcclxuICAgICAgZHVyYXRpb246IF8ubWF4KCBbIE1JTl9BTklNQVRJT05fVElNRSwgdGhpcy50YWlsLmRpc3RhbmNlKCB0YWlsUG9zaXRpb24gKSAvIEFWRVJBR0VfQU5JTUFUSU9OX1NQRUVEIF0gKSxcclxuICAgICAgdGFyZ2V0czogWyB7XHJcbiAgICAgICAgcHJvcGVydHk6IHRoaXMudGFpbFBvc2l0aW9uUHJvcGVydHksXHJcbiAgICAgICAgZWFzaW5nOiBFYXNpbmcuUVVBRFJBVElDX0lOX09VVCxcclxuICAgICAgICB0bzogdGFpbFBvc2l0aW9uXHJcbiAgICAgIH0sIHtcclxuICAgICAgICBwcm9wZXJ0eTogdGhpcy52ZWN0b3JDb21wb25lbnRzUHJvcGVydHksXHJcbiAgICAgICAgZWFzaW5nOiBFYXNpbmcuUVVBRFJBVElDX0lOX09VVCxcclxuICAgICAgICB0bzogZmluYWxDb21wb25lbnRzXHJcbiAgICAgIH0gXVxyXG4gICAgfSApLnN0YXJ0KCk7XHJcblxyXG4gICAgLy8gQ2FsbGVkIHdoZW4gdGhlIGFuaW1hdGlvbiBmaW5pc2hlcyBuYXR1cmFsbHlcclxuICAgIGNvbnN0IGZpbmlzaExpc3RlbmVyID0gKCkgPT4ge1xyXG4gICAgICB0aGlzLmluUHJvZ3Jlc3NBbmltYXRpb24hLmZpbmlzaEVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoIGZpbmlzaExpc3RlbmVyICk7XHJcbiAgICAgIHRoaXMuaW5Qcm9ncmVzc0FuaW1hdGlvbiA9IG51bGw7XHJcbiAgICAgIGZpbmlzaENhbGxiYWNrKCk7XHJcbiAgICB9O1xyXG4gICAgdGhpcy5pblByb2dyZXNzQW5pbWF0aW9uLmZpbmlzaEVtaXR0ZXIuYWRkTGlzdGVuZXIoIGZpbmlzaExpc3RlbmVyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEcm9wcyB0aGUgdmVjdG9yIG9udG8gdGhlIGdyYXBoLlxyXG4gICAqIEBwYXJhbSB0YWlsUG9zaXRpb24gLSB0aGUgdGFpbCBwb3NpdGlvbiB0byBkcm9wIHRoZSB2ZWN0b3Igb250b1xyXG4gICAqL1xyXG4gIHB1YmxpYyBkcm9wT250b0dyYXBoKCB0YWlsUG9zaXRpb246IFZlY3RvcjIgKTogdm9pZCB7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMuaXNPbkdyYXBoUHJvcGVydHkudmFsdWUsICd2ZWN0b3IgaXMgYWxyZWFkeSBvbiB0aGUgZ3JhcGgnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5pblByb2dyZXNzQW5pbWF0aW9uLCAnY2Fubm90IGRyb3AgdmVjdG9yIHdoZW4gaXRcXCdzIGFuaW1hdGluZycgKTtcclxuXHJcbiAgICB0aGlzLmlzT25HcmFwaFByb3BlcnR5LnZhbHVlID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBFbnN1cmUgZHJvcHBlZCB0YWlsIHBvc2l0aW9uIHNhdGlzZmllcyBpbnZhcmlhbnRzXHJcbiAgICB0aGlzLnNldFRhaWxXaXRoSW52YXJpYW50cyggdGFpbFBvc2l0aW9uICk7XHJcblxyXG4gICAgLy8gV2hlbiB0aGUgdmVjdG9yIGlzIGZpcnN0IGRyb3BwZWQsIGl0IGlzIGFjdGl2ZVxyXG4gICAgdGhpcy5ncmFwaC5hY3RpdmVWZWN0b3JQcm9wZXJ0eS52YWx1ZSA9IHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQb3BzIHRoZSB2ZWN0b3Igb2ZmIG9mIHRoZSBncmFwaC5cclxuICAgKi9cclxuICBwdWJsaWMgcG9wT2ZmT2ZHcmFwaCgpOiB2b2lkIHtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmlzT25HcmFwaFByb3BlcnR5LnZhbHVlLCAnYXR0ZW1wdGVkIHBvcCBvZmYgZ3JhcGggd2hlbiB2ZWN0b3Igd2FzIGFscmVhZHkgb2ZmJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMuaW5Qcm9ncmVzc0FuaW1hdGlvbiwgJ2Nhbm5vdCBwb3AgdmVjdG9yIG9mZiB3aGVuIGl0XFwncyBhbmltYXRpbmcnICk7XHJcblxyXG4gICAgdGhpcy5pc09uR3JhcGhQcm9wZXJ0eS52YWx1ZSA9IGZhbHNlO1xyXG4gICAgdGhpcy5ncmFwaC5hY3RpdmVWZWN0b3JQcm9wZXJ0eS52YWx1ZSA9IG51bGw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBvZmZzZXQgZnJvbSB0aGUgeC1heGlzIGFuZCB5LWF4aXMgdGhhdCBpcyB1c2VkIGZvciBQUk9KRUNUSU9OIHN0eWxlIGZvciBjb21wb25lbnQgdmVjdG9ycy5cclxuICAgKiBAcGFyYW0gcHJvamVjdGlvblhPZmZzZXQgLSB4IG9mZnNldCwgaW4gbW9kZWwgY29vcmRpbmF0ZXNcclxuICAgKiBAcGFyYW0gcHJvamVjdGlvbllPZmZzZXQgLSB5IG9mZnNldCwgaW4gbW9kZWwgY29vcmRpbmF0ZXNcclxuICAgKi9cclxuICBwdWJsaWMgc2V0UHJvamVjdGlvbk9mZnNldHMoIHByb2plY3Rpb25YT2Zmc2V0OiBudW1iZXIsIHByb2plY3Rpb25ZT2Zmc2V0OiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICB0aGlzLnhDb21wb25lbnRWZWN0b3Iuc2V0UHJvamVjdGlvbk9mZnNldHMoIHByb2plY3Rpb25YT2Zmc2V0LCBwcm9qZWN0aW9uWU9mZnNldCApO1xyXG4gICAgdGhpcy55Q29tcG9uZW50VmVjdG9yLnNldFByb2plY3Rpb25PZmZzZXRzKCBwcm9qZWN0aW9uWE9mZnNldCwgcHJvamVjdGlvbllPZmZzZXQgKTtcclxuICB9XHJcbn1cclxuXHJcbnZlY3RvckFkZGl0aW9uLnJlZ2lzdGVyKCAnVmVjdG9yJywgVmVjdG9yICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLGVBQWUsTUFBTSx3Q0FBd0M7QUFDcEUsT0FBT0MsS0FBSyxNQUFNLDZCQUE2QjtBQUUvQyxPQUFPQyxTQUFTLE1BQU0sbUNBQW1DO0FBQ3pELE9BQU9DLE1BQU0sTUFBTSxnQ0FBZ0M7QUFDbkQsT0FBT0MsY0FBYyxNQUFNLHlCQUF5QjtBQUNwRCxPQUFPQyx1QkFBdUIsTUFBTSwrQkFBK0I7QUFDbkUsT0FBT0MsNkJBQTZCLE1BQU0scUNBQXFDO0FBQy9FLE9BQU9DLGVBQWUsTUFBTSxzQkFBc0I7QUFDbEQsT0FBT0Msb0JBQW9CLE1BQU0sMkJBQTJCO0FBQzVELE9BQU9DLG1CQUFtQixNQUFNLDBCQUEwQjtBQUMxRCxPQUFPQyxpQkFBaUIsTUFBTSx3QkFBd0I7QUFDdEQsT0FBT0MsVUFBVSxNQUE0QixpQkFBaUI7QUFHOUQsT0FBT0MsU0FBUyxNQUFNLHVDQUF1QztBQUs3RDtBQUNBO0FBQ0EsTUFBTUMsdUJBQXVCLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDdEMsTUFBTUMsa0JBQWtCLEdBQUcsR0FBRyxDQUFDLENBQUM7O0FBRWhDO0FBQ0EsTUFBTUMsb0JBQW9CLEdBQUdWLHVCQUF1QixDQUFDVSxvQkFBb0I7O0FBRXpFO0FBQ0E7QUFDQSxNQUFNQyx1QkFBdUIsR0FBRyxHQUFHOztBQUVuQztBQUNBO0FBQ0EsTUFBTUMscUJBQXFC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