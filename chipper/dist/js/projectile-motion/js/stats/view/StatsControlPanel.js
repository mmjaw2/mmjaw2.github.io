// Copyright 2022-2024, University of Colorado Boulder

/**
 * Control panel for choosing which vectors are visible.
 *
 * @author Andrea Lin(PhET Interactive Simulations)
 * @author Matthew Blackman(PhET Interactive Simulations)
 */

import Dimension2 from '../../../../dot/js/Dimension2.js';
import Range from '../../../../dot/js/Range.js';
import Utils from '../../../../dot/js/Utils.js';
import merge from '../../../../phet-core/js/merge.js';
import StringUtils from '../../../../phetcommon/js/util/StringUtils.js';
import MathSymbols from '../../../../scenery-phet/js/MathSymbols.js';
import NumberControl from '../../../../scenery-phet/js/NumberControl.js';
import { Text, VBox, VStrut } from '../../../../scenery/js/imports.js';
import Checkbox from '../../../../sun/js/Checkbox.js';
import Panel from '../../../../sun/js/Panel.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import ProjectileMotionConstants from '../../common/ProjectileMotionConstants.js';
import ArrowlessNumberControl from '../../common/view/ArrowlessNumberControl.js';
import projectileMotion from '../../projectileMotion.js';
import ProjectileMotionStrings from '../../ProjectileMotionStrings.js';
const TEXT_FONT = ProjectileMotionConstants.PANEL_LABEL_OPTIONS.font;
const READOUT_X_MARGIN = ProjectileMotionConstants.RIGHTSIDE_PANEL_OPTIONS.readoutXMargin;
const degreesString = MathSymbols.DEGREES;
const metersPerSecondString = ProjectileMotionStrings.metersPerSecond;
const angleStandardDeviationString = ProjectileMotionStrings.angleStandardDeviation;
const speedStandardDeviationString = ProjectileMotionStrings.speedStandardDeviation;
const pattern0Value1UnitsString = ProjectileMotionStrings.pattern0Value1Units;
const pattern0Value1UnitsWithSpaceString = ProjectileMotionStrings.pattern0Value1UnitsWithSpace;
class StatsControlPanel extends Panel {
  /**
   * @param {NumberProperty} groupSizeProperty - the property for the number of simultaneously launched projectiles
   * @param {NumberProperty} initialSpeedStandardDeviationProperty
   * @param {NumberProperty} initialAngleStandardDeviationProperty
   * @param {BooleanProperty} rapidFireModeProperty
   * @param {Object} [options]
   */
  constructor(groupSizeProperty, initialSpeedStandardDeviationProperty, initialAngleStandardDeviationProperty, rapidFireModeProperty, viewProperties, options) {
    // The first object is a placeholder so none of the others get mutated
    // The second object is the default, in the constants files
    // The third object is options specific to this panel, which overrides the defaults
    // The fourth object is options given at time of construction, which overrides all the others
    options = merge({}, ProjectileMotionConstants.RIGHTSIDE_PANEL_OPTIONS, {
      align: 'left',
      tandem: Tandem.REQUIRED
    }, options);

    // create group size number control
    const groupSizeNumberControl = new ArrowlessNumberControl(ProjectileMotionStrings.projectileGroupSize, '', groupSizeProperty, new Range(ProjectileMotionConstants.GROUP_SIZE_INCREMENT, ProjectileMotionConstants.GROUP_SIZE_MAX), ProjectileMotionConstants.GROUP_SIZE_INCREMENT, {
      containerWidth: options.minWidth,
      xMargin: options.xMargin,
      numberDisplayMaxWidth: options.numberDisplayMaxWidth,
      tandem: options.tandem.createTandem('groupSizeNumberControl'),
      phetioDocumentation: 'UI control to adjust the number of simultaneously launched projectiles'
    });

    //standard deviation sliders
    const defaultNumberControlOptions = {
      numberDisplayOptions: {
        align: 'right',
        maxWidth: options.numberDisplayMaxWidth + options.readoutXMargin * 2,
        xMargin: READOUT_X_MARGIN,
        yMargin: 4,
        textOptions: {
          font: TEXT_FONT
        }
      },
      titleNodeOptions: {
        font: TEXT_FONT,
        maxWidth: options.minWidth - options.numberDisplayMaxWidth - 3 * options.readoutXMargin - 2 * options.xMargin
      },
      sliderOptions: {
        trackSize: new Dimension2(options.minWidth - 2 * options.xMargin - 80, 0.5),
        thumbSize: new Dimension2(13, 22),
        thumbTouchAreaXDilation: 6,
        thumbTouchAreaYDilation: 4
      },
      arrowButtonOptions: {
        scale: 0.56,
        touchAreaXDilation: 20,
        touchAreaYDilation: 20
      }
    };

    // results in '{{value}} m/s'
    const valuePatternSpeed = StringUtils.fillIn(pattern0Value1UnitsWithSpaceString, {
      units: metersPerSecondString
    });

    // results in '{{value}} degrees'
    const valuePatternAngle = StringUtils.fillIn(pattern0Value1UnitsString, {
      units: degreesString
    });

    // create speed standard deviation number control
    const speedStandardDeviationNumberControl = new NumberControl(speedStandardDeviationString, initialSpeedStandardDeviationProperty, ProjectileMotionConstants.SPEED_STANDARD_DEVIATION_RANGE, merge({}, defaultNumberControlOptions, {
      numberDisplayOptions: {
        valuePattern: valuePatternSpeed,
        xMargin: 8,
        textOptions: {
          font: TEXT_FONT
        }
      },
      sliderOptions: {
        constrainValue: value => Utils.roundToInterval(value, 1)
      },
      delta: 1,
      layoutFunction: NumberControl.createLayoutFunction4({
        arrowButtonSpacing: 10
      }),
      tandem: options.tandem.createTandem('speedStandardDeviationNumberControl'),
      phetioDocumentation: 'UI control to adjust the standard deviation of the launch speed'
    }));

    // create angle standard deviation number control
    const angleStandardDeviationNumberControl = new NumberControl(angleStandardDeviationString, initialAngleStandardDeviationProperty, ProjectileMotionConstants.ANGLE_STANDARD_DEVIATION_RANGE, merge({}, defaultNumberControlOptions, {
      numberDisplayOptions: {
        valuePattern: valuePatternAngle,
        xMargin: 8,
        textOptions: {
          font: TEXT_FONT
        }
      },
      sliderOptions: {
        constrainValue: value => Utils.roundToInterval(value, 1)
      },
      delta: 1,
      layoutFunction: NumberControl.createLayoutFunction4({
        arrowButtonSpacing: 10
      }),
      tandem: options.tandem.createTandem('angleStandardDeviationNumberControl'),
      phetioDocumentation: 'UI control to adjust the standard deviation of the launch angle'
    }));
    const checkboxTitleOptions = ProjectileMotionConstants.PANEL_TITLE_OPTIONS;
    const checkboxOptions = {
      maxWidth: checkboxTitleOptions.maxWidth,
      boxWidth: 18
    };
    const rapidFireModeLabel = new Text('Rapid fire', ProjectileMotionConstants.LABEL_TEXT_OPTIONS);
    const rapidFireModeCheckbox = new Checkbox(rapidFireModeProperty, rapidFireModeLabel, merge({
      tandem: options.tandem.createTandem('rapidFireCheckbox')
    }, checkboxOptions));

    // The contents of the control panel
    const content = new VBox({
      align: 'left',
      spacing: options.controlsVerticalSpace,
      children: [new VBox({
        align: 'center',
        spacing: options.controlsVerticalSpace,
        children: [groupSizeNumberControl, new VStrut(1), speedStandardDeviationNumberControl, angleStandardDeviationNumberControl, new VStrut(6)]
      }), new VBox({
        align: 'left',
        spacing: options.controlsVerticalSpace,
        children: [rapidFireModeCheckbox]
      })]
    });
    super(content, options);
  }
}
projectileMotion.register('StatsControlPanel', StatsControlPanel);
export default StatsControlPanel;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJEaW1lbnNpb24yIiwiUmFuZ2UiLCJVdGlscyIsIm1lcmdlIiwiU3RyaW5nVXRpbHMiLCJNYXRoU3ltYm9scyIsIk51bWJlckNvbnRyb2wiLCJUZXh0IiwiVkJveCIsIlZTdHJ1dCIsIkNoZWNrYm94IiwiUGFuZWwiLCJUYW5kZW0iLCJQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzIiwiQXJyb3dsZXNzTnVtYmVyQ29udHJvbCIsInByb2plY3RpbGVNb3Rpb24iLCJQcm9qZWN0aWxlTW90aW9uU3RyaW5ncyIsIlRFWFRfRk9OVCIsIlBBTkVMX0xBQkVMX09QVElPTlMiLCJmb250IiwiUkVBRE9VVF9YX01BUkdJTiIsIlJJR0hUU0lERV9QQU5FTF9PUFRJT05TIiwicmVhZG91dFhNYXJnaW4iLCJkZWdyZWVzU3RyaW5nIiwiREVHUkVFUyIsIm1ldGVyc1BlclNlY29uZFN0cmluZyIsIm1ldGVyc1BlclNlY29uZCIsImFuZ2xlU3RhbmRhcmREZXZpYXRpb25TdHJpbmciLCJhbmdsZVN0YW5kYXJkRGV2aWF0aW9uIiwic3BlZWRTdGFuZGFyZERldmlhdGlvblN0cmluZyIsInNwZWVkU3RhbmRhcmREZXZpYXRpb24iLCJwYXR0ZXJuMFZhbHVlMVVuaXRzU3RyaW5nIiwicGF0dGVybjBWYWx1ZTFVbml0cyIsInBhdHRlcm4wVmFsdWUxVW5pdHNXaXRoU3BhY2VTdHJpbmciLCJwYXR0ZXJuMFZhbHVlMVVuaXRzV2l0aFNwYWNlIiwiU3RhdHNDb250cm9sUGFuZWwiLCJjb25zdHJ1Y3RvciIsImdyb3VwU2l6ZVByb3BlcnR5IiwiaW5pdGlhbFNwZWVkU3RhbmRhcmREZXZpYXRpb25Qcm9wZXJ0eSIsImluaXRpYWxBbmdsZVN0YW5kYXJkRGV2aWF0aW9uUHJvcGVydHkiLCJyYXBpZEZpcmVNb2RlUHJvcGVydHkiLCJ2aWV3UHJvcGVydGllcyIsIm9wdGlvbnMiLCJhbGlnbiIsInRhbmRlbSIsIlJFUVVJUkVEIiwiZ3JvdXBTaXplTnVtYmVyQ29udHJvbCIsInByb2plY3RpbGVHcm91cFNpemUiLCJHUk9VUF9TSVpFX0lOQ1JFTUVOVCIsIkdST1VQX1NJWkVfTUFYIiwiY29udGFpbmVyV2lkdGgiLCJtaW5XaWR0aCIsInhNYXJnaW4iLCJudW1iZXJEaXNwbGF5TWF4V2lkdGgiLCJjcmVhdGVUYW5kZW0iLCJwaGV0aW9Eb2N1bWVudGF0aW9uIiwiZGVmYXVsdE51bWJlckNvbnRyb2xPcHRpb25zIiwibnVtYmVyRGlzcGxheU9wdGlvbnMiLCJtYXhXaWR0aCIsInlNYXJnaW4iLCJ0ZXh0T3B0aW9ucyIsInRpdGxlTm9kZU9wdGlvbnMiLCJzbGlkZXJPcHRpb25zIiwidHJhY2tTaXplIiwidGh1bWJTaXplIiwidGh1bWJUb3VjaEFyZWFYRGlsYXRpb24iLCJ0aHVtYlRvdWNoQXJlYVlEaWxhdGlvbiIsImFycm93QnV0dG9uT3B0aW9ucyIsInNjYWxlIiwidG91Y2hBcmVhWERpbGF0aW9uIiwidG91Y2hBcmVhWURpbGF0aW9uIiwidmFsdWVQYXR0ZXJuU3BlZWQiLCJmaWxsSW4iLCJ1bml0cyIsInZhbHVlUGF0dGVybkFuZ2xlIiwic3BlZWRTdGFuZGFyZERldmlhdGlvbk51bWJlckNvbnRyb2wiLCJTUEVFRF9TVEFOREFSRF9ERVZJQVRJT05fUkFOR0UiLCJ2YWx1ZVBhdHRlcm4iLCJjb25zdHJhaW5WYWx1ZSIsInZhbHVlIiwicm91bmRUb0ludGVydmFsIiwiZGVsdGEiLCJsYXlvdXRGdW5jdGlvbiIsImNyZWF0ZUxheW91dEZ1bmN0aW9uNCIsImFycm93QnV0dG9uU3BhY2luZyIsImFuZ2xlU3RhbmRhcmREZXZpYXRpb25OdW1iZXJDb250cm9sIiwiQU5HTEVfU1RBTkRBUkRfREVWSUFUSU9OX1JBTkdFIiwiY2hlY2tib3hUaXRsZU9wdGlvbnMiLCJQQU5FTF9USVRMRV9PUFRJT05TIiwiY2hlY2tib3hPcHRpb25zIiwiYm94V2lkdGgiLCJyYXBpZEZpcmVNb2RlTGFiZWwiLCJMQUJFTF9URVhUX09QVElPTlMiLCJyYXBpZEZpcmVNb2RlQ2hlY2tib3giLCJjb250ZW50Iiwic3BhY2luZyIsImNvbnRyb2xzVmVydGljYWxTcGFjZSIsImNoaWxkcmVuIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJTdGF0c0NvbnRyb2xQYW5lbC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBDb250cm9sIHBhbmVsIGZvciBjaG9vc2luZyB3aGljaCB2ZWN0b3JzIGFyZSB2aXNpYmxlLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEFuZHJlYSBMaW4oUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBNYXR0aGV3IEJsYWNrbWFuKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IERpbWVuc2lvbjIgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL0RpbWVuc2lvbjIuanMnO1xyXG5pbXBvcnQgUmFuZ2UgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL1JhbmdlLmpzJztcclxuaW1wb3J0IFV0aWxzIGZyb20gJy4uLy4uLy4uLy4uL2RvdC9qcy9VdGlscy5qcyc7XHJcbmltcG9ydCBtZXJnZSBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvbWVyZ2UuanMnO1xyXG5pbXBvcnQgU3RyaW5nVXRpbHMgZnJvbSAnLi4vLi4vLi4vLi4vcGhldGNvbW1vbi9qcy91dGlsL1N0cmluZ1V0aWxzLmpzJztcclxuaW1wb3J0IE1hdGhTeW1ib2xzIGZyb20gJy4uLy4uLy4uLy4uL3NjZW5lcnktcGhldC9qcy9NYXRoU3ltYm9scy5qcyc7XHJcbmltcG9ydCBOdW1iZXJDb250cm9sIGZyb20gJy4uLy4uLy4uLy4uL3NjZW5lcnktcGhldC9qcy9OdW1iZXJDb250cm9sLmpzJztcclxuaW1wb3J0IHsgVGV4dCwgVkJveCwgVlN0cnV0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IENoZWNrYm94IGZyb20gJy4uLy4uLy4uLy4uL3N1bi9qcy9DaGVja2JveC5qcyc7XHJcbmltcG9ydCBQYW5lbCBmcm9tICcuLi8uLi8uLi8uLi9zdW4vanMvUGFuZWwuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uLy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cyBmcm9tICcuLi8uLi9jb21tb24vUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cy5qcyc7XHJcbmltcG9ydCBBcnJvd2xlc3NOdW1iZXJDb250cm9sIGZyb20gJy4uLy4uL2NvbW1vbi92aWV3L0Fycm93bGVzc051bWJlckNvbnRyb2wuanMnO1xyXG5pbXBvcnQgcHJvamVjdGlsZU1vdGlvbiBmcm9tICcuLi8uLi9wcm9qZWN0aWxlTW90aW9uLmpzJztcclxuaW1wb3J0IFByb2plY3RpbGVNb3Rpb25TdHJpbmdzIGZyb20gJy4uLy4uL1Byb2plY3RpbGVNb3Rpb25TdHJpbmdzLmpzJztcclxuXHJcbmNvbnN0IFRFWFRfRk9OVCA9IFByb2plY3RpbGVNb3Rpb25Db25zdGFudHMuUEFORUxfTEFCRUxfT1BUSU9OUy5mb250O1xyXG5jb25zdCBSRUFET1VUX1hfTUFSR0lOID0gUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cy5SSUdIVFNJREVfUEFORUxfT1BUSU9OUy5yZWFkb3V0WE1hcmdpbjtcclxuY29uc3QgZGVncmVlc1N0cmluZyA9IE1hdGhTeW1ib2xzLkRFR1JFRVM7XHJcbmNvbnN0IG1ldGVyc1BlclNlY29uZFN0cmluZyA9IFByb2plY3RpbGVNb3Rpb25TdHJpbmdzLm1ldGVyc1BlclNlY29uZDtcclxuY29uc3QgYW5nbGVTdGFuZGFyZERldmlhdGlvblN0cmluZyA9IFByb2plY3RpbGVNb3Rpb25TdHJpbmdzLmFuZ2xlU3RhbmRhcmREZXZpYXRpb247XHJcbmNvbnN0IHNwZWVkU3RhbmRhcmREZXZpYXRpb25TdHJpbmcgPSBQcm9qZWN0aWxlTW90aW9uU3RyaW5ncy5zcGVlZFN0YW5kYXJkRGV2aWF0aW9uO1xyXG5jb25zdCBwYXR0ZXJuMFZhbHVlMVVuaXRzU3RyaW5nID0gUHJvamVjdGlsZU1vdGlvblN0cmluZ3MucGF0dGVybjBWYWx1ZTFVbml0cztcclxuY29uc3QgcGF0dGVybjBWYWx1ZTFVbml0c1dpdGhTcGFjZVN0cmluZyA9IFByb2plY3RpbGVNb3Rpb25TdHJpbmdzLnBhdHRlcm4wVmFsdWUxVW5pdHNXaXRoU3BhY2U7XHJcblxyXG5jbGFzcyBTdGF0c0NvbnRyb2xQYW5lbCBleHRlbmRzIFBhbmVsIHtcclxuICAvKipcclxuICAgKiBAcGFyYW0ge051bWJlclByb3BlcnR5fSBncm91cFNpemVQcm9wZXJ0eSAtIHRoZSBwcm9wZXJ0eSBmb3IgdGhlIG51bWJlciBvZiBzaW11bHRhbmVvdXNseSBsYXVuY2hlZCBwcm9qZWN0aWxlc1xyXG4gICAqIEBwYXJhbSB7TnVtYmVyUHJvcGVydHl9IGluaXRpYWxTcGVlZFN0YW5kYXJkRGV2aWF0aW9uUHJvcGVydHlcclxuICAgKiBAcGFyYW0ge051bWJlclByb3BlcnR5fSBpbml0aWFsQW5nbGVTdGFuZGFyZERldmlhdGlvblByb3BlcnR5XHJcbiAgICogQHBhcmFtIHtCb29sZWFuUHJvcGVydHl9IHJhcGlkRmlyZU1vZGVQcm9wZXJ0eVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvciggZ3JvdXBTaXplUHJvcGVydHksIGluaXRpYWxTcGVlZFN0YW5kYXJkRGV2aWF0aW9uUHJvcGVydHksIGluaXRpYWxBbmdsZVN0YW5kYXJkRGV2aWF0aW9uUHJvcGVydHksIHJhcGlkRmlyZU1vZGVQcm9wZXJ0eSwgdmlld1Byb3BlcnRpZXMsIG9wdGlvbnMgKSB7XHJcbiAgICAvLyBUaGUgZmlyc3Qgb2JqZWN0IGlzIGEgcGxhY2Vob2xkZXIgc28gbm9uZSBvZiB0aGUgb3RoZXJzIGdldCBtdXRhdGVkXHJcbiAgICAvLyBUaGUgc2Vjb25kIG9iamVjdCBpcyB0aGUgZGVmYXVsdCwgaW4gdGhlIGNvbnN0YW50cyBmaWxlc1xyXG4gICAgLy8gVGhlIHRoaXJkIG9iamVjdCBpcyBvcHRpb25zIHNwZWNpZmljIHRvIHRoaXMgcGFuZWwsIHdoaWNoIG92ZXJyaWRlcyB0aGUgZGVmYXVsdHNcclxuICAgIC8vIFRoZSBmb3VydGggb2JqZWN0IGlzIG9wdGlvbnMgZ2l2ZW4gYXQgdGltZSBvZiBjb25zdHJ1Y3Rpb24sIHdoaWNoIG92ZXJyaWRlcyBhbGwgdGhlIG90aGVyc1xyXG4gICAgb3B0aW9ucyA9IG1lcmdlKFxyXG4gICAgICB7fSxcclxuICAgICAgUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cy5SSUdIVFNJREVfUEFORUxfT1BUSU9OUyxcclxuICAgICAge1xyXG4gICAgICAgIGFsaWduOiAnbGVmdCcsXHJcbiAgICAgICAgdGFuZGVtOiBUYW5kZW0uUkVRVUlSRURcclxuICAgICAgfSxcclxuICAgICAgb3B0aW9uc1xyXG4gICAgKTtcclxuXHJcbiAgICAvLyBjcmVhdGUgZ3JvdXAgc2l6ZSBudW1iZXIgY29udHJvbFxyXG4gICAgY29uc3QgZ3JvdXBTaXplTnVtYmVyQ29udHJvbCA9IG5ldyBBcnJvd2xlc3NOdW1iZXJDb250cm9sKFxyXG4gICAgICBQcm9qZWN0aWxlTW90aW9uU3RyaW5ncy5wcm9qZWN0aWxlR3JvdXBTaXplLCAnJywgZ3JvdXBTaXplUHJvcGVydHksXHJcbiAgICAgIG5ldyBSYW5nZSggUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cy5HUk9VUF9TSVpFX0lOQ1JFTUVOVCwgUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cy5HUk9VUF9TSVpFX01BWCApLFxyXG4gICAgICBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLkdST1VQX1NJWkVfSU5DUkVNRU5ULFxyXG4gICAgICB7XHJcbiAgICAgICAgY29udGFpbmVyV2lkdGg6IG9wdGlvbnMubWluV2lkdGgsXHJcbiAgICAgICAgeE1hcmdpbjogb3B0aW9ucy54TWFyZ2luLFxyXG4gICAgICAgIG51bWJlckRpc3BsYXlNYXhXaWR0aDogb3B0aW9ucy5udW1iZXJEaXNwbGF5TWF4V2lkdGgsXHJcbiAgICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdncm91cFNpemVOdW1iZXJDb250cm9sJyApLFxyXG4gICAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdVSSBjb250cm9sIHRvIGFkanVzdCB0aGUgbnVtYmVyIG9mIHNpbXVsdGFuZW91c2x5IGxhdW5jaGVkIHByb2plY3RpbGVzJ1xyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vc3RhbmRhcmQgZGV2aWF0aW9uIHNsaWRlcnNcclxuICAgIGNvbnN0IGRlZmF1bHROdW1iZXJDb250cm9sT3B0aW9ucyA9IHtcclxuICAgICAgbnVtYmVyRGlzcGxheU9wdGlvbnM6IHtcclxuICAgICAgICBhbGlnbjogJ3JpZ2h0JyxcclxuICAgICAgICBtYXhXaWR0aDogb3B0aW9ucy5udW1iZXJEaXNwbGF5TWF4V2lkdGggKyBvcHRpb25zLnJlYWRvdXRYTWFyZ2luICogMixcclxuICAgICAgICB4TWFyZ2luOiBSRUFET1VUX1hfTUFSR0lOLFxyXG4gICAgICAgIHlNYXJnaW46IDQsXHJcbiAgICAgICAgdGV4dE9wdGlvbnM6IHtcclxuICAgICAgICAgIGZvbnQ6IFRFWFRfRk9OVFxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgdGl0bGVOb2RlT3B0aW9uczoge1xyXG4gICAgICAgIGZvbnQ6IFRFWFRfRk9OVCxcclxuICAgICAgICBtYXhXaWR0aDogb3B0aW9ucy5taW5XaWR0aCAtIG9wdGlvbnMubnVtYmVyRGlzcGxheU1heFdpZHRoIC0gMyAqIG9wdGlvbnMucmVhZG91dFhNYXJnaW4gLSAyICogb3B0aW9ucy54TWFyZ2luXHJcbiAgICAgIH0sXHJcbiAgICAgIHNsaWRlck9wdGlvbnM6IHtcclxuICAgICAgICB0cmFja1NpemU6IG5ldyBEaW1lbnNpb24yKCBvcHRpb25zLm1pbldpZHRoIC0gMiAqIG9wdGlvbnMueE1hcmdpbiAtIDgwLCAwLjUgKSxcclxuICAgICAgICB0aHVtYlNpemU6IG5ldyBEaW1lbnNpb24yKCAxMywgMjIgKSxcclxuICAgICAgICB0aHVtYlRvdWNoQXJlYVhEaWxhdGlvbjogNixcclxuICAgICAgICB0aHVtYlRvdWNoQXJlYVlEaWxhdGlvbjogNFxyXG4gICAgICB9LFxyXG4gICAgICBhcnJvd0J1dHRvbk9wdGlvbnM6IHtcclxuICAgICAgICBzY2FsZTogMC41NixcclxuICAgICAgICB0b3VjaEFyZWFYRGlsYXRpb246IDIwLFxyXG4gICAgICAgIHRvdWNoQXJlYVlEaWxhdGlvbjogMjBcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyByZXN1bHRzIGluICd7e3ZhbHVlfX0gbS9zJ1xyXG4gICAgY29uc3QgdmFsdWVQYXR0ZXJuU3BlZWQgPSBTdHJpbmdVdGlscy5maWxsSW4oXHJcbiAgICAgIHBhdHRlcm4wVmFsdWUxVW5pdHNXaXRoU3BhY2VTdHJpbmcsXHJcbiAgICAgIHtcclxuICAgICAgICB1bml0czogbWV0ZXJzUGVyU2Vjb25kU3RyaW5nXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gcmVzdWx0cyBpbiAne3t2YWx1ZX19IGRlZ3JlZXMnXHJcbiAgICBjb25zdCB2YWx1ZVBhdHRlcm5BbmdsZSA9IFN0cmluZ1V0aWxzLmZpbGxJbihcclxuICAgICAgcGF0dGVybjBWYWx1ZTFVbml0c1N0cmluZyxcclxuICAgICAge1xyXG4gICAgICAgIHVuaXRzOiBkZWdyZWVzU3RyaW5nXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gY3JlYXRlIHNwZWVkIHN0YW5kYXJkIGRldmlhdGlvbiBudW1iZXIgY29udHJvbFxyXG4gICAgY29uc3Qgc3BlZWRTdGFuZGFyZERldmlhdGlvbk51bWJlckNvbnRyb2wgPSBuZXcgTnVtYmVyQ29udHJvbChcclxuICAgICAgc3BlZWRTdGFuZGFyZERldmlhdGlvblN0cmluZywgaW5pdGlhbFNwZWVkU3RhbmRhcmREZXZpYXRpb25Qcm9wZXJ0eSxcclxuICAgICAgUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cy5TUEVFRF9TVEFOREFSRF9ERVZJQVRJT05fUkFOR0UsXHJcbiAgICAgIG1lcmdlKCB7fSwgZGVmYXVsdE51bWJlckNvbnRyb2xPcHRpb25zLCB7XHJcbiAgICAgICAgbnVtYmVyRGlzcGxheU9wdGlvbnM6IHtcclxuICAgICAgICAgIHZhbHVlUGF0dGVybjogdmFsdWVQYXR0ZXJuU3BlZWQsXHJcbiAgICAgICAgICB4TWFyZ2luOiA4LFxyXG4gICAgICAgICAgdGV4dE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgZm9udDogVEVYVF9GT05UXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzbGlkZXJPcHRpb25zOiB7XHJcbiAgICAgICAgICBjb25zdHJhaW5WYWx1ZTogdmFsdWUgPT4gVXRpbHMucm91bmRUb0ludGVydmFsKCB2YWx1ZSwgMSApXHJcbiAgICAgICAgfSxcclxuICAgICAgICBkZWx0YTogMSxcclxuICAgICAgICBsYXlvdXRGdW5jdGlvbjogTnVtYmVyQ29udHJvbC5jcmVhdGVMYXlvdXRGdW5jdGlvbjQoIHtcclxuICAgICAgICAgIGFycm93QnV0dG9uU3BhY2luZzogMTBcclxuICAgICAgICB9ICksXHJcbiAgICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdzcGVlZFN0YW5kYXJkRGV2aWF0aW9uTnVtYmVyQ29udHJvbCcgKSxcclxuICAgICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnVUkgY29udHJvbCB0byBhZGp1c3QgdGhlIHN0YW5kYXJkIGRldmlhdGlvbiBvZiB0aGUgbGF1bmNoIHNwZWVkJ1xyXG4gICAgICB9IClcclxuICAgICk7XHJcblxyXG4gICAgLy8gY3JlYXRlIGFuZ2xlIHN0YW5kYXJkIGRldmlhdGlvbiBudW1iZXIgY29udHJvbFxyXG4gICAgY29uc3QgYW5nbGVTdGFuZGFyZERldmlhdGlvbk51bWJlckNvbnRyb2wgPSBuZXcgTnVtYmVyQ29udHJvbChcclxuICAgICAgYW5nbGVTdGFuZGFyZERldmlhdGlvblN0cmluZywgaW5pdGlhbEFuZ2xlU3RhbmRhcmREZXZpYXRpb25Qcm9wZXJ0eSxcclxuICAgICAgUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cy5BTkdMRV9TVEFOREFSRF9ERVZJQVRJT05fUkFOR0UsXHJcbiAgICAgIG1lcmdlKCB7fSwgZGVmYXVsdE51bWJlckNvbnRyb2xPcHRpb25zLCB7XHJcbiAgICAgICAgbnVtYmVyRGlzcGxheU9wdGlvbnM6IHtcclxuICAgICAgICAgIHZhbHVlUGF0dGVybjogdmFsdWVQYXR0ZXJuQW5nbGUsXHJcbiAgICAgICAgICB4TWFyZ2luOiA4LFxyXG4gICAgICAgICAgdGV4dE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgZm9udDogVEVYVF9GT05UXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzbGlkZXJPcHRpb25zOiB7XHJcbiAgICAgICAgICBjb25zdHJhaW5WYWx1ZTogdmFsdWUgPT4gVXRpbHMucm91bmRUb0ludGVydmFsKCB2YWx1ZSwgMSApXHJcbiAgICAgICAgfSxcclxuICAgICAgICBkZWx0YTogMSxcclxuICAgICAgICBsYXlvdXRGdW5jdGlvbjogTnVtYmVyQ29udHJvbC5jcmVhdGVMYXlvdXRGdW5jdGlvbjQoIHtcclxuICAgICAgICAgIGFycm93QnV0dG9uU3BhY2luZzogMTBcclxuICAgICAgICB9ICksXHJcbiAgICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdhbmdsZVN0YW5kYXJkRGV2aWF0aW9uTnVtYmVyQ29udHJvbCcgKSxcclxuICAgICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnVUkgY29udHJvbCB0byBhZGp1c3QgdGhlIHN0YW5kYXJkIGRldmlhdGlvbiBvZiB0aGUgbGF1bmNoIGFuZ2xlJ1xyXG4gICAgICB9IClcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgY2hlY2tib3hUaXRsZU9wdGlvbnMgPSBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLlBBTkVMX1RJVExFX09QVElPTlM7XHJcbiAgICBjb25zdCBjaGVja2JveE9wdGlvbnMgPSB7IG1heFdpZHRoOiBjaGVja2JveFRpdGxlT3B0aW9ucy5tYXhXaWR0aCwgYm94V2lkdGg6IDE4IH07XHJcbiAgICBjb25zdCByYXBpZEZpcmVNb2RlTGFiZWwgPSBuZXcgVGV4dCggJ1JhcGlkIGZpcmUnLCBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLkxBQkVMX1RFWFRfT1BUSU9OUyApO1xyXG4gICAgY29uc3QgcmFwaWRGaXJlTW9kZUNoZWNrYm94ID0gbmV3IENoZWNrYm94KCByYXBpZEZpcmVNb2RlUHJvcGVydHksIHJhcGlkRmlyZU1vZGVMYWJlbCxcclxuICAgICAgbWVyZ2UoIHsgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdyYXBpZEZpcmVDaGVja2JveCcgKSB9LCBjaGVja2JveE9wdGlvbnMgKVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBUaGUgY29udGVudHMgb2YgdGhlIGNvbnRyb2wgcGFuZWxcclxuICAgIGNvbnN0IGNvbnRlbnQgPSBuZXcgVkJveCgge1xyXG4gICAgICBhbGlnbjogJ2xlZnQnLFxyXG4gICAgICBzcGFjaW5nOiBvcHRpb25zLmNvbnRyb2xzVmVydGljYWxTcGFjZSxcclxuICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICBuZXcgVkJveCgge1xyXG4gICAgICAgICAgYWxpZ246ICdjZW50ZXInLFxyXG4gICAgICAgICAgc3BhY2luZzogb3B0aW9ucy5jb250cm9sc1ZlcnRpY2FsU3BhY2UsXHJcbiAgICAgICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgICAgICBncm91cFNpemVOdW1iZXJDb250cm9sLFxyXG4gICAgICAgICAgICBuZXcgVlN0cnV0KCAxICksXHJcbiAgICAgICAgICAgIHNwZWVkU3RhbmRhcmREZXZpYXRpb25OdW1iZXJDb250cm9sLFxyXG4gICAgICAgICAgICBhbmdsZVN0YW5kYXJkRGV2aWF0aW9uTnVtYmVyQ29udHJvbCxcclxuICAgICAgICAgICAgbmV3IFZTdHJ1dCggNiApXHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfSApLFxyXG4gICAgICAgIG5ldyBWQm94KCB7XHJcbiAgICAgICAgICBhbGlnbjogJ2xlZnQnLFxyXG4gICAgICAgICAgc3BhY2luZzogb3B0aW9ucy5jb250cm9sc1ZlcnRpY2FsU3BhY2UsXHJcbiAgICAgICAgICBjaGlsZHJlbjogWyByYXBpZEZpcmVNb2RlQ2hlY2tib3ggXVxyXG4gICAgICAgIH0gKVxyXG4gICAgICBdXHJcbiAgICB9ICk7XHJcblxyXG4gICAgc3VwZXIoIGNvbnRlbnQsIG9wdGlvbnMgKTtcclxuICB9XHJcbn1cclxuXHJcbnByb2plY3RpbGVNb3Rpb24ucmVnaXN0ZXIoICdTdGF0c0NvbnRyb2xQYW5lbCcsIFN0YXRzQ29udHJvbFBhbmVsICk7XHJcbmV4cG9ydCBkZWZhdWx0IFN0YXRzQ29udHJvbFBhbmVsOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFVBQVUsTUFBTSxrQ0FBa0M7QUFDekQsT0FBT0MsS0FBSyxNQUFNLDZCQUE2QjtBQUMvQyxPQUFPQyxLQUFLLE1BQU0sNkJBQTZCO0FBQy9DLE9BQU9DLEtBQUssTUFBTSxtQ0FBbUM7QUFDckQsT0FBT0MsV0FBVyxNQUFNLCtDQUErQztBQUN2RSxPQUFPQyxXQUFXLE1BQU0sNENBQTRDO0FBQ3BFLE9BQU9DLGFBQWEsTUFBTSw4Q0FBOEM7QUFDeEUsU0FBU0MsSUFBSSxFQUFFQyxJQUFJLEVBQUVDLE1BQU0sUUFBUSxtQ0FBbUM7QUFDdEUsT0FBT0MsUUFBUSxNQUFNLGdDQUFnQztBQUNyRCxPQUFPQyxLQUFLLE1BQU0sNkJBQTZCO0FBQy9DLE9BQU9DLE1BQU0sTUFBTSxpQ0FBaUM7QUFDcEQsT0FBT0MseUJBQXlCLE1BQU0sMkNBQTJDO0FB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