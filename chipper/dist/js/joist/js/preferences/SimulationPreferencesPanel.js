// Copyright 2021-2023, University of Colorado Boulder

/**
 * The content for the "Simulation" tab in the PreferencesDialog. Contains controls for any simulation-specific
 * preferences.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import { VBox } from '../../../scenery/js/imports.js';
import joist from '../joist.js';
import PreferencesDialog from './PreferencesDialog.js';
import optionize from '../../../phet-core/js/optionize.js';
import PreferencesPanelSection from './PreferencesPanelSection.js';
import PreferencesType from './PreferencesType.js';
import PreferencesPanel from './PreferencesPanel.js';
class SimulationPreferencesPanel extends PreferencesPanel {
  /**
   * @param simulationModel - configuration for the Tab, see PreferencesModel for entries
   * @param selectedTabProperty
   * @param tabVisibleProperty
   * @param [providedOptions]
   */
  constructor(simulationModel, selectedTabProperty, tabVisibleProperty, providedOptions) {
    const options = optionize()({
      labelContent: 'Simulation',
      // phet-io
      phetioVisiblePropertyInstrumented: false
    }, providedOptions);
    super(PreferencesType.SIMULATION, selectedTabProperty, tabVisibleProperty, options);
    const panelContent = new VBox({
      align: 'left',
      spacing: PreferencesDialog.CONTENT_SPACING
    });
    this.addChild(panelContent);

    // Just the provided panel content with its own spacing
    const providedChildren = [];
    simulationModel.customPreferences.forEach(customPreference => {
      const contentNode = customPreference.createContent(options.tandem);
      const preferencesPanelSection = new PreferencesPanelSection({
        contentNode: contentNode
      });
      providedChildren.push(preferencesPanelSection);
    });
    panelContent.children = providedChildren;
  }
}
joist.register('SimulationPreferencesPanel', SimulationPreferencesPanel);
export default SimulationPreferencesPanel;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJWQm94Iiwiam9pc3QiLCJQcmVmZXJlbmNlc0RpYWxvZyIsIm9wdGlvbml6ZSIsIlByZWZlcmVuY2VzUGFuZWxTZWN0aW9uIiwiUHJlZmVyZW5jZXNUeXBlIiwiUHJlZmVyZW5jZXNQYW5lbCIsIlNpbXVsYXRpb25QcmVmZXJlbmNlc1BhbmVsIiwiY29uc3RydWN0b3IiLCJzaW11bGF0aW9uTW9kZWwiLCJzZWxlY3RlZFRhYlByb3BlcnR5IiwidGFiVmlzaWJsZVByb3BlcnR5IiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsImxhYmVsQ29udGVudCIsInBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZCIsIlNJTVVMQVRJT04iLCJwYW5lbENvbnRlbnQiLCJhbGlnbiIsInNwYWNpbmciLCJDT05URU5UX1NQQUNJTkciLCJhZGRDaGlsZCIsInByb3ZpZGVkQ2hpbGRyZW4iLCJjdXN0b21QcmVmZXJlbmNlcyIsImZvckVhY2giLCJjdXN0b21QcmVmZXJlbmNlIiwiY29udGVudE5vZGUiLCJjcmVhdGVDb250ZW50IiwidGFuZGVtIiwicHJlZmVyZW5jZXNQYW5lbFNlY3Rpb24iLCJwdXNoIiwiY2hpbGRyZW4iLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlNpbXVsYXRpb25QcmVmZXJlbmNlc1BhbmVsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFRoZSBjb250ZW50IGZvciB0aGUgXCJTaW11bGF0aW9uXCIgdGFiIGluIHRoZSBQcmVmZXJlbmNlc0RpYWxvZy4gQ29udGFpbnMgY29udHJvbHMgZm9yIGFueSBzaW11bGF0aW9uLXNwZWNpZmljXHJcbiAqIHByZWZlcmVuY2VzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgeyBOb2RlLCBWQm94LCBWQm94T3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBqb2lzdCBmcm9tICcuLi9qb2lzdC5qcyc7XHJcbmltcG9ydCBQcmVmZXJlbmNlc0RpYWxvZyBmcm9tICcuL1ByZWZlcmVuY2VzRGlhbG9nLmpzJztcclxuaW1wb3J0IHsgU2ltdWxhdGlvbk1vZGVsIH0gZnJvbSAnLi9QcmVmZXJlbmNlc01vZGVsLmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBFbXB0eVNlbGZPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBQaWNrUmVxdWlyZWQgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1BpY2tSZXF1aXJlZC5qcyc7XHJcbmltcG9ydCBQcmVmZXJlbmNlc1BhbmVsU2VjdGlvbiBmcm9tICcuL1ByZWZlcmVuY2VzUGFuZWxTZWN0aW9uLmpzJztcclxuaW1wb3J0IFByZWZlcmVuY2VzVHlwZSBmcm9tICcuL1ByZWZlcmVuY2VzVHlwZS5qcyc7XHJcbmltcG9ydCBUUmVhZE9ubHlQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IFByZWZlcmVuY2VzUGFuZWwsIHsgUHJlZmVyZW5jZXNQYW5lbE9wdGlvbnMgfSBmcm9tICcuL1ByZWZlcmVuY2VzUGFuZWwuanMnO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IEVtcHR5U2VsZk9wdGlvbnM7XHJcbnR5cGUgU2ltdWxhdGlvblByZWZlcmVuY2VzUGFuZWxPcHRpb25zID0gU2VsZk9wdGlvbnMgJlxyXG4gIFByZWZlcmVuY2VzUGFuZWxPcHRpb25zICZcclxuXHJcbiAgLy8gU3RpbGwgcmVxdWlyZWQsIGV2ZW4gdGhvdWdoIGl0IGlzIHByZWZlcmVuY2VzIGJlY2F1c2UgdGhlIFNpbXVsYXRpb24gdGFiIGhvdXNlcyBzaW0tc3BlY2lmaWMgZWxlbWVudHMgdGhhdFxyXG4gIC8vIHNob3VsZCBzdXBwb3J0IGN1c3RvbWl6YXRpb24uIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9qb2lzdC9pc3N1ZXMvNzQ0I2lzc3VlY29tbWVudC0xMTk2MDI4MzYyXHJcbiAgUGlja1JlcXVpcmVkPFByZWZlcmVuY2VzUGFuZWxPcHRpb25zLCAndGFuZGVtJz47XHJcblxyXG5jbGFzcyBTaW11bGF0aW9uUHJlZmVyZW5jZXNQYW5lbCBleHRlbmRzIFByZWZlcmVuY2VzUGFuZWwge1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gc2ltdWxhdGlvbk1vZGVsIC0gY29uZmlndXJhdGlvbiBmb3IgdGhlIFRhYiwgc2VlIFByZWZlcmVuY2VzTW9kZWwgZm9yIGVudHJpZXNcclxuICAgKiBAcGFyYW0gc2VsZWN0ZWRUYWJQcm9wZXJ0eVxyXG4gICAqIEBwYXJhbSB0YWJWaXNpYmxlUHJvcGVydHlcclxuICAgKiBAcGFyYW0gW3Byb3ZpZGVkT3B0aW9uc11cclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHNpbXVsYXRpb25Nb2RlbDogU2ltdWxhdGlvbk1vZGVsLCBzZWxlY3RlZFRhYlByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxQcmVmZXJlbmNlc1R5cGU+LCB0YWJWaXNpYmxlUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+LCBwcm92aWRlZE9wdGlvbnM/OiBTaW11bGF0aW9uUHJlZmVyZW5jZXNQYW5lbE9wdGlvbnMgKSB7XHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPFNpbXVsYXRpb25QcmVmZXJlbmNlc1BhbmVsT3B0aW9ucywgU2VsZk9wdGlvbnMsIFZCb3hPcHRpb25zPigpKCB7XHJcbiAgICAgIGxhYmVsQ29udGVudDogJ1NpbXVsYXRpb24nLFxyXG5cclxuICAgICAgLy8gcGhldC1pb1xyXG4gICAgICBwaGV0aW9WaXNpYmxlUHJvcGVydHlJbnN0cnVtZW50ZWQ6IGZhbHNlXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBzdXBlciggUHJlZmVyZW5jZXNUeXBlLlNJTVVMQVRJT04sIHNlbGVjdGVkVGFiUHJvcGVydHksIHRhYlZpc2libGVQcm9wZXJ0eSwgb3B0aW9ucyApO1xyXG5cclxuICAgIGNvbnN0IHBhbmVsQ29udGVudCA9IG5ldyBWQm94KCB7XHJcbiAgICAgIGFsaWduOiAnbGVmdCcsXHJcbiAgICAgIHNwYWNpbmc6IFByZWZlcmVuY2VzRGlhbG9nLkNPTlRFTlRfU1BBQ0lOR1xyXG4gICAgfSApO1xyXG4gICAgdGhpcy5hZGRDaGlsZCggcGFuZWxDb250ZW50ICk7XHJcblxyXG4gICAgLy8gSnVzdCB0aGUgcHJvdmlkZWQgcGFuZWwgY29udGVudCB3aXRoIGl0cyBvd24gc3BhY2luZ1xyXG4gICAgY29uc3QgcHJvdmlkZWRDaGlsZHJlbjogTm9kZVtdID0gW107XHJcblxyXG4gICAgc2ltdWxhdGlvbk1vZGVsLmN1c3RvbVByZWZlcmVuY2VzLmZvckVhY2goIGN1c3RvbVByZWZlcmVuY2UgPT4ge1xyXG4gICAgICBjb25zdCBjb250ZW50Tm9kZSA9IGN1c3RvbVByZWZlcmVuY2UuY3JlYXRlQ29udGVudCggb3B0aW9ucy50YW5kZW0gKTtcclxuICAgICAgY29uc3QgcHJlZmVyZW5jZXNQYW5lbFNlY3Rpb24gPSBuZXcgUHJlZmVyZW5jZXNQYW5lbFNlY3Rpb24oIHsgY29udGVudE5vZGU6IGNvbnRlbnROb2RlIH0gKTtcclxuICAgICAgcHJvdmlkZWRDaGlsZHJlbi5wdXNoKCBwcmVmZXJlbmNlc1BhbmVsU2VjdGlvbiApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIHBhbmVsQ29udGVudC5jaGlsZHJlbiA9IHByb3ZpZGVkQ2hpbGRyZW47XHJcbiAgfVxyXG59XHJcblxyXG5qb2lzdC5yZWdpc3RlciggJ1NpbXVsYXRpb25QcmVmZXJlbmNlc1BhbmVsJywgU2ltdWxhdGlvblByZWZlcmVuY2VzUGFuZWwgKTtcclxuZXhwb3J0IGRlZmF1bHQgU2ltdWxhdGlvblByZWZlcmVuY2VzUGFuZWw7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsU0FBZUEsSUFBSSxRQUFxQixnQ0FBZ0M7QUFDeEUsT0FBT0MsS0FBSyxNQUFNLGFBQWE7QUFDL0IsT0FBT0MsaUJBQWlCLE1BQU0sd0JBQXdCO0FBRXRELE9BQU9DLFNBQVMsTUFBNEIsb0NBQW9DO0FBRWhGLE9BQU9DLHVCQUF1QixNQUFNLDhCQUE4QjtBQUNsRSxPQUFPQyxlQUFlLE1BQU0sc0JBQXNCO0FBRWxELE9BQU9DLGdCQUFnQixNQUFtQyx1QkFBdUI7QUFVakYsTUFBTUMsMEJBQTBCLFNBQVNELGdCQUFnQixDQUFDO0VBRXhEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTRSxXQUFXQSxDQUFFQyxlQUFnQyxFQUFFQyxtQkFBdUQsRUFBRUMsa0JBQThDLEVBQUVDLGVBQW1ELEVBQUc7SUFDbk4sTUFBTUMsT0FBTyxHQUFHVixTQUFTLENBQThELENBQUMsQ0FBRTtNQUN4RlcsWUFBWSxFQUFFLFlBQVk7TUFFMUI7TUFDQUMsaUNBQWlDLEVBQUU7SUFDckMsQ0FBQyxFQUFFSCxlQUFnQixDQUFDO0lBRXBCLEtBQUssQ0FBRVAsZUFBZSxDQUFDVyxVQUFVLEVBQUVOLG1CQUFtQixFQUFFQyxrQkFBa0IsRUFBRUUsT0FBUSxDQUFDO0lBRXJGLE1BQU1JLFlBQVksR0FBRyxJQUFJakIsSUFBSSxDQUFFO01BQzdCa0IsS0FBSyxFQUFFLE1BQU07TUFDYkMsT0FBTyxFQUFFakIsaUJBQWlCLENBQUNrQjtJQUM3QixDQUFFLENBQUM7SUFDSCxJQUFJLENBQUNDLFFBQVEsQ0FBRUosWUFBYSxDQUFDOztJQUU3QjtJQUNBLE1BQU1LLGdCQUF3QixHQUFHLEVBQUU7SUFFbkNiLGVBQWUsQ0FBQ2MsaUJBQWlCLENBQUNDLE9BQU8sQ0FBRUMsZ0JBQWdCLElBQUk7TUFDN0QsTUFBTUMsV0FBVyxHQUFHRCxnQkFBZ0IsQ0FBQ0UsYUFBYSxDQUFFZCxPQUFPLENBQUNlLE1BQU8sQ0FBQztNQUNwRSxNQUFNQyx1QkFBdUIsR0FBRyxJQUFJekIsdUJBQXVCLENBQUU7UUFBRXNCLFdBQVcsRUFBRUE7TUFBWSxDQUFFLENBQUM7TUFDM0ZKLGdCQUFnQixDQUFDUSxJQUFJLENBQUVELHVCQUF3QixDQUFDO0lBQ2xELENBQUUsQ0FBQztJQUVIWixZQUFZLENBQUNjLFFBQVEsR0FBR1QsZ0JBQWdCO0VBQzFDO0FBQ0Y7QUFFQXJCLEtBQUssQ0FBQytCLFFBQVEsQ0FBRSw0QkFBNEIsRUFBRXpCLDBCQUEyQixDQUFDO0FBQzFFLGVBQWVBLDBCQUEwQiIsImlnbm9yZUxpc3QiOltdfQ==