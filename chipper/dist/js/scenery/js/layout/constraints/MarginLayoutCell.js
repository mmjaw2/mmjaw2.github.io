// Copyright 2021-2024, University of Colorado Boulder

/**
 * A LayoutCell that has margins, and can be positioned and sized relative to those. Used for Flow/Grid layouts
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Bounds2 from '../../../../dot/js/Bounds2.js';
import Matrix3 from '../../../../dot/js/Matrix3.js';
import Utils from '../../../../dot/js/Utils.js';
import { Shape } from '../../../../kite/js/imports.js';
import Orientation from '../../../../phet-core/js/Orientation.js';
import OrientationPair from '../../../../phet-core/js/OrientationPair.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import { Font, LayoutAlign, LayoutCell, Node, NodePattern, Path, PressListener, Rectangle, RichText, scenery, Text } from '../../imports.js';

// Interface expected to be overridden by subtypes (GridCell, FlowCell)

// NOTE: This would be an abstract class, but that is incompatible with how mixin constraints work in TypeScript
export default class MarginLayoutCell extends LayoutCell {
  preferredSizeSet = new OrientationPair(false, false);

  // These will get overridden, they're needed since mixins have many limitations and we'd have to have a ton of casts
  // without these existing.
  // (scenery-internal)

  // (scenery-internal) Set to be the bounds available for the cell
  lastAvailableBounds = Bounds2.NOTHING.copy();

  // (scenery-internal) Set to be the bounds used by the cell
  lastUsedBounds = Bounds2.NOTHING.copy();

  /**
   * NOTE: Consider this scenery-internal AND protected. It's effectively a protected constructor for an abstract type,
   * but cannot be due to how mixins constrain things (TypeScript doesn't work with private/protected things like this)
   *
   * (scenery-internal)
   */
  constructor(constraint, node, proxy) {
    super(constraint, node, proxy);
    this._marginConstraint = constraint;
  }

  /**
   * Positions and sizes the cell (used for grid and flow layouts)
   * (scenery-internal)
   *
   * Returns the cell's bounds
   */
  reposition(orientation, lineSize, linePosition, stretch, originOffset, align) {
    // Mimicking https://www.w3.org/TR/css-flexbox-1/#align-items-property for baseline (for our origin)
    // Origin will sync all origin-based items (so their origin matches), and then position ALL of that as if it was
    // align:left or align:top (depending on the orientation).

    const preferredSize = stretch && this.isSizable(orientation) ? lineSize : this.getMinimumSize(orientation);
    if (assert) {
      const maxSize = orientation === Orientation.HORIZONTAL ? this.node.maxWidth : this.node.maxHeight;
      assert(!this.isSizable(orientation) || maxSize === null || Math.abs(maxSize - preferredSize) > -1e-9, `Tried to set a preferred size ${preferredSize} larger than the specified max${orientation === Orientation.HORIZONTAL ? 'Width' : 'Height'} of ${maxSize}. ` + 'Ideally, try to avoid putting a maxWidth/maxHeight on a width/height-sizable Node (one that will resize to fit its preferred size) inside a layout container, ' + 'particularly one that will try to expand the Node past its maximum size.');
    }
    this.attemptPreferredSize(orientation, preferredSize);
    if (align === LayoutAlign.ORIGIN) {
      this.positionOrigin(orientation, linePosition + originOffset);
    } else {
      this.positionStart(orientation, linePosition + (lineSize - this.getCellBounds()[orientation.size]) * align.padRatio);
    }
    const cellBounds = this.getCellBounds();
    assert && assert(cellBounds.isFinite());
    this.lastAvailableBounds[orientation.minCoordinate] = linePosition;
    this.lastAvailableBounds[orientation.maxCoordinate] = linePosition + lineSize;
    this.lastUsedBounds.set(cellBounds);
    return cellBounds;
  }

  /**
   * Returns the used value, with this cell's value taking precedence over the constraint's default
   * (scenery-internal)
   */
  get effectiveLeftMargin() {
    return this._leftMargin !== null ? this._leftMargin : this._marginConstraint._leftMargin;
  }

  /**
   * Returns the used value, with this cell's value taking precedence over the constraint's default
   * (scenery-internal)
   */
  get effectiveRightMargin() {
    return this._rightMargin !== null ? this._rightMargin : this._marginConstraint._rightMargin;
  }

  /**
   * Returns the used value, with this cell's value taking precedence over the constraint's default
   * (scenery-internal)
   */
  get effectiveTopMargin() {
    return this._topMargin !== null ? this._topMargin : this._marginConstraint._topMargin;
  }

  /**
   * Returns the used value, with this cell's value taking precedence over the constraint's default
   * (scenery-internal)
   */
  get effectiveBottomMargin() {
    return this._bottomMargin !== null ? this._bottomMargin : this._marginConstraint._bottomMargin;
  }

  /**
   * (scenery-internal)
   */
  getEffectiveMinMargin(orientation) {
    return orientation === Orientation.HORIZONTAL ? this.effectiveLeftMargin : this.effectiveTopMargin;
  }

  /**
   * (scenery-internal)
   */
  getEffectiveMaxMargin(orientation) {
    return orientation === Orientation.HORIZONTAL ? this.effectiveRightMargin : this.effectiveBottomMargin;
  }

  /**
   * Returns the used value, with this cell's value taking precedence over the constraint's default
   * (scenery-internal)
   */
  get effectiveMinContentWidth() {
    return this._minContentWidth !== null ? this._minContentWidth : this._marginConstraint._minContentWidth;
  }

  /**
   * Returns the used value, with this cell's value taking precedence over the constraint's default
   * (scenery-internal)
   */
  get effectiveMinContentHeight() {
    return this._minContentHeight !== null ? this._minContentHeight : this._marginConstraint._minContentHeight;
  }

  /**
   * (scenery-internal)
   */
  getEffectiveMinContent(orientation) {
    return orientation === Orientation.HORIZONTAL ? this.effectiveMinContentWidth : this.effectiveMinContentHeight;
  }

  /**
   * Returns the used value, with this cell's value taking precedence over the constraint's default
   * (scenery-internal)
   */
  get effectiveMaxContentWidth() {
    return this._maxContentWidth !== null ? this._maxContentWidth : this._marginConstraint._maxContentWidth;
  }

  /**
   * Returns the used value, with this cell's value taking precedence over the constraint's default
   * (scenery-internal)
   */
  get effectiveMaxContentHeight() {
    return this._maxContentHeight !== null ? this._maxContentHeight : this._marginConstraint._maxContentHeight;
  }

  /**
   * (scenery-internal)
   */
  getEffectiveMaxContent(orientation) {
    return orientation === Orientation.HORIZONTAL ? this.effectiveMaxContentWidth : this.effectiveMaxContentHeight;
  }

  /**
   * Returns the effective minimum size this cell can take (including the margins)
   * (scenery-internal)
   */
  getMinimumSize(orientation) {
    return this.getEffectiveMinMargin(orientation) + Math.max(this.proxy.getMinimum(orientation), this.getEffectiveMinContent(orientation) || 0) + this.getEffectiveMaxMargin(orientation);
  }

  /**
   * Returns the effective maximum size this cell can take (including the margins)
   * (scenery-internal)
   */
  getMaximumSize(orientation) {
    return this.getEffectiveMinMargin(orientation) + (this.getEffectiveMaxContent(orientation) || Number.POSITIVE_INFINITY) + this.getEffectiveMaxMargin(orientation);
  }

  /**
   * Sets a preferred size on the content, obeying many constraints.
   * (scenery-internal)
   */
  attemptPreferredSize(orientation, value) {
    if (this.proxy[orientation.sizable]) {
      const minimumSize = this.getMinimumSize(orientation);
      const maximumSize = this.getMaximumSize(orientation);
      assert && assert(isFinite(minimumSize));
      assert && assert(maximumSize >= minimumSize);
      value = Utils.clamp(value, minimumSize, maximumSize);
      let preferredSize = value - this.getEffectiveMinMargin(orientation) - this.getEffectiveMaxMargin(orientation);
      const maxSize = this.proxy.getMax(orientation);
      if (maxSize !== null) {
        preferredSize = Math.min(maxSize, preferredSize);
      }
      this._marginConstraint.setProxyPreferredSize(orientation, this.proxy, preferredSize);

      // Record that we set
      this.preferredSizeSet.set(orientation, true);
    }
  }

  /**
   * Unsets the preferred size (if WE set it)
   * (scenery-internal)
   */
  unsetPreferredSize(orientation) {
    if (this.proxy[orientation.sizable]) {
      this._marginConstraint.setProxyPreferredSize(orientation, this.proxy, null);
    }
  }

  /**
   * Sets the left/top position of the (content+margin) for the cell in the constraint's ancestor coordinate frame.
   * (scenery-internal)
   */
  positionStart(orientation, value) {
    const start = this.getEffectiveMinMargin(orientation) + value;
    this._marginConstraint.setProxyMinSide(orientation, this.proxy, start);
  }

  /**
   * Sets the x/y value of the content for the cell in the constraint's ancestor coordinate frame.
   * (scenery-internal)
   */
  positionOrigin(orientation, value) {
    this._marginConstraint.setProxyOrigin(orientation, this.proxy, value);
  }

  /**
   * Returns the bounding box of the cell if it was repositioned to have its origin shifted to the origin of the
   * ancestor node's local coordinate frame.
   * (scenery-internal)
   */
  getOriginBounds() {
    return this.getCellBounds().shiftedXY(-this.proxy.x, -this.proxy.y);
  }

  /**
   * The current bounds of the cell (with margins included)
   * (scenery-internal)
   */
  getCellBounds() {
    return this.proxy.bounds.withOffsets(this.effectiveLeftMargin, this.effectiveTopMargin, this.effectiveRightMargin, this.effectiveBottomMargin);
  }
  dispose() {
    // Unset the specified preferred sizes that were set by our layout (when we're removed)
    Orientation.enumeration.values.forEach(orientation => {
      if (this.preferredSizeSet.get(orientation)) {
        this.unsetPreferredSize(orientation);
      }
    });
    super.dispose();
  }
  static createHelperNode(cells, layoutBounds, cellToText) {
    const container = new Node();
    const lineWidth = 0.4;
    const availableCellsShape = Shape.union(cells.map(cell => Shape.bounds(cell.lastAvailableBounds)));
    const usedCellsShape = Shape.union(cells.map(cell => Shape.bounds(cell.lastUsedBounds)));
    const usedContentShape = Shape.union(cells.map(cell => Shape.bounds(cell.proxy.bounds)));
    const spacingShape = Shape.bounds(layoutBounds).shapeDifference(availableCellsShape);
    const emptyShape = availableCellsShape.shapeDifference(usedCellsShape);
    const marginShape = usedCellsShape.shapeDifference(usedContentShape);
    const createLabeledTexture = (label, foreground, background) => {
      const text = new Text(label, {
        font: new Font({
          size: 6,
          family: 'monospace'
        }),
        fill: foreground
      });
      const rectangle = Rectangle.bounds(text.bounds, {
        fill: background,
        children: [text]
      });
      return new NodePattern(rectangle, 4, Math.floor(rectangle.left), Math.ceil(rectangle.top + 1), Math.floor(rectangle.width), Math.floor(rectangle.height - 2), Matrix3.rotation2(-Math.PI / 4));
    };
    container.addChild(new Path(spacingShape, {
      fill: createLabeledTexture('spacing', '#000', '#fff'),
      opacity: 0.6
    }));
    container.addChild(new Path(emptyShape, {
      fill: createLabeledTexture('empty', '#aaa', '#000'),
      opacity: 0.6
    }));
    container.addChild(new Path(marginShape, {
      fill: createLabeledTexture('margin', '#600', '#f00'),
      opacity: 0.6
    }));
    container.addChild(Rectangle.bounds(layoutBounds, {
      stroke: 'white',
      lineDash: [2, 2],
      lineDashOffset: 2,
      lineWidth: lineWidth
    }));
    container.addChild(Rectangle.bounds(layoutBounds, {
      stroke: 'black',
      lineDash: [2, 2],
      lineWidth: lineWidth
    }));
    cells.forEach(cell => {
      container.addChild(Rectangle.bounds(cell.getCellBounds(), {
        stroke: 'rgba(0,255,0,1)',
        lineWidth: lineWidth
      }));
    });
    cells.forEach(cell => {
      container.addChild(Rectangle.bounds(cell.proxy.bounds, {
        stroke: 'rgba(255,0,0,1)',
        lineWidth: lineWidth
      }));
    });
    cells.forEach(cell => {
      const bounds = cell.getCellBounds();
      const hoverListener = new PressListener({
        tandem: Tandem.OPT_OUT
      });
      container.addChild(Rectangle.bounds(bounds, {
        inputListeners: [hoverListener]
      }));
      let str = cellToText(cell);
      if (cell.effectiveLeftMargin) {
        str += `leftMargin: ${cell.effectiveLeftMargin}\n`;
      }
      if (cell.effectiveRightMargin) {
        str += `rightMargin: ${cell.effectiveRightMargin}\n`;
      }
      if (cell.effectiveTopMargin) {
        str += `topMargin: ${cell.effectiveTopMargin}\n`;
      }
      if (cell.effectiveBottomMargin) {
        str += `bottomMargin: ${cell.effectiveBottomMargin}\n`;
      }
      if (cell.effectiveMinContentWidth) {
        str += `minContentWidth: ${cell.effectiveMinContentWidth}\n`;
      }
      if (cell.effectiveMinContentHeight) {
        str += `minContentHeight: ${cell.effectiveMinContentHeight}\n`;
      }
      if (cell.effectiveMaxContentWidth) {
        str += `maxContentWidth: ${cell.effectiveMaxContentWidth}\n`;
      }
      if (cell.effectiveMaxContentHeight) {
        str += `maxContentHeight: ${cell.effectiveMaxContentHeight}\n`;
      }
      str += `layoutOptions: ${JSON.stringify(cell.node.layoutOptions, null, 2).replace(/ /g, '&nbsp;')}\n`;
      const hoverText = new RichText(str.trim().replace(/\n/g, '<br>'), {
        font: new Font({
          size: 12
        })
      });
      const hoverNode = Rectangle.bounds(hoverText.bounds.dilated(3), {
        fill: 'rgba(255,255,255,0.8)',
        children: [hoverText],
        leftTop: bounds.leftTop
      });
      container.addChild(hoverNode);
      hoverListener.isOverProperty.link(isOver => {
        hoverNode.visible = isOver;
      });
    });
    return container;
  }
}
scenery.register('MarginLayoutCell', MarginLayoutCell);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb3VuZHMyIiwiTWF0cml4MyIsIlV0aWxzIiwiU2hhcGUiLCJPcmllbnRhdGlvbiIsIk9yaWVudGF0aW9uUGFpciIsIlRhbmRlbSIsIkZvbnQiLCJMYXlvdXRBbGlnbiIsIkxheW91dENlbGwiLCJOb2RlIiwiTm9kZVBhdHRlcm4iLCJQYXRoIiwiUHJlc3NMaXN0ZW5lciIsIlJlY3RhbmdsZSIsIlJpY2hUZXh0Iiwic2NlbmVyeSIsIlRleHQiLCJNYXJnaW5MYXlvdXRDZWxsIiwicHJlZmVycmVkU2l6ZVNldCIsImxhc3RBdmFpbGFibGVCb3VuZHMiLCJOT1RISU5HIiwiY29weSIsImxhc3RVc2VkQm91bmRzIiwiY29uc3RydWN0b3IiLCJjb25zdHJhaW50Iiwibm9kZSIsInByb3h5IiwiX21hcmdpbkNvbnN0cmFpbnQiLCJyZXBvc2l0aW9uIiwib3JpZW50YXRpb24iLCJsaW5lU2l6ZSIsImxpbmVQb3NpdGlvbiIsInN0cmV0Y2giLCJvcmlnaW5PZmZzZXQiLCJhbGlnbiIsInByZWZlcnJlZFNpemUiLCJpc1NpemFibGUiLCJnZXRNaW5pbXVtU2l6ZSIsImFzc2VydCIsIm1heFNpemUiLCJIT1JJWk9OVEFMIiwibWF4V2lkdGgiLCJtYXhIZWlnaHQiLCJNYXRoIiwiYWJzIiwiYXR0ZW1wdFByZWZlcnJlZFNpemUiLCJPUklHSU4iLCJwb3NpdGlvbk9yaWdpbiIsInBvc2l0aW9uU3RhcnQiLCJnZXRDZWxsQm91bmRzIiwic2l6ZSIsInBhZFJhdGlvIiwiY2VsbEJvdW5kcyIsImlzRmluaXRlIiwibWluQ29vcmRpbmF0ZSIsIm1heENvb3JkaW5hdGUiLCJzZXQiLCJlZmZlY3RpdmVMZWZ0TWFyZ2luIiwiX2xlZnRNYXJnaW4iLCJlZmZlY3RpdmVSaWdodE1hcmdpbiIsIl9yaWdodE1hcmdpbiIsImVmZmVjdGl2ZVRvcE1hcmdpbiIsIl90b3BNYXJnaW4iLCJlZmZlY3RpdmVCb3R0b21NYXJnaW4iLCJfYm90dG9tTWFyZ2luIiwiZ2V0RWZmZWN0aXZlTWluTWFyZ2luIiwiZ2V0RWZmZWN0aXZlTWF4TWFyZ2luIiwiZWZmZWN0aXZlTWluQ29udGVudFdpZHRoIiwiX21pbkNvbnRlbnRXaWR0aCIsImVmZmVjdGl2ZU1pbkNvbnRlbnRIZWlnaHQiLCJfbWluQ29udGVudEhlaWdodCIsImdldEVmZmVjdGl2ZU1pbkNvbnRlbnQiLCJlZmZlY3RpdmVNYXhDb250ZW50V2lkdGgiLCJfbWF4Q29udGVudFdpZHRoIiwiZWZmZWN0aXZlTWF4Q29udGVudEhlaWdodCIsIl9tYXhDb250ZW50SGVpZ2h0IiwiZ2V0RWZmZWN0aXZlTWF4Q29udGVudCIsIm1heCIsImdldE1pbmltdW0iLCJnZXRNYXhpbXVtU2l6ZSIsIk51bWJlciIsIlBPU0lUSVZFX0lORklOSVRZIiwidmFsdWUiLCJzaXphYmxlIiwibWluaW11bVNpemUiLCJtYXhpbXVtU2l6ZSIsImNsYW1wIiwiZ2V0TWF4IiwibWluIiwic2V0UHJveHlQcmVmZXJyZWRTaXplIiwidW5zZXRQcmVmZXJyZWRTaXplIiwic3RhcnQiLCJzZXRQcm94eU1pblNpZGUiLCJzZXRQcm94eU9yaWdpbiIsImdldE9yaWdpbkJvdW5kcyIsInNoaWZ0ZWRYWSIsIngiLCJ5IiwiYm91bmRzIiwid2l0aE9mZnNldHMiLCJkaXNwb3NlIiwiZW51bWVyYXRpb24iLCJ2YWx1ZXMiLCJmb3JFYWNoIiwiZ2V0IiwiY3JlYXRlSGVscGVyTm9kZSIsImNlbGxzIiwibGF5b3V0Qm91bmRzIiwiY2VsbFRvVGV4dCIsImNvbnRhaW5lciIsImxpbmVXaWR0aCIsImF2YWlsYWJsZUNlbGxzU2hhcGUiLCJ1bmlvbiIsIm1hcCIsImNlbGwiLCJ1c2VkQ2VsbHNTaGFwZSIsInVzZWRDb250ZW50U2hhcGUiLCJzcGFjaW5nU2hhcGUiLCJzaGFwZURpZmZlcmVuY2UiLCJlbXB0eVNoYXBlIiwibWFyZ2luU2hhcGUiLCJjcmVhdGVMYWJlbGVkVGV4dHVyZSIsImxhYmVsIiwiZm9yZWdyb3VuZCIsImJhY2tncm91bmQiLCJ0ZXh0IiwiZm9udCIsImZhbWlseSIsImZpbGwiLCJyZWN0YW5nbGUiLCJjaGlsZHJlbiIsImZsb29yIiwibGVmdCIsImNlaWwiLCJ0b3AiLCJ3aWR0aCIsImhlaWdodCIsInJvdGF0aW9uMiIsIlBJIiwiYWRkQ2hpbGQiLCJvcGFjaXR5Iiwic3Ryb2tlIiwibGluZURhc2giLCJsaW5lRGFzaE9mZnNldCIsImhvdmVyTGlzdGVuZXIiLCJ0YW5kZW0iLCJPUFRfT1VUIiwiaW5wdXRMaXN0ZW5lcnMiLCJzdHIiLCJKU09OIiwic3RyaW5naWZ5IiwibGF5b3V0T3B0aW9ucyIsInJlcGxhY2UiLCJob3ZlclRleHQiLCJ0cmltIiwiaG92ZXJOb2RlIiwiZGlsYXRlZCIsImxlZnRUb3AiLCJpc092ZXJQcm9wZXJ0eSIsImxpbmsiLCJpc092ZXIiLCJ2aXNpYmxlIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJNYXJnaW5MYXlvdXRDZWxsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEEgTGF5b3V0Q2VsbCB0aGF0IGhhcyBtYXJnaW5zLCBhbmQgY2FuIGJlIHBvc2l0aW9uZWQgYW5kIHNpemVkIHJlbGF0aXZlIHRvIHRob3NlLiBVc2VkIGZvciBGbG93L0dyaWQgbGF5b3V0c1xyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IEJvdW5kczIgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL0JvdW5kczIuanMnO1xyXG5pbXBvcnQgTWF0cml4MyBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvTWF0cml4My5qcyc7XHJcbmltcG9ydCBVdGlscyBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvVXRpbHMuanMnO1xyXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gJy4uLy4uLy4uLy4uL2tpdGUvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBPcmllbnRhdGlvbiBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvT3JpZW50YXRpb24uanMnO1xyXG5pbXBvcnQgT3JpZW50YXRpb25QYWlyIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9PcmllbnRhdGlvblBhaXIuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uLy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgeyBGb250LCBMYXlvdXRBbGlnbiwgTGF5b3V0Q2VsbCwgTGF5b3V0UHJveHksIE5vZGUsIE5vZGVMYXlvdXRDb25zdHJhaW50LCBOb2RlUGF0dGVybiwgUGF0aCwgUHJlc3NMaXN0ZW5lciwgUmVjdGFuZ2xlLCBSaWNoVGV4dCwgc2NlbmVyeSwgVENvbG9yLCBUZXh0IH0gZnJvbSAnLi4vLi4vaW1wb3J0cy5qcyc7XHJcblxyXG4vLyBJbnRlcmZhY2UgZXhwZWN0ZWQgdG8gYmUgb3ZlcnJpZGRlbiBieSBzdWJ0eXBlcyAoR3JpZENlbGwsIEZsb3dDZWxsKVxyXG5leHBvcnQgdHlwZSBNYXJnaW5MYXlvdXQgPSB7XHJcbiAgX2xlZnRNYXJnaW46IG51bWJlciB8IG51bGw7XHJcbiAgX3JpZ2h0TWFyZ2luOiBudW1iZXIgfCBudWxsO1xyXG4gIF90b3BNYXJnaW46IG51bWJlciB8IG51bGw7XHJcbiAgX2JvdHRvbU1hcmdpbjogbnVtYmVyIHwgbnVsbDtcclxuICBfbWluQ29udGVudFdpZHRoOiBudW1iZXIgfCBudWxsO1xyXG4gIF9taW5Db250ZW50SGVpZ2h0OiBudW1iZXIgfCBudWxsO1xyXG4gIF9tYXhDb250ZW50V2lkdGg6IG51bWJlciB8IG51bGw7XHJcbiAgX21heENvbnRlbnRIZWlnaHQ6IG51bWJlciB8IG51bGw7XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBNYXJnaW5MYXlvdXRDb25zdHJhaW50ID0gTm9kZUxheW91dENvbnN0cmFpbnQgJiBNYXJnaW5MYXlvdXQ7XHJcblxyXG4vLyBOT1RFOiBUaGlzIHdvdWxkIGJlIGFuIGFic3RyYWN0IGNsYXNzLCBidXQgdGhhdCBpcyBpbmNvbXBhdGlibGUgd2l0aCBob3cgbWl4aW4gY29uc3RyYWludHMgd29yayBpbiBUeXBlU2NyaXB0XHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1hcmdpbkxheW91dENlbGwgZXh0ZW5kcyBMYXlvdXRDZWxsIHtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBfbWFyZ2luQ29uc3RyYWludDogTWFyZ2luTGF5b3V0Q29uc3RyYWludDtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBwcmVmZXJyZWRTaXplU2V0OiBPcmllbnRhdGlvblBhaXI8Ym9vbGVhbj4gPSBuZXcgT3JpZW50YXRpb25QYWlyPGJvb2xlYW4+KCBmYWxzZSwgZmFsc2UgKTtcclxuXHJcbiAgLy8gVGhlc2Ugd2lsbCBnZXQgb3ZlcnJpZGRlbiwgdGhleSdyZSBuZWVkZWQgc2luY2UgbWl4aW5zIGhhdmUgbWFueSBsaW1pdGF0aW9ucyBhbmQgd2UnZCBoYXZlIHRvIGhhdmUgYSB0b24gb2YgY2FzdHNcclxuICAvLyB3aXRob3V0IHRoZXNlIGV4aXN0aW5nLlxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKVxyXG4gIHB1YmxpYyBfbGVmdE1hcmdpbiE6IG51bWJlciB8IG51bGw7XHJcbiAgcHVibGljIF9yaWdodE1hcmdpbiE6IG51bWJlciB8IG51bGw7XHJcbiAgcHVibGljIF90b3BNYXJnaW4hOiBudW1iZXIgfCBudWxsO1xyXG4gIHB1YmxpYyBfYm90dG9tTWFyZ2luITogbnVtYmVyIHwgbnVsbDtcclxuICBwdWJsaWMgX21pbkNvbnRlbnRXaWR0aCE6IG51bWJlciB8IG51bGw7XHJcbiAgcHVibGljIF9taW5Db250ZW50SGVpZ2h0ITogbnVtYmVyIHwgbnVsbDtcclxuICBwdWJsaWMgX21heENvbnRlbnRXaWR0aCE6IG51bWJlciB8IG51bGw7XHJcbiAgcHVibGljIF9tYXhDb250ZW50SGVpZ2h0ITogbnVtYmVyIHwgbnVsbDtcclxuXHJcbiAgLy8gKHNjZW5lcnktaW50ZXJuYWwpIFNldCB0byBiZSB0aGUgYm91bmRzIGF2YWlsYWJsZSBmb3IgdGhlIGNlbGxcclxuICBwdWJsaWMgbGFzdEF2YWlsYWJsZUJvdW5kczogQm91bmRzMiA9IEJvdW5kczIuTk9USElORy5jb3B5KCk7XHJcblxyXG4gIC8vIChzY2VuZXJ5LWludGVybmFsKSBTZXQgdG8gYmUgdGhlIGJvdW5kcyB1c2VkIGJ5IHRoZSBjZWxsXHJcbiAgcHVibGljIGxhc3RVc2VkQm91bmRzOiBCb3VuZHMyID0gQm91bmRzMi5OT1RISU5HLmNvcHkoKTtcclxuXHJcbiAgLyoqXHJcbiAgICogTk9URTogQ29uc2lkZXIgdGhpcyBzY2VuZXJ5LWludGVybmFsIEFORCBwcm90ZWN0ZWQuIEl0J3MgZWZmZWN0aXZlbHkgYSBwcm90ZWN0ZWQgY29uc3RydWN0b3IgZm9yIGFuIGFic3RyYWN0IHR5cGUsXHJcbiAgICogYnV0IGNhbm5vdCBiZSBkdWUgdG8gaG93IG1peGlucyBjb25zdHJhaW4gdGhpbmdzIChUeXBlU2NyaXB0IGRvZXNuJ3Qgd29yayB3aXRoIHByaXZhdGUvcHJvdGVjdGVkIHRoaW5ncyBsaWtlIHRoaXMpXHJcbiAgICpcclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIGNvbnN0cmFpbnQ6IE1hcmdpbkxheW91dENvbnN0cmFpbnQsIG5vZGU6IE5vZGUsIHByb3h5OiBMYXlvdXRQcm94eSB8IG51bGwgKSB7XHJcbiAgICBzdXBlciggY29uc3RyYWludCwgbm9kZSwgcHJveHkgKTtcclxuXHJcbiAgICB0aGlzLl9tYXJnaW5Db25zdHJhaW50ID0gY29uc3RyYWludDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFBvc2l0aW9ucyBhbmQgc2l6ZXMgdGhlIGNlbGwgKHVzZWQgZm9yIGdyaWQgYW5kIGZsb3cgbGF5b3V0cylcclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKlxyXG4gICAqIFJldHVybnMgdGhlIGNlbGwncyBib3VuZHNcclxuICAgKi9cclxuICBwdWJsaWMgcmVwb3NpdGlvbiggb3JpZW50YXRpb246IE9yaWVudGF0aW9uLCBsaW5lU2l6ZTogbnVtYmVyLCBsaW5lUG9zaXRpb246IG51bWJlciwgc3RyZXRjaDogYm9vbGVhbiwgb3JpZ2luT2Zmc2V0OiBudW1iZXIsIGFsaWduOiBMYXlvdXRBbGlnbiApOiBCb3VuZHMyIHtcclxuICAgIC8vIE1pbWlja2luZyBodHRwczovL3d3dy53My5vcmcvVFIvY3NzLWZsZXhib3gtMS8jYWxpZ24taXRlbXMtcHJvcGVydHkgZm9yIGJhc2VsaW5lIChmb3Igb3VyIG9yaWdpbilcclxuICAgIC8vIE9yaWdpbiB3aWxsIHN5bmMgYWxsIG9yaWdpbi1iYXNlZCBpdGVtcyAoc28gdGhlaXIgb3JpZ2luIG1hdGNoZXMpLCBhbmQgdGhlbiBwb3NpdGlvbiBBTEwgb2YgdGhhdCBhcyBpZiBpdCB3YXNcclxuICAgIC8vIGFsaWduOmxlZnQgb3IgYWxpZ246dG9wIChkZXBlbmRpbmcgb24gdGhlIG9yaWVudGF0aW9uKS5cclxuXHJcbiAgICBjb25zdCBwcmVmZXJyZWRTaXplID0gKCBzdHJldGNoICYmIHRoaXMuaXNTaXphYmxlKCBvcmllbnRhdGlvbiApICkgPyBsaW5lU2l6ZSA6IHRoaXMuZ2V0TWluaW11bVNpemUoIG9yaWVudGF0aW9uICk7XHJcblxyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgIGNvbnN0IG1heFNpemUgPSBvcmllbnRhdGlvbiA9PT0gT3JpZW50YXRpb24uSE9SSVpPTlRBTCA/IHRoaXMubm9kZS5tYXhXaWR0aCA6IHRoaXMubm9kZS5tYXhIZWlnaHQ7XHJcbiAgICAgIGFzc2VydCggIXRoaXMuaXNTaXphYmxlKCBvcmllbnRhdGlvbiApIHx8IG1heFNpemUgPT09IG51bGwgfHwgTWF0aC5hYnMoIG1heFNpemUgLSBwcmVmZXJyZWRTaXplICkgPiAtMWUtOSxcclxuICAgICAgICBgVHJpZWQgdG8gc2V0IGEgcHJlZmVycmVkIHNpemUgJHtwcmVmZXJyZWRTaXplfSBsYXJnZXIgdGhhbiB0aGUgc3BlY2lmaWVkIG1heCR7b3JpZW50YXRpb24gPT09IE9yaWVudGF0aW9uLkhPUklaT05UQUwgPyAnV2lkdGgnIDogJ0hlaWdodCd9IG9mICR7bWF4U2l6ZX0uIGAgK1xyXG4gICAgICAgICdJZGVhbGx5LCB0cnkgdG8gYXZvaWQgcHV0dGluZyBhIG1heFdpZHRoL21heEhlaWdodCBvbiBhIHdpZHRoL2hlaWdodC1zaXphYmxlIE5vZGUgKG9uZSB0aGF0IHdpbGwgcmVzaXplIHRvIGZpdCBpdHMgcHJlZmVycmVkIHNpemUpIGluc2lkZSBhIGxheW91dCBjb250YWluZXIsICcgK1xyXG4gICAgICAgICdwYXJ0aWN1bGFybHkgb25lIHRoYXQgd2lsbCB0cnkgdG8gZXhwYW5kIHRoZSBOb2RlIHBhc3QgaXRzIG1heGltdW0gc2l6ZS4nICk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5hdHRlbXB0UHJlZmVycmVkU2l6ZSggb3JpZW50YXRpb24sIHByZWZlcnJlZFNpemUgKTtcclxuXHJcbiAgICBpZiAoIGFsaWduID09PSBMYXlvdXRBbGlnbi5PUklHSU4gKSB7XHJcbiAgICAgIHRoaXMucG9zaXRpb25PcmlnaW4oIG9yaWVudGF0aW9uLCBsaW5lUG9zaXRpb24gKyBvcmlnaW5PZmZzZXQgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLnBvc2l0aW9uU3RhcnQoIG9yaWVudGF0aW9uLCBsaW5lUG9zaXRpb24gKyAoIGxpbmVTaXplIC0gdGhpcy5nZXRDZWxsQm91bmRzKClbIG9yaWVudGF0aW9uLnNpemUgXSApICogYWxpZ24ucGFkUmF0aW8gKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjZWxsQm91bmRzID0gdGhpcy5nZXRDZWxsQm91bmRzKCk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggY2VsbEJvdW5kcy5pc0Zpbml0ZSgpICk7XHJcblxyXG4gICAgdGhpcy5sYXN0QXZhaWxhYmxlQm91bmRzWyBvcmllbnRhdGlvbi5taW5Db29yZGluYXRlIF0gPSBsaW5lUG9zaXRpb247XHJcbiAgICB0aGlzLmxhc3RBdmFpbGFibGVCb3VuZHNbIG9yaWVudGF0aW9uLm1heENvb3JkaW5hdGUgXSA9IGxpbmVQb3NpdGlvbiArIGxpbmVTaXplO1xyXG4gICAgdGhpcy5sYXN0VXNlZEJvdW5kcy5zZXQoIGNlbGxCb3VuZHMgKTtcclxuXHJcbiAgICByZXR1cm4gY2VsbEJvdW5kcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHVzZWQgdmFsdWUsIHdpdGggdGhpcyBjZWxsJ3MgdmFsdWUgdGFraW5nIHByZWNlZGVuY2Ugb3ZlciB0aGUgY29uc3RyYWludCdzIGRlZmF1bHRcclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGVmZmVjdGl2ZUxlZnRNYXJnaW4oKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9sZWZ0TWFyZ2luICE9PSBudWxsID8gdGhpcy5fbGVmdE1hcmdpbiA6IHRoaXMuX21hcmdpbkNvbnN0cmFpbnQuX2xlZnRNYXJnaW4hO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgdXNlZCB2YWx1ZSwgd2l0aCB0aGlzIGNlbGwncyB2YWx1ZSB0YWtpbmcgcHJlY2VkZW5jZSBvdmVyIHRoZSBjb25zdHJhaW50J3MgZGVmYXVsdFxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgZWZmZWN0aXZlUmlnaHRNYXJnaW4oKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9yaWdodE1hcmdpbiAhPT0gbnVsbCA/IHRoaXMuX3JpZ2h0TWFyZ2luIDogdGhpcy5fbWFyZ2luQ29uc3RyYWludC5fcmlnaHRNYXJnaW4hO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgdXNlZCB2YWx1ZSwgd2l0aCB0aGlzIGNlbGwncyB2YWx1ZSB0YWtpbmcgcHJlY2VkZW5jZSBvdmVyIHRoZSBjb25zdHJhaW50J3MgZGVmYXVsdFxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgZWZmZWN0aXZlVG9wTWFyZ2luKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fdG9wTWFyZ2luICE9PSBudWxsID8gdGhpcy5fdG9wTWFyZ2luIDogdGhpcy5fbWFyZ2luQ29uc3RyYWludC5fdG9wTWFyZ2luITtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHVzZWQgdmFsdWUsIHdpdGggdGhpcyBjZWxsJ3MgdmFsdWUgdGFraW5nIHByZWNlZGVuY2Ugb3ZlciB0aGUgY29uc3RyYWludCdzIGRlZmF1bHRcclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGVmZmVjdGl2ZUJvdHRvbU1hcmdpbigpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX2JvdHRvbU1hcmdpbiAhPT0gbnVsbCA/IHRoaXMuX2JvdHRvbU1hcmdpbiA6IHRoaXMuX21hcmdpbkNvbnN0cmFpbnQuX2JvdHRvbU1hcmdpbiE7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0RWZmZWN0aXZlTWluTWFyZ2luKCBvcmllbnRhdGlvbjogT3JpZW50YXRpb24gKTogbnVtYmVyIHtcclxuICAgIHJldHVybiBvcmllbnRhdGlvbiA9PT0gT3JpZW50YXRpb24uSE9SSVpPTlRBTCA/IHRoaXMuZWZmZWN0aXZlTGVmdE1hcmdpbiA6IHRoaXMuZWZmZWN0aXZlVG9wTWFyZ2luO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIGdldEVmZmVjdGl2ZU1heE1hcmdpbiggb3JpZW50YXRpb246IE9yaWVudGF0aW9uICk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gb3JpZW50YXRpb24gPT09IE9yaWVudGF0aW9uLkhPUklaT05UQUwgPyB0aGlzLmVmZmVjdGl2ZVJpZ2h0TWFyZ2luIDogdGhpcy5lZmZlY3RpdmVCb3R0b21NYXJnaW47XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB1c2VkIHZhbHVlLCB3aXRoIHRoaXMgY2VsbCdzIHZhbHVlIHRha2luZyBwcmVjZWRlbmNlIG92ZXIgdGhlIGNvbnN0cmFpbnQncyBkZWZhdWx0XHJcbiAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBlZmZlY3RpdmVNaW5Db250ZW50V2lkdGgoKTogbnVtYmVyIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5fbWluQ29udGVudFdpZHRoICE9PSBudWxsID8gdGhpcy5fbWluQ29udGVudFdpZHRoIDogdGhpcy5fbWFyZ2luQ29uc3RyYWludC5fbWluQ29udGVudFdpZHRoO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgdXNlZCB2YWx1ZSwgd2l0aCB0aGlzIGNlbGwncyB2YWx1ZSB0YWtpbmcgcHJlY2VkZW5jZSBvdmVyIHRoZSBjb25zdHJhaW50J3MgZGVmYXVsdFxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgZWZmZWN0aXZlTWluQ29udGVudEhlaWdodCgpOiBudW1iZXIgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLl9taW5Db250ZW50SGVpZ2h0ICE9PSBudWxsID8gdGhpcy5fbWluQ29udGVudEhlaWdodCA6IHRoaXMuX21hcmdpbkNvbnN0cmFpbnQuX21pbkNvbnRlbnRIZWlnaHQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0RWZmZWN0aXZlTWluQ29udGVudCggb3JpZW50YXRpb246IE9yaWVudGF0aW9uICk6IG51bWJlciB8IG51bGwge1xyXG4gICAgcmV0dXJuIG9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5IT1JJWk9OVEFMID8gdGhpcy5lZmZlY3RpdmVNaW5Db250ZW50V2lkdGggOiB0aGlzLmVmZmVjdGl2ZU1pbkNvbnRlbnRIZWlnaHQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSB1c2VkIHZhbHVlLCB3aXRoIHRoaXMgY2VsbCdzIHZhbHVlIHRha2luZyBwcmVjZWRlbmNlIG92ZXIgdGhlIGNvbnN0cmFpbnQncyBkZWZhdWx0XHJcbiAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIGdldCBlZmZlY3RpdmVNYXhDb250ZW50V2lkdGgoKTogbnVtYmVyIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5fbWF4Q29udGVudFdpZHRoICE9PSBudWxsID8gdGhpcy5fbWF4Q29udGVudFdpZHRoIDogdGhpcy5fbWFyZ2luQ29uc3RyYWludC5fbWF4Q29udGVudFdpZHRoO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgdXNlZCB2YWx1ZSwgd2l0aCB0aGlzIGNlbGwncyB2YWx1ZSB0YWtpbmcgcHJlY2VkZW5jZSBvdmVyIHRoZSBjb25zdHJhaW50J3MgZGVmYXVsdFxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgZWZmZWN0aXZlTWF4Q29udGVudEhlaWdodCgpOiBudW1iZXIgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLl9tYXhDb250ZW50SGVpZ2h0ICE9PSBudWxsID8gdGhpcy5fbWF4Q29udGVudEhlaWdodCA6IHRoaXMuX21hcmdpbkNvbnN0cmFpbnQuX21heENvbnRlbnRIZWlnaHQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0RWZmZWN0aXZlTWF4Q29udGVudCggb3JpZW50YXRpb246IE9yaWVudGF0aW9uICk6IG51bWJlciB8IG51bGwge1xyXG4gICAgcmV0dXJuIG9yaWVudGF0aW9uID09PSBPcmllbnRhdGlvbi5IT1JJWk9OVEFMID8gdGhpcy5lZmZlY3RpdmVNYXhDb250ZW50V2lkdGggOiB0aGlzLmVmZmVjdGl2ZU1heENvbnRlbnRIZWlnaHQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBlZmZlY3RpdmUgbWluaW11bSBzaXplIHRoaXMgY2VsbCBjYW4gdGFrZSAoaW5jbHVkaW5nIHRoZSBtYXJnaW5zKVxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRNaW5pbXVtU2l6ZSggb3JpZW50YXRpb246IE9yaWVudGF0aW9uICk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRFZmZlY3RpdmVNaW5NYXJnaW4oIG9yaWVudGF0aW9uICkgK1xyXG4gICAgICAgICAgIE1hdGgubWF4KCB0aGlzLnByb3h5LmdldE1pbmltdW0oIG9yaWVudGF0aW9uICksIHRoaXMuZ2V0RWZmZWN0aXZlTWluQ29udGVudCggb3JpZW50YXRpb24gKSB8fCAwICkgK1xyXG4gICAgICAgICAgIHRoaXMuZ2V0RWZmZWN0aXZlTWF4TWFyZ2luKCBvcmllbnRhdGlvbiApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgZWZmZWN0aXZlIG1heGltdW0gc2l6ZSB0aGlzIGNlbGwgY2FuIHRha2UgKGluY2x1ZGluZyB0aGUgbWFyZ2lucylcclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TWF4aW11bVNpemUoIG9yaWVudGF0aW9uOiBPcmllbnRhdGlvbiApOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0RWZmZWN0aXZlTWluTWFyZ2luKCBvcmllbnRhdGlvbiApICtcclxuICAgICAgICAgICAoIHRoaXMuZ2V0RWZmZWN0aXZlTWF4Q29udGVudCggb3JpZW50YXRpb24gKSB8fCBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkgKSArXHJcbiAgICAgICAgICAgdGhpcy5nZXRFZmZlY3RpdmVNYXhNYXJnaW4oIG9yaWVudGF0aW9uICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIGEgcHJlZmVycmVkIHNpemUgb24gdGhlIGNvbnRlbnQsIG9iZXlpbmcgbWFueSBjb25zdHJhaW50cy5cclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgYXR0ZW1wdFByZWZlcnJlZFNpemUoIG9yaWVudGF0aW9uOiBPcmllbnRhdGlvbiwgdmFsdWU6IG51bWJlciApOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy5wcm94eVsgb3JpZW50YXRpb24uc2l6YWJsZSBdICkge1xyXG4gICAgICBjb25zdCBtaW5pbXVtU2l6ZSA9IHRoaXMuZ2V0TWluaW11bVNpemUoIG9yaWVudGF0aW9uICk7XHJcbiAgICAgIGNvbnN0IG1heGltdW1TaXplID0gdGhpcy5nZXRNYXhpbXVtU2l6ZSggb3JpZW50YXRpb24gKTtcclxuXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGlzRmluaXRlKCBtaW5pbXVtU2l6ZSApICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIG1heGltdW1TaXplID49IG1pbmltdW1TaXplICk7XHJcblxyXG4gICAgICB2YWx1ZSA9IFV0aWxzLmNsYW1wKCB2YWx1ZSwgbWluaW11bVNpemUsIG1heGltdW1TaXplICk7XHJcblxyXG4gICAgICBsZXQgcHJlZmVycmVkU2l6ZSA9IHZhbHVlIC0gdGhpcy5nZXRFZmZlY3RpdmVNaW5NYXJnaW4oIG9yaWVudGF0aW9uICkgLSB0aGlzLmdldEVmZmVjdGl2ZU1heE1hcmdpbiggb3JpZW50YXRpb24gKTtcclxuICAgICAgY29uc3QgbWF4U2l6ZSA9IHRoaXMucHJveHkuZ2V0TWF4KCBvcmllbnRhdGlvbiApO1xyXG4gICAgICBpZiAoIG1heFNpemUgIT09IG51bGwgKSB7XHJcbiAgICAgICAgcHJlZmVycmVkU2l6ZSA9IE1hdGgubWluKCBtYXhTaXplLCBwcmVmZXJyZWRTaXplICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuX21hcmdpbkNvbnN0cmFpbnQuc2V0UHJveHlQcmVmZXJyZWRTaXplKCBvcmllbnRhdGlvbiwgdGhpcy5wcm94eSwgcHJlZmVycmVkU2l6ZSApO1xyXG5cclxuICAgICAgLy8gUmVjb3JkIHRoYXQgd2Ugc2V0XHJcbiAgICAgIHRoaXMucHJlZmVycmVkU2l6ZVNldC5zZXQoIG9yaWVudGF0aW9uLCB0cnVlICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVbnNldHMgdGhlIHByZWZlcnJlZCBzaXplIChpZiBXRSBzZXQgaXQpXHJcbiAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIHVuc2V0UHJlZmVycmVkU2l6ZSggb3JpZW50YXRpb246IE9yaWVudGF0aW9uICk6IHZvaWQge1xyXG4gICAgaWYgKCB0aGlzLnByb3h5WyBvcmllbnRhdGlvbi5zaXphYmxlIF0gKSB7XHJcbiAgICAgIHRoaXMuX21hcmdpbkNvbnN0cmFpbnQuc2V0UHJveHlQcmVmZXJyZWRTaXplKCBvcmllbnRhdGlvbiwgdGhpcy5wcm94eSwgbnVsbCApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgbGVmdC90b3AgcG9zaXRpb24gb2YgdGhlIChjb250ZW50K21hcmdpbikgZm9yIHRoZSBjZWxsIGluIHRoZSBjb25zdHJhaW50J3MgYW5jZXN0b3IgY29vcmRpbmF0ZSBmcmFtZS5cclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgcG9zaXRpb25TdGFydCggb3JpZW50YXRpb246IE9yaWVudGF0aW9uLCB2YWx1ZTogbnVtYmVyICk6IHZvaWQge1xyXG4gICAgY29uc3Qgc3RhcnQgPSB0aGlzLmdldEVmZmVjdGl2ZU1pbk1hcmdpbiggb3JpZW50YXRpb24gKSArIHZhbHVlO1xyXG5cclxuICAgIHRoaXMuX21hcmdpbkNvbnN0cmFpbnQuc2V0UHJveHlNaW5TaWRlKCBvcmllbnRhdGlvbiwgdGhpcy5wcm94eSwgc3RhcnQgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHgveSB2YWx1ZSBvZiB0aGUgY29udGVudCBmb3IgdGhlIGNlbGwgaW4gdGhlIGNvbnN0cmFpbnQncyBhbmNlc3RvciBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBwb3NpdGlvbk9yaWdpbiggb3JpZW50YXRpb246IE9yaWVudGF0aW9uLCB2YWx1ZTogbnVtYmVyICk6IHZvaWQge1xyXG4gICAgdGhpcy5fbWFyZ2luQ29uc3RyYWludC5zZXRQcm94eU9yaWdpbiggb3JpZW50YXRpb24sIHRoaXMucHJveHksIHZhbHVlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBib3VuZGluZyBib3ggb2YgdGhlIGNlbGwgaWYgaXQgd2FzIHJlcG9zaXRpb25lZCB0byBoYXZlIGl0cyBvcmlnaW4gc2hpZnRlZCB0byB0aGUgb3JpZ2luIG9mIHRoZVxyXG4gICAqIGFuY2VzdG9yIG5vZGUncyBsb2NhbCBjb29yZGluYXRlIGZyYW1lLlxyXG4gICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRPcmlnaW5Cb3VuZHMoKTogQm91bmRzMiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRDZWxsQm91bmRzKCkuc2hpZnRlZFhZKCAtdGhpcy5wcm94eS54LCAtdGhpcy5wcm94eS55ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgY3VycmVudCBib3VuZHMgb2YgdGhlIGNlbGwgKHdpdGggbWFyZ2lucyBpbmNsdWRlZClcclxuICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Q2VsbEJvdW5kcygpOiBCb3VuZHMyIHtcclxuICAgIHJldHVybiB0aGlzLnByb3h5LmJvdW5kcy53aXRoT2Zmc2V0cyhcclxuICAgICAgdGhpcy5lZmZlY3RpdmVMZWZ0TWFyZ2luLFxyXG4gICAgICB0aGlzLmVmZmVjdGl2ZVRvcE1hcmdpbixcclxuICAgICAgdGhpcy5lZmZlY3RpdmVSaWdodE1hcmdpbixcclxuICAgICAgdGhpcy5lZmZlY3RpdmVCb3R0b21NYXJnaW5cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIC8vIFVuc2V0IHRoZSBzcGVjaWZpZWQgcHJlZmVycmVkIHNpemVzIHRoYXQgd2VyZSBzZXQgYnkgb3VyIGxheW91dCAod2hlbiB3ZSdyZSByZW1vdmVkKVxyXG4gICAgT3JpZW50YXRpb24uZW51bWVyYXRpb24udmFsdWVzLmZvckVhY2goIG9yaWVudGF0aW9uID0+IHtcclxuICAgICAgaWYgKCB0aGlzLnByZWZlcnJlZFNpemVTZXQuZ2V0KCBvcmllbnRhdGlvbiApICkge1xyXG4gICAgICAgIHRoaXMudW5zZXRQcmVmZXJyZWRTaXplKCBvcmllbnRhdGlvbiApO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgc3VwZXIuZGlzcG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyBjcmVhdGVIZWxwZXJOb2RlPENlbGwgZXh0ZW5kcyBNYXJnaW5MYXlvdXRDZWxsPiggY2VsbHM6IENlbGxbXSwgbGF5b3V0Qm91bmRzOiBCb3VuZHMyLCBjZWxsVG9UZXh0OiAoIGNlbGw6IENlbGwgKSA9PiBzdHJpbmcgKTogTm9kZSB7XHJcbiAgICBjb25zdCBjb250YWluZXIgPSBuZXcgTm9kZSgpO1xyXG4gICAgY29uc3QgbGluZVdpZHRoID0gMC40O1xyXG5cclxuICAgIGNvbnN0IGF2YWlsYWJsZUNlbGxzU2hhcGUgPSBTaGFwZS51bmlvbiggY2VsbHMubWFwKCBjZWxsID0+IFNoYXBlLmJvdW5kcyggY2VsbC5sYXN0QXZhaWxhYmxlQm91bmRzICkgKSApO1xyXG4gICAgY29uc3QgdXNlZENlbGxzU2hhcGUgPSBTaGFwZS51bmlvbiggY2VsbHMubWFwKCBjZWxsID0+IFNoYXBlLmJvdW5kcyggY2VsbC5sYXN0VXNlZEJvdW5kcyApICkgKTtcclxuICAgIGNvbnN0IHVzZWRDb250ZW50U2hhcGUgPSBTaGFwZS51bmlvbiggY2VsbHMubWFwKCBjZWxsID0+IFNoYXBlLmJvdW5kcyggY2VsbC5wcm94eS5ib3VuZHMgKSApICk7XHJcbiAgICBjb25zdCBzcGFjaW5nU2hhcGUgPSBTaGFwZS5ib3VuZHMoIGxheW91dEJvdW5kcyApLnNoYXBlRGlmZmVyZW5jZSggYXZhaWxhYmxlQ2VsbHNTaGFwZSApO1xyXG4gICAgY29uc3QgZW1wdHlTaGFwZSA9IGF2YWlsYWJsZUNlbGxzU2hhcGUuc2hhcGVEaWZmZXJlbmNlKCB1c2VkQ2VsbHNTaGFwZSApO1xyXG4gICAgY29uc3QgbWFyZ2luU2hhcGUgPSB1c2VkQ2VsbHNTaGFwZS5zaGFwZURpZmZlcmVuY2UoIHVzZWRDb250ZW50U2hhcGUgKTtcclxuXHJcbiAgICBjb25zdCBjcmVhdGVMYWJlbGVkVGV4dHVyZSA9ICggbGFiZWw6IHN0cmluZywgZm9yZWdyb3VuZDogVENvbG9yLCBiYWNrZ3JvdW5kOiBUQ29sb3IgKSA9PiB7XHJcbiAgICAgIGNvbnN0IHRleHQgPSBuZXcgVGV4dCggbGFiZWwsIHtcclxuICAgICAgICBmb250OiBuZXcgRm9udCggeyBzaXplOiA2LCBmYW1pbHk6ICdtb25vc3BhY2UnIH0gKSxcclxuICAgICAgICBmaWxsOiBmb3JlZ3JvdW5kXHJcbiAgICAgIH0gKTtcclxuICAgICAgY29uc3QgcmVjdGFuZ2xlID0gUmVjdGFuZ2xlLmJvdW5kcyggdGV4dC5ib3VuZHMsIHtcclxuICAgICAgICBmaWxsOiBiYWNrZ3JvdW5kLFxyXG4gICAgICAgIGNoaWxkcmVuOiBbIHRleHQgXVxyXG4gICAgICB9ICk7XHJcbiAgICAgIHJldHVybiBuZXcgTm9kZVBhdHRlcm4oXHJcbiAgICAgICAgcmVjdGFuZ2xlLFxyXG4gICAgICAgIDQsXHJcbiAgICAgICAgTWF0aC5mbG9vciggcmVjdGFuZ2xlLmxlZnQgKSxcclxuICAgICAgICBNYXRoLmNlaWwoIHJlY3RhbmdsZS50b3AgKyAxICksXHJcbiAgICAgICAgTWF0aC5mbG9vciggcmVjdGFuZ2xlLndpZHRoICksXHJcbiAgICAgICAgTWF0aC5mbG9vciggcmVjdGFuZ2xlLmhlaWdodCAtIDIgKSxcclxuICAgICAgICBNYXRyaXgzLnJvdGF0aW9uMiggLU1hdGguUEkgLyA0IClcclxuICAgICAgKTtcclxuICAgIH07XHJcblxyXG4gICAgY29udGFpbmVyLmFkZENoaWxkKCBuZXcgUGF0aCggc3BhY2luZ1NoYXBlLCB7XHJcbiAgICAgIGZpbGw6IGNyZWF0ZUxhYmVsZWRUZXh0dXJlKCAnc3BhY2luZycsICcjMDAwJywgJyNmZmYnICksXHJcbiAgICAgIG9wYWNpdHk6IDAuNlxyXG4gICAgfSApICk7XHJcbiAgICBjb250YWluZXIuYWRkQ2hpbGQoIG5ldyBQYXRoKCBlbXB0eVNoYXBlLCB7XHJcbiAgICAgIGZpbGw6IGNyZWF0ZUxhYmVsZWRUZXh0dXJlKCAnZW1wdHknLCAnI2FhYScsICcjMDAwJyApLFxyXG4gICAgICBvcGFjaXR5OiAwLjZcclxuICAgIH0gKSApO1xyXG4gICAgY29udGFpbmVyLmFkZENoaWxkKCBuZXcgUGF0aCggbWFyZ2luU2hhcGUsIHtcclxuICAgICAgZmlsbDogY3JlYXRlTGFiZWxlZFRleHR1cmUoICdtYXJnaW4nLCAnIzYwMCcsICcjZjAwJyApLFxyXG4gICAgICBvcGFjaXR5OiAwLjZcclxuICAgIH0gKSApO1xyXG5cclxuICAgIGNvbnRhaW5lci5hZGRDaGlsZCggUmVjdGFuZ2xlLmJvdW5kcyggbGF5b3V0Qm91bmRzLCB7XHJcbiAgICAgIHN0cm9rZTogJ3doaXRlJyxcclxuICAgICAgbGluZURhc2g6IFsgMiwgMiBdLFxyXG4gICAgICBsaW5lRGFzaE9mZnNldDogMixcclxuICAgICAgbGluZVdpZHRoOiBsaW5lV2lkdGhcclxuICAgIH0gKSApO1xyXG4gICAgY29udGFpbmVyLmFkZENoaWxkKCBSZWN0YW5nbGUuYm91bmRzKCBsYXlvdXRCb3VuZHMsIHtcclxuICAgICAgc3Ryb2tlOiAnYmxhY2snLFxyXG4gICAgICBsaW5lRGFzaDogWyAyLCAyIF0sXHJcbiAgICAgIGxpbmVXaWR0aDogbGluZVdpZHRoXHJcbiAgICB9ICkgKTtcclxuXHJcbiAgICBjZWxscy5mb3JFYWNoKCBjZWxsID0+IHtcclxuICAgICAgY29udGFpbmVyLmFkZENoaWxkKCBSZWN0YW5nbGUuYm91bmRzKCBjZWxsLmdldENlbGxCb3VuZHMoKSwge1xyXG4gICAgICAgIHN0cm9rZTogJ3JnYmEoMCwyNTUsMCwxKScsXHJcbiAgICAgICAgbGluZVdpZHRoOiBsaW5lV2lkdGhcclxuICAgICAgfSApICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgY2VsbHMuZm9yRWFjaCggY2VsbCA9PiB7XHJcbiAgICAgIGNvbnRhaW5lci5hZGRDaGlsZCggUmVjdGFuZ2xlLmJvdW5kcyggY2VsbC5wcm94eS5ib3VuZHMsIHtcclxuICAgICAgICBzdHJva2U6ICdyZ2JhKDI1NSwwLDAsMSknLFxyXG4gICAgICAgIGxpbmVXaWR0aDogbGluZVdpZHRoXHJcbiAgICAgIH0gKSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIGNlbGxzLmZvckVhY2goIGNlbGwgPT4ge1xyXG4gICAgICBjb25zdCBib3VuZHMgPSBjZWxsLmdldENlbGxCb3VuZHMoKTtcclxuXHJcbiAgICAgIGNvbnN0IGhvdmVyTGlzdGVuZXIgPSBuZXcgUHJlc3NMaXN0ZW5lcigge1xyXG4gICAgICAgIHRhbmRlbTogVGFuZGVtLk9QVF9PVVRcclxuICAgICAgfSApO1xyXG4gICAgICBjb250YWluZXIuYWRkQ2hpbGQoIFJlY3RhbmdsZS5ib3VuZHMoIGJvdW5kcywge1xyXG4gICAgICAgIGlucHV0TGlzdGVuZXJzOiBbIGhvdmVyTGlzdGVuZXIgXVxyXG4gICAgICB9ICkgKTtcclxuXHJcbiAgICAgIGxldCBzdHIgPSBjZWxsVG9UZXh0KCBjZWxsICk7XHJcblxyXG4gICAgICBpZiAoIGNlbGwuZWZmZWN0aXZlTGVmdE1hcmdpbiApIHtcclxuICAgICAgICBzdHIgKz0gYGxlZnRNYXJnaW46ICR7Y2VsbC5lZmZlY3RpdmVMZWZ0TWFyZ2lufVxcbmA7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBjZWxsLmVmZmVjdGl2ZVJpZ2h0TWFyZ2luICkge1xyXG4gICAgICAgIHN0ciArPSBgcmlnaHRNYXJnaW46ICR7Y2VsbC5lZmZlY3RpdmVSaWdodE1hcmdpbn1cXG5gO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggY2VsbC5lZmZlY3RpdmVUb3BNYXJnaW4gKSB7XHJcbiAgICAgICAgc3RyICs9IGB0b3BNYXJnaW46ICR7Y2VsbC5lZmZlY3RpdmVUb3BNYXJnaW59XFxuYDtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIGNlbGwuZWZmZWN0aXZlQm90dG9tTWFyZ2luICkge1xyXG4gICAgICAgIHN0ciArPSBgYm90dG9tTWFyZ2luOiAke2NlbGwuZWZmZWN0aXZlQm90dG9tTWFyZ2lufVxcbmA7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBjZWxsLmVmZmVjdGl2ZU1pbkNvbnRlbnRXaWR0aCApIHtcclxuICAgICAgICBzdHIgKz0gYG1pbkNvbnRlbnRXaWR0aDogJHtjZWxsLmVmZmVjdGl2ZU1pbkNvbnRlbnRXaWR0aH1cXG5gO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggY2VsbC5lZmZlY3RpdmVNaW5Db250ZW50SGVpZ2h0ICkge1xyXG4gICAgICAgIHN0ciArPSBgbWluQ29udGVudEhlaWdodDogJHtjZWxsLmVmZmVjdGl2ZU1pbkNvbnRlbnRIZWlnaHR9XFxuYDtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIGNlbGwuZWZmZWN0aXZlTWF4Q29udGVudFdpZHRoICkge1xyXG4gICAgICAgIHN0ciArPSBgbWF4Q29udGVudFdpZHRoOiAke2NlbGwuZWZmZWN0aXZlTWF4Q29udGVudFdpZHRofVxcbmA7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBjZWxsLmVmZmVjdGl2ZU1heENvbnRlbnRIZWlnaHQgKSB7XHJcbiAgICAgICAgc3RyICs9IGBtYXhDb250ZW50SGVpZ2h0OiAke2NlbGwuZWZmZWN0aXZlTWF4Q29udGVudEhlaWdodH1cXG5gO1xyXG4gICAgICB9XHJcbiAgICAgIHN0ciArPSBgbGF5b3V0T3B0aW9uczogJHtKU09OLnN0cmluZ2lmeSggY2VsbC5ub2RlLmxheW91dE9wdGlvbnMsIG51bGwsIDIgKS5yZXBsYWNlKCAvIC9nLCAnJm5ic3A7JyApfVxcbmA7XHJcblxyXG4gICAgICBjb25zdCBob3ZlclRleHQgPSBuZXcgUmljaFRleHQoIHN0ci50cmltKCkucmVwbGFjZSggL1xcbi9nLCAnPGJyPicgKSwge1xyXG4gICAgICAgIGZvbnQ6IG5ldyBGb250KCB7IHNpemU6IDEyIH0gKVxyXG4gICAgICB9ICk7XHJcbiAgICAgIGNvbnN0IGhvdmVyTm9kZSA9IFJlY3RhbmdsZS5ib3VuZHMoIGhvdmVyVGV4dC5ib3VuZHMuZGlsYXRlZCggMyApLCB7XHJcbiAgICAgICAgZmlsbDogJ3JnYmEoMjU1LDI1NSwyNTUsMC44KScsXHJcbiAgICAgICAgY2hpbGRyZW46IFsgaG92ZXJUZXh0IF0sXHJcbiAgICAgICAgbGVmdFRvcDogYm91bmRzLmxlZnRUb3BcclxuICAgICAgfSApO1xyXG4gICAgICBjb250YWluZXIuYWRkQ2hpbGQoIGhvdmVyTm9kZSApO1xyXG4gICAgICBob3Zlckxpc3RlbmVyLmlzT3ZlclByb3BlcnR5LmxpbmsoIGlzT3ZlciA9PiB7XHJcbiAgICAgICAgaG92ZXJOb2RlLnZpc2libGUgPSBpc092ZXI7XHJcbiAgICAgIH0gKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICByZXR1cm4gY29udGFpbmVyO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ01hcmdpbkxheW91dENlbGwnLCBNYXJnaW5MYXlvdXRDZWxsICk7Il0sIm1hcHBpbmdz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