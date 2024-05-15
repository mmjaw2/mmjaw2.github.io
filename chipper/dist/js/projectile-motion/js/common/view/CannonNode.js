// Copyright 2016-2024, University of Colorado Boulder

/**
 * Cannon view.
 * Angle can change when user drags the cannon tip. Height can change when user drags cannon base.
 *
 * @author Andrea Lin (PhET Interactive Simulations)
 */

import Range from '../../../../dot/js/Range.js';
import Utils from '../../../../dot/js/Utils.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import LinearFunction from '../../../../dot/js/LinearFunction.js';
import { Shape } from '../../../../kite/js/imports.js';
import merge from '../../../../phet-core/js/merge.js';
import StringUtils from '../../../../phetcommon/js/util/StringUtils.js';
import ArrowNode from '../../../../scenery-phet/js/ArrowNode.js';
import MathSymbols from '../../../../scenery-phet/js/MathSymbols.js';
import { Color, DragListener, Image, Line, LinearGradient, Node, Path, Rectangle, Text } from '../../../../scenery/js/imports.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import cannonBarrelTop_png from '../../../images/cannonBarrelTop_png.js';
import cannonBarrel_png from '../../../mipmaps/cannonBarrel_png.js';
import cannonBaseBottom_png from '../../../mipmaps/cannonBaseBottom_png.js';
import cannonBaseTop_png from '../../../mipmaps/cannonBaseTop_png.js';
import projectileMotion from '../../projectileMotion.js';
import ProjectileMotionStrings from '../../ProjectileMotionStrings.js';
import ProjectileMotionConstants from '../ProjectileMotionConstants.js';
import optionize from '../../../../phet-core/js/optionize.js';

// image

const mString = ProjectileMotionStrings.m;
const pattern0Value1UnitsString = ProjectileMotionStrings.pattern0Value1Units;
const pattern0Value1UnitsWithSpaceString = ProjectileMotionStrings.pattern0Value1UnitsWithSpace;

// constants
const CANNON_LENGTH = 4; // empirically determined in model coords
const ELLIPSE_WIDTH = 420; // empirically determined in view coordinates
const ELLIPSE_HEIGHT = 40; // empirically determined in view coordinates
const CYLINDER_DISTANCE_FROM_ORIGIN = 1.3; // empirically determined in model coords as it needs to update each time the mvt changes
const HEIGHT_LEADER_LINE_X = -1.5; // empirically determined in view coords
const CROSSHAIR_LENGTH = 120; // empirically determined in view coords
const ANGLE_RANGE = ProjectileMotionConstants.CANNON_ANGLE_RANGE;
const HEIGHT_RANGE = ProjectileMotionConstants.CANNON_HEIGHT_RANGE;
const LABEL_OPTIONS = ProjectileMotionConstants.LABEL_TEXT_OPTIONS;
const BRIGHT_GRAY_COLOR = new Color(230, 230, 230, 1);
const DARK_GRAY_COLOR = new Color(103, 103, 103, 1);
const TRANSPARENT_WHITE = 'rgba( 255, 255, 255, 0.6 )';
const ANGLE_RANGE_MINS = [5, -5, -20, -40]; // angle range minimums, corresponding to height through their index
const CUEING_ARROW_OPTIONS = {
  fill: 'rgb( 100, 200, 255 )',
  stroke: 'black',
  lineWidth: 1,
  tailWidth: 8,
  headWidth: 14,
  headHeight: 6
};
const MUZZLE_FLASH_SCALE_INITIAL = 0.4;
const MUZZLE_FLASH_SCALE_FINAL = 1.5;
const MUZZLE_FLASH_OPACITY_INITIAL = 1;
const MUZZLE_FLASH_OPACITY_FINAL = 0;
const MUZZLE_FLASH_DURATION = 0.4; //seconds

const DEGREES = MathSymbols.DEGREES;
const opacityLinearFunction = new LinearFunction(0, 1, MUZZLE_FLASH_OPACITY_INITIAL, MUZZLE_FLASH_OPACITY_FINAL);
const scaleLinearFunction = new LinearFunction(0, 1, MUZZLE_FLASH_SCALE_INITIAL, MUZZLE_FLASH_SCALE_FINAL);
class CannonNode extends Node {
  constructor(heightProperty, angleProperty, muzzleFlashStepper, transformProperty, screenView, providedOptions) {
    const options = optionize()({
      tandem: Tandem.REQUIRED
    }, providedOptions);
    super(options);

    // where the projectile is fired from
    const viewOrigin = transformProperty.value.modelToViewPosition(new Vector2(0, 0));

    // the cannon, muzzle flash, and pedestal are not visible underground
    const clipContainer = new Node(); // no transform, just for clip area

    const cylinderNode = new Node({
      y: viewOrigin.y
    });
    clipContainer.addChild(cylinderNode);

    // shape used for ground circle and top of pedestal
    const ellipseShape = Shape.ellipse(0, 0, ELLIPSE_WIDTH / 2, ELLIPSE_HEIGHT / 2, 0);

    // ground circle, which shows the "inside" of the circular hole that the cannon is sitting in
    const groundFill = new LinearGradient(-ELLIPSE_WIDTH / 2, 0, ELLIPSE_WIDTH / 2, 0).addColorStop(0.0, 'gray').addColorStop(0.3, 'white').addColorStop(1, 'gray');
    const groundCircle = new Path(ellipseShape, {
      y: viewOrigin.y,
      fill: groundFill,
      stroke: BRIGHT_GRAY_COLOR
    });

    // side of the cylinder
    const sideFill = new LinearGradient(-ELLIPSE_WIDTH / 2, 0, ELLIPSE_WIDTH / 2, 0).addColorStop(0.0, DARK_GRAY_COLOR).addColorStop(0.3, BRIGHT_GRAY_COLOR).addColorStop(1, DARK_GRAY_COLOR);
    const cylinderSide = new Path(null, {
      fill: sideFill,
      stroke: BRIGHT_GRAY_COLOR
    });
    cylinderNode.addChild(cylinderSide);

    // top of the cylinder
    const cylinderTop = new Path(ellipseShape, {
      fill: DARK_GRAY_COLOR,
      stroke: BRIGHT_GRAY_COLOR
    });
    cylinderNode.addChild(cylinderTop);

    // cannon
    const cannonBarrel = new Node({
      x: viewOrigin.x,
      y: viewOrigin.y
    });
    clipContainer.addChild(cannonBarrel);

    // A copy of the top part of the cannon barrel to 1) grab and change angle and 2) layout the cannonBarrel
    const cannonBarrelTop = new Image(cannonBarrelTop_png, {
      centerY: 0,
      opacity: 0
    });
    const cannonBarrelBase = new Image(cannonBarrel_png, {
      centerY: 0,
      right: cannonBarrelTop.right
    });
    cannonBarrel.addChild(cannonBarrelBase);
    cannonBarrel.addChild(cannonBarrelTop);
    const cannonBase = new Node({
      x: viewOrigin.x,
      y: viewOrigin.y
    });
    clipContainer.addChild(cannonBase);
    const cannonBaseBottom = new Image(cannonBaseBottom_png, {
      top: 0,
      centerX: 0
    });
    cannonBase.addChild(cannonBaseBottom);
    const cannonBaseTop = new Image(cannonBaseTop_png, {
      bottom: 0,
      centerX: 0
    });
    cannonBase.addChild(cannonBaseTop);
    const viewHeightLeaderLineX = transformProperty.value.modelToViewX(HEIGHT_LEADER_LINE_X);

    // add dashed line for indicating the height
    const heightLeaderLine = new Line(viewHeightLeaderLineX, viewOrigin.y, viewHeightLeaderLineX, transformProperty.value.modelToViewY(heightProperty.get()), {
      stroke: 'black',
      lineDash: [5, 5]
    });

    // added arrows for indicating height
    const heightLeaderArrows = new ArrowNode(viewHeightLeaderLineX, viewOrigin.y, viewHeightLeaderLineX, transformProperty.value.modelToViewY(heightProperty.get()), {
      headHeight: 5,
      headWidth: 5,
      tailWidth: 0,
      lineWidth: 0,
      doubleHead: true
    });

    // draw the line caps for the height leader line

    const heightLeaderLineTopCap = new Line(-6, 0, 6, 0, {
      stroke: 'black',
      lineWidth: 2
    });
    const heightLeaderLineBottomCap = new Line(-6, 0, 6, 0, {
      stroke: 'black',
      lineWidth: 2
    });
    heightLeaderLineBottomCap.x = heightLeaderArrows.tipX;
    heightLeaderLineBottomCap.y = viewOrigin.y;

    // height readout
    const heightLabelBackground = new Rectangle(0, 0, 0, 0, {
      fill: TRANSPARENT_WHITE
    });
    const heightLabelOptions = merge({
      pickable: true,
      maxWidth: 40 // empirically determined
    }, LABEL_OPTIONS);
    const heightLabelText = new Text(StringUtils.fillIn(pattern0Value1UnitsWithSpaceString, {
      value: Utils.toFixedNumber(heightProperty.get(), 2),
      units: mString,
      tandem: options.tandem.createTandem('heightLabelText')
    }), heightLabelOptions);
    heightLabelText.setMouseArea(heightLabelText.bounds.dilatedXY(8, 10));
    heightLabelText.setTouchArea(heightLabelText.bounds.dilatedXY(10, 12));
    heightLabelText.centerX = heightLeaderArrows.tipX;

    // cueing arrow for dragging height
    const heightCueingTopArrow = new ArrowNode(0, -12, 0, -27, CUEING_ARROW_OPTIONS);
    const heightCueingBottomArrow = new ArrowNode(0, 17, 0, 32, CUEING_ARROW_OPTIONS);
    const heightCueingArrows = new Node({
      children: [heightCueingTopArrow, heightCueingBottomArrow]
    });
    heightCueingArrows.centerX = heightLeaderArrows.tipX;
    this.isIntroScreen = heightProperty.initialValue !== 0;
    this.heightCueingArrows = heightCueingArrows;

    // cueing arrow only visible on intro screen
    heightCueingArrows.visible = this.isIntroScreen;

    // angle indicator
    const angleIndicator = new Node();
    angleIndicator.x = viewOrigin.x; // centered at the origin, independent of the cylinder position

    // crosshair view
    const crosshairShape = new Shape().moveTo(-CROSSHAIR_LENGTH / 4, 0).lineTo(CROSSHAIR_LENGTH, 0).moveTo(0, -CROSSHAIR_LENGTH).lineTo(0, CROSSHAIR_LENGTH);
    const crosshair = new Path(crosshairShape, {
      stroke: 'gray'
    });
    angleIndicator.addChild(crosshair);
    const darkerCrosshairShape = new Shape().moveTo(-CROSSHAIR_LENGTH / 15, 0).lineTo(CROSSHAIR_LENGTH / 15, 0).moveTo(0, -CROSSHAIR_LENGTH / 15).lineTo(0, CROSSHAIR_LENGTH / 15);
    const darkerCrosshair = new Path(darkerCrosshairShape, {
      stroke: 'black',
      lineWidth: 3
    });
    angleIndicator.addChild(darkerCrosshair);

    // view for the angle arc
    const angleArc = new Path(null, {
      stroke: 'gray'
    });
    angleIndicator.addChild(angleArc);

    // angle readout
    const angleLabelBackground = new Rectangle(0, 0, 0, 0, {
      fill: TRANSPARENT_WHITE
    });
    angleIndicator.addChild(angleLabelBackground);
    const angleLabel = new Text(StringUtils.fillIn(pattern0Value1UnitsString, {
      value: Utils.toFixedNumber(angleProperty.get(), 2),
      units: DEGREES
    }), LABEL_OPTIONS);
    angleLabel.bottom = -5;
    angleLabel.left = CROSSHAIR_LENGTH * 2 / 3 + 10;
    angleIndicator.addChild(angleLabel);

    // muzzle flash

    // the flames are the shape of tear drops
    const tearDropShapeStrength = 3;
    const flameShape = new Shape();
    const radius = 100; // in view coordinates
    flameShape.moveTo(-radius, 0);
    let t;
    for (t = Math.PI / 24; t < 2 * Math.PI; t += Math.PI / 24) {
      const x = Math.cos(t) * radius;
      const y = Math.sin(t) * Math.pow(Math.sin(0.5 * t), tearDropShapeStrength) * radius;
      flameShape.lineTo(x, y);
    }
    flameShape.lineTo(-radius, 0);

    // create paths based on shape
    const outerFlame = new Path(flameShape, {
      fill: 'rgb( 255, 255, 0 )',
      stroke: null
    });
    const innerFlame = new Path(flameShape, {
      fill: 'rgb( 255, 200, 0 )',
      stroke: null
    });
    innerFlame.setScaleMagnitude(0.7);
    outerFlame.left = 0;
    innerFlame.left = 0;
    const muzzleFlash = new Node({
      opacity: 0,
      x: cannonBarrelTop.right,
      y: 0,
      children: [outerFlame, innerFlame]
    });
    cannonBarrel.addChild(muzzleFlash);
    this.muzzleFlashPlaying = false;
    this.muzzleFlashStage = 0; // 0 means animation starting, 1 means animation ended.

    // Listen to the muzzleFlashStepper to step the muzzle flash animation
    muzzleFlashStepper.addListener(dt => {
      if (this.muzzleFlashPlaying) {
        if (this.muzzleFlashStage < 1) {
          const animationPercentComplete = muzzleFlashDurationCompleteToAnimationPercentComplete(this.muzzleFlashStage);
          muzzleFlash.opacity = opacityLinearFunction.evaluate(animationPercentComplete);
          muzzleFlash.setScaleMagnitude(scaleLinearFunction.evaluate(animationPercentComplete));
          this.muzzleFlashStage += dt / MUZZLE_FLASH_DURATION;
        } else {
          muzzleFlash.opacity = MUZZLE_FLASH_OPACITY_FINAL;
          muzzleFlash.setScaleMagnitude(MUZZLE_FLASH_SCALE_FINAL);
          this.muzzleFlashPlaying = false;
        }
      }
    });

    // rendering order
    this.setChildren([groundCircle, clipContainer, heightLeaderLine, heightLeaderArrows, heightLeaderLineTopCap, heightLeaderLineBottomCap, heightLabelBackground, heightLabelText, heightCueingArrows, angleIndicator]);

    // Observe changes in model angle and update the cannon view
    angleProperty.link(angle => {
      cannonBarrel.setRotation(-angle * Math.PI / 180);
      const arcShape = angle > 0 ? Shape.arc(0, 0, CROSSHAIR_LENGTH * 2 / 3, 0, -angle * Math.PI / 180, true) : Shape.arc(0, 0, CROSSHAIR_LENGTH * 2 / 3, 0, -angle * Math.PI / 180);
      angleArc.setShape(arcShape);
      angleLabel.string = StringUtils.fillIn(pattern0Value1UnitsString, {
        value: Utils.toFixedNumber(angleProperty.get(), 2),
        units: DEGREES
      });
      angleLabelBackground.setRectWidth(angleLabel.width + 2);
      angleLabelBackground.setRectHeight(angleLabel.height);
      angleLabelBackground.center = angleLabel.center;
    });

    // starts at 1, but is updated by modelViewTransform.
    let scaleMagnitude = 1;

    // Function to transform everything to the right height
    const updateHeight = height => {
      const viewHeightPoint = Vector2.pool.create(0, transformProperty.value.modelToViewY(height));
      const heightInClipCoordinates = this.globalToLocalPoint(screenView.localToGlobalPoint(viewHeightPoint)).y;
      cannonBarrel.y = heightInClipCoordinates;
      cannonBase.y = heightInClipCoordinates;

      // The cannonBase and cylinder are siblings, so transform into the same coordinate frame.
      cylinderTop.y = cylinderNode.parentToLocalPoint(viewHeightPoint.setY(cannonBase.bottom)).y - ELLIPSE_HEIGHT / 4;
      viewHeightPoint.freeToPool();
      const sideShape = new Shape();
      sideShape.moveTo(-ELLIPSE_WIDTH / 2, 0).lineTo(-ELLIPSE_WIDTH / 2, cylinderTop.y).ellipticalArc(0, cylinderTop.y, ELLIPSE_WIDTH / 2, ELLIPSE_HEIGHT / 2, 0, Math.PI, 0, true).lineTo(ELLIPSE_WIDTH / 2, 0).ellipticalArc(0, 0, ELLIPSE_WIDTH / 2, ELLIPSE_HEIGHT / 2, 0, 0, Math.PI, false).close();
      cylinderSide.setShape(sideShape);
      const clipArea = new Shape();
      clipArea.moveTo(-ELLIPSE_WIDTH / 2, 0).lineTo(-ELLIPSE_WIDTH / 2, -ELLIPSE_WIDTH * 50) // high enough to include how high the cannon could be
      .lineTo(ELLIPSE_WIDTH * 2, -ELLIPSE_WIDTH * 50) // high enough to include how high the cannon could be
      .lineTo(ELLIPSE_WIDTH * 2, 0).lineTo(ELLIPSE_WIDTH / 2, 0).ellipticalArc(0, 0, ELLIPSE_WIDTH / 2, ELLIPSE_HEIGHT / 2, 0, 0, Math.PI, false).close();

      // this shape is made in the context of the cylinder, so transform it to match the cylinder's transform.
      // This doesn't need to happen ever again because the clipContainer is the parent to all Nodes that are updated on
      // layout change.
      clipContainer.setClipArea(clipArea.transformed(cylinderNode.matrix));
      heightLeaderArrows.setTailAndTip(heightLeaderArrows.tailX, heightLeaderArrows.tailY, heightLeaderArrows.tipX, transformProperty.value.modelToViewY(height));
      heightLeaderLine.setLine(heightLeaderArrows.tailX, heightLeaderArrows.tailY, heightLeaderArrows.tipX, heightLeaderArrows.tipY);
      heightLeaderLineTopCap.x = heightLeaderArrows.tipX;
      heightLeaderLineTopCap.y = heightLeaderArrows.tipY;
      heightLabelText.string = StringUtils.fillIn(pattern0Value1UnitsWithSpaceString, {
        value: Utils.toFixedNumber(height, 2),
        units: mString
      });
      heightLabelText.centerX = heightLeaderArrows.tipX;
      heightLabelText.y = heightLeaderArrows.tipY - 5;
      heightLabelBackground.setRectWidth(heightLabelText.width + 2);
      heightLabelBackground.setRectHeight(heightLabelText.height);
      heightLabelBackground.center = heightLabelText.center;
      heightCueingArrows.y = heightLabelText.centerY;
      angleIndicator.y = transformProperty.value.modelToViewY(height);
    };

    // Observe changes in model height and update the cannon view
    heightProperty.link(height => {
      updateHeight(height);
      if (height < 4 && angleProperty.get() < ANGLE_RANGE_MINS[height]) {
        angleProperty.set(ANGLE_RANGE_MINS[height]);
      }
    });

    // Update the layout of cannon Nodes based on the current transform.
    const updateCannonLayout = () => {
      // Scale everything to be based on the cannon barrel.
      scaleMagnitude = transformProperty.value.modelToViewDeltaX(CANNON_LENGTH) / cannonBarrelTop.width;
      cylinderNode.setScaleMagnitude(scaleMagnitude);
      groundCircle.setScaleMagnitude(scaleMagnitude);
      cannonBarrel.setScaleMagnitude(scaleMagnitude);
      cannonBase.setScaleMagnitude(scaleMagnitude);

      // Transform the cylindrical Nodes over, because they are offset from the orgin.
      const newX = transformProperty.value.modelToViewX(CYLINDER_DISTANCE_FROM_ORIGIN);
      cylinderNode.x = newX;
      groundCircle.x = newX;
    };

    // Observe changes in modelviewtransform and update the view
    transformProperty.link(() => {
      updateCannonLayout();
      updateHeight(heightProperty.get());
    });

    // Links in CannonNode last for the lifetime of the sim, so they don't need to be disposed

    // variables used for drag listeners
    let startPoint;
    let startAngle;
    let startPointAngle;
    let mousePoint;
    let startHeight;

    // drag the tip of the cannon to change angle
    cannonBarrelTop.addInputListener(new DragListener({
      start: event => {
        startPoint = this.globalToLocalPoint(event.pointer.point);
        startAngle = angleProperty.get(); // degrees

        // find vector angles between mouse drag start and current points, to the base of the cannon
        startPointAngle = Vector2.pool.create(startPoint.x - cannonBase.x, startPoint.y - transformProperty.get().modelToViewY(heightProperty.get())).angle;
      },
      drag: event => {
        mousePoint = this.globalToLocalPoint(event.pointer.point);
        const mousePointAngle = Vector2.pool.create(mousePoint.x - cannonBase.x, mousePoint.y - transformProperty.get().modelToViewY(heightProperty.get())).angle;
        const angleChange = startPointAngle - mousePointAngle; // radians
        const angleChangeInDegrees = angleChange * 180 / Math.PI; // degrees

        const unboundedNewAngle = startAngle + angleChangeInDegrees;
        const angleRange = heightProperty.get() < 4 ? new Range(ANGLE_RANGE_MINS[heightProperty.get()], 90) : ANGLE_RANGE;

        // mouse dragged angle is within angle range
        if (angleRange.contains(unboundedNewAngle)) {
          const delta = providedOptions?.preciseCannonDelta ? 1 : 5;
          angleProperty.set(Utils.roundSymmetric(unboundedNewAngle / delta) * delta);
        }

        // the current, unchanged, angle is closer to max than min
        else if (angleRange.max + angleRange.min < 2 * angleProperty.get()) {
          angleProperty.set(angleRange.max);
        }

        // the current, unchanged, angle is closer or same distance to min than max
        else {
          angleProperty.set(angleRange.min);
        }
      },
      useInputListenerCursor: true,
      allowTouchSnag: true,
      tandem: options.tandem.createTandem('barrelTopDragListener'),
      phetioEnabledPropertyInstrumented: true
    }));

    // drag listener for controlling the height
    const heightDragListener = new DragListener({
      start: event => {
        startPoint = this.globalToLocalPoint(event.pointer.point);
        startHeight = transformProperty.value.modelToViewY(heightProperty.get()); // view units
      },
      drag: event => {
        mousePoint = this.globalToLocalPoint(event.pointer.point);
        const heightChange = mousePoint.y - startPoint.y;
        const unboundedNewHeight = transformProperty.get().viewToModelY(startHeight + heightChange);

        // mouse dragged height is within height range
        if (HEIGHT_RANGE.contains(unboundedNewHeight)) {
          heightProperty.set(Utils.roundSymmetric(unboundedNewHeight));
        }
        // the current, unchanged, height is closer to max than min
        else if (HEIGHT_RANGE.max + HEIGHT_RANGE.min < 2 * heightProperty.get()) {
          heightProperty.set(HEIGHT_RANGE.max);
        }
        // the current, unchanged, height is closer or same distance to min than max
        else {
          heightProperty.set(HEIGHT_RANGE.min);
        }
      },
      end: () => {
        heightCueingArrows.visible = false;
      },
      useInputListenerCursor: true,
      allowTouchSnag: true,
      tandem: options.tandem.createTandem('heightDragListener'),
      phetioEnabledPropertyInstrumented: true
    });

    // multiple parts of the cannon can be dragged to change height
    cannonBase.addInputListener(heightDragListener);
    cylinderSide.addInputListener(heightDragListener);
    cylinderTop.addInputListener(heightDragListener);
    cannonBarrelBase.addInputListener(heightDragListener);
    heightLabelText.addInputListener(heightDragListener);
    heightCueingArrows.addInputListener(heightDragListener);
    heightDragListener.enabledProperty.linkAttribute(heightCueingArrows, 'visible');
  }
  reset() {
    this.muzzleFlashStage = 1;
    this.heightCueingArrows.visible = this.isIntroScreen;
  }
  flashMuzzle() {
    this.muzzleFlashPlaying = true;
    this.muzzleFlashStage = 0;
  }
}
const muzzleFlashDurationCompleteToAnimationPercentComplete = timePercentComplete => {
  return -Math.pow(2, -10 * timePercentComplete) + 1; //easing out function
};
projectileMotion.register('CannonNode', CannonNode);
export default CannonNode;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSYW5nZSIsIlV0aWxzIiwiVmVjdG9yMiIsIkxpbmVhckZ1bmN0aW9uIiwiU2hhcGUiLCJtZXJnZSIsIlN0cmluZ1V0aWxzIiwiQXJyb3dOb2RlIiwiTWF0aFN5bWJvbHMiLCJDb2xvciIsIkRyYWdMaXN0ZW5lciIsIkltYWdlIiwiTGluZSIsIkxpbmVhckdyYWRpZW50IiwiTm9kZSIsIlBhdGgiLCJSZWN0YW5nbGUiLCJUZXh0IiwiVGFuZGVtIiwiY2Fubm9uQmFycmVsVG9wX3BuZyIsImNhbm5vbkJhcnJlbF9wbmciLCJjYW5ub25CYXNlQm90dG9tX3BuZyIsImNhbm5vbkJhc2VUb3BfcG5nIiwicHJvamVjdGlsZU1vdGlvbiIsIlByb2plY3RpbGVNb3Rpb25TdHJpbmdzIiwiUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cyIsIm9wdGlvbml6ZSIsIm1TdHJpbmciLCJtIiwicGF0dGVybjBWYWx1ZTFVbml0c1N0cmluZyIsInBhdHRlcm4wVmFsdWUxVW5pdHMiLCJwYXR0ZXJuMFZhbHVlMVVuaXRzV2l0aFNwYWNlU3RyaW5nIiwicGF0dGVybjBWYWx1ZTFVbml0c1dpdGhTcGFjZSIsIkNBTk5PTl9MRU5HVEgiLCJFTExJUFNFX1dJRFRIIiwiRUxMSVBTRV9IRUlHSFQiLCJDWUxJTkRFUl9ESVNUQU5DRV9GUk9NX09SSUdJTiIsIkhFSUdIVF9MRUFERVJfTElORV9YIiwiQ1JPU1NIQUlSX0xFTkdUSCIsIkFOR0xFX1JBTkdFIiwiQ0FOTk9OX0FOR0xFX1JBTkdFIiwiSEVJR0hUX1JBTkdFIiwiQ0FOTk9OX0hFSUdIVF9SQU5HRSIsIkxBQkVMX09QVElPTlMiLCJMQUJFTF9URVhUX09QVElPTlMiLCJCUklHSFRfR1JBWV9DT0xPUiIsIkRBUktfR1JBWV9DT0xPUiIsIlRSQU5TUEFSRU5UX1dISVRFIiwiQU5HTEVfUkFOR0VfTUlOUyIsIkNVRUlOR19BUlJPV19PUFRJT05TIiwiZmlsbCIsInN0cm9rZSIsImxpbmVXaWR0aCIsInRhaWxXaWR0aCIsImhlYWRXaWR0aCIsImhlYWRIZWlnaHQiLCJNVVpaTEVfRkxBU0hfU0NBTEVfSU5JVElBTCIsIk1VWlpMRV9GTEFTSF9TQ0FMRV9GSU5BTCIsIk1VWlpMRV9GTEFTSF9PUEFDSVRZX0lOSVRJQUwiLCJNVVpaTEVfRkxBU0hfT1BBQ0lUWV9GSU5BTCIsIk1VWlpMRV9GTEFTSF9EVVJBVElPTiIsIkRFR1JFRVMiLCJvcGFjaXR5TGluZWFyRnVuY3Rpb24iLCJzY2FsZUxpbmVhckZ1bmN0aW9uIiwiQ2Fubm9uTm9kZSIsImNvbnN0cnVjdG9yIiwiaGVpZ2h0UHJvcGVydHkiLCJhbmdsZVByb3BlcnR5IiwibXV6emxlRmxhc2hTdGVwcGVyIiwidHJhbnNmb3JtUHJvcGVydHkiLCJzY3JlZW5WaWV3IiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsInRhbmRlbSIsIlJFUVVJUkVEIiwidmlld09yaWdpbiIsInZhbHVlIiwibW9kZWxUb1ZpZXdQb3NpdGlvbiIsImNsaXBDb250YWluZXIiLCJjeWxpbmRlck5vZGUiLCJ5IiwiYWRkQ2hpbGQiLCJlbGxpcHNlU2hhcGUiLCJlbGxpcHNlIiwiZ3JvdW5kRmlsbCIsImFkZENvbG9yU3RvcCIsImdyb3VuZENpcmNsZSIsInNpZGVGaWxsIiwiY3lsaW5kZXJTaWRlIiwiY3lsaW5kZXJUb3AiLCJjYW5ub25CYXJyZWwiLCJ4IiwiY2Fubm9uQmFycmVsVG9wIiwiY2VudGVyWSIsIm9wYWNpdHkiLCJjYW5ub25CYXJyZWxCYXNlIiwicmlnaHQiLCJjYW5ub25CYXNlIiwiY2Fubm9uQmFzZUJvdHRvbSIsInRvcCIsImNlbnRlclgiLCJjYW5ub25CYXNlVG9wIiwiYm90dG9tIiwidmlld0hlaWdodExlYWRlckxpbmVYIiwibW9kZWxUb1ZpZXdYIiwiaGVpZ2h0TGVhZGVyTGluZSIsIm1vZGVsVG9WaWV3WSIsImdldCIsImxpbmVEYXNoIiwiaGVpZ2h0TGVhZGVyQXJyb3dzIiwiZG91YmxlSGVhZCIsImhlaWdodExlYWRlckxpbmVUb3BDYXAiLCJoZWlnaHRMZWFkZXJMaW5lQm90dG9tQ2FwIiwidGlwWCIsImhlaWdodExhYmVsQmFja2dyb3VuZCIsImhlaWdodExhYmVsT3B0aW9ucyIsInBpY2thYmxlIiwibWF4V2lkdGgiLCJoZWlnaHRMYWJlbFRleHQiLCJmaWxsSW4iLCJ0b0ZpeGVkTnVtYmVyIiwidW5pdHMiLCJjcmVhdGVUYW5kZW0iLCJzZXRNb3VzZUFyZWEiLCJib3VuZHMiLCJkaWxhdGVkWFkiLCJzZXRUb3VjaEFyZWEiLCJoZWlnaHRDdWVpbmdUb3BBcnJvdyIsImhlaWdodEN1ZWluZ0JvdHRvbUFycm93IiwiaGVpZ2h0Q3VlaW5nQXJyb3dzIiwiY2hpbGRyZW4iLCJpc0ludHJvU2NyZWVuIiwiaW5pdGlhbFZhbHVlIiwidmlzaWJsZSIsImFuZ2xlSW5kaWNhdG9yIiwiY3Jvc3NoYWlyU2hhcGUiLCJtb3ZlVG8iLCJsaW5lVG8iLCJjcm9zc2hhaXIiLCJkYXJrZXJDcm9zc2hhaXJTaGFwZSIsImRhcmtlckNyb3NzaGFpciIsImFuZ2xlQXJjIiwiYW5nbGVMYWJlbEJhY2tncm91bmQiLCJhbmdsZUxhYmVsIiwibGVmdCIsInRlYXJEcm9wU2hhcGVTdHJlbmd0aCIsImZsYW1lU2hhcGUiLCJyYWRpdXMiLCJ0IiwiTWF0aCIsIlBJIiwiY29zIiwic2luIiwicG93Iiwib3V0ZXJGbGFtZSIsImlubmVyRmxhbWUiLCJzZXRTY2FsZU1hZ25pdHVkZSIsIm11enpsZUZsYXNoIiwibXV6emxlRmxhc2hQbGF5aW5nIiwibXV6emxlRmxhc2hTdGFnZSIsImFkZExpc3RlbmVyIiwiZHQiLCJhbmltYXRpb25QZXJjZW50Q29tcGxldGUiLCJtdXp6bGVGbGFzaER1cmF0aW9uQ29tcGxldGVUb0FuaW1hdGlvblBlcmNlbnRDb21wbGV0ZSIsImV2YWx1YXRlIiwic2V0Q2hpbGRyZW4iLCJsaW5rIiwiYW5nbGUiLCJzZXRSb3RhdGlvbiIsImFyY1NoYXBlIiwiYXJjIiwic2V0U2hhcGUiLCJzdHJpbmciLCJzZXRSZWN0V2lkdGgiLCJ3aWR0aCIsInNldFJlY3RIZWlnaHQiLCJoZWlnaHQiLCJjZW50ZXIiLCJzY2FsZU1hZ25pdHVkZSIsInVwZGF0ZUhlaWdodCIsInZpZXdIZWlnaHRQb2ludCIsInBvb2wiLCJjcmVhdGUiLCJoZWlnaHRJbkNsaXBDb29yZGluYXRlcyIsImdsb2JhbFRvTG9jYWxQb2ludCIsImxvY2FsVG9HbG9iYWxQb2ludCIsInBhcmVudFRvTG9jYWxQb2ludCIsInNldFkiLCJmcmVlVG9Qb29sIiwic2lkZVNoYXBlIiwiZWxsaXB0aWNhbEFyYyIsImNsb3NlIiwiY2xpcEFyZWEiLCJzZXRDbGlwQXJlYSIsInRyYW5zZm9ybWVkIiwibWF0cml4Iiwic2V0VGFpbEFuZFRpcCIsInRhaWxYIiwidGFpbFkiLCJzZXRMaW5lIiwidGlwWSIsInNldCIsInVwZGF0ZUNhbm5vbkxheW91dCIsIm1vZGVsVG9WaWV3RGVsdGFYIiwibmV3WCIsInN0YXJ0UG9pbnQiLCJzdGFydEFuZ2xlIiwic3RhcnRQb2ludEFuZ2xlIiwibW91c2VQb2ludCIsInN0YXJ0SGVpZ2h0IiwiYWRkSW5wdXRMaXN0ZW5lciIsInN0YXJ0IiwiZXZlbnQiLCJwb2ludGVyIiwicG9pbnQiLCJkcmFnIiwibW91c2VQb2ludEFuZ2xlIiwiYW5nbGVDaGFuZ2UiLCJhbmdsZUNoYW5nZUluRGVncmVlcyIsInVuYm91bmRlZE5ld0FuZ2xlIiwiYW5nbGVSYW5nZSIsImNvbnRhaW5zIiwiZGVsdGEiLCJwcmVjaXNlQ2Fubm9uRGVsdGEiLCJyb3VuZFN5bW1ldHJpYyIsIm1heCIsIm1pbiIsInVzZUlucHV0TGlzdGVuZXJDdXJzb3IiLCJhbGxvd1RvdWNoU25hZyIsInBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCIsImhlaWdodERyYWdMaXN0ZW5lciIsImhlaWdodENoYW5nZSIsInVuYm91bmRlZE5ld0hlaWdodCIsInZpZXdUb01vZGVsWSIsImVuZCIsImVuYWJsZWRQcm9wZXJ0eSIsImxpbmtBdHRyaWJ1dGUiLCJyZXNldCIsImZsYXNoTXV6emxlIiwidGltZVBlcmNlbnRDb21wbGV0ZSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiQ2Fubm9uTm9kZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBDYW5ub24gdmlldy5cclxuICogQW5nbGUgY2FuIGNoYW5nZSB3aGVuIHVzZXIgZHJhZ3MgdGhlIGNhbm5vbiB0aXAuIEhlaWdodCBjYW4gY2hhbmdlIHdoZW4gdXNlciBkcmFncyBjYW5ub24gYmFzZS5cclxuICpcclxuICogQGF1dGhvciBBbmRyZWEgTGluIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBSYW5nZSBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvUmFuZ2UuanMnO1xyXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL1V0aWxzLmpzJztcclxuaW1wb3J0IFZlY3RvcjIgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL1ZlY3RvcjIuanMnO1xyXG5pbXBvcnQgTGluZWFyRnVuY3Rpb24gZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL0xpbmVhckZ1bmN0aW9uLmpzJztcclxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tICcuLi8uLi8uLi8uLi9raXRlL2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgbWVyZ2UgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL21lcmdlLmpzJztcclxuaW1wb3J0IFN0cmluZ1V0aWxzIGZyb20gJy4uLy4uLy4uLy4uL3BoZXRjb21tb24vanMvdXRpbC9TdHJpbmdVdGlscy5qcyc7XHJcbmltcG9ydCBBcnJvd05vZGUgZnJvbSAnLi4vLi4vLi4vLi4vc2NlbmVyeS1waGV0L2pzL0Fycm93Tm9kZS5qcyc7XHJcbmltcG9ydCBNYXRoU3ltYm9scyBmcm9tICcuLi8uLi8uLi8uLi9zY2VuZXJ5LXBoZXQvanMvTWF0aFN5bWJvbHMuanMnO1xyXG5pbXBvcnQgeyBDb2xvciwgRHJhZ0xpc3RlbmVyLCBJbWFnZSwgTGluZSwgTGluZWFyR3JhZGllbnQsIE5vZGUsIE5vZGVPcHRpb25zLCBQYXRoLCBSZWN0YW5nbGUsIFRleHQgfSBmcm9tICcuLi8uLi8uLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uLy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgY2Fubm9uQmFycmVsVG9wX3BuZyBmcm9tICcuLi8uLi8uLi9pbWFnZXMvY2Fubm9uQmFycmVsVG9wX3BuZy5qcyc7XHJcbmltcG9ydCBjYW5ub25CYXJyZWxfcG5nIGZyb20gJy4uLy4uLy4uL21pcG1hcHMvY2Fubm9uQmFycmVsX3BuZy5qcyc7XHJcbmltcG9ydCBjYW5ub25CYXNlQm90dG9tX3BuZyBmcm9tICcuLi8uLi8uLi9taXBtYXBzL2Nhbm5vbkJhc2VCb3R0b21fcG5nLmpzJztcclxuaW1wb3J0IGNhbm5vbkJhc2VUb3BfcG5nIGZyb20gJy4uLy4uLy4uL21pcG1hcHMvY2Fubm9uQmFzZVRvcF9wbmcuanMnO1xyXG5pbXBvcnQgcHJvamVjdGlsZU1vdGlvbiBmcm9tICcuLi8uLi9wcm9qZWN0aWxlTW90aW9uLmpzJztcclxuaW1wb3J0IFByb2plY3RpbGVNb3Rpb25TdHJpbmdzIGZyb20gJy4uLy4uL1Byb2plY3RpbGVNb3Rpb25TdHJpbmdzLmpzJztcclxuaW1wb3J0IFByb2plY3RpbGVNb3Rpb25Db25zdGFudHMgZnJvbSAnLi4vUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cy5qcyc7XHJcbmltcG9ydCBQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IEVtaXR0ZXIgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9FbWl0dGVyLmpzJztcclxuaW1wb3J0IE1vZGVsVmlld1RyYW5zZm9ybTIgZnJvbSAnLi4vLi4vLi4vLi4vcGhldGNvbW1vbi9qcy92aWV3L01vZGVsVmlld1RyYW5zZm9ybTIuanMnO1xyXG5pbXBvcnQgU2NyZWVuVmlldyBmcm9tICcuLi8uLi8uLi8uLi9qb2lzdC9qcy9TY3JlZW5WaWV3LmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuXHJcbi8vIGltYWdlXHJcblxyXG5jb25zdCBtU3RyaW5nID0gUHJvamVjdGlsZU1vdGlvblN0cmluZ3MubTtcclxuY29uc3QgcGF0dGVybjBWYWx1ZTFVbml0c1N0cmluZyA9IFByb2plY3RpbGVNb3Rpb25TdHJpbmdzLnBhdHRlcm4wVmFsdWUxVW5pdHM7XHJcbmNvbnN0IHBhdHRlcm4wVmFsdWUxVW5pdHNXaXRoU3BhY2VTdHJpbmcgPSBQcm9qZWN0aWxlTW90aW9uU3RyaW5ncy5wYXR0ZXJuMFZhbHVlMVVuaXRzV2l0aFNwYWNlO1xyXG5cclxuLy8gY29uc3RhbnRzXHJcbmNvbnN0IENBTk5PTl9MRU5HVEggPSA0OyAvLyBlbXBpcmljYWxseSBkZXRlcm1pbmVkIGluIG1vZGVsIGNvb3Jkc1xyXG5jb25zdCBFTExJUFNFX1dJRFRIID0gNDIwOyAvLyBlbXBpcmljYWxseSBkZXRlcm1pbmVkIGluIHZpZXcgY29vcmRpbmF0ZXNcclxuY29uc3QgRUxMSVBTRV9IRUlHSFQgPSA0MDsgLy8gZW1waXJpY2FsbHkgZGV0ZXJtaW5lZCBpbiB2aWV3IGNvb3JkaW5hdGVzXHJcbmNvbnN0IENZTElOREVSX0RJU1RBTkNFX0ZST01fT1JJR0lOID0gMS4zOyAvLyBlbXBpcmljYWxseSBkZXRlcm1pbmVkIGluIG1vZGVsIGNvb3JkcyBhcyBpdCBuZWVkcyB0byB1cGRhdGUgZWFjaCB0aW1lIHRoZSBtdnQgY2hhbmdlc1xyXG5jb25zdCBIRUlHSFRfTEVBREVSX0xJTkVfWCA9IC0xLjU7IC8vIGVtcGlyaWNhbGx5IGRldGVybWluZWQgaW4gdmlldyBjb29yZHNcclxuY29uc3QgQ1JPU1NIQUlSX0xFTkdUSCA9IDEyMDsgLy8gZW1waXJpY2FsbHkgZGV0ZXJtaW5lZCBpbiB2aWV3IGNvb3Jkc1xyXG5jb25zdCBBTkdMRV9SQU5HRSA9IFByb2plY3RpbGVNb3Rpb25Db25zdGFudHMuQ0FOTk9OX0FOR0xFX1JBTkdFO1xyXG5jb25zdCBIRUlHSFRfUkFOR0UgPSBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLkNBTk5PTl9IRUlHSFRfUkFOR0U7XHJcbmNvbnN0IExBQkVMX09QVElPTlMgPSBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLkxBQkVMX1RFWFRfT1BUSU9OUztcclxuY29uc3QgQlJJR0hUX0dSQVlfQ09MT1IgPSBuZXcgQ29sb3IoIDIzMCwgMjMwLCAyMzAsIDEgKTtcclxuY29uc3QgREFSS19HUkFZX0NPTE9SID0gbmV3IENvbG9yKCAxMDMsIDEwMywgMTAzLCAxICk7XHJcbmNvbnN0IFRSQU5TUEFSRU5UX1dISVRFID0gJ3JnYmEoIDI1NSwgMjU1LCAyNTUsIDAuNiApJztcclxuY29uc3QgQU5HTEVfUkFOR0VfTUlOUyA9IFsgNSwgLTUsIC0yMCwgLTQwIF07IC8vIGFuZ2xlIHJhbmdlIG1pbmltdW1zLCBjb3JyZXNwb25kaW5nIHRvIGhlaWdodCB0aHJvdWdoIHRoZWlyIGluZGV4XHJcbmNvbnN0IENVRUlOR19BUlJPV19PUFRJT05TID0ge1xyXG4gIGZpbGw6ICdyZ2IoIDEwMCwgMjAwLCAyNTUgKScsXHJcbiAgc3Ryb2tlOiAnYmxhY2snLFxyXG4gIGxpbmVXaWR0aDogMSxcclxuICB0YWlsV2lkdGg6IDgsXHJcbiAgaGVhZFdpZHRoOiAxNCxcclxuICBoZWFkSGVpZ2h0OiA2XHJcbn07XHJcblxyXG5jb25zdCBNVVpaTEVfRkxBU0hfU0NBTEVfSU5JVElBTCA9IDAuNDtcclxuY29uc3QgTVVaWkxFX0ZMQVNIX1NDQUxFX0ZJTkFMID0gMS41O1xyXG5jb25zdCBNVVpaTEVfRkxBU0hfT1BBQ0lUWV9JTklUSUFMID0gMTtcclxuY29uc3QgTVVaWkxFX0ZMQVNIX09QQUNJVFlfRklOQUwgPSAwO1xyXG5jb25zdCBNVVpaTEVfRkxBU0hfRFVSQVRJT04gPSAwLjQ7IC8vc2Vjb25kc1xyXG5cclxuY29uc3QgREVHUkVFUyA9IE1hdGhTeW1ib2xzLkRFR1JFRVM7XHJcblxyXG5jb25zdCBvcGFjaXR5TGluZWFyRnVuY3Rpb24gPSBuZXcgTGluZWFyRnVuY3Rpb24oIDAsIDEsIE1VWlpMRV9GTEFTSF9PUEFDSVRZX0lOSVRJQUwsIE1VWlpMRV9GTEFTSF9PUEFDSVRZX0ZJTkFMICk7XHJcbmNvbnN0IHNjYWxlTGluZWFyRnVuY3Rpb24gPSBuZXcgTGluZWFyRnVuY3Rpb24oIDAsIDEsIE1VWlpMRV9GTEFTSF9TQ0FMRV9JTklUSUFMLCBNVVpaTEVfRkxBU0hfU0NBTEVfRklOQUwgKTtcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcbiAgcmVuZGVyZXI6IHN0cmluZyB8IG51bGw7XHJcbiAgcHJlY2lzZUNhbm5vbkRlbHRhOiBib29sZWFuO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgQ2Fubm9uTm9kZU9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIE5vZGVPcHRpb25zO1xyXG5cclxuY2xhc3MgQ2Fubm9uTm9kZSBleHRlbmRzIE5vZGUge1xyXG4gIHByaXZhdGUgaXNJbnRyb1NjcmVlbjogYm9vbGVhbjtcclxuICBwcml2YXRlIGhlaWdodEN1ZWluZ0Fycm93czogTm9kZTtcclxuICBwcml2YXRlIG11enpsZUZsYXNoUGxheWluZzogYm9vbGVhbjtcclxuICBwcml2YXRlIG11enpsZUZsYXNoU3RhZ2U6IG51bWJlcjtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBoZWlnaHRQcm9wZXJ0eTogUHJvcGVydHk8bnVtYmVyPiwgYW5nbGVQcm9wZXJ0eTogUHJvcGVydHk8bnVtYmVyPiwgbXV6emxlRmxhc2hTdGVwcGVyOiBFbWl0dGVyPG51bWJlcltdPixcclxuICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVByb3BlcnR5OiBQcm9wZXJ0eTxNb2RlbFZpZXdUcmFuc2Zvcm0yPiwgc2NyZWVuVmlldzogU2NyZWVuVmlldywgcHJvdmlkZWRPcHRpb25zPzogQ2Fubm9uTm9kZU9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxDYW5ub25Ob2RlT3B0aW9ucywgU2VsZk9wdGlvbnMsIE5vZGVPcHRpb25zPigpKCB7XHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLlJFUVVJUkVEXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBzdXBlciggb3B0aW9ucyApO1xyXG5cclxuICAgIC8vIHdoZXJlIHRoZSBwcm9qZWN0aWxlIGlzIGZpcmVkIGZyb21cclxuICAgIGNvbnN0IHZpZXdPcmlnaW4gPSB0cmFuc2Zvcm1Qcm9wZXJ0eS52YWx1ZS5tb2RlbFRvVmlld1Bvc2l0aW9uKCBuZXcgVmVjdG9yMiggMCwgMCApICk7XHJcblxyXG4gICAgLy8gdGhlIGNhbm5vbiwgbXV6emxlIGZsYXNoLCBhbmQgcGVkZXN0YWwgYXJlIG5vdCB2aXNpYmxlIHVuZGVyZ3JvdW5kXHJcbiAgICBjb25zdCBjbGlwQ29udGFpbmVyID0gbmV3IE5vZGUoKTsgLy8gbm8gdHJhbnNmb3JtLCBqdXN0IGZvciBjbGlwIGFyZWFcclxuXHJcbiAgICBjb25zdCBjeWxpbmRlck5vZGUgPSBuZXcgTm9kZSgge1xyXG4gICAgICB5OiB2aWV3T3JpZ2luLnlcclxuICAgIH0gKTtcclxuICAgIGNsaXBDb250YWluZXIuYWRkQ2hpbGQoIGN5bGluZGVyTm9kZSApO1xyXG5cclxuICAgIC8vIHNoYXBlIHVzZWQgZm9yIGdyb3VuZCBjaXJjbGUgYW5kIHRvcCBvZiBwZWRlc3RhbFxyXG4gICAgY29uc3QgZWxsaXBzZVNoYXBlID0gU2hhcGUuZWxsaXBzZSggMCwgMCwgRUxMSVBTRV9XSURUSCAvIDIsIEVMTElQU0VfSEVJR0hUIC8gMiwgMCApO1xyXG5cclxuICAgIC8vIGdyb3VuZCBjaXJjbGUsIHdoaWNoIHNob3dzIHRoZSBcImluc2lkZVwiIG9mIHRoZSBjaXJjdWxhciBob2xlIHRoYXQgdGhlIGNhbm5vbiBpcyBzaXR0aW5nIGluXHJcbiAgICBjb25zdCBncm91bmRGaWxsID0gbmV3IExpbmVhckdyYWRpZW50KCAtRUxMSVBTRV9XSURUSCAvIDIsIDAsIEVMTElQU0VfV0lEVEggLyAyLCAwIClcclxuICAgICAgLmFkZENvbG9yU3RvcCggMC4wLCAnZ3JheScgKVxyXG4gICAgICAuYWRkQ29sb3JTdG9wKCAwLjMsICd3aGl0ZScgKVxyXG4gICAgICAuYWRkQ29sb3JTdG9wKCAxLCAnZ3JheScgKTtcclxuICAgIGNvbnN0IGdyb3VuZENpcmNsZSA9IG5ldyBQYXRoKCBlbGxpcHNlU2hhcGUsIHtcclxuICAgICAgeTogdmlld09yaWdpbi55LFxyXG4gICAgICBmaWxsOiBncm91bmRGaWxsLFxyXG4gICAgICBzdHJva2U6IEJSSUdIVF9HUkFZX0NPTE9SXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gc2lkZSBvZiB0aGUgY3lsaW5kZXJcclxuICAgIGNvbnN0IHNpZGVGaWxsID0gbmV3IExpbmVhckdyYWRpZW50KCAtRUxMSVBTRV9XSURUSCAvIDIsIDAsIEVMTElQU0VfV0lEVEggLyAyLCAwIClcclxuICAgICAgLmFkZENvbG9yU3RvcCggMC4wLCBEQVJLX0dSQVlfQ09MT1IgKVxyXG4gICAgICAuYWRkQ29sb3JTdG9wKCAwLjMsIEJSSUdIVF9HUkFZX0NPTE9SIClcclxuICAgICAgLmFkZENvbG9yU3RvcCggMSwgREFSS19HUkFZX0NPTE9SICk7XHJcbiAgICBjb25zdCBjeWxpbmRlclNpZGUgPSBuZXcgUGF0aCggbnVsbCwgeyBmaWxsOiBzaWRlRmlsbCwgc3Ryb2tlOiBCUklHSFRfR1JBWV9DT0xPUiB9ICk7XHJcbiAgICBjeWxpbmRlck5vZGUuYWRkQ2hpbGQoIGN5bGluZGVyU2lkZSApO1xyXG5cclxuICAgIC8vIHRvcCBvZiB0aGUgY3lsaW5kZXJcclxuICAgIGNvbnN0IGN5bGluZGVyVG9wID0gbmV3IFBhdGgoIGVsbGlwc2VTaGFwZSwgeyBmaWxsOiBEQVJLX0dSQVlfQ09MT1IsIHN0cm9rZTogQlJJR0hUX0dSQVlfQ09MT1IgfSApO1xyXG4gICAgY3lsaW5kZXJOb2RlLmFkZENoaWxkKCBjeWxpbmRlclRvcCApO1xyXG5cclxuICAgIC8vIGNhbm5vblxyXG4gICAgY29uc3QgY2Fubm9uQmFycmVsID0gbmV3IE5vZGUoIHtcclxuICAgICAgeDogdmlld09yaWdpbi54LFxyXG4gICAgICB5OiB2aWV3T3JpZ2luLnlcclxuICAgIH0gKTtcclxuICAgIGNsaXBDb250YWluZXIuYWRkQ2hpbGQoIGNhbm5vbkJhcnJlbCApO1xyXG5cclxuICAgIC8vIEEgY29weSBvZiB0aGUgdG9wIHBhcnQgb2YgdGhlIGNhbm5vbiBiYXJyZWwgdG8gMSkgZ3JhYiBhbmQgY2hhbmdlIGFuZ2xlIGFuZCAyKSBsYXlvdXQgdGhlIGNhbm5vbkJhcnJlbFxyXG4gICAgY29uc3QgY2Fubm9uQmFycmVsVG9wID0gbmV3IEltYWdlKCBjYW5ub25CYXJyZWxUb3BfcG5nLCB7IGNlbnRlclk6IDAsIG9wYWNpdHk6IDAgfSApO1xyXG4gICAgY29uc3QgY2Fubm9uQmFycmVsQmFzZSA9IG5ldyBJbWFnZSggY2Fubm9uQmFycmVsX3BuZywgeyBjZW50ZXJZOiAwLCByaWdodDogY2Fubm9uQmFycmVsVG9wLnJpZ2h0IH0gKTtcclxuXHJcbiAgICBjYW5ub25CYXJyZWwuYWRkQ2hpbGQoIGNhbm5vbkJhcnJlbEJhc2UgKTtcclxuICAgIGNhbm5vbkJhcnJlbC5hZGRDaGlsZCggY2Fubm9uQmFycmVsVG9wICk7XHJcblxyXG4gICAgY29uc3QgY2Fubm9uQmFzZSA9IG5ldyBOb2RlKCB7XHJcbiAgICAgIHg6IHZpZXdPcmlnaW4ueCxcclxuICAgICAgeTogdmlld09yaWdpbi55XHJcbiAgICB9ICk7XHJcbiAgICBjbGlwQ29udGFpbmVyLmFkZENoaWxkKCBjYW5ub25CYXNlICk7XHJcblxyXG4gICAgY29uc3QgY2Fubm9uQmFzZUJvdHRvbSA9IG5ldyBJbWFnZSggY2Fubm9uQmFzZUJvdHRvbV9wbmcsIHsgdG9wOiAwLCBjZW50ZXJYOiAwIH0gKTtcclxuICAgIGNhbm5vbkJhc2UuYWRkQ2hpbGQoIGNhbm5vbkJhc2VCb3R0b20gKTtcclxuICAgIGNvbnN0IGNhbm5vbkJhc2VUb3AgPSBuZXcgSW1hZ2UoIGNhbm5vbkJhc2VUb3BfcG5nLCB7IGJvdHRvbTogMCwgY2VudGVyWDogMCB9ICk7XHJcbiAgICBjYW5ub25CYXNlLmFkZENoaWxkKCBjYW5ub25CYXNlVG9wICk7XHJcblxyXG4gICAgY29uc3Qgdmlld0hlaWdodExlYWRlckxpbmVYID0gdHJhbnNmb3JtUHJvcGVydHkudmFsdWUubW9kZWxUb1ZpZXdYKCBIRUlHSFRfTEVBREVSX0xJTkVfWCApO1xyXG5cclxuICAgIC8vIGFkZCBkYXNoZWQgbGluZSBmb3IgaW5kaWNhdGluZyB0aGUgaGVpZ2h0XHJcbiAgICBjb25zdCBoZWlnaHRMZWFkZXJMaW5lID0gbmV3IExpbmUoXHJcbiAgICAgIHZpZXdIZWlnaHRMZWFkZXJMaW5lWCxcclxuICAgICAgdmlld09yaWdpbi55LFxyXG4gICAgICB2aWV3SGVpZ2h0TGVhZGVyTGluZVgsXHJcbiAgICAgIHRyYW5zZm9ybVByb3BlcnR5LnZhbHVlLm1vZGVsVG9WaWV3WSggaGVpZ2h0UHJvcGVydHkuZ2V0KCkgKSwge1xyXG4gICAgICAgIHN0cm9rZTogJ2JsYWNrJyxcclxuICAgICAgICBsaW5lRGFzaDogWyA1LCA1IF1cclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBhZGRlZCBhcnJvd3MgZm9yIGluZGljYXRpbmcgaGVpZ2h0XHJcbiAgICBjb25zdCBoZWlnaHRMZWFkZXJBcnJvd3MgPSBuZXcgQXJyb3dOb2RlKFxyXG4gICAgICB2aWV3SGVpZ2h0TGVhZGVyTGluZVgsXHJcbiAgICAgIHZpZXdPcmlnaW4ueSxcclxuICAgICAgdmlld0hlaWdodExlYWRlckxpbmVYLFxyXG4gICAgICB0cmFuc2Zvcm1Qcm9wZXJ0eS52YWx1ZS5tb2RlbFRvVmlld1koIGhlaWdodFByb3BlcnR5LmdldCgpICksIHtcclxuICAgICAgICBoZWFkSGVpZ2h0OiA1LFxyXG4gICAgICAgIGhlYWRXaWR0aDogNSxcclxuICAgICAgICB0YWlsV2lkdGg6IDAsXHJcbiAgICAgICAgbGluZVdpZHRoOiAwLFxyXG4gICAgICAgIGRvdWJsZUhlYWQ6IHRydWVcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBkcmF3IHRoZSBsaW5lIGNhcHMgZm9yIHRoZSBoZWlnaHQgbGVhZGVyIGxpbmVcclxuXHJcbiAgICBjb25zdCBoZWlnaHRMZWFkZXJMaW5lVG9wQ2FwID0gbmV3IExpbmUoIC02LCAwLCA2LCAwLCB7XHJcbiAgICAgIHN0cm9rZTogJ2JsYWNrJyxcclxuICAgICAgbGluZVdpZHRoOiAyXHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3QgaGVpZ2h0TGVhZGVyTGluZUJvdHRvbUNhcCA9IG5ldyBMaW5lKCAtNiwgMCwgNiwgMCwge1xyXG4gICAgICBzdHJva2U6ICdibGFjaycsXHJcbiAgICAgIGxpbmVXaWR0aDogMlxyXG4gICAgfSApO1xyXG4gICAgaGVpZ2h0TGVhZGVyTGluZUJvdHRvbUNhcC54ID0gaGVpZ2h0TGVhZGVyQXJyb3dzLnRpcFg7XHJcbiAgICBoZWlnaHRMZWFkZXJMaW5lQm90dG9tQ2FwLnkgPSB2aWV3T3JpZ2luLnk7XHJcblxyXG4gICAgLy8gaGVpZ2h0IHJlYWRvdXRcclxuICAgIGNvbnN0IGhlaWdodExhYmVsQmFja2dyb3VuZCA9IG5ldyBSZWN0YW5nbGUoIDAsIDAsIDAsIDAsIHsgZmlsbDogVFJBTlNQQVJFTlRfV0hJVEUgfSApO1xyXG4gICAgY29uc3QgaGVpZ2h0TGFiZWxPcHRpb25zID0gbWVyZ2UoIHtcclxuICAgICAgcGlja2FibGU6IHRydWUsXHJcbiAgICAgIG1heFdpZHRoOiA0MCAvLyBlbXBpcmljYWxseSBkZXRlcm1pbmVkXHJcbiAgICB9LCBMQUJFTF9PUFRJT05TICk7XHJcbiAgICBjb25zdCBoZWlnaHRMYWJlbFRleHQgPSBuZXcgVGV4dCggU3RyaW5nVXRpbHMuZmlsbEluKCBwYXR0ZXJuMFZhbHVlMVVuaXRzV2l0aFNwYWNlU3RyaW5nLCB7XHJcbiAgICAgIHZhbHVlOiBVdGlscy50b0ZpeGVkTnVtYmVyKCBoZWlnaHRQcm9wZXJ0eS5nZXQoKSwgMiApLFxyXG4gICAgICB1bml0czogbVN0cmluZyxcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdoZWlnaHRMYWJlbFRleHQnIClcclxuICAgIH0gKSwgaGVpZ2h0TGFiZWxPcHRpb25zICk7XHJcbiAgICBoZWlnaHRMYWJlbFRleHQuc2V0TW91c2VBcmVhKCBoZWlnaHRMYWJlbFRleHQuYm91bmRzLmRpbGF0ZWRYWSggOCwgMTAgKSApO1xyXG4gICAgaGVpZ2h0TGFiZWxUZXh0LnNldFRvdWNoQXJlYSggaGVpZ2h0TGFiZWxUZXh0LmJvdW5kcy5kaWxhdGVkWFkoIDEwLCAxMiApICk7XHJcbiAgICBoZWlnaHRMYWJlbFRleHQuY2VudGVyWCA9IGhlaWdodExlYWRlckFycm93cy50aXBYO1xyXG5cclxuICAgIC8vIGN1ZWluZyBhcnJvdyBmb3IgZHJhZ2dpbmcgaGVpZ2h0XHJcbiAgICBjb25zdCBoZWlnaHRDdWVpbmdUb3BBcnJvdyA9IG5ldyBBcnJvd05vZGUoIDAsIC0xMiwgMCwgLTI3LCBDVUVJTkdfQVJST1dfT1BUSU9OUyApO1xyXG4gICAgY29uc3QgaGVpZ2h0Q3VlaW5nQm90dG9tQXJyb3cgPSBuZXcgQXJyb3dOb2RlKCAwLCAxNywgMCwgMzIsIENVRUlOR19BUlJPV19PUFRJT05TICk7XHJcbiAgICBjb25zdCBoZWlnaHRDdWVpbmdBcnJvd3MgPSBuZXcgTm9kZSggeyBjaGlsZHJlbjogWyBoZWlnaHRDdWVpbmdUb3BBcnJvdywgaGVpZ2h0Q3VlaW5nQm90dG9tQXJyb3cgXSB9ICk7XHJcbiAgICBoZWlnaHRDdWVpbmdBcnJvd3MuY2VudGVyWCA9IGhlaWdodExlYWRlckFycm93cy50aXBYO1xyXG5cclxuICAgIHRoaXMuaXNJbnRyb1NjcmVlbiA9ICggaGVpZ2h0UHJvcGVydHkuaW5pdGlhbFZhbHVlICE9PSAwICk7XHJcbiAgICB0aGlzLmhlaWdodEN1ZWluZ0Fycm93cyA9IGhlaWdodEN1ZWluZ0Fycm93cztcclxuXHJcbiAgICAvLyBjdWVpbmcgYXJyb3cgb25seSB2aXNpYmxlIG9uIGludHJvIHNjcmVlblxyXG4gICAgaGVpZ2h0Q3VlaW5nQXJyb3dzLnZpc2libGUgPSB0aGlzLmlzSW50cm9TY3JlZW47XHJcblxyXG4gICAgLy8gYW5nbGUgaW5kaWNhdG9yXHJcbiAgICBjb25zdCBhbmdsZUluZGljYXRvciA9IG5ldyBOb2RlKCk7XHJcbiAgICBhbmdsZUluZGljYXRvci54ID0gdmlld09yaWdpbi54OyAvLyBjZW50ZXJlZCBhdCB0aGUgb3JpZ2luLCBpbmRlcGVuZGVudCBvZiB0aGUgY3lsaW5kZXIgcG9zaXRpb25cclxuXHJcbiAgICAvLyBjcm9zc2hhaXIgdmlld1xyXG4gICAgY29uc3QgY3Jvc3NoYWlyU2hhcGUgPSBuZXcgU2hhcGUoKVxyXG4gICAgICAubW92ZVRvKCAtQ1JPU1NIQUlSX0xFTkdUSCAvIDQsIDAgKVxyXG4gICAgICAubGluZVRvKCBDUk9TU0hBSVJfTEVOR1RILCAwIClcclxuICAgICAgLm1vdmVUbyggMCwgLUNST1NTSEFJUl9MRU5HVEggKVxyXG4gICAgICAubGluZVRvKCAwLCBDUk9TU0hBSVJfTEVOR1RIICk7XHJcblxyXG4gICAgY29uc3QgY3Jvc3NoYWlyID0gbmV3IFBhdGgoIGNyb3NzaGFpclNoYXBlLCB7IHN0cm9rZTogJ2dyYXknIH0gKTtcclxuICAgIGFuZ2xlSW5kaWNhdG9yLmFkZENoaWxkKCBjcm9zc2hhaXIgKTtcclxuXHJcbiAgICBjb25zdCBkYXJrZXJDcm9zc2hhaXJTaGFwZSA9IG5ldyBTaGFwZSgpXHJcbiAgICAgIC5tb3ZlVG8oIC1DUk9TU0hBSVJfTEVOR1RIIC8gMTUsIDAgKVxyXG4gICAgICAubGluZVRvKCBDUk9TU0hBSVJfTEVOR1RIIC8gMTUsIDAgKVxyXG4gICAgICAubW92ZVRvKCAwLCAtQ1JPU1NIQUlSX0xFTkdUSCAvIDE1IClcclxuICAgICAgLmxpbmVUbyggMCwgQ1JPU1NIQUlSX0xFTkdUSCAvIDE1ICk7XHJcblxyXG4gICAgY29uc3QgZGFya2VyQ3Jvc3NoYWlyID0gbmV3IFBhdGgoIGRhcmtlckNyb3NzaGFpclNoYXBlLCB7IHN0cm9rZTogJ2JsYWNrJywgbGluZVdpZHRoOiAzIH0gKTtcclxuICAgIGFuZ2xlSW5kaWNhdG9yLmFkZENoaWxkKCBkYXJrZXJDcm9zc2hhaXIgKTtcclxuXHJcbiAgICAvLyB2aWV3IGZvciB0aGUgYW5nbGUgYXJjXHJcbiAgICBjb25zdCBhbmdsZUFyYyA9IG5ldyBQYXRoKCBudWxsLCB7IHN0cm9rZTogJ2dyYXknIH0gKTtcclxuICAgIGFuZ2xlSW5kaWNhdG9yLmFkZENoaWxkKCBhbmdsZUFyYyApO1xyXG5cclxuICAgIC8vIGFuZ2xlIHJlYWRvdXRcclxuICAgIGNvbnN0IGFuZ2xlTGFiZWxCYWNrZ3JvdW5kID0gbmV3IFJlY3RhbmdsZSggMCwgMCwgMCwgMCwgeyBmaWxsOiBUUkFOU1BBUkVOVF9XSElURSB9ICk7XHJcbiAgICBhbmdsZUluZGljYXRvci5hZGRDaGlsZCggYW5nbGVMYWJlbEJhY2tncm91bmQgKTtcclxuICAgIGNvbnN0IGFuZ2xlTGFiZWwgPSBuZXcgVGV4dCggU3RyaW5nVXRpbHMuZmlsbEluKCBwYXR0ZXJuMFZhbHVlMVVuaXRzU3RyaW5nLCB7XHJcbiAgICAgIHZhbHVlOiBVdGlscy50b0ZpeGVkTnVtYmVyKCBhbmdsZVByb3BlcnR5LmdldCgpLCAyICksXHJcbiAgICAgIHVuaXRzOiBERUdSRUVTXHJcbiAgICB9ICksIExBQkVMX09QVElPTlMgKTtcclxuICAgIGFuZ2xlTGFiZWwuYm90dG9tID0gLTU7XHJcbiAgICBhbmdsZUxhYmVsLmxlZnQgPSBDUk9TU0hBSVJfTEVOR1RIICogMiAvIDMgKyAxMDtcclxuICAgIGFuZ2xlSW5kaWNhdG9yLmFkZENoaWxkKCBhbmdsZUxhYmVsICk7XHJcblxyXG4gICAgLy8gbXV6emxlIGZsYXNoXHJcblxyXG4gICAgLy8gdGhlIGZsYW1lcyBhcmUgdGhlIHNoYXBlIG9mIHRlYXIgZHJvcHNcclxuICAgIGNvbnN0IHRlYXJEcm9wU2hhcGVTdHJlbmd0aCA9IDM7XHJcbiAgICBjb25zdCBmbGFtZVNoYXBlID0gbmV3IFNoYXBlKCk7XHJcbiAgICBjb25zdCByYWRpdXMgPSAxMDA7IC8vIGluIHZpZXcgY29vcmRpbmF0ZXNcclxuICAgIGZsYW1lU2hhcGUubW92ZVRvKCAtcmFkaXVzLCAwICk7XHJcbiAgICBsZXQgdDtcclxuICAgIGZvciAoIHQgPSBNYXRoLlBJIC8gMjQ7IHQgPCAyICogTWF0aC5QSTsgdCArPSBNYXRoLlBJIC8gMjQgKSB7XHJcbiAgICAgIGNvbnN0IHggPSBNYXRoLmNvcyggdCApICogcmFkaXVzO1xyXG4gICAgICBjb25zdCB5ID0gTWF0aC5zaW4oIHQgKSAqIE1hdGgucG93KCBNYXRoLnNpbiggMC41ICogdCApLCB0ZWFyRHJvcFNoYXBlU3RyZW5ndGggKSAqIHJhZGl1cztcclxuICAgICAgZmxhbWVTaGFwZS5saW5lVG8oIHgsIHkgKTtcclxuICAgIH1cclxuICAgIGZsYW1lU2hhcGUubGluZVRvKCAtcmFkaXVzLCAwICk7XHJcblxyXG4gICAgLy8gY3JlYXRlIHBhdGhzIGJhc2VkIG9uIHNoYXBlXHJcbiAgICBjb25zdCBvdXRlckZsYW1lID0gbmV3IFBhdGgoIGZsYW1lU2hhcGUsIHsgZmlsbDogJ3JnYiggMjU1LCAyNTUsIDAgKScsIHN0cm9rZTogbnVsbCB9ICk7XHJcbiAgICBjb25zdCBpbm5lckZsYW1lID0gbmV3IFBhdGgoIGZsYW1lU2hhcGUsIHsgZmlsbDogJ3JnYiggMjU1LCAyMDAsIDAgKScsIHN0cm9rZTogbnVsbCB9ICk7XHJcbiAgICBpbm5lckZsYW1lLnNldFNjYWxlTWFnbml0dWRlKCAwLjcgKTtcclxuICAgIG91dGVyRmxhbWUubGVmdCA9IDA7XHJcbiAgICBpbm5lckZsYW1lLmxlZnQgPSAwO1xyXG4gICAgY29uc3QgbXV6emxlRmxhc2ggPSBuZXcgTm9kZSgge1xyXG4gICAgICBvcGFjaXR5OiAwLFxyXG4gICAgICB4OiBjYW5ub25CYXJyZWxUb3AucmlnaHQsXHJcbiAgICAgIHk6IDAsXHJcbiAgICAgIGNoaWxkcmVuOiBbIG91dGVyRmxhbWUsIGlubmVyRmxhbWUgXVxyXG4gICAgfSApO1xyXG4gICAgY2Fubm9uQmFycmVsLmFkZENoaWxkKCBtdXp6bGVGbGFzaCApO1xyXG5cclxuICAgIHRoaXMubXV6emxlRmxhc2hQbGF5aW5nID0gZmFsc2U7XHJcbiAgICB0aGlzLm11enpsZUZsYXNoU3RhZ2UgPSAwOyAvLyAwIG1lYW5zIGFuaW1hdGlvbiBzdGFydGluZywgMSBtZWFucyBhbmltYXRpb24gZW5kZWQuXHJcblxyXG4gICAgLy8gTGlzdGVuIHRvIHRoZSBtdXp6bGVGbGFzaFN0ZXBwZXIgdG8gc3RlcCB0aGUgbXV6emxlIGZsYXNoIGFuaW1hdGlvblxyXG4gICAgbXV6emxlRmxhc2hTdGVwcGVyLmFkZExpc3RlbmVyKCAoIGR0OiBudW1iZXIgKTogdm9pZCA9PiB7XHJcbiAgICAgIGlmICggdGhpcy5tdXp6bGVGbGFzaFBsYXlpbmcgKSB7XHJcbiAgICAgICAgaWYgKCB0aGlzLm11enpsZUZsYXNoU3RhZ2UgPCAxICkge1xyXG4gICAgICAgICAgY29uc3QgYW5pbWF0aW9uUGVyY2VudENvbXBsZXRlID0gbXV6emxlRmxhc2hEdXJhdGlvbkNvbXBsZXRlVG9BbmltYXRpb25QZXJjZW50Q29tcGxldGUoIHRoaXMubXV6emxlRmxhc2hTdGFnZSApO1xyXG4gICAgICAgICAgbXV6emxlRmxhc2gub3BhY2l0eSA9IG9wYWNpdHlMaW5lYXJGdW5jdGlvbi5ldmFsdWF0ZSggYW5pbWF0aW9uUGVyY2VudENvbXBsZXRlICk7XHJcbiAgICAgICAgICBtdXp6bGVGbGFzaC5zZXRTY2FsZU1hZ25pdHVkZSggc2NhbGVMaW5lYXJGdW5jdGlvbi5ldmFsdWF0ZSggYW5pbWF0aW9uUGVyY2VudENvbXBsZXRlICkgKTtcclxuICAgICAgICAgIHRoaXMubXV6emxlRmxhc2hTdGFnZSArPSAoIGR0IC8gTVVaWkxFX0ZMQVNIX0RVUkFUSU9OICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgbXV6emxlRmxhc2gub3BhY2l0eSA9IE1VWlpMRV9GTEFTSF9PUEFDSVRZX0ZJTkFMO1xyXG4gICAgICAgICAgbXV6emxlRmxhc2guc2V0U2NhbGVNYWduaXR1ZGUoIE1VWlpMRV9GTEFTSF9TQ0FMRV9GSU5BTCApO1xyXG4gICAgICAgICAgdGhpcy5tdXp6bGVGbGFzaFBsYXlpbmcgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyByZW5kZXJpbmcgb3JkZXJcclxuICAgIHRoaXMuc2V0Q2hpbGRyZW4oIFtcclxuICAgICAgZ3JvdW5kQ2lyY2xlLFxyXG4gICAgICBjbGlwQ29udGFpbmVyLFxyXG4gICAgICBoZWlnaHRMZWFkZXJMaW5lLFxyXG4gICAgICBoZWlnaHRMZWFkZXJBcnJvd3MsXHJcbiAgICAgIGhlaWdodExlYWRlckxpbmVUb3BDYXAsXHJcbiAgICAgIGhlaWdodExlYWRlckxpbmVCb3R0b21DYXAsXHJcbiAgICAgIGhlaWdodExhYmVsQmFja2dyb3VuZCxcclxuICAgICAgaGVpZ2h0TGFiZWxUZXh0LFxyXG4gICAgICBoZWlnaHRDdWVpbmdBcnJvd3MsXHJcbiAgICAgIGFuZ2xlSW5kaWNhdG9yXHJcbiAgICBdICk7XHJcblxyXG4gICAgLy8gT2JzZXJ2ZSBjaGFuZ2VzIGluIG1vZGVsIGFuZ2xlIGFuZCB1cGRhdGUgdGhlIGNhbm5vbiB2aWV3XHJcbiAgICBhbmdsZVByb3BlcnR5LmxpbmsoIGFuZ2xlID0+IHtcclxuICAgICAgY2Fubm9uQmFycmVsLnNldFJvdGF0aW9uKCAtYW5nbGUgKiBNYXRoLlBJIC8gMTgwICk7XHJcbiAgICAgIGNvbnN0IGFyY1NoYXBlID0gYW5nbGUgPiAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgPyBTaGFwZS5hcmMoIDAsIDAsIENST1NTSEFJUl9MRU5HVEggKiAyIC8gMywgMCwgLWFuZ2xlICogTWF0aC5QSSAvIDE4MCwgdHJ1ZSApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgOiBTaGFwZS5hcmMoIDAsIDAsIENST1NTSEFJUl9MRU5HVEggKiAyIC8gMywgMCwgLWFuZ2xlICogTWF0aC5QSSAvIDE4MCApO1xyXG4gICAgICBhbmdsZUFyYy5zZXRTaGFwZSggYXJjU2hhcGUgKTtcclxuICAgICAgYW5nbGVMYWJlbC5zdHJpbmcgPSBTdHJpbmdVdGlscy5maWxsSW4oIHBhdHRlcm4wVmFsdWUxVW5pdHNTdHJpbmcsIHtcclxuICAgICAgICB2YWx1ZTogVXRpbHMudG9GaXhlZE51bWJlciggYW5nbGVQcm9wZXJ0eS5nZXQoKSwgMiApLFxyXG4gICAgICAgIHVuaXRzOiBERUdSRUVTXHJcbiAgICAgIH0gKTtcclxuICAgICAgYW5nbGVMYWJlbEJhY2tncm91bmQuc2V0UmVjdFdpZHRoKCBhbmdsZUxhYmVsLndpZHRoICsgMiApO1xyXG4gICAgICBhbmdsZUxhYmVsQmFja2dyb3VuZC5zZXRSZWN0SGVpZ2h0KCBhbmdsZUxhYmVsLmhlaWdodCApO1xyXG4gICAgICBhbmdsZUxhYmVsQmFja2dyb3VuZC5jZW50ZXIgPSBhbmdsZUxhYmVsLmNlbnRlcjtcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBzdGFydHMgYXQgMSwgYnV0IGlzIHVwZGF0ZWQgYnkgbW9kZWxWaWV3VHJhbnNmb3JtLlxyXG4gICAgbGV0IHNjYWxlTWFnbml0dWRlID0gMTtcclxuXHJcbiAgICAvLyBGdW5jdGlvbiB0byB0cmFuc2Zvcm0gZXZlcnl0aGluZyB0byB0aGUgcmlnaHQgaGVpZ2h0XHJcbiAgICBjb25zdCB1cGRhdGVIZWlnaHQgPSAoIGhlaWdodDogbnVtYmVyICkgPT4ge1xyXG4gICAgICBjb25zdCB2aWV3SGVpZ2h0UG9pbnQgPSBWZWN0b3IyLnBvb2wuY3JlYXRlKCAwLCB0cmFuc2Zvcm1Qcm9wZXJ0eS52YWx1ZS5tb2RlbFRvVmlld1koIGhlaWdodCApICk7XHJcbiAgICAgIGNvbnN0IGhlaWdodEluQ2xpcENvb3JkaW5hdGVzID0gdGhpcy5nbG9iYWxUb0xvY2FsUG9pbnQoIHNjcmVlblZpZXcubG9jYWxUb0dsb2JhbFBvaW50KCB2aWV3SGVpZ2h0UG9pbnQgKSApLnk7XHJcblxyXG4gICAgICBjYW5ub25CYXJyZWwueSA9IGhlaWdodEluQ2xpcENvb3JkaW5hdGVzO1xyXG4gICAgICBjYW5ub25CYXNlLnkgPSBoZWlnaHRJbkNsaXBDb29yZGluYXRlcztcclxuXHJcbiAgICAgIC8vIFRoZSBjYW5ub25CYXNlIGFuZCBjeWxpbmRlciBhcmUgc2libGluZ3MsIHNvIHRyYW5zZm9ybSBpbnRvIHRoZSBzYW1lIGNvb3JkaW5hdGUgZnJhbWUuXHJcbiAgICAgIGN5bGluZGVyVG9wLnkgPSBjeWxpbmRlck5vZGUucGFyZW50VG9Mb2NhbFBvaW50KCB2aWV3SGVpZ2h0UG9pbnQuc2V0WSggY2Fubm9uQmFzZS5ib3R0b20gKSApLnkgLSBFTExJUFNFX0hFSUdIVCAvIDQ7XHJcbiAgICAgIHZpZXdIZWlnaHRQb2ludC5mcmVlVG9Qb29sKCk7XHJcblxyXG4gICAgICBjb25zdCBzaWRlU2hhcGUgPSBuZXcgU2hhcGUoKTtcclxuICAgICAgc2lkZVNoYXBlLm1vdmVUbyggLUVMTElQU0VfV0lEVEggLyAyLCAwIClcclxuICAgICAgICAubGluZVRvKCAtRUxMSVBTRV9XSURUSCAvIDIsIGN5bGluZGVyVG9wLnkgKVxyXG4gICAgICAgIC5lbGxpcHRpY2FsQXJjKCAwLCBjeWxpbmRlclRvcC55LCBFTExJUFNFX1dJRFRIIC8gMiwgRUxMSVBTRV9IRUlHSFQgLyAyLCAwLCBNYXRoLlBJLCAwLCB0cnVlIClcclxuICAgICAgICAubGluZVRvKCBFTExJUFNFX1dJRFRIIC8gMiwgMCApXHJcbiAgICAgICAgLmVsbGlwdGljYWxBcmMoIDAsIDAsIEVMTElQU0VfV0lEVEggLyAyLCBFTExJUFNFX0hFSUdIVCAvIDIsIDAsIDAsIE1hdGguUEksIGZhbHNlIClcclxuICAgICAgICAuY2xvc2UoKTtcclxuICAgICAgY3lsaW5kZXJTaWRlLnNldFNoYXBlKCBzaWRlU2hhcGUgKTtcclxuXHJcbiAgICAgIGNvbnN0IGNsaXBBcmVhID0gbmV3IFNoYXBlKCk7XHJcbiAgICAgIGNsaXBBcmVhLm1vdmVUbyggLUVMTElQU0VfV0lEVEggLyAyLCAwIClcclxuICAgICAgICAubGluZVRvKCAtRUxMSVBTRV9XSURUSCAvIDIsIC1FTExJUFNFX1dJRFRIICogNTAgKSAvLyBoaWdoIGVub3VnaCB0byBpbmNsdWRlIGhvdyBoaWdoIHRoZSBjYW5ub24gY291bGQgYmVcclxuICAgICAgICAubGluZVRvKCBFTExJUFNFX1dJRFRIICogMiwgLUVMTElQU0VfV0lEVEggKiA1MCApIC8vIGhpZ2ggZW5vdWdoIHRvIGluY2x1ZGUgaG93IGhpZ2ggdGhlIGNhbm5vbiBjb3VsZCBiZVxyXG4gICAgICAgIC5saW5lVG8oIEVMTElQU0VfV0lEVEggKiAyLCAwIClcclxuICAgICAgICAubGluZVRvKCBFTExJUFNFX1dJRFRIIC8gMiwgMCApXHJcbiAgICAgICAgLmVsbGlwdGljYWxBcmMoIDAsIDAsIEVMTElQU0VfV0lEVEggLyAyLCBFTExJUFNFX0hFSUdIVCAvIDIsIDAsIDAsIE1hdGguUEksIGZhbHNlIClcclxuICAgICAgICAuY2xvc2UoKTtcclxuXHJcbiAgICAgIC8vIHRoaXMgc2hhcGUgaXMgbWFkZSBpbiB0aGUgY29udGV4dCBvZiB0aGUgY3lsaW5kZXIsIHNvIHRyYW5zZm9ybSBpdCB0byBtYXRjaCB0aGUgY3lsaW5kZXIncyB0cmFuc2Zvcm0uXHJcbiAgICAgIC8vIFRoaXMgZG9lc24ndCBuZWVkIHRvIGhhcHBlbiBldmVyIGFnYWluIGJlY2F1c2UgdGhlIGNsaXBDb250YWluZXIgaXMgdGhlIHBhcmVudCB0byBhbGwgTm9kZXMgdGhhdCBhcmUgdXBkYXRlZCBvblxyXG4gICAgICAvLyBsYXlvdXQgY2hhbmdlLlxyXG4gICAgICBjbGlwQ29udGFpbmVyLnNldENsaXBBcmVhKCBjbGlwQXJlYS50cmFuc2Zvcm1lZCggY3lsaW5kZXJOb2RlLm1hdHJpeCApICk7XHJcblxyXG4gICAgICBoZWlnaHRMZWFkZXJBcnJvd3Muc2V0VGFpbEFuZFRpcChcclxuICAgICAgICBoZWlnaHRMZWFkZXJBcnJvd3MudGFpbFgsXHJcbiAgICAgICAgaGVpZ2h0TGVhZGVyQXJyb3dzLnRhaWxZLFxyXG4gICAgICAgIGhlaWdodExlYWRlckFycm93cy50aXBYLFxyXG4gICAgICAgIHRyYW5zZm9ybVByb3BlcnR5LnZhbHVlLm1vZGVsVG9WaWV3WSggaGVpZ2h0IClcclxuICAgICAgKTtcclxuICAgICAgaGVpZ2h0TGVhZGVyTGluZS5zZXRMaW5lKCBoZWlnaHRMZWFkZXJBcnJvd3MudGFpbFgsIGhlaWdodExlYWRlckFycm93cy50YWlsWSwgaGVpZ2h0TGVhZGVyQXJyb3dzLnRpcFgsIGhlaWdodExlYWRlckFycm93cy50aXBZICk7XHJcbiAgICAgIGhlaWdodExlYWRlckxpbmVUb3BDYXAueCA9IGhlaWdodExlYWRlckFycm93cy50aXBYO1xyXG4gICAgICBoZWlnaHRMZWFkZXJMaW5lVG9wQ2FwLnkgPSBoZWlnaHRMZWFkZXJBcnJvd3MudGlwWTtcclxuICAgICAgaGVpZ2h0TGFiZWxUZXh0LnN0cmluZyA9IFN0cmluZ1V0aWxzLmZpbGxJbiggcGF0dGVybjBWYWx1ZTFVbml0c1dpdGhTcGFjZVN0cmluZywge1xyXG4gICAgICAgIHZhbHVlOiBVdGlscy50b0ZpeGVkTnVtYmVyKCBoZWlnaHQsIDIgKSxcclxuICAgICAgICB1bml0czogbVN0cmluZ1xyXG4gICAgICB9ICk7XHJcbiAgICAgIGhlaWdodExhYmVsVGV4dC5jZW50ZXJYID0gaGVpZ2h0TGVhZGVyQXJyb3dzLnRpcFg7XHJcbiAgICAgIGhlaWdodExhYmVsVGV4dC55ID0gaGVpZ2h0TGVhZGVyQXJyb3dzLnRpcFkgLSA1O1xyXG4gICAgICBoZWlnaHRMYWJlbEJhY2tncm91bmQuc2V0UmVjdFdpZHRoKCBoZWlnaHRMYWJlbFRleHQud2lkdGggKyAyICk7XHJcbiAgICAgIGhlaWdodExhYmVsQmFja2dyb3VuZC5zZXRSZWN0SGVpZ2h0KCBoZWlnaHRMYWJlbFRleHQuaGVpZ2h0ICk7XHJcbiAgICAgIGhlaWdodExhYmVsQmFja2dyb3VuZC5jZW50ZXIgPSBoZWlnaHRMYWJlbFRleHQuY2VudGVyO1xyXG4gICAgICBoZWlnaHRDdWVpbmdBcnJvd3MueSA9IGhlaWdodExhYmVsVGV4dC5jZW50ZXJZO1xyXG5cclxuICAgICAgYW5nbGVJbmRpY2F0b3IueSA9IHRyYW5zZm9ybVByb3BlcnR5LnZhbHVlLm1vZGVsVG9WaWV3WSggaGVpZ2h0ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIE9ic2VydmUgY2hhbmdlcyBpbiBtb2RlbCBoZWlnaHQgYW5kIHVwZGF0ZSB0aGUgY2Fubm9uIHZpZXdcclxuICAgIGhlaWdodFByb3BlcnR5LmxpbmsoIGhlaWdodCA9PiB7XHJcbiAgICAgIHVwZGF0ZUhlaWdodCggaGVpZ2h0ICk7XHJcbiAgICAgIGlmICggaGVpZ2h0IDwgNCAmJiBhbmdsZVByb3BlcnR5LmdldCgpIDwgQU5HTEVfUkFOR0VfTUlOU1sgaGVpZ2h0IF0gKSB7XHJcbiAgICAgICAgYW5nbGVQcm9wZXJ0eS5zZXQoIEFOR0xFX1JBTkdFX01JTlNbIGhlaWdodCBdICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIGxheW91dCBvZiBjYW5ub24gTm9kZXMgYmFzZWQgb24gdGhlIGN1cnJlbnQgdHJhbnNmb3JtLlxyXG4gICAgY29uc3QgdXBkYXRlQ2Fubm9uTGF5b3V0ID0gKCkgPT4ge1xyXG5cclxuICAgICAgLy8gU2NhbGUgZXZlcnl0aGluZyB0byBiZSBiYXNlZCBvbiB0aGUgY2Fubm9uIGJhcnJlbC5cclxuICAgICAgc2NhbGVNYWduaXR1ZGUgPSB0cmFuc2Zvcm1Qcm9wZXJ0eS52YWx1ZS5tb2RlbFRvVmlld0RlbHRhWCggQ0FOTk9OX0xFTkdUSCApIC8gY2Fubm9uQmFycmVsVG9wLndpZHRoO1xyXG4gICAgICBjeWxpbmRlck5vZGUuc2V0U2NhbGVNYWduaXR1ZGUoIHNjYWxlTWFnbml0dWRlICk7XHJcbiAgICAgIGdyb3VuZENpcmNsZS5zZXRTY2FsZU1hZ25pdHVkZSggc2NhbGVNYWduaXR1ZGUgKTtcclxuICAgICAgY2Fubm9uQmFycmVsLnNldFNjYWxlTWFnbml0dWRlKCBzY2FsZU1hZ25pdHVkZSApO1xyXG4gICAgICBjYW5ub25CYXNlLnNldFNjYWxlTWFnbml0dWRlKCBzY2FsZU1hZ25pdHVkZSApO1xyXG5cclxuICAgICAgLy8gVHJhbnNmb3JtIHRoZSBjeWxpbmRyaWNhbCBOb2RlcyBvdmVyLCBiZWNhdXNlIHRoZXkgYXJlIG9mZnNldCBmcm9tIHRoZSBvcmdpbi5cclxuICAgICAgY29uc3QgbmV3WCA9IHRyYW5zZm9ybVByb3BlcnR5LnZhbHVlLm1vZGVsVG9WaWV3WCggQ1lMSU5ERVJfRElTVEFOQ0VfRlJPTV9PUklHSU4gKTtcclxuICAgICAgY3lsaW5kZXJOb2RlLnggPSBuZXdYO1xyXG4gICAgICBncm91bmRDaXJjbGUueCA9IG5ld1g7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIE9ic2VydmUgY2hhbmdlcyBpbiBtb2RlbHZpZXd0cmFuc2Zvcm0gYW5kIHVwZGF0ZSB0aGUgdmlld1xyXG4gICAgdHJhbnNmb3JtUHJvcGVydHkubGluayggKCkgPT4ge1xyXG4gICAgICB1cGRhdGVDYW5ub25MYXlvdXQoKTtcclxuICAgICAgdXBkYXRlSGVpZ2h0KCBoZWlnaHRQcm9wZXJ0eS5nZXQoKSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIExpbmtzIGluIENhbm5vbk5vZGUgbGFzdCBmb3IgdGhlIGxpZmV0aW1lIG9mIHRoZSBzaW0sIHNvIHRoZXkgZG9uJ3QgbmVlZCB0byBiZSBkaXNwb3NlZFxyXG5cclxuICAgIC8vIHZhcmlhYmxlcyB1c2VkIGZvciBkcmFnIGxpc3RlbmVyc1xyXG4gICAgbGV0IHN0YXJ0UG9pbnQ6IFZlY3RvcjI7XHJcbiAgICBsZXQgc3RhcnRBbmdsZTogbnVtYmVyO1xyXG4gICAgbGV0IHN0YXJ0UG9pbnRBbmdsZTogbnVtYmVyO1xyXG4gICAgbGV0IG1vdXNlUG9pbnQ6IFZlY3RvcjI7XHJcbiAgICBsZXQgc3RhcnRIZWlnaHQ6IG51bWJlcjtcclxuXHJcbiAgICAvLyBkcmFnIHRoZSB0aXAgb2YgdGhlIGNhbm5vbiB0byBjaGFuZ2UgYW5nbGVcclxuICAgIGNhbm5vbkJhcnJlbFRvcC5hZGRJbnB1dExpc3RlbmVyKCBuZXcgRHJhZ0xpc3RlbmVyKCB7XHJcbiAgICAgIHN0YXJ0OiBldmVudCA9PiB7XHJcbiAgICAgICAgc3RhcnRQb2ludCA9IHRoaXMuZ2xvYmFsVG9Mb2NhbFBvaW50KCBldmVudC5wb2ludGVyLnBvaW50ICk7XHJcbiAgICAgICAgc3RhcnRBbmdsZSA9IGFuZ2xlUHJvcGVydHkuZ2V0KCk7IC8vIGRlZ3JlZXNcclxuXHJcbiAgICAgICAgLy8gZmluZCB2ZWN0b3IgYW5nbGVzIGJldHdlZW4gbW91c2UgZHJhZyBzdGFydCBhbmQgY3VycmVudCBwb2ludHMsIHRvIHRoZSBiYXNlIG9mIHRoZSBjYW5ub25cclxuICAgICAgICBzdGFydFBvaW50QW5nbGUgPSBWZWN0b3IyLnBvb2wuY3JlYXRlKFxyXG4gICAgICAgICAgc3RhcnRQb2ludC54IC0gY2Fubm9uQmFzZS54LFxyXG4gICAgICAgICAgc3RhcnRQb2ludC55IC0gdHJhbnNmb3JtUHJvcGVydHkuZ2V0KCkubW9kZWxUb1ZpZXdZKCBoZWlnaHRQcm9wZXJ0eS5nZXQoKSApXHJcbiAgICAgICAgKS5hbmdsZTtcclxuICAgICAgfSxcclxuICAgICAgZHJhZzogZXZlbnQgPT4ge1xyXG4gICAgICAgIG1vdXNlUG9pbnQgPSB0aGlzLmdsb2JhbFRvTG9jYWxQb2ludCggZXZlbnQucG9pbnRlci5wb2ludCApO1xyXG5cclxuICAgICAgICBjb25zdCBtb3VzZVBvaW50QW5nbGUgPSBWZWN0b3IyLnBvb2wuY3JlYXRlKFxyXG4gICAgICAgICAgbW91c2VQb2ludC54IC0gY2Fubm9uQmFzZS54LFxyXG4gICAgICAgICAgbW91c2VQb2ludC55IC0gdHJhbnNmb3JtUHJvcGVydHkuZ2V0KCkubW9kZWxUb1ZpZXdZKCBoZWlnaHRQcm9wZXJ0eS5nZXQoKSApXHJcbiAgICAgICAgKS5hbmdsZTtcclxuICAgICAgICBjb25zdCBhbmdsZUNoYW5nZSA9IHN0YXJ0UG9pbnRBbmdsZSAtIG1vdXNlUG9pbnRBbmdsZTsgLy8gcmFkaWFuc1xyXG4gICAgICAgIGNvbnN0IGFuZ2xlQ2hhbmdlSW5EZWdyZWVzID0gYW5nbGVDaGFuZ2UgKiAxODAgLyBNYXRoLlBJOyAvLyBkZWdyZWVzXHJcblxyXG4gICAgICAgIGNvbnN0IHVuYm91bmRlZE5ld0FuZ2xlID0gc3RhcnRBbmdsZSArIGFuZ2xlQ2hhbmdlSW5EZWdyZWVzO1xyXG5cclxuICAgICAgICBjb25zdCBhbmdsZVJhbmdlID0gaGVpZ2h0UHJvcGVydHkuZ2V0KCkgPCA0ID8gbmV3IFJhbmdlKCBBTkdMRV9SQU5HRV9NSU5TWyBoZWlnaHRQcm9wZXJ0eS5nZXQoKSBdLCA5MCApIDogQU5HTEVfUkFOR0U7XHJcblxyXG4gICAgICAgIC8vIG1vdXNlIGRyYWdnZWQgYW5nbGUgaXMgd2l0aGluIGFuZ2xlIHJhbmdlXHJcbiAgICAgICAgaWYgKCBhbmdsZVJhbmdlLmNvbnRhaW5zKCB1bmJvdW5kZWROZXdBbmdsZSApICkge1xyXG4gICAgICAgICAgY29uc3QgZGVsdGEgPSBwcm92aWRlZE9wdGlvbnM/LnByZWNpc2VDYW5ub25EZWx0YSA/IDEgOiA1O1xyXG4gICAgICAgICAgYW5nbGVQcm9wZXJ0eS5zZXQoIFV0aWxzLnJvdW5kU3ltbWV0cmljKCB1bmJvdW5kZWROZXdBbmdsZSAvIGRlbHRhICkgKiBkZWx0YSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gdGhlIGN1cnJlbnQsIHVuY2hhbmdlZCwgYW5nbGUgaXMgY2xvc2VyIHRvIG1heCB0aGFuIG1pblxyXG4gICAgICAgIGVsc2UgaWYgKCBhbmdsZVJhbmdlLm1heCArIGFuZ2xlUmFuZ2UubWluIDwgMiAqIGFuZ2xlUHJvcGVydHkuZ2V0KCkgKSB7XHJcbiAgICAgICAgICBhbmdsZVByb3BlcnR5LnNldCggYW5nbGVSYW5nZS5tYXggKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHRoZSBjdXJyZW50LCB1bmNoYW5nZWQsIGFuZ2xlIGlzIGNsb3NlciBvciBzYW1lIGRpc3RhbmNlIHRvIG1pbiB0aGFuIG1heFxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgYW5nbGVQcm9wZXJ0eS5zZXQoIGFuZ2xlUmFuZ2UubWluICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSxcclxuICAgICAgdXNlSW5wdXRMaXN0ZW5lckN1cnNvcjogdHJ1ZSxcclxuICAgICAgYWxsb3dUb3VjaFNuYWc6IHRydWUsXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAnYmFycmVsVG9wRHJhZ0xpc3RlbmVyJyApLFxyXG4gICAgICBwaGV0aW9FbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQ6IHRydWVcclxuICAgIH0gKSApO1xyXG5cclxuICAgIC8vIGRyYWcgbGlzdGVuZXIgZm9yIGNvbnRyb2xsaW5nIHRoZSBoZWlnaHRcclxuICAgIGNvbnN0IGhlaWdodERyYWdMaXN0ZW5lciA9IG5ldyBEcmFnTGlzdGVuZXIoIHtcclxuICAgICAgc3RhcnQ6IGV2ZW50ID0+IHtcclxuICAgICAgICBzdGFydFBvaW50ID0gdGhpcy5nbG9iYWxUb0xvY2FsUG9pbnQoIGV2ZW50LnBvaW50ZXIucG9pbnQgKTtcclxuICAgICAgICBzdGFydEhlaWdodCA9IHRyYW5zZm9ybVByb3BlcnR5LnZhbHVlLm1vZGVsVG9WaWV3WSggaGVpZ2h0UHJvcGVydHkuZ2V0KCkgKTsgLy8gdmlldyB1bml0c1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgZHJhZzogZXZlbnQgPT4ge1xyXG4gICAgICAgIG1vdXNlUG9pbnQgPSB0aGlzLmdsb2JhbFRvTG9jYWxQb2ludCggZXZlbnQucG9pbnRlci5wb2ludCApO1xyXG4gICAgICAgIGNvbnN0IGhlaWdodENoYW5nZSA9IG1vdXNlUG9pbnQueSAtIHN0YXJ0UG9pbnQueTtcclxuXHJcbiAgICAgICAgY29uc3QgdW5ib3VuZGVkTmV3SGVpZ2h0ID0gdHJhbnNmb3JtUHJvcGVydHkuZ2V0KCkudmlld1RvTW9kZWxZKCBzdGFydEhlaWdodCArIGhlaWdodENoYW5nZSApO1xyXG5cclxuICAgICAgICAvLyBtb3VzZSBkcmFnZ2VkIGhlaWdodCBpcyB3aXRoaW4gaGVpZ2h0IHJhbmdlXHJcbiAgICAgICAgaWYgKCBIRUlHSFRfUkFOR0UuY29udGFpbnMoIHVuYm91bmRlZE5ld0hlaWdodCApICkge1xyXG4gICAgICAgICAgaGVpZ2h0UHJvcGVydHkuc2V0KCBVdGlscy5yb3VuZFN5bW1ldHJpYyggdW5ib3VuZGVkTmV3SGVpZ2h0ICkgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gdGhlIGN1cnJlbnQsIHVuY2hhbmdlZCwgaGVpZ2h0IGlzIGNsb3NlciB0byBtYXggdGhhbiBtaW5cclxuICAgICAgICBlbHNlIGlmICggSEVJR0hUX1JBTkdFLm1heCArIEhFSUdIVF9SQU5HRS5taW4gPCAyICogaGVpZ2h0UHJvcGVydHkuZ2V0KCkgKSB7XHJcbiAgICAgICAgICBoZWlnaHRQcm9wZXJ0eS5zZXQoIEhFSUdIVF9SQU5HRS5tYXggKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gdGhlIGN1cnJlbnQsIHVuY2hhbmdlZCwgaGVpZ2h0IGlzIGNsb3NlciBvciBzYW1lIGRpc3RhbmNlIHRvIG1pbiB0aGFuIG1heFxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgaGVpZ2h0UHJvcGVydHkuc2V0KCBIRUlHSFRfUkFOR0UubWluICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG5cclxuICAgICAgZW5kOiAoKSA9PiB7XHJcbiAgICAgICAgaGVpZ2h0Q3VlaW5nQXJyb3dzLnZpc2libGUgPSBmYWxzZTtcclxuICAgICAgfSxcclxuICAgICAgdXNlSW5wdXRMaXN0ZW5lckN1cnNvcjogdHJ1ZSxcclxuICAgICAgYWxsb3dUb3VjaFNuYWc6IHRydWUsXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAnaGVpZ2h0RHJhZ0xpc3RlbmVyJyApLFxyXG4gICAgICBwaGV0aW9FbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQ6IHRydWVcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBtdWx0aXBsZSBwYXJ0cyBvZiB0aGUgY2Fubm9uIGNhbiBiZSBkcmFnZ2VkIHRvIGNoYW5nZSBoZWlnaHRcclxuICAgIGNhbm5vbkJhc2UuYWRkSW5wdXRMaXN0ZW5lciggaGVpZ2h0RHJhZ0xpc3RlbmVyICk7XHJcbiAgICBjeWxpbmRlclNpZGUuYWRkSW5wdXRMaXN0ZW5lciggaGVpZ2h0RHJhZ0xpc3RlbmVyICk7XHJcbiAgICBjeWxpbmRlclRvcC5hZGRJbnB1dExpc3RlbmVyKCBoZWlnaHREcmFnTGlzdGVuZXIgKTtcclxuICAgIGNhbm5vbkJhcnJlbEJhc2UuYWRkSW5wdXRMaXN0ZW5lciggaGVpZ2h0RHJhZ0xpc3RlbmVyICk7XHJcbiAgICBoZWlnaHRMYWJlbFRleHQuYWRkSW5wdXRMaXN0ZW5lciggaGVpZ2h0RHJhZ0xpc3RlbmVyICk7XHJcbiAgICBoZWlnaHRDdWVpbmdBcnJvd3MuYWRkSW5wdXRMaXN0ZW5lciggaGVpZ2h0RHJhZ0xpc3RlbmVyICk7XHJcblxyXG4gICAgaGVpZ2h0RHJhZ0xpc3RlbmVyLmVuYWJsZWRQcm9wZXJ0eS5saW5rQXR0cmlidXRlKCBoZWlnaHRDdWVpbmdBcnJvd3MsICd2aXNpYmxlJyApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHJlc2V0KCk6IHZvaWQge1xyXG4gICAgdGhpcy5tdXp6bGVGbGFzaFN0YWdlID0gMTtcclxuICAgIHRoaXMuaGVpZ2h0Q3VlaW5nQXJyb3dzLnZpc2libGUgPSB0aGlzLmlzSW50cm9TY3JlZW47XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZmxhc2hNdXp6bGUoKTogdm9pZCB7XHJcbiAgICB0aGlzLm11enpsZUZsYXNoUGxheWluZyA9IHRydWU7XHJcbiAgICB0aGlzLm11enpsZUZsYXNoU3RhZ2UgPSAwO1xyXG4gIH1cclxufVxyXG5cclxuY29uc3QgbXV6emxlRmxhc2hEdXJhdGlvbkNvbXBsZXRlVG9BbmltYXRpb25QZXJjZW50Q29tcGxldGUgPSAoIHRpbWVQZXJjZW50Q29tcGxldGU6IG51bWJlciApOiBudW1iZXIgPT4ge1xyXG4gIHJldHVybiAtTWF0aC5wb3coIDIsIC0xMCAqIHRpbWVQZXJjZW50Q29tcGxldGUgKSArIDE7IC8vZWFzaW5nIG91dCBmdW5jdGlvblxyXG59O1xyXG5cclxucHJvamVjdGlsZU1vdGlvbi5yZWdpc3RlciggJ0Nhbm5vbk5vZGUnLCBDYW5ub25Ob2RlICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBDYW5ub25Ob2RlOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLEtBQUssTUFBTSw2QkFBNkI7QUFDL0MsT0FBT0MsS0FBSyxNQUFNLDZCQUE2QjtBQUMvQyxPQUFPQyxPQUFPLE1BQU0sK0JBQStCO0FBQ25ELE9BQU9DLGNBQWMsTUFBTSxzQ0FBc0M7QUFDakUsU0FBU0MsS0FBSyxRQUFRLGdDQUFnQztBQUN0RCxPQUFPQyxLQUFLLE1BQU0sbUNBQW1DO0FBQ3JELE9BQU9DLFdBQVcsTUFBTSwrQ0FBK0M7QUFDdkUsT0FBT0MsU0FBUyxNQUFNLDBDQUEwQztBQUNoRSxPQUFPQyxXQUFXLE1BQU0sNENBQTRDO0FBQ3BFLFNBQVNDLEtBQUssRUFBRUMsWUFBWSxFQUFFQyxLQUFLLEVBQUVDLElBQUksRUFBRUMsY0FBYyxFQUFFQyxJQUFJLEVBQWVDLElBQUksRUFBRUMsU0FBUyxFQUFFQyxJQUFJLFFBQVEsbUNBQW1DO0FBQzlJLE9BQU9DLE1BQU0sTUFBTSxpQ0FBaUM7QUFDcEQsT0FBT0MsbUJBQW1CLE1BQU0sd0NBQXdDO0FBQ3hFLE9BQU9DLGdCQUFnQixNQUFNLHNDQUFzQztBQUNuRSxPQUFPQyxvQkFBb0Is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