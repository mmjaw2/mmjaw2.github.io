// Copyright 2019-2024, University of Colorado Boulder

/**
 * EquationsScreenView is the view for the 'Equations' screen.
 *
 * @author Martin Veillette
 */

import { AlignGroup, Node } from '../../../../scenery/js/imports.js';
import CoordinateSnapModes from '../../common/model/CoordinateSnapModes.js';
import VectorAdditionConstants from '../../common/VectorAdditionConstants.js';
import CoordinateSnapRadioButtonGroup from '../../common/view/CoordinateSnapRadioButtonGroup.js';
import VectorAdditionScreenView from '../../common/view/VectorAdditionScreenView.js';
import vectorAddition from '../../vectorAddition.js';
import EquationsGraphControlPanel from './EquationsGraphControlPanel.js';
import EquationsSceneNode from './EquationsSceneNode.js';
import EquationsViewProperties from './EquationsViewProperties.js';
export default class EquationsScreenView extends VectorAdditionScreenView {
  // view-specific Properties

  constructor(model, tandem) {
    super(model, tandem);
    this.viewProperties = new EquationsViewProperties();

    // Controls for the graph, at upper right
    const graphControlPanel = new EquationsGraphControlPanel(model.cartesianGraph.vectorSet, model.polarGraph.vectorSet, model.componentStyleProperty, this.viewProperties, {
      right: VectorAdditionConstants.SCREEN_VIEW_BOUNDS.right - VectorAdditionConstants.SCREEN_VIEW_X_MARGIN,
      top: VectorAdditionConstants.SCREEN_VIEW_BOUNDS.top + VectorAdditionConstants.SCREEN_VIEW_Y_MARGIN
    });

    // Coordinate Snap radio buttons, at lower right
    const coordinateSnapRadioButtonGroup = new CoordinateSnapRadioButtonGroup(this.viewProperties.coordinateSnapModeProperty, model.cartesianVectorColorPalette, model.polarVectorColorPalette, {
      left: graphControlPanel.left,
      bottom: this.resetAllButton.bottom
    });

    // Used to make all of the radio button in the Equation toggle box the same effective size.
    const equationButtonsAlignGroup = new AlignGroup({
      matchHorizontal: true,
      matchVertical: true
    });

    // Used to make all of the interactive equations in the Equation toggle box the same effective size.
    const equationsAlignGroup = new AlignGroup({
      matchHorizontal: true,
      matchVertical: true
    });
    const polarScene = new EquationsSceneNode(model.polarGraph, this.viewProperties, model.componentStyleProperty, graphControlPanel.bottom, equationButtonsAlignGroup, equationsAlignGroup);
    const cartesianScene = new EquationsSceneNode(model.cartesianGraph, this.viewProperties, model.componentStyleProperty, graphControlPanel.bottom, equationButtonsAlignGroup, equationsAlignGroup);

    // Switch between scenes to match coordinate snap mode.
    // unlink is unnecessary, exists for the lifetime of the sim.
    this.viewProperties.coordinateSnapModeProperty.link(coordinateSnapMode => {
      this.interruptSubtreeInput(); // cancel interactions when switching scenes
      polarScene.visible = coordinateSnapMode === CoordinateSnapModes.POLAR;
      cartesianScene.visible = coordinateSnapMode === CoordinateSnapModes.CARTESIAN;
    });
    const screenViewRootNode = new Node({
      children: [graphControlPanel, coordinateSnapRadioButtonGroup, polarScene, cartesianScene, this.resetAllButton]
    });
    this.addChild(screenViewRootNode);
  }
  reset() {
    super.reset();
    this.viewProperties.reset();
  }
}
vectorAddition.register('EquationsScreenView', EquationsScreenView);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJBbGlnbkdyb3VwIiwiTm9kZSIsIkNvb3JkaW5hdGVTbmFwTW9kZXMiLCJWZWN0b3JBZGRpdGlvbkNvbnN0YW50cyIsIkNvb3JkaW5hdGVTbmFwUmFkaW9CdXR0b25Hcm91cCIsIlZlY3RvckFkZGl0aW9uU2NyZWVuVmlldyIsInZlY3RvckFkZGl0aW9uIiwiRXF1YXRpb25zR3JhcGhDb250cm9sUGFuZWwiLCJFcXVhdGlvbnNTY2VuZU5vZGUiLCJFcXVhdGlvbnNWaWV3UHJvcGVydGllcyIsIkVxdWF0aW9uc1NjcmVlblZpZXciLCJjb25zdHJ1Y3RvciIsIm1vZGVsIiwidGFuZGVtIiwidmlld1Byb3BlcnRpZXMiLCJncmFwaENvbnRyb2xQYW5lbCIsImNhcnRlc2lhbkdyYXBoIiwidmVjdG9yU2V0IiwicG9sYXJHcmFwaCIsImNvbXBvbmVudFN0eWxlUHJvcGVydHkiLCJyaWdodCIsIlNDUkVFTl9WSUVXX0JPVU5EUyIsIlNDUkVFTl9WSUVXX1hfTUFSR0lOIiwidG9wIiwiU0NSRUVOX1ZJRVdfWV9NQVJHSU4iLCJjb29yZGluYXRlU25hcFJhZGlvQnV0dG9uR3JvdXAiLCJjb29yZGluYXRlU25hcE1vZGVQcm9wZXJ0eSIsImNhcnRlc2lhblZlY3RvckNvbG9yUGFsZXR0ZSIsInBvbGFyVmVjdG9yQ29sb3JQYWxldHRlIiwibGVmdCIsImJvdHRvbSIsInJlc2V0QWxsQnV0dG9uIiwiZXF1YXRpb25CdXR0b25zQWxpZ25Hcm91cCIsIm1hdGNoSG9yaXpvbnRhbCIsIm1hdGNoVmVydGljYWwiLCJlcXVhdGlvbnNBbGlnbkdyb3VwIiwicG9sYXJTY2VuZSIsImNhcnRlc2lhblNjZW5lIiwibGluayIsImNvb3JkaW5hdGVTbmFwTW9kZSIsImludGVycnVwdFN1YnRyZWVJbnB1dCIsInZpc2libGUiLCJQT0xBUiIsIkNBUlRFU0lBTiIsInNjcmVlblZpZXdSb290Tm9kZSIsImNoaWxkcmVuIiwiYWRkQ2hpbGQiLCJyZXNldCIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiRXF1YXRpb25zU2NyZWVuVmlldy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOS0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBFcXVhdGlvbnNTY3JlZW5WaWV3IGlzIHRoZSB2aWV3IGZvciB0aGUgJ0VxdWF0aW9ucycgc2NyZWVuLlxyXG4gKlxyXG4gKiBAYXV0aG9yIE1hcnRpbiBWZWlsbGV0dGVcclxuICovXHJcblxyXG5pbXBvcnQgeyBBbGlnbkdyb3VwLCBOb2RlIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi8uLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuaW1wb3J0IENvb3JkaW5hdGVTbmFwTW9kZXMgZnJvbSAnLi4vLi4vY29tbW9uL21vZGVsL0Nvb3JkaW5hdGVTbmFwTW9kZXMuanMnO1xyXG5pbXBvcnQgVmVjdG9yQWRkaXRpb25Db25zdGFudHMgZnJvbSAnLi4vLi4vY29tbW9uL1ZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLmpzJztcclxuaW1wb3J0IENvb3JkaW5hdGVTbmFwUmFkaW9CdXR0b25Hcm91cCBmcm9tICcuLi8uLi9jb21tb24vdmlldy9Db29yZGluYXRlU25hcFJhZGlvQnV0dG9uR3JvdXAuanMnO1xyXG5pbXBvcnQgVmVjdG9yQWRkaXRpb25TY3JlZW5WaWV3IGZyb20gJy4uLy4uL2NvbW1vbi92aWV3L1ZlY3RvckFkZGl0aW9uU2NyZWVuVmlldy5qcyc7XHJcbmltcG9ydCB2ZWN0b3JBZGRpdGlvbiBmcm9tICcuLi8uLi92ZWN0b3JBZGRpdGlvbi5qcyc7XHJcbmltcG9ydCBFcXVhdGlvbnNNb2RlbCBmcm9tICcuLi9tb2RlbC9FcXVhdGlvbnNNb2RlbC5qcyc7XHJcbmltcG9ydCBFcXVhdGlvbnNHcmFwaENvbnRyb2xQYW5lbCBmcm9tICcuL0VxdWF0aW9uc0dyYXBoQ29udHJvbFBhbmVsLmpzJztcclxuaW1wb3J0IEVxdWF0aW9uc1NjZW5lTm9kZSBmcm9tICcuL0VxdWF0aW9uc1NjZW5lTm9kZS5qcyc7XHJcbmltcG9ydCBFcXVhdGlvbnNWaWV3UHJvcGVydGllcyBmcm9tICcuL0VxdWF0aW9uc1ZpZXdQcm9wZXJ0aWVzLmpzJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEVxdWF0aW9uc1NjcmVlblZpZXcgZXh0ZW5kcyBWZWN0b3JBZGRpdGlvblNjcmVlblZpZXcge1xyXG5cclxuICAvLyB2aWV3LXNwZWNpZmljIFByb3BlcnRpZXNcclxuICBwcml2YXRlIHJlYWRvbmx5IHZpZXdQcm9wZXJ0aWVzOiBFcXVhdGlvbnNWaWV3UHJvcGVydGllcztcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBtb2RlbDogRXF1YXRpb25zTW9kZWwsIHRhbmRlbTogVGFuZGVtICkge1xyXG5cclxuICAgIHN1cGVyKCBtb2RlbCwgdGFuZGVtICk7XHJcblxyXG4gICAgdGhpcy52aWV3UHJvcGVydGllcyA9IG5ldyBFcXVhdGlvbnNWaWV3UHJvcGVydGllcygpO1xyXG5cclxuICAgIC8vIENvbnRyb2xzIGZvciB0aGUgZ3JhcGgsIGF0IHVwcGVyIHJpZ2h0XHJcbiAgICBjb25zdCBncmFwaENvbnRyb2xQYW5lbCA9IG5ldyBFcXVhdGlvbnNHcmFwaENvbnRyb2xQYW5lbChcclxuICAgICAgbW9kZWwuY2FydGVzaWFuR3JhcGgudmVjdG9yU2V0LFxyXG4gICAgICBtb2RlbC5wb2xhckdyYXBoLnZlY3RvclNldCxcclxuICAgICAgbW9kZWwuY29tcG9uZW50U3R5bGVQcm9wZXJ0eSxcclxuICAgICAgdGhpcy52aWV3UHJvcGVydGllcywge1xyXG4gICAgICAgIHJpZ2h0OiBWZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5TQ1JFRU5fVklFV19CT1VORFMucmlnaHQgLSBWZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5TQ1JFRU5fVklFV19YX01BUkdJTixcclxuICAgICAgICB0b3A6IFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLlNDUkVFTl9WSUVXX0JPVU5EUy50b3AgKyBWZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5TQ1JFRU5fVklFV19ZX01BUkdJTlxyXG4gICAgICB9ICk7XHJcblxyXG4gICAgLy8gQ29vcmRpbmF0ZSBTbmFwIHJhZGlvIGJ1dHRvbnMsIGF0IGxvd2VyIHJpZ2h0XHJcbiAgICBjb25zdCBjb29yZGluYXRlU25hcFJhZGlvQnV0dG9uR3JvdXAgPSBuZXcgQ29vcmRpbmF0ZVNuYXBSYWRpb0J1dHRvbkdyb3VwKFxyXG4gICAgICB0aGlzLnZpZXdQcm9wZXJ0aWVzLmNvb3JkaW5hdGVTbmFwTW9kZVByb3BlcnR5LFxyXG4gICAgICBtb2RlbC5jYXJ0ZXNpYW5WZWN0b3JDb2xvclBhbGV0dGUsXHJcbiAgICAgIG1vZGVsLnBvbGFyVmVjdG9yQ29sb3JQYWxldHRlLCB7XHJcbiAgICAgICAgbGVmdDogZ3JhcGhDb250cm9sUGFuZWwubGVmdCxcclxuICAgICAgICBib3R0b206IHRoaXMucmVzZXRBbGxCdXR0b24uYm90dG9tXHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAvLyBVc2VkIHRvIG1ha2UgYWxsIG9mIHRoZSByYWRpbyBidXR0b24gaW4gdGhlIEVxdWF0aW9uIHRvZ2dsZSBib3ggdGhlIHNhbWUgZWZmZWN0aXZlIHNpemUuXHJcbiAgICBjb25zdCBlcXVhdGlvbkJ1dHRvbnNBbGlnbkdyb3VwID0gbmV3IEFsaWduR3JvdXAoIHtcclxuICAgICAgbWF0Y2hIb3Jpem9udGFsOiB0cnVlLFxyXG4gICAgICBtYXRjaFZlcnRpY2FsOiB0cnVlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gVXNlZCB0byBtYWtlIGFsbCBvZiB0aGUgaW50ZXJhY3RpdmUgZXF1YXRpb25zIGluIHRoZSBFcXVhdGlvbiB0b2dnbGUgYm94IHRoZSBzYW1lIGVmZmVjdGl2ZSBzaXplLlxyXG4gICAgY29uc3QgZXF1YXRpb25zQWxpZ25Hcm91cCA9IG5ldyBBbGlnbkdyb3VwKCB7XHJcbiAgICAgIG1hdGNoSG9yaXpvbnRhbDogdHJ1ZSxcclxuICAgICAgbWF0Y2hWZXJ0aWNhbDogdHJ1ZVxyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IHBvbGFyU2NlbmUgPSBuZXcgRXF1YXRpb25zU2NlbmVOb2RlKFxyXG4gICAgICBtb2RlbC5wb2xhckdyYXBoLFxyXG4gICAgICB0aGlzLnZpZXdQcm9wZXJ0aWVzLFxyXG4gICAgICBtb2RlbC5jb21wb25lbnRTdHlsZVByb3BlcnR5LFxyXG4gICAgICBncmFwaENvbnRyb2xQYW5lbC5ib3R0b20sXHJcbiAgICAgIGVxdWF0aW9uQnV0dG9uc0FsaWduR3JvdXAsXHJcbiAgICAgIGVxdWF0aW9uc0FsaWduR3JvdXBcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgY2FydGVzaWFuU2NlbmUgPSBuZXcgRXF1YXRpb25zU2NlbmVOb2RlKFxyXG4gICAgICBtb2RlbC5jYXJ0ZXNpYW5HcmFwaCxcclxuICAgICAgdGhpcy52aWV3UHJvcGVydGllcyxcclxuICAgICAgbW9kZWwuY29tcG9uZW50U3R5bGVQcm9wZXJ0eSxcclxuICAgICAgZ3JhcGhDb250cm9sUGFuZWwuYm90dG9tLFxyXG4gICAgICBlcXVhdGlvbkJ1dHRvbnNBbGlnbkdyb3VwLFxyXG4gICAgICBlcXVhdGlvbnNBbGlnbkdyb3VwXHJcbiAgICApO1xyXG5cclxuICAgIC8vIFN3aXRjaCBiZXR3ZWVuIHNjZW5lcyB0byBtYXRjaCBjb29yZGluYXRlIHNuYXAgbW9kZS5cclxuICAgIC8vIHVubGluayBpcyB1bm5lY2Vzc2FyeSwgZXhpc3RzIGZvciB0aGUgbGlmZXRpbWUgb2YgdGhlIHNpbS5cclxuICAgIHRoaXMudmlld1Byb3BlcnRpZXMuY29vcmRpbmF0ZVNuYXBNb2RlUHJvcGVydHkubGluayggY29vcmRpbmF0ZVNuYXBNb2RlID0+IHtcclxuICAgICAgdGhpcy5pbnRlcnJ1cHRTdWJ0cmVlSW5wdXQoKTsgLy8gY2FuY2VsIGludGVyYWN0aW9ucyB3aGVuIHN3aXRjaGluZyBzY2VuZXNcclxuICAgICAgcG9sYXJTY2VuZS52aXNpYmxlID0gKCBjb29yZGluYXRlU25hcE1vZGUgPT09IENvb3JkaW5hdGVTbmFwTW9kZXMuUE9MQVIgKTtcclxuICAgICAgY2FydGVzaWFuU2NlbmUudmlzaWJsZSA9ICggY29vcmRpbmF0ZVNuYXBNb2RlID09PSBDb29yZGluYXRlU25hcE1vZGVzLkNBUlRFU0lBTiApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IHNjcmVlblZpZXdSb290Tm9kZSA9IG5ldyBOb2RlKCB7XHJcbiAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgZ3JhcGhDb250cm9sUGFuZWwsXHJcbiAgICAgICAgY29vcmRpbmF0ZVNuYXBSYWRpb0J1dHRvbkdyb3VwLFxyXG4gICAgICAgIHBvbGFyU2NlbmUsXHJcbiAgICAgICAgY2FydGVzaWFuU2NlbmUsXHJcbiAgICAgICAgdGhpcy5yZXNldEFsbEJ1dHRvblxyXG4gICAgICBdXHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLmFkZENoaWxkKCBzY3JlZW5WaWV3Um9vdE5vZGUgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSByZXNldCgpOiB2b2lkIHtcclxuICAgIHN1cGVyLnJlc2V0KCk7XHJcbiAgICB0aGlzLnZpZXdQcm9wZXJ0aWVzLnJlc2V0KCk7XHJcbiAgfVxyXG59XHJcblxyXG52ZWN0b3JBZGRpdGlvbi5yZWdpc3RlciggJ0VxdWF0aW9uc1NjcmVlblZpZXcnLCBFcXVhdGlvbnNTY3JlZW5WaWV3ICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFNBQVNBLFVBQVUsRUFBRUMsSUFBSSxRQUFRLG1DQUFtQztBQUVwRSxPQUFPQyxtQkFBbUIsTUFBTSwyQ0FBMkM7QUFDM0UsT0FBT0MsdUJBQXVCLE1BQU0seUNBQXlDO0FBQzdFLE9BQU9DLDhCQUE4QixNQUFNLHFEQUFxRDtBQUNoRyxPQUFPQyx3QkFBd0IsTUFBTSwrQ0FBK0M7QUFDcEYsT0FBT0MsY0FBYyxNQUFNLHlCQUF5QjtBQUVwRCxPQUFPQywwQkFBMEIsTUFBTSxpQ0FBaUM7QUFDeEUsT0FBT0Msa0JBQWtCLE1BQU0seUJBQXlCO0FBQ3hELE9BQU9DLHVCQUF1QixNQUFNLDhCQUE4QjtBQUVsRSxlQUFlLE1BQU1DLG1CQUFtQixTQUFTTCx3QkFBd0IsQ0FBQztFQUV4RTs7RUFHT00sV0FBV0EsQ0FBRUMsS0FBcUIsRUFBRUMsTUFBYyxFQUFHO0lBRTFELEtBQUssQ0FBRUQsS0FBSyxFQUFFQyxNQUFPLENBQUM7SUFFdEIsSUFBSSxDQUFDQyxjQUFjLEdBQUcsSUFBSUwsdUJBQXVCLENBQUMsQ0FBQzs7SUFFbkQ7SUFDQSxNQUFNTSxpQkFBaUIsR0FBRyxJQUFJUiwwQkFBMEIsQ0FDdERLLEtBQUssQ0FBQ0ksY0FBYyxDQUFDQyxTQUFTLEVBQzlCTCxLQUFLLENBQUNNLFVBQVUsQ0FBQ0QsU0FBUyxFQUMxQkwsS0FBSyxDQUFDTyxzQkFBc0IsRUFDNUIsSUFBSSxDQUFDTCxjQUFjLEVBQUU7TUFDbkJNLEtBQUssRUFBRWpCLHVCQUF1QixDQUFDa0Isa0JBQWtCLENBQUNELEtBQUssR0FBR2pCLHVCQUF1QixDQUFDbUIsb0JBQW9CO01BQ3RHQyxHQUFHLEVBQUVwQix1QkFBdUIsQ0FBQ2tCLGtCQUFrQixDQUFDRSxHQUFHLEdBQUdwQix1QkFBdUIsQ0FBQ3FCO0lBQ2hGLENBQUUsQ0FBQzs7SUFFTDtJQUNBLE1BQU1DLDhCQUE4QixHQUFHLElBQUlyQiw4QkFBOEIsQ0FDdkUsSUFBSSxDQUFDVSxjQUFjLENBQUNZLDBCQUEwQixFQUM5Q2QsS0FBSyxDQUFDZSwyQkFBMkIsRUFDakNmLEtBQUssQ0FBQ2dCLHVCQUF1QixFQUFFO01BQzdCQyxJQUFJLEVBQUVkLGlCQUFpQixDQUFDYyxJQUFJO01BQzVCQyxNQUFNLEVBQUUsSUFBSSxDQUFDQyxjQUFjLENBQUNEO0lBQzlCLENBQUUsQ0FBQzs7SUFFTDtJQUNBLE1BQU1FLHlCQUF5QixHQUFHLElBQUloQyxVQUFVLENBQUU7TUFDaERpQyxlQUFlLEVBQUUsSUFBSTtNQUNyQkMsYUFBYSxFQUFFO0lBQ2pCLENBQUUsQ0FBQzs7SUFFSDtJQUNBLE1BQU1DLG1CQUFtQixHQUFHLElBQUluQyxVQUFVLENBQUU7TUFDMUNpQyxlQUFlLEVBQUUsSUFBSTtNQUNyQkMsYUFBYSxFQUFFO0lBQ2pCLENBQUUsQ0FBQztJQUVILE1BQU1FLFVBQVUsR0FBRyxJQUFJNUIsa0JBQWtCLENBQ3ZDSSxLQUFLLENBQUNNLFVBQVUsRUFDaEIsSUFBSSxDQUFDSixjQUFjLEVBQ25CRixLQUFLLENBQUNPLHNCQUFzQixFQUM1QkosaUJBQWlCLENBQUNlLE1BQU0sRUFDeEJFLHlCQUF5QixFQUN6QkcsbUJBQ0YsQ0FBQztJQUVELE1BQU1FLGNBQWMsR0FBRyxJQUFJN0Isa0JBQWtCLENBQzNDSSxLQUFLLENBQUNJLGNBQWMsRUFDcEIsSUFBSSxDQUFDRixjQUFjLEVBQ25CRixLQUFLLENBQUNPLHNCQUFzQixFQUM1QkosaUJBQWlCLENBQUNlLE1BQU0sRUFDeEJFLHlCQUF5QixFQUN6QkcsbUJBQ0YsQ0FBQzs7SUFFRDtJQUNBO0lBQ0EsSUFBSSxDQUFDckIsY0FBYyxDQUFDWSwwQkFBMEIsQ0FBQ1ksSUFBSSxDQUFFQyxrQkFBa0IsSUFBSTtNQUN6RSxJQUFJLENBQUNDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDO01BQzlCSixVQUFVLENBQUNLLE9BQU8sR0FBS0Ysa0JBQWtCLEtBQUtyQyxtQkFBbUIsQ0FBQ3dDLEtBQU87TUFDekVMLGNBQWMsQ0FBQ0ksT0FBTyxHQUFLRixrQkFBa0IsS0FBS3JDLG1CQUFtQixDQUFDeUMsU0FBVztJQUNuRixDQUFFLENBQUM7SUFFSCxNQUFNQyxrQkFBa0IsR0FBRyxJQUFJM0MsSUFBSSxDQUFFO01BQ25DNEMsUUFBUSxFQUFFLENBQ1I5QixpQkFBaUIsRUFDakJVLDhCQUE4QixFQUM5QlcsVUFBVSxFQUNWQyxjQUFjLEVBQ2QsSUFBSSxDQUFDTixjQUFjO0lBRXZCLENBQUUsQ0FBQztJQUNILElBQUksQ0FBQ2UsUUFBUSxDQUFFRixrQkFBbUIsQ0FBQztFQUNyQztFQUVnQkcsS0FBS0EsQ0FBQSxFQUFTO0lBQzVCLEtBQUssQ0FBQ0EsS0FBSyxDQUFDLENBQUM7SUFDYixJQUFJLENBQUNqQyxjQUFjLENBQUNpQyxLQUFLLENBQUMsQ0FBQztFQUM3QjtBQUNGO0FBRUF6QyxjQUFjLENBQUMwQyxRQUFRLENBQUUscUJBQXFCLEVBQUV0QyxtQkFBb0IsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==