// Copyright 2019-2023, University of Colorado Boulder

/**
 * Explore1DGraphControlPanel is the graph control panel for the 'Explore 1D' screen.
 * It exists for the lifetime of the sim and is not intended to be disposed.
 *
 * @author Brandon Li
 * @author Chris Malley (PixelZoom, Inc.)
 */

import { AlignBox, AlignGroup, Node, VBox } from '../../../../scenery/js/imports.js';
import GraphOrientations from '../../common/model/GraphOrientations.js';
import VectorAdditionConstants from '../../common/VectorAdditionConstants.js';
import GraphControlPanel from '../../common/view/GraphControlPanel.js';
import SumCheckbox from '../../common/view/SumCheckbox.js';
import ValuesCheckbox from '../../common/view/ValuesCheckbox.js';
import VectorAdditionGridCheckbox from '../../common/view/VectorAdditionGridCheckbox.js';
import vectorAddition from '../../vectorAddition.js';
export default class Explore1DGraphControlPanel extends GraphControlPanel {
  constructor(horizontalVectorSet, verticalVectorSet, viewProperties, providedOptions) {
    const options = providedOptions;
    const horizontalSumCheckbox = new SumCheckbox(horizontalVectorSet.sumVisibleProperty, horizontalVectorSet.vectorColorPalette);
    const verticalSumCheckbox = new SumCheckbox(verticalVectorSet.sumVisibleProperty, verticalVectorSet.vectorColorPalette);

    // Show the Sum checkbox that matches the selected scene.
    // unlink is unnecessary, exists for the lifetime of the sim.
    viewProperties.graphOrientationProperty.link(gridOrientation => {
      horizontalSumCheckbox.visible = gridOrientation === GraphOrientations.HORIZONTAL;
      verticalSumCheckbox.visible = gridOrientation === GraphOrientations.VERTICAL;
    });

    // Values
    const valuesCheckbox = new ValuesCheckbox(viewProperties.valuesVisibleProperty);

    // Grid
    const gridCheckbox = new VectorAdditionGridCheckbox(viewProperties.gridVisibleProperty);

    // To make all checkboxes the same height
    const alignBoxOptions = {
      group: new AlignGroup({
        matchHorizontal: false,
        matchVertical: true
      })
    };
    super([
    // checkboxes, wrapped with AlignBox so that they are all the same height
    new VBox({
      spacing: VectorAdditionConstants.CHECKBOX_Y_SPACING,
      align: 'left',
      children: [new Node({
        children: [new AlignBox(horizontalSumCheckbox, alignBoxOptions), new AlignBox(verticalSumCheckbox, alignBoxOptions)]
      }), new AlignBox(valuesCheckbox, alignBoxOptions), new AlignBox(gridCheckbox, alignBoxOptions)]
    })], options);
  }
}
vectorAddition.register('Explore1DGraphControlPanel', Explore1DGraphControlPanel);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJBbGlnbkJveCIsIkFsaWduR3JvdXAiLCJOb2RlIiwiVkJveCIsIkdyYXBoT3JpZW50YXRpb25zIiwiVmVjdG9yQWRkaXRpb25Db25zdGFudHMiLCJHcmFwaENvbnRyb2xQYW5lbCIsIlN1bUNoZWNrYm94IiwiVmFsdWVzQ2hlY2tib3giLCJWZWN0b3JBZGRpdGlvbkdyaWRDaGVja2JveCIsInZlY3RvckFkZGl0aW9uIiwiRXhwbG9yZTFER3JhcGhDb250cm9sUGFuZWwiLCJjb25zdHJ1Y3RvciIsImhvcml6b250YWxWZWN0b3JTZXQiLCJ2ZXJ0aWNhbFZlY3RvclNldCIsInZpZXdQcm9wZXJ0aWVzIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsImhvcml6b250YWxTdW1DaGVja2JveCIsInN1bVZpc2libGVQcm9wZXJ0eSIsInZlY3RvckNvbG9yUGFsZXR0ZSIsInZlcnRpY2FsU3VtQ2hlY2tib3giLCJncmFwaE9yaWVudGF0aW9uUHJvcGVydHkiLCJsaW5rIiwiZ3JpZE9yaWVudGF0aW9uIiwidmlzaWJsZSIsIkhPUklaT05UQUwiLCJWRVJUSUNBTCIsInZhbHVlc0NoZWNrYm94IiwidmFsdWVzVmlzaWJsZVByb3BlcnR5IiwiZ3JpZENoZWNrYm94IiwiZ3JpZFZpc2libGVQcm9wZXJ0eSIsImFsaWduQm94T3B0aW9ucyIsImdyb3VwIiwibWF0Y2hIb3Jpem9udGFsIiwibWF0Y2hWZXJ0aWNhbCIsInNwYWNpbmciLCJDSEVDS0JPWF9ZX1NQQUNJTkciLCJhbGlnbiIsImNoaWxkcmVuIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJFeHBsb3JlMURHcmFwaENvbnRyb2xQYW5lbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOS0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBFeHBsb3JlMURHcmFwaENvbnRyb2xQYW5lbCBpcyB0aGUgZ3JhcGggY29udHJvbCBwYW5lbCBmb3IgdGhlICdFeHBsb3JlIDFEJyBzY3JlZW4uXHJcbiAqIEl0IGV4aXN0cyBmb3IgdGhlIGxpZmV0aW1lIG9mIHRoZSBzaW0gYW5kIGlzIG5vdCBpbnRlbmRlZCB0byBiZSBkaXNwb3NlZC5cclxuICpcclxuICogQGF1dGhvciBCcmFuZG9uIExpXHJcbiAqIEBhdXRob3IgQ2hyaXMgTWFsbGV5IChQaXhlbFpvb20sIEluYy4pXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgQWxpZ25Cb3gsIEFsaWduR3JvdXAsIE5vZGUsIFZCb3ggfSBmcm9tICcuLi8uLi8uLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgR3JhcGhPcmllbnRhdGlvbnMgZnJvbSAnLi4vLi4vY29tbW9uL21vZGVsL0dyYXBoT3JpZW50YXRpb25zLmpzJztcclxuaW1wb3J0IFZlY3RvclNldCBmcm9tICcuLi8uLi9jb21tb24vbW9kZWwvVmVjdG9yU2V0LmpzJztcclxuaW1wb3J0IFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzIGZyb20gJy4uLy4uL2NvbW1vbi9WZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5qcyc7XHJcbmltcG9ydCBHcmFwaENvbnRyb2xQYW5lbCwgeyBHcmFwaENvbnRyb2xQYW5lbE9wdGlvbnMgfSBmcm9tICcuLi8uLi9jb21tb24vdmlldy9HcmFwaENvbnRyb2xQYW5lbC5qcyc7XHJcbmltcG9ydCBTdW1DaGVja2JveCBmcm9tICcuLi8uLi9jb21tb24vdmlldy9TdW1DaGVja2JveC5qcyc7XHJcbmltcG9ydCBWYWx1ZXNDaGVja2JveCBmcm9tICcuLi8uLi9jb21tb24vdmlldy9WYWx1ZXNDaGVja2JveC5qcyc7XHJcbmltcG9ydCBWZWN0b3JBZGRpdGlvbkdyaWRDaGVja2JveCBmcm9tICcuLi8uLi9jb21tb24vdmlldy9WZWN0b3JBZGRpdGlvbkdyaWRDaGVja2JveC5qcyc7XHJcbmltcG9ydCB2ZWN0b3JBZGRpdGlvbiBmcm9tICcuLi8uLi92ZWN0b3JBZGRpdGlvbi5qcyc7XHJcbmltcG9ydCBFeHBsb3JlMURWaWV3UHJvcGVydGllcyBmcm9tICcuL0V4cGxvcmUxRFZpZXdQcm9wZXJ0aWVzLmpzJztcclxuaW1wb3J0IHsgRW1wdHlTZWxmT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IEVtcHR5U2VsZk9wdGlvbnM7XHJcblxyXG50eXBlIEV4cGxvcmUxREdyYXBoQ29udHJvbFBhbmVsT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgR3JhcGhDb250cm9sUGFuZWxPcHRpb25zO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRXhwbG9yZTFER3JhcGhDb250cm9sUGFuZWwgZXh0ZW5kcyBHcmFwaENvbnRyb2xQYW5lbCB7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggaG9yaXpvbnRhbFZlY3RvclNldDogVmVjdG9yU2V0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgdmVydGljYWxWZWN0b3JTZXQ6IFZlY3RvclNldCxcclxuICAgICAgICAgICAgICAgICAgICAgIHZpZXdQcm9wZXJ0aWVzOiBFeHBsb3JlMURWaWV3UHJvcGVydGllcyxcclxuICAgICAgICAgICAgICAgICAgICAgIHByb3ZpZGVkT3B0aW9ucz86IEV4cGxvcmUxREdyYXBoQ29udHJvbFBhbmVsT3B0aW9ucyApIHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gcHJvdmlkZWRPcHRpb25zO1xyXG5cclxuICAgIGNvbnN0IGhvcml6b250YWxTdW1DaGVja2JveCA9IG5ldyBTdW1DaGVja2JveCggaG9yaXpvbnRhbFZlY3RvclNldC5zdW1WaXNpYmxlUHJvcGVydHksXHJcbiAgICAgIGhvcml6b250YWxWZWN0b3JTZXQudmVjdG9yQ29sb3JQYWxldHRlICk7XHJcblxyXG4gICAgY29uc3QgdmVydGljYWxTdW1DaGVja2JveCA9IG5ldyBTdW1DaGVja2JveCggdmVydGljYWxWZWN0b3JTZXQuc3VtVmlzaWJsZVByb3BlcnR5LFxyXG4gICAgICB2ZXJ0aWNhbFZlY3RvclNldC52ZWN0b3JDb2xvclBhbGV0dGUgKTtcclxuXHJcbiAgICAvLyBTaG93IHRoZSBTdW0gY2hlY2tib3ggdGhhdCBtYXRjaGVzIHRoZSBzZWxlY3RlZCBzY2VuZS5cclxuICAgIC8vIHVubGluayBpcyB1bm5lY2Vzc2FyeSwgZXhpc3RzIGZvciB0aGUgbGlmZXRpbWUgb2YgdGhlIHNpbS5cclxuICAgIHZpZXdQcm9wZXJ0aWVzLmdyYXBoT3JpZW50YXRpb25Qcm9wZXJ0eS5saW5rKCBncmlkT3JpZW50YXRpb24gPT4ge1xyXG4gICAgICBob3Jpem9udGFsU3VtQ2hlY2tib3gudmlzaWJsZSA9ICggZ3JpZE9yaWVudGF0aW9uID09PSBHcmFwaE9yaWVudGF0aW9ucy5IT1JJWk9OVEFMICk7XHJcbiAgICAgIHZlcnRpY2FsU3VtQ2hlY2tib3gudmlzaWJsZSA9ICggZ3JpZE9yaWVudGF0aW9uID09PSBHcmFwaE9yaWVudGF0aW9ucy5WRVJUSUNBTCApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIFZhbHVlc1xyXG4gICAgY29uc3QgdmFsdWVzQ2hlY2tib3ggPSBuZXcgVmFsdWVzQ2hlY2tib3goIHZpZXdQcm9wZXJ0aWVzLnZhbHVlc1Zpc2libGVQcm9wZXJ0eSApO1xyXG5cclxuICAgIC8vIEdyaWRcclxuICAgIGNvbnN0IGdyaWRDaGVja2JveCA9IG5ldyBWZWN0b3JBZGRpdGlvbkdyaWRDaGVja2JveCggdmlld1Byb3BlcnRpZXMuZ3JpZFZpc2libGVQcm9wZXJ0eSApO1xyXG5cclxuICAgIC8vIFRvIG1ha2UgYWxsIGNoZWNrYm94ZXMgdGhlIHNhbWUgaGVpZ2h0XHJcbiAgICBjb25zdCBhbGlnbkJveE9wdGlvbnMgPSB7XHJcbiAgICAgIGdyb3VwOiBuZXcgQWxpZ25Hcm91cCgge1xyXG4gICAgICAgIG1hdGNoSG9yaXpvbnRhbDogZmFsc2UsXHJcbiAgICAgICAgbWF0Y2hWZXJ0aWNhbDogdHJ1ZVxyXG4gICAgICB9IClcclxuICAgIH07XHJcblxyXG4gICAgc3VwZXIoIFtcclxuXHJcbiAgICAgIC8vIGNoZWNrYm94ZXMsIHdyYXBwZWQgd2l0aCBBbGlnbkJveCBzbyB0aGF0IHRoZXkgYXJlIGFsbCB0aGUgc2FtZSBoZWlnaHRcclxuICAgICAgbmV3IFZCb3goIHtcclxuICAgICAgICBzcGFjaW5nOiBWZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5DSEVDS0JPWF9ZX1NQQUNJTkcsXHJcbiAgICAgICAgYWxpZ246ICdsZWZ0JyxcclxuICAgICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgICAgbmV3IE5vZGUoIHtcclxuICAgICAgICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICAgICAgICBuZXcgQWxpZ25Cb3goIGhvcml6b250YWxTdW1DaGVja2JveCwgYWxpZ25Cb3hPcHRpb25zICksXHJcbiAgICAgICAgICAgICAgbmV3IEFsaWduQm94KCB2ZXJ0aWNhbFN1bUNoZWNrYm94LCBhbGlnbkJveE9wdGlvbnMgKVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgICB9ICksXHJcbiAgICAgICAgICBuZXcgQWxpZ25Cb3goIHZhbHVlc0NoZWNrYm94LCBhbGlnbkJveE9wdGlvbnMgKSxcclxuICAgICAgICAgIG5ldyBBbGlnbkJveCggZ3JpZENoZWNrYm94LCBhbGlnbkJveE9wdGlvbnMgKVxyXG4gICAgICAgIF1cclxuICAgICAgfSApXHJcbiAgICBdLCBvcHRpb25zICk7XHJcbiAgfVxyXG59XHJcblxyXG52ZWN0b3JBZGRpdGlvbi5yZWdpc3RlciggJ0V4cGxvcmUxREdyYXBoQ29udHJvbFBhbmVsJywgRXhwbG9yZTFER3JhcGhDb250cm9sUGFuZWwgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFNBQVNBLFFBQVEsRUFBRUMsVUFBVSxFQUFFQyxJQUFJLEVBQUVDLElBQUksUUFBUSxtQ0FBbUM7QUFDcEYsT0FBT0MsaUJBQWlCLE1BQU0seUNBQXlDO0FBRXZFLE9BQU9DLHVCQUF1QixNQUFNLHlDQUF5QztBQUM3RSxPQUFPQyxpQkFBaUIsTUFBb0Msd0NBQXdDO0FBQ3BHLE9BQU9DLFdBQVcsTUFBTSxrQ0FBa0M7QUFDMUQsT0FBT0MsY0FBYyxNQUFNLHFDQUFxQztBQUNoRSxPQUFPQywwQkFBMEIsTUFBTSxpREFBaUQ7QUFDeEYsT0FBT0MsY0FBYyxNQUFNLHlCQUF5QjtBQVFwRCxlQUFlLE1BQU1DLDBCQUEwQixTQUFTTCxpQkFBaUIsQ0FBQztFQUVqRU0sV0FBV0EsQ0FBRUMsbUJBQThCLEVBQzlCQyxpQkFBNEIsRUFDNUJDLGNBQXVDLEVBQ3ZDQyxlQUFtRCxFQUFHO0lBRXhFLE1BQU1DLE9BQU8sR0FBR0QsZUFBZTtJQUUvQixNQUFNRSxxQkFBcUIsR0FBRyxJQUFJWCxXQUFXLENBQUVNLG1CQUFtQixDQUFDTSxrQkFBa0IsRUFDbkZOLG1CQUFtQixDQUFDTyxrQkFBbUIsQ0FBQztJQUUxQyxNQUFNQyxtQkFBbUIsR0FBRyxJQUFJZCxXQUFXLENBQUVPLGlCQUFpQixDQUFDSyxrQkFBa0IsRUFDL0VMLGlCQUFpQixDQUFDTSxrQkFBbUIsQ0FBQzs7SUFFeEM7SUFDQTtJQUNBTCxjQUFjLENBQUNPLHdCQUF3QixDQUFDQyxJQUFJLENBQUVDLGVBQWUsSUFBSTtNQUMvRE4scUJBQXFCLENBQUNPLE9BQU8sR0FBS0QsZUFBZSxLQUFLcEIsaUJBQWlCLENBQUNzQixVQUFZO01BQ3BGTCxtQkFBbUIsQ0FBQ0ksT0FBTyxHQUFLRCxlQUFlLEtBQUtwQixpQkFBaUIsQ0FBQ3VCLFFBQVU7SUFDbEYsQ0FBRSxDQUFDOztJQUVIO0lBQ0EsTUFBTUMsY0FBYyxHQUFHLElBQUlwQixjQUFjLENBQUVPLGNBQWMsQ0FBQ2MscUJBQXNCLENBQUM7O0lBRWpGO0lBQ0EsTUFBTUMsWUFBWSxHQUFHLElBQUlyQiwwQkFBMEIsQ0FBRU0sY0FBYyxDQUFDZ0IsbUJBQW9CLENBQUM7O0lBRXpGO0lBQ0EsTUFBTUMsZUFBZSxHQUFHO01BQ3RCQyxLQUFLLEVBQUUsSUFBSWhDLFVBQVUsQ0FBRTtRQUNyQmlDLGVBQWUsRUFBRSxLQUFLO1FBQ3RCQyxhQUFhLEVBQUU7TUFDakIsQ0FBRTtJQUNKLENBQUM7SUFFRCxLQUFLLENBQUU7SUFFTDtJQUNBLElBQUloQyxJQUFJLENBQUU7TUFDUmlDLE9BQU8sRUFBRS9CLHVCQUF1QixDQUFDZ0Msa0JBQWtCO01BQ25EQyxLQUFLLEVBQUUsTUFBTTtNQUNiQyxRQUFRLEVBQUUsQ0FDUixJQUFJckMsSUFBSSxDQUFFO1FBQ1JxQyxRQUFRLEVBQUUsQ0FDUixJQUFJdkMsUUFBUSxDQUFFa0IscUJBQXFCLEVBQUVjLGVBQWdCLENBQUMsRUFDdEQsSUFBSWhDLFFBQVEsQ0FBRXFCLG1CQUFtQixFQUFFVyxlQUFnQixDQUFDO01BRXhELENBQUUsQ0FBQyxFQUNILElBQUloQyxRQUFRLENBQUU0QixjQUFjLEVBQUVJLGVBQWdCLENBQUMsRUFDL0MsSUFBSWhDLFFBQVEsQ0FBRThCLFlBQVksRUFBRUUsZUFBZ0IsQ0FBQztJQUVqRCxDQUFFLENBQUMsQ0FDSixFQUFFZixPQUFRLENBQUM7RUFDZDtBQUNGO0FBRUFQLGNBQWMsQ0FBQzhCLFFBQVEsQ0FBRSw0QkFBNEIsRUFBRTdCLDBCQUEyQixDQUFDIiwiaWdub3JlTGlzdCI6W119