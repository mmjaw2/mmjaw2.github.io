// Copyright 2019-2024, University of Colorado Boulder

/**
 * This is a graphical representation of a bicycle pump. A user can move the handle up and down.
 *
 * @author John Blanco
 * @author Siddhartha Chinthapally (Actual Concepts)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Saurabh Totey
 */

import BooleanProperty from '../../axon/js/BooleanProperty.js';
import Utils from '../../dot/js/Utils.js';
import Vector2 from '../../dot/js/Vector2.js';
import { Shape } from '../../kite/js/imports.js';
import InstanceRegistry from '../../phet-core/js/documentation/InstanceRegistry.js';
import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
import { Circle, LinearGradient, Node, PaintColorProperty, Path, Rectangle, SceneryConstants } from '../../scenery/js/imports.js';
import Tandem from '../../tandem/js/Tandem.js';
import sceneryPhet from './sceneryPhet.js';
import SegmentedBarGraphNode from './SegmentedBarGraphNode.js';
import RichDragListener from './RichDragListener.js';
import RichKeyboardDragListener from './RichKeyboardDragListener.js';

// The follow constants define the size and positions of the various components of the pump as proportions of the
// overall width and height of the node.
const PUMP_BASE_WIDTH_PROPORTION = 0.35;
const PUMP_BASE_HEIGHT_PROPORTION = 0.075;
const PUMP_BODY_HEIGHT_PROPORTION = 0.7;
const PUMP_BODY_WIDTH_PROPORTION = 0.07;
const PUMP_SHAFT_WIDTH_PROPORTION = PUMP_BODY_WIDTH_PROPORTION * 0.25;
const PUMP_SHAFT_HEIGHT_PROPORTION = PUMP_BODY_HEIGHT_PROPORTION;
const PUMP_HANDLE_HEIGHT_PROPORTION = 0.05;
const CONE_HEIGHT_PROPORTION = 0.09;
const HOSE_CONNECTOR_HEIGHT_PROPORTION = 0.04;
const HOSE_CONNECTOR_WIDTH_PROPORTION = 0.05;
const SHAFT_OPENING_TILT_FACTOR = 0.33;
const BODY_TO_HOSE_ATTACH_POINT_X = 13;
const BODY_TO_HOSE_ATTACH_POINT_Y = -26;
export default class BicyclePumpNode extends Node {
  // parts of the pump needed by setPumpHandleToInitialPosition

  // dragListener and keyboardDragListener delegate handling of the drag to dragDelegate.

  /**
   * @param numberProperty - number of particles in the simulation
   * @param rangeProperty - allowed range
   * @param [providedOptions]
   */
  constructor(numberProperty, rangeProperty, providedOptions) {
    const options = optionize()({
      // SelfOptions
      width: 200,
      height: 250,
      handleFill: '#adafb1',
      shaftFill: '#cacaca',
      bodyFill: '#d50000',
      bodyTopFill: '#997677',
      indicatorBackgroundFill: '#443333',
      indicatorRemainingFill: '#999999',
      hoseFill: '#b3b3b3',
      baseFill: '#aaaaaa',
      hoseCurviness: 1,
      hoseAttachmentOffset: new Vector2(100, 100),
      nodeEnabledProperty: null,
      injectionEnabledProperty: new BooleanProperty(true),
      handleTouchAreaXDilation: 15,
      handleTouchAreaYDilation: 15,
      handleMouseAreaXDilation: 0,
      handleMouseAreaYDilation: 0,
      handleCursor: 'ns-resize',
      numberOfParticlesPerPumpAction: 10,
      addParticlesOneAtATime: true,
      // NodeOptions
      tandem: Tandem.REQUIRED,
      tandemNameSuffix: 'PumpNode',
      phetioInputEnabledPropertyInstrumented: true
    }, providedOptions);
    const width = options.width;
    const height = options.height;
    super(options);

    // does this instance own nodeEnabledProperty?
    const ownsEnabledProperty = !options.nodeEnabledProperty;
    this.nodeEnabledProperty = options.nodeEnabledProperty || new BooleanProperty(true);
    this.hoseAttachmentOffset = options.hoseAttachmentOffset;

    // create the base of the pump
    const baseWidth = width * PUMP_BASE_WIDTH_PROPORTION;
    const baseHeight = height * PUMP_BASE_HEIGHT_PROPORTION;
    const baseFillColorProperty = new PaintColorProperty(options.baseFill);
    const pumpBaseNode = createPumpBaseNode(baseWidth, baseHeight, baseFillColorProperty);

    // sizing for the body of the pump
    const pumpBodyWidth = width * PUMP_BODY_WIDTH_PROPORTION;
    const pumpBodyHeight = height * PUMP_BODY_HEIGHT_PROPORTION;

    // create the cone
    const coneHeight = height * CONE_HEIGHT_PROPORTION;
    const coneNode = createConeNode(pumpBodyWidth, coneHeight, baseFillColorProperty);
    coneNode.bottom = pumpBaseNode.top + 8;

    // use PaintColorProperty so that colors can be updated dynamically
    const bodyFillColorProperty = new PaintColorProperty(options.bodyFill);
    const bodyFillBrighterColorProperty = new PaintColorProperty(bodyFillColorProperty, {
      luminanceFactor: 0.2
    });
    const bodyFillDarkerColorProperty = new PaintColorProperty(bodyFillColorProperty, {
      luminanceFactor: -0.2
    });
    this.pumpBodyNode = new Rectangle(0, 0, pumpBodyWidth, pumpBodyHeight, 0, 0, {
      fill: new LinearGradient(0, 0, pumpBodyWidth, 0).addColorStop(0, bodyFillBrighterColorProperty).addColorStop(0.4, bodyFillColorProperty).addColorStop(0.7, bodyFillDarkerColorProperty)
    });
    this.pumpBodyNode.centerX = coneNode.centerX;
    this.pumpBodyNode.bottom = coneNode.top + 18;

    // use PaintColorProperty so that colors can be updated dynamically
    const bodyTopFillColorProperty = new PaintColorProperty(options.bodyTopFill);
    const bodyTopStrokeColorProperty = new PaintColorProperty(bodyTopFillColorProperty, {
      luminanceFactor: -0.3
    });

    // create the back part of the top of the body
    const bodyTopBackNode = createBodyTopHalfNode(pumpBodyWidth, -1, bodyTopFillColorProperty, bodyTopStrokeColorProperty);
    bodyTopBackNode.centerX = this.pumpBodyNode.centerX;
    bodyTopBackNode.bottom = this.pumpBodyNode.top;

    // create the front part of the top of the body
    const bodyTopFrontNode = createBodyTopHalfNode(pumpBodyWidth, 1, bodyTopFillColorProperty, bodyTopStrokeColorProperty);
    bodyTopFrontNode.centerX = this.pumpBodyNode.centerX;
    bodyTopFrontNode.top = bodyTopBackNode.bottom - 0.4; // tweak slightly to prevent pump body from showing through

    // create the bottom cap on the body
    const bodyBottomCapNode = new Path(new Shape().ellipse(0, 0, bodyTopFrontNode.width * 0.55, 3, 0), {
      fill: new PaintColorProperty(baseFillColorProperty, {
        luminanceFactor: -0.3
      }),
      centerX: bodyTopFrontNode.centerX,
      bottom: coneNode.top + 4
    });

    // create the node that will be used to indicate the remaining capacity
    const remainingCapacityIndicator = new SegmentedBarGraphNode(numberProperty, rangeProperty, {
      width: pumpBodyWidth * 0.6,
      height: pumpBodyHeight * 0.7,
      centerX: this.pumpBodyNode.centerX,
      centerY: (this.pumpBodyNode.top + coneNode.top) / 2,
      numSegments: 36,
      backgroundColor: options.indicatorBackgroundFill,
      fullyLitIndicatorColor: options.indicatorRemainingFill,
      indicatorHeightProportion: 0.7
    });

    // whether the hose should be attached to the left or right side of the pump cone
    const hoseAttachedOnRight = options.hoseAttachmentOffset.x > 0;
    const hoseConnectorWidth = width * HOSE_CONNECTOR_WIDTH_PROPORTION;
    const hoseConnectorHeight = height * HOSE_CONNECTOR_HEIGHT_PROPORTION;

    // create the hose
    const hoseNode = new Path(new Shape().moveTo(hoseAttachedOnRight ? BODY_TO_HOSE_ATTACH_POINT_X : -BODY_TO_HOSE_ATTACH_POINT_X, BODY_TO_HOSE_ATTACH_POINT_Y).cubicCurveTo(options.hoseCurviness * (options.hoseAttachmentOffset.x - BODY_TO_HOSE_ATTACH_POINT_X), BODY_TO_HOSE_ATTACH_POINT_Y, 0, options.hoseAttachmentOffset.y, options.hoseAttachmentOffset.x - (hoseAttachedOnRight ? hoseConnectorWidth : -hoseConnectorWidth), options.hoseAttachmentOffset.y), {
      lineWidth: 4,
      stroke: options.hoseFill
    });

    // create the external hose connector, which connects the hose to an external point
    const externalHoseConnector = createHoseConnectorNode(hoseConnectorWidth, hoseConnectorHeight, baseFillColorProperty);
    externalHoseConnector.setTranslation(hoseAttachedOnRight ? options.hoseAttachmentOffset.x - externalHoseConnector.width : options.hoseAttachmentOffset.x, options.hoseAttachmentOffset.y - externalHoseConnector.height / 2);

    // create the local hose connector, which connects the hose to the cone
    const localHoseConnector = createHoseConnectorNode(hoseConnectorWidth, hoseConnectorHeight, baseFillColorProperty);
    const localHoseOffsetX = hoseAttachedOnRight ? BODY_TO_HOSE_ATTACH_POINT_X : -BODY_TO_HOSE_ATTACH_POINT_X;
    localHoseConnector.setTranslation(localHoseOffsetX - hoseConnectorWidth / 2, BODY_TO_HOSE_ATTACH_POINT_Y - localHoseConnector.height / 2);

    // sizing for the pump shaft
    const pumpShaftWidth = width * PUMP_SHAFT_WIDTH_PROPORTION;
    const pumpShaftHeight = height * PUMP_SHAFT_HEIGHT_PROPORTION;

    // use PaintColorProperty so that colors can be updated dynamically
    const shaftFillColorProperty = new PaintColorProperty(options.shaftFill);
    const shaftStrokeColorProperty = new PaintColorProperty(shaftFillColorProperty, {
      luminanceFactor: -0.38
    });

    // create the pump shaft, which is the part below the handle and inside the body
    this.pumpShaftNode = new Rectangle(0, 0, pumpShaftWidth, pumpShaftHeight, {
      fill: shaftFillColorProperty,
      stroke: shaftStrokeColorProperty,
      pickable: false
    });
    this.pumpShaftNode.x = -pumpShaftWidth / 2;

    // create the handle of the pump
    this.pumpHandleNode = new PumpHandleNode(options.handleFill);
    const pumpHandleHeight = height * PUMP_HANDLE_HEIGHT_PROPORTION;
    this.pumpHandleNode.touchArea = this.pumpHandleNode.localBounds.dilatedXY(options.handleTouchAreaXDilation, options.handleTouchAreaYDilation);
    this.pumpHandleNode.mouseArea = this.pumpHandleNode.localBounds.dilatedXY(options.handleMouseAreaXDilation, options.handleMouseAreaYDilation);
    this.pumpHandleNode.scale(pumpHandleHeight / this.pumpHandleNode.height);
    this.setPumpHandleToInitialPosition();

    // enable/disable behavior and appearance for the handle
    const enabledListener = enabled => {
      this.pumpHandleNode.interruptSubtreeInput();
      this.pumpHandleNode.pickable = enabled;
      this.pumpHandleNode.cursor = enabled ? options.handleCursor : 'default';
      this.pumpHandleNode.opacity = enabled ? 1 : SceneryConstants.DISABLED_OPACITY;
      this.pumpShaftNode.opacity = enabled ? 1 : SceneryConstants.DISABLED_OPACITY;
    };
    this.nodeEnabledProperty.link(enabledListener);

    // define the allowed range for the pump handle's movement
    const maxHandleYOffset = this.pumpHandleNode.centerY;
    const minHandleYOffset = maxHandleYOffset + -PUMP_SHAFT_HEIGHT_PROPORTION * pumpBodyHeight;
    this.dragDelegate = new DragDelegate(numberProperty, rangeProperty, this.nodeEnabledProperty, options.injectionEnabledProperty, minHandleYOffset, maxHandleYOffset, this.pumpHandleNode, this.pumpShaftNode, {
      numberOfParticlesPerPumpAction: options.numberOfParticlesPerPumpAction,
      addParticlesOneAtATime: options.addParticlesOneAtATime
    });

    // Drag the pump handle using mouse/touch.
    this.dragListener = new RichDragListener(combineOptions({
      drag: event => {
        // Update the handle position based on the user's pointer position.
        const dragPositionY = this.pumpHandleNode.globalToParentPoint(event.pointer.point).y;
        const handlePosition = Utils.clamp(dragPositionY, minHandleYOffset, maxHandleYOffset);
        this.dragDelegate.handleDrag(handlePosition);
      },
      tandem: options.tandem.createTandem('dragListener')
    }, options.dragListenerOptions));
    this.pumpHandleNode.addInputListener(this.dragListener);

    // Drag the pump handle using the keyboard.
    this.keyboardDragListener = new RichKeyboardDragListener(combineOptions({
      keyboardDragDirection: 'upDown',
      dragSpeed: 200,
      shiftDragSpeed: 50,
      drag: (event, listener) => {
        const handlePosition = Utils.clamp(this.pumpHandleNode.centerY + listener.vectorDelta.y, minHandleYOffset, maxHandleYOffset);
        this.dragDelegate.handleDrag(handlePosition);
      },
      tandem: options.tandem.createTandem('keyboardDragListener')
    }, options.keyboardDragListenerOptions));
    this.pumpHandleNode.addInputListener(this.keyboardDragListener);

    // add the pieces with the correct layering
    this.addChild(pumpBaseNode);
    this.addChild(bodyTopBackNode);
    this.addChild(bodyBottomCapNode);
    this.addChild(this.pumpShaftNode);
    this.addChild(this.pumpHandleNode);
    this.addChild(this.pumpBodyNode);
    this.addChild(remainingCapacityIndicator);
    this.addChild(bodyTopFrontNode);
    this.addChild(coneNode);
    this.addChild(hoseNode);
    this.addChild(externalHoseConnector);
    this.addChild(localHoseConnector);

    // With ?dev query parameter, place a red dot at the origin.
    if (phet.chipper.queryParameters.dev) {
      this.addChild(new Circle(2, {
        fill: 'red'
      }));
    }

    // support for binder documentation, stripped out in builds and only runs when ?binder is specified
    assert && phet?.chipper?.queryParameters?.binder && InstanceRegistry.registerDataURL('scenery-phet', 'BicyclePumpNode', this);
    this.disposeBicyclePumpNode = () => {
      // Drag listeners are registered with PhET-iO, so they need to be disposed.
      this.dragListener.dispose();
      this.keyboardDragListener.dispose();

      // Clean up nodeEnabledProperty appropriately, depending on whether we created it, or it was provided to us.
      if (ownsEnabledProperty) {
        this.nodeEnabledProperty.dispose();
      } else if (this.nodeEnabledProperty.hasListener(enabledListener)) {
        this.nodeEnabledProperty.unlink(enabledListener);
      }
    };
  }

  /**
   * Sets handle and shaft to their initial position.
   */
  setPumpHandleToInitialPosition() {
    this.pumpHandleNode.bottom = this.pumpBodyNode.top - 18; // empirically determined
    this.pumpShaftNode.top = this.pumpHandleNode.bottom;
  }
  reset() {
    this.setPumpHandleToInitialPosition();
    this.dragDelegate.reset();
  }
  dispose() {
    this.disposeBicyclePumpNode();
    super.dispose();
  }
}

/**
 * Draws the base of the pump. Many of the multipliers and point positions were arrived at empirically.
 *
 * @param width - the width of the base
 * @param height - the height of the base
 * @param fill
 */
function createPumpBaseNode(width, height, fill) {
  // 3D effect is being used, so most of the height makes up the surface
  const topOfBaseHeight = height * 0.7;
  const halfOfBaseWidth = width / 2;

  // use PaintColorProperty so that colors can be updated dynamically
  const baseFillBrighterColorProperty = new PaintColorProperty(fill, {
    luminanceFactor: 0.05
  });
  const baseFillDarkerColorProperty = new PaintColorProperty(fill, {
    luminanceFactor: -0.2
  });
  const baseFillDarkestColorProperty = new PaintColorProperty(fill, {
    luminanceFactor: -0.4
  });

  // rounded rectangle that is the top of the base
  const topOfBaseNode = new Rectangle(-halfOfBaseWidth, -topOfBaseHeight / 2, width, topOfBaseHeight, 20, 20, {
    fill: new LinearGradient(-halfOfBaseWidth, 0, halfOfBaseWidth, 0).addColorStop(0, baseFillBrighterColorProperty).addColorStop(0.5, fill).addColorStop(1, baseFillDarkerColorProperty)
  });
  const pumpBaseEdgeHeight = height * 0.65;
  const pumpBaseSideEdgeYControlPoint = pumpBaseEdgeHeight * 1.05;
  const pumpBaseBottomEdgeXCurveStart = width * 0.35;

  // the front edge of the pump base, draw counter-clockwise starting at left edge
  const pumpEdgeShape = new Shape().lineTo(-halfOfBaseWidth, 0).lineTo(-halfOfBaseWidth, pumpBaseEdgeHeight / 2).quadraticCurveTo(-halfOfBaseWidth, pumpBaseSideEdgeYControlPoint, -pumpBaseBottomEdgeXCurveStart, pumpBaseEdgeHeight).lineTo(pumpBaseBottomEdgeXCurveStart, pumpBaseEdgeHeight).quadraticCurveTo(halfOfBaseWidth, pumpBaseSideEdgeYControlPoint, halfOfBaseWidth, pumpBaseEdgeHeight / 2).lineTo(halfOfBaseWidth, 0).close();

  // color the front edge of the pump base
  const pumpEdgeNode = new Path(pumpEdgeShape, {
    fill: new LinearGradient(-halfOfBaseWidth, 0, halfOfBaseWidth, 0).addColorStop(0, baseFillDarkestColorProperty).addColorStop(0.15, baseFillDarkerColorProperty).addColorStop(1, baseFillDarkestColorProperty)
  });
  pumpEdgeNode.centerY = -pumpEdgeNode.height / 2;

  // 0.6 determined empirically for best positioning
  topOfBaseNode.bottom = pumpEdgeNode.bottom - pumpBaseEdgeHeight / 2 + 0.6;
  return new Node({
    children: [pumpEdgeNode, topOfBaseNode]
  });
}

/**
 * Creates half of the opening at the top of the pump body. Passing in -1 for the sign creates the back half, and
 * passing in 1 creates the front.
 */
function createBodyTopHalfNode(width, sign, fill, stroke) {
  const bodyTopShape = new Shape().moveTo(0, 0).cubicCurveTo(0, sign * width * SHAFT_OPENING_TILT_FACTOR, width, sign * width * SHAFT_OPENING_TILT_FACTOR, width, 0);
  return new Path(bodyTopShape, {
    fill: fill,
    stroke: stroke
  });
}

/**
 * Creates a hose connector. The hose has one on each of its ends.
 */
function createHoseConnectorNode(width, height, fill) {
  // use PaintColorProperty so that colors can be updated dynamically
  const fillBrighterColorProperty = new PaintColorProperty(fill, {
    luminanceFactor: 0.1
  });
  const fillDarkerColorProperty = new PaintColorProperty(fill, {
    luminanceFactor: -0.2
  });
  const fillDarkestColorProperty = new PaintColorProperty(fill, {
    luminanceFactor: -0.4
  });
  return new Rectangle(0, 0, width, height, 2, 2, {
    fill: new LinearGradient(0, 0, 0, height).addColorStop(0, fillDarkerColorProperty).addColorStop(0.3, fill).addColorStop(0.35, fillBrighterColorProperty).addColorStop(0.4, fillBrighterColorProperty).addColorStop(1, fillDarkestColorProperty)
  });
}

/**
 * Creates the cone, which connects the pump base to the pump body.
 * @param pumpBodyWidth - the width of the pump body (not quite as wide as the top of the cone)
 * @param height
 * @param fill
 */
function createConeNode(pumpBodyWidth, height, fill) {
  const coneTopWidth = pumpBodyWidth * 1.2;
  const coneTopRadiusY = 3;
  const coneTopRadiusX = coneTopWidth / 2;
  const coneBottomWidth = pumpBodyWidth * 2;
  const coneBottomRadiusY = 4;
  const coneBottomRadiusX = coneBottomWidth / 2;
  const coneShape = new Shape()

  // start in upper right corner of shape, draw top ellipse right to left
  .ellipticalArc(0, 0, coneTopRadiusX, coneTopRadiusY, 0, 0, Math.PI, false).lineTo(-coneBottomRadiusX, height) // line to bottom left corner of shape

  // draw bottom ellipse left to right
  .ellipticalArc(0, height, coneBottomRadiusX, coneBottomRadiusY, 0, Math.PI, 0, true).lineTo(coneTopRadiusX, 0); // line to upper right corner of shape

  // use PaintColorProperty so that colors can be updated dynamically
  const fillBrighterColorProperty = new PaintColorProperty(fill, {
    luminanceFactor: 0.1
  });
  const fillDarkerColorProperty = new PaintColorProperty(fill, {
    luminanceFactor: -0.4
  });
  const fillDarkestColorProperty = new PaintColorProperty(fill, {
    luminanceFactor: -0.5
  });
  const coneGradient = new LinearGradient(-coneBottomWidth / 2, 0, coneBottomWidth / 2, 0).addColorStop(0, fillDarkerColorProperty).addColorStop(0.3, fill).addColorStop(0.35, fillBrighterColorProperty).addColorStop(0.45, fillBrighterColorProperty).addColorStop(0.5, fill).addColorStop(1, fillDarkestColorProperty);
  return new Path(coneShape, {
    fill: coneGradient
  });
}

/**
 * PumpHandleNode is the pump's handle.
 */
class PumpHandleNode extends Path {
  constructor(fill) {
    // empirically determined constants
    const centerSectionWidth = 35;
    const centerCurveWidth = 14;
    const centerCurveHeight = 8;
    const numberOfGripBumps = 4;
    const gripSingleBumpWidth = 16;
    const gripSingleBumpHalfWidth = gripSingleBumpWidth / 2;
    const gripInterBumpWidth = gripSingleBumpWidth * 0.31;
    const gripEndHeight = 23;

    // start the handle from the center bottom, drawing around counterclockwise
    const pumpHandleShape = new Shape().moveTo(0, 0);

    /**
     * Add a "bump" to the top or bottom of the grip
     * @param shape - the shape to append to
     * @param sign - +1 for bottom side of grip, -1 for top side of grip
     */
    const addGripBump = (shape, sign) => {
      // control points for quadratic curve shape on grip
      const controlPointX = gripSingleBumpWidth / 2;
      const controlPointY = gripSingleBumpWidth / 2;

      // this is a grip bump
      shape.quadraticCurveToRelative(sign * controlPointX, sign * controlPointY, sign * gripSingleBumpWidth, 0);
    };

    // this is the lower right part of the handle, including half of the middle section and the grip bumps
    pumpHandleShape.lineToRelative(centerSectionWidth / 2, 0);
    pumpHandleShape.quadraticCurveToRelative(centerCurveWidth / 2, 0, centerCurveWidth, -centerCurveHeight);
    pumpHandleShape.lineToRelative(gripInterBumpWidth, 0);
    for (let i = 0; i < numberOfGripBumps - 1; i++) {
      addGripBump(pumpHandleShape, 1);
      pumpHandleShape.lineToRelative(gripInterBumpWidth, 0);
    }
    addGripBump(pumpHandleShape, 1);

    // this is the right edge of the handle
    pumpHandleShape.lineToRelative(0, -gripEndHeight);

    // this is the upper right part of the handle, including only the grip bumps
    for (let i = 0; i < numberOfGripBumps; i++) {
      addGripBump(pumpHandleShape, -1);
      pumpHandleShape.lineToRelative(-gripInterBumpWidth, 0);
    }

    // this is the upper middle section of the handle
    pumpHandleShape.quadraticCurveToRelative(-centerCurveWidth / 2, -centerCurveHeight, -centerCurveWidth, -centerCurveHeight);
    pumpHandleShape.lineToRelative(-centerSectionWidth, 0);
    pumpHandleShape.quadraticCurveToRelative(-centerCurveWidth / 2, 0, -centerCurveWidth, centerCurveHeight);
    pumpHandleShape.lineToRelative(-gripInterBumpWidth, 0);

    // this is the upper left part of the handle, including only the grip bumps
    for (let i = 0; i < numberOfGripBumps - 1; i++) {
      addGripBump(pumpHandleShape, -1);
      pumpHandleShape.lineToRelative(-gripInterBumpWidth, 0);
    }
    addGripBump(pumpHandleShape, -1);

    // this is the left edge of the handle
    pumpHandleShape.lineToRelative(0, gripEndHeight);

    // this is the lower left part of the handle, including the grip bumps and half of the middle section
    for (let i = 0; i < numberOfGripBumps; i++) {
      addGripBump(pumpHandleShape, 1);
      pumpHandleShape.lineToRelative(gripInterBumpWidth, 0);
    }
    pumpHandleShape.quadraticCurveToRelative(centerCurveWidth / 2, centerCurveHeight, centerCurveWidth, centerCurveHeight);
    pumpHandleShape.lineToRelative(centerSectionWidth / 2, 0);
    pumpHandleShape.close();

    // used to track where the current position is on the handle when drawing its gradient
    let handleGradientPosition = 0;

    /**
     * Adds a color stop to the given gradient at
     * @param gradient - the gradient being appended to
     * @param deltaDistance - the distance of this added color stop
     * @param totalDistance - the total width of the gradient
     * @param color - the color of this color stop
     */
    const addRelativeColorStop = (gradient, deltaDistance, totalDistance, color) => {
      const newPosition = handleGradientPosition + deltaDistance;
      let ratio = newPosition / totalDistance;
      ratio = ratio > 1 ? 1 : ratio;
      gradient.addColorStop(ratio, color);
      handleGradientPosition = newPosition;
    };

    // set up the gradient for the handle
    const pumpHandleWidth = pumpHandleShape.bounds.width;
    const pumpHandleGradient = new LinearGradient(-pumpHandleWidth / 2, 0, pumpHandleWidth / 2, 0);

    // use PaintColorProperty so that colors can be updated dynamically
    const handleFillColorProperty = new PaintColorProperty(fill);
    const handleFillDarkerColorProperty = new PaintColorProperty(handleFillColorProperty, {
      luminanceFactor: -0.35
    });

    // fill the left side handle gradient
    for (let i = 0; i < numberOfGripBumps; i++) {
      addRelativeColorStop(pumpHandleGradient, 0, pumpHandleWidth, handleFillColorProperty);
      addRelativeColorStop(pumpHandleGradient, gripSingleBumpHalfWidth, pumpHandleWidth, handleFillColorProperty);
      addRelativeColorStop(pumpHandleGradient, gripSingleBumpHalfWidth, pumpHandleWidth, handleFillDarkerColorProperty);
      addRelativeColorStop(pumpHandleGradient, 0, pumpHandleWidth, handleFillColorProperty);
      addRelativeColorStop(pumpHandleGradient, gripInterBumpWidth, pumpHandleWidth, handleFillDarkerColorProperty);
    }

    // fill the center section handle gradient
    addRelativeColorStop(pumpHandleGradient, 0, pumpHandleWidth, handleFillColorProperty);
    addRelativeColorStop(pumpHandleGradient, centerCurveWidth + centerSectionWidth, pumpHandleWidth, handleFillColorProperty);
    addRelativeColorStop(pumpHandleGradient, centerCurveWidth, pumpHandleWidth, handleFillDarkerColorProperty);

    // fill the right side handle gradient
    for (let i = 0; i < numberOfGripBumps; i++) {
      addRelativeColorStop(pumpHandleGradient, 0, pumpHandleWidth, handleFillColorProperty);
      addRelativeColorStop(pumpHandleGradient, gripInterBumpWidth, pumpHandleWidth, handleFillDarkerColorProperty);
      addRelativeColorStop(pumpHandleGradient, 0, pumpHandleWidth, handleFillColorProperty);
      addRelativeColorStop(pumpHandleGradient, gripSingleBumpHalfWidth, pumpHandleWidth, handleFillColorProperty);
      addRelativeColorStop(pumpHandleGradient, gripSingleBumpHalfWidth, pumpHandleWidth, handleFillDarkerColorProperty);
    }
    super(pumpHandleShape, {
      lineWidth: 2,
      stroke: 'black',
      fill: pumpHandleGradient,
      tagName: 'div',
      focusable: true
    });
  }
}

/**
 * DragDelegate handles the drag action for the pump handle. The RichDragListener and RichKeyboardDragListener instances
 * in BicyclePumpNode delegate to an instance of this class.
 */

class DragDelegate {
  constructor(numberProperty, rangeProperty, nodeEnabledProperty, injectionEnabledProperty, minHandleYOffset, maxHandleYOffset, pumpHandleNode, pumpShaftNode, providedOptions) {
    assert && assert(maxHandleYOffset > minHandleYOffset, 'bogus offsets');
    const options = providedOptions;
    this.numberProperty = numberProperty;
    this.rangeProperty = rangeProperty;
    this.nodeEnabledProperty = nodeEnabledProperty;
    this.injectionEnabledProperty = injectionEnabledProperty;
    this.pumpHandleNode = pumpHandleNode;
    this.pumpShaftNode = pumpShaftNode;
    this.addParticlesOneAtATime = options.addParticlesOneAtATime;
    this.pumpingDistanceAccumulation = 0;
    this.lastHandlePosition = null;

    // How far the pump shaft needs to travel before the pump releases a particle.
    // The subtracted constant was empirically determined to ensure that numberOfParticlesPerPumpAction is correct.
    this.pumpingDistanceRequiredToAddParticle = (maxHandleYOffset - minHandleYOffset) / options.numberOfParticlesPerPumpAction - 0.01;
  }
  reset() {
    this.pumpingDistanceAccumulation = 0;
    this.lastHandlePosition = null;
  }

  /**
   * Handles a drag of the pump handle. RichDragListener and RichKeyboardDragListener instances in BicyclePumpNode
   * should call this method from their options.drag function.
   */
  handleDrag(newHandlePosition) {
    this.pumpHandleNode.centerY = newHandlePosition;
    this.pumpShaftNode.top = this.pumpHandleNode.bottom;
    let numberOfBatchParticles = 0; // number of particles to add all at once

    if (this.lastHandlePosition !== null) {
      const travelDistance = newHandlePosition - this.lastHandlePosition;
      if (travelDistance > 0) {
        // This motion is in the downward direction, so add its distance to the pumping distance.
        this.pumpingDistanceAccumulation += travelDistance;
        while (this.pumpingDistanceAccumulation >= this.pumpingDistanceRequiredToAddParticle) {
          // add a particle
          if (this.nodeEnabledProperty.value && this.injectionEnabledProperty.value && this.numberProperty.value + numberOfBatchParticles < this.rangeProperty.value.max) {
            if (this.addParticlesOneAtATime) {
              this.numberProperty.value++;
            } else {
              numberOfBatchParticles++;
            }
          }
          this.pumpingDistanceAccumulation -= this.pumpingDistanceRequiredToAddParticle;
        }
      } else {
        this.pumpingDistanceAccumulation = 0;
      }
    }

    // Add particles in one batch.
    if (!this.addParticlesOneAtATime) {
      this.numberProperty.value += numberOfBatchParticles;
    } else {
      assert && assert(numberOfBatchParticles === 0, 'unexpected batched particles');
    }
    this.lastHandlePosition = newHandlePosition;
  }
}
sceneryPhet.register('BicyclePumpNode', BicyclePumpNode);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJVdGlscyIsIlZlY3RvcjIiLCJTaGFwZSIsIkluc3RhbmNlUmVnaXN0cnkiLCJvcHRpb25pemUiLCJjb21iaW5lT3B0aW9ucyIsIkNpcmNsZSIsIkxpbmVhckdyYWRpZW50IiwiTm9kZSIsIlBhaW50Q29sb3JQcm9wZXJ0eSIsIlBhdGgiLCJSZWN0YW5nbGUiLCJTY2VuZXJ5Q29uc3RhbnRzIiwiVGFuZGVtIiwic2NlbmVyeVBoZXQiLCJTZWdtZW50ZWRCYXJHcmFwaE5vZGUiLCJSaWNoRHJhZ0xpc3RlbmVyIiwiUmljaEtleWJvYXJkRHJhZ0xpc3RlbmVyIiwiUFVNUF9CQVNFX1dJRFRIX1BST1BPUlRJT04iLCJQVU1QX0JBU0VfSEVJR0hUX1BST1BPUlRJT04iLCJQVU1QX0JPRFlfSEVJR0hUX1BST1BPUlRJT04iLCJQVU1QX0JPRFlfV0lEVEhfUFJPUE9SVElPTiIsIlBVTVBfU0hBRlRfV0lEVEhfUFJPUE9SVElPTiIsIlBVTVBfU0hBRlRfSEVJR0hUX1BST1BPUlRJT04iLCJQVU1QX0hBTkRMRV9IRUlHSFRfUFJPUE9SVElPTiIsIkNPTkVfSEVJR0hUX1BST1BPUlRJT04iLCJIT1NFX0NPTk5FQ1RPUl9IRUlHSFRfUFJPUE9SVElPTiIsIkhPU0VfQ09OTkVDVE9SX1dJRFRIX1BST1BPUlRJT04iLCJTSEFGVF9PUEVOSU5HX1RJTFRfRkFDVE9SIiwiQk9EWV9UT19IT1NFX0FUVEFDSF9QT0lOVF9YIiwiQk9EWV9UT19IT1NFX0FUVEFDSF9QT0lOVF9ZIiwiQmljeWNsZVB1bXBOb2RlIiwiY29uc3RydWN0b3IiLCJudW1iZXJQcm9wZXJ0eSIsInJhbmdlUHJvcGVydHkiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwid2lkdGgiLCJoZWlnaHQiLCJoYW5kbGVGaWxsIiwic2hhZnRGaWxsIiwiYm9keUZpbGwiLCJib2R5VG9wRmlsbCIsImluZGljYXRvckJhY2tncm91bmRGaWxsIiwiaW5kaWNhdG9yUmVtYWluaW5nRmlsbCIsImhvc2VGaWxsIiwiYmFzZUZpbGwiLCJob3NlQ3VydmluZXNzIiwiaG9zZUF0dGFjaG1lbnRPZmZzZXQiLCJub2RlRW5hYmxlZFByb3BlcnR5IiwiaW5qZWN0aW9uRW5hYmxlZFByb3BlcnR5IiwiaGFuZGxlVG91Y2hBcmVhWERpbGF0aW9uIiwiaGFuZGxlVG91Y2hBcmVhWURpbGF0aW9uIiwiaGFuZGxlTW91c2VBcmVhWERpbGF0aW9uIiwiaGFuZGxlTW91c2VBcmVhWURpbGF0aW9uIiwiaGFuZGxlQ3Vyc29yIiwibnVtYmVyT2ZQYXJ0aWNsZXNQZXJQdW1wQWN0aW9uIiwiYWRkUGFydGljbGVzT25lQXRBVGltZSIsInRhbmRlbSIsIlJFUVVJUkVEIiwidGFuZGVtTmFtZVN1ZmZpeCIsInBoZXRpb0lucHV0RW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkIiwib3duc0VuYWJsZWRQcm9wZXJ0eSIsImJhc2VXaWR0aCIsImJhc2VIZWlnaHQiLCJiYXNlRmlsbENvbG9yUHJvcGVydHkiLCJwdW1wQmFzZU5vZGUiLCJjcmVhdGVQdW1wQmFzZU5vZGUiLCJwdW1wQm9keVdpZHRoIiwicHVtcEJvZHlIZWlnaHQiLCJjb25lSGVpZ2h0IiwiY29uZU5vZGUiLCJjcmVhdGVDb25lTm9kZSIsImJvdHRvbSIsInRvcCIsImJvZHlGaWxsQ29sb3JQcm9wZXJ0eSIsImJvZHlGaWxsQnJpZ2h0ZXJDb2xvclByb3BlcnR5IiwibHVtaW5hbmNlRmFjdG9yIiwiYm9keUZpbGxEYXJrZXJDb2xvclByb3BlcnR5IiwicHVtcEJvZHlOb2RlIiwiZmlsbCIsImFkZENvbG9yU3RvcCIsImNlbnRlclgiLCJib2R5VG9wRmlsbENvbG9yUHJvcGVydHkiLCJib2R5VG9wU3Ryb2tlQ29sb3JQcm9wZXJ0eSIsImJvZHlUb3BCYWNrTm9kZSIsImNyZWF0ZUJvZHlUb3BIYWxmTm9kZSIsImJvZHlUb3BGcm9udE5vZGUiLCJib2R5Qm90dG9tQ2FwTm9kZSIsImVsbGlwc2UiLCJyZW1haW5pbmdDYXBhY2l0eUluZGljYXRvciIsImNlbnRlclkiLCJudW1TZWdtZW50cyIsImJhY2tncm91bmRDb2xvciIsImZ1bGx5TGl0SW5kaWNhdG9yQ29sb3IiLCJpbmRpY2F0b3JIZWlnaHRQcm9wb3J0aW9uIiwiaG9zZUF0dGFjaGVkT25SaWdodCIsIngiLCJob3NlQ29ubmVjdG9yV2lkdGgiLCJob3NlQ29ubmVjdG9ySGVpZ2h0IiwiaG9zZU5vZGUiLCJtb3ZlVG8iLCJjdWJpY0N1cnZlVG8iLCJ5IiwibGluZVdpZHRoIiwic3Ryb2tlIiwiZXh0ZXJuYWxIb3NlQ29ubmVjdG9yIiwiY3JlYXRlSG9zZUNvbm5lY3Rvck5vZGUiLCJzZXRUcmFuc2xhdGlvbiIsImxvY2FsSG9zZUNvbm5lY3RvciIsImxvY2FsSG9zZU9mZnNldFgiLCJwdW1wU2hhZnRXaWR0aCIsInB1bXBTaGFmdEhlaWdodCIsInNoYWZ0RmlsbENvbG9yUHJvcGVydHkiLCJzaGFmdFN0cm9rZUNvbG9yUHJvcGVydHkiLCJwdW1wU2hhZnROb2RlIiwicGlja2FibGUiLCJwdW1wSGFuZGxlTm9kZSIsIlB1bXBIYW5kbGVOb2RlIiwicHVtcEhhbmRsZUhlaWdodCIsInRvdWNoQXJlYSIsImxvY2FsQm91bmRzIiwiZGlsYXRlZFhZIiwibW91c2VBcmVhIiwic2NhbGUiLCJzZXRQdW1wSGFuZGxlVG9Jbml0aWFsUG9zaXRpb24iLCJlbmFibGVkTGlzdGVuZXIiLCJlbmFibGVkIiwiaW50ZXJydXB0U3VidHJlZUlucHV0IiwiY3Vyc29yIiwib3BhY2l0eSIsIkRJU0FCTEVEX09QQUNJVFkiLCJsaW5rIiwibWF4SGFuZGxlWU9mZnNldCIsIm1pbkhhbmRsZVlPZmZzZXQiLCJkcmFnRGVsZWdhdGUiLCJEcmFnRGVsZWdhdGUiLCJkcmFnTGlzdGVuZXIiLCJkcmFnIiwiZXZlbnQiLCJkcmFnUG9zaXRpb25ZIiwiZ2xvYmFsVG9QYXJlbnRQb2ludCIsInBvaW50ZXIiLCJwb2ludCIsImhhbmRsZVBvc2l0aW9uIiwiY2xhbXAiLCJoYW5kbGVEcmFnIiwiY3JlYXRlVGFuZGVtIiwiZHJhZ0xpc3RlbmVyT3B0aW9ucyIsImFkZElucHV0TGlzdGVuZXIiLCJrZXlib2FyZERyYWdMaXN0ZW5lciIsImtleWJvYXJkRHJhZ0RpcmVjdGlvbiIsImRyYWdTcGVlZCIsInNoaWZ0RHJhZ1NwZWVkIiwibGlzdGVuZXIiLCJ2ZWN0b3JEZWx0YSIsImtleWJvYXJkRHJhZ0xpc3RlbmVyT3B0aW9ucyIsImFkZENoaWxkIiwicGhldCIsImNoaXBwZXIiLCJxdWVyeVBhcmFtZXRlcnMiLCJkZXYiLCJhc3NlcnQiLCJiaW5kZXIiLCJyZWdpc3RlckRhdGFVUkwiLCJkaXNwb3NlQmljeWNsZVB1bXBOb2RlIiwiZGlzcG9zZSIsImhhc0xpc3RlbmVyIiwidW5saW5rIiwicmVzZXQiLCJ0b3BPZkJhc2VIZWlnaHQiLCJoYWxmT2ZCYXNlV2lkdGgiLCJiYXNlRmlsbEJyaWdodGVyQ29sb3JQcm9wZXJ0eSIsImJhc2VGaWxsRGFya2VyQ29sb3JQcm9wZXJ0eSIsImJhc2VGaWxsRGFya2VzdENvbG9yUHJvcGVydHkiLCJ0b3BPZkJhc2VOb2RlIiwicHVtcEJhc2VFZGdlSGVpZ2h0IiwicHVtcEJhc2VTaWRlRWRnZVlDb250cm9sUG9pbnQiLCJwdW1wQmFzZUJvdHRvbUVkZ2VYQ3VydmVTdGFydCIsInB1bXBFZGdlU2hhcGUiLCJsaW5lVG8iLCJxdWFkcmF0aWNDdXJ2ZVRvIiwiY2xvc2UiLCJwdW1wRWRnZU5vZGUiLCJjaGlsZHJlbiIsInNpZ24iLCJib2R5VG9wU2hhcGUiLCJmaWxsQnJpZ2h0ZXJDb2xvclByb3BlcnR5IiwiZmlsbERhcmtlckNvbG9yUHJvcGVydHkiLCJmaWxsRGFya2VzdENvbG9yUHJvcGVydHkiLCJjb25lVG9wV2lkdGgiLCJjb25lVG9wUmFkaXVzWSIsImNvbmVUb3BSYWRpdXNYIiwiY29uZUJvdHRvbVdpZHRoIiwiY29uZUJvdHRvbVJhZGl1c1kiLCJjb25lQm90dG9tUmFkaXVzWCIsImNvbmVTaGFwZSIsImVsbGlwdGljYWxBcmMiLCJNYXRoIiwiUEkiLCJjb25lR3JhZGllbnQiLCJjZW50ZXJTZWN0aW9uV2lkdGgiLCJjZW50ZXJDdXJ2ZVdpZHRoIiwiY2VudGVyQ3VydmVIZWlnaHQiLCJudW1iZXJPZkdyaXBCdW1wcyIsImdyaXBTaW5nbGVCdW1wV2lkdGgiLCJncmlwU2luZ2xlQnVtcEhhbGZXaWR0aCIsImdyaXBJbnRlckJ1bXBXaWR0aCIsImdyaXBFbmRIZWlnaHQiLCJwdW1wSGFuZGxlU2hhcGUiLCJhZGRHcmlwQnVtcCIsInNoYXBlIiwiY29udHJvbFBvaW50WCIsImNvbnRyb2xQb2ludFkiLCJxdWFkcmF0aWNDdXJ2ZVRvUmVsYXRpdmUiLCJsaW5lVG9SZWxhdGl2ZSIsImkiLCJoYW5kbGVHcmFkaWVudFBvc2l0aW9uIiwiYWRkUmVsYXRpdmVDb2xvclN0b3AiLCJncmFkaWVudCIsImRlbHRhRGlzdGFuY2UiLCJ0b3RhbERpc3RhbmNlIiwiY29sb3IiLCJuZXdQb3NpdGlvbiIsInJhdGlvIiwicHVtcEhhbmRsZVdpZHRoIiwiYm91bmRzIiwicHVtcEhhbmRsZUdyYWRpZW50IiwiaGFuZGxlRmlsbENvbG9yUHJvcGVydHkiLCJoYW5kbGVGaWxsRGFya2VyQ29sb3JQcm9wZXJ0eSIsInRhZ05hbWUiLCJmb2N1c2FibGUiLCJwdW1waW5nRGlzdGFuY2VBY2N1bXVsYXRpb24iLCJsYXN0SGFuZGxlUG9zaXRpb24iLCJwdW1waW5nRGlzdGFuY2VSZXF1aXJlZFRvQWRkUGFydGljbGUiLCJuZXdIYW5kbGVQb3NpdGlvbiIsIm51bWJlck9mQmF0Y2hQYXJ0aWNsZXMiLCJ0cmF2ZWxEaXN0YW5jZSIsInZhbHVlIiwibWF4IiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJCaWN5Y2xlUHVtcE5vZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVGhpcyBpcyBhIGdyYXBoaWNhbCByZXByZXNlbnRhdGlvbiBvZiBhIGJpY3ljbGUgcHVtcC4gQSB1c2VyIGNhbiBtb3ZlIHRoZSBoYW5kbGUgdXAgYW5kIGRvd24uXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9obiBCbGFuY29cclxuICogQGF1dGhvciBTaWRkaGFydGhhIENoaW50aGFwYWxseSAoQWN0dWFsIENvbmNlcHRzKVxyXG4gKiBAYXV0aG9yIENocmlzIEtsdXNlbmRvcmYgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgU2F1cmFiaCBUb3RleVxyXG4gKi9cclxuXHJcbmltcG9ydCBCb29sZWFuUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9Cb29sZWFuUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgU3RyaWN0T21pdCBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvU3RyaWN0T21pdC5qcyc7XHJcbmltcG9ydCBUUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9UUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBVdGlscyBmcm9tICcuLi8uLi9kb3QvanMvVXRpbHMuanMnO1xyXG5pbXBvcnQgUmFuZ2UgZnJvbSAnLi4vLi4vZG90L2pzL1JhbmdlLmpzJztcclxuaW1wb3J0IFZlY3RvcjIgZnJvbSAnLi4vLi4vZG90L2pzL1ZlY3RvcjIuanMnO1xyXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gJy4uLy4uL2tpdGUvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBJbnN0YW5jZVJlZ2lzdHJ5IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9kb2N1bWVudGF0aW9uL0luc3RhbmNlUmVnaXN0cnkuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplLCB7IGNvbWJpbmVPcHRpb25zIH0gZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCB7IENpcmNsZSwgTGluZWFyR3JhZGllbnQsIE5vZGUsIE5vZGVPcHRpb25zLCBQYWludENvbG9yUHJvcGVydHksIFBhdGgsIFByZXNzTGlzdGVuZXJFdmVudCwgUmVjdGFuZ2xlLCBTY2VuZXJ5Q29uc3RhbnRzLCBUQ29sb3IgfSBmcm9tICcuLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgc2NlbmVyeVBoZXQgZnJvbSAnLi9zY2VuZXJ5UGhldC5qcyc7XHJcbmltcG9ydCBTZWdtZW50ZWRCYXJHcmFwaE5vZGUgZnJvbSAnLi9TZWdtZW50ZWRCYXJHcmFwaE5vZGUuanMnO1xyXG5pbXBvcnQgUGlja1JlcXVpcmVkIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9QaWNrUmVxdWlyZWQuanMnO1xyXG5pbXBvcnQgUmljaERyYWdMaXN0ZW5lciwgeyBSaWNoRHJhZ0xpc3RlbmVyT3B0aW9ucyB9IGZyb20gJy4vUmljaERyYWdMaXN0ZW5lci5qcyc7XHJcbmltcG9ydCBSaWNoS2V5Ym9hcmREcmFnTGlzdGVuZXIsIHsgUmljaEtleWJvYXJkRHJhZ0xpc3RlbmVyT3B0aW9ucyB9IGZyb20gJy4vUmljaEtleWJvYXJkRHJhZ0xpc3RlbmVyLmpzJztcclxuXHJcbi8vIFRoZSBmb2xsb3cgY29uc3RhbnRzIGRlZmluZSB0aGUgc2l6ZSBhbmQgcG9zaXRpb25zIG9mIHRoZSB2YXJpb3VzIGNvbXBvbmVudHMgb2YgdGhlIHB1bXAgYXMgcHJvcG9ydGlvbnMgb2YgdGhlXHJcbi8vIG92ZXJhbGwgd2lkdGggYW5kIGhlaWdodCBvZiB0aGUgbm9kZS5cclxuY29uc3QgUFVNUF9CQVNFX1dJRFRIX1BST1BPUlRJT04gPSAwLjM1O1xyXG5jb25zdCBQVU1QX0JBU0VfSEVJR0hUX1BST1BPUlRJT04gPSAwLjA3NTtcclxuY29uc3QgUFVNUF9CT0RZX0hFSUdIVF9QUk9QT1JUSU9OID0gMC43O1xyXG5jb25zdCBQVU1QX0JPRFlfV0lEVEhfUFJPUE9SVElPTiA9IDAuMDc7XHJcbmNvbnN0IFBVTVBfU0hBRlRfV0lEVEhfUFJPUE9SVElPTiA9IFBVTVBfQk9EWV9XSURUSF9QUk9QT1JUSU9OICogMC4yNTtcclxuY29uc3QgUFVNUF9TSEFGVF9IRUlHSFRfUFJPUE9SVElPTiA9IFBVTVBfQk9EWV9IRUlHSFRfUFJPUE9SVElPTjtcclxuY29uc3QgUFVNUF9IQU5ETEVfSEVJR0hUX1BST1BPUlRJT04gPSAwLjA1O1xyXG5jb25zdCBDT05FX0hFSUdIVF9QUk9QT1JUSU9OID0gMC4wOTtcclxuY29uc3QgSE9TRV9DT05ORUNUT1JfSEVJR0hUX1BST1BPUlRJT04gPSAwLjA0O1xyXG5jb25zdCBIT1NFX0NPTk5FQ1RPUl9XSURUSF9QUk9QT1JUSU9OID0gMC4wNTtcclxuY29uc3QgU0hBRlRfT1BFTklOR19USUxUX0ZBQ1RPUiA9IDAuMzM7XHJcbmNvbnN0IEJPRFlfVE9fSE9TRV9BVFRBQ0hfUE9JTlRfWCA9IDEzO1xyXG5jb25zdCBCT0RZX1RPX0hPU0VfQVRUQUNIX1BPSU5UX1kgPSAtMjY7XHJcblxyXG50eXBlIFNlbGZPcHRpb25zID0ge1xyXG5cclxuICB3aWR0aD86IG51bWJlcjtcclxuICBoZWlnaHQ/OiBudW1iZXI7XHJcblxyXG4gIC8vIHZhcmlvdXMgY29sb3JzIHVzZWQgYnkgdGhlIHB1bXBcclxuICBoYW5kbGVGaWxsPzogVENvbG9yO1xyXG4gIHNoYWZ0RmlsbD86IFRDb2xvcjtcclxuICBib2R5RmlsbD86IFRDb2xvcjtcclxuICBib2R5VG9wRmlsbD86IFRDb2xvcjtcclxuICBpbmRpY2F0b3JCYWNrZ3JvdW5kRmlsbD86IFRDb2xvcjtcclxuICBpbmRpY2F0b3JSZW1haW5pbmdGaWxsPzogVENvbG9yO1xyXG4gIGhvc2VGaWxsPzogVENvbG9yO1xyXG4gIGJhc2VGaWxsPzogVENvbG9yOyAvLyB0aGlzIGNvbG9yIGlzIGFsc28gdXNlZCBmb3IgdGhlIGNvbmUgc2hhcGUgYW5kIGhvc2UgY29ubmVjdG9yc1xyXG5cclxuICAvLyBncmVhdGVyIHZhbHVlID0gY3VydnkgaG9zZSwgc21hbGxlciB2YWx1ZSA9IHN0cmFpZ2h0ZXIgaG9zZVxyXG4gIGhvc2VDdXJ2aW5lc3M/OiBudW1iZXI7XHJcblxyXG4gIC8vIHdoZXJlIHRoZSBob3NlIHdpbGwgYXR0YWNoIGV4dGVybmFsbHkgcmVsYXRpdmUgdG8gdGhlIG9yaWdpbiBvZiB0aGUgcHVtcFxyXG4gIGhvc2VBdHRhY2htZW50T2Zmc2V0PzogVmVjdG9yMjtcclxuXHJcbiAgLy8gRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBwdW1wIHdpbGwgaW50ZXJhY3RpdmUuIElmIHRoZSBwdW1wJ3MgcmFuZ2UgY2hhbmdlcywgdGhlIHB1bXBzXHJcbiAgLy8gaW5kaWNhdG9yIHdpbGwgdXBkYXRlIHJlZ2FyZGxlc3Mgb2YgZW5hYmxlZFByb3BlcnR5LiBJZiBudWxsLCB0aGlzIFByb3BlcnR5IHdpbGwgYmUgY3JlYXRlZC5cclxuICBub2RlRW5hYmxlZFByb3BlcnR5PzogVFByb3BlcnR5PGJvb2xlYW4+IHwgbnVsbDtcclxuXHJcbiAgLy8ge0Jvb2xlYW5Qcm9wZXJ0eX0gLSBkZXRlcm1pbmVzIHdoZXRoZXIgdGhlIHB1bXAgaXMgYWJsZSB0byBpbmplY3QgcGFydGljbGVzIHdoZW4gdGhlIHB1bXAgaXMgc3RpbGwgaW50ZXJhY3RpdmUuXHJcbiAgLy8gVGhpcyBpcyBuZWVkZWQgZm9yIHdoZW4gYSB1c2VyIGlzIHB1bXBpbmcgaW4gcGFydGljbGVzIHRvbyBxdWlja2x5IGZvciBhIG1vZGVsIHRvIGhhbmRsZSAoc28gdGhlIGluamVjdGlvblxyXG4gIC8vIG5lZWRzIHRocm90dGxpbmcpLCBidXQgdGhlIHB1bXAgc2hvdWxkIG5vdCBiZWNvbWUgbm9uLWludGVyYWN0aXZlIGFzIGEgcmVzdWx0LFxyXG4gIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc3RhdGVzLW9mLW1hdHRlci9pc3N1ZXMvMjc2XHJcbiAgaW5qZWN0aW9uRW5hYmxlZFByb3BlcnR5PzogVFByb3BlcnR5PGJvb2xlYW4+O1xyXG5cclxuICAvLyBwb2ludGVyIGFyZWFzXHJcbiAgaGFuZGxlVG91Y2hBcmVhWERpbGF0aW9uPzogbnVtYmVyO1xyXG4gIGhhbmRsZVRvdWNoQXJlYVlEaWxhdGlvbj86IG51bWJlcjtcclxuICBoYW5kbGVNb3VzZUFyZWFYRGlsYXRpb24/OiBudW1iZXI7XHJcbiAgaGFuZGxlTW91c2VBcmVhWURpbGF0aW9uPzogbnVtYmVyO1xyXG5cclxuICAvLyBPcHRpb25zIHBhc3NlZCB0byB0aGUgZHJhZyBsaXN0ZW5lcnMuXHJcbiAgZHJhZ0xpc3RlbmVyT3B0aW9ucz86IFN0cmljdE9taXQ8UmljaERyYWdMaXN0ZW5lck9wdGlvbnMsICdkcmFnJyB8ICd0YW5kZW0nPjtcclxuICBrZXlib2FyZERyYWdMaXN0ZW5lck9wdGlvbnM/OiBTdHJpY3RPbWl0PFJpY2hLZXlib2FyZERyYWdMaXN0ZW5lck9wdGlvbnMsICdkcmFnJyB8ICdrZXlib2FyZERyYWdEaXJlY3Rpb24nIHwgJ3RhbmRlbSc+O1xyXG5cclxuICAvLyBjdXJzb3IgZm9yIHRoZSBwdW1wIGhhbmRsZSB3aGVuIGl0J3MgZW5hYmxlZFxyXG4gIGhhbmRsZUN1cnNvcj86ICducy1yZXNpemUnO1xyXG5cclxuICAvLyBOdW1iZXIgb2YgcGFydGljbGVzIHJlbGVhc2VkIGJ5IHRoZSBwdW1wIGR1cmluZyBvbmUgcHVtcGluZyBhY3Rpb24uXHJcbiAgbnVtYmVyT2ZQYXJ0aWNsZXNQZXJQdW1wQWN0aW9uPzogbnVtYmVyO1xyXG5cclxuICAvLyBJZiBmYWxzZSwgcGFydGljbGVzIGFyZSBhZGRlZCBhcyBhIGJhdGNoIGF0IHRoZSBlbmQgb2YgZWFjaCBwdW1waW5nIG1vdGlvbi5cclxuICBhZGRQYXJ0aWNsZXNPbmVBdEFUaW1lPzogYm9vbGVhbjtcclxufTtcclxuXHJcbmV4cG9ydCB0eXBlIEJpY3ljbGVQdW1wTm9kZU9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIE5vZGVPcHRpb25zO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQmljeWNsZVB1bXBOb2RlIGV4dGVuZHMgTm9kZSB7XHJcblxyXG4gIHB1YmxpYyByZWFkb25seSBub2RlRW5hYmxlZFByb3BlcnR5OiBUUHJvcGVydHk8Ym9vbGVhbj47XHJcbiAgcHVibGljIHJlYWRvbmx5IGhvc2VBdHRhY2htZW50T2Zmc2V0OiBWZWN0b3IyO1xyXG5cclxuICAvLyBwYXJ0cyBvZiB0aGUgcHVtcCBuZWVkZWQgYnkgc2V0UHVtcEhhbmRsZVRvSW5pdGlhbFBvc2l0aW9uXHJcbiAgcHJpdmF0ZSByZWFkb25seSBwdW1wQm9keU5vZGU6IE5vZGU7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBwdW1wU2hhZnROb2RlOiBOb2RlO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgcHVtcEhhbmRsZU5vZGU6IE5vZGU7XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgZHJhZ0xpc3RlbmVyOiBSaWNoRHJhZ0xpc3RlbmVyO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkga2V5Ym9hcmREcmFnTGlzdGVuZXI6IFJpY2hLZXlib2FyZERyYWdMaXN0ZW5lcjtcclxuXHJcbiAgLy8gZHJhZ0xpc3RlbmVyIGFuZCBrZXlib2FyZERyYWdMaXN0ZW5lciBkZWxlZ2F0ZSBoYW5kbGluZyBvZiB0aGUgZHJhZyB0byBkcmFnRGVsZWdhdGUuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBkcmFnRGVsZWdhdGU6IERyYWdEZWxlZ2F0ZTtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNwb3NlQmljeWNsZVB1bXBOb2RlOiAoKSA9PiB2b2lkO1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gbnVtYmVyUHJvcGVydHkgLSBudW1iZXIgb2YgcGFydGljbGVzIGluIHRoZSBzaW11bGF0aW9uXHJcbiAgICogQHBhcmFtIHJhbmdlUHJvcGVydHkgLSBhbGxvd2VkIHJhbmdlXHJcbiAgICogQHBhcmFtIFtwcm92aWRlZE9wdGlvbnNdXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBudW1iZXJQcm9wZXJ0eTogVFByb3BlcnR5PG51bWJlcj4sXHJcbiAgICAgICAgICAgICAgICAgICAgICByYW5nZVByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxSYW5nZT4sXHJcbiAgICAgICAgICAgICAgICAgICAgICBwcm92aWRlZE9wdGlvbnM/OiBCaWN5Y2xlUHVtcE5vZGVPcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8QmljeWNsZVB1bXBOb2RlT3B0aW9ucywgU3RyaWN0T21pdDxTZWxmT3B0aW9ucywgJ2RyYWdMaXN0ZW5lck9wdGlvbnMnIHwgJ2tleWJvYXJkRHJhZ0xpc3RlbmVyT3B0aW9ucyc+LCBOb2RlT3B0aW9ucz4oKSgge1xyXG5cclxuICAgICAgLy8gU2VsZk9wdGlvbnNcclxuICAgICAgd2lkdGg6IDIwMCxcclxuICAgICAgaGVpZ2h0OiAyNTAsXHJcbiAgICAgIGhhbmRsZUZpbGw6ICcjYWRhZmIxJyxcclxuICAgICAgc2hhZnRGaWxsOiAnI2NhY2FjYScsXHJcbiAgICAgIGJvZHlGaWxsOiAnI2Q1MDAwMCcsXHJcbiAgICAgIGJvZHlUb3BGaWxsOiAnIzk5NzY3NycsXHJcbiAgICAgIGluZGljYXRvckJhY2tncm91bmRGaWxsOiAnIzQ0MzMzMycsXHJcbiAgICAgIGluZGljYXRvclJlbWFpbmluZ0ZpbGw6ICcjOTk5OTk5JyxcclxuICAgICAgaG9zZUZpbGw6ICcjYjNiM2IzJyxcclxuICAgICAgYmFzZUZpbGw6ICcjYWFhYWFhJyxcclxuICAgICAgaG9zZUN1cnZpbmVzczogMSxcclxuICAgICAgaG9zZUF0dGFjaG1lbnRPZmZzZXQ6IG5ldyBWZWN0b3IyKCAxMDAsIDEwMCApLFxyXG4gICAgICBub2RlRW5hYmxlZFByb3BlcnR5OiBudWxsLFxyXG4gICAgICBpbmplY3Rpb25FbmFibGVkUHJvcGVydHk6IG5ldyBCb29sZWFuUHJvcGVydHkoIHRydWUgKSxcclxuICAgICAgaGFuZGxlVG91Y2hBcmVhWERpbGF0aW9uOiAxNSxcclxuICAgICAgaGFuZGxlVG91Y2hBcmVhWURpbGF0aW9uOiAxNSxcclxuICAgICAgaGFuZGxlTW91c2VBcmVhWERpbGF0aW9uOiAwLFxyXG4gICAgICBoYW5kbGVNb3VzZUFyZWFZRGlsYXRpb246IDAsXHJcbiAgICAgIGhhbmRsZUN1cnNvcjogJ25zLXJlc2l6ZScsXHJcbiAgICAgIG51bWJlck9mUGFydGljbGVzUGVyUHVtcEFjdGlvbjogMTAsXHJcbiAgICAgIGFkZFBhcnRpY2xlc09uZUF0QVRpbWU6IHRydWUsXHJcblxyXG4gICAgICAvLyBOb2RlT3B0aW9uc1xyXG4gICAgICB0YW5kZW06IFRhbmRlbS5SRVFVSVJFRCxcclxuICAgICAgdGFuZGVtTmFtZVN1ZmZpeDogJ1B1bXBOb2RlJyxcclxuICAgICAgcGhldGlvSW5wdXRFbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQ6IHRydWVcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIGNvbnN0IHdpZHRoID0gb3B0aW9ucy53aWR0aDtcclxuICAgIGNvbnN0IGhlaWdodCA9IG9wdGlvbnMuaGVpZ2h0O1xyXG5cclxuICAgIHN1cGVyKCBvcHRpb25zICk7XHJcblxyXG4gICAgLy8gZG9lcyB0aGlzIGluc3RhbmNlIG93biBub2RlRW5hYmxlZFByb3BlcnR5P1xyXG4gICAgY29uc3Qgb3duc0VuYWJsZWRQcm9wZXJ0eSA9ICFvcHRpb25zLm5vZGVFbmFibGVkUHJvcGVydHk7XHJcblxyXG4gICAgdGhpcy5ub2RlRW5hYmxlZFByb3BlcnR5ID0gb3B0aW9ucy5ub2RlRW5hYmxlZFByb3BlcnR5IHx8IG5ldyBCb29sZWFuUHJvcGVydHkoIHRydWUgKTtcclxuXHJcbiAgICB0aGlzLmhvc2VBdHRhY2htZW50T2Zmc2V0ID0gb3B0aW9ucy5ob3NlQXR0YWNobWVudE9mZnNldDtcclxuXHJcbiAgICAvLyBjcmVhdGUgdGhlIGJhc2Ugb2YgdGhlIHB1bXBcclxuICAgIGNvbnN0IGJhc2VXaWR0aCA9IHdpZHRoICogUFVNUF9CQVNFX1dJRFRIX1BST1BPUlRJT047XHJcbiAgICBjb25zdCBiYXNlSGVpZ2h0ID0gaGVpZ2h0ICogUFVNUF9CQVNFX0hFSUdIVF9QUk9QT1JUSU9OO1xyXG4gICAgY29uc3QgYmFzZUZpbGxDb2xvclByb3BlcnR5ID0gbmV3IFBhaW50Q29sb3JQcm9wZXJ0eSggb3B0aW9ucy5iYXNlRmlsbCApO1xyXG4gICAgY29uc3QgcHVtcEJhc2VOb2RlID0gY3JlYXRlUHVtcEJhc2VOb2RlKCBiYXNlV2lkdGgsIGJhc2VIZWlnaHQsIGJhc2VGaWxsQ29sb3JQcm9wZXJ0eSApO1xyXG5cclxuICAgIC8vIHNpemluZyBmb3IgdGhlIGJvZHkgb2YgdGhlIHB1bXBcclxuICAgIGNvbnN0IHB1bXBCb2R5V2lkdGggPSB3aWR0aCAqIFBVTVBfQk9EWV9XSURUSF9QUk9QT1JUSU9OO1xyXG4gICAgY29uc3QgcHVtcEJvZHlIZWlnaHQgPSBoZWlnaHQgKiBQVU1QX0JPRFlfSEVJR0hUX1BST1BPUlRJT047XHJcblxyXG4gICAgLy8gY3JlYXRlIHRoZSBjb25lXHJcbiAgICBjb25zdCBjb25lSGVpZ2h0ID0gaGVpZ2h0ICogQ09ORV9IRUlHSFRfUFJPUE9SVElPTjtcclxuICAgIGNvbnN0IGNvbmVOb2RlID0gY3JlYXRlQ29uZU5vZGUoIHB1bXBCb2R5V2lkdGgsIGNvbmVIZWlnaHQsIGJhc2VGaWxsQ29sb3JQcm9wZXJ0eSApO1xyXG4gICAgY29uZU5vZGUuYm90dG9tID0gcHVtcEJhc2VOb2RlLnRvcCArIDg7XHJcblxyXG4gICAgLy8gdXNlIFBhaW50Q29sb3JQcm9wZXJ0eSBzbyB0aGF0IGNvbG9ycyBjYW4gYmUgdXBkYXRlZCBkeW5hbWljYWxseVxyXG4gICAgY29uc3QgYm9keUZpbGxDb2xvclByb3BlcnR5ID0gbmV3IFBhaW50Q29sb3JQcm9wZXJ0eSggb3B0aW9ucy5ib2R5RmlsbCApO1xyXG4gICAgY29uc3QgYm9keUZpbGxCcmlnaHRlckNvbG9yUHJvcGVydHkgPSBuZXcgUGFpbnRDb2xvclByb3BlcnR5KCBib2R5RmlsbENvbG9yUHJvcGVydHksIHsgbHVtaW5hbmNlRmFjdG9yOiAwLjIgfSApO1xyXG4gICAgY29uc3QgYm9keUZpbGxEYXJrZXJDb2xvclByb3BlcnR5ID0gbmV3IFBhaW50Q29sb3JQcm9wZXJ0eSggYm9keUZpbGxDb2xvclByb3BlcnR5LCB7IGx1bWluYW5jZUZhY3RvcjogLTAuMiB9ICk7XHJcblxyXG4gICAgdGhpcy5wdW1wQm9keU5vZGUgPSBuZXcgUmVjdGFuZ2xlKCAwLCAwLCBwdW1wQm9keVdpZHRoLCBwdW1wQm9keUhlaWdodCwgMCwgMCwge1xyXG4gICAgICBmaWxsOiBuZXcgTGluZWFyR3JhZGllbnQoIDAsIDAsIHB1bXBCb2R5V2lkdGgsIDAgKVxyXG4gICAgICAgIC5hZGRDb2xvclN0b3AoIDAsIGJvZHlGaWxsQnJpZ2h0ZXJDb2xvclByb3BlcnR5IClcclxuICAgICAgICAuYWRkQ29sb3JTdG9wKCAwLjQsIGJvZHlGaWxsQ29sb3JQcm9wZXJ0eSApXHJcbiAgICAgICAgLmFkZENvbG9yU3RvcCggMC43LCBib2R5RmlsbERhcmtlckNvbG9yUHJvcGVydHkgKVxyXG4gICAgfSApO1xyXG4gICAgdGhpcy5wdW1wQm9keU5vZGUuY2VudGVyWCA9IGNvbmVOb2RlLmNlbnRlclg7XHJcbiAgICB0aGlzLnB1bXBCb2R5Tm9kZS5ib3R0b20gPSBjb25lTm9kZS50b3AgKyAxODtcclxuXHJcbiAgICAvLyB1c2UgUGFpbnRDb2xvclByb3BlcnR5IHNvIHRoYXQgY29sb3JzIGNhbiBiZSB1cGRhdGVkIGR5bmFtaWNhbGx5XHJcbiAgICBjb25zdCBib2R5VG9wRmlsbENvbG9yUHJvcGVydHkgPSBuZXcgUGFpbnRDb2xvclByb3BlcnR5KCBvcHRpb25zLmJvZHlUb3BGaWxsICk7XHJcbiAgICBjb25zdCBib2R5VG9wU3Ryb2tlQ29sb3JQcm9wZXJ0eSA9IG5ldyBQYWludENvbG9yUHJvcGVydHkoIGJvZHlUb3BGaWxsQ29sb3JQcm9wZXJ0eSwgeyBsdW1pbmFuY2VGYWN0b3I6IC0wLjMgfSApO1xyXG5cclxuICAgIC8vIGNyZWF0ZSB0aGUgYmFjayBwYXJ0IG9mIHRoZSB0b3Agb2YgdGhlIGJvZHlcclxuICAgIGNvbnN0IGJvZHlUb3BCYWNrTm9kZSA9IGNyZWF0ZUJvZHlUb3BIYWxmTm9kZSggcHVtcEJvZHlXaWR0aCwgLTEsIGJvZHlUb3BGaWxsQ29sb3JQcm9wZXJ0eSwgYm9keVRvcFN0cm9rZUNvbG9yUHJvcGVydHkgKTtcclxuICAgIGJvZHlUb3BCYWNrTm9kZS5jZW50ZXJYID0gdGhpcy5wdW1wQm9keU5vZGUuY2VudGVyWDtcclxuICAgIGJvZHlUb3BCYWNrTm9kZS5ib3R0b20gPSB0aGlzLnB1bXBCb2R5Tm9kZS50b3A7XHJcblxyXG4gICAgLy8gY3JlYXRlIHRoZSBmcm9udCBwYXJ0IG9mIHRoZSB0b3Agb2YgdGhlIGJvZHlcclxuICAgIGNvbnN0IGJvZHlUb3BGcm9udE5vZGUgPSBjcmVhdGVCb2R5VG9wSGFsZk5vZGUoIHB1bXBCb2R5V2lkdGgsIDEsIGJvZHlUb3BGaWxsQ29sb3JQcm9wZXJ0eSwgYm9keVRvcFN0cm9rZUNvbG9yUHJvcGVydHkgKTtcclxuICAgIGJvZHlUb3BGcm9udE5vZGUuY2VudGVyWCA9IHRoaXMucHVtcEJvZHlOb2RlLmNlbnRlclg7XHJcbiAgICBib2R5VG9wRnJvbnROb2RlLnRvcCA9IGJvZHlUb3BCYWNrTm9kZS5ib3R0b20gLSAwLjQ7IC8vIHR3ZWFrIHNsaWdodGx5IHRvIHByZXZlbnQgcHVtcCBib2R5IGZyb20gc2hvd2luZyB0aHJvdWdoXHJcblxyXG4gICAgLy8gY3JlYXRlIHRoZSBib3R0b20gY2FwIG9uIHRoZSBib2R5XHJcbiAgICBjb25zdCBib2R5Qm90dG9tQ2FwTm9kZSA9IG5ldyBQYXRoKCBuZXcgU2hhcGUoKS5lbGxpcHNlKCAwLCAwLCBib2R5VG9wRnJvbnROb2RlLndpZHRoICogMC41NSwgMywgMCApLCB7XHJcbiAgICAgIGZpbGw6IG5ldyBQYWludENvbG9yUHJvcGVydHkoIGJhc2VGaWxsQ29sb3JQcm9wZXJ0eSwgeyBsdW1pbmFuY2VGYWN0b3I6IC0wLjMgfSApLFxyXG4gICAgICBjZW50ZXJYOiBib2R5VG9wRnJvbnROb2RlLmNlbnRlclgsXHJcbiAgICAgIGJvdHRvbTogY29uZU5vZGUudG9wICsgNFxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIGNyZWF0ZSB0aGUgbm9kZSB0aGF0IHdpbGwgYmUgdXNlZCB0byBpbmRpY2F0ZSB0aGUgcmVtYWluaW5nIGNhcGFjaXR5XHJcbiAgICBjb25zdCByZW1haW5pbmdDYXBhY2l0eUluZGljYXRvciA9IG5ldyBTZWdtZW50ZWRCYXJHcmFwaE5vZGUoIG51bWJlclByb3BlcnR5LCByYW5nZVByb3BlcnR5LCB7XHJcbiAgICAgICAgd2lkdGg6IHB1bXBCb2R5V2lkdGggKiAwLjYsXHJcbiAgICAgICAgaGVpZ2h0OiBwdW1wQm9keUhlaWdodCAqIDAuNyxcclxuICAgICAgICBjZW50ZXJYOiB0aGlzLnB1bXBCb2R5Tm9kZS5jZW50ZXJYLFxyXG4gICAgICAgIGNlbnRlclk6ICggdGhpcy5wdW1wQm9keU5vZGUudG9wICsgY29uZU5vZGUudG9wICkgLyAyLFxyXG4gICAgICAgIG51bVNlZ21lbnRzOiAzNixcclxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IG9wdGlvbnMuaW5kaWNhdG9yQmFja2dyb3VuZEZpbGwsXHJcbiAgICAgICAgZnVsbHlMaXRJbmRpY2F0b3JDb2xvcjogb3B0aW9ucy5pbmRpY2F0b3JSZW1haW5pbmdGaWxsLFxyXG4gICAgICAgIGluZGljYXRvckhlaWdodFByb3BvcnRpb246IDAuN1xyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIHdoZXRoZXIgdGhlIGhvc2Ugc2hvdWxkIGJlIGF0dGFjaGVkIHRvIHRoZSBsZWZ0IG9yIHJpZ2h0IHNpZGUgb2YgdGhlIHB1bXAgY29uZVxyXG4gICAgY29uc3QgaG9zZUF0dGFjaGVkT25SaWdodCA9IG9wdGlvbnMuaG9zZUF0dGFjaG1lbnRPZmZzZXQueCA+IDA7XHJcbiAgICBjb25zdCBob3NlQ29ubmVjdG9yV2lkdGggPSB3aWR0aCAqIEhPU0VfQ09OTkVDVE9SX1dJRFRIX1BST1BPUlRJT047XHJcbiAgICBjb25zdCBob3NlQ29ubmVjdG9ySGVpZ2h0ID0gaGVpZ2h0ICogSE9TRV9DT05ORUNUT1JfSEVJR0hUX1BST1BPUlRJT047XHJcblxyXG4gICAgLy8gY3JlYXRlIHRoZSBob3NlXHJcbiAgICBjb25zdCBob3NlTm9kZSA9IG5ldyBQYXRoKCBuZXcgU2hhcGUoKVxyXG4gICAgICAubW92ZVRvKCBob3NlQXR0YWNoZWRPblJpZ2h0ID8gQk9EWV9UT19IT1NFX0FUVEFDSF9QT0lOVF9YIDogLUJPRFlfVE9fSE9TRV9BVFRBQ0hfUE9JTlRfWCxcclxuICAgICAgICBCT0RZX1RPX0hPU0VfQVRUQUNIX1BPSU5UX1kgKVxyXG4gICAgICAuY3ViaWNDdXJ2ZVRvKCBvcHRpb25zLmhvc2VDdXJ2aW5lc3MgKiAoIG9wdGlvbnMuaG9zZUF0dGFjaG1lbnRPZmZzZXQueCAtIEJPRFlfVE9fSE9TRV9BVFRBQ0hfUE9JTlRfWCApLFxyXG4gICAgICAgIEJPRFlfVE9fSE9TRV9BVFRBQ0hfUE9JTlRfWSxcclxuICAgICAgICAwLCBvcHRpb25zLmhvc2VBdHRhY2htZW50T2Zmc2V0LnksXHJcbiAgICAgICAgb3B0aW9ucy5ob3NlQXR0YWNobWVudE9mZnNldC54IC0gKCBob3NlQXR0YWNoZWRPblJpZ2h0ID8gaG9zZUNvbm5lY3RvcldpZHRoIDogLWhvc2VDb25uZWN0b3JXaWR0aCApLFxyXG4gICAgICAgIG9wdGlvbnMuaG9zZUF0dGFjaG1lbnRPZmZzZXQueSApLCB7XHJcbiAgICAgIGxpbmVXaWR0aDogNCxcclxuICAgICAgc3Ryb2tlOiBvcHRpb25zLmhvc2VGaWxsXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gY3JlYXRlIHRoZSBleHRlcm5hbCBob3NlIGNvbm5lY3Rvciwgd2hpY2ggY29ubmVjdHMgdGhlIGhvc2UgdG8gYW4gZXh0ZXJuYWwgcG9pbnRcclxuICAgIGNvbnN0IGV4dGVybmFsSG9zZUNvbm5lY3RvciA9IGNyZWF0ZUhvc2VDb25uZWN0b3JOb2RlKCBob3NlQ29ubmVjdG9yV2lkdGgsIGhvc2VDb25uZWN0b3JIZWlnaHQsIGJhc2VGaWxsQ29sb3JQcm9wZXJ0eSApO1xyXG4gICAgZXh0ZXJuYWxIb3NlQ29ubmVjdG9yLnNldFRyYW5zbGF0aW9uKFxyXG4gICAgICBob3NlQXR0YWNoZWRPblJpZ2h0ID8gb3B0aW9ucy5ob3NlQXR0YWNobWVudE9mZnNldC54IC0gZXh0ZXJuYWxIb3NlQ29ubmVjdG9yLndpZHRoIDogb3B0aW9ucy5ob3NlQXR0YWNobWVudE9mZnNldC54LFxyXG4gICAgICBvcHRpb25zLmhvc2VBdHRhY2htZW50T2Zmc2V0LnkgLSBleHRlcm5hbEhvc2VDb25uZWN0b3IuaGVpZ2h0IC8gMlxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBjcmVhdGUgdGhlIGxvY2FsIGhvc2UgY29ubmVjdG9yLCB3aGljaCBjb25uZWN0cyB0aGUgaG9zZSB0byB0aGUgY29uZVxyXG4gICAgY29uc3QgbG9jYWxIb3NlQ29ubmVjdG9yID0gY3JlYXRlSG9zZUNvbm5lY3Rvck5vZGUoIGhvc2VDb25uZWN0b3JXaWR0aCwgaG9zZUNvbm5lY3RvckhlaWdodCwgYmFzZUZpbGxDb2xvclByb3BlcnR5ICk7XHJcbiAgICBjb25zdCBsb2NhbEhvc2VPZmZzZXRYID0gaG9zZUF0dGFjaGVkT25SaWdodCA/IEJPRFlfVE9fSE9TRV9BVFRBQ0hfUE9JTlRfWCA6IC1CT0RZX1RPX0hPU0VfQVRUQUNIX1BPSU5UX1g7XHJcbiAgICBsb2NhbEhvc2VDb25uZWN0b3Iuc2V0VHJhbnNsYXRpb24oXHJcbiAgICAgIGxvY2FsSG9zZU9mZnNldFggLSBob3NlQ29ubmVjdG9yV2lkdGggLyAyLFxyXG4gICAgICBCT0RZX1RPX0hPU0VfQVRUQUNIX1BPSU5UX1kgLSBsb2NhbEhvc2VDb25uZWN0b3IuaGVpZ2h0IC8gMlxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBzaXppbmcgZm9yIHRoZSBwdW1wIHNoYWZ0XHJcbiAgICBjb25zdCBwdW1wU2hhZnRXaWR0aCA9IHdpZHRoICogUFVNUF9TSEFGVF9XSURUSF9QUk9QT1JUSU9OO1xyXG4gICAgY29uc3QgcHVtcFNoYWZ0SGVpZ2h0ID0gaGVpZ2h0ICogUFVNUF9TSEFGVF9IRUlHSFRfUFJPUE9SVElPTjtcclxuXHJcbiAgICAvLyB1c2UgUGFpbnRDb2xvclByb3BlcnR5IHNvIHRoYXQgY29sb3JzIGNhbiBiZSB1cGRhdGVkIGR5bmFtaWNhbGx5XHJcbiAgICBjb25zdCBzaGFmdEZpbGxDb2xvclByb3BlcnR5ID0gbmV3IFBhaW50Q29sb3JQcm9wZXJ0eSggb3B0aW9ucy5zaGFmdEZpbGwgKTtcclxuICAgIGNvbnN0IHNoYWZ0U3Ryb2tlQ29sb3JQcm9wZXJ0eSA9IG5ldyBQYWludENvbG9yUHJvcGVydHkoIHNoYWZ0RmlsbENvbG9yUHJvcGVydHksIHsgbHVtaW5hbmNlRmFjdG9yOiAtMC4zOCB9ICk7XHJcblxyXG4gICAgLy8gY3JlYXRlIHRoZSBwdW1wIHNoYWZ0LCB3aGljaCBpcyB0aGUgcGFydCBiZWxvdyB0aGUgaGFuZGxlIGFuZCBpbnNpZGUgdGhlIGJvZHlcclxuICAgIHRoaXMucHVtcFNoYWZ0Tm9kZSA9IG5ldyBSZWN0YW5nbGUoIDAsIDAsIHB1bXBTaGFmdFdpZHRoLCBwdW1wU2hhZnRIZWlnaHQsIHtcclxuICAgICAgZmlsbDogc2hhZnRGaWxsQ29sb3JQcm9wZXJ0eSxcclxuICAgICAgc3Ryb2tlOiBzaGFmdFN0cm9rZUNvbG9yUHJvcGVydHksXHJcbiAgICAgIHBpY2thYmxlOiBmYWxzZVxyXG4gICAgfSApO1xyXG4gICAgdGhpcy5wdW1wU2hhZnROb2RlLnggPSAtcHVtcFNoYWZ0V2lkdGggLyAyO1xyXG5cclxuICAgIC8vIGNyZWF0ZSB0aGUgaGFuZGxlIG9mIHRoZSBwdW1wXHJcbiAgICB0aGlzLnB1bXBIYW5kbGVOb2RlID0gbmV3IFB1bXBIYW5kbGVOb2RlKCBvcHRpb25zLmhhbmRsZUZpbGwgKTtcclxuICAgIGNvbnN0IHB1bXBIYW5kbGVIZWlnaHQgPSBoZWlnaHQgKiBQVU1QX0hBTkRMRV9IRUlHSFRfUFJPUE9SVElPTjtcclxuICAgIHRoaXMucHVtcEhhbmRsZU5vZGUudG91Y2hBcmVhID1cclxuICAgICAgdGhpcy5wdW1wSGFuZGxlTm9kZS5sb2NhbEJvdW5kcy5kaWxhdGVkWFkoIG9wdGlvbnMuaGFuZGxlVG91Y2hBcmVhWERpbGF0aW9uLCBvcHRpb25zLmhhbmRsZVRvdWNoQXJlYVlEaWxhdGlvbiApO1xyXG4gICAgdGhpcy5wdW1wSGFuZGxlTm9kZS5tb3VzZUFyZWEgPVxyXG4gICAgICB0aGlzLnB1bXBIYW5kbGVOb2RlLmxvY2FsQm91bmRzLmRpbGF0ZWRYWSggb3B0aW9ucy5oYW5kbGVNb3VzZUFyZWFYRGlsYXRpb24sIG9wdGlvbnMuaGFuZGxlTW91c2VBcmVhWURpbGF0aW9uICk7XHJcbiAgICB0aGlzLnB1bXBIYW5kbGVOb2RlLnNjYWxlKCBwdW1wSGFuZGxlSGVpZ2h0IC8gdGhpcy5wdW1wSGFuZGxlTm9kZS5oZWlnaHQgKTtcclxuICAgIHRoaXMuc2V0UHVtcEhhbmRsZVRvSW5pdGlhbFBvc2l0aW9uKCk7XHJcblxyXG4gICAgLy8gZW5hYmxlL2Rpc2FibGUgYmVoYXZpb3IgYW5kIGFwcGVhcmFuY2UgZm9yIHRoZSBoYW5kbGVcclxuICAgIGNvbnN0IGVuYWJsZWRMaXN0ZW5lciA9ICggZW5hYmxlZDogYm9vbGVhbiApID0+IHtcclxuICAgICAgdGhpcy5wdW1wSGFuZGxlTm9kZS5pbnRlcnJ1cHRTdWJ0cmVlSW5wdXQoKTtcclxuICAgICAgdGhpcy5wdW1wSGFuZGxlTm9kZS5waWNrYWJsZSA9IGVuYWJsZWQ7XHJcbiAgICAgIHRoaXMucHVtcEhhbmRsZU5vZGUuY3Vyc29yID0gZW5hYmxlZCA/IG9wdGlvbnMuaGFuZGxlQ3Vyc29yIDogJ2RlZmF1bHQnO1xyXG4gICAgICB0aGlzLnB1bXBIYW5kbGVOb2RlLm9wYWNpdHkgPSBlbmFibGVkID8gMSA6IFNjZW5lcnlDb25zdGFudHMuRElTQUJMRURfT1BBQ0lUWTtcclxuICAgICAgdGhpcy5wdW1wU2hhZnROb2RlLm9wYWNpdHkgPSBlbmFibGVkID8gMSA6IFNjZW5lcnlDb25zdGFudHMuRElTQUJMRURfT1BBQ0lUWTtcclxuICAgIH07XHJcbiAgICB0aGlzLm5vZGVFbmFibGVkUHJvcGVydHkubGluayggZW5hYmxlZExpc3RlbmVyICk7XHJcblxyXG4gICAgLy8gZGVmaW5lIHRoZSBhbGxvd2VkIHJhbmdlIGZvciB0aGUgcHVtcCBoYW5kbGUncyBtb3ZlbWVudFxyXG4gICAgY29uc3QgbWF4SGFuZGxlWU9mZnNldCA9IHRoaXMucHVtcEhhbmRsZU5vZGUuY2VudGVyWTtcclxuICAgIGNvbnN0IG1pbkhhbmRsZVlPZmZzZXQgPSBtYXhIYW5kbGVZT2Zmc2V0ICsgKCAtUFVNUF9TSEFGVF9IRUlHSFRfUFJPUE9SVElPTiAqIHB1bXBCb2R5SGVpZ2h0ICk7XHJcblxyXG4gICAgdGhpcy5kcmFnRGVsZWdhdGUgPSBuZXcgRHJhZ0RlbGVnYXRlKCBudW1iZXJQcm9wZXJ0eSwgcmFuZ2VQcm9wZXJ0eSwgdGhpcy5ub2RlRW5hYmxlZFByb3BlcnR5LFxyXG4gICAgICBvcHRpb25zLmluamVjdGlvbkVuYWJsZWRQcm9wZXJ0eSwgbWluSGFuZGxlWU9mZnNldCwgbWF4SGFuZGxlWU9mZnNldCwgdGhpcy5wdW1wSGFuZGxlTm9kZSwgdGhpcy5wdW1wU2hhZnROb2RlLCB7XHJcbiAgICAgICAgbnVtYmVyT2ZQYXJ0aWNsZXNQZXJQdW1wQWN0aW9uOiBvcHRpb25zLm51bWJlck9mUGFydGljbGVzUGVyUHVtcEFjdGlvbixcclxuICAgICAgICBhZGRQYXJ0aWNsZXNPbmVBdEFUaW1lOiBvcHRpb25zLmFkZFBhcnRpY2xlc09uZUF0QVRpbWVcclxuICAgICAgfSApO1xyXG5cclxuICAgIC8vIERyYWcgdGhlIHB1bXAgaGFuZGxlIHVzaW5nIG1vdXNlL3RvdWNoLlxyXG4gICAgdGhpcy5kcmFnTGlzdGVuZXIgPSBuZXcgUmljaERyYWdMaXN0ZW5lciggY29tYmluZU9wdGlvbnM8UmljaERyYWdMaXN0ZW5lck9wdGlvbnM+KCB7XHJcbiAgICAgIGRyYWc6ICggZXZlbnQ6IFByZXNzTGlzdGVuZXJFdmVudCApID0+IHtcclxuXHJcbiAgICAgICAgLy8gVXBkYXRlIHRoZSBoYW5kbGUgcG9zaXRpb24gYmFzZWQgb24gdGhlIHVzZXIncyBwb2ludGVyIHBvc2l0aW9uLlxyXG4gICAgICAgIGNvbnN0IGRyYWdQb3NpdGlvblkgPSB0aGlzLnB1bXBIYW5kbGVOb2RlLmdsb2JhbFRvUGFyZW50UG9pbnQoIGV2ZW50LnBvaW50ZXIucG9pbnQgKS55O1xyXG4gICAgICAgIGNvbnN0IGhhbmRsZVBvc2l0aW9uID0gVXRpbHMuY2xhbXAoIGRyYWdQb3NpdGlvblksIG1pbkhhbmRsZVlPZmZzZXQsIG1heEhhbmRsZVlPZmZzZXQgKTtcclxuICAgICAgICB0aGlzLmRyYWdEZWxlZ2F0ZS5oYW5kbGVEcmFnKCBoYW5kbGVQb3NpdGlvbiApO1xyXG4gICAgICB9LFxyXG4gICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ2RyYWdMaXN0ZW5lcicgKVxyXG4gICAgfSwgb3B0aW9ucy5kcmFnTGlzdGVuZXJPcHRpb25zICkgKTtcclxuICAgIHRoaXMucHVtcEhhbmRsZU5vZGUuYWRkSW5wdXRMaXN0ZW5lciggdGhpcy5kcmFnTGlzdGVuZXIgKTtcclxuXHJcbiAgICAvLyBEcmFnIHRoZSBwdW1wIGhhbmRsZSB1c2luZyB0aGUga2V5Ym9hcmQuXHJcbiAgICB0aGlzLmtleWJvYXJkRHJhZ0xpc3RlbmVyID0gbmV3IFJpY2hLZXlib2FyZERyYWdMaXN0ZW5lciggY29tYmluZU9wdGlvbnM8UmljaEtleWJvYXJkRHJhZ0xpc3RlbmVyT3B0aW9ucz4oIHtcclxuICAgICAga2V5Ym9hcmREcmFnRGlyZWN0aW9uOiAndXBEb3duJyxcclxuICAgICAgZHJhZ1NwZWVkOiAyMDAsXHJcbiAgICAgIHNoaWZ0RHJhZ1NwZWVkOiA1MCxcclxuICAgICAgZHJhZzogKCBldmVudCwgbGlzdGVuZXIgKSA9PiB7XHJcbiAgICAgICAgY29uc3QgaGFuZGxlUG9zaXRpb24gPSBVdGlscy5jbGFtcCggdGhpcy5wdW1wSGFuZGxlTm9kZS5jZW50ZXJZICsgbGlzdGVuZXIudmVjdG9yRGVsdGEueSwgbWluSGFuZGxlWU9mZnNldCwgbWF4SGFuZGxlWU9mZnNldCApO1xyXG4gICAgICAgIHRoaXMuZHJhZ0RlbGVnYXRlLmhhbmRsZURyYWcoIGhhbmRsZVBvc2l0aW9uICk7XHJcbiAgICAgIH0sXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAna2V5Ym9hcmREcmFnTGlzdGVuZXInIClcclxuICAgIH0sIG9wdGlvbnMua2V5Ym9hcmREcmFnTGlzdGVuZXJPcHRpb25zICkgKTtcclxuICAgIHRoaXMucHVtcEhhbmRsZU5vZGUuYWRkSW5wdXRMaXN0ZW5lciggdGhpcy5rZXlib2FyZERyYWdMaXN0ZW5lciApO1xyXG5cclxuICAgIC8vIGFkZCB0aGUgcGllY2VzIHdpdGggdGhlIGNvcnJlY3QgbGF5ZXJpbmdcclxuICAgIHRoaXMuYWRkQ2hpbGQoIHB1bXBCYXNlTm9kZSApO1xyXG4gICAgdGhpcy5hZGRDaGlsZCggYm9keVRvcEJhY2tOb2RlICk7XHJcbiAgICB0aGlzLmFkZENoaWxkKCBib2R5Qm90dG9tQ2FwTm9kZSApO1xyXG4gICAgdGhpcy5hZGRDaGlsZCggdGhpcy5wdW1wU2hhZnROb2RlICk7XHJcbiAgICB0aGlzLmFkZENoaWxkKCB0aGlzLnB1bXBIYW5kbGVOb2RlICk7XHJcbiAgICB0aGlzLmFkZENoaWxkKCB0aGlzLnB1bXBCb2R5Tm9kZSApO1xyXG4gICAgdGhpcy5hZGRDaGlsZCggcmVtYWluaW5nQ2FwYWNpdHlJbmRpY2F0b3IgKTtcclxuICAgIHRoaXMuYWRkQ2hpbGQoIGJvZHlUb3BGcm9udE5vZGUgKTtcclxuICAgIHRoaXMuYWRkQ2hpbGQoIGNvbmVOb2RlICk7XHJcbiAgICB0aGlzLmFkZENoaWxkKCBob3NlTm9kZSApO1xyXG4gICAgdGhpcy5hZGRDaGlsZCggZXh0ZXJuYWxIb3NlQ29ubmVjdG9yICk7XHJcbiAgICB0aGlzLmFkZENoaWxkKCBsb2NhbEhvc2VDb25uZWN0b3IgKTtcclxuXHJcbiAgICAvLyBXaXRoID9kZXYgcXVlcnkgcGFyYW1ldGVyLCBwbGFjZSBhIHJlZCBkb3QgYXQgdGhlIG9yaWdpbi5cclxuICAgIGlmICggcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5kZXYgKSB7XHJcbiAgICAgIHRoaXMuYWRkQ2hpbGQoIG5ldyBDaXJjbGUoIDIsIHsgZmlsbDogJ3JlZCcgfSApICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc3VwcG9ydCBmb3IgYmluZGVyIGRvY3VtZW50YXRpb24sIHN0cmlwcGVkIG91dCBpbiBidWlsZHMgYW5kIG9ubHkgcnVucyB3aGVuID9iaW5kZXIgaXMgc3BlY2lmaWVkXHJcbiAgICBhc3NlcnQgJiYgcGhldD8uY2hpcHBlcj8ucXVlcnlQYXJhbWV0ZXJzPy5iaW5kZXIgJiYgSW5zdGFuY2VSZWdpc3RyeS5yZWdpc3RlckRhdGFVUkwoICdzY2VuZXJ5LXBoZXQnLCAnQmljeWNsZVB1bXBOb2RlJywgdGhpcyApO1xyXG5cclxuICAgIHRoaXMuZGlzcG9zZUJpY3ljbGVQdW1wTm9kZSA9ICgpID0+IHtcclxuXHJcbiAgICAgIC8vIERyYWcgbGlzdGVuZXJzIGFyZSByZWdpc3RlcmVkIHdpdGggUGhFVC1pTywgc28gdGhleSBuZWVkIHRvIGJlIGRpc3Bvc2VkLlxyXG4gICAgICB0aGlzLmRyYWdMaXN0ZW5lci5kaXNwb3NlKCk7XHJcbiAgICAgIHRoaXMua2V5Ym9hcmREcmFnTGlzdGVuZXIuZGlzcG9zZSgpO1xyXG5cclxuICAgICAgLy8gQ2xlYW4gdXAgbm9kZUVuYWJsZWRQcm9wZXJ0eSBhcHByb3ByaWF0ZWx5LCBkZXBlbmRpbmcgb24gd2hldGhlciB3ZSBjcmVhdGVkIGl0LCBvciBpdCB3YXMgcHJvdmlkZWQgdG8gdXMuXHJcbiAgICAgIGlmICggb3duc0VuYWJsZWRQcm9wZXJ0eSApIHtcclxuICAgICAgICB0aGlzLm5vZGVFbmFibGVkUHJvcGVydHkuZGlzcG9zZSgpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCB0aGlzLm5vZGVFbmFibGVkUHJvcGVydHkuaGFzTGlzdGVuZXIoIGVuYWJsZWRMaXN0ZW5lciApICkge1xyXG4gICAgICAgIHRoaXMubm9kZUVuYWJsZWRQcm9wZXJ0eS51bmxpbmsoIGVuYWJsZWRMaXN0ZW5lciApO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyBoYW5kbGUgYW5kIHNoYWZ0IHRvIHRoZWlyIGluaXRpYWwgcG9zaXRpb24uXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBzZXRQdW1wSGFuZGxlVG9Jbml0aWFsUG9zaXRpb24oKTogdm9pZCB7XHJcbiAgICB0aGlzLnB1bXBIYW5kbGVOb2RlLmJvdHRvbSA9IHRoaXMucHVtcEJvZHlOb2RlLnRvcCAtIDE4OyAvLyBlbXBpcmljYWxseSBkZXRlcm1pbmVkXHJcbiAgICB0aGlzLnB1bXBTaGFmdE5vZGUudG9wID0gdGhpcy5wdW1wSGFuZGxlTm9kZS5ib3R0b207XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVzZXQoKTogdm9pZCB7XHJcbiAgICB0aGlzLnNldFB1bXBIYW5kbGVUb0luaXRpYWxQb3NpdGlvbigpO1xyXG4gICAgdGhpcy5kcmFnRGVsZWdhdGUucmVzZXQoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5kaXNwb3NlQmljeWNsZVB1bXBOb2RlKCk7XHJcbiAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogRHJhd3MgdGhlIGJhc2Ugb2YgdGhlIHB1bXAuIE1hbnkgb2YgdGhlIG11bHRpcGxpZXJzIGFuZCBwb2ludCBwb3NpdGlvbnMgd2VyZSBhcnJpdmVkIGF0IGVtcGlyaWNhbGx5LlxyXG4gKlxyXG4gKiBAcGFyYW0gd2lkdGggLSB0aGUgd2lkdGggb2YgdGhlIGJhc2VcclxuICogQHBhcmFtIGhlaWdodCAtIHRoZSBoZWlnaHQgb2YgdGhlIGJhc2VcclxuICogQHBhcmFtIGZpbGxcclxuICovXHJcbmZ1bmN0aW9uIGNyZWF0ZVB1bXBCYXNlTm9kZSggd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGZpbGw6IFRDb2xvciApOiBOb2RlIHtcclxuXHJcbiAgLy8gM0QgZWZmZWN0IGlzIGJlaW5nIHVzZWQsIHNvIG1vc3Qgb2YgdGhlIGhlaWdodCBtYWtlcyB1cCB0aGUgc3VyZmFjZVxyXG4gIGNvbnN0IHRvcE9mQmFzZUhlaWdodCA9IGhlaWdodCAqIDAuNztcclxuICBjb25zdCBoYWxmT2ZCYXNlV2lkdGggPSB3aWR0aCAvIDI7XHJcblxyXG4gIC8vIHVzZSBQYWludENvbG9yUHJvcGVydHkgc28gdGhhdCBjb2xvcnMgY2FuIGJlIHVwZGF0ZWQgZHluYW1pY2FsbHlcclxuICBjb25zdCBiYXNlRmlsbEJyaWdodGVyQ29sb3JQcm9wZXJ0eSA9IG5ldyBQYWludENvbG9yUHJvcGVydHkoIGZpbGwsIHsgbHVtaW5hbmNlRmFjdG9yOiAwLjA1IH0gKTtcclxuICBjb25zdCBiYXNlRmlsbERhcmtlckNvbG9yUHJvcGVydHkgPSBuZXcgUGFpbnRDb2xvclByb3BlcnR5KCBmaWxsLCB7IGx1bWluYW5jZUZhY3RvcjogLTAuMiB9ICk7XHJcbiAgY29uc3QgYmFzZUZpbGxEYXJrZXN0Q29sb3JQcm9wZXJ0eSA9IG5ldyBQYWludENvbG9yUHJvcGVydHkoIGZpbGwsIHsgbHVtaW5hbmNlRmFjdG9yOiAtMC40IH0gKTtcclxuXHJcbiAgLy8gcm91bmRlZCByZWN0YW5nbGUgdGhhdCBpcyB0aGUgdG9wIG9mIHRoZSBiYXNlXHJcbiAgY29uc3QgdG9wT2ZCYXNlTm9kZSA9IG5ldyBSZWN0YW5nbGUoIC1oYWxmT2ZCYXNlV2lkdGgsIC10b3BPZkJhc2VIZWlnaHQgLyAyLCB3aWR0aCwgdG9wT2ZCYXNlSGVpZ2h0LCAyMCwgMjAsIHtcclxuICAgIGZpbGw6IG5ldyBMaW5lYXJHcmFkaWVudCggLWhhbGZPZkJhc2VXaWR0aCwgMCwgaGFsZk9mQmFzZVdpZHRoLCAwIClcclxuICAgICAgLmFkZENvbG9yU3RvcCggMCwgYmFzZUZpbGxCcmlnaHRlckNvbG9yUHJvcGVydHkgKVxyXG4gICAgICAuYWRkQ29sb3JTdG9wKCAwLjUsIGZpbGwgKVxyXG4gICAgICAuYWRkQ29sb3JTdG9wKCAxLCBiYXNlRmlsbERhcmtlckNvbG9yUHJvcGVydHkgKVxyXG4gIH0gKTtcclxuXHJcbiAgY29uc3QgcHVtcEJhc2VFZGdlSGVpZ2h0ID0gaGVpZ2h0ICogMC42NTtcclxuICBjb25zdCBwdW1wQmFzZVNpZGVFZGdlWUNvbnRyb2xQb2ludCA9IHB1bXBCYXNlRWRnZUhlaWdodCAqIDEuMDU7XHJcbiAgY29uc3QgcHVtcEJhc2VCb3R0b21FZGdlWEN1cnZlU3RhcnQgPSB3aWR0aCAqIDAuMzU7XHJcblxyXG4gIC8vIHRoZSBmcm9udCBlZGdlIG9mIHRoZSBwdW1wIGJhc2UsIGRyYXcgY291bnRlci1jbG9ja3dpc2Ugc3RhcnRpbmcgYXQgbGVmdCBlZGdlXHJcbiAgY29uc3QgcHVtcEVkZ2VTaGFwZSA9IG5ldyBTaGFwZSgpXHJcbiAgICAubGluZVRvKCAtaGFsZk9mQmFzZVdpZHRoLCAwIClcclxuICAgIC5saW5lVG8oIC1oYWxmT2ZCYXNlV2lkdGgsIHB1bXBCYXNlRWRnZUhlaWdodCAvIDIgKVxyXG4gICAgLnF1YWRyYXRpY0N1cnZlVG8oIC1oYWxmT2ZCYXNlV2lkdGgsIHB1bXBCYXNlU2lkZUVkZ2VZQ29udHJvbFBvaW50LCAtcHVtcEJhc2VCb3R0b21FZGdlWEN1cnZlU3RhcnQsIHB1bXBCYXNlRWRnZUhlaWdodCApXHJcbiAgICAubGluZVRvKCBwdW1wQmFzZUJvdHRvbUVkZ2VYQ3VydmVTdGFydCwgcHVtcEJhc2VFZGdlSGVpZ2h0IClcclxuICAgIC5xdWFkcmF0aWNDdXJ2ZVRvKCBoYWxmT2ZCYXNlV2lkdGgsIHB1bXBCYXNlU2lkZUVkZ2VZQ29udHJvbFBvaW50LCBoYWxmT2ZCYXNlV2lkdGgsIHB1bXBCYXNlRWRnZUhlaWdodCAvIDIgKVxyXG4gICAgLmxpbmVUbyggaGFsZk9mQmFzZVdpZHRoLCAwIClcclxuICAgIC5jbG9zZSgpO1xyXG5cclxuICAvLyBjb2xvciB0aGUgZnJvbnQgZWRnZSBvZiB0aGUgcHVtcCBiYXNlXHJcbiAgY29uc3QgcHVtcEVkZ2VOb2RlID0gbmV3IFBhdGgoIHB1bXBFZGdlU2hhcGUsIHtcclxuICAgIGZpbGw6IG5ldyBMaW5lYXJHcmFkaWVudCggLWhhbGZPZkJhc2VXaWR0aCwgMCwgaGFsZk9mQmFzZVdpZHRoLCAwIClcclxuICAgICAgLmFkZENvbG9yU3RvcCggMCwgYmFzZUZpbGxEYXJrZXN0Q29sb3JQcm9wZXJ0eSApXHJcbiAgICAgIC5hZGRDb2xvclN0b3AoIDAuMTUsIGJhc2VGaWxsRGFya2VyQ29sb3JQcm9wZXJ0eSApXHJcbiAgICAgIC5hZGRDb2xvclN0b3AoIDEsIGJhc2VGaWxsRGFya2VzdENvbG9yUHJvcGVydHkgKVxyXG4gIH0gKTtcclxuXHJcbiAgcHVtcEVkZ2VOb2RlLmNlbnRlclkgPSAtcHVtcEVkZ2VOb2RlLmhlaWdodCAvIDI7XHJcblxyXG4gIC8vIDAuNiBkZXRlcm1pbmVkIGVtcGlyaWNhbGx5IGZvciBiZXN0IHBvc2l0aW9uaW5nXHJcbiAgdG9wT2ZCYXNlTm9kZS5ib3R0b20gPSBwdW1wRWRnZU5vZGUuYm90dG9tIC0gcHVtcEJhc2VFZGdlSGVpZ2h0IC8gMiArIDAuNjtcclxuICByZXR1cm4gbmV3IE5vZGUoIHsgY2hpbGRyZW46IFsgcHVtcEVkZ2VOb2RlLCB0b3BPZkJhc2VOb2RlIF0gfSApO1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBoYWxmIG9mIHRoZSBvcGVuaW5nIGF0IHRoZSB0b3Agb2YgdGhlIHB1bXAgYm9keS4gUGFzc2luZyBpbiAtMSBmb3IgdGhlIHNpZ24gY3JlYXRlcyB0aGUgYmFjayBoYWxmLCBhbmRcclxuICogcGFzc2luZyBpbiAxIGNyZWF0ZXMgdGhlIGZyb250LlxyXG4gKi9cclxuZnVuY3Rpb24gY3JlYXRlQm9keVRvcEhhbGZOb2RlKCB3aWR0aDogbnVtYmVyLCBzaWduOiAxIHwgLTEsIGZpbGw6IFRDb2xvciwgc3Ryb2tlOiBUQ29sb3IgKTogTm9kZSB7XHJcbiAgY29uc3QgYm9keVRvcFNoYXBlID0gbmV3IFNoYXBlKClcclxuICAgIC5tb3ZlVG8oIDAsIDAgKVxyXG4gICAgLmN1YmljQ3VydmVUbyhcclxuICAgICAgMCxcclxuICAgICAgc2lnbiAqIHdpZHRoICogU0hBRlRfT1BFTklOR19USUxUX0ZBQ1RPUixcclxuICAgICAgd2lkdGgsXHJcbiAgICAgIHNpZ24gKiB3aWR0aCAqIFNIQUZUX09QRU5JTkdfVElMVF9GQUNUT1IsXHJcbiAgICAgIHdpZHRoLFxyXG4gICAgICAwXHJcbiAgICApO1xyXG5cclxuICByZXR1cm4gbmV3IFBhdGgoIGJvZHlUb3BTaGFwZSwge1xyXG4gICAgZmlsbDogZmlsbCxcclxuICAgIHN0cm9rZTogc3Ryb2tlXHJcbiAgfSApO1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIGhvc2UgY29ubmVjdG9yLiBUaGUgaG9zZSBoYXMgb25lIG9uIGVhY2ggb2YgaXRzIGVuZHMuXHJcbiAqL1xyXG5mdW5jdGlvbiBjcmVhdGVIb3NlQ29ubmVjdG9yTm9kZSggd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGZpbGw6IFRDb2xvciApOiBOb2RlIHtcclxuXHJcbiAgLy8gdXNlIFBhaW50Q29sb3JQcm9wZXJ0eSBzbyB0aGF0IGNvbG9ycyBjYW4gYmUgdXBkYXRlZCBkeW5hbWljYWxseVxyXG4gIGNvbnN0IGZpbGxCcmlnaHRlckNvbG9yUHJvcGVydHkgPSBuZXcgUGFpbnRDb2xvclByb3BlcnR5KCBmaWxsLCB7IGx1bWluYW5jZUZhY3RvcjogMC4xIH0gKTtcclxuICBjb25zdCBmaWxsRGFya2VyQ29sb3JQcm9wZXJ0eSA9IG5ldyBQYWludENvbG9yUHJvcGVydHkoIGZpbGwsIHsgbHVtaW5hbmNlRmFjdG9yOiAtMC4yIH0gKTtcclxuICBjb25zdCBmaWxsRGFya2VzdENvbG9yUHJvcGVydHkgPSBuZXcgUGFpbnRDb2xvclByb3BlcnR5KCBmaWxsLCB7IGx1bWluYW5jZUZhY3RvcjogLTAuNCB9ICk7XHJcblxyXG4gIHJldHVybiBuZXcgUmVjdGFuZ2xlKCAwLCAwLCB3aWR0aCwgaGVpZ2h0LCAyLCAyLCB7XHJcbiAgICBmaWxsOiBuZXcgTGluZWFyR3JhZGllbnQoIDAsIDAsIDAsIGhlaWdodCApXHJcbiAgICAgIC5hZGRDb2xvclN0b3AoIDAsIGZpbGxEYXJrZXJDb2xvclByb3BlcnR5IClcclxuICAgICAgLmFkZENvbG9yU3RvcCggMC4zLCBmaWxsIClcclxuICAgICAgLmFkZENvbG9yU3RvcCggMC4zNSwgZmlsbEJyaWdodGVyQ29sb3JQcm9wZXJ0eSApXHJcbiAgICAgIC5hZGRDb2xvclN0b3AoIDAuNCwgZmlsbEJyaWdodGVyQ29sb3JQcm9wZXJ0eSApXHJcbiAgICAgIC5hZGRDb2xvclN0b3AoIDEsIGZpbGxEYXJrZXN0Q29sb3JQcm9wZXJ0eSApXHJcbiAgfSApO1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyB0aGUgY29uZSwgd2hpY2ggY29ubmVjdHMgdGhlIHB1bXAgYmFzZSB0byB0aGUgcHVtcCBib2R5LlxyXG4gKiBAcGFyYW0gcHVtcEJvZHlXaWR0aCAtIHRoZSB3aWR0aCBvZiB0aGUgcHVtcCBib2R5IChub3QgcXVpdGUgYXMgd2lkZSBhcyB0aGUgdG9wIG9mIHRoZSBjb25lKVxyXG4gKiBAcGFyYW0gaGVpZ2h0XHJcbiAqIEBwYXJhbSBmaWxsXHJcbiAqL1xyXG5mdW5jdGlvbiBjcmVhdGVDb25lTm9kZSggcHVtcEJvZHlXaWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgZmlsbDogVENvbG9yICk6IE5vZGUge1xyXG4gIGNvbnN0IGNvbmVUb3BXaWR0aCA9IHB1bXBCb2R5V2lkdGggKiAxLjI7XHJcbiAgY29uc3QgY29uZVRvcFJhZGl1c1kgPSAzO1xyXG4gIGNvbnN0IGNvbmVUb3BSYWRpdXNYID0gY29uZVRvcFdpZHRoIC8gMjtcclxuICBjb25zdCBjb25lQm90dG9tV2lkdGggPSBwdW1wQm9keVdpZHRoICogMjtcclxuICBjb25zdCBjb25lQm90dG9tUmFkaXVzWSA9IDQ7XHJcbiAgY29uc3QgY29uZUJvdHRvbVJhZGl1c1ggPSBjb25lQm90dG9tV2lkdGggLyAyO1xyXG5cclxuICBjb25zdCBjb25lU2hhcGUgPSBuZXcgU2hhcGUoKVxyXG5cclxuICAgIC8vIHN0YXJ0IGluIHVwcGVyIHJpZ2h0IGNvcm5lciBvZiBzaGFwZSwgZHJhdyB0b3AgZWxsaXBzZSByaWdodCB0byBsZWZ0XHJcbiAgICAuZWxsaXB0aWNhbEFyYyggMCwgMCwgY29uZVRvcFJhZGl1c1gsIGNvbmVUb3BSYWRpdXNZLCAwLCAwLCBNYXRoLlBJLCBmYWxzZSApXHJcbiAgICAubGluZVRvKCAtY29uZUJvdHRvbVJhZGl1c1gsIGhlaWdodCApIC8vIGxpbmUgdG8gYm90dG9tIGxlZnQgY29ybmVyIG9mIHNoYXBlXHJcblxyXG4gICAgLy8gZHJhdyBib3R0b20gZWxsaXBzZSBsZWZ0IHRvIHJpZ2h0XHJcbiAgICAuZWxsaXB0aWNhbEFyYyggMCwgaGVpZ2h0LCBjb25lQm90dG9tUmFkaXVzWCwgY29uZUJvdHRvbVJhZGl1c1ksIDAsIE1hdGguUEksIDAsIHRydWUgKVxyXG4gICAgLmxpbmVUbyggY29uZVRvcFJhZGl1c1gsIDAgKTsgLy8gbGluZSB0byB1cHBlciByaWdodCBjb3JuZXIgb2Ygc2hhcGVcclxuXHJcbiAgLy8gdXNlIFBhaW50Q29sb3JQcm9wZXJ0eSBzbyB0aGF0IGNvbG9ycyBjYW4gYmUgdXBkYXRlZCBkeW5hbWljYWxseVxyXG4gIGNvbnN0IGZpbGxCcmlnaHRlckNvbG9yUHJvcGVydHkgPSBuZXcgUGFpbnRDb2xvclByb3BlcnR5KCBmaWxsLCB7IGx1bWluYW5jZUZhY3RvcjogMC4xIH0gKTtcclxuICBjb25zdCBmaWxsRGFya2VyQ29sb3JQcm9wZXJ0eSA9IG5ldyBQYWludENvbG9yUHJvcGVydHkoIGZpbGwsIHsgbHVtaW5hbmNlRmFjdG9yOiAtMC40IH0gKTtcclxuICBjb25zdCBmaWxsRGFya2VzdENvbG9yUHJvcGVydHkgPSBuZXcgUGFpbnRDb2xvclByb3BlcnR5KCBmaWxsLCB7IGx1bWluYW5jZUZhY3RvcjogLTAuNSB9ICk7XHJcblxyXG4gIGNvbnN0IGNvbmVHcmFkaWVudCA9IG5ldyBMaW5lYXJHcmFkaWVudCggLWNvbmVCb3R0b21XaWR0aCAvIDIsIDAsIGNvbmVCb3R0b21XaWR0aCAvIDIsIDAgKVxyXG4gICAgLmFkZENvbG9yU3RvcCggMCwgZmlsbERhcmtlckNvbG9yUHJvcGVydHkgKVxyXG4gICAgLmFkZENvbG9yU3RvcCggMC4zLCBmaWxsIClcclxuICAgIC5hZGRDb2xvclN0b3AoIDAuMzUsIGZpbGxCcmlnaHRlckNvbG9yUHJvcGVydHkgKVxyXG4gICAgLmFkZENvbG9yU3RvcCggMC40NSwgZmlsbEJyaWdodGVyQ29sb3JQcm9wZXJ0eSApXHJcbiAgICAuYWRkQ29sb3JTdG9wKCAwLjUsIGZpbGwgKVxyXG4gICAgLmFkZENvbG9yU3RvcCggMSwgZmlsbERhcmtlc3RDb2xvclByb3BlcnR5ICk7XHJcblxyXG4gIHJldHVybiBuZXcgUGF0aCggY29uZVNoYXBlLCB7XHJcbiAgICBmaWxsOiBjb25lR3JhZGllbnRcclxuICB9ICk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQdW1wSGFuZGxlTm9kZSBpcyB0aGUgcHVtcCdzIGhhbmRsZS5cclxuICovXHJcbmNsYXNzIFB1bXBIYW5kbGVOb2RlIGV4dGVuZHMgUGF0aCB7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBmaWxsOiBUQ29sb3IgKSB7XHJcblxyXG4gICAgLy8gZW1waXJpY2FsbHkgZGV0ZXJtaW5lZCBjb25zdGFudHNcclxuICAgIGNvbnN0IGNlbnRlclNlY3Rpb25XaWR0aCA9IDM1O1xyXG4gICAgY29uc3QgY2VudGVyQ3VydmVXaWR0aCA9IDE0O1xyXG4gICAgY29uc3QgY2VudGVyQ3VydmVIZWlnaHQgPSA4O1xyXG4gICAgY29uc3QgbnVtYmVyT2ZHcmlwQnVtcHMgPSA0O1xyXG4gICAgY29uc3QgZ3JpcFNpbmdsZUJ1bXBXaWR0aCA9IDE2O1xyXG4gICAgY29uc3QgZ3JpcFNpbmdsZUJ1bXBIYWxmV2lkdGggPSBncmlwU2luZ2xlQnVtcFdpZHRoIC8gMjtcclxuICAgIGNvbnN0IGdyaXBJbnRlckJ1bXBXaWR0aCA9IGdyaXBTaW5nbGVCdW1wV2lkdGggKiAwLjMxO1xyXG4gICAgY29uc3QgZ3JpcEVuZEhlaWdodCA9IDIzO1xyXG5cclxuICAgIC8vIHN0YXJ0IHRoZSBoYW5kbGUgZnJvbSB0aGUgY2VudGVyIGJvdHRvbSwgZHJhd2luZyBhcm91bmQgY291bnRlcmNsb2Nrd2lzZVxyXG4gICAgY29uc3QgcHVtcEhhbmRsZVNoYXBlID0gbmV3IFNoYXBlKCkubW92ZVRvKCAwLCAwICk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGQgYSBcImJ1bXBcIiB0byB0aGUgdG9wIG9yIGJvdHRvbSBvZiB0aGUgZ3JpcFxyXG4gICAgICogQHBhcmFtIHNoYXBlIC0gdGhlIHNoYXBlIHRvIGFwcGVuZCB0b1xyXG4gICAgICogQHBhcmFtIHNpZ24gLSArMSBmb3IgYm90dG9tIHNpZGUgb2YgZ3JpcCwgLTEgZm9yIHRvcCBzaWRlIG9mIGdyaXBcclxuICAgICAqL1xyXG4gICAgY29uc3QgYWRkR3JpcEJ1bXAgPSAoIHNoYXBlOiBTaGFwZSwgc2lnbjogMSB8IC0xICkgPT4ge1xyXG5cclxuICAgICAgLy8gY29udHJvbCBwb2ludHMgZm9yIHF1YWRyYXRpYyBjdXJ2ZSBzaGFwZSBvbiBncmlwXHJcbiAgICAgIGNvbnN0IGNvbnRyb2xQb2ludFggPSBncmlwU2luZ2xlQnVtcFdpZHRoIC8gMjtcclxuICAgICAgY29uc3QgY29udHJvbFBvaW50WSA9IGdyaXBTaW5nbGVCdW1wV2lkdGggLyAyO1xyXG5cclxuICAgICAgLy8gdGhpcyBpcyBhIGdyaXAgYnVtcFxyXG4gICAgICBzaGFwZS5xdWFkcmF0aWNDdXJ2ZVRvUmVsYXRpdmUoXHJcbiAgICAgICAgc2lnbiAqIGNvbnRyb2xQb2ludFgsXHJcbiAgICAgICAgc2lnbiAqIGNvbnRyb2xQb2ludFksXHJcbiAgICAgICAgc2lnbiAqIGdyaXBTaW5nbGVCdW1wV2lkdGgsXHJcbiAgICAgICAgMCApO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyB0aGlzIGlzIHRoZSBsb3dlciByaWdodCBwYXJ0IG9mIHRoZSBoYW5kbGUsIGluY2x1ZGluZyBoYWxmIG9mIHRoZSBtaWRkbGUgc2VjdGlvbiBhbmQgdGhlIGdyaXAgYnVtcHNcclxuICAgIHB1bXBIYW5kbGVTaGFwZS5saW5lVG9SZWxhdGl2ZSggY2VudGVyU2VjdGlvbldpZHRoIC8gMiwgMCApO1xyXG4gICAgcHVtcEhhbmRsZVNoYXBlLnF1YWRyYXRpY0N1cnZlVG9SZWxhdGl2ZSggY2VudGVyQ3VydmVXaWR0aCAvIDIsIDAsIGNlbnRlckN1cnZlV2lkdGgsIC1jZW50ZXJDdXJ2ZUhlaWdodCApO1xyXG4gICAgcHVtcEhhbmRsZVNoYXBlLmxpbmVUb1JlbGF0aXZlKCBncmlwSW50ZXJCdW1wV2lkdGgsIDAgKTtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IG51bWJlck9mR3JpcEJ1bXBzIC0gMTsgaSsrICkge1xyXG4gICAgICBhZGRHcmlwQnVtcCggcHVtcEhhbmRsZVNoYXBlLCAxICk7XHJcbiAgICAgIHB1bXBIYW5kbGVTaGFwZS5saW5lVG9SZWxhdGl2ZSggZ3JpcEludGVyQnVtcFdpZHRoLCAwICk7XHJcbiAgICB9XHJcbiAgICBhZGRHcmlwQnVtcCggcHVtcEhhbmRsZVNoYXBlLCAxICk7XHJcblxyXG4gICAgLy8gdGhpcyBpcyB0aGUgcmlnaHQgZWRnZSBvZiB0aGUgaGFuZGxlXHJcbiAgICBwdW1wSGFuZGxlU2hhcGUubGluZVRvUmVsYXRpdmUoIDAsIC1ncmlwRW5kSGVpZ2h0ICk7XHJcblxyXG4gICAgLy8gdGhpcyBpcyB0aGUgdXBwZXIgcmlnaHQgcGFydCBvZiB0aGUgaGFuZGxlLCBpbmNsdWRpbmcgb25seSB0aGUgZ3JpcCBidW1wc1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbnVtYmVyT2ZHcmlwQnVtcHM7IGkrKyApIHtcclxuICAgICAgYWRkR3JpcEJ1bXAoIHB1bXBIYW5kbGVTaGFwZSwgLTEgKTtcclxuICAgICAgcHVtcEhhbmRsZVNoYXBlLmxpbmVUb1JlbGF0aXZlKCAtZ3JpcEludGVyQnVtcFdpZHRoLCAwICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdGhpcyBpcyB0aGUgdXBwZXIgbWlkZGxlIHNlY3Rpb24gb2YgdGhlIGhhbmRsZVxyXG4gICAgcHVtcEhhbmRsZVNoYXBlLnF1YWRyYXRpY0N1cnZlVG9SZWxhdGl2ZSggLWNlbnRlckN1cnZlV2lkdGggLyAyLCAtY2VudGVyQ3VydmVIZWlnaHQsIC1jZW50ZXJDdXJ2ZVdpZHRoLCAtY2VudGVyQ3VydmVIZWlnaHQgKTtcclxuICAgIHB1bXBIYW5kbGVTaGFwZS5saW5lVG9SZWxhdGl2ZSggLWNlbnRlclNlY3Rpb25XaWR0aCwgMCApO1xyXG4gICAgcHVtcEhhbmRsZVNoYXBlLnF1YWRyYXRpY0N1cnZlVG9SZWxhdGl2ZSggLWNlbnRlckN1cnZlV2lkdGggLyAyLCAwLCAtY2VudGVyQ3VydmVXaWR0aCwgY2VudGVyQ3VydmVIZWlnaHQgKTtcclxuICAgIHB1bXBIYW5kbGVTaGFwZS5saW5lVG9SZWxhdGl2ZSggLWdyaXBJbnRlckJ1bXBXaWR0aCwgMCApO1xyXG5cclxuICAgIC8vIHRoaXMgaXMgdGhlIHVwcGVyIGxlZnQgcGFydCBvZiB0aGUgaGFuZGxlLCBpbmNsdWRpbmcgb25seSB0aGUgZ3JpcCBidW1wc1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbnVtYmVyT2ZHcmlwQnVtcHMgLSAxOyBpKysgKSB7XHJcbiAgICAgIGFkZEdyaXBCdW1wKCBwdW1wSGFuZGxlU2hhcGUsIC0xICk7XHJcbiAgICAgIHB1bXBIYW5kbGVTaGFwZS5saW5lVG9SZWxhdGl2ZSggLWdyaXBJbnRlckJ1bXBXaWR0aCwgMCApO1xyXG4gICAgfVxyXG4gICAgYWRkR3JpcEJ1bXAoIHB1bXBIYW5kbGVTaGFwZSwgLTEgKTtcclxuXHJcbiAgICAvLyB0aGlzIGlzIHRoZSBsZWZ0IGVkZ2Ugb2YgdGhlIGhhbmRsZVxyXG4gICAgcHVtcEhhbmRsZVNoYXBlLmxpbmVUb1JlbGF0aXZlKCAwLCBncmlwRW5kSGVpZ2h0ICk7XHJcblxyXG4gICAgLy8gdGhpcyBpcyB0aGUgbG93ZXIgbGVmdCBwYXJ0IG9mIHRoZSBoYW5kbGUsIGluY2x1ZGluZyB0aGUgZ3JpcCBidW1wcyBhbmQgaGFsZiBvZiB0aGUgbWlkZGxlIHNlY3Rpb25cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IG51bWJlck9mR3JpcEJ1bXBzOyBpKysgKSB7XHJcbiAgICAgIGFkZEdyaXBCdW1wKCBwdW1wSGFuZGxlU2hhcGUsIDEgKTtcclxuICAgICAgcHVtcEhhbmRsZVNoYXBlLmxpbmVUb1JlbGF0aXZlKCBncmlwSW50ZXJCdW1wV2lkdGgsIDAgKTtcclxuICAgIH1cclxuICAgIHB1bXBIYW5kbGVTaGFwZS5xdWFkcmF0aWNDdXJ2ZVRvUmVsYXRpdmUoIGNlbnRlckN1cnZlV2lkdGggLyAyLCBjZW50ZXJDdXJ2ZUhlaWdodCwgY2VudGVyQ3VydmVXaWR0aCwgY2VudGVyQ3VydmVIZWlnaHQgKTtcclxuICAgIHB1bXBIYW5kbGVTaGFwZS5saW5lVG9SZWxhdGl2ZSggY2VudGVyU2VjdGlvbldpZHRoIC8gMiwgMCApO1xyXG4gICAgcHVtcEhhbmRsZVNoYXBlLmNsb3NlKCk7XHJcblxyXG4gICAgLy8gdXNlZCB0byB0cmFjayB3aGVyZSB0aGUgY3VycmVudCBwb3NpdGlvbiBpcyBvbiB0aGUgaGFuZGxlIHdoZW4gZHJhd2luZyBpdHMgZ3JhZGllbnRcclxuICAgIGxldCBoYW5kbGVHcmFkaWVudFBvc2l0aW9uID0gMDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZHMgYSBjb2xvciBzdG9wIHRvIHRoZSBnaXZlbiBncmFkaWVudCBhdFxyXG4gICAgICogQHBhcmFtIGdyYWRpZW50IC0gdGhlIGdyYWRpZW50IGJlaW5nIGFwcGVuZGVkIHRvXHJcbiAgICAgKiBAcGFyYW0gZGVsdGFEaXN0YW5jZSAtIHRoZSBkaXN0YW5jZSBvZiB0aGlzIGFkZGVkIGNvbG9yIHN0b3BcclxuICAgICAqIEBwYXJhbSB0b3RhbERpc3RhbmNlIC0gdGhlIHRvdGFsIHdpZHRoIG9mIHRoZSBncmFkaWVudFxyXG4gICAgICogQHBhcmFtIGNvbG9yIC0gdGhlIGNvbG9yIG9mIHRoaXMgY29sb3Igc3RvcFxyXG4gICAgICovXHJcbiAgICBjb25zdCBhZGRSZWxhdGl2ZUNvbG9yU3RvcCA9ICggZ3JhZGllbnQ6IExpbmVhckdyYWRpZW50LCBkZWx0YURpc3RhbmNlOiBudW1iZXIsIHRvdGFsRGlzdGFuY2U6IG51bWJlciwgY29sb3I6IFRDb2xvciApID0+IHtcclxuICAgICAgY29uc3QgbmV3UG9zaXRpb24gPSBoYW5kbGVHcmFkaWVudFBvc2l0aW9uICsgZGVsdGFEaXN0YW5jZTtcclxuICAgICAgbGV0IHJhdGlvID0gbmV3UG9zaXRpb24gLyB0b3RhbERpc3RhbmNlO1xyXG4gICAgICByYXRpbyA9IHJhdGlvID4gMSA/IDEgOiByYXRpbztcclxuXHJcbiAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCggcmF0aW8sIGNvbG9yICk7XHJcbiAgICAgIGhhbmRsZUdyYWRpZW50UG9zaXRpb24gPSBuZXdQb3NpdGlvbjtcclxuICAgIH07XHJcblxyXG4gICAgLy8gc2V0IHVwIHRoZSBncmFkaWVudCBmb3IgdGhlIGhhbmRsZVxyXG4gICAgY29uc3QgcHVtcEhhbmRsZVdpZHRoID0gcHVtcEhhbmRsZVNoYXBlLmJvdW5kcy53aWR0aDtcclxuICAgIGNvbnN0IHB1bXBIYW5kbGVHcmFkaWVudCA9IG5ldyBMaW5lYXJHcmFkaWVudCggLXB1bXBIYW5kbGVXaWR0aCAvIDIsIDAsIHB1bXBIYW5kbGVXaWR0aCAvIDIsIDAgKTtcclxuXHJcbiAgICAvLyB1c2UgUGFpbnRDb2xvclByb3BlcnR5IHNvIHRoYXQgY29sb3JzIGNhbiBiZSB1cGRhdGVkIGR5bmFtaWNhbGx5XHJcbiAgICBjb25zdCBoYW5kbGVGaWxsQ29sb3JQcm9wZXJ0eSA9IG5ldyBQYWludENvbG9yUHJvcGVydHkoIGZpbGwgKTtcclxuICAgIGNvbnN0IGhhbmRsZUZpbGxEYXJrZXJDb2xvclByb3BlcnR5ID0gbmV3IFBhaW50Q29sb3JQcm9wZXJ0eSggaGFuZGxlRmlsbENvbG9yUHJvcGVydHksIHsgbHVtaW5hbmNlRmFjdG9yOiAtMC4zNSB9ICk7XHJcblxyXG4gICAgLy8gZmlsbCB0aGUgbGVmdCBzaWRlIGhhbmRsZSBncmFkaWVudFxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbnVtYmVyT2ZHcmlwQnVtcHM7IGkrKyApIHtcclxuICAgICAgYWRkUmVsYXRpdmVDb2xvclN0b3AoIHB1bXBIYW5kbGVHcmFkaWVudCwgMCwgcHVtcEhhbmRsZVdpZHRoLCBoYW5kbGVGaWxsQ29sb3JQcm9wZXJ0eSApO1xyXG4gICAgICBhZGRSZWxhdGl2ZUNvbG9yU3RvcCggcHVtcEhhbmRsZUdyYWRpZW50LCBncmlwU2luZ2xlQnVtcEhhbGZXaWR0aCwgcHVtcEhhbmRsZVdpZHRoLCBoYW5kbGVGaWxsQ29sb3JQcm9wZXJ0eSApO1xyXG4gICAgICBhZGRSZWxhdGl2ZUNvbG9yU3RvcCggcHVtcEhhbmRsZUdyYWRpZW50LCBncmlwU2luZ2xlQnVtcEhhbGZXaWR0aCwgcHVtcEhhbmRsZVdpZHRoLCBoYW5kbGVGaWxsRGFya2VyQ29sb3JQcm9wZXJ0eSApO1xyXG4gICAgICBhZGRSZWxhdGl2ZUNvbG9yU3RvcCggcHVtcEhhbmRsZUdyYWRpZW50LCAwLCBwdW1wSGFuZGxlV2lkdGgsIGhhbmRsZUZpbGxDb2xvclByb3BlcnR5ICk7XHJcbiAgICAgIGFkZFJlbGF0aXZlQ29sb3JTdG9wKCBwdW1wSGFuZGxlR3JhZGllbnQsIGdyaXBJbnRlckJ1bXBXaWR0aCwgcHVtcEhhbmRsZVdpZHRoLCBoYW5kbGVGaWxsRGFya2VyQ29sb3JQcm9wZXJ0eSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGZpbGwgdGhlIGNlbnRlciBzZWN0aW9uIGhhbmRsZSBncmFkaWVudFxyXG4gICAgYWRkUmVsYXRpdmVDb2xvclN0b3AoIHB1bXBIYW5kbGVHcmFkaWVudCwgMCwgcHVtcEhhbmRsZVdpZHRoLCBoYW5kbGVGaWxsQ29sb3JQcm9wZXJ0eSApO1xyXG4gICAgYWRkUmVsYXRpdmVDb2xvclN0b3AoIHB1bXBIYW5kbGVHcmFkaWVudCwgY2VudGVyQ3VydmVXaWR0aCArIGNlbnRlclNlY3Rpb25XaWR0aCwgcHVtcEhhbmRsZVdpZHRoLCBoYW5kbGVGaWxsQ29sb3JQcm9wZXJ0eSApO1xyXG4gICAgYWRkUmVsYXRpdmVDb2xvclN0b3AoIHB1bXBIYW5kbGVHcmFkaWVudCwgY2VudGVyQ3VydmVXaWR0aCwgcHVtcEhhbmRsZVdpZHRoLCBoYW5kbGVGaWxsRGFya2VyQ29sb3JQcm9wZXJ0eSApO1xyXG5cclxuICAgIC8vIGZpbGwgdGhlIHJpZ2h0IHNpZGUgaGFuZGxlIGdyYWRpZW50XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBudW1iZXJPZkdyaXBCdW1wczsgaSsrICkge1xyXG4gICAgICBhZGRSZWxhdGl2ZUNvbG9yU3RvcCggcHVtcEhhbmRsZUdyYWRpZW50LCAwLCBwdW1wSGFuZGxlV2lkdGgsIGhhbmRsZUZpbGxDb2xvclByb3BlcnR5ICk7XHJcbiAgICAgIGFkZFJlbGF0aXZlQ29sb3JTdG9wKCBwdW1wSGFuZGxlR3JhZGllbnQsIGdyaXBJbnRlckJ1bXBXaWR0aCwgcHVtcEhhbmRsZVdpZHRoLCBoYW5kbGVGaWxsRGFya2VyQ29sb3JQcm9wZXJ0eSApO1xyXG4gICAgICBhZGRSZWxhdGl2ZUNvbG9yU3RvcCggcHVtcEhhbmRsZUdyYWRpZW50LCAwLCBwdW1wSGFuZGxlV2lkdGgsIGhhbmRsZUZpbGxDb2xvclByb3BlcnR5ICk7XHJcbiAgICAgIGFkZFJlbGF0aXZlQ29sb3JTdG9wKCBwdW1wSGFuZGxlR3JhZGllbnQsIGdyaXBTaW5nbGVCdW1wSGFsZldpZHRoLCBwdW1wSGFuZGxlV2lkdGgsIGhhbmRsZUZpbGxDb2xvclByb3BlcnR5ICk7XHJcbiAgICAgIGFkZFJlbGF0aXZlQ29sb3JTdG9wKCBwdW1wSGFuZGxlR3JhZGllbnQsIGdyaXBTaW5nbGVCdW1wSGFsZldpZHRoLCBwdW1wSGFuZGxlV2lkdGgsIGhhbmRsZUZpbGxEYXJrZXJDb2xvclByb3BlcnR5ICk7XHJcbiAgICB9XHJcblxyXG4gICAgc3VwZXIoIHB1bXBIYW5kbGVTaGFwZSwge1xyXG4gICAgICBsaW5lV2lkdGg6IDIsXHJcbiAgICAgIHN0cm9rZTogJ2JsYWNrJyxcclxuICAgICAgZmlsbDogcHVtcEhhbmRsZUdyYWRpZW50LFxyXG4gICAgICB0YWdOYW1lOiAnZGl2JyxcclxuICAgICAgZm9jdXNhYmxlOiB0cnVlXHJcbiAgICB9ICk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogRHJhZ0RlbGVnYXRlIGhhbmRsZXMgdGhlIGRyYWcgYWN0aW9uIGZvciB0aGUgcHVtcCBoYW5kbGUuIFRoZSBSaWNoRHJhZ0xpc3RlbmVyIGFuZCBSaWNoS2V5Ym9hcmREcmFnTGlzdGVuZXIgaW5zdGFuY2VzXHJcbiAqIGluIEJpY3ljbGVQdW1wTm9kZSBkZWxlZ2F0ZSB0byBhbiBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzLlxyXG4gKi9cclxuXHJcbnR5cGUgRHJhZ0RlbGVnYXRlU2VsZk9wdGlvbnMgPSBQaWNrUmVxdWlyZWQ8QmljeWNsZVB1bXBOb2RlT3B0aW9ucywgJ251bWJlck9mUGFydGljbGVzUGVyUHVtcEFjdGlvbicgfCAnYWRkUGFydGljbGVzT25lQXRBVGltZSc+O1xyXG5cclxudHlwZSBEcmFnRGVsZWdhdGVPcHRpb25zID0gRHJhZ0RlbGVnYXRlU2VsZk9wdGlvbnM7XHJcblxyXG5jbGFzcyBEcmFnRGVsZWdhdGUge1xyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IG51bWJlclByb3BlcnR5OiBUUHJvcGVydHk8bnVtYmVyPjtcclxuICBwcml2YXRlIHJlYWRvbmx5IHJhbmdlUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PFJhbmdlPjtcclxuICBwcml2YXRlIHJlYWRvbmx5IG5vZGVFbmFibGVkUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+O1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgaW5qZWN0aW9uRW5hYmxlZFByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuPjtcclxuICBwcml2YXRlIHJlYWRvbmx5IHB1bXBIYW5kbGVOb2RlOiBOb2RlO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgcHVtcFNoYWZ0Tm9kZTogTm9kZTtcclxuICBwcml2YXRlIHJlYWRvbmx5IGFkZFBhcnRpY2xlc09uZUF0QVRpbWU6IGJvb2xlYW47XHJcbiAgcHJpdmF0ZSByZWFkb25seSBwdW1waW5nRGlzdGFuY2VSZXF1aXJlZFRvQWRkUGFydGljbGU6IG51bWJlcjtcclxuICBwcml2YXRlIHB1bXBpbmdEaXN0YW5jZUFjY3VtdWxhdGlvbjogbnVtYmVyO1xyXG4gIHByaXZhdGUgbGFzdEhhbmRsZVBvc2l0aW9uOiBudW1iZXIgfCBudWxsO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIG51bWJlclByb3BlcnR5OiBUUHJvcGVydHk8bnVtYmVyPixcclxuICAgICAgICAgICAgICAgICAgICAgIHJhbmdlUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PFJhbmdlPixcclxuICAgICAgICAgICAgICAgICAgICAgIG5vZGVFbmFibGVkUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+LFxyXG4gICAgICAgICAgICAgICAgICAgICAgaW5qZWN0aW9uRW5hYmxlZFByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuPixcclxuICAgICAgICAgICAgICAgICAgICAgIG1pbkhhbmRsZVlPZmZzZXQ6IG51bWJlcixcclxuICAgICAgICAgICAgICAgICAgICAgIG1heEhhbmRsZVlPZmZzZXQ6IG51bWJlcixcclxuICAgICAgICAgICAgICAgICAgICAgIHB1bXBIYW5kbGVOb2RlOiBOb2RlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgcHVtcFNoYWZ0Tm9kZTogTm9kZSxcclxuICAgICAgICAgICAgICAgICAgICAgIHByb3ZpZGVkT3B0aW9uczogRHJhZ0RlbGVnYXRlT3B0aW9uc1xyXG4gICkge1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG1heEhhbmRsZVlPZmZzZXQgPiBtaW5IYW5kbGVZT2Zmc2V0LCAnYm9ndXMgb2Zmc2V0cycgKTtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gcHJvdmlkZWRPcHRpb25zO1xyXG5cclxuICAgIHRoaXMubnVtYmVyUHJvcGVydHkgPSBudW1iZXJQcm9wZXJ0eTtcclxuICAgIHRoaXMucmFuZ2VQcm9wZXJ0eSA9IHJhbmdlUHJvcGVydHk7XHJcbiAgICB0aGlzLm5vZGVFbmFibGVkUHJvcGVydHkgPSBub2RlRW5hYmxlZFByb3BlcnR5O1xyXG4gICAgdGhpcy5pbmplY3Rpb25FbmFibGVkUHJvcGVydHkgPSBpbmplY3Rpb25FbmFibGVkUHJvcGVydHk7XHJcbiAgICB0aGlzLnB1bXBIYW5kbGVOb2RlID0gcHVtcEhhbmRsZU5vZGU7XHJcbiAgICB0aGlzLnB1bXBTaGFmdE5vZGUgPSBwdW1wU2hhZnROb2RlO1xyXG4gICAgdGhpcy5hZGRQYXJ0aWNsZXNPbmVBdEFUaW1lID0gb3B0aW9ucy5hZGRQYXJ0aWNsZXNPbmVBdEFUaW1lO1xyXG5cclxuICAgIHRoaXMucHVtcGluZ0Rpc3RhbmNlQWNjdW11bGF0aW9uID0gMDtcclxuICAgIHRoaXMubGFzdEhhbmRsZVBvc2l0aW9uID0gbnVsbDtcclxuXHJcbiAgICAvLyBIb3cgZmFyIHRoZSBwdW1wIHNoYWZ0IG5lZWRzIHRvIHRyYXZlbCBiZWZvcmUgdGhlIHB1bXAgcmVsZWFzZXMgYSBwYXJ0aWNsZS5cclxuICAgIC8vIFRoZSBzdWJ0cmFjdGVkIGNvbnN0YW50IHdhcyBlbXBpcmljYWxseSBkZXRlcm1pbmVkIHRvIGVuc3VyZSB0aGF0IG51bWJlck9mUGFydGljbGVzUGVyUHVtcEFjdGlvbiBpcyBjb3JyZWN0LlxyXG4gICAgdGhpcy5wdW1waW5nRGlzdGFuY2VSZXF1aXJlZFRvQWRkUGFydGljbGUgPVxyXG4gICAgICAoIG1heEhhbmRsZVlPZmZzZXQgLSBtaW5IYW5kbGVZT2Zmc2V0ICkgLyBvcHRpb25zLm51bWJlck9mUGFydGljbGVzUGVyUHVtcEFjdGlvbiAtIDAuMDE7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVzZXQoKTogdm9pZCB7XHJcbiAgICB0aGlzLnB1bXBpbmdEaXN0YW5jZUFjY3VtdWxhdGlvbiA9IDA7XHJcbiAgICB0aGlzLmxhc3RIYW5kbGVQb3NpdGlvbiA9IG51bGw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGVzIGEgZHJhZyBvZiB0aGUgcHVtcCBoYW5kbGUuIFJpY2hEcmFnTGlzdGVuZXIgYW5kIFJpY2hLZXlib2FyZERyYWdMaXN0ZW5lciBpbnN0YW5jZXMgaW4gQmljeWNsZVB1bXBOb2RlXHJcbiAgICogc2hvdWxkIGNhbGwgdGhpcyBtZXRob2QgZnJvbSB0aGVpciBvcHRpb25zLmRyYWcgZnVuY3Rpb24uXHJcbiAgICovXHJcbiAgcHVibGljIGhhbmRsZURyYWcoIG5ld0hhbmRsZVBvc2l0aW9uOiBudW1iZXIgKTogdm9pZCB7XHJcblxyXG4gICAgdGhpcy5wdW1wSGFuZGxlTm9kZS5jZW50ZXJZID0gbmV3SGFuZGxlUG9zaXRpb247XHJcbiAgICB0aGlzLnB1bXBTaGFmdE5vZGUudG9wID0gdGhpcy5wdW1wSGFuZGxlTm9kZS5ib3R0b207XHJcblxyXG4gICAgbGV0IG51bWJlck9mQmF0Y2hQYXJ0aWNsZXMgPSAwOyAvLyBudW1iZXIgb2YgcGFydGljbGVzIHRvIGFkZCBhbGwgYXQgb25jZVxyXG5cclxuICAgIGlmICggdGhpcy5sYXN0SGFuZGxlUG9zaXRpb24gIT09IG51bGwgKSB7XHJcbiAgICAgIGNvbnN0IHRyYXZlbERpc3RhbmNlID0gbmV3SGFuZGxlUG9zaXRpb24gLSB0aGlzLmxhc3RIYW5kbGVQb3NpdGlvbjtcclxuICAgICAgaWYgKCB0cmF2ZWxEaXN0YW5jZSA+IDAgKSB7XHJcblxyXG4gICAgICAgIC8vIFRoaXMgbW90aW9uIGlzIGluIHRoZSBkb3dud2FyZCBkaXJlY3Rpb24sIHNvIGFkZCBpdHMgZGlzdGFuY2UgdG8gdGhlIHB1bXBpbmcgZGlzdGFuY2UuXHJcbiAgICAgICAgdGhpcy5wdW1waW5nRGlzdGFuY2VBY2N1bXVsYXRpb24gKz0gdHJhdmVsRGlzdGFuY2U7XHJcbiAgICAgICAgd2hpbGUgKCB0aGlzLnB1bXBpbmdEaXN0YW5jZUFjY3VtdWxhdGlvbiA+PSB0aGlzLnB1bXBpbmdEaXN0YW5jZVJlcXVpcmVkVG9BZGRQYXJ0aWNsZSApIHtcclxuXHJcbiAgICAgICAgICAvLyBhZGQgYSBwYXJ0aWNsZVxyXG4gICAgICAgICAgaWYgKCB0aGlzLm5vZGVFbmFibGVkUHJvcGVydHkudmFsdWUgJiYgdGhpcy5pbmplY3Rpb25FbmFibGVkUHJvcGVydHkudmFsdWUgJiZcclxuICAgICAgICAgICAgICAgdGhpcy5udW1iZXJQcm9wZXJ0eS52YWx1ZSArIG51bWJlck9mQmF0Y2hQYXJ0aWNsZXMgPCB0aGlzLnJhbmdlUHJvcGVydHkudmFsdWUubWF4ICkge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuYWRkUGFydGljbGVzT25lQXRBVGltZSApIHtcclxuICAgICAgICAgICAgICB0aGlzLm51bWJlclByb3BlcnR5LnZhbHVlKys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgbnVtYmVyT2ZCYXRjaFBhcnRpY2xlcysrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICB0aGlzLnB1bXBpbmdEaXN0YW5jZUFjY3VtdWxhdGlvbiAtPSB0aGlzLnB1bXBpbmdEaXN0YW5jZVJlcXVpcmVkVG9BZGRQYXJ0aWNsZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdGhpcy5wdW1waW5nRGlzdGFuY2VBY2N1bXVsYXRpb24gPSAwO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWRkIHBhcnRpY2xlcyBpbiBvbmUgYmF0Y2guXHJcbiAgICBpZiAoICF0aGlzLmFkZFBhcnRpY2xlc09uZUF0QVRpbWUgKSB7XHJcbiAgICAgIHRoaXMubnVtYmVyUHJvcGVydHkudmFsdWUgKz0gbnVtYmVyT2ZCYXRjaFBhcnRpY2xlcztcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBudW1iZXJPZkJhdGNoUGFydGljbGVzID09PSAwLCAndW5leHBlY3RlZCBiYXRjaGVkIHBhcnRpY2xlcycgKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmxhc3RIYW5kbGVQb3NpdGlvbiA9IG5ld0hhbmRsZVBvc2l0aW9uO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeVBoZXQucmVnaXN0ZXIoICdCaWN5Y2xlUHVtcE5vZGUnLCBCaWN5Y2xlUHVtcE5vZGUgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsZUFBZSxNQUFNLGtDQUFrQztBQUk5RCxPQUFPQyxLQUFLLE1BQU0sdUJBQXVCO0FBRXpDLE9BQU9DLE9BQU8sTUFBTSx5QkFBeUI7QUFDN0MsU0FBU0MsS0FBSyxRQUFRLDBCQUEwQjtBQUNoRCxPQUFPQyxnQkFBZ0IsTUFBTSxzREFBc0Q7QUFDbkYsT0FBT0MsU0FBUyxJQUFJQyxjQUFjLFFBQVEsaUNBQWlDO0FBQzNFLFNBQVNDLE1BQU0sRUFBRUMsY0FBYyxFQUFFQyxJQUFJLEVBQWVDLGtCQUFrQixFQUFFQyxJQUFJLEVBQXNCQyxTQUFTLEVBQUVDLGdCQUFnQixRQUFnQiw2QkFBNkI7QUFDMUssT0FBT0MsTUFBTSxNQUFNLDJCQUEyQjtBQUM5QyxPQUFPQyxXQUFXLE1BQU0sa0JBQWtCO0FBQzFDLE9BQU9DLHFCQUFxQixNQUFNLDRCQUE0QjtBQUU5RCxPQUFPQyxnQkFBZ0IsTUFBbUMsdUJBQXVCO0FBQ2pGLE9BQU9DLHdCQUF3QixNQUEyQywrQkFBK0I7O0FBRXpHO0FBQ0E7QUFDQSxN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