// Copyright 2015-2024, University of Colorado Boulder

/**
 * NumberControl is a control for changing a Property<number>, with flexible layout. It consists of a labeled value,
 * slider, and arrow buttons.
 *
 * NumberControl provides accessible content exclusively through the Slider. Please pass accessibility related
 * customizations to the Slider through options.sliderOptions.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import DerivedProperty from '../../axon/js/DerivedProperty.js';
import Dimension2 from '../../dot/js/Dimension2.js';
import Range from '../../dot/js/Range.js';
import Utils from '../../dot/js/Utils.js';
import InstanceRegistry from '../../phet-core/js/documentation/InstanceRegistry.js';
import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
import { AlignBox, extendsWidthSizable, HBox, isWidthSizable, Node, PaintColorProperty, Text, VBox, WidthSizable } from '../../scenery/js/imports.js';
import ArrowButton from '../../sun/js/buttons/ArrowButton.js';
import Slider from '../../sun/js/Slider.js';
import nullSoundPlayer from '../../tambo/js/shared-sound-players/nullSoundPlayer.js';
import ValueChangeSoundPlayer from '../../tambo/js/sound-generators/ValueChangeSoundPlayer.js';
import Tandem from '../../tandem/js/Tandem.js';
import IOType from '../../tandem/js/types/IOType.js';
import NumberDisplay from './NumberDisplay.js';
import PhetFont from './PhetFont.js';
import sceneryPhet from './sceneryPhet.js';
import Orientation from '../../phet-core/js/Orientation.js';

// constants
const SPECIFIC_COMPONENT_CALLBACK_OPTIONS = ['startDrag', 'endDrag', 'leftStart', 'leftEnd', 'rightStart', 'rightEnd'];

// This is a marker to indicate that we should create the actual default sound player.
const DEFAULT_SOUND = new ValueChangeSoundPlayer(new Range(0, 1));
const DEFAULT_HSLIDER_TRACK_SIZE = new Dimension2(180, 3);
const DEFAULT_HSLIDER_THUMB_SIZE = new Dimension2(17, 34);

// description of a major tick

// other slider options that are specific to NumberControl

export default class NumberControl extends WidthSizable(Node) {
  // for a11y API

  constructor(title, numberProperty, numberRange, providedOptions) {
    // Make sure that general callbacks (for all components) and specific callbacks (for a specific component) aren't
    // used in tandem. This must be called before defaults are set.
    validateCallbacks(providedOptions || {});

    // Omit enabledRangeProperty from top-level, so that we don't need to provide a default.
    // Then add enabledRangeProperty to sliderOptions, so that if we are given providedOptions.enabledRangeProperty,
    // we can pass it to super via options.sliderOptions.enabledRangeProperty.

    // Extend NumberControl options before merging nested options because some nested defaults use these options.
    const initialOptions = optionize()({
      numberDisplayOptions: {},
      sliderOptions: {},
      arrowButtonOptions: {},
      titleNodeOptions: {},
      // General Callbacks
      startCallback: _.noop,
      // called when interaction begins, default value set in validateCallbacks()
      endCallback: _.noop,
      // called when interaction ends, default value set in validateCallbacks()

      delta: 1,
      disabledOpacity: 0.5,
      // {number} opacity used to make the control look disabled

      // A {function} that handles layout of subcomponents.
      // It has signature function( titleNode, numberDisplay, slider, decrementButton, incrementButton )
      // and returns a Node. If you want to customize the layout, use one of the predefined creators
      // (see createLayoutFunction*) or create your own function. Arrow buttons will be null if `includeArrowButtons:false`
      layoutFunction: NumberControl.createLayoutFunction1(),
      // {boolean} If set to true, then increment/decrement arrow buttons will be added to the NumberControl
      includeArrowButtons: true,
      soundGenerator: DEFAULT_SOUND,
      valueChangeSoundGeneratorOptions: {},
      // phet-io
      tandem: Tandem.REQUIRED,
      tandemNameSuffix: 'Control',
      phetioType: NumberControl.NumberControlIO,
      phetioEnabledPropertyInstrumented: true,
      // opt into default PhET-iO instrumented enabledProperty
      visiblePropertyOptions: {
        phetioFeatured: true
      }
    }, providedOptions);

    // A groupFocusHighlight is only included if using arrowButtons. When there are arrowButtons it is important
    // to indicate that the whole control is only one stop in the traversal order. This is set by NumberControl.
    assert && assert(initialOptions.groupFocusHighlight === undefined, 'NumberControl sets groupFocusHighlight');
    super();

    // If the arrow button scale is not provided, the arrow button height will match the number display height
    const arrowButtonScaleProvided = initialOptions.arrowButtonOptions && initialOptions.arrowButtonOptions.hasOwnProperty('scale');
    const getCurrentRange = () => {
      return options.enabledRangeProperty ? options.enabledRangeProperty.value : numberRange;
    };

    // Create a function that will be used to constrain the slider value to the provided range and the same delta as
    // the arrow buttons, see https://github.com/phetsims/scenery-phet/issues/384.
    const constrainValue = value => {
      assert && assert(options.delta !== undefined);
      const newValue = Utils.roundToInterval(value, options.delta);
      return getCurrentRange().constrainValue(newValue);
    };
    assert && assert(initialOptions.soundGenerator === DEFAULT_SOUND || _.isEmpty(initialOptions.valueChangeSoundGeneratorOptions), 'options should only be supplied when using default sound generator');

    // If no sound generator was provided, create one using the default configuration.
    if (initialOptions.soundGenerator === DEFAULT_SOUND) {
      let valueChangeSoundGeneratorOptions = initialOptions.valueChangeSoundGeneratorOptions;
      if (_.isEmpty(initialOptions.valueChangeSoundGeneratorOptions)) {
        // If no options were provided for the ValueChangeSoundGenerator, use a default where a sound will be produced
        // for every valid value set by this control.
        valueChangeSoundGeneratorOptions = {
          interThresholdDelta: initialOptions.delta,
          constrainValue: constrainValue
        };
      }
      initialOptions.soundGenerator = new ValueChangeSoundPlayer(numberRange, valueChangeSoundGeneratorOptions);
    } else if (initialOptions.soundGenerator === null) {
      initialOptions.soundGenerator = ValueChangeSoundPlayer.NO_SOUND;
    }

    // Merge all nested options in one block.
    const options = combineOptions({
      // Options propagated to ArrowButton
      arrowButtonOptions: {
        // Values chosen to match previous behavior, see https://github.com/phetsims/scenery-phet/issues/489.
        // touchAreaXDilation is 1/2 of its original value because touchArea is shifted.
        touchAreaXDilation: 3.5,
        touchAreaYDilation: 7,
        mouseAreaXDilation: 0,
        mouseAreaYDilation: 0,
        // If the value is within this amount of the respective min/max, it will be treated as if it was at that value
        // (for determining whether the arrow button is enabled).
        enabledEpsilon: 0,
        // callbacks
        leftStart: initialOptions.startCallback,
        // called when left arrow is pressed
        leftEnd: initialOptions.endCallback,
        // called when left arrow is released
        rightStart: initialOptions.startCallback,
        // called when right arrow is pressed
        rightEnd: initialOptions.endCallback,
        // called when right arrow is released

        // phet-io
        enabledPropertyOptions: {
          phetioReadOnly: true,
          phetioFeatured: false
        }
      },
      // Options propagated to Slider
      sliderOptions: {
        orientation: Orientation.HORIZONTAL,
        startDrag: initialOptions.startCallback,
        // called when dragging starts on the slider
        endDrag: initialOptions.endCallback,
        // called when dragging ends on the slider

        // With the exception of startDrag and endDrag (use startCallback and endCallback respectively),
        // all HSlider options may be used. These are the ones that NumberControl overrides:
        majorTickLength: 20,
        minorTickStroke: 'rgba( 0, 0, 0, 0.3 )',
        // other slider options that are specific to NumberControl
        majorTicks: [],
        minorTickSpacing: 0,
        // zero indicates no minor ticks

        // constrain the slider value to the provided range and the same delta as the arrow buttons,
        // see https://github.com/phetsims/scenery-phet/issues/384
        constrainValue: constrainValue,
        soundGenerator: initialOptions.soundGenerator,
        // phet-io
        tandem: initialOptions.tandem.createTandem(NumberControl.SLIDER_TANDEM_NAME)
      },
      // Options propagated to NumberDisplay
      numberDisplayOptions: {
        textOptions: {
          font: new PhetFont(12),
          stringPropertyOptions: {
            phetioFeatured: true
          }
        },
        // phet-io
        tandem: initialOptions.tandem.createTandem('numberDisplay'),
        visiblePropertyOptions: {
          phetioFeatured: true
        }
      },
      // Options propagated to the title Text Node
      titleNodeOptions: {
        font: new PhetFont(12),
        maxWidth: null,
        // {null|number} maxWidth to use for title, to constrain width for i18n
        fill: 'black',
        tandem: initialOptions.tandem.createTandem('titleText')
      }
    }, initialOptions);

    // validate options
    assert && assert(!options.startDrag, 'use options.startCallback instead of options.startDrag');
    assert && assert(!options.endDrag, 'use options.endCallback instead of options.endDrag');
    assert && assert(!options.tagName, 'Provide accessibility through options.sliderOptions which will be applied to the NumberControl Node.');
    if (options.enabledRangeProperty) {
      options.sliderOptions.enabledRangeProperty = options.enabledRangeProperty;
    }

    // pdom - for alternative input, the number control is accessed entirely through slider interaction and these
    // arrow buttons are not tab navigable
    assert && assert(options.arrowButtonOptions.tagName === undefined, 'NumberControl\'s accessible content is just the slider, do not set accessible content on the buttons. Instead ' + 'set a11y through options.sliderOptions.');
    options.arrowButtonOptions.tagName = null;

    // pdom - if we include arrow buttons, use a groupFocusHighlight to surround the NumberControl to make it clear
    // that it is a composite component and there is only one stop in the traversal order.
    this.groupFocusHighlight = options.includeArrowButtons;

    // Slider options for track (if not specified as trackNode)
    if (!options.sliderOptions.trackNode) {
      options.sliderOptions = combineOptions({
        trackSize: options.sliderOptions.orientation === Orientation.HORIZONTAL ? DEFAULT_HSLIDER_TRACK_SIZE : DEFAULT_HSLIDER_TRACK_SIZE.swapped()
      }, options.sliderOptions);
    }

    // Slider options for thumb (if n ot specified as thumbNode)
    if (!options.sliderOptions.thumbNode) {
      options.sliderOptions = combineOptions({
        thumbSize: options.sliderOptions.orientation === Orientation.HORIZONTAL ? DEFAULT_HSLIDER_THUMB_SIZE : DEFAULT_HSLIDER_THUMB_SIZE.swapped(),
        thumbTouchAreaXDilation: 6
      }, options.sliderOptions);
    }
    assert && assert(!options.sliderOptions.hasOwnProperty('phetioType'), 'NumberControl sets phetioType');

    // slider options set by NumberControl, note this may not be the long term pattern, see https://github.com/phetsims/phet-info/issues/96
    options.sliderOptions = combineOptions({
      // pdom - by default, shiftKeyboardStep should most likely be the same as clicking the arrow buttons.
      shiftKeyboardStep: options.delta,
      // Make sure Slider gets created with the right IOType
      phetioType: Slider.SliderIO
    }, options.sliderOptions);

    // highlight color for thumb defaults to a brighter version of the thumb color
    if (options.sliderOptions.thumbFill && !options.sliderOptions.thumbFillHighlighted) {
      this.thumbFillProperty = new PaintColorProperty(options.sliderOptions.thumbFill);

      // Reference to the DerivedProperty not needed, since we dispose what it listens to above.
      options.sliderOptions.thumbFillHighlighted = new DerivedProperty([this.thumbFillProperty], color => color.brighterColor());
    }
    const titleNode = new Text(title, options.titleNodeOptions);
    const numberDisplay = new NumberDisplay(numberProperty, numberRange, options.numberDisplayOptions);
    this.slider = new Slider(numberProperty, numberRange, options.sliderOptions);

    // set below, see options.includeArrowButtons
    let decrementButton = null;
    let incrementButton = null;
    let arrowEnabledListener = null;
    if (options.includeArrowButtons) {
      const touchAreaXDilation = options.arrowButtonOptions.touchAreaXDilation;
      const mouseAreaXDilation = options.arrowButtonOptions.mouseAreaXDilation;
      assert && assert(touchAreaXDilation !== undefined && mouseAreaXDilation !== undefined, 'Should be defined, since we have defaults above');
      decrementButton = new ArrowButton('left', () => {
        const oldValue = numberProperty.get();
        let newValue = numberProperty.get() - options.delta;
        newValue = Utils.roundToInterval(newValue, options.delta); // constrain to multiples of delta, see #384
        newValue = Math.max(newValue, getCurrentRange().min); // constrain to range
        numberProperty.set(newValue);
        options.soundGenerator.playSoundForValueChange(newValue, oldValue);
        this.slider.voicingOnEndResponse(oldValue);
      }, combineOptions({
        soundPlayer: nullSoundPlayer,
        startCallback: options.arrowButtonOptions.leftStart,
        endCallback: options.arrowButtonOptions.leftEnd,
        tandem: options.tandem.createTandem('decrementButton'),
        touchAreaXShift: -touchAreaXDilation,
        mouseAreaXShift: -mouseAreaXDilation
      }, options.arrowButtonOptions));
      incrementButton = new ArrowButton('right', () => {
        const oldValue = numberProperty.get();
        let newValue = numberProperty.get() + options.delta;
        newValue = Utils.roundToInterval(newValue, options.delta); // constrain to multiples of delta, see #384
        newValue = Math.min(newValue, getCurrentRange().max); // constrain to range
        numberProperty.set(newValue);
        options.soundGenerator.playSoundForValueChange(newValue, oldValue);
        this.slider.voicingOnEndResponse(oldValue);
      }, combineOptions({
        soundPlayer: nullSoundPlayer,
        startCallback: options.arrowButtonOptions.rightStart,
        endCallback: options.arrowButtonOptions.rightEnd,
        tandem: options.tandem.createTandem('incrementButton'),
        touchAreaXShift: touchAreaXDilation,
        mouseAreaXShift: mouseAreaXDilation
      }, options.arrowButtonOptions));

      // By default, scale the ArrowButtons to have the same height as the NumberDisplay, but ignoring
      // the NumberDisplay's maxWidth (if any)
      if (!arrowButtonScaleProvided) {
        // Remove the current button scaling so we can determine the desired final scale factor
        decrementButton.setScaleMagnitude(1);

        // Set the tweaker button height to match the height of the numberDisplay. Lengthy text can shrink a numberDisplay
        // with maxWidth--if we match the scaled height of the numberDisplay the arrow buttons would shrink too, as
        // depicted in https://github.com/phetsims/scenery-phet/issues/513#issuecomment-517897850
        // Instead, to keep the tweaker buttons a uniform and reasonable size, we match their height to the unscaled
        // height of the numberDisplay (ignores maxWidth and scale).
        const numberDisplayHeight = numberDisplay.localBounds.height;
        const arrowButtonsScale = numberDisplayHeight / decrementButton.height;
        decrementButton.setScaleMagnitude(arrowButtonsScale);
        incrementButton.setScaleMagnitude(arrowButtonsScale);
      }

      // Disable the arrow buttons if the slider currently has focus
      arrowEnabledListener = () => {
        const value = numberProperty.value;
        assert && assert(options.arrowButtonOptions.enabledEpsilon !== undefined);
        decrementButton.enabled = value - options.arrowButtonOptions.enabledEpsilon > getCurrentRange().min && !this.slider.isFocused();
        incrementButton.enabled = value + options.arrowButtonOptions.enabledEpsilon < getCurrentRange().max && !this.slider.isFocused();
      };
      numberProperty.lazyLink(arrowEnabledListener);
      options.enabledRangeProperty && options.enabledRangeProperty.lazyLink(arrowEnabledListener);
      arrowEnabledListener();
      this.slider.addInputListener({
        focus: () => {
          decrementButton.enabled = false;
          incrementButton.enabled = false;
        },
        blur: () => arrowEnabledListener() // recompute if the arrow buttons should be enabled
      });
    }

    // major ticks for the slider
    const majorTicks = options.sliderOptions.majorTicks;
    assert && assert(majorTicks);
    for (let i = 0; i < majorTicks.length; i++) {
      this.slider.addMajorTick(majorTicks[i].value, majorTicks[i].label);
    }

    // minor ticks, exclude values where we already have major ticks
    assert && assert(options.sliderOptions.minorTickSpacing !== undefined);
    if (options.sliderOptions.minorTickSpacing > 0) {
      for (let minorTickValue = numberRange.min; minorTickValue <= numberRange.max;) {
        if (!_.find(majorTicks, majorTick => majorTick.value === minorTickValue)) {
          this.slider.addMinorTick(minorTickValue);
        }
        minorTickValue += options.sliderOptions.minorTickSpacing;
      }
    }
    const child = options.layoutFunction(titleNode, numberDisplay, this.slider, decrementButton, incrementButton);

    // Set up default sizability
    this.widthSizable = isWidthSizable(child);

    // Forward minimum/preferred width Properties to the child, so each layout is responsible for its dynamic layout
    if (extendsWidthSizable(child)) {
      const minimumListener = minimumWidth => {
        this.localMinimumWidth = minimumWidth;
      };
      child.minimumWidthProperty.link(minimumListener);
      const preferredListener = localPreferredWidth => {
        child.preferredWidth = localPreferredWidth;
      };
      this.localPreferredWidthProperty.link(preferredListener);
      this.disposeEmitter.addListener(() => {
        child.minimumWidthProperty.unlink(minimumListener);
        this.localPreferredWidthProperty.unlink(preferredListener);
      });
    }
    options.children = [child];
    this.mutate(options);
    this.numberDisplay = numberDisplay;
    this.disposeNumberControl = () => {
      titleNode.dispose(); // may be linked to a string Property
      numberDisplay.dispose();
      this.slider.dispose();
      this.thumbFillProperty && this.thumbFillProperty.dispose();

      // only defined if options.includeArrowButtons
      decrementButton && decrementButton.dispose();
      incrementButton && incrementButton.dispose();
      arrowEnabledListener && numberProperty.unlink(arrowEnabledListener);
      arrowEnabledListener && options.enabledRangeProperty && options.enabledRangeProperty.unlink(arrowEnabledListener);
    };

    // support for binder documentation, stripped out in builds and only runs when ?binder is specified
    assert && phet?.chipper?.queryParameters?.binder && InstanceRegistry.registerDataURL('scenery-phet', 'NumberControl', this);
  }
  dispose() {
    this.disposeNumberControl();
    super.dispose();
  }

  /**
   * Creates a NumberControl with default tick marks for min and max values.
   */
  static withMinMaxTicks(label, property, range, providedOptions) {
    const options = optionize()({
      tickLabelFont: new PhetFont(12)
    }, providedOptions);
    options.sliderOptions = combineOptions({
      majorTicks: [{
        value: range.min,
        label: new Text(range.min, {
          font: options.tickLabelFont
        })
      }, {
        value: range.max,
        label: new Text(range.max, {
          font: options.tickLabelFont
        })
      }]
    }, options.sliderOptions);
    return new NumberControl(label, property, range, options);
  }

  /**
   * Creates one of the pre-defined layout functions that can be used for options.layoutFunction.
   * Arranges subcomponents like this:
   *
   *  title number
   *  < ------|------ >
   *
   */
  static createLayoutFunction1(providedOptions) {
    const options = optionize()({
      align: 'center',
      titleXSpacing: 5,
      arrowButtonsXSpacing: 15,
      ySpacing: 5
    }, providedOptions);
    return (titleNode, numberDisplay, slider, decrementButton, incrementButton) => {
      assert && assert(decrementButton, 'There is no decrementButton!');
      assert && assert(incrementButton, 'There is no incrementButton!');
      slider.mutateLayoutOptions({
        grow: 1
      });
      return new VBox({
        align: options.align,
        spacing: options.ySpacing,
        children: [new HBox({
          spacing: options.titleXSpacing,
          children: [titleNode, numberDisplay]
        }), new HBox({
          layoutOptions: {
            stretch: true
          },
          spacing: options.arrowButtonsXSpacing,
          children: [decrementButton, slider, incrementButton]
        })]
      });
    };
  }

  /**
   * Creates one of the pre-defined layout functions that can be used for options.layoutFunction.
   * Arranges subcomponents like this:
   *
   *  title < number >
   *  ------|------
   */
  static createLayoutFunction2(providedOptions) {
    const options = optionize()({
      align: 'center',
      xSpacing: 5,
      ySpacing: 5
    }, providedOptions);
    return (titleNode, numberDisplay, slider, decrementButton, incrementButton) => {
      assert && assert(decrementButton);
      assert && assert(incrementButton);
      slider.mutateLayoutOptions({
        stretch: true
      });
      return new VBox({
        align: options.align,
        spacing: options.ySpacing,
        children: [new HBox({
          spacing: options.xSpacing,
          children: [titleNode, decrementButton, numberDisplay, incrementButton]
        }), slider]
      });
    };
  }

  /**
   * Creates one of the pre-defined layout functions that can be used for options.layoutFunction.
   * Arranges subcomponents like this:
   *
   *  title
   *  < number >
   *  -------|-------
   */
  static createLayoutFunction3(providedOptions) {
    const options = optionize()({
      alignTitle: 'center',
      alignNumber: 'center',
      titleLeftIndent: 0,
      xSpacing: 5,
      ySpacing: 5
    }, providedOptions);
    return (titleNode, numberDisplay, slider, decrementButton, incrementButton) => {
      assert && assert(decrementButton);
      assert && assert(incrementButton);
      slider.mutateLayoutOptions({
        stretch: true
      });
      const titleAndContentVBox = new VBox({
        spacing: options.ySpacing,
        align: options.alignTitle,
        children: [new AlignBox(titleNode, {
          leftMargin: options.titleLeftIndent
        }), new VBox({
          layoutOptions: {
            stretch: true
          },
          spacing: options.ySpacing,
          align: options.alignNumber,
          children: [new HBox({
            spacing: options.xSpacing,
            children: [decrementButton, numberDisplay, incrementButton]
          }), slider]
        })]
      });

      // When the text of the title changes recompute the alignment between the title and content
      titleNode.boundsProperty.lazyLink(() => {
        titleAndContentVBox.updateLayout();
      });
      return titleAndContentVBox;
    };
  }

  /**
   * Creates one of the pre-defined layout functions that can be used for options.layoutFunction.
   * Like createLayoutFunction1, but the title and value go all the way to the edges.
   */
  static createLayoutFunction4(providedOptions) {
    const options = optionize()({
      // adds additional horizontal space between title and NumberDisplay
      sliderPadding: 0,
      // vertical spacing between slider and title/NumberDisplay
      verticalSpacing: 5,
      // spacing between slider and arrow buttons
      arrowButtonSpacing: 5,
      hasReadoutProperty: null,
      layoutInvisibleButtons: false,
      createBottomContent: null // Supports Pendulum Lab's questionText where a question is substituted for the slider
    }, providedOptions);
    return (titleNode, numberDisplay, slider, decrementButton, incrementButton) => {
      slider.mutateLayoutOptions({
        grow: 1
      });
      const includeArrowButtons = !!decrementButton; // if there aren't arrow buttons, then exclude them
      const bottomBox = new HBox({
        spacing: options.arrowButtonSpacing,
        children: !includeArrowButtons ? [slider] : [decrementButton, slider, incrementButton],
        excludeInvisibleChildrenFromBounds: !options.layoutInvisibleButtons
      });
      const bottomContent = options.createBottomContent ? options.createBottomContent(bottomBox) : bottomBox;
      bottomContent.mutateLayoutOptions({
        stretch: true,
        xMargin: options.sliderPadding
      });

      // Dynamic layout supported
      return new VBox({
        spacing: options.verticalSpacing,
        children: [new HBox({
          spacing: options.sliderPadding,
          children: [titleNode, new Node({
            children: [numberDisplay],
            visibleProperty: options.hasReadoutProperty || null,
            excludeInvisibleChildrenFromBounds: true
          })],
          layoutOptions: {
            stretch: true
          }
        }), bottomContent]
      });
    };
  }
  static NumberControlIO = new IOType('NumberControlIO', {
    valueType: NumberControl,
    documentation: 'A number control with a title, slider and +/- buttons',
    supertype: Node.NodeIO
  });
  static SLIDER_TANDEM_NAME = 'slider';
}

/**
 * Validate all of the callback related options. There are two types of callbacks. The "start/endCallback" pair
 * are passed into all components in the NumberControl. The second set are start/end callbacks for each individual
 * component. This was added to support multitouch in Rutherford Scattering as part of
 * https://github.com/phetsims/rutherford-scattering/issues/128.
 *
 * This function mutates the options by initializing general callbacks from null (in the extend call) to a no-op
 * function.
 *
 * Only general or specific callbacks are allowed, but not both.
 */
function validateCallbacks(options) {
  const normalCallbacksPresent = !!(options.startCallback || options.endCallback);
  let arrowCallbacksPresent = false;
  let sliderCallbacksPresent = false;
  if (options.arrowButtonOptions) {
    arrowCallbacksPresent = specificCallbackKeysInOptions(options.arrowButtonOptions);
  }
  if (options.sliderOptions) {
    sliderCallbacksPresent = specificCallbackKeysInOptions(options.sliderOptions);
  }
  const specificCallbacksPresent = arrowCallbacksPresent || sliderCallbacksPresent;

  // only general or component specific callbacks are supported
  assert && assert(!(normalCallbacksPresent && specificCallbacksPresent), 'Use general callbacks like "startCallback" or specific callbacks like "sliderOptions.startDrag" but not both.');
}

/**
 * Check for an intersection between the array of callback option keys and those
 * passed in the options object. These callback options are only the specific component callbacks, not the general
 * start/end that are called for every component's interaction
 */
function specificCallbackKeysInOptions(options) {
  const optionKeys = Object.keys(options);
  const intersection = SPECIFIC_COMPONENT_CALLBACK_OPTIONS.filter(x => _.includes(optionKeys, x));
  return intersection.length > 0;
}
sceneryPhet.register('NumberControl', NumberControl);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJEZXJpdmVkUHJvcGVydHkiLCJEaW1lbnNpb24yIiwiUmFuZ2UiLCJVdGlscyIsIkluc3RhbmNlUmVnaXN0cnkiLCJvcHRpb25pemUiLCJjb21iaW5lT3B0aW9ucyIsIkFsaWduQm94IiwiZXh0ZW5kc1dpZHRoU2l6YWJsZSIsIkhCb3giLCJpc1dpZHRoU2l6YWJsZSIsIk5vZGUiLCJQYWludENvbG9yUHJvcGVydHkiLCJUZXh0IiwiVkJveCIsIldpZHRoU2l6YWJsZSIsIkFycm93QnV0dG9uIiwiU2xpZGVyIiwibnVsbFNvdW5kUGxheWVyIiwiVmFsdWVDaGFuZ2VTb3VuZFBsYXllciIsIlRhbmRlbSIsIklPVHlwZSIsIk51bWJlckRpc3BsYXkiLCJQaGV0Rm9udCIsInNjZW5lcnlQaGV0IiwiT3JpZW50YXRpb24iLCJTUEVDSUZJQ19DT01QT05FTlRfQ0FMTEJBQ0tfT1BUSU9OUyIsIkRFRkFVTFRfU09VTkQiLCJERUZBVUxUX0hTTElERVJfVFJBQ0tfU0laRSIsIkRFRkFVTFRfSFNMSURFUl9USFVNQl9TSVpFIiwiTnVtYmVyQ29udHJvbCIsImNvbnN0cnVjdG9yIiwidGl0bGUiLCJudW1iZXJQcm9wZXJ0eSIsIm51bWJlclJhbmdlIiwicHJvdmlkZWRPcHRpb25zIiwidmFsaWRhdGVDYWxsYmFja3MiLCJpbml0aWFsT3B0aW9ucyIsIm51bWJlckRpc3BsYXlPcHRpb25zIiwic2xpZGVyT3B0aW9ucyIsImFycm93QnV0dG9uT3B0aW9ucyIsInRpdGxlTm9kZU9wdGlvbnMiLCJzdGFydENhbGxiYWNrIiwiXyIsIm5vb3AiLCJlbmRDYWxsYmFjayIsImRlbHRhIiwiZGlzYWJsZWRPcGFjaXR5IiwibGF5b3V0RnVuY3Rpb24iLCJjcmVhdGVMYXlvdXRGdW5jdGlvbjEiLCJpbmNsdWRlQXJyb3dCdXR0b25zIiwic291bmRHZW5lcmF0b3IiLCJ2YWx1ZUNoYW5nZVNvdW5kR2VuZXJhdG9yT3B0aW9ucyIsInRhbmRlbSIsIlJFUVVJUkVEIiwidGFuZGVtTmFtZVN1ZmZpeCIsInBoZXRpb1R5cGUiLCJOdW1iZXJDb250cm9sSU8iLCJwaGV0aW9FbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQiLCJ2aXNpYmxlUHJvcGVydHlPcHRpb25zIiwicGhldGlvRmVhdHVyZWQiLCJhc3NlcnQiLCJncm91cEZvY3VzSGlnaGxpZ2h0IiwidW5kZWZpbmVkIiwiYXJyb3dCdXR0b25TY2FsZVByb3ZpZGVkIiwiaGFzT3duUHJvcGVydHkiLCJnZXRDdXJyZW50UmFuZ2UiLCJvcHRpb25zIiwiZW5hYmxlZFJhbmdlUHJvcGVydHkiLCJ2YWx1ZSIsImNvbnN0cmFpblZhbHVlIiwibmV3VmFsdWUiLCJyb3VuZFRvSW50ZXJ2YWwiLCJpc0VtcHR5IiwiaW50ZXJUaHJlc2hvbGREZWx0YSIsIk5PX1NPVU5EIiwidG91Y2hBcmVhWERpbGF0aW9uIiwidG91Y2hBcmVhWURpbGF0aW9uIiwibW91c2VBcmVhWERpbGF0aW9uIiwibW91c2VBcmVhWURpbGF0aW9uIiwiZW5hYmxlZEVwc2lsb24iLCJsZWZ0U3RhcnQiLCJsZWZ0RW5kIiwicmlnaHRTdGFydCIsInJpZ2h0RW5kIiwiZW5hYmxlZFByb3BlcnR5T3B0aW9ucyIsInBoZXRpb1JlYWRPbmx5Iiwib3JpZW50YXRpb24iLCJIT1JJWk9OVEFMIiwic3RhcnREcmFnIiwiZW5kRHJhZyIsIm1ham9yVGlja0xlbmd0aCIsIm1pbm9yVGlja1N0cm9rZSIsIm1ham9yVGlja3MiLCJtaW5vclRpY2tTcGFjaW5nIiwiY3JlYXRlVGFuZGVtIiwiU0xJREVSX1RBTkRFTV9OQU1FIiwidGV4dE9wdGlvbnMiLCJmb250Iiwic3RyaW5nUHJvcGVydHlPcHRpb25zIiwibWF4V2lkdGgiLCJmaWxsIiwidGFnTmFtZSIsInRyYWNrTm9kZSIsInRyYWNrU2l6ZSIsInN3YXBwZWQiLCJ0aHVtYk5vZGUiLCJ0aHVtYlNpemUiLCJ0aHVtYlRvdWNoQXJlYVhEaWxhdGlvbiIsInNoaWZ0S2V5Ym9hcmRTdGVwIiwiU2xpZGVySU8iLCJ0aHVtYkZpbGwiLCJ0aHVtYkZpbGxIaWdobGlnaHRlZCIsInRodW1iRmlsbFByb3BlcnR5IiwiY29sb3IiLCJicmlnaHRlckNvbG9yIiwidGl0bGVOb2RlIiwibnVtYmVyRGlzcGxheSIsInNsaWRlciIsImRlY3JlbWVudEJ1dHRvbiIsImluY3JlbWVudEJ1dHRvbiIsImFycm93RW5hYmxlZExpc3RlbmVyIiwib2xkVmFsdWUiLCJnZXQiLCJNYXRoIiwibWF4IiwibWluIiwic2V0IiwicGxheVNvdW5kRm9yVmFsdWVDaGFuZ2UiLCJ2b2ljaW5nT25FbmRSZXNwb25zZSIsInNvdW5kUGxheWVyIiwidG91Y2hBcmVhWFNoaWZ0IiwibW91c2VBcmVhWFNoaWZ0Iiwic2V0U2NhbGVNYWduaXR1ZGUiLCJudW1iZXJEaXNwbGF5SGVpZ2h0IiwibG9jYWxCb3VuZHMiLCJoZWlnaHQiLCJhcnJvd0J1dHRvbnNTY2FsZSIsImVuYWJsZWQiLCJpc0ZvY3VzZWQiLCJsYXp5TGluayIsImFkZElucHV0TGlzdGVuZXIiLCJmb2N1cyIsImJsdXIiLCJpIiwibGVuZ3RoIiwiYWRkTWFqb3JUaWNrIiwibGFiZWwiLCJtaW5vclRpY2tWYWx1ZSIsImZpbmQiLCJtYWpvclRpY2siLCJhZGRNaW5vclRpY2siLCJjaGlsZCIsIndpZHRoU2l6YWJsZSIsIm1pbmltdW1MaXN0ZW5lciIsIm1pbmltdW1XaWR0aCIsImxvY2FsTWluaW11bVdpZHRoIiwibWluaW11bVdpZHRoUHJvcGVydHkiLCJsaW5rIiwicHJlZmVycmVkTGlzdGVuZXIiLCJsb2NhbFByZWZlcnJlZFdpZHRoIiwicHJlZmVycmVkV2lkdGgiLCJsb2NhbFByZWZlcnJlZFdpZHRoUHJvcGVydHkiLCJkaXNwb3NlRW1pdHRlciIsImFkZExpc3RlbmVyIiwidW5saW5rIiwiY2hpbGRyZW4iLCJtdXRhdGUiLCJkaXNwb3NlTnVtYmVyQ29udHJvbCIsImRpc3Bvc2UiLCJwaGV0IiwiY2hpcHBlciIsInF1ZXJ5UGFyYW1ldGVycyIsImJpbmRlciIsInJlZ2lzdGVyRGF0YVVSTCIsIndpdGhNaW5NYXhUaWNrcyIsInByb3BlcnR5IiwicmFuZ2UiLCJ0aWNrTGFiZWxGb250IiwiYWxpZ24iLCJ0aXRsZVhTcGFjaW5nIiwiYXJyb3dCdXR0b25zWFNwYWNpbmciLCJ5U3BhY2luZyIsIm11dGF0ZUxheW91dE9wdGlvbnMiLCJncm93Iiwic3BhY2luZyIsImxheW91dE9wdGlvbnMiLCJzdHJldGNoIiwiY3JlYXRlTGF5b3V0RnVuY3Rpb24yIiwieFNwYWNpbmciLCJjcmVhdGVMYXlvdXRGdW5jdGlvbjMiLCJhbGlnblRpdGxlIiwiYWxpZ25OdW1iZXIiLCJ0aXRsZUxlZnRJbmRlbnQiLCJ0aXRsZUFuZENvbnRlbnRWQm94IiwibGVmdE1hcmdpbiIsImJvdW5kc1Byb3BlcnR5IiwidXBkYXRlTGF5b3V0IiwiY3JlYXRlTGF5b3V0RnVuY3Rpb240Iiwic2xpZGVyUGFkZGluZyIsInZlcnRpY2FsU3BhY2luZyIsImFycm93QnV0dG9uU3BhY2luZyIsImhhc1JlYWRvdXRQcm9wZXJ0eSIsImxheW91dEludmlzaWJsZUJ1dHRvbnMiLCJjcmVhdGVCb3R0b21Db250ZW50IiwiYm90dG9tQm94IiwiZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcyIsImJvdHRvbUNvbnRlbnQiLCJ4TWFyZ2luIiwidmlzaWJsZVByb3BlcnR5IiwidmFsdWVUeXBlIiwiZG9jdW1lbnRhdGlvbiIsInN1cGVydHlwZSIsIk5vZGVJTyIsIm5vcm1hbENhbGxiYWNrc1ByZXNlbnQiLCJhcnJvd0NhbGxiYWNrc1ByZXNlbnQiLCJzbGlkZXJDYWxsYmFja3NQcmVzZW50Iiwic3BlY2lmaWNDYWxsYmFja0tleXNJbk9wdGlvbnMiLCJzcGVjaWZpY0NhbGxiYWNrc1ByZXNlbnQiLCJvcHRpb25LZXlzIiwiT2JqZWN0Iiwia2V5cyIsImludGVyc2VjdGlvbiIsImZpbHRlciIsIngiLCJpbmNsdWRlcyIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiTnVtYmVyQ29udHJvbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNS0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBOdW1iZXJDb250cm9sIGlzIGEgY29udHJvbCBmb3IgY2hhbmdpbmcgYSBQcm9wZXJ0eTxudW1iZXI+LCB3aXRoIGZsZXhpYmxlIGxheW91dC4gSXQgY29uc2lzdHMgb2YgYSBsYWJlbGVkIHZhbHVlLFxyXG4gKiBzbGlkZXIsIGFuZCBhcnJvdyBidXR0b25zLlxyXG4gKlxyXG4gKiBOdW1iZXJDb250cm9sIHByb3ZpZGVzIGFjY2Vzc2libGUgY29udGVudCBleGNsdXNpdmVseSB0aHJvdWdoIHRoZSBTbGlkZXIuIFBsZWFzZSBwYXNzIGFjY2Vzc2liaWxpdHkgcmVsYXRlZFxyXG4gKiBjdXN0b21pemF0aW9ucyB0byB0aGUgU2xpZGVyIHRocm91Z2ggb3B0aW9ucy5zbGlkZXJPcHRpb25zLlxyXG4gKlxyXG4gKiBAYXV0aG9yIENocmlzIE1hbGxleSAoUGl4ZWxab29tLCBJbmMuKVxyXG4gKi9cclxuXHJcbmltcG9ydCBEZXJpdmVkUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9EZXJpdmVkUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUUmVhZE9ubHlQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IERpbWVuc2lvbjIgZnJvbSAnLi4vLi4vZG90L2pzL0RpbWVuc2lvbjIuanMnO1xyXG5pbXBvcnQgUmFuZ2UgZnJvbSAnLi4vLi4vZG90L2pzL1JhbmdlLmpzJztcclxuaW1wb3J0IFV0aWxzIGZyb20gJy4uLy4uL2RvdC9qcy9VdGlscy5qcyc7XHJcbmltcG9ydCBJbnN0YW5jZVJlZ2lzdHJ5IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9kb2N1bWVudGF0aW9uL0luc3RhbmNlUmVnaXN0cnkuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplLCB7IGNvbWJpbmVPcHRpb25zIH0gZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBJbnRlbnRpb25hbEFueSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvSW50ZW50aW9uYWxBbnkuanMnO1xyXG5pbXBvcnQgUGlja09wdGlvbmFsIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9QaWNrT3B0aW9uYWwuanMnO1xyXG5pbXBvcnQgU3RyaWN0T21pdCBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvU3RyaWN0T21pdC5qcyc7XHJcbmltcG9ydCB7IEFsaWduQm94LCBleHRlbmRzV2lkdGhTaXphYmxlLCBGb250LCBIQm94LCBpc1dpZHRoU2l6YWJsZSwgTm9kZSwgTm9kZU9wdGlvbnMsIFBhaW50Q29sb3JQcm9wZXJ0eSwgVGV4dCwgVGV4dE9wdGlvbnMsIFZCb3gsIFdpZHRoU2l6YWJsZSB9IGZyb20gJy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBBcnJvd0J1dHRvbiwgeyBBcnJvd0J1dHRvbk9wdGlvbnMgfSBmcm9tICcuLi8uLi9zdW4vanMvYnV0dG9ucy9BcnJvd0J1dHRvbi5qcyc7XHJcbmltcG9ydCBIU2xpZGVyIGZyb20gJy4uLy4uL3N1bi9qcy9IU2xpZGVyLmpzJztcclxuaW1wb3J0IFNsaWRlciwgeyBTbGlkZXJPcHRpb25zIH0gZnJvbSAnLi4vLi4vc3VuL2pzL1NsaWRlci5qcyc7XHJcbmltcG9ydCBudWxsU291bmRQbGF5ZXIgZnJvbSAnLi4vLi4vdGFtYm8vanMvc2hhcmVkLXNvdW5kLXBsYXllcnMvbnVsbFNvdW5kUGxheWVyLmpzJztcclxuaW1wb3J0IFZhbHVlQ2hhbmdlU291bmRQbGF5ZXIsIHsgVmFsdWVDaGFuZ2VTb3VuZFBsYXllck9wdGlvbnMgfSBmcm9tICcuLi8uLi90YW1iby9qcy9zb3VuZC1nZW5lcmF0b3JzL1ZhbHVlQ2hhbmdlU291bmRQbGF5ZXIuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgSU9UeXBlIGZyb20gJy4uLy4uL3RhbmRlbS9qcy90eXBlcy9JT1R5cGUuanMnO1xyXG5pbXBvcnQgTnVtYmVyRGlzcGxheSwgeyBOdW1iZXJEaXNwbGF5T3B0aW9ucyB9IGZyb20gJy4vTnVtYmVyRGlzcGxheS5qcyc7XHJcbmltcG9ydCBQaGV0Rm9udCBmcm9tICcuL1BoZXRGb250LmpzJztcclxuaW1wb3J0IHNjZW5lcnlQaGV0IGZyb20gJy4vc2NlbmVyeVBoZXQuanMnO1xyXG5pbXBvcnQgUGhldGlvUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9QaGV0aW9Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBPcmllbnRhdGlvbiBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvT3JpZW50YXRpb24uanMnO1xyXG5cclxuLy8gY29uc3RhbnRzXHJcbmNvbnN0IFNQRUNJRklDX0NPTVBPTkVOVF9DQUxMQkFDS19PUFRJT05TID0gW1xyXG4gICdzdGFydERyYWcnLFxyXG4gICdlbmREcmFnJyxcclxuICAnbGVmdFN0YXJ0JyxcclxuICAnbGVmdEVuZCcsXHJcbiAgJ3JpZ2h0U3RhcnQnLFxyXG4gICdyaWdodEVuZCdcclxuXTtcclxuXHJcbi8vIFRoaXMgaXMgYSBtYXJrZXIgdG8gaW5kaWNhdGUgdGhhdCB3ZSBzaG91bGQgY3JlYXRlIHRoZSBhY3R1YWwgZGVmYXVsdCBzb3VuZCBwbGF5ZXIuXHJcbmNvbnN0IERFRkFVTFRfU09VTkQgPSBuZXcgVmFsdWVDaGFuZ2VTb3VuZFBsYXllciggbmV3IFJhbmdlKCAwLCAxICkgKTtcclxuXHJcbmNvbnN0IERFRkFVTFRfSFNMSURFUl9UUkFDS19TSVpFID0gbmV3IERpbWVuc2lvbjIoIDE4MCwgMyApO1xyXG5jb25zdCBERUZBVUxUX0hTTElERVJfVEhVTUJfU0laRSA9IG5ldyBEaW1lbnNpb24yKCAxNywgMzQgKTtcclxuXHJcbmV4cG9ydCB0eXBlIExheW91dEZ1bmN0aW9uID0gKCB0aXRsZU5vZGU6IE5vZGUsIG51bWJlckRpc3BsYXk6IE51bWJlckRpc3BsYXksIHNsaWRlcjogU2xpZGVyLCBkZWNyZW1lbnRCdXR0b246IEFycm93QnV0dG9uIHwgbnVsbCwgaW5jcmVtZW50QnV0dG9uOiBBcnJvd0J1dHRvbiB8IG51bGwgKSA9PiBOb2RlO1xyXG5cclxuLy8gZGVzY3JpcHRpb24gb2YgYSBtYWpvciB0aWNrXHJcbnR5cGUgTnVtYmVyQ29udHJvbE1ham9yVGljayA9IHtcclxuICB2YWx1ZTogbnVtYmVyOyAvLyB2YWx1ZSB0aGF0IHRoZSB0aWNrIGNvcnJlc3BvbmRzIHRvXHJcbiAgbGFiZWw/OiBOb2RlOyAvLyBvcHRpb25hbCBsYWJlbCB0aGF0IGFwcGVhcnMgYXQgdGhlIHRpY2sgbWFya1xyXG59O1xyXG5cclxuLy8gb3RoZXIgc2xpZGVyIG9wdGlvbnMgdGhhdCBhcmUgc3BlY2lmaWMgdG8gTnVtYmVyQ29udHJvbFxyXG5leHBvcnQgdHlwZSBOdW1iZXJDb250cm9sU2xpZGVyT3B0aW9ucyA9IFN0cmljdE9taXQ8U2xpZGVyT3B0aW9ucywgJ2VuYWJsZWRSYW5nZVByb3BlcnR5Jz4gJiB7XHJcblxyXG4gIC8vIGRlc2NyaXB0aW9uIG9mIG1ham9yIHRpY2tzXHJcbiAgbWFqb3JUaWNrcz86IE51bWJlckNvbnRyb2xNYWpvclRpY2tbXTtcclxuXHJcbiAgLy8gemVybyBpbmRpY2F0ZXMgbm8gbWlub3IgdGlja3NcclxuICBtaW5vclRpY2tTcGFjaW5nPzogbnVtYmVyO1xyXG59O1xyXG5cclxudHlwZSBXaXRoTWluTWF4U2VsZk9wdGlvbnMgPSB7XHJcbiAgdGlja0xhYmVsRm9udD86IEZvbnQ7XHJcbn07XHJcbmV4cG9ydCB0eXBlIFdpdGhNaW5NYXhPcHRpb25zID0gTnVtYmVyQ29udHJvbE9wdGlvbnMgJiBXaXRoTWluTWF4U2VsZk9wdGlvbnM7XHJcblxyXG5leHBvcnQgdHlwZSBOdW1iZXJDb250cm9sTGF5b3V0RnVuY3Rpb24xT3B0aW9ucyA9IHtcclxuICAvLyBob3Jpem9udGFsIGFsaWdubWVudCBvZiByb3dzLCAnbGVmdCd8J3JpZ2h0J3wnY2VudGVyJ1xyXG4gIGFsaWduPzogJ2NlbnRlcicgfCAnbGVmdCcgfCAncmlnaHQnO1xyXG5cclxuICAvLyBob3Jpem9udGFsIHNwYWNpbmcgYmV0d2VlbiB0aXRsZSBhbmQgbnVtYmVyXHJcbiAgdGl0bGVYU3BhY2luZz86IG51bWJlcjtcclxuXHJcbiAgLy8gaG9yaXpvbnRhbCBzcGFjaW5nIGJldHdlZW4gYXJyb3cgYnV0dG9ucyBhbmQgc2xpZGVyXHJcbiAgYXJyb3dCdXR0b25zWFNwYWNpbmc/OiBudW1iZXI7XHJcblxyXG4gIC8vIHZlcnRpY2FsIHNwYWNpbmcgYmV0d2VlbiByb3dzXHJcbiAgeVNwYWNpbmc/OiBudW1iZXI7XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBOdW1iZXJDb250cm9sTGF5b3V0RnVuY3Rpb24yT3B0aW9ucyA9IHtcclxuICAvLyBob3Jpem9udGFsIGFsaWdubWVudCBvZiByb3dzLCAnbGVmdCd8J3JpZ2h0J3wnY2VudGVyJ1xyXG4gIGFsaWduPzogJ2NlbnRlcicgfCAnbGVmdCcgfCAncmlnaHQnO1xyXG5cclxuICAvLyBob3Jpem9udGFsIHNwYWNpbmcgaW4gdG9wIHJvd1xyXG4gIHhTcGFjaW5nPzogbnVtYmVyO1xyXG5cclxuICAvLyB2ZXJ0aWNhbCBzcGFjaW5nIGJldHdlZW4gcm93c1xyXG4gIHlTcGFjaW5nPzogbnVtYmVyO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgTnVtYmVyQ29udHJvbExheW91dEZ1bmN0aW9uM09wdGlvbnMgPSB7XHJcbiAgLy8gaG9yaXpvbnRhbCBhbGlnbm1lbnQgb2YgdGl0bGUsIHJlbGF0aXZlIHRvIHNsaWRlciwgJ2xlZnQnfCdyaWdodCd8J2NlbnRlcidcclxuICBhbGlnblRpdGxlPzogJ2NlbnRlcicgfCAnbGVmdCcgfCAncmlnaHQnO1xyXG5cclxuICAvLyBob3Jpem9udGFsIGFsaWdubWVudCBvZiBudW1iZXIgZGlzcGxheSwgcmVsYXRpdmUgdG8gc2xpZGVyLCAnbGVmdCd8J3JpZ2h0J3wnY2VudGVyJ1xyXG4gIGFsaWduTnVtYmVyPzogJ2NlbnRlcicgfCAnbGVmdCcgfCAncmlnaHQnO1xyXG5cclxuICAvLyBpZiBwcm92aWRlZCwgaW5kZW50IHRoZSB0aXRsZSBvbiB0aGUgbGVmdCB0byBwdXNoIHRoZSB0aXRsZSB0byB0aGUgcmlnaHRcclxuICB0aXRsZUxlZnRJbmRlbnQ/OiBudW1iZXI7XHJcblxyXG4gIC8vIGhvcml6b250YWwgc3BhY2luZyBiZXR3ZWVuIGFycm93IGJ1dHRvbnMgYW5kIHNsaWRlclxyXG4gIHhTcGFjaW5nPzogbnVtYmVyO1xyXG5cclxuICAvLyB2ZXJ0aWNhbCBzcGFjaW5nIGJldHdlZW4gcm93c1xyXG4gIHlTcGFjaW5nPzogbnVtYmVyO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgTnVtYmVyQ29udHJvbExheW91dEZ1bmN0aW9uNE9wdGlvbnMgPSB7XHJcbiAgLy8gYWRkcyBhZGRpdGlvbmFsIGhvcml6b250YWwgc3BhY2UgYmV0d2VlbiB0aXRsZSBhbmQgTnVtYmVyRGlzcGxheVxyXG4gIHNsaWRlclBhZGRpbmc/OiBudW1iZXI7XHJcblxyXG4gIC8vIHZlcnRpY2FsIHNwYWNpbmcgYmV0d2VlbiBzbGlkZXIgYW5kIHRpdGxlL051bWJlckRpc3BsYXlcclxuICB2ZXJ0aWNhbFNwYWNpbmc/OiBudW1iZXI7XHJcblxyXG4gIC8vIHNwYWNpbmcgYmV0d2VlbiBzbGlkZXIgYW5kIGFycm93IGJ1dHRvbnNcclxuICBhcnJvd0J1dHRvblNwYWNpbmc/OiBudW1iZXI7XHJcblxyXG4gIGhhc1JlYWRvdXRQcm9wZXJ0eT86IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+IHwgbnVsbDtcclxuXHJcbiAgLy8gU3VwcG9ydHMgUGVuZHVsdW0gTGFiJ3MgcXVlc3Rpb25UZXh0IHdoZXJlIGEgcXVlc3Rpb24gaXMgc3Vic3RpdHV0ZWQgZm9yIHRoZSBzbGlkZXJcclxuICBjcmVhdGVCb3R0b21Db250ZW50PzogKCAoIGJveDogSEJveCApID0+IE5vZGUgKSB8IG51bGw7XHJcblxyXG4gIC8vIFdoZXRoZXIgaW52aXNpYmxlIGluY3JlbWVudC9kZWNyZW1lbnQgYnV0dG9ucyAob3IgdGhlIHNsaWRlciBpdHNlbGYpIHNob3VsZCBiZSBsYWlkIG91dCBhcyBpZiB0aGV5IHdlcmUgdGhlcmVcclxuICBsYXlvdXRJbnZpc2libGVCdXR0b25zPzogYm9vbGVhbjtcclxufTtcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcbiAgLy8gY2FsbGVkIHdoZW4gaW50ZXJhY3Rpb24gYmVnaW5zLCBkZWZhdWx0IHZhbHVlIHNldCBpbiB2YWxpZGF0ZUNhbGxiYWNrcygpXHJcbiAgc3RhcnRDYWxsYmFjaz86ICgpID0+IHZvaWQ7XHJcblxyXG4gIC8vIGNhbGxlZCB3aGVuIGludGVyYWN0aW9uIGVuZHMsIGRlZmF1bHQgdmFsdWUgc2V0IGluIHZhbGlkYXRlQ2FsbGJhY2tzKClcclxuICBlbmRDYWxsYmFjaz86ICgpID0+IHZvaWQ7XHJcblxyXG4gIGRlbHRhPzogbnVtYmVyO1xyXG5cclxuICAvLyBvcGFjaXR5IHVzZWQgdG8gbWFrZSB0aGUgY29udHJvbCBsb29rIGRpc2FibGVkXHJcbiAgZGlzYWJsZWRPcGFjaXR5PzogbnVtYmVyO1xyXG5cclxuICAvLyBJZiBzZXQgdG8gdHJ1ZSwgdGhlbiBpbmNyZW1lbnQvZGVjcmVtZW50IGFycm93IGJ1dHRvbnMgd2lsbCBiZSBhZGRlZCB0byB0aGUgTnVtYmVyQ29udHJvbFxyXG4gIGluY2x1ZGVBcnJvd0J1dHRvbnM/OiBib29sZWFuO1xyXG5cclxuICAvLyBTdWJjb21wb25lbnQgb3B0aW9ucyBvYmplY3RzXHJcbiAgbnVtYmVyRGlzcGxheU9wdGlvbnM/OiBOdW1iZXJEaXNwbGF5T3B0aW9ucztcclxuICBzbGlkZXJPcHRpb25zPzogTnVtYmVyQ29udHJvbFNsaWRlck9wdGlvbnM7XHJcblxyXG4gIC8vIGZpcmVPbkRvd24gaXMgYnVnZ3ksIHNvIG9taXQgaXQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS1waGV0L2lzc3Vlcy84MjVcclxuICBhcnJvd0J1dHRvbk9wdGlvbnM/OiBTdHJpY3RPbWl0PEFycm93QnV0dG9uT3B0aW9ucywgJ2ZpcmVPbkRvd24nPiAmIHtcclxuICAgIC8vIFdlIHN0dWZmZWQgZW5hYmxlZEVwc2lsb24gaGVyZVxyXG4gICAgZW5hYmxlZEVwc2lsb24/OiBudW1iZXI7XHJcblxyXG4gICAgbGVmdFN0YXJ0PzogKCkgPT4gdm9pZDtcclxuICAgIGxlZnRFbmQ/OiAoIG92ZXI6IGJvb2xlYW4gKSA9PiB2b2lkO1xyXG5cclxuICAgIHJpZ2h0U3RhcnQ/OiAoKSA9PiB2b2lkO1xyXG4gICAgcmlnaHRFbmQ/OiAoIG92ZXI6IGJvb2xlYW4gKSA9PiB2b2lkO1xyXG4gIH07XHJcbiAgdGl0bGVOb2RlT3B0aW9ucz86IFRleHRPcHRpb25zO1xyXG5cclxuICAvLyBJZiBwcm92aWRlZCwgdGhpcyB3aWxsIGJlIHByb3ZpZGVkIHRvIHRoZSBzbGlkZXIgYW5kIGFycm93IGJ1dHRvbnMgaW4gb3JkZXIgdG9cclxuICAvLyBjb25zdHJhaW4gdGhlIHJhbmdlIG9mIGFjdHVhbCB2YWx1ZXMgdG8gd2l0aGluIHRoaXMgcmFuZ2UuXHJcbiAgZW5hYmxlZFJhbmdlUHJvcGVydHk/OiBTbGlkZXJPcHRpb25zWyAnZW5hYmxlZFJhbmdlUHJvcGVydHknIF07XHJcblxyXG4gIC8vIFRoaXMgaXMgdXNlZCB0byBnZW5lcmF0ZSBzb3VuZHMgYXMgdGhlIHZhbHVlIG9mIHRoZSBudW1iZXIgaXMgY2hhbmdlZCB1c2luZyB0aGUgc2xpZGVyIG9yIHRoZSBidXR0b25zLiAgSWYgbm90XHJcbiAgLy8gcHJvdmlkZWQsIGEgZGVmYXVsdCBzb3VuZCBnZW5lcmF0b3Igd2lsbCBiZSBjcmVhdGVkLiBJZiBzZXQgdG8gbnVsbCwgdGhlIG51bWJlciBjb250cm9sIHdpbGwgZ2VuZXJhdGUgbm8gc291bmQuXHJcbiAgc291bmRHZW5lcmF0b3I/OiBWYWx1ZUNoYW5nZVNvdW5kUGxheWVyIHwgbnVsbDtcclxuXHJcbiAgLy8gT3B0aW9ucyBmb3IgdGhlIGRlZmF1bHQgc291bmQgZ2VuZXJhdG9yLiAgVGhlc2Ugc2hvdWxkIG9ubHkgYmUgcHJvdmlkZWQgd2hlbiBOT1QgcHJvdmlkaW5nIGEgY3VzdG9tIHNvdW5kIHBsYXllci5cclxuICB2YWx1ZUNoYW5nZVNvdW5kR2VuZXJhdG9yT3B0aW9ucz86IFZhbHVlQ2hhbmdlU291bmRQbGF5ZXJPcHRpb25zO1xyXG5cclxuICAvLyBBIHtmdW5jdGlvbn0gdGhhdCBoYW5kbGVzIGxheW91dCBvZiBzdWJjb21wb25lbnRzLlxyXG4gIC8vIEl0IGhhcyBzaWduYXR1cmUgZnVuY3Rpb24oIHRpdGxlTm9kZSwgbnVtYmVyRGlzcGxheSwgc2xpZGVyLCBkZWNyZW1lbnRCdXR0b24sIGluY3JlbWVudEJ1dHRvbiApXHJcbiAgLy8gYW5kIHJldHVybnMgYSBOb2RlLiBJZiB5b3Ugd2FudCB0byBjdXN0b21pemUgdGhlIGxheW91dCwgdXNlIG9uZSBvZiB0aGUgcHJlZGVmaW5lZCBjcmVhdG9yc1xyXG4gIC8vIChzZWUgY3JlYXRlTGF5b3V0RnVuY3Rpb24qKSBvciBjcmVhdGUgeW91ciBvd24gZnVuY3Rpb24uIEFycm93IGJ1dHRvbnMgd2lsbCBiZSBudWxsIGlmIGBpbmNsdWRlQXJyb3dCdXR0b25zOmZhbHNlYFxyXG4gIGxheW91dEZ1bmN0aW9uPzogTGF5b3V0RnVuY3Rpb247XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBOdW1iZXJDb250cm9sT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgU3RyaWN0T21pdDxOb2RlT3B0aW9ucywgJ2NoaWxkcmVuJz47XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBOdW1iZXJDb250cm9sIGV4dGVuZHMgV2lkdGhTaXphYmxlKCBOb2RlICkge1xyXG5cclxuICBwdWJsaWMgcmVhZG9ubHkgc2xpZGVyOiBIU2xpZGVyOyAvLyBmb3IgYTExeSBBUElcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSB0aHVtYkZpbGxQcm9wZXJ0eT86IFBhaW50Q29sb3JQcm9wZXJ0eTtcclxuICBwcml2YXRlIHJlYWRvbmx5IG51bWJlckRpc3BsYXk6IE51bWJlckRpc3BsYXk7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNwb3NlTnVtYmVyQ29udHJvbDogKCkgPT4gdm9pZDtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCB0aXRsZTogc3RyaW5nIHwgVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nPiwgbnVtYmVyUHJvcGVydHk6IFBoZXRpb1Byb3BlcnR5PG51bWJlcj4sIG51bWJlclJhbmdlOiBSYW5nZSwgcHJvdmlkZWRPcHRpb25zPzogTnVtYmVyQ29udHJvbE9wdGlvbnMgKSB7XHJcblxyXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgZ2VuZXJhbCBjYWxsYmFja3MgKGZvciBhbGwgY29tcG9uZW50cykgYW5kIHNwZWNpZmljIGNhbGxiYWNrcyAoZm9yIGEgc3BlY2lmaWMgY29tcG9uZW50KSBhcmVuJ3RcclxuICAgIC8vIHVzZWQgaW4gdGFuZGVtLiBUaGlzIG11c3QgYmUgY2FsbGVkIGJlZm9yZSBkZWZhdWx0cyBhcmUgc2V0LlxyXG4gICAgdmFsaWRhdGVDYWxsYmFja3MoIHByb3ZpZGVkT3B0aW9ucyB8fCB7fSApO1xyXG5cclxuICAgIC8vIE9taXQgZW5hYmxlZFJhbmdlUHJvcGVydHkgZnJvbSB0b3AtbGV2ZWwsIHNvIHRoYXQgd2UgZG9uJ3QgbmVlZCB0byBwcm92aWRlIGEgZGVmYXVsdC5cclxuICAgIC8vIFRoZW4gYWRkIGVuYWJsZWRSYW5nZVByb3BlcnR5IHRvIHNsaWRlck9wdGlvbnMsIHNvIHRoYXQgaWYgd2UgYXJlIGdpdmVuIHByb3ZpZGVkT3B0aW9ucy5lbmFibGVkUmFuZ2VQcm9wZXJ0eSxcclxuICAgIC8vIHdlIGNhbiBwYXNzIGl0IHRvIHN1cGVyIHZpYSBvcHRpb25zLnNsaWRlck9wdGlvbnMuZW5hYmxlZFJhbmdlUHJvcGVydHkuXHJcbiAgICB0eXBlIFJldmlzZWRTZWxmT3B0aW9ucyA9IFN0cmljdE9taXQ8U2VsZk9wdGlvbnMsICdlbmFibGVkUmFuZ2VQcm9wZXJ0eSc+ICYge1xyXG4gICAgICBzbGlkZXJPcHRpb25zPzogUGlja09wdGlvbmFsPFNsaWRlck9wdGlvbnMsICdlbmFibGVkUmFuZ2VQcm9wZXJ0eSc+O1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBFeHRlbmQgTnVtYmVyQ29udHJvbCBvcHRpb25zIGJlZm9yZSBtZXJnaW5nIG5lc3RlZCBvcHRpb25zIGJlY2F1c2Ugc29tZSBuZXN0ZWQgZGVmYXVsdHMgdXNlIHRoZXNlIG9wdGlvbnMuXHJcbiAgICBjb25zdCBpbml0aWFsT3B0aW9ucyA9IG9wdGlvbml6ZTxOdW1iZXJDb250cm9sT3B0aW9ucywgUmV2aXNlZFNlbGZPcHRpb25zLCBOb2RlT3B0aW9ucz4oKSgge1xyXG5cclxuICAgICAgbnVtYmVyRGlzcGxheU9wdGlvbnM6IHt9LFxyXG4gICAgICBzbGlkZXJPcHRpb25zOiB7fSxcclxuICAgICAgYXJyb3dCdXR0b25PcHRpb25zOiB7fSxcclxuICAgICAgdGl0bGVOb2RlT3B0aW9uczoge30sXHJcblxyXG4gICAgICAvLyBHZW5lcmFsIENhbGxiYWNrc1xyXG4gICAgICBzdGFydENhbGxiYWNrOiBfLm5vb3AsIC8vIGNhbGxlZCB3aGVuIGludGVyYWN0aW9uIGJlZ2lucywgZGVmYXVsdCB2YWx1ZSBzZXQgaW4gdmFsaWRhdGVDYWxsYmFja3MoKVxyXG4gICAgICBlbmRDYWxsYmFjazogXy5ub29wLCAvLyBjYWxsZWQgd2hlbiBpbnRlcmFjdGlvbiBlbmRzLCBkZWZhdWx0IHZhbHVlIHNldCBpbiB2YWxpZGF0ZUNhbGxiYWNrcygpXHJcblxyXG4gICAgICBkZWx0YTogMSxcclxuXHJcbiAgICAgIGRpc2FibGVkT3BhY2l0eTogMC41LCAvLyB7bnVtYmVyfSBvcGFjaXR5IHVzZWQgdG8gbWFrZSB0aGUgY29udHJvbCBsb29rIGRpc2FibGVkXHJcblxyXG4gICAgICAvLyBBIHtmdW5jdGlvbn0gdGhhdCBoYW5kbGVzIGxheW91dCBvZiBzdWJjb21wb25lbnRzLlxyXG4gICAgICAvLyBJdCBoYXMgc2lnbmF0dXJlIGZ1bmN0aW9uKCB0aXRsZU5vZGUsIG51bWJlckRpc3BsYXksIHNsaWRlciwgZGVjcmVtZW50QnV0dG9uLCBpbmNyZW1lbnRCdXR0b24gKVxyXG4gICAgICAvLyBhbmQgcmV0dXJucyBhIE5vZGUuIElmIHlvdSB3YW50IHRvIGN1c3RvbWl6ZSB0aGUgbGF5b3V0LCB1c2Ugb25lIG9mIHRoZSBwcmVkZWZpbmVkIGNyZWF0b3JzXHJcbiAgICAgIC8vIChzZWUgY3JlYXRlTGF5b3V0RnVuY3Rpb24qKSBvciBjcmVhdGUgeW91ciBvd24gZnVuY3Rpb24uIEFycm93IGJ1dHRvbnMgd2lsbCBiZSBudWxsIGlmIGBpbmNsdWRlQXJyb3dCdXR0b25zOmZhbHNlYFxyXG4gICAgICBsYXlvdXRGdW5jdGlvbjogTnVtYmVyQ29udHJvbC5jcmVhdGVMYXlvdXRGdW5jdGlvbjEoKSxcclxuXHJcbiAgICAgIC8vIHtib29sZWFufSBJZiBzZXQgdG8gdHJ1ZSwgdGhlbiBpbmNyZW1lbnQvZGVjcmVtZW50IGFycm93IGJ1dHRvbnMgd2lsbCBiZSBhZGRlZCB0byB0aGUgTnVtYmVyQ29udHJvbFxyXG4gICAgICBpbmNsdWRlQXJyb3dCdXR0b25zOiB0cnVlLFxyXG5cclxuICAgICAgc291bmRHZW5lcmF0b3I6IERFRkFVTFRfU09VTkQsXHJcbiAgICAgIHZhbHVlQ2hhbmdlU291bmRHZW5lcmF0b3JPcHRpb25zOiB7fSxcclxuXHJcbiAgICAgIC8vIHBoZXQtaW9cclxuICAgICAgdGFuZGVtOiBUYW5kZW0uUkVRVUlSRUQsXHJcbiAgICAgIHRhbmRlbU5hbWVTdWZmaXg6ICdDb250cm9sJyxcclxuICAgICAgcGhldGlvVHlwZTogTnVtYmVyQ29udHJvbC5OdW1iZXJDb250cm9sSU8sXHJcbiAgICAgIHBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZDogdHJ1ZSwgLy8gb3B0IGludG8gZGVmYXVsdCBQaEVULWlPIGluc3RydW1lbnRlZCBlbmFibGVkUHJvcGVydHlcclxuICAgICAgdmlzaWJsZVByb3BlcnR5T3B0aW9uczogeyBwaGV0aW9GZWF0dXJlZDogdHJ1ZSB9XHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyBBIGdyb3VwRm9jdXNIaWdobGlnaHQgaXMgb25seSBpbmNsdWRlZCBpZiB1c2luZyBhcnJvd0J1dHRvbnMuIFdoZW4gdGhlcmUgYXJlIGFycm93QnV0dG9ucyBpdCBpcyBpbXBvcnRhbnRcclxuICAgIC8vIHRvIGluZGljYXRlIHRoYXQgdGhlIHdob2xlIGNvbnRyb2wgaXMgb25seSBvbmUgc3RvcCBpbiB0aGUgdHJhdmVyc2FsIG9yZGVyLiBUaGlzIGlzIHNldCBieSBOdW1iZXJDb250cm9sLlxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaW5pdGlhbE9wdGlvbnMuZ3JvdXBGb2N1c0hpZ2hsaWdodCA9PT0gdW5kZWZpbmVkLCAnTnVtYmVyQ29udHJvbCBzZXRzIGdyb3VwRm9jdXNIaWdobGlnaHQnICk7XHJcblxyXG4gICAgc3VwZXIoKTtcclxuXHJcbiAgICAvLyBJZiB0aGUgYXJyb3cgYnV0dG9uIHNjYWxlIGlzIG5vdCBwcm92aWRlZCwgdGhlIGFycm93IGJ1dHRvbiBoZWlnaHQgd2lsbCBtYXRjaCB0aGUgbnVtYmVyIGRpc3BsYXkgaGVpZ2h0XHJcbiAgICBjb25zdCBhcnJvd0J1dHRvblNjYWxlUHJvdmlkZWQgPSBpbml0aWFsT3B0aW9ucy5hcnJvd0J1dHRvbk9wdGlvbnMgJiYgaW5pdGlhbE9wdGlvbnMuYXJyb3dCdXR0b25PcHRpb25zLmhhc093blByb3BlcnR5KCAnc2NhbGUnICk7XHJcblxyXG4gICAgY29uc3QgZ2V0Q3VycmVudFJhbmdlID0gKCkgPT4ge1xyXG4gICAgICByZXR1cm4gb3B0aW9ucy5lbmFibGVkUmFuZ2VQcm9wZXJ0eSA/IG9wdGlvbnMuZW5hYmxlZFJhbmdlUHJvcGVydHkudmFsdWUgOiBudW1iZXJSYW5nZTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gQ3JlYXRlIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG8gY29uc3RyYWluIHRoZSBzbGlkZXIgdmFsdWUgdG8gdGhlIHByb3ZpZGVkIHJhbmdlIGFuZCB0aGUgc2FtZSBkZWx0YSBhc1xyXG4gICAgLy8gdGhlIGFycm93IGJ1dHRvbnMsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS1waGV0L2lzc3Vlcy8zODQuXHJcbiAgICBjb25zdCBjb25zdHJhaW5WYWx1ZSA9ICggdmFsdWU6IG51bWJlciApID0+IHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5kZWx0YSAhPT0gdW5kZWZpbmVkICk7XHJcbiAgICAgIGNvbnN0IG5ld1ZhbHVlID0gVXRpbHMucm91bmRUb0ludGVydmFsKCB2YWx1ZSwgb3B0aW9ucy5kZWx0YSApO1xyXG4gICAgICByZXR1cm4gZ2V0Q3VycmVudFJhbmdlKCkuY29uc3RyYWluVmFsdWUoIG5ld1ZhbHVlICk7XHJcbiAgICB9O1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoXHJcbiAgICAgIGluaXRpYWxPcHRpb25zLnNvdW5kR2VuZXJhdG9yID09PSBERUZBVUxUX1NPVU5EIHx8IF8uaXNFbXB0eSggaW5pdGlhbE9wdGlvbnMudmFsdWVDaGFuZ2VTb3VuZEdlbmVyYXRvck9wdGlvbnMgKSxcclxuICAgICAgJ29wdGlvbnMgc2hvdWxkIG9ubHkgYmUgc3VwcGxpZWQgd2hlbiB1c2luZyBkZWZhdWx0IHNvdW5kIGdlbmVyYXRvcidcclxuICAgICk7XHJcblxyXG4gICAgLy8gSWYgbm8gc291bmQgZ2VuZXJhdG9yIHdhcyBwcm92aWRlZCwgY3JlYXRlIG9uZSB1c2luZyB0aGUgZGVmYXVsdCBjb25maWd1cmF0aW9uLlxyXG4gICAgaWYgKCBpbml0aWFsT3B0aW9ucy5zb3VuZEdlbmVyYXRvciA9PT0gREVGQVVMVF9TT1VORCApIHtcclxuICAgICAgbGV0IHZhbHVlQ2hhbmdlU291bmRHZW5lcmF0b3JPcHRpb25zID0gaW5pdGlhbE9wdGlvbnMudmFsdWVDaGFuZ2VTb3VuZEdlbmVyYXRvck9wdGlvbnM7XHJcbiAgICAgIGlmICggXy5pc0VtcHR5KCBpbml0aWFsT3B0aW9ucy52YWx1ZUNoYW5nZVNvdW5kR2VuZXJhdG9yT3B0aW9ucyApICkge1xyXG5cclxuICAgICAgICAvLyBJZiBubyBvcHRpb25zIHdlcmUgcHJvdmlkZWQgZm9yIHRoZSBWYWx1ZUNoYW5nZVNvdW5kR2VuZXJhdG9yLCB1c2UgYSBkZWZhdWx0IHdoZXJlIGEgc291bmQgd2lsbCBiZSBwcm9kdWNlZFxyXG4gICAgICAgIC8vIGZvciBldmVyeSB2YWxpZCB2YWx1ZSBzZXQgYnkgdGhpcyBjb250cm9sLlxyXG4gICAgICAgIHZhbHVlQ2hhbmdlU291bmRHZW5lcmF0b3JPcHRpb25zID0ge1xyXG4gICAgICAgICAgaW50ZXJUaHJlc2hvbGREZWx0YTogaW5pdGlhbE9wdGlvbnMuZGVsdGEsXHJcbiAgICAgICAgICBjb25zdHJhaW5WYWx1ZTogY29uc3RyYWluVmFsdWVcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICAgIGluaXRpYWxPcHRpb25zLnNvdW5kR2VuZXJhdG9yID0gbmV3IFZhbHVlQ2hhbmdlU291bmRQbGF5ZXIoXHJcbiAgICAgICAgbnVtYmVyUmFuZ2UsXHJcbiAgICAgICAgdmFsdWVDaGFuZ2VTb3VuZEdlbmVyYXRvck9wdGlvbnNcclxuICAgICAgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBpbml0aWFsT3B0aW9ucy5zb3VuZEdlbmVyYXRvciA9PT0gbnVsbCApIHtcclxuICAgICAgaW5pdGlhbE9wdGlvbnMuc291bmRHZW5lcmF0b3IgPSBWYWx1ZUNoYW5nZVNvdW5kUGxheWVyLk5PX1NPVU5EO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE1lcmdlIGFsbCBuZXN0ZWQgb3B0aW9ucyBpbiBvbmUgYmxvY2suXHJcbiAgICBjb25zdCBvcHRpb25zOiB0eXBlb2YgaW5pdGlhbE9wdGlvbnMgPSBjb21iaW5lT3B0aW9uczx0eXBlb2YgaW5pdGlhbE9wdGlvbnM+KCB7XHJcblxyXG4gICAgICAvLyBPcHRpb25zIHByb3BhZ2F0ZWQgdG8gQXJyb3dCdXR0b25cclxuICAgICAgYXJyb3dCdXR0b25PcHRpb25zOiB7XHJcblxyXG4gICAgICAgIC8vIFZhbHVlcyBjaG9zZW4gdG8gbWF0Y2ggcHJldmlvdXMgYmVoYXZpb3IsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS1waGV0L2lzc3Vlcy80ODkuXHJcbiAgICAgICAgLy8gdG91Y2hBcmVhWERpbGF0aW9uIGlzIDEvMiBvZiBpdHMgb3JpZ2luYWwgdmFsdWUgYmVjYXVzZSB0b3VjaEFyZWEgaXMgc2hpZnRlZC5cclxuICAgICAgICB0b3VjaEFyZWFYRGlsYXRpb246IDMuNSxcclxuICAgICAgICB0b3VjaEFyZWFZRGlsYXRpb246IDcsXHJcbiAgICAgICAgbW91c2VBcmVhWERpbGF0aW9uOiAwLFxyXG4gICAgICAgIG1vdXNlQXJlYVlEaWxhdGlvbjogMCxcclxuXHJcbiAgICAgICAgLy8gSWYgdGhlIHZhbHVlIGlzIHdpdGhpbiB0aGlzIGFtb3VudCBvZiB0aGUgcmVzcGVjdGl2ZSBtaW4vbWF4LCBpdCB3aWxsIGJlIHRyZWF0ZWQgYXMgaWYgaXQgd2FzIGF0IHRoYXQgdmFsdWVcclxuICAgICAgICAvLyAoZm9yIGRldGVybWluaW5nIHdoZXRoZXIgdGhlIGFycm93IGJ1dHRvbiBpcyBlbmFibGVkKS5cclxuICAgICAgICBlbmFibGVkRXBzaWxvbjogMCxcclxuXHJcbiAgICAgICAgLy8gY2FsbGJhY2tzXHJcbiAgICAgICAgbGVmdFN0YXJ0OiBpbml0aWFsT3B0aW9ucy5zdGFydENhbGxiYWNrLCAvLyBjYWxsZWQgd2hlbiBsZWZ0IGFycm93IGlzIHByZXNzZWRcclxuICAgICAgICBsZWZ0RW5kOiBpbml0aWFsT3B0aW9ucy5lbmRDYWxsYmFjaywgLy8gY2FsbGVkIHdoZW4gbGVmdCBhcnJvdyBpcyByZWxlYXNlZFxyXG4gICAgICAgIHJpZ2h0U3RhcnQ6IGluaXRpYWxPcHRpb25zLnN0YXJ0Q2FsbGJhY2ssIC8vIGNhbGxlZCB3aGVuIHJpZ2h0IGFycm93IGlzIHByZXNzZWRcclxuICAgICAgICByaWdodEVuZDogaW5pdGlhbE9wdGlvbnMuZW5kQ2FsbGJhY2ssIC8vIGNhbGxlZCB3aGVuIHJpZ2h0IGFycm93IGlzIHJlbGVhc2VkXHJcblxyXG4gICAgICAgIC8vIHBoZXQtaW9cclxuICAgICAgICBlbmFibGVkUHJvcGVydHlPcHRpb25zOiB7XHJcbiAgICAgICAgICBwaGV0aW9SZWFkT25seTogdHJ1ZSxcclxuICAgICAgICAgIHBoZXRpb0ZlYXR1cmVkOiBmYWxzZVxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIE9wdGlvbnMgcHJvcGFnYXRlZCB0byBTbGlkZXJcclxuICAgICAgc2xpZGVyT3B0aW9uczoge1xyXG4gICAgICAgIG9yaWVudGF0aW9uOiBPcmllbnRhdGlvbi5IT1JJWk9OVEFMLFxyXG4gICAgICAgIHN0YXJ0RHJhZzogaW5pdGlhbE9wdGlvbnMuc3RhcnRDYWxsYmFjaywgLy8gY2FsbGVkIHdoZW4gZHJhZ2dpbmcgc3RhcnRzIG9uIHRoZSBzbGlkZXJcclxuICAgICAgICBlbmREcmFnOiBpbml0aWFsT3B0aW9ucy5lbmRDYWxsYmFjaywgLy8gY2FsbGVkIHdoZW4gZHJhZ2dpbmcgZW5kcyBvbiB0aGUgc2xpZGVyXHJcblxyXG4gICAgICAgIC8vIFdpdGggdGhlIGV4Y2VwdGlvbiBvZiBzdGFydERyYWcgYW5kIGVuZERyYWcgKHVzZSBzdGFydENhbGxiYWNrIGFuZCBlbmRDYWxsYmFjayByZXNwZWN0aXZlbHkpLFxyXG4gICAgICAgIC8vIGFsbCBIU2xpZGVyIG9wdGlvbnMgbWF5IGJlIHVzZWQuIFRoZXNlIGFyZSB0aGUgb25lcyB0aGF0IE51bWJlckNvbnRyb2wgb3ZlcnJpZGVzOlxyXG4gICAgICAgIG1ham9yVGlja0xlbmd0aDogMjAsXHJcbiAgICAgICAgbWlub3JUaWNrU3Ryb2tlOiAncmdiYSggMCwgMCwgMCwgMC4zICknLFxyXG5cclxuICAgICAgICAvLyBvdGhlciBzbGlkZXIgb3B0aW9ucyB0aGF0IGFyZSBzcGVjaWZpYyB0byBOdW1iZXJDb250cm9sXHJcbiAgICAgICAgbWFqb3JUaWNrczogW10sXHJcbiAgICAgICAgbWlub3JUaWNrU3BhY2luZzogMCwgLy8gemVybyBpbmRpY2F0ZXMgbm8gbWlub3IgdGlja3NcclxuXHJcbiAgICAgICAgLy8gY29uc3RyYWluIHRoZSBzbGlkZXIgdmFsdWUgdG8gdGhlIHByb3ZpZGVkIHJhbmdlIGFuZCB0aGUgc2FtZSBkZWx0YSBhcyB0aGUgYXJyb3cgYnV0dG9ucyxcclxuICAgICAgICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnktcGhldC9pc3N1ZXMvMzg0XHJcbiAgICAgICAgY29uc3RyYWluVmFsdWU6IGNvbnN0cmFpblZhbHVlLFxyXG5cclxuICAgICAgICBzb3VuZEdlbmVyYXRvcjogaW5pdGlhbE9wdGlvbnMuc291bmRHZW5lcmF0b3IsXHJcblxyXG4gICAgICAgIC8vIHBoZXQtaW9cclxuICAgICAgICB0YW5kZW06IGluaXRpYWxPcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oIE51bWJlckNvbnRyb2wuU0xJREVSX1RBTkRFTV9OQU1FIClcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIE9wdGlvbnMgcHJvcGFnYXRlZCB0byBOdW1iZXJEaXNwbGF5XHJcbiAgICAgIG51bWJlckRpc3BsYXlPcHRpb25zOiB7XHJcbiAgICAgICAgdGV4dE9wdGlvbnM6IHtcclxuICAgICAgICAgIGZvbnQ6IG5ldyBQaGV0Rm9udCggMTIgKSxcclxuICAgICAgICAgIHN0cmluZ1Byb3BlcnR5T3B0aW9uczogeyBwaGV0aW9GZWF0dXJlZDogdHJ1ZSB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8gcGhldC1pb1xyXG4gICAgICAgIHRhbmRlbTogaW5pdGlhbE9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ251bWJlckRpc3BsYXknICksXHJcbiAgICAgICAgdmlzaWJsZVByb3BlcnR5T3B0aW9uczogeyBwaGV0aW9GZWF0dXJlZDogdHJ1ZSB9XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBPcHRpb25zIHByb3BhZ2F0ZWQgdG8gdGhlIHRpdGxlIFRleHQgTm9kZVxyXG4gICAgICB0aXRsZU5vZGVPcHRpb25zOiB7XHJcbiAgICAgICAgZm9udDogbmV3IFBoZXRGb250KCAxMiApLFxyXG4gICAgICAgIG1heFdpZHRoOiBudWxsLCAvLyB7bnVsbHxudW1iZXJ9IG1heFdpZHRoIHRvIHVzZSBmb3IgdGl0bGUsIHRvIGNvbnN0cmFpbiB3aWR0aCBmb3IgaTE4blxyXG4gICAgICAgIGZpbGw6ICdibGFjaycsXHJcbiAgICAgICAgdGFuZGVtOiBpbml0aWFsT3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAndGl0bGVUZXh0JyApXHJcbiAgICAgIH1cclxuICAgIH0sIGluaXRpYWxPcHRpb25zICk7XHJcblxyXG4gICAgLy8gdmFsaWRhdGUgb3B0aW9uc1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggISggb3B0aW9ucyBhcyBJbnRlbnRpb25hbEFueSApLnN0YXJ0RHJhZywgJ3VzZSBvcHRpb25zLnN0YXJ0Q2FsbGJhY2sgaW5zdGVhZCBvZiBvcHRpb25zLnN0YXJ0RHJhZycgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICEoIG9wdGlvbnMgYXMgSW50ZW50aW9uYWxBbnkgKS5lbmREcmFnLCAndXNlIG9wdGlvbnMuZW5kQ2FsbGJhY2sgaW5zdGVhZCBvZiBvcHRpb25zLmVuZERyYWcnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhb3B0aW9ucy50YWdOYW1lLFxyXG4gICAgICAnUHJvdmlkZSBhY2Nlc3NpYmlsaXR5IHRocm91Z2ggb3B0aW9ucy5zbGlkZXJPcHRpb25zIHdoaWNoIHdpbGwgYmUgYXBwbGllZCB0byB0aGUgTnVtYmVyQ29udHJvbCBOb2RlLicgKTtcclxuXHJcbiAgICBpZiAoIG9wdGlvbnMuZW5hYmxlZFJhbmdlUHJvcGVydHkgKSB7XHJcbiAgICAgIG9wdGlvbnMuc2xpZGVyT3B0aW9ucy5lbmFibGVkUmFuZ2VQcm9wZXJ0eSA9IG9wdGlvbnMuZW5hYmxlZFJhbmdlUHJvcGVydHk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcGRvbSAtIGZvciBhbHRlcm5hdGl2ZSBpbnB1dCwgdGhlIG51bWJlciBjb250cm9sIGlzIGFjY2Vzc2VkIGVudGlyZWx5IHRocm91Z2ggc2xpZGVyIGludGVyYWN0aW9uIGFuZCB0aGVzZVxyXG4gICAgLy8gYXJyb3cgYnV0dG9ucyBhcmUgbm90IHRhYiBuYXZpZ2FibGVcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG9wdGlvbnMuYXJyb3dCdXR0b25PcHRpb25zLnRhZ05hbWUgPT09IHVuZGVmaW5lZCxcclxuICAgICAgJ051bWJlckNvbnRyb2xcXCdzIGFjY2Vzc2libGUgY29udGVudCBpcyBqdXN0IHRoZSBzbGlkZXIsIGRvIG5vdCBzZXQgYWNjZXNzaWJsZSBjb250ZW50IG9uIHRoZSBidXR0b25zLiBJbnN0ZWFkICcgK1xyXG4gICAgICAnc2V0IGExMXkgdGhyb3VnaCBvcHRpb25zLnNsaWRlck9wdGlvbnMuJyApO1xyXG4gICAgb3B0aW9ucy5hcnJvd0J1dHRvbk9wdGlvbnMudGFnTmFtZSA9IG51bGw7XHJcblxyXG4gICAgLy8gcGRvbSAtIGlmIHdlIGluY2x1ZGUgYXJyb3cgYnV0dG9ucywgdXNlIGEgZ3JvdXBGb2N1c0hpZ2hsaWdodCB0byBzdXJyb3VuZCB0aGUgTnVtYmVyQ29udHJvbCB0byBtYWtlIGl0IGNsZWFyXHJcbiAgICAvLyB0aGF0IGl0IGlzIGEgY29tcG9zaXRlIGNvbXBvbmVudCBhbmQgdGhlcmUgaXMgb25seSBvbmUgc3RvcCBpbiB0aGUgdHJhdmVyc2FsIG9yZGVyLlxyXG4gICAgdGhpcy5ncm91cEZvY3VzSGlnaGxpZ2h0ID0gb3B0aW9ucy5pbmNsdWRlQXJyb3dCdXR0b25zO1xyXG5cclxuICAgIC8vIFNsaWRlciBvcHRpb25zIGZvciB0cmFjayAoaWYgbm90IHNwZWNpZmllZCBhcyB0cmFja05vZGUpXHJcbiAgICBpZiAoICFvcHRpb25zLnNsaWRlck9wdGlvbnMudHJhY2tOb2RlICkge1xyXG4gICAgICBvcHRpb25zLnNsaWRlck9wdGlvbnMgPSBjb21iaW5lT3B0aW9uczxOdW1iZXJDb250cm9sU2xpZGVyT3B0aW9ucz4oIHtcclxuICAgICAgICB0cmFja1NpemU6ICggb3B0aW9ucy5zbGlkZXJPcHRpb25zLm9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5IT1JJWk9OVEFMICkgPyBERUZBVUxUX0hTTElERVJfVFJBQ0tfU0laRSA6IERFRkFVTFRfSFNMSURFUl9UUkFDS19TSVpFLnN3YXBwZWQoKVxyXG4gICAgICB9LCBvcHRpb25zLnNsaWRlck9wdGlvbnMgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTbGlkZXIgb3B0aW9ucyBmb3IgdGh1bWIgKGlmIG4gb3Qgc3BlY2lmaWVkIGFzIHRodW1iTm9kZSlcclxuICAgIGlmICggIW9wdGlvbnMuc2xpZGVyT3B0aW9ucy50aHVtYk5vZGUgKSB7XHJcbiAgICAgIG9wdGlvbnMuc2xpZGVyT3B0aW9ucyA9IGNvbWJpbmVPcHRpb25zPE51bWJlckNvbnRyb2xTbGlkZXJPcHRpb25zPigge1xyXG4gICAgICAgIHRodW1iU2l6ZTogKCBvcHRpb25zLnNsaWRlck9wdGlvbnMub3JpZW50YXRpb24gPT09IE9yaWVudGF0aW9uLkhPUklaT05UQUwgKSA/IERFRkFVTFRfSFNMSURFUl9USFVNQl9TSVpFIDogREVGQVVMVF9IU0xJREVSX1RIVU1CX1NJWkUuc3dhcHBlZCgpLFxyXG4gICAgICAgIHRodW1iVG91Y2hBcmVhWERpbGF0aW9uOiA2XHJcbiAgICAgIH0sIG9wdGlvbnMuc2xpZGVyT3B0aW9ucyApO1xyXG4gICAgfVxyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFvcHRpb25zLnNsaWRlck9wdGlvbnMuaGFzT3duUHJvcGVydHkoICdwaGV0aW9UeXBlJyApLCAnTnVtYmVyQ29udHJvbCBzZXRzIHBoZXRpb1R5cGUnICk7XHJcblxyXG4gICAgLy8gc2xpZGVyIG9wdGlvbnMgc2V0IGJ5IE51bWJlckNvbnRyb2wsIG5vdGUgdGhpcyBtYXkgbm90IGJlIHRoZSBsb25nIHRlcm0gcGF0dGVybiwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWluZm8vaXNzdWVzLzk2XHJcbiAgICBvcHRpb25zLnNsaWRlck9wdGlvbnMgPSBjb21iaW5lT3B0aW9uczxOdW1iZXJDb250cm9sU2xpZGVyT3B0aW9ucz4oIHtcclxuXHJcbiAgICAgIC8vIHBkb20gLSBieSBkZWZhdWx0LCBzaGlmdEtleWJvYXJkU3RlcCBzaG91bGQgbW9zdCBsaWtlbHkgYmUgdGhlIHNhbWUgYXMgY2xpY2tpbmcgdGhlIGFycm93IGJ1dHRvbnMuXHJcbiAgICAgIHNoaWZ0S2V5Ym9hcmRTdGVwOiBvcHRpb25zLmRlbHRhLFxyXG5cclxuICAgICAgLy8gTWFrZSBzdXJlIFNsaWRlciBnZXRzIGNyZWF0ZWQgd2l0aCB0aGUgcmlnaHQgSU9UeXBlXHJcbiAgICAgIHBoZXRpb1R5cGU6IFNsaWRlci5TbGlkZXJJT1xyXG4gICAgfSwgb3B0aW9ucy5zbGlkZXJPcHRpb25zICk7XHJcblxyXG4gICAgLy8gaGlnaGxpZ2h0IGNvbG9yIGZvciB0aHVtYiBkZWZhdWx0cyB0byBhIGJyaWdodGVyIHZlcnNpb24gb2YgdGhlIHRodW1iIGNvbG9yXHJcbiAgICBpZiAoIG9wdGlvbnMuc2xpZGVyT3B0aW9ucy50aHVtYkZpbGwgJiYgIW9wdGlvbnMuc2xpZGVyT3B0aW9ucy50aHVtYkZpbGxIaWdobGlnaHRlZCApIHtcclxuXHJcbiAgICAgIHRoaXMudGh1bWJGaWxsUHJvcGVydHkgPSBuZXcgUGFpbnRDb2xvclByb3BlcnR5KCBvcHRpb25zLnNsaWRlck9wdGlvbnMudGh1bWJGaWxsICk7XHJcblxyXG4gICAgICAvLyBSZWZlcmVuY2UgdG8gdGhlIERlcml2ZWRQcm9wZXJ0eSBub3QgbmVlZGVkLCBzaW5jZSB3ZSBkaXNwb3NlIHdoYXQgaXQgbGlzdGVucyB0byBhYm92ZS5cclxuICAgICAgb3B0aW9ucy5zbGlkZXJPcHRpb25zLnRodW1iRmlsbEhpZ2hsaWdodGVkID0gbmV3IERlcml2ZWRQcm9wZXJ0eSggWyB0aGlzLnRodW1iRmlsbFByb3BlcnR5IF0sIGNvbG9yID0+IGNvbG9yLmJyaWdodGVyQ29sb3IoKSApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRpdGxlTm9kZSA9IG5ldyBUZXh0KCB0aXRsZSwgb3B0aW9ucy50aXRsZU5vZGVPcHRpb25zICk7XHJcblxyXG4gICAgY29uc3QgbnVtYmVyRGlzcGxheSA9IG5ldyBOdW1iZXJEaXNwbGF5KCBudW1iZXJQcm9wZXJ0eSwgbnVtYmVyUmFuZ2UsIG9wdGlvbnMubnVtYmVyRGlzcGxheU9wdGlvbnMgKTtcclxuXHJcbiAgICB0aGlzLnNsaWRlciA9IG5ldyBTbGlkZXIoIG51bWJlclByb3BlcnR5LCBudW1iZXJSYW5nZSwgb3B0aW9ucy5zbGlkZXJPcHRpb25zICk7XHJcblxyXG4gICAgLy8gc2V0IGJlbG93LCBzZWUgb3B0aW9ucy5pbmNsdWRlQXJyb3dCdXR0b25zXHJcbiAgICBsZXQgZGVjcmVtZW50QnV0dG9uOiBBcnJvd0J1dHRvbiB8IG51bGwgPSBudWxsO1xyXG4gICAgbGV0IGluY3JlbWVudEJ1dHRvbjogQXJyb3dCdXR0b24gfCBudWxsID0gbnVsbDtcclxuICAgIGxldCBhcnJvd0VuYWJsZWRMaXN0ZW5lcjogKCAoKSA9PiB2b2lkICkgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgICBpZiAoIG9wdGlvbnMuaW5jbHVkZUFycm93QnV0dG9ucyApIHtcclxuXHJcbiAgICAgIGNvbnN0IHRvdWNoQXJlYVhEaWxhdGlvbiA9IG9wdGlvbnMuYXJyb3dCdXR0b25PcHRpb25zLnRvdWNoQXJlYVhEaWxhdGlvbiE7XHJcbiAgICAgIGNvbnN0IG1vdXNlQXJlYVhEaWxhdGlvbiA9IG9wdGlvbnMuYXJyb3dCdXR0b25PcHRpb25zLm1vdXNlQXJlYVhEaWxhdGlvbiE7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRvdWNoQXJlYVhEaWxhdGlvbiAhPT0gdW5kZWZpbmVkICYmIG1vdXNlQXJlYVhEaWxhdGlvbiAhPT0gdW5kZWZpbmVkLFxyXG4gICAgICAgICdTaG91bGQgYmUgZGVmaW5lZCwgc2luY2Ugd2UgaGF2ZSBkZWZhdWx0cyBhYm92ZScgKTtcclxuXHJcbiAgICAgIGRlY3JlbWVudEJ1dHRvbiA9IG5ldyBBcnJvd0J1dHRvbiggJ2xlZnQnLCAoKSA9PiB7XHJcbiAgICAgICAgY29uc3Qgb2xkVmFsdWUgPSBudW1iZXJQcm9wZXJ0eS5nZXQoKTtcclxuICAgICAgICBsZXQgbmV3VmFsdWUgPSBudW1iZXJQcm9wZXJ0eS5nZXQoKSAtIG9wdGlvbnMuZGVsdGE7XHJcbiAgICAgICAgbmV3VmFsdWUgPSBVdGlscy5yb3VuZFRvSW50ZXJ2YWwoIG5ld1ZhbHVlLCBvcHRpb25zLmRlbHRhICk7IC8vIGNvbnN0cmFpbiB0byBtdWx0aXBsZXMgb2YgZGVsdGEsIHNlZSAjMzg0XHJcbiAgICAgICAgbmV3VmFsdWUgPSBNYXRoLm1heCggbmV3VmFsdWUsIGdldEN1cnJlbnRSYW5nZSgpLm1pbiApOyAvLyBjb25zdHJhaW4gdG8gcmFuZ2VcclxuICAgICAgICBudW1iZXJQcm9wZXJ0eS5zZXQoIG5ld1ZhbHVlICk7XHJcbiAgICAgICAgb3B0aW9ucy5zb3VuZEdlbmVyYXRvciEucGxheVNvdW5kRm9yVmFsdWVDaGFuZ2UoIG5ld1ZhbHVlLCBvbGRWYWx1ZSApO1xyXG4gICAgICAgIHRoaXMuc2xpZGVyLnZvaWNpbmdPbkVuZFJlc3BvbnNlKCBvbGRWYWx1ZSApO1xyXG4gICAgICB9LCBjb21iaW5lT3B0aW9uczxBcnJvd0J1dHRvbk9wdGlvbnM+KCB7XHJcbiAgICAgICAgc291bmRQbGF5ZXI6IG51bGxTb3VuZFBsYXllcixcclxuICAgICAgICBzdGFydENhbGxiYWNrOiBvcHRpb25zLmFycm93QnV0dG9uT3B0aW9ucy5sZWZ0U3RhcnQsXHJcbiAgICAgICAgZW5kQ2FsbGJhY2s6IG9wdGlvbnMuYXJyb3dCdXR0b25PcHRpb25zLmxlZnRFbmQsXHJcbiAgICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdkZWNyZW1lbnRCdXR0b24nICksXHJcbiAgICAgICAgdG91Y2hBcmVhWFNoaWZ0OiAtdG91Y2hBcmVhWERpbGF0aW9uLFxyXG4gICAgICAgIG1vdXNlQXJlYVhTaGlmdDogLW1vdXNlQXJlYVhEaWxhdGlvblxyXG4gICAgICB9LCBvcHRpb25zLmFycm93QnV0dG9uT3B0aW9ucyApICk7XHJcblxyXG4gICAgICBpbmNyZW1lbnRCdXR0b24gPSBuZXcgQXJyb3dCdXR0b24oICdyaWdodCcsICgpID0+IHtcclxuICAgICAgICBjb25zdCBvbGRWYWx1ZSA9IG51bWJlclByb3BlcnR5LmdldCgpO1xyXG4gICAgICAgIGxldCBuZXdWYWx1ZSA9IG51bWJlclByb3BlcnR5LmdldCgpICsgb3B0aW9ucy5kZWx0YTtcclxuICAgICAgICBuZXdWYWx1ZSA9IFV0aWxzLnJvdW5kVG9JbnRlcnZhbCggbmV3VmFsdWUsIG9wdGlvbnMuZGVsdGEgKTsgLy8gY29uc3RyYWluIHRvIG11bHRpcGxlcyBvZiBkZWx0YSwgc2VlICMzODRcclxuICAgICAgICBuZXdWYWx1ZSA9IE1hdGgubWluKCBuZXdWYWx1ZSwgZ2V0Q3VycmVudFJhbmdlKCkubWF4ICk7IC8vIGNvbnN0cmFpbiB0byByYW5nZVxyXG4gICAgICAgIG51bWJlclByb3BlcnR5LnNldCggbmV3VmFsdWUgKTtcclxuICAgICAgICBvcHRpb25zLnNvdW5kR2VuZXJhdG9yIS5wbGF5U291bmRGb3JWYWx1ZUNoYW5nZSggbmV3VmFsdWUsIG9sZFZhbHVlICk7XHJcbiAgICAgICAgdGhpcy5zbGlkZXIudm9pY2luZ09uRW5kUmVzcG9uc2UoIG9sZFZhbHVlICk7XHJcbiAgICAgIH0sIGNvbWJpbmVPcHRpb25zPEFycm93QnV0dG9uT3B0aW9ucz4oIHtcclxuICAgICAgICBzb3VuZFBsYXllcjogbnVsbFNvdW5kUGxheWVyLFxyXG4gICAgICAgIHN0YXJ0Q2FsbGJhY2s6IG9wdGlvbnMuYXJyb3dCdXR0b25PcHRpb25zLnJpZ2h0U3RhcnQsXHJcbiAgICAgICAgZW5kQ2FsbGJhY2s6IG9wdGlvbnMuYXJyb3dCdXR0b25PcHRpb25zLnJpZ2h0RW5kLFxyXG4gICAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAnaW5jcmVtZW50QnV0dG9uJyApLFxyXG4gICAgICAgIHRvdWNoQXJlYVhTaGlmdDogdG91Y2hBcmVhWERpbGF0aW9uLFxyXG4gICAgICAgIG1vdXNlQXJlYVhTaGlmdDogbW91c2VBcmVhWERpbGF0aW9uXHJcbiAgICAgIH0sIG9wdGlvbnMuYXJyb3dCdXR0b25PcHRpb25zICkgKTtcclxuXHJcbiAgICAgIC8vIEJ5IGRlZmF1bHQsIHNjYWxlIHRoZSBBcnJvd0J1dHRvbnMgdG8gaGF2ZSB0aGUgc2FtZSBoZWlnaHQgYXMgdGhlIE51bWJlckRpc3BsYXksIGJ1dCBpZ25vcmluZ1xyXG4gICAgICAvLyB0aGUgTnVtYmVyRGlzcGxheSdzIG1heFdpZHRoIChpZiBhbnkpXHJcbiAgICAgIGlmICggIWFycm93QnV0dG9uU2NhbGVQcm92aWRlZCApIHtcclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlIHRoZSBjdXJyZW50IGJ1dHRvbiBzY2FsaW5nIHNvIHdlIGNhbiBkZXRlcm1pbmUgdGhlIGRlc2lyZWQgZmluYWwgc2NhbGUgZmFjdG9yXHJcbiAgICAgICAgZGVjcmVtZW50QnV0dG9uLnNldFNjYWxlTWFnbml0dWRlKCAxICk7XHJcblxyXG4gICAgICAgIC8vIFNldCB0aGUgdHdlYWtlciBidXR0b24gaGVpZ2h0IHRvIG1hdGNoIHRoZSBoZWlnaHQgb2YgdGhlIG51bWJlckRpc3BsYXkuIExlbmd0aHkgdGV4dCBjYW4gc2hyaW5rIGEgbnVtYmVyRGlzcGxheVxyXG4gICAgICAgIC8vIHdpdGggbWF4V2lkdGgtLWlmIHdlIG1hdGNoIHRoZSBzY2FsZWQgaGVpZ2h0IG9mIHRoZSBudW1iZXJEaXNwbGF5IHRoZSBhcnJvdyBidXR0b25zIHdvdWxkIHNocmluayB0b28sIGFzXHJcbiAgICAgICAgLy8gZGVwaWN0ZWQgaW4gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnktcGhldC9pc3N1ZXMvNTEzI2lzc3VlY29tbWVudC01MTc4OTc4NTBcclxuICAgICAgICAvLyBJbnN0ZWFkLCB0byBrZWVwIHRoZSB0d2Vha2VyIGJ1dHRvbnMgYSB1bmlmb3JtIGFuZCByZWFzb25hYmxlIHNpemUsIHdlIG1hdGNoIHRoZWlyIGhlaWdodCB0byB0aGUgdW5zY2FsZWRcclxuICAgICAgICAvLyBoZWlnaHQgb2YgdGhlIG51bWJlckRpc3BsYXkgKGlnbm9yZXMgbWF4V2lkdGggYW5kIHNjYWxlKS5cclxuICAgICAgICBjb25zdCBudW1iZXJEaXNwbGF5SGVpZ2h0ID0gbnVtYmVyRGlzcGxheS5sb2NhbEJvdW5kcy5oZWlnaHQ7XHJcbiAgICAgICAgY29uc3QgYXJyb3dCdXR0b25zU2NhbGUgPSBudW1iZXJEaXNwbGF5SGVpZ2h0IC8gZGVjcmVtZW50QnV0dG9uLmhlaWdodDtcclxuXHJcbiAgICAgICAgZGVjcmVtZW50QnV0dG9uLnNldFNjYWxlTWFnbml0dWRlKCBhcnJvd0J1dHRvbnNTY2FsZSApO1xyXG4gICAgICAgIGluY3JlbWVudEJ1dHRvbi5zZXRTY2FsZU1hZ25pdHVkZSggYXJyb3dCdXR0b25zU2NhbGUgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gRGlzYWJsZSB0aGUgYXJyb3cgYnV0dG9ucyBpZiB0aGUgc2xpZGVyIGN1cnJlbnRseSBoYXMgZm9jdXNcclxuICAgICAgYXJyb3dFbmFibGVkTGlzdGVuZXIgPSAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBudW1iZXJQcm9wZXJ0eS52YWx1ZTtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLmFycm93QnV0dG9uT3B0aW9ucy5lbmFibGVkRXBzaWxvbiAhPT0gdW5kZWZpbmVkICk7XHJcbiAgICAgICAgZGVjcmVtZW50QnV0dG9uIS5lbmFibGVkID0gKCB2YWx1ZSAtIG9wdGlvbnMuYXJyb3dCdXR0b25PcHRpb25zLmVuYWJsZWRFcHNpbG9uISA+IGdldEN1cnJlbnRSYW5nZSgpLm1pbiAmJiAhdGhpcy5zbGlkZXIuaXNGb2N1c2VkKCkgKTtcclxuICAgICAgICBpbmNyZW1lbnRCdXR0b24hLmVuYWJsZWQgPSAoIHZhbHVlICsgb3B0aW9ucy5hcnJvd0J1dHRvbk9wdGlvbnMuZW5hYmxlZEVwc2lsb24hIDwgZ2V0Q3VycmVudFJhbmdlKCkubWF4ICYmICF0aGlzLnNsaWRlci5pc0ZvY3VzZWQoKSApO1xyXG4gICAgICB9O1xyXG4gICAgICBudW1iZXJQcm9wZXJ0eS5sYXp5TGluayggYXJyb3dFbmFibGVkTGlzdGVuZXIgKTtcclxuICAgICAgb3B0aW9ucy5lbmFibGVkUmFuZ2VQcm9wZXJ0eSAmJiBvcHRpb25zLmVuYWJsZWRSYW5nZVByb3BlcnR5LmxhenlMaW5rKCBhcnJvd0VuYWJsZWRMaXN0ZW5lciApO1xyXG4gICAgICBhcnJvd0VuYWJsZWRMaXN0ZW5lcigpO1xyXG5cclxuICAgICAgdGhpcy5zbGlkZXIuYWRkSW5wdXRMaXN0ZW5lcigge1xyXG4gICAgICAgIGZvY3VzOiAoKSA9PiB7XHJcbiAgICAgICAgICBkZWNyZW1lbnRCdXR0b24hLmVuYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICAgIGluY3JlbWVudEJ1dHRvbiEuZW5hYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYmx1cjogKCkgPT4gYXJyb3dFbmFibGVkTGlzdGVuZXIhKCkgLy8gcmVjb21wdXRlIGlmIHRoZSBhcnJvdyBidXR0b25zIHNob3VsZCBiZSBlbmFibGVkXHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBtYWpvciB0aWNrcyBmb3IgdGhlIHNsaWRlclxyXG4gICAgY29uc3QgbWFqb3JUaWNrcyA9IG9wdGlvbnMuc2xpZGVyT3B0aW9ucy5tYWpvclRpY2tzITtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG1ham9yVGlja3MgKTtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IG1ham9yVGlja3MubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIHRoaXMuc2xpZGVyLmFkZE1ham9yVGljayggbWFqb3JUaWNrc1sgaSBdLnZhbHVlLCBtYWpvclRpY2tzWyBpIF0ubGFiZWwgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBtaW5vciB0aWNrcywgZXhjbHVkZSB2YWx1ZXMgd2hlcmUgd2UgYWxyZWFkeSBoYXZlIG1ham9yIHRpY2tzXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLnNsaWRlck9wdGlvbnMubWlub3JUaWNrU3BhY2luZyAhPT0gdW5kZWZpbmVkICk7XHJcbiAgICBpZiAoIG9wdGlvbnMuc2xpZGVyT3B0aW9ucy5taW5vclRpY2tTcGFjaW5nISA+IDAgKSB7XHJcbiAgICAgIGZvciAoIGxldCBtaW5vclRpY2tWYWx1ZSA9IG51bWJlclJhbmdlLm1pbjsgbWlub3JUaWNrVmFsdWUgPD0gbnVtYmVyUmFuZ2UubWF4OyApIHtcclxuICAgICAgICBpZiAoICFfLmZpbmQoIG1ham9yVGlja3MsIG1ham9yVGljayA9PiBtYWpvclRpY2sudmFsdWUgPT09IG1pbm9yVGlja1ZhbHVlICkgKSB7XHJcbiAgICAgICAgICB0aGlzLnNsaWRlci5hZGRNaW5vclRpY2soIG1pbm9yVGlja1ZhbHVlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG1pbm9yVGlja1ZhbHVlICs9IG9wdGlvbnMuc2xpZGVyT3B0aW9ucy5taW5vclRpY2tTcGFjaW5nITtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNoaWxkID0gb3B0aW9ucy5sYXlvdXRGdW5jdGlvbiggdGl0bGVOb2RlLCBudW1iZXJEaXNwbGF5LCB0aGlzLnNsaWRlciwgZGVjcmVtZW50QnV0dG9uLCBpbmNyZW1lbnRCdXR0b24gKTtcclxuXHJcbiAgICAvLyBTZXQgdXAgZGVmYXVsdCBzaXphYmlsaXR5XHJcbiAgICB0aGlzLndpZHRoU2l6YWJsZSA9IGlzV2lkdGhTaXphYmxlKCBjaGlsZCApO1xyXG5cclxuICAgIC8vIEZvcndhcmQgbWluaW11bS9wcmVmZXJyZWQgd2lkdGggUHJvcGVydGllcyB0byB0aGUgY2hpbGQsIHNvIGVhY2ggbGF5b3V0IGlzIHJlc3BvbnNpYmxlIGZvciBpdHMgZHluYW1pYyBsYXlvdXRcclxuICAgIGlmICggZXh0ZW5kc1dpZHRoU2l6YWJsZSggY2hpbGQgKSApIHtcclxuICAgICAgY29uc3QgbWluaW11bUxpc3RlbmVyID0gKCBtaW5pbXVtV2lkdGg6IG51bWJlciB8IG51bGwgKSA9PiB7XHJcbiAgICAgICAgdGhpcy5sb2NhbE1pbmltdW1XaWR0aCA9IG1pbmltdW1XaWR0aDtcclxuICAgICAgfTtcclxuICAgICAgY2hpbGQubWluaW11bVdpZHRoUHJvcGVydHkubGluayggbWluaW11bUxpc3RlbmVyICk7XHJcblxyXG4gICAgICBjb25zdCBwcmVmZXJyZWRMaXN0ZW5lciA9ICggbG9jYWxQcmVmZXJyZWRXaWR0aDogbnVtYmVyIHwgbnVsbCApID0+IHtcclxuICAgICAgICBjaGlsZC5wcmVmZXJyZWRXaWR0aCA9IGxvY2FsUHJlZmVycmVkV2lkdGg7XHJcbiAgICAgIH07XHJcbiAgICAgIHRoaXMubG9jYWxQcmVmZXJyZWRXaWR0aFByb3BlcnR5LmxpbmsoIHByZWZlcnJlZExpc3RlbmVyICk7XHJcblxyXG4gICAgICB0aGlzLmRpc3Bvc2VFbWl0dGVyLmFkZExpc3RlbmVyKCAoKSA9PiB7XHJcbiAgICAgICAgY2hpbGQubWluaW11bVdpZHRoUHJvcGVydHkudW5saW5rKCBtaW5pbXVtTGlzdGVuZXIgKTtcclxuICAgICAgICB0aGlzLmxvY2FsUHJlZmVycmVkV2lkdGhQcm9wZXJ0eS51bmxpbmsoIHByZWZlcnJlZExpc3RlbmVyICk7XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuXHJcbiAgICBvcHRpb25zLmNoaWxkcmVuID0gWyBjaGlsZCBdO1xyXG5cclxuICAgIHRoaXMubXV0YXRlKCBvcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy5udW1iZXJEaXNwbGF5ID0gbnVtYmVyRGlzcGxheTtcclxuXHJcbiAgICB0aGlzLmRpc3Bvc2VOdW1iZXJDb250cm9sID0gKCkgPT4ge1xyXG4gICAgICB0aXRsZU5vZGUuZGlzcG9zZSgpOyAvLyBtYXkgYmUgbGlua2VkIHRvIGEgc3RyaW5nIFByb3BlcnR5XHJcbiAgICAgIG51bWJlckRpc3BsYXkuZGlzcG9zZSgpO1xyXG4gICAgICB0aGlzLnNsaWRlci5kaXNwb3NlKCk7XHJcblxyXG4gICAgICB0aGlzLnRodW1iRmlsbFByb3BlcnR5ICYmIHRoaXMudGh1bWJGaWxsUHJvcGVydHkuZGlzcG9zZSgpO1xyXG5cclxuICAgICAgLy8gb25seSBkZWZpbmVkIGlmIG9wdGlvbnMuaW5jbHVkZUFycm93QnV0dG9uc1xyXG4gICAgICBkZWNyZW1lbnRCdXR0b24gJiYgZGVjcmVtZW50QnV0dG9uLmRpc3Bvc2UoKTtcclxuICAgICAgaW5jcmVtZW50QnV0dG9uICYmIGluY3JlbWVudEJ1dHRvbi5kaXNwb3NlKCk7XHJcbiAgICAgIGFycm93RW5hYmxlZExpc3RlbmVyICYmIG51bWJlclByb3BlcnR5LnVubGluayggYXJyb3dFbmFibGVkTGlzdGVuZXIgKTtcclxuICAgICAgYXJyb3dFbmFibGVkTGlzdGVuZXIgJiYgb3B0aW9ucy5lbmFibGVkUmFuZ2VQcm9wZXJ0eSAmJiBvcHRpb25zLmVuYWJsZWRSYW5nZVByb3BlcnR5LnVubGluayggYXJyb3dFbmFibGVkTGlzdGVuZXIgKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gc3VwcG9ydCBmb3IgYmluZGVyIGRvY3VtZW50YXRpb24sIHN0cmlwcGVkIG91dCBpbiBidWlsZHMgYW5kIG9ubHkgcnVucyB3aGVuID9iaW5kZXIgaXMgc3BlY2lmaWVkXHJcbiAgICBhc3NlcnQgJiYgcGhldD8uY2hpcHBlcj8ucXVlcnlQYXJhbWV0ZXJzPy5iaW5kZXIgJiYgSW5zdGFuY2VSZWdpc3RyeS5yZWdpc3RlckRhdGFVUkwoICdzY2VuZXJ5LXBoZXQnLCAnTnVtYmVyQ29udHJvbCcsIHRoaXMgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5kaXNwb3NlTnVtYmVyQ29udHJvbCgpO1xyXG4gICAgc3VwZXIuZGlzcG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIE51bWJlckNvbnRyb2wgd2l0aCBkZWZhdWx0IHRpY2sgbWFya3MgZm9yIG1pbiBhbmQgbWF4IHZhbHVlcy5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHdpdGhNaW5NYXhUaWNrcyggbGFiZWw6IHN0cmluZywgcHJvcGVydHk6IFByb3BlcnR5PG51bWJlcj4sIHJhbmdlOiBSYW5nZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvdmlkZWRPcHRpb25zPzogV2l0aE1pbk1heE9wdGlvbnMgKTogTnVtYmVyQ29udHJvbCB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxXaXRoTWluTWF4T3B0aW9ucywgV2l0aE1pbk1heFNlbGZPcHRpb25zLCBOdW1iZXJDb250cm9sT3B0aW9ucz4oKSgge1xyXG4gICAgICB0aWNrTGFiZWxGb250OiBuZXcgUGhldEZvbnQoIDEyIClcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIG9wdGlvbnMuc2xpZGVyT3B0aW9ucyA9IGNvbWJpbmVPcHRpb25zPE51bWJlckNvbnRyb2xTbGlkZXJPcHRpb25zPigge1xyXG4gICAgICBtYWpvclRpY2tzOiBbXHJcbiAgICAgICAgeyB2YWx1ZTogcmFuZ2UubWluLCBsYWJlbDogbmV3IFRleHQoIHJhbmdlLm1pbiwgeyBmb250OiBvcHRpb25zLnRpY2tMYWJlbEZvbnQgfSApIH0sXHJcbiAgICAgICAgeyB2YWx1ZTogcmFuZ2UubWF4LCBsYWJlbDogbmV3IFRleHQoIHJhbmdlLm1heCwgeyBmb250OiBvcHRpb25zLnRpY2tMYWJlbEZvbnQgfSApIH1cclxuICAgICAgXVxyXG4gICAgfSwgb3B0aW9ucy5zbGlkZXJPcHRpb25zICk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBOdW1iZXJDb250cm9sKCBsYWJlbCwgcHJvcGVydHksIHJhbmdlLCBvcHRpb25zICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIG9uZSBvZiB0aGUgcHJlLWRlZmluZWQgbGF5b3V0IGZ1bmN0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIGZvciBvcHRpb25zLmxheW91dEZ1bmN0aW9uLlxyXG4gICAqIEFycmFuZ2VzIHN1YmNvbXBvbmVudHMgbGlrZSB0aGlzOlxyXG4gICAqXHJcbiAgICogIHRpdGxlIG51bWJlclxyXG4gICAqICA8IC0tLS0tLXwtLS0tLS0gPlxyXG4gICAqXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBjcmVhdGVMYXlvdXRGdW5jdGlvbjEoIHByb3ZpZGVkT3B0aW9ucz86IE51bWJlckNvbnRyb2xMYXlvdXRGdW5jdGlvbjFPcHRpb25zICk6IExheW91dEZ1bmN0aW9uIHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPE51bWJlckNvbnRyb2xMYXlvdXRGdW5jdGlvbjFPcHRpb25zPigpKCB7XHJcbiAgICAgIGFsaWduOiAnY2VudGVyJyxcclxuICAgICAgdGl0bGVYU3BhY2luZzogNSxcclxuICAgICAgYXJyb3dCdXR0b25zWFNwYWNpbmc6IDE1LFxyXG4gICAgICB5U3BhY2luZzogNVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgcmV0dXJuICggdGl0bGVOb2RlLCBudW1iZXJEaXNwbGF5LCBzbGlkZXIsIGRlY3JlbWVudEJ1dHRvbiwgaW5jcmVtZW50QnV0dG9uICkgPT4ge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBkZWNyZW1lbnRCdXR0b24sICdUaGVyZSBpcyBubyBkZWNyZW1lbnRCdXR0b24hJyApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpbmNyZW1lbnRCdXR0b24sICdUaGVyZSBpcyBubyBpbmNyZW1lbnRCdXR0b24hJyApO1xyXG5cclxuICAgICAgc2xpZGVyLm11dGF0ZUxheW91dE9wdGlvbnMoIHtcclxuICAgICAgICBncm93OiAxXHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIHJldHVybiBuZXcgVkJveCgge1xyXG4gICAgICAgIGFsaWduOiBvcHRpb25zLmFsaWduLFxyXG4gICAgICAgIHNwYWNpbmc6IG9wdGlvbnMueVNwYWNpbmcsXHJcbiAgICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICAgIG5ldyBIQm94KCB7XHJcbiAgICAgICAgICAgIHNwYWNpbmc6IG9wdGlvbnMudGl0bGVYU3BhY2luZyxcclxuICAgICAgICAgICAgY2hpbGRyZW46IFsgdGl0bGVOb2RlLCBudW1iZXJEaXNwbGF5IF1cclxuICAgICAgICAgIH0gKSxcclxuICAgICAgICAgIG5ldyBIQm94KCB7XHJcbiAgICAgICAgICAgIGxheW91dE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICBzdHJldGNoOiB0cnVlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNwYWNpbmc6IG9wdGlvbnMuYXJyb3dCdXR0b25zWFNwYWNpbmcsXHJcbiAgICAgICAgICAgIGNoaWxkcmVuOiBbIGRlY3JlbWVudEJ1dHRvbiEsIHNsaWRlciwgaW5jcmVtZW50QnV0dG9uISBdXHJcbiAgICAgICAgICB9IClcclxuICAgICAgICBdXHJcbiAgICAgIH0gKTtcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIG9uZSBvZiB0aGUgcHJlLWRlZmluZWQgbGF5b3V0IGZ1bmN0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIGZvciBvcHRpb25zLmxheW91dEZ1bmN0aW9uLlxyXG4gICAqIEFycmFuZ2VzIHN1YmNvbXBvbmVudHMgbGlrZSB0aGlzOlxyXG4gICAqXHJcbiAgICogIHRpdGxlIDwgbnVtYmVyID5cclxuICAgKiAgLS0tLS0tfC0tLS0tLVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlTGF5b3V0RnVuY3Rpb24yKCBwcm92aWRlZE9wdGlvbnM/OiBOdW1iZXJDb250cm9sTGF5b3V0RnVuY3Rpb24yT3B0aW9ucyApOiBMYXlvdXRGdW5jdGlvbiB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxOdW1iZXJDb250cm9sTGF5b3V0RnVuY3Rpb24yT3B0aW9ucz4oKSgge1xyXG4gICAgICBhbGlnbjogJ2NlbnRlcicsXHJcbiAgICAgIHhTcGFjaW5nOiA1LFxyXG4gICAgICB5U3BhY2luZzogNVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgcmV0dXJuICggdGl0bGVOb2RlLCBudW1iZXJEaXNwbGF5LCBzbGlkZXIsIGRlY3JlbWVudEJ1dHRvbiwgaW5jcmVtZW50QnV0dG9uICkgPT4ge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBkZWNyZW1lbnRCdXR0b24gKTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggaW5jcmVtZW50QnV0dG9uICk7XHJcblxyXG4gICAgICBzbGlkZXIubXV0YXRlTGF5b3V0T3B0aW9ucygge1xyXG4gICAgICAgIHN0cmV0Y2g6IHRydWVcclxuICAgICAgfSApO1xyXG5cclxuICAgICAgcmV0dXJuIG5ldyBWQm94KCB7XHJcbiAgICAgICAgYWxpZ246IG9wdGlvbnMuYWxpZ24sXHJcbiAgICAgICAgc3BhY2luZzogb3B0aW9ucy55U3BhY2luZyxcclxuICAgICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgICAgbmV3IEhCb3goIHtcclxuICAgICAgICAgICAgc3BhY2luZzogb3B0aW9ucy54U3BhY2luZyxcclxuICAgICAgICAgICAgY2hpbGRyZW46IFsgdGl0bGVOb2RlLCBkZWNyZW1lbnRCdXR0b24hLCBudW1iZXJEaXNwbGF5LCBpbmNyZW1lbnRCdXR0b24hIF1cclxuICAgICAgICAgIH0gKSxcclxuICAgICAgICAgIHNsaWRlclxyXG4gICAgICAgIF1cclxuICAgICAgfSApO1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgb25lIG9mIHRoZSBwcmUtZGVmaW5lZCBsYXlvdXQgZnVuY3Rpb25zIHRoYXQgY2FuIGJlIHVzZWQgZm9yIG9wdGlvbnMubGF5b3V0RnVuY3Rpb24uXHJcbiAgICogQXJyYW5nZXMgc3ViY29tcG9uZW50cyBsaWtlIHRoaXM6XHJcbiAgICpcclxuICAgKiAgdGl0bGVcclxuICAgKiAgPCBudW1iZXIgPlxyXG4gICAqICAtLS0tLS0tfC0tLS0tLS1cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGNyZWF0ZUxheW91dEZ1bmN0aW9uMyggcHJvdmlkZWRPcHRpb25zPzogTnVtYmVyQ29udHJvbExheW91dEZ1bmN0aW9uM09wdGlvbnMgKTogTGF5b3V0RnVuY3Rpb24ge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8TnVtYmVyQ29udHJvbExheW91dEZ1bmN0aW9uM09wdGlvbnM+KCkoIHtcclxuICAgICAgYWxpZ25UaXRsZTogJ2NlbnRlcicsXHJcbiAgICAgIGFsaWduTnVtYmVyOiAnY2VudGVyJyxcclxuICAgICAgdGl0bGVMZWZ0SW5kZW50OiAwLFxyXG4gICAgICB4U3BhY2luZzogNSxcclxuICAgICAgeVNwYWNpbmc6IDVcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIHJldHVybiAoIHRpdGxlTm9kZSwgbnVtYmVyRGlzcGxheSwgc2xpZGVyLCBkZWNyZW1lbnRCdXR0b24sIGluY3JlbWVudEJ1dHRvbiApID0+IHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggZGVjcmVtZW50QnV0dG9uICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGluY3JlbWVudEJ1dHRvbiApO1xyXG5cclxuICAgICAgc2xpZGVyLm11dGF0ZUxheW91dE9wdGlvbnMoIHtcclxuICAgICAgICBzdHJldGNoOiB0cnVlXHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGNvbnN0IHRpdGxlQW5kQ29udGVudFZCb3ggPSBuZXcgVkJveCgge1xyXG4gICAgICAgIHNwYWNpbmc6IG9wdGlvbnMueVNwYWNpbmcsXHJcbiAgICAgICAgYWxpZ246IG9wdGlvbnMuYWxpZ25UaXRsZSxcclxuICAgICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgICAgbmV3IEFsaWduQm94KCB0aXRsZU5vZGUsIHsgbGVmdE1hcmdpbjogb3B0aW9ucy50aXRsZUxlZnRJbmRlbnQgfSApLFxyXG4gICAgICAgICAgbmV3IFZCb3goIHtcclxuICAgICAgICAgICAgbGF5b3V0T3B0aW9uczoge1xyXG4gICAgICAgICAgICAgIHN0cmV0Y2g6IHRydWVcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3BhY2luZzogb3B0aW9ucy55U3BhY2luZyxcclxuICAgICAgICAgICAgYWxpZ246IG9wdGlvbnMuYWxpZ25OdW1iZXIsXHJcbiAgICAgICAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgICAgICAgbmV3IEhCb3goIHtcclxuICAgICAgICAgICAgICAgIHNwYWNpbmc6IG9wdGlvbnMueFNwYWNpbmcsXHJcbiAgICAgICAgICAgICAgICBjaGlsZHJlbjogWyBkZWNyZW1lbnRCdXR0b24hLCBudW1iZXJEaXNwbGF5LCBpbmNyZW1lbnRCdXR0b24hIF1cclxuICAgICAgICAgICAgICB9ICksXHJcbiAgICAgICAgICAgICAgc2xpZGVyXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICAgIH0gKVxyXG4gICAgICAgIF1cclxuICAgICAgfSApO1xyXG5cclxuICAgICAgLy8gV2hlbiB0aGUgdGV4dCBvZiB0aGUgdGl0bGUgY2hhbmdlcyByZWNvbXB1dGUgdGhlIGFsaWdubWVudCBiZXR3ZWVuIHRoZSB0aXRsZSBhbmQgY29udGVudFxyXG4gICAgICB0aXRsZU5vZGUuYm91bmRzUHJvcGVydHkubGF6eUxpbmsoICgpID0+IHtcclxuICAgICAgICB0aXRsZUFuZENvbnRlbnRWQm94LnVwZGF0ZUxheW91dCgpO1xyXG4gICAgICB9ICk7XHJcbiAgICAgIHJldHVybiB0aXRsZUFuZENvbnRlbnRWQm94O1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgb25lIG9mIHRoZSBwcmUtZGVmaW5lZCBsYXlvdXQgZnVuY3Rpb25zIHRoYXQgY2FuIGJlIHVzZWQgZm9yIG9wdGlvbnMubGF5b3V0RnVuY3Rpb24uXHJcbiAgICogTGlrZSBjcmVhdGVMYXlvdXRGdW5jdGlvbjEsIGJ1dCB0aGUgdGl0bGUgYW5kIHZhbHVlIGdvIGFsbCB0aGUgd2F5IHRvIHRoZSBlZGdlcy5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGNyZWF0ZUxheW91dEZ1bmN0aW9uNCggcHJvdmlkZWRPcHRpb25zPzogTnVtYmVyQ29udHJvbExheW91dEZ1bmN0aW9uNE9wdGlvbnMgKTogTGF5b3V0RnVuY3Rpb24ge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8TnVtYmVyQ29udHJvbExheW91dEZ1bmN0aW9uNE9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgIC8vIGFkZHMgYWRkaXRpb25hbCBob3Jpem9udGFsIHNwYWNlIGJldHdlZW4gdGl0bGUgYW5kIE51bWJlckRpc3BsYXlcclxuICAgICAgc2xpZGVyUGFkZGluZzogMCxcclxuXHJcbiAgICAgIC8vIHZlcnRpY2FsIHNwYWNpbmcgYmV0d2VlbiBzbGlkZXIgYW5kIHRpdGxlL051bWJlckRpc3BsYXlcclxuICAgICAgdmVydGljYWxTcGFjaW5nOiA1LFxyXG5cclxuICAgICAgLy8gc3BhY2luZyBiZXR3ZWVuIHNsaWRlciBhbmQgYXJyb3cgYnV0dG9uc1xyXG4gICAgICBhcnJvd0J1dHRvblNwYWNpbmc6IDUsXHJcbiAgICAgIGhhc1JlYWRvdXRQcm9wZXJ0eTogbnVsbCxcclxuXHJcbiAgICAgIGxheW91dEludmlzaWJsZUJ1dHRvbnM6IGZhbHNlLFxyXG5cclxuICAgICAgY3JlYXRlQm90dG9tQ29udGVudDogbnVsbCAvLyBTdXBwb3J0cyBQZW5kdWx1bSBMYWIncyBxdWVzdGlvblRleHQgd2hlcmUgYSBxdWVzdGlvbiBpcyBzdWJzdGl0dXRlZCBmb3IgdGhlIHNsaWRlclxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgcmV0dXJuICggdGl0bGVOb2RlLCBudW1iZXJEaXNwbGF5LCBzbGlkZXIsIGRlY3JlbWVudEJ1dHRvbiwgaW5jcmVtZW50QnV0dG9uICkgPT4ge1xyXG5cclxuICAgICAgc2xpZGVyLm11dGF0ZUxheW91dE9wdGlvbnMoIHtcclxuICAgICAgICBncm93OiAxXHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGNvbnN0IGluY2x1ZGVBcnJvd0J1dHRvbnMgPSAhIWRlY3JlbWVudEJ1dHRvbjsgLy8gaWYgdGhlcmUgYXJlbid0IGFycm93IGJ1dHRvbnMsIHRoZW4gZXhjbHVkZSB0aGVtXHJcbiAgICAgIGNvbnN0IGJvdHRvbUJveCA9IG5ldyBIQm94KCB7XHJcbiAgICAgICAgc3BhY2luZzogb3B0aW9ucy5hcnJvd0J1dHRvblNwYWNpbmcsXHJcbiAgICAgICAgY2hpbGRyZW46ICFpbmNsdWRlQXJyb3dCdXR0b25zID8gWyBzbGlkZXIgXSA6IFtcclxuICAgICAgICAgIGRlY3JlbWVudEJ1dHRvbixcclxuICAgICAgICAgIHNsaWRlcixcclxuICAgICAgICAgIGluY3JlbWVudEJ1dHRvbiFcclxuICAgICAgICBdLFxyXG4gICAgICAgIGV4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHM6ICFvcHRpb25zLmxheW91dEludmlzaWJsZUJ1dHRvbnNcclxuICAgICAgfSApO1xyXG5cclxuICAgICAgY29uc3QgYm90dG9tQ29udGVudCA9IG9wdGlvbnMuY3JlYXRlQm90dG9tQ29udGVudCA/IG9wdGlvbnMuY3JlYXRlQm90dG9tQ29udGVudCggYm90dG9tQm94ICkgOiBib3R0b21Cb3g7XHJcblxyXG4gICAgICBib3R0b21Db250ZW50Lm11dGF0ZUxheW91dE9wdGlvbnMoIHtcclxuICAgICAgICBzdHJldGNoOiB0cnVlLFxyXG4gICAgICAgIHhNYXJnaW46IG9wdGlvbnMuc2xpZGVyUGFkZGluZ1xyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICAvLyBEeW5hbWljIGxheW91dCBzdXBwb3J0ZWRcclxuICAgICAgcmV0dXJuIG5ldyBWQm94KCB7XHJcbiAgICAgICAgc3BhY2luZzogb3B0aW9ucy52ZXJ0aWNhbFNwYWNpbmcsXHJcbiAgICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICAgIG5ldyBIQm94KCB7XHJcbiAgICAgICAgICAgIHNwYWNpbmc6IG9wdGlvbnMuc2xpZGVyUGFkZGluZyxcclxuICAgICAgICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICAgICAgICB0aXRsZU5vZGUsXHJcbiAgICAgICAgICAgICAgbmV3IE5vZGUoIHtcclxuICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbIG51bWJlckRpc3BsYXkgXSxcclxuICAgICAgICAgICAgICAgIHZpc2libGVQcm9wZXJ0eTogb3B0aW9ucy5oYXNSZWFkb3V0UHJvcGVydHkgfHwgbnVsbCxcclxuICAgICAgICAgICAgICAgIGV4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHM6IHRydWVcclxuICAgICAgICAgICAgICB9IClcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgbGF5b3V0T3B0aW9uczogeyBzdHJldGNoOiB0cnVlIH1cclxuICAgICAgICAgIH0gKSxcclxuICAgICAgICAgIGJvdHRvbUNvbnRlbnRcclxuICAgICAgICBdXHJcbiAgICAgIH0gKTtcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IE51bWJlckNvbnRyb2xJTyA9IG5ldyBJT1R5cGUoICdOdW1iZXJDb250cm9sSU8nLCB7XHJcbiAgICB2YWx1ZVR5cGU6IE51bWJlckNvbnRyb2wsXHJcbiAgICBkb2N1bWVudGF0aW9uOiAnQSBudW1iZXIgY29udHJvbCB3aXRoIGEgdGl0bGUsIHNsaWRlciBhbmQgKy8tIGJ1dHRvbnMnLFxyXG4gICAgc3VwZXJ0eXBlOiBOb2RlLk5vZGVJT1xyXG4gIH0gKTtcclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFNMSURFUl9UQU5ERU1fTkFNRSA9ICdzbGlkZXInIGFzIGNvbnN0O1xyXG59XHJcblxyXG4vKipcclxuICogVmFsaWRhdGUgYWxsIG9mIHRoZSBjYWxsYmFjayByZWxhdGVkIG9wdGlvbnMuIFRoZXJlIGFyZSB0d28gdHlwZXMgb2YgY2FsbGJhY2tzLiBUaGUgXCJzdGFydC9lbmRDYWxsYmFja1wiIHBhaXJcclxuICogYXJlIHBhc3NlZCBpbnRvIGFsbCBjb21wb25lbnRzIGluIHRoZSBOdW1iZXJDb250cm9sLiBUaGUgc2Vjb25kIHNldCBhcmUgc3RhcnQvZW5kIGNhbGxiYWNrcyBmb3IgZWFjaCBpbmRpdmlkdWFsXHJcbiAqIGNvbXBvbmVudC4gVGhpcyB3YXMgYWRkZWQgdG8gc3VwcG9ydCBtdWx0aXRvdWNoIGluIFJ1dGhlcmZvcmQgU2NhdHRlcmluZyBhcyBwYXJ0IG9mXHJcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9ydXRoZXJmb3JkLXNjYXR0ZXJpbmcvaXNzdWVzLzEyOC5cclxuICpcclxuICogVGhpcyBmdW5jdGlvbiBtdXRhdGVzIHRoZSBvcHRpb25zIGJ5IGluaXRpYWxpemluZyBnZW5lcmFsIGNhbGxiYWNrcyBmcm9tIG51bGwgKGluIHRoZSBleHRlbmQgY2FsbCkgdG8gYSBuby1vcFxyXG4gKiBmdW5jdGlvbi5cclxuICpcclxuICogT25seSBnZW5lcmFsIG9yIHNwZWNpZmljIGNhbGxiYWNrcyBhcmUgYWxsb3dlZCwgYnV0IG5vdCBib3RoLlxyXG4gKi9cclxuZnVuY3Rpb24gdmFsaWRhdGVDYWxsYmFja3MoIG9wdGlvbnM6IE51bWJlckNvbnRyb2xPcHRpb25zICk6IHZvaWQge1xyXG4gIGNvbnN0IG5vcm1hbENhbGxiYWNrc1ByZXNlbnQgPSAhISggb3B0aW9ucy5zdGFydENhbGxiYWNrIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmVuZENhbGxiYWNrICk7XHJcbiAgbGV0IGFycm93Q2FsbGJhY2tzUHJlc2VudCA9IGZhbHNlO1xyXG4gIGxldCBzbGlkZXJDYWxsYmFja3NQcmVzZW50ID0gZmFsc2U7XHJcblxyXG4gIGlmICggb3B0aW9ucy5hcnJvd0J1dHRvbk9wdGlvbnMgKSB7XHJcbiAgICBhcnJvd0NhbGxiYWNrc1ByZXNlbnQgPSBzcGVjaWZpY0NhbGxiYWNrS2V5c0luT3B0aW9ucyggb3B0aW9ucy5hcnJvd0J1dHRvbk9wdGlvbnMgKTtcclxuICB9XHJcblxyXG4gIGlmICggb3B0aW9ucy5zbGlkZXJPcHRpb25zICkge1xyXG4gICAgc2xpZGVyQ2FsbGJhY2tzUHJlc2VudCA9IHNwZWNpZmljQ2FsbGJhY2tLZXlzSW5PcHRpb25zKCBvcHRpb25zLnNsaWRlck9wdGlvbnMgKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHNwZWNpZmljQ2FsbGJhY2tzUHJlc2VudCA9IGFycm93Q2FsbGJhY2tzUHJlc2VudCB8fCBzbGlkZXJDYWxsYmFja3NQcmVzZW50O1xyXG5cclxuICAvLyBvbmx5IGdlbmVyYWwgb3IgY29tcG9uZW50IHNwZWNpZmljIGNhbGxiYWNrcyBhcmUgc3VwcG9ydGVkXHJcbiAgYXNzZXJ0ICYmIGFzc2VydCggISggbm9ybWFsQ2FsbGJhY2tzUHJlc2VudCAmJiBzcGVjaWZpY0NhbGxiYWNrc1ByZXNlbnQgKSxcclxuICAgICdVc2UgZ2VuZXJhbCBjYWxsYmFja3MgbGlrZSBcInN0YXJ0Q2FsbGJhY2tcIiBvciBzcGVjaWZpYyBjYWxsYmFja3MgbGlrZSBcInNsaWRlck9wdGlvbnMuc3RhcnREcmFnXCIgYnV0IG5vdCBib3RoLicgKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrIGZvciBhbiBpbnRlcnNlY3Rpb24gYmV0d2VlbiB0aGUgYXJyYXkgb2YgY2FsbGJhY2sgb3B0aW9uIGtleXMgYW5kIHRob3NlXHJcbiAqIHBhc3NlZCBpbiB0aGUgb3B0aW9ucyBvYmplY3QuIFRoZXNlIGNhbGxiYWNrIG9wdGlvbnMgYXJlIG9ubHkgdGhlIHNwZWNpZmljIGNvbXBvbmVudCBjYWxsYmFja3MsIG5vdCB0aGUgZ2VuZXJhbFxyXG4gKiBzdGFydC9lbmQgdGhhdCBhcmUgY2FsbGVkIGZvciBldmVyeSBjb21wb25lbnQncyBpbnRlcmFjdGlvblxyXG4gKi9cclxuZnVuY3Rpb24gc3BlY2lmaWNDYWxsYmFja0tleXNJbk9wdGlvbnMoIG9wdGlvbnM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ICk6IGJvb2xlYW4ge1xyXG4gIGNvbnN0IG9wdGlvbktleXMgPSBPYmplY3Qua2V5cyggb3B0aW9ucyApO1xyXG4gIGNvbnN0IGludGVyc2VjdGlvbiA9IFNQRUNJRklDX0NPTVBPTkVOVF9DQUxMQkFDS19PUFRJT05TLmZpbHRlciggeCA9PiBfLmluY2x1ZGVzKCBvcHRpb25LZXlzLCB4ICkgKTtcclxuICByZXR1cm4gaW50ZXJzZWN0aW9uLmxlbmd0aCA+IDA7XHJcbn1cclxuXHJcbnNjZW5lcnlQaGV0LnJlZ2lzdGVyKCAnTnVtYmVyQ29udHJvbCcsIE51bWJlckNvbnRyb2wgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxlQUFlLE1BQU0sa0NBQWtDO0FBRzlELE9BQU9DLFVBQVUsTUFBTSw0QkFBNEI7QUFDbkQsT0FBT0MsS0FBSyxNQUFNLHVCQUF1QjtBQUN6QyxPQUFPQyxLQUFLLE1BQU0sdUJBQXVCO0FBQ3pDLE9BQU9DLGdCQUFnQixNQUFNLHNEQUFzRDtBQUNuRixPQUFPQyxTQUFTLElBQUlDLGNBQWMsUUFBUSxpQ0FBaUM7QUFJM0UsU0FBU0MsUUFBUSxFQUFFQyxtQkFBbUIsRUFBUUMsSUFBSSxF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dUJ0SixlQUFlLEdBQUcsSUFBSXBDLE1BQU0sQ0FBRSxpQkFBaUIsRUFBRTtJQUN0RTZMLFNBQVMsRUFBRXBMLGFBQWE7SUFDeEJxTCxhQUFhLEVBQUUsdURBQXVEO0lBQ3RFQyxTQUFTLEVBQUV6TSxJQUFJLENBQUMwTTtFQUNsQixDQUFFLENBQUM7RUFDSCxPQUF1QnJILGtCQUFrQixHQUFHLFFBQVE7QUFDdEQ7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM1RCxpQkFBaUJBLENBQUUrQixPQUE2QixFQUFTO0VBQ2hFLE1BQU1tSixzQkFBc0IsR0FBRyxDQUFDLEVBQUduSixPQUFPLENBQUN6QixhQUFhLElBQ3JCeUIsT0FBTyxDQUFDdEIsV0FBVyxDQUFFO0VBQ3hELElBQUkwSyxxQkFBcUIsR0FBRyxLQUFLO0VBQ2pDLElBQUlDLHNCQUFzQixHQUFHLEtBQUs7RUFFbEMsSUFBS3JKLE9BQU8sQ0FBQzNCLGtCQUFrQixFQUFHO0lBQ2hDK0sscUJBQXFCLEdBQUdFLDZCQUE2QixDQUFFdEosT0FBTyxDQUFDM0Isa0JBQW1CLENBQUM7RUFDckY7RUFFQSxJQUFLMkIsT0FBTyxDQUFDNUIsYUFBYSxFQUFHO0lBQzNCaUwsc0JBQXNCLEdBQUdDLDZCQUE2QixDQUFFdEosT0FBTyxDQUFDNUIsYUFBYyxDQUFDO0VBQ2pGO0VBRUEsTUFBTW1MLHdCQUF3QixHQUFHSCxxQkFBcUIsSUFBSUMsc0JBQXNCOztFQUVoRjtFQUNBM0osTUFBTSxJQUFJQSxNQUFNLENBQUUsRUFBR3lKLHNCQUFzQixJQUFJSSx3QkFBd0IsQ0FBRSxFQUN2RSwrR0FBZ0gsQ0FBQztBQUNySDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBU0QsNkJBQTZCQSxDQUFFdEosT0FBZ0MsRUFBWTtFQUNsRixNQUFNd0osVUFBVSxHQUFHQyxNQUFNLENBQUNDLElBQUksQ0FBRTFKLE9BQVEsQ0FBQztFQUN6QyxNQUFNMkosWUFBWSxHQUFHcE0sbUNBQW1DLENBQUNxTSxNQUFNLENBQUVDLENBQUMsSUFBSXJMLENBQUMsQ0FBQ3NMLFFBQVEsQ0FBRU4sVUFBVSxFQUFFSyxDQUFFLENBQUUsQ0FBQztFQUNuRyxPQUFPRixZQUFZLENBQUM3RSxNQUFNLEdBQUcsQ0FBQztBQUNoQztBQUVBekgsV0FBVyxDQUFDME0sUUFBUSxDQUFFLGVBQWUsRUFBRXBNLGFBQWMsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==