// Copyright 2013-2024, University of Colorado Boulder

/**
 * SpectrumSlider is a slider-like control used for choosing a value that corresponds to a displayed color.
 * It is the base class for WavelengthSlider.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Property from '../../axon/js/Property.js';
import Dimension2 from '../../dot/js/Dimension2.js';
import Range from '../../dot/js/Range.js';
import Utils from '../../dot/js/Utils.js';
import { Shape } from '../../kite/js/imports.js';
import deprecationWarning from '../../phet-core/js/deprecationWarning.js';
import InstanceRegistry from '../../phet-core/js/documentation/InstanceRegistry.js';
import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
import { Color, DragListener, HighlightFromNode, Node, Path, Rectangle, Text } from '../../scenery/js/imports.js';
import AccessibleSlider from '../../sun/js/accessibility/AccessibleSlider.js';
import ArrowButton from '../../sun/js/buttons/ArrowButton.js';
import Tandem from '../../tandem/js/Tandem.js';
import PhetFont from './PhetFont.js';
import sceneryPhet from './sceneryPhet.js';
import SpectrumNode from './SpectrumNode.js';
const DEFAULT_MIN_VALUE = 0;
const DEFAULT_MAX_VALUE = 1;
/**
 * @deprecated use WavelengthNumberControl, or Slider.js with SpectrumSliderTrack and SpectrumSliderTrack,
 *   see https://github.com/phetsims/scenery-phet/issues/729
 */
export default class SpectrumSlider extends AccessibleSlider(Node, 0) {
  /**
   * @param valueProperty
   * @param providedOptions
   */
  constructor(valueProperty, providedOptions) {
    assert && deprecationWarning('SpectrumSlider is deprecated, please use Slider with SpectrumSlideTrack/Thumb instead');
    const enabledRangeMin = providedOptions?.minValue ?? DEFAULT_MIN_VALUE;
    const enabledRangeMax = providedOptions?.maxValue ?? DEFAULT_MAX_VALUE;
    const enabledRangeProperty = new Property(new Range(enabledRangeMin, enabledRangeMax));

    // options that are specific to this type
    const options = optionize()({
      // SelfOptions
      minValue: DEFAULT_MIN_VALUE,
      maxValue: DEFAULT_MAX_VALUE,
      valueToString: value => `${value}`,
      valueToColor: value => new Color(0, 0, 255 * value),
      // track
      trackWidth: 150,
      trackHeight: 30,
      trackOpacity: 1,
      trackBorderStroke: 'black',
      // thumb
      thumbWidth: 35,
      thumbHeight: 45,
      thumbTouchAreaXDilation: 12,
      thumbTouchAreaYDilation: 10,
      thumbMouseAreaXDilation: 0,
      thumbMouseAreaYDilation: 0,
      // value
      valueFont: new PhetFont(20),
      valueFill: 'black',
      valueVisible: true,
      valueYSpacing: 2,
      // {number} space between value and top of track

      // tweakers
      tweakersVisible: true,
      tweakerValueDelta: 1,
      // {number} the amount that value changes when a tweaker button is pressed
      tweakersXSpacing: 8,
      // {number} space between tweakers and track
      maxTweakersHeight: 30,
      tweakersTouchAreaXDilation: 7,
      tweakersTouchAreaYDilation: 7,
      tweakersMouseAreaXDilation: 0,
      tweakersMouseAreaYDilation: 0,
      // cursor, the rectangle than follows the thumb in the track
      cursorVisible: true,
      cursorStroke: 'black',
      // ParentOptions
      valueProperty: valueProperty,
      enabledRangeProperty: enabledRangeProperty,
      tandem: Tandem.REQUIRED,
      tandemNameSuffix: 'Slider'
    }, providedOptions);

    // validate values
    assert && assert(options.minValue < options.maxValue);

    // These options require valid Bounds, and will be applied later via mutate.
    const boundsRequiredOptionKeys = _.pick(options, Node.REQUIRES_BOUNDS_OPTION_KEYS);
    super(_.omit(options, Node.REQUIRES_BOUNDS_OPTION_KEYS));
    const track = new SpectrumNode({
      valueToColor: options.valueToColor,
      size: new Dimension2(options.trackWidth, options.trackHeight),
      minValue: options.minValue,
      maxValue: options.maxValue,
      opacity: options.trackOpacity,
      cursor: 'pointer'
    });

    /*
     * Put a border around the track.
     * We don't stroke the track itself because stroking the track will affect its bounds,
     * and will thus affect the drag handle behavior.
     * Having a separate border also gives subclasses a place to add markings (eg, tick marks)
     * without affecting the track's bounds.
     */
    const trackBorder = new Rectangle(0, 0, track.width, track.height, {
      stroke: options.trackBorderStroke,
      lineWidth: 1,
      pickable: false
    });
    let valueDisplay = null;
    if (options.valueVisible) {
      valueDisplay = new ValueDisplay(valueProperty, options.valueToString, {
        font: options.valueFont,
        fill: options.valueFill,
        bottom: track.top - options.valueYSpacing
      });
    }
    let cursor = null;
    if (options.cursorVisible) {
      cursor = new Cursor(3, track.height, {
        stroke: options.cursorStroke,
        top: track.top
      });
    }
    const thumb = new Thumb(options.thumbWidth, options.thumbHeight, {
      cursor: 'pointer',
      top: track.bottom
    });

    // thumb touchArea
    if (options.thumbTouchAreaXDilation || options.thumbTouchAreaYDilation) {
      thumb.touchArea = thumb.localBounds.dilatedXY(options.thumbTouchAreaXDilation, options.thumbTouchAreaYDilation).shiftedY(options.thumbTouchAreaYDilation);
    }

    // thumb mouseArea
    if (options.thumbMouseAreaXDilation || options.thumbMouseAreaYDilation) {
      thumb.mouseArea = thumb.localBounds.dilatedXY(options.thumbMouseAreaXDilation, options.thumbMouseAreaYDilation).shiftedY(options.thumbMouseAreaYDilation);
    }

    // tweaker buttons for single-unit increments
    let plusButton = null;
    let minusButton = null;
    if (options.tweakersVisible) {
      plusButton = new ArrowButton('right', () => {
        // Increase the value, but keep it in range
        valueProperty.set(Math.min(options.maxValue, valueProperty.get() + options.tweakerValueDelta));
      }, {
        left: track.right + options.tweakersXSpacing,
        centerY: track.centerY,
        maxHeight: options.maxTweakersHeight,
        tandem: options.tandem.createTandem('plusButton')
      });
      minusButton = new ArrowButton('left', () => {
        // Decrease the value, but keep it in range
        valueProperty.set(Math.max(options.minValue, valueProperty.get() - options.tweakerValueDelta));
      }, {
        right: track.left - options.tweakersXSpacing,
        centerY: track.centerY,
        maxHeight: options.maxTweakersHeight,
        tandem: options.tandem.createTandem('minusButton')
      });

      // tweakers touchArea
      plusButton.touchArea = plusButton.localBounds.dilatedXY(options.tweakersTouchAreaXDilation, options.tweakersTouchAreaYDilation).shiftedX(options.tweakersTouchAreaXDilation);
      minusButton.touchArea = minusButton.localBounds.dilatedXY(options.tweakersTouchAreaXDilation, options.tweakersTouchAreaYDilation).shiftedX(-options.tweakersTouchAreaXDilation);

      // tweakers mouseArea
      plusButton.mouseArea = plusButton.localBounds.dilatedXY(options.tweakersMouseAreaXDilation, options.tweakersMouseAreaYDilation).shiftedX(options.tweakersMouseAreaXDilation);
      minusButton.mouseArea = minusButton.localBounds.dilatedXY(options.tweakersMouseAreaXDilation, options.tweakersMouseAreaYDilation).shiftedX(-options.tweakersMouseAreaXDilation);
    }

    // rendering order
    this.addChild(track);
    this.addChild(trackBorder);
    this.addChild(thumb);
    valueDisplay && this.addChild(valueDisplay);
    cursor && this.addChild(cursor);
    plusButton && this.addChild(plusButton);
    minusButton && this.addChild(minusButton);

    // transforms between position and value
    const positionToValue = x => Utils.clamp(Utils.linear(0, track.width, options.minValue, options.maxValue, x), options.minValue, options.maxValue);
    const valueToPosition = value => Utils.clamp(Utils.linear(options.minValue, options.maxValue, 0, track.width, value), 0, track.width);

    // click in the track to change the value, continue dragging if desired
    const handleTrackEvent = event => {
      const x = thumb.globalToParentPoint(event.pointer.point).x;
      const value = positionToValue(x);
      valueProperty.set(value);
    };
    track.addInputListener(new DragListener({
      allowTouchSnag: false,
      start: event => handleTrackEvent(event),
      drag: event => handleTrackEvent(event),
      tandem: options.tandem.createTandem('dragListener')
    }));

    // thumb drag handler
    let clickXOffset = 0; // x-offset between initial click and thumb's origin
    thumb.addInputListener(new DragListener({
      tandem: options.tandem.createTandem('thumbInputListener'),
      start: event => {
        clickXOffset = thumb.globalToParentPoint(event.pointer.point).x - thumb.x;
      },
      drag: event => {
        const x = thumb.globalToParentPoint(event.pointer.point).x - clickXOffset;
        const value = positionToValue(x);
        valueProperty.set(value);
      }
    }));

    // custom focus highlight that surrounds and moves with the thumb
    this.focusHighlight = new HighlightFromNode(thumb);

    // sync with model
    const updateUI = value => {
      // positions
      const x = valueToPosition(value);
      thumb.centerX = x;
      if (cursor) {
        cursor.centerX = x;
      }
      if (valueDisplay) {
        valueDisplay.centerX = x;
      }

      // thumb color
      thumb.fill = options.valueToColor(value);

      // tweaker buttons
      if (plusButton) {
        plusButton.enabled = value < options.maxValue;
      }
      if (minusButton) {
        minusButton.enabled = value > options.minValue;
      }
    };
    const valueListener = value => updateUI(value);
    valueProperty.link(valueListener);

    /*
     * The horizontal bounds of the value control changes as the slider knob is dragged.
     * To prevent this, we determine the extents of the control's bounds at min and max values,
     * then add an invisible horizontal strut.
     */
    // determine bounds at min and max values
    updateUI(options.minValue);
    const minX = this.left;
    updateUI(options.maxValue);
    const maxX = this.right;

    // restore the initial value
    updateUI(valueProperty.get());

    // add a horizontal strut
    const strut = new Rectangle(minX, 0, maxX - minX, 1, {
      pickable: false
    });
    this.addChild(strut);
    strut.moveToBack();
    this.disposeSpectrumSlider = () => {
      valueDisplay && valueDisplay.dispose();
      plusButton && plusButton.dispose();
      minusButton && minusButton.dispose();
      valueProperty.unlink(valueListener);
    };

    // We already set other options via super(). Now that we have valid Bounds, apply these options.
    this.mutate(boundsRequiredOptionKeys);

    // support for binder documentation, stripped out in builds and only runs when ?binder is specified
    assert && phet?.chipper?.queryParameters?.binder && InstanceRegistry.registerDataURL('scenery-phet', 'SpectrumSlider', this);
  }
  dispose() {
    this.disposeSpectrumSlider();
    super.dispose();
  }
}

/**
 * The slider thumb, origin at top center.
 */
class Thumb extends Path {
  constructor(width, height, providedOptions) {
    const options = combineOptions({
      fill: 'black',
      stroke: 'black',
      lineWidth: 1
    }, providedOptions);

    // Set the radius of the arcs based on the height or width, whichever is smaller.
    const radiusScale = 0.15;
    const radius = width < height ? radiusScale * width : radiusScale * height;

    // Calculate some parameters of the upper triangles of the thumb for getting arc offsets.
    const hypotenuse = Math.sqrt(Math.pow(0.5 * width, 2) + Math.pow(0.3 * height, 2));
    const angle = Math.acos(width * 0.5 / hypotenuse);
    const heightOffset = radius * Math.sin(angle);

    // Draw the thumb shape starting at the right upper corner of the pentagon below the arc,
    // this way we can get the arc coordinates for the arc in this corner from the other side,
    // which will be easier to calculate arcing from bottom to top.
    const shape = new Shape().moveTo(0.5 * width, 0.3 * height + heightOffset).lineTo(0.5 * width, height - radius).arc(0.5 * width - radius, height - radius, radius, 0, Math.PI / 2).lineTo(-0.5 * width + radius, height).arc(-0.5 * width + radius, height - radius, radius, Math.PI / 2, Math.PI).lineTo(-0.5 * width, 0.3 * height + heightOffset).arc(-0.5 * width + radius, 0.3 * height + heightOffset, radius, Math.PI, Math.PI + angle);

    // Save the coordinates for the point above the left side arc, for use on the other side.
    const sideArcPoint = shape.getLastPoint();
    assert && assert(sideArcPoint);
    shape.lineTo(0, 0).lineTo(-sideArcPoint.x, sideArcPoint.y).arc(0.5 * width - radius, 0.3 * height + heightOffset, radius, -angle, 0).close();
    super(shape, options);
  }
}

/**
 * Displays the value and units.
 */
class ValueDisplay extends Text {
  /**
   * @param valueProperty
   * @param valueToString - converts value {number} to text {string} for display
   * @param providedOptions
   */
  constructor(valueProperty, valueToString, providedOptions) {
    super('?', providedOptions);
    const valueObserver = value => {
      this.string = valueToString(value);
    };
    valueProperty.link(valueObserver);
    this.disposeValueDisplay = () => valueProperty.unlink(valueObserver);
  }
  dispose() {
    this.disposeValueDisplay();
    super.dispose();
  }
}

/**
 * Rectangular 'cursor' that appears in the track directly above the thumb. Origin is at top center.
 */
class Cursor extends Rectangle {
  constructor(width, height, providedOptions) {
    super(-width / 2, 0, width, height, providedOptions);
  }
}
sceneryPhet.register('SpectrumSlider', SpectrumSlider);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQcm9wZXJ0eSIsIkRpbWVuc2lvbjIiLCJSYW5nZSIsIlV0aWxzIiwiU2hhcGUiLCJkZXByZWNhdGlvbldhcm5pbmciLCJJbnN0YW5jZVJlZ2lzdHJ5Iiwib3B0aW9uaXplIiwiY29tYmluZU9wdGlvbnMiLCJDb2xvciIsIkRyYWdMaXN0ZW5lciIsIkhpZ2hsaWdodEZyb21Ob2RlIiwiTm9kZSIsIlBhdGgiLCJSZWN0YW5nbGUiLCJUZXh0IiwiQWNjZXNzaWJsZVNsaWRlciIsIkFycm93QnV0dG9uIiwiVGFuZGVtIiwiUGhldEZvbnQiLCJzY2VuZXJ5UGhldCIsIlNwZWN0cnVtTm9kZSIsIkRFRkFVTFRfTUlOX1ZBTFVFIiwiREVGQVVMVF9NQVhfVkFMVUUiLCJTcGVjdHJ1bVNsaWRlciIsImNvbnN0cnVjdG9yIiwidmFsdWVQcm9wZXJ0eSIsInByb3ZpZGVkT3B0aW9ucyIsImFzc2VydCIsImVuYWJsZWRSYW5nZU1pbiIsIm1pblZhbHVlIiwiZW5hYmxlZFJhbmdlTWF4IiwibWF4VmFsdWUiLCJlbmFibGVkUmFuZ2VQcm9wZXJ0eSIsIm9wdGlvbnMiLCJ2YWx1ZVRvU3RyaW5nIiwidmFsdWUiLCJ2YWx1ZVRvQ29sb3IiLCJ0cmFja1dpZHRoIiwidHJhY2tIZWlnaHQiLCJ0cmFja09wYWNpdHkiLCJ0cmFja0JvcmRlclN0cm9rZSIsInRodW1iV2lkdGgiLCJ0aHVtYkhlaWdodCIsInRodW1iVG91Y2hBcmVhWERpbGF0aW9uIiwidGh1bWJUb3VjaEFyZWFZRGlsYXRpb24iLCJ0aHVtYk1vdXNlQXJlYVhEaWxhdGlvbiIsInRodW1iTW91c2VBcmVhWURpbGF0aW9uIiwidmFsdWVGb250IiwidmFsdWVGaWxsIiwidmFsdWVWaXNpYmxlIiwidmFsdWVZU3BhY2luZyIsInR3ZWFrZXJzVmlzaWJsZSIsInR3ZWFrZXJWYWx1ZURlbHRhIiwidHdlYWtlcnNYU3BhY2luZyIsIm1heFR3ZWFrZXJzSGVpZ2h0IiwidHdlYWtlcnNUb3VjaEFyZWFYRGlsYXRpb24iLCJ0d2Vha2Vyc1RvdWNoQXJlYVlEaWxhdGlvbiIsInR3ZWFrZXJzTW91c2VBcmVhWERpbGF0aW9uIiwidHdlYWtlcnNNb3VzZUFyZWFZRGlsYXRpb24iLCJjdXJzb3JWaXNpYmxlIiwiY3Vyc29yU3Ryb2tlIiwidGFuZGVtIiwiUkVRVUlSRUQiLCJ0YW5kZW1OYW1lU3VmZml4IiwiYm91bmRzUmVxdWlyZWRPcHRpb25LZXlzIiwiXyIsInBpY2siLCJSRVFVSVJFU19CT1VORFNfT1BUSU9OX0tFWVMiLCJvbWl0IiwidHJhY2siLCJzaXplIiwib3BhY2l0eSIsImN1cnNvciIsInRyYWNrQm9yZGVyIiwid2lkdGgiLCJoZWlnaHQiLCJzdHJva2UiLCJsaW5lV2lkdGgiLCJwaWNrYWJsZSIsInZhbHVlRGlzcGxheSIsIlZhbHVlRGlzcGxheSIsImZvbnQiLCJmaWxsIiwiYm90dG9tIiwidG9wIiwiQ3Vyc29yIiwidGh1bWIiLCJUaHVtYiIsInRvdWNoQXJlYSIsImxvY2FsQm91bmRzIiwiZGlsYXRlZFhZIiwic2hpZnRlZFkiLCJtb3VzZUFyZWEiLCJwbHVzQnV0dG9uIiwibWludXNCdXR0b24iLCJzZXQiLCJNYXRoIiwibWluIiwiZ2V0IiwibGVmdCIsInJpZ2h0IiwiY2VudGVyWSIsIm1heEhlaWdodCIsImNyZWF0ZVRhbmRlbSIsIm1heCIsInNoaWZ0ZWRYIiwiYWRkQ2hpbGQiLCJwb3NpdGlvblRvVmFsdWUiLCJ4IiwiY2xhbXAiLCJsaW5lYXIiLCJ2YWx1ZVRvUG9zaXRpb24iLCJoYW5kbGVUcmFja0V2ZW50IiwiZXZlbnQiLCJnbG9iYWxUb1BhcmVudFBvaW50IiwicG9pbnRlciIsInBvaW50IiwiYWRkSW5wdXRMaXN0ZW5lciIsImFsbG93VG91Y2hTbmFnIiwic3RhcnQiLCJkcmFnIiwiY2xpY2tYT2Zmc2V0IiwiZm9jdXNIaWdobGlnaHQiLCJ1cGRhdGVVSSIsImNlbnRlclgiLCJlbmFibGVkIiwidmFsdWVMaXN0ZW5lciIsImxpbmsiLCJtaW5YIiwibWF4WCIsInN0cnV0IiwibW92ZVRvQmFjayIsImRpc3Bvc2VTcGVjdHJ1bVNsaWRlciIsImRpc3Bvc2UiLCJ1bmxpbmsiLCJtdXRhdGUiLCJwaGV0IiwiY2hpcHBlciIsInF1ZXJ5UGFyYW1ldGVycyIsImJpbmRlciIsInJlZ2lzdGVyRGF0YVVSTCIsInJhZGl1c1NjYWxlIiwicmFkaXVzIiwiaHlwb3RlbnVzZSIsInNxcnQiLCJwb3ciLCJhbmdsZSIsImFjb3MiLCJoZWlnaHRPZmZzZXQiLCJzaW4iLCJzaGFwZSIsIm1vdmVUbyIsImxpbmVUbyIsImFyYyIsIlBJIiwic2lkZUFyY1BvaW50IiwiZ2V0TGFzdFBvaW50IiwieSIsImNsb3NlIiwidmFsdWVPYnNlcnZlciIsInN0cmluZyIsImRpc3Bvc2VWYWx1ZURpc3BsYXkiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlNwZWN0cnVtU2xpZGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFNwZWN0cnVtU2xpZGVyIGlzIGEgc2xpZGVyLWxpa2UgY29udHJvbCB1c2VkIGZvciBjaG9vc2luZyBhIHZhbHVlIHRoYXQgY29ycmVzcG9uZHMgdG8gYSBkaXNwbGF5ZWQgY29sb3IuXHJcbiAqIEl0IGlzIHRoZSBiYXNlIGNsYXNzIGZvciBXYXZlbGVuZ3RoU2xpZGVyLlxyXG4gKlxyXG4gKiBAYXV0aG9yIENocmlzIE1hbGxleSAoUGl4ZWxab29tLCBJbmMuKVxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBUUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9UUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgU3RyaWN0T21pdCBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvU3RyaWN0T21pdC5qcyc7XHJcbmltcG9ydCBUUmVhZE9ubHlQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IFByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgRGltZW5zaW9uMiBmcm9tICcuLi8uLi9kb3QvanMvRGltZW5zaW9uMi5qcyc7XHJcbmltcG9ydCBSYW5nZSBmcm9tICcuLi8uLi9kb3QvanMvUmFuZ2UuanMnO1xyXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vZG90L2pzL1V0aWxzLmpzJztcclxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tICcuLi8uLi9raXRlL2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgZGVwcmVjYXRpb25XYXJuaW5nIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9kZXByZWNhdGlvbldhcm5pbmcuanMnO1xyXG5pbXBvcnQgSW5zdGFuY2VSZWdpc3RyeSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvZG9jdW1lbnRhdGlvbi9JbnN0YW5jZVJlZ2lzdHJ5LmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBjb21iaW5lT3B0aW9ucyB9IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgeyBDb2xvciwgRHJhZ0xpc3RlbmVyLCBIaWdobGlnaHRGcm9tTm9kZSwgRm9udCwgVENvbG9yLCBOb2RlLCBOb2RlT3B0aW9ucywgUGF0aCwgUGF0aE9wdGlvbnMsIFJlY3RhbmdsZSwgUmVjdGFuZ2xlT3B0aW9ucywgU2NlbmVyeUV2ZW50LCBUZXh0LCBUZXh0T3B0aW9ucyB9IGZyb20gJy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBBY2Nlc3NpYmxlU2xpZGVyLCB7IEFjY2Vzc2libGVTbGlkZXJPcHRpb25zIH0gZnJvbSAnLi4vLi4vc3VuL2pzL2FjY2Vzc2liaWxpdHkvQWNjZXNzaWJsZVNsaWRlci5qcyc7XHJcbmltcG9ydCBBcnJvd0J1dHRvbiBmcm9tICcuLi8uLi9zdW4vanMvYnV0dG9ucy9BcnJvd0J1dHRvbi5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcbmltcG9ydCBQaGV0Rm9udCBmcm9tICcuL1BoZXRGb250LmpzJztcclxuaW1wb3J0IHNjZW5lcnlQaGV0IGZyb20gJy4vc2NlbmVyeVBoZXQuanMnO1xyXG5pbXBvcnQgU3BlY3RydW1Ob2RlIGZyb20gJy4vU3BlY3RydW1Ob2RlLmpzJztcclxuXHJcbmNvbnN0IERFRkFVTFRfTUlOX1ZBTFVFID0gMDtcclxuY29uc3QgREVGQVVMVF9NQVhfVkFMVUUgPSAxO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuXHJcbiAgLy8gVGhlIG1pbmltdW0gdmFsdWUgdG8gYmUgZGlzcGxheWVkXHJcbiAgbWluVmFsdWU/OiBudW1iZXI7XHJcblxyXG4gIC8vIFRoZSBtYXhpbXVtIHZhbHVlIHRvIGJlIGRpc3BsYXllZFxyXG4gIG1heFZhbHVlPzogbnVtYmVyO1xyXG5cclxuICAvLyBNYXBzIHZhbHVlIHRvIHN0cmluZyB0aGF0IGlzIG9wdGlvbmFsbHkgZGlzcGxheWVkIGJ5IHRoZSBzbGlkZXJcclxuICB2YWx1ZVRvU3RyaW5nPzogKCB2YWx1ZTogbnVtYmVyICkgPT4gc3RyaW5nO1xyXG5cclxuICAvLyBNYXBzIHZhbHVlIHRvIENvbG9yIHRoYXQgaXMgcmVuZGVyZWQgaW4gdGhlIHNwZWN0cnVtIGFuZCBpbiB0aGUgdGh1bWJcclxuICB2YWx1ZVRvQ29sb3I/OiAoIHZhbHVlOiBudW1iZXIgKSA9PiBDb2xvcjtcclxuXHJcbiAgLy8gdHJhY2sgcHJvcGVydGllc1xyXG4gIHRyYWNrV2lkdGg/OiBudW1iZXI7XHJcbiAgdHJhY2tIZWlnaHQ/OiBudW1iZXI7XHJcbiAgdHJhY2tPcGFjaXR5PzogbnVtYmVyOyAvLyBbMCwxXVxyXG4gIHRyYWNrQm9yZGVyU3Ryb2tlPzogVENvbG9yO1xyXG5cclxuICAvLyB0aHVtYlxyXG4gIHRodW1iV2lkdGg/OiBudW1iZXI7XHJcbiAgdGh1bWJIZWlnaHQ/OiBudW1iZXI7XHJcbiAgdGh1bWJUb3VjaEFyZWFYRGlsYXRpb24/OiBudW1iZXI7XHJcbiAgdGh1bWJUb3VjaEFyZWFZRGlsYXRpb24/OiBudW1iZXI7XHJcbiAgdGh1bWJNb3VzZUFyZWFYRGlsYXRpb24/OiBudW1iZXI7XHJcbiAgdGh1bWJNb3VzZUFyZWFZRGlsYXRpb24/OiBudW1iZXI7XHJcblxyXG4gIC8vIHZhbHVlXHJcbiAgdmFsdWVGb250PzogRm9udDtcclxuICB2YWx1ZUZpbGw/OiBUQ29sb3I7XHJcbiAgdmFsdWVWaXNpYmxlPzogYm9vbGVhbjtcclxuICB2YWx1ZVlTcGFjaW5nPzogbnVtYmVyOyAvLyBzcGFjZSBiZXR3ZWVuIHZhbHVlIGFuZCB0b3Agb2YgdHJhY2tcclxuXHJcbiAgLy8gdHdlYWtlcnNcclxuICB0d2Vha2Vyc1Zpc2libGU/OiBib29sZWFuO1xyXG4gIHR3ZWFrZXJWYWx1ZURlbHRhPzogbnVtYmVyOyAvLyB0aGUgYW1vdW50IHRoYXQgdmFsdWUgY2hhbmdlcyB3aGVuIGEgdHdlYWtlciBidXR0b24gaXMgcHJlc3NlZFxyXG4gIHR3ZWFrZXJzWFNwYWNpbmc/OiBudW1iZXI7IC8vIHNwYWNlIGJldHdlZW4gdHdlYWtlcnMgYW5kIHRyYWNrXHJcbiAgbWF4VHdlYWtlcnNIZWlnaHQ/OiBudW1iZXI7XHJcbiAgdHdlYWtlcnNUb3VjaEFyZWFYRGlsYXRpb24/OiBudW1iZXI7XHJcbiAgdHdlYWtlcnNUb3VjaEFyZWFZRGlsYXRpb24/OiBudW1iZXI7XHJcbiAgdHdlYWtlcnNNb3VzZUFyZWFYRGlsYXRpb24/OiBudW1iZXI7XHJcbiAgdHdlYWtlcnNNb3VzZUFyZWFZRGlsYXRpb24/OiBudW1iZXI7XHJcblxyXG4gIC8vIGN1cnNvciwgdGhlIHJlY3RhbmdsZSB0aGFuIGZvbGxvd3MgdGhlIHRodW1iIGluIHRoZSB0cmFja1xyXG4gIGN1cnNvclZpc2libGU/OiBib29sZWFuO1xyXG4gIGN1cnNvclN0cm9rZT86IFRDb2xvcjtcclxufTtcclxudHlwZSBQYXJlbnRPcHRpb25zID0gQWNjZXNzaWJsZVNsaWRlck9wdGlvbnMgJiBOb2RlT3B0aW9ucztcclxuZXhwb3J0IHR5cGUgU3BlY3RydW1TbGlkZXJPcHRpb25zID0gU2VsZk9wdGlvbnMgJiBTdHJpY3RPbWl0PFBhcmVudE9wdGlvbnMsICd2YWx1ZVByb3BlcnR5JyB8ICdlbmFibGVkUmFuZ2VQcm9wZXJ0eSc+O1xyXG5cclxuLyoqXHJcbiAqIEBkZXByZWNhdGVkIHVzZSBXYXZlbGVuZ3RoTnVtYmVyQ29udHJvbCwgb3IgU2xpZGVyLmpzIHdpdGggU3BlY3RydW1TbGlkZXJUcmFjayBhbmQgU3BlY3RydW1TbGlkZXJUcmFjayxcclxuICogICBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnktcGhldC9pc3N1ZXMvNzI5XHJcbiAqL1xyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTcGVjdHJ1bVNsaWRlciBleHRlbmRzIEFjY2Vzc2libGVTbGlkZXIoIE5vZGUsIDAgKSB7XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzcG9zZVNwZWN0cnVtU2xpZGVyOiAoKSA9PiB2b2lkO1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gdmFsdWVQcm9wZXJ0eVxyXG4gICAqIEBwYXJhbSBwcm92aWRlZE9wdGlvbnNcclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHZhbHVlUHJvcGVydHk6IFRQcm9wZXJ0eTxudW1iZXI+LCBwcm92aWRlZE9wdGlvbnM/OiBTcGVjdHJ1bVNsaWRlck9wdGlvbnMgKSB7XHJcbiAgICBhc3NlcnQgJiYgZGVwcmVjYXRpb25XYXJuaW5nKCAnU3BlY3RydW1TbGlkZXIgaXMgZGVwcmVjYXRlZCwgcGxlYXNlIHVzZSBTbGlkZXIgd2l0aCBTcGVjdHJ1bVNsaWRlVHJhY2svVGh1bWIgaW5zdGVhZCcgKTtcclxuXHJcbiAgICBjb25zdCBlbmFibGVkUmFuZ2VNaW4gPSBwcm92aWRlZE9wdGlvbnM/Lm1pblZhbHVlID8/IERFRkFVTFRfTUlOX1ZBTFVFO1xyXG4gICAgY29uc3QgZW5hYmxlZFJhbmdlTWF4ID0gcHJvdmlkZWRPcHRpb25zPy5tYXhWYWx1ZSA/PyBERUZBVUxUX01BWF9WQUxVRTtcclxuICAgIGNvbnN0IGVuYWJsZWRSYW5nZVByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCBuZXcgUmFuZ2UoIGVuYWJsZWRSYW5nZU1pbiwgZW5hYmxlZFJhbmdlTWF4ICkgKTtcclxuXHJcbiAgICAvLyBvcHRpb25zIHRoYXQgYXJlIHNwZWNpZmljIHRvIHRoaXMgdHlwZVxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxTcGVjdHJ1bVNsaWRlck9wdGlvbnMsIFNlbGZPcHRpb25zLCBQYXJlbnRPcHRpb25zPigpKCB7XHJcblxyXG4gICAgICAvLyBTZWxmT3B0aW9uc1xyXG4gICAgICBtaW5WYWx1ZTogREVGQVVMVF9NSU5fVkFMVUUsXHJcbiAgICAgIG1heFZhbHVlOiBERUZBVUxUX01BWF9WQUxVRSxcclxuICAgICAgdmFsdWVUb1N0cmluZzogKCB2YWx1ZTogbnVtYmVyICkgPT4gYCR7dmFsdWV9YCxcclxuICAgICAgdmFsdWVUb0NvbG9yOiAoIHZhbHVlOiBudW1iZXIgKSA9PiBuZXcgQ29sb3IoIDAsIDAsIDI1NSAqIHZhbHVlICksXHJcblxyXG4gICAgICAvLyB0cmFja1xyXG4gICAgICB0cmFja1dpZHRoOiAxNTAsXHJcbiAgICAgIHRyYWNrSGVpZ2h0OiAzMCxcclxuICAgICAgdHJhY2tPcGFjaXR5OiAxLFxyXG4gICAgICB0cmFja0JvcmRlclN0cm9rZTogJ2JsYWNrJyxcclxuXHJcbiAgICAgIC8vIHRodW1iXHJcbiAgICAgIHRodW1iV2lkdGg6IDM1LFxyXG4gICAgICB0aHVtYkhlaWdodDogNDUsXHJcbiAgICAgIHRodW1iVG91Y2hBcmVhWERpbGF0aW9uOiAxMixcclxuICAgICAgdGh1bWJUb3VjaEFyZWFZRGlsYXRpb246IDEwLFxyXG4gICAgICB0aHVtYk1vdXNlQXJlYVhEaWxhdGlvbjogMCxcclxuICAgICAgdGh1bWJNb3VzZUFyZWFZRGlsYXRpb246IDAsXHJcblxyXG4gICAgICAvLyB2YWx1ZVxyXG4gICAgICB2YWx1ZUZvbnQ6IG5ldyBQaGV0Rm9udCggMjAgKSxcclxuICAgICAgdmFsdWVGaWxsOiAnYmxhY2snLFxyXG4gICAgICB2YWx1ZVZpc2libGU6IHRydWUsXHJcbiAgICAgIHZhbHVlWVNwYWNpbmc6IDIsIC8vIHtudW1iZXJ9IHNwYWNlIGJldHdlZW4gdmFsdWUgYW5kIHRvcCBvZiB0cmFja1xyXG5cclxuICAgICAgLy8gdHdlYWtlcnNcclxuICAgICAgdHdlYWtlcnNWaXNpYmxlOiB0cnVlLFxyXG4gICAgICB0d2Vha2VyVmFsdWVEZWx0YTogMSwgLy8ge251bWJlcn0gdGhlIGFtb3VudCB0aGF0IHZhbHVlIGNoYW5nZXMgd2hlbiBhIHR3ZWFrZXIgYnV0dG9uIGlzIHByZXNzZWRcclxuICAgICAgdHdlYWtlcnNYU3BhY2luZzogOCwgLy8ge251bWJlcn0gc3BhY2UgYmV0d2VlbiB0d2Vha2VycyBhbmQgdHJhY2tcclxuICAgICAgbWF4VHdlYWtlcnNIZWlnaHQ6IDMwLFxyXG4gICAgICB0d2Vha2Vyc1RvdWNoQXJlYVhEaWxhdGlvbjogNyxcclxuICAgICAgdHdlYWtlcnNUb3VjaEFyZWFZRGlsYXRpb246IDcsXHJcbiAgICAgIHR3ZWFrZXJzTW91c2VBcmVhWERpbGF0aW9uOiAwLFxyXG4gICAgICB0d2Vha2Vyc01vdXNlQXJlYVlEaWxhdGlvbjogMCxcclxuXHJcbiAgICAgIC8vIGN1cnNvciwgdGhlIHJlY3RhbmdsZSB0aGFuIGZvbGxvd3MgdGhlIHRodW1iIGluIHRoZSB0cmFja1xyXG4gICAgICBjdXJzb3JWaXNpYmxlOiB0cnVlLFxyXG4gICAgICBjdXJzb3JTdHJva2U6ICdibGFjaycsXHJcblxyXG4gICAgICAvLyBQYXJlbnRPcHRpb25zXHJcbiAgICAgIHZhbHVlUHJvcGVydHk6IHZhbHVlUHJvcGVydHksXHJcbiAgICAgIGVuYWJsZWRSYW5nZVByb3BlcnR5OiBlbmFibGVkUmFuZ2VQcm9wZXJ0eSxcclxuICAgICAgdGFuZGVtOiBUYW5kZW0uUkVRVUlSRUQsXHJcbiAgICAgIHRhbmRlbU5hbWVTdWZmaXg6ICdTbGlkZXInXHJcblxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgLy8gdmFsaWRhdGUgdmFsdWVzXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLm1pblZhbHVlIDwgb3B0aW9ucy5tYXhWYWx1ZSApO1xyXG5cclxuICAgIC8vIFRoZXNlIG9wdGlvbnMgcmVxdWlyZSB2YWxpZCBCb3VuZHMsIGFuZCB3aWxsIGJlIGFwcGxpZWQgbGF0ZXIgdmlhIG11dGF0ZS5cclxuICAgIGNvbnN0IGJvdW5kc1JlcXVpcmVkT3B0aW9uS2V5cyA9IF8ucGljayggb3B0aW9ucywgTm9kZS5SRVFVSVJFU19CT1VORFNfT1BUSU9OX0tFWVMgKTtcclxuXHJcbiAgICBzdXBlciggXy5vbWl0KCBvcHRpb25zLCBOb2RlLlJFUVVJUkVTX0JPVU5EU19PUFRJT05fS0VZUyApICk7XHJcblxyXG4gICAgY29uc3QgdHJhY2sgPSBuZXcgU3BlY3RydW1Ob2RlKCB7XHJcbiAgICAgIHZhbHVlVG9Db2xvcjogb3B0aW9ucy52YWx1ZVRvQ29sb3IsXHJcbiAgICAgIHNpemU6IG5ldyBEaW1lbnNpb24yKCBvcHRpb25zLnRyYWNrV2lkdGgsIG9wdGlvbnMudHJhY2tIZWlnaHQgKSxcclxuICAgICAgbWluVmFsdWU6IG9wdGlvbnMubWluVmFsdWUsXHJcbiAgICAgIG1heFZhbHVlOiBvcHRpb25zLm1heFZhbHVlLFxyXG4gICAgICBvcGFjaXR5OiBvcHRpb25zLnRyYWNrT3BhY2l0eSxcclxuICAgICAgY3Vyc29yOiAncG9pbnRlcidcclxuICAgIH0gKTtcclxuXHJcbiAgICAvKlxyXG4gICAgICogUHV0IGEgYm9yZGVyIGFyb3VuZCB0aGUgdHJhY2suXHJcbiAgICAgKiBXZSBkb24ndCBzdHJva2UgdGhlIHRyYWNrIGl0c2VsZiBiZWNhdXNlIHN0cm9raW5nIHRoZSB0cmFjayB3aWxsIGFmZmVjdCBpdHMgYm91bmRzLFxyXG4gICAgICogYW5kIHdpbGwgdGh1cyBhZmZlY3QgdGhlIGRyYWcgaGFuZGxlIGJlaGF2aW9yLlxyXG4gICAgICogSGF2aW5nIGEgc2VwYXJhdGUgYm9yZGVyIGFsc28gZ2l2ZXMgc3ViY2xhc3NlcyBhIHBsYWNlIHRvIGFkZCBtYXJraW5ncyAoZWcsIHRpY2sgbWFya3MpXHJcbiAgICAgKiB3aXRob3V0IGFmZmVjdGluZyB0aGUgdHJhY2sncyBib3VuZHMuXHJcbiAgICAgKi9cclxuICAgIGNvbnN0IHRyYWNrQm9yZGVyID0gbmV3IFJlY3RhbmdsZSggMCwgMCwgdHJhY2sud2lkdGgsIHRyYWNrLmhlaWdodCwge1xyXG4gICAgICBzdHJva2U6IG9wdGlvbnMudHJhY2tCb3JkZXJTdHJva2UsXHJcbiAgICAgIGxpbmVXaWR0aDogMSxcclxuICAgICAgcGlja2FibGU6IGZhbHNlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgbGV0IHZhbHVlRGlzcGxheTogTm9kZSB8IG51bGwgPSBudWxsO1xyXG4gICAgaWYgKCBvcHRpb25zLnZhbHVlVmlzaWJsZSApIHtcclxuICAgICAgdmFsdWVEaXNwbGF5ID0gbmV3IFZhbHVlRGlzcGxheSggdmFsdWVQcm9wZXJ0eSwgb3B0aW9ucy52YWx1ZVRvU3RyaW5nLCB7XHJcbiAgICAgICAgZm9udDogb3B0aW9ucy52YWx1ZUZvbnQsXHJcbiAgICAgICAgZmlsbDogb3B0aW9ucy52YWx1ZUZpbGwsXHJcbiAgICAgICAgYm90dG9tOiB0cmFjay50b3AgLSBvcHRpb25zLnZhbHVlWVNwYWNpbmdcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBjdXJzb3I6IEN1cnNvciB8IG51bGwgPSBudWxsO1xyXG4gICAgaWYgKCBvcHRpb25zLmN1cnNvclZpc2libGUgKSB7XHJcbiAgICAgIGN1cnNvciA9IG5ldyBDdXJzb3IoIDMsIHRyYWNrLmhlaWdodCwge1xyXG4gICAgICAgIHN0cm9rZTogb3B0aW9ucy5jdXJzb3JTdHJva2UsXHJcbiAgICAgICAgdG9wOiB0cmFjay50b3BcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRodW1iID0gbmV3IFRodW1iKCBvcHRpb25zLnRodW1iV2lkdGgsIG9wdGlvbnMudGh1bWJIZWlnaHQsIHtcclxuICAgICAgY3Vyc29yOiAncG9pbnRlcicsXHJcbiAgICAgIHRvcDogdHJhY2suYm90dG9tXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gdGh1bWIgdG91Y2hBcmVhXHJcbiAgICBpZiAoIG9wdGlvbnMudGh1bWJUb3VjaEFyZWFYRGlsYXRpb24gfHwgb3B0aW9ucy50aHVtYlRvdWNoQXJlYVlEaWxhdGlvbiApIHtcclxuICAgICAgdGh1bWIudG91Y2hBcmVhID0gdGh1bWIubG9jYWxCb3VuZHNcclxuICAgICAgICAuZGlsYXRlZFhZKCBvcHRpb25zLnRodW1iVG91Y2hBcmVhWERpbGF0aW9uLCBvcHRpb25zLnRodW1iVG91Y2hBcmVhWURpbGF0aW9uIClcclxuICAgICAgICAuc2hpZnRlZFkoIG9wdGlvbnMudGh1bWJUb3VjaEFyZWFZRGlsYXRpb24gKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyB0aHVtYiBtb3VzZUFyZWFcclxuICAgIGlmICggb3B0aW9ucy50aHVtYk1vdXNlQXJlYVhEaWxhdGlvbiB8fCBvcHRpb25zLnRodW1iTW91c2VBcmVhWURpbGF0aW9uICkge1xyXG4gICAgICB0aHVtYi5tb3VzZUFyZWEgPSB0aHVtYi5sb2NhbEJvdW5kc1xyXG4gICAgICAgIC5kaWxhdGVkWFkoIG9wdGlvbnMudGh1bWJNb3VzZUFyZWFYRGlsYXRpb24sIG9wdGlvbnMudGh1bWJNb3VzZUFyZWFZRGlsYXRpb24gKVxyXG4gICAgICAgIC5zaGlmdGVkWSggb3B0aW9ucy50aHVtYk1vdXNlQXJlYVlEaWxhdGlvbiApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHR3ZWFrZXIgYnV0dG9ucyBmb3Igc2luZ2xlLXVuaXQgaW5jcmVtZW50c1xyXG4gICAgbGV0IHBsdXNCdXR0b246IE5vZGUgfCBudWxsID0gbnVsbDtcclxuICAgIGxldCBtaW51c0J1dHRvbjogTm9kZSB8IG51bGwgPSBudWxsO1xyXG4gICAgaWYgKCBvcHRpb25zLnR3ZWFrZXJzVmlzaWJsZSApIHtcclxuXHJcbiAgICAgIHBsdXNCdXR0b24gPSBuZXcgQXJyb3dCdXR0b24oICdyaWdodCcsICggKCkgPT4ge1xyXG5cclxuICAgICAgICAvLyBJbmNyZWFzZSB0aGUgdmFsdWUsIGJ1dCBrZWVwIGl0IGluIHJhbmdlXHJcbiAgICAgICAgdmFsdWVQcm9wZXJ0eS5zZXQoIE1hdGgubWluKCBvcHRpb25zLm1heFZhbHVlLCB2YWx1ZVByb3BlcnR5LmdldCgpICsgb3B0aW9ucy50d2Vha2VyVmFsdWVEZWx0YSApICk7XHJcbiAgICAgIH0gKSwge1xyXG4gICAgICAgIGxlZnQ6IHRyYWNrLnJpZ2h0ICsgb3B0aW9ucy50d2Vha2Vyc1hTcGFjaW5nLFxyXG4gICAgICAgIGNlbnRlclk6IHRyYWNrLmNlbnRlclksXHJcbiAgICAgICAgbWF4SGVpZ2h0OiBvcHRpb25zLm1heFR3ZWFrZXJzSGVpZ2h0LFxyXG4gICAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAncGx1c0J1dHRvbicgKVxyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICBtaW51c0J1dHRvbiA9IG5ldyBBcnJvd0J1dHRvbiggJ2xlZnQnLCAoICgpID0+IHtcclxuXHJcbiAgICAgICAgLy8gRGVjcmVhc2UgdGhlIHZhbHVlLCBidXQga2VlcCBpdCBpbiByYW5nZVxyXG4gICAgICAgIHZhbHVlUHJvcGVydHkuc2V0KCBNYXRoLm1heCggb3B0aW9ucy5taW5WYWx1ZSwgdmFsdWVQcm9wZXJ0eS5nZXQoKSAtIG9wdGlvbnMudHdlYWtlclZhbHVlRGVsdGEgKSApO1xyXG4gICAgICB9ICksIHtcclxuICAgICAgICByaWdodDogdHJhY2subGVmdCAtIG9wdGlvbnMudHdlYWtlcnNYU3BhY2luZyxcclxuICAgICAgICBjZW50ZXJZOiB0cmFjay5jZW50ZXJZLFxyXG4gICAgICAgIG1heEhlaWdodDogb3B0aW9ucy5tYXhUd2Vha2Vyc0hlaWdodCxcclxuICAgICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ21pbnVzQnV0dG9uJyApXHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIC8vIHR3ZWFrZXJzIHRvdWNoQXJlYVxyXG4gICAgICBwbHVzQnV0dG9uLnRvdWNoQXJlYSA9IHBsdXNCdXR0b24ubG9jYWxCb3VuZHNcclxuICAgICAgICAuZGlsYXRlZFhZKCBvcHRpb25zLnR3ZWFrZXJzVG91Y2hBcmVhWERpbGF0aW9uLCBvcHRpb25zLnR3ZWFrZXJzVG91Y2hBcmVhWURpbGF0aW9uIClcclxuICAgICAgICAuc2hpZnRlZFgoIG9wdGlvbnMudHdlYWtlcnNUb3VjaEFyZWFYRGlsYXRpb24gKTtcclxuICAgICAgbWludXNCdXR0b24udG91Y2hBcmVhID0gbWludXNCdXR0b24ubG9jYWxCb3VuZHNcclxuICAgICAgICAuZGlsYXRlZFhZKCBvcHRpb25zLnR3ZWFrZXJzVG91Y2hBcmVhWERpbGF0aW9uLCBvcHRpb25zLnR3ZWFrZXJzVG91Y2hBcmVhWURpbGF0aW9uIClcclxuICAgICAgICAuc2hpZnRlZFgoIC1vcHRpb25zLnR3ZWFrZXJzVG91Y2hBcmVhWERpbGF0aW9uICk7XHJcblxyXG4gICAgICAvLyB0d2Vha2VycyBtb3VzZUFyZWFcclxuICAgICAgcGx1c0J1dHRvbi5tb3VzZUFyZWEgPSBwbHVzQnV0dG9uLmxvY2FsQm91bmRzXHJcbiAgICAgICAgLmRpbGF0ZWRYWSggb3B0aW9ucy50d2Vha2Vyc01vdXNlQXJlYVhEaWxhdGlvbiwgb3B0aW9ucy50d2Vha2Vyc01vdXNlQXJlYVlEaWxhdGlvbiApXHJcbiAgICAgICAgLnNoaWZ0ZWRYKCBvcHRpb25zLnR3ZWFrZXJzTW91c2VBcmVhWERpbGF0aW9uICk7XHJcbiAgICAgIG1pbnVzQnV0dG9uLm1vdXNlQXJlYSA9IG1pbnVzQnV0dG9uLmxvY2FsQm91bmRzXHJcbiAgICAgICAgLmRpbGF0ZWRYWSggb3B0aW9ucy50d2Vha2Vyc01vdXNlQXJlYVhEaWxhdGlvbiwgb3B0aW9ucy50d2Vha2Vyc01vdXNlQXJlYVlEaWxhdGlvbiApXHJcbiAgICAgICAgLnNoaWZ0ZWRYKCAtb3B0aW9ucy50d2Vha2Vyc01vdXNlQXJlYVhEaWxhdGlvbiApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHJlbmRlcmluZyBvcmRlclxyXG4gICAgdGhpcy5hZGRDaGlsZCggdHJhY2sgKTtcclxuICAgIHRoaXMuYWRkQ2hpbGQoIHRyYWNrQm9yZGVyICk7XHJcbiAgICB0aGlzLmFkZENoaWxkKCB0aHVtYiApO1xyXG4gICAgdmFsdWVEaXNwbGF5ICYmIHRoaXMuYWRkQ2hpbGQoIHZhbHVlRGlzcGxheSApO1xyXG4gICAgY3Vyc29yICYmIHRoaXMuYWRkQ2hpbGQoIGN1cnNvciApO1xyXG4gICAgcGx1c0J1dHRvbiAmJiB0aGlzLmFkZENoaWxkKCBwbHVzQnV0dG9uICk7XHJcbiAgICBtaW51c0J1dHRvbiAmJiB0aGlzLmFkZENoaWxkKCBtaW51c0J1dHRvbiApO1xyXG5cclxuICAgIC8vIHRyYW5zZm9ybXMgYmV0d2VlbiBwb3NpdGlvbiBhbmQgdmFsdWVcclxuICAgIGNvbnN0IHBvc2l0aW9uVG9WYWx1ZSA9ICggeDogbnVtYmVyICkgPT5cclxuICAgICAgVXRpbHMuY2xhbXAoIFV0aWxzLmxpbmVhciggMCwgdHJhY2sud2lkdGgsIG9wdGlvbnMubWluVmFsdWUsIG9wdGlvbnMubWF4VmFsdWUsIHggKSwgb3B0aW9ucy5taW5WYWx1ZSwgb3B0aW9ucy5tYXhWYWx1ZSApO1xyXG4gICAgY29uc3QgdmFsdWVUb1Bvc2l0aW9uID0gKCB2YWx1ZTogbnVtYmVyICkgPT5cclxuICAgICAgVXRpbHMuY2xhbXAoIFV0aWxzLmxpbmVhciggb3B0aW9ucy5taW5WYWx1ZSwgb3B0aW9ucy5tYXhWYWx1ZSwgMCwgdHJhY2sud2lkdGgsIHZhbHVlICksIDAsIHRyYWNrLndpZHRoICk7XHJcblxyXG4gICAgLy8gY2xpY2sgaW4gdGhlIHRyYWNrIHRvIGNoYW5nZSB0aGUgdmFsdWUsIGNvbnRpbnVlIGRyYWdnaW5nIGlmIGRlc2lyZWRcclxuICAgIGNvbnN0IGhhbmRsZVRyYWNrRXZlbnQgPSAoIGV2ZW50OiBTY2VuZXJ5RXZlbnQgKSA9PiB7XHJcbiAgICAgIGNvbnN0IHggPSB0aHVtYi5nbG9iYWxUb1BhcmVudFBvaW50KCBldmVudC5wb2ludGVyLnBvaW50ICkueDtcclxuICAgICAgY29uc3QgdmFsdWUgPSBwb3NpdGlvblRvVmFsdWUoIHggKTtcclxuICAgICAgdmFsdWVQcm9wZXJ0eS5zZXQoIHZhbHVlICk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRyYWNrLmFkZElucHV0TGlzdGVuZXIoIG5ldyBEcmFnTGlzdGVuZXIoIHtcclxuICAgICAgYWxsb3dUb3VjaFNuYWc6IGZhbHNlLFxyXG4gICAgICBzdGFydDogZXZlbnQgPT4gaGFuZGxlVHJhY2tFdmVudCggZXZlbnQgKSxcclxuICAgICAgZHJhZzogZXZlbnQgPT4gaGFuZGxlVHJhY2tFdmVudCggZXZlbnQgKSxcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdkcmFnTGlzdGVuZXInIClcclxuICAgIH0gKSApO1xyXG5cclxuICAgIC8vIHRodW1iIGRyYWcgaGFuZGxlclxyXG4gICAgbGV0IGNsaWNrWE9mZnNldCA9IDA7IC8vIHgtb2Zmc2V0IGJldHdlZW4gaW5pdGlhbCBjbGljayBhbmQgdGh1bWIncyBvcmlnaW5cclxuICAgIHRodW1iLmFkZElucHV0TGlzdGVuZXIoIG5ldyBEcmFnTGlzdGVuZXIoIHtcclxuXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAndGh1bWJJbnB1dExpc3RlbmVyJyApLFxyXG5cclxuICAgICAgc3RhcnQ6IGV2ZW50ID0+IHtcclxuICAgICAgICBjbGlja1hPZmZzZXQgPSB0aHVtYi5nbG9iYWxUb1BhcmVudFBvaW50KCBldmVudC5wb2ludGVyLnBvaW50ICkueCAtIHRodW1iLng7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBkcmFnOiBldmVudCA9PiB7XHJcbiAgICAgICAgY29uc3QgeCA9IHRodW1iLmdsb2JhbFRvUGFyZW50UG9pbnQoIGV2ZW50LnBvaW50ZXIucG9pbnQgKS54IC0gY2xpY2tYT2Zmc2V0O1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gcG9zaXRpb25Ub1ZhbHVlKCB4ICk7XHJcbiAgICAgICAgdmFsdWVQcm9wZXJ0eS5zZXQoIHZhbHVlICk7XHJcbiAgICAgIH1cclxuICAgIH0gKSApO1xyXG5cclxuICAgIC8vIGN1c3RvbSBmb2N1cyBoaWdobGlnaHQgdGhhdCBzdXJyb3VuZHMgYW5kIG1vdmVzIHdpdGggdGhlIHRodW1iXHJcbiAgICB0aGlzLmZvY3VzSGlnaGxpZ2h0ID0gbmV3IEhpZ2hsaWdodEZyb21Ob2RlKCB0aHVtYiApO1xyXG5cclxuICAgIC8vIHN5bmMgd2l0aCBtb2RlbFxyXG4gICAgY29uc3QgdXBkYXRlVUkgPSAoIHZhbHVlOiBudW1iZXIgKSA9PiB7XHJcblxyXG4gICAgICAvLyBwb3NpdGlvbnNcclxuICAgICAgY29uc3QgeCA9IHZhbHVlVG9Qb3NpdGlvbiggdmFsdWUgKTtcclxuICAgICAgdGh1bWIuY2VudGVyWCA9IHg7XHJcbiAgICAgIGlmICggY3Vyc29yICkgeyBjdXJzb3IuY2VudGVyWCA9IHg7IH1cclxuICAgICAgaWYgKCB2YWx1ZURpc3BsYXkgKSB7IHZhbHVlRGlzcGxheS5jZW50ZXJYID0geDsgfVxyXG5cclxuICAgICAgLy8gdGh1bWIgY29sb3JcclxuICAgICAgdGh1bWIuZmlsbCA9IG9wdGlvbnMudmFsdWVUb0NvbG9yKCB2YWx1ZSApO1xyXG5cclxuICAgICAgLy8gdHdlYWtlciBidXR0b25zXHJcbiAgICAgIGlmICggcGx1c0J1dHRvbiApIHtcclxuICAgICAgICBwbHVzQnV0dG9uLmVuYWJsZWQgPSAoIHZhbHVlIDwgb3B0aW9ucy5tYXhWYWx1ZSApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggbWludXNCdXR0b24gKSB7XHJcbiAgICAgICAgbWludXNCdXR0b24uZW5hYmxlZCA9ICggdmFsdWUgPiBvcHRpb25zLm1pblZhbHVlICk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgICBjb25zdCB2YWx1ZUxpc3RlbmVyID0gKCB2YWx1ZTogbnVtYmVyICkgPT4gdXBkYXRlVUkoIHZhbHVlICk7XHJcbiAgICB2YWx1ZVByb3BlcnR5LmxpbmsoIHZhbHVlTGlzdGVuZXIgKTtcclxuXHJcbiAgICAvKlxyXG4gICAgICogVGhlIGhvcml6b250YWwgYm91bmRzIG9mIHRoZSB2YWx1ZSBjb250cm9sIGNoYW5nZXMgYXMgdGhlIHNsaWRlciBrbm9iIGlzIGRyYWdnZWQuXHJcbiAgICAgKiBUbyBwcmV2ZW50IHRoaXMsIHdlIGRldGVybWluZSB0aGUgZXh0ZW50cyBvZiB0aGUgY29udHJvbCdzIGJvdW5kcyBhdCBtaW4gYW5kIG1heCB2YWx1ZXMsXHJcbiAgICAgKiB0aGVuIGFkZCBhbiBpbnZpc2libGUgaG9yaXpvbnRhbCBzdHJ1dC5cclxuICAgICAqL1xyXG4gICAgLy8gZGV0ZXJtaW5lIGJvdW5kcyBhdCBtaW4gYW5kIG1heCB2YWx1ZXNcclxuICAgIHVwZGF0ZVVJKCBvcHRpb25zLm1pblZhbHVlICk7XHJcbiAgICBjb25zdCBtaW5YID0gdGhpcy5sZWZ0O1xyXG4gICAgdXBkYXRlVUkoIG9wdGlvbnMubWF4VmFsdWUgKTtcclxuICAgIGNvbnN0IG1heFggPSB0aGlzLnJpZ2h0O1xyXG5cclxuICAgIC8vIHJlc3RvcmUgdGhlIGluaXRpYWwgdmFsdWVcclxuICAgIHVwZGF0ZVVJKCB2YWx1ZVByb3BlcnR5LmdldCgpICk7XHJcblxyXG4gICAgLy8gYWRkIGEgaG9yaXpvbnRhbCBzdHJ1dFxyXG4gICAgY29uc3Qgc3RydXQgPSBuZXcgUmVjdGFuZ2xlKCBtaW5YLCAwLCBtYXhYIC0gbWluWCwgMSwgeyBwaWNrYWJsZTogZmFsc2UgfSApO1xyXG4gICAgdGhpcy5hZGRDaGlsZCggc3RydXQgKTtcclxuICAgIHN0cnV0Lm1vdmVUb0JhY2soKTtcclxuXHJcbiAgICB0aGlzLmRpc3Bvc2VTcGVjdHJ1bVNsaWRlciA9ICgpID0+IHtcclxuICAgICAgdmFsdWVEaXNwbGF5ICYmIHZhbHVlRGlzcGxheS5kaXNwb3NlKCk7XHJcbiAgICAgIHBsdXNCdXR0b24gJiYgcGx1c0J1dHRvbi5kaXNwb3NlKCk7XHJcbiAgICAgIG1pbnVzQnV0dG9uICYmIG1pbnVzQnV0dG9uLmRpc3Bvc2UoKTtcclxuICAgICAgdmFsdWVQcm9wZXJ0eS51bmxpbmsoIHZhbHVlTGlzdGVuZXIgKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gV2UgYWxyZWFkeSBzZXQgb3RoZXIgb3B0aW9ucyB2aWEgc3VwZXIoKS4gTm93IHRoYXQgd2UgaGF2ZSB2YWxpZCBCb3VuZHMsIGFwcGx5IHRoZXNlIG9wdGlvbnMuXHJcbiAgICB0aGlzLm11dGF0ZSggYm91bmRzUmVxdWlyZWRPcHRpb25LZXlzICk7XHJcblxyXG4gICAgLy8gc3VwcG9ydCBmb3IgYmluZGVyIGRvY3VtZW50YXRpb24sIHN0cmlwcGVkIG91dCBpbiBidWlsZHMgYW5kIG9ubHkgcnVucyB3aGVuID9iaW5kZXIgaXMgc3BlY2lmaWVkXHJcbiAgICBhc3NlcnQgJiYgcGhldD8uY2hpcHBlcj8ucXVlcnlQYXJhbWV0ZXJzPy5iaW5kZXIgJiYgSW5zdGFuY2VSZWdpc3RyeS5yZWdpc3RlckRhdGFVUkwoICdzY2VuZXJ5LXBoZXQnLCAnU3BlY3RydW1TbGlkZXInLCB0aGlzICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuZGlzcG9zZVNwZWN0cnVtU2xpZGVyKCk7XHJcbiAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogVGhlIHNsaWRlciB0aHVtYiwgb3JpZ2luIGF0IHRvcCBjZW50ZXIuXHJcbiAqL1xyXG5jbGFzcyBUaHVtYiBleHRlbmRzIFBhdGgge1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBwcm92aWRlZE9wdGlvbnM/OiBQYXRoT3B0aW9ucyApIHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gY29tYmluZU9wdGlvbnM8UGF0aE9wdGlvbnM+KCB7XHJcbiAgICAgIGZpbGw6ICdibGFjaycsXHJcbiAgICAgIHN0cm9rZTogJ2JsYWNrJyxcclxuICAgICAgbGluZVdpZHRoOiAxXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyBTZXQgdGhlIHJhZGl1cyBvZiB0aGUgYXJjcyBiYXNlZCBvbiB0aGUgaGVpZ2h0IG9yIHdpZHRoLCB3aGljaGV2ZXIgaXMgc21hbGxlci5cclxuICAgIGNvbnN0IHJhZGl1c1NjYWxlID0gMC4xNTtcclxuICAgIGNvbnN0IHJhZGl1cyA9ICggd2lkdGggPCBoZWlnaHQgKSA/IHJhZGl1c1NjYWxlICogd2lkdGggOiByYWRpdXNTY2FsZSAqIGhlaWdodDtcclxuXHJcbiAgICAvLyBDYWxjdWxhdGUgc29tZSBwYXJhbWV0ZXJzIG9mIHRoZSB1cHBlciB0cmlhbmdsZXMgb2YgdGhlIHRodW1iIGZvciBnZXR0aW5nIGFyYyBvZmZzZXRzLlxyXG4gICAgY29uc3QgaHlwb3RlbnVzZSA9IE1hdGguc3FydCggTWF0aC5wb3coIDAuNSAqIHdpZHRoLCAyICkgKyBNYXRoLnBvdyggMC4zICogaGVpZ2h0LCAyICkgKTtcclxuICAgIGNvbnN0IGFuZ2xlID0gTWF0aC5hY29zKCB3aWR0aCAqIDAuNSAvIGh5cG90ZW51c2UgKTtcclxuICAgIGNvbnN0IGhlaWdodE9mZnNldCA9IHJhZGl1cyAqIE1hdGguc2luKCBhbmdsZSApO1xyXG5cclxuICAgIC8vIERyYXcgdGhlIHRodW1iIHNoYXBlIHN0YXJ0aW5nIGF0IHRoZSByaWdodCB1cHBlciBjb3JuZXIgb2YgdGhlIHBlbnRhZ29uIGJlbG93IHRoZSBhcmMsXHJcbiAgICAvLyB0aGlzIHdheSB3ZSBjYW4gZ2V0IHRoZSBhcmMgY29vcmRpbmF0ZXMgZm9yIHRoZSBhcmMgaW4gdGhpcyBjb3JuZXIgZnJvbSB0aGUgb3RoZXIgc2lkZSxcclxuICAgIC8vIHdoaWNoIHdpbGwgYmUgZWFzaWVyIHRvIGNhbGN1bGF0ZSBhcmNpbmcgZnJvbSBib3R0b20gdG8gdG9wLlxyXG4gICAgY29uc3Qgc2hhcGUgPSBuZXcgU2hhcGUoKVxyXG4gICAgICAubW92ZVRvKCAwLjUgKiB3aWR0aCwgMC4zICogaGVpZ2h0ICsgaGVpZ2h0T2Zmc2V0IClcclxuICAgICAgLmxpbmVUbyggMC41ICogd2lkdGgsIGhlaWdodCAtIHJhZGl1cyApXHJcbiAgICAgIC5hcmMoIDAuNSAqIHdpZHRoIC0gcmFkaXVzLCBoZWlnaHQgLSByYWRpdXMsIHJhZGl1cywgMCwgTWF0aC5QSSAvIDIgKVxyXG4gICAgICAubGluZVRvKCAtMC41ICogd2lkdGggKyByYWRpdXMsIGhlaWdodCApXHJcbiAgICAgIC5hcmMoIC0wLjUgKiB3aWR0aCArIHJhZGl1cywgaGVpZ2h0IC0gcmFkaXVzLCByYWRpdXMsIE1hdGguUEkgLyAyLCBNYXRoLlBJIClcclxuICAgICAgLmxpbmVUbyggLTAuNSAqIHdpZHRoLCAwLjMgKiBoZWlnaHQgKyBoZWlnaHRPZmZzZXQgKVxyXG4gICAgICAuYXJjKCAtMC41ICogd2lkdGggKyByYWRpdXMsIDAuMyAqIGhlaWdodCArIGhlaWdodE9mZnNldCwgcmFkaXVzLCBNYXRoLlBJLCBNYXRoLlBJICsgYW5nbGUgKTtcclxuXHJcbiAgICAvLyBTYXZlIHRoZSBjb29yZGluYXRlcyBmb3IgdGhlIHBvaW50IGFib3ZlIHRoZSBsZWZ0IHNpZGUgYXJjLCBmb3IgdXNlIG9uIHRoZSBvdGhlciBzaWRlLlxyXG4gICAgY29uc3Qgc2lkZUFyY1BvaW50ID0gc2hhcGUuZ2V0TGFzdFBvaW50KCk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBzaWRlQXJjUG9pbnQgKTtcclxuXHJcbiAgICBzaGFwZS5saW5lVG8oIDAsIDAgKVxyXG4gICAgICAubGluZVRvKCAtc2lkZUFyY1BvaW50LngsIHNpZGVBcmNQb2ludC55IClcclxuICAgICAgLmFyYyggMC41ICogd2lkdGggLSByYWRpdXMsIDAuMyAqIGhlaWdodCArIGhlaWdodE9mZnNldCwgcmFkaXVzLCAtYW5nbGUsIDAgKVxyXG4gICAgICAuY2xvc2UoKTtcclxuXHJcbiAgICBzdXBlciggc2hhcGUsIG9wdGlvbnMgKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEaXNwbGF5cyB0aGUgdmFsdWUgYW5kIHVuaXRzLlxyXG4gKi9cclxuY2xhc3MgVmFsdWVEaXNwbGF5IGV4dGVuZHMgVGV4dCB7XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzcG9zZVZhbHVlRGlzcGxheTogKCkgPT4gdm9pZDtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHZhbHVlUHJvcGVydHlcclxuICAgKiBAcGFyYW0gdmFsdWVUb1N0cmluZyAtIGNvbnZlcnRzIHZhbHVlIHtudW1iZXJ9IHRvIHRleHQge3N0cmluZ30gZm9yIGRpc3BsYXlcclxuICAgKiBAcGFyYW0gcHJvdmlkZWRPcHRpb25zXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCB2YWx1ZVByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxudW1iZXI+LFxyXG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWVUb1N0cmluZzogKCB2YWx1ZTogbnVtYmVyICkgPT4gc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgcHJvdmlkZWRPcHRpb25zPzogVGV4dE9wdGlvbnMgKSB7XHJcblxyXG4gICAgc3VwZXIoICc/JywgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgY29uc3QgdmFsdWVPYnNlcnZlciA9ICggdmFsdWU6IG51bWJlciApID0+IHtcclxuICAgICAgdGhpcy5zdHJpbmcgPSB2YWx1ZVRvU3RyaW5nKCB2YWx1ZSApO1xyXG4gICAgfTtcclxuICAgIHZhbHVlUHJvcGVydHkubGluayggdmFsdWVPYnNlcnZlciApO1xyXG5cclxuICAgIHRoaXMuZGlzcG9zZVZhbHVlRGlzcGxheSA9ICgpID0+IHZhbHVlUHJvcGVydHkudW5saW5rKCB2YWx1ZU9ic2VydmVyICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuZGlzcG9zZVZhbHVlRGlzcGxheSgpO1xyXG4gICAgc3VwZXIuZGlzcG9zZSgpO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFJlY3Rhbmd1bGFyICdjdXJzb3InIHRoYXQgYXBwZWFycyBpbiB0aGUgdHJhY2sgZGlyZWN0bHkgYWJvdmUgdGhlIHRodW1iLiBPcmlnaW4gaXMgYXQgdG9wIGNlbnRlci5cclxuICovXHJcbmNsYXNzIEN1cnNvciBleHRlbmRzIFJlY3RhbmdsZSB7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgcHJvdmlkZWRPcHRpb25zOiBSZWN0YW5nbGVPcHRpb25zICkge1xyXG4gICAgc3VwZXIoIC13aWR0aCAvIDIsIDAsIHdpZHRoLCBoZWlnaHQsIHByb3ZpZGVkT3B0aW9ucyApO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeVBoZXQucmVnaXN0ZXIoICdTcGVjdHJ1bVNsaWRlcicsIFNwZWN0cnVtU2xpZGVyICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFLQSxPQUFPQSxRQUFRLE1BQU0sMkJBQTJCO0FBQ2hELE9BQU9DLFVBQVUsTUFBTSw0QkFBNEI7QUFDbkQsT0FBT0MsS0FBSyxNQUFNLHVCQUF1QjtBQUN6QyxPQUFPQyxLQUFLLE1BQU0sdUJBQXVCO0FBQ3pDLFNBQVNDLEtBQUssUUFBUSwwQkFBMEI7QUFDaEQsT0FBT0Msa0JBQWtCLE1BQU0sMENBQTBDO0FBQ3pFLE9BQU9DLGdCQUFnQixNQUFNLHNEQUFzRDtBQUNuRixPQUFPQyxTQUFTLElBQUlDLGNBQWMsUUFBUSxpQ0FBaUM7QUFDM0UsU0FBU0MsS0FBSyxFQUFFQyxZQUFZLEVBQUVDLGlCQUFpQixFQUFnQkMsSUFBSSxFQUFlQyxJQUFJLEVBQWVDLFNBQVMsRUFBa0NDLElBQUksUUFBcUIsNkJBQTZCO0FBQ3RNLE9BQU9DLGdCQUFnQixNQUFtQyxnREFBZ0Q7QUFDMUcsT0FBT0MsV0FBVyxNQUFNLHFDQUFxQztBQUM3RCxPQUFPQyxNQUFNLE1BQU0sMkJBQTJCO0FBQzlDLE9BQU9DLFFBQVEsTUFBTSxlQUFlO0FBQ3BDLE9BQU9DLFdBQVcsTUFBTSxrQkFBa0I7QUFDMUMsT0FBT0MsWUFBWSxNQUFNLG1CQUFtQjtBQUU1QyxNQUFNQyxpQkFBaUIsR0FBRyxDQUFDO0FBQzNCLE1BQU1DLGlCQUFpQixHQUFHLENBQUM7QUFxRDNCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZSxNQUFNQyxjQUFjLFNBQVNSLGdCQUFnQixDQUFFSixJQUFJLEVBQUUsQ0FBRSxDQUFDLENBQUM7RUFJdEU7QUFDRjtBQUNBO0FBQ0E7RUFDU2EsV0FBV0EsQ0FBRUMsYUFBZ0MsRUFBRUMsZUFBdUMsRUFBRztJQUM5RkMsTUFBTSxJQUFJdkIsa0JBQWtCLENBQUUsdUZBQXdGLENBQUM7SUFFdkgsTUFBTXdCLGVBQWUsR0FBR0YsZUFBZSxFQUFFRyxRQUFRLElBQUlSLGlCQUFpQjtJQUN0RSxNQUFNUyxlQUFlLEdBQUdKLGVBQWUsRUFBRUssUUFBUSxJQUFJVCxpQkFBaUI7SUFDdEUsTUFBTVUsb0JBQW9CLEdBQUcsSUFBSWpDLFFBQVEsQ0FBRSxJQUFJRSxLQUFLLENBQUUyQixlQUFlLEVBQUVFLGVBQWdCLENBQUUsQ0FBQzs7SUFFMUY7SUFDQSxNQUFNRyxPQUFPLEdBQUczQixTQUFTLENBQW9ELENBQUMsQ0FBRTtNQUU5RTtNQUNBdUIsUUFBUSxFQUFFUixpQkFBaUI7TUFDM0JVLFFBQVEsRUFBRVQsaUJBQWlCO01BQzNCWSxhQUFhLEVBQUlDLEtBQWEsSUFBTyxHQUFFQSxLQUFNLEVBQUM7TUFDOUNDLFlBQVksRUFBSUQsS0FBYSxJQUFNLElBQUkzQixLQUFLLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEdBQUcyQixLQUFNLENBQUM7TUFFakU7TUFDQUUsVUFBVSxFQUFFLEdBQUc7TUFDZkMsV0FBVyxFQUFFLEVBQUU7TUFDZkMsWUFBWSxFQUFFLENBQUM7TUFDZkMsaUJBQWlCLEVBQUUsT0FBTztNQUUxQjtNQUNBQyxVQUFVLEVBQUUsRUFBRTtNQUNkQyxXQUFXLEVBQUUsRUFBRTtNQUNmQyx1QkFBdUIsRUFBRSxFQUFFO01BQzNCQyx1QkFBdUIsRUFBRSxFQUFFO01BQzNCQyx1QkFBdUIsRUFBRSxDQUFDO01BQzFCQyx1QkFBdUIsRUFBRSxDQUFDO01BRTFCO01BQ0FDLFNBQVMsRUFBRSxJQUFJN0IsUUFBUSxDQUFFLEVBQUcsQ0FBQztNQUM3QjhCLFNBQVMsRUFBRSxPQUFPO01BQ2xCQyxZQUFZLEVBQUUsSUFBSTtNQUNsQkMsYUFBYSxFQUFFLENBQUM7TUFBRTs7TUFFbEI7TUFDQUMsZUFBZSxFQUFFLElBQUk7TUFDckJDLGlCQUFpQixFQUFFLENBQUM7TUFBRTtNQUN0QkMsZ0JBQWdCLEVBQUUsQ0FBQztNQUFFO01BQ3JCQyxpQkFBaUIsRUFBRSxFQUFFO01BQ3JCQywwQkFBMEIsRUFBRSxDQUFDO01BQzdCQywwQkFBMEIsRUFBRSxDQUFDO01BQzdCQywwQkFBMEIsRUFBRSxDQUFDO01BQzdCQywwQkFBMEIsRUFBRSxDQUFDO01BRTdCO01BQ0FDLGFBQWEsRUFBRSxJQUFJO01BQ25CQyxZQUFZLEVBQUUsT0FBTztNQUVyQjtNQUNBbkMsYUFBYSxFQUFFQSxhQUFhO01BQzVCTyxvQkFBb0IsRUFBRUEsb0JBQW9CO01BQzFDNkIsTUFBTSxFQUFFNUMsTUFBTSxDQUFDNkMsUUFBUTtNQUN2QkMsZ0JBQWdCLEVBQUU7SUFFcEIsQ0FBQyxFQUFFckMsZUFBZ0IsQ0FBQzs7SUFFcEI7SUFDQUMsTUFBTSxJQUFJQSxNQUFNLENBQUVNLE9BQU8sQ0FBQ0osUUFBUSxHQUFHSSxPQUFPLENBQUNGLFFBQVMsQ0FBQzs7SUFFdkQ7SUFDQSxNQUFNaUMsd0JBQXdCLEdBQUdDLENBQUMsQ0FBQ0MsSUFBSSxDQUFFakMsT0FBTyxFQUFFdEIsSUFBSSxDQUFDd0QsMkJBQTRCLENBQUM7SUFFcEYsS0FBSyxDQUFFRixDQUFDLENBQUNHLElBQUksQ0FBRW5DLE9BQU8sRUFBRXRCLElBQUksQ0FBQ3dELDJCQUE0QixDQUFFLENBQUM7SUFFNUQsTUFBTUUsS0FBSyxHQUFHLElBQUlqRCxZQUFZLENBQUU7TUFDOUJnQixZQUFZLEVBQUVILE9BQU8sQ0FBQ0csWUFBWTtNQUNsQ2tDLElBQUksRUFBRSxJQUFJdEUsVUFBVSxDQUFFaUMsT0FBTyxDQUFDSSxVQUFVLEVBQUVKLE9BQU8sQ0FBQ0ssV0FBWSxDQUFDO01BQy9EVCxRQUFRLEVBQUVJLE9BQU8sQ0FBQ0osUUFBUTtNQUMxQkUsUUFBUSxFQUFFRSxPQUFPLENBQUNGLFFBQVE7TUFDMUJ3QyxPQUFPLEVBQUV0QyxPQUFPLENBQUNNLFlBQVk7TUFDN0JpQyxNQUFNLEVBQUU7SUFDVixDQUFFLENBQUM7O0lBRUg7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDSSxNQUFNQyxXQUFXLEdBQUcsSUFBSTVELFNBQVMsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFd0QsS0FBSyxDQUFDSyxLQUFLLEVBQUVMLEtBQUssQ0FBQ00sTUFBTSxFQUFFO01BQ2xFQyxNQUFNLEVBQUUzQyxPQUFPLENBQUNPLGlCQUFpQjtNQUNqQ3FDLFNBQVMsRUFBRSxDQUFDO01BQ1pDLFFBQVEsRUFBRTtJQUNaLENBQUUsQ0FBQztJQUVILElBQUlDLFlBQXlCLEdBQUcsSUFBSTtJQUNwQyxJQUFLOUMsT0FBTyxDQUFDZ0IsWUFBWSxFQUFHO01BQzFCOEIsWUFBWSxHQUFHLElBQUlDLFlBQVksQ0FBRXZELGFBQWEsRUFBRVEsT0FBTyxDQUFDQyxhQUFhLEVBQUU7UUFDckUrQyxJQUFJLEVBQUVoRCxPQUFPLENBQUNjLFNBQVM7UUFDdkJtQyxJQUFJLEVBQUVqRCxPQUFPLENBQUNlLFNBQVM7UUFDdkJtQyxNQUFNLEVBQUVkLEtBQUssQ0FBQ2UsR0FBRyxHQUFHbkQsT0FBTyxDQUFDaUI7TUFDOUIsQ0FBRSxDQUFDO0lBQ0w7SUFFQSxJQUFJc0IsTUFBcUIsR0FBRyxJQUFJO0lBQ2hDLElBQUt2QyxPQUFPLENBQUMwQixhQUFhLEVBQUc7TUFDM0JhLE1BQU0sR0FBRyxJQUFJYSxNQUFNLENBQUUsQ0FBQyxFQUFFaEIsS0FBSyxDQUFDTSxNQUFNLEVBQUU7UUFDcENDLE1BQU0sRUFBRTNDLE9BQU8sQ0FBQzJCLFlBQVk7UUFDNUJ3QixHQUFHLEVBQUVmLEtBQUssQ0FBQ2U7TUFDYixDQUFFLENBQUM7SUFDTDtJQUVBLE1BQU1FLEtBQUssR0FBRyxJQUFJQyxLQUFLLENBQUV0RCxPQUFPLENBQUNRLFVBQVUsRUFBRVIsT0FBTyxDQUFDUyxXQUFXLEVBQUU7TUFDaEU4QixNQUFNLEVBQUUsU0FBUztNQUNqQlksR0FBRyxFQUFFZixLQUFLLENBQUNjO0lBQ2IsQ0FBRSxDQUFDOztJQUVIO0lBQ0EsSUFBS2xELE9BQU8sQ0FBQ1UsdUJBQXVCLElBQUlWLE9BQU8sQ0FBQ1csdUJBQXVCLEVBQUc7TUFDeEUwQyxLQUFLLENBQUNFLFNBQVMsR0FBR0YsS0FBSyxDQUFDRyxXQUFXLENBQ2hDQyxTQUFTLENBQUV6RCxPQUFPLENBQUNVLHVCQUF1QixFQUFFVixPQUFPLENBQUNXLHVCQUF3QixDQUFDLENBQzdFK0MsUUFBUSxDQUFFMUQsT0FBTyxDQUFDVyx1QkFBd0IsQ0FBQztJQUNoRDs7SUFFQTtJQUNBLElBQUtYLE9BQU8sQ0FBQ1ksdUJBQXVCLElBQUlaLE9BQU8sQ0FBQ2EsdUJBQXVCLEVBQUc7TUFDeEV3QyxLQUFLLENBQUNNLFNBQVMsR0FBR04sS0FBSyxDQUFDRyxXQUFXLENBQ2hDQyxTQUFTLENBQUV6RCxPQUFPLENBQUNZLHVCQUF1QixFQUFFWixPQUFPLENBQUNhLHVCQUF3QixDQUFDLENBQzdFNkMsUUFBUSxDQUFFMUQsT0FBTyxDQUFDYSx1QkFBd0IsQ0FBQztJQUNoRDs7SUFFQTtJQUNBLElBQUkrQyxVQUF1QixHQUFHLElBQUk7SUFDbEMsSUFBSUMsV0FBd0IsR0FBRyxJQUFJO0lBQ25DLElBQUs3RCxPQUFPLENBQUNrQixlQUFlLEVBQUc7TUFFN0IwQyxVQUFVLEdBQUcsSUFBSTdFLFdBQVcsQ0FBRSxPQUFPLEVBQUksTUFBTTtRQUU3QztRQUNBUyxhQUFhLENBQUNzRSxHQUFHLENBQUVDLElBQUksQ0FBQ0MsR0FBRyxDQUFFaEUsT0FBTyxDQUFDRixRQUFRLEVBQUVOLGFBQWEsQ0FBQ3lFLEdBQUcsQ0FBQyxDQUFDLEdBQUdqRSxPQUFPLENBQUNtQixpQkFBa0IsQ0FBRSxDQUFDO01BQ3BHLENBQUMsRUFBSTtRQUNIK0MsSUFBSSxFQUFFOUIsS0FBSyxDQUFDK0IsS0FBSyxHQUFHbkUsT0FBTyxDQUFDb0IsZ0JBQWdCO1FBQzVDZ0QsT0FBTyxFQUFFaEMsS0FBSyxDQUFDZ0MsT0FBTztRQUN0QkMsU0FBUyxFQUFFckUsT0FBTyxDQUFDcUIsaUJBQWlCO1FBQ3BDTyxNQUFNLEVBQUU1QixPQUFPLENBQUM0QixNQUFNLENBQUMwQyxZQUFZLENBQUUsWUFBYTtNQUNwRCxDQUFFLENBQUM7TUFFSFQsV0FBVyxHQUFHLElBQUk5RSxXQUFXLENBQUUsTUFBTSxFQUFJLE1BQU07UUFFN0M7UUFDQVMsYUFBYSxDQUFDc0UsR0FBRyxDQUFFQyxJQUFJLENBQUNRLEdBQUcsQ0FBRXZFLE9BQU8sQ0FBQ0osUUFBUSxFQUFFSixhQUFhLENBQUN5RSxHQUFHLENBQUMsQ0FBQyxHQUFHakUsT0FBTyxDQUFDbUIsaUJBQWtCLENBQUUsQ0FBQztNQUNwRyxDQUFDLEVBQUk7UUFDSGdELEtBQUssRUFBRS9CLEtBQUssQ0FBQzhCLElBQUksR0FBR2xFLE9BQU8sQ0FBQ29CLGdCQUFnQjtRQUM1Q2dELE9BQU8sRUFBRWhDLEtBQUssQ0FBQ2dDLE9BQU87UUFDdEJDLFNBQVMsRUFBRXJFLE9BQU8sQ0FBQ3FCLGlCQUFpQjtRQUNwQ08sTUFBTSxFQUFFNUIsT0FBTyxDQUFDNEIsTUFBTSxDQUFDMEMsWUFBWSxDQUFFLGFBQWM7TUFDckQsQ0FBRSxDQUFDOztNQUVIO01BQ0FWLFVBQVUsQ0FBQ0wsU0FBUyxHQUFHSyxVQUFVLENBQUNKLFdBQVcsQ0FDMUNDLFNBQVMsQ0FBRXpELE9BQU8sQ0FBQ3NCLDBCQUEwQixFQUFFdEIsT0FBTyxDQUFDdUIsMEJBQTJCLENBQUMsQ0FDbkZpRCxRQUFRLENBQUV4RSxPQUFPLENBQUNzQiwwQkFBMkIsQ0FBQztNQUNqRHVDLFdBQVcsQ0FBQ04sU0FBUyxHQUFHTSxXQUFXLENBQUNMLFdBQVcsQ0FDNUNDLFNBQVMsQ0FBRXpELE9BQU8sQ0FBQ3NCLDBCQUEwQixFQUFFdEIsT0FBTyxDQUFDdUIsMEJBQTJCLENBQUMsQ0FDbkZpRCxRQUFRLENBQUUsQ0FBQ3hFLE9BQU8sQ0FBQ3NCLDBCQUEyQixDQUFDOztNQUVsRDtNQUNBc0MsVUFBVSxDQUFDRCxTQUFTLEdBQUdDLFVBQVUsQ0FBQ0osV0FBVyxDQUMxQ0MsU0FBUyxDQUFFekQsT0FBTyxDQUFDd0IsMEJBQTBCLEVBQUV4QixPQUFPLENBQUN5QiwwQkFBMkIsQ0FBQyxDQUNuRitDLFFBQVEsQ0FBRXhFLE9BQU8sQ0FBQ3dCLDBCQUEyQixDQUFDO01BQ2pEcUMsV0FBVyxDQUFDRixTQUFTLEdBQUdFLFdBQVcsQ0FBQ0wsV0FBVyxDQUM1Q0MsU0FBUyxDQUFFekQsT0FBTyxDQUFDd0IsMEJBQTBCLEVBQUV4QixPQUFPLENBQUN5QiwwQkFBMkIsQ0FBQyxDQUNuRitDLFFBQVEsQ0FBRSxDQUFDeEUsT0FBTyxDQUFDd0IsMEJBQTJCLENBQUM7SUFDcEQ7O0lBRUE7SUFDQSxJQUFJLENBQUNpRCxRQUFRLENBQUVyQyxLQUFNLENBQUM7SUFDdEIsSUFBSSxDQUFDcUMsUUFBUSxDQUFFakMsV0FBWSxDQUFDO0lBQzVCLElBQUksQ0FBQ2lDLFFBQVEsQ0FBRXBCLEtBQU0sQ0FBQztJQUN0QlAsWUFBWSxJQUFJLElBQUksQ0FBQzJCLFFBQVEsQ0FBRTNCLFlBQWEsQ0FBQztJQUM3Q1AsTUFBTSxJQUFJLElBQUksQ0FBQ2tDLFFBQVEsQ0FBRWxDLE1BQU8sQ0FBQztJQUNqQ3FCLFVBQVUsSUFBSSxJQUFJLENBQUNhLFFBQVEsQ0FBRWIsVUFBVyxDQUFDO0lBQ3pDQyxXQUFXLElBQUksSUFBSSxDQUFDWSxRQUFRLENBQUVaLFdBQVksQ0FBQzs7SUFFM0M7SUFDQSxNQUFNYSxlQUFlLEdBQUtDLENBQVMsSUFDakMxRyxLQUFLLENBQUMyRyxLQUFLLENBQUUzRyxLQUFLLENBQUM0RyxNQUFNLENBQUUsQ0FBQyxFQUFFekMsS0FBSyxDQUFDSyxLQUFLLEVBQUV6QyxPQUFPLENBQUNKLFFBQVEsRUFBRUksT0FBTyxDQUFDRixRQUFRLEVBQUU2RSxDQUFFLENBQUMsRUFBRTNFLE9BQU8sQ0FBQ0osUUFBUSxFQUFFSSxPQUFPLENBQUNGLFFBQVMsQ0FBQztJQUMxSCxNQUFNZ0YsZUFBZSxHQUFLNUUsS0FBYSxJQUNyQ2pDLEtBQUssQ0FBQzJHLEtBQUssQ0FBRTNHLEtBQUssQ0FBQzRHLE1BQU0sQ0FBRTdFLE9BQU8sQ0FBQ0osUUFBUSxFQUFFSSxPQUFPLENBQUNGLFFBQVEsRUFBRSxDQUFDLEVBQUVzQyxLQUFLLENBQUNLLEtBQUssRUFBRXZDLEtBQU0sQ0FBQyxFQUFFLENBQUMsRUFBRWtDLEtBQUssQ0FBQ0ssS0FBTSxDQUFDOztJQUUxRztJQUNBLE1BQU1zQyxnQkFBZ0IsR0FBS0MsS0FBbUIsSUFBTTtNQUNsRCxNQUFNTCxDQUFDLEdBQUd0QixLQUFLLENBQUM0QixtQkFBbUIsQ0FBRUQsS0FBSyxDQUFDRSxPQUFPLENBQUNDLEtBQU0sQ0FBQyxDQUFDUixDQUFDO01BQzVELE1BQU16RSxLQUFLLEdBQUd3RSxlQUFlLENBQUVDLENBQUUsQ0FBQztNQUNsQ25GLGFBQWEsQ0FBQ3NFLEdBQUcsQ0FBRTVELEtBQU0sQ0FBQztJQUM1QixDQUFDO0lBRURrQyxLQUFLLENBQUNnRCxnQkFBZ0IsQ0FBRSxJQUFJNUcsWUFBWSxDQUFFO01BQ3hDNkcsY0FBYyxFQUFFLEtBQUs7TUFDckJDLEtBQUssRUFBRU4sS0FBSyxJQUFJRCxnQkFBZ0IsQ0FBRUMsS0FBTSxDQUFDO01BQ3pDTyxJQUFJLEVBQUVQLEtBQUssSUFBSUQsZ0JBQWdCLENBQUVDLEtBQU0sQ0FBQztNQUN4Q3BELE1BQU0sRUFBRTVCLE9BQU8sQ0FBQzRCLE1BQU0sQ0FBQzBDLFlBQVksQ0FBRSxjQUFlO0lBQ3RELENBQUUsQ0FBRSxDQUFDOztJQUVMO0lBQ0EsSUFBSWtCLFlBQVksR0FBRyxDQUFDLENBQUMsQ0FBQztJQUN0Qm5DLEtBQUssQ0FBQytCLGdCQUFnQixDQUFFLElBQUk1RyxZQUFZLENBQUU7TUFFeENvRCxNQUFNLEVBQUU1QixPQUFPLENBQUM0QixNQUFNLENBQUMwQyxZQUFZLENBQUUsb0JBQXFCLENBQUM7TUFFM0RnQixLQUFLLEVBQUVOLEtBQUssSUFBSTtRQUNkUSxZQUFZLEdBQUduQyxLQUFLLENBQUM0QixtQkFBbUIsQ0FBRUQsS0FBSyxDQUFDRSxPQUFPLENBQUNDLEtBQU0sQ0FBQyxDQUFDUixDQUFDLEdBQUd0QixLQUFLLENBQUNzQixDQUFDO01BQzdFLENBQUM7TUFFRFksSUFBSSxFQUFFUCxLQUFLLElBQUk7UUFDYixNQUFNTCxDQUFDLEdBQUd0QixLQUFLLENBQUM0QixtQkFBbUIsQ0FBRUQsS0FBSyxDQUFDRSxPQUFPLENBQUNDLEtBQU0sQ0FBQyxDQUFDUixDQUFDLEdBQUdhLFlBQVk7UUFDM0UsTUFBTXRGLEtBQUssR0FBR3dFLGVBQWUsQ0FBRUMsQ0FBRSxDQUFDO1FBQ2xDbkYsYUFBYSxDQUFDc0UsR0FBRyxDQUFFNUQsS0FBTSxDQUFDO01BQzVCO0lBQ0YsQ0FBRSxDQUFFLENBQUM7O0lBRUw7SUFDQSxJQUFJLENBQUN1RixjQUFjLEdBQUcsSUFBSWhILGlCQUFpQixDQUFFNEUsS0FBTSxDQUFDOztJQUVwRDtJQUNBLE1BQU1xQyxRQUFRLEdBQUt4RixLQUFhLElBQU07TUFFcEM7TUFDQSxNQUFNeUUsQ0FBQyxHQUFHRyxlQUFlLENBQUU1RSxLQUFNLENBQUM7TUFDbENtRCxLQUFLLENBQUNzQyxPQUFPLEdBQUdoQixDQUFDO01BQ2pCLElBQUtwQyxNQUFNLEVBQUc7UUFBRUEsTUFBTSxDQUFDb0QsT0FBTyxHQUFHaEIsQ0FBQztNQUFFO01BQ3BDLElBQUs3QixZQUFZLEVBQUc7UUFBRUEsWUFBWSxDQUFDNkMsT0FBTyxHQUFHaEIsQ0FBQztNQUFFOztNQUVoRDtNQUNBdEIsS0FBSyxDQUFDSixJQUFJLEdBQUdqRCxPQUFPLENBQUNHLFlBQVksQ0FBRUQsS0FBTSxDQUFDOztNQUUxQztNQUNBLElBQUswRCxVQUFVLEVBQUc7UUFDaEJBLFVBQVUsQ0FBQ2dDLE9BQU8sR0FBSzFGLEtBQUssR0FBR0YsT0FBTyxDQUFDRixRQUFVO01BQ25EO01BQ0EsSUFBSytELFdBQVcsRUFBRztRQUNqQkEsV0FBVyxDQUFDK0IsT0FBTyxHQUFLMUYsS0FBSyxHQUFHRixPQUFPLENBQUNKLFFBQVU7TUFDcEQ7SUFDRixDQUFDO0lBQ0QsTUFBTWlHLGFBQWEsR0FBSzNGLEtBQWEsSUFBTXdGLFFBQVEsQ0FBRXhGLEtBQU0sQ0FBQztJQUM1RFYsYUFBYSxDQUFDc0csSUFBSSxDQUFFRCxhQUFjLENBQUM7O0lBRW5DO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7SUFDSTtJQUNBSCxRQUFRLENBQUUxRixPQUFPLENBQUNKLFFBQVMsQ0FBQztJQUM1QixNQUFNbUcsSUFBSSxHQUFHLElBQUksQ0FBQzdCLElBQUk7SUFDdEJ3QixRQUFRLENBQUUxRixPQUFPLENBQUNGLFFBQVMsQ0FBQztJQUM1QixNQUFNa0csSUFBSSxHQUFHLElBQUksQ0FBQzdCLEtBQUs7O0lBRXZCO0lBQ0F1QixRQUFRLENBQUVsRyxhQUFhLENBQUN5RSxHQUFHLENBQUMsQ0FBRSxDQUFDOztJQUUvQjtJQUNBLE1BQU1nQyxLQUFLLEdBQUcsSUFBSXJILFNBQVMsQ0FBRW1ILElBQUksRUFBRSxDQUFDLEVBQUVDLElBQUksR0FBR0QsSUFBSSxFQUFFLENBQUMsRUFBRTtNQUFFbEQsUUFBUSxFQUFFO0lBQU0sQ0FBRSxDQUFDO0lBQzNFLElBQUksQ0FBQzRCLFFBQVEsQ0FBRXdCLEtBQU0sQ0FBQztJQUN0QkEsS0FBSyxDQUFDQyxVQUFVLENBQUMsQ0FBQztJQUVsQixJQUFJLENBQUNDLHFCQUFxQixHQUFHLE1BQU07TUFDakNyRCxZQUFZLElBQUlBLFlBQVksQ0FBQ3NELE9BQU8sQ0FBQyxDQUFDO01BQ3RDeEMsVUFBVSxJQUFJQSxVQUFVLENBQUN3QyxPQUFPLENBQUMsQ0FBQztNQUNsQ3ZDLFdBQVcsSUFBSUEsV0FBVyxDQUFDdUMsT0FBTyxDQUFDLENBQUM7TUFDcEM1RyxhQUFhLENBQUM2RyxNQUFNLENBQUVSLGFBQWMsQ0FBQztJQUN2QyxDQUFDOztJQUVEO0lBQ0EsSUFBSSxDQUFDUyxNQUFNLENBQUV2RSx3QkFBeUIsQ0FBQzs7SUFFdkM7SUFDQXJDLE1BQU0sSUFBSTZHLElBQUksRUFBRUMsT0FBTyxFQUFFQyxlQUFlLEVBQUVDLE1BQU0sSUFBSXRJLGdCQUFnQixDQUFDdUksZUFBZSxDQUFFLGNBQWMsRUFBRSxnQkFBZ0IsRUFBRSxJQUFLLENBQUM7RUFDaEk7RUFFZ0JQLE9BQU9BLENBQUEsRUFBUztJQUM5QixJQUFJLENBQUNELHFCQUFxQixDQUFDLENBQUM7SUFDNUIsS0FBSyxDQUFDQyxPQUFPLENBQUMsQ0FBQztFQUNqQjtBQUNGOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQU05QyxLQUFLLFNBQVMzRSxJQUFJLENBQUM7RUFFaEJZLFdBQVdBLENBQUVrRCxLQUFhLEVBQUVDLE1BQWMsRUFBRWpELGVBQTZCLEVBQUc7SUFFakYsTUFBTU8sT0FBTyxHQUFHMUIsY0FBYyxDQUFlO01BQzNDMkUsSUFBSSxFQUFFLE9BQU87TUFDYk4sTUFBTSxFQUFFLE9BQU87TUFDZkMsU0FBUyxFQUFFO0lBQ2IsQ0FBQyxFQUFFbkQsZUFBZ0IsQ0FBQzs7SUFFcEI7SUFDQSxNQUFNbUgsV0FBVyxHQUFHLElBQUk7SUFDeEIsTUFBTUMsTUFBTSxHQUFLcEUsS0FBSyxHQUFHQyxNQUFNLEdBQUtrRSxXQUFXLEdBQUduRSxLQUFLLEdBQUdtRSxXQUFXLEdBQUdsRSxNQUFNOztJQUU5RTtJQUNBLE1BQU1vRSxVQUFVLEdBQUcvQyxJQUFJLENBQUNnRCxJQUFJLENBQUVoRCxJQUFJLENBQUNpRCxHQUFHLENBQUUsR0FBRyxHQUFHdkUsS0FBSyxFQUFFLENBQUUsQ0FBQyxHQUFHc0IsSUFBSSxDQUFDaUQsR0FBRyxDQUFFLEdBQUcsR0FBR3RFLE1BQU0sRUFBRSxDQUFFLENBQUUsQ0FBQztJQUN4RixNQUFNdUUsS0FBSyxHQUFHbEQsSUFBSSxDQUFDbUQsSUFBSSxDQUFFekUsS0FBSyxHQUFHLEdBQUcsR0FBR3FFLFVBQVcsQ0FBQztJQUNuRCxNQUFNSyxZQUFZLEdBQUdOLE1BQU0sR0FBRzlDLElBQUksQ0FBQ3FELEdBQUcsQ0FBRUgsS0FBTSxDQUFDOztJQUUvQztJQUNBO0lBQ0E7SUFDQSxNQUFNSSxLQUFLLEdBQUcsSUFBSW5KLEtBQUssQ0FBQyxDQUFDLENBQ3RCb0osTUFBTSxDQUFFLEdBQUcsR0FBRzdFLEtBQUssRUFBRSxHQUFHLEdBQUdDLE1BQU0sR0FBR3lFLFlBQWEsQ0FBQyxDQUNsREksTUFBTSxDQUFFLEdBQUcsR0FBRzlFLEtBQUssRUFBRUMsTUFBTSxHQUFHbUUsTUFBTyxDQUFDLENBQ3RDVyxHQUFHLENBQUUsR0FBRyxHQUFHL0UsS0FBSyxHQUFHb0UsTUFBTSxFQUFFbkUsTUFBTSxHQUFHbUUsTUFBTSxFQUFFQSxNQUFNLEVBQUUsQ0FBQyxFQUFFOUMsSUFBSSxDQUFDMEQsRUFBRSxHQUFHLENBQUUsQ0FBQyxDQUNwRUYsTUFBTSxDQUFFLENBQUMsR0FBRyxHQUFHOUUsS0FBSyxHQUFHb0UsTUFBTSxFQUFFbkUsTUFBTyxDQUFDLENBQ3ZDOEUsR0FBRyxDQUFFLENBQUMsR0FBRyxHQUFHL0UsS0FBSyxHQUFHb0UsTUFBTSxFQUFFbkUsTUFBTSxHQUFHbUUsTUFBTSxFQUFFQSxNQUFNLEVBQUU5QyxJQUFJLENBQUMwRCxFQUFFLEdBQUcsQ0FBQyxFQUFFMUQsSUFBSSxDQUFDMEQsRUFBRyxDQUFDLENBQzNFRixNQUFNLENBQUUsQ0FBQyxHQUFHLEdBQUc5RSxLQUFLLEVBQUUsR0FBRyxHQUFHQyxNQUFNLEdBQUd5RSxZQUFhLENBQUMsQ0FDbkRLLEdBQUcsQ0FBRSxDQUFDLEdBQUcsR0FBRy9FLEtBQUssR0FBR29FLE1BQU0sRUFBRSxHQUFHLEdBQUduRSxNQUFNLEdBQUd5RSxZQUFZLEVBQUVOLE1BQU0sRUFBRTlDLElBQUksQ0FBQzBELEVBQUUsRUFBRTFELElBQUksQ0FBQzBELEVBQUUsR0FBR1IsS0FBTSxDQUFDOztJQUU5RjtJQUNBLE1BQU1TLFlBQVksR0FBR0wsS0FBSyxDQUFDTSxZQUFZLENBQUMsQ0FBQztJQUN6Q2pJLE1BQU0sSUFBSUEsTUFBTSxDQUFFZ0ksWUFBYSxDQUFDO0lBRWhDTCxLQUFLLENBQUNFLE1BQU0sQ0FBRSxDQUFDLEVBQUUsQ0FBRSxDQUFDLENBQ2pCQSxNQUFNLENBQUUsQ0FBQ0csWUFBWSxDQUFDL0MsQ0FBQyxFQUFFK0MsWUFBWSxDQUFDRSxDQUFFLENBQUMsQ0FDekNKLEdBQUcsQ0FBRSxHQUFHLEdBQUcvRSxLQUFLLEdBQUdvRSxNQUFNLEVBQUUsR0FBRyxHQUFHbkUsTUFBTSxHQUFHeUUsWUFBWSxFQUFFTixNQUFNLEVBQUUsQ0FBQ0ksS0FBSyxFQUFFLENBQUUsQ0FBQyxDQUMzRVksS0FBSyxDQUFDLENBQUM7SUFFVixLQUFLLENBQUVSLEtBQUssRUFBRXJILE9BQVEsQ0FBQztFQUN6QjtBQUNGOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQU0rQyxZQUFZLFNBQVNsRSxJQUFJLENBQUM7RUFJOUI7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNTVSxXQUFXQSxDQUFFQyxhQUF3QyxFQUN4Q1MsYUFBMEMsRUFDMUNSLGVBQTZCLEVBQUc7SUFFbEQsS0FBSyxDQUFFLEdBQUcsRUFBRUEsZUFBZ0IsQ0FBQztJQUU3QixNQUFNcUksYUFBYSxHQUFLNUgsS0FBYSxJQUFNO01BQ3pDLElBQUksQ0FBQzZILE1BQU0sR0FBRzlILGFBQWEsQ0FBRUMsS0FBTSxDQUFDO0lBQ3RDLENBQUM7SUFDRFYsYUFBYSxDQUFDc0csSUFBSSxDQUFFZ0MsYUFBYyxDQUFDO0lBRW5DLElBQUksQ0FBQ0UsbUJBQW1CLEdBQUcsTUFBTXhJLGFBQWEsQ0FBQzZHLE1BQU0sQ0FBRXlCLGFBQWMsQ0FBQztFQUN4RTtFQUVnQjFCLE9BQU9BLENBQUEsRUFBUztJQUM5QixJQUFJLENBQUM0QixtQkFBbUIsQ0FBQyxDQUFDO0lBQzFCLEtBQUssQ0FBQzVCLE9BQU8sQ0FBQyxDQUFDO0VBQ2pCO0FBQ0Y7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsTUFBTWhELE1BQU0sU0FBU3hFLFNBQVMsQ0FBQztFQUN0QlcsV0FBV0EsQ0FBRWtELEtBQWEsRUFBRUMsTUFBYyxFQUFFakQsZUFBaUMsRUFBRztJQUNyRixLQUFLLENBQUUsQ0FBQ2dELEtBQUssR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFQSxLQUFLLEVBQUVDLE1BQU0sRUFBRWpELGVBQWdCLENBQUM7RUFDeEQ7QUFDRjtBQUVBUCxXQUFXLENBQUMrSSxRQUFRLENBQUUsZ0JBQWdCLEVBQUUzSSxjQUFlLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=