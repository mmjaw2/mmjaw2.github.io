// Copyright 2019-2023, University of Colorado Boulder

/**
 * View for the vectors that are dragged onto the graph. These vectors are created in VectorCreatorPanelSlot.js and
 * support tip dragging and tail translation dragging as well as removing and animating vector back to the creator.
 *
 * @author Martin Veillette
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Multilink from '../../../../axon/js/Multilink.js';
import Vector2Property from '../../../../dot/js/Vector2Property.js';
import { Shape } from '../../../../kite/js/imports.js';
import merge from '../../../../phet-core/js/merge.js';
import ArrowNode from '../../../../scenery-phet/js/ArrowNode.js';
import { Color, DragListener, Path } from '../../../../scenery/js/imports.js';
import vectorAddition from '../../vectorAddition.js';
import VectorAdditionConstants from '../VectorAdditionConstants.js';
import RootVectorNode from './RootVectorNode.js';
import VectorAngleNode from './VectorAngleNode.js';
import optionize, { combineOptions } from '../../../../phet-core/js/optionize.js';
// constants

// options for the vector shadow
const SHADOW_OPTIONS = merge({}, VectorAdditionConstants.VECTOR_ARROW_OPTIONS, {
  fill: Color.BLACK,
  opacity: 0.28
});

// offsets for vector shadow in view coordinates
const SHADOW_OFFSET_X = 3.2;
const SHADOW_OFFSET_Y = 2.1;
export default class VectorNode extends RootVectorNode {
  // for translating the vector

  constructor(vector, graph, valuesVisibleProperty, angleVisibleProperty, providedOptions) {
    const options = optionize()({
      // RootVectorNodeOptions
      arrowOptions: combineOptions({}, VectorAdditionConstants.VECTOR_ARROW_OPTIONS, {
        cursor: 'move',
        fill: vector.vectorColorPalette.mainFill,
        stroke: vector.vectorColorPalette.mainStroke
      })
    }, providedOptions);

    // To improve readability
    const headWidth = options.arrowOptions.headWidth;
    assert && assert(headWidth !== undefined);
    const headHeight = options.arrowOptions.headHeight;
    assert && assert(headHeight !== undefined);
    const fractionalHeadHeight = options.arrowOptions.fractionalHeadHeight;
    assert && assert(fractionalHeadHeight !== undefined);
    const cursor = options.arrowOptions.cursor;
    assert && assert(cursor);
    super(vector, graph.modelViewTransformProperty, valuesVisibleProperty, graph.activeVectorProperty, options);
    this.modelViewTransformProperty = graph.modelViewTransformProperty;
    this.vector = vector;

    //----------------------------------------------------------------------------------------
    // Create Nodes
    //----------------------------------------------------------------------------------------

    // Since the tail is (0, 0) for the view, the tip is the delta position of the tip
    const tipDeltaPosition = this.modelViewTransformProperty.value.modelToViewDelta(vector.vectorComponents);

    // Create a scenery node representing the arc of an angle and the numerical display of the angle.
    // dispose is necessary because it observes angleVisibleProperty.
    const angleNode = new VectorAngleNode(vector, angleVisibleProperty, graph.modelViewTransformProperty);

    // Create a shadow for the vector, visible when the vector is being dragged around off the graph.
    const vectorShadowNode = new ArrowNode(0, 0, tipDeltaPosition.x, tipDeltaPosition.y, SHADOW_OPTIONS);

    // Reconfigure scene graph z-layering
    this.setChildren([vectorShadowNode, this.arrowNode, angleNode, this.labelNode]);

    //----------------------------------------------------------------------------------------
    // Handle vector translation
    //----------------------------------------------------------------------------------------

    // Create a Property for the position of the tail of the vector. Used for the tail drag listener.
    const tailPositionProperty = new Vector2Property(this.modelViewTransformProperty.value.modelToViewPosition(vector.tail));
    this.translationDragListener = new DragListener({
      pressCursor: cursor,
      targetNode: this,
      positionProperty: tailPositionProperty,
      start: () => {
        assert && assert(!this.vector.animateBackProperty.value && !this.vector.inProgressAnimation, 'body drag listener should be removed when the vector is animating back.');
        if (vector.isOnGraphProperty.value) {
          graph.activeVectorProperty.value = vector;
        }
      },
      end: () => {
        assert && assert(!this.vector.animateBackProperty.value && !this.vector.inProgressAnimation, 'body drag listener should be removed when the vector is animating back.');

        // Determine whether to drop the vector on the graph, or animate the vector back to the toolbox.
        if (!this.vector.isOnGraphProperty.value) {
          // Get the cursor position as this determines whether the vector is destined for the graph or toolbox.
          // See https://github.com/phetsims/vector-addition/issues/50
          const cursorPosition = this.modelViewTransformProperty.value.viewToModelDelta(this.translationDragListener.localPoint).plus(this.vector.tail);

          // If the cursor is on the graph, drop the vector on the graph
          if (graph.graphModelBounds.containsPoint(cursorPosition)) {
            // Drop the vector where the shadow was positioned
            const shadowOffset = this.modelViewTransformProperty.value.viewToModelDelta(vectorShadowNode.center).minus(vector.vectorComponents.timesScalar(0.5));
            const shadowTailPosition = vector.tail.plus(shadowOffset);
            this.vector.dropOntoGraph(shadowTailPosition);
          } else {
            // otherwise, animate the vector back
            this.vector.animateBackProperty.value = true;
          }
        }
      }
    });

    // The body can be translated by the arrow or the label. removeInputListener is required on dispose.
    this.arrowNode.addInputListener(this.translationDragListener);
    this.labelNode.addInputListener(this.translationDragListener);

    // Translate when the vector's tail position changes. unlink is required on dispose.
    const tailListener = tailPositionView => {
      this.updateTailPosition(tailPositionView);
      if (vector.isRemovable) {
        const tailPositionModel = this.modelViewTransformProperty.value.viewToModelPosition(tailPositionView);
        const cursorPositionModel = this.modelViewTransformProperty.value.viewToModelDelta(this.translationDragListener.localPoint).plus(tailPositionModel);
        if (vector.isOnGraphProperty.value && !graph.graphModelBounds.containsPoint(cursorPositionModel)) {
          vector.popOffOfGraph();
        }
      }
    };
    tailPositionProperty.lazyLink(tailListener);

    // dispose of things related to vector translation
    const disposeTranslate = () => {
      this.arrowNode.removeInputListener(this.translationDragListener);
      this.labelNode.removeInputListener(this.translationDragListener);
      this.translationDragListener.dispose();
      tailPositionProperty.unlink(tailListener);
    };

    //----------------------------------------------------------------------------------------
    // Handle vector scaling & rotation
    //----------------------------------------------------------------------------------------

    let disposeScaleRotate;
    if (vector.isTipDraggable) {
      // Create an invisible triangle at the head of the vector.
      const headShape = new Shape().moveTo(0, 0).lineTo(-headHeight, -headWidth / 2).lineTo(-headHeight, headWidth / 2).close();
      const headNode = new Path(headShape, {
        stroke: phet.chipper.queryParameters.dev ? 'red' : null,
        cursor: 'pointer'
      });
      this.addChild(headNode);

      // Position of the tip of the vector, relative to the tail.
      const tipPositionProperty = new Vector2Property(tipDeltaPosition);

      // Drag listener to scale/rotate the vector, attached to the invisible head.
      const scaleRotateDragListener = new DragListener({
        targetNode: headNode,
        positionProperty: tipPositionProperty,
        start: () => {
          assert && assert(!this.vector.animateBackProperty.value && !this.vector.inProgressAnimation, 'tip drag listener should be removed when the vector is animating back.');
          graph.activeVectorProperty.value = vector;
        }
      });
      headNode.addInputListener(scaleRotateDragListener);

      // Move the tip to match the vector model. unlink is required on dispose.
      const tipListener = tipPosition => this.updateTipPosition(tipPosition);
      tipPositionProperty.lazyLink(tipListener);

      // Pointer area shapes for the head, in 3 different sizes.
      // A pair of these is used, based on the magnitude of the vector and whether its head is scale.
      // See below and https://github.com/phetsims/vector-addition/issues/240#issuecomment-544682818
      const largeMouseAreaShape = headShape.getOffsetShape(VectorAdditionConstants.VECTOR_HEAD_MOUSE_AREA_DILATION);
      const largeTouchAreaShape = headShape.getOffsetShape(VectorAdditionConstants.VECTOR_HEAD_TOUCH_AREA_DILATION);
      const mediumMouseAreaShape = createDilatedHead(headWidth, headHeight, VectorAdditionConstants.VECTOR_HEAD_MOUSE_AREA_DILATION);
      const mediumTouchAreaShape = createDilatedHead(headWidth, headHeight, VectorAdditionConstants.VECTOR_HEAD_TOUCH_AREA_DILATION);
      const SMALL_HEAD_SCALE = 0.65; // determined empirically
      const smallMouseAreaShape = createDilatedHead(headWidth, SMALL_HEAD_SCALE * headHeight, VectorAdditionConstants.VECTOR_HEAD_MOUSE_AREA_DILATION);
      const smallTouchAreaShape = createDilatedHead(headWidth, SMALL_HEAD_SCALE * headHeight, VectorAdditionConstants.VECTOR_HEAD_TOUCH_AREA_DILATION);

      // When the vector changes, transform the head and adjust its pointer areas. unlinked is required when disposed.
      const vectorComponentsListener = vectorComponents => {
        // Adjust pointer areas. See https://github.com/phetsims/vector-addition/issues/240#issuecomment-544682818
        const SHORT_MAGNITUDE = 3;
        if (vectorComponents.magnitude <= SHORT_MAGNITUDE) {
          // We have a 'short' vector, so adjust the head's pointer areas so that the tail can still be grabbed.
          const viewComponents = this.modelViewTransformProperty.value.modelToViewDelta(vector.vectorComponents);
          const viewMagnitude = viewComponents.magnitude;
          const maxHeadHeight = fractionalHeadHeight * viewMagnitude;
          if (headHeight > maxHeadHeight) {
            // head is scaled (see ArrowNode fractionalHeadHeight), use small pointer areas
            headNode.mouseArea = smallMouseAreaShape;
            headNode.touchArea = smallTouchAreaShape;
          } else {
            // head is not scaled, use medium pointer areas
            headNode.mouseArea = mediumMouseAreaShape;
            headNode.touchArea = mediumTouchAreaShape;
          }
        } else {
          // We have a 'long' vector, so use the large pointer areas.
          headNode.mouseArea = largeMouseAreaShape;
          headNode.touchArea = largeTouchAreaShape;
        }

        // Transform the invisible head to match the position and angle of the actual vector.
        headNode.translation = this.modelViewTransformProperty.value.modelToViewDelta(vector.vectorComponents);
        headNode.rotation = -vectorComponents.angle;
      };
      vector.vectorComponentsProperty.link(vectorComponentsListener);

      // dispose of things that are related to optional scale/rotate
      disposeScaleRotate = () => {
        headNode.removeInputListener(scaleRotateDragListener);
        tipPositionProperty.unlink(tipListener);
        vector.vectorComponentsProperty.unlink(vectorComponentsListener);
      };
    }

    //----------------------------------------------------------------------------------------
    // Appearance
    //----------------------------------------------------------------------------------------

    // Update the appearance of the vector's shadow. Must be unmultilinked.
    const shadowMultilink = Multilink.multilink([vector.isOnGraphProperty, vector.vectorComponentsProperty, this.vector.animateBackProperty], (isOnGraph, vectorComponents, animateBack) => {
      vectorShadowNode.visible = !animateBack && !isOnGraph;
      vectorShadowNode.resetTransform();
      if (!isOnGraph && vectorShadowNode.getBounds().isValid()) {
        vectorShadowNode.left = this.arrowNode.left + SHADOW_OFFSET_X;
        vectorShadowNode.top = this.arrowNode.top + SHADOW_OFFSET_Y;
      }
      const tipDeltaPosition = this.modelViewTransformProperty.value.modelToViewDelta(vectorComponents);
      vectorShadowNode.setTip(tipDeltaPosition.x, tipDeltaPosition.y);
    });

    // Show the vector's label when it's on the graph. Must be unlinked.
    const isOnGraphListener = isOnGraph => this.labelNode.visible = isOnGraph;
    vector.isOnGraphProperty.link(isOnGraphListener);

    // Highlight the vector's label when it is selected. Must be unlinked.
    const activeVectorListener = activeVector => {
      this.labelNode.setHighlighted(activeVector === vector);
    };
    graph.activeVectorProperty.link(activeVectorListener);

    // Disable interaction when the vector is animating back to the toolbox, where it will be disposed.
    // unlink is required on dispose.
    const animateBackListener = animateBack => {
      if (animateBack) {
        this.interruptSubtreeInput();
        this.pickable = false;
        this.cursor = 'default';
      }
    };
    this.vector.animateBackProperty.lazyLink(animateBackListener);
    this.disposeVectorNode = () => {
      // Dispose of nodes
      angleNode.dispose();

      // Dispose of transform handling
      disposeTranslate();
      disposeScaleRotate && disposeScaleRotate();

      // Dispose of appearance-related listeners
      Multilink.unmultilink(shadowMultilink);
      vector.isOnGraphProperty.unlink(isOnGraphListener);
      graph.activeVectorProperty.unlink(activeVectorListener);
      this.vector.animateBackProperty.unlink(animateBackListener);
    };
  }
  dispose() {
    this.disposeVectorNode();
    super.dispose();
  }

  /**
   * Updates the vector model, which will then round the new position depending on the coordinate snap mode
   * @param tipPositionView - the drag listener position
   */
  updateTipPosition(tipPositionView) {
    assert && assert(!this.vector.animateBackProperty.value && !this.vector.inProgressAnimation, 'Cannot drag tip when animating back');
    const tipPositionModel = this.vector.tail.plus(this.modelViewTransformProperty.value.viewToModelDelta(tipPositionView));
    this.vector.moveTipToPosition(tipPositionModel);
  }

  /**
   * Updates the model vector's tail position. Called when the vector is being translated.
   */
  updateTailPosition(tailPositionView) {
    assert && assert(!this.vector.animateBackProperty.value && !this.vector.inProgressAnimation, 'Cannot drag tail when animating back');
    const tailPositionModel = this.modelViewTransformProperty.value.viewToModelPosition(tailPositionView);
    if (!this.vector.isOnGraphProperty.value) {
      // Allow translation to anywhere if it isn't on the graph
      this.vector.moveToTailPosition(tailPositionModel);
    } else {
      // Update the model tail position, subject to symmetric rounding, and fit inside the graph bounds
      this.vector.moveTailToPosition(tailPositionModel);
    }
  }

  /**
   * Forwards an event to translationDragListener. Used for dragging vectors out of the toolbox.
   */
  forwardEvent(event) {
    this.translationDragListener.press(event, this);
  }
}

/**
 * Creates a (rough) dilated shape for a vector head.  The head is pointing to the right.
 */
function createDilatedHead(headWidth, headHeight, dilation) {
  // Starting from the upper left and moving clockwise
  return new Shape().moveTo(-headHeight, -headHeight / 2 - dilation).lineTo(0, -dilation).lineTo(dilation, 0).lineTo(0, dilation).lineTo(-headHeight, headWidth / 2 + dilation).close();
}
vectorAddition.register('VectorNode', VectorNode);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNdWx0aWxpbmsiLCJWZWN0b3IyUHJvcGVydHkiLCJTaGFwZSIsIm1lcmdlIiwiQXJyb3dOb2RlIiwiQ29sb3IiLCJEcmFnTGlzdGVuZXIiLCJQYXRoIiwidmVjdG9yQWRkaXRpb24iLCJWZWN0b3JBZGRpdGlvbkNvbnN0YW50cyIsIlJvb3RWZWN0b3JOb2RlIiwiVmVjdG9yQW5nbGVOb2RlIiwib3B0aW9uaXplIiwiY29tYmluZU9wdGlvbnMiLCJTSEFET1dfT1BUSU9OUyIsIlZFQ1RPUl9BUlJPV19PUFRJT05TIiwiZmlsbCIsIkJMQUNLIiwib3BhY2l0eSIsIlNIQURPV19PRkZTRVRfWCIsIlNIQURPV19PRkZTRVRfWSIsIlZlY3Rvck5vZGUiLCJjb25zdHJ1Y3RvciIsInZlY3RvciIsImdyYXBoIiwidmFsdWVzVmlzaWJsZVByb3BlcnR5IiwiYW5nbGVWaXNpYmxlUHJvcGVydHkiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwiYXJyb3dPcHRpb25zIiwiY3Vyc29yIiwidmVjdG9yQ29sb3JQYWxldHRlIiwibWFpbkZpbGwiLCJzdHJva2UiLCJtYWluU3Ryb2tlIiwiaGVhZFdpZHRoIiwiYXNzZXJ0IiwidW5kZWZpbmVkIiwiaGVhZEhlaWdodCIsImZyYWN0aW9uYWxIZWFkSGVpZ2h0IiwibW9kZWxWaWV3VHJhbnNmb3JtUHJvcGVydHkiLCJhY3RpdmVWZWN0b3JQcm9wZXJ0eSIsInRpcERlbHRhUG9zaXRpb24iLCJ2YWx1ZSIsIm1vZGVsVG9WaWV3RGVsdGEiLCJ2ZWN0b3JDb21wb25lbnRzIiwiYW5nbGVOb2RlIiwidmVjdG9yU2hhZG93Tm9kZSIsIngiLCJ5Iiwic2V0Q2hpbGRyZW4iLCJhcnJvd05vZGUiLCJsYWJlbE5vZGUiLCJ0YWlsUG9zaXRpb25Qcm9wZXJ0eSIsIm1vZGVsVG9WaWV3UG9zaXRpb24iLCJ0YWlsIiwidHJhbnNsYXRpb25EcmFnTGlzdGVuZXIiLCJwcmVzc0N1cnNvciIsInRhcmdldE5vZGUiLCJwb3NpdGlvblByb3BlcnR5Iiwic3RhcnQiLCJhbmltYXRlQmFja1Byb3BlcnR5IiwiaW5Qcm9ncmVzc0FuaW1hdGlvbiIsImlzT25HcmFwaFByb3BlcnR5IiwiZW5kIiwiY3Vyc29yUG9zaXRpb24iLCJ2aWV3VG9Nb2RlbERlbHRhIiwibG9jYWxQb2ludCIsInBsdXMiLCJncmFwaE1vZGVsQm91bmRzIiwiY29udGFpbnNQb2ludCIsInNoYWRvd09mZnNldCIsImNlbnRlciIsIm1pbnVzIiwidGltZXNTY2FsYXIiLCJzaGFkb3dUYWlsUG9zaXRpb24iLCJkcm9wT250b0dyYXBoIiwiYWRkSW5wdXRMaXN0ZW5lciIsInRhaWxMaXN0ZW5lciIsInRhaWxQb3NpdGlvblZpZXciLCJ1cGRhdGVUYWlsUG9zaXRpb24iLCJpc1JlbW92YWJsZSIsInRhaWxQb3NpdGlvbk1vZGVsIiwidmlld1RvTW9kZWxQb3NpdGlvbiIsImN1cnNvclBvc2l0aW9uTW9kZWwiLCJwb3BPZmZPZkdyYXBoIiwibGF6eUxpbmsiLCJkaXNwb3NlVHJhbnNsYXRlIiwicmVtb3ZlSW5wdXRMaXN0ZW5lciIsImRpc3Bvc2UiLCJ1bmxpbmsiLCJkaXNwb3NlU2NhbGVSb3RhdGUiLCJpc1RpcERyYWdnYWJsZSIsImhlYWRTaGFwZSIsIm1vdmVUbyIsImxpbmVUbyIsImNsb3NlIiwiaGVhZE5vZGUiLCJwaGV0IiwiY2hpcHBlciIsInF1ZXJ5UGFyYW1ldGVycyIsImRldiIsImFkZENoaWxkIiwidGlwUG9zaXRpb25Qcm9wZXJ0eSIsInNjYWxlUm90YXRlRHJhZ0xpc3RlbmVyIiwidGlwTGlzdGVuZXIiLCJ0aXBQb3NpdGlvbiIsInVwZGF0ZVRpcFBvc2l0aW9uIiwibGFyZ2VNb3VzZUFyZWFTaGFwZSIsImdldE9mZnNldFNoYXBlIiwiVkVDVE9SX0hFQURfTU9VU0VfQVJFQV9ESUxBVElPTiIsImxhcmdlVG91Y2hBcmVhU2hhcGUiLCJWRUNUT1JfSEVBRF9UT1VDSF9BUkVBX0RJTEFUSU9OIiwibWVkaXVtTW91c2VBcmVhU2hhcGUiLCJjcmVhdGVEaWxhdGVkSGVhZCIsIm1lZGl1bVRvdWNoQXJlYVNoYXBlIiwiU01BTExfSEVBRF9TQ0FMRSIsInNtYWxsTW91c2VBcmVhU2hhcGUiLCJzbWFsbFRvdWNoQXJlYVNoYXBlIiwidmVjdG9yQ29tcG9uZW50c0xpc3RlbmVyIiwiU0hPUlRfTUFHTklUVURFIiwibWFnbml0dWRlIiwidmlld0NvbXBvbmVudHMiLCJ2aWV3TWFnbml0dWRlIiwibWF4SGVhZEhlaWdodCIsIm1vdXNlQXJlYSIsInRvdWNoQXJlYSIsInRyYW5zbGF0aW9uIiwicm90YXRpb24iLCJhbmdsZSIsInZlY3RvckNvbXBvbmVudHNQcm9wZXJ0eSIsImxpbmsiLCJzaGFkb3dNdWx0aWxpbmsiLCJtdWx0aWxpbmsiLCJpc09uR3JhcGgiLCJhbmltYXRlQmFjayIsInZpc2libGUiLCJyZXNldFRyYW5zZm9ybSIsImdldEJvdW5kcyIsImlzVmFsaWQiLCJsZWZ0IiwidG9wIiwic2V0VGlwIiwiaXNPbkdyYXBoTGlzdGVuZXIiLCJhY3RpdmVWZWN0b3JMaXN0ZW5lciIsImFjdGl2ZVZlY3RvciIsInNldEhpZ2hsaWdodGVkIiwiYW5pbWF0ZUJhY2tMaXN0ZW5lciIsImludGVycnVwdFN1YnRyZWVJbnB1dCIsInBpY2thYmxlIiwiZGlzcG9zZVZlY3Rvck5vZGUiLCJ1bm11bHRpbGluayIsInRpcFBvc2l0aW9uVmlldyIsInRpcFBvc2l0aW9uTW9kZWwiLCJtb3ZlVGlwVG9Qb3NpdGlvbiIsIm1vdmVUb1RhaWxQb3NpdGlvbiIsIm1vdmVUYWlsVG9Qb3NpdGlvbiIsImZvcndhcmRFdmVudCIsImV2ZW50IiwicHJlc3MiLCJkaWxhdGlvbiIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiVmVjdG9yTm9kZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOS0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBWaWV3IGZvciB0aGUgdmVjdG9ycyB0aGF0IGFyZSBkcmFnZ2VkIG9udG8gdGhlIGdyYXBoLiBUaGVzZSB2ZWN0b3JzIGFyZSBjcmVhdGVkIGluIFZlY3RvckNyZWF0b3JQYW5lbFNsb3QuanMgYW5kXHJcbiAqIHN1cHBvcnQgdGlwIGRyYWdnaW5nIGFuZCB0YWlsIHRyYW5zbGF0aW9uIGRyYWdnaW5nIGFzIHdlbGwgYXMgcmVtb3ZpbmcgYW5kIGFuaW1hdGluZyB2ZWN0b3IgYmFjayB0byB0aGUgY3JlYXRvci5cclxuICpcclxuICogQGF1dGhvciBNYXJ0aW4gVmVpbGxldHRlXHJcbiAqIEBhdXRob3IgQ2hyaXMgTWFsbGV5IChQaXhlbFpvb20sIEluYy4pXHJcbiAqL1xyXG5cclxuaW1wb3J0IE11bHRpbGluayBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL011bHRpbGluay5qcyc7XHJcbmltcG9ydCBWZWN0b3IyUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL1ZlY3RvcjJQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCB7IFNoYXBlIH0gZnJvbSAnLi4vLi4vLi4vLi4va2l0ZS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IG1lcmdlIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9tZXJnZS5qcyc7XHJcbmltcG9ydCBBcnJvd05vZGUgZnJvbSAnLi4vLi4vLi4vLi4vc2NlbmVyeS1waGV0L2pzL0Fycm93Tm9kZS5qcyc7XHJcbmltcG9ydCB7IENvbG9yLCBEcmFnTGlzdGVuZXIsIFBhdGgsIFByZXNzTGlzdGVuZXJFdmVudCB9IGZyb20gJy4uLy4uLy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCB2ZWN0b3JBZGRpdGlvbiBmcm9tICcuLi8uLi92ZWN0b3JBZGRpdGlvbi5qcyc7XHJcbmltcG9ydCBHcmFwaCBmcm9tICcuLi9tb2RlbC9HcmFwaC5qcyc7XHJcbmltcG9ydCBWZWN0b3IgZnJvbSAnLi4vbW9kZWwvVmVjdG9yLmpzJztcclxuaW1wb3J0IFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzIGZyb20gJy4uL1ZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLmpzJztcclxuaW1wb3J0IFJvb3RWZWN0b3JOb2RlLCB7IFJvb3RWZWN0b3JBcnJvd05vZGVPcHRpb25zLCBSb290VmVjdG9yTm9kZU9wdGlvbnMgfSBmcm9tICcuL1Jvb3RWZWN0b3JOb2RlLmpzJztcclxuaW1wb3J0IFZlY3RvckFuZ2xlTm9kZSBmcm9tICcuL1ZlY3RvckFuZ2xlTm9kZS5qcyc7XHJcbmltcG9ydCBUUmVhZE9ubHlQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBjb21iaW5lT3B0aW9ucywgRW1wdHlTZWxmT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgTW9kZWxWaWV3VHJhbnNmb3JtMiBmcm9tICcuLi8uLi8uLi8uLi9waGV0Y29tbW9uL2pzL3ZpZXcvTW9kZWxWaWV3VHJhbnNmb3JtMi5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuXHJcbi8vIGNvbnN0YW50c1xyXG5cclxuLy8gb3B0aW9ucyBmb3IgdGhlIHZlY3RvciBzaGFkb3dcclxuY29uc3QgU0hBRE9XX09QVElPTlMgPSBtZXJnZSgge30sIFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLlZFQ1RPUl9BUlJPV19PUFRJT05TLCB7XHJcbiAgZmlsbDogQ29sb3IuQkxBQ0ssXHJcbiAgb3BhY2l0eTogMC4yOFxyXG59ICk7XHJcblxyXG4vLyBvZmZzZXRzIGZvciB2ZWN0b3Igc2hhZG93IGluIHZpZXcgY29vcmRpbmF0ZXNcclxuY29uc3QgU0hBRE9XX09GRlNFVF9YID0gMy4yO1xyXG5jb25zdCBTSEFET1dfT0ZGU0VUX1kgPSAyLjE7XHJcblxyXG50eXBlIFNlbGZPcHRpb25zID0gRW1wdHlTZWxmT3B0aW9ucztcclxuZXhwb3J0IHR5cGUgVmVjdG9yTm9kZU9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIFJvb3RWZWN0b3JOb2RlT3B0aW9ucztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFZlY3Rvck5vZGUgZXh0ZW5kcyBSb290VmVjdG9yTm9kZSB7XHJcblxyXG4gIHB1YmxpYyByZWFkb25seSB2ZWN0b3I6IFZlY3RvcjtcclxuICBwcml2YXRlIHJlYWRvbmx5IG1vZGVsVmlld1RyYW5zZm9ybVByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxNb2RlbFZpZXdUcmFuc2Zvcm0yPjtcclxuICBwcml2YXRlIHJlYWRvbmx5IHRyYW5zbGF0aW9uRHJhZ0xpc3RlbmVyOiBEcmFnTGlzdGVuZXI7IC8vIGZvciB0cmFuc2xhdGluZyB0aGUgdmVjdG9yXHJcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNwb3NlVmVjdG9yTm9kZTogKCkgPT4gdm9pZDtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCB2ZWN0b3I6IFZlY3RvciwgZ3JhcGg6IEdyYXBoLCB2YWx1ZXNWaXNpYmxlUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+LFxyXG4gICAgICAgICAgICAgICAgICAgICAgYW5nbGVWaXNpYmxlUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+LCBwcm92aWRlZE9wdGlvbnM/OiBWZWN0b3JOb2RlT3B0aW9ucyApIHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPFZlY3Rvck5vZGVPcHRpb25zLCBTZWxmT3B0aW9ucywgUm9vdFZlY3Rvck5vZGVPcHRpb25zPigpKCB7XHJcblxyXG4gICAgICAvLyBSb290VmVjdG9yTm9kZU9wdGlvbnNcclxuICAgICAgYXJyb3dPcHRpb25zOiBjb21iaW5lT3B0aW9uczxSb290VmVjdG9yQXJyb3dOb2RlT3B0aW9ucz4oXHJcbiAgICAgICAge30sIFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLlZFQ1RPUl9BUlJPV19PUFRJT05TLCB7XHJcbiAgICAgICAgICBjdXJzb3I6ICdtb3ZlJyxcclxuICAgICAgICAgIGZpbGw6IHZlY3Rvci52ZWN0b3JDb2xvclBhbGV0dGUubWFpbkZpbGwsXHJcbiAgICAgICAgICBzdHJva2U6IHZlY3Rvci52ZWN0b3JDb2xvclBhbGV0dGUubWFpblN0cm9rZVxyXG4gICAgICAgIH0gKVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgLy8gVG8gaW1wcm92ZSByZWFkYWJpbGl0eVxyXG4gICAgY29uc3QgaGVhZFdpZHRoID0gb3B0aW9ucy5hcnJvd09wdGlvbnMuaGVhZFdpZHRoITtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGhlYWRXaWR0aCAhPT0gdW5kZWZpbmVkICk7XHJcbiAgICBjb25zdCBoZWFkSGVpZ2h0ID0gb3B0aW9ucy5hcnJvd09wdGlvbnMuaGVhZEhlaWdodCE7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBoZWFkSGVpZ2h0ICE9PSB1bmRlZmluZWQgKTtcclxuICAgIGNvbnN0IGZyYWN0aW9uYWxIZWFkSGVpZ2h0ID0gb3B0aW9ucy5hcnJvd09wdGlvbnMuZnJhY3Rpb25hbEhlYWRIZWlnaHQhO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggZnJhY3Rpb25hbEhlYWRIZWlnaHQgIT09IHVuZGVmaW5lZCApO1xyXG4gICAgY29uc3QgY3Vyc29yID0gb3B0aW9ucy5hcnJvd09wdGlvbnMuY3Vyc29yITtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGN1cnNvciApO1xyXG5cclxuICAgIHN1cGVyKCB2ZWN0b3IsXHJcbiAgICAgIGdyYXBoLm1vZGVsVmlld1RyYW5zZm9ybVByb3BlcnR5LFxyXG4gICAgICB2YWx1ZXNWaXNpYmxlUHJvcGVydHksXHJcbiAgICAgIGdyYXBoLmFjdGl2ZVZlY3RvclByb3BlcnR5LFxyXG4gICAgICBvcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy5tb2RlbFZpZXdUcmFuc2Zvcm1Qcm9wZXJ0eSA9IGdyYXBoLm1vZGVsVmlld1RyYW5zZm9ybVByb3BlcnR5O1xyXG4gICAgdGhpcy52ZWN0b3IgPSB2ZWN0b3I7XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBDcmVhdGUgTm9kZXNcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIC8vIFNpbmNlIHRoZSB0YWlsIGlzICgwLCAwKSBmb3IgdGhlIHZpZXcsIHRoZSB0aXAgaXMgdGhlIGRlbHRhIHBvc2l0aW9uIG9mIHRoZSB0aXBcclxuICAgIGNvbnN0IHRpcERlbHRhUG9zaXRpb24gPSB0aGlzLm1vZGVsVmlld1RyYW5zZm9ybVByb3BlcnR5LnZhbHVlLm1vZGVsVG9WaWV3RGVsdGEoIHZlY3Rvci52ZWN0b3JDb21wb25lbnRzICk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGEgc2NlbmVyeSBub2RlIHJlcHJlc2VudGluZyB0aGUgYXJjIG9mIGFuIGFuZ2xlIGFuZCB0aGUgbnVtZXJpY2FsIGRpc3BsYXkgb2YgdGhlIGFuZ2xlLlxyXG4gICAgLy8gZGlzcG9zZSBpcyBuZWNlc3NhcnkgYmVjYXVzZSBpdCBvYnNlcnZlcyBhbmdsZVZpc2libGVQcm9wZXJ0eS5cclxuICAgIGNvbnN0IGFuZ2xlTm9kZSA9IG5ldyBWZWN0b3JBbmdsZU5vZGUoIHZlY3RvciwgYW5nbGVWaXNpYmxlUHJvcGVydHksIGdyYXBoLm1vZGVsVmlld1RyYW5zZm9ybVByb3BlcnR5ICk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGEgc2hhZG93IGZvciB0aGUgdmVjdG9yLCB2aXNpYmxlIHdoZW4gdGhlIHZlY3RvciBpcyBiZWluZyBkcmFnZ2VkIGFyb3VuZCBvZmYgdGhlIGdyYXBoLlxyXG4gICAgY29uc3QgdmVjdG9yU2hhZG93Tm9kZSA9IG5ldyBBcnJvd05vZGUoIDAsIDAsIHRpcERlbHRhUG9zaXRpb24ueCwgdGlwRGVsdGFQb3NpdGlvbi55LCBTSEFET1dfT1BUSU9OUyApO1xyXG5cclxuICAgIC8vIFJlY29uZmlndXJlIHNjZW5lIGdyYXBoIHotbGF5ZXJpbmdcclxuICAgIHRoaXMuc2V0Q2hpbGRyZW4oIFsgdmVjdG9yU2hhZG93Tm9kZSwgdGhpcy5hcnJvd05vZGUsIGFuZ2xlTm9kZSwgdGhpcy5sYWJlbE5vZGUgXSApO1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gSGFuZGxlIHZlY3RvciB0cmFuc2xhdGlvblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgLy8gQ3JlYXRlIGEgUHJvcGVydHkgZm9yIHRoZSBwb3NpdGlvbiBvZiB0aGUgdGFpbCBvZiB0aGUgdmVjdG9yLiBVc2VkIGZvciB0aGUgdGFpbCBkcmFnIGxpc3RlbmVyLlxyXG4gICAgY29uc3QgdGFpbFBvc2l0aW9uUHJvcGVydHkgPSBuZXcgVmVjdG9yMlByb3BlcnR5KCB0aGlzLm1vZGVsVmlld1RyYW5zZm9ybVByb3BlcnR5LnZhbHVlLm1vZGVsVG9WaWV3UG9zaXRpb24oXHJcbiAgICAgIHZlY3Rvci50YWlsICkgKTtcclxuXHJcbiAgICB0aGlzLnRyYW5zbGF0aW9uRHJhZ0xpc3RlbmVyID0gbmV3IERyYWdMaXN0ZW5lcigge1xyXG4gICAgICBwcmVzc0N1cnNvcjogY3Vyc29yLFxyXG4gICAgICB0YXJnZXROb2RlOiB0aGlzLFxyXG4gICAgICBwb3NpdGlvblByb3BlcnR5OiB0YWlsUG9zaXRpb25Qcm9wZXJ0eSxcclxuXHJcbiAgICAgIHN0YXJ0OiAoKSA9PiB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMudmVjdG9yLmFuaW1hdGVCYWNrUHJvcGVydHkudmFsdWUgJiYgIXRoaXMudmVjdG9yLmluUHJvZ3Jlc3NBbmltYXRpb24sXHJcbiAgICAgICAgICAnYm9keSBkcmFnIGxpc3RlbmVyIHNob3VsZCBiZSByZW1vdmVkIHdoZW4gdGhlIHZlY3RvciBpcyBhbmltYXRpbmcgYmFjay4nICk7XHJcbiAgICAgICAgaWYgKCB2ZWN0b3IuaXNPbkdyYXBoUHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgICAgICBncmFwaC5hY3RpdmVWZWN0b3JQcm9wZXJ0eS52YWx1ZSA9IHZlY3RvcjtcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBlbmQ6ICgpID0+IHtcclxuXHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMudmVjdG9yLmFuaW1hdGVCYWNrUHJvcGVydHkudmFsdWUgJiYgIXRoaXMudmVjdG9yLmluUHJvZ3Jlc3NBbmltYXRpb24sXHJcbiAgICAgICAgICAnYm9keSBkcmFnIGxpc3RlbmVyIHNob3VsZCBiZSByZW1vdmVkIHdoZW4gdGhlIHZlY3RvciBpcyBhbmltYXRpbmcgYmFjay4nICk7XHJcblxyXG4gICAgICAgIC8vIERldGVybWluZSB3aGV0aGVyIHRvIGRyb3AgdGhlIHZlY3RvciBvbiB0aGUgZ3JhcGgsIG9yIGFuaW1hdGUgdGhlIHZlY3RvciBiYWNrIHRvIHRoZSB0b29sYm94LlxyXG4gICAgICAgIGlmICggIXRoaXMudmVjdG9yLmlzT25HcmFwaFByb3BlcnR5LnZhbHVlICkge1xyXG5cclxuICAgICAgICAgIC8vIEdldCB0aGUgY3Vyc29yIHBvc2l0aW9uIGFzIHRoaXMgZGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSB2ZWN0b3IgaXMgZGVzdGluZWQgZm9yIHRoZSBncmFwaCBvciB0b29sYm94LlxyXG4gICAgICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy92ZWN0b3ItYWRkaXRpb24vaXNzdWVzLzUwXHJcbiAgICAgICAgICBjb25zdCBjdXJzb3JQb3NpdGlvbiA9IHRoaXMubW9kZWxWaWV3VHJhbnNmb3JtUHJvcGVydHkudmFsdWVcclxuICAgICAgICAgICAgLnZpZXdUb01vZGVsRGVsdGEoIHRoaXMudHJhbnNsYXRpb25EcmFnTGlzdGVuZXIubG9jYWxQb2ludCApLnBsdXMoIHRoaXMudmVjdG9yLnRhaWwgKTtcclxuXHJcbiAgICAgICAgICAvLyBJZiB0aGUgY3Vyc29yIGlzIG9uIHRoZSBncmFwaCwgZHJvcCB0aGUgdmVjdG9yIG9uIHRoZSBncmFwaFxyXG4gICAgICAgICAgaWYgKCBncmFwaC5ncmFwaE1vZGVsQm91bmRzLmNvbnRhaW5zUG9pbnQoIGN1cnNvclBvc2l0aW9uICkgKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBEcm9wIHRoZSB2ZWN0b3Igd2hlcmUgdGhlIHNoYWRvdyB3YXMgcG9zaXRpb25lZFxyXG4gICAgICAgICAgICBjb25zdCBzaGFkb3dPZmZzZXQgPSB0aGlzLm1vZGVsVmlld1RyYW5zZm9ybVByb3BlcnR5LnZhbHVlLnZpZXdUb01vZGVsRGVsdGEoIHZlY3RvclNoYWRvd05vZGUuY2VudGVyIClcclxuICAgICAgICAgICAgICAubWludXMoIHZlY3Rvci52ZWN0b3JDb21wb25lbnRzLnRpbWVzU2NhbGFyKCAwLjUgKSApO1xyXG4gICAgICAgICAgICBjb25zdCBzaGFkb3dUYWlsUG9zaXRpb24gPSB2ZWN0b3IudGFpbC5wbHVzKCBzaGFkb3dPZmZzZXQgKTtcclxuICAgICAgICAgICAgdGhpcy52ZWN0b3IuZHJvcE9udG9HcmFwaCggc2hhZG93VGFpbFBvc2l0aW9uICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgYW5pbWF0ZSB0aGUgdmVjdG9yIGJhY2tcclxuICAgICAgICAgICAgdGhpcy52ZWN0b3IuYW5pbWF0ZUJhY2tQcm9wZXJ0eS52YWx1ZSA9IHRydWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gVGhlIGJvZHkgY2FuIGJlIHRyYW5zbGF0ZWQgYnkgdGhlIGFycm93IG9yIHRoZSBsYWJlbC4gcmVtb3ZlSW5wdXRMaXN0ZW5lciBpcyByZXF1aXJlZCBvbiBkaXNwb3NlLlxyXG4gICAgdGhpcy5hcnJvd05vZGUuYWRkSW5wdXRMaXN0ZW5lciggdGhpcy50cmFuc2xhdGlvbkRyYWdMaXN0ZW5lciApO1xyXG4gICAgdGhpcy5sYWJlbE5vZGUuYWRkSW5wdXRMaXN0ZW5lciggdGhpcy50cmFuc2xhdGlvbkRyYWdMaXN0ZW5lciApO1xyXG5cclxuICAgIC8vIFRyYW5zbGF0ZSB3aGVuIHRoZSB2ZWN0b3IncyB0YWlsIHBvc2l0aW9uIGNoYW5nZXMuIHVubGluayBpcyByZXF1aXJlZCBvbiBkaXNwb3NlLlxyXG4gICAgY29uc3QgdGFpbExpc3RlbmVyID0gKCB0YWlsUG9zaXRpb25WaWV3OiBWZWN0b3IyICkgPT4ge1xyXG4gICAgICB0aGlzLnVwZGF0ZVRhaWxQb3NpdGlvbiggdGFpbFBvc2l0aW9uVmlldyApO1xyXG4gICAgICBpZiAoIHZlY3Rvci5pc1JlbW92YWJsZSApIHtcclxuICAgICAgICBjb25zdCB0YWlsUG9zaXRpb25Nb2RlbCA9IHRoaXMubW9kZWxWaWV3VHJhbnNmb3JtUHJvcGVydHkudmFsdWUudmlld1RvTW9kZWxQb3NpdGlvbiggdGFpbFBvc2l0aW9uVmlldyApO1xyXG5cclxuICAgICAgICBjb25zdCBjdXJzb3JQb3NpdGlvbk1vZGVsID0gdGhpcy5tb2RlbFZpZXdUcmFuc2Zvcm1Qcm9wZXJ0eS52YWx1ZVxyXG4gICAgICAgICAgLnZpZXdUb01vZGVsRGVsdGEoIHRoaXMudHJhbnNsYXRpb25EcmFnTGlzdGVuZXIubG9jYWxQb2ludCApLnBsdXMoIHRhaWxQb3NpdGlvbk1vZGVsICk7XHJcblxyXG4gICAgICAgIGlmICggdmVjdG9yLmlzT25HcmFwaFByb3BlcnR5LnZhbHVlICYmICFncmFwaC5ncmFwaE1vZGVsQm91bmRzLmNvbnRhaW5zUG9pbnQoIGN1cnNvclBvc2l0aW9uTW9kZWwgKSApIHtcclxuICAgICAgICAgIHZlY3Rvci5wb3BPZmZPZkdyYXBoKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgdGFpbFBvc2l0aW9uUHJvcGVydHkubGF6eUxpbmsoIHRhaWxMaXN0ZW5lciApO1xyXG5cclxuICAgIC8vIGRpc3Bvc2Ugb2YgdGhpbmdzIHJlbGF0ZWQgdG8gdmVjdG9yIHRyYW5zbGF0aW9uXHJcbiAgICBjb25zdCBkaXNwb3NlVHJhbnNsYXRlID0gKCkgPT4ge1xyXG4gICAgICB0aGlzLmFycm93Tm9kZS5yZW1vdmVJbnB1dExpc3RlbmVyKCB0aGlzLnRyYW5zbGF0aW9uRHJhZ0xpc3RlbmVyICk7XHJcbiAgICAgIHRoaXMubGFiZWxOb2RlLnJlbW92ZUlucHV0TGlzdGVuZXIoIHRoaXMudHJhbnNsYXRpb25EcmFnTGlzdGVuZXIgKTtcclxuICAgICAgdGhpcy50cmFuc2xhdGlvbkRyYWdMaXN0ZW5lci5kaXNwb3NlKCk7XHJcbiAgICAgIHRhaWxQb3NpdGlvblByb3BlcnR5LnVubGluayggdGFpbExpc3RlbmVyICk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gSGFuZGxlIHZlY3RvciBzY2FsaW5nICYgcm90YXRpb25cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGxldCBkaXNwb3NlU2NhbGVSb3RhdGU6ICgpID0+IHZvaWQ7XHJcbiAgICBpZiAoIHZlY3Rvci5pc1RpcERyYWdnYWJsZSApIHtcclxuXHJcbiAgICAgIC8vIENyZWF0ZSBhbiBpbnZpc2libGUgdHJpYW5nbGUgYXQgdGhlIGhlYWQgb2YgdGhlIHZlY3Rvci5cclxuICAgICAgY29uc3QgaGVhZFNoYXBlID0gbmV3IFNoYXBlKClcclxuICAgICAgICAubW92ZVRvKCAwLCAwIClcclxuICAgICAgICAubGluZVRvKCAtaGVhZEhlaWdodCwgLWhlYWRXaWR0aCAvIDIgKVxyXG4gICAgICAgIC5saW5lVG8oIC1oZWFkSGVpZ2h0LCBoZWFkV2lkdGggLyAyIClcclxuICAgICAgICAuY2xvc2UoKTtcclxuICAgICAgY29uc3QgaGVhZE5vZGUgPSBuZXcgUGF0aCggaGVhZFNoYXBlLCB7XHJcbiAgICAgICAgc3Ryb2tlOiBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmRldiA/ICdyZWQnIDogbnVsbCxcclxuICAgICAgICBjdXJzb3I6ICdwb2ludGVyJ1xyXG4gICAgICB9ICk7XHJcbiAgICAgIHRoaXMuYWRkQ2hpbGQoIGhlYWROb2RlICk7XHJcblxyXG4gICAgICAvLyBQb3NpdGlvbiBvZiB0aGUgdGlwIG9mIHRoZSB2ZWN0b3IsIHJlbGF0aXZlIHRvIHRoZSB0YWlsLlxyXG4gICAgICBjb25zdCB0aXBQb3NpdGlvblByb3BlcnR5ID0gbmV3IFZlY3RvcjJQcm9wZXJ0eSggdGlwRGVsdGFQb3NpdGlvbiApO1xyXG5cclxuICAgICAgLy8gRHJhZyBsaXN0ZW5lciB0byBzY2FsZS9yb3RhdGUgdGhlIHZlY3RvciwgYXR0YWNoZWQgdG8gdGhlIGludmlzaWJsZSBoZWFkLlxyXG4gICAgICBjb25zdCBzY2FsZVJvdGF0ZURyYWdMaXN0ZW5lciA9IG5ldyBEcmFnTGlzdGVuZXIoIHtcclxuICAgICAgICB0YXJnZXROb2RlOiBoZWFkTm9kZSxcclxuICAgICAgICBwb3NpdGlvblByb3BlcnR5OiB0aXBQb3NpdGlvblByb3BlcnR5LFxyXG4gICAgICAgIHN0YXJ0OiAoKSA9PiB7XHJcbiAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy52ZWN0b3IuYW5pbWF0ZUJhY2tQcm9wZXJ0eS52YWx1ZSAmJiAhdGhpcy52ZWN0b3IuaW5Qcm9ncmVzc0FuaW1hdGlvbixcclxuICAgICAgICAgICAgJ3RpcCBkcmFnIGxpc3RlbmVyIHNob3VsZCBiZSByZW1vdmVkIHdoZW4gdGhlIHZlY3RvciBpcyBhbmltYXRpbmcgYmFjay4nICk7XHJcbiAgICAgICAgICBncmFwaC5hY3RpdmVWZWN0b3JQcm9wZXJ0eS52YWx1ZSA9IHZlY3RvcjtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuICAgICAgaGVhZE5vZGUuYWRkSW5wdXRMaXN0ZW5lciggc2NhbGVSb3RhdGVEcmFnTGlzdGVuZXIgKTtcclxuXHJcbiAgICAgIC8vIE1vdmUgdGhlIHRpcCB0byBtYXRjaCB0aGUgdmVjdG9yIG1vZGVsLiB1bmxpbmsgaXMgcmVxdWlyZWQgb24gZGlzcG9zZS5cclxuICAgICAgY29uc3QgdGlwTGlzdGVuZXIgPSAoIHRpcFBvc2l0aW9uOiBWZWN0b3IyICkgPT4gdGhpcy51cGRhdGVUaXBQb3NpdGlvbiggdGlwUG9zaXRpb24gKTtcclxuICAgICAgdGlwUG9zaXRpb25Qcm9wZXJ0eS5sYXp5TGluayggdGlwTGlzdGVuZXIgKTtcclxuXHJcbiAgICAgIC8vIFBvaW50ZXIgYXJlYSBzaGFwZXMgZm9yIHRoZSBoZWFkLCBpbiAzIGRpZmZlcmVudCBzaXplcy5cclxuICAgICAgLy8gQSBwYWlyIG9mIHRoZXNlIGlzIHVzZWQsIGJhc2VkIG9uIHRoZSBtYWduaXR1ZGUgb2YgdGhlIHZlY3RvciBhbmQgd2hldGhlciBpdHMgaGVhZCBpcyBzY2FsZS5cclxuICAgICAgLy8gU2VlIGJlbG93IGFuZCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvdmVjdG9yLWFkZGl0aW9uL2lzc3Vlcy8yNDAjaXNzdWVjb21tZW50LTU0NDY4MjgxOFxyXG4gICAgICBjb25zdCBsYXJnZU1vdXNlQXJlYVNoYXBlID0gaGVhZFNoYXBlLmdldE9mZnNldFNoYXBlKCBWZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5WRUNUT1JfSEVBRF9NT1VTRV9BUkVBX0RJTEFUSU9OICk7XHJcbiAgICAgIGNvbnN0IGxhcmdlVG91Y2hBcmVhU2hhcGUgPSBoZWFkU2hhcGUuZ2V0T2Zmc2V0U2hhcGUoIFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLlZFQ1RPUl9IRUFEX1RPVUNIX0FSRUFfRElMQVRJT04gKTtcclxuICAgICAgY29uc3QgbWVkaXVtTW91c2VBcmVhU2hhcGUgPSBjcmVhdGVEaWxhdGVkSGVhZCggaGVhZFdpZHRoLCBoZWFkSGVpZ2h0LCBWZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5WRUNUT1JfSEVBRF9NT1VTRV9BUkVBX0RJTEFUSU9OICk7XHJcbiAgICAgIGNvbnN0IG1lZGl1bVRvdWNoQXJlYVNoYXBlID0gY3JlYXRlRGlsYXRlZEhlYWQoIGhlYWRXaWR0aCwgaGVhZEhlaWdodCwgVmVjdG9yQWRkaXRpb25Db25zdGFudHMuVkVDVE9SX0hFQURfVE9VQ0hfQVJFQV9ESUxBVElPTiApO1xyXG4gICAgICBjb25zdCBTTUFMTF9IRUFEX1NDQUxFID0gMC42NTsgLy8gZGV0ZXJtaW5lZCBlbXBpcmljYWxseVxyXG4gICAgICBjb25zdCBzbWFsbE1vdXNlQXJlYVNoYXBlID0gY3JlYXRlRGlsYXRlZEhlYWQoIGhlYWRXaWR0aCwgU01BTExfSEVBRF9TQ0FMRSAqIGhlYWRIZWlnaHQsIFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLlZFQ1RPUl9IRUFEX01PVVNFX0FSRUFfRElMQVRJT04gKTtcclxuICAgICAgY29uc3Qgc21hbGxUb3VjaEFyZWFTaGFwZSA9IGNyZWF0ZURpbGF0ZWRIZWFkKCBoZWFkV2lkdGgsIFNNQUxMX0hFQURfU0NBTEUgKiBoZWFkSGVpZ2h0LCBWZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5WRUNUT1JfSEVBRF9UT1VDSF9BUkVBX0RJTEFUSU9OICk7XHJcblxyXG4gICAgICAvLyBXaGVuIHRoZSB2ZWN0b3IgY2hhbmdlcywgdHJhbnNmb3JtIHRoZSBoZWFkIGFuZCBhZGp1c3QgaXRzIHBvaW50ZXIgYXJlYXMuIHVubGlua2VkIGlzIHJlcXVpcmVkIHdoZW4gZGlzcG9zZWQuXHJcbiAgICAgIGNvbnN0IHZlY3RvckNvbXBvbmVudHNMaXN0ZW5lciA9ICggdmVjdG9yQ29tcG9uZW50czogVmVjdG9yMiApID0+IHtcclxuXHJcbiAgICAgICAgLy8gQWRqdXN0IHBvaW50ZXIgYXJlYXMuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvdmVjdG9yLWFkZGl0aW9uL2lzc3Vlcy8yNDAjaXNzdWVjb21tZW50LTU0NDY4MjgxOFxyXG4gICAgICAgIGNvbnN0IFNIT1JUX01BR05JVFVERSA9IDM7XHJcbiAgICAgICAgaWYgKCB2ZWN0b3JDb21wb25lbnRzLm1hZ25pdHVkZSA8PSBTSE9SVF9NQUdOSVRVREUgKSB7XHJcblxyXG4gICAgICAgICAgLy8gV2UgaGF2ZSBhICdzaG9ydCcgdmVjdG9yLCBzbyBhZGp1c3QgdGhlIGhlYWQncyBwb2ludGVyIGFyZWFzIHNvIHRoYXQgdGhlIHRhaWwgY2FuIHN0aWxsIGJlIGdyYWJiZWQuXHJcbiAgICAgICAgICBjb25zdCB2aWV3Q29tcG9uZW50cyA9IHRoaXMubW9kZWxWaWV3VHJhbnNmb3JtUHJvcGVydHkudmFsdWUubW9kZWxUb1ZpZXdEZWx0YSggdmVjdG9yLnZlY3RvckNvbXBvbmVudHMgKTtcclxuICAgICAgICAgIGNvbnN0IHZpZXdNYWduaXR1ZGUgPSB2aWV3Q29tcG9uZW50cy5tYWduaXR1ZGU7XHJcbiAgICAgICAgICBjb25zdCBtYXhIZWFkSGVpZ2h0ID0gZnJhY3Rpb25hbEhlYWRIZWlnaHQgKiB2aWV3TWFnbml0dWRlO1xyXG5cclxuICAgICAgICAgIGlmICggaGVhZEhlaWdodCA+IG1heEhlYWRIZWlnaHQgKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBoZWFkIGlzIHNjYWxlZCAoc2VlIEFycm93Tm9kZSBmcmFjdGlvbmFsSGVhZEhlaWdodCksIHVzZSBzbWFsbCBwb2ludGVyIGFyZWFzXHJcbiAgICAgICAgICAgIGhlYWROb2RlLm1vdXNlQXJlYSA9IHNtYWxsTW91c2VBcmVhU2hhcGU7XHJcbiAgICAgICAgICAgIGhlYWROb2RlLnRvdWNoQXJlYSA9IHNtYWxsVG91Y2hBcmVhU2hhcGU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGhlYWQgaXMgbm90IHNjYWxlZCwgdXNlIG1lZGl1bSBwb2ludGVyIGFyZWFzXHJcbiAgICAgICAgICAgIGhlYWROb2RlLm1vdXNlQXJlYSA9IG1lZGl1bU1vdXNlQXJlYVNoYXBlO1xyXG4gICAgICAgICAgICBoZWFkTm9kZS50b3VjaEFyZWEgPSBtZWRpdW1Ub3VjaEFyZWFTaGFwZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgICAgLy8gV2UgaGF2ZSBhICdsb25nJyB2ZWN0b3IsIHNvIHVzZSB0aGUgbGFyZ2UgcG9pbnRlciBhcmVhcy5cclxuICAgICAgICAgIGhlYWROb2RlLm1vdXNlQXJlYSA9IGxhcmdlTW91c2VBcmVhU2hhcGU7XHJcbiAgICAgICAgICBoZWFkTm9kZS50b3VjaEFyZWEgPSBsYXJnZVRvdWNoQXJlYVNoYXBlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVHJhbnNmb3JtIHRoZSBpbnZpc2libGUgaGVhZCB0byBtYXRjaCB0aGUgcG9zaXRpb24gYW5kIGFuZ2xlIG9mIHRoZSBhY3R1YWwgdmVjdG9yLlxyXG4gICAgICAgIGhlYWROb2RlLnRyYW5zbGF0aW9uID0gdGhpcy5tb2RlbFZpZXdUcmFuc2Zvcm1Qcm9wZXJ0eS52YWx1ZS5tb2RlbFRvVmlld0RlbHRhKCB2ZWN0b3IudmVjdG9yQ29tcG9uZW50cyApO1xyXG4gICAgICAgIGhlYWROb2RlLnJvdGF0aW9uID0gLXZlY3RvckNvbXBvbmVudHMuYW5nbGU7XHJcbiAgICAgIH07XHJcbiAgICAgIHZlY3Rvci52ZWN0b3JDb21wb25lbnRzUHJvcGVydHkubGluayggdmVjdG9yQ29tcG9uZW50c0xpc3RlbmVyICk7XHJcblxyXG4gICAgICAvLyBkaXNwb3NlIG9mIHRoaW5ncyB0aGF0IGFyZSByZWxhdGVkIHRvIG9wdGlvbmFsIHNjYWxlL3JvdGF0ZVxyXG4gICAgICBkaXNwb3NlU2NhbGVSb3RhdGUgPSAoKSA9PiB7XHJcbiAgICAgICAgaGVhZE5vZGUucmVtb3ZlSW5wdXRMaXN0ZW5lciggc2NhbGVSb3RhdGVEcmFnTGlzdGVuZXIgKTtcclxuICAgICAgICB0aXBQb3NpdGlvblByb3BlcnR5LnVubGluayggdGlwTGlzdGVuZXIgKTtcclxuICAgICAgICB2ZWN0b3IudmVjdG9yQ29tcG9uZW50c1Byb3BlcnR5LnVubGluayggdmVjdG9yQ29tcG9uZW50c0xpc3RlbmVyICk7XHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBBcHBlYXJhbmNlXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIGFwcGVhcmFuY2Ugb2YgdGhlIHZlY3RvcidzIHNoYWRvdy4gTXVzdCBiZSB1bm11bHRpbGlua2VkLlxyXG4gICAgY29uc3Qgc2hhZG93TXVsdGlsaW5rID0gTXVsdGlsaW5rLm11bHRpbGluayhcclxuICAgICAgWyB2ZWN0b3IuaXNPbkdyYXBoUHJvcGVydHksIHZlY3Rvci52ZWN0b3JDb21wb25lbnRzUHJvcGVydHksIHRoaXMudmVjdG9yLmFuaW1hdGVCYWNrUHJvcGVydHkgXSxcclxuICAgICAgKCBpc09uR3JhcGgsIHZlY3RvckNvbXBvbmVudHMsIGFuaW1hdGVCYWNrICkgPT4ge1xyXG4gICAgICAgIHZlY3RvclNoYWRvd05vZGUudmlzaWJsZSA9ICggIWFuaW1hdGVCYWNrICYmICFpc09uR3JhcGggKTtcclxuICAgICAgICB2ZWN0b3JTaGFkb3dOb2RlLnJlc2V0VHJhbnNmb3JtKCk7XHJcbiAgICAgICAgaWYgKCAhaXNPbkdyYXBoICYmIHZlY3RvclNoYWRvd05vZGUuZ2V0Qm91bmRzKCkuaXNWYWxpZCgpICkge1xyXG4gICAgICAgICAgdmVjdG9yU2hhZG93Tm9kZS5sZWZ0ID0gdGhpcy5hcnJvd05vZGUubGVmdCArIFNIQURPV19PRkZTRVRfWDtcclxuICAgICAgICAgIHZlY3RvclNoYWRvd05vZGUudG9wID0gdGhpcy5hcnJvd05vZGUudG9wICsgU0hBRE9XX09GRlNFVF9ZO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB0aXBEZWx0YVBvc2l0aW9uID0gdGhpcy5tb2RlbFZpZXdUcmFuc2Zvcm1Qcm9wZXJ0eS52YWx1ZS5tb2RlbFRvVmlld0RlbHRhKCB2ZWN0b3JDb21wb25lbnRzICk7XHJcbiAgICAgICAgdmVjdG9yU2hhZG93Tm9kZS5zZXRUaXAoIHRpcERlbHRhUG9zaXRpb24ueCwgdGlwRGVsdGFQb3NpdGlvbi55ICk7XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAvLyBTaG93IHRoZSB2ZWN0b3IncyBsYWJlbCB3aGVuIGl0J3Mgb24gdGhlIGdyYXBoLiBNdXN0IGJlIHVubGlua2VkLlxyXG4gICAgY29uc3QgaXNPbkdyYXBoTGlzdGVuZXIgPSAoIGlzT25HcmFwaDogYm9vbGVhbiApID0+ICggdGhpcy5sYWJlbE5vZGUudmlzaWJsZSA9IGlzT25HcmFwaCApO1xyXG4gICAgdmVjdG9yLmlzT25HcmFwaFByb3BlcnR5LmxpbmsoIGlzT25HcmFwaExpc3RlbmVyICk7XHJcblxyXG4gICAgLy8gSGlnaGxpZ2h0IHRoZSB2ZWN0b3IncyBsYWJlbCB3aGVuIGl0IGlzIHNlbGVjdGVkLiBNdXN0IGJlIHVubGlua2VkLlxyXG4gICAgY29uc3QgYWN0aXZlVmVjdG9yTGlzdGVuZXIgPSAoIGFjdGl2ZVZlY3RvcjogVmVjdG9yIHwgbnVsbCApID0+IHtcclxuICAgICAgdGhpcy5sYWJlbE5vZGUuc2V0SGlnaGxpZ2h0ZWQoIGFjdGl2ZVZlY3RvciA9PT0gdmVjdG9yICk7XHJcbiAgICB9O1xyXG4gICAgZ3JhcGguYWN0aXZlVmVjdG9yUHJvcGVydHkubGluayggYWN0aXZlVmVjdG9yTGlzdGVuZXIgKTtcclxuXHJcbiAgICAvLyBEaXNhYmxlIGludGVyYWN0aW9uIHdoZW4gdGhlIHZlY3RvciBpcyBhbmltYXRpbmcgYmFjayB0byB0aGUgdG9vbGJveCwgd2hlcmUgaXQgd2lsbCBiZSBkaXNwb3NlZC5cclxuICAgIC8vIHVubGluayBpcyByZXF1aXJlZCBvbiBkaXNwb3NlLlxyXG4gICAgY29uc3QgYW5pbWF0ZUJhY2tMaXN0ZW5lciA9ICggYW5pbWF0ZUJhY2s6IGJvb2xlYW4gKSA9PiB7XHJcbiAgICAgIGlmICggYW5pbWF0ZUJhY2sgKSB7XHJcbiAgICAgICAgdGhpcy5pbnRlcnJ1cHRTdWJ0cmVlSW5wdXQoKTtcclxuICAgICAgICB0aGlzLnBpY2thYmxlID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5jdXJzb3IgPSAnZGVmYXVsdCc7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgICB0aGlzLnZlY3Rvci5hbmltYXRlQmFja1Byb3BlcnR5LmxhenlMaW5rKCBhbmltYXRlQmFja0xpc3RlbmVyICk7XHJcblxyXG4gICAgdGhpcy5kaXNwb3NlVmVjdG9yTm9kZSA9ICgpID0+IHtcclxuXHJcbiAgICAgIC8vIERpc3Bvc2Ugb2Ygbm9kZXNcclxuICAgICAgYW5nbGVOb2RlLmRpc3Bvc2UoKTtcclxuXHJcbiAgICAgIC8vIERpc3Bvc2Ugb2YgdHJhbnNmb3JtIGhhbmRsaW5nXHJcbiAgICAgIGRpc3Bvc2VUcmFuc2xhdGUoKTtcclxuICAgICAgZGlzcG9zZVNjYWxlUm90YXRlICYmIGRpc3Bvc2VTY2FsZVJvdGF0ZSgpO1xyXG5cclxuICAgICAgLy8gRGlzcG9zZSBvZiBhcHBlYXJhbmNlLXJlbGF0ZWQgbGlzdGVuZXJzXHJcbiAgICAgIE11bHRpbGluay51bm11bHRpbGluayggc2hhZG93TXVsdGlsaW5rICk7XHJcbiAgICAgIHZlY3Rvci5pc09uR3JhcGhQcm9wZXJ0eS51bmxpbmsoIGlzT25HcmFwaExpc3RlbmVyICk7XHJcbiAgICAgIGdyYXBoLmFjdGl2ZVZlY3RvclByb3BlcnR5LnVubGluayggYWN0aXZlVmVjdG9yTGlzdGVuZXIgKTtcclxuICAgICAgdGhpcy52ZWN0b3IuYW5pbWF0ZUJhY2tQcm9wZXJ0eS51bmxpbmsoIGFuaW1hdGVCYWNrTGlzdGVuZXIgKTtcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuZGlzcG9zZVZlY3Rvck5vZGUoKTtcclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwZGF0ZXMgdGhlIHZlY3RvciBtb2RlbCwgd2hpY2ggd2lsbCB0aGVuIHJvdW5kIHRoZSBuZXcgcG9zaXRpb24gZGVwZW5kaW5nIG9uIHRoZSBjb29yZGluYXRlIHNuYXAgbW9kZVxyXG4gICAqIEBwYXJhbSB0aXBQb3NpdGlvblZpZXcgLSB0aGUgZHJhZyBsaXN0ZW5lciBwb3NpdGlvblxyXG4gICAqL1xyXG4gIHByaXZhdGUgdXBkYXRlVGlwUG9zaXRpb24oIHRpcFBvc2l0aW9uVmlldzogVmVjdG9yMiApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLnZlY3Rvci5hbmltYXRlQmFja1Byb3BlcnR5LnZhbHVlICYmICF0aGlzLnZlY3Rvci5pblByb2dyZXNzQW5pbWF0aW9uLFxyXG4gICAgICAnQ2Fubm90IGRyYWcgdGlwIHdoZW4gYW5pbWF0aW5nIGJhY2snICk7XHJcblxyXG4gICAgY29uc3QgdGlwUG9zaXRpb25Nb2RlbCA9IHRoaXMudmVjdG9yLnRhaWxcclxuICAgICAgLnBsdXMoIHRoaXMubW9kZWxWaWV3VHJhbnNmb3JtUHJvcGVydHkudmFsdWUudmlld1RvTW9kZWxEZWx0YSggdGlwUG9zaXRpb25WaWV3ICkgKTtcclxuXHJcbiAgICB0aGlzLnZlY3Rvci5tb3ZlVGlwVG9Qb3NpdGlvbiggdGlwUG9zaXRpb25Nb2RlbCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXBkYXRlcyB0aGUgbW9kZWwgdmVjdG9yJ3MgdGFpbCBwb3NpdGlvbi4gQ2FsbGVkIHdoZW4gdGhlIHZlY3RvciBpcyBiZWluZyB0cmFuc2xhdGVkLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgdXBkYXRlVGFpbFBvc2l0aW9uKCB0YWlsUG9zaXRpb25WaWV3OiBWZWN0b3IyICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMudmVjdG9yLmFuaW1hdGVCYWNrUHJvcGVydHkudmFsdWUgJiYgIXRoaXMudmVjdG9yLmluUHJvZ3Jlc3NBbmltYXRpb24sXHJcbiAgICAgICdDYW5ub3QgZHJhZyB0YWlsIHdoZW4gYW5pbWF0aW5nIGJhY2snICk7XHJcblxyXG4gICAgY29uc3QgdGFpbFBvc2l0aW9uTW9kZWwgPSB0aGlzLm1vZGVsVmlld1RyYW5zZm9ybVByb3BlcnR5LnZhbHVlLnZpZXdUb01vZGVsUG9zaXRpb24oIHRhaWxQb3NpdGlvblZpZXcgKTtcclxuXHJcbiAgICBpZiAoICF0aGlzLnZlY3Rvci5pc09uR3JhcGhQcm9wZXJ0eS52YWx1ZSApIHtcclxuICAgICAgLy8gQWxsb3cgdHJhbnNsYXRpb24gdG8gYW55d2hlcmUgaWYgaXQgaXNuJ3Qgb24gdGhlIGdyYXBoXHJcbiAgICAgIHRoaXMudmVjdG9yLm1vdmVUb1RhaWxQb3NpdGlvbiggdGFpbFBvc2l0aW9uTW9kZWwgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyBVcGRhdGUgdGhlIG1vZGVsIHRhaWwgcG9zaXRpb24sIHN1YmplY3QgdG8gc3ltbWV0cmljIHJvdW5kaW5nLCBhbmQgZml0IGluc2lkZSB0aGUgZ3JhcGggYm91bmRzXHJcbiAgICAgIHRoaXMudmVjdG9yLm1vdmVUYWlsVG9Qb3NpdGlvbiggdGFpbFBvc2l0aW9uTW9kZWwgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZvcndhcmRzIGFuIGV2ZW50IHRvIHRyYW5zbGF0aW9uRHJhZ0xpc3RlbmVyLiBVc2VkIGZvciBkcmFnZ2luZyB2ZWN0b3JzIG91dCBvZiB0aGUgdG9vbGJveC5cclxuICAgKi9cclxuICBwdWJsaWMgZm9yd2FyZEV2ZW50KCBldmVudDogUHJlc3NMaXN0ZW5lckV2ZW50ICk6IHZvaWQge1xyXG4gICAgdGhpcy50cmFuc2xhdGlvbkRyYWdMaXN0ZW5lci5wcmVzcyggZXZlbnQsIHRoaXMgKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgKHJvdWdoKSBkaWxhdGVkIHNoYXBlIGZvciBhIHZlY3RvciBoZWFkLiAgVGhlIGhlYWQgaXMgcG9pbnRpbmcgdG8gdGhlIHJpZ2h0LlxyXG4gKi9cclxuZnVuY3Rpb24gY3JlYXRlRGlsYXRlZEhlYWQoIGhlYWRXaWR0aDogbnVtYmVyLCBoZWFkSGVpZ2h0OiBudW1iZXIsIGRpbGF0aW9uOiBudW1iZXIgKTogU2hhcGUge1xyXG5cclxuICAvLyBTdGFydGluZyBmcm9tIHRoZSB1cHBlciBsZWZ0IGFuZCBtb3ZpbmcgY2xvY2t3aXNlXHJcbiAgcmV0dXJuIG5ldyBTaGFwZSgpXHJcbiAgICAubW92ZVRvKCAtaGVhZEhlaWdodCwgLWhlYWRIZWlnaHQgLyAyIC0gZGlsYXRpb24gKVxyXG4gICAgLmxpbmVUbyggMCwgLWRpbGF0aW9uIClcclxuICAgIC5saW5lVG8oIGRpbGF0aW9uLCAwIClcclxuICAgIC5saW5lVG8oIDAsIGRpbGF0aW9uIClcclxuICAgIC5saW5lVG8oIC1oZWFkSGVpZ2h0LCBoZWFkV2lkdGggLyAyICsgZGlsYXRpb24gKVxyXG4gICAgLmNsb3NlKCk7XHJcbn1cclxuXHJcbnZlY3RvckFkZGl0aW9uLnJlZ2lzdGVyKCAnVmVjdG9yTm9kZScsIFZlY3Rvck5vZGUgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFD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