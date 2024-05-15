// Copyright 2016-2024, University of Colorado Boulder

/**
 * Control panel allows the user to change a projectile's parameters
 *
 * @author Andrea Lin (PhET Interactive Simulations)
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import Dimension2 from '../../../../dot/js/Dimension2.js';
import Utils from '../../../../dot/js/Utils.js';
import merge from '../../../../phet-core/js/merge.js';
import StringUtils from '../../../../phetcommon/js/util/StringUtils.js';
import NumberControl from '../../../../scenery-phet/js/NumberControl.js';
import { HBox, HSeparator, HStrut, Node, Text, VBox } from '../../../../scenery/js/imports.js';
import Checkbox from '../../../../sun/js/Checkbox.js';
import ComboBox from '../../../../sun/js/ComboBox.js';
import Panel from '../../../../sun/js/Panel.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import ProjectileMotionConstants from '../../common/ProjectileMotionConstants.js';
import projectileMotion from '../../projectileMotion.js';
import ProjectileMotionStrings from '../../ProjectileMotionStrings.js';
import CustomProjectileObjectTypeControl from './CustomProjectileObjectTypeControl.js';
import ProjectileObjectTypeControl from './ProjectileObjectTypeControl.js';
const airResistanceString = ProjectileMotionStrings.airResistance;
const altitudeString = ProjectileMotionStrings.altitude;
const diameterString = ProjectileMotionStrings.diameter;
const dragCoefficientString = ProjectileMotionStrings.dragCoefficient;
const gravityString = ProjectileMotionStrings.gravity;
const kgString = ProjectileMotionStrings.kg;
const massString = ProjectileMotionStrings.mass;
const metersPerSecondSquaredString = ProjectileMotionStrings.metersPerSecondSquared;
const mString = ProjectileMotionStrings.m;
const pattern0Value1UnitsWithSpaceString = ProjectileMotionStrings.pattern0Value1UnitsWithSpace;

// constants
const LABEL_OPTIONS = ProjectileMotionConstants.PANEL_LABEL_OPTIONS;
const TEXT_FONT = ProjectileMotionConstants.PANEL_LABEL_OPTIONS.font;
const READOUT_X_MARGIN = 4;
const AIR_RESISTANCE_ICON = ProjectileMotionConstants.AIR_RESISTANCE_ICON;
const GRAVITY_READOUT_X_MARGIN = 6;
class LabProjectileControlPanel extends Node {
  /**
   * @param {Node} comboBoxListParent - node for containing the combo box
   * @param {KeypadLayer} keypadLayer - for entering values
   * @param {LabModel} model
   * @param {Object} [options]
   */
  constructor(comboBoxListParent, keypadLayer, model, options) {
    super();

    // convenience variables as much of the logic in this type is in prototype functions only called on construction.
    // @private
    this.objectTypes = model.objectTypes;
    this.objectTypeControls = []; // {Array.<ProjectileObjectTypeControl>} same size as objectTypes, holds a Node that is the controls;
    this.keypadLayer = keypadLayer;
    this.model = model; // @private

    // The first object is a placeholder so none of the others get mutated
    // The second object is the default, in the constants files
    // The third object is options specific to this panel, which overrides the defaults
    // The fourth object is options given at time of construction, which overrides all the others
    options = merge({}, ProjectileMotionConstants.RIGHTSIDE_PANEL_OPTIONS, {
      tandem: Tandem.REQUIRED
    }, options);

    // @private save them for later
    this.options = options;

    // @private - these number controls don't change between all "benchmarked" elements (not custom), so we can reuse them
    this.gravityNumberControl = null;
    this.altitudeNumberControl = null;

    // @private;
    this.textDisplayWidth = options.textDisplayWidth * 1.4;

    // @private - toggle the visibility of all ProjectileObjectType mass NumberControls with a single Property. Created
    // for PhET-iO.
    this.massNumberControlsVisibleProperty = new BooleanProperty(true, {
      tandem: options.tandem.createTandem('massNumberControlsVisibleProperty')
    });

    // @private - toggle the visibility of all ProjectileObjectType diameter NumberControls with a single Property. Created
    // for PhET-iO.
    this.diameterNumberControlsVisibleProperty = new BooleanProperty(true, {
      tandem: options.tandem.createTandem('diameterNumberControlsVisibleProperty')
    });

    // maxWidth empirically determined for labels in the dropdown
    const itemNodeOptions = merge({}, LABEL_OPTIONS, {
      maxWidth: 170
    });
    const firstItemNode = new VBox({
      align: 'left',
      children: [new Text(this.objectTypes[0].name, itemNodeOptions)]
    });
    const comboBoxWidth = options.minWidth - 2 * options.xMargin;
    const itemXMargin = 6;
    const buttonXMargin = 10;
    const comboBoxLineWidth = 1;

    // first item contains horizontal strut that sets width of combo box
    const firstItemNodeWidth = comboBoxWidth - itemXMargin - 0.5 * firstItemNode.height - 4 * buttonXMargin - 2 * itemXMargin - 2 * comboBoxLineWidth;
    firstItemNode.addChild(new HStrut(firstItemNodeWidth));
    const comboBoxItems = [];
    for (let i = 0; i < this.objectTypes.length; i++) {
      const projectileType = this.objectTypes[i];
      comboBoxItems[i] = {
        value: projectileType,
        createNode: () => i === 0 ? firstItemNode : new Text(projectileType.name, itemNodeOptions),
        tandemName: `${projectileType.benchmark}Item`
      };

      // Create the controls for the projectileType too.
      this.objectTypeControls.push(this.createControlsForObjectType(projectileType, options.tandem, options.tandem.createTandem(`${projectileType.benchmark}Control`)));
    }

    // creating the controls for each object type changes these values because of enabledRangeProperty listeners in the
    // NumberControls. Here reset back to the selectedProjectileObjectType to fix things. See
    // https://github.com/phetsims/projectile-motion/issues/213
    model.resetModelValuesToInitial();

    // create view for the dropdown
    const projectileChoiceComboBox = new ComboBox(model.selectedProjectileObjectTypeProperty, comboBoxItems, comboBoxListParent, {
      xMargin: 12,
      yMargin: 8,
      cornerRadius: 4,
      buttonLineWidth: comboBoxLineWidth,
      listLineWidth: comboBoxLineWidth,
      tandem: options.tandem.createTandem('projectileChoiceComboBox'),
      phetioDocumentation: 'Combo box that selects what projectile type to launch from the cannon'
    });

    // @private make visible to methods
    this.projectileChoiceComboBox = projectileChoiceComboBox;

    // readout, slider, and tweakers

    // These containers are added into the Panel as desired, and their children are changed as the object type does.
    const massBox = new Node({
      excludeInvisibleChildrenFromBounds: true
    });
    const diameterBox = new Node({
      excludeInvisibleChildrenFromBounds: true
    });
    const dragCoefficientBox = new Node({
      excludeInvisibleChildrenFromBounds: true
    });
    const altitudeBox = new Node({
      excludeInvisibleChildrenFromBounds: true
    });
    const gravityBox = new Node({
      excludeInvisibleChildrenFromBounds: true
    });

    // update the type of control based on the objectType
    model.selectedProjectileObjectTypeProperty.link(objectType => {
      const objectTypeControls = this.objectTypeControls[this.objectTypes.indexOf(objectType)];
      massBox.children = [objectTypeControls.massControl];
      diameterBox.children = [objectTypeControls.diameterControl];
      dragCoefficientBox.children = [objectTypeControls.dragCoefficientControl];
      altitudeBox.children = [objectTypeControls.altitudeControl];
      gravityBox.children = [objectTypeControls.gravityControl];
    });

    // disabling and enabling drag and altitude controls depending on whether air resistance is on
    model.airResistanceOnProperty.link(airResistanceOn => {
      const opacity = airResistanceOn ? 1 : 0.5;
      altitudeBox.opacity = opacity;
      dragCoefficientBox.opacity = opacity;
      altitudeBox.setPickable(airResistanceOn);
      dragCoefficientBox.setPickable(airResistanceOn);
    });

    // air resistance
    const airResistanceLabel = new Text(airResistanceString, LABEL_OPTIONS);
    const airResistanceLabelAndIcon = new HBox({
      spacing: options.xMargin,
      children: [airResistanceLabel, new Node({
        children: [AIR_RESISTANCE_ICON]
      })]
    });
    const airResistanceCheckbox = new Checkbox(model.airResistanceOnProperty, airResistanceLabelAndIcon, {
      maxWidth: options.minWidth - AIR_RESISTANCE_ICON.width - 3 * options.xMargin,
      boxWidth: 18,
      tandem: options.tandem.createTandem('airResistanceCheckbox')
    });

    // The contents of the control panel
    const content = new VBox({
      align: 'left',
      spacing: options.controlsVerticalSpace,
      children: [projectileChoiceComboBox, massBox, diameterBox, new HSeparator({
        stroke: ProjectileMotionConstants.SEPARATOR_COLOR
      }), gravityBox, new HSeparator({
        stroke: ProjectileMotionConstants.SEPARATOR_COLOR
      }), airResistanceCheckbox, altitudeBox, dragCoefficientBox]
    });
    this.addChild(new Panel(content, options));
  }

  /**
   * for use by screen view
   * @public
   */
  hideComboBoxList() {
    this.projectileChoiceComboBox.hideListBox();
  }

  /**
   * Given an objectType, create the controls needed for that type.
   * @param {ProjectileObjectType} objectType
   * @param {Tandem} generalComponentTandem - used for the elements that can be reused between all elements
   * @param {Tandem} objectSpecificTandem - used for the elements that change for each object type
   * @returns {ProjectileObjectTypeControl}
   * @private
   */
  createControlsForObjectType(objectType, generalComponentTandem, objectSpecificTandem) {
    if (objectType.benchmark === 'custom') {
      return new CustomProjectileObjectTypeControl(this.model, this.keypadLayer, objectType, objectSpecificTandem, {
        xMargin: this.options.xMargin,
        minWidth: this.options.minWidth,
        readoutXMargin: this.options.readoutXMargin,
        textDisplayWidth: this.textDisplayWidth
      });
    } else {
      const defaultNumberControlOptions = {
        titleNodeOptions: {
          font: TEXT_FONT,
          // panel width - margins - numberDisplay margins and maxWidth
          maxWidth: this.options.minWidth - 3 * this.options.xMargin - 2 * READOUT_X_MARGIN - this.textDisplayWidth
        },
        numberDisplayOptions: {
          maxWidth: this.textDisplayWidth,
          align: 'right',
          xMargin: READOUT_X_MARGIN,
          yMargin: 4,
          textOptions: {
            font: TEXT_FONT
          }
        },
        sliderOptions: {
          majorTickLength: 5,
          trackSize: new Dimension2(this.options.minWidth - 2 * this.options.xMargin - 80, 0.5),
          thumbSize: new Dimension2(13, 22),
          thumbTouchAreaXDilation: 6,
          thumbTouchAreaYDilation: 4
        },
        arrowButtonOptions: {
          scale: 0.56,
          touchAreaXDilation: 20,
          touchAreaYDilation: 20
        },
        layoutFunction: NumberControl.createLayoutFunction4({
          arrowButtonSpacing: 10
        })
      };
      const massNumberControl = new NumberControl(massString, this.model.projectileMassProperty, objectType.massRange, merge({
        delta: objectType.massRound,
        numberDisplayOptions: {
          // '{{value}} kg'
          valuePattern: StringUtils.fillIn(pattern0Value1UnitsWithSpaceString, {
            units: kgString
          }),
          decimalPlaces: Math.ceil(-Utils.log10(objectType.massRound))
        },
        sliderOptions: {
          constrainValue: value => Utils.roundSymmetric(value / objectType.massRound) * objectType.massRound,
          majorTicks: [{
            value: objectType.massRange.min,
            label: new Text(objectType.massRange.min, LABEL_OPTIONS)
          }, {
            value: objectType.massRange.max,
            label: new Text(objectType.massRange.max, LABEL_OPTIONS)
          }]
        },
        tandem: objectSpecificTandem.createTandem('massNumberControl'),
        phetioDocumentation: 'UI control to adjust the mass of the projectile'
      }, defaultNumberControlOptions));
      const diameterNumberControl = new NumberControl(diameterString, this.model.projectileDiameterProperty, objectType.diameterRange, merge({
        delta: objectType.diameterRound,
        numberDisplayOptions: {
          // '{{value}} m'
          valuePattern: StringUtils.fillIn(pattern0Value1UnitsWithSpaceString, {
            units: mString
          }),
          decimalPlaces: Math.ceil(-Utils.log10(objectType.diameterRound))
        },
        sliderOptions: {
          constrainValue: value => Utils.roundSymmetric(value / objectType.diameterRound) * objectType.diameterRound,
          majorTicks: [{
            value: objectType.diameterRange.min,
            label: new Text(objectType.diameterRange.min, LABEL_OPTIONS)
          }, {
            value: objectType.diameterRange.max,
            label: new Text(objectType.diameterRange.max, LABEL_OPTIONS)
          }]
        },
        tandem: objectSpecificTandem.createTandem('diameterNumberControl'),
        phetioDocumentation: 'UI control to adjust the diameter of the projectile'
      }, defaultNumberControlOptions));
      const gravityNumberControl = this.gravityNumberControl || new NumberControl(gravityString, this.model.gravityProperty, ProjectileMotionConstants.GRAVITY_RANGE, merge({
        delta: 0.01,
        numberDisplayOptions: {
          // '{{value}} m/s^2
          valuePattern: StringUtils.fillIn(pattern0Value1UnitsWithSpaceString, {
            units: metersPerSecondSquaredString
          }),
          decimalPlaces: 2,
          xMargin: GRAVITY_READOUT_X_MARGIN,
          maxWidth: this.textDisplayWidth + GRAVITY_READOUT_X_MARGIN
        },
        sliderOptions: {
          constrainValue: value => Utils.roundSymmetric(value * 100) / 100
        },
        tandem: generalComponentTandem.createTandem('gravityNumberControl'),
        phetioDocumentation: 'UI control to adjust the force of gravity on the projectile'
      }, defaultNumberControlOptions));
      this.gravityNumberControl = gravityNumberControl;
      const altitudeNumberControl = this.altitudeNumberControl || new NumberControl(altitudeString, this.model.altitudeProperty, ProjectileMotionConstants.ALTITUDE_RANGE, merge({
        delta: 100,
        numberDisplayOptions: {
          // '{{value}} m'
          valuePattern: StringUtils.fillIn(pattern0Value1UnitsWithSpaceString, {
            units: mString
          }),
          decimalPlaces: 0
        },
        sliderOptions: {
          constrainValue: value => Utils.roundSymmetric(value / 100) * 100
        },
        tandem: generalComponentTandem.createTandem('altitudeNumberControl'),
        phetioDocumentation: 'UI control to adjust the altitude of position where the projectile is being launched'
      }, defaultNumberControlOptions));
      this.altitudeNumberControl = altitudeNumberControl;
      const dragCoefficientText = new Text('', merge({}, LABEL_OPTIONS, {
        maxWidth: this.options.minWidth - 2 * this.options.xMargin
      }));

      // exists for the lifetime of the simulation
      this.model.projectileDragCoefficientProperty.link(dragCoefficient => {
        dragCoefficientText.string = `${dragCoefficientString}: ${Utils.toFixed(dragCoefficient, 2)}`;
      });

      // One direction of control. Instead of linking both to each other. This allows a single, global control to switch
      // all types' visibility at once, while also allowing a single numberControl the flexibility to hide itself.
      this.massNumberControlsVisibleProperty.link(visible => {
        massNumberControl.visibleProperty.value = visible;
      });
      this.diameterNumberControlsVisibleProperty.link(visible => {
        diameterNumberControl.visibleProperty.value = visible;
      });
      return new ProjectileObjectTypeControl(massNumberControl, diameterNumberControl, gravityNumberControl, altitudeNumberControl, dragCoefficientText);
    }
  }
}
projectileMotion.register('LabProjectileControlPanel', LabProjectileControlPanel);
export default LabProjectileControlPanel;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJEaW1lbnNpb24yIiwiVXRpbHMiLCJtZXJnZSIsIlN0cmluZ1V0aWxzIiwiTnVtYmVyQ29udHJvbCIsIkhCb3giLCJIU2VwYXJhdG9yIiwiSFN0cnV0IiwiTm9kZSIsIlRleHQiLCJWQm94IiwiQ2hlY2tib3giLCJDb21ib0JveCIsIlBhbmVsIiwiVGFuZGVtIiwiUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cyIsInByb2plY3RpbGVNb3Rpb24iLCJQcm9qZWN0aWxlTW90aW9uU3RyaW5ncyIsIkN1c3RvbVByb2plY3RpbGVPYmplY3RUeXBlQ29udHJvbCIsIlByb2plY3RpbGVPYmplY3RUeXBlQ29udHJvbCIsImFpclJlc2lzdGFuY2VTdHJpbmciLCJhaXJSZXNpc3RhbmNlIiwiYWx0aXR1ZGVTdHJpbmciLCJhbHRpdHVkZSIsImRpYW1ldGVyU3RyaW5nIiwiZGlhbWV0ZXIiLCJkcmFnQ29lZmZpY2llbnRTdHJpbmciLCJkcmFnQ29lZmZpY2llbnQiLCJncmF2aXR5U3RyaW5nIiwiZ3Jhdml0eSIsImtnU3RyaW5nIiwia2ciLCJtYXNzU3RyaW5nIiwibWFzcyIsIm1ldGVyc1BlclNlY29uZFNxdWFyZWRTdHJpbmciLCJtZXRlcnNQZXJTZWNvbmRTcXVhcmVkIiwibVN0cmluZyIsIm0iLCJwYXR0ZXJuMFZhbHVlMVVuaXRzV2l0aFNwYWNlU3RyaW5nIiwicGF0dGVybjBWYWx1ZTFVbml0c1dpdGhTcGFjZSIsIkxBQkVMX09QVElPTlMiLCJQQU5FTF9MQUJFTF9PUFRJT05TIiwiVEVYVF9GT05UIiwiZm9udCIsIlJFQURPVVRfWF9NQVJHSU4iLCJBSVJfUkVTSVNUQU5DRV9JQ09OIiwiR1JBVklUWV9SRUFET1VUX1hfTUFSR0lOIiwiTGFiUHJvamVjdGlsZUNvbnRyb2xQYW5lbCIsImNvbnN0cnVjdG9yIiwiY29tYm9Cb3hMaXN0UGFyZW50Iiwia2V5cGFkTGF5ZXIiLCJtb2RlbCIsIm9wdGlvbnMiLCJvYmplY3RUeXBlcyIsIm9iamVjdFR5cGVDb250cm9scyIsIlJJR0hUU0lERV9QQU5FTF9PUFRJT05TIiwidGFuZGVtIiwiUkVRVUlSRUQiLCJncmF2aXR5TnVtYmVyQ29udHJvbCIsImFsdGl0dWRlTnVtYmVyQ29udHJvbCIsInRleHREaXNwbGF5V2lkdGgiLCJtYXNzTnVtYmVyQ29udHJvbHNWaXNpYmxlUHJvcGVydHkiLCJjcmVhdGVUYW5kZW0iLCJkaWFtZXRlck51bWJlckNvbnRyb2xzVmlzaWJsZVByb3BlcnR5IiwiaXRlbU5vZGVPcHRpb25zIiwibWF4V2lkdGgiLCJmaXJzdEl0ZW1Ob2RlIiwiYWxpZ24iLCJjaGlsZHJlbiIsIm5hbWUiLCJjb21ib0JveFdpZHRoIiwibWluV2lkdGgiLCJ4TWFyZ2luIiwiaXRlbVhNYXJnaW4iLCJidXR0b25YTWFyZ2luIiwiY29tYm9Cb3hMaW5lV2lkdGgiLCJmaXJzdEl0ZW1Ob2RlV2lkdGgiLCJoZWlnaHQiLCJhZGRDaGlsZCIsImNvbWJvQm94SXRlbXMiLCJpIiwibGVuZ3RoIiwicHJvamVjdGlsZVR5cGUiLCJ2YWx1ZSIsImNyZWF0ZU5vZGUiLCJ0YW5kZW1OYW1lIiwiYmVuY2htYXJrIiwicHVzaCIsImNyZWF0ZUNvbnRyb2xzRm9yT2JqZWN0VHlwZSIsInJlc2V0TW9kZWxWYWx1ZXNUb0luaXRpYWwiLCJwcm9qZWN0aWxlQ2hvaWNlQ29tYm9Cb3giLCJzZWxlY3RlZFByb2plY3RpbGVPYmplY3RUeXBlUHJvcGVydHkiLCJ5TWFyZ2luIiwiY29ybmVyUmFkaXVzIiwiYnV0dG9uTGluZVdpZHRoIiwibGlzdExpbmVXaWR0aCIsInBoZXRpb0RvY3VtZW50YXRpb24iLCJtYXNzQm94IiwiZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcyIsImRpYW1ldGVyQm94IiwiZHJhZ0NvZWZmaWNpZW50Qm94IiwiYWx0aXR1ZGVCb3giLCJncmF2aXR5Qm94IiwibGluayIsIm9iamVjdFR5cGUiLCJpbmRleE9mIiwibWFzc0NvbnRyb2wiLCJkaWFtZXRlckNvbnRyb2wiLCJkcmFnQ29lZmZpY2llbnRDb250cm9sIiwiYWx0aXR1ZGVDb250cm9sIiwiZ3Jhdml0eUNvbnRyb2wiLCJhaXJSZXNpc3RhbmNlT25Qcm9wZXJ0eSIsImFpclJlc2lzdGFuY2VPbiIsIm9wYWNpdHkiLCJzZXRQaWNrYWJsZSIsImFpclJlc2lzdGFuY2VMYWJlbCIsImFpclJlc2lzdGFuY2VMYWJlbEFuZEljb24iLCJzcGFjaW5nIiwiYWlyUmVzaXN0YW5jZUNoZWNrYm94Iiwid2lkdGgiLCJib3hXaWR0aCIsImNvbnRlbnQiLCJjb250cm9sc1ZlcnRpY2FsU3BhY2UiLCJzdHJva2UiLCJTRVBBUkFUT1JfQ09MT1IiLCJoaWRlQ29tYm9Cb3hMaXN0IiwiaGlkZUxpc3RCb3giLCJnZW5lcmFsQ29tcG9uZW50VGFuZGVtIiwib2JqZWN0U3BlY2lmaWNUYW5kZW0iLCJyZWFkb3V0WE1hcmdpbiIsImRlZmF1bHROdW1iZXJDb250cm9sT3B0aW9ucyIsInRpdGxlTm9kZU9wdGlvbnMiLCJudW1iZXJEaXNwbGF5T3B0aW9ucyIsInRleHRPcHRpb25zIiwic2xpZGVyT3B0aW9ucyIsIm1ham9yVGlja0xlbmd0aCIsInRyYWNrU2l6ZSIsInRodW1iU2l6ZSIsInRodW1iVG91Y2hBcmVhWERpbGF0aW9uIiwidGh1bWJUb3VjaEFyZWFZRGlsYXRpb24iLCJhcnJvd0J1dHRvbk9wdGlvbnMiLCJzY2FsZSIsInRvdWNoQXJlYVhEaWxhdGlvbiIsInRvdWNoQXJlYVlEaWxhdGlvbiIsImxheW91dEZ1bmN0aW9uIiwiY3JlYXRlTGF5b3V0RnVuY3Rpb240IiwiYXJyb3dCdXR0b25TcGFjaW5nIiwibWFzc051bWJlckNvbnRyb2wiLCJwcm9qZWN0aWxlTWFzc1Byb3BlcnR5IiwibWFzc1JhbmdlIiwiZGVsdGEiLCJtYXNzUm91bmQiLCJ2YWx1ZVBhdHRlcm4iLCJmaWxsSW4iLCJ1bml0cyIsImRlY2ltYWxQbGFjZXMiLCJNYXRoIiwiY2VpbCIsImxvZzEwIiwiY29uc3RyYWluVmFsdWUiLCJyb3VuZFN5bW1ldHJpYyIsIm1ham9yVGlja3MiLCJtaW4iLCJsYWJlbCIsIm1heCIsImRpYW1ldGVyTnVtYmVyQ29udHJvbCIsInByb2plY3RpbGVEaWFtZXRlclByb3BlcnR5IiwiZGlhbWV0ZXJSYW5nZSIsImRpYW1ldGVyUm91bmQiLCJncmF2aXR5UHJvcGVydHkiLCJHUkFWSVRZX1JBTkdFIiwiYWx0aXR1ZGVQcm9wZXJ0eSIsIkFMVElUVURFX1JBTkdFIiwiZHJhZ0NvZWZmaWNpZW50VGV4dCIsInByb2plY3RpbGVEcmFnQ29lZmZpY2llbnRQcm9wZXJ0eSIsInN0cmluZyIsInRvRml4ZWQiLCJ2aXNpYmxlIiwidmlzaWJsZVByb3BlcnR5IiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJMYWJQcm9qZWN0aWxlQ29udHJvbFBhbmVsLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE2LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIENvbnRyb2wgcGFuZWwgYWxsb3dzIHRoZSB1c2VyIHRvIGNoYW5nZSBhIHByb2plY3RpbGUncyBwYXJhbWV0ZXJzXHJcbiAqXHJcbiAqIEBhdXRob3IgQW5kcmVhIExpbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgQm9vbGVhblByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvQm9vbGVhblByb3BlcnR5LmpzJztcclxuaW1wb3J0IERpbWVuc2lvbjIgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL0RpbWVuc2lvbjIuanMnO1xyXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL1V0aWxzLmpzJztcclxuaW1wb3J0IG1lcmdlIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9tZXJnZS5qcyc7XHJcbmltcG9ydCBTdHJpbmdVdGlscyBmcm9tICcuLi8uLi8uLi8uLi9waGV0Y29tbW9uL2pzL3V0aWwvU3RyaW5nVXRpbHMuanMnO1xyXG5pbXBvcnQgTnVtYmVyQ29udHJvbCBmcm9tICcuLi8uLi8uLi8uLi9zY2VuZXJ5LXBoZXQvanMvTnVtYmVyQ29udHJvbC5qcyc7XHJcbmltcG9ydCB7IEhCb3gsIEhTZXBhcmF0b3IsIEhTdHJ1dCwgTm9kZSwgVGV4dCwgVkJveCB9IGZyb20gJy4uLy4uLy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBDaGVja2JveCBmcm9tICcuLi8uLi8uLi8uLi9zdW4vanMvQ2hlY2tib3guanMnO1xyXG5pbXBvcnQgQ29tYm9Cb3ggZnJvbSAnLi4vLi4vLi4vLi4vc3VuL2pzL0NvbWJvQm94LmpzJztcclxuaW1wb3J0IFBhbmVsIGZyb20gJy4uLy4uLy4uLy4uL3N1bi9qcy9QYW5lbC5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcbmltcG9ydCBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzIGZyb20gJy4uLy4uL2NvbW1vbi9Qcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLmpzJztcclxuaW1wb3J0IHByb2plY3RpbGVNb3Rpb24gZnJvbSAnLi4vLi4vcHJvamVjdGlsZU1vdGlvbi5qcyc7XHJcbmltcG9ydCBQcm9qZWN0aWxlTW90aW9uU3RyaW5ncyBmcm9tICcuLi8uLi9Qcm9qZWN0aWxlTW90aW9uU3RyaW5ncy5qcyc7XHJcbmltcG9ydCBDdXN0b21Qcm9qZWN0aWxlT2JqZWN0VHlwZUNvbnRyb2wgZnJvbSAnLi9DdXN0b21Qcm9qZWN0aWxlT2JqZWN0VHlwZUNvbnRyb2wuanMnO1xyXG5pbXBvcnQgUHJvamVjdGlsZU9iamVjdFR5cGVDb250cm9sIGZyb20gJy4vUHJvamVjdGlsZU9iamVjdFR5cGVDb250cm9sLmpzJztcclxuXHJcbmNvbnN0IGFpclJlc2lzdGFuY2VTdHJpbmcgPSBQcm9qZWN0aWxlTW90aW9uU3RyaW5ncy5haXJSZXNpc3RhbmNlO1xyXG5jb25zdCBhbHRpdHVkZVN0cmluZyA9IFByb2plY3RpbGVNb3Rpb25TdHJpbmdzLmFsdGl0dWRlO1xyXG5jb25zdCBkaWFtZXRlclN0cmluZyA9IFByb2plY3RpbGVNb3Rpb25TdHJpbmdzLmRpYW1ldGVyO1xyXG5jb25zdCBkcmFnQ29lZmZpY2llbnRTdHJpbmcgPSBQcm9qZWN0aWxlTW90aW9uU3RyaW5ncy5kcmFnQ29lZmZpY2llbnQ7XHJcbmNvbnN0IGdyYXZpdHlTdHJpbmcgPSBQcm9qZWN0aWxlTW90aW9uU3RyaW5ncy5ncmF2aXR5O1xyXG5jb25zdCBrZ1N0cmluZyA9IFByb2plY3RpbGVNb3Rpb25TdHJpbmdzLmtnO1xyXG5jb25zdCBtYXNzU3RyaW5nID0gUHJvamVjdGlsZU1vdGlvblN0cmluZ3MubWFzcztcclxuY29uc3QgbWV0ZXJzUGVyU2Vjb25kU3F1YXJlZFN0cmluZyA9IFByb2plY3RpbGVNb3Rpb25TdHJpbmdzLm1ldGVyc1BlclNlY29uZFNxdWFyZWQ7XHJcbmNvbnN0IG1TdHJpbmcgPSBQcm9qZWN0aWxlTW90aW9uU3RyaW5ncy5tO1xyXG5jb25zdCBwYXR0ZXJuMFZhbHVlMVVuaXRzV2l0aFNwYWNlU3RyaW5nID0gUHJvamVjdGlsZU1vdGlvblN0cmluZ3MucGF0dGVybjBWYWx1ZTFVbml0c1dpdGhTcGFjZTtcclxuXHJcbi8vIGNvbnN0YW50c1xyXG5jb25zdCBMQUJFTF9PUFRJT05TID0gUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cy5QQU5FTF9MQUJFTF9PUFRJT05TO1xyXG5jb25zdCBURVhUX0ZPTlQgPSBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLlBBTkVMX0xBQkVMX09QVElPTlMuZm9udDtcclxuY29uc3QgUkVBRE9VVF9YX01BUkdJTiA9IDQ7XHJcbmNvbnN0IEFJUl9SRVNJU1RBTkNFX0lDT04gPSBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLkFJUl9SRVNJU1RBTkNFX0lDT047XHJcbmNvbnN0IEdSQVZJVFlfUkVBRE9VVF9YX01BUkdJTiA9IDY7XHJcblxyXG5jbGFzcyBMYWJQcm9qZWN0aWxlQ29udHJvbFBhbmVsIGV4dGVuZHMgTm9kZSB7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSB7Tm9kZX0gY29tYm9Cb3hMaXN0UGFyZW50IC0gbm9kZSBmb3IgY29udGFpbmluZyB0aGUgY29tYm8gYm94XHJcbiAgICogQHBhcmFtIHtLZXlwYWRMYXllcn0ga2V5cGFkTGF5ZXIgLSBmb3IgZW50ZXJpbmcgdmFsdWVzXHJcbiAgICogQHBhcmFtIHtMYWJNb2RlbH0gbW9kZWxcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoIGNvbWJvQm94TGlzdFBhcmVudCwga2V5cGFkTGF5ZXIsIG1vZGVsLCBvcHRpb25zICkge1xyXG5cclxuICAgIHN1cGVyKCk7XHJcblxyXG4gICAgLy8gY29udmVuaWVuY2UgdmFyaWFibGVzIGFzIG11Y2ggb2YgdGhlIGxvZ2ljIGluIHRoaXMgdHlwZSBpcyBpbiBwcm90b3R5cGUgZnVuY3Rpb25zIG9ubHkgY2FsbGVkIG9uIGNvbnN0cnVjdGlvbi5cclxuICAgIC8vIEBwcml2YXRlXHJcbiAgICB0aGlzLm9iamVjdFR5cGVzID0gbW9kZWwub2JqZWN0VHlwZXM7XHJcbiAgICB0aGlzLm9iamVjdFR5cGVDb250cm9scyA9IFtdOyAvLyB7QXJyYXkuPFByb2plY3RpbGVPYmplY3RUeXBlQ29udHJvbD59IHNhbWUgc2l6ZSBhcyBvYmplY3RUeXBlcywgaG9sZHMgYSBOb2RlIHRoYXQgaXMgdGhlIGNvbnRyb2xzO1xyXG4gICAgdGhpcy5rZXlwYWRMYXllciA9IGtleXBhZExheWVyO1xyXG4gICAgdGhpcy5tb2RlbCA9IG1vZGVsOyAvLyBAcHJpdmF0ZVxyXG5cclxuICAgIC8vIFRoZSBmaXJzdCBvYmplY3QgaXMgYSBwbGFjZWhvbGRlciBzbyBub25lIG9mIHRoZSBvdGhlcnMgZ2V0IG11dGF0ZWRcclxuICAgIC8vIFRoZSBzZWNvbmQgb2JqZWN0IGlzIHRoZSBkZWZhdWx0LCBpbiB0aGUgY29uc3RhbnRzIGZpbGVzXHJcbiAgICAvLyBUaGUgdGhpcmQgb2JqZWN0IGlzIG9wdGlvbnMgc3BlY2lmaWMgdG8gdGhpcyBwYW5lbCwgd2hpY2ggb3ZlcnJpZGVzIHRoZSBkZWZhdWx0c1xyXG4gICAgLy8gVGhlIGZvdXJ0aCBvYmplY3QgaXMgb3B0aW9ucyBnaXZlbiBhdCB0aW1lIG9mIGNvbnN0cnVjdGlvbiwgd2hpY2ggb3ZlcnJpZGVzIGFsbCB0aGUgb3RoZXJzXHJcbiAgICBvcHRpb25zID0gbWVyZ2UoIHt9LCBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLlJJR0hUU0lERV9QQU5FTF9PUFRJT05TLCB7XHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLlJFUVVJUkVEXHJcbiAgICB9LCBvcHRpb25zICk7XHJcblxyXG4gICAgLy8gQHByaXZhdGUgc2F2ZSB0aGVtIGZvciBsYXRlclxyXG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcclxuXHJcbiAgICAvLyBAcHJpdmF0ZSAtIHRoZXNlIG51bWJlciBjb250cm9scyBkb24ndCBjaGFuZ2UgYmV0d2VlbiBhbGwgXCJiZW5jaG1hcmtlZFwiIGVsZW1lbnRzIChub3QgY3VzdG9tKSwgc28gd2UgY2FuIHJldXNlIHRoZW1cclxuICAgIHRoaXMuZ3Jhdml0eU51bWJlckNvbnRyb2wgPSBudWxsO1xyXG4gICAgdGhpcy5hbHRpdHVkZU51bWJlckNvbnRyb2wgPSBudWxsO1xyXG5cclxuICAgIC8vIEBwcml2YXRlO1xyXG4gICAgdGhpcy50ZXh0RGlzcGxheVdpZHRoID0gb3B0aW9ucy50ZXh0RGlzcGxheVdpZHRoICogMS40O1xyXG5cclxuICAgIC8vIEBwcml2YXRlIC0gdG9nZ2xlIHRoZSB2aXNpYmlsaXR5IG9mIGFsbCBQcm9qZWN0aWxlT2JqZWN0VHlwZSBtYXNzIE51bWJlckNvbnRyb2xzIHdpdGggYSBzaW5nbGUgUHJvcGVydHkuIENyZWF0ZWRcclxuICAgIC8vIGZvciBQaEVULWlPLlxyXG4gICAgdGhpcy5tYXNzTnVtYmVyQ29udHJvbHNWaXNpYmxlUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCB0cnVlLCB7XHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAnbWFzc051bWJlckNvbnRyb2xzVmlzaWJsZVByb3BlcnR5JyApXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gQHByaXZhdGUgLSB0b2dnbGUgdGhlIHZpc2liaWxpdHkgb2YgYWxsIFByb2plY3RpbGVPYmplY3RUeXBlIGRpYW1ldGVyIE51bWJlckNvbnRyb2xzIHdpdGggYSBzaW5nbGUgUHJvcGVydHkuIENyZWF0ZWRcclxuICAgIC8vIGZvciBQaEVULWlPLlxyXG4gICAgdGhpcy5kaWFtZXRlck51bWJlckNvbnRyb2xzVmlzaWJsZVByb3BlcnR5ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggdHJ1ZSwge1xyXG4gICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ2RpYW1ldGVyTnVtYmVyQ29udHJvbHNWaXNpYmxlUHJvcGVydHknIClcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBtYXhXaWR0aCBlbXBpcmljYWxseSBkZXRlcm1pbmVkIGZvciBsYWJlbHMgaW4gdGhlIGRyb3Bkb3duXHJcbiAgICBjb25zdCBpdGVtTm9kZU9wdGlvbnMgPSBtZXJnZSgge30sIExBQkVMX09QVElPTlMsIHsgbWF4V2lkdGg6IDE3MCB9ICk7XHJcblxyXG4gICAgY29uc3QgZmlyc3RJdGVtTm9kZSA9IG5ldyBWQm94KCB7XHJcbiAgICAgIGFsaWduOiAnbGVmdCcsXHJcbiAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgbmV3IFRleHQoIHRoaXMub2JqZWN0VHlwZXNbIDAgXS5uYW1lLCBpdGVtTm9kZU9wdGlvbnMgKVxyXG4gICAgICBdXHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3QgY29tYm9Cb3hXaWR0aCA9IG9wdGlvbnMubWluV2lkdGggLSAyICogb3B0aW9ucy54TWFyZ2luO1xyXG4gICAgY29uc3QgaXRlbVhNYXJnaW4gPSA2O1xyXG4gICAgY29uc3QgYnV0dG9uWE1hcmdpbiA9IDEwO1xyXG4gICAgY29uc3QgY29tYm9Cb3hMaW5lV2lkdGggPSAxO1xyXG5cclxuICAgIC8vIGZpcnN0IGl0ZW0gY29udGFpbnMgaG9yaXpvbnRhbCBzdHJ1dCB0aGF0IHNldHMgd2lkdGggb2YgY29tYm8gYm94XHJcbiAgICBjb25zdCBmaXJzdEl0ZW1Ob2RlV2lkdGggPSBjb21ib0JveFdpZHRoIC0gaXRlbVhNYXJnaW4gLVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMC41ICogZmlyc3RJdGVtTm9kZS5oZWlnaHQgLVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgNCAqIGJ1dHRvblhNYXJnaW4gLVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMiAqIGl0ZW1YTWFyZ2luIC1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDIgKiBjb21ib0JveExpbmVXaWR0aDtcclxuICAgIGZpcnN0SXRlbU5vZGUuYWRkQ2hpbGQoIG5ldyBIU3RydXQoIGZpcnN0SXRlbU5vZGVXaWR0aCApICk7XHJcblxyXG4gICAgY29uc3QgY29tYm9Cb3hJdGVtcyA9IFtdO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5vYmplY3RUeXBlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgcHJvamVjdGlsZVR5cGUgPSB0aGlzLm9iamVjdFR5cGVzWyBpIF07XHJcblxyXG4gICAgICBjb21ib0JveEl0ZW1zWyBpIF0gPSB7XHJcbiAgICAgICAgdmFsdWU6IHByb2plY3RpbGVUeXBlLFxyXG4gICAgICAgIGNyZWF0ZU5vZGU6ICgpID0+ICggaSA9PT0gMCApID8gZmlyc3RJdGVtTm9kZSA6IG5ldyBUZXh0KCBwcm9qZWN0aWxlVHlwZS5uYW1lLCBpdGVtTm9kZU9wdGlvbnMgKSxcclxuICAgICAgICB0YW5kZW1OYW1lOiBgJHtwcm9qZWN0aWxlVHlwZS5iZW5jaG1hcmt9SXRlbWBcclxuICAgICAgfTtcclxuXHJcbiAgICAgIC8vIENyZWF0ZSB0aGUgY29udHJvbHMgZm9yIHRoZSBwcm9qZWN0aWxlVHlwZSB0b28uXHJcbiAgICAgIHRoaXMub2JqZWN0VHlwZUNvbnRyb2xzLnB1c2goIHRoaXMuY3JlYXRlQ29udHJvbHNGb3JPYmplY3RUeXBlKCBwcm9qZWN0aWxlVHlwZSwgb3B0aW9ucy50YW5kZW0sIG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggYCR7cHJvamVjdGlsZVR5cGUuYmVuY2htYXJrfUNvbnRyb2xgICkgKSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGNyZWF0aW5nIHRoZSBjb250cm9scyBmb3IgZWFjaCBvYmplY3QgdHlwZSBjaGFuZ2VzIHRoZXNlIHZhbHVlcyBiZWNhdXNlIG9mIGVuYWJsZWRSYW5nZVByb3BlcnR5IGxpc3RlbmVycyBpbiB0aGVcclxuICAgIC8vIE51bWJlckNvbnRyb2xzLiBIZXJlIHJlc2V0IGJhY2sgdG8gdGhlIHNlbGVjdGVkUHJvamVjdGlsZU9iamVjdFR5cGUgdG8gZml4IHRoaW5ncy4gU2VlXHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcHJvamVjdGlsZS1tb3Rpb24vaXNzdWVzLzIxM1xyXG4gICAgbW9kZWwucmVzZXRNb2RlbFZhbHVlc1RvSW5pdGlhbCgpO1xyXG5cclxuICAgIC8vIGNyZWF0ZSB2aWV3IGZvciB0aGUgZHJvcGRvd25cclxuICAgIGNvbnN0IHByb2plY3RpbGVDaG9pY2VDb21ib0JveCA9IG5ldyBDb21ib0JveCggbW9kZWwuc2VsZWN0ZWRQcm9qZWN0aWxlT2JqZWN0VHlwZVByb3BlcnR5LCBjb21ib0JveEl0ZW1zLCBjb21ib0JveExpc3RQYXJlbnQsIHtcclxuICAgICAgeE1hcmdpbjogMTIsXHJcbiAgICAgIHlNYXJnaW46IDgsXHJcbiAgICAgIGNvcm5lclJhZGl1czogNCxcclxuICAgICAgYnV0dG9uTGluZVdpZHRoOiBjb21ib0JveExpbmVXaWR0aCxcclxuICAgICAgbGlzdExpbmVXaWR0aDogY29tYm9Cb3hMaW5lV2lkdGgsXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAncHJvamVjdGlsZUNob2ljZUNvbWJvQm94JyApLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnQ29tYm8gYm94IHRoYXQgc2VsZWN0cyB3aGF0IHByb2plY3RpbGUgdHlwZSB0byBsYXVuY2ggZnJvbSB0aGUgY2Fubm9uJ1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIEBwcml2YXRlIG1ha2UgdmlzaWJsZSB0byBtZXRob2RzXHJcbiAgICB0aGlzLnByb2plY3RpbGVDaG9pY2VDb21ib0JveCA9IHByb2plY3RpbGVDaG9pY2VDb21ib0JveDtcclxuXHJcbiAgICAvLyByZWFkb3V0LCBzbGlkZXIsIGFuZCB0d2Vha2Vyc1xyXG5cclxuICAgIC8vIFRoZXNlIGNvbnRhaW5lcnMgYXJlIGFkZGVkIGludG8gdGhlIFBhbmVsIGFzIGRlc2lyZWQsIGFuZCB0aGVpciBjaGlsZHJlbiBhcmUgY2hhbmdlZCBhcyB0aGUgb2JqZWN0IHR5cGUgZG9lcy5cclxuICAgIGNvbnN0IG1hc3NCb3ggPSBuZXcgTm9kZSggeyBleGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzOiB0cnVlIH0gKTtcclxuICAgIGNvbnN0IGRpYW1ldGVyQm94ID0gbmV3IE5vZGUoIHsgZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kczogdHJ1ZSB9ICk7XHJcbiAgICBjb25zdCBkcmFnQ29lZmZpY2llbnRCb3ggPSBuZXcgTm9kZSggeyBleGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzOiB0cnVlIH0gKTtcclxuICAgIGNvbnN0IGFsdGl0dWRlQm94ID0gbmV3IE5vZGUoIHsgZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kczogdHJ1ZSB9ICk7XHJcbiAgICBjb25zdCBncmF2aXR5Qm94ID0gbmV3IE5vZGUoIHsgZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kczogdHJ1ZSB9ICk7XHJcblxyXG4gICAgLy8gdXBkYXRlIHRoZSB0eXBlIG9mIGNvbnRyb2wgYmFzZWQgb24gdGhlIG9iamVjdFR5cGVcclxuICAgIG1vZGVsLnNlbGVjdGVkUHJvamVjdGlsZU9iamVjdFR5cGVQcm9wZXJ0eS5saW5rKCBvYmplY3RUeXBlID0+IHtcclxuICAgICAgY29uc3Qgb2JqZWN0VHlwZUNvbnRyb2xzID0gdGhpcy5vYmplY3RUeXBlQ29udHJvbHNbIHRoaXMub2JqZWN0VHlwZXMuaW5kZXhPZiggb2JqZWN0VHlwZSApIF07XHJcbiAgICAgIG1hc3NCb3guY2hpbGRyZW4gPSBbIG9iamVjdFR5cGVDb250cm9scy5tYXNzQ29udHJvbCBdO1xyXG4gICAgICBkaWFtZXRlckJveC5jaGlsZHJlbiA9IFsgb2JqZWN0VHlwZUNvbnRyb2xzLmRpYW1ldGVyQ29udHJvbCBdO1xyXG4gICAgICBkcmFnQ29lZmZpY2llbnRCb3guY2hpbGRyZW4gPSBbIG9iamVjdFR5cGVDb250cm9scy5kcmFnQ29lZmZpY2llbnRDb250cm9sIF07XHJcbiAgICAgIGFsdGl0dWRlQm94LmNoaWxkcmVuID0gWyBvYmplY3RUeXBlQ29udHJvbHMuYWx0aXR1ZGVDb250cm9sIF07XHJcbiAgICAgIGdyYXZpdHlCb3guY2hpbGRyZW4gPSBbIG9iamVjdFR5cGVDb250cm9scy5ncmF2aXR5Q29udHJvbCBdO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIGRpc2FibGluZyBhbmQgZW5hYmxpbmcgZHJhZyBhbmQgYWx0aXR1ZGUgY29udHJvbHMgZGVwZW5kaW5nIG9uIHdoZXRoZXIgYWlyIHJlc2lzdGFuY2UgaXMgb25cclxuICAgIG1vZGVsLmFpclJlc2lzdGFuY2VPblByb3BlcnR5LmxpbmsoIGFpclJlc2lzdGFuY2VPbiA9PiB7XHJcbiAgICAgIGNvbnN0IG9wYWNpdHkgPSBhaXJSZXNpc3RhbmNlT24gPyAxIDogMC41O1xyXG4gICAgICBhbHRpdHVkZUJveC5vcGFjaXR5ID0gb3BhY2l0eTtcclxuICAgICAgZHJhZ0NvZWZmaWNpZW50Qm94Lm9wYWNpdHkgPSBvcGFjaXR5O1xyXG4gICAgICBhbHRpdHVkZUJveC5zZXRQaWNrYWJsZSggYWlyUmVzaXN0YW5jZU9uICk7XHJcbiAgICAgIGRyYWdDb2VmZmljaWVudEJveC5zZXRQaWNrYWJsZSggYWlyUmVzaXN0YW5jZU9uICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gYWlyIHJlc2lzdGFuY2VcclxuICAgIGNvbnN0IGFpclJlc2lzdGFuY2VMYWJlbCA9IG5ldyBUZXh0KCBhaXJSZXNpc3RhbmNlU3RyaW5nLCBMQUJFTF9PUFRJT05TICk7XHJcbiAgICBjb25zdCBhaXJSZXNpc3RhbmNlTGFiZWxBbmRJY29uID0gbmV3IEhCb3goIHtcclxuICAgICAgc3BhY2luZzogb3B0aW9ucy54TWFyZ2luLFxyXG4gICAgICBjaGlsZHJlbjogWyBhaXJSZXNpc3RhbmNlTGFiZWwsIG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIEFJUl9SRVNJU1RBTkNFX0lDT04gXSB9ICkgXVxyXG4gICAgfSApO1xyXG4gICAgY29uc3QgYWlyUmVzaXN0YW5jZUNoZWNrYm94ID0gbmV3IENoZWNrYm94KCBtb2RlbC5haXJSZXNpc3RhbmNlT25Qcm9wZXJ0eSwgYWlyUmVzaXN0YW5jZUxhYmVsQW5kSWNvbiwge1xyXG4gICAgICBtYXhXaWR0aDogb3B0aW9ucy5taW5XaWR0aCAtIEFJUl9SRVNJU1RBTkNFX0lDT04ud2lkdGggLSAzICogb3B0aW9ucy54TWFyZ2luLFxyXG4gICAgICBib3hXaWR0aDogMTgsXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAnYWlyUmVzaXN0YW5jZUNoZWNrYm94JyApXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gVGhlIGNvbnRlbnRzIG9mIHRoZSBjb250cm9sIHBhbmVsXHJcbiAgICBjb25zdCBjb250ZW50ID0gbmV3IFZCb3goIHtcclxuICAgICAgYWxpZ246ICdsZWZ0JyxcclxuICAgICAgc3BhY2luZzogb3B0aW9ucy5jb250cm9sc1ZlcnRpY2FsU3BhY2UsXHJcbiAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgcHJvamVjdGlsZUNob2ljZUNvbWJvQm94LFxyXG4gICAgICAgIG1hc3NCb3gsXHJcbiAgICAgICAgZGlhbWV0ZXJCb3gsXHJcbiAgICAgICAgbmV3IEhTZXBhcmF0b3IoIHsgc3Ryb2tlOiBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLlNFUEFSQVRPUl9DT0xPUiB9ICksXHJcbiAgICAgICAgZ3Jhdml0eUJveCxcclxuICAgICAgICBuZXcgSFNlcGFyYXRvciggeyBzdHJva2U6IFByb2plY3RpbGVNb3Rpb25Db25zdGFudHMuU0VQQVJBVE9SX0NPTE9SIH0gKSxcclxuICAgICAgICBhaXJSZXNpc3RhbmNlQ2hlY2tib3gsXHJcbiAgICAgICAgYWx0aXR1ZGVCb3gsXHJcbiAgICAgICAgZHJhZ0NvZWZmaWNpZW50Qm94XHJcbiAgICAgIF1cclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLmFkZENoaWxkKCBuZXcgUGFuZWwoIGNvbnRlbnQsIG9wdGlvbnMgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogZm9yIHVzZSBieSBzY3JlZW4gdmlld1xyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICBoaWRlQ29tYm9Cb3hMaXN0KCkge1xyXG4gICAgdGhpcy5wcm9qZWN0aWxlQ2hvaWNlQ29tYm9Cb3guaGlkZUxpc3RCb3goKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIGFuIG9iamVjdFR5cGUsIGNyZWF0ZSB0aGUgY29udHJvbHMgbmVlZGVkIGZvciB0aGF0IHR5cGUuXHJcbiAgICogQHBhcmFtIHtQcm9qZWN0aWxlT2JqZWN0VHlwZX0gb2JqZWN0VHlwZVxyXG4gICAqIEBwYXJhbSB7VGFuZGVtfSBnZW5lcmFsQ29tcG9uZW50VGFuZGVtIC0gdXNlZCBmb3IgdGhlIGVsZW1lbnRzIHRoYXQgY2FuIGJlIHJldXNlZCBiZXR3ZWVuIGFsbCBlbGVtZW50c1xyXG4gICAqIEBwYXJhbSB7VGFuZGVtfSBvYmplY3RTcGVjaWZpY1RhbmRlbSAtIHVzZWQgZm9yIHRoZSBlbGVtZW50cyB0aGF0IGNoYW5nZSBmb3IgZWFjaCBvYmplY3QgdHlwZVxyXG4gICAqIEByZXR1cm5zIHtQcm9qZWN0aWxlT2JqZWN0VHlwZUNvbnRyb2x9XHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBjcmVhdGVDb250cm9sc0Zvck9iamVjdFR5cGUoIG9iamVjdFR5cGUsIGdlbmVyYWxDb21wb25lbnRUYW5kZW0sIG9iamVjdFNwZWNpZmljVGFuZGVtICkge1xyXG5cclxuICAgIGlmICggb2JqZWN0VHlwZS5iZW5jaG1hcmsgPT09ICdjdXN0b20nICkge1xyXG4gICAgICByZXR1cm4gbmV3IEN1c3RvbVByb2plY3RpbGVPYmplY3RUeXBlQ29udHJvbCggdGhpcy5tb2RlbCwgdGhpcy5rZXlwYWRMYXllciwgb2JqZWN0VHlwZSwgb2JqZWN0U3BlY2lmaWNUYW5kZW0sIHtcclxuICAgICAgICB4TWFyZ2luOiB0aGlzLm9wdGlvbnMueE1hcmdpbixcclxuICAgICAgICBtaW5XaWR0aDogdGhpcy5vcHRpb25zLm1pbldpZHRoLFxyXG4gICAgICAgIHJlYWRvdXRYTWFyZ2luOiB0aGlzLm9wdGlvbnMucmVhZG91dFhNYXJnaW4sXHJcbiAgICAgICAgdGV4dERpc3BsYXlXaWR0aDogdGhpcy50ZXh0RGlzcGxheVdpZHRoXHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG5cclxuICAgICAgY29uc3QgZGVmYXVsdE51bWJlckNvbnRyb2xPcHRpb25zID0ge1xyXG4gICAgICAgIHRpdGxlTm9kZU9wdGlvbnM6IHtcclxuICAgICAgICAgIGZvbnQ6IFRFWFRfRk9OVCxcclxuXHJcbiAgICAgICAgICAvLyBwYW5lbCB3aWR0aCAtIG1hcmdpbnMgLSBudW1iZXJEaXNwbGF5IG1hcmdpbnMgYW5kIG1heFdpZHRoXHJcbiAgICAgICAgICBtYXhXaWR0aDogdGhpcy5vcHRpb25zLm1pbldpZHRoIC0gMyAqIHRoaXMub3B0aW9ucy54TWFyZ2luIC0gMiAqIFJFQURPVVRfWF9NQVJHSU4gLSB0aGlzLnRleHREaXNwbGF5V2lkdGhcclxuICAgICAgICB9LFxyXG4gICAgICAgIG51bWJlckRpc3BsYXlPcHRpb25zOiB7XHJcbiAgICAgICAgICBtYXhXaWR0aDogdGhpcy50ZXh0RGlzcGxheVdpZHRoLFxyXG4gICAgICAgICAgYWxpZ246ICdyaWdodCcsXHJcbiAgICAgICAgICB4TWFyZ2luOiBSRUFET1VUX1hfTUFSR0lOLFxyXG4gICAgICAgICAgeU1hcmdpbjogNCxcclxuICAgICAgICAgIHRleHRPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGZvbnQ6IFRFWFRfRk9OVFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2xpZGVyT3B0aW9uczoge1xyXG4gICAgICAgICAgbWFqb3JUaWNrTGVuZ3RoOiA1LFxyXG4gICAgICAgICAgdHJhY2tTaXplOiBuZXcgRGltZW5zaW9uMiggdGhpcy5vcHRpb25zLm1pbldpZHRoIC0gMiAqIHRoaXMub3B0aW9ucy54TWFyZ2luIC0gODAsIDAuNSApLFxyXG4gICAgICAgICAgdGh1bWJTaXplOiBuZXcgRGltZW5zaW9uMiggMTMsIDIyICksXHJcbiAgICAgICAgICB0aHVtYlRvdWNoQXJlYVhEaWxhdGlvbjogNixcclxuICAgICAgICAgIHRodW1iVG91Y2hBcmVhWURpbGF0aW9uOiA0XHJcbiAgICAgICAgfSxcclxuICAgICAgICBhcnJvd0J1dHRvbk9wdGlvbnM6IHtcclxuICAgICAgICAgIHNjYWxlOiAwLjU2LFxyXG4gICAgICAgICAgdG91Y2hBcmVhWERpbGF0aW9uOiAyMCxcclxuICAgICAgICAgIHRvdWNoQXJlYVlEaWxhdGlvbjogMjBcclxuICAgICAgICB9LFxyXG4gICAgICAgIGxheW91dEZ1bmN0aW9uOiBOdW1iZXJDb250cm9sLmNyZWF0ZUxheW91dEZ1bmN0aW9uNCgge1xyXG4gICAgICAgICAgYXJyb3dCdXR0b25TcGFjaW5nOiAxMFxyXG4gICAgICAgIH0gKVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgbWFzc051bWJlckNvbnRyb2wgPSBuZXcgTnVtYmVyQ29udHJvbChcclxuICAgICAgICBtYXNzU3RyaW5nLFxyXG4gICAgICAgIHRoaXMubW9kZWwucHJvamVjdGlsZU1hc3NQcm9wZXJ0eSxcclxuICAgICAgICBvYmplY3RUeXBlLm1hc3NSYW5nZSxcclxuICAgICAgICBtZXJnZSgge1xyXG4gICAgICAgICAgZGVsdGE6IG9iamVjdFR5cGUubWFzc1JvdW5kLFxyXG4gICAgICAgICAgbnVtYmVyRGlzcGxheU9wdGlvbnM6IHtcclxuXHJcbiAgICAgICAgICAgIC8vICd7e3ZhbHVlfX0ga2cnXHJcbiAgICAgICAgICAgIHZhbHVlUGF0dGVybjogU3RyaW5nVXRpbHMuZmlsbEluKCBwYXR0ZXJuMFZhbHVlMVVuaXRzV2l0aFNwYWNlU3RyaW5nLCB7IHVuaXRzOiBrZ1N0cmluZyB9ICksXHJcbiAgICAgICAgICAgIGRlY2ltYWxQbGFjZXM6IE1hdGguY2VpbCggLVV0aWxzLmxvZzEwKCBvYmplY3RUeXBlLm1hc3NSb3VuZCApIClcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzbGlkZXJPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGNvbnN0cmFpblZhbHVlOiB2YWx1ZSA9PiBVdGlscy5yb3VuZFN5bW1ldHJpYyggdmFsdWUgLyBvYmplY3RUeXBlLm1hc3NSb3VuZCApICogb2JqZWN0VHlwZS5tYXNzUm91bmQsXHJcbiAgICAgICAgICAgIG1ham9yVGlja3M6IFsge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiBvYmplY3RUeXBlLm1hc3NSYW5nZS5taW4sXHJcbiAgICAgICAgICAgICAgbGFiZWw6IG5ldyBUZXh0KCBvYmplY3RUeXBlLm1hc3NSYW5nZS5taW4sIExBQkVMX09QVElPTlMgKVxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6IG9iamVjdFR5cGUubWFzc1JhbmdlLm1heCxcclxuICAgICAgICAgICAgICBsYWJlbDogbmV3IFRleHQoIG9iamVjdFR5cGUubWFzc1JhbmdlLm1heCwgTEFCRUxfT1BUSU9OUyApXHJcbiAgICAgICAgICAgIH0gXVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHRhbmRlbTogb2JqZWN0U3BlY2lmaWNUYW5kZW0uY3JlYXRlVGFuZGVtKCAnbWFzc051bWJlckNvbnRyb2wnICksXHJcbiAgICAgICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnVUkgY29udHJvbCB0byBhZGp1c3QgdGhlIG1hc3Mgb2YgdGhlIHByb2plY3RpbGUnXHJcbiAgICAgICAgfSwgZGVmYXVsdE51bWJlckNvbnRyb2xPcHRpb25zICkgKTtcclxuXHJcbiAgICAgIGNvbnN0IGRpYW1ldGVyTnVtYmVyQ29udHJvbCA9IG5ldyBOdW1iZXJDb250cm9sKFxyXG4gICAgICAgIGRpYW1ldGVyU3RyaW5nLCB0aGlzLm1vZGVsLnByb2plY3RpbGVEaWFtZXRlclByb3BlcnR5LFxyXG4gICAgICAgIG9iamVjdFR5cGUuZGlhbWV0ZXJSYW5nZSxcclxuICAgICAgICBtZXJnZSgge1xyXG4gICAgICAgICAgZGVsdGE6IG9iamVjdFR5cGUuZGlhbWV0ZXJSb3VuZCxcclxuICAgICAgICAgIG51bWJlckRpc3BsYXlPcHRpb25zOiB7XHJcblxyXG4gICAgICAgICAgICAvLyAne3t2YWx1ZX19IG0nXHJcbiAgICAgICAgICAgIHZhbHVlUGF0dGVybjogU3RyaW5nVXRpbHMuZmlsbEluKCBwYXR0ZXJuMFZhbHVlMVVuaXRzV2l0aFNwYWNlU3RyaW5nLCB7IHVuaXRzOiBtU3RyaW5nIH0gKSxcclxuICAgICAgICAgICAgZGVjaW1hbFBsYWNlczogTWF0aC5jZWlsKCAtVXRpbHMubG9nMTAoIG9iamVjdFR5cGUuZGlhbWV0ZXJSb3VuZCApIClcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzbGlkZXJPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGNvbnN0cmFpblZhbHVlOiB2YWx1ZSA9PiBVdGlscy5yb3VuZFN5bW1ldHJpYyggdmFsdWUgLyBvYmplY3RUeXBlLmRpYW1ldGVyUm91bmQgKSAqIG9iamVjdFR5cGUuZGlhbWV0ZXJSb3VuZCxcclxuICAgICAgICAgICAgbWFqb3JUaWNrczogWyB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6IG9iamVjdFR5cGUuZGlhbWV0ZXJSYW5nZS5taW4sXHJcbiAgICAgICAgICAgICAgbGFiZWw6IG5ldyBUZXh0KCBvYmplY3RUeXBlLmRpYW1ldGVyUmFuZ2UubWluLCBMQUJFTF9PUFRJT05TIClcclxuICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiBvYmplY3RUeXBlLmRpYW1ldGVyUmFuZ2UubWF4LFxyXG4gICAgICAgICAgICAgIGxhYmVsOiBuZXcgVGV4dCggb2JqZWN0VHlwZS5kaWFtZXRlclJhbmdlLm1heCwgTEFCRUxfT1BUSU9OUyApXHJcbiAgICAgICAgICAgIH0gXVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHRhbmRlbTogb2JqZWN0U3BlY2lmaWNUYW5kZW0uY3JlYXRlVGFuZGVtKCAnZGlhbWV0ZXJOdW1iZXJDb250cm9sJyApLFxyXG4gICAgICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ1VJIGNvbnRyb2wgdG8gYWRqdXN0IHRoZSBkaWFtZXRlciBvZiB0aGUgcHJvamVjdGlsZSdcclxuICAgICAgICB9LCBkZWZhdWx0TnVtYmVyQ29udHJvbE9wdGlvbnMgKSApO1xyXG5cclxuICAgICAgY29uc3QgZ3Jhdml0eU51bWJlckNvbnRyb2wgPSB0aGlzLmdyYXZpdHlOdW1iZXJDb250cm9sIHx8IG5ldyBOdW1iZXJDb250cm9sKFxyXG4gICAgICAgIGdyYXZpdHlTdHJpbmcsXHJcbiAgICAgICAgdGhpcy5tb2RlbC5ncmF2aXR5UHJvcGVydHksXHJcbiAgICAgICAgUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cy5HUkFWSVRZX1JBTkdFLFxyXG4gICAgICAgIG1lcmdlKCB7XHJcbiAgICAgICAgICBkZWx0YTogMC4wMSxcclxuICAgICAgICAgIG51bWJlckRpc3BsYXlPcHRpb25zOiB7XHJcblxyXG4gICAgICAgICAgICAvLyAne3t2YWx1ZX19IG0vc14yXHJcbiAgICAgICAgICAgIHZhbHVlUGF0dGVybjogU3RyaW5nVXRpbHMuZmlsbEluKCBwYXR0ZXJuMFZhbHVlMVVuaXRzV2l0aFNwYWNlU3RyaW5nLCB7XHJcbiAgICAgICAgICAgICAgdW5pdHM6IG1ldGVyc1BlclNlY29uZFNxdWFyZWRTdHJpbmdcclxuICAgICAgICAgICAgfSApLFxyXG4gICAgICAgICAgICBkZWNpbWFsUGxhY2VzOiAyLFxyXG4gICAgICAgICAgICB4TWFyZ2luOiBHUkFWSVRZX1JFQURPVVRfWF9NQVJHSU4sXHJcbiAgICAgICAgICAgIG1heFdpZHRoOiB0aGlzLnRleHREaXNwbGF5V2lkdGggKyBHUkFWSVRZX1JFQURPVVRfWF9NQVJHSU5cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzbGlkZXJPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGNvbnN0cmFpblZhbHVlOiB2YWx1ZSA9PiBVdGlscy5yb3VuZFN5bW1ldHJpYyggdmFsdWUgKiAxMDAgKSAvIDEwMFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHRhbmRlbTogZ2VuZXJhbENvbXBvbmVudFRhbmRlbS5jcmVhdGVUYW5kZW0oICdncmF2aXR5TnVtYmVyQ29udHJvbCcgKSxcclxuICAgICAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdVSSBjb250cm9sIHRvIGFkanVzdCB0aGUgZm9yY2Ugb2YgZ3Jhdml0eSBvbiB0aGUgcHJvamVjdGlsZSdcclxuICAgICAgICB9LCBkZWZhdWx0TnVtYmVyQ29udHJvbE9wdGlvbnMgKVxyXG4gICAgICApO1xyXG4gICAgICB0aGlzLmdyYXZpdHlOdW1iZXJDb250cm9sID0gZ3Jhdml0eU51bWJlckNvbnRyb2w7XHJcblxyXG4gICAgICBjb25zdCBhbHRpdHVkZU51bWJlckNvbnRyb2wgPSB0aGlzLmFsdGl0dWRlTnVtYmVyQ29udHJvbCB8fCBuZXcgTnVtYmVyQ29udHJvbChcclxuICAgICAgICBhbHRpdHVkZVN0cmluZywgdGhpcy5tb2RlbC5hbHRpdHVkZVByb3BlcnR5LFxyXG4gICAgICAgIFByb2plY3RpbGVNb3Rpb25Db25zdGFudHMuQUxUSVRVREVfUkFOR0UsXHJcbiAgICAgICAgbWVyZ2UoIHtcclxuICAgICAgICAgIGRlbHRhOiAxMDAsXHJcbiAgICAgICAgICBudW1iZXJEaXNwbGF5T3B0aW9uczoge1xyXG5cclxuICAgICAgICAgICAgLy8gJ3t7dmFsdWV9fSBtJ1xyXG4gICAgICAgICAgICB2YWx1ZVBhdHRlcm46IFN0cmluZ1V0aWxzLmZpbGxJbiggcGF0dGVybjBWYWx1ZTFVbml0c1dpdGhTcGFjZVN0cmluZywgeyB1bml0czogbVN0cmluZyB9ICksXHJcbiAgICAgICAgICAgIGRlY2ltYWxQbGFjZXM6IDBcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzbGlkZXJPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGNvbnN0cmFpblZhbHVlOiB2YWx1ZSA9PiBVdGlscy5yb3VuZFN5bW1ldHJpYyggdmFsdWUgLyAxMDAgKSAqIDEwMFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHRhbmRlbTogZ2VuZXJhbENvbXBvbmVudFRhbmRlbS5jcmVhdGVUYW5kZW0oICdhbHRpdHVkZU51bWJlckNvbnRyb2wnICksXHJcbiAgICAgICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnVUkgY29udHJvbCB0byBhZGp1c3QgdGhlIGFsdGl0dWRlIG9mIHBvc2l0aW9uIHdoZXJlIHRoZSBwcm9qZWN0aWxlIGlzIGJlaW5nIGxhdW5jaGVkJ1xyXG4gICAgICAgIH0sIGRlZmF1bHROdW1iZXJDb250cm9sT3B0aW9ucyApXHJcbiAgICAgICk7XHJcbiAgICAgIHRoaXMuYWx0aXR1ZGVOdW1iZXJDb250cm9sID0gYWx0aXR1ZGVOdW1iZXJDb250cm9sO1xyXG5cclxuICAgICAgY29uc3QgZHJhZ0NvZWZmaWNpZW50VGV4dCA9IG5ldyBUZXh0KCAnJywgbWVyZ2UoIHt9LCBMQUJFTF9PUFRJT05TLCB7XHJcbiAgICAgICAgbWF4V2lkdGg6IHRoaXMub3B0aW9ucy5taW5XaWR0aCAtIDIgKiB0aGlzLm9wdGlvbnMueE1hcmdpblxyXG4gICAgICB9ICkgKTtcclxuXHJcbiAgICAgIC8vIGV4aXN0cyBmb3IgdGhlIGxpZmV0aW1lIG9mIHRoZSBzaW11bGF0aW9uXHJcbiAgICAgIHRoaXMubW9kZWwucHJvamVjdGlsZURyYWdDb2VmZmljaWVudFByb3BlcnR5LmxpbmsoIGRyYWdDb2VmZmljaWVudCA9PiB7XHJcbiAgICAgICAgZHJhZ0NvZWZmaWNpZW50VGV4dC5zdHJpbmcgPSBgJHtkcmFnQ29lZmZpY2llbnRTdHJpbmd9OiAke1V0aWxzLnRvRml4ZWQoIGRyYWdDb2VmZmljaWVudCwgMiApfWA7XHJcbiAgICAgIH0gKTtcclxuXHJcblxyXG4gICAgICAvLyBPbmUgZGlyZWN0aW9uIG9mIGNvbnRyb2wuIEluc3RlYWQgb2YgbGlua2luZyBib3RoIHRvIGVhY2ggb3RoZXIuIFRoaXMgYWxsb3dzIGEgc2luZ2xlLCBnbG9iYWwgY29udHJvbCB0byBzd2l0Y2hcclxuICAgICAgLy8gYWxsIHR5cGVzJyB2aXNpYmlsaXR5IGF0IG9uY2UsIHdoaWxlIGFsc28gYWxsb3dpbmcgYSBzaW5nbGUgbnVtYmVyQ29udHJvbCB0aGUgZmxleGliaWxpdHkgdG8gaGlkZSBpdHNlbGYuXHJcbiAgICAgIHRoaXMubWFzc051bWJlckNvbnRyb2xzVmlzaWJsZVByb3BlcnR5LmxpbmsoIHZpc2libGUgPT4ge1xyXG4gICAgICAgIG1hc3NOdW1iZXJDb250cm9sLnZpc2libGVQcm9wZXJ0eS52YWx1ZSA9IHZpc2libGU7XHJcbiAgICAgIH0gKTtcclxuICAgICAgdGhpcy5kaWFtZXRlck51bWJlckNvbnRyb2xzVmlzaWJsZVByb3BlcnR5LmxpbmsoIHZpc2libGUgPT4ge1xyXG4gICAgICAgIGRpYW1ldGVyTnVtYmVyQ29udHJvbC52aXNpYmxlUHJvcGVydHkudmFsdWUgPSB2aXNpYmxlO1xyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICByZXR1cm4gbmV3IFByb2plY3RpbGVPYmplY3RUeXBlQ29udHJvbChcclxuICAgICAgICBtYXNzTnVtYmVyQ29udHJvbCxcclxuICAgICAgICBkaWFtZXRlck51bWJlckNvbnRyb2wsXHJcbiAgICAgICAgZ3Jhdml0eU51bWJlckNvbnRyb2wsXHJcbiAgICAgICAgYWx0aXR1ZGVOdW1iZXJDb250cm9sLFxyXG4gICAgICAgIGRyYWdDb2VmZmljaWVudFRleHQgKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbnByb2plY3RpbGVNb3Rpb24ucmVnaXN0ZXIoICdMYWJQcm9qZWN0aWxlQ29udHJvbFBhbmVsJywgTGFiUHJvamVjdGlsZUNvbnRyb2xQYW5lbCApO1xyXG5leHBvcnQgZGVmYXVsdCBMYWJQcm9qZWN0aWxlQ29udHJvbFBhbmVsOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxlQUFlLE1BQU0sd0NBQXdDO0FBQ3BFLE9BQU9DLFVBQVUsTUFBTSxrQ0FBa0M7QUFDekQsT0FBT0MsS0FBSyxNQUFNLDZCQUE2QjtBQUMvQyxPQUFPQyxLQUFLLE1BQU0sbUNBQW1DO0FBQ3JELE9BQU9DLFdBQVcsTUFBTSwrQ0FBK0M7QUFDdkUsT0FBT0MsYUFBYSxNQUFNLDhDQUE4QztBQUN4RSxTQUFTQyxJQUFJLEVBQUVDLFVBQVUsRUFBRUMsTUFBTSxFQUFFQyxJQUFJLEVBQUVDLElBQUksRUFBRUMsSUFBSSxRQUFRLG1DQUFtQztBQUM5RixPQUFPQyxRQUFRLE1BQU0sZ0NBQWdDO0FBQ3JELE9BQU9DLFFBQVEsTUFBTSxnQ0FBZ0M7QUFDckQsT0FBT0MsS0FBSyxNQUFNLDZCQUE2QjtBQUMvQyxPQUFPQyxNQUFNLE1BQU0saUNBQWlDO0FBQ3BELE9BQU9DLHlCQUF5QixNQUFNLDJDQUEyQztBQUNqRixPQUFPQyxnQkFBZ0IsTUFBTSwy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