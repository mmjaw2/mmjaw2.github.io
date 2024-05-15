// Copyright 2021-2024, University of Colorado Boulder

/**
 * Mixin for storing options that can affect each cell.
 *
 * Handles a lot of conversion from internal Enumeration values (for performance) and external string representations.
 * This is done primarily for performance and that style of internal enumeration pattern. If string comparisons are
 * faster, that could be used instead.
 *
 * NOTE: This is mixed into both the constraint AND the cell, since we have two layers of options. The `null` meaning
 * "inherit from the default" is mainly used for the cells, so that if it's not specified in the cell, it will be
 * specified in the constraint (as non-null).
 *
 * NOTE: This is a mixin meant to be used internally only by Scenery (for the constraint and cell), and should not be
 * used by outside code.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import memoize from '../../../../phet-core/js/memoize.js';
import mutate from '../../../../phet-core/js/mutate.js';
import { HorizontalLayoutAlignValues, LayoutAlign, MARGIN_LAYOUT_CONFIGURABLE_OPTION_KEYS, MarginLayoutConfigurable, scenery, VerticalLayoutAlignValues } from '../../imports.js';
import assertMutuallyExclusiveOptions from '../../../../phet-core/js/assertMutuallyExclusiveOptions.js';
const GRID_CONFIGURABLE_OPTION_KEYS = ['xAlign', 'yAlign', 'stretch', 'xStretch', 'yStretch', 'grow', 'xGrow', 'yGrow'].concat(MARGIN_LAYOUT_CONFIGURABLE_OPTION_KEYS);

// We remove the null values for the values that won't actually take null

// (scenery-internal)
const GridConfigurable = memoize(type => {
  return class GridConfigurableMixin extends MarginLayoutConfigurable(type) {
    // (scenery-internal)
    _xAlign = null;
    _yAlign = null;
    _xStretch = null;
    _yStretch = null;
    _xGrow = null;
    _yGrow = null;

    /**
     * (scenery-internal)
     */
    constructor(...args) {
      super(...args);
    }

    /**
     * (scenery-internal)
     */
    mutateConfigurable(options) {
      super.mutateConfigurable(options);
      assertMutuallyExclusiveOptions(options, ['stretch'], ['xStretch', 'yStretch']);
      assertMutuallyExclusiveOptions(options, ['grow'], ['xGrow', 'yGrow']);
      mutate(this, GRID_CONFIGURABLE_OPTION_KEYS, options);
    }

    /**
     * Resets values to the "base" state.
     *
     * This is the fallback state for a constraint where every value is defined and valid. If a cell does not have a
     * specific "overridden" value, or a constraint doesn't have an "overridden" value, then it will take the value
     * defined here.
     *
     * These should be the default values for constraints.
     *
     * (scenery-internal)
     */
    setConfigToBaseDefault() {
      this._xAlign = LayoutAlign.CENTER;
      this._yAlign = LayoutAlign.CENTER;
      this._xStretch = false;
      this._yStretch = false;
      this._xGrow = 0;
      this._yGrow = 0;
      super.setConfigToBaseDefault();
    }

    /**
     * Resets values to the "don't override anything, only inherit from the constraint" state
     *
     * These should be the default values for cells (e.g. "take all the behavior from the constraint, nothing is
     * overridden").
     *
     * (scenery-internal)
     */
    setConfigToInherit(ignoreOptions) {
      if (!ignoreOptions || ignoreOptions.xAlign === undefined) {
        this._xAlign = null;
      }
      if (!ignoreOptions || ignoreOptions.yAlign === undefined) {
        this._yAlign = null;
      }
      if (!ignoreOptions || ignoreOptions.stretch === undefined && ignoreOptions.xStretch === undefined) {
        this._xStretch = null;
      }
      if (!ignoreOptions || ignoreOptions.stretch === undefined && ignoreOptions.yStretch === undefined) {
        this._yStretch = null;
      }
      if (!ignoreOptions || ignoreOptions.grow === undefined && ignoreOptions.xGrow === undefined) {
        this._xGrow = null;
      }
      if (!ignoreOptions || ignoreOptions.grow === undefined && ignoreOptions.yGrow === undefined) {
        this._yGrow = null;
      }
      super.setConfigToInherit(ignoreOptions);
    }

    /**
     * (scenery-internal)
     */
    get xAlign() {
      const result = this._xAlign === null ? null : this._xAlign.horizontal;
      assert && assert(result === null || typeof result === 'string');
      return result;
    }

    /**
     * (scenery-internal)
     */
    set xAlign(value) {
      assert && assert(value === null || HorizontalLayoutAlignValues.includes(value), `align ${value} not supported, the valid values are ${HorizontalLayoutAlignValues} or null`);

      // remapping align values to an independent set, so they aren't orientation-dependent
      const mappedValue = LayoutAlign.horizontalAlignToInternal(value);
      assert && assert(mappedValue === null || mappedValue instanceof LayoutAlign);
      if (this._xAlign !== mappedValue) {
        this._xAlign = mappedValue;
        this.changedEmitter.emit();
      }
    }

    /**
     * (scenery-internal)
     */
    get yAlign() {
      const result = this._yAlign === null ? null : this._yAlign.vertical;
      assert && assert(result === null || typeof result === 'string');
      return result;
    }

    /**
     * (scenery-internal)
     */
    set yAlign(value) {
      assert && assert(value === null || VerticalLayoutAlignValues.includes(value), `align ${value} not supported, the valid values are ${VerticalLayoutAlignValues} or null`);

      // remapping align values to an independent set, so they aren't orientation-dependent
      const mappedValue = LayoutAlign.verticalAlignToInternal(value);
      assert && assert(mappedValue === null || mappedValue instanceof LayoutAlign);
      if (this._yAlign !== mappedValue) {
        this._yAlign = mappedValue;
        this.changedEmitter.emit();
      }
    }

    /**
     * (scenery-internal)
     */
    get grow() {
      assert && assert(this._xGrow === this._yGrow);
      return this._xGrow;
    }

    /**
     * (scenery-internal)
     */
    set grow(value) {
      assert && assert(value === null || typeof value === 'number' && isFinite(value) && value >= 0);
      if (this._xGrow !== value || this._yGrow !== value) {
        this._xGrow = value;
        this._yGrow = value;
        this.changedEmitter.emit();
      }
    }

    /**
     * (scenery-internal)
     */
    get xGrow() {
      return this._xGrow;
    }

    /**
     * (scenery-internal)
     */
    set xGrow(value) {
      assert && assert(value === null || typeof value === 'number' && isFinite(value) && value >= 0);
      if (this._xGrow !== value) {
        this._xGrow = value;
        this.changedEmitter.emit();
      }
    }

    /**
     * (scenery-internal)
     */
    get yGrow() {
      return this._yGrow;
    }

    /**
     * (scenery-internal)
     */
    set yGrow(value) {
      assert && assert(value === null || typeof value === 'number' && isFinite(value) && value >= 0);
      if (this._yGrow !== value) {
        this._yGrow = value;
        this.changedEmitter.emit();
      }
    }

    /**
     * (scenery-internal)
     */
    get stretch() {
      assert && assert(this._xStretch === this._yStretch);
      return this._xStretch;
    }

    /**
     * (scenery-internal)
     */
    set stretch(value) {
      assert && assert(value === null || typeof value === 'boolean');
      if (this._xStretch !== value || this._yStretch !== value) {
        this._xStretch = value;
        this._yStretch = value;
        this.changedEmitter.emit();
      }
    }

    /**
     * (scenery-internal)
     */
    get xStretch() {
      return this._xStretch;
    }

    /**
     * (scenery-internal)
     */
    set xStretch(value) {
      assert && assert(value === null || typeof value === 'boolean');
      if (this._xStretch !== value) {
        this._xStretch = value;
        this.changedEmitter.emit();
      }
    }

    /**
     * (scenery-internal)
     */
    get yStretch() {
      return this._yStretch;
    }

    /**
     * (scenery-internal)
     */
    set yStretch(value) {
      assert && assert(value === null || typeof value === 'boolean');
      if (this._yStretch !== value) {
        this._yStretch = value;
        this.changedEmitter.emit();
      }
    }
  };
});
scenery.register('GridConfigurable', GridConfigurable);
export default GridConfigurable;
export { GRID_CONFIGURABLE_OPTION_KEYS };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJtZW1vaXplIiwibXV0YXRlIiwiSG9yaXpvbnRhbExheW91dEFsaWduVmFsdWVzIiwiTGF5b3V0QWxpZ24iLCJNQVJHSU5fTEFZT1VUX0NPTkZJR1VSQUJMRV9PUFRJT05fS0VZUyIsIk1hcmdpbkxheW91dENvbmZpZ3VyYWJsZSIsInNjZW5lcnkiLCJWZXJ0aWNhbExheW91dEFsaWduVmFsdWVzIiwiYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zIiwiR1JJRF9DT05GSUdVUkFCTEVfT1BUSU9OX0tFWVMiLCJjb25jYXQiLCJHcmlkQ29uZmlndXJhYmxlIiwidHlwZSIsIkdyaWRDb25maWd1cmFibGVNaXhpbiIsIl94QWxpZ24iLCJfeUFsaWduIiwiX3hTdHJldGNoIiwiX3lTdHJldGNoIiwiX3hHcm93IiwiX3lHcm93IiwiY29uc3RydWN0b3IiLCJhcmdzIiwibXV0YXRlQ29uZmlndXJhYmxlIiwib3B0aW9ucyIsInNldENvbmZpZ1RvQmFzZURlZmF1bHQiLCJDRU5URVIiLCJzZXRDb25maWdUb0luaGVyaXQiLCJpZ25vcmVPcHRpb25zIiwieEFsaWduIiwidW5kZWZpbmVkIiwieUFsaWduIiwic3RyZXRjaCIsInhTdHJldGNoIiwieVN0cmV0Y2giLCJncm93IiwieEdyb3ciLCJ5R3JvdyIsInJlc3VsdCIsImhvcml6b250YWwiLCJhc3NlcnQiLCJ2YWx1ZSIsImluY2x1ZGVzIiwibWFwcGVkVmFsdWUiLCJob3Jpem9udGFsQWxpZ25Ub0ludGVybmFsIiwiY2hhbmdlZEVtaXR0ZXIiLCJlbWl0IiwidmVydGljYWwiLCJ2ZXJ0aWNhbEFsaWduVG9JbnRlcm5hbCIsImlzRmluaXRlIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJHcmlkQ29uZmlndXJhYmxlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIE1peGluIGZvciBzdG9yaW5nIG9wdGlvbnMgdGhhdCBjYW4gYWZmZWN0IGVhY2ggY2VsbC5cclxuICpcclxuICogSGFuZGxlcyBhIGxvdCBvZiBjb252ZXJzaW9uIGZyb20gaW50ZXJuYWwgRW51bWVyYXRpb24gdmFsdWVzIChmb3IgcGVyZm9ybWFuY2UpIGFuZCBleHRlcm5hbCBzdHJpbmcgcmVwcmVzZW50YXRpb25zLlxyXG4gKiBUaGlzIGlzIGRvbmUgcHJpbWFyaWx5IGZvciBwZXJmb3JtYW5jZSBhbmQgdGhhdCBzdHlsZSBvZiBpbnRlcm5hbCBlbnVtZXJhdGlvbiBwYXR0ZXJuLiBJZiBzdHJpbmcgY29tcGFyaXNvbnMgYXJlXHJcbiAqIGZhc3RlciwgdGhhdCBjb3VsZCBiZSB1c2VkIGluc3RlYWQuXHJcbiAqXHJcbiAqIE5PVEU6IFRoaXMgaXMgbWl4ZWQgaW50byBib3RoIHRoZSBjb25zdHJhaW50IEFORCB0aGUgY2VsbCwgc2luY2Ugd2UgaGF2ZSB0d28gbGF5ZXJzIG9mIG9wdGlvbnMuIFRoZSBgbnVsbGAgbWVhbmluZ1xyXG4gKiBcImluaGVyaXQgZnJvbSB0aGUgZGVmYXVsdFwiIGlzIG1haW5seSB1c2VkIGZvciB0aGUgY2VsbHMsIHNvIHRoYXQgaWYgaXQncyBub3Qgc3BlY2lmaWVkIGluIHRoZSBjZWxsLCBpdCB3aWxsIGJlXHJcbiAqIHNwZWNpZmllZCBpbiB0aGUgY29uc3RyYWludCAoYXMgbm9uLW51bGwpLlxyXG4gKlxyXG4gKiBOT1RFOiBUaGlzIGlzIGEgbWl4aW4gbWVhbnQgdG8gYmUgdXNlZCBpbnRlcm5hbGx5IG9ubHkgYnkgU2NlbmVyeSAoZm9yIHRoZSBjb25zdHJhaW50IGFuZCBjZWxsKSwgYW5kIHNob3VsZCBub3QgYmVcclxuICogdXNlZCBieSBvdXRzaWRlIGNvZGUuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgQ29uc3RydWN0b3IgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL0NvbnN0cnVjdG9yLmpzJztcclxuaW1wb3J0IG1lbW9pemUgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL21lbW9pemUuanMnO1xyXG5pbXBvcnQgbXV0YXRlIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9tdXRhdGUuanMnO1xyXG5pbXBvcnQgeyBIb3Jpem9udGFsTGF5b3V0QWxpZ24sIEhvcml6b250YWxMYXlvdXRBbGlnblZhbHVlcywgTGF5b3V0QWxpZ24sIE1BUkdJTl9MQVlPVVRfQ09ORklHVVJBQkxFX09QVElPTl9LRVlTLCBNYXJnaW5MYXlvdXRDb25maWd1cmFibGUsIE1hcmdpbkxheW91dENvbmZpZ3VyYWJsZU9wdGlvbnMsIHNjZW5lcnksIFZlcnRpY2FsTGF5b3V0QWxpZ24sIFZlcnRpY2FsTGF5b3V0QWxpZ25WYWx1ZXMgfSBmcm9tICcuLi8uLi9pbXBvcnRzLmpzJztcclxuaW1wb3J0IGFzc2VydE11dHVhbGx5RXhjbHVzaXZlT3B0aW9ucyBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zLmpzJztcclxuaW1wb3J0IFdpdGhvdXROdWxsIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9XaXRob3V0TnVsbC5qcyc7XHJcbmltcG9ydCBJbnRlbnRpb25hbEFueSBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvSW50ZW50aW9uYWxBbnkuanMnO1xyXG5cclxuY29uc3QgR1JJRF9DT05GSUdVUkFCTEVfT1BUSU9OX0tFWVMgPSBbXHJcbiAgJ3hBbGlnbicsXHJcbiAgJ3lBbGlnbicsXHJcbiAgJ3N0cmV0Y2gnLFxyXG4gICd4U3RyZXRjaCcsXHJcbiAgJ3lTdHJldGNoJyxcclxuICAnZ3JvdycsXHJcbiAgJ3hHcm93JyxcclxuICAneUdyb3cnXHJcbl0uY29uY2F0KCBNQVJHSU5fTEFZT1VUX0NPTkZJR1VSQUJMRV9PUFRJT05fS0VZUyApO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuICAvLyBBbGlnbm1lbnRzIGNvbnRyb2wgaG93IHRoZSBjb250ZW50IG9mIGEgY2VsbCBpcyBwb3NpdGlvbmVkIHdpdGhpbiB0aGF0IGNlbGwncyBhdmFpbGFibGUgYXJlYSAodGh1cyBpdCBvbmx5IGFwcGxpZXNcclxuICAvLyBpZiB0aGVyZSBpcyBBRERJVElPTkFMIHNwYWNlLCBlLmcuIGluIGEgcm93L2NvbHVtbiB3aXRoIGEgbGFyZ2VyIGl0ZW0sIG9yIHRoZXJlIGlzIGEgcHJlZmVycmVkIHNpemUgb24gdGhlIEdyaWRCb3guXHJcbiAgLy9cclxuICAvLyBGb3IgJ29yaWdpbicsIHRoZSB4PTAgb3IgeT0wIHBvaW50cyBvZiBlYWNoIGl0ZW0gY29udGVudCB3aWxsIGJlIGFsaWduZWQgKHZlcnRpY2FsbHkgb3IgaG9yaXpvbnRhbGx5KS4gVGhpcyBpc1xyXG4gIC8vIHBhcnRpY3VsYXJseSB1c2VmdWwgZm9yIFRleHQsIHdoZXJlIHRoZSBvcmlnaW4gKHk9MCkgaXMgdGhlIGJhc2VsaW5lIG9mIHRoZSB0ZXh0LCBzbyB0aGF0IGRpZmZlcmVudGx5LXNpemVkIHRleHRzXHJcbiAgLy8gY2FuIGhhdmUgdGhlaXIgYmFzZWxpbmVzIGFsaWduZWQsIG9yIG90aGVyIGNvbnRlbnQgY2FuIGJlIGFsaWduZWQgKGUuZy4gYSBjaXJjbGUgd2hvc2Ugb3JpZ2luIGlzIGF0IGl0cyBjZW50ZXIpLlxyXG4gIC8vXHJcbiAgLy8gTk9URTogJ29yaWdpbicgYWxpZ25zIHdpbGwgb25seSBhcHBseSB0byBjZWxscyB0aGF0IGFyZSAxIGdyaWQgbGluZSBpbiB0aGF0IG9yaWVudGF0aW9uICh3aWR0aC9oZWlnaHQpXHJcbiAgeEFsaWduPzogSG9yaXpvbnRhbExheW91dEFsaWduIHwgbnVsbDtcclxuICB5QWxpZ24/OiBWZXJ0aWNhbExheW91dEFsaWduIHwgbnVsbDtcclxuXHJcbiAgLy8gU3RyZXRjaCB3aWxsIGNvbnRyb2wgd2hldGhlciBhIHJlc2l6YWJsZSBjb21wb25lbnQgKG1peGVzIGluIFdpZHRoU2l6YWJsZS9IZWlnaHRTaXphYmxlKSB3aWxsIGV4cGFuZCB0byBmaWxsIHRoZVxyXG4gIC8vIGF2YWlsYWJsZSBzcGFjZSB3aXRoaW4gYSBjZWxsJ3MgYXZhaWxhYmxlIGFyZWEuIFNpbWlsYXJseSB0byBhbGlnbiwgdGhpcyBvbmx5IGFwcGxpZXMgaWYgdGhlcmUgaXMgYWRkaXRpb25hbCBzcGFjZS5cclxuICBzdHJldGNoPzogYm9vbGVhbjsgLy8gc2hvcnRjdXQgZm9yIHhTdHJldGNoL3lTdHJldGNoXHJcbiAgeFN0cmV0Y2g/OiBib29sZWFuIHwgbnVsbDtcclxuICB5U3RyZXRjaD86IGJvb2xlYW4gfCBudWxsO1xyXG5cclxuICAvLyBHcm93IHdpbGwgY29udHJvbCBob3cgYWRkaXRpb25hbCBlbXB0eSBzcGFjZSAoYWJvdmUgdGhlIG1pbmltdW0gc2l6ZXMgdGhhdCB0aGUgZ3JpZCBjb3VsZCB0YWtlKSB3aWxsIGJlXHJcbiAgLy8gcHJvcG9ydGlvbmVkIG91dCB0byB0aGUgcm93cyBhbmQgY29sdW1ucy4gVW5saWtlIHN0cmV0Y2gsIHRoaXMgYWZmZWN0cyB0aGUgc2l6ZSBvZiB0aGUgY29sdW1ucywgYW5kIGRvZXMgbm90IGFmZmVjdFxyXG4gIC8vIHRoZSBpbmRpdmlkdWFsIGNlbGxzLlxyXG4gIGdyb3c/OiBudW1iZXIgfCBudWxsOyAvLyBzaG9ydGN1dCBmb3IgeEdyb3cveUdyb3dcclxuICB4R3Jvdz86IG51bWJlciB8IG51bGw7XHJcbiAgeUdyb3c/OiBudW1iZXIgfCBudWxsO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgR3JpZENvbmZpZ3VyYWJsZU9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIE1hcmdpbkxheW91dENvbmZpZ3VyYWJsZU9wdGlvbnM7XHJcblxyXG4vLyBXZSByZW1vdmUgdGhlIG51bGwgdmFsdWVzIGZvciB0aGUgdmFsdWVzIHRoYXQgd29uJ3QgYWN0dWFsbHkgdGFrZSBudWxsXHJcbmV4cG9ydCB0eXBlIEV4dGVybmFsR3JpZENvbmZpZ3VyYWJsZU9wdGlvbnMgPSBXaXRob3V0TnVsbDxHcmlkQ29uZmlndXJhYmxlT3B0aW9ucywgRXhjbHVkZTxrZXlvZiBHcmlkQ29uZmlndXJhYmxlT3B0aW9ucywgJ21pbkNvbnRlbnRXaWR0aCcgfCAnbWluQ29udGVudEhlaWdodCcgfCAnbWF4Q29udGVudFdpZHRoJyB8ICdtYXhDb250ZW50SGVpZ2h0Jz4+O1xyXG5cclxuLy8gKHNjZW5lcnktaW50ZXJuYWwpXHJcbmNvbnN0IEdyaWRDb25maWd1cmFibGUgPSBtZW1vaXplKCA8U3VwZXJUeXBlIGV4dGVuZHMgQ29uc3RydWN0b3I+KCB0eXBlOiBTdXBlclR5cGUgKSA9PiB7XHJcbiAgcmV0dXJuIGNsYXNzIEdyaWRDb25maWd1cmFibGVNaXhpbiBleHRlbmRzIE1hcmdpbkxheW91dENvbmZpZ3VyYWJsZSggdHlwZSApIHtcclxuXHJcbiAgICAvLyAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgIHB1YmxpYyBfeEFsaWduOiBMYXlvdXRBbGlnbiB8IG51bGwgPSBudWxsO1xyXG4gICAgcHVibGljIF95QWxpZ246IExheW91dEFsaWduIHwgbnVsbCA9IG51bGw7XHJcbiAgICBwdWJsaWMgX3hTdHJldGNoOiBib29sZWFuIHwgbnVsbCA9IG51bGw7XHJcbiAgICBwdWJsaWMgX3lTdHJldGNoOiBib29sZWFuIHwgbnVsbCA9IG51bGw7XHJcbiAgICBwdWJsaWMgX3hHcm93OiBudW1iZXIgfCBudWxsID0gbnVsbDtcclxuICAgIHB1YmxpYyBfeUdyb3c6IG51bWJlciB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBjb25zdHJ1Y3RvciggLi4uYXJnczogSW50ZW50aW9uYWxBbnlbXSApIHtcclxuICAgICAgc3VwZXIoIC4uLmFyZ3MgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgb3ZlcnJpZGUgbXV0YXRlQ29uZmlndXJhYmxlKCBvcHRpb25zPzogR3JpZENvbmZpZ3VyYWJsZU9wdGlvbnMgKTogdm9pZCB7XHJcbiAgICAgIHN1cGVyLm11dGF0ZUNvbmZpZ3VyYWJsZSggb3B0aW9ucyApO1xyXG5cclxuICAgICAgYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zKCBvcHRpb25zLCBbICdzdHJldGNoJyBdLCBbICd4U3RyZXRjaCcsICd5U3RyZXRjaCcgXSApO1xyXG4gICAgICBhc3NlcnRNdXR1YWxseUV4Y2x1c2l2ZU9wdGlvbnMoIG9wdGlvbnMsIFsgJ2dyb3cnIF0sIFsgJ3hHcm93JywgJ3lHcm93JyBdICk7XHJcblxyXG4gICAgICBtdXRhdGUoIHRoaXMsIEdSSURfQ09ORklHVVJBQkxFX09QVElPTl9LRVlTLCBvcHRpb25zICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXNldHMgdmFsdWVzIHRvIHRoZSBcImJhc2VcIiBzdGF0ZS5cclxuICAgICAqXHJcbiAgICAgKiBUaGlzIGlzIHRoZSBmYWxsYmFjayBzdGF0ZSBmb3IgYSBjb25zdHJhaW50IHdoZXJlIGV2ZXJ5IHZhbHVlIGlzIGRlZmluZWQgYW5kIHZhbGlkLiBJZiBhIGNlbGwgZG9lcyBub3QgaGF2ZSBhXHJcbiAgICAgKiBzcGVjaWZpYyBcIm92ZXJyaWRkZW5cIiB2YWx1ZSwgb3IgYSBjb25zdHJhaW50IGRvZXNuJ3QgaGF2ZSBhbiBcIm92ZXJyaWRkZW5cIiB2YWx1ZSwgdGhlbiBpdCB3aWxsIHRha2UgdGhlIHZhbHVlXHJcbiAgICAgKiBkZWZpbmVkIGhlcmUuXHJcbiAgICAgKlxyXG4gICAgICogVGhlc2Ugc2hvdWxkIGJlIHRoZSBkZWZhdWx0IHZhbHVlcyBmb3IgY29uc3RyYWludHMuXHJcbiAgICAgKlxyXG4gICAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBvdmVycmlkZSBzZXRDb25maWdUb0Jhc2VEZWZhdWx0KCk6IHZvaWQge1xyXG4gICAgICB0aGlzLl94QWxpZ24gPSBMYXlvdXRBbGlnbi5DRU5URVI7XHJcbiAgICAgIHRoaXMuX3lBbGlnbiA9IExheW91dEFsaWduLkNFTlRFUjtcclxuICAgICAgdGhpcy5feFN0cmV0Y2ggPSBmYWxzZTtcclxuICAgICAgdGhpcy5feVN0cmV0Y2ggPSBmYWxzZTtcclxuICAgICAgdGhpcy5feEdyb3cgPSAwO1xyXG4gICAgICB0aGlzLl95R3JvdyA9IDA7XHJcblxyXG4gICAgICBzdXBlci5zZXRDb25maWdUb0Jhc2VEZWZhdWx0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXNldHMgdmFsdWVzIHRvIHRoZSBcImRvbid0IG92ZXJyaWRlIGFueXRoaW5nLCBvbmx5IGluaGVyaXQgZnJvbSB0aGUgY29uc3RyYWludFwiIHN0YXRlXHJcbiAgICAgKlxyXG4gICAgICogVGhlc2Ugc2hvdWxkIGJlIHRoZSBkZWZhdWx0IHZhbHVlcyBmb3IgY2VsbHMgKGUuZy4gXCJ0YWtlIGFsbCB0aGUgYmVoYXZpb3IgZnJvbSB0aGUgY29uc3RyYWludCwgbm90aGluZyBpc1xyXG4gICAgICogb3ZlcnJpZGRlblwiKS5cclxuICAgICAqXHJcbiAgICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgICAqL1xyXG4gICAgcHVibGljIG92ZXJyaWRlIHNldENvbmZpZ1RvSW5oZXJpdCggaWdub3JlT3B0aW9ucz86IEdyaWRDb25maWd1cmFibGVPcHRpb25zICk6IHZvaWQge1xyXG4gICAgICBpZiAoICFpZ25vcmVPcHRpb25zIHx8IGlnbm9yZU9wdGlvbnMueEFsaWduID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgdGhpcy5feEFsaWduID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICBpZiAoICFpZ25vcmVPcHRpb25zIHx8IGlnbm9yZU9wdGlvbnMueUFsaWduID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgdGhpcy5feUFsaWduID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICBpZiAoICFpZ25vcmVPcHRpb25zIHx8ICggaWdub3JlT3B0aW9ucy5zdHJldGNoID09PSB1bmRlZmluZWQgJiYgaWdub3JlT3B0aW9ucy54U3RyZXRjaCA9PT0gdW5kZWZpbmVkICkgKSB7XHJcbiAgICAgICAgdGhpcy5feFN0cmV0Y2ggPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggIWlnbm9yZU9wdGlvbnMgfHwgKCBpZ25vcmVPcHRpb25zLnN0cmV0Y2ggPT09IHVuZGVmaW5lZCAmJiBpZ25vcmVPcHRpb25zLnlTdHJldGNoID09PSB1bmRlZmluZWQgKSApIHtcclxuICAgICAgICB0aGlzLl95U3RyZXRjaCA9IG51bGw7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCAhaWdub3JlT3B0aW9ucyB8fCAoIGlnbm9yZU9wdGlvbnMuZ3JvdyA9PT0gdW5kZWZpbmVkICYmIGlnbm9yZU9wdGlvbnMueEdyb3cgPT09IHVuZGVmaW5lZCApICkge1xyXG4gICAgICAgIHRoaXMuX3hHcm93ID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICBpZiAoICFpZ25vcmVPcHRpb25zIHx8ICggaWdub3JlT3B0aW9ucy5ncm93ID09PSB1bmRlZmluZWQgJiYgaWdub3JlT3B0aW9ucy55R3JvdyA9PT0gdW5kZWZpbmVkICkgKSB7XHJcbiAgICAgICAgdGhpcy5feUdyb3cgPSBudWxsO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBzdXBlci5zZXRDb25maWdUb0luaGVyaXQoIGlnbm9yZU9wdGlvbnMgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0IHhBbGlnbigpOiBIb3Jpem9udGFsTGF5b3V0QWxpZ24gfCBudWxsIHtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5feEFsaWduID09PSBudWxsID8gbnVsbCA6IHRoaXMuX3hBbGlnbi5ob3Jpem9udGFsO1xyXG5cclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggcmVzdWx0ID09PSBudWxsIHx8IHR5cGVvZiByZXN1bHQgPT09ICdzdHJpbmcnICk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzZXQgeEFsaWduKCB2YWx1ZTogSG9yaXpvbnRhbExheW91dEFsaWduIHwgbnVsbCApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdmFsdWUgPT09IG51bGwgfHwgSG9yaXpvbnRhbExheW91dEFsaWduVmFsdWVzLmluY2x1ZGVzKCB2YWx1ZSApLFxyXG4gICAgICAgIGBhbGlnbiAke3ZhbHVlfSBub3Qgc3VwcG9ydGVkLCB0aGUgdmFsaWQgdmFsdWVzIGFyZSAke0hvcml6b250YWxMYXlvdXRBbGlnblZhbHVlc30gb3IgbnVsbGAgKTtcclxuXHJcbiAgICAgIC8vIHJlbWFwcGluZyBhbGlnbiB2YWx1ZXMgdG8gYW4gaW5kZXBlbmRlbnQgc2V0LCBzbyB0aGV5IGFyZW4ndCBvcmllbnRhdGlvbi1kZXBlbmRlbnRcclxuICAgICAgY29uc3QgbWFwcGVkVmFsdWUgPSBMYXlvdXRBbGlnbi5ob3Jpem9udGFsQWxpZ25Ub0ludGVybmFsKCB2YWx1ZSApO1xyXG5cclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggbWFwcGVkVmFsdWUgPT09IG51bGwgfHwgbWFwcGVkVmFsdWUgaW5zdGFuY2VvZiBMYXlvdXRBbGlnbiApO1xyXG5cclxuICAgICAgaWYgKCB0aGlzLl94QWxpZ24gIT09IG1hcHBlZFZhbHVlICkge1xyXG4gICAgICAgIHRoaXMuX3hBbGlnbiA9IG1hcHBlZFZhbHVlO1xyXG5cclxuICAgICAgICB0aGlzLmNoYW5nZWRFbWl0dGVyLmVtaXQoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXQgeUFsaWduKCk6IFZlcnRpY2FsTGF5b3V0QWxpZ24gfCBudWxsIHtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5feUFsaWduID09PSBudWxsID8gbnVsbCA6IHRoaXMuX3lBbGlnbi52ZXJ0aWNhbDtcclxuXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHJlc3VsdCA9PT0gbnVsbCB8fCB0eXBlb2YgcmVzdWx0ID09PSAnc3RyaW5nJyApO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc2V0IHlBbGlnbiggdmFsdWU6IFZlcnRpY2FsTGF5b3V0QWxpZ24gfCBudWxsICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB2YWx1ZSA9PT0gbnVsbCB8fCBWZXJ0aWNhbExheW91dEFsaWduVmFsdWVzLmluY2x1ZGVzKCB2YWx1ZSApLFxyXG4gICAgICAgIGBhbGlnbiAke3ZhbHVlfSBub3Qgc3VwcG9ydGVkLCB0aGUgdmFsaWQgdmFsdWVzIGFyZSAke1ZlcnRpY2FsTGF5b3V0QWxpZ25WYWx1ZXN9IG9yIG51bGxgICk7XHJcblxyXG4gICAgICAvLyByZW1hcHBpbmcgYWxpZ24gdmFsdWVzIHRvIGFuIGluZGVwZW5kZW50IHNldCwgc28gdGhleSBhcmVuJ3Qgb3JpZW50YXRpb24tZGVwZW5kZW50XHJcbiAgICAgIGNvbnN0IG1hcHBlZFZhbHVlID0gTGF5b3V0QWxpZ24udmVydGljYWxBbGlnblRvSW50ZXJuYWwoIHZhbHVlICk7XHJcblxyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBtYXBwZWRWYWx1ZSA9PT0gbnVsbCB8fCBtYXBwZWRWYWx1ZSBpbnN0YW5jZW9mIExheW91dEFsaWduICk7XHJcblxyXG4gICAgICBpZiAoIHRoaXMuX3lBbGlnbiAhPT0gbWFwcGVkVmFsdWUgKSB7XHJcbiAgICAgICAgdGhpcy5feUFsaWduID0gbWFwcGVkVmFsdWU7XHJcblxyXG4gICAgICAgIHRoaXMuY2hhbmdlZEVtaXR0ZXIuZW1pdCgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldCBncm93KCk6IG51bWJlciB8IG51bGwge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl94R3JvdyA9PT0gdGhpcy5feUdyb3cgKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLl94R3JvdztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc2V0IGdyb3coIHZhbHVlOiBudW1iZXIgfCBudWxsICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB2YWx1ZSA9PT0gbnVsbCB8fCAoIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgaXNGaW5pdGUoIHZhbHVlICkgJiYgdmFsdWUgPj0gMCApICk7XHJcblxyXG4gICAgICBpZiAoIHRoaXMuX3hHcm93ICE9PSB2YWx1ZSB8fCB0aGlzLl95R3JvdyAhPT0gdmFsdWUgKSB7XHJcbiAgICAgICAgdGhpcy5feEdyb3cgPSB2YWx1ZTtcclxuICAgICAgICB0aGlzLl95R3JvdyA9IHZhbHVlO1xyXG5cclxuICAgICAgICB0aGlzLmNoYW5nZWRFbWl0dGVyLmVtaXQoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXQgeEdyb3coKTogbnVtYmVyIHwgbnVsbCB7XHJcbiAgICAgIHJldHVybiB0aGlzLl94R3JvdztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc2V0IHhHcm93KCB2YWx1ZTogbnVtYmVyIHwgbnVsbCApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdmFsdWUgPT09IG51bGwgfHwgKCB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmIGlzRmluaXRlKCB2YWx1ZSApICYmIHZhbHVlID49IDAgKSApO1xyXG5cclxuICAgICAgaWYgKCB0aGlzLl94R3JvdyAhPT0gdmFsdWUgKSB7XHJcbiAgICAgICAgdGhpcy5feEdyb3cgPSB2YWx1ZTtcclxuXHJcbiAgICAgICAgdGhpcy5jaGFuZ2VkRW1pdHRlci5lbWl0KCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0IHlHcm93KCk6IG51bWJlciB8IG51bGwge1xyXG4gICAgICByZXR1cm4gdGhpcy5feUdyb3c7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgICAqL1xyXG4gICAgcHVibGljIHNldCB5R3JvdyggdmFsdWU6IG51bWJlciB8IG51bGwgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHZhbHVlID09PSBudWxsIHx8ICggdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyAmJiBpc0Zpbml0ZSggdmFsdWUgKSAmJiB2YWx1ZSA+PSAwICkgKTtcclxuXHJcbiAgICAgIGlmICggdGhpcy5feUdyb3cgIT09IHZhbHVlICkge1xyXG4gICAgICAgIHRoaXMuX3lHcm93ID0gdmFsdWU7XHJcblxyXG4gICAgICAgIHRoaXMuY2hhbmdlZEVtaXR0ZXIuZW1pdCgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldCBzdHJldGNoKCk6IGJvb2xlYW4gfCBudWxsIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5feFN0cmV0Y2ggPT09IHRoaXMuX3lTdHJldGNoICk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5feFN0cmV0Y2g7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgICAqL1xyXG4gICAgcHVibGljIHNldCBzdHJldGNoKCB2YWx1ZTogYm9vbGVhbiB8IG51bGwgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHZhbHVlID09PSBudWxsIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nICk7XHJcblxyXG4gICAgICBpZiAoIHRoaXMuX3hTdHJldGNoICE9PSB2YWx1ZSB8fCB0aGlzLl95U3RyZXRjaCAhPT0gdmFsdWUgKSB7XHJcbiAgICAgICAgdGhpcy5feFN0cmV0Y2ggPSB2YWx1ZTtcclxuICAgICAgICB0aGlzLl95U3RyZXRjaCA9IHZhbHVlO1xyXG5cclxuICAgICAgICB0aGlzLmNoYW5nZWRFbWl0dGVyLmVtaXQoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXQgeFN0cmV0Y2goKTogYm9vbGVhbiB8IG51bGwge1xyXG4gICAgICByZXR1cm4gdGhpcy5feFN0cmV0Y2g7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiAoc2NlbmVyeS1pbnRlcm5hbClcclxuICAgICAqL1xyXG4gICAgcHVibGljIHNldCB4U3RyZXRjaCggdmFsdWU6IGJvb2xlYW4gfCBudWxsICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB2YWx1ZSA9PT0gbnVsbCB8fCB0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJyApO1xyXG5cclxuICAgICAgaWYgKCB0aGlzLl94U3RyZXRjaCAhPT0gdmFsdWUgKSB7XHJcbiAgICAgICAgdGhpcy5feFN0cmV0Y2ggPSB2YWx1ZTtcclxuXHJcbiAgICAgICAgdGhpcy5jaGFuZ2VkRW1pdHRlci5lbWl0KCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIChzY2VuZXJ5LWludGVybmFsKVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0IHlTdHJldGNoKCk6IGJvb2xlYW4gfCBudWxsIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX3lTdHJldGNoO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogKHNjZW5lcnktaW50ZXJuYWwpXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzZXQgeVN0cmV0Y2goIHZhbHVlOiBib29sZWFuIHwgbnVsbCApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdmFsdWUgPT09IG51bGwgfHwgdHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicgKTtcclxuXHJcbiAgICAgIGlmICggdGhpcy5feVN0cmV0Y2ggIT09IHZhbHVlICkge1xyXG4gICAgICAgIHRoaXMuX3lTdHJldGNoID0gdmFsdWU7XHJcblxyXG4gICAgICAgIHRoaXMuY2hhbmdlZEVtaXR0ZXIuZW1pdCgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxufSApO1xyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ0dyaWRDb25maWd1cmFibGUnLCBHcmlkQ29uZmlndXJhYmxlICk7XHJcbmV4cG9ydCBkZWZhdWx0IEdyaWRDb25maWd1cmFibGU7XHJcbmV4cG9ydCB7IEdSSURfQ09ORklHVVJBQkxFX09QVElPTl9LRVlTIH07Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQSxPQUFPQSxPQUFPLE1BQU0scUNBQXFDO0FBQ3pELE9BQU9DLE1BQU0sTUFBTSxvQ0FBb0M7QUFDdkQsU0FBZ0NDLDJCQUEyQixFQUFFQyxXQUFXLEVB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