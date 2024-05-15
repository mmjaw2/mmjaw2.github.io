// Copyright 2016-2024, University of Colorado Boulder

/**
 * View for the dataProbe, which can be dragged to change position.
 *
 * @author Andrea Lin (PhET Interactive Simulations)
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import Property from '../../../../axon/js/Property.js';
import Bounds2 from '../../../../dot/js/Bounds2.js';
import Utils from '../../../../dot/js/Utils.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import { Shape } from '../../../../kite/js/imports.js';
import merge from '../../../../phet-core/js/merge.js';
import StringUtils from '../../../../phetcommon/js/util/StringUtils.js';
import MathSymbols from '../../../../scenery-phet/js/MathSymbols.js';
import { Circle, DragListener, HBox, Node, Path, RadialGradient, Rectangle, Text, VBox } from '../../../../scenery/js/imports.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import projectileMotion from '../../projectileMotion.js';
import ProjectileMotionStrings from '../../ProjectileMotionStrings.js';
import ProjectileMotionConstants from '../ProjectileMotionConstants.js';
import optionize from '../../../../phet-core/js/optionize.js';
import StringProperty from '../../../../axon/js/StringProperty.js';
const heightString = ProjectileMotionStrings.height;
const mString = ProjectileMotionStrings.m;
const pattern0Value1UnitsWithSpaceString = ProjectileMotionStrings.pattern0Value1UnitsWithSpace;
const rangeString = ProjectileMotionStrings.range;
const sString = ProjectileMotionStrings.s;
const timeString = ProjectileMotionStrings.time;
const noValueString = MathSymbols.NO_VALUE;

// constants
const CIRCLE_AROUND_CROSSHAIR_RADIUS = 15; // view units, will not be transformed
const OPAQUE_BLUE = 'rgb( 41, 66, 150 )';
const TRANSPARENT_WHITE = 'rgba( 255, 255, 255, 0.2 )';
const SPACING = 4; // {number} x and y spacing and margins
const TIME_PER_MAJOR_DOT = ProjectileMotionConstants.TIME_PER_MAJOR_DOT;
const LABEL_OPTIONS = merge({}, ProjectileMotionConstants.LABEL_TEXT_OPTIONS, {
  fill: 'white'
});
const SMALL_HALO_RADIUS = ProjectileMotionConstants.SMALL_DOT_RADIUS * 5;
const LARGE_HALO_RADIUS = ProjectileMotionConstants.LARGE_DOT_RADIUS * 5;
const YELLOW_HALO_COLOR = 'rgba( 255, 255, 0, 0.8 )';
const YELLOW_HALO_EDGE_COLOR = 'rgba( 255, 255, 0, 0 )';
const YELLOW_HALO_FILL_SMALL = new RadialGradient(0, 0, 0, 0, 0, SMALL_HALO_RADIUS).addColorStop(0, 'black').addColorStop(0.2, 'black').addColorStop(0.2, YELLOW_HALO_COLOR).addColorStop(0.4, YELLOW_HALO_COLOR).addColorStop(1, YELLOW_HALO_EDGE_COLOR);
const YELLOW_HALO_FILL_LARGE = new RadialGradient(0, 0, 0, 0, 0, LARGE_HALO_RADIUS).addColorStop(0, 'black').addColorStop(0.2, 'black').addColorStop(0.2, YELLOW_HALO_COLOR).addColorStop(0.4, YELLOW_HALO_COLOR).addColorStop(1, YELLOW_HALO_EDGE_COLOR);
const GREEN_HALO_COLOR = 'rgba( 50, 255, 50, 0.8 )';
const GREEN_HALO_EDGE_COLOR = 'rgba( 50, 255, 50, 0 )';
const GREEN_HALO_FILL = new RadialGradient(0, 0, 0, 0, 0, SMALL_HALO_RADIUS).addColorStop(0, 'black').addColorStop(0.2, 'black').addColorStop(0.2, GREEN_HALO_COLOR).addColorStop(0.4, GREEN_HALO_COLOR).addColorStop(1, GREEN_HALO_EDGE_COLOR);
const DATA_PROBE_CONTENT_WIDTH = 155;
const RIGHT_SIDE_PADDING = 6;
const READOUT_X_MARGIN = ProjectileMotionConstants.RIGHTSIDE_PANEL_OPTIONS.readoutXMargin;
class DataProbeNode extends Node {
  // is this being handled by user?

  // where the crosshairs cross

  // so events can be forwarded to it by ToolboxPanel

  constructor(dataProbe, transformProperty, screenView, providedOptions) {
    const options = optionize()({
      cursor: 'pointer',
      tandem: Tandem.REQUIRED
    }, providedOptions);
    super();
    this.isUserControlledProperty = new BooleanProperty(false);
    this.dataProbe = dataProbe; // model
    this.probeOrigin = Vector2.pool.create(0, 0);

    // draggable node
    const rectangle = new Rectangle(0, 0, DATA_PROBE_CONTENT_WIDTH + RIGHT_SIDE_PADDING, 95, {
      cornerRadius: 8,
      fill: OPAQUE_BLUE,
      stroke: 'gray',
      lineWidth: 4,
      opacity: 0.8
    });
    this.rectangle = rectangle;
    rectangle.setMouseArea(rectangle.bounds.dilatedXY(10, 2));
    rectangle.setTouchArea(rectangle.bounds.dilatedXY(15, 6));

    // shift the dataProbe drag bounds so that it can only be dragged until the center reaches the left or right side
    // of the screen
    const dragBoundsShift = -DATA_PROBE_CONTENT_WIDTH / 2 + RIGHT_SIDE_PADDING;

    // crosshair view
    const crosshairShape = new Shape().moveTo(-CIRCLE_AROUND_CROSSHAIR_RADIUS, 0).lineTo(CIRCLE_AROUND_CROSSHAIR_RADIUS, 0).moveTo(0, -CIRCLE_AROUND_CROSSHAIR_RADIUS).lineTo(0, CIRCLE_AROUND_CROSSHAIR_RADIUS);
    const crosshair = new Path(crosshairShape, {
      stroke: 'black'
    });
    const circle = new Circle(CIRCLE_AROUND_CROSSHAIR_RADIUS, {
      lineWidth: 2,
      stroke: 'black',
      fill: TRANSPARENT_WHITE
    });

    // Create the base of the crosshair
    const crosshairMount = new Rectangle(0, 0, 0.4 * CIRCLE_AROUND_CROSSHAIR_RADIUS, 0.4 * CIRCLE_AROUND_CROSSHAIR_RADIUS, {
      fill: 'gray'
    });
    const dragBoundsProperty = new Property(screenView.visibleBoundsProperty.get().shiftedX(dragBoundsShift));
    this.dragListener = new DragListener({
      positionProperty: dataProbe.positionProperty,
      transform: transformProperty,
      dragBoundsProperty: dragBoundsProperty,
      useParentOffset: true,
      start: () => this.isUserControlledProperty.set(true),
      end: () => this.isUserControlledProperty.set(false),
      tandem: options.tandem.createTandem('dragListener')
    });

    // label and values readouts
    const timeReadoutProperty = new StringProperty(noValueString);
    const rangeReadoutProperty = new StringProperty(noValueString);
    const heightReadoutProperty = new StringProperty(noValueString);
    const timeBox = createInformationBox(DATA_PROBE_CONTENT_WIDTH, timeString, timeReadoutProperty);
    const rangeBox = createInformationBox(DATA_PROBE_CONTENT_WIDTH, rangeString, rangeReadoutProperty);
    const heightBox = createInformationBox(DATA_PROBE_CONTENT_WIDTH, heightString, heightReadoutProperty);
    const textBox = new VBox({
      align: 'left',
      spacing: SPACING,
      children: [timeBox, rangeBox, heightBox]
    });

    // halo node for highlighting the dataPoint whose information is shown in the dataProbe tool
    const smallHaloShape = Shape.circle(0, 0, SMALL_HALO_RADIUS);
    const largeHaloShape = Shape.circle(0, 0, LARGE_HALO_RADIUS);
    const haloNode = new Path(smallHaloShape, {
      pickable: false
    });

    // Listen for when time, range, and height change, and update the readouts.
    dataProbe.dataPointProperty.link(point => {
      if (point !== null) {
        timeReadoutProperty.set(StringUtils.fillIn(pattern0Value1UnitsWithSpaceString, {
          value: Utils.toFixedNumber(point.time, 2),
          units: sString
        }));
        rangeReadoutProperty.set(StringUtils.fillIn(pattern0Value1UnitsWithSpaceString, {
          value: Utils.toFixedNumber(point.position.x, 2),
          units: mString
        }));
        heightReadoutProperty.set(StringUtils.fillIn(pattern0Value1UnitsWithSpaceString, {
          value: Utils.toFixedNumber(point.position.y, 2),
          units: mString
        }));
        haloNode.centerX = transformProperty.get().modelToViewX(point.position.x);
        haloNode.centerY = transformProperty.get().modelToViewY(point.position.y);
        haloNode.visible = true;
        haloNode.shape = null;
        if (point.apex) {
          haloNode.shape = smallHaloShape;
          haloNode.fill = GREEN_HALO_FILL;
        } else if (Utils.toFixedNumber(point.time * 1000, 0) % TIME_PER_MAJOR_DOT === 0) {
          haloNode.shape = largeHaloShape;
          haloNode.fill = YELLOW_HALO_FILL_LARGE;
        } else {
          haloNode.shape = smallHaloShape;
          haloNode.fill = YELLOW_HALO_FILL_SMALL;
        }
      } else {
        timeReadoutProperty.set(noValueString);
        rangeReadoutProperty.set(noValueString);
        heightReadoutProperty.set(noValueString);
        haloNode.visible = false;
      }
    });

    // function align positions, and update model.
    const updatePosition = position => {
      this.probeOrigin.set(transformProperty.get().modelToViewPosition(position));
      crosshair.center = this.probeOrigin;
      circle.center = this.probeOrigin;
      crosshairMount.left = this.probeOrigin.x + CIRCLE_AROUND_CROSSHAIR_RADIUS;
      crosshairMount.centerY = this.probeOrigin.y;
      rectangle.left = crosshairMount.right;
      rectangle.centerY = this.probeOrigin.y;
      textBox.left = rectangle.left + 2 * SPACING;
      textBox.top = rectangle.top + 2 * SPACING;
      const dataPoint = dataProbe.dataPointProperty.get();
      if (dataPoint) {
        haloNode.centerX = transformProperty.get().modelToViewX(dataPoint.position.x);
        haloNode.centerY = transformProperty.get().modelToViewY(dataPoint.position.y);
      }
    };

    // Observe changes in the modelViewTransform and update/adjust positions accordingly
    transformProperty.link(transform => {
      dragBoundsProperty.value = transform.viewToModelBounds(screenView.visibleBoundsProperty.get().shiftedX(dragBoundsShift));
      updatePosition(dataProbe.positionProperty.get());
    });

    // Observe changes in the visible bounds and update drag bounds and adjust positions accordingly
    screenView.visibleBoundsProperty.link(() => {
      dragBoundsProperty.value = transformProperty.get().viewToModelBounds(screenView.visibleBoundsProperty.get().shiftedX(dragBoundsShift));
      updatePosition(dataProbe.positionProperty.get());
    });

    // Listen for position changes, align positions, and update model.
    dataProbe.positionProperty.link(position => {
      updatePosition(position);
      this.dataProbe.updateData();
    });

    // Rendering order
    assert && assert(!options.children, 'this type sets its own children');
    options.children = [haloNode, crosshairMount, rectangle, circle, crosshair, textBox];
    this.mutate(options);

    // When dragging, move the dataProbe tool
    this.addInputListener(this.dragListener);

    // visibility of the dataProbe
    dataProbe.isActiveProperty.link(active => {
      this.visible = active;
    });

    // DataProbeNode lasts for the lifetime of the sim, so links don't need to be disposed.
  }

  /**
   * Get the bounds of just the dataProbe, excluding the halo node
   */
  getJustDataProbeBounds() {
    const dataProbeBounds = Bounds2.point(this.probeOrigin.x, this.probeOrigin.y);

    // include every child except for the halo in the calculations of dataProbe bounds
    for (let i = 1; i < this.children.length; i++) {
      dataProbeBounds.includeBounds(this.globalToParentBounds(this.children[i].getGlobalBounds()));
    }
    return dataProbeBounds;
  }

  /**
   * Create icon of DataProbe node
   */
  static createIcon(tandem) {
    const rectangle = new Rectangle(0, 0, DATA_PROBE_CONTENT_WIDTH, 95, {
      cornerRadius: 8,
      fill: OPAQUE_BLUE,
      stroke: 'gray',
      lineWidth: 4,
      opacity: 0.8,
      cursor: 'pointer'
    });

    // crosshair view
    const crosshairShape = new Shape().moveTo(-CIRCLE_AROUND_CROSSHAIR_RADIUS, 0).lineTo(CIRCLE_AROUND_CROSSHAIR_RADIUS, 0).moveTo(0, -CIRCLE_AROUND_CROSSHAIR_RADIUS).lineTo(0, CIRCLE_AROUND_CROSSHAIR_RADIUS);
    const crosshair = new Path(crosshairShape, {
      stroke: 'black'
    });
    const circle = new Circle(CIRCLE_AROUND_CROSSHAIR_RADIUS, {
      lineWidth: 2,
      stroke: 'black',
      fill: TRANSPARENT_WHITE
    });

    // Create the base of the crosshair
    const crosshairMount = new Rectangle(0, 0, 0.4 * CIRCLE_AROUND_CROSSHAIR_RADIUS, 0.4 * CIRCLE_AROUND_CROSSHAIR_RADIUS, {
      fill: 'gray'
    });
    const timeBox = createInformationBox(DATA_PROBE_CONTENT_WIDTH, timeString, new Property(noValueString));
    const rangeBox = createInformationBox(DATA_PROBE_CONTENT_WIDTH, rangeString, new Property(noValueString));
    const heightBox = createInformationBox(DATA_PROBE_CONTENT_WIDTH, heightString, new Property(noValueString));
    const textBox = new VBox({
      align: 'left',
      spacing: SPACING,
      children: [timeBox, rangeBox, heightBox]
    });
    const probeOrigin = Vector2.pool.create(0, 0);
    crosshair.center = probeOrigin;
    circle.center = probeOrigin;
    crosshairMount.left = probeOrigin.x + CIRCLE_AROUND_CROSSHAIR_RADIUS;
    crosshairMount.centerY = probeOrigin.y;
    rectangle.left = crosshairMount.right;
    rectangle.centerY = probeOrigin.y;
    textBox.left = rectangle.left + 2 * SPACING;
    textBox.top = rectangle.top + 2 * SPACING;
    probeOrigin.freeToPool();
    return new Node({
      children: [crosshairMount, rectangle, circle, crosshair, textBox],
      tandem: tandem,
      phetioDocumentation: 'the icon for the DataProbeNode, this is not interactive'
    });
  }
}
projectileMotion.register('DataProbeNode', DataProbeNode);

/**
 * Auxiliary function to create label and number readout for information
 */
function createInformationBox(maxWidth, labelString, readoutProperty) {
  // width of white rectangular background, also used for calculating max width
  const backgroundWidth = 60;

  // label
  const labelText = new Text(labelString, merge({}, LABEL_OPTIONS, {
    maxWidth: maxWidth - backgroundWidth - 25
  }));

  // number
  const numberOptions = merge({}, ProjectileMotionConstants.LABEL_TEXT_OPTIONS, {
    maxWidth: backgroundWidth - 6
  });
  const numberNode = new Text(readoutProperty.get(), numberOptions);
  const backgroundNode = new Rectangle(0, 0, backgroundWidth, numberNode.height + 2 * SPACING, {
    cornerRadius: 4,
    fill: 'white',
    stroke: 'black',
    lineWidth: 0.5
  });

  // update text readout if information changes
  readoutProperty.link(readout => {
    numberNode.setString(readout);
    if (readout === noValueString) {
      numberNode.center = backgroundNode.center;
    } else {
      numberNode.right = backgroundNode.right - READOUT_X_MARGIN;
      numberNode.centerY = backgroundNode.centerY;
    }
  });
  const readoutParent = new Node({
    children: [backgroundNode, numberNode]
  });
  const spacing = maxWidth - labelText.width - readoutParent.width - 4 * SPACING;
  return new HBox({
    spacing: spacing,
    children: [labelText, readoutParent]
  });
}
export default DataProbeNode;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJQcm9wZXJ0eSIsIkJvdW5kczIiLCJVdGlscyIsIlZlY3RvcjIiLCJTaGFwZSIsIm1lcmdlIiwiU3RyaW5nVXRpbHMiLCJNYXRoU3ltYm9scyIsIkNpcmNsZSIsIkRyYWdMaXN0ZW5lciIsIkhCb3giLCJOb2RlIiwiUGF0aCIsIlJhZGlhbEdyYWRpZW50IiwiUmVjdGFuZ2xlIiwiVGV4dCIsIlZCb3giLCJUYW5kZW0iLCJwcm9qZWN0aWxlTW90aW9uIiwiUHJvamVjdGlsZU1vdGlvblN0cmluZ3MiLCJQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzIiwib3B0aW9uaXplIiwiU3RyaW5nUHJvcGVydHkiLCJoZWlnaHRTdHJpbmciLCJoZWlnaHQiLCJtU3RyaW5nIiwibSIsInBhdHRlcm4wVmFsdWUxVW5pdHNXaXRoU3BhY2VTdHJpbmciLCJwYXR0ZXJuMFZhbHVlMVVuaXRzV2l0aFNwYWNlIiwicmFuZ2VTdHJpbmciLCJyYW5nZSIsInNTdHJpbmciLCJzIiwidGltZVN0cmluZyIsInRpbWUiLCJub1ZhbHVlU3RyaW5nIiwiTk9fVkFMVUUiLCJDSVJDTEVfQVJPVU5EX0NST1NTSEFJUl9SQURJVVMiLCJPUEFRVUVfQkxVRSIsIlRSQU5TUEFSRU5UX1dISVRFIiwiU1BBQ0lORyIsIlRJTUVfUEVSX01BSk9SX0RPVCIsIkxBQkVMX09QVElPTlMiLCJMQUJFTF9URVhUX09QVElPTlMiLCJmaWxsIiwiU01BTExfSEFMT19SQURJVVMiLCJTTUFMTF9ET1RfUkFESVVTIiwiTEFSR0VfSEFMT19SQURJVVMiLCJMQVJHRV9ET1RfUkFESVVTIiwiWUVMTE9XX0hBTE9fQ09MT1IiLCJZRUxMT1dfSEFMT19FREdFX0NPTE9SIiwiWUVMTE9XX0hBTE9fRklMTF9TTUFMTCIsImFkZENvbG9yU3RvcCIsIllFTExPV19IQUxPX0ZJTExfTEFSR0UiLCJHUkVFTl9IQUxPX0NPTE9SIiwiR1JFRU5fSEFMT19FREdFX0NPTE9SIiwiR1JFRU5fSEFMT19GSUxMIiwiREFUQV9QUk9CRV9DT05URU5UX1dJRFRIIiwiUklHSFRfU0lERV9QQURESU5HIiwiUkVBRE9VVF9YX01BUkdJTiIsIlJJR0hUU0lERV9QQU5FTF9PUFRJT05TIiwicmVhZG91dFhNYXJnaW4iLCJEYXRhUHJvYmVOb2RlIiwiY29uc3RydWN0b3IiLCJkYXRhUHJvYmUiLCJ0cmFuc2Zvcm1Qcm9wZXJ0eSIsInNjcmVlblZpZXciLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwiY3Vyc29yIiwidGFuZGVtIiwiUkVRVUlSRUQiLCJpc1VzZXJDb250cm9sbGVkUHJvcGVydHkiLCJwcm9iZU9yaWdpbiIsInBvb2wiLCJjcmVhdGUiLCJyZWN0YW5nbGUiLCJjb3JuZXJSYWRpdXMiLCJzdHJva2UiLCJsaW5lV2lkdGgiLCJvcGFjaXR5Iiwic2V0TW91c2VBcmVhIiwiYm91bmRzIiwiZGlsYXRlZFhZIiwic2V0VG91Y2hBcmVhIiwiZHJhZ0JvdW5kc1NoaWZ0IiwiY3Jvc3NoYWlyU2hhcGUiLCJtb3ZlVG8iLCJsaW5lVG8iLCJjcm9zc2hhaXIiLCJjaXJjbGUiLCJjcm9zc2hhaXJNb3VudCIsImRyYWdCb3VuZHNQcm9wZXJ0eSIsInZpc2libGVCb3VuZHNQcm9wZXJ0eSIsImdldCIsInNoaWZ0ZWRYIiwiZHJhZ0xpc3RlbmVyIiwicG9zaXRpb25Qcm9wZXJ0eSIsInRyYW5zZm9ybSIsInVzZVBhcmVudE9mZnNldCIsInN0YXJ0Iiwic2V0IiwiZW5kIiwiY3JlYXRlVGFuZGVtIiwidGltZVJlYWRvdXRQcm9wZXJ0eSIsInJhbmdlUmVhZG91dFByb3BlcnR5IiwiaGVpZ2h0UmVhZG91dFByb3BlcnR5IiwidGltZUJveCIsImNyZWF0ZUluZm9ybWF0aW9uQm94IiwicmFuZ2VCb3giLCJoZWlnaHRCb3giLCJ0ZXh0Qm94IiwiYWxpZ24iLCJzcGFjaW5nIiwiY2hpbGRyZW4iLCJzbWFsbEhhbG9TaGFwZSIsImxhcmdlSGFsb1NoYXBlIiwiaGFsb05vZGUiLCJwaWNrYWJsZSIsImRhdGFQb2ludFByb3BlcnR5IiwibGluayIsInBvaW50IiwiZmlsbEluIiwidmFsdWUiLCJ0b0ZpeGVkTnVtYmVyIiwidW5pdHMiLCJwb3NpdGlvbiIsIngiLCJ5IiwiY2VudGVyWCIsIm1vZGVsVG9WaWV3WCIsImNlbnRlclkiLCJtb2RlbFRvVmlld1kiLCJ2aXNpYmxlIiwic2hhcGUiLCJhcGV4IiwidXBkYXRlUG9zaXRpb24iLCJtb2RlbFRvVmlld1Bvc2l0aW9uIiwiY2VudGVyIiwibGVmdCIsInJpZ2h0IiwidG9wIiwiZGF0YVBvaW50Iiwidmlld1RvTW9kZWxCb3VuZHMiLCJ1cGRhdGVEYXRhIiwiYXNzZXJ0IiwibXV0YXRlIiwiYWRkSW5wdXRMaXN0ZW5lciIsImlzQWN0aXZlUHJvcGVydHkiLCJhY3RpdmUiLCJnZXRKdXN0RGF0YVByb2JlQm91bmRzIiwiZGF0YVByb2JlQm91bmRzIiwiaSIsImxlbmd0aCIsImluY2x1ZGVCb3VuZHMiLCJnbG9iYWxUb1BhcmVudEJvdW5kcyIsImdldEdsb2JhbEJvdW5kcyIsImNyZWF0ZUljb24iLCJmcmVlVG9Qb29sIiwicGhldGlvRG9jdW1lbnRhdGlvbiIsInJlZ2lzdGVyIiwibWF4V2lkdGgiLCJsYWJlbFN0cmluZyIsInJlYWRvdXRQcm9wZXJ0eSIsImJhY2tncm91bmRXaWR0aCIsImxhYmVsVGV4dCIsIm51bWJlck9wdGlvbnMiLCJudW1iZXJOb2RlIiwiYmFja2dyb3VuZE5vZGUiLCJyZWFkb3V0Iiwic2V0U3RyaW5nIiwicmVhZG91dFBhcmVudCIsIndpZHRoIl0sInNvdXJjZXMiOlsiRGF0YVByb2JlTm9kZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBWaWV3IGZvciB0aGUgZGF0YVByb2JlLCB3aGljaCBjYW4gYmUgZHJhZ2dlZCB0byBjaGFuZ2UgcG9zaXRpb24uXHJcbiAqXHJcbiAqIEBhdXRob3IgQW5kcmVhIExpbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgQm9vbGVhblByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvQm9vbGVhblByb3BlcnR5LmpzJztcclxuaW1wb3J0IFByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBVdGlscyBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvVXRpbHMuanMnO1xyXG5pbXBvcnQgVmVjdG9yMiBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvVmVjdG9yMi5qcyc7XHJcbmltcG9ydCB7IFNoYXBlIH0gZnJvbSAnLi4vLi4vLi4vLi4va2l0ZS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IG1lcmdlIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9tZXJnZS5qcyc7XHJcbmltcG9ydCBTdHJpbmdVdGlscyBmcm9tICcuLi8uLi8uLi8uLi9waGV0Y29tbW9uL2pzL3V0aWwvU3RyaW5nVXRpbHMuanMnO1xyXG5pbXBvcnQgTWF0aFN5bWJvbHMgZnJvbSAnLi4vLi4vLi4vLi4vc2NlbmVyeS1waGV0L2pzL01hdGhTeW1ib2xzLmpzJztcclxuaW1wb3J0IHsgQ2lyY2xlLCBEcmFnTGlzdGVuZXIsIEhCb3gsIE5vZGUsIE5vZGVPcHRpb25zLCBQYXRoLCBSYWRpYWxHcmFkaWVudCwgUmVjdGFuZ2xlLCBUZXh0LCBWQm94IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi8uLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuaW1wb3J0IHByb2plY3RpbGVNb3Rpb24gZnJvbSAnLi4vLi4vcHJvamVjdGlsZU1vdGlvbi5qcyc7XHJcbmltcG9ydCBQcm9qZWN0aWxlTW90aW9uU3RyaW5ncyBmcm9tICcuLi8uLi9Qcm9qZWN0aWxlTW90aW9uU3RyaW5ncy5qcyc7XHJcbmltcG9ydCBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzIGZyb20gJy4uL1Byb2plY3RpbGVNb3Rpb25Db25zdGFudHMuanMnO1xyXG5pbXBvcnQgRGF0YVByb2JlIGZyb20gJy4uL21vZGVsL0RhdGFQcm9iZS5qcyc7XHJcbmltcG9ydCBUUmVhZE9ubHlQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IE1vZGVsVmlld1RyYW5zZm9ybTIgZnJvbSAnLi4vLi4vLi4vLi4vcGhldGNvbW1vbi9qcy92aWV3L01vZGVsVmlld1RyYW5zZm9ybTIuanMnO1xyXG5pbXBvcnQgU2NyZWVuVmlldyBmcm9tICcuLi8uLi8uLi8uLi9qb2lzdC9qcy9TY3JlZW5WaWV3LmpzJztcclxuaW1wb3J0IFRQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL1RQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUsIHsgRW1wdHlTZWxmT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgU3RyaW5nUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9TdHJpbmdQcm9wZXJ0eS5qcyc7XHJcblxyXG5jb25zdCBoZWlnaHRTdHJpbmcgPSBQcm9qZWN0aWxlTW90aW9uU3RyaW5ncy5oZWlnaHQ7XHJcbmNvbnN0IG1TdHJpbmcgPSBQcm9qZWN0aWxlTW90aW9uU3RyaW5ncy5tO1xyXG5jb25zdCBwYXR0ZXJuMFZhbHVlMVVuaXRzV2l0aFNwYWNlU3RyaW5nID0gUHJvamVjdGlsZU1vdGlvblN0cmluZ3MucGF0dGVybjBWYWx1ZTFVbml0c1dpdGhTcGFjZTtcclxuY29uc3QgcmFuZ2VTdHJpbmcgPSBQcm9qZWN0aWxlTW90aW9uU3RyaW5ncy5yYW5nZTtcclxuY29uc3Qgc1N0cmluZyA9IFByb2plY3RpbGVNb3Rpb25TdHJpbmdzLnM7XHJcbmNvbnN0IHRpbWVTdHJpbmcgPSBQcm9qZWN0aWxlTW90aW9uU3RyaW5ncy50aW1lO1xyXG5jb25zdCBub1ZhbHVlU3RyaW5nID0gTWF0aFN5bWJvbHMuTk9fVkFMVUU7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgQ0lSQ0xFX0FST1VORF9DUk9TU0hBSVJfUkFESVVTID0gMTU7IC8vIHZpZXcgdW5pdHMsIHdpbGwgbm90IGJlIHRyYW5zZm9ybWVkXHJcbmNvbnN0IE9QQVFVRV9CTFVFID0gJ3JnYiggNDEsIDY2LCAxNTAgKSc7XHJcbmNvbnN0IFRSQU5TUEFSRU5UX1dISVRFID0gJ3JnYmEoIDI1NSwgMjU1LCAyNTUsIDAuMiApJztcclxuY29uc3QgU1BBQ0lORyA9IDQ7IC8vIHtudW1iZXJ9IHggYW5kIHkgc3BhY2luZyBhbmQgbWFyZ2luc1xyXG5jb25zdCBUSU1FX1BFUl9NQUpPUl9ET1QgPSBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLlRJTUVfUEVSX01BSk9SX0RPVDtcclxuY29uc3QgTEFCRUxfT1BUSU9OUyA9IG1lcmdlKCB7fSwgUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cy5MQUJFTF9URVhUX09QVElPTlMsIHsgZmlsbDogJ3doaXRlJyB9ICk7XHJcbmNvbnN0IFNNQUxMX0hBTE9fUkFESVVTID0gUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cy5TTUFMTF9ET1RfUkFESVVTICogNTtcclxuY29uc3QgTEFSR0VfSEFMT19SQURJVVMgPSBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLkxBUkdFX0RPVF9SQURJVVMgKiA1O1xyXG5jb25zdCBZRUxMT1dfSEFMT19DT0xPUiA9ICdyZ2JhKCAyNTUsIDI1NSwgMCwgMC44ICknO1xyXG5jb25zdCBZRUxMT1dfSEFMT19FREdFX0NPTE9SID0gJ3JnYmEoIDI1NSwgMjU1LCAwLCAwICknO1xyXG5jb25zdCBZRUxMT1dfSEFMT19GSUxMX1NNQUxMID0gbmV3IFJhZGlhbEdyYWRpZW50KCAwLCAwLCAwLCAwLCAwLCBTTUFMTF9IQUxPX1JBRElVUyApXHJcbiAgLmFkZENvbG9yU3RvcCggMCwgJ2JsYWNrJyApXHJcbiAgLmFkZENvbG9yU3RvcCggMC4yLCAnYmxhY2snIClcclxuICAuYWRkQ29sb3JTdG9wKCAwLjIsIFlFTExPV19IQUxPX0NPTE9SIClcclxuICAuYWRkQ29sb3JTdG9wKCAwLjQsIFlFTExPV19IQUxPX0NPTE9SIClcclxuICAuYWRkQ29sb3JTdG9wKCAxLCBZRUxMT1dfSEFMT19FREdFX0NPTE9SICk7XHJcbmNvbnN0IFlFTExPV19IQUxPX0ZJTExfTEFSR0UgPSBuZXcgUmFkaWFsR3JhZGllbnQoIDAsIDAsIDAsIDAsIDAsIExBUkdFX0hBTE9fUkFESVVTIClcclxuICAuYWRkQ29sb3JTdG9wKCAwLCAnYmxhY2snIClcclxuICAuYWRkQ29sb3JTdG9wKCAwLjIsICdibGFjaycgKVxyXG4gIC5hZGRDb2xvclN0b3AoIDAuMiwgWUVMTE9XX0hBTE9fQ09MT1IgKVxyXG4gIC5hZGRDb2xvclN0b3AoIDAuNCwgWUVMTE9XX0hBTE9fQ09MT1IgKVxyXG4gIC5hZGRDb2xvclN0b3AoIDEsIFlFTExPV19IQUxPX0VER0VfQ09MT1IgKTtcclxuY29uc3QgR1JFRU5fSEFMT19DT0xPUiA9ICdyZ2JhKCA1MCwgMjU1LCA1MCwgMC44ICknO1xyXG5jb25zdCBHUkVFTl9IQUxPX0VER0VfQ09MT1IgPSAncmdiYSggNTAsIDI1NSwgNTAsIDAgKSc7XHJcbmNvbnN0IEdSRUVOX0hBTE9fRklMTCA9IG5ldyBSYWRpYWxHcmFkaWVudCggMCwgMCwgMCwgMCwgMCwgU01BTExfSEFMT19SQURJVVMgKVxyXG4gIC5hZGRDb2xvclN0b3AoIDAsICdibGFjaycgKVxyXG4gIC5hZGRDb2xvclN0b3AoIDAuMiwgJ2JsYWNrJyApXHJcbiAgLmFkZENvbG9yU3RvcCggMC4yLCBHUkVFTl9IQUxPX0NPTE9SIClcclxuICAuYWRkQ29sb3JTdG9wKCAwLjQsIEdSRUVOX0hBTE9fQ09MT1IgKVxyXG4gIC5hZGRDb2xvclN0b3AoIDEsIEdSRUVOX0hBTE9fRURHRV9DT0xPUiApO1xyXG5cclxuY29uc3QgREFUQV9QUk9CRV9DT05URU5UX1dJRFRIID0gMTU1O1xyXG5jb25zdCBSSUdIVF9TSURFX1BBRERJTkcgPSA2O1xyXG5jb25zdCBSRUFET1VUX1hfTUFSR0lOID0gUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cy5SSUdIVFNJREVfUEFORUxfT1BUSU9OUy5yZWFkb3V0WE1hcmdpbjtcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSBFbXB0eVNlbGZPcHRpb25zO1xyXG50eXBlIERhdGFQcm9iZU5vZGVPcHRpb25zID0gU2VsZk9wdGlvbnMgJiBOb2RlT3B0aW9ucztcclxuXHJcbmNsYXNzIERhdGFQcm9iZU5vZGUgZXh0ZW5kcyBOb2RlIHtcclxuICBwdWJsaWMgcmVhZG9ubHkgaXNVc2VyQ29udHJvbGxlZFByb3BlcnR5OiBUUHJvcGVydHk8Ym9vbGVhbj47IC8vIGlzIHRoaXMgYmVpbmcgaGFuZGxlZCBieSB1c2VyP1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgZGF0YVByb2JlOiBEYXRhUHJvYmU7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBwcm9iZU9yaWdpbjogVmVjdG9yMjsgLy8gd2hlcmUgdGhlIGNyb3NzaGFpcnMgY3Jvc3NcclxuXHJcbiAgLy8gc28gZXZlbnRzIGNhbiBiZSBmb3J3YXJkZWQgdG8gaXQgYnkgVG9vbGJveFBhbmVsXHJcbiAgcHVibGljIHJlYWRvbmx5IGRyYWdMaXN0ZW5lcjogRHJhZ0xpc3RlbmVyO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgcmVjdGFuZ2xlOiBSZWN0YW5nbGU7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggZGF0YVByb2JlOiBEYXRhUHJvYmUsIHRyYW5zZm9ybVByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxNb2RlbFZpZXdUcmFuc2Zvcm0yPiwgc2NyZWVuVmlldzogU2NyZWVuVmlldywgcHJvdmlkZWRPcHRpb25zPzogRGF0YVByb2JlTm9kZU9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxEYXRhUHJvYmVOb2RlT3B0aW9ucywgU2VsZk9wdGlvbnMsIE5vZGVPcHRpb25zPigpKCB7XHJcbiAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxyXG4gICAgICB0YW5kZW06IFRhbmRlbS5SRVFVSVJFRFxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgc3VwZXIoKTtcclxuICAgIHRoaXMuaXNVc2VyQ29udHJvbGxlZFByb3BlcnR5ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggZmFsc2UgKTtcclxuXHJcbiAgICB0aGlzLmRhdGFQcm9iZSA9IGRhdGFQcm9iZTsgLy8gbW9kZWxcclxuICAgIHRoaXMucHJvYmVPcmlnaW4gPSBWZWN0b3IyLnBvb2wuY3JlYXRlKCAwLCAwICk7XHJcblxyXG4gICAgLy8gZHJhZ2dhYmxlIG5vZGVcclxuICAgIGNvbnN0IHJlY3RhbmdsZSA9IG5ldyBSZWN0YW5nbGUoXHJcbiAgICAgIDAsXHJcbiAgICAgIDAsXHJcbiAgICAgIERBVEFfUFJPQkVfQ09OVEVOVF9XSURUSCArIFJJR0hUX1NJREVfUEFERElORyxcclxuICAgICAgOTUsIHtcclxuICAgICAgICBjb3JuZXJSYWRpdXM6IDgsXHJcbiAgICAgICAgZmlsbDogT1BBUVVFX0JMVUUsXHJcbiAgICAgICAgc3Ryb2tlOiAnZ3JheScsXHJcbiAgICAgICAgbGluZVdpZHRoOiA0LFxyXG4gICAgICAgIG9wYWNpdHk6IDAuOFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIHRoaXMucmVjdGFuZ2xlID0gcmVjdGFuZ2xlO1xyXG5cclxuICAgIHJlY3RhbmdsZS5zZXRNb3VzZUFyZWEoIHJlY3RhbmdsZS5ib3VuZHMuZGlsYXRlZFhZKCAxMCwgMiApICk7XHJcbiAgICByZWN0YW5nbGUuc2V0VG91Y2hBcmVhKCByZWN0YW5nbGUuYm91bmRzLmRpbGF0ZWRYWSggMTUsIDYgKSApO1xyXG5cclxuICAgIC8vIHNoaWZ0IHRoZSBkYXRhUHJvYmUgZHJhZyBib3VuZHMgc28gdGhhdCBpdCBjYW4gb25seSBiZSBkcmFnZ2VkIHVudGlsIHRoZSBjZW50ZXIgcmVhY2hlcyB0aGUgbGVmdCBvciByaWdodCBzaWRlXHJcbiAgICAvLyBvZiB0aGUgc2NyZWVuXHJcbiAgICBjb25zdCBkcmFnQm91bmRzU2hpZnQgPSAtREFUQV9QUk9CRV9DT05URU5UX1dJRFRIIC8gMiArIFJJR0hUX1NJREVfUEFERElORztcclxuXHJcbiAgICAvLyBjcm9zc2hhaXIgdmlld1xyXG4gICAgY29uc3QgY3Jvc3NoYWlyU2hhcGUgPSBuZXcgU2hhcGUoKVxyXG4gICAgICAubW92ZVRvKCAtQ0lSQ0xFX0FST1VORF9DUk9TU0hBSVJfUkFESVVTLCAwIClcclxuICAgICAgLmxpbmVUbyggQ0lSQ0xFX0FST1VORF9DUk9TU0hBSVJfUkFESVVTLCAwIClcclxuICAgICAgLm1vdmVUbyggMCwgLUNJUkNMRV9BUk9VTkRfQ1JPU1NIQUlSX1JBRElVUyApXHJcbiAgICAgIC5saW5lVG8oIDAsIENJUkNMRV9BUk9VTkRfQ1JPU1NIQUlSX1JBRElVUyApO1xyXG5cclxuICAgIGNvbnN0IGNyb3NzaGFpciA9IG5ldyBQYXRoKCBjcm9zc2hhaXJTaGFwZSwgeyBzdHJva2U6ICdibGFjaycgfSApO1xyXG4gICAgY29uc3QgY2lyY2xlID0gbmV3IENpcmNsZSggQ0lSQ0xFX0FST1VORF9DUk9TU0hBSVJfUkFESVVTLCB7XHJcbiAgICAgIGxpbmVXaWR0aDogMixcclxuICAgICAgc3Ryb2tlOiAnYmxhY2snLFxyXG4gICAgICBmaWxsOiBUUkFOU1BBUkVOVF9XSElURVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIENyZWF0ZSB0aGUgYmFzZSBvZiB0aGUgY3Jvc3NoYWlyXHJcbiAgICBjb25zdCBjcm9zc2hhaXJNb3VudCA9IG5ldyBSZWN0YW5nbGUoXHJcbiAgICAgIDAsXHJcbiAgICAgIDAsXHJcbiAgICAgIDAuNCAqIENJUkNMRV9BUk9VTkRfQ1JPU1NIQUlSX1JBRElVUyxcclxuICAgICAgMC40ICogQ0lSQ0xFX0FST1VORF9DUk9TU0hBSVJfUkFESVVTLFxyXG4gICAgICB7IGZpbGw6ICdncmF5JyB9XHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IGRyYWdCb3VuZHNQcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSggc2NyZWVuVmlldy52aXNpYmxlQm91bmRzUHJvcGVydHkuZ2V0KCkuc2hpZnRlZFgoIGRyYWdCb3VuZHNTaGlmdCApICk7XHJcblxyXG4gICAgdGhpcy5kcmFnTGlzdGVuZXIgPSBuZXcgRHJhZ0xpc3RlbmVyKCB7XHJcbiAgICAgIHBvc2l0aW9uUHJvcGVydHk6IGRhdGFQcm9iZS5wb3NpdGlvblByb3BlcnR5LFxyXG4gICAgICB0cmFuc2Zvcm06IHRyYW5zZm9ybVByb3BlcnR5LFxyXG4gICAgICBkcmFnQm91bmRzUHJvcGVydHk6IGRyYWdCb3VuZHNQcm9wZXJ0eSxcclxuICAgICAgdXNlUGFyZW50T2Zmc2V0OiB0cnVlLFxyXG4gICAgICBzdGFydDogKCkgPT4gdGhpcy5pc1VzZXJDb250cm9sbGVkUHJvcGVydHkuc2V0KCB0cnVlICksXHJcbiAgICAgIGVuZDogKCkgPT4gdGhpcy5pc1VzZXJDb250cm9sbGVkUHJvcGVydHkuc2V0KCBmYWxzZSApLFxyXG4gICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ2RyYWdMaXN0ZW5lcicgKVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIGxhYmVsIGFuZCB2YWx1ZXMgcmVhZG91dHNcclxuICAgIGNvbnN0IHRpbWVSZWFkb3V0UHJvcGVydHkgPSBuZXcgU3RyaW5nUHJvcGVydHkoIG5vVmFsdWVTdHJpbmcgKTtcclxuICAgIGNvbnN0IHJhbmdlUmVhZG91dFByb3BlcnR5ID0gbmV3IFN0cmluZ1Byb3BlcnR5KCBub1ZhbHVlU3RyaW5nICk7XHJcbiAgICBjb25zdCBoZWlnaHRSZWFkb3V0UHJvcGVydHkgPSBuZXcgU3RyaW5nUHJvcGVydHkoIG5vVmFsdWVTdHJpbmcgKTtcclxuXHJcbiAgICBjb25zdCB0aW1lQm94ID0gY3JlYXRlSW5mb3JtYXRpb25Cb3goIERBVEFfUFJPQkVfQ09OVEVOVF9XSURUSCwgdGltZVN0cmluZywgdGltZVJlYWRvdXRQcm9wZXJ0eSApO1xyXG4gICAgY29uc3QgcmFuZ2VCb3ggPSBjcmVhdGVJbmZvcm1hdGlvbkJveCggREFUQV9QUk9CRV9DT05URU5UX1dJRFRILCByYW5nZVN0cmluZywgcmFuZ2VSZWFkb3V0UHJvcGVydHkgKTtcclxuICAgIGNvbnN0IGhlaWdodEJveCA9IGNyZWF0ZUluZm9ybWF0aW9uQm94KCBEQVRBX1BST0JFX0NPTlRFTlRfV0lEVEgsIGhlaWdodFN0cmluZywgaGVpZ2h0UmVhZG91dFByb3BlcnR5ICk7XHJcblxyXG4gICAgY29uc3QgdGV4dEJveCA9IG5ldyBWQm94KCB7XHJcbiAgICAgIGFsaWduOiAnbGVmdCcsXHJcbiAgICAgIHNwYWNpbmc6IFNQQUNJTkcsXHJcbiAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgdGltZUJveCxcclxuICAgICAgICByYW5nZUJveCxcclxuICAgICAgICBoZWlnaHRCb3hcclxuICAgICAgXVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIGhhbG8gbm9kZSBmb3IgaGlnaGxpZ2h0aW5nIHRoZSBkYXRhUG9pbnQgd2hvc2UgaW5mb3JtYXRpb24gaXMgc2hvd24gaW4gdGhlIGRhdGFQcm9iZSB0b29sXHJcbiAgICBjb25zdCBzbWFsbEhhbG9TaGFwZSA9IFNoYXBlLmNpcmNsZSggMCwgMCwgU01BTExfSEFMT19SQURJVVMgKTtcclxuICAgIGNvbnN0IGxhcmdlSGFsb1NoYXBlID0gU2hhcGUuY2lyY2xlKCAwLCAwLCBMQVJHRV9IQUxPX1JBRElVUyApO1xyXG4gICAgY29uc3QgaGFsb05vZGUgPSBuZXcgUGF0aCggc21hbGxIYWxvU2hhcGUsIHsgcGlja2FibGU6IGZhbHNlIH0gKTtcclxuXHJcbiAgICAvLyBMaXN0ZW4gZm9yIHdoZW4gdGltZSwgcmFuZ2UsIGFuZCBoZWlnaHQgY2hhbmdlLCBhbmQgdXBkYXRlIHRoZSByZWFkb3V0cy5cclxuICAgIGRhdGFQcm9iZS5kYXRhUG9pbnRQcm9wZXJ0eS5saW5rKCBwb2ludCA9PiB7XHJcbiAgICAgIGlmICggcG9pbnQgIT09IG51bGwgKSB7XHJcbiAgICAgICAgdGltZVJlYWRvdXRQcm9wZXJ0eS5zZXQoIFN0cmluZ1V0aWxzLmZpbGxJbiggcGF0dGVybjBWYWx1ZTFVbml0c1dpdGhTcGFjZVN0cmluZywge1xyXG4gICAgICAgICAgdmFsdWU6IFV0aWxzLnRvRml4ZWROdW1iZXIoIHBvaW50LnRpbWUsIDIgKSxcclxuICAgICAgICAgIHVuaXRzOiBzU3RyaW5nXHJcbiAgICAgICAgfSApICk7XHJcbiAgICAgICAgcmFuZ2VSZWFkb3V0UHJvcGVydHkuc2V0KCBTdHJpbmdVdGlscy5maWxsSW4oIHBhdHRlcm4wVmFsdWUxVW5pdHNXaXRoU3BhY2VTdHJpbmcsIHtcclxuICAgICAgICAgIHZhbHVlOiBVdGlscy50b0ZpeGVkTnVtYmVyKCBwb2ludC5wb3NpdGlvbi54LCAyICksXHJcbiAgICAgICAgICB1bml0czogbVN0cmluZ1xyXG4gICAgICAgIH0gKSApO1xyXG4gICAgICAgIGhlaWdodFJlYWRvdXRQcm9wZXJ0eS5zZXQoIFN0cmluZ1V0aWxzLmZpbGxJbiggcGF0dGVybjBWYWx1ZTFVbml0c1dpdGhTcGFjZVN0cmluZywge1xyXG4gICAgICAgICAgdmFsdWU6IFV0aWxzLnRvRml4ZWROdW1iZXIoIHBvaW50LnBvc2l0aW9uLnksIDIgKSxcclxuICAgICAgICAgIHVuaXRzOiBtU3RyaW5nXHJcbiAgICAgICAgfSApICk7XHJcbiAgICAgICAgaGFsb05vZGUuY2VudGVyWCA9IHRyYW5zZm9ybVByb3BlcnR5LmdldCgpLm1vZGVsVG9WaWV3WCggcG9pbnQucG9zaXRpb24ueCApO1xyXG4gICAgICAgIGhhbG9Ob2RlLmNlbnRlclkgPSB0cmFuc2Zvcm1Qcm9wZXJ0eS5nZXQoKS5tb2RlbFRvVmlld1koIHBvaW50LnBvc2l0aW9uLnkgKTtcclxuICAgICAgICBoYWxvTm9kZS52aXNpYmxlID0gdHJ1ZTtcclxuICAgICAgICBoYWxvTm9kZS5zaGFwZSA9IG51bGw7XHJcbiAgICAgICAgaWYgKCBwb2ludC5hcGV4ICkge1xyXG4gICAgICAgICAgaGFsb05vZGUuc2hhcGUgPSBzbWFsbEhhbG9TaGFwZTtcclxuICAgICAgICAgIGhhbG9Ob2RlLmZpbGwgPSBHUkVFTl9IQUxPX0ZJTEw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCBVdGlscy50b0ZpeGVkTnVtYmVyKCBwb2ludC50aW1lICogMTAwMCwgMCApICUgVElNRV9QRVJfTUFKT1JfRE9UID09PSAwICkge1xyXG4gICAgICAgICAgaGFsb05vZGUuc2hhcGUgPSBsYXJnZUhhbG9TaGFwZTtcclxuICAgICAgICAgIGhhbG9Ob2RlLmZpbGwgPSBZRUxMT1dfSEFMT19GSUxMX0xBUkdFO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGhhbG9Ob2RlLnNoYXBlID0gc21hbGxIYWxvU2hhcGU7XHJcbiAgICAgICAgICBoYWxvTm9kZS5maWxsID0gWUVMTE9XX0hBTE9fRklMTF9TTUFMTDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdGltZVJlYWRvdXRQcm9wZXJ0eS5zZXQoIG5vVmFsdWVTdHJpbmcgKTtcclxuICAgICAgICByYW5nZVJlYWRvdXRQcm9wZXJ0eS5zZXQoIG5vVmFsdWVTdHJpbmcgKTtcclxuICAgICAgICBoZWlnaHRSZWFkb3V0UHJvcGVydHkuc2V0KCBub1ZhbHVlU3RyaW5nICk7XHJcbiAgICAgICAgaGFsb05vZGUudmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gZnVuY3Rpb24gYWxpZ24gcG9zaXRpb25zLCBhbmQgdXBkYXRlIG1vZGVsLlxyXG4gICAgY29uc3QgdXBkYXRlUG9zaXRpb24gPSAoIHBvc2l0aW9uOiBWZWN0b3IyICkgPT4ge1xyXG4gICAgICB0aGlzLnByb2JlT3JpZ2luLnNldCggdHJhbnNmb3JtUHJvcGVydHkuZ2V0KCkubW9kZWxUb1ZpZXdQb3NpdGlvbiggcG9zaXRpb24gKSApO1xyXG5cclxuICAgICAgY3Jvc3NoYWlyLmNlbnRlciA9IHRoaXMucHJvYmVPcmlnaW47XHJcbiAgICAgIGNpcmNsZS5jZW50ZXIgPSB0aGlzLnByb2JlT3JpZ2luO1xyXG4gICAgICBjcm9zc2hhaXJNb3VudC5sZWZ0ID0gdGhpcy5wcm9iZU9yaWdpbi54ICsgQ0lSQ0xFX0FST1VORF9DUk9TU0hBSVJfUkFESVVTO1xyXG4gICAgICBjcm9zc2hhaXJNb3VudC5jZW50ZXJZID0gdGhpcy5wcm9iZU9yaWdpbi55O1xyXG4gICAgICByZWN0YW5nbGUubGVmdCA9IGNyb3NzaGFpck1vdW50LnJpZ2h0O1xyXG4gICAgICByZWN0YW5nbGUuY2VudGVyWSA9IHRoaXMucHJvYmVPcmlnaW4ueTtcclxuICAgICAgdGV4dEJveC5sZWZ0ID0gcmVjdGFuZ2xlLmxlZnQgKyAyICogU1BBQ0lORztcclxuICAgICAgdGV4dEJveC50b3AgPSByZWN0YW5nbGUudG9wICsgMiAqIFNQQUNJTkc7XHJcblxyXG4gICAgICBjb25zdCBkYXRhUG9pbnQgPSBkYXRhUHJvYmUuZGF0YVBvaW50UHJvcGVydHkuZ2V0KCk7XHJcbiAgICAgIGlmICggZGF0YVBvaW50ICkge1xyXG4gICAgICAgIGhhbG9Ob2RlLmNlbnRlclggPSB0cmFuc2Zvcm1Qcm9wZXJ0eS5nZXQoKS5tb2RlbFRvVmlld1goIGRhdGFQb2ludC5wb3NpdGlvbi54ICk7XHJcbiAgICAgICAgaGFsb05vZGUuY2VudGVyWSA9IHRyYW5zZm9ybVByb3BlcnR5LmdldCgpLm1vZGVsVG9WaWV3WSggZGF0YVBvaW50LnBvc2l0aW9uLnkgKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBPYnNlcnZlIGNoYW5nZXMgaW4gdGhlIG1vZGVsVmlld1RyYW5zZm9ybSBhbmQgdXBkYXRlL2FkanVzdCBwb3NpdGlvbnMgYWNjb3JkaW5nbHlcclxuICAgIHRyYW5zZm9ybVByb3BlcnR5LmxpbmsoIHRyYW5zZm9ybSA9PiB7XHJcbiAgICAgIGRyYWdCb3VuZHNQcm9wZXJ0eS52YWx1ZSA9IHRyYW5zZm9ybS52aWV3VG9Nb2RlbEJvdW5kcyggc2NyZWVuVmlldy52aXNpYmxlQm91bmRzUHJvcGVydHkuZ2V0KCkuc2hpZnRlZFgoIGRyYWdCb3VuZHNTaGlmdCApICk7XHJcbiAgICAgIHVwZGF0ZVBvc2l0aW9uKCBkYXRhUHJvYmUucG9zaXRpb25Qcm9wZXJ0eS5nZXQoKSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIE9ic2VydmUgY2hhbmdlcyBpbiB0aGUgdmlzaWJsZSBib3VuZHMgYW5kIHVwZGF0ZSBkcmFnIGJvdW5kcyBhbmQgYWRqdXN0IHBvc2l0aW9ucyBhY2NvcmRpbmdseVxyXG4gICAgc2NyZWVuVmlldy52aXNpYmxlQm91bmRzUHJvcGVydHkubGluayggKCkgPT4ge1xyXG4gICAgICBkcmFnQm91bmRzUHJvcGVydHkudmFsdWUgPSB0cmFuc2Zvcm1Qcm9wZXJ0eS5nZXQoKS52aWV3VG9Nb2RlbEJvdW5kcyggc2NyZWVuVmlldy52aXNpYmxlQm91bmRzUHJvcGVydHkuZ2V0KCkuc2hpZnRlZFgoIGRyYWdCb3VuZHNTaGlmdCApICk7XHJcbiAgICAgIHVwZGF0ZVBvc2l0aW9uKCBkYXRhUHJvYmUucG9zaXRpb25Qcm9wZXJ0eS5nZXQoKSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIExpc3RlbiBmb3IgcG9zaXRpb24gY2hhbmdlcywgYWxpZ24gcG9zaXRpb25zLCBhbmQgdXBkYXRlIG1vZGVsLlxyXG4gICAgZGF0YVByb2JlLnBvc2l0aW9uUHJvcGVydHkubGluayggcG9zaXRpb24gPT4ge1xyXG4gICAgICB1cGRhdGVQb3NpdGlvbiggcG9zaXRpb24gKTtcclxuICAgICAgdGhpcy5kYXRhUHJvYmUudXBkYXRlRGF0YSgpO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIFJlbmRlcmluZyBvcmRlclxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIW9wdGlvbnMuY2hpbGRyZW4sICd0aGlzIHR5cGUgc2V0cyBpdHMgb3duIGNoaWxkcmVuJyApO1xyXG4gICAgb3B0aW9ucy5jaGlsZHJlbiA9IFtcclxuICAgICAgaGFsb05vZGUsXHJcbiAgICAgIGNyb3NzaGFpck1vdW50LFxyXG4gICAgICByZWN0YW5nbGUsXHJcbiAgICAgIGNpcmNsZSxcclxuICAgICAgY3Jvc3NoYWlyLFxyXG4gICAgICB0ZXh0Qm94XHJcbiAgICBdO1xyXG5cclxuICAgIHRoaXMubXV0YXRlKCBvcHRpb25zICk7XHJcblxyXG4gICAgLy8gV2hlbiBkcmFnZ2luZywgbW92ZSB0aGUgZGF0YVByb2JlIHRvb2xcclxuICAgIHRoaXMuYWRkSW5wdXRMaXN0ZW5lciggdGhpcy5kcmFnTGlzdGVuZXIgKTtcclxuXHJcbiAgICAvLyB2aXNpYmlsaXR5IG9mIHRoZSBkYXRhUHJvYmVcclxuICAgIGRhdGFQcm9iZS5pc0FjdGl2ZVByb3BlcnR5LmxpbmsoIGFjdGl2ZSA9PiB7XHJcbiAgICAgIHRoaXMudmlzaWJsZSA9IGFjdGl2ZTtcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBEYXRhUHJvYmVOb2RlIGxhc3RzIGZvciB0aGUgbGlmZXRpbWUgb2YgdGhlIHNpbSwgc28gbGlua3MgZG9uJ3QgbmVlZCB0byBiZSBkaXNwb3NlZC5cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgYm91bmRzIG9mIGp1c3QgdGhlIGRhdGFQcm9iZSwgZXhjbHVkaW5nIHRoZSBoYWxvIG5vZGVcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0SnVzdERhdGFQcm9iZUJvdW5kcygpOiBCb3VuZHMyIHtcclxuICAgIGNvbnN0IGRhdGFQcm9iZUJvdW5kcyA9IEJvdW5kczIucG9pbnQoIHRoaXMucHJvYmVPcmlnaW4ueCwgdGhpcy5wcm9iZU9yaWdpbi55ICk7XHJcblxyXG4gICAgLy8gaW5jbHVkZSBldmVyeSBjaGlsZCBleGNlcHQgZm9yIHRoZSBoYWxvIGluIHRoZSBjYWxjdWxhdGlvbnMgb2YgZGF0YVByb2JlIGJvdW5kc1xyXG4gICAgZm9yICggbGV0IGkgPSAxOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgZGF0YVByb2JlQm91bmRzLmluY2x1ZGVCb3VuZHMoIHRoaXMuZ2xvYmFsVG9QYXJlbnRCb3VuZHMoIHRoaXMuY2hpbGRyZW5bIGkgXS5nZXRHbG9iYWxCb3VuZHMoKSApICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZGF0YVByb2JlQm91bmRzO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZSBpY29uIG9mIERhdGFQcm9iZSBub2RlXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBjcmVhdGVJY29uKCB0YW5kZW06IFRhbmRlbSApOiBOb2RlIHtcclxuICAgIGNvbnN0IHJlY3RhbmdsZSA9IG5ldyBSZWN0YW5nbGUoXHJcbiAgICAgIDAsXHJcbiAgICAgIDAsXHJcbiAgICAgIERBVEFfUFJPQkVfQ09OVEVOVF9XSURUSCxcclxuICAgICAgOTUsIHtcclxuICAgICAgICBjb3JuZXJSYWRpdXM6IDgsXHJcbiAgICAgICAgZmlsbDogT1BBUVVFX0JMVUUsXHJcbiAgICAgICAgc3Ryb2tlOiAnZ3JheScsXHJcbiAgICAgICAgbGluZVdpZHRoOiA0LFxyXG4gICAgICAgIG9wYWNpdHk6IDAuOCxcclxuICAgICAgICBjdXJzb3I6ICdwb2ludGVyJ1xyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIGNyb3NzaGFpciB2aWV3XHJcbiAgICBjb25zdCBjcm9zc2hhaXJTaGFwZSA9IG5ldyBTaGFwZSgpXHJcbiAgICAgIC5tb3ZlVG8oIC1DSVJDTEVfQVJPVU5EX0NST1NTSEFJUl9SQURJVVMsIDAgKVxyXG4gICAgICAubGluZVRvKCBDSVJDTEVfQVJPVU5EX0NST1NTSEFJUl9SQURJVVMsIDAgKVxyXG4gICAgICAubW92ZVRvKCAwLCAtQ0lSQ0xFX0FST1VORF9DUk9TU0hBSVJfUkFESVVTIClcclxuICAgICAgLmxpbmVUbyggMCwgQ0lSQ0xFX0FST1VORF9DUk9TU0hBSVJfUkFESVVTICk7XHJcblxyXG4gICAgY29uc3QgY3Jvc3NoYWlyID0gbmV3IFBhdGgoIGNyb3NzaGFpclNoYXBlLCB7IHN0cm9rZTogJ2JsYWNrJyB9ICk7XHJcbiAgICBjb25zdCBjaXJjbGUgPSBuZXcgQ2lyY2xlKCBDSVJDTEVfQVJPVU5EX0NST1NTSEFJUl9SQURJVVMsIHtcclxuICAgICAgbGluZVdpZHRoOiAyLFxyXG4gICAgICBzdHJva2U6ICdibGFjaycsXHJcbiAgICAgIGZpbGw6IFRSQU5TUEFSRU5UX1dISVRFXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIHRoZSBiYXNlIG9mIHRoZSBjcm9zc2hhaXJcclxuICAgIGNvbnN0IGNyb3NzaGFpck1vdW50ID0gbmV3IFJlY3RhbmdsZSggMCwgMCwgMC40ICogQ0lSQ0xFX0FST1VORF9DUk9TU0hBSVJfUkFESVVTLCAwLjQgKiBDSVJDTEVfQVJPVU5EX0NST1NTSEFJUl9SQURJVVMsIHsgZmlsbDogJ2dyYXknIH0gKTtcclxuICAgIGNvbnN0IHRpbWVCb3ggPSBjcmVhdGVJbmZvcm1hdGlvbkJveCggREFUQV9QUk9CRV9DT05URU5UX1dJRFRILCB0aW1lU3RyaW5nLCBuZXcgUHJvcGVydHkoIG5vVmFsdWVTdHJpbmcgKSApO1xyXG4gICAgY29uc3QgcmFuZ2VCb3ggPSBjcmVhdGVJbmZvcm1hdGlvbkJveCggREFUQV9QUk9CRV9DT05URU5UX1dJRFRILCByYW5nZVN0cmluZywgbmV3IFByb3BlcnR5KCBub1ZhbHVlU3RyaW5nICkgKTtcclxuICAgIGNvbnN0IGhlaWdodEJveCA9IGNyZWF0ZUluZm9ybWF0aW9uQm94KCBEQVRBX1BST0JFX0NPTlRFTlRfV0lEVEgsIGhlaWdodFN0cmluZywgbmV3IFByb3BlcnR5KCBub1ZhbHVlU3RyaW5nICkgKTtcclxuXHJcbiAgICBjb25zdCB0ZXh0Qm94ID0gbmV3IFZCb3goIHtcclxuICAgICAgYWxpZ246ICdsZWZ0JyxcclxuICAgICAgc3BhY2luZzogU1BBQ0lORyxcclxuICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICB0aW1lQm94LFxyXG4gICAgICAgIHJhbmdlQm94LFxyXG4gICAgICAgIGhlaWdodEJveFxyXG4gICAgICBdXHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3QgcHJvYmVPcmlnaW4gPSBWZWN0b3IyLnBvb2wuY3JlYXRlKCAwLCAwICk7XHJcblxyXG4gICAgY3Jvc3NoYWlyLmNlbnRlciA9IHByb2JlT3JpZ2luO1xyXG4gICAgY2lyY2xlLmNlbnRlciA9IHByb2JlT3JpZ2luO1xyXG4gICAgY3Jvc3NoYWlyTW91bnQubGVmdCA9IHByb2JlT3JpZ2luLnggKyBDSVJDTEVfQVJPVU5EX0NST1NTSEFJUl9SQURJVVM7XHJcbiAgICBjcm9zc2hhaXJNb3VudC5jZW50ZXJZID0gcHJvYmVPcmlnaW4ueTtcclxuICAgIHJlY3RhbmdsZS5sZWZ0ID0gY3Jvc3NoYWlyTW91bnQucmlnaHQ7XHJcbiAgICByZWN0YW5nbGUuY2VudGVyWSA9IHByb2JlT3JpZ2luLnk7XHJcbiAgICB0ZXh0Qm94LmxlZnQgPSByZWN0YW5nbGUubGVmdCArIDIgKiBTUEFDSU5HO1xyXG4gICAgdGV4dEJveC50b3AgPSByZWN0YW5nbGUudG9wICsgMiAqIFNQQUNJTkc7XHJcblxyXG4gICAgcHJvYmVPcmlnaW4uZnJlZVRvUG9vbCgpO1xyXG5cclxuICAgIHJldHVybiBuZXcgTm9kZSgge1xyXG4gICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgIGNyb3NzaGFpck1vdW50LFxyXG4gICAgICAgIHJlY3RhbmdsZSxcclxuICAgICAgICBjaXJjbGUsXHJcbiAgICAgICAgY3Jvc3NoYWlyLFxyXG4gICAgICAgIHRleHRCb3hcclxuICAgICAgXSxcclxuICAgICAgdGFuZGVtOiB0YW5kZW0sXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICd0aGUgaWNvbiBmb3IgdGhlIERhdGFQcm9iZU5vZGUsIHRoaXMgaXMgbm90IGludGVyYWN0aXZlJ1xyXG4gICAgfSApO1xyXG4gIH1cclxufVxyXG5cclxucHJvamVjdGlsZU1vdGlvbi5yZWdpc3RlciggJ0RhdGFQcm9iZU5vZGUnLCBEYXRhUHJvYmVOb2RlICk7XHJcblxyXG5cclxuLyoqXHJcbiAqIEF1eGlsaWFyeSBmdW5jdGlvbiB0byBjcmVhdGUgbGFiZWwgYW5kIG51bWJlciByZWFkb3V0IGZvciBpbmZvcm1hdGlvblxyXG4gKi9cclxuZnVuY3Rpb24gY3JlYXRlSW5mb3JtYXRpb25Cb3goIG1heFdpZHRoOiBudW1iZXIsIGxhYmVsU3RyaW5nOiBzdHJpbmcsIHJlYWRvdXRQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nPiApOiBOb2RlIHtcclxuXHJcbiAgLy8gd2lkdGggb2Ygd2hpdGUgcmVjdGFuZ3VsYXIgYmFja2dyb3VuZCwgYWxzbyB1c2VkIGZvciBjYWxjdWxhdGluZyBtYXggd2lkdGhcclxuICBjb25zdCBiYWNrZ3JvdW5kV2lkdGggPSA2MDtcclxuXHJcbiAgLy8gbGFiZWxcclxuICBjb25zdCBsYWJlbFRleHQgPSBuZXcgVGV4dCggbGFiZWxTdHJpbmcsIG1lcmdlKCB7fSwgTEFCRUxfT1BUSU9OUywge1xyXG4gICAgbWF4V2lkdGg6IG1heFdpZHRoIC0gYmFja2dyb3VuZFdpZHRoIC0gMjVcclxuICB9ICkgKTtcclxuXHJcbiAgLy8gbnVtYmVyXHJcbiAgY29uc3QgbnVtYmVyT3B0aW9ucyA9IG1lcmdlKCB7fSwgUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cy5MQUJFTF9URVhUX09QVElPTlMsIHsgbWF4V2lkdGg6IGJhY2tncm91bmRXaWR0aCAtIDYgfSApO1xyXG4gIGNvbnN0IG51bWJlck5vZGUgPSBuZXcgVGV4dCggcmVhZG91dFByb3BlcnR5LmdldCgpLCBudW1iZXJPcHRpb25zICk7XHJcblxyXG4gIGNvbnN0IGJhY2tncm91bmROb2RlID0gbmV3IFJlY3RhbmdsZShcclxuICAgIDAsXHJcbiAgICAwLFxyXG4gICAgYmFja2dyb3VuZFdpZHRoLFxyXG4gICAgbnVtYmVyTm9kZS5oZWlnaHQgKyAyICogU1BBQ0lORywge1xyXG4gICAgICBjb3JuZXJSYWRpdXM6IDQsXHJcbiAgICAgIGZpbGw6ICd3aGl0ZScsXHJcbiAgICAgIHN0cm9rZTogJ2JsYWNrJyxcclxuICAgICAgbGluZVdpZHRoOiAwLjVcclxuICAgIH1cclxuICApO1xyXG5cclxuICAvLyB1cGRhdGUgdGV4dCByZWFkb3V0IGlmIGluZm9ybWF0aW9uIGNoYW5nZXNcclxuICByZWFkb3V0UHJvcGVydHkubGluayggcmVhZG91dCA9PiB7XHJcbiAgICBudW1iZXJOb2RlLnNldFN0cmluZyggcmVhZG91dCApO1xyXG4gICAgaWYgKCByZWFkb3V0ID09PSBub1ZhbHVlU3RyaW5nICkge1xyXG4gICAgICBudW1iZXJOb2RlLmNlbnRlciA9IGJhY2tncm91bmROb2RlLmNlbnRlcjtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBudW1iZXJOb2RlLnJpZ2h0ID0gYmFja2dyb3VuZE5vZGUucmlnaHQgLSBSRUFET1VUX1hfTUFSR0lOO1xyXG4gICAgICBudW1iZXJOb2RlLmNlbnRlclkgPSBiYWNrZ3JvdW5kTm9kZS5jZW50ZXJZO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuXHJcbiAgY29uc3QgcmVhZG91dFBhcmVudCA9IG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIGJhY2tncm91bmROb2RlLCBudW1iZXJOb2RlIF0gfSApO1xyXG5cclxuICBjb25zdCBzcGFjaW5nID0gbWF4V2lkdGggLSBsYWJlbFRleHQud2lkdGggLSByZWFkb3V0UGFyZW50LndpZHRoIC0gNCAqIFNQQUNJTkc7XHJcblxyXG4gIHJldHVybiBuZXcgSEJveCggeyBzcGFjaW5nOiBzcGFjaW5nLCBjaGlsZHJlbjogWyBsYWJlbFRleHQsIHJlYWRvdXRQYXJlbnQgXSB9ICk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IERhdGFQcm9iZU5vZGU7Il0sIm1hcHBpbmdzIjoi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