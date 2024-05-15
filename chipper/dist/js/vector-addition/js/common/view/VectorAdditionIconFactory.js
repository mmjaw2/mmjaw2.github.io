// Copyright 2019-2024, University of Colorado Boulder

/**
 * Factory for creating the various icons that appear in the sim.
 *
 * ## Creates the following icons (annotated in the file):
 *  1. Screen icons
 *  2. Vector Creator Panel icons
 *  3. Checkbox icons (i.e. sum icon, angle icon, grid icon)
 *  4. Component Style Icons
 *  5. Coordinate Snap Mode Icons (polar and Cartesian)
 *  6. Graph Orientation icons (horizontal and vertical - on the 'Explore 1D' screen)
 *  7. Equation Type icons (On the 'Equations' Screen)
 *
 * @author Brandon Li
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Utils from '../../../../dot/js/Utils.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import Screen from '../../../../joist/js/Screen.js';
import ScreenIcon from '../../../../joist/js/ScreenIcon.js';
import { Shape } from '../../../../kite/js/imports.js';
import interleave from '../../../../phet-core/js/interleave.js';
import merge from '../../../../phet-core/js/merge.js';
import ArrowNode from '../../../../scenery-phet/js/ArrowNode.js';
import MathSymbols from '../../../../scenery-phet/js/MathSymbols.js';
import { Color, HBox, Line, Node, Path, Spacer, Text, VBox } from '../../../../scenery/js/imports.js';
import eyeSlashSolidShape from '../../../../sherpa/js/fontawesome-5/eyeSlashSolidShape.js';
import EquationTypes from '../../equations/model/EquationTypes.js';
import vectorAddition from '../../vectorAddition.js';
import ComponentVectorStyles from '../model/ComponentVectorStyles.js';
import GraphOrientations from '../model/GraphOrientations.js';
import VectorAdditionColors from '../VectorAdditionColors.js';
import VectorAdditionConstants from '../VectorAdditionConstants.js';
import ArrowOverSymbolNode from './ArrowOverSymbolNode.js';
import CurvedArrowNode from './CurvedArrowNode.js';
import DashedArrowNode from './DashedArrowNode.js';
import { combineOptions } from '../../../../phet-core/js/optionize.js';

// constants
const SCREEN_ICON_WIDTH = 70;
const SCREEN_ICON_HEIGHT = SCREEN_ICON_WIDTH / Screen.HOME_SCREEN_ICON_ASPECT_RATIO; // w/h = ratio <=> h = w/ratio
const RADIO_BUTTON_ICON_SIZE = 45;
const VectorAdditionIconFactory = {
  //========================================================================================
  // Screen icons, see https://github.com/phetsims/vector-addition/issues/76
  //========================================================================================

  /**
   * Creates the icon for the 'Explore 1D' Screen.
   */
  createExplore1DScreenIcon() {
    const colorPalette = VectorAdditionColors.BLUE_COLOR_PALETTE;
    const arrowNodeOptions = combineOptions({}, VectorAdditionConstants.VECTOR_ARROW_OPTIONS, {
      fill: colorPalette.mainFill,
      stroke: colorPalette.mainStroke
    });

    // Vector pointing to the right, the full width of the icon
    const rightVectorNode = new ArrowNode(0, 0, SCREEN_ICON_WIDTH, 0, arrowNodeOptions);

    // Vector pointing to the left, partial width of the icon
    const leftVectorNode = new ArrowNode(0.5 * SCREEN_ICON_WIDTH, 0, 0, 0, arrowNodeOptions);
    const vBox = new VBox({
      align: 'right',
      spacing: SCREEN_ICON_HEIGHT * 0.20,
      children: [rightVectorNode, leftVectorNode]
    });
    return createScreenIcon([vBox]);
  },
  /**
   * Creates the icon for the 'Explore 2D' Screen.
   */
  createExplore2DScreenIcon() {
    const vector = new Vector2(SCREEN_ICON_WIDTH, -SCREEN_ICON_HEIGHT * 0.8);
    const colorPalette = VectorAdditionColors.PINK_COLOR_PALETTE;

    // vector
    const vectorNode = new ArrowNode(0, 0, vector.x, vector.y, combineOptions({}, VectorAdditionConstants.VECTOR_ARROW_OPTIONS, {
      fill: colorPalette.mainFill,
      stroke: colorPalette.mainStroke
    }));

    // component vectors
    const dashedArrowNodeOptions = merge({}, VectorAdditionConstants.COMPONENT_VECTOR_ARROW_OPTIONS, {
      fill: colorPalette.componentFill
    });
    const xComponentNode = new DashedArrowNode(0, 0, vector.x, 0, dashedArrowNodeOptions);
    const yComponentNode = new DashedArrowNode(vector.x, 0, vector.x, vector.y, dashedArrowNodeOptions);
    return createScreenIcon([xComponentNode, yComponentNode, vectorNode]);
  },
  /**
   * Creates the icon for the 'Lab' Screen.
   */
  createLabScreenIcon() {
    // {Vector2[]} the tip positions of the group 1 (blue) arrows (aligned tip to tail)
    const group1TipPositions = [new Vector2(SCREEN_ICON_WIDTH * 0.63, 0), new Vector2(SCREEN_ICON_WIDTH, -SCREEN_ICON_HEIGHT)];

    // {Vector2[]} the tip positions of the group 2 (orange) arrows (aligned tip to tail)
    const group2TipPositions = [new Vector2(0, -SCREEN_ICON_HEIGHT * 0.7), new Vector2(SCREEN_ICON_WIDTH, -SCREEN_ICON_HEIGHT)];

    // starting tail position of 1st vector
    const startingTailPosition = new Vector2(SCREEN_ICON_WIDTH / 4, 0);
    const group1ArrowNodes = createTipToTailArrowNodes(group1TipPositions, startingTailPosition, combineOptions({}, VectorAdditionConstants.VECTOR_ARROW_OPTIONS, {
      fill: VectorAdditionColors.BLUE_COLOR_PALETTE.mainFill,
      stroke: VectorAdditionColors.BLUE_COLOR_PALETTE.mainStroke
    }));
    const group2ArrowNodes = createTipToTailArrowNodes(group2TipPositions, startingTailPosition, combineOptions({}, VectorAdditionConstants.VECTOR_ARROW_OPTIONS, {
      fill: VectorAdditionColors.ORANGE_COLOR_PALETTE.mainFill,
      stroke: VectorAdditionColors.ORANGE_COLOR_PALETTE.mainStroke
    }));
    return createScreenIcon(group2ArrowNodes.concat(group1ArrowNodes));
  },
  /**
   * Creates the icon for the 'Equations' Screen.
   */
  createEquationsScreenIcon() {
    // {Vector2[]} the tip positions of the vectors on the icon (vectors are aligned tip to tail)
    const tipPositions = [new Vector2(SCREEN_ICON_WIDTH * 0.15, -SCREEN_ICON_HEIGHT * 0.75), new Vector2(SCREEN_ICON_WIDTH * 0.85, -SCREEN_ICON_HEIGHT)];
    const startTail = Vector2.ZERO;
    const lastTip = _.last(tipPositions);
    assert && assert(lastTip);
    const colorPalette = VectorAdditionColors.EQUATIONS_BLUE_COLOR_PALETTE;

    // vectors, tip to tail
    const arrowNodes = createTipToTailArrowNodes(tipPositions, startTail, combineOptions({}, VectorAdditionConstants.VECTOR_ARROW_OPTIONS, {
      fill: colorPalette.mainFill,
      stroke: colorPalette.mainStroke
    }));

    // sum
    arrowNodes.push(new ArrowNode(startTail.x, startTail.y, lastTip.x, lastTip.y, combineOptions({}, VectorAdditionConstants.SUM_VECTOR_ARROW_OPTIONS, {
      fill: colorPalette.sumFill,
      stroke: colorPalette.sumStroke
    })));
    return createScreenIcon(arrowNodes);
  },
  //========================================================================================
  // VectorCreatorPanel icons
  //========================================================================================

  /**
   * @param initialVectorComponents - vector components (in view coordinates)
   * @param vectorColorPalette - color palette for this icon's vector
   * @param arrowLength
   */
  createVectorCreatorPanelIcon(initialVectorComponents, vectorColorPalette, arrowLength) {
    const arrowComponents = initialVectorComponents.normalized().timesScalar(arrowLength);
    return new ArrowNode(0, 0, arrowComponents.x, arrowComponents.y, combineOptions({}, VectorAdditionConstants.VECTOR_ARROW_OPTIONS, {
      cursor: 'move',
      fill: vectorColorPalette.mainFill,
      stroke: vectorColorPalette.mainStroke
    }));
  },
  //========================================================================================
  // Checkbox icons (i.e. sum icon, angle icon)
  //========================================================================================

  /**
   * Creates a vector icon that points to the right, used with various checkboxes.
   */
  createVectorIcon(vectorLength, providedOptions) {
    const options = combineOptions({}, VectorAdditionConstants.VECTOR_ARROW_OPTIONS, {
      fill: Color.BLACK,
      stroke: null,
      lineWidth: 1
    }, providedOptions);
    return new ArrowNode(0, 0, vectorLength, 0, options);
  },
  /**
   * Creates the icon that appears next to the checkbox that toggles the 'Angle' visibility
   */
  createAngleIcon() {
    // values determined empirically
    const wedgeLength = 20;
    const angle = Utils.toRadians(50);
    const curvedArrowRadius = 16;
    const wedgeShape = new Shape().moveTo(wedgeLength, 0).horizontalLineTo(0).lineTo(Math.cos(angle) * wedgeLength, -Math.sin(angle) * wedgeLength);
    const wedgeNode = new Path(wedgeShape, {
      stroke: Color.BLACK
    });
    const curvedArrowNode = new CurvedArrowNode(curvedArrowRadius, angle);
    const thetaNode = new Text(MathSymbols.THETA, {
      font: VectorAdditionConstants.EQUATION_SYMBOL_FONT,
      scale: 0.75,
      left: curvedArrowNode.right + 4,
      centerY: wedgeNode.centerY
    });
    return new Node({
      children: [wedgeNode, curvedArrowNode, thetaNode]
    });
  },
  //========================================================================================
  // ComponentVectorStyles icons, used on Component radio buttons
  //========================================================================================

  /**
   * Creates the icons that go on the Component Style Radio Button based on a component style
   */
  createComponentStyleRadioButtonIcon(componentStyle) {
    const iconSize = RADIO_BUTTON_ICON_SIZE; // size of the icon (square)

    if (componentStyle === ComponentVectorStyles.INVISIBLE) {
      return createEyeCloseIcon(iconSize);
    }
    const subBoxSize = RADIO_BUTTON_ICON_SIZE / 3; // size of the sub-box the leader lines create
    assert && assert(subBoxSize < iconSize, `subBoxSize ${subBoxSize} must be < iconSize ${iconSize}`);

    // Options for main (solid) and component (dashed) arrows
    const arrowNodeOptions = combineOptions({}, VectorAdditionConstants.VECTOR_ARROW_OPTIONS, {
      fill: VectorAdditionColors.BLUE_COLOR_PALETTE.mainFill,
      stroke: VectorAdditionColors.BLUE_COLOR_PALETTE.mainStroke
    });
    const dashedArrowNodeOptions = merge({}, VectorAdditionConstants.COMPONENT_VECTOR_ARROW_OPTIONS, {
      fill: VectorAdditionColors.BLUE_COLOR_PALETTE.componentFill
    });

    // Initialize arrows for the PARALLELOGRAM component style (will be adjusted for different component styles)
    const vectorArrow = new ArrowNode(0, 0, iconSize, -iconSize, arrowNodeOptions);
    const xComponentArrow = new DashedArrowNode(0, 0, iconSize, 0, dashedArrowNodeOptions);
    const yComponentArrow = new DashedArrowNode(0, 0, 0, -iconSize, dashedArrowNodeOptions);
    let iconChildren = [xComponentArrow, yComponentArrow, vectorArrow]; // children of the icon children

    if (componentStyle === ComponentVectorStyles.TRIANGLE) {
      yComponentArrow.setTailAndTip(iconSize, 0, iconSize, -iconSize);
    } else if (componentStyle === ComponentVectorStyles.PROJECTION) {
      vectorArrow.setTailAndTip(subBoxSize, -subBoxSize, iconSize, -iconSize);
      xComponentArrow.setTailAndTip(subBoxSize, 0, iconSize, 0);
      yComponentArrow.setTailAndTip(0, -subBoxSize, 0, -iconSize);

      // Create the leader lines
      const leaderLinesShape = new Shape().moveTo(0, -subBoxSize).horizontalLineTo(subBoxSize).verticalLineToRelative(subBoxSize).moveTo(0, -iconSize).horizontalLineTo(iconSize).verticalLineToRelative(iconSize);
      const leaderLinesPath = new Path(leaderLinesShape, {
        lineDash: [2.9, 2],
        stroke: 'black'
      });
      iconChildren = [leaderLinesPath, xComponentArrow, yComponentArrow, vectorArrow];
    }
    return new Node({
      children: iconChildren,
      maxWidth: iconSize,
      maxHeight: iconSize
    });
  },
  //=========================================================================================================
  // CoordinateSnapModes icons, used on scene radio buttons,
  // see https://github.com/phetsims/vector-addition/issues/21)
  //=========================================================================================================

  /**
   * Creates the icon for the Cartesian snap mode radio button.
   */
  createCartesianSnapModeIcon(vectorColorPalette) {
    const iconSize = RADIO_BUTTON_ICON_SIZE;

    // Arrow that is 45 degrees to the right and up
    const vectorNode = new ArrowNode(0, 0, iconSize, -iconSize, combineOptions({}, VectorAdditionConstants.VECTOR_ARROW_OPTIONS, {
      fill: vectorColorPalette.mainFill,
      stroke: vectorColorPalette.mainStroke
    }));

    // x and y, Cartesian coordinates
    const xyArrowOptions = {
      fill: 'black',
      tailWidth: 1,
      headWidth: 6,
      headHeight: 6
    };
    const xNode = new ArrowNode(0, 0, iconSize, 0, xyArrowOptions);
    const yNode = new ArrowNode(iconSize, 0, iconSize, -iconSize, xyArrowOptions);
    return new Node({
      children: [vectorNode, xNode, yNode],
      maxWidth: iconSize,
      maxHeight: iconSize
    });
  },
  /**
   * Creates the icon for the Polar snap mode radio button.
   */
  createPolarSnapModeIcon(vectorColorPalette) {
    const iconSize = RADIO_BUTTON_ICON_SIZE;
    const arcRadius = 30; // arc radius of the curved arrow

    // Arrow that is 45 degrees to the right and up
    const arrow = new ArrowNode(0, 0, iconSize, -iconSize, combineOptions({}, VectorAdditionConstants.VECTOR_ARROW_OPTIONS, {
      fill: vectorColorPalette.mainFill,
      stroke: vectorColorPalette.mainStroke
    }));

    // Curved arrow that indicates the angle
    const curvedArrow = new CurvedArrowNode(arcRadius, Utils.toRadians(45));

    // horizontal line
    const line = new Line(0, 0, iconSize, 0, {
      stroke: Color.BLACK
    });
    return new Node({
      children: [arrow, curvedArrow, line],
      maxWidth: iconSize,
      maxHeight: iconSize
    });
  },
  //================================================================================================
  // GraphOrientations icons (horizontal/vertical), used on scene radio buttons in Explore 1D screen
  //================================================================================================

  /**
   * Creates the icon used on the radio buttons on 'Explore 1D' screen that toggles the graph orientation.
   */
  createGraphOrientationIcon(graphOrientation) {
    assert && assert(_.includes([GraphOrientations.HORIZONTAL, GraphOrientations.VERTICAL], graphOrientation), `invalid graphOrientation: ${graphOrientation}`);
    const iconSize = RADIO_BUTTON_ICON_SIZE;
    const tipX = graphOrientation === GraphOrientations.HORIZONTAL ? iconSize : 0;
    const tipY = graphOrientation === GraphOrientations.HORIZONTAL ? 0 : iconSize;
    return new ArrowNode(0, 0, tipX, tipY, combineOptions({}, VectorAdditionConstants.AXES_ARROW_OPTIONS, {
      maxWidth: iconSize,
      maxHeight: iconSize
    }));
  },
  //========================================================================================
  // EquationTypes icons, used on radio buttons in Equations screen
  //========================================================================================

  /**
   * Creates the Icon that appears on the EquationTypes radio button icons on the 'Equations' screen.
   * @param equationType
   * @param vectorSymbols - symbols on the buttons (the last symbol is the sum's symbol)
   */
  createEquationTypeIcon(equationType, vectorSymbols) {
    assert && assert(_.every(vectorSymbols, symbol => typeof symbol === 'string') && vectorSymbols.length > 1, `invalid vectorSymbols: ${vectorSymbols}`);
    let children = [];
    const textOptions = {
      font: VectorAdditionConstants.EQUATION_FONT
    };

    // Gather all the symbols for the left side of the equation into an array.
    // For NEGATION, all symbols are on the left side of the equation
    const equationLeftSideSymbols = _.dropRight(vectorSymbols, equationType === EquationTypes.NEGATION ? 0 : 1);

    // Create a vector symbol for each symbol on the left side of the equation.
    equationLeftSideSymbols.forEach(symbol => {
      children.push(new ArrowOverSymbolNode(symbol));
    });

    // Interleave operators (i.e. '+'|'-') in between each symbol on the left side of the equation
    children = interleave(children, () => {
      const operator = equationType === EquationTypes.SUBTRACTION ? MathSymbols.MINUS : MathSymbols.PLUS;
      return new Text(operator, textOptions);
    });

    // '='
    children.push(new Text(MathSymbols.EQUAL_TO, textOptions));

    // Right side of the equation, which is either '0' or the last of the symbols (which is the sum).
    children.push(equationType === EquationTypes.NEGATION ? new Text('0', textOptions) : new ArrowOverSymbolNode(_.last(vectorSymbols)));
    return new HBox({
      children: children,
      spacing: 8,
      align: 'origin' // so that text baselines are aligned
    });
  }
};

//========================================================================================
// Helper functions
//========================================================================================

/**
 * Creates Vector Icons (ArrowNode) tip to tail based on an array of tip positions along with the tail position of the
 * first Vector. ArrowNodes are created and pushed to a given array.
 *
 * @param tipPositions - tip positions of all vectors (vectors are aligned tip to tail)
 * @param startingTailPosition - tail position of the first vector
 * @param [arrowNodeOptions] - passed to ArrowNode constructor
 */
function createTipToTailArrowNodes(tipPositions, startingTailPosition, arrowNodeOptions) {
  const arrowNodes = [];
  for (let i = 0; i < tipPositions.length; i++) {
    const tailPosition = i === 0 ? startingTailPosition : tipPositions[i - 1];
    const tipPosition = tipPositions[i];
    arrowNodes.push(new ArrowNode(tailPosition.x, tailPosition.y, tipPosition.x, tipPosition.y, arrowNodeOptions));
  }
  return arrowNodes;
}

/**
 * See https://github.com/phetsims/vector-addition/issues/76#issuecomment-515197547 for context.
 * Helper function that creates a ScreenIcon but adds a Spacer to fill extra space. This ensures all screen icons are
 * the same width and height which ensures that they are all scaled the same. Thus, this keeps all Arrow Nodes inside
 * of screen icons the same 'dimensions' (i.e. tailWidth, headWidth, headHeight, etc. ).
 */
function createScreenIcon(children) {
  // Create the icon, adding a Spacer to fill extra space if needed (Equivalent to setting a minimum width/height)
  const iconNode = new Node().addChild(new Spacer(SCREEN_ICON_WIDTH, SCREEN_ICON_HEIGHT, {
    pickable: false
  }));
  iconNode.addChild(new Node({
    // Wrap the icon content in a Node
    children: children,
    center: iconNode.center,
    maxWidth: SCREEN_ICON_WIDTH,
    // Ensures the icon doesn't get wider than the fixed screen icon dimensions
    maxHeight: SCREEN_ICON_HEIGHT // Ensures the icon doesn't get taller than the fixed screen icon dimensions
  }));
  return new ScreenIcon(iconNode);
}

/**
 * Create the close eye icon, for ComponentVectorStyles.INVISIBLE.
 */
function createEyeCloseIcon(iconSize) {
  const spacer = new Spacer(iconSize, iconSize);
  const eyeIcon = new Path(eyeSlashSolidShape, {
    scale: 0.068,
    // determined empirically
    fill: 'black',
    center: spacer.center
  });
  return new Node({
    children: [spacer, eyeIcon],
    maxWidth: iconSize,
    maxHeight: iconSize
  });
}
vectorAddition.register('VectorAdditionIconFactory', VectorAdditionIconFactory);
export default VectorAdditionIconFactory;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJVdGlscyIsIlZlY3RvcjIiLCJTY3JlZW4iLCJTY3JlZW5JY29uIiwiU2hhcGUiLCJpbnRlcmxlYXZlIiwibWVyZ2UiLCJBcnJvd05vZGUiLCJNYXRoU3ltYm9scyIsIkNvbG9yIiwiSEJveCIsIkxpbmUiLCJOb2RlIiwiUGF0aCIsIlNwYWNlciIsIlRleHQiLCJWQm94IiwiZXllU2xhc2hTb2xpZFNoYXBlIiwiRXF1YXRpb25UeXBlcyIsInZlY3RvckFkZGl0aW9uIiwiQ29tcG9uZW50VmVjdG9yU3R5bGVzIiwiR3JhcGhPcmllbnRhdGlvbnMiLCJWZWN0b3JBZGRpdGlvbkNvbG9ycyIsIlZlY3RvckFkZGl0aW9uQ29uc3RhbnRzIiwiQXJyb3dPdmVyU3ltYm9sTm9kZSIsIkN1cnZlZEFycm93Tm9kZSIsIkRhc2hlZEFycm93Tm9kZSIsImNvbWJpbmVPcHRpb25zIiwiU0NSRUVOX0lDT05fV0lEVEgiLCJTQ1JFRU5fSUNPTl9IRUlHSFQiLCJIT01FX1NDUkVFTl9JQ09OX0FTUEVDVF9SQVRJTyIsIlJBRElPX0JVVFRPTl9JQ09OX1NJWkUiLCJWZWN0b3JBZGRpdGlvbkljb25GYWN0b3J5IiwiY3JlYXRlRXhwbG9yZTFEU2NyZWVuSWNvbiIsImNvbG9yUGFsZXR0ZSIsIkJMVUVfQ09MT1JfUEFMRVRURSIsImFycm93Tm9kZU9wdGlvbnMiLCJWRUNUT1JfQVJST1dfT1BUSU9OUyIsImZpbGwiLCJtYWluRmlsbCIsInN0cm9rZSIsIm1haW5TdHJva2UiLCJyaWdodFZlY3Rvck5vZGUiLCJsZWZ0VmVjdG9yTm9kZSIsInZCb3giLCJhbGlnbiIsInNwYWNpbmciLCJjaGlsZHJlbiIsImNyZWF0ZVNjcmVlbkljb24iLCJjcmVhdGVFeHBsb3JlMkRTY3JlZW5JY29uIiwidmVjdG9yIiwiUElOS19DT0xPUl9QQUxFVFRFIiwidmVjdG9yTm9kZSIsIngiLCJ5IiwiZGFzaGVkQXJyb3dOb2RlT3B0aW9ucyIsIkNPTVBPTkVOVF9WRUNUT1JfQVJST1dfT1BUSU9OUyIsImNvbXBvbmVudEZpbGwiLCJ4Q29tcG9uZW50Tm9kZSIsInlDb21wb25lbnROb2RlIiwiY3JlYXRlTGFiU2NyZWVuSWNvbiIsImdyb3VwMVRpcFBvc2l0aW9ucyIsImdyb3VwMlRpcFBvc2l0aW9ucyIsInN0YXJ0aW5nVGFpbFBvc2l0aW9uIiwiZ3JvdXAxQXJyb3dOb2RlcyIsImNyZWF0ZVRpcFRvVGFpbEFycm93Tm9kZXMiLCJncm91cDJBcnJvd05vZGVzIiwiT1JBTkdFX0NPTE9SX1BBTEVUVEUiLCJjb25jYXQiLCJjcmVhdGVFcXVhdGlvbnNTY3JlZW5JY29uIiwidGlwUG9zaXRpb25zIiwic3RhcnRUYWlsIiwiWkVSTyIsImxhc3RUaXAiLCJfIiwibGFzdCIsImFzc2VydCIsIkVRVUFUSU9OU19CTFVFX0NPTE9SX1BBTEVUVEUiLCJhcnJvd05vZGVzIiwicHVzaCIsIlNVTV9WRUNUT1JfQVJST1dfT1BUSU9OUyIsInN1bUZpbGwiLCJzdW1TdHJva2UiLCJjcmVhdGVWZWN0b3JDcmVhdG9yUGFuZWxJY29uIiwiaW5pdGlhbFZlY3RvckNvbXBvbmVudHMiLCJ2ZWN0b3JDb2xvclBhbGV0dGUiLCJhcnJvd0xlbmd0aCIsImFycm93Q29tcG9uZW50cyIsIm5vcm1hbGl6ZWQiLCJ0aW1lc1NjYWxhciIsImN1cnNvciIsImNyZWF0ZVZlY3Rvckljb24iLCJ2ZWN0b3JMZW5ndGgiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwiQkxBQ0siLCJsaW5lV2lkdGgiLCJjcmVhdGVBbmdsZUljb24iLCJ3ZWRnZUxlbmd0aCIsImFuZ2xlIiwidG9SYWRpYW5zIiwiY3VydmVkQXJyb3dSYWRpdXMiLCJ3ZWRnZVNoYXBlIiwibW92ZVRvIiwiaG9yaXpvbnRhbExpbmVUbyIsImxpbmVUbyIsIk1hdGgiLCJjb3MiLCJzaW4iLCJ3ZWRnZU5vZGUiLCJjdXJ2ZWRBcnJvd05vZGUiLCJ0aGV0YU5vZGUiLCJUSEVUQSIsImZvbnQiLCJFUVVBVElPTl9TWU1CT0xfRk9OVCIsInNjYWxlIiwibGVmdCIsInJpZ2h0IiwiY2VudGVyWSIsImNyZWF0ZUNvbXBvbmVudFN0eWxlUmFkaW9CdXR0b25JY29uIiwiY29tcG9uZW50U3R5bGUiLCJpY29uU2l6ZSIsIklOVklTSUJMRSIsImNyZWF0ZUV5ZUNsb3NlSWNvbiIsInN1YkJveFNpemUiLCJ2ZWN0b3JBcnJvdyIsInhDb21wb25lbnRBcnJvdyIsInlDb21wb25lbnRBcnJvdyIsImljb25DaGlsZHJlbiIsIlRSSUFOR0xFIiwic2V0VGFpbEFuZFRpcCIsIlBST0pFQ1RJT04iLCJsZWFkZXJMaW5lc1NoYXBlIiwidmVydGljYWxMaW5lVG9SZWxhdGl2ZSIsImxlYWRlckxpbmVzUGF0aCIsImxpbmVEYXNoIiwibWF4V2lkdGgiLCJtYXhIZWlnaHQiLCJjcmVhdGVDYXJ0ZXNpYW5TbmFwTW9kZUljb24iLCJ4eUFycm93T3B0aW9ucyIsInRhaWxXaWR0aCIsImhlYWRXaWR0aCIsImhlYWRIZWlnaHQiLCJ4Tm9kZSIsInlOb2RlIiwiY3JlYXRlUG9sYXJTbmFwTW9kZUljb24iLCJhcmNSYWRpdXMiLCJhcnJvdyIsImN1cnZlZEFycm93IiwibGluZSIsImNyZWF0ZUdyYXBoT3JpZW50YXRpb25JY29uIiwiZ3JhcGhPcmllbnRhdGlvbiIsImluY2x1ZGVzIiwiSE9SSVpPTlRBTCIsIlZFUlRJQ0FMIiwidGlwWCIsInRpcFkiLCJBWEVTX0FSUk9XX09QVElPTlMiLCJjcmVhdGVFcXVhdGlvblR5cGVJY29uIiwiZXF1YXRpb25UeXBlIiwidmVjdG9yU3ltYm9scyIsImV2ZXJ5Iiwic3ltYm9sIiwibGVuZ3RoIiwidGV4dE9wdGlvbnMiLCJFUVVBVElPTl9GT05UIiwiZXF1YXRpb25MZWZ0U2lkZVN5bWJvbHMiLCJkcm9wUmlnaHQiLCJORUdBVElPTiIsImZvckVhY2giLCJvcGVyYXRvciIsIlNVQlRSQUNUSU9OIiwiTUlOVVMiLCJQTFVTIiwiRVFVQUxfVE8iLCJpIiwidGFpbFBvc2l0aW9uIiwidGlwUG9zaXRpb24iLCJpY29uTm9kZSIsImFkZENoaWxkIiwicGlja2FibGUiLCJjZW50ZXIiLCJzcGFjZXIiLCJleWVJY29uIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJWZWN0b3JBZGRpdGlvbkljb25GYWN0b3J5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE5LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEZhY3RvcnkgZm9yIGNyZWF0aW5nIHRoZSB2YXJpb3VzIGljb25zIHRoYXQgYXBwZWFyIGluIHRoZSBzaW0uXHJcbiAqXHJcbiAqICMjIENyZWF0ZXMgdGhlIGZvbGxvd2luZyBpY29ucyAoYW5ub3RhdGVkIGluIHRoZSBmaWxlKTpcclxuICogIDEuIFNjcmVlbiBpY29uc1xyXG4gKiAgMi4gVmVjdG9yIENyZWF0b3IgUGFuZWwgaWNvbnNcclxuICogIDMuIENoZWNrYm94IGljb25zIChpLmUuIHN1bSBpY29uLCBhbmdsZSBpY29uLCBncmlkIGljb24pXHJcbiAqICA0LiBDb21wb25lbnQgU3R5bGUgSWNvbnNcclxuICogIDUuIENvb3JkaW5hdGUgU25hcCBNb2RlIEljb25zIChwb2xhciBhbmQgQ2FydGVzaWFuKVxyXG4gKiAgNi4gR3JhcGggT3JpZW50YXRpb24gaWNvbnMgKGhvcml6b250YWwgYW5kIHZlcnRpY2FsIC0gb24gdGhlICdFeHBsb3JlIDFEJyBzY3JlZW4pXHJcbiAqICA3LiBFcXVhdGlvbiBUeXBlIGljb25zIChPbiB0aGUgJ0VxdWF0aW9ucycgU2NyZWVuKVxyXG4gKlxyXG4gKiBAYXV0aG9yIEJyYW5kb24gTGlcclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICovXHJcblxyXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL1V0aWxzLmpzJztcclxuaW1wb3J0IFZlY3RvcjIgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL1ZlY3RvcjIuanMnO1xyXG5pbXBvcnQgU2NyZWVuIGZyb20gJy4uLy4uLy4uLy4uL2pvaXN0L2pzL1NjcmVlbi5qcyc7XHJcbmltcG9ydCBTY3JlZW5JY29uIGZyb20gJy4uLy4uLy4uLy4uL2pvaXN0L2pzL1NjcmVlbkljb24uanMnO1xyXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gJy4uLy4uLy4uLy4uL2tpdGUvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBpbnRlcmxlYXZlIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9pbnRlcmxlYXZlLmpzJztcclxuaW1wb3J0IG1lcmdlIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9tZXJnZS5qcyc7XHJcbmltcG9ydCBBcnJvd05vZGUsIHsgQXJyb3dOb2RlT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uLy4uL3NjZW5lcnktcGhldC9qcy9BcnJvd05vZGUuanMnO1xyXG5pbXBvcnQgTWF0aFN5bWJvbHMgZnJvbSAnLi4vLi4vLi4vLi4vc2NlbmVyeS1waGV0L2pzL01hdGhTeW1ib2xzLmpzJztcclxuaW1wb3J0IHsgQ29sb3IsIEhCb3gsIExpbmUsIE5vZGUsIFBhdGgsIFNwYWNlciwgVGV4dCwgVkJveCB9IGZyb20gJy4uLy4uLy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBleWVTbGFzaFNvbGlkU2hhcGUgZnJvbSAnLi4vLi4vLi4vLi4vc2hlcnBhL2pzL2ZvbnRhd2Vzb21lLTUvZXllU2xhc2hTb2xpZFNoYXBlLmpzJztcclxuaW1wb3J0IEVxdWF0aW9uVHlwZXMgZnJvbSAnLi4vLi4vZXF1YXRpb25zL21vZGVsL0VxdWF0aW9uVHlwZXMuanMnO1xyXG5pbXBvcnQgdmVjdG9yQWRkaXRpb24gZnJvbSAnLi4vLi4vdmVjdG9yQWRkaXRpb24uanMnO1xyXG5pbXBvcnQgQ29tcG9uZW50VmVjdG9yU3R5bGVzIGZyb20gJy4uL21vZGVsL0NvbXBvbmVudFZlY3RvclN0eWxlcy5qcyc7XHJcbmltcG9ydCBHcmFwaE9yaWVudGF0aW9ucyBmcm9tICcuLi9tb2RlbC9HcmFwaE9yaWVudGF0aW9ucy5qcyc7XHJcbmltcG9ydCBWZWN0b3JDb2xvclBhbGV0dGUgZnJvbSAnLi4vbW9kZWwvVmVjdG9yQ29sb3JQYWxldHRlLmpzJztcclxuaW1wb3J0IFZlY3RvckFkZGl0aW9uQ29sb3JzIGZyb20gJy4uL1ZlY3RvckFkZGl0aW9uQ29sb3JzLmpzJztcclxuaW1wb3J0IFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzIGZyb20gJy4uL1ZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLmpzJztcclxuaW1wb3J0IEFycm93T3ZlclN5bWJvbE5vZGUgZnJvbSAnLi9BcnJvd092ZXJTeW1ib2xOb2RlLmpzJztcclxuaW1wb3J0IEN1cnZlZEFycm93Tm9kZSBmcm9tICcuL0N1cnZlZEFycm93Tm9kZS5qcyc7XHJcbmltcG9ydCBEYXNoZWRBcnJvd05vZGUgZnJvbSAnLi9EYXNoZWRBcnJvd05vZGUuanMnO1xyXG5pbXBvcnQgeyBjb21iaW5lT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5cclxuLy8gY29uc3RhbnRzXHJcbmNvbnN0IFNDUkVFTl9JQ09OX1dJRFRIID0gNzA7XHJcbmNvbnN0IFNDUkVFTl9JQ09OX0hFSUdIVCA9IFNDUkVFTl9JQ09OX1dJRFRIIC8gU2NyZWVuLkhPTUVfU0NSRUVOX0lDT05fQVNQRUNUX1JBVElPOyAvLyB3L2ggPSByYXRpbyA8PT4gaCA9IHcvcmF0aW9cclxuY29uc3QgUkFESU9fQlVUVE9OX0lDT05fU0laRSA9IDQ1O1xyXG5cclxuY29uc3QgVmVjdG9yQWRkaXRpb25JY29uRmFjdG9yeSA9IHtcclxuXHJcbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgLy8gU2NyZWVuIGljb25zLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3ZlY3Rvci1hZGRpdGlvbi9pc3N1ZXMvNzZcclxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyB0aGUgaWNvbiBmb3IgdGhlICdFeHBsb3JlIDFEJyBTY3JlZW4uXHJcbiAgICovXHJcbiAgY3JlYXRlRXhwbG9yZTFEU2NyZWVuSWNvbigpOiBTY3JlZW5JY29uIHtcclxuXHJcbiAgICBjb25zdCBjb2xvclBhbGV0dGUgPSBWZWN0b3JBZGRpdGlvbkNvbG9ycy5CTFVFX0NPTE9SX1BBTEVUVEU7XHJcblxyXG4gICAgY29uc3QgYXJyb3dOb2RlT3B0aW9ucyA9IGNvbWJpbmVPcHRpb25zPEFycm93Tm9kZU9wdGlvbnM+KCB7fSwgVmVjdG9yQWRkaXRpb25Db25zdGFudHMuVkVDVE9SX0FSUk9XX09QVElPTlMsIHtcclxuICAgICAgZmlsbDogY29sb3JQYWxldHRlLm1haW5GaWxsLFxyXG4gICAgICBzdHJva2U6IGNvbG9yUGFsZXR0ZS5tYWluU3Ryb2tlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gVmVjdG9yIHBvaW50aW5nIHRvIHRoZSByaWdodCwgdGhlIGZ1bGwgd2lkdGggb2YgdGhlIGljb25cclxuICAgIGNvbnN0IHJpZ2h0VmVjdG9yTm9kZSA9IG5ldyBBcnJvd05vZGUoIDAsIDAsIFNDUkVFTl9JQ09OX1dJRFRILCAwLCBhcnJvd05vZGVPcHRpb25zICk7XHJcblxyXG4gICAgLy8gVmVjdG9yIHBvaW50aW5nIHRvIHRoZSBsZWZ0LCBwYXJ0aWFsIHdpZHRoIG9mIHRoZSBpY29uXHJcbiAgICBjb25zdCBsZWZ0VmVjdG9yTm9kZSA9IG5ldyBBcnJvd05vZGUoIDAuNSAqIFNDUkVFTl9JQ09OX1dJRFRILCAwLCAwLCAwLCBhcnJvd05vZGVPcHRpb25zICk7XHJcblxyXG4gICAgY29uc3QgdkJveCA9IG5ldyBWQm94KCB7XHJcbiAgICAgIGFsaWduOiAncmlnaHQnLFxyXG4gICAgICBzcGFjaW5nOiBTQ1JFRU5fSUNPTl9IRUlHSFQgKiAwLjIwLFxyXG4gICAgICBjaGlsZHJlbjogWyByaWdodFZlY3Rvck5vZGUsIGxlZnRWZWN0b3JOb2RlIF1cclxuICAgIH0gKTtcclxuXHJcbiAgICByZXR1cm4gY3JlYXRlU2NyZWVuSWNvbiggWyB2Qm94IF0gKTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIHRoZSBpY29uIGZvciB0aGUgJ0V4cGxvcmUgMkQnIFNjcmVlbi5cclxuICAgKi9cclxuICBjcmVhdGVFeHBsb3JlMkRTY3JlZW5JY29uKCk6IFNjcmVlbkljb24ge1xyXG5cclxuICAgIGNvbnN0IHZlY3RvciA9IG5ldyBWZWN0b3IyKCBTQ1JFRU5fSUNPTl9XSURUSCwgLVNDUkVFTl9JQ09OX0hFSUdIVCAqIDAuOCApO1xyXG4gICAgY29uc3QgY29sb3JQYWxldHRlID0gVmVjdG9yQWRkaXRpb25Db2xvcnMuUElOS19DT0xPUl9QQUxFVFRFO1xyXG5cclxuICAgIC8vIHZlY3RvclxyXG4gICAgY29uc3QgdmVjdG9yTm9kZSA9IG5ldyBBcnJvd05vZGUoIDAsIDAsIHZlY3Rvci54LCB2ZWN0b3IueSxcclxuICAgICAgY29tYmluZU9wdGlvbnM8QXJyb3dOb2RlT3B0aW9ucz4oIHt9LCBWZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5WRUNUT1JfQVJST1dfT1BUSU9OUywge1xyXG4gICAgICAgIGZpbGw6IGNvbG9yUGFsZXR0ZS5tYWluRmlsbCxcclxuICAgICAgICBzdHJva2U6IGNvbG9yUGFsZXR0ZS5tYWluU3Ryb2tlXHJcbiAgICAgIH0gKSApO1xyXG5cclxuICAgIC8vIGNvbXBvbmVudCB2ZWN0b3JzXHJcbiAgICBjb25zdCBkYXNoZWRBcnJvd05vZGVPcHRpb25zID0gbWVyZ2UoIHt9LCBWZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5DT01QT05FTlRfVkVDVE9SX0FSUk9XX09QVElPTlMsIHtcclxuICAgICAgZmlsbDogY29sb3JQYWxldHRlLmNvbXBvbmVudEZpbGxcclxuICAgIH0gKTtcclxuICAgIGNvbnN0IHhDb21wb25lbnROb2RlID0gbmV3IERhc2hlZEFycm93Tm9kZSggMCwgMCwgdmVjdG9yLngsIDAsIGRhc2hlZEFycm93Tm9kZU9wdGlvbnMgKTtcclxuICAgIGNvbnN0IHlDb21wb25lbnROb2RlID0gbmV3IERhc2hlZEFycm93Tm9kZSggdmVjdG9yLngsIDAsIHZlY3Rvci54LCB2ZWN0b3IueSwgZGFzaGVkQXJyb3dOb2RlT3B0aW9ucyApO1xyXG5cclxuICAgIHJldHVybiBjcmVhdGVTY3JlZW5JY29uKCBbIHhDb21wb25lbnROb2RlLCB5Q29tcG9uZW50Tm9kZSwgdmVjdG9yTm9kZSBdICk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyB0aGUgaWNvbiBmb3IgdGhlICdMYWInIFNjcmVlbi5cclxuICAgKi9cclxuICBjcmVhdGVMYWJTY3JlZW5JY29uKCk6IFNjcmVlbkljb24ge1xyXG5cclxuICAgIC8vIHtWZWN0b3IyW119IHRoZSB0aXAgcG9zaXRpb25zIG9mIHRoZSBncm91cCAxIChibHVlKSBhcnJvd3MgKGFsaWduZWQgdGlwIHRvIHRhaWwpXHJcbiAgICBjb25zdCBncm91cDFUaXBQb3NpdGlvbnMgPSBbXHJcbiAgICAgIG5ldyBWZWN0b3IyKCBTQ1JFRU5fSUNPTl9XSURUSCAqIDAuNjMsIDAgKSxcclxuICAgICAgbmV3IFZlY3RvcjIoIFNDUkVFTl9JQ09OX1dJRFRILCAtU0NSRUVOX0lDT05fSEVJR0hUIClcclxuICAgIF07XHJcblxyXG4gICAgLy8ge1ZlY3RvcjJbXX0gdGhlIHRpcCBwb3NpdGlvbnMgb2YgdGhlIGdyb3VwIDIgKG9yYW5nZSkgYXJyb3dzIChhbGlnbmVkIHRpcCB0byB0YWlsKVxyXG4gICAgY29uc3QgZ3JvdXAyVGlwUG9zaXRpb25zID0gW1xyXG4gICAgICBuZXcgVmVjdG9yMiggMCwgLVNDUkVFTl9JQ09OX0hFSUdIVCAqIDAuNyApLFxyXG4gICAgICBuZXcgVmVjdG9yMiggU0NSRUVOX0lDT05fV0lEVEgsIC1TQ1JFRU5fSUNPTl9IRUlHSFQgKVxyXG4gICAgXTtcclxuXHJcbiAgICAvLyBzdGFydGluZyB0YWlsIHBvc2l0aW9uIG9mIDFzdCB2ZWN0b3JcclxuICAgIGNvbnN0IHN0YXJ0aW5nVGFpbFBvc2l0aW9uID0gbmV3IFZlY3RvcjIoIFNDUkVFTl9JQ09OX1dJRFRIIC8gNCwgMCApO1xyXG5cclxuICAgIGNvbnN0IGdyb3VwMUFycm93Tm9kZXMgPSBjcmVhdGVUaXBUb1RhaWxBcnJvd05vZGVzKCBncm91cDFUaXBQb3NpdGlvbnMsIHN0YXJ0aW5nVGFpbFBvc2l0aW9uLFxyXG4gICAgICBjb21iaW5lT3B0aW9uczxBcnJvd05vZGVPcHRpb25zPigge30sIFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLlZFQ1RPUl9BUlJPV19PUFRJT05TLCB7XHJcbiAgICAgICAgZmlsbDogVmVjdG9yQWRkaXRpb25Db2xvcnMuQkxVRV9DT0xPUl9QQUxFVFRFLm1haW5GaWxsLFxyXG4gICAgICAgIHN0cm9rZTogVmVjdG9yQWRkaXRpb25Db2xvcnMuQkxVRV9DT0xPUl9QQUxFVFRFLm1haW5TdHJva2VcclxuICAgICAgfSApICk7XHJcblxyXG4gICAgY29uc3QgZ3JvdXAyQXJyb3dOb2RlcyA9IGNyZWF0ZVRpcFRvVGFpbEFycm93Tm9kZXMoIGdyb3VwMlRpcFBvc2l0aW9ucywgc3RhcnRpbmdUYWlsUG9zaXRpb24sXHJcbiAgICAgIGNvbWJpbmVPcHRpb25zPEFycm93Tm9kZU9wdGlvbnM+KCB7fSwgVmVjdG9yQWRkaXRpb25Db25zdGFudHMuVkVDVE9SX0FSUk9XX09QVElPTlMsIHtcclxuICAgICAgICBmaWxsOiBWZWN0b3JBZGRpdGlvbkNvbG9ycy5PUkFOR0VfQ09MT1JfUEFMRVRURS5tYWluRmlsbCxcclxuICAgICAgICBzdHJva2U6IFZlY3RvckFkZGl0aW9uQ29sb3JzLk9SQU5HRV9DT0xPUl9QQUxFVFRFLm1haW5TdHJva2VcclxuICAgICAgfSApICk7XHJcblxyXG4gICAgcmV0dXJuIGNyZWF0ZVNjcmVlbkljb24oIGdyb3VwMkFycm93Tm9kZXMuY29uY2F0KCBncm91cDFBcnJvd05vZGVzICkgKTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIHRoZSBpY29uIGZvciB0aGUgJ0VxdWF0aW9ucycgU2NyZWVuLlxyXG4gICAqL1xyXG4gIGNyZWF0ZUVxdWF0aW9uc1NjcmVlbkljb24oKTogU2NyZWVuSWNvbiB7XHJcblxyXG4gICAgLy8ge1ZlY3RvcjJbXX0gdGhlIHRpcCBwb3NpdGlvbnMgb2YgdGhlIHZlY3RvcnMgb24gdGhlIGljb24gKHZlY3RvcnMgYXJlIGFsaWduZWQgdGlwIHRvIHRhaWwpXHJcbiAgICBjb25zdCB0aXBQb3NpdGlvbnMgPSBbXHJcbiAgICAgIG5ldyBWZWN0b3IyKCBTQ1JFRU5fSUNPTl9XSURUSCAqIDAuMTUsIC1TQ1JFRU5fSUNPTl9IRUlHSFQgKiAwLjc1ICksXHJcbiAgICAgIG5ldyBWZWN0b3IyKCBTQ1JFRU5fSUNPTl9XSURUSCAqIDAuODUsIC1TQ1JFRU5fSUNPTl9IRUlHSFQgKVxyXG4gICAgXTtcclxuICAgIGNvbnN0IHN0YXJ0VGFpbCA9IFZlY3RvcjIuWkVSTztcclxuICAgIGNvbnN0IGxhc3RUaXAgPSBfLmxhc3QoIHRpcFBvc2l0aW9ucyApITtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGxhc3RUaXAgKTtcclxuXHJcbiAgICBjb25zdCBjb2xvclBhbGV0dGUgPSBWZWN0b3JBZGRpdGlvbkNvbG9ycy5FUVVBVElPTlNfQkxVRV9DT0xPUl9QQUxFVFRFO1xyXG5cclxuICAgIC8vIHZlY3RvcnMsIHRpcCB0byB0YWlsXHJcbiAgICBjb25zdCBhcnJvd05vZGVzID0gY3JlYXRlVGlwVG9UYWlsQXJyb3dOb2RlcyggdGlwUG9zaXRpb25zLCBzdGFydFRhaWwsXHJcbiAgICAgIGNvbWJpbmVPcHRpb25zPEFycm93Tm9kZU9wdGlvbnM+KCB7fSwgVmVjdG9yQWRkaXRpb25Db25zdGFudHMuVkVDVE9SX0FSUk9XX09QVElPTlMsIHtcclxuICAgICAgICBmaWxsOiBjb2xvclBhbGV0dGUubWFpbkZpbGwsXHJcbiAgICAgICAgc3Ryb2tlOiBjb2xvclBhbGV0dGUubWFpblN0cm9rZVxyXG4gICAgICB9ICkgKTtcclxuXHJcbiAgICAvLyBzdW1cclxuICAgIGFycm93Tm9kZXMucHVzaCggbmV3IEFycm93Tm9kZSggc3RhcnRUYWlsLngsIHN0YXJ0VGFpbC55LCBsYXN0VGlwLngsIGxhc3RUaXAueSxcclxuICAgICAgY29tYmluZU9wdGlvbnM8QXJyb3dOb2RlT3B0aW9ucz4oIHt9LCBWZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5TVU1fVkVDVE9SX0FSUk9XX09QVElPTlMsIHtcclxuICAgICAgICBmaWxsOiBjb2xvclBhbGV0dGUuc3VtRmlsbCxcclxuICAgICAgICBzdHJva2U6IGNvbG9yUGFsZXR0ZS5zdW1TdHJva2VcclxuICAgICAgfSApICkgKTtcclxuXHJcbiAgICByZXR1cm4gY3JlYXRlU2NyZWVuSWNvbiggYXJyb3dOb2RlcyApO1xyXG4gIH0sXHJcblxyXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gIC8vIFZlY3RvckNyZWF0b3JQYW5lbCBpY29uc1xyXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gaW5pdGlhbFZlY3RvckNvbXBvbmVudHMgLSB2ZWN0b3IgY29tcG9uZW50cyAoaW4gdmlldyBjb29yZGluYXRlcylcclxuICAgKiBAcGFyYW0gdmVjdG9yQ29sb3JQYWxldHRlIC0gY29sb3IgcGFsZXR0ZSBmb3IgdGhpcyBpY29uJ3MgdmVjdG9yXHJcbiAgICogQHBhcmFtIGFycm93TGVuZ3RoXHJcbiAgICovXHJcbiAgY3JlYXRlVmVjdG9yQ3JlYXRvclBhbmVsSWNvbiggaW5pdGlhbFZlY3RvckNvbXBvbmVudHM6IFZlY3RvcjIsIHZlY3RvckNvbG9yUGFsZXR0ZTogVmVjdG9yQ29sb3JQYWxldHRlLCBhcnJvd0xlbmd0aDogbnVtYmVyICk6IE5vZGUge1xyXG5cclxuICAgIGNvbnN0IGFycm93Q29tcG9uZW50cyA9IGluaXRpYWxWZWN0b3JDb21wb25lbnRzLm5vcm1hbGl6ZWQoKS50aW1lc1NjYWxhciggYXJyb3dMZW5ndGggKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IEFycm93Tm9kZSggMCwgMCwgYXJyb3dDb21wb25lbnRzLngsIGFycm93Q29tcG9uZW50cy55LFxyXG4gICAgICBjb21iaW5lT3B0aW9uczxBcnJvd05vZGVPcHRpb25zPigge30sIFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLlZFQ1RPUl9BUlJPV19PUFRJT05TLCB7XHJcbiAgICAgICAgY3Vyc29yOiAnbW92ZScsXHJcbiAgICAgICAgZmlsbDogdmVjdG9yQ29sb3JQYWxldHRlLm1haW5GaWxsLFxyXG4gICAgICAgIHN0cm9rZTogdmVjdG9yQ29sb3JQYWxldHRlLm1haW5TdHJva2VcclxuICAgICAgfSApICk7XHJcbiAgfSxcclxuXHJcbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgLy8gQ2hlY2tib3ggaWNvbnMgKGkuZS4gc3VtIGljb24sIGFuZ2xlIGljb24pXHJcbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3IgaWNvbiB0aGF0IHBvaW50cyB0byB0aGUgcmlnaHQsIHVzZWQgd2l0aCB2YXJpb3VzIGNoZWNrYm94ZXMuXHJcbiAgICovXHJcbiAgY3JlYXRlVmVjdG9ySWNvbiggdmVjdG9yTGVuZ3RoOiBudW1iZXIsIHByb3ZpZGVkT3B0aW9ucz86IEFycm93Tm9kZU9wdGlvbnMgKTogTm9kZSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IGNvbWJpbmVPcHRpb25zPEFycm93Tm9kZU9wdGlvbnM+KCB7fSwgVmVjdG9yQWRkaXRpb25Db25zdGFudHMuVkVDVE9SX0FSUk9XX09QVElPTlMsIHtcclxuICAgICAgZmlsbDogQ29sb3IuQkxBQ0ssXHJcbiAgICAgIHN0cm9rZTogbnVsbCxcclxuICAgICAgbGluZVdpZHRoOiAxXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IEFycm93Tm9kZSggMCwgMCwgdmVjdG9yTGVuZ3RoLCAwLCBvcHRpb25zICk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyB0aGUgaWNvbiB0aGF0IGFwcGVhcnMgbmV4dCB0byB0aGUgY2hlY2tib3ggdGhhdCB0b2dnbGVzIHRoZSAnQW5nbGUnIHZpc2liaWxpdHlcclxuICAgKi9cclxuICBjcmVhdGVBbmdsZUljb24oKTogTm9kZSB7XHJcblxyXG4gICAgLy8gdmFsdWVzIGRldGVybWluZWQgZW1waXJpY2FsbHlcclxuICAgIGNvbnN0IHdlZGdlTGVuZ3RoID0gMjA7XHJcbiAgICBjb25zdCBhbmdsZSA9IFV0aWxzLnRvUmFkaWFucyggNTAgKTtcclxuICAgIGNvbnN0IGN1cnZlZEFycm93UmFkaXVzID0gMTY7XHJcblxyXG4gICAgY29uc3Qgd2VkZ2VTaGFwZSA9IG5ldyBTaGFwZSgpXHJcbiAgICAgIC5tb3ZlVG8oIHdlZGdlTGVuZ3RoLCAwIClcclxuICAgICAgLmhvcml6b250YWxMaW5lVG8oIDAgKVxyXG4gICAgICAubGluZVRvKCBNYXRoLmNvcyggYW5nbGUgKSAqIHdlZGdlTGVuZ3RoLCAtTWF0aC5zaW4oIGFuZ2xlICkgKiB3ZWRnZUxlbmd0aCApO1xyXG4gICAgY29uc3Qgd2VkZ2VOb2RlID0gbmV3IFBhdGgoIHdlZGdlU2hhcGUsIHtcclxuICAgICAgc3Ryb2tlOiBDb2xvci5CTEFDS1xyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IGN1cnZlZEFycm93Tm9kZSA9IG5ldyBDdXJ2ZWRBcnJvd05vZGUoIGN1cnZlZEFycm93UmFkaXVzLCBhbmdsZSApO1xyXG5cclxuICAgIGNvbnN0IHRoZXRhTm9kZSA9IG5ldyBUZXh0KCBNYXRoU3ltYm9scy5USEVUQSwge1xyXG4gICAgICBmb250OiBWZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5FUVVBVElPTl9TWU1CT0xfRk9OVCxcclxuICAgICAgc2NhbGU6IDAuNzUsXHJcbiAgICAgIGxlZnQ6IGN1cnZlZEFycm93Tm9kZS5yaWdodCArIDQsXHJcbiAgICAgIGNlbnRlclk6IHdlZGdlTm9kZS5jZW50ZXJZXHJcbiAgICB9ICk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBOb2RlKCB7XHJcbiAgICAgIGNoaWxkcmVuOiBbIHdlZGdlTm9kZSwgY3VydmVkQXJyb3dOb2RlLCB0aGV0YU5vZGUgXVxyXG4gICAgfSApO1xyXG4gIH0sXHJcblxyXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gIC8vIENvbXBvbmVudFZlY3RvclN0eWxlcyBpY29ucywgdXNlZCBvbiBDb21wb25lbnQgcmFkaW8gYnV0dG9uc1xyXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIHRoZSBpY29ucyB0aGF0IGdvIG9uIHRoZSBDb21wb25lbnQgU3R5bGUgUmFkaW8gQnV0dG9uIGJhc2VkIG9uIGEgY29tcG9uZW50IHN0eWxlXHJcbiAgICovXHJcbiAgY3JlYXRlQ29tcG9uZW50U3R5bGVSYWRpb0J1dHRvbkljb24oIGNvbXBvbmVudFN0eWxlOiBDb21wb25lbnRWZWN0b3JTdHlsZXMgKTogTm9kZSB7XHJcblxyXG4gICAgY29uc3QgaWNvblNpemUgPSBSQURJT19CVVRUT05fSUNPTl9TSVpFOyAvLyBzaXplIG9mIHRoZSBpY29uIChzcXVhcmUpXHJcblxyXG4gICAgaWYgKCBjb21wb25lbnRTdHlsZSA9PT0gQ29tcG9uZW50VmVjdG9yU3R5bGVzLklOVklTSUJMRSApIHtcclxuICAgICAgcmV0dXJuIGNyZWF0ZUV5ZUNsb3NlSWNvbiggaWNvblNpemUgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzdWJCb3hTaXplID0gUkFESU9fQlVUVE9OX0lDT05fU0laRSAvIDM7IC8vIHNpemUgb2YgdGhlIHN1Yi1ib3ggdGhlIGxlYWRlciBsaW5lcyBjcmVhdGVcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHN1YkJveFNpemUgPCBpY29uU2l6ZSwgYHN1YkJveFNpemUgJHtzdWJCb3hTaXplfSBtdXN0IGJlIDwgaWNvblNpemUgJHtpY29uU2l6ZX1gICk7XHJcblxyXG4gICAgLy8gT3B0aW9ucyBmb3IgbWFpbiAoc29saWQpIGFuZCBjb21wb25lbnQgKGRhc2hlZCkgYXJyb3dzXHJcbiAgICBjb25zdCBhcnJvd05vZGVPcHRpb25zID0gY29tYmluZU9wdGlvbnM8QXJyb3dOb2RlT3B0aW9ucz4oIHt9LCBWZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5WRUNUT1JfQVJST1dfT1BUSU9OUywge1xyXG4gICAgICBmaWxsOiBWZWN0b3JBZGRpdGlvbkNvbG9ycy5CTFVFX0NPTE9SX1BBTEVUVEUubWFpbkZpbGwsXHJcbiAgICAgIHN0cm9rZTogVmVjdG9yQWRkaXRpb25Db2xvcnMuQkxVRV9DT0xPUl9QQUxFVFRFLm1haW5TdHJva2VcclxuICAgIH0gKTtcclxuICAgIGNvbnN0IGRhc2hlZEFycm93Tm9kZU9wdGlvbnMgPSBtZXJnZSgge30sIFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLkNPTVBPTkVOVF9WRUNUT1JfQVJST1dfT1BUSU9OUywge1xyXG4gICAgICBmaWxsOiBWZWN0b3JBZGRpdGlvbkNvbG9ycy5CTFVFX0NPTE9SX1BBTEVUVEUuY29tcG9uZW50RmlsbFxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIEluaXRpYWxpemUgYXJyb3dzIGZvciB0aGUgUEFSQUxMRUxPR1JBTSBjb21wb25lbnQgc3R5bGUgKHdpbGwgYmUgYWRqdXN0ZWQgZm9yIGRpZmZlcmVudCBjb21wb25lbnQgc3R5bGVzKVxyXG4gICAgY29uc3QgdmVjdG9yQXJyb3cgPSBuZXcgQXJyb3dOb2RlKCAwLCAwLCBpY29uU2l6ZSwgLWljb25TaXplLCBhcnJvd05vZGVPcHRpb25zICk7XHJcbiAgICBjb25zdCB4Q29tcG9uZW50QXJyb3cgPSBuZXcgRGFzaGVkQXJyb3dOb2RlKCAwLCAwLCBpY29uU2l6ZSwgMCwgZGFzaGVkQXJyb3dOb2RlT3B0aW9ucyApO1xyXG4gICAgY29uc3QgeUNvbXBvbmVudEFycm93ID0gbmV3IERhc2hlZEFycm93Tm9kZSggMCwgMCwgMCwgLWljb25TaXplLCBkYXNoZWRBcnJvd05vZGVPcHRpb25zICk7XHJcblxyXG4gICAgbGV0IGljb25DaGlsZHJlbjogTm9kZVtdID0gWyB4Q29tcG9uZW50QXJyb3csIHlDb21wb25lbnRBcnJvdywgdmVjdG9yQXJyb3cgXTsgLy8gY2hpbGRyZW4gb2YgdGhlIGljb24gY2hpbGRyZW5cclxuXHJcbiAgICBpZiAoIGNvbXBvbmVudFN0eWxlID09PSBDb21wb25lbnRWZWN0b3JTdHlsZXMuVFJJQU5HTEUgKSB7XHJcbiAgICAgIHlDb21wb25lbnRBcnJvdy5zZXRUYWlsQW5kVGlwKCBpY29uU2l6ZSwgMCwgaWNvblNpemUsIC1pY29uU2l6ZSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGNvbXBvbmVudFN0eWxlID09PSBDb21wb25lbnRWZWN0b3JTdHlsZXMuUFJPSkVDVElPTiApIHtcclxuICAgICAgdmVjdG9yQXJyb3cuc2V0VGFpbEFuZFRpcCggc3ViQm94U2l6ZSwgLXN1YkJveFNpemUsIGljb25TaXplLCAtaWNvblNpemUgKTtcclxuICAgICAgeENvbXBvbmVudEFycm93LnNldFRhaWxBbmRUaXAoIHN1YkJveFNpemUsIDAsIGljb25TaXplLCAwICk7XHJcbiAgICAgIHlDb21wb25lbnRBcnJvdy5zZXRUYWlsQW5kVGlwKCAwLCAtc3ViQm94U2l6ZSwgMCwgLWljb25TaXplICk7XHJcblxyXG4gICAgICAvLyBDcmVhdGUgdGhlIGxlYWRlciBsaW5lc1xyXG4gICAgICBjb25zdCBsZWFkZXJMaW5lc1NoYXBlID0gbmV3IFNoYXBlKCkubW92ZVRvKCAwLCAtc3ViQm94U2l6ZSApXHJcbiAgICAgICAgLmhvcml6b250YWxMaW5lVG8oIHN1YkJveFNpemUgKVxyXG4gICAgICAgIC52ZXJ0aWNhbExpbmVUb1JlbGF0aXZlKCBzdWJCb3hTaXplIClcclxuICAgICAgICAubW92ZVRvKCAwLCAtaWNvblNpemUgKVxyXG4gICAgICAgIC5ob3Jpem9udGFsTGluZVRvKCBpY29uU2l6ZSApXHJcbiAgICAgICAgLnZlcnRpY2FsTGluZVRvUmVsYXRpdmUoIGljb25TaXplICk7XHJcblxyXG4gICAgICBjb25zdCBsZWFkZXJMaW5lc1BhdGggPSBuZXcgUGF0aCggbGVhZGVyTGluZXNTaGFwZSwge1xyXG4gICAgICAgIGxpbmVEYXNoOiBbIDIuOSwgMiBdLFxyXG4gICAgICAgIHN0cm9rZTogJ2JsYWNrJ1xyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICBpY29uQ2hpbGRyZW4gPSBbIGxlYWRlckxpbmVzUGF0aCwgeENvbXBvbmVudEFycm93LCB5Q29tcG9uZW50QXJyb3csIHZlY3RvckFycm93IF07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBOb2RlKCB7XHJcbiAgICAgIGNoaWxkcmVuOiBpY29uQ2hpbGRyZW4sXHJcbiAgICAgIG1heFdpZHRoOiBpY29uU2l6ZSxcclxuICAgICAgbWF4SGVpZ2h0OiBpY29uU2l6ZVxyXG4gICAgfSApO1xyXG4gIH0sXHJcblxyXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgLy8gQ29vcmRpbmF0ZVNuYXBNb2RlcyBpY29ucywgdXNlZCBvbiBzY2VuZSByYWRpbyBidXR0b25zLFxyXG4gIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvdmVjdG9yLWFkZGl0aW9uL2lzc3Vlcy8yMSlcclxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIHRoZSBpY29uIGZvciB0aGUgQ2FydGVzaWFuIHNuYXAgbW9kZSByYWRpbyBidXR0b24uXHJcbiAgICovXHJcbiAgY3JlYXRlQ2FydGVzaWFuU25hcE1vZGVJY29uKCB2ZWN0b3JDb2xvclBhbGV0dGU6IFZlY3RvckNvbG9yUGFsZXR0ZSApOiBOb2RlIHtcclxuXHJcbiAgICBjb25zdCBpY29uU2l6ZSA9IFJBRElPX0JVVFRPTl9JQ09OX1NJWkU7XHJcblxyXG4gICAgLy8gQXJyb3cgdGhhdCBpcyA0NSBkZWdyZWVzIHRvIHRoZSByaWdodCBhbmQgdXBcclxuICAgIGNvbnN0IHZlY3Rvck5vZGUgPSBuZXcgQXJyb3dOb2RlKCAwLCAwLCBpY29uU2l6ZSwgLWljb25TaXplLFxyXG4gICAgICBjb21iaW5lT3B0aW9uczxBcnJvd05vZGVPcHRpb25zPigge30sIFZlY3RvckFkZGl0aW9uQ29uc3RhbnRzLlZFQ1RPUl9BUlJPV19PUFRJT05TLCB7XHJcbiAgICAgICAgZmlsbDogdmVjdG9yQ29sb3JQYWxldHRlLm1haW5GaWxsLFxyXG4gICAgICAgIHN0cm9rZTogdmVjdG9yQ29sb3JQYWxldHRlLm1haW5TdHJva2VcclxuICAgICAgfSApICk7XHJcblxyXG4gICAgLy8geCBhbmQgeSwgQ2FydGVzaWFuIGNvb3JkaW5hdGVzXHJcbiAgICBjb25zdCB4eUFycm93T3B0aW9ucyA9IHtcclxuICAgICAgZmlsbDogJ2JsYWNrJyxcclxuICAgICAgdGFpbFdpZHRoOiAxLFxyXG4gICAgICBoZWFkV2lkdGg6IDYsXHJcbiAgICAgIGhlYWRIZWlnaHQ6IDZcclxuICAgIH07XHJcbiAgICBjb25zdCB4Tm9kZSA9IG5ldyBBcnJvd05vZGUoIDAsIDAsIGljb25TaXplLCAwLCB4eUFycm93T3B0aW9ucyApO1xyXG4gICAgY29uc3QgeU5vZGUgPSBuZXcgQXJyb3dOb2RlKCBpY29uU2l6ZSwgMCwgaWNvblNpemUsIC1pY29uU2l6ZSwgeHlBcnJvd09wdGlvbnMgKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IE5vZGUoIHtcclxuICAgICAgY2hpbGRyZW46IFsgdmVjdG9yTm9kZSwgeE5vZGUsIHlOb2RlIF0sXHJcbiAgICAgIG1heFdpZHRoOiBpY29uU2l6ZSxcclxuICAgICAgbWF4SGVpZ2h0OiBpY29uU2l6ZVxyXG4gICAgfSApO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgdGhlIGljb24gZm9yIHRoZSBQb2xhciBzbmFwIG1vZGUgcmFkaW8gYnV0dG9uLlxyXG4gICAqL1xyXG4gIGNyZWF0ZVBvbGFyU25hcE1vZGVJY29uKCB2ZWN0b3JDb2xvclBhbGV0dGU6IFZlY3RvckNvbG9yUGFsZXR0ZSApOiBOb2RlIHtcclxuXHJcbiAgICBjb25zdCBpY29uU2l6ZSA9IFJBRElPX0JVVFRPTl9JQ09OX1NJWkU7XHJcbiAgICBjb25zdCBhcmNSYWRpdXMgPSAzMDsgLy8gYXJjIHJhZGl1cyBvZiB0aGUgY3VydmVkIGFycm93XHJcblxyXG4gICAgLy8gQXJyb3cgdGhhdCBpcyA0NSBkZWdyZWVzIHRvIHRoZSByaWdodCBhbmQgdXBcclxuICAgIGNvbnN0IGFycm93ID0gbmV3IEFycm93Tm9kZSggMCwgMCwgaWNvblNpemUsIC1pY29uU2l6ZSxcclxuICAgICAgY29tYmluZU9wdGlvbnM8QXJyb3dOb2RlT3B0aW9ucz4oIHt9LCBWZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5WRUNUT1JfQVJST1dfT1BUSU9OUywge1xyXG4gICAgICAgIGZpbGw6IHZlY3RvckNvbG9yUGFsZXR0ZS5tYWluRmlsbCxcclxuICAgICAgICBzdHJva2U6IHZlY3RvckNvbG9yUGFsZXR0ZS5tYWluU3Ryb2tlXHJcbiAgICAgIH0gKSApO1xyXG5cclxuICAgIC8vIEN1cnZlZCBhcnJvdyB0aGF0IGluZGljYXRlcyB0aGUgYW5nbGVcclxuICAgIGNvbnN0IGN1cnZlZEFycm93ID0gbmV3IEN1cnZlZEFycm93Tm9kZSggYXJjUmFkaXVzLCBVdGlscy50b1JhZGlhbnMoIDQ1ICkgKTtcclxuXHJcbiAgICAvLyBob3Jpem9udGFsIGxpbmVcclxuICAgIGNvbnN0IGxpbmUgPSBuZXcgTGluZSggMCwgMCwgaWNvblNpemUsIDAsIHtcclxuICAgICAgc3Ryb2tlOiBDb2xvci5CTEFDS1xyXG4gICAgfSApO1xyXG5cclxuICAgIHJldHVybiBuZXcgTm9kZSgge1xyXG4gICAgICBjaGlsZHJlbjogWyBhcnJvdywgY3VydmVkQXJyb3csIGxpbmUgXSxcclxuICAgICAgbWF4V2lkdGg6IGljb25TaXplLFxyXG4gICAgICBtYXhIZWlnaHQ6IGljb25TaXplXHJcbiAgICB9ICk7XHJcbiAgfSxcclxuXHJcbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAvLyBHcmFwaE9yaWVudGF0aW9ucyBpY29ucyAoaG9yaXpvbnRhbC92ZXJ0aWNhbCksIHVzZWQgb24gc2NlbmUgcmFkaW8gYnV0dG9ucyBpbiBFeHBsb3JlIDFEIHNjcmVlblxyXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgdGhlIGljb24gdXNlZCBvbiB0aGUgcmFkaW8gYnV0dG9ucyBvbiAnRXhwbG9yZSAxRCcgc2NyZWVuIHRoYXQgdG9nZ2xlcyB0aGUgZ3JhcGggb3JpZW50YXRpb24uXHJcbiAgICovXHJcbiAgY3JlYXRlR3JhcGhPcmllbnRhdGlvbkljb24oIGdyYXBoT3JpZW50YXRpb246IEdyYXBoT3JpZW50YXRpb25zICk6IE5vZGUge1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIF8uaW5jbHVkZXMoIFsgR3JhcGhPcmllbnRhdGlvbnMuSE9SSVpPTlRBTCwgR3JhcGhPcmllbnRhdGlvbnMuVkVSVElDQUwgXSwgZ3JhcGhPcmllbnRhdGlvbiApLFxyXG4gICAgICBgaW52YWxpZCBncmFwaE9yaWVudGF0aW9uOiAke2dyYXBoT3JpZW50YXRpb259YCApO1xyXG5cclxuICAgIGNvbnN0IGljb25TaXplID0gUkFESU9fQlVUVE9OX0lDT05fU0laRTtcclxuICAgIGNvbnN0IHRpcFggPSAoIGdyYXBoT3JpZW50YXRpb24gPT09IEdyYXBoT3JpZW50YXRpb25zLkhPUklaT05UQUwgKSA/IGljb25TaXplIDogMDtcclxuICAgIGNvbnN0IHRpcFkgPSAoIGdyYXBoT3JpZW50YXRpb24gPT09IEdyYXBoT3JpZW50YXRpb25zLkhPUklaT05UQUwgKSA/IDAgOiBpY29uU2l6ZTtcclxuXHJcbiAgICByZXR1cm4gbmV3IEFycm93Tm9kZSggMCwgMCwgdGlwWCwgdGlwWSxcclxuICAgICAgY29tYmluZU9wdGlvbnM8QXJyb3dOb2RlT3B0aW9ucz4oIHt9LCBWZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5BWEVTX0FSUk9XX09QVElPTlMsIHtcclxuICAgICAgICBtYXhXaWR0aDogaWNvblNpemUsXHJcbiAgICAgICAgbWF4SGVpZ2h0OiBpY29uU2l6ZVxyXG4gICAgICB9ICkgKTtcclxuICB9LFxyXG5cclxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAvLyBFcXVhdGlvblR5cGVzIGljb25zLCB1c2VkIG9uIHJhZGlvIGJ1dHRvbnMgaW4gRXF1YXRpb25zIHNjcmVlblxyXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIHRoZSBJY29uIHRoYXQgYXBwZWFycyBvbiB0aGUgRXF1YXRpb25UeXBlcyByYWRpbyBidXR0b24gaWNvbnMgb24gdGhlICdFcXVhdGlvbnMnIHNjcmVlbi5cclxuICAgKiBAcGFyYW0gZXF1YXRpb25UeXBlXHJcbiAgICogQHBhcmFtIHZlY3RvclN5bWJvbHMgLSBzeW1ib2xzIG9uIHRoZSBidXR0b25zICh0aGUgbGFzdCBzeW1ib2wgaXMgdGhlIHN1bSdzIHN5bWJvbClcclxuICAgKi9cclxuICBjcmVhdGVFcXVhdGlvblR5cGVJY29uKCBlcXVhdGlvblR5cGU6IEVxdWF0aW9uVHlwZXMsIHZlY3RvclN5bWJvbHM6IHN0cmluZ1tdICk6IE5vZGUge1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIF8uZXZlcnkoIHZlY3RvclN5bWJvbHMsIHN5bWJvbCA9PiB0eXBlb2Ygc3ltYm9sID09PSAnc3RyaW5nJyApICYmIHZlY3RvclN5bWJvbHMubGVuZ3RoID4gMSxcclxuICAgICAgYGludmFsaWQgdmVjdG9yU3ltYm9sczogJHt2ZWN0b3JTeW1ib2xzfWAgKTtcclxuXHJcbiAgICBsZXQgY2hpbGRyZW46IE5vZGVbXSA9IFtdO1xyXG5cclxuICAgIGNvbnN0IHRleHRPcHRpb25zID0ge1xyXG4gICAgICBmb250OiBWZWN0b3JBZGRpdGlvbkNvbnN0YW50cy5FUVVBVElPTl9GT05UXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEdhdGhlciBhbGwgdGhlIHN5bWJvbHMgZm9yIHRoZSBsZWZ0IHNpZGUgb2YgdGhlIGVxdWF0aW9uIGludG8gYW4gYXJyYXkuXHJcbiAgICAvLyBGb3IgTkVHQVRJT04sIGFsbCBzeW1ib2xzIGFyZSBvbiB0aGUgbGVmdCBzaWRlIG9mIHRoZSBlcXVhdGlvblxyXG4gICAgY29uc3QgZXF1YXRpb25MZWZ0U2lkZVN5bWJvbHMgPSBfLmRyb3BSaWdodCggdmVjdG9yU3ltYm9scywgZXF1YXRpb25UeXBlID09PSBFcXVhdGlvblR5cGVzLk5FR0FUSU9OID8gMCA6IDEgKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgYSB2ZWN0b3Igc3ltYm9sIGZvciBlYWNoIHN5bWJvbCBvbiB0aGUgbGVmdCBzaWRlIG9mIHRoZSBlcXVhdGlvbi5cclxuICAgIGVxdWF0aW9uTGVmdFNpZGVTeW1ib2xzLmZvckVhY2goIHN5bWJvbCA9PiB7XHJcbiAgICAgIGNoaWxkcmVuLnB1c2goIG5ldyBBcnJvd092ZXJTeW1ib2xOb2RlKCBzeW1ib2wgKSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIEludGVybGVhdmUgb3BlcmF0b3JzIChpLmUuICcrJ3wnLScpIGluIGJldHdlZW4gZWFjaCBzeW1ib2wgb24gdGhlIGxlZnQgc2lkZSBvZiB0aGUgZXF1YXRpb25cclxuICAgIGNoaWxkcmVuID0gaW50ZXJsZWF2ZSggY2hpbGRyZW4sICgpID0+IHtcclxuICAgICAgY29uc3Qgb3BlcmF0b3IgPSAoIGVxdWF0aW9uVHlwZSA9PT0gRXF1YXRpb25UeXBlcy5TVUJUUkFDVElPTiApID8gTWF0aFN5bWJvbHMuTUlOVVMgOiBNYXRoU3ltYm9scy5QTFVTO1xyXG4gICAgICByZXR1cm4gbmV3IFRleHQoIG9wZXJhdG9yLCB0ZXh0T3B0aW9ucyApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vICc9J1xyXG4gICAgY2hpbGRyZW4ucHVzaCggbmV3IFRleHQoIE1hdGhTeW1ib2xzLkVRVUFMX1RPLCB0ZXh0T3B0aW9ucyApICk7XHJcblxyXG4gICAgLy8gUmlnaHQgc2lkZSBvZiB0aGUgZXF1YXRpb24sIHdoaWNoIGlzIGVpdGhlciAnMCcgb3IgdGhlIGxhc3Qgb2YgdGhlIHN5bWJvbHMgKHdoaWNoIGlzIHRoZSBzdW0pLlxyXG4gICAgY2hpbGRyZW4ucHVzaCggZXF1YXRpb25UeXBlID09PSBFcXVhdGlvblR5cGVzLk5FR0FUSU9OID9cclxuICAgICAgICAgICAgICAgICAgIG5ldyBUZXh0KCAnMCcsIHRleHRPcHRpb25zICkgOlxyXG4gICAgICAgICAgICAgICAgICAgbmV3IEFycm93T3ZlclN5bWJvbE5vZGUoIF8ubGFzdCggdmVjdG9yU3ltYm9scyApISApICk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBIQm94KCB7XHJcbiAgICAgIGNoaWxkcmVuOiBjaGlsZHJlbixcclxuICAgICAgc3BhY2luZzogOCxcclxuICAgICAgYWxpZ246ICdvcmlnaW4nIC8vIHNvIHRoYXQgdGV4dCBiYXNlbGluZXMgYXJlIGFsaWduZWRcclxuICAgIH0gKTtcclxuICB9XHJcbn07XHJcblxyXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuLy8gSGVscGVyIGZ1bmN0aW9uc1xyXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIFZlY3RvciBJY29ucyAoQXJyb3dOb2RlKSB0aXAgdG8gdGFpbCBiYXNlZCBvbiBhbiBhcnJheSBvZiB0aXAgcG9zaXRpb25zIGFsb25nIHdpdGggdGhlIHRhaWwgcG9zaXRpb24gb2YgdGhlXHJcbiAqIGZpcnN0IFZlY3Rvci4gQXJyb3dOb2RlcyBhcmUgY3JlYXRlZCBhbmQgcHVzaGVkIHRvIGEgZ2l2ZW4gYXJyYXkuXHJcbiAqXHJcbiAqIEBwYXJhbSB0aXBQb3NpdGlvbnMgLSB0aXAgcG9zaXRpb25zIG9mIGFsbCB2ZWN0b3JzICh2ZWN0b3JzIGFyZSBhbGlnbmVkIHRpcCB0byB0YWlsKVxyXG4gKiBAcGFyYW0gc3RhcnRpbmdUYWlsUG9zaXRpb24gLSB0YWlsIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCB2ZWN0b3JcclxuICogQHBhcmFtIFthcnJvd05vZGVPcHRpb25zXSAtIHBhc3NlZCB0byBBcnJvd05vZGUgY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIGNyZWF0ZVRpcFRvVGFpbEFycm93Tm9kZXMoIHRpcFBvc2l0aW9uczogVmVjdG9yMltdLCBzdGFydGluZ1RhaWxQb3NpdGlvbjogVmVjdG9yMiwgYXJyb3dOb2RlT3B0aW9ucz86IEFycm93Tm9kZU9wdGlvbnMgKTogQXJyb3dOb2RlW10ge1xyXG5cclxuICBjb25zdCBhcnJvd05vZGVzID0gW107XHJcbiAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGlwUG9zaXRpb25zLmxlbmd0aDsgaSsrICkge1xyXG4gICAgY29uc3QgdGFpbFBvc2l0aW9uID0gKCBpID09PSAwICkgPyBzdGFydGluZ1RhaWxQb3NpdGlvbiA6IHRpcFBvc2l0aW9uc1sgaSAtIDEgXTtcclxuICAgIGNvbnN0IHRpcFBvc2l0aW9uID0gdGlwUG9zaXRpb25zWyBpIF07XHJcbiAgICBhcnJvd05vZGVzLnB1c2goIG5ldyBBcnJvd05vZGUoIHRhaWxQb3NpdGlvbi54LCB0YWlsUG9zaXRpb24ueSwgdGlwUG9zaXRpb24ueCwgdGlwUG9zaXRpb24ueSwgYXJyb3dOb2RlT3B0aW9ucyApICk7XHJcbiAgfVxyXG4gIHJldHVybiBhcnJvd05vZGVzO1xyXG59XHJcblxyXG4vKipcclxuICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy92ZWN0b3ItYWRkaXRpb24vaXNzdWVzLzc2I2lzc3VlY29tbWVudC01MTUxOTc1NDcgZm9yIGNvbnRleHQuXHJcbiAqIEhlbHBlciBmdW5jdGlvbiB0aGF0IGNyZWF0ZXMgYSBTY3JlZW5JY29uIGJ1dCBhZGRzIGEgU3BhY2VyIHRvIGZpbGwgZXh0cmEgc3BhY2UuIFRoaXMgZW5zdXJlcyBhbGwgc2NyZWVuIGljb25zIGFyZVxyXG4gKiB0aGUgc2FtZSB3aWR0aCBhbmQgaGVpZ2h0IHdoaWNoIGVuc3VyZXMgdGhhdCB0aGV5IGFyZSBhbGwgc2NhbGVkIHRoZSBzYW1lLiBUaHVzLCB0aGlzIGtlZXBzIGFsbCBBcnJvdyBOb2RlcyBpbnNpZGVcclxuICogb2Ygc2NyZWVuIGljb25zIHRoZSBzYW1lICdkaW1lbnNpb25zJyAoaS5lLiB0YWlsV2lkdGgsIGhlYWRXaWR0aCwgaGVhZEhlaWdodCwgZXRjLiApLlxyXG4gKi9cclxuZnVuY3Rpb24gY3JlYXRlU2NyZWVuSWNvbiggY2hpbGRyZW46IE5vZGVbXSApOiBTY3JlZW5JY29uIHtcclxuXHJcbiAgLy8gQ3JlYXRlIHRoZSBpY29uLCBhZGRpbmcgYSBTcGFjZXIgdG8gZmlsbCBleHRyYSBzcGFjZSBpZiBuZWVkZWQgKEVxdWl2YWxlbnQgdG8gc2V0dGluZyBhIG1pbmltdW0gd2lkdGgvaGVpZ2h0KVxyXG4gIGNvbnN0IGljb25Ob2RlID0gbmV3IE5vZGUoKS5hZGRDaGlsZCggbmV3IFNwYWNlciggU0NSRUVOX0lDT05fV0lEVEgsIFNDUkVFTl9JQ09OX0hFSUdIVCwgeyBwaWNrYWJsZTogZmFsc2UgfSApICk7XHJcblxyXG4gIGljb25Ob2RlLmFkZENoaWxkKCBuZXcgTm9kZSggeyAvLyBXcmFwIHRoZSBpY29uIGNvbnRlbnQgaW4gYSBOb2RlXHJcbiAgICBjaGlsZHJlbjogY2hpbGRyZW4sXHJcbiAgICBjZW50ZXI6IGljb25Ob2RlLmNlbnRlcixcclxuICAgIG1heFdpZHRoOiBTQ1JFRU5fSUNPTl9XSURUSCwgLy8gRW5zdXJlcyB0aGUgaWNvbiBkb2Vzbid0IGdldCB3aWRlciB0aGFuIHRoZSBmaXhlZCBzY3JlZW4gaWNvbiBkaW1lbnNpb25zXHJcbiAgICBtYXhIZWlnaHQ6IFNDUkVFTl9JQ09OX0hFSUdIVCAvLyBFbnN1cmVzIHRoZSBpY29uIGRvZXNuJ3QgZ2V0IHRhbGxlciB0aGFuIHRoZSBmaXhlZCBzY3JlZW4gaWNvbiBkaW1lbnNpb25zXHJcbiAgfSApICk7XHJcblxyXG4gIHJldHVybiBuZXcgU2NyZWVuSWNvbiggaWNvbk5vZGUgKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSB0aGUgY2xvc2UgZXllIGljb24sIGZvciBDb21wb25lbnRWZWN0b3JTdHlsZXMuSU5WSVNJQkxFLlxyXG4gKi9cclxuZnVuY3Rpb24gY3JlYXRlRXllQ2xvc2VJY29uKCBpY29uU2l6ZTogbnVtYmVyICk6IE5vZGUge1xyXG5cclxuICBjb25zdCBzcGFjZXIgPSBuZXcgU3BhY2VyKCBpY29uU2l6ZSwgaWNvblNpemUgKTtcclxuXHJcbiAgY29uc3QgZXllSWNvbiA9IG5ldyBQYXRoKCBleWVTbGFzaFNvbGlkU2hhcGUsIHtcclxuICAgIHNjYWxlOiAwLjA2OCwgLy8gZGV0ZXJtaW5lZCBlbXBpcmljYWxseVxyXG4gICAgZmlsbDogJ2JsYWNrJyxcclxuICAgIGNlbnRlcjogc3BhY2VyLmNlbnRlclxyXG4gIH0gKTtcclxuXHJcbiAgcmV0dXJuIG5ldyBOb2RlKCB7XHJcbiAgICBjaGlsZHJlbjogWyBzcGFjZXIsIGV5ZUljb24gXSxcclxuICAgIG1heFdpZHRoOiBpY29uU2l6ZSxcclxuICAgIG1heEhlaWdodDogaWNvblNpemVcclxuICB9ICk7XHJcbn1cclxuXHJcbnZlY3RvckFkZGl0aW9uLnJlZ2lzdGVyKCAnVmVjdG9yQWRkaXRpb25JY29uRmFjdG9yeScsIFZlY3RvckFkZGl0aW9uSWNvbkZhY3RvcnkgKTtcclxuZXhwb3J0IGRlZmF1bHQgVmVjdG9yQWRkaXRpb25JY29uRmFjdG9yeTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxLQUFLLE1BQU0sNkJBQTZCO0FBQy9DLE9BQU9DLE9BQU8sTUFBTSwrQkFBK0I7QUFDbkQsT0FBT0MsTUFBTSxNQUFNLGdDQUFnQztBQUNuRCxPQUFPQyxVQUFVLE1BQU0sb0NBQW9DO0FBQzNELFNBQVNDLEtBQUssUUFBUSxnQ0FBZ0M7QUFDdEQsT0FBT0MsVUFBVSxNQUFNLHdDQUF3QztBQUMvRCxPQUFPQyxLQUFLLE1BQU0sbUNBQW1DO0FBQ3JELE9BQU9DLFNBQVMsTUFBNEIsMENBQTBDO0FBQ3RGLE9BQU9DLFdBQVcsTUFBTSw0Q0FBNEM7QUFDcEUsU0FBU0MsS0FBSyxFQUFFQyxJQUFJLEVBQUVDLElBQUksRUFBRUMsSUFBSSxFQUFFQyxJQUFJLEVBQUVDLE1BQU0sRUFBRUMsSUFBSSxFQUFFQyxJQUFJLFFBQVEsbUNBQW1DO0FBQ3JHLE9BQU9DLGtCQUFrQixNQUFNLDJEQUEyRDtBQUMxRixPQUFPQyxhQUFhLE1BQU0sd0NBQXdDO0FBQ2xFLE9BQU9DLGNBQWMsTUFBTSx5QkFBeUI7QUFDcEQsT0FBT0MscUJBQXFCLE1BQU0sbUNBQW1DO0FBQ3JFLE9BQU9DLGlCQUFpQixNQUFNLCtCQUErQjtBQUU3RCxPQUFPQyxvQkFBb0IsTUFBTSw0QkFBNEI7QUFDN0QsT0FBT0MsdUJBQXVCLE1BQU0sK0JBQStCO0FBQ25FLE9BQU9DLG1CQUFtQixNQUFNLDBCQUEwQjtBQUMxRCxPQUFPQyxlQUFlLE1BQU0sc0JBQXNCO0FBQ2xELE9BQU9DLGVBQWUsTUFBTSxzQkFBc0I7QUFDbEQsU0FBU0MsY0FBYyxRQUFRLHVDQUF1Qzs7QUFFdEU7QUFDQSxNQUFNQyxpQkFBaUIsR0FBRyxFQUFFO0FBQzVCLE1BQU1DLGtCQUFrQixHQUFHRCxpQkFBaUIsR0FBRzFCLE1BQU0sQ0FBQzRCLDZCQUE2QixDQUFDLENBQUM7QUFDckYsTUFBTUMsc0JBQXNCLEdBQUcsRUFBRTtBQUVqQyxNQUFNQyx5QkFBeUIsR0FBRztFQUVoQztFQUNBO0VBQ0E7O0VBRUE7QUFDRjtBQUNBO0VBQ0VDLHlCQUF5QkEsQ0FBQSxFQUFlO0lBRXRDLE1BQU1DLFlBQVksR0FBR1osb0JBQW9CLENBQUNhLGtCQUFrQjtJQUU1RCxNQUFNQyxnQkFBZ0IsR0FBR1QsY0FBYyxDQUFvQixDQUFDLENBQUMsRUFBRUosdUJBQXVCLENBQUNjLG9CQUFvQixFQUFFO01BQzNHQyxJQUFJLEVBQUVKLFlBQVksQ0FBQ0ssUUFBUTtNQUMzQkMsTUFBTSxFQUFFTixZQUFZLENBQUNPO0lBQ3ZCLENBQUUsQ0FBQzs7SUFFSDtJQUNBLE1BQU1DLGVBQWUsR0FBRyxJQUFJbkMsU0FBUyxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUVxQixpQkFBaUIsRUFBRSxDQUFDLEVBQUVRLGdCQUFpQixDQUFDOztJQUVyRjtJQUNBLE1BQU1PLGNBQWMsR0FBRyxJQUFJcEMsU0FBUyxDQUFFLEdBQUcsR0FBR3FCLGlCQUFpQixFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFUSxnQkFBaUIsQ0FBQztJQUUxRixNQUFNUSxJQUFJLEdBQUcsSUFBSTVCLElBQUksQ0FBRTtNQUNyQjZCLEtBQUssRUFBRSxPQUFPO01BQ2RDLE9BQU8sRUFBRWpCLGtCQUFrQixHQUFHLElBQUk7TUFDbENrQixRQUFRLEVBQUUsQ0FBRUwsZUFBZSxFQUFFQyxjQUFjO0lBQzdDLENBQUUsQ0FBQztJQUVILE9BQU9LLGdCQUFnQixDQUFFLENBQUVKLElBQUksQ0FBRyxDQUFDO0VBQ3JDLENBQUM7RUFFRDtBQUNGO0FBQ0E7RUFDRUsseUJBQXlCQSxDQUFBLEVBQWU7SUFFdEMsTUFBTUMsTUFBTSxHQUFHLElBQUlqRCxPQUFPLENBQUUyQixpQkFBaUIsRUFBRSxDQUFDQyxrQkFBa0IsR0FBRyxHQUFJLENBQUM7SUFDMUUsTUFBTUssWUFBWSxHQUFHWixvQkFBb0IsQ0FBQzZCLGtCQUFrQjs7SUFFNUQ7SUFDQSxNQUFNQyxVQUFVLEdBQUcsSUFBSTdDLFNBQVMsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFMkMsTUFBTSxDQUFDRyxDQUFDLEVBQUVILE1BQU0sQ0FBQ0ksQ0FBQyxFQUN4RDNCLGNBQWMsQ0FBb0IsQ0FBQyxDQUFDLEVBQUVKLHVCQUF1QixDQUFDYyxvQkFBb0IsRUFBRTtNQUNsRkMsSUFBSSxFQUFFSixZQUFZLENBQUNLLFFBQVE7TUFDM0JDLE1BQU0sRUFBRU4sWUFBWSxDQUFDTztJQUN2QixDQUFFLENBQUUsQ0FBQzs7SUFFUDtJQUNBLE1BQU1jLHNCQUFzQixHQUFHakQsS0FBSyxDQUFFLENBQUMsQ0FBQyxFQUFFaUIsdUJBQXVCLENBQUNpQyw4QkFBOEIsRUFBRTtNQUNoR2xCLElBQUksRUFBRUosWUFBWSxDQUFDdUI7SUFDckIsQ0FBRSxDQUFDO0lBQ0gsTUFBTUMsY0FBYyxHQUFHLElBQUloQyxlQUFlLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRXdCLE1BQU0sQ0FBQ0csQ0FBQyxFQUFFLENBQUMsRUFBRUUsc0JBQXVCLENBQUM7SUFDdkYsTUFBTUksY0FBYyxHQUFHLElBQUlqQyxlQUFlLENBQUV3QixNQUFNLENBQUNHLENBQUMsRUFBRSxDQUFDLEVBQUVILE1BQU0sQ0FBQ0csQ0FBQyxFQUFFSCxNQUFNLENBQUNJLENBQUMsRUFBRUMsc0JBQXVCLENBQUM7SUFFckcsT0FBT1AsZ0JBQWdCLENBQUUsQ0FBRVUsY0FBYyxFQUFFQyxjQUFjLEVBQUVQLFVBQVUsQ0FBRyxDQUFDO0VBQzNFLENBQUM7RUFFRDtBQUNGO0FBQ0E7RUFDRVEsbUJBQW1CQSxDQUFBLEVBQWU7SUFFaEM7SUFDQSxNQUFNQyxrQkFBa0IsR0FBRyxDQUN6QixJQUFJNUQsT0FBTyxDQUFFMkIsaUJBQWlCLEdBQUcsSUFBSSxFQUFFLENBQUUsQ0FBQyxFQUMxQyxJQUFJM0IsT0FBTyxDQUFFMkIsaUJBQWlCLEVBQUUsQ0FBQ0Msa0JBQW1CLENBQUMsQ0FDdEQ7O0lBRUQ7SUFDQSxNQUFNaUMsa0JBQWtCLEdBQUcsQ0FDekIsSUFBSTdELE9BQU8sQ0FBRSxDQUFDLEVBQUUsQ0FBQzRCLGtCQUFrQixHQUFHLEdBQUksQ0FBQyxFQUMzQyxJQUFJNUIsT0FBTyxDQUFFMkIsaUJBQWlCLEVBQUUsQ0FBQ0Msa0JBQW1CLENBQUMsQ0FDdEQ7O0lBRUQ7SUFDQSxNQUFNa0Msb0JBQW9CLEdBQUcsSUFBSTlELE9BQU8sQ0FBRTJCLGlCQUFpQixHQUFHLENBQUMsRUFBRSxDQUFFLENBQUM7SUFFcEUsTUFBTW9DLGdCQUFnQixHQUFHQyx5QkFBeUIsQ0FBRUosa0JBQWtCLEVBQUVFLG9CQUFvQixFQUMxRnBDLGNBQWMsQ0FBb0IsQ0FBQyxDQUFDLEVBQUVKLHVCQUF1QixDQUFDYyxvQkFBb0IsRUFBRTtNQUNsRkMsSUFBSSxFQUFFaEIsb0JBQW9CLENBQUNhLGtCQUFrQixDQUFDSSxRQUFRO01BQ3REQyxNQUFNLEVBQUVsQixvQkFBb0IsQ0FBQ2Esa0JBQWtCLENBQUNNO0lBQ2xELENBQUUsQ0FBRSxDQUFDO0lBRVAsTUFBTXlCLGdCQUFnQixHQUFHRCx5QkFBeUIsQ0FBRUgsa0JBQWtCLEVBQUVDLG9CQUFvQixFQUMxRnBDLGNBQWMsQ0FBb0IsQ0FBQyxDQUFDLEVBQUVKLHVCQUF1QixDQUFDYyxvQkFBb0IsRUFBRTtNQUNsRkMsSUFBSSxFQUFFaEIsb0JBQW9CLENBQUM2QyxvQkFBb0IsQ0FBQzVCLFFBQVE7TUFDeERDLE1BQU0sRUFBRWxCLG9CQUFvQixDQUFDNkMsb0JBQW9CLENBQUMxQjtJQUNwRCxDQUFFLENBQUUsQ0FBQztJQUVQLE9BQU9PLGdCQUFnQixDQUFFa0IsZ0JBQWdCLENBQUNFLE1BQU0sQ0FBRUosZ0JBQWlCLENBQUUsQ0FBQztFQUN4RSxDQUFDO0VBRUQ7QUFDRjtBQUNBO0VBQ0VLLHlCQUF5QkEsQ0FBQSxFQUFlO0lBRXRDO0lBQ0EsTUFBTUMsWUFBWSxHQUFHLENBQ25CLElBQUlyRSxPQUFPLENBQUUyQixpQkFBaUIsR0FBRyxJQUFJLEVBQUUsQ0FBQ0Msa0JBQWtCLEdBQUcsSUFBSyxDQUFDLEVBQ25FLElBQUk1QixPQUFPLENBQUUyQixpQkFBaUIsR0FBRyxJQUFJLEVBQUUsQ0FBQ0Msa0JBQW1CLENBQUMsQ0FDN0Q7SUFDRCxNQUFNMEMsU0FBUyxHQUFHdEUsT0FBTyxDQUFDdUUsSUFBSTtJQUM5QixNQUFNQyxPQUFPLEdBQUdDLENBQUMsQ0FBQ0MsSUFBSSxDQUFFTCxZQUFhLENBQUU7SUFDdkNNLE1BQU0sSUFBSUEsTUFBTSxDQUFFSCxPQUFRLENBQUM7SUFFM0IsTUFBTXZDLFlBQVksR0FBR1osb0JBQW9CLENBQUN1RCw0QkFBNEI7O0lBRXRFO0lBQ0EsTUFBTUMsVUFBVSxHQUFHYix5QkFBeUIsQ0FBRUssWUFBWSxFQUFFQyxTQUFTLEVBQ25FNUMsY0FBYyxDQUFvQixDQUFDLENBQUMsRUFBRUosdUJBQXVCLENBQUNjLG9CQUFvQixFQUFFO01BQ2xGQyxJQUFJLEVBQUVKLFlBQVksQ0FBQ0ssUUFBUTtNQUMzQkMsTUFBTSxFQUFFTixZQUFZLENBQUNPO0lBQ3ZCLENBQUUsQ0FBRSxDQUFDOztJQUVQO0lBQ0FxQyxVQUFVLENBQUNDLElBQUksQ0FBRSxJQUFJeEUsU0FBUyxDQUFFZ0UsU0FBUyxDQUFDbEIsQ0FBQyxFQUFFa0IsU0FBUyxDQUFDakIsQ0FBQyxFQUFFbUIsT0FBTyxDQUFDcEIsQ0FBQyxFQUFFb0IsT0FBTyxDQUFDbkIsQ0FBQyxFQUM1RTNCLGNBQWMsQ0FBb0IsQ0FBQyxDQUFDLEVBQUVKLHVCQUF1QixDQUFDeUQsd0JBQXdCLEVBQUU7TUFDdEYxQyxJQUFJLEVBQUVKLFlBQVksQ0FBQytDLE9BQU87TUFDMUJ6QyxNQUFNLEVBQUVOLFlBQVksQ0FBQ2dEO0lBQ3ZCLENBQUUsQ0FBRSxDQUFFLENBQUM7SUFFVCxPQUFPbEMsZ0JBQWdCLENBQUU4QixVQUFXLENBQUM7RUFDdkMsQ0FBQztFQUVEO0VBQ0E7RUFDQTs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0VLLDRCQUE0QkEsQ0FBRUMsdUJBQWdDLEVBQUVDLGtCQUFzQyxFQUFFQyxXQUFtQixFQUFTO0lBRWxJLE1BQU1DLGVBQWUsR0FBR0gsdUJBQXVCLENBQUNJLFVBQVUsQ0FBQyxDQUFDLENBQUNDLFdBQVcsQ0FBRUgsV0FBWSxDQUFDO0lBRXZGLE9BQU8sSUFBSS9FLFNBQVMsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFZ0YsZUFBZSxDQUFDbEMsQ0FBQyxFQUFFa0MsZUFBZSxDQUFDakMsQ0FBQyxFQUM5RDNCLGNBQWMsQ0FBb0IsQ0FBQyxDQUFDLEVBQUVKLHVCQUF1QixDQUFDYyxvQkFBb0IsRUFBRTtNQUNsRnFELE1BQU0sRUFBRSxNQUFNO01BQ2RwRCxJQUFJLEVBQUUrQyxrQkFBa0IsQ0FBQzlDLFFBQVE7TUFDakNDLE1BQU0sRUFBRTZDLGtCQUFrQixDQUFDNUM7SUFDN0IsQ0FBRSxDQUFFLENBQUM7RUFDVCxDQUFDO0VBRUQ7RUFDQTtFQUNBOztFQUVBO0FBQ0Y7QUFDQTtFQUNFa0QsZ0JBQWdCQSxDQUFFQyxZQUFvQixFQUFFQyxlQUFrQyxFQUFTO0lBRWpGLE1BQU1DLE9BQU8sR0FBR25FLGNBQWMsQ0FBb0IsQ0FBQyxDQUFDLEVBQUVKLHVCQUF1QixDQUFDYyxvQkFBb0IsRUFBRTtNQUNsR0MsSUFBSSxFQUFFN0IsS0FBSyxDQUFDc0YsS0FBSztNQUNqQnZELE1BQU0sRUFBRSxJQUFJO01BQ1p3RCxTQUFTLEVBQUU7SUFDYixDQUFDLEVBQUVILGVBQWdCLENBQUM7SUFFcEIsT0FBTyxJQUFJdEYsU0FBUyxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUVxRixZQUFZLEVBQUUsQ0FBQyxFQUFFRSxPQUFRLENBQUM7RUFDeEQsQ0FBQztFQUVEO0FBQ0Y7QUFDQTtFQUNFRyxlQUFlQSxDQUFBLEVBQVM7SUFFdEI7SUFDQSxNQUFNQyxXQUFXLEdBQUcsRUFBRTtJQUN0QixNQUFNQyxLQUFLLEdBQUduRyxLQUFLLENBQUNvRyxTQUFTLENBQUUsRUFBRyxDQUFDO0lBQ25DLE1BQU1DLGlCQUFpQixHQUFHLEVBQUU7SUFFNUIsTUFBTUMsVUFBVSxHQUFHLElBQUlsRyxLQUFLLENBQUMsQ0FBQyxDQUMzQm1HLE1BQU0sQ0FBRUwsV0FBVyxFQUFFLENBQUUsQ0FBQyxDQUN4Qk0sZ0JBQWdCLENBQUUsQ0FBRSxDQUFDLENBQ3JCQyxNQUFNLENBQUVDLElBQUksQ0FBQ0MsR0FBRyxDQUFFUixLQUFNLENBQUMsR0FBR0QsV0FBVyxFQUFFLENBQUNRLElBQUksQ0FBQ0UsR0FBRyxDQUFFVCxLQUFNLENBQUMsR0FBR0QsV0FBWSxDQUFDO0lBQzlFLE1BQU1XLFNBQVMsR0FBRyxJQUFJaEcsSUFBSSxDQUFFeUYsVUFBVSxFQUFFO01BQ3RDOUQsTUFBTSxFQUFFL0IsS0FBSyxDQUFDc0Y7SUFDaEIsQ0FBRSxDQUFDO0lBRUgsTUFBTWUsZUFBZSxHQUFHLElBQUlyRixlQUFlLENBQUU0RSxpQkFBaUIsRUFBRUYsS0FBTSxDQUFDO0lBRXZFLE1BQU1ZLFNBQVMsR0FBRyxJQUFJaEcsSUFBSSxDQUFFUCxXQUFXLENBQUN3RyxLQUFLLEVBQUU7TUFDN0NDLElBQUksRUFBRTFGLHVCQUF1QixDQUFDMkYsb0JBQW9CO01BQ2xEQyxLQUFLLEVBQUUsSUFBSTtNQUNYQyxJQUFJLEVBQUVOLGVBQWUsQ0FBQ08sS0FBSyxHQUFHLENBQUM7TUFDL0JDLE9BQU8sRUFBRVQsU0FBUyxDQUFDUztJQUNyQixDQUFFLENBQUM7SUFFSCxPQUFPLElBQUkxRyxJQUFJLENBQUU7TUFDZm1DLFFBQVEsRUFBRSxDQUFFOEQsU0FBUyxFQUFFQyxlQUFlLEVBQUVDLFNBQVM7SUFDbkQsQ0FBRSxDQUFDO0VBQ0wsQ0FBQztFQUVEO0VBQ0E7RUFDQTs7RUFFQTtBQUNGO0FBQ0E7RUFDRVEsbUNBQW1DQSxDQUFFQyxjQUFxQyxFQUFTO0lBRWpGLE1BQU1DLFFBQVEsR0FBRzFGLHNCQUFzQixDQUFDLENBQUM7O0lBRXpDLElBQUt5RixjQUFjLEtBQUtwRyxxQkFBcUIsQ0FBQ3NHLFNBQVMsRUFBRztNQUN4RCxPQUFPQyxrQkFBa0IsQ0FBRUYsUUFBUyxDQUFDO0lBQ3ZDO0lBRUEsTUFBTUcsVUFBVSxHQUFHN0Ysc0JBQXNCLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDL0M2QyxNQUFNLElBQUlBLE1BQU0sQ0FBRWdELFVBQVUsR0FBR0gsUUFBUSxFQUFHLGNBQWFHLFVBQVcsdUJBQXNCSCxRQUFTLEVBQUUsQ0FBQzs7SUFFcEc7SUFDQSxNQUFNckYsZ0JBQWdCLEdBQUdULGNBQWMsQ0FBb0IsQ0FBQyxDQUFDLEVBQUVKLHVCQUF1QixDQUFDYyxvQkFBb0IsRUFBRTtNQUMzR0MsSUFBSSxFQUFFaEIsb0JBQW9CLENBQUNhLGtCQUFrQixDQUFDSSxRQUFRO01BQ3REQyxNQUFNLEVBQUVsQixvQkFBb0IsQ0FBQ2Esa0JBQWtCLENBQUNNO0lBQ2xELENBQUUsQ0FBQztJQUNILE1BQU1jLHNCQUFzQixHQUFHakQsS0FBSyxDQUFFLENBQUMsQ0FBQyxFQUFFaUIsdUJBQXVCLENBQUNpQyw4QkFBOEIsRUFBRTtNQUNoR2xCLElBQUksRUFBRWhCLG9CQUFvQixDQUFDYSxrQkFBa0IsQ0FBQ3NCO0lBQ2hELENBQUUsQ0FBQzs7SUFFSDtJQUNBLE1BQU1vRSxXQUFXLEdBQUcsSUFBSXRILFNBQVMsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFa0gsUUFBUSxFQUFFLENBQUNBLFFBQVEsRUFBRXJGLGdCQUFpQixDQUFDO0lBQ2hGLE1BQU0wRixlQUFlLEdBQUcsSUFBSXBHLGVBQWUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFK0YsUUFBUSxFQUFFLENBQUMsRUFBRWxFLHNCQUF1QixDQUFDO0lBQ3hGLE1BQU13RSxlQUFlLEdBQUcsSUFBSXJHLGVBQWUsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDK0YsUUFBUSxFQUFFbEUsc0JBQXVCLENBQUM7SUFFekYsSUFBSXlFLFlBQW9CLEdBQUcsQ0FBRUYsZUFBZSxFQUFFQyxlQUFlLEVBQUVGLFdBQVcsQ0FBRSxDQUFDLENBQUM7O0lBRTlFLElBQUtMLGNBQWMsS0FBS3BHLHFCQUFxQixDQUFDNkcsUUFBUSxFQUFHO01BQ3ZERixlQUFlLENBQUNHLGFBQWEsQ0FBRVQsUUFBUSxFQUFFLENBQUMsRUFBRUEsUUFBUSxFQUFFLENBQUNBLFFBQVMsQ0FBQztJQUNuRSxDQUFDLE1BQ0ksSUFBS0QsY0FBYyxLQUFLcEcscUJBQXFCLENBQUMrRyxVQUFVLEVBQUc7TUFDOUROLFdBQVcsQ0FBQ0ssYUFBYSxDQUFFTixVQUFVLEVBQUUsQ0FBQ0EsVUFBVSxFQUFFSCxRQUFRLEVBQUUsQ0FBQ0EsUUFBUyxDQUFDO01BQ3pFSyxlQUFlLENBQUNJLGFBQWEsQ0FBRU4sVUFBVSxFQUFFLENBQUMsRUFBRUgsUUFBUSxFQUFFLENBQUUsQ0FBQztNQUMzRE0sZUFBZSxDQUFDRyxhQUFhLENBQUUsQ0FBQyxFQUFFLENBQUNOLFVBQVUsRUFBRSxDQUFDLEVBQUUsQ0FBQ0gsUUFBUyxDQUFDOztNQUU3RDtNQUNBLE1BQU1XLGdCQUFnQixHQUFHLElBQUloSSxLQUFLLENBQUMsQ0FBQyxDQUFDbUcsTUFBTSxDQUFFLENBQUMsRUFBRSxDQUFDcUIsVUFBVyxDQUFDLENBQzFEcEIsZ0JBQWdCLENBQUVvQixVQUFXLENBQUMsQ0FDOUJTLHNCQUFzQixDQUFFVCxVQUFXLENBQUMsQ0FDcENyQixNQUFNLENBQUUsQ0FBQyxFQUFFLENBQUNrQixRQUFTLENBQUMsQ0FDdEJqQixnQkFBZ0IsQ0FBRWlCLFFBQVMsQ0FBQyxDQUM1Qlksc0JBQXNCLENBQUVaLFFBQVMsQ0FBQztNQUVyQyxNQUFNYSxlQUFlLEdBQUcsSUFBSXpILElBQUksQ0FBRXVILGdCQUFnQixFQUFFO1FBQ2xERyxRQUFRLEVBQUUsQ0FBRSxHQUFHLEVBQUUsQ0FBQyxDQUFFO1FBQ3BCL0YsTUFBTSxFQUFFO01BQ1YsQ0FBRSxDQUFDO01BRUh3RixZQUFZLEdBQUcsQ0FBRU0sZUFBZSxFQUFFUixlQUFlLEVBQUVDLGVBQWUsRUFBRUYsV0FBVyxDQUFFO0lBQ25GO0lBRUEsT0FBTyxJQUFJakgsSUFBSSxDQUFFO01BQ2ZtQyxRQUFRLEVBQUVpRixZQUFZO01BQ3RCUSxRQUFRLEVBQUVmLFFBQVE7TUFDbEJnQixTQUFTLEVBQUVoQjtJQUNiLENBQUUsQ0FBQztFQUNMLENBQUM7RUFFRDtFQUNBO0VBQ0E7RUFDQTs7RUFFQTtBQUNGO0FBQ0E7RUFDRWlCLDJCQUEyQkEsQ0FBRXJELGtCQUFzQyxFQUFTO0lBRTFFLE1BQU1vQyxRQUFRLEdBQUcxRixzQkFBc0I7O0lBRXZDO0lBQ0EsTUFBTXFCLFVBQVUsR0FBRyxJQUFJN0MsU0FBUyxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUVrSCxRQUFRLEVBQUUsQ0FBQ0EsUUFBUSxFQUN6RDlGLGNBQWMsQ0FBb0IsQ0FBQyxDQUFDLEVBQUVKLHVCQUF1QixDQUFDYyxvQkFBb0IsRUFBRTtNQUNsRkMsSUFBSSxFQUFFK0Msa0JBQWtCLENBQUM5QyxRQUFRO01BQ2pDQyxNQUFNLEVBQUU2QyxrQkFBa0IsQ0FBQzVDO0lBQzdCLENBQUUsQ0FBRSxDQUFDOztJQUVQO0lBQ0EsTUFBTWtHLGNBQWMsR0FBRztNQUNyQnJHLElBQUksRUFBRSxPQUFPO01BQ2JzRyxTQUFTLEVBQUUsQ0FBQztNQUNaQyxTQUFTLEVBQUUsQ0FBQztNQUNaQyxVQUFVLEVBQUU7SUFDZCxDQUFDO0lBQ0QsTUFBTUMsS0FBSyxHQUFHLElBQUl4SSxTQUFTLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRWtILFFBQVEsRUFBRSxDQUFDLEVBQUVrQixjQUFlLENBQUM7SUFDaEUsTUFBTUssS0FBSyxHQUFHLElBQUl6SSxTQUFTLENBQUVrSCxRQUFRLEVBQUUsQ0FBQyxFQUFFQSxRQUFRLEVBQUUsQ0FBQ0EsUUFBUSxFQUFFa0IsY0FBZSxDQUFDO0lBRS9FLE9BQU8sSUFBSS9ILElBQUksQ0FBRTtNQUNmbUMsUUFBUSxFQUFFLENBQUVLLFVBQVUsRUFBRTJGLEtBQUssRUFBRUMsS0FBSyxDQUFFO01BQ3RDUixRQUFRLEVBQUVmLFFBQVE7TUFDbEJnQixTQUFTLEVBQUVoQjtJQUNiLENBQUUsQ0FBQztFQUNMLENBQUM7RUFFRDtBQUNGO0FBQ0E7RUFDRXdCLHVCQUF1QkEsQ0FBRTVELGtCQUFzQyxFQUFTO0lBRXRFLE1BQU1vQyxRQUFRLEdBQUcxRixzQkFBc0I7SUFDdkMsTUFBTW1ILFNBQVMsR0FBRyxFQUFFLENBQUMsQ0FBQzs7SUFFdEI7SUFDQSxNQUFNQyxLQUFLLEdBQUcsSUFBSTVJLFNBQVMsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFa0gsUUFBUSxFQUFFLENBQUNBLFFBQVEsRUFDcEQ5RixjQUFjLENBQW9CLENBQUMsQ0FBQyxFQUFFSix1QkFBdUIsQ0FBQ2Msb0JBQW9CLEVBQUU7TUFDbEZDLElBQUksRUFBRStDLGtCQUFrQixDQUFDOUMsUUFBUTtNQUNqQ0MsTUFBTSxFQUFFNkMsa0JBQWtCLENBQUM1QztJQUM3QixDQUFFLENBQUUsQ0FBQzs7SUFFUDtJQUNBLE1BQU0yRyxXQUFXLEdBQUcsSUFBSTNILGVBQWUsQ0FBRXlILFNBQVMsRUFBRWxKLEtBQUssQ0FBQ29HLFNBQVMsQ0FBRSxFQUFHLENBQUUsQ0FBQzs7SUFFM0U7SUFDQSxNQUFNaUQsSUFBSSxHQUFHLElBQUkxSSxJQUFJLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRThHLFFBQVEsRUFBRSxDQUFDLEVBQUU7TUFDeENqRixNQUFNLEVBQUUvQixLQUFLLENBQUNzRjtJQUNoQixDQUFFLENBQUM7SUFFSCxPQUFPLElBQUluRixJQUFJLENBQUU7TUFDZm1DLFFBQVEsRUFBRSxDQUFFb0csS0FBSyxFQUFFQyxXQUFXLEVBQUVDLElBQUksQ0FBRTtNQUN0Q2IsUUFBUSxFQUFFZixRQUFRO01BQ2xCZ0IsU0FBUyxFQUFFaEI7SUFDYixDQUFFLENBQUM7RUFDTCxDQUFDO0VBRUQ7RUFDQTtFQUNBOztFQUVBO0FBQ0Y7QUFDQTtFQUNFNkIsMEJBQTBCQSxDQUFFQyxnQkFBbUMsRUFBUztJQUV0RTNFLE1BQU0sSUFBSUEsTUFBTSxDQUFFRixDQUFDLENBQUM4RSxRQUFRLENBQUUsQ0FBRW5JLGlCQUFpQixDQUFDb0ksVUFBVSxFQUFFcEksaUJBQWlCLENBQUNxSSxRQUFRLENBQUUsRUFBRUgsZ0JBQWlCLENBQUMsRUFDM0csNkJBQTRCQSxnQkFBaUIsRUFBRSxDQUFDO0lBRW5ELE1BQU05QixRQUFRLEdBQUcxRixzQkFBc0I7SUFDdkMsTUFBTTRILElBQUksR0FBS0osZ0JBQWdCLEtBQUtsSSxpQkFBaUIsQ0FBQ29JLFVBQVUsR0FBS2hDLFFBQVEsR0FBRyxDQUFDO0lBQ2pGLE1BQU1tQyxJQUFJLEdBQUtMLGdCQUFnQixLQUFLbEksaUJBQWlCLENBQUNvSSxVQUFVLEdBQUssQ0FBQyxHQUFHaEMsUUFBUTtJQUVqRixPQUFPLElBQUlsSCxTQUFTLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRW9KLElBQUksRUFBRUMsSUFBSSxFQUNwQ2pJLGNBQWMsQ0FBb0IsQ0FBQyxDQUFDLEVBQUVKLHVCQUF1QixDQUFDc0ksa0JBQWtCLEVBQUU7TUFDaEZyQixRQUFRLEVBQUVmLFFBQVE7TUFDbEJnQixTQUFTLEVBQUVoQjtJQUNiLENBQUUsQ0FBRSxDQUFDO0VBQ1QsQ0FBQztFQUVEO0VBQ0E7RUFDQTs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0VxQyxzQkFBc0JBLENBQUVDLFlBQTJCLEVBQUVDLGFBQXVCLEVBQVM7SUFFbkZwRixNQUFNLElBQUlBLE1BQU0sQ0FBRUYsQ0FBQyxDQUFDdUYsS0FBSyxDQUFFRCxhQUFhLEVBQUVFLE1BQU0sSUFBSSxPQUFPQSxNQUFNLEtBQUssUUFBUyxDQUFDLElBQUlGLGFBQWEsQ0FBQ0csTUFBTSxHQUFHLENBQUMsRUFDekcsMEJBQXlCSCxhQUFjLEVBQUUsQ0FBQztJQUU3QyxJQUFJakgsUUFBZ0IsR0FBRyxFQUFFO0lBRXpCLE1BQU1xSCxXQUFXLEdBQUc7TUFDbEJuRCxJQUFJLEVBQUUxRix1QkFBdUIsQ0FBQzhJO0lBQ2hDLENBQUM7O0lBRUQ7SUFDQTtJQUNBLE1BQU1DLHVCQUF1QixHQUFHNUYsQ0FBQyxDQUFDNkYsU0FBUyxDQUFFUCxhQUFhLEVBQUVELFlBQVksS0FBSzdJLGFBQWEsQ0FBQ3NKLFFBQVEsR0FBRyxDQUFDLEdBQUcsQ0FBRSxDQUFDOztJQUU3RztJQUNBRix1QkFBdUIsQ0FBQ0csT0FBTyxDQUFFUCxNQUFNLElBQUk7TUFDekNuSCxRQUFRLENBQUNnQyxJQUFJLENBQUUsSUFBSXZELG1CQUFtQixDQUFFMEksTUFBTyxDQUFFLENBQUM7SUFDcEQsQ0FBRSxDQUFDOztJQUVIO0lBQ0FuSCxRQUFRLEdBQUcxQyxVQUFVLENBQUUwQyxRQUFRLEVBQUUsTUFBTTtNQUNyQyxNQUFNMkgsUUFBUSxHQUFLWCxZQUFZLEtBQUs3SSxhQUFhLENBQUN5SixXQUFXLEdBQUtuSyxXQUFXLENBQUNvSyxLQUFLLEdBQUdwSyxXQUFXLENBQUNxSyxJQUFJO01BQ3RHLE9BQU8sSUFBSTlKLElBQUksQ0FBRTJKLFFBQVEsRUFBRU4sV0FBWSxDQUFDO0lBQzFDLENBQUUsQ0FBQzs7SUFFSDtJQUNBckgsUUFBUSxDQUFDZ0MsSUFBSSxDQUFFLElBQUloRSxJQUFJLENBQUVQLFdBQVcsQ0FBQ3NLLFFBQVEsRUFBRVYsV0FBWSxDQUFFLENBQUM7O0lBRTlEO0lBQ0FySCxRQUFRLENBQUNnQyxJQUFJLENBQUVnRixZQUFZLEtBQUs3SSxhQUFhLENBQUNzSixRQUFRLEdBQ3ZDLElBQUl6SixJQUFJLENBQUUsR0FBRyxFQUFFcUosV0FBWSxDQUFDLEdBQzVCLElBQUk1SSxtQkFBbUIsQ0FBRWtELENBQUMsQ0FBQ0MsSUFBSSxDQUFFcUYsYUFBYyxDQUFHLENBQUUsQ0FBQztJQUVwRSxPQUFPLElBQUl0SixJQUFJLENBQUU7TUFDZnFDLFFBQVEsRUFBRUEsUUFBUTtNQUNsQkQsT0FBTyxFQUFFLENBQUM7TUFDVkQsS0FBSyxFQUFFLFFBQVEsQ0FBQztJQUNsQixDQUFFLENBQUM7RUFDTDtBQUNGLENBQUM7O0FBRUQ7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTb0IseUJBQXlCQSxDQUFFSyxZQUF1QixFQUFFUCxvQkFBNkIsRUFBRTNCLGdCQUFtQyxFQUFnQjtFQUU3SSxNQUFNMEMsVUFBVSxHQUFHLEVBQUU7RUFDckIsS0FBTSxJQUFJaUcsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHekcsWUFBWSxDQUFDNkYsTUFBTSxFQUFFWSxDQUFDLEVBQUUsRUFBRztJQUM5QyxNQUFNQyxZQUFZLEdBQUtELENBQUMsS0FBSyxDQUFDLEdBQUtoSCxvQkFBb0IsR0FBR08sWUFBWSxDQUFFeUcsQ0FBQyxHQUFHLENBQUMsQ0FBRTtJQUMvRSxNQUFNRSxXQUFXLEdBQUczRyxZQUFZLENBQUV5RyxDQUFDLENBQUU7SUFDckNqRyxVQUFVLENBQUNDLElBQUksQ0FBRSxJQUFJeEUsU0FBUyxDQUFFeUssWUFBWSxDQUFDM0gsQ0FBQyxFQUFFMkgsWUFBWSxDQUFDMUgsQ0FBQyxFQUFFMkgsV0FBVyxDQUFDNUgsQ0FBQyxFQUFFNEgsV0FBVyxDQUFDM0gsQ0FBQyxFQUFFbEIsZ0JBQWlCLENBQUUsQ0FBQztFQUNwSDtFQUNBLE9BQU8wQyxVQUFVO0FBQ25COztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM5QixnQkFBZ0JBLENBQUVELFFBQWdCLEVBQWU7RUFFeEQ7RUFDQSxNQUFNbUksUUFBUSxHQUFHLElBQUl0SyxJQUFJLENBQUMsQ0FBQyxDQUFDdUssUUFBUSxDQUFFLElBQUlySyxNQUFNLENBQUVjLGlCQUFpQixFQUFFQyxrQkFBa0IsRUFBRTtJQUFFdUosUUFBUSxFQUFFO0VBQU0sQ0FBRSxDQUFFLENBQUM7RUFFaEhGLFFBQVEsQ0FBQ0MsUUFBUSxDQUFFLElBQUl2SyxJQUFJLENBQUU7SUFBRTtJQUM3Qm1DLFFBQVEsRUFBRUEsUUFBUTtJQUNsQnNJLE1BQU0sRUFBRUgsUUFBUSxDQUFDRyxNQUFNO0lBQ3ZCN0MsUUFBUSxFQUFFNUcsaUJBQWlCO0lBQUU7SUFDN0I2RyxTQUFTLEVBQUU1RyxrQkFBa0IsQ0FBQztFQUNoQyxDQUFFLENBQUUsQ0FBQztFQUVMLE9BQU8sSUFBSTFCLFVBQVUsQ0FBRStLLFFBQVMsQ0FBQztBQUNuQzs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxTQUFTdkQsa0JBQWtCQSxDQUFFRixRQUFnQixFQUFTO0VBRXBELE1BQU02RCxNQUFNLEdBQUcsSUFBSXhLLE1BQU0sQ0FBRTJHLFFBQVEsRUFBRUEsUUFBUyxDQUFDO0VBRS9DLE1BQU04RCxPQUFPLEdBQUcsSUFBSTFLLElBQUksQ0FBRUksa0JBQWtCLEVBQUU7SUFDNUNrRyxLQUFLLEVBQUUsS0FBSztJQUFFO0lBQ2Q3RSxJQUFJLEVBQUUsT0FBTztJQUNiK0ksTUFBTSxFQUFFQyxNQUFNLENBQUNEO0VBQ2pCLENBQUUsQ0FBQztFQUVILE9BQU8sSUFBSXpLLElBQUksQ0FBRTtJQUNmbUMsUUFBUSxFQUFFLENBQUV1SSxNQUFNLEVBQUVDLE9BQU8sQ0FBRTtJQUM3Qi9DLFFBQVEsRUFBRWYsUUFBUTtJQUNsQmdCLFNBQVMsRUFBRWhCO0VBQ2IsQ0FBRSxDQUFDO0FBQ0w7QUFFQXRHLGNBQWMsQ0FBQ3FLLFFBQVEsQ0FBRSwyQkFBMkIsRUFBRXhKLHlCQUEwQixDQUFDO0FBQ2pGLGVBQWVBLHlCQUF5QiIsImlnbm9yZUxpc3QiOltdfQ==