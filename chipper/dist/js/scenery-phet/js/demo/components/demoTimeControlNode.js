// Copyright 2022, University of Colorado Boulder

/**
 * Demo for ThermometerNode
 *
 * @author Jesse Greenberg
 */

import { Text, VBox } from '../../../../scenery/js/imports.js';
import PhetFont from '../../PhetFont.js';
import TimeControlNode from '../../TimeControlNode.js';
import TimeSpeed from '../../TimeSpeed.js';
import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import EnumerationProperty from '../../../../axon/js/EnumerationProperty.js';
import Checkbox from '../../../../sun/js/Checkbox.js';
export default function demoTimeControlNode(layoutBounds) {
  const defaultTimeControlNode = new TimeControlNode(new BooleanProperty(true));

  // a TimeControlNode with all push buttons
  const pushButtonTimeControlNode = new TimeControlNode(new BooleanProperty(true), {
    playPauseStepButtonOptions: {
      includeStepBackwardButton: true,
      playPauseButtonOptions: {
        scaleFactorWhenNotPlaying: 1.3
      }
    }
  });

  // a TimeControlNode with default speed radio buttons, with large font to show that radio button size changes
  // to match height of radio button labels.
  const speedTimeControlNode = new TimeControlNode(new BooleanProperty(true), {
    timeSpeedProperty: new EnumerationProperty(TimeSpeed.NORMAL),
    speedRadioButtonGroupOptions: {
      labelOptions: {
        font: new PhetFont(30)
      }
    }
  });
  const enabledProperty = new BooleanProperty(true);

  // a TimeControlNode with swapped layout for radio buttons with radio buttons wrapped in a panel
  const customTimeControlNode = new TimeControlNode(new BooleanProperty(true), {
    timeSpeedProperty: new EnumerationProperty(TimeSpeed.SLOW),
    timeSpeeds: [TimeSpeed.NORMAL, TimeSpeed.FAST, TimeSpeed.SLOW],
    speedRadioButtonGroupOnLeft: true,
    speedRadioButtonGroupPanelOptions: {
      fill: 'rgb(239,239,195)'
    },
    buttonGroupXSpacing: 40,
    wrapSpeedRadioButtonGroupInPanel: true,
    enabledProperty: enabledProperty
  });
  const enabledLabelNode = new Text('enabled', {
    font: new PhetFont(20)
  });
  const enabledCheckbox = new Checkbox(enabledProperty, enabledLabelNode);
  return new VBox({
    children: [defaultTimeControlNode, pushButtonTimeControlNode, speedTimeControlNode, customTimeControlNode, enabledCheckbox],
    spacing: 30,
    center: layoutBounds.center,
    resize: false
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUZXh0IiwiVkJveCIsIlBoZXRGb250IiwiVGltZUNvbnRyb2xOb2RlIiwiVGltZVNwZWVkIiwiQm9vbGVhblByb3BlcnR5IiwiRW51bWVyYXRpb25Qcm9wZXJ0eSIsIkNoZWNrYm94IiwiZGVtb1RpbWVDb250cm9sTm9kZSIsImxheW91dEJvdW5kcyIsImRlZmF1bHRUaW1lQ29udHJvbE5vZGUiLCJwdXNoQnV0dG9uVGltZUNvbnRyb2xOb2RlIiwicGxheVBhdXNlU3RlcEJ1dHRvbk9wdGlvbnMiLCJpbmNsdWRlU3RlcEJhY2t3YXJkQnV0dG9uIiwicGxheVBhdXNlQnV0dG9uT3B0aW9ucyIsInNjYWxlRmFjdG9yV2hlbk5vdFBsYXlpbmciLCJzcGVlZFRpbWVDb250cm9sTm9kZSIsInRpbWVTcGVlZFByb3BlcnR5IiwiTk9STUFMIiwic3BlZWRSYWRpb0J1dHRvbkdyb3VwT3B0aW9ucyIsImxhYmVsT3B0aW9ucyIsImZvbnQiLCJlbmFibGVkUHJvcGVydHkiLCJjdXN0b21UaW1lQ29udHJvbE5vZGUiLCJTTE9XIiwidGltZVNwZWVkcyIsIkZBU1QiLCJzcGVlZFJhZGlvQnV0dG9uR3JvdXBPbkxlZnQiLCJzcGVlZFJhZGlvQnV0dG9uR3JvdXBQYW5lbE9wdGlvbnMiLCJmaWxsIiwiYnV0dG9uR3JvdXBYU3BhY2luZyIsIndyYXBTcGVlZFJhZGlvQnV0dG9uR3JvdXBJblBhbmVsIiwiZW5hYmxlZExhYmVsTm9kZSIsImVuYWJsZWRDaGVja2JveCIsImNoaWxkcmVuIiwic3BhY2luZyIsImNlbnRlciIsInJlc2l6ZSJdLCJzb3VyY2VzIjpbImRlbW9UaW1lQ29udHJvbE5vZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjIsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIERlbW8gZm9yIFRoZXJtb21ldGVyTm9kZVxyXG4gKlxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZ1xyXG4gKi9cclxuXHJcbmltcG9ydCB7IE5vZGUsIFRleHQsIFZCb3ggfSBmcm9tICcuLi8uLi8uLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBQaGV0Rm9udCBmcm9tICcuLi8uLi9QaGV0Rm9udC5qcyc7XHJcbmltcG9ydCBUaW1lQ29udHJvbE5vZGUgZnJvbSAnLi4vLi4vVGltZUNvbnRyb2xOb2RlLmpzJztcclxuaW1wb3J0IFRpbWVTcGVlZCBmcm9tICcuLi8uLi9UaW1lU3BlZWQuanMnO1xyXG5pbXBvcnQgQm9vbGVhblByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvQm9vbGVhblByb3BlcnR5LmpzJztcclxuaW1wb3J0IEVudW1lcmF0aW9uUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9FbnVtZXJhdGlvblByb3BlcnR5LmpzJztcclxuaW1wb3J0IENoZWNrYm94IGZyb20gJy4uLy4uLy4uLy4uL3N1bi9qcy9DaGVja2JveC5qcyc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBkZW1vVGltZUNvbnRyb2xOb2RlKCBsYXlvdXRCb3VuZHM6IEJvdW5kczIgKTogTm9kZSB7XHJcblxyXG4gIGNvbnN0IGRlZmF1bHRUaW1lQ29udHJvbE5vZGUgPSBuZXcgVGltZUNvbnRyb2xOb2RlKCBuZXcgQm9vbGVhblByb3BlcnR5KCB0cnVlICkgKTtcclxuXHJcbiAgLy8gYSBUaW1lQ29udHJvbE5vZGUgd2l0aCBhbGwgcHVzaCBidXR0b25zXHJcbiAgY29uc3QgcHVzaEJ1dHRvblRpbWVDb250cm9sTm9kZSA9IG5ldyBUaW1lQ29udHJvbE5vZGUoIG5ldyBCb29sZWFuUHJvcGVydHkoIHRydWUgKSwge1xyXG4gICAgcGxheVBhdXNlU3RlcEJ1dHRvbk9wdGlvbnM6IHtcclxuICAgICAgaW5jbHVkZVN0ZXBCYWNrd2FyZEJ1dHRvbjogdHJ1ZSxcclxuICAgICAgcGxheVBhdXNlQnV0dG9uT3B0aW9uczoge1xyXG4gICAgICAgIHNjYWxlRmFjdG9yV2hlbk5vdFBsYXlpbmc6IDEuM1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSApO1xyXG5cclxuICAvLyBhIFRpbWVDb250cm9sTm9kZSB3aXRoIGRlZmF1bHQgc3BlZWQgcmFkaW8gYnV0dG9ucywgd2l0aCBsYXJnZSBmb250IHRvIHNob3cgdGhhdCByYWRpbyBidXR0b24gc2l6ZSBjaGFuZ2VzXHJcbiAgLy8gdG8gbWF0Y2ggaGVpZ2h0IG9mIHJhZGlvIGJ1dHRvbiBsYWJlbHMuXHJcbiAgY29uc3Qgc3BlZWRUaW1lQ29udHJvbE5vZGUgPSBuZXcgVGltZUNvbnRyb2xOb2RlKCBuZXcgQm9vbGVhblByb3BlcnR5KCB0cnVlICksIHtcclxuICAgIHRpbWVTcGVlZFByb3BlcnR5OiBuZXcgRW51bWVyYXRpb25Qcm9wZXJ0eSggVGltZVNwZWVkLk5PUk1BTCApLFxyXG4gICAgc3BlZWRSYWRpb0J1dHRvbkdyb3VwT3B0aW9uczoge1xyXG4gICAgICBsYWJlbE9wdGlvbnM6IHtcclxuICAgICAgICBmb250OiBuZXcgUGhldEZvbnQoIDMwIClcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0gKTtcclxuXHJcbiAgY29uc3QgZW5hYmxlZFByb3BlcnR5ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggdHJ1ZSApO1xyXG5cclxuICAvLyBhIFRpbWVDb250cm9sTm9kZSB3aXRoIHN3YXBwZWQgbGF5b3V0IGZvciByYWRpbyBidXR0b25zIHdpdGggcmFkaW8gYnV0dG9ucyB3cmFwcGVkIGluIGEgcGFuZWxcclxuICBjb25zdCBjdXN0b21UaW1lQ29udHJvbE5vZGUgPSBuZXcgVGltZUNvbnRyb2xOb2RlKCBuZXcgQm9vbGVhblByb3BlcnR5KCB0cnVlICksIHtcclxuICAgIHRpbWVTcGVlZFByb3BlcnR5OiBuZXcgRW51bWVyYXRpb25Qcm9wZXJ0eSggVGltZVNwZWVkLlNMT1cgKSxcclxuICAgIHRpbWVTcGVlZHM6IFsgVGltZVNwZWVkLk5PUk1BTCwgVGltZVNwZWVkLkZBU1QsIFRpbWVTcGVlZC5TTE9XIF0sXHJcbiAgICBzcGVlZFJhZGlvQnV0dG9uR3JvdXBPbkxlZnQ6IHRydWUsXHJcbiAgICBzcGVlZFJhZGlvQnV0dG9uR3JvdXBQYW5lbE9wdGlvbnM6IHtcclxuICAgICAgZmlsbDogJ3JnYigyMzksMjM5LDE5NSknXHJcbiAgICB9LFxyXG4gICAgYnV0dG9uR3JvdXBYU3BhY2luZzogNDAsXHJcbiAgICB3cmFwU3BlZWRSYWRpb0J1dHRvbkdyb3VwSW5QYW5lbDogdHJ1ZSxcclxuICAgIGVuYWJsZWRQcm9wZXJ0eTogZW5hYmxlZFByb3BlcnR5XHJcbiAgfSApO1xyXG5cclxuICBjb25zdCBlbmFibGVkTGFiZWxOb2RlID0gbmV3IFRleHQoICdlbmFibGVkJywgeyBmb250OiBuZXcgUGhldEZvbnQoIDIwICkgfSApO1xyXG4gIGNvbnN0IGVuYWJsZWRDaGVja2JveCA9IG5ldyBDaGVja2JveCggZW5hYmxlZFByb3BlcnR5LCBlbmFibGVkTGFiZWxOb2RlICk7XHJcblxyXG4gIHJldHVybiBuZXcgVkJveCgge1xyXG4gICAgY2hpbGRyZW46IFtcclxuICAgICAgZGVmYXVsdFRpbWVDb250cm9sTm9kZSxcclxuICAgICAgcHVzaEJ1dHRvblRpbWVDb250cm9sTm9kZSxcclxuICAgICAgc3BlZWRUaW1lQ29udHJvbE5vZGUsXHJcbiAgICAgIGN1c3RvbVRpbWVDb250cm9sTm9kZSxcclxuICAgICAgZW5hYmxlZENoZWNrYm94XHJcbiAgICBdLFxyXG4gICAgc3BhY2luZzogMzAsXHJcbiAgICBjZW50ZXI6IGxheW91dEJvdW5kcy5jZW50ZXIsXHJcbiAgICByZXNpemU6IGZhbHNlXHJcbiAgfSApO1xyXG59Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFNBQWVBLElBQUksRUFBRUMsSUFBSSxRQUFRLG1DQUFtQztBQUVwRSxPQUFPQyxRQUFRLE1BQU0sbUJBQW1CO0FB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