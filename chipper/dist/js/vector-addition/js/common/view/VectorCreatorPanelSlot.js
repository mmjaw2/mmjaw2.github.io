// Copyright 2019-2023, University of Colorado Boulder

/**
 * View for a single 'slot' on the VectorCreatorPanel (./VectorCreatorPanel.js).
 *
 * A slot creates a Vector when the icon is clicked.
 *
 * ## Slots can differ in:
 *  - Icon colors and sizes
 *  - Infinite slot versus only one vector per slot
 *  - Having symbols versus not having symbols
 *  - Icon components and initial vector components (e.g. on Explore 1D the initial vectors are horizontal/vertical
 *    while on Explore 2D the vectors are 45 degrees)
 *
 * ## Implementation of creation of Vectors:
 *  1. Once the icon is clicked, a Vector is made.
 *  2. A call to the SceneNode is made, passing the created Vector. The Scene Node then creates the subsequent views
 *     for the Vector (VectorNode and VectorComponentNode), layering the views correctly and forwarding the event.
 *  3. Once the Vector indicates the Vector was dropped outside the Graph, the slot will then animate the Vector and
 *     dispose the vector, signaling to the SceneNode to dispose of the views.
 *
 * @author Brandon Li
 */

import Bounds2 from '../../../../dot/js/Bounds2.js';
import { AlignBox, DragListener, HBox } from '../../../../scenery/js/imports.js';
import vectorAddition from '../../vectorAddition.js';
import Vector from '../model/Vector.js';
import ArrowOverSymbolNode from './ArrowOverSymbolNode.js';
import VectorAdditionIconFactory from './VectorAdditionIconFactory.js';
import optionize from '../../../../phet-core/js/optionize.js';

// The fixed-width of the parent of the icon. The Icon is placed in an alignBox to ensure the Icon
// contains the same local width regardless of the initial vector components. This ensures that
// the label of the slot is in the same place regardless of the icon size.
const ARROW_ICON_CONTAINER_WIDTH = 35;
export default class VectorCreatorPanelSlot extends HBox {
  /**
   * @param graph - the graph to drop the vector onto
   * @param vectorSet - the VectorSet that the slot adds Vectors to
   * @param sceneNode - the SceneNode that this slot appears in
   * @param initialVectorComponents - the initial vector components to pass to created vectors
   * @param [providedOptions]
   */
  constructor(graph, vectorSet, sceneNode, initialVectorComponents, providedOptions) {
    const options = optionize()({
      // SelfOptions
      symbol: null,
      numberOfVectors: 1,
      iconArrowMagnitude: 30,
      iconVectorComponents: null,
      iconPointerAreaXDilation: 10,
      iconPointerAreaYDilation: 10,
      // HBoxOptions
      isDisposable: false
    }, providedOptions);
    super({
      spacing: 5
    });

    // convenience reference
    const modelViewTransform = graph.modelViewTransformProperty.value;

    //----------------------------------------------------------------------------------------
    // Create the icon
    //----------------------------------------------------------------------------------------

    // Get the components in view coordinates.
    const iconViewComponents = modelViewTransform.viewToModelDelta(options.iconVectorComponents || initialVectorComponents);

    // Create the icon.
    const iconNode = VectorAdditionIconFactory.createVectorCreatorPanelIcon(iconViewComponents, vectorSet.vectorColorPalette, options.iconArrowMagnitude);

    // Make the iconNode easier to grab
    iconNode.mouseArea = iconNode.localBounds.dilatedXY(options.iconPointerAreaXDilation, options.iconPointerAreaYDilation);
    iconNode.touchArea = iconNode.localBounds.dilatedXY(options.iconPointerAreaXDilation, options.iconPointerAreaYDilation);

    // Get the components in model coordinates of the icon. Used to animate the vector to the icon components.
    const iconComponents = modelViewTransform.viewToModelDelta(iconViewComponents.normalized().timesScalar(options.iconArrowMagnitude));

    // Create a fixed-size box for the icon. The Icon is placed in an alignBox to ensure the Icon
    // contains the same local width regardless of the initial vector components. This ensures that
    // the label of the slot is in the same place regardless of the icon size.
    this.addChild(new AlignBox(iconNode, {
      alignBounds: new Bounds2(0, 0, ARROW_ICON_CONTAINER_WIDTH, iconNode.height)
    }));

    //----------------------------------------------------------------------------------------
    // Create the label of the slot
    //----------------------------------------------------------------------------------------

    if (options.symbol) {
      this.addChild(new ArrowOverSymbolNode(options.symbol));
    }

    //----------------------------------------------------------------------------------------
    // Creation of Vectors (See ## Implementation of creation of Vectors above)
    //----------------------------------------------------------------------------------------

    // removeInputListener is unnecessary, exists for the lifetime of the sim.
    iconNode.addInputListener(DragListener.createForwardingListener(event => {
      //----------------------------------------------------------------------------------------
      // Step 1: When the icon is clicked, create a new Vector
      //----------------------------------------------------------------------------------------

      // Find where the icon was clicked relative to the scene node (view coordinates)
      const vectorCenterView = sceneNode.globalToLocalPoint(event.pointer.point);

      // Convert the view coordinates of where the icon was clicked into model coordinates
      const vectorCenterModel = graph.modelViewTransformProperty.value.viewToModelPosition(vectorCenterView);

      // Calculate where the tail position is relative to the scene node
      const vectorTailPosition = vectorCenterModel.minus(initialVectorComponents.timesScalar(0.5));

      // Create the new Vector Model
      const vector = new Vector(vectorTailPosition, initialVectorComponents, graph, vectorSet, options.symbol);
      vectorSet.vectors.push(vector);

      //----------------------------------------------------------------------------------------
      // Step 2: A call to the Scene Node is made, passing the created Vector to create the subsequent views
      //----------------------------------------------------------------------------------------

      sceneNode.registerVector(vector, vectorSet, event);

      // Hide the icon when we've reached the numberOfVectors limit
      iconNode.visible = vectorSet.vectors.lengthProperty.value < options.numberOfVectors;

      //----------------------------------------------------------------------------------------
      // Step 3: Once the Vector indicates the Vector was dropped outside the Graph, animate and
      // dispose the Vector, signaling to the SceneNode to dispose of the views.
      //----------------------------------------------------------------------------------------

      const animateVectorBackListener = animateBack => {
        if (animateBack) {
          // Get the model position of the icon node.
          const iconPosition = graph.modelViewTransformProperty.value.viewToModelBounds(sceneNode.boundsOf(iconNode)).center;

          // Animate the vector to its icon in the panel.
          vector.animateToPoint(iconPosition, iconComponents, () => {
            vectorSet.vectors.remove(vector);
            vector.dispose();
          });
        }
      };
      vector.animateBackProperty.link(animateVectorBackListener); // unlink required when vector is removed

      // Observe when the vector is removed and clean up.
      const removeVectorListener = removedVector => {
        if (removedVector === vector) {
          iconNode.visible = true;
          vector.animateBackProperty.unlink(animateVectorBackListener);
          vectorSet.vectors.removeItemRemovedListener(removeVectorListener);
        }
      };
      vectorSet.vectors.addItemRemovedListener(removeVectorListener);
    }));
  }
}
vectorAddition.register('VectorCreatorPanelSlot', VectorCreatorPanelSlot);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb3VuZHMyIiwiQWxpZ25Cb3giLCJEcmFnTGlzdGVuZXIiLCJIQm94IiwidmVjdG9yQWRkaXRpb24iLCJWZWN0b3IiLCJBcnJvd092ZXJTeW1ib2xOb2RlIiwiVmVjdG9yQWRkaXRpb25JY29uRmFjdG9yeSIsIm9wdGlvbml6ZSIsIkFSUk9XX0lDT05fQ09OVEFJTkVSX1dJRFRIIiwiVmVjdG9yQ3JlYXRvclBhbmVsU2xvdCIsImNvbnN0cnVjdG9yIiwiZ3JhcGgiLCJ2ZWN0b3JTZXQiLCJzY2VuZU5vZGUiLCJpbml0aWFsVmVjdG9yQ29tcG9uZW50cyIsInByb3ZpZGVkT3B0aW9ucyIsIm9wdGlvbnMiLCJzeW1ib2wiLCJudW1iZXJPZlZlY3RvcnMiLCJpY29uQXJyb3dNYWduaXR1ZGUiLCJpY29uVmVjdG9yQ29tcG9uZW50cyIsImljb25Qb2ludGVyQXJlYVhEaWxhdGlvbiIsImljb25Qb2ludGVyQXJlYVlEaWxhdGlvbiIsImlzRGlzcG9zYWJsZSIsInNwYWNpbmciLCJtb2RlbFZpZXdUcmFuc2Zvcm0iLCJtb2RlbFZpZXdUcmFuc2Zvcm1Qcm9wZXJ0eSIsInZhbHVlIiwiaWNvblZpZXdDb21wb25lbnRzIiwidmlld1RvTW9kZWxEZWx0YSIsImljb25Ob2RlIiwiY3JlYXRlVmVjdG9yQ3JlYXRvclBhbmVsSWNvbiIsInZlY3RvckNvbG9yUGFsZXR0ZSIsIm1vdXNlQXJlYSIsImxvY2FsQm91bmRzIiwiZGlsYXRlZFhZIiwidG91Y2hBcmVhIiwiaWNvbkNvbXBvbmVudHMiLCJub3JtYWxpemVkIiwidGltZXNTY2FsYXIiLCJhZGRDaGlsZCIsImFsaWduQm91bmRzIiwiaGVpZ2h0IiwiYWRkSW5wdXRMaXN0ZW5lciIsImNyZWF0ZUZvcndhcmRpbmdMaXN0ZW5lciIsImV2ZW50IiwidmVjdG9yQ2VudGVyVmlldyIsImdsb2JhbFRvTG9jYWxQb2ludCIsInBvaW50ZXIiLCJwb2ludCIsInZlY3RvckNlbnRlck1vZGVsIiwidmlld1RvTW9kZWxQb3NpdGlvbiIsInZlY3RvclRhaWxQb3NpdGlvbiIsIm1pbnVzIiwidmVjdG9yIiwidmVjdG9ycyIsInB1c2giLCJyZWdpc3RlclZlY3RvciIsInZpc2libGUiLCJsZW5ndGhQcm9wZXJ0eSIsImFuaW1hdGVWZWN0b3JCYWNrTGlzdGVuZXIiLCJhbmltYXRlQmFjayIsImljb25Qb3NpdGlvbiIsInZpZXdUb01vZGVsQm91bmRzIiwiYm91bmRzT2YiLCJjZW50ZXIiLCJhbmltYXRlVG9Qb2ludCIsInJlbW92ZSIsImRpc3Bvc2UiLCJhbmltYXRlQmFja1Byb3BlcnR5IiwibGluayIsInJlbW92ZVZlY3Rvckxpc3RlbmVyIiwicmVtb3ZlZFZlY3RvciIsInVubGluayIsInJlbW92ZUl0ZW1SZW1vdmVkTGlzdGVuZXIiLCJhZGRJdGVtUmVtb3ZlZExpc3RlbmVyIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJWZWN0b3JDcmVhdG9yUGFuZWxTbG90LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE5LTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFZpZXcgZm9yIGEgc2luZ2xlICdzbG90JyBvbiB0aGUgVmVjdG9yQ3JlYXRvclBhbmVsICguL1ZlY3RvckNyZWF0b3JQYW5lbC5qcykuXHJcbiAqXHJcbiAqIEEgc2xvdCBjcmVhdGVzIGEgVmVjdG9yIHdoZW4gdGhlIGljb24gaXMgY2xpY2tlZC5cclxuICpcclxuICogIyMgU2xvdHMgY2FuIGRpZmZlciBpbjpcclxuICogIC0gSWNvbiBjb2xvcnMgYW5kIHNpemVzXHJcbiAqICAtIEluZmluaXRlIHNsb3QgdmVyc3VzIG9ubHkgb25lIHZlY3RvciBwZXIgc2xvdFxyXG4gKiAgLSBIYXZpbmcgc3ltYm9scyB2ZXJzdXMgbm90IGhhdmluZyBzeW1ib2xzXHJcbiAqICAtIEljb24gY29tcG9uZW50cyBhbmQgaW5pdGlhbCB2ZWN0b3IgY29tcG9uZW50cyAoZS5nLiBvbiBFeHBsb3JlIDFEIHRoZSBpbml0aWFsIHZlY3RvcnMgYXJlIGhvcml6b250YWwvdmVydGljYWxcclxuICogICAgd2hpbGUgb24gRXhwbG9yZSAyRCB0aGUgdmVjdG9ycyBhcmUgNDUgZGVncmVlcylcclxuICpcclxuICogIyMgSW1wbGVtZW50YXRpb24gb2YgY3JlYXRpb24gb2YgVmVjdG9yczpcclxuICogIDEuIE9uY2UgdGhlIGljb24gaXMgY2xpY2tlZCwgYSBWZWN0b3IgaXMgbWFkZS5cclxuICogIDIuIEEgY2FsbCB0byB0aGUgU2NlbmVOb2RlIGlzIG1hZGUsIHBhc3NpbmcgdGhlIGNyZWF0ZWQgVmVjdG9yLiBUaGUgU2NlbmUgTm9kZSB0aGVuIGNyZWF0ZXMgdGhlIHN1YnNlcXVlbnQgdmlld3NcclxuICogICAgIGZvciB0aGUgVmVjdG9yIChWZWN0b3JOb2RlIGFuZCBWZWN0b3JDb21wb25lbnROb2RlKSwgbGF5ZXJpbmcgdGhlIHZpZXdzIGNvcnJlY3RseSBhbmQgZm9yd2FyZGluZyB0aGUgZXZlbnQuXHJcbiAqICAzLiBPbmNlIHRoZSBWZWN0b3IgaW5kaWNhdGVzIHRoZSBWZWN0b3Igd2FzIGRyb3BwZWQgb3V0c2lkZSB0aGUgR3JhcGgsIHRoZSBzbG90IHdpbGwgdGhlbiBhbmltYXRlIHRoZSBWZWN0b3IgYW5kXHJcbiAqICAgICBkaXNwb3NlIHRoZSB2ZWN0b3IsIHNpZ25hbGluZyB0byB0aGUgU2NlbmVOb2RlIHRvIGRpc3Bvc2Ugb2YgdGhlIHZpZXdzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEJyYW5kb24gTGlcclxuICovXHJcblxyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IHsgQWxpZ25Cb3gsIERyYWdMaXN0ZW5lciwgSEJveCwgSEJveE9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgdmVjdG9yQWRkaXRpb24gZnJvbSAnLi4vLi4vdmVjdG9yQWRkaXRpb24uanMnO1xyXG5pbXBvcnQgR3JhcGggZnJvbSAnLi4vbW9kZWwvR3JhcGguanMnO1xyXG5pbXBvcnQgVmVjdG9yIGZyb20gJy4uL21vZGVsL1ZlY3Rvci5qcyc7XHJcbmltcG9ydCBWZWN0b3JTZXQgZnJvbSAnLi4vbW9kZWwvVmVjdG9yU2V0LmpzJztcclxuaW1wb3J0IEFycm93T3ZlclN5bWJvbE5vZGUgZnJvbSAnLi9BcnJvd092ZXJTeW1ib2xOb2RlLmpzJztcclxuaW1wb3J0IFZlY3RvckFkZGl0aW9uSWNvbkZhY3RvcnkgZnJvbSAnLi9WZWN0b3JBZGRpdGlvbkljb25GYWN0b3J5LmpzJztcclxuaW1wb3J0IFNjZW5lTm9kZSBmcm9tICcuL1NjZW5lTm9kZS5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcblxyXG4vLyBUaGUgZml4ZWQtd2lkdGggb2YgdGhlIHBhcmVudCBvZiB0aGUgaWNvbi4gVGhlIEljb24gaXMgcGxhY2VkIGluIGFuIGFsaWduQm94IHRvIGVuc3VyZSB0aGUgSWNvblxyXG4vLyBjb250YWlucyB0aGUgc2FtZSBsb2NhbCB3aWR0aCByZWdhcmRsZXNzIG9mIHRoZSBpbml0aWFsIHZlY3RvciBjb21wb25lbnRzLiBUaGlzIGVuc3VyZXMgdGhhdFxyXG4vLyB0aGUgbGFiZWwgb2YgdGhlIHNsb3QgaXMgaW4gdGhlIHNhbWUgcGxhY2UgcmVnYXJkbGVzcyBvZiB0aGUgaWNvbiBzaXplLlxyXG5jb25zdCBBUlJPV19JQ09OX0NPTlRBSU5FUl9XSURUSCA9IDM1O1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuICBzeW1ib2w/OiBzdHJpbmcgfCBudWxsOyAvLyB0aGUgc3ltYm9sIHRvIHBhc3MgdG8gY3JlYXRlZCB2ZWN0b3JzXHJcbiAgbnVtYmVyT2ZWZWN0b3JzPzogbnVtYmVyOyAgLy8gdGhlIG51bWJlciBvZiB2ZWN0b3JzIHRoYXQgY2FuIGV4aXN0IHRoYXQgd2VyZSBjcmVhdGVkIGJ5IHRoaXMgc2xvdFxyXG4gIGljb25BcnJvd01hZ25pdHVkZT86IG51bWJlcjsgLy8gdGhlIG1hZ25pdHVkZSBvZiB0aGUgaWNvbiBpbiB2aWV3IGNvb3JkaW5hdGVzXHJcbiAgaWNvblZlY3RvckNvbXBvbmVudHM/OiBWZWN0b3IyIHwgbnVsbDsgLy8gdXNlZCBmb3IgdmVjdG9yIGljb24sIGRlZmF1bHRzIHRvIGluaXRpYWxWZWN0b3JDb21wb25lbnRzXHJcblxyXG4gIC8vIHBvaW50ZXIgYXJlYSBkaWxhdGlvbiBmb3IgaWNvbnMsIGlkZW50aWNhbCBmb3IgbW91c2VBcmVhIGFuZCB0b3VjaEFyZWEsXHJcbiAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy92ZWN0b3ItYWRkaXRpb24vaXNzdWVzLzI1MFxyXG4gIGljb25Qb2ludGVyQXJlYVhEaWxhdGlvbj86IG51bWJlcjtcclxuICBpY29uUG9pbnRlckFyZWFZRGlsYXRpb24/OiBudW1iZXI7XHJcbn07XHJcblxyXG50eXBlIFZlY3RvckNyZWF0b3JQYW5lbFNsb3RPcHRpb25zID0gU2VsZk9wdGlvbnM7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWZWN0b3JDcmVhdG9yUGFuZWxTbG90IGV4dGVuZHMgSEJveCB7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBncmFwaCAtIHRoZSBncmFwaCB0byBkcm9wIHRoZSB2ZWN0b3Igb250b1xyXG4gICAqIEBwYXJhbSB2ZWN0b3JTZXQgLSB0aGUgVmVjdG9yU2V0IHRoYXQgdGhlIHNsb3QgYWRkcyBWZWN0b3JzIHRvXHJcbiAgICogQHBhcmFtIHNjZW5lTm9kZSAtIHRoZSBTY2VuZU5vZGUgdGhhdCB0aGlzIHNsb3QgYXBwZWFycyBpblxyXG4gICAqIEBwYXJhbSBpbml0aWFsVmVjdG9yQ29tcG9uZW50cyAtIHRoZSBpbml0aWFsIHZlY3RvciBjb21wb25lbnRzIHRvIHBhc3MgdG8gY3JlYXRlZCB2ZWN0b3JzXHJcbiAgICogQHBhcmFtIFtwcm92aWRlZE9wdGlvbnNdXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBncmFwaDogR3JhcGgsIHZlY3RvclNldDogVmVjdG9yU2V0LCBzY2VuZU5vZGU6IFNjZW5lTm9kZSwgaW5pdGlhbFZlY3RvckNvbXBvbmVudHM6IFZlY3RvcjIsXHJcbiAgICAgICAgICAgICAgICAgICAgICBwcm92aWRlZE9wdGlvbnM/OiBWZWN0b3JDcmVhdG9yUGFuZWxTbG90T3B0aW9ucyApIHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPFZlY3RvckNyZWF0b3JQYW5lbFNsb3RPcHRpb25zLCBTZWxmT3B0aW9ucywgSEJveE9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgIC8vIFNlbGZPcHRpb25zXHJcbiAgICAgIHN5bWJvbDogbnVsbCxcclxuICAgICAgbnVtYmVyT2ZWZWN0b3JzOiAxLFxyXG4gICAgICBpY29uQXJyb3dNYWduaXR1ZGU6IDMwLFxyXG4gICAgICBpY29uVmVjdG9yQ29tcG9uZW50czogbnVsbCxcclxuICAgICAgaWNvblBvaW50ZXJBcmVhWERpbGF0aW9uOiAxMCxcclxuICAgICAgaWNvblBvaW50ZXJBcmVhWURpbGF0aW9uOiAxMCxcclxuXHJcbiAgICAgIC8vIEhCb3hPcHRpb25zXHJcbiAgICAgIGlzRGlzcG9zYWJsZTogZmFsc2VcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIHN1cGVyKCB7IHNwYWNpbmc6IDUgfSApO1xyXG5cclxuICAgIC8vIGNvbnZlbmllbmNlIHJlZmVyZW5jZVxyXG4gICAgY29uc3QgbW9kZWxWaWV3VHJhbnNmb3JtID0gZ3JhcGgubW9kZWxWaWV3VHJhbnNmb3JtUHJvcGVydHkudmFsdWU7XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBDcmVhdGUgdGhlIGljb25cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIC8vIEdldCB0aGUgY29tcG9uZW50cyBpbiB2aWV3IGNvb3JkaW5hdGVzLlxyXG4gICAgY29uc3QgaWNvblZpZXdDb21wb25lbnRzID0gbW9kZWxWaWV3VHJhbnNmb3JtLnZpZXdUb01vZGVsRGVsdGEoIG9wdGlvbnMuaWNvblZlY3RvckNvbXBvbmVudHMgfHwgaW5pdGlhbFZlY3RvckNvbXBvbmVudHMgKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgdGhlIGljb24uXHJcbiAgICBjb25zdCBpY29uTm9kZSA9IFZlY3RvckFkZGl0aW9uSWNvbkZhY3RvcnkuY3JlYXRlVmVjdG9yQ3JlYXRvclBhbmVsSWNvbiggaWNvblZpZXdDb21wb25lbnRzLFxyXG4gICAgICB2ZWN0b3JTZXQudmVjdG9yQ29sb3JQYWxldHRlLCBvcHRpb25zLmljb25BcnJvd01hZ25pdHVkZSApO1xyXG5cclxuICAgIC8vIE1ha2UgdGhlIGljb25Ob2RlIGVhc2llciB0byBncmFiXHJcbiAgICBpY29uTm9kZS5tb3VzZUFyZWEgPSBpY29uTm9kZS5sb2NhbEJvdW5kcy5kaWxhdGVkWFkoIG9wdGlvbnMuaWNvblBvaW50ZXJBcmVhWERpbGF0aW9uLCBvcHRpb25zLmljb25Qb2ludGVyQXJlYVlEaWxhdGlvbiApO1xyXG4gICAgaWNvbk5vZGUudG91Y2hBcmVhID0gaWNvbk5vZGUubG9jYWxCb3VuZHMuZGlsYXRlZFhZKCBvcHRpb25zLmljb25Qb2ludGVyQXJlYVhEaWxhdGlvbiwgb3B0aW9ucy5pY29uUG9pbnRlckFyZWFZRGlsYXRpb24gKTtcclxuXHJcbiAgICAvLyBHZXQgdGhlIGNvbXBvbmVudHMgaW4gbW9kZWwgY29vcmRpbmF0ZXMgb2YgdGhlIGljb24uIFVzZWQgdG8gYW5pbWF0ZSB0aGUgdmVjdG9yIHRvIHRoZSBpY29uIGNvbXBvbmVudHMuXHJcbiAgICBjb25zdCBpY29uQ29tcG9uZW50cyA9IG1vZGVsVmlld1RyYW5zZm9ybS52aWV3VG9Nb2RlbERlbHRhKCBpY29uVmlld0NvbXBvbmVudHNcclxuICAgICAgLm5vcm1hbGl6ZWQoKS50aW1lc1NjYWxhciggb3B0aW9ucy5pY29uQXJyb3dNYWduaXR1ZGUgKSApO1xyXG5cclxuICAgIC8vIENyZWF0ZSBhIGZpeGVkLXNpemUgYm94IGZvciB0aGUgaWNvbi4gVGhlIEljb24gaXMgcGxhY2VkIGluIGFuIGFsaWduQm94IHRvIGVuc3VyZSB0aGUgSWNvblxyXG4gICAgLy8gY29udGFpbnMgdGhlIHNhbWUgbG9jYWwgd2lkdGggcmVnYXJkbGVzcyBvZiB0aGUgaW5pdGlhbCB2ZWN0b3IgY29tcG9uZW50cy4gVGhpcyBlbnN1cmVzIHRoYXRcclxuICAgIC8vIHRoZSBsYWJlbCBvZiB0aGUgc2xvdCBpcyBpbiB0aGUgc2FtZSBwbGFjZSByZWdhcmRsZXNzIG9mIHRoZSBpY29uIHNpemUuXHJcbiAgICB0aGlzLmFkZENoaWxkKCBuZXcgQWxpZ25Cb3goIGljb25Ob2RlLCB7XHJcbiAgICAgIGFsaWduQm91bmRzOiBuZXcgQm91bmRzMiggMCwgMCwgQVJST1dfSUNPTl9DT05UQUlORVJfV0lEVEgsIGljb25Ob2RlLmhlaWdodCApXHJcbiAgICB9ICkgKTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIENyZWF0ZSB0aGUgbGFiZWwgb2YgdGhlIHNsb3RcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIGlmICggb3B0aW9ucy5zeW1ib2wgKSB7XHJcbiAgICAgIHRoaXMuYWRkQ2hpbGQoIG5ldyBBcnJvd092ZXJTeW1ib2xOb2RlKCBvcHRpb25zLnN5bWJvbCApICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBDcmVhdGlvbiBvZiBWZWN0b3JzIChTZWUgIyMgSW1wbGVtZW50YXRpb24gb2YgY3JlYXRpb24gb2YgVmVjdG9ycyBhYm92ZSlcclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIC8vIHJlbW92ZUlucHV0TGlzdGVuZXIgaXMgdW5uZWNlc3NhcnksIGV4aXN0cyBmb3IgdGhlIGxpZmV0aW1lIG9mIHRoZSBzaW0uXHJcbiAgICBpY29uTm9kZS5hZGRJbnB1dExpc3RlbmVyKCBEcmFnTGlzdGVuZXIuY3JlYXRlRm9yd2FyZGluZ0xpc3RlbmVyKCBldmVudCA9PiB7XHJcblxyXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgLy8gU3RlcCAxOiBXaGVuIHRoZSBpY29uIGlzIGNsaWNrZWQsIGNyZWF0ZSBhIG5ldyBWZWN0b3JcclxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICAvLyBGaW5kIHdoZXJlIHRoZSBpY29uIHdhcyBjbGlja2VkIHJlbGF0aXZlIHRvIHRoZSBzY2VuZSBub2RlICh2aWV3IGNvb3JkaW5hdGVzKVxyXG4gICAgICBjb25zdCB2ZWN0b3JDZW50ZXJWaWV3ID0gc2NlbmVOb2RlLmdsb2JhbFRvTG9jYWxQb2ludCggZXZlbnQucG9pbnRlci5wb2ludCApO1xyXG5cclxuICAgICAgLy8gQ29udmVydCB0aGUgdmlldyBjb29yZGluYXRlcyBvZiB3aGVyZSB0aGUgaWNvbiB3YXMgY2xpY2tlZCBpbnRvIG1vZGVsIGNvb3JkaW5hdGVzXHJcbiAgICAgIGNvbnN0IHZlY3RvckNlbnRlck1vZGVsID0gZ3JhcGgubW9kZWxWaWV3VHJhbnNmb3JtUHJvcGVydHkudmFsdWUudmlld1RvTW9kZWxQb3NpdGlvbiggdmVjdG9yQ2VudGVyVmlldyApO1xyXG5cclxuICAgICAgLy8gQ2FsY3VsYXRlIHdoZXJlIHRoZSB0YWlsIHBvc2l0aW9uIGlzIHJlbGF0aXZlIHRvIHRoZSBzY2VuZSBub2RlXHJcbiAgICAgIGNvbnN0IHZlY3RvclRhaWxQb3NpdGlvbiA9IHZlY3RvckNlbnRlck1vZGVsLm1pbnVzKCBpbml0aWFsVmVjdG9yQ29tcG9uZW50cy50aW1lc1NjYWxhciggMC41ICkgKTtcclxuXHJcbiAgICAgIC8vIENyZWF0ZSB0aGUgbmV3IFZlY3RvciBNb2RlbFxyXG4gICAgICBjb25zdCB2ZWN0b3IgPSBuZXcgVmVjdG9yKCB2ZWN0b3JUYWlsUG9zaXRpb24sIGluaXRpYWxWZWN0b3JDb21wb25lbnRzLCBncmFwaCwgdmVjdG9yU2V0LCBvcHRpb25zLnN5bWJvbCApO1xyXG5cclxuICAgICAgdmVjdG9yU2V0LnZlY3RvcnMucHVzaCggdmVjdG9yICk7XHJcblxyXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgLy8gU3RlcCAyOiBBIGNhbGwgdG8gdGhlIFNjZW5lIE5vZGUgaXMgbWFkZSwgcGFzc2luZyB0aGUgY3JlYXRlZCBWZWN0b3IgdG8gY3JlYXRlIHRoZSBzdWJzZXF1ZW50IHZpZXdzXHJcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgICAgc2NlbmVOb2RlLnJlZ2lzdGVyVmVjdG9yKCB2ZWN0b3IsIHZlY3RvclNldCwgZXZlbnQgKTtcclxuXHJcbiAgICAgIC8vIEhpZGUgdGhlIGljb24gd2hlbiB3ZSd2ZSByZWFjaGVkIHRoZSBudW1iZXJPZlZlY3RvcnMgbGltaXRcclxuICAgICAgaWNvbk5vZGUudmlzaWJsZSA9ICggdmVjdG9yU2V0LnZlY3RvcnMubGVuZ3RoUHJvcGVydHkudmFsdWUgPCBvcHRpb25zLm51bWJlck9mVmVjdG9ycyApO1xyXG5cclxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgIC8vIFN0ZXAgMzogT25jZSB0aGUgVmVjdG9yIGluZGljYXRlcyB0aGUgVmVjdG9yIHdhcyBkcm9wcGVkIG91dHNpZGUgdGhlIEdyYXBoLCBhbmltYXRlIGFuZFxyXG4gICAgICAvLyBkaXNwb3NlIHRoZSBWZWN0b3IsIHNpZ25hbGluZyB0byB0aGUgU2NlbmVOb2RlIHRvIGRpc3Bvc2Ugb2YgdGhlIHZpZXdzLlxyXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAgIGNvbnN0IGFuaW1hdGVWZWN0b3JCYWNrTGlzdGVuZXIgPSAoIGFuaW1hdGVCYWNrOiBib29sZWFuICkgPT4ge1xyXG4gICAgICAgIGlmICggYW5pbWF0ZUJhY2sgKSB7XHJcblxyXG4gICAgICAgICAgLy8gR2V0IHRoZSBtb2RlbCBwb3NpdGlvbiBvZiB0aGUgaWNvbiBub2RlLlxyXG4gICAgICAgICAgY29uc3QgaWNvblBvc2l0aW9uID0gZ3JhcGgubW9kZWxWaWV3VHJhbnNmb3JtUHJvcGVydHkudmFsdWUudmlld1RvTW9kZWxCb3VuZHMoIHNjZW5lTm9kZS5ib3VuZHNPZiggaWNvbk5vZGUgKSApLmNlbnRlcjtcclxuXHJcbiAgICAgICAgICAvLyBBbmltYXRlIHRoZSB2ZWN0b3IgdG8gaXRzIGljb24gaW4gdGhlIHBhbmVsLlxyXG4gICAgICAgICAgdmVjdG9yLmFuaW1hdGVUb1BvaW50KCBpY29uUG9zaXRpb24sIGljb25Db21wb25lbnRzLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHZlY3RvclNldC52ZWN0b3JzLnJlbW92ZSggdmVjdG9yICk7XHJcbiAgICAgICAgICAgIHZlY3Rvci5kaXNwb3NlKCk7XHJcbiAgICAgICAgICB9ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgICB2ZWN0b3IuYW5pbWF0ZUJhY2tQcm9wZXJ0eS5saW5rKCBhbmltYXRlVmVjdG9yQmFja0xpc3RlbmVyICk7IC8vIHVubGluayByZXF1aXJlZCB3aGVuIHZlY3RvciBpcyByZW1vdmVkXHJcblxyXG4gICAgICAvLyBPYnNlcnZlIHdoZW4gdGhlIHZlY3RvciBpcyByZW1vdmVkIGFuZCBjbGVhbiB1cC5cclxuICAgICAgY29uc3QgcmVtb3ZlVmVjdG9yTGlzdGVuZXIgPSAoIHJlbW92ZWRWZWN0b3I6IFZlY3RvciApID0+IHtcclxuICAgICAgICBpZiAoIHJlbW92ZWRWZWN0b3IgPT09IHZlY3RvciApIHtcclxuICAgICAgICAgIGljb25Ob2RlLnZpc2libGUgPSB0cnVlO1xyXG4gICAgICAgICAgdmVjdG9yLmFuaW1hdGVCYWNrUHJvcGVydHkudW5saW5rKCBhbmltYXRlVmVjdG9yQmFja0xpc3RlbmVyICk7XHJcbiAgICAgICAgICB2ZWN0b3JTZXQudmVjdG9ycy5yZW1vdmVJdGVtUmVtb3ZlZExpc3RlbmVyKCByZW1vdmVWZWN0b3JMaXN0ZW5lciApO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgICAgdmVjdG9yU2V0LnZlY3RvcnMuYWRkSXRlbVJlbW92ZWRMaXN0ZW5lciggcmVtb3ZlVmVjdG9yTGlzdGVuZXIgKTtcclxuICAgIH0gKSApO1xyXG4gIH1cclxufVxyXG5cclxudmVjdG9yQWRkaXRpb24ucmVnaXN0ZXIoICdWZWN0b3JDcmVhdG9yUGFuZWxTbG90JywgVmVjdG9yQ3JlYXRvclBhbmVsU2xvdCApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLE9BQU8sTUFBTSwrQkFBK0I7QUFFbkQsU0FBU0MsUUFBUSxFQUFFQyxZQUFZLEVBQUVDLElBQUksUUFBcUIsbUNBQW1DO0FBQzdGLE9BQU9DLGNBQWMsTUFBTSx5QkFBeUI7QUFFcEQsT0FBT0MsTUFBTSxNQUFNLG9CQUFvQjtBQUV2QyxPQUFPQyxtQkFBbUIsTUFBTSwwQkFBMEI7QUFDMUQsT0FBT0MseUJBQXlCLE1BQU0sZ0NBQWdDO0FBRXRFLE9BQU9DLFNBQVMsTUFBTSx1Q0FBdUM7O0FBRTdEO0FBQ0E7QUFDQTtBQUNBLE1BQU1DLDBCQUEwQixHQUFHLEVBQUU7QUFnQnJDLGVBQWUsTUFBTUMsc0JBQXNCLFNBQVNQLElBQUksQ0FBQztFQUV2RDtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTUSxXQUFXQSxDQUFFQyxLQUFZLEVBQUVDLFNBQW9CLEVBQUVDLFNBQW9CLEVBQUVDLHVCQUFnQyxFQUMxRkMsZUFBK0MsRUFBRztJQUVwRSxNQUFNQyxPQUFPLEdBQUdULFNBQVMsQ0FBMEQsQ0FBQyxDQUFFO01BRXBGO01BQ0FVLE1BQU0sRUFBRSxJQUFJO01BQ1pDLGVBQWUsRUFBRSxDQUFDO01BQ2xCQyxrQkFBa0IsRUFBRSxFQUFFO01BQ3RCQyxvQkFBb0IsRUFB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