// Copyright 2022-2024, University of Colorado Boulder
/**
 * Some in-simulation utilities designed to help designers and developers
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import animationFrameTimer from '../../axon/js/animationFrameTimer.js';
import DerivedProperty from '../../axon/js/DerivedProperty.js';
import MappedProperty from '../../axon/js/MappedProperty.js';
import TinyProperty from '../../axon/js/TinyProperty.js';
import Bounds2 from '../../dot/js/Bounds2.js';
import Utils from '../../dot/js/Utils.js';
import Vector2 from '../../dot/js/Vector2.js';
import MeasuringTapeNode from '../../scenery-phet/js/MeasuringTapeNode.js';
import PhetFont from '../../scenery-phet/js/PhetFont.js';
import { CanvasNode, Circle, Color, Display, DOM, DragListener, extendsHeightSizable, extendsWidthSizable, FireListener, FlowBox, Font, GridBox, HBox, HSeparator, Image, LayoutNode, Line, LinearGradient, Node, NodePattern, Paint, Path, Pattern, PressListener, RadialGradient, Rectangle, RichText, Spacer, Text, Trail, VBox, WebGLNode } from '../../scenery/js/imports.js';
import Panel from '../../sun/js/Panel.js';
import AquaRadioButtonGroup from '../../sun/js/AquaRadioButtonGroup.js';
import Tandem from '../../tandem/js/Tandem.js';
import joist from './joist.js';
import BooleanProperty from '../../axon/js/BooleanProperty.js';
import Checkbox from '../../sun/js/Checkbox.js';
import inheritance from '../../phet-core/js/inheritance.js';
import EnumerationValue from '../../phet-core/js/EnumerationValue.js';
import Enumeration from '../../phet-core/js/Enumeration.js';
import EnumerationProperty from '../../axon/js/EnumerationProperty.js';
import merge from '../../phet-core/js/merge.js';
import { Shape } from '../../kite/js/imports.js';
import RectangularPushButton from '../../sun/js/buttons/RectangularPushButton.js';
import ExpandCollapseButton from '../../sun/js/ExpandCollapseButton.js';
import { default as createObservableArray } from '../../axon/js/createObservableArray.js';
import optionize from '../../phet-core/js/optionize.js';
import Multilink from '../../axon/js/Multilink.js';
import { isTReadOnlyProperty } from '../../axon/js/TReadOnlyProperty.js';
const round = (n, places = 2) => Utils.toFixed(n, places);
class PointerAreaType extends EnumerationValue {
  static MOUSE = new PointerAreaType();
  static TOUCH = new PointerAreaType();
  static NONE = new PointerAreaType();
  static enumeration = new Enumeration(PointerAreaType);
}
const hasHelperNode = node => {
  return !!node.getHelperNode;
};
export default class Helper {
  // Whether we should use the input system for picking, or if we should ignore it (and the flags) for what is visual

  // Whether we should return the leaf-most Trail (instead of finding the one with input listeners)

  // Whether the helper is visible (active) or not

  // Whether the entire helper is visible (or collapsed)

  // Where the current pointer is

  // Whether the pointer is over the UI interface

  // If the user has clicked on a Trail and selected it

  // What Trail the user is over in the tree UI

  // What Trail the pointer is over right now

  // What Trail to show as a preview (and to highlight) - selection overrides what the pointer is over

  // A helper-displayed Node created to help with debugging various types

  // The global shape of what is selected

  // ImageData from the sim

  // The pixel color under the pointer

  constructor(sim, simDisplay) {
    // NOTE: Don't pause the sim, don't use foreign object rasterization (do the smarter instant approach)
    // NOTE: Inform about preserveDrawingBuffer query parameter
    // NOTE: Actually grab/rerender things from WebGL/Canvas, so this works nicely and at a higher resolution
    // NOTE: Scenery drawable tree

    this.sim = sim;
    this.simDisplay = simDisplay;
    this.activeProperty = new TinyProperty(false);
    this.visualTreeVisibleProperty = new BooleanProperty(false, {
      tandem: Tandem.OPT_OUT
    });
    this.pdomTreeVisibleProperty = new BooleanProperty(false, {
      tandem: Tandem.OPT_OUT
    });
    this.underPointerVisibleProperty = new BooleanProperty(true, {
      tandem: Tandem.OPT_OUT
    });
    this.optionsVisibleProperty = new BooleanProperty(true, {
      tandem: Tandem.OPT_OUT
    });
    this.previewVisibleProperty = new BooleanProperty(false, {
      tandem: Tandem.OPT_OUT
    });
    this.selectedNodeContentVisibleProperty = new BooleanProperty(true, {
      tandem: Tandem.OPT_OUT
    });
    this.selectedTrailContentVisibleProperty = new BooleanProperty(true, {
      tandem: Tandem.OPT_OUT
    });
    this.highlightVisibleProperty = new BooleanProperty(true, {
      tandem: Tandem.OPT_OUT
    });
    this.boundsVisibleProperty = new BooleanProperty(true, {
      tandem: Tandem.OPT_OUT
    });
    this.selfBoundsVisibleProperty = new BooleanProperty(false, {
      tandem: Tandem.OPT_OUT
    });
    this.getHelperNodeVisibleProperty = new BooleanProperty(true, {
      tandem: Tandem.OPT_OUT
    });
    this.helperVisibleProperty = new BooleanProperty(true, {
      tandem: Tandem.OPT_OUT
    });
    this.inputBasedPickingProperty = new BooleanProperty(true, {
      tandem: Tandem.OPT_OUT
    });
    this.useLeafNodeProperty = new BooleanProperty(false, {
      tandem: Tandem.OPT_OUT
    });
    this.pointerAreaTypeProperty = new EnumerationProperty(PointerAreaType.MOUSE, {
      tandem: Tandem.OPT_OUT
    });
    this.pointerPositionProperty = new TinyProperty(Vector2.ZERO);
    this.overInterfaceProperty = new BooleanProperty(false, {
      tandem: Tandem.OPT_OUT
    });
    this.selectedTrailProperty = new TinyProperty(null);
    this.treeHoverTrailProperty = new TinyProperty(null);
    this.pointerTrailProperty = new DerivedProperty([this.pointerPositionProperty, this.overInterfaceProperty, this.pointerAreaTypeProperty, this.inputBasedPickingProperty], (point, overInterface, pointerAreaType, inputBasedPicking) => {
      // We're not over something while we're over an interface
      if (overInterface) {
        return null;
      }
      if (!inputBasedPicking) {
        return visualHitTest(simDisplay.rootNode, point);
      }
      let trail = simDisplay.rootNode.hitTest(point, pointerAreaType === PointerAreaType.MOUSE, pointerAreaType === PointerAreaType.TOUCH);
      if (trail && !this.useLeafNodeProperty.value) {
        while (trail.length > 0 && trail.lastNode().inputListeners.length === 0) {
          trail.removeDescendant();
        }
        if (trail.length === 0) {
          trail = null;
        } else {
          // Repsect TargetNode to be helpful
          const listeners = trail.lastNode().inputListeners;
          const firstListener = listeners[0];
          if (firstListener instanceof PressListener && firstListener.targetNode && firstListener.targetNode !== trail.lastNode() && trail.containsNode(firstListener.targetNode)) {
            trail = trail.subtrailTo(firstListener.targetNode);
          }
        }
      }
      return trail;
    }, {
      tandem: Tandem.OPT_OUT,
      valueComparisonStrategy: 'equalsFunction',
      strictAxonDependencies: false //TODO https://github.com/phetsims/joist/issues/948
    });
    this.previewTrailProperty = new DerivedProperty([this.selectedTrailProperty, this.treeHoverTrailProperty, this.pointerTrailProperty], (selected, treeHover, active) => {
      return selected ? selected : treeHover ? treeHover : active;
    }, {
      strictAxonDependencies: false
    });
    this.previewShapeProperty = new DerivedProperty([this.previewTrailProperty, this.inputBasedPickingProperty, this.pointerAreaTypeProperty], (previewTrail, inputBasedPicking, pointerAreaType) => {
      if (previewTrail) {
        if (inputBasedPicking) {
          return getShape(previewTrail, pointerAreaType === PointerAreaType.MOUSE, pointerAreaType === PointerAreaType.TOUCH);
        } else {
          return getShape(previewTrail, false, false);
        }
      } else {
        return null;
      }
    }, {
      strictAxonDependencies: false
    });
    this.helperNodeProperty = new DerivedProperty([this.selectedTrailProperty], trail => {
      if (trail) {
        const node = trail.lastNode();
        if (hasHelperNode(node)) {
          return node.getHelperNode();
        } else {
          return null;
        }
      } else {
        return null;
      }
    }, {
      strictAxonDependencies: false
    });
    this.screenViewProperty = new TinyProperty(null);
    this.imageDataProperty = new TinyProperty(null);
    this.colorProperty = new DerivedProperty([this.pointerPositionProperty, this.imageDataProperty], (position, imageData) => {
      if (!imageData) {
        return Color.TRANSPARENT;
      }
      const x = Math.floor(position.x / this.simDisplay.width * imageData.width);
      const y = Math.floor(position.y / this.simDisplay.height * imageData.height);
      const index = 4 * (x + imageData.width * y);
      if (x < 0 || y < 0 || x > imageData.width || y > imageData.height) {
        return Color.TRANSPARENT;
      }
      return new Color(imageData.data[index], imageData.data[index + 1], imageData.data[index + 2], imageData.data[index + 3] / 255);
    }, {
      tandem: Tandem.OPT_OUT,
      strictAxonDependencies: false
    });
    const fuzzProperty = new BooleanProperty(phet.chipper.queryParameters.fuzz, {
      tandem: Tandem.OPT_OUT
    });
    fuzzProperty.lazyLink(fuzz => {
      phet.chipper.queryParameters.fuzz = fuzz;
    });
    const measuringTapeVisibleProperty = new BooleanProperty(false, {
      tandem: Tandem.OPT_OUT
    });
    const measuringTapeUnitsProperty = new TinyProperty({
      name: 'view units',
      multiplier: 0
    });
    const layoutBoundsProperty = new TinyProperty(Bounds2.NOTHING);
    const helperRoot = new Node({
      renderer: 'svg'
    });
    const positionStringProperty = new MappedProperty(this.pointerPositionProperty, {
      tandem: Tandem.OPT_OUT,
      bidirectional: true,
      map: position => {
        const view = this.screenViewProperty.value;
        if (view) {
          const viewPosition = view.globalToLocalPoint(position);
          return `global: x: ${round(position.x)}, y: ${round(position.y)}<br>view: x: ${round(viewPosition.x)}, y: ${round(viewPosition.y)}`;
        } else {
          return '-';
        }
      }
    });
    const positionText = new RichText(positionStringProperty, {
      font: new PhetFont(12)
    });
    const colorTextMap = color => {
      return `${color.toHexString()} ${color.toCSS()}`;
    };
    const colorStringProperty = new MappedProperty(this.colorProperty, {
      tandem: Tandem.OPT_OUT,
      bidirectional: true,
      map: colorTextMap
    });
    const colorText = new RichText(colorStringProperty, {
      font: new PhetFont(12)
    });
    this.colorProperty.link(color => {
      colorText.fill = Color.getLuminance(color) > 128 ? Color.BLACK : Color.WHITE;
    });
    const boundsColor = new Color('#804000');
    const selfBoundsColor = new Color('#208020');
    const nonInputBasedColor = new Color(255, 100, 0);
    const mouseColor = new Color(0, 0, 255);
    const touchColor = new Color(255, 0, 0);
    const inputBasedColor = new Color(200, 0, 200);
    const highlightBaseColorProperty = new DerivedProperty([this.inputBasedPickingProperty, this.pointerAreaTypeProperty], (inputBasedPicking, pointerAreaType) => {
      if (inputBasedPicking) {
        if (pointerAreaType === PointerAreaType.MOUSE) {
          return mouseColor;
        } else if (pointerAreaType === PointerAreaType.TOUCH) {
          return touchColor;
        } else {
          return inputBasedColor;
        }
      } else {
        return nonInputBasedColor;
      }
    }, {
      tandem: Tandem.OPT_OUT,
      strictAxonDependencies: false
    });
    const colorBackground = new Panel(colorText, {
      cornerRadius: 0,
      stroke: null,
      fill: this.colorProperty
    });
    const previewNode = new Node({
      visibleProperty: this.previewVisibleProperty
    });
    const previewBackground = new Rectangle(0, 0, 200, 200, {
      fill: new NodePattern(new Node({
        children: [new Rectangle(0, 0, 10, 10, {
          fill: '#ddd'
        }), new Rectangle(10, 10, 10, 10, {
          fill: '#ddd'
        }), new Rectangle(0, 10, 10, 10, {
          fill: '#fafafa'
        }), new Rectangle(10, 0, 10, 10, {
          fill: '#fafafa'
        })]
      }), 2, 0, 0, 20, 20),
      stroke: 'black',
      visibleProperty: this.previewVisibleProperty
    });
    this.previewTrailProperty.link(trail => {
      previewNode.removeAllChildren();
      if (trail) {
        previewNode.addChild(previewBackground);
        const node = trail.lastNode();
        if (node.bounds.isValid()) {
          const scale = window.devicePixelRatio * 0.9 * Math.min(previewBackground.selfBounds.width / node.width, previewBackground.selfBounds.height / node.height);
          previewNode.addChild(new Node({
            scale: scale / window.devicePixelRatio,
            center: previewBackground.center,
            children: [node.rasterized({
              resolution: scale,
              sourceBounds: node.bounds.dilated(node.bounds.width * 0.01).roundedOut()
            })]
          }));
        }
      }
    });
    const selectedNodeContent = new VBox({
      spacing: 3,
      align: 'left',
      visibleProperty: this.selectedNodeContentVisibleProperty
    });
    this.previewTrailProperty.link(trail => {
      selectedNodeContent.children = trail ? createInfo(trail) : [];
    });
    const fuzzCheckbox = new HelperCheckbox(fuzzProperty, 'Fuzz');
    const measuringTapeVisibleCheckbox = new HelperCheckbox(measuringTapeVisibleProperty, 'Measuring Tape');
    const visualTreeVisibleCheckbox = new HelperCheckbox(this.visualTreeVisibleProperty, 'Visual Tree');
    const pdomTreeVisibleCheckbox = new HelperCheckbox(this.pdomTreeVisibleProperty, 'PDOM Tree');
    const inputBasedPickingCheckbox = new HelperCheckbox(this.inputBasedPickingProperty, 'Input-based');
    const useLeafNodeCheckbox = new HelperCheckbox(this.useLeafNodeProperty, 'Use Leaf', {
      enabledProperty: this.inputBasedPickingProperty
    });
    const highlightVisibleCheckbox = new HelperCheckbox(this.highlightVisibleProperty, 'Highlight', {
      labelOptions: {
        fill: highlightBaseColorProperty
      }
    });
    const boundsVisibleCheckbox = new HelperCheckbox(this.boundsVisibleProperty, 'Bounds', {
      labelOptions: {
        fill: boundsColor
      }
    });
    const selfBoundsVisibleCheckbox = new HelperCheckbox(this.selfBoundsVisibleProperty, 'Self Bounds', {
      labelOptions: {
        fill: selfBoundsColor
      }
    });
    const getHelperNodeVisibleCheckbox = new HelperCheckbox(this.getHelperNodeVisibleProperty, 'getHelperNode()');
    const pointerAreaTypeRadioButtonGroup = new AquaRadioButtonGroup(this.pointerAreaTypeProperty, [{
      value: PointerAreaType.MOUSE,
      createNode: tandem => new Text('Mouse', {
        fontSize: 12
      })
    }, {
      value: PointerAreaType.TOUCH,
      createNode: tandem => new Text('Touch', {
        fontSize: 12
      })
    }, {
      value: PointerAreaType.NONE,
      createNode: tandem => new Text('None', {
        fontSize: 12
      })
    }], {
      orientation: 'horizontal',
      enabledProperty: this.inputBasedPickingProperty,
      radioButtonOptions: {
        xSpacing: 3
      },
      spacing: 10,
      tandem: Tandem.OPT_OUT
    });
    const selectedTrailContent = new VBox({
      align: 'left',
      visibleProperty: this.selectedTrailContentVisibleProperty
    });
    this.previewTrailProperty.link(trail => {
      selectedTrailContent.children = [];
      if (trail) {
        trail.nodes.slice().forEach((node, index) => {
          selectedTrailContent.addChild(new RichText(`${index > 0 ? trail.nodes[index - 1].children.indexOf(node) : '-'} ${node.constructor.name}`, {
            font: new PhetFont(12),
            fill: index === trail.nodes.length - 1 ? 'black' : '#bbb',
            layoutOptions: {
              leftMargin: index * 10
            },
            cursor: 'pointer',
            inputListeners: [new FireListener({
              fire: () => {
                this.selectedTrailProperty.value = trail.subtrailTo(node);
                focusSelected();
              },
              tandem: Tandem.OPT_OUT
            })]
          }));
        });
        trail.lastNode().children.forEach((node, index) => {
          selectedTrailContent.addChild(new RichText(`${trail.lastNode().children.indexOf(node)} ${node.constructor.name}`, {
            font: new PhetFont(12),
            fill: '#88f',
            layoutOptions: {
              leftMargin: trail.nodes.length * 10
            },
            cursor: 'pointer',
            inputListeners: [new FireListener({
              fire: () => {
                this.selectedTrailProperty.value = trail.copy().addDescendant(node, index);
                focusSelected();
              },
              tandem: Tandem.OPT_OUT
            })]
          }));
        });

        // Visibility check
        if (!trail.isVisible()) {
          selectedTrailContent.addChild(new Text('invisible', {
            fill: '#60a',
            fontSize: 12
          }));
        }
        if (trail.getOpacity() !== 1) {
          selectedTrailContent.addChild(new Text(`opacity: ${trail.getOpacity()}`, {
            fill: '#888',
            fontSize: 12
          }));
        }
        const hasPickableFalseEquivalent = _.some(trail.nodes, node => {
          return node.pickable === false || !node.visible;
        });
        const hasPickableTrueEquivalent = _.some(trail.nodes, node => {
          return node.inputListeners.length > 0 || node.pickable === true;
        });
        if (!hasPickableFalseEquivalent && hasPickableTrueEquivalent) {
          selectedTrailContent.addChild(new Text('Hit Tested', {
            fill: '#f00',
            fontSize: 12
          }));
        }
        if (!trail.getMatrix().isIdentity()) {
          // Why is this wrapper node needed?
          selectedTrailContent.addChild(new Node({
            children: [new Matrix3Node(trail.getMatrix())]
          }));
        }
      }
    });
    const visualTreeNode = new TreeNode(this.visualTreeVisibleProperty, this, () => new VisualTreeNode(new Trail(simDisplay.rootNode), this));
    const pdomTreeNode = new TreeNode(this.pdomTreeVisibleProperty, this, () => new PDOMTreeNode(simDisplay._rootPDOMInstance, this));
    const focusSelected = () => {
      visualTreeNode.focusSelected();
      pdomTreeNode.focusSelected();
    };
    const boundsPath = new Path(null, {
      visibleProperty: this.boundsVisibleProperty,
      stroke: boundsColor,
      fill: boundsColor.withAlpha(0.1),
      lineDash: [2, 2],
      lineDashOffset: 2
    });
    this.previewTrailProperty.link(trail => {
      if (trail && trail.lastNode().localBounds.isValid()) {
        boundsPath.shape = Shape.bounds(trail.lastNode().localBounds).transformed(trail.getMatrix());
      } else {
        boundsPath.shape = null;
      }
    });
    const selfBoundsPath = new Path(null, {
      visibleProperty: this.selfBoundsVisibleProperty,
      stroke: selfBoundsColor,
      fill: selfBoundsColor.withAlpha(0.1),
      lineDash: [2, 2],
      lineDashOffset: 1
    });
    this.previewTrailProperty.link(trail => {
      if (trail && trail.lastNode().selfBounds.isValid()) {
        selfBoundsPath.shape = Shape.bounds(trail.lastNode().selfBounds).transformed(trail.getMatrix());
      } else {
        selfBoundsPath.shape = null;
      }
    });
    const highlightFillProperty = new DerivedProperty([highlightBaseColorProperty], color => color.withAlpha(0.2), {
      tandem: Tandem.OPT_OUT,
      strictAxonDependencies: false
    });
    const highlightPath = new Path(null, {
      stroke: highlightBaseColorProperty,
      lineDash: [2, 2],
      fill: highlightFillProperty,
      visibleProperty: this.highlightVisibleProperty
    });
    this.previewShapeProperty.link(shape => {
      highlightPath.shape = shape;
    });
    const helperNodeContainer = new Node({
      visibleProperty: this.getHelperNodeVisibleProperty
    });
    this.selectedTrailProperty.link(trail => {
      if (trail) {
        helperNodeContainer.matrix = trail.getMatrix();
      }
    });
    this.helperNodeProperty.link(node => {
      helperNodeContainer.removeAllChildren();
      if (node) {
        helperNodeContainer.addChild(node);
      }
    });

    // this.inputBasedPickingProperty = new BooleanProperty( true, { tandem: Tandem.OPT_OUT } );
    // this.useLeafNodeProperty = new BooleanProperty( false, { tandem: Tandem.OPT_OUT } );
    // this.pointerAreaTypeProperty = new EnumerationProperty( PointerAreaType.MOUSE, { tandem: Tandem.OPT_OUT } );

    helperRoot.addChild(boundsPath);
    helperRoot.addChild(selfBoundsPath);
    helperRoot.addChild(highlightPath);
    const backgroundNode = new Node();
    backgroundNode.addInputListener(new PressListener({
      press: () => {
        this.selectedTrailProperty.value = this.pointerTrailProperty.value;
        focusSelected();
      },
      tandem: Tandem.OPT_OUT
    }));
    helperRoot.addChild(backgroundNode);
    helperRoot.addChild(helperNodeContainer);
    const underPointerNode = new FlowBox({
      orientation: 'vertical',
      spacing: 5,
      align: 'left',
      children: [positionText, colorBackground],
      visibleProperty: this.underPointerVisibleProperty
    });
    const optionsNode = new VBox({
      spacing: 3,
      align: 'left',
      children: [createHeaderText('Tools'), new VBox({
        spacing: 3,
        align: 'left',
        children: [new HBox({
          spacing: 10,
          children: [fuzzCheckbox, measuringTapeVisibleCheckbox]
        }), new HBox({
          spacing: 10,
          children: [visualTreeVisibleCheckbox, ...(simDisplay._accessible ? [pdomTreeVisibleCheckbox] : [])]
        })]
      }), createHeaderText('Picking', undefined, {
        layoutOptions: {
          topMargin: 3
        }
      }), new VBox({
        spacing: 3,
        align: 'left',
        children: [new HBox({
          spacing: 10,
          children: [inputBasedPickingCheckbox, useLeafNodeCheckbox]
        }), pointerAreaTypeRadioButtonGroup]
      }), createHeaderText('Show', undefined, {
        layoutOptions: {
          topMargin: 3
        }
      }), new VBox({
        spacing: 3,
        align: 'left',
        children: [new HBox({
          spacing: 10,
          children: [highlightVisibleCheckbox, getHelperNodeVisibleCheckbox]
        }), new HBox({
          spacing: 10,
          children: [boundsVisibleCheckbox, selfBoundsVisibleCheckbox]
        })]
      })],
      visibleProperty: this.optionsVisibleProperty
    });
    const helperReadoutContent = new VBox({
      spacing: 5,
      align: 'left',
      children: [createCollapsibleHeaderText('Under Pointer', this.underPointerVisibleProperty, underPointerNode, {
        layoutOptions: {
          topMargin: 0
        }
      }), underPointerNode, createCollapsibleHeaderText('Options', this.optionsVisibleProperty, optionsNode), optionsNode, createCollapsibleHeaderText('Preview', this.previewVisibleProperty, previewNode), previewNode, createCollapsibleHeaderText('Selected Trail', this.selectedTrailContentVisibleProperty, selectedTrailContent), selectedTrailContent, createCollapsibleHeaderText('Selected Node', this.selectedNodeContentVisibleProperty, selectedNodeContent), selectedNodeContent],
      visibleProperty: this.helperVisibleProperty
    });
    const helperReadoutCollapsible = new VBox({
      spacing: 5,
      align: 'left',
      children: [createCollapsibleHeaderText('Helper', this.helperVisibleProperty, helperReadoutContent), new HSeparator(), helperReadoutContent]
    });
    const helperReadoutPanel = new Panel(helperReadoutCollapsible, {
      fill: 'rgba(255,255,255,0.85)',
      stroke: 'rgba(0,0,0,0.85)',
      cornerRadius: 0
    });
    helperReadoutPanel.addInputListener(new DragListener({
      translateNode: true,
      targetNode: helperReadoutPanel,
      tandem: Tandem.OPT_OUT
    }));

    // Allow scrolling to scroll the panel's position
    helperReadoutPanel.addInputListener({
      wheel: event => {
        const deltaY = event.domEvent.deltaY;
        const multiplier = 1;
        helperReadoutPanel.y -= deltaY * multiplier;
      }
    });
    helperRoot.addChild(helperReadoutPanel);
    helperRoot.addChild(visualTreeNode);
    helperRoot.addChild(pdomTreeNode);
    const measuringTapeNode = new MeasuringTapeNode(measuringTapeUnitsProperty, {
      tandem: Tandem.OPT_OUT,
      visibleProperty: measuringTapeVisibleProperty,
      textBackgroundColor: 'rgba(0,0,0,0.5)'
    });
    measuringTapeNode.basePositionProperty.value = new Vector2(100, 300);
    measuringTapeNode.tipPositionProperty.value = new Vector2(200, 300);
    helperRoot.addChild(measuringTapeNode);
    const resizeListener = size => {
      this.helperDisplay.width = size.width;
      this.helperDisplay.height = size.height;
      layoutBoundsProperty.value = layoutBoundsProperty.value.withMaxX(size.width).withMaxY(size.height);
      backgroundNode.mouseArea = new Bounds2(0, 0, size.width, size.height);
      backgroundNode.touchArea = new Bounds2(0, 0, size.width, size.height);
      visualTreeNode.resize(size);
      pdomTreeNode.resize(size);
    };
    const frameListener = dt => {
      this.overInterfaceProperty.value = helperReadoutPanel.bounds.containsPoint(this.pointerPositionProperty.value) || this.visualTreeVisibleProperty.value && visualTreeNode.bounds.containsPoint(this.pointerPositionProperty.value) || this.pdomTreeVisibleProperty.value && pdomTreeNode.bounds.containsPoint(this.pointerPositionProperty.value) || helperNodeContainer.containsPoint(this.pointerPositionProperty.value);
      this.helperDisplay?.updateDisplay();
    };
    document.addEventListener('keyup', event => {
      if (event.key === 'Escape') {
        this.selectedTrailProperty.value = null;
      }
    });
    this.activeProperty.lazyLink(active => {
      if (active) {
        sim.activeProperty.value = false;
        const screen = sim.selectedScreenProperty.value;
        if (screen.hasView()) {
          this.screenViewProperty.value = screen.view;
        } else {
          this.screenViewProperty.value = null;
        }
        this.helperDisplay = new Display(helperRoot, {
          assumeFullWindow: true
        });
        this.helperDisplay.initializeEvents();
        sim.dimensionProperty.link(resizeListener);
        animationFrameTimer.addListener(frameListener);
        document.body.appendChild(this.helperDisplay.domElement);
        this.helperDisplay.domElement.style.zIndex = '10000';
        const onLocationEvent = event => {
          this.pointerPositionProperty.value = event.pointer.point;
        };
        this.helperDisplay.addInputListener({
          move: onLocationEvent,
          down: onLocationEvent,
          up: onLocationEvent
        });
        if (this.screenViewProperty.value) {
          measuringTapeUnitsProperty.value = {
            name: 'view units',
            multiplier: this.screenViewProperty.value.getGlobalToLocalMatrix().getScaleVector().x
          };
        }
        this.simDisplay.foreignObjectRasterization(dataURI => {
          if (dataURI) {
            const image = document.createElement('img');
            image.addEventListener('load', () => {
              const width = image.width;
              const height = image.height;
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.width = width;
              canvas.height = height;
              context.drawImage(image, 0, 0);
              if (this.activeProperty.value) {
                this.imageDataProperty.value = context.getImageData(0, 0, width, height);
              }
            });
            image.src = dataURI;
          } else {
            console.log('Could not load foreign object rasterization');
          }
        });
      } else {
        sim.dimensionProperty.unlink(resizeListener);
        animationFrameTimer.removeListener(frameListener);
        document.body.removeChild(this.helperDisplay.domElement);
        this.helperDisplay.dispose();

        // Unpause the simulation
        sim.activeProperty.value = true;

        // Clear imageData since it won't be accurate when we re-open
        this.imageDataProperty.value = null;

        // Hide the tree when closing, so it starts up quickly
        this.visualTreeVisibleProperty.value = false;
      }
    });
  }

  // Singleton, lazily created so we don't slow down startup

  static initialize(sim, simDisplay) {
    // Ctrl + shift + H (will open the helper)
    document.addEventListener('keydown', event => {
      if (event.ctrlKey && event.key === 'H') {
        // Lazy creation
        if (!Helper.helper) {
          Helper.helper = new Helper(sim, simDisplay);
        }
        Helper.helper.activeProperty.value = !Helper.helper.activeProperty.value;
      }
    });
  }
}
joist.register('Helper', Helper);
class HelperCheckbox extends Checkbox {
  constructor(property, label, providedOptions) {
    const options = optionize()({
      tandem: Tandem.OPT_OUT,
      boxWidth: 14,
      labelOptions: {
        font: new PhetFont(12)
      }
    }, providedOptions);
    super(property, new RichText(label, options.labelOptions), options);
  }
}

// class DraggableDivider extends Rectangle {
//   constructor( preferredBoundsProperty, orientation, initialSeparatorLocation, pushFromMax ) {
//
//     super( {
//       fill: '#666',
//       cursor: orientation === 'horizontal' ? 'w-resize' : 'n-resize'
//     } );
//
//     this.minBoundsProperty = new TinyProperty( new Bounds2( 0, 0, 0, 0 ) );
//     this.maxBoundsProperty = new TinyProperty( new Bounds2( 0, 0, 0, 0 ) );
//
//     this.preferredBoundsProperty = preferredBoundsProperty;
//     this.orientation = orientation;
//     this.primaryCoordinate = orientation === 'horizontal' ? 'x' : 'y';
//     this.secondaryCoordinate = orientation === 'horizontal' ? 'y' : 'x';
//     this.primaryName = orientation === 'horizontal' ? 'width' : 'height';
//     this.secondaryName = orientation === 'horizontal' ? 'height' : 'width';
//     this.primaryRectName = orientation === 'horizontal' ? 'rectWidth' : 'rectHeight';
//     this.secondaryRectName = orientation === 'horizontal' ? 'rectHeight' : 'rectWidth';
//     this.minCoordinate = orientation === 'horizontal' ? 'left' : 'top';
//     this.maxCoordinate = orientation === 'horizontal' ? 'right' : 'bottom';
//     this.centerName = orientation === 'horizontal' ? 'centerX' : 'centerY';
//     this.minimum = 100;
//
//     this.separatorLocation = initialSeparatorLocation;
//
//     this[ this.primaryRectName ] = 2;
//
//     var dragListener = new phet.scenery.DragListener( {
//       drag: event => {
//         this.separatorLocation = dragListener.parentPoint[ this.primaryCoordinate ];
//         this.layout();
//       }
//     } );
//     this.addInputListener( dragListener );
//
//     preferredBoundsProperty.link( ( newPreferredBounds, oldPreferredBounds ) => {
//       if ( pushFromMax && oldPreferredBounds ) {
//         this.separatorLocation += newPreferredBounds[ this.maxCoordinate ] - oldPreferredBounds[ this.maxCoordinate ];
//       }
//       if ( !pushFromMax && oldPreferredBounds ) {
//         this.separatorLocation += newPreferredBounds[ this.minCoordinate ] - oldPreferredBounds[ this.minCoordinate ];
//       }
//       this.layout();
//     } );
//   }
//
//   /**
// //    */
//   layout() {
//     var preferredBounds = this.preferredBoundsProperty.value;
//     var separatorLocation = this.separatorLocation;
//
//     if ( separatorLocation < preferredBounds[ this.minCoordinate ] + this.minimum ) {
//       separatorLocation = preferredBounds[ this.minCoordinate ] + this.minimum;
//     }
//     if ( separatorLocation > preferredBounds[ this.maxCoordinate ] - this.minimum ) {
//       if ( preferredBounds[ this.primaryName ] >= this.minimum * 2 ) {
//         separatorLocation = preferredBounds[ this.maxCoordinate ] - this.minimum;
//       }
//       else {
//         separatorLocation = preferredBounds[ this.minCoordinate ] + preferredBounds[ this.primaryName ] / 2;
//       }
//     }
//
//     this[ this.centerName ] = separatorLocation;
//     this[ this.secondaryCoordinate ] = preferredBounds[ this.secondaryCoordinate ];
//     this[ this.secondaryRectName ] = preferredBounds[ this.secondaryName ];
//
//     if ( this.orientation === 'horizontal' ) {
//       this.mouseArea = this.touchArea = this.localBounds.dilatedX( 5 );
//     }
//     else {
//       this.mouseArea = this.touchArea = this.localBounds.dilatedY( 5 );
//     }
//
//     var minBounds = preferredBounds.copy();
//     var maxBounds = preferredBounds.copy();
//     if ( this.orientation === 'horizontal' ) {
//       minBounds.maxX = separatorLocation - this.width / 2;
//       maxBounds.minX = separatorLocation + this.width / 2;
//     }
//     else {
//       minBounds.maxY = separatorLocation - this.height / 2;
//       maxBounds.minY = separatorLocation + this.height / 2;
//     }
//     this.minBoundsProperty.value = minBounds;
//     this.maxBoundsProperty.value = maxBounds;
//   }
// }

class CollapsibleTreeNode extends Node {
  constructor(selfNode, providedOptions) {
    const options = optionize()({
      createChildren: () => [],
      spacing: 0,
      indent: 5
    }, providedOptions);
    super({
      excludeInvisibleChildrenFromBounds: true
    });
    this.selfNode = selfNode;
    this.selfNode.centerY = 0;
    this.expandedProperty = new TinyProperty(true);
    this.childTreeNodes = createObservableArray({
      elements: options.createChildren()
    });
    const buttonSize = 12;
    const expandCollapseShape = new Shape().moveToPoint(Vector2.createPolar(buttonSize / 2.5, 3 / 4 * Math.PI).plusXY(buttonSize / 8, 0)).lineTo(buttonSize / 8, 0).lineToPoint(Vector2.createPolar(buttonSize / 2.5, 5 / 4 * Math.PI).plusXY(buttonSize / 8, 0));
    this.expandCollapseButton = new Rectangle(-buttonSize / 2, -buttonSize / 2, buttonSize, buttonSize, {
      children: [new Path(expandCollapseShape, {
        stroke: '#888',
        lineCap: 'round',
        lineWidth: 1.5
      })],
      visible: false,
      cursor: 'pointer',
      right: 0
    });
    this.expandedProperty.link(expanded => {
      this.expandCollapseButton.rotation = expanded ? Math.PI / 2 : 0;
    });
    this.expandCollapseButton.addInputListener(new FireListener({
      fire: () => {
        this.expandedProperty.value = !this.expandedProperty.value;
      },
      tandem: Tandem.OPT_OUT
    }));
    this.addChild(this.expandCollapseButton);
    this.childContainer = new FlowBox({
      orientation: 'vertical',
      align: 'left',
      spacing: options.spacing,
      children: this.childTreeNodes,
      x: options.indent,
      y: this.selfNode.bottom + options.spacing,
      visibleProperty: this.expandedProperty
    });
    this.addChild(this.childContainer);
    this.addChild(selfNode);
    const onChildrenChange = () => {
      this.childContainer.children = this.childTreeNodes;
      this.expandCollapseButton.visible = this.childTreeNodes.length > 0;
    };
    this.childTreeNodes.addItemAddedListener(() => {
      onChildrenChange();
    });
    this.childTreeNodes.addItemRemovedListener(() => {
      onChildrenChange();
    });
    onChildrenChange();
    this.mutate(options);
  }
  expand() {
    this.expandedProperty.value = true;
  }
  collapse() {
    this.expandedProperty.value = false;
  }
  expandRecusively() {
    this.expandedProperty.value = true;
    this.childTreeNodes.forEach(treeNode => {
      treeNode.expandRecusively();
    });
  }
  collapseRecursively() {
    this.expandedProperty.value = false;
    this.childTreeNodes.forEach(treeNode => {
      treeNode.collapseRecursively();
    });
  }
}
class VisualTreeNode extends CollapsibleTreeNode {
  constructor(trail, helper) {
    const node = trail.lastNode();
    const isVisible = trail.isVisible();
    const TREE_FONT = new Font({
      size: 12
    });
    const nameNode = new HBox({
      spacing: 5
    });
    const name = node.constructor.name;
    if (name) {
      nameNode.addChild(new Text(name, {
        font: TREE_FONT,
        pickable: false,
        fill: isVisible ? '#000' : '#60a'
      }));
    }
    if (node instanceof Text) {
      nameNode.addChild(new Text('"' + node.string + '"', {
        font: TREE_FONT,
        pickable: false,
        fill: '#666'
      }));
    }
    const selfBackground = Rectangle.bounds(nameNode.bounds, {
      children: [nameNode],
      cursor: 'pointer',
      fill: new DerivedProperty([helper.selectedTrailProperty, helper.pointerTrailProperty], (selected, active) => {
        if (selected && trail.equals(selected)) {
          return 'rgba(0,128,255,0.4)';
        } else if (active && trail.equals(active)) {
          return 'rgba(0,128,255,0.2)';
        } else {
          return 'transparent';
        }
      }, {
        tandem: Tandem.OPT_OUT,
        strictAxonDependencies: false
      })
    });
    selfBackground.addInputListener({
      enter: () => {
        helper.treeHoverTrailProperty.value = trail;
      },
      exit: () => {
        helper.treeHoverTrailProperty.value = null;
      }
    });
    selfBackground.addInputListener(new FireListener({
      fire: () => {
        helper.selectedTrailProperty.value = trail;
      },
      tandem: Tandem.OPT_OUT
    }));
    super(selfBackground, {
      createChildren: () => trail.lastNode().children.map(child => {
        return new VisualTreeNode(trail.copy().addDescendant(child), helper);
      })
    });
    if (!node.visible) {
      this.expandedProperty.value = false;
    }
    this.trail = trail;
  }
  find(trail) {
    if (trail.equals(this.trail)) {
      return this;
    } else {
      const treeNode = _.find(this.childTreeNodes, childTreeNode => {
        return trail.isExtensionOf(childTreeNode.trail, true);
      });
      if (treeNode) {
        return treeNode.find(trail);
      } else {
        return null;
      }
    }
  }
}
class PDOMTreeNode extends CollapsibleTreeNode {
  constructor(instance, helper) {
    const trail = instance.trail;
    const isVisible = trail.isPDOMVisible();
    const TREE_FONT = new Font({
      size: 12
    });
    const selfNode = new HBox({
      spacing: 5
    });
    if (trail.nodes.length) {
      const fill = isVisible ? '#000' : '#60a';
      const node = trail.lastNode();
      if (node.tagName) {
        selfNode.addChild(new Text(node.tagName, {
          font: new Font({
            size: 12,
            weight: 'bold'
          }),
          fill: fill
        }));
      }
      if (node.labelContent) {
        selfNode.addChild(new Text(node.labelContent, {
          font: TREE_FONT,
          fill: '#800'
        }));
      }
      if (node.innerContent) {
        selfNode.addChild(new Text(node.innerContent, {
          font: TREE_FONT,
          fill: '#080'
        }));
      }
      if (node.descriptionContent) {
        selfNode.addChild(new Text(node.descriptionContent, {
          font: TREE_FONT,
          fill: '#444'
        }));
      }
      const parentTrail = instance.parent ? instance.parent.trail : new Trail();
      const name = trail.nodes.slice(parentTrail.nodes.length).map(node => node.constructor.name).filter(n => n !== 'Node').join(',');
      if (name) {
        selfNode.addChild(new Text(`(${name})`, {
          font: TREE_FONT,
          fill: '#008'
        }));
      }
    } else {
      selfNode.addChild(new Text('(root)', {
        font: TREE_FONT
      }));
    }

    // Refactor this code out?
    const selfBackground = Rectangle.bounds(selfNode.bounds, {
      children: [selfNode],
      cursor: 'pointer',
      fill: new DerivedProperty([helper.selectedTrailProperty, helper.pointerTrailProperty], (selected, active) => {
        if (selected && trail.equals(selected)) {
          return 'rgba(0,128,255,0.4)';
        } else if (active && trail.equals(active)) {
          return 'rgba(0,128,255,0.2)';
        } else {
          return 'transparent';
        }
      }, {
        tandem: Tandem.OPT_OUT,
        strictAxonDependencies: false
      })
    });
    if (trail.length) {
      selfBackground.addInputListener({
        enter: () => {
          helper.treeHoverTrailProperty.value = trail;
        },
        exit: () => {
          helper.treeHoverTrailProperty.value = null;
        }
      });
      selfBackground.addInputListener(new FireListener({
        fire: () => {
          helper.selectedTrailProperty.value = trail;
        },
        tandem: Tandem.OPT_OUT
      }));
    }
    super(selfBackground, {
      createChildren: () => instance.children.map(instance => new PDOMTreeNode(instance, helper))
    });
    this.instance = instance;
    this.trail = trail;
  }
  find(trail) {
    if (trail.equals(this.instance.trail)) {
      return this;
    } else {
      const treeNode = _.find(this.childTreeNodes, childTreeNode => {
        return trail.isExtensionOf(childTreeNode.instance.trail, true);
      });
      if (treeNode) {
        return treeNode.find(trail);
      } else {
        return null;
      }
    }
  }
}
class TreeNode extends Rectangle {
  constructor(visibleProperty, helper, createTreeNode) {
    super({
      fill: 'rgba(255,255,255,0.85)',
      stroke: 'black',
      rectWidth: 400,
      visibleProperty: visibleProperty,
      pickable: true
    });
    this.helper = helper;
    this.treeContainer = new Node();
    this.addChild(this.treeContainer);
    this.addInputListener(new DragListener({
      targetNode: this,
      drag: (event, listener) => {
        this.x = this.x + listener.modelDelta.x;
      },
      tandem: Tandem.OPT_OUT
    }));
    this.addInputListener({
      wheel: event => {
        const deltaX = event.domEvent.deltaX;
        const deltaY = event.domEvent.deltaY;
        const multiplier = 1;
        if (this.treeNode) {
          this.treeNode.x -= deltaX * multiplier;
          this.treeNode.y -= deltaY * multiplier;
        }
        this.constrainTree();
      }
    });

    // When there isn't a selected trail, focus whatever our pointer is over
    helper.pointerTrailProperty.lazyLink(() => {
      if (!helper.selectedTrailProperty.value) {
        this.focusPointer();
      }
    });
    Multilink.multilink([helper.activeProperty, visibleProperty], (active, treeVisible) => {
      if (active && treeVisible) {
        this.treeNode = createTreeNode();

        // Have the constrain properly position it
        this.treeNode.x = 500;
        this.treeNode.y = 500;
        this.treeContainer.children = [this.treeNode];
        this.focusSelected();
        this.constrainTree();
      } else {
        this.treeContainer.children = [];
      }
    });
  }
  resize(size) {
    this.rectHeight = size.height;
    this.right = size.width;
    this.treeContainer.clipArea = Shape.bounds(this.localBounds.dilated(10));
  }
  constrainTree() {
    const treeMarginX = 8;
    const treeMarginY = 5;
    if (this.treeNode) {
      if (this.treeNode.bottom < this.selfBounds.bottom - treeMarginY) {
        this.treeNode.bottom = this.selfBounds.bottom - treeMarginY;
      }
      if (this.treeNode.top > this.selfBounds.top + treeMarginY) {
        this.treeNode.top = this.selfBounds.top + treeMarginY;
      }
      if (this.treeNode.right < this.selfBounds.right - treeMarginX) {
        this.treeNode.right = this.selfBounds.right - treeMarginX;
      }
      if (this.treeNode.left > this.selfBounds.left + treeMarginX) {
        this.treeNode.left = this.selfBounds.left + treeMarginX;
      }
    }
  }
  focusTrail(trail) {
    if (this.treeNode) {
      const treeNode = this.treeNode.find(trail);
      if (treeNode) {
        const deltaY = treeNode.localToGlobalPoint(treeNode.selfNode.center).y - this.centerY;
        this.treeNode.y -= deltaY;
        this.constrainTree();
      }
    }
  }
  focusPointer() {
    if (this.helper.pointerTrailProperty.value) {
      this.focusTrail(this.helper.pointerTrailProperty.value);
    }
  }
  focusSelected() {
    if (this.helper.selectedTrailProperty.value === null) {
      return;
    }
    this.focusTrail(this.helper.selectedTrailProperty.value);
  }
}
const createHeaderText = (str, node, options) => {
  return new Text(str, merge({
    fontSize: 14,
    fontWeight: 'bold',
    visibleProperty: node ? new DerivedProperty([node.boundsProperty], bounds => {
      return !bounds.isEmpty();
    }, {
      strictAxonDependencies: false
    }) : new TinyProperty(true)
  }, options));
};
const createCollapsibleHeaderText = (str, visibleProperty, node, options) => {
  const headerText = createHeaderText(str, node, options);
  headerText.addInputListener(new FireListener({
    fire: () => {
      visibleProperty.value = !visibleProperty.value;
    },
    tandem: Tandem.OPT_OUT
  }));
  headerText.cursor = 'pointer';
  return new HBox({
    spacing: 7,
    children: [new ExpandCollapseButton(visibleProperty, {
      tandem: Tandem.OPT_OUT,
      sideLength: 14
    }), headerText],
    visibleProperty: headerText.visibleProperty
  });
};
class Matrix3Node extends GridBox {
  constructor(matrix) {
    super({
      xSpacing: 5,
      ySpacing: 0,
      children: [new Text(matrix.m00(), {
        layoutOptions: {
          column: 0,
          row: 0
        }
      }), new Text(matrix.m01(), {
        layoutOptions: {
          column: 1,
          row: 0
        }
      }), new Text(matrix.m02(), {
        layoutOptions: {
          column: 2,
          row: 0
        }
      }), new Text(matrix.m10(), {
        layoutOptions: {
          column: 0,
          row: 1
        }
      }), new Text(matrix.m11(), {
        layoutOptions: {
          column: 1,
          row: 1
        }
      }), new Text(matrix.m12(), {
        layoutOptions: {
          column: 2,
          row: 1
        }
      }), new Text(matrix.m20(), {
        layoutOptions: {
          column: 0,
          row: 2
        }
      }), new Text(matrix.m21(), {
        layoutOptions: {
          column: 1,
          row: 2
        }
      }), new Text(matrix.m22(), {
        layoutOptions: {
          column: 2,
          row: 2
        }
      })]
    });
  }
}
class ShapeNode extends Path {
  constructor(shape) {
    super(shape, {
      maxWidth: 15,
      maxHeight: 15,
      stroke: 'black',
      cursor: 'pointer',
      strokePickable: true
    });
    this.addInputListener(new FireListener({
      fire: () => copyToClipboard(shape.getSVGPath()),
      tandem: Tandem.OPT_OUT
    }));
  }
}
class ImageNode extends Image {
  constructor(image) {
    super(image.getImage(), {
      maxWidth: 15,
      maxHeight: 15
    });
  }
}
const createInfo = trail => {
  const children = [];
  const node = trail.lastNode();
  const types = inheritance(node.constructor).map(type => type.name).filter(name => {
    return name && name !== 'Object';
  });
  const reducedTypes = types.includes('Node') ? types.slice(0, types.indexOf('Node')) : types;
  if (reducedTypes.length > 0) {
    children.push(new RichText(reducedTypes.map((str, i) => {
      return i === 0 ? `<b>${str}</b>` : `<br>&nbsp;${_.repeat('  ', i)}extends ${str}`;
    }).join(''), {
      font: new PhetFont(12)
    }));
  }
  const addRaw = (key, valueNode) => {
    children.push(new HBox({
      spacing: 0,
      align: 'top',
      children: [new Text(key + ': ', {
        fontSize: 12
      }), valueNode]
    }));
  };
  const addSimple = (key, value) => {
    if (value !== undefined) {
      addRaw(key, new RichText('' + value, {
        lineWrap: 400,
        font: new PhetFont(12),
        cursor: 'pointer',
        inputListeners: [new FireListener({
          fire: () => copyToClipboard('' + value),
          tandem: Tandem.OPT_OUT
        })]
      }));
    }
  };
  const colorSwatch = color => {
    return new HBox({
      spacing: 4,
      children: [new Rectangle(0, 0, 10, 10, {
        fill: color,
        stroke: 'black',
        lineWidth: 0.5
      }), new Text(color.toHexString(), {
        fontSize: 12
      }), new Text(color.toCSS(), {
        fontSize: 12
      })],
      cursor: 'pointer',
      inputListeners: [new FireListener({
        fire: () => copyToClipboard(color.toHexString()),
        tandem: Tandem.OPT_OUT
      })]
    });
  };
  const addColor = (key, color) => {
    const result = iColorToColor(color);
    if (result !== null) {
      addRaw(key, colorSwatch(result));
    }
  };
  const addPaint = (key, paint) => {
    const stopToNode = stop => {
      return new HBox({
        spacing: 3,
        children: [new Text(stop.ratio, {
          fontSize: 12
        }), colorSwatch(iColorToColor(stop.color) || Color.TRANSPARENT)]
      });
    };
    if (paint instanceof Paint) {
      if (paint instanceof LinearGradient) {
        addRaw(key, new VBox({
          align: 'left',
          spacing: 3,
          children: [new Text(`LinearGradient (${paint.start.x},${paint.start.y}) => (${paint.end.x},${paint.end.y})`, {
            fontSize: 12
          }), ...paint.stops.map(stopToNode)]
        }));
      } else if (paint instanceof RadialGradient) {
        addRaw(key, new VBox({
          align: 'left',
          spacing: 3,
          children: [new Text(`RadialGradient (${paint.start.x},${paint.start.y}) ${paint.startRadius} => (${paint.end.x},${paint.end.y}) ${paint.endRadius}`, {
            fontSize: 12
          }), ...paint.stops.map(stopToNode)]
        }));
      } else if (paint instanceof Pattern) {
        addRaw(key, new VBox({
          align: 'left',
          spacing: 3,
          children: [new Text('Pattern', {
            fontSize: 12
          }), new Image(paint.image, {
            maxWidth: 10,
            maxHeight: 10
          })]
        }));
      }
    } else {
      addColor(key, paint);
    }
  };
  const addNumber = (key, number) => addSimple(key, number);
  const addMatrix3 = (key, matrix) => addRaw(key, new Matrix3Node(matrix));
  const addBounds2 = (key, bounds) => {
    if (bounds.equals(Bounds2.NOTHING)) {
      // DO nothing
    } else if (bounds.equals(Bounds2.EVERYTHING)) {
      addSimple(key, 'everything');
    } else {
      addRaw(key, new RichText(`x: [${bounds.minX}, ${bounds.maxX}]<br>y: [${bounds.minY}, ${bounds.maxY}]`, {
        font: new PhetFont(12)
      }));
    }
  };
  const addShape = (key, shape) => addRaw(key, new ShapeNode(shape));
  const addImage = (key, image) => addRaw(key, new ImageNode(image));
  if (node.tandem.supplied) {
    addSimple('tandem', node.tandem.phetioID.split('.').join(' '));
  }
  if (node instanceof DOM) {
    addSimple('element', node.element.constructor.name);
  }
  if (extendsWidthSizable(node)) {
    !node.widthSizable && addSimple('widthSizable', node.widthSizable);
    node.preferredWidth !== null && addSimple('preferredWidth', node.preferredWidth);
    node.preferredWidth !== node.localPreferredWidth && addSimple('localPreferredWidth', node.localPreferredWidth);
    node.minimumWidth !== null && addSimple('minimumWidth', node.minimumWidth);
    node.minimumWidth !== node.localMinimumWidth && addSimple('localMinimumWidth', node.localMinimumWidth);
  }
  if (extendsHeightSizable(node)) {
    !node.heightSizable && addSimple('heightSizable', node.heightSizable);
    node.preferredHeight !== null && addSimple('preferredHeight', node.preferredHeight);
    node.preferredHeight !== node.localPreferredHeight && addSimple('localPreferredHeight', node.localPreferredHeight);
    node.minimumHeight !== null && addSimple('minimumHeight', node.minimumHeight);
    node.minimumHeight !== node.localMinimumHeight && addSimple('localMinimumHeight', node.localMinimumHeight);
  }
  if (node.layoutOptions) {
    addSimple('layoutOptions', JSON.stringify(node.layoutOptions, null, 2));
  }
  if (node instanceof LayoutNode) {
    !node.resize && addSimple('resize', node.resize);
    !node.layoutOrigin.equals(Vector2.ZERO) && addSimple('layoutOrigin', node.layoutOrigin);
  }
  if (node instanceof FlowBox) {
    addSimple('orientation', node.orientation);
    addSimple('align', node.align);
    node.spacing && addSimple('spacing', node.spacing);
    node.lineSpacing && addSimple('lineSpacing', node.lineSpacing);
    addSimple('justify', node.justify);
    node.justifyLines && addSimple('justifyLines', node.justifyLines);
    node.wrap && addSimple('wrap', node.wrap);
    node.stretch && addSimple('stretch', node.stretch);
    node.grow && addSimple('grow', node.grow);
    node.leftMargin && addSimple('leftMargin', node.leftMargin);
    node.rightMargin && addSimple('rightMargin', node.rightMargin);
    node.topMargin && addSimple('topMargin', node.topMargin);
    node.bottomMargin && addSimple('bottomMargin', node.bottomMargin);
    node.minContentWidth !== null && addSimple('minContentWidth', node.minContentWidth);
    node.minContentHeight !== null && addSimple('minContentHeight', node.minContentHeight);
    node.maxContentWidth !== null && addSimple('maxContentWidth', node.maxContentWidth);
    node.maxContentHeight !== null && addSimple('maxContentHeight', node.maxContentHeight);
  }
  if (node instanceof GridBox) {
    addSimple('xAlign', node.xAlign);
    addSimple('yAlign', node.yAlign);
    node.xSpacing && addSimple('xSpacing', node.xSpacing);
    node.ySpacing && addSimple('ySpacing', node.ySpacing);
    node.xStretch && addSimple('xStretch', node.xStretch);
    node.yStretch && addSimple('yStretch', node.yStretch);
    node.xGrow && addSimple('xGrow', node.xGrow);
    node.yGrow && addSimple('yGrow', node.yGrow);
    node.leftMargin && addSimple('leftMargin', node.leftMargin);
    node.rightMargin && addSimple('rightMargin', node.rightMargin);
    node.topMargin && addSimple('topMargin', node.topMargin);
    node.bottomMargin && addSimple('bottomMargin', node.bottomMargin);
    node.minContentWidth !== null && addSimple('minContentWidth', node.minContentWidth);
    node.minContentHeight !== null && addSimple('minContentHeight', node.minContentHeight);
    node.maxContentWidth !== null && addSimple('maxContentWidth', node.maxContentWidth);
    node.maxContentHeight !== null && addSimple('maxContentHeight', node.maxContentHeight);
  }
  if (node instanceof Rectangle) {
    addBounds2('rectBounds', node.rectBounds);
    if (node.cornerXRadius || node.cornerYRadius) {
      if (node.cornerXRadius === node.cornerYRadius) {
        addSimple('cornerRadius', node.cornerRadius);
      } else {
        addSimple('cornerXRadius', node.cornerXRadius);
        addSimple('cornerYRadius', node.cornerYRadius);
      }
    }
  }
  if (node instanceof Line) {
    addSimple('x1', node.x1);
    addSimple('y1', node.y1);
    addSimple('x2', node.x2);
    addSimple('y2', node.y2);
  }
  if (node instanceof Circle) {
    addSimple('radius', node.radius);
  }
  if (node instanceof Text) {
    addSimple('text', node.string);
    addSimple('font', node.font);
    if (node.boundsMethod !== 'hybrid') {
      addSimple('boundsMethod', node.boundsMethod);
    }
  }
  if (node instanceof RichText) {
    addSimple('text', node.string);
    addSimple('font', node.font instanceof Font ? node.font.getFont() : node.font);
    addPaint('fill', node.fill);
    addPaint('stroke', node.stroke);
    if (node.boundsMethod !== 'hybrid') {
      addSimple('boundsMethod', node.boundsMethod);
    }
    if (node.lineWrap !== null) {
      addSimple('lineWrap', node.lineWrap);
    }
  }
  if (node instanceof Image) {
    addImage('image', node);
    addSimple('imageWidth', node.imageWidth);
    addSimple('imageHeight', node.imageHeight);
    if (node.imageOpacity !== 1) {
      addSimple('imageOpacity', node.imageOpacity);
    }
    if (node.imageBounds) {
      addBounds2('imageBounds', node.imageBounds);
    }
    if (node.initialWidth) {
      addSimple('initialWidth', node.initialWidth);
    }
    if (node.initialHeight) {
      addSimple('initialHeight', node.initialHeight);
    }
    if (node.hitTestPixels) {
      addSimple('hitTestPixels', node.hitTestPixels);
    }
  }
  if (node instanceof CanvasNode || node instanceof WebGLNode) {
    addBounds2('canvasBounds', node.canvasBounds);
  }
  if (node instanceof Path) {
    if (node.shape) {
      addShape('shape', node.shape);
    }
    if (node.boundsMethod !== 'accurate') {
      addSimple('boundsMethod', node.boundsMethod);
    }
  }
  if (node instanceof Path || node instanceof Text) {
    addPaint('fill', node.fill);
    addPaint('stroke', node.stroke);
    if (node.lineDash.length) {
      addSimple('lineDash', node.lineDash);
    }
    if (!node.fillPickable) {
      addSimple('fillPickable', node.fillPickable);
    }
    if (node.strokePickable) {
      addSimple('strokePickable', node.strokePickable);
    }
    if (node.lineWidth !== 1) {
      addSimple('lineWidth', node.lineWidth);
    }
    if (node.lineCap !== 'butt') {
      addSimple('lineCap', node.lineCap);
    }
    if (node.lineJoin !== 'miter') {
      addSimple('lineJoin', node.lineJoin);
    }
    if (node.lineDashOffset !== 0) {
      addSimple('lineDashOffset', node.lineDashOffset);
    }
    if (node.miterLimit !== 10) {
      addSimple('miterLimit', node.miterLimit);
    }
  }
  if (node.tagName) {
    addSimple('tagName', node.tagName);
  }
  if (node.accessibleName) {
    addSimple('accessibleName', node.accessibleName);
  }
  if (node.helpText) {
    addSimple('helpText', node.helpText);
  }
  if (node.pdomHeading) {
    addSimple('pdomHeading', node.pdomHeading);
  }
  if (node.containerTagName) {
    addSimple('containerTagName', node.containerTagName);
  }
  if (node.containerAriaRole) {
    addSimple('containerAriaRole', node.containerAriaRole);
  }
  if (node.innerContent) {
    addSimple('innerContent', node.innerContent);
  }
  if (node.inputType) {
    addSimple('inputType', node.inputType);
  }
  if (node.inputValue) {
    addSimple('inputValue', node.inputValue);
  }
  if (node.pdomNamespace) {
    addSimple('pdomNamespace', node.pdomNamespace);
  }
  if (node.ariaLabel) {
    addSimple('ariaLabel', node.ariaLabel);
  }
  if (node.ariaRole) {
    addSimple('ariaRole', node.ariaRole);
  }
  if (node.ariaValueText) {
    addSimple('ariaValueText', node.ariaValueText);
  }
  if (node.labelTagName) {
    addSimple('labelTagName', node.labelTagName);
  }
  if (node.labelContent) {
    addSimple('labelContent', node.labelContent);
  }
  if (node.appendLabel) {
    addSimple('appendLabel', node.appendLabel);
  }
  if (node.descriptionTagName) {
    addSimple('descriptionTagName', node.descriptionTagName);
  }
  if (node.descriptionContent) {
    addSimple('descriptionContent', node.descriptionContent);
  }
  if (node.appendDescription) {
    addSimple('appendDescription', node.appendDescription);
  }
  if (!node.pdomVisible) {
    addSimple('pdomVisible', node.pdomVisible);
  }
  if (node.pdomOrder) {
    addSimple('pdomOrder', node.pdomOrder.map(node => node === null ? 'null' : node.constructor.name));
  }
  if (!node.visible) {
    addSimple('visible', node.visible);
  }
  if (node.opacity !== 1) {
    addNumber('opacity', node.opacity);
  }
  if (node.pickable !== null) {
    addSimple('pickable', node.pickable);
  }
  if (!node.enabled) {
    addSimple('enabled', node.enabled);
  }
  if (!node.inputEnabled) {
    addSimple('inputEnabled', node.inputEnabled);
  }
  if (node.cursor !== null) {
    addSimple('cursor', node.cursor);
  }
  if (node.transformBounds) {
    addSimple('transformBounds', node.transformBounds);
  }
  if (node.renderer) {
    addSimple('renderer', node.renderer);
  }
  if (node.usesOpacity) {
    addSimple('usesOpacity', node.usesOpacity);
  }
  if (node.layerSplit) {
    addSimple('layerSplit', node.layerSplit);
  }
  if (node.cssTransform) {
    addSimple('cssTransform', node.cssTransform);
  }
  if (node.excludeInvisible) {
    addSimple('excludeInvisible', node.excludeInvisible);
  }
  if (node.preventFit) {
    addSimple('preventFit', node.preventFit);
  }
  if (node.webglScale !== null) {
    addSimple('webglScale', node.webglScale);
  }
  if (!node.matrix.isIdentity()) {
    addMatrix3('matrix', node.matrix);
  }
  if (node.maxWidth !== null) {
    addSimple('maxWidth', node.maxWidth);
  }
  if (node.maxHeight !== null) {
    addSimple('maxHeight', node.maxHeight);
  }
  if (node.clipArea !== null) {
    addShape('clipArea', node.clipArea);
  }
  if (node.mouseArea !== null) {
    if (node.mouseArea instanceof Bounds2) {
      addBounds2('mouseArea', node.mouseArea);
    } else {
      addShape('mouseArea', node.mouseArea);
    }
  }
  if (node.touchArea !== null) {
    if (node.touchArea instanceof Bounds2) {
      addBounds2('touchArea', node.touchArea);
    } else {
      addShape('touchArea', node.touchArea);
    }
  }
  if (node.inputListeners.length) {
    addSimple('inputListeners', node.inputListeners.map(listener => listener.constructor.name).join(', '));
  }
  children.push(new Spacer(5, 5));
  addBounds2('localBounds', node.localBounds);
  if (node.localBoundsOverridden) {
    addSimple('localBoundsOverridden', node.localBoundsOverridden);
  }
  addBounds2('bounds', node.bounds);
  if (isFinite(node.width)) {
    addSimple('width', node.width);
  }
  if (isFinite(node.height)) {
    addSimple('height', node.height);
  }
  children.push(new RectangularPushButton({
    content: new Text('Copy Path', {
      fontSize: 12
    }),
    listener: () => copyToClipboard('phet.joist.display.rootNode' + trail.indices.map(index => {
      return `.children[ ${index} ]`;
    }).join('')),
    tandem: Tandem.OPT_OUT
  }));
  return children;
};
const iColorToColor = color => {
  const nonProperty = isTReadOnlyProperty(color) ? color.value : color;
  return nonProperty === null ? null : Color.toColor(nonProperty);
};
const isPaintNonTransparent = paint => {
  if (paint instanceof Paint) {
    return true;
  } else {
    const color = iColorToColor(paint);
    return !!color && color.alpha > 0;
  }
};

// Missing optimizations on bounds on purpose, so we hit visual changes
const visualHitTest = (node, point) => {
  if (!node.visible) {
    return null;
  }
  const localPoint = node._transform.getInverse().timesVector2(point);
  const clipArea = node.clipArea;
  if (clipArea !== null && !clipArea.containsPoint(localPoint)) {
    return null;
  }
  for (let i = node._children.length - 1; i >= 0; i--) {
    const child = node._children[i];
    const childHit = visualHitTest(child, localPoint);
    if (childHit) {
      return childHit.addAncestor(node, i);
    }
  }

  // Didn't hit our children, so check ourself as a last resort. Check our selfBounds first, so we can potentially
  // avoid hit-testing the actual object (which may be more expensive).
  if (node.selfBounds.containsPoint(localPoint)) {
    // Ignore those transparent paths...
    if (node instanceof Path && node.hasShape()) {
      if (isPaintNonTransparent(node.fill) && node.getShape().containsPoint(localPoint)) {
        return new Trail(node);
      }
      if (isPaintNonTransparent(node.stroke) && node.getStrokedShape().containsPoint(localPoint)) {
        return new Trail(node);
      }
    } else if (node.containsPointSelf(localPoint)) {
      return new Trail(node);
    }
  }

  // No hit
  return null;
};
const copyToClipboard = async str => {
  await navigator.clipboard?.writeText(str);
};
const getLocalShape = (node, useMouse, useTouch) => {
  let shape = Shape.union([...(useMouse && node.mouseArea ? [node.mouseArea instanceof Shape ? node.mouseArea : Shape.bounds(node.mouseArea)] : []), ...(useTouch && node.touchArea ? [node.touchArea instanceof Shape ? node.touchArea : Shape.bounds(node.touchArea)] : []), node.getSelfShape(), ...node.children.filter(child => {
    return child.visible && child.pickable !== false;
  }).map(child => getLocalShape(child, useMouse, useTouch).transformed(child.matrix))].filter(shape => shape.bounds.isValid()));
  if (node.hasClipArea()) {
    shape = shape.shapeIntersection(node.clipArea);
  }
  return shape;
};
const getShape = (trail, useMouse, useTouch) => {
  let shape = getLocalShape(trail.lastNode(), useMouse, useTouch);
  for (let i = trail.nodes.length - 1; i >= 0; i--) {
    const node = trail.nodes[i];
    if (node.hasClipArea()) {
      shape = shape.shapeIntersection(node.clipArea);
    }
    shape = shape.transformed(node.matrix);
  }
  return shape;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhbmltYXRpb25GcmFtZVRpbWVyIiwiRGVyaXZlZFByb3BlcnR5IiwiTWFwcGVkUHJvcGVydHkiLCJUaW55UHJvcGVydHkiLCJCb3VuZHMyIiwiVXRpbHMiLCJWZWN0b3IyIiwiTWVhc3VyaW5nVGFwZU5vZGUiLCJQaGV0Rm9udCIsIkNhbnZhc05vZGUiLCJDaXJjbGUiLCJDb2xvciIsIkRpc3BsYXkiLCJET00iLCJEcmFnTGlzdGVuZXIiLCJleHRlbmRzSGVpZ2h0U2l6YWJsZSIsImV4dGVuZHNXaWR0aFNpemFibGUiLCJGaXJlTGlzdGVuZXIiLCJGbG93Qm94IiwiRm9udCIsIkdyaWRCb3giLCJIQm94IiwiSFNlcGFyYXRvciIsIkltYWdlIiwiTGF5b3V0Tm9kZSIsIkxpbmUiLCJMaW5lYXJHcmFkaWVudCIsIk5vZGUiLCJOb2RlUGF0dGVybiIsIlBhaW50IiwiUGF0aCIsIlBhdHRlcm4iLCJQcmVzc0xpc3RlbmVyIiwiUmFkaWFsR3JhZGllbnQiLCJSZWN0YW5nbGUiLCJSaWNoVGV4dCIsIlNwYWNlciIsIlRleHQiLCJUcmFpbCIsIlZCb3giLCJXZWJHTE5vZGUiLCJQYW5lbCIsIkFxdWFSYWRpb0J1dHRvbkdyb3VwIiwiVGFuZGVtIiwiam9pc3QiLCJCb29sZWFuUHJvcGVydHkiLCJDaGVja2JveCIsImluaGVyaXRhbmNlIiwiRW51bWVyYXRpb25WYWx1ZSIsIkVudW1lcmF0aW9uIiwiRW51bWVyYXRpb25Qcm9wZXJ0eSIsIm1lcmdlIiwiU2hhcGUiLCJSZWN0YW5ndWxhclB1c2hCdXR0b24iLCJFeHBhbmRDb2xsYXBzZUJ1dHRvbiIsImRlZmF1bHQiLCJjcmVhdGVPYnNlcnZhYmxlQXJyYXkiLCJvcHRpb25pemUiLCJNdWx0aWxpbmsiLCJpc1RSZWFkT25seVByb3BlcnR5Iiwicm91bmQiLCJuIiwicGxhY2VzIiwidG9GaXhlZCIsIlBvaW50ZXJBcmVhVHlwZSIsIk1PVVNFIiwiVE9VQ0giLCJOT05FIiwiZW51bWVyYXRpb24iLCJoYXNIZWxwZXJOb2RlIiwibm9kZSIsImdldEhlbHBlck5vZGUiLCJIZWxwZXIiLCJjb25zdHJ1Y3RvciIsInNpbSIsInNpbURpc3BsYXkiLCJhY3RpdmVQcm9wZXJ0eSIsInZpc3VhbFRyZWVWaXNpYmxlUHJvcGVydHkiLCJ0YW5kZW0iLCJPUFRfT1VUIiwicGRvbVRyZWVWaXNpYmxlUHJvcGVydHkiLCJ1bmRlclBvaW50ZXJWaXNpYmxlUHJvcGVydHkiLCJvcHRpb25zVmlzaWJsZVByb3BlcnR5IiwicHJldmlld1Zpc2libGVQcm9wZXJ0eSIsInNlbGVjdGVkTm9kZUNvbnRlbnRWaXNpYmxlUHJvcGVydHkiLCJzZWxlY3RlZFRyYWlsQ29udGVudFZpc2libGVQcm9wZXJ0eSIsImhpZ2hsaWdodFZpc2libGVQcm9wZXJ0eSIsImJvdW5kc1Zpc2libGVQcm9wZXJ0eSIsInNlbGZCb3VuZHNWaXNpYmxlUHJvcGVydHkiLCJnZXRIZWxwZXJOb2RlVmlzaWJsZVByb3BlcnR5IiwiaGVscGVyVmlzaWJsZVByb3BlcnR5IiwiaW5wdXRCYXNlZFBpY2tpbmdQcm9wZXJ0eSIsInVzZUxlYWZOb2RlUHJvcGVydHkiLCJwb2ludGVyQXJlYVR5cGVQcm9wZXJ0eSIsInBvaW50ZXJQb3NpdGlvblByb3BlcnR5IiwiWkVSTyIsIm92ZXJJbnRlcmZhY2VQcm9wZXJ0eSIsInNlbGVjdGVkVHJhaWxQcm9wZXJ0eSIsInRyZWVIb3ZlclRyYWlsUHJvcGVydHkiLCJwb2ludGVyVHJhaWxQcm9wZXJ0eSIsInBvaW50Iiwib3ZlckludGVyZmFjZSIsInBvaW50ZXJBcmVhVHlwZSIsImlucHV0QmFzZWRQaWNraW5nIiwidmlzdWFsSGl0VGVzdCIsInJvb3ROb2RlIiwidHJhaWwiLCJoaXRUZXN0IiwidmFsdWUiLCJsZW5ndGgiLCJsYXN0Tm9kZSIsImlucHV0TGlzdGVuZXJzIiwicmVtb3ZlRGVzY2VuZGFudCIsImxpc3RlbmVycyIsImZpcnN0TGlzdGVuZXIiLCJ0YXJnZXROb2RlIiwiY29udGFpbnNOb2RlIiwic3VidHJhaWxUbyIsInZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5Iiwic3RyaWN0QXhvbkRlcGVuZGVuY2llcyIsInByZXZpZXdUcmFpbFByb3BlcnR5Iiwic2VsZWN0ZWQiLCJ0cmVlSG92ZXIiLCJhY3RpdmUiLCJwcmV2aWV3U2hhcGVQcm9wZXJ0eSIsInByZXZpZXdUcmFpbCIsImdldFNoYXBlIiwiaGVscGVyTm9kZVByb3BlcnR5Iiwic2NyZWVuVmlld1Byb3BlcnR5IiwiaW1hZ2VEYXRhUHJvcGVydHkiLCJjb2xvclByb3BlcnR5IiwicG9zaXRpb24iLCJpbWFnZURhdGEiLCJUUkFOU1BBUkVOVCIsIngiLCJNYXRoIiwiZmxvb3IiLCJ3aWR0aCIsInkiLCJoZWlnaHQiLCJpbmRleCIsImRhdGEiLCJmdXp6UHJvcGVydHkiLCJwaGV0IiwiY2hpcHBlciIsInF1ZXJ5UGFyYW1ldGVycyIsImZ1enoiLCJsYXp5TGluayIsIm1lYXN1cmluZ1RhcGVWaXNpYmxlUHJvcGVydHkiLCJtZWFzdXJpbmdUYXBlVW5pdHNQcm9wZXJ0eSIsIm5hbWUiLCJtdWx0aXBsaWVyIiwibGF5b3V0Qm91bmRzUHJvcGVydHkiLCJOT1RISU5HIiwiaGVscGVyUm9vdCIsInJlbmRlcmVyIiwicG9zaXRpb25TdHJpbmdQcm9wZXJ0eSIsImJpZGlyZWN0aW9uYWwiLCJtYXAiLCJ2aWV3Iiwidmlld1Bvc2l0aW9uIiwiZ2xvYmFsVG9Mb2NhbFBvaW50IiwicG9zaXRpb25UZXh0IiwiZm9udCIsImNvbG9yVGV4dE1hcCIsImNvbG9yIiwidG9IZXhTdHJpbmciLCJ0b0NTUyIsImNvbG9yU3RyaW5nUHJvcGVydHkiLCJjb2xvclRleHQiLCJsaW5rIiwiZmlsbCIsImdldEx1bWluYW5jZSIsIkJMQUNLIiwiV0hJVEUiLCJib3VuZHNDb2xvciIsInNlbGZCb3VuZHNDb2xvciIsIm5vbklucHV0QmFzZWRDb2xvciIsIm1vdXNlQ29sb3IiLCJ0b3VjaENvbG9yIiwiaW5wdXRCYXNlZENvbG9yIiwiaGlnaGxpZ2h0QmFzZUNvbG9yUHJvcGVydHkiLCJjb2xvckJhY2tncm91bmQiLCJjb3JuZXJSYWRpdXMiLCJzdHJva2UiLCJwcmV2aWV3Tm9kZSIsInZpc2libGVQcm9wZXJ0eSIsInByZXZpZXdCYWNrZ3JvdW5kIiwiY2hpbGRyZW4iLCJyZW1vdmVBbGxDaGlsZHJlbiIsImFkZENoaWxkIiwiYm91bmRzIiwiaXNWYWxpZCIsInNjYWxlIiwid2luZG93IiwiZGV2aWNlUGl4ZWxSYXRpbyIsIm1pbiIsInNlbGZCb3VuZHMiLCJjZW50ZXIiLCJyYXN0ZXJpemVkIiwicmVzb2x1dGlvbiIsInNvdXJjZUJvdW5kcyIsImRpbGF0ZWQiLCJyb3VuZGVkT3V0Iiwic2VsZWN0ZWROb2RlQ29udGVudCIsInNwYWNpbmciLCJhbGlnbiIsImNyZWF0ZUluZm8iLCJmdXp6Q2hlY2tib3giLCJIZWxwZXJDaGVja2JveCIsIm1lYXN1cmluZ1RhcGVWaXNpYmxlQ2hlY2tib3giLCJ2aXN1YWxUcmVlVmlzaWJsZUNoZWNrYm94IiwicGRvbVRyZWVWaXNpYmxlQ2hlY2tib3giLCJpbnB1dEJhc2VkUGlja2luZ0NoZWNrYm94IiwidXNlTGVhZk5vZGVDaGVja2JveCIsImVuYWJsZWRQcm9wZXJ0eSIsImhpZ2hsaWdodFZpc2libGVDaGVja2JveCIsImxhYmVsT3B0aW9ucyIsImJvdW5kc1Zpc2libGVDaGVja2JveCIsInNlbGZCb3VuZHNWaXNpYmxlQ2hlY2tib3giLCJnZXRIZWxwZXJOb2RlVmlzaWJsZUNoZWNrYm94IiwicG9pbnRlckFyZWFUeXBlUmFkaW9CdXR0b25Hcm91cCIsImNyZWF0ZU5vZGUiLCJmb250U2l6ZSIsIm9yaWVudGF0aW9uIiwicmFkaW9CdXR0b25PcHRpb25zIiwieFNwYWNpbmciLCJzZWxlY3RlZFRyYWlsQ29udGVudCIsIm5vZGVzIiwic2xpY2UiLCJmb3JFYWNoIiwiaW5kZXhPZiIsImxheW91dE9wdGlvbnMiLCJsZWZ0TWFyZ2luIiwiY3Vyc29yIiwiZmlyZSIsImZvY3VzU2VsZWN0ZWQiLCJjb3B5IiwiYWRkRGVzY2VuZGFudCIsImlzVmlzaWJsZSIsImdldE9wYWNpdHkiLCJoYXNQaWNrYWJsZUZhbHNlRXF1aXZhbGVudCIsIl8iLCJzb21lIiwicGlja2FibGUiLCJ2aXNpYmxlIiwiaGFzUGlja2FibGVUcnVlRXF1aXZhbGVudCIsImdldE1hdHJpeCIsImlzSWRlbnRpdHkiLCJNYXRyaXgzTm9kZSIsInZpc3VhbFRyZWVOb2RlIiwiVHJlZU5vZGUiLCJWaXN1YWxUcmVlTm9kZSIsInBkb21UcmVlTm9kZSIsIlBET01UcmVlTm9kZSIsIl9yb290UERPTUluc3RhbmNlIiwiYm91bmRzUGF0aCIsIndpdGhBbHBoYSIsImxpbmVEYXNoIiwibGluZURhc2hPZmZzZXQiLCJsb2NhbEJvdW5kcyIsInNoYXBlIiwidHJhbnNmb3JtZWQiLCJzZWxmQm91bmRzUGF0aCIsImhpZ2hsaWdodEZpbGxQcm9wZXJ0eSIsImhpZ2hsaWdodFBhdGgiLCJoZWxwZXJOb2RlQ29udGFpbmVyIiwibWF0cml4IiwiYmFja2dyb3VuZE5vZGUiLCJhZGRJbnB1dExpc3RlbmVyIiwicHJlc3MiLCJ1bmRlclBvaW50ZXJOb2RlIiwib3B0aW9uc05vZGUiLCJjcmVhdGVIZWFkZXJUZXh0IiwiX2FjY2Vzc2libGUiLCJ1bmRlZmluZWQiLCJ0b3BNYXJnaW4iLCJoZWxwZXJSZWFkb3V0Q29udGVudCIsImNyZWF0ZUNvbGxhcHNpYmxlSGVhZGVyVGV4dCIsImhlbHBlclJlYWRvdXRDb2xsYXBzaWJsZSIsImhlbHBlclJlYWRvdXRQYW5lbCIsInRyYW5zbGF0ZU5vZGUiLCJ3aGVlbCIsImV2ZW50IiwiZGVsdGFZIiwiZG9tRXZlbnQiLCJtZWFzdXJpbmdUYXBlTm9kZSIsInRleHRCYWNrZ3JvdW5kQ29sb3IiLCJiYXNlUG9zaXRpb25Qcm9wZXJ0eSIsInRpcFBvc2l0aW9uUHJvcGVydHkiLCJyZXNpemVMaXN0ZW5lciIsInNpemUiLCJoZWxwZXJEaXNwbGF5Iiwid2l0aE1heFgiLCJ3aXRoTWF4WSIsIm1vdXNlQXJlYSIsInRvdWNoQXJlYSIsInJlc2l6ZSIsImZyYW1lTGlzdGVuZXIiLCJkdCIsImNvbnRhaW5zUG9pbnQiLCJ1cGRhdGVEaXNwbGF5IiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwia2V5Iiwic2NyZWVuIiwic2VsZWN0ZWRTY3JlZW5Qcm9wZXJ0eSIsImhhc1ZpZXciLCJhc3N1bWVGdWxsV2luZG93IiwiaW5pdGlhbGl6ZUV2ZW50cyIsImRpbWVuc2lvblByb3BlcnR5IiwiYWRkTGlzdGVuZXIiLCJib2R5IiwiYXBwZW5kQ2hpbGQiLCJkb21FbGVtZW50Iiwic3R5bGUiLCJ6SW5kZXgiLCJvbkxvY2F0aW9uRXZlbnQiLCJwb2ludGVyIiwibW92ZSIsImRvd24iLCJ1cCIsImdldEdsb2JhbFRvTG9jYWxNYXRyaXgiLCJnZXRTY2FsZVZlY3RvciIsImZvcmVpZ25PYmplY3RSYXN0ZXJpemF0aW9uIiwiZGF0YVVSSSIsImltYWdlIiwiY3JlYXRlRWxlbWVudCIsImNhbnZhcyIsImNvbnRleHQiLCJnZXRDb250ZXh0IiwiZHJhd0ltYWdlIiwiZ2V0SW1hZ2VEYXRhIiwic3JjIiwiY29uc29sZSIsImxvZyIsInVubGluayIsInJlbW92ZUxpc3RlbmVyIiwicmVtb3ZlQ2hpbGQiLCJkaXNwb3NlIiwiaW5pdGlhbGl6ZSIsImN0cmxLZXkiLCJoZWxwZXIiLCJyZWdpc3RlciIsInByb3BlcnR5IiwibGFiZWwiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwiYm94V2lkdGgiLCJDb2xsYXBzaWJsZVRyZWVOb2RlIiwic2VsZk5vZGUiLCJjcmVhdGVDaGlsZHJlbiIsImluZGVudCIsImV4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMiLCJjZW50ZXJZIiwiZXhwYW5kZWRQcm9wZXJ0eSIsImNoaWxkVHJlZU5vZGVzIiwiZWxlbWVudHMiLCJidXR0b25TaXplIiwiZXhwYW5kQ29sbGFwc2VTaGFwZSIsIm1vdmVUb1BvaW50IiwiY3JlYXRlUG9sYXIiLCJQSSIsInBsdXNYWSIsImxpbmVUbyIsImxpbmVUb1BvaW50IiwiZXhwYW5kQ29sbGFwc2VCdXR0b24iLCJsaW5lQ2FwIiwibGluZVdpZHRoIiwicmlnaHQiLCJleHBhbmRlZCIsInJvdGF0aW9uIiwiY2hpbGRDb250YWluZXIiLCJib3R0b20iLCJvbkNoaWxkcmVuQ2hhbmdlIiwiYWRkSXRlbUFkZGVkTGlzdGVuZXIiLCJhZGRJdGVtUmVtb3ZlZExpc3RlbmVyIiwibXV0YXRlIiwiZXhwYW5kIiwiY29sbGFwc2UiLCJleHBhbmRSZWN1c2l2ZWx5IiwidHJlZU5vZGUiLCJjb2xsYXBzZVJlY3Vyc2l2ZWx5IiwiVFJFRV9GT05UIiwibmFtZU5vZGUiLCJzdHJpbmciLCJzZWxmQmFja2dyb3VuZCIsImVxdWFscyIsImVudGVyIiwiZXhpdCIsImNoaWxkIiwiZmluZCIsImNoaWxkVHJlZU5vZGUiLCJpc0V4dGVuc2lvbk9mIiwiaW5zdGFuY2UiLCJpc1BET01WaXNpYmxlIiwidGFnTmFtZSIsIndlaWdodCIsImxhYmVsQ29udGVudCIsImlubmVyQ29udGVudCIsImRlc2NyaXB0aW9uQ29udGVudCIsInBhcmVudFRyYWlsIiwicGFyZW50IiwiZmlsdGVyIiwiam9pbiIsImNyZWF0ZVRyZWVOb2RlIiwicmVjdFdpZHRoIiwidHJlZUNvbnRhaW5lciIsImRyYWciLCJsaXN0ZW5lciIsIm1vZGVsRGVsdGEiLCJkZWx0YVgiLCJjb25zdHJhaW5UcmVlIiwiZm9jdXNQb2ludGVyIiwibXVsdGlsaW5rIiwidHJlZVZpc2libGUiLCJyZWN0SGVpZ2h0IiwiY2xpcEFyZWEiLCJ0cmVlTWFyZ2luWCIsInRyZWVNYXJnaW5ZIiwidG9wIiwibGVmdCIsImZvY3VzVHJhaWwiLCJsb2NhbFRvR2xvYmFsUG9pbnQiLCJzdHIiLCJmb250V2VpZ2h0IiwiYm91bmRzUHJvcGVydHkiLCJpc0VtcHR5IiwiaGVhZGVyVGV4dCIsInNpZGVMZW5ndGgiLCJ5U3BhY2luZyIsIm0wMCIsImNvbHVtbiIsInJvdyIsIm0wMSIsIm0wMiIsIm0xMCIsIm0xMSIsIm0xMiIsIm0yMCIsIm0yMSIsIm0yMiIsIlNoYXBlTm9kZSIsIm1heFdpZHRoIiwibWF4SGVpZ2h0Iiwic3Ryb2tlUGlja2FibGUiLCJjb3B5VG9DbGlwYm9hcmQiLCJnZXRTVkdQYXRoIiwiSW1hZ2VOb2RlIiwiZ2V0SW1hZ2UiLCJ0eXBlcyIsInR5cGUiLCJyZWR1Y2VkVHlwZXMiLCJpbmNsdWRlcyIsInB1c2giLCJpIiwicmVwZWF0IiwiYWRkUmF3IiwidmFsdWVOb2RlIiwiYWRkU2ltcGxlIiwibGluZVdyYXAiLCJjb2xvclN3YXRjaCIsImFkZENvbG9yIiwicmVzdWx0IiwiaUNvbG9yVG9Db2xvciIsImFkZFBhaW50IiwicGFpbnQiLCJzdG9wVG9Ob2RlIiwic3RvcCIsInJhdGlvIiwic3RhcnQiLCJlbmQiLCJzdG9wcyIsInN0YXJ0UmFkaXVzIiwiZW5kUmFkaXVzIiwiYWRkTnVtYmVyIiwibnVtYmVyIiwiYWRkTWF0cml4MyIsImFkZEJvdW5kczIiLCJFVkVSWVRISU5HIiwibWluWCIsIm1heFgiLCJtaW5ZIiwibWF4WSIsImFkZFNoYXBlIiwiYWRkSW1hZ2UiLCJzdXBwbGllZCIsInBoZXRpb0lEIiwic3BsaXQiLCJlbGVtZW50Iiwid2lkdGhTaXphYmxlIiwicHJlZmVycmVkV2lkdGgiLCJsb2NhbFByZWZlcnJlZFdpZHRoIiwibWluaW11bVdpZHRoIiwibG9jYWxNaW5pbXVtV2lkdGgiLCJoZWlnaHRTaXphYmxlIiwicHJlZmVycmVkSGVpZ2h0IiwibG9jYWxQcmVmZXJyZWRIZWlnaHQiLCJtaW5pbXVtSGVpZ2h0IiwibG9jYWxNaW5pbXVtSGVpZ2h0IiwiSlNPTiIsInN0cmluZ2lmeSIsImxheW91dE9yaWdpbiIsImxpbmVTcGFjaW5nIiwianVzdGlmeSIsImp1c3RpZnlMaW5lcyIsIndyYXAiLCJzdHJldGNoIiwiZ3JvdyIsInJpZ2h0TWFyZ2luIiwiYm90dG9tTWFyZ2luIiwibWluQ29udGVudFdpZHRoIiwibWluQ29udGVudEhlaWdodCIsIm1heENvbnRlbnRXaWR0aCIsIm1heENvbnRlbnRIZWlnaHQiLCJ4QWxpZ24iLCJ5QWxpZ24iLCJ4U3RyZXRjaCIsInlTdHJldGNoIiwieEdyb3ciLCJ5R3JvdyIsInJlY3RCb3VuZHMiLCJjb3JuZXJYUmFkaXVzIiwiY29ybmVyWVJhZGl1cyIsIngxIiwieTEiLCJ4MiIsInkyIiwicmFkaXVzIiwiYm91bmRzTWV0aG9kIiwiZ2V0Rm9udCIsImltYWdlV2lkdGgiLCJpbWFnZUhlaWdodCIsImltYWdlT3BhY2l0eSIsImltYWdlQm91bmRzIiwiaW5pdGlhbFdpZHRoIiwiaW5pdGlhbEhlaWdodCIsImhpdFRlc3RQaXhlbHMiLCJjYW52YXNCb3VuZHMiLCJmaWxsUGlja2FibGUiLCJsaW5lSm9pbiIsIm1pdGVyTGltaXQiLCJhY2Nlc3NpYmxlTmFtZSIsImhlbHBUZXh0IiwicGRvbUhlYWRpbmciLCJjb250YWluZXJUYWdOYW1lIiwiY29udGFpbmVyQXJpYVJvbGUiLCJpbnB1dFR5cGUiLCJpbnB1dFZhbHVlIiwicGRvbU5hbWVzcGFjZSIsImFyaWFMYWJlbCIsImFyaWFSb2xlIiwiYXJpYVZhbHVlVGV4dCIsImxhYmVsVGFnTmFtZSIsImFwcGVuZExhYmVsIiwiZGVzY3JpcHRpb25UYWdOYW1lIiwiYXBwZW5kRGVzY3JpcHRpb24iLCJwZG9tVmlzaWJsZSIsInBkb21PcmRlciIsIm9wYWNpdHkiLCJlbmFibGVkIiwiaW5wdXRFbmFibGVkIiwidHJhbnNmb3JtQm91bmRzIiwidXNlc09wYWNpdHkiLCJsYXllclNwbGl0IiwiY3NzVHJhbnNmb3JtIiwiZXhjbHVkZUludmlzaWJsZSIsInByZXZlbnRGaXQiLCJ3ZWJnbFNjYWxlIiwibG9jYWxCb3VuZHNPdmVycmlkZGVuIiwiaXNGaW5pdGUiLCJjb250ZW50IiwiaW5kaWNlcyIsIm5vblByb3BlcnR5IiwidG9Db2xvciIsImlzUGFpbnROb25UcmFuc3BhcmVudCIsImFscGhhIiwibG9jYWxQb2ludCIsIl90cmFuc2Zvcm0iLCJnZXRJbnZlcnNlIiwidGltZXNWZWN0b3IyIiwiX2NoaWxkcmVuIiwiY2hpbGRIaXQiLCJhZGRBbmNlc3RvciIsImhhc1NoYXBlIiwiZ2V0U3Ryb2tlZFNoYXBlIiwiY29udGFpbnNQb2ludFNlbGYiLCJuYXZpZ2F0b3IiLCJjbGlwYm9hcmQiLCJ3cml0ZVRleHQiLCJnZXRMb2NhbFNoYXBlIiwidXNlTW91c2UiLCJ1c2VUb3VjaCIsInVuaW9uIiwiZ2V0U2VsZlNoYXBlIiwiaGFzQ2xpcEFyZWEiLCJzaGFwZUludGVyc2VjdGlvbiJdLCJzb3VyY2VzIjpbIkhlbHBlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuLyoqXHJcbiAqIFNvbWUgaW4tc2ltdWxhdGlvbiB1dGlsaXRpZXMgZGVzaWduZWQgdG8gaGVscCBkZXNpZ25lcnMgYW5kIGRldmVsb3BlcnNcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBhbmltYXRpb25GcmFtZVRpbWVyIGZyb20gJy4uLy4uL2F4b24vanMvYW5pbWF0aW9uRnJhbWVUaW1lci5qcyc7XHJcbmltcG9ydCBEZXJpdmVkUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9EZXJpdmVkUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgTWFwcGVkUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9NYXBwZWRQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUaW55UHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9UaW55UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBEaW1lbnNpb24yIGZyb20gJy4uLy4uL2RvdC9qcy9EaW1lbnNpb24yLmpzJztcclxuaW1wb3J0IFV0aWxzIGZyb20gJy4uLy4uL2RvdC9qcy9VdGlscy5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IE1lYXN1cmluZ1RhcGVOb2RlIGZyb20gJy4uLy4uL3NjZW5lcnktcGhldC9qcy9NZWFzdXJpbmdUYXBlTm9kZS5qcyc7XHJcbmltcG9ydCBQaGV0Rm9udCBmcm9tICcuLi8uLi9zY2VuZXJ5LXBoZXQvanMvUGhldEZvbnQuanMnO1xyXG5pbXBvcnQgeyBDYW52YXNOb2RlLCBDaXJjbGUsIENvbG9yLCBEaXNwbGF5LCBET00sIERyYWdMaXN0ZW5lciwgZXh0ZW5kc0hlaWdodFNpemFibGUsIGV4dGVuZHNXaWR0aFNpemFibGUsIEZpcmVMaXN0ZW5lciwgRmxvd0JveCwgRm9udCwgR3JhZGllbnRTdG9wLCBHcmlkQm94LCBIQm94LCBIU2VwYXJhdG9yLCBJbWFnZSwgTGF5b3V0Tm9kZSwgTGluZSwgTGluZWFyR3JhZGllbnQsIE5vZGUsIE5vZGVPcHRpb25zLCBOb2RlUGF0dGVybiwgUGFpbnQsIFBhdGgsIFBhdHRlcm4sIFBET01JbnN0YW5jZSwgUHJlc3NMaXN0ZW5lciwgUmFkaWFsR3JhZGllbnQsIFJlY3RhbmdsZSwgUmljaFRleHQsIFJpY2hUZXh0T3B0aW9ucywgU2NlbmVyeUV2ZW50LCBTcGFjZXIsIFRDb2xvciwgVGV4dCwgVGV4dE9wdGlvbnMsIFRQYWludCwgVHJhaWwsIFZCb3gsIFdlYkdMTm9kZSB9IGZyb20gJy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBQYW5lbCBmcm9tICcuLi8uLi9zdW4vanMvUGFuZWwuanMnO1xyXG5pbXBvcnQgQXF1YVJhZGlvQnV0dG9uR3JvdXAgZnJvbSAnLi4vLi4vc3VuL2pzL0FxdWFSYWRpb0J1dHRvbkdyb3VwLmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuaW1wb3J0IGpvaXN0IGZyb20gJy4vam9pc3QuanMnO1xyXG5pbXBvcnQgU2ltIGZyb20gJy4vU2ltLmpzJztcclxuaW1wb3J0IFNpbURpc3BsYXkgZnJvbSAnLi9TaW1EaXNwbGF5LmpzJztcclxuaW1wb3J0IEJvb2xlYW5Qcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL0Jvb2xlYW5Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBDaGVja2JveCwgeyBDaGVja2JveE9wdGlvbnMgfSBmcm9tICcuLi8uLi9zdW4vanMvQ2hlY2tib3guanMnO1xyXG5pbXBvcnQgU2NyZWVuVmlldyBmcm9tICcuL1NjcmVlblZpZXcuanMnO1xyXG5pbXBvcnQgVFByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvVFByb3BlcnR5LmpzJztcclxuaW1wb3J0IGluaGVyaXRhbmNlIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9pbmhlcml0YW5jZS5qcyc7XHJcbmltcG9ydCBQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IE1hdHJpeDMgZnJvbSAnLi4vLi4vZG90L2pzL01hdHJpeDMuanMnO1xyXG5pbXBvcnQgRW51bWVyYXRpb25WYWx1ZSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvRW51bWVyYXRpb25WYWx1ZS5qcyc7XHJcbmltcG9ydCBFbnVtZXJhdGlvbiBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvRW51bWVyYXRpb24uanMnO1xyXG5pbXBvcnQgRW51bWVyYXRpb25Qcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL0VudW1lcmF0aW9uUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgbWVyZ2UgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL21lcmdlLmpzJztcclxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tICcuLi8uLi9raXRlL2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgUmVjdGFuZ3VsYXJQdXNoQnV0dG9uIGZyb20gJy4uLy4uL3N1bi9qcy9idXR0b25zL1JlY3Rhbmd1bGFyUHVzaEJ1dHRvbi5qcyc7XHJcbmltcG9ydCBFeHBhbmRDb2xsYXBzZUJ1dHRvbiBmcm9tICcuLi8uLi9zdW4vanMvRXhwYW5kQ29sbGFwc2VCdXR0b24uanMnO1xyXG5pbXBvcnQgeyBkZWZhdWx0IGFzIGNyZWF0ZU9ic2VydmFibGVBcnJheSwgT2JzZXJ2YWJsZUFycmF5IH0gZnJvbSAnLi4vLi4vYXhvbi9qcy9jcmVhdGVPYnNlcnZhYmxlQXJyYXkuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgTXVsdGlsaW5rIGZyb20gJy4uLy4uL2F4b24vanMvTXVsdGlsaW5rLmpzJztcclxuaW1wb3J0IFRSZWFkT25seVByb3BlcnR5LCB7IGlzVFJlYWRPbmx5UHJvcGVydHkgfSBmcm9tICcuLi8uLi9heG9uL2pzL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IEludGVudGlvbmFsQW55IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9JbnRlbnRpb25hbEFueS5qcyc7XHJcblxyXG5jb25zdCByb3VuZCA9ICggbjogbnVtYmVyLCBwbGFjZXMgPSAyICkgPT4gVXRpbHMudG9GaXhlZCggbiwgcGxhY2VzICk7XHJcblxyXG5jbGFzcyBQb2ludGVyQXJlYVR5cGUgZXh0ZW5kcyBFbnVtZXJhdGlvblZhbHVlIHtcclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IE1PVVNFID0gbmV3IFBvaW50ZXJBcmVhVHlwZSgpO1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVE9VQ0ggPSBuZXcgUG9pbnRlckFyZWFUeXBlKCk7XHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBOT05FID0gbmV3IFBvaW50ZXJBcmVhVHlwZSgpO1xyXG5cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IGVudW1lcmF0aW9uID0gbmV3IEVudW1lcmF0aW9uKCBQb2ludGVyQXJlYVR5cGUgKTtcclxufVxyXG5cclxudHlwZSBIZWxwZXJDb21wYXRpYmxlTm9kZSA9IHtcclxuICBnZXRIZWxwZXJOb2RlKCk6IE5vZGU7XHJcbn0gJiBOb2RlO1xyXG5jb25zdCBoYXNIZWxwZXJOb2RlID0gKCBub2RlOiBOb2RlICk6IG5vZGUgaXMgSGVscGVyQ29tcGF0aWJsZU5vZGUgPT4ge1xyXG4gIHJldHVybiAhISggbm9kZSBhcyBJbnRlbnRpb25hbEFueSApLmdldEhlbHBlck5vZGU7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIZWxwZXIge1xyXG4gIHByaXZhdGUgc2ltOiBTaW07XHJcbiAgcHJpdmF0ZSBzaW1EaXNwbGF5OiBEaXNwbGF5O1xyXG4gIHByaXZhdGUgaGVscGVyRGlzcGxheT86IERpc3BsYXk7XHJcblxyXG4gIC8vIFdoZXRoZXIgd2Ugc2hvdWxkIHVzZSB0aGUgaW5wdXQgc3lzdGVtIGZvciBwaWNraW5nLCBvciBpZiB3ZSBzaG91bGQgaWdub3JlIGl0IChhbmQgdGhlIGZsYWdzKSBmb3Igd2hhdCBpcyB2aXN1YWxcclxuICBwdWJsaWMgaW5wdXRCYXNlZFBpY2tpbmdQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8vIFdoZXRoZXIgd2Ugc2hvdWxkIHJldHVybiB0aGUgbGVhZi1tb3N0IFRyYWlsIChpbnN0ZWFkIG9mIGZpbmRpbmcgdGhlIG9uZSB3aXRoIGlucHV0IGxpc3RlbmVycylcclxuICBwdWJsaWMgdXNlTGVhZk5vZGVQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIHB1YmxpYyBwb2ludGVyQXJlYVR5cGVQcm9wZXJ0eTogUHJvcGVydHk8UG9pbnRlckFyZWFUeXBlPjtcclxuXHJcbiAgLy8gV2hldGhlciB0aGUgaGVscGVyIGlzIHZpc2libGUgKGFjdGl2ZSkgb3Igbm90XHJcbiAgcHVibGljIGFjdGl2ZVByb3BlcnR5OiBUUHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIHB1YmxpYyB2aXN1YWxUcmVlVmlzaWJsZVByb3BlcnR5OiBQcm9wZXJ0eTxib29sZWFuPjtcclxuICBwdWJsaWMgcGRvbVRyZWVWaXNpYmxlUHJvcGVydHk6IFByb3BlcnR5PGJvb2xlYW4+O1xyXG4gIHB1YmxpYyB1bmRlclBvaW50ZXJWaXNpYmxlUHJvcGVydHk6IFByb3BlcnR5PGJvb2xlYW4+O1xyXG4gIHB1YmxpYyBvcHRpb25zVmlzaWJsZVByb3BlcnR5OiBQcm9wZXJ0eTxib29sZWFuPjtcclxuICBwdWJsaWMgcHJldmlld1Zpc2libGVQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcbiAgcHVibGljIHNlbGVjdGVkTm9kZUNvbnRlbnRWaXNpYmxlUHJvcGVydHk6IFByb3BlcnR5PGJvb2xlYW4+O1xyXG4gIHB1YmxpYyBzZWxlY3RlZFRyYWlsQ29udGVudFZpc2libGVQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcbiAgcHVibGljIGhpZ2hsaWdodFZpc2libGVQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcbiAgcHVibGljIGJvdW5kc1Zpc2libGVQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcbiAgcHVibGljIHNlbGZCb3VuZHNWaXNpYmxlUHJvcGVydHk6IFByb3BlcnR5PGJvb2xlYW4+O1xyXG4gIHB1YmxpYyBnZXRIZWxwZXJOb2RlVmlzaWJsZVByb3BlcnR5OiBQcm9wZXJ0eTxib29sZWFuPjtcclxuXHJcbiAgLy8gV2hldGhlciB0aGUgZW50aXJlIGhlbHBlciBpcyB2aXNpYmxlIChvciBjb2xsYXBzZWQpXHJcbiAgcHVibGljIGhlbHBlclZpc2libGVQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8vIFdoZXJlIHRoZSBjdXJyZW50IHBvaW50ZXIgaXNcclxuICBwdWJsaWMgcG9pbnRlclBvc2l0aW9uUHJvcGVydHk6IFRQcm9wZXJ0eTxWZWN0b3IyPjtcclxuXHJcbiAgLy8gV2hldGhlciB0aGUgcG9pbnRlciBpcyBvdmVyIHRoZSBVSSBpbnRlcmZhY2VcclxuICBwdWJsaWMgb3ZlckludGVyZmFjZVByb3BlcnR5OiBQcm9wZXJ0eTxib29sZWFuPjtcclxuXHJcbiAgLy8gSWYgdGhlIHVzZXIgaGFzIGNsaWNrZWQgb24gYSBUcmFpbCBhbmQgc2VsZWN0ZWQgaXRcclxuICBwdWJsaWMgc2VsZWN0ZWRUcmFpbFByb3BlcnR5OiBUUHJvcGVydHk8VHJhaWwgfCBudWxsPjtcclxuXHJcbiAgLy8gV2hhdCBUcmFpbCB0aGUgdXNlciBpcyBvdmVyIGluIHRoZSB0cmVlIFVJXHJcbiAgcHVibGljIHRyZWVIb3ZlclRyYWlsUHJvcGVydHk6IFRQcm9wZXJ0eTxUcmFpbCB8IG51bGw+O1xyXG5cclxuICAvLyBXaGF0IFRyYWlsIHRoZSBwb2ludGVyIGlzIG92ZXIgcmlnaHQgbm93XHJcbiAgcHVibGljIHBvaW50ZXJUcmFpbFByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxUcmFpbCB8IG51bGw+O1xyXG5cclxuICAvLyBXaGF0IFRyYWlsIHRvIHNob3cgYXMgYSBwcmV2aWV3IChhbmQgdG8gaGlnaGxpZ2h0KSAtIHNlbGVjdGlvbiBvdmVycmlkZXMgd2hhdCB0aGUgcG9pbnRlciBpcyBvdmVyXHJcbiAgcHVibGljIHByZXZpZXdUcmFpbFByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxUcmFpbCB8IG51bGw+O1xyXG5cclxuICAvLyBBIGhlbHBlci1kaXNwbGF5ZWQgTm9kZSBjcmVhdGVkIHRvIGhlbHAgd2l0aCBkZWJ1Z2dpbmcgdmFyaW91cyB0eXBlc1xyXG4gIHB1YmxpYyBoZWxwZXJOb2RlUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PE5vZGUgfCBudWxsPjtcclxuXHJcbiAgLy8gVGhlIGdsb2JhbCBzaGFwZSBvZiB3aGF0IGlzIHNlbGVjdGVkXHJcbiAgcHVibGljIHByZXZpZXdTaGFwZVByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxTaGFwZSB8IG51bGw+O1xyXG5cclxuICBwdWJsaWMgc2NyZWVuVmlld1Byb3BlcnR5OiBUUHJvcGVydHk8U2NyZWVuVmlldyB8IG51bGw+O1xyXG5cclxuICAvLyBJbWFnZURhdGEgZnJvbSB0aGUgc2ltXHJcbiAgcHVibGljIGltYWdlRGF0YVByb3BlcnR5OiBUUHJvcGVydHk8SW1hZ2VEYXRhIHwgbnVsbD47XHJcblxyXG4gIC8vIFRoZSBwaXhlbCBjb2xvciB1bmRlciB0aGUgcG9pbnRlclxyXG4gIHB1YmxpYyBjb2xvclByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxDb2xvcj47XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3Rvciggc2ltOiBTaW0sIHNpbURpc3BsYXk6IFNpbURpc3BsYXkgKSB7XHJcblxyXG4gICAgLy8gTk9URTogRG9uJ3QgcGF1c2UgdGhlIHNpbSwgZG9uJ3QgdXNlIGZvcmVpZ24gb2JqZWN0IHJhc3Rlcml6YXRpb24gKGRvIHRoZSBzbWFydGVyIGluc3RhbnQgYXBwcm9hY2gpXHJcbiAgICAvLyBOT1RFOiBJbmZvcm0gYWJvdXQgcHJlc2VydmVEcmF3aW5nQnVmZmVyIHF1ZXJ5IHBhcmFtZXRlclxyXG4gICAgLy8gTk9URTogQWN0dWFsbHkgZ3JhYi9yZXJlbmRlciB0aGluZ3MgZnJvbSBXZWJHTC9DYW52YXMsIHNvIHRoaXMgd29ya3MgbmljZWx5IGFuZCBhdCBhIGhpZ2hlciByZXNvbHV0aW9uXHJcbiAgICAvLyBOT1RFOiBTY2VuZXJ5IGRyYXdhYmxlIHRyZWVcclxuXHJcbiAgICB0aGlzLnNpbSA9IHNpbTtcclxuICAgIHRoaXMuc2ltRGlzcGxheSA9IHNpbURpc3BsYXk7XHJcbiAgICB0aGlzLmFjdGl2ZVByb3BlcnR5ID0gbmV3IFRpbnlQcm9wZXJ0eSggZmFsc2UgKTtcclxuICAgIHRoaXMudmlzdWFsVHJlZVZpc2libGVQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIGZhbHNlLCB7XHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLk9QVF9PVVRcclxuICAgIH0gKTtcclxuICAgIHRoaXMucGRvbVRyZWVWaXNpYmxlUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCBmYWxzZSwge1xyXG4gICAgICB0YW5kZW06IFRhbmRlbS5PUFRfT1VUXHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLnVuZGVyUG9pbnRlclZpc2libGVQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIHRydWUsIHtcclxuICAgICAgdGFuZGVtOiBUYW5kZW0uT1BUX09VVFxyXG4gICAgfSApO1xyXG4gICAgdGhpcy5vcHRpb25zVmlzaWJsZVByb3BlcnR5ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggdHJ1ZSwge1xyXG4gICAgICB0YW5kZW06IFRhbmRlbS5PUFRfT1VUXHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLnByZXZpZXdWaXNpYmxlUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCBmYWxzZSwge1xyXG4gICAgICB0YW5kZW06IFRhbmRlbS5PUFRfT1VUXHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLnNlbGVjdGVkTm9kZUNvbnRlbnRWaXNpYmxlUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCB0cnVlLCB7XHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLk9QVF9PVVRcclxuICAgIH0gKTtcclxuICAgIHRoaXMuc2VsZWN0ZWRUcmFpbENvbnRlbnRWaXNpYmxlUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCB0cnVlLCB7XHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLk9QVF9PVVRcclxuICAgIH0gKTtcclxuICAgIHRoaXMuaGlnaGxpZ2h0VmlzaWJsZVByb3BlcnR5ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggdHJ1ZSwge1xyXG4gICAgICB0YW5kZW06IFRhbmRlbS5PUFRfT1VUXHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLmJvdW5kc1Zpc2libGVQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIHRydWUsIHtcclxuICAgICAgdGFuZGVtOiBUYW5kZW0uT1BUX09VVFxyXG4gICAgfSApO1xyXG4gICAgdGhpcy5zZWxmQm91bmRzVmlzaWJsZVByb3BlcnR5ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggZmFsc2UsIHtcclxuICAgICAgdGFuZGVtOiBUYW5kZW0uT1BUX09VVFxyXG4gICAgfSApO1xyXG4gICAgdGhpcy5nZXRIZWxwZXJOb2RlVmlzaWJsZVByb3BlcnR5ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggdHJ1ZSwge1xyXG4gICAgICB0YW5kZW06IFRhbmRlbS5PUFRfT1VUXHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLmhlbHBlclZpc2libGVQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIHRydWUsIHtcclxuICAgICAgdGFuZGVtOiBUYW5kZW0uT1BUX09VVFxyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuaW5wdXRCYXNlZFBpY2tpbmdQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIHRydWUsIHsgdGFuZGVtOiBUYW5kZW0uT1BUX09VVCB9ICk7XHJcbiAgICB0aGlzLnVzZUxlYWZOb2RlUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCBmYWxzZSwgeyB0YW5kZW06IFRhbmRlbS5PUFRfT1VUIH0gKTtcclxuICAgIHRoaXMucG9pbnRlckFyZWFUeXBlUHJvcGVydHkgPSBuZXcgRW51bWVyYXRpb25Qcm9wZXJ0eSggUG9pbnRlckFyZWFUeXBlLk1PVVNFLCB7IHRhbmRlbTogVGFuZGVtLk9QVF9PVVQgfSApO1xyXG5cclxuICAgIHRoaXMucG9pbnRlclBvc2l0aW9uUHJvcGVydHkgPSBuZXcgVGlueVByb3BlcnR5KCBWZWN0b3IyLlpFUk8gKTtcclxuICAgIHRoaXMub3ZlckludGVyZmFjZVByb3BlcnR5ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggZmFsc2UsIHsgdGFuZGVtOiBUYW5kZW0uT1BUX09VVCB9ICk7XHJcblxyXG4gICAgdGhpcy5zZWxlY3RlZFRyYWlsUHJvcGVydHkgPSBuZXcgVGlueVByb3BlcnR5PFRyYWlsIHwgbnVsbD4oIG51bGwgKTtcclxuICAgIHRoaXMudHJlZUhvdmVyVHJhaWxQcm9wZXJ0eSA9IG5ldyBUaW55UHJvcGVydHk8VHJhaWwgfCBudWxsPiggbnVsbCApO1xyXG4gICAgdGhpcy5wb2ludGVyVHJhaWxQcm9wZXJ0eSA9IG5ldyBEZXJpdmVkUHJvcGVydHkoIFsgdGhpcy5wb2ludGVyUG9zaXRpb25Qcm9wZXJ0eSwgdGhpcy5vdmVySW50ZXJmYWNlUHJvcGVydHksIHRoaXMucG9pbnRlckFyZWFUeXBlUHJvcGVydHksIHRoaXMuaW5wdXRCYXNlZFBpY2tpbmdQcm9wZXJ0eSBdLCAoIHBvaW50LCBvdmVySW50ZXJmYWNlLCBwb2ludGVyQXJlYVR5cGUsIGlucHV0QmFzZWRQaWNraW5nICkgPT4ge1xyXG4gICAgICAvLyBXZSdyZSBub3Qgb3ZlciBzb21ldGhpbmcgd2hpbGUgd2UncmUgb3ZlciBhbiBpbnRlcmZhY2VcclxuICAgICAgaWYgKCBvdmVySW50ZXJmYWNlICkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoICFpbnB1dEJhc2VkUGlja2luZyApIHtcclxuICAgICAgICByZXR1cm4gdmlzdWFsSGl0VGVzdCggc2ltRGlzcGxheS5yb290Tm9kZSwgcG9pbnQgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgbGV0IHRyYWlsID0gc2ltRGlzcGxheS5yb290Tm9kZS5oaXRUZXN0KFxyXG4gICAgICAgIHBvaW50LFxyXG4gICAgICAgIHBvaW50ZXJBcmVhVHlwZSA9PT0gUG9pbnRlckFyZWFUeXBlLk1PVVNFLFxyXG4gICAgICAgIHBvaW50ZXJBcmVhVHlwZSA9PT0gUG9pbnRlckFyZWFUeXBlLlRPVUNIXHJcbiAgICAgICk7XHJcblxyXG4gICAgICBpZiAoIHRyYWlsICYmICF0aGlzLnVzZUxlYWZOb2RlUHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgICAgd2hpbGUgKCB0cmFpbC5sZW5ndGggPiAwICYmIHRyYWlsLmxhc3ROb2RlKCkuaW5wdXRMaXN0ZW5lcnMubGVuZ3RoID09PSAwICkge1xyXG4gICAgICAgICAgdHJhaWwucmVtb3ZlRGVzY2VuZGFudCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIHRyYWlsLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgICAgIHRyYWlsID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAvLyBSZXBzZWN0IFRhcmdldE5vZGUgdG8gYmUgaGVscGZ1bFxyXG4gICAgICAgICAgY29uc3QgbGlzdGVuZXJzID0gdHJhaWwubGFzdE5vZGUoKS5pbnB1dExpc3RlbmVycztcclxuICAgICAgICAgIGNvbnN0IGZpcnN0TGlzdGVuZXIgPSBsaXN0ZW5lcnNbIDAgXTtcclxuICAgICAgICAgIGlmICggZmlyc3RMaXN0ZW5lciBpbnN0YW5jZW9mIFByZXNzTGlzdGVuZXIgJiYgZmlyc3RMaXN0ZW5lci50YXJnZXROb2RlICYmIGZpcnN0TGlzdGVuZXIudGFyZ2V0Tm9kZSAhPT0gdHJhaWwubGFzdE5vZGUoKSAmJiB0cmFpbC5jb250YWluc05vZGUoIGZpcnN0TGlzdGVuZXIudGFyZ2V0Tm9kZSApICkge1xyXG4gICAgICAgICAgICB0cmFpbCA9IHRyYWlsLnN1YnRyYWlsVG8oIGZpcnN0TGlzdGVuZXIudGFyZ2V0Tm9kZSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRyYWlsO1xyXG4gICAgfSwge1xyXG4gICAgICB0YW5kZW06IFRhbmRlbS5PUFRfT1VULFxyXG4gICAgICB2YWx1ZUNvbXBhcmlzb25TdHJhdGVneTogJ2VxdWFsc0Z1bmN0aW9uJyxcclxuICAgICAgc3RyaWN0QXhvbkRlcGVuZGVuY2llczogZmFsc2UgLy9UT0RPIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9qb2lzdC9pc3N1ZXMvOTQ4XHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLnByZXZpZXdUcmFpbFByb3BlcnR5ID0gbmV3IERlcml2ZWRQcm9wZXJ0eSggWyB0aGlzLnNlbGVjdGVkVHJhaWxQcm9wZXJ0eSwgdGhpcy50cmVlSG92ZXJUcmFpbFByb3BlcnR5LCB0aGlzLnBvaW50ZXJUcmFpbFByb3BlcnR5IF0sICggc2VsZWN0ZWQsIHRyZWVIb3ZlciwgYWN0aXZlICkgPT4ge1xyXG4gICAgICByZXR1cm4gc2VsZWN0ZWQgPyBzZWxlY3RlZCA6ICggdHJlZUhvdmVyID8gdHJlZUhvdmVyIDogYWN0aXZlICk7XHJcbiAgICB9LCB7XHJcbiAgICAgIHN0cmljdEF4b25EZXBlbmRlbmNpZXM6IGZhbHNlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5wcmV2aWV3U2hhcGVQcm9wZXJ0eSA9IG5ldyBEZXJpdmVkUHJvcGVydHkoIFsgdGhpcy5wcmV2aWV3VHJhaWxQcm9wZXJ0eSwgdGhpcy5pbnB1dEJhc2VkUGlja2luZ1Byb3BlcnR5LCB0aGlzLnBvaW50ZXJBcmVhVHlwZVByb3BlcnR5IF0sICggcHJldmlld1RyYWlsLCBpbnB1dEJhc2VkUGlja2luZywgcG9pbnRlckFyZWFUeXBlICkgPT4ge1xyXG4gICAgICBpZiAoIHByZXZpZXdUcmFpbCApIHtcclxuICAgICAgICBpZiAoIGlucHV0QmFzZWRQaWNraW5nICkge1xyXG4gICAgICAgICAgcmV0dXJuIGdldFNoYXBlKCBwcmV2aWV3VHJhaWwsIHBvaW50ZXJBcmVhVHlwZSA9PT0gUG9pbnRlckFyZWFUeXBlLk1PVVNFLCBwb2ludGVyQXJlYVR5cGUgPT09IFBvaW50ZXJBcmVhVHlwZS5UT1VDSCApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiBnZXRTaGFwZSggcHJldmlld1RyYWlsLCBmYWxzZSwgZmFsc2UgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgIH1cclxuICAgIH0sIHtcclxuICAgICAgc3RyaWN0QXhvbkRlcGVuZGVuY2llczogZmFsc2VcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLmhlbHBlck5vZGVQcm9wZXJ0eSA9IG5ldyBEZXJpdmVkUHJvcGVydHkoIFsgdGhpcy5zZWxlY3RlZFRyYWlsUHJvcGVydHkgXSwgdHJhaWwgPT4ge1xyXG4gICAgICBpZiAoIHRyYWlsICkge1xyXG4gICAgICAgIGNvbnN0IG5vZGUgPSB0cmFpbC5sYXN0Tm9kZSgpO1xyXG4gICAgICAgIGlmICggaGFzSGVscGVyTm9kZSggbm9kZSApICkge1xyXG4gICAgICAgICAgcmV0dXJuIG5vZGUuZ2V0SGVscGVyTm9kZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfSwge1xyXG4gICAgICBzdHJpY3RBeG9uRGVwZW5kZW5jaWVzOiBmYWxzZVxyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuc2NyZWVuVmlld1Byb3BlcnR5ID0gbmV3IFRpbnlQcm9wZXJ0eTxTY3JlZW5WaWV3IHwgbnVsbD4oIG51bGwgKTtcclxuXHJcbiAgICB0aGlzLmltYWdlRGF0YVByb3BlcnR5ID0gbmV3IFRpbnlQcm9wZXJ0eTxJbWFnZURhdGEgfCBudWxsPiggbnVsbCApO1xyXG5cclxuICAgIHRoaXMuY29sb3JQcm9wZXJ0eSA9IG5ldyBEZXJpdmVkUHJvcGVydHkoIFsgdGhpcy5wb2ludGVyUG9zaXRpb25Qcm9wZXJ0eSwgdGhpcy5pbWFnZURhdGFQcm9wZXJ0eSBdLCAoIHBvc2l0aW9uLCBpbWFnZURhdGEgKSA9PiB7XHJcbiAgICAgIGlmICggIWltYWdlRGF0YSApIHtcclxuICAgICAgICByZXR1cm4gQ29sb3IuVFJBTlNQQVJFTlQ7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgeCA9IE1hdGguZmxvb3IoIHBvc2l0aW9uLnggLyB0aGlzLnNpbURpc3BsYXkud2lkdGggKiBpbWFnZURhdGEud2lkdGggKTtcclxuICAgICAgY29uc3QgeSA9IE1hdGguZmxvb3IoIHBvc2l0aW9uLnkgLyB0aGlzLnNpbURpc3BsYXkuaGVpZ2h0ICogaW1hZ2VEYXRhLmhlaWdodCApO1xyXG5cclxuICAgICAgY29uc3QgaW5kZXggPSA0ICogKCB4ICsgaW1hZ2VEYXRhLndpZHRoICogeSApO1xyXG5cclxuICAgICAgaWYgKCB4IDwgMCB8fCB5IDwgMCB8fCB4ID4gaW1hZ2VEYXRhLndpZHRoIHx8IHkgPiBpbWFnZURhdGEuaGVpZ2h0ICkge1xyXG4gICAgICAgIHJldHVybiBDb2xvci5UUkFOU1BBUkVOVDtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG5ldyBDb2xvcihcclxuICAgICAgICBpbWFnZURhdGEuZGF0YVsgaW5kZXggXSxcclxuICAgICAgICBpbWFnZURhdGEuZGF0YVsgaW5kZXggKyAxIF0sXHJcbiAgICAgICAgaW1hZ2VEYXRhLmRhdGFbIGluZGV4ICsgMiBdLFxyXG4gICAgICAgIGltYWdlRGF0YS5kYXRhWyBpbmRleCArIDMgXSAvIDI1NVxyXG4gICAgICApO1xyXG4gICAgfSwge1xyXG4gICAgICB0YW5kZW06IFRhbmRlbS5PUFRfT1VULFxyXG4gICAgICBzdHJpY3RBeG9uRGVwZW5kZW5jaWVzOiBmYWxzZVxyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IGZ1enpQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuZnV6eiwge1xyXG4gICAgICB0YW5kZW06IFRhbmRlbS5PUFRfT1VUXHJcbiAgICB9ICk7XHJcbiAgICBmdXp6UHJvcGVydHkubGF6eUxpbmsoIGZ1enogPT4ge1xyXG4gICAgICBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmZ1enogPSBmdXp6O1xyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IG1lYXN1cmluZ1RhcGVWaXNpYmxlUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCBmYWxzZSwge1xyXG4gICAgICB0YW5kZW06IFRhbmRlbS5PUFRfT1VUXHJcbiAgICB9ICk7XHJcbiAgICBjb25zdCBtZWFzdXJpbmdUYXBlVW5pdHNQcm9wZXJ0eSA9IG5ldyBUaW55UHJvcGVydHk8eyBuYW1lOiBzdHJpbmc7IG11bHRpcGxpZXI6IG51bWJlciB9PiggeyBuYW1lOiAndmlldyB1bml0cycsIG11bHRpcGxpZXI6IDAgfSApO1xyXG5cclxuICAgIGNvbnN0IGxheW91dEJvdW5kc1Byb3BlcnR5ID0gbmV3IFRpbnlQcm9wZXJ0eSggQm91bmRzMi5OT1RISU5HICk7XHJcblxyXG4gICAgY29uc3QgaGVscGVyUm9vdCA9IG5ldyBOb2RlKCB7XHJcbiAgICAgIHJlbmRlcmVyOiAnc3ZnJ1xyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IHBvc2l0aW9uU3RyaW5nUHJvcGVydHkgPSBuZXcgTWFwcGVkUHJvcGVydHkoIHRoaXMucG9pbnRlclBvc2l0aW9uUHJvcGVydHksIHtcclxuICAgICAgdGFuZGVtOiBUYW5kZW0uT1BUX09VVCxcclxuICAgICAgYmlkaXJlY3Rpb25hbDogdHJ1ZSxcclxuICAgICAgbWFwOiBwb3NpdGlvbiA9PiB7XHJcbiAgICAgICAgY29uc3QgdmlldyA9IHRoaXMuc2NyZWVuVmlld1Byb3BlcnR5LnZhbHVlO1xyXG4gICAgICAgIGlmICggdmlldyApIHtcclxuICAgICAgICAgIGNvbnN0IHZpZXdQb3NpdGlvbiA9IHZpZXcuZ2xvYmFsVG9Mb2NhbFBvaW50KCBwb3NpdGlvbiApO1xyXG4gICAgICAgICAgcmV0dXJuIGBnbG9iYWw6IHg6ICR7cm91bmQoIHBvc2l0aW9uLnggKX0sIHk6ICR7cm91bmQoIHBvc2l0aW9uLnkgKX08YnI+dmlldzogeDogJHtyb3VuZCggdmlld1Bvc2l0aW9uLnggKX0sIHk6ICR7cm91bmQoIHZpZXdQb3NpdGlvbi55ICl9YDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gJy0nO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gICAgY29uc3QgcG9zaXRpb25UZXh0ID0gbmV3IFJpY2hUZXh0KCBwb3NpdGlvblN0cmluZ1Byb3BlcnR5LCB7XHJcbiAgICAgIGZvbnQ6IG5ldyBQaGV0Rm9udCggMTIgKVxyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IGNvbG9yVGV4dE1hcCA9ICggY29sb3I6IENvbG9yICkgPT4ge1xyXG4gICAgICByZXR1cm4gYCR7Y29sb3IudG9IZXhTdHJpbmcoKX0gJHtjb2xvci50b0NTUygpfWA7XHJcbiAgICB9O1xyXG4gICAgY29uc3QgY29sb3JTdHJpbmdQcm9wZXJ0eSA9IG5ldyBNYXBwZWRQcm9wZXJ0eSggdGhpcy5jb2xvclByb3BlcnR5LCB7XHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLk9QVF9PVVQsXHJcbiAgICAgIGJpZGlyZWN0aW9uYWw6IHRydWUsXHJcbiAgICAgIG1hcDogY29sb3JUZXh0TWFwXHJcbiAgICB9ICk7XHJcbiAgICBjb25zdCBjb2xvclRleHQgPSBuZXcgUmljaFRleHQoIGNvbG9yU3RyaW5nUHJvcGVydHksIHtcclxuICAgICAgZm9udDogbmV3IFBoZXRGb250KCAxMiApXHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLmNvbG9yUHJvcGVydHkubGluayggY29sb3IgPT4ge1xyXG4gICAgICBjb2xvclRleHQuZmlsbCA9IENvbG9yLmdldEx1bWluYW5jZSggY29sb3IgKSA+IDEyOCA/IENvbG9yLkJMQUNLIDogQ29sb3IuV0hJVEU7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3QgYm91bmRzQ29sb3IgPSBuZXcgQ29sb3IoICcjODA0MDAwJyApO1xyXG4gICAgY29uc3Qgc2VsZkJvdW5kc0NvbG9yID0gbmV3IENvbG9yKCAnIzIwODAyMCcgKTtcclxuICAgIGNvbnN0IG5vbklucHV0QmFzZWRDb2xvciA9IG5ldyBDb2xvciggMjU1LCAxMDAsIDAgKTtcclxuICAgIGNvbnN0IG1vdXNlQ29sb3IgPSBuZXcgQ29sb3IoIDAsIDAsIDI1NSApO1xyXG4gICAgY29uc3QgdG91Y2hDb2xvciA9IG5ldyBDb2xvciggMjU1LCAwLCAwICk7XHJcbiAgICBjb25zdCBpbnB1dEJhc2VkQ29sb3IgPSBuZXcgQ29sb3IoIDIwMCwgMCwgMjAwICk7XHJcblxyXG4gICAgY29uc3QgaGlnaGxpZ2h0QmFzZUNvbG9yUHJvcGVydHkgPSBuZXcgRGVyaXZlZFByb3BlcnR5KCBbIHRoaXMuaW5wdXRCYXNlZFBpY2tpbmdQcm9wZXJ0eSwgdGhpcy5wb2ludGVyQXJlYVR5cGVQcm9wZXJ0eSBdLCAoIGlucHV0QmFzZWRQaWNraW5nLCBwb2ludGVyQXJlYVR5cGUgKSA9PiB7XHJcbiAgICAgIGlmICggaW5wdXRCYXNlZFBpY2tpbmcgKSB7XHJcbiAgICAgICAgaWYgKCBwb2ludGVyQXJlYVR5cGUgPT09IFBvaW50ZXJBcmVhVHlwZS5NT1VTRSApIHtcclxuICAgICAgICAgIHJldHVybiBtb3VzZUNvbG9yO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggcG9pbnRlckFyZWFUeXBlID09PSBQb2ludGVyQXJlYVR5cGUuVE9VQ0ggKSB7XHJcbiAgICAgICAgICByZXR1cm4gdG91Y2hDb2xvcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gaW5wdXRCYXNlZENvbG9yO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gbm9uSW5wdXRCYXNlZENvbG9yO1xyXG4gICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLk9QVF9PVVQsXHJcbiAgICAgIHN0cmljdEF4b25EZXBlbmRlbmNpZXM6IGZhbHNlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3QgY29sb3JCYWNrZ3JvdW5kID0gbmV3IFBhbmVsKCBjb2xvclRleHQsIHtcclxuICAgICAgY29ybmVyUmFkaXVzOiAwLFxyXG4gICAgICBzdHJva2U6IG51bGwsXHJcbiAgICAgIGZpbGw6IHRoaXMuY29sb3JQcm9wZXJ0eVxyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IHByZXZpZXdOb2RlID0gbmV3IE5vZGUoIHtcclxuICAgICAgdmlzaWJsZVByb3BlcnR5OiB0aGlzLnByZXZpZXdWaXNpYmxlUHJvcGVydHlcclxuICAgIH0gKTtcclxuXHJcbiAgICBjb25zdCBwcmV2aWV3QmFja2dyb3VuZCA9IG5ldyBSZWN0YW5nbGUoIDAsIDAsIDIwMCwgMjAwLCB7XHJcbiAgICAgIGZpbGw6IG5ldyBOb2RlUGF0dGVybiggbmV3IE5vZGUoIHtcclxuICAgICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgICAgbmV3IFJlY3RhbmdsZSggMCwgMCwgMTAsIDEwLCB7IGZpbGw6ICcjZGRkJyB9ICksXHJcbiAgICAgICAgICBuZXcgUmVjdGFuZ2xlKCAxMCwgMTAsIDEwLCAxMCwgeyBmaWxsOiAnI2RkZCcgfSApLFxyXG4gICAgICAgICAgbmV3IFJlY3RhbmdsZSggMCwgMTAsIDEwLCAxMCwgeyBmaWxsOiAnI2ZhZmFmYScgfSApLFxyXG4gICAgICAgICAgbmV3IFJlY3RhbmdsZSggMTAsIDAsIDEwLCAxMCwgeyBmaWxsOiAnI2ZhZmFmYScgfSApXHJcbiAgICAgICAgXVxyXG4gICAgICB9ICksIDIsIDAsIDAsIDIwLCAyMCApLFxyXG4gICAgICBzdHJva2U6ICdibGFjaycsXHJcbiAgICAgIHZpc2libGVQcm9wZXJ0eTogdGhpcy5wcmV2aWV3VmlzaWJsZVByb3BlcnR5XHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5wcmV2aWV3VHJhaWxQcm9wZXJ0eS5saW5rKCB0cmFpbCA9PiB7XHJcbiAgICAgIHByZXZpZXdOb2RlLnJlbW92ZUFsbENoaWxkcmVuKCk7XHJcbiAgICAgIGlmICggdHJhaWwgKSB7XHJcbiAgICAgICAgcHJldmlld05vZGUuYWRkQ2hpbGQoIHByZXZpZXdCYWNrZ3JvdW5kICk7XHJcbiAgICAgICAgY29uc3Qgbm9kZSA9IHRyYWlsLmxhc3ROb2RlKCk7XHJcbiAgICAgICAgaWYgKCBub2RlLmJvdW5kcy5pc1ZhbGlkKCkgKSB7XHJcbiAgICAgICAgICBjb25zdCBzY2FsZSA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvICogMC45ICogTWF0aC5taW4oIHByZXZpZXdCYWNrZ3JvdW5kLnNlbGZCb3VuZHMud2lkdGggLyBub2RlLndpZHRoLCBwcmV2aWV3QmFja2dyb3VuZC5zZWxmQm91bmRzLmhlaWdodCAvIG5vZGUuaGVpZ2h0ICk7XHJcbiAgICAgICAgICBwcmV2aWV3Tm9kZS5hZGRDaGlsZCggbmV3IE5vZGUoIHtcclxuICAgICAgICAgICAgc2NhbGU6IHNjYWxlIC8gd2luZG93LmRldmljZVBpeGVsUmF0aW8sXHJcbiAgICAgICAgICAgIGNlbnRlcjogcHJldmlld0JhY2tncm91bmQuY2VudGVyLFxyXG4gICAgICAgICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgICAgICAgIG5vZGUucmFzdGVyaXplZCgge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x1dGlvbjogc2NhbGUsXHJcbiAgICAgICAgICAgICAgICBzb3VyY2VCb3VuZHM6IG5vZGUuYm91bmRzLmRpbGF0ZWQoIG5vZGUuYm91bmRzLndpZHRoICogMC4wMSApLnJvdW5kZWRPdXQoKVxyXG4gICAgICAgICAgICAgIH0gKVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgICB9ICkgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICBjb25zdCBzZWxlY3RlZE5vZGVDb250ZW50ID0gbmV3IFZCb3goIHtcclxuICAgICAgc3BhY2luZzogMyxcclxuICAgICAgYWxpZ246ICdsZWZ0JyxcclxuICAgICAgdmlzaWJsZVByb3BlcnR5OiB0aGlzLnNlbGVjdGVkTm9kZUNvbnRlbnRWaXNpYmxlUHJvcGVydHlcclxuICAgIH0gKTtcclxuICAgIHRoaXMucHJldmlld1RyYWlsUHJvcGVydHkubGluayggdHJhaWwgPT4ge1xyXG4gICAgICBzZWxlY3RlZE5vZGVDb250ZW50LmNoaWxkcmVuID0gdHJhaWwgPyBjcmVhdGVJbmZvKCB0cmFpbCApIDogW107XHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3QgZnV6ekNoZWNrYm94ID0gbmV3IEhlbHBlckNoZWNrYm94KCBmdXp6UHJvcGVydHksICdGdXp6JyApO1xyXG4gICAgY29uc3QgbWVhc3VyaW5nVGFwZVZpc2libGVDaGVja2JveCA9IG5ldyBIZWxwZXJDaGVja2JveCggbWVhc3VyaW5nVGFwZVZpc2libGVQcm9wZXJ0eSwgJ01lYXN1cmluZyBUYXBlJyApO1xyXG4gICAgY29uc3QgdmlzdWFsVHJlZVZpc2libGVDaGVja2JveCA9IG5ldyBIZWxwZXJDaGVja2JveCggdGhpcy52aXN1YWxUcmVlVmlzaWJsZVByb3BlcnR5LCAnVmlzdWFsIFRyZWUnICk7XHJcbiAgICBjb25zdCBwZG9tVHJlZVZpc2libGVDaGVja2JveCA9IG5ldyBIZWxwZXJDaGVja2JveCggdGhpcy5wZG9tVHJlZVZpc2libGVQcm9wZXJ0eSwgJ1BET00gVHJlZScgKTtcclxuICAgIGNvbnN0IGlucHV0QmFzZWRQaWNraW5nQ2hlY2tib3ggPSBuZXcgSGVscGVyQ2hlY2tib3goIHRoaXMuaW5wdXRCYXNlZFBpY2tpbmdQcm9wZXJ0eSwgJ0lucHV0LWJhc2VkJyApO1xyXG4gICAgY29uc3QgdXNlTGVhZk5vZGVDaGVja2JveCA9IG5ldyBIZWxwZXJDaGVja2JveCggdGhpcy51c2VMZWFmTm9kZVByb3BlcnR5LCAnVXNlIExlYWYnLCB7XHJcbiAgICAgIGVuYWJsZWRQcm9wZXJ0eTogdGhpcy5pbnB1dEJhc2VkUGlja2luZ1Byb3BlcnR5XHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3QgaGlnaGxpZ2h0VmlzaWJsZUNoZWNrYm94ID0gbmV3IEhlbHBlckNoZWNrYm94KCB0aGlzLmhpZ2hsaWdodFZpc2libGVQcm9wZXJ0eSwgJ0hpZ2hsaWdodCcsIHtcclxuICAgICAgbGFiZWxPcHRpb25zOiB7XHJcbiAgICAgICAgZmlsbDogaGlnaGxpZ2h0QmFzZUNvbG9yUHJvcGVydHlcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gICAgY29uc3QgYm91bmRzVmlzaWJsZUNoZWNrYm94ID0gbmV3IEhlbHBlckNoZWNrYm94KCB0aGlzLmJvdW5kc1Zpc2libGVQcm9wZXJ0eSwgJ0JvdW5kcycsIHtcclxuICAgICAgbGFiZWxPcHRpb25zOiB7XHJcbiAgICAgICAgZmlsbDogYm91bmRzQ29sb3JcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gICAgY29uc3Qgc2VsZkJvdW5kc1Zpc2libGVDaGVja2JveCA9IG5ldyBIZWxwZXJDaGVja2JveCggdGhpcy5zZWxmQm91bmRzVmlzaWJsZVByb3BlcnR5LCAnU2VsZiBCb3VuZHMnLCB7XHJcbiAgICAgIGxhYmVsT3B0aW9uczoge1xyXG4gICAgICAgIGZpbGw6IHNlbGZCb3VuZHNDb2xvclxyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgICBjb25zdCBnZXRIZWxwZXJOb2RlVmlzaWJsZUNoZWNrYm94ID0gbmV3IEhlbHBlckNoZWNrYm94KCB0aGlzLmdldEhlbHBlck5vZGVWaXNpYmxlUHJvcGVydHksICdnZXRIZWxwZXJOb2RlKCknICk7XHJcblxyXG4gICAgY29uc3QgcG9pbnRlckFyZWFUeXBlUmFkaW9CdXR0b25Hcm91cCA9IG5ldyBBcXVhUmFkaW9CdXR0b25Hcm91cDxQb2ludGVyQXJlYVR5cGU+KCB0aGlzLnBvaW50ZXJBcmVhVHlwZVByb3BlcnR5LCBbXHJcbiAgICAgIHtcclxuICAgICAgICB2YWx1ZTogUG9pbnRlckFyZWFUeXBlLk1PVVNFLFxyXG4gICAgICAgIGNyZWF0ZU5vZGU6ICggdGFuZGVtOiBUYW5kZW0gKSA9PiBuZXcgVGV4dCggJ01vdXNlJywgeyBmb250U2l6ZTogMTIgfSApXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICB2YWx1ZTogUG9pbnRlckFyZWFUeXBlLlRPVUNILFxyXG4gICAgICAgIGNyZWF0ZU5vZGU6ICggdGFuZGVtOiBUYW5kZW0gKSA9PiBuZXcgVGV4dCggJ1RvdWNoJywgeyBmb250U2l6ZTogMTIgfSApXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICB2YWx1ZTogUG9pbnRlckFyZWFUeXBlLk5PTkUsXHJcbiAgICAgICAgY3JlYXRlTm9kZTogKCB0YW5kZW06IFRhbmRlbSApID0+IG5ldyBUZXh0KCAnTm9uZScsIHsgZm9udFNpemU6IDEyIH0gKVxyXG4gICAgICB9XHJcbiAgICBdLCB7XHJcbiAgICAgIG9yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcsXHJcbiAgICAgIGVuYWJsZWRQcm9wZXJ0eTogdGhpcy5pbnB1dEJhc2VkUGlja2luZ1Byb3BlcnR5LFxyXG4gICAgICByYWRpb0J1dHRvbk9wdGlvbnM6IHtcclxuICAgICAgICB4U3BhY2luZzogM1xyXG4gICAgICB9LFxyXG4gICAgICBzcGFjaW5nOiAxMCxcclxuICAgICAgdGFuZGVtOiBUYW5kZW0uT1BUX09VVFxyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IHNlbGVjdGVkVHJhaWxDb250ZW50ID0gbmV3IFZCb3goIHtcclxuICAgICAgYWxpZ246ICdsZWZ0JyxcclxuICAgICAgdmlzaWJsZVByb3BlcnR5OiB0aGlzLnNlbGVjdGVkVHJhaWxDb250ZW50VmlzaWJsZVByb3BlcnR5XHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5wcmV2aWV3VHJhaWxQcm9wZXJ0eS5saW5rKCAoIHRyYWlsOiBUcmFpbCB8IG51bGwgKSA9PiB7XHJcbiAgICAgIHNlbGVjdGVkVHJhaWxDb250ZW50LmNoaWxkcmVuID0gW107XHJcblxyXG4gICAgICBpZiAoIHRyYWlsICkge1xyXG5cclxuICAgICAgICB0cmFpbC5ub2Rlcy5zbGljZSgpLmZvckVhY2goICggbm9kZSwgaW5kZXggKSA9PiB7XHJcbiAgICAgICAgICBzZWxlY3RlZFRyYWlsQ29udGVudC5hZGRDaGlsZCggbmV3IFJpY2hUZXh0KCBgJHtpbmRleCA+IDAgPyB0cmFpbC5ub2Rlc1sgaW5kZXggLSAxIF0uY2hpbGRyZW4uaW5kZXhPZiggbm9kZSApIDogJy0nfSAke25vZGUuY29uc3RydWN0b3IubmFtZX1gLCB7XHJcbiAgICAgICAgICAgIGZvbnQ6IG5ldyBQaGV0Rm9udCggMTIgKSxcclxuICAgICAgICAgICAgZmlsbDogaW5kZXggPT09IHRyYWlsLm5vZGVzLmxlbmd0aCAtIDEgPyAnYmxhY2snIDogJyNiYmInLFxyXG4gICAgICAgICAgICBsYXlvdXRPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgbGVmdE1hcmdpbjogaW5kZXggKiAxMFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcclxuICAgICAgICAgICAgaW5wdXRMaXN0ZW5lcnM6IFsgbmV3IEZpcmVMaXN0ZW5lcigge1xyXG4gICAgICAgICAgICAgIGZpcmU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRUcmFpbFByb3BlcnR5LnZhbHVlID0gdHJhaWwuc3VidHJhaWxUbyggbm9kZSApO1xyXG4gICAgICAgICAgICAgICAgZm9jdXNTZWxlY3RlZCgpO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgdGFuZGVtOiBUYW5kZW0uT1BUX09VVFxyXG4gICAgICAgICAgICB9ICkgXVxyXG4gICAgICAgICAgfSApICk7XHJcbiAgICAgICAgfSApO1xyXG4gICAgICAgIHRyYWlsLmxhc3ROb2RlKCkuY2hpbGRyZW4uZm9yRWFjaCggKCBub2RlLCBpbmRleCApID0+IHtcclxuICAgICAgICAgIHNlbGVjdGVkVHJhaWxDb250ZW50LmFkZENoaWxkKCBuZXcgUmljaFRleHQoIGAke3RyYWlsLmxhc3ROb2RlKCkuY2hpbGRyZW4uaW5kZXhPZiggbm9kZSApfSAke25vZGUuY29uc3RydWN0b3IubmFtZX1gLCB7XHJcbiAgICAgICAgICAgIGZvbnQ6IG5ldyBQaGV0Rm9udCggMTIgKSxcclxuICAgICAgICAgICAgZmlsbDogJyM4OGYnLFxyXG4gICAgICAgICAgICBsYXlvdXRPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgbGVmdE1hcmdpbjogdHJhaWwubm9kZXMubGVuZ3RoICogMTBcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXHJcbiAgICAgICAgICAgIGlucHV0TGlzdGVuZXJzOiBbIG5ldyBGaXJlTGlzdGVuZXIoIHtcclxuICAgICAgICAgICAgICBmaXJlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkVHJhaWxQcm9wZXJ0eS52YWx1ZSA9IHRyYWlsLmNvcHkoKS5hZGREZXNjZW5kYW50KCBub2RlLCBpbmRleCApO1xyXG4gICAgICAgICAgICAgICAgZm9jdXNTZWxlY3RlZCgpO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgdGFuZGVtOiBUYW5kZW0uT1BUX09VVFxyXG4gICAgICAgICAgICB9ICkgXVxyXG4gICAgICAgICAgfSApICk7XHJcbiAgICAgICAgfSApO1xyXG5cclxuICAgICAgICAvLyBWaXNpYmlsaXR5IGNoZWNrXHJcbiAgICAgICAgaWYgKCAhdHJhaWwuaXNWaXNpYmxlKCkgKSB7XHJcbiAgICAgICAgICBzZWxlY3RlZFRyYWlsQ29udGVudC5hZGRDaGlsZCggbmV3IFRleHQoICdpbnZpc2libGUnLCB7IGZpbGw6ICcjNjBhJywgZm9udFNpemU6IDEyIH0gKSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCB0cmFpbC5nZXRPcGFjaXR5KCkgIT09IDEgKSB7XHJcbiAgICAgICAgICBzZWxlY3RlZFRyYWlsQ29udGVudC5hZGRDaGlsZCggbmV3IFRleHQoIGBvcGFjaXR5OiAke3RyYWlsLmdldE9wYWNpdHkoKX1gLCB7IGZpbGw6ICcjODg4JywgZm9udFNpemU6IDEyIH0gKSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgaGFzUGlja2FibGVGYWxzZUVxdWl2YWxlbnQgPSBfLnNvbWUoIHRyYWlsLm5vZGVzLCBub2RlID0+IHtcclxuICAgICAgICAgIHJldHVybiBub2RlLnBpY2thYmxlID09PSBmYWxzZSB8fCAhbm9kZS52aXNpYmxlO1xyXG4gICAgICAgIH0gKTtcclxuICAgICAgICBjb25zdCBoYXNQaWNrYWJsZVRydWVFcXVpdmFsZW50ID0gXy5zb21lKCB0cmFpbC5ub2Rlcywgbm9kZSA9PiB7XHJcbiAgICAgICAgICByZXR1cm4gbm9kZS5pbnB1dExpc3RlbmVycy5sZW5ndGggPiAwIHx8IG5vZGUucGlja2FibGUgPT09IHRydWU7XHJcbiAgICAgICAgfSApO1xyXG4gICAgICAgIGlmICggIWhhc1BpY2thYmxlRmFsc2VFcXVpdmFsZW50ICYmIGhhc1BpY2thYmxlVHJ1ZUVxdWl2YWxlbnQgKSB7XHJcbiAgICAgICAgICBzZWxlY3RlZFRyYWlsQ29udGVudC5hZGRDaGlsZCggbmV3IFRleHQoICdIaXQgVGVzdGVkJywgeyBmaWxsOiAnI2YwMCcsIGZvbnRTaXplOiAxMiB9ICkgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICggIXRyYWlsLmdldE1hdHJpeCgpLmlzSWRlbnRpdHkoKSApIHtcclxuICAgICAgICAgIC8vIFdoeSBpcyB0aGlzIHdyYXBwZXIgbm9kZSBuZWVkZWQ/XHJcbiAgICAgICAgICBzZWxlY3RlZFRyYWlsQ29udGVudC5hZGRDaGlsZCggbmV3IE5vZGUoIHsgY2hpbGRyZW46IFsgbmV3IE1hdHJpeDNOb2RlKCB0cmFpbC5nZXRNYXRyaXgoKSApIF0gfSApICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3QgdmlzdWFsVHJlZU5vZGUgPSBuZXcgVHJlZU5vZGUoIHRoaXMudmlzdWFsVHJlZVZpc2libGVQcm9wZXJ0eSwgdGhpcywgKCkgPT4gbmV3IFZpc3VhbFRyZWVOb2RlKCBuZXcgVHJhaWwoIHNpbURpc3BsYXkucm9vdE5vZGUgKSwgdGhpcyApICk7XHJcbiAgICBjb25zdCBwZG9tVHJlZU5vZGUgPSBuZXcgVHJlZU5vZGUoIHRoaXMucGRvbVRyZWVWaXNpYmxlUHJvcGVydHksIHRoaXMsICgpID0+IG5ldyBQRE9NVHJlZU5vZGUoIHNpbURpc3BsYXkuX3Jvb3RQRE9NSW5zdGFuY2UhLCB0aGlzICkgKTtcclxuXHJcbiAgICBjb25zdCBmb2N1c1NlbGVjdGVkID0gKCkgPT4ge1xyXG4gICAgICB2aXN1YWxUcmVlTm9kZS5mb2N1c1NlbGVjdGVkKCk7XHJcbiAgICAgIHBkb21UcmVlTm9kZS5mb2N1c1NlbGVjdGVkKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IGJvdW5kc1BhdGggPSBuZXcgUGF0aCggbnVsbCwge1xyXG4gICAgICB2aXNpYmxlUHJvcGVydHk6IHRoaXMuYm91bmRzVmlzaWJsZVByb3BlcnR5LFxyXG4gICAgICBzdHJva2U6IGJvdW5kc0NvbG9yLFxyXG4gICAgICBmaWxsOiBib3VuZHNDb2xvci53aXRoQWxwaGEoIDAuMSApLFxyXG4gICAgICBsaW5lRGFzaDogWyAyLCAyIF0sXHJcbiAgICAgIGxpbmVEYXNoT2Zmc2V0OiAyXHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLnByZXZpZXdUcmFpbFByb3BlcnR5LmxpbmsoIHRyYWlsID0+IHtcclxuICAgICAgaWYgKCB0cmFpbCAmJiB0cmFpbC5sYXN0Tm9kZSgpLmxvY2FsQm91bmRzLmlzVmFsaWQoKSApIHtcclxuICAgICAgICBib3VuZHNQYXRoLnNoYXBlID0gU2hhcGUuYm91bmRzKCB0cmFpbC5sYXN0Tm9kZSgpLmxvY2FsQm91bmRzICkudHJhbnNmb3JtZWQoIHRyYWlsLmdldE1hdHJpeCgpICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgYm91bmRzUGF0aC5zaGFwZSA9IG51bGw7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICBjb25zdCBzZWxmQm91bmRzUGF0aCA9IG5ldyBQYXRoKCBudWxsLCB7XHJcbiAgICAgIHZpc2libGVQcm9wZXJ0eTogdGhpcy5zZWxmQm91bmRzVmlzaWJsZVByb3BlcnR5LFxyXG4gICAgICBzdHJva2U6IHNlbGZCb3VuZHNDb2xvcixcclxuICAgICAgZmlsbDogc2VsZkJvdW5kc0NvbG9yLndpdGhBbHBoYSggMC4xICksXHJcbiAgICAgIGxpbmVEYXNoOiBbIDIsIDIgXSxcclxuICAgICAgbGluZURhc2hPZmZzZXQ6IDFcclxuICAgIH0gKTtcclxuICAgIHRoaXMucHJldmlld1RyYWlsUHJvcGVydHkubGluayggdHJhaWwgPT4ge1xyXG4gICAgICBpZiAoIHRyYWlsICYmIHRyYWlsLmxhc3ROb2RlKCkuc2VsZkJvdW5kcy5pc1ZhbGlkKCkgKSB7XHJcbiAgICAgICAgc2VsZkJvdW5kc1BhdGguc2hhcGUgPSBTaGFwZS5ib3VuZHMoIHRyYWlsLmxhc3ROb2RlKCkuc2VsZkJvdW5kcyApLnRyYW5zZm9ybWVkKCB0cmFpbC5nZXRNYXRyaXgoKSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHNlbGZCb3VuZHNQYXRoLnNoYXBlID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IGhpZ2hsaWdodEZpbGxQcm9wZXJ0eSA9IG5ldyBEZXJpdmVkUHJvcGVydHkoIFsgaGlnaGxpZ2h0QmFzZUNvbG9yUHJvcGVydHkgXSwgY29sb3IgPT4gY29sb3Iud2l0aEFscGhhKCAwLjIgKSwge1xyXG4gICAgICB0YW5kZW06IFRhbmRlbS5PUFRfT1VULFxyXG4gICAgICBzdHJpY3RBeG9uRGVwZW5kZW5jaWVzOiBmYWxzZVxyXG4gICAgfSApO1xyXG4gICAgY29uc3QgaGlnaGxpZ2h0UGF0aCA9IG5ldyBQYXRoKCBudWxsLCB7XHJcbiAgICAgIHN0cm9rZTogaGlnaGxpZ2h0QmFzZUNvbG9yUHJvcGVydHksXHJcbiAgICAgIGxpbmVEYXNoOiBbIDIsIDIgXSxcclxuICAgICAgZmlsbDogaGlnaGxpZ2h0RmlsbFByb3BlcnR5LFxyXG4gICAgICB2aXNpYmxlUHJvcGVydHk6IHRoaXMuaGlnaGxpZ2h0VmlzaWJsZVByb3BlcnR5XHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLnByZXZpZXdTaGFwZVByb3BlcnR5LmxpbmsoIHNoYXBlID0+IHtcclxuICAgICAgaGlnaGxpZ2h0UGF0aC5zaGFwZSA9IHNoYXBlO1xyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IGhlbHBlck5vZGVDb250YWluZXIgPSBuZXcgTm9kZSgge1xyXG4gICAgICB2aXNpYmxlUHJvcGVydHk6IHRoaXMuZ2V0SGVscGVyTm9kZVZpc2libGVQcm9wZXJ0eVxyXG4gICAgfSApO1xyXG4gICAgdGhpcy5zZWxlY3RlZFRyYWlsUHJvcGVydHkubGluayggdHJhaWwgPT4ge1xyXG4gICAgICBpZiAoIHRyYWlsICkge1xyXG4gICAgICAgIGhlbHBlck5vZGVDb250YWluZXIubWF0cml4ID0gdHJhaWwuZ2V0TWF0cml4KCk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICAgIHRoaXMuaGVscGVyTm9kZVByb3BlcnR5LmxpbmsoIG5vZGUgPT4ge1xyXG4gICAgICBoZWxwZXJOb2RlQ29udGFpbmVyLnJlbW92ZUFsbENoaWxkcmVuKCk7XHJcbiAgICAgIGlmICggbm9kZSApIHtcclxuICAgICAgICBoZWxwZXJOb2RlQ29udGFpbmVyLmFkZENoaWxkKCBub2RlICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcblxyXG4gICAgLy8gdGhpcy5pbnB1dEJhc2VkUGlja2luZ1Byb3BlcnR5ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggdHJ1ZSwgeyB0YW5kZW06IFRhbmRlbS5PUFRfT1VUIH0gKTtcclxuICAgIC8vIHRoaXMudXNlTGVhZk5vZGVQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIGZhbHNlLCB7IHRhbmRlbTogVGFuZGVtLk9QVF9PVVQgfSApO1xyXG4gICAgLy8gdGhpcy5wb2ludGVyQXJlYVR5cGVQcm9wZXJ0eSA9IG5ldyBFbnVtZXJhdGlvblByb3BlcnR5KCBQb2ludGVyQXJlYVR5cGUuTU9VU0UsIHsgdGFuZGVtOiBUYW5kZW0uT1BUX09VVCB9ICk7XHJcblxyXG4gICAgaGVscGVyUm9vdC5hZGRDaGlsZCggYm91bmRzUGF0aCApO1xyXG4gICAgaGVscGVyUm9vdC5hZGRDaGlsZCggc2VsZkJvdW5kc1BhdGggKTtcclxuICAgIGhlbHBlclJvb3QuYWRkQ2hpbGQoIGhpZ2hsaWdodFBhdGggKTtcclxuICAgIGNvbnN0IGJhY2tncm91bmROb2RlID0gbmV3IE5vZGUoKTtcclxuXHJcbiAgICBiYWNrZ3JvdW5kTm9kZS5hZGRJbnB1dExpc3RlbmVyKCBuZXcgUHJlc3NMaXN0ZW5lcigge1xyXG4gICAgICBwcmVzczogKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRUcmFpbFByb3BlcnR5LnZhbHVlID0gdGhpcy5wb2ludGVyVHJhaWxQcm9wZXJ0eS52YWx1ZTtcclxuICAgICAgICBmb2N1c1NlbGVjdGVkKCk7XHJcbiAgICAgIH0sXHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLk9QVF9PVVRcclxuICAgIH0gKSApO1xyXG4gICAgaGVscGVyUm9vdC5hZGRDaGlsZCggYmFja2dyb3VuZE5vZGUgKTtcclxuICAgIGhlbHBlclJvb3QuYWRkQ2hpbGQoIGhlbHBlck5vZGVDb250YWluZXIgKTtcclxuXHJcbiAgICBjb25zdCB1bmRlclBvaW50ZXJOb2RlID0gbmV3IEZsb3dCb3goIHtcclxuICAgICAgb3JpZW50YXRpb246ICd2ZXJ0aWNhbCcsXHJcbiAgICAgIHNwYWNpbmc6IDUsXHJcbiAgICAgIGFsaWduOiAnbGVmdCcsXHJcbiAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgcG9zaXRpb25UZXh0LFxyXG4gICAgICAgIGNvbG9yQmFja2dyb3VuZFxyXG4gICAgICBdLFxyXG4gICAgICB2aXNpYmxlUHJvcGVydHk6IHRoaXMudW5kZXJQb2ludGVyVmlzaWJsZVByb3BlcnR5XHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9uc05vZGUgPSBuZXcgVkJveCgge1xyXG4gICAgICBzcGFjaW5nOiAzLFxyXG4gICAgICBhbGlnbjogJ2xlZnQnLFxyXG4gICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgIGNyZWF0ZUhlYWRlclRleHQoICdUb29scycgKSxcclxuICAgICAgICBuZXcgVkJveCgge1xyXG4gICAgICAgICAgc3BhY2luZzogMyxcclxuICAgICAgICAgIGFsaWduOiAnbGVmdCcsXHJcbiAgICAgICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgICAgICBuZXcgSEJveCgge1xyXG4gICAgICAgICAgICAgIHNwYWNpbmc6IDEwLFxyXG4gICAgICAgICAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgICAgICAgICBmdXp6Q2hlY2tib3gsXHJcbiAgICAgICAgICAgICAgICBtZWFzdXJpbmdUYXBlVmlzaWJsZUNoZWNrYm94XHJcbiAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9ICksXHJcbiAgICAgICAgICAgIG5ldyBIQm94KCB7XHJcbiAgICAgICAgICAgICAgc3BhY2luZzogMTAsXHJcbiAgICAgICAgICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICAgICAgICAgIHZpc3VhbFRyZWVWaXNpYmxlQ2hlY2tib3gsXHJcbiAgICAgICAgICAgICAgICAuLi4oIHNpbURpc3BsYXkuX2FjY2Vzc2libGUgPyBbIHBkb21UcmVlVmlzaWJsZUNoZWNrYm94IF0gOiBbXSApXHJcbiAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9IClcclxuICAgICAgICAgIF1cclxuICAgICAgICB9ICksXHJcbiAgICAgICAgY3JlYXRlSGVhZGVyVGV4dCggJ1BpY2tpbmcnLCB1bmRlZmluZWQsIHsgbGF5b3V0T3B0aW9uczogeyB0b3BNYXJnaW46IDMgfSB9ICksXHJcbiAgICAgICAgbmV3IFZCb3goIHtcclxuICAgICAgICAgIHNwYWNpbmc6IDMsXHJcbiAgICAgICAgICBhbGlnbjogJ2xlZnQnLFxyXG4gICAgICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICAgICAgbmV3IEhCb3goIHtcclxuICAgICAgICAgICAgICBzcGFjaW5nOiAxMCxcclxuICAgICAgICAgICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgICAgICAgICAgaW5wdXRCYXNlZFBpY2tpbmdDaGVja2JveCxcclxuICAgICAgICAgICAgICAgIHVzZUxlYWZOb2RlQ2hlY2tib3hcclxuICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH0gKSxcclxuICAgICAgICAgICAgcG9pbnRlckFyZWFUeXBlUmFkaW9CdXR0b25Hcm91cFxyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH0gKSxcclxuICAgICAgICBjcmVhdGVIZWFkZXJUZXh0KCAnU2hvdycsIHVuZGVmaW5lZCwgeyBsYXlvdXRPcHRpb25zOiB7IHRvcE1hcmdpbjogMyB9IH0gKSxcclxuICAgICAgICBuZXcgVkJveCgge1xyXG4gICAgICAgICAgc3BhY2luZzogMyxcclxuICAgICAgICAgIGFsaWduOiAnbGVmdCcsXHJcbiAgICAgICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgICAgICBuZXcgSEJveCgge1xyXG4gICAgICAgICAgICAgIHNwYWNpbmc6IDEwLFxyXG4gICAgICAgICAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgICAgICAgICBoaWdobGlnaHRWaXNpYmxlQ2hlY2tib3gsXHJcbiAgICAgICAgICAgICAgICBnZXRIZWxwZXJOb2RlVmlzaWJsZUNoZWNrYm94XHJcbiAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9ICksXHJcbiAgICAgICAgICAgIG5ldyBIQm94KCB7XHJcbiAgICAgICAgICAgICAgc3BhY2luZzogMTAsXHJcbiAgICAgICAgICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICAgICAgICAgIGJvdW5kc1Zpc2libGVDaGVja2JveCxcclxuICAgICAgICAgICAgICAgIHNlbGZCb3VuZHNWaXNpYmxlQ2hlY2tib3hcclxuICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH0gKVxyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH0gKVxyXG4gICAgICBdLFxyXG4gICAgICB2aXNpYmxlUHJvcGVydHk6IHRoaXMub3B0aW9uc1Zpc2libGVQcm9wZXJ0eVxyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IGhlbHBlclJlYWRvdXRDb250ZW50ID0gbmV3IFZCb3goIHtcclxuICAgICAgc3BhY2luZzogNSxcclxuICAgICAgYWxpZ246ICdsZWZ0JyxcclxuICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICBjcmVhdGVDb2xsYXBzaWJsZUhlYWRlclRleHQoICdVbmRlciBQb2ludGVyJywgdGhpcy51bmRlclBvaW50ZXJWaXNpYmxlUHJvcGVydHksIHVuZGVyUG9pbnRlck5vZGUsIHsgbGF5b3V0T3B0aW9uczogeyB0b3BNYXJnaW46IDAgfSB9ICksXHJcbiAgICAgICAgdW5kZXJQb2ludGVyTm9kZSxcclxuICAgICAgICBjcmVhdGVDb2xsYXBzaWJsZUhlYWRlclRleHQoICdPcHRpb25zJywgdGhpcy5vcHRpb25zVmlzaWJsZVByb3BlcnR5LCBvcHRpb25zTm9kZSApLFxyXG4gICAgICAgIG9wdGlvbnNOb2RlLFxyXG4gICAgICAgIGNyZWF0ZUNvbGxhcHNpYmxlSGVhZGVyVGV4dCggJ1ByZXZpZXcnLCB0aGlzLnByZXZpZXdWaXNpYmxlUHJvcGVydHksIHByZXZpZXdOb2RlICksXHJcbiAgICAgICAgcHJldmlld05vZGUsXHJcbiAgICAgICAgY3JlYXRlQ29sbGFwc2libGVIZWFkZXJUZXh0KCAnU2VsZWN0ZWQgVHJhaWwnLCB0aGlzLnNlbGVjdGVkVHJhaWxDb250ZW50VmlzaWJsZVByb3BlcnR5LCBzZWxlY3RlZFRyYWlsQ29udGVudCApLFxyXG4gICAgICAgIHNlbGVjdGVkVHJhaWxDb250ZW50LFxyXG4gICAgICAgIGNyZWF0ZUNvbGxhcHNpYmxlSGVhZGVyVGV4dCggJ1NlbGVjdGVkIE5vZGUnLCB0aGlzLnNlbGVjdGVkTm9kZUNvbnRlbnRWaXNpYmxlUHJvcGVydHksIHNlbGVjdGVkTm9kZUNvbnRlbnQgKSxcclxuICAgICAgICBzZWxlY3RlZE5vZGVDb250ZW50XHJcbiAgICAgIF0sXHJcbiAgICAgIHZpc2libGVQcm9wZXJ0eTogdGhpcy5oZWxwZXJWaXNpYmxlUHJvcGVydHlcclxuICAgIH0gKTtcclxuICAgIGNvbnN0IGhlbHBlclJlYWRvdXRDb2xsYXBzaWJsZSA9IG5ldyBWQm94KCB7XHJcbiAgICAgIHNwYWNpbmc6IDUsXHJcbiAgICAgIGFsaWduOiAnbGVmdCcsXHJcbiAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgY3JlYXRlQ29sbGFwc2libGVIZWFkZXJUZXh0KCAnSGVscGVyJywgdGhpcy5oZWxwZXJWaXNpYmxlUHJvcGVydHksIGhlbHBlclJlYWRvdXRDb250ZW50ICksXHJcbiAgICAgICAgbmV3IEhTZXBhcmF0b3IoKSxcclxuICAgICAgICBoZWxwZXJSZWFkb3V0Q29udGVudFxyXG4gICAgICBdXHJcbiAgICB9ICk7XHJcbiAgICBjb25zdCBoZWxwZXJSZWFkb3V0UGFuZWwgPSBuZXcgUGFuZWwoIGhlbHBlclJlYWRvdXRDb2xsYXBzaWJsZSwge1xyXG4gICAgICBmaWxsOiAncmdiYSgyNTUsMjU1LDI1NSwwLjg1KScsXHJcbiAgICAgIHN0cm9rZTogJ3JnYmEoMCwwLDAsMC44NSknLFxyXG4gICAgICBjb3JuZXJSYWRpdXM6IDBcclxuICAgIH0gKTtcclxuICAgIGhlbHBlclJlYWRvdXRQYW5lbC5hZGRJbnB1dExpc3RlbmVyKCBuZXcgRHJhZ0xpc3RlbmVyKCB7XHJcbiAgICAgIHRyYW5zbGF0ZU5vZGU6IHRydWUsXHJcbiAgICAgIHRhcmdldE5vZGU6IGhlbHBlclJlYWRvdXRQYW5lbCxcclxuICAgICAgdGFuZGVtOiBUYW5kZW0uT1BUX09VVFxyXG4gICAgfSApICk7XHJcblxyXG4gICAgLy8gQWxsb3cgc2Nyb2xsaW5nIHRvIHNjcm9sbCB0aGUgcGFuZWwncyBwb3NpdGlvblxyXG4gICAgaGVscGVyUmVhZG91dFBhbmVsLmFkZElucHV0TGlzdGVuZXIoIHtcclxuICAgICAgd2hlZWw6IGV2ZW50ID0+IHtcclxuICAgICAgICBjb25zdCBkZWx0YVkgPSBldmVudC5kb21FdmVudCEuZGVsdGFZO1xyXG4gICAgICAgIGNvbnN0IG11bHRpcGxpZXIgPSAxO1xyXG4gICAgICAgIGhlbHBlclJlYWRvdXRQYW5lbC55IC09IGRlbHRhWSAqIG11bHRpcGxpZXI7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICAgIGhlbHBlclJvb3QuYWRkQ2hpbGQoIGhlbHBlclJlYWRvdXRQYW5lbCApO1xyXG5cclxuICAgIGhlbHBlclJvb3QuYWRkQ2hpbGQoIHZpc3VhbFRyZWVOb2RlICk7XHJcbiAgICBoZWxwZXJSb290LmFkZENoaWxkKCBwZG9tVHJlZU5vZGUgKTtcclxuXHJcbiAgICBjb25zdCBtZWFzdXJpbmdUYXBlTm9kZSA9IG5ldyBNZWFzdXJpbmdUYXBlTm9kZSggbWVhc3VyaW5nVGFwZVVuaXRzUHJvcGVydHksIHtcclxuICAgICAgdGFuZGVtOiBUYW5kZW0uT1BUX09VVCxcclxuICAgICAgdmlzaWJsZVByb3BlcnR5OiBtZWFzdXJpbmdUYXBlVmlzaWJsZVByb3BlcnR5LFxyXG4gICAgICB0ZXh0QmFja2dyb3VuZENvbG9yOiAncmdiYSgwLDAsMCwwLjUpJ1xyXG4gICAgfSApO1xyXG4gICAgbWVhc3VyaW5nVGFwZU5vZGUuYmFzZVBvc2l0aW9uUHJvcGVydHkudmFsdWUgPSBuZXcgVmVjdG9yMiggMTAwLCAzMDAgKTtcclxuICAgIG1lYXN1cmluZ1RhcGVOb2RlLnRpcFBvc2l0aW9uUHJvcGVydHkudmFsdWUgPSBuZXcgVmVjdG9yMiggMjAwLCAzMDAgKTtcclxuICAgIGhlbHBlclJvb3QuYWRkQ2hpbGQoIG1lYXN1cmluZ1RhcGVOb2RlICk7XHJcblxyXG4gICAgY29uc3QgcmVzaXplTGlzdGVuZXIgPSAoIHNpemU6IERpbWVuc2lvbjIgKSA9PiB7XHJcbiAgICAgIHRoaXMuaGVscGVyRGlzcGxheSEud2lkdGggPSBzaXplLndpZHRoO1xyXG4gICAgICB0aGlzLmhlbHBlckRpc3BsYXkhLmhlaWdodCA9IHNpemUuaGVpZ2h0O1xyXG4gICAgICBsYXlvdXRCb3VuZHNQcm9wZXJ0eS52YWx1ZSA9IGxheW91dEJvdW5kc1Byb3BlcnR5LnZhbHVlLndpdGhNYXhYKCBzaXplLndpZHRoICkud2l0aE1heFkoIHNpemUuaGVpZ2h0ICk7XHJcbiAgICAgIGJhY2tncm91bmROb2RlLm1vdXNlQXJlYSA9IG5ldyBCb3VuZHMyKCAwLCAwLCBzaXplLndpZHRoLCBzaXplLmhlaWdodCApO1xyXG4gICAgICBiYWNrZ3JvdW5kTm9kZS50b3VjaEFyZWEgPSBuZXcgQm91bmRzMiggMCwgMCwgc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHQgKTtcclxuXHJcbiAgICAgIHZpc3VhbFRyZWVOb2RlLnJlc2l6ZSggc2l6ZSApO1xyXG4gICAgICBwZG9tVHJlZU5vZGUucmVzaXplKCBzaXplICk7XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IGZyYW1lTGlzdGVuZXIgPSAoIGR0OiBudW1iZXIgKSA9PiB7XHJcbiAgICAgIHRoaXMub3ZlckludGVyZmFjZVByb3BlcnR5LnZhbHVlID1cclxuICAgICAgICBoZWxwZXJSZWFkb3V0UGFuZWwuYm91bmRzLmNvbnRhaW5zUG9pbnQoIHRoaXMucG9pbnRlclBvc2l0aW9uUHJvcGVydHkudmFsdWUgKSB8fFxyXG4gICAgICAgICggdGhpcy52aXN1YWxUcmVlVmlzaWJsZVByb3BlcnR5LnZhbHVlICYmIHZpc3VhbFRyZWVOb2RlLmJvdW5kcy5jb250YWluc1BvaW50KCB0aGlzLnBvaW50ZXJQb3NpdGlvblByb3BlcnR5LnZhbHVlICkgKSB8fFxyXG4gICAgICAgICggdGhpcy5wZG9tVHJlZVZpc2libGVQcm9wZXJ0eS52YWx1ZSAmJiBwZG9tVHJlZU5vZGUuYm91bmRzLmNvbnRhaW5zUG9pbnQoIHRoaXMucG9pbnRlclBvc2l0aW9uUHJvcGVydHkudmFsdWUgKSApIHx8XHJcbiAgICAgICAgaGVscGVyTm9kZUNvbnRhaW5lci5jb250YWluc1BvaW50KCB0aGlzLnBvaW50ZXJQb3NpdGlvblByb3BlcnR5LnZhbHVlICk7XHJcblxyXG4gICAgICB0aGlzLmhlbHBlckRpc3BsYXk/LnVwZGF0ZURpc3BsYXkoKTtcclxuICAgIH07XHJcblxyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ2tleXVwJywgKCBldmVudDogS2V5Ym9hcmRFdmVudCApID0+IHtcclxuICAgICAgaWYgKCBldmVudC5rZXkgPT09ICdFc2NhcGUnICkge1xyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRUcmFpbFByb3BlcnR5LnZhbHVlID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuYWN0aXZlUHJvcGVydHkubGF6eUxpbmsoIGFjdGl2ZSA9PiB7XHJcbiAgICAgIGlmICggYWN0aXZlICkge1xyXG4gICAgICAgIHNpbS5hY3RpdmVQcm9wZXJ0eS52YWx1ZSA9IGZhbHNlO1xyXG5cclxuICAgICAgICBjb25zdCBzY3JlZW4gPSBzaW0uc2VsZWN0ZWRTY3JlZW5Qcm9wZXJ0eS52YWx1ZTtcclxuICAgICAgICBpZiAoIHNjcmVlbi5oYXNWaWV3KCkgKSB7XHJcbiAgICAgICAgICB0aGlzLnNjcmVlblZpZXdQcm9wZXJ0eS52YWx1ZSA9IHNjcmVlbi52aWV3O1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHRoaXMuc2NyZWVuVmlld1Byb3BlcnR5LnZhbHVlID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuaGVscGVyRGlzcGxheSA9IG5ldyBEaXNwbGF5KCBoZWxwZXJSb290LCB7XHJcbiAgICAgICAgICBhc3N1bWVGdWxsV2luZG93OiB0cnVlXHJcbiAgICAgICAgfSApO1xyXG4gICAgICAgIHRoaXMuaGVscGVyRGlzcGxheS5pbml0aWFsaXplRXZlbnRzKCk7XHJcblxyXG4gICAgICAgIHNpbS5kaW1lbnNpb25Qcm9wZXJ0eS5saW5rKCByZXNpemVMaXN0ZW5lciApO1xyXG4gICAgICAgIGFuaW1hdGlvbkZyYW1lVGltZXIuYWRkTGlzdGVuZXIoIGZyYW1lTGlzdGVuZXIgKTtcclxuXHJcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggdGhpcy5oZWxwZXJEaXNwbGF5LmRvbUVsZW1lbnQgKTtcclxuICAgICAgICB0aGlzLmhlbHBlckRpc3BsYXkuZG9tRWxlbWVudC5zdHlsZS56SW5kZXggPSAnMTAwMDAnO1xyXG5cclxuICAgICAgICBjb25zdCBvbkxvY2F0aW9uRXZlbnQgPSAoIGV2ZW50OiBTY2VuZXJ5RXZlbnQ8VG91Y2hFdmVudCB8IFBvaW50ZXJFdmVudCB8IE1vdXNlRXZlbnQ+ICkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5wb2ludGVyUG9zaXRpb25Qcm9wZXJ0eS52YWx1ZSA9IGV2ZW50LnBvaW50ZXIucG9pbnQ7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5oZWxwZXJEaXNwbGF5LmFkZElucHV0TGlzdGVuZXIoIHtcclxuICAgICAgICAgIG1vdmU6IG9uTG9jYXRpb25FdmVudCxcclxuICAgICAgICAgIGRvd246IG9uTG9jYXRpb25FdmVudCxcclxuICAgICAgICAgIHVwOiBvbkxvY2F0aW9uRXZlbnRcclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5zY3JlZW5WaWV3UHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgICAgICBtZWFzdXJpbmdUYXBlVW5pdHNQcm9wZXJ0eS52YWx1ZSA9IHtcclxuICAgICAgICAgICAgbmFtZTogJ3ZpZXcgdW5pdHMnLFxyXG4gICAgICAgICAgICBtdWx0aXBsaWVyOiB0aGlzLnNjcmVlblZpZXdQcm9wZXJ0eS52YWx1ZS5nZXRHbG9iYWxUb0xvY2FsTWF0cml4KCkuZ2V0U2NhbGVWZWN0b3IoKS54XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zaW1EaXNwbGF5LmZvcmVpZ25PYmplY3RSYXN0ZXJpemF0aW9uKCAoIGRhdGFVUkk6IHN0cmluZyB8IG51bGwgKSA9PiB7XHJcbiAgICAgICAgICBpZiAoIGRhdGFVUkkgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGltYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2ltZycgKTtcclxuICAgICAgICAgICAgaW1hZ2UuYWRkRXZlbnRMaXN0ZW5lciggJ2xvYWQnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBpbWFnZS53aWR0aDtcclxuICAgICAgICAgICAgICBjb25zdCBoZWlnaHQgPSBpbWFnZS5oZWlnaHQ7XHJcblxyXG4gICAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdjYW52YXMnICk7XHJcbiAgICAgICAgICAgICAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCAnMmQnICkhO1xyXG4gICAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoIGltYWdlLCAwLCAwICk7XHJcblxyXG4gICAgICAgICAgICAgIGlmICggdGhpcy5hY3RpdmVQcm9wZXJ0eS52YWx1ZSApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW1hZ2VEYXRhUHJvcGVydHkudmFsdWUgPSBjb250ZXh0LmdldEltYWdlRGF0YSggMCwgMCwgd2lkdGgsIGhlaWdodCApO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgICBpbWFnZS5zcmMgPSBkYXRhVVJJO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCAnQ291bGQgbm90IGxvYWQgZm9yZWlnbiBvYmplY3QgcmFzdGVyaXphdGlvbicgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgc2ltLmRpbWVuc2lvblByb3BlcnR5LnVubGluayggcmVzaXplTGlzdGVuZXIgKTtcclxuICAgICAgICBhbmltYXRpb25GcmFtZVRpbWVyLnJlbW92ZUxpc3RlbmVyKCBmcmFtZUxpc3RlbmVyICk7XHJcblxyXG4gICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoIHRoaXMuaGVscGVyRGlzcGxheSEuZG9tRWxlbWVudCApO1xyXG5cclxuICAgICAgICB0aGlzLmhlbHBlckRpc3BsYXkhLmRpc3Bvc2UoKTtcclxuXHJcbiAgICAgICAgLy8gVW5wYXVzZSB0aGUgc2ltdWxhdGlvblxyXG4gICAgICAgIHNpbS5hY3RpdmVQcm9wZXJ0eS52YWx1ZSA9IHRydWU7XHJcblxyXG4gICAgICAgIC8vIENsZWFyIGltYWdlRGF0YSBzaW5jZSBpdCB3b24ndCBiZSBhY2N1cmF0ZSB3aGVuIHdlIHJlLW9wZW5cclxuICAgICAgICB0aGlzLmltYWdlRGF0YVByb3BlcnR5LnZhbHVlID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gSGlkZSB0aGUgdHJlZSB3aGVuIGNsb3NpbmcsIHNvIGl0IHN0YXJ0cyB1cCBxdWlja2x5XHJcbiAgICAgICAgdGhpcy52aXN1YWxUcmVlVmlzaWJsZVByb3BlcnR5LnZhbHVlID0gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIC8vIFNpbmdsZXRvbiwgbGF6aWx5IGNyZWF0ZWQgc28gd2UgZG9uJ3Qgc2xvdyBkb3duIHN0YXJ0dXBcclxuICBwdWJsaWMgc3RhdGljIGhlbHBlcj86IEhlbHBlcjtcclxuXHJcbiAgcHVibGljIHN0YXRpYyBpbml0aWFsaXplKCBzaW06IFNpbSwgc2ltRGlzcGxheTogU2ltRGlzcGxheSApOiB2b2lkIHtcclxuICAgIC8vIEN0cmwgKyBzaGlmdCArIEggKHdpbGwgb3BlbiB0aGUgaGVscGVyKVxyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ2tleWRvd24nLCAoIGV2ZW50OiBLZXlib2FyZEV2ZW50ICkgPT4ge1xyXG4gICAgICBpZiAoIGV2ZW50LmN0cmxLZXkgJiYgZXZlbnQua2V5ID09PSAnSCcgKSB7XHJcblxyXG4gICAgICAgIC8vIExhenkgY3JlYXRpb25cclxuICAgICAgICBpZiAoICFIZWxwZXIuaGVscGVyICkge1xyXG4gICAgICAgICAgSGVscGVyLmhlbHBlciA9IG5ldyBIZWxwZXIoIHNpbSwgc2ltRGlzcGxheSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgSGVscGVyLmhlbHBlci5hY3RpdmVQcm9wZXJ0eS52YWx1ZSA9ICFIZWxwZXIuaGVscGVyLmFjdGl2ZVByb3BlcnR5LnZhbHVlO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgfVxyXG59XHJcblxyXG5qb2lzdC5yZWdpc3RlciggJ0hlbHBlcicsIEhlbHBlciApO1xyXG5cclxudHlwZSBIZWxwZXJDaGVja2JveFNlbGZPcHRpb25zID0ge1xyXG4gIGxhYmVsT3B0aW9ucz86IFJpY2hUZXh0T3B0aW9ucztcclxufTtcclxuXHJcbnR5cGUgSGVscGVyQ2hlY2tib3hPcHRpb25zID0gSGVscGVyQ2hlY2tib3hTZWxmT3B0aW9ucyAmIENoZWNrYm94T3B0aW9ucztcclxuXHJcbmNsYXNzIEhlbHBlckNoZWNrYm94IGV4dGVuZHMgQ2hlY2tib3gge1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggcHJvcGVydHk6IFByb3BlcnR5PGJvb2xlYW4+LCBsYWJlbDogc3RyaW5nLCBwcm92aWRlZE9wdGlvbnM/OiBIZWxwZXJDaGVja2JveE9wdGlvbnMgKSB7XHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPEhlbHBlckNoZWNrYm94T3B0aW9ucywgSGVscGVyQ2hlY2tib3hTZWxmT3B0aW9ucywgQ2hlY2tib3hPcHRpb25zPigpKCB7XHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLk9QVF9PVVQsXHJcbiAgICAgIGJveFdpZHRoOiAxNCxcclxuICAgICAgbGFiZWxPcHRpb25zOiB7XHJcbiAgICAgICAgZm9udDogbmV3IFBoZXRGb250KCAxMiApXHJcbiAgICAgIH1cclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIHN1cGVyKCBwcm9wZXJ0eSwgbmV3IFJpY2hUZXh0KCBsYWJlbCwgb3B0aW9ucy5sYWJlbE9wdGlvbnMgKSwgb3B0aW9ucyApO1xyXG4gIH1cclxufVxyXG5cclxuLy8gY2xhc3MgRHJhZ2dhYmxlRGl2aWRlciBleHRlbmRzIFJlY3RhbmdsZSB7XHJcbi8vICAgY29uc3RydWN0b3IoIHByZWZlcnJlZEJvdW5kc1Byb3BlcnR5LCBvcmllbnRhdGlvbiwgaW5pdGlhbFNlcGFyYXRvckxvY2F0aW9uLCBwdXNoRnJvbU1heCApIHtcclxuLy9cclxuLy8gICAgIHN1cGVyKCB7XHJcbi8vICAgICAgIGZpbGw6ICcjNjY2JyxcclxuLy8gICAgICAgY3Vyc29yOiBvcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnID8gJ3ctcmVzaXplJyA6ICduLXJlc2l6ZSdcclxuLy8gICAgIH0gKTtcclxuLy9cclxuLy8gICAgIHRoaXMubWluQm91bmRzUHJvcGVydHkgPSBuZXcgVGlueVByb3BlcnR5KCBuZXcgQm91bmRzMiggMCwgMCwgMCwgMCApICk7XHJcbi8vICAgICB0aGlzLm1heEJvdW5kc1Byb3BlcnR5ID0gbmV3IFRpbnlQcm9wZXJ0eSggbmV3IEJvdW5kczIoIDAsIDAsIDAsIDAgKSApO1xyXG4vL1xyXG4vLyAgICAgdGhpcy5wcmVmZXJyZWRCb3VuZHNQcm9wZXJ0eSA9IHByZWZlcnJlZEJvdW5kc1Byb3BlcnR5O1xyXG4vLyAgICAgdGhpcy5vcmllbnRhdGlvbiA9IG9yaWVudGF0aW9uO1xyXG4vLyAgICAgdGhpcy5wcmltYXJ5Q29vcmRpbmF0ZSA9IG9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgPyAneCcgOiAneSc7XHJcbi8vICAgICB0aGlzLnNlY29uZGFyeUNvb3JkaW5hdGUgPSBvcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnID8gJ3knIDogJ3gnO1xyXG4vLyAgICAgdGhpcy5wcmltYXJ5TmFtZSA9IG9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgPyAnd2lkdGgnIDogJ2hlaWdodCc7XHJcbi8vICAgICB0aGlzLnNlY29uZGFyeU5hbWUgPSBvcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnID8gJ2hlaWdodCcgOiAnd2lkdGgnO1xyXG4vLyAgICAgdGhpcy5wcmltYXJ5UmVjdE5hbWUgPSBvcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnID8gJ3JlY3RXaWR0aCcgOiAncmVjdEhlaWdodCc7XHJcbi8vICAgICB0aGlzLnNlY29uZGFyeVJlY3ROYW1lID0gb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJyA/ICdyZWN0SGVpZ2h0JyA6ICdyZWN0V2lkdGgnO1xyXG4vLyAgICAgdGhpcy5taW5Db29yZGluYXRlID0gb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJyA/ICdsZWZ0JyA6ICd0b3AnO1xyXG4vLyAgICAgdGhpcy5tYXhDb29yZGluYXRlID0gb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJyA/ICdyaWdodCcgOiAnYm90dG9tJztcclxuLy8gICAgIHRoaXMuY2VudGVyTmFtZSA9IG9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgPyAnY2VudGVyWCcgOiAnY2VudGVyWSc7XHJcbi8vICAgICB0aGlzLm1pbmltdW0gPSAxMDA7XHJcbi8vXHJcbi8vICAgICB0aGlzLnNlcGFyYXRvckxvY2F0aW9uID0gaW5pdGlhbFNlcGFyYXRvckxvY2F0aW9uO1xyXG4vL1xyXG4vLyAgICAgdGhpc1sgdGhpcy5wcmltYXJ5UmVjdE5hbWUgXSA9IDI7XHJcbi8vXHJcbi8vICAgICB2YXIgZHJhZ0xpc3RlbmVyID0gbmV3IHBoZXQuc2NlbmVyeS5EcmFnTGlzdGVuZXIoIHtcclxuLy8gICAgICAgZHJhZzogZXZlbnQgPT4ge1xyXG4vLyAgICAgICAgIHRoaXMuc2VwYXJhdG9yTG9jYXRpb24gPSBkcmFnTGlzdGVuZXIucGFyZW50UG9pbnRbIHRoaXMucHJpbWFyeUNvb3JkaW5hdGUgXTtcclxuLy8gICAgICAgICB0aGlzLmxheW91dCgpO1xyXG4vLyAgICAgICB9XHJcbi8vICAgICB9ICk7XHJcbi8vICAgICB0aGlzLmFkZElucHV0TGlzdGVuZXIoIGRyYWdMaXN0ZW5lciApO1xyXG4vL1xyXG4vLyAgICAgcHJlZmVycmVkQm91bmRzUHJvcGVydHkubGluayggKCBuZXdQcmVmZXJyZWRCb3VuZHMsIG9sZFByZWZlcnJlZEJvdW5kcyApID0+IHtcclxuLy8gICAgICAgaWYgKCBwdXNoRnJvbU1heCAmJiBvbGRQcmVmZXJyZWRCb3VuZHMgKSB7XHJcbi8vICAgICAgICAgdGhpcy5zZXBhcmF0b3JMb2NhdGlvbiArPSBuZXdQcmVmZXJyZWRCb3VuZHNbIHRoaXMubWF4Q29vcmRpbmF0ZSBdIC0gb2xkUHJlZmVycmVkQm91bmRzWyB0aGlzLm1heENvb3JkaW5hdGUgXTtcclxuLy8gICAgICAgfVxyXG4vLyAgICAgICBpZiAoICFwdXNoRnJvbU1heCAmJiBvbGRQcmVmZXJyZWRCb3VuZHMgKSB7XHJcbi8vICAgICAgICAgdGhpcy5zZXBhcmF0b3JMb2NhdGlvbiArPSBuZXdQcmVmZXJyZWRCb3VuZHNbIHRoaXMubWluQ29vcmRpbmF0ZSBdIC0gb2xkUHJlZmVycmVkQm91bmRzWyB0aGlzLm1pbkNvb3JkaW5hdGUgXTtcclxuLy8gICAgICAgfVxyXG4vLyAgICAgICB0aGlzLmxheW91dCgpO1xyXG4vLyAgICAgfSApO1xyXG4vLyAgIH1cclxuLy9cclxuLy8gICAvKipcclxuLy8gLy8gICAgKi9cclxuLy8gICBsYXlvdXQoKSB7XHJcbi8vICAgICB2YXIgcHJlZmVycmVkQm91bmRzID0gdGhpcy5wcmVmZXJyZWRCb3VuZHNQcm9wZXJ0eS52YWx1ZTtcclxuLy8gICAgIHZhciBzZXBhcmF0b3JMb2NhdGlvbiA9IHRoaXMuc2VwYXJhdG9yTG9jYXRpb247XHJcbi8vXHJcbi8vICAgICBpZiAoIHNlcGFyYXRvckxvY2F0aW9uIDwgcHJlZmVycmVkQm91bmRzWyB0aGlzLm1pbkNvb3JkaW5hdGUgXSArIHRoaXMubWluaW11bSApIHtcclxuLy8gICAgICAgc2VwYXJhdG9yTG9jYXRpb24gPSBwcmVmZXJyZWRCb3VuZHNbIHRoaXMubWluQ29vcmRpbmF0ZSBdICsgdGhpcy5taW5pbXVtO1xyXG4vLyAgICAgfVxyXG4vLyAgICAgaWYgKCBzZXBhcmF0b3JMb2NhdGlvbiA+IHByZWZlcnJlZEJvdW5kc1sgdGhpcy5tYXhDb29yZGluYXRlIF0gLSB0aGlzLm1pbmltdW0gKSB7XHJcbi8vICAgICAgIGlmICggcHJlZmVycmVkQm91bmRzWyB0aGlzLnByaW1hcnlOYW1lIF0gPj0gdGhpcy5taW5pbXVtICogMiApIHtcclxuLy8gICAgICAgICBzZXBhcmF0b3JMb2NhdGlvbiA9IHByZWZlcnJlZEJvdW5kc1sgdGhpcy5tYXhDb29yZGluYXRlIF0gLSB0aGlzLm1pbmltdW07XHJcbi8vICAgICAgIH1cclxuLy8gICAgICAgZWxzZSB7XHJcbi8vICAgICAgICAgc2VwYXJhdG9yTG9jYXRpb24gPSBwcmVmZXJyZWRCb3VuZHNbIHRoaXMubWluQ29vcmRpbmF0ZSBdICsgcHJlZmVycmVkQm91bmRzWyB0aGlzLnByaW1hcnlOYW1lIF0gLyAyO1xyXG4vLyAgICAgICB9XHJcbi8vICAgICB9XHJcbi8vXHJcbi8vICAgICB0aGlzWyB0aGlzLmNlbnRlck5hbWUgXSA9IHNlcGFyYXRvckxvY2F0aW9uO1xyXG4vLyAgICAgdGhpc1sgdGhpcy5zZWNvbmRhcnlDb29yZGluYXRlIF0gPSBwcmVmZXJyZWRCb3VuZHNbIHRoaXMuc2Vjb25kYXJ5Q29vcmRpbmF0ZSBdO1xyXG4vLyAgICAgdGhpc1sgdGhpcy5zZWNvbmRhcnlSZWN0TmFtZSBdID0gcHJlZmVycmVkQm91bmRzWyB0aGlzLnNlY29uZGFyeU5hbWUgXTtcclxuLy9cclxuLy8gICAgIGlmICggdGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnICkge1xyXG4vLyAgICAgICB0aGlzLm1vdXNlQXJlYSA9IHRoaXMudG91Y2hBcmVhID0gdGhpcy5sb2NhbEJvdW5kcy5kaWxhdGVkWCggNSApO1xyXG4vLyAgICAgfVxyXG4vLyAgICAgZWxzZSB7XHJcbi8vICAgICAgIHRoaXMubW91c2VBcmVhID0gdGhpcy50b3VjaEFyZWEgPSB0aGlzLmxvY2FsQm91bmRzLmRpbGF0ZWRZKCA1ICk7XHJcbi8vICAgICB9XHJcbi8vXHJcbi8vICAgICB2YXIgbWluQm91bmRzID0gcHJlZmVycmVkQm91bmRzLmNvcHkoKTtcclxuLy8gICAgIHZhciBtYXhCb3VuZHMgPSBwcmVmZXJyZWRCb3VuZHMuY29weSgpO1xyXG4vLyAgICAgaWYgKCB0aGlzLm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcgKSB7XHJcbi8vICAgICAgIG1pbkJvdW5kcy5tYXhYID0gc2VwYXJhdG9yTG9jYXRpb24gLSB0aGlzLndpZHRoIC8gMjtcclxuLy8gICAgICAgbWF4Qm91bmRzLm1pblggPSBzZXBhcmF0b3JMb2NhdGlvbiArIHRoaXMud2lkdGggLyAyO1xyXG4vLyAgICAgfVxyXG4vLyAgICAgZWxzZSB7XHJcbi8vICAgICAgIG1pbkJvdW5kcy5tYXhZID0gc2VwYXJhdG9yTG9jYXRpb24gLSB0aGlzLmhlaWdodCAvIDI7XHJcbi8vICAgICAgIG1heEJvdW5kcy5taW5ZID0gc2VwYXJhdG9yTG9jYXRpb24gKyB0aGlzLmhlaWdodCAvIDI7XHJcbi8vICAgICB9XHJcbi8vICAgICB0aGlzLm1pbkJvdW5kc1Byb3BlcnR5LnZhbHVlID0gbWluQm91bmRzO1xyXG4vLyAgICAgdGhpcy5tYXhCb3VuZHNQcm9wZXJ0eS52YWx1ZSA9IG1heEJvdW5kcztcclxuLy8gICB9XHJcbi8vIH1cclxuXHJcbnR5cGUgQ29sbGFwc2libGVUcmVlTm9kZVNlbGZPcHRpb25zPFQ+ID0ge1xyXG4gIGNyZWF0ZUNoaWxkcmVuPzogKCkgPT4gVFtdO1xyXG4gIHNwYWNpbmc/OiBudW1iZXI7XHJcbiAgaW5kZW50PzogbnVtYmVyO1xyXG59O1xyXG5cclxudHlwZSBDb2xsYXBzaWJsZVRyZWVOb2RlT3B0aW9uczxUPiA9IENvbGxhcHNpYmxlVHJlZU5vZGVTZWxmT3B0aW9uczxUPiAmIE5vZGVPcHRpb25zO1xyXG5cclxuY2xhc3MgQ29sbGFwc2libGVUcmVlTm9kZTxUIGV4dGVuZHMgUERPTVRyZWVOb2RlIHwgVmlzdWFsVHJlZU5vZGU+IGV4dGVuZHMgTm9kZSB7XHJcblxyXG4gIHB1YmxpYyBzZWxmTm9kZTogTm9kZTtcclxuICBwdWJsaWMgZXhwYW5kZWRQcm9wZXJ0eTogVFByb3BlcnR5PGJvb2xlYW4+O1xyXG4gIHB1YmxpYyBjaGlsZFRyZWVOb2RlczogT2JzZXJ2YWJsZUFycmF5PFQ+O1xyXG4gIHB1YmxpYyBleHBhbmRDb2xsYXBzZUJ1dHRvbjogTm9kZTtcclxuXHJcbiAgcHJpdmF0ZSBjaGlsZENvbnRhaW5lcjogTm9kZTtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBzZWxmTm9kZTogTm9kZSwgcHJvdmlkZWRPcHRpb25zPzogQ29sbGFwc2libGVUcmVlTm9kZU9wdGlvbnM8VD4gKSB7XHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPENvbGxhcHNpYmxlVHJlZU5vZGVPcHRpb25zPFQ+LCBDb2xsYXBzaWJsZVRyZWVOb2RlU2VsZk9wdGlvbnM8VD4sIE5vZGVPcHRpb25zPigpKCB7XHJcbiAgICAgIGNyZWF0ZUNoaWxkcmVuOiAoKSA9PiBbXSxcclxuICAgICAgc3BhY2luZzogMCxcclxuICAgICAgaW5kZW50OiA1XHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBzdXBlcigge1xyXG4gICAgICBleGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzOiB0cnVlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5zZWxmTm9kZSA9IHNlbGZOb2RlO1xyXG4gICAgdGhpcy5zZWxmTm9kZS5jZW50ZXJZID0gMDtcclxuXHJcbiAgICB0aGlzLmV4cGFuZGVkUHJvcGVydHkgPSBuZXcgVGlueVByb3BlcnR5KCB0cnVlICk7XHJcbiAgICB0aGlzLmNoaWxkVHJlZU5vZGVzID0gY3JlYXRlT2JzZXJ2YWJsZUFycmF5PFQ+KCB7XHJcbiAgICAgIGVsZW1lbnRzOiBvcHRpb25zLmNyZWF0ZUNoaWxkcmVuKClcclxuICAgIH0gKTtcclxuXHJcbiAgICBjb25zdCBidXR0b25TaXplID0gMTI7XHJcbiAgICBjb25zdCBleHBhbmRDb2xsYXBzZVNoYXBlID0gbmV3IFNoYXBlKClcclxuICAgICAgLm1vdmVUb1BvaW50KCBWZWN0b3IyLmNyZWF0ZVBvbGFyKCBidXR0b25TaXplIC8gMi41LCAzIC8gNCAqIE1hdGguUEkgKS5wbHVzWFkoIGJ1dHRvblNpemUgLyA4LCAwICkgKVxyXG4gICAgICAubGluZVRvKCBidXR0b25TaXplIC8gOCwgMCApXHJcbiAgICAgIC5saW5lVG9Qb2ludCggVmVjdG9yMi5jcmVhdGVQb2xhciggYnV0dG9uU2l6ZSAvIDIuNSwgNSAvIDQgKiBNYXRoLlBJICkucGx1c1hZKCBidXR0b25TaXplIC8gOCwgMCApICk7XHJcbiAgICB0aGlzLmV4cGFuZENvbGxhcHNlQnV0dG9uID0gbmV3IFJlY3RhbmdsZSggLWJ1dHRvblNpemUgLyAyLCAtYnV0dG9uU2l6ZSAvIDIsIGJ1dHRvblNpemUsIGJ1dHRvblNpemUsIHtcclxuICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICBuZXcgUGF0aCggZXhwYW5kQ29sbGFwc2VTaGFwZSwge1xyXG4gICAgICAgICAgc3Ryb2tlOiAnIzg4OCcsXHJcbiAgICAgICAgICBsaW5lQ2FwOiAncm91bmQnLFxyXG4gICAgICAgICAgbGluZVdpZHRoOiAxLjVcclxuICAgICAgICB9IClcclxuICAgICAgXSxcclxuICAgICAgdmlzaWJsZTogZmFsc2UsXHJcbiAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxyXG4gICAgICByaWdodDogMFxyXG4gICAgfSApO1xyXG4gICAgdGhpcy5leHBhbmRlZFByb3BlcnR5LmxpbmsoIGV4cGFuZGVkID0+IHtcclxuICAgICAgdGhpcy5leHBhbmRDb2xsYXBzZUJ1dHRvbi5yb3RhdGlvbiA9IGV4cGFuZGVkID8gTWF0aC5QSSAvIDIgOiAwO1xyXG4gICAgfSApO1xyXG4gICAgdGhpcy5leHBhbmRDb2xsYXBzZUJ1dHRvbi5hZGRJbnB1dExpc3RlbmVyKCBuZXcgRmlyZUxpc3RlbmVyKCB7XHJcbiAgICAgIGZpcmU6ICgpID0+IHtcclxuICAgICAgICB0aGlzLmV4cGFuZGVkUHJvcGVydHkudmFsdWUgPSAhdGhpcy5leHBhbmRlZFByb3BlcnR5LnZhbHVlO1xyXG4gICAgICB9LFxyXG4gICAgICB0YW5kZW06IFRhbmRlbS5PUFRfT1VUXHJcbiAgICB9ICkgKTtcclxuXHJcbiAgICB0aGlzLmFkZENoaWxkKCB0aGlzLmV4cGFuZENvbGxhcHNlQnV0dG9uICk7XHJcblxyXG4gICAgdGhpcy5jaGlsZENvbnRhaW5lciA9IG5ldyBGbG93Qm94KCB7XHJcbiAgICAgIG9yaWVudGF0aW9uOiAndmVydGljYWwnLFxyXG4gICAgICBhbGlnbjogJ2xlZnQnLFxyXG4gICAgICBzcGFjaW5nOiBvcHRpb25zLnNwYWNpbmcsXHJcbiAgICAgIGNoaWxkcmVuOiB0aGlzLmNoaWxkVHJlZU5vZGVzLFxyXG4gICAgICB4OiBvcHRpb25zLmluZGVudCxcclxuICAgICAgeTogdGhpcy5zZWxmTm9kZS5ib3R0b20gKyBvcHRpb25zLnNwYWNpbmcsXHJcbiAgICAgIHZpc2libGVQcm9wZXJ0eTogdGhpcy5leHBhbmRlZFByb3BlcnR5XHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLmFkZENoaWxkKCB0aGlzLmNoaWxkQ29udGFpbmVyICk7XHJcblxyXG4gICAgdGhpcy5hZGRDaGlsZCggc2VsZk5vZGUgKTtcclxuXHJcbiAgICBjb25zdCBvbkNoaWxkcmVuQ2hhbmdlID0gKCkgPT4ge1xyXG4gICAgICB0aGlzLmNoaWxkQ29udGFpbmVyLmNoaWxkcmVuID0gdGhpcy5jaGlsZFRyZWVOb2RlcztcclxuICAgICAgdGhpcy5leHBhbmRDb2xsYXBzZUJ1dHRvbi52aXNpYmxlID0gdGhpcy5jaGlsZFRyZWVOb2Rlcy5sZW5ndGggPiAwO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmNoaWxkVHJlZU5vZGVzLmFkZEl0ZW1BZGRlZExpc3RlbmVyKCAoKSA9PiB7XHJcbiAgICAgIG9uQ2hpbGRyZW5DaGFuZ2UoKTtcclxuICAgIH0gKTtcclxuICAgIHRoaXMuY2hpbGRUcmVlTm9kZXMuYWRkSXRlbVJlbW92ZWRMaXN0ZW5lciggKCkgPT4ge1xyXG4gICAgICBvbkNoaWxkcmVuQ2hhbmdlKCk7XHJcbiAgICB9ICk7XHJcbiAgICBvbkNoaWxkcmVuQ2hhbmdlKCk7XHJcblxyXG4gICAgdGhpcy5tdXRhdGUoIG9wdGlvbnMgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBleHBhbmQoKTogdm9pZCB7XHJcbiAgICB0aGlzLmV4cGFuZGVkUHJvcGVydHkudmFsdWUgPSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGNvbGxhcHNlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5leHBhbmRlZFByb3BlcnR5LnZhbHVlID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZXhwYW5kUmVjdXNpdmVseSgpOiB2b2lkIHtcclxuICAgIHRoaXMuZXhwYW5kZWRQcm9wZXJ0eS52YWx1ZSA9IHRydWU7XHJcbiAgICB0aGlzLmNoaWxkVHJlZU5vZGVzLmZvckVhY2goIHRyZWVOb2RlID0+IHtcclxuICAgICAgdHJlZU5vZGUuZXhwYW5kUmVjdXNpdmVseSgpO1xyXG4gICAgfSApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGNvbGxhcHNlUmVjdXJzaXZlbHkoKTogdm9pZCB7XHJcbiAgICB0aGlzLmV4cGFuZGVkUHJvcGVydHkudmFsdWUgPSBmYWxzZTtcclxuICAgIHRoaXMuY2hpbGRUcmVlTm9kZXMuZm9yRWFjaCggdHJlZU5vZGUgPT4ge1xyXG4gICAgICB0cmVlTm9kZS5jb2xsYXBzZVJlY3Vyc2l2ZWx5KCk7XHJcbiAgICB9ICk7XHJcbiAgfVxyXG59XHJcblxyXG5jbGFzcyBWaXN1YWxUcmVlTm9kZSBleHRlbmRzIENvbGxhcHNpYmxlVHJlZU5vZGU8VmlzdWFsVHJlZU5vZGU+IHtcclxuXHJcbiAgcHVibGljIHRyYWlsOiBUcmFpbDtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCB0cmFpbDogVHJhaWwsIGhlbHBlcjogSGVscGVyICkge1xyXG5cclxuICAgIGNvbnN0IG5vZGUgPSB0cmFpbC5sYXN0Tm9kZSgpO1xyXG4gICAgY29uc3QgaXNWaXNpYmxlID0gdHJhaWwuaXNWaXNpYmxlKCk7XHJcblxyXG4gICAgY29uc3QgVFJFRV9GT05UID0gbmV3IEZvbnQoIHsgc2l6ZTogMTIgfSApO1xyXG5cclxuICAgIGNvbnN0IG5hbWVOb2RlID0gbmV3IEhCb3goIHsgc3BhY2luZzogNSB9ICk7XHJcblxyXG4gICAgY29uc3QgbmFtZSA9IG5vZGUuY29uc3RydWN0b3IubmFtZTtcclxuICAgIGlmICggbmFtZSApIHtcclxuICAgICAgbmFtZU5vZGUuYWRkQ2hpbGQoIG5ldyBUZXh0KCBuYW1lLCB7XHJcbiAgICAgICAgZm9udDogVFJFRV9GT05ULFxyXG4gICAgICAgIHBpY2thYmxlOiBmYWxzZSxcclxuICAgICAgICBmaWxsOiBpc1Zpc2libGUgPyAnIzAwMCcgOiAnIzYwYSdcclxuICAgICAgfSApICk7XHJcbiAgICB9XHJcbiAgICBpZiAoIG5vZGUgaW5zdGFuY2VvZiBUZXh0ICkge1xyXG4gICAgICBuYW1lTm9kZS5hZGRDaGlsZCggbmV3IFRleHQoICdcIicgKyBub2RlLnN0cmluZyArICdcIicsIHtcclxuICAgICAgICBmb250OiBUUkVFX0ZPTlQsXHJcbiAgICAgICAgcGlja2FibGU6IGZhbHNlLFxyXG4gICAgICAgIGZpbGw6ICcjNjY2J1xyXG4gICAgICB9ICkgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzZWxmQmFja2dyb3VuZCA9IFJlY3RhbmdsZS5ib3VuZHMoIG5hbWVOb2RlLmJvdW5kcywge1xyXG4gICAgICBjaGlsZHJlbjogWyBuYW1lTm9kZSBdLFxyXG4gICAgICBjdXJzb3I6ICdwb2ludGVyJyxcclxuICAgICAgZmlsbDogbmV3IERlcml2ZWRQcm9wZXJ0eSggWyBoZWxwZXIuc2VsZWN0ZWRUcmFpbFByb3BlcnR5LCBoZWxwZXIucG9pbnRlclRyYWlsUHJvcGVydHkgXSwgKCBzZWxlY3RlZCwgYWN0aXZlICkgPT4ge1xyXG4gICAgICAgIGlmICggc2VsZWN0ZWQgJiYgdHJhaWwuZXF1YWxzKCBzZWxlY3RlZCApICkge1xyXG4gICAgICAgICAgcmV0dXJuICdyZ2JhKDAsMTI4LDI1NSwwLjQpJztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIGFjdGl2ZSAmJiB0cmFpbC5lcXVhbHMoIGFjdGl2ZSApICkge1xyXG4gICAgICAgICAgcmV0dXJuICdyZ2JhKDAsMTI4LDI1NSwwLjIpJztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gJ3RyYW5zcGFyZW50JztcclxuICAgICAgICB9XHJcbiAgICAgIH0sIHtcclxuICAgICAgICB0YW5kZW06IFRhbmRlbS5PUFRfT1VULFxyXG4gICAgICAgIHN0cmljdEF4b25EZXBlbmRlbmNpZXM6IGZhbHNlXHJcbiAgICAgIH0gKVxyXG4gICAgfSApO1xyXG5cclxuICAgIHNlbGZCYWNrZ3JvdW5kLmFkZElucHV0TGlzdGVuZXIoIHtcclxuICAgICAgZW50ZXI6ICgpID0+IHtcclxuICAgICAgICBoZWxwZXIudHJlZUhvdmVyVHJhaWxQcm9wZXJ0eS52YWx1ZSA9IHRyYWlsO1xyXG4gICAgICB9LFxyXG4gICAgICBleGl0OiAoKSA9PiB7XHJcbiAgICAgICAgaGVscGVyLnRyZWVIb3ZlclRyYWlsUHJvcGVydHkudmFsdWUgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgICBzZWxmQmFja2dyb3VuZC5hZGRJbnB1dExpc3RlbmVyKCBuZXcgRmlyZUxpc3RlbmVyKCB7XHJcbiAgICAgIGZpcmU6ICgpID0+IHtcclxuICAgICAgICBoZWxwZXIuc2VsZWN0ZWRUcmFpbFByb3BlcnR5LnZhbHVlID0gdHJhaWw7XHJcbiAgICAgIH0sXHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLk9QVF9PVVRcclxuICAgIH0gKSApO1xyXG5cclxuICAgIHN1cGVyKCBzZWxmQmFja2dyb3VuZCwge1xyXG4gICAgICBjcmVhdGVDaGlsZHJlbjogKCkgPT4gdHJhaWwubGFzdE5vZGUoKS5jaGlsZHJlbi5tYXAoIGNoaWxkID0+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFZpc3VhbFRyZWVOb2RlKCB0cmFpbC5jb3B5KCkuYWRkRGVzY2VuZGFudCggY2hpbGQgKSwgaGVscGVyICk7XHJcbiAgICAgIH0gKVxyXG4gICAgfSApO1xyXG5cclxuICAgIGlmICggIW5vZGUudmlzaWJsZSApIHtcclxuICAgICAgdGhpcy5leHBhbmRlZFByb3BlcnR5LnZhbHVlID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy50cmFpbCA9IHRyYWlsO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGZpbmQoIHRyYWlsOiBUcmFpbCApOiBWaXN1YWxUcmVlTm9kZSB8IG51bGwge1xyXG4gICAgaWYgKCB0cmFpbC5lcXVhbHMoIHRoaXMudHJhaWwgKSApIHtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgY29uc3QgdHJlZU5vZGUgPSBfLmZpbmQoIHRoaXMuY2hpbGRUcmVlTm9kZXMsIGNoaWxkVHJlZU5vZGUgPT4ge1xyXG4gICAgICAgIHJldHVybiB0cmFpbC5pc0V4dGVuc2lvbk9mKCBjaGlsZFRyZWVOb2RlLnRyYWlsLCB0cnVlICk7XHJcbiAgICAgIH0gKTtcclxuICAgICAgaWYgKCB0cmVlTm9kZSApIHtcclxuICAgICAgICByZXR1cm4gdHJlZU5vZGUuZmluZCggdHJhaWwgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuY2xhc3MgUERPTVRyZWVOb2RlIGV4dGVuZHMgQ29sbGFwc2libGVUcmVlTm9kZTxQRE9NVHJlZU5vZGU+IHtcclxuXHJcbiAgcHVibGljIHRyYWlsOiBUcmFpbDtcclxuICBwdWJsaWMgaW5zdGFuY2U6IFBET01JbnN0YW5jZTtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBpbnN0YW5jZTogUERPTUluc3RhbmNlLCBoZWxwZXI6IEhlbHBlciApIHtcclxuXHJcbiAgICBjb25zdCB0cmFpbCA9IGluc3RhbmNlLnRyYWlsITtcclxuICAgIGNvbnN0IGlzVmlzaWJsZSA9IHRyYWlsLmlzUERPTVZpc2libGUoKTtcclxuXHJcbiAgICBjb25zdCBUUkVFX0ZPTlQgPSBuZXcgRm9udCggeyBzaXplOiAxMiB9ICk7XHJcblxyXG4gICAgY29uc3Qgc2VsZk5vZGUgPSBuZXcgSEJveCggeyBzcGFjaW5nOiA1IH0gKTtcclxuXHJcbiAgICBpZiAoIHRyYWlsLm5vZGVzLmxlbmd0aCApIHtcclxuICAgICAgY29uc3QgZmlsbCA9IGlzVmlzaWJsZSA/ICcjMDAwJyA6ICcjNjBhJztcclxuICAgICAgY29uc3Qgbm9kZSA9IHRyYWlsLmxhc3ROb2RlKCk7XHJcblxyXG4gICAgICBpZiAoIG5vZGUudGFnTmFtZSApIHtcclxuICAgICAgICBzZWxmTm9kZS5hZGRDaGlsZCggbmV3IFRleHQoIG5vZGUudGFnTmFtZSwgeyBmb250OiBuZXcgRm9udCggeyBzaXplOiAxMiwgd2VpZ2h0OiAnYm9sZCcgfSApLCBmaWxsOiBmaWxsIH0gKSApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIG5vZGUubGFiZWxDb250ZW50ICkge1xyXG4gICAgICAgIHNlbGZOb2RlLmFkZENoaWxkKCBuZXcgVGV4dCggbm9kZS5sYWJlbENvbnRlbnQsIHsgZm9udDogVFJFRV9GT05ULCBmaWxsOiAnIzgwMCcgfSApICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBub2RlLmlubmVyQ29udGVudCApIHtcclxuICAgICAgICBzZWxmTm9kZS5hZGRDaGlsZCggbmV3IFRleHQoIG5vZGUuaW5uZXJDb250ZW50LCB7IGZvbnQ6IFRSRUVfRk9OVCwgZmlsbDogJyMwODAnIH0gKSApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggbm9kZS5kZXNjcmlwdGlvbkNvbnRlbnQgKSB7XHJcbiAgICAgICAgc2VsZk5vZGUuYWRkQ2hpbGQoIG5ldyBUZXh0KCBub2RlLmRlc2NyaXB0aW9uQ29udGVudCwgeyBmb250OiBUUkVFX0ZPTlQsIGZpbGw6ICcjNDQ0JyB9ICkgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgcGFyZW50VHJhaWwgPSBpbnN0YW5jZS5wYXJlbnQgPyBpbnN0YW5jZS5wYXJlbnQudHJhaWwhIDogbmV3IFRyYWlsKCk7XHJcbiAgICAgIGNvbnN0IG5hbWUgPSB0cmFpbC5ub2Rlcy5zbGljZSggcGFyZW50VHJhaWwubm9kZXMubGVuZ3RoICkubWFwKCBub2RlID0+IG5vZGUuY29uc3RydWN0b3IubmFtZSApLmZpbHRlciggbiA9PiBuICE9PSAnTm9kZScgKS5qb2luKCAnLCcgKTtcclxuXHJcbiAgICAgIGlmICggbmFtZSApIHtcclxuICAgICAgICBzZWxmTm9kZS5hZGRDaGlsZCggbmV3IFRleHQoIGAoJHtuYW1lfSlgLCB7IGZvbnQ6IFRSRUVfRk9OVCwgZmlsbDogJyMwMDgnIH0gKSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgc2VsZk5vZGUuYWRkQ2hpbGQoIG5ldyBUZXh0KCAnKHJvb3QpJywgeyBmb250OiBUUkVFX0ZPTlQgfSApICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmVmYWN0b3IgdGhpcyBjb2RlIG91dD9cclxuICAgIGNvbnN0IHNlbGZCYWNrZ3JvdW5kID0gUmVjdGFuZ2xlLmJvdW5kcyggc2VsZk5vZGUuYm91bmRzLCB7XHJcbiAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgc2VsZk5vZGVcclxuICAgICAgXSxcclxuICAgICAgY3Vyc29yOiAncG9pbnRlcicsXHJcbiAgICAgIGZpbGw6IG5ldyBEZXJpdmVkUHJvcGVydHkoIFsgaGVscGVyLnNlbGVjdGVkVHJhaWxQcm9wZXJ0eSwgaGVscGVyLnBvaW50ZXJUcmFpbFByb3BlcnR5IF0sICggc2VsZWN0ZWQsIGFjdGl2ZSApID0+IHtcclxuICAgICAgICBpZiAoIHNlbGVjdGVkICYmIHRyYWlsLmVxdWFscyggc2VsZWN0ZWQgKSApIHtcclxuICAgICAgICAgIHJldHVybiAncmdiYSgwLDEyOCwyNTUsMC40KSc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCBhY3RpdmUgJiYgdHJhaWwuZXF1YWxzKCBhY3RpdmUgKSApIHtcclxuICAgICAgICAgIHJldHVybiAncmdiYSgwLDEyOCwyNTUsMC4yKSc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuICd0cmFuc3BhcmVudCc7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LCB7XHJcbiAgICAgICAgdGFuZGVtOiBUYW5kZW0uT1BUX09VVCxcclxuICAgICAgICBzdHJpY3RBeG9uRGVwZW5kZW5jaWVzOiBmYWxzZVxyXG4gICAgICB9IClcclxuICAgIH0gKTtcclxuXHJcbiAgICBpZiAoIHRyYWlsLmxlbmd0aCApIHtcclxuICAgICAgc2VsZkJhY2tncm91bmQuYWRkSW5wdXRMaXN0ZW5lcigge1xyXG4gICAgICAgIGVudGVyOiAoKSA9PiB7XHJcbiAgICAgICAgICBoZWxwZXIudHJlZUhvdmVyVHJhaWxQcm9wZXJ0eS52YWx1ZSA9IHRyYWlsO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZXhpdDogKCkgPT4ge1xyXG4gICAgICAgICAgaGVscGVyLnRyZWVIb3ZlclRyYWlsUHJvcGVydHkudmFsdWUgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG4gICAgICBzZWxmQmFja2dyb3VuZC5hZGRJbnB1dExpc3RlbmVyKCBuZXcgRmlyZUxpc3RlbmVyKCB7XHJcbiAgICAgICAgZmlyZTogKCkgPT4ge1xyXG4gICAgICAgICAgaGVscGVyLnNlbGVjdGVkVHJhaWxQcm9wZXJ0eS52YWx1ZSA9IHRyYWlsO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdGFuZGVtOiBUYW5kZW0uT1BUX09VVFxyXG4gICAgICB9ICkgKTtcclxuICAgIH1cclxuXHJcbiAgICBzdXBlciggc2VsZkJhY2tncm91bmQsIHtcclxuICAgICAgY3JlYXRlQ2hpbGRyZW46ICgpID0+IGluc3RhbmNlLmNoaWxkcmVuLm1hcCggKCBpbnN0YW5jZTogUERPTUluc3RhbmNlICkgPT4gbmV3IFBET01UcmVlTm9kZSggaW5zdGFuY2UsIGhlbHBlciApIClcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLmluc3RhbmNlID0gaW5zdGFuY2U7XHJcbiAgICB0aGlzLnRyYWlsID0gdHJhaWw7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZmluZCggdHJhaWw6IFRyYWlsICk6IFBET01UcmVlTm9kZSB8IG51bGwge1xyXG4gICAgaWYgKCB0cmFpbC5lcXVhbHMoIHRoaXMuaW5zdGFuY2UudHJhaWwhICkgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGNvbnN0IHRyZWVOb2RlID0gXy5maW5kKCB0aGlzLmNoaWxkVHJlZU5vZGVzLCBjaGlsZFRyZWVOb2RlID0+IHtcclxuICAgICAgICByZXR1cm4gdHJhaWwuaXNFeHRlbnNpb25PZiggY2hpbGRUcmVlTm9kZS5pbnN0YW5jZS50cmFpbCEsIHRydWUgKTtcclxuICAgICAgfSApO1xyXG4gICAgICBpZiAoIHRyZWVOb2RlICkge1xyXG4gICAgICAgIHJldHVybiB0cmVlTm9kZS5maW5kKCB0cmFpbCApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5jbGFzcyBUcmVlTm9kZTxUIGV4dGVuZHMgKCBWaXN1YWxUcmVlTm9kZSB8IFBET01UcmVlTm9kZSApPiBleHRlbmRzIFJlY3RhbmdsZSB7XHJcblxyXG4gIHB1YmxpYyB0cmVlQ29udGFpbmVyOiBOb2RlO1xyXG4gIHB1YmxpYyB0cmVlTm9kZT86IFQ7XHJcbiAgcHVibGljIGhlbHBlcjogSGVscGVyO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHZpc2libGVQcm9wZXJ0eTogVFByb3BlcnR5PGJvb2xlYW4+LCBoZWxwZXI6IEhlbHBlciwgY3JlYXRlVHJlZU5vZGU6ICgpID0+IFQgKSB7XHJcbiAgICBzdXBlcigge1xyXG4gICAgICBmaWxsOiAncmdiYSgyNTUsMjU1LDI1NSwwLjg1KScsXHJcbiAgICAgIHN0cm9rZTogJ2JsYWNrJyxcclxuICAgICAgcmVjdFdpZHRoOiA0MDAsXHJcbiAgICAgIHZpc2libGVQcm9wZXJ0eTogdmlzaWJsZVByb3BlcnR5LFxyXG4gICAgICBwaWNrYWJsZTogdHJ1ZVxyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuaGVscGVyID0gaGVscGVyO1xyXG5cclxuICAgIHRoaXMudHJlZUNvbnRhaW5lciA9IG5ldyBOb2RlKCk7XHJcbiAgICB0aGlzLmFkZENoaWxkKCB0aGlzLnRyZWVDb250YWluZXIgKTtcclxuXHJcbiAgICB0aGlzLmFkZElucHV0TGlzdGVuZXIoIG5ldyBEcmFnTGlzdGVuZXIoIHtcclxuICAgICAgdGFyZ2V0Tm9kZTogdGhpcyxcclxuICAgICAgZHJhZzogKCBldmVudCwgbGlzdGVuZXIgKSA9PiB7XHJcbiAgICAgICAgdGhpcy54ID0gdGhpcy54ICsgbGlzdGVuZXIubW9kZWxEZWx0YS54O1xyXG4gICAgICB9LFxyXG4gICAgICB0YW5kZW06IFRhbmRlbS5PUFRfT1VUXHJcbiAgICB9ICkgKTtcclxuICAgIHRoaXMuYWRkSW5wdXRMaXN0ZW5lcigge1xyXG4gICAgICB3aGVlbDogZXZlbnQgPT4ge1xyXG4gICAgICAgIGNvbnN0IGRlbHRhWCA9IGV2ZW50LmRvbUV2ZW50IS5kZWx0YVg7XHJcbiAgICAgICAgY29uc3QgZGVsdGFZID0gZXZlbnQuZG9tRXZlbnQhLmRlbHRhWTtcclxuICAgICAgICBjb25zdCBtdWx0aXBsaWVyID0gMTtcclxuICAgICAgICBpZiAoIHRoaXMudHJlZU5vZGUgKSB7XHJcbiAgICAgICAgICB0aGlzLnRyZWVOb2RlLnggLT0gZGVsdGFYICogbXVsdGlwbGllcjtcclxuICAgICAgICAgIHRoaXMudHJlZU5vZGUueSAtPSBkZWx0YVkgKiBtdWx0aXBsaWVyO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmNvbnN0cmFpblRyZWUoKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIFdoZW4gdGhlcmUgaXNuJ3QgYSBzZWxlY3RlZCB0cmFpbCwgZm9jdXMgd2hhdGV2ZXIgb3VyIHBvaW50ZXIgaXMgb3ZlclxyXG4gICAgaGVscGVyLnBvaW50ZXJUcmFpbFByb3BlcnR5LmxhenlMaW5rKCAoKSA9PiB7XHJcbiAgICAgIGlmICggIWhlbHBlci5zZWxlY3RlZFRyYWlsUHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgICAgdGhpcy5mb2N1c1BvaW50ZXIoKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIE11bHRpbGluay5tdWx0aWxpbmsoIFsgaGVscGVyLmFjdGl2ZVByb3BlcnR5LCB2aXNpYmxlUHJvcGVydHkgXSwgKCBhY3RpdmUsIHRyZWVWaXNpYmxlICkgPT4ge1xyXG4gICAgICBpZiAoIGFjdGl2ZSAmJiB0cmVlVmlzaWJsZSApIHtcclxuICAgICAgICB0aGlzLnRyZWVOb2RlID0gY3JlYXRlVHJlZU5vZGUoKTtcclxuXHJcbiAgICAgICAgLy8gSGF2ZSB0aGUgY29uc3RyYWluIHByb3Blcmx5IHBvc2l0aW9uIGl0XHJcbiAgICAgICAgdGhpcy50cmVlTm9kZS54ID0gNTAwO1xyXG4gICAgICAgIHRoaXMudHJlZU5vZGUueSA9IDUwMDtcclxuXHJcbiAgICAgICAgdGhpcy50cmVlQ29udGFpbmVyLmNoaWxkcmVuID0gWyB0aGlzLnRyZWVOb2RlIF07XHJcbiAgICAgICAgdGhpcy5mb2N1c1NlbGVjdGVkKCk7XHJcbiAgICAgICAgdGhpcy5jb25zdHJhaW5UcmVlKCk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdGhpcy50cmVlQ29udGFpbmVyLmNoaWxkcmVuID0gW107XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyByZXNpemUoIHNpemU6IERpbWVuc2lvbjIgKTogdm9pZCB7XHJcbiAgICB0aGlzLnJlY3RIZWlnaHQgPSBzaXplLmhlaWdodDtcclxuICAgIHRoaXMucmlnaHQgPSBzaXplLndpZHRoO1xyXG4gICAgdGhpcy50cmVlQ29udGFpbmVyLmNsaXBBcmVhID0gU2hhcGUuYm91bmRzKCB0aGlzLmxvY2FsQm91bmRzLmRpbGF0ZWQoIDEwICkgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBjb25zdHJhaW5UcmVlKCk6IHZvaWQge1xyXG4gICAgY29uc3QgdHJlZU1hcmdpblggPSA4O1xyXG4gICAgY29uc3QgdHJlZU1hcmdpblkgPSA1O1xyXG5cclxuICAgIGlmICggdGhpcy50cmVlTm9kZSApIHtcclxuICAgICAgaWYgKCB0aGlzLnRyZWVOb2RlLmJvdHRvbSA8IHRoaXMuc2VsZkJvdW5kcy5ib3R0b20gLSB0cmVlTWFyZ2luWSApIHtcclxuICAgICAgICB0aGlzLnRyZWVOb2RlLmJvdHRvbSA9IHRoaXMuc2VsZkJvdW5kcy5ib3R0b20gLSB0cmVlTWFyZ2luWTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIHRoaXMudHJlZU5vZGUudG9wID4gdGhpcy5zZWxmQm91bmRzLnRvcCArIHRyZWVNYXJnaW5ZICkge1xyXG4gICAgICAgIHRoaXMudHJlZU5vZGUudG9wID0gdGhpcy5zZWxmQm91bmRzLnRvcCArIHRyZWVNYXJnaW5ZO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggdGhpcy50cmVlTm9kZS5yaWdodCA8IHRoaXMuc2VsZkJvdW5kcy5yaWdodCAtIHRyZWVNYXJnaW5YICkge1xyXG4gICAgICAgIHRoaXMudHJlZU5vZGUucmlnaHQgPSB0aGlzLnNlbGZCb3VuZHMucmlnaHQgLSB0cmVlTWFyZ2luWDtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIHRoaXMudHJlZU5vZGUubGVmdCA+IHRoaXMuc2VsZkJvdW5kcy5sZWZ0ICsgdHJlZU1hcmdpblggKSB7XHJcbiAgICAgICAgdGhpcy50cmVlTm9kZS5sZWZ0ID0gdGhpcy5zZWxmQm91bmRzLmxlZnQgKyB0cmVlTWFyZ2luWDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIGZvY3VzVHJhaWwoIHRyYWlsOiBUcmFpbCApOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy50cmVlTm9kZSApIHtcclxuICAgICAgY29uc3QgdHJlZU5vZGUgPSB0aGlzLnRyZWVOb2RlLmZpbmQoIHRyYWlsICk7XHJcbiAgICAgIGlmICggdHJlZU5vZGUgKSB7XHJcbiAgICAgICAgY29uc3QgZGVsdGFZID0gdHJlZU5vZGUubG9jYWxUb0dsb2JhbFBvaW50KCB0cmVlTm9kZS5zZWxmTm9kZS5jZW50ZXIgKS55IC0gdGhpcy5jZW50ZXJZO1xyXG4gICAgICAgIHRoaXMudHJlZU5vZGUueSAtPSBkZWx0YVk7XHJcbiAgICAgICAgdGhpcy5jb25zdHJhaW5UcmVlKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBmb2N1c1BvaW50ZXIoKTogdm9pZCB7XHJcbiAgICBpZiAoIHRoaXMuaGVscGVyLnBvaW50ZXJUcmFpbFByb3BlcnR5LnZhbHVlICkge1xyXG4gICAgICB0aGlzLmZvY3VzVHJhaWwoIHRoaXMuaGVscGVyLnBvaW50ZXJUcmFpbFByb3BlcnR5LnZhbHVlICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZm9jdXNTZWxlY3RlZCgpOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy5oZWxwZXIuc2VsZWN0ZWRUcmFpbFByb3BlcnR5LnZhbHVlID09PSBudWxsICkgeyByZXR1cm47IH1cclxuXHJcbiAgICB0aGlzLmZvY3VzVHJhaWwoIHRoaXMuaGVscGVyLnNlbGVjdGVkVHJhaWxQcm9wZXJ0eS52YWx1ZSApO1xyXG4gIH1cclxufVxyXG5cclxuY29uc3QgY3JlYXRlSGVhZGVyVGV4dCA9ICggc3RyOiBzdHJpbmcsIG5vZGU/OiBOb2RlLCBvcHRpb25zPzogVGV4dE9wdGlvbnMgKSA9PiB7XHJcbiAgcmV0dXJuIG5ldyBUZXh0KCBzdHIsIG1lcmdlKCB7XHJcbiAgICBmb250U2l6ZTogMTQsXHJcbiAgICBmb250V2VpZ2h0OiAnYm9sZCcsXHJcbiAgICB2aXNpYmxlUHJvcGVydHk6IG5vZGUgPyBuZXcgRGVyaXZlZFByb3BlcnR5KCBbIG5vZGUuYm91bmRzUHJvcGVydHkgXSwgYm91bmRzID0+IHtcclxuICAgICAgcmV0dXJuICFib3VuZHMuaXNFbXB0eSgpO1xyXG4gICAgfSwge1xyXG4gICAgICBzdHJpY3RBeG9uRGVwZW5kZW5jaWVzOiBmYWxzZVxyXG4gICAgfSApIDogbmV3IFRpbnlQcm9wZXJ0eSggdHJ1ZSApXHJcbiAgfSwgb3B0aW9ucyApICk7XHJcbn07XHJcblxyXG5jb25zdCBjcmVhdGVDb2xsYXBzaWJsZUhlYWRlclRleHQgPSAoIHN0cjogc3RyaW5nLCB2aXNpYmxlUHJvcGVydHk6IFByb3BlcnR5PGJvb2xlYW4+LCBub2RlPzogTm9kZSwgb3B0aW9ucz86IFRleHRPcHRpb25zICkgPT4ge1xyXG4gIGNvbnN0IGhlYWRlclRleHQgPSBjcmVhdGVIZWFkZXJUZXh0KCBzdHIsIG5vZGUsIG9wdGlvbnMgKTtcclxuICBoZWFkZXJUZXh0LmFkZElucHV0TGlzdGVuZXIoIG5ldyBGaXJlTGlzdGVuZXIoIHtcclxuICAgIGZpcmU6ICgpID0+IHtcclxuICAgICAgdmlzaWJsZVByb3BlcnR5LnZhbHVlID0gIXZpc2libGVQcm9wZXJ0eS52YWx1ZTtcclxuICAgIH0sXHJcbiAgICB0YW5kZW06IFRhbmRlbS5PUFRfT1VUXHJcbiAgfSApICk7XHJcbiAgaGVhZGVyVGV4dC5jdXJzb3IgPSAncG9pbnRlcic7XHJcbiAgcmV0dXJuIG5ldyBIQm94KCB7XHJcbiAgICBzcGFjaW5nOiA3LFxyXG4gICAgY2hpbGRyZW46IFtcclxuICAgICAgbmV3IEV4cGFuZENvbGxhcHNlQnV0dG9uKCB2aXNpYmxlUHJvcGVydHksIHsgdGFuZGVtOiBUYW5kZW0uT1BUX09VVCwgc2lkZUxlbmd0aDogMTQgfSApLFxyXG4gICAgICBoZWFkZXJUZXh0XHJcbiAgICBdLFxyXG4gICAgdmlzaWJsZVByb3BlcnR5OiBoZWFkZXJUZXh0LnZpc2libGVQcm9wZXJ0eVxyXG4gIH0gKTtcclxufTtcclxuXHJcbmNsYXNzIE1hdHJpeDNOb2RlIGV4dGVuZHMgR3JpZEJveCB7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBtYXRyaXg6IE1hdHJpeDMgKSB7XHJcbiAgICBzdXBlcigge1xyXG4gICAgICB4U3BhY2luZzogNSxcclxuICAgICAgeVNwYWNpbmc6IDAsXHJcbiAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgbmV3IFRleHQoIG1hdHJpeC5tMDAoKSwgeyBsYXlvdXRPcHRpb25zOiB7IGNvbHVtbjogMCwgcm93OiAwIH0gfSApLFxyXG4gICAgICAgIG5ldyBUZXh0KCBtYXRyaXgubTAxKCksIHsgbGF5b3V0T3B0aW9uczogeyBjb2x1bW46IDEsIHJvdzogMCB9IH0gKSxcclxuICAgICAgICBuZXcgVGV4dCggbWF0cml4Lm0wMigpLCB7IGxheW91dE9wdGlvbnM6IHsgY29sdW1uOiAyLCByb3c6IDAgfSB9ICksXHJcbiAgICAgICAgbmV3IFRleHQoIG1hdHJpeC5tMTAoKSwgeyBsYXlvdXRPcHRpb25zOiB7IGNvbHVtbjogMCwgcm93OiAxIH0gfSApLFxyXG4gICAgICAgIG5ldyBUZXh0KCBtYXRyaXgubTExKCksIHsgbGF5b3V0T3B0aW9uczogeyBjb2x1bW46IDEsIHJvdzogMSB9IH0gKSxcclxuICAgICAgICBuZXcgVGV4dCggbWF0cml4Lm0xMigpLCB7IGxheW91dE9wdGlvbnM6IHsgY29sdW1uOiAyLCByb3c6IDEgfSB9ICksXHJcbiAgICAgICAgbmV3IFRleHQoIG1hdHJpeC5tMjAoKSwgeyBsYXlvdXRPcHRpb25zOiB7IGNvbHVtbjogMCwgcm93OiAyIH0gfSApLFxyXG4gICAgICAgIG5ldyBUZXh0KCBtYXRyaXgubTIxKCksIHsgbGF5b3V0T3B0aW9uczogeyBjb2x1bW46IDEsIHJvdzogMiB9IH0gKSxcclxuICAgICAgICBuZXcgVGV4dCggbWF0cml4Lm0yMigpLCB7IGxheW91dE9wdGlvbnM6IHsgY29sdW1uOiAyLCByb3c6IDIgfSB9IClcclxuICAgICAgXVxyXG4gICAgfSApO1xyXG4gIH1cclxufVxyXG5cclxuY2xhc3MgU2hhcGVOb2RlIGV4dGVuZHMgUGF0aCB7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBzaGFwZTogU2hhcGUgKSB7XHJcbiAgICBzdXBlciggc2hhcGUsIHtcclxuICAgICAgbWF4V2lkdGg6IDE1LFxyXG4gICAgICBtYXhIZWlnaHQ6IDE1LFxyXG4gICAgICBzdHJva2U6ICdibGFjaycsXHJcbiAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxyXG4gICAgICBzdHJva2VQaWNrYWJsZTogdHJ1ZVxyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuYWRkSW5wdXRMaXN0ZW5lciggbmV3IEZpcmVMaXN0ZW5lcigge1xyXG4gICAgICBmaXJlOiAoKSA9PiBjb3B5VG9DbGlwYm9hcmQoIHNoYXBlLmdldFNWR1BhdGgoKSApLFxyXG4gICAgICB0YW5kZW06IFRhbmRlbS5PUFRfT1VUXHJcbiAgICB9ICkgKTtcclxuICB9XHJcbn1cclxuXHJcbmNsYXNzIEltYWdlTm9kZSBleHRlbmRzIEltYWdlIHtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoIGltYWdlOiBJbWFnZSApIHtcclxuICAgIHN1cGVyKCBpbWFnZS5nZXRJbWFnZSgpLCB7XHJcbiAgICAgIG1heFdpZHRoOiAxNSxcclxuICAgICAgbWF4SGVpZ2h0OiAxNVxyXG4gICAgfSApO1xyXG4gIH1cclxufVxyXG5cclxuY29uc3QgY3JlYXRlSW5mbyA9ICggdHJhaWw6IFRyYWlsICk6IE5vZGVbXSA9PiB7XHJcbiAgY29uc3QgY2hpbGRyZW4gPSBbXTtcclxuICBjb25zdCBub2RlID0gdHJhaWwubGFzdE5vZGUoKTtcclxuXHJcbiAgY29uc3QgdHlwZXMgPSBpbmhlcml0YW5jZSggbm9kZS5jb25zdHJ1Y3RvciApLm1hcCggdHlwZSA9PiB0eXBlLm5hbWUgKS5maWx0ZXIoIG5hbWUgPT4ge1xyXG4gICAgcmV0dXJuIG5hbWUgJiYgbmFtZSAhPT0gJ09iamVjdCc7XHJcbiAgfSApO1xyXG4gIGNvbnN0IHJlZHVjZWRUeXBlcyA9IHR5cGVzLmluY2x1ZGVzKCAnTm9kZScgKSA/IHR5cGVzLnNsaWNlKCAwLCB0eXBlcy5pbmRleE9mKCAnTm9kZScgKSApIDogdHlwZXM7XHJcblxyXG4gIGlmICggcmVkdWNlZFR5cGVzLmxlbmd0aCA+IDAgKSB7XHJcbiAgICBjaGlsZHJlbi5wdXNoKCBuZXcgUmljaFRleHQoIHJlZHVjZWRUeXBlcy5tYXAoICggc3RyOiBzdHJpbmcsIGk6IG51bWJlciApID0+IHtcclxuICAgICAgcmV0dXJuIGkgPT09IDAgPyBgPGI+JHtzdHJ9PC9iPmAgOiBgPGJyPiZuYnNwOyR7Xy5yZXBlYXQoICcgICcsIGkgKX1leHRlbmRzICR7c3RyfWA7XHJcbiAgICB9ICkuam9pbiggJycgKSwgeyBmb250OiBuZXcgUGhldEZvbnQoIDEyICkgfSApICk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBhZGRSYXcgPSAoIGtleTogc3RyaW5nLCB2YWx1ZU5vZGU6IE5vZGUgKSA9PiB7XHJcbiAgICBjaGlsZHJlbi5wdXNoKCBuZXcgSEJveCgge1xyXG4gICAgICBzcGFjaW5nOiAwLFxyXG4gICAgICBhbGlnbjogJ3RvcCcsXHJcbiAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgbmV3IFRleHQoIGtleSArICc6ICcsIHsgZm9udFNpemU6IDEyIH0gKSxcclxuICAgICAgICB2YWx1ZU5vZGVcclxuICAgICAgXVxyXG4gICAgfSApICk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgYWRkU2ltcGxlID0gKCBrZXk6IHN0cmluZywgdmFsdWU6IHVua25vd24gKSA9PiB7XHJcbiAgICBpZiAoIHZhbHVlICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgIGFkZFJhdygga2V5LCBuZXcgUmljaFRleHQoICcnICsgdmFsdWUsIHtcclxuICAgICAgICBsaW5lV3JhcDogNDAwLFxyXG4gICAgICAgIGZvbnQ6IG5ldyBQaGV0Rm9udCggMTIgKSxcclxuICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcclxuICAgICAgICBpbnB1dExpc3RlbmVyczogW1xyXG4gICAgICAgICAgbmV3IEZpcmVMaXN0ZW5lcigge1xyXG4gICAgICAgICAgICBmaXJlOiAoKSA9PiBjb3B5VG9DbGlwYm9hcmQoICcnICsgdmFsdWUgKSxcclxuICAgICAgICAgICAgdGFuZGVtOiBUYW5kZW0uT1BUX09VVFxyXG4gICAgICAgICAgfSApXHJcbiAgICAgICAgXVxyXG4gICAgICB9ICkgKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjb25zdCBjb2xvclN3YXRjaCA9ICggY29sb3I6IENvbG9yICk6IE5vZGUgPT4ge1xyXG4gICAgcmV0dXJuIG5ldyBIQm94KCB7XHJcbiAgICAgIHNwYWNpbmc6IDQsXHJcbiAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgbmV3IFJlY3RhbmdsZSggMCwgMCwgMTAsIDEwLCB7IGZpbGw6IGNvbG9yLCBzdHJva2U6ICdibGFjaycsIGxpbmVXaWR0aDogMC41IH0gKSxcclxuICAgICAgICBuZXcgVGV4dCggY29sb3IudG9IZXhTdHJpbmcoKSwgeyBmb250U2l6ZTogMTIgfSApLFxyXG4gICAgICAgIG5ldyBUZXh0KCBjb2xvci50b0NTUygpLCB7IGZvbnRTaXplOiAxMiB9IClcclxuICAgICAgXSxcclxuICAgICAgY3Vyc29yOiAncG9pbnRlcicsXHJcbiAgICAgIGlucHV0TGlzdGVuZXJzOiBbXHJcbiAgICAgICAgbmV3IEZpcmVMaXN0ZW5lcigge1xyXG4gICAgICAgICAgZmlyZTogKCkgPT4gY29weVRvQ2xpcGJvYXJkKCBjb2xvci50b0hleFN0cmluZygpICksXHJcbiAgICAgICAgICB0YW5kZW06IFRhbmRlbS5PUFRfT1VUXHJcbiAgICAgICAgfSApXHJcbiAgICAgIF1cclxuICAgIH0gKTtcclxuICB9O1xyXG5cclxuICBjb25zdCBhZGRDb2xvciA9ICgga2V5OiBzdHJpbmcsIGNvbG9yOiBUQ29sb3IgKSA9PiB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBpQ29sb3JUb0NvbG9yKCBjb2xvciApO1xyXG4gICAgaWYgKCByZXN1bHQgIT09IG51bGwgKSB7XHJcbiAgICAgIGFkZFJhdygga2V5LCBjb2xvclN3YXRjaCggcmVzdWx0ICkgKTtcclxuICAgIH1cclxuICB9O1xyXG4gIGNvbnN0IGFkZFBhaW50ID0gKCBrZXk6IHN0cmluZywgcGFpbnQ6IFRQYWludCApID0+IHtcclxuICAgIGNvbnN0IHN0b3BUb05vZGUgPSAoIHN0b3A6IEdyYWRpZW50U3RvcCApOiBOb2RlID0+IHtcclxuICAgICAgcmV0dXJuIG5ldyBIQm94KCB7XHJcbiAgICAgICAgc3BhY2luZzogMyxcclxuICAgICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgICAgbmV3IFRleHQoIHN0b3AucmF0aW8sIHsgZm9udFNpemU6IDEyIH0gKSxcclxuICAgICAgICAgIGNvbG9yU3dhdGNoKCBpQ29sb3JUb0NvbG9yKCBzdG9wLmNvbG9yICkgfHwgQ29sb3IuVFJBTlNQQVJFTlQgKVxyXG4gICAgICAgIF1cclxuICAgICAgfSApO1xyXG4gICAgfTtcclxuXHJcbiAgICBpZiAoIHBhaW50IGluc3RhbmNlb2YgUGFpbnQgKSB7XHJcbiAgICAgIGlmICggcGFpbnQgaW5zdGFuY2VvZiBMaW5lYXJHcmFkaWVudCApIHtcclxuICAgICAgICBhZGRSYXcoIGtleSwgbmV3IFZCb3goIHtcclxuICAgICAgICAgIGFsaWduOiAnbGVmdCcsXHJcbiAgICAgICAgICBzcGFjaW5nOiAzLFxyXG4gICAgICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICAgICAgbmV3IFRleHQoIGBMaW5lYXJHcmFkaWVudCAoJHtwYWludC5zdGFydC54fSwke3BhaW50LnN0YXJ0Lnl9KSA9PiAoJHtwYWludC5lbmQueH0sJHtwYWludC5lbmQueX0pYCwgeyBmb250U2l6ZTogMTIgfSApLFxyXG4gICAgICAgICAgICAuLi5wYWludC5zdG9wcy5tYXAoIHN0b3BUb05vZGUgKVxyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH0gKSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCBwYWludCBpbnN0YW5jZW9mIFJhZGlhbEdyYWRpZW50ICkge1xyXG4gICAgICAgIGFkZFJhdygga2V5LCBuZXcgVkJveCgge1xyXG4gICAgICAgICAgYWxpZ246ICdsZWZ0JyxcclxuICAgICAgICAgIHNwYWNpbmc6IDMsXHJcbiAgICAgICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgICAgICBuZXcgVGV4dCggYFJhZGlhbEdyYWRpZW50ICgke3BhaW50LnN0YXJ0Lnh9LCR7cGFpbnQuc3RhcnQueX0pICR7cGFpbnQuc3RhcnRSYWRpdXN9ID0+ICgke3BhaW50LmVuZC54fSwke3BhaW50LmVuZC55fSkgJHtwYWludC5lbmRSYWRpdXN9YCwgeyBmb250U2l6ZTogMTIgfSApLFxyXG4gICAgICAgICAgICAuLi5wYWludC5zdG9wcy5tYXAoIHN0b3BUb05vZGUgKVxyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH0gKSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCBwYWludCBpbnN0YW5jZW9mIFBhdHRlcm4gKSB7XHJcbiAgICAgICAgYWRkUmF3KCBrZXksIG5ldyBWQm94KCB7XHJcbiAgICAgICAgICBhbGlnbjogJ2xlZnQnLFxyXG4gICAgICAgICAgc3BhY2luZzogMyxcclxuICAgICAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgICAgIG5ldyBUZXh0KCAnUGF0dGVybicsIHsgZm9udFNpemU6IDEyIH0gKSxcclxuICAgICAgICAgICAgbmV3IEltYWdlKCBwYWludC5pbWFnZSwgeyBtYXhXaWR0aDogMTAsIG1heEhlaWdodDogMTAgfSApXHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfSApICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBhZGRDb2xvcigga2V5LCBwYWludCApO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGFkZE51bWJlciA9ICgga2V5OiBzdHJpbmcsIG51bWJlcjogbnVtYmVyICkgPT4gYWRkU2ltcGxlKCBrZXksIG51bWJlciApO1xyXG4gIGNvbnN0IGFkZE1hdHJpeDMgPSAoIGtleTogc3RyaW5nLCBtYXRyaXg6IE1hdHJpeDMgKSA9PiBhZGRSYXcoIGtleSwgbmV3IE1hdHJpeDNOb2RlKCBtYXRyaXggKSApO1xyXG4gIGNvbnN0IGFkZEJvdW5kczIgPSAoIGtleTogc3RyaW5nLCBib3VuZHM6IEJvdW5kczIgKSA9PiB7XHJcbiAgICBpZiAoIGJvdW5kcy5lcXVhbHMoIEJvdW5kczIuTk9USElORyApICkge1xyXG4gICAgICAvLyBETyBub3RoaW5nXHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggYm91bmRzLmVxdWFscyggQm91bmRzMi5FVkVSWVRISU5HICkgKSB7XHJcbiAgICAgIGFkZFNpbXBsZSgga2V5LCAnZXZlcnl0aGluZycgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBhZGRSYXcoIGtleSwgbmV3IFJpY2hUZXh0KCBgeDogWyR7Ym91bmRzLm1pblh9LCAke2JvdW5kcy5tYXhYfV08YnI+eTogWyR7Ym91bmRzLm1pbll9LCAke2JvdW5kcy5tYXhZfV1gLCB7IGZvbnQ6IG5ldyBQaGV0Rm9udCggMTIgKSB9ICkgKTtcclxuICAgIH1cclxuICB9O1xyXG4gIGNvbnN0IGFkZFNoYXBlID0gKCBrZXk6IHN0cmluZywgc2hhcGU6IFNoYXBlICkgPT4gYWRkUmF3KCBrZXksIG5ldyBTaGFwZU5vZGUoIHNoYXBlICkgKTtcclxuICBjb25zdCBhZGRJbWFnZSA9ICgga2V5OiBzdHJpbmcsIGltYWdlOiBJbWFnZSApID0+IGFkZFJhdygga2V5LCBuZXcgSW1hZ2VOb2RlKCBpbWFnZSApICk7XHJcblxyXG4gIGlmICggbm9kZS50YW5kZW0uc3VwcGxpZWQgKSB7XHJcbiAgICBhZGRTaW1wbGUoICd0YW5kZW0nLCBub2RlLnRhbmRlbS5waGV0aW9JRC5zcGxpdCggJy4nICkuam9pbiggJyAnICkgKTtcclxuICB9XHJcblxyXG4gIGlmICggbm9kZSBpbnN0YW5jZW9mIERPTSApIHtcclxuICAgIGFkZFNpbXBsZSggJ2VsZW1lbnQnLCBub2RlLmVsZW1lbnQuY29uc3RydWN0b3IubmFtZSApO1xyXG4gIH1cclxuXHJcbiAgaWYgKCBleHRlbmRzV2lkdGhTaXphYmxlKCBub2RlICkgKSB7XHJcbiAgICAhbm9kZS53aWR0aFNpemFibGUgJiYgYWRkU2ltcGxlKCAnd2lkdGhTaXphYmxlJywgbm9kZS53aWR0aFNpemFibGUgKTtcclxuICAgIG5vZGUucHJlZmVycmVkV2lkdGggIT09IG51bGwgJiYgYWRkU2ltcGxlKCAncHJlZmVycmVkV2lkdGgnLCBub2RlLnByZWZlcnJlZFdpZHRoICk7XHJcbiAgICBub2RlLnByZWZlcnJlZFdpZHRoICE9PSBub2RlLmxvY2FsUHJlZmVycmVkV2lkdGggJiYgYWRkU2ltcGxlKCAnbG9jYWxQcmVmZXJyZWRXaWR0aCcsIG5vZGUubG9jYWxQcmVmZXJyZWRXaWR0aCApO1xyXG4gICAgbm9kZS5taW5pbXVtV2lkdGggIT09IG51bGwgJiYgYWRkU2ltcGxlKCAnbWluaW11bVdpZHRoJywgbm9kZS5taW5pbXVtV2lkdGggKTtcclxuICAgIG5vZGUubWluaW11bVdpZHRoICE9PSBub2RlLmxvY2FsTWluaW11bVdpZHRoICYmIGFkZFNpbXBsZSggJ2xvY2FsTWluaW11bVdpZHRoJywgbm9kZS5sb2NhbE1pbmltdW1XaWR0aCApO1xyXG4gIH1cclxuXHJcbiAgaWYgKCBleHRlbmRzSGVpZ2h0U2l6YWJsZSggbm9kZSApICkge1xyXG4gICAgIW5vZGUuaGVpZ2h0U2l6YWJsZSAmJiBhZGRTaW1wbGUoICdoZWlnaHRTaXphYmxlJywgbm9kZS5oZWlnaHRTaXphYmxlICk7XHJcbiAgICBub2RlLnByZWZlcnJlZEhlaWdodCAhPT0gbnVsbCAmJiBhZGRTaW1wbGUoICdwcmVmZXJyZWRIZWlnaHQnLCBub2RlLnByZWZlcnJlZEhlaWdodCApO1xyXG4gICAgbm9kZS5wcmVmZXJyZWRIZWlnaHQgIT09IG5vZGUubG9jYWxQcmVmZXJyZWRIZWlnaHQgJiYgYWRkU2ltcGxlKCAnbG9jYWxQcmVmZXJyZWRIZWlnaHQnLCBub2RlLmxvY2FsUHJlZmVycmVkSGVpZ2h0ICk7XHJcbiAgICBub2RlLm1pbmltdW1IZWlnaHQgIT09IG51bGwgJiYgYWRkU2ltcGxlKCAnbWluaW11bUhlaWdodCcsIG5vZGUubWluaW11bUhlaWdodCApO1xyXG4gICAgbm9kZS5taW5pbXVtSGVpZ2h0ICE9PSBub2RlLmxvY2FsTWluaW11bUhlaWdodCAmJiBhZGRTaW1wbGUoICdsb2NhbE1pbmltdW1IZWlnaHQnLCBub2RlLmxvY2FsTWluaW11bUhlaWdodCApO1xyXG4gIH1cclxuXHJcbiAgaWYgKCBub2RlLmxheW91dE9wdGlvbnMgKSB7XHJcbiAgICBhZGRTaW1wbGUoICdsYXlvdXRPcHRpb25zJywgSlNPTi5zdHJpbmdpZnkoIG5vZGUubGF5b3V0T3B0aW9ucywgbnVsbCwgMiApICk7XHJcbiAgfVxyXG5cclxuICBpZiAoIG5vZGUgaW5zdGFuY2VvZiBMYXlvdXROb2RlICkge1xyXG4gICAgIW5vZGUucmVzaXplICYmIGFkZFNpbXBsZSggJ3Jlc2l6ZScsIG5vZGUucmVzaXplICk7XHJcbiAgICAhbm9kZS5sYXlvdXRPcmlnaW4uZXF1YWxzKCBWZWN0b3IyLlpFUk8gKSAmJiBhZGRTaW1wbGUoICdsYXlvdXRPcmlnaW4nLCBub2RlLmxheW91dE9yaWdpbiApO1xyXG4gIH1cclxuXHJcbiAgaWYgKCBub2RlIGluc3RhbmNlb2YgRmxvd0JveCApIHtcclxuICAgIGFkZFNpbXBsZSggJ29yaWVudGF0aW9uJywgbm9kZS5vcmllbnRhdGlvbiApO1xyXG4gICAgYWRkU2ltcGxlKCAnYWxpZ24nLCBub2RlLmFsaWduICk7XHJcbiAgICBub2RlLnNwYWNpbmcgJiYgYWRkU2ltcGxlKCAnc3BhY2luZycsIG5vZGUuc3BhY2luZyApO1xyXG4gICAgbm9kZS5saW5lU3BhY2luZyAmJiBhZGRTaW1wbGUoICdsaW5lU3BhY2luZycsIG5vZGUubGluZVNwYWNpbmcgKTtcclxuICAgIGFkZFNpbXBsZSggJ2p1c3RpZnknLCBub2RlLmp1c3RpZnkgKTtcclxuICAgIG5vZGUuanVzdGlmeUxpbmVzICYmIGFkZFNpbXBsZSggJ2p1c3RpZnlMaW5lcycsIG5vZGUuanVzdGlmeUxpbmVzICk7XHJcbiAgICBub2RlLndyYXAgJiYgYWRkU2ltcGxlKCAnd3JhcCcsIG5vZGUud3JhcCApO1xyXG4gICAgbm9kZS5zdHJldGNoICYmIGFkZFNpbXBsZSggJ3N0cmV0Y2gnLCBub2RlLnN0cmV0Y2ggKTtcclxuICAgIG5vZGUuZ3JvdyAmJiBhZGRTaW1wbGUoICdncm93Jywgbm9kZS5ncm93ICk7XHJcbiAgICBub2RlLmxlZnRNYXJnaW4gJiYgYWRkU2ltcGxlKCAnbGVmdE1hcmdpbicsIG5vZGUubGVmdE1hcmdpbiApO1xyXG4gICAgbm9kZS5yaWdodE1hcmdpbiAmJiBhZGRTaW1wbGUoICdyaWdodE1hcmdpbicsIG5vZGUucmlnaHRNYXJnaW4gKTtcclxuICAgIG5vZGUudG9wTWFyZ2luICYmIGFkZFNpbXBsZSggJ3RvcE1hcmdpbicsIG5vZGUudG9wTWFyZ2luICk7XHJcbiAgICBub2RlLmJvdHRvbU1hcmdpbiAmJiBhZGRTaW1wbGUoICdib3R0b21NYXJnaW4nLCBub2RlLmJvdHRvbU1hcmdpbiApO1xyXG4gICAgbm9kZS5taW5Db250ZW50V2lkdGggIT09IG51bGwgJiYgYWRkU2ltcGxlKCAnbWluQ29udGVudFdpZHRoJywgbm9kZS5taW5Db250ZW50V2lkdGggKTtcclxuICAgIG5vZGUubWluQ29udGVudEhlaWdodCAhPT0gbnVsbCAmJiBhZGRTaW1wbGUoICdtaW5Db250ZW50SGVpZ2h0Jywgbm9kZS5taW5Db250ZW50SGVpZ2h0ICk7XHJcbiAgICBub2RlLm1heENvbnRlbnRXaWR0aCAhPT0gbnVsbCAmJiBhZGRTaW1wbGUoICdtYXhDb250ZW50V2lkdGgnLCBub2RlLm1heENvbnRlbnRXaWR0aCApO1xyXG4gICAgbm9kZS5tYXhDb250ZW50SGVpZ2h0ICE9PSBudWxsICYmIGFkZFNpbXBsZSggJ21heENvbnRlbnRIZWlnaHQnLCBub2RlLm1heENvbnRlbnRIZWlnaHQgKTtcclxuICB9XHJcblxyXG4gIGlmICggbm9kZSBpbnN0YW5jZW9mIEdyaWRCb3ggKSB7XHJcbiAgICBhZGRTaW1wbGUoICd4QWxpZ24nLCBub2RlLnhBbGlnbiApO1xyXG4gICAgYWRkU2ltcGxlKCAneUFsaWduJywgbm9kZS55QWxpZ24gKTtcclxuICAgIG5vZGUueFNwYWNpbmcgJiYgYWRkU2ltcGxlKCAneFNwYWNpbmcnLCBub2RlLnhTcGFjaW5nICk7XHJcbiAgICBub2RlLnlTcGFjaW5nICYmIGFkZFNpbXBsZSggJ3lTcGFjaW5nJywgbm9kZS55U3BhY2luZyApO1xyXG4gICAgbm9kZS54U3RyZXRjaCAmJiBhZGRTaW1wbGUoICd4U3RyZXRjaCcsIG5vZGUueFN0cmV0Y2ggKTtcclxuICAgIG5vZGUueVN0cmV0Y2ggJiYgYWRkU2ltcGxlKCAneVN0cmV0Y2gnLCBub2RlLnlTdHJldGNoICk7XHJcbiAgICBub2RlLnhHcm93ICYmIGFkZFNpbXBsZSggJ3hHcm93Jywgbm9kZS54R3JvdyApO1xyXG4gICAgbm9kZS55R3JvdyAmJiBhZGRTaW1wbGUoICd5R3JvdycsIG5vZGUueUdyb3cgKTtcclxuICAgIG5vZGUubGVmdE1hcmdpbiAmJiBhZGRTaW1wbGUoICdsZWZ0TWFyZ2luJywgbm9kZS5sZWZ0TWFyZ2luICk7XHJcbiAgICBub2RlLnJpZ2h0TWFyZ2luICYmIGFkZFNpbXBsZSggJ3JpZ2h0TWFyZ2luJywgbm9kZS5yaWdodE1hcmdpbiApO1xyXG4gICAgbm9kZS50b3BNYXJnaW4gJiYgYWRkU2ltcGxlKCAndG9wTWFyZ2luJywgbm9kZS50b3BNYXJnaW4gKTtcclxuICAgIG5vZGUuYm90dG9tTWFyZ2luICYmIGFkZFNpbXBsZSggJ2JvdHRvbU1hcmdpbicsIG5vZGUuYm90dG9tTWFyZ2luICk7XHJcbiAgICBub2RlLm1pbkNvbnRlbnRXaWR0aCAhPT0gbnVsbCAmJiBhZGRTaW1wbGUoICdtaW5Db250ZW50V2lkdGgnLCBub2RlLm1pbkNvbnRlbnRXaWR0aCApO1xyXG4gICAgbm9kZS5taW5Db250ZW50SGVpZ2h0ICE9PSBudWxsICYmIGFkZFNpbXBsZSggJ21pbkNvbnRlbnRIZWlnaHQnLCBub2RlLm1pbkNvbnRlbnRIZWlnaHQgKTtcclxuICAgIG5vZGUubWF4Q29udGVudFdpZHRoICE9PSBudWxsICYmIGFkZFNpbXBsZSggJ21heENvbnRlbnRXaWR0aCcsIG5vZGUubWF4Q29udGVudFdpZHRoICk7XHJcbiAgICBub2RlLm1heENvbnRlbnRIZWlnaHQgIT09IG51bGwgJiYgYWRkU2ltcGxlKCAnbWF4Q29udGVudEhlaWdodCcsIG5vZGUubWF4Q29udGVudEhlaWdodCApO1xyXG4gIH1cclxuXHJcbiAgaWYgKCBub2RlIGluc3RhbmNlb2YgUmVjdGFuZ2xlICkge1xyXG4gICAgYWRkQm91bmRzMiggJ3JlY3RCb3VuZHMnLCBub2RlLnJlY3RCb3VuZHMgKTtcclxuICAgIGlmICggbm9kZS5jb3JuZXJYUmFkaXVzIHx8IG5vZGUuY29ybmVyWVJhZGl1cyApIHtcclxuICAgICAgaWYgKCBub2RlLmNvcm5lclhSYWRpdXMgPT09IG5vZGUuY29ybmVyWVJhZGl1cyApIHtcclxuICAgICAgICBhZGRTaW1wbGUoICdjb3JuZXJSYWRpdXMnLCBub2RlLmNvcm5lclJhZGl1cyApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGFkZFNpbXBsZSggJ2Nvcm5lclhSYWRpdXMnLCBub2RlLmNvcm5lclhSYWRpdXMgKTtcclxuICAgICAgICBhZGRTaW1wbGUoICdjb3JuZXJZUmFkaXVzJywgbm9kZS5jb3JuZXJZUmFkaXVzICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmICggbm9kZSBpbnN0YW5jZW9mIExpbmUgKSB7XHJcbiAgICBhZGRTaW1wbGUoICd4MScsIG5vZGUueDEgKTtcclxuICAgIGFkZFNpbXBsZSggJ3kxJywgbm9kZS55MSApO1xyXG4gICAgYWRkU2ltcGxlKCAneDInLCBub2RlLngyICk7XHJcbiAgICBhZGRTaW1wbGUoICd5MicsIG5vZGUueTIgKTtcclxuICB9XHJcblxyXG4gIGlmICggbm9kZSBpbnN0YW5jZW9mIENpcmNsZSApIHtcclxuICAgIGFkZFNpbXBsZSggJ3JhZGl1cycsIG5vZGUucmFkaXVzICk7XHJcbiAgfVxyXG5cclxuICBpZiAoIG5vZGUgaW5zdGFuY2VvZiBUZXh0ICkge1xyXG4gICAgYWRkU2ltcGxlKCAndGV4dCcsIG5vZGUuc3RyaW5nICk7XHJcbiAgICBhZGRTaW1wbGUoICdmb250Jywgbm9kZS5mb250ICk7XHJcbiAgICBpZiAoIG5vZGUuYm91bmRzTWV0aG9kICE9PSAnaHlicmlkJyApIHtcclxuICAgICAgYWRkU2ltcGxlKCAnYm91bmRzTWV0aG9kJywgbm9kZS5ib3VuZHNNZXRob2QgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmICggbm9kZSBpbnN0YW5jZW9mIFJpY2hUZXh0ICkge1xyXG4gICAgYWRkU2ltcGxlKCAndGV4dCcsIG5vZGUuc3RyaW5nICk7XHJcbiAgICBhZGRTaW1wbGUoICdmb250Jywgbm9kZS5mb250IGluc3RhbmNlb2YgRm9udCA/IG5vZGUuZm9udC5nZXRGb250KCkgOiBub2RlLmZvbnQgKTtcclxuICAgIGFkZFBhaW50KCAnZmlsbCcsIG5vZGUuZmlsbCApO1xyXG4gICAgYWRkUGFpbnQoICdzdHJva2UnLCBub2RlLnN0cm9rZSApO1xyXG4gICAgaWYgKCBub2RlLmJvdW5kc01ldGhvZCAhPT0gJ2h5YnJpZCcgKSB7XHJcbiAgICAgIGFkZFNpbXBsZSggJ2JvdW5kc01ldGhvZCcsIG5vZGUuYm91bmRzTWV0aG9kICk7XHJcbiAgICB9XHJcbiAgICBpZiAoIG5vZGUubGluZVdyYXAgIT09IG51bGwgKSB7XHJcbiAgICAgIGFkZFNpbXBsZSggJ2xpbmVXcmFwJywgbm9kZS5saW5lV3JhcCApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKCBub2RlIGluc3RhbmNlb2YgSW1hZ2UgKSB7XHJcbiAgICBhZGRJbWFnZSggJ2ltYWdlJywgbm9kZSApO1xyXG4gICAgYWRkU2ltcGxlKCAnaW1hZ2VXaWR0aCcsIG5vZGUuaW1hZ2VXaWR0aCApO1xyXG4gICAgYWRkU2ltcGxlKCAnaW1hZ2VIZWlnaHQnLCBub2RlLmltYWdlSGVpZ2h0ICk7XHJcbiAgICBpZiAoIG5vZGUuaW1hZ2VPcGFjaXR5ICE9PSAxICkge1xyXG4gICAgICBhZGRTaW1wbGUoICdpbWFnZU9wYWNpdHknLCBub2RlLmltYWdlT3BhY2l0eSApO1xyXG4gICAgfVxyXG4gICAgaWYgKCBub2RlLmltYWdlQm91bmRzICkge1xyXG4gICAgICBhZGRCb3VuZHMyKCAnaW1hZ2VCb3VuZHMnLCBub2RlLmltYWdlQm91bmRzICk7XHJcbiAgICB9XHJcbiAgICBpZiAoIG5vZGUuaW5pdGlhbFdpZHRoICkge1xyXG4gICAgICBhZGRTaW1wbGUoICdpbml0aWFsV2lkdGgnLCBub2RlLmluaXRpYWxXaWR0aCApO1xyXG4gICAgfVxyXG4gICAgaWYgKCBub2RlLmluaXRpYWxIZWlnaHQgKSB7XHJcbiAgICAgIGFkZFNpbXBsZSggJ2luaXRpYWxIZWlnaHQnLCBub2RlLmluaXRpYWxIZWlnaHQgKTtcclxuICAgIH1cclxuICAgIGlmICggbm9kZS5oaXRUZXN0UGl4ZWxzICkge1xyXG4gICAgICBhZGRTaW1wbGUoICdoaXRUZXN0UGl4ZWxzJywgbm9kZS5oaXRUZXN0UGl4ZWxzICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpZiAoIG5vZGUgaW5zdGFuY2VvZiBDYW52YXNOb2RlIHx8IG5vZGUgaW5zdGFuY2VvZiBXZWJHTE5vZGUgKSB7XHJcbiAgICBhZGRCb3VuZHMyKCAnY2FudmFzQm91bmRzJywgbm9kZS5jYW52YXNCb3VuZHMgKTtcclxuICB9XHJcblxyXG4gIGlmICggbm9kZSBpbnN0YW5jZW9mIFBhdGggKSB7XHJcbiAgICBpZiAoIG5vZGUuc2hhcGUgKSB7XHJcbiAgICAgIGFkZFNoYXBlKCAnc2hhcGUnLCBub2RlLnNoYXBlICk7XHJcbiAgICB9XHJcbiAgICBpZiAoIG5vZGUuYm91bmRzTWV0aG9kICE9PSAnYWNjdXJhdGUnICkge1xyXG4gICAgICBhZGRTaW1wbGUoICdib3VuZHNNZXRob2QnLCBub2RlLmJvdW5kc01ldGhvZCApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKCBub2RlIGluc3RhbmNlb2YgUGF0aCB8fCBub2RlIGluc3RhbmNlb2YgVGV4dCApIHtcclxuICAgIGFkZFBhaW50KCAnZmlsbCcsIG5vZGUuZmlsbCApO1xyXG4gICAgYWRkUGFpbnQoICdzdHJva2UnLCBub2RlLnN0cm9rZSApO1xyXG4gICAgaWYgKCBub2RlLmxpbmVEYXNoLmxlbmd0aCApIHtcclxuICAgICAgYWRkU2ltcGxlKCAnbGluZURhc2gnLCBub2RlLmxpbmVEYXNoICk7XHJcbiAgICB9XHJcbiAgICBpZiAoICFub2RlLmZpbGxQaWNrYWJsZSApIHtcclxuICAgICAgYWRkU2ltcGxlKCAnZmlsbFBpY2thYmxlJywgbm9kZS5maWxsUGlja2FibGUgKTtcclxuICAgIH1cclxuICAgIGlmICggbm9kZS5zdHJva2VQaWNrYWJsZSApIHtcclxuICAgICAgYWRkU2ltcGxlKCAnc3Ryb2tlUGlja2FibGUnLCBub2RlLnN0cm9rZVBpY2thYmxlICk7XHJcbiAgICB9XHJcbiAgICBpZiAoIG5vZGUubGluZVdpZHRoICE9PSAxICkge1xyXG4gICAgICBhZGRTaW1wbGUoICdsaW5lV2lkdGgnLCBub2RlLmxpbmVXaWR0aCApO1xyXG4gICAgfVxyXG4gICAgaWYgKCBub2RlLmxpbmVDYXAgIT09ICdidXR0JyApIHtcclxuICAgICAgYWRkU2ltcGxlKCAnbGluZUNhcCcsIG5vZGUubGluZUNhcCApO1xyXG4gICAgfVxyXG4gICAgaWYgKCBub2RlLmxpbmVKb2luICE9PSAnbWl0ZXInICkge1xyXG4gICAgICBhZGRTaW1wbGUoICdsaW5lSm9pbicsIG5vZGUubGluZUpvaW4gKTtcclxuICAgIH1cclxuICAgIGlmICggbm9kZS5saW5lRGFzaE9mZnNldCAhPT0gMCApIHtcclxuICAgICAgYWRkU2ltcGxlKCAnbGluZURhc2hPZmZzZXQnLCBub2RlLmxpbmVEYXNoT2Zmc2V0ICk7XHJcbiAgICB9XHJcbiAgICBpZiAoIG5vZGUubWl0ZXJMaW1pdCAhPT0gMTAgKSB7XHJcbiAgICAgIGFkZFNpbXBsZSggJ21pdGVyTGltaXQnLCBub2RlLm1pdGVyTGltaXQgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmICggbm9kZS50YWdOYW1lICkge1xyXG4gICAgYWRkU2ltcGxlKCAndGFnTmFtZScsIG5vZGUudGFnTmFtZSApO1xyXG4gIH1cclxuICBpZiAoIG5vZGUuYWNjZXNzaWJsZU5hbWUgKSB7XHJcbiAgICBhZGRTaW1wbGUoICdhY2Nlc3NpYmxlTmFtZScsIG5vZGUuYWNjZXNzaWJsZU5hbWUgKTtcclxuICB9XHJcbiAgaWYgKCBub2RlLmhlbHBUZXh0ICkge1xyXG4gICAgYWRkU2ltcGxlKCAnaGVscFRleHQnLCBub2RlLmhlbHBUZXh0ICk7XHJcbiAgfVxyXG4gIGlmICggbm9kZS5wZG9tSGVhZGluZyApIHtcclxuICAgIGFkZFNpbXBsZSggJ3Bkb21IZWFkaW5nJywgbm9kZS5wZG9tSGVhZGluZyApO1xyXG4gIH1cclxuICBpZiAoIG5vZGUuY29udGFpbmVyVGFnTmFtZSApIHtcclxuICAgIGFkZFNpbXBsZSggJ2NvbnRhaW5lclRhZ05hbWUnLCBub2RlLmNvbnRhaW5lclRhZ05hbWUgKTtcclxuICB9XHJcbiAgaWYgKCBub2RlLmNvbnRhaW5lckFyaWFSb2xlICkge1xyXG4gICAgYWRkU2ltcGxlKCAnY29udGFpbmVyQXJpYVJvbGUnLCBub2RlLmNvbnRhaW5lckFyaWFSb2xlICk7XHJcbiAgfVxyXG4gIGlmICggbm9kZS5pbm5lckNvbnRlbnQgKSB7XHJcbiAgICBhZGRTaW1wbGUoICdpbm5lckNvbnRlbnQnLCBub2RlLmlubmVyQ29udGVudCApO1xyXG4gIH1cclxuICBpZiAoIG5vZGUuaW5wdXRUeXBlICkge1xyXG4gICAgYWRkU2ltcGxlKCAnaW5wdXRUeXBlJywgbm9kZS5pbnB1dFR5cGUgKTtcclxuICB9XHJcbiAgaWYgKCBub2RlLmlucHV0VmFsdWUgKSB7XHJcbiAgICBhZGRTaW1wbGUoICdpbnB1dFZhbHVlJywgbm9kZS5pbnB1dFZhbHVlICk7XHJcbiAgfVxyXG4gIGlmICggbm9kZS5wZG9tTmFtZXNwYWNlICkge1xyXG4gICAgYWRkU2ltcGxlKCAncGRvbU5hbWVzcGFjZScsIG5vZGUucGRvbU5hbWVzcGFjZSApO1xyXG4gIH1cclxuICBpZiAoIG5vZGUuYXJpYUxhYmVsICkge1xyXG4gICAgYWRkU2ltcGxlKCAnYXJpYUxhYmVsJywgbm9kZS5hcmlhTGFiZWwgKTtcclxuICB9XHJcbiAgaWYgKCBub2RlLmFyaWFSb2xlICkge1xyXG4gICAgYWRkU2ltcGxlKCAnYXJpYVJvbGUnLCBub2RlLmFyaWFSb2xlICk7XHJcbiAgfVxyXG4gIGlmICggbm9kZS5hcmlhVmFsdWVUZXh0ICkge1xyXG4gICAgYWRkU2ltcGxlKCAnYXJpYVZhbHVlVGV4dCcsIG5vZGUuYXJpYVZhbHVlVGV4dCApO1xyXG4gIH1cclxuICBpZiAoIG5vZGUubGFiZWxUYWdOYW1lICkge1xyXG4gICAgYWRkU2ltcGxlKCAnbGFiZWxUYWdOYW1lJywgbm9kZS5sYWJlbFRhZ05hbWUgKTtcclxuICB9XHJcbiAgaWYgKCBub2RlLmxhYmVsQ29udGVudCApIHtcclxuICAgIGFkZFNpbXBsZSggJ2xhYmVsQ29udGVudCcsIG5vZGUubGFiZWxDb250ZW50ICk7XHJcbiAgfVxyXG4gIGlmICggbm9kZS5hcHBlbmRMYWJlbCApIHtcclxuICAgIGFkZFNpbXBsZSggJ2FwcGVuZExhYmVsJywgbm9kZS5hcHBlbmRMYWJlbCApO1xyXG4gIH1cclxuICBpZiAoIG5vZGUuZGVzY3JpcHRpb25UYWdOYW1lICkge1xyXG4gICAgYWRkU2ltcGxlKCAnZGVzY3JpcHRpb25UYWdOYW1lJywgbm9kZS5kZXNjcmlwdGlvblRhZ05hbWUgKTtcclxuICB9XHJcbiAgaWYgKCBub2RlLmRlc2NyaXB0aW9uQ29udGVudCApIHtcclxuICAgIGFkZFNpbXBsZSggJ2Rlc2NyaXB0aW9uQ29udGVudCcsIG5vZGUuZGVzY3JpcHRpb25Db250ZW50ICk7XHJcbiAgfVxyXG4gIGlmICggbm9kZS5hcHBlbmREZXNjcmlwdGlvbiApIHtcclxuICAgIGFkZFNpbXBsZSggJ2FwcGVuZERlc2NyaXB0aW9uJywgbm9kZS5hcHBlbmREZXNjcmlwdGlvbiApO1xyXG4gIH1cclxuICBpZiAoICFub2RlLnBkb21WaXNpYmxlICkge1xyXG4gICAgYWRkU2ltcGxlKCAncGRvbVZpc2libGUnLCBub2RlLnBkb21WaXNpYmxlICk7XHJcbiAgfVxyXG4gIGlmICggbm9kZS5wZG9tT3JkZXIgKSB7XHJcbiAgICBhZGRTaW1wbGUoICdwZG9tT3JkZXInLCBub2RlLnBkb21PcmRlci5tYXAoIG5vZGUgPT4gbm9kZSA9PT0gbnVsbCA/ICdudWxsJyA6IG5vZGUuY29uc3RydWN0b3IubmFtZSApICk7XHJcbiAgfVxyXG5cclxuICBpZiAoICFub2RlLnZpc2libGUgKSB7XHJcbiAgICBhZGRTaW1wbGUoICd2aXNpYmxlJywgbm9kZS52aXNpYmxlICk7XHJcbiAgfVxyXG4gIGlmICggbm9kZS5vcGFjaXR5ICE9PSAxICkge1xyXG4gICAgYWRkTnVtYmVyKCAnb3BhY2l0eScsIG5vZGUub3BhY2l0eSApO1xyXG4gIH1cclxuICBpZiAoIG5vZGUucGlja2FibGUgIT09IG51bGwgKSB7XHJcbiAgICBhZGRTaW1wbGUoICdwaWNrYWJsZScsIG5vZGUucGlja2FibGUgKTtcclxuICB9XHJcbiAgaWYgKCAhbm9kZS5lbmFibGVkICkge1xyXG4gICAgYWRkU2ltcGxlKCAnZW5hYmxlZCcsIG5vZGUuZW5hYmxlZCApO1xyXG4gIH1cclxuICBpZiAoICFub2RlLmlucHV0RW5hYmxlZCApIHtcclxuICAgIGFkZFNpbXBsZSggJ2lucHV0RW5hYmxlZCcsIG5vZGUuaW5wdXRFbmFibGVkICk7XHJcbiAgfVxyXG4gIGlmICggbm9kZS5jdXJzb3IgIT09IG51bGwgKSB7XHJcbiAgICBhZGRTaW1wbGUoICdjdXJzb3InLCBub2RlLmN1cnNvciApO1xyXG4gIH1cclxuICBpZiAoIG5vZGUudHJhbnNmb3JtQm91bmRzICkge1xyXG4gICAgYWRkU2ltcGxlKCAndHJhbnNmb3JtQm91bmRzJywgbm9kZS50cmFuc2Zvcm1Cb3VuZHMgKTtcclxuICB9XHJcbiAgaWYgKCBub2RlLnJlbmRlcmVyICkge1xyXG4gICAgYWRkU2ltcGxlKCAncmVuZGVyZXInLCBub2RlLnJlbmRlcmVyICk7XHJcbiAgfVxyXG4gIGlmICggbm9kZS51c2VzT3BhY2l0eSApIHtcclxuICAgIGFkZFNpbXBsZSggJ3VzZXNPcGFjaXR5Jywgbm9kZS51c2VzT3BhY2l0eSApO1xyXG4gIH1cclxuICBpZiAoIG5vZGUubGF5ZXJTcGxpdCApIHtcclxuICAgIGFkZFNpbXBsZSggJ2xheWVyU3BsaXQnLCBub2RlLmxheWVyU3BsaXQgKTtcclxuICB9XHJcbiAgaWYgKCBub2RlLmNzc1RyYW5zZm9ybSApIHtcclxuICAgIGFkZFNpbXBsZSggJ2Nzc1RyYW5zZm9ybScsIG5vZGUuY3NzVHJhbnNmb3JtICk7XHJcbiAgfVxyXG4gIGlmICggbm9kZS5leGNsdWRlSW52aXNpYmxlICkge1xyXG4gICAgYWRkU2ltcGxlKCAnZXhjbHVkZUludmlzaWJsZScsIG5vZGUuZXhjbHVkZUludmlzaWJsZSApO1xyXG4gIH1cclxuICBpZiAoIG5vZGUucHJldmVudEZpdCApIHtcclxuICAgIGFkZFNpbXBsZSggJ3ByZXZlbnRGaXQnLCBub2RlLnByZXZlbnRGaXQgKTtcclxuICB9XHJcbiAgaWYgKCBub2RlLndlYmdsU2NhbGUgIT09IG51bGwgKSB7XHJcbiAgICBhZGRTaW1wbGUoICd3ZWJnbFNjYWxlJywgbm9kZS53ZWJnbFNjYWxlICk7XHJcbiAgfVxyXG4gIGlmICggIW5vZGUubWF0cml4LmlzSWRlbnRpdHkoKSApIHtcclxuICAgIGFkZE1hdHJpeDMoICdtYXRyaXgnLCBub2RlLm1hdHJpeCApO1xyXG4gIH1cclxuICBpZiAoIG5vZGUubWF4V2lkdGggIT09IG51bGwgKSB7XHJcbiAgICBhZGRTaW1wbGUoICdtYXhXaWR0aCcsIG5vZGUubWF4V2lkdGggKTtcclxuICB9XHJcbiAgaWYgKCBub2RlLm1heEhlaWdodCAhPT0gbnVsbCApIHtcclxuICAgIGFkZFNpbXBsZSggJ21heEhlaWdodCcsIG5vZGUubWF4SGVpZ2h0ICk7XHJcbiAgfVxyXG4gIGlmICggbm9kZS5jbGlwQXJlYSAhPT0gbnVsbCApIHtcclxuICAgIGFkZFNoYXBlKCAnY2xpcEFyZWEnLCBub2RlLmNsaXBBcmVhICk7XHJcbiAgfVxyXG4gIGlmICggbm9kZS5tb3VzZUFyZWEgIT09IG51bGwgKSB7XHJcbiAgICBpZiAoIG5vZGUubW91c2VBcmVhIGluc3RhbmNlb2YgQm91bmRzMiApIHtcclxuICAgICAgYWRkQm91bmRzMiggJ21vdXNlQXJlYScsIG5vZGUubW91c2VBcmVhICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgYWRkU2hhcGUoICdtb3VzZUFyZWEnLCBub2RlLm1vdXNlQXJlYSApO1xyXG4gICAgfVxyXG4gIH1cclxuICBpZiAoIG5vZGUudG91Y2hBcmVhICE9PSBudWxsICkge1xyXG4gICAgaWYgKCBub2RlLnRvdWNoQXJlYSBpbnN0YW5jZW9mIEJvdW5kczIgKSB7XHJcbiAgICAgIGFkZEJvdW5kczIoICd0b3VjaEFyZWEnLCBub2RlLnRvdWNoQXJlYSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGFkZFNoYXBlKCAndG91Y2hBcmVhJywgbm9kZS50b3VjaEFyZWEgKTtcclxuICAgIH1cclxuICB9XHJcbiAgaWYgKCBub2RlLmlucHV0TGlzdGVuZXJzLmxlbmd0aCApIHtcclxuICAgIGFkZFNpbXBsZSggJ2lucHV0TGlzdGVuZXJzJywgbm9kZS5pbnB1dExpc3RlbmVycy5tYXAoIGxpc3RlbmVyID0+IGxpc3RlbmVyLmNvbnN0cnVjdG9yLm5hbWUgKS5qb2luKCAnLCAnICkgKTtcclxuICB9XHJcblxyXG4gIGNoaWxkcmVuLnB1c2goIG5ldyBTcGFjZXIoIDUsIDUgKSApO1xyXG5cclxuICBhZGRCb3VuZHMyKCAnbG9jYWxCb3VuZHMnLCBub2RlLmxvY2FsQm91bmRzICk7XHJcbiAgaWYgKCBub2RlLmxvY2FsQm91bmRzT3ZlcnJpZGRlbiApIHtcclxuICAgIGFkZFNpbXBsZSggJ2xvY2FsQm91bmRzT3ZlcnJpZGRlbicsIG5vZGUubG9jYWxCb3VuZHNPdmVycmlkZGVuICk7XHJcbiAgfVxyXG4gIGFkZEJvdW5kczIoICdib3VuZHMnLCBub2RlLmJvdW5kcyApO1xyXG4gIGlmICggaXNGaW5pdGUoIG5vZGUud2lkdGggKSApIHtcclxuICAgIGFkZFNpbXBsZSggJ3dpZHRoJywgbm9kZS53aWR0aCApO1xyXG4gIH1cclxuICBpZiAoIGlzRmluaXRlKCBub2RlLmhlaWdodCApICkge1xyXG4gICAgYWRkU2ltcGxlKCAnaGVpZ2h0Jywgbm9kZS5oZWlnaHQgKTtcclxuICB9XHJcblxyXG4gIGNoaWxkcmVuLnB1c2goIG5ldyBSZWN0YW5ndWxhclB1c2hCdXR0b24oIHtcclxuICAgIGNvbnRlbnQ6IG5ldyBUZXh0KCAnQ29weSBQYXRoJywgeyBmb250U2l6ZTogMTIgfSApLFxyXG4gICAgbGlzdGVuZXI6ICgpID0+IGNvcHlUb0NsaXBib2FyZCggJ3BoZXQuam9pc3QuZGlzcGxheS5yb290Tm9kZScgKyB0cmFpbC5pbmRpY2VzLm1hcCggaW5kZXggPT4ge1xyXG4gICAgICByZXR1cm4gYC5jaGlsZHJlblsgJHtpbmRleH0gXWA7XHJcbiAgICB9ICkuam9pbiggJycgKSApLFxyXG4gICAgdGFuZGVtOiBUYW5kZW0uT1BUX09VVFxyXG4gIH0gKSApO1xyXG5cclxuICByZXR1cm4gY2hpbGRyZW47XHJcbn07XHJcblxyXG5jb25zdCBpQ29sb3JUb0NvbG9yID0gKCBjb2xvcjogVENvbG9yICk6IENvbG9yIHwgbnVsbCA9PiB7XHJcbiAgY29uc3Qgbm9uUHJvcGVydHkgPSAoIGlzVFJlYWRPbmx5UHJvcGVydHkoIGNvbG9yICkgKSA/IGNvbG9yLnZhbHVlIDogY29sb3I7XHJcbiAgcmV0dXJuIG5vblByb3BlcnR5ID09PSBudWxsID8gbnVsbCA6IENvbG9yLnRvQ29sb3IoIG5vblByb3BlcnR5ICk7XHJcbn07XHJcblxyXG5jb25zdCBpc1BhaW50Tm9uVHJhbnNwYXJlbnQgPSAoIHBhaW50OiBUUGFpbnQgKTogYm9vbGVhbiA9PiB7XHJcbiAgaWYgKCBwYWludCBpbnN0YW5jZW9mIFBhaW50ICkge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgY29uc3QgY29sb3IgPSBpQ29sb3JUb0NvbG9yKCBwYWludCApO1xyXG4gICAgcmV0dXJuICEhY29sb3IgJiYgY29sb3IuYWxwaGEgPiAwO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIE1pc3Npbmcgb3B0aW1pemF0aW9ucyBvbiBib3VuZHMgb24gcHVycG9zZSwgc28gd2UgaGl0IHZpc3VhbCBjaGFuZ2VzXHJcbmNvbnN0IHZpc3VhbEhpdFRlc3QgPSAoIG5vZGU6IE5vZGUsIHBvaW50OiBWZWN0b3IyICk6IFRyYWlsIHwgbnVsbCA9PiB7XHJcbiAgaWYgKCAhbm9kZS52aXNpYmxlICkge1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG4gIGNvbnN0IGxvY2FsUG9pbnQgPSBub2RlLl90cmFuc2Zvcm0uZ2V0SW52ZXJzZSgpLnRpbWVzVmVjdG9yMiggcG9pbnQgKTtcclxuXHJcbiAgY29uc3QgY2xpcEFyZWEgPSBub2RlLmNsaXBBcmVhO1xyXG4gIGlmICggY2xpcEFyZWEgIT09IG51bGwgJiYgIWNsaXBBcmVhLmNvbnRhaW5zUG9pbnQoIGxvY2FsUG9pbnQgKSApIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgZm9yICggbGV0IGkgPSBub2RlLl9jaGlsZHJlbi5sZW5ndGggLSAxOyBpID49IDA7IGktLSApIHtcclxuICAgIGNvbnN0IGNoaWxkID0gbm9kZS5fY2hpbGRyZW5bIGkgXTtcclxuXHJcbiAgICBjb25zdCBjaGlsZEhpdCA9IHZpc3VhbEhpdFRlc3QoIGNoaWxkLCBsb2NhbFBvaW50ICk7XHJcblxyXG4gICAgaWYgKCBjaGlsZEhpdCApIHtcclxuICAgICAgcmV0dXJuIGNoaWxkSGl0LmFkZEFuY2VzdG9yKCBub2RlLCBpICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBEaWRuJ3QgaGl0IG91ciBjaGlsZHJlbiwgc28gY2hlY2sgb3Vyc2VsZiBhcyBhIGxhc3QgcmVzb3J0LiBDaGVjayBvdXIgc2VsZkJvdW5kcyBmaXJzdCwgc28gd2UgY2FuIHBvdGVudGlhbGx5XHJcbiAgLy8gYXZvaWQgaGl0LXRlc3RpbmcgdGhlIGFjdHVhbCBvYmplY3QgKHdoaWNoIG1heSBiZSBtb3JlIGV4cGVuc2l2ZSkuXHJcbiAgaWYgKCBub2RlLnNlbGZCb3VuZHMuY29udGFpbnNQb2ludCggbG9jYWxQb2ludCApICkge1xyXG5cclxuICAgIC8vIElnbm9yZSB0aG9zZSB0cmFuc3BhcmVudCBwYXRocy4uLlxyXG4gICAgaWYgKCBub2RlIGluc3RhbmNlb2YgUGF0aCAmJiBub2RlLmhhc1NoYXBlKCkgKSB7XHJcbiAgICAgIGlmICggaXNQYWludE5vblRyYW5zcGFyZW50KCBub2RlLmZpbGwgKSAmJiBub2RlLmdldFNoYXBlKCkhLmNvbnRhaW5zUG9pbnQoIGxvY2FsUG9pbnQgKSApIHtcclxuICAgICAgICByZXR1cm4gbmV3IFRyYWlsKCBub2RlICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBpc1BhaW50Tm9uVHJhbnNwYXJlbnQoIG5vZGUuc3Ryb2tlICkgJiYgbm9kZS5nZXRTdHJva2VkU2hhcGUoKS5jb250YWluc1BvaW50KCBsb2NhbFBvaW50ICkgKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBUcmFpbCggbm9kZSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggbm9kZS5jb250YWluc1BvaW50U2VsZiggbG9jYWxQb2ludCApICkge1xyXG4gICAgICByZXR1cm4gbmV3IFRyYWlsKCBub2RlICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBObyBoaXRcclxuICByZXR1cm4gbnVsbDtcclxufTtcclxuXHJcbmNvbnN0IGNvcHlUb0NsaXBib2FyZCA9IGFzeW5jICggc3RyOiBzdHJpbmcgKSA9PiB7XHJcbiAgYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZD8ud3JpdGVUZXh0KCBzdHIgKTtcclxufTtcclxuXHJcbmNvbnN0IGdldExvY2FsU2hhcGUgPSAoIG5vZGU6IE5vZGUsIHVzZU1vdXNlOiBib29sZWFuLCB1c2VUb3VjaDogYm9vbGVhbiApOiBTaGFwZSA9PiB7XHJcbiAgbGV0IHNoYXBlID0gU2hhcGUudW5pb24oIFtcclxuICAgIC4uLiggKCB1c2VNb3VzZSAmJiBub2RlLm1vdXNlQXJlYSApID8gWyBub2RlLm1vdXNlQXJlYSBpbnN0YW5jZW9mIFNoYXBlID8gbm9kZS5tb3VzZUFyZWEgOiBTaGFwZS5ib3VuZHMoIG5vZGUubW91c2VBcmVhICkgXSA6IFtdICksXHJcbiAgICAuLi4oICggdXNlVG91Y2ggJiYgbm9kZS50b3VjaEFyZWEgKSA/IFsgbm9kZS50b3VjaEFyZWEgaW5zdGFuY2VvZiBTaGFwZSA/IG5vZGUudG91Y2hBcmVhIDogU2hhcGUuYm91bmRzKCBub2RlLnRvdWNoQXJlYSApIF0gOiBbXSApLFxyXG4gICAgbm9kZS5nZXRTZWxmU2hhcGUoKSxcclxuXHJcbiAgICAuLi5ub2RlLmNoaWxkcmVuLmZpbHRlciggY2hpbGQgPT4ge1xyXG4gICAgICByZXR1cm4gY2hpbGQudmlzaWJsZSAmJiBjaGlsZC5waWNrYWJsZSAhPT0gZmFsc2U7XHJcbiAgICB9ICkubWFwKCBjaGlsZCA9PiBnZXRMb2NhbFNoYXBlKCBjaGlsZCwgdXNlTW91c2UsIHVzZVRvdWNoICkudHJhbnNmb3JtZWQoIGNoaWxkLm1hdHJpeCApIClcclxuICBdLmZpbHRlciggc2hhcGUgPT4gc2hhcGUuYm91bmRzLmlzVmFsaWQoKSApICk7XHJcblxyXG4gIGlmICggbm9kZS5oYXNDbGlwQXJlYSgpICkge1xyXG4gICAgc2hhcGUgPSBzaGFwZS5zaGFwZUludGVyc2VjdGlvbiggbm9kZS5jbGlwQXJlYSEgKTtcclxuICB9XHJcbiAgcmV0dXJuIHNoYXBlO1xyXG59O1xyXG5cclxuY29uc3QgZ2V0U2hhcGUgPSAoIHRyYWlsOiBUcmFpbCwgdXNlTW91c2U6IGJvb2xlYW4sIHVzZVRvdWNoOiBib29sZWFuICk6IFNoYXBlID0+IHtcclxuICBsZXQgc2hhcGUgPSBnZXRMb2NhbFNoYXBlKCB0cmFpbC5sYXN0Tm9kZSgpLCB1c2VNb3VzZSwgdXNlVG91Y2ggKTtcclxuXHJcbiAgZm9yICggbGV0IGkgPSB0cmFpbC5ub2Rlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSApIHtcclxuICAgIGNvbnN0IG5vZGUgPSB0cmFpbC5ub2Rlc1sgaSBdO1xyXG5cclxuICAgIGlmICggbm9kZS5oYXNDbGlwQXJlYSgpICkge1xyXG4gICAgICBzaGFwZSA9IHNoYXBlLnNoYXBlSW50ZXJzZWN0aW9uKCBub2RlLmNsaXBBcmVhISApO1xyXG4gICAgfVxyXG4gICAgc2hhcGUgPSBzaGFwZS50cmFuc2Zvcm1lZCggbm9kZS5tYXRyaXggKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBzaGFwZTtcclxufTsiXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxtQkFBbUIsTUFBTSxzQ0FBc0M7QUFDdEUsT0FBT0MsZUFBZSxNQUFNLGtDQUFrQztBQUM5RCxPQUFPQyxjQUFjLE1BQU0saUNBQWlDO0FBQzVELE9BQU9DLFlBQVksTUFBTSwrQkFBK0I7QUFDeEQsT0FBT0MsT0FBTyxNQUFNLHlCQUF5QjtBQUU3QyxPQUFPQyxLQUFLLE1BQU0sdUJBQXVCO0FBQ3pDLE9BQU9DLE9BQU8sTUFBTSx5QkFBeUI7QUFDN0MsT0FBT0MsaUJBQWlCLE1BQU0sNENBQTRD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