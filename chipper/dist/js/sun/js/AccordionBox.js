// Copyright 2013-2024, University of Colorado Boulder

/**
 * Box that can be expanded/collapsed to show/hide contents.
 *
 * @author John Blanco (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import BooleanProperty from '../../axon/js/BooleanProperty.js';
import { Shape } from '../../kite/js/imports.js';
import InstanceRegistry from '../../phet-core/js/documentation/InstanceRegistry.js';
import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
import { HighlightFromNode, InteractiveHighlighting, isHeightSizable, isWidthSizable, LayoutConstraint, Node, Path, PDOMPeer, Rectangle, Sizable, Text } from '../../scenery/js/imports.js';
import accordionBoxClosedSoundPlayer from '../../tambo/js/shared-sound-players/accordionBoxClosedSoundPlayer.js';
import accordionBoxOpenedSoundPlayer from '../../tambo/js/shared-sound-players/accordionBoxOpenedSoundPlayer.js';
import EventType from '../../tandem/js/EventType.js';
import Tandem from '../../tandem/js/Tandem.js';
import IOType from '../../tandem/js/types/IOType.js';
import ExpandCollapseButton from './ExpandCollapseButton.js';
import sun from './sun.js';
export default class AccordionBox extends Sizable(Node) {
  // Only defined if there is a stroke
  expandedBoxOutline = null;
  collapsedBoxOutline = null;
  static AccordionBoxIO = new IOType('AccordionBoxIO', {
    valueType: AccordionBox,
    supertype: Node.NodeIO,
    events: ['expanded', 'collapsed']
  });

  /**
   * @param contentNode - Content that  will be shown or hidden as the accordion box is expanded/collapsed. NOTE: AccordionBox
   *                      places this Node in a pdomOrder, so you should not do that yourself.
   * @param [providedOptions]
   */
  constructor(contentNode, providedOptions) {
    const options = optionize()({
      titleNode: null,
      expandedProperty: null,
      resize: true,
      overrideTitleNodePickable: true,
      allowContentToOverlapTitle: false,
      // applied to multiple parts of this UI component
      cursor: 'pointer',
      lineWidth: 1,
      cornerRadius: 10,
      // box
      stroke: 'black',
      fill: 'rgb( 238, 238, 238 )',
      minWidth: 0,
      titleAlignX: 'center',
      titleAlignY: 'center',
      titleXMargin: 10,
      titleYMargin: 2,
      titleXSpacing: 5,
      showTitleWhenExpanded: true,
      useExpandedBoundsWhenCollapsed: true,
      titleBarExpandCollapse: true,
      // expand/collapse button layout
      buttonAlign: 'left',
      buttonXMargin: 4,
      buttonYMargin: 2,
      // content
      contentAlign: 'center',
      contentVerticalAlign: 'center',
      contentXMargin: 15,
      contentYMargin: 8,
      contentXSpacing: 5,
      contentYSpacing: 8,
      // sound
      expandedSoundPlayer: accordionBoxOpenedSoundPlayer,
      collapsedSoundPlayer: accordionBoxClosedSoundPlayer,
      // pdom
      tagName: 'div',
      headingTagName: 'h3',
      // specify the heading that this AccordionBox will be, TODO: use this.headingLevel when no longer experimental https://github.com/phetsims/scenery/issues/855
      accessibleNameBehavior: AccordionBox.ACCORDION_BOX_ACCESSIBLE_NAME_BEHAVIOR,
      // voicing
      voicingNameResponse: null,
      voicingObjectResponse: null,
      voicingContextResponse: null,
      voicingHintResponse: null,
      // phet-io support
      tandem: Tandem.REQUIRED,
      tandemNameSuffix: 'AccordionBox',
      phetioType: AccordionBox.AccordionBoxIO,
      phetioEventType: EventType.USER,
      visiblePropertyOptions: {
        phetioFeatured: true
      },
      titleBarOptions: {
        fill: null,
        // title bar fill
        stroke: null // title bar stroke, used only for the expanded title bar
      }
    }, providedOptions);

    // expandCollapseButtonOptions defaults
    options.expandCollapseButtonOptions = combineOptions({
      sideLength: 16,
      // button is a square, this is the length of one side
      cursor: options.cursor,
      valueOnSoundPlayer: options.expandedSoundPlayer,
      valueOffSoundPlayer: options.collapsedSoundPlayer,
      // voicing
      voicingNameResponse: options.voicingNameResponse,
      voicingObjectResponse: options.voicingObjectResponse,
      voicingContextResponse: options.voicingContextResponse,
      voicingHintResponse: options.voicingHintResponse,
      // phet-io
      tandem: options.tandem.createTandem('expandCollapseButton')
    }, options.expandCollapseButtonOptions);
    super();
    let titleNode = options.titleNode;

    // If there is no titleNode specified, we'll provide our own, and handle disposal.
    if (!titleNode) {
      titleNode = new Text('', {
        tandem: options.tandem.createTandem('titleText')
      });
      this.disposeEmitter.addListener(() => titleNode.dispose());
    }

    // Allow touches to go through to the collapsedTitleBar which handles the input event
    // Note: This mutates the titleNode, so if it is used in multiple places it will become unpickable
    // in those places as well.
    if (options.overrideTitleNodePickable) {
      titleNode.pickable = false;
    }
    this.expandedProperty = options.expandedProperty;
    if (!this.expandedProperty) {
      this.expandedProperty = new BooleanProperty(true, {
        tandem: options.tandem.createTandem('expandedProperty'),
        phetioFeatured: true
      });
      this.disposeEmitter.addListener(() => this.expandedProperty.dispose());
    }

    // expand/collapse button, links to expandedProperty, must be disposed of
    this.expandCollapseButton = new ExpandCollapseButton(this.expandedProperty, options.expandCollapseButtonOptions);
    this.disposeEmitter.addListener(() => this.expandCollapseButton.dispose());

    // Expanded box
    const boxOptions = {
      fill: options.fill,
      cornerRadius: options.cornerRadius
    };
    this.expandedBox = new Rectangle(boxOptions);
    this.collapsedBox = new Rectangle(boxOptions);
    this.expandedTitleBar = new InteractiveHighlightPath(null, combineOptions({
      lineWidth: options.lineWidth,
      // use same lineWidth as box, for consistent look
      cursor: options.cursor
    }, options.titleBarOptions));
    this.expandedBox.addChild(this.expandedTitleBar);

    // Collapsed title bar has corners that match the box. Clicking it operates like expand/collapse button.
    this.collapsedTitleBar = new InteractiveHighlightRectangle(combineOptions({
      cornerRadius: options.cornerRadius,
      cursor: options.cursor
    }, options.titleBarOptions));
    this.collapsedBox.addChild(this.collapsedTitleBar);

    // Set the focusHighlight for the interactive PDOM element based on the dimensions of the whole title bar (not just the button).
    const expandedFocusHighlight = new HighlightFromNode(this.expandedTitleBar);
    const collapsedFocusHighlight = new HighlightFromNode(this.collapsedTitleBar);
    this.disposeEmitter.addListener(() => {
      this.collapsedTitleBar.dispose();
      this.expandedTitleBar.dispose();
    });
    if (options.titleBarExpandCollapse) {
      this.collapsedTitleBar.addInputListener({
        down: () => {
          if (this.expandCollapseButton.isEnabled()) {
            this.phetioStartEvent('expanded');
            this.expandedProperty.value = true;
            options.expandedSoundPlayer.play();
            this.phetioEndEvent();
          }
        }
      });
    } else {
      // When titleBar doesn't expand or collapse, don't show interactive highlights for them
      this.expandedTitleBar.interactiveHighlight = 'invisible';
      this.collapsedTitleBar.interactiveHighlight = 'invisible';
    }

    // Set the input listeners for the expandedTitleBar
    if (options.showTitleWhenExpanded && options.titleBarExpandCollapse) {
      this.expandedTitleBar.addInputListener({
        down: () => {
          if (this.expandCollapseButton.isEnabled()) {
            this.phetioStartEvent('collapsed');
            options.collapsedSoundPlayer.play();
            this.expandedProperty.value = false;
            this.phetioEndEvent();
          }
        }
      });
    }

    // If we hide the button or make it unpickable, disable interactivity of the title bar,
    // see https://github.com/phetsims/sun/issues/477 and https://github.com/phetsims/sun/issues/573.
    const pickableListener = () => {
      const pickable = this.expandCollapseButton.visible && this.expandCollapseButton.pickable;
      this.collapsedTitleBar.pickable = pickable;
      this.expandedTitleBar.pickable = pickable;
    };

    // Add listeners to the expand/collapse button.  These do not need to be unlinked because this component owns the
    // button.
    this.expandCollapseButton.visibleProperty.lazyLink(pickableListener);
    this.expandCollapseButton.pickableProperty.lazyLink(pickableListener);
    this.expandCollapseButton.enabledProperty.link(enabled => {
      // Since there are listeners on the titleBars from InteractiveHighlighting, setting pickable: false isn't enough
      // to hide pointer cursor.
      const showCursor = options.titleBarExpandCollapse && enabled;
      this.collapsedTitleBar.cursor = showCursor ? options.cursor || null : null;
      this.expandedTitleBar.cursor = showCursor ? options.cursor || null : null;
    });
    this.expandedBox.addChild(contentNode);

    // optional box outline, on top of everything else
    if (options.stroke) {
      const outlineOptions = {
        stroke: options.stroke,
        lineWidth: options.lineWidth,
        cornerRadius: options.cornerRadius,
        // don't occlude input events from the collapsedTitleBar, which handles the events
        pickable: false
      };
      this.expandedBoxOutline = new Rectangle(outlineOptions);
      this.expandedBox.addChild(this.expandedBoxOutline);
      this.collapsedBoxOutline = new Rectangle(outlineOptions);
      this.collapsedBox.addChild(this.collapsedBoxOutline);
    }

    // Holds the main components when the content's bounds are valid
    const containerNode = new Node({
      excludeInvisibleChildrenFromBounds: !options.useExpandedBoundsWhenCollapsed
    });
    this.addChild(containerNode);

    // pdom display
    const pdomContentNode = new Node({
      tagName: 'div',
      ariaRole: 'region',
      pdomOrder: [contentNode],
      ariaLabelledbyAssociations: [{
        otherNode: this.expandCollapseButton,
        otherElementName: PDOMPeer.PRIMARY_SIBLING,
        thisElementName: PDOMPeer.PRIMARY_SIBLING
      }]
    });
    const pdomHeading = new Node({
      tagName: options.headingTagName,
      pdomOrder: [this.expandCollapseButton]
    });
    const pdomContainerNode = new Node({
      children: [pdomHeading, pdomContentNode]
    });
    this.addChild(pdomContainerNode);
    this.constraint = new AccordionBoxConstraint(this, contentNode, containerNode, this.expandedBox, this.collapsedBox, this.expandedTitleBar, this.collapsedTitleBar, this.expandedBoxOutline, this.collapsedBoxOutline, titleNode, this.expandCollapseButton, options);
    this.constraint.updateLayout();

    // Don't update automatically if resize:false
    this.constraint.enabled = options.resize;

    // expand/collapse the box
    const expandedPropertyObserver = () => {
      const expanded = this.expandedProperty.value;
      this.expandedBox.visible = expanded;
      this.collapsedBox.visible = !expanded;
      this.expandCollapseButton.setFocusHighlight(expanded ? expandedFocusHighlight : collapsedFocusHighlight);
      titleNode.visible = expanded && options.showTitleWhenExpanded || !expanded;
      pdomContainerNode.setPDOMAttribute('aria-hidden', !expanded);
      this.expandCollapseButton.voicingSpeakFullResponse({
        hintResponse: null
      });
    };
    this.expandedProperty.link(expandedPropertyObserver);
    this.disposeEmitter.addListener(() => this.expandedProperty.unlink(expandedPropertyObserver));
    this.mutate(_.omit(options, 'cursor'));

    // reset things that are owned by AccordionBox
    this.resetAccordionBox = () => {
      // If expandedProperty wasn't provided via options, we own it and therefore need to reset it.
      if (!options.expandedProperty) {
        this.expandedProperty.reset();
      }
    };

    // support for binder documentation, stripped out in builds and only runs when ?binder is specified
    assert && phet?.chipper?.queryParameters?.binder && InstanceRegistry.registerDataURL('sun', 'AccordionBox', this);
  }

  /**
   * Returns the ideal height of the collapsed box (ignoring things like stroke width)
   */
  getCollapsedBoxHeight() {
    const result = this.constraint.lastCollapsedBoxHeight;
    assert && assert(result !== null);
    return result;
  }

  /**
   * Returns the ideal height of the expanded box (ignoring things like stroke width)
   */
  getExpandedBoxHeight() {
    const result = this.constraint.lastExpandedBoxHeight;
    assert && assert(result !== null);
    return result;
  }
  reset() {
    this.resetAccordionBox();
  }

  // The definition for how AccordionBox sets its accessibleName in the PDOM. Forward it onto its expandCollapseButton.
  // See AccordionBox.md for further style guide and documentation on the pattern.
  static ACCORDION_BOX_ACCESSIBLE_NAME_BEHAVIOR = (node, options, accessibleName, callbacksForOtherNodes) => {
    callbacksForOtherNodes.push(() => {
      node.expandCollapseButton.accessibleName = accessibleName;
    });
    return options;
  };
}
class InteractiveHighlightPath extends InteractiveHighlighting(Path) {}
class InteractiveHighlightRectangle extends InteractiveHighlighting(Rectangle) {}
class AccordionBoxConstraint extends LayoutConstraint {
  // Support public accessors
  lastCollapsedBoxHeight = null;
  lastExpandedBoxHeight = null;
  constructor(accordionBox, contentNode, containerNode, expandedBox, collapsedBox, expandedTitleBar, collapsedTitleBar, expandedBoxOutline, collapsedBoxOutline, titleNode, expandCollapseButton, options) {
    super(accordionBox);
    this.accordionBox = accordionBox;
    this.contentNode = contentNode;
    this.containerNode = containerNode;
    this.expandedBox = expandedBox;
    this.collapsedBox = collapsedBox;
    this.expandedTitleBar = expandedTitleBar;
    this.collapsedTitleBar = collapsedTitleBar;
    this.expandedBoxOutline = expandedBoxOutline;
    this.collapsedBoxOutline = collapsedBoxOutline;
    this.titleNode = titleNode;
    this.expandCollapseButton = expandCollapseButton;
    this.options = options;
    this.accordionBox.localPreferredWidthProperty.lazyLink(this._updateLayoutListener);
    this.accordionBox.localPreferredHeightProperty.lazyLink(this._updateLayoutListener);
    this.accordionBox.expandedProperty.lazyLink(this._updateLayoutListener);
    this.addNode(contentNode);
    this.addNode(titleNode);
  }
  layout() {
    super.layout();
    const options = this.options;
    if (this.accordionBox.isChildIncludedInLayout(this.contentNode)) {
      this.containerNode.children = [this.expandedBox, this.collapsedBox, this.titleNode, this.expandCollapseButton];
    } else {
      this.containerNode.children = [];
      return;
    }
    const expanded = this.accordionBox.expandedProperty.value;
    const useExpandedBounds = expanded || options.useExpandedBoundsWhenCollapsed;

    // We only have to account for the lineWidth in our layout if we have a stroke
    const lineWidth = options.stroke === null ? 0 : options.lineWidth;

    // LayoutProxy helps with some layout operations, and will support a non-child content.
    const contentProxy = this.createLayoutProxy(this.contentNode);
    const titleProxy = this.createLayoutProxy(this.titleNode);
    const minimumContentWidth = contentProxy.minimumWidth;
    const minimumContentHeight = contentProxy.minimumHeight;
    const minumumTitleWidth = titleProxy.minimumWidth;

    // The ideal height of the collapsed box (ignoring things like stroke width). Does not depend on title width
    // OR content size, both of which could be changed depending on preferred sizes.
    const collapsedBoxHeight = Math.max(this.expandCollapseButton.height + 2 * options.buttonYMargin, this.titleNode.height + 2 * options.titleYMargin);
    const minimumExpandedBoxHeight = options.showTitleWhenExpanded ?
    // content is below button+title
    Math.max(
    // content (with optional overlap)
    (options.allowContentToOverlapTitle ? options.contentYMargin : collapsedBoxHeight + options.contentYSpacing) + minimumContentHeight + options.contentYMargin,
    // the collapsed box height itself (if we overlap content, this could be larger)
    collapsedBoxHeight) :
    // content is next to button
    Math.max(this.expandCollapseButton.height + 2 * options.buttonYMargin, minimumContentHeight + 2 * options.contentYMargin);

    // The computed width of the box (ignoring things like stroke width)
    // Initial width is dependent on width of title section of the accordion box
    let minimumBoxWidth = Math.max(options.minWidth, options.buttonXMargin + this.expandCollapseButton.width + options.titleXSpacing + minumumTitleWidth + options.titleXMargin);

    // Limit width by the necessary space for the title node
    if (options.titleAlignX === 'center') {
      // Handles case where the spacing on the left side of the title is larger than the spacing on the right side.
      minimumBoxWidth = Math.max(minimumBoxWidth, (options.buttonXMargin + this.expandCollapseButton.width + options.titleXSpacing) * 2 + minumumTitleWidth);

      // Handles case where the spacing on the right side of the title is larger than the spacing on the left side.
      minimumBoxWidth = Math.max(minimumBoxWidth, options.titleXMargin * 2 + minumumTitleWidth);
    }

    // Compare width of title section to content section of the accordion box
    // content is below button+title
    if (options.showTitleWhenExpanded) {
      minimumBoxWidth = Math.max(minimumBoxWidth, minimumContentWidth + 2 * options.contentXMargin);
    }
    // content is next to button
    else {
      minimumBoxWidth = Math.max(minimumBoxWidth, this.expandCollapseButton.width + minimumContentWidth + options.buttonXMargin + options.contentXMargin + options.contentXSpacing);
    }

    // Both of these use "half" the lineWidth on either side
    const minimumWidth = minimumBoxWidth + lineWidth;
    const minimumHeight = (useExpandedBounds ? minimumExpandedBoxHeight : collapsedBoxHeight) + lineWidth;

    // Our resulting sizes (allow setting preferred width/height on the box)
    const preferredWidth = Math.max(minimumWidth, this.accordionBox.localPreferredWidth || 0);
    const preferredHeight = Math.max(minimumHeight, this.accordionBox.localPreferredHeight || 0);
    const boxWidth = preferredWidth - lineWidth;
    const boxHeight = preferredHeight - lineWidth;
    this.lastCollapsedBoxHeight = collapsedBoxHeight;
    if (useExpandedBounds) {
      this.lastExpandedBoxHeight = boxHeight;
    }
    this.collapsedBox.rectWidth = boxWidth;
    this.collapsedBox.rectHeight = collapsedBoxHeight;
    const collapsedBounds = this.collapsedBox.selfBounds;
    this.collapsedTitleBar.rectWidth = boxWidth;
    this.collapsedTitleBar.rectHeight = collapsedBoxHeight;

    // collapsedBoxOutline exists only if options.stroke is truthy
    if (this.collapsedBoxOutline) {
      this.collapsedBoxOutline.rectWidth = boxWidth;
      this.collapsedBoxOutline.rectHeight = collapsedBoxHeight;
    }
    if (useExpandedBounds) {
      this.expandedBox.rectWidth = boxWidth;
      this.expandedBox.rectHeight = boxHeight;
      const expandedBounds = this.expandedBox.selfBounds;

      // expandedBoxOutline exists only if options.stroke is truthy
      if (this.expandedBoxOutline) {
        this.expandedBoxOutline.rectWidth = boxWidth;
        this.expandedBoxOutline.rectHeight = boxHeight;
      }

      // Expanded title bar has (optional) rounded top corners, square bottom corners. Clicking it operates like
      // expand/collapse button.
      this.expandedTitleBar.shape = Shape.roundedRectangleWithRadii(0, 0, boxWidth, collapsedBoxHeight, {
        topLeft: options.cornerRadius,
        topRight: options.cornerRadius
      });
      let contentSpanLeft = expandedBounds.left + options.contentXMargin;
      let contentSpanRight = expandedBounds.right - options.contentXMargin;
      if (!options.showTitleWhenExpanded) {
        // content will be placed next to button
        if (options.buttonAlign === 'left') {
          contentSpanLeft += this.expandCollapseButton.width + options.contentXSpacing;
        } else {
          // right on right
          contentSpanRight -= this.expandCollapseButton.width + options.contentXSpacing;
        }
      }
      const availableContentWidth = contentSpanRight - contentSpanLeft;
      const availableContentHeight = boxHeight - (options.showTitleWhenExpanded && !options.allowContentToOverlapTitle ? collapsedBoxHeight + options.contentYMargin + options.contentYSpacing : 2 * options.contentYMargin);

      // Determine the size available to our content
      // NOTE: We do NOT set preferred sizes of our content if we don't have a preferred size ourself!
      if (isWidthSizable(this.contentNode) && this.accordionBox.localPreferredWidth !== null) {
        this.contentNode.preferredWidth = availableContentWidth;
      }
      if (isHeightSizable(this.contentNode) && this.accordionBox.localPreferredHeight !== null) {
        this.contentNode.preferredHeight = availableContentHeight;
      }

      // content layout
      if (options.contentVerticalAlign === 'top') {
        this.contentNode.top = expandedBounds.bottom - options.contentYMargin - availableContentHeight;
      } else if (options.contentVerticalAlign === 'bottom') {
        this.contentNode.bottom = expandedBounds.bottom - options.contentYMargin;
      } else {
        // center
        this.contentNode.centerY = expandedBounds.bottom - options.contentYMargin - availableContentHeight / 2;
      }
      if (options.contentAlign === 'left') {
        this.contentNode.left = contentSpanLeft;
      } else if (options.contentAlign === 'right') {
        this.contentNode.right = contentSpanRight;
      } else {
        // center
        this.contentNode.centerX = (contentSpanLeft + contentSpanRight) / 2;
      }
    }

    // button horizontal layout
    let titleLeftSpan = collapsedBounds.left + options.titleXMargin;
    let titleRightSpan = collapsedBounds.right - options.titleXMargin;
    if (options.buttonAlign === 'left') {
      this.expandCollapseButton.left = collapsedBounds.left + options.buttonXMargin;
      titleLeftSpan = this.expandCollapseButton.right + options.titleXSpacing;
    } else {
      this.expandCollapseButton.right = collapsedBounds.right - options.buttonXMargin;
      titleRightSpan = this.expandCollapseButton.left - options.titleXSpacing;
    }

    // title horizontal layout
    if (isWidthSizable(this.titleNode)) {
      this.titleNode.preferredWidth = titleRightSpan - titleLeftSpan;
    }
    if (options.titleAlignX === 'left') {
      this.titleNode.left = titleLeftSpan;
    } else if (options.titleAlignX === 'right') {
      this.titleNode.right = titleRightSpan;
    } else {
      // center
      this.titleNode.centerX = collapsedBounds.centerX;
    }

    // button & title vertical layout
    if (options.titleAlignY === 'top') {
      this.expandCollapseButton.top = this.collapsedBox.top + Math.max(options.buttonYMargin, options.titleYMargin);
      this.titleNode.top = this.expandCollapseButton.top;
    } else {
      // center
      this.expandCollapseButton.centerY = this.collapsedBox.centerY;
      this.titleNode.centerY = this.expandCollapseButton.centerY;
    }
    contentProxy.dispose();
    titleProxy.dispose();

    // Set minimums at the end, since this may trigger a relayout
    this.accordionBox.localMinimumWidth = minimumWidth;
    this.accordionBox.localMinimumHeight = minimumHeight;
  }
  dispose() {
    this.accordionBox.localPreferredWidthProperty.unlink(this._updateLayoutListener);
    this.accordionBox.localPreferredHeightProperty.unlink(this._updateLayoutListener);
    this.accordionBox.expandedProperty.unlink(this._updateLayoutListener);
    super.dispose();
  }
}
sun.register('AccordionBox', AccordionBox);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJTaGFwZSIsIkluc3RhbmNlUmVnaXN0cnkiLCJvcHRpb25pemUiLCJjb21iaW5lT3B0aW9ucyIsIkhpZ2hsaWdodEZyb21Ob2RlIiwiSW50ZXJhY3RpdmVIaWdobGlnaHRpbmciLCJpc0hlaWdodFNpemFibGUiLCJpc1dpZHRoU2l6YWJsZSIsIkxheW91dENvbnN0cmFpbnQiLCJOb2RlIiwiUGF0aCIsIlBET01QZWVyIiwiUmVjdGFuZ2xlIiwiU2l6YWJsZSIsIlRleHQiLCJhY2NvcmRpb25Cb3hDbG9zZWRTb3VuZFBsYXllciIsImFjY29yZGlvbkJveE9wZW5lZFNvdW5kUGxheWVyIiwiRXZlbnRUeXBlIiwiVGFuZGVtIiwiSU9UeXBlIiwiRXhwYW5kQ29sbGFwc2VCdXR0b24iLCJzdW4iLCJBY2NvcmRpb25Cb3giLCJleHBhbmRlZEJveE91dGxpbmUiLCJjb2xsYXBzZWRCb3hPdXRsaW5lIiwiQWNjb3JkaW9uQm94SU8iLCJ2YWx1ZVR5cGUiLCJzdXBlcnR5cGUiLCJOb2RlSU8iLCJldmVudHMiLCJjb25zdHJ1Y3RvciIsImNvbnRlbnROb2RlIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsInRpdGxlTm9kZSIsImV4cGFuZGVkUHJvcGVydHkiLCJyZXNpemUiLCJvdmVycmlkZVRpdGxlTm9kZVBpY2thYmxlIiwiYWxsb3dDb250ZW50VG9PdmVybGFwVGl0bGUiLCJjdXJzb3IiLCJsaW5lV2lkdGgiLCJjb3JuZXJSYWRpdXMiLCJzdHJva2UiLCJmaWxsIiwibWluV2lkdGgiLCJ0aXRsZUFsaWduWCIsInRpdGxlQWxpZ25ZIiwidGl0bGVYTWFyZ2luIiwidGl0bGVZTWFyZ2luIiwidGl0bGVYU3BhY2luZyIsInNob3dUaXRsZVdoZW5FeHBhbmRlZCIsInVzZUV4cGFuZGVkQm91bmRzV2hlbkNvbGxhcHNlZCIsInRpdGxlQmFyRXhwYW5kQ29sbGFwc2UiLCJidXR0b25BbGlnbiIsImJ1dHRvblhNYXJnaW4iLCJidXR0b25ZTWFyZ2luIiwiY29udGVudEFsaWduIiwiY29udGVudFZlcnRpY2FsQWxpZ24iLCJjb250ZW50WE1hcmdpbiIsImNvbnRlbnRZTWFyZ2luIiwiY29udGVudFhTcGFjaW5nIiwiY29udGVudFlTcGFjaW5nIiwiZXhwYW5kZWRTb3VuZFBsYXllciIsImNvbGxhcHNlZFNvdW5kUGxheWVyIiwidGFnTmFtZSIsImhlYWRpbmdUYWdOYW1lIiwiYWNjZXNzaWJsZU5hbWVCZWhhdmlvciIsIkFDQ09SRElPTl9CT1hfQUNDRVNTSUJMRV9OQU1FX0JFSEFWSU9SIiwidm9pY2luZ05hbWVSZXNwb25zZSIsInZvaWNpbmdPYmplY3RSZXNwb25zZSIsInZvaWNpbmdDb250ZXh0UmVzcG9uc2UiLCJ2b2ljaW5nSGludFJlc3BvbnNlIiwidGFuZGVtIiwiUkVRVUlSRUQiLCJ0YW5kZW1OYW1lU3VmZml4IiwicGhldGlvVHlwZSIsInBoZXRpb0V2ZW50VHlwZSIsIlVTRVIiLCJ2aXNpYmxlUHJvcGVydHlPcHRpb25zIiwicGhldGlvRmVhdHVyZWQiLCJ0aXRsZUJhck9wdGlvbnMiLCJleHBhbmRDb2xsYXBzZUJ1dHRvbk9wdGlvbnMiLCJzaWRlTGVuZ3RoIiwidmFsdWVPblNvdW5kUGxheWVyIiwidmFsdWVPZmZTb3VuZFBsYXllciIsImNyZWF0ZVRhbmRlbSIsImRpc3Bvc2VFbWl0dGVyIiwiYWRkTGlzdGVuZXIiLCJkaXNwb3NlIiwicGlja2FibGUiLCJleHBhbmRDb2xsYXBzZUJ1dHRvbiIsImJveE9wdGlvbnMiLCJleHBhbmRlZEJveCIsImNvbGxhcHNlZEJveCIsImV4cGFuZGVkVGl0bGVCYXIiLCJJbnRlcmFjdGl2ZUhpZ2hsaWdodFBhdGgiLCJhZGRDaGlsZCIsImNvbGxhcHNlZFRpdGxlQmFyIiwiSW50ZXJhY3RpdmVIaWdobGlnaHRSZWN0YW5nbGUiLCJleHBhbmRlZEZvY3VzSGlnaGxpZ2h0IiwiY29sbGFwc2VkRm9jdXNIaWdobGlnaHQiLCJhZGRJbnB1dExpc3RlbmVyIiwiZG93biIsImlzRW5hYmxlZCIsInBoZXRpb1N0YXJ0RXZlbnQiLCJ2YWx1ZSIsInBsYXkiLCJwaGV0aW9FbmRFdmVudCIsImludGVyYWN0aXZlSGlnaGxpZ2h0IiwicGlja2FibGVMaXN0ZW5lciIsInZpc2libGUiLCJ2aXNpYmxlUHJvcGVydHkiLCJsYXp5TGluayIsInBpY2thYmxlUHJvcGVydHkiLCJlbmFibGVkUHJvcGVydHkiLCJsaW5rIiwiZW5hYmxlZCIsInNob3dDdXJzb3IiLCJvdXRsaW5lT3B0aW9ucyIsImNvbnRhaW5lck5vZGUiLCJleGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzIiwicGRvbUNvbnRlbnROb2RlIiwiYXJpYVJvbGUiLCJwZG9tT3JkZXIiLCJhcmlhTGFiZWxsZWRieUFzc29jaWF0aW9ucyIsIm90aGVyTm9kZSIsIm90aGVyRWxlbWVudE5hbWUiLCJQUklNQVJZX1NJQkxJTkciLCJ0aGlzRWxlbWVudE5hbWUiLCJwZG9tSGVhZGluZyIsInBkb21Db250YWluZXJOb2RlIiwiY2hpbGRyZW4iLCJjb25zdHJhaW50IiwiQWNjb3JkaW9uQm94Q29uc3RyYWludCIsInVwZGF0ZUxheW91dCIsImV4cGFuZGVkUHJvcGVydHlPYnNlcnZlciIsImV4cGFuZGVkIiwic2V0Rm9jdXNIaWdobGlnaHQiLCJzZXRQRE9NQXR0cmlidXRlIiwidm9pY2luZ1NwZWFrRnVsbFJlc3BvbnNlIiwiaGludFJlc3BvbnNlIiwidW5saW5rIiwibXV0YXRlIiwiXyIsIm9taXQiLCJyZXNldEFjY29yZGlvbkJveCIsInJlc2V0IiwiYXNzZXJ0IiwicGhldCIsImNoaXBwZXIiLCJxdWVyeVBhcmFtZXRlcnMiLCJiaW5kZXIiLCJyZWdpc3RlckRhdGFVUkwiLCJnZXRDb2xsYXBzZWRCb3hIZWlnaHQiLCJyZXN1bHQiLCJsYXN0Q29sbGFwc2VkQm94SGVpZ2h0IiwiZ2V0RXhwYW5kZWRCb3hIZWlnaHQiLCJsYXN0RXhwYW5kZWRCb3hIZWlnaHQiLCJub2RlIiwiYWNjZXNzaWJsZU5hbWUiLCJjYWxsYmFja3NGb3JPdGhlck5vZGVzIiwicHVzaCIsImFjY29yZGlvbkJveCIsImxvY2FsUHJlZmVycmVkV2lkdGhQcm9wZXJ0eSIsIl91cGRhdGVMYXlvdXRMaXN0ZW5lciIsImxvY2FsUHJlZmVycmVkSGVpZ2h0UHJvcGVydHkiLCJhZGROb2RlIiwibGF5b3V0IiwiaXNDaGlsZEluY2x1ZGVkSW5MYXlvdXQiLCJ1c2VFeHBhbmRlZEJvdW5kcyIsImNvbnRlbnRQcm94eSIsImNyZWF0ZUxheW91dFByb3h5IiwidGl0bGVQcm94eSIsIm1pbmltdW1Db250ZW50V2lkdGgiLCJtaW5pbXVtV2lkdGgiLCJtaW5pbXVtQ29udGVudEhlaWdodCIsIm1pbmltdW1IZWlnaHQiLCJtaW51bXVtVGl0bGVXaWR0aCIsImNvbGxhcHNlZEJveEhlaWdodCIsIk1hdGgiLCJtYXgiLCJoZWlnaHQiLCJtaW5pbXVtRXhwYW5kZWRCb3hIZWlnaHQiLCJtaW5pbXVtQm94V2lkdGgiLCJ3aWR0aCIsInByZWZlcnJlZFdpZHRoIiwibG9jYWxQcmVmZXJyZWRXaWR0aCIsInByZWZlcnJlZEhlaWdodCIsImxvY2FsUHJlZmVycmVkSGVpZ2h0IiwiYm94V2lkdGgiLCJib3hIZWlnaHQiLCJyZWN0V2lkdGgiLCJyZWN0SGVpZ2h0IiwiY29sbGFwc2VkQm91bmRzIiwic2VsZkJvdW5kcyIsImV4cGFuZGVkQm91bmRzIiwic2hhcGUiLCJyb3VuZGVkUmVjdGFuZ2xlV2l0aFJhZGlpIiwidG9wTGVmdCIsInRvcFJpZ2h0IiwiY29udGVudFNwYW5MZWZ0IiwibGVmdCIsImNvbnRlbnRTcGFuUmlnaHQiLCJyaWdodCIsImF2YWlsYWJsZUNvbnRlbnRXaWR0aCIsImF2YWlsYWJsZUNvbnRlbnRIZWlnaHQiLCJ0b3AiLCJib3R0b20iLCJjZW50ZXJZIiwiY2VudGVyWCIsInRpdGxlTGVmdFNwYW4iLCJ0aXRsZVJpZ2h0U3BhbiIsImxvY2FsTWluaW11bVdpZHRoIiwibG9jYWxNaW5pbXVtSGVpZ2h0IiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJBY2NvcmRpb25Cb3gudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQm94IHRoYXQgY2FuIGJlIGV4cGFuZGVkL2NvbGxhcHNlZCB0byBzaG93L2hpZGUgY29udGVudHMuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9obiBCbGFuY28gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgQ2hyaXMgTWFsbGV5IChQaXhlbFpvb20sIEluYy4pXHJcbiAqL1xyXG5cclxuaW1wb3J0IEJvb2xlYW5Qcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL0Jvb2xlYW5Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tICcuLi8uLi9raXRlL2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgSW5zdGFuY2VSZWdpc3RyeSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvZG9jdW1lbnRhdGlvbi9JbnN0YW5jZVJlZ2lzdHJ5LmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBjb21iaW5lT3B0aW9ucyB9IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgU3RyaWN0T21pdCBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvU3RyaWN0T21pdC5qcyc7XHJcbmltcG9ydCB7IEhpZ2hsaWdodEZyb21Ob2RlLCBJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZywgaXNIZWlnaHRTaXphYmxlLCBpc1dpZHRoU2l6YWJsZSwgTGF5b3V0Q29uc3RyYWludCwgTm9kZSwgTm9kZU9wdGlvbnMsIFBhaW50YWJsZU9wdGlvbnMsIFBhdGgsIFBhdGhPcHRpb25zLCBQRE9NQmVoYXZpb3JGdW5jdGlvbiwgUERPTVBlZXIsIFJlY3RhbmdsZSwgUmVjdGFuZ2xlT3B0aW9ucywgU2l6YWJsZSwgVGV4dCB9IGZyb20gJy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBhY2NvcmRpb25Cb3hDbG9zZWRTb3VuZFBsYXllciBmcm9tICcuLi8uLi90YW1iby9qcy9zaGFyZWQtc291bmQtcGxheWVycy9hY2NvcmRpb25Cb3hDbG9zZWRTb3VuZFBsYXllci5qcyc7XHJcbmltcG9ydCBhY2NvcmRpb25Cb3hPcGVuZWRTb3VuZFBsYXllciBmcm9tICcuLi8uLi90YW1iby9qcy9zaGFyZWQtc291bmQtcGxheWVycy9hY2NvcmRpb25Cb3hPcGVuZWRTb3VuZFBsYXllci5qcyc7XHJcbmltcG9ydCBTb3VuZENsaXBQbGF5ZXIgZnJvbSAnLi4vLi4vdGFtYm8vanMvc291bmQtZ2VuZXJhdG9ycy9Tb3VuZENsaXBQbGF5ZXIuanMnO1xyXG5pbXBvcnQgRXZlbnRUeXBlIGZyb20gJy4uLy4uL3RhbmRlbS9qcy9FdmVudFR5cGUuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgSU9UeXBlIGZyb20gJy4uLy4uL3RhbmRlbS9qcy90eXBlcy9JT1R5cGUuanMnO1xyXG5pbXBvcnQgeyBWb2ljaW5nUmVzcG9uc2UgfSBmcm9tICcuLi8uLi91dHRlcmFuY2UtcXVldWUvanMvUmVzcG9uc2VQYWNrZXQuanMnO1xyXG5pbXBvcnQgRXhwYW5kQ29sbGFwc2VCdXR0b24sIHsgRXhwYW5kQ29sbGFwc2VCdXR0b25PcHRpb25zIH0gZnJvbSAnLi9FeHBhbmRDb2xsYXBzZUJ1dHRvbi5qcyc7XHJcbmltcG9ydCBzdW4gZnJvbSAnLi9zdW4uanMnO1xyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcblxyXG50eXBlIFNlbGZPcHRpb25zID0ge1xyXG4gIC8vIElmIG5vdCBwcm92aWRlZCwgYSBUZXh0IG5vZGUgd2lsbCBiZSBzdXBwbGllZC4gU2hvdWxkIGhhdmUgYW5kIG1haW50YWluIHdlbGwtZGVmaW5lZCBib3VuZHMgaWYgcGFzc2VkIGluXHJcbiAgdGl0bGVOb2RlPzogTm9kZTtcclxuXHJcbiAgLy8gSWYgbm90IHByb3ZpZGVkLCBhIEJvb2xlYW5Qcm9wZXJ0eSB3aWxsIGJlIGNyZWF0ZWQsIGRlZmF1bHRpbmcgdG8gdHJ1ZS5cclxuICBleHBhbmRlZFByb3BlcnR5PzogUHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8vIElmIHRydWUgKHRoZSBkZWZhdWx0KSwgd2UnbGwgYWRqdXN0IHRoZSB0aXRsZSBzbyB0aGF0IGl0IGlzbid0IHBpY2thYmxlIGF0IGFsbFxyXG4gIG92ZXJyaWRlVGl0bGVOb2RlUGlja2FibGU/OiBib29sZWFuO1xyXG5cclxuICAvLyBJZiB0cnVlLCB0aGUgQWNjb3JkaW9uQm94IHdpbGwgcmVzaXplIGl0c2VsZiBhcyBuZWVkZWQgd2hlbiB0aGUgdGl0bGUvY29udGVudCByZXNpemVzLlxyXG4gIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc3VuL2lzc3Vlcy8zMDRcclxuICByZXNpemU/OiBib29sZWFuO1xyXG5cclxuICAvLyBhcHBsaWVkIHRvIG11bHRpcGxlIHBhcnRzIG9mIHRoaXMgVUkgY29tcG9uZW50IChOT1RFOiBjdXJzb3IgaXMgTk9UIGFwcGxpZWQgdG8gdGhlIG1haW4gbm9kZSEhKVxyXG4gIGN1cnNvcj86IE5vZGVPcHRpb25zWyAnY3Vyc29yJyBdO1xyXG4gIGxpbmVXaWR0aD86IFBhdGhPcHRpb25zWyAnbGluZVdpZHRoJyBdO1xyXG4gIGNvcm5lclJhZGl1cz86IFJlY3RhbmdsZU9wdGlvbnNbICdjb3JuZXJSYWRpdXMnIF07XHJcblxyXG4gIC8vIEZvciB0aGUgYm94XHJcbiAgc3Ryb2tlPzogUGFpbnRhYmxlT3B0aW9uc1sgJ3N0cm9rZScgXTtcclxuICBmaWxsPzogUGFpbnRhYmxlT3B0aW9uc1sgJ2ZpbGwnIF07XHJcbiAgbWluV2lkdGg/OiBudW1iZXI7XHJcblxyXG4gIC8vIGhvcml6b250YWwgYWxpZ25tZW50IG9mIHRoZSB0aXRsZSwgJ2xlZnQnfCdjZW50ZXInfCdyaWdodCdcclxuICB0aXRsZUFsaWduWD86ICdjZW50ZXInIHwgJ2xlZnQnIHwgJ3JpZ2h0JztcclxuXHJcbiAgLy8gdmVydGljYWwgYWxpZ25tZW50IG9mIHRoZSB0aXRsZSwgcmVsYXRpdmUgdG8gZXhwYW5kL2NvbGxhcHNlIGJ1dHRvbiAndG9wJ3wnY2VudGVyJ1xyXG4gIHRpdGxlQWxpZ25ZPzogJ3RvcCcgfCAnY2VudGVyJztcclxuXHJcbiAgLy8gaG9yaXpvbnRhbCBzcGFjZSBiZXR3ZWVuIHRpdGxlIGFuZCBsZWZ0fHJpZ2h0IGVkZ2Ugb2YgYm94XHJcbiAgdGl0bGVYTWFyZ2luPzogbnVtYmVyO1xyXG5cclxuICAvLyB2ZXJ0aWNhbCBzcGFjZSBiZXR3ZWVuIHRpdGxlIGFuZCB0b3Agb2YgYm94XHJcbiAgdGl0bGVZTWFyZ2luPzogbnVtYmVyO1xyXG5cclxuICAvLyBob3Jpem9udGFsIHNwYWNlIGJldHdlZW4gdGl0bGUgYW5kIGV4cGFuZC9jb2xsYXBzZSBidXR0b25cclxuICB0aXRsZVhTcGFjaW5nPzogbnVtYmVyO1xyXG5cclxuICAvLyB0cnVlID0gdGl0bGUgaXMgdmlzaWJsZSB3aGVuIGV4cGFuZGVkLCBmYWxzZSA9IHRpdGxlIGlzIGhpZGRlbiB3aGVuIGV4cGFuZGVkXHJcbiAgLy8gV2hlbiB0cnVlLCB0aGUgY29udGVudCBpcyBzaG93biBiZW5lYXRoIHRoZSB0aXRsZS4gV2hlbiBmYWxzZSwgdGhlIGNvbnRlbnQgaXMgc2hvd24gdG8gdGhlIHNpZGUgb2YgdGhlIHRpdGxlXHJcbiAgc2hvd1RpdGxlV2hlbkV4cGFuZGVkPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gSWYgdHJ1ZSwgdGhlIGV4cGFuZGVkIGJveCB3aWxsIHVzZSB0aGUgYm91bmRzIG9mIHRoZSBjb250ZW50IG5vZGUgd2hlbiBjb2xsYXBzZWRcclxuICB1c2VFeHBhbmRlZEJvdW5kc1doZW5Db2xsYXBzZWQ/OiBib29sZWFuO1xyXG5cclxuICAvLyBjbGlja2luZyBvbiB0aGUgdGl0bGUgYmFyIGV4cGFuZHMvY29sbGFwc2VzIHRoZSBhY2NvcmRpb24gYm94XHJcbiAgdGl0bGVCYXJFeHBhbmRDb2xsYXBzZT86IGJvb2xlYW47XHJcblxyXG4gIC8vIGlmIHRydWUsIHRoZSBjb250ZW50IHdpbGwgb3ZlcmxhcCB0aGUgdGl0bGUgd2hlbiBleHBhbmRlZCwgYW5kIHdpbGwgdXNlIGNvbnRlbnRZTWFyZ2luIGF0IHRoZSB0b3BcclxuICBhbGxvd0NvbnRlbnRUb092ZXJsYXBUaXRsZT86IGJvb2xlYW47XHJcblxyXG4gIC8vIG9wdGlvbnMgcGFzc2VkIHRvIEV4cGFuZENvbGxhcHNlQnV0dG9uIGNvbnN0cnVjdG9yXHJcbiAgZXhwYW5kQ29sbGFwc2VCdXR0b25PcHRpb25zPzogRXhwYW5kQ29sbGFwc2VCdXR0b25PcHRpb25zO1xyXG5cclxuICAvLyBleHBhbmQvY29sbGFwc2UgYnV0dG9uIGxheW91dFxyXG4gIGJ1dHRvbkFsaWduPzogJ2xlZnQnIHwgJ3JpZ2h0JzsgLy8gYnV0dG9uIGFsaWdubWVudCwgJ2xlZnQnfCdyaWdodCdcclxuICBidXR0b25YTWFyZ2luPzogbnVtYmVyOyAvLyBob3Jpem9udGFsIHNwYWNlIGJldHdlZW4gYnV0dG9uIGFuZCBsZWZ0fHJpZ2h0IGVkZ2Ugb2YgYm94XHJcbiAgYnV0dG9uWU1hcmdpbj86IG51bWJlcjsgLy8gdmVydGljYWwgc3BhY2UgYmV0d2VlbiBidXR0b24gYW5kIHRvcCBlZGdlIG9mIGJveFxyXG5cclxuICAvLyBjb250ZW50XHJcbiAgY29udGVudEFsaWduPzogJ2xlZnQnIHwgJ2NlbnRlcicgfCAncmlnaHQnOyAvLyBob3Jpem9udGFsIGFsaWdubWVudCBvZiB0aGUgY29udGVudFxyXG4gIGNvbnRlbnRWZXJ0aWNhbEFsaWduPzogJ3RvcCcgfCAnY2VudGVyJyB8ICdib3R0b20nOyAvLyB2ZXJ0aWNhbCBhbGlnbm1lbnQgb2YgdGhlIGNvbnRlbnQgKGlmIHRoZSBwcmVmZXJyZWQgc2l6ZSBpcyBsYXJnZXIpXHJcbiAgY29udGVudFhNYXJnaW4/OiBudW1iZXI7IC8vIGhvcml6b250YWwgc3BhY2UgYmV0d2VlbiBjb250ZW50IGFuZCBsZWZ0L3JpZ2h0IGVkZ2VzIG9mIGJveFxyXG4gIGNvbnRlbnRZTWFyZ2luPzogbnVtYmVyOyAvLyB2ZXJ0aWNhbCBzcGFjZSBiZXR3ZWVuIGNvbnRlbnQgYW5kIGJvdHRvbSBlZGdlIG9mIGJveCAoYW5kIHRvcCBpZiBhbGxvd0NvbnRlbnRUb092ZXJsYXBUaXRsZSBpcyB0cnVlKVxyXG4gIGNvbnRlbnRYU3BhY2luZz86IG51bWJlcjsgLy8gaG9yaXpvbnRhbCBzcGFjZSBiZXR3ZWVuIGNvbnRlbnQgYW5kIGJ1dHRvbiwgaWdub3JlZCBpZiBzaG93VGl0bGVXaGVuRXhwYW5kZWQgaXMgdHJ1ZVxyXG4gIGNvbnRlbnRZU3BhY2luZz86IG51bWJlcjsgLy8gdmVydGljYWwgc3BhY2UgYmV0d2VlbiBjb250ZW50IGFuZCB0aXRsZStidXR0b24sIGlnbm9yZWQgaWYgc2hvd1RpdGxlV2hlbkV4cGFuZGVkIGlzIGZhbHNlXHJcblxyXG4gIHRpdGxlQmFyT3B0aW9ucz86IFJlY3RhbmdsZU9wdGlvbnM7XHJcblxyXG4gIC8vIHNvdW5kIGdlbmVyYXRvcnMgZm9yIGV4cGFuZCBhbmQgY29sbGFwc2VcclxuICBleHBhbmRlZFNvdW5kUGxheWVyPzogU291bmRDbGlwUGxheWVyO1xyXG4gIGNvbGxhcHNlZFNvdW5kUGxheWVyPzogU291bmRDbGlwUGxheWVyO1xyXG5cclxuICAvLyB2b2ljaW5nIC0gVGhlc2UgYXJlIGRlZmluZWQgaGVyZSBpbiBBY2NvcmRpb25Cb3ggKGR1cGxpY2F0ZWQgZnJvbSBWb2ljaW5nKSBzbyB0aGF0IHRoZXkgY2FuIGJlIHBhc3NlZCB0byB0aGVcclxuICAvLyBleHBhbmRDb2xsYXBzZSBidXR0b24sIHdoaWNoIGhhbmRsZXMgdm9pY2luZyBmb3IgQWNjb3JkaW9uQm94LCB3aXRob3V0IEFjY29yZGlvbkJveCBtaXhpbmcgVm9pY2luZyBpdHNlbGYuXHJcbiAgdm9pY2luZ05hbWVSZXNwb25zZT86IFZvaWNpbmdSZXNwb25zZTtcclxuICB2b2ljaW5nT2JqZWN0UmVzcG9uc2U/OiBWb2ljaW5nUmVzcG9uc2U7XHJcbiAgdm9pY2luZ0NvbnRleHRSZXNwb25zZT86IFZvaWNpbmdSZXNwb25zZTtcclxuICB2b2ljaW5nSGludFJlc3BvbnNlPzogVm9pY2luZ1Jlc3BvbnNlO1xyXG5cclxuICAvLyBwZG9tXHJcbiAgaGVhZGluZ1RhZ05hbWU/OiBzdHJpbmc7XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBBY2NvcmRpb25Cb3hPcHRpb25zID0gU2VsZk9wdGlvbnMgJiBOb2RlT3B0aW9ucztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFjY29yZGlvbkJveCBleHRlbmRzIFNpemFibGUoIE5vZGUgKSB7XHJcblxyXG4gIHB1YmxpYyByZWFkb25seSBleHBhbmRlZFByb3BlcnR5OiBQcm9wZXJ0eTxib29sZWFuPjtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBleHBhbmRDb2xsYXBzZUJ1dHRvbjogRXhwYW5kQ29sbGFwc2VCdXR0b247XHJcbiAgcHJpdmF0ZSByZWFkb25seSBleHBhbmRlZEJveDogUmVjdGFuZ2xlO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgY29sbGFwc2VkQm94OiBSZWN0YW5nbGU7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBleHBhbmRlZFRpdGxlQmFyOiBJbnRlcmFjdGl2ZUhpZ2hsaWdodFBhdGg7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBjb2xsYXBzZWRUaXRsZUJhcjogSW50ZXJhY3RpdmVIaWdobGlnaHRSZWN0YW5nbGU7XHJcbiAgcHJpdmF0ZSByZWFkb25seSByZXNldEFjY29yZGlvbkJveDogKCkgPT4gdm9pZDtcclxuXHJcbiAgLy8gT25seSBkZWZpbmVkIGlmIHRoZXJlIGlzIGEgc3Ryb2tlXHJcbiAgcHJpdmF0ZSByZWFkb25seSBleHBhbmRlZEJveE91dGxpbmU6IFJlY3RhbmdsZSB8IG51bGwgPSBudWxsO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgY29sbGFwc2VkQm94T3V0bGluZTogUmVjdGFuZ2xlIHwgbnVsbCA9IG51bGw7XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgY29uc3RyYWludDogQWNjb3JkaW9uQm94Q29uc3RyYWludDtcclxuXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBBY2NvcmRpb25Cb3hJTyA9IG5ldyBJT1R5cGUoICdBY2NvcmRpb25Cb3hJTycsIHtcclxuICAgIHZhbHVlVHlwZTogQWNjb3JkaW9uQm94LFxyXG4gICAgc3VwZXJ0eXBlOiBOb2RlLk5vZGVJTyxcclxuICAgIGV2ZW50czogWyAnZXhwYW5kZWQnLCAnY29sbGFwc2VkJyBdXHJcbiAgfSApO1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gY29udGVudE5vZGUgLSBDb250ZW50IHRoYXQgIHdpbGwgYmUgc2hvd24gb3IgaGlkZGVuIGFzIHRoZSBhY2NvcmRpb24gYm94IGlzIGV4cGFuZGVkL2NvbGxhcHNlZC4gTk9URTogQWNjb3JkaW9uQm94XHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgcGxhY2VzIHRoaXMgTm9kZSBpbiBhIHBkb21PcmRlciwgc28geW91IHNob3VsZCBub3QgZG8gdGhhdCB5b3Vyc2VsZi5cclxuICAgKiBAcGFyYW0gW3Byb3ZpZGVkT3B0aW9uc11cclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIGNvbnRlbnROb2RlOiBOb2RlLCBwcm92aWRlZE9wdGlvbnM/OiBBY2NvcmRpb25Cb3hPcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8QWNjb3JkaW9uQm94T3B0aW9ucywgU3RyaWN0T21pdDxTZWxmT3B0aW9ucywgJ2V4cGFuZENvbGxhcHNlQnV0dG9uT3B0aW9ucyc+LCBOb2RlT3B0aW9ucz4oKSgge1xyXG5cclxuICAgICAgdGl0bGVOb2RlOiBudWxsIGFzIHVua25vd24gYXMgTm9kZSxcclxuICAgICAgZXhwYW5kZWRQcm9wZXJ0eTogbnVsbCBhcyB1bmtub3duIGFzIEJvb2xlYW5Qcm9wZXJ0eSxcclxuICAgICAgcmVzaXplOiB0cnVlLFxyXG5cclxuICAgICAgb3ZlcnJpZGVUaXRsZU5vZGVQaWNrYWJsZTogdHJ1ZSxcclxuICAgICAgYWxsb3dDb250ZW50VG9PdmVybGFwVGl0bGU6IGZhbHNlLFxyXG5cclxuICAgICAgLy8gYXBwbGllZCB0byBtdWx0aXBsZSBwYXJ0cyBvZiB0aGlzIFVJIGNvbXBvbmVudFxyXG4gICAgICBjdXJzb3I6ICdwb2ludGVyJyxcclxuICAgICAgbGluZVdpZHRoOiAxLFxyXG4gICAgICBjb3JuZXJSYWRpdXM6IDEwLFxyXG5cclxuICAgICAgLy8gYm94XHJcbiAgICAgIHN0cm9rZTogJ2JsYWNrJyxcclxuICAgICAgZmlsbDogJ3JnYiggMjM4LCAyMzgsIDIzOCApJyxcclxuICAgICAgbWluV2lkdGg6IDAsXHJcblxyXG4gICAgICB0aXRsZUFsaWduWDogJ2NlbnRlcicsXHJcbiAgICAgIHRpdGxlQWxpZ25ZOiAnY2VudGVyJyxcclxuICAgICAgdGl0bGVYTWFyZ2luOiAxMCxcclxuICAgICAgdGl0bGVZTWFyZ2luOiAyLFxyXG4gICAgICB0aXRsZVhTcGFjaW5nOiA1LFxyXG4gICAgICBzaG93VGl0bGVXaGVuRXhwYW5kZWQ6IHRydWUsXHJcbiAgICAgIHVzZUV4cGFuZGVkQm91bmRzV2hlbkNvbGxhcHNlZDogdHJ1ZSxcclxuICAgICAgdGl0bGVCYXJFeHBhbmRDb2xsYXBzZTogdHJ1ZSxcclxuXHJcbiAgICAgIC8vIGV4cGFuZC9jb2xsYXBzZSBidXR0b24gbGF5b3V0XHJcbiAgICAgIGJ1dHRvbkFsaWduOiAnbGVmdCcsXHJcbiAgICAgIGJ1dHRvblhNYXJnaW46IDQsXHJcbiAgICAgIGJ1dHRvbllNYXJnaW46IDIsXHJcblxyXG4gICAgICAvLyBjb250ZW50XHJcbiAgICAgIGNvbnRlbnRBbGlnbjogJ2NlbnRlcicsXHJcbiAgICAgIGNvbnRlbnRWZXJ0aWNhbEFsaWduOiAnY2VudGVyJyxcclxuICAgICAgY29udGVudFhNYXJnaW46IDE1LFxyXG4gICAgICBjb250ZW50WU1hcmdpbjogOCxcclxuICAgICAgY29udGVudFhTcGFjaW5nOiA1LFxyXG4gICAgICBjb250ZW50WVNwYWNpbmc6IDgsXHJcblxyXG4gICAgICAvLyBzb3VuZFxyXG4gICAgICBleHBhbmRlZFNvdW5kUGxheWVyOiBhY2NvcmRpb25Cb3hPcGVuZWRTb3VuZFBsYXllcixcclxuICAgICAgY29sbGFwc2VkU291bmRQbGF5ZXI6IGFjY29yZGlvbkJveENsb3NlZFNvdW5kUGxheWVyLFxyXG5cclxuICAgICAgLy8gcGRvbVxyXG4gICAgICB0YWdOYW1lOiAnZGl2JyxcclxuICAgICAgaGVhZGluZ1RhZ05hbWU6ICdoMycsIC8vIHNwZWNpZnkgdGhlIGhlYWRpbmcgdGhhdCB0aGlzIEFjY29yZGlvbkJveCB3aWxsIGJlLCBUT0RPOiB1c2UgdGhpcy5oZWFkaW5nTGV2ZWwgd2hlbiBubyBsb25nZXIgZXhwZXJpbWVudGFsIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy84NTVcclxuICAgICAgYWNjZXNzaWJsZU5hbWVCZWhhdmlvcjogQWNjb3JkaW9uQm94LkFDQ09SRElPTl9CT1hfQUNDRVNTSUJMRV9OQU1FX0JFSEFWSU9SLFxyXG5cclxuICAgICAgLy8gdm9pY2luZ1xyXG4gICAgICB2b2ljaW5nTmFtZVJlc3BvbnNlOiBudWxsLFxyXG4gICAgICB2b2ljaW5nT2JqZWN0UmVzcG9uc2U6IG51bGwsXHJcbiAgICAgIHZvaWNpbmdDb250ZXh0UmVzcG9uc2U6IG51bGwsXHJcbiAgICAgIHZvaWNpbmdIaW50UmVzcG9uc2U6IG51bGwsXHJcblxyXG4gICAgICAvLyBwaGV0LWlvIHN1cHBvcnRcclxuICAgICAgdGFuZGVtOiBUYW5kZW0uUkVRVUlSRUQsXHJcbiAgICAgIHRhbmRlbU5hbWVTdWZmaXg6ICdBY2NvcmRpb25Cb3gnLFxyXG4gICAgICBwaGV0aW9UeXBlOiBBY2NvcmRpb25Cb3guQWNjb3JkaW9uQm94SU8sXHJcbiAgICAgIHBoZXRpb0V2ZW50VHlwZTogRXZlbnRUeXBlLlVTRVIsXHJcbiAgICAgIHZpc2libGVQcm9wZXJ0eU9wdGlvbnM6IHsgcGhldGlvRmVhdHVyZWQ6IHRydWUgfSxcclxuXHJcbiAgICAgIHRpdGxlQmFyT3B0aW9uczoge1xyXG4gICAgICAgIGZpbGw6IG51bGwsIC8vIHRpdGxlIGJhciBmaWxsXHJcbiAgICAgICAgc3Ryb2tlOiBudWxsIC8vIHRpdGxlIGJhciBzdHJva2UsIHVzZWQgb25seSBmb3IgdGhlIGV4cGFuZGVkIHRpdGxlIGJhclxyXG4gICAgICB9XHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyBleHBhbmRDb2xsYXBzZUJ1dHRvbk9wdGlvbnMgZGVmYXVsdHNcclxuICAgIG9wdGlvbnMuZXhwYW5kQ29sbGFwc2VCdXR0b25PcHRpb25zID0gY29tYmluZU9wdGlvbnM8RXhwYW5kQ29sbGFwc2VCdXR0b25PcHRpb25zPigge1xyXG4gICAgICBzaWRlTGVuZ3RoOiAxNiwgLy8gYnV0dG9uIGlzIGEgc3F1YXJlLCB0aGlzIGlzIHRoZSBsZW5ndGggb2Ygb25lIHNpZGVcclxuICAgICAgY3Vyc29yOiBvcHRpb25zLmN1cnNvcixcclxuICAgICAgdmFsdWVPblNvdW5kUGxheWVyOiBvcHRpb25zLmV4cGFuZGVkU291bmRQbGF5ZXIsXHJcbiAgICAgIHZhbHVlT2ZmU291bmRQbGF5ZXI6IG9wdGlvbnMuY29sbGFwc2VkU291bmRQbGF5ZXIsXHJcblxyXG4gICAgICAvLyB2b2ljaW5nXHJcbiAgICAgIHZvaWNpbmdOYW1lUmVzcG9uc2U6IG9wdGlvbnMudm9pY2luZ05hbWVSZXNwb25zZSxcclxuICAgICAgdm9pY2luZ09iamVjdFJlc3BvbnNlOiBvcHRpb25zLnZvaWNpbmdPYmplY3RSZXNwb25zZSxcclxuICAgICAgdm9pY2luZ0NvbnRleHRSZXNwb25zZTogb3B0aW9ucy52b2ljaW5nQ29udGV4dFJlc3BvbnNlLFxyXG4gICAgICB2b2ljaW5nSGludFJlc3BvbnNlOiBvcHRpb25zLnZvaWNpbmdIaW50UmVzcG9uc2UsXHJcblxyXG4gICAgICAvLyBwaGV0LWlvXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAnZXhwYW5kQ29sbGFwc2VCdXR0b24nIClcclxuICAgIH0sIG9wdGlvbnMuZXhwYW5kQ29sbGFwc2VCdXR0b25PcHRpb25zICk7XHJcblxyXG4gICAgc3VwZXIoKTtcclxuXHJcbiAgICBsZXQgdGl0bGVOb2RlID0gb3B0aW9ucy50aXRsZU5vZGU7XHJcblxyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gdGl0bGVOb2RlIHNwZWNpZmllZCwgd2UnbGwgcHJvdmlkZSBvdXIgb3duLCBhbmQgaGFuZGxlIGRpc3Bvc2FsLlxyXG4gICAgaWYgKCAhdGl0bGVOb2RlICkge1xyXG4gICAgICB0aXRsZU5vZGUgPSBuZXcgVGV4dCggJycsIHtcclxuICAgICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ3RpdGxlVGV4dCcgKVxyXG4gICAgICB9ICk7XHJcbiAgICAgIHRoaXMuZGlzcG9zZUVtaXR0ZXIuYWRkTGlzdGVuZXIoICgpID0+IHRpdGxlTm9kZS5kaXNwb3NlKCkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBbGxvdyB0b3VjaGVzIHRvIGdvIHRocm91Z2ggdG8gdGhlIGNvbGxhcHNlZFRpdGxlQmFyIHdoaWNoIGhhbmRsZXMgdGhlIGlucHV0IGV2ZW50XHJcbiAgICAvLyBOb3RlOiBUaGlzIG11dGF0ZXMgdGhlIHRpdGxlTm9kZSwgc28gaWYgaXQgaXMgdXNlZCBpbiBtdWx0aXBsZSBwbGFjZXMgaXQgd2lsbCBiZWNvbWUgdW5waWNrYWJsZVxyXG4gICAgLy8gaW4gdGhvc2UgcGxhY2VzIGFzIHdlbGwuXHJcbiAgICBpZiAoIG9wdGlvbnMub3ZlcnJpZGVUaXRsZU5vZGVQaWNrYWJsZSApIHtcclxuICAgICAgdGl0bGVOb2RlLnBpY2thYmxlID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5leHBhbmRlZFByb3BlcnR5ID0gb3B0aW9ucy5leHBhbmRlZFByb3BlcnR5O1xyXG4gICAgaWYgKCAhdGhpcy5leHBhbmRlZFByb3BlcnR5ICkge1xyXG4gICAgICB0aGlzLmV4cGFuZGVkUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCB0cnVlLCB7XHJcbiAgICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdleHBhbmRlZFByb3BlcnR5JyApLFxyXG4gICAgICAgIHBoZXRpb0ZlYXR1cmVkOiB0cnVlXHJcbiAgICAgIH0gKTtcclxuICAgICAgdGhpcy5kaXNwb3NlRW1pdHRlci5hZGRMaXN0ZW5lciggKCkgPT4gdGhpcy5leHBhbmRlZFByb3BlcnR5LmRpc3Bvc2UoKSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGV4cGFuZC9jb2xsYXBzZSBidXR0b24sIGxpbmtzIHRvIGV4cGFuZGVkUHJvcGVydHksIG11c3QgYmUgZGlzcG9zZWQgb2ZcclxuICAgIHRoaXMuZXhwYW5kQ29sbGFwc2VCdXR0b24gPSBuZXcgRXhwYW5kQ29sbGFwc2VCdXR0b24oIHRoaXMuZXhwYW5kZWRQcm9wZXJ0eSwgb3B0aW9ucy5leHBhbmRDb2xsYXBzZUJ1dHRvbk9wdGlvbnMgKTtcclxuICAgIHRoaXMuZGlzcG9zZUVtaXR0ZXIuYWRkTGlzdGVuZXIoICgpID0+IHRoaXMuZXhwYW5kQ29sbGFwc2VCdXR0b24uZGlzcG9zZSgpICk7XHJcblxyXG4gICAgLy8gRXhwYW5kZWQgYm94XHJcbiAgICBjb25zdCBib3hPcHRpb25zID0ge1xyXG4gICAgICBmaWxsOiBvcHRpb25zLmZpbGwsXHJcbiAgICAgIGNvcm5lclJhZGl1czogb3B0aW9ucy5jb3JuZXJSYWRpdXNcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5leHBhbmRlZEJveCA9IG5ldyBSZWN0YW5nbGUoIGJveE9wdGlvbnMgKTtcclxuICAgIHRoaXMuY29sbGFwc2VkQm94ID0gbmV3IFJlY3RhbmdsZSggYm94T3B0aW9ucyApO1xyXG5cclxuICAgIHRoaXMuZXhwYW5kZWRUaXRsZUJhciA9IG5ldyBJbnRlcmFjdGl2ZUhpZ2hsaWdodFBhdGgoIG51bGwsIGNvbWJpbmVPcHRpb25zPEV4cGFuZENvbGxhcHNlQnV0dG9uT3B0aW9ucz4oIHtcclxuICAgICAgbGluZVdpZHRoOiBvcHRpb25zLmxpbmVXaWR0aCwgLy8gdXNlIHNhbWUgbGluZVdpZHRoIGFzIGJveCwgZm9yIGNvbnNpc3RlbnQgbG9va1xyXG4gICAgICBjdXJzb3I6IG9wdGlvbnMuY3Vyc29yXHJcbiAgICB9LCBvcHRpb25zLnRpdGxlQmFyT3B0aW9ucyApICk7XHJcbiAgICB0aGlzLmV4cGFuZGVkQm94LmFkZENoaWxkKCB0aGlzLmV4cGFuZGVkVGl0bGVCYXIgKTtcclxuXHJcbiAgICAvLyBDb2xsYXBzZWQgdGl0bGUgYmFyIGhhcyBjb3JuZXJzIHRoYXQgbWF0Y2ggdGhlIGJveC4gQ2xpY2tpbmcgaXQgb3BlcmF0ZXMgbGlrZSBleHBhbmQvY29sbGFwc2UgYnV0dG9uLlxyXG4gICAgdGhpcy5jb2xsYXBzZWRUaXRsZUJhciA9IG5ldyBJbnRlcmFjdGl2ZUhpZ2hsaWdodFJlY3RhbmdsZSggY29tYmluZU9wdGlvbnM8UmVjdGFuZ2xlT3B0aW9ucz4oIHtcclxuICAgICAgY29ybmVyUmFkaXVzOiBvcHRpb25zLmNvcm5lclJhZGl1cyxcclxuICAgICAgY3Vyc29yOiBvcHRpb25zLmN1cnNvclxyXG4gICAgfSwgb3B0aW9ucy50aXRsZUJhck9wdGlvbnMgKSApO1xyXG4gICAgdGhpcy5jb2xsYXBzZWRCb3guYWRkQ2hpbGQoIHRoaXMuY29sbGFwc2VkVGl0bGVCYXIgKTtcclxuXHJcbiAgICAvLyBTZXQgdGhlIGZvY3VzSGlnaGxpZ2h0IGZvciB0aGUgaW50ZXJhY3RpdmUgUERPTSBlbGVtZW50IGJhc2VkIG9uIHRoZSBkaW1lbnNpb25zIG9mIHRoZSB3aG9sZSB0aXRsZSBiYXIgKG5vdCBqdXN0IHRoZSBidXR0b24pLlxyXG4gICAgY29uc3QgZXhwYW5kZWRGb2N1c0hpZ2hsaWdodCA9IG5ldyBIaWdobGlnaHRGcm9tTm9kZSggdGhpcy5leHBhbmRlZFRpdGxlQmFyICk7XHJcbiAgICBjb25zdCBjb2xsYXBzZWRGb2N1c0hpZ2hsaWdodCA9IG5ldyBIaWdobGlnaHRGcm9tTm9kZSggdGhpcy5jb2xsYXBzZWRUaXRsZUJhciApO1xyXG5cclxuICAgIHRoaXMuZGlzcG9zZUVtaXR0ZXIuYWRkTGlzdGVuZXIoICgpID0+IHtcclxuICAgICAgdGhpcy5jb2xsYXBzZWRUaXRsZUJhci5kaXNwb3NlKCk7XHJcbiAgICAgIHRoaXMuZXhwYW5kZWRUaXRsZUJhci5kaXNwb3NlKCk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgaWYgKCBvcHRpb25zLnRpdGxlQmFyRXhwYW5kQ29sbGFwc2UgKSB7XHJcbiAgICAgIHRoaXMuY29sbGFwc2VkVGl0bGVCYXIuYWRkSW5wdXRMaXN0ZW5lcigge1xyXG4gICAgICAgIGRvd246ICgpID0+IHtcclxuICAgICAgICAgIGlmICggdGhpcy5leHBhbmRDb2xsYXBzZUJ1dHRvbi5pc0VuYWJsZWQoKSApIHtcclxuICAgICAgICAgICAgdGhpcy5waGV0aW9TdGFydEV2ZW50KCAnZXhwYW5kZWQnICk7XHJcbiAgICAgICAgICAgIHRoaXMuZXhwYW5kZWRQcm9wZXJ0eS52YWx1ZSA9IHRydWU7XHJcbiAgICAgICAgICAgIG9wdGlvbnMuZXhwYW5kZWRTb3VuZFBsYXllci5wbGF5KCk7XHJcbiAgICAgICAgICAgIHRoaXMucGhldGlvRW5kRXZlbnQoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG5cclxuICAgICAgLy8gV2hlbiB0aXRsZUJhciBkb2Vzbid0IGV4cGFuZCBvciBjb2xsYXBzZSwgZG9uJ3Qgc2hvdyBpbnRlcmFjdGl2ZSBoaWdobGlnaHRzIGZvciB0aGVtXHJcbiAgICAgIHRoaXMuZXhwYW5kZWRUaXRsZUJhci5pbnRlcmFjdGl2ZUhpZ2hsaWdodCA9ICdpbnZpc2libGUnO1xyXG4gICAgICB0aGlzLmNvbGxhcHNlZFRpdGxlQmFyLmludGVyYWN0aXZlSGlnaGxpZ2h0ID0gJ2ludmlzaWJsZSc7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2V0IHRoZSBpbnB1dCBsaXN0ZW5lcnMgZm9yIHRoZSBleHBhbmRlZFRpdGxlQmFyXHJcbiAgICBpZiAoIG9wdGlvbnMuc2hvd1RpdGxlV2hlbkV4cGFuZGVkICYmIG9wdGlvbnMudGl0bGVCYXJFeHBhbmRDb2xsYXBzZSApIHtcclxuICAgICAgdGhpcy5leHBhbmRlZFRpdGxlQmFyLmFkZElucHV0TGlzdGVuZXIoIHtcclxuICAgICAgICBkb3duOiAoKSA9PiB7XHJcbiAgICAgICAgICBpZiAoIHRoaXMuZXhwYW5kQ29sbGFwc2VCdXR0b24uaXNFbmFibGVkKCkgKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGhldGlvU3RhcnRFdmVudCggJ2NvbGxhcHNlZCcgKTtcclxuICAgICAgICAgICAgb3B0aW9ucy5jb2xsYXBzZWRTb3VuZFBsYXllci5wbGF5KCk7XHJcbiAgICAgICAgICAgIHRoaXMuZXhwYW5kZWRQcm9wZXJ0eS52YWx1ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICB0aGlzLnBoZXRpb0VuZEV2ZW50KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSWYgd2UgaGlkZSB0aGUgYnV0dG9uIG9yIG1ha2UgaXQgdW5waWNrYWJsZSwgZGlzYWJsZSBpbnRlcmFjdGl2aXR5IG9mIHRoZSB0aXRsZSBiYXIsXHJcbiAgICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3N1bi9pc3N1ZXMvNDc3IGFuZCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc3VuL2lzc3Vlcy81NzMuXHJcbiAgICBjb25zdCBwaWNrYWJsZUxpc3RlbmVyID0gKCkgPT4ge1xyXG4gICAgICBjb25zdCBwaWNrYWJsZSA9IHRoaXMuZXhwYW5kQ29sbGFwc2VCdXR0b24udmlzaWJsZSAmJiB0aGlzLmV4cGFuZENvbGxhcHNlQnV0dG9uLnBpY2thYmxlO1xyXG4gICAgICB0aGlzLmNvbGxhcHNlZFRpdGxlQmFyLnBpY2thYmxlID0gcGlja2FibGU7XHJcbiAgICAgIHRoaXMuZXhwYW5kZWRUaXRsZUJhci5waWNrYWJsZSA9IHBpY2thYmxlO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBBZGQgbGlzdGVuZXJzIHRvIHRoZSBleHBhbmQvY29sbGFwc2UgYnV0dG9uLiAgVGhlc2UgZG8gbm90IG5lZWQgdG8gYmUgdW5saW5rZWQgYmVjYXVzZSB0aGlzIGNvbXBvbmVudCBvd25zIHRoZVxyXG4gICAgLy8gYnV0dG9uLlxyXG4gICAgdGhpcy5leHBhbmRDb2xsYXBzZUJ1dHRvbi52aXNpYmxlUHJvcGVydHkubGF6eUxpbmsoIHBpY2thYmxlTGlzdGVuZXIgKTtcclxuICAgIHRoaXMuZXhwYW5kQ29sbGFwc2VCdXR0b24ucGlja2FibGVQcm9wZXJ0eS5sYXp5TGluayggcGlja2FibGVMaXN0ZW5lciApO1xyXG4gICAgdGhpcy5leHBhbmRDb2xsYXBzZUJ1dHRvbi5lbmFibGVkUHJvcGVydHkubGluayggZW5hYmxlZCA9PiB7XHJcblxyXG4gICAgICAvLyBTaW5jZSB0aGVyZSBhcmUgbGlzdGVuZXJzIG9uIHRoZSB0aXRsZUJhcnMgZnJvbSBJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZywgc2V0dGluZyBwaWNrYWJsZTogZmFsc2UgaXNuJ3QgZW5vdWdoXHJcbiAgICAgIC8vIHRvIGhpZGUgcG9pbnRlciBjdXJzb3IuXHJcbiAgICAgIGNvbnN0IHNob3dDdXJzb3IgPSBvcHRpb25zLnRpdGxlQmFyRXhwYW5kQ29sbGFwc2UgJiYgZW5hYmxlZDtcclxuICAgICAgdGhpcy5jb2xsYXBzZWRUaXRsZUJhci5jdXJzb3IgPSBzaG93Q3Vyc29yID8gKCBvcHRpb25zLmN1cnNvciB8fCBudWxsICkgOiBudWxsO1xyXG4gICAgICB0aGlzLmV4cGFuZGVkVGl0bGVCYXIuY3Vyc29yID0gc2hvd0N1cnNvciA/ICggb3B0aW9ucy5jdXJzb3IgfHwgbnVsbCApIDogbnVsbDtcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLmV4cGFuZGVkQm94LmFkZENoaWxkKCBjb250ZW50Tm9kZSApO1xyXG5cclxuICAgIC8vIG9wdGlvbmFsIGJveCBvdXRsaW5lLCBvbiB0b3Agb2YgZXZlcnl0aGluZyBlbHNlXHJcbiAgICBpZiAoIG9wdGlvbnMuc3Ryb2tlICkge1xyXG5cclxuICAgICAgY29uc3Qgb3V0bGluZU9wdGlvbnMgPSB7XHJcbiAgICAgICAgc3Ryb2tlOiBvcHRpb25zLnN0cm9rZSxcclxuICAgICAgICBsaW5lV2lkdGg6IG9wdGlvbnMubGluZVdpZHRoLFxyXG4gICAgICAgIGNvcm5lclJhZGl1czogb3B0aW9ucy5jb3JuZXJSYWRpdXMsXHJcblxyXG4gICAgICAgIC8vIGRvbid0IG9jY2x1ZGUgaW5wdXQgZXZlbnRzIGZyb20gdGhlIGNvbGxhcHNlZFRpdGxlQmFyLCB3aGljaCBoYW5kbGVzIHRoZSBldmVudHNcclxuICAgICAgICBwaWNrYWJsZTogZmFsc2VcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHRoaXMuZXhwYW5kZWRCb3hPdXRsaW5lID0gbmV3IFJlY3RhbmdsZSggb3V0bGluZU9wdGlvbnMgKTtcclxuICAgICAgdGhpcy5leHBhbmRlZEJveC5hZGRDaGlsZCggdGhpcy5leHBhbmRlZEJveE91dGxpbmUgKTtcclxuXHJcbiAgICAgIHRoaXMuY29sbGFwc2VkQm94T3V0bGluZSA9IG5ldyBSZWN0YW5nbGUoIG91dGxpbmVPcHRpb25zICk7XHJcbiAgICAgIHRoaXMuY29sbGFwc2VkQm94LmFkZENoaWxkKCB0aGlzLmNvbGxhcHNlZEJveE91dGxpbmUgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBIb2xkcyB0aGUgbWFpbiBjb21wb25lbnRzIHdoZW4gdGhlIGNvbnRlbnQncyBib3VuZHMgYXJlIHZhbGlkXHJcbiAgICBjb25zdCBjb250YWluZXJOb2RlID0gbmV3IE5vZGUoIHtcclxuICAgICAgZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kczogIW9wdGlvbnMudXNlRXhwYW5kZWRCb3VuZHNXaGVuQ29sbGFwc2VkXHJcbiAgICB9ICk7XHJcbiAgICB0aGlzLmFkZENoaWxkKCBjb250YWluZXJOb2RlICk7XHJcblxyXG4gICAgLy8gcGRvbSBkaXNwbGF5XHJcbiAgICBjb25zdCBwZG9tQ29udGVudE5vZGUgPSBuZXcgTm9kZSgge1xyXG4gICAgICB0YWdOYW1lOiAnZGl2JyxcclxuICAgICAgYXJpYVJvbGU6ICdyZWdpb24nLFxyXG4gICAgICBwZG9tT3JkZXI6IFsgY29udGVudE5vZGUgXSxcclxuICAgICAgYXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbnM6IFsge1xyXG4gICAgICAgIG90aGVyTm9kZTogdGhpcy5leHBhbmRDb2xsYXBzZUJ1dHRvbixcclxuICAgICAgICBvdGhlckVsZW1lbnROYW1lOiBQRE9NUGVlci5QUklNQVJZX1NJQkxJTkcsXHJcbiAgICAgICAgdGhpc0VsZW1lbnROYW1lOiBQRE9NUGVlci5QUklNQVJZX1NJQkxJTkdcclxuICAgICAgfSBdXHJcbiAgICB9ICk7XHJcbiAgICBjb25zdCBwZG9tSGVhZGluZyA9IG5ldyBOb2RlKCB7XHJcbiAgICAgIHRhZ05hbWU6IG9wdGlvbnMuaGVhZGluZ1RhZ05hbWUsXHJcbiAgICAgIHBkb21PcmRlcjogWyB0aGlzLmV4cGFuZENvbGxhcHNlQnV0dG9uIF1cclxuICAgIH0gKTtcclxuXHJcbiAgICBjb25zdCBwZG9tQ29udGFpbmVyTm9kZSA9IG5ldyBOb2RlKCB7XHJcbiAgICAgIGNoaWxkcmVuOiBbIHBkb21IZWFkaW5nLCBwZG9tQ29udGVudE5vZGUgXVxyXG4gICAgfSApO1xyXG4gICAgdGhpcy5hZGRDaGlsZCggcGRvbUNvbnRhaW5lck5vZGUgKTtcclxuXHJcbiAgICB0aGlzLmNvbnN0cmFpbnQgPSBuZXcgQWNjb3JkaW9uQm94Q29uc3RyYWludChcclxuICAgICAgdGhpcyxcclxuICAgICAgY29udGVudE5vZGUsXHJcbiAgICAgIGNvbnRhaW5lck5vZGUsXHJcbiAgICAgIHRoaXMuZXhwYW5kZWRCb3gsXHJcbiAgICAgIHRoaXMuY29sbGFwc2VkQm94LFxyXG4gICAgICB0aGlzLmV4cGFuZGVkVGl0bGVCYXIsXHJcbiAgICAgIHRoaXMuY29sbGFwc2VkVGl0bGVCYXIsXHJcbiAgICAgIHRoaXMuZXhwYW5kZWRCb3hPdXRsaW5lLFxyXG4gICAgICB0aGlzLmNvbGxhcHNlZEJveE91dGxpbmUsXHJcbiAgICAgIHRpdGxlTm9kZSxcclxuICAgICAgdGhpcy5leHBhbmRDb2xsYXBzZUJ1dHRvbixcclxuICAgICAgb3B0aW9uc1xyXG4gICAgKTtcclxuICAgIHRoaXMuY29uc3RyYWludC51cGRhdGVMYXlvdXQoKTtcclxuXHJcbiAgICAvLyBEb24ndCB1cGRhdGUgYXV0b21hdGljYWxseSBpZiByZXNpemU6ZmFsc2VcclxuICAgIHRoaXMuY29uc3RyYWludC5lbmFibGVkID0gb3B0aW9ucy5yZXNpemU7XHJcblxyXG4gICAgLy8gZXhwYW5kL2NvbGxhcHNlIHRoZSBib3hcclxuICAgIGNvbnN0IGV4cGFuZGVkUHJvcGVydHlPYnNlcnZlciA9ICgpID0+IHtcclxuICAgICAgY29uc3QgZXhwYW5kZWQgPSB0aGlzLmV4cGFuZGVkUHJvcGVydHkudmFsdWU7XHJcblxyXG4gICAgICB0aGlzLmV4cGFuZGVkQm94LnZpc2libGUgPSBleHBhbmRlZDtcclxuICAgICAgdGhpcy5jb2xsYXBzZWRCb3gudmlzaWJsZSA9ICFleHBhbmRlZDtcclxuXHJcbiAgICAgIHRoaXMuZXhwYW5kQ29sbGFwc2VCdXR0b24uc2V0Rm9jdXNIaWdobGlnaHQoIGV4cGFuZGVkID8gZXhwYW5kZWRGb2N1c0hpZ2hsaWdodCA6IGNvbGxhcHNlZEZvY3VzSGlnaGxpZ2h0ICk7XHJcblxyXG4gICAgICB0aXRsZU5vZGUudmlzaWJsZSA9ICggZXhwYW5kZWQgJiYgb3B0aW9ucy5zaG93VGl0bGVXaGVuRXhwYW5kZWQgKSB8fCAhZXhwYW5kZWQ7XHJcblxyXG4gICAgICBwZG9tQ29udGFpbmVyTm9kZS5zZXRQRE9NQXR0cmlidXRlKCAnYXJpYS1oaWRkZW4nLCAhZXhwYW5kZWQgKTtcclxuXHJcbiAgICAgIHRoaXMuZXhwYW5kQ29sbGFwc2VCdXR0b24udm9pY2luZ1NwZWFrRnVsbFJlc3BvbnNlKCB7XHJcbiAgICAgICAgaGludFJlc3BvbnNlOiBudWxsXHJcbiAgICAgIH0gKTtcclxuICAgIH07XHJcbiAgICB0aGlzLmV4cGFuZGVkUHJvcGVydHkubGluayggZXhwYW5kZWRQcm9wZXJ0eU9ic2VydmVyICk7XHJcblxyXG4gICAgdGhpcy5kaXNwb3NlRW1pdHRlci5hZGRMaXN0ZW5lciggKCkgPT4gdGhpcy5leHBhbmRlZFByb3BlcnR5LnVubGluayggZXhwYW5kZWRQcm9wZXJ0eU9ic2VydmVyICkgKTtcclxuXHJcbiAgICB0aGlzLm11dGF0ZSggXy5vbWl0KCBvcHRpb25zLCAnY3Vyc29yJyApICk7XHJcblxyXG4gICAgLy8gcmVzZXQgdGhpbmdzIHRoYXQgYXJlIG93bmVkIGJ5IEFjY29yZGlvbkJveFxyXG4gICAgdGhpcy5yZXNldEFjY29yZGlvbkJveCA9ICgpID0+IHtcclxuXHJcbiAgICAgIC8vIElmIGV4cGFuZGVkUHJvcGVydHkgd2Fzbid0IHByb3ZpZGVkIHZpYSBvcHRpb25zLCB3ZSBvd24gaXQgYW5kIHRoZXJlZm9yZSBuZWVkIHRvIHJlc2V0IGl0LlxyXG4gICAgICBpZiAoICFvcHRpb25zLmV4cGFuZGVkUHJvcGVydHkgKSB7XHJcbiAgICAgICAgdGhpcy5leHBhbmRlZFByb3BlcnR5LnJlc2V0KCk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLy8gc3VwcG9ydCBmb3IgYmluZGVyIGRvY3VtZW50YXRpb24sIHN0cmlwcGVkIG91dCBpbiBidWlsZHMgYW5kIG9ubHkgcnVucyB3aGVuID9iaW5kZXIgaXMgc3BlY2lmaWVkXHJcbiAgICBhc3NlcnQgJiYgcGhldD8uY2hpcHBlcj8ucXVlcnlQYXJhbWV0ZXJzPy5iaW5kZXIgJiYgSW5zdGFuY2VSZWdpc3RyeS5yZWdpc3RlckRhdGFVUkwoICdzdW4nLCAnQWNjb3JkaW9uQm94JywgdGhpcyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgaWRlYWwgaGVpZ2h0IG9mIHRoZSBjb2xsYXBzZWQgYm94IChpZ25vcmluZyB0aGluZ3MgbGlrZSBzdHJva2Ugd2lkdGgpXHJcbiAgICovXHJcbiAgcHVibGljIGdldENvbGxhcHNlZEJveEhlaWdodCgpOiBudW1iZXIge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5jb25zdHJhaW50Lmxhc3RDb2xsYXBzZWRCb3hIZWlnaHQhO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHJlc3VsdCAhPT0gbnVsbCApO1xyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBpZGVhbCBoZWlnaHQgb2YgdGhlIGV4cGFuZGVkIGJveCAoaWdub3JpbmcgdGhpbmdzIGxpa2Ugc3Ryb2tlIHdpZHRoKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRFeHBhbmRlZEJveEhlaWdodCgpOiBudW1iZXIge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5jb25zdHJhaW50Lmxhc3RFeHBhbmRlZEJveEhlaWdodCE7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcmVzdWx0ICE9PSBudWxsICk7XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyByZXNldCgpOiB2b2lkIHtcclxuICAgIHRoaXMucmVzZXRBY2NvcmRpb25Cb3goKTtcclxuICB9XHJcblxyXG4gIC8vIFRoZSBkZWZpbml0aW9uIGZvciBob3cgQWNjb3JkaW9uQm94IHNldHMgaXRzIGFjY2Vzc2libGVOYW1lIGluIHRoZSBQRE9NLiBGb3J3YXJkIGl0IG9udG8gaXRzIGV4cGFuZENvbGxhcHNlQnV0dG9uLlxyXG4gIC8vIFNlZSBBY2NvcmRpb25Cb3gubWQgZm9yIGZ1cnRoZXIgc3R5bGUgZ3VpZGUgYW5kIGRvY3VtZW50YXRpb24gb24gdGhlIHBhdHRlcm4uXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBBQ0NPUkRJT05fQk9YX0FDQ0VTU0lCTEVfTkFNRV9CRUhBVklPUjogUERPTUJlaGF2aW9yRnVuY3Rpb24gPVxyXG4gICAgKCBub2RlLCBvcHRpb25zLCBhY2Nlc3NpYmxlTmFtZTogc3RyaW5nIHwgVFJlYWRPbmx5UHJvcGVydHk8c3RyaW5nPiwgY2FsbGJhY2tzRm9yT3RoZXJOb2RlcyApID0+IHtcclxuICAgICAgY2FsbGJhY2tzRm9yT3RoZXJOb2Rlcy5wdXNoKCAoKSA9PiB7XHJcbiAgICAgICAgKCBub2RlIGFzIEFjY29yZGlvbkJveCApLmV4cGFuZENvbGxhcHNlQnV0dG9uLmFjY2Vzc2libGVOYW1lID0gYWNjZXNzaWJsZU5hbWU7XHJcbiAgICAgIH0gKTtcclxuICAgICAgcmV0dXJuIG9wdGlvbnM7XHJcbiAgICB9O1xyXG59XHJcblxyXG5jbGFzcyBJbnRlcmFjdGl2ZUhpZ2hsaWdodFBhdGggZXh0ZW5kcyBJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZyggUGF0aCApIHt9XHJcblxyXG5jbGFzcyBJbnRlcmFjdGl2ZUhpZ2hsaWdodFJlY3RhbmdsZSBleHRlbmRzIEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nKCBSZWN0YW5nbGUgKSB7fVxyXG5cclxuY2xhc3MgQWNjb3JkaW9uQm94Q29uc3RyYWludCBleHRlbmRzIExheW91dENvbnN0cmFpbnQge1xyXG5cclxuICAvLyBTdXBwb3J0IHB1YmxpYyBhY2Nlc3NvcnNcclxuICBwdWJsaWMgbGFzdENvbGxhcHNlZEJveEhlaWdodDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XHJcbiAgcHVibGljIGxhc3RFeHBhbmRlZEJveEhlaWdodDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggcHJpdmF0ZSByZWFkb25seSBhY2NvcmRpb25Cb3g6IEFjY29yZGlvbkJveCxcclxuICAgICAgICAgICAgICAgICAgICAgIHByaXZhdGUgcmVhZG9ubHkgY29udGVudE5vZGU6IE5vZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICBwcml2YXRlIHJlYWRvbmx5IGNvbnRhaW5lck5vZGU6IE5vZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICBwcml2YXRlIHJlYWRvbmx5IGV4cGFuZGVkQm94OiBSZWN0YW5nbGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICBwcml2YXRlIHJlYWRvbmx5IGNvbGxhcHNlZEJveDogUmVjdGFuZ2xlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgcHJpdmF0ZSByZWFkb25seSBleHBhbmRlZFRpdGxlQmFyOiBQYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgcHJpdmF0ZSByZWFkb25seSBjb2xsYXBzZWRUaXRsZUJhcjogUmVjdGFuZ2xlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgcHJpdmF0ZSByZWFkb25seSBleHBhbmRlZEJveE91dGxpbmU6IFJlY3RhbmdsZSB8IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgICBwcml2YXRlIHJlYWRvbmx5IGNvbGxhcHNlZEJveE91dGxpbmU6IFJlY3RhbmdsZSB8IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgICBwcml2YXRlIHJlYWRvbmx5IHRpdGxlTm9kZTogTm9kZSxcclxuICAgICAgICAgICAgICAgICAgICAgIHByaXZhdGUgcmVhZG9ubHkgZXhwYW5kQ29sbGFwc2VCdXR0b246IE5vZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICBwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IFN0cmljdE9taXQ8UmVxdWlyZWQ8U2VsZk9wdGlvbnM+LCAnZXhwYW5kQ29sbGFwc2VCdXR0b25PcHRpb25zJz4gKSB7XHJcbiAgICBzdXBlciggYWNjb3JkaW9uQm94ICk7XHJcblxyXG4gICAgdGhpcy5hY2NvcmRpb25Cb3gubG9jYWxQcmVmZXJyZWRXaWR0aFByb3BlcnR5LmxhenlMaW5rKCB0aGlzLl91cGRhdGVMYXlvdXRMaXN0ZW5lciApO1xyXG4gICAgdGhpcy5hY2NvcmRpb25Cb3gubG9jYWxQcmVmZXJyZWRIZWlnaHRQcm9wZXJ0eS5sYXp5TGluayggdGhpcy5fdXBkYXRlTGF5b3V0TGlzdGVuZXIgKTtcclxuICAgIHRoaXMuYWNjb3JkaW9uQm94LmV4cGFuZGVkUHJvcGVydHkubGF6eUxpbmsoIHRoaXMuX3VwZGF0ZUxheW91dExpc3RlbmVyICk7XHJcblxyXG4gICAgdGhpcy5hZGROb2RlKCBjb250ZW50Tm9kZSApO1xyXG4gICAgdGhpcy5hZGROb2RlKCB0aXRsZU5vZGUgKTtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBvdmVycmlkZSBsYXlvdXQoKTogdm9pZCB7XHJcbiAgICBzdXBlci5sYXlvdXQoKTtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xyXG5cclxuICAgIGlmICggdGhpcy5hY2NvcmRpb25Cb3guaXNDaGlsZEluY2x1ZGVkSW5MYXlvdXQoIHRoaXMuY29udGVudE5vZGUgKSApIHtcclxuICAgICAgdGhpcy5jb250YWluZXJOb2RlLmNoaWxkcmVuID0gW1xyXG4gICAgICAgIHRoaXMuZXhwYW5kZWRCb3gsXHJcbiAgICAgICAgdGhpcy5jb2xsYXBzZWRCb3gsXHJcbiAgICAgICAgdGhpcy50aXRsZU5vZGUsXHJcbiAgICAgICAgdGhpcy5leHBhbmRDb2xsYXBzZUJ1dHRvblxyXG4gICAgICBdO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRoaXMuY29udGFpbmVyTm9kZS5jaGlsZHJlbiA9IFtdO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZXhwYW5kZWQgPSB0aGlzLmFjY29yZGlvbkJveC5leHBhbmRlZFByb3BlcnR5LnZhbHVlO1xyXG4gICAgY29uc3QgdXNlRXhwYW5kZWRCb3VuZHMgPSBleHBhbmRlZCB8fCBvcHRpb25zLnVzZUV4cGFuZGVkQm91bmRzV2hlbkNvbGxhcHNlZDtcclxuXHJcbiAgICAvLyBXZSBvbmx5IGhhdmUgdG8gYWNjb3VudCBmb3IgdGhlIGxpbmVXaWR0aCBpbiBvdXIgbGF5b3V0IGlmIHdlIGhhdmUgYSBzdHJva2VcclxuICAgIGNvbnN0IGxpbmVXaWR0aCA9IG9wdGlvbnMuc3Ryb2tlID09PSBudWxsID8gMCA6IG9wdGlvbnMubGluZVdpZHRoO1xyXG5cclxuICAgIC8vIExheW91dFByb3h5IGhlbHBzIHdpdGggc29tZSBsYXlvdXQgb3BlcmF0aW9ucywgYW5kIHdpbGwgc3VwcG9ydCBhIG5vbi1jaGlsZCBjb250ZW50LlxyXG4gICAgY29uc3QgY29udGVudFByb3h5ID0gdGhpcy5jcmVhdGVMYXlvdXRQcm94eSggdGhpcy5jb250ZW50Tm9kZSApITtcclxuICAgIGNvbnN0IHRpdGxlUHJveHkgPSB0aGlzLmNyZWF0ZUxheW91dFByb3h5KCB0aGlzLnRpdGxlTm9kZSApITtcclxuXHJcbiAgICBjb25zdCBtaW5pbXVtQ29udGVudFdpZHRoID0gY29udGVudFByb3h5Lm1pbmltdW1XaWR0aDtcclxuICAgIGNvbnN0IG1pbmltdW1Db250ZW50SGVpZ2h0ID0gY29udGVudFByb3h5Lm1pbmltdW1IZWlnaHQ7XHJcbiAgICBjb25zdCBtaW51bXVtVGl0bGVXaWR0aCA9IHRpdGxlUHJveHkubWluaW11bVdpZHRoO1xyXG5cclxuICAgIC8vIFRoZSBpZGVhbCBoZWlnaHQgb2YgdGhlIGNvbGxhcHNlZCBib3ggKGlnbm9yaW5nIHRoaW5ncyBsaWtlIHN0cm9rZSB3aWR0aCkuIERvZXMgbm90IGRlcGVuZCBvbiB0aXRsZSB3aWR0aFxyXG4gICAgLy8gT1IgY29udGVudCBzaXplLCBib3RoIG9mIHdoaWNoIGNvdWxkIGJlIGNoYW5nZWQgZGVwZW5kaW5nIG9uIHByZWZlcnJlZCBzaXplcy5cclxuICAgIGNvbnN0IGNvbGxhcHNlZEJveEhlaWdodCA9IE1hdGgubWF4KFxyXG4gICAgICB0aGlzLmV4cGFuZENvbGxhcHNlQnV0dG9uLmhlaWdodCArICggMiAqIG9wdGlvbnMuYnV0dG9uWU1hcmdpbiApLFxyXG4gICAgICB0aGlzLnRpdGxlTm9kZS5oZWlnaHQgKyAoIDIgKiBvcHRpb25zLnRpdGxlWU1hcmdpbiApXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IG1pbmltdW1FeHBhbmRlZEJveEhlaWdodCA9XHJcbiAgICAgIG9wdGlvbnMuc2hvd1RpdGxlV2hlbkV4cGFuZGVkID9cclxuICAgICAgICAvLyBjb250ZW50IGlzIGJlbG93IGJ1dHRvbit0aXRsZVxyXG4gICAgICBNYXRoLm1heChcclxuICAgICAgICAvLyBjb250ZW50ICh3aXRoIG9wdGlvbmFsIG92ZXJsYXApXHJcbiAgICAgICAgKCBvcHRpb25zLmFsbG93Q29udGVudFRvT3ZlcmxhcFRpdGxlID8gb3B0aW9ucy5jb250ZW50WU1hcmdpbiA6IGNvbGxhcHNlZEJveEhlaWdodCArIG9wdGlvbnMuY29udGVudFlTcGFjaW5nICkgKyBtaW5pbXVtQ29udGVudEhlaWdodCArIG9wdGlvbnMuY29udGVudFlNYXJnaW4sXHJcbiAgICAgICAgLy8gdGhlIGNvbGxhcHNlZCBib3ggaGVpZ2h0IGl0c2VsZiAoaWYgd2Ugb3ZlcmxhcCBjb250ZW50LCB0aGlzIGNvdWxkIGJlIGxhcmdlcilcclxuICAgICAgICBjb2xsYXBzZWRCb3hIZWlnaHRcclxuICAgICAgKSA6XHJcbiAgICAgICAgLy8gY29udGVudCBpcyBuZXh0IHRvIGJ1dHRvblxyXG4gICAgICBNYXRoLm1heChcclxuICAgICAgICB0aGlzLmV4cGFuZENvbGxhcHNlQnV0dG9uLmhlaWdodCArICggMiAqIG9wdGlvbnMuYnV0dG9uWU1hcmdpbiApLFxyXG4gICAgICAgIG1pbmltdW1Db250ZW50SGVpZ2h0ICsgKCAyICogb3B0aW9ucy5jb250ZW50WU1hcmdpbiApXHJcbiAgICAgICk7XHJcblxyXG5cclxuICAgIC8vIFRoZSBjb21wdXRlZCB3aWR0aCBvZiB0aGUgYm94IChpZ25vcmluZyB0aGluZ3MgbGlrZSBzdHJva2Ugd2lkdGgpXHJcbiAgICAvLyBJbml0aWFsIHdpZHRoIGlzIGRlcGVuZGVudCBvbiB3aWR0aCBvZiB0aXRsZSBzZWN0aW9uIG9mIHRoZSBhY2NvcmRpb24gYm94XHJcbiAgICBsZXQgbWluaW11bUJveFdpZHRoID0gTWF0aC5tYXgoXHJcbiAgICAgIG9wdGlvbnMubWluV2lkdGgsXHJcbiAgICAgIG9wdGlvbnMuYnV0dG9uWE1hcmdpbiArIHRoaXMuZXhwYW5kQ29sbGFwc2VCdXR0b24ud2lkdGggKyBvcHRpb25zLnRpdGxlWFNwYWNpbmcgKyBtaW51bXVtVGl0bGVXaWR0aCArIG9wdGlvbnMudGl0bGVYTWFyZ2luXHJcbiAgICApO1xyXG5cclxuICAgIC8vIExpbWl0IHdpZHRoIGJ5IHRoZSBuZWNlc3Nhcnkgc3BhY2UgZm9yIHRoZSB0aXRsZSBub2RlXHJcbiAgICBpZiAoIG9wdGlvbnMudGl0bGVBbGlnblggPT09ICdjZW50ZXInICkge1xyXG4gICAgICAvLyBIYW5kbGVzIGNhc2Ugd2hlcmUgdGhlIHNwYWNpbmcgb24gdGhlIGxlZnQgc2lkZSBvZiB0aGUgdGl0bGUgaXMgbGFyZ2VyIHRoYW4gdGhlIHNwYWNpbmcgb24gdGhlIHJpZ2h0IHNpZGUuXHJcbiAgICAgIG1pbmltdW1Cb3hXaWR0aCA9IE1hdGgubWF4KCBtaW5pbXVtQm94V2lkdGgsICggb3B0aW9ucy5idXR0b25YTWFyZ2luICsgdGhpcy5leHBhbmRDb2xsYXBzZUJ1dHRvbi53aWR0aCArIG9wdGlvbnMudGl0bGVYU3BhY2luZyApICogMiArIG1pbnVtdW1UaXRsZVdpZHRoICk7XHJcblxyXG4gICAgICAvLyBIYW5kbGVzIGNhc2Ugd2hlcmUgdGhlIHNwYWNpbmcgb24gdGhlIHJpZ2h0IHNpZGUgb2YgdGhlIHRpdGxlIGlzIGxhcmdlciB0aGFuIHRoZSBzcGFjaW5nIG9uIHRoZSBsZWZ0IHNpZGUuXHJcbiAgICAgIG1pbmltdW1Cb3hXaWR0aCA9IE1hdGgubWF4KCBtaW5pbXVtQm94V2lkdGgsICggb3B0aW9ucy50aXRsZVhNYXJnaW4gKSAqIDIgKyBtaW51bXVtVGl0bGVXaWR0aCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENvbXBhcmUgd2lkdGggb2YgdGl0bGUgc2VjdGlvbiB0byBjb250ZW50IHNlY3Rpb24gb2YgdGhlIGFjY29yZGlvbiBib3hcclxuICAgIC8vIGNvbnRlbnQgaXMgYmVsb3cgYnV0dG9uK3RpdGxlXHJcbiAgICBpZiAoIG9wdGlvbnMuc2hvd1RpdGxlV2hlbkV4cGFuZGVkICkge1xyXG4gICAgICBtaW5pbXVtQm94V2lkdGggPSBNYXRoLm1heCggbWluaW11bUJveFdpZHRoLCBtaW5pbXVtQ29udGVudFdpZHRoICsgKCAyICogb3B0aW9ucy5jb250ZW50WE1hcmdpbiApICk7XHJcbiAgICB9XHJcbiAgICAvLyBjb250ZW50IGlzIG5leHQgdG8gYnV0dG9uXHJcbiAgICBlbHNlIHtcclxuICAgICAgbWluaW11bUJveFdpZHRoID0gTWF0aC5tYXgoIG1pbmltdW1Cb3hXaWR0aCwgdGhpcy5leHBhbmRDb2xsYXBzZUJ1dHRvbi53aWR0aCArIG1pbmltdW1Db250ZW50V2lkdGggKyBvcHRpb25zLmJ1dHRvblhNYXJnaW4gKyBvcHRpb25zLmNvbnRlbnRYTWFyZ2luICsgb3B0aW9ucy5jb250ZW50WFNwYWNpbmcgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBCb3RoIG9mIHRoZXNlIHVzZSBcImhhbGZcIiB0aGUgbGluZVdpZHRoIG9uIGVpdGhlciBzaWRlXHJcbiAgICBjb25zdCBtaW5pbXVtV2lkdGggPSBtaW5pbXVtQm94V2lkdGggKyBsaW5lV2lkdGg7XHJcbiAgICBjb25zdCBtaW5pbXVtSGVpZ2h0ID0gKCB1c2VFeHBhbmRlZEJvdW5kcyA/IG1pbmltdW1FeHBhbmRlZEJveEhlaWdodCA6IGNvbGxhcHNlZEJveEhlaWdodCApICsgbGluZVdpZHRoO1xyXG5cclxuICAgIC8vIE91ciByZXN1bHRpbmcgc2l6ZXMgKGFsbG93IHNldHRpbmcgcHJlZmVycmVkIHdpZHRoL2hlaWdodCBvbiB0aGUgYm94KVxyXG4gICAgY29uc3QgcHJlZmVycmVkV2lkdGg6IG51bWJlciA9IE1hdGgubWF4KCBtaW5pbXVtV2lkdGgsIHRoaXMuYWNjb3JkaW9uQm94LmxvY2FsUHJlZmVycmVkV2lkdGggfHwgMCApO1xyXG4gICAgY29uc3QgcHJlZmVycmVkSGVpZ2h0OiBudW1iZXIgPSBNYXRoLm1heCggbWluaW11bUhlaWdodCwgdGhpcy5hY2NvcmRpb25Cb3gubG9jYWxQcmVmZXJyZWRIZWlnaHQgfHwgMCApO1xyXG5cclxuICAgIGNvbnN0IGJveFdpZHRoID0gcHJlZmVycmVkV2lkdGggLSBsaW5lV2lkdGg7XHJcbiAgICBjb25zdCBib3hIZWlnaHQgPSBwcmVmZXJyZWRIZWlnaHQgLSBsaW5lV2lkdGg7XHJcblxyXG4gICAgdGhpcy5sYXN0Q29sbGFwc2VkQm94SGVpZ2h0ID0gY29sbGFwc2VkQm94SGVpZ2h0O1xyXG4gICAgaWYgKCB1c2VFeHBhbmRlZEJvdW5kcyApIHtcclxuICAgICAgdGhpcy5sYXN0RXhwYW5kZWRCb3hIZWlnaHQgPSBib3hIZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5jb2xsYXBzZWRCb3gucmVjdFdpZHRoID0gYm94V2lkdGg7XHJcbiAgICB0aGlzLmNvbGxhcHNlZEJveC5yZWN0SGVpZ2h0ID0gY29sbGFwc2VkQm94SGVpZ2h0O1xyXG5cclxuICAgIGNvbnN0IGNvbGxhcHNlZEJvdW5kcyA9IHRoaXMuY29sbGFwc2VkQm94LnNlbGZCb3VuZHM7XHJcblxyXG4gICAgdGhpcy5jb2xsYXBzZWRUaXRsZUJhci5yZWN0V2lkdGggPSBib3hXaWR0aDtcclxuICAgIHRoaXMuY29sbGFwc2VkVGl0bGVCYXIucmVjdEhlaWdodCA9IGNvbGxhcHNlZEJveEhlaWdodDtcclxuXHJcbiAgICAvLyBjb2xsYXBzZWRCb3hPdXRsaW5lIGV4aXN0cyBvbmx5IGlmIG9wdGlvbnMuc3Ryb2tlIGlzIHRydXRoeVxyXG4gICAgaWYgKCB0aGlzLmNvbGxhcHNlZEJveE91dGxpbmUgKSB7XHJcbiAgICAgIHRoaXMuY29sbGFwc2VkQm94T3V0bGluZS5yZWN0V2lkdGggPSBib3hXaWR0aDtcclxuICAgICAgdGhpcy5jb2xsYXBzZWRCb3hPdXRsaW5lLnJlY3RIZWlnaHQgPSBjb2xsYXBzZWRCb3hIZWlnaHQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB1c2VFeHBhbmRlZEJvdW5kcyApIHtcclxuICAgICAgdGhpcy5leHBhbmRlZEJveC5yZWN0V2lkdGggPSBib3hXaWR0aDtcclxuICAgICAgdGhpcy5leHBhbmRlZEJveC5yZWN0SGVpZ2h0ID0gYm94SGVpZ2h0O1xyXG5cclxuICAgICAgY29uc3QgZXhwYW5kZWRCb3VuZHMgPSB0aGlzLmV4cGFuZGVkQm94LnNlbGZCb3VuZHM7XHJcblxyXG4gICAgICAvLyBleHBhbmRlZEJveE91dGxpbmUgZXhpc3RzIG9ubHkgaWYgb3B0aW9ucy5zdHJva2UgaXMgdHJ1dGh5XHJcbiAgICAgIGlmICggdGhpcy5leHBhbmRlZEJveE91dGxpbmUgKSB7XHJcbiAgICAgICAgdGhpcy5leHBhbmRlZEJveE91dGxpbmUucmVjdFdpZHRoID0gYm94V2lkdGg7XHJcbiAgICAgICAgdGhpcy5leHBhbmRlZEJveE91dGxpbmUucmVjdEhlaWdodCA9IGJveEhlaWdodDtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gRXhwYW5kZWQgdGl0bGUgYmFyIGhhcyAob3B0aW9uYWwpIHJvdW5kZWQgdG9wIGNvcm5lcnMsIHNxdWFyZSBib3R0b20gY29ybmVycy4gQ2xpY2tpbmcgaXQgb3BlcmF0ZXMgbGlrZVxyXG4gICAgICAvLyBleHBhbmQvY29sbGFwc2UgYnV0dG9uLlxyXG4gICAgICB0aGlzLmV4cGFuZGVkVGl0bGVCYXIuc2hhcGUgPSBTaGFwZS5yb3VuZGVkUmVjdGFuZ2xlV2l0aFJhZGlpKCAwLCAwLCBib3hXaWR0aCwgY29sbGFwc2VkQm94SGVpZ2h0LCB7XHJcbiAgICAgICAgdG9wTGVmdDogb3B0aW9ucy5jb3JuZXJSYWRpdXMsXHJcbiAgICAgICAgdG9wUmlnaHQ6IG9wdGlvbnMuY29ybmVyUmFkaXVzXHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGxldCBjb250ZW50U3BhbkxlZnQgPSBleHBhbmRlZEJvdW5kcy5sZWZ0ICsgb3B0aW9ucy5jb250ZW50WE1hcmdpbjtcclxuICAgICAgbGV0IGNvbnRlbnRTcGFuUmlnaHQgPSBleHBhbmRlZEJvdW5kcy5yaWdodCAtIG9wdGlvbnMuY29udGVudFhNYXJnaW47XHJcbiAgICAgIGlmICggIW9wdGlvbnMuc2hvd1RpdGxlV2hlbkV4cGFuZGVkICkge1xyXG4gICAgICAgIC8vIGNvbnRlbnQgd2lsbCBiZSBwbGFjZWQgbmV4dCB0byBidXR0b25cclxuICAgICAgICBpZiAoIG9wdGlvbnMuYnV0dG9uQWxpZ24gPT09ICdsZWZ0JyApIHtcclxuICAgICAgICAgIGNvbnRlbnRTcGFuTGVmdCArPSB0aGlzLmV4cGFuZENvbGxhcHNlQnV0dG9uLndpZHRoICsgb3B0aW9ucy5jb250ZW50WFNwYWNpbmc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgeyAvLyByaWdodCBvbiByaWdodFxyXG4gICAgICAgICAgY29udGVudFNwYW5SaWdodCAtPSB0aGlzLmV4cGFuZENvbGxhcHNlQnV0dG9uLndpZHRoICsgb3B0aW9ucy5jb250ZW50WFNwYWNpbmc7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBhdmFpbGFibGVDb250ZW50V2lkdGggPSBjb250ZW50U3BhblJpZ2h0IC0gY29udGVudFNwYW5MZWZ0O1xyXG4gICAgICBjb25zdCBhdmFpbGFibGVDb250ZW50SGVpZ2h0ID0gYm94SGVpZ2h0IC0gKFxyXG4gICAgICAgIG9wdGlvbnMuc2hvd1RpdGxlV2hlbkV4cGFuZGVkICYmICFvcHRpb25zLmFsbG93Q29udGVudFRvT3ZlcmxhcFRpdGxlID8gY29sbGFwc2VkQm94SGVpZ2h0ICsgb3B0aW9ucy5jb250ZW50WU1hcmdpbiArIG9wdGlvbnMuY29udGVudFlTcGFjaW5nIDogMiAqIG9wdGlvbnMuY29udGVudFlNYXJnaW5cclxuICAgICAgKTtcclxuXHJcbiAgICAgIC8vIERldGVybWluZSB0aGUgc2l6ZSBhdmFpbGFibGUgdG8gb3VyIGNvbnRlbnRcclxuICAgICAgLy8gTk9URTogV2UgZG8gTk9UIHNldCBwcmVmZXJyZWQgc2l6ZXMgb2Ygb3VyIGNvbnRlbnQgaWYgd2UgZG9uJ3QgaGF2ZSBhIHByZWZlcnJlZCBzaXplIG91cnNlbGYhXHJcbiAgICAgIGlmICggaXNXaWR0aFNpemFibGUoIHRoaXMuY29udGVudE5vZGUgKSAmJiB0aGlzLmFjY29yZGlvbkJveC5sb2NhbFByZWZlcnJlZFdpZHRoICE9PSBudWxsICkge1xyXG4gICAgICAgIHRoaXMuY29udGVudE5vZGUucHJlZmVycmVkV2lkdGggPSBhdmFpbGFibGVDb250ZW50V2lkdGg7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBpc0hlaWdodFNpemFibGUoIHRoaXMuY29udGVudE5vZGUgKSAmJiB0aGlzLmFjY29yZGlvbkJveC5sb2NhbFByZWZlcnJlZEhlaWdodCAhPT0gbnVsbCApIHtcclxuICAgICAgICB0aGlzLmNvbnRlbnROb2RlLnByZWZlcnJlZEhlaWdodCA9IGF2YWlsYWJsZUNvbnRlbnRIZWlnaHQ7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGNvbnRlbnQgbGF5b3V0XHJcbiAgICAgIGlmICggb3B0aW9ucy5jb250ZW50VmVydGljYWxBbGlnbiA9PT0gJ3RvcCcgKSB7XHJcbiAgICAgICAgdGhpcy5jb250ZW50Tm9kZS50b3AgPSBleHBhbmRlZEJvdW5kcy5ib3R0b20gLSBvcHRpb25zLmNvbnRlbnRZTWFyZ2luIC0gYXZhaWxhYmxlQ29udGVudEhlaWdodDtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggb3B0aW9ucy5jb250ZW50VmVydGljYWxBbGlnbiA9PT0gJ2JvdHRvbScgKSB7XHJcbiAgICAgICAgdGhpcy5jb250ZW50Tm9kZS5ib3R0b20gPSBleHBhbmRlZEJvdW5kcy5ib3R0b20gLSBvcHRpb25zLmNvbnRlbnRZTWFyZ2luO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgeyAvLyBjZW50ZXJcclxuICAgICAgICB0aGlzLmNvbnRlbnROb2RlLmNlbnRlclkgPSBleHBhbmRlZEJvdW5kcy5ib3R0b20gLSBvcHRpb25zLmNvbnRlbnRZTWFyZ2luIC0gYXZhaWxhYmxlQ29udGVudEhlaWdodCAvIDI7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggb3B0aW9ucy5jb250ZW50QWxpZ24gPT09ICdsZWZ0JyApIHtcclxuICAgICAgICB0aGlzLmNvbnRlbnROb2RlLmxlZnQgPSBjb250ZW50U3BhbkxlZnQ7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIG9wdGlvbnMuY29udGVudEFsaWduID09PSAncmlnaHQnICkge1xyXG4gICAgICAgIHRoaXMuY29udGVudE5vZGUucmlnaHQgPSBjb250ZW50U3BhblJpZ2h0O1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgeyAvLyBjZW50ZXJcclxuICAgICAgICB0aGlzLmNvbnRlbnROb2RlLmNlbnRlclggPSAoIGNvbnRlbnRTcGFuTGVmdCArIGNvbnRlbnRTcGFuUmlnaHQgKSAvIDI7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBidXR0b24gaG9yaXpvbnRhbCBsYXlvdXRcclxuICAgIGxldCB0aXRsZUxlZnRTcGFuID0gY29sbGFwc2VkQm91bmRzLmxlZnQgKyBvcHRpb25zLnRpdGxlWE1hcmdpbjtcclxuICAgIGxldCB0aXRsZVJpZ2h0U3BhbiA9IGNvbGxhcHNlZEJvdW5kcy5yaWdodCAtIG9wdGlvbnMudGl0bGVYTWFyZ2luO1xyXG4gICAgaWYgKCBvcHRpb25zLmJ1dHRvbkFsaWduID09PSAnbGVmdCcgKSB7XHJcbiAgICAgIHRoaXMuZXhwYW5kQ29sbGFwc2VCdXR0b24ubGVmdCA9IGNvbGxhcHNlZEJvdW5kcy5sZWZ0ICsgb3B0aW9ucy5idXR0b25YTWFyZ2luO1xyXG4gICAgICB0aXRsZUxlZnRTcGFuID0gdGhpcy5leHBhbmRDb2xsYXBzZUJ1dHRvbi5yaWdodCArIG9wdGlvbnMudGl0bGVYU3BhY2luZztcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLmV4cGFuZENvbGxhcHNlQnV0dG9uLnJpZ2h0ID0gY29sbGFwc2VkQm91bmRzLnJpZ2h0IC0gb3B0aW9ucy5idXR0b25YTWFyZ2luO1xyXG4gICAgICB0aXRsZVJpZ2h0U3BhbiA9IHRoaXMuZXhwYW5kQ29sbGFwc2VCdXR0b24ubGVmdCAtIG9wdGlvbnMudGl0bGVYU3BhY2luZztcclxuICAgIH1cclxuXHJcbiAgICAvLyB0aXRsZSBob3Jpem9udGFsIGxheW91dFxyXG4gICAgaWYgKCBpc1dpZHRoU2l6YWJsZSggdGhpcy50aXRsZU5vZGUgKSApIHtcclxuICAgICAgdGhpcy50aXRsZU5vZGUucHJlZmVycmVkV2lkdGggPSB0aXRsZVJpZ2h0U3BhbiAtIHRpdGxlTGVmdFNwYW47XHJcbiAgICB9XHJcbiAgICBpZiAoIG9wdGlvbnMudGl0bGVBbGlnblggPT09ICdsZWZ0JyApIHtcclxuICAgICAgdGhpcy50aXRsZU5vZGUubGVmdCA9IHRpdGxlTGVmdFNwYW47XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggb3B0aW9ucy50aXRsZUFsaWduWCA9PT0gJ3JpZ2h0JyApIHtcclxuICAgICAgdGhpcy50aXRsZU5vZGUucmlnaHQgPSB0aXRsZVJpZ2h0U3BhbjtcclxuICAgIH1cclxuICAgIGVsc2UgeyAvLyBjZW50ZXJcclxuICAgICAgdGhpcy50aXRsZU5vZGUuY2VudGVyWCA9IGNvbGxhcHNlZEJvdW5kcy5jZW50ZXJYO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGJ1dHRvbiAmIHRpdGxlIHZlcnRpY2FsIGxheW91dFxyXG4gICAgaWYgKCBvcHRpb25zLnRpdGxlQWxpZ25ZID09PSAndG9wJyApIHtcclxuICAgICAgdGhpcy5leHBhbmRDb2xsYXBzZUJ1dHRvbi50b3AgPSB0aGlzLmNvbGxhcHNlZEJveC50b3AgKyBNYXRoLm1heCggb3B0aW9ucy5idXR0b25ZTWFyZ2luLCBvcHRpb25zLnRpdGxlWU1hcmdpbiApO1xyXG4gICAgICB0aGlzLnRpdGxlTm9kZS50b3AgPSB0aGlzLmV4cGFuZENvbGxhcHNlQnV0dG9uLnRvcDtcclxuICAgIH1cclxuICAgIGVsc2UgeyAvLyBjZW50ZXJcclxuICAgICAgdGhpcy5leHBhbmRDb2xsYXBzZUJ1dHRvbi5jZW50ZXJZID0gdGhpcy5jb2xsYXBzZWRCb3guY2VudGVyWTtcclxuICAgICAgdGhpcy50aXRsZU5vZGUuY2VudGVyWSA9IHRoaXMuZXhwYW5kQ29sbGFwc2VCdXR0b24uY2VudGVyWTtcclxuICAgIH1cclxuXHJcbiAgICBjb250ZW50UHJveHkuZGlzcG9zZSgpO1xyXG4gICAgdGl0bGVQcm94eS5kaXNwb3NlKCk7XHJcblxyXG4gICAgLy8gU2V0IG1pbmltdW1zIGF0IHRoZSBlbmQsIHNpbmNlIHRoaXMgbWF5IHRyaWdnZXIgYSByZWxheW91dFxyXG4gICAgdGhpcy5hY2NvcmRpb25Cb3gubG9jYWxNaW5pbXVtV2lkdGggPSBtaW5pbXVtV2lkdGg7XHJcbiAgICB0aGlzLmFjY29yZGlvbkJveC5sb2NhbE1pbmltdW1IZWlnaHQgPSBtaW5pbXVtSGVpZ2h0O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmFjY29yZGlvbkJveC5sb2NhbFByZWZlcnJlZFdpZHRoUHJvcGVydHkudW5saW5rKCB0aGlzLl91cGRhdGVMYXlvdXRMaXN0ZW5lciApO1xyXG4gICAgdGhpcy5hY2NvcmRpb25Cb3gubG9jYWxQcmVmZXJyZWRIZWlnaHRQcm9wZXJ0eS51bmxpbmsoIHRoaXMuX3VwZGF0ZUxheW91dExpc3RlbmVyICk7XHJcbiAgICB0aGlzLmFjY29yZGlvbkJveC5leHBhbmRlZFByb3BlcnR5LnVubGluayggdGhpcy5fdXBkYXRlTGF5b3V0TGlzdGVuZXIgKTtcclxuXHJcbiAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG59XHJcblxyXG5zdW4ucmVnaXN0ZXIoICdBY2NvcmRpb25Cb3gnLCBBY2NvcmRpb25Cb3ggKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxlQUFlLE1BQU0sa0NBQWtDO0FBRTlELFNBQVNDLEtBQUssUUFBUSwwQkFBMEI7QUFDaEQsT0FBT0MsZ0JBQWdCLE1BQU0sc0RBQXNEO0FBQ25GLE9BQU9DLFNBQVMsSUFBSUMsY0FBYyxRQUFRLGlDQUFpQztBQUUzRSxTQUFTQyxpQkFBaUIsRUFBRUMsdUJBQXVCLEVBQUVDLGVBQWUsRUFBRUMsY0FBYyxFQUFFQyxnQkFBZ0IsRUFBRUMsSUFBSSxFQUFpQ0MsSUFBSSxFQUFxQ0MsUUFBUSxFQUFFQyxTQUFTLEVBQW9CQyxPQUFPLEVBQUVDLElBQUksUUFBUSw2QkFBNkI7QUFDL1EsT0FBT0MsNkJBQTZCLE1BQU0sc0VBQXNFO0FBQ2hILE9BQU9DLDZCQUE2QixNQUFNLHNFQUFzRTtBQUVoSCxPQUFPQyxTQUFTLE1BQU0sOEJBQThCO0FBQ3BELE9BQU9DLE1BQU0sTUFBTSwyQkFBMkI7QUFDOUMsT0FBT0MsTUFBTSxNQUFNLGlDQUFpQztBQUVwRCxPQUFPQyxvQkFBb0IsTUFBdUMsMkJBQTJCO0FBQzdGLE9BQU9DLEdBQUcsTUFBTSxVQUFVO0FBMEYxQixlQUFlLE1BQU1DLFlBQVksU0FBU1QsT0FBTyxDQUFFSixJQUFLLENBQUMsQ0FBQztFQVd4RDtFQUNpQmMsa0JBQWtCLEdBQXFCLElBQUk7RUFDM0NDLG1CQUFtQixHQUFxQixJQUFJO0VBSTdELE9BQXVCQyxjQUFjLEdBQUcsSUFBSU4sTUFBTSxDQUFFLGdCQUFnQixFQUFFO0lBQ3BFTyxTQUFTLEVBQUVKLFlBQVk7SUFDdkJLLFNBQVMsRUFBRWxCLElBQUksQ0FBQ21CLE1BQU07SUFDdEJDLE1BQU0sRUFBRSxDQUFFLFVBQVUsRUFBRSxXQUFXO0VB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