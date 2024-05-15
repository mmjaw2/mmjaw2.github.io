// Copyright 2022-2024, University of Colorado Boulder

/**
 * A grid-based layout container.
 *
 * See https://phetsims.github.io/scenery/doc/layout#GridBox for details
 *
 * GridBox-only options:
 *   - rows (see https://phetsims.github.io/scenery/doc/layout#GridBox-rows)
 *   - columns (see https://phetsims.github.io/scenery/doc/layout#GridBox-columns)
 *   - autoRows (see https://phetsims.github.io/scenery/doc/layout#GridBox-autoLines)
 *   - autoColumns (see https://phetsims.github.io/scenery/doc/layout#GridBox-autoLines)
 *   - resize (see https://phetsims.github.io/scenery/doc/layout#GridBox-resize)
 *   - spacing (see https://phetsims.github.io/scenery/doc/layout#GridBox-spacing)
 *   - xSpacing (see https://phetsims.github.io/scenery/doc/layout#GridBox-spacing)
 *   - ySpacing (see https://phetsims.github.io/scenery/doc/layout#GridBox-spacing)
 *   - layoutOrigin (see https://phetsims.github.io/scenery/doc/layout#layoutOrigin)
 *
 * GridBox and layoutOptions options (can be set either in the GridBox itself, or within its child nodes' layoutOptions):
 *   - xAlign (see https://phetsims.github.io/scenery/doc/layout#GridBox-align)
 *   - yAlign (see https://phetsims.github.io/scenery/doc/layout#GridBox-align)
 *   - stretch (see https://phetsims.github.io/scenery/doc/layout#GridBox-stretch)
 *   - xStretch (see https://phetsims.github.io/scenery/doc/layout#GridBox-stretch)
 *   - yStretch (see https://phetsims.github.io/scenery/doc/layout#GridBox-stretch)
 *   - grow (see https://phetsims.github.io/scenery/doc/layout#GridBox-grow)
 *   - xGrow (see https://phetsims.github.io/scenery/doc/layout#GridBox-grow)
 *   - yGrow (see https://phetsims.github.io/scenery/doc/layout#GridBox-grow)
 *   - margin (see https://phetsims.github.io/scenery/doc/layout#GridBox-margins)
 *   - xMargin (see https://phetsims.github.io/scenery/doc/layout#GridBox-margins)
 *   - yMargin (see https://phetsims.github.io/scenery/doc/layout#GridBox-margins)
 *   - leftMargin (see https://phetsims.github.io/scenery/doc/layout#GridBox-margins)
 *   - rightMargin (see https://phetsims.github.io/scenery/doc/layout#GridBox-margins)
 *   - topMargin (see https://phetsims.github.io/scenery/doc/layout#GridBox-margins)
 *   - bottomMargin (see https://phetsims.github.io/scenery/doc/layout#GridBox-margins)
 *   - minContentWidth (see https://phetsims.github.io/scenery/doc/layout#GridBox-minContent)
 *   - minContentHeight (see https://phetsims.github.io/scenery/doc/layout#GridBox-minContent)
 *   - maxContentWidth (see https://phetsims.github.io/scenery/doc/layout#GridBox-maxContent)
 *   - maxContentHeight (see https://phetsims.github.io/scenery/doc/layout#GridBox-maxContent)
 *
 * layoutOptions-only options (can only be set within the child nodes' layoutOptions, NOT available on GridBox):
 *   - x (see https://phetsims.github.io/scenery/doc/layout#GridBox-layoutOptions-location)
 *   - y (see https://phetsims.github.io/scenery/doc/layout#GridBox-layoutOptions-location)
 *   - horizontalSpan (see https://phetsims.github.io/scenery/doc/layout#GridBox-layoutOptions-size)
 *   - verticalSpan (see https://phetsims.github.io/scenery/doc/layout#GridBox-layoutOptions-size)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import assertMutuallyExclusiveOptions from '../../../../phet-core/js/assertMutuallyExclusiveOptions.js';
import optionize from '../../../../phet-core/js/optionize.js';
import Orientation from '../../../../phet-core/js/Orientation.js';
import { GRID_CONSTRAINT_OPTION_KEYS, GridCell, GridConstraint, LAYOUT_NODE_OPTION_KEYS, LayoutAlign, LayoutNode, MarginLayoutCell, Node, REQUIRES_BOUNDS_OPTION_KEYS, scenery, SIZABLE_OPTION_KEYS } from '../../imports.js';

// GridBox-specific options that can be passed in the constructor or mutate() call.
const GRIDBOX_OPTION_KEYS = [...LAYOUT_NODE_OPTION_KEYS, ...GRID_CONSTRAINT_OPTION_KEYS.filter(key => key !== 'excludeInvisible'), 'rows', 'columns', 'autoRows', 'autoColumns'];

// Used for setting/getting rows/columns

export default class GridBox extends LayoutNode {
  _cellMap = new Map();

  // For handling auto-wrapping features
  _autoRows = null;
  _autoColumns = null;

  // So we don't kill performance while setting children with autoRows/autoColumns
  _autoLockCount = 0;

  // Listeners that we'll need to remove

  constructor(providedOptions) {
    const options = optionize()({
      // Allow dynamic layout by default, see https://github.com/phetsims/joist/issues/608
      excludeInvisibleChildrenFromBounds: true,
      resize: true
    }, providedOptions);
    super();
    this._constraint = new GridConstraint(this, {
      preferredWidthProperty: this.localPreferredWidthProperty,
      preferredHeightProperty: this.localPreferredHeightProperty,
      minimumWidthProperty: this.localMinimumWidthProperty,
      minimumHeightProperty: this.localMinimumHeightProperty,
      layoutOriginProperty: this.layoutOriginProperty,
      excludeInvisible: false // Should be handled by the options mutate below
    });
    this.onChildInserted = this.onGridBoxChildInserted.bind(this);
    this.onChildRemoved = this.onGridBoxChildRemoved.bind(this);
    this.onChildVisibilityToggled = this.updateAllAutoLines.bind(this);
    this.childInsertedEmitter.addListener(this.onChildInserted);
    this.childRemovedEmitter.addListener(this.onChildRemoved);
    const nonBoundsOptions = _.omit(options, REQUIRES_BOUNDS_OPTION_KEYS);
    const boundsOptions = _.pick(options, REQUIRES_BOUNDS_OPTION_KEYS);

    // Before we layout, do non-bounds-related changes (in case we have resize:false), and prevent layout for
    // performance gains.
    this._constraint.lock();
    this.mutate(nonBoundsOptions);
    this._constraint.unlock();

    // Update the layout (so that it is done once if we have resize:false)
    this._constraint.updateLayout();

    // After we have our localBounds complete, now we can mutate things that rely on it.
    this.mutate(boundsOptions);
    this.linkLayoutBounds();
  }

  /**
   * Sets the children of the GridBox and adjusts them to be positioned in certain cells. It takes a 2-dimensional array
   * of Node|null (where null is a placeholder that does nothing).
   *
   * For each cell, the first index into the array will be taken as the cell position in the provided orientation. The
   * second index into the array will be taken as the cell position in the OPPOSITE orientation.
   *
   * See GridBox.rows or GridBox.columns for usages and more documentation.
   */
  setLines(orientation, lineArrays) {
    const children = [];
    for (let i = 0; i < lineArrays.length; i++) {
      const lineArray = lineArrays[i];
      for (let j = 0; j < lineArray.length; j++) {
        const item = lineArray[j];
        if (item !== null) {
          children.push(item);
          item.mutateLayoutOptions({
            [orientation.line]: i,
            [orientation.opposite.line]: j
          });
        }
      }
    }
    this.children = children;
  }

  /**
   * Returns the children of the GridBox in a 2-dimensional array of Node|null (where null is a placeholder that does
   * nothing).
   *
   * For each cell, the first index into the array will be taken as the cell position in the provided orientation. The
   * second index into the array will be taken as the cell position in the OPPOSITE orientation.
   *
   * See GridBox.rows or GridBox.columns for usages
   */
  getLines(orientation) {
    const lineArrays = [];
    for (const cell of this._cellMap.values()) {
      const i = cell.position.get(orientation);
      const j = cell.position.get(orientation.opposite);

      // Ensure we have enough lines
      while (lineArrays.length < i + 1) {
        lineArrays.push([]);
      }

      // null-pad lines
      while (lineArrays[i].length < j + 1) {
        lineArrays[i].push(null);
      }

      // Finally the actual node!
      lineArrays[i][j] = cell.node;
    }
    return lineArrays;
  }

  /**
   * Sets the children of the GridBox by specifying a two-dimensional array of Nodes (or null values as spacers).
   * The inner arrays will be the rows of the grid.
   * Mutates layoutOptions of the provided Nodes. See setLines() for more documentation.
   */
  set rows(lineArrays) {
    this.setLines(Orientation.VERTICAL, lineArrays);
  }

  /**
   * Returns a two-dimensional array of the child Nodes (with null as a spacer) where the inner arrays are the rows.
   */
  get rows() {
    return this.getLines(Orientation.VERTICAL);
  }

  /**
   * Sets the children of the GridBox by specifying a two-dimensional array of Nodes (or null values as spacers).
   * The inner arrays will be the columns of the grid.
   * * Mutates layoutOptions of the provided Nodes. See setLines() for more documentation.
   */
  set columns(lineArrays) {
    this.setLines(Orientation.HORIZONTAL, lineArrays);
  }

  /**
   * Returns a two-dimensional array of the child Nodes (with null as a spacer) where the inner arrays are the columns.
   */
  get columns() {
    return this.getLines(Orientation.HORIZONTAL);
  }

  /**
   * Returns the Node at a specific row/column intersection (or null if there are none)
   */
  getNodeAt(row, column) {
    const cell = this.constraint.getCell(row, column);
    return cell ? cell.node : null;
  }

  /**
   * Returns the row index of a child Node (or if it spans multiple rows, the first row)
   */
  getRowOfNode(node) {
    assert && assert(this.children.includes(node));
    return this.constraint.getCellFromNode(node).position.vertical;
  }

  /**
   * Returns the column index of a child Node (or if it spans multiple columns, the first row)
   */
  getColumnOfNode(node) {
    assert && assert(this.children.includes(node));
    return this.constraint.getCellFromNode(node).position.horizontal;
  }

  /**
   * Returns all the Nodes in a given row (by index)
   */
  getNodesInRow(index) {
    return this.constraint.getCells(Orientation.VERTICAL, index).map(cell => cell.node);
  }

  /**
   * Returns all the Nodes in a given column (by index)
   */
  getNodesInColumn(index) {
    return this.constraint.getCells(Orientation.HORIZONTAL, index).map(cell => cell.node);
  }

  /**
   * Adds an array of child Nodes (with null allowed as empty spacers) at the bottom of all existing rows.
   */
  addRow(row) {
    this.rows = [...this.rows, row];
    return this;
  }

  /**
   * Adds an array of child Nodes (with null allowed as empty spacers) at the right of all existing columns.
   */
  addColumn(column) {
    this.columns = [...this.columns, column];
    return this;
  }

  /**
   * Inserts a row of child Nodes at a given row index (see addRow for more information)
   */
  insertRow(index, row) {
    this.rows = [...this.rows.slice(0, index), row, ...this.rows.slice(index)];
    return this;
  }

  /**
   * Inserts a column of child Nodes at a given column index (see addColumn for more information)
   */
  insertColumn(index, column) {
    this.columns = [...this.columns.slice(0, index), column, ...this.columns.slice(index)];
    return this;
  }

  /**
   * Removes all child Nodes in a given row
   */
  removeRow(index) {
    this.rows = [...this.rows.slice(0, index), ...this.rows.slice(index + 1)];
    return this;
  }

  /**
   * Removes all child Nodes in a given column
   */
  removeColumn(index) {
    this.columns = [...this.columns.slice(0, index), ...this.columns.slice(index + 1)];
    return this;
  }
  set autoRows(value) {
    assert && assert(value === null || typeof value === 'number' && isFinite(value) && value >= 1);
    if (this._autoRows !== value) {
      this._autoRows = value;
      this.updateAutoRows();
    }
  }
  get autoRows() {
    return this._autoRows;
  }
  set autoColumns(value) {
    assert && assert(value === null || typeof value === 'number' && isFinite(value) && value >= 1);
    if (this._autoColumns !== value) {
      this._autoColumns = value;
      this.updateAutoColumns();
    }
  }
  get autoColumns() {
    return this._autoColumns;
  }

  // Used for autoRows/autoColumns
  updateAutoLines(orientation, value) {
    if (value !== null && this._autoLockCount === 0) {
      let updatedCount = 0;
      this.constraint.lock();
      this.children.filter(child => {
        return child.bounds.isValid() && (!this._constraint.excludeInvisible || child.visible);
      }).forEach((child, index) => {
        const primary = index % value;
        const secondary = Math.floor(index / value);
        const width = 1;
        const height = 1;

        // We guard to see if we actually have to update anything (so we can avoid triggering an auto-layout)
        if (!child.layoutOptions || child.layoutOptions[orientation.line] !== primary || child.layoutOptions[orientation.opposite.line] !== secondary || child.layoutOptions.horizontalSpan !== width || child.layoutOptions.verticalSpan !== height) {
          updatedCount++;
          child.mutateLayoutOptions({
            [orientation.line]: index % value,
            [orientation.opposite.line]: Math.floor(index / value),
            horizontalSpan: 1,
            verticalSpan: 1
          });
        }
      });
      this.constraint.unlock();

      // Only trigger an automatic layout IF we actually adjusted something.
      if (updatedCount > 0) {
        this.constraint.updateLayoutAutomatically();
      }
    }
  }
  updateAutoRows() {
    this.updateAutoLines(Orientation.VERTICAL, this.autoRows);
  }
  updateAutoColumns() {
    this.updateAutoLines(Orientation.HORIZONTAL, this.autoColumns);
  }

  // Updates rows or columns, whichever is active at the moment (if any)
  updateAllAutoLines() {
    assert && assert(this._autoRows === null || this._autoColumns === null, 'autoRows and autoColumns should not both be set when updating children');
    this.updateAutoRows();
    this.updateAutoColumns();
  }
  setChildren(children) {
    const oldChildren = this.getChildren(); // defensive copy

    // Don't update autoRows/autoColumns settings while setting children, wait until after for performance
    this._autoLockCount++;
    super.setChildren(children);
    this._autoLockCount--;
    if (!_.isEqual(oldChildren, children)) {
      this.updateAllAutoLines();
    }
    return this;
  }

  /**
   * Called when a child is inserted.
   */
  onGridBoxChildInserted(node, index) {
    node.visibleProperty.lazyLink(this.onChildVisibilityToggled);
    const cell = new GridCell(this._constraint, node, this._constraint.createLayoutProxy(node));
    this._cellMap.set(node, cell);
    this._constraint.addCell(cell);
    this.updateAllAutoLines();
  }

  /**
   * Called when a child is removed.
   *
   * NOTE: This is NOT called on disposal. Any additional cleanup (to prevent memory leaks) should be included in the
   * dispose() function
   */
  onGridBoxChildRemoved(node) {
    const cell = this._cellMap.get(node);
    assert && assert(cell);
    this._cellMap.delete(node);
    this._constraint.removeCell(cell);
    cell.dispose();
    this.updateAllAutoLines();
    node.visibleProperty.unlink(this.onChildVisibilityToggled);
  }
  mutate(options) {
    // children can be used with one of autoRows/autoColumns, but otherwise these options are exclusive
    assertMutuallyExclusiveOptions(options, ['rows'], ['columns'], ['children', 'autoRows', 'autoColumns']);
    if (options) {
      assert && assert(typeof options.autoRows !== 'number' || typeof options.autoColumns !== 'number', 'autoRows and autoColumns should not be specified both as non-null at the same time');
    }
    return super.mutate(options);
  }
  get spacing() {
    return this._constraint.spacing;
  }
  set spacing(value) {
    this._constraint.spacing = value;
  }
  get xSpacing() {
    return this._constraint.xSpacing;
  }
  set xSpacing(value) {
    this._constraint.xSpacing = value;
  }
  get ySpacing() {
    return this._constraint.ySpacing;
  }
  set ySpacing(value) {
    this._constraint.ySpacing = value;
  }
  get xAlign() {
    return this._constraint.xAlign;
  }
  set xAlign(value) {
    this._constraint.xAlign = value;
  }
  get yAlign() {
    return this._constraint.yAlign;
  }
  set yAlign(value) {
    this._constraint.yAlign = value;
  }
  get grow() {
    return this._constraint.grow;
  }
  set grow(value) {
    this._constraint.grow = value;
  }
  get xGrow() {
    return this._constraint.xGrow;
  }
  set xGrow(value) {
    this._constraint.xGrow = value;
  }
  get yGrow() {
    return this._constraint.yGrow;
  }
  set yGrow(value) {
    this._constraint.yGrow = value;
  }
  get stretch() {
    return this._constraint.stretch;
  }
  set stretch(value) {
    this._constraint.stretch = value;
  }
  get xStretch() {
    return this._constraint.xStretch;
  }
  set xStretch(value) {
    this._constraint.xStretch = value;
  }
  get yStretch() {
    return this._constraint.yStretch;
  }
  set yStretch(value) {
    this._constraint.yStretch = value;
  }
  get margin() {
    return this._constraint.margin;
  }
  set margin(value) {
    this._constraint.margin = value;
  }
  get xMargin() {
    return this._constraint.xMargin;
  }
  set xMargin(value) {
    this._constraint.xMargin = value;
  }
  get yMargin() {
    return this._constraint.yMargin;
  }
  set yMargin(value) {
    this._constraint.yMargin = value;
  }
  get leftMargin() {
    return this._constraint.leftMargin;
  }
  set leftMargin(value) {
    this._constraint.leftMargin = value;
  }
  get rightMargin() {
    return this._constraint.rightMargin;
  }
  set rightMargin(value) {
    this._constraint.rightMargin = value;
  }
  get topMargin() {
    return this._constraint.topMargin;
  }
  set topMargin(value) {
    this._constraint.topMargin = value;
  }
  get bottomMargin() {
    return this._constraint.bottomMargin;
  }
  set bottomMargin(value) {
    this._constraint.bottomMargin = value;
  }
  get minContentWidth() {
    return this._constraint.minContentWidth;
  }
  set minContentWidth(value) {
    this._constraint.minContentWidth = value;
  }
  get minContentHeight() {
    return this._constraint.minContentHeight;
  }
  set minContentHeight(value) {
    this._constraint.minContentHeight = value;
  }
  get maxContentWidth() {
    return this._constraint.maxContentWidth;
  }
  set maxContentWidth(value) {
    this._constraint.maxContentWidth = value;
  }
  get maxContentHeight() {
    return this._constraint.maxContentHeight;
  }
  set maxContentHeight(value) {
    this._constraint.maxContentHeight = value;
  }
  setExcludeInvisibleChildrenFromBounds(excludeInvisibleChildrenFromBounds) {
    super.setExcludeInvisibleChildrenFromBounds(excludeInvisibleChildrenFromBounds);
    this.updateAllAutoLines();
  }
  dispose() {
    // Lock our layout forever
    this._constraint.lock();
    this.childInsertedEmitter.removeListener(this.onChildInserted);
    this.childRemovedEmitter.removeListener(this.onChildRemoved);

    // Dispose our cells here. We won't be getting the children-removed listeners fired (we removed them above)
    for (const cell of this._cellMap.values()) {
      cell.dispose();
      cell.node.visibleProperty.unlink(this.onChildVisibilityToggled);
    }
    super.dispose();
  }
  getHelperNode() {
    const marginsNode = MarginLayoutCell.createHelperNode(this.constraint.displayedCells, this.constraint.layoutBoundsProperty.value, cell => {
      let str = '';
      str += `row: ${cell.position.vertical}\n`;
      str += `column: ${cell.position.horizontal}\n`;
      if (cell.size.horizontal > 1) {
        str += `horizontalSpan: ${cell.size.horizontal}\n`;
      }
      if (cell.size.vertical > 1) {
        str += `verticalSpan: ${cell.size.vertical}\n`;
      }
      str += `xAlign: ${LayoutAlign.internalToAlign(Orientation.HORIZONTAL, cell.effectiveXAlign)}\n`;
      str += `yAlign: ${LayoutAlign.internalToAlign(Orientation.VERTICAL, cell.effectiveYAlign)}\n`;
      str += `xStretch: ${cell.effectiveXStretch}\n`;
      str += `yStretch: ${cell.effectiveYStretch}\n`;
      str += `xGrow: ${cell.effectiveXGrow}\n`;
      str += `yGrow: ${cell.effectiveYGrow}\n`;
      return str;
    });
    return marginsNode;
  }
}

/**
 * {Array.<string>} - String keys for all of the allowed options that will be set by node.mutate( options ), in the
 * order they will be evaluated in.
 *
 * NOTE: See Node's _mutatorKeys documentation for more information on how this operates, and potential special
 *       cases that may apply.
 */
GridBox.prototype._mutatorKeys = [...SIZABLE_OPTION_KEYS, ...GRIDBOX_OPTION_KEYS, ...Node.prototype._mutatorKeys];
scenery.register('GridBox', GridBox);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3NlcnRNdXR1YWxseUV4Y2x1c2l2ZU9wdGlvbnMiLCJvcHRpb25pemUiLCJPcmllbnRhdGlvbiIsIkdSSURfQ09OU1RSQUlOVF9PUFRJT05fS0VZUyIsIkdyaWRDZWxsIiwiR3JpZENvbnN0cmFpbnQiLCJMQVlPVVRfTk9ERV9PUFRJT05fS0VZUyIsIkxheW91dEFsaWduIiwiTGF5b3V0Tm9kZSIsIk1hcmdpbkxheW91dENlbGwiLCJOb2RlIiwiUkVRVUlSRVNfQk9VTkRTX09QVElPTl9LRVlTIiwic2NlbmVyeSIsIlNJWkFCTEVfT1BUSU9OX0tFWVMiLCJHUklEQk9YX09QVElPTl9LRVlTIiwiZmlsdGVyIiwia2V5IiwiR3JpZEJveCIsIl9jZWxsTWFwIiwiTWFwIiwiX2F1dG9Sb3dzIiwiX2F1dG9Db2x1bW5zIiwiX2F1dG9Mb2NrQ291bnQiLCJjb25zdHJ1Y3RvciIsInByb3ZpZGVkT3B0aW9ucyIsIm9wdGlvbnMiLCJleGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzIiwicmVzaXplIiwiX2NvbnN0cmFpbnQiLCJwcmVmZXJyZWRXaWR0aFByb3BlcnR5IiwibG9jYWxQcmVmZXJyZWRXaWR0aFByb3BlcnR5IiwicHJlZmVycmVkSGVpZ2h0UHJvcGVydHkiLCJsb2NhbFByZWZlcnJlZEhlaWdodFByb3BlcnR5IiwibWluaW11bVdpZHRoUHJvcGVydHkiLCJsb2NhbE1pbmltdW1XaWR0aFByb3BlcnR5IiwibWluaW11bUhlaWdodFByb3BlcnR5IiwibG9jYWxNaW5pbXVtSGVpZ2h0UHJvcGVydHkiLCJsYXlvdXRPcmlnaW5Qcm9wZXJ0eSIsImV4Y2x1ZGVJbnZpc2libGUiLCJvbkNoaWxkSW5zZXJ0ZWQiLCJvbkdyaWRCb3hDaGlsZEluc2VydGVkIiwiYmluZCIsIm9uQ2hpbGRSZW1vdmVkIiwib25HcmlkQm94Q2hpbGRSZW1vdmVkIiwib25DaGlsZFZpc2liaWxpdHlUb2dnbGVkIiwidXBkYXRlQWxsQXV0b0xpbmVzIiwiY2hpbGRJbnNlcnRlZEVtaXR0ZXIiLCJhZGRMaXN0ZW5lciIsImNoaWxkUmVtb3ZlZEVtaXR0ZXIiLCJub25Cb3VuZHNPcHRpb25zIiwiXyIsIm9taXQiLCJib3VuZHNPcHRpb25zIiwicGljayIsImxvY2siLCJtdXRhdGUiLCJ1bmxvY2siLCJ1cGRhdGVMYXlvdXQiLCJsaW5rTGF5b3V0Qm91bmRzIiwic2V0TGluZXMiLCJvcmllbnRhdGlvbiIsImxpbmVBcnJheXMiLCJjaGlsZHJlbiIsImkiLCJsZW5ndGgiLCJsaW5lQXJyYXkiLCJqIiwiaXRlbSIsInB1c2giLCJtdXRhdGVMYXlvdXRPcHRpb25zIiwibGluZSIsIm9wcG9zaXRlIiwiZ2V0TGluZXMiLCJjZWxsIiwidmFsdWVzIiwicG9zaXRpb24iLCJnZXQiLCJub2RlIiwicm93cyIsIlZFUlRJQ0FMIiwiY29sdW1ucyIsIkhPUklaT05UQUwiLCJnZXROb2RlQXQiLCJyb3ciLCJjb2x1bW4iLCJjb25zdHJhaW50IiwiZ2V0Q2VsbCIsImdldFJvd09mTm9kZSIsImFzc2VydCIsImluY2x1ZGVzIiwiZ2V0Q2VsbEZyb21Ob2RlIiwidmVydGljYWwiLCJnZXRDb2x1bW5PZk5vZGUiLCJob3Jpem9udGFsIiwiZ2V0Tm9kZXNJblJvdyIsImluZGV4IiwiZ2V0Q2VsbHMiLCJtYXAiLCJnZXROb2Rlc0luQ29sdW1uIiwiYWRkUm93IiwiYWRkQ29sdW1uIiwiaW5zZXJ0Um93Iiwic2xpY2UiLCJpbnNlcnRDb2x1bW4iLCJyZW1vdmVSb3ciLCJyZW1vdmVDb2x1bW4iLCJhdXRvUm93cyIsInZhbHVlIiwiaXNGaW5pdGUiLCJ1cGRhdGVBdXRvUm93cyIsImF1dG9Db2x1bW5zIiwidXBkYXRlQXV0b0NvbHVtbnMiLCJ1cGRhdGVBdXRvTGluZXMiLCJ1cGRhdGVkQ291bnQiLCJjaGlsZCIsImJvdW5kcyIsImlzVmFsaWQiLCJ2aXNpYmxlIiwiZm9yRWFjaCIsInByaW1hcnkiLCJzZWNvbmRhcnkiLCJNYXRoIiwiZmxvb3IiLCJ3aWR0aCIsImhlaWdodCIsImxheW91dE9wdGlvbnMiLCJob3Jpem9udGFsU3BhbiIsInZlcnRpY2FsU3BhbiIsInVwZGF0ZUxheW91dEF1dG9tYXRpY2FsbHkiLCJzZXRDaGlsZHJlbiIsIm9sZENoaWxkcmVuIiwiZ2V0Q2hpbGRyZW4iLCJpc0VxdWFsIiwidmlzaWJsZVByb3BlcnR5IiwibGF6eUxpbmsiLCJjcmVhdGVMYXlvdXRQcm94eSIsInNldCIsImFkZENlbGwiLCJkZWxldGUiLCJyZW1vdmVDZWxsIiwiZGlzcG9zZSIsInVubGluayIsInNwYWNpbmciLCJ4U3BhY2luZyIsInlTcGFjaW5nIiwieEFsaWduIiwieUFsaWduIiwiZ3JvdyIsInhHcm93IiwieUdyb3ciLCJzdHJldGNoIiwieFN0cmV0Y2giLCJ5U3RyZXRjaCIsIm1hcmdpbiIsInhNYXJnaW4iLCJ5TWFyZ2luIiwibGVmdE1hcmdpbiIsInJpZ2h0TWFyZ2luIiwidG9wTWFyZ2luIiwiYm90dG9tTWFyZ2luIiwibWluQ29udGVudFdpZHRoIiwibWluQ29udGVudEhlaWdodCIsIm1heENvbnRlbnRXaWR0aCIsIm1heENvbnRlbnRIZWlnaHQiLCJzZXRFeGNsdWRlSW52aXNpYmxlQ2hpbGRyZW5Gcm9tQm91bmRzIiwicmVtb3ZlTGlzdGVuZXIiLCJnZXRIZWxwZXJOb2RlIiwibWFyZ2luc05vZGUiLCJjcmVhdGVIZWxwZXJOb2RlIiwiZGlzcGxheWVkQ2VsbHMiLCJsYXlvdXRCb3VuZHNQcm9wZXJ0eSIsInN0ciIsInNpemUiLCJpbnRlcm5hbFRvQWxpZ24iLCJlZmZlY3RpdmVYQWxpZ24iLCJlZmZlY3RpdmVZQWxpZ24iLCJlZmZlY3RpdmVYU3RyZXRjaCIsImVmZmVjdGl2ZVlTdHJldGNoIiwiZWZmZWN0aXZlWEdyb3ciLCJlZmZlY3RpdmVZR3JvdyIsInByb3RvdHlwZSIsIl9tdXRhdG9yS2V5cyIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiR3JpZEJveC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBIGdyaWQtYmFzZWQgbGF5b3V0IGNvbnRhaW5lci5cclxuICpcclxuICogU2VlIGh0dHBzOi8vcGhldHNpbXMuZ2l0aHViLmlvL3NjZW5lcnkvZG9jL2xheW91dCNHcmlkQm94IGZvciBkZXRhaWxzXHJcbiAqXHJcbiAqIEdyaWRCb3gtb25seSBvcHRpb25zOlxyXG4gKiAgIC0gcm93cyAoc2VlIGh0dHBzOi8vcGhldHNpbXMuZ2l0aHViLmlvL3NjZW5lcnkvZG9jL2xheW91dCNHcmlkQm94LXJvd3MpXHJcbiAqICAgLSBjb2x1bW5zIChzZWUgaHR0cHM6Ly9waGV0c2ltcy5naXRodWIuaW8vc2NlbmVyeS9kb2MvbGF5b3V0I0dyaWRCb3gtY29sdW1ucylcclxuICogICAtIGF1dG9Sb3dzIChzZWUgaHR0cHM6Ly9waGV0c2ltcy5naXRodWIuaW8vc2NlbmVyeS9kb2MvbGF5b3V0I0dyaWRCb3gtYXV0b0xpbmVzKVxyXG4gKiAgIC0gYXV0b0NvbHVtbnMgKHNlZSBodHRwczovL3BoZXRzaW1zLmdpdGh1Yi5pby9zY2VuZXJ5L2RvYy9sYXlvdXQjR3JpZEJveC1hdXRvTGluZXMpXHJcbiAqICAgLSByZXNpemUgKHNlZSBodHRwczovL3BoZXRzaW1zLmdpdGh1Yi5pby9zY2VuZXJ5L2RvYy9sYXlvdXQjR3JpZEJveC1yZXNpemUpXHJcbiAqICAgLSBzcGFjaW5nIChzZWUgaHR0cHM6Ly9waGV0c2ltcy5naXRodWIuaW8vc2NlbmVyeS9kb2MvbGF5b3V0I0dyaWRCb3gtc3BhY2luZylcclxuICogICAtIHhTcGFjaW5nIChzZWUgaHR0cHM6Ly9waGV0c2ltcy5naXRodWIuaW8vc2NlbmVyeS9kb2MvbGF5b3V0I0dyaWRCb3gtc3BhY2luZylcclxuICogICAtIHlTcGFjaW5nIChzZWUgaHR0cHM6Ly9waGV0c2ltcy5naXRodWIuaW8vc2NlbmVyeS9kb2MvbGF5b3V0I0dyaWRCb3gtc3BhY2luZylcclxuICogICAtIGxheW91dE9yaWdpbiAoc2VlIGh0dHBzOi8vcGhldHNpbXMuZ2l0aHViLmlvL3NjZW5lcnkvZG9jL2xheW91dCNsYXlvdXRPcmlnaW4pXHJcbiAqXHJcbiAqIEdyaWRCb3ggYW5kIGxheW91dE9wdGlvbnMgb3B0aW9ucyAoY2FuIGJlIHNldCBlaXRoZXIgaW4gdGhlIEdyaWRCb3ggaXRzZWxmLCBvciB3aXRoaW4gaXRzIGNoaWxkIG5vZGVzJyBsYXlvdXRPcHRpb25zKTpcclxuICogICAtIHhBbGlnbiAoc2VlIGh0dHBzOi8vcGhldHNpbXMuZ2l0aHViLmlvL3NjZW5lcnkvZG9jL2xheW91dCNHcmlkQm94LWFsaWduKVxyXG4gKiAgIC0geUFsaWduIChzZWUgaHR0cHM6Ly9waGV0c2ltcy5naXRodWIuaW8vc2NlbmVyeS9kb2MvbGF5b3V0I0dyaWRCb3gtYWxpZ24pXHJcbiAqICAgLSBzdHJldGNoIChzZWUgaHR0cHM6Ly9waGV0c2ltcy5naXRodWIuaW8vc2NlbmVyeS9kb2MvbGF5b3V0I0dyaWRCb3gtc3RyZXRjaClcclxuICogICAtIHhTdHJldGNoIChzZWUgaHR0cHM6Ly9waGV0c2ltcy5naXRodWIuaW8vc2NlbmVyeS9kb2MvbGF5b3V0I0dyaWRCb3gtc3RyZXRjaClcclxuICogICAtIHlTdHJldGNoIChzZWUgaHR0cHM6Ly9waGV0c2ltcy5naXRodWIuaW8vc2NlbmVyeS9kb2MvbGF5b3V0I0dyaWRCb3gtc3RyZXRjaClcclxuICogICAtIGdyb3cgKHNlZSBodHRwczovL3BoZXRzaW1zLmdpdGh1Yi5pby9zY2VuZXJ5L2RvYy9sYXlvdXQjR3JpZEJveC1ncm93KVxyXG4gKiAgIC0geEdyb3cgKHNlZSBodHRwczovL3BoZXRzaW1zLmdpdGh1Yi5pby9zY2VuZXJ5L2RvYy9sYXlvdXQjR3JpZEJveC1ncm93KVxyXG4gKiAgIC0geUdyb3cgKHNlZSBodHRwczovL3BoZXRzaW1zLmdpdGh1Yi5pby9zY2VuZXJ5L2RvYy9sYXlvdXQjR3JpZEJveC1ncm93KVxyXG4gKiAgIC0gbWFyZ2luIChzZWUgaHR0cHM6Ly9waGV0c2ltcy5naXRodWIuaW8vc2NlbmVyeS9kb2MvbGF5b3V0I0dyaWRCb3gtbWFyZ2lucylcclxuICogICAtIHhNYXJnaW4gKHNlZSBodHRwczovL3BoZXRzaW1zLmdpdGh1Yi5pby9zY2VuZXJ5L2RvYy9sYXlvdXQjR3JpZEJveC1tYXJnaW5zKVxyXG4gKiAgIC0geU1hcmdpbiAoc2VlIGh0dHBzOi8vcGhldHNpbXMuZ2l0aHViLmlvL3NjZW5lcnkvZG9jL2xheW91dCNHcmlkQm94LW1hcmdpbnMpXHJcbiAqICAgLSBsZWZ0TWFyZ2luIChzZWUgaHR0cHM6Ly9waGV0c2ltcy5naXRodWIuaW8vc2NlbmVyeS9kb2MvbGF5b3V0I0dyaWRCb3gtbWFyZ2lucylcclxuICogICAtIHJpZ2h0TWFyZ2luIChzZWUgaHR0cHM6Ly9waGV0c2ltcy5naXRodWIuaW8vc2NlbmVyeS9kb2MvbGF5b3V0I0dyaWRCb3gtbWFyZ2lucylcclxuICogICAtIHRvcE1hcmdpbiAoc2VlIGh0dHBzOi8vcGhldHNpbXMuZ2l0aHViLmlvL3NjZW5lcnkvZG9jL2xheW91dCNHcmlkQm94LW1hcmdpbnMpXHJcbiAqICAgLSBib3R0b21NYXJnaW4gKHNlZSBodHRwczovL3BoZXRzaW1zLmdpdGh1Yi5pby9zY2VuZXJ5L2RvYy9sYXlvdXQjR3JpZEJveC1tYXJnaW5zKVxyXG4gKiAgIC0gbWluQ29udGVudFdpZHRoIChzZWUgaHR0cHM6Ly9waGV0c2ltcy5naXRodWIuaW8vc2NlbmVyeS9kb2MvbGF5b3V0I0dyaWRCb3gtbWluQ29udGVudClcclxuICogICAtIG1pbkNvbnRlbnRIZWlnaHQgKHNlZSBodHRwczovL3BoZXRzaW1zLmdpdGh1Yi5pby9zY2VuZXJ5L2RvYy9sYXlvdXQjR3JpZEJveC1taW5Db250ZW50KVxyXG4gKiAgIC0gbWF4Q29udGVudFdpZHRoIChzZWUgaHR0cHM6Ly9waGV0c2ltcy5naXRodWIuaW8vc2NlbmVyeS9kb2MvbGF5b3V0I0dyaWRCb3gtbWF4Q29udGVudClcclxuICogICAtIG1heENvbnRlbnRIZWlnaHQgKHNlZSBodHRwczovL3BoZXRzaW1zLmdpdGh1Yi5pby9zY2VuZXJ5L2RvYy9sYXlvdXQjR3JpZEJveC1tYXhDb250ZW50KVxyXG4gKlxyXG4gKiBsYXlvdXRPcHRpb25zLW9ubHkgb3B0aW9ucyAoY2FuIG9ubHkgYmUgc2V0IHdpdGhpbiB0aGUgY2hpbGQgbm9kZXMnIGxheW91dE9wdGlvbnMsIE5PVCBhdmFpbGFibGUgb24gR3JpZEJveCk6XHJcbiAqICAgLSB4IChzZWUgaHR0cHM6Ly9waGV0c2ltcy5naXRodWIuaW8vc2NlbmVyeS9kb2MvbGF5b3V0I0dyaWRCb3gtbGF5b3V0T3B0aW9ucy1sb2NhdGlvbilcclxuICogICAtIHkgKHNlZSBodHRwczovL3BoZXRzaW1zLmdpdGh1Yi5pby9zY2VuZXJ5L2RvYy9sYXlvdXQjR3JpZEJveC1sYXlvdXRPcHRpb25zLWxvY2F0aW9uKVxyXG4gKiAgIC0gaG9yaXpvbnRhbFNwYW4gKHNlZSBodHRwczovL3BoZXRzaW1zLmdpdGh1Yi5pby9zY2VuZXJ5L2RvYy9sYXlvdXQjR3JpZEJveC1sYXlvdXRPcHRpb25zLXNpemUpXHJcbiAqICAgLSB2ZXJ0aWNhbFNwYW4gKHNlZSBodHRwczovL3BoZXRzaW1zLmdpdGh1Yi5pby9zY2VuZXJ5L2RvYy9sYXlvdXQjR3JpZEJveC1sYXlvdXRPcHRpb25zLXNpemUpXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9hc3NlcnRNdXR1YWxseUV4Y2x1c2l2ZU9wdGlvbnMuanMnO1xyXG5pbXBvcnQgU3RyaWN0T21pdCBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvU3RyaWN0T21pdC5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBPcmllbnRhdGlvbiBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvT3JpZW50YXRpb24uanMnO1xyXG5pbXBvcnQgeyBHUklEX0NPTlNUUkFJTlRfT1BUSU9OX0tFWVMsIEdyaWRDZWxsLCBHcmlkQ29uc3RyYWludCwgR3JpZENvbnN0cmFpbnRPcHRpb25zLCBIb3Jpem9udGFsTGF5b3V0QWxpZ24sIExBWU9VVF9OT0RFX09QVElPTl9LRVlTLCBMYXlvdXRBbGlnbiwgTGF5b3V0Tm9kZSwgTGF5b3V0Tm9kZU9wdGlvbnMsIE1hcmdpbkxheW91dENlbGwsIE5vZGUsIFJFUVVJUkVTX0JPVU5EU19PUFRJT05fS0VZUywgc2NlbmVyeSwgU0laQUJMRV9PUFRJT05fS0VZUywgVmVydGljYWxMYXlvdXRBbGlnbiB9IGZyb20gJy4uLy4uL2ltcG9ydHMuanMnO1xyXG5cclxuLy8gR3JpZEJveC1zcGVjaWZpYyBvcHRpb25zIHRoYXQgY2FuIGJlIHBhc3NlZCBpbiB0aGUgY29uc3RydWN0b3Igb3IgbXV0YXRlKCkgY2FsbC5cclxuY29uc3QgR1JJREJPWF9PUFRJT05fS0VZUyA9IFtcclxuICAuLi5MQVlPVVRfTk9ERV9PUFRJT05fS0VZUyxcclxuICAuLi5HUklEX0NPTlNUUkFJTlRfT1BUSU9OX0tFWVMuZmlsdGVyKCBrZXkgPT4ga2V5ICE9PSAnZXhjbHVkZUludmlzaWJsZScgKSxcclxuICAncm93cycsXHJcbiAgJ2NvbHVtbnMnLFxyXG4gICdhdXRvUm93cycsXHJcbiAgJ2F1dG9Db2x1bW5zJ1xyXG5dO1xyXG5cclxuLy8gVXNlZCBmb3Igc2V0dGluZy9nZXR0aW5nIHJvd3MvY29sdW1uc1xyXG50eXBlIExpbmVBcnJheSA9ICggTm9kZSB8IG51bGwgKVtdO1xyXG50eXBlIExpbmVBcnJheXMgPSBMaW5lQXJyYXlbXTtcclxuXHJcbnR5cGUgR3JpZENvbnN0cmFpbnRFeGNsdWRlZE9wdGlvbnMgPSAnZXhjbHVkZUludmlzaWJsZScgfCAncHJlZmVycmVkV2lkdGhQcm9wZXJ0eScgfCAncHJlZmVycmVkSGVpZ2h0UHJvcGVydHknIHwgJ21pbmltdW1XaWR0aFByb3BlcnR5JyB8ICdtaW5pbXVtSGVpZ2h0UHJvcGVydHknIHwgJ2xheW91dE9yaWdpblByb3BlcnR5JztcclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuICAvLyBDb250cm9scyB3aGV0aGVyIHRoZSBHcmlkQm94IHdpbGwgcmUtdHJpZ2dlciBsYXlvdXQgYXV0b21hdGljYWxseSBhZnRlciB0aGUgXCJmaXJzdFwiIGxheW91dCBkdXJpbmcgY29uc3RydWN0aW9uLlxyXG4gIC8vIFRoZSBHcmlkQm94IHdpbGwgbGF5b3V0IG9uY2UgYWZ0ZXIgcHJvY2Vzc2luZyB0aGUgb3B0aW9ucyBvYmplY3QsIGJ1dCBpZiByZXNpemU6ZmFsc2UsIHRoZW4gYWZ0ZXIgdGhhdCBtYW51YWxcclxuICAvLyBsYXlvdXQgY2FsbHMgd2lsbCBuZWVkIHRvIGJlIGRvbmUgKHdpdGggdXBkYXRlTGF5b3V0KCkpXHJcbiAgcmVzaXplPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gU2V0cyB0aGUgY2hpbGRyZW4gb2YgdGhlIEdyaWRCb3ggYW5kIHBvc2l0aW9ucyB0aGVtIHVzaW5nIGEgMi1kaW1lbnNpb25hbCBhcnJheSBvZiBOb2RlfG51bGwgKG51bGwgaXMgYSBwbGFjZWhvbGRlclxyXG4gIC8vIGFuZCBkb2VzIG5vdGhpbmcpLiBUaGUgZmlyc3QgaW5kZXggaXMgdHJlYXRlZCBhcyBhIHJvdywgYW5kIHRoZSBzZWNvbmQgaXMgdHJlYXRlZCBhcyBhIGNvbHVtbiwgc28gdGhhdDpcclxuICAvL1xyXG4gIC8vICAgcm93c1sgcm93IF1bIGNvbHVtbiBdID0gTm9kZVxyXG4gIC8vICAgcm93c1sgeSBdWyB4IF0gPSBOb2RlXHJcbiAgLy9cclxuICAvLyBUaHVzIHRoZSBmb2xsb3dpbmcgd2lsbCBoYXZlIDIgcm93cyB0aGF0IGhhdmUgMyBjb2x1bW5zIGVhY2g6XHJcbiAgLy8gICByb3dzOiBbIFsgYSwgYiwgYyBdLCBbIGQsIGUsIGYgXSBdXHJcbiAgLy9cclxuICAvLyBOT1RFOiBUaGlzIHdpbGwgbXV0YXRlIHRoZSBsYXlvdXRPcHRpb25zIG9mIHRoZSBOb2RlcyB0aGVtc2VsdmVzLCBhbmQgd2lsbCBhbHNvIHdpcGUgb3V0IGFueSBleGlzdGluZyBjaGlsZHJlbi5cclxuICAvLyBOT1RFOiBEb24ndCB1c2UgdGhpcyBvcHRpb24gd2l0aCBlaXRoZXIgYGNoaWxkcmVuYCBvciBgY29sdW1uc2AgYWxzbyBiZWluZyBzZXRcclxuICByb3dzPzogTGluZUFycmF5cztcclxuXHJcbiAgLy8gU2V0cyB0aGUgY2hpbGRyZW4gb2YgdGhlIEdyaWRCb3ggYW5kIHBvc2l0aW9ucyB0aGVtIHVzaW5nIGEgMi1kaW1lbnNpb25hbCBhcnJheSBvZiBOb2RlfG51bGwgKG51bGwgaXMgYSBwbGFjZWhvbGRlclxyXG4gIC8vIGFuZCBkb2VzIG5vdGhpbmcpLiBUaGUgZmlyc3QgaW5kZXggaXMgdHJlYXRlZCBhcyBhIGNvbHVtbiwgYW5kIHRoZSBzZWNvbmQgaXMgdHJlYXRlZCBhcyBhIHJvdywgc28gdGhhdDpcclxuICAvL1xyXG4gIC8vICAgY29sdW1uc1sgY29sdW1uIF1bIHJvdyBdID0gTm9kZVxyXG4gIC8vICAgY29sdW1uc1sgeCBdWyB5IF0gPSBOb2RlXHJcbiAgLy9cclxuICAvLyBUaHVzIHRoZSBmb2xsb3dpbmcgd2lsbCBoYXZlIDIgY29sdW1ucyB0aGF0IGhhdmUgMyByb3dzIGVhY2g6XHJcbiAgLy8gICBjb2x1bW5zOiBbIFsgYSwgYiwgYyBdLCBbIGQsIGUsIGYgXSBdXHJcbiAgLy9cclxuICAvLyBOT1RFOiBUaGlzIHdpbGwgbXV0YXRlIHRoZSBsYXlvdXRPcHRpb25zIG9mIHRoZSBOb2RlcyB0aGVtc2VsdmVzLCBhbmQgd2lsbCBhbHNvIHdpcGUgb3V0IGFueSBleGlzdGluZyBjaGlsZHJlbi5cclxuICAvLyBOT1RFOiBEb24ndCB1c2UgdGhpcyBvcHRpb24gd2l0aCBlaXRoZXIgYGNoaWxkcmVuYCBvciBgcm93c2AgYWxzbyBiZWluZyBzZXRcclxuICBjb2x1bW5zPzogTGluZUFycmF5cztcclxuXHJcbiAgLy8gV2hlbiBub24tbnVsbCwgdGhlIGNlbGxzIG9mIHRoaXMgZ3JpZCB3aWxsIGJlIHBvc2l0aW9uZWQvc2l6ZWQgdG8gYmUgMXgxIGNlbGxzLCBmaWxsaW5nIHJvd3MgdW50aWwgYSBjb2x1bW4gaGFzXHJcbiAgLy8gYGF1dG9Sb3dzYCBudW1iZXIgb2Ygcm93cywgdGhlbiBpdCB3aWxsIGdvIHRvIHRoZSBuZXh0IGNvbHVtbi4gVGhpcyBzaG91bGQgZ2VuZXJhbGx5IGJlIHVzZWQgd2l0aCBgY2hpbGRyZW5gIG9yXHJcbiAgLy8gYWRkaW5nL3JlbW92aW5nIGNoaWxkcmVuIGluIG5vcm1hbCB3YXlzLlxyXG4gIC8vIE5PVEU6IFRoaXMgc2hvdWxkIGJlIHVzZWQgd2l0aCB0aGUgYGNoaWxkcmVuYCBvcHRpb24gYW5kL29yIGFkZGluZyBjaGlsZHJlbiBtYW51YWxseSAoYWRkQ2hpbGQsIGV0Yy4pXHJcbiAgLy8gTk9URTogVGhpcyBzaG91bGQgTk9UIGJlIHVzZWQgd2l0aCBhdXRvQ29sdW1ucyBvciByb3dzL2NvbHVtbnMsIGFzIHRob3NlIGFsc28gc3BlY2lmeSBjb29yZGluYXRlIGluZm9ybWF0aW9uXHJcbiAgLy8gTk9URTogVGhpcyB3aWxsIG9ubHkgbGF5IG91dCBjaGlsZHJlbiB3aXRoIHZhbGlkIGJvdW5kcywgYW5kIGlmIGV4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMgaXMgdHJ1ZSB0aGVuIGl0XHJcbiAgLy8gd2lsbCBBTFNPIGJlIGNvbnN0cmFpbmVkIHRvIG9ubHkgdmlzaWJsZSBjaGlsZHJlbi4gSXQgd29uJ3QgbGVhdmUgZ2FwcyBmb3IgY2hpbGRyZW4gdGhhdCBkb24ndCBtZWV0IHRoZXNlXHJcbiAgLy8gY29uc3RyYWludHMuXHJcbiAgYXV0b1Jvd3M/OiBudW1iZXIgfCBudWxsO1xyXG5cclxuICAvLyBXaGVuIG5vbi1udWxsLCB0aGUgY2VsbHMgb2YgdGhpcyBncmlkIHdpbGwgYmUgcG9zaXRpb25lZC9zaXplZCB0byBiZSAxeDEgY2VsbHMsIGZpbGxpbmcgY29sdW1ucyB1bnRpbCBhIHJvdyBoYXNcclxuICAvLyBgYXV0b0NvbHVtbnNgIG51bWJlciBvZiBjb2x1bW5zLCB0aGVuIGl0IHdpbGwgZ28gdG8gdGhlIG5leHQgcm93LiBUaGlzIHNob3VsZCBnZW5lcmFsbHkgYmUgdXNlZCB3aXRoIGBjaGlsZHJlbmAgb3JcclxuICAvLyBhZGRpbmcvcmVtb3ZpbmcgY2hpbGRyZW4gaW4gbm9ybWFsIHdheXMuXHJcbiAgLy8gTk9URTogVGhpcyBzaG91bGQgYmUgdXNlZCB3aXRoIHRoZSBgY2hpbGRyZW5gIG9wdGlvbiBhbmQvb3IgYWRkaW5nIGNoaWxkcmVuIG1hbnVhbGx5IChhZGRDaGlsZCwgZXRjLilcclxuICAvLyBOT1RFOiBUaGlzIHNob3VsZCBOT1QgYmUgdXNlZCB3aXRoIGF1dG9Sb3dzIG9yIHJvd3MvY29sdW1ucywgYXMgdGhvc2UgYWxzbyBzcGVjaWZ5IGNvb3JkaW5hdGUgaW5mb3JtYXRpb25cclxuICAvLyBOT1RFOiBUaGlzIHdpbGwgb25seSBsYXkgb3V0IGNoaWxkcmVuIHdpdGggdmFsaWQgYm91bmRzLCBhbmQgaWYgZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcyBpcyB0cnVlIHRoZW4gaXRcclxuICAvLyB3aWxsIEFMU08gYmUgY29uc3RyYWluZWQgdG8gb25seSB2aXNpYmxlIGNoaWxkcmVuLiBJdCB3b24ndCBsZWF2ZSBnYXBzIGZvciBjaGlsZHJlbiB0aGF0IGRvbid0IG1lZXQgdGhlc2VcclxuICAvLyBjb25zdHJhaW50cy5cclxuICBhdXRvQ29sdW1ucz86IG51bWJlciB8IG51bGw7XHJcbn0gJiBTdHJpY3RPbWl0PEdyaWRDb25zdHJhaW50T3B0aW9ucywgR3JpZENvbnN0cmFpbnRFeGNsdWRlZE9wdGlvbnM+O1xyXG5cclxuZXhwb3J0IHR5cGUgR3JpZEJveE9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIExheW91dE5vZGVPcHRpb25zO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3JpZEJveCBleHRlbmRzIExheW91dE5vZGU8R3JpZENvbnN0cmFpbnQ+IHtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBfY2VsbE1hcDogTWFwPE5vZGUsIEdyaWRDZWxsPiA9IG5ldyBNYXA8Tm9kZSwgR3JpZENlbGw+KCk7XHJcblxyXG4gIC8vIEZvciBoYW5kbGluZyBhdXRvLXdyYXBwaW5nIGZlYXR1cmVzXHJcbiAgcHJpdmF0ZSBfYXV0b1Jvd3M6IG51bWJlciB8IG51bGwgPSBudWxsO1xyXG4gIHByaXZhdGUgX2F1dG9Db2x1bW5zOiBudW1iZXIgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgLy8gU28gd2UgZG9uJ3Qga2lsbCBwZXJmb3JtYW5jZSB3aGlsZSBzZXR0aW5nIGNoaWxkcmVuIHdpdGggYXV0b1Jvd3MvYXV0b0NvbHVtbnNcclxuICBwcml2YXRlIF9hdXRvTG9ja0NvdW50ID0gMDtcclxuXHJcbiAgLy8gTGlzdGVuZXJzIHRoYXQgd2UnbGwgbmVlZCB0byByZW1vdmVcclxuICBwcml2YXRlIHJlYWRvbmx5IG9uQ2hpbGRJbnNlcnRlZDogKCBub2RlOiBOb2RlLCBpbmRleDogbnVtYmVyICkgPT4gdm9pZDtcclxuICBwcml2YXRlIHJlYWRvbmx5IG9uQ2hpbGRSZW1vdmVkOiAoIG5vZGU6IE5vZGUgKSA9PiB2b2lkO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgb25DaGlsZFZpc2liaWxpdHlUb2dnbGVkOiAoKSA9PiB2b2lkO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHByb3ZpZGVkT3B0aW9ucz86IEdyaWRCb3hPcHRpb25zICkge1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxHcmlkQm94T3B0aW9ucywgU3RyaWN0T21pdDxTZWxmT3B0aW9ucywgRXhjbHVkZTxrZXlvZiBHcmlkQ29uc3RyYWludE9wdGlvbnMsIEdyaWRDb25zdHJhaW50RXhjbHVkZWRPcHRpb25zPiB8ICdyb3dzJyB8ICdjb2x1bW5zJyB8ICdhdXRvUm93cycgfCAnYXV0b0NvbHVtbnMnPixcclxuICAgICAgTGF5b3V0Tm9kZU9wdGlvbnM+KCkoIHtcclxuICAgICAgLy8gQWxsb3cgZHluYW1pYyBsYXlvdXQgYnkgZGVmYXVsdCwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9qb2lzdC9pc3N1ZXMvNjA4XHJcbiAgICAgIGV4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHM6IHRydWUsXHJcblxyXG4gICAgICByZXNpemU6IHRydWVcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIHN1cGVyKCk7XHJcblxyXG4gICAgdGhpcy5fY29uc3RyYWludCA9IG5ldyBHcmlkQ29uc3RyYWludCggdGhpcywge1xyXG4gICAgICBwcmVmZXJyZWRXaWR0aFByb3BlcnR5OiB0aGlzLmxvY2FsUHJlZmVycmVkV2lkdGhQcm9wZXJ0eSxcclxuICAgICAgcHJlZmVycmVkSGVpZ2h0UHJvcGVydHk6IHRoaXMubG9jYWxQcmVmZXJyZWRIZWlnaHRQcm9wZXJ0eSxcclxuICAgICAgbWluaW11bVdpZHRoUHJvcGVydHk6IHRoaXMubG9jYWxNaW5pbXVtV2lkdGhQcm9wZXJ0eSxcclxuICAgICAgbWluaW11bUhlaWdodFByb3BlcnR5OiB0aGlzLmxvY2FsTWluaW11bUhlaWdodFByb3BlcnR5LFxyXG4gICAgICBsYXlvdXRPcmlnaW5Qcm9wZXJ0eTogdGhpcy5sYXlvdXRPcmlnaW5Qcm9wZXJ0eSxcclxuXHJcbiAgICAgIGV4Y2x1ZGVJbnZpc2libGU6IGZhbHNlIC8vIFNob3VsZCBiZSBoYW5kbGVkIGJ5IHRoZSBvcHRpb25zIG11dGF0ZSBiZWxvd1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMub25DaGlsZEluc2VydGVkID0gdGhpcy5vbkdyaWRCb3hDaGlsZEluc2VydGVkLmJpbmQoIHRoaXMgKTtcclxuICAgIHRoaXMub25DaGlsZFJlbW92ZWQgPSB0aGlzLm9uR3JpZEJveENoaWxkUmVtb3ZlZC5iaW5kKCB0aGlzICk7XHJcbiAgICB0aGlzLm9uQ2hpbGRWaXNpYmlsaXR5VG9nZ2xlZCA9IHRoaXMudXBkYXRlQWxsQXV0b0xpbmVzLmJpbmQoIHRoaXMgKTtcclxuXHJcbiAgICB0aGlzLmNoaWxkSW5zZXJ0ZWRFbWl0dGVyLmFkZExpc3RlbmVyKCB0aGlzLm9uQ2hpbGRJbnNlcnRlZCApO1xyXG4gICAgdGhpcy5jaGlsZFJlbW92ZWRFbWl0dGVyLmFkZExpc3RlbmVyKCB0aGlzLm9uQ2hpbGRSZW1vdmVkICk7XHJcblxyXG4gICAgY29uc3Qgbm9uQm91bmRzT3B0aW9ucyA9IF8ub21pdCggb3B0aW9ucywgUkVRVUlSRVNfQk9VTkRTX09QVElPTl9LRVlTICkgYXMgTGF5b3V0Tm9kZU9wdGlvbnM7XHJcbiAgICBjb25zdCBib3VuZHNPcHRpb25zID0gXy5waWNrKCBvcHRpb25zLCBSRVFVSVJFU19CT1VORFNfT1BUSU9OX0tFWVMgKSBhcyBMYXlvdXROb2RlT3B0aW9ucztcclxuXHJcbiAgICAvLyBCZWZvcmUgd2UgbGF5b3V0LCBkbyBub24tYm91bmRzLXJlbGF0ZWQgY2hhbmdlcyAoaW4gY2FzZSB3ZSBoYXZlIHJlc2l6ZTpmYWxzZSksIGFuZCBwcmV2ZW50IGxheW91dCBmb3JcclxuICAgIC8vIHBlcmZvcm1hbmNlIGdhaW5zLlxyXG4gICAgdGhpcy5fY29uc3RyYWludC5sb2NrKCk7XHJcbiAgICB0aGlzLm11dGF0ZSggbm9uQm91bmRzT3B0aW9ucyApO1xyXG4gICAgdGhpcy5fY29uc3RyYWludC51bmxvY2soKTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIGxheW91dCAoc28gdGhhdCBpdCBpcyBkb25lIG9uY2UgaWYgd2UgaGF2ZSByZXNpemU6ZmFsc2UpXHJcbiAgICB0aGlzLl9jb25zdHJhaW50LnVwZGF0ZUxheW91dCgpO1xyXG5cclxuICAgIC8vIEFmdGVyIHdlIGhhdmUgb3VyIGxvY2FsQm91bmRzIGNvbXBsZXRlLCBub3cgd2UgY2FuIG11dGF0ZSB0aGluZ3MgdGhhdCByZWx5IG9uIGl0LlxyXG4gICAgdGhpcy5tdXRhdGUoIGJvdW5kc09wdGlvbnMgKTtcclxuXHJcbiAgICB0aGlzLmxpbmtMYXlvdXRCb3VuZHMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGNoaWxkcmVuIG9mIHRoZSBHcmlkQm94IGFuZCBhZGp1c3RzIHRoZW0gdG8gYmUgcG9zaXRpb25lZCBpbiBjZXJ0YWluIGNlbGxzLiBJdCB0YWtlcyBhIDItZGltZW5zaW9uYWwgYXJyYXlcclxuICAgKiBvZiBOb2RlfG51bGwgKHdoZXJlIG51bGwgaXMgYSBwbGFjZWhvbGRlciB0aGF0IGRvZXMgbm90aGluZykuXHJcbiAgICpcclxuICAgKiBGb3IgZWFjaCBjZWxsLCB0aGUgZmlyc3QgaW5kZXggaW50byB0aGUgYXJyYXkgd2lsbCBiZSB0YWtlbiBhcyB0aGUgY2VsbCBwb3NpdGlvbiBpbiB0aGUgcHJvdmlkZWQgb3JpZW50YXRpb24uIFRoZVxyXG4gICAqIHNlY29uZCBpbmRleCBpbnRvIHRoZSBhcnJheSB3aWxsIGJlIHRha2VuIGFzIHRoZSBjZWxsIHBvc2l0aW9uIGluIHRoZSBPUFBPU0lURSBvcmllbnRhdGlvbi5cclxuICAgKlxyXG4gICAqIFNlZSBHcmlkQm94LnJvd3Mgb3IgR3JpZEJveC5jb2x1bW5zIGZvciB1c2FnZXMgYW5kIG1vcmUgZG9jdW1lbnRhdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0TGluZXMoIG9yaWVudGF0aW9uOiBPcmllbnRhdGlvbiwgbGluZUFycmF5czogTGluZUFycmF5cyApOiB2b2lkIHtcclxuICAgIGNvbnN0IGNoaWxkcmVuOiBOb2RlW10gPSBbXTtcclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBsaW5lQXJyYXlzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBsaW5lQXJyYXkgPSBsaW5lQXJyYXlzWyBpIF07XHJcbiAgICAgIGZvciAoIGxldCBqID0gMDsgaiA8IGxpbmVBcnJheS5sZW5ndGg7IGorKyApIHtcclxuICAgICAgICBjb25zdCBpdGVtID0gbGluZUFycmF5WyBqIF07XHJcbiAgICAgICAgaWYgKCBpdGVtICE9PSBudWxsICkge1xyXG4gICAgICAgICAgY2hpbGRyZW4ucHVzaCggaXRlbSApO1xyXG4gICAgICAgICAgaXRlbS5tdXRhdGVMYXlvdXRPcHRpb25zKCB7XHJcbiAgICAgICAgICAgIFsgb3JpZW50YXRpb24ubGluZSBdOiBpLFxyXG4gICAgICAgICAgICBbIG9yaWVudGF0aW9uLm9wcG9zaXRlLmxpbmUgXTogalxyXG4gICAgICAgICAgfSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGNoaWxkcmVuIG9mIHRoZSBHcmlkQm94IGluIGEgMi1kaW1lbnNpb25hbCBhcnJheSBvZiBOb2RlfG51bGwgKHdoZXJlIG51bGwgaXMgYSBwbGFjZWhvbGRlciB0aGF0IGRvZXNcclxuICAgKiBub3RoaW5nKS5cclxuICAgKlxyXG4gICAqIEZvciBlYWNoIGNlbGwsIHRoZSBmaXJzdCBpbmRleCBpbnRvIHRoZSBhcnJheSB3aWxsIGJlIHRha2VuIGFzIHRoZSBjZWxsIHBvc2l0aW9uIGluIHRoZSBwcm92aWRlZCBvcmllbnRhdGlvbi4gVGhlXHJcbiAgICogc2Vjb25kIGluZGV4IGludG8gdGhlIGFycmF5IHdpbGwgYmUgdGFrZW4gYXMgdGhlIGNlbGwgcG9zaXRpb24gaW4gdGhlIE9QUE9TSVRFIG9yaWVudGF0aW9uLlxyXG4gICAqXHJcbiAgICogU2VlIEdyaWRCb3gucm93cyBvciBHcmlkQm94LmNvbHVtbnMgZm9yIHVzYWdlc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRMaW5lcyggb3JpZW50YXRpb246IE9yaWVudGF0aW9uICk6IExpbmVBcnJheXMge1xyXG4gICAgY29uc3QgbGluZUFycmF5czogTGluZUFycmF5cyA9IFtdO1xyXG5cclxuICAgIGZvciAoIGNvbnN0IGNlbGwgb2YgdGhpcy5fY2VsbE1hcC52YWx1ZXMoKSApIHtcclxuICAgICAgY29uc3QgaSA9IGNlbGwucG9zaXRpb24uZ2V0KCBvcmllbnRhdGlvbiApO1xyXG4gICAgICBjb25zdCBqID0gY2VsbC5wb3NpdGlvbi5nZXQoIG9yaWVudGF0aW9uLm9wcG9zaXRlICk7XHJcblxyXG4gICAgICAvLyBFbnN1cmUgd2UgaGF2ZSBlbm91Z2ggbGluZXNcclxuICAgICAgd2hpbGUgKCBsaW5lQXJyYXlzLmxlbmd0aCA8IGkgKyAxICkge1xyXG4gICAgICAgIGxpbmVBcnJheXMucHVzaCggW10gKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gbnVsbC1wYWQgbGluZXNcclxuICAgICAgd2hpbGUgKCBsaW5lQXJyYXlzWyBpIF0ubGVuZ3RoIDwgaiArIDEgKSB7XHJcbiAgICAgICAgbGluZUFycmF5c1sgaSBdLnB1c2goIG51bGwgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gRmluYWxseSB0aGUgYWN0dWFsIG5vZGUhXHJcbiAgICAgIGxpbmVBcnJheXNbIGkgXVsgaiBdID0gY2VsbC5ub2RlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBsaW5lQXJyYXlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgY2hpbGRyZW4gb2YgdGhlIEdyaWRCb3ggYnkgc3BlY2lmeWluZyBhIHR3by1kaW1lbnNpb25hbCBhcnJheSBvZiBOb2RlcyAob3IgbnVsbCB2YWx1ZXMgYXMgc3BhY2VycykuXHJcbiAgICogVGhlIGlubmVyIGFycmF5cyB3aWxsIGJlIHRoZSByb3dzIG9mIHRoZSBncmlkLlxyXG4gICAqIE11dGF0ZXMgbGF5b3V0T3B0aW9ucyBvZiB0aGUgcHJvdmlkZWQgTm9kZXMuIFNlZSBzZXRMaW5lcygpIGZvciBtb3JlIGRvY3VtZW50YXRpb24uXHJcbiAgICovXHJcbiAgcHVibGljIHNldCByb3dzKCBsaW5lQXJyYXlzOiBMaW5lQXJyYXlzICkge1xyXG4gICAgdGhpcy5zZXRMaW5lcyggT3JpZW50YXRpb24uVkVSVElDQUwsIGxpbmVBcnJheXMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSB0d28tZGltZW5zaW9uYWwgYXJyYXkgb2YgdGhlIGNoaWxkIE5vZGVzICh3aXRoIG51bGwgYXMgYSBzcGFjZXIpIHdoZXJlIHRoZSBpbm5lciBhcnJheXMgYXJlIHRoZSByb3dzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgcm93cygpOiBMaW5lQXJyYXlzIHtcclxuICAgIHJldHVybiB0aGlzLmdldExpbmVzKCBPcmllbnRhdGlvbi5WRVJUSUNBTCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgY2hpbGRyZW4gb2YgdGhlIEdyaWRCb3ggYnkgc3BlY2lmeWluZyBhIHR3by1kaW1lbnNpb25hbCBhcnJheSBvZiBOb2RlcyAob3IgbnVsbCB2YWx1ZXMgYXMgc3BhY2VycykuXHJcbiAgICogVGhlIGlubmVyIGFycmF5cyB3aWxsIGJlIHRoZSBjb2x1bW5zIG9mIHRoZSBncmlkLlxyXG4gICAqICogTXV0YXRlcyBsYXlvdXRPcHRpb25zIG9mIHRoZSBwcm92aWRlZCBOb2Rlcy4gU2VlIHNldExpbmVzKCkgZm9yIG1vcmUgZG9jdW1lbnRhdGlvbi5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0IGNvbHVtbnMoIGxpbmVBcnJheXM6IExpbmVBcnJheXMgKSB7XHJcbiAgICB0aGlzLnNldExpbmVzKCBPcmllbnRhdGlvbi5IT1JJWk9OVEFMLCBsaW5lQXJyYXlzICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgdHdvLWRpbWVuc2lvbmFsIGFycmF5IG9mIHRoZSBjaGlsZCBOb2RlcyAod2l0aCBudWxsIGFzIGEgc3BhY2VyKSB3aGVyZSB0aGUgaW5uZXIgYXJyYXlzIGFyZSB0aGUgY29sdW1ucy5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0IGNvbHVtbnMoKTogTGluZUFycmF5cyB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRMaW5lcyggT3JpZW50YXRpb24uSE9SSVpPTlRBTCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgTm9kZSBhdCBhIHNwZWNpZmljIHJvdy9jb2x1bW4gaW50ZXJzZWN0aW9uIChvciBudWxsIGlmIHRoZXJlIGFyZSBub25lKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXROb2RlQXQoIHJvdzogbnVtYmVyLCBjb2x1bW46IG51bWJlciApOiBOb2RlIHwgbnVsbCB7XHJcbiAgICBjb25zdCBjZWxsID0gdGhpcy5jb25zdHJhaW50LmdldENlbGwoIHJvdywgY29sdW1uICk7XHJcblxyXG4gICAgcmV0dXJuIGNlbGwgPyBjZWxsLm5vZGUgOiBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgcm93IGluZGV4IG9mIGEgY2hpbGQgTm9kZSAob3IgaWYgaXQgc3BhbnMgbXVsdGlwbGUgcm93cywgdGhlIGZpcnN0IHJvdylcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0Um93T2ZOb2RlKCBub2RlOiBOb2RlICk6IG51bWJlciB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmNoaWxkcmVuLmluY2x1ZGVzKCBub2RlICkgKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5jb25zdHJhaW50LmdldENlbGxGcm9tTm9kZSggbm9kZSApIS5wb3NpdGlvbi52ZXJ0aWNhbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGNvbHVtbiBpbmRleCBvZiBhIGNoaWxkIE5vZGUgKG9yIGlmIGl0IHNwYW5zIG11bHRpcGxlIGNvbHVtbnMsIHRoZSBmaXJzdCByb3cpXHJcbiAgICovXHJcbiAgcHVibGljIGdldENvbHVtbk9mTm9kZSggbm9kZTogTm9kZSApOiBudW1iZXIge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5jaGlsZHJlbi5pbmNsdWRlcyggbm9kZSApICk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuY29uc3RyYWludC5nZXRDZWxsRnJvbU5vZGUoIG5vZGUgKSEucG9zaXRpb24uaG9yaXpvbnRhbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYWxsIHRoZSBOb2RlcyBpbiBhIGdpdmVuIHJvdyAoYnkgaW5kZXgpXHJcbiAgICovXHJcbiAgcHVibGljIGdldE5vZGVzSW5Sb3coIGluZGV4OiBudW1iZXIgKTogTm9kZVtdIHtcclxuICAgIHJldHVybiB0aGlzLmNvbnN0cmFpbnQuZ2V0Q2VsbHMoIE9yaWVudGF0aW9uLlZFUlRJQ0FMLCBpbmRleCApLm1hcCggY2VsbCA9PiBjZWxsLm5vZGUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYWxsIHRoZSBOb2RlcyBpbiBhIGdpdmVuIGNvbHVtbiAoYnkgaW5kZXgpXHJcbiAgICovXHJcbiAgcHVibGljIGdldE5vZGVzSW5Db2x1bW4oIGluZGV4OiBudW1iZXIgKTogTm9kZVtdIHtcclxuICAgIHJldHVybiB0aGlzLmNvbnN0cmFpbnQuZ2V0Q2VsbHMoIE9yaWVudGF0aW9uLkhPUklaT05UQUwsIGluZGV4ICkubWFwKCBjZWxsID0+IGNlbGwubm9kZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhbiBhcnJheSBvZiBjaGlsZCBOb2RlcyAod2l0aCBudWxsIGFsbG93ZWQgYXMgZW1wdHkgc3BhY2VycykgYXQgdGhlIGJvdHRvbSBvZiBhbGwgZXhpc3Rpbmcgcm93cy5cclxuICAgKi9cclxuICBwdWJsaWMgYWRkUm93KCByb3c6IExpbmVBcnJheSApOiB0aGlzIHtcclxuXHJcbiAgICB0aGlzLnJvd3MgPSBbIC4uLnRoaXMucm93cywgcm93IF07XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGFuIGFycmF5IG9mIGNoaWxkIE5vZGVzICh3aXRoIG51bGwgYWxsb3dlZCBhcyBlbXB0eSBzcGFjZXJzKSBhdCB0aGUgcmlnaHQgb2YgYWxsIGV4aXN0aW5nIGNvbHVtbnMuXHJcbiAgICovXHJcbiAgcHVibGljIGFkZENvbHVtbiggY29sdW1uOiBMaW5lQXJyYXkgKTogdGhpcyB7XHJcblxyXG4gICAgdGhpcy5jb2x1bW5zID0gWyAuLi50aGlzLmNvbHVtbnMsIGNvbHVtbiBdO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5zZXJ0cyBhIHJvdyBvZiBjaGlsZCBOb2RlcyBhdCBhIGdpdmVuIHJvdyBpbmRleCAoc2VlIGFkZFJvdyBmb3IgbW9yZSBpbmZvcm1hdGlvbilcclxuICAgKi9cclxuICBwdWJsaWMgaW5zZXJ0Um93KCBpbmRleDogbnVtYmVyLCByb3c6IExpbmVBcnJheSApOiB0aGlzIHtcclxuXHJcbiAgICB0aGlzLnJvd3MgPSBbIC4uLnRoaXMucm93cy5zbGljZSggMCwgaW5kZXggKSwgcm93LCAuLi50aGlzLnJvd3Muc2xpY2UoIGluZGV4ICkgXTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluc2VydHMgYSBjb2x1bW4gb2YgY2hpbGQgTm9kZXMgYXQgYSBnaXZlbiBjb2x1bW4gaW5kZXggKHNlZSBhZGRDb2x1bW4gZm9yIG1vcmUgaW5mb3JtYXRpb24pXHJcbiAgICovXHJcbiAgcHVibGljIGluc2VydENvbHVtbiggaW5kZXg6IG51bWJlciwgY29sdW1uOiBMaW5lQXJyYXkgKTogdGhpcyB7XHJcblxyXG4gICAgdGhpcy5jb2x1bW5zID0gWyAuLi50aGlzLmNvbHVtbnMuc2xpY2UoIDAsIGluZGV4ICksIGNvbHVtbiwgLi4udGhpcy5jb2x1bW5zLnNsaWNlKCBpbmRleCApIF07XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmVzIGFsbCBjaGlsZCBOb2RlcyBpbiBhIGdpdmVuIHJvd1xyXG4gICAqL1xyXG4gIHB1YmxpYyByZW1vdmVSb3coIGluZGV4OiBudW1iZXIgKTogdGhpcyB7XHJcblxyXG4gICAgdGhpcy5yb3dzID0gWyAuLi50aGlzLnJvd3Muc2xpY2UoIDAsIGluZGV4ICksIC4uLnRoaXMucm93cy5zbGljZSggaW5kZXggKyAxICkgXTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgYWxsIGNoaWxkIE5vZGVzIGluIGEgZ2l2ZW4gY29sdW1uXHJcbiAgICovXHJcbiAgcHVibGljIHJlbW92ZUNvbHVtbiggaW5kZXg6IG51bWJlciApOiB0aGlzIHtcclxuXHJcbiAgICB0aGlzLmNvbHVtbnMgPSBbIC4uLnRoaXMuY29sdW1ucy5zbGljZSggMCwgaW5kZXggKSwgLi4udGhpcy5jb2x1bW5zLnNsaWNlKCBpbmRleCArIDEgKSBdO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBhdXRvUm93cyggdmFsdWU6IG51bWJlciB8IG51bGwgKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB2YWx1ZSA9PT0gbnVsbCB8fCAoIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgaXNGaW5pdGUoIHZhbHVlICkgJiYgdmFsdWUgPj0gMSApICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9hdXRvUm93cyAhPT0gdmFsdWUgKSB7XHJcbiAgICAgIHRoaXMuX2F1dG9Sb3dzID0gdmFsdWU7XHJcblxyXG4gICAgICB0aGlzLnVwZGF0ZUF1dG9Sb3dzKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGF1dG9Sb3dzKCk6IG51bWJlciB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuX2F1dG9Sb3dzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBhdXRvQ29sdW1ucyggdmFsdWU6IG51bWJlciB8IG51bGwgKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB2YWx1ZSA9PT0gbnVsbCB8fCAoIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgaXNGaW5pdGUoIHZhbHVlICkgJiYgdmFsdWUgPj0gMSApICk7XHJcblxyXG4gICAgaWYgKCB0aGlzLl9hdXRvQ29sdW1ucyAhPT0gdmFsdWUgKSB7XHJcbiAgICAgIHRoaXMuX2F1dG9Db2x1bW5zID0gdmFsdWU7XHJcblxyXG4gICAgICB0aGlzLnVwZGF0ZUF1dG9Db2x1bW5zKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGF1dG9Db2x1bW5zKCk6IG51bWJlciB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuX2F1dG9Db2x1bW5zO1xyXG4gIH1cclxuXHJcbiAgLy8gVXNlZCBmb3IgYXV0b1Jvd3MvYXV0b0NvbHVtbnNcclxuICBwcml2YXRlIHVwZGF0ZUF1dG9MaW5lcyggb3JpZW50YXRpb246IE9yaWVudGF0aW9uLCB2YWx1ZTogbnVtYmVyIHwgbnVsbCApOiB2b2lkIHtcclxuICAgIGlmICggdmFsdWUgIT09IG51bGwgJiYgdGhpcy5fYXV0b0xvY2tDb3VudCA9PT0gMCApIHtcclxuICAgICAgbGV0IHVwZGF0ZWRDb3VudCA9IDA7XHJcblxyXG4gICAgICB0aGlzLmNvbnN0cmFpbnQubG9jaygpO1xyXG5cclxuICAgICAgdGhpcy5jaGlsZHJlbi5maWx0ZXIoIGNoaWxkID0+IHtcclxuICAgICAgICByZXR1cm4gY2hpbGQuYm91bmRzLmlzVmFsaWQoKSAmJiAoICF0aGlzLl9jb25zdHJhaW50LmV4Y2x1ZGVJbnZpc2libGUgfHwgY2hpbGQudmlzaWJsZSApO1xyXG4gICAgICB9ICkuZm9yRWFjaCggKCBjaGlsZCwgaW5kZXggKSA9PiB7XHJcbiAgICAgICAgY29uc3QgcHJpbWFyeSA9IGluZGV4ICUgdmFsdWU7XHJcbiAgICAgICAgY29uc3Qgc2Vjb25kYXJ5ID0gTWF0aC5mbG9vciggaW5kZXggLyB2YWx1ZSApO1xyXG4gICAgICAgIGNvbnN0IHdpZHRoID0gMTtcclxuICAgICAgICBjb25zdCBoZWlnaHQgPSAxO1xyXG5cclxuICAgICAgICAvLyBXZSBndWFyZCB0byBzZWUgaWYgd2UgYWN0dWFsbHkgaGF2ZSB0byB1cGRhdGUgYW55dGhpbmcgKHNvIHdlIGNhbiBhdm9pZCB0cmlnZ2VyaW5nIGFuIGF1dG8tbGF5b3V0KVxyXG4gICAgICAgIGlmICggIWNoaWxkLmxheW91dE9wdGlvbnMgfHxcclxuICAgICAgICAgICAgIGNoaWxkLmxheW91dE9wdGlvbnNbIG9yaWVudGF0aW9uLmxpbmUgXSAhPT0gcHJpbWFyeSB8fFxyXG4gICAgICAgICAgICAgY2hpbGQubGF5b3V0T3B0aW9uc1sgb3JpZW50YXRpb24ub3Bwb3NpdGUubGluZSBdICE9PSBzZWNvbmRhcnkgfHxcclxuICAgICAgICAgICAgIGNoaWxkLmxheW91dE9wdGlvbnMuaG9yaXpvbnRhbFNwYW4gIT09IHdpZHRoIHx8XHJcbiAgICAgICAgICAgICBjaGlsZC5sYXlvdXRPcHRpb25zLnZlcnRpY2FsU3BhbiAhPT0gaGVpZ2h0XHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICB1cGRhdGVkQ291bnQrKztcclxuICAgICAgICAgIGNoaWxkLm11dGF0ZUxheW91dE9wdGlvbnMoIHtcclxuICAgICAgICAgICAgWyBvcmllbnRhdGlvbi5saW5lIF06IGluZGV4ICUgdmFsdWUsXHJcbiAgICAgICAgICAgIFsgb3JpZW50YXRpb24ub3Bwb3NpdGUubGluZSBdOiBNYXRoLmZsb29yKCBpbmRleCAvIHZhbHVlICksXHJcbiAgICAgICAgICAgIGhvcml6b250YWxTcGFuOiAxLFxyXG4gICAgICAgICAgICB2ZXJ0aWNhbFNwYW46IDFcclxuICAgICAgICAgIH0gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICB0aGlzLmNvbnN0cmFpbnQudW5sb2NrKCk7XHJcblxyXG4gICAgICAvLyBPbmx5IHRyaWdnZXIgYW4gYXV0b21hdGljIGxheW91dCBJRiB3ZSBhY3R1YWxseSBhZGp1c3RlZCBzb21ldGhpbmcuXHJcbiAgICAgIGlmICggdXBkYXRlZENvdW50ID4gMCApIHtcclxuICAgICAgICB0aGlzLmNvbnN0cmFpbnQudXBkYXRlTGF5b3V0QXV0b21hdGljYWxseSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHVwZGF0ZUF1dG9Sb3dzKCk6IHZvaWQge1xyXG4gICAgdGhpcy51cGRhdGVBdXRvTGluZXMoIE9yaWVudGF0aW9uLlZFUlRJQ0FMLCB0aGlzLmF1dG9Sb3dzICk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHVwZGF0ZUF1dG9Db2x1bW5zKCk6IHZvaWQge1xyXG4gICAgdGhpcy51cGRhdGVBdXRvTGluZXMoIE9yaWVudGF0aW9uLkhPUklaT05UQUwsIHRoaXMuYXV0b0NvbHVtbnMgKTtcclxuICB9XHJcblxyXG4gIC8vIFVwZGF0ZXMgcm93cyBvciBjb2x1bW5zLCB3aGljaGV2ZXIgaXMgYWN0aXZlIGF0IHRoZSBtb21lbnQgKGlmIGFueSlcclxuICBwcml2YXRlIHVwZGF0ZUFsbEF1dG9MaW5lcygpOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX2F1dG9Sb3dzID09PSBudWxsIHx8IHRoaXMuX2F1dG9Db2x1bW5zID09PSBudWxsLFxyXG4gICAgICAnYXV0b1Jvd3MgYW5kIGF1dG9Db2x1bW5zIHNob3VsZCBub3QgYm90aCBiZSBzZXQgd2hlbiB1cGRhdGluZyBjaGlsZHJlbicgKTtcclxuXHJcbiAgICB0aGlzLnVwZGF0ZUF1dG9Sb3dzKCk7XHJcbiAgICB0aGlzLnVwZGF0ZUF1dG9Db2x1bW5zKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgc2V0Q2hpbGRyZW4oIGNoaWxkcmVuOiBOb2RlW10gKTogdGhpcyB7XHJcblxyXG4gICAgY29uc3Qgb2xkQ2hpbGRyZW4gPSB0aGlzLmdldENoaWxkcmVuKCk7IC8vIGRlZmVuc2l2ZSBjb3B5XHJcblxyXG4gICAgLy8gRG9uJ3QgdXBkYXRlIGF1dG9Sb3dzL2F1dG9Db2x1bW5zIHNldHRpbmdzIHdoaWxlIHNldHRpbmcgY2hpbGRyZW4sIHdhaXQgdW50aWwgYWZ0ZXIgZm9yIHBlcmZvcm1hbmNlXHJcbiAgICB0aGlzLl9hdXRvTG9ja0NvdW50Kys7XHJcbiAgICBzdXBlci5zZXRDaGlsZHJlbiggY2hpbGRyZW4gKTtcclxuICAgIHRoaXMuX2F1dG9Mb2NrQ291bnQtLTtcclxuXHJcbiAgICBpZiAoICFfLmlzRXF1YWwoIG9sZENoaWxkcmVuLCBjaGlsZHJlbiApICkge1xyXG4gICAgICB0aGlzLnVwZGF0ZUFsbEF1dG9MaW5lcygpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbGVkIHdoZW4gYSBjaGlsZCBpcyBpbnNlcnRlZC5cclxuICAgKi9cclxuICBwcml2YXRlIG9uR3JpZEJveENoaWxkSW5zZXJ0ZWQoIG5vZGU6IE5vZGUsIGluZGV4OiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICBub2RlLnZpc2libGVQcm9wZXJ0eS5sYXp5TGluayggdGhpcy5vbkNoaWxkVmlzaWJpbGl0eVRvZ2dsZWQgKTtcclxuXHJcbiAgICBjb25zdCBjZWxsID0gbmV3IEdyaWRDZWxsKCB0aGlzLl9jb25zdHJhaW50LCBub2RlLCB0aGlzLl9jb25zdHJhaW50LmNyZWF0ZUxheW91dFByb3h5KCBub2RlICkgKTtcclxuICAgIHRoaXMuX2NlbGxNYXAuc2V0KCBub2RlLCBjZWxsICk7XHJcblxyXG4gICAgdGhpcy5fY29uc3RyYWludC5hZGRDZWxsKCBjZWxsICk7XHJcblxyXG4gICAgdGhpcy51cGRhdGVBbGxBdXRvTGluZXMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCB3aGVuIGEgY2hpbGQgaXMgcmVtb3ZlZC5cclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgaXMgTk9UIGNhbGxlZCBvbiBkaXNwb3NhbC4gQW55IGFkZGl0aW9uYWwgY2xlYW51cCAodG8gcHJldmVudCBtZW1vcnkgbGVha3MpIHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGVcclxuICAgKiBkaXNwb3NlKCkgZnVuY3Rpb25cclxuICAgKi9cclxuICBwcml2YXRlIG9uR3JpZEJveENoaWxkUmVtb3ZlZCggbm9kZTogTm9kZSApOiB2b2lkIHtcclxuXHJcbiAgICBjb25zdCBjZWxsID0gdGhpcy5fY2VsbE1hcC5nZXQoIG5vZGUgKSE7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBjZWxsICk7XHJcblxyXG4gICAgdGhpcy5fY2VsbE1hcC5kZWxldGUoIG5vZGUgKTtcclxuXHJcbiAgICB0aGlzLl9jb25zdHJhaW50LnJlbW92ZUNlbGwoIGNlbGwgKTtcclxuXHJcbiAgICBjZWxsLmRpc3Bvc2UoKTtcclxuXHJcbiAgICB0aGlzLnVwZGF0ZUFsbEF1dG9MaW5lcygpO1xyXG5cclxuICAgIG5vZGUudmlzaWJsZVByb3BlcnR5LnVubGluayggdGhpcy5vbkNoaWxkVmlzaWJpbGl0eVRvZ2dsZWQgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSBtdXRhdGUoIG9wdGlvbnM/OiBHcmlkQm94T3B0aW9ucyApOiB0aGlzIHtcclxuICAgIC8vIGNoaWxkcmVuIGNhbiBiZSB1c2VkIHdpdGggb25lIG9mIGF1dG9Sb3dzL2F1dG9Db2x1bW5zLCBidXQgb3RoZXJ3aXNlIHRoZXNlIG9wdGlvbnMgYXJlIGV4Y2x1c2l2ZVxyXG4gICAgYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zKCBvcHRpb25zLCBbICdyb3dzJyBdLCBbICdjb2x1bW5zJyBdLCBbICdjaGlsZHJlbicsICdhdXRvUm93cycsICdhdXRvQ29sdW1ucycgXSApO1xyXG4gICAgaWYgKCBvcHRpb25zICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2Ygb3B0aW9ucy5hdXRvUm93cyAhPT0gJ251bWJlcicgfHwgdHlwZW9mIG9wdGlvbnMuYXV0b0NvbHVtbnMgIT09ICdudW1iZXInLFxyXG4gICAgICAgICdhdXRvUm93cyBhbmQgYXV0b0NvbHVtbnMgc2hvdWxkIG5vdCBiZSBzcGVjaWZpZWQgYm90aCBhcyBub24tbnVsbCBhdCB0aGUgc2FtZSB0aW1lJyApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBzdXBlci5tdXRhdGUoIG9wdGlvbnMgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgc3BhY2luZygpOiBudW1iZXIgfCBudW1iZXJbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5fY29uc3RyYWludC5zcGFjaW5nO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBzcGFjaW5nKCB2YWx1ZTogbnVtYmVyIHwgbnVtYmVyW10gKSB7XHJcbiAgICB0aGlzLl9jb25zdHJhaW50LnNwYWNpbmcgPSB2YWx1ZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgeFNwYWNpbmcoKTogbnVtYmVyIHwgbnVtYmVyW10ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2NvbnN0cmFpbnQueFNwYWNpbmc7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHhTcGFjaW5nKCB2YWx1ZTogbnVtYmVyIHwgbnVtYmVyW10gKSB7XHJcbiAgICB0aGlzLl9jb25zdHJhaW50LnhTcGFjaW5nID0gdmFsdWU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHlTcGFjaW5nKCk6IG51bWJlciB8IG51bWJlcltdIHtcclxuICAgIHJldHVybiB0aGlzLl9jb25zdHJhaW50LnlTcGFjaW5nO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCB5U3BhY2luZyggdmFsdWU6IG51bWJlciB8IG51bWJlcltdICkge1xyXG4gICAgdGhpcy5fY29uc3RyYWludC55U3BhY2luZyA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCB4QWxpZ24oKTogSG9yaXpvbnRhbExheW91dEFsaWduIHtcclxuICAgIHJldHVybiB0aGlzLl9jb25zdHJhaW50LnhBbGlnbiE7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHhBbGlnbiggdmFsdWU6IEhvcml6b250YWxMYXlvdXRBbGlnbiApIHtcclxuICAgIHRoaXMuX2NvbnN0cmFpbnQueEFsaWduID0gdmFsdWU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHlBbGlnbigpOiBWZXJ0aWNhbExheW91dEFsaWduIHtcclxuICAgIHJldHVybiB0aGlzLl9jb25zdHJhaW50LnlBbGlnbiE7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHlBbGlnbiggdmFsdWU6IFZlcnRpY2FsTGF5b3V0QWxpZ24gKSB7XHJcbiAgICB0aGlzLl9jb25zdHJhaW50LnlBbGlnbiA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBncm93KCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fY29uc3RyYWludC5ncm93ITtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgZ3JvdyggdmFsdWU6IG51bWJlciApIHtcclxuICAgIHRoaXMuX2NvbnN0cmFpbnQuZ3JvdyA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCB4R3JvdygpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX2NvbnN0cmFpbnQueEdyb3chO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCB4R3JvdyggdmFsdWU6IG51bWJlciApIHtcclxuICAgIHRoaXMuX2NvbnN0cmFpbnQueEdyb3cgPSB2YWx1ZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgeUdyb3coKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9jb25zdHJhaW50LnlHcm93ITtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgeUdyb3coIHZhbHVlOiBudW1iZXIgKSB7XHJcbiAgICB0aGlzLl9jb25zdHJhaW50LnlHcm93ID0gdmFsdWU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHN0cmV0Y2goKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5fY29uc3RyYWludC5zdHJldGNoITtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgc3RyZXRjaCggdmFsdWU6IGJvb2xlYW4gKSB7XHJcbiAgICB0aGlzLl9jb25zdHJhaW50LnN0cmV0Y2ggPSB2YWx1ZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgeFN0cmV0Y2goKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5fY29uc3RyYWludC54U3RyZXRjaCE7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHhTdHJldGNoKCB2YWx1ZTogYm9vbGVhbiApIHtcclxuICAgIHRoaXMuX2NvbnN0cmFpbnQueFN0cmV0Y2ggPSB2YWx1ZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgeVN0cmV0Y2goKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5fY29uc3RyYWludC55U3RyZXRjaCE7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHlTdHJldGNoKCB2YWx1ZTogYm9vbGVhbiApIHtcclxuICAgIHRoaXMuX2NvbnN0cmFpbnQueVN0cmV0Y2ggPSB2YWx1ZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgbWFyZ2luKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fY29uc3RyYWludC5tYXJnaW4hO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBtYXJnaW4oIHZhbHVlOiBudW1iZXIgKSB7XHJcbiAgICB0aGlzLl9jb25zdHJhaW50Lm1hcmdpbiA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCB4TWFyZ2luKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fY29uc3RyYWludC54TWFyZ2luITtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgeE1hcmdpbiggdmFsdWU6IG51bWJlciApIHtcclxuICAgIHRoaXMuX2NvbnN0cmFpbnQueE1hcmdpbiA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCB5TWFyZ2luKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fY29uc3RyYWludC55TWFyZ2luITtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgeU1hcmdpbiggdmFsdWU6IG51bWJlciApIHtcclxuICAgIHRoaXMuX2NvbnN0cmFpbnQueU1hcmdpbiA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBsZWZ0TWFyZ2luKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fY29uc3RyYWludC5sZWZ0TWFyZ2luITtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgbGVmdE1hcmdpbiggdmFsdWU6IG51bWJlciApIHtcclxuICAgIHRoaXMuX2NvbnN0cmFpbnQubGVmdE1hcmdpbiA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCByaWdodE1hcmdpbigpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX2NvbnN0cmFpbnQucmlnaHRNYXJnaW4hO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCByaWdodE1hcmdpbiggdmFsdWU6IG51bWJlciApIHtcclxuICAgIHRoaXMuX2NvbnN0cmFpbnQucmlnaHRNYXJnaW4gPSB2YWx1ZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgdG9wTWFyZ2luKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fY29uc3RyYWludC50b3BNYXJnaW4hO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCB0b3BNYXJnaW4oIHZhbHVlOiBudW1iZXIgKSB7XHJcbiAgICB0aGlzLl9jb25zdHJhaW50LnRvcE1hcmdpbiA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBib3R0b21NYXJnaW4oKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9jb25zdHJhaW50LmJvdHRvbU1hcmdpbiE7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IGJvdHRvbU1hcmdpbiggdmFsdWU6IG51bWJlciApIHtcclxuICAgIHRoaXMuX2NvbnN0cmFpbnQuYm90dG9tTWFyZ2luID0gdmFsdWU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IG1pbkNvbnRlbnRXaWR0aCgpOiBudW1iZXIgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLl9jb25zdHJhaW50Lm1pbkNvbnRlbnRXaWR0aDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgbWluQ29udGVudFdpZHRoKCB2YWx1ZTogbnVtYmVyIHwgbnVsbCApIHtcclxuICAgIHRoaXMuX2NvbnN0cmFpbnQubWluQ29udGVudFdpZHRoID0gdmFsdWU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IG1pbkNvbnRlbnRIZWlnaHQoKTogbnVtYmVyIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5fY29uc3RyYWludC5taW5Db250ZW50SGVpZ2h0O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBtaW5Db250ZW50SGVpZ2h0KCB2YWx1ZTogbnVtYmVyIHwgbnVsbCApIHtcclxuICAgIHRoaXMuX2NvbnN0cmFpbnQubWluQ29udGVudEhlaWdodCA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBtYXhDb250ZW50V2lkdGgoKTogbnVtYmVyIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5fY29uc3RyYWludC5tYXhDb250ZW50V2lkdGg7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IG1heENvbnRlbnRXaWR0aCggdmFsdWU6IG51bWJlciB8IG51bGwgKSB7XHJcbiAgICB0aGlzLl9jb25zdHJhaW50Lm1heENvbnRlbnRXaWR0aCA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCBtYXhDb250ZW50SGVpZ2h0KCk6IG51bWJlciB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuX2NvbnN0cmFpbnQubWF4Q29udGVudEhlaWdodDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgbWF4Q29udGVudEhlaWdodCggdmFsdWU6IG51bWJlciB8IG51bGwgKSB7XHJcbiAgICB0aGlzLl9jb25zdHJhaW50Lm1heENvbnRlbnRIZWlnaHQgPSB2YWx1ZTtcclxuICB9XHJcblxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgc2V0RXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kcyggZXhjbHVkZUludmlzaWJsZUNoaWxkcmVuRnJvbUJvdW5kczogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIHN1cGVyLnNldEV4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMoIGV4Y2x1ZGVJbnZpc2libGVDaGlsZHJlbkZyb21Cb3VuZHMgKTtcclxuXHJcbiAgICB0aGlzLnVwZGF0ZUFsbEF1dG9MaW5lcygpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcblxyXG4gICAgLy8gTG9jayBvdXIgbGF5b3V0IGZvcmV2ZXJcclxuICAgIHRoaXMuX2NvbnN0cmFpbnQubG9jaygpO1xyXG5cclxuICAgIHRoaXMuY2hpbGRJbnNlcnRlZEVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoIHRoaXMub25DaGlsZEluc2VydGVkICk7XHJcbiAgICB0aGlzLmNoaWxkUmVtb3ZlZEVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoIHRoaXMub25DaGlsZFJlbW92ZWQgKTtcclxuXHJcbiAgICAvLyBEaXNwb3NlIG91ciBjZWxscyBoZXJlLiBXZSB3b24ndCBiZSBnZXR0aW5nIHRoZSBjaGlsZHJlbi1yZW1vdmVkIGxpc3RlbmVycyBmaXJlZCAod2UgcmVtb3ZlZCB0aGVtIGFib3ZlKVxyXG4gICAgZm9yICggY29uc3QgY2VsbCBvZiB0aGlzLl9jZWxsTWFwLnZhbHVlcygpICkge1xyXG4gICAgICBjZWxsLmRpc3Bvc2UoKTtcclxuXHJcbiAgICAgIGNlbGwubm9kZS52aXNpYmxlUHJvcGVydHkudW5saW5rKCB0aGlzLm9uQ2hpbGRWaXNpYmlsaXR5VG9nZ2xlZCApO1xyXG4gICAgfVxyXG5cclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXRIZWxwZXJOb2RlKCk6IE5vZGUge1xyXG4gICAgY29uc3QgbWFyZ2luc05vZGUgPSBNYXJnaW5MYXlvdXRDZWxsLmNyZWF0ZUhlbHBlck5vZGUoIHRoaXMuY29uc3RyYWludC5kaXNwbGF5ZWRDZWxscywgdGhpcy5jb25zdHJhaW50LmxheW91dEJvdW5kc1Byb3BlcnR5LnZhbHVlLCBjZWxsID0+IHtcclxuICAgICAgbGV0IHN0ciA9ICcnO1xyXG5cclxuICAgICAgc3RyICs9IGByb3c6ICR7Y2VsbC5wb3NpdGlvbi52ZXJ0aWNhbH1cXG5gO1xyXG4gICAgICBzdHIgKz0gYGNvbHVtbjogJHtjZWxsLnBvc2l0aW9uLmhvcml6b250YWx9XFxuYDtcclxuICAgICAgaWYgKCBjZWxsLnNpemUuaG9yaXpvbnRhbCA+IDEgKSB7XHJcbiAgICAgICAgc3RyICs9IGBob3Jpem9udGFsU3BhbjogJHtjZWxsLnNpemUuaG9yaXpvbnRhbH1cXG5gO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggY2VsbC5zaXplLnZlcnRpY2FsID4gMSApIHtcclxuICAgICAgICBzdHIgKz0gYHZlcnRpY2FsU3BhbjogJHtjZWxsLnNpemUudmVydGljYWx9XFxuYDtcclxuICAgICAgfVxyXG4gICAgICBzdHIgKz0gYHhBbGlnbjogJHtMYXlvdXRBbGlnbi5pbnRlcm5hbFRvQWxpZ24oIE9yaWVudGF0aW9uLkhPUklaT05UQUwsIGNlbGwuZWZmZWN0aXZlWEFsaWduICl9XFxuYDtcclxuICAgICAgc3RyICs9IGB5QWxpZ246ICR7TGF5b3V0QWxpZ24uaW50ZXJuYWxUb0FsaWduKCBPcmllbnRhdGlvbi5WRVJUSUNBTCwgY2VsbC5lZmZlY3RpdmVZQWxpZ24gKX1cXG5gO1xyXG4gICAgICBzdHIgKz0gYHhTdHJldGNoOiAke2NlbGwuZWZmZWN0aXZlWFN0cmV0Y2h9XFxuYDtcclxuICAgICAgc3RyICs9IGB5U3RyZXRjaDogJHtjZWxsLmVmZmVjdGl2ZVlTdHJldGNofVxcbmA7XHJcbiAgICAgIHN0ciArPSBgeEdyb3c6ICR7Y2VsbC5lZmZlY3RpdmVYR3Jvd31cXG5gO1xyXG4gICAgICBzdHIgKz0gYHlHcm93OiAke2NlbGwuZWZmZWN0aXZlWUdyb3d9XFxuYDtcclxuXHJcbiAgICAgIHJldHVybiBzdHI7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgcmV0dXJuIG1hcmdpbnNOb2RlO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIHtBcnJheS48c3RyaW5nPn0gLSBTdHJpbmcga2V5cyBmb3IgYWxsIG9mIHRoZSBhbGxvd2VkIG9wdGlvbnMgdGhhdCB3aWxsIGJlIHNldCBieSBub2RlLm11dGF0ZSggb3B0aW9ucyApLCBpbiB0aGVcclxuICogb3JkZXIgdGhleSB3aWxsIGJlIGV2YWx1YXRlZCBpbi5cclxuICpcclxuICogTk9URTogU2VlIE5vZGUncyBfbXV0YXRvcktleXMgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiBob3cgdGhpcyBvcGVyYXRlcywgYW5kIHBvdGVudGlhbCBzcGVjaWFsXHJcbiAqICAgICAgIGNhc2VzIHRoYXQgbWF5IGFwcGx5LlxyXG4gKi9cclxuR3JpZEJveC5wcm90b3R5cGUuX211dGF0b3JLZXlzID0gWyAuLi5TSVpBQkxFX09QVElPTl9LRVlTLCAuLi5HUklEQk9YX09QVElPTl9LRVlTLCAuLi5Ob2RlLnByb3RvdHlwZS5fbXV0YXRvcktleXMgXTtcclxuXHJcbnNjZW5lcnkucmVnaXN0ZXIoICdHcmlkQm94JywgR3JpZEJveCApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLDhCQUE4QixNQUFNLDREQUE0RDtBQUV2RyxPQUFPQyxTQUFTLE1BQU0sdUNBQXVDO0FBQzdELE9BQU9DLFdBQVcsTUFBTSx5Q0FBeUM7QUFDakUsU0FBU0MsMkJB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