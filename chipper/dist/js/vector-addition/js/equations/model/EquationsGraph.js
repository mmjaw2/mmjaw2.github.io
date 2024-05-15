// Copyright 2019-2023, University of Colorado Boulder

/**
 * Model for a single graph on the 'Equations' screen, which has 2 graphs (Polar and Cartesian).
 *
 * Characteristics of an EquationsGraph (which extends Graph) are:
 *  - have exactly 1 VectorSet
 *  - has a Property to select the equation type (addition/subtraction/negation) per graph
 *
 * @author Brandon Li
 */

import EnumerationProperty from '../../../../axon/js/EnumerationProperty.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import Graph from '../../common/model/Graph.js';
import VectorAdditionConstants from '../../common/VectorAdditionConstants.js';
import vectorAddition from '../../vectorAddition.js';
import EquationsVectorSet from './EquationsVectorSet.js';
import EquationTypes from './EquationTypes.js';
// constants

// graph bounds for EquationsGraphs
const EQUATIONS_GRAPH_BOUNDS = VectorAdditionConstants.DEFAULT_GRAPH_BOUNDS;

// Bottom left corner, in view coordinates.
const BOTTOM_LEFT = new Vector2(Graph.DEFAULT_BOTTOM_LEFT.x, Graph.DEFAULT_BOTTOM_LEFT.y + 40);

// Starting equation type
const STARTING_EQUATION_TYPE = EquationTypes.ADDITION;
export default class EquationsGraph extends Graph {
  constructor(coordinateSnapMode, componentStyleProperty, sumVisibleProperty, vectorColorPalette) {
    super(EQUATIONS_GRAPH_BOUNDS, coordinateSnapMode, {
      bottomLeft: BOTTOM_LEFT
    });
    this.equationTypeProperty = new EnumerationProperty(STARTING_EQUATION_TYPE);
    this.vectorSet = new EquationsVectorSet(this, componentStyleProperty, sumVisibleProperty, vectorColorPalette, coordinateSnapMode);
    this.vectorSets.push(this.vectorSet);
  }
  reset() {
    super.reset();
    this.equationTypeProperty.reset();
  }
}
vectorAddition.register('EquationsGraph', EquationsGraph);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFbnVtZXJhdGlvblByb3BlcnR5IiwiVmVjdG9yMiIsIkdyYXBoIiwiVmVjdG9yQWRkaXRpb25Db25zdGFudHMiLCJ2ZWN0b3JBZGRpdGlvbiIsIkVxdWF0aW9uc1ZlY3RvclNldCIsIkVxdWF0aW9uVHlwZXMiLCJFUVVBVElPTlNfR1JBUEhfQk9VTkRTIiwiREVGQVVMVF9HUkFQSF9CT1VORFMiLCJCT1RUT01fTEVGVCIsIkRFRkFVTFRfQk9UVE9NX0xFRlQiLCJ4IiwieSIsIlNUQVJUSU5HX0VRVUFUSU9OX1RZUEUiLCJBRERJVElPTiIsIkVxdWF0aW9uc0dyYXBoIiwiY29uc3RydWN0b3IiLCJjb29yZGluYXRlU25hcE1vZGUiLCJjb21wb25lbnRTdHlsZVByb3BlcnR5Iiwic3VtVmlzaWJsZVByb3BlcnR5IiwidmVjdG9yQ29sb3JQYWxldHRlIiwiYm90dG9tTGVmdCIsImVxdWF0aW9uVHlwZVByb3BlcnR5IiwidmVjdG9yU2V0IiwidmVjdG9yU2V0cyIsInB1c2giLCJyZXNldCIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiRXF1YXRpb25zR3JhcGgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogTW9kZWwgZm9yIGEgc2luZ2xlIGdyYXBoIG9uIHRoZSAnRXF1YXRpb25zJyBzY3JlZW4sIHdoaWNoIGhhcyAyIGdyYXBocyAoUG9sYXIgYW5kIENhcnRlc2lhbikuXHJcbiAqXHJcbiAqIENoYXJhY3RlcmlzdGljcyBvZiBhbiBFcXVhdGlvbnNHcmFwaCAod2hpY2ggZXh0ZW5kcyBHcmFwaCkgYXJlOlxyXG4gKiAgLSBoYXZlIGV4YWN0bHkgMSBWZWN0b3JTZXRcclxuICogIC0gaGFzIGEgUHJvcGVydHkgdG8gc2VsZWN0IHRoZSBlcXVhdGlvbiB0eXBlIChhZGRpdGlvbi9zdWJ0cmFjdGlvbi9uZWdhdGlvbikgcGVyIGdyYXBoXHJcbiAqXHJcbiAqIEBhdXRob3IgQnJhbmRvbiBMaVxyXG4gKi9cclxuXHJcbmltcG9ydCBFbnVtZXJhdGlvblByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvRW51bWVyYXRpb25Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IENvb3JkaW5hdGVTbmFwTW9kZXMgZnJvbSAnLi4vLi4vY29tbW9uL21vZGVsL0Nvb3JkaW5hdGVTbmFwTW9kZXMuanMnO1xyXG5pbXBvcnQgR3JhcGggZnJvbSAnLi4vLi4vY29tbW9uL21vZGVsL0dyYXBoLmpzJztcclxuaW1wb3J0IFZlY3RvckNvbG9yUGFsZXR0ZSBmcm9tICcuLi8uLi9jb21tb24vbW9kZWwvVmVjdG9yQ29sb3JQYWxldHRlLmpzJztcclxuaW1wb3J0IFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzIGZyb20gJy4uLy4uL2NvbW1vbi9WZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5qcyc7XHJcbmltcG9ydCB2ZWN0b3JBZGRpdGlvbiBmcm9tICcuLi8uLi92ZWN0b3JBZGRpdGlvbi5qcyc7XHJcbmltcG9ydCBFcXVhdGlvbnNWZWN0b3JTZXQgZnJvbSAnLi9FcXVhdGlvbnNWZWN0b3JTZXQuanMnO1xyXG5pbXBvcnQgRXF1YXRpb25UeXBlcyBmcm9tICcuL0VxdWF0aW9uVHlwZXMuanMnO1xyXG5pbXBvcnQgQ29tcG9uZW50VmVjdG9yU3R5bGVzIGZyb20gJy4uLy4uL2NvbW1vbi9tb2RlbC9Db21wb25lbnRWZWN0b3JTdHlsZXMuanMnO1xyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9Qcm9wZXJ0eS5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuXHJcbi8vIGdyYXBoIGJvdW5kcyBmb3IgRXF1YXRpb25zR3JhcGhzXHJcbmNvbnN0IEVRVUFUSU9OU19HUkFQSF9CT1VORFMgPSBWZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5ERUZBVUxUX0dSQVBIX0JPVU5EUztcclxuXHJcbi8vIEJvdHRvbSBsZWZ0IGNvcm5lciwgaW4gdmlldyBjb29yZGluYXRlcy5cclxuY29uc3QgQk9UVE9NX0xFRlQgPSBuZXcgVmVjdG9yMiggR3JhcGguREVGQVVMVF9CT1RUT01fTEVGVC54LCBHcmFwaC5ERUZBVUxUX0JPVFRPTV9MRUZULnkgKyA0MCApO1xyXG5cclxuLy8gU3RhcnRpbmcgZXF1YXRpb24gdHlwZVxyXG5jb25zdCBTVEFSVElOR19FUVVBVElPTl9UWVBFID0gRXF1YXRpb25UeXBlcy5BRERJVElPTjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEVxdWF0aW9uc0dyYXBoIGV4dGVuZHMgR3JhcGgge1xyXG5cclxuICBwdWJsaWMgcmVhZG9ubHkgZXF1YXRpb25UeXBlUHJvcGVydHk6IEVudW1lcmF0aW9uUHJvcGVydHk8RXF1YXRpb25UeXBlcz47XHJcbiAgcHVibGljIHJlYWRvbmx5IHZlY3RvclNldDogRXF1YXRpb25zVmVjdG9yU2V0O1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIGNvb3JkaW5hdGVTbmFwTW9kZTogQ29vcmRpbmF0ZVNuYXBNb2RlcyxcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFN0eWxlUHJvcGVydHk6IEVudW1lcmF0aW9uUHJvcGVydHk8Q29tcG9uZW50VmVjdG9yU3R5bGVzPixcclxuICAgICAgICAgICAgICAgICAgICAgIHN1bVZpc2libGVQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj4sXHJcbiAgICAgICAgICAgICAgICAgICAgICB2ZWN0b3JDb2xvclBhbGV0dGU6IFZlY3RvckNvbG9yUGFsZXR0ZSApIHtcclxuXHJcbiAgICBzdXBlciggRVFVQVRJT05TX0dSQVBIX0JPVU5EUywgY29vcmRpbmF0ZVNuYXBNb2RlLCB7XHJcbiAgICAgIGJvdHRvbUxlZnQ6IEJPVFRPTV9MRUZUXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5lcXVhdGlvblR5cGVQcm9wZXJ0eSA9IG5ldyBFbnVtZXJhdGlvblByb3BlcnR5KCBTVEFSVElOR19FUVVBVElPTl9UWVBFICk7XHJcblxyXG4gICAgdGhpcy52ZWN0b3JTZXQgPSBuZXcgRXF1YXRpb25zVmVjdG9yU2V0KCB0aGlzLCBjb21wb25lbnRTdHlsZVByb3BlcnR5LCBzdW1WaXNpYmxlUHJvcGVydHksIHZlY3RvckNvbG9yUGFsZXR0ZSwgY29vcmRpbmF0ZVNuYXBNb2RlICk7XHJcblxyXG4gICAgdGhpcy52ZWN0b3JTZXRzLnB1c2goIHRoaXMudmVjdG9yU2V0ICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgcmVzZXQoKTogdm9pZCB7XHJcbiAgICBzdXBlci5yZXNldCgpO1xyXG4gICAgdGhpcy5lcXVhdGlvblR5cGVQcm9wZXJ0eS5yZXNldCgpO1xyXG4gIH1cclxufVxyXG5cclxudmVjdG9yQWRkaXRpb24ucmVnaXN0ZXIoICdFcXVhdGlvbnNHcmFwaCcsIEVxdWF0aW9uc0dyYXBoICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsbUJBQW1CLE1BQU0sNENBQTRDO0FBQzVFLE9BQU9DLE9BQU8sTUFBTSwrQkFBK0I7QUFFbkQsT0FBT0MsS0FBSyxNQUFNLDZCQUE2QjtBQUUvQyxPQUFPQyx1QkFBdUIsTUFBTSx5Q0FBeUM7QUFDN0UsT0FBT0MsY0FBYyxNQUFNLHlCQUF5QjtBQUNwRCxPQUFPQyxrQkFBa0IsTUFBTSx5QkFBeUI7QUFDeEQsT0FBT0MsYUFBYSxNQUFNLG9CQUFvQjtBQUk5Qzs7QUFFQTtBQUNBLE1BQU1DLHNCQUFzQixHQUFHSix1QkFBdUIsQ0FBQ0ssb0JBQW9COztBQUUzRTtBQUNBLE1BQU1DLFdBQVcsR0FBRyxJQUFJUixPQUFPLENBQUVDLEtBQUssQ0FBQ1EsbUJBQW1CLENBQUNDLENBQUMsRUFBRVQsS0FBSyxDQUFDUSxtQkFBbUIsQ0FBQ0UsQ0FBQyxHQUFHLEVBQUcsQ0FBQzs7QUFFaEc7QUFDQSxNQUFNQyxzQkFBc0IsR0FBR1AsYUFBYSxDQUFDUSxRQUFRO0FBRXJELGVBQWUsTUFBTUMsY0FBYyxTQUFTYixLQUFLLENBQUM7RUFLekNjLFdBQVdBLENBQUVDLGtCQUF1QyxFQUN2Q0Msc0JBQWtFLEVBQ2xFQyxrQkFBcUMsRUFDckNDLGtCQUFzQyxFQUFHO0lBRTNELEtBQUssQ0FBRWIsc0JBQXNCLEVBQUVVLGtCQUFrQixFQUFFO01BQ2pESSxVQUFVLEVBQUVaO0lBQ2QsQ0FBRSxDQUFDO0lBRUgsSUFBSSxDQUFDYSxvQkFBb0IsR0FBRyxJQUFJdEIsbUJBQW1CLENBQUVhLHNCQUF1QixDQUFDO0lBRTdFLElBQUksQ0FBQ1UsU0FBUyxHQUFHLElBQUlsQixrQkFBa0IsQ0FBRSxJQUFJLEVBQUVhLHNCQUFzQixFQUFFQyxrQkFBa0IsRUFBRUMsa0JBQWtCLEVBQUVILGtCQUFtQixDQUFDO0lBRW5JLElBQUksQ0FBQ08sVUFBVSxDQUFDQyxJQUFJLENBQUUsSUFBSSxDQUFDRixTQUFVLENBQUM7RUFDeEM7RUFFZ0JHLEtBQUtBLENBQUEsRUFBUztJQUM1QixLQUFLLENBQUNBLEtBQUssQ0FBQyxDQUFDO0lBQ2IsSUFBSSxDQUFDSixvQkFBb0IsQ0FBQ0ksS0FBSyxDQUFDLENBQUM7RUFDbkM7QUFDRjtBQUVBdEIsY0FBYyxDQUFDdUIsUUFBUSxDQUFFLGdCQUFnQixFQUFFWixjQUFlLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=