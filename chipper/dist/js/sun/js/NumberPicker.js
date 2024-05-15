// Copyright 2022-2024, University of Colorado Boulder

/**
 * NumberPicker is a UI component for picking a number value from a range.
 * This is actually a number spinner, but PhET refers to it as a 'picker', so that's what this class is named.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import StringUnionProperty from '../../axon/js/StringUnionProperty.js';
import DerivedProperty from '../../axon/js/DerivedProperty.js';
import Multilink from '../../axon/js/Multilink.js';
import NumberProperty from '../../axon/js/NumberProperty.js';
import Property from '../../axon/js/Property.js';
import Dimension2 from '../../dot/js/Dimension2.js';
import Range from '../../dot/js/Range.js';
import Utils from '../../dot/js/Utils.js';
import { Shape } from '../../kite/js/imports.js';
import InstanceRegistry from '../../phet-core/js/documentation/InstanceRegistry.js';
import { Color, FireListener, HighlightPath, LinearGradient, Node, PaintColorProperty, Path, Rectangle, SceneryConstants, Text } from '../../scenery/js/imports.js';
import AccessibleNumberSpinner from '../../sun/js/accessibility/AccessibleNumberSpinner.js';
import generalBoundaryBoopSoundPlayer from '../../tambo/js/shared-sound-players/generalBoundaryBoopSoundPlayer.js';
import generalSoftClickSoundPlayer from '../../tambo/js/shared-sound-players/generalSoftClickSoundPlayer.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';
import Tandem from '../../tandem/js/Tandem.js';
import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
import sun from './sun.js';
import PhetFont from '../../scenery-phet/js/PhetFont.js';
import MathSymbols from '../../scenery-phet/js/MathSymbols.js';
const ButtonStateValues = ['up', 'down', 'over', 'out'];

// options to NumberPicker.createIcon

export default class NumberPicker extends AccessibleNumberSpinner(Node, 0) {
  /**
   * @param valueProperty
   * @param rangeProperty - If the range is anticipated to change, it's best to have the range Property contain the
   * (maximum) union of all potential changes, so that NumberPicker can iterate through all possible values and compute
   * the bounds of the labels.
   * @param [providedOptions]
   */
  constructor(valueProperty, rangeProperty, providedOptions) {
    const options = optionize()({
      // SelfOptions
      color: new Color(0, 0, 255),
      backgroundColor: 'white',
      cornerRadius: 6,
      xMargin: 3,
      yMargin: 3,
      decimalPlaces: 0,
      font: new PhetFont(24),
      incrementFunction: value => value + 1,
      decrementFunction: value => value - 1,
      timerDelay: 400,
      timerInterval: 100,
      noValueString: MathSymbols.NO_VALUE,
      align: 'center',
      touchAreaXDilation: 10,
      touchAreaYDilation: 10,
      mouseAreaXDilation: 0,
      mouseAreaYDilation: 5,
      backgroundStroke: 'gray',
      backgroundLineWidth: 0.5,
      arrowHeight: 6,
      arrowYSpacing: 3,
      arrowStroke: 'black',
      arrowLineWidth: 0.25,
      valueMaxWidth: null,
      onInput: _.noop,
      incrementEnabledFunction: (value, range) => value !== null && value !== undefined && value < range.max,
      decrementEnabledFunction: (value, range) => value !== null && value !== undefined && value > range.min,
      disabledOpacity: SceneryConstants.DISABLED_OPACITY,
      valueChangedSoundPlayer: generalSoftClickSoundPlayer,
      boundarySoundPlayer: generalBoundaryBoopSoundPlayer,
      // ParentOptions
      cursor: 'pointer',
      valueProperty: valueProperty,
      enabledRangeProperty: rangeProperty,
      pageKeyboardStep: 2,
      voicingObjectResponse: () => valueProperty.value,
      // by default, just speak the value

      // phet-io
      tandem: Tandem.REQUIRED,
      tandemNameSuffix: 'Picker',
      phetioReadOnly: PhetioObject.DEFAULT_OPTIONS.phetioReadOnly,
      visiblePropertyOptions: {
        phetioFeatured: true
      },
      phetioEnabledPropertyInstrumented: true,
      phetioFeatured: true
    }, providedOptions);
    if (!options.formatValue) {
      options.formatValue = value => Utils.toFixed(value, options.decimalPlaces);
    }

    // Color of arrows and top/bottom gradient when pressed
    let colorProperty = null;
    if (options.pressedColor === undefined) {
      colorProperty = new PaintColorProperty(options.color); // dispose required!

      // No reference needs to be kept, since we dispose its dependency.
      options.pressedColor = new DerivedProperty([colorProperty], color => color.darkerColor());
    }
    let previousValue = valueProperty.value;

    // Overwrite the passed-in onInput listener to make sure that sound implementation can't be blown away in the
    // defaults.
    const providedOnInputListener = options.onInput;
    options.onInput = () => {
      providedOnInputListener();

      // The onInput listener may be called when no change to the value has actually happened, see
      // https://github.com/phetsims/sun/issues/760.  We do some checks here to make sure the sound is only generated
      // when a change occurs.
      if (valueProperty.value !== previousValue) {
        // Play the boundary sound If the value is at min or max, otherwise play the default sound.
        if (valueProperty.value === rangeProperty.get().max || valueProperty.value === rangeProperty.get().min) {
          options.boundarySoundPlayer.play();
        } else {
          options.valueChangedSoundPlayer.play();
        }
      }
      previousValue = valueProperty.value;
    };
    assert && assert(!options.keyboardStep, 'NumberPicker sets its own keyboardStep');
    assert && assert(!options.shiftKeyboardStep, 'NumberPicker sets its own shiftKeyboardStep');

    // AccessibleNumberSpinner options that depend on other options.
    // Initialize accessibility features. This must reach into incrementFunction to get the delta.
    // Both normal arrow and shift arrow keys use the delta computed with incrementFunction.
    const keyboardStep = options.incrementFunction(valueProperty.get()) - valueProperty.get();
    options.keyboardStep = keyboardStep;
    options.shiftKeyboardStep = keyboardStep;
    options.pdomTimerDelay = options.timerDelay;
    options.pdomTimerInterval = options.timerInterval;
    const boundsRequiredOptionKeys = _.pick(options, Node.REQUIRES_BOUNDS_OPTION_KEYS);
    super(_.omit(options, Node.REQUIRES_BOUNDS_OPTION_KEYS));

    //------------------------------------------------------------
    // Properties

    const incrementButtonStateProperty = new StringUnionProperty('up', {
      validValues: ButtonStateValues
    });
    const decrementButtonStateProperty = new StringUnionProperty('down', {
      validValues: ButtonStateValues
    });

    // must be disposed
    const incrementEnabledProperty = new DerivedProperty([valueProperty, rangeProperty], options.incrementEnabledFunction);

    // must be disposed
    const decrementEnabledProperty = new DerivedProperty([valueProperty, rangeProperty], options.decrementEnabledFunction);

    //------------------------------------------------------------
    // Nodes

    // displays the value
    const valueNode = new Text('', {
      font: options.font,
      pickable: false
    });

    // compute max width of text based on the width of all possible values.
    // See https://github.com/phetsims/area-model-common/issues/5
    let currentSampleValue = rangeProperty.get().min;
    const sampleValues = [];
    while (currentSampleValue <= rangeProperty.get().max) {
      sampleValues.push(currentSampleValue);
      currentSampleValue = options.incrementFunction(currentSampleValue);
      assert && assert(sampleValues.length < 500000, 'Don\'t infinite loop here');
    }
    let maxWidth = Math.max.apply(null, sampleValues.map(value => {
      valueNode.string = options.formatValue(value);
      return valueNode.width;
    }));
    // Cap the maxWidth if valueMaxWidth is provided, see https://github.com/phetsims/scenery-phet/issues/297
    if (options.valueMaxWidth !== null) {
      maxWidth = Math.min(maxWidth, options.valueMaxWidth);
    }

    // compute shape of the background behind the numeric value
    const backgroundWidth = maxWidth + 2 * options.xMargin;
    const backgroundHeight = valueNode.height + 2 * options.yMargin;
    const backgroundOverlap = 1;
    const backgroundCornerRadius = options.cornerRadius;

    // Apply the max-width AFTER computing the backgroundHeight, so it doesn't shrink vertically
    valueNode.maxWidth = maxWidth;

    // Top half of the background. Pressing here will increment the value.
    // Shape computed starting at upper-left, going clockwise.
    const incrementBackgroundNode = new Path(new Shape().arc(backgroundCornerRadius, backgroundCornerRadius, backgroundCornerRadius, Math.PI, Math.PI * 3 / 2, false).arc(backgroundWidth - backgroundCornerRadius, backgroundCornerRadius, backgroundCornerRadius, -Math.PI / 2, 0, false).lineTo(backgroundWidth, backgroundHeight / 2 + backgroundOverlap).lineTo(0, backgroundHeight / 2 + backgroundOverlap).close(), {
      pickable: false
    });

    // Bottom half of the background. Pressing here will decrement the value.
    // Shape computed starting at bottom-right, going clockwise.
    const decrementBackgroundNode = new Path(new Shape().arc(backgroundWidth - backgroundCornerRadius, backgroundHeight - backgroundCornerRadius, backgroundCornerRadius, 0, Math.PI / 2, false).arc(backgroundCornerRadius, backgroundHeight - backgroundCornerRadius, backgroundCornerRadius, Math.PI / 2, Math.PI, false).lineTo(0, backgroundHeight / 2).lineTo(backgroundWidth, backgroundHeight / 2).close(), {
      pickable: false
    });

    // separate rectangle for stroke around value background
    const strokedBackground = new Rectangle(0, 0, backgroundWidth, backgroundHeight, backgroundCornerRadius, backgroundCornerRadius, {
      pickable: false,
      stroke: options.backgroundStroke,
      lineWidth: options.backgroundLineWidth
    });

    // compute size of arrows
    const arrowButtonSize = new Dimension2(0.5 * backgroundWidth, options.arrowHeight);
    const arrowOptions = {
      stroke: options.arrowStroke,
      lineWidth: options.arrowLineWidth,
      pickable: false
    };

    // increment arrow, pointing up, described clockwise from tip
    this.incrementArrow = new Path(new Shape().moveTo(arrowButtonSize.width / 2, 0).lineTo(arrowButtonSize.width, arrowButtonSize.height).lineTo(0, arrowButtonSize.height).close(), arrowOptions);
    this.incrementArrow.centerX = incrementBackgroundNode.centerX;
    this.incrementArrow.bottom = incrementBackgroundNode.top - options.arrowYSpacing;

    // decrement arrow, pointing down, described clockwise from the tip
    this.decrementArrow = new Path(new Shape().moveTo(arrowButtonSize.width / 2, arrowButtonSize.height).lineTo(0, 0).lineTo(arrowButtonSize.width, 0).close(), arrowOptions);
    this.decrementArrow.centerX = decrementBackgroundNode.centerX;
    this.decrementArrow.top = decrementBackgroundNode.bottom + options.arrowYSpacing;

    // parents for increment and decrement components
    const incrementParent = new Node({
      children: [incrementBackgroundNode, this.incrementArrow]
    });
    incrementParent.addChild(new Rectangle(incrementParent.localBounds)); // invisible overlay
    const decrementParent = new Node({
      children: [decrementBackgroundNode, this.decrementArrow]
    });
    decrementParent.addChild(new Rectangle(decrementParent.localBounds)); // invisible overlay

    // rendering order
    this.addChild(incrementParent);
    this.addChild(decrementParent);
    this.addChild(strokedBackground);
    this.addChild(valueNode);

    //------------------------------------------------------------
    // Pointer areas

    // touch areas
    incrementParent.touchArea = Shape.rectangle(incrementParent.left - options.touchAreaXDilation / 2, incrementParent.top - options.touchAreaYDilation, incrementParent.width + options.touchAreaXDilation, incrementParent.height + options.touchAreaYDilation);
    decrementParent.touchArea = Shape.rectangle(decrementParent.left - options.touchAreaXDilation / 2, decrementParent.top, decrementParent.width + options.touchAreaXDilation, decrementParent.height + options.touchAreaYDilation);

    // mouse areas
    incrementParent.mouseArea = Shape.rectangle(incrementParent.left - options.mouseAreaXDilation / 2, incrementParent.top - options.mouseAreaYDilation, incrementParent.width + options.mouseAreaXDilation, incrementParent.height + options.mouseAreaYDilation);
    decrementParent.mouseArea = Shape.rectangle(decrementParent.left - options.mouseAreaXDilation / 2, decrementParent.top, decrementParent.width + options.mouseAreaXDilation, decrementParent.height + options.mouseAreaYDilation);

    //------------------------------------------------------------
    // Colors

    // arrow colors, corresponding to ButtonState and incrementEnabledProperty/decrementEnabledProperty
    const arrowColors = {
      up: options.color,
      over: options.color,
      down: options.pressedColor,
      out: options.color,
      disabled: 'rgb(176,176,176)'
    };

    // background colors, corresponding to ButtonState and enabledProperty.value
    const highlightGradient = createVerticalGradient(options.color, options.backgroundColor, options.color, backgroundHeight);
    const pressedGradient = createVerticalGradient(options.pressedColor, options.backgroundColor, options.pressedColor, backgroundHeight);
    const backgroundColors = {
      up: options.backgroundColor,
      over: highlightGradient,
      down: pressedGradient,
      out: pressedGradient,
      disabled: options.backgroundColor
    };

    //------------------------------------------------------------
    // Observers and InputListeners

    const inputListenerOptions = {
      fireOnHold: true,
      fireOnHoldDelay: options.timerDelay,
      fireOnHoldInterval: options.timerInterval
    };
    this.incrementInputListener = new NumberPickerInputListener(incrementButtonStateProperty, combineOptions({
      tandem: options.tandem.createTandem('incrementInputListener'),
      fire: event => {
        valueProperty.set(Math.min(options.incrementFunction(valueProperty.get()), rangeProperty.get().max));
        options.onInput(event);

        // voicing - speak the object/context responses on value change from user input
        this.voicingSpeakFullResponse({
          nameResponse: null,
          hintResponse: null
        });
      }
    }, inputListenerOptions));
    incrementParent.addInputListener(this.incrementInputListener);
    this.decrementInputListener = new NumberPickerInputListener(decrementButtonStateProperty, combineOptions({
      tandem: options.tandem.createTandem('decrementInputListener'),
      fire: event => {
        valueProperty.set(Math.max(options.decrementFunction(valueProperty.get()), rangeProperty.get().min));
        options.onInput(event);

        // voicing - speak the object/context responses on value change from user input
        this.voicingSpeakFullResponse({
          nameResponse: null,
          hintResponse: null
        });
      }
    }, inputListenerOptions));
    decrementParent.addInputListener(this.decrementInputListener);

    // enable/disable listeners and interaction: unlink unnecessary, Properties are owned by this instance
    incrementEnabledProperty.link(enabled => {
      !enabled && this.incrementInputListener.interrupt();
      incrementParent.pickable = enabled;
    });
    decrementEnabledProperty.link(enabled => {
      !enabled && this.decrementInputListener.interrupt();
      decrementParent.pickable = enabled;
    });

    // Update text to match the value
    const valueObserver = value => {
      if (value === null || value === undefined) {
        valueNode.string = options.noValueString;
        valueNode.x = (backgroundWidth - valueNode.width) / 2; // horizontally centered
      } else {
        valueNode.string = options.formatValue(value);
        if (options.align === 'center') {
          valueNode.centerX = incrementBackgroundNode.centerX;
        } else if (options.align === 'right') {
          valueNode.right = incrementBackgroundNode.right - options.xMargin;
        } else if (options.align === 'left') {
          valueNode.left = incrementBackgroundNode.left + options.xMargin;
        } else {
          throw new Error(`unsupported value for options.align: ${options.align}`);
        }
      }
      valueNode.centerY = backgroundHeight / 2;
    };
    valueProperty.link(valueObserver); // must be unlinked in dispose

    // Update colors for increment components.  No dispose is needed since dependencies are locally owned.
    Multilink.multilink([incrementButtonStateProperty, incrementEnabledProperty], (state, enabled) => {
      updateColors(state, enabled, incrementBackgroundNode, this.incrementArrow, backgroundColors, arrowColors);
    });

    // Update colors for decrement components.  No dispose is needed since dependencies are locally owned.
    Multilink.multilink([decrementButtonStateProperty, decrementEnabledProperty], (state, enabled) => {
      updateColors(state, enabled, decrementBackgroundNode, this.decrementArrow, backgroundColors, arrowColors);
    });

    // pdom - custom focus highlight that matches rounded background behind the numeric value
    const focusBounds = this.localBounds.dilated(HighlightPath.getDefaultDilationCoefficient());
    this.focusHighlight = new HighlightPath(Shape.roundedRectangleWithRadii(focusBounds.minX, focusBounds.minY, focusBounds.width, focusBounds.height, {
      topLeft: options.cornerRadius,
      topRight: options.cornerRadius,
      bottomLeft: options.cornerRadius,
      bottomRight: options.cornerRadius
    }));

    // update style with keyboard input, Emitters owned by this instance and disposed in AccessibleNumberSpinner
    this.pdomIncrementDownEmitter.addListener(isDown => {
      incrementButtonStateProperty.value = isDown ? 'down' : 'up';
    });
    this.pdomDecrementDownEmitter.addListener(isDown => {
      decrementButtonStateProperty.value = isDown ? 'down' : 'up';
    });
    this.addLinkedElement(valueProperty, {
      tandemName: 'valueProperty'
    });

    // Mutate options that require bounds after we have children
    this.mutate(boundsRequiredOptionKeys);
    this.disposeNumberPicker = () => {
      colorProperty && colorProperty.dispose();
      incrementEnabledProperty.dispose();
      decrementEnabledProperty.dispose();
      this.incrementArrow.dispose();
      this.decrementArrow.dispose();
      if (valueProperty.hasListener(valueObserver)) {
        valueProperty.unlink(valueObserver);
      }
    };

    // support for binder documentation, stripped out in builds and only runs when ?binder is specified
    assert && phet?.chipper?.queryParameters?.binder && InstanceRegistry.registerDataURL('scenery-phet', 'NumberPicker', this);
  }
  static createIcon(value, providedOptions) {
    const options = optionize()({
      // Highlight the increment button
      highlightIncrement: false,
      // Highlight the decrement button
      highlightDecrement: false,
      range: new Range(value - 1, value + 1),
      numberPickerOptions: {
        pickable: false,
        // phet-io
        tandem: Tandem.OPT_OUT // by default, icons don't need instrumentation
      }
    }, providedOptions);
    const numberPicker = new NumberPicker(new NumberProperty(value), new Property(options.range), options.numberPickerOptions);

    // we don't want this icon to have keyboard navigation, or description in the PDOM.
    numberPicker.removeFromPDOM();
    if (options.highlightDecrement) {
      numberPicker.decrementInputListener.isOverProperty.value = true;
    }
    if (options.highlightIncrement) {
      numberPicker.incrementInputListener.isOverProperty.value = true;
    }
    return numberPicker;
  }
  dispose() {
    this.disposeNumberPicker();
    super.dispose();
  }

  /**
   * Sets visibility of the arrows.
   */
  setArrowsVisible(visible) {
    if (!visible) {
      this.incrementInputListener.interrupt();
      this.decrementInputListener.interrupt();
    }
    this.incrementArrow.visible = visible;
    this.decrementArrow.visible = visible;
  }
}
/**
 * Converts FireListener events to state changes.
 */
class NumberPickerInputListener extends FireListener {
  constructor(buttonStateProperty, options) {
    super(options);

    // Update the button state.  No dispose is needed because the parent class disposes the dependencies.
    Multilink.multilink([this.isOverProperty, this.isPressedProperty], (isOver, isPressed) => {
      buttonStateProperty.set(isOver && !isPressed ? 'over' : isOver && isPressed ? 'down' : !isOver && !isPressed ? 'up' : 'out');
    });
  }
}

/**
 * Creates a vertical gradient.
 */
function createVerticalGradient(topColor, centerColor, bottomColor, height) {
  return new LinearGradient(0, 0, 0, height).addColorStop(0, topColor).addColorStop(0.5, centerColor).addColorStop(1, bottomColor);
}

/**
 * Updates arrow and background colors
 */
function updateColors(buttonState, enabled, backgroundNode, arrowNode, backgroundColors, arrowColors) {
  if (enabled) {
    arrowNode.stroke = 'black';
    if (buttonState === 'up') {
      backgroundNode.fill = backgroundColors.up;
      arrowNode.fill = arrowColors.up;
    } else if (buttonState === 'over') {
      backgroundNode.fill = backgroundColors.over;
      arrowNode.fill = arrowColors.over;
    } else if (buttonState === 'down') {
      backgroundNode.fill = backgroundColors.down;
      arrowNode.fill = arrowColors.down;
    } else if (buttonState === 'out') {
      backgroundNode.fill = backgroundColors.out;
      arrowNode.fill = arrowColors.out;
    } else {
      throw new Error(`unsupported buttonState: ${buttonState}`);
    }
  } else {
    backgroundNode.fill = backgroundColors.disabled;
    arrowNode.fill = arrowColors.disabled;
    arrowNode.stroke = arrowColors.disabled; // stroke so that arrow size will look the same when it's enabled/disabled
  }
}
sun.register('NumberPicker', NumberPicker);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTdHJpbmdVbmlvblByb3BlcnR5IiwiRGVyaXZlZFByb3BlcnR5IiwiTXVsdGlsaW5rIiwiTnVtYmVyUHJvcGVydHkiLCJQcm9wZXJ0eSIsIkRpbWVuc2lvbjIiLCJSYW5nZSIsIlV0aWxzIiwiU2hhcGUiLCJJbnN0YW5jZVJlZ2lzdHJ5IiwiQ29sb3IiLCJGaXJlTGlzdGVuZXIiLCJIaWdobGlnaHRQYXRoIiwiTGluZWFyR3JhZGllbnQiLCJOb2RlIiwiUGFpbnRDb2xvclByb3BlcnR5IiwiUGF0aCIsIlJlY3RhbmdsZSIsIlNjZW5lcnlDb25zdGFudHMiLCJUZXh0IiwiQWNjZXNzaWJsZU51bWJlclNwaW5uZXIiLCJnZW5lcmFsQm91bmRhcnlCb29wU291bmRQbGF5ZXIiLCJnZW5lcmFsU29mdENsaWNrU291bmRQbGF5ZXIiLCJQaGV0aW9PYmplY3QiLCJUYW5kZW0iLCJvcHRpb25pemUiLCJjb21iaW5lT3B0aW9ucyIsInN1biIsIlBoZXRGb250IiwiTWF0aFN5bWJvbHMiLCJCdXR0b25TdGF0ZVZhbHVlcyIsIk51bWJlclBpY2tlciIsImNvbnN0cnVjdG9yIiwidmFsdWVQcm9wZXJ0eSIsInJhbmdlUHJvcGVydHkiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwiY29sb3IiLCJiYWNrZ3JvdW5kQ29sb3IiLCJjb3JuZXJSYWRpdXMiLCJ4TWFyZ2luIiwieU1hcmdpbiIsImRlY2ltYWxQbGFjZXMiLCJmb250IiwiaW5jcmVtZW50RnVuY3Rpb24iLCJ2YWx1ZSIsImRlY3JlbWVudEZ1bmN0aW9uIiwidGltZXJEZWxheSIsInRpbWVySW50ZXJ2YWwiLCJub1ZhbHVlU3RyaW5nIiwiTk9fVkFMVUUiLCJhbGlnbiIsInRvdWNoQXJlYVhEaWxhdGlvbiIsInRvdWNoQXJlYVlEaWxhdGlvbiIsIm1vdXNlQXJlYVhEaWxhdGlvbiIsIm1vdXNlQXJlYVlEaWxhdGlvbiIsImJhY2tncm91bmRTdHJva2UiLCJiYWNrZ3JvdW5kTGluZVdpZHRoIiwiYXJyb3dIZWlnaHQiLCJhcnJvd1lTcGFjaW5nIiwiYXJyb3dTdHJva2UiLCJhcnJvd0xpbmVXaWR0aCIsInZhbHVlTWF4V2lkdGgiLCJvbklucHV0IiwiXyIsIm5vb3AiLCJpbmNyZW1lbnRFbmFibGVkRnVuY3Rpb24iLCJyYW5nZSIsInVuZGVmaW5lZCIsIm1heCIsImRlY3JlbWVudEVuYWJsZWRGdW5jdGlvbiIsIm1pbiIsImRpc2FibGVkT3BhY2l0eSIsIkRJU0FCTEVEX09QQUNJVFkiLCJ2YWx1ZUNoYW5nZWRTb3VuZFBsYXllciIsImJvdW5kYXJ5U291bmRQbGF5ZXIiLCJjdXJzb3IiLCJlbmFibGVkUmFuZ2VQcm9wZXJ0eSIsInBhZ2VLZXlib2FyZFN0ZXAiLCJ2b2ljaW5nT2JqZWN0UmVzcG9uc2UiLCJ0YW5kZW0iLCJSRVFVSVJFRCIsInRhbmRlbU5hbWVTdWZmaXgiLCJwaGV0aW9SZWFkT25seSIsIkRFRkFVTFRfT1BUSU9OUyIsInZpc2libGVQcm9wZXJ0eU9wdGlvbnMiLCJwaGV0aW9GZWF0dXJlZCIsInBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCIsImZvcm1hdFZhbHVlIiwidG9GaXhlZCIsImNvbG9yUHJvcGVydHkiLCJwcmVzc2VkQ29sb3IiLCJkYXJrZXJDb2xvciIsInByZXZpb3VzVmFsdWUiLCJwcm92aWRlZE9uSW5wdXRMaXN0ZW5lciIsImdldCIsInBsYXkiLCJhc3NlcnQiLCJrZXlib2FyZFN0ZXAiLCJzaGlmdEtleWJvYXJkU3RlcCIsInBkb21UaW1lckRlbGF5IiwicGRvbVRpbWVySW50ZXJ2YWwiLCJib3VuZHNSZXF1aXJlZE9wdGlvbktleXMiLCJwaWNrIiwiUkVRVUlSRVNfQk9VTkRTX09QVElPTl9LRVlTIiwib21pdCIsImluY3JlbWVudEJ1dHRvblN0YXRlUHJvcGVydHkiLCJ2YWxpZFZhbHVlcyIsImRlY3JlbWVudEJ1dHRvblN0YXRlUHJvcGVydHkiLCJpbmNyZW1lbnRFbmFibGVkUHJvcGVydHkiLCJkZWNyZW1lbnRFbmFibGVkUHJvcGVydHkiLCJ2YWx1ZU5vZGUiLCJwaWNrYWJsZSIsImN1cnJlbnRTYW1wbGVWYWx1ZSIsInNhbXBsZVZhbHVlcyIsInB1c2giLCJsZW5ndGgiLCJtYXhXaWR0aCIsIk1hdGgiLCJhcHBseSIsIm1hcCIsInN0cmluZyIsIndpZHRoIiwiYmFja2dyb3VuZFdpZHRoIiwiYmFja2dyb3VuZEhlaWdodCIsImhlaWdodCIsImJhY2tncm91bmRPdmVybGFwIiwiYmFja2dyb3VuZENvcm5lclJhZGl1cyIsImluY3JlbWVudEJhY2tncm91bmROb2RlIiwiYXJjIiwiUEkiLCJsaW5lVG8iLCJjbG9zZSIsImRlY3JlbWVudEJhY2tncm91bmROb2RlIiwic3Ryb2tlZEJhY2tncm91bmQiLCJzdHJva2UiLCJsaW5lV2lkdGgiLCJhcnJvd0J1dHRvblNpemUiLCJhcnJvd09wdGlvbnMiLCJpbmNyZW1lbnRBcnJvdyIsIm1vdmVUbyIsImNlbnRlclgiLCJib3R0b20iLCJ0b3AiLCJkZWNyZW1lbnRBcnJvdyIsImluY3JlbWVudFBhcmVudCIsImNoaWxkcmVuIiwiYWRkQ2hpbGQiLCJsb2NhbEJvdW5kcyIsImRlY3JlbWVudFBhcmVudCIsInRvdWNoQXJlYSIsInJlY3RhbmdsZSIsImxlZnQiLCJtb3VzZUFyZWEiLCJhcnJvd0NvbG9ycyIsInVwIiwib3ZlciIsImRvd24iLCJvdXQiLCJkaXNhYmxlZCIsImhpZ2hsaWdodEdyYWRpZW50IiwiY3JlYXRlVmVydGljYWxHcmFkaWVudCIsInByZXNzZWRHcmFkaWVudCIsImJhY2tncm91bmRDb2xvcnMiLCJpbnB1dExpc3RlbmVyT3B0aW9ucyIsImZpcmVPbkhvbGQiLCJmaXJlT25Ib2xkRGVsYXkiLCJmaXJlT25Ib2xkSW50ZXJ2YWwiLCJpbmNyZW1lbnRJbnB1dExpc3RlbmVyIiwiTnVtYmVyUGlja2VySW5wdXRMaXN0ZW5lciIsImNyZWF0ZVRhbmRlbSIsImZpcmUiLCJldmVudCIsInNldCIsInZvaWNpbmdTcGVha0Z1bGxSZXNwb25zZSIsIm5hbWVSZXNwb25zZSIsImhpbnRSZXNwb25zZSIsImFkZElucHV0TGlzdGVuZXIiLCJkZWNyZW1lbnRJbnB1dExpc3RlbmVyIiwibGluayIsImVuYWJsZWQiLCJpbnRlcnJ1cHQiLCJ2YWx1ZU9ic2VydmVyIiwieCIsInJpZ2h0IiwiRXJyb3IiLCJjZW50ZXJZIiwibXVsdGlsaW5rIiwic3RhdGUiLCJ1cGRhdGVDb2xvcnMiLCJmb2N1c0JvdW5kcyIsImRpbGF0ZWQiLCJnZXREZWZhdWx0RGlsYXRpb25Db2VmZmljaWVudCIsImZvY3VzSGlnaGxpZ2h0Iiwicm91bmRlZFJlY3RhbmdsZVdpdGhSYWRpaSIsIm1pblgiLCJtaW5ZIiwidG9wTGVmdCIsInRvcFJpZ2h0IiwiYm90dG9tTGVmdCIsImJvdHRvbVJpZ2h0IiwicGRvbUluY3JlbWVudERvd25FbWl0dGVyIiwiYWRkTGlzdGVuZXIiLCJpc0Rvd24iLCJwZG9tRGVjcmVtZW50RG93bkVtaXR0ZXIiLCJhZGRMaW5rZWRFbGVtZW50IiwidGFuZGVtTmFtZSIsIm11dGF0ZSIsImRpc3Bvc2VOdW1iZXJQaWNrZXIiLCJkaXNwb3NlIiwiaGFzTGlzdGVuZXIiLCJ1bmxpbmsiLCJwaGV0IiwiY2hpcHBlciIsInF1ZXJ5UGFyYW1ldGVycyIsImJpbmRlciIsInJlZ2lzdGVyRGF0YVVSTCIsImNyZWF0ZUljb24iLCJoaWdobGlnaHRJbmNyZW1lbnQiLCJoaWdobGlnaHREZWNyZW1lbnQiLCJudW1iZXJQaWNrZXJPcHRpb25zIiwiT1BUX09VVCIsIm51bWJlclBpY2tlciIsInJlbW92ZUZyb21QRE9NIiwiaXNPdmVyUHJvcGVydHkiLCJzZXRBcnJvd3NWaXNpYmxlIiwidmlzaWJsZSIsImJ1dHRvblN0YXRlUHJvcGVydHkiLCJpc1ByZXNzZWRQcm9wZXJ0eSIsImlzT3ZlciIsImlzUHJlc3NlZCIsInRvcENvbG9yIiwiY2VudGVyQ29sb3IiLCJib3R0b21Db2xvciIsImFkZENvbG9yU3RvcCIsImJ1dHRvblN0YXRlIiwiYmFja2dyb3VuZE5vZGUiLCJhcnJvd05vZGUiLCJmaWxsIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJOdW1iZXJQaWNrZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjItMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogTnVtYmVyUGlja2VyIGlzIGEgVUkgY29tcG9uZW50IGZvciBwaWNraW5nIGEgbnVtYmVyIHZhbHVlIGZyb20gYSByYW5nZS5cclxuICogVGhpcyBpcyBhY3R1YWxseSBhIG51bWJlciBzcGlubmVyLCBidXQgUGhFVCByZWZlcnMgdG8gaXQgYXMgYSAncGlja2VyJywgc28gdGhhdCdzIHdoYXQgdGhpcyBjbGFzcyBpcyBuYW1lZC5cclxuICpcclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICovXHJcblxyXG5pbXBvcnQgU3RyaW5nVW5pb25Qcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1N0cmluZ1VuaW9uUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgRGVyaXZlZFByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvRGVyaXZlZFByb3BlcnR5LmpzJztcclxuaW1wb3J0IE11bHRpbGluayBmcm9tICcuLi8uLi9heG9uL2pzL011bHRpbGluay5qcyc7XHJcbmltcG9ydCBOdW1iZXJQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL051bWJlclByb3BlcnR5LmpzJztcclxuaW1wb3J0IFByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgRGltZW5zaW9uMiBmcm9tICcuLi8uLi9kb3QvanMvRGltZW5zaW9uMi5qcyc7XHJcbmltcG9ydCBSYW5nZSBmcm9tICcuLi8uLi9kb3QvanMvUmFuZ2UuanMnO1xyXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vZG90L2pzL1V0aWxzLmpzJztcclxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tICcuLi8uLi9raXRlL2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgSW5zdGFuY2VSZWdpc3RyeSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvZG9jdW1lbnRhdGlvbi9JbnN0YW5jZVJlZ2lzdHJ5LmpzJztcclxuaW1wb3J0IHsgQ29sb3IsIEZpcmVMaXN0ZW5lciwgRmlyZUxpc3RlbmVyT3B0aW9ucywgRm9udCwgSGlnaGxpZ2h0UGF0aCwgTGluZWFyR3JhZGllbnQsIE5vZGUsIE5vZGVPcHRpb25zLCBQYWludENvbG9yUHJvcGVydHksIFBhdGgsIFJlY3RhbmdsZSwgU2NlbmVyeUNvbnN0YW50cywgU2NlbmVyeUV2ZW50LCBUQ29sb3IsIFRleHQgfSBmcm9tICcuLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgQWNjZXNzaWJsZU51bWJlclNwaW5uZXIsIHsgQWNjZXNzaWJsZU51bWJlclNwaW5uZXJPcHRpb25zIH0gZnJvbSAnLi4vLi4vc3VuL2pzL2FjY2Vzc2liaWxpdHkvQWNjZXNzaWJsZU51bWJlclNwaW5uZXIuanMnO1xyXG5pbXBvcnQgZ2VuZXJhbEJvdW5kYXJ5Qm9vcFNvdW5kUGxheWVyIGZyb20gJy4uLy4uL3RhbWJvL2pzL3NoYXJlZC1zb3VuZC1wbGF5ZXJzL2dlbmVyYWxCb3VuZGFyeUJvb3BTb3VuZFBsYXllci5qcyc7XHJcbmltcG9ydCBnZW5lcmFsU29mdENsaWNrU291bmRQbGF5ZXIgZnJvbSAnLi4vLi4vdGFtYm8vanMvc2hhcmVkLXNvdW5kLXBsYXllcnMvZ2VuZXJhbFNvZnRDbGlja1NvdW5kUGxheWVyLmpzJztcclxuaW1wb3J0IFBoZXRpb09iamVjdCBmcm9tICcuLi8uLi90YW5kZW0vanMvUGhldGlvT2JqZWN0LmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuaW1wb3J0IFRSZWFkT25seVByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgVFNvdW5kUGxheWVyIGZyb20gJy4uLy4uL3RhbWJvL2pzL1RTb3VuZFBsYXllci5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBjb21iaW5lT3B0aW9ucywgRW1wdHlTZWxmT3B0aW9ucyB9IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgc3VuIGZyb20gJy4vc3VuLmpzJztcclxuaW1wb3J0IFBoZXRGb250IGZyb20gJy4uLy4uL3NjZW5lcnktcGhldC9qcy9QaGV0Rm9udC5qcyc7XHJcbmltcG9ydCBNYXRoU3ltYm9scyBmcm9tICcuLi8uLi9zY2VuZXJ5LXBoZXQvanMvTWF0aFN5bWJvbHMuanMnO1xyXG5cclxuY29uc3QgQnV0dG9uU3RhdGVWYWx1ZXMgPSBbICd1cCcsICdkb3duJywgJ292ZXInLCAnb3V0JyBdIGFzIGNvbnN0O1xyXG50eXBlIEJ1dHRvblN0YXRlID0gKCB0eXBlb2YgQnV0dG9uU3RhdGVWYWx1ZXMgKVtudW1iZXJdO1xyXG5cclxudHlwZSBBbGlnbiA9ICdjZW50ZXInIHwgJ2xlZnQnIHwgJ3JpZ2h0JztcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcbiAgY29sb3I/OiBUQ29sb3I7IC8vIGNvbG9yIG9mIGFycm93cyBhbmQgdG9wL2JvdHRvbSBncmFkaWVudCBvbiBwb2ludGVyIG92ZXJcclxuICBwcmVzc2VkQ29sb3I/OiBUQ29sb3I7IC8vIGNvbG9yIG9mIGFycm93cyBhbmQgdG9wL2JvdHRvbSBncmFkaWVudCB3aGVuIHByZXNzZWQsIGRlcml2ZWQgaWYgbm90IHByb3ZpZGVkXHJcbiAgYmFja2dyb3VuZENvbG9yPzogVENvbG9yOyAvLyBjb2xvciBvZiB0aGUgYmFja2dyb3VuZCB3aGVuIHBvaW50ZXIgaXMgbm90IG92ZXIgaXRcclxuICBjb3JuZXJSYWRpdXM/OiBudW1iZXI7XHJcbiAgeE1hcmdpbj86IG51bWJlcjtcclxuICB5TWFyZ2luPzogbnVtYmVyO1xyXG4gIGRlY2ltYWxQbGFjZXM/OiBudW1iZXI7XHJcbiAgZm9udD86IEZvbnQ7XHJcbiAgaW5jcmVtZW50RnVuY3Rpb24/OiAoIHZhbHVlOiBudW1iZXIgKSA9PiBudW1iZXI7XHJcbiAgZGVjcmVtZW50RnVuY3Rpb24/OiAoIHZhbHVlOiBudW1iZXIgKSA9PiBudW1iZXI7XHJcbiAgdGltZXJEZWxheT86IG51bWJlcjsgLy8gc3RhcnQgdG8gZmlyZSBjb250aW51b3VzbHkgYWZ0ZXIgcHJlc3NpbmcgZm9yIHRoaXMgbG9uZyAobWlsbGlzZWNvbmRzKVxyXG4gIHRpbWVySW50ZXJ2YWw/OiBudW1iZXI7IC8vIGZpcmUgY29udGludW91c2x5IGF0IHRoaXMgZnJlcXVlbmN5IChtaWxsaXNlY29uZHMpLFxyXG4gIG5vVmFsdWVTdHJpbmc/OiBzdHJpbmc7IC8vIHN0cmluZyB0byBkaXNwbGF5IGlmIHZhbHVlUHJvcGVydHkuZ2V0IGlzIG51bGwgb3IgdW5kZWZpbmVkXHJcbiAgYWxpZ24/OiBBbGlnbjsgLy8gaG9yaXpvbnRhbCBhbGlnbm1lbnQgb2YgdGhlIHZhbHVlXHJcbiAgdG91Y2hBcmVhWERpbGF0aW9uPzogbnVtYmVyO1xyXG4gIHRvdWNoQXJlYVlEaWxhdGlvbj86IG51bWJlcjtcclxuICBtb3VzZUFyZWFYRGlsYXRpb24/OiBudW1iZXI7XHJcbiAgbW91c2VBcmVhWURpbGF0aW9uPzogbnVtYmVyO1xyXG4gIGJhY2tncm91bmRTdHJva2U/OiBUQ29sb3I7XHJcbiAgYmFja2dyb3VuZExpbmVXaWR0aD86IG51bWJlcjtcclxuICBhcnJvd0hlaWdodD86IG51bWJlcjtcclxuICBhcnJvd1lTcGFjaW5nPzogbnVtYmVyO1xyXG4gIGFycm93U3Ryb2tlPzogVENvbG9yO1xyXG4gIGFycm93TGluZVdpZHRoPzogbnVtYmVyO1xyXG4gIHZhbHVlTWF4V2lkdGg/OiBudW1iZXIgfCBudWxsOyAvLyBJZiBub24tbnVsbCwgaXQgd2lsbCBjYXAgdGhlIHZhbHVlJ3MgbWF4V2lkdGggdG8gdGhpcyB2YWx1ZVxyXG5cclxuICAvKipcclxuICAgKiBDb252ZXJ0cyBhIHZhbHVlIHRvIGEgc3RyaW5nIHRvIGJlIGRpc3BsYXllZCBpbiBhIFRleHQgbm9kZS4gTk9URTogSWYgdGhpcyBmdW5jdGlvbiBjYW4gZ2l2ZSBkaWZmZXJlbnQgc3RyaW5nc1xyXG4gICAqIHRvIHRoZSBzYW1lIHZhbHVlIGRlcGVuZGluZyBvbiBleHRlcm5hbCBzdGF0ZSwgaXQgaXMgcmVjb21tZW5kZWQgdG8gcmVidWlsZCB0aGUgTnVtYmVyUGlja2VyIHdoZW4gdGhhdCBzdGF0ZVxyXG4gICAqIGNoYW5nZXMgKGFzIGl0IHVzZXMgZm9ybWF0VmFsdWUgb3ZlciB0aGUgaW5pdGlhbCByYW5nZSB0byBkZXRlcm1pbmUgdGhlIGJvdW5kcyB0aGF0IGxhYmVscyBjYW4gdGFrZSkuXHJcbiAgICovXHJcbiAgZm9ybWF0VmFsdWU/OiAoIHZhbHVlOiBudW1iZXIgKSA9PiBzdHJpbmc7XHJcblxyXG4gIC8vIExpc3RlbmVyIHRoYXQgaXMgY2FsbGVkIHdoZW4gdGhlIE51bWJlclBpY2tlciBoYXMgaW5wdXQgb24gaXQgZHVlIHRvIHVzZXIgaW50ZXJhY3Rpb24uXHJcbiAgb25JbnB1dD86ICgpID0+IHZvaWQ7XHJcblxyXG4gIC8vIERldGVybWluZXMgd2hlbiB0aGUgaW5jcmVtZW50IGFycm93IGlzIGVuYWJsZWQuXHJcbiAgaW5jcmVtZW50RW5hYmxlZEZ1bmN0aW9uPzogKCB2YWx1ZTogbnVtYmVyLCByYW5nZTogUmFuZ2UgKSA9PiBib29sZWFuO1xyXG5cclxuICAvLyBEZXRlcm1pbmVzIHdoZW4gdGhlIGRlY3JlbWVudCBhcnJvdyBpcyBlbmFibGVkLlxyXG4gIGRlY3JlbWVudEVuYWJsZWRGdW5jdGlvbj86ICggdmFsdWU6IG51bWJlciwgcmFuZ2U6IFJhbmdlICkgPT4gYm9vbGVhbjtcclxuXHJcbiAgLy8gT3BhY2l0eSB1c2VkIHRvIGluZGljYXRlIGRpc2FibGVkLCBbMCwxXSBleGNsdXNpdmVcclxuICBkaXNhYmxlZE9wYWNpdHk/OiBudW1iZXI7XHJcblxyXG4gIC8vIFNvdW5kIGdlbmVyYXRvcnMgZm9yIHdoZW4gdGhlIE51bWJlclBpY2tlcidzIHZhbHVlIGNoYW5nZXMsIGFuZCB3aGVuIGl0IGhpdHMgcmFuZ2UgZXh0cmVtaXRpZXMuXHJcbiAgLy8gVXNlIG51bGxTb3VuZFBsYXllciB0byBkaXNhYmxlLlxyXG4gIHZhbHVlQ2hhbmdlZFNvdW5kUGxheWVyPzogVFNvdW5kUGxheWVyO1xyXG4gIGJvdW5kYXJ5U291bmRQbGF5ZXI/OiBUU291bmRQbGF5ZXI7XHJcbn07XHJcblxyXG50eXBlIFBhcmVudE9wdGlvbnMgPSBBY2Nlc3NpYmxlTnVtYmVyU3Bpbm5lck9wdGlvbnMgJiBOb2RlT3B0aW9ucztcclxuXHJcbmV4cG9ydCB0eXBlIE51bWJlclBpY2tlck9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIFN0cmljdE9taXQ8UGFyZW50T3B0aW9ucywgJ3ZhbHVlUHJvcGVydHknIHwgJ2VuYWJsZWRSYW5nZVByb3BlcnR5JyB8ICdwZG9tVGltZXJEZWxheScgfCAncGRvbVRpbWVySW50ZXJ2YWwnPjtcclxuXHJcbi8vIG9wdGlvbnMgdG8gTnVtYmVyUGlja2VyLmNyZWF0ZUljb25cclxudHlwZSBDcmVhdGVJY29uT3B0aW9ucyA9IHtcclxuICBoaWdobGlnaHRJbmNyZW1lbnQ/OiBib29sZWFuOyAvLyB3aGV0aGVyIHRvIGhpZ2hsaWdodCB0aGUgaW5jcmVtZW50IGJ1dHRvblxyXG4gIGhpZ2hsaWdodERlY3JlbWVudD86IGZhbHNlOyAvLyB3aGV0aGVyIHRvIGhpZ2hsaWdodCB0aGUgZGVjcmVtZW50IGJ1dHRvblxyXG4gIHJhbmdlPzogUmFuZ2U7IC8vIHJhbmdlIHNob3duIG9uIHRoZSBpY29uXHJcbiAgbnVtYmVyUGlja2VyT3B0aW9ucz86IE51bWJlclBpY2tlck9wdGlvbnM7XHJcbn07XHJcblxyXG50eXBlIEFycm93Q29sb3JzID0ge1xyXG4gIHVwOiBUQ29sb3I7XHJcbiAgb3ZlcjogVENvbG9yO1xyXG4gIGRvd246IFRDb2xvcjtcclxuICBvdXQ6IFRDb2xvcjtcclxuICBkaXNhYmxlZDogVENvbG9yO1xyXG59O1xyXG5cclxudHlwZSBCYWNrZ3JvdW5kQ29sb3JzID0ge1xyXG4gIHVwOiBUQ29sb3I7XHJcbiAgb3ZlcjogTGluZWFyR3JhZGllbnQ7XHJcbiAgZG93bjogTGluZWFyR3JhZGllbnQ7XHJcbiAgb3V0OiBMaW5lYXJHcmFkaWVudDtcclxuICBkaXNhYmxlZDogVENvbG9yO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTnVtYmVyUGlja2VyIGV4dGVuZHMgQWNjZXNzaWJsZU51bWJlclNwaW5uZXIoIE5vZGUsIDAgKSB7XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgaW5jcmVtZW50QXJyb3c6IFBhdGg7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBkZWNyZW1lbnRBcnJvdzogUGF0aDtcclxuICBwcml2YXRlIHJlYWRvbmx5IGluY3JlbWVudElucHV0TGlzdGVuZXI6IE51bWJlclBpY2tlcklucHV0TGlzdGVuZXI7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBkZWNyZW1lbnRJbnB1dExpc3RlbmVyOiBOdW1iZXJQaWNrZXJJbnB1dExpc3RlbmVyO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzcG9zZU51bWJlclBpY2tlcjogKCkgPT4gdm9pZDtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHZhbHVlUHJvcGVydHlcclxuICAgKiBAcGFyYW0gcmFuZ2VQcm9wZXJ0eSAtIElmIHRoZSByYW5nZSBpcyBhbnRpY2lwYXRlZCB0byBjaGFuZ2UsIGl0J3MgYmVzdCB0byBoYXZlIHRoZSByYW5nZSBQcm9wZXJ0eSBjb250YWluIHRoZVxyXG4gICAqIChtYXhpbXVtKSB1bmlvbiBvZiBhbGwgcG90ZW50aWFsIGNoYW5nZXMsIHNvIHRoYXQgTnVtYmVyUGlja2VyIGNhbiBpdGVyYXRlIHRocm91Z2ggYWxsIHBvc3NpYmxlIHZhbHVlcyBhbmQgY29tcHV0ZVxyXG4gICAqIHRoZSBib3VuZHMgb2YgdGhlIGxhYmVscy5cclxuICAgKiBAcGFyYW0gW3Byb3ZpZGVkT3B0aW9uc11cclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHZhbHVlUHJvcGVydHk6IFByb3BlcnR5PG51bWJlcj4sIHJhbmdlUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PFJhbmdlPixcclxuICAgICAgICAgICAgICAgICAgICAgIHByb3ZpZGVkT3B0aW9ucz86IE51bWJlclBpY2tlck9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxOdW1iZXJQaWNrZXJPcHRpb25zLCBTdHJpY3RPbWl0PFNlbGZPcHRpb25zLCAncHJlc3NlZENvbG9yJyB8ICdmb3JtYXRWYWx1ZSc+LCBQYXJlbnRPcHRpb25zPigpKCB7XHJcblxyXG4gICAgICAvLyBTZWxmT3B0aW9uc1xyXG4gICAgICBjb2xvcjogbmV3IENvbG9yKCAwLCAwLCAyNTUgKSxcclxuICAgICAgYmFja2dyb3VuZENvbG9yOiAnd2hpdGUnLFxyXG4gICAgICBjb3JuZXJSYWRpdXM6IDYsXHJcbiAgICAgIHhNYXJnaW46IDMsXHJcbiAgICAgIHlNYXJnaW46IDMsXHJcbiAgICAgIGRlY2ltYWxQbGFjZXM6IDAsXHJcbiAgICAgIGZvbnQ6IG5ldyBQaGV0Rm9udCggMjQgKSxcclxuICAgICAgaW5jcmVtZW50RnVuY3Rpb246ICggdmFsdWU6IG51bWJlciApID0+IHZhbHVlICsgMSxcclxuICAgICAgZGVjcmVtZW50RnVuY3Rpb246ICggdmFsdWU6IG51bWJlciApID0+IHZhbHVlIC0gMSxcclxuICAgICAgdGltZXJEZWxheTogNDAwLFxyXG4gICAgICB0aW1lckludGVydmFsOiAxMDAsXHJcbiAgICAgIG5vVmFsdWVTdHJpbmc6IE1hdGhTeW1ib2xzLk5PX1ZBTFVFLFxyXG4gICAgICBhbGlnbjogJ2NlbnRlcicsXHJcbiAgICAgIHRvdWNoQXJlYVhEaWxhdGlvbjogMTAsXHJcbiAgICAgIHRvdWNoQXJlYVlEaWxhdGlvbjogMTAsXHJcbiAgICAgIG1vdXNlQXJlYVhEaWxhdGlvbjogMCxcclxuICAgICAgbW91c2VBcmVhWURpbGF0aW9uOiA1LFxyXG4gICAgICBiYWNrZ3JvdW5kU3Ryb2tlOiAnZ3JheScsXHJcbiAgICAgIGJhY2tncm91bmRMaW5lV2lkdGg6IDAuNSxcclxuICAgICAgYXJyb3dIZWlnaHQ6IDYsXHJcbiAgICAgIGFycm93WVNwYWNpbmc6IDMsXHJcbiAgICAgIGFycm93U3Ryb2tlOiAnYmxhY2snLFxyXG4gICAgICBhcnJvd0xpbmVXaWR0aDogMC4yNSxcclxuICAgICAgdmFsdWVNYXhXaWR0aDogbnVsbCxcclxuICAgICAgb25JbnB1dDogXy5ub29wLFxyXG4gICAgICBpbmNyZW1lbnRFbmFibGVkRnVuY3Rpb246ICggdmFsdWU6IG51bWJlciwgcmFuZ2U6IFJhbmdlICkgPT4gKCB2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlIDwgcmFuZ2UubWF4ICksXHJcbiAgICAgIGRlY3JlbWVudEVuYWJsZWRGdW5jdGlvbjogKCB2YWx1ZTogbnVtYmVyLCByYW5nZTogUmFuZ2UgKSA9PiAoIHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgPiByYW5nZS5taW4gKSxcclxuICAgICAgZGlzYWJsZWRPcGFjaXR5OiBTY2VuZXJ5Q29uc3RhbnRzLkRJU0FCTEVEX09QQUNJVFksXHJcbiAgICAgIHZhbHVlQ2hhbmdlZFNvdW5kUGxheWVyOiBnZW5lcmFsU29mdENsaWNrU291bmRQbGF5ZXIsXHJcbiAgICAgIGJvdW5kYXJ5U291bmRQbGF5ZXI6IGdlbmVyYWxCb3VuZGFyeUJvb3BTb3VuZFBsYXllcixcclxuXHJcbiAgICAgIC8vIFBhcmVudE9wdGlvbnNcclxuICAgICAgY3Vyc29yOiAncG9pbnRlcicsXHJcbiAgICAgIHZhbHVlUHJvcGVydHk6IHZhbHVlUHJvcGVydHksXHJcbiAgICAgIGVuYWJsZWRSYW5nZVByb3BlcnR5OiByYW5nZVByb3BlcnR5LFxyXG4gICAgICBwYWdlS2V5Ym9hcmRTdGVwOiAyLFxyXG4gICAgICB2b2ljaW5nT2JqZWN0UmVzcG9uc2U6ICgpID0+IHZhbHVlUHJvcGVydHkudmFsdWUsIC8vIGJ5IGRlZmF1bHQsIGp1c3Qgc3BlYWsgdGhlIHZhbHVlXHJcblxyXG4gICAgICAvLyBwaGV0LWlvXHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLlJFUVVJUkVELFxyXG4gICAgICB0YW5kZW1OYW1lU3VmZml4OiAnUGlja2VyJyxcclxuICAgICAgcGhldGlvUmVhZE9ubHk6IFBoZXRpb09iamVjdC5ERUZBVUxUX09QVElPTlMucGhldGlvUmVhZE9ubHksXHJcbiAgICAgIHZpc2libGVQcm9wZXJ0eU9wdGlvbnM6IHsgcGhldGlvRmVhdHVyZWQ6IHRydWUgfSxcclxuICAgICAgcGhldGlvRW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkOiB0cnVlLFxyXG4gICAgICBwaGV0aW9GZWF0dXJlZDogdHJ1ZVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgaWYgKCAhb3B0aW9ucy5mb3JtYXRWYWx1ZSApIHtcclxuICAgICAgb3B0aW9ucy5mb3JtYXRWYWx1ZSA9ICggdmFsdWU6IG51bWJlciApID0+IFV0aWxzLnRvRml4ZWQoIHZhbHVlLCBvcHRpb25zLmRlY2ltYWxQbGFjZXMgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDb2xvciBvZiBhcnJvd3MgYW5kIHRvcC9ib3R0b20gZ3JhZGllbnQgd2hlbiBwcmVzc2VkXHJcbiAgICBsZXQgY29sb3JQcm9wZXJ0eTogUGFpbnRDb2xvclByb3BlcnR5IHwgbnVsbCA9IG51bGw7XHJcbiAgICBpZiAoIG9wdGlvbnMucHJlc3NlZENvbG9yID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgIGNvbG9yUHJvcGVydHkgPSBuZXcgUGFpbnRDb2xvclByb3BlcnR5KCBvcHRpb25zLmNvbG9yICk7IC8vIGRpc3Bvc2UgcmVxdWlyZWQhXHJcblxyXG4gICAgICAvLyBObyByZWZlcmVuY2UgbmVlZHMgdG8gYmUga2VwdCwgc2luY2Ugd2UgZGlzcG9zZSBpdHMgZGVwZW5kZW5jeS5cclxuICAgICAgb3B0aW9ucy5wcmVzc2VkQ29sb3IgPSBuZXcgRGVyaXZlZFByb3BlcnR5KCBbIGNvbG9yUHJvcGVydHkgXSwgY29sb3IgPT4gY29sb3IuZGFya2VyQ29sb3IoKSApO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBwcmV2aW91c1ZhbHVlID0gdmFsdWVQcm9wZXJ0eS52YWx1ZTtcclxuXHJcbiAgICAvLyBPdmVyd3JpdGUgdGhlIHBhc3NlZC1pbiBvbklucHV0IGxpc3RlbmVyIHRvIG1ha2Ugc3VyZSB0aGF0IHNvdW5kIGltcGxlbWVudGF0aW9uIGNhbid0IGJlIGJsb3duIGF3YXkgaW4gdGhlXHJcbiAgICAvLyBkZWZhdWx0cy5cclxuICAgIGNvbnN0IHByb3ZpZGVkT25JbnB1dExpc3RlbmVyID0gb3B0aW9ucy5vbklucHV0O1xyXG4gICAgb3B0aW9ucy5vbklucHV0ID0gKCkgPT4ge1xyXG4gICAgICBwcm92aWRlZE9uSW5wdXRMaXN0ZW5lcigpO1xyXG5cclxuICAgICAgLy8gVGhlIG9uSW5wdXQgbGlzdGVuZXIgbWF5IGJlIGNhbGxlZCB3aGVuIG5vIGNoYW5nZSB0byB0aGUgdmFsdWUgaGFzIGFjdHVhbGx5IGhhcHBlbmVkLCBzZWVcclxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3N1bi9pc3N1ZXMvNzYwLiAgV2UgZG8gc29tZSBjaGVja3MgaGVyZSB0byBtYWtlIHN1cmUgdGhlIHNvdW5kIGlzIG9ubHkgZ2VuZXJhdGVkXHJcbiAgICAgIC8vIHdoZW4gYSBjaGFuZ2Ugb2NjdXJzLlxyXG4gICAgICBpZiAoIHZhbHVlUHJvcGVydHkudmFsdWUgIT09IHByZXZpb3VzVmFsdWUgKSB7XHJcblxyXG4gICAgICAgIC8vIFBsYXkgdGhlIGJvdW5kYXJ5IHNvdW5kIElmIHRoZSB2YWx1ZSBpcyBhdCBtaW4gb3IgbWF4LCBvdGhlcndpc2UgcGxheSB0aGUgZGVmYXVsdCBzb3VuZC5cclxuICAgICAgICBpZiAoIHZhbHVlUHJvcGVydHkudmFsdWUgPT09IHJhbmdlUHJvcGVydHkuZ2V0KCkubWF4IHx8IHZhbHVlUHJvcGVydHkudmFsdWUgPT09IHJhbmdlUHJvcGVydHkuZ2V0KCkubWluICkge1xyXG4gICAgICAgICAgb3B0aW9ucy5ib3VuZGFyeVNvdW5kUGxheWVyLnBsYXkoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBvcHRpb25zLnZhbHVlQ2hhbmdlZFNvdW5kUGxheWVyLnBsYXkoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHByZXZpb3VzVmFsdWUgPSB2YWx1ZVByb3BlcnR5LnZhbHVlO1xyXG4gICAgfTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhb3B0aW9ucy5rZXlib2FyZFN0ZXAsICdOdW1iZXJQaWNrZXIgc2V0cyBpdHMgb3duIGtleWJvYXJkU3RlcCcgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFvcHRpb25zLnNoaWZ0S2V5Ym9hcmRTdGVwLCAnTnVtYmVyUGlja2VyIHNldHMgaXRzIG93biBzaGlmdEtleWJvYXJkU3RlcCcgKTtcclxuXHJcbiAgICAvLyBBY2Nlc3NpYmxlTnVtYmVyU3Bpbm5lciBvcHRpb25zIHRoYXQgZGVwZW5kIG9uIG90aGVyIG9wdGlvbnMuXHJcbiAgICAvLyBJbml0aWFsaXplIGFjY2Vzc2liaWxpdHkgZmVhdHVyZXMuIFRoaXMgbXVzdCByZWFjaCBpbnRvIGluY3JlbWVudEZ1bmN0aW9uIHRvIGdldCB0aGUgZGVsdGEuXHJcbiAgICAvLyBCb3RoIG5vcm1hbCBhcnJvdyBhbmQgc2hpZnQgYXJyb3cga2V5cyB1c2UgdGhlIGRlbHRhIGNvbXB1dGVkIHdpdGggaW5jcmVtZW50RnVuY3Rpb24uXHJcbiAgICBjb25zdCBrZXlib2FyZFN0ZXAgPSBvcHRpb25zLmluY3JlbWVudEZ1bmN0aW9uKCB2YWx1ZVByb3BlcnR5LmdldCgpICkgLSB2YWx1ZVByb3BlcnR5LmdldCgpO1xyXG4gICAgb3B0aW9ucy5rZXlib2FyZFN0ZXAgPSBrZXlib2FyZFN0ZXA7XHJcbiAgICBvcHRpb25zLnNoaWZ0S2V5Ym9hcmRTdGVwID0ga2V5Ym9hcmRTdGVwO1xyXG4gICAgb3B0aW9ucy5wZG9tVGltZXJEZWxheSA9IG9wdGlvbnMudGltZXJEZWxheTtcclxuICAgIG9wdGlvbnMucGRvbVRpbWVySW50ZXJ2YWwgPSBvcHRpb25zLnRpbWVySW50ZXJ2YWw7XHJcblxyXG4gICAgY29uc3QgYm91bmRzUmVxdWlyZWRPcHRpb25LZXlzID0gXy5waWNrKCBvcHRpb25zLCBOb2RlLlJFUVVJUkVTX0JPVU5EU19PUFRJT05fS0VZUyApO1xyXG4gICAgc3VwZXIoIF8ub21pdCggb3B0aW9ucywgTm9kZS5SRVFVSVJFU19CT1VORFNfT1BUSU9OX0tFWVMgKSApO1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBQcm9wZXJ0aWVzXHJcblxyXG4gICAgY29uc3QgaW5jcmVtZW50QnV0dG9uU3RhdGVQcm9wZXJ0eSA9IG5ldyBTdHJpbmdVbmlvblByb3BlcnR5KCAndXAnLCB7XHJcbiAgICAgIHZhbGlkVmFsdWVzOiBCdXR0b25TdGF0ZVZhbHVlc1xyXG4gICAgfSApO1xyXG4gICAgY29uc3QgZGVjcmVtZW50QnV0dG9uU3RhdGVQcm9wZXJ0eSA9IG5ldyBTdHJpbmdVbmlvblByb3BlcnR5KCAnZG93bicsIHtcclxuICAgICAgdmFsaWRWYWx1ZXM6IEJ1dHRvblN0YXRlVmFsdWVzXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gbXVzdCBiZSBkaXNwb3NlZFxyXG4gICAgY29uc3QgaW5jcmVtZW50RW5hYmxlZFByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuPiA9XHJcbiAgICAgIG5ldyBEZXJpdmVkUHJvcGVydHkoIFsgdmFsdWVQcm9wZXJ0eSwgcmFuZ2VQcm9wZXJ0eSBdLCBvcHRpb25zLmluY3JlbWVudEVuYWJsZWRGdW5jdGlvbiApO1xyXG5cclxuICAgIC8vIG11c3QgYmUgZGlzcG9zZWRcclxuICAgIGNvbnN0IGRlY3JlbWVudEVuYWJsZWRQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj4gPVxyXG4gICAgICBuZXcgRGVyaXZlZFByb3BlcnR5KCBbIHZhbHVlUHJvcGVydHksIHJhbmdlUHJvcGVydHkgXSwgb3B0aW9ucy5kZWNyZW1lbnRFbmFibGVkRnVuY3Rpb24gKTtcclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gTm9kZXNcclxuXHJcbiAgICAvLyBkaXNwbGF5cyB0aGUgdmFsdWVcclxuICAgIGNvbnN0IHZhbHVlTm9kZSA9IG5ldyBUZXh0KCAnJywgeyBmb250OiBvcHRpb25zLmZvbnQsIHBpY2thYmxlOiBmYWxzZSB9ICk7XHJcblxyXG4gICAgLy8gY29tcHV0ZSBtYXggd2lkdGggb2YgdGV4dCBiYXNlZCBvbiB0aGUgd2lkdGggb2YgYWxsIHBvc3NpYmxlIHZhbHVlcy5cclxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYXJlYS1tb2RlbC1jb21tb24vaXNzdWVzLzVcclxuICAgIGxldCBjdXJyZW50U2FtcGxlVmFsdWUgPSByYW5nZVByb3BlcnR5LmdldCgpLm1pbjtcclxuICAgIGNvbnN0IHNhbXBsZVZhbHVlcyA9IFtdO1xyXG4gICAgd2hpbGUgKCBjdXJyZW50U2FtcGxlVmFsdWUgPD0gcmFuZ2VQcm9wZXJ0eS5nZXQoKS5tYXggKSB7XHJcbiAgICAgIHNhbXBsZVZhbHVlcy5wdXNoKCBjdXJyZW50U2FtcGxlVmFsdWUgKTtcclxuICAgICAgY3VycmVudFNhbXBsZVZhbHVlID0gb3B0aW9ucy5pbmNyZW1lbnRGdW5jdGlvbiggY3VycmVudFNhbXBsZVZhbHVlICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHNhbXBsZVZhbHVlcy5sZW5ndGggPCA1MDAwMDAsICdEb25cXCd0IGluZmluaXRlIGxvb3AgaGVyZScgKTtcclxuICAgIH1cclxuICAgIGxldCBtYXhXaWR0aCA9IE1hdGgubWF4LmFwcGx5KCBudWxsLCBzYW1wbGVWYWx1ZXMubWFwKCB2YWx1ZSA9PiB7XHJcbiAgICAgIHZhbHVlTm9kZS5zdHJpbmcgPSBvcHRpb25zLmZvcm1hdFZhbHVlISggdmFsdWUgKTtcclxuICAgICAgcmV0dXJuIHZhbHVlTm9kZS53aWR0aDtcclxuICAgIH0gKSApO1xyXG4gICAgLy8gQ2FwIHRoZSBtYXhXaWR0aCBpZiB2YWx1ZU1heFdpZHRoIGlzIHByb3ZpZGVkLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnktcGhldC9pc3N1ZXMvMjk3XHJcbiAgICBpZiAoIG9wdGlvbnMudmFsdWVNYXhXaWR0aCAhPT0gbnVsbCApIHtcclxuICAgICAgbWF4V2lkdGggPSBNYXRoLm1pbiggbWF4V2lkdGgsIG9wdGlvbnMudmFsdWVNYXhXaWR0aCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGNvbXB1dGUgc2hhcGUgb2YgdGhlIGJhY2tncm91bmQgYmVoaW5kIHRoZSBudW1lcmljIHZhbHVlXHJcbiAgICBjb25zdCBiYWNrZ3JvdW5kV2lkdGggPSBtYXhXaWR0aCArICggMiAqIG9wdGlvbnMueE1hcmdpbiApO1xyXG4gICAgY29uc3QgYmFja2dyb3VuZEhlaWdodCA9IHZhbHVlTm9kZS5oZWlnaHQgKyAoIDIgKiBvcHRpb25zLnlNYXJnaW4gKTtcclxuICAgIGNvbnN0IGJhY2tncm91bmRPdmVybGFwID0gMTtcclxuICAgIGNvbnN0IGJhY2tncm91bmRDb3JuZXJSYWRpdXMgPSBvcHRpb25zLmNvcm5lclJhZGl1cztcclxuXHJcbiAgICAvLyBBcHBseSB0aGUgbWF4LXdpZHRoIEFGVEVSIGNvbXB1dGluZyB0aGUgYmFja2dyb3VuZEhlaWdodCwgc28gaXQgZG9lc24ndCBzaHJpbmsgdmVydGljYWxseVxyXG4gICAgdmFsdWVOb2RlLm1heFdpZHRoID0gbWF4V2lkdGg7XHJcblxyXG4gICAgLy8gVG9wIGhhbGYgb2YgdGhlIGJhY2tncm91bmQuIFByZXNzaW5nIGhlcmUgd2lsbCBpbmNyZW1lbnQgdGhlIHZhbHVlLlxyXG4gICAgLy8gU2hhcGUgY29tcHV0ZWQgc3RhcnRpbmcgYXQgdXBwZXItbGVmdCwgZ29pbmcgY2xvY2t3aXNlLlxyXG4gICAgY29uc3QgaW5jcmVtZW50QmFja2dyb3VuZE5vZGUgPSBuZXcgUGF0aCggbmV3IFNoYXBlKClcclxuICAgICAgICAuYXJjKCBiYWNrZ3JvdW5kQ29ybmVyUmFkaXVzLCBiYWNrZ3JvdW5kQ29ybmVyUmFkaXVzLCBiYWNrZ3JvdW5kQ29ybmVyUmFkaXVzLCBNYXRoLlBJLCBNYXRoLlBJICogMyAvIDIsIGZhbHNlIClcclxuICAgICAgICAuYXJjKCBiYWNrZ3JvdW5kV2lkdGggLSBiYWNrZ3JvdW5kQ29ybmVyUmFkaXVzLCBiYWNrZ3JvdW5kQ29ybmVyUmFkaXVzLCBiYWNrZ3JvdW5kQ29ybmVyUmFkaXVzLCAtTWF0aC5QSSAvIDIsIDAsIGZhbHNlIClcclxuICAgICAgICAubGluZVRvKCBiYWNrZ3JvdW5kV2lkdGgsICggYmFja2dyb3VuZEhlaWdodCAvIDIgKSArIGJhY2tncm91bmRPdmVybGFwIClcclxuICAgICAgICAubGluZVRvKCAwLCAoIGJhY2tncm91bmRIZWlnaHQgLyAyICkgKyBiYWNrZ3JvdW5kT3ZlcmxhcCApXHJcbiAgICAgICAgLmNsb3NlKCksXHJcbiAgICAgIHsgcGlja2FibGU6IGZhbHNlIH0gKTtcclxuXHJcbiAgICAvLyBCb3R0b20gaGFsZiBvZiB0aGUgYmFja2dyb3VuZC4gUHJlc3NpbmcgaGVyZSB3aWxsIGRlY3JlbWVudCB0aGUgdmFsdWUuXHJcbiAgICAvLyBTaGFwZSBjb21wdXRlZCBzdGFydGluZyBhdCBib3R0b20tcmlnaHQsIGdvaW5nIGNsb2Nrd2lzZS5cclxuICAgIGNvbnN0IGRlY3JlbWVudEJhY2tncm91bmROb2RlID0gbmV3IFBhdGgoIG5ldyBTaGFwZSgpXHJcbiAgICAgICAgLmFyYyggYmFja2dyb3VuZFdpZHRoIC0gYmFja2dyb3VuZENvcm5lclJhZGl1cywgYmFja2dyb3VuZEhlaWdodCAtIGJhY2tncm91bmRDb3JuZXJSYWRpdXMsIGJhY2tncm91bmRDb3JuZXJSYWRpdXMsIDAsIE1hdGguUEkgLyAyLCBmYWxzZSApXHJcbiAgICAgICAgLmFyYyggYmFja2dyb3VuZENvcm5lclJhZGl1cywgYmFja2dyb3VuZEhlaWdodCAtIGJhY2tncm91bmRDb3JuZXJSYWRpdXMsIGJhY2tncm91bmRDb3JuZXJSYWRpdXMsIE1hdGguUEkgLyAyLCBNYXRoLlBJLCBmYWxzZSApXHJcbiAgICAgICAgLmxpbmVUbyggMCwgYmFja2dyb3VuZEhlaWdodCAvIDIgKVxyXG4gICAgICAgIC5saW5lVG8oIGJhY2tncm91bmRXaWR0aCwgYmFja2dyb3VuZEhlaWdodCAvIDIgKVxyXG4gICAgICAgIC5jbG9zZSgpLFxyXG4gICAgICB7IHBpY2thYmxlOiBmYWxzZSB9ICk7XHJcblxyXG4gICAgLy8gc2VwYXJhdGUgcmVjdGFuZ2xlIGZvciBzdHJva2UgYXJvdW5kIHZhbHVlIGJhY2tncm91bmRcclxuICAgIGNvbnN0IHN0cm9rZWRCYWNrZ3JvdW5kID0gbmV3IFJlY3RhbmdsZSggMCwgMCwgYmFja2dyb3VuZFdpZHRoLCBiYWNrZ3JvdW5kSGVpZ2h0LCBiYWNrZ3JvdW5kQ29ybmVyUmFkaXVzLCBiYWNrZ3JvdW5kQ29ybmVyUmFkaXVzLCB7XHJcbiAgICAgIHBpY2thYmxlOiBmYWxzZSxcclxuICAgICAgc3Ryb2tlOiBvcHRpb25zLmJhY2tncm91bmRTdHJva2UsXHJcbiAgICAgIGxpbmVXaWR0aDogb3B0aW9ucy5iYWNrZ3JvdW5kTGluZVdpZHRoXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gY29tcHV0ZSBzaXplIG9mIGFycm93c1xyXG4gICAgY29uc3QgYXJyb3dCdXR0b25TaXplID0gbmV3IERpbWVuc2lvbjIoIDAuNSAqIGJhY2tncm91bmRXaWR0aCwgb3B0aW9ucy5hcnJvd0hlaWdodCApO1xyXG5cclxuICAgIGNvbnN0IGFycm93T3B0aW9ucyA9IHtcclxuICAgICAgc3Ryb2tlOiBvcHRpb25zLmFycm93U3Ryb2tlLFxyXG4gICAgICBsaW5lV2lkdGg6IG9wdGlvbnMuYXJyb3dMaW5lV2lkdGgsXHJcbiAgICAgIHBpY2thYmxlOiBmYWxzZVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBpbmNyZW1lbnQgYXJyb3csIHBvaW50aW5nIHVwLCBkZXNjcmliZWQgY2xvY2t3aXNlIGZyb20gdGlwXHJcbiAgICB0aGlzLmluY3JlbWVudEFycm93ID0gbmV3IFBhdGgoIG5ldyBTaGFwZSgpXHJcbiAgICAgICAgLm1vdmVUbyggYXJyb3dCdXR0b25TaXplLndpZHRoIC8gMiwgMCApXHJcbiAgICAgICAgLmxpbmVUbyggYXJyb3dCdXR0b25TaXplLndpZHRoLCBhcnJvd0J1dHRvblNpemUuaGVpZ2h0IClcclxuICAgICAgICAubGluZVRvKCAwLCBhcnJvd0J1dHRvblNpemUuaGVpZ2h0IClcclxuICAgICAgICAuY2xvc2UoKSxcclxuICAgICAgYXJyb3dPcHRpb25zICk7XHJcbiAgICB0aGlzLmluY3JlbWVudEFycm93LmNlbnRlclggPSBpbmNyZW1lbnRCYWNrZ3JvdW5kTm9kZS5jZW50ZXJYO1xyXG4gICAgdGhpcy5pbmNyZW1lbnRBcnJvdy5ib3R0b20gPSBpbmNyZW1lbnRCYWNrZ3JvdW5kTm9kZS50b3AgLSBvcHRpb25zLmFycm93WVNwYWNpbmc7XHJcblxyXG4gICAgLy8gZGVjcmVtZW50IGFycm93LCBwb2ludGluZyBkb3duLCBkZXNjcmliZWQgY2xvY2t3aXNlIGZyb20gdGhlIHRpcFxyXG4gICAgdGhpcy5kZWNyZW1lbnRBcnJvdyA9IG5ldyBQYXRoKCBuZXcgU2hhcGUoKVxyXG4gICAgICAgIC5tb3ZlVG8oIGFycm93QnV0dG9uU2l6ZS53aWR0aCAvIDIsIGFycm93QnV0dG9uU2l6ZS5oZWlnaHQgKVxyXG4gICAgICAgIC5saW5lVG8oIDAsIDAgKVxyXG4gICAgICAgIC5saW5lVG8oIGFycm93QnV0dG9uU2l6ZS53aWR0aCwgMCApXHJcbiAgICAgICAgLmNsb3NlKCksXHJcbiAgICAgIGFycm93T3B0aW9ucyApO1xyXG4gICAgdGhpcy5kZWNyZW1lbnRBcnJvdy5jZW50ZXJYID0gZGVjcmVtZW50QmFja2dyb3VuZE5vZGUuY2VudGVyWDtcclxuICAgIHRoaXMuZGVjcmVtZW50QXJyb3cudG9wID0gZGVjcmVtZW50QmFja2dyb3VuZE5vZGUuYm90dG9tICsgb3B0aW9ucy5hcnJvd1lTcGFjaW5nO1xyXG5cclxuICAgIC8vIHBhcmVudHMgZm9yIGluY3JlbWVudCBhbmQgZGVjcmVtZW50IGNvbXBvbmVudHNcclxuICAgIGNvbnN0IGluY3JlbWVudFBhcmVudCA9IG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIGluY3JlbWVudEJhY2tncm91bmROb2RlLCB0aGlzLmluY3JlbWVudEFycm93IF0gfSApO1xyXG4gICAgaW5jcmVtZW50UGFyZW50LmFkZENoaWxkKCBuZXcgUmVjdGFuZ2xlKCBpbmNyZW1lbnRQYXJlbnQubG9jYWxCb3VuZHMgKSApOyAvLyBpbnZpc2libGUgb3ZlcmxheVxyXG4gICAgY29uc3QgZGVjcmVtZW50UGFyZW50ID0gbmV3IE5vZGUoIHsgY2hpbGRyZW46IFsgZGVjcmVtZW50QmFja2dyb3VuZE5vZGUsIHRoaXMuZGVjcmVtZW50QXJyb3cgXSB9ICk7XHJcbiAgICBkZWNyZW1lbnRQYXJlbnQuYWRkQ2hpbGQoIG5ldyBSZWN0YW5nbGUoIGRlY3JlbWVudFBhcmVudC5sb2NhbEJvdW5kcyApICk7IC8vIGludmlzaWJsZSBvdmVybGF5XHJcblxyXG4gICAgLy8gcmVuZGVyaW5nIG9yZGVyXHJcbiAgICB0aGlzLmFkZENoaWxkKCBpbmNyZW1lbnRQYXJlbnQgKTtcclxuICAgIHRoaXMuYWRkQ2hpbGQoIGRlY3JlbWVudFBhcmVudCApO1xyXG4gICAgdGhpcy5hZGRDaGlsZCggc3Ryb2tlZEJhY2tncm91bmQgKTtcclxuICAgIHRoaXMuYWRkQ2hpbGQoIHZhbHVlTm9kZSApO1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBQb2ludGVyIGFyZWFzXHJcblxyXG4gICAgLy8gdG91Y2ggYXJlYXNcclxuICAgIGluY3JlbWVudFBhcmVudC50b3VjaEFyZWEgPSBTaGFwZS5yZWN0YW5nbGUoXHJcbiAgICAgIGluY3JlbWVudFBhcmVudC5sZWZ0IC0gKCBvcHRpb25zLnRvdWNoQXJlYVhEaWxhdGlvbiAvIDIgKSwgaW5jcmVtZW50UGFyZW50LnRvcCAtIG9wdGlvbnMudG91Y2hBcmVhWURpbGF0aW9uLFxyXG4gICAgICBpbmNyZW1lbnRQYXJlbnQud2lkdGggKyBvcHRpb25zLnRvdWNoQXJlYVhEaWxhdGlvbiwgaW5jcmVtZW50UGFyZW50LmhlaWdodCArIG9wdGlvbnMudG91Y2hBcmVhWURpbGF0aW9uICk7XHJcbiAgICBkZWNyZW1lbnRQYXJlbnQudG91Y2hBcmVhID0gU2hhcGUucmVjdGFuZ2xlKFxyXG4gICAgICBkZWNyZW1lbnRQYXJlbnQubGVmdCAtICggb3B0aW9ucy50b3VjaEFyZWFYRGlsYXRpb24gLyAyICksIGRlY3JlbWVudFBhcmVudC50b3AsXHJcbiAgICAgIGRlY3JlbWVudFBhcmVudC53aWR0aCArIG9wdGlvbnMudG91Y2hBcmVhWERpbGF0aW9uLCBkZWNyZW1lbnRQYXJlbnQuaGVpZ2h0ICsgb3B0aW9ucy50b3VjaEFyZWFZRGlsYXRpb24gKTtcclxuXHJcbiAgICAvLyBtb3VzZSBhcmVhc1xyXG4gICAgaW5jcmVtZW50UGFyZW50Lm1vdXNlQXJlYSA9IFNoYXBlLnJlY3RhbmdsZShcclxuICAgICAgaW5jcmVtZW50UGFyZW50LmxlZnQgLSAoIG9wdGlvbnMubW91c2VBcmVhWERpbGF0aW9uIC8gMiApLCBpbmNyZW1lbnRQYXJlbnQudG9wIC0gb3B0aW9ucy5tb3VzZUFyZWFZRGlsYXRpb24sXHJcbiAgICAgIGluY3JlbWVudFBhcmVudC53aWR0aCArIG9wdGlvbnMubW91c2VBcmVhWERpbGF0aW9uLCBpbmNyZW1lbnRQYXJlbnQuaGVpZ2h0ICsgb3B0aW9ucy5tb3VzZUFyZWFZRGlsYXRpb24gKTtcclxuICAgIGRlY3JlbWVudFBhcmVudC5tb3VzZUFyZWEgPSBTaGFwZS5yZWN0YW5nbGUoXHJcbiAgICAgIGRlY3JlbWVudFBhcmVudC5sZWZ0IC0gKCBvcHRpb25zLm1vdXNlQXJlYVhEaWxhdGlvbiAvIDIgKSwgZGVjcmVtZW50UGFyZW50LnRvcCxcclxuICAgICAgZGVjcmVtZW50UGFyZW50LndpZHRoICsgb3B0aW9ucy5tb3VzZUFyZWFYRGlsYXRpb24sIGRlY3JlbWVudFBhcmVudC5oZWlnaHQgKyBvcHRpb25zLm1vdXNlQXJlYVlEaWxhdGlvbiApO1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBDb2xvcnNcclxuXHJcbiAgICAvLyBhcnJvdyBjb2xvcnMsIGNvcnJlc3BvbmRpbmcgdG8gQnV0dG9uU3RhdGUgYW5kIGluY3JlbWVudEVuYWJsZWRQcm9wZXJ0eS9kZWNyZW1lbnRFbmFibGVkUHJvcGVydHlcclxuICAgIGNvbnN0IGFycm93Q29sb3JzOiBBcnJvd0NvbG9ycyA9IHtcclxuICAgICAgdXA6IG9wdGlvbnMuY29sb3IsXHJcbiAgICAgIG92ZXI6IG9wdGlvbnMuY29sb3IsXHJcbiAgICAgIGRvd246IG9wdGlvbnMucHJlc3NlZENvbG9yLFxyXG4gICAgICBvdXQ6IG9wdGlvbnMuY29sb3IsXHJcbiAgICAgIGRpc2FibGVkOiAncmdiKDE3NiwxNzYsMTc2KSdcclxuICAgIH07XHJcblxyXG4gICAgLy8gYmFja2dyb3VuZCBjb2xvcnMsIGNvcnJlc3BvbmRpbmcgdG8gQnV0dG9uU3RhdGUgYW5kIGVuYWJsZWRQcm9wZXJ0eS52YWx1ZVxyXG4gICAgY29uc3QgaGlnaGxpZ2h0R3JhZGllbnQgPSBjcmVhdGVWZXJ0aWNhbEdyYWRpZW50KCBvcHRpb25zLmNvbG9yLCBvcHRpb25zLmJhY2tncm91bmRDb2xvciwgb3B0aW9ucy5jb2xvciwgYmFja2dyb3VuZEhlaWdodCApO1xyXG4gICAgY29uc3QgcHJlc3NlZEdyYWRpZW50ID0gY3JlYXRlVmVydGljYWxHcmFkaWVudCggb3B0aW9ucy5wcmVzc2VkQ29sb3IsIG9wdGlvbnMuYmFja2dyb3VuZENvbG9yLCBvcHRpb25zLnByZXNzZWRDb2xvciwgYmFja2dyb3VuZEhlaWdodCApO1xyXG4gICAgY29uc3QgYmFja2dyb3VuZENvbG9yczogQmFja2dyb3VuZENvbG9ycyA9IHtcclxuICAgICAgdXA6IG9wdGlvbnMuYmFja2dyb3VuZENvbG9yLFxyXG4gICAgICBvdmVyOiBoaWdobGlnaHRHcmFkaWVudCxcclxuICAgICAgZG93bjogcHJlc3NlZEdyYWRpZW50LFxyXG4gICAgICBvdXQ6IHByZXNzZWRHcmFkaWVudCxcclxuICAgICAgZGlzYWJsZWQ6IG9wdGlvbnMuYmFja2dyb3VuZENvbG9yXHJcbiAgICB9O1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBPYnNlcnZlcnMgYW5kIElucHV0TGlzdGVuZXJzXHJcblxyXG4gICAgY29uc3QgaW5wdXRMaXN0ZW5lck9wdGlvbnMgPSB7XHJcbiAgICAgIGZpcmVPbkhvbGQ6IHRydWUsXHJcbiAgICAgIGZpcmVPbkhvbGREZWxheTogb3B0aW9ucy50aW1lckRlbGF5LFxyXG4gICAgICBmaXJlT25Ib2xkSW50ZXJ2YWw6IG9wdGlvbnMudGltZXJJbnRlcnZhbFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmluY3JlbWVudElucHV0TGlzdGVuZXIgPSBuZXcgTnVtYmVyUGlja2VySW5wdXRMaXN0ZW5lciggaW5jcmVtZW50QnV0dG9uU3RhdGVQcm9wZXJ0eSxcclxuICAgICAgY29tYmluZU9wdGlvbnM8TnVtYmVyUGlja2VySW5wdXRMaXN0ZW5lck9wdGlvbnM+KCB7XHJcbiAgICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdpbmNyZW1lbnRJbnB1dExpc3RlbmVyJyApLFxyXG4gICAgICAgIGZpcmU6ICggZXZlbnQ6IFNjZW5lcnlFdmVudCApID0+IHtcclxuICAgICAgICAgIHZhbHVlUHJvcGVydHkuc2V0KCBNYXRoLm1pbiggb3B0aW9ucy5pbmNyZW1lbnRGdW5jdGlvbiggdmFsdWVQcm9wZXJ0eS5nZXQoKSApLCByYW5nZVByb3BlcnR5LmdldCgpLm1heCApICk7XHJcbiAgICAgICAgICBvcHRpb25zLm9uSW5wdXQoIGV2ZW50ICk7XHJcblxyXG4gICAgICAgICAgLy8gdm9pY2luZyAtIHNwZWFrIHRoZSBvYmplY3QvY29udGV4dCByZXNwb25zZXMgb24gdmFsdWUgY2hhbmdlIGZyb20gdXNlciBpbnB1dFxyXG4gICAgICAgICAgdGhpcy52b2ljaW5nU3BlYWtGdWxsUmVzcG9uc2UoIHsgbmFtZVJlc3BvbnNlOiBudWxsLCBoaW50UmVzcG9uc2U6IG51bGwgfSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSwgaW5wdXRMaXN0ZW5lck9wdGlvbnMgKSApO1xyXG4gICAgaW5jcmVtZW50UGFyZW50LmFkZElucHV0TGlzdGVuZXIoIHRoaXMuaW5jcmVtZW50SW5wdXRMaXN0ZW5lciApO1xyXG5cclxuICAgIHRoaXMuZGVjcmVtZW50SW5wdXRMaXN0ZW5lciA9IG5ldyBOdW1iZXJQaWNrZXJJbnB1dExpc3RlbmVyKCBkZWNyZW1lbnRCdXR0b25TdGF0ZVByb3BlcnR5LFxyXG4gICAgICBjb21iaW5lT3B0aW9uczxOdW1iZXJQaWNrZXJJbnB1dExpc3RlbmVyT3B0aW9ucz4oIHtcclxuICAgICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ2RlY3JlbWVudElucHV0TGlzdGVuZXInICksXHJcbiAgICAgICAgZmlyZTogKCBldmVudDogU2NlbmVyeUV2ZW50ICkgPT4ge1xyXG4gICAgICAgICAgdmFsdWVQcm9wZXJ0eS5zZXQoIE1hdGgubWF4KCBvcHRpb25zLmRlY3JlbWVudEZ1bmN0aW9uKCB2YWx1ZVByb3BlcnR5LmdldCgpICksIHJhbmdlUHJvcGVydHkuZ2V0KCkubWluICkgKTtcclxuICAgICAgICAgIG9wdGlvbnMub25JbnB1dCggZXZlbnQgKTtcclxuXHJcbiAgICAgICAgICAvLyB2b2ljaW5nIC0gc3BlYWsgdGhlIG9iamVjdC9jb250ZXh0IHJlc3BvbnNlcyBvbiB2YWx1ZSBjaGFuZ2UgZnJvbSB1c2VyIGlucHV0XHJcbiAgICAgICAgICB0aGlzLnZvaWNpbmdTcGVha0Z1bGxSZXNwb25zZSggeyBuYW1lUmVzcG9uc2U6IG51bGwsIGhpbnRSZXNwb25zZTogbnVsbCB9ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LCBpbnB1dExpc3RlbmVyT3B0aW9ucyApICk7XHJcbiAgICBkZWNyZW1lbnRQYXJlbnQuYWRkSW5wdXRMaXN0ZW5lciggdGhpcy5kZWNyZW1lbnRJbnB1dExpc3RlbmVyICk7XHJcblxyXG4gICAgLy8gZW5hYmxlL2Rpc2FibGUgbGlzdGVuZXJzIGFuZCBpbnRlcmFjdGlvbjogdW5saW5rIHVubmVjZXNzYXJ5LCBQcm9wZXJ0aWVzIGFyZSBvd25lZCBieSB0aGlzIGluc3RhbmNlXHJcbiAgICBpbmNyZW1lbnRFbmFibGVkUHJvcGVydHkubGluayggZW5hYmxlZCA9PiB7XHJcbiAgICAgICFlbmFibGVkICYmIHRoaXMuaW5jcmVtZW50SW5wdXRMaXN0ZW5lci5pbnRlcnJ1cHQoKTtcclxuICAgICAgaW5jcmVtZW50UGFyZW50LnBpY2thYmxlID0gZW5hYmxlZDtcclxuICAgIH0gKTtcclxuICAgIGRlY3JlbWVudEVuYWJsZWRQcm9wZXJ0eS5saW5rKCBlbmFibGVkID0+IHtcclxuICAgICAgIWVuYWJsZWQgJiYgdGhpcy5kZWNyZW1lbnRJbnB1dExpc3RlbmVyLmludGVycnVwdCgpO1xyXG4gICAgICBkZWNyZW1lbnRQYXJlbnQucGlja2FibGUgPSBlbmFibGVkO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0ZXh0IHRvIG1hdGNoIHRoZSB2YWx1ZVxyXG4gICAgY29uc3QgdmFsdWVPYnNlcnZlciA9ICggdmFsdWU6IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQgKSA9PiB7XHJcbiAgICAgIGlmICggdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICB2YWx1ZU5vZGUuc3RyaW5nID0gb3B0aW9ucy5ub1ZhbHVlU3RyaW5nO1xyXG4gICAgICAgIHZhbHVlTm9kZS54ID0gKCBiYWNrZ3JvdW5kV2lkdGggLSB2YWx1ZU5vZGUud2lkdGggKSAvIDI7IC8vIGhvcml6b250YWxseSBjZW50ZXJlZFxyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHZhbHVlTm9kZS5zdHJpbmcgPSBvcHRpb25zLmZvcm1hdFZhbHVlISggdmFsdWUgKTtcclxuICAgICAgICBpZiAoIG9wdGlvbnMuYWxpZ24gPT09ICdjZW50ZXInICkge1xyXG4gICAgICAgICAgdmFsdWVOb2RlLmNlbnRlclggPSBpbmNyZW1lbnRCYWNrZ3JvdW5kTm9kZS5jZW50ZXJYO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggb3B0aW9ucy5hbGlnbiA9PT0gJ3JpZ2h0JyApIHtcclxuICAgICAgICAgIHZhbHVlTm9kZS5yaWdodCA9IGluY3JlbWVudEJhY2tncm91bmROb2RlLnJpZ2h0IC0gb3B0aW9ucy54TWFyZ2luO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggb3B0aW9ucy5hbGlnbiA9PT0gJ2xlZnQnICkge1xyXG4gICAgICAgICAgdmFsdWVOb2RlLmxlZnQgPSBpbmNyZW1lbnRCYWNrZ3JvdW5kTm9kZS5sZWZ0ICsgb3B0aW9ucy54TWFyZ2luO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciggYHVuc3VwcG9ydGVkIHZhbHVlIGZvciBvcHRpb25zLmFsaWduOiAke29wdGlvbnMuYWxpZ259YCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICB2YWx1ZU5vZGUuY2VudGVyWSA9IGJhY2tncm91bmRIZWlnaHQgLyAyO1xyXG4gICAgfTtcclxuICAgIHZhbHVlUHJvcGVydHkubGluayggdmFsdWVPYnNlcnZlciApOyAvLyBtdXN0IGJlIHVubGlua2VkIGluIGRpc3Bvc2VcclxuXHJcbiAgICAvLyBVcGRhdGUgY29sb3JzIGZvciBpbmNyZW1lbnQgY29tcG9uZW50cy4gIE5vIGRpc3Bvc2UgaXMgbmVlZGVkIHNpbmNlIGRlcGVuZGVuY2llcyBhcmUgbG9jYWxseSBvd25lZC5cclxuICAgIE11bHRpbGluay5tdWx0aWxpbmsoIFsgaW5jcmVtZW50QnV0dG9uU3RhdGVQcm9wZXJ0eSwgaW5jcmVtZW50RW5hYmxlZFByb3BlcnR5IF0sICggc3RhdGUsIGVuYWJsZWQgKSA9PiB7XHJcbiAgICAgIHVwZGF0ZUNvbG9ycyggc3RhdGUsIGVuYWJsZWQsIGluY3JlbWVudEJhY2tncm91bmROb2RlLCB0aGlzLmluY3JlbWVudEFycm93LCBiYWNrZ3JvdW5kQ29sb3JzLCBhcnJvd0NvbG9ycyApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIFVwZGF0ZSBjb2xvcnMgZm9yIGRlY3JlbWVudCBjb21wb25lbnRzLiAgTm8gZGlzcG9zZSBpcyBuZWVkZWQgc2luY2UgZGVwZW5kZW5jaWVzIGFyZSBsb2NhbGx5IG93bmVkLlxyXG4gICAgTXVsdGlsaW5rLm11bHRpbGluayggWyBkZWNyZW1lbnRCdXR0b25TdGF0ZVByb3BlcnR5LCBkZWNyZW1lbnRFbmFibGVkUHJvcGVydHkgXSwgKCBzdGF0ZSwgZW5hYmxlZCApID0+IHtcclxuICAgICAgdXBkYXRlQ29sb3JzKCBzdGF0ZSwgZW5hYmxlZCwgZGVjcmVtZW50QmFja2dyb3VuZE5vZGUsIHRoaXMuZGVjcmVtZW50QXJyb3csIGJhY2tncm91bmRDb2xvcnMsIGFycm93Q29sb3JzICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gcGRvbSAtIGN1c3RvbSBmb2N1cyBoaWdobGlnaHQgdGhhdCBtYXRjaGVzIHJvdW5kZWQgYmFja2dyb3VuZCBiZWhpbmQgdGhlIG51bWVyaWMgdmFsdWVcclxuICAgIGNvbnN0IGZvY3VzQm91bmRzID0gdGhpcy5sb2NhbEJvdW5kcy5kaWxhdGVkKCBIaWdobGlnaHRQYXRoLmdldERlZmF1bHREaWxhdGlvbkNvZWZmaWNpZW50KCkgKTtcclxuICAgIHRoaXMuZm9jdXNIaWdobGlnaHQgPSBuZXcgSGlnaGxpZ2h0UGF0aCggU2hhcGUucm91bmRlZFJlY3RhbmdsZVdpdGhSYWRpaShcclxuICAgICAgZm9jdXNCb3VuZHMubWluWCxcclxuICAgICAgZm9jdXNCb3VuZHMubWluWSxcclxuICAgICAgZm9jdXNCb3VuZHMud2lkdGgsXHJcbiAgICAgIGZvY3VzQm91bmRzLmhlaWdodCwge1xyXG4gICAgICAgIHRvcExlZnQ6IG9wdGlvbnMuY29ybmVyUmFkaXVzLFxyXG4gICAgICAgIHRvcFJpZ2h0OiBvcHRpb25zLmNvcm5lclJhZGl1cyxcclxuICAgICAgICBib3R0b21MZWZ0OiBvcHRpb25zLmNvcm5lclJhZGl1cyxcclxuICAgICAgICBib3R0b21SaWdodDogb3B0aW9ucy5jb3JuZXJSYWRpdXNcclxuICAgICAgfSApXHJcbiAgICApO1xyXG5cclxuICAgIC8vIHVwZGF0ZSBzdHlsZSB3aXRoIGtleWJvYXJkIGlucHV0LCBFbWl0dGVycyBvd25lZCBieSB0aGlzIGluc3RhbmNlIGFuZCBkaXNwb3NlZCBpbiBBY2Nlc3NpYmxlTnVtYmVyU3Bpbm5lclxyXG4gICAgdGhpcy5wZG9tSW5jcmVtZW50RG93bkVtaXR0ZXIuYWRkTGlzdGVuZXIoIGlzRG93biA9PiB7XHJcbiAgICAgIGluY3JlbWVudEJ1dHRvblN0YXRlUHJvcGVydHkudmFsdWUgPSAoIGlzRG93biA/ICdkb3duJyA6ICd1cCcgKTtcclxuICAgIH0gKTtcclxuICAgIHRoaXMucGRvbURlY3JlbWVudERvd25FbWl0dGVyLmFkZExpc3RlbmVyKCBpc0Rvd24gPT4ge1xyXG4gICAgICBkZWNyZW1lbnRCdXR0b25TdGF0ZVByb3BlcnR5LnZhbHVlID0gKCBpc0Rvd24gPyAnZG93bicgOiAndXAnICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5hZGRMaW5rZWRFbGVtZW50KCB2YWx1ZVByb3BlcnR5LCB7XHJcbiAgICAgIHRhbmRlbU5hbWU6ICd2YWx1ZVByb3BlcnR5J1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIE11dGF0ZSBvcHRpb25zIHRoYXQgcmVxdWlyZSBib3VuZHMgYWZ0ZXIgd2UgaGF2ZSBjaGlsZHJlblxyXG4gICAgdGhpcy5tdXRhdGUoIGJvdW5kc1JlcXVpcmVkT3B0aW9uS2V5cyApO1xyXG5cclxuICAgIHRoaXMuZGlzcG9zZU51bWJlclBpY2tlciA9ICgpID0+IHtcclxuXHJcbiAgICAgIGNvbG9yUHJvcGVydHkgJiYgY29sb3JQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICAgIGluY3JlbWVudEVuYWJsZWRQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICAgIGRlY3JlbWVudEVuYWJsZWRQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICAgIHRoaXMuaW5jcmVtZW50QXJyb3cuZGlzcG9zZSgpO1xyXG4gICAgICB0aGlzLmRlY3JlbWVudEFycm93LmRpc3Bvc2UoKTtcclxuXHJcbiAgICAgIGlmICggdmFsdWVQcm9wZXJ0eS5oYXNMaXN0ZW5lciggdmFsdWVPYnNlcnZlciApICkge1xyXG4gICAgICAgIHZhbHVlUHJvcGVydHkudW5saW5rKCB2YWx1ZU9ic2VydmVyICk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLy8gc3VwcG9ydCBmb3IgYmluZGVyIGRvY3VtZW50YXRpb24sIHN0cmlwcGVkIG91dCBpbiBidWlsZHMgYW5kIG9ubHkgcnVucyB3aGVuID9iaW5kZXIgaXMgc3BlY2lmaWVkXHJcbiAgICBhc3NlcnQgJiYgcGhldD8uY2hpcHBlcj8ucXVlcnlQYXJhbWV0ZXJzPy5iaW5kZXIgJiYgSW5zdGFuY2VSZWdpc3RyeS5yZWdpc3RlckRhdGFVUkwoICdzY2VuZXJ5LXBoZXQnLCAnTnVtYmVyUGlja2VyJywgdGhpcyApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyBjcmVhdGVJY29uKCB2YWx1ZTogbnVtYmVyLCBwcm92aWRlZE9wdGlvbnM/OiBDcmVhdGVJY29uT3B0aW9ucyApOiBOb2RlIHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPENyZWF0ZUljb25PcHRpb25zLCBFbXB0eVNlbGZPcHRpb25zLCBDcmVhdGVJY29uT3B0aW9ucz4oKSgge1xyXG5cclxuICAgICAgLy8gSGlnaGxpZ2h0IHRoZSBpbmNyZW1lbnQgYnV0dG9uXHJcbiAgICAgIGhpZ2hsaWdodEluY3JlbWVudDogZmFsc2UsXHJcblxyXG4gICAgICAvLyBIaWdobGlnaHQgdGhlIGRlY3JlbWVudCBidXR0b25cclxuICAgICAgaGlnaGxpZ2h0RGVjcmVtZW50OiBmYWxzZSxcclxuXHJcbiAgICAgIHJhbmdlOiBuZXcgUmFuZ2UoIHZhbHVlIC0gMSwgdmFsdWUgKyAxICksXHJcbiAgICAgIG51bWJlclBpY2tlck9wdGlvbnM6IHtcclxuICAgICAgICBwaWNrYWJsZTogZmFsc2UsXHJcblxyXG4gICAgICAgIC8vIHBoZXQtaW9cclxuICAgICAgICB0YW5kZW06IFRhbmRlbS5PUFRfT1VUIC8vIGJ5IGRlZmF1bHQsIGljb25zIGRvbid0IG5lZWQgaW5zdHJ1bWVudGF0aW9uXHJcbiAgICAgIH1cclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIGNvbnN0IG51bWJlclBpY2tlciA9IG5ldyBOdW1iZXJQaWNrZXIoIG5ldyBOdW1iZXJQcm9wZXJ0eSggdmFsdWUgKSwgbmV3IFByb3BlcnR5KCBvcHRpb25zLnJhbmdlICksIG9wdGlvbnMubnVtYmVyUGlja2VyT3B0aW9ucyApO1xyXG5cclxuICAgIC8vIHdlIGRvbid0IHdhbnQgdGhpcyBpY29uIHRvIGhhdmUga2V5Ym9hcmQgbmF2aWdhdGlvbiwgb3IgZGVzY3JpcHRpb24gaW4gdGhlIFBET00uXHJcbiAgICBudW1iZXJQaWNrZXIucmVtb3ZlRnJvbVBET00oKTtcclxuXHJcbiAgICBpZiAoIG9wdGlvbnMuaGlnaGxpZ2h0RGVjcmVtZW50ICkge1xyXG4gICAgICBudW1iZXJQaWNrZXIuZGVjcmVtZW50SW5wdXRMaXN0ZW5lci5pc092ZXJQcm9wZXJ0eS52YWx1ZSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBpZiAoIG9wdGlvbnMuaGlnaGxpZ2h0SW5jcmVtZW50ICkge1xyXG4gICAgICBudW1iZXJQaWNrZXIuaW5jcmVtZW50SW5wdXRMaXN0ZW5lci5pc092ZXJQcm9wZXJ0eS52YWx1ZSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbnVtYmVyUGlja2VyO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmRpc3Bvc2VOdW1iZXJQaWNrZXIoKTtcclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdmlzaWJpbGl0eSBvZiB0aGUgYXJyb3dzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRBcnJvd3NWaXNpYmxlKCB2aXNpYmxlOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgaWYgKCAhdmlzaWJsZSApIHtcclxuICAgICAgdGhpcy5pbmNyZW1lbnRJbnB1dExpc3RlbmVyLmludGVycnVwdCgpO1xyXG4gICAgICB0aGlzLmRlY3JlbWVudElucHV0TGlzdGVuZXIuaW50ZXJydXB0KCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmluY3JlbWVudEFycm93LnZpc2libGUgPSB2aXNpYmxlO1xyXG4gICAgdGhpcy5kZWNyZW1lbnRBcnJvdy52aXNpYmxlID0gdmlzaWJsZTtcclxuICB9XHJcbn1cclxuXHJcbnR5cGUgTnVtYmVyUGlja2VySW5wdXRMaXN0ZW5lclNlbGZPcHRpb25zID0gRW1wdHlTZWxmT3B0aW9ucztcclxudHlwZSBOdW1iZXJQaWNrZXJJbnB1dExpc3RlbmVyT3B0aW9ucyA9IE51bWJlclBpY2tlcklucHV0TGlzdGVuZXJTZWxmT3B0aW9ucyAmIEZpcmVMaXN0ZW5lck9wdGlvbnM8RmlyZUxpc3RlbmVyPjtcclxuXHJcbi8qKlxyXG4gKiBDb252ZXJ0cyBGaXJlTGlzdGVuZXIgZXZlbnRzIHRvIHN0YXRlIGNoYW5nZXMuXHJcbiAqL1xyXG5jbGFzcyBOdW1iZXJQaWNrZXJJbnB1dExpc3RlbmVyIGV4dGVuZHMgRmlyZUxpc3RlbmVyIHtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBidXR0b25TdGF0ZVByb3BlcnR5OiBTdHJpbmdVbmlvblByb3BlcnR5PEJ1dHRvblN0YXRlPiwgb3B0aW9uczogTnVtYmVyUGlja2VySW5wdXRMaXN0ZW5lck9wdGlvbnMgKSB7XHJcbiAgICBzdXBlciggb3B0aW9ucyApO1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0aGUgYnV0dG9uIHN0YXRlLiAgTm8gZGlzcG9zZSBpcyBuZWVkZWQgYmVjYXVzZSB0aGUgcGFyZW50IGNsYXNzIGRpc3Bvc2VzIHRoZSBkZXBlbmRlbmNpZXMuXHJcbiAgICBNdWx0aWxpbmsubXVsdGlsaW5rKFxyXG4gICAgICBbIHRoaXMuaXNPdmVyUHJvcGVydHksIHRoaXMuaXNQcmVzc2VkUHJvcGVydHkgXSxcclxuICAgICAgKCBpc092ZXIsIGlzUHJlc3NlZCApID0+IHtcclxuICAgICAgICBidXR0b25TdGF0ZVByb3BlcnR5LnNldChcclxuICAgICAgICAgIGlzT3ZlciAmJiAhaXNQcmVzc2VkID8gJ292ZXInIDpcclxuICAgICAgICAgIGlzT3ZlciAmJiBpc1ByZXNzZWQgPyAnZG93bicgOlxyXG4gICAgICAgICAgIWlzT3ZlciAmJiAhaXNQcmVzc2VkID8gJ3VwJyA6XHJcbiAgICAgICAgICAnb3V0J1xyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgICk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIHZlcnRpY2FsIGdyYWRpZW50LlxyXG4gKi9cclxuZnVuY3Rpb24gY3JlYXRlVmVydGljYWxHcmFkaWVudCggdG9wQ29sb3I6IFRDb2xvciwgY2VudGVyQ29sb3I6IFRDb2xvciwgYm90dG9tQ29sb3I6IFRDb2xvciwgaGVpZ2h0OiBudW1iZXIgKTogTGluZWFyR3JhZGllbnQge1xyXG4gIHJldHVybiBuZXcgTGluZWFyR3JhZGllbnQoIDAsIDAsIDAsIGhlaWdodCApXHJcbiAgICAuYWRkQ29sb3JTdG9wKCAwLCB0b3BDb2xvciApXHJcbiAgICAuYWRkQ29sb3JTdG9wKCAwLjUsIGNlbnRlckNvbG9yIClcclxuICAgIC5hZGRDb2xvclN0b3AoIDEsIGJvdHRvbUNvbG9yICk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBVcGRhdGVzIGFycm93IGFuZCBiYWNrZ3JvdW5kIGNvbG9yc1xyXG4gKi9cclxuZnVuY3Rpb24gdXBkYXRlQ29sb3JzKCBidXR0b25TdGF0ZTogQnV0dG9uU3RhdGUsIGVuYWJsZWQ6IGJvb2xlYW4sIGJhY2tncm91bmROb2RlOiBQYXRoLCBhcnJvd05vZGU6IFBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yczogQmFja2dyb3VuZENvbG9ycywgYXJyb3dDb2xvcnM6IEFycm93Q29sb3JzICk6IHZvaWQge1xyXG4gIGlmICggZW5hYmxlZCApIHtcclxuICAgIGFycm93Tm9kZS5zdHJva2UgPSAnYmxhY2snO1xyXG4gICAgaWYgKCBidXR0b25TdGF0ZSA9PT0gJ3VwJyApIHtcclxuICAgICAgYmFja2dyb3VuZE5vZGUuZmlsbCA9IGJhY2tncm91bmRDb2xvcnMudXA7XHJcbiAgICAgIGFycm93Tm9kZS5maWxsID0gYXJyb3dDb2xvcnMudXA7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggYnV0dG9uU3RhdGUgPT09ICdvdmVyJyApIHtcclxuICAgICAgYmFja2dyb3VuZE5vZGUuZmlsbCA9IGJhY2tncm91bmRDb2xvcnMub3ZlcjtcclxuICAgICAgYXJyb3dOb2RlLmZpbGwgPSBhcnJvd0NvbG9ycy5vdmVyO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGJ1dHRvblN0YXRlID09PSAnZG93bicgKSB7XHJcbiAgICAgIGJhY2tncm91bmROb2RlLmZpbGwgPSBiYWNrZ3JvdW5kQ29sb3JzLmRvd247XHJcbiAgICAgIGFycm93Tm9kZS5maWxsID0gYXJyb3dDb2xvcnMuZG93bjtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBidXR0b25TdGF0ZSA9PT0gJ291dCcgKSB7XHJcbiAgICAgIGJhY2tncm91bmROb2RlLmZpbGwgPSBiYWNrZ3JvdW5kQ29sb3JzLm91dDtcclxuICAgICAgYXJyb3dOb2RlLmZpbGwgPSBhcnJvd0NvbG9ycy5vdXQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCBgdW5zdXBwb3J0ZWQgYnV0dG9uU3RhdGU6ICR7YnV0dG9uU3RhdGV9YCApO1xyXG4gICAgfVxyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGJhY2tncm91bmROb2RlLmZpbGwgPSBiYWNrZ3JvdW5kQ29sb3JzLmRpc2FibGVkO1xyXG4gICAgYXJyb3dOb2RlLmZpbGwgPSBhcnJvd0NvbG9ycy5kaXNhYmxlZDtcclxuICAgIGFycm93Tm9kZS5zdHJva2UgPSBhcnJvd0NvbG9ycy5kaXNhYmxlZDsgLy8gc3Ryb2tlIHNvIHRoYXQgYXJyb3cgc2l6ZSB3aWxsIGxvb2sgdGhlIHNhbWUgd2hlbiBpdCdzIGVuYWJsZWQvZGlzYWJsZWRcclxuICB9XHJcbn1cclxuXHJcbnN1bi5yZWdpc3RlciggJ051bWJlclBpY2tlcicsIE51bWJlclBpY2tlciApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLG1CQUFtQixNQUFNLHNDQUFzQztBQUN0RSxPQUFPQyxlQUFlLE1BQU0sa0NBQWtD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