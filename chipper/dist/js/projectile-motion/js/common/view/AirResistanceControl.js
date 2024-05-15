// Copyright 2020-2023, University of Colorado Boulder

/**
 * Scenery node that shows the background, including the sky, grass, and road.
 *
 * @author Andrea Lin (PhET Interactive Simulations)
 */

import Utils from '../../../../dot/js/Utils.js';
import merge from '../../../../phet-core/js/merge.js';
import optionize from '../../../../phet-core/js/optionize.js';
import { HBox, Node, Text, VBox } from '../../../../scenery/js/imports.js';
import Checkbox from '../../../../sun/js/Checkbox.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import projectileMotion from '../../projectileMotion.js';
import ProjectileMotionStrings from '../../ProjectileMotionStrings.js';
import ProjectileMotionConstants from '../ProjectileMotionConstants.js';
const airResistanceString = ProjectileMotionStrings.airResistance;
const dragCoefficientString = ProjectileMotionStrings.dragCoefficient;

// constants
const AIR_RESISTANCE_ICON = ProjectileMotionConstants.AIR_RESISTANCE_ICON;
class AirResistanceControl extends VBox {
  constructor(airResistanceOnProperty, projectileDragCoefficientProperty, providedOptions) {
    const options = optionize()({
      labelOptions: {},
      minWidth: 100,
      xMargin: 5,
      align: 'left',
      tandem: Tandem.REQUIRED
    }, providedOptions);
    const dragCoefficientText = new Text('', merge({}, options.labelOptions, {
      maxWidth: options.minWidth - 2 * options.xMargin,
      tandem: options.tandem.createTandem('dragCoefficientText'),
      stringPropertyOptions: {
        phetioReadOnly: true
      } // because this display shouldn't be edited
    }));
    dragCoefficientText.setBoundsMethod('accurate');

    // air resistance
    const titleText = new Text(airResistanceString, merge({}, options.labelOptions, {
      tandem: options.tandem.createTandem('titleText')
    }));
    const airResistanceCheckboxContent = new HBox({
      spacing: options.xMargin,
      children: [titleText, new Node({
        children: [AIR_RESISTANCE_ICON]
      })]
    });
    const checkbox = new Checkbox(airResistanceOnProperty, airResistanceCheckboxContent, {
      maxWidth: options.minWidth - 3 * options.xMargin,
      // left, right, and spacing between text and icon
      boxWidth: 18,
      tandem: options.tandem.createTandem('checkbox')
    });

    // disabling and enabling drag and altitude controls depending on whether air resistance is on
    airResistanceOnProperty.link(airResistanceOn => {
      const opacity = airResistanceOn ? 1 : 0.5;
      dragCoefficientText.setOpacity(opacity);
    });

    // Listen to changes in model drag coefficient and update the view text
    projectileDragCoefficientProperty.link(value => {
      dragCoefficientText.setString(`${dragCoefficientString}: ${Utils.toFixed(value, 2)}`);
    });
    assert && assert(!options.children, 'AirResistanceControl sets its own children');
    options.children = [checkbox, dragCoefficientText];

    // xMargin is used for FlowBox
    super(_.omit(options, 'xMargin'));
  }
}
projectileMotion.register('AirResistanceControl', AirResistanceControl);
export default AirResistanceControl;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJVdGlscyIsIm1lcmdlIiwib3B0aW9uaXplIiwiSEJveCIsIk5vZGUiLCJUZXh0IiwiVkJveCIsIkNoZWNrYm94IiwiVGFuZGVtIiwicHJvamVjdGlsZU1vdGlvbiIsIlByb2plY3RpbGVNb3Rpb25TdHJpbmdzIiwiUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cyIsImFpclJlc2lzdGFuY2VTdHJpbmciLCJhaXJSZXNpc3RhbmNlIiwiZHJhZ0NvZWZmaWNpZW50U3RyaW5nIiwiZHJhZ0NvZWZmaWNpZW50IiwiQUlSX1JFU0lTVEFOQ0VfSUNPTiIsIkFpclJlc2lzdGFuY2VDb250cm9sIiwiY29uc3RydWN0b3IiLCJhaXJSZXNpc3RhbmNlT25Qcm9wZXJ0eSIsInByb2plY3RpbGVEcmFnQ29lZmZpY2llbnRQcm9wZXJ0eSIsInByb3ZpZGVkT3B0aW9ucyIsIm9wdGlvbnMiLCJsYWJlbE9wdGlvbnMiLCJtaW5XaWR0aCIsInhNYXJnaW4iLCJhbGlnbiIsInRhbmRlbSIsIlJFUVVJUkVEIiwiZHJhZ0NvZWZmaWNpZW50VGV4dCIsIm1heFdpZHRoIiwiY3JlYXRlVGFuZGVtIiwic3RyaW5nUHJvcGVydHlPcHRpb25zIiwicGhldGlvUmVhZE9ubHkiLCJzZXRCb3VuZHNNZXRob2QiLCJ0aXRsZVRleHQiLCJhaXJSZXNpc3RhbmNlQ2hlY2tib3hDb250ZW50Iiwic3BhY2luZyIsImNoaWxkcmVuIiwiY2hlY2tib3giLCJib3hXaWR0aCIsImxpbmsiLCJhaXJSZXNpc3RhbmNlT24iLCJvcGFjaXR5Iiwic2V0T3BhY2l0eSIsInZhbHVlIiwic2V0U3RyaW5nIiwidG9GaXhlZCIsImFzc2VydCIsIl8iLCJvbWl0IiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJBaXJSZXNpc3RhbmNlQ29udHJvbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMC0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBTY2VuZXJ5IG5vZGUgdGhhdCBzaG93cyB0aGUgYmFja2dyb3VuZCwgaW5jbHVkaW5nIHRoZSBza3ksIGdyYXNzLCBhbmQgcm9hZC5cclxuICpcclxuICogQGF1dGhvciBBbmRyZWEgTGluIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBCb29sZWFuUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9Cb29sZWFuUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBVdGlscyBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvVXRpbHMuanMnO1xyXG5pbXBvcnQgbWVyZ2UgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL21lcmdlLmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IHsgSEJveCwgTm9kZSwgVGV4dCwgVGV4dE9wdGlvbnMsIFZCb3gsIFZCb3hPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IENoZWNrYm94IGZyb20gJy4uLy4uLy4uLy4uL3N1bi9qcy9DaGVja2JveC5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcbmltcG9ydCBwcm9qZWN0aWxlTW90aW9uIGZyb20gJy4uLy4uL3Byb2plY3RpbGVNb3Rpb24uanMnO1xyXG5pbXBvcnQgUHJvamVjdGlsZU1vdGlvblN0cmluZ3MgZnJvbSAnLi4vLi4vUHJvamVjdGlsZU1vdGlvblN0cmluZ3MuanMnO1xyXG5pbXBvcnQgUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cyBmcm9tICcuLi9Qcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLmpzJztcclxuXHJcbmNvbnN0IGFpclJlc2lzdGFuY2VTdHJpbmcgPSBQcm9qZWN0aWxlTW90aW9uU3RyaW5ncy5haXJSZXNpc3RhbmNlO1xyXG5jb25zdCBkcmFnQ29lZmZpY2llbnRTdHJpbmcgPSBQcm9qZWN0aWxlTW90aW9uU3RyaW5ncy5kcmFnQ29lZmZpY2llbnQ7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgQUlSX1JFU0lTVEFOQ0VfSUNPTiA9IFByb2plY3RpbGVNb3Rpb25Db25zdGFudHMuQUlSX1JFU0lTVEFOQ0VfSUNPTjtcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcbiAgbGFiZWxPcHRpb25zPzogVGV4dE9wdGlvbnM7XHJcbiAgbWluV2lkdGg/OiBudW1iZXI7XHJcbiAgeE1hcmdpbj86IG51bWJlcjtcclxuICBhbGlnbj86IHN0cmluZztcclxufTtcclxuXHJcbnR5cGUgQWlyUmVzaXN0YW5jZUNvbnRyb2xPcHRpb25zID0gU2VsZk9wdGlvbnMgJiBWQm94T3B0aW9ucztcclxuXHJcbmNsYXNzIEFpclJlc2lzdGFuY2VDb250cm9sIGV4dGVuZHMgVkJveCB7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBhaXJSZXNpc3RhbmNlT25Qcm9wZXJ0eTogQm9vbGVhblByb3BlcnR5LCBwcm9qZWN0aWxlRHJhZ0NvZWZmaWNpZW50UHJvcGVydHk6IFByb3BlcnR5PG51bWJlcj4sXHJcbiAgICAgICAgICAgICAgICAgICAgICBwcm92aWRlZE9wdGlvbnM/OiBBaXJSZXNpc3RhbmNlQ29udHJvbE9wdGlvbnMgKSB7XHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPEFpclJlc2lzdGFuY2VDb250cm9sT3B0aW9ucywgU2VsZk9wdGlvbnMsIFZCb3hPcHRpb25zPigpKCB7XHJcbiAgICAgIGxhYmVsT3B0aW9uczoge30sXHJcbiAgICAgIG1pbldpZHRoOiAxMDAsXHJcbiAgICAgIHhNYXJnaW46IDUsXHJcbiAgICAgIGFsaWduOiAnbGVmdCcsXHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLlJFUVVJUkVEXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBjb25zdCBkcmFnQ29lZmZpY2llbnRUZXh0ID0gbmV3IFRleHQoICcnLCBtZXJnZSgge30sIG9wdGlvbnMubGFiZWxPcHRpb25zLCB7XHJcbiAgICAgIG1heFdpZHRoOiBvcHRpb25zLm1pbldpZHRoIC0gMiAqIG9wdGlvbnMueE1hcmdpbixcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdkcmFnQ29lZmZpY2llbnRUZXh0JyApLFxyXG4gICAgICBzdHJpbmdQcm9wZXJ0eU9wdGlvbnM6IHsgcGhldGlvUmVhZE9ubHk6IHRydWUgfSAvLyBiZWNhdXNlIHRoaXMgZGlzcGxheSBzaG91bGRuJ3QgYmUgZWRpdGVkXHJcbiAgICB9ICkgKTtcclxuXHJcbiAgICBkcmFnQ29lZmZpY2llbnRUZXh0LnNldEJvdW5kc01ldGhvZCggJ2FjY3VyYXRlJyApO1xyXG5cclxuICAgIC8vIGFpciByZXNpc3RhbmNlXHJcbiAgICBjb25zdCB0aXRsZVRleHQgPSBuZXcgVGV4dCggYWlyUmVzaXN0YW5jZVN0cmluZywgbWVyZ2UoIHt9LCBvcHRpb25zLmxhYmVsT3B0aW9ucywge1xyXG4gICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ3RpdGxlVGV4dCcgKVxyXG4gICAgfSApICk7XHJcbiAgICBjb25zdCBhaXJSZXNpc3RhbmNlQ2hlY2tib3hDb250ZW50ID0gbmV3IEhCb3goIHtcclxuICAgICAgc3BhY2luZzogb3B0aW9ucy54TWFyZ2luLFxyXG4gICAgICBjaGlsZHJlbjogWyB0aXRsZVRleHQsIG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIEFJUl9SRVNJU1RBTkNFX0lDT04gXSB9ICkgXVxyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IGNoZWNrYm94ID0gbmV3IENoZWNrYm94KCBhaXJSZXNpc3RhbmNlT25Qcm9wZXJ0eSwgYWlyUmVzaXN0YW5jZUNoZWNrYm94Q29udGVudCwge1xyXG4gICAgICBtYXhXaWR0aDogb3B0aW9ucy5taW5XaWR0aCAtIDMgKiBvcHRpb25zLnhNYXJnaW4sIC8vIGxlZnQsIHJpZ2h0LCBhbmQgc3BhY2luZyBiZXR3ZWVuIHRleHQgYW5kIGljb25cclxuICAgICAgYm94V2lkdGg6IDE4LFxyXG4gICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ2NoZWNrYm94JyApXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gZGlzYWJsaW5nIGFuZCBlbmFibGluZyBkcmFnIGFuZCBhbHRpdHVkZSBjb250cm9scyBkZXBlbmRpbmcgb24gd2hldGhlciBhaXIgcmVzaXN0YW5jZSBpcyBvblxyXG4gICAgYWlyUmVzaXN0YW5jZU9uUHJvcGVydHkubGluayggYWlyUmVzaXN0YW5jZU9uID0+IHtcclxuICAgICAgY29uc3Qgb3BhY2l0eSA9IGFpclJlc2lzdGFuY2VPbiA/IDEgOiAwLjU7XHJcbiAgICAgIGRyYWdDb2VmZmljaWVudFRleHQuc2V0T3BhY2l0eSggb3BhY2l0eSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIExpc3RlbiB0byBjaGFuZ2VzIGluIG1vZGVsIGRyYWcgY29lZmZpY2llbnQgYW5kIHVwZGF0ZSB0aGUgdmlldyB0ZXh0XHJcbiAgICBwcm9qZWN0aWxlRHJhZ0NvZWZmaWNpZW50UHJvcGVydHkubGluayggdmFsdWUgPT4ge1xyXG4gICAgICBkcmFnQ29lZmZpY2llbnRUZXh0LnNldFN0cmluZyggYCR7ZHJhZ0NvZWZmaWNpZW50U3RyaW5nfTogJHtVdGlscy50b0ZpeGVkKCB2YWx1ZSwgMiApfWAgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhb3B0aW9ucy5jaGlsZHJlbiwgJ0FpclJlc2lzdGFuY2VDb250cm9sIHNldHMgaXRzIG93biBjaGlsZHJlbicgKTtcclxuICAgIG9wdGlvbnMuY2hpbGRyZW4gPSBbIGNoZWNrYm94LCBkcmFnQ29lZmZpY2llbnRUZXh0IF07XHJcblxyXG4gICAgLy8geE1hcmdpbiBpcyB1c2VkIGZvciBGbG93Qm94XHJcbiAgICBzdXBlciggXy5vbWl0KCBvcHRpb25zLCAneE1hcmdpbicgKSApO1xyXG4gIH1cclxufVxyXG5cclxucHJvamVjdGlsZU1vdGlvbi5yZWdpc3RlciggJ0FpclJlc2lzdGFuY2VDb250cm9sJywgQWlyUmVzaXN0YW5jZUNvbnRyb2wgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IEFpclJlc2lzdGFuY2VDb250cm9sOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFJQSxPQUFPQSxLQUFLLE1BQU0sNkJBQTZCO0FBQy9DLE9BQU9DLEtBQUssTUFBTSxtQ0FBbUM7QUFDckQsT0FBT0MsU0FBUyxNQUFNLHVDQUF1QztBQUM3RCxTQUFTQyxJQUFJLEVBQUVDLElBQUksRUFBRUMsSUFBSSxFQUFlQyxJQUFJLFFBQXFCLG1DQUFtQztBQUNwRyxPQUFPQyxRQUFRLE1BQU0sZ0NBQWdDO0FBQ3JELE9BQU9DLE1BQU0sTUFBTSxpQ0FBaUM7QUFDcEQsT0FBT0MsZ0JBQWdCLE1BQU0sMkJBQTJCO0FBQ3hELE9BQU9DLHVCQUF1QixNQUFNLGtDQUFrQztBQUN0RSxPQUFPQyx5QkFBeUIsTUFBTSxpQ0FBaUM7QUFFdkUsTUFBTUMsbUJBQW1CLEdBQUdGLHVCQUF1QixDQUFDRyxhQUFhO0FBQ2pFLE1BQU1DLHFCQUFxQixHQUFHSix1QkFBdUIsQ0FBQ0ssZUFBZTs7QUFFckU7QUFDQSxNQUFNQyxtQkFBbUIsR0FBR0wseUJBQXlCLENBQUNLLG1CQUFtQjtBQVd6RSxNQUFNQyxvQkFBb0IsU0FBU1gsSUFBSSxDQUFDO0VBQy9CWSxXQUFXQSxDQUFFQyx1QkFBd0MsRUFBRUMsaUNBQW1ELEVBQzdGQyxlQUE2QyxFQUFHO0lBQ2xFLE1BQU1DLE9BQU8sR0FBR3BCLFNBQVMsQ0FBd0QsQ0FBQyxDQUFFO01BQ2xGcUIsWUFBWSxFQUFFLENBQUMsQ0FBQztNQUNoQkMsUUFBUSxFQUFFLEdBQUc7TUFDYkMs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