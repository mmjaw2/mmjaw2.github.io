// Copyright 2013-2024, University of Colorado Boulder

/**
 * Slider, with support for horizontal and vertical orientations. By default, the slider is constructed in the
 * horizontal orientation, then adjusted if the vertical orientation was specified.
 *
 * Note: This type was originally named HSlider, renamed in https://github.com/phetsims/sun/issues/380.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Property from '../../axon/js/Property.js';
import ReadOnlyProperty from '../../axon/js/ReadOnlyProperty.js';
import Dimension2 from '../../dot/js/Dimension2.js';
import CompletePiecewiseLinearFunction from '../../dot/js/CompletePiecewiseLinearFunction.js';
import Range from '../../dot/js/Range.js';
import Utils from '../../dot/js/Utils.js';
import assertMutuallyExclusiveOptions from '../../phet-core/js/assertMutuallyExclusiveOptions.js';
import InstanceRegistry from '../../phet-core/js/documentation/InstanceRegistry.js';
import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
import Orientation from '../../phet-core/js/Orientation.js';
import swapObjectKeys from '../../phet-core/js/swapObjectKeys.js';
import { DragListener, HighlightFromNode, LayoutConstraint, Node, SceneryConstants, Sizable } from '../../scenery/js/imports.js';
import Tandem from '../../tandem/js/Tandem.js';
import IOType from '../../tandem/js/types/IOType.js';
import ValueChangeSoundPlayer from '../../tambo/js/sound-generators/ValueChangeSoundPlayer.js';
import AccessibleSlider from './accessibility/AccessibleSlider.js';
import DefaultSliderTrack from './DefaultSliderTrack.js';
import SliderThumb from './SliderThumb.js';
import SliderTick from './SliderTick.js';
import sun from './sun.js';
import Multilink from '../../axon/js/Multilink.js';
import TinyProperty from '../../axon/js/TinyProperty.js';
import SunConstants from './SunConstants.js';
import createObservableArray from '../../axon/js/createObservableArray.js';
import isSettingPhetioStateProperty from '../../tandem/js/isSettingPhetioStateProperty.js';
// constants
const DEFAULT_HORIZONTAL_TRACK_SIZE = new Dimension2(100, 5);
const DEFAULT_HORIZONTAL_THUMB_SIZE = new Dimension2(17, 34);

// We provide these options to the super, also enabledRangeProperty is turned from required to optional

export default class Slider extends Sizable(AccessibleSlider(Node, 0)) {
  // public so that clients can access Properties of these DragListeners that tell us about its state
  // See https://github.com/phetsims/sun/issues/680

  // options needed by prototype functions that add ticks

  // ticks are added to these parents, so they are behind the knob

  ticks = createObservableArray();

  // The default sound used if options.soundGenerator is not set.
  static DEFAULT_SOUND_GENERATOR = new ValueChangeSoundPlayer(new Range(0, 1));

  // If the user is holding down the thumb outside of the enabled range, and the enabled range expands, the value should
  // adjust to the new extremum of the range, see https://github.com/phetsims/mean-share-and-balance/issues/29
  // This value is set during thumb drag, or null if not currently being dragged.
  proposedValue = null;
  constructor(valueProperty, range, providedOptions) {
    // Guard against mutually exclusive options before defaults are filled in.
    assert && assertMutuallyExclusiveOptions(providedOptions, ['thumbNode'], ['thumbSize', 'thumbFill', 'thumbFillHighlighted', 'thumbStroke', 'thumbLineWidth', 'thumbCenterLineStroke', 'thumbTouchAreaXDilation', 'thumbTouchAreaYDilation', 'thumbMouseAreaXDilation', 'thumbMouseAreaYDilation']);
    assert && assertMutuallyExclusiveOptions(providedOptions, ['trackNode'], ['trackSize', 'trackFillEnabled', 'trackFillDisabled', 'trackStroke', 'trackLineWidth', 'trackCornerRadius']);
    const options = optionize()({
      orientation: Orientation.HORIZONTAL,
      trackNode: null,
      trackSize: null,
      trackFillEnabled: 'white',
      trackFillDisabled: 'gray',
      trackStroke: 'black',
      trackLineWidth: 1,
      trackCornerRadius: 0,
      trackPickable: true,
      thumbNode: null,
      thumbSize: null,
      thumbFill: 'rgb(50,145,184)',
      thumbFillHighlighted: 'rgb(71,207,255)',
      thumbStroke: 'black',
      thumbLineWidth: 1,
      thumbCenterLineStroke: 'white',
      thumbTouchAreaXDilation: 11,
      thumbTouchAreaYDilation: 11,
      thumbMouseAreaXDilation: 0,
      thumbMouseAreaYDilation: 0,
      thumbYOffset: 0,
      tickLabelSpacing: 6,
      majorTickLength: 25,
      majorTickStroke: 'black',
      majorTickLineWidth: 1,
      minorTickLength: 10,
      minorTickStroke: 'black',
      minorTickLineWidth: 1,
      cursor: 'pointer',
      startDrag: _.noop,
      drag: _.noop,
      endDrag: _.noop,
      constrainValue: _.identity,
      disabledOpacity: SceneryConstants.DISABLED_OPACITY,
      soundGenerator: Slider.DEFAULT_SOUND_GENERATOR,
      valueChangeSoundGeneratorOptions: {},
      // phet-io
      phetioLinkedProperty: null,
      // Supertype options
      tandem: Tandem.REQUIRED,
      tandemNameSuffix: 'Slider',
      phetioType: Slider.SliderIO,
      phetioFeatured: true,
      visiblePropertyOptions: {
        phetioFeatured: true
      },
      phetioEnabledPropertyInstrumented: true // opt into default PhET-iO instrumented enabledProperty
    }, providedOptions);
    const rangeProperty = range instanceof Range ? new TinyProperty(range) : range;
    assert && assert(options.soundGenerator === Slider.DEFAULT_SOUND_GENERATOR || _.isEmpty(options.valueChangeSoundGeneratorOptions), 'options should only be supplied when using default sound generator');

    // If no sound generator was provided, create the default.
    if (options.soundGenerator === Slider.DEFAULT_SOUND_GENERATOR) {
      options.soundGenerator = new ValueChangeSoundPlayer(rangeProperty.value, options.valueChangeSoundGeneratorOptions || {});
    } else if (options.soundGenerator === null) {
      options.soundGenerator = ValueChangeSoundPlayer.NO_SOUND;
    }

    // Set up the drag handler to generate sound when drag events cause changes.
    if (options.soundGenerator !== ValueChangeSoundPlayer.NO_SOUND) {
      // variable to keep track of the value at the start of user drag interactions
      let previousValue = valueProperty.value;

      // Enhance the drag handler to perform sound generation.
      const providedDrag = options.drag;
      options.drag = event => {
        if (event.isFromPDOM()) {
          options.soundGenerator.playSoundForValueChange(valueProperty.value, previousValue);
        } else {
          options.soundGenerator.playSoundIfThresholdReached(valueProperty.value, previousValue);
        }
        providedDrag(event);
        previousValue = valueProperty.value;
      };
    }
    if (options.orientation === Orientation.VERTICAL) {
      // For a vertical slider, the client should provide dimensions that are specific to a vertical slider.
      // But Slider expects dimensions for a horizontal slider, and then creates the vertical orientation using rotation.
      // So if the client provides any dimensions for a vertical slider, swap those dimensions to horizontal.
      if (options.trackSize) {
        options.trackSize = options.trackSize.swapped();
      }
      if (options.thumbSize) {
        options.thumbSize = options.thumbSize.swapped();
      }
      swapObjectKeys(options, 'thumbTouchAreaXDilation', 'thumbTouchAreaYDilation');
      swapObjectKeys(options, 'thumbMouseAreaXDilation', 'thumbMouseAreaYDilation');
    }
    options.trackSize = options.trackSize || DEFAULT_HORIZONTAL_TRACK_SIZE;
    options.thumbSize = options.thumbSize || DEFAULT_HORIZONTAL_THUMB_SIZE;
    const thumbTandem = options.tandem.createTandem(Slider.THUMB_NODE_TANDEM_NAME);
    if (Tandem.VALIDATION && options.thumbNode) {
      assert && assert(options.thumbNode.tandem.equals(thumbTandem), `Passed-in thumbNode must have the correct tandem. Expected: ${thumbTandem.phetioID}, actual: ${options.thumbNode.tandem.phetioID}`);
    }

    // The thumb of the slider
    const thumb = options.thumbNode || new SliderThumb({
      // propagate options that are specific to SliderThumb
      size: options.thumbSize,
      fill: options.thumbFill,
      fillHighlighted: options.thumbFillHighlighted,
      stroke: options.thumbStroke,
      lineWidth: options.thumbLineWidth,
      centerLineStroke: options.thumbCenterLineStroke,
      tandem: thumbTandem
    });
    const ownsEnabledRangeProperty = !options.enabledRangeProperty;
    const boundsRequiredOptionKeys = _.pick(options, Node.REQUIRES_BOUNDS_OPTION_KEYS);

    // Now add in the required options when passing to the super type
    const superOptions = combineOptions({
      ariaOrientation: options.orientation,
      valueProperty: valueProperty,
      panTargetNode: thumb,
      // controls the portion of the slider that is enabled
      enabledRangeProperty: options.enabledRangeProperty || (range instanceof Range ? new Property(range, {
        valueType: Range,
        isValidValue: value => value.min >= range.min && value.max <= range.max,
        tandem: options.tandem.createTandem('enabledRangeProperty'),
        phetioValueType: Range.RangeIO,
        phetioDocumentation: 'Sliders support two ranges: the outer range which specifies the min and max of the track and ' + 'the enabledRangeProperty, which determines how low and high the thumb can be dragged within the track.'
      }) : range)
    }, options);
    super(superOptions);
    this.orientation = superOptions.orientation;
    this.enabledRangeProperty = superOptions.enabledRangeProperty;
    this.tickOptions = _.pick(options, 'tickLabelSpacing', 'majorTickLength', 'majorTickStroke', 'majorTickLineWidth', 'minorTickLength', 'minorTickStroke', 'minorTickLineWidth');
    const sliderParts = [];

    // ticks are added to these parents, so they are behind the knob
    this.majorTicksParent = new Node();
    this.minorTicksParent = new Node();
    sliderParts.push(this.majorTicksParent);
    sliderParts.push(this.minorTicksParent);
    const trackTandem = options.tandem.createTandem(Slider.TRACK_NODE_TANDEM_NAME);
    if (Tandem.VALIDATION && options.trackNode) {
      assert && assert(options.trackNode.tandem.equals(trackTandem), `Passed-in trackNode must have the correct tandem. Expected: ${trackTandem.phetioID}, actual: ${options.trackNode.tandem.phetioID}`);
    }
    const trackSpacer = new Node();
    sliderParts.push(trackSpacer);

    // Assertion to get around mutating the null-default based on the slider orientation.
    assert && assert(superOptions.trackSize, 'trackSize should not be null');
    this.track = options.trackNode || new DefaultSliderTrack(valueProperty, range, {
      // propagate options that are specific to SliderTrack
      size: superOptions.trackSize,
      fillEnabled: superOptions.trackFillEnabled,
      fillDisabled: superOptions.trackFillDisabled,
      stroke: superOptions.trackStroke,
      lineWidth: superOptions.trackLineWidth,
      cornerRadius: superOptions.trackCornerRadius,
      startDrag: superOptions.startDrag,
      drag: superOptions.drag,
      endDrag: superOptions.endDrag,
      constrainValue: superOptions.constrainValue,
      enabledRangeProperty: this.enabledRangeProperty,
      soundGenerator: options.soundGenerator,
      pickable: superOptions.trackPickable,
      voicingOnEndResponse: this.voicingOnEndResponse.bind(this),
      // phet-io
      tandem: trackTandem
    });

    // Add the track
    sliderParts.push(this.track);

    // Position the thumb vertically.
    thumb.setCenterY(this.track.centerY + options.thumbYOffset);
    sliderParts.push(thumb);

    // Wrap all of the slider parts in a Node, and set the orientation of that Node.
    // This allows us to still decorate the Slider with additional children.
    // See https://github.com/phetsims/sun/issues/406
    const sliderPartsNode = new Node({
      children: sliderParts
    });
    if (options.orientation === Orientation.VERTICAL) {
      sliderPartsNode.rotation = SunConstants.SLIDER_VERTICAL_ROTATION;
    }
    this.addChild(sliderPartsNode);

    // touchArea for the default thumb. If a custom thumb is provided, the client is responsible for its touchArea.
    if (!options.thumbNode && (options.thumbTouchAreaXDilation || options.thumbTouchAreaYDilation)) {
      thumb.touchArea = thumb.localBounds.dilatedXY(options.thumbTouchAreaXDilation, options.thumbTouchAreaYDilation);
    }

    // mouseArea for the default thumb. If a custom thumb is provided, the client is responsible for its mouseArea.
    if (!options.thumbNode && (options.thumbMouseAreaXDilation || options.thumbMouseAreaYDilation)) {
      thumb.mouseArea = thumb.localBounds.dilatedXY(options.thumbMouseAreaXDilation, options.thumbMouseAreaYDilation);
    }

    // update value when thumb is dragged
    let clickXOffset = 0; // x-offset between initial click and thumb's origin
    let valueOnStart = valueProperty.value; // For description so we can describe value changes between interactions
    const thumbDragListener = new DragListener({
      // Deviate from the variable name because we will nest this tandem under the thumb directly
      tandem: thumb.tandem.createTandem('dragListener'),
      start: (event, listener) => {
        if (this.enabledProperty.get()) {
          valueOnStart = valueProperty.value;
          options.startDrag(event);
          const transform = listener.pressedTrail.subtrailTo(sliderPartsNode).getTransform();

          // Determine the offset relative to the center of the thumb
          clickXOffset = transform.inversePosition2(event.pointer.point).x - thumb.centerX;
        }
      },
      drag: (event, listener) => {
        if (this.enabledProperty.get()) {
          const transform = listener.pressedTrail.subtrailTo(sliderPartsNode).getTransform(); // we only want the transform to our parent
          const x = transform.inversePosition2(event.pointer.point).x - clickXOffset;
          this.proposedValue = this.track.valueToPositionProperty.value.inverse(x);
          const valueInRange = this.enabledRangeProperty.get().constrainValue(this.proposedValue);
          valueProperty.set(options.constrainValue(valueInRange));

          // after valueProperty is set so listener can use the new value
          options.drag(event);
        }
      },
      end: event => {
        if (this.enabledProperty.get()) {
          options.endDrag(event);

          // voicing - Default behavior is to speak the new object response at the end of interaction. If you want to
          // customize this response, you can modify supertype options VoicingOnEndResponseOptions.
          this.voicingOnEndResponse(valueOnStart);
        }
        this.proposedValue = null;
      }
    });
    thumb.addInputListener(thumbDragListener);
    this.thumbDragListener = thumbDragListener;
    this.trackDragListener = this.track.dragListener;

    // update thumb position when value changes
    const valueMultilink = Multilink.multilink([valueProperty, this.track.valueToPositionProperty], (value, valueToPosition) => {
      thumb.centerX = valueToPosition.evaluate(value);
    });

    // when the enabled range changes, the value to position linear function must change as well
    const enabledRangeObserver = enabledRange => {
      // When restoring PhET-iO state, prevent the clamp from setting a stale, incorrect value to a deferred Property
      // (which may have already restored the correct value from phet-io state), see https://github.com/phetsims/mean-share-and-balance/issues/21
      if (!valueProperty.isPhetioInstrumented() || !isSettingPhetioStateProperty.value) {
        if (this.proposedValue === null) {
          // clamp the current value to the enabled range if it changes
          valueProperty.set(Utils.clamp(valueProperty.value, enabledRange.min, enabledRange.max));
        } else {
          // The user is holding the thumb, which may be outside the enabledRange.  In that case, expanding the range
          // could accommodate the outer value
          const proposedValueInEnabledRange = Utils.clamp(this.proposedValue, enabledRange.min, enabledRange.max);
          const proposedValueInConstrainedRange = options.constrainValue(proposedValueInEnabledRange);
          valueProperty.set(proposedValueInConstrainedRange);
        }
      }
    };
    this.enabledRangeProperty.link(enabledRangeObserver); // needs to be unlinked in dispose function

    const constraint = new SliderConstraint(this, this.track, thumb, sliderPartsNode, options.orientation, trackSpacer, this.ticks);
    this.disposeSlider = () => {
      constraint.dispose();
      thumb.dispose && thumb.dispose(); // in case a custom thumb is provided via options.thumbNode that doesn't implement dispose
      this.track.dispose && this.track.dispose();
      if (ownsEnabledRangeProperty) {
        this.enabledRangeProperty.dispose();
      } else {
        this.enabledRangeProperty.unlink(enabledRangeObserver);
      }
      valueMultilink.dispose();
      thumbDragListener.dispose();
    };

    // pdom - custom focus highlight that surrounds and moves with the thumb
    this.focusHighlight = new HighlightFromNode(thumb);
    assert && Tandem.VALIDATION && assert(!options.phetioLinkedProperty || options.phetioLinkedProperty.isPhetioInstrumented(), 'If provided, phetioLinkedProperty should be PhET-iO instrumented');

    // Must happen after instrumentation (in super call)
    const linkedProperty = options.phetioLinkedProperty || (valueProperty instanceof ReadOnlyProperty ? valueProperty : null);
    if (linkedProperty) {
      this.addLinkedElement(linkedProperty, {
        tandemName: 'valueProperty'
      });
    }

    // must be after the button is instrumented
    // assert && assert( !this.isPhetioInstrumented() || this.enabledRangeProperty.isPhetioInstrumented() );
    !ownsEnabledRangeProperty && this.enabledRangeProperty instanceof ReadOnlyProperty && this.addLinkedElement(this.enabledRangeProperty, {
      tandemName: 'enabledRangeProperty'
    });
    this.mutate(boundsRequiredOptionKeys);

    // support for binder documentation, stripped out in builds and only runs when ?binder is specified
    assert && phet?.chipper?.queryParameters?.binder && InstanceRegistry.registerDataURL('sun', 'Slider', this);
  }
  get majorTicksVisible() {
    return this.getMajorTicksVisible();
  }
  set majorTicksVisible(value) {
    this.setMajorTicksVisible(value);
  }
  get minorTicksVisible() {
    return this.getMinorTicksVisible();
  }
  set minorTicksVisible(value) {
    this.setMinorTicksVisible(value);
  }
  dispose() {
    this.disposeSlider();
    this.ticks.forEach(tick => {
      tick.dispose();
    });
    super.dispose();
  }

  /**
   * Adds a major tick mark.
   */
  addMajorTick(value, label) {
    this.addTick(this.majorTicksParent, value, label, this.tickOptions.majorTickLength, this.tickOptions.majorTickStroke, this.tickOptions.majorTickLineWidth);
  }

  /**
   * Adds a minor tick mark.
   */
  addMinorTick(value, label) {
    this.addTick(this.minorTicksParent, value, label, this.tickOptions.minorTickLength, this.tickOptions.minorTickStroke, this.tickOptions.minorTickLineWidth);
  }

  /**
   * Adds a tick mark above the track.
   */
  addTick(parent, value, label, length, stroke, lineWidth) {
    this.ticks.push(new SliderTick(parent, value, label, length, stroke, lineWidth, this.tickOptions, this.orientation, this.track));
  }

  // Sets visibility of major ticks.
  setMajorTicksVisible(visible) {
    this.majorTicksParent.visible = visible;
  }

  // Gets visibility of major ticks.
  getMajorTicksVisible() {
    return this.majorTicksParent.visible;
  }

  // Sets visibility of minor ticks.
  setMinorTicksVisible(visible) {
    this.minorTicksParent.visible = visible;
  }

  // Gets visibility of minor ticks.
  getMinorTicksVisible() {
    return this.minorTicksParent.visible;
  }

  // standardized tandem names, see https://github.com/phetsims/sun/issues/694
  static THUMB_NODE_TANDEM_NAME = 'thumbNode';
  static TRACK_NODE_TANDEM_NAME = 'trackNode';
  static SliderIO = new IOType('SliderIO', {
    valueType: Slider,
    documentation: 'A traditional slider component, with a knob and possibly tick marks',
    supertype: Node.NodeIO
  });
}
class SliderConstraint extends LayoutConstraint {
  constructor(slider, track, thumb, sliderPartsNode, orientation, trackSpacer, ticks) {
    super(slider);

    // We need to make it sizable in both dimensions (VSlider vs HSlider), but we'll still want to make the opposite
    // axis non-sizable (since it won't be sizable in both orientations at once).
    this.slider = slider;
    this.track = track;
    this.thumb = thumb;
    this.sliderPartsNode = sliderPartsNode;
    this.orientation = orientation;
    this.trackSpacer = trackSpacer;
    this.ticks = ticks;
    if (orientation === Orientation.HORIZONTAL) {
      slider.heightSizable = false;
      this.preferredProperty = this.slider.localPreferredWidthProperty;
    } else {
      slider.widthSizable = false;
      this.preferredProperty = this.slider.localPreferredHeightProperty;
    }
    this.preferredProperty.lazyLink(this._updateLayoutListener);

    // So range changes or minimum changes will trigger layouts (since they can move ticks)
    this.track.rangeProperty.lazyLink(this._updateLayoutListener);

    // Thumb size changes should trigger layout, since we check the width of the thumb
    // NOTE: This is ignoring thumb scale changing, but for performance/correctness it makes sense to avoid that for now
    // so we can rule out infinite loops of thumb movement.
    this.thumb.localBoundsProperty.lazyLink(this._updateLayoutListener);

    // As ticks are added, add a listener to each that will update the layout if the tick's bounds changes.
    const tickAddedListener = addedTick => {
      addedTick.tickNode.localBoundsProperty.lazyLink(this._updateLayoutListener);
      ticks.addItemRemovedListener(removedTick => {
        if (removedTick === addedTick && removedTick.tickNode.localBoundsProperty.hasListener(this._updateLayoutListener)) {
          addedTick.tickNode.localBoundsProperty.unlink(this._updateLayoutListener);
        }
      });
    };
    ticks.addItemAddedListener(tickAddedListener);
    this.addNode(track);
    this.layout();
    this.disposeSliderConstraint = () => {
      ticks.removeItemAddedListener(tickAddedListener);
      this.preferredProperty.unlink(this._updateLayoutListener);
      this.track.rangeProperty.unlink(this._updateLayoutListener);
      this.thumb.localBoundsProperty.unlink(this._updateLayoutListener);
    };
  }
  layout() {
    super.layout();
    const slider = this.slider;
    const track = this.track;
    const thumb = this.thumb;

    // Dilate the local bounds horizontally so that it extends beyond where the thumb can reach.  This prevents layout
    // asymmetry when the slider thumb is off the edges of the track.  See https://github.com/phetsims/sun/issues/282
    this.trackSpacer.localBounds = track.localBounds.dilatedX(thumb.width / 2);
    assert && assert(track.minimumWidth !== null);

    // Our track's (exterior) minimum width will INCLUDE "visual overflow" e.g. stroke. The actual range used for
    // computation of where the thumb/ticks go will be the "interior" width (excluding the visual overflow), e.g.
    // without the stroke. We'll need to track and handle these separately, and only handle tick positioning based on
    // the interior width.
    const totalOverflow = track.leftVisualOverflow + track.rightVisualOverflow;
    const trackMinimumExteriorWidth = track.minimumWidth;
    const trackMinimumInteriorWidth = trackMinimumExteriorWidth - totalOverflow;

    // Takes a tick's value into the [0,1] range. This should be multiplied times the potential INTERIOR track width
    // in order to get the position the tick should be at.
    const normalizeTickValue = value => {
      return Utils.linear(track.rangeProperty.value.min, track.rangeProperty.value.max, 0, 1, value);
    };

    // NOTE: Due to visual overflow, our track's range (including the thumb extension) will actually go from
    // ( -thumb.width / 2 - track.leftVisualOverflow ) on the left to
    // ( trackExteriorWidth + thumb.width / 2 + track.rightVisualOverflow ) on the right.
    // This is because our track's width is reduced to account for stroke, but the logical rectangle is still located
    // at x=0, meaning the stroke (with lineWidth=1) will typically go out to -0.5 (negative left visual overflow).
    // Our horizontal bounds are thus effectively offset by this left visual overflow amount.

    // NOTE: This actually goes PAST where the thumb should go when there is visual overflow, but we also
    // included this "imprecision" in the past (localBounds INCLUDING the stroke was dilated by the thumb width), so we
    // will have a slight bit of additional padding included here.

    // NOTE: Documentation was added before dynamic layout integration (noting the extension BEYOND the bounds):
    // > Dilate the local bounds horizontally so that it extends beyond where the thumb can reach.  This prevents layout
    // > asymmetry when the slider thumb is off the edges of the track.  See https://github.com/phetsims/sun/issues/282
    const leftExteriorOffset = -thumb.width / 2 - track.leftVisualOverflow;
    const rightExteriorOffset = thumb.width / 2 - track.leftVisualOverflow;

    // Start with the size our minimum track would be WITH the added spacing for the thumb
    // NOTE: will be mutated below
    const minimumRange = new Range(leftExteriorOffset, trackMinimumExteriorWidth + rightExteriorOffset);

    // We'll need to consider where the ticks would be IF we had our minimum size (since the ticks would potentially
    // be spaced closer together). So we'll check the bounds of each tick if it was at that location, and
    // ensure that ticks are included in our minimum range (since tick labels may stick out past the track).
    this.ticks.forEach(tick => {
      // Where the tick will be if we have our minimum size
      const tickMinimumPosition = trackMinimumInteriorWidth * normalizeTickValue(tick.value);

      // Adjust the minimum range to include the tick.
      const halfTickWidth = tick.tickNode.width / 2;

      // The tick will be centered
      minimumRange.includeRange(new Range(-halfTickWidth, halfTickWidth).shifted(tickMinimumPosition));
    });
    if (slider.widthSizable && this.preferredProperty.value !== null) {
      // Here's where things get complicated! Above, it's fairly easy to go from "track exterior width" => "slider width",
      // however we need to do the opposite (when our horizontal slider has a preferred width, we need to compute what
      // track width we'll have to make that happen). As I noted in the issue for this work:

      // There's a fun linear optimization problem hiding in plain sight (perhaps a high-performance iterative solution will work):
      // - We can compute a minimum size (given the minimum track size, see where the tick labels go, and include those).
      // - HOWEVER adjusting the track size ALSO adjusts how much the tick labels stick out to the sides (the expansion
      //   of the track will push the tick labels away from the edges).
      // - Different ticks will be the limiting factor for the bounds at different track sizes (a tick label on the very
      //   end should not vary the bounds offset, but a tick label that's larger but slightly offset from the edge WILL
      //   vary the offset)
      // - So it's easy to compute the resulting size from the track size, BUT the inverse problem is more difficult.
      //   Essentially we have a convex piecewise-linear function mapping track size to output size (implicitly defined
      //   by where tick labels swap being the limiting factor), and we need to invert it.

      // Effectively the "track width" => "slider width" is a piecewise-linear function, where the breakpoints occur
      // where ONE tick either becomes the limiting factor or stops being the limiting factor. Mathematically, this works
      // out to be based on the following formulas:

      // The LEFT x is the minimum of all the following:
      //   -thumb.width / 2 - track.leftVisualOverflow
      //   FOR EVERY TICK: -tickWidth / 2 + ( trackWidth - overflow ) * normalizedTickValue
      // The RIGHT x is the maximum of all the following:
      //   trackWidth + thumb.width / 2 - track.leftVisualOverflow
      //   (for every tick) tickWidth / 2 + ( trackWidth - overflow ) * normalizedTickValue
      // NOTE: the "trackWidth - overflow" is the INTERNAL width (not including the stroke) that we use for tick
      // computation
      // This effectively computes how far everything "sticks out" and would affect the bounds.
      //
      // The TOTAL width of the slider will simply be the above RIGHT - LEFT.

      // Instead of using numerical solutions, we're able to solve this analytically with piecewise-linear functions that
      // implement the above functions. We'll consider each of those individual functions as a linear function where
      // the input is the exterior track length, e.g. f(trackLength) = A * trackLength + B, for given A,B values.
      // By min/max-ing these together and then taking the difference, we'll have an accurate function of
      // f(trackLength) = sliderWidth. Then we'll invert that function, e.g. f^-1(sliderWidth) = trackLength, and then
      // we'll be able to pass in our preferred slider width in order to compute the preferred track length.

      // We'll need to factor the trackWidth out for the tick functions, so:
      // LEFT tick computations:
      //   -tickWidth / 2 + ( trackWidth - overflow ) * normalizedTickValue
      // = -tickWidth / 2 + trackWidth * normalizedTickValue - overflow * normalizedTickValue
      // = normalizedTickValue * trackWidth + ( -tickWidth / 2 - overflow * normalizedTickValue )
      // So when we put it in the form of A * trackWidth + B, we get:
      //   A = normalizedTickValue, B = -tickWidth / 2 - overflow * normalizedTickValue
      // Similarly happens for the RIGHT tick computation.

      const trackWidthToFullWidthFunction = CompletePiecewiseLinearFunction.max(
      // Right side (track/thumb)
      CompletePiecewiseLinearFunction.linear(1, rightExteriorOffset),
      // Right side (ticks)
      ...this.ticks.map(tick => {
        const normalizedTickValue = normalizeTickValue(tick.value);
        return CompletePiecewiseLinearFunction.linear(normalizedTickValue, tick.tickNode.width / 2 - totalOverflow * normalizedTickValue);
      })).minus(CompletePiecewiseLinearFunction.min(
      // Left side (track/thumb)
      CompletePiecewiseLinearFunction.constant(leftExteriorOffset),
      // Left side (ticks)
      ...this.ticks.map(tick => {
        const normalizedTickValue = normalizeTickValue(tick.value);
        return CompletePiecewiseLinearFunction.linear(normalizedTickValue, -tick.tickNode.width / 2 - totalOverflow * normalizedTickValue);
      })));

      // NOTE: This function is only monotonically increasing when trackWidth is positive! We'll drop the values
      // underneath our minimum track width (they won't be needed), but we'll need to add an extra point below to ensure
      // that the slope is maintained (due to how CompletePiecewiseLinearFunction works).
      const fullWidthToTrackWidthFunction = trackWidthToFullWidthFunction.withXValues([trackMinimumExteriorWidth - 1, trackMinimumExteriorWidth, ...trackWidthToFullWidthFunction.points.map(point => point.x).filter(x => x > trackMinimumExteriorWidth + 1e-10)]).inverted();
      track.preferredWidth = Math.max(
      // Ensure we're NOT dipping below the minimum track width (for some reason).
      trackMinimumExteriorWidth, fullWidthToTrackWidthFunction.evaluate(this.preferredProperty.value));
    } else {
      track.preferredWidth = track.minimumWidth;
    }
    const minimumWidth = minimumRange.getLength();

    // Set minimums at the end
    if (this.orientation === Orientation.HORIZONTAL) {
      slider.localMinimumWidth = minimumWidth;
    } else {
      slider.localMinimumHeight = minimumWidth;
    }
  }
  dispose() {
    this.disposeSliderConstraint();
    super.dispose();
  }
}
sun.register('Slider', Slider);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQcm9wZXJ0eSIsIlJlYWRPbmx5UHJvcGVydHkiLCJEaW1lbnNpb24yIiwiQ29tcGxldGVQaWVjZXdpc2VMaW5lYXJGdW5jdGlvbiIsIlJhbmdlIiwiVXRpbHMiLCJhc3NlcnRNdXR1YWxseUV4Y2x1c2l2ZU9wdGlvbnMiLCJJbnN0YW5jZVJlZ2lzdHJ5Iiwib3B0aW9uaXplIiwiY29tYmluZU9wdGlvbnMiLCJPcmllbnRhdGlvbiIsInN3YXBPYmplY3RLZXlzIiwiRHJhZ0xpc3RlbmVyIiwiSGlnaGxpZ2h0RnJvbU5vZGUiLCJMYXlvdXRDb25zdHJhaW50IiwiTm9kZSIsIlNjZW5lcnlDb25zdGFudHMiLCJTaXphYmxlIiwiVGFuZGVtIiwiSU9UeXBlIiwiVmFsdWVDaGFuZ2VTb3VuZFBsYXllciIsIkFjY2Vzc2libGVTbGlkZXIiLCJEZWZhdWx0U2xpZGVyVHJhY2siLCJTbGlkZXJUaHVtYiIsIlNsaWRlclRpY2siLCJzdW4iLCJNdWx0aWxpbmsiLCJUaW55UHJvcGVydHkiLCJTdW5Db25zdGFudHMiLCJjcmVhdGVPYnNlcnZhYmxlQXJyYXkiLCJpc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5IiwiREVGQVVMVF9IT1JJWk9OVEFMX1RSQUNLX1NJWkUiLCJERUZBVUxUX0hPUklaT05UQUxfVEhVTUJfU0laRSIsIlNsaWRlciIsInRpY2tzIiwiREVGQVVMVF9TT1VORF9HRU5FUkFUT1IiLCJwcm9wb3NlZFZhbHVlIiwiY29uc3RydWN0b3IiLCJ2YWx1ZVByb3BlcnR5IiwicmFuZ2UiLCJwcm92aWRlZE9wdGlvbnMiLCJhc3NlcnQiLCJvcHRpb25zIiwib3JpZW50YXRpb24iLCJIT1JJWk9OVEFMIiwidHJhY2tOb2RlIiwidHJhY2tTaXplIiwidHJhY2tGaWxsRW5hYmxlZCIsInRyYWNrRmlsbERpc2FibGVkIiwidHJhY2tTdHJva2UiLCJ0cmFja0xpbmVXaWR0aCIsInRyYWNrQ29ybmVyUmFkaXVzIiwidHJhY2tQaWNrYWJsZSIsInRodW1iTm9kZSIsInRodW1iU2l6ZSIsInRodW1iRmlsbCIsInRodW1iRmlsbEhpZ2hsaWdodGVkIiwidGh1bWJTdHJva2UiLCJ0aHVtYkxpbmVXaWR0aCIsInRodW1iQ2VudGVyTGluZVN0cm9rZSIsInRodW1iVG91Y2hBcmVhWERpbGF0aW9uIiwidGh1bWJUb3VjaEFyZWFZRGlsYXRpb24iLCJ0aHVtYk1vdXNlQXJlYVhEaWxhdGlvbiIsInRodW1iTW91c2VBcmVhWURpbGF0aW9uIiwidGh1bWJZT2Zmc2V0IiwidGlja0xhYmVsU3BhY2luZyIsIm1ham9yVGlja0xlbmd0aCIsIm1ham9yVGlja1N0cm9rZSIsIm1ham9yVGlja0xpbmVXaWR0aCIsIm1pbm9yVGlja0xlbmd0aCIsIm1pbm9yVGlja1N0cm9rZSIsIm1pbm9yVGlja0xpbmVXaWR0aCIsImN1cnNvciIsInN0YXJ0RHJhZyIsIl8iLCJub29wIiwiZHJhZyIsImVuZERyYWciLCJjb25zdHJhaW5WYWx1ZSIsImlkZW50aXR5IiwiZGlzYWJsZWRPcGFjaXR5IiwiRElTQUJMRURfT1BBQ0lUWSIsInNvdW5kR2VuZXJhdG9yIiwidmFsdWVDaGFuZ2VTb3VuZEdlbmVyYXRvck9wdGlvbnMiLCJwaGV0aW9MaW5rZWRQcm9wZXJ0eSIsInRhbmRlbSIsIlJFUVVJUkVEIiwidGFuZGVtTmFtZVN1ZmZpeCIsInBoZXRpb1R5cGUiLCJTbGlkZXJJTyIsInBoZXRpb0ZlYXR1cmVkIiwidmlzaWJsZVByb3BlcnR5T3B0aW9ucyIsInBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCIsInJhbmdlUHJvcGVydHkiLCJpc0VtcHR5IiwidmFsdWUiLCJOT19TT1VORCIsInByZXZpb3VzVmFsdWUiLCJwcm92aWRlZERyYWciLCJldmVudCIsImlzRnJvbVBET00iLCJwbGF5U291bmRGb3JWYWx1ZUNoYW5nZSIsInBsYXlTb3VuZElmVGhyZXNob2xkUmVhY2hlZCIsIlZFUlRJQ0FMIiwic3dhcHBlZCIsInRodW1iVGFuZGVtIiwiY3JlYXRlVGFuZGVtIiwiVEhVTUJfTk9ERV9UQU5ERU1fTkFNRSIsIlZBTElEQVRJT04iLCJlcXVhbHMiLCJwaGV0aW9JRCIsInRodW1iIiwic2l6ZSIsImZpbGwiLCJmaWxsSGlnaGxpZ2h0ZWQiLCJzdHJva2UiLCJsaW5lV2lkdGgiLCJjZW50ZXJMaW5lU3Ryb2tlIiwib3duc0VuYWJsZWRSYW5nZVByb3BlcnR5IiwiZW5hYmxlZFJhbmdlUHJvcGVydHkiLCJib3VuZHNSZXF1aXJlZE9wdGlvbktleXMiLCJwaWNrIiwiUkVRVUlSRVNfQk9VTkRTX09QVElPTl9LRVlTIiwic3VwZXJPcHRpb25zIiwiYXJpYU9yaWVudGF0aW9uIiwicGFuVGFyZ2V0Tm9kZSIsInZhbHVlVHlwZSIsImlzVmFsaWRWYWx1ZSIsIm1pbiIsIm1heCIsInBoZXRpb1ZhbHVlVHlwZSIsIlJhbmdlSU8iLCJwaGV0aW9Eb2N1bWVudGF0aW9uIiwidGlja09wdGlvbnMiLCJzbGlkZXJQYXJ0cyIsIm1ham9yVGlja3NQYXJlbnQiLCJtaW5vclRpY2tzUGFyZW50IiwicHVzaCIsInRyYWNrVGFuZGVtIiwiVFJBQ0tfTk9ERV9UQU5ERU1fTkFNRSIsInRyYWNrU3BhY2VyIiwidHJhY2siLCJmaWxsRW5hYmxlZCIsImZpbGxEaXNhYmxlZCIsImNvcm5lclJhZGl1cyIsInBpY2thYmxlIiwidm9pY2luZ09uRW5kUmVzcG9uc2UiLCJiaW5kIiwic2V0Q2VudGVyWSIsImNlbnRlclkiLCJzbGlkZXJQYXJ0c05vZGUiLCJjaGlsZHJlbiIsInJvdGF0aW9uIiwiU0xJREVSX1ZFUlRJQ0FMX1JPVEFUSU9OIiwiYWRkQ2hpbGQiLCJ0b3VjaEFyZWEiLCJsb2NhbEJvdW5kcyIsImRpbGF0ZWRYWSIsIm1vdXNlQXJlYSIsImNsaWNrWE9mZnNldCIsInZhbHVlT25TdGFydCIsInRodW1iRHJhZ0xpc3RlbmVyIiwic3RhcnQiLCJsaXN0ZW5lciIsImVuYWJsZWRQcm9wZXJ0eSIsImdldCIsInRyYW5zZm9ybSIsInByZXNzZWRUcmFpbCIsInN1YnRyYWlsVG8iLCJnZXRUcmFuc2Zvcm0iLCJpbnZlcnNlUG9zaXRpb24yIiwicG9pbnRlciIsInBvaW50IiwieCIsImNlbnRlclgiLCJ2YWx1ZVRvUG9zaXRpb25Qcm9wZXJ0eSIsImludmVyc2UiLCJ2YWx1ZUluUmFuZ2UiLCJzZXQiLCJlbmQiLCJhZGRJbnB1dExpc3RlbmVyIiwidHJhY2tEcmFnTGlzdGVuZXIiLCJkcmFnTGlzdGVuZXIiLCJ2YWx1ZU11bHRpbGluayIsIm11bHRpbGluayIsInZhbHVlVG9Qb3NpdGlvbiIsImV2YWx1YXRlIiwiZW5hYmxlZFJhbmdlT2JzZXJ2ZXIiLCJlbmFibGVkUmFuZ2UiLCJpc1BoZXRpb0luc3RydW1lbnRlZCIsImNsYW1wIiwicHJvcG9zZWRWYWx1ZUluRW5hYmxlZFJhbmdlIiwicHJvcG9zZWRWYWx1ZUluQ29uc3RyYWluZWRSYW5nZSIsImxpbmsiLCJjb25zdHJhaW50IiwiU2xpZGVyQ29uc3RyYWludCIsImRpc3Bvc2VTbGlkZXIiLCJkaXNwb3NlIiwidW5saW5rIiwiZm9jdXNIaWdobGlnaHQiLCJsaW5rZWRQcm9wZXJ0eSIsImFkZExpbmtlZEVsZW1lbnQiLCJ0YW5kZW1OYW1lIiwibXV0YXRlIiwicGhldCIsImNoaXBwZXIiLCJxdWVyeVBhcmFtZXRlcnMiLCJiaW5kZXIiLCJyZWdpc3RlckRhdGFVUkwiLCJtYWpvclRpY2tzVmlzaWJsZSIsImdldE1ham9yVGlja3NWaXNpYmxlIiwic2V0TWFqb3JUaWNrc1Zpc2libGUiLCJtaW5vclRpY2tzVmlzaWJsZSIsImdldE1pbm9yVGlja3NWaXNpYmxlIiwic2V0TWlub3JUaWNrc1Zpc2libGUiLCJmb3JFYWNoIiwidGljayIsImFkZE1ham9yVGljayIsImxhYmVsIiwiYWRkVGljayIsImFkZE1pbm9yVGljayIsInBhcmVudCIsImxlbmd0aCIsInZpc2libGUiLCJkb2N1bWVudGF0aW9uIiwic3VwZXJ0eXBlIiwiTm9kZUlPIiwic2xpZGVyIiwiaGVpZ2h0U2l6YWJsZSIsInByZWZlcnJlZFByb3BlcnR5IiwibG9jYWxQcmVmZXJyZWRXaWR0aFByb3BlcnR5Iiwid2lkdGhTaXphYmxlIiwibG9jYWxQcmVmZXJyZWRIZWlnaHRQcm9wZXJ0eSIsImxhenlMaW5rIiwiX3VwZGF0ZUxheW91dExpc3RlbmVyIiwibG9jYWxCb3VuZHNQcm9wZXJ0eSIsInRpY2tBZGRlZExpc3RlbmVyIiwiYWRkZWRUaWNrIiwidGlja05vZGUiLCJhZGRJdGVtUmVtb3ZlZExpc3RlbmVyIiwicmVtb3ZlZFRpY2siLCJoYXNMaXN0ZW5lciIsImFkZEl0ZW1BZGRlZExpc3RlbmVyIiwiYWRkTm9kZSIsImxheW91dCIsImRpc3Bvc2VTbGlkZXJDb25zdHJhaW50IiwicmVtb3ZlSXRlbUFkZGVkTGlzdGVuZXIiLCJkaWxhdGVkWCIsIndpZHRoIiwibWluaW11bVdpZHRoIiwidG90YWxPdmVyZmxvdyIsImxlZnRWaXN1YWxPdmVyZmxvdyIsInJpZ2h0VmlzdWFsT3ZlcmZsb3ciLCJ0cmFja01pbmltdW1FeHRlcmlvcldpZHRoIiwidHJhY2tNaW5pbXVtSW50ZXJpb3JXaWR0aCIsIm5vcm1hbGl6ZVRpY2tWYWx1ZSIsImxpbmVhciIsImxlZnRFeHRlcmlvck9mZnNldCIsInJpZ2h0RXh0ZXJpb3JPZmZzZXQiLCJtaW5pbXVtUmFuZ2UiLCJ0aWNrTWluaW11bVBvc2l0aW9uIiwiaGFsZlRpY2tXaWR0aCIsImluY2x1ZGVSYW5nZSIsInNoaWZ0ZWQiLCJ0cmFja1dpZHRoVG9GdWxsV2lkdGhGdW5jdGlvbiIsIm1hcCIsIm5vcm1hbGl6ZWRUaWNrVmFsdWUiLCJtaW51cyIsImNvbnN0YW50IiwiZnVsbFdpZHRoVG9UcmFja1dpZHRoRnVuY3Rpb24iLCJ3aXRoWFZhbHVlcyIsInBvaW50cyIsImZpbHRlciIsImludmVydGVkIiwicHJlZmVycmVkV2lkdGgiLCJNYXRoIiwiZ2V0TGVuZ3RoIiwibG9jYWxNaW5pbXVtV2lkdGgiLCJsb2NhbE1pbmltdW1IZWlnaHQiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlNsaWRlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxMy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBTbGlkZXIsIHdpdGggc3VwcG9ydCBmb3IgaG9yaXpvbnRhbCBhbmQgdmVydGljYWwgb3JpZW50YXRpb25zLiBCeSBkZWZhdWx0LCB0aGUgc2xpZGVyIGlzIGNvbnN0cnVjdGVkIGluIHRoZVxyXG4gKiBob3Jpem9udGFsIG9yaWVudGF0aW9uLCB0aGVuIGFkanVzdGVkIGlmIHRoZSB2ZXJ0aWNhbCBvcmllbnRhdGlvbiB3YXMgc3BlY2lmaWVkLlxyXG4gKlxyXG4gKiBOb3RlOiBUaGlzIHR5cGUgd2FzIG9yaWdpbmFsbHkgbmFtZWQgSFNsaWRlciwgcmVuYW1lZCBpbiBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc3VuL2lzc3Vlcy8zODAuXHJcbiAqXHJcbiAqIEBhdXRob3IgQ2hyaXMgTWFsbGV5IChQaXhlbFpvb20sIEluYy4pXHJcbiAqL1xyXG5cclxuaW1wb3J0IFN0cmljdE9taXQgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1N0cmljdE9taXQuanMnO1xyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9SZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IERpbWVuc2lvbjIgZnJvbSAnLi4vLi4vZG90L2pzL0RpbWVuc2lvbjIuanMnO1xyXG5pbXBvcnQgQ29tcGxldGVQaWVjZXdpc2VMaW5lYXJGdW5jdGlvbiBmcm9tICcuLi8uLi9kb3QvanMvQ29tcGxldGVQaWVjZXdpc2VMaW5lYXJGdW5jdGlvbi5qcyc7XHJcbmltcG9ydCBSYW5nZSBmcm9tICcuLi8uLi9kb3QvanMvUmFuZ2UuanMnO1xyXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vZG90L2pzL1V0aWxzLmpzJztcclxuaW1wb3J0IGFzc2VydE11dHVhbGx5RXhjbHVzaXZlT3B0aW9ucyBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zLmpzJztcclxuaW1wb3J0IEluc3RhbmNlUmVnaXN0cnkgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL2RvY3VtZW50YXRpb24vSW5zdGFuY2VSZWdpc3RyeS5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUsIHsgY29tYmluZU9wdGlvbnMgfSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IE9yaWVudGF0aW9uIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9PcmllbnRhdGlvbi5qcyc7XHJcbmltcG9ydCBzd2FwT2JqZWN0S2V5cyBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvc3dhcE9iamVjdEtleXMuanMnO1xyXG5pbXBvcnQgeyBEcmFnTGlzdGVuZXIsIEhpZ2hsaWdodEZyb21Ob2RlLCBMYXlvdXRDb25zdHJhaW50LCBOb2RlLCBOb2RlT3B0aW9ucywgU2NlbmVyeUNvbnN0YW50cywgU2l6YWJsZSwgVFBhaW50IH0gZnJvbSAnLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuaW1wb3J0IElPVHlwZSBmcm9tICcuLi8uLi90YW5kZW0vanMvdHlwZXMvSU9UeXBlLmpzJztcclxuaW1wb3J0IFZhbHVlQ2hhbmdlU291bmRQbGF5ZXIsIHsgVmFsdWVDaGFuZ2VTb3VuZFBsYXllck9wdGlvbnMgfSBmcm9tICcuLi8uLi90YW1iby9qcy9zb3VuZC1nZW5lcmF0b3JzL1ZhbHVlQ2hhbmdlU291bmRQbGF5ZXIuanMnO1xyXG5pbXBvcnQgQWNjZXNzaWJsZVNsaWRlciwgeyBBY2Nlc3NpYmxlU2xpZGVyT3B0aW9ucyB9IGZyb20gJy4vYWNjZXNzaWJpbGl0eS9BY2Nlc3NpYmxlU2xpZGVyLmpzJztcclxuaW1wb3J0IERlZmF1bHRTbGlkZXJUcmFjayBmcm9tICcuL0RlZmF1bHRTbGlkZXJUcmFjay5qcyc7XHJcbmltcG9ydCBTbGlkZXJUaHVtYiBmcm9tICcuL1NsaWRlclRodW1iLmpzJztcclxuaW1wb3J0IFNsaWRlclRyYWNrIGZyb20gJy4vU2xpZGVyVHJhY2suanMnO1xyXG5pbXBvcnQgU2xpZGVyVGljaywgeyBTbGlkZXJUaWNrT3B0aW9ucyB9IGZyb20gJy4vU2xpZGVyVGljay5qcyc7XHJcbmltcG9ydCBzdW4gZnJvbSAnLi9zdW4uanMnO1xyXG5pbXBvcnQgUGlja09wdGlvbmFsIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9QaWNrT3B0aW9uYWwuanMnO1xyXG5pbXBvcnQgTXVsdGlsaW5rIGZyb20gJy4uLy4uL2F4b24vanMvTXVsdGlsaW5rLmpzJztcclxuaW1wb3J0IFRQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1RQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUaW55UHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9UaW55UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgU3VuQ29uc3RhbnRzIGZyb20gJy4vU3VuQ29uc3RhbnRzLmpzJztcclxuaW1wb3J0IGNyZWF0ZU9ic2VydmFibGVBcnJheSwgeyBPYnNlcnZhYmxlQXJyYXkgfSBmcm9tICcuLi8uLi9heG9uL2pzL2NyZWF0ZU9ic2VydmFibGVBcnJheS5qcyc7XHJcbmltcG9ydCBQaWNrUmVxdWlyZWQgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1BpY2tSZXF1aXJlZC5qcyc7XHJcbmltcG9ydCBpc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5IGZyb20gJy4uLy4uL3RhbmRlbS9qcy9pc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5LmpzJztcclxuaW1wb3J0IFBoZXRpb09iamVjdCBmcm9tICcuLi8uLi90YW5kZW0vanMvUGhldGlvT2JqZWN0LmpzJztcclxuaW1wb3J0IFBoZXRpb1Byb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvUGhldGlvUHJvcGVydHkuanMnO1xyXG5cclxuLy8gY29uc3RhbnRzXHJcbmNvbnN0IERFRkFVTFRfSE9SSVpPTlRBTF9UUkFDS19TSVpFID0gbmV3IERpbWVuc2lvbjIoIDEwMCwgNSApO1xyXG5jb25zdCBERUZBVUxUX0hPUklaT05UQUxfVEhVTUJfU0laRSA9IG5ldyBEaW1lbnNpb24yKCAxNywgMzQgKTtcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcbiAgb3JpZW50YXRpb24/OiBPcmllbnRhdGlvbjtcclxuXHJcbiAgLy8gb3B0aW9uYWwgdHJhY2ssIHJlcGxhY2VzIHRoZSBkZWZhdWx0LlxyXG4gIC8vIENsaWVudCBpcyByZXNwb25zaWJsZSBmb3IgaGlnaGxpZ2h0aW5nLCBkaXNhYmxlIGFuZCBwb2ludGVyIGFyZWFzLlxyXG4gIC8vIEZvciBpbnN0cnVtZW50ZWQgU2xpZGVycywgYSBzdXBwbGllZCB0cmFja05vZGUgbXVzdCBiZSBpbnN0cnVtZW50ZWQuXHJcbiAgLy8gVGhlIHRhbmRlbSBjb21wb25lbnQgbmFtZSBtdXN0IGJlIFNsaWRlci5UUkFDS19OT0RFX1RBTkRFTV9OQU1FIGFuZCBpdCBtdXN0IGJlIG5lc3RlZCB1bmRlciB0aGUgU2xpZGVyIHRhbmRlbS5cclxuICB0cmFja05vZGU/OiBTbGlkZXJUcmFjayB8IG51bGw7XHJcblxyXG4gIC8vIHRyYWNrIC0gb3B0aW9ucyB0byBjcmVhdGUgYSBTbGlkZXJUcmFjayBpZiB0cmFja05vZGUgbm90IHN1cHBsaWVkXHJcbiAgdHJhY2tTaXplPzogRGltZW5zaW9uMiB8IG51bGw7IC8vIHNwZWNpZmljIHRvIG9yaWVudGF0aW9uLCB3aWxsIGJlIGZpbGxlZCBpbiB3aXRoIGEgZGVmYXVsdCBpZiBub3QgcHJvdmlkZWRcclxuICB0cmFja0ZpbGxFbmFibGVkPzogVFBhaW50O1xyXG4gIHRyYWNrRmlsbERpc2FibGVkPzogVFBhaW50O1xyXG4gIHRyYWNrU3Ryb2tlPzogVFBhaW50O1xyXG4gIHRyYWNrTGluZVdpZHRoPzogbnVtYmVyO1xyXG4gIHRyYWNrQ29ybmVyUmFkaXVzPzogbnVtYmVyO1xyXG4gIHRyYWNrUGlja2FibGU/OiBib29sZWFuOyAvLyBNYXkgYmUgc2V0IHRvIGZhbHNlIGlmIGEgc2xpZGVyIHRyYWNrIGlzIG5vdCB2aXNpYmxlIGFuZCB1c2VyIGludGVyYWN0aW9uIGlzIHRoZXJlZm9yZSB1bmRlc2lyYWJsZS5cclxuXHJcbiAgLy8gb3B0aW9uYWwgdGh1bWIsIHJlcGxhY2VzIHRoZSBkZWZhdWx0LlxyXG4gIC8vIENsaWVudCBpcyByZXNwb25zaWJsZSBmb3IgaGlnaGxpZ2h0aW5nLCBkaXNhYmxpbmcgYW5kIHBvaW50ZXIgYXJlYXMuXHJcbiAgLy8gVGhlIHRodW1iIGlzIHBvc2l0aW9uZWQgYmFzZWQgb24gaXRzIGNlbnRlciBhbmQgaGVuY2UgY2FuIGhhdmUgaXRzIG9yaWdpbiBhbnl3aGVyZVxyXG4gIC8vIE5vdGUgZm9yIFBoRVQtSU86IFRoaXMgdGh1bWJOb2RlIHNob3VsZCBiZSBpbnN0cnVtZW50ZWQuIFRoZSB0aHVtYidzIGRyYWdMaXN0ZW5lciBpcyBpbnN0cnVtZW50ZWQgdW5kZXJuZWF0aFxyXG4gIC8vIHRoaXMgdGh1bWJOb2RlLiBUaGUgdGFuZGVtIGNvbXBvbmVudCBuYW1lIG11c3QgYmUgU2xpZGVyLlRIVU1CX05PREVfVEFOREVNX05BTUUgYW5kIGl0IG11c3QgYmUgbmVzdGVkIHVuZGVyXHJcbiAgLy8gdGhlIFNsaWRlciB0YW5kZW0uXHJcbiAgdGh1bWJOb2RlPzogTm9kZSB8IG51bGw7XHJcblxyXG4gIC8vIE9wdGlvbnMgZm9yIHRoZSBkZWZhdWx0IHRodW1iLCBpZ25vcmVkIGlmIHRodW1iTm9kZSBpcyBzZXRcclxuICB0aHVtYlNpemU/OiBEaW1lbnNpb24yIHwgbnVsbDsgLy8gc3BlY2lmaWMgdG8gb3JpZW50YXRpb24sIHdpbGwgYmUgZmlsbGVkIGluIHdpdGggYSBkZWZhdWx0IGlmIG5vdCBwcm92aWRlZFxyXG4gIHRodW1iRmlsbD86IFRQYWludDtcclxuICB0aHVtYkZpbGxIaWdobGlnaHRlZD86IFRQYWludDtcclxuICB0aHVtYlN0cm9rZT86IFRQYWludDtcclxuICB0aHVtYkxpbmVXaWR0aD86IG51bWJlcjtcclxuICB0aHVtYkNlbnRlckxpbmVTdHJva2U/OiBUUGFpbnQ7XHJcblxyXG4gIC8vIGRpbGF0aW9ucyBhcmUgc3BlY2lmaWMgdG8gb3JpZW50YXRpb25cclxuICB0aHVtYlRvdWNoQXJlYVhEaWxhdGlvbj86IG51bWJlcjtcclxuICB0aHVtYlRvdWNoQXJlYVlEaWxhdGlvbj86IG51bWJlcjtcclxuICB0aHVtYk1vdXNlQXJlYVhEaWxhdGlvbj86IG51bWJlcjtcclxuICB0aHVtYk1vdXNlQXJlYVlEaWxhdGlvbj86IG51bWJlcjtcclxuXHJcbiAgLy8gQXBwbGllZCB0byBkZWZhdWx0IG9yIHN1cHBsaWVkIHRodW1iXHJcbiAgdGh1bWJZT2Zmc2V0PzogbnVtYmVyOyAvLyBjZW50ZXIgb2YgdGhlIHRodW1iIGlzIHZlcnRpY2FsbHkgb2Zmc2V0IGJ5IHRoaXMgYW1vdW50IGZyb20gdGhlIGNlbnRlciBvZiB0aGUgdHJhY2tcclxuXHJcbiAgY3Vyc29yPzogc3RyaW5nO1xyXG5cclxuICAvLyBvcGFjaXR5IGFwcGxpZWQgdG8gdGhlIGVudGlyZSBTbGlkZXIgd2hlbiBkaXNhYmxlZFxyXG4gIGRpc2FibGVkT3BhY2l0eT86IG51bWJlcjtcclxuXHJcbiAgLy8gSWYgcHJvdmlkZWQsIGNyZWF0ZSBhIExpbmtlZEVsZW1lbnQgZm9yIHRoaXMgUGhFVC1pTyBpbnN0cnVtZW50ZWQgUHJvcGVydHksIGluc3RlYWRcclxuICAvLyBvZiB1c2luZyB0aGUgcGFzc2VkIGluIFByb3BlcnR5LiBUaGlzIG9wdGlvbiB3YXMgY3JlYXRlZCB0byBzdXBwb3J0IHBhc3NpbmcgRHluYW1pY1Byb3BlcnR5IG9yIFwid3JhcHBpbmdcIlxyXG4gIC8vIFByb3BlcnR5IHRoYXQgYXJlIFwiaW1wbGVtZW50YXRpb24gIGRldGFpbHNcIiB0byB0aGUgUGhFVC1pTyBBUEksIGFuZCBzdGlsbCBzdXBwb3J0IGhhdmluZyBhIExpbmtlZEVsZW1lbnQgdGhhdFxyXG4gIC8vIHBvaW50cyB0byB0aGUgdW5kZXJseWluZyBtb2RlbCBQcm9wZXJ0eS5cclxuICBwaGV0aW9MaW5rZWRQcm9wZXJ0eT86IFBoZXRpb09iamVjdCB8IG51bGw7XHJcblxyXG4gIC8vIFRoaXMgaXMgdXNlZCB0byBnZW5lcmF0ZSBzb3VuZHMgYXMgdGhlIHNsaWRlciBpcyBtb3ZlZCBieSB0aGUgdXNlci4gIElmIG5vdCBwcm92aWRlZCwgdGhlIGRlZmF1bHQgc291bmQgZ2VuZXJhdG9yXHJcbiAgLy8gd2lsbCBiZSBjcmVhdGVkLiBJZiBzZXQgdG8gbnVsbCwgdGhlIHNsaWRlciB3aWxsIGdlbmVyYXRlIG5vIHNvdW5kLlxyXG4gIHNvdW5kR2VuZXJhdG9yPzogVmFsdWVDaGFuZ2VTb3VuZFBsYXllciB8IG51bGw7XHJcblxyXG4gIC8vIE9wdGlvbnMgZm9yIHRoZSBkZWZhdWx0IHNvdW5kIGdlbmVyYXRvci4gIFRoZXNlIHNob3VsZCBvbmx5IGJlIHByb3ZpZGVkIHdoZW4gdXNpbmcgdGhlIGRlZmF1bHQuXHJcbiAgdmFsdWVDaGFuZ2VTb3VuZEdlbmVyYXRvck9wdGlvbnM/OiBWYWx1ZUNoYW5nZVNvdW5kUGxheWVyT3B0aW9ucztcclxufSAmIFNsaWRlclRpY2tPcHRpb25zO1xyXG5cclxudHlwZSBQYXJlbnRPcHRpb25zID0gQWNjZXNzaWJsZVNsaWRlck9wdGlvbnMgJiBOb2RlT3B0aW9ucztcclxuXHJcbnR5cGUgUmVxdWlyZWRQYXJlbnRPcHRpb25zU3VwcGxpZWRCeVNsaWRlciA9ICdwYW5UYXJnZXROb2RlJyB8ICd2YWx1ZVByb3BlcnR5JyB8ICdlbmFibGVkUmFuZ2VQcm9wZXJ0eScgfCAnYXJpYU9yaWVudGF0aW9uJztcclxudHlwZSBPcHRpb25hbFBhcmVudE9wdGlvbnMgPSBTdHJpY3RPbWl0PFBhcmVudE9wdGlvbnMsIFJlcXVpcmVkUGFyZW50T3B0aW9uc1N1cHBsaWVkQnlTbGlkZXI+O1xyXG5cclxuLy8gV2UgcHJvdmlkZSB0aGVzZSBvcHRpb25zIHRvIHRoZSBzdXBlciwgYWxzbyBlbmFibGVkUmFuZ2VQcm9wZXJ0eSBpcyB0dXJuZWQgZnJvbSByZXF1aXJlZCB0byBvcHRpb25hbFxyXG5leHBvcnQgdHlwZSBTbGlkZXJPcHRpb25zID0gU2VsZk9wdGlvbnMgJiBPcHRpb25hbFBhcmVudE9wdGlvbnMgJiBQaWNrT3B0aW9uYWw8UGFyZW50T3B0aW9ucywgJ2VuYWJsZWRSYW5nZVByb3BlcnR5Jz47XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTbGlkZXIgZXh0ZW5kcyBTaXphYmxlKCBBY2Nlc3NpYmxlU2xpZGVyKCBOb2RlLCAwICkgKSB7XHJcblxyXG4gIHB1YmxpYyByZWFkb25seSBlbmFibGVkUmFuZ2VQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8UmFuZ2U+O1xyXG5cclxuICAvLyBwdWJsaWMgc28gdGhhdCBjbGllbnRzIGNhbiBhY2Nlc3MgUHJvcGVydGllcyBvZiB0aGVzZSBEcmFnTGlzdGVuZXJzIHRoYXQgdGVsbCB1cyBhYm91dCBpdHMgc3RhdGVcclxuICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3N1bi9pc3N1ZXMvNjgwXHJcbiAgcHVibGljIHJlYWRvbmx5IHRodW1iRHJhZ0xpc3RlbmVyOiBEcmFnTGlzdGVuZXI7XHJcbiAgcHVibGljIHJlYWRvbmx5IHRyYWNrRHJhZ0xpc3RlbmVyOiBEcmFnTGlzdGVuZXI7XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgb3JpZW50YXRpb246IE9yaWVudGF0aW9uO1xyXG5cclxuICAvLyBvcHRpb25zIG5lZWRlZCBieSBwcm90b3R5cGUgZnVuY3Rpb25zIHRoYXQgYWRkIHRpY2tzXHJcbiAgcHJpdmF0ZSByZWFkb25seSB0aWNrT3B0aW9uczogUmVxdWlyZWQ8U2xpZGVyVGlja09wdGlvbnM+O1xyXG5cclxuICAvLyB0aWNrcyBhcmUgYWRkZWQgdG8gdGhlc2UgcGFyZW50cywgc28gdGhleSBhcmUgYmVoaW5kIHRoZSBrbm9iXHJcbiAgcHJpdmF0ZSByZWFkb25seSBtYWpvclRpY2tzUGFyZW50OiBOb2RlO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgbWlub3JUaWNrc1BhcmVudDogTm9kZTtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSB0cmFjazogU2xpZGVyVHJhY2s7XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzcG9zZVNsaWRlcjogKCkgPT4gdm9pZDtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSB0aWNrczogT2JzZXJ2YWJsZUFycmF5PFNsaWRlclRpY2s+ID0gY3JlYXRlT2JzZXJ2YWJsZUFycmF5KCk7XHJcblxyXG4gIC8vIFRoZSBkZWZhdWx0IHNvdW5kIHVzZWQgaWYgb3B0aW9ucy5zb3VuZEdlbmVyYXRvciBpcyBub3Qgc2V0LlxyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9TT1VORF9HRU5FUkFUT1IgPSBuZXcgVmFsdWVDaGFuZ2VTb3VuZFBsYXllciggbmV3IFJhbmdlKCAwLCAxICkgKTtcclxuXHJcbiAgLy8gSWYgdGhlIHVzZXIgaXMgaG9sZGluZyBkb3duIHRoZSB0aHVtYiBvdXRzaWRlIG9mIHRoZSBlbmFibGVkIHJhbmdlLCBhbmQgdGhlIGVuYWJsZWQgcmFuZ2UgZXhwYW5kcywgdGhlIHZhbHVlIHNob3VsZFxyXG4gIC8vIGFkanVzdCB0byB0aGUgbmV3IGV4dHJlbXVtIG9mIHRoZSByYW5nZSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9tZWFuLXNoYXJlLWFuZC1iYWxhbmNlL2lzc3Vlcy8yOVxyXG4gIC8vIFRoaXMgdmFsdWUgaXMgc2V0IGR1cmluZyB0aHVtYiBkcmFnLCBvciBudWxsIGlmIG5vdCBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZC5cclxuICBwcml2YXRlIHByb3Bvc2VkVmFsdWU6IG51bWJlciB8IG51bGwgPSBudWxsO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHZhbHVlUHJvcGVydHk6IFBoZXRpb1Byb3BlcnR5PG51bWJlcj4sXHJcbiAgICAgICAgICAgICAgICAgICAgICByYW5nZTogUmFuZ2UgfCBUUmVhZE9ubHlQcm9wZXJ0eTxSYW5nZT4sXHJcbiAgICAgICAgICAgICAgICAgICAgICBwcm92aWRlZE9wdGlvbnM/OiBTbGlkZXJPcHRpb25zICkge1xyXG5cclxuICAgIC8vIEd1YXJkIGFnYWluc3QgbXV0dWFsbHkgZXhjbHVzaXZlIG9wdGlvbnMgYmVmb3JlIGRlZmF1bHRzIGFyZSBmaWxsZWQgaW4uXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zKCBwcm92aWRlZE9wdGlvbnMsIFsgJ3RodW1iTm9kZScgXSwgW1xyXG4gICAgICAndGh1bWJTaXplJywgJ3RodW1iRmlsbCcsICd0aHVtYkZpbGxIaWdobGlnaHRlZCcsICd0aHVtYlN0cm9rZScsICd0aHVtYkxpbmVXaWR0aCcsICd0aHVtYkNlbnRlckxpbmVTdHJva2UnLFxyXG4gICAgICAndGh1bWJUb3VjaEFyZWFYRGlsYXRpb24nLCAndGh1bWJUb3VjaEFyZWFZRGlsYXRpb24nLCAndGh1bWJNb3VzZUFyZWFYRGlsYXRpb24nLCAndGh1bWJNb3VzZUFyZWFZRGlsYXRpb24nXHJcbiAgICBdICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydE11dHVhbGx5RXhjbHVzaXZlT3B0aW9ucyggcHJvdmlkZWRPcHRpb25zLCBbICd0cmFja05vZGUnIF0sIFtcclxuICAgICAgJ3RyYWNrU2l6ZScsICd0cmFja0ZpbGxFbmFibGVkJywgJ3RyYWNrRmlsbERpc2FibGVkJywgJ3RyYWNrU3Ryb2tlJywgJ3RyYWNrTGluZVdpZHRoJywgJ3RyYWNrQ29ybmVyUmFkaXVzJyBdICk7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxTbGlkZXJPcHRpb25zLCBTZWxmT3B0aW9ucywgT3B0aW9uYWxQYXJlbnRPcHRpb25zPigpKCB7XHJcblxyXG4gICAgICBvcmllbnRhdGlvbjogT3JpZW50YXRpb24uSE9SSVpPTlRBTCxcclxuICAgICAgdHJhY2tOb2RlOiBudWxsLFxyXG5cclxuICAgICAgdHJhY2tTaXplOiBudWxsLFxyXG4gICAgICB0cmFja0ZpbGxFbmFibGVkOiAnd2hpdGUnLFxyXG4gICAgICB0cmFja0ZpbGxEaXNhYmxlZDogJ2dyYXknLFxyXG4gICAgICB0cmFja1N0cm9rZTogJ2JsYWNrJyxcclxuICAgICAgdHJhY2tMaW5lV2lkdGg6IDEsXHJcbiAgICAgIHRyYWNrQ29ybmVyUmFkaXVzOiAwLFxyXG4gICAgICB0cmFja1BpY2thYmxlOiB0cnVlLFxyXG5cclxuICAgICAgdGh1bWJOb2RlOiBudWxsLFxyXG5cclxuICAgICAgdGh1bWJTaXplOiBudWxsLFxyXG4gICAgICB0aHVtYkZpbGw6ICdyZ2IoNTAsMTQ1LDE4NCknLFxyXG4gICAgICB0aHVtYkZpbGxIaWdobGlnaHRlZDogJ3JnYig3MSwyMDcsMjU1KScsXHJcbiAgICAgIHRodW1iU3Ryb2tlOiAnYmxhY2snLFxyXG4gICAgICB0aHVtYkxpbmVXaWR0aDogMSxcclxuICAgICAgdGh1bWJDZW50ZXJMaW5lU3Ryb2tlOiAnd2hpdGUnLFxyXG5cclxuICAgICAgdGh1bWJUb3VjaEFyZWFYRGlsYXRpb246IDExLFxyXG4gICAgICB0aHVtYlRvdWNoQXJlYVlEaWxhdGlvbjogMTEsXHJcbiAgICAgIHRodW1iTW91c2VBcmVhWERpbGF0aW9uOiAwLFxyXG4gICAgICB0aHVtYk1vdXNlQXJlYVlEaWxhdGlvbjogMCxcclxuXHJcbiAgICAgIHRodW1iWU9mZnNldDogMCxcclxuXHJcbiAgICAgIHRpY2tMYWJlbFNwYWNpbmc6IDYsXHJcbiAgICAgIG1ham9yVGlja0xlbmd0aDogMjUsXHJcbiAgICAgIG1ham9yVGlja1N0cm9rZTogJ2JsYWNrJyxcclxuICAgICAgbWFqb3JUaWNrTGluZVdpZHRoOiAxLFxyXG4gICAgICBtaW5vclRpY2tMZW5ndGg6IDEwLFxyXG4gICAgICBtaW5vclRpY2tTdHJva2U6ICdibGFjaycsXHJcbiAgICAgIG1pbm9yVGlja0xpbmVXaWR0aDogMSxcclxuXHJcbiAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxyXG4gICAgICBzdGFydERyYWc6IF8ubm9vcCxcclxuICAgICAgZHJhZzogXy5ub29wLFxyXG4gICAgICBlbmREcmFnOiBfLm5vb3AsXHJcbiAgICAgIGNvbnN0cmFpblZhbHVlOiBfLmlkZW50aXR5LFxyXG5cclxuICAgICAgZGlzYWJsZWRPcGFjaXR5OiBTY2VuZXJ5Q29uc3RhbnRzLkRJU0FCTEVEX09QQUNJVFksXHJcblxyXG4gICAgICBzb3VuZEdlbmVyYXRvcjogU2xpZGVyLkRFRkFVTFRfU09VTkRfR0VORVJBVE9SLFxyXG4gICAgICB2YWx1ZUNoYW5nZVNvdW5kR2VuZXJhdG9yT3B0aW9uczoge30sXHJcblxyXG4gICAgICAvLyBwaGV0LWlvXHJcbiAgICAgIHBoZXRpb0xpbmtlZFByb3BlcnR5OiBudWxsLFxyXG5cclxuICAgICAgLy8gU3VwZXJ0eXBlIG9wdGlvbnNcclxuICAgICAgdGFuZGVtOiBUYW5kZW0uUkVRVUlSRUQsXHJcbiAgICAgIHRhbmRlbU5hbWVTdWZmaXg6ICdTbGlkZXInLFxyXG4gICAgICBwaGV0aW9UeXBlOiBTbGlkZXIuU2xpZGVySU8sXHJcbiAgICAgIHBoZXRpb0ZlYXR1cmVkOiB0cnVlLFxyXG4gICAgICB2aXNpYmxlUHJvcGVydHlPcHRpb25zOiB7IHBoZXRpb0ZlYXR1cmVkOiB0cnVlIH0sXHJcbiAgICAgIHBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZDogdHJ1ZSAvLyBvcHQgaW50byBkZWZhdWx0IFBoRVQtaU8gaW5zdHJ1bWVudGVkIGVuYWJsZWRQcm9wZXJ0eVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgY29uc3QgcmFuZ2VQcm9wZXJ0eSA9IHJhbmdlIGluc3RhbmNlb2YgUmFuZ2UgPyBuZXcgVGlueVByb3BlcnR5KCByYW5nZSApIDogcmFuZ2U7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5zb3VuZEdlbmVyYXRvciA9PT0gU2xpZGVyLkRFRkFVTFRfU09VTkRfR0VORVJBVE9SIHx8IF8uaXNFbXB0eSggb3B0aW9ucy52YWx1ZUNoYW5nZVNvdW5kR2VuZXJhdG9yT3B0aW9ucyApLFxyXG4gICAgICAnb3B0aW9ucyBzaG91bGQgb25seSBiZSBzdXBwbGllZCB3aGVuIHVzaW5nIGRlZmF1bHQgc291bmQgZ2VuZXJhdG9yJyApO1xyXG5cclxuICAgIC8vIElmIG5vIHNvdW5kIGdlbmVyYXRvciB3YXMgcHJvdmlkZWQsIGNyZWF0ZSB0aGUgZGVmYXVsdC5cclxuICAgIGlmICggb3B0aW9ucy5zb3VuZEdlbmVyYXRvciA9PT0gU2xpZGVyLkRFRkFVTFRfU09VTkRfR0VORVJBVE9SICkge1xyXG4gICAgICBvcHRpb25zLnNvdW5kR2VuZXJhdG9yID0gbmV3IFZhbHVlQ2hhbmdlU291bmRQbGF5ZXIoIHJhbmdlUHJvcGVydHkudmFsdWUsIG9wdGlvbnMudmFsdWVDaGFuZ2VTb3VuZEdlbmVyYXRvck9wdGlvbnMgfHwge30gKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBvcHRpb25zLnNvdW5kR2VuZXJhdG9yID09PSBudWxsICkge1xyXG4gICAgICBvcHRpb25zLnNvdW5kR2VuZXJhdG9yID0gVmFsdWVDaGFuZ2VTb3VuZFBsYXllci5OT19TT1VORDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTZXQgdXAgdGhlIGRyYWcgaGFuZGxlciB0byBnZW5lcmF0ZSBzb3VuZCB3aGVuIGRyYWcgZXZlbnRzIGNhdXNlIGNoYW5nZXMuXHJcbiAgICBpZiAoIG9wdGlvbnMuc291bmRHZW5lcmF0b3IgIT09IFZhbHVlQ2hhbmdlU291bmRQbGF5ZXIuTk9fU09VTkQgKSB7XHJcblxyXG4gICAgICAvLyB2YXJpYWJsZSB0byBrZWVwIHRyYWNrIG9mIHRoZSB2YWx1ZSBhdCB0aGUgc3RhcnQgb2YgdXNlciBkcmFnIGludGVyYWN0aW9uc1xyXG4gICAgICBsZXQgcHJldmlvdXNWYWx1ZSA9IHZhbHVlUHJvcGVydHkudmFsdWU7XHJcblxyXG4gICAgICAvLyBFbmhhbmNlIHRoZSBkcmFnIGhhbmRsZXIgdG8gcGVyZm9ybSBzb3VuZCBnZW5lcmF0aW9uLlxyXG4gICAgICBjb25zdCBwcm92aWRlZERyYWcgPSBvcHRpb25zLmRyYWc7XHJcbiAgICAgIG9wdGlvbnMuZHJhZyA9IGV2ZW50ID0+IHtcclxuICAgICAgICBpZiAoIGV2ZW50LmlzRnJvbVBET00oKSApIHtcclxuICAgICAgICAgIG9wdGlvbnMuc291bmRHZW5lcmF0b3IhLnBsYXlTb3VuZEZvclZhbHVlQ2hhbmdlKCB2YWx1ZVByb3BlcnR5LnZhbHVlLCBwcmV2aW91c1ZhbHVlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgb3B0aW9ucy5zb3VuZEdlbmVyYXRvciEucGxheVNvdW5kSWZUaHJlc2hvbGRSZWFjaGVkKCB2YWx1ZVByb3BlcnR5LnZhbHVlLCBwcmV2aW91c1ZhbHVlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByb3ZpZGVkRHJhZyggZXZlbnQgKTtcclxuICAgICAgICBwcmV2aW91c1ZhbHVlID0gdmFsdWVQcm9wZXJ0eS52YWx1ZTtcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIG9wdGlvbnMub3JpZW50YXRpb24gPT09IE9yaWVudGF0aW9uLlZFUlRJQ0FMICkge1xyXG5cclxuICAgICAgLy8gRm9yIGEgdmVydGljYWwgc2xpZGVyLCB0aGUgY2xpZW50IHNob3VsZCBwcm92aWRlIGRpbWVuc2lvbnMgdGhhdCBhcmUgc3BlY2lmaWMgdG8gYSB2ZXJ0aWNhbCBzbGlkZXIuXHJcbiAgICAgIC8vIEJ1dCBTbGlkZXIgZXhwZWN0cyBkaW1lbnNpb25zIGZvciBhIGhvcml6b250YWwgc2xpZGVyLCBhbmQgdGhlbiBjcmVhdGVzIHRoZSB2ZXJ0aWNhbCBvcmllbnRhdGlvbiB1c2luZyByb3RhdGlvbi5cclxuICAgICAgLy8gU28gaWYgdGhlIGNsaWVudCBwcm92aWRlcyBhbnkgZGltZW5zaW9ucyBmb3IgYSB2ZXJ0aWNhbCBzbGlkZXIsIHN3YXAgdGhvc2UgZGltZW5zaW9ucyB0byBob3Jpem9udGFsLlxyXG4gICAgICBpZiAoIG9wdGlvbnMudHJhY2tTaXplICkge1xyXG4gICAgICAgIG9wdGlvbnMudHJhY2tTaXplID0gb3B0aW9ucy50cmFja1NpemUuc3dhcHBlZCgpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggb3B0aW9ucy50aHVtYlNpemUgKSB7XHJcbiAgICAgICAgb3B0aW9ucy50aHVtYlNpemUgPSBvcHRpb25zLnRodW1iU2l6ZS5zd2FwcGVkKCk7XHJcbiAgICAgIH1cclxuICAgICAgc3dhcE9iamVjdEtleXMoIG9wdGlvbnMsICd0aHVtYlRvdWNoQXJlYVhEaWxhdGlvbicsICd0aHVtYlRvdWNoQXJlYVlEaWxhdGlvbicgKTtcclxuICAgICAgc3dhcE9iamVjdEtleXMoIG9wdGlvbnMsICd0aHVtYk1vdXNlQXJlYVhEaWxhdGlvbicsICd0aHVtYk1vdXNlQXJlYVlEaWxhdGlvbicgKTtcclxuICAgIH1cclxuICAgIG9wdGlvbnMudHJhY2tTaXplID0gb3B0aW9ucy50cmFja1NpemUgfHwgREVGQVVMVF9IT1JJWk9OVEFMX1RSQUNLX1NJWkU7XHJcbiAgICBvcHRpb25zLnRodW1iU2l6ZSA9IG9wdGlvbnMudGh1bWJTaXplIHx8IERFRkFVTFRfSE9SSVpPTlRBTF9USFVNQl9TSVpFO1xyXG5cclxuICAgIGNvbnN0IHRodW1iVGFuZGVtID0gb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCBTbGlkZXIuVEhVTUJfTk9ERV9UQU5ERU1fTkFNRSApO1xyXG4gICAgaWYgKCBUYW5kZW0uVkFMSURBVElPTiAmJiBvcHRpb25zLnRodW1iTm9kZSApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy50aHVtYk5vZGUudGFuZGVtLmVxdWFscyggdGh1bWJUYW5kZW0gKSxcclxuICAgICAgICBgUGFzc2VkLWluIHRodW1iTm9kZSBtdXN0IGhhdmUgdGhlIGNvcnJlY3QgdGFuZGVtLiBFeHBlY3RlZDogJHt0aHVtYlRhbmRlbS5waGV0aW9JRH0sIGFjdHVhbDogJHtvcHRpb25zLnRodW1iTm9kZS50YW5kZW0ucGhldGlvSUR9YFxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFRoZSB0aHVtYiBvZiB0aGUgc2xpZGVyXHJcbiAgICBjb25zdCB0aHVtYiA9IG9wdGlvbnMudGh1bWJOb2RlIHx8IG5ldyBTbGlkZXJUaHVtYigge1xyXG5cclxuICAgICAgLy8gcHJvcGFnYXRlIG9wdGlvbnMgdGhhdCBhcmUgc3BlY2lmaWMgdG8gU2xpZGVyVGh1bWJcclxuICAgICAgc2l6ZTogb3B0aW9ucy50aHVtYlNpemUsXHJcbiAgICAgIGZpbGw6IG9wdGlvbnMudGh1bWJGaWxsLFxyXG4gICAgICBmaWxsSGlnaGxpZ2h0ZWQ6IG9wdGlvbnMudGh1bWJGaWxsSGlnaGxpZ2h0ZWQsXHJcbiAgICAgIHN0cm9rZTogb3B0aW9ucy50aHVtYlN0cm9rZSxcclxuICAgICAgbGluZVdpZHRoOiBvcHRpb25zLnRodW1iTGluZVdpZHRoLFxyXG4gICAgICBjZW50ZXJMaW5lU3Ryb2tlOiBvcHRpb25zLnRodW1iQ2VudGVyTGluZVN0cm9rZSxcclxuICAgICAgdGFuZGVtOiB0aHVtYlRhbmRlbVxyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IG93bnNFbmFibGVkUmFuZ2VQcm9wZXJ0eSA9ICFvcHRpb25zLmVuYWJsZWRSYW5nZVByb3BlcnR5O1xyXG5cclxuICAgIGNvbnN0IGJvdW5kc1JlcXVpcmVkT3B0aW9uS2V5cyA9IF8ucGljayggb3B0aW9ucywgTm9kZS5SRVFVSVJFU19CT1VORFNfT1BUSU9OX0tFWVMgKTtcclxuXHJcbiAgICAvLyBOb3cgYWRkIGluIHRoZSByZXF1aXJlZCBvcHRpb25zIHdoZW4gcGFzc2luZyB0byB0aGUgc3VwZXIgdHlwZVxyXG4gICAgY29uc3Qgc3VwZXJPcHRpb25zID0gY29tYmluZU9wdGlvbnM8dHlwZW9mIG9wdGlvbnMgJiBQaWNrUmVxdWlyZWQ8UGFyZW50T3B0aW9ucywgUmVxdWlyZWRQYXJlbnRPcHRpb25zU3VwcGxpZWRCeVNsaWRlcj4+KCB7XHJcblxyXG4gICAgICBhcmlhT3JpZW50YXRpb246IG9wdGlvbnMub3JpZW50YXRpb24sXHJcbiAgICAgIHZhbHVlUHJvcGVydHk6IHZhbHVlUHJvcGVydHksXHJcbiAgICAgIHBhblRhcmdldE5vZGU6IHRodW1iLFxyXG5cclxuICAgICAgLy8gY29udHJvbHMgdGhlIHBvcnRpb24gb2YgdGhlIHNsaWRlciB0aGF0IGlzIGVuYWJsZWRcclxuICAgICAgZW5hYmxlZFJhbmdlUHJvcGVydHk6IG9wdGlvbnMuZW5hYmxlZFJhbmdlUHJvcGVydHkgfHwgKCByYW5nZSBpbnN0YW5jZW9mIFJhbmdlID8gbmV3IFByb3BlcnR5KCByYW5nZSwge1xyXG4gICAgICAgIHZhbHVlVHlwZTogUmFuZ2UsXHJcbiAgICAgICAgaXNWYWxpZFZhbHVlOiAoIHZhbHVlOiBSYW5nZSApID0+ICggdmFsdWUubWluID49IHJhbmdlLm1pbiAmJiB2YWx1ZS5tYXggPD0gcmFuZ2UubWF4ICksXHJcbiAgICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdlbmFibGVkUmFuZ2VQcm9wZXJ0eScgKSxcclxuICAgICAgICBwaGV0aW9WYWx1ZVR5cGU6IFJhbmdlLlJhbmdlSU8sXHJcbiAgICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ1NsaWRlcnMgc3VwcG9ydCB0d28gcmFuZ2VzOiB0aGUgb3V0ZXIgcmFuZ2Ugd2hpY2ggc3BlY2lmaWVzIHRoZSBtaW4gYW5kIG1heCBvZiB0aGUgdHJhY2sgYW5kICcgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICd0aGUgZW5hYmxlZFJhbmdlUHJvcGVydHksIHdoaWNoIGRldGVybWluZXMgaG93IGxvdyBhbmQgaGlnaCB0aGUgdGh1bWIgY2FuIGJlIGRyYWdnZWQgd2l0aGluIHRoZSB0cmFjay4nXHJcbiAgICAgIH0gKSA6IHJhbmdlIClcclxuICAgIH0sIG9wdGlvbnMgKTtcclxuXHJcbiAgICBzdXBlciggc3VwZXJPcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy5vcmllbnRhdGlvbiA9IHN1cGVyT3B0aW9ucy5vcmllbnRhdGlvbiE7XHJcbiAgICB0aGlzLmVuYWJsZWRSYW5nZVByb3BlcnR5ID0gc3VwZXJPcHRpb25zLmVuYWJsZWRSYW5nZVByb3BlcnR5O1xyXG5cclxuICAgIHRoaXMudGlja09wdGlvbnMgPSBfLnBpY2soIG9wdGlvbnMsICd0aWNrTGFiZWxTcGFjaW5nJyxcclxuICAgICAgJ21ham9yVGlja0xlbmd0aCcsICdtYWpvclRpY2tTdHJva2UnLCAnbWFqb3JUaWNrTGluZVdpZHRoJyxcclxuICAgICAgJ21pbm9yVGlja0xlbmd0aCcsICdtaW5vclRpY2tTdHJva2UnLCAnbWlub3JUaWNrTGluZVdpZHRoJyApO1xyXG5cclxuICAgIGNvbnN0IHNsaWRlclBhcnRzID0gW107XHJcblxyXG4gICAgLy8gdGlja3MgYXJlIGFkZGVkIHRvIHRoZXNlIHBhcmVudHMsIHNvIHRoZXkgYXJlIGJlaGluZCB0aGUga25vYlxyXG4gICAgdGhpcy5tYWpvclRpY2tzUGFyZW50ID0gbmV3IE5vZGUoKTtcclxuICAgIHRoaXMubWlub3JUaWNrc1BhcmVudCA9IG5ldyBOb2RlKCk7XHJcbiAgICBzbGlkZXJQYXJ0cy5wdXNoKCB0aGlzLm1ham9yVGlja3NQYXJlbnQgKTtcclxuICAgIHNsaWRlclBhcnRzLnB1c2goIHRoaXMubWlub3JUaWNrc1BhcmVudCApO1xyXG5cclxuICAgIGNvbnN0IHRyYWNrVGFuZGVtID0gb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCBTbGlkZXIuVFJBQ0tfTk9ERV9UQU5ERU1fTkFNRSApO1xyXG5cclxuICAgIGlmICggVGFuZGVtLlZBTElEQVRJT04gJiYgb3B0aW9ucy50cmFja05vZGUgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIG9wdGlvbnMudHJhY2tOb2RlLnRhbmRlbS5lcXVhbHMoIHRyYWNrVGFuZGVtICksXHJcbiAgICAgICAgYFBhc3NlZC1pbiB0cmFja05vZGUgbXVzdCBoYXZlIHRoZSBjb3JyZWN0IHRhbmRlbS4gRXhwZWN0ZWQ6ICR7dHJhY2tUYW5kZW0ucGhldGlvSUR9LCBhY3R1YWw6ICR7b3B0aW9ucy50cmFja05vZGUudGFuZGVtLnBoZXRpb0lEfWBcclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0cmFja1NwYWNlciA9IG5ldyBOb2RlKCk7XHJcbiAgICBzbGlkZXJQYXJ0cy5wdXNoKCB0cmFja1NwYWNlciApO1xyXG5cclxuICAgIC8vIEFzc2VydGlvbiB0byBnZXQgYXJvdW5kIG11dGF0aW5nIHRoZSBudWxsLWRlZmF1bHQgYmFzZWQgb24gdGhlIHNsaWRlciBvcmllbnRhdGlvbi5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHN1cGVyT3B0aW9ucy50cmFja1NpemUsICd0cmFja1NpemUgc2hvdWxkIG5vdCBiZSBudWxsJyApO1xyXG5cclxuICAgIHRoaXMudHJhY2sgPSBvcHRpb25zLnRyYWNrTm9kZSB8fCBuZXcgRGVmYXVsdFNsaWRlclRyYWNrKCB2YWx1ZVByb3BlcnR5LCByYW5nZSwge1xyXG5cclxuICAgICAgLy8gcHJvcGFnYXRlIG9wdGlvbnMgdGhhdCBhcmUgc3BlY2lmaWMgdG8gU2xpZGVyVHJhY2tcclxuICAgICAgc2l6ZTogc3VwZXJPcHRpb25zLnRyYWNrU2l6ZSEsXHJcbiAgICAgIGZpbGxFbmFibGVkOiBzdXBlck9wdGlvbnMudHJhY2tGaWxsRW5hYmxlZCxcclxuICAgICAgZmlsbERpc2FibGVkOiBzdXBlck9wdGlvbnMudHJhY2tGaWxsRGlzYWJsZWQsXHJcbiAgICAgIHN0cm9rZTogc3VwZXJPcHRpb25zLnRyYWNrU3Ryb2tlLFxyXG4gICAgICBsaW5lV2lkdGg6IHN1cGVyT3B0aW9ucy50cmFja0xpbmVXaWR0aCxcclxuICAgICAgY29ybmVyUmFkaXVzOiBzdXBlck9wdGlvbnMudHJhY2tDb3JuZXJSYWRpdXMsXHJcbiAgICAgIHN0YXJ0RHJhZzogc3VwZXJPcHRpb25zLnN0YXJ0RHJhZyxcclxuICAgICAgZHJhZzogc3VwZXJPcHRpb25zLmRyYWcsXHJcbiAgICAgIGVuZERyYWc6IHN1cGVyT3B0aW9ucy5lbmREcmFnLFxyXG4gICAgICBjb25zdHJhaW5WYWx1ZTogc3VwZXJPcHRpb25zLmNvbnN0cmFpblZhbHVlLFxyXG4gICAgICBlbmFibGVkUmFuZ2VQcm9wZXJ0eTogdGhpcy5lbmFibGVkUmFuZ2VQcm9wZXJ0eSxcclxuICAgICAgc291bmRHZW5lcmF0b3I6IG9wdGlvbnMuc291bmRHZW5lcmF0b3IsXHJcbiAgICAgIHBpY2thYmxlOiBzdXBlck9wdGlvbnMudHJhY2tQaWNrYWJsZSxcclxuICAgICAgdm9pY2luZ09uRW5kUmVzcG9uc2U6IHRoaXMudm9pY2luZ09uRW5kUmVzcG9uc2UuYmluZCggdGhpcyApLFxyXG5cclxuICAgICAgLy8gcGhldC1pb1xyXG4gICAgICB0YW5kZW06IHRyYWNrVGFuZGVtXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gQWRkIHRoZSB0cmFja1xyXG4gICAgc2xpZGVyUGFydHMucHVzaCggdGhpcy50cmFjayApO1xyXG5cclxuICAgIC8vIFBvc2l0aW9uIHRoZSB0aHVtYiB2ZXJ0aWNhbGx5LlxyXG4gICAgdGh1bWIuc2V0Q2VudGVyWSggdGhpcy50cmFjay5jZW50ZXJZICsgb3B0aW9ucy50aHVtYllPZmZzZXQgKTtcclxuXHJcbiAgICBzbGlkZXJQYXJ0cy5wdXNoKCB0aHVtYiApO1xyXG5cclxuICAgIC8vIFdyYXAgYWxsIG9mIHRoZSBzbGlkZXIgcGFydHMgaW4gYSBOb2RlLCBhbmQgc2V0IHRoZSBvcmllbnRhdGlvbiBvZiB0aGF0IE5vZGUuXHJcbiAgICAvLyBUaGlzIGFsbG93cyB1cyB0byBzdGlsbCBkZWNvcmF0ZSB0aGUgU2xpZGVyIHdpdGggYWRkaXRpb25hbCBjaGlsZHJlbi5cclxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc3VuL2lzc3Vlcy80MDZcclxuICAgIGNvbnN0IHNsaWRlclBhcnRzTm9kZSA9IG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBzbGlkZXJQYXJ0cyB9ICk7XHJcbiAgICBpZiAoIG9wdGlvbnMub3JpZW50YXRpb24gPT09IE9yaWVudGF0aW9uLlZFUlRJQ0FMICkge1xyXG4gICAgICBzbGlkZXJQYXJ0c05vZGUucm90YXRpb24gPSBTdW5Db25zdGFudHMuU0xJREVSX1ZFUlRJQ0FMX1JPVEFUSU9OO1xyXG4gICAgfVxyXG4gICAgdGhpcy5hZGRDaGlsZCggc2xpZGVyUGFydHNOb2RlICk7XHJcblxyXG4gICAgLy8gdG91Y2hBcmVhIGZvciB0aGUgZGVmYXVsdCB0aHVtYi4gSWYgYSBjdXN0b20gdGh1bWIgaXMgcHJvdmlkZWQsIHRoZSBjbGllbnQgaXMgcmVzcG9uc2libGUgZm9yIGl0cyB0b3VjaEFyZWEuXHJcbiAgICBpZiAoICFvcHRpb25zLnRodW1iTm9kZSAmJiAoIG9wdGlvbnMudGh1bWJUb3VjaEFyZWFYRGlsYXRpb24gfHwgb3B0aW9ucy50aHVtYlRvdWNoQXJlYVlEaWxhdGlvbiApICkge1xyXG4gICAgICB0aHVtYi50b3VjaEFyZWEgPSB0aHVtYi5sb2NhbEJvdW5kcy5kaWxhdGVkWFkoIG9wdGlvbnMudGh1bWJUb3VjaEFyZWFYRGlsYXRpb24sIG9wdGlvbnMudGh1bWJUb3VjaEFyZWFZRGlsYXRpb24gKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBtb3VzZUFyZWEgZm9yIHRoZSBkZWZhdWx0IHRodW1iLiBJZiBhIGN1c3RvbSB0aHVtYiBpcyBwcm92aWRlZCwgdGhlIGNsaWVudCBpcyByZXNwb25zaWJsZSBmb3IgaXRzIG1vdXNlQXJlYS5cclxuICAgIGlmICggIW9wdGlvbnMudGh1bWJOb2RlICYmICggb3B0aW9ucy50aHVtYk1vdXNlQXJlYVhEaWxhdGlvbiB8fCBvcHRpb25zLnRodW1iTW91c2VBcmVhWURpbGF0aW9uICkgKSB7XHJcbiAgICAgIHRodW1iLm1vdXNlQXJlYSA9IHRodW1iLmxvY2FsQm91bmRzLmRpbGF0ZWRYWSggb3B0aW9ucy50aHVtYk1vdXNlQXJlYVhEaWxhdGlvbiwgb3B0aW9ucy50aHVtYk1vdXNlQXJlYVlEaWxhdGlvbiApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHVwZGF0ZSB2YWx1ZSB3aGVuIHRodW1iIGlzIGRyYWdnZWRcclxuICAgIGxldCBjbGlja1hPZmZzZXQgPSAwOyAvLyB4LW9mZnNldCBiZXR3ZWVuIGluaXRpYWwgY2xpY2sgYW5kIHRodW1iJ3Mgb3JpZ2luXHJcbiAgICBsZXQgdmFsdWVPblN0YXJ0ID0gdmFsdWVQcm9wZXJ0eS52YWx1ZTsgLy8gRm9yIGRlc2NyaXB0aW9uIHNvIHdlIGNhbiBkZXNjcmliZSB2YWx1ZSBjaGFuZ2VzIGJldHdlZW4gaW50ZXJhY3Rpb25zXHJcbiAgICBjb25zdCB0aHVtYkRyYWdMaXN0ZW5lciA9IG5ldyBEcmFnTGlzdGVuZXIoIHtcclxuXHJcbiAgICAgIC8vIERldmlhdGUgZnJvbSB0aGUgdmFyaWFibGUgbmFtZSBiZWNhdXNlIHdlIHdpbGwgbmVzdCB0aGlzIHRhbmRlbSB1bmRlciB0aGUgdGh1bWIgZGlyZWN0bHlcclxuICAgICAgdGFuZGVtOiB0aHVtYi50YW5kZW0uY3JlYXRlVGFuZGVtKCAnZHJhZ0xpc3RlbmVyJyApLFxyXG5cclxuICAgICAgc3RhcnQ6ICggZXZlbnQsIGxpc3RlbmVyICkgPT4ge1xyXG4gICAgICAgIGlmICggdGhpcy5lbmFibGVkUHJvcGVydHkuZ2V0KCkgKSB7XHJcbiAgICAgICAgICB2YWx1ZU9uU3RhcnQgPSB2YWx1ZVByb3BlcnR5LnZhbHVlO1xyXG5cclxuICAgICAgICAgIG9wdGlvbnMuc3RhcnREcmFnKCBldmVudCApO1xyXG4gICAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gbGlzdGVuZXIucHJlc3NlZFRyYWlsLnN1YnRyYWlsVG8oIHNsaWRlclBhcnRzTm9kZSApLmdldFRyYW5zZm9ybSgpO1xyXG5cclxuICAgICAgICAgIC8vIERldGVybWluZSB0aGUgb2Zmc2V0IHJlbGF0aXZlIHRvIHRoZSBjZW50ZXIgb2YgdGhlIHRodW1iXHJcbiAgICAgICAgICBjbGlja1hPZmZzZXQgPSB0cmFuc2Zvcm0uaW52ZXJzZVBvc2l0aW9uMiggZXZlbnQucG9pbnRlci5wb2ludCApLnggLSB0aHVtYi5jZW50ZXJYO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuXHJcbiAgICAgIGRyYWc6ICggZXZlbnQsIGxpc3RlbmVyICkgPT4ge1xyXG4gICAgICAgIGlmICggdGhpcy5lbmFibGVkUHJvcGVydHkuZ2V0KCkgKSB7XHJcbiAgICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSBsaXN0ZW5lci5wcmVzc2VkVHJhaWwuc3VidHJhaWxUbyggc2xpZGVyUGFydHNOb2RlICkuZ2V0VHJhbnNmb3JtKCk7IC8vIHdlIG9ubHkgd2FudCB0aGUgdHJhbnNmb3JtIHRvIG91ciBwYXJlbnRcclxuICAgICAgICAgIGNvbnN0IHggPSB0cmFuc2Zvcm0uaW52ZXJzZVBvc2l0aW9uMiggZXZlbnQucG9pbnRlci5wb2ludCApLnggLSBjbGlja1hPZmZzZXQ7XHJcbiAgICAgICAgICB0aGlzLnByb3Bvc2VkVmFsdWUgPSB0aGlzLnRyYWNrLnZhbHVlVG9Qb3NpdGlvblByb3BlcnR5LnZhbHVlLmludmVyc2UoIHggKTtcclxuXHJcbiAgICAgICAgICBjb25zdCB2YWx1ZUluUmFuZ2UgPSB0aGlzLmVuYWJsZWRSYW5nZVByb3BlcnR5LmdldCgpLmNvbnN0cmFpblZhbHVlKCB0aGlzLnByb3Bvc2VkVmFsdWUgKTtcclxuICAgICAgICAgIHZhbHVlUHJvcGVydHkuc2V0KCBvcHRpb25zLmNvbnN0cmFpblZhbHVlKCB2YWx1ZUluUmFuZ2UgKSApO1xyXG5cclxuICAgICAgICAgIC8vIGFmdGVyIHZhbHVlUHJvcGVydHkgaXMgc2V0IHNvIGxpc3RlbmVyIGNhbiB1c2UgdGhlIG5ldyB2YWx1ZVxyXG4gICAgICAgICAgb3B0aW9ucy5kcmFnKCBldmVudCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuXHJcbiAgICAgIGVuZDogZXZlbnQgPT4ge1xyXG4gICAgICAgIGlmICggdGhpcy5lbmFibGVkUHJvcGVydHkuZ2V0KCkgKSB7XHJcbiAgICAgICAgICBvcHRpb25zLmVuZERyYWcoIGV2ZW50ICk7XHJcblxyXG4gICAgICAgICAgLy8gdm9pY2luZyAtIERlZmF1bHQgYmVoYXZpb3IgaXMgdG8gc3BlYWsgdGhlIG5ldyBvYmplY3QgcmVzcG9uc2UgYXQgdGhlIGVuZCBvZiBpbnRlcmFjdGlvbi4gSWYgeW91IHdhbnQgdG9cclxuICAgICAgICAgIC8vIGN1c3RvbWl6ZSB0aGlzIHJlc3BvbnNlLCB5b3UgY2FuIG1vZGlmeSBzdXBlcnR5cGUgb3B0aW9ucyBWb2ljaW5nT25FbmRSZXNwb25zZU9wdGlvbnMuXHJcbiAgICAgICAgICB0aGlzLnZvaWNpbmdPbkVuZFJlc3BvbnNlKCB2YWx1ZU9uU3RhcnQgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wcm9wb3NlZFZhbHVlID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gICAgdGh1bWIuYWRkSW5wdXRMaXN0ZW5lciggdGh1bWJEcmFnTGlzdGVuZXIgKTtcclxuXHJcbiAgICB0aGlzLnRodW1iRHJhZ0xpc3RlbmVyID0gdGh1bWJEcmFnTGlzdGVuZXI7XHJcbiAgICB0aGlzLnRyYWNrRHJhZ0xpc3RlbmVyID0gdGhpcy50cmFjay5kcmFnTGlzdGVuZXI7XHJcblxyXG4gICAgLy8gdXBkYXRlIHRodW1iIHBvc2l0aW9uIHdoZW4gdmFsdWUgY2hhbmdlc1xyXG4gICAgY29uc3QgdmFsdWVNdWx0aWxpbmsgPSBNdWx0aWxpbmsubXVsdGlsaW5rKCBbIHZhbHVlUHJvcGVydHksIHRoaXMudHJhY2sudmFsdWVUb1Bvc2l0aW9uUHJvcGVydHkgXSwgKCB2YWx1ZSwgdmFsdWVUb1Bvc2l0aW9uICkgPT4ge1xyXG4gICAgICB0aHVtYi5jZW50ZXJYID0gdmFsdWVUb1Bvc2l0aW9uLmV2YWx1YXRlKCB2YWx1ZSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIHdoZW4gdGhlIGVuYWJsZWQgcmFuZ2UgY2hhbmdlcywgdGhlIHZhbHVlIHRvIHBvc2l0aW9uIGxpbmVhciBmdW5jdGlvbiBtdXN0IGNoYW5nZSBhcyB3ZWxsXHJcbiAgICBjb25zdCBlbmFibGVkUmFuZ2VPYnNlcnZlciA9ICggZW5hYmxlZFJhbmdlOiBSYW5nZSApID0+IHtcclxuXHJcbiAgICAgIC8vIFdoZW4gcmVzdG9yaW5nIFBoRVQtaU8gc3RhdGUsIHByZXZlbnQgdGhlIGNsYW1wIGZyb20gc2V0dGluZyBhIHN0YWxlLCBpbmNvcnJlY3QgdmFsdWUgdG8gYSBkZWZlcnJlZCBQcm9wZXJ0eVxyXG4gICAgICAvLyAod2hpY2ggbWF5IGhhdmUgYWxyZWFkeSByZXN0b3JlZCB0aGUgY29ycmVjdCB2YWx1ZSBmcm9tIHBoZXQtaW8gc3RhdGUpLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL21lYW4tc2hhcmUtYW5kLWJhbGFuY2UvaXNzdWVzLzIxXHJcbiAgICAgIGlmICggIXZhbHVlUHJvcGVydHkuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSB8fCAhaXNTZXR0aW5nUGhldGlvU3RhdGVQcm9wZXJ0eS52YWx1ZSApIHtcclxuXHJcblxyXG4gICAgICAgIGlmICggdGhpcy5wcm9wb3NlZFZhbHVlID09PSBudWxsICkge1xyXG5cclxuICAgICAgICAgIC8vIGNsYW1wIHRoZSBjdXJyZW50IHZhbHVlIHRvIHRoZSBlbmFibGVkIHJhbmdlIGlmIGl0IGNoYW5nZXNcclxuICAgICAgICAgIHZhbHVlUHJvcGVydHkuc2V0KCBVdGlscy5jbGFtcCggdmFsdWVQcm9wZXJ0eS52YWx1ZSwgZW5hYmxlZFJhbmdlLm1pbiwgZW5hYmxlZFJhbmdlLm1heCApICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGhvbGRpbmcgdGhlIHRodW1iLCB3aGljaCBtYXkgYmUgb3V0c2lkZSB0aGUgZW5hYmxlZFJhbmdlLiAgSW4gdGhhdCBjYXNlLCBleHBhbmRpbmcgdGhlIHJhbmdlXHJcbiAgICAgICAgICAvLyBjb3VsZCBhY2NvbW1vZGF0ZSB0aGUgb3V0ZXIgdmFsdWVcclxuICAgICAgICAgIGNvbnN0IHByb3Bvc2VkVmFsdWVJbkVuYWJsZWRSYW5nZSA9IFV0aWxzLmNsYW1wKCB0aGlzLnByb3Bvc2VkVmFsdWUsIGVuYWJsZWRSYW5nZS5taW4sIGVuYWJsZWRSYW5nZS5tYXggKTtcclxuICAgICAgICAgIGNvbnN0IHByb3Bvc2VkVmFsdWVJbkNvbnN0cmFpbmVkUmFuZ2UgPSBvcHRpb25zLmNvbnN0cmFpblZhbHVlKCBwcm9wb3NlZFZhbHVlSW5FbmFibGVkUmFuZ2UgKTtcclxuICAgICAgICAgIHZhbHVlUHJvcGVydHkuc2V0KCBwcm9wb3NlZFZhbHVlSW5Db25zdHJhaW5lZFJhbmdlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgdGhpcy5lbmFibGVkUmFuZ2VQcm9wZXJ0eS5saW5rKCBlbmFibGVkUmFuZ2VPYnNlcnZlciApOyAvLyBuZWVkcyB0byBiZSB1bmxpbmtlZCBpbiBkaXNwb3NlIGZ1bmN0aW9uXHJcblxyXG4gICAgY29uc3QgY29uc3RyYWludCA9IG5ldyBTbGlkZXJDb25zdHJhaW50KCB0aGlzLCB0aGlzLnRyYWNrLCB0aHVtYiwgc2xpZGVyUGFydHNOb2RlLCBvcHRpb25zLm9yaWVudGF0aW9uLCB0cmFja1NwYWNlciwgdGhpcy50aWNrcyApO1xyXG5cclxuICAgIHRoaXMuZGlzcG9zZVNsaWRlciA9ICgpID0+IHtcclxuICAgICAgY29uc3RyYWludC5kaXNwb3NlKCk7XHJcblxyXG4gICAgICB0aHVtYi5kaXNwb3NlICYmIHRodW1iLmRpc3Bvc2UoKTsgLy8gaW4gY2FzZSBhIGN1c3RvbSB0aHVtYiBpcyBwcm92aWRlZCB2aWEgb3B0aW9ucy50aHVtYk5vZGUgdGhhdCBkb2Vzbid0IGltcGxlbWVudCBkaXNwb3NlXHJcbiAgICAgIHRoaXMudHJhY2suZGlzcG9zZSAmJiB0aGlzLnRyYWNrLmRpc3Bvc2UoKTtcclxuXHJcbiAgICAgIGlmICggb3duc0VuYWJsZWRSYW5nZVByb3BlcnR5ICkge1xyXG4gICAgICAgIHRoaXMuZW5hYmxlZFJhbmdlUHJvcGVydHkuZGlzcG9zZSgpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZW5hYmxlZFJhbmdlUHJvcGVydHkudW5saW5rKCBlbmFibGVkUmFuZ2VPYnNlcnZlciApO1xyXG4gICAgICB9XHJcbiAgICAgIHZhbHVlTXVsdGlsaW5rLmRpc3Bvc2UoKTtcclxuICAgICAgdGh1bWJEcmFnTGlzdGVuZXIuZGlzcG9zZSgpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBwZG9tIC0gY3VzdG9tIGZvY3VzIGhpZ2hsaWdodCB0aGF0IHN1cnJvdW5kcyBhbmQgbW92ZXMgd2l0aCB0aGUgdGh1bWJcclxuICAgIHRoaXMuZm9jdXNIaWdobGlnaHQgPSBuZXcgSGlnaGxpZ2h0RnJvbU5vZGUoIHRodW1iICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIFRhbmRlbS5WQUxJREFUSU9OICYmIGFzc2VydCggIW9wdGlvbnMucGhldGlvTGlua2VkUHJvcGVydHkgfHwgb3B0aW9ucy5waGV0aW9MaW5rZWRQcm9wZXJ0eS5pc1BoZXRpb0luc3RydW1lbnRlZCgpLFxyXG4gICAgICAnSWYgcHJvdmlkZWQsIHBoZXRpb0xpbmtlZFByb3BlcnR5IHNob3VsZCBiZSBQaEVULWlPIGluc3RydW1lbnRlZCcgKTtcclxuXHJcbiAgICAvLyBNdXN0IGhhcHBlbiBhZnRlciBpbnN0cnVtZW50YXRpb24gKGluIHN1cGVyIGNhbGwpXHJcbiAgICBjb25zdCBsaW5rZWRQcm9wZXJ0eSA9IG9wdGlvbnMucGhldGlvTGlua2VkUHJvcGVydHkgfHwgKCB2YWx1ZVByb3BlcnR5IGluc3RhbmNlb2YgUmVhZE9ubHlQcm9wZXJ0eSA/IHZhbHVlUHJvcGVydHkgOiBudWxsICk7XHJcbiAgICBpZiAoIGxpbmtlZFByb3BlcnR5ICkge1xyXG4gICAgICB0aGlzLmFkZExpbmtlZEVsZW1lbnQoIGxpbmtlZFByb3BlcnR5LCB7XHJcbiAgICAgICAgdGFuZGVtTmFtZTogJ3ZhbHVlUHJvcGVydHknXHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBtdXN0IGJlIGFmdGVyIHRoZSBidXR0b24gaXMgaW5zdHJ1bWVudGVkXHJcbiAgICAvLyBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpIHx8IHRoaXMuZW5hYmxlZFJhbmdlUHJvcGVydHkuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSApO1xyXG4gICAgIW93bnNFbmFibGVkUmFuZ2VQcm9wZXJ0eSAmJiB0aGlzLmVuYWJsZWRSYW5nZVByb3BlcnR5IGluc3RhbmNlb2YgUmVhZE9ubHlQcm9wZXJ0eSAmJiB0aGlzLmFkZExpbmtlZEVsZW1lbnQoIHRoaXMuZW5hYmxlZFJhbmdlUHJvcGVydHksIHtcclxuICAgICAgdGFuZGVtTmFtZTogJ2VuYWJsZWRSYW5nZVByb3BlcnR5J1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMubXV0YXRlKCBib3VuZHNSZXF1aXJlZE9wdGlvbktleXMgKTtcclxuXHJcbiAgICAvLyBzdXBwb3J0IGZvciBiaW5kZXIgZG9jdW1lbnRhdGlvbiwgc3RyaXBwZWQgb3V0IGluIGJ1aWxkcyBhbmQgb25seSBydW5zIHdoZW4gP2JpbmRlciBpcyBzcGVjaWZpZWRcclxuICAgIGFzc2VydCAmJiBwaGV0Py5jaGlwcGVyPy5xdWVyeVBhcmFtZXRlcnM/LmJpbmRlciAmJiBJbnN0YW5jZVJlZ2lzdHJ5LnJlZ2lzdGVyRGF0YVVSTCggJ3N1bicsICdTbGlkZXInLCB0aGlzICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IG1ham9yVGlja3NWaXNpYmxlKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5nZXRNYWpvclRpY2tzVmlzaWJsZSgpOyB9XHJcblxyXG4gIHB1YmxpYyBzZXQgbWFqb3JUaWNrc1Zpc2libGUoIHZhbHVlOiBib29sZWFuICkgeyB0aGlzLnNldE1ham9yVGlja3NWaXNpYmxlKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgbWlub3JUaWNrc1Zpc2libGUoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmdldE1pbm9yVGlja3NWaXNpYmxlKCk7IH1cclxuXHJcbiAgcHVibGljIHNldCBtaW5vclRpY2tzVmlzaWJsZSggdmFsdWU6IGJvb2xlYW4gKSB7IHRoaXMuc2V0TWlub3JUaWNrc1Zpc2libGUoIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmRpc3Bvc2VTbGlkZXIoKTtcclxuXHJcbiAgICB0aGlzLnRpY2tzLmZvckVhY2goIHRpY2sgPT4ge1xyXG4gICAgICB0aWNrLmRpc3Bvc2UoKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGEgbWFqb3IgdGljayBtYXJrLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGRNYWpvclRpY2soIHZhbHVlOiBudW1iZXIsIGxhYmVsPzogTm9kZSApOiB2b2lkIHtcclxuICAgIHRoaXMuYWRkVGljayggdGhpcy5tYWpvclRpY2tzUGFyZW50LCB2YWx1ZSwgbGFiZWwsXHJcbiAgICAgIHRoaXMudGlja09wdGlvbnMubWFqb3JUaWNrTGVuZ3RoLCB0aGlzLnRpY2tPcHRpb25zLm1ham9yVGlja1N0cm9rZSwgdGhpcy50aWNrT3B0aW9ucy5tYWpvclRpY2tMaW5lV2lkdGggKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYSBtaW5vciB0aWNrIG1hcmsuXHJcbiAgICovXHJcbiAgcHVibGljIGFkZE1pbm9yVGljayggdmFsdWU6IG51bWJlciwgbGFiZWw/OiBOb2RlICk6IHZvaWQge1xyXG4gICAgdGhpcy5hZGRUaWNrKCB0aGlzLm1pbm9yVGlja3NQYXJlbnQsIHZhbHVlLCBsYWJlbCxcclxuICAgICAgdGhpcy50aWNrT3B0aW9ucy5taW5vclRpY2tMZW5ndGgsIHRoaXMudGlja09wdGlvbnMubWlub3JUaWNrU3Ryb2tlLCB0aGlzLnRpY2tPcHRpb25zLm1pbm9yVGlja0xpbmVXaWR0aCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhIHRpY2sgbWFyayBhYm92ZSB0aGUgdHJhY2suXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhZGRUaWNrKCBwYXJlbnQ6IE5vZGUsIHZhbHVlOiBudW1iZXIsIGxhYmVsOiBOb2RlIHwgdW5kZWZpbmVkLCBsZW5ndGg6IG51bWJlciwgc3Ryb2tlOiBUUGFpbnQsIGxpbmVXaWR0aDogbnVtYmVyICk6IHZvaWQge1xyXG4gICAgdGhpcy50aWNrcy5wdXNoKCBuZXcgU2xpZGVyVGljayggcGFyZW50LCB2YWx1ZSwgbGFiZWwsIGxlbmd0aCwgc3Ryb2tlLCBsaW5lV2lkdGgsIHRoaXMudGlja09wdGlvbnMsIHRoaXMub3JpZW50YXRpb24sIHRoaXMudHJhY2sgKSApO1xyXG4gIH1cclxuXHJcbiAgLy8gU2V0cyB2aXNpYmlsaXR5IG9mIG1ham9yIHRpY2tzLlxyXG4gIHB1YmxpYyBzZXRNYWpvclRpY2tzVmlzaWJsZSggdmlzaWJsZTogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIHRoaXMubWFqb3JUaWNrc1BhcmVudC52aXNpYmxlID0gdmlzaWJsZTtcclxuICB9XHJcblxyXG4gIC8vIEdldHMgdmlzaWJpbGl0eSBvZiBtYWpvciB0aWNrcy5cclxuICBwdWJsaWMgZ2V0TWFqb3JUaWNrc1Zpc2libGUoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5tYWpvclRpY2tzUGFyZW50LnZpc2libGU7XHJcbiAgfVxyXG5cclxuICAvLyBTZXRzIHZpc2liaWxpdHkgb2YgbWlub3IgdGlja3MuXHJcbiAgcHVibGljIHNldE1pbm9yVGlja3NWaXNpYmxlKCB2aXNpYmxlOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgdGhpcy5taW5vclRpY2tzUGFyZW50LnZpc2libGUgPSB2aXNpYmxlO1xyXG4gIH1cclxuXHJcbiAgLy8gR2V0cyB2aXNpYmlsaXR5IG9mIG1pbm9yIHRpY2tzLlxyXG4gIHB1YmxpYyBnZXRNaW5vclRpY2tzVmlzaWJsZSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLm1pbm9yVGlja3NQYXJlbnQudmlzaWJsZTtcclxuICB9XHJcblxyXG4gIC8vIHN0YW5kYXJkaXplZCB0YW5kZW0gbmFtZXMsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc3VuL2lzc3Vlcy82OTRcclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFRIVU1CX05PREVfVEFOREVNX05BTUUgPSAndGh1bWJOb2RlJyBhcyBjb25zdDtcclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFRSQUNLX05PREVfVEFOREVNX05BTUUgPSAndHJhY2tOb2RlJyBhcyBjb25zdDtcclxuXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBTbGlkZXJJTyA9IG5ldyBJT1R5cGUoICdTbGlkZXJJTycsIHtcclxuICAgIHZhbHVlVHlwZTogU2xpZGVyLFxyXG4gICAgZG9jdW1lbnRhdGlvbjogJ0EgdHJhZGl0aW9uYWwgc2xpZGVyIGNvbXBvbmVudCwgd2l0aCBhIGtub2IgYW5kIHBvc3NpYmx5IHRpY2sgbWFya3MnLFxyXG4gICAgc3VwZXJ0eXBlOiBOb2RlLk5vZGVJT1xyXG4gIH0gKTtcclxufVxyXG5cclxuY2xhc3MgU2xpZGVyQ29uc3RyYWludCBleHRlbmRzIExheW91dENvbnN0cmFpbnQge1xyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IHByZWZlcnJlZFByb3BlcnR5OiBUUHJvcGVydHk8bnVtYmVyIHwgbnVsbD47XHJcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNwb3NlU2xpZGVyQ29uc3RyYWludDogKCkgPT4gdm9pZDtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBzbGlkZXI6IFNsaWRlcixcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgdHJhY2s6IFNsaWRlclRyYWNrLFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSB0aHVtYjogTm9kZSxcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2xpZGVyUGFydHNOb2RlOiBOb2RlLFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBvcmllbnRhdGlvbjogT3JpZW50YXRpb24sXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHRyYWNrU3BhY2VyOiBOb2RlLFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSB0aWNrczogT2JzZXJ2YWJsZUFycmF5PFNsaWRlclRpY2s+XHJcbiAgKSB7XHJcblxyXG4gICAgc3VwZXIoIHNsaWRlciApO1xyXG5cclxuICAgIC8vIFdlIG5lZWQgdG8gbWFrZSBpdCBzaXphYmxlIGluIGJvdGggZGltZW5zaW9ucyAoVlNsaWRlciB2cyBIU2xpZGVyKSwgYnV0IHdlJ2xsIHN0aWxsIHdhbnQgdG8gbWFrZSB0aGUgb3Bwb3NpdGVcclxuICAgIC8vIGF4aXMgbm9uLXNpemFibGUgKHNpbmNlIGl0IHdvbid0IGJlIHNpemFibGUgaW4gYm90aCBvcmllbnRhdGlvbnMgYXQgb25jZSkuXHJcbiAgICBpZiAoIG9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5IT1JJWk9OVEFMICkge1xyXG4gICAgICBzbGlkZXIuaGVpZ2h0U2l6YWJsZSA9IGZhbHNlO1xyXG4gICAgICB0aGlzLnByZWZlcnJlZFByb3BlcnR5ID0gdGhpcy5zbGlkZXIubG9jYWxQcmVmZXJyZWRXaWR0aFByb3BlcnR5O1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHNsaWRlci53aWR0aFNpemFibGUgPSBmYWxzZTtcclxuICAgICAgdGhpcy5wcmVmZXJyZWRQcm9wZXJ0eSA9IHRoaXMuc2xpZGVyLmxvY2FsUHJlZmVycmVkSGVpZ2h0UHJvcGVydHk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnByZWZlcnJlZFByb3BlcnR5LmxhenlMaW5rKCB0aGlzLl91cGRhdGVMYXlvdXRMaXN0ZW5lciApO1xyXG5cclxuICAgIC8vIFNvIHJhbmdlIGNoYW5nZXMgb3IgbWluaW11bSBjaGFuZ2VzIHdpbGwgdHJpZ2dlciBsYXlvdXRzIChzaW5jZSB0aGV5IGNhbiBtb3ZlIHRpY2tzKVxyXG4gICAgdGhpcy50cmFjay5yYW5nZVByb3BlcnR5LmxhenlMaW5rKCB0aGlzLl91cGRhdGVMYXlvdXRMaXN0ZW5lciApO1xyXG5cclxuICAgIC8vIFRodW1iIHNpemUgY2hhbmdlcyBzaG91bGQgdHJpZ2dlciBsYXlvdXQsIHNpbmNlIHdlIGNoZWNrIHRoZSB3aWR0aCBvZiB0aGUgdGh1bWJcclxuICAgIC8vIE5PVEU6IFRoaXMgaXMgaWdub3JpbmcgdGh1bWIgc2NhbGUgY2hhbmdpbmcsIGJ1dCBmb3IgcGVyZm9ybWFuY2UvY29ycmVjdG5lc3MgaXQgbWFrZXMgc2Vuc2UgdG8gYXZvaWQgdGhhdCBmb3Igbm93XHJcbiAgICAvLyBzbyB3ZSBjYW4gcnVsZSBvdXQgaW5maW5pdGUgbG9vcHMgb2YgdGh1bWIgbW92ZW1lbnQuXHJcbiAgICB0aGlzLnRodW1iLmxvY2FsQm91bmRzUHJvcGVydHkubGF6eUxpbmsoIHRoaXMuX3VwZGF0ZUxheW91dExpc3RlbmVyICk7XHJcblxyXG4gICAgLy8gQXMgdGlja3MgYXJlIGFkZGVkLCBhZGQgYSBsaXN0ZW5lciB0byBlYWNoIHRoYXQgd2lsbCB1cGRhdGUgdGhlIGxheW91dCBpZiB0aGUgdGljaydzIGJvdW5kcyBjaGFuZ2VzLlxyXG4gICAgY29uc3QgdGlja0FkZGVkTGlzdGVuZXIgPSAoIGFkZGVkVGljazogU2xpZGVyVGljayApID0+IHtcclxuICAgICAgYWRkZWRUaWNrLnRpY2tOb2RlLmxvY2FsQm91bmRzUHJvcGVydHkubGF6eUxpbmsoIHRoaXMuX3VwZGF0ZUxheW91dExpc3RlbmVyICk7XHJcbiAgICAgIHRpY2tzLmFkZEl0ZW1SZW1vdmVkTGlzdGVuZXIoIHJlbW92ZWRUaWNrID0+IHtcclxuICAgICAgICBpZiAoIHJlbW92ZWRUaWNrID09PSBhZGRlZFRpY2sgJiZcclxuICAgICAgICAgICAgIHJlbW92ZWRUaWNrLnRpY2tOb2RlLmxvY2FsQm91bmRzUHJvcGVydHkuaGFzTGlzdGVuZXIoIHRoaXMuX3VwZGF0ZUxheW91dExpc3RlbmVyICkgKSB7XHJcbiAgICAgICAgICBhZGRlZFRpY2sudGlja05vZGUubG9jYWxCb3VuZHNQcm9wZXJ0eS51bmxpbmsoIHRoaXMuX3VwZGF0ZUxheW91dExpc3RlbmVyICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICB9O1xyXG4gICAgdGlja3MuYWRkSXRlbUFkZGVkTGlzdGVuZXIoIHRpY2tBZGRlZExpc3RlbmVyICk7XHJcblxyXG4gICAgdGhpcy5hZGROb2RlKCB0cmFjayApO1xyXG5cclxuICAgIHRoaXMubGF5b3V0KCk7XHJcblxyXG4gICAgdGhpcy5kaXNwb3NlU2xpZGVyQ29uc3RyYWludCA9ICgpID0+IHtcclxuICAgICAgdGlja3MucmVtb3ZlSXRlbUFkZGVkTGlzdGVuZXIoIHRpY2tBZGRlZExpc3RlbmVyICk7XHJcbiAgICAgIHRoaXMucHJlZmVycmVkUHJvcGVydHkudW5saW5rKCB0aGlzLl91cGRhdGVMYXlvdXRMaXN0ZW5lciApO1xyXG4gICAgICB0aGlzLnRyYWNrLnJhbmdlUHJvcGVydHkudW5saW5rKCB0aGlzLl91cGRhdGVMYXlvdXRMaXN0ZW5lciApO1xyXG4gICAgICB0aGlzLnRodW1iLmxvY2FsQm91bmRzUHJvcGVydHkudW5saW5rKCB0aGlzLl91cGRhdGVMYXlvdXRMaXN0ZW5lciApO1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBvdmVycmlkZSBsYXlvdXQoKTogdm9pZCB7XHJcbiAgICBzdXBlci5sYXlvdXQoKTtcclxuXHJcbiAgICBjb25zdCBzbGlkZXIgPSB0aGlzLnNsaWRlcjtcclxuICAgIGNvbnN0IHRyYWNrID0gdGhpcy50cmFjaztcclxuICAgIGNvbnN0IHRodW1iID0gdGhpcy50aHVtYjtcclxuXHJcbiAgICAvLyBEaWxhdGUgdGhlIGxvY2FsIGJvdW5kcyBob3Jpem9udGFsbHkgc28gdGhhdCBpdCBleHRlbmRzIGJleW9uZCB3aGVyZSB0aGUgdGh1bWIgY2FuIHJlYWNoLiAgVGhpcyBwcmV2ZW50cyBsYXlvdXRcclxuICAgIC8vIGFzeW1tZXRyeSB3aGVuIHRoZSBzbGlkZXIgdGh1bWIgaXMgb2ZmIHRoZSBlZGdlcyBvZiB0aGUgdHJhY2suICBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3N1bi9pc3N1ZXMvMjgyXHJcbiAgICB0aGlzLnRyYWNrU3BhY2VyLmxvY2FsQm91bmRzID0gdHJhY2subG9jYWxCb3VuZHMuZGlsYXRlZFgoIHRodW1iLndpZHRoIC8gMiApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRyYWNrLm1pbmltdW1XaWR0aCAhPT0gbnVsbCApO1xyXG5cclxuICAgIC8vIE91ciB0cmFjaydzIChleHRlcmlvcikgbWluaW11bSB3aWR0aCB3aWxsIElOQ0xVREUgXCJ2aXN1YWwgb3ZlcmZsb3dcIiBlLmcuIHN0cm9rZS4gVGhlIGFjdHVhbCByYW5nZSB1c2VkIGZvclxyXG4gICAgLy8gY29tcHV0YXRpb24gb2Ygd2hlcmUgdGhlIHRodW1iL3RpY2tzIGdvIHdpbGwgYmUgdGhlIFwiaW50ZXJpb3JcIiB3aWR0aCAoZXhjbHVkaW5nIHRoZSB2aXN1YWwgb3ZlcmZsb3cpLCBlLmcuXHJcbiAgICAvLyB3aXRob3V0IHRoZSBzdHJva2UuIFdlJ2xsIG5lZWQgdG8gdHJhY2sgYW5kIGhhbmRsZSB0aGVzZSBzZXBhcmF0ZWx5LCBhbmQgb25seSBoYW5kbGUgdGljayBwb3NpdGlvbmluZyBiYXNlZCBvblxyXG4gICAgLy8gdGhlIGludGVyaW9yIHdpZHRoLlxyXG4gICAgY29uc3QgdG90YWxPdmVyZmxvdyA9IHRyYWNrLmxlZnRWaXN1YWxPdmVyZmxvdyArIHRyYWNrLnJpZ2h0VmlzdWFsT3ZlcmZsb3c7XHJcbiAgICBjb25zdCB0cmFja01pbmltdW1FeHRlcmlvcldpZHRoID0gdHJhY2subWluaW11bVdpZHRoITtcclxuICAgIGNvbnN0IHRyYWNrTWluaW11bUludGVyaW9yV2lkdGggPSB0cmFja01pbmltdW1FeHRlcmlvcldpZHRoIC0gdG90YWxPdmVyZmxvdztcclxuXHJcbiAgICAvLyBUYWtlcyBhIHRpY2sncyB2YWx1ZSBpbnRvIHRoZSBbMCwxXSByYW5nZS4gVGhpcyBzaG91bGQgYmUgbXVsdGlwbGllZCB0aW1lcyB0aGUgcG90ZW50aWFsIElOVEVSSU9SIHRyYWNrIHdpZHRoXHJcbiAgICAvLyBpbiBvcmRlciB0byBnZXQgdGhlIHBvc2l0aW9uIHRoZSB0aWNrIHNob3VsZCBiZSBhdC5cclxuICAgIGNvbnN0IG5vcm1hbGl6ZVRpY2tWYWx1ZSA9ICggdmFsdWU6IG51bWJlciApID0+IHtcclxuICAgICAgcmV0dXJuIFV0aWxzLmxpbmVhciggdHJhY2sucmFuZ2VQcm9wZXJ0eS52YWx1ZS5taW4sIHRyYWNrLnJhbmdlUHJvcGVydHkudmFsdWUubWF4LCAwLCAxLCB2YWx1ZSApO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBOT1RFOiBEdWUgdG8gdmlzdWFsIG92ZXJmbG93LCBvdXIgdHJhY2sncyByYW5nZSAoaW5jbHVkaW5nIHRoZSB0aHVtYiBleHRlbnNpb24pIHdpbGwgYWN0dWFsbHkgZ28gZnJvbVxyXG4gICAgLy8gKCAtdGh1bWIud2lkdGggLyAyIC0gdHJhY2subGVmdFZpc3VhbE92ZXJmbG93ICkgb24gdGhlIGxlZnQgdG9cclxuICAgIC8vICggdHJhY2tFeHRlcmlvcldpZHRoICsgdGh1bWIud2lkdGggLyAyICsgdHJhY2sucmlnaHRWaXN1YWxPdmVyZmxvdyApIG9uIHRoZSByaWdodC5cclxuICAgIC8vIFRoaXMgaXMgYmVjYXVzZSBvdXIgdHJhY2sncyB3aWR0aCBpcyByZWR1Y2VkIHRvIGFjY291bnQgZm9yIHN0cm9rZSwgYnV0IHRoZSBsb2dpY2FsIHJlY3RhbmdsZSBpcyBzdGlsbCBsb2NhdGVkXHJcbiAgICAvLyBhdCB4PTAsIG1lYW5pbmcgdGhlIHN0cm9rZSAod2l0aCBsaW5lV2lkdGg9MSkgd2lsbCB0eXBpY2FsbHkgZ28gb3V0IHRvIC0wLjUgKG5lZ2F0aXZlIGxlZnQgdmlzdWFsIG92ZXJmbG93KS5cclxuICAgIC8vIE91ciBob3Jpem9udGFsIGJvdW5kcyBhcmUgdGh1cyBlZmZlY3RpdmVseSBvZmZzZXQgYnkgdGhpcyBsZWZ0IHZpc3VhbCBvdmVyZmxvdyBhbW91bnQuXHJcblxyXG4gICAgLy8gTk9URTogVGhpcyBhY3R1YWxseSBnb2VzIFBBU1Qgd2hlcmUgdGhlIHRodW1iIHNob3VsZCBnbyB3aGVuIHRoZXJlIGlzIHZpc3VhbCBvdmVyZmxvdywgYnV0IHdlIGFsc29cclxuICAgIC8vIGluY2x1ZGVkIHRoaXMgXCJpbXByZWNpc2lvblwiIGluIHRoZSBwYXN0IChsb2NhbEJvdW5kcyBJTkNMVURJTkcgdGhlIHN0cm9rZSB3YXMgZGlsYXRlZCBieSB0aGUgdGh1bWIgd2lkdGgpLCBzbyB3ZVxyXG4gICAgLy8gd2lsbCBoYXZlIGEgc2xpZ2h0IGJpdCBvZiBhZGRpdGlvbmFsIHBhZGRpbmcgaW5jbHVkZWQgaGVyZS5cclxuXHJcbiAgICAvLyBOT1RFOiBEb2N1bWVudGF0aW9uIHdhcyBhZGRlZCBiZWZvcmUgZHluYW1pYyBsYXlvdXQgaW50ZWdyYXRpb24gKG5vdGluZyB0aGUgZXh0ZW5zaW9uIEJFWU9ORCB0aGUgYm91bmRzKTpcclxuICAgIC8vID4gRGlsYXRlIHRoZSBsb2NhbCBib3VuZHMgaG9yaXpvbnRhbGx5IHNvIHRoYXQgaXQgZXh0ZW5kcyBiZXlvbmQgd2hlcmUgdGhlIHRodW1iIGNhbiByZWFjaC4gIFRoaXMgcHJldmVudHMgbGF5b3V0XHJcbiAgICAvLyA+IGFzeW1tZXRyeSB3aGVuIHRoZSBzbGlkZXIgdGh1bWIgaXMgb2ZmIHRoZSBlZGdlcyBvZiB0aGUgdHJhY2suICBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3N1bi9pc3N1ZXMvMjgyXHJcbiAgICBjb25zdCBsZWZ0RXh0ZXJpb3JPZmZzZXQgPSAtdGh1bWIud2lkdGggLyAyIC0gdHJhY2subGVmdFZpc3VhbE92ZXJmbG93O1xyXG4gICAgY29uc3QgcmlnaHRFeHRlcmlvck9mZnNldCA9IHRodW1iLndpZHRoIC8gMiAtIHRyYWNrLmxlZnRWaXN1YWxPdmVyZmxvdztcclxuXHJcbiAgICAvLyBTdGFydCB3aXRoIHRoZSBzaXplIG91ciBtaW5pbXVtIHRyYWNrIHdvdWxkIGJlIFdJVEggdGhlIGFkZGVkIHNwYWNpbmcgZm9yIHRoZSB0aHVtYlxyXG4gICAgLy8gTk9URTogd2lsbCBiZSBtdXRhdGVkIGJlbG93XHJcbiAgICBjb25zdCBtaW5pbXVtUmFuZ2UgPSBuZXcgUmFuZ2UoIGxlZnRFeHRlcmlvck9mZnNldCwgdHJhY2tNaW5pbXVtRXh0ZXJpb3JXaWR0aCArIHJpZ2h0RXh0ZXJpb3JPZmZzZXQgKTtcclxuXHJcbiAgICAvLyBXZSdsbCBuZWVkIHRvIGNvbnNpZGVyIHdoZXJlIHRoZSB0aWNrcyB3b3VsZCBiZSBJRiB3ZSBoYWQgb3VyIG1pbmltdW0gc2l6ZSAoc2luY2UgdGhlIHRpY2tzIHdvdWxkIHBvdGVudGlhbGx5XHJcbiAgICAvLyBiZSBzcGFjZWQgY2xvc2VyIHRvZ2V0aGVyKS4gU28gd2UnbGwgY2hlY2sgdGhlIGJvdW5kcyBvZiBlYWNoIHRpY2sgaWYgaXQgd2FzIGF0IHRoYXQgbG9jYXRpb24sIGFuZFxyXG4gICAgLy8gZW5zdXJlIHRoYXQgdGlja3MgYXJlIGluY2x1ZGVkIGluIG91ciBtaW5pbXVtIHJhbmdlIChzaW5jZSB0aWNrIGxhYmVscyBtYXkgc3RpY2sgb3V0IHBhc3QgdGhlIHRyYWNrKS5cclxuICAgIHRoaXMudGlja3MuZm9yRWFjaCggdGljayA9PiB7XHJcblxyXG4gICAgICAvLyBXaGVyZSB0aGUgdGljayB3aWxsIGJlIGlmIHdlIGhhdmUgb3VyIG1pbmltdW0gc2l6ZVxyXG4gICAgICBjb25zdCB0aWNrTWluaW11bVBvc2l0aW9uID0gdHJhY2tNaW5pbXVtSW50ZXJpb3JXaWR0aCAqIG5vcm1hbGl6ZVRpY2tWYWx1ZSggdGljay52YWx1ZSApO1xyXG5cclxuICAgICAgLy8gQWRqdXN0IHRoZSBtaW5pbXVtIHJhbmdlIHRvIGluY2x1ZGUgdGhlIHRpY2suXHJcbiAgICAgIGNvbnN0IGhhbGZUaWNrV2lkdGggPSB0aWNrLnRpY2tOb2RlLndpZHRoIC8gMjtcclxuXHJcbiAgICAgIC8vIFRoZSB0aWNrIHdpbGwgYmUgY2VudGVyZWRcclxuICAgICAgbWluaW11bVJhbmdlLmluY2x1ZGVSYW5nZSggbmV3IFJhbmdlKCAtaGFsZlRpY2tXaWR0aCwgaGFsZlRpY2tXaWR0aCApLnNoaWZ0ZWQoIHRpY2tNaW5pbXVtUG9zaXRpb24gKSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIGlmICggc2xpZGVyLndpZHRoU2l6YWJsZSAmJiB0aGlzLnByZWZlcnJlZFByb3BlcnR5LnZhbHVlICE9PSBudWxsICkge1xyXG4gICAgICAvLyBIZXJlJ3Mgd2hlcmUgdGhpbmdzIGdldCBjb21wbGljYXRlZCEgQWJvdmUsIGl0J3MgZmFpcmx5IGVhc3kgdG8gZ28gZnJvbSBcInRyYWNrIGV4dGVyaW9yIHdpZHRoXCIgPT4gXCJzbGlkZXIgd2lkdGhcIixcclxuICAgICAgLy8gaG93ZXZlciB3ZSBuZWVkIHRvIGRvIHRoZSBvcHBvc2l0ZSAod2hlbiBvdXIgaG9yaXpvbnRhbCBzbGlkZXIgaGFzIGEgcHJlZmVycmVkIHdpZHRoLCB3ZSBuZWVkIHRvIGNvbXB1dGUgd2hhdFxyXG4gICAgICAvLyB0cmFjayB3aWR0aCB3ZSdsbCBoYXZlIHRvIG1ha2UgdGhhdCBoYXBwZW4pLiBBcyBJIG5vdGVkIGluIHRoZSBpc3N1ZSBmb3IgdGhpcyB3b3JrOlxyXG5cclxuICAgICAgLy8gVGhlcmUncyBhIGZ1biBsaW5lYXIgb3B0aW1pemF0aW9uIHByb2JsZW0gaGlkaW5nIGluIHBsYWluIHNpZ2h0IChwZXJoYXBzIGEgaGlnaC1wZXJmb3JtYW5jZSBpdGVyYXRpdmUgc29sdXRpb24gd2lsbCB3b3JrKTpcclxuICAgICAgLy8gLSBXZSBjYW4gY29tcHV0ZSBhIG1pbmltdW0gc2l6ZSAoZ2l2ZW4gdGhlIG1pbmltdW0gdHJhY2sgc2l6ZSwgc2VlIHdoZXJlIHRoZSB0aWNrIGxhYmVscyBnbywgYW5kIGluY2x1ZGUgdGhvc2UpLlxyXG4gICAgICAvLyAtIEhPV0VWRVIgYWRqdXN0aW5nIHRoZSB0cmFjayBzaXplIEFMU08gYWRqdXN0cyBob3cgbXVjaCB0aGUgdGljayBsYWJlbHMgc3RpY2sgb3V0IHRvIHRoZSBzaWRlcyAodGhlIGV4cGFuc2lvblxyXG4gICAgICAvLyAgIG9mIHRoZSB0cmFjayB3aWxsIHB1c2ggdGhlIHRpY2sgbGFiZWxzIGF3YXkgZnJvbSB0aGUgZWRnZXMpLlxyXG4gICAgICAvLyAtIERpZmZlcmVudCB0aWNrcyB3aWxsIGJlIHRoZSBsaW1pdGluZyBmYWN0b3IgZm9yIHRoZSBib3VuZHMgYXQgZGlmZmVyZW50IHRyYWNrIHNpemVzIChhIHRpY2sgbGFiZWwgb24gdGhlIHZlcnlcclxuICAgICAgLy8gICBlbmQgc2hvdWxkIG5vdCB2YXJ5IHRoZSBib3VuZHMgb2Zmc2V0LCBidXQgYSB0aWNrIGxhYmVsIHRoYXQncyBsYXJnZXIgYnV0IHNsaWdodGx5IG9mZnNldCBmcm9tIHRoZSBlZGdlIFdJTExcclxuICAgICAgLy8gICB2YXJ5IHRoZSBvZmZzZXQpXHJcbiAgICAgIC8vIC0gU28gaXQncyBlYXN5IHRvIGNvbXB1dGUgdGhlIHJlc3VsdGluZyBzaXplIGZyb20gdGhlIHRyYWNrIHNpemUsIEJVVCB0aGUgaW52ZXJzZSBwcm9ibGVtIGlzIG1vcmUgZGlmZmljdWx0LlxyXG4gICAgICAvLyAgIEVzc2VudGlhbGx5IHdlIGhhdmUgYSBjb252ZXggcGllY2V3aXNlLWxpbmVhciBmdW5jdGlvbiBtYXBwaW5nIHRyYWNrIHNpemUgdG8gb3V0cHV0IHNpemUgKGltcGxpY2l0bHkgZGVmaW5lZFxyXG4gICAgICAvLyAgIGJ5IHdoZXJlIHRpY2sgbGFiZWxzIHN3YXAgYmVpbmcgdGhlIGxpbWl0aW5nIGZhY3RvciksIGFuZCB3ZSBuZWVkIHRvIGludmVydCBpdC5cclxuXHJcbiAgICAgIC8vIEVmZmVjdGl2ZWx5IHRoZSBcInRyYWNrIHdpZHRoXCIgPT4gXCJzbGlkZXIgd2lkdGhcIiBpcyBhIHBpZWNld2lzZS1saW5lYXIgZnVuY3Rpb24sIHdoZXJlIHRoZSBicmVha3BvaW50cyBvY2N1clxyXG4gICAgICAvLyB3aGVyZSBPTkUgdGljayBlaXRoZXIgYmVjb21lcyB0aGUgbGltaXRpbmcgZmFjdG9yIG9yIHN0b3BzIGJlaW5nIHRoZSBsaW1pdGluZyBmYWN0b3IuIE1hdGhlbWF0aWNhbGx5LCB0aGlzIHdvcmtzXHJcbiAgICAgIC8vIG91dCB0byBiZSBiYXNlZCBvbiB0aGUgZm9sbG93aW5nIGZvcm11bGFzOlxyXG5cclxuICAgICAgLy8gVGhlIExFRlQgeCBpcyB0aGUgbWluaW11bSBvZiBhbGwgdGhlIGZvbGxvd2luZzpcclxuICAgICAgLy8gICAtdGh1bWIud2lkdGggLyAyIC0gdHJhY2subGVmdFZpc3VhbE92ZXJmbG93XHJcbiAgICAgIC8vICAgRk9SIEVWRVJZIFRJQ0s6IC10aWNrV2lkdGggLyAyICsgKCB0cmFja1dpZHRoIC0gb3ZlcmZsb3cgKSAqIG5vcm1hbGl6ZWRUaWNrVmFsdWVcclxuICAgICAgLy8gVGhlIFJJR0hUIHggaXMgdGhlIG1heGltdW0gb2YgYWxsIHRoZSBmb2xsb3dpbmc6XHJcbiAgICAgIC8vICAgdHJhY2tXaWR0aCArIHRodW1iLndpZHRoIC8gMiAtIHRyYWNrLmxlZnRWaXN1YWxPdmVyZmxvd1xyXG4gICAgICAvLyAgIChmb3IgZXZlcnkgdGljaykgdGlja1dpZHRoIC8gMiArICggdHJhY2tXaWR0aCAtIG92ZXJmbG93ICkgKiBub3JtYWxpemVkVGlja1ZhbHVlXHJcbiAgICAgIC8vIE5PVEU6IHRoZSBcInRyYWNrV2lkdGggLSBvdmVyZmxvd1wiIGlzIHRoZSBJTlRFUk5BTCB3aWR0aCAobm90IGluY2x1ZGluZyB0aGUgc3Ryb2tlKSB0aGF0IHdlIHVzZSBmb3IgdGlja1xyXG4gICAgICAvLyBjb21wdXRhdGlvblxyXG4gICAgICAvLyBUaGlzIGVmZmVjdGl2ZWx5IGNvbXB1dGVzIGhvdyBmYXIgZXZlcnl0aGluZyBcInN0aWNrcyBvdXRcIiBhbmQgd291bGQgYWZmZWN0IHRoZSBib3VuZHMuXHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIFRoZSBUT1RBTCB3aWR0aCBvZiB0aGUgc2xpZGVyIHdpbGwgc2ltcGx5IGJlIHRoZSBhYm92ZSBSSUdIVCAtIExFRlQuXHJcblxyXG4gICAgICAvLyBJbnN0ZWFkIG9mIHVzaW5nIG51bWVyaWNhbCBzb2x1dGlvbnMsIHdlJ3JlIGFibGUgdG8gc29sdmUgdGhpcyBhbmFseXRpY2FsbHkgd2l0aCBwaWVjZXdpc2UtbGluZWFyIGZ1bmN0aW9ucyB0aGF0XHJcbiAgICAgIC8vIGltcGxlbWVudCB0aGUgYWJvdmUgZnVuY3Rpb25zLiBXZSdsbCBjb25zaWRlciBlYWNoIG9mIHRob3NlIGluZGl2aWR1YWwgZnVuY3Rpb25zIGFzIGEgbGluZWFyIGZ1bmN0aW9uIHdoZXJlXHJcbiAgICAgIC8vIHRoZSBpbnB1dCBpcyB0aGUgZXh0ZXJpb3IgdHJhY2sgbGVuZ3RoLCBlLmcuIGYodHJhY2tMZW5ndGgpID0gQSAqIHRyYWNrTGVuZ3RoICsgQiwgZm9yIGdpdmVuIEEsQiB2YWx1ZXMuXHJcbiAgICAgIC8vIEJ5IG1pbi9tYXgtaW5nIHRoZXNlIHRvZ2V0aGVyIGFuZCB0aGVuIHRha2luZyB0aGUgZGlmZmVyZW5jZSwgd2UnbGwgaGF2ZSBhbiBhY2N1cmF0ZSBmdW5jdGlvbiBvZlxyXG4gICAgICAvLyBmKHRyYWNrTGVuZ3RoKSA9IHNsaWRlcldpZHRoLiBUaGVuIHdlJ2xsIGludmVydCB0aGF0IGZ1bmN0aW9uLCBlLmcuIGZeLTEoc2xpZGVyV2lkdGgpID0gdHJhY2tMZW5ndGgsIGFuZCB0aGVuXHJcbiAgICAgIC8vIHdlJ2xsIGJlIGFibGUgdG8gcGFzcyBpbiBvdXIgcHJlZmVycmVkIHNsaWRlciB3aWR0aCBpbiBvcmRlciB0byBjb21wdXRlIHRoZSBwcmVmZXJyZWQgdHJhY2sgbGVuZ3RoLlxyXG5cclxuICAgICAgLy8gV2UnbGwgbmVlZCB0byBmYWN0b3IgdGhlIHRyYWNrV2lkdGggb3V0IGZvciB0aGUgdGljayBmdW5jdGlvbnMsIHNvOlxyXG4gICAgICAvLyBMRUZUIHRpY2sgY29tcHV0YXRpb25zOlxyXG4gICAgICAvLyAgIC10aWNrV2lkdGggLyAyICsgKCB0cmFja1dpZHRoIC0gb3ZlcmZsb3cgKSAqIG5vcm1hbGl6ZWRUaWNrVmFsdWVcclxuICAgICAgLy8gPSAtdGlja1dpZHRoIC8gMiArIHRyYWNrV2lkdGggKiBub3JtYWxpemVkVGlja1ZhbHVlIC0gb3ZlcmZsb3cgKiBub3JtYWxpemVkVGlja1ZhbHVlXHJcbiAgICAgIC8vID0gbm9ybWFsaXplZFRpY2tWYWx1ZSAqIHRyYWNrV2lkdGggKyAoIC10aWNrV2lkdGggLyAyIC0gb3ZlcmZsb3cgKiBub3JtYWxpemVkVGlja1ZhbHVlIClcclxuICAgICAgLy8gU28gd2hlbiB3ZSBwdXQgaXQgaW4gdGhlIGZvcm0gb2YgQSAqIHRyYWNrV2lkdGggKyBCLCB3ZSBnZXQ6XHJcbiAgICAgIC8vICAgQSA9IG5vcm1hbGl6ZWRUaWNrVmFsdWUsIEIgPSAtdGlja1dpZHRoIC8gMiAtIG92ZXJmbG93ICogbm9ybWFsaXplZFRpY2tWYWx1ZVxyXG4gICAgICAvLyBTaW1pbGFybHkgaGFwcGVucyBmb3IgdGhlIFJJR0hUIHRpY2sgY29tcHV0YXRpb24uXHJcblxyXG4gICAgICBjb25zdCB0cmFja1dpZHRoVG9GdWxsV2lkdGhGdW5jdGlvbiA9IENvbXBsZXRlUGllY2V3aXNlTGluZWFyRnVuY3Rpb24ubWF4KFxyXG4gICAgICAgIC8vIFJpZ2h0IHNpZGUgKHRyYWNrL3RodW1iKVxyXG4gICAgICAgIENvbXBsZXRlUGllY2V3aXNlTGluZWFyRnVuY3Rpb24ubGluZWFyKCAxLCByaWdodEV4dGVyaW9yT2Zmc2V0ICksXHJcbiAgICAgICAgLy8gUmlnaHQgc2lkZSAodGlja3MpXHJcbiAgICAgICAgLi4udGhpcy50aWNrcy5tYXAoIHRpY2sgPT4ge1xyXG4gICAgICAgICAgY29uc3Qgbm9ybWFsaXplZFRpY2tWYWx1ZSA9IG5vcm1hbGl6ZVRpY2tWYWx1ZSggdGljay52YWx1ZSApO1xyXG4gICAgICAgICAgcmV0dXJuIENvbXBsZXRlUGllY2V3aXNlTGluZWFyRnVuY3Rpb24ubGluZWFyKCBub3JtYWxpemVkVGlja1ZhbHVlLCB0aWNrLnRpY2tOb2RlLndpZHRoIC8gMiAtIHRvdGFsT3ZlcmZsb3cgKiBub3JtYWxpemVkVGlja1ZhbHVlICk7XHJcbiAgICAgICAgfSApXHJcbiAgICAgICkubWludXMoIENvbXBsZXRlUGllY2V3aXNlTGluZWFyRnVuY3Rpb24ubWluKFxyXG4gICAgICAgIC8vIExlZnQgc2lkZSAodHJhY2svdGh1bWIpXHJcbiAgICAgICAgQ29tcGxldGVQaWVjZXdpc2VMaW5lYXJGdW5jdGlvbi5jb25zdGFudCggbGVmdEV4dGVyaW9yT2Zmc2V0ICksXHJcbiAgICAgICAgLy8gTGVmdCBzaWRlICh0aWNrcylcclxuICAgICAgICAuLi50aGlzLnRpY2tzLm1hcCggdGljayA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRUaWNrVmFsdWUgPSBub3JtYWxpemVUaWNrVmFsdWUoIHRpY2sudmFsdWUgKTtcclxuICAgICAgICAgICAgcmV0dXJuIENvbXBsZXRlUGllY2V3aXNlTGluZWFyRnVuY3Rpb24ubGluZWFyKCBub3JtYWxpemVkVGlja1ZhbHVlLCAtdGljay50aWNrTm9kZS53aWR0aCAvIDIgLSB0b3RhbE92ZXJmbG93ICogbm9ybWFsaXplZFRpY2tWYWx1ZSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICkgKSApO1xyXG5cclxuICAgICAgLy8gTk9URTogVGhpcyBmdW5jdGlvbiBpcyBvbmx5IG1vbm90b25pY2FsbHkgaW5jcmVhc2luZyB3aGVuIHRyYWNrV2lkdGggaXMgcG9zaXRpdmUhIFdlJ2xsIGRyb3AgdGhlIHZhbHVlc1xyXG4gICAgICAvLyB1bmRlcm5lYXRoIG91ciBtaW5pbXVtIHRyYWNrIHdpZHRoICh0aGV5IHdvbid0IGJlIG5lZWRlZCksIGJ1dCB3ZSdsbCBuZWVkIHRvIGFkZCBhbiBleHRyYSBwb2ludCBiZWxvdyB0byBlbnN1cmVcclxuICAgICAgLy8gdGhhdCB0aGUgc2xvcGUgaXMgbWFpbnRhaW5lZCAoZHVlIHRvIGhvdyBDb21wbGV0ZVBpZWNld2lzZUxpbmVhckZ1bmN0aW9uIHdvcmtzKS5cclxuICAgICAgY29uc3QgZnVsbFdpZHRoVG9UcmFja1dpZHRoRnVuY3Rpb24gPSB0cmFja1dpZHRoVG9GdWxsV2lkdGhGdW5jdGlvbi53aXRoWFZhbHVlcyggW1xyXG4gICAgICAgIHRyYWNrTWluaW11bUV4dGVyaW9yV2lkdGggLSAxLFxyXG4gICAgICAgIHRyYWNrTWluaW11bUV4dGVyaW9yV2lkdGgsXHJcbiAgICAgICAgLi4udHJhY2tXaWR0aFRvRnVsbFdpZHRoRnVuY3Rpb24ucG9pbnRzLm1hcCggcG9pbnQgPT4gcG9pbnQueCApLmZpbHRlciggeCA9PiB4ID4gdHJhY2tNaW5pbXVtRXh0ZXJpb3JXaWR0aCArIDFlLTEwIClcclxuICAgICAgXSApLmludmVydGVkKCk7XHJcblxyXG4gICAgICB0cmFjay5wcmVmZXJyZWRXaWR0aCA9IE1hdGgubWF4KFxyXG4gICAgICAgIC8vIEVuc3VyZSB3ZSdyZSBOT1QgZGlwcGluZyBiZWxvdyB0aGUgbWluaW11bSB0cmFjayB3aWR0aCAoZm9yIHNvbWUgcmVhc29uKS5cclxuICAgICAgICB0cmFja01pbmltdW1FeHRlcmlvcldpZHRoLFxyXG4gICAgICAgIGZ1bGxXaWR0aFRvVHJhY2tXaWR0aEZ1bmN0aW9uLmV2YWx1YXRlKCB0aGlzLnByZWZlcnJlZFByb3BlcnR5LnZhbHVlIClcclxuICAgICAgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0cmFjay5wcmVmZXJyZWRXaWR0aCA9IHRyYWNrLm1pbmltdW1XaWR0aDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtaW5pbXVtV2lkdGggPSBtaW5pbXVtUmFuZ2UuZ2V0TGVuZ3RoKCk7XHJcblxyXG4gICAgLy8gU2V0IG1pbmltdW1zIGF0IHRoZSBlbmRcclxuICAgIGlmICggdGhpcy5vcmllbnRhdGlvbiA9PT0gT3JpZW50YXRpb24uSE9SSVpPTlRBTCApIHtcclxuICAgICAgc2xpZGVyLmxvY2FsTWluaW11bVdpZHRoID0gbWluaW11bVdpZHRoO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHNsaWRlci5sb2NhbE1pbmltdW1IZWlnaHQgPSBtaW5pbXVtV2lkdGg7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuZGlzcG9zZVNsaWRlckNvbnN0cmFpbnQoKTtcclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICB9XHJcbn1cclxuXHJcbnN1bi5yZWdpc3RlciggJ1NsaWRlcicsIFNsaWRlciApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFJQSxPQUFPQSxRQUFRLE1BQU0sMkJBQTJCO0FBQ2hELE9BQU9DLGdCQUFnQixNQUFNLG1DQUFtQztBQUNoRSxPQUFPQyxVQUFVLE1BQU0sNEJBQTRCO0FBQ25ELE9BQU9DLCtCQUErQixNQUFNLGlEQUFpRDtBQUM3RixPQUFPQyxLQUFLLE1BQU0sdUJBQXVCO0FBQ3pDLE9BQU9DLEtBQUssTUFBTSx1QkFBdUI7QUFDekMsT0FBT0MsOEJBQThCLE1BQU0sc0RBQXNEO0FBQ2pHLE9BQU9DLGdCQUFnQixNQUFNLHNEQUFzRDtBQUNuRixPQUFPQyxTQUFTLElBQUlDLGNBQWMsUUFBUSxpQ0FBaUM7QUFDM0UsT0FBT0MsV0FBVyxNQUFNLG1DQUFtQztBQUMzRCxPQUFPQyxjQUFjLE1BQU0sc0NBQXNDO0FBQ2pFLFNBQVNDLFlBQVksRUFBRUMsaUJBQWlCLEVBQUVDLGdCQUFnQixFQUFFQyxJQUFJLEVBQWVDLGdCQUFnQixFQUFFQyxPQUFPLFFBQWdCLDZCQUE2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