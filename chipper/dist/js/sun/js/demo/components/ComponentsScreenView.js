// Copyright 2015-2024, University of Colorado Boulder

/**
 * Demonstration of misc sun UI components.
 * Demos are selected from a combo box, and are instantiated on demand.
 * Use the 'component' query parameter to set the initial selection of the combo box.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import sun from '../../sun.js';
import DemosScreenView from '../DemosScreenView.js';
import demoABSwitch from './demoABSwitch.js';
import demoCarousel from './demoCarousel.js';
import demoCheckbox from './demoCheckbox.js';
import { demoHSlider, demoVSlider } from './demoSlider.js';
import demoComboBox from './demoComboBox.js';
import demoOnOffSwitch from './demoOnOffSwitch.js';
import demoPageControl from './demoPageControl.js';
import demoNumberSpinner from './demoNumberSpinner.js';
import demoNumberPicker from './demoNumberPicker.js';
import demoToggleSwitch from './demoToggleSwitch.js';
import demoAlignGroup from './demoAlignGroup.js';
import demoAccordionBox from './demoAccordionBox.js';
export default class ComponentsScreenView extends DemosScreenView {
  constructor(options) {
    // To add a demo, add an entry here of type DemoItemData.
    const demos = [{
      label: 'ABSwitch',
      createNode: demoABSwitch
    }, {
      label: 'Carousel',
      createNode: demoCarousel
    }, {
      label: 'Checkbox',
      createNode: demoCheckbox
    }, {
      label: 'ComboBox',
      createNode: demoComboBox
    }, {
      label: 'HSlider',
      createNode: demoHSlider
    }, {
      label: 'VSlider',
      createNode: demoVSlider
    }, {
      label: 'OnOffSwitch',
      createNode: demoOnOffSwitch
    }, {
      label: 'PageControl',
      createNode: demoPageControl
    }, {
      label: 'NumberPicker',
      createNode: demoNumberPicker
    }, {
      label: 'NumberSpinner',
      createNode: demoNumberSpinner
    }, {
      label: 'AlignGroup',
      createNode: demoAlignGroup
    }, {
      label: 'AccordionBox',
      createNode: demoAccordionBox
    }, {
      label: 'ToggleSwitch',
      createNode: demoToggleSwitch
    }];
    super(demos, options);
  }
}
sun.register('ComponentsScreenView', ComponentsScreenView);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJzdW4iLCJEZW1vc1NjcmVlblZpZXciLCJkZW1vQUJTd2l0Y2giLCJkZW1vQ2Fyb3VzZWwiLCJkZW1vQ2hlY2tib3giLCJkZW1vSFNsaWRlciIsImRlbW9WU2xpZGVyIiwiZGVtb0NvbWJvQm94IiwiZGVtb09uT2ZmU3dpdGNoIiwiZGVtb1BhZ2VDb250cm9sIiwiZGVtb051bWJlclNwaW5uZXIiLCJkZW1vTnVtYmVyUGlja2VyIiwiZGVtb1RvZ2dsZVN3aXRjaCIsImRlbW9BbGlnbkdyb3VwIiwiZGVtb0FjY29yZGlvbkJveCIsIkNvbXBvbmVudHNTY3JlZW5WaWV3IiwiY29uc3RydWN0b3IiLCJvcHRpb25zIiwiZGVtb3MiLCJsYWJlbCIsImNyZWF0ZU5vZGUiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkNvbXBvbmVudHNTY3JlZW5WaWV3LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE1LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIERlbW9uc3RyYXRpb24gb2YgbWlzYyBzdW4gVUkgY29tcG9uZW50cy5cclxuICogRGVtb3MgYXJlIHNlbGVjdGVkIGZyb20gYSBjb21ibyBib3gsIGFuZCBhcmUgaW5zdGFudGlhdGVkIG9uIGRlbWFuZC5cclxuICogVXNlIHRoZSAnY29tcG9uZW50JyBxdWVyeSBwYXJhbWV0ZXIgdG8gc2V0IHRoZSBpbml0aWFsIHNlbGVjdGlvbiBvZiB0aGUgY29tYm8gYm94LlxyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIENocmlzIE1hbGxleSAoUGl4ZWxab29tLCBJbmMuKVxyXG4gKi9cclxuXHJcbmltcG9ydCB7IEVtcHR5U2VsZk9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IFBpY2tSZXF1aXJlZCBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvUGlja1JlcXVpcmVkLmpzJztcclxuaW1wb3J0IHN1biBmcm9tICcuLi8uLi9zdW4uanMnO1xyXG5pbXBvcnQgRGVtb3NTY3JlZW5WaWV3LCB7IERlbW9zU2NyZWVuVmlld09wdGlvbnMgfSBmcm9tICcuLi9EZW1vc1NjcmVlblZpZXcuanMnO1xyXG5pbXBvcnQgZGVtb0FCU3dpdGNoIGZyb20gJy4vZGVtb0FCU3dpdGNoLmpzJztcclxuaW1wb3J0IGRlbW9DYXJvdXNlbCBmcm9tICcuL2RlbW9DYXJvdXNlbC5qcyc7XHJcbmltcG9ydCBkZW1vQ2hlY2tib3ggZnJvbSAnLi9kZW1vQ2hlY2tib3guanMnO1xyXG5pbXBvcnQgeyBkZW1vSFNsaWRlciwgZGVtb1ZTbGlkZXIgfSBmcm9tICcuL2RlbW9TbGlkZXIuanMnO1xyXG5pbXBvcnQgZGVtb0NvbWJvQm94IGZyb20gJy4vZGVtb0NvbWJvQm94LmpzJztcclxuaW1wb3J0IGRlbW9Pbk9mZlN3aXRjaCBmcm9tICcuL2RlbW9Pbk9mZlN3aXRjaC5qcyc7XHJcbmltcG9ydCBkZW1vUGFnZUNvbnRyb2wgZnJvbSAnLi9kZW1vUGFnZUNvbnRyb2wuanMnO1xyXG5pbXBvcnQgZGVtb051bWJlclNwaW5uZXIgZnJvbSAnLi9kZW1vTnVtYmVyU3Bpbm5lci5qcyc7XHJcbmltcG9ydCBkZW1vTnVtYmVyUGlja2VyIGZyb20gJy4vZGVtb051bWJlclBpY2tlci5qcyc7XHJcbmltcG9ydCBkZW1vVG9nZ2xlU3dpdGNoIGZyb20gJy4vZGVtb1RvZ2dsZVN3aXRjaC5qcyc7XHJcbmltcG9ydCBkZW1vQWxpZ25Hcm91cCBmcm9tICcuL2RlbW9BbGlnbkdyb3VwLmpzJztcclxuaW1wb3J0IGRlbW9BY2NvcmRpb25Cb3ggZnJvbSAnLi9kZW1vQWNjb3JkaW9uQm94LmpzJztcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSBFbXB0eVNlbGZPcHRpb25zO1xyXG50eXBlIENvbXBvbmVudHNTY3JlZW5WaWV3T3B0aW9ucyA9IFNlbGZPcHRpb25zICYgUGlja1JlcXVpcmVkPERlbW9zU2NyZWVuVmlld09wdGlvbnMsICd0YW5kZW0nPjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbXBvbmVudHNTY3JlZW5WaWV3IGV4dGVuZHMgRGVtb3NTY3JlZW5WaWV3IHtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBvcHRpb25zOiBDb21wb25lbnRzU2NyZWVuVmlld09wdGlvbnMgKSB7XHJcblxyXG4gICAgLy8gVG8gYWRkIGEgZGVtbywgYWRkIGFuIGVudHJ5IGhlcmUgb2YgdHlwZSBEZW1vSXRlbURhdGEuXHJcbiAgICBjb25zdCBkZW1vcyA9IFtcclxuICAgICAgeyBsYWJlbDogJ0FCU3dpdGNoJywgY3JlYXRlTm9kZTogZGVtb0FCU3dpdGNoIH0sXHJcbiAgICAgIHsgbGFiZWw6ICdDYXJvdXNlbCcsIGNyZWF0ZU5vZGU6IGRlbW9DYXJvdXNlbCB9LFxyXG4gICAgICB7IGxhYmVsOiAnQ2hlY2tib3gnLCBjcmVhdGVOb2RlOiBkZW1vQ2hlY2tib3ggfSxcclxuICAgICAgeyBsYWJlbDogJ0NvbWJvQm94JywgY3JlYXRlTm9kZTogZGVtb0NvbWJvQm94IH0sXHJcbiAgICAgIHsgbGFiZWw6ICdIU2xpZGVyJywgY3JlYXRlTm9kZTogZGVtb0hTbGlkZXIgfSxcclxuICAgICAgeyBsYWJlbDogJ1ZTbGlkZXInLCBjcmVhdGVOb2RlOiBkZW1vVlNsaWRlciB9LFxyXG4gICAgICB7IGxhYmVsOiAnT25PZmZTd2l0Y2gnLCBjcmVhdGVOb2RlOiBkZW1vT25PZmZTd2l0Y2ggfSxcclxuICAgICAgeyBsYWJlbDogJ1BhZ2VDb250cm9sJywgY3JlYXRlTm9kZTogZGVtb1BhZ2VDb250cm9sIH0sXHJcbiAgICAgIHsgbGFiZWw6ICdOdW1iZXJQaWNrZXInLCBjcmVhdGVOb2RlOiBkZW1vTnVtYmVyUGlja2VyIH0sXHJcbiAgICAgIHsgbGFiZWw6ICdOdW1iZXJTcGlubmVyJywgY3JlYXRlTm9kZTogZGVtb051bWJlclNwaW5uZXIgfSxcclxuICAgICAgeyBsYWJlbDogJ0FsaWduR3JvdXAnLCBjcmVhdGVOb2RlOiBkZW1vQWxpZ25Hcm91cCB9LFxyXG4gICAgICB7IGxhYmVsOiAnQWNjb3JkaW9uQm94JywgY3JlYXRlTm9kZTogZGVtb0FjY29yZGlvbkJveCB9LFxyXG4gICAgICB7IGxhYmVsOiAnVG9nZ2xlU3dpdGNoJywgY3JlYXRlTm9kZTogZGVtb1RvZ2dsZVN3aXRjaCB9XHJcbiAgICBdO1xyXG5cclxuICAgIHN1cGVyKCBkZW1vcywgb3B0aW9ucyApO1xyXG4gIH1cclxufVxyXG5cclxuc3VuLnJlZ2lzdGVyKCAnQ29tcG9uZW50c1NjcmVlblZpZXcnLCBDb21wb25lbnRzU2NyZWVuVmlldyApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFJQSxPQUFPQSxHQUFHLE1BQU0sY0FBYztBQUM5QixPQUFPQyxlQUFlLE1BQWtDLHVCQUF1QjtBQUMvRSxPQUFPQyxZQUFZLE1BQU0sbUJBQW1CO0FBQzVDLE9BQU9DLFlBQVksTUFBTSxtQkFBbUI7QUFDNUMsT0FBT0MsWUFBWSxNQUFNLG1CQUFtQjtBQUM1QyxTQUFTQyxXQUFXLEVBQUVDLFdBQVcsUUFBUSxpQkFBaUI7QUFDMUQsT0FBT0MsWUFBWSxNQUFNLG1CQUFtQjtBQUM1QyxPQUFPQyxlQUFlLE1BQU0sc0JBQXNCO0FBQ2xELE9BQU9DLGVBQWUsTUFBTSxzQkFBc0I7QUFDbEQsT0FBT0MsaUJBQWlCLE1BQU0sd0JBQXdCO0FBQ3RELE9BQU9DLGdCQUFnQixNQUFNLHVCQUF1QjtBQUNwRCxPQUFPQyxnQkFBZ0IsTUFBTSx1QkFBdUI7QUFDcEQsT0FBT0MsY0FBYyxNQUFNLHFCQUFxQjtBQUNoRCxPQUFPQyxnQkFBZ0IsTUFBTSx1QkFBdUI7QUFLcEQsZUFBZSxNQUFNQyxvQkFBb0IsU0FBU2QsZUFBZSxDQUFDO0VBRXpEZSxXQUFXQSxDQUFFQyxPQUFvQyxFQUFHO0lBRXpEO0lBQ0EsTUFBTUMsS0FBSyxHQUFHLENBQ1o7TUFBRUMsS0FBSyxFQUFFLFVBQVU7TUFBRUMsVUFBVSxFQUFFbEI7SUFBYSxDQUFDLEVBQy9DO01BQUVpQixLQUFLLEVBQUUsVUFBVTtNQUFFQyxVQUFVLEVBQUVqQjtJQUFhLENBQUMsRUFDL0M7TUFBRWdCLEtBQUssRUFBRSxVQUFVO01BQUVDLFVBQVUsRUFBRWhCO0lBQWEsQ0FBQyxFQUMvQztNQUFFZSxLQUFLLEVBQUUsVUFBVTtNQUFFQyxVQUFVLEVBQUViO0lBQWEsQ0FBQyxFQUMvQztNQUFFWSxLQUFLLEVBQUUsU0FBUztNQUFFQyxVQUFVLEVBQUVmO0lBQVksQ0FBQyxFQUM3QztNQUFFYyxLQUFLLEVBQUUsU0FBUztNQUFFQyxVQUFVLEVBQUVkO0lBQVksQ0FBQyxFQUM3QztNQUFFYSxLQUFLLEVBQUUsYUFBYTtNQUFFQyxVQUFVLEVBQUVaO0lBQWdCLENBQUMsRUFDckQ7TUFBRVcsS0FBSyxFQUFFLGFBQWE7TUFBRUMsVUFBVSxFQUFFWDtJQUFnQixDQUFDLEVBQ3JEO01BQUVVLEtBQUssRUFBRSxjQUFjO01BQUVDLFVBQVUsRUFBRVQ7SUFBaUIsQ0FBQyxFQUN2RDtNQUFFUSxLQUFLLEVBQUUsZUFBZTtNQUFFQyxVQUFVLEVBQUVWO0lBQWtCLENBQUMsRUFDekQ7TUFBRVMsS0FBSyxFQUFFLFlBQVk7TUFBRUMsVUFBVSxFQUFFUDtJQUFlLENBQUMsRUFDbkQ7TUFBRU0sS0FBSyxFQUFFLGNBQWM7TUFBRUMsVUFBVSxFQUFFTjtJQUFpQixDQUFDLEVBQ3ZEO01BQUVLLEtBQUssRUFBRSxjQUFjO01BQUVDLFVBQVUsRUFBRVI7SUFBaUIsQ0FBQyxDQUN4RDtJQUVELEtBQUssQ0FBRU0sS0FBSyxFQUFFRCxPQUFRLENBQUM7RUFDekI7QUFDRjtBQUVBakIsR0FBRyxDQUFDcUIsUUFBUSxDQUFFLHNCQUFzQixFQUFFTixvQkFBcUIsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==