// Copyright 2014-2024, University of Colorado Boulder

/**
 * Shows a readout of the elapsed time, with play and pause buttons.  By default there are no units (which could be used
 * if all of a simulations time units are in 'seconds'), or you can specify a selection of units to choose from.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Anton Ulyanov (Mlearner)
 */

import Bounds2 from '../../dot/js/Bounds2.js';
import Utils from '../../dot/js/Utils.js';
import Vector2 from '../../dot/js/Vector2.js';
import InstanceRegistry from '../../phet-core/js/documentation/InstanceRegistry.js';
import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
import StringUtils from '../../phetcommon/js/util/StringUtils.js';
import { Circle, HBox, InteractiveHighlighting, Node, Path, VBox } from '../../scenery/js/imports.js';
import BooleanRectangularToggleButton from '../../sun/js/buttons/BooleanRectangularToggleButton.js';
import RectangularPushButton from '../../sun/js/buttons/RectangularPushButton.js';
import Tandem from '../../tandem/js/Tandem.js';
import NumberDisplay from './NumberDisplay.js';
import PauseIconShape from './PauseIconShape.js';
import PhetFont from './PhetFont.js';
import PlayIconShape from './PlayIconShape.js';
import sceneryPhet from './sceneryPhet.js';
import SceneryPhetStrings from './SceneryPhetStrings.js';
import ShadedRectangle from './ShadedRectangle.js';
import Stopwatch from './Stopwatch.js';
import UTurnArrowShape from './UTurnArrowShape.js';
import pushButtonSoundPlayer from '../../tambo/js/shared-sound-players/pushButtonSoundPlayer.js';
import DerivedProperty from '../../axon/js/DerivedProperty.js';
import RichDragListener from '../../scenery-phet/js/RichDragListener.js';
import RichKeyboardDragListener from '../../scenery-phet/js/RichKeyboardDragListener.js';
export default class StopwatchNode extends InteractiveHighlighting(Node) {
  // options propagated to the NumberDisplay

  // Non-null if draggable. Can be used for forwarding press events when dragging out of a toolbox.

  // We used to use Lucida Console, Arial, but Arial has smaller number width for "11" and hence was causing jitter.
  // Neither Trebuchet MS and Lucida Grande is a monospace font, but the digits all appear to be monospace.
  // Use Trebuchet first, since it has broader cross-platform support.
  // Another advantage of using a non-monospace font (with monospace digits) is that the : and . symbols aren't as
  // wide as the numerals. @ariel-phet and @samreid tested this combination of families on Mac/Chrome and Windows/Chrome
  // and it seemed to work nicely, with no jitter.
  static NUMBER_FONT_FAMILY = '"Trebuchet MS", "Lucida Grande", monospace';
  static DEFAULT_FONT = new PhetFont({
    size: 20,
    family: StopwatchNode.NUMBER_FONT_FAMILY
  });

  /**
   * A value for options.numberDisplayOptions.numberFormatter where time is interpreted as minutes and seconds.
   * The format is MM:SS.CC, where M=minutes, S=seconds, C=centiseconds. The returned string is plain text, so all
   * digits will be the same size, and the client is responsible for setting the font size.
   */
  static PLAIN_TEXT_MINUTES_AND_SECONDS = time => {
    const minutesAndSeconds = toMinutesAndSeconds(time);
    const centiseconds = StopwatchNode.getDecimalPlaces(time, 2);
    return minutesAndSeconds + centiseconds;
  };

  /**
   * A value for options.numberDisplayOptions.numberFormatter where time is interpreted as minutes and seconds.
   * The format is format MM:SS.cc, where M=minutes, S=seconds, c=centiseconds. The string returned is in RichText
   * format, with the 'c' digits in a smaller font.
   */
  static RICH_TEXT_MINUTES_AND_SECONDS = StopwatchNode.createRichTextNumberFormatter({
    showAsMinutesAndSeconds: true,
    numberOfDecimalPlaces: 2
  });
  constructor(stopwatch, providedOptions) {
    const options = optionize()({
      // SelfOptions
      cursor: 'pointer',
      numberDisplayRange: Stopwatch.ZERO_TO_ALMOST_SIXTY,
      // sized for 59:59.99 (mm:ss) or 3599.99 (decimal)
      iconHeight: 10,
      iconFill: 'black',
      iconLineWidth: 1,
      backgroundBaseColor: 'rgb( 80, 130, 230 )',
      buttonBaseColor: '#DFE0E1',
      resetButtonSoundPlayer: pushButtonSoundPlayer,
      xSpacing: 6,
      // horizontal space between the buttons
      ySpacing: 6,
      // vertical space between readout and buttons
      xMargin: 8,
      yMargin: 8,
      numberDisplayOptions: {
        numberFormatter: StopwatchNode.RICH_TEXT_MINUTES_AND_SECONDS,
        numberFormatterDependencies: [
        // Used in the numberFormatter above
        SceneryPhetStrings.stopwatchValueUnitsPatternStringProperty],
        useRichText: true,
        textOptions: {
          font: StopwatchNode.DEFAULT_FONT
        },
        align: 'right',
        cornerRadius: 4,
        xMargin: 4,
        yMargin: 2,
        maxWidth: 150,
        // please override as necessary
        pickable: false // allow dragging by the number display
      },
      dragBoundsProperty: null,
      dragListenerOptions: {
        start: _.noop
      },
      keyboardDragListenerOptions: {},
      // highlight will only be visible if the component is interactive (provide dragBoundsProperty)
      interactiveHighlightEnabled: false,
      otherControls: [],
      includePlayPauseResetButtons: true,
      visibleProperty: stopwatch.isVisibleProperty,
      // Tandem is required to make sure the buttons are instrumented
      tandem: Tandem.REQUIRED,
      phetioFeatured: true
    }, providedOptions);
    assert && assert(!options.hasOwnProperty('maxValue'), 'options.maxValue no longer supported');
    assert && assert(options.xSpacing >= 0, 'Buttons cannot overlap');
    assert && assert(options.ySpacing >= 0, 'Buttons cannot overlap the readout');
    const numberDisplay = new NumberDisplay(stopwatch.timeProperty, options.numberDisplayRange, options.numberDisplayOptions);
    let playPauseResetButtonContainer = null;
    let disposePlayPauseResetButtons = null;
    if (options.includePlayPauseResetButtons) {
      // Buttons ----------------------------------------------------------------------------

      const resetPath = new Path(new UTurnArrowShape(options.iconHeight), {
        fill: options.iconFill
      });
      const playIconHeight = resetPath.height;
      const playIconWidth = 0.8 * playIconHeight;
      const playPath = new Path(new PlayIconShape(playIconWidth, playIconHeight), {
        fill: options.iconFill
      });
      const pausePath = new Path(new PauseIconShape(0.75 * playIconWidth, playIconHeight), {
        fill: options.iconFill
      });
      const playPauseButton = new BooleanRectangularToggleButton(stopwatch.isRunningProperty, pausePath, playPath, combineOptions({
        baseColor: options.buttonBaseColor,
        touchAreaXDilation: 5,
        touchAreaXShift: 5,
        touchAreaYDilation: 8,
        tandem: options.tandem.createTandem('playPauseButton'),
        phetioVisiblePropertyInstrumented: false,
        phetioEnabledPropertyInstrumented: false
      }, options.playPauseButtonOptions));
      const resetButton = new RectangularPushButton(combineOptions({
        listener: () => {
          stopwatch.isRunningProperty.set(false);
          stopwatch.timeProperty.set(0);
        },
        touchAreaXDilation: 5,
        touchAreaXShift: -5,
        touchAreaYDilation: 8,
        content: resetPath,
        baseColor: options.buttonBaseColor,
        soundPlayer: options.resetButtonSoundPlayer,
        tandem: options.tandem.createTandem('resetButton'),
        phetioVisiblePropertyInstrumented: false,
        phetioEnabledPropertyInstrumented: false
      }, options.resetButtonOptions));
      playPauseResetButtonContainer = new HBox({
        spacing: options.xSpacing,
        children: [resetButton, playPauseButton]
      });

      // Disable the reset button when time is zero, and enable the play/pause button when not at the max time
      const timeListener = time => {
        resetButton.enabled = time > 0;
        playPauseButton.enabled = time < stopwatch.timeProperty.range.max;
      };
      stopwatch.timeProperty.link(timeListener);
      disposePlayPauseResetButtons = () => {
        stopwatch.timeProperty.unlink(timeListener);
        resetButton.dispose();
        playPauseButton.dispose();
      };
    }
    const contents = new VBox({
      spacing: options.ySpacing,
      children: [numberDisplay,
      // Include the play/pause and reset buttons if specified in the options
      ...(playPauseResetButtonContainer ? [playPauseResetButtonContainer] : []),
      // Include any additional controls as specified
      ...options.otherControls]
    });

    // Background panel ----------------------------------------------------------------------------

    const backgroundNode = new Node();
    contents.boundsProperty.link(() => {
      const bounds = new Bounds2(-options.xMargin, -options.yMargin, contents.width + options.xMargin, contents.height + options.yMargin);
      backgroundNode.children = [new ShadedRectangle(bounds, {
        baseColor: options.backgroundBaseColor,
        tagName: 'div',
        focusable: true
      })];
    });
    options.children = [backgroundNode, contents];
    super(options);

    // Put a red dot at the origin, for debugging layout.
    if (phet.chipper.queryParameters.dev) {
      this.addChild(new Circle(3, {
        fill: 'red'
      }));
    }
    const stopwatchVisibleListener = visible => {
      if (visible) {
        this.moveToFront();
      } else {
        // interrupt user interactions when the stopwatch is made invisible
        this.interruptSubtreeInput();
      }
    };
    stopwatch.isVisibleProperty.link(stopwatchVisibleListener);

    // Move to the stopwatch's position
    const stopwatchPositionListener = position => this.setTranslation(position);
    stopwatch.positionProperty.link(stopwatchPositionListener);
    this.dragListener = null;
    this.keyboardDragListener = null;
    let adjustedDragBoundsProperty = null;
    if (options.dragBoundsProperty) {
      // interactive highlights - adding a DragListener to make this interactive, enable highlights for mouse and touch
      this.interactiveHighlightEnabled = true;

      // Adjustment to keep the entire StopwatchNode inside the drag bounds.
      adjustedDragBoundsProperty = new DerivedProperty([this.boundsProperty, options.dragBoundsProperty], (thisBounds, dragBounds) => {
        // Get the origin in the parent coordinate frame, to determine our bounds offsets in that coordinate frame.
        // This way we'll properly handle scaling/rotation/etc.
        const targetOriginInParentCoordinates = this.localToParentPoint(Vector2.ZERO);
        return new Bounds2(dragBounds.minX - (thisBounds.minX - targetOriginInParentCoordinates.x), dragBounds.minY - (thisBounds.minY - targetOriginInParentCoordinates.y), dragBounds.maxX - (thisBounds.maxX - targetOriginInParentCoordinates.x), dragBounds.maxY - (thisBounds.maxY - targetOriginInParentCoordinates.y));
      }, {
        valueComparisonStrategy: 'equalsFunction',
        // Don't make spurious changes, we often won't be changing.
        strictAxonDependencies: false // see https://github.com/phetsims/scenery-phet/issues/832
      });

      // interrupt user interactions when the visible bounds changes, such as a device orientation change or window resize
      options.dragBoundsProperty.link(() => this.interruptSubtreeInput());

      // If the stopwatch is outside the drag bounds, move it inside.
      adjustedDragBoundsProperty.link(dragBounds => {
        if (!dragBounds.containsPoint(stopwatch.positionProperty.value)) {
          stopwatch.positionProperty.value = dragBounds.closestPointTo(stopwatch.positionProperty.value);
        }
      });

      // dragging, added to background so that other UI components get input events on touch devices
      const dragListenerOptions = combineOptions({
        targetNode: this,
        positionProperty: stopwatch.positionProperty,
        dragBoundsProperty: adjustedDragBoundsProperty,
        tandem: options.tandem.createTandem('dragListener')
      }, options.dragListenerOptions);

      // Add moveToFront to any start function that the client provided.
      const optionsStart = dragListenerOptions.start;
      dragListenerOptions.start = (event, listener) => {
        this.moveToFront();
        optionsStart(event, listener);
      };

      // Dragging, added to background so that other UI components get input events on touch devices.
      // If added to 'this', touchSnag will lock out listeners for other UI components.
      this.dragListener = new RichDragListener(dragListenerOptions);
      backgroundNode.addInputListener(this.dragListener);
      const keyboardDragListenerOptions = combineOptions({
        positionProperty: stopwatch.positionProperty,
        dragBoundsProperty: adjustedDragBoundsProperty,
        tandem: options.tandem.createTandem('keyboardDragListener')
      }, options.keyboardDragListenerOptions);
      this.keyboardDragListener = new RichKeyboardDragListener(keyboardDragListenerOptions);
      this.addInputListener(this.keyboardDragListener);

      // The group focus highlight makes it clear the stopwatch is highlighted even if the children are focused
      this.groupFocusHighlight = true;

      // Move to front on pointer down, anywhere on this Node, including interactive subcomponents.
      this.addInputListener({
        down: () => this.moveToFront()
      });
      backgroundNode.addInputListener({
        focus: () => this.moveToFront()
      });
    }
    this.addLinkedElement(stopwatch, {
      tandemName: 'stopwatch'
    });
    this.disposeStopwatchNode = () => {
      stopwatch.isVisibleProperty.unlink(stopwatchVisibleListener);
      stopwatch.positionProperty.unlink(stopwatchPositionListener);
      numberDisplay.dispose();
      if (this.dragListener) {
        backgroundNode.removeInputListener(this.dragListener);
        this.dragListener.dispose();
      }
      if (this.keyboardDragListener) {
        this.removeInputListener(this.keyboardDragListener);
        this.keyboardDragListener.dispose();
      }
      adjustedDragBoundsProperty && adjustedDragBoundsProperty.dispose();
      disposePlayPauseResetButtons && disposePlayPauseResetButtons();
    };
    this.numberDisplay = numberDisplay;

    // support for binder documentation, stripped out in builds and only runs when ?binder is specified
    assert && phet?.chipper?.queryParameters?.binder && InstanceRegistry.registerDataURL('scenery-phet', 'StopwatchNode', this);
  }
  dispose() {
    this.disposeStopwatchNode();
    super.dispose();
  }

  /**
   * Gets the centiseconds (hundredths-of-a-second) string for a time value.
   */
  static getDecimalPlaces(time, numberDecimalPlaces) {
    const max = Math.pow(10, numberDecimalPlaces);

    // Round to the nearest centisecond, see https://github.com/phetsims/masses-and-springs/issues/156
    time = Utils.roundSymmetric(time * max) / max;

    // Rounding after mod, in case there is floating-point error
    let decimalValue = `${Utils.roundSymmetric(time % 1 * max)}`;
    while (decimalValue.length < numberDecimalPlaces) {
      decimalValue = `0${decimalValue}`;
    }
    return `.${decimalValue}`;
  }

  /**
   * Creates a custom value for options.numberDisplayOptions.numberFormatter, passed to NumberDisplay. When using
   * this method, you will also need to use NumberDisplayOptions.numberFormatterDependencies, to tell NumberDisplay
   * about the dependencies herein. See https://github.com/phetsims/scenery-phet/issues/781.
   * This will typically be something like:
   *
   * numberFormatter: StopwatchNode.createRichTextNumberFormatter( {
   *   units: unitsProperty,
   *   ...
   * } ),
   * numberFormatterDependencies: [
   *   SceneryPhetStrings.stopwatchValueUnitsPatternStringProperty,
   *   unitsProperty
   * ],
   */
  static createRichTextNumberFormatter(providedOptions) {
    const options = optionize()({
      // If true, the time value is converted to minutes and seconds, and the format looks like 59:59.00.
      // If false, time is formatted as a decimal value, like 123.45
      showAsMinutesAndSeconds: true,
      numberOfDecimalPlaces: 2,
      bigNumberFont: 20,
      smallNumberFont: 14,
      unitsFont: 14,
      units: '',
      // Units cannot be baked into the i18n string because they can change independently
      valueUnitsPattern: SceneryPhetStrings.stopwatchValueUnitsPatternStringProperty
    }, providedOptions);
    return time => {
      const minutesAndSeconds = options.showAsMinutesAndSeconds ? toMinutesAndSeconds(time) : Math.floor(time);
      const centiseconds = StopwatchNode.getDecimalPlaces(time, options.numberOfDecimalPlaces);
      const units = typeof options.units === 'string' ? options.units : options.units.value;
      const fontSize = `${options.smallNumberFont}px`;

      // Single quotes around CSS style so the double-quotes in the CSS font family work. Himalaya doesn't like &quot;
      // See https://github.com/phetsims/collision-lab/issues/140.
      return StringUtils.fillIn(options.valueUnitsPattern, {
        value: `<span style='font-size: ${options.bigNumberFont}px; font-family:${StopwatchNode.NUMBER_FONT_FAMILY};'>${minutesAndSeconds}</span><span style='font-size: ${fontSize};font-family:${StopwatchNode.NUMBER_FONT_FAMILY};'>${centiseconds}</span>`,
        units: `<span style='font-size: ${options.unitsFont}px; font-family:${StopwatchNode.NUMBER_FONT_FAMILY};'>${units}</span>`
      });
    };
  }
}

/**
 * Converts a time to a string in {{minutes}}:{{seconds}} format.
 */
function toMinutesAndSeconds(time) {
  // Round to the nearest centi-part (if time is in seconds, this would be centiseconds)
  // see https://github.com/phetsims/masses-and-springs/issues/156
  time = Utils.roundSymmetric(time * 100) / 100;

  // When showing units, don't show the "00:" prefix, see https://github.com/phetsims/scenery-phet/issues/378
  const timeInSeconds = time;

  // If no units are provided, then we assume the time is in seconds, and should be shown in mm:ss.cs
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds) % 60;
  const minutesString = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const secondsString = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${minutesString}:${secondsString}`;
}
sceneryPhet.register('StopwatchNode', StopwatchNode);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb3VuZHMyIiwiVXRpbHMiLCJWZWN0b3IyIiwiSW5zdGFuY2VSZWdpc3RyeSIsIm9wdGlvbml6ZSIsImNvbWJpbmVPcHRpb25zIiwiU3RyaW5nVXRpbHMiLCJDaXJjbGUiLCJIQm94IiwiSW50ZXJhY3RpdmVIaWdobGlnaHRpbmciLCJOb2RlIiwiUGF0aCIsIlZCb3giLCJCb29sZWFuUmVjdGFuZ3VsYXJUb2dnbGVCdXR0b24iLCJSZWN0YW5ndWxhclB1c2hCdXR0b24iLCJUYW5kZW0iLCJOdW1iZXJEaXNwbGF5IiwiUGF1c2VJY29uU2hhcGUiLCJQaGV0Rm9udCIsIlBsYXlJY29uU2hhcGUiLCJzY2VuZXJ5UGhldCIsIlNjZW5lcnlQaGV0U3RyaW5ncyIsIlNoYWRlZFJlY3RhbmdsZSIsIlN0b3B3YXRjaCIsIlVUdXJuQXJyb3dTaGFwZSIsInB1c2hCdXR0b25Tb3VuZFBsYXllciIsIkRlcml2ZWRQcm9wZXJ0eSIsIlJpY2hEcmFnTGlzdGVuZXIiLCJSaWNoS2V5Ym9hcmREcmFnTGlzdGVuZXIiLCJTdG9wd2F0Y2hOb2RlIiwiTlVNQkVSX0ZPTlRfRkFNSUxZIiwiREVGQVVMVF9GT05UIiwic2l6ZSIsImZhbWlseSIsIlBMQUlOX1RFWFRfTUlOVVRFU19BTkRfU0VDT05EUyIsInRpbWUiLCJtaW51dGVzQW5kU2Vjb25kcyIsInRvTWludXRlc0FuZFNlY29uZHMiLCJjZW50aXNlY29uZHMiLCJnZXREZWNpbWFsUGxhY2VzIiwiUklDSF9URVhUX01JTlVURVNfQU5EX1NFQ09ORFMiLCJjcmVhdGVSaWNoVGV4dE51bWJlckZvcm1hdHRlciIsInNob3dBc01pbnV0ZXNBbmRTZWNvbmRzIiwibnVtYmVyT2ZEZWNpbWFsUGxhY2VzIiwiY29uc3RydWN0b3IiLCJzdG9wd2F0Y2giLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwiY3Vyc29yIiwibnVtYmVyRGlzcGxheVJhbmdlIiwiWkVST19UT19BTE1PU1RfU0lYVFkiLCJpY29uSGVpZ2h0IiwiaWNvbkZpbGwiLCJpY29uTGluZVdpZHRoIiwiYmFja2dyb3VuZEJhc2VDb2xvciIsImJ1dHRvbkJhc2VDb2xvciIsInJlc2V0QnV0dG9uU291bmRQbGF5ZXIiLCJ4U3BhY2luZyIsInlTcGFjaW5nIiwieE1hcmdpbiIsInlNYXJnaW4iLCJudW1iZXJEaXNwbGF5T3B0aW9ucyIsIm51bWJlckZvcm1hdHRlciIsIm51bWJlckZvcm1hdHRlckRlcGVuZGVuY2llcyIsInN0b3B3YXRjaFZhbHVlVW5pdHNQYXR0ZXJuU3RyaW5nUHJvcGVydHkiLCJ1c2VSaWNoVGV4dCIsInRleHRPcHRpb25zIiwiZm9udCIsImFsaWduIiwiY29ybmVyUmFkaXVzIiwibWF4V2lkdGgiLCJwaWNrYWJsZSIsImRyYWdCb3VuZHNQcm9wZXJ0eSIsImRyYWdMaXN0ZW5lck9wdGlvbnMiLCJzdGFydCIsIl8iLCJub29wIiwia2V5Ym9hcmREcmFnTGlzdGVuZXJPcHRpb25zIiwiaW50ZXJhY3RpdmVIaWdobGlnaHRFbmFibGVkIiwib3RoZXJDb250cm9scyIsImluY2x1ZGVQbGF5UGF1c2VSZXNldEJ1dHRvbnMiLCJ2aXNpYmxlUHJvcGVydHkiLCJpc1Zpc2libGVQcm9wZXJ0eSIsInRhbmRlbSIsIlJFUVVJUkVEIiwicGhldGlvRmVhdHVyZWQiLCJhc3NlcnQiLCJoYXNPd25Qcm9wZXJ0eSIsIm51bWJlckRpc3BsYXkiLCJ0aW1lUHJvcGVydHkiLCJwbGF5UGF1c2VSZXNldEJ1dHRvbkNvbnRhaW5lciIsImRpc3Bvc2VQbGF5UGF1c2VSZXNldEJ1dHRvbnMiLCJyZXNldFBhdGgiLCJmaWxsIiwicGxheUljb25IZWlnaHQiLCJoZWlnaHQiLCJwbGF5SWNvbldpZHRoIiwicGxheVBhdGgiLCJwYXVzZVBhdGgiLCJwbGF5UGF1c2VCdXR0b24iLCJpc1J1bm5pbmdQcm9wZXJ0eSIsImJhc2VDb2xvciIsInRvdWNoQXJlYVhEaWxhdGlvbiIsInRvdWNoQXJlYVhTaGlmdCIsInRvdWNoQXJlYVlEaWxhdGlvbiIsImNyZWF0ZVRhbmRlbSIsInBoZXRpb1Zpc2libGVQcm9wZXJ0eUluc3RydW1lbnRlZCIsInBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCIsInBsYXlQYXVzZUJ1dHRvbk9wdGlvbnMiLCJyZXNldEJ1dHRvbiIsImxpc3RlbmVyIiwic2V0IiwiY29udGVudCIsInNvdW5kUGxheWVyIiwicmVzZXRCdXR0b25PcHRpb25zIiwic3BhY2luZyIsImNoaWxkcmVuIiwidGltZUxpc3RlbmVyIiwiZW5hYmxlZCIsInJhbmdlIiwibWF4IiwibGluayIsInVubGluayIsImRpc3Bvc2UiLCJjb250ZW50cyIsImJhY2tncm91bmROb2RlIiwiYm91bmRzUHJvcGVydHkiLCJib3VuZHMiLCJ3aWR0aCIsInRhZ05hbWUiLCJmb2N1c2FibGUiLCJwaGV0IiwiY2hpcHBlciIsInF1ZXJ5UGFyYW1ldGVycyIsImRldiIsImFkZENoaWxkIiwic3RvcHdhdGNoVmlzaWJsZUxpc3RlbmVyIiwidmlzaWJsZSIsIm1vdmVUb0Zyb250IiwiaW50ZXJydXB0U3VidHJlZUlucHV0Iiwic3RvcHdhdGNoUG9zaXRpb25MaXN0ZW5lciIsInBvc2l0aW9uIiwic2V0VHJhbnNsYXRpb24iLCJwb3NpdGlvblByb3BlcnR5IiwiZHJhZ0xpc3RlbmVyIiwia2V5Ym9hcmREcmFnTGlzdGVuZXIiLCJhZGp1c3RlZERyYWdCb3VuZHNQcm9wZXJ0eSIsInRoaXNCb3VuZHMiLCJkcmFnQm91bmRzIiwidGFyZ2V0T3JpZ2luSW5QYXJlbnRDb29yZGluYXRlcyIsImxvY2FsVG9QYXJlbnRQb2ludCIsIlpFUk8iLCJtaW5YIiwieCIsIm1pblkiLCJ5IiwibWF4WCIsIm1heFkiLCJ2YWx1ZUNvbXBhcmlzb25TdHJhdGVneSIsInN0cmljdEF4b25EZXBlbmRlbmNpZXMiLCJjb250YWluc1BvaW50IiwidmFsdWUiLCJjbG9zZXN0UG9pbnRUbyIsInRhcmdldE5vZGUiLCJvcHRpb25zU3RhcnQiLCJldmVudCIsImFkZElucHV0TGlzdGVuZXIiLCJncm91cEZvY3VzSGlnaGxpZ2h0IiwiZG93biIsImZvY3VzIiwiYWRkTGlua2VkRWxlbWVudCIsInRhbmRlbU5hbWUiLCJkaXNwb3NlU3RvcHdhdGNoTm9kZSIsInJlbW92ZUlucHV0TGlzdGVuZXIiLCJiaW5kZXIiLCJyZWdpc3RlckRhdGFVUkwiLCJudW1iZXJEZWNpbWFsUGxhY2VzIiwiTWF0aCIsInBvdyIsInJvdW5kU3ltbWV0cmljIiwiZGVjaW1hbFZhbHVlIiwibGVuZ3RoIiwiYmlnTnVtYmVyRm9udCIsInNtYWxsTnVtYmVyRm9udCIsInVuaXRzRm9udCIsInVuaXRzIiwidmFsdWVVbml0c1BhdHRlcm4iLCJmbG9vciIsImZvbnRTaXplIiwiZmlsbEluIiwidGltZUluU2Vjb25kcyIsIm1pbnV0ZXMiLCJzZWNvbmRzIiwibWludXRlc1N0cmluZyIsInNlY29uZHNTdHJpbmciLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlN0b3B3YXRjaE5vZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTQtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogU2hvd3MgYSByZWFkb3V0IG9mIHRoZSBlbGFwc2VkIHRpbWUsIHdpdGggcGxheSBhbmQgcGF1c2UgYnV0dG9ucy4gIEJ5IGRlZmF1bHQgdGhlcmUgYXJlIG5vIHVuaXRzICh3aGljaCBjb3VsZCBiZSB1c2VkXHJcbiAqIGlmIGFsbCBvZiBhIHNpbXVsYXRpb25zIHRpbWUgdW5pdHMgYXJlIGluICdzZWNvbmRzJyksIG9yIHlvdSBjYW4gc3BlY2lmeSBhIHNlbGVjdGlvbiBvZiB1bml0cyB0byBjaG9vc2UgZnJvbS5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIEFudG9uIFVseWFub3YgKE1sZWFybmVyKVxyXG4gKi9cclxuXHJcbmltcG9ydCBQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IFN0cmljdE9taXQgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1N0cmljdE9taXQuanMnO1xyXG5pbXBvcnQgUmFuZ2UgZnJvbSAnLi4vLi4vZG90L2pzL1JhbmdlLmpzJztcclxuaW1wb3J0IEJvdW5kczIgZnJvbSAnLi4vLi4vZG90L2pzL0JvdW5kczIuanMnO1xyXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vZG90L2pzL1V0aWxzLmpzJztcclxuaW1wb3J0IFZlY3RvcjIgZnJvbSAnLi4vLi4vZG90L2pzL1ZlY3RvcjIuanMnO1xyXG5pbXBvcnQgSW5zdGFuY2VSZWdpc3RyeSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvZG9jdW1lbnRhdGlvbi9JbnN0YW5jZVJlZ2lzdHJ5LmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBjb21iaW5lT3B0aW9ucyB9IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgU3RyaW5nVXRpbHMgZnJvbSAnLi4vLi4vcGhldGNvbW1vbi9qcy91dGlsL1N0cmluZ1V0aWxzLmpzJztcclxuaW1wb3J0IHsgQ2lyY2xlLCBEcmFnTGlzdGVuZXIsIEhCb3gsIEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nLCBJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZ09wdGlvbnMsIEtleWJvYXJkRHJhZ0xpc3RlbmVyLCBOb2RlLCBOb2RlT3B0aW9ucywgUGF0aCwgUHJlc3NMaXN0ZW5lckV2ZW50LCBUQ29sb3IsIFZCb3ggfSBmcm9tICcuLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgQm9vbGVhblJlY3Rhbmd1bGFyVG9nZ2xlQnV0dG9uLCB7IEJvb2xlYW5SZWN0YW5ndWxhclRvZ2dsZUJ1dHRvbk9wdGlvbnMgfSBmcm9tICcuLi8uLi9zdW4vanMvYnV0dG9ucy9Cb29sZWFuUmVjdGFuZ3VsYXJUb2dnbGVCdXR0b24uanMnO1xyXG5pbXBvcnQgUmVjdGFuZ3VsYXJQdXNoQnV0dG9uLCB7IFJlY3Rhbmd1bGFyUHVzaEJ1dHRvbk9wdGlvbnMgfSBmcm9tICcuLi8uLi9zdW4vanMvYnV0dG9ucy9SZWN0YW5ndWxhclB1c2hCdXR0b24uanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgTnVtYmVyRGlzcGxheSwgeyBOdW1iZXJEaXNwbGF5T3B0aW9ucyB9IGZyb20gJy4vTnVtYmVyRGlzcGxheS5qcyc7XHJcbmltcG9ydCBQYXVzZUljb25TaGFwZSBmcm9tICcuL1BhdXNlSWNvblNoYXBlLmpzJztcclxuaW1wb3J0IFBoZXRGb250IGZyb20gJy4vUGhldEZvbnQuanMnO1xyXG5pbXBvcnQgUGxheUljb25TaGFwZSBmcm9tICcuL1BsYXlJY29uU2hhcGUuanMnO1xyXG5pbXBvcnQgc2NlbmVyeVBoZXQgZnJvbSAnLi9zY2VuZXJ5UGhldC5qcyc7XHJcbmltcG9ydCBTY2VuZXJ5UGhldFN0cmluZ3MgZnJvbSAnLi9TY2VuZXJ5UGhldFN0cmluZ3MuanMnO1xyXG5pbXBvcnQgU2hhZGVkUmVjdGFuZ2xlIGZyb20gJy4vU2hhZGVkUmVjdGFuZ2xlLmpzJztcclxuaW1wb3J0IFN0b3B3YXRjaCBmcm9tICcuL1N0b3B3YXRjaC5qcyc7XHJcbmltcG9ydCBVVHVybkFycm93U2hhcGUgZnJvbSAnLi9VVHVybkFycm93U2hhcGUuanMnO1xyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUU291bmRQbGF5ZXIgZnJvbSAnLi4vLi4vdGFtYm8vanMvVFNvdW5kUGxheWVyLmpzJztcclxuaW1wb3J0IHB1c2hCdXR0b25Tb3VuZFBsYXllciBmcm9tICcuLi8uLi90YW1iby9qcy9zaGFyZWQtc291bmQtcGxheWVycy9wdXNoQnV0dG9uU291bmRQbGF5ZXIuanMnO1xyXG5pbXBvcnQgRGVyaXZlZFByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvRGVyaXZlZFByb3BlcnR5LmpzJztcclxuaW1wb3J0IFJpY2hEcmFnTGlzdGVuZXIsIHsgUHJlc3NlZFJpY2hEcmFnTGlzdGVuZXIsIFJpY2hEcmFnTGlzdGVuZXJPcHRpb25zIH0gZnJvbSAnLi4vLi4vc2NlbmVyeS1waGV0L2pzL1JpY2hEcmFnTGlzdGVuZXIuanMnO1xyXG5pbXBvcnQgUmljaEtleWJvYXJkRHJhZ0xpc3RlbmVyLCB7IFJpY2hLZXlib2FyZERyYWdMaXN0ZW5lck9wdGlvbnMgfSBmcm9tICcuLi8uLi9zY2VuZXJ5LXBoZXQvanMvUmljaEtleWJvYXJkRHJhZ0xpc3RlbmVyLmpzJztcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcblxyXG4gIGN1cnNvcj86IHN0cmluZztcclxuICBudW1iZXJEaXNwbGF5UmFuZ2U/OiBSYW5nZTsgLy8gdXNlZCB0byBzaXplIHRoZSBOdW1iZXJEaXNwbGF5XHJcbiAgaWNvbkhlaWdodD86IG51bWJlcjtcclxuICBpY29uRmlsbD86IFRDb2xvcjtcclxuICBpY29uTGluZVdpZHRoPzogbnVtYmVyO1xyXG4gIGJhY2tncm91bmRCYXNlQ29sb3I/OiBUQ29sb3I7XHJcbiAgYnV0dG9uQmFzZUNvbG9yPzogVENvbG9yO1xyXG4gIHJlc2V0QnV0dG9uU291bmRQbGF5ZXI/OiBUU291bmRQbGF5ZXI7XHJcbiAgeFNwYWNpbmc/OiBudW1iZXI7IC8vIGhvcml6b250YWwgc3BhY2UgYmV0d2VlbiB0aGUgYnV0dG9uc1xyXG4gIHlTcGFjaW5nPzogbnVtYmVyOyAvLyB2ZXJ0aWNhbCBzcGFjZSBiZXR3ZWVuIHJlYWRvdXQgYW5kIGJ1dHRvbnNcclxuICB4TWFyZ2luPzogbnVtYmVyO1xyXG4gIHlNYXJnaW4/OiBudW1iZXI7XHJcblxyXG4gIG51bWJlckRpc3BsYXlPcHRpb25zPzogTnVtYmVyRGlzcGxheU9wdGlvbnM7XHJcblxyXG4gIC8vIElmIHByb3ZpZGVkLCB0aGUgc3RvcHdhdGNoIGlzIGRyYWdnYWJsZSB3aXRoaW4gdGhlIGJvdW5kcy4gSWYgbnVsbCwgdGhlIHN0b3B3YXRjaCBpcyBub3QgZHJhZ2dhYmxlLlxyXG4gIGRyYWdCb3VuZHNQcm9wZXJ0eT86IFByb3BlcnR5PEJvdW5kczI+IHwgbnVsbDtcclxuXHJcbiAgLy8gb3B0aW9ucyBwcm9wYWdhdGVkIHRvIHRoZSBkcmFnIGxpc3RlbmVyc1xyXG4gIGRyYWdMaXN0ZW5lck9wdGlvbnM/OiBSaWNoRHJhZ0xpc3RlbmVyT3B0aW9ucztcclxuICBrZXlib2FyZERyYWdMaXN0ZW5lck9wdGlvbnM/OiBSaWNoS2V5Ym9hcmREcmFnTGlzdGVuZXJPcHRpb25zO1xyXG5cclxuICAvLyBQYXNzZWQgdG8gdGhlaXIgcmVzcGVjdGl2ZSBidXR0b25zXHJcbiAgcGxheVBhdXNlQnV0dG9uT3B0aW9ucz86IEJvb2xlYW5SZWN0YW5ndWxhclRvZ2dsZUJ1dHRvbk9wdGlvbnM7XHJcbiAgcmVzZXRCdXR0b25PcHRpb25zPzogUmVjdGFuZ3VsYXJQdXNoQnV0dG9uT3B0aW9ucztcclxuXHJcbiAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5LXBoZXQvaXNzdWVzLzg0M1xyXG4gIGluY2x1ZGVQbGF5UGF1c2VSZXNldEJ1dHRvbnM/OiBib29sZWFuO1xyXG5cclxuICAvLyBBZGRpdGlvbmFsIGNvbnRyb2xzIHRvIHNob3cgYmVsb3cgdGhlIHBsYXkvcGF1c2UvcmV3aW5kIGJ1dHRvbnMgaW4gdGhhdCBWQm94LlxyXG4gIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS1waGV0L2lzc3Vlcy84NDNcclxuICBvdGhlckNvbnRyb2xzPzogTm9kZVtdO1xyXG59O1xyXG5cclxudHlwZSBQYXJlbnRPcHRpb25zID0gSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdPcHRpb25zICYgTm9kZU9wdGlvbnM7XHJcbmV4cG9ydCB0eXBlIFN0b3B3YXRjaE5vZGVPcHRpb25zID0gU2VsZk9wdGlvbnMgJiBTdHJpY3RPbWl0PFBhcmVudE9wdGlvbnMsICdjaGlsZHJlbicgfCAnaW50ZXJhY3RpdmVIaWdobGlnaHRFbmFibGVkJz47XHJcblxyXG50eXBlIEZvcm1hdHRlck9wdGlvbnMgPSB7XHJcblxyXG4gIC8vIElmIHRydWUsIHRoZSB0aW1lIHZhbHVlIGlzIGNvbnZlcnRlZCB0byBtaW51dGVzIGFuZCBzZWNvbmRzLCBhbmQgdGhlIGZvcm1hdCBsb29rcyBsaWtlIDU5OjU5LjAwLlxyXG4gIC8vIElmIGZhbHNlLCB0aW1lIGlzIGZvcm1hdHRlZCBhcyBhIGRlY2ltYWwgdmFsdWUsIGxpa2UgMTIzLjQ1XHJcbiAgc2hvd0FzTWludXRlc0FuZFNlY29uZHM/OiBib29sZWFuO1xyXG4gIG51bWJlck9mRGVjaW1hbFBsYWNlcz86IG51bWJlcjtcclxuICBiaWdOdW1iZXJGb250PzogbnVtYmVyO1xyXG4gIHNtYWxsTnVtYmVyRm9udD86IG51bWJlcjtcclxuICB1bml0c0ZvbnQ/OiBudW1iZXI7XHJcbiAgdW5pdHM/OiBzdHJpbmcgfCBUUmVhZE9ubHlQcm9wZXJ0eTxzdHJpbmc+O1xyXG4gIHZhbHVlVW5pdHNQYXR0ZXJuPzogc3RyaW5nIHwgVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nPjtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFN0b3B3YXRjaE5vZGUgZXh0ZW5kcyBJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZyggTm9kZSApIHtcclxuXHJcbiAgLy8gb3B0aW9ucyBwcm9wYWdhdGVkIHRvIHRoZSBOdW1iZXJEaXNwbGF5XHJcbiAgcHJpdmF0ZSByZWFkb25seSBudW1iZXJEaXNwbGF5OiBOdW1iZXJEaXNwbGF5O1xyXG5cclxuICAvLyBOb24tbnVsbCBpZiBkcmFnZ2FibGUuIENhbiBiZSB1c2VkIGZvciBmb3J3YXJkaW5nIHByZXNzIGV2ZW50cyB3aGVuIGRyYWdnaW5nIG91dCBvZiBhIHRvb2xib3guXHJcbiAgcHVibGljIHJlYWRvbmx5IGRyYWdMaXN0ZW5lcjogRHJhZ0xpc3RlbmVyIHwgbnVsbDtcclxuICBwdWJsaWMgcmVhZG9ubHkga2V5Ym9hcmREcmFnTGlzdGVuZXI6IEtleWJvYXJkRHJhZ0xpc3RlbmVyIHwgbnVsbDtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNwb3NlU3RvcHdhdGNoTm9kZTogKCkgPT4gdm9pZDtcclxuXHJcbiAgLy8gV2UgdXNlZCB0byB1c2UgTHVjaWRhIENvbnNvbGUsIEFyaWFsLCBidXQgQXJpYWwgaGFzIHNtYWxsZXIgbnVtYmVyIHdpZHRoIGZvciBcIjExXCIgYW5kIGhlbmNlIHdhcyBjYXVzaW5nIGppdHRlci5cclxuICAvLyBOZWl0aGVyIFRyZWJ1Y2hldCBNUyBhbmQgTHVjaWRhIEdyYW5kZSBpcyBhIG1vbm9zcGFjZSBmb250LCBidXQgdGhlIGRpZ2l0cyBhbGwgYXBwZWFyIHRvIGJlIG1vbm9zcGFjZS5cclxuICAvLyBVc2UgVHJlYnVjaGV0IGZpcnN0LCBzaW5jZSBpdCBoYXMgYnJvYWRlciBjcm9zcy1wbGF0Zm9ybSBzdXBwb3J0LlxyXG4gIC8vIEFub3RoZXIgYWR2YW50YWdlIG9mIHVzaW5nIGEgbm9uLW1vbm9zcGFjZSBmb250ICh3aXRoIG1vbm9zcGFjZSBkaWdpdHMpIGlzIHRoYXQgdGhlIDogYW5kIC4gc3ltYm9scyBhcmVuJ3QgYXNcclxuICAvLyB3aWRlIGFzIHRoZSBudW1lcmFscy4gQGFyaWVsLXBoZXQgYW5kIEBzYW1yZWlkIHRlc3RlZCB0aGlzIGNvbWJpbmF0aW9uIG9mIGZhbWlsaWVzIG9uIE1hYy9DaHJvbWUgYW5kIFdpbmRvd3MvQ2hyb21lXHJcbiAgLy8gYW5kIGl0IHNlZW1lZCB0byB3b3JrIG5pY2VseSwgd2l0aCBubyBqaXR0ZXIuXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBOVU1CRVJfRk9OVF9GQU1JTFkgPSAnXCJUcmVidWNoZXQgTVNcIiwgXCJMdWNpZGEgR3JhbmRlXCIsIG1vbm9zcGFjZSc7XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9GT05UID0gbmV3IFBoZXRGb250KCB7IHNpemU6IDIwLCBmYW1pbHk6IFN0b3B3YXRjaE5vZGUuTlVNQkVSX0ZPTlRfRkFNSUxZIH0gKTtcclxuXHJcbiAgLyoqXHJcbiAgICogQSB2YWx1ZSBmb3Igb3B0aW9ucy5udW1iZXJEaXNwbGF5T3B0aW9ucy5udW1iZXJGb3JtYXR0ZXIgd2hlcmUgdGltZSBpcyBpbnRlcnByZXRlZCBhcyBtaW51dGVzIGFuZCBzZWNvbmRzLlxyXG4gICAqIFRoZSBmb3JtYXQgaXMgTU06U1MuQ0MsIHdoZXJlIE09bWludXRlcywgUz1zZWNvbmRzLCBDPWNlbnRpc2Vjb25kcy4gVGhlIHJldHVybmVkIHN0cmluZyBpcyBwbGFpbiB0ZXh0LCBzbyBhbGxcclxuICAgKiBkaWdpdHMgd2lsbCBiZSB0aGUgc2FtZSBzaXplLCBhbmQgdGhlIGNsaWVudCBpcyByZXNwb25zaWJsZSBmb3Igc2V0dGluZyB0aGUgZm9udCBzaXplLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgUExBSU5fVEVYVF9NSU5VVEVTX0FORF9TRUNPTkRTID0gKCB0aW1lOiBudW1iZXIgKTogc3RyaW5nID0+IHtcclxuICAgIGNvbnN0IG1pbnV0ZXNBbmRTZWNvbmRzID0gdG9NaW51dGVzQW5kU2Vjb25kcyggdGltZSApO1xyXG4gICAgY29uc3QgY2VudGlzZWNvbmRzID0gU3RvcHdhdGNoTm9kZS5nZXREZWNpbWFsUGxhY2VzKCB0aW1lLCAyICk7XHJcbiAgICByZXR1cm4gbWludXRlc0FuZFNlY29uZHMgKyBjZW50aXNlY29uZHM7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQSB2YWx1ZSBmb3Igb3B0aW9ucy5udW1iZXJEaXNwbGF5T3B0aW9ucy5udW1iZXJGb3JtYXR0ZXIgd2hlcmUgdGltZSBpcyBpbnRlcnByZXRlZCBhcyBtaW51dGVzIGFuZCBzZWNvbmRzLlxyXG4gICAqIFRoZSBmb3JtYXQgaXMgZm9ybWF0IE1NOlNTLmNjLCB3aGVyZSBNPW1pbnV0ZXMsIFM9c2Vjb25kcywgYz1jZW50aXNlY29uZHMuIFRoZSBzdHJpbmcgcmV0dXJuZWQgaXMgaW4gUmljaFRleHRcclxuICAgKiBmb3JtYXQsIHdpdGggdGhlICdjJyBkaWdpdHMgaW4gYSBzbWFsbGVyIGZvbnQuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBSSUNIX1RFWFRfTUlOVVRFU19BTkRfU0VDT05EUyA9IFN0b3B3YXRjaE5vZGUuY3JlYXRlUmljaFRleHROdW1iZXJGb3JtYXR0ZXIoIHtcclxuICAgIHNob3dBc01pbnV0ZXNBbmRTZWNvbmRzOiB0cnVlLFxyXG4gICAgbnVtYmVyT2ZEZWNpbWFsUGxhY2VzOiAyXHJcbiAgfSApO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHN0b3B3YXRjaDogU3RvcHdhdGNoLCBwcm92aWRlZE9wdGlvbnM/OiBTdG9wd2F0Y2hOb2RlT3B0aW9ucyApIHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPFN0b3B3YXRjaE5vZGVPcHRpb25zLCBTdHJpY3RPbWl0PFNlbGZPcHRpb25zLCAncGxheVBhdXNlQnV0dG9uT3B0aW9ucycgfCAncmVzZXRCdXR0b25PcHRpb25zJz4sIFBhcmVudE9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgIC8vIFNlbGZPcHRpb25zXHJcbiAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxyXG4gICAgICBudW1iZXJEaXNwbGF5UmFuZ2U6IFN0b3B3YXRjaC5aRVJPX1RPX0FMTU9TVF9TSVhUWSwgLy8gc2l6ZWQgZm9yIDU5OjU5Ljk5IChtbTpzcykgb3IgMzU5OS45OSAoZGVjaW1hbClcclxuICAgICAgaWNvbkhlaWdodDogMTAsXHJcbiAgICAgIGljb25GaWxsOiAnYmxhY2snLFxyXG4gICAgICBpY29uTGluZVdpZHRoOiAxLFxyXG4gICAgICBiYWNrZ3JvdW5kQmFzZUNvbG9yOiAncmdiKCA4MCwgMTMwLCAyMzAgKScsXHJcbiAgICAgIGJ1dHRvbkJhc2VDb2xvcjogJyNERkUwRTEnLFxyXG4gICAgICByZXNldEJ1dHRvblNvdW5kUGxheWVyOiBwdXNoQnV0dG9uU291bmRQbGF5ZXIsXHJcbiAgICAgIHhTcGFjaW5nOiA2LCAvLyBob3Jpem9udGFsIHNwYWNlIGJldHdlZW4gdGhlIGJ1dHRvbnNcclxuICAgICAgeVNwYWNpbmc6IDYsIC8vIHZlcnRpY2FsIHNwYWNlIGJldHdlZW4gcmVhZG91dCBhbmQgYnV0dG9uc1xyXG4gICAgICB4TWFyZ2luOiA4LFxyXG4gICAgICB5TWFyZ2luOiA4LFxyXG4gICAgICBudW1iZXJEaXNwbGF5T3B0aW9uczoge1xyXG4gICAgICAgIG51bWJlckZvcm1hdHRlcjogU3RvcHdhdGNoTm9kZS5SSUNIX1RFWFRfTUlOVVRFU19BTkRfU0VDT05EUyxcclxuICAgICAgICBudW1iZXJGb3JtYXR0ZXJEZXBlbmRlbmNpZXM6IFtcclxuXHJcbiAgICAgICAgICAvLyBVc2VkIGluIHRoZSBudW1iZXJGb3JtYXR0ZXIgYWJvdmVcclxuICAgICAgICAgIFNjZW5lcnlQaGV0U3RyaW5ncy5zdG9wd2F0Y2hWYWx1ZVVuaXRzUGF0dGVyblN0cmluZ1Byb3BlcnR5XHJcbiAgICAgICAgXSxcclxuICAgICAgICB1c2VSaWNoVGV4dDogdHJ1ZSxcclxuICAgICAgICB0ZXh0T3B0aW9uczoge1xyXG4gICAgICAgICAgZm9udDogU3RvcHdhdGNoTm9kZS5ERUZBVUxUX0ZPTlRcclxuICAgICAgICB9LFxyXG4gICAgICAgIGFsaWduOiAncmlnaHQnLFxyXG4gICAgICAgIGNvcm5lclJhZGl1czogNCxcclxuICAgICAgICB4TWFyZ2luOiA0LFxyXG4gICAgICAgIHlNYXJnaW46IDIsXHJcbiAgICAgICAgbWF4V2lkdGg6IDE1MCwgLy8gcGxlYXNlIG92ZXJyaWRlIGFzIG5lY2Vzc2FyeVxyXG4gICAgICAgIHBpY2thYmxlOiBmYWxzZSAvLyBhbGxvdyBkcmFnZ2luZyBieSB0aGUgbnVtYmVyIGRpc3BsYXlcclxuICAgICAgfSxcclxuICAgICAgZHJhZ0JvdW5kc1Byb3BlcnR5OiBudWxsLFxyXG4gICAgICBkcmFnTGlzdGVuZXJPcHRpb25zOiB7XHJcbiAgICAgICAgc3RhcnQ6IF8ubm9vcFxyXG4gICAgICB9LFxyXG4gICAgICBrZXlib2FyZERyYWdMaXN0ZW5lck9wdGlvbnM6IHt9LFxyXG5cclxuICAgICAgLy8gaGlnaGxpZ2h0IHdpbGwgb25seSBiZSB2aXNpYmxlIGlmIHRoZSBjb21wb25lbnQgaXMgaW50ZXJhY3RpdmUgKHByb3ZpZGUgZHJhZ0JvdW5kc1Byb3BlcnR5KVxyXG4gICAgICBpbnRlcmFjdGl2ZUhpZ2hsaWdodEVuYWJsZWQ6IGZhbHNlLFxyXG5cclxuICAgICAgb3RoZXJDb250cm9sczogW10sXHJcblxyXG4gICAgICBpbmNsdWRlUGxheVBhdXNlUmVzZXRCdXR0b25zOiB0cnVlLFxyXG4gICAgICB2aXNpYmxlUHJvcGVydHk6IHN0b3B3YXRjaC5pc1Zpc2libGVQcm9wZXJ0eSxcclxuXHJcbiAgICAgIC8vIFRhbmRlbSBpcyByZXF1aXJlZCB0byBtYWtlIHN1cmUgdGhlIGJ1dHRvbnMgYXJlIGluc3RydW1lbnRlZFxyXG4gICAgICB0YW5kZW06IFRhbmRlbS5SRVFVSVJFRCxcclxuICAgICAgcGhldGlvRmVhdHVyZWQ6IHRydWVcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIW9wdGlvbnMuaGFzT3duUHJvcGVydHkoICdtYXhWYWx1ZScgKSwgJ29wdGlvbnMubWF4VmFsdWUgbm8gbG9uZ2VyIHN1cHBvcnRlZCcgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLnhTcGFjaW5nID49IDAsICdCdXR0b25zIGNhbm5vdCBvdmVybGFwJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy55U3BhY2luZyA+PSAwLCAnQnV0dG9ucyBjYW5ub3Qgb3ZlcmxhcCB0aGUgcmVhZG91dCcgKTtcclxuXHJcbiAgICBjb25zdCBudW1iZXJEaXNwbGF5ID0gbmV3IE51bWJlckRpc3BsYXkoIHN0b3B3YXRjaC50aW1lUHJvcGVydHksIG9wdGlvbnMubnVtYmVyRGlzcGxheVJhbmdlLCBvcHRpb25zLm51bWJlckRpc3BsYXlPcHRpb25zICk7XHJcblxyXG4gICAgbGV0IHBsYXlQYXVzZVJlc2V0QnV0dG9uQ29udGFpbmVyOiBOb2RlIHwgbnVsbCA9IG51bGw7XHJcbiAgICBsZXQgZGlzcG9zZVBsYXlQYXVzZVJlc2V0QnV0dG9uczogKCAoKSA9PiB2b2lkICkgfCBudWxsID0gbnVsbDtcclxuICAgIGlmICggb3B0aW9ucy5pbmNsdWRlUGxheVBhdXNlUmVzZXRCdXR0b25zICkge1xyXG5cclxuICAgICAgLy8gQnV0dG9ucyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgICBjb25zdCByZXNldFBhdGggPSBuZXcgUGF0aCggbmV3IFVUdXJuQXJyb3dTaGFwZSggb3B0aW9ucy5pY29uSGVpZ2h0ICksIHtcclxuICAgICAgICBmaWxsOiBvcHRpb25zLmljb25GaWxsXHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGNvbnN0IHBsYXlJY29uSGVpZ2h0ID0gcmVzZXRQYXRoLmhlaWdodDtcclxuICAgICAgY29uc3QgcGxheUljb25XaWR0aCA9IDAuOCAqIHBsYXlJY29uSGVpZ2h0O1xyXG4gICAgICBjb25zdCBwbGF5UGF0aCA9IG5ldyBQYXRoKCBuZXcgUGxheUljb25TaGFwZSggcGxheUljb25XaWR0aCwgcGxheUljb25IZWlnaHQgKSwge1xyXG4gICAgICAgIGZpbGw6IG9wdGlvbnMuaWNvbkZpbGxcclxuICAgICAgfSApO1xyXG5cclxuICAgICAgY29uc3QgcGF1c2VQYXRoID0gbmV3IFBhdGgoIG5ldyBQYXVzZUljb25TaGFwZSggMC43NSAqIHBsYXlJY29uV2lkdGgsIHBsYXlJY29uSGVpZ2h0ICksIHtcclxuICAgICAgICBmaWxsOiBvcHRpb25zLmljb25GaWxsXHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGNvbnN0IHBsYXlQYXVzZUJ1dHRvbiA9IG5ldyBCb29sZWFuUmVjdGFuZ3VsYXJUb2dnbGVCdXR0b24oIHN0b3B3YXRjaC5pc1J1bm5pbmdQcm9wZXJ0eSwgcGF1c2VQYXRoLCBwbGF5UGF0aCxcclxuICAgICAgICBjb21iaW5lT3B0aW9uczxCb29sZWFuUmVjdGFuZ3VsYXJUb2dnbGVCdXR0b25PcHRpb25zPigge1xyXG4gICAgICAgICAgYmFzZUNvbG9yOiBvcHRpb25zLmJ1dHRvbkJhc2VDb2xvcixcclxuICAgICAgICAgIHRvdWNoQXJlYVhEaWxhdGlvbjogNSxcclxuICAgICAgICAgIHRvdWNoQXJlYVhTaGlmdDogNSxcclxuICAgICAgICAgIHRvdWNoQXJlYVlEaWxhdGlvbjogOCxcclxuICAgICAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAncGxheVBhdXNlQnV0dG9uJyApLFxyXG4gICAgICAgICAgcGhldGlvVmlzaWJsZVByb3BlcnR5SW5zdHJ1bWVudGVkOiBmYWxzZSxcclxuICAgICAgICAgIHBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZDogZmFsc2VcclxuICAgICAgICB9LCBvcHRpb25zLnBsYXlQYXVzZUJ1dHRvbk9wdGlvbnMgKSApO1xyXG5cclxuICAgICAgY29uc3QgcmVzZXRCdXR0b24gPSBuZXcgUmVjdGFuZ3VsYXJQdXNoQnV0dG9uKCBjb21iaW5lT3B0aW9uczxSZWN0YW5ndWxhclB1c2hCdXR0b25PcHRpb25zPigge1xyXG4gICAgICAgIGxpc3RlbmVyOiAoKSA9PiB7XHJcbiAgICAgICAgICBzdG9wd2F0Y2guaXNSdW5uaW5nUHJvcGVydHkuc2V0KCBmYWxzZSApO1xyXG4gICAgICAgICAgc3RvcHdhdGNoLnRpbWVQcm9wZXJ0eS5zZXQoIDAgKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRvdWNoQXJlYVhEaWxhdGlvbjogNSxcclxuICAgICAgICB0b3VjaEFyZWFYU2hpZnQ6IC01LFxyXG4gICAgICAgIHRvdWNoQXJlYVlEaWxhdGlvbjogOCxcclxuICAgICAgICBjb250ZW50OiByZXNldFBhdGgsXHJcbiAgICAgICAgYmFzZUNvbG9yOiBvcHRpb25zLmJ1dHRvbkJhc2VDb2xvcixcclxuICAgICAgICBzb3VuZFBsYXllcjogb3B0aW9ucy5yZXNldEJ1dHRvblNvdW5kUGxheWVyLFxyXG4gICAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAncmVzZXRCdXR0b24nICksXHJcbiAgICAgICAgcGhldGlvVmlzaWJsZVByb3BlcnR5SW5zdHJ1bWVudGVkOiBmYWxzZSxcclxuICAgICAgICBwaGV0aW9FbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQ6IGZhbHNlXHJcbiAgICAgIH0sIG9wdGlvbnMucmVzZXRCdXR0b25PcHRpb25zICkgKTtcclxuXHJcbiAgICAgIHBsYXlQYXVzZVJlc2V0QnV0dG9uQ29udGFpbmVyID0gbmV3IEhCb3goIHtcclxuICAgICAgICBzcGFjaW5nOiBvcHRpb25zLnhTcGFjaW5nLFxyXG4gICAgICAgIGNoaWxkcmVuOiBbIHJlc2V0QnV0dG9uLCBwbGF5UGF1c2VCdXR0b24gXVxyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICAvLyBEaXNhYmxlIHRoZSByZXNldCBidXR0b24gd2hlbiB0aW1lIGlzIHplcm8sIGFuZCBlbmFibGUgdGhlIHBsYXkvcGF1c2UgYnV0dG9uIHdoZW4gbm90IGF0IHRoZSBtYXggdGltZVxyXG4gICAgICBjb25zdCB0aW1lTGlzdGVuZXIgPSAoIHRpbWU6IG51bWJlciApID0+IHtcclxuICAgICAgICByZXNldEJ1dHRvbi5lbmFibGVkID0gKCB0aW1lID4gMCApO1xyXG4gICAgICAgIHBsYXlQYXVzZUJ1dHRvbi5lbmFibGVkID0gKCB0aW1lIDwgc3RvcHdhdGNoLnRpbWVQcm9wZXJ0eS5yYW5nZS5tYXggKTtcclxuICAgICAgfTtcclxuICAgICAgc3RvcHdhdGNoLnRpbWVQcm9wZXJ0eS5saW5rKCB0aW1lTGlzdGVuZXIgKTtcclxuXHJcbiAgICAgIGRpc3Bvc2VQbGF5UGF1c2VSZXNldEJ1dHRvbnMgPSAoKSA9PiB7XHJcbiAgICAgICAgc3RvcHdhdGNoLnRpbWVQcm9wZXJ0eS51bmxpbmsoIHRpbWVMaXN0ZW5lciApO1xyXG4gICAgICAgIHJlc2V0QnV0dG9uLmRpc3Bvc2UoKTtcclxuICAgICAgICBwbGF5UGF1c2VCdXR0b24uZGlzcG9zZSgpO1xyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNvbnRlbnRzID0gbmV3IFZCb3goIHtcclxuICAgICAgc3BhY2luZzogb3B0aW9ucy55U3BhY2luZyxcclxuICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICBudW1iZXJEaXNwbGF5LFxyXG5cclxuICAgICAgICAvLyBJbmNsdWRlIHRoZSBwbGF5L3BhdXNlIGFuZCByZXNldCBidXR0b25zIGlmIHNwZWNpZmllZCBpbiB0aGUgb3B0aW9uc1xyXG4gICAgICAgIC4uLiggcGxheVBhdXNlUmVzZXRCdXR0b25Db250YWluZXIgPyBbIHBsYXlQYXVzZVJlc2V0QnV0dG9uQ29udGFpbmVyIF0gOiBbXSApLFxyXG5cclxuICAgICAgICAvLyBJbmNsdWRlIGFueSBhZGRpdGlvbmFsIGNvbnRyb2xzIGFzIHNwZWNpZmllZFxyXG4gICAgICAgIC4uLm9wdGlvbnMub3RoZXJDb250cm9sc1xyXG4gICAgICBdXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gQmFja2dyb3VuZCBwYW5lbCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgY29uc3QgYmFja2dyb3VuZE5vZGUgPSBuZXcgTm9kZSgpO1xyXG5cclxuICAgIGNvbnRlbnRzLmJvdW5kc1Byb3BlcnR5LmxpbmsoICgpID0+IHtcclxuICAgICAgY29uc3QgYm91bmRzID0gbmV3IEJvdW5kczIoXHJcbiAgICAgICAgLW9wdGlvbnMueE1hcmdpbixcclxuICAgICAgICAtb3B0aW9ucy55TWFyZ2luLFxyXG4gICAgICAgIGNvbnRlbnRzLndpZHRoICsgb3B0aW9ucy54TWFyZ2luLFxyXG4gICAgICAgIGNvbnRlbnRzLmhlaWdodCArIG9wdGlvbnMueU1hcmdpblxyXG4gICAgICApO1xyXG5cclxuICAgICAgYmFja2dyb3VuZE5vZGUuY2hpbGRyZW4gPSBbXHJcbiAgICAgICAgbmV3IFNoYWRlZFJlY3RhbmdsZSggYm91bmRzLCB7XHJcbiAgICAgICAgICBiYXNlQ29sb3I6IG9wdGlvbnMuYmFja2dyb3VuZEJhc2VDb2xvcixcclxuICAgICAgICAgIHRhZ05hbWU6ICdkaXYnLFxyXG4gICAgICAgICAgZm9jdXNhYmxlOiB0cnVlXHJcbiAgICAgICAgfSApXHJcbiAgICAgIF07XHJcbiAgICB9ICk7XHJcblxyXG4gICAgb3B0aW9ucy5jaGlsZHJlbiA9IFsgYmFja2dyb3VuZE5vZGUsIGNvbnRlbnRzIF07XHJcblxyXG4gICAgc3VwZXIoIG9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyBQdXQgYSByZWQgZG90IGF0IHRoZSBvcmlnaW4sIGZvciBkZWJ1Z2dpbmcgbGF5b3V0LlxyXG4gICAgaWYgKCBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmRldiApIHtcclxuICAgICAgdGhpcy5hZGRDaGlsZCggbmV3IENpcmNsZSggMywgeyBmaWxsOiAncmVkJyB9ICkgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzdG9wd2F0Y2hWaXNpYmxlTGlzdGVuZXIgPSAoIHZpc2libGU6IGJvb2xlYW4gKSA9PiB7XHJcbiAgICAgIGlmICggdmlzaWJsZSApIHtcclxuICAgICAgICB0aGlzLm1vdmVUb0Zyb250KCk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgIC8vIGludGVycnVwdCB1c2VyIGludGVyYWN0aW9ucyB3aGVuIHRoZSBzdG9wd2F0Y2ggaXMgbWFkZSBpbnZpc2libGVcclxuICAgICAgICB0aGlzLmludGVycnVwdFN1YnRyZWVJbnB1dCgpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgc3RvcHdhdGNoLmlzVmlzaWJsZVByb3BlcnR5LmxpbmsoIHN0b3B3YXRjaFZpc2libGVMaXN0ZW5lciApO1xyXG5cclxuICAgIC8vIE1vdmUgdG8gdGhlIHN0b3B3YXRjaCdzIHBvc2l0aW9uXHJcbiAgICBjb25zdCBzdG9wd2F0Y2hQb3NpdGlvbkxpc3RlbmVyID0gKCBwb3NpdGlvbjogVmVjdG9yMiApID0+IHRoaXMuc2V0VHJhbnNsYXRpb24oIHBvc2l0aW9uICk7XHJcbiAgICBzdG9wd2F0Y2gucG9zaXRpb25Qcm9wZXJ0eS5saW5rKCBzdG9wd2F0Y2hQb3NpdGlvbkxpc3RlbmVyICk7XHJcblxyXG4gICAgdGhpcy5kcmFnTGlzdGVuZXIgPSBudWxsO1xyXG4gICAgdGhpcy5rZXlib2FyZERyYWdMaXN0ZW5lciA9IG51bGw7XHJcblxyXG4gICAgbGV0IGFkanVzdGVkRHJhZ0JvdW5kc1Byb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxCb3VuZHMyPiB8IG51bGwgPSBudWxsO1xyXG4gICAgaWYgKCBvcHRpb25zLmRyYWdCb3VuZHNQcm9wZXJ0eSApIHtcclxuXHJcbiAgICAgIC8vIGludGVyYWN0aXZlIGhpZ2hsaWdodHMgLSBhZGRpbmcgYSBEcmFnTGlzdGVuZXIgdG8gbWFrZSB0aGlzIGludGVyYWN0aXZlLCBlbmFibGUgaGlnaGxpZ2h0cyBmb3IgbW91c2UgYW5kIHRvdWNoXHJcbiAgICAgIHRoaXMuaW50ZXJhY3RpdmVIaWdobGlnaHRFbmFibGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgIC8vIEFkanVzdG1lbnQgdG8ga2VlcCB0aGUgZW50aXJlIFN0b3B3YXRjaE5vZGUgaW5zaWRlIHRoZSBkcmFnIGJvdW5kcy5cclxuICAgICAgYWRqdXN0ZWREcmFnQm91bmRzUHJvcGVydHkgPSBuZXcgRGVyaXZlZFByb3BlcnR5KFxyXG4gICAgICAgIFsgdGhpcy5ib3VuZHNQcm9wZXJ0eSwgb3B0aW9ucy5kcmFnQm91bmRzUHJvcGVydHkgXSxcclxuICAgICAgICAoIHRoaXNCb3VuZHMsIGRyYWdCb3VuZHMgKSA9PiB7XHJcblxyXG4gICAgICAgICAgLy8gR2V0IHRoZSBvcmlnaW4gaW4gdGhlIHBhcmVudCBjb29yZGluYXRlIGZyYW1lLCB0byBkZXRlcm1pbmUgb3VyIGJvdW5kcyBvZmZzZXRzIGluIHRoYXQgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgICAgICAgIC8vIFRoaXMgd2F5IHdlJ2xsIHByb3Blcmx5IGhhbmRsZSBzY2FsaW5nL3JvdGF0aW9uL2V0Yy5cclxuICAgICAgICAgIGNvbnN0IHRhcmdldE9yaWdpbkluUGFyZW50Q29vcmRpbmF0ZXMgPSB0aGlzLmxvY2FsVG9QYXJlbnRQb2ludCggVmVjdG9yMi5aRVJPICk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIG5ldyBCb3VuZHMyKFxyXG4gICAgICAgICAgICBkcmFnQm91bmRzLm1pblggLSAoIHRoaXNCb3VuZHMubWluWCAtIHRhcmdldE9yaWdpbkluUGFyZW50Q29vcmRpbmF0ZXMueCApLFxyXG4gICAgICAgICAgICBkcmFnQm91bmRzLm1pblkgLSAoIHRoaXNCb3VuZHMubWluWSAtIHRhcmdldE9yaWdpbkluUGFyZW50Q29vcmRpbmF0ZXMueSApLFxyXG4gICAgICAgICAgICBkcmFnQm91bmRzLm1heFggLSAoIHRoaXNCb3VuZHMubWF4WCAtIHRhcmdldE9yaWdpbkluUGFyZW50Q29vcmRpbmF0ZXMueCApLFxyXG4gICAgICAgICAgICBkcmFnQm91bmRzLm1heFkgLSAoIHRoaXNCb3VuZHMubWF4WSAtIHRhcmdldE9yaWdpbkluUGFyZW50Q29vcmRpbmF0ZXMueSApXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgIHZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5OiAnZXF1YWxzRnVuY3Rpb24nLCAvLyBEb24ndCBtYWtlIHNwdXJpb3VzIGNoYW5nZXMsIHdlIG9mdGVuIHdvbid0IGJlIGNoYW5naW5nLlxyXG4gICAgICAgICAgc3RyaWN0QXhvbkRlcGVuZGVuY2llczogZmFsc2UgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5LXBoZXQvaXNzdWVzLzgzMlxyXG4gICAgICAgIH0gKTtcclxuXHJcbiAgICAgIC8vIGludGVycnVwdCB1c2VyIGludGVyYWN0aW9ucyB3aGVuIHRoZSB2aXNpYmxlIGJvdW5kcyBjaGFuZ2VzLCBzdWNoIGFzIGEgZGV2aWNlIG9yaWVudGF0aW9uIGNoYW5nZSBvciB3aW5kb3cgcmVzaXplXHJcbiAgICAgIG9wdGlvbnMuZHJhZ0JvdW5kc1Byb3BlcnR5LmxpbmsoICgpID0+IHRoaXMuaW50ZXJydXB0U3VidHJlZUlucHV0KCkgKTtcclxuXHJcbiAgICAgIC8vIElmIHRoZSBzdG9wd2F0Y2ggaXMgb3V0c2lkZSB0aGUgZHJhZyBib3VuZHMsIG1vdmUgaXQgaW5zaWRlLlxyXG4gICAgICBhZGp1c3RlZERyYWdCb3VuZHNQcm9wZXJ0eS5saW5rKCBkcmFnQm91bmRzID0+IHtcclxuICAgICAgICBpZiAoICFkcmFnQm91bmRzLmNvbnRhaW5zUG9pbnQoIHN0b3B3YXRjaC5wb3NpdGlvblByb3BlcnR5LnZhbHVlICkgKSB7XHJcbiAgICAgICAgICBzdG9wd2F0Y2gucG9zaXRpb25Qcm9wZXJ0eS52YWx1ZSA9IGRyYWdCb3VuZHMuY2xvc2VzdFBvaW50VG8oIHN0b3B3YXRjaC5wb3NpdGlvblByb3BlcnR5LnZhbHVlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICAvLyBkcmFnZ2luZywgYWRkZWQgdG8gYmFja2dyb3VuZCBzbyB0aGF0IG90aGVyIFVJIGNvbXBvbmVudHMgZ2V0IGlucHV0IGV2ZW50cyBvbiB0b3VjaCBkZXZpY2VzXHJcbiAgICAgIGNvbnN0IGRyYWdMaXN0ZW5lck9wdGlvbnMgPSBjb21iaW5lT3B0aW9uczxSaWNoRHJhZ0xpc3RlbmVyT3B0aW9ucz4oIHtcclxuICAgICAgICB0YXJnZXROb2RlOiB0aGlzLFxyXG4gICAgICAgIHBvc2l0aW9uUHJvcGVydHk6IHN0b3B3YXRjaC5wb3NpdGlvblByb3BlcnR5LFxyXG4gICAgICAgIGRyYWdCb3VuZHNQcm9wZXJ0eTogYWRqdXN0ZWREcmFnQm91bmRzUHJvcGVydHksXHJcbiAgICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdkcmFnTGlzdGVuZXInIClcclxuICAgICAgfSwgb3B0aW9ucy5kcmFnTGlzdGVuZXJPcHRpb25zICk7XHJcblxyXG4gICAgICAvLyBBZGQgbW92ZVRvRnJvbnQgdG8gYW55IHN0YXJ0IGZ1bmN0aW9uIHRoYXQgdGhlIGNsaWVudCBwcm92aWRlZC5cclxuICAgICAgY29uc3Qgb3B0aW9uc1N0YXJ0ID0gZHJhZ0xpc3RlbmVyT3B0aW9ucy5zdGFydCE7XHJcbiAgICAgIGRyYWdMaXN0ZW5lck9wdGlvbnMuc3RhcnQgPSAoIGV2ZW50OiBQcmVzc0xpc3RlbmVyRXZlbnQsIGxpc3RlbmVyOiBQcmVzc2VkUmljaERyYWdMaXN0ZW5lciApID0+IHtcclxuICAgICAgICB0aGlzLm1vdmVUb0Zyb250KCk7XHJcbiAgICAgICAgb3B0aW9uc1N0YXJ0KCBldmVudCwgbGlzdGVuZXIgKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIC8vIERyYWdnaW5nLCBhZGRlZCB0byBiYWNrZ3JvdW5kIHNvIHRoYXQgb3RoZXIgVUkgY29tcG9uZW50cyBnZXQgaW5wdXQgZXZlbnRzIG9uIHRvdWNoIGRldmljZXMuXHJcbiAgICAgIC8vIElmIGFkZGVkIHRvICd0aGlzJywgdG91Y2hTbmFnIHdpbGwgbG9jayBvdXQgbGlzdGVuZXJzIGZvciBvdGhlciBVSSBjb21wb25lbnRzLlxyXG4gICAgICB0aGlzLmRyYWdMaXN0ZW5lciA9IG5ldyBSaWNoRHJhZ0xpc3RlbmVyKCBkcmFnTGlzdGVuZXJPcHRpb25zICk7XHJcbiAgICAgIGJhY2tncm91bmROb2RlLmFkZElucHV0TGlzdGVuZXIoIHRoaXMuZHJhZ0xpc3RlbmVyICk7XHJcblxyXG4gICAgICBjb25zdCBrZXlib2FyZERyYWdMaXN0ZW5lck9wdGlvbnMgPSBjb21iaW5lT3B0aW9uczxSaWNoS2V5Ym9hcmREcmFnTGlzdGVuZXJPcHRpb25zPigge1xyXG4gICAgICAgIHBvc2l0aW9uUHJvcGVydHk6IHN0b3B3YXRjaC5wb3NpdGlvblByb3BlcnR5LFxyXG4gICAgICAgIGRyYWdCb3VuZHNQcm9wZXJ0eTogYWRqdXN0ZWREcmFnQm91bmRzUHJvcGVydHksXHJcbiAgICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdrZXlib2FyZERyYWdMaXN0ZW5lcicgKVxyXG4gICAgICB9LCBvcHRpb25zLmtleWJvYXJkRHJhZ0xpc3RlbmVyT3B0aW9ucyApO1xyXG5cclxuICAgICAgdGhpcy5rZXlib2FyZERyYWdMaXN0ZW5lciA9IG5ldyBSaWNoS2V5Ym9hcmREcmFnTGlzdGVuZXIoIGtleWJvYXJkRHJhZ0xpc3RlbmVyT3B0aW9ucyApO1xyXG4gICAgICB0aGlzLmFkZElucHV0TGlzdGVuZXIoIHRoaXMua2V5Ym9hcmREcmFnTGlzdGVuZXIgKTtcclxuXHJcbiAgICAgIC8vIFRoZSBncm91cCBmb2N1cyBoaWdobGlnaHQgbWFrZXMgaXQgY2xlYXIgdGhlIHN0b3B3YXRjaCBpcyBoaWdobGlnaHRlZCBldmVuIGlmIHRoZSBjaGlsZHJlbiBhcmUgZm9jdXNlZFxyXG4gICAgICB0aGlzLmdyb3VwRm9jdXNIaWdobGlnaHQgPSB0cnVlO1xyXG5cclxuICAgICAgLy8gTW92ZSB0byBmcm9udCBvbiBwb2ludGVyIGRvd24sIGFueXdoZXJlIG9uIHRoaXMgTm9kZSwgaW5jbHVkaW5nIGludGVyYWN0aXZlIHN1YmNvbXBvbmVudHMuXHJcbiAgICAgIHRoaXMuYWRkSW5wdXRMaXN0ZW5lcigge1xyXG4gICAgICAgIGRvd246ICgpID0+IHRoaXMubW92ZVRvRnJvbnQoKVxyXG4gICAgICB9ICk7XHJcbiAgICAgIGJhY2tncm91bmROb2RlLmFkZElucHV0TGlzdGVuZXIoIHtcclxuICAgICAgICBmb2N1czogKCkgPT4gdGhpcy5tb3ZlVG9Gcm9udCgpXHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmFkZExpbmtlZEVsZW1lbnQoIHN0b3B3YXRjaCwge1xyXG4gICAgICB0YW5kZW1OYW1lOiAnc3RvcHdhdGNoJ1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuZGlzcG9zZVN0b3B3YXRjaE5vZGUgPSAoKSA9PiB7XHJcbiAgICAgIHN0b3B3YXRjaC5pc1Zpc2libGVQcm9wZXJ0eS51bmxpbmsoIHN0b3B3YXRjaFZpc2libGVMaXN0ZW5lciApO1xyXG4gICAgICBzdG9wd2F0Y2gucG9zaXRpb25Qcm9wZXJ0eS51bmxpbmsoIHN0b3B3YXRjaFBvc2l0aW9uTGlzdGVuZXIgKTtcclxuXHJcbiAgICAgIG51bWJlckRpc3BsYXkuZGlzcG9zZSgpO1xyXG5cclxuICAgICAgaWYgKCB0aGlzLmRyYWdMaXN0ZW5lciApIHtcclxuICAgICAgICBiYWNrZ3JvdW5kTm9kZS5yZW1vdmVJbnB1dExpc3RlbmVyKCB0aGlzLmRyYWdMaXN0ZW5lciApO1xyXG4gICAgICAgIHRoaXMuZHJhZ0xpc3RlbmVyLmRpc3Bvc2UoKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIHRoaXMua2V5Ym9hcmREcmFnTGlzdGVuZXIgKSB7XHJcbiAgICAgICAgdGhpcy5yZW1vdmVJbnB1dExpc3RlbmVyKCB0aGlzLmtleWJvYXJkRHJhZ0xpc3RlbmVyICk7XHJcbiAgICAgICAgdGhpcy5rZXlib2FyZERyYWdMaXN0ZW5lci5kaXNwb3NlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGFkanVzdGVkRHJhZ0JvdW5kc1Byb3BlcnR5ICYmIGFkanVzdGVkRHJhZ0JvdW5kc1Byb3BlcnR5LmRpc3Bvc2UoKTtcclxuICAgICAgZGlzcG9zZVBsYXlQYXVzZVJlc2V0QnV0dG9ucyAmJiBkaXNwb3NlUGxheVBhdXNlUmVzZXRCdXR0b25zKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMubnVtYmVyRGlzcGxheSA9IG51bWJlckRpc3BsYXk7XHJcblxyXG4gICAgLy8gc3VwcG9ydCBmb3IgYmluZGVyIGRvY3VtZW50YXRpb24sIHN0cmlwcGVkIG91dCBpbiBidWlsZHMgYW5kIG9ubHkgcnVucyB3aGVuID9iaW5kZXIgaXMgc3BlY2lmaWVkXHJcbiAgICBhc3NlcnQgJiYgcGhldD8uY2hpcHBlcj8ucXVlcnlQYXJhbWV0ZXJzPy5iaW5kZXIgJiYgSW5zdGFuY2VSZWdpc3RyeS5yZWdpc3RlckRhdGFVUkwoICdzY2VuZXJ5LXBoZXQnLCAnU3RvcHdhdGNoTm9kZScsIHRoaXMgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5kaXNwb3NlU3RvcHdhdGNoTm9kZSgpO1xyXG4gICAgc3VwZXIuZGlzcG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgY2VudGlzZWNvbmRzIChodW5kcmVkdGhzLW9mLWEtc2Vjb25kKSBzdHJpbmcgZm9yIGEgdGltZSB2YWx1ZS5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGdldERlY2ltYWxQbGFjZXMoIHRpbWU6IG51bWJlciwgbnVtYmVyRGVjaW1hbFBsYWNlczogbnVtYmVyICk6IHN0cmluZyB7XHJcblxyXG4gICAgY29uc3QgbWF4ID0gTWF0aC5wb3coIDEwLCBudW1iZXJEZWNpbWFsUGxhY2VzICk7XHJcblxyXG4gICAgLy8gUm91bmQgdG8gdGhlIG5lYXJlc3QgY2VudGlzZWNvbmQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvbWFzc2VzLWFuZC1zcHJpbmdzL2lzc3Vlcy8xNTZcclxuICAgIHRpbWUgPSBVdGlscy5yb3VuZFN5bW1ldHJpYyggdGltZSAqIG1heCApIC8gbWF4O1xyXG5cclxuICAgIC8vIFJvdW5kaW5nIGFmdGVyIG1vZCwgaW4gY2FzZSB0aGVyZSBpcyBmbG9hdGluZy1wb2ludCBlcnJvclxyXG4gICAgbGV0IGRlY2ltYWxWYWx1ZSA9IGAke1V0aWxzLnJvdW5kU3ltbWV0cmljKCB0aW1lICUgMSAqIG1heCApfWA7XHJcbiAgICB3aGlsZSAoIGRlY2ltYWxWYWx1ZS5sZW5ndGggPCBudW1iZXJEZWNpbWFsUGxhY2VzICkge1xyXG4gICAgICBkZWNpbWFsVmFsdWUgPSBgMCR7ZGVjaW1hbFZhbHVlfWA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYC4ke2RlY2ltYWxWYWx1ZX1gO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIGN1c3RvbSB2YWx1ZSBmb3Igb3B0aW9ucy5udW1iZXJEaXNwbGF5T3B0aW9ucy5udW1iZXJGb3JtYXR0ZXIsIHBhc3NlZCB0byBOdW1iZXJEaXNwbGF5LiBXaGVuIHVzaW5nXHJcbiAgICogdGhpcyBtZXRob2QsIHlvdSB3aWxsIGFsc28gbmVlZCB0byB1c2UgTnVtYmVyRGlzcGxheU9wdGlvbnMubnVtYmVyRm9ybWF0dGVyRGVwZW5kZW5jaWVzLCB0byB0ZWxsIE51bWJlckRpc3BsYXlcclxuICAgKiBhYm91dCB0aGUgZGVwZW5kZW5jaWVzIGhlcmVpbi4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5LXBoZXQvaXNzdWVzLzc4MS5cclxuICAgKiBUaGlzIHdpbGwgdHlwaWNhbGx5IGJlIHNvbWV0aGluZyBsaWtlOlxyXG4gICAqXHJcbiAgICogbnVtYmVyRm9ybWF0dGVyOiBTdG9wd2F0Y2hOb2RlLmNyZWF0ZVJpY2hUZXh0TnVtYmVyRm9ybWF0dGVyKCB7XHJcbiAgICogICB1bml0czogdW5pdHNQcm9wZXJ0eSxcclxuICAgKiAgIC4uLlxyXG4gICAqIH0gKSxcclxuICAgKiBudW1iZXJGb3JtYXR0ZXJEZXBlbmRlbmNpZXM6IFtcclxuICAgKiAgIFNjZW5lcnlQaGV0U3RyaW5ncy5zdG9wd2F0Y2hWYWx1ZVVuaXRzUGF0dGVyblN0cmluZ1Byb3BlcnR5LFxyXG4gICAqICAgdW5pdHNQcm9wZXJ0eVxyXG4gICAqIF0sXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBjcmVhdGVSaWNoVGV4dE51bWJlckZvcm1hdHRlciggcHJvdmlkZWRPcHRpb25zPzogRm9ybWF0dGVyT3B0aW9ucyApOiAoIHRpbWU6IG51bWJlciApID0+IHN0cmluZyB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxGb3JtYXR0ZXJPcHRpb25zPigpKCB7XHJcblxyXG4gICAgICAvLyBJZiB0cnVlLCB0aGUgdGltZSB2YWx1ZSBpcyBjb252ZXJ0ZWQgdG8gbWludXRlcyBhbmQgc2Vjb25kcywgYW5kIHRoZSBmb3JtYXQgbG9va3MgbGlrZSA1OTo1OS4wMC5cclxuICAgICAgLy8gSWYgZmFsc2UsIHRpbWUgaXMgZm9ybWF0dGVkIGFzIGEgZGVjaW1hbCB2YWx1ZSwgbGlrZSAxMjMuNDVcclxuICAgICAgc2hvd0FzTWludXRlc0FuZFNlY29uZHM6IHRydWUsXHJcbiAgICAgIG51bWJlck9mRGVjaW1hbFBsYWNlczogMixcclxuICAgICAgYmlnTnVtYmVyRm9udDogMjAsXHJcbiAgICAgIHNtYWxsTnVtYmVyRm9udDogMTQsXHJcbiAgICAgIHVuaXRzRm9udDogMTQsXHJcbiAgICAgIHVuaXRzOiAnJyxcclxuXHJcbiAgICAgIC8vIFVuaXRzIGNhbm5vdCBiZSBiYWtlZCBpbnRvIHRoZSBpMThuIHN0cmluZyBiZWNhdXNlIHRoZXkgY2FuIGNoYW5nZSBpbmRlcGVuZGVudGx5XHJcbiAgICAgIHZhbHVlVW5pdHNQYXR0ZXJuOiBTY2VuZXJ5UGhldFN0cmluZ3Muc3RvcHdhdGNoVmFsdWVVbml0c1BhdHRlcm5TdHJpbmdQcm9wZXJ0eVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgcmV0dXJuICggdGltZTogbnVtYmVyICkgPT4ge1xyXG4gICAgICBjb25zdCBtaW51dGVzQW5kU2Vjb25kcyA9IG9wdGlvbnMuc2hvd0FzTWludXRlc0FuZFNlY29uZHMgPyB0b01pbnV0ZXNBbmRTZWNvbmRzKCB0aW1lICkgOiBNYXRoLmZsb29yKCB0aW1lICk7XHJcbiAgICAgIGNvbnN0IGNlbnRpc2Vjb25kcyA9IFN0b3B3YXRjaE5vZGUuZ2V0RGVjaW1hbFBsYWNlcyggdGltZSwgb3B0aW9ucy5udW1iZXJPZkRlY2ltYWxQbGFjZXMgKTtcclxuICAgICAgY29uc3QgdW5pdHMgPSAoIHR5cGVvZiBvcHRpb25zLnVuaXRzID09PSAnc3RyaW5nJyApID8gb3B0aW9ucy51bml0cyA6IG9wdGlvbnMudW5pdHMudmFsdWU7XHJcblxyXG4gICAgICBjb25zdCBmb250U2l6ZSA9IGAke29wdGlvbnMuc21hbGxOdW1iZXJGb250fXB4YDtcclxuXHJcbiAgICAgIC8vIFNpbmdsZSBxdW90ZXMgYXJvdW5kIENTUyBzdHlsZSBzbyB0aGUgZG91YmxlLXF1b3RlcyBpbiB0aGUgQ1NTIGZvbnQgZmFtaWx5IHdvcmsuIEhpbWFsYXlhIGRvZXNuJ3QgbGlrZSAmcXVvdDtcclxuICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9jb2xsaXNpb24tbGFiL2lzc3Vlcy8xNDAuXHJcbiAgICAgIHJldHVybiBTdHJpbmdVdGlscy5maWxsSW4oIG9wdGlvbnMudmFsdWVVbml0c1BhdHRlcm4sIHtcclxuICAgICAgICB2YWx1ZTogYDxzcGFuIHN0eWxlPSdmb250LXNpemU6ICR7b3B0aW9ucy5iaWdOdW1iZXJGb250fXB4OyBmb250LWZhbWlseToke1N0b3B3YXRjaE5vZGUuTlVNQkVSX0ZPTlRfRkFNSUxZfTsnPiR7bWludXRlc0FuZFNlY29uZHN9PC9zcGFuPjxzcGFuIHN0eWxlPSdmb250LXNpemU6ICR7Zm9udFNpemV9O2ZvbnQtZmFtaWx5OiR7U3RvcHdhdGNoTm9kZS5OVU1CRVJfRk9OVF9GQU1JTFl9Oyc+JHtjZW50aXNlY29uZHN9PC9zcGFuPmAsXHJcbiAgICAgICAgdW5pdHM6IGA8c3BhbiBzdHlsZT0nZm9udC1zaXplOiAke29wdGlvbnMudW5pdHNGb250fXB4OyBmb250LWZhbWlseToke1N0b3B3YXRjaE5vZGUuTlVNQkVSX0ZPTlRfRkFNSUxZfTsnPiR7dW5pdHN9PC9zcGFuPmBcclxuICAgICAgfSApO1xyXG4gICAgfTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDb252ZXJ0cyBhIHRpbWUgdG8gYSBzdHJpbmcgaW4ge3ttaW51dGVzfX06e3tzZWNvbmRzfX0gZm9ybWF0LlxyXG4gKi9cclxuZnVuY3Rpb24gdG9NaW51dGVzQW5kU2Vjb25kcyggdGltZTogbnVtYmVyICk6IHN0cmluZyB7XHJcblxyXG4gIC8vIFJvdW5kIHRvIHRoZSBuZWFyZXN0IGNlbnRpLXBhcnQgKGlmIHRpbWUgaXMgaW4gc2Vjb25kcywgdGhpcyB3b3VsZCBiZSBjZW50aXNlY29uZHMpXHJcbiAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9tYXNzZXMtYW5kLXNwcmluZ3MvaXNzdWVzLzE1NlxyXG4gIHRpbWUgPSBVdGlscy5yb3VuZFN5bW1ldHJpYyggdGltZSAqIDEwMCApIC8gMTAwO1xyXG5cclxuICAvLyBXaGVuIHNob3dpbmcgdW5pdHMsIGRvbid0IHNob3cgdGhlIFwiMDA6XCIgcHJlZml4LCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnktcGhldC9pc3N1ZXMvMzc4XHJcbiAgY29uc3QgdGltZUluU2Vjb25kcyA9IHRpbWU7XHJcblxyXG4gIC8vIElmIG5vIHVuaXRzIGFyZSBwcm92aWRlZCwgdGhlbiB3ZSBhc3N1bWUgdGhlIHRpbWUgaXMgaW4gc2Vjb25kcywgYW5kIHNob3VsZCBiZSBzaG93biBpbiBtbTpzcy5jc1xyXG4gIGNvbnN0IG1pbnV0ZXMgPSBNYXRoLmZsb29yKCB0aW1lSW5TZWNvbmRzIC8gNjAgKTtcclxuICBjb25zdCBzZWNvbmRzID0gTWF0aC5mbG9vciggdGltZUluU2Vjb25kcyApICUgNjA7XHJcblxyXG4gIGNvbnN0IG1pbnV0ZXNTdHJpbmcgPSAoIG1pbnV0ZXMgPCAxMCApID8gYDAke21pbnV0ZXN9YCA6IGAke21pbnV0ZXN9YDtcclxuICBjb25zdCBzZWNvbmRzU3RyaW5nID0gKCBzZWNvbmRzIDwgMTAgKSA/IGAwJHtzZWNvbmRzfWAgOiBgJHtzZWNvbmRzfWA7XHJcbiAgcmV0dXJuIGAke21pbnV0ZXNTdHJpbmd9OiR7c2Vjb25kc1N0cmluZ31gO1xyXG59XHJcblxyXG5zY2VuZXJ5UGhldC5yZWdpc3RlciggJ1N0b3B3YXRjaE5vZGUnLCBTdG9wd2F0Y2hOb2RlICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUtBLE9BQU9BLE9BQU8sTUFBTSx5QkFBeUI7QUFDN0MsT0FBT0MsS0FBSyxNQUFNLHVCQUF1QjtBQUN6QyxPQUFPQyxPQUFPLE1BQU0seUJBQXlCO0FBQzdDLE9BQU9DLGdCQUFnQixNQUFNLHNEQUFzRDtBQUNuRixPQUFPQyxTQUFTLElBQUlDLGNBQWMsUUFBUSxpQ0FBaUM7QUFDM0UsT0FBT0MsV0FBVyxNQUFNLHlDQUF5QztBQUNqRSxTQUFTQyxNQUFNLEVBQWdCQyxJQUFJLEVBQUVDLHVCQUF1QixFQUF3REMsSUFBSSxFQUFlQyxJQUFJLEVBQThCQyxJQUFJLFFBQVEsNkJBQTZCO0FBQ2xOLE9BQU9DLDhCQUE4QixNQUFpRCx3REFBd0Q7QUFDOUksT0FBT0MscUJBQXFCLE1BQXdDLCtDQUErQztBQUNuSCxPQUFPQyxNQUFNLE1BQU0sMkJBQTJCO0FBQzlDLE9BQU9DLGFBQWEsTUFBZ0Msb0JBQW9CO0FBQ3hFLE9BQU9DLGNBQWMsTUFBTSxxQkFBcUI7QUFDaEQsT0FBT0MsUUFBUSxNQUFNLGVBQWU7QUFDcEMsT0FBT0MsYUFBYSxNQUFNLG9CQUFvQjtBQUM5QyxPQUFPQyxXQUFXLE1BQU0sa0JBQWtCO0FBQzFDLE9BQU9DLGtCQUFrQixNQUFNLHlCQUF5QjtBQUN4RCxPQUFPQyxlQUFlLE1BQU0sc0JBQXNCO0FBQ2xELE9BQU9DLFNBQVMsTUFBTSxnQkFBZ0I7QUFDdEMsT0FBT0MsZUFBZSxNQUFNLHNCQUFzQjtBQUdsRCxPQUFPQyxxQkFBcUIsTUFBTSw4REFBOEQ7QUFDaEcsT0FBT0MsZUFBZSxNQUFNLGtDQUFrQztBQUM5RCxPQUFP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