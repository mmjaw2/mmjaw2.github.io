// Copyright 2014-2024, University of Colorado Boulder

/**
 * A scenery node that is used to represent a draggable Measuring Tape. It contains a tip and a base that can be dragged
 * separately, with a text indicating the measurement. The motion of the measuring tape can be confined by drag bounds.
 * The position of the measuring tape should be set via the basePosition and tipPosition rather than the scenery
 * coordinates
 *
 * @author Vasily Shakhov (Mlearner)
 * @author Siddhartha Chinthapally (ActualConcepts)
 * @author Aaron Davis (PhET Interactive Simulations)
 * @author Martin Veillette (Berea College)
 */

import DerivedProperty from '../../axon/js/DerivedProperty.js';
import Multilink from '../../axon/js/Multilink.js';
import Property from '../../axon/js/Property.js';
import Bounds2 from '../../dot/js/Bounds2.js';
import Utils from '../../dot/js/Utils.js';
import Vector2 from '../../dot/js/Vector2.js';
import Vector2Property from '../../dot/js/Vector2Property.js';
import { Shape } from '../../kite/js/imports.js';
import InstanceRegistry from '../../phet-core/js/documentation/InstanceRegistry.js';
import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
import StringUtils from '../../phetcommon/js/util/StringUtils.js';
import ModelViewTransform2 from '../../phetcommon/js/view/ModelViewTransform2.js';
import { Circle, Image, InteractiveHighlightingNode, Line, Node, Path, Rectangle, Text } from '../../scenery/js/imports.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import measuringTape_png from '../images/measuringTape_png.js';
import PhetFont from './PhetFont.js';
import sceneryPhet from './sceneryPhet.js';
import SceneryPhetStrings from './SceneryPhetStrings.js';
import DerivedStringProperty from '../../axon/js/DerivedStringProperty.js';
import Tandem from '../../tandem/js/Tandem.js';
import RichKeyboardDragListener from '../../scenery-phet/js/RichKeyboardDragListener.js';
import RichDragListener from '../../scenery-phet/js/RichDragListener.js';
// Drag speed with the keyboard, in view coordinates per second
const KEYBOARD_DRAG_SPEED = 600;

/**
 * NOTE: NodeTranslationOptions are omitted because you must use basePositionProperty and tipPositionProperty to
 * position this Node.
 */

class MeasuringTapeNode extends Node {
  // the distance measured by the tape

  // parent that displays the text and its background

  // If you provide position Properties for the base and tip, then you are responsible for resetting and disposing them.

  constructor(unitsProperty, providedOptions) {
    const ownsBasePositionProperty = !providedOptions?.basePositionProperty;
    const ownsTipPositionProperty = !providedOptions?.tipPositionProperty;
    const options = optionize()({
      // base Position in model coordinate reference frame (rightBottom position of the measuring tape image)
      basePositionProperty: new Vector2Property(new Vector2(0, 0)),
      // tip Position in model coordinate reference frame (center position of the tip)
      tipPositionProperty: new Vector2Property(new Vector2(1, 0)),
      // use this to omit the value and units displayed below the tape measure, useful with createIcon
      hasValue: true,
      // bounds for the measuring tape (in model coordinate reference frame), default value is everything,
      // effectively no bounds
      dragBounds: Bounds2.EVERYTHING,
      textPosition: new Vector2(0, 30),
      // position of the text relative to center of the base image in view units
      modelViewTransform: ModelViewTransform2.createIdentity(),
      significantFigures: 1,
      // number of significant figures in the length measurement
      textColor: 'white',
      // {ColorDef} color of the length measurement and unit
      textBackgroundColor: null,
      // {ColorDef} fill color of the text background
      textBackgroundXMargin: 4,
      textBackgroundYMargin: 2,
      textBackgroundCornerRadius: 2,
      textMaxWidth: 200,
      textFont: new PhetFont({
        size: 16,
        weight: 'bold'
      }),
      // font for the measurement text
      baseScale: 0.8,
      // control the size of the measuring tape Image (the base)
      lineColor: 'gray',
      // color of the tapeline itself
      tapeLineWidth: 2,
      // lineWidth of the tape line
      tipCircleColor: 'rgba(0,0,0,0.1)',
      // color of the circle at the tip
      tipCircleRadius: 10,
      // radius of the circle on the tip
      crosshairColor: 'rgb(224, 95, 32)',
      // orange, color of the two crosshairs
      crosshairSize: 5,
      // size of the crosshairs in scenery coordinates ( measured from center)
      crosshairLineWidth: 2,
      // linewidth of the crosshairs
      isBaseCrosshairRotating: true,
      // do crosshairs rotate around their own axis to line up with the tapeline
      isTipCrosshairRotating: true,
      // do crosshairs rotate around their own axis to line up with the tapeline
      isTipDragBounded: true,
      // is the tip subject to dragBounds
      interactive: true,
      // specifies whether the node adds its own input listeners. Setting this to false may be helpful in creating an icon.
      baseDragStarted: _.noop,
      // called when the base drag starts
      baseDragEnded: _.noop,
      // called when the base drag ends, for testing whether it has dropped into the toolbox
      phetioReadoutStringPropertyInstrumented: true,
      phetioFeaturedMeasuredDistanceProperty: false,
      baseKeyboardDragListenerOptions: {
        dragSpeed: KEYBOARD_DRAG_SPEED,
        shiftDragSpeed: KEYBOARD_DRAG_SPEED / 4
      },
      tipKeyboardDragListenerOptions: {
        dragSpeed: KEYBOARD_DRAG_SPEED,
        shiftDragSpeed: KEYBOARD_DRAG_SPEED / 4
      }
    }, providedOptions);
    super();
    assert && assert(Math.abs(options.modelViewTransform.modelToViewDeltaX(1)) === Math.abs(options.modelViewTransform.modelToViewDeltaY(1)), 'The y and x scale factor are not identical');
    this.unitsProperty = unitsProperty;
    this.significantFigures = options.significantFigures;
    this.dragBoundsProperty = new Property(options.dragBounds);
    this.modelViewTransformProperty = new Property(options.modelViewTransform);
    this.isTipDragBounded = options.isTipDragBounded;
    this.basePositionProperty = options.basePositionProperty;
    this.tipPositionProperty = options.tipPositionProperty;
    this.ownsBasePositionProperty = ownsBasePositionProperty;
    this.ownsTipPositionProperty = ownsTipPositionProperty;

    // private Property and its public read-only interface
    this._isTipUserControlledProperty = new Property(false);
    this.isTipUserControlledProperty = this._isTipUserControlledProperty;

    // private Property and its public read-only interface
    this._isBaseUserControlledProperty = new Property(false);
    this.isBaseUserControlledProperty = this._isBaseUserControlledProperty;
    assert && assert(this.basePositionProperty.units === this.tipPositionProperty.units, 'units should match');
    this.measuredDistanceProperty = new DerivedProperty([this.basePositionProperty, this.tipPositionProperty], (basePosition, tipPosition) => basePosition.distance(tipPosition), {
      tandem: options.tandem?.createTandem('measuredDistanceProperty'),
      phetioDocumentation: 'The distance measured by the measuring tape',
      phetioValueType: NumberIO,
      phetioFeatured: options.phetioFeaturedMeasuredDistanceProperty,
      units: this.basePositionProperty.units
    });
    const crosshairShape = new Shape().moveTo(-options.crosshairSize, 0).moveTo(-options.crosshairSize, 0).lineTo(options.crosshairSize, 0).moveTo(0, -options.crosshairSize).lineTo(0, options.crosshairSize);
    const baseCrosshair = new Path(crosshairShape, {
      stroke: options.crosshairColor,
      lineWidth: options.crosshairLineWidth
    });
    const tipCrosshair = new Path(crosshairShape, {
      stroke: options.crosshairColor,
      lineWidth: options.crosshairLineWidth
    });
    const tipCircle = new Circle(options.tipCircleRadius, {
      fill: options.tipCircleColor
    });
    const baseImageParent = new InteractiveHighlightingNode({
      // will only be enabled if interactive
      interactiveHighlightEnabled: false
    });
    this.baseImage = new Image(measuringTape_png, {
      scale: options.baseScale,
      cursor: 'pointer',
      // pdom
      tagName: 'div',
      focusable: true,
      ariaRole: 'application',
      innerContent: SceneryPhetStrings.a11y.measuringTapeStringProperty,
      ariaLabel: SceneryPhetStrings.a11y.measuringTapeStringProperty
    });
    baseImageParent.addChild(this.baseImage);

    // create tapeline (running from one crosshair to the other)
    const tapeLine = new Line(this.basePositionProperty.value, this.tipPositionProperty.value, {
      stroke: options.lineColor,
      lineWidth: options.tapeLineWidth
    });

    // add tipCrosshair and tipCircle to the tip
    const tip = new InteractiveHighlightingNode({
      children: [tipCircle, tipCrosshair],
      cursor: 'pointer',
      // interactive highlights - will only be enabled when interactive
      interactiveHighlightEnabled: false,
      // pdom
      tagName: 'div',
      focusable: true,
      ariaRole: 'application',
      innerContent: SceneryPhetStrings.a11y.measuringTapeTipStringProperty,
      ariaLabel: SceneryPhetStrings.a11y.measuringTapeTipStringProperty
    });
    const readoutStringProperty = new DerivedStringProperty([this.unitsProperty, this.measuredDistanceProperty, SceneryPhetStrings.measuringTapeReadoutPatternStringProperty], (units, measuredDistance, measuringTapeReadoutPattern) => {
      const distance = Utils.toFixed(units.multiplier * measuredDistance, this.significantFigures);
      return StringUtils.fillIn(measuringTapeReadoutPattern, {
        distance: distance,
        units: units.name
      });
    }, {
      tandem: options.phetioReadoutStringPropertyInstrumented ? options.tandem?.createTandem('readoutStringProperty') : Tandem.OPT_OUT,
      phetioDocumentation: 'The text content of the readout on the measuring tape'
    });
    this.valueNode = new Text(readoutStringProperty, {
      font: options.textFont,
      fill: options.textColor,
      maxWidth: options.textMaxWidth
    });
    this.valueBackgroundNode = new Rectangle(0, 0, 1, 1, {
      cornerRadius: options.textBackgroundCornerRadius,
      fill: options.textBackgroundColor
    });

    // Resizes the value background and centers it on the value
    const updateValueBackgroundNode = () => {
      const valueBackgroundWidth = this.valueNode.width + 2 * options.textBackgroundXMargin;
      const valueBackgroundHeight = this.valueNode.height + 2 * options.textBackgroundYMargin;
      this.valueBackgroundNode.setRect(0, 0, valueBackgroundWidth, valueBackgroundHeight);
      this.valueBackgroundNode.center = this.valueNode.center;
    };
    this.valueNode.boundsProperty.lazyLink(updateValueBackgroundNode);
    updateValueBackgroundNode();

    // expand the area for touch
    tip.touchArea = tip.localBounds.dilated(15);
    this.baseImage.touchArea = this.baseImage.localBounds.dilated(20);
    this.baseImage.mouseArea = this.baseImage.localBounds.dilated(10);
    this.addChild(tapeLine); // tapeline going from one crosshair to the other
    this.addChild(baseCrosshair); // crosshair near the base, (set at basePosition)
    this.addChild(baseImageParent); // base of the measuring tape

    this.valueContainer = new Node({
      children: [this.valueBackgroundNode, this.valueNode]
    });
    if (options.hasValue) {
      this.addChild(this.valueContainer);
    }
    this.addChild(tip); // crosshair and circle at the tip (set at tipPosition)

    let baseStartOffset;
    this.baseDragListener = null;
    if (options.interactive) {
      // interactive highlights - highlights are enabled only when the component is interactive
      baseImageParent.interactiveHighlightEnabled = true;
      tip.interactiveHighlightEnabled = true;
      const baseStart = () => {
        this.moveToFront();
        options.baseDragStarted();
        this._isBaseUserControlledProperty.value = true;
      };
      const baseEnd = () => {
        this._isBaseUserControlledProperty.value = false;
        options.baseDragEnded();
      };
      const handleTipOnBaseDrag = delta => {
        // translate the position of the tip if it is not being dragged
        // when the user is not holding onto the tip, dragging the body will also drag the tip
        if (!this.isTipUserControlledProperty.value) {
          const unconstrainedTipPosition = delta.plus(this.tipPositionProperty.value);
          if (options.isTipDragBounded) {
            const constrainedTipPosition = this.dragBoundsProperty.value.closestPointTo(unconstrainedTipPosition);
            // translation of the tipPosition (subject to the constraining drag bounds)
            this.tipPositionProperty.set(constrainedTipPosition);
          } else {
            this.tipPositionProperty.set(unconstrainedTipPosition);
          }
        }
      };

      // Drag listener for base
      this.baseDragListener = new RichDragListener(combineOptions({
        tandem: options.tandem?.createTandem('baseDragListener'),
        start: event => {
          baseStart();
          const position = this.modelViewTransformProperty.value.modelToViewPosition(this.basePositionProperty.value);
          baseStartOffset = event.currentTarget.globalToParentPoint(event.pointer.point).minus(position);
        },
        drag: (event, listener) => {
          const parentPoint = listener.currentTarget.globalToParentPoint(event.pointer.point).minus(baseStartOffset);
          const unconstrainedBasePosition = this.modelViewTransformProperty.value.viewToModelPosition(parentPoint);
          const constrainedBasePosition = this.dragBoundsProperty.value.closestPointTo(unconstrainedBasePosition);

          // the basePosition value has not been updated yet, hence it is the old value of the basePosition;
          const translationDelta = constrainedBasePosition.minus(this.basePositionProperty.value); // in model reference frame

          // translation of the basePosition (subject to the constraining drag bounds)
          this.basePositionProperty.set(constrainedBasePosition);
          handleTipOnBaseDrag(translationDelta);
        },
        end: baseEnd
      }, options.baseDragListenerOptions));
      this.baseImage.addInputListener(this.baseDragListener);

      // Drag listener for base
      const baseKeyboardDragListener = new RichKeyboardDragListener(combineOptions({
        tandem: options.tandem?.createTandem('baseKeyboardDragListener'),
        positionProperty: this.basePositionProperty,
        transform: this.modelViewTransformProperty,
        dragBoundsProperty: this.dragBoundsProperty,
        start: baseStart,
        drag: (event, listener) => {
          handleTipOnBaseDrag(listener.vectorDelta);
        },
        end: baseEnd
      }, options.baseKeyboardDragListenerOptions));
      this.baseImage.addInputListener(baseKeyboardDragListener);
      const tipEnd = () => {
        this._isTipUserControlledProperty.value = false;
      };
      let tipStartOffset;

      // Drag listener for tip
      const tipDragListener = new RichDragListener(combineOptions({
        tandem: options.tandem?.createTandem('tipDragListener'),
        start: event => {
          this.moveToFront();
          this._isTipUserControlledProperty.value = true;
          const position = this.modelViewTransformProperty.value.modelToViewPosition(this.tipPositionProperty.value);
          tipStartOffset = event.currentTarget.globalToParentPoint(event.pointer.point).minus(position);
        },
        drag: (event, listener) => {
          const parentPoint = listener.currentTarget.globalToParentPoint(event.pointer.point).minus(tipStartOffset);
          const unconstrainedTipPosition = this.modelViewTransformProperty.value.viewToModelPosition(parentPoint);
          if (options.isTipDragBounded) {
            // translation of the tipPosition (subject to the constraining drag bounds)
            this.tipPositionProperty.value = this.dragBoundsProperty.value.closestPointTo(unconstrainedTipPosition);
          } else {
            this.tipPositionProperty.value = unconstrainedTipPosition;
          }
        },
        end: tipEnd
      }, options.tipDragListenerOptions));
      tip.addInputListener(tipDragListener);
      const tipKeyboardDragListener = new RichKeyboardDragListener(combineOptions({
        tandem: options.tandem?.createTandem('tipKeyboardDragListener'),
        positionProperty: this.tipPositionProperty,
        dragBoundsProperty: options.isTipDragBounded ? this.dragBoundsProperty : null,
        transform: this.modelViewTransformProperty,
        start: () => {
          this.moveToFront();
          this._isTipUserControlledProperty.value = true;
        },
        end: tipEnd
      }, options.tipKeyboardDragListenerOptions));
      tip.addInputListener(tipKeyboardDragListener);

      // If this Node becomes invisible, interrupt user interaction.
      this.visibleProperty.lazyLink(visible => {
        if (!visible) {
          this.interruptSubtreeInput();
        }
      });
    }
    const updateTextReadout = () => {
      this.valueNode.centerTop = this.baseImage.center.plus(options.textPosition.times(options.baseScale));
    };
    readoutStringProperty.link(updateTextReadout);

    // link the positions of base and tip to the measuring tape to the scenery update function.
    // Must be disposed.
    const multilink = Multilink.multilink([this.measuredDistanceProperty, unitsProperty, this.modelViewTransformProperty, this.tipPositionProperty, this.basePositionProperty], (measuredDistance, units, modelViewTransform, tipPosition, basePosition) => {
      const viewTipPosition = modelViewTransform.modelToViewPosition(tipPosition);
      const viewBasePosition = modelViewTransform.modelToViewPosition(basePosition);

      // calculate the orientation and change of orientation of the Measuring tape
      const oldAngle = this.baseImage.getRotation();
      const angle = Math.atan2(viewTipPosition.y - viewBasePosition.y, viewTipPosition.x - viewBasePosition.x);
      const deltaAngle = angle - oldAngle;

      // set position of the tip and the base crosshair
      baseCrosshair.center = viewBasePosition;
      tip.center = viewTipPosition;

      // in order to avoid all kind of geometrical issues with position,
      // let's reset the baseImage upright and then set its position and rotation
      this.baseImage.setRotation(0);
      this.baseImage.rightBottom = viewBasePosition;
      this.baseImage.rotateAround(this.baseImage.rightBottom, angle);

      // reposition the tapeline
      tapeLine.setLine(viewBasePosition.x, viewBasePosition.y, viewTipPosition.x, viewTipPosition.y);

      // rotate the crosshairs
      if (options.isTipCrosshairRotating) {
        tip.rotateAround(viewTipPosition, deltaAngle);
      }
      if (options.isBaseCrosshairRotating) {
        baseCrosshair.rotateAround(viewBasePosition, deltaAngle);
      }
      updateTextReadout();
    });
    this.disposeMeasuringTapeNode = () => {
      multilink.dispose();
      readoutStringProperty.dispose();
      this.ownsBasePositionProperty && this.basePositionProperty.dispose();
      this.ownsTipPositionProperty && this.tipPositionProperty.dispose();

      // interactive highlighting related listeners require disposal
      baseImageParent.dispose();
      tip.dispose();
    };
    this.mutate(options);

    // support for binder documentation, stripped out in builds and only runs when ?binder is specified
    assert && phet?.chipper?.queryParameters?.binder && InstanceRegistry.registerDataURL('scenery-phet', 'MeasuringTapeNode', this);
  }
  reset() {
    this.ownsBasePositionProperty && this.basePositionProperty.reset();
    this.ownsTipPositionProperty && this.tipPositionProperty.reset();
  }
  dispose() {
    this.disposeMeasuringTapeNode();
    super.dispose();
  }

  /**
   * Sets the dragBounds of the measuring tape.
   * In addition, it forces the tip and base of the measuring tape to be within the new bounds.
   */
  setDragBounds(newDragBounds) {
    const dragBounds = newDragBounds.copy();
    this.dragBoundsProperty.value = dragBounds;

    // sets the base position of the measuring tape, which may have changed if it was outside of the dragBounds
    this.basePositionProperty.value = dragBounds.closestPointTo(this.basePositionProperty.value);

    // sets a new tip position if the tip of the measuring tape is subject to dragBounds
    if (this.isTipDragBounded) {
      this.tipPositionProperty.value = dragBounds.closestPointTo(this.tipPositionProperty.value);
    }
  }

  /**
   * Gets the dragBounds of the measuring tape.
   */
  getDragBounds() {
    return this.dragBoundsProperty.value.copy();
  }

  /**
   * Returns the center of the base in the measuring tape's local coordinate frame.
   */
  getLocalBaseCenter() {
    return new Vector2(-this.baseImage.imageWidth / 2, -this.baseImage.imageHeight / 2);
  }

  /**
   * Returns the bounding box of the measuring tape's base within its local coordinate frame
   */
  getLocalBaseBounds() {
    return this.baseImage.bounds.copy();
  }

  /**
   * Initiates a drag of the base (whole measuring tape) from a Scenery event.
   */
  startBaseDrag(event) {
    this.baseDragListener && this.baseDragListener.press(event);
  }

  /**
   * Creates an icon of the measuring tape.
   */
  static createIcon(providedOptions) {
    // See documentation above!
    const options = optionize()({
      tapeLength: 30
    }, providedOptions);

    // Create an actual measuring tape.
    const measuringTapeNode = new MeasuringTapeNode(new Property({
      name: '',
      multiplier: 1
    }), {
      tipPositionProperty: new Vector2Property(new Vector2(options.tapeLength, 0)),
      hasValue: false,
      // no value below the tape
      interactive: false
    });
    options.children = [measuringTapeNode];

    // Create the icon, with measuringTape as its initial child.  This child will be replaced once the image becomes
    // available in the callback to toImage (see below). Since toImage happens asynchronously, this ensures that
    // the icon has initial bounds that will match the icon once the image is available.
    const measuringTapeIcon = new Node(options);

    // Convert measuringTapeNode to an image, and make it the child of measuringTapeIcon.
    measuringTapeNode.toImage(image => measuringTapeIcon.setChildren([new Image(image)]));
    return measuringTapeIcon;
  }
}
sceneryPhet.register('MeasuringTapeNode', MeasuringTapeNode);
export default MeasuringTapeNode;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJEZXJpdmVkUHJvcGVydHkiLCJNdWx0aWxpbmsiLCJQcm9wZXJ0eSIsIkJvdW5kczIiLCJVdGlscyIsIlZlY3RvcjIiLCJWZWN0b3IyUHJvcGVydHkiLCJTaGFwZSIsIkluc3RhbmNlUmVnaXN0cnkiLCJvcHRpb25pemUiLCJjb21iaW5lT3B0aW9ucyIsIlN0cmluZ1V0aWxzIiwiTW9kZWxWaWV3VHJhbnNmb3JtMiIsIkNpcmNsZSIsIkltYWdlIiwiSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdOb2RlIiwiTGluZSIsIk5vZGUiLCJQYXRoIiwiUmVjdGFuZ2xlIiwiVGV4dCIsIk51bWJlcklPIiwibWVhc3VyaW5nVGFwZV9wbmciLCJQaGV0Rm9udCIsInNjZW5lcnlQaGV0IiwiU2NlbmVyeVBoZXRTdHJpbmdzIiwiRGVyaXZlZFN0cmluZ1Byb3BlcnR5IiwiVGFuZGVtIiwiUmljaEtleWJvYXJkRHJhZ0xpc3RlbmVyIiwiUmljaERyYWdMaXN0ZW5lciIsIktFWUJPQVJEX0RSQUdfU1BFRUQiLCJNZWFzdXJpbmdUYXBlTm9kZSIsImNvbnN0cnVjdG9yIiwidW5pdHNQcm9wZXJ0eSIsInByb3ZpZGVkT3B0aW9ucyIsIm93bnNCYXNlUG9zaXRpb25Qcm9wZXJ0eSIsImJhc2VQb3NpdGlvblByb3BlcnR5Iiwib3duc1RpcFBvc2l0aW9uUHJvcGVydHkiLCJ0aXBQb3NpdGlvblByb3BlcnR5Iiwib3B0aW9ucyIsImhhc1ZhbHVlIiwiZHJhZ0JvdW5kcyIsIkVWRVJZVEhJTkciLCJ0ZXh0UG9zaXRpb24iLCJtb2RlbFZpZXdUcmFuc2Zvcm0iLCJjcmVhdGVJZGVudGl0eSIsInNpZ25pZmljYW50RmlndXJlcyIsInRleHRDb2xvciIsInRleHRCYWNrZ3JvdW5kQ29sb3IiLCJ0ZXh0QmFja2dyb3VuZFhNYXJnaW4iLCJ0ZXh0QmFja2dyb3VuZFlNYXJnaW4iLCJ0ZXh0QmFja2dyb3VuZENvcm5lclJhZGl1cyIsInRleHRNYXhXaWR0aCIsInRleHRGb250Iiwic2l6ZSIsIndlaWdodCIsImJhc2VTY2FsZSIsImxpbmVDb2xvciIsInRhcGVMaW5lV2lkdGgiLCJ0aXBDaXJjbGVDb2xvciIsInRpcENpcmNsZVJhZGl1cyIsImNyb3NzaGFpckNvbG9yIiwiY3Jvc3NoYWlyU2l6ZSIsImNyb3NzaGFpckxpbmVXaWR0aCIsImlzQmFzZUNyb3NzaGFpclJvdGF0aW5nIiwiaXNUaXBDcm9zc2hhaXJSb3RhdGluZyIsImlzVGlwRHJhZ0JvdW5kZWQiLCJpbnRlcmFjdGl2ZSIsImJhc2VEcmFnU3RhcnRlZCIsIl8iLCJub29wIiwiYmFzZURyYWdFbmRlZCIsInBoZXRpb1JlYWRvdXRTdHJpbmdQcm9wZXJ0eUluc3RydW1lbnRlZCIsInBoZXRpb0ZlYXR1cmVkTWVhc3VyZWREaXN0YW5jZVByb3BlcnR5IiwiYmFzZUtleWJvYXJkRHJhZ0xpc3RlbmVyT3B0aW9ucyIsImRyYWdTcGVlZCIsInNoaWZ0RHJhZ1NwZWVkIiwidGlwS2V5Ym9hcmREcmFnTGlzdGVuZXJPcHRpb25zIiwiYXNzZXJ0IiwiTWF0aCIsImFicyIsIm1vZGVsVG9WaWV3RGVsdGFYIiwibW9kZWxUb1ZpZXdEZWx0YVkiLCJkcmFnQm91bmRzUHJvcGVydHkiLCJtb2RlbFZpZXdUcmFuc2Zvcm1Qcm9wZXJ0eSIsIl9pc1RpcFVzZXJDb250cm9sbGVkUHJvcGVydHkiLCJpc1RpcFVzZXJDb250cm9sbGVkUHJvcGVydHkiLCJfaXNCYXNlVXNlckNvbnRyb2xsZWRQcm9wZXJ0eSIsImlzQmFzZVVzZXJDb250cm9sbGVkUHJvcGVydHkiLCJ1bml0cyIsIm1lYXN1cmVkRGlzdGFuY2VQcm9wZXJ0eSIsImJhc2VQb3NpdGlvbiIsInRpcFBvc2l0aW9uIiwiZGlzdGFuY2UiLCJ0YW5kZW0iLCJjcmVhdGVUYW5kZW0iLCJwaGV0aW9Eb2N1bWVudGF0aW9uIiwicGhldGlvVmFsdWVUeXBlIiwicGhldGlvRmVhdHVyZWQiLCJjcm9zc2hhaXJTaGFwZSIsIm1vdmVUbyIsImxpbmVUbyIsImJhc2VDcm9zc2hhaXIiLCJzdHJva2UiLCJsaW5lV2lkdGgiLCJ0aXBDcm9zc2hhaXIiLCJ0aXBDaXJjbGUiLCJmaWxsIiwiYmFzZUltYWdlUGFyZW50IiwiaW50ZXJhY3RpdmVIaWdobGlnaHRFbmFibGVkIiwiYmFzZUltYWdlIiwic2NhbGUiLCJjdXJzb3IiLCJ0YWdOYW1lIiwiZm9jdXNhYmxlIiwiYXJpYVJvbGUiLCJpbm5lckNvbnRlbnQiLCJhMTF5IiwibWVhc3VyaW5nVGFwZVN0cmluZ1Byb3BlcnR5IiwiYXJpYUxhYmVsIiwiYWRkQ2hpbGQiLCJ0YXBlTGluZSIsInZhbHVlIiwidGlwIiwiY2hpbGRyZW4iLCJtZWFzdXJpbmdUYXBlVGlwU3RyaW5nUHJvcGVydHkiLCJyZWFkb3V0U3RyaW5nUHJvcGVydHkiLCJtZWFzdXJpbmdUYXBlUmVhZG91dFBhdHRlcm5TdHJpbmdQcm9wZXJ0eSIsIm1lYXN1cmVkRGlzdGFuY2UiLCJtZWFzdXJpbmdUYXBlUmVhZG91dFBhdHRlcm4iLCJ0b0ZpeGVkIiwibXVsdGlwbGllciIsImZpbGxJbiIsIm5hbWUiLCJPUFRfT1VUIiwidmFsdWVOb2RlIiwiZm9udCIsIm1heFdpZHRoIiwidmFsdWVCYWNrZ3JvdW5kTm9kZSIsImNvcm5lclJhZGl1cyIsInVwZGF0ZVZhbHVlQmFja2dyb3VuZE5vZGUiLCJ2YWx1ZUJhY2tncm91bmRXaWR0aCIsIndpZHRoIiwidmFsdWVCYWNrZ3JvdW5kSGVpZ2h0IiwiaGVpZ2h0Iiwic2V0UmVjdCIsImNlbnRlciIsImJvdW5kc1Byb3BlcnR5IiwibGF6eUxpbmsiLCJ0b3VjaEFyZWEiLCJsb2NhbEJvdW5kcyIsImRpbGF0ZWQiLCJtb3VzZUFyZWEiLCJ2YWx1ZUNvbnRhaW5lciIsImJhc2VTdGFydE9mZnNldCIsImJhc2VEcmFnTGlzdGVuZXIiLCJiYXNlU3RhcnQiLCJtb3ZlVG9Gcm9udCIsImJhc2VFbmQiLCJoYW5kbGVUaXBPbkJhc2VEcmFnIiwiZGVsdGEiLCJ1bmNvbnN0cmFpbmVkVGlwUG9zaXRpb24iLCJwbHVzIiwiY29uc3RyYWluZWRUaXBQb3NpdGlvbiIsImNsb3Nlc3RQb2ludFRvIiwic2V0Iiwic3RhcnQiLCJldmVudCIsInBvc2l0aW9uIiwibW9kZWxUb1ZpZXdQb3NpdGlvbiIsImN1cnJlbnRUYXJnZXQiLCJnbG9iYWxUb1BhcmVudFBvaW50IiwicG9pbnRlciIsInBvaW50IiwibWludXMiLCJkcmFnIiwibGlzdGVuZXIiLCJwYXJlbnRQb2ludCIsInVuY29uc3RyYWluZWRCYXNlUG9zaXRpb24iLCJ2aWV3VG9Nb2RlbFBvc2l0aW9uIiwiY29uc3RyYWluZWRCYXNlUG9zaXRpb24iLCJ0cmFuc2xhdGlvbkRlbHRhIiwiZW5kIiwiYmFzZURyYWdMaXN0ZW5lck9wdGlvbnMiLCJhZGRJbnB1dExpc3RlbmVyIiwiYmFzZUtleWJvYXJkRHJhZ0xpc3RlbmVyIiwicG9zaXRpb25Qcm9wZXJ0eSIsInRyYW5zZm9ybSIsInZlY3RvckRlbHRhIiwidGlwRW5kIiwidGlwU3RhcnRPZmZzZXQiLCJ0aXBEcmFnTGlzdGVuZXIiLCJ0aXBEcmFnTGlzdGVuZXJPcHRpb25zIiwidGlwS2V5Ym9hcmREcmFnTGlzdGVuZXIiLCJ2aXNpYmxlUHJvcGVydHkiLCJ2aXNpYmxlIiwiaW50ZXJydXB0U3VidHJlZUlucHV0IiwidXBkYXRlVGV4dFJlYWRvdXQiLCJjZW50ZXJUb3AiLCJ0aW1lcyIsImxpbmsiLCJtdWx0aWxpbmsiLCJ2aWV3VGlwUG9zaXRpb24iLCJ2aWV3QmFzZVBvc2l0aW9uIiwib2xkQW5nbGUiLCJnZXRSb3RhdGlvbiIsImFuZ2xlIiwiYXRhbjIiLCJ5IiwieCIsImRlbHRhQW5nbGUiLCJzZXRSb3RhdGlvbiIsInJpZ2h0Qm90dG9tIiwicm90YXRlQXJvdW5kIiwic2V0TGluZSIsImRpc3Bvc2VNZWFzdXJpbmdUYXBlTm9kZSIsImRpc3Bvc2UiLCJtdXRhdGUiLCJwaGV0IiwiY2hpcHBlciIsInF1ZXJ5UGFyYW1ldGVycyIsImJpbmRlciIsInJlZ2lzdGVyRGF0YVVSTCIsInJlc2V0Iiwic2V0RHJhZ0JvdW5kcyIsIm5ld0RyYWdCb3VuZHMiLCJjb3B5IiwiZ2V0RHJhZ0JvdW5kcyIsImdldExvY2FsQmFzZUNlbnRlciIsImltYWdlV2lkdGgiLCJpbWFnZUhlaWdodCIsImdldExvY2FsQmFzZUJvdW5kcyIsImJvdW5kcyIsInN0YXJ0QmFzZURyYWciLCJwcmVzcyIsImNyZWF0ZUljb24iLCJ0YXBlTGVuZ3RoIiwibWVhc3VyaW5nVGFwZU5vZGUiLCJtZWFzdXJpbmdUYXBlSWNvbiIsInRvSW1hZ2UiLCJpbWFnZSIsInNldENoaWxkcmVuIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJNZWFzdXJpbmdUYXBlTm9kZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNC0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBIHNjZW5lcnkgbm9kZSB0aGF0IGlzIHVzZWQgdG8gcmVwcmVzZW50IGEgZHJhZ2dhYmxlIE1lYXN1cmluZyBUYXBlLiBJdCBjb250YWlucyBhIHRpcCBhbmQgYSBiYXNlIHRoYXQgY2FuIGJlIGRyYWdnZWRcclxuICogc2VwYXJhdGVseSwgd2l0aCBhIHRleHQgaW5kaWNhdGluZyB0aGUgbWVhc3VyZW1lbnQuIFRoZSBtb3Rpb24gb2YgdGhlIG1lYXN1cmluZyB0YXBlIGNhbiBiZSBjb25maW5lZCBieSBkcmFnIGJvdW5kcy5cclxuICogVGhlIHBvc2l0aW9uIG9mIHRoZSBtZWFzdXJpbmcgdGFwZSBzaG91bGQgYmUgc2V0IHZpYSB0aGUgYmFzZVBvc2l0aW9uIGFuZCB0aXBQb3NpdGlvbiByYXRoZXIgdGhhbiB0aGUgc2NlbmVyeVxyXG4gKiBjb29yZGluYXRlc1xyXG4gKlxyXG4gKiBAYXV0aG9yIFZhc2lseSBTaGFraG92IChNbGVhcm5lcilcclxuICogQGF1dGhvciBTaWRkaGFydGhhIENoaW50aGFwYWxseSAoQWN0dWFsQ29uY2VwdHMpXHJcbiAqIEBhdXRob3IgQWFyb24gRGF2aXMgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgTWFydGluIFZlaWxsZXR0ZSAoQmVyZWEgQ29sbGVnZSlcclxuICovXHJcblxyXG5pbXBvcnQgRGVyaXZlZFByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvRGVyaXZlZFByb3BlcnR5LmpzJztcclxuaW1wb3J0IFRSZWFkT25seVByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgTXVsdGlsaW5rIGZyb20gJy4uLy4uL2F4b24vanMvTXVsdGlsaW5rLmpzJztcclxuaW1wb3J0IFByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBVdGlscyBmcm9tICcuLi8uLi9kb3QvanMvVXRpbHMuanMnO1xyXG5pbXBvcnQgVmVjdG9yMiBmcm9tICcuLi8uLi9kb3QvanMvVmVjdG9yMi5qcyc7XHJcbmltcG9ydCBWZWN0b3IyUHJvcGVydHkgZnJvbSAnLi4vLi4vZG90L2pzL1ZlY3RvcjJQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCB7IFNoYXBlIH0gZnJvbSAnLi4vLi4va2l0ZS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IEluc3RhbmNlUmVnaXN0cnkgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL2RvY3VtZW50YXRpb24vSW5zdGFuY2VSZWdpc3RyeS5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUsIHsgY29tYmluZU9wdGlvbnMgfSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IFN0cmljdE9taXQgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1N0cmljdE9taXQuanMnO1xyXG5pbXBvcnQgU3RyaW5nVXRpbHMgZnJvbSAnLi4vLi4vcGhldGNvbW1vbi9qcy91dGlsL1N0cmluZ1V0aWxzLmpzJztcclxuaW1wb3J0IE1vZGVsVmlld1RyYW5zZm9ybTIgZnJvbSAnLi4vLi4vcGhldGNvbW1vbi9qcy92aWV3L01vZGVsVmlld1RyYW5zZm9ybTIuanMnO1xyXG5pbXBvcnQgeyBDaXJjbGUsIERyYWdMaXN0ZW5lciwgRm9udCwgSW1hZ2UsIEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nTm9kZSwgTGluZSwgTm9kZSwgTm9kZU9wdGlvbnMsIE5vZGVUcmFuc2xhdGlvbk9wdGlvbnMsIFBhdGgsIFByZXNzTGlzdGVuZXJFdmVudCwgUmVjdGFuZ2xlLCBUQ29sb3IsIFRleHQgfSBmcm9tICcuLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgTnVtYmVySU8gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL3R5cGVzL051bWJlcklPLmpzJztcclxuaW1wb3J0IG1lYXN1cmluZ1RhcGVfcG5nIGZyb20gJy4uL2ltYWdlcy9tZWFzdXJpbmdUYXBlX3BuZy5qcyc7XHJcbmltcG9ydCBQaGV0Rm9udCBmcm9tICcuL1BoZXRGb250LmpzJztcclxuaW1wb3J0IHNjZW5lcnlQaGV0IGZyb20gJy4vc2NlbmVyeVBoZXQuanMnO1xyXG5pbXBvcnQgU2NlbmVyeVBoZXRTdHJpbmdzIGZyb20gJy4vU2NlbmVyeVBoZXRTdHJpbmdzLmpzJztcclxuaW1wb3J0IFRQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1RQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBEZXJpdmVkU3RyaW5nUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9EZXJpdmVkU3RyaW5nUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgUmljaEtleWJvYXJkRHJhZ0xpc3RlbmVyLCB7IFJpY2hLZXlib2FyZERyYWdMaXN0ZW5lck9wdGlvbnMgfSBmcm9tICcuLi8uLi9zY2VuZXJ5LXBoZXQvanMvUmljaEtleWJvYXJkRHJhZ0xpc3RlbmVyLmpzJztcclxuaW1wb3J0IFJpY2hEcmFnTGlzdGVuZXIsIHsgUmljaERyYWdMaXN0ZW5lck9wdGlvbnMgfSBmcm9tICcuLi8uLi9zY2VuZXJ5LXBoZXQvanMvUmljaERyYWdMaXN0ZW5lci5qcyc7XHJcblxyXG5leHBvcnQgdHlwZSBNZWFzdXJpbmdUYXBlVW5pdHMgPSB7XHJcbiAgbmFtZTogc3RyaW5nO1xyXG4gIG11bHRpcGxpZXI6IG51bWJlcjtcclxufTtcclxuXHJcbi8vIERyYWcgc3BlZWQgd2l0aCB0aGUga2V5Ym9hcmQsIGluIHZpZXcgY29vcmRpbmF0ZXMgcGVyIHNlY29uZFxyXG5jb25zdCBLRVlCT0FSRF9EUkFHX1NQRUVEID0gNjAwO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuXHJcbiAgLy8gYmFzZSBQb3NpdGlvbiBpbiBtb2RlbCBjb29yZGluYXRlIHJlZmVyZW5jZSBmcmFtZSAocmlnaHRCb3R0b20gcG9zaXRpb24gb2YgdGhlIG1lYXN1cmluZyB0YXBlIGltYWdlKVxyXG4gIGJhc2VQb3NpdGlvblByb3BlcnR5PzogUHJvcGVydHk8VmVjdG9yMj47XHJcblxyXG4gIC8vIHRpcCBQb3NpdGlvbiBpbiBtb2RlbCBjb29yZGluYXRlIHJlZmVyZW5jZSBmcmFtZSAoY2VudGVyIHBvc2l0aW9uIG9mIHRoZSB0aXApXHJcbiAgdGlwUG9zaXRpb25Qcm9wZXJ0eT86IFByb3BlcnR5PFZlY3RvcjI+O1xyXG5cclxuICAvLyB1c2UgdGhpcyB0byBvbWl0IHRoZSB2YWx1ZSBhbmQgdW5pdHMgZGlzcGxheWVkIGJlbG93IHRoZSB0YXBlIG1lYXN1cmUsIHVzZWZ1bCB3aXRoIGNyZWF0ZUljb25cclxuICBoYXNWYWx1ZT86IGJvb2xlYW47XHJcblxyXG4gIC8vIGJvdW5kcyBmb3IgdGhlIG1lYXN1cmluZyB0YXBlIChpbiBtb2RlbCBjb29yZGluYXRlIHJlZmVyZW5jZSBmcmFtZSksIGRlZmF1bHQgdmFsdWUgaXMgZXZlcnl0aGluZyxcclxuICAvLyBlZmZlY3RpdmVseSBubyBib3VuZHNcclxuICBkcmFnQm91bmRzPzogQm91bmRzMjtcclxuICB0ZXh0UG9zaXRpb24/OiBWZWN0b3IyOyAvLyBwb3NpdGlvbiBvZiB0aGUgdGV4dCByZWxhdGl2ZSB0byBjZW50ZXIgb2YgdGhlIGJhc2UgaW1hZ2UgaW4gdmlldyB1bml0c1xyXG4gIG1vZGVsVmlld1RyYW5zZm9ybT86IE1vZGVsVmlld1RyYW5zZm9ybTI7XHJcbiAgc2lnbmlmaWNhbnRGaWd1cmVzPzogbnVtYmVyOyAvLyBudW1iZXIgb2Ygc2lnbmlmaWNhbnQgZmlndXJlcyBpbiB0aGUgbGVuZ3RoIG1lYXN1cmVtZW50XHJcbiAgdGV4dENvbG9yPzogVENvbG9yOyAvLyB7Q29sb3JEZWZ9IGNvbG9yIG9mIHRoZSBsZW5ndGggbWVhc3VyZW1lbnQgYW5kIHVuaXRcclxuICB0ZXh0QmFja2dyb3VuZENvbG9yPzogVENvbG9yOyAvLyB7Q29sb3JEZWZ9IGZpbGwgY29sb3Igb2YgdGhlIHRleHQgYmFja2dyb3VuZFxyXG4gIHRleHRCYWNrZ3JvdW5kWE1hcmdpbj86IG51bWJlcjtcclxuICB0ZXh0QmFja2dyb3VuZFlNYXJnaW4/OiBudW1iZXI7XHJcbiAgdGV4dEJhY2tncm91bmRDb3JuZXJSYWRpdXM/OiBudW1iZXI7XHJcbiAgdGV4dE1heFdpZHRoPzogbnVtYmVyO1xyXG4gIHRleHRGb250PzogRm9udDsgLy8gZm9udCBmb3IgdGhlIG1lYXN1cmVtZW50IHRleHRcclxuICBiYXNlU2NhbGU/OiBudW1iZXI7IC8vIGNvbnRyb2wgdGhlIHNpemUgb2YgdGhlIG1lYXN1cmluZyB0YXBlIEltYWdlICh0aGUgYmFzZSlcclxuICBsaW5lQ29sb3I/OiBUQ29sb3I7IC8vIGNvbG9yIG9mIHRoZSB0YXBlbGluZSBpdHNlbGZcclxuICB0YXBlTGluZVdpZHRoPzogbnVtYmVyOyAvLyBsaW5lV2lkdGggb2YgdGhlIHRhcGUgbGluZVxyXG4gIHRpcENpcmNsZUNvbG9yPzogVENvbG9yOyAvLyBjb2xvciBvZiB0aGUgY2lyY2xlIGF0IHRoZSB0aXBcclxuICB0aXBDaXJjbGVSYWRpdXM/OiBudW1iZXI7IC8vIHJhZGl1cyBvZiB0aGUgY2lyY2xlIG9uIHRoZSB0aXBcclxuICBjcm9zc2hhaXJDb2xvcj86IFRDb2xvcjsgLy8gb3JhbmdlLCBjb2xvciBvZiB0aGUgdHdvIGNyb3NzaGFpcnNcclxuICBjcm9zc2hhaXJTaXplPzogbnVtYmVyOyAvLyBzaXplIG9mIHRoZSBjcm9zc2hhaXJzIGluIHNjZW5lcnkgY29vcmRpbmF0ZXMgKCBtZWFzdXJlZCBmcm9tIGNlbnRlcilcclxuICBjcm9zc2hhaXJMaW5lV2lkdGg/OiBudW1iZXI7IC8vIGxpbmVXaWR0aCBvZiB0aGUgY3Jvc3NoYWlyc1xyXG4gIGlzQmFzZUNyb3NzaGFpclJvdGF0aW5nPzogYm9vbGVhbjsgLy8gZG8gY3Jvc3NoYWlycyByb3RhdGUgYXJvdW5kIHRoZWlyIG93biBheGlzIHRvIGxpbmUgdXAgd2l0aCB0aGUgdGFwZWxpbmVcclxuICBpc1RpcENyb3NzaGFpclJvdGF0aW5nPzogYm9vbGVhbjsgLy8gZG8gY3Jvc3NoYWlycyByb3RhdGUgYXJvdW5kIHRoZWlyIG93biBheGlzIHRvIGxpbmUgdXAgd2l0aCB0aGUgdGFwZWxpbmVcclxuICBpc1RpcERyYWdCb3VuZGVkPzogYm9vbGVhbjsgLy8gaXMgdGhlIHRpcCBzdWJqZWN0IHRvIGRyYWdCb3VuZHNcclxuICBpbnRlcmFjdGl2ZT86IGJvb2xlYW47IC8vIHNwZWNpZmllcyB3aGV0aGVyIHRoZSBub2RlIGFkZHMgaXRzIG93biBpbnB1dCBsaXN0ZW5lcnMuIFNldHRpbmcgdGhpcyB0byBmYWxzZSBtYXkgYmUgaGVscGZ1bCBpbiBjcmVhdGluZyBhbiBpY29uLlxyXG4gIGJhc2VEcmFnU3RhcnRlZD86ICgpID0+IHZvaWQ7IC8vIGNhbGxlZCB3aGVuIHRoZSBiYXNlIGRyYWcgc3RhcnRzXHJcbiAgYmFzZURyYWdFbmRlZD86ICgpID0+IHZvaWQ7IC8vIGNhbGxlZCB3aGVuIHRoZSBiYXNlIGRyYWcgZW5kcywgZm9yIHRlc3Rpbmcgd2hldGhlciBpdCBoYXMgZHJvcHBlZCBpbnRvIHRoZSB0b29sYm94XHJcbiAgcGhldGlvUmVhZG91dFN0cmluZ1Byb3BlcnR5SW5zdHJ1bWVudGVkPzogYm9vbGVhbjsgLy8gd2hldGhlciB0byBpbnN0cnVtZW50IHJlYWRvdXRTdHJpbmdQcm9wZXJ0eSBmb3IgUGhFVC1pT1xyXG4gIHBoZXRpb0ZlYXR1cmVkTWVhc3VyZWREaXN0YW5jZVByb3BlcnR5PzogYm9vbGVhbjsgLy8gcGhldGlvRmVhdHVyZWQgdmFsdWUgZm9yIG1lYXN1cmVkRGlzdGFuY2VQcm9wZXJ0eVxyXG5cclxuICAvLyBPcHRpb25zIHBhc3NlZCB0byB0aGUgZHJhZyBsaXN0ZW5lcnMgZm9yIHRoZSBiYXNlIGFuZCB0aXAuXHJcbiAgYmFzZURyYWdMaXN0ZW5lck9wdGlvbnM/OiBSaWNoRHJhZ0xpc3RlbmVyT3B0aW9ucztcclxuICB0aXBEcmFnTGlzdGVuZXJPcHRpb25zPzogUmljaERyYWdMaXN0ZW5lck9wdGlvbnM7XHJcbiAgYmFzZUtleWJvYXJkRHJhZ0xpc3RlbmVyT3B0aW9ucz86IFJpY2hLZXlib2FyZERyYWdMaXN0ZW5lck9wdGlvbnM7XHJcbiAgdGlwS2V5Ym9hcmREcmFnTGlzdGVuZXJPcHRpb25zPzogUmljaEtleWJvYXJkRHJhZ0xpc3RlbmVyT3B0aW9ucztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBOT1RFOiBOb2RlVHJhbnNsYXRpb25PcHRpb25zIGFyZSBvbWl0dGVkIGJlY2F1c2UgeW91IG11c3QgdXNlIGJhc2VQb3NpdGlvblByb3BlcnR5IGFuZCB0aXBQb3NpdGlvblByb3BlcnR5IHRvXHJcbiAqIHBvc2l0aW9uIHRoaXMgTm9kZS5cclxuICovXHJcbmV4cG9ydCB0eXBlIE1lYXN1cmluZ1RhcGVOb2RlT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgU3RyaWN0T21pdDxOb2RlT3B0aW9ucywga2V5b2YgTm9kZVRyYW5zbGF0aW9uT3B0aW9ucz47XHJcblxyXG50eXBlIE1lYXN1cmluZ1RhcGVJY29uU2VsZk9wdGlvbnMgPSB7XHJcbiAgdGFwZUxlbmd0aD86IG51bWJlcjsgLy8gbGVuZ3RoIG9mIHRoZSBtZWFzdXJpbmcgdGFwZVxyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgTWVhc3VyaW5nVGFwZUljb25PcHRpb25zID0gTWVhc3VyaW5nVGFwZUljb25TZWxmT3B0aW9ucyAmIFN0cmljdE9taXQ8Tm9kZU9wdGlvbnMsICdjaGlsZHJlbic+O1xyXG5cclxuY2xhc3MgTWVhc3VyaW5nVGFwZU5vZGUgZXh0ZW5kcyBOb2RlIHtcclxuXHJcbiAgLy8gdGhlIGRpc3RhbmNlIG1lYXN1cmVkIGJ5IHRoZSB0YXBlXHJcbiAgcHVibGljIHJlYWRvbmx5IG1lYXN1cmVkRGlzdGFuY2VQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8bnVtYmVyPjtcclxuICBwdWJsaWMgcmVhZG9ubHkgaXNUaXBVc2VyQ29udHJvbGxlZFByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuPjtcclxuICBwdWJsaWMgcmVhZG9ubHkgaXNCYXNlVXNlckNvbnRyb2xsZWRQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj47XHJcbiAgcHVibGljIHJlYWRvbmx5IGJhc2VQb3NpdGlvblByb3BlcnR5OiBQcm9wZXJ0eTxWZWN0b3IyPjtcclxuICBwdWJsaWMgcmVhZG9ubHkgdGlwUG9zaXRpb25Qcm9wZXJ0eTogUHJvcGVydHk8VmVjdG9yMj47XHJcbiAgcHVibGljIHJlYWRvbmx5IG1vZGVsVmlld1RyYW5zZm9ybVByb3BlcnR5OiBQcm9wZXJ0eTxNb2RlbFZpZXdUcmFuc2Zvcm0yPjtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSB1bml0c1Byb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxNZWFzdXJpbmdUYXBlVW5pdHM+O1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgc2lnbmlmaWNhbnRGaWd1cmVzOiBudW1iZXI7XHJcbiAgcHVibGljIHJlYWRvbmx5IF9pc1RpcFVzZXJDb250cm9sbGVkUHJvcGVydHk6IFByb3BlcnR5PGJvb2xlYW4+O1xyXG4gIHB1YmxpYyByZWFkb25seSBfaXNCYXNlVXNlckNvbnRyb2xsZWRQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcbiAgcHJpdmF0ZSByZWFkb25seSBkcmFnQm91bmRzUHJvcGVydHk6IFRQcm9wZXJ0eTxCb3VuZHMyPjtcclxuICBwcml2YXRlIHJlYWRvbmx5IGlzVGlwRHJhZ0JvdW5kZWQ6IGJvb2xlYW47XHJcbiAgcHJpdmF0ZSByZWFkb25seSBiYXNlRHJhZ0xpc3RlbmVyOiBEcmFnTGlzdGVuZXIgfCBudWxsO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgYmFzZUltYWdlOiBJbWFnZTtcclxuICBwcml2YXRlIHJlYWRvbmx5IHZhbHVlTm9kZTogVGV4dDtcclxuICBwcml2YXRlIHJlYWRvbmx5IHZhbHVlQmFja2dyb3VuZE5vZGU6IFJlY3RhbmdsZTtcclxuICBwcml2YXRlIHJlYWRvbmx5IHZhbHVlQ29udGFpbmVyOiBOb2RlOyAvLyBwYXJlbnQgdGhhdCBkaXNwbGF5cyB0aGUgdGV4dCBhbmQgaXRzIGJhY2tncm91bmRcclxuICBwcml2YXRlIHJlYWRvbmx5IGRpc3Bvc2VNZWFzdXJpbmdUYXBlTm9kZTogKCkgPT4gdm9pZDtcclxuXHJcbiAgLy8gSWYgeW91IHByb3ZpZGUgcG9zaXRpb24gUHJvcGVydGllcyBmb3IgdGhlIGJhc2UgYW5kIHRpcCwgdGhlbiB5b3UgYXJlIHJlc3BvbnNpYmxlIGZvciByZXNldHRpbmcgYW5kIGRpc3Bvc2luZyB0aGVtLlxyXG4gIHByaXZhdGUgcmVhZG9ubHkgb3duc0Jhc2VQb3NpdGlvblByb3BlcnR5OiBib29sZWFuO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgb3duc1RpcFBvc2l0aW9uUHJvcGVydHk6IGJvb2xlYW47XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggdW5pdHNQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8TWVhc3VyaW5nVGFwZVVuaXRzPiwgcHJvdmlkZWRPcHRpb25zPzogTWVhc3VyaW5nVGFwZU5vZGVPcHRpb25zICkge1xyXG4gICAgY29uc3Qgb3duc0Jhc2VQb3NpdGlvblByb3BlcnR5ID0gIXByb3ZpZGVkT3B0aW9ucz8uYmFzZVBvc2l0aW9uUHJvcGVydHk7XHJcbiAgICBjb25zdCBvd25zVGlwUG9zaXRpb25Qcm9wZXJ0eSA9ICFwcm92aWRlZE9wdGlvbnM/LnRpcFBvc2l0aW9uUHJvcGVydHk7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxNZWFzdXJpbmdUYXBlTm9kZU9wdGlvbnMsIFN0cmljdE9taXQ8U2VsZk9wdGlvbnMsICdiYXNlRHJhZ0xpc3RlbmVyT3B0aW9ucycgfCAndGlwRHJhZ0xpc3RlbmVyT3B0aW9ucyc+LCBOb2RlT3B0aW9ucz4oKSgge1xyXG5cclxuICAgICAgLy8gYmFzZSBQb3NpdGlvbiBpbiBtb2RlbCBjb29yZGluYXRlIHJlZmVyZW5jZSBmcmFtZSAocmlnaHRCb3R0b20gcG9zaXRpb24gb2YgdGhlIG1lYXN1cmluZyB0YXBlIGltYWdlKVxyXG4gICAgICBiYXNlUG9zaXRpb25Qcm9wZXJ0eTogbmV3IFZlY3RvcjJQcm9wZXJ0eSggbmV3IFZlY3RvcjIoIDAsIDAgKSApLFxyXG5cclxuICAgICAgLy8gdGlwIFBvc2l0aW9uIGluIG1vZGVsIGNvb3JkaW5hdGUgcmVmZXJlbmNlIGZyYW1lIChjZW50ZXIgcG9zaXRpb24gb2YgdGhlIHRpcClcclxuICAgICAgdGlwUG9zaXRpb25Qcm9wZXJ0eTogbmV3IFZlY3RvcjJQcm9wZXJ0eSggbmV3IFZlY3RvcjIoIDEsIDAgKSApLFxyXG5cclxuICAgICAgLy8gdXNlIHRoaXMgdG8gb21pdCB0aGUgdmFsdWUgYW5kIHVuaXRzIGRpc3BsYXllZCBiZWxvdyB0aGUgdGFwZSBtZWFzdXJlLCB1c2VmdWwgd2l0aCBjcmVhdGVJY29uXHJcbiAgICAgIGhhc1ZhbHVlOiB0cnVlLFxyXG5cclxuICAgICAgLy8gYm91bmRzIGZvciB0aGUgbWVhc3VyaW5nIHRhcGUgKGluIG1vZGVsIGNvb3JkaW5hdGUgcmVmZXJlbmNlIGZyYW1lKSwgZGVmYXVsdCB2YWx1ZSBpcyBldmVyeXRoaW5nLFxyXG4gICAgICAvLyBlZmZlY3RpdmVseSBubyBib3VuZHNcclxuICAgICAgZHJhZ0JvdW5kczogQm91bmRzMi5FVkVSWVRISU5HLFxyXG4gICAgICB0ZXh0UG9zaXRpb246IG5ldyBWZWN0b3IyKCAwLCAzMCApLCAvLyBwb3NpdGlvbiBvZiB0aGUgdGV4dCByZWxhdGl2ZSB0byBjZW50ZXIgb2YgdGhlIGJhc2UgaW1hZ2UgaW4gdmlldyB1bml0c1xyXG4gICAgICBtb2RlbFZpZXdUcmFuc2Zvcm06IE1vZGVsVmlld1RyYW5zZm9ybTIuY3JlYXRlSWRlbnRpdHkoKSxcclxuICAgICAgc2lnbmlmaWNhbnRGaWd1cmVzOiAxLCAvLyBudW1iZXIgb2Ygc2lnbmlmaWNhbnQgZmlndXJlcyBpbiB0aGUgbGVuZ3RoIG1lYXN1cmVtZW50XHJcbiAgICAgIHRleHRDb2xvcjogJ3doaXRlJywgLy8ge0NvbG9yRGVmfSBjb2xvciBvZiB0aGUgbGVuZ3RoIG1lYXN1cmVtZW50IGFuZCB1bml0XHJcbiAgICAgIHRleHRCYWNrZ3JvdW5kQ29sb3I6IG51bGwsIC8vIHtDb2xvckRlZn0gZmlsbCBjb2xvciBvZiB0aGUgdGV4dCBiYWNrZ3JvdW5kXHJcbiAgICAgIHRleHRCYWNrZ3JvdW5kWE1hcmdpbjogNCxcclxuICAgICAgdGV4dEJhY2tncm91bmRZTWFyZ2luOiAyLFxyXG4gICAgICB0ZXh0QmFja2dyb3VuZENvcm5lclJhZGl1czogMixcclxuICAgICAgdGV4dE1heFdpZHRoOiAyMDAsXHJcbiAgICAgIHRleHRGb250OiBuZXcgUGhldEZvbnQoIHsgc2l6ZTogMTYsIHdlaWdodDogJ2JvbGQnIH0gKSwgLy8gZm9udCBmb3IgdGhlIG1lYXN1cmVtZW50IHRleHRcclxuICAgICAgYmFzZVNjYWxlOiAwLjgsIC8vIGNvbnRyb2wgdGhlIHNpemUgb2YgdGhlIG1lYXN1cmluZyB0YXBlIEltYWdlICh0aGUgYmFzZSlcclxuICAgICAgbGluZUNvbG9yOiAnZ3JheScsIC8vIGNvbG9yIG9mIHRoZSB0YXBlbGluZSBpdHNlbGZcclxuICAgICAgdGFwZUxpbmVXaWR0aDogMiwgLy8gbGluZVdpZHRoIG9mIHRoZSB0YXBlIGxpbmVcclxuICAgICAgdGlwQ2lyY2xlQ29sb3I6ICdyZ2JhKDAsMCwwLDAuMSknLCAvLyBjb2xvciBvZiB0aGUgY2lyY2xlIGF0IHRoZSB0aXBcclxuICAgICAgdGlwQ2lyY2xlUmFkaXVzOiAxMCwgLy8gcmFkaXVzIG9mIHRoZSBjaXJjbGUgb24gdGhlIHRpcFxyXG4gICAgICBjcm9zc2hhaXJDb2xvcjogJ3JnYigyMjQsIDk1LCAzMiknLCAvLyBvcmFuZ2UsIGNvbG9yIG9mIHRoZSB0d28gY3Jvc3NoYWlyc1xyXG4gICAgICBjcm9zc2hhaXJTaXplOiA1LCAvLyBzaXplIG9mIHRoZSBjcm9zc2hhaXJzIGluIHNjZW5lcnkgY29vcmRpbmF0ZXMgKCBtZWFzdXJlZCBmcm9tIGNlbnRlcilcclxuICAgICAgY3Jvc3NoYWlyTGluZVdpZHRoOiAyLCAvLyBsaW5ld2lkdGggb2YgdGhlIGNyb3NzaGFpcnNcclxuICAgICAgaXNCYXNlQ3Jvc3NoYWlyUm90YXRpbmc6IHRydWUsIC8vIGRvIGNyb3NzaGFpcnMgcm90YXRlIGFyb3VuZCB0aGVpciBvd24gYXhpcyB0byBsaW5lIHVwIHdpdGggdGhlIHRhcGVsaW5lXHJcbiAgICAgIGlzVGlwQ3Jvc3NoYWlyUm90YXRpbmc6IHRydWUsIC8vIGRvIGNyb3NzaGFpcnMgcm90YXRlIGFyb3VuZCB0aGVpciBvd24gYXhpcyB0byBsaW5lIHVwIHdpdGggdGhlIHRhcGVsaW5lXHJcbiAgICAgIGlzVGlwRHJhZ0JvdW5kZWQ6IHRydWUsIC8vIGlzIHRoZSB0aXAgc3ViamVjdCB0byBkcmFnQm91bmRzXHJcbiAgICAgIGludGVyYWN0aXZlOiB0cnVlLCAvLyBzcGVjaWZpZXMgd2hldGhlciB0aGUgbm9kZSBhZGRzIGl0cyBvd24gaW5wdXQgbGlzdGVuZXJzLiBTZXR0aW5nIHRoaXMgdG8gZmFsc2UgbWF5IGJlIGhlbHBmdWwgaW4gY3JlYXRpbmcgYW4gaWNvbi5cclxuICAgICAgYmFzZURyYWdTdGFydGVkOiBfLm5vb3AsIC8vIGNhbGxlZCB3aGVuIHRoZSBiYXNlIGRyYWcgc3RhcnRzXHJcbiAgICAgIGJhc2VEcmFnRW5kZWQ6IF8ubm9vcCwgLy8gY2FsbGVkIHdoZW4gdGhlIGJhc2UgZHJhZyBlbmRzLCBmb3IgdGVzdGluZyB3aGV0aGVyIGl0IGhhcyBkcm9wcGVkIGludG8gdGhlIHRvb2xib3hcclxuICAgICAgcGhldGlvUmVhZG91dFN0cmluZ1Byb3BlcnR5SW5zdHJ1bWVudGVkOiB0cnVlLFxyXG4gICAgICBwaGV0aW9GZWF0dXJlZE1lYXN1cmVkRGlzdGFuY2VQcm9wZXJ0eTogZmFsc2UsXHJcbiAgICAgIGJhc2VLZXlib2FyZERyYWdMaXN0ZW5lck9wdGlvbnM6IHtcclxuICAgICAgICBkcmFnU3BlZWQ6IEtFWUJPQVJEX0RSQUdfU1BFRUQsXHJcbiAgICAgICAgc2hpZnREcmFnU3BlZWQ6IEtFWUJPQVJEX0RSQUdfU1BFRUQgLyA0XHJcbiAgICAgIH0sXHJcbiAgICAgIHRpcEtleWJvYXJkRHJhZ0xpc3RlbmVyT3B0aW9uczoge1xyXG4gICAgICAgIGRyYWdTcGVlZDogS0VZQk9BUkRfRFJBR19TUEVFRCxcclxuICAgICAgICBzaGlmdERyYWdTcGVlZDogS0VZQk9BUkRfRFJBR19TUEVFRCAvIDRcclxuICAgICAgfVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgc3VwZXIoKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBNYXRoLmFicyggb3B0aW9ucy5tb2RlbFZpZXdUcmFuc2Zvcm0ubW9kZWxUb1ZpZXdEZWx0YVgoIDEgKSApID09PVxyXG4gICAgICAgICAgICAgICAgICAgICAgTWF0aC5hYnMoIG9wdGlvbnMubW9kZWxWaWV3VHJhbnNmb3JtLm1vZGVsVG9WaWV3RGVsdGFZKCAxICkgKSwgJ1RoZSB5IGFuZCB4IHNjYWxlIGZhY3RvciBhcmUgbm90IGlkZW50aWNhbCcgKTtcclxuXHJcbiAgICB0aGlzLnVuaXRzUHJvcGVydHkgPSB1bml0c1Byb3BlcnR5O1xyXG4gICAgdGhpcy5zaWduaWZpY2FudEZpZ3VyZXMgPSBvcHRpb25zLnNpZ25pZmljYW50RmlndXJlcztcclxuICAgIHRoaXMuZHJhZ0JvdW5kc1Byb3BlcnR5ID0gbmV3IFByb3BlcnR5KCBvcHRpb25zLmRyYWdCb3VuZHMgKTtcclxuICAgIHRoaXMubW9kZWxWaWV3VHJhbnNmb3JtUHJvcGVydHkgPSBuZXcgUHJvcGVydHkoIG9wdGlvbnMubW9kZWxWaWV3VHJhbnNmb3JtICk7XHJcbiAgICB0aGlzLmlzVGlwRHJhZ0JvdW5kZWQgPSBvcHRpb25zLmlzVGlwRHJhZ0JvdW5kZWQ7XHJcbiAgICB0aGlzLmJhc2VQb3NpdGlvblByb3BlcnR5ID0gb3B0aW9ucy5iYXNlUG9zaXRpb25Qcm9wZXJ0eTtcclxuICAgIHRoaXMudGlwUG9zaXRpb25Qcm9wZXJ0eSA9IG9wdGlvbnMudGlwUG9zaXRpb25Qcm9wZXJ0eTtcclxuICAgIHRoaXMub3duc0Jhc2VQb3NpdGlvblByb3BlcnR5ID0gb3duc0Jhc2VQb3NpdGlvblByb3BlcnR5O1xyXG4gICAgdGhpcy5vd25zVGlwUG9zaXRpb25Qcm9wZXJ0eSA9IG93bnNUaXBQb3NpdGlvblByb3BlcnR5O1xyXG5cclxuICAgIC8vIHByaXZhdGUgUHJvcGVydHkgYW5kIGl0cyBwdWJsaWMgcmVhZC1vbmx5IGludGVyZmFjZVxyXG4gICAgdGhpcy5faXNUaXBVc2VyQ29udHJvbGxlZFByb3BlcnR5ID0gbmV3IFByb3BlcnR5PGJvb2xlYW4+KCBmYWxzZSApO1xyXG4gICAgdGhpcy5pc1RpcFVzZXJDb250cm9sbGVkUHJvcGVydHkgPSB0aGlzLl9pc1RpcFVzZXJDb250cm9sbGVkUHJvcGVydHk7XHJcblxyXG4gICAgLy8gcHJpdmF0ZSBQcm9wZXJ0eSBhbmQgaXRzIHB1YmxpYyByZWFkLW9ubHkgaW50ZXJmYWNlXHJcbiAgICB0aGlzLl9pc0Jhc2VVc2VyQ29udHJvbGxlZFByb3BlcnR5ID0gbmV3IFByb3BlcnR5PGJvb2xlYW4+KCBmYWxzZSApO1xyXG4gICAgdGhpcy5pc0Jhc2VVc2VyQ29udHJvbGxlZFByb3BlcnR5ID0gdGhpcy5faXNCYXNlVXNlckNvbnRyb2xsZWRQcm9wZXJ0eTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmJhc2VQb3NpdGlvblByb3BlcnR5LnVuaXRzID09PSB0aGlzLnRpcFBvc2l0aW9uUHJvcGVydHkudW5pdHMsICd1bml0cyBzaG91bGQgbWF0Y2gnICk7XHJcblxyXG4gICAgdGhpcy5tZWFzdXJlZERpc3RhbmNlUHJvcGVydHkgPSBuZXcgRGVyaXZlZFByb3BlcnR5KFxyXG4gICAgICBbIHRoaXMuYmFzZVBvc2l0aW9uUHJvcGVydHksIHRoaXMudGlwUG9zaXRpb25Qcm9wZXJ0eSBdLFxyXG4gICAgICAoIGJhc2VQb3NpdGlvbiwgdGlwUG9zaXRpb24gKSA9PiBiYXNlUG9zaXRpb24uZGlzdGFuY2UoIHRpcFBvc2l0aW9uICksIHtcclxuICAgICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtPy5jcmVhdGVUYW5kZW0oICdtZWFzdXJlZERpc3RhbmNlUHJvcGVydHknICksXHJcbiAgICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ1RoZSBkaXN0YW5jZSBtZWFzdXJlZCBieSB0aGUgbWVhc3VyaW5nIHRhcGUnLFxyXG4gICAgICAgIHBoZXRpb1ZhbHVlVHlwZTogTnVtYmVySU8sXHJcbiAgICAgICAgcGhldGlvRmVhdHVyZWQ6IG9wdGlvbnMucGhldGlvRmVhdHVyZWRNZWFzdXJlZERpc3RhbmNlUHJvcGVydHksXHJcbiAgICAgICAgdW5pdHM6IHRoaXMuYmFzZVBvc2l0aW9uUHJvcGVydHkudW5pdHNcclxuICAgICAgfSApO1xyXG5cclxuICAgIGNvbnN0IGNyb3NzaGFpclNoYXBlID0gbmV3IFNoYXBlKClcclxuICAgICAgLm1vdmVUbyggLW9wdGlvbnMuY3Jvc3NoYWlyU2l6ZSwgMCApXHJcbiAgICAgIC5tb3ZlVG8oIC1vcHRpb25zLmNyb3NzaGFpclNpemUsIDAgKVxyXG4gICAgICAubGluZVRvKCBvcHRpb25zLmNyb3NzaGFpclNpemUsIDAgKVxyXG4gICAgICAubW92ZVRvKCAwLCAtb3B0aW9ucy5jcm9zc2hhaXJTaXplIClcclxuICAgICAgLmxpbmVUbyggMCwgb3B0aW9ucy5jcm9zc2hhaXJTaXplICk7XHJcblxyXG4gICAgY29uc3QgYmFzZUNyb3NzaGFpciA9IG5ldyBQYXRoKCBjcm9zc2hhaXJTaGFwZSwge1xyXG4gICAgICBzdHJva2U6IG9wdGlvbnMuY3Jvc3NoYWlyQ29sb3IsXHJcbiAgICAgIGxpbmVXaWR0aDogb3B0aW9ucy5jcm9zc2hhaXJMaW5lV2lkdGhcclxuICAgIH0gKTtcclxuXHJcbiAgICBjb25zdCB0aXBDcm9zc2hhaXIgPSBuZXcgUGF0aCggY3Jvc3NoYWlyU2hhcGUsIHtcclxuICAgICAgc3Ryb2tlOiBvcHRpb25zLmNyb3NzaGFpckNvbG9yLFxyXG4gICAgICBsaW5lV2lkdGg6IG9wdGlvbnMuY3Jvc3NoYWlyTGluZVdpZHRoXHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3QgdGlwQ2lyY2xlID0gbmV3IENpcmNsZSggb3B0aW9ucy50aXBDaXJjbGVSYWRpdXMsIHsgZmlsbDogb3B0aW9ucy50aXBDaXJjbGVDb2xvciB9ICk7XHJcblxyXG4gICAgY29uc3QgYmFzZUltYWdlUGFyZW50ID0gbmV3IEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nTm9kZSgge1xyXG5cclxuICAgICAgLy8gd2lsbCBvbmx5IGJlIGVuYWJsZWQgaWYgaW50ZXJhY3RpdmVcclxuICAgICAgaW50ZXJhY3RpdmVIaWdobGlnaHRFbmFibGVkOiBmYWxzZVxyXG4gICAgfSApO1xyXG4gICAgdGhpcy5iYXNlSW1hZ2UgPSBuZXcgSW1hZ2UoIG1lYXN1cmluZ1RhcGVfcG5nLCB7XHJcbiAgICAgIHNjYWxlOiBvcHRpb25zLmJhc2VTY2FsZSxcclxuICAgICAgY3Vyc29yOiAncG9pbnRlcicsXHJcblxyXG4gICAgICAvLyBwZG9tXHJcbiAgICAgIHRhZ05hbWU6ICdkaXYnLFxyXG4gICAgICBmb2N1c2FibGU6IHRydWUsXHJcbiAgICAgIGFyaWFSb2xlOiAnYXBwbGljYXRpb24nLFxyXG4gICAgICBpbm5lckNvbnRlbnQ6IFNjZW5lcnlQaGV0U3RyaW5ncy5hMTF5Lm1lYXN1cmluZ1RhcGVTdHJpbmdQcm9wZXJ0eSxcclxuICAgICAgYXJpYUxhYmVsOiBTY2VuZXJ5UGhldFN0cmluZ3MuYTExeS5tZWFzdXJpbmdUYXBlU3RyaW5nUHJvcGVydHlcclxuICAgIH0gKTtcclxuICAgIGJhc2VJbWFnZVBhcmVudC5hZGRDaGlsZCggdGhpcy5iYXNlSW1hZ2UgKTtcclxuXHJcbiAgICAvLyBjcmVhdGUgdGFwZWxpbmUgKHJ1bm5pbmcgZnJvbSBvbmUgY3Jvc3NoYWlyIHRvIHRoZSBvdGhlcilcclxuICAgIGNvbnN0IHRhcGVMaW5lID0gbmV3IExpbmUoIHRoaXMuYmFzZVBvc2l0aW9uUHJvcGVydHkudmFsdWUsIHRoaXMudGlwUG9zaXRpb25Qcm9wZXJ0eS52YWx1ZSwge1xyXG4gICAgICBzdHJva2U6IG9wdGlvbnMubGluZUNvbG9yLFxyXG4gICAgICBsaW5lV2lkdGg6IG9wdGlvbnMudGFwZUxpbmVXaWR0aFxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIGFkZCB0aXBDcm9zc2hhaXIgYW5kIHRpcENpcmNsZSB0byB0aGUgdGlwXHJcbiAgICBjb25zdCB0aXAgPSBuZXcgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdOb2RlKCB7XHJcbiAgICAgIGNoaWxkcmVuOiBbIHRpcENpcmNsZSwgdGlwQ3Jvc3NoYWlyIF0sXHJcbiAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxyXG5cclxuICAgICAgLy8gaW50ZXJhY3RpdmUgaGlnaGxpZ2h0cyAtIHdpbGwgb25seSBiZSBlbmFibGVkIHdoZW4gaW50ZXJhY3RpdmVcclxuICAgICAgaW50ZXJhY3RpdmVIaWdobGlnaHRFbmFibGVkOiBmYWxzZSxcclxuXHJcbiAgICAgIC8vIHBkb21cclxuICAgICAgdGFnTmFtZTogJ2RpdicsXHJcbiAgICAgIGZvY3VzYWJsZTogdHJ1ZSxcclxuICAgICAgYXJpYVJvbGU6ICdhcHBsaWNhdGlvbicsXHJcbiAgICAgIGlubmVyQ29udGVudDogU2NlbmVyeVBoZXRTdHJpbmdzLmExMXkubWVhc3VyaW5nVGFwZVRpcFN0cmluZ1Byb3BlcnR5LFxyXG4gICAgICBhcmlhTGFiZWw6IFNjZW5lcnlQaGV0U3RyaW5ncy5hMTF5Lm1lYXN1cmluZ1RhcGVUaXBTdHJpbmdQcm9wZXJ0eVxyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IHJlYWRvdXRTdHJpbmdQcm9wZXJ0eSA9IG5ldyBEZXJpdmVkU3RyaW5nUHJvcGVydHkoXHJcbiAgICAgIFsgdGhpcy51bml0c1Byb3BlcnR5LCB0aGlzLm1lYXN1cmVkRGlzdGFuY2VQcm9wZXJ0eSwgU2NlbmVyeVBoZXRTdHJpbmdzLm1lYXN1cmluZ1RhcGVSZWFkb3V0UGF0dGVyblN0cmluZ1Byb3BlcnR5IF0sXHJcbiAgICAgICggdW5pdHMsIG1lYXN1cmVkRGlzdGFuY2UsIG1lYXN1cmluZ1RhcGVSZWFkb3V0UGF0dGVybiApID0+IHtcclxuICAgICAgICBjb25zdCBkaXN0YW5jZSA9IFV0aWxzLnRvRml4ZWQoIHVuaXRzLm11bHRpcGxpZXIgKiBtZWFzdXJlZERpc3RhbmNlLCB0aGlzLnNpZ25pZmljYW50RmlndXJlcyApO1xyXG4gICAgICAgIHJldHVybiBTdHJpbmdVdGlscy5maWxsSW4oIG1lYXN1cmluZ1RhcGVSZWFkb3V0UGF0dGVybiwge1xyXG4gICAgICAgICAgZGlzdGFuY2U6IGRpc3RhbmNlLFxyXG4gICAgICAgICAgdW5pdHM6IHVuaXRzLm5hbWVcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH0sIHtcclxuICAgICAgICB0YW5kZW06IG9wdGlvbnMucGhldGlvUmVhZG91dFN0cmluZ1Byb3BlcnR5SW5zdHJ1bWVudGVkID8gb3B0aW9ucy50YW5kZW0/LmNyZWF0ZVRhbmRlbSggJ3JlYWRvdXRTdHJpbmdQcm9wZXJ0eScgKSA6IFRhbmRlbS5PUFRfT1VULFxyXG4gICAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdUaGUgdGV4dCBjb250ZW50IG9mIHRoZSByZWFkb3V0IG9uIHRoZSBtZWFzdXJpbmcgdGFwZSdcclxuICAgICAgfSApO1xyXG5cclxuICAgIHRoaXMudmFsdWVOb2RlID0gbmV3IFRleHQoIHJlYWRvdXRTdHJpbmdQcm9wZXJ0eSwge1xyXG4gICAgICBmb250OiBvcHRpb25zLnRleHRGb250LFxyXG4gICAgICBmaWxsOiBvcHRpb25zLnRleHRDb2xvcixcclxuICAgICAgbWF4V2lkdGg6IG9wdGlvbnMudGV4dE1heFdpZHRoXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy52YWx1ZUJhY2tncm91bmROb2RlID0gbmV3IFJlY3RhbmdsZSggMCwgMCwgMSwgMSwge1xyXG4gICAgICBjb3JuZXJSYWRpdXM6IG9wdGlvbnMudGV4dEJhY2tncm91bmRDb3JuZXJSYWRpdXMsXHJcbiAgICAgIGZpbGw6IG9wdGlvbnMudGV4dEJhY2tncm91bmRDb2xvclxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIFJlc2l6ZXMgdGhlIHZhbHVlIGJhY2tncm91bmQgYW5kIGNlbnRlcnMgaXQgb24gdGhlIHZhbHVlXHJcbiAgICBjb25zdCB1cGRhdGVWYWx1ZUJhY2tncm91bmROb2RlID0gKCkgPT4ge1xyXG4gICAgICBjb25zdCB2YWx1ZUJhY2tncm91bmRXaWR0aCA9IHRoaXMudmFsdWVOb2RlLndpZHRoICsgKCAyICogb3B0aW9ucy50ZXh0QmFja2dyb3VuZFhNYXJnaW4gKTtcclxuICAgICAgY29uc3QgdmFsdWVCYWNrZ3JvdW5kSGVpZ2h0ID0gdGhpcy52YWx1ZU5vZGUuaGVpZ2h0ICsgKCAyICogb3B0aW9ucy50ZXh0QmFja2dyb3VuZFlNYXJnaW4gKTtcclxuICAgICAgdGhpcy52YWx1ZUJhY2tncm91bmROb2RlLnNldFJlY3QoIDAsIDAsIHZhbHVlQmFja2dyb3VuZFdpZHRoLCB2YWx1ZUJhY2tncm91bmRIZWlnaHQgKTtcclxuICAgICAgdGhpcy52YWx1ZUJhY2tncm91bmROb2RlLmNlbnRlciA9IHRoaXMudmFsdWVOb2RlLmNlbnRlcjtcclxuICAgIH07XHJcbiAgICB0aGlzLnZhbHVlTm9kZS5ib3VuZHNQcm9wZXJ0eS5sYXp5TGluayggdXBkYXRlVmFsdWVCYWNrZ3JvdW5kTm9kZSApO1xyXG4gICAgdXBkYXRlVmFsdWVCYWNrZ3JvdW5kTm9kZSgpO1xyXG5cclxuICAgIC8vIGV4cGFuZCB0aGUgYXJlYSBmb3IgdG91Y2hcclxuICAgIHRpcC50b3VjaEFyZWEgPSB0aXAubG9jYWxCb3VuZHMuZGlsYXRlZCggMTUgKTtcclxuICAgIHRoaXMuYmFzZUltYWdlLnRvdWNoQXJlYSA9IHRoaXMuYmFzZUltYWdlLmxvY2FsQm91bmRzLmRpbGF0ZWQoIDIwICk7XHJcbiAgICB0aGlzLmJhc2VJbWFnZS5tb3VzZUFyZWEgPSB0aGlzLmJhc2VJbWFnZS5sb2NhbEJvdW5kcy5kaWxhdGVkKCAxMCApO1xyXG5cclxuICAgIHRoaXMuYWRkQ2hpbGQoIHRhcGVMaW5lICk7IC8vIHRhcGVsaW5lIGdvaW5nIGZyb20gb25lIGNyb3NzaGFpciB0byB0aGUgb3RoZXJcclxuICAgIHRoaXMuYWRkQ2hpbGQoIGJhc2VDcm9zc2hhaXIgKTsgLy8gY3Jvc3NoYWlyIG5lYXIgdGhlIGJhc2UsIChzZXQgYXQgYmFzZVBvc2l0aW9uKVxyXG4gICAgdGhpcy5hZGRDaGlsZCggYmFzZUltYWdlUGFyZW50ICk7IC8vIGJhc2Ugb2YgdGhlIG1lYXN1cmluZyB0YXBlXHJcblxyXG4gICAgdGhpcy52YWx1ZUNvbnRhaW5lciA9IG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIHRoaXMudmFsdWVCYWNrZ3JvdW5kTm9kZSwgdGhpcy52YWx1ZU5vZGUgXSB9ICk7XHJcbiAgICBpZiAoIG9wdGlvbnMuaGFzVmFsdWUgKSB7XHJcbiAgICAgIHRoaXMuYWRkQ2hpbGQoIHRoaXMudmFsdWVDb250YWluZXIgKTtcclxuICAgIH1cclxuICAgIHRoaXMuYWRkQ2hpbGQoIHRpcCApOyAvLyBjcm9zc2hhaXIgYW5kIGNpcmNsZSBhdCB0aGUgdGlwIChzZXQgYXQgdGlwUG9zaXRpb24pXHJcblxyXG4gICAgbGV0IGJhc2VTdGFydE9mZnNldDogVmVjdG9yMjtcclxuXHJcbiAgICB0aGlzLmJhc2VEcmFnTGlzdGVuZXIgPSBudWxsO1xyXG4gICAgaWYgKCBvcHRpb25zLmludGVyYWN0aXZlICkge1xyXG5cclxuICAgICAgLy8gaW50ZXJhY3RpdmUgaGlnaGxpZ2h0cyAtIGhpZ2hsaWdodHMgYXJlIGVuYWJsZWQgb25seSB3aGVuIHRoZSBjb21wb25lbnQgaXMgaW50ZXJhY3RpdmVcclxuICAgICAgYmFzZUltYWdlUGFyZW50LmludGVyYWN0aXZlSGlnaGxpZ2h0RW5hYmxlZCA9IHRydWU7XHJcbiAgICAgIHRpcC5pbnRlcmFjdGl2ZUhpZ2hsaWdodEVuYWJsZWQgPSB0cnVlO1xyXG5cclxuICAgICAgY29uc3QgYmFzZVN0YXJ0ID0gKCkgPT4ge1xyXG4gICAgICAgIHRoaXMubW92ZVRvRnJvbnQoKTtcclxuICAgICAgICBvcHRpb25zLmJhc2VEcmFnU3RhcnRlZCgpO1xyXG4gICAgICAgIHRoaXMuX2lzQmFzZVVzZXJDb250cm9sbGVkUHJvcGVydHkudmFsdWUgPSB0cnVlO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgYmFzZUVuZCA9ICgpID0+IHtcclxuICAgICAgICB0aGlzLl9pc0Jhc2VVc2VyQ29udHJvbGxlZFByb3BlcnR5LnZhbHVlID0gZmFsc2U7XHJcbiAgICAgICAgb3B0aW9ucy5iYXNlRHJhZ0VuZGVkKCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCBoYW5kbGVUaXBPbkJhc2VEcmFnID0gKCBkZWx0YTogVmVjdG9yMiApID0+IHtcclxuXHJcbiAgICAgICAgLy8gdHJhbnNsYXRlIHRoZSBwb3NpdGlvbiBvZiB0aGUgdGlwIGlmIGl0IGlzIG5vdCBiZWluZyBkcmFnZ2VkXHJcbiAgICAgICAgLy8gd2hlbiB0aGUgdXNlciBpcyBub3QgaG9sZGluZyBvbnRvIHRoZSB0aXAsIGRyYWdnaW5nIHRoZSBib2R5IHdpbGwgYWxzbyBkcmFnIHRoZSB0aXBcclxuICAgICAgICBpZiAoICF0aGlzLmlzVGlwVXNlckNvbnRyb2xsZWRQcm9wZXJ0eS52YWx1ZSApIHtcclxuICAgICAgICAgIGNvbnN0IHVuY29uc3RyYWluZWRUaXBQb3NpdGlvbiA9IGRlbHRhLnBsdXMoIHRoaXMudGlwUG9zaXRpb25Qcm9wZXJ0eS52YWx1ZSApO1xyXG4gICAgICAgICAgaWYgKCBvcHRpb25zLmlzVGlwRHJhZ0JvdW5kZWQgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnN0cmFpbmVkVGlwUG9zaXRpb24gPSB0aGlzLmRyYWdCb3VuZHNQcm9wZXJ0eS52YWx1ZS5jbG9zZXN0UG9pbnRUbyggdW5jb25zdHJhaW5lZFRpcFBvc2l0aW9uICk7XHJcbiAgICAgICAgICAgIC8vIHRyYW5zbGF0aW9uIG9mIHRoZSB0aXBQb3NpdGlvbiAoc3ViamVjdCB0byB0aGUgY29uc3RyYWluaW5nIGRyYWcgYm91bmRzKVxyXG4gICAgICAgICAgICB0aGlzLnRpcFBvc2l0aW9uUHJvcGVydHkuc2V0KCBjb25zdHJhaW5lZFRpcFBvc2l0aW9uICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy50aXBQb3NpdGlvblByb3BlcnR5LnNldCggdW5jb25zdHJhaW5lZFRpcFBvc2l0aW9uICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgLy8gRHJhZyBsaXN0ZW5lciBmb3IgYmFzZVxyXG4gICAgICB0aGlzLmJhc2VEcmFnTGlzdGVuZXIgPSBuZXcgUmljaERyYWdMaXN0ZW5lciggY29tYmluZU9wdGlvbnM8UmljaERyYWdMaXN0ZW5lck9wdGlvbnM+KCB7XHJcbiAgICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbT8uY3JlYXRlVGFuZGVtKCAnYmFzZURyYWdMaXN0ZW5lcicgKSxcclxuICAgICAgICBzdGFydDogZXZlbnQgPT4ge1xyXG4gICAgICAgICAgYmFzZVN0YXJ0KCk7XHJcbiAgICAgICAgICBjb25zdCBwb3NpdGlvbiA9IHRoaXMubW9kZWxWaWV3VHJhbnNmb3JtUHJvcGVydHkudmFsdWUubW9kZWxUb1ZpZXdQb3NpdGlvbiggdGhpcy5iYXNlUG9zaXRpb25Qcm9wZXJ0eS52YWx1ZSApO1xyXG4gICAgICAgICAgYmFzZVN0YXJ0T2Zmc2V0ID0gZXZlbnQuY3VycmVudFRhcmdldCEuZ2xvYmFsVG9QYXJlbnRQb2ludCggZXZlbnQucG9pbnRlci5wb2ludCApLm1pbnVzKCBwb3NpdGlvbiApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZHJhZzogKCBldmVudCwgbGlzdGVuZXIgKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBwYXJlbnRQb2ludCA9IGxpc3RlbmVyLmN1cnJlbnRUYXJnZXQuZ2xvYmFsVG9QYXJlbnRQb2ludCggZXZlbnQucG9pbnRlci5wb2ludCApLm1pbnVzKCBiYXNlU3RhcnRPZmZzZXQgKTtcclxuICAgICAgICAgIGNvbnN0IHVuY29uc3RyYWluZWRCYXNlUG9zaXRpb24gPSB0aGlzLm1vZGVsVmlld1RyYW5zZm9ybVByb3BlcnR5LnZhbHVlLnZpZXdUb01vZGVsUG9zaXRpb24oIHBhcmVudFBvaW50ICk7XHJcbiAgICAgICAgICBjb25zdCBjb25zdHJhaW5lZEJhc2VQb3NpdGlvbiA9IHRoaXMuZHJhZ0JvdW5kc1Byb3BlcnR5LnZhbHVlLmNsb3Nlc3RQb2ludFRvKCB1bmNvbnN0cmFpbmVkQmFzZVBvc2l0aW9uICk7XHJcblxyXG4gICAgICAgICAgLy8gdGhlIGJhc2VQb3NpdGlvbiB2YWx1ZSBoYXMgbm90IGJlZW4gdXBkYXRlZCB5ZXQsIGhlbmNlIGl0IGlzIHRoZSBvbGQgdmFsdWUgb2YgdGhlIGJhc2VQb3NpdGlvbjtcclxuICAgICAgICAgIGNvbnN0IHRyYW5zbGF0aW9uRGVsdGEgPSBjb25zdHJhaW5lZEJhc2VQb3NpdGlvbi5taW51cyggdGhpcy5iYXNlUG9zaXRpb25Qcm9wZXJ0eS52YWx1ZSApOyAvLyBpbiBtb2RlbCByZWZlcmVuY2UgZnJhbWVcclxuXHJcbiAgICAgICAgICAvLyB0cmFuc2xhdGlvbiBvZiB0aGUgYmFzZVBvc2l0aW9uIChzdWJqZWN0IHRvIHRoZSBjb25zdHJhaW5pbmcgZHJhZyBib3VuZHMpXHJcbiAgICAgICAgICB0aGlzLmJhc2VQb3NpdGlvblByb3BlcnR5LnNldCggY29uc3RyYWluZWRCYXNlUG9zaXRpb24gKTtcclxuXHJcbiAgICAgICAgICBoYW5kbGVUaXBPbkJhc2VEcmFnKCB0cmFuc2xhdGlvbkRlbHRhICk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbmQ6IGJhc2VFbmRcclxuICAgICAgfSwgb3B0aW9ucy5iYXNlRHJhZ0xpc3RlbmVyT3B0aW9ucyApICk7XHJcbiAgICAgIHRoaXMuYmFzZUltYWdlLmFkZElucHV0TGlzdGVuZXIoIHRoaXMuYmFzZURyYWdMaXN0ZW5lciApO1xyXG5cclxuICAgICAgLy8gRHJhZyBsaXN0ZW5lciBmb3IgYmFzZVxyXG4gICAgICBjb25zdCBiYXNlS2V5Ym9hcmREcmFnTGlzdGVuZXIgPSBuZXcgUmljaEtleWJvYXJkRHJhZ0xpc3RlbmVyKCBjb21iaW5lT3B0aW9uczxSaWNoS2V5Ym9hcmREcmFnTGlzdGVuZXJPcHRpb25zPigge1xyXG4gICAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0/LmNyZWF0ZVRhbmRlbSggJ2Jhc2VLZXlib2FyZERyYWdMaXN0ZW5lcicgKSxcclxuICAgICAgICBwb3NpdGlvblByb3BlcnR5OiB0aGlzLmJhc2VQb3NpdGlvblByb3BlcnR5LFxyXG4gICAgICAgIHRyYW5zZm9ybTogdGhpcy5tb2RlbFZpZXdUcmFuc2Zvcm1Qcm9wZXJ0eSxcclxuICAgICAgICBkcmFnQm91bmRzUHJvcGVydHk6IHRoaXMuZHJhZ0JvdW5kc1Byb3BlcnR5LFxyXG4gICAgICAgIHN0YXJ0OiBiYXNlU3RhcnQsXHJcbiAgICAgICAgZHJhZzogKCBldmVudCwgbGlzdGVuZXIgKSA9PiB7IGhhbmRsZVRpcE9uQmFzZURyYWcoIGxpc3RlbmVyLnZlY3RvckRlbHRhICk7IH0sXHJcbiAgICAgICAgZW5kOiBiYXNlRW5kXHJcbiAgICAgIH0sIG9wdGlvbnMuYmFzZUtleWJvYXJkRHJhZ0xpc3RlbmVyT3B0aW9ucyApICk7XHJcbiAgICAgIHRoaXMuYmFzZUltYWdlLmFkZElucHV0TGlzdGVuZXIoIGJhc2VLZXlib2FyZERyYWdMaXN0ZW5lciApO1xyXG5cclxuICAgICAgY29uc3QgdGlwRW5kID0gKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuX2lzVGlwVXNlckNvbnRyb2xsZWRQcm9wZXJ0eS52YWx1ZSA9IGZhbHNlO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgbGV0IHRpcFN0YXJ0T2Zmc2V0OiBWZWN0b3IyO1xyXG5cclxuICAgICAgLy8gRHJhZyBsaXN0ZW5lciBmb3IgdGlwXHJcbiAgICAgIGNvbnN0IHRpcERyYWdMaXN0ZW5lciA9IG5ldyBSaWNoRHJhZ0xpc3RlbmVyKCBjb21iaW5lT3B0aW9uczxSaWNoRHJhZ0xpc3RlbmVyT3B0aW9ucz4oIHtcclxuICAgICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtPy5jcmVhdGVUYW5kZW0oICd0aXBEcmFnTGlzdGVuZXInICksXHJcblxyXG4gICAgICAgIHN0YXJ0OiBldmVudCA9PiB7XHJcbiAgICAgICAgICB0aGlzLm1vdmVUb0Zyb250KCk7XHJcbiAgICAgICAgICB0aGlzLl9pc1RpcFVzZXJDb250cm9sbGVkUHJvcGVydHkudmFsdWUgPSB0cnVlO1xyXG4gICAgICAgICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLm1vZGVsVmlld1RyYW5zZm9ybVByb3BlcnR5LnZhbHVlLm1vZGVsVG9WaWV3UG9zaXRpb24oIHRoaXMudGlwUG9zaXRpb25Qcm9wZXJ0eS52YWx1ZSApO1xyXG4gICAgICAgICAgdGlwU3RhcnRPZmZzZXQgPSBldmVudC5jdXJyZW50VGFyZ2V0IS5nbG9iYWxUb1BhcmVudFBvaW50KCBldmVudC5wb2ludGVyLnBvaW50ICkubWludXMoIHBvc2l0aW9uICk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZHJhZzogKCBldmVudCwgbGlzdGVuZXIgKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBwYXJlbnRQb2ludCA9IGxpc3RlbmVyLmN1cnJlbnRUYXJnZXQuZ2xvYmFsVG9QYXJlbnRQb2ludCggZXZlbnQucG9pbnRlci5wb2ludCApLm1pbnVzKCB0aXBTdGFydE9mZnNldCApO1xyXG4gICAgICAgICAgY29uc3QgdW5jb25zdHJhaW5lZFRpcFBvc2l0aW9uID0gdGhpcy5tb2RlbFZpZXdUcmFuc2Zvcm1Qcm9wZXJ0eS52YWx1ZS52aWV3VG9Nb2RlbFBvc2l0aW9uKCBwYXJlbnRQb2ludCApO1xyXG5cclxuICAgICAgICAgIGlmICggb3B0aW9ucy5pc1RpcERyYWdCb3VuZGVkICkge1xyXG4gICAgICAgICAgICAvLyB0cmFuc2xhdGlvbiBvZiB0aGUgdGlwUG9zaXRpb24gKHN1YmplY3QgdG8gdGhlIGNvbnN0cmFpbmluZyBkcmFnIGJvdW5kcylcclxuICAgICAgICAgICAgdGhpcy50aXBQb3NpdGlvblByb3BlcnR5LnZhbHVlID0gdGhpcy5kcmFnQm91bmRzUHJvcGVydHkudmFsdWUuY2xvc2VzdFBvaW50VG8oIHVuY29uc3RyYWluZWRUaXBQb3NpdGlvbiApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMudGlwUG9zaXRpb25Qcm9wZXJ0eS52YWx1ZSA9IHVuY29uc3RyYWluZWRUaXBQb3NpdGlvbjtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBlbmQ6IHRpcEVuZFxyXG4gICAgICB9LCBvcHRpb25zLnRpcERyYWdMaXN0ZW5lck9wdGlvbnMgKSApO1xyXG4gICAgICB0aXAuYWRkSW5wdXRMaXN0ZW5lciggdGlwRHJhZ0xpc3RlbmVyICk7XHJcblxyXG4gICAgICBjb25zdCB0aXBLZXlib2FyZERyYWdMaXN0ZW5lciA9IG5ldyBSaWNoS2V5Ym9hcmREcmFnTGlzdGVuZXIoIGNvbWJpbmVPcHRpb25zPFJpY2hLZXlib2FyZERyYWdMaXN0ZW5lck9wdGlvbnM+KCB7XHJcbiAgICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbT8uY3JlYXRlVGFuZGVtKCAndGlwS2V5Ym9hcmREcmFnTGlzdGVuZXInICksXHJcbiAgICAgICAgcG9zaXRpb25Qcm9wZXJ0eTogdGhpcy50aXBQb3NpdGlvblByb3BlcnR5LFxyXG4gICAgICAgIGRyYWdCb3VuZHNQcm9wZXJ0eTogb3B0aW9ucy5pc1RpcERyYWdCb3VuZGVkID8gdGhpcy5kcmFnQm91bmRzUHJvcGVydHkgOiBudWxsLFxyXG4gICAgICAgIHRyYW5zZm9ybTogdGhpcy5tb2RlbFZpZXdUcmFuc2Zvcm1Qcm9wZXJ0eSxcclxuICAgICAgICBzdGFydDogKCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5tb3ZlVG9Gcm9udCgpO1xyXG4gICAgICAgICAgdGhpcy5faXNUaXBVc2VyQ29udHJvbGxlZFByb3BlcnR5LnZhbHVlID0gdHJ1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVuZDogdGlwRW5kXHJcbiAgICAgIH0sIG9wdGlvbnMudGlwS2V5Ym9hcmREcmFnTGlzdGVuZXJPcHRpb25zICkgKTtcclxuICAgICAgdGlwLmFkZElucHV0TGlzdGVuZXIoIHRpcEtleWJvYXJkRHJhZ0xpc3RlbmVyICk7XHJcblxyXG4gICAgICAvLyBJZiB0aGlzIE5vZGUgYmVjb21lcyBpbnZpc2libGUsIGludGVycnVwdCB1c2VyIGludGVyYWN0aW9uLlxyXG4gICAgICB0aGlzLnZpc2libGVQcm9wZXJ0eS5sYXp5TGluayggdmlzaWJsZSA9PiB7XHJcbiAgICAgICAgaWYgKCAhdmlzaWJsZSApIHtcclxuICAgICAgICAgIHRoaXMuaW50ZXJydXB0U3VidHJlZUlucHV0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdXBkYXRlVGV4dFJlYWRvdXQgPSAoKSA9PiB7XHJcbiAgICAgIHRoaXMudmFsdWVOb2RlLmNlbnRlclRvcCA9IHRoaXMuYmFzZUltYWdlLmNlbnRlci5wbHVzKCBvcHRpb25zLnRleHRQb3NpdGlvbi50aW1lcyggb3B0aW9ucy5iYXNlU2NhbGUgKSApO1xyXG4gICAgfTtcclxuICAgIHJlYWRvdXRTdHJpbmdQcm9wZXJ0eS5saW5rKCB1cGRhdGVUZXh0UmVhZG91dCApO1xyXG5cclxuICAgIC8vIGxpbmsgdGhlIHBvc2l0aW9ucyBvZiBiYXNlIGFuZCB0aXAgdG8gdGhlIG1lYXN1cmluZyB0YXBlIHRvIHRoZSBzY2VuZXJ5IHVwZGF0ZSBmdW5jdGlvbi5cclxuICAgIC8vIE11c3QgYmUgZGlzcG9zZWQuXHJcbiAgICBjb25zdCBtdWx0aWxpbmsgPSBNdWx0aWxpbmsubXVsdGlsaW5rKFxyXG4gICAgICBbIHRoaXMubWVhc3VyZWREaXN0YW5jZVByb3BlcnR5LCB1bml0c1Byb3BlcnR5LCB0aGlzLm1vZGVsVmlld1RyYW5zZm9ybVByb3BlcnR5LCB0aGlzLnRpcFBvc2l0aW9uUHJvcGVydHksIHRoaXMuYmFzZVBvc2l0aW9uUHJvcGVydHkgXSwgKFxyXG4gICAgICAgIG1lYXN1cmVkRGlzdGFuY2UsIHVuaXRzLCBtb2RlbFZpZXdUcmFuc2Zvcm0sIHRpcFBvc2l0aW9uLCBiYXNlUG9zaXRpb24gKSA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IHZpZXdUaXBQb3NpdGlvbiA9IG1vZGVsVmlld1RyYW5zZm9ybS5tb2RlbFRvVmlld1Bvc2l0aW9uKCB0aXBQb3NpdGlvbiApO1xyXG4gICAgICAgIGNvbnN0IHZpZXdCYXNlUG9zaXRpb24gPSBtb2RlbFZpZXdUcmFuc2Zvcm0ubW9kZWxUb1ZpZXdQb3NpdGlvbiggYmFzZVBvc2l0aW9uICk7XHJcblxyXG4gICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgb3JpZW50YXRpb24gYW5kIGNoYW5nZSBvZiBvcmllbnRhdGlvbiBvZiB0aGUgTWVhc3VyaW5nIHRhcGVcclxuICAgICAgICBjb25zdCBvbGRBbmdsZSA9IHRoaXMuYmFzZUltYWdlLmdldFJvdGF0aW9uKCk7XHJcbiAgICAgICAgY29uc3QgYW5nbGUgPSBNYXRoLmF0YW4yKCB2aWV3VGlwUG9zaXRpb24ueSAtIHZpZXdCYXNlUG9zaXRpb24ueSwgdmlld1RpcFBvc2l0aW9uLnggLSB2aWV3QmFzZVBvc2l0aW9uLnggKTtcclxuICAgICAgICBjb25zdCBkZWx0YUFuZ2xlID0gYW5nbGUgLSBvbGRBbmdsZTtcclxuXHJcbiAgICAgICAgLy8gc2V0IHBvc2l0aW9uIG9mIHRoZSB0aXAgYW5kIHRoZSBiYXNlIGNyb3NzaGFpclxyXG4gICAgICAgIGJhc2VDcm9zc2hhaXIuY2VudGVyID0gdmlld0Jhc2VQb3NpdGlvbjtcclxuICAgICAgICB0aXAuY2VudGVyID0gdmlld1RpcFBvc2l0aW9uO1xyXG5cclxuICAgICAgICAvLyBpbiBvcmRlciB0byBhdm9pZCBhbGwga2luZCBvZiBnZW9tZXRyaWNhbCBpc3N1ZXMgd2l0aCBwb3NpdGlvbixcclxuICAgICAgICAvLyBsZXQncyByZXNldCB0aGUgYmFzZUltYWdlIHVwcmlnaHQgYW5kIHRoZW4gc2V0IGl0cyBwb3NpdGlvbiBhbmQgcm90YXRpb25cclxuICAgICAgICB0aGlzLmJhc2VJbWFnZS5zZXRSb3RhdGlvbiggMCApO1xyXG4gICAgICAgIHRoaXMuYmFzZUltYWdlLnJpZ2h0Qm90dG9tID0gdmlld0Jhc2VQb3NpdGlvbjtcclxuICAgICAgICB0aGlzLmJhc2VJbWFnZS5yb3RhdGVBcm91bmQoIHRoaXMuYmFzZUltYWdlLnJpZ2h0Qm90dG9tLCBhbmdsZSApO1xyXG5cclxuICAgICAgICAvLyByZXBvc2l0aW9uIHRoZSB0YXBlbGluZVxyXG4gICAgICAgIHRhcGVMaW5lLnNldExpbmUoIHZpZXdCYXNlUG9zaXRpb24ueCwgdmlld0Jhc2VQb3NpdGlvbi55LCB2aWV3VGlwUG9zaXRpb24ueCwgdmlld1RpcFBvc2l0aW9uLnkgKTtcclxuXHJcbiAgICAgICAgLy8gcm90YXRlIHRoZSBjcm9zc2hhaXJzXHJcbiAgICAgICAgaWYgKCBvcHRpb25zLmlzVGlwQ3Jvc3NoYWlyUm90YXRpbmcgKSB7XHJcbiAgICAgICAgICB0aXAucm90YXRlQXJvdW5kKCB2aWV3VGlwUG9zaXRpb24sIGRlbHRhQW5nbGUgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBvcHRpb25zLmlzQmFzZUNyb3NzaGFpclJvdGF0aW5nICkge1xyXG4gICAgICAgICAgYmFzZUNyb3NzaGFpci5yb3RhdGVBcm91bmQoIHZpZXdCYXNlUG9zaXRpb24sIGRlbHRhQW5nbGUgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVwZGF0ZVRleHRSZWFkb3V0KCk7XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLmRpc3Bvc2VNZWFzdXJpbmdUYXBlTm9kZSA9ICgpID0+IHtcclxuICAgICAgbXVsdGlsaW5rLmRpc3Bvc2UoKTtcclxuICAgICAgcmVhZG91dFN0cmluZ1Byb3BlcnR5LmRpc3Bvc2UoKTtcclxuXHJcbiAgICAgIHRoaXMub3duc0Jhc2VQb3NpdGlvblByb3BlcnR5ICYmIHRoaXMuYmFzZVBvc2l0aW9uUHJvcGVydHkuZGlzcG9zZSgpO1xyXG4gICAgICB0aGlzLm93bnNUaXBQb3NpdGlvblByb3BlcnR5ICYmIHRoaXMudGlwUG9zaXRpb25Qcm9wZXJ0eS5kaXNwb3NlKCk7XHJcblxyXG4gICAgICAvLyBpbnRlcmFjdGl2ZSBoaWdobGlnaHRpbmcgcmVsYXRlZCBsaXN0ZW5lcnMgcmVxdWlyZSBkaXNwb3NhbFxyXG4gICAgICBiYXNlSW1hZ2VQYXJlbnQuZGlzcG9zZSgpO1xyXG4gICAgICB0aXAuZGlzcG9zZSgpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLm11dGF0ZSggb3B0aW9ucyApO1xyXG5cclxuICAgIC8vIHN1cHBvcnQgZm9yIGJpbmRlciBkb2N1bWVudGF0aW9uLCBzdHJpcHBlZCBvdXQgaW4gYnVpbGRzIGFuZCBvbmx5IHJ1bnMgd2hlbiA/YmluZGVyIGlzIHNwZWNpZmllZFxyXG4gICAgYXNzZXJ0ICYmIHBoZXQ/LmNoaXBwZXI/LnF1ZXJ5UGFyYW1ldGVycz8uYmluZGVyICYmIEluc3RhbmNlUmVnaXN0cnkucmVnaXN0ZXJEYXRhVVJMKCAnc2NlbmVyeS1waGV0JywgJ01lYXN1cmluZ1RhcGVOb2RlJywgdGhpcyApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHJlc2V0KCk6IHZvaWQge1xyXG4gICAgdGhpcy5vd25zQmFzZVBvc2l0aW9uUHJvcGVydHkgJiYgdGhpcy5iYXNlUG9zaXRpb25Qcm9wZXJ0eS5yZXNldCgpO1xyXG4gICAgdGhpcy5vd25zVGlwUG9zaXRpb25Qcm9wZXJ0eSAmJiB0aGlzLnRpcFBvc2l0aW9uUHJvcGVydHkucmVzZXQoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5kaXNwb3NlTWVhc3VyaW5nVGFwZU5vZGUoKTtcclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGRyYWdCb3VuZHMgb2YgdGhlIG1lYXN1cmluZyB0YXBlLlxyXG4gICAqIEluIGFkZGl0aW9uLCBpdCBmb3JjZXMgdGhlIHRpcCBhbmQgYmFzZSBvZiB0aGUgbWVhc3VyaW5nIHRhcGUgdG8gYmUgd2l0aGluIHRoZSBuZXcgYm91bmRzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXREcmFnQm91bmRzKCBuZXdEcmFnQm91bmRzOiBCb3VuZHMyICk6IHZvaWQge1xyXG4gICAgY29uc3QgZHJhZ0JvdW5kcyA9IG5ld0RyYWdCb3VuZHMuY29weSgpO1xyXG4gICAgdGhpcy5kcmFnQm91bmRzUHJvcGVydHkudmFsdWUgPSBkcmFnQm91bmRzO1xyXG5cclxuICAgIC8vIHNldHMgdGhlIGJhc2UgcG9zaXRpb24gb2YgdGhlIG1lYXN1cmluZyB0YXBlLCB3aGljaCBtYXkgaGF2ZSBjaGFuZ2VkIGlmIGl0IHdhcyBvdXRzaWRlIG9mIHRoZSBkcmFnQm91bmRzXHJcbiAgICB0aGlzLmJhc2VQb3NpdGlvblByb3BlcnR5LnZhbHVlID0gZHJhZ0JvdW5kcy5jbG9zZXN0UG9pbnRUbyggdGhpcy5iYXNlUG9zaXRpb25Qcm9wZXJ0eS52YWx1ZSApO1xyXG5cclxuICAgIC8vIHNldHMgYSBuZXcgdGlwIHBvc2l0aW9uIGlmIHRoZSB0aXAgb2YgdGhlIG1lYXN1cmluZyB0YXBlIGlzIHN1YmplY3QgdG8gZHJhZ0JvdW5kc1xyXG4gICAgaWYgKCB0aGlzLmlzVGlwRHJhZ0JvdW5kZWQgKSB7XHJcbiAgICAgIHRoaXMudGlwUG9zaXRpb25Qcm9wZXJ0eS52YWx1ZSA9IGRyYWdCb3VuZHMuY2xvc2VzdFBvaW50VG8oIHRoaXMudGlwUG9zaXRpb25Qcm9wZXJ0eS52YWx1ZSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgZHJhZ0JvdW5kcyBvZiB0aGUgbWVhc3VyaW5nIHRhcGUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldERyYWdCb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5kcmFnQm91bmRzUHJvcGVydHkudmFsdWUuY29weSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY2VudGVyIG9mIHRoZSBiYXNlIGluIHRoZSBtZWFzdXJpbmcgdGFwZSdzIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExvY2FsQmFzZUNlbnRlcigpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiBuZXcgVmVjdG9yMiggLXRoaXMuYmFzZUltYWdlLmltYWdlV2lkdGggLyAyLCAtdGhpcy5iYXNlSW1hZ2UuaW1hZ2VIZWlnaHQgLyAyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBib3VuZGluZyBib3ggb2YgdGhlIG1lYXN1cmluZyB0YXBlJ3MgYmFzZSB3aXRoaW4gaXRzIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWVcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TG9jYWxCYXNlQm91bmRzKCk6IEJvdW5kczIge1xyXG4gICAgcmV0dXJuIHRoaXMuYmFzZUltYWdlLmJvdW5kcy5jb3B5KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWF0ZXMgYSBkcmFnIG9mIHRoZSBiYXNlICh3aG9sZSBtZWFzdXJpbmcgdGFwZSkgZnJvbSBhIFNjZW5lcnkgZXZlbnQuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXJ0QmFzZURyYWcoIGV2ZW50OiBQcmVzc0xpc3RlbmVyRXZlbnQgKTogdm9pZCB7XHJcbiAgICB0aGlzLmJhc2VEcmFnTGlzdGVuZXIgJiYgdGhpcy5iYXNlRHJhZ0xpc3RlbmVyLnByZXNzKCBldmVudCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhbiBpY29uIG9mIHRoZSBtZWFzdXJpbmcgdGFwZS5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGNyZWF0ZUljb24oIHByb3ZpZGVkT3B0aW9ucz86IE1lYXN1cmluZ1RhcGVJY29uT3B0aW9ucyApOiBOb2RlIHtcclxuXHJcbiAgICAvLyBTZWUgZG9jdW1lbnRhdGlvbiBhYm92ZSFcclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8TWVhc3VyaW5nVGFwZUljb25PcHRpb25zLCBNZWFzdXJpbmdUYXBlSWNvblNlbGZPcHRpb25zLCBOb2RlT3B0aW9ucz4oKSgge1xyXG4gICAgICB0YXBlTGVuZ3RoOiAzMFxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGFuIGFjdHVhbCBtZWFzdXJpbmcgdGFwZS5cclxuICAgIGNvbnN0IG1lYXN1cmluZ1RhcGVOb2RlID0gbmV3IE1lYXN1cmluZ1RhcGVOb2RlKCBuZXcgUHJvcGVydHkoIHsgbmFtZTogJycsIG11bHRpcGxpZXI6IDEgfSApLCB7XHJcbiAgICAgIHRpcFBvc2l0aW9uUHJvcGVydHk6IG5ldyBWZWN0b3IyUHJvcGVydHkoIG5ldyBWZWN0b3IyKCBvcHRpb25zLnRhcGVMZW5ndGgsIDAgKSApLFxyXG4gICAgICBoYXNWYWx1ZTogZmFsc2UsIC8vIG5vIHZhbHVlIGJlbG93IHRoZSB0YXBlXHJcbiAgICAgIGludGVyYWN0aXZlOiBmYWxzZVxyXG4gICAgfSApO1xyXG4gICAgb3B0aW9ucy5jaGlsZHJlbiA9IFsgbWVhc3VyaW5nVGFwZU5vZGUgXTtcclxuXHJcbiAgICAvLyBDcmVhdGUgdGhlIGljb24sIHdpdGggbWVhc3VyaW5nVGFwZSBhcyBpdHMgaW5pdGlhbCBjaGlsZC4gIFRoaXMgY2hpbGQgd2lsbCBiZSByZXBsYWNlZCBvbmNlIHRoZSBpbWFnZSBiZWNvbWVzXHJcbiAgICAvLyBhdmFpbGFibGUgaW4gdGhlIGNhbGxiYWNrIHRvIHRvSW1hZ2UgKHNlZSBiZWxvdykuIFNpbmNlIHRvSW1hZ2UgaGFwcGVucyBhc3luY2hyb25vdXNseSwgdGhpcyBlbnN1cmVzIHRoYXRcclxuICAgIC8vIHRoZSBpY29uIGhhcyBpbml0aWFsIGJvdW5kcyB0aGF0IHdpbGwgbWF0Y2ggdGhlIGljb24gb25jZSB0aGUgaW1hZ2UgaXMgYXZhaWxhYmxlLlxyXG4gICAgY29uc3QgbWVhc3VyaW5nVGFwZUljb24gPSBuZXcgTm9kZSggb3B0aW9ucyApO1xyXG5cclxuICAgIC8vIENvbnZlcnQgbWVhc3VyaW5nVGFwZU5vZGUgdG8gYW4gaW1hZ2UsIGFuZCBtYWtlIGl0IHRoZSBjaGlsZCBvZiBtZWFzdXJpbmdUYXBlSWNvbi5cclxuICAgIG1lYXN1cmluZ1RhcGVOb2RlLnRvSW1hZ2UoIGltYWdlID0+IG1lYXN1cmluZ1RhcGVJY29uLnNldENoaWxkcmVuKCBbIG5ldyBJbWFnZSggaW1hZ2UgKSBdICkgKTtcclxuXHJcbiAgICByZXR1cm4gbWVhc3VyaW5nVGFwZUljb247XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5UGhldC5yZWdpc3RlciggJ01lYXN1cmluZ1RhcGVOb2RlJywgTWVhc3VyaW5nVGFwZU5vZGUgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IE1lYXN1cmluZ1RhcGVOb2RlOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7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