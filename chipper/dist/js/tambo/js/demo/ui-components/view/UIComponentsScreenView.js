// Copyright 2018-2023, University of Colorado Boulder

/**
 * UIComponentsScreenView is a view for a screen that demonstrates views and sounds for common User Interface
 * components.
 *
 * @author John Blanco (PhET Interactive Simulations)
 */

import BooleanProperty from '../../../../../axon/js/BooleanProperty.js';
import NumberProperty from '../../../../../axon/js/NumberProperty.js';
import Range from '../../../../../dot/js/Range.js';
import ResetAllButton from '../../../../../scenery-phet/js/buttons/ResetAllButton.js';
import NumberControl from '../../../../../scenery-phet/js/NumberControl.js';
import NumberPicker from '../../../../../sun/js/NumberPicker.js';
import PhetFont from '../../../../../scenery-phet/js/PhetFont.js';
import TimeControlNode from '../../../../../scenery-phet/js/TimeControlNode.js';
import { Image, Text, VBox } from '../../../../../scenery/js/imports.js';
import AccordionBox from '../../../../../sun/js/AccordionBox.js';
import AquaRadioButtonGroup from '../../../../../sun/js/AquaRadioButtonGroup.js';
import BooleanRectangularToggleButton from '../../../../../sun/js/buttons/BooleanRectangularToggleButton.js';
import RectangularPushButton from '../../../../../sun/js/buttons/RectangularPushButton.js';
import Checkbox from '../../../../../sun/js/Checkbox.js';
import ComboBox from '../../../../../sun/js/ComboBox.js';
import DemosScreenView from '../../../../../sun/js/demo/DemosScreenView.js';
import accordion_png from '../../../../images/accordion_png.js';
import tambo from '../../../tambo.js';
import SliderSoundTestNode from './SliderSoundTestNode.js';
import Property from '../../../../../axon/js/Property.js';
import ABSwitch from '../../../../../sun/js/ABSwitch.js';
import OnOffSwitch from '../../../../../sun/js/OnOffSwitch.js';
import grabSoundPlayer from '../../../shared-sound-players/grabSoundPlayer.js';
import releaseSoundPlayer from '../../../shared-sound-players/releaseSoundPlayer.js';
import nullSoundPlayer from '../../../shared-sound-players/nullSoundPlayer.js';
// constants
const LABEL_FONT = new PhetFont(20);
class UIComponentsScreenView extends DemosScreenView {
  constructor(model) {
    const demos = [{
      label: 'ABSwitch',
      createNode: layoutBounds => new VBox({
        children: [new Text('Default Sounds:', {
          font: LABEL_FONT
        }), new ABSwitch(model.abSwitch1Property, false, new Text('Tastes Great', {
          font: LABEL_FONT
        }), true, new Text('Less Filling', {
          font: LABEL_FONT
        }), {
          center: layoutBounds.center
        }), new Text('Custom Sounds:', {
          font: LABEL_FONT
        }), new ABSwitch(model.abSwitch2Property, false, new Text('Heads', {
          font: LABEL_FONT
        }), true, new Text('Tails', {
          font: LABEL_FONT
        }), {
          center: layoutBounds.center,
          toggleSwitchOptions: {
            switchToLeftSoundPlayer: grabSoundPlayer,
            switchToRightSoundPlayer: releaseSoundPlayer
          }
        }), new Text('No Sounds:', {
          font: LABEL_FONT
        }), new ABSwitch(model.abSwitch3Property, false, new Text('Shhhh', {
          font: LABEL_FONT
        }), true, new Text('Quiet', {
          font: LABEL_FONT
        }), {
          center: layoutBounds.center,
          toggleSwitchOptions: {
            switchToLeftSoundPlayer: nullSoundPlayer,
            switchToRightSoundPlayer: nullSoundPlayer
          }
        })],
        spacing: 30,
        center: layoutBounds.center
      })
    }, {
      label: 'OnOffSwitch',
      createNode: layoutBounds => new VBox({
        children: [new Text('On Off Switch:', {
          font: LABEL_FONT
        }), new OnOffSwitch(model.abSwitch1Property, {
          center: layoutBounds.center
        })],
        spacing: 30,
        center: layoutBounds.center
      })
    }, {
      label: 'PushButton',
      createNode: layoutBounds => new RectangularPushButton({
        content: new Text('You\'re Pushing It.', {
          font: LABEL_FONT
        }),
        center: layoutBounds.center
      })
    }, {
      label: 'Checkbox',
      createNode: layoutBounds => new Checkbox(new BooleanProperty(false), new Text('Check it Out', {
        font: LABEL_FONT
      }), {
        center: layoutBounds.center
      })
    }, {
      label: 'AquaRadioButtonGroup',
      createNode: layoutBounds => {
        const radioButtonItems = [{
          createNode: tandem => new Text('One Thing', {
            font: LABEL_FONT
          }),
          value: 0
        }, {
          createNode: tandem => new Text('Another Thing', {
            font: LABEL_FONT
          }),
          value: 1
        }, {
          createNode: tandem => new Text('An Entirely Different Thing', {
            font: LABEL_FONT
          }),
          value: 2
        }];
        return new AquaRadioButtonGroup(new NumberProperty(0), radioButtonItems, {
          orientation: 'vertical',
          align: 'left',
          spacing: 10,
          center: layoutBounds.center
        });
      }
    }, {
      label: 'TimeControlNode',
      createNode: layoutBounds => new TimeControlNode(new BooleanProperty(true), {
        center: layoutBounds.center,
        playPauseStepButtonOptions: {
          includeStepBackwardButton: true
        }
      })
    }, {
      label: 'ResetAllButton',
      createNode: layoutBounds => new ResetAllButton({
        center: layoutBounds.center
      })
    }, {
      label: 'ComboBox',
      createNode: layoutBounds => new ComboBox(new NumberProperty(0), [{
        value: 0,
        createNode: () => new Text('Rainbows', {
          font: LABEL_FONT
        })
      }, {
        value: 1,
        createNode: () => new Text('Unicorns', {
          font: LABEL_FONT
        })
      }, {
        value: 2,
        createNode: () => new Text('Butterflies', {
          font: LABEL_FONT
        })
      }], this, {
        center: layoutBounds.center
      })
    }, {
      label: 'BooleanRectangularToggleButton',
      createNode: layoutBounds => new BooleanRectangularToggleButton(new BooleanProperty(true), new Text('Yep', {
        font: LABEL_FONT
      }), new Text('Nope', {
        font: LABEL_FONT
      }), {
        baseColor: '#B3FFEC',
        center: layoutBounds.center
      })
    }, {
      label: 'AccordionBox',
      createNode: layoutBounds => new AccordionBox(new Image(accordion_png, {
        maxWidth: 200
      }), {
        titleNode: new Text('Accordion Box', {
          font: LABEL_FONT
        }),
        expandedProperty: new BooleanProperty(false),
        contentXMargin: 30,
        contentYMargin: 20,
        contentYSpacing: 20,
        center: layoutBounds.center
      })
    }, {
      label: 'Sliders',
      createNode: layoutBounds => new SliderSoundTestNode(LABEL_FONT, layoutBounds.center)
    }, {
      label: 'NumberControl',
      createNode: layoutBounds => new VBox({
        children: [new NumberControl('How much you want?', new NumberProperty(0), new Range(0, 10), {
          delta: 2
        }),
        // This is an example of a number control that has a delta value that leads to thresholds in the sound
        // player that are not all equally sized.  See https://github.com/phetsims/sun/issues/697.
        new NumberControl('How much you want (asymmetric)?', new NumberProperty(0), new Range(0, 100), {
          delta: 22
        })],
        spacing: 20,
        center: layoutBounds.center
      })
    }, {
      label: 'NumberPicker',
      createNode: layoutBounds => new VBox({
        children: [new NumberPicker(new NumberProperty(0), new Property(new Range(0, 4)))],
        spacing: 20,
        center: layoutBounds.center
      })
    }];
    super(demos);

    // add the reset all button
    const resetAllButton = new ResetAllButton({
      right: this.layoutBounds.maxX - 25,
      bottom: this.layoutBounds.maxY - 25,
      listener: () => {
        model.reset();
      }
    });
    this.addChild(resetAllButton);
  }
}
tambo.register('UIComponentsScreenView', UIComponentsScreenView);
export default UIComponentsScreenView;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJOdW1iZXJQcm9wZXJ0eSIsIlJhbmdlIiwiUmVzZXRBbGxCdXR0b24iLCJOdW1iZXJDb250cm9sIiwiTnVtYmVyUGlja2VyIiwiUGhldEZvbnQiLCJUaW1lQ29udHJvbE5vZGUiLCJJbWFnZSIsIlRleHQiLCJWQm94IiwiQWNjb3JkaW9uQm94IiwiQXF1YVJhZGlvQnV0dG9uR3JvdXAiLCJCb29sZWFuUmVjdGFuZ3VsYXJUb2dnbGVCdXR0b24iLCJSZWN0YW5ndWxhclB1c2hCdXR0b24iLCJDaGVja2JveCIsIkNvbWJvQm94IiwiRGVtb3NTY3JlZW5WaWV3IiwiYWNjb3JkaW9uX3BuZyIsInRhbWJvIiwiU2xpZGVyU291bmRUZXN0Tm9kZSIsIlByb3BlcnR5IiwiQUJTd2l0Y2giLCJPbk9mZlN3aXRjaCIsImdyYWJTb3VuZFBsYXllciIsInJlbGVhc2VTb3VuZFBsYXllciIsIm51bGxTb3VuZFBsYXllciIsIkxBQkVMX0ZPTlQiLCJVSUNvbXBvbmVudHNTY3JlZW5WaWV3IiwiY29uc3RydWN0b3IiLCJtb2RlbCIsImRlbW9zIiwibGFiZWwiLCJjcmVhdGVOb2RlIiwibGF5b3V0Qm91bmRzIiwiY2hpbGRyZW4iLCJmb250IiwiYWJTd2l0Y2gxUHJvcGVydHkiLCJjZW50ZXIiLCJhYlN3aXRjaDJQcm9wZXJ0eSIsInRvZ2dsZVN3aXRjaE9wdGlvbnMiLCJzd2l0Y2hUb0xlZnRTb3VuZFBsYXllciIsInN3aXRjaFRvUmlnaHRTb3VuZFBsYXllciIsImFiU3dpdGNoM1Byb3BlcnR5Iiwic3BhY2luZyIsImNvbnRlbnQiLCJyYWRpb0J1dHRvbkl0ZW1zIiwidGFuZGVtIiwidmFsdWUiLCJvcmllbnRhdGlvbiIsImFsaWduIiwicGxheVBhdXNlU3RlcEJ1dHRvbk9wdGlvbnMiLCJpbmNsdWRlU3RlcEJhY2t3YXJkQnV0dG9uIiwiYmFzZUNvbG9yIiwibWF4V2lkdGgiLCJ0aXRsZU5vZGUiLCJleHBhbmRlZFByb3BlcnR5IiwiY29udGVudFhNYXJnaW4iLCJjb250ZW50WU1hcmdpbiIsImNvbnRlbnRZU3BhY2luZyIsImRlbHRhIiwicmVzZXRBbGxCdXR0b24iLCJyaWdodCIsIm1heFgiLCJib3R0b20iLCJtYXhZIiwibGlzdGVuZXIiLCJyZXNldCIsImFkZENoaWxkIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJVSUNvbXBvbmVudHNTY3JlZW5WaWV3LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFVJQ29tcG9uZW50c1NjcmVlblZpZXcgaXMgYSB2aWV3IGZvciBhIHNjcmVlbiB0aGF0IGRlbW9uc3RyYXRlcyB2aWV3cyBhbmQgc291bmRzIGZvciBjb21tb24gVXNlciBJbnRlcmZhY2VcclxuICogY29tcG9uZW50cy5cclxuICpcclxuICogQGF1dGhvciBKb2huIEJsYW5jbyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgQm9vbGVhblByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uLy4uL2F4b24vanMvQm9vbGVhblByb3BlcnR5LmpzJztcclxuaW1wb3J0IE51bWJlclByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uLy4uL2F4b24vanMvTnVtYmVyUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgUmFuZ2UgZnJvbSAnLi4vLi4vLi4vLi4vLi4vZG90L2pzL1JhbmdlLmpzJztcclxuaW1wb3J0IFJlc2V0QWxsQnV0dG9uIGZyb20gJy4uLy4uLy4uLy4uLy4uL3NjZW5lcnktcGhldC9qcy9idXR0b25zL1Jlc2V0QWxsQnV0dG9uLmpzJztcclxuaW1wb3J0IE51bWJlckNvbnRyb2wgZnJvbSAnLi4vLi4vLi4vLi4vLi4vc2NlbmVyeS1waGV0L2pzL051bWJlckNvbnRyb2wuanMnO1xyXG5pbXBvcnQgTnVtYmVyUGlja2VyIGZyb20gJy4uLy4uLy4uLy4uLy4uL3N1bi9qcy9OdW1iZXJQaWNrZXIuanMnO1xyXG5pbXBvcnQgUGhldEZvbnQgZnJvbSAnLi4vLi4vLi4vLi4vLi4vc2NlbmVyeS1waGV0L2pzL1BoZXRGb250LmpzJztcclxuaW1wb3J0IFRpbWVDb250cm9sTm9kZSBmcm9tICcuLi8uLi8uLi8uLi8uLi9zY2VuZXJ5LXBoZXQvanMvVGltZUNvbnRyb2xOb2RlLmpzJztcclxuaW1wb3J0IHsgSW1hZ2UsIFRleHQsIFZCb3ggfSBmcm9tICcuLi8uLi8uLi8uLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgQWNjb3JkaW9uQm94IGZyb20gJy4uLy4uLy4uLy4uLy4uL3N1bi9qcy9BY2NvcmRpb25Cb3guanMnO1xyXG5pbXBvcnQgQXF1YVJhZGlvQnV0dG9uR3JvdXAgZnJvbSAnLi4vLi4vLi4vLi4vLi4vc3VuL2pzL0FxdWFSYWRpb0J1dHRvbkdyb3VwLmpzJztcclxuaW1wb3J0IEJvb2xlYW5SZWN0YW5ndWxhclRvZ2dsZUJ1dHRvbiBmcm9tICcuLi8uLi8uLi8uLi8uLi9zdW4vanMvYnV0dG9ucy9Cb29sZWFuUmVjdGFuZ3VsYXJUb2dnbGVCdXR0b24uanMnO1xyXG5pbXBvcnQgUmVjdGFuZ3VsYXJQdXNoQnV0dG9uIGZyb20gJy4uLy4uLy4uLy4uLy4uL3N1bi9qcy9idXR0b25zL1JlY3Rhbmd1bGFyUHVzaEJ1dHRvbi5qcyc7XHJcbmltcG9ydCBDaGVja2JveCBmcm9tICcuLi8uLi8uLi8uLi8uLi9zdW4vanMvQ2hlY2tib3guanMnO1xyXG5pbXBvcnQgQ29tYm9Cb3ggZnJvbSAnLi4vLi4vLi4vLi4vLi4vc3VuL2pzL0NvbWJvQm94LmpzJztcclxuaW1wb3J0IERlbW9zU2NyZWVuVmlldyBmcm9tICcuLi8uLi8uLi8uLi8uLi9zdW4vanMvZGVtby9EZW1vc1NjcmVlblZpZXcuanMnO1xyXG5pbXBvcnQgYWNjb3JkaW9uX3BuZyBmcm9tICcuLi8uLi8uLi8uLi9pbWFnZXMvYWNjb3JkaW9uX3BuZy5qcyc7XHJcbmltcG9ydCB0YW1ibyBmcm9tICcuLi8uLi8uLi90YW1iby5qcyc7XHJcbmltcG9ydCBTbGlkZXJTb3VuZFRlc3ROb2RlIGZyb20gJy4vU2xpZGVyU291bmRUZXN0Tm9kZS5qcyc7XHJcbmltcG9ydCBVSUNvbXBvbmVudHNNb2RlbCBmcm9tICcuLi9tb2RlbC9VSUNvbXBvbmVudHNNb2RlbC5qcyc7XHJcbmltcG9ydCBCb3VuZHMyIGZyb20gJy4uLy4uLy4uLy4uLy4uL2RvdC9qcy9Cb3VuZHMyLmpzJztcclxuaW1wb3J0IFByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uLy4uL2F4b24vanMvUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgQUJTd2l0Y2ggZnJvbSAnLi4vLi4vLi4vLi4vLi4vc3VuL2pzL0FCU3dpdGNoLmpzJztcclxuaW1wb3J0IE9uT2ZmU3dpdGNoIGZyb20gJy4uLy4uLy4uLy4uLy4uL3N1bi9qcy9Pbk9mZlN3aXRjaC5qcyc7XHJcbmltcG9ydCBncmFiU291bmRQbGF5ZXIgZnJvbSAnLi4vLi4vLi4vc2hhcmVkLXNvdW5kLXBsYXllcnMvZ3JhYlNvdW5kUGxheWVyLmpzJztcclxuaW1wb3J0IHJlbGVhc2VTb3VuZFBsYXllciBmcm9tICcuLi8uLi8uLi9zaGFyZWQtc291bmQtcGxheWVycy9yZWxlYXNlU291bmRQbGF5ZXIuanMnO1xyXG5pbXBvcnQgbnVsbFNvdW5kUGxheWVyIGZyb20gJy4uLy4uLy4uL3NoYXJlZC1zb3VuZC1wbGF5ZXJzL251bGxTb3VuZFBsYXllci5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vLi4vLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgTEFCRUxfRk9OVCA9IG5ldyBQaGV0Rm9udCggMjAgKTtcclxuXHJcbmNsYXNzIFVJQ29tcG9uZW50c1NjcmVlblZpZXcgZXh0ZW5kcyBEZW1vc1NjcmVlblZpZXcge1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIG1vZGVsOiBVSUNvbXBvbmVudHNNb2RlbCApIHtcclxuXHJcbiAgICBjb25zdCBkZW1vcyA9IFtcclxuICAgICAge1xyXG4gICAgICAgIGxhYmVsOiAnQUJTd2l0Y2gnLFxyXG4gICAgICAgIGNyZWF0ZU5vZGU6ICggbGF5b3V0Qm91bmRzOiBCb3VuZHMyICkgPT4gbmV3IFZCb3goIHtcclxuICAgICAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgICAgIG5ldyBUZXh0KCAnRGVmYXVsdCBTb3VuZHM6JywgeyBmb250OiBMQUJFTF9GT05UIH0gKSxcclxuICAgICAgICAgICAgbmV3IEFCU3dpdGNoKFxyXG4gICAgICAgICAgICAgIG1vZGVsLmFiU3dpdGNoMVByb3BlcnR5LFxyXG4gICAgICAgICAgICAgIGZhbHNlLFxyXG4gICAgICAgICAgICAgIG5ldyBUZXh0KCAnVGFzdGVzIEdyZWF0JywgeyBmb250OiBMQUJFTF9GT05UIH0gKSxcclxuICAgICAgICAgICAgICB0cnVlLFxyXG4gICAgICAgICAgICAgIG5ldyBUZXh0KCAnTGVzcyBGaWxsaW5nJywgeyBmb250OiBMQUJFTF9GT05UIH0gKSxcclxuICAgICAgICAgICAgICB7IGNlbnRlcjogbGF5b3V0Qm91bmRzLmNlbnRlciB9XHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIG5ldyBUZXh0KCAnQ3VzdG9tIFNvdW5kczonLCB7IGZvbnQ6IExBQkVMX0ZPTlQgfSApLFxyXG4gICAgICAgICAgICBuZXcgQUJTd2l0Y2goXHJcbiAgICAgICAgICAgICAgbW9kZWwuYWJTd2l0Y2gyUHJvcGVydHksXHJcbiAgICAgICAgICAgICAgZmFsc2UsXHJcbiAgICAgICAgICAgICAgbmV3IFRleHQoICdIZWFkcycsIHsgZm9udDogTEFCRUxfRk9OVCB9ICksXHJcbiAgICAgICAgICAgICAgdHJ1ZSxcclxuICAgICAgICAgICAgICBuZXcgVGV4dCggJ1RhaWxzJywgeyBmb250OiBMQUJFTF9GT05UIH0gKSxcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjZW50ZXI6IGxheW91dEJvdW5kcy5jZW50ZXIsXHJcbiAgICAgICAgICAgICAgICB0b2dnbGVTd2l0Y2hPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgIHN3aXRjaFRvTGVmdFNvdW5kUGxheWVyOiBncmFiU291bmRQbGF5ZXIsXHJcbiAgICAgICAgICAgICAgICAgIHN3aXRjaFRvUmlnaHRTb3VuZFBsYXllcjogcmVsZWFzZVNvdW5kUGxheWVyXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBuZXcgVGV4dCggJ05vIFNvdW5kczonLCB7IGZvbnQ6IExBQkVMX0ZPTlQgfSApLFxyXG4gICAgICAgICAgICBuZXcgQUJTd2l0Y2goXHJcbiAgICAgICAgICAgICAgbW9kZWwuYWJTd2l0Y2gzUHJvcGVydHksXHJcbiAgICAgICAgICAgICAgZmFsc2UsXHJcbiAgICAgICAgICAgICAgbmV3IFRleHQoICdTaGhoaCcsIHsgZm9udDogTEFCRUxfRk9OVCB9ICksXHJcbiAgICAgICAgICAgICAgdHJ1ZSxcclxuICAgICAgICAgICAgICBuZXcgVGV4dCggJ1F1aWV0JywgeyBmb250OiBMQUJFTF9GT05UIH0gKSxcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjZW50ZXI6IGxheW91dEJvdW5kcy5jZW50ZXIsXHJcbiAgICAgICAgICAgICAgICB0b2dnbGVTd2l0Y2hPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgIHN3aXRjaFRvTGVmdFNvdW5kUGxheWVyOiBudWxsU291bmRQbGF5ZXIsXHJcbiAgICAgICAgICAgICAgICAgIHN3aXRjaFRvUmlnaHRTb3VuZFBsYXllcjogbnVsbFNvdW5kUGxheWVyXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgc3BhY2luZzogMzAsXHJcbiAgICAgICAgICBjZW50ZXI6IGxheW91dEJvdW5kcy5jZW50ZXJcclxuICAgICAgICB9IClcclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIGxhYmVsOiAnT25PZmZTd2l0Y2gnLFxyXG4gICAgICAgIGNyZWF0ZU5vZGU6ICggbGF5b3V0Qm91bmRzOiBCb3VuZHMyICkgPT4gbmV3IFZCb3goIHtcclxuICAgICAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgICAgIG5ldyBUZXh0KCAnT24gT2ZmIFN3aXRjaDonLCB7IGZvbnQ6IExBQkVMX0ZPTlQgfSApLFxyXG4gICAgICAgICAgICBuZXcgT25PZmZTd2l0Y2goXHJcbiAgICAgICAgICAgICAgbW9kZWwuYWJTd2l0Y2gxUHJvcGVydHksXHJcbiAgICAgICAgICAgICAgeyBjZW50ZXI6IGxheW91dEJvdW5kcy5jZW50ZXIgfVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgc3BhY2luZzogMzAsXHJcbiAgICAgICAgICBjZW50ZXI6IGxheW91dEJvdW5kcy5jZW50ZXJcclxuICAgICAgICB9IClcclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIGxhYmVsOiAnUHVzaEJ1dHRvbicsXHJcbiAgICAgICAgY3JlYXRlTm9kZTogKCBsYXlvdXRCb3VuZHM6IEJvdW5kczIgKSA9PiBuZXcgUmVjdGFuZ3VsYXJQdXNoQnV0dG9uKCB7XHJcbiAgICAgICAgICBjb250ZW50OiBuZXcgVGV4dCggJ1lvdVxcJ3JlIFB1c2hpbmcgSXQuJywgeyBmb250OiBMQUJFTF9GT05UIH0gKSxcclxuICAgICAgICAgIGNlbnRlcjogbGF5b3V0Qm91bmRzLmNlbnRlclxyXG4gICAgICAgIH0gKVxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgbGFiZWw6ICdDaGVja2JveCcsXHJcbiAgICAgICAgY3JlYXRlTm9kZTogKCBsYXlvdXRCb3VuZHM6IEJvdW5kczIgKSA9PiBuZXcgQ2hlY2tib3goIG5ldyBCb29sZWFuUHJvcGVydHkoIGZhbHNlICksIG5ldyBUZXh0KCAnQ2hlY2sgaXQgT3V0JywgeyBmb250OiBMQUJFTF9GT05UIH0gKSwge1xyXG4gICAgICAgICAgY2VudGVyOiBsYXlvdXRCb3VuZHMuY2VudGVyXHJcbiAgICAgICAgfSApXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBsYWJlbDogJ0FxdWFSYWRpb0J1dHRvbkdyb3VwJyxcclxuICAgICAgICBjcmVhdGVOb2RlOiAoIGxheW91dEJvdW5kczogQm91bmRzMiApID0+IHtcclxuICAgICAgICAgIGNvbnN0IHJhZGlvQnV0dG9uSXRlbXMgPSBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBjcmVhdGVOb2RlOiAoIHRhbmRlbTogVGFuZGVtICkgPT4gbmV3IFRleHQoICdPbmUgVGhpbmcnLCB7IGZvbnQ6IExBQkVMX0ZPTlQgfSApLFxyXG4gICAgICAgICAgICAgIHZhbHVlOiAwXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBjcmVhdGVOb2RlOiAoIHRhbmRlbTogVGFuZGVtICkgPT4gbmV3IFRleHQoICdBbm90aGVyIFRoaW5nJywgeyBmb250OiBMQUJFTF9GT05UIH0gKSxcclxuICAgICAgICAgICAgICB2YWx1ZTogMVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgY3JlYXRlTm9kZTogKCB0YW5kZW06IFRhbmRlbSApID0+IG5ldyBUZXh0KCAnQW4gRW50aXJlbHkgRGlmZmVyZW50IFRoaW5nJywgeyBmb250OiBMQUJFTF9GT05UIH0gKSxcclxuICAgICAgICAgICAgICB2YWx1ZTogMlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBdO1xyXG4gICAgICAgICAgcmV0dXJuIG5ldyBBcXVhUmFkaW9CdXR0b25Hcm91cChcclxuICAgICAgICAgICAgbmV3IE51bWJlclByb3BlcnR5KCAwICksXHJcbiAgICAgICAgICAgIHJhZGlvQnV0dG9uSXRlbXMsXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBvcmllbnRhdGlvbjogJ3ZlcnRpY2FsJyxcclxuICAgICAgICAgICAgICBhbGlnbjogJ2xlZnQnLFxyXG4gICAgICAgICAgICAgIHNwYWNpbmc6IDEwLFxyXG4gICAgICAgICAgICAgIGNlbnRlcjogbGF5b3V0Qm91bmRzLmNlbnRlclxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIGxhYmVsOiAnVGltZUNvbnRyb2xOb2RlJyxcclxuICAgICAgICBjcmVhdGVOb2RlOiAoIGxheW91dEJvdW5kczogQm91bmRzMiApID0+IG5ldyBUaW1lQ29udHJvbE5vZGUoXHJcbiAgICAgICAgICBuZXcgQm9vbGVhblByb3BlcnR5KCB0cnVlICksXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGNlbnRlcjogbGF5b3V0Qm91bmRzLmNlbnRlcixcclxuICAgICAgICAgICAgcGxheVBhdXNlU3RlcEJ1dHRvbk9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICBpbmNsdWRlU3RlcEJhY2t3YXJkQnV0dG9uOiB0cnVlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBsYWJlbDogJ1Jlc2V0QWxsQnV0dG9uJyxcclxuICAgICAgICBjcmVhdGVOb2RlOiAoIGxheW91dEJvdW5kczogQm91bmRzMiApID0+IG5ldyBSZXNldEFsbEJ1dHRvbiggeyBjZW50ZXI6IGxheW91dEJvdW5kcy5jZW50ZXIgfSApXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBsYWJlbDogJ0NvbWJvQm94JyxcclxuICAgICAgICBjcmVhdGVOb2RlOiAoIGxheW91dEJvdW5kczogQm91bmRzMiApID0+IG5ldyBDb21ib0JveCggbmV3IE51bWJlclByb3BlcnR5KCAwICksIFtcclxuICAgICAgICAgIHsgdmFsdWU6IDAsIGNyZWF0ZU5vZGU6ICgpID0+IG5ldyBUZXh0KCAnUmFpbmJvd3MnLCB7IGZvbnQ6IExBQkVMX0ZPTlQgfSApIH0sXHJcbiAgICAgICAgICB7IHZhbHVlOiAxLCBjcmVhdGVOb2RlOiAoKSA9PiBuZXcgVGV4dCggJ1VuaWNvcm5zJywgeyBmb250OiBMQUJFTF9GT05UIH0gKSB9LFxyXG4gICAgICAgICAgeyB2YWx1ZTogMiwgY3JlYXRlTm9kZTogKCkgPT4gbmV3IFRleHQoICdCdXR0ZXJmbGllcycsIHsgZm9udDogTEFCRUxfRk9OVCB9ICkgfVxyXG4gICAgICAgIF0sIHRoaXMsIHsgY2VudGVyOiBsYXlvdXRCb3VuZHMuY2VudGVyIH0gKVxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgbGFiZWw6ICdCb29sZWFuUmVjdGFuZ3VsYXJUb2dnbGVCdXR0b24nLFxyXG4gICAgICAgIGNyZWF0ZU5vZGU6ICggbGF5b3V0Qm91bmRzOiBCb3VuZHMyICkgPT4gbmV3IEJvb2xlYW5SZWN0YW5ndWxhclRvZ2dsZUJ1dHRvbiggbmV3IEJvb2xlYW5Qcm9wZXJ0eSggdHJ1ZSApLCBuZXcgVGV4dCggJ1llcCcsIHsgZm9udDogTEFCRUxfRk9OVCB9ICksIG5ldyBUZXh0KCAnTm9wZScsIHsgZm9udDogTEFCRUxfRk9OVCB9ICksIHtcclxuICAgICAgICAgIGJhc2VDb2xvcjogJyNCM0ZGRUMnLFxyXG4gICAgICAgICAgY2VudGVyOiBsYXlvdXRCb3VuZHMuY2VudGVyXHJcbiAgICAgICAgfSApXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBsYWJlbDogJ0FjY29yZGlvbkJveCcsXHJcbiAgICAgICAgY3JlYXRlTm9kZTogKCBsYXlvdXRCb3VuZHM6IEJvdW5kczIgKSA9PiBuZXcgQWNjb3JkaW9uQm94KFxyXG4gICAgICAgICAgbmV3IEltYWdlKCBhY2NvcmRpb25fcG5nLCB7IG1heFdpZHRoOiAyMDAgfSApLFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZU5vZGU6IG5ldyBUZXh0KCAnQWNjb3JkaW9uIEJveCcsIHsgZm9udDogTEFCRUxfRk9OVCB9ICksXHJcbiAgICAgICAgICAgIGV4cGFuZGVkUHJvcGVydHk6IG5ldyBCb29sZWFuUHJvcGVydHkoIGZhbHNlICksXHJcbiAgICAgICAgICAgIGNvbnRlbnRYTWFyZ2luOiAzMCxcclxuICAgICAgICAgICAgY29udGVudFlNYXJnaW46IDIwLFxyXG4gICAgICAgICAgICBjb250ZW50WVNwYWNpbmc6IDIwLFxyXG4gICAgICAgICAgICBjZW50ZXI6IGxheW91dEJvdW5kcy5jZW50ZXJcclxuICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBsYWJlbDogJ1NsaWRlcnMnLFxyXG4gICAgICAgIGNyZWF0ZU5vZGU6ICggbGF5b3V0Qm91bmRzOiBCb3VuZHMyICkgPT4gbmV3IFNsaWRlclNvdW5kVGVzdE5vZGUoIExBQkVMX0ZPTlQsIGxheW91dEJvdW5kcy5jZW50ZXIgKVxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgbGFiZWw6ICdOdW1iZXJDb250cm9sJyxcclxuICAgICAgICBjcmVhdGVOb2RlOiAoIGxheW91dEJvdW5kczogQm91bmRzMiApID0+IG5ldyBWQm94KCB7XHJcbiAgICAgICAgICBjaGlsZHJlbjogW1xyXG5cclxuICAgICAgICAgICAgbmV3IE51bWJlckNvbnRyb2woICdIb3cgbXVjaCB5b3Ugd2FudD8nLCBuZXcgTnVtYmVyUHJvcGVydHkoIDAgKSwgbmV3IFJhbmdlKCAwLCAxMCApLCB7IGRlbHRhOiAyIH0gKSxcclxuXHJcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYW4gZXhhbXBsZSBvZiBhIG51bWJlciBjb250cm9sIHRoYXQgaGFzIGEgZGVsdGEgdmFsdWUgdGhhdCBsZWFkcyB0byB0aHJlc2hvbGRzIGluIHRoZSBzb3VuZFxyXG4gICAgICAgICAgICAvLyBwbGF5ZXIgdGhhdCBhcmUgbm90IGFsbCBlcXVhbGx5IHNpemVkLiAgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zdW4vaXNzdWVzLzY5Ny5cclxuICAgICAgICAgICAgbmV3IE51bWJlckNvbnRyb2woICdIb3cgbXVjaCB5b3Ugd2FudCAoYXN5bW1ldHJpYyk/JywgbmV3IE51bWJlclByb3BlcnR5KCAwICksIG5ldyBSYW5nZSggMCwgMTAwICksIHsgZGVsdGE6IDIyIH0gKVxyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIHNwYWNpbmc6IDIwLFxyXG4gICAgICAgICAgY2VudGVyOiBsYXlvdXRCb3VuZHMuY2VudGVyXHJcbiAgICAgICAgfSApXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBsYWJlbDogJ051bWJlclBpY2tlcicsXHJcbiAgICAgICAgY3JlYXRlTm9kZTogKCBsYXlvdXRCb3VuZHM6IEJvdW5kczIgKSA9PiBuZXcgVkJveCgge1xyXG4gICAgICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICAgICAgbmV3IE51bWJlclBpY2tlciggbmV3IE51bWJlclByb3BlcnR5KCAwICksIG5ldyBQcm9wZXJ0eTxSYW5nZT4oIG5ldyBSYW5nZSggMCwgNCApICkgKVxyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIHNwYWNpbmc6IDIwLFxyXG4gICAgICAgICAgY2VudGVyOiBsYXlvdXRCb3VuZHMuY2VudGVyXHJcbiAgICAgICAgfSApXHJcbiAgICAgIH1cclxuICAgIF07XHJcblxyXG4gICAgc3VwZXIoIGRlbW9zICk7XHJcblxyXG4gICAgLy8gYWRkIHRoZSByZXNldCBhbGwgYnV0dG9uXHJcbiAgICBjb25zdCByZXNldEFsbEJ1dHRvbiA9IG5ldyBSZXNldEFsbEJ1dHRvbigge1xyXG4gICAgICByaWdodDogdGhpcy5sYXlvdXRCb3VuZHMubWF4WCAtIDI1LFxyXG4gICAgICBib3R0b206IHRoaXMubGF5b3V0Qm91bmRzLm1heFkgLSAyNSxcclxuICAgICAgbGlzdGVuZXI6ICgpID0+IHtcclxuICAgICAgICBtb2RlbC5yZXNldCgpO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLmFkZENoaWxkKCByZXNldEFsbEJ1dHRvbiApO1xyXG4gIH1cclxufVxyXG5cclxudGFtYm8ucmVnaXN0ZXIoICdVSUNvbXBvbmVudHNTY3JlZW5WaWV3JywgVUlDb21wb25lbnRzU2NyZWVuVmlldyApO1xyXG5leHBvcnQgZGVmYXVsdCBVSUNvbXBvbmVudHNTY3JlZW5WaWV3OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLGVBQWUsTUFBTSwyQ0FBMkM7QUFDdkUsT0FBT0MsY0FBYyxNQUFNLDBDQUEwQztBQUNyRSxPQUFPQyxLQUFLLE1BQU0sZ0NBQWdDO0FBQ2xELE9BQU9DLGNBQWMsTUFBTSwwREFBMEQ7QUFDckYsT0FBT0MsYUFBYSxNQUFNLGlEQUFpRDtBQUMzRSxPQUFPQyxZQUFZLE1BQU0sdUNBQXVDO0FBQ2hFLE9BQU9DLFFBQVEsTUFBTSw0Q0FBNEM7QUFDakUsT0FBT0MsZUFBZSxNQUFNLG1EQUFtRDtBQUMvRSxTQUFTQyxLQUFLLEVBQUVDLElBQUksRUFBRUMsSUFBSSxRQUFRLHNDQUFzQztBQUN4RSxPQUFPQyxZQUFZLE1BQU0sdUNBQXVDO0FBQ2hFLE9BQU9DLG9CQUFvQixNQUFNLCtDQUErQztBQUNoRixPQUFPQyw4QkFBOEIsTUFBTSxpRUFBaUU7QUFDNUcsT0FBT0MscUJBQXFCLE1BQU0sd0RBQXdEO0FBQzFGLE9BQU9DLFFBQVEsTUFBTSxtQ0FBbUM7QUFDeEQsT0FBT0MsUUFBUSxNQUFNLG1DQUFtQztBQUN4RCxPQUFPQyxlQUFlLE1BQU0sK0NBQStDO0FBQzNFLE9BQU9DLGFBQWEsTUFBTSxxQ0FBcUM7QUFDL0QsT0FBT0MsS0FBSyxNQUFNLG1CQUFtQjtBQUNyQyxPQUFPQyxtQkFBbUIsTUFBTSwwQkFBMEI7QUFHMUQsT0FBT0MsUUFBUSxNQUFNLG9DQUFvQztBQUN6RCxPQUFPQyxRQUFR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