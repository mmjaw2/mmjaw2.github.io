// Copyright 2016-2024, University of Colorado Boulder

/**
 * A Node that will align child (content) Node within a specific bounding box.
 *
 * If a custom alignBounds is provided, content will be aligned within that bounding box. Otherwise, it will be aligned
 * within a bounding box with the left-top corner of (0,0) of the necessary size to include both the content and
 * all the margins.
 *
 * Preferred sizes will set the alignBounds (to a minimum x/y of 0, and a maximum x/y of preferredWidth/preferredHeight)
 *
 * If alignBounds or a specific preferred size have not been set yet, the AlignBox will not adjust things on that
 * dimension.
 *
 * There are four margins: left, right, top, bottom. They can be set independently, or multiple can be set at the
 * same time (xMargin, yMargin and margin).
 *
 * NOTE: AlignBox resize may not happen immediately, and may be delayed until bounds of a alignBox's child occurs.
 *       layout updates can be forced with invalidateAlignment(). If the alignBox's content that changed is connected
 *       to a Scenery display, its bounds will update when Display.updateDisplay() will called, so this will guarantee
 *       that the layout will be applied before it is displayed. alignBox.getBounds() will not force a refresh, and
 *       may return stale bounds.
 *
 * See https://phetsims.github.io/scenery/doc/layout#AlignBox for details
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Multilink from '../../../../axon/js/Multilink.js';
import Bounds2 from '../../../../dot/js/Bounds2.js';
import optionize from '../../../../phet-core/js/optionize.js';
import { AlignGroup, isHeightSizable, isWidthSizable, LayoutConstraint, Node, scenery, Sizable } from '../../imports.js';
import assertMutuallyExclusiveOptions from '../../../../phet-core/js/assertMutuallyExclusiveOptions.js';
const ALIGNMENT_CONTAINER_OPTION_KEYS = ['alignBounds',
// {Bounds2|null} - See setAlignBounds() for more documentation
'xAlign',
// {string} - 'left', 'center', 'right' or 'stretch', see setXAlign() for more documentation
'yAlign',
// {string} - 'top', 'center', 'bottom' or 'stretch', see setYAlign() for more documentation
'margin',
// {number} - Sets all margins, see setMargin() for more documentation
'xMargin',
// {number} - Sets horizontal margins, see setXMargin() for more documentation
'yMargin',
// {number} - Sets vertical margins, see setYMargin() for more documentation
'leftMargin',
// {number} - Sets left margin, see setLeftMargin() for more documentation
'rightMargin',
// {number} - Sets right margin, see setRightMargin() for more documentation
'topMargin',
// {number} - Sets top margin, see setTopMargin() for more documentation
'bottomMargin',
// {number} - Sets bottom margin, see setBottomMargin() for more documentation
'group' // {AlignGroup|null} - Share bounds with others, see setGroup() for more documentation
];
export const AlignBoxXAlignValues = ['left', 'center', 'right', 'stretch'];
export const AlignBoxYAlignValues = ['top', 'center', 'bottom', 'stretch'];
const SuperType = Sizable(Node);
export default class AlignBox extends SuperType {
  // Our actual content

  // Controls the bounds in which content is aligned.

  // Whether x/y has been set
  _xSet = false;
  _ySet = false;

  // How to align the content when the alignBounds are larger than our content with its margins.

  // How much space should be on each side.

  // If available, an AlignGroup that will control our alignBounds

  // Callback for when bounds change (takes no arguments)
  // (scenery-internal)
  _contentBoundsListener = _.noop;

  // Will sync the alignBounds to the passed in property

  /**
   * An individual container for an alignment group. Will maintain its size to match that of the group by overriding
   * its localBounds, and will position its content inside its localBounds by respecting its alignment and margins.
   *
   * @param content - Content to align inside the alignBox
   * @param [providedOptions] - AlignBox-specific options are documented in ALIGNMENT_CONTAINER_OPTION_KEYS
   *                    above, and can be provided along-side options for Node
   */
  constructor(content, providedOptions) {
    const options = optionize()({
      children: [content]
    }, providedOptions);

    // We'll want to default to sizable:false, but allow clients to pass in something conflicting like widthSizable:true
    // in the super mutate. To avoid the exclusive options, we isolate this out here.
    const initialOptions = {
      // By default, don't set an AlignBox to be resizable, since it's used a lot to block out a certain amount of
      // space.
      sizable: false
    };
    super(initialOptions);
    assert && assert(options === undefined || Object.getPrototypeOf(options) === Object.prototype, 'Extra prototype on Node options object is a code smell');
    this._content = content;
    this._alignBounds = null;
    this._xAlign = 'center';
    this._yAlign = 'center';
    this._leftMargin = 0;
    this._rightMargin = 0;
    this._topMargin = 0;
    this._bottomMargin = 0;
    this._group = null;
    this._contentBoundsListener = this.invalidateAlignment.bind(this);
    this._alignBoundsProperty = null;
    this._alignBoundsPropertyListener = _.noop;
    assertMutuallyExclusiveOptions(options, ['alignBounds'], ['alignBoundsProperty']);

    // We will dynamically update alignBounds if an alignBoundsProperty was passed in through options.
    if (providedOptions?.alignBoundsProperty) {
      this._alignBoundsProperty = providedOptions.alignBoundsProperty;

      // Overrides any possible alignBounds passed in (should not be provided, assertion above).
      options.alignBounds = this._alignBoundsProperty.value;
      this._alignBoundsPropertyListener = bounds => {
        this.alignBounds = bounds;
      };
      this._alignBoundsProperty.lazyLink(this._alignBoundsPropertyListener);
    }
    this.localBounds = new Bounds2(0, 0, 0, 0);
    this.constraint = new AlignBoxConstraint(this, content);

    // Will be removed by dispose()
    this._content.boundsProperty.link(this._contentBoundsListener);
    this.mutate(options);

    // Update alignBounds based on preferred sizes
    Multilink.multilink([this.localPreferredWidthProperty, this.localPreferredHeightProperty], (preferredWidth, preferredHeight) => {
      if (preferredWidth !== null || preferredHeight !== null) {
        const bounds = this._alignBounds || new Bounds2(0, 0, 0, 0);

        // Overwrite bounds with any preferred setting, with the left/top at 0
        if (preferredWidth) {
          bounds.minX = 0;
          bounds.maxX = preferredWidth;
          this._xSet = true;
        }
        if (preferredHeight) {
          bounds.minY = 0;
          bounds.maxY = preferredHeight;
          this._ySet = true;
        }

        // Manual update and layout
        this._alignBounds = bounds;
        this.constraint.updateLayout();
      }
    });
  }

  /**
   * Triggers recomputation of the alignment. Should be called if it needs to be refreshed.
   *
   * NOTE: alignBox.getBounds() will not trigger a bounds validation for our content, and thus WILL NOT trigger
   * layout. content.getBounds() should trigger it, but invalidateAligment() is the preferred method for forcing a
   * re-check.
   */
  invalidateAlignment() {
    sceneryLog && sceneryLog.AlignBox && sceneryLog.AlignBox(`AlignBox#${this.id} invalidateAlignment`);
    sceneryLog && sceneryLog.AlignBox && sceneryLog.push();

    // The group update will change our alignBounds if required.
    if (this._group) {
      this._group.onAlignBoxResized(this);
    }

    // If the alignBounds didn't change, we'll still need to update our own layout
    this.constraint.updateLayout();
    sceneryLog && sceneryLog.AlignBox && sceneryLog.pop();
  }

  /**
   * Sets the alignment bounds (the bounds in which our content will be aligned). If null, AlignBox will act
   * as if the alignment bounds have a left-top corner of (0,0) and with a width/height that fits the content and
   * bounds.
   *
   * NOTE: If the group is a valid AlignGroup, it will be responsible for setting the alignBounds.
   */
  setAlignBounds(alignBounds) {
    assert && assert(alignBounds === null || alignBounds instanceof Bounds2 && !alignBounds.isEmpty() && alignBounds.isFinite(), 'alignBounds should be a non-empty finite Bounds2');
    this._xSet = true;
    this._ySet = true;

    // See if the bounds have changed. If both are Bounds2 with the same value, we won't update it.
    if (this._alignBounds !== alignBounds && (!alignBounds || !this._alignBounds || !alignBounds.equals(this._alignBounds))) {
      this._alignBounds = alignBounds;
      this.constraint.updateLayout();
    }
    return this;
  }
  set alignBounds(value) {
    this.setAlignBounds(value);
  }
  get alignBounds() {
    return this.getAlignBounds();
  }

  /**
   * Returns the current alignment bounds (if available, see setAlignBounds for details).
   */
  getAlignBounds() {
    return this._alignBounds;
  }

  /**
   * Sets the attachment to an AlignGroup. When attached, our alignBounds will be controlled by the group.
   */
  setGroup(group) {
    assert && assert(group === null || group instanceof AlignGroup, 'group should be an AlignGroup');
    if (this._group !== group) {
      // Remove from a previous group
      if (this._group) {
        this._group.removeAlignBox(this);
      }
      this._group = group;

      // Add to a new group
      if (this._group) {
        this._group.addAlignBox(this);
      }
    }
    return this;
  }
  set group(value) {
    this.setGroup(value);
  }
  get group() {
    return this.getGroup();
  }

  /**
   * Returns the attached alignment group (if one exists), or null otherwise.
   */
  getGroup() {
    return this._group;
  }

  /**
   * Sets the horizontal alignment of this box.
   */
  setXAlign(xAlign) {
    assert && assert(AlignBoxXAlignValues.includes(xAlign), `xAlign should be one of: ${AlignBoxXAlignValues}`);
    if (this._xAlign !== xAlign) {
      this._xAlign = xAlign;

      // Trigger re-layout
      this.invalidateAlignment();
    }
    return this;
  }
  set xAlign(value) {
    this.setXAlign(value);
  }
  get xAlign() {
    return this.getXAlign();
  }

  /**
   * Returns the current horizontal alignment of this box.
   */
  getXAlign() {
    return this._xAlign;
  }

  /**
   * Sets the vertical alignment of this box.
   */
  setYAlign(yAlign) {
    assert && assert(AlignBoxYAlignValues.includes(yAlign), `xAlign should be one of: ${AlignBoxYAlignValues}`);
    if (this._yAlign !== yAlign) {
      this._yAlign = yAlign;

      // Trigger re-layout
      this.invalidateAlignment();
    }
    return this;
  }
  set yAlign(value) {
    this.setYAlign(value);
  }
  get yAlign() {
    return this.getYAlign();
  }

  /**
   * Returns the current vertical alignment of this box.
   */
  getYAlign() {
    return this._yAlign;
  }

  /**
   * Sets the margin of this box (setting margin values for all sides at once).
   *
   * This margin is the minimum amount of horizontal space that will exist between the content the sides of this
   * box.
   */
  setMargin(margin) {
    assert && assert(isFinite(margin) && margin >= 0, 'margin should be a finite non-negative number');
    if (this._leftMargin !== margin || this._rightMargin !== margin || this._topMargin !== margin || this._bottomMargin !== margin) {
      this._leftMargin = this._rightMargin = this._topMargin = this._bottomMargin = margin;

      // Trigger re-layout
      this.invalidateAlignment();
    }
    return this;
  }
  set margin(value) {
    this.setMargin(value);
  }
  get margin() {
    return this.getMargin();
  }

  /**
   * Returns the current margin of this box (assuming all margin values are the same).
   */
  getMargin() {
    assert && assert(this._leftMargin === this._rightMargin && this._leftMargin === this._topMargin && this._leftMargin === this._bottomMargin, 'Getting margin does not have a unique result if the left and right margins are different');
    return this._leftMargin;
  }

  /**
   * Sets the horizontal margin of this box (setting both left and right margins at once).
   *
   * This margin is the minimum amount of horizontal space that will exist between the content and the left and
   * right sides of this box.
   */
  setXMargin(xMargin) {
    assert && assert(isFinite(xMargin) && xMargin >= 0, 'xMargin should be a finite non-negative number');
    if (this._leftMargin !== xMargin || this._rightMargin !== xMargin) {
      this._leftMargin = this._rightMargin = xMargin;

      // Trigger re-layout
      this.invalidateAlignment();
    }
    return this;
  }
  set xMargin(value) {
    this.setXMargin(value);
  }
  get xMargin() {
    return this.getXMargin();
  }

  /**
   * Returns the current horizontal margin of this box (assuming the left and right margins are the same).
   */
  getXMargin() {
    assert && assert(this._leftMargin === this._rightMargin, 'Getting xMargin does not have a unique result if the left and right margins are different');
    return this._leftMargin;
  }

  /**
   * Sets the vertical margin of this box (setting both top and bottom margins at once).
   *
   * This margin is the minimum amount of vertical space that will exist between the content and the top and
   * bottom sides of this box.
   */
  setYMargin(yMargin) {
    assert && assert(isFinite(yMargin) && yMargin >= 0, 'yMargin should be a finite non-negative number');
    if (this._topMargin !== yMargin || this._bottomMargin !== yMargin) {
      this._topMargin = this._bottomMargin = yMargin;

      // Trigger re-layout
      this.invalidateAlignment();
    }
    return this;
  }
  set yMargin(value) {
    this.setYMargin(value);
  }
  get yMargin() {
    return this.getYMargin();
  }

  /**
   * Returns the current vertical margin of this box (assuming the top and bottom margins are the same).
   */
  getYMargin() {
    assert && assert(this._topMargin === this._bottomMargin, 'Getting yMargin does not have a unique result if the top and bottom margins are different');
    return this._topMargin;
  }

  /**
   * Sets the left margin of this box.
   *
   * This margin is the minimum amount of horizontal space that will exist between the content and the left side of
   * the box.
   */
  setLeftMargin(leftMargin) {
    assert && assert(isFinite(leftMargin) && leftMargin >= 0, 'leftMargin should be a finite non-negative number');
    if (this._leftMargin !== leftMargin) {
      this._leftMargin = leftMargin;

      // Trigger re-layout
      this.invalidateAlignment();
    }
    return this;
  }
  set leftMargin(value) {
    this.setLeftMargin(value);
  }
  get leftMargin() {
    return this.getLeftMargin();
  }

  /**
   * Returns the current left margin of this box.
   */
  getLeftMargin() {
    return this._leftMargin;
  }

  /**
   * Sets the right margin of this box.
   *
   * This margin is the minimum amount of horizontal space that will exist between the content and the right side of
   * the container.
   */
  setRightMargin(rightMargin) {
    assert && assert(isFinite(rightMargin) && rightMargin >= 0, 'rightMargin should be a finite non-negative number');
    if (this._rightMargin !== rightMargin) {
      this._rightMargin = rightMargin;

      // Trigger re-layout
      this.invalidateAlignment();
    }
    return this;
  }
  set rightMargin(value) {
    this.setRightMargin(value);
  }
  get rightMargin() {
    return this.getRightMargin();
  }

  /**
   * Returns the current right margin of this box.
   */
  getRightMargin() {
    return this._rightMargin;
  }

  /**
   * Sets the top margin of this box.
   *
   * This margin is the minimum amount of vertical space that will exist between the content and the top side of the
   * container.
   */
  setTopMargin(topMargin) {
    assert && assert(isFinite(topMargin) && topMargin >= 0, 'topMargin should be a finite non-negative number');
    if (this._topMargin !== topMargin) {
      this._topMargin = topMargin;

      // Trigger re-layout
      this.invalidateAlignment();
    }
    return this;
  }
  set topMargin(value) {
    this.setTopMargin(value);
  }
  get topMargin() {
    return this.getTopMargin();
  }

  /**
   * Returns the current top margin of this box.
   */
  getTopMargin() {
    return this._topMargin;
  }

  /**
   * Sets the bottom margin of this box.
   *
   * This margin is the minimum amount of vertical space that will exist between the content and the bottom side of the
   * container.
   */
  setBottomMargin(bottomMargin) {
    assert && assert(isFinite(bottomMargin) && bottomMargin >= 0, 'bottomMargin should be a finite non-negative number');
    if (this._bottomMargin !== bottomMargin) {
      this._bottomMargin = bottomMargin;

      // Trigger re-layout
      this.invalidateAlignment();
    }
    return this;
  }
  set bottomMargin(value) {
    this.setBottomMargin(value);
  }
  get bottomMargin() {
    return this.getBottomMargin();
  }

  /**
   * Returns the current bottom margin of this box.
   */
  getBottomMargin() {
    return this._bottomMargin;
  }
  getContent() {
    return this._content;
  }
  get content() {
    return this.getContent();
  }

  /**
   * Returns the bounding box of this box's content. This will include any margins.
   */
  getContentBounds() {
    sceneryLog && sceneryLog.AlignBox && sceneryLog.AlignBox(`AlignBox#${this.id} getContentBounds`);
    sceneryLog && sceneryLog.AlignBox && sceneryLog.push();
    const bounds = this._content.bounds;
    sceneryLog && sceneryLog.AlignBox && sceneryLog.pop();
    return new Bounds2(bounds.left - this._leftMargin, bounds.top - this._topMargin, bounds.right + this._rightMargin, bounds.bottom + this._bottomMargin);
  }

  // scenery-internal, designed so that we can ignore adjusting certain dimensions
  setAdjustedLocalBounds(bounds) {
    if (this._xSet && this._ySet) {
      this.localBounds = bounds;
    } else if (this._xSet) {
      const contentBounds = this.getContentBounds();
      this.localBounds = new Bounds2(bounds.minX, contentBounds.minY, bounds.maxX, contentBounds.maxY);
    } else if (this._ySet) {
      const contentBounds = this.getContentBounds();
      this.localBounds = new Bounds2(contentBounds.minX, bounds.minY, contentBounds.maxX, bounds.maxY);
    } else {
      this.localBounds = this.getContentBounds();
    }
  }

  /**
   * Disposes this box, releasing listeners and any references to an AlignGroup
   */
  dispose() {
    this._alignBoundsProperty && this._alignBoundsProperty.unlink(this._alignBoundsPropertyListener);

    // Remove our listener
    this._content.boundsProperty.unlink(this._contentBoundsListener);
    this._content = new Node(); // clear the reference for GC

    // Disconnects from the group
    this.group = null;
    this.constraint.dispose();
    super.dispose();
  }
  mutate(options) {
    return super.mutate(options);
  }
}

// Layout logic for AlignBox
class AlignBoxConstraint extends LayoutConstraint {
  constructor(alignBox, content) {
    super(alignBox);
    this.alignBox = alignBox;
    this.content = content;
    this.addNode(content);
    alignBox.isWidthResizableProperty.lazyLink(this._updateLayoutListener);
    alignBox.isHeightResizableProperty.lazyLink(this._updateLayoutListener);
  }

  /**
   * Conditionally updates a certain property of our content's positioning.
   *
   * Essentially does the following (but prevents infinite loops by not applying changes if the numbers are very
   * similar):
   * this._content[ propName ] = this.localBounds[ propName ] + offset;
   *
   * @param propName - A positional property on both Node and Bounds2, e.g. 'left'
   * @param offset - Offset to be applied to the localBounds location.
   */
  updateProperty(propName, offset) {
    const currentValue = this.content[propName];
    const newValue = this.alignBox.localBounds[propName] + offset;

    // Prevent infinite loops or stack overflows by ignoring tiny changes
    if (Math.abs(currentValue - newValue) > 1e-5) {
      this.content[propName] = newValue;
    }
  }
  layout() {
    super.layout();
    const box = this.alignBox;
    const content = this.content;
    sceneryLog && sceneryLog.AlignBox && sceneryLog.AlignBox(`AlignBoxConstraint#${this.alignBox.id} layout`);
    sceneryLog && sceneryLog.AlignBox && sceneryLog.push();
    if (!content.bounds.isValid()) {
      return;
    }
    const totalXMargins = box.leftMargin + box.rightMargin;
    const totalYMargins = box.topMargin + box.bottomMargin;

    // If we have alignBounds, use that.
    if (box.alignBounds !== null) {
      box.setAdjustedLocalBounds(box.alignBounds);
    }
    // Otherwise, we'll grab a Bounds2 anchored at the upper-left with our required dimensions.
    else {
      const widthWithMargin = content.width + totalXMargins;
      const heightWithMargin = content.height + totalYMargins;
      box.setAdjustedLocalBounds(new Bounds2(0, 0, widthWithMargin, heightWithMargin));
    }
    const minimumWidth = isFinite(content.width) ? (isWidthSizable(content) ? content.minimumWidth || 0 : content.width) + totalXMargins : null;
    const minimumHeight = isFinite(content.height) ? (isHeightSizable(content) ? content.minimumHeight || 0 : content.height) + totalYMargins : null;

    // Don't try to lay out empty bounds
    if (!content.localBounds.isEmpty()) {
      if (box.xAlign === 'center') {
        this.updateProperty('centerX', (box.leftMargin - box.rightMargin) / 2);
      } else if (box.xAlign === 'left') {
        this.updateProperty('left', box.leftMargin);
      } else if (box.xAlign === 'right') {
        this.updateProperty('right', -box.rightMargin);
      } else if (box.xAlign === 'stretch') {
        assert && assert(isWidthSizable(content), 'xAlign:stretch can only be used if WidthSizable is mixed into the content');
        content.preferredWidth = box.localWidth - box.leftMargin - box.rightMargin;
        this.updateProperty('left', box.leftMargin);
      } else {
        assert && assert(`Bad xAlign: ${box.xAlign}`);
      }
      if (box.yAlign === 'center') {
        this.updateProperty('centerY', (box.topMargin - box.bottomMargin) / 2);
      } else if (box.yAlign === 'top') {
        this.updateProperty('top', box.topMargin);
      } else if (box.yAlign === 'bottom') {
        this.updateProperty('bottom', -box.bottomMargin);
      } else if (box.yAlign === 'stretch') {
        assert && assert(isHeightSizable(content), 'yAlign:stretch can only be used if HeightSizable is mixed into the content');
        content.preferredHeight = box.localHeight - box.topMargin - box.bottomMargin;
        this.updateProperty('top', box.topMargin);
      } else {
        assert && assert(`Bad yAlign: ${box.yAlign}`);
      }
    }
    sceneryLog && sceneryLog.AlignBox && sceneryLog.pop();

    // After the layout lock on purpose (we want these to be reentrant, especially if they change) - however only apply
    // this concept if we're capable of shrinking (we want the default to continue to block off the layoutBounds)
    box.localMinimumWidth = box.widthSizable ? minimumWidth : box.localWidth;
    box.localMinimumHeight = box.heightSizable ? minimumHeight : box.localHeight;
  }
}

/**
 * {Array.<string>} - String keys for all of the allowed options that will be set by node.mutate( options ), in the
 * order they will be evaluated in.
 *
 * NOTE: See Node's _mutatorKeys documentation for more information on how this operates, and potential special
 *       cases that may apply.
 */
AlignBox.prototype._mutatorKeys = ALIGNMENT_CONTAINER_OPTION_KEYS.concat(SuperType.prototype._mutatorKeys);
scenery.register('AlignBox', AlignBox);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNdWx0aWxpbmsiLCJCb3VuZHMyIiwib3B0aW9uaXplIiwiQWxpZ25Hcm91cCIsImlzSGVpZ2h0U2l6YWJsZSIsImlzV2lkdGhTaXphYmxlIiwiTGF5b3V0Q29uc3RyYWludCIsIk5vZGUiLCJzY2VuZXJ5IiwiU2l6YWJsZSIsImFzc2VydE11dHVhbGx5RXhjbHVzaXZlT3B0aW9ucyIsIkFMSUdOTUVOVF9DT05UQUlORVJfT1BUSU9OX0tFWVMiLCJBbGlnbkJveFhBbGlnblZhbHVlcyIsIkFsaWduQm94WUFsaWduVmFsdWVzIiwiU3VwZXJUeXBlIiwiQWxpZ25Cb3giLCJfeFNldCIsIl95U2V0IiwiX2NvbnRlbnRCb3VuZHNMaXN0ZW5lciIsIl8iLCJub29wIiwiY29uc3RydWN0b3IiLCJjb250ZW50IiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsImNoaWxkcmVuIiwiaW5pdGlhbE9wdGlvbnMiLCJzaXphYmxlIiwiYXNzZXJ0IiwidW5kZWZpbmVkIiwiT2JqZWN0IiwiZ2V0UHJvdG90eXBlT2YiLCJwcm90b3R5cGUiLCJfY29udGVudCIsIl9hbGlnbkJvdW5kcyIsIl94QWxpZ24iLCJfeUFsaWduIiwiX2xlZnRNYXJnaW4iLCJfcmlnaHRNYXJnaW4iLCJfdG9wTWFyZ2luIiwiX2JvdHRvbU1hcmdpbiIsIl9ncm91cCIsImludmFsaWRhdGVBbGlnbm1lbnQiLCJiaW5kIiwiX2FsaWduQm91bmRzUHJvcGVydHkiLCJfYWxpZ25Cb3VuZHNQcm9wZXJ0eUxpc3RlbmVyIiwiYWxpZ25Cb3VuZHNQcm9wZXJ0eSIsImFsaWduQm91bmRzIiwidmFsdWUiLCJib3VuZHMiLCJsYXp5TGluayIsImxvY2FsQm91bmRzIiwiY29uc3RyYWludCIsIkFsaWduQm94Q29uc3RyYWludCIsImJvdW5kc1Byb3BlcnR5IiwibGluayIsIm11dGF0ZSIsIm11bHRpbGluayIsImxvY2FsUHJlZmVycmVkV2lkdGhQcm9wZXJ0eSIsImxvY2FsUHJlZmVycmVkSGVpZ2h0UHJvcGVydHkiLCJwcmVmZXJyZWRXaWR0aCIsInByZWZlcnJlZEhlaWdodCIsIm1pblgiLCJtYXhYIiwibWluWSIsIm1heFkiLCJ1cGRhdGVMYXlvdXQiLCJzY2VuZXJ5TG9nIiwiaWQiLCJwdXNoIiwib25BbGlnbkJveFJlc2l6ZWQiLCJwb3AiLCJzZXRBbGlnbkJvdW5kcyIsImlzRW1wdHkiLCJpc0Zpbml0ZSIsImVxdWFscyIsImdldEFsaWduQm91bmRzIiwic2V0R3JvdXAiLCJncm91cCIsInJlbW92ZUFsaWduQm94IiwiYWRkQWxpZ25Cb3giLCJnZXRHcm91cCIsInNldFhBbGlnbiIsInhBbGlnbiIsImluY2x1ZGVzIiwiZ2V0WEFsaWduIiwic2V0WUFsaWduIiwieUFsaWduIiwiZ2V0WUFsaWduIiwic2V0TWFyZ2luIiwibWFyZ2luIiwiZ2V0TWFyZ2luIiwic2V0WE1hcmdpbiIsInhNYXJnaW4iLCJnZXRYTWFyZ2luIiwic2V0WU1hcmdpbiIsInlNYXJnaW4iLCJnZXRZTWFyZ2luIiwic2V0TGVmdE1hcmdpbiIsImxlZnRNYXJnaW4iLCJnZXRMZWZ0TWFyZ2luIiwic2V0UmlnaHRNYXJnaW4iLCJyaWdodE1hcmdpbiIsImdldFJpZ2h0TWFyZ2luIiwic2V0VG9wTWFyZ2luIiwidG9wTWFyZ2luIiwiZ2V0VG9wTWFyZ2luIiwic2V0Qm90dG9tTWFyZ2luIiwiYm90dG9tTWFyZ2luIiwiZ2V0Qm90dG9tTWFyZ2luIiwiZ2V0Q29udGVudCIsImdldENvbnRlbnRCb3VuZHMiLCJsZWZ0IiwidG9wIiwicmlnaHQiLCJib3R0b20iLCJzZXRBZGp1c3RlZExvY2FsQm91bmRzIiwiY29udGVudEJvdW5kcyIsImRpc3Bvc2UiLCJ1bmxpbmsiLCJhbGlnbkJveCIsImFkZE5vZGUiLCJpc1dpZHRoUmVzaXphYmxlUHJvcGVydHkiLCJfdXBkYXRlTGF5b3V0TGlzdGVuZXIiLCJpc0hlaWdodFJlc2l6YWJsZVByb3BlcnR5IiwidXBkYXRlUHJvcGVydHkiLCJwcm9wTmFtZSIsIm9mZnNldCIsImN1cnJlbnRWYWx1ZSIsIm5ld1ZhbHVlIiwiTWF0aCIsImFicyIsImxheW91dCIsImJveCIsImlzVmFsaWQiLCJ0b3RhbFhNYXJnaW5zIiwidG90YWxZTWFyZ2lucyIsIndpZHRoV2l0aE1hcmdpbiIsIndpZHRoIiwiaGVpZ2h0V2l0aE1hcmdpbiIsImhlaWdodCIsIm1pbmltdW1XaWR0aCIsIm1pbmltdW1IZWlnaHQiLCJsb2NhbFdpZHRoIiwibG9jYWxIZWlnaHQiLCJsb2NhbE1pbmltdW1XaWR0aCIsIndpZHRoU2l6YWJsZSIsImxvY2FsTWluaW11bUhlaWdodCIsImhlaWdodFNpemFibGUiLCJfbXV0YXRvcktleXMiLCJjb25jYXQiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkFsaWduQm94LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE2LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEEgTm9kZSB0aGF0IHdpbGwgYWxpZ24gY2hpbGQgKGNvbnRlbnQpIE5vZGUgd2l0aGluIGEgc3BlY2lmaWMgYm91bmRpbmcgYm94LlxyXG4gKlxyXG4gKiBJZiBhIGN1c3RvbSBhbGlnbkJvdW5kcyBpcyBwcm92aWRlZCwgY29udGVudCB3aWxsIGJlIGFsaWduZWQgd2l0aGluIHRoYXQgYm91bmRpbmcgYm94LiBPdGhlcndpc2UsIGl0IHdpbGwgYmUgYWxpZ25lZFxyXG4gKiB3aXRoaW4gYSBib3VuZGluZyBib3ggd2l0aCB0aGUgbGVmdC10b3AgY29ybmVyIG9mICgwLDApIG9mIHRoZSBuZWNlc3Nhcnkgc2l6ZSB0byBpbmNsdWRlIGJvdGggdGhlIGNvbnRlbnQgYW5kXHJcbiAqIGFsbCB0aGUgbWFyZ2lucy5cclxuICpcclxuICogUHJlZmVycmVkIHNpemVzIHdpbGwgc2V0IHRoZSBhbGlnbkJvdW5kcyAodG8gYSBtaW5pbXVtIHgveSBvZiAwLCBhbmQgYSBtYXhpbXVtIHgveSBvZiBwcmVmZXJyZWRXaWR0aC9wcmVmZXJyZWRIZWlnaHQpXHJcbiAqXHJcbiAqIElmIGFsaWduQm91bmRzIG9yIGEgc3BlY2lmaWMgcHJlZmVycmVkIHNpemUgaGF2ZSBub3QgYmVlbiBzZXQgeWV0LCB0aGUgQWxpZ25Cb3ggd2lsbCBub3QgYWRqdXN0IHRoaW5ncyBvbiB0aGF0XHJcbiAqIGRpbWVuc2lvbi5cclxuICpcclxuICogVGhlcmUgYXJlIGZvdXIgbWFyZ2luczogbGVmdCwgcmlnaHQsIHRvcCwgYm90dG9tLiBUaGV5IGNhbiBiZSBzZXQgaW5kZXBlbmRlbnRseSwgb3IgbXVsdGlwbGUgY2FuIGJlIHNldCBhdCB0aGVcclxuICogc2FtZSB0aW1lICh4TWFyZ2luLCB5TWFyZ2luIGFuZCBtYXJnaW4pLlxyXG4gKlxyXG4gKiBOT1RFOiBBbGlnbkJveCByZXNpemUgbWF5IG5vdCBoYXBwZW4gaW1tZWRpYXRlbHksIGFuZCBtYXkgYmUgZGVsYXllZCB1bnRpbCBib3VuZHMgb2YgYSBhbGlnbkJveCdzIGNoaWxkIG9jY3Vycy5cclxuICogICAgICAgbGF5b3V0IHVwZGF0ZXMgY2FuIGJlIGZvcmNlZCB3aXRoIGludmFsaWRhdGVBbGlnbm1lbnQoKS4gSWYgdGhlIGFsaWduQm94J3MgY29udGVudCB0aGF0IGNoYW5nZWQgaXMgY29ubmVjdGVkXHJcbiAqICAgICAgIHRvIGEgU2NlbmVyeSBkaXNwbGF5LCBpdHMgYm91bmRzIHdpbGwgdXBkYXRlIHdoZW4gRGlzcGxheS51cGRhdGVEaXNwbGF5KCkgd2lsbCBjYWxsZWQsIHNvIHRoaXMgd2lsbCBndWFyYW50ZWVcclxuICogICAgICAgdGhhdCB0aGUgbGF5b3V0IHdpbGwgYmUgYXBwbGllZCBiZWZvcmUgaXQgaXMgZGlzcGxheWVkLiBhbGlnbkJveC5nZXRCb3VuZHMoKSB3aWxsIG5vdCBmb3JjZSBhIHJlZnJlc2gsIGFuZFxyXG4gKiAgICAgICBtYXkgcmV0dXJuIHN0YWxlIGJvdW5kcy5cclxuICpcclxuICogU2VlIGh0dHBzOi8vcGhldHNpbXMuZ2l0aHViLmlvL3NjZW5lcnkvZG9jL2xheW91dCNBbGlnbkJveCBmb3IgZGV0YWlsc1xyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IE11bHRpbGluayBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL011bHRpbGluay5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IEJvdW5kczIgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL0JvdW5kczIuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplLCB7IEVtcHR5U2VsZk9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IHsgQWxpZ25Hcm91cCwgSGVpZ2h0U2l6YWJsZU5vZGUsIGlzSGVpZ2h0U2l6YWJsZSwgaXNXaWR0aFNpemFibGUsIExheW91dENvbnN0cmFpbnQsIE5vZGUsIE5vZGVPcHRpb25zLCBzY2VuZXJ5LCBTaXphYmxlLCBTaXphYmxlT3B0aW9ucywgV2lkdGhTaXphYmxlTm9kZSB9IGZyb20gJy4uLy4uL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBhc3NlcnRNdXR1YWxseUV4Y2x1c2l2ZU9wdGlvbnMgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL2Fzc2VydE11dHVhbGx5RXhjbHVzaXZlT3B0aW9ucy5qcyc7XHJcblxyXG5jb25zdCBBTElHTk1FTlRfQ09OVEFJTkVSX09QVElPTl9LRVlTID0gW1xyXG4gICdhbGlnbkJvdW5kcycsIC8vIHtCb3VuZHMyfG51bGx9IC0gU2VlIHNldEFsaWduQm91bmRzKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICd4QWxpZ24nLCAvLyB7c3RyaW5nfSAtICdsZWZ0JywgJ2NlbnRlcicsICdyaWdodCcgb3IgJ3N0cmV0Y2gnLCBzZWUgc2V0WEFsaWduKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICd5QWxpZ24nLCAvLyB7c3RyaW5nfSAtICd0b3AnLCAnY2VudGVyJywgJ2JvdHRvbScgb3IgJ3N0cmV0Y2gnLCBzZWUgc2V0WUFsaWduKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICdtYXJnaW4nLCAvLyB7bnVtYmVyfSAtIFNldHMgYWxsIG1hcmdpbnMsIHNlZSBzZXRNYXJnaW4oKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ3hNYXJnaW4nLCAvLyB7bnVtYmVyfSAtIFNldHMgaG9yaXpvbnRhbCBtYXJnaW5zLCBzZWUgc2V0WE1hcmdpbigpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAneU1hcmdpbicsIC8vIHtudW1iZXJ9IC0gU2V0cyB2ZXJ0aWNhbCBtYXJnaW5zLCBzZWUgc2V0WU1hcmdpbigpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnbGVmdE1hcmdpbicsIC8vIHtudW1iZXJ9IC0gU2V0cyBsZWZ0IG1hcmdpbiwgc2VlIHNldExlZnRNYXJnaW4oKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ3JpZ2h0TWFyZ2luJywgLy8ge251bWJlcn0gLSBTZXRzIHJpZ2h0IG1hcmdpbiwgc2VlIHNldFJpZ2h0TWFyZ2luKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG4gICd0b3BNYXJnaW4nLCAvLyB7bnVtYmVyfSAtIFNldHMgdG9wIG1hcmdpbiwgc2VlIHNldFRvcE1hcmdpbigpIGZvciBtb3JlIGRvY3VtZW50YXRpb25cclxuICAnYm90dG9tTWFyZ2luJywgLy8ge251bWJlcn0gLSBTZXRzIGJvdHRvbSBtYXJnaW4sIHNlZSBzZXRCb3R0b21NYXJnaW4oKSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uXHJcbiAgJ2dyb3VwJyAvLyB7QWxpZ25Hcm91cHxudWxsfSAtIFNoYXJlIGJvdW5kcyB3aXRoIG90aGVycywgc2VlIHNldEdyb3VwKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvblxyXG5dO1xyXG5cclxuZXhwb3J0IGNvbnN0IEFsaWduQm94WEFsaWduVmFsdWVzID0gWyAnbGVmdCcsICdjZW50ZXInLCAncmlnaHQnLCAnc3RyZXRjaCcgXSBhcyBjb25zdDtcclxuZXhwb3J0IHR5cGUgQWxpZ25Cb3hYQWxpZ24gPSAoIHR5cGVvZiBBbGlnbkJveFhBbGlnblZhbHVlcyApW251bWJlcl07XHJcblxyXG5leHBvcnQgY29uc3QgQWxpZ25Cb3hZQWxpZ25WYWx1ZXMgPSBbICd0b3AnLCAnY2VudGVyJywgJ2JvdHRvbScsICdzdHJldGNoJyBdIGFzIGNvbnN0O1xyXG5leHBvcnQgdHlwZSBBbGlnbkJveFlBbGlnbiA9ICggdHlwZW9mIEFsaWduQm94WUFsaWduVmFsdWVzIClbbnVtYmVyXTtcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcbiAgYWxpZ25Cb3VuZHM/OiBCb3VuZHMyIHwgbnVsbDtcclxuICBhbGlnbkJvdW5kc1Byb3BlcnR5PzogVFJlYWRPbmx5UHJvcGVydHk8Qm91bmRzMj47IC8vIGlmIHBhc3NlZCBpbiB3aWxsIG92ZXJyaWRlIGFsaWduQm91bmRzIG9wdGlvblxyXG4gIHhBbGlnbj86IEFsaWduQm94WEFsaWduO1xyXG4gIHlBbGlnbj86IEFsaWduQm94WUFsaWduO1xyXG4gIG1hcmdpbj86IG51bWJlcjtcclxuICB4TWFyZ2luPzogbnVtYmVyO1xyXG4gIHlNYXJnaW4/OiBudW1iZXI7XHJcbiAgbGVmdE1hcmdpbj86IG51bWJlcjtcclxuICByaWdodE1hcmdpbj86IG51bWJlcjtcclxuICB0b3BNYXJnaW4/OiBudW1iZXI7XHJcbiAgYm90dG9tTWFyZ2luPzogbnVtYmVyO1xyXG4gIGdyb3VwPzogQWxpZ25Hcm91cCB8IG51bGw7XHJcbn07XHJcblxyXG50eXBlIFBhcmVudE9wdGlvbnMgPSBOb2RlT3B0aW9ucyAmIFNpemFibGVPcHRpb25zO1xyXG5cclxuZXhwb3J0IHR5cGUgQWxpZ25Cb3hPcHRpb25zID0gU2VsZk9wdGlvbnMgJiBTdHJpY3RPbWl0PFBhcmVudE9wdGlvbnMsICdjaGlsZHJlbic+O1xyXG5cclxuY29uc3QgU3VwZXJUeXBlID0gU2l6YWJsZSggTm9kZSApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQWxpZ25Cb3ggZXh0ZW5kcyBTdXBlclR5cGUge1xyXG5cclxuICAvLyBPdXIgYWN0dWFsIGNvbnRlbnRcclxuICBwcml2YXRlIF9jb250ZW50OiBOb2RlO1xyXG5cclxuICAvLyBDb250cm9scyB0aGUgYm91bmRzIGluIHdoaWNoIGNvbnRlbnQgaXMgYWxpZ25lZC5cclxuICBwcml2YXRlIF9hbGlnbkJvdW5kczogQm91bmRzMiB8IG51bGw7XHJcblxyXG4gIC8vIFdoZXRoZXIgeC95IGhhcyBiZWVuIHNldFxyXG4gIHByaXZhdGUgX3hTZXQgPSBmYWxzZTtcclxuICBwcml2YXRlIF95U2V0ID0gZmFsc2U7XHJcblxyXG4gIC8vIEhvdyB0byBhbGlnbiB0aGUgY29udGVudCB3aGVuIHRoZSBhbGlnbkJvdW5kcyBhcmUgbGFyZ2VyIHRoYW4gb3VyIGNvbnRlbnQgd2l0aCBpdHMgbWFyZ2lucy5cclxuICBwcml2YXRlIF94QWxpZ246IEFsaWduQm94WEFsaWduO1xyXG4gIHByaXZhdGUgX3lBbGlnbjogQWxpZ25Cb3hZQWxpZ247XHJcblxyXG4gIC8vIEhvdyBtdWNoIHNwYWNlIHNob3VsZCBiZSBvbiBlYWNoIHNpZGUuXHJcbiAgcHJpdmF0ZSBfbGVmdE1hcmdpbjogbnVtYmVyO1xyXG4gIHByaXZhdGUgX3JpZ2h0TWFyZ2luOiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBfdG9wTWFyZ2luOiBudW1iZXI7XHJcbiAgcHJpdmF0ZSBfYm90dG9tTWFyZ2luOiBudW1iZXI7XHJcblxyXG4gIC8vIElmIGF2YWlsYWJsZSwgYW4gQWxpZ25Hcm91cCB0aGF0IHdpbGwgY29udHJvbCBvdXIgYWxpZ25Cb3VuZHNcclxuICBwcml2YXRlIF9ncm91cDogQWxpZ25Hcm91cCB8IG51bGw7XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgY29uc3RyYWludDogQWxpZ25Cb3hDb25zdHJhaW50O1xyXG5cclxuICAvLyBDYWxsYmFjayBmb3Igd2hlbiBib3VuZHMgY2hhbmdlICh0YWtlcyBubyBhcmd1bWVudHMpXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgcHVibGljIF9jb250ZW50Qm91bmRzTGlzdGVuZXIgPSBfLm5vb3A7XHJcblxyXG4gIC8vIFdpbGwgc3luYyB0aGUgYWxpZ25Cb3VuZHMgdG8gdGhlIHBhc3NlZCBpbiBwcm9wZXJ0eVxyXG4gIHByaXZhdGUgcmVhZG9ubHkgX2FsaWduQm91bmRzUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PEJvdW5kczI+IHwgbnVsbDtcclxuICBwcml2YXRlIHJlYWRvbmx5IF9hbGlnbkJvdW5kc1Byb3BlcnR5TGlzdGVuZXI6ICggYjogQm91bmRzMiApID0+IHZvaWQ7XHJcblxyXG4gIC8qKlxyXG4gICAqIEFuIGluZGl2aWR1YWwgY29udGFpbmVyIGZvciBhbiBhbGlnbm1lbnQgZ3JvdXAuIFdpbGwgbWFpbnRhaW4gaXRzIHNpemUgdG8gbWF0Y2ggdGhhdCBvZiB0aGUgZ3JvdXAgYnkgb3ZlcnJpZGluZ1xyXG4gICAqIGl0cyBsb2NhbEJvdW5kcywgYW5kIHdpbGwgcG9zaXRpb24gaXRzIGNvbnRlbnQgaW5zaWRlIGl0cyBsb2NhbEJvdW5kcyBieSByZXNwZWN0aW5nIGl0cyBhbGlnbm1lbnQgYW5kIG1hcmdpbnMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gY29udGVudCAtIENvbnRlbnQgdG8gYWxpZ24gaW5zaWRlIHRoZSBhbGlnbkJveFxyXG4gICAqIEBwYXJhbSBbcHJvdmlkZWRPcHRpb25zXSAtIEFsaWduQm94LXNwZWNpZmljIG9wdGlvbnMgYXJlIGRvY3VtZW50ZWQgaW4gQUxJR05NRU5UX0NPTlRBSU5FUl9PUFRJT05fS0VZU1xyXG4gICAqICAgICAgICAgICAgICAgICAgICBhYm92ZSwgYW5kIGNhbiBiZSBwcm92aWRlZCBhbG9uZy1zaWRlIG9wdGlvbnMgZm9yIE5vZGVcclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIGNvbnRlbnQ6IE5vZGUsIHByb3ZpZGVkT3B0aW9ucz86IEFsaWduQm94T3B0aW9ucyApIHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPEFsaWduQm94T3B0aW9ucywgRW1wdHlTZWxmT3B0aW9ucywgUGFyZW50T3B0aW9ucz4oKSgge1xyXG4gICAgICBjaGlsZHJlbjogWyBjb250ZW50IF1cclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIC8vIFdlJ2xsIHdhbnQgdG8gZGVmYXVsdCB0byBzaXphYmxlOmZhbHNlLCBidXQgYWxsb3cgY2xpZW50cyB0byBwYXNzIGluIHNvbWV0aGluZyBjb25mbGljdGluZyBsaWtlIHdpZHRoU2l6YWJsZTp0cnVlXHJcbiAgICAvLyBpbiB0aGUgc3VwZXIgbXV0YXRlLiBUbyBhdm9pZCB0aGUgZXhjbHVzaXZlIG9wdGlvbnMsIHdlIGlzb2xhdGUgdGhpcyBvdXQgaGVyZS5cclxuICAgIGNvbnN0IGluaXRpYWxPcHRpb25zOiBBbGlnbkJveE9wdGlvbnMgPSB7XHJcbiAgICAgIC8vIEJ5IGRlZmF1bHQsIGRvbid0IHNldCBhbiBBbGlnbkJveCB0byBiZSByZXNpemFibGUsIHNpbmNlIGl0J3MgdXNlZCBhIGxvdCB0byBibG9jayBvdXQgYSBjZXJ0YWluIGFtb3VudCBvZlxyXG4gICAgICAvLyBzcGFjZS5cclxuICAgICAgc2l6YWJsZTogZmFsc2VcclxuICAgIH07XHJcbiAgICBzdXBlciggaW5pdGlhbE9wdGlvbnMgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zID09PSB1bmRlZmluZWQgfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKCBvcHRpb25zICkgPT09IE9iamVjdC5wcm90b3R5cGUsXHJcbiAgICAgICdFeHRyYSBwcm90b3R5cGUgb24gTm9kZSBvcHRpb25zIG9iamVjdCBpcyBhIGNvZGUgc21lbGwnICk7XHJcblxyXG4gICAgdGhpcy5fY29udGVudCA9IGNvbnRlbnQ7XHJcbiAgICB0aGlzLl9hbGlnbkJvdW5kcyA9IG51bGw7XHJcblxyXG4gICAgdGhpcy5feEFsaWduID0gJ2NlbnRlcic7XHJcbiAgICB0aGlzLl95QWxpZ24gPSAnY2VudGVyJztcclxuICAgIHRoaXMuX2xlZnRNYXJnaW4gPSAwO1xyXG4gICAgdGhpcy5fcmlnaHRNYXJnaW4gPSAwO1xyXG4gICAgdGhpcy5fdG9wTWFyZ2luID0gMDtcclxuICAgIHRoaXMuX2JvdHRvbU1hcmdpbiA9IDA7XHJcbiAgICB0aGlzLl9ncm91cCA9IG51bGw7XHJcbiAgICB0aGlzLl9jb250ZW50Qm91bmRzTGlzdGVuZXIgPSB0aGlzLmludmFsaWRhdGVBbGlnbm1lbnQuYmluZCggdGhpcyApO1xyXG4gICAgdGhpcy5fYWxpZ25Cb3VuZHNQcm9wZXJ0eSA9IG51bGw7XHJcbiAgICB0aGlzLl9hbGlnbkJvdW5kc1Byb3BlcnR5TGlzdGVuZXIgPSBfLm5vb3A7XHJcblxyXG4gICAgYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zKCBvcHRpb25zLCBbICdhbGlnbkJvdW5kcycgXSwgWyAnYWxpZ25Cb3VuZHNQcm9wZXJ0eScgXSApO1xyXG5cclxuICAgIC8vIFdlIHdpbGwgZHluYW1pY2FsbHkgdXBkYXRlIGFsaWduQm91bmRzIGlmIGFuIGFsaWduQm91bmRzUHJvcGVydHkgd2FzIHBhc3NlZCBpbiB0aHJvdWdoIG9wdGlvbnMuXHJcbiAgICBpZiAoIHByb3ZpZGVkT3B0aW9ucz8uYWxpZ25Cb3VuZHNQcm9wZXJ0eSApIHtcclxuICAgICAgdGhpcy5fYWxpZ25Cb3VuZHNQcm9wZXJ0eSA9IHByb3ZpZGVkT3B0aW9ucy5hbGlnbkJvdW5kc1Byb3BlcnR5O1xyXG5cclxuICAgICAgLy8gT3ZlcnJpZGVzIGFueSBwb3NzaWJsZSBhbGlnbkJvdW5kcyBwYXNzZWQgaW4gKHNob3VsZCBub3QgYmUgcHJvdmlkZWQsIGFzc2VydGlvbiBhYm92ZSkuXHJcbiAgICAgIG9wdGlvbnMuYWxpZ25Cb3VuZHMgPSB0aGlzLl9hbGlnbkJvdW5kc1Byb3BlcnR5LnZhbHVlO1xyXG5cclxuICAgICAgdGhpcy5fYWxpZ25Cb3VuZHNQcm9wZXJ0eUxpc3RlbmVyID0gKCBib3VuZHM6IEJvdW5kczIgKSA9PiB7IHRoaXMuYWxpZ25Cb3VuZHMgPSBib3VuZHM7IH07XHJcbiAgICAgIHRoaXMuX2FsaWduQm91bmRzUHJvcGVydHkubGF6eUxpbmsoIHRoaXMuX2FsaWduQm91bmRzUHJvcGVydHlMaXN0ZW5lciApO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMubG9jYWxCb3VuZHMgPSBuZXcgQm91bmRzMiggMCwgMCwgMCwgMCApO1xyXG5cclxuICAgIHRoaXMuY29uc3RyYWludCA9IG5ldyBBbGlnbkJveENvbnN0cmFpbnQoIHRoaXMsIGNvbnRlbnQgKTtcclxuXHJcbiAgICAvLyBXaWxsIGJlIHJlbW92ZWQgYnkgZGlzcG9zZSgpXHJcbiAgICB0aGlzLl9jb250ZW50LmJvdW5kc1Byb3BlcnR5LmxpbmsoIHRoaXMuX2NvbnRlbnRCb3VuZHNMaXN0ZW5lciApO1xyXG5cclxuICAgIHRoaXMubXV0YXRlKCBvcHRpb25zICk7XHJcblxyXG4gICAgLy8gVXBkYXRlIGFsaWduQm91bmRzIGJhc2VkIG9uIHByZWZlcnJlZCBzaXplc1xyXG4gICAgTXVsdGlsaW5rLm11bHRpbGluayggWyB0aGlzLmxvY2FsUHJlZmVycmVkV2lkdGhQcm9wZXJ0eSwgdGhpcy5sb2NhbFByZWZlcnJlZEhlaWdodFByb3BlcnR5IF0sICggcHJlZmVycmVkV2lkdGgsIHByZWZlcnJlZEhlaWdodCApID0+IHtcclxuICAgICAgaWYgKCBwcmVmZXJyZWRXaWR0aCAhPT0gbnVsbCB8fCBwcmVmZXJyZWRIZWlnaHQgIT09IG51bGwgKSB7XHJcbiAgICAgICAgY29uc3QgYm91bmRzID0gdGhpcy5fYWxpZ25Cb3VuZHMgfHwgbmV3IEJvdW5kczIoIDAsIDAsIDAsIDAgKTtcclxuXHJcbiAgICAgICAgLy8gT3ZlcndyaXRlIGJvdW5kcyB3aXRoIGFueSBwcmVmZXJyZWQgc2V0dGluZywgd2l0aCB0aGUgbGVmdC90b3AgYXQgMFxyXG4gICAgICAgIGlmICggcHJlZmVycmVkV2lkdGggKSB7XHJcbiAgICAgICAgICBib3VuZHMubWluWCA9IDA7XHJcbiAgICAgICAgICBib3VuZHMubWF4WCA9IHByZWZlcnJlZFdpZHRoO1xyXG4gICAgICAgICAgdGhpcy5feFNldCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggcHJlZmVycmVkSGVpZ2h0ICkge1xyXG4gICAgICAgICAgYm91bmRzLm1pblkgPSAwO1xyXG4gICAgICAgICAgYm91bmRzLm1heFkgPSBwcmVmZXJyZWRIZWlnaHQ7XHJcbiAgICAgICAgICB0aGlzLl95U2V0ID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE1hbnVhbCB1cGRhdGUgYW5kIGxheW91dFxyXG4gICAgICAgIHRoaXMuX2FsaWduQm91bmRzID0gYm91bmRzO1xyXG4gICAgICAgIHRoaXMuY29uc3RyYWludC51cGRhdGVMYXlvdXQoKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVHJpZ2dlcnMgcmVjb21wdXRhdGlvbiBvZiB0aGUgYWxpZ25tZW50LiBTaG91bGQgYmUgY2FsbGVkIGlmIGl0IG5lZWRzIHRvIGJlIHJlZnJlc2hlZC5cclxuICAgKlxyXG4gICAqIE5PVEU6IGFsaWduQm94LmdldEJvdW5kcygpIHdpbGwgbm90IHRyaWdnZXIgYSBib3VuZHMgdmFsaWRhdGlvbiBmb3Igb3VyIGNvbnRlbnQsIGFuZCB0aHVzIFdJTEwgTk9UIHRyaWdnZXJcclxuICAgKiBsYXlvdXQuIGNvbnRlbnQuZ2V0Qm91bmRzKCkgc2hvdWxkIHRyaWdnZXIgaXQsIGJ1dCBpbnZhbGlkYXRlQWxpZ21lbnQoKSBpcyB0aGUgcHJlZmVycmVkIG1ldGhvZCBmb3IgZm9yY2luZyBhXHJcbiAgICogcmUtY2hlY2suXHJcbiAgICovXHJcbiAgcHVibGljIGludmFsaWRhdGVBbGlnbm1lbnQoKTogdm9pZCB7XHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuQWxpZ25Cb3ggJiYgc2NlbmVyeUxvZy5BbGlnbkJveCggYEFsaWduQm94IyR7dGhpcy5pZH0gaW52YWxpZGF0ZUFsaWdubWVudGAgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5BbGlnbkJveCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICAvLyBUaGUgZ3JvdXAgdXBkYXRlIHdpbGwgY2hhbmdlIG91ciBhbGlnbkJvdW5kcyBpZiByZXF1aXJlZC5cclxuICAgIGlmICggdGhpcy5fZ3JvdXAgKSB7XHJcbiAgICAgIHRoaXMuX2dyb3VwLm9uQWxpZ25Cb3hSZXNpemVkKCB0aGlzICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSWYgdGhlIGFsaWduQm91bmRzIGRpZG4ndCBjaGFuZ2UsIHdlJ2xsIHN0aWxsIG5lZWQgdG8gdXBkYXRlIG91ciBvd24gbGF5b3V0XHJcbiAgICB0aGlzLmNvbnN0cmFpbnQudXBkYXRlTGF5b3V0KCk7XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkFsaWduQm94ICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBhbGlnbm1lbnQgYm91bmRzICh0aGUgYm91bmRzIGluIHdoaWNoIG91ciBjb250ZW50IHdpbGwgYmUgYWxpZ25lZCkuIElmIG51bGwsIEFsaWduQm94IHdpbGwgYWN0XHJcbiAgICogYXMgaWYgdGhlIGFsaWdubWVudCBib3VuZHMgaGF2ZSBhIGxlZnQtdG9wIGNvcm5lciBvZiAoMCwwKSBhbmQgd2l0aCBhIHdpZHRoL2hlaWdodCB0aGF0IGZpdHMgdGhlIGNvbnRlbnQgYW5kXHJcbiAgICogYm91bmRzLlxyXG4gICAqXHJcbiAgICogTk9URTogSWYgdGhlIGdyb3VwIGlzIGEgdmFsaWQgQWxpZ25Hcm91cCwgaXQgd2lsbCBiZSByZXNwb25zaWJsZSBmb3Igc2V0dGluZyB0aGUgYWxpZ25Cb3VuZHMuXHJcbiAgICovXHJcbiAgcHVibGljIHNldEFsaWduQm91bmRzKCBhbGlnbkJvdW5kczogQm91bmRzMiB8IG51bGwgKTogdGhpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhbGlnbkJvdW5kcyA9PT0gbnVsbCB8fCAoIGFsaWduQm91bmRzIGluc3RhbmNlb2YgQm91bmRzMiAmJiAhYWxpZ25Cb3VuZHMuaXNFbXB0eSgpICYmIGFsaWduQm91bmRzLmlzRmluaXRlKCkgKSxcclxuICAgICAgJ2FsaWduQm91bmRzIHNob3VsZCBiZSBhIG5vbi1lbXB0eSBmaW5pdGUgQm91bmRzMicgKTtcclxuXHJcbiAgICB0aGlzLl94U2V0ID0gdHJ1ZTtcclxuICAgIHRoaXMuX3lTZXQgPSB0cnVlO1xyXG5cclxuICAgIC8vIFNlZSBpZiB0aGUgYm91bmRzIGhhdmUgY2hhbmdlZC4gSWYgYm90aCBhcmUgQm91bmRzMiB3aXRoIHRoZSBzYW1lIHZhbHVlLCB3ZSB3b24ndCB1cGRhdGUgaXQuXHJcbiAgICBpZiAoIHRoaXMuX2FsaWduQm91bmRzICE9PSBhbGlnbkJvdW5kcyAmJlxyXG4gICAgICAgICAoICFhbGlnbkJvdW5kcyB8fFxyXG4gICAgICAgICAgICF0aGlzLl9hbGlnbkJvdW5kcyB8fFxyXG4gICAgICAgICAgICFhbGlnbkJvdW5kcy5lcXVhbHMoIHRoaXMuX2FsaWduQm91bmRzICkgKSApIHtcclxuICAgICAgdGhpcy5fYWxpZ25Cb3VuZHMgPSBhbGlnbkJvdW5kcztcclxuXHJcbiAgICAgIHRoaXMuY29uc3RyYWludC51cGRhdGVMYXlvdXQoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgYWxpZ25Cb3VuZHMoIHZhbHVlOiBCb3VuZHMyIHwgbnVsbCApIHsgdGhpcy5zZXRBbGlnbkJvdW5kcyggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGFsaWduQm91bmRzKCk6IEJvdW5kczIgfCBudWxsIHsgcmV0dXJuIHRoaXMuZ2V0QWxpZ25Cb3VuZHMoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IGFsaWdubWVudCBib3VuZHMgKGlmIGF2YWlsYWJsZSwgc2VlIHNldEFsaWduQm91bmRzIGZvciBkZXRhaWxzKS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0QWxpZ25Cb3VuZHMoKTogQm91bmRzMiB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuX2FsaWduQm91bmRzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgYXR0YWNobWVudCB0byBhbiBBbGlnbkdyb3VwLiBXaGVuIGF0dGFjaGVkLCBvdXIgYWxpZ25Cb3VuZHMgd2lsbCBiZSBjb250cm9sbGVkIGJ5IHRoZSBncm91cC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0R3JvdXAoIGdyb3VwOiBBbGlnbkdyb3VwIHwgbnVsbCApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGdyb3VwID09PSBudWxsIHx8IGdyb3VwIGluc3RhbmNlb2YgQWxpZ25Hcm91cCwgJ2dyb3VwIHNob3VsZCBiZSBhbiBBbGlnbkdyb3VwJyApO1xyXG5cclxuICAgIGlmICggdGhpcy5fZ3JvdXAgIT09IGdyb3VwICkge1xyXG4gICAgICAvLyBSZW1vdmUgZnJvbSBhIHByZXZpb3VzIGdyb3VwXHJcbiAgICAgIGlmICggdGhpcy5fZ3JvdXAgKSB7XHJcbiAgICAgICAgdGhpcy5fZ3JvdXAucmVtb3ZlQWxpZ25Cb3goIHRoaXMgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5fZ3JvdXAgPSBncm91cDtcclxuXHJcbiAgICAgIC8vIEFkZCB0byBhIG5ldyBncm91cFxyXG4gICAgICBpZiAoIHRoaXMuX2dyb3VwICkge1xyXG4gICAgICAgIHRoaXMuX2dyb3VwLmFkZEFsaWduQm94KCB0aGlzICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgZ3JvdXAoIHZhbHVlOiBBbGlnbkdyb3VwIHwgbnVsbCApIHsgdGhpcy5zZXRHcm91cCggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGdyb3VwKCk6IEFsaWduR3JvdXAgfCBudWxsIHsgcmV0dXJuIHRoaXMuZ2V0R3JvdXAoKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBhdHRhY2hlZCBhbGlnbm1lbnQgZ3JvdXAgKGlmIG9uZSBleGlzdHMpLCBvciBudWxsIG90aGVyd2lzZS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0R3JvdXAoKTogQWxpZ25Hcm91cCB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuX2dyb3VwO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgaG9yaXpvbnRhbCBhbGlnbm1lbnQgb2YgdGhpcyBib3guXHJcbiAgICovXHJcbiAgcHVibGljIHNldFhBbGlnbiggeEFsaWduOiBBbGlnbkJveFhBbGlnbiApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIEFsaWduQm94WEFsaWduVmFsdWVzLmluY2x1ZGVzKCB4QWxpZ24gKSwgYHhBbGlnbiBzaG91bGQgYmUgb25lIG9mOiAke0FsaWduQm94WEFsaWduVmFsdWVzfWAgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX3hBbGlnbiAhPT0geEFsaWduICkge1xyXG4gICAgICB0aGlzLl94QWxpZ24gPSB4QWxpZ247XHJcblxyXG4gICAgICAvLyBUcmlnZ2VyIHJlLWxheW91dFxyXG4gICAgICB0aGlzLmludmFsaWRhdGVBbGlnbm1lbnQoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgeEFsaWduKCB2YWx1ZTogQWxpZ25Cb3hYQWxpZ24gKSB7IHRoaXMuc2V0WEFsaWduKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgeEFsaWduKCk6IEFsaWduQm94WEFsaWduIHsgcmV0dXJuIHRoaXMuZ2V0WEFsaWduKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY3VycmVudCBob3Jpem9udGFsIGFsaWdubWVudCBvZiB0aGlzIGJveC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0WEFsaWduKCk6IEFsaWduQm94WEFsaWduIHtcclxuICAgIHJldHVybiB0aGlzLl94QWxpZ247XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB2ZXJ0aWNhbCBhbGlnbm1lbnQgb2YgdGhpcyBib3guXHJcbiAgICovXHJcbiAgcHVibGljIHNldFlBbGlnbiggeUFsaWduOiBBbGlnbkJveFlBbGlnbiApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIEFsaWduQm94WUFsaWduVmFsdWVzLmluY2x1ZGVzKCB5QWxpZ24gKSwgYHhBbGlnbiBzaG91bGQgYmUgb25lIG9mOiAke0FsaWduQm94WUFsaWduVmFsdWVzfWAgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX3lBbGlnbiAhPT0geUFsaWduICkge1xyXG4gICAgICB0aGlzLl95QWxpZ24gPSB5QWxpZ247XHJcblxyXG4gICAgICAvLyBUcmlnZ2VyIHJlLWxheW91dFxyXG4gICAgICB0aGlzLmludmFsaWRhdGVBbGlnbm1lbnQoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgeUFsaWduKCB2YWx1ZTogQWxpZ25Cb3hZQWxpZ24gKSB7IHRoaXMuc2V0WUFsaWduKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgeUFsaWduKCk6IEFsaWduQm94WUFsaWduIHsgcmV0dXJuIHRoaXMuZ2V0WUFsaWduKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY3VycmVudCB2ZXJ0aWNhbCBhbGlnbm1lbnQgb2YgdGhpcyBib3guXHJcbiAgICovXHJcbiAgcHVibGljIGdldFlBbGlnbigpOiBBbGlnbkJveFlBbGlnbiB7XHJcbiAgICByZXR1cm4gdGhpcy5feUFsaWduO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgbWFyZ2luIG9mIHRoaXMgYm94IChzZXR0aW5nIG1hcmdpbiB2YWx1ZXMgZm9yIGFsbCBzaWRlcyBhdCBvbmNlKS5cclxuICAgKlxyXG4gICAqIFRoaXMgbWFyZ2luIGlzIHRoZSBtaW5pbXVtIGFtb3VudCBvZiBob3Jpem9udGFsIHNwYWNlIHRoYXQgd2lsbCBleGlzdCBiZXR3ZWVuIHRoZSBjb250ZW50IHRoZSBzaWRlcyBvZiB0aGlzXHJcbiAgICogYm94LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRNYXJnaW4oIG1hcmdpbjogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIG1hcmdpbiApICYmIG1hcmdpbiA+PSAwLFxyXG4gICAgICAnbWFyZ2luIHNob3VsZCBiZSBhIGZpbml0ZSBub24tbmVnYXRpdmUgbnVtYmVyJyApO1xyXG5cclxuICAgIGlmICggdGhpcy5fbGVmdE1hcmdpbiAhPT0gbWFyZ2luIHx8XHJcbiAgICAgICAgIHRoaXMuX3JpZ2h0TWFyZ2luICE9PSBtYXJnaW4gfHxcclxuICAgICAgICAgdGhpcy5fdG9wTWFyZ2luICE9PSBtYXJnaW4gfHxcclxuICAgICAgICAgdGhpcy5fYm90dG9tTWFyZ2luICE9PSBtYXJnaW4gKSB7XHJcbiAgICAgIHRoaXMuX2xlZnRNYXJnaW4gPSB0aGlzLl9yaWdodE1hcmdpbiA9IHRoaXMuX3RvcE1hcmdpbiA9IHRoaXMuX2JvdHRvbU1hcmdpbiA9IG1hcmdpbjtcclxuXHJcbiAgICAgIC8vIFRyaWdnZXIgcmUtbGF5b3V0XHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZUFsaWdubWVudCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBtYXJnaW4oIHZhbHVlOiBudW1iZXIgKSB7IHRoaXMuc2V0TWFyZ2luKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgbWFyZ2luKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldE1hcmdpbigpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGN1cnJlbnQgbWFyZ2luIG9mIHRoaXMgYm94IChhc3N1bWluZyBhbGwgbWFyZ2luIHZhbHVlcyBhcmUgdGhlIHNhbWUpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRNYXJnaW4oKTogbnVtYmVyIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2xlZnRNYXJnaW4gPT09IHRoaXMuX3JpZ2h0TWFyZ2luICYmXHJcbiAgICB0aGlzLl9sZWZ0TWFyZ2luID09PSB0aGlzLl90b3BNYXJnaW4gJiZcclxuICAgIHRoaXMuX2xlZnRNYXJnaW4gPT09IHRoaXMuX2JvdHRvbU1hcmdpbixcclxuICAgICAgJ0dldHRpbmcgbWFyZ2luIGRvZXMgbm90IGhhdmUgYSB1bmlxdWUgcmVzdWx0IGlmIHRoZSBsZWZ0IGFuZCByaWdodCBtYXJnaW5zIGFyZSBkaWZmZXJlbnQnICk7XHJcbiAgICByZXR1cm4gdGhpcy5fbGVmdE1hcmdpbjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGhvcml6b250YWwgbWFyZ2luIG9mIHRoaXMgYm94IChzZXR0aW5nIGJvdGggbGVmdCBhbmQgcmlnaHQgbWFyZ2lucyBhdCBvbmNlKS5cclxuICAgKlxyXG4gICAqIFRoaXMgbWFyZ2luIGlzIHRoZSBtaW5pbXVtIGFtb3VudCBvZiBob3Jpem9udGFsIHNwYWNlIHRoYXQgd2lsbCBleGlzdCBiZXR3ZWVuIHRoZSBjb250ZW50IGFuZCB0aGUgbGVmdCBhbmRcclxuICAgKiByaWdodCBzaWRlcyBvZiB0aGlzIGJveC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0WE1hcmdpbiggeE1hcmdpbjogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHhNYXJnaW4gKSAmJiB4TWFyZ2luID49IDAsXHJcbiAgICAgICd4TWFyZ2luIHNob3VsZCBiZSBhIGZpbml0ZSBub24tbmVnYXRpdmUgbnVtYmVyJyApO1xyXG5cclxuICAgIGlmICggdGhpcy5fbGVmdE1hcmdpbiAhPT0geE1hcmdpbiB8fCB0aGlzLl9yaWdodE1hcmdpbiAhPT0geE1hcmdpbiApIHtcclxuICAgICAgdGhpcy5fbGVmdE1hcmdpbiA9IHRoaXMuX3JpZ2h0TWFyZ2luID0geE1hcmdpbjtcclxuXHJcbiAgICAgIC8vIFRyaWdnZXIgcmUtbGF5b3V0XHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZUFsaWdubWVudCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCB4TWFyZ2luKCB2YWx1ZTogbnVtYmVyICkgeyB0aGlzLnNldFhNYXJnaW4oIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCB4TWFyZ2luKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldFhNYXJnaW4oKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IGhvcml6b250YWwgbWFyZ2luIG9mIHRoaXMgYm94IChhc3N1bWluZyB0aGUgbGVmdCBhbmQgcmlnaHQgbWFyZ2lucyBhcmUgdGhlIHNhbWUpLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRYTWFyZ2luKCk6IG51bWJlciB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl9sZWZ0TWFyZ2luID09PSB0aGlzLl9yaWdodE1hcmdpbixcclxuICAgICAgJ0dldHRpbmcgeE1hcmdpbiBkb2VzIG5vdCBoYXZlIGEgdW5pcXVlIHJlc3VsdCBpZiB0aGUgbGVmdCBhbmQgcmlnaHQgbWFyZ2lucyBhcmUgZGlmZmVyZW50JyApO1xyXG4gICAgcmV0dXJuIHRoaXMuX2xlZnRNYXJnaW47XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB2ZXJ0aWNhbCBtYXJnaW4gb2YgdGhpcyBib3ggKHNldHRpbmcgYm90aCB0b3AgYW5kIGJvdHRvbSBtYXJnaW5zIGF0IG9uY2UpLlxyXG4gICAqXHJcbiAgICogVGhpcyBtYXJnaW4gaXMgdGhlIG1pbmltdW0gYW1vdW50IG9mIHZlcnRpY2FsIHNwYWNlIHRoYXQgd2lsbCBleGlzdCBiZXR3ZWVuIHRoZSBjb250ZW50IGFuZCB0aGUgdG9wIGFuZFxyXG4gICAqIGJvdHRvbSBzaWRlcyBvZiB0aGlzIGJveC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0WU1hcmdpbiggeU1hcmdpbjogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHlNYXJnaW4gKSAmJiB5TWFyZ2luID49IDAsXHJcbiAgICAgICd5TWFyZ2luIHNob3VsZCBiZSBhIGZpbml0ZSBub24tbmVnYXRpdmUgbnVtYmVyJyApO1xyXG5cclxuICAgIGlmICggdGhpcy5fdG9wTWFyZ2luICE9PSB5TWFyZ2luIHx8IHRoaXMuX2JvdHRvbU1hcmdpbiAhPT0geU1hcmdpbiApIHtcclxuICAgICAgdGhpcy5fdG9wTWFyZ2luID0gdGhpcy5fYm90dG9tTWFyZ2luID0geU1hcmdpbjtcclxuXHJcbiAgICAgIC8vIFRyaWdnZXIgcmUtbGF5b3V0XHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZUFsaWdubWVudCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCB5TWFyZ2luKCB2YWx1ZTogbnVtYmVyICkgeyB0aGlzLnNldFlNYXJnaW4oIHZhbHVlICk7IH1cclxuXHJcbiAgcHVibGljIGdldCB5TWFyZ2luKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldFlNYXJnaW4oKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IHZlcnRpY2FsIG1hcmdpbiBvZiB0aGlzIGJveCAoYXNzdW1pbmcgdGhlIHRvcCBhbmQgYm90dG9tIG1hcmdpbnMgYXJlIHRoZSBzYW1lKS5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0WU1hcmdpbigpOiBudW1iZXIge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5fdG9wTWFyZ2luID09PSB0aGlzLl9ib3R0b21NYXJnaW4sXHJcbiAgICAgICdHZXR0aW5nIHlNYXJnaW4gZG9lcyBub3QgaGF2ZSBhIHVuaXF1ZSByZXN1bHQgaWYgdGhlIHRvcCBhbmQgYm90dG9tIG1hcmdpbnMgYXJlIGRpZmZlcmVudCcgKTtcclxuICAgIHJldHVybiB0aGlzLl90b3BNYXJnaW47XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBsZWZ0IG1hcmdpbiBvZiB0aGlzIGJveC5cclxuICAgKlxyXG4gICAqIFRoaXMgbWFyZ2luIGlzIHRoZSBtaW5pbXVtIGFtb3VudCBvZiBob3Jpem9udGFsIHNwYWNlIHRoYXQgd2lsbCBleGlzdCBiZXR3ZWVuIHRoZSBjb250ZW50IGFuZCB0aGUgbGVmdCBzaWRlIG9mXHJcbiAgICogdGhlIGJveC5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0TGVmdE1hcmdpbiggbGVmdE1hcmdpbjogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIGxlZnRNYXJnaW4gKSAmJiBsZWZ0TWFyZ2luID49IDAsXHJcbiAgICAgICdsZWZ0TWFyZ2luIHNob3VsZCBiZSBhIGZpbml0ZSBub24tbmVnYXRpdmUgbnVtYmVyJyApO1xyXG5cclxuICAgIGlmICggdGhpcy5fbGVmdE1hcmdpbiAhPT0gbGVmdE1hcmdpbiApIHtcclxuICAgICAgdGhpcy5fbGVmdE1hcmdpbiA9IGxlZnRNYXJnaW47XHJcblxyXG4gICAgICAvLyBUcmlnZ2VyIHJlLWxheW91dFxyXG4gICAgICB0aGlzLmludmFsaWRhdGVBbGlnbm1lbnQoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgbGVmdE1hcmdpbiggdmFsdWU6IG51bWJlciApIHsgdGhpcy5zZXRMZWZ0TWFyZ2luKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgbGVmdE1hcmdpbigpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRMZWZ0TWFyZ2luKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY3VycmVudCBsZWZ0IG1hcmdpbiBvZiB0aGlzIGJveC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TGVmdE1hcmdpbigpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX2xlZnRNYXJnaW47XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSByaWdodCBtYXJnaW4gb2YgdGhpcyBib3guXHJcbiAgICpcclxuICAgKiBUaGlzIG1hcmdpbiBpcyB0aGUgbWluaW11bSBhbW91bnQgb2YgaG9yaXpvbnRhbCBzcGFjZSB0aGF0IHdpbGwgZXhpc3QgYmV0d2VlbiB0aGUgY29udGVudCBhbmQgdGhlIHJpZ2h0IHNpZGUgb2ZcclxuICAgKiB0aGUgY29udGFpbmVyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRSaWdodE1hcmdpbiggcmlnaHRNYXJnaW46IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCByaWdodE1hcmdpbiApICYmIHJpZ2h0TWFyZ2luID49IDAsXHJcbiAgICAgICdyaWdodE1hcmdpbiBzaG91bGQgYmUgYSBmaW5pdGUgbm9uLW5lZ2F0aXZlIG51bWJlcicgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX3JpZ2h0TWFyZ2luICE9PSByaWdodE1hcmdpbiApIHtcclxuICAgICAgdGhpcy5fcmlnaHRNYXJnaW4gPSByaWdodE1hcmdpbjtcclxuXHJcbiAgICAgIC8vIFRyaWdnZXIgcmUtbGF5b3V0XHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZUFsaWdubWVudCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCByaWdodE1hcmdpbiggdmFsdWU6IG51bWJlciApIHsgdGhpcy5zZXRSaWdodE1hcmdpbiggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHJpZ2h0TWFyZ2luKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldFJpZ2h0TWFyZ2luKCk7IH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY3VycmVudCByaWdodCBtYXJnaW4gb2YgdGhpcyBib3guXHJcbiAgICovXHJcbiAgcHVibGljIGdldFJpZ2h0TWFyZ2luKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fcmlnaHRNYXJnaW47XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB0b3AgbWFyZ2luIG9mIHRoaXMgYm94LlxyXG4gICAqXHJcbiAgICogVGhpcyBtYXJnaW4gaXMgdGhlIG1pbmltdW0gYW1vdW50IG9mIHZlcnRpY2FsIHNwYWNlIHRoYXQgd2lsbCBleGlzdCBiZXR3ZWVuIHRoZSBjb250ZW50IGFuZCB0aGUgdG9wIHNpZGUgb2YgdGhlXHJcbiAgICogY29udGFpbmVyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRUb3BNYXJnaW4oIHRvcE1hcmdpbjogbnVtYmVyICk6IHRoaXMge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaXNGaW5pdGUoIHRvcE1hcmdpbiApICYmIHRvcE1hcmdpbiA+PSAwLFxyXG4gICAgICAndG9wTWFyZ2luIHNob3VsZCBiZSBhIGZpbml0ZSBub24tbmVnYXRpdmUgbnVtYmVyJyApO1xyXG5cclxuICAgIGlmICggdGhpcy5fdG9wTWFyZ2luICE9PSB0b3BNYXJnaW4gKSB7XHJcbiAgICAgIHRoaXMuX3RvcE1hcmdpbiA9IHRvcE1hcmdpbjtcclxuXHJcbiAgICAgIC8vIFRyaWdnZXIgcmUtbGF5b3V0XHJcbiAgICAgIHRoaXMuaW52YWxpZGF0ZUFsaWdubWVudCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCB0b3BNYXJnaW4oIHZhbHVlOiBudW1iZXIgKSB7IHRoaXMuc2V0VG9wTWFyZ2luKCB2YWx1ZSApOyB9XHJcblxyXG4gIHB1YmxpYyBnZXQgdG9wTWFyZ2luKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldFRvcE1hcmdpbigpOyB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGN1cnJlbnQgdG9wIG1hcmdpbiBvZiB0aGlzIGJveC5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0VG9wTWFyZ2luKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fdG9wTWFyZ2luO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgYm90dG9tIG1hcmdpbiBvZiB0aGlzIGJveC5cclxuICAgKlxyXG4gICAqIFRoaXMgbWFyZ2luIGlzIHRoZSBtaW5pbXVtIGFtb3VudCBvZiB2ZXJ0aWNhbCBzcGFjZSB0aGF0IHdpbGwgZXhpc3QgYmV0d2VlbiB0aGUgY29udGVudCBhbmQgdGhlIGJvdHRvbSBzaWRlIG9mIHRoZVxyXG4gICAqIGNvbnRhaW5lci5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0Qm90dG9tTWFyZ2luKCBib3R0b21NYXJnaW46IG51bWJlciApOiB0aGlzIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBib3R0b21NYXJnaW4gKSAmJiBib3R0b21NYXJnaW4gPj0gMCxcclxuICAgICAgJ2JvdHRvbU1hcmdpbiBzaG91bGQgYmUgYSBmaW5pdGUgbm9uLW5lZ2F0aXZlIG51bWJlcicgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuX2JvdHRvbU1hcmdpbiAhPT0gYm90dG9tTWFyZ2luICkge1xyXG4gICAgICB0aGlzLl9ib3R0b21NYXJnaW4gPSBib3R0b21NYXJnaW47XHJcblxyXG4gICAgICAvLyBUcmlnZ2VyIHJlLWxheW91dFxyXG4gICAgICB0aGlzLmludmFsaWRhdGVBbGlnbm1lbnQoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgYm90dG9tTWFyZ2luKCB2YWx1ZTogbnVtYmVyICkgeyB0aGlzLnNldEJvdHRvbU1hcmdpbiggdmFsdWUgKTsgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGJvdHRvbU1hcmdpbigpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXRCb3R0b21NYXJnaW4oKTsgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IGJvdHRvbSBtYXJnaW4gb2YgdGhpcyBib3guXHJcbiAgICovXHJcbiAgcHVibGljIGdldEJvdHRvbU1hcmdpbigpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX2JvdHRvbU1hcmdpbjtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXRDb250ZW50KCk6IE5vZGUge1xyXG4gICAgcmV0dXJuIHRoaXMuX2NvbnRlbnQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGNvbnRlbnQoKTogTm9kZSB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRDb250ZW50KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBib3VuZGluZyBib3ggb2YgdGhpcyBib3gncyBjb250ZW50LiBUaGlzIHdpbGwgaW5jbHVkZSBhbnkgbWFyZ2lucy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q29udGVudEJvdW5kcygpOiBCb3VuZHMyIHtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5BbGlnbkJveCAmJiBzY2VuZXJ5TG9nLkFsaWduQm94KCBgQWxpZ25Cb3gjJHt0aGlzLmlkfSBnZXRDb250ZW50Qm91bmRzYCApO1xyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkFsaWduQm94ICYmIHNjZW5lcnlMb2cucHVzaCgpO1xyXG5cclxuICAgIGNvbnN0IGJvdW5kcyA9IHRoaXMuX2NvbnRlbnQuYm91bmRzO1xyXG5cclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5BbGlnbkJveCAmJiBzY2VuZXJ5TG9nLnBvcCgpO1xyXG5cclxuICAgIHJldHVybiBuZXcgQm91bmRzMiggYm91bmRzLmxlZnQgLSB0aGlzLl9sZWZ0TWFyZ2luLFxyXG4gICAgICBib3VuZHMudG9wIC0gdGhpcy5fdG9wTWFyZ2luLFxyXG4gICAgICBib3VuZHMucmlnaHQgKyB0aGlzLl9yaWdodE1hcmdpbixcclxuICAgICAgYm91bmRzLmJvdHRvbSArIHRoaXMuX2JvdHRvbU1hcmdpbiApO1xyXG4gIH1cclxuXHJcbiAgLy8gc2NlbmVyeS1pbnRlcm5hbCwgZGVzaWduZWQgc28gdGhhdCB3ZSBjYW4gaWdub3JlIGFkanVzdGluZyBjZXJ0YWluIGRpbWVuc2lvbnNcclxuICBwdWJsaWMgc2V0QWRqdXN0ZWRMb2NhbEJvdW5kcyggYm91bmRzOiBCb3VuZHMyICk6IHZvaWQge1xyXG4gICAgaWYgKCB0aGlzLl94U2V0ICYmIHRoaXMuX3lTZXQgKSB7XHJcbiAgICAgIHRoaXMubG9jYWxCb3VuZHMgPSBib3VuZHM7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggdGhpcy5feFNldCApIHtcclxuICAgICAgY29uc3QgY29udGVudEJvdW5kcyA9IHRoaXMuZ2V0Q29udGVudEJvdW5kcygpO1xyXG5cclxuICAgICAgdGhpcy5sb2NhbEJvdW5kcyA9IG5ldyBCb3VuZHMyKCBib3VuZHMubWluWCwgY29udGVudEJvdW5kcy5taW5ZLCBib3VuZHMubWF4WCwgY29udGVudEJvdW5kcy5tYXhZICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggdGhpcy5feVNldCApIHtcclxuICAgICAgY29uc3QgY29udGVudEJvdW5kcyA9IHRoaXMuZ2V0Q29udGVudEJvdW5kcygpO1xyXG5cclxuICAgICAgdGhpcy5sb2NhbEJvdW5kcyA9IG5ldyBCb3VuZHMyKCBjb250ZW50Qm91bmRzLm1pblgsIGJvdW5kcy5taW5ZLCBjb250ZW50Qm91bmRzLm1heFgsIGJvdW5kcy5tYXhZICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy5sb2NhbEJvdW5kcyA9IHRoaXMuZ2V0Q29udGVudEJvdW5kcygpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGlzcG9zZXMgdGhpcyBib3gsIHJlbGVhc2luZyBsaXN0ZW5lcnMgYW5kIGFueSByZWZlcmVuY2VzIHRvIGFuIEFsaWduR3JvdXBcclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuXHJcbiAgICB0aGlzLl9hbGlnbkJvdW5kc1Byb3BlcnR5ICYmIHRoaXMuX2FsaWduQm91bmRzUHJvcGVydHkudW5saW5rKCB0aGlzLl9hbGlnbkJvdW5kc1Byb3BlcnR5TGlzdGVuZXIgKTtcclxuXHJcbiAgICAvLyBSZW1vdmUgb3VyIGxpc3RlbmVyXHJcbiAgICB0aGlzLl9jb250ZW50LmJvdW5kc1Byb3BlcnR5LnVubGluayggdGhpcy5fY29udGVudEJvdW5kc0xpc3RlbmVyICk7XHJcbiAgICB0aGlzLl9jb250ZW50ID0gbmV3IE5vZGUoKTsgLy8gY2xlYXIgdGhlIHJlZmVyZW5jZSBmb3IgR0NcclxuXHJcbiAgICAvLyBEaXNjb25uZWN0cyBmcm9tIHRoZSBncm91cFxyXG4gICAgdGhpcy5ncm91cCA9IG51bGw7XHJcblxyXG4gICAgdGhpcy5jb25zdHJhaW50LmRpc3Bvc2UoKTtcclxuXHJcbiAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgbXV0YXRlKCBvcHRpb25zPzogQWxpZ25Cb3hPcHRpb25zICk6IHRoaXMge1xyXG4gICAgcmV0dXJuIHN1cGVyLm11dGF0ZSggb3B0aW9ucyApO1xyXG4gIH1cclxufVxyXG5cclxuLy8gTGF5b3V0IGxvZ2ljIGZvciBBbGlnbkJveFxyXG5jbGFzcyBBbGlnbkJveENvbnN0cmFpbnQgZXh0ZW5kcyBMYXlvdXRDb25zdHJhaW50IHtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBhbGlnbkJveDogQWxpZ25Cb3g7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBjb250ZW50OiBOb2RlO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIGFsaWduQm94OiBBbGlnbkJveCwgY29udGVudDogTm9kZSApIHtcclxuICAgIHN1cGVyKCBhbGlnbkJveCApO1xyXG5cclxuICAgIHRoaXMuYWxpZ25Cb3ggPSBhbGlnbkJveDtcclxuICAgIHRoaXMuY29udGVudCA9IGNvbnRlbnQ7XHJcblxyXG4gICAgdGhpcy5hZGROb2RlKCBjb250ZW50ICk7XHJcblxyXG4gICAgYWxpZ25Cb3guaXNXaWR0aFJlc2l6YWJsZVByb3BlcnR5LmxhenlMaW5rKCB0aGlzLl91cGRhdGVMYXlvdXRMaXN0ZW5lciApO1xyXG4gICAgYWxpZ25Cb3guaXNIZWlnaHRSZXNpemFibGVQcm9wZXJ0eS5sYXp5TGluayggdGhpcy5fdXBkYXRlTGF5b3V0TGlzdGVuZXIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbmRpdGlvbmFsbHkgdXBkYXRlcyBhIGNlcnRhaW4gcHJvcGVydHkgb2Ygb3VyIGNvbnRlbnQncyBwb3NpdGlvbmluZy5cclxuICAgKlxyXG4gICAqIEVzc2VudGlhbGx5IGRvZXMgdGhlIGZvbGxvd2luZyAoYnV0IHByZXZlbnRzIGluZmluaXRlIGxvb3BzIGJ5IG5vdCBhcHBseWluZyBjaGFuZ2VzIGlmIHRoZSBudW1iZXJzIGFyZSB2ZXJ5XHJcbiAgICogc2ltaWxhcik6XHJcbiAgICogdGhpcy5fY29udGVudFsgcHJvcE5hbWUgXSA9IHRoaXMubG9jYWxCb3VuZHNbIHByb3BOYW1lIF0gKyBvZmZzZXQ7XHJcbiAgICpcclxuICAgKiBAcGFyYW0gcHJvcE5hbWUgLSBBIHBvc2l0aW9uYWwgcHJvcGVydHkgb24gYm90aCBOb2RlIGFuZCBCb3VuZHMyLCBlLmcuICdsZWZ0J1xyXG4gICAqIEBwYXJhbSBvZmZzZXQgLSBPZmZzZXQgdG8gYmUgYXBwbGllZCB0byB0aGUgbG9jYWxCb3VuZHMgbG9jYXRpb24uXHJcbiAgICovXHJcbiAgcHJpdmF0ZSB1cGRhdGVQcm9wZXJ0eSggcHJvcE5hbWU6ICdsZWZ0JyB8ICdyaWdodCcgfCAndG9wJyB8ICdib3R0b20nIHwgJ2NlbnRlclgnIHwgJ2NlbnRlclknLCBvZmZzZXQ6IG51bWJlciApOiB2b2lkIHtcclxuICAgIGNvbnN0IGN1cnJlbnRWYWx1ZSA9IHRoaXMuY29udGVudFsgcHJvcE5hbWUgXTtcclxuICAgIGNvbnN0IG5ld1ZhbHVlID0gdGhpcy5hbGlnbkJveC5sb2NhbEJvdW5kc1sgcHJvcE5hbWUgXSArIG9mZnNldDtcclxuXHJcbiAgICAvLyBQcmV2ZW50IGluZmluaXRlIGxvb3BzIG9yIHN0YWNrIG92ZXJmbG93cyBieSBpZ25vcmluZyB0aW55IGNoYW5nZXNcclxuICAgIGlmICggTWF0aC5hYnMoIGN1cnJlbnRWYWx1ZSAtIG5ld1ZhbHVlICkgPiAxZS01ICkge1xyXG4gICAgICB0aGlzLmNvbnRlbnRbIHByb3BOYW1lIF0gPSBuZXdWYWx1ZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBvdmVycmlkZSBsYXlvdXQoKTogdm9pZCB7XHJcbiAgICBzdXBlci5sYXlvdXQoKTtcclxuXHJcbiAgICBjb25zdCBib3ggPSB0aGlzLmFsaWduQm94O1xyXG4gICAgY29uc3QgY29udGVudCA9IHRoaXMuY29udGVudDtcclxuXHJcbiAgICBzY2VuZXJ5TG9nICYmIHNjZW5lcnlMb2cuQWxpZ25Cb3ggJiYgc2NlbmVyeUxvZy5BbGlnbkJveCggYEFsaWduQm94Q29uc3RyYWludCMke3RoaXMuYWxpZ25Cb3guaWR9IGxheW91dGAgKTtcclxuICAgIHNjZW5lcnlMb2cgJiYgc2NlbmVyeUxvZy5BbGlnbkJveCAmJiBzY2VuZXJ5TG9nLnB1c2goKTtcclxuXHJcbiAgICBpZiAoICFjb250ZW50LmJvdW5kcy5pc1ZhbGlkKCkgKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0b3RhbFhNYXJnaW5zID0gYm94LmxlZnRNYXJnaW4gKyBib3gucmlnaHRNYXJnaW47XHJcbiAgICBjb25zdCB0b3RhbFlNYXJnaW5zID0gYm94LnRvcE1hcmdpbiArIGJveC5ib3R0b21NYXJnaW47XHJcblxyXG4gICAgLy8gSWYgd2UgaGF2ZSBhbGlnbkJvdW5kcywgdXNlIHRoYXQuXHJcbiAgICBpZiAoIGJveC5hbGlnbkJvdW5kcyAhPT0gbnVsbCApIHtcclxuICAgICAgYm94LnNldEFkanVzdGVkTG9jYWxCb3VuZHMoIGJveC5hbGlnbkJvdW5kcyApO1xyXG4gICAgfVxyXG4gICAgLy8gT3RoZXJ3aXNlLCB3ZSdsbCBncmFiIGEgQm91bmRzMiBhbmNob3JlZCBhdCB0aGUgdXBwZXItbGVmdCB3aXRoIG91ciByZXF1aXJlZCBkaW1lbnNpb25zLlxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGNvbnN0IHdpZHRoV2l0aE1hcmdpbiA9IGNvbnRlbnQud2lkdGggKyB0b3RhbFhNYXJnaW5zO1xyXG4gICAgICBjb25zdCBoZWlnaHRXaXRoTWFyZ2luID0gY29udGVudC5oZWlnaHQgKyB0b3RhbFlNYXJnaW5zO1xyXG4gICAgICBib3guc2V0QWRqdXN0ZWRMb2NhbEJvdW5kcyggbmV3IEJvdW5kczIoIDAsIDAsIHdpZHRoV2l0aE1hcmdpbiwgaGVpZ2h0V2l0aE1hcmdpbiApICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbWluaW11bVdpZHRoID0gaXNGaW5pdGUoIGNvbnRlbnQud2lkdGggKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgPyAoIGlzV2lkdGhTaXphYmxlKCBjb250ZW50ICkgPyBjb250ZW50Lm1pbmltdW1XaWR0aCB8fCAwIDogY29udGVudC53aWR0aCApICsgdG90YWxYTWFyZ2luc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiBudWxsO1xyXG4gICAgY29uc3QgbWluaW11bUhlaWdodCA9IGlzRmluaXRlKCBjb250ZW50LmhlaWdodCApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPyAoIGlzSGVpZ2h0U2l6YWJsZSggY29udGVudCApID8gY29udGVudC5taW5pbXVtSGVpZ2h0IHx8IDAgOiBjb250ZW50LmhlaWdodCApICsgdG90YWxZTWFyZ2luc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDogbnVsbDtcclxuXHJcbiAgICAvLyBEb24ndCB0cnkgdG8gbGF5IG91dCBlbXB0eSBib3VuZHNcclxuICAgIGlmICggIWNvbnRlbnQubG9jYWxCb3VuZHMuaXNFbXB0eSgpICkge1xyXG5cclxuICAgICAgaWYgKCBib3gueEFsaWduID09PSAnY2VudGVyJyApIHtcclxuICAgICAgICB0aGlzLnVwZGF0ZVByb3BlcnR5KCAnY2VudGVyWCcsICggYm94LmxlZnRNYXJnaW4gLSBib3gucmlnaHRNYXJnaW4gKSAvIDIgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggYm94LnhBbGlnbiA9PT0gJ2xlZnQnICkge1xyXG4gICAgICAgIHRoaXMudXBkYXRlUHJvcGVydHkoICdsZWZ0JywgYm94LmxlZnRNYXJnaW4gKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggYm94LnhBbGlnbiA9PT0gJ3JpZ2h0JyApIHtcclxuICAgICAgICB0aGlzLnVwZGF0ZVByb3BlcnR5KCAncmlnaHQnLCAtYm94LnJpZ2h0TWFyZ2luICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIGJveC54QWxpZ24gPT09ICdzdHJldGNoJyApIHtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpc1dpZHRoU2l6YWJsZSggY29udGVudCApLCAneEFsaWduOnN0cmV0Y2ggY2FuIG9ubHkgYmUgdXNlZCBpZiBXaWR0aFNpemFibGUgaXMgbWl4ZWQgaW50byB0aGUgY29udGVudCcgKTtcclxuICAgICAgICAoIGNvbnRlbnQgYXMgV2lkdGhTaXphYmxlTm9kZSApLnByZWZlcnJlZFdpZHRoID0gYm94LmxvY2FsV2lkdGggLSBib3gubGVmdE1hcmdpbiAtIGJveC5yaWdodE1hcmdpbjtcclxuICAgICAgICB0aGlzLnVwZGF0ZVByb3BlcnR5KCAnbGVmdCcsIGJveC5sZWZ0TWFyZ2luICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggYEJhZCB4QWxpZ246ICR7Ym94LnhBbGlnbn1gICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggYm94LnlBbGlnbiA9PT0gJ2NlbnRlcicgKSB7XHJcbiAgICAgICAgdGhpcy51cGRhdGVQcm9wZXJ0eSggJ2NlbnRlclknLCAoIGJveC50b3BNYXJnaW4gLSBib3guYm90dG9tTWFyZ2luICkgLyAyICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIGJveC55QWxpZ24gPT09ICd0b3AnICkge1xyXG4gICAgICAgIHRoaXMudXBkYXRlUHJvcGVydHkoICd0b3AnLCBib3gudG9wTWFyZ2luICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIGJveC55QWxpZ24gPT09ICdib3R0b20nICkge1xyXG4gICAgICAgIHRoaXMudXBkYXRlUHJvcGVydHkoICdib3R0b20nLCAtYm94LmJvdHRvbU1hcmdpbiApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCBib3gueUFsaWduID09PSAnc3RyZXRjaCcgKSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggaXNIZWlnaHRTaXphYmxlKCBjb250ZW50ICksICd5QWxpZ246c3RyZXRjaCBjYW4gb25seSBiZSB1c2VkIGlmIEhlaWdodFNpemFibGUgaXMgbWl4ZWQgaW50byB0aGUgY29udGVudCcgKTtcclxuICAgICAgICAoIGNvbnRlbnQgYXMgSGVpZ2h0U2l6YWJsZU5vZGUgKS5wcmVmZXJyZWRIZWlnaHQgPSBib3gubG9jYWxIZWlnaHQgLSBib3gudG9wTWFyZ2luIC0gYm94LmJvdHRvbU1hcmdpbjtcclxuICAgICAgICB0aGlzLnVwZGF0ZVByb3BlcnR5KCAndG9wJywgYm94LnRvcE1hcmdpbiApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGBCYWQgeUFsaWduOiAke2JveC55QWxpZ259YCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2NlbmVyeUxvZyAmJiBzY2VuZXJ5TG9nLkFsaWduQm94ICYmIHNjZW5lcnlMb2cucG9wKCk7XHJcblxyXG4gICAgLy8gQWZ0ZXIgdGhlIGxheW91dCBsb2NrIG9uIHB1cnBvc2UgKHdlIHdhbnQgdGhlc2UgdG8gYmUgcmVlbnRyYW50LCBlc3BlY2lhbGx5IGlmIHRoZXkgY2hhbmdlKSAtIGhvd2V2ZXIgb25seSBhcHBseVxyXG4gICAgLy8gdGhpcyBjb25jZXB0IGlmIHdlJ3JlIGNhcGFibGUgb2Ygc2hyaW5raW5nICh3ZSB3YW50IHRoZSBkZWZhdWx0IHRvIGNvbnRpbnVlIHRvIGJsb2NrIG9mZiB0aGUgbGF5b3V0Qm91bmRzKVxyXG4gICAgYm94LmxvY2FsTWluaW11bVdpZHRoID0gYm94LndpZHRoU2l6YWJsZSA/IG1pbmltdW1XaWR0aCA6IGJveC5sb2NhbFdpZHRoO1xyXG4gICAgYm94LmxvY2FsTWluaW11bUhlaWdodCA9IGJveC5oZWlnaHRTaXphYmxlID8gbWluaW11bUhlaWdodCA6IGJveC5sb2NhbEhlaWdodDtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiB7QXJyYXkuPHN0cmluZz59IC0gU3RyaW5nIGtleXMgZm9yIGFsbCBvZiB0aGUgYWxsb3dlZCBvcHRpb25zIHRoYXQgd2lsbCBiZSBzZXQgYnkgbm9kZS5tdXRhdGUoIG9wdGlvbnMgKSwgaW4gdGhlXHJcbiAqIG9yZGVyIHRoZXkgd2lsbCBiZSBldmFsdWF0ZWQgaW4uXHJcbiAqXHJcbiAqIE5PVEU6IFNlZSBOb2RlJ3MgX211dGF0b3JLZXlzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24gb24gaG93IHRoaXMgb3BlcmF0ZXMsIGFuZCBwb3RlbnRpYWwgc3BlY2lhbFxyXG4gKiAgICAgICBjYXNlcyB0aGF0IG1heSBhcHBseS5cclxuICovXHJcbkFsaWduQm94LnByb3RvdHlwZS5fbXV0YXRvcktleXMgPSBBTElHTk1FTlRfQ09OVEFJTkVSX09QVElPTl9LRVlTLmNvbmNhdCggU3VwZXJUeXBlLnByb3RvdHlwZS5fbXV0YXRvcktleXMgKTtcclxuXHJcbnNjZW5lcnkucmVnaXN0ZXIoICdBbGlnbkJveCcsIEFsaWduQm94ICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxTQUFTLE1BQU0sa0NBQWtDO0FBRXhELE9BQU9DLE9BQU8sTUFBTSwrQkFBK0I7QUFDbkQsT0FBT0MsU0FBUyxNQUE0Qix1Q0FBdUM7QUFDbkYsU0FBU0MsVUFBVSxFQUFxQkMsZUFBZSxFQUFFQyxjQUFjLEVBQUVDLGdCQUFnQixFQUFFQyxJQUFJLEVBQWVDLE9BQU8sRUFBRUMsT0FBTyxRQUEwQyxrQkFBa0I7QUFFMUwsT0FBT0MsOEJBQThCLE1BQU0sNERBQTREO0FBRXZHLE1BQU1DLCtCQUErQixHQUFHLENBQ3RDLGFBQWE7QUFBRTtBQUNmLFFBQVE7QUFBRTtBQUNWLFFBQVE7QUFBRTtBQUNWLFFBQVE7QUFBRTtBQUNWLFNBQVM7QUFBRTtBQUNYLFNBQVM7QUFBRTtBQUNYLFlBQVk7QUFBRTtBQUNkLGFBQWE7QUFBRTtBQUNmLFdBQVc7QUFBRTtBQUNiLGNBQWM7QUFBRTtBQUNoQixPQUFPLENBQUM7QUFBQSxDQUNUO0FBRUQsT0FBTyxNQUFNQyxvQkFBb0IsR0FBRyxDQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBVztBQUdyRixPQUFPLE1BQU1DLG9CQUFvQixHQUFHLENBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFXO0FBc0JyRixNQUFNQyxTQUFTLEdBQUdMLE9BQU8sQ0FBRUYs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