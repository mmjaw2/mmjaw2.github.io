// Copyright 2020-2024, University of Colorado Boulder

/**
 * ButtonNode is the base class for the sun button hierarchy.
 *
 * @author John Blanco (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../axon/js/DerivedProperty.js';
import Multilink from '../../../axon/js/Multilink.js';
import Bounds2 from '../../../dot/js/Bounds2.js';
import Dimension2 from '../../../dot/js/Dimension2.js';
import optionize, { combineOptions } from '../../../phet-core/js/optionize.js';
import { AlignBox, Brightness, Contrast, Grayscale, isHeightSizable, isWidthSizable, LayoutConstraint, Node, PaintColorProperty, SceneryConstants, Sizable, Voicing } from '../../../scenery/js/imports.js';
import ColorConstants from '../ColorConstants.js';
import sun from '../sun.js';
import ButtonInteractionState from './ButtonInteractionState.js';
import TinyProperty from '../../../axon/js/TinyProperty.js';

// constants
const CONTRAST_FILTER = new Contrast(0.7);
const BRIGHTNESS_FILTER = new Brightness(1.2);

// if there is content, style can be applied to a containing Node around it.

// Normal options, for use in optionize

// However we'll want subtypes to provide these options to their clients, since some options ideally should not be
// used directly.

export default class ButtonNode extends Sizable(Voicing(Node)) {
  buttonNodeConstraint = null;

  // The maximum lineWidth our buttonBackground can have. We'll lay things out so that if we adjust our lineWidth below
  // this, the layout won't change

  /**
   * @param buttonModel
   * @param buttonBackground - the background of the button (like a circle or rectangle).
   * @param interactionStateProperty - a Property that is used to drive the visual appearance of the button
   * @param providedOptions - this type does not mutate its options, but relies on the subtype to
   */
  constructor(buttonModel, buttonBackground, interactionStateProperty, providedOptions) {
    const options = optionize()({
      content: null,
      minUnstrokedWidth: null,
      minUnstrokedHeight: null,
      xMargin: 10,
      yMargin: 5,
      xAlign: 'center',
      yAlign: 'center',
      xContentOffset: 0,
      yContentOffset: 0,
      baseColor: ColorConstants.LIGHT_BLUE,
      cursor: 'pointer',
      buttonAppearanceStrategy: ButtonNode.FlatAppearanceStrategy,
      buttonAppearanceStrategyOptions: {},
      contentAppearanceStrategy: null,
      contentAppearanceStrategyOptions: {},
      enabledAppearanceStrategy: (enabled, button, background, content) => {
        background.filters = enabled ? [] : [CONTRAST_FILTER, BRIGHTNESS_FILTER];
        if (content) {
          content.filters = enabled ? [] : [Grayscale.FULL];
          content.opacity = enabled ? 1 : SceneryConstants.DISABLED_OPACITY;
        }
      },
      disabledColor: ColorConstants.LIGHT_GRAY,
      aspectRatio: null,
      // pdom
      tagName: 'button',
      // phet-io
      tandemNameSuffix: 'Button',
      visiblePropertyOptions: {
        phetioFeatured: true
      },
      phetioEnabledPropertyInstrumented: true // opt into default PhET-iO instrumented enabledProperty
    }, providedOptions);
    options.listenerOptions = combineOptions({
      tandem: options.tandem?.createTandem('pressListener')
    }, options.listenerOptions);
    assert && options.enabledProperty && assert(options.enabledProperty === buttonModel.enabledProperty, 'if options.enabledProperty is provided, it must === buttonModel.enabledProperty');
    options.enabledProperty = buttonModel.enabledProperty;
    assert && assert(options.aspectRatio === null || isFinite(options.aspectRatio) && options.aspectRatio > 0, `ButtonNode aspectRatio should be a positive finite value if non-null. Instead received ${options.aspectRatio}.`);
    super();
    this.content = options.content;
    this.buttonModel = buttonModel;
    this._settableBaseColorProperty = new PaintColorProperty(options.baseColor);
    this._disabledColorProperty = new PaintColorProperty(options.disabledColor);
    this.baseColorProperty = new DerivedProperty([this._settableBaseColorProperty, this.enabledProperty, this._disabledColorProperty], (color, enabled, disabledColor) => {
      return enabled ? color : disabledColor;
    });
    this._pressListener = buttonModel.createPressListener(options.listenerOptions);
    this.addInputListener(this._pressListener);
    assert && assert(buttonBackground.fill === null, 'ButtonNode controls the fill for the buttonBackground');
    buttonBackground.fill = this.baseColorProperty;
    this.addChild(buttonBackground);

    // Hook up the strategy that will control the button's appearance.
    const buttonAppearanceStrategy = new options.buttonAppearanceStrategy(buttonBackground, interactionStateProperty, this.baseColorProperty, options.buttonAppearanceStrategyOptions);

    // Optionally hook up the strategy that will control the content's appearance.
    let contentAppearanceStrategy;
    if (options.contentAppearanceStrategy && options.content) {
      contentAppearanceStrategy = new options.contentAppearanceStrategy(options.content, interactionStateProperty, options.contentAppearanceStrategyOptions);
    }

    // Get our maxLineWidth from the appearance strategy, as it's needed for layout (and in subtypes)
    this.maxLineWidth = buttonAppearanceStrategy.maxLineWidth;
    let alignBox = null;
    let updateAlignBounds = null;
    if (options.content) {
      const content = options.content;

      // For performance, in case content is a complicated icon or shape.
      // See https://github.com/phetsims/sun/issues/654#issuecomment-718944669
      content.pickable = false;
      this.buttonNodeConstraint = new ButtonNodeConstraint(this, {
        content: options.content,
        xMargin: options.xMargin,
        yMargin: options.yMargin,
        maxLineWidth: this.maxLineWidth,
        minUnstrokedWidth: options.minUnstrokedWidth,
        minUnstrokedHeight: options.minUnstrokedHeight,
        aspectRatio: options.aspectRatio
      });
      this.layoutSizeProperty = this.buttonNodeConstraint.layoutSizeProperty;

      // Align content in the button rectangle. Must be disposed since it adds listener to content bounds.
      alignBox = new AlignBox(content, {
        xAlign: options.xAlign,
        yAlign: options.yAlign,
        // Apply offsets via margins, so that bounds of the AlignBox doesn't unnecessarily extend past the
        // buttonBackground. See https://github.com/phetsims/sun/issues/649
        leftMargin: options.xMargin + options.xContentOffset,
        rightMargin: options.xMargin - options.xContentOffset,
        topMargin: options.yMargin + options.yContentOffset,
        bottomMargin: options.yMargin - options.yContentOffset
      });

      // Dynamically adjust alignBounds.
      updateAlignBounds = Multilink.multilink([buttonBackground.boundsProperty, this.layoutSizeProperty], (backgroundBounds, size) => {
        alignBox.alignBounds = Bounds2.point(backgroundBounds.center).dilatedXY(size.width / 2, size.height / 2);
      });
      this.addChild(alignBox);
    } else {
      assert && assert(options.minUnstrokedWidth !== null);
      assert && assert(options.minUnstrokedHeight !== null);
      this.layoutSizeProperty = new TinyProperty(new Dimension2(options.minUnstrokedWidth + this.maxLineWidth, options.minUnstrokedHeight + this.maxLineWidth));
    }
    this.mutate(options);

    // No need to dispose because enabledProperty is disposed in Node
    this.enabledProperty.link(enabled => options.enabledAppearanceStrategy(enabled, this, buttonBackground, alignBox));
    this.disposeButtonNode = () => {
      alignBox && alignBox.dispose();
      updateAlignBounds && updateAlignBounds.dispose();
      buttonAppearanceStrategy.dispose && buttonAppearanceStrategy.dispose();
      contentAppearanceStrategy && contentAppearanceStrategy.dispose && contentAppearanceStrategy.dispose();
      this._pressListener.dispose();
      this.baseColorProperty.dispose();
    };
  }
  dispose() {
    this.buttonNodeConstraint && this.buttonNodeConstraint.dispose();
    this.disposeButtonNode();
    super.dispose();
  }

  /**
   * Sets the base color, which is the main background fill color used for the button.
   */
  setBaseColor(baseColor) {
    this._settableBaseColorProperty.paint = baseColor;
  }
  set baseColor(baseColor) {
    this.setBaseColor(baseColor);
  }
  get baseColor() {
    return this.getBaseColor();
  }

  /**
   * Gets the base color for this button.
   */
  getBaseColor() {
    return this._settableBaseColorProperty.paint;
  }

  /**
   * Manually click the button, as it would be clicked in response to alternative input. Recommended only for
   * accessibility usages. For the most part, PDOM button functionality should be managed by PressListener, this should
   * rarely be used.
   */
  pdomClick() {
    this._pressListener.click(null);
  }

  /**
   * Is the button currently firing because of accessibility input coming from the PDOM?
   */
  isPDOMClicking() {
    return this._pressListener.pdomClickingProperty.get();
  }
}

/**
 * FlatAppearanceStrategy is a value for ButtonNode options.buttonAppearanceStrategy. It makes a
 * button look flat, i.e. no shading or highlighting, with color changes on mouseover, press, etc.
 */
export class FlatAppearanceStrategy {
  /**
   * @param buttonBackground - the Node for the button's background, sans content
   * @param interactionStateProperty - interaction state, used to trigger updates
   * @param baseColorProperty - base color from which other colors are derived
   * @param [providedOptions]
   */
  constructor(buttonBackground, interactionStateProperty, baseColorProperty, providedOptions) {
    // dynamic colors
    const baseBrighter4Property = new PaintColorProperty(baseColorProperty, {
      luminanceFactor: 0.4
    });
    const baseDarker4Property = new PaintColorProperty(baseColorProperty, {
      luminanceFactor: -0.4
    });

    // various fills that are used to alter the button's appearance
    const upFillProperty = baseColorProperty;
    const overFillProperty = baseBrighter4Property;
    const downFillProperty = baseDarker4Property;
    const options = combineOptions({
      stroke: baseDarker4Property
    }, providedOptions);
    const lineWidth = typeof options.lineWidth === 'number' ? options.lineWidth : 1;

    // If the stroke wasn't provided, set a default.
    buttonBackground.stroke = options.stroke || baseDarker4Property;
    buttonBackground.lineWidth = lineWidth;
    this.maxLineWidth = buttonBackground.hasStroke() ? lineWidth : 0;

    // Cache colors
    buttonBackground.cachedPaints = [upFillProperty, overFillProperty, downFillProperty];

    // Change colors to match interactionState
    function interactionStateListener(interactionState) {
      switch (interactionState) {
        case ButtonInteractionState.IDLE:
          buttonBackground.fill = upFillProperty;
          break;
        case ButtonInteractionState.OVER:
          buttonBackground.fill = overFillProperty;
          break;
        case ButtonInteractionState.PRESSED:
          buttonBackground.fill = downFillProperty;
          break;
        default:
          throw new Error(`unsupported interactionState: ${interactionState}`);
      }
    }

    // Do the initial update explicitly, then lazy link to the properties.  This keeps the number of initial updates to
    // a minimum and allows us to update some optimization flags the first time the base color is actually changed.
    interactionStateProperty.link(interactionStateListener);
    this.disposeFlatAppearanceStrategy = () => {
      if (interactionStateProperty.hasListener(interactionStateListener)) {
        interactionStateProperty.unlink(interactionStateListener);
      }
      baseBrighter4Property.dispose();
      baseDarker4Property.dispose();
    };
  }
  dispose() {
    this.disposeFlatAppearanceStrategy();
  }
}
class ButtonNodeConstraint extends LayoutConstraint {
  layoutSizeProperty = new TinyProperty(new Dimension2(0, 0));
  isFirstLayout = true;

  // Stored so that we can prevent updates if we're not marked sizable in a certain direction
  lastLocalPreferredWidth = 0;
  lastLocalPreferredHeight = 0;
  constructor(buttonNode, options) {
    super(buttonNode);

    // Save everything, so we can run things in the layout method
    this.buttonNode = buttonNode;
    this.content = options.content;
    this.xMargin = options.xMargin;
    this.yMargin = options.yMargin;
    this.maxLineWidth = options.maxLineWidth;
    this.minUnstrokedWidth = options.minUnstrokedWidth;
    this.minUnstrokedHeight = options.minUnstrokedHeight;
    this.aspectRatio = options.aspectRatio;
    this.buttonNode.localPreferredWidthProperty.lazyLink(this._updateLayoutListener);
    this.buttonNode.localPreferredHeightProperty.lazyLink(this._updateLayoutListener);
    this.addNode(this.content, false);
    this.layout();
  }
  layout() {
    super.layout();
    const buttonNode = this.buttonNode;
    const content = this.content;

    // Only allow an initial update if we are not sizable in that dimension
    let minimumWidth = Math.max(this.isFirstLayout || buttonNode.widthSizable ? (isWidthSizable(content) ? content.minimumWidth || 0 : content.width) + this.xMargin * 2 : buttonNode.localMinimumWidth, this.minUnstrokedWidth === null ? 0 : this.minUnstrokedWidth + this.maxLineWidth);
    let minimumHeight = Math.max(this.isFirstLayout || buttonNode.heightSizable ? (isHeightSizable(content) ? content.minimumHeight || 0 : content.height) + this.yMargin * 2 : buttonNode.localMinimumHeight, this.minUnstrokedHeight === null ? 0 : this.minUnstrokedHeight + this.maxLineWidth);
    if (this.aspectRatio !== null) {
      if (minimumWidth < minimumHeight * this.aspectRatio) {
        minimumWidth = minimumHeight * this.aspectRatio;
      }
      if (minimumHeight < minimumWidth / this.aspectRatio) {
        minimumHeight = minimumWidth / this.aspectRatio;
      }
    }

    // Our resulting sizes (allow setting preferred width/height on the buttonNode)
    this.lastLocalPreferredWidth = this.isFirstLayout || isWidthSizable(buttonNode) ? Math.max(minimumWidth, buttonNode.localPreferredWidth || 0) : this.lastLocalPreferredWidth;
    this.lastLocalPreferredHeight = this.isFirstLayout || isHeightSizable(buttonNode) ? Math.max(minimumHeight, buttonNode.localPreferredHeight || 0) : this.lastLocalPreferredHeight;
    this.isFirstLayout = false;
    this.layoutSizeProperty.value = new Dimension2(this.lastLocalPreferredWidth, this.lastLocalPreferredHeight);

    // Set minimums at the end
    buttonNode.localMinimumWidth = minimumWidth;
    buttonNode.localMinimumHeight = minimumHeight;
  }
  dispose() {
    this.buttonNode.localPreferredWidthProperty.unlink(this._updateLayoutListener);
    this.buttonNode.localPreferredHeightProperty.unlink(this._updateLayoutListener);
    super.dispose();
  }
}
ButtonNode.FlatAppearanceStrategy = FlatAppearanceStrategy;
sun.register('ButtonNode', ButtonNode);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJEZXJpdmVkUHJvcGVydHkiLCJNdWx0aWxpbmsiLCJCb3VuZHMyIiwiRGltZW5zaW9uMiIsIm9wdGlvbml6ZSIsImNvbWJpbmVPcHRpb25zIiwiQWxpZ25Cb3giLCJCcmlnaHRuZXNzIiwiQ29udHJhc3QiLCJHcmF5c2NhbGUiLCJpc0hlaWdodFNpemFibGUiLCJpc1dpZHRoU2l6YWJsZSIsIkxheW91dENvbnN0cmFpbnQiLCJOb2RlIiwiUGFpbnRDb2xvclByb3BlcnR5IiwiU2NlbmVyeUNvbnN0YW50cyIsIlNpemFibGUiLCJWb2ljaW5nIiwiQ29sb3JDb25zdGFudHMiLCJzdW4iLCJCdXR0b25JbnRlcmFjdGlvblN0YXRlIiwiVGlueVByb3BlcnR5IiwiQ09OVFJBU1RfRklMVEVSIiwiQlJJR0hUTkVTU19GSUxURVIiLCJCdXR0b25Ob2RlIiwiYnV0dG9uTm9kZUNvbnN0cmFpbnQiLCJjb25zdHJ1Y3RvciIsImJ1dHRvbk1vZGVsIiwiYnV0dG9uQmFja2dyb3VuZCIsImludGVyYWN0aW9uU3RhdGVQcm9wZXJ0eSIsInByb3ZpZGVkT3B0aW9ucyIsIm9wdGlvbnMiLCJjb250ZW50IiwibWluVW5zdHJva2VkV2lkdGgiLCJtaW5VbnN0cm9rZWRIZWlnaHQiLCJ4TWFyZ2luIiwieU1hcmdpbiIsInhBbGlnbiIsInlBbGlnbiIsInhDb250ZW50T2Zmc2V0IiwieUNvbnRlbnRPZmZzZXQiLCJiYXNlQ29sb3IiLCJMSUdIVF9CTFVFIiwiY3Vyc29yIiwiYnV0dG9uQXBwZWFyYW5jZVN0cmF0ZWd5IiwiRmxhdEFwcGVhcmFuY2VTdHJhdGVneSIsImJ1dHRvbkFwcGVhcmFuY2VTdHJhdGVneU9wdGlvbnMiLCJjb250ZW50QXBwZWFyYW5jZVN0cmF0ZWd5IiwiY29udGVudEFwcGVhcmFuY2VTdHJhdGVneU9wdGlvbnMiLCJlbmFibGVkQXBwZWFyYW5jZVN0cmF0ZWd5IiwiZW5hYmxlZCIsImJ1dHRvbiIsImJhY2tncm91bmQiLCJmaWx0ZXJzIiwiRlVMTCIsIm9wYWNpdHkiLCJESVNBQkxFRF9PUEFDSVRZIiwiZGlzYWJsZWRDb2xvciIsIkxJR0hUX0dSQVkiLCJhc3BlY3RSYXRpbyIsInRhZ05hbWUiLCJ0YW5kZW1OYW1lU3VmZml4IiwidmlzaWJsZVByb3BlcnR5T3B0aW9ucyIsInBoZXRpb0ZlYXR1cmVkIiwicGhldGlvRW5hYmxlZFByb3BlcnR5SW5zdHJ1bWVudGVkIiwibGlzdGVuZXJPcHRpb25zIiwidGFuZGVtIiwiY3JlYXRlVGFuZGVtIiwiYXNzZXJ0IiwiZW5hYmxlZFByb3BlcnR5IiwiaXNGaW5pdGUiLCJfc2V0dGFibGVCYXNlQ29sb3JQcm9wZXJ0eSIsIl9kaXNhYmxlZENvbG9yUHJvcGVydHkiLCJiYXNlQ29sb3JQcm9wZXJ0eSIsImNvbG9yIiwiX3ByZXNzTGlzdGVuZXIiLCJjcmVhdGVQcmVzc0xpc3RlbmVyIiwiYWRkSW5wdXRMaXN0ZW5lciIsImZpbGwiLCJhZGRDaGlsZCIsIm1heExpbmVXaWR0aCIsImFsaWduQm94IiwidXBkYXRlQWxpZ25Cb3VuZHMiLCJwaWNrYWJsZSIsIkJ1dHRvbk5vZGVDb25zdHJhaW50IiwibGF5b3V0U2l6ZVByb3BlcnR5IiwibGVmdE1hcmdpbiIsInJpZ2h0TWFyZ2luIiwidG9wTWFyZ2luIiwiYm90dG9tTWFyZ2luIiwibXVsdGlsaW5rIiwiYm91bmRzUHJvcGVydHkiLCJiYWNrZ3JvdW5kQm91bmRzIiwic2l6ZSIsImFsaWduQm91bmRzIiwicG9pbnQiLCJjZW50ZXIiLCJkaWxhdGVkWFkiLCJ3aWR0aCIsImhlaWdodCIsIm11dGF0ZSIsImxpbmsiLCJkaXNwb3NlQnV0dG9uTm9kZSIsImRpc3Bvc2UiLCJzZXRCYXNlQ29sb3IiLCJwYWludCIsImdldEJhc2VDb2xvciIsInBkb21DbGljayIsImNsaWNrIiwiaXNQRE9NQ2xpY2tpbmciLCJwZG9tQ2xpY2tpbmdQcm9wZXJ0eSIsImdldCIsImJhc2VCcmlnaHRlcjRQcm9wZXJ0eSIsImx1bWluYW5jZUZhY3RvciIsImJhc2VEYXJrZXI0UHJvcGVydHkiLCJ1cEZpbGxQcm9wZXJ0eSIsIm92ZXJGaWxsUHJvcGVydHkiLCJkb3duRmlsbFByb3BlcnR5Iiwic3Ryb2tlIiwibGluZVdpZHRoIiwiaGFzU3Ryb2tlIiwiY2FjaGVkUGFpbnRzIiwiaW50ZXJhY3Rpb25TdGF0ZUxpc3RlbmVyIiwiaW50ZXJhY3Rpb25TdGF0ZSIsIklETEUiLCJPVkVSIiwiUFJFU1NFRCIsIkVycm9yIiwiZGlzcG9zZUZsYXRBcHBlYXJhbmNlU3RyYXRlZ3kiLCJoYXNMaXN0ZW5lciIsInVubGluayIsImlzRmlyc3RMYXlvdXQiLCJsYXN0TG9jYWxQcmVmZXJyZWRXaWR0aCIsImxhc3RMb2NhbFByZWZlcnJlZEhlaWdodCIsImJ1dHRvbk5vZGUiLCJsb2NhbFByZWZlcnJlZFdpZHRoUHJvcGVydHkiLCJsYXp5TGluayIsIl91cGRhdGVMYXlvdXRMaXN0ZW5lciIsImxvY2FsUHJlZmVycmVkSGVpZ2h0UHJvcGVydHkiLCJhZGROb2RlIiwibGF5b3V0IiwibWluaW11bVdpZHRoIiwiTWF0aCIsIm1heCIsIndpZHRoU2l6YWJsZSIsImxvY2FsTWluaW11bVdpZHRoIiwibWluaW11bUhlaWdodCIsImhlaWdodFNpemFibGUiLCJsb2NhbE1pbmltdW1IZWlnaHQiLCJsb2NhbFByZWZlcnJlZFdpZHRoIiwibG9jYWxQcmVmZXJyZWRIZWlnaHQiLCJ2YWx1ZSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiQnV0dG9uTm9kZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMC0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBCdXR0b25Ob2RlIGlzIHRoZSBiYXNlIGNsYXNzIGZvciB0aGUgc3VuIGJ1dHRvbiBoaWVyYXJjaHkuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9obiBCbGFuY28gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgRGVyaXZlZFByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvRGVyaXZlZFByb3BlcnR5LmpzJztcclxuaW1wb3J0IFRSZWFkT25seVByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgTXVsdGlsaW5rLCB7IFVua25vd25NdWx0aWxpbmsgfSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL011bHRpbGluay5qcyc7XHJcbmltcG9ydCBCb3VuZHMyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9Cb3VuZHMyLmpzJztcclxuaW1wb3J0IERpbWVuc2lvbjIgZnJvbSAnLi4vLi4vLi4vZG90L2pzL0RpbWVuc2lvbjIuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplLCB7IGNvbWJpbmVPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IHsgQWxpZ25Cb3gsIEFsaWduQm94WEFsaWduLCBBbGlnbkJveFlBbGlnbiwgQnJpZ2h0bmVzcywgQ29sb3IsIENvbnRyYXN0LCBHcmF5c2NhbGUsIGlzSGVpZ2h0U2l6YWJsZSwgaXNXaWR0aFNpemFibGUsIExheW91dENvbnN0cmFpbnQsIE5vZGUsIE5vZGVPcHRpb25zLCBQYWludGFibGVOb2RlLCBQYWludENvbG9yUHJvcGVydHksIFBhdGgsIFByZXNzTGlzdGVuZXIsIFByZXNzTGlzdGVuZXJPcHRpb25zLCBTY2VuZXJ5Q29uc3RhbnRzLCBTaXphYmxlLCBTaXphYmxlT3B0aW9ucywgVENvbG9yLCBUUGFpbnQsIFZvaWNpbmcsIFZvaWNpbmdPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IENvbG9yQ29uc3RhbnRzIGZyb20gJy4uL0NvbG9yQ29uc3RhbnRzLmpzJztcclxuaW1wb3J0IHN1biBmcm9tICcuLi9zdW4uanMnO1xyXG5pbXBvcnQgQnV0dG9uSW50ZXJhY3Rpb25TdGF0ZSBmcm9tICcuL0J1dHRvbkludGVyYWN0aW9uU3RhdGUuanMnO1xyXG5pbXBvcnQgQnV0dG9uTW9kZWwgZnJvbSAnLi9CdXR0b25Nb2RlbC5qcyc7XHJcbmltcG9ydCBUQnV0dG9uQXBwZWFyYW5jZVN0cmF0ZWd5LCB7IFRCdXR0b25BcHBlYXJhbmNlU3RyYXRlZ3lPcHRpb25zIH0gZnJvbSAnLi9UQnV0dG9uQXBwZWFyYW5jZVN0cmF0ZWd5LmpzJztcclxuaW1wb3J0IFRDb250ZW50QXBwZWFyYW5jZVN0cmF0ZWd5LCB7IFRDb250ZW50QXBwZWFyYW5jZVN0cmF0ZWd5T3B0aW9ucyB9IGZyb20gJy4vVENvbnRlbnRBcHBlYXJhbmNlU3RyYXRlZ3kuanMnO1xyXG5pbXBvcnQgVGlueVByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvVGlueVByb3BlcnR5LmpzJztcclxuXHJcbi8vIGNvbnN0YW50c1xyXG5jb25zdCBDT05UUkFTVF9GSUxURVIgPSBuZXcgQ29udHJhc3QoIDAuNyApO1xyXG5jb25zdCBCUklHSFRORVNTX0ZJTFRFUiA9IG5ldyBCcmlnaHRuZXNzKCAxLjIgKTtcclxuXHJcbi8vIGlmIHRoZXJlIGlzIGNvbnRlbnQsIHN0eWxlIGNhbiBiZSBhcHBsaWVkIHRvIGEgY29udGFpbmluZyBOb2RlIGFyb3VuZCBpdC5cclxudHlwZSBFbmFibGVkQXBwZWFyYW5jZVN0cmF0ZWd5ID0gKCBlbmFibGVkOiBib29sZWFuLCBidXR0b246IE5vZGUsIGJhY2tncm91bmQ6IE5vZGUsIGNvbnRlbnQ6IE5vZGUgfCBudWxsICkgPT4gdm9pZDtcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcblxyXG4gIC8vIHdoYXQgYXBwZWFycyBvbiB0aGUgYnV0dG9uIChpY29uLCBsYWJlbCwgZXRjLilcclxuICBjb250ZW50PzogTm9kZSB8IG51bGw7XHJcblxyXG4gIC8vIG1hcmdpbiBpbiB4IGRpcmVjdGlvbiwgaS5lLiBvbiBsZWZ0IGFuZCByaWdodFxyXG4gIHhNYXJnaW4/OiBudW1iZXI7XHJcblxyXG4gIC8vIG1hcmdpbiBpbiB5IGRpcmVjdGlvbiwgaS5lLiBvbiB0b3AgYW5kIGJvdHRvbVxyXG4gIHlNYXJnaW4/OiBudW1iZXI7XHJcblxyXG4gIC8vIEFsaWdubWVudCwgcmVsZXZhbnQgb25seSB3aGVuIG9wdGlvbnMgbWluV2lkdGggb3IgbWluSGVpZ2h0IGFyZSBncmVhdGVyIHRoYW4gdGhlIHNpemUgb2Ygb3B0aW9ucy5jb250ZW50XHJcbiAgeEFsaWduPzogQWxpZ25Cb3hYQWxpZ247XHJcbiAgeUFsaWduPzogQWxpZ25Cb3hZQWxpZ247XHJcblxyXG4gIC8vIEhhbmRsaW5nIG1pbmltdW0gc2l6ZXMgZm9yIGRpcmVjdCBTdWJ0eXBlcyAobm90IGZvciBnZW5lcmFsIHVzZSkuIFRoZSBzaXplIG9mIGEgYnV0dG9uIHdvbid0IGV2ZXIgZ2V0IGRvd24gdG8gdGhlc2VcclxuICAvLyBzaXplcywgZHVlIHRvIHN0cm9rZSBzaXplICh0aGV5IGFyZSBsZWZ0IHRoYXQgd2F5IGZvciBjb21wYXRpYmlsaXR5IHJlYXNvbnMpLlxyXG4gIG1pblVuc3Ryb2tlZFdpZHRoPzogbnVtYmVyIHwgbnVsbDtcclxuICBtaW5VbnN0cm9rZWRIZWlnaHQ/OiBudW1iZXIgfCBudWxsO1xyXG5cclxuICAvLyBCeSBkZWZhdWx0LCBpY29ucyBhcmUgY2VudGVyZWQgaW4gdGhlIGJ1dHRvbiwgYnV0IGljb25zIHdpdGggb2RkXHJcbiAgLy8gc2hhcGVzIHRoYXQgYXJlIG5vdCB3cmFwcGVkIGluIGEgbm9ybWFsaXppbmcgcGFyZW50IG5vZGUgbWF5IG5lZWQgdG9cclxuICAvLyBzcGVjaWZ5IG9mZnNldHMgdG8gbGluZSB0aGluZ3MgdXAgcHJvcGVybHlcclxuICB4Q29udGVudE9mZnNldD86IG51bWJlcjtcclxuICB5Q29udGVudE9mZnNldD86IG51bWJlcjtcclxuXHJcbiAgLy8gT3B0aW9ucyB0aGF0IHdpbGwgYmUgcGFzc2VkIHRocm91Z2ggdG8gdGhlIG1haW4gaW5wdXQgbGlzdGVuZXIgKFByZXNzTGlzdGVuZXIpXHJcbiAgbGlzdGVuZXJPcHRpb25zPzogUHJlc3NMaXN0ZW5lck9wdGlvbnM7XHJcblxyXG4gIC8vIGluaXRpYWwgY29sb3Igb2YgdGhlIGJ1dHRvbidzIGJhY2tncm91bmRcclxuICBiYXNlQ29sb3I/OiBUUGFpbnQ7XHJcblxyXG4gIC8vIENvbG9yIHdoZW4gZGlzYWJsZWRcclxuICBkaXNhYmxlZENvbG9yPzogVFBhaW50O1xyXG5cclxuICAvLyBDbGFzcyBhbmQgYXNzb2NpYXRlZCBvcHRpb25zIHRoYXQgZGV0ZXJtaW5lIHRoZSBidXR0b24ncyBhcHBlYXJhbmNlIGFuZCB0aGUgY2hhbmdlcyB0aGF0IG9jY3VyIHdoZW4gdGhlIGJ1dHRvbiBpc1xyXG4gIC8vIHByZXNzZWQsIGhvdmVyZWQgb3ZlciwgZGlzYWJsZWQsIGFuZCBzbyBmb3J0aC5cclxuICBidXR0b25BcHBlYXJhbmNlU3RyYXRlZ3k/OiBUQnV0dG9uQXBwZWFyYW5jZVN0cmF0ZWd5O1xyXG4gIGJ1dHRvbkFwcGVhcmFuY2VTdHJhdGVneU9wdGlvbnM/OiBUQnV0dG9uQXBwZWFyYW5jZVN0cmF0ZWd5T3B0aW9ucztcclxuXHJcbiAgLy8gQ2xhc3MgYW5kIGFzc29jaWF0ZWQgb3B0aW9ucyB0aGF0IGRldGVybWluZSBob3cgdGhlIGNvbnRlbnQgbm9kZSBsb29rcyBhbmQgdGhlIGNoYW5nZXMgdGhhdCBvY2N1ciB3aGVuIHRoZSBidXR0b25cclxuICAvLyBpcyBwcmVzc2VkLCBob3ZlcmVkIG92ZXIsIGRpc2FibGVkLCBhbmQgc28gZm9ydGguXHJcbiAgY29udGVudEFwcGVhcmFuY2VTdHJhdGVneT86IFRDb250ZW50QXBwZWFyYW5jZVN0cmF0ZWd5IHwgbnVsbDtcclxuICBjb250ZW50QXBwZWFyYW5jZVN0cmF0ZWd5T3B0aW9ucz86IFRDb250ZW50QXBwZWFyYW5jZVN0cmF0ZWd5T3B0aW9ucztcclxuXHJcbiAgLy8gQWx0ZXIgdGhlIGFwcGVhcmFuY2Ugd2hlbiBjaGFuZ2luZyB0aGUgZW5hYmxlZCBvZiB0aGUgYnV0dG9uLlxyXG4gIGVuYWJsZWRBcHBlYXJhbmNlU3RyYXRlZ3k/OiBFbmFibGVkQXBwZWFyYW5jZVN0cmF0ZWd5O1xyXG5cclxuICAvLyBJZiBub24tbnVsbCwgdGhlIGFzcGVjdCByYXRpbyBvZiB0aGUgYnV0dG9uIHdpbGwgYmUgY29uc3RyYWluZWQgdG8gdGhpcyB2YWx1ZS4gSXQgd2lsbCBjaGVjayB0aGUgbWluaW11bSBzaXplcyxcclxuICAvLyBhbmQgd2lsbCBpbmNyZWFzZSB0aGUgbWluaW11bSBzaXplIGlmIG5lY2Vzc2FyeSB0byBtYWludGFpbiB0aGUgYXNwZWN0IHJhdGlvLlxyXG4gIC8vIE5vdGFibHksIHRoaXMgaXMgdXNlZCBpbiBSb3VuZEJ1dHRvbiwgc28gdGhhdCB0aGUgYnV0dG9uIGlzIGFsd2F5cyBhIGNpcmNsZS5cclxuICBhc3BlY3RSYXRpbz86IG51bWJlciB8IG51bGw7XHJcbn07XHJcbnR5cGUgUGFyZW50T3B0aW9ucyA9IFNpemFibGVPcHRpb25zICYgVm9pY2luZ09wdGlvbnMgJiBOb2RlT3B0aW9ucztcclxuXHJcbi8vIE5vcm1hbCBvcHRpb25zLCBmb3IgdXNlIGluIG9wdGlvbml6ZVxyXG5leHBvcnQgdHlwZSBCdXR0b25Ob2RlT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgUGFyZW50T3B0aW9ucztcclxuXHJcbi8vIEhvd2V2ZXIgd2UnbGwgd2FudCBzdWJ0eXBlcyB0byBwcm92aWRlIHRoZXNlIG9wdGlvbnMgdG8gdGhlaXIgY2xpZW50cywgc2luY2Ugc29tZSBvcHRpb25zIGlkZWFsbHkgc2hvdWxkIG5vdCBiZVxyXG4vLyB1c2VkIGRpcmVjdGx5LlxyXG5leHBvcnQgdHlwZSBFeHRlcm5hbEJ1dHRvbk5vZGVPcHRpb25zID0gU3RyaWN0T21pdDxCdXR0b25Ob2RlT3B0aW9ucywgJ21pblVuc3Ryb2tlZFdpZHRoJyB8ICdtaW5VbnN0cm9rZWRIZWlnaHQnPjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJ1dHRvbk5vZGUgZXh0ZW5kcyBTaXphYmxlKCBWb2ljaW5nKCBOb2RlICkgKSB7XHJcblxyXG4gIHByb3RlY3RlZCBidXR0b25Nb2RlbDogQnV0dG9uTW9kZWw7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBfc2V0dGFibGVCYXNlQ29sb3JQcm9wZXJ0eTogUGFpbnRDb2xvclByb3BlcnR5O1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgX2Rpc2FibGVkQ29sb3JQcm9wZXJ0eTogUGFpbnRDb2xvclByb3BlcnR5O1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgYmFzZUNvbG9yUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PENvbG9yPjtcclxuICBwcml2YXRlIHJlYWRvbmx5IF9wcmVzc0xpc3RlbmVyOiBQcmVzc0xpc3RlbmVyO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzcG9zZUJ1dHRvbk5vZGU6ICgpID0+IHZvaWQ7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBjb250ZW50OiBOb2RlIHwgbnVsbDtcclxuICBwcml2YXRlIHJlYWRvbmx5IGJ1dHRvbk5vZGVDb25zdHJhaW50OiBCdXR0b25Ob2RlQ29uc3RyYWludCB8IG51bGwgPSBudWxsO1xyXG4gIHByb3RlY3RlZCByZWFkb25seSBsYXlvdXRTaXplUHJvcGVydHk6IFRpbnlQcm9wZXJ0eTxEaW1lbnNpb24yPjtcclxuXHJcbiAgLy8gVGhlIG1heGltdW0gbGluZVdpZHRoIG91ciBidXR0b25CYWNrZ3JvdW5kIGNhbiBoYXZlLiBXZSdsbCBsYXkgdGhpbmdzIG91dCBzbyB0aGF0IGlmIHdlIGFkanVzdCBvdXIgbGluZVdpZHRoIGJlbG93XHJcbiAgLy8gdGhpcywgdGhlIGxheW91dCB3b24ndCBjaGFuZ2VcclxuICBwcm90ZWN0ZWQgcmVhZG9ubHkgbWF4TGluZVdpZHRoOiBudW1iZXI7XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgRmxhdEFwcGVhcmFuY2VTdHJhdGVneTogVEJ1dHRvbkFwcGVhcmFuY2VTdHJhdGVneTtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIGJ1dHRvbk1vZGVsXHJcbiAgICogQHBhcmFtIGJ1dHRvbkJhY2tncm91bmQgLSB0aGUgYmFja2dyb3VuZCBvZiB0aGUgYnV0dG9uIChsaWtlIGEgY2lyY2xlIG9yIHJlY3RhbmdsZSkuXHJcbiAgICogQHBhcmFtIGludGVyYWN0aW9uU3RhdGVQcm9wZXJ0eSAtIGEgUHJvcGVydHkgdGhhdCBpcyB1c2VkIHRvIGRyaXZlIHRoZSB2aXN1YWwgYXBwZWFyYW5jZSBvZiB0aGUgYnV0dG9uXHJcbiAgICogQHBhcmFtIHByb3ZpZGVkT3B0aW9ucyAtIHRoaXMgdHlwZSBkb2VzIG5vdCBtdXRhdGUgaXRzIG9wdGlvbnMsIGJ1dCByZWxpZXMgb24gdGhlIHN1YnR5cGUgdG9cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgY29uc3RydWN0b3IoIGJ1dHRvbk1vZGVsOiBCdXR0b25Nb2RlbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbkJhY2tncm91bmQ6IFBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcmFjdGlvblN0YXRlUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PEJ1dHRvbkludGVyYWN0aW9uU3RhdGU+LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgcHJvdmlkZWRPcHRpb25zPzogQnV0dG9uTm9kZU9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxCdXR0b25Ob2RlT3B0aW9ucywgU3RyaWN0T21pdDxTZWxmT3B0aW9ucywgJ2xpc3RlbmVyT3B0aW9ucyc+LCBQYXJlbnRPcHRpb25zPigpKCB7XHJcblxyXG4gICAgICBjb250ZW50OiBudWxsLFxyXG4gICAgICBtaW5VbnN0cm9rZWRXaWR0aDogbnVsbCxcclxuICAgICAgbWluVW5zdHJva2VkSGVpZ2h0OiBudWxsLFxyXG4gICAgICB4TWFyZ2luOiAxMCxcclxuICAgICAgeU1hcmdpbjogNSxcclxuICAgICAgeEFsaWduOiAnY2VudGVyJyxcclxuICAgICAgeUFsaWduOiAnY2VudGVyJyxcclxuICAgICAgeENvbnRlbnRPZmZzZXQ6IDAsXHJcbiAgICAgIHlDb250ZW50T2Zmc2V0OiAwLFxyXG4gICAgICBiYXNlQ29sb3I6IENvbG9yQ29uc3RhbnRzLkxJR0hUX0JMVUUsXHJcbiAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxyXG4gICAgICBidXR0b25BcHBlYXJhbmNlU3RyYXRlZ3k6IEJ1dHRvbk5vZGUuRmxhdEFwcGVhcmFuY2VTdHJhdGVneSxcclxuICAgICAgYnV0dG9uQXBwZWFyYW5jZVN0cmF0ZWd5T3B0aW9uczoge30sXHJcbiAgICAgIGNvbnRlbnRBcHBlYXJhbmNlU3RyYXRlZ3k6IG51bGwsXHJcbiAgICAgIGNvbnRlbnRBcHBlYXJhbmNlU3RyYXRlZ3lPcHRpb25zOiB7fSxcclxuICAgICAgZW5hYmxlZEFwcGVhcmFuY2VTdHJhdGVneTogKCBlbmFibGVkLCBidXR0b24sIGJhY2tncm91bmQsIGNvbnRlbnQgKSA9PiB7XHJcbiAgICAgICAgYmFja2dyb3VuZC5maWx0ZXJzID0gZW5hYmxlZCA/IFtdIDogWyBDT05UUkFTVF9GSUxURVIsIEJSSUdIVE5FU1NfRklMVEVSIF07XHJcblxyXG4gICAgICAgIGlmICggY29udGVudCApIHtcclxuICAgICAgICAgIGNvbnRlbnQuZmlsdGVycyA9IGVuYWJsZWQgPyBbXSA6IFsgR3JheXNjYWxlLkZVTEwgXTtcclxuICAgICAgICAgIGNvbnRlbnQub3BhY2l0eSA9IGVuYWJsZWQgPyAxIDogU2NlbmVyeUNvbnN0YW50cy5ESVNBQkxFRF9PUEFDSVRZO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgZGlzYWJsZWRDb2xvcjogQ29sb3JDb25zdGFudHMuTElHSFRfR1JBWSxcclxuICAgICAgYXNwZWN0UmF0aW86IG51bGwsXHJcblxyXG4gICAgICAvLyBwZG9tXHJcbiAgICAgIHRhZ05hbWU6ICdidXR0b24nLFxyXG5cclxuICAgICAgLy8gcGhldC1pb1xyXG4gICAgICB0YW5kZW1OYW1lU3VmZml4OiAnQnV0dG9uJyxcclxuICAgICAgdmlzaWJsZVByb3BlcnR5T3B0aW9uczogeyBwaGV0aW9GZWF0dXJlZDogdHJ1ZSB9LFxyXG4gICAgICBwaGV0aW9FbmFibGVkUHJvcGVydHlJbnN0cnVtZW50ZWQ6IHRydWUgLy8gb3B0IGludG8gZGVmYXVsdCBQaEVULWlPIGluc3RydW1lbnRlZCBlbmFibGVkUHJvcGVydHlcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIG9wdGlvbnMubGlzdGVuZXJPcHRpb25zID0gY29tYmluZU9wdGlvbnM8UHJlc3NMaXN0ZW5lck9wdGlvbnM+KCB7XHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0/LmNyZWF0ZVRhbmRlbSggJ3ByZXNzTGlzdGVuZXInIClcclxuICAgIH0sIG9wdGlvbnMubGlzdGVuZXJPcHRpb25zICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIG9wdGlvbnMuZW5hYmxlZFByb3BlcnR5ICYmIGFzc2VydCggb3B0aW9ucy5lbmFibGVkUHJvcGVydHkgPT09IGJ1dHRvbk1vZGVsLmVuYWJsZWRQcm9wZXJ0eSxcclxuICAgICAgJ2lmIG9wdGlvbnMuZW5hYmxlZFByb3BlcnR5IGlzIHByb3ZpZGVkLCBpdCBtdXN0ID09PSBidXR0b25Nb2RlbC5lbmFibGVkUHJvcGVydHknICk7XHJcbiAgICBvcHRpb25zLmVuYWJsZWRQcm9wZXJ0eSA9IGJ1dHRvbk1vZGVsLmVuYWJsZWRQcm9wZXJ0eTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLmFzcGVjdFJhdGlvID09PSBudWxsIHx8ICggaXNGaW5pdGUoIG9wdGlvbnMuYXNwZWN0UmF0aW8gKSAmJiBvcHRpb25zLmFzcGVjdFJhdGlvID4gMCApLFxyXG4gICAgICBgQnV0dG9uTm9kZSBhc3BlY3RSYXRpbyBzaG91bGQgYmUgYSBwb3NpdGl2ZSBmaW5pdGUgdmFsdWUgaWYgbm9uLW51bGwuIEluc3RlYWQgcmVjZWl2ZWQgJHtvcHRpb25zLmFzcGVjdFJhdGlvfS5gICk7XHJcblxyXG4gICAgc3VwZXIoKTtcclxuXHJcbiAgICB0aGlzLmNvbnRlbnQgPSBvcHRpb25zLmNvbnRlbnQ7XHJcbiAgICB0aGlzLmJ1dHRvbk1vZGVsID0gYnV0dG9uTW9kZWw7XHJcblxyXG4gICAgdGhpcy5fc2V0dGFibGVCYXNlQ29sb3JQcm9wZXJ0eSA9IG5ldyBQYWludENvbG9yUHJvcGVydHkoIG9wdGlvbnMuYmFzZUNvbG9yICk7XHJcbiAgICB0aGlzLl9kaXNhYmxlZENvbG9yUHJvcGVydHkgPSBuZXcgUGFpbnRDb2xvclByb3BlcnR5KCBvcHRpb25zLmRpc2FibGVkQ29sb3IgKTtcclxuXHJcbiAgICB0aGlzLmJhc2VDb2xvclByb3BlcnR5ID0gbmV3IERlcml2ZWRQcm9wZXJ0eSggW1xyXG4gICAgICB0aGlzLl9zZXR0YWJsZUJhc2VDb2xvclByb3BlcnR5LFxyXG4gICAgICB0aGlzLmVuYWJsZWRQcm9wZXJ0eSxcclxuICAgICAgdGhpcy5fZGlzYWJsZWRDb2xvclByb3BlcnR5XHJcbiAgICBdLCAoIGNvbG9yLCBlbmFibGVkLCBkaXNhYmxlZENvbG9yICkgPT4ge1xyXG4gICAgICByZXR1cm4gZW5hYmxlZCA/IGNvbG9yIDogZGlzYWJsZWRDb2xvcjtcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLl9wcmVzc0xpc3RlbmVyID0gYnV0dG9uTW9kZWwuY3JlYXRlUHJlc3NMaXN0ZW5lciggb3B0aW9ucy5saXN0ZW5lck9wdGlvbnMgKTtcclxuICAgIHRoaXMuYWRkSW5wdXRMaXN0ZW5lciggdGhpcy5fcHJlc3NMaXN0ZW5lciApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGJ1dHRvbkJhY2tncm91bmQuZmlsbCA9PT0gbnVsbCwgJ0J1dHRvbk5vZGUgY29udHJvbHMgdGhlIGZpbGwgZm9yIHRoZSBidXR0b25CYWNrZ3JvdW5kJyApO1xyXG4gICAgYnV0dG9uQmFja2dyb3VuZC5maWxsID0gdGhpcy5iYXNlQ29sb3JQcm9wZXJ0eTtcclxuICAgIHRoaXMuYWRkQ2hpbGQoIGJ1dHRvbkJhY2tncm91bmQgKTtcclxuXHJcbiAgICAvLyBIb29rIHVwIHRoZSBzdHJhdGVneSB0aGF0IHdpbGwgY29udHJvbCB0aGUgYnV0dG9uJ3MgYXBwZWFyYW5jZS5cclxuICAgIGNvbnN0IGJ1dHRvbkFwcGVhcmFuY2VTdHJhdGVneSA9IG5ldyBvcHRpb25zLmJ1dHRvbkFwcGVhcmFuY2VTdHJhdGVneShcclxuICAgICAgYnV0dG9uQmFja2dyb3VuZCxcclxuICAgICAgaW50ZXJhY3Rpb25TdGF0ZVByb3BlcnR5LFxyXG4gICAgICB0aGlzLmJhc2VDb2xvclByb3BlcnR5LFxyXG4gICAgICBvcHRpb25zLmJ1dHRvbkFwcGVhcmFuY2VTdHJhdGVneU9wdGlvbnNcclxuICAgICk7XHJcblxyXG4gICAgLy8gT3B0aW9uYWxseSBob29rIHVwIHRoZSBzdHJhdGVneSB0aGF0IHdpbGwgY29udHJvbCB0aGUgY29udGVudCdzIGFwcGVhcmFuY2UuXHJcbiAgICBsZXQgY29udGVudEFwcGVhcmFuY2VTdHJhdGVneTogSW5zdGFuY2VUeXBlPFRDb250ZW50QXBwZWFyYW5jZVN0cmF0ZWd5PjtcclxuICAgIGlmICggb3B0aW9ucy5jb250ZW50QXBwZWFyYW5jZVN0cmF0ZWd5ICYmIG9wdGlvbnMuY29udGVudCApIHtcclxuICAgICAgY29udGVudEFwcGVhcmFuY2VTdHJhdGVneSA9IG5ldyBvcHRpb25zLmNvbnRlbnRBcHBlYXJhbmNlU3RyYXRlZ3koXHJcbiAgICAgICAgb3B0aW9ucy5jb250ZW50LFxyXG4gICAgICAgIGludGVyYWN0aW9uU3RhdGVQcm9wZXJ0eSwgb3B0aW9ucy5jb250ZW50QXBwZWFyYW5jZVN0cmF0ZWd5T3B0aW9uc1xyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCBvdXIgbWF4TGluZVdpZHRoIGZyb20gdGhlIGFwcGVhcmFuY2Ugc3RyYXRlZ3ksIGFzIGl0J3MgbmVlZGVkIGZvciBsYXlvdXQgKGFuZCBpbiBzdWJ0eXBlcylcclxuICAgIHRoaXMubWF4TGluZVdpZHRoID0gYnV0dG9uQXBwZWFyYW5jZVN0cmF0ZWd5Lm1heExpbmVXaWR0aDtcclxuXHJcbiAgICBsZXQgYWxpZ25Cb3g6IEFsaWduQm94IHwgbnVsbCA9IG51bGw7XHJcbiAgICBsZXQgdXBkYXRlQWxpZ25Cb3VuZHM6IFVua25vd25NdWx0aWxpbmsgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgICBpZiAoIG9wdGlvbnMuY29udGVudCApIHtcclxuXHJcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBvcHRpb25zLmNvbnRlbnQ7XHJcblxyXG4gICAgICAvLyBGb3IgcGVyZm9ybWFuY2UsIGluIGNhc2UgY29udGVudCBpcyBhIGNvbXBsaWNhdGVkIGljb24gb3Igc2hhcGUuXHJcbiAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc3VuL2lzc3Vlcy82NTQjaXNzdWVjb21tZW50LTcxODk0NDY2OVxyXG4gICAgICBjb250ZW50LnBpY2thYmxlID0gZmFsc2U7XHJcblxyXG4gICAgICB0aGlzLmJ1dHRvbk5vZGVDb25zdHJhaW50ID0gbmV3IEJ1dHRvbk5vZGVDb25zdHJhaW50KCB0aGlzLCB7XHJcbiAgICAgICAgY29udGVudDogb3B0aW9ucy5jb250ZW50LFxyXG4gICAgICAgIHhNYXJnaW46IG9wdGlvbnMueE1hcmdpbixcclxuICAgICAgICB5TWFyZ2luOiBvcHRpb25zLnlNYXJnaW4sXHJcbiAgICAgICAgbWF4TGluZVdpZHRoOiB0aGlzLm1heExpbmVXaWR0aCxcclxuICAgICAgICBtaW5VbnN0cm9rZWRXaWR0aDogb3B0aW9ucy5taW5VbnN0cm9rZWRXaWR0aCxcclxuICAgICAgICBtaW5VbnN0cm9rZWRIZWlnaHQ6IG9wdGlvbnMubWluVW5zdHJva2VkSGVpZ2h0LFxyXG4gICAgICAgIGFzcGVjdFJhdGlvOiBvcHRpb25zLmFzcGVjdFJhdGlvXHJcbiAgICAgIH0gKTtcclxuICAgICAgdGhpcy5sYXlvdXRTaXplUHJvcGVydHkgPSB0aGlzLmJ1dHRvbk5vZGVDb25zdHJhaW50LmxheW91dFNpemVQcm9wZXJ0eTtcclxuXHJcbiAgICAgIC8vIEFsaWduIGNvbnRlbnQgaW4gdGhlIGJ1dHRvbiByZWN0YW5nbGUuIE11c3QgYmUgZGlzcG9zZWQgc2luY2UgaXQgYWRkcyBsaXN0ZW5lciB0byBjb250ZW50IGJvdW5kcy5cclxuICAgICAgYWxpZ25Cb3ggPSBuZXcgQWxpZ25Cb3goIGNvbnRlbnQsIHtcclxuICAgICAgICB4QWxpZ246IG9wdGlvbnMueEFsaWduLFxyXG4gICAgICAgIHlBbGlnbjogb3B0aW9ucy55QWxpZ24sXHJcblxyXG4gICAgICAgIC8vIEFwcGx5IG9mZnNldHMgdmlhIG1hcmdpbnMsIHNvIHRoYXQgYm91bmRzIG9mIHRoZSBBbGlnbkJveCBkb2Vzbid0IHVubmVjZXNzYXJpbHkgZXh0ZW5kIHBhc3QgdGhlXHJcbiAgICAgICAgLy8gYnV0dG9uQmFja2dyb3VuZC4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zdW4vaXNzdWVzLzY0OVxyXG4gICAgICAgIGxlZnRNYXJnaW46IG9wdGlvbnMueE1hcmdpbiArIG9wdGlvbnMueENvbnRlbnRPZmZzZXQsXHJcbiAgICAgICAgcmlnaHRNYXJnaW46IG9wdGlvbnMueE1hcmdpbiAtIG9wdGlvbnMueENvbnRlbnRPZmZzZXQsXHJcbiAgICAgICAgdG9wTWFyZ2luOiBvcHRpb25zLnlNYXJnaW4gKyBvcHRpb25zLnlDb250ZW50T2Zmc2V0LFxyXG4gICAgICAgIGJvdHRvbU1hcmdpbjogb3B0aW9ucy55TWFyZ2luIC0gb3B0aW9ucy55Q29udGVudE9mZnNldFxyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICAvLyBEeW5hbWljYWxseSBhZGp1c3QgYWxpZ25Cb3VuZHMuXHJcbiAgICAgIHVwZGF0ZUFsaWduQm91bmRzID0gTXVsdGlsaW5rLm11bHRpbGluayhcclxuICAgICAgICBbIGJ1dHRvbkJhY2tncm91bmQuYm91bmRzUHJvcGVydHksIHRoaXMubGF5b3V0U2l6ZVByb3BlcnR5IF0sXHJcbiAgICAgICAgKCBiYWNrZ3JvdW5kQm91bmRzLCBzaXplICkgPT4ge1xyXG4gICAgICAgICAgYWxpZ25Cb3ghLmFsaWduQm91bmRzID0gQm91bmRzMi5wb2ludCggYmFja2dyb3VuZEJvdW5kcy5jZW50ZXIgKS5kaWxhdGVkWFkoIHNpemUud2lkdGggLyAyLCBzaXplLmhlaWdodCAvIDIgKTtcclxuICAgICAgICB9XHJcbiAgICAgICk7XHJcbiAgICAgIHRoaXMuYWRkQ2hpbGQoIGFsaWduQm94ICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5taW5VbnN0cm9rZWRXaWR0aCAhPT0gbnVsbCApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLm1pblVuc3Ryb2tlZEhlaWdodCAhPT0gbnVsbCApO1xyXG5cclxuICAgICAgdGhpcy5sYXlvdXRTaXplUHJvcGVydHkgPSBuZXcgVGlueVByb3BlcnR5KCBuZXcgRGltZW5zaW9uMihcclxuICAgICAgICBvcHRpb25zLm1pblVuc3Ryb2tlZFdpZHRoISArIHRoaXMubWF4TGluZVdpZHRoLFxyXG4gICAgICAgIG9wdGlvbnMubWluVW5zdHJva2VkSGVpZ2h0ISArIHRoaXMubWF4TGluZVdpZHRoXHJcbiAgICAgICkgKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLm11dGF0ZSggb3B0aW9ucyApO1xyXG5cclxuICAgIC8vIE5vIG5lZWQgdG8gZGlzcG9zZSBiZWNhdXNlIGVuYWJsZWRQcm9wZXJ0eSBpcyBkaXNwb3NlZCBpbiBOb2RlXHJcbiAgICB0aGlzLmVuYWJsZWRQcm9wZXJ0eS5saW5rKCBlbmFibGVkID0+IG9wdGlvbnMuZW5hYmxlZEFwcGVhcmFuY2VTdHJhdGVneSggZW5hYmxlZCwgdGhpcywgYnV0dG9uQmFja2dyb3VuZCwgYWxpZ25Cb3ggKSApO1xyXG5cclxuICAgIHRoaXMuZGlzcG9zZUJ1dHRvbk5vZGUgPSAoKSA9PiB7XHJcbiAgICAgIGFsaWduQm94ICYmIGFsaWduQm94LmRpc3Bvc2UoKTtcclxuICAgICAgdXBkYXRlQWxpZ25Cb3VuZHMgJiYgdXBkYXRlQWxpZ25Cb3VuZHMuZGlzcG9zZSgpO1xyXG4gICAgICBidXR0b25BcHBlYXJhbmNlU3RyYXRlZ3kuZGlzcG9zZSAmJiBidXR0b25BcHBlYXJhbmNlU3RyYXRlZ3kuZGlzcG9zZSgpO1xyXG4gICAgICBjb250ZW50QXBwZWFyYW5jZVN0cmF0ZWd5ICYmIGNvbnRlbnRBcHBlYXJhbmNlU3RyYXRlZ3kuZGlzcG9zZSAmJiBjb250ZW50QXBwZWFyYW5jZVN0cmF0ZWd5LmRpc3Bvc2UoKTtcclxuICAgICAgdGhpcy5fcHJlc3NMaXN0ZW5lci5kaXNwb3NlKCk7XHJcbiAgICAgIHRoaXMuYmFzZUNvbG9yUHJvcGVydHkuZGlzcG9zZSgpO1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5idXR0b25Ob2RlQ29uc3RyYWludCAmJiB0aGlzLmJ1dHRvbk5vZGVDb25zdHJhaW50LmRpc3Bvc2UoKTtcclxuXHJcbiAgICB0aGlzLmRpc3Bvc2VCdXR0b25Ob2RlKCk7XHJcbiAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBiYXNlIGNvbG9yLCB3aGljaCBpcyB0aGUgbWFpbiBiYWNrZ3JvdW5kIGZpbGwgY29sb3IgdXNlZCBmb3IgdGhlIGJ1dHRvbi5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0QmFzZUNvbG9yKCBiYXNlQ29sb3I6IFRDb2xvciApOiB2b2lkIHsgdGhpcy5fc2V0dGFibGVCYXNlQ29sb3JQcm9wZXJ0eS5wYWludCA9IGJhc2VDb2xvcjsgfVxyXG5cclxuICBwdWJsaWMgc2V0IGJhc2VDb2xvciggYmFzZUNvbG9yOiBUQ29sb3IgKSB7IHRoaXMuc2V0QmFzZUNvbG9yKCBiYXNlQ29sb3IgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGJhc2VDb2xvcigpOiBUQ29sb3IgeyByZXR1cm4gdGhpcy5nZXRCYXNlQ29sb3IoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBiYXNlIGNvbG9yIGZvciB0aGlzIGJ1dHRvbi5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0QmFzZUNvbG9yKCk6IFRDb2xvciB7IHJldHVybiB0aGlzLl9zZXR0YWJsZUJhc2VDb2xvclByb3BlcnR5LnBhaW50IGFzIFRDb2xvcjsgfVxyXG5cclxuICAvKipcclxuICAgKiBNYW51YWxseSBjbGljayB0aGUgYnV0dG9uLCBhcyBpdCB3b3VsZCBiZSBjbGlja2VkIGluIHJlc3BvbnNlIHRvIGFsdGVybmF0aXZlIGlucHV0LiBSZWNvbW1lbmRlZCBvbmx5IGZvclxyXG4gICAqIGFjY2Vzc2liaWxpdHkgdXNhZ2VzLiBGb3IgdGhlIG1vc3QgcGFydCwgUERPTSBidXR0b24gZnVuY3Rpb25hbGl0eSBzaG91bGQgYmUgbWFuYWdlZCBieSBQcmVzc0xpc3RlbmVyLCB0aGlzIHNob3VsZFxyXG4gICAqIHJhcmVseSBiZSB1c2VkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBwZG9tQ2xpY2soKTogdm9pZCB7XHJcbiAgICB0aGlzLl9wcmVzc0xpc3RlbmVyLmNsaWNrKCBudWxsICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJcyB0aGUgYnV0dG9uIGN1cnJlbnRseSBmaXJpbmcgYmVjYXVzZSBvZiBhY2Nlc3NpYmlsaXR5IGlucHV0IGNvbWluZyBmcm9tIHRoZSBQRE9NP1xyXG4gICAqL1xyXG4gIHB1YmxpYyBpc1BET01DbGlja2luZygpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl9wcmVzc0xpc3RlbmVyLnBkb21DbGlja2luZ1Byb3BlcnR5LmdldCgpO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEZsYXRBcHBlYXJhbmNlU3RyYXRlZ3kgaXMgYSB2YWx1ZSBmb3IgQnV0dG9uTm9kZSBvcHRpb25zLmJ1dHRvbkFwcGVhcmFuY2VTdHJhdGVneS4gSXQgbWFrZXMgYVxyXG4gKiBidXR0b24gbG9vayBmbGF0LCBpLmUuIG5vIHNoYWRpbmcgb3IgaGlnaGxpZ2h0aW5nLCB3aXRoIGNvbG9yIGNoYW5nZXMgb24gbW91c2VvdmVyLCBwcmVzcywgZXRjLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEZsYXRBcHBlYXJhbmNlU3RyYXRlZ3kge1xyXG5cclxuICBwdWJsaWMgcmVhZG9ubHkgbWF4TGluZVdpZHRoOiBudW1iZXI7XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzcG9zZUZsYXRBcHBlYXJhbmNlU3RyYXRlZ3k6ICgpID0+IHZvaWQ7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBidXR0b25CYWNrZ3JvdW5kIC0gdGhlIE5vZGUgZm9yIHRoZSBidXR0b24ncyBiYWNrZ3JvdW5kLCBzYW5zIGNvbnRlbnRcclxuICAgKiBAcGFyYW0gaW50ZXJhY3Rpb25TdGF0ZVByb3BlcnR5IC0gaW50ZXJhY3Rpb24gc3RhdGUsIHVzZWQgdG8gdHJpZ2dlciB1cGRhdGVzXHJcbiAgICogQHBhcmFtIGJhc2VDb2xvclByb3BlcnR5IC0gYmFzZSBjb2xvciBmcm9tIHdoaWNoIG90aGVyIGNvbG9ycyBhcmUgZGVyaXZlZFxyXG4gICAqIEBwYXJhbSBbcHJvdmlkZWRPcHRpb25zXVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggYnV0dG9uQmFja2dyb3VuZDogUGFpbnRhYmxlTm9kZSxcclxuICAgICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uU3RhdGVQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8QnV0dG9uSW50ZXJhY3Rpb25TdGF0ZT4sXHJcbiAgICAgICAgICAgICAgICAgICAgICBiYXNlQ29sb3JQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8Q29sb3I+LFxyXG4gICAgICAgICAgICAgICAgICAgICAgcHJvdmlkZWRPcHRpb25zPzogVEJ1dHRvbkFwcGVhcmFuY2VTdHJhdGVneU9wdGlvbnMgKSB7XHJcblxyXG4gICAgLy8gZHluYW1pYyBjb2xvcnNcclxuICAgIGNvbnN0IGJhc2VCcmlnaHRlcjRQcm9wZXJ0eSA9IG5ldyBQYWludENvbG9yUHJvcGVydHkoIGJhc2VDb2xvclByb3BlcnR5LCB7IGx1bWluYW5jZUZhY3RvcjogMC40IH0gKTtcclxuICAgIGNvbnN0IGJhc2VEYXJrZXI0UHJvcGVydHkgPSBuZXcgUGFpbnRDb2xvclByb3BlcnR5KCBiYXNlQ29sb3JQcm9wZXJ0eSwgeyBsdW1pbmFuY2VGYWN0b3I6IC0wLjQgfSApO1xyXG5cclxuICAgIC8vIHZhcmlvdXMgZmlsbHMgdGhhdCBhcmUgdXNlZCB0byBhbHRlciB0aGUgYnV0dG9uJ3MgYXBwZWFyYW5jZVxyXG4gICAgY29uc3QgdXBGaWxsUHJvcGVydHkgPSBiYXNlQ29sb3JQcm9wZXJ0eTtcclxuICAgIGNvbnN0IG92ZXJGaWxsUHJvcGVydHkgPSBiYXNlQnJpZ2h0ZXI0UHJvcGVydHk7XHJcbiAgICBjb25zdCBkb3duRmlsbFByb3BlcnR5ID0gYmFzZURhcmtlcjRQcm9wZXJ0eTtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gY29tYmluZU9wdGlvbnM8VEJ1dHRvbkFwcGVhcmFuY2VTdHJhdGVneU9wdGlvbnM+KCB7XHJcbiAgICAgIHN0cm9rZTogYmFzZURhcmtlcjRQcm9wZXJ0eVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgY29uc3QgbGluZVdpZHRoID0gdHlwZW9mIG9wdGlvbnMubGluZVdpZHRoID09PSAnbnVtYmVyJyA/IG9wdGlvbnMubGluZVdpZHRoIDogMTtcclxuXHJcbiAgICAvLyBJZiB0aGUgc3Ryb2tlIHdhc24ndCBwcm92aWRlZCwgc2V0IGEgZGVmYXVsdC5cclxuICAgIGJ1dHRvbkJhY2tncm91bmQuc3Ryb2tlID0gb3B0aW9ucy5zdHJva2UgfHwgYmFzZURhcmtlcjRQcm9wZXJ0eTtcclxuICAgIGJ1dHRvbkJhY2tncm91bmQubGluZVdpZHRoID0gbGluZVdpZHRoO1xyXG5cclxuICAgIHRoaXMubWF4TGluZVdpZHRoID0gYnV0dG9uQmFja2dyb3VuZC5oYXNTdHJva2UoKSA/IGxpbmVXaWR0aCA6IDA7XHJcblxyXG4gICAgLy8gQ2FjaGUgY29sb3JzXHJcbiAgICBidXR0b25CYWNrZ3JvdW5kLmNhY2hlZFBhaW50cyA9IFsgdXBGaWxsUHJvcGVydHksIG92ZXJGaWxsUHJvcGVydHksIGRvd25GaWxsUHJvcGVydHkgXTtcclxuXHJcbiAgICAvLyBDaGFuZ2UgY29sb3JzIHRvIG1hdGNoIGludGVyYWN0aW9uU3RhdGVcclxuICAgIGZ1bmN0aW9uIGludGVyYWN0aW9uU3RhdGVMaXN0ZW5lciggaW50ZXJhY3Rpb25TdGF0ZTogQnV0dG9uSW50ZXJhY3Rpb25TdGF0ZSApOiB2b2lkIHtcclxuICAgICAgc3dpdGNoKCBpbnRlcmFjdGlvblN0YXRlICkge1xyXG5cclxuICAgICAgICBjYXNlIEJ1dHRvbkludGVyYWN0aW9uU3RhdGUuSURMRTpcclxuICAgICAgICAgIGJ1dHRvbkJhY2tncm91bmQuZmlsbCA9IHVwRmlsbFByb3BlcnR5O1xyXG4gICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgIGNhc2UgQnV0dG9uSW50ZXJhY3Rpb25TdGF0ZS5PVkVSOlxyXG4gICAgICAgICAgYnV0dG9uQmFja2dyb3VuZC5maWxsID0gb3ZlckZpbGxQcm9wZXJ0eTtcclxuICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICBjYXNlIEJ1dHRvbkludGVyYWN0aW9uU3RhdGUuUFJFU1NFRDpcclxuICAgICAgICAgIGJ1dHRvbkJhY2tncm91bmQuZmlsbCA9IGRvd25GaWxsUHJvcGVydHk7XHJcbiAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciggYHVuc3VwcG9ydGVkIGludGVyYWN0aW9uU3RhdGU6ICR7aW50ZXJhY3Rpb25TdGF0ZX1gICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBEbyB0aGUgaW5pdGlhbCB1cGRhdGUgZXhwbGljaXRseSwgdGhlbiBsYXp5IGxpbmsgdG8gdGhlIHByb3BlcnRpZXMuICBUaGlzIGtlZXBzIHRoZSBudW1iZXIgb2YgaW5pdGlhbCB1cGRhdGVzIHRvXHJcbiAgICAvLyBhIG1pbmltdW0gYW5kIGFsbG93cyB1cyB0byB1cGRhdGUgc29tZSBvcHRpbWl6YXRpb24gZmxhZ3MgdGhlIGZpcnN0IHRpbWUgdGhlIGJhc2UgY29sb3IgaXMgYWN0dWFsbHkgY2hhbmdlZC5cclxuICAgIGludGVyYWN0aW9uU3RhdGVQcm9wZXJ0eS5saW5rKCBpbnRlcmFjdGlvblN0YXRlTGlzdGVuZXIgKTtcclxuXHJcbiAgICB0aGlzLmRpc3Bvc2VGbGF0QXBwZWFyYW5jZVN0cmF0ZWd5ID0gKCkgPT4ge1xyXG4gICAgICBpZiAoIGludGVyYWN0aW9uU3RhdGVQcm9wZXJ0eS5oYXNMaXN0ZW5lciggaW50ZXJhY3Rpb25TdGF0ZUxpc3RlbmVyICkgKSB7XHJcbiAgICAgICAgaW50ZXJhY3Rpb25TdGF0ZVByb3BlcnR5LnVubGluayggaW50ZXJhY3Rpb25TdGF0ZUxpc3RlbmVyICk7XHJcbiAgICAgIH1cclxuICAgICAgYmFzZUJyaWdodGVyNFByb3BlcnR5LmRpc3Bvc2UoKTtcclxuICAgICAgYmFzZURhcmtlcjRQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmRpc3Bvc2VGbGF0QXBwZWFyYW5jZVN0cmF0ZWd5KCk7XHJcbiAgfVxyXG59XHJcblxyXG50eXBlIEJ1dHRvbk5vZGVDb25zdHJhaW50T3B0aW9ucyA9IHtcclxuICBjb250ZW50OiBOb2RlO1xyXG4gIHhNYXJnaW46IG51bWJlcjtcclxuICB5TWFyZ2luOiBudW1iZXI7XHJcbiAgbWF4TGluZVdpZHRoOiBudW1iZXI7XHJcbiAgbWluVW5zdHJva2VkV2lkdGg6IG51bWJlciB8IG51bGw7XHJcbiAgbWluVW5zdHJva2VkSGVpZ2h0OiBudW1iZXIgfCBudWxsO1xyXG4gIGFzcGVjdFJhdGlvOiBudW1iZXIgfCBudWxsO1xyXG59O1xyXG5cclxuY2xhc3MgQnV0dG9uTm9kZUNvbnN0cmFpbnQgZXh0ZW5kcyBMYXlvdXRDb25zdHJhaW50IHtcclxuXHJcbiAgcHVibGljIHJlYWRvbmx5IGxheW91dFNpemVQcm9wZXJ0eTogVGlueVByb3BlcnR5PERpbWVuc2lvbjI+ID0gbmV3IFRpbnlQcm9wZXJ0eTxEaW1lbnNpb24yPiggbmV3IERpbWVuc2lvbjIoIDAsIDAgKSApO1xyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IGJ1dHRvbk5vZGU6IEJ1dHRvbk5vZGU7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBjb250ZW50OiBOb2RlO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgeE1hcmdpbjogbnVtYmVyO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgeU1hcmdpbjogbnVtYmVyO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgbWF4TGluZVdpZHRoOiBudW1iZXI7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBtaW5VbnN0cm9rZWRXaWR0aDogbnVtYmVyIHwgbnVsbDtcclxuICBwcml2YXRlIHJlYWRvbmx5IG1pblVuc3Ryb2tlZEhlaWdodDogbnVtYmVyIHwgbnVsbDtcclxuICBwcml2YXRlIHJlYWRvbmx5IGFzcGVjdFJhdGlvOiBudW1iZXIgfCBudWxsO1xyXG4gIHByaXZhdGUgaXNGaXJzdExheW91dCA9IHRydWU7XHJcblxyXG4gIC8vIFN0b3JlZCBzbyB0aGF0IHdlIGNhbiBwcmV2ZW50IHVwZGF0ZXMgaWYgd2UncmUgbm90IG1hcmtlZCBzaXphYmxlIGluIGEgY2VydGFpbiBkaXJlY3Rpb25cclxuICBwcml2YXRlIGxhc3RMb2NhbFByZWZlcnJlZFdpZHRoID0gMDtcclxuICBwcml2YXRlIGxhc3RMb2NhbFByZWZlcnJlZEhlaWdodCA9IDA7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggYnV0dG9uTm9kZTogQnV0dG9uTm9kZSwgb3B0aW9uczogQnV0dG9uTm9kZUNvbnN0cmFpbnRPcHRpb25zICkge1xyXG5cclxuICAgIHN1cGVyKCBidXR0b25Ob2RlICk7XHJcblxyXG4gICAgLy8gU2F2ZSBldmVyeXRoaW5nLCBzbyB3ZSBjYW4gcnVuIHRoaW5ncyBpbiB0aGUgbGF5b3V0IG1ldGhvZFxyXG4gICAgdGhpcy5idXR0b25Ob2RlID0gYnV0dG9uTm9kZTtcclxuICAgIHRoaXMuY29udGVudCA9IG9wdGlvbnMuY29udGVudDtcclxuICAgIHRoaXMueE1hcmdpbiA9IG9wdGlvbnMueE1hcmdpbjtcclxuICAgIHRoaXMueU1hcmdpbiA9IG9wdGlvbnMueU1hcmdpbjtcclxuICAgIHRoaXMubWF4TGluZVdpZHRoID0gb3B0aW9ucy5tYXhMaW5lV2lkdGg7XHJcbiAgICB0aGlzLm1pblVuc3Ryb2tlZFdpZHRoID0gb3B0aW9ucy5taW5VbnN0cm9rZWRXaWR0aDtcclxuICAgIHRoaXMubWluVW5zdHJva2VkSGVpZ2h0ID0gb3B0aW9ucy5taW5VbnN0cm9rZWRIZWlnaHQ7XHJcbiAgICB0aGlzLmFzcGVjdFJhdGlvID0gb3B0aW9ucy5hc3BlY3RSYXRpbztcclxuXHJcbiAgICB0aGlzLmJ1dHRvbk5vZGUubG9jYWxQcmVmZXJyZWRXaWR0aFByb3BlcnR5LmxhenlMaW5rKCB0aGlzLl91cGRhdGVMYXlvdXRMaXN0ZW5lciApO1xyXG4gICAgdGhpcy5idXR0b25Ob2RlLmxvY2FsUHJlZmVycmVkSGVpZ2h0UHJvcGVydHkubGF6eUxpbmsoIHRoaXMuX3VwZGF0ZUxheW91dExpc3RlbmVyICk7XHJcblxyXG4gICAgdGhpcy5hZGROb2RlKCB0aGlzLmNvbnRlbnQsIGZhbHNlICk7XHJcblxyXG4gICAgdGhpcy5sYXlvdXQoKTtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBvdmVycmlkZSBsYXlvdXQoKTogdm9pZCB7XHJcbiAgICBzdXBlci5sYXlvdXQoKTtcclxuXHJcbiAgICBjb25zdCBidXR0b25Ob2RlID0gdGhpcy5idXR0b25Ob2RlO1xyXG4gICAgY29uc3QgY29udGVudCA9IHRoaXMuY29udGVudDtcclxuXHJcbiAgICAvLyBPbmx5IGFsbG93IGFuIGluaXRpYWwgdXBkYXRlIGlmIHdlIGFyZSBub3Qgc2l6YWJsZSBpbiB0aGF0IGRpbWVuc2lvblxyXG4gICAgbGV0IG1pbmltdW1XaWR0aCA9IE1hdGgubWF4KFxyXG4gICAgICAoIHRoaXMuaXNGaXJzdExheW91dCB8fCBidXR0b25Ob2RlLndpZHRoU2l6YWJsZSApXHJcbiAgICAgID8gKCBpc1dpZHRoU2l6YWJsZSggY29udGVudCApID8gY29udGVudC5taW5pbXVtV2lkdGggfHwgMCA6IGNvbnRlbnQud2lkdGggKSArIHRoaXMueE1hcmdpbiAqIDJcclxuICAgICAgOiBidXR0b25Ob2RlLmxvY2FsTWluaW11bVdpZHRoISxcclxuICAgICAgKCB0aGlzLm1pblVuc3Ryb2tlZFdpZHRoID09PSBudWxsID8gMCA6IHRoaXMubWluVW5zdHJva2VkV2lkdGggKyB0aGlzLm1heExpbmVXaWR0aCApXHJcbiAgICApO1xyXG4gICAgbGV0IG1pbmltdW1IZWlnaHQgPSBNYXRoLm1heChcclxuICAgICAgKCB0aGlzLmlzRmlyc3RMYXlvdXQgfHwgYnV0dG9uTm9kZS5oZWlnaHRTaXphYmxlIClcclxuICAgICAgPyAoIGlzSGVpZ2h0U2l6YWJsZSggY29udGVudCApID8gY29udGVudC5taW5pbXVtSGVpZ2h0IHx8IDAgOiBjb250ZW50LmhlaWdodCApICsgdGhpcy55TWFyZ2luICogMlxyXG4gICAgICA6IGJ1dHRvbk5vZGUubG9jYWxNaW5pbXVtSGVpZ2h0ISxcclxuICAgICAgKCB0aGlzLm1pblVuc3Ryb2tlZEhlaWdodCA9PT0gbnVsbCA/IDAgOiB0aGlzLm1pblVuc3Ryb2tlZEhlaWdodCArIHRoaXMubWF4TGluZVdpZHRoIClcclxuICAgICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLmFzcGVjdFJhdGlvICE9PSBudWxsICkge1xyXG4gICAgICBpZiAoIG1pbmltdW1XaWR0aCA8IG1pbmltdW1IZWlnaHQgKiB0aGlzLmFzcGVjdFJhdGlvICkge1xyXG4gICAgICAgIG1pbmltdW1XaWR0aCA9IG1pbmltdW1IZWlnaHQgKiB0aGlzLmFzcGVjdFJhdGlvO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggbWluaW11bUhlaWdodCA8IG1pbmltdW1XaWR0aCAvIHRoaXMuYXNwZWN0UmF0aW8gKSB7XHJcbiAgICAgICAgbWluaW11bUhlaWdodCA9IG1pbmltdW1XaWR0aCAvIHRoaXMuYXNwZWN0UmF0aW87XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBPdXIgcmVzdWx0aW5nIHNpemVzIChhbGxvdyBzZXR0aW5nIHByZWZlcnJlZCB3aWR0aC9oZWlnaHQgb24gdGhlIGJ1dHRvbk5vZGUpXHJcbiAgICB0aGlzLmxhc3RMb2NhbFByZWZlcnJlZFdpZHRoID0gdGhpcy5pc0ZpcnN0TGF5b3V0IHx8IGlzV2lkdGhTaXphYmxlKCBidXR0b25Ob2RlIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IE1hdGgubWF4KCBtaW5pbXVtV2lkdGgsIGJ1dHRvbk5vZGUubG9jYWxQcmVmZXJyZWRXaWR0aCB8fCAwIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHRoaXMubGFzdExvY2FsUHJlZmVycmVkV2lkdGg7XHJcbiAgICB0aGlzLmxhc3RMb2NhbFByZWZlcnJlZEhlaWdodCA9IHRoaXMuaXNGaXJzdExheW91dCB8fCBpc0hlaWdodFNpemFibGUoIGJ1dHRvbk5vZGUgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IE1hdGgubWF4KCBtaW5pbXVtSGVpZ2h0LCBidXR0b25Ob2RlLmxvY2FsUHJlZmVycmVkSGVpZ2h0IHx8IDAgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHRoaXMubGFzdExvY2FsUHJlZmVycmVkSGVpZ2h0O1xyXG5cclxuICAgIHRoaXMuaXNGaXJzdExheW91dCA9IGZhbHNlO1xyXG5cclxuICAgIHRoaXMubGF5b3V0U2l6ZVByb3BlcnR5LnZhbHVlID0gbmV3IERpbWVuc2lvbjIoIHRoaXMubGFzdExvY2FsUHJlZmVycmVkV2lkdGgsIHRoaXMubGFzdExvY2FsUHJlZmVycmVkSGVpZ2h0ICk7XHJcblxyXG4gICAgLy8gU2V0IG1pbmltdW1zIGF0IHRoZSBlbmRcclxuICAgIGJ1dHRvbk5vZGUubG9jYWxNaW5pbXVtV2lkdGggPSBtaW5pbXVtV2lkdGg7XHJcbiAgICBidXR0b25Ob2RlLmxvY2FsTWluaW11bUhlaWdodCA9IG1pbmltdW1IZWlnaHQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuYnV0dG9uTm9kZS5sb2NhbFByZWZlcnJlZFdpZHRoUHJvcGVydHkudW5saW5rKCB0aGlzLl91cGRhdGVMYXlvdXRMaXN0ZW5lciApO1xyXG4gICAgdGhpcy5idXR0b25Ob2RlLmxvY2FsUHJlZmVycmVkSGVpZ2h0UHJvcGVydHkudW5saW5rKCB0aGlzLl91cGRhdGVMYXlvdXRMaXN0ZW5lciApO1xyXG5cclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICB9XHJcbn1cclxuXHJcbkJ1dHRvbk5vZGUuRmxhdEFwcGVhcmFuY2VTdHJhdGVneSA9IEZsYXRBcHBlYXJhbmNlU3RyYXRlZ3k7XHJcblxyXG5zdW4ucmVnaXN0ZXIoICdCdXR0b25Ob2RlJywgQnV0dG9uTm9kZSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsZUFBZSxNQUFNLHFDQUFxQztBQUVqRSxPQUFPQyxTQUFTLE1BQTRCLCtCQUErQjtBQUMzRSxPQUFPQyxPQUFPLE1BQU0sNEJBQTRCO0FBQ2hELE9BQU9DLFVBQVUs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