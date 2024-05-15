// Copyright 2015-2024, University of Colorado Boulder

/**
 * A carousel UI component.
 *
 * A set of N items is divided into M 'pages', based on how many items are visible in the carousel.
 * Pressing the next and previous buttons moves through the pages.
 * Movement through the pages is animated, so that items appear to scroll by.
 *
 * Note that Carousel wraps each item (Node) in an alignBox to ensure all items have an equal "footprint" dimension.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import NumberProperty from '../../axon/js/NumberProperty.js';
import stepTimer from '../../axon/js/stepTimer.js';
import Dimension2 from '../../dot/js/Dimension2.js';
import Range from '../../dot/js/Range.js';
import { Shape } from '../../kite/js/imports.js';
import InstanceRegistry from '../../phet-core/js/documentation/InstanceRegistry.js';
import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
import { AlignGroup, FlowBox, IndexedNodeIO, LayoutConstraint, Node, Rectangle, Separator } from '../../scenery/js/imports.js';
import pushButtonSoundPlayer from '../../tambo/js/shared-sound-players/pushButtonSoundPlayer.js';
import Tandem from '../../tandem/js/Tandem.js';
import Animation from '../../twixt/js/Animation.js';
import Easing from '../../twixt/js/Easing.js';
import CarouselButton from './buttons/CarouselButton.js';
import ColorConstants from './ColorConstants.js';
import sun from './sun.js';
import DerivedProperty from '../../axon/js/DerivedProperty.js';
import { getGroupItemNodes } from './GroupItemOptions.js';
import Orientation from '../../phet-core/js/Orientation.js';
import Multilink from '../../axon/js/Multilink.js';
import Bounds2 from '../../dot/js/Bounds2.js';
import isSettingPhetioStateProperty from '../../tandem/js/isSettingPhetioStateProperty.js';
import BooleanProperty from '../../axon/js/BooleanProperty.js';
const DEFAULT_ARROW_SIZE = new Dimension2(20, 7);
export default class Carousel extends Node {
  // Items hold the data to create the carouselItemNode

  // each AlignBox holds a carouselItemNode and ensures proper sizing in the Carousel

  // Stores the visible align boxes

  // created from createNode() in CarouselItem

  // number of pages in the carousel

  // page number that is currently visible

  // enables animation when scrolling between pages

  // These are public for layout - NOTE: These are mutated if the size changes after construction

  isAnimatingProperty = new BooleanProperty(false);

  /**
   * NOTE: This will dispose the item Nodes when the carousel is disposed
   */
  constructor(items, providedOptions) {
    // Don't animate during initialization
    let isInitialized = false;

    // Override defaults with specified options
    const options = optionize()({
      // container
      orientation: 'horizontal',
      fill: 'white',
      stroke: 'black',
      lineWidth: 1,
      cornerRadius: 4,
      defaultPageNumber: 0,
      // items
      itemsPerPage: 4,
      spacing: 12,
      margin: 6,
      alignBoxOptions: {
        phetioType: IndexedNodeIO,
        phetioState: true,
        visiblePropertyOptions: {
          phetioFeatured: true
        }
      },
      // next/previous buttons
      buttonOptions: {
        xMargin: 5,
        yMargin: 5,
        // for dilating pointer areas of next/previous buttons such that they do not overlap with Carousel content
        touchAreaXDilation: 0,
        touchAreaYDilation: 0,
        mouseAreaXDilation: 0,
        mouseAreaYDilation: 0,
        baseColor: 'rgba( 200, 200, 200, 0.5 )',
        disabledColor: ColorConstants.LIGHT_GRAY,
        lineWidth: 1,
        arrowPathOptions: {
          stroke: 'black',
          lineWidth: 3
        },
        arrowSize: DEFAULT_ARROW_SIZE,
        enabledPropertyOptions: {
          phetioReadOnly: true,
          phetioFeatured: false
        },
        soundPlayer: pushButtonSoundPlayer
      },
      // item separators
      separatorsVisible: false,
      separatorOptions: {
        stroke: 'rgb( 180, 180, 180 )',
        lineWidth: 0.5,
        pickable: false
      },
      // animation, scrolling between pages
      animationEnabled: true,
      animationOptions: {
        duration: 0.4,
        stepEmitter: stepTimer,
        easing: Easing.CUBIC_IN_OUT
      },
      // phet-io
      tandem: Tandem.OPTIONAL,
      visiblePropertyOptions: {
        phetioFeatured: true
      }
    }, providedOptions);
    super();
    this.animationEnabled = options.animationEnabled;
    this.items = items;
    this.itemsPerPage = options.itemsPerPage;
    this.defaultPageNumber = options.defaultPageNumber;
    const orientation = Orientation.fromLayoutOrientation(options.orientation);
    const alignGroup = new AlignGroup();
    const itemsTandem = options.tandem.createTandem('items');
    this.carouselItemNodes = getGroupItemNodes(items, itemsTandem);

    // All items are wrapped in AlignBoxes to ensure consistent sizing
    this.alignBoxes = items.map((item, index) => {
      return alignGroup.createBox(this.carouselItemNodes[index], combineOptions({
        tandem: item.tandemName ? itemsTandem.createTandem(item.tandemName) : Tandem.OPTIONAL
      }, options.alignBoxOptions,
      // Item-specific options take precedence
      item.alignBoxOptions));
    });

    // scrollingNode will contain all items, arranged in the proper orientation, with margins and spacing.
    // NOTE: We'll need to handle updates to the order (for phet-io IndexedNodeIO).
    // Horizontal carousel arrange items left-to-right, vertical is top-to-bottom.
    // Translation of this node will be animated to give the effect of scrolling through the items.
    this.scrollingNode = new ScrollingFlowBox(this, {
      children: this.alignBoxes,
      orientation: options.orientation,
      spacing: options.spacing,
      [`${orientation.opposite.coordinate}Margin`]: options.margin
    });

    // Visible AlignBoxes (these are the ones we lay out and base everything on)
    this.visibleAlignBoxesProperty = DerivedProperty.deriveAny(this.alignBoxes.map(alignBox => alignBox.visibleProperty), () => {
      return this.getVisibleAlignBoxes();
    });

    // When the AlignBoxes are reordered, we need to recompute the visibleAlignBoxesProperty
    this.scrollingNode.childrenReorderedEmitter.addListener(() => this.visibleAlignBoxesProperty.recomputeDerivation());

    // Options common to both buttons
    const buttonOptions = combineOptions({
      cornerRadius: options.cornerRadius
    }, options.buttonOptions);
    assert && assert(options.spacing >= options.margin, 'The spacing must be >= the margin, or you will see ' + 'page 2 items at the end of page 1');

    // In order to make it easy for phet-io to re-order items, the separators should not participate
    // in the layout and have indices that get moved around.  Therefore, we add a separate layer to
    // show the separators.
    const separatorLayer = options.separatorsVisible ? new Node({
      pickable: false
    }) : null;

    // Contains the scrolling node and the associated separators, if any
    const scrollingNodeContainer = new Node({
      children: options.separatorsVisible ? [separatorLayer, this.scrollingNode] : [this.scrollingNode]
    });

    // Have to have at least one page, even if it is blank
    const countPages = items => Math.max(Math.ceil(items.length / options.itemsPerPage), 1);

    // Number of pages is derived from the total number of items and the number of items per page
    this.numberOfPagesProperty = new DerivedProperty([this.visibleAlignBoxesProperty], visibleAlignBoxes => {
      return countPages(visibleAlignBoxes);
    }, {
      isValidValue: v => v > 0
    });
    const maxPages = countPages(this.alignBoxes);
    assert && assert(options.defaultPageNumber >= 0 && options.defaultPageNumber <= this.numberOfPagesProperty.value - 1, `defaultPageNumber is out of range: ${options.defaultPageNumber}`);

    // Number of the page that is visible in the carousel.
    this.pageNumberProperty = new NumberProperty(options.defaultPageNumber, {
      tandem: options.tandem.createTandem('pageNumberProperty'),
      numberType: 'Integer',
      isValidValue: value => value < this.numberOfPagesProperty.value && value >= 0,
      // Based on the total number of possible alignBoxes, not just the ones visible on startup
      range: new Range(0, maxPages - 1),
      phetioFeatured: true
    });
    const buttonsVisibleProperty = new DerivedProperty([this.numberOfPagesProperty], numberOfPages => {
      // always show the buttons if there is more than one page, and always hide the buttons if there is only one page
      return numberOfPages > 1;
    });

    // Next button
    const nextButton = new CarouselButton(combineOptions({
      arrowDirection: orientation === Orientation.HORIZONTAL ? 'right' : 'down',
      tandem: options.tandem.createTandem('nextButton'),
      listener: () => this.pageNumberProperty.set(this.pageNumberProperty.get() + 1),
      enabledProperty: new DerivedProperty([this.pageNumberProperty, this.numberOfPagesProperty], (pageNumber, numberofPages) => {
        return pageNumber < numberofPages - 1;
      }),
      visibleProperty: buttonsVisibleProperty
    }, buttonOptions));

    // Previous button
    const previousButton = new CarouselButton(combineOptions({
      arrowDirection: orientation === Orientation.HORIZONTAL ? 'left' : 'up',
      tandem: options.tandem.createTandem('previousButton'),
      listener: () => this.pageNumberProperty.set(this.pageNumberProperty.get() - 1),
      enabledProperty: new DerivedProperty([this.pageNumberProperty], pageNumber => {
        return pageNumber > 0;
      }),
      visibleProperty: buttonsVisibleProperty
    }, buttonOptions));

    // Window with clipping area, so that the scrollingNodeContainer can be scrolled
    const windowNode = new Node({
      children: [scrollingNodeContainer]
    });

    // Background - displays the carousel's fill color
    const backgroundNode = new Rectangle({
      cornerRadius: options.cornerRadius,
      fill: options.fill
    });

    // Foreground - displays the carousel's outline, created as a separate node so that it can be placed on top of
    // everything, for a clean look.
    const foregroundNode = new Rectangle({
      cornerRadius: options.cornerRadius,
      stroke: options.stroke,
      pickable: false
    });

    // Top-level layout (based on background changes).
    this.carouselConstraint = new CarouselConstraint(this, backgroundNode, foregroundNode, windowNode, previousButton, nextButton, scrollingNodeContainer, this.alignBoxes, orientation, this.scrollingNode, this.itemsPerPage, options.margin, alignGroup, separatorLayer, options.separatorOptions);

    // Handle changing pages (or if the content changes)
    let scrollAnimation = null;
    const lastScrollBounds = new Bounds2(0, 0, 0, 0); // used mutably
    Multilink.multilink([this.pageNumberProperty, scrollingNodeContainer.localBoundsProperty], (pageNumber, scrollBounds) => {
      // We might temporarily hit this value. Bail out now instead of an assertion (it will get fired again)
      if (pageNumber >= this.numberOfPagesProperty.value) {
        return;
      }

      // stop any animation that's in progress
      scrollAnimation && scrollAnimation.stop();

      // Find the item at the top of pageNumber page
      const firstItemOnPage = this.visibleAlignBoxesProperty.value[pageNumber * options.itemsPerPage];

      // Place we want to scroll to
      const targetValue = firstItemOnPage ? -firstItemOnPage[orientation.minSide] + options.margin : 0;
      const scrollBoundsChanged = lastScrollBounds === null || !lastScrollBounds.equals(scrollBounds);
      lastScrollBounds.set(scrollBounds); // scrollBounds is mutable, we get the same reference, don't store it

      // Only animate if animation is enabled and PhET-iO state is not being set.  When PhET-iO state is being set (as
      // in loading a customized state), the carousel should immediately reflect the desired page
      // Do not animate during initialization.
      // Do not animate when our scrollBounds have changed (our content probably resized)
      if (this.animationEnabled && !isSettingPhetioStateProperty?.value && isInitialized && !scrollBoundsChanged) {
        // create and start the scroll animation
        scrollAnimation = new Animation(combineOptions({}, options.animationOptions, {
          to: targetValue,
          // options that are specific to orientation
          getValue: () => scrollingNodeContainer[orientation.coordinate],
          setValue: value => {
            scrollingNodeContainer[orientation.coordinate] = value;
          }
        }));
        scrollAnimation.endedEmitter.addListener(() => this.isAnimatingProperty.set(false));
        scrollAnimation.start();
        this.isAnimatingProperty.value = true;
      } else {
        // animation disabled, move immediate to new page
        scrollingNodeContainer[orientation.coordinate] = targetValue;
      }
    });

    // Don't stay on a page that doesn't exist
    this.visibleAlignBoxesProperty.link(() => {
      // if the only element in the last page is removed, remove the page and autoscroll to the new final page
      this.pageNumberProperty.value = Math.min(this.pageNumberProperty.value, this.numberOfPagesProperty.value - 1);
    });
    options.children = [backgroundNode, windowNode, nextButton, previousButton, foregroundNode];
    this.disposeCarousel = () => {
      this.visibleAlignBoxesProperty.dispose();
      this.pageNumberProperty.dispose();
      this.alignBoxes.forEach(alignBox => {
        assert && assert(alignBox.children.length === 1, 'Carousel AlignBox instances should have only one child');
        assert && assert(this.carouselItemNodes.includes(alignBox.children[0]), 'Carousel AlignBox instances should wrap a content node');
        alignBox.dispose();
      });
      this.scrollingNode.dispose();
      this.carouselConstraint.dispose();
      this.carouselItemNodes.forEach(node => node.dispose());
    };
    this.mutate(options);

    // Will allow potential animation after this
    isInitialized = true;

    // support for binder documentation, stripped out in builds and only runs when ?binder is specified
    assert && phet?.chipper?.queryParameters?.binder && InstanceRegistry.registerDataURL('sun', 'Carousel', this);
  }

  /**
   * NOTE: This will dispose the item Nodes
   */
  dispose() {
    this.disposeCarousel();
    super.dispose();
  }

  /**
   * Resets the carousel to its initial state.
   * @param animationEnabled - whether to enable animation during reset
   */
  reset(animationEnabled = false) {
    const saveAnimationEnabled = this.animationEnabled;
    this.animationEnabled = animationEnabled;

    // Reset the page number to the default page number if possible (if things are hidden, it might not be possible)
    this.pageNumberProperty.value = Math.min(this.defaultPageNumber, this.numberOfPagesProperty.value - 1);
    this.animationEnabled = saveAnimationEnabled;
  }

  /**
   * Given an item's visible index, scrolls the carousel to the page that contains that item.
   */
  scrollToItemVisibleIndex(itemVisibleIndex) {
    this.pageNumberProperty.set(this.itemVisibleIndexToPageNumber(itemVisibleIndex));
  }

  /**
   * Given an item, scrolls the carousel to the page that contains that item. This will only scroll if item is in the
   * Carousel and visible.
   */
  scrollToItem(item) {
    this.scrollToAlignBox(this.getAlignBoxForItem(item));
  }

  /**
   * Public for ScrollingFlowBox only
   */
  scrollToAlignBox(alignBox) {
    // If the layout is dynamic, then only account for the visible items
    const alignBoxIndex = this.visibleAlignBoxesProperty.value.indexOf(alignBox);
    assert && assert(alignBoxIndex >= 0, 'item not present or visible');
    if (alignBoxIndex >= 0) {
      this.scrollToItemVisibleIndex(alignBoxIndex);
    }
  }

  /**
   * Set the visibility of an item in the Carousel. This toggles visibility and will reflow the layout, such that hidden
   * items do not leave a gap in the layout.
   */
  setItemVisible(item, visible) {
    this.getAlignBoxForItem(item).visible = visible;
  }

  /**
   * Gets the AlignBox that wraps an item's Node.
   */
  getAlignBoxForItem(item) {
    const alignBox = this.alignBoxes[this.items.indexOf(item)];
    assert && assert(alignBox, 'item does not have corresponding alignBox');
    return alignBox;
  }

  /**
   * Returns the Node that was created for a given item.
   */
  getNodeForItem(item) {
    const node = this.carouselItemNodes[this.items.indexOf(item)];
    assert && assert(node, 'item does not have corresponding node');
    return node;
  }
  itemVisibleIndexToPageNumber(itemIndex) {
    assert && assert(itemIndex >= 0 && itemIndex < this.items.length, `itemIndex out of range: ${itemIndex}`);
    return Math.floor(itemIndex / this.itemsPerPage);
  }

  // The order of alignBoxes might be tweaked in scrollingNode's children. We need to respect this order
  getVisibleAlignBoxes() {
    return _.sortBy(this.alignBoxes.filter(alignBox => alignBox.visible), alignBox => this.scrollingNode.children.indexOf(alignBox));
  }
}

/**
 * When moveChildToIndex is called, scrolls the Carousel to that item. For use in PhET-iO when the order of items is
 * changed.
 */
class ScrollingFlowBox extends FlowBox {
  constructor(carousel, options) {
    super(options);
    this.carousel = carousel;
  }
  onIndexedNodeIOChildMoved(child) {
    this.carousel.scrollToAlignBox(child);
  }
}
class CarouselConstraint extends LayoutConstraint {
  constructor(carousel, backgroundNode, foregroundNode, windowNode, previousButton, nextButton, scrollingNodeContainer, alignBoxes, orientation, scrollingNode, itemsPerPage, margin, alignGroup, separatorLayer, separatorOptions) {
    super(carousel);

    // Hook up to listen to these nodes (will be handled by LayoutConstraint disposal)
    this.carousel = carousel;
    this.backgroundNode = backgroundNode;
    this.foregroundNode = foregroundNode;
    this.windowNode = windowNode;
    this.previousButton = previousButton;
    this.nextButton = nextButton;
    this.scrollingNodeContainer = scrollingNodeContainer;
    this.alignBoxes = alignBoxes;
    this.orientation = orientation;
    this.scrollingNode = scrollingNode;
    this.itemsPerPage = itemsPerPage;
    this.margin = margin;
    this.alignGroup = alignGroup;
    this.separatorLayer = separatorLayer;
    this.separatorOptions = separatorOptions;
    [this.backgroundNode, this.foregroundNode, this.windowNode, this.previousButton, this.nextButton, this.scrollingNodeContainer, ...this.alignBoxes].forEach(node => this.addNode(node, false));

    // Whenever layout happens in the scrolling node, it's the perfect time to update the separators
    if (this.separatorLayer) {
      // We do not need to remove this listener because it is internal to Carousel and will get garbage collected
      // when Carousel is disposed.
      this.scrollingNode.constraint.finishedLayoutEmitter.addListener(() => {
        this.updateSeparators();
      });
    }
    this.updateLayout();
  }
  updateSeparators() {
    const visibleChildren = this.carousel.getVisibleAlignBoxes();

    // Add separators between the visible children
    const range = visibleChildren.length >= 2 ? _.range(1, visibleChildren.length) : [];
    this.separatorLayer.children = range.map(index => {
      // Find the location between adjacent nodes
      const inbetween = (visibleChildren[index - 1][this.orientation.maxSide] + visibleChildren[index][this.orientation.minSide]) / 2;
      return new Separator(combineOptions({
        [`${this.orientation.coordinate}1`]: inbetween,
        [`${this.orientation.coordinate}2`]: inbetween,
        [`${this.orientation.opposite.coordinate}2`]: this.scrollingNode[this.orientation.opposite.size]
      }, this.separatorOptions));
    });
  }

  // Returns the clip area dimension for our Carousel based off of how many items we want to see per Carousel page.
  computeClipArea() {
    const orientation = this.orientation;
    const visibleAlignBoxes = this.carousel.getVisibleAlignBoxes();
    if (visibleAlignBoxes.length === 0) {
      return new Dimension2(0, 0);
    } else {
      // This doesn't fill one page in number play preferences dialog when you forget locales=*,
      // so take the last item, even if it is not a full page
      const lastBox = visibleAlignBoxes[this.itemsPerPage - 1] || visibleAlignBoxes[visibleAlignBoxes.length - 1];
      const horizontalSize = new Dimension2(
      // Measure from the beginning of the first item to the end of the last item on the 1st page
      lastBox[orientation.maxSide] - visibleAlignBoxes[0][orientation.minSide] + 2 * this.margin, this.scrollingNodeContainer.boundsProperty.value[orientation.opposite.size]);
      return this.orientation === Orientation.HORIZONTAL ? horizontalSize : horizontalSize.swapped();
    }
  }
  getBackgroundDimension() {
    let backgroundWidth;
    let backgroundHeight;
    if (this.orientation === Orientation.HORIZONTAL) {
      // For horizontal orientation, buttons contribute to width, if they are visible.
      const nextButtonWidth = this.nextButton.visible ? this.nextButton.width : 0;
      const previousButtonWidth = this.previousButton.visible ? this.previousButton.width : 0;
      backgroundWidth = this.windowNode.width + nextButtonWidth + previousButtonWidth;
      backgroundHeight = this.windowNode.height;
    } else {
      // For vertical orientation, buttons contribute to height, if they are visible.
      const nextButtonHeight = this.nextButton.visible ? this.nextButton.height : 0;
      const previousButtonHeight = this.previousButton.visible ? this.previousButton.height : 0;
      backgroundWidth = this.windowNode.width;
      backgroundHeight = this.windowNode.height + nextButtonHeight + previousButtonHeight;
    }
    return new Dimension2(backgroundWidth, backgroundHeight);
  }
  layout() {
    super.layout();
    const orientation = this.orientation;

    // Resize next/previous buttons dynamically
    const maxOppositeSize = this.alignGroup.getMaxSizeProperty(orientation.opposite).value;
    const buttonOppositeSize = maxOppositeSize + 2 * this.margin;
    this.nextButton[orientation.opposite.preferredSize] = buttonOppositeSize;
    this.previousButton[orientation.opposite.preferredSize] = buttonOppositeSize;
    this.nextButton[orientation.opposite.centerCoordinate] = this.backgroundNode[orientation.opposite.centerCoordinate];
    this.previousButton[orientation.opposite.centerCoordinate] = this.backgroundNode[orientation.opposite.centerCoordinate];
    this.windowNode[orientation.opposite.centerCoordinate] = this.backgroundNode[orientation.opposite.centerCoordinate];
    this.previousButton[orientation.minSide] = this.backgroundNode[orientation.minSide];
    this.nextButton[orientation.maxSide] = this.backgroundNode[orientation.maxSide];
    this.windowNode[orientation.centerCoordinate] = this.backgroundNode[orientation.centerCoordinate];
    const clipBounds = this.computeClipArea().toBounds();
    this.windowNode.clipArea = Shape.bounds(clipBounds);

    // Specify the local bounds in order to ensure centering. For full pages, this is not necessary since the scrollingNodeContainer
    // already spans the full area. But for a partial page, this is necessary so the window will be centered.
    this.windowNode.localBounds = clipBounds;
    const backgroundDimension = this.getBackgroundDimension();
    this.carousel.backgroundWidth = backgroundDimension.width;
    this.carousel.backgroundHeight = backgroundDimension.height;
    const backgroundBounds = backgroundDimension.toBounds();
    this.backgroundNode.rectBounds = backgroundBounds;
    this.foregroundNode.rectBounds = backgroundBounds;

    // Only update separators if they are visible
    this.separatorLayer && this.updateSeparators();
  }
}
sun.register('Carousel', Carousel);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJOdW1iZXJQcm9wZXJ0eSIsInN0ZXBUaW1lciIsIkRpbWVuc2lvbjIiLCJSYW5nZSIsIlNoYXBlIiwiSW5zdGFuY2VSZWdpc3RyeSIsIm9wdGlvbml6ZSIsImNvbWJpbmVPcHRpb25zIiwiQWxpZ25Hcm91cCIsIkZsb3dCb3giLCJJbmRleGVkTm9kZUlPIiwiTGF5b3V0Q29uc3RyYWludCIsIk5vZGUiLCJSZWN0YW5nbGUiLCJTZXBhcmF0b3IiLCJwdXNoQnV0dG9uU291bmRQbGF5ZXIiLCJUYW5kZW0iLCJBbmltYXRpb24iLCJFYXNpbmciLCJDYXJvdXNlbEJ1dHRvbiIsIkNvbG9yQ29uc3RhbnRzIiwic3VuIiwiRGVyaXZlZFByb3BlcnR5IiwiZ2V0R3JvdXBJdGVtTm9kZXMiLCJPcmllbnRhdGlvbiIsIk11bHRpbGluayIsIkJvdW5kczIiLCJpc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5IiwiQm9vbGVhblByb3BlcnR5IiwiREVGQVVMVF9BUlJPV19TSVpFIiwiQ2Fyb3VzZWwiLCJpc0FuaW1hdGluZ1Byb3BlcnR5IiwiY29uc3RydWN0b3IiLCJpdGVtcyIsInByb3ZpZGVkT3B0aW9ucyIsImlzSW5pdGlhbGl6ZWQiLCJvcHRpb25zIiwib3JpZW50YXRpb24iLCJmaWxsIiwic3Ryb2tlIiwibGluZVdpZHRoIiwiY29ybmVyUmFkaXVzIiwiZGVmYXVsdFBhZ2VOdW1iZXIiLCJpdGVtc1BlclBhZ2UiLCJzcGFjaW5nIiwibWFyZ2luIiwiYWxpZ25Cb3hPcHRpb25zIiwicGhldGlvVHlwZSIsInBoZXRpb1N0YXRlIiwidmlzaWJsZVByb3BlcnR5T3B0aW9ucyIsInBoZXRpb0ZlYXR1cmVkIiwiYnV0dG9uT3B0aW9ucyIsInhNYXJnaW4iLCJ5TWFyZ2luIiwidG91Y2hBcmVhWERpbGF0aW9uIiwidG91Y2hBcmVhWURpbGF0aW9uIiwibW91c2VBcmVhWERpbGF0aW9uIiwibW91c2VBcmVhWURpbGF0aW9uIiwiYmFzZUNvbG9yIiwiZGlzYWJsZWRDb2xvciIsIkxJR0hUX0dSQVkiLCJhcnJvd1BhdGhPcHRpb25zIiwiYXJyb3dTaXplIiwiZW5hYmxlZFByb3BlcnR5T3B0aW9ucyIsInBoZXRpb1JlYWRPbmx5Iiwic291bmRQbGF5ZXIiLCJzZXBhcmF0b3JzVmlzaWJsZSIsInNlcGFyYXRvck9wdGlvbnMiLCJwaWNrYWJsZSIsImFuaW1hdGlvbkVuYWJsZWQiLCJhbmltYXRpb25PcHRpb25zIiwiZHVyYXRpb24iLCJzdGVwRW1pdHRlciIsImVhc2luZyIsIkNVQklDX0lOX09VVCIsInRhbmRlbSIsIk9QVElPTkFMIiwiZnJvbUxheW91dE9yaWVudGF0aW9uIiwiYWxpZ25Hcm91cCIsIml0ZW1zVGFuZGVtIiwiY3JlYXRlVGFuZGVtIiwiY2Fyb3VzZWxJdGVtTm9kZXMiLCJhbGlnbkJveGVzIiwibWFwIiwiaXRlbSIsImluZGV4IiwiY3JlYXRlQm94IiwidGFuZGVtTmFtZSIsInNjcm9sbGluZ05vZGUiLCJTY3JvbGxpbmdGbG93Qm94IiwiY2hpbGRyZW4iLCJvcHBvc2l0ZSIsImNvb3JkaW5hdGUiLCJ2aXNpYmxlQWxpZ25Cb3hlc1Byb3BlcnR5IiwiZGVyaXZlQW55IiwiYWxpZ25Cb3giLCJ2aXNpYmxlUHJvcGVydHkiLCJnZXRWaXNpYmxlQWxpZ25Cb3hlcyIsImNoaWxkcmVuUmVvcmRlcmVkRW1pdHRlciIsImFkZExpc3RlbmVyIiwicmVjb21wdXRlRGVyaXZhdGlvbiIsImFzc2VydCIsInNlcGFyYXRvckxheWVyIiwic2Nyb2xsaW5nTm9kZUNvbnRhaW5lciIsImNvdW50UGFnZXMiLCJNYXRoIiwibWF4IiwiY2VpbCIsImxlbmd0aCIsIm51bWJlck9mUGFnZXNQcm9wZXJ0eSIsInZpc2libGVBbGlnbkJveGVzIiwiaXNWYWxpZFZhbHVlIiwidiIsIm1heFBhZ2VzIiwidmFsdWUiLCJwYWdlTnVtYmVyUHJvcGVydHkiLCJudW1iZXJUeXBlIiwicmFuZ2UiLCJidXR0b25zVmlzaWJsZVByb3BlcnR5IiwibnVtYmVyT2ZQYWdlcyIsIm5leHRCdXR0b24iLCJhcnJvd0RpcmVjdGlvbiIsIkhPUklaT05UQUwiLCJsaXN0ZW5lciIsInNldCIsImdldCIsImVuYWJsZWRQcm9wZXJ0eSIsInBhZ2VOdW1iZXIiLCJudW1iZXJvZlBhZ2VzIiwicHJldmlvdXNCdXR0b24iLCJ3aW5kb3dOb2RlIiwiYmFja2dyb3VuZE5vZGUiLCJmb3JlZ3JvdW5kTm9kZSIsImNhcm91c2VsQ29uc3RyYWludCIsIkNhcm91c2VsQ29uc3RyYWludCIsInNjcm9sbEFuaW1hdGlvbiIsImxhc3RTY3JvbGxCb3VuZHMiLCJtdWx0aWxpbmsiLCJsb2NhbEJvdW5kc1Byb3BlcnR5Iiwic2Nyb2xsQm91bmRzIiwic3RvcCIsImZpcnN0SXRlbU9uUGFnZSIsInRhcmdldFZhbHVlIiwibWluU2lkZSIsInNjcm9sbEJvdW5kc0NoYW5nZWQiLCJlcXVhbHMiLCJ0byIsImdldFZhbHVlIiwic2V0VmFsdWUiLCJlbmRlZEVtaXR0ZXIiLCJzdGFydCIsImxpbmsiLCJtaW4iLCJkaXNwb3NlQ2Fyb3VzZWwiLCJkaXNwb3NlIiwiZm9yRWFjaCIsImluY2x1ZGVzIiwibm9kZSIsIm11dGF0ZSIsInBoZXQiLCJjaGlwcGVyIiwicXVlcnlQYXJhbWV0ZXJzIiwiYmluZGVyIiwicmVnaXN0ZXJEYXRhVVJMIiwicmVzZXQiLCJzYXZlQW5pbWF0aW9uRW5hYmxlZCIsInNjcm9sbFRvSXRlbVZpc2libGVJbmRleCIsIml0ZW1WaXNpYmxlSW5kZXgiLCJpdGVtVmlzaWJsZUluZGV4VG9QYWdlTnVtYmVyIiwic2Nyb2xsVG9JdGVtIiwic2Nyb2xsVG9BbGlnbkJveCIsImdldEFsaWduQm94Rm9ySXRlbSIsImFsaWduQm94SW5kZXgiLCJpbmRleE9mIiwic2V0SXRlbVZpc2libGUiLCJ2aXNpYmxlIiwiZ2V0Tm9kZUZvckl0ZW0iLCJpdGVtSW5kZXgiLCJmbG9vciIsIl8iLCJzb3J0QnkiLCJmaWx0ZXIiLCJjYXJvdXNlbCIsIm9uSW5kZXhlZE5vZGVJT0NoaWxkTW92ZWQiLCJjaGlsZCIsImFkZE5vZGUiLCJjb25zdHJhaW50IiwiZmluaXNoZWRMYXlvdXRFbWl0dGVyIiwidXBkYXRlU2VwYXJhdG9ycyIsInVwZGF0ZUxheW91dCIsInZpc2libGVDaGlsZHJlbiIsImluYmV0d2VlbiIsIm1heFNpZGUiLCJzaXplIiwiY29tcHV0ZUNsaXBBcmVhIiwibGFzdEJveCIsImhvcml6b250YWxTaXplIiwiYm91bmRzUHJvcGVydHkiLCJzd2FwcGVkIiwiZ2V0QmFja2dyb3VuZERpbWVuc2lvbiIsImJhY2tncm91bmRXaWR0aCIsImJhY2tncm91bmRIZWlnaHQiLCJuZXh0QnV0dG9uV2lkdGgiLCJ3aWR0aCIsInByZXZpb3VzQnV0dG9uV2lkdGgiLCJoZWlnaHQiLCJuZXh0QnV0dG9uSGVpZ2h0IiwicHJldmlvdXNCdXR0b25IZWlnaHQiLCJsYXlvdXQiLCJtYXhPcHBvc2l0ZVNpemUiLCJnZXRNYXhTaXplUHJvcGVydHkiLCJidXR0b25PcHBvc2l0ZVNpemUiLCJwcmVmZXJyZWRTaXplIiwiY2VudGVyQ29vcmRpbmF0ZSIsImNsaXBCb3VuZHMiLCJ0b0JvdW5kcyIsImNsaXBBcmVhIiwiYm91bmRzIiwibG9jYWxCb3VuZHMiLCJiYWNrZ3JvdW5kRGltZW5zaW9uIiwiYmFja2dyb3VuZEJvdW5kcyIsInJlY3RCb3VuZHMiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkNhcm91c2VsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE1LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEEgY2Fyb3VzZWwgVUkgY29tcG9uZW50LlxyXG4gKlxyXG4gKiBBIHNldCBvZiBOIGl0ZW1zIGlzIGRpdmlkZWQgaW50byBNICdwYWdlcycsIGJhc2VkIG9uIGhvdyBtYW55IGl0ZW1zIGFyZSB2aXNpYmxlIGluIHRoZSBjYXJvdXNlbC5cclxuICogUHJlc3NpbmcgdGhlIG5leHQgYW5kIHByZXZpb3VzIGJ1dHRvbnMgbW92ZXMgdGhyb3VnaCB0aGUgcGFnZXMuXHJcbiAqIE1vdmVtZW50IHRocm91Z2ggdGhlIHBhZ2VzIGlzIGFuaW1hdGVkLCBzbyB0aGF0IGl0ZW1zIGFwcGVhciB0byBzY3JvbGwgYnkuXHJcbiAqXHJcbiAqIE5vdGUgdGhhdCBDYXJvdXNlbCB3cmFwcyBlYWNoIGl0ZW0gKE5vZGUpIGluIGFuIGFsaWduQm94IHRvIGVuc3VyZSBhbGwgaXRlbXMgaGF2ZSBhbiBlcXVhbCBcImZvb3RwcmludFwiIGRpbWVuc2lvbi5cclxuICpcclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgTnVtYmVyUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9OdW1iZXJQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IFByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgc3RlcFRpbWVyIGZyb20gJy4uLy4uL2F4b24vanMvc3RlcFRpbWVyLmpzJztcclxuaW1wb3J0IERpbWVuc2lvbjIgZnJvbSAnLi4vLi4vZG90L2pzL0RpbWVuc2lvbjIuanMnO1xyXG5pbXBvcnQgUmFuZ2UgZnJvbSAnLi4vLi4vZG90L2pzL1JhbmdlLmpzJztcclxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tICcuLi8uLi9raXRlL2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgSW5zdGFuY2VSZWdpc3RyeSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvZG9jdW1lbnRhdGlvbi9JbnN0YW5jZVJlZ2lzdHJ5LmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBjb21iaW5lT3B0aW9ucyB9IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgeyBBbGlnbkJveCwgQWxpZ25Cb3hPcHRpb25zLCBBbGlnbkdyb3VwLCBGbG93Qm94LCBGbG93Qm94T3B0aW9ucywgSW5kZXhlZE5vZGVJTywgSW5kZXhlZE5vZGVJT1BhcmVudCwgTGF5b3V0Q29uc3RyYWludCwgTGF5b3V0T3JpZW50YXRpb24sIE5vZGUsIE5vZGVPcHRpb25zLCBSZWN0YW5nbGUsIFNlcGFyYXRvciwgU2VwYXJhdG9yT3B0aW9ucywgVFBhaW50IH0gZnJvbSAnLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IHB1c2hCdXR0b25Tb3VuZFBsYXllciBmcm9tICcuLi8uLi90YW1iby9qcy9zaGFyZWQtc291bmQtcGxheWVycy9wdXNoQnV0dG9uU291bmRQbGF5ZXIuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgQW5pbWF0aW9uLCB7IEFuaW1hdGlvbk9wdGlvbnMgfSBmcm9tICcuLi8uLi90d2l4dC9qcy9BbmltYXRpb24uanMnO1xyXG5pbXBvcnQgRWFzaW5nIGZyb20gJy4uLy4uL3R3aXh0L2pzL0Vhc2luZy5qcyc7XHJcbmltcG9ydCBDYXJvdXNlbEJ1dHRvbiwgeyBDYXJvdXNlbEJ1dHRvbk9wdGlvbnMgfSBmcm9tICcuL2J1dHRvbnMvQ2Fyb3VzZWxCdXR0b24uanMnO1xyXG5pbXBvcnQgQ29sb3JDb25zdGFudHMgZnJvbSAnLi9Db2xvckNvbnN0YW50cy5qcyc7XHJcbmltcG9ydCBzdW4gZnJvbSAnLi9zdW4uanMnO1xyXG5pbXBvcnQgUmVhZE9ubHlQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1JlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgRGVyaXZlZFByb3BlcnR5LCB7IFVua25vd25EZXJpdmVkUHJvcGVydHkgfSBmcm9tICcuLi8uLi9heG9uL2pzL0Rlcml2ZWRQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBHcm91cEl0ZW1PcHRpb25zLCB7IGdldEdyb3VwSXRlbU5vZGVzIH0gZnJvbSAnLi9Hcm91cEl0ZW1PcHRpb25zLmpzJztcclxuaW1wb3J0IE9yaWVudGF0aW9uIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9PcmllbnRhdGlvbi5qcyc7XHJcbmltcG9ydCBNdWx0aWxpbmsgZnJvbSAnLi4vLi4vYXhvbi9qcy9NdWx0aWxpbmsuanMnO1xyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBCdXR0b25Ob2RlIGZyb20gJy4vYnV0dG9ucy9CdXR0b25Ob2RlLmpzJztcclxuaW1wb3J0IGlzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkgZnJvbSAnLi4vLi4vdGFuZGVtL2pzL2lzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgQm9vbGVhblByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvQm9vbGVhblByb3BlcnR5LmpzJztcclxuXHJcbmNvbnN0IERFRkFVTFRfQVJST1dfU0laRSA9IG5ldyBEaW1lbnNpb24yKCAyMCwgNyApO1xyXG5cclxuZXhwb3J0IHR5cGUgQ2Fyb3VzZWxJdGVtID0gR3JvdXBJdGVtT3B0aW9ucyAmIHtcclxuXHJcbiAgLy8gSXRlbS1zcGVjaWZpYyBvcHRpb25zIHRha2UgcHJlY2VkZW5jZSBvdmVyIGdlbmVyYWwgYWxpZ25Cb3hPcHRpb25zXHJcbiAgYWxpZ25Cb3hPcHRpb25zPzogQWxpZ25Cb3hPcHRpb25zO1xyXG59O1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuXHJcbiAgLy8gY29udGFpbmVyXHJcbiAgb3JpZW50YXRpb24/OiBMYXlvdXRPcmllbnRhdGlvbjtcclxuICBmaWxsPzogVFBhaW50OyAvLyBiYWNrZ3JvdW5kIGNvbG9yIG9mIHRoZSBjYXJvdXNlbFxyXG4gIHN0cm9rZT86IFRQYWludDsgLy8gY29sb3IgdXNlZCB0byBzdHJva2UgdGhlIGJvcmRlciBvZiB0aGUgY2Fyb3VzZWxcclxuICBsaW5lV2lkdGg/OiBudW1iZXI7IC8vIHdpZHRoIG9mIHRoZSBib3JkZXIgYXJvdW5kIHRoZSBjYXJvdXNlbFxyXG4gIGNvcm5lclJhZGl1cz86IG51bWJlcjsgLy8gcmFkaXVzIGFwcGxpZWQgdG8gdGhlIGNhcm91c2VsIGFuZCBuZXh0L3ByZXZpb3VzIGJ1dHRvbnNcclxuICBkZWZhdWx0UGFnZU51bWJlcj86IG51bWJlcjsgLy8gcGFnZSB0aGF0IGlzIGluaXRpYWxseSB2aXNpYmxlXHJcblxyXG4gIC8vIGl0ZW1zXHJcbiAgaXRlbXNQZXJQYWdlPzogbnVtYmVyOyAvLyBudW1iZXIgb2YgaXRlbXMgcGVyIHBhZ2UsIG9yIGhvdyBtYW55IGl0ZW1zIGFyZSB2aXNpYmxlIGF0IGEgdGltZSBpbiB0aGUgY2Fyb3VzZWxcclxuICBzcGFjaW5nPzogbnVtYmVyOyAvLyBzcGFjaW5nIGJldHdlZW4gaXRlbXMsIGJldHdlZW4gaXRlbXMgYW5kIG9wdGlvbmFsIHNlcGFyYXRvcnMsIGFuZCBiZXR3ZWVuIGl0ZW1zIGFuZCBidXR0b25zXHJcbiAgbWFyZ2luPzogbnVtYmVyOyAvLyBtYXJnaW4gYmV0d2VlbiBpdGVtcyBhbmQgdGhlIGVkZ2VzIG9mIHRoZSBjYXJvdXNlbFxyXG5cclxuICAvLyBvcHRpb25zIGZvciB0aGUgQWxpZ25Cb3hlcyAocGFydGljdWxhcmx5IGlmIGFsaWdubWVudCBvZiBpdGVtcyBzaG91bGQgYmUgY2hhbmdlZCwgb3IgaWYgc3BlY2lmaWMgbWFyZ2lucyBhcmUgZGVzaXJlZClcclxuICBhbGlnbkJveE9wdGlvbnM/OiBBbGlnbkJveE9wdGlvbnM7XHJcblxyXG4gIC8vIG5leHQvcHJldmlvdXMgYnV0dG9uIG9wdGlvbnNcclxuICBidXR0b25PcHRpb25zPzogQ2Fyb3VzZWxCdXR0b25PcHRpb25zO1xyXG5cclxuICAvLyBpdGVtIHNlcGFyYXRvciBvcHRpb25zXHJcbiAgc2VwYXJhdG9yc1Zpc2libGU/OiBib29sZWFuOyAvLyB3aGV0aGVyIHRvIHB1dCBzZXBhcmF0b3JzIGJldHdlZW4gaXRlbXNcclxuICBzZXBhcmF0b3JPcHRpb25zPzogU2VwYXJhdG9yT3B0aW9ucztcclxuXHJcbiAgLy8gYW5pbWF0aW9uLCBzY3JvbGxpbmcgYmV0d2VlbiBwYWdlc1xyXG4gIGFuaW1hdGlvbkVuYWJsZWQ/OiBib29sZWFuOyAvLyBpcyBhbmltYXRpb24gZW5hYmxlZCB3aGVuIHNjcm9sbGluZyBiZXR3ZWVuIHBhZ2VzP1xyXG4gIGFuaW1hdGlvbk9wdGlvbnM/OiBTdHJpY3RPbWl0PEFuaW1hdGlvbk9wdGlvbnM8bnVtYmVyPiwgJ3RvJyB8ICdzZXRWYWx1ZScgfCAnZ2V0VmFsdWUnPjsgLy8gV2Ugb3ZlcnJpZGUgdG8vc2V0VmFsdWUvZ2V0VmFsdWVcclxufTtcclxuXHJcbmV4cG9ydCB0eXBlIENhcm91c2VsT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgU3RyaWN0T21pdDxOb2RlT3B0aW9ucywgJ2NoaWxkcmVuJz47XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDYXJvdXNlbCBleHRlbmRzIE5vZGUge1xyXG5cclxuICAvLyBJdGVtcyBob2xkIHRoZSBkYXRhIHRvIGNyZWF0ZSB0aGUgY2Fyb3VzZWxJdGVtTm9kZVxyXG4gIHByaXZhdGUgcmVhZG9ubHkgaXRlbXM6IENhcm91c2VsSXRlbVtdO1xyXG5cclxuICAvLyBlYWNoIEFsaWduQm94IGhvbGRzIGEgY2Fyb3VzZWxJdGVtTm9kZSBhbmQgZW5zdXJlcyBwcm9wZXIgc2l6aW5nIGluIHRoZSBDYXJvdXNlbFxyXG4gIHByaXZhdGUgcmVhZG9ubHkgYWxpZ25Cb3hlczogQWxpZ25Cb3hbXTtcclxuXHJcbiAgLy8gU3RvcmVzIHRoZSB2aXNpYmxlIGFsaWduIGJveGVzXHJcbiAgcHJpdmF0ZSByZWFkb25seSB2aXNpYmxlQWxpZ25Cb3hlc1Byb3BlcnR5OiBVbmtub3duRGVyaXZlZFByb3BlcnR5PEFsaWduQm94W10+O1xyXG5cclxuICAvLyBjcmVhdGVkIGZyb20gY3JlYXRlTm9kZSgpIGluIENhcm91c2VsSXRlbVxyXG4gIHB1YmxpYyByZWFkb25seSBjYXJvdXNlbEl0ZW1Ob2RlczogTm9kZVtdO1xyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IGl0ZW1zUGVyUGFnZTogbnVtYmVyO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgZGVmYXVsdFBhZ2VOdW1iZXI6IG51bWJlcjtcclxuXHJcbiAgLy8gbnVtYmVyIG9mIHBhZ2VzIGluIHRoZSBjYXJvdXNlbFxyXG4gIHB1YmxpYyByZWFkb25seSBudW1iZXJPZlBhZ2VzUHJvcGVydHk6IFJlYWRPbmx5UHJvcGVydHk8bnVtYmVyPjtcclxuXHJcbiAgLy8gcGFnZSBudW1iZXIgdGhhdCBpcyBjdXJyZW50bHkgdmlzaWJsZVxyXG4gIHB1YmxpYyByZWFkb25seSBwYWdlTnVtYmVyUHJvcGVydHk6IFByb3BlcnR5PG51bWJlcj47XHJcblxyXG4gIC8vIGVuYWJsZXMgYW5pbWF0aW9uIHdoZW4gc2Nyb2xsaW5nIGJldHdlZW4gcGFnZXNcclxuICBwdWJsaWMgYW5pbWF0aW9uRW5hYmxlZDogYm9vbGVhbjtcclxuXHJcbiAgLy8gVGhlc2UgYXJlIHB1YmxpYyBmb3IgbGF5b3V0IC0gTk9URTogVGhlc2UgYXJlIG11dGF0ZWQgaWYgdGhlIHNpemUgY2hhbmdlcyBhZnRlciBjb25zdHJ1Y3Rpb25cclxuICBwdWJsaWMgYmFja2dyb3VuZFdpZHRoITogbnVtYmVyO1xyXG4gIHB1YmxpYyBiYWNrZ3JvdW5kSGVpZ2h0ITogbnVtYmVyO1xyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IGRpc3Bvc2VDYXJvdXNlbDogKCkgPT4gdm9pZDtcclxuICBwcml2YXRlIHJlYWRvbmx5IHNjcm9sbGluZ05vZGU6IEZsb3dCb3g7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBjYXJvdXNlbENvbnN0cmFpbnQ6IENhcm91c2VsQ29uc3RyYWludDtcclxuXHJcbiAgcHVibGljIHJlYWRvbmx5IGlzQW5pbWF0aW5nUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCBmYWxzZSApO1xyXG5cclxuICAvKipcclxuICAgKiBOT1RFOiBUaGlzIHdpbGwgZGlzcG9zZSB0aGUgaXRlbSBOb2RlcyB3aGVuIHRoZSBjYXJvdXNlbCBpcyBkaXNwb3NlZFxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggaXRlbXM6IENhcm91c2VsSXRlbVtdLCBwcm92aWRlZE9wdGlvbnM/OiBDYXJvdXNlbE9wdGlvbnMgKSB7XHJcblxyXG4gICAgLy8gRG9uJ3QgYW5pbWF0ZSBkdXJpbmcgaW5pdGlhbGl6YXRpb25cclxuICAgIGxldCBpc0luaXRpYWxpemVkID0gZmFsc2U7XHJcblxyXG4gICAgLy8gT3ZlcnJpZGUgZGVmYXVsdHMgd2l0aCBzcGVjaWZpZWQgb3B0aW9uc1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxDYXJvdXNlbE9wdGlvbnMsIFNlbGZPcHRpb25zLCBOb2RlT3B0aW9ucz4oKSgge1xyXG5cclxuICAgICAgLy8gY29udGFpbmVyXHJcbiAgICAgIG9yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcsXHJcbiAgICAgIGZpbGw6ICd3aGl0ZScsXHJcbiAgICAgIHN0cm9rZTogJ2JsYWNrJyxcclxuICAgICAgbGluZVdpZHRoOiAxLFxyXG4gICAgICBjb3JuZXJSYWRpdXM6IDQsXHJcbiAgICAgIGRlZmF1bHRQYWdlTnVtYmVyOiAwLFxyXG5cclxuICAgICAgLy8gaXRlbXNcclxuICAgICAgaXRlbXNQZXJQYWdlOiA0LFxyXG4gICAgICBzcGFjaW5nOiAxMixcclxuICAgICAgbWFyZ2luOiA2LFxyXG5cclxuICAgICAgYWxpZ25Cb3hPcHRpb25zOiB7XHJcbiAgICAgICAgcGhldGlvVHlwZTogSW5kZXhlZE5vZGVJTyxcclxuICAgICAgICBwaGV0aW9TdGF0ZTogdHJ1ZSxcclxuICAgICAgICB2aXNpYmxlUHJvcGVydHlPcHRpb25zOiB7XHJcbiAgICAgICAgICBwaGV0aW9GZWF0dXJlZDogdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIG5leHQvcHJldmlvdXMgYnV0dG9uc1xyXG4gICAgICBidXR0b25PcHRpb25zOiB7XHJcbiAgICAgICAgeE1hcmdpbjogNSxcclxuICAgICAgICB5TWFyZ2luOiA1LFxyXG5cclxuICAgICAgICAvLyBmb3IgZGlsYXRpbmcgcG9pbnRlciBhcmVhcyBvZiBuZXh0L3ByZXZpb3VzIGJ1dHRvbnMgc3VjaCB0aGF0IHRoZXkgZG8gbm90IG92ZXJsYXAgd2l0aCBDYXJvdXNlbCBjb250ZW50XHJcbiAgICAgICAgdG91Y2hBcmVhWERpbGF0aW9uOiAwLFxyXG4gICAgICAgIHRvdWNoQXJlYVlEaWxhdGlvbjogMCxcclxuICAgICAgICBtb3VzZUFyZWFYRGlsYXRpb246IDAsXHJcbiAgICAgICAgbW91c2VBcmVhWURpbGF0aW9uOiAwLFxyXG5cclxuICAgICAgICBiYXNlQ29sb3I6ICdyZ2JhKCAyMDAsIDIwMCwgMjAwLCAwLjUgKScsXHJcbiAgICAgICAgZGlzYWJsZWRDb2xvcjogQ29sb3JDb25zdGFudHMuTElHSFRfR1JBWSxcclxuICAgICAgICBsaW5lV2lkdGg6IDEsXHJcblxyXG4gICAgICAgIGFycm93UGF0aE9wdGlvbnM6IHtcclxuICAgICAgICAgIHN0cm9rZTogJ2JsYWNrJyxcclxuICAgICAgICAgIGxpbmVXaWR0aDogM1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXJyb3dTaXplOiBERUZBVUxUX0FSUk9XX1NJWkUsXHJcblxyXG4gICAgICAgIGVuYWJsZWRQcm9wZXJ0eU9wdGlvbnM6IHtcclxuICAgICAgICAgIHBoZXRpb1JlYWRPbmx5OiB0cnVlLFxyXG4gICAgICAgICAgcGhldGlvRmVhdHVyZWQ6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc291bmRQbGF5ZXI6IHB1c2hCdXR0b25Tb3VuZFBsYXllclxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gaXRlbSBzZXBhcmF0b3JzXHJcbiAgICAgIHNlcGFyYXRvcnNWaXNpYmxlOiBmYWxzZSxcclxuICAgICAgc2VwYXJhdG9yT3B0aW9uczoge1xyXG4gICAgICAgIHN0cm9rZTogJ3JnYiggMTgwLCAxODAsIDE4MCApJyxcclxuICAgICAgICBsaW5lV2lkdGg6IDAuNSxcclxuICAgICAgICBwaWNrYWJsZTogZmFsc2VcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIGFuaW1hdGlvbiwgc2Nyb2xsaW5nIGJldHdlZW4gcGFnZXNcclxuICAgICAgYW5pbWF0aW9uRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgYW5pbWF0aW9uT3B0aW9uczoge1xyXG4gICAgICAgIGR1cmF0aW9uOiAwLjQsXHJcbiAgICAgICAgc3RlcEVtaXR0ZXI6IHN0ZXBUaW1lcixcclxuICAgICAgICBlYXNpbmc6IEVhc2luZy5DVUJJQ19JTl9PVVRcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIHBoZXQtaW9cclxuICAgICAgdGFuZGVtOiBUYW5kZW0uT1BUSU9OQUwsXHJcbiAgICAgIHZpc2libGVQcm9wZXJ0eU9wdGlvbnM6IHtcclxuICAgICAgICBwaGV0aW9GZWF0dXJlZDogdHJ1ZVxyXG4gICAgICB9XHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBzdXBlcigpO1xyXG5cclxuICAgIHRoaXMuYW5pbWF0aW9uRW5hYmxlZCA9IG9wdGlvbnMuYW5pbWF0aW9uRW5hYmxlZDtcclxuICAgIHRoaXMuaXRlbXMgPSBpdGVtcztcclxuICAgIHRoaXMuaXRlbXNQZXJQYWdlID0gb3B0aW9ucy5pdGVtc1BlclBhZ2U7XHJcbiAgICB0aGlzLmRlZmF1bHRQYWdlTnVtYmVyID0gb3B0aW9ucy5kZWZhdWx0UGFnZU51bWJlcjtcclxuXHJcbiAgICBjb25zdCBvcmllbnRhdGlvbiA9IE9yaWVudGF0aW9uLmZyb21MYXlvdXRPcmllbnRhdGlvbiggb3B0aW9ucy5vcmllbnRhdGlvbiApO1xyXG4gICAgY29uc3QgYWxpZ25Hcm91cCA9IG5ldyBBbGlnbkdyb3VwKCk7XHJcblxyXG4gICAgY29uc3QgaXRlbXNUYW5kZW0gPSBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdpdGVtcycgKTtcclxuICAgIHRoaXMuY2Fyb3VzZWxJdGVtTm9kZXMgPSBnZXRHcm91cEl0ZW1Ob2RlcyggaXRlbXMsIGl0ZW1zVGFuZGVtICk7XHJcblxyXG4gICAgLy8gQWxsIGl0ZW1zIGFyZSB3cmFwcGVkIGluIEFsaWduQm94ZXMgdG8gZW5zdXJlIGNvbnNpc3RlbnQgc2l6aW5nXHJcbiAgICB0aGlzLmFsaWduQm94ZXMgPSBpdGVtcy5tYXAoICggaXRlbSwgaW5kZXggKSA9PiB7XHJcbiAgICAgIHJldHVybiBhbGlnbkdyb3VwLmNyZWF0ZUJveCggdGhpcy5jYXJvdXNlbEl0ZW1Ob2Rlc1sgaW5kZXggXSwgY29tYmluZU9wdGlvbnM8QWxpZ25Cb3hPcHRpb25zPigge1xyXG4gICAgICAgICAgdGFuZGVtOiBpdGVtLnRhbmRlbU5hbWUgPyBpdGVtc1RhbmRlbS5jcmVhdGVUYW5kZW0oIGl0ZW0udGFuZGVtTmFtZSApIDogVGFuZGVtLk9QVElPTkFMXHJcbiAgICAgICAgfSwgb3B0aW9ucy5hbGlnbkJveE9wdGlvbnMsXHJcblxyXG4gICAgICAgIC8vIEl0ZW0tc3BlY2lmaWMgb3B0aW9ucyB0YWtlIHByZWNlZGVuY2VcclxuICAgICAgICBpdGVtLmFsaWduQm94T3B0aW9ucyApICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gc2Nyb2xsaW5nTm9kZSB3aWxsIGNvbnRhaW4gYWxsIGl0ZW1zLCBhcnJhbmdlZCBpbiB0aGUgcHJvcGVyIG9yaWVudGF0aW9uLCB3aXRoIG1hcmdpbnMgYW5kIHNwYWNpbmcuXHJcbiAgICAvLyBOT1RFOiBXZSdsbCBuZWVkIHRvIGhhbmRsZSB1cGRhdGVzIHRvIHRoZSBvcmRlciAoZm9yIHBoZXQtaW8gSW5kZXhlZE5vZGVJTykuXHJcbiAgICAvLyBIb3Jpem9udGFsIGNhcm91c2VsIGFycmFuZ2UgaXRlbXMgbGVmdC10by1yaWdodCwgdmVydGljYWwgaXMgdG9wLXRvLWJvdHRvbS5cclxuICAgIC8vIFRyYW5zbGF0aW9uIG9mIHRoaXMgbm9kZSB3aWxsIGJlIGFuaW1hdGVkIHRvIGdpdmUgdGhlIGVmZmVjdCBvZiBzY3JvbGxpbmcgdGhyb3VnaCB0aGUgaXRlbXMuXHJcbiAgICB0aGlzLnNjcm9sbGluZ05vZGUgPSBuZXcgU2Nyb2xsaW5nRmxvd0JveCggdGhpcywge1xyXG4gICAgICBjaGlsZHJlbjogdGhpcy5hbGlnbkJveGVzLFxyXG4gICAgICBvcmllbnRhdGlvbjogb3B0aW9ucy5vcmllbnRhdGlvbixcclxuICAgICAgc3BhY2luZzogb3B0aW9ucy5zcGFjaW5nLFxyXG4gICAgICBbIGAke29yaWVudGF0aW9uLm9wcG9zaXRlLmNvb3JkaW5hdGV9TWFyZ2luYCBdOiBvcHRpb25zLm1hcmdpblxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIFZpc2libGUgQWxpZ25Cb3hlcyAodGhlc2UgYXJlIHRoZSBvbmVzIHdlIGxheSBvdXQgYW5kIGJhc2UgZXZlcnl0aGluZyBvbilcclxuICAgIHRoaXMudmlzaWJsZUFsaWduQm94ZXNQcm9wZXJ0eSA9IERlcml2ZWRQcm9wZXJ0eS5kZXJpdmVBbnkoIHRoaXMuYWxpZ25Cb3hlcy5tYXAoIGFsaWduQm94ID0+IGFsaWduQm94LnZpc2libGVQcm9wZXJ0eSApLCAoKSA9PiB7XHJcbiAgICAgIHJldHVybiB0aGlzLmdldFZpc2libGVBbGlnbkJveGVzKCk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gV2hlbiB0aGUgQWxpZ25Cb3hlcyBhcmUgcmVvcmRlcmVkLCB3ZSBuZWVkIHRvIHJlY29tcHV0ZSB0aGUgdmlzaWJsZUFsaWduQm94ZXNQcm9wZXJ0eVxyXG4gICAgdGhpcy5zY3JvbGxpbmdOb2RlLmNoaWxkcmVuUmVvcmRlcmVkRW1pdHRlci5hZGRMaXN0ZW5lciggKCkgPT4gdGhpcy52aXNpYmxlQWxpZ25Cb3hlc1Byb3BlcnR5LnJlY29tcHV0ZURlcml2YXRpb24oKSApO1xyXG5cclxuICAgIC8vIE9wdGlvbnMgY29tbW9uIHRvIGJvdGggYnV0dG9uc1xyXG4gICAgY29uc3QgYnV0dG9uT3B0aW9ucyA9IGNvbWJpbmVPcHRpb25zPENhcm91c2VsQnV0dG9uT3B0aW9ucz4oIHtcclxuICAgICAgY29ybmVyUmFkaXVzOiBvcHRpb25zLmNvcm5lclJhZGl1c1xyXG4gICAgfSwgb3B0aW9ucy5idXR0b25PcHRpb25zICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5zcGFjaW5nID49IG9wdGlvbnMubWFyZ2luLCAnVGhlIHNwYWNpbmcgbXVzdCBiZSA+PSB0aGUgbWFyZ2luLCBvciB5b3Ugd2lsbCBzZWUgJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdwYWdlIDIgaXRlbXMgYXQgdGhlIGVuZCBvZiBwYWdlIDEnICk7XHJcblxyXG4gICAgLy8gSW4gb3JkZXIgdG8gbWFrZSBpdCBlYXN5IGZvciBwaGV0LWlvIHRvIHJlLW9yZGVyIGl0ZW1zLCB0aGUgc2VwYXJhdG9ycyBzaG91bGQgbm90IHBhcnRpY2lwYXRlXHJcbiAgICAvLyBpbiB0aGUgbGF5b3V0IGFuZCBoYXZlIGluZGljZXMgdGhhdCBnZXQgbW92ZWQgYXJvdW5kLiAgVGhlcmVmb3JlLCB3ZSBhZGQgYSBzZXBhcmF0ZSBsYXllciB0b1xyXG4gICAgLy8gc2hvdyB0aGUgc2VwYXJhdG9ycy5cclxuICAgIGNvbnN0IHNlcGFyYXRvckxheWVyID0gb3B0aW9ucy5zZXBhcmF0b3JzVmlzaWJsZSA/IG5ldyBOb2RlKCB7XHJcbiAgICAgIHBpY2thYmxlOiBmYWxzZVxyXG4gICAgfSApIDogbnVsbDtcclxuXHJcbiAgICAvLyBDb250YWlucyB0aGUgc2Nyb2xsaW5nIG5vZGUgYW5kIHRoZSBhc3NvY2lhdGVkIHNlcGFyYXRvcnMsIGlmIGFueVxyXG4gICAgY29uc3Qgc2Nyb2xsaW5nTm9kZUNvbnRhaW5lciA9IG5ldyBOb2RlKCB7XHJcbiAgICAgIGNoaWxkcmVuOiBvcHRpb25zLnNlcGFyYXRvcnNWaXNpYmxlID8gWyBzZXBhcmF0b3JMYXllciEsIHRoaXMuc2Nyb2xsaW5nTm9kZSBdIDogWyB0aGlzLnNjcm9sbGluZ05vZGUgXVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIEhhdmUgdG8gaGF2ZSBhdCBsZWFzdCBvbmUgcGFnZSwgZXZlbiBpZiBpdCBpcyBibGFua1xyXG4gICAgY29uc3QgY291bnRQYWdlcyA9ICggaXRlbXM6IEFsaWduQm94W10gKSA9PiBNYXRoLm1heCggTWF0aC5jZWlsKCBpdGVtcy5sZW5ndGggLyBvcHRpb25zLml0ZW1zUGVyUGFnZSApLCAxICk7XHJcblxyXG4gICAgLy8gTnVtYmVyIG9mIHBhZ2VzIGlzIGRlcml2ZWQgZnJvbSB0aGUgdG90YWwgbnVtYmVyIG9mIGl0ZW1zIGFuZCB0aGUgbnVtYmVyIG9mIGl0ZW1zIHBlciBwYWdlXHJcbiAgICB0aGlzLm51bWJlck9mUGFnZXNQcm9wZXJ0eSA9IG5ldyBEZXJpdmVkUHJvcGVydHkoIFsgdGhpcy52aXNpYmxlQWxpZ25Cb3hlc1Byb3BlcnR5IF0sIHZpc2libGVBbGlnbkJveGVzID0+IHtcclxuICAgICAgcmV0dXJuIGNvdW50UGFnZXMoIHZpc2libGVBbGlnbkJveGVzICk7XHJcbiAgICB9LCB7XHJcbiAgICAgIGlzVmFsaWRWYWx1ZTogdiA9PiB2ID4gMFxyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IG1heFBhZ2VzID0gY291bnRQYWdlcyggdGhpcy5hbGlnbkJveGVzICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5kZWZhdWx0UGFnZU51bWJlciA+PSAwICYmIG9wdGlvbnMuZGVmYXVsdFBhZ2VOdW1iZXIgPD0gdGhpcy5udW1iZXJPZlBhZ2VzUHJvcGVydHkudmFsdWUgLSAxLFxyXG4gICAgICBgZGVmYXVsdFBhZ2VOdW1iZXIgaXMgb3V0IG9mIHJhbmdlOiAke29wdGlvbnMuZGVmYXVsdFBhZ2VOdW1iZXJ9YCApO1xyXG5cclxuICAgIC8vIE51bWJlciBvZiB0aGUgcGFnZSB0aGF0IGlzIHZpc2libGUgaW4gdGhlIGNhcm91c2VsLlxyXG4gICAgdGhpcy5wYWdlTnVtYmVyUHJvcGVydHkgPSBuZXcgTnVtYmVyUHJvcGVydHkoIG9wdGlvbnMuZGVmYXVsdFBhZ2VOdW1iZXIsIHtcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdwYWdlTnVtYmVyUHJvcGVydHknICksXHJcbiAgICAgIG51bWJlclR5cGU6ICdJbnRlZ2VyJyxcclxuICAgICAgaXNWYWxpZFZhbHVlOiAoIHZhbHVlOiBudW1iZXIgKSA9PiB2YWx1ZSA8IHRoaXMubnVtYmVyT2ZQYWdlc1Byb3BlcnR5LnZhbHVlICYmIHZhbHVlID49IDAsXHJcblxyXG4gICAgICAvLyBCYXNlZCBvbiB0aGUgdG90YWwgbnVtYmVyIG9mIHBvc3NpYmxlIGFsaWduQm94ZXMsIG5vdCBqdXN0IHRoZSBvbmVzIHZpc2libGUgb24gc3RhcnR1cFxyXG4gICAgICByYW5nZTogbmV3IFJhbmdlKCAwLCBtYXhQYWdlcyAtIDEgKSxcclxuICAgICAgcGhldGlvRmVhdHVyZWQ6IHRydWVcclxuICAgIH0gKTtcclxuXHJcbiAgICBjb25zdCBidXR0b25zVmlzaWJsZVByb3BlcnR5ID0gbmV3IERlcml2ZWRQcm9wZXJ0eSggWyB0aGlzLm51bWJlck9mUGFnZXNQcm9wZXJ0eSBdLCBudW1iZXJPZlBhZ2VzID0+IHtcclxuICAgICAgLy8gYWx3YXlzIHNob3cgdGhlIGJ1dHRvbnMgaWYgdGhlcmUgaXMgbW9yZSB0aGFuIG9uZSBwYWdlLCBhbmQgYWx3YXlzIGhpZGUgdGhlIGJ1dHRvbnMgaWYgdGhlcmUgaXMgb25seSBvbmUgcGFnZVxyXG4gICAgICByZXR1cm4gbnVtYmVyT2ZQYWdlcyA+IDE7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gTmV4dCBidXR0b25cclxuICAgIGNvbnN0IG5leHRCdXR0b24gPSBuZXcgQ2Fyb3VzZWxCdXR0b24oIGNvbWJpbmVPcHRpb25zPENhcm91c2VsQnV0dG9uT3B0aW9ucz4oIHtcclxuICAgICAgYXJyb3dEaXJlY3Rpb246IG9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5IT1JJWk9OVEFMID8gJ3JpZ2h0JyA6ICdkb3duJyxcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICduZXh0QnV0dG9uJyApLFxyXG4gICAgICBsaXN0ZW5lcjogKCkgPT4gdGhpcy5wYWdlTnVtYmVyUHJvcGVydHkuc2V0KCB0aGlzLnBhZ2VOdW1iZXJQcm9wZXJ0eS5nZXQoKSArIDEgKSxcclxuICAgICAgZW5hYmxlZFByb3BlcnR5OiBuZXcgRGVyaXZlZFByb3BlcnR5KCBbIHRoaXMucGFnZU51bWJlclByb3BlcnR5LCB0aGlzLm51bWJlck9mUGFnZXNQcm9wZXJ0eSBdLCAoIHBhZ2VOdW1iZXIsIG51bWJlcm9mUGFnZXMgKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHBhZ2VOdW1iZXIgPCBudW1iZXJvZlBhZ2VzIC0gMTtcclxuICAgICAgfSApLFxyXG4gICAgICB2aXNpYmxlUHJvcGVydHk6IGJ1dHRvbnNWaXNpYmxlUHJvcGVydHlcclxuICAgIH0sIGJ1dHRvbk9wdGlvbnMgKSApO1xyXG5cclxuICAgIC8vIFByZXZpb3VzIGJ1dHRvblxyXG4gICAgY29uc3QgcHJldmlvdXNCdXR0b24gPSBuZXcgQ2Fyb3VzZWxCdXR0b24oIGNvbWJpbmVPcHRpb25zPENhcm91c2VsQnV0dG9uT3B0aW9ucz4oIHtcclxuICAgICAgYXJyb3dEaXJlY3Rpb246IG9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5IT1JJWk9OVEFMID8gJ2xlZnQnIDogJ3VwJyxcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdwcmV2aW91c0J1dHRvbicgKSxcclxuICAgICAgbGlzdGVuZXI6ICgpID0+IHRoaXMucGFnZU51bWJlclByb3BlcnR5LnNldCggdGhpcy5wYWdlTnVtYmVyUHJvcGVydHkuZ2V0KCkgLSAxICksXHJcbiAgICAgIGVuYWJsZWRQcm9wZXJ0eTogbmV3IERlcml2ZWRQcm9wZXJ0eSggWyB0aGlzLnBhZ2VOdW1iZXJQcm9wZXJ0eSBdLCBwYWdlTnVtYmVyID0+IHtcclxuICAgICAgICByZXR1cm4gcGFnZU51bWJlciA+IDA7XHJcbiAgICAgIH0gKSxcclxuICAgICAgdmlzaWJsZVByb3BlcnR5OiBidXR0b25zVmlzaWJsZVByb3BlcnR5XHJcbiAgICB9LCBidXR0b25PcHRpb25zICkgKTtcclxuXHJcbiAgICAvLyBXaW5kb3cgd2l0aCBjbGlwcGluZyBhcmVhLCBzbyB0aGF0IHRoZSBzY3JvbGxpbmdOb2RlQ29udGFpbmVyIGNhbiBiZSBzY3JvbGxlZFxyXG4gICAgY29uc3Qgd2luZG93Tm9kZSA9IG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIHNjcm9sbGluZ05vZGVDb250YWluZXIgXSB9ICk7XHJcblxyXG4gICAgLy8gQmFja2dyb3VuZCAtIGRpc3BsYXlzIHRoZSBjYXJvdXNlbCdzIGZpbGwgY29sb3JcclxuICAgIGNvbnN0IGJhY2tncm91bmROb2RlID0gbmV3IFJlY3RhbmdsZSgge1xyXG4gICAgICBjb3JuZXJSYWRpdXM6IG9wdGlvbnMuY29ybmVyUmFkaXVzLFxyXG4gICAgICBmaWxsOiBvcHRpb25zLmZpbGxcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBGb3JlZ3JvdW5kIC0gZGlzcGxheXMgdGhlIGNhcm91c2VsJ3Mgb3V0bGluZSwgY3JlYXRlZCBhcyBhIHNlcGFyYXRlIG5vZGUgc28gdGhhdCBpdCBjYW4gYmUgcGxhY2VkIG9uIHRvcCBvZlxyXG4gICAgLy8gZXZlcnl0aGluZywgZm9yIGEgY2xlYW4gbG9vay5cclxuICAgIGNvbnN0IGZvcmVncm91bmROb2RlID0gbmV3IFJlY3RhbmdsZSgge1xyXG4gICAgICBjb3JuZXJSYWRpdXM6IG9wdGlvbnMuY29ybmVyUmFkaXVzLFxyXG4gICAgICBzdHJva2U6IG9wdGlvbnMuc3Ryb2tlLFxyXG4gICAgICBwaWNrYWJsZTogZmFsc2VcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBUb3AtbGV2ZWwgbGF5b3V0IChiYXNlZCBvbiBiYWNrZ3JvdW5kIGNoYW5nZXMpLlxyXG4gICAgdGhpcy5jYXJvdXNlbENvbnN0cmFpbnQgPSBuZXcgQ2Fyb3VzZWxDb25zdHJhaW50KFxyXG4gICAgICB0aGlzLFxyXG4gICAgICBiYWNrZ3JvdW5kTm9kZSxcclxuICAgICAgZm9yZWdyb3VuZE5vZGUsXHJcbiAgICAgIHdpbmRvd05vZGUsXHJcbiAgICAgIHByZXZpb3VzQnV0dG9uLFxyXG4gICAgICBuZXh0QnV0dG9uLFxyXG4gICAgICBzY3JvbGxpbmdOb2RlQ29udGFpbmVyLFxyXG4gICAgICB0aGlzLmFsaWduQm94ZXMsXHJcbiAgICAgIG9yaWVudGF0aW9uLFxyXG4gICAgICB0aGlzLnNjcm9sbGluZ05vZGUsXHJcbiAgICAgIHRoaXMuaXRlbXNQZXJQYWdlLFxyXG4gICAgICBvcHRpb25zLm1hcmdpbixcclxuICAgICAgYWxpZ25Hcm91cCxcclxuICAgICAgc2VwYXJhdG9yTGF5ZXIsXHJcbiAgICAgIG9wdGlvbnMuc2VwYXJhdG9yT3B0aW9ucyApO1xyXG5cclxuICAgIC8vIEhhbmRsZSBjaGFuZ2luZyBwYWdlcyAob3IgaWYgdGhlIGNvbnRlbnQgY2hhbmdlcylcclxuICAgIGxldCBzY3JvbGxBbmltYXRpb246IEFuaW1hdGlvbiB8IG51bGwgPSBudWxsO1xyXG4gICAgY29uc3QgbGFzdFNjcm9sbEJvdW5kcyA9IG5ldyBCb3VuZHMyKCAwLCAwLCAwLCAwICk7IC8vIHVzZWQgbXV0YWJseVxyXG4gICAgTXVsdGlsaW5rLm11bHRpbGluayggWyB0aGlzLnBhZ2VOdW1iZXJQcm9wZXJ0eSwgc2Nyb2xsaW5nTm9kZUNvbnRhaW5lci5sb2NhbEJvdW5kc1Byb3BlcnR5IF0sICggcGFnZU51bWJlciwgc2Nyb2xsQm91bmRzICkgPT4ge1xyXG5cclxuICAgICAgLy8gV2UgbWlnaHQgdGVtcG9yYXJpbHkgaGl0IHRoaXMgdmFsdWUuIEJhaWwgb3V0IG5vdyBpbnN0ZWFkIG9mIGFuIGFzc2VydGlvbiAoaXQgd2lsbCBnZXQgZmlyZWQgYWdhaW4pXHJcbiAgICAgIGlmICggcGFnZU51bWJlciA+PSB0aGlzLm51bWJlck9mUGFnZXNQcm9wZXJ0eS52YWx1ZSApIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHN0b3AgYW55IGFuaW1hdGlvbiB0aGF0J3MgaW4gcHJvZ3Jlc3NcclxuICAgICAgc2Nyb2xsQW5pbWF0aW9uICYmIHNjcm9sbEFuaW1hdGlvbi5zdG9wKCk7XHJcblxyXG4gICAgICAvLyBGaW5kIHRoZSBpdGVtIGF0IHRoZSB0b3Agb2YgcGFnZU51bWJlciBwYWdlXHJcbiAgICAgIGNvbnN0IGZpcnN0SXRlbU9uUGFnZSA9IHRoaXMudmlzaWJsZUFsaWduQm94ZXNQcm9wZXJ0eS52YWx1ZVsgcGFnZU51bWJlciAqIG9wdGlvbnMuaXRlbXNQZXJQYWdlIF07XHJcblxyXG4gICAgICAvLyBQbGFjZSB3ZSB3YW50IHRvIHNjcm9sbCB0b1xyXG4gICAgICBjb25zdCB0YXJnZXRWYWx1ZSA9IGZpcnN0SXRlbU9uUGFnZSA/ICggKCAtZmlyc3RJdGVtT25QYWdlWyBvcmllbnRhdGlvbi5taW5TaWRlIF0gKSArIG9wdGlvbnMubWFyZ2luICkgOiAwO1xyXG5cclxuICAgICAgY29uc3Qgc2Nyb2xsQm91bmRzQ2hhbmdlZCA9IGxhc3RTY3JvbGxCb3VuZHMgPT09IG51bGwgfHwgIWxhc3RTY3JvbGxCb3VuZHMuZXF1YWxzKCBzY3JvbGxCb3VuZHMgKTtcclxuICAgICAgbGFzdFNjcm9sbEJvdW5kcy5zZXQoIHNjcm9sbEJvdW5kcyApOyAvLyBzY3JvbGxCb3VuZHMgaXMgbXV0YWJsZSwgd2UgZ2V0IHRoZSBzYW1lIHJlZmVyZW5jZSwgZG9uJ3Qgc3RvcmUgaXRcclxuXHJcbiAgICAgIC8vIE9ubHkgYW5pbWF0ZSBpZiBhbmltYXRpb24gaXMgZW5hYmxlZCBhbmQgUGhFVC1pTyBzdGF0ZSBpcyBub3QgYmVpbmcgc2V0LiAgV2hlbiBQaEVULWlPIHN0YXRlIGlzIGJlaW5nIHNldCAoYXNcclxuICAgICAgLy8gaW4gbG9hZGluZyBhIGN1c3RvbWl6ZWQgc3RhdGUpLCB0aGUgY2Fyb3VzZWwgc2hvdWxkIGltbWVkaWF0ZWx5IHJlZmxlY3QgdGhlIGRlc2lyZWQgcGFnZVxyXG4gICAgICAvLyBEbyBub3QgYW5pbWF0ZSBkdXJpbmcgaW5pdGlhbGl6YXRpb24uXHJcbiAgICAgIC8vIERvIG5vdCBhbmltYXRlIHdoZW4gb3VyIHNjcm9sbEJvdW5kcyBoYXZlIGNoYW5nZWQgKG91ciBjb250ZW50IHByb2JhYmx5IHJlc2l6ZWQpXHJcbiAgICAgIGlmICggdGhpcy5hbmltYXRpb25FbmFibGVkICYmICFpc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5Py52YWx1ZSAmJiBpc0luaXRpYWxpemVkICYmICFzY3JvbGxCb3VuZHNDaGFuZ2VkICkge1xyXG5cclxuICAgICAgICAvLyBjcmVhdGUgYW5kIHN0YXJ0IHRoZSBzY3JvbGwgYW5pbWF0aW9uXHJcbiAgICAgICAgc2Nyb2xsQW5pbWF0aW9uID0gbmV3IEFuaW1hdGlvbiggY29tYmluZU9wdGlvbnM8QW5pbWF0aW9uT3B0aW9uczxudW1iZXI+Pigge30sIG9wdGlvbnMuYW5pbWF0aW9uT3B0aW9ucywge1xyXG4gICAgICAgICAgdG86IHRhcmdldFZhbHVlLFxyXG5cclxuICAgICAgICAgIC8vIG9wdGlvbnMgdGhhdCBhcmUgc3BlY2lmaWMgdG8gb3JpZW50YXRpb25cclxuICAgICAgICAgIGdldFZhbHVlOiAoKSA9PiBzY3JvbGxpbmdOb2RlQ29udGFpbmVyWyBvcmllbnRhdGlvbi5jb29yZGluYXRlIF0sXHJcbiAgICAgICAgICBzZXRWYWx1ZTogKCB2YWx1ZTogbnVtYmVyICkgPT4geyBzY3JvbGxpbmdOb2RlQ29udGFpbmVyWyBvcmllbnRhdGlvbi5jb29yZGluYXRlIF0gPSB2YWx1ZTsgfVxyXG5cclxuICAgICAgICB9ICkgKTtcclxuICAgICAgICBzY3JvbGxBbmltYXRpb24uZW5kZWRFbWl0dGVyLmFkZExpc3RlbmVyKCAoKSA9PiB0aGlzLmlzQW5pbWF0aW5nUHJvcGVydHkuc2V0KCBmYWxzZSApICk7XHJcbiAgICAgICAgc2Nyb2xsQW5pbWF0aW9uLnN0YXJ0KCk7XHJcbiAgICAgICAgdGhpcy5pc0FuaW1hdGluZ1Byb3BlcnR5LnZhbHVlID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuXHJcbiAgICAgICAgLy8gYW5pbWF0aW9uIGRpc2FibGVkLCBtb3ZlIGltbWVkaWF0ZSB0byBuZXcgcGFnZVxyXG4gICAgICAgIHNjcm9sbGluZ05vZGVDb250YWluZXJbIG9yaWVudGF0aW9uLmNvb3JkaW5hdGUgXSA9IHRhcmdldFZhbHVlO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gRG9uJ3Qgc3RheSBvbiBhIHBhZ2UgdGhhdCBkb2Vzbid0IGV4aXN0XHJcbiAgICB0aGlzLnZpc2libGVBbGlnbkJveGVzUHJvcGVydHkubGluayggKCkgPT4ge1xyXG4gICAgICAvLyBpZiB0aGUgb25seSBlbGVtZW50IGluIHRoZSBsYXN0IHBhZ2UgaXMgcmVtb3ZlZCwgcmVtb3ZlIHRoZSBwYWdlIGFuZCBhdXRvc2Nyb2xsIHRvIHRoZSBuZXcgZmluYWwgcGFnZVxyXG4gICAgICB0aGlzLnBhZ2VOdW1iZXJQcm9wZXJ0eS52YWx1ZSA9IE1hdGgubWluKCB0aGlzLnBhZ2VOdW1iZXJQcm9wZXJ0eS52YWx1ZSwgdGhpcy5udW1iZXJPZlBhZ2VzUHJvcGVydHkudmFsdWUgLSAxICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgb3B0aW9ucy5jaGlsZHJlbiA9IFsgYmFja2dyb3VuZE5vZGUsIHdpbmRvd05vZGUsIG5leHRCdXR0b24sIHByZXZpb3VzQnV0dG9uLCBmb3JlZ3JvdW5kTm9kZSBdO1xyXG5cclxuICAgIHRoaXMuZGlzcG9zZUNhcm91c2VsID0gKCkgPT4ge1xyXG4gICAgICB0aGlzLnZpc2libGVBbGlnbkJveGVzUHJvcGVydHkuZGlzcG9zZSgpO1xyXG4gICAgICB0aGlzLnBhZ2VOdW1iZXJQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICAgIHRoaXMuYWxpZ25Cb3hlcy5mb3JFYWNoKCBhbGlnbkJveCA9PiB7XHJcblxyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGFsaWduQm94LmNoaWxkcmVuLmxlbmd0aCA9PT0gMSwgJ0Nhcm91c2VsIEFsaWduQm94IGluc3RhbmNlcyBzaG91bGQgaGF2ZSBvbmx5IG9uZSBjaGlsZCcgKTtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmNhcm91c2VsSXRlbU5vZGVzLmluY2x1ZGVzKCBhbGlnbkJveC5jaGlsZHJlblsgMCBdICksICdDYXJvdXNlbCBBbGlnbkJveCBpbnN0YW5jZXMgc2hvdWxkIHdyYXAgYSBjb250ZW50IG5vZGUnICk7XHJcblxyXG4gICAgICAgIGFsaWduQm94LmRpc3Bvc2UoKTtcclxuICAgICAgfSApO1xyXG4gICAgICB0aGlzLnNjcm9sbGluZ05vZGUuZGlzcG9zZSgpO1xyXG4gICAgICB0aGlzLmNhcm91c2VsQ29uc3RyYWludC5kaXNwb3NlKCk7XHJcbiAgICAgIHRoaXMuY2Fyb3VzZWxJdGVtTm9kZXMuZm9yRWFjaCggbm9kZSA9PiBub2RlLmRpc3Bvc2UoKSApO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLm11dGF0ZSggb3B0aW9ucyApO1xyXG5cclxuICAgIC8vIFdpbGwgYWxsb3cgcG90ZW50aWFsIGFuaW1hdGlvbiBhZnRlciB0aGlzXHJcbiAgICBpc0luaXRpYWxpemVkID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBzdXBwb3J0IGZvciBiaW5kZXIgZG9jdW1lbnRhdGlvbiwgc3RyaXBwZWQgb3V0IGluIGJ1aWxkcyBhbmQgb25seSBydW5zIHdoZW4gP2JpbmRlciBpcyBzcGVjaWZpZWRcclxuICAgIGFzc2VydCAmJiBwaGV0Py5jaGlwcGVyPy5xdWVyeVBhcmFtZXRlcnM/LmJpbmRlciAmJiBJbnN0YW5jZVJlZ2lzdHJ5LnJlZ2lzdGVyRGF0YVVSTCggJ3N1bicsICdDYXJvdXNlbCcsIHRoaXMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE5PVEU6IFRoaXMgd2lsbCBkaXNwb3NlIHRoZSBpdGVtIE5vZGVzXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmRpc3Bvc2VDYXJvdXNlbCgpO1xyXG4gICAgc3VwZXIuZGlzcG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzZXRzIHRoZSBjYXJvdXNlbCB0byBpdHMgaW5pdGlhbCBzdGF0ZS5cclxuICAgKiBAcGFyYW0gYW5pbWF0aW9uRW5hYmxlZCAtIHdoZXRoZXIgdG8gZW5hYmxlIGFuaW1hdGlvbiBkdXJpbmcgcmVzZXRcclxuICAgKi9cclxuICBwdWJsaWMgcmVzZXQoIGFuaW1hdGlvbkVuYWJsZWQgPSBmYWxzZSApOiB2b2lkIHtcclxuICAgIGNvbnN0IHNhdmVBbmltYXRpb25FbmFibGVkID0gdGhpcy5hbmltYXRpb25FbmFibGVkO1xyXG4gICAgdGhpcy5hbmltYXRpb25FbmFibGVkID0gYW5pbWF0aW9uRW5hYmxlZDtcclxuXHJcbiAgICAvLyBSZXNldCB0aGUgcGFnZSBudW1iZXIgdG8gdGhlIGRlZmF1bHQgcGFnZSBudW1iZXIgaWYgcG9zc2libGUgKGlmIHRoaW5ncyBhcmUgaGlkZGVuLCBpdCBtaWdodCBub3QgYmUgcG9zc2libGUpXHJcbiAgICB0aGlzLnBhZ2VOdW1iZXJQcm9wZXJ0eS52YWx1ZSA9IE1hdGgubWluKCB0aGlzLmRlZmF1bHRQYWdlTnVtYmVyLCB0aGlzLm51bWJlck9mUGFnZXNQcm9wZXJ0eS52YWx1ZSAtIDEgKTtcclxuXHJcbiAgICB0aGlzLmFuaW1hdGlvbkVuYWJsZWQgPSBzYXZlQW5pbWF0aW9uRW5hYmxlZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIGFuIGl0ZW0ncyB2aXNpYmxlIGluZGV4LCBzY3JvbGxzIHRoZSBjYXJvdXNlbCB0byB0aGUgcGFnZSB0aGF0IGNvbnRhaW5zIHRoYXQgaXRlbS5cclxuICAgKi9cclxuICBwcml2YXRlIHNjcm9sbFRvSXRlbVZpc2libGVJbmRleCggaXRlbVZpc2libGVJbmRleDogbnVtYmVyICk6IHZvaWQge1xyXG4gICAgdGhpcy5wYWdlTnVtYmVyUHJvcGVydHkuc2V0KCB0aGlzLml0ZW1WaXNpYmxlSW5kZXhUb1BhZ2VOdW1iZXIoIGl0ZW1WaXNpYmxlSW5kZXggKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2l2ZW4gYW4gaXRlbSwgc2Nyb2xscyB0aGUgY2Fyb3VzZWwgdG8gdGhlIHBhZ2UgdGhhdCBjb250YWlucyB0aGF0IGl0ZW0uIFRoaXMgd2lsbCBvbmx5IHNjcm9sbCBpZiBpdGVtIGlzIGluIHRoZVxyXG4gICAqIENhcm91c2VsIGFuZCB2aXNpYmxlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzY3JvbGxUb0l0ZW0oIGl0ZW06IENhcm91c2VsSXRlbSApOiB2b2lkIHtcclxuICAgIHRoaXMuc2Nyb2xsVG9BbGlnbkJveCggdGhpcy5nZXRBbGlnbkJveEZvckl0ZW0oIGl0ZW0gKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUHVibGljIGZvciBTY3JvbGxpbmdGbG93Qm94IG9ubHlcclxuICAgKi9cclxuICBwdWJsaWMgc2Nyb2xsVG9BbGlnbkJveCggYWxpZ25Cb3g6IEFsaWduQm94ICk6IHZvaWQge1xyXG5cclxuXHJcbiAgICAvLyBJZiB0aGUgbGF5b3V0IGlzIGR5bmFtaWMsIHRoZW4gb25seSBhY2NvdW50IGZvciB0aGUgdmlzaWJsZSBpdGVtc1xyXG4gICAgY29uc3QgYWxpZ25Cb3hJbmRleCA9IHRoaXMudmlzaWJsZUFsaWduQm94ZXNQcm9wZXJ0eS52YWx1ZS5pbmRleE9mKCBhbGlnbkJveCApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGFsaWduQm94SW5kZXggPj0gMCwgJ2l0ZW0gbm90IHByZXNlbnQgb3IgdmlzaWJsZScgKTtcclxuICAgIGlmICggYWxpZ25Cb3hJbmRleCA+PSAwICkge1xyXG4gICAgICB0aGlzLnNjcm9sbFRvSXRlbVZpc2libGVJbmRleCggYWxpZ25Cb3hJbmRleCApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHRoZSB2aXNpYmlsaXR5IG9mIGFuIGl0ZW0gaW4gdGhlIENhcm91c2VsLiBUaGlzIHRvZ2dsZXMgdmlzaWJpbGl0eSBhbmQgd2lsbCByZWZsb3cgdGhlIGxheW91dCwgc3VjaCB0aGF0IGhpZGRlblxyXG4gICAqIGl0ZW1zIGRvIG5vdCBsZWF2ZSBhIGdhcCBpbiB0aGUgbGF5b3V0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRJdGVtVmlzaWJsZSggaXRlbTogQ2Fyb3VzZWxJdGVtLCB2aXNpYmxlOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgdGhpcy5nZXRBbGlnbkJveEZvckl0ZW0oIGl0ZW0gKS52aXNpYmxlID0gdmlzaWJsZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIEFsaWduQm94IHRoYXQgd3JhcHMgYW4gaXRlbSdzIE5vZGUuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRBbGlnbkJveEZvckl0ZW0oIGl0ZW06IENhcm91c2VsSXRlbSApOiBBbGlnbkJveCB7XHJcbiAgICBjb25zdCBhbGlnbkJveCA9IHRoaXMuYWxpZ25Cb3hlc1sgdGhpcy5pdGVtcy5pbmRleE9mKCBpdGVtICkgXTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhbGlnbkJveCwgJ2l0ZW0gZG9lcyBub3QgaGF2ZSBjb3JyZXNwb25kaW5nIGFsaWduQm94JyApO1xyXG4gICAgcmV0dXJuIGFsaWduQm94O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgTm9kZSB0aGF0IHdhcyBjcmVhdGVkIGZvciBhIGdpdmVuIGl0ZW0uXHJcbiAgICovXHJcbiAgcHVibGljIGdldE5vZGVGb3JJdGVtKCBpdGVtOiBDYXJvdXNlbEl0ZW0gKTogTm9kZSB7XHJcbiAgICBjb25zdCBub2RlID0gdGhpcy5jYXJvdXNlbEl0ZW1Ob2Rlc1sgdGhpcy5pdGVtcy5pbmRleE9mKCBpdGVtICkgXTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBub2RlLCAnaXRlbSBkb2VzIG5vdCBoYXZlIGNvcnJlc3BvbmRpbmcgbm9kZScgKTtcclxuICAgIHJldHVybiBub2RlO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBpdGVtVmlzaWJsZUluZGV4VG9QYWdlTnVtYmVyKCBpdGVtSW5kZXg6IG51bWJlciApOiBudW1iZXIge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXRlbUluZGV4ID49IDAgJiYgaXRlbUluZGV4IDwgdGhpcy5pdGVtcy5sZW5ndGgsIGBpdGVtSW5kZXggb3V0IG9mIHJhbmdlOiAke2l0ZW1JbmRleH1gICk7XHJcbiAgICByZXR1cm4gTWF0aC5mbG9vciggaXRlbUluZGV4IC8gdGhpcy5pdGVtc1BlclBhZ2UgKTtcclxuICB9XHJcblxyXG4gIC8vIFRoZSBvcmRlciBvZiBhbGlnbkJveGVzIG1pZ2h0IGJlIHR3ZWFrZWQgaW4gc2Nyb2xsaW5nTm9kZSdzIGNoaWxkcmVuLiBXZSBuZWVkIHRvIHJlc3BlY3QgdGhpcyBvcmRlclxyXG4gIHB1YmxpYyBnZXRWaXNpYmxlQWxpZ25Cb3hlcygpOiBBbGlnbkJveFtdIHtcclxuICAgIHJldHVybiBfLnNvcnRCeSggdGhpcy5hbGlnbkJveGVzLmZpbHRlciggYWxpZ25Cb3ggPT4gYWxpZ25Cb3gudmlzaWJsZSApLCBhbGlnbkJveCA9PiB0aGlzLnNjcm9sbGluZ05vZGUuY2hpbGRyZW4uaW5kZXhPZiggYWxpZ25Cb3ggKSApO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFdoZW4gbW92ZUNoaWxkVG9JbmRleCBpcyBjYWxsZWQsIHNjcm9sbHMgdGhlIENhcm91c2VsIHRvIHRoYXQgaXRlbS4gRm9yIHVzZSBpbiBQaEVULWlPIHdoZW4gdGhlIG9yZGVyIG9mIGl0ZW1zIGlzXHJcbiAqIGNoYW5nZWQuXHJcbiAqL1xyXG5jbGFzcyBTY3JvbGxpbmdGbG93Qm94IGV4dGVuZHMgRmxvd0JveCBpbXBsZW1lbnRzIEluZGV4ZWROb2RlSU9QYXJlbnQge1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgY2Fyb3VzZWw6IENhcm91c2VsO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIGNhcm91c2VsOiBDYXJvdXNlbCwgb3B0aW9ucz86IEZsb3dCb3hPcHRpb25zICkge1xyXG4gICAgc3VwZXIoIG9wdGlvbnMgKTtcclxuICAgIHRoaXMuY2Fyb3VzZWwgPSBjYXJvdXNlbDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvbkluZGV4ZWROb2RlSU9DaGlsZE1vdmVkKCBjaGlsZDogTm9kZSApOiB2b2lkIHtcclxuICAgIHRoaXMuY2Fyb3VzZWwuc2Nyb2xsVG9BbGlnbkJveCggY2hpbGQgYXMgQWxpZ25Cb3ggKTtcclxuICB9XHJcbn1cclxuXHJcblxyXG5jbGFzcyBDYXJvdXNlbENvbnN0cmFpbnQgZXh0ZW5kcyBMYXlvdXRDb25zdHJhaW50IHtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGNhcm91c2VsOiBDYXJvdXNlbCxcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgYmFja2dyb3VuZE5vZGU6IFJlY3RhbmdsZSxcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZm9yZWdyb3VuZE5vZGU6IFJlY3RhbmdsZSxcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgd2luZG93Tm9kZTogTm9kZSxcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgcHJldmlvdXNCdXR0b246IEJ1dHRvbk5vZGUsXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IG5leHRCdXR0b246IEJ1dHRvbk5vZGUsXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNjcm9sbGluZ05vZGVDb250YWluZXI6IE5vZGUsXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFsaWduQm94ZXM6IE5vZGVbXSxcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgb3JpZW50YXRpb246IE9yaWVudGF0aW9uLFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBzY3JvbGxpbmdOb2RlOiBGbG93Qm94LFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBpdGVtc1BlclBhZ2U6IG51bWJlcixcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgbWFyZ2luOiBudW1iZXIsXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFsaWduR3JvdXA6IEFsaWduR3JvdXAsXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNlcGFyYXRvckxheWVyOiBOb2RlIHwgbnVsbCxcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2VwYXJhdG9yT3B0aW9uczogU2VwYXJhdG9yT3B0aW9ucyApIHtcclxuICAgIHN1cGVyKCBjYXJvdXNlbCApO1xyXG5cclxuICAgIC8vIEhvb2sgdXAgdG8gbGlzdGVuIHRvIHRoZXNlIG5vZGVzICh3aWxsIGJlIGhhbmRsZWQgYnkgTGF5b3V0Q29uc3RyYWludCBkaXNwb3NhbClcclxuICAgIFsgdGhpcy5iYWNrZ3JvdW5kTm9kZSxcclxuICAgICAgdGhpcy5mb3JlZ3JvdW5kTm9kZSxcclxuICAgICAgdGhpcy53aW5kb3dOb2RlLFxyXG4gICAgICB0aGlzLnByZXZpb3VzQnV0dG9uLFxyXG4gICAgICB0aGlzLm5leHRCdXR0b24sXHJcbiAgICAgIHRoaXMuc2Nyb2xsaW5nTm9kZUNvbnRhaW5lcixcclxuICAgICAgLi4udGhpcy5hbGlnbkJveGVzIF0uZm9yRWFjaCggbm9kZSA9PiB0aGlzLmFkZE5vZGUoIG5vZGUsIGZhbHNlICkgKTtcclxuXHJcbiAgICAvLyBXaGVuZXZlciBsYXlvdXQgaGFwcGVucyBpbiB0aGUgc2Nyb2xsaW5nIG5vZGUsIGl0J3MgdGhlIHBlcmZlY3QgdGltZSB0byB1cGRhdGUgdGhlIHNlcGFyYXRvcnNcclxuICAgIGlmICggdGhpcy5zZXBhcmF0b3JMYXllciApIHtcclxuXHJcbiAgICAgIC8vIFdlIGRvIG5vdCBuZWVkIHRvIHJlbW92ZSB0aGlzIGxpc3RlbmVyIGJlY2F1c2UgaXQgaXMgaW50ZXJuYWwgdG8gQ2Fyb3VzZWwgYW5kIHdpbGwgZ2V0IGdhcmJhZ2UgY29sbGVjdGVkXHJcbiAgICAgIC8vIHdoZW4gQ2Fyb3VzZWwgaXMgZGlzcG9zZWQuXHJcbiAgICAgIHRoaXMuc2Nyb2xsaW5nTm9kZS5jb25zdHJhaW50LmZpbmlzaGVkTGF5b3V0RW1pdHRlci5hZGRMaXN0ZW5lciggKCkgPT4ge1xyXG4gICAgICAgIHRoaXMudXBkYXRlU2VwYXJhdG9ycygpO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy51cGRhdGVMYXlvdXQoKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgdXBkYXRlU2VwYXJhdG9ycygpOiB2b2lkIHtcclxuICAgIGNvbnN0IHZpc2libGVDaGlsZHJlbiA9IHRoaXMuY2Fyb3VzZWwuZ2V0VmlzaWJsZUFsaWduQm94ZXMoKTtcclxuXHJcbiAgICAvLyBBZGQgc2VwYXJhdG9ycyBiZXR3ZWVuIHRoZSB2aXNpYmxlIGNoaWxkcmVuXHJcbiAgICBjb25zdCByYW5nZSA9IHZpc2libGVDaGlsZHJlbi5sZW5ndGggPj0gMiA/IF8ucmFuZ2UoIDEsIHZpc2libGVDaGlsZHJlbi5sZW5ndGggKSA6IFtdO1xyXG4gICAgdGhpcy5zZXBhcmF0b3JMYXllciEuY2hpbGRyZW4gPSByYW5nZS5tYXAoIGluZGV4ID0+IHtcclxuXHJcbiAgICAgIC8vIEZpbmQgdGhlIGxvY2F0aW9uIGJldHdlZW4gYWRqYWNlbnQgbm9kZXNcclxuICAgICAgY29uc3QgaW5iZXR3ZWVuID0gKCB2aXNpYmxlQ2hpbGRyZW5bIGluZGV4IC0gMSBdWyB0aGlzLm9yaWVudGF0aW9uLm1heFNpZGUgXSArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmlzaWJsZUNoaWxkcmVuWyBpbmRleCBdWyB0aGlzLm9yaWVudGF0aW9uLm1pblNpZGUgXSApIC8gMjtcclxuXHJcbiAgICAgIHJldHVybiBuZXcgU2VwYXJhdG9yKCBjb21iaW5lT3B0aW9uczxTZXBhcmF0b3JPcHRpb25zPigge1xyXG4gICAgICAgIFsgYCR7dGhpcy5vcmllbnRhdGlvbi5jb29yZGluYXRlfTFgIF06IGluYmV0d2VlbixcclxuICAgICAgICBbIGAke3RoaXMub3JpZW50YXRpb24uY29vcmRpbmF0ZX0yYCBdOiBpbmJldHdlZW4sXHJcbiAgICAgICAgWyBgJHt0aGlzLm9yaWVudGF0aW9uLm9wcG9zaXRlLmNvb3JkaW5hdGV9MmAgXTogdGhpcy5zY3JvbGxpbmdOb2RlWyB0aGlzLm9yaWVudGF0aW9uLm9wcG9zaXRlLnNpemUgXVxyXG4gICAgICB9LCB0aGlzLnNlcGFyYXRvck9wdGlvbnMgKSApO1xyXG4gICAgfSApO1xyXG4gIH1cclxuXHJcbiAgLy8gUmV0dXJucyB0aGUgY2xpcCBhcmVhIGRpbWVuc2lvbiBmb3Igb3VyIENhcm91c2VsIGJhc2VkIG9mZiBvZiBob3cgbWFueSBpdGVtcyB3ZSB3YW50IHRvIHNlZSBwZXIgQ2Fyb3VzZWwgcGFnZS5cclxuICBwcml2YXRlIGNvbXB1dGVDbGlwQXJlYSgpOiBEaW1lbnNpb24yIHtcclxuICAgIGNvbnN0IG9yaWVudGF0aW9uID0gdGhpcy5vcmllbnRhdGlvbjtcclxuXHJcbiAgICBjb25zdCB2aXNpYmxlQWxpZ25Cb3hlcyA9IHRoaXMuY2Fyb3VzZWwuZ2V0VmlzaWJsZUFsaWduQm94ZXMoKTtcclxuXHJcbiAgICBpZiAoIHZpc2libGVBbGlnbkJveGVzLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgcmV0dXJuIG5ldyBEaW1lbnNpb24yKCAwLCAwICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuXHJcbiAgICAgIC8vIFRoaXMgZG9lc24ndCBmaWxsIG9uZSBwYWdlIGluIG51bWJlciBwbGF5IHByZWZlcmVuY2VzIGRpYWxvZyB3aGVuIHlvdSBmb3JnZXQgbG9jYWxlcz0qLFxyXG4gICAgICAvLyBzbyB0YWtlIHRoZSBsYXN0IGl0ZW0sIGV2ZW4gaWYgaXQgaXMgbm90IGEgZnVsbCBwYWdlXHJcbiAgICAgIGNvbnN0IGxhc3RCb3ggPSB2aXNpYmxlQWxpZ25Cb3hlc1sgdGhpcy5pdGVtc1BlclBhZ2UgLSAxIF0gfHwgdmlzaWJsZUFsaWduQm94ZXNbIHZpc2libGVBbGlnbkJveGVzLmxlbmd0aCAtIDEgXTtcclxuXHJcbiAgICAgIGNvbnN0IGhvcml6b250YWxTaXplID0gbmV3IERpbWVuc2lvbjIoXHJcbiAgICAgICAgLy8gTWVhc3VyZSBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGZpcnN0IGl0ZW0gdG8gdGhlIGVuZCBvZiB0aGUgbGFzdCBpdGVtIG9uIHRoZSAxc3QgcGFnZVxyXG4gICAgICAgIGxhc3RCb3hbIG9yaWVudGF0aW9uLm1heFNpZGUgXSAtIHZpc2libGVBbGlnbkJveGVzWyAwIF1bIG9yaWVudGF0aW9uLm1pblNpZGUgXSArICggMiAqIHRoaXMubWFyZ2luICksXHJcblxyXG4gICAgICAgIHRoaXMuc2Nyb2xsaW5nTm9kZUNvbnRhaW5lci5ib3VuZHNQcm9wZXJ0eS52YWx1ZVsgb3JpZW50YXRpb24ub3Bwb3NpdGUuc2l6ZSBdXHJcbiAgICAgICk7XHJcbiAgICAgIHJldHVybiB0aGlzLm9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5IT1JJWk9OVEFMID8gaG9yaXpvbnRhbFNpemUgOiBob3Jpem9udGFsU2l6ZS5zd2FwcGVkKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGdldEJhY2tncm91bmREaW1lbnNpb24oKTogRGltZW5zaW9uMiB7XHJcbiAgICBsZXQgYmFja2dyb3VuZFdpZHRoO1xyXG4gICAgbGV0IGJhY2tncm91bmRIZWlnaHQ7XHJcbiAgICBpZiAoIHRoaXMub3JpZW50YXRpb24gPT09IE9yaWVudGF0aW9uLkhPUklaT05UQUwgKSB7XHJcblxyXG4gICAgICAvLyBGb3IgaG9yaXpvbnRhbCBvcmllbnRhdGlvbiwgYnV0dG9ucyBjb250cmlidXRlIHRvIHdpZHRoLCBpZiB0aGV5IGFyZSB2aXNpYmxlLlxyXG4gICAgICBjb25zdCBuZXh0QnV0dG9uV2lkdGggPSB0aGlzLm5leHRCdXR0b24udmlzaWJsZSA/IHRoaXMubmV4dEJ1dHRvbi53aWR0aCA6IDA7XHJcbiAgICAgIGNvbnN0IHByZXZpb3VzQnV0dG9uV2lkdGggPSB0aGlzLnByZXZpb3VzQnV0dG9uLnZpc2libGUgPyB0aGlzLnByZXZpb3VzQnV0dG9uLndpZHRoIDogMDtcclxuICAgICAgYmFja2dyb3VuZFdpZHRoID0gdGhpcy53aW5kb3dOb2RlLndpZHRoICsgbmV4dEJ1dHRvbldpZHRoICsgcHJldmlvdXNCdXR0b25XaWR0aDtcclxuICAgICAgYmFja2dyb3VuZEhlaWdodCA9IHRoaXMud2luZG93Tm9kZS5oZWlnaHQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuXHJcbiAgICAgIC8vIEZvciB2ZXJ0aWNhbCBvcmllbnRhdGlvbiwgYnV0dG9ucyBjb250cmlidXRlIHRvIGhlaWdodCwgaWYgdGhleSBhcmUgdmlzaWJsZS5cclxuICAgICAgY29uc3QgbmV4dEJ1dHRvbkhlaWdodCA9IHRoaXMubmV4dEJ1dHRvbi52aXNpYmxlID8gdGhpcy5uZXh0QnV0dG9uLmhlaWdodCA6IDA7XHJcbiAgICAgIGNvbnN0IHByZXZpb3VzQnV0dG9uSGVpZ2h0ID0gdGhpcy5wcmV2aW91c0J1dHRvbi52aXNpYmxlID8gdGhpcy5wcmV2aW91c0J1dHRvbi5oZWlnaHQgOiAwO1xyXG4gICAgICBiYWNrZ3JvdW5kV2lkdGggPSB0aGlzLndpbmRvd05vZGUud2lkdGg7XHJcbiAgICAgIGJhY2tncm91bmRIZWlnaHQgPSB0aGlzLndpbmRvd05vZGUuaGVpZ2h0ICsgbmV4dEJ1dHRvbkhlaWdodCArIHByZXZpb3VzQnV0dG9uSGVpZ2h0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBEaW1lbnNpb24yKCBiYWNrZ3JvdW5kV2lkdGgsIGJhY2tncm91bmRIZWlnaHQgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSBsYXlvdXQoKTogdm9pZCB7XHJcbiAgICBzdXBlci5sYXlvdXQoKTtcclxuXHJcbiAgICBjb25zdCBvcmllbnRhdGlvbiA9IHRoaXMub3JpZW50YXRpb247XHJcblxyXG4gICAgLy8gUmVzaXplIG5leHQvcHJldmlvdXMgYnV0dG9ucyBkeW5hbWljYWxseVxyXG4gICAgY29uc3QgbWF4T3Bwb3NpdGVTaXplID0gdGhpcy5hbGlnbkdyb3VwLmdldE1heFNpemVQcm9wZXJ0eSggb3JpZW50YXRpb24ub3Bwb3NpdGUgKS52YWx1ZTtcclxuICAgIGNvbnN0IGJ1dHRvbk9wcG9zaXRlU2l6ZSA9IG1heE9wcG9zaXRlU2l6ZSArICggMiAqIHRoaXMubWFyZ2luICk7XHJcbiAgICB0aGlzLm5leHRCdXR0b25bIG9yaWVudGF0aW9uLm9wcG9zaXRlLnByZWZlcnJlZFNpemUgXSA9IGJ1dHRvbk9wcG9zaXRlU2l6ZTtcclxuICAgIHRoaXMucHJldmlvdXNCdXR0b25bIG9yaWVudGF0aW9uLm9wcG9zaXRlLnByZWZlcnJlZFNpemUgXSA9IGJ1dHRvbk9wcG9zaXRlU2l6ZTtcclxuXHJcbiAgICB0aGlzLm5leHRCdXR0b25bIG9yaWVudGF0aW9uLm9wcG9zaXRlLmNlbnRlckNvb3JkaW5hdGUgXSA9IHRoaXMuYmFja2dyb3VuZE5vZGVbIG9yaWVudGF0aW9uLm9wcG9zaXRlLmNlbnRlckNvb3JkaW5hdGUgXTtcclxuICAgIHRoaXMucHJldmlvdXNCdXR0b25bIG9yaWVudGF0aW9uLm9wcG9zaXRlLmNlbnRlckNvb3JkaW5hdGUgXSA9IHRoaXMuYmFja2dyb3VuZE5vZGVbIG9yaWVudGF0aW9uLm9wcG9zaXRlLmNlbnRlckNvb3JkaW5hdGUgXTtcclxuICAgIHRoaXMud2luZG93Tm9kZVsgb3JpZW50YXRpb24ub3Bwb3NpdGUuY2VudGVyQ29vcmRpbmF0ZSBdID0gdGhpcy5iYWNrZ3JvdW5kTm9kZVsgb3JpZW50YXRpb24ub3Bwb3NpdGUuY2VudGVyQ29vcmRpbmF0ZSBdO1xyXG4gICAgdGhpcy5wcmV2aW91c0J1dHRvblsgb3JpZW50YXRpb24ubWluU2lkZSBdID0gdGhpcy5iYWNrZ3JvdW5kTm9kZVsgb3JpZW50YXRpb24ubWluU2lkZSBdO1xyXG4gICAgdGhpcy5uZXh0QnV0dG9uWyBvcmllbnRhdGlvbi5tYXhTaWRlIF0gPSB0aGlzLmJhY2tncm91bmROb2RlWyBvcmllbnRhdGlvbi5tYXhTaWRlIF07XHJcbiAgICB0aGlzLndpbmRvd05vZGVbIG9yaWVudGF0aW9uLmNlbnRlckNvb3JkaW5hdGUgXSA9IHRoaXMuYmFja2dyb3VuZE5vZGVbIG9yaWVudGF0aW9uLmNlbnRlckNvb3JkaW5hdGUgXTtcclxuXHJcbiAgICBjb25zdCBjbGlwQm91bmRzID0gdGhpcy5jb21wdXRlQ2xpcEFyZWEoKS50b0JvdW5kcygpO1xyXG4gICAgdGhpcy53aW5kb3dOb2RlLmNsaXBBcmVhID0gU2hhcGUuYm91bmRzKCBjbGlwQm91bmRzICk7XHJcblxyXG4gICAgLy8gU3BlY2lmeSB0aGUgbG9jYWwgYm91bmRzIGluIG9yZGVyIHRvIGVuc3VyZSBjZW50ZXJpbmcuIEZvciBmdWxsIHBhZ2VzLCB0aGlzIGlzIG5vdCBuZWNlc3Nhcnkgc2luY2UgdGhlIHNjcm9sbGluZ05vZGVDb250YWluZXJcclxuICAgIC8vIGFscmVhZHkgc3BhbnMgdGhlIGZ1bGwgYXJlYS4gQnV0IGZvciBhIHBhcnRpYWwgcGFnZSwgdGhpcyBpcyBuZWNlc3Nhcnkgc28gdGhlIHdpbmRvdyB3aWxsIGJlIGNlbnRlcmVkLlxyXG4gICAgdGhpcy53aW5kb3dOb2RlLmxvY2FsQm91bmRzID0gY2xpcEJvdW5kcztcclxuXHJcbiAgICBjb25zdCBiYWNrZ3JvdW5kRGltZW5zaW9uID0gdGhpcy5nZXRCYWNrZ3JvdW5kRGltZW5zaW9uKCk7XHJcblxyXG4gICAgdGhpcy5jYXJvdXNlbC5iYWNrZ3JvdW5kV2lkdGggPSBiYWNrZ3JvdW5kRGltZW5zaW9uLndpZHRoO1xyXG4gICAgdGhpcy5jYXJvdXNlbC5iYWNrZ3JvdW5kSGVpZ2h0ID0gYmFja2dyb3VuZERpbWVuc2lvbi5oZWlnaHQ7XHJcblxyXG4gICAgY29uc3QgYmFja2dyb3VuZEJvdW5kcyA9IGJhY2tncm91bmREaW1lbnNpb24udG9Cb3VuZHMoKTtcclxuICAgIHRoaXMuYmFja2dyb3VuZE5vZGUucmVjdEJvdW5kcyA9IGJhY2tncm91bmRCb3VuZHM7XHJcbiAgICB0aGlzLmZvcmVncm91bmROb2RlLnJlY3RCb3VuZHMgPSBiYWNrZ3JvdW5kQm91bmRzO1xyXG5cclxuICAgIC8vIE9ubHkgdXBkYXRlIHNlcGFyYXRvcnMgaWYgdGhleSBhcmUgdmlzaWJsZVxyXG4gICAgdGhpcy5zZXBhcmF0b3JMYXllciAmJiB0aGlzLnVwZGF0ZVNlcGFyYXRvcnMoKTtcclxuICB9XHJcbn1cclxuXHJcbnN1bi5yZWdpc3RlciggJ0Nhcm91c2VsJywgQ2Fyb3VzZWwgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxjQUFjLE1BQU0saUNBQWlDO0FBRzVELE9BQU9DLFNBQVMsTUFBTSw0QkFBNEI7QUFDbEQsT0FBT0MsVUFBVSxNQUFNLDRCQUE0QjtBQUNuRCxPQUFPQyxLQUFLLE1BQU0sdUJBQXVCO0FBQ3pDLFNBQVNDLEtBQUssUUFBUSwwQkFBMEI7QUFDaEQsT0FBT0MsZ0JBQWdCLE1BQU0sc0RBQXNEO0FBQ25GLE9BQU9DLFNBQVMsSUFBSUMsY0FBYyxRQUFRLGlDQUFpQztBQUMzRSxTQUFvQ0MsVUFBVSxFQUFFQyxPQUFPLEVBQWtCQyxhQUFhLEVBQXVCQyxnQkFBZ0IsRUFBcUJDLElBQUksRUFBZUMsU0FBUyxFQUFFQyxTQUFTLFFBQWtDLDZCQUE2QjtBQUN4UCxPQUFPQyxxQkFBcUIsTUFBTSw4REFBOEQ7QUFDaEcsT0FBT0MsTUFBTSxNQUFNLDJCQUEyQjtBQUM5QyxPQUFPQyxTQUFTLE1BQTRCLDZCQUE2QjtBQUN6RSxPQUFPQyxNQUFNLE1BQU0sMEJBQTBCO0FBQzdDLE9BQU9DLGNBQWMsTUFBaUMsNkJBQTZCO0FBQ25GLE9BQU9DLGNBQWMsTUFBTSxxQkFBcUI7QUFDaEQsT0FBT0MsR0FBRyxNQUFNLFVBQVU7QUFFMUIsT0FBT0MsZUFBZSxNQUFrQyxrQ0FBa0M7QUFDMUYsU0FBMkJDLGlCQUFpQixRQUFRLHVCQUF1QjtBQUMzRSxPQUFPQyxXQUFXLE1BQU0sbUNBQW1DO0FBQzNELE9BQU9DLFNBQVMsTUFBTSw0QkFBNEI7QUFDbEQsT0FBT0MsT0FBTyxNQUFNLHlCQUF5QjtBQUU3QyxPQUFPQyw0QkFBNEIsTUFBTSxpREFBaUQ7QUFDMUYsT0FBT0MsZUFBZSxNQUFNLGtDQUFrQztBQUU5RCxNQUFNQyxrQkFBa0IsR0FBRyxJQUFJM0IsVUFBVSxDQUFFLEVBQUUsRUFBRSxDQUFFLENBQUM7QUF3Q2xELGVBQWUsTUFBTTRCLFFBQVEsU0FBU2xCLElBQUksQ0FBQztFQUV6Qzs7RUFHQTs7RUFHQTs7RUFHQTs7RUFNQTs7RUFHQTs7RUFHQTs7RUFHQTs7RUFRZ0JtQixtQkFBbUIsR0FBRyxJQUFJSCxlQUFlLENBQUUsS0FBTSxDQUFDOztFQUVsRTtBQUNGO0FBQ0E7RUFDU0ksV0FBV0EsQ0FBRUMsS0FBcUIsRUFBRUMsZUFBaUMsRUFBRztJQUU3RTtJQUNBLElBQUlDLGFBQWEsR0FBRyxLQUFLOztJQUV6QjtJQUNBLE1BQU1DLE9BQU8sR0FBRzlCLFNBQVMsQ0FBNEMsQ0FBQyxDQUFFO01BRXRFO01BQ0ErQixXQUFXLEVBQUUsWUFBWTtNQUN6QkMsSUFBSSxFQUFFLE9BQU87TUFDYkMsTUFBTSxFQUFFLE9BQU87TUFDZkMsU0FBUyxFQUFFLENBQUM7TUFDWkMsWUFBWSxFQUFFLENBQUM7TUFDZkMsaUJBQWlCLEVBQUUsQ0FBQztNQUVwQjtNQUNBQyxZQUFZLEVBQUUsQ0FBQztNQUNmQyxPQUFPLEVBQUUsRUFBRTtNQUNYQyxNQUFNLEVBQUUsQ0FBQztNQUVUQyxlQUFlLEVBQUU7UUFDZkMsVUFBVSxFQUFFckMsYUFBYTtRQUN6QnNDLFdBQVcsRUFBRSxJQUFJO1FBQ2pCQyxzQkFBc0IsRUFBRTtVQUN0QkMsY0FBYyxFQUFFO1FBQ2xCO01BQ0YsQ0FBQztNQUVEO01BQ0FDLGFBQWEsRUFBRTtRQUNiQyxPQUFPLEVBQUUsQ0FBQztRQUNWQyxPQUFPLEVBQUUsQ0FBQztRQUVWO1FBQ0FDLGtCQUFrQixFQUFFLENBQUM7UUFDckJDLGtCQUFrQixFQUFFLENBQUM7UUFDckJDLGtCQUFrQixFQUFFLENBQUM7UUFDckJDLGtCQUFrQixFQUFFLENBQUM7UUFFckJDLFNBQVMsRUFBRSw0QkFBNEI7UUFDdkNDLGFBQWEsRUFBRXZDLGNBQWMsQ0FBQ3dDLFVBQVU7UUFDeENwQixTQUFTLEVBQUUsQ0FBQztRQUVacUIsZ0JBQWdCLEVBQUU7VUFDaEJ0QixNQUFNLEVBQUUsT0FBTztVQUNmQyxTQUFTLEVBQUU7UUFDYixDQUFDO1FBQ0RzQixTQUFTLEVBQUVqQyxrQkFBa0I7UUFFN0JrQyxzQkFBc0IsRUFBRTtVQUN0QkMsY0FBYyxFQUFFLElBQUk7VUFDcEJkLGNBQWMsRUFBRTtRQUNsQixDQUFDO1FBRURlLFdBQVcsRUFBRWxEO01BQ2YsQ0FBQztNQUVEO01BQ0FtRCxpQkFBaUIsRUFBRSxLQUFLO01BQ3hCQyxnQkFBZ0IsRUFBRTtRQUNoQjVCLE1BQU0sRUFBRSxzQkFBc0I7UUFDOUJDLFNBQVMsRUFBRSxHQUFHO1FBQ2Q0QixRQUFRLEVBQUU7TUFDWixDQUFDO01BRUQ7TUFDQUMsZ0JBQWdCLEVBQUUsSUFBSTtNQUN0QkMsZ0JBQWdCLEVBQUU7UUFDaEJDLFFBQVEsRUFBRSxHQUFHO1FBQ2JDLFdBQVcsRUFBRXZFLFNBQVM7UUFDdEJ3RSxNQUFNLEVBQUV2RCxNQUFNLENBQUN3RDtNQUNqQixDQUFDO01BRUQ7TUFDQUMsTUFBTSxFQUFFM0QsTUFBTSxDQUFDNEQsUUFBUTtNQUN2QjNCLHNCQUFzQixFQUFFO1FBQ3RCQyxjQUFjLEVBQUU7TUFDbEI7SUFDRixDQUFDLEVBQUVoQixlQUFnQixDQUFDO0lBRXBCLEtBQUssQ0FBQyxDQUFDO0lBRVAsSUFBSSxDQUFDbUMsZ0JBQWdCLEdBQUdqQyxPQUFPLENBQUNpQyxnQkFBZ0I7SUFDaEQsSUFBSSxDQUFDcEMsS0FBSyxHQUFHQSxLQUFLO0lBQ2xCLElBQUksQ0FBQ1UsWUFBWSxHQUFHUCxPQUFPLENBQUNPLFlBQVk7SUFDeEMsSUFBSSxDQUFDRCxpQkFBaUIsR0FBR04sT0FBTyxDQUFDTSxpQkFBaUI7SUFFbEQsTUFBTUwsV0FBVyxHQUFHYixXQUFXLENBQUNxRCxxQkFBcUIsQ0FBRXpDLE9BQU8sQ0FBQ0MsV0FBWSxDQUFDO0lBQzVFLE1BQU15QyxVQUFVLEdBQUcsSUFBSXRFLFVBQVUsQ0FBQyxDQUFDO0lBRW5DLE1BQU11RSxXQUFXLEdBQUczQyxPQUFPLENBQUN1QyxNQUFNLENBQUNLLFlBQVksQ0FBRSxPQUFRLENBQUM7SUFDMUQsSUFBSSxDQUFDQyxpQkFBaUIsR0FBRzFELGlCQUFpQixDQUFFVSxLQUFLLEVBQUU4QyxXQUFZLENBQUM7O0lBRWhFO0lBQ0EsSUFBSSxDQUFDRyxVQUFVLEdBQUdqRCxLQUFLLENBQUNrRCxHQUFHLENBQUUsQ0FBRUMsSUFBSSxFQUFFQyxLQUFLLEtBQU07TUFDOUMsT0FBT1AsVUFBVSxDQUFDUSxTQUFTLENBQUUsSUFBSSxDQUFDTCxpQkFBaUIsQ0FBRUksS0FBSyxDQUFFLEVBQUU5RSxjQUFjLENBQW1CO1FBQzNGb0UsTUFBTSxFQUFFUyxJQUFJLENBQUNHLFVBQVUsR0FBR1IsV0FBVyxDQUFDQyxZQUFZLENBQUVJLElBQUksQ0FBQ0csVUFBVyxDQUFDLEdBQUd2RSxNQUFNLENBQUM0RDtNQUNqRixDQUFDLEVBQUV4QyxPQUFPLENBQUNVLGVBQWU7TUFFMUI7TUFDQXNDLElBQUksQ0FBQ3RDLGVBQWdCLENBQUUsQ0FBQztJQUM1QixDQUFFLENBQUM7O0lBRUg7SUFDQTtJQUNBO0lBQ0E7SUFDQSxJQUFJLENBQUMwQyxhQUFhLEdBQUcsSUFBSUMsZ0JBQWdCLENBQUUsSUFBSSxFQUFFO01BQy9DQyxRQUFRLEVBQUUsSUFBSSxDQUFDUixVQUFVO01BQ3pCN0MsV0FBVyxFQUFFRCxPQUFPLENBQUNDLFdBQVc7TUFDaENPLE9BQU8sRUFBRVIsT0FBTyxDQUFDUSxPQUFPO01BQ3hCLENBQUcsR0FBRVAsV0FBVyxDQUFDc0QsUUFBUSxDQUFDQyxVQUFXLFFBQU8sR0FBSXhELE9BQU8sQ0FBQ1M7SUFDMUQsQ0FBRSxDQUFDOztJQUVIO0lBQ0EsSUFBSSxDQUFDZ0QseUJBQXlCLEdBQUd2RSxlQUFlLENBQUN3RSxTQUFTLENBQUUsSUFBSSxDQUFDWixVQUFVLENBQUNDLEdBQUcsQ0FBRVksUUFBUSxJQUFJQSxRQUFRLENBQUNDLGVBQWdCLENBQUMsRUFBRSxNQUFNO01BQzdILE9BQU8sSUFBSSxDQUFDQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQ3BDLENBQUUsQ0FBQzs7SUFFSDtJQUNBLElBQUksQ0FBQ1QsYUFBYSxDQUFDVSx3QkFBd0IsQ0FBQ0MsV0FBVyxDQUFFLE1BQU0sSUFBSSxDQUFDTix5QkFBeUIsQ0FBQ08sbUJBQW1CLENBQUMsQ0FBRSxDQUFDOztJQUVySDtJQUNBLE1BQU1qRCxhQUFhLEdBQUc1QyxjQUFjLENBQXlCO01BQzNEa0MsWUFBWSxFQUFFTCxPQUFPLENBQUNLO0lBQ3hCLENBQUMsRUFBRUwsT0FBTyxDQUFDZSxhQUFjLENBQUM7SUFFMUJrRCxNQUFNLElBQUlBLE1BQU0sQ0FBRWpFLE9BQU8sQ0FBQ1EsT0FBTyxJQUFJUixPQUFPLENBQUNTLE1BQU0sRUFBRSxxREFBcUQsR0FDckQsbUNBQW9DLENBQUM7O0lBRTFGO0lBQ0E7SUFDQTtJQUNBLE1BQU15RCxjQUFjLEdBQUdsRSxPQUFPLENBQUM4QixpQkFBaUIsR0FBRyxJQUFJdEQsSUFBSSxDQUFFO01BQzNEd0QsUUFBUSxFQUFFO0lBQ1osQ0FBRSxDQUFDLEdBQUcsSUFBSTs7SUFFVjtJQUNBLE1BQU1tQyxzQkFBc0IsR0FBRyxJQUFJM0YsSUFBSSxDQUFFO01BQ3ZDOEUsUUFBUSxFQUFFdEQsT0FBTyxDQUFDOEIsaUJBQWlCLEdBQUcsQ0FBRW9DLGNBQWMsRUFBRyxJQUFJLENBQUNkLGFBQWEsQ0FBRSxHQUFHLENBQUUsSUFBSSxDQUFDQSxhQUFhO0lBQ3RHLENBQUUsQ0FBQzs7SUFFSDtJQUNBLE1BQU1nQixVQUFVLEdBQUt2RSxLQUFpQixJQUFNd0UsSUFBSSxDQUFDQyxHQUFHLENBQUVELElBQUksQ0FBQ0UsSUFBSSxDQUFFMUUsS0FBSyxDQUFDMkUsTUFBTSxHQUFHeEUsT0FBTyxDQUFDTyxZQUFhLENBQUMsRUFBRSxDQUFFLENBQUM7O0lBRTNHO0lBQ0EsSUFBSSxDQUFDa0UscUJBQXFCLEdBQUcsSUFBSXZGLGVBQWUsQ0FBRSxDQUFFLElBQUksQ0FBQ3VFLHlCQUF5QixDQUFFLEVBQUVpQixpQkFBaUIsSUFBSTtNQUN6RyxPQUFPTixVQUFVLENBQUVNLGlCQUFrQixDQUFDO0lBQ3hDLENBQUMsRUFBRTtNQUNEQyxZQUFZLEVBQUVDLENBQUMsSUFBSUEsQ0FBQyxHQUFHO0lBQ3pCLENBQUUsQ0FBQztJQUVILE1BQU1DLFFBQVEsR0FBR1QsVUFBVSxDQUFFLElBQUksQ0FBQ3RCLFVBQVcsQ0FBQztJQUU5Q21CLE1BQU0sSUFBSUEsTUFBTSxDQUFFakUsT0FBTyxDQUFDTSxpQkFBaUIsSUFBSSxDQUFDLElBQUlOLE9BQU8sQ0FBQ00saUJBQWlCLElBQUksSUFBSSxDQUFDbUUscUJBQXFCLENBQUNLLEtBQUssR0FBRyxDQUFDLEVBQ2xILHNDQUFxQzlFLE9BQU8sQ0FBQ00saUJBQWtCLEVBQUUsQ0FBQzs7SUFFckU7SUFDQSxJQUFJLENBQUN5RSxrQkFBa0IsR0FBRyxJQUFJbkgsY0FBYyxDQUFFb0MsT0FBTyxDQUFDTSxpQkFBaUIsRUFBRTtNQUN2RWlDLE1BQU0sRUFBRXZDLE9BQU8sQ0FBQ3VDLE1BQU0sQ0FBQ0ssWUFBWSxDQUFFLG9CQUFxQixDQUFDO01BQzNEb0MsVUFBVSxFQUFFLFNBQVM7TUFDckJMLFlBQVksRUFBSUcsS0FBYSxJQUFNQSxLQUFLLEdBQUcsSUFBSSxDQUFDTCxxQkFBcUIsQ0FBQ0ssS0FBSyxJQUFJQSxLQUFLLElBQUksQ0FBQztNQUV6RjtNQUNBRyxLQUFLLEVBQUUsSUFBSWxILEtBQUssQ0FBRSxDQUFDLEVBQUU4RyxRQUFRLEdBQUcsQ0FBRSxDQUFDO01BQ25DL0QsY0FBYyxFQUFFO0lBQ2xCLENBQUUsQ0FBQztJQUVILE1BQU1vRSxzQkFBc0IsR0FBRyxJQUFJaEcsZUFBZSxDQUFFLENBQUUsSUFBSSxDQUFDdUYscUJBQXFCLENBQUUsRUFBRVUsYUFBYSxJQUFJO01BQ25HO01BQ0EsT0FBT0EsYUFBYSxHQUFHLENBQUM7SUFDMUIsQ0FBRSxDQUFDOztJQUVIO0lBQ0EsTUFBTUMsVUFBVSxHQUFHLElBQUlyRyxjQUFjLENBQUVaLGNBQWMsQ0FBeUI7TUFDNUVrSCxjQUFjLEVBQUVwRixXQUFXLEtBQUtiLFdBQVcsQ0FBQ2tHLFVBQVUsR0FBRyxPQUFPLEdBQUcsTUFBTTtNQUN6RS9DLE1BQU0sRUFBRXZDLE9BQU8sQ0FBQ3VDLE1BQU0sQ0FBQ0ssWUFBWSxDQUFFLFlBQWEsQ0FBQztNQUNuRDJDLFFBQVEsRUFBRUEsQ0FBQSxLQUFNLElBQUksQ0FBQ1Isa0JBQWtCLENBQUNTLEdBQUcsQ0FBRSxJQUFJLENBQUNULGtCQUFrQixDQUFDVSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUUsQ0FBQztNQUNoRkMsZUFBZSxFQUFFLElBQUl4RyxlQUFlLENBQUUsQ0FBRSxJQUFJLENBQUM2RixrQkFBa0IsRUFBRSxJQUFJLENBQUNOLHFCQUFxQixDQUFFLEVBQUUsQ0FBRWtCLFVBQVUsRUFBRUMsYUFBYSxLQUFNO1FBQzlILE9BQU9ELFVBQVUsR0FBR0MsYUFBYSxHQUFHLENBQUM7TUFDdkMsQ0FBRSxDQUFDO01BQ0hoQyxlQUFlLEVBQUVzQjtJQUNuQixDQUFDLEVBQUVuRSxhQUFjLENBQUUsQ0FBQzs7SUFFcEI7SUFDQSxNQUFNOEUsY0FBYyxHQUFHLElBQUk5RyxjQUFjLENBQUVaLGNBQWMsQ0FBeUI7TUFDaEZrSCxjQUFjLEVBQUVwRixXQUFXLEtBQUtiLFdBQVcsQ0FBQ2tHLFVBQVUsR0FBRyxNQUFNLEdBQUcsSUFBSTtNQUN0RS9DLE1BQU0sRUFBRXZDLE9BQU8sQ0FBQ3VDLE1BQU0sQ0FBQ0ssWUFBWSxDQUFFLGdCQUFpQixDQUFDO01BQ3ZEMkMsUUFBUSxFQUFFQSxDQUFBLEtBQU0sSUFBSSxDQUFDUixrQkFBa0IsQ0FBQ1MsR0FBRyxDQUFFLElBQUksQ0FBQ1Qsa0JBQWtCLENBQUNVLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBRSxDQUFDO01BQ2hGQyxlQUFlLEVBQUUsSUFBSXhHLGVBQWUsQ0FBRSxDQUFFLElBQUksQ0FBQzZGLGtCQUFrQixDQUFFLEVBQUVZLFVBQVUsSUFBSTtRQUMvRSxPQUFPQSxVQUFVLEdBQUcsQ0FBQztNQUN2QixDQUFFLENBQUM7TUFDSC9CLGVBQWUsRUFBRXNCO0lBQ25CLENBQUMsRUFBRW5FLGFBQWMsQ0FBRSxDQUFDOztJQUVwQjtJQUNBLE1BQU0rRSxVQUFVLEdBQUcsSUFBSXRILElBQUksQ0FBRTtNQUFFOEUsUUFBUSxFQUFFLENBQUVhLHNCQUFzQjtJQUFHLENBQUUsQ0FBQzs7SUFFdkU7SUFDQSxNQUFNNEIsY0FBYyxHQUFHLElBQUl0SCxTQUFTLENBQUU7TUFDcEM0QixZQUFZLEVBQUVMLE9BQU8sQ0FBQ0ssWUFBWTtNQUNsQ0gsSUFBSSxFQUFFRixPQUFPLENBQUNFO0lBQ2hCLENBQUUsQ0FBQzs7SUFFSDtJQUNBO0lBQ0EsTUFBTThGLGNBQWMsR0FBRyxJQUFJdkgsU0FBUyxDQUFFO01BQ3BDNEIsWUFBWSxFQUFFTCxPQUFPLENBQUNLLFlBQVk7TUFDbENGLE1BQU0sRUFBRUgsT0FBTyxDQUFDRyxNQUFNO01BQ3RCNkIsUUFBUSxFQUFFO0lBQ1osQ0FBRSxDQUFDOztJQUVIO0lBQ0EsSUFBSSxDQUFDaUUsa0JBQWtCLEdBQUcsSUFBSUMsa0JBQWtCLENBQzlDLElBQUksRUFDSkgsY0FBYyxFQUNkQyxjQUFjLEVBQ2RGLFVBQVUsRUFDVkQsY0FBYyxFQUNkVCxVQUFVLEVBQ1ZqQixzQkFBc0IsRUFDdEIsSUFBSSxDQUFDckIsVUFBVSxFQUNmN0MsV0FBVyxFQUNYLElBQUksQ0FBQ21ELGFBQWEsRUFDbEIsSUFBSSxDQUFDN0MsWUFBWSxFQUNqQlAsT0FBTyxDQUFDUyxNQUFNLEVBQ2RpQyxVQUFVLEVBQ1Z3QixjQUFjLEVBQ2RsRSxPQUFPLENBQUMrQixnQkFBaUIsQ0FBQzs7SUFFNUI7SUFDQSxJQUFJb0UsZUFBaUMsR0FBRyxJQUFJO0lBQzVDLE1BQU1DLGdCQUFnQixHQUFHLElBQUk5RyxPQUFPLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBRSxDQUFDLENBQUMsQ0FBQztJQUNwREQsU0FBUyxDQUFDZ0gsU0FBUyxDQUFFLENBQUUsSUFBSSxDQUFDdEIsa0JBQWtCLEVBQUVaLHNCQUFzQixDQUFDbUMsbUJBQW1CLENBQUUsRUFBRSxDQUFFWCxVQUFVLEVBQUVZLFlBQVksS0FBTTtNQUU1SDtNQUNBLElBQUtaLFVBQVUsSUFBSSxJQUFJLENBQUNsQixxQkFBcUIsQ0FBQ0ssS0FBSyxFQUFHO1FBQ3BEO01BQ0Y7O01BRUE7TUFDQXFCLGVBQWUsSUFBSUEsZUFBZSxDQUFDSyxJQUFJLENBQUMsQ0FBQzs7TUFFekM7TUFDQSxNQUFNQyxlQUFlLEdBQUcsSUFBSSxDQUFDaEQseUJBQXlCLENBQUNxQixLQUFLLENBQUVhLFVBQVUsR0FBRzNGLE9BQU8sQ0FBQ08sWUFBWSxDQUFFOztNQUVqRztNQUNBLE1BQU1tRyxXQUFXLEdBQUdELGVBQWUsR0FBTyxDQUFDQSxlQUFlLENBQUV4RyxXQUFXLENBQUMwRyxPQUFPLENBQUUsR0FBSzNHLE9BQU8sQ0FBQ1MsTUFBTSxHQUFLLENBQUM7TUFFMUcsTUFBTW1HLG1CQUFtQixHQUFHUixnQkFBZ0IsS0FBSyxJQUFJLElBQUksQ0FBQ0EsZ0JBQWdCLENBQUNTLE1BQU0sQ0FBRU4sWUFBYSxDQUFDO01BQ2pHSCxnQkFBZ0IsQ0FBQ1osR0FBRyxDQUFFZSxZQUFhLENBQUMsQ0FBQyxDQUFDOztNQUV0QztNQUNBO01BQ0E7TUFDQTtNQUNBLElBQUssSUFBSSxDQUFDdEUsZ0JBQWdCLElBQUksQ0FBQzFDLDRCQUE0QixFQUFFdUYsS0FBSyxJQUFJL0UsYUFBYSxJQUFJLENBQUM2RyxtQkFBbUIsRUFBRztRQUU1RztRQUNBVCxlQUFlLEdBQUcsSUFBSXRILFNBQVMsQ0FBRVYsY0FBYyxDQUE0QixDQUFDLENBQUMsRUFBRTZCLE9BQU8sQ0FBQ2tDLGdCQUFnQixFQUFFO1VBQ3ZHNEUsRUFBRSxFQUFFSixXQUFXO1VBRWY7VUFDQUssUUFBUSxFQUFFQSxDQUFBLEtBQU01QyxzQkFBc0IsQ0FBRWxFLFdBQVcsQ0FBQ3VELFVBQVUsQ0FBRTtVQUNoRXdELFFBQVEsRUFBSWxDLEtBQWEsSUFBTTtZQUFFWCxzQkFBc0IsQ0FBRWxFLFdBQVcsQ0FBQ3VELFVBQVUsQ0FBRSxHQUFHc0IsS0FBSztVQUFFO1FBRTdGLENBQUUsQ0FBRSxDQUFDO1FBQ0xxQixlQUFlLENBQUNjLFlBQVksQ0FBQ2xELFdBQVcsQ0FBRSxNQUFNLElBQUksQ0FBQ3BFLG1CQUFtQixDQUFDNkYsR0FBRyxDQUFFLEtBQU0sQ0FBRSxDQUFDO1FBQ3ZGVyxlQUFlLENBQUNlLEtBQUssQ0FBQyxDQUFDO1FBQ3ZCLElBQUksQ0FBQ3ZILG1CQUFtQixDQUFDbUYsS0FBSyxHQUFHLElBQUk7TUFDdkMsQ0FBQyxNQUNJO1FBRUg7UUFDQVgsc0JBQXNCLENBQUVsRSxXQUFXLENBQUN1RCxVQUFVLENBQUUsR0FBR2tELFdBQVc7TUFDaEU7SUFDRixDQUFFLENBQUM7O0lBRUg7SUFDQSxJQUFJLENBQUNqRCx5QkFBeUIsQ0FBQzBELElBQUksQ0FBRSxNQUFNO01BQ3pDO01BQ0EsSUFBSSxDQUFDcEMsa0JBQWtCLENBQUNELEtBQUssR0FBR1QsSUFBSSxDQUFDK0MsR0FBRyxDQUFFLElBQUksQ0FBQ3JDLGtCQUFrQixDQUFDRCxLQUFLLEVBQUUsSUFBSSxDQUFDTCxxQkFBcUIsQ0FBQ0ssS0FBSyxHQUFHLENBQUUsQ0FBQztJQUNqSCxDQUFFLENBQUM7SUFFSDlFLE9BQU8sQ0FBQ3NELFFBQVEsR0FBRyxDQUFFeUMsY0FBYyxFQUFFRCxVQUFVLEVBQUVWLFVBQVUsRUFBRVMsY0FBYyxFQUFFRyxjQUFjLENBQUU7SUFFN0YsSUFBSSxDQUFDcUIsZUFBZSxHQUFHLE1BQU07TUFDM0IsSUFBSSxDQUFDNUQseUJBQXlCLENBQUM2RCxPQUFPLENBQUMsQ0FBQztNQUN4QyxJQUFJLENBQUN2QyxrQkFBa0IsQ0FBQ3VDLE9BQU8sQ0FBQyxDQUFDO01BQ2pDLElBQUksQ0FBQ3hFLFVBQVUsQ0FBQ3lFLE9BQU8sQ0FBRTVELFFBQVEsSUFBSTtRQUVuQ00sTUFBTSxJQUFJQSxNQUFNLENBQUVOLFFBQVEsQ0FBQ0wsUUFBUSxDQUFDa0IsTUFBTSxLQUFLLENBQUMsRUFBRSx3REFBeUQsQ0FBQztRQUM1R1AsTUFBTSxJQUFJQSxNQUFNLENBQUUsSUFBSSxDQUFDcEIsaUJBQWlCLENBQUMyRSxRQUFRLENBQUU3RCxRQUFRLENBQUNMLFFBQVEsQ0FBRSxDQUFDLENBQUcsQ0FBQyxFQUFFLHdEQUF5RCxDQUFDO1FBRXZJSyxRQUFRLENBQUMyRCxPQUFPLENBQUMsQ0FBQztNQUNwQixDQUFFLENBQUM7TUFDSCxJQUFJLENBQUNsRSxhQUFhLENBQUNrRSxPQUFPLENBQUMsQ0FBQztNQUM1QixJQUFJLENBQUNyQixrQkFBa0IsQ0FBQ3FCLE9BQU8sQ0FBQyxDQUFDO01BQ2pDLElBQUksQ0FBQ3pFLGlCQUFpQixDQUFDMEUsT0FBTyxDQUFFRSxJQUFJLElBQUlBLElBQUksQ0FBQ0gsT0FBTyxDQUFDLENBQUUsQ0FBQztJQUMxRCxDQUFDO0lBRUQsSUFBSSxDQUFDSSxNQUFNLENBQUUxSCxPQUFRLENBQUM7O0lBRXRCO0lBQ0FELGFBQWEsR0FBRyxJQUFJOztJQUVwQjtJQUNBa0UsTUFBTSxJQUFJMEQsSUFBSSxFQUFFQyxPQUFPLEVBQUVDLGVBQWUsRUFBRUMsTUFBTSxJQUFJN0osZ0JBQWdCLENBQUM4SixlQUFlLENBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxJQUFLLENBQUM7RUFDakg7O0VBRUE7QUFDRjtBQUNBO0VBQ2tCVCxPQUFPQSxDQUFBLEVBQVM7SUFDOUIsSUFBSSxDQUFDRCxlQUFlLENBQUMsQ0FBQztJQUN0QixLQUFLLENBQUNDLE9BQU8sQ0FBQyxDQUFDO0VBQ2pCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0VBQ1NVLEtBQUtBLENBQUUvRixnQkFBZ0IsR0FBRyxLQUFLLEVBQVM7SUFDN0MsTUFBTWdHLG9CQUFvQixHQUFHLElBQUksQ0FBQ2hHLGdCQUFnQjtJQUNsRCxJQUFJLENBQUNBLGdCQUFnQixHQUFHQSxnQkFBZ0I7O0lBRXhDO0lBQ0EsSUFBSSxDQUFDOEMsa0JBQWtCLENBQUNELEtBQUssR0FBR1QsSUFBSSxDQUFDK0MsR0FBRyxDQUFFLElBQUksQ0FBQzlHLGlCQUFpQixFQUFFLElBQUksQ0FBQ21FLHFCQUFxQixDQUFDSyxLQUFLLEdBQUcsQ0FBRSxDQUFDO0lBRXhHLElBQUksQ0FBQzdDLGdCQUFnQixHQUFHZ0csb0JBQW9CO0VBQzlDOztFQUVBO0FBQ0Y7QUFDQTtFQUNVQyx3QkFBd0JBLENBQUVDLGdCQUF3QixFQUFTO0lBQ2pFLElBQUksQ0FBQ3BELGtCQUFrQixDQUFDUyxHQUFHLENBQUUsSUFBSSxDQUFDNEMsNEJBQTRCLENBQUVELGdCQUFpQixDQUFFLENBQUM7RUFDdEY7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7RUFDU0UsWUFBWUEsQ0FBRXJGLElBQWtCLEVBQVM7SUFDOUMsSUFBSSxDQUFDc0YsZ0JBQWdCLENBQUUsSUFBSSxDQUFDQyxrQkFBa0IsQ0FBRXZGLElBQUssQ0FBRSxDQUFDO0VBQzFEOztFQUVBO0FBQ0Y7QUFDQTtFQUNTc0YsZ0JBQWdCQSxDQUFFM0UsUUFBa0IsRUFBUztJQUdsRDtJQUNBLE1BQU02RSxhQUFhLEdBQUcsSUFBSSxDQUFDL0UseUJBQXlCLENBQUNxQixLQUFLLENBQUMyRCxPQUFPLENBQUU5RSxRQUFTLENBQUM7SUFFOUVNLE1BQU0sSUFBSUEsTUFBTSxDQUFFdUUsYUFBYSxJQUFJLENBQUMsRUFBRSw2QkFBOEIsQ0FBQztJQUNyRSxJQUFLQSxhQUFhLElBQUksQ0FBQyxFQUFHO01BQ3hCLElBQUksQ0FBQ04sd0JBQXdCLENBQUVNLGFBQWMsQ0FBQztJQUNoRDtFQUNGOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0VBQ1NFLGNBQWNBLENBQUUxRixJQUFrQixFQUFFMkYsT0FBZ0IsRUFBUztJQUNsRSxJQUFJLENBQUNKLGtCQUFrQixDQUFFdkYsSUFBSyxDQUFDLENBQUMyRixPQUFPLEdBQUdBLE9BQU87RUFDbkQ7O0VBRUE7QUFDRjtBQUNBO0VBQ1VKLGtCQUFrQkEsQ0FBRXZGLElBQWtCLEVBQWE7SUFDekQsTUFBTVcsUUFBUSxHQUFHLElBQUksQ0FBQ2IsVUFBVSxDQUFFLElBQUksQ0FBQ2pELEtBQUssQ0FBQzRJLE9BQU8sQ0FBRXpGLElBQUssQ0FBQyxDQUFFO0lBRTlEaUIsTUFBTSxJQUFJQSxNQUFNLENBQUVOLFFBQVEsRUFBRSwyQ0FBNEMsQ0FBQztJQUN6RSxPQUFPQSxRQUFRO0VBQ2pCOztFQUVBO0FBQ0Y7QUFDQTtFQUNTaUYsY0FBY0EsQ0FBRTVGLElBQWtCLEVBQVM7SUFDaEQsTUFBTXlFLElBQUksR0FBRyxJQUFJLENBQUM1RSxpQkFBaUIsQ0FBRSxJQUFJLENBQUNoRCxLQUFLLENBQUM0SSxPQUFPLENBQUV6RixJQUFLLENBQUMsQ0FBRTtJQUVqRWlCLE1BQU0sSUFBSUEsTUFBTSxDQUFFd0QsSUFBSSxFQUFFLHVDQUF3QyxDQUFDO0lBQ2pFLE9BQU9BLElBQUk7RUFDYjtFQUVRVyw0QkFBNEJBLENBQUVTLFNBQWlCLEVBQVc7SUFDaEU1RSxNQUFNLElBQUlBLE1BQU0sQ0FBRTRFLFNBQVMsSUFBSSxDQUFDLElBQUlBLFNBQVMsR0FBRyxJQUFJLENBQUNoSixLQUFLLENBQUMyRSxNQUFNLEVBQUcsMkJBQTBCcUUsU0FBVSxFQUFFLENBQUM7SUFDM0csT0FBT3hFLElBQUksQ0FBQ3lFLEtBQUssQ0FBRUQsU0FBUyxHQUFHLElBQUksQ0FBQ3RJLFlBQWEsQ0FBQztFQUNwRDs7RUFFQTtFQUNPc0Qsb0JBQW9CQSxDQUFBLEVBQWU7SUFDeEMsT0FBT2tGLENBQUMsQ0FBQ0MsTUFBTSxDQUFFLElBQUksQ0FBQ2xHLFVBQVUsQ0FBQ21HLE1BQU0sQ0FBRXRGLFFBQVEsSUFBSUEsUUFBUSxDQUFDZ0YsT0FBUSxDQUFDLEVBQUVoRixRQUFRLElBQUksSUFBSSxDQUFDUCxhQUFhLENBQUNFLFFBQVEsQ0FBQ21GLE9BQU8sQ0FBRTlFLFFBQVMsQ0FBRSxDQUFDO0VBQ3hJO0FBQ0Y7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNTixnQkFBZ0IsU0FBU2hGLE9BQU8sQ0FBZ0M7RUFHN0R1QixXQUFXQSxDQUFFc0osUUFBa0IsRUFBRWxKLE9BQXdCLEVBQUc7SUFDakUsS0FBSyxDQUFFQSxPQUFRLENBQUM7SUFDaEIsSUFBSSxDQUFDa0osUUFBUSxHQUFHQSxRQUFRO0VBQzFCO0VBRU9DLHlCQUF5QkEsQ0FBRUMsS0FBVyxFQUFTO0lBQ3BELElBQUksQ0FBQ0YsUUFBUSxDQUFDWixnQkFBZ0IsQ0FBRWMsS0FBa0IsQ0FBQztFQUNyRDtBQUNGO0FBR0EsTUFBTWxELGtCQUFrQixTQUFTM0gsZ0JBQWdCLENBQUM7RUFDekNxQixXQUFXQSxDQUNDc0osUUFBa0IsRUFDbEJuRCxjQUF5QixFQUN6QkMsY0FBeUIsRUFDekJGLFVBQWdCLEVBQ2hCRCxjQUEwQixFQUMxQlQsVUFBc0IsRUFDdEJqQixzQkFBNEIsRUFDNUJyQixVQUFrQixFQUNsQjdDLFdBQXdCLEVBQ3hCbUQsYUFBc0IsRUFDdEI3QyxZQUFvQixFQUNwQkUsTUFBYyxFQUNkaUMsVUFBc0IsRUFDdEJ3QixjQUEyQixFQUMzQm5DLGdCQUFrQyxFQUFHO0lBQ3RELEtBQUssQ0FBRW1ILFFBQVMsQ0FBQzs7SUFFakI7SUFBQSxLQWpCaUJBLFFBQWtCLEdBQWxCQSxRQUFrQjtJQUFBLEtBQ2xCbkQsY0FBeUIsR0FBekJBLGNBQXlCO0lBQUEsS0FDekJDLGNBQXlCLEdBQXpCQSxjQUF5QjtJQUFBLEtBQ3pCRixVQUFnQixHQUFoQkEsVUFBZ0I7SUFBQSxLQUNoQkQsY0FBMEIsR0FBMUJBLGNBQTBCO0lBQUEsS0FDMUJULFVBQXNCLEdBQXRCQSxVQUFzQjtJQUFBLEtBQ3RCakIsc0JBQTRCLEdBQTVCQSxzQkFBNEI7SUFBQSxLQUM1QnJCLFVBQWtCLEdBQWxCQSxVQUFrQjtJQUFBLEtBQ2xCN0MsV0FBd0IsR0FBeEJBLFdBQXdCO0lBQUEsS0FDeEJtRCxhQUFzQixHQUF0QkEsYUFBc0I7SUFBQSxLQUN0QjdDLFlBQW9CLEdBQXBCQSxZQUFvQjtJQUFBLEtBQ3BCRSxNQUFjLEdBQWRBLE1BQWM7SUFBQSxLQUNkaUMsVUFBc0IsR0FBdEJBLFVBQXNCO0lBQUEsS0FDdEJ3QixjQUEyQixHQUEzQkEsY0FBMkI7SUFBQSxLQUMzQm5DLGdCQUFrQyxHQUFsQ0EsZ0JBQWtDO0lBSW5ELENBQUUsSUFBSSxDQUFDZ0UsY0FBYyxFQUNuQixJQUFJLENBQUNDLGNBQWMsRUFDbkIsSUFBSSxDQUFDRixVQUFVLEVBQ2YsSUFBSSxDQUFDRCxjQUFjLEVBQ25CLElBQUksQ0FBQ1QsVUFBVSxFQUNmLElBQUksQ0FBQ2pCLHNCQUFzQixFQUMzQixHQUFHLElBQUksQ0FBQ3JCLFVBQVUsQ0FBRSxDQUFDeUUsT0FBTyxDQUFFRSxJQUFJLElBQUksSUFBSSxDQUFDNEIsT0FBTyxDQUFFNUIsSUFBSSxFQUFFLEtBQU0sQ0FBRSxDQUFDOztJQUVyRTtJQUNBLElBQUssSUFBSSxDQUFDdkQsY0FBYyxFQUFHO01BRXpCO01BQ0E7TUFDQSxJQUFJLENBQUNkLGFBQWEsQ0FBQ2tHLFVBQVUsQ0FBQ0MscUJBQXFCLENBQUN4RixXQUFXLENBQUUsTUFBTTtRQUNyRSxJQUFJLENBQUN5RixnQkFBZ0IsQ0FBQyxDQUFDO01BQ3pCLENBQUUsQ0FBQztJQUNMO0lBRUEsSUFBSSxDQUFDQyxZQUFZLENBQUMsQ0FBQztFQUNyQjtFQUVRRCxnQkFBZ0JBLENBQUEsRUFBUztJQUMvQixNQUFNRSxlQUFlLEdBQUcsSUFBSSxDQUFDUixRQUFRLENBQUNyRixvQkFBb0IsQ0FBQyxDQUFDOztJQUU1RDtJQUNBLE1BQU1vQixLQUFLLEdBQUd5RSxlQUFlLENBQUNsRixNQUFNLElBQUksQ0FBQyxHQUFHdUUsQ0FBQyxDQUFDOUQsS0FBSyxDQUFFLENBQUMsRUFBRXlFLGVBQWUsQ0FBQ2xGLE1BQU8sQ0FBQyxHQUFHLEVBQUU7SUFDckYsSUFBSSxDQUFDTixjQUFjLENBQUVaLFFBQVEsR0FBRzJCLEtBQUssQ0FBQ2xDLEdBQUcsQ0FBRUUsS0FBSyxJQUFJO01BRWxEO01BQ0EsTUFBTTBHLFNBQVMsR0FBRyxDQUFFRCxlQUFlLENBQUV6RyxLQUFLLEdBQUcsQ0FBQyxDQUFFLENBQUUsSUFBSSxDQUFDaEQsV0FBVyxDQUFDMkosT0FBTyxDQUFFLEdBQ3hERixlQUFlLENBQUV6RyxLQUFLLENBQUUsQ0FBRSxJQUFJLENBQUNoRCxXQUFXLENBQUMwRyxPQUFPLENBQUUsSUFBSyxDQUFDO01BRTlFLE9BQU8sSUFBSWpJLFNBQVMsQ0FBRVAsY0FBYyxDQUFvQjtRQUN0RCxDQUFHLEdBQUUsSUFBSSxDQUFDOEIsV0FBVyxDQUFDdUQsVUFBVyxHQUFFLEdBQUltRyxTQUFTO1FBQ2hELENBQUcsR0FBRSxJQUFJLENBQUMxSixXQUFXLENBQUN1RCxVQUFXLEdBQUUsR0FBSW1HLFNBQVM7UUFDaEQsQ0FBRyxHQUFFLElBQUksQ0FBQzFKLFdBQVcsQ0FBQ3NELFFBQVEsQ0FBQ0MsVUFBVyxHQUFFLEdBQUksSUFBSSxDQUFDSixhQUFhLENBQUUsSUFBSSxDQUFDbkQsV0FBVyxDQUFDc0QsUUFBUSxDQUFDc0csSUFBSTtNQUNwRyxDQUFDLEVBQUUsSUFBSSxDQUFDOUgsZ0JBQWlCLENBQUUsQ0FBQztJQUM5QixDQUFFLENBQUM7RUFDTDs7RUFFQTtFQUNRK0gsZUFBZUEsQ0FBQSxFQUFlO0lBQ3BDLE1BQU03SixXQUFXLEdBQUcsSUFBSSxDQUFDQSxXQUFXO0lBRXBDLE1BQU15RSxpQkFBaUIsR0FBRyxJQUFJLENBQUN3RSxRQUFRLENBQUNyRixvQkFBb0IsQ0FBQyxDQUFDO0lBRTlELElBQUthLGlCQUFpQixDQUFDRixNQUFNLEtBQUssQ0FBQyxFQUFHO01BQ3BDLE9BQU8sSUFBSTFHLFVBQVUsQ0FBRSxDQUFDLEVBQUUsQ0FBRSxDQUFDO0lBQy9CLENBQUMsTUFDSTtNQUVIO01BQ0E7TUFDQSxNQUFNaU0sT0FBTyxHQUFHckYsaUJBQWlCLENBQUUsSUFBSSxDQUFDbkUsWUFBWSxHQUFHLENBQUMsQ0FBRSxJQUFJbUUsaUJBQWlCLENBQUVBLGlCQUFpQixDQUFDRixNQUFNLEdBQUcsQ0FBQyxDQUFFO01BRS9HLE1BQU13RixjQUFjLEdBQUcsSUFBSWxNLFVBQVU7TUFDbkM7TUFDQWlNLE9BQU8sQ0FBRTlKLFdBQVcsQ0FBQzJKLE9BQU8sQ0FBRSxHQUFHbEYsaUJBQWlCLENBQUUsQ0FBQyxDQUFFLENBQUV6RSxXQUFXLENBQUMwRyxPQUFPLENBQUUsR0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDbEcsTUFBUSxFQUVwRyxJQUFJLENBQUMwRCxzQkFBc0IsQ0FBQzhGLGNBQWMsQ0FBQ25GLEtBQUssQ0FBRTdFLFdBQVcsQ0FBQ3NELFFBQVEsQ0FBQ3NHLElBQUksQ0FDN0UsQ0FBQztNQUNELE9BQU8sSUFBSSxDQUFDNUosV0FBVyxLQUFLYixXQUFXLENBQUNrRyxVQUFVLEdBQUcwRSxjQUFjLEdBQUdBLGNBQWMsQ0FBQ0UsT0FBTyxDQUFDLENBQUM7SUFDaEc7RUFDRjtFQUVRQyxzQkFBc0JBLENBQUEsRUFBZTtJQUMzQyxJQUFJQyxlQUFlO0lBQ25CLElBQUlDLGdCQUFnQjtJQUNwQixJQUFLLElBQUksQ0FBQ3BLLFdBQVcsS0FBS2IsV0FBVyxDQUFDa0csVUFBVSxFQUFHO01BRWpEO01BQ0EsTUFBTWdGLGVBQWUsR0FBRyxJQUFJLENBQUNsRixVQUFVLENBQUN1RCxPQUFPLEdBQUcsSUFBSSxDQUFDdkQsVUFBVSxDQUFDbUYsS0FBSyxHQUFHLENBQUM7TUFDM0UsTUFBTUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDM0UsY0FBYyxDQUFDOEMsT0FBTyxHQUFHLElBQUksQ0FBQzlDLGNBQWMsQ0FBQzBFLEtBQUssR0FBRyxDQUFDO01BQ3ZGSCxlQUFlLEdBQUcsSUFBSSxDQUFDdEUsVUFBVSxDQUFDeUUsS0FBSyxHQUFHRCxlQUFlLEdBQUdFLG1CQUFtQjtNQUMvRUgsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDdkUsVUFBVSxDQUFDMkUsTUFBTTtJQUMzQyxDQUFDLE1BQ0k7TUFFSDtNQUNBLE1BQU1DLGdCQUFnQixHQUFHLElBQUksQ0FBQ3RGLFVBQVUsQ0FBQ3VELE9BQU8sR0FBRyxJQUFJLENBQUN2RCxVQUFVLENBQUNxRixNQUFNLEdBQUcsQ0FBQztNQUM3RSxNQUFNRSxvQkFBb0IsR0FBRyxJQUFJLENBQUM5RSxjQUFjLENBQUM4QyxPQUFPLEdBQUcsSUFBSSxDQUFDOUMsY0FBYyxDQUFDNEUsTUFBTSxHQUFHLENBQUM7TUFDekZMLGVBQWUsR0FBRyxJQUFJLENBQUN0RSxVQUFVLENBQUN5RSxLQUFLO01BQ3ZDRixnQkFBZ0IsR0FBRyxJQUFJLENBQUN2RSxVQUFVLENBQUMyRSxNQUFNLEdBQUdDLGdCQUFnQixHQUFHQyxvQkFBb0I7SUFDckY7SUFDQSxPQUFPLElBQUk3TSxVQUFVLENBQUVzTSxlQUFlLEVBQUVDLGdCQUFpQixDQUFDO0VBQzVEO0VBRWdCTyxNQUFNQSxDQUFBLEVBQVM7SUFDN0IsS0FBSyxDQUFDQSxNQUFNLENBQUMsQ0FBQztJQUVkLE1BQU0zSyxXQUFXLEdBQUcsSUFBSSxDQUFDQSxXQUFXOztJQUVwQztJQUNBLE1BQU00SyxlQUFlLEdBQUcsSUFBSSxDQUFDbkksVUFBVSxDQUFDb0ksa0JBQWtCLENBQUU3SyxXQUFXLENBQUNzRCxRQUFTLENBQUMsQ0FBQ3VCLEtBQUs7SUFDeEYsTUFBTWlHLGtCQUFrQixHQUFHRixlQUFlLEdBQUssQ0FBQyxHQUFHLElBQUksQ0FBQ3BLLE1BQVE7SUFDaEUsSUFBSSxDQUFDMkUsVUFBVSxDQUFFbkYsV0FBVyxDQUFDc0QsUUFBUSxDQUFDeUgsYUFBYSxDQUFFLEdBQUdELGtCQUFrQjtJQUMxRSxJQUFJLENBQUNsRixjQUFjLENBQUU1RixXQUFXLENBQUNzRCxRQUFRLENBQUN5SCxhQUFhLENBQUUsR0FBR0Qsa0JBQWtCO0lBRTlFLElBQUksQ0FBQzNGLFVBQVUsQ0FBRW5GLFdBQVcsQ0FBQ3NELFFBQVEsQ0FBQzBILGdCQUFnQixDQUFFLEdBQUcsSUFBSSxDQUFDbEYsY0FBYyxDQUFFOUYsV0FBVyxDQUFDc0QsUUFBUSxDQUFDMEgsZ0JBQWdCLENBQUU7SUFDdkgsSUFBSSxDQUFDcEYsY0FBYyxDQUFFNUYsV0FBVyxDQUFDc0QsUUFBUSxDQUFDMEgsZ0JBQWdCLENBQUUsR0FBRyxJQUFJLENBQUNsRixjQUFjLENBQUU5RixXQUFXLENBQUNzRCxRQUFRLENBQUMwSCxnQkFBZ0IsQ0FBRTtJQUMzSCxJQUFJLENBQUNuRixVQUFVLENBQUU3RixXQUFXLENBQUNzRCxRQUFRLENBQUMwSCxnQkFBZ0IsQ0FBRSxHQUFHLElBQUksQ0FBQ2xGLGNBQWMsQ0FBRTlGLFdBQVcsQ0FBQ3NELFFBQVEsQ0FBQzBILGdCQUFnQixDQUFFO0lBQ3ZILElBQUksQ0FBQ3BGLGNBQWMsQ0FBRTVGLFdBQVcsQ0FBQzBHLE9BQU8sQ0FBRSxHQUFHLElBQUksQ0FBQ1osY0FBYyxDQUFFOUYsV0FBVyxDQUFDMEcsT0FBTyxDQUFFO0lBQ3ZGLElBQUksQ0FBQ3ZCLFVBQVUsQ0FBRW5GLFdBQVcsQ0FBQzJKLE9BQU8sQ0FBRSxHQUFHLElBQUksQ0FBQzdELGNBQWMsQ0FBRTlGLFdBQVcsQ0FBQzJKLE9BQU8sQ0FBRTtJQUNuRixJQUFJLENBQUM5RCxVQUFVLENBQUU3RixXQUFXLENBQUNnTCxnQkFBZ0IsQ0FBRSxHQUFHLElBQUksQ0FBQ2xGLGNBQWMsQ0FBRTlGLFdBQVcsQ0FBQ2dMLGdCQUFnQixDQUFFO0lBRXJHLE1BQU1DLFVBQVUsR0FBRyxJQUFJLENBQUNwQixlQUFlLENBQUMsQ0FBQyxDQUFDcUIsUUFBUSxDQUFDLENBQUM7SUFDcEQsSUFBSSxDQUFDckYsVUFBVSxDQUFDc0YsUUFBUSxHQUFHcE4sS0FBSyxDQUFDcU4sTUFBTSxDQUFFSCxVQUFXLENBQUM7O0lBRXJEO0lBQ0E7SUFDQSxJQUFJLENBQUNwRixVQUFVLENBQUN3RixXQUFXLEdBQUdKLFVBQVU7SUFFeEMsTUFBTUssbUJBQW1CLEdBQUcsSUFBSSxDQUFDcEIsc0JBQXNCLENBQUMsQ0FBQztJQUV6RCxJQUFJLENBQUNqQixRQUFRLENBQUNrQixlQUFlLEdBQUdtQixtQkFBbUIsQ0FBQ2hCLEtBQUs7SUFDekQsSUFBSSxDQUFDckIsUUFBUSxDQUFDbUIsZ0JBQWdCLEdBQUdrQixtQkFBbUIsQ0FBQ2QsTUFBTTtJQUUzRCxNQUFNZSxnQkFBZ0IsR0FBR0QsbUJBQW1CLENBQUNKLFFBQVEsQ0FBQyxDQUFDO0lBQ3ZELElBQUksQ0FBQ3BGLGNBQWMsQ0FBQzBGLFVBQVUsR0FBR0QsZ0JBQWdCO0lBQ2pELElBQUksQ0FBQ3hGLGNBQWMsQ0FBQ3lGLFVBQVUsR0FBR0QsZ0JBQWdCOztJQUVqRDtJQUNBLElBQUksQ0FBQ3RILGNBQWMsSUFBSSxJQUFJLENBQUNzRixnQkFBZ0IsQ0FBQyxDQUFDO0VBQ2hEO0FBQ0Y7QUFFQXZLLEdBQUcsQ0FBQ3lNLFFBQVEsQ0FBRSxVQUFVLEVBQUVoTSxRQUFTLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=