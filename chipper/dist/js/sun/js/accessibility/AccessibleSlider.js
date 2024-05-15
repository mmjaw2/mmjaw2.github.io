// Copyright 2017-2024, University of Colorado Boulder

/**
 * A trait for subtypes of Node, used to make the Node behave like a 'slider' with assistive technology. This could be
 * used by anything that moves along a 1-D line. An accessible slider behaves like:
 *
 * - Arrow keys increment/decrement the slider by a specified step size.
 * - Holding shift with arrow keys will increment/decrement by alternative step size, usually smaller than default.
 * - Page Up and Page Down increments/decrements value by an alternative step size, usually larger than default.
 * - Home key sets value to its minimum.
 * - End key sets value to its maximum.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import assertHasProperties from '../../../phet-core/js/assertHasProperties.js';
import { DelayedMutate } from '../../../scenery/js/imports.js';
import sun from '../sun.js';
import AccessibleValueHandler from './AccessibleValueHandler.js';
const ACCESSIBLE_SLIDER_OPTIONS = ['startDrag', 'drag', 'endDrag'];
/**
 * @param Type
 * @param optionsArgPosition - zero-indexed number that the options argument is provided at in the constructor for Type
 */
const AccessibleSlider = (Type, optionsArgPosition) => {
  const AccessibleSliderClass = DelayedMutate('AccessibleSlider', ACCESSIBLE_SLIDER_OPTIONS, class AccessibleSlider extends AccessibleValueHandler(Type, optionsArgPosition) {
    _startDrag = _.noop;
    _drag = _.noop;
    _endDrag = _.noop;
    constructor(...args) {
      const providedOptions = args[optionsArgPosition];
      assert && providedOptions && assert(Object.getPrototypeOf(providedOptions) === Object.prototype, 'Extra prototype on AccessibleSlider options object is a code smell (or probably a bug)');

      // AccessibleSlider uses 'drag' terminology rather than 'change' for consistency with Slider
      assert && assert(providedOptions.startInput === undefined, 'AccessibleSlider sets startInput through options.startDrag');
      assert && assert(providedOptions.endInput === undefined, 'AccessibleSlider sets endInput through options.endDrag');
      assert && assert(providedOptions.onInput === undefined, 'AccessibleSlider sets onInput through options.drag');
      super(...args);

      // members of the Node API that are used by this trait
      assertHasProperties(this, ['addInputListener', 'removeInputListener']);

      // handle all accessible event input
      const accessibleInputListener = this.getAccessibleValueHandlerInputListener();
      this.addInputListener(accessibleInputListener);

      // called by disposeAccessibleSlider to prevent memory leaks
      this._disposeAccessibleSlider = () => {
        this.removeInputListener(accessibleInputListener);
      };
    }
    set startDrag(value) {
      this._startDrag = value;

      // Also (unfortunately) forwarding to the startInput
      this.startInput = value;
    }
    get startDrag() {
      return this._startDrag;
    }
    set drag(value) {
      this._drag = value;

      // Also (unfortunately) forwarding to the onInput
      this.onInput = value;
    }
    get drag() {
      return this._drag;
    }
    set endDrag(value) {
      this._endDrag = value;

      // Also (unfortunately) forwarding to the endInput
      this.endInput = value;
    }
    get endDrag() {
      return this._endDrag;
    }

    /**
     * Make the accessible slider portions of this node eligible for garbage collection. Call when disposing
     * the type that this trait is mixed into.
     */
    dispose() {
      this._disposeAccessibleSlider();
      super.dispose();
    }
  });

  /**
   * {Array.<string>} - String keys for all the allowed options that will be set by Node.mutate( options ), in
   * the order they will be evaluated.
   *
   * NOTE: See Node's _mutatorKeys documentation for more information on how this operates, and potential special
   *       cases that may apply.
   */
  AccessibleSliderClass.prototype._mutatorKeys = ACCESSIBLE_SLIDER_OPTIONS.concat(AccessibleSliderClass.prototype._mutatorKeys);
  assert && assert(AccessibleSliderClass.prototype._mutatorKeys.length === _.uniq(AccessibleSliderClass.prototype._mutatorKeys).length, 'duplicate mutator keys in AccessibleSlider');
  return AccessibleSliderClass;
};
sun.register('AccessibleSlider', AccessibleSlider);
export default AccessibleSlider;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhc3NlcnRIYXNQcm9wZXJ0aWVzIiwiRGVsYXllZE11dGF0ZSIsInN1biIsIkFjY2Vzc2libGVWYWx1ZUhhbmRsZXIiLCJBQ0NFU1NJQkxFX1NMSURFUl9PUFRJT05TIiwiQWNjZXNzaWJsZVNsaWRlciIsIlR5cGUiLCJvcHRpb25zQXJnUG9zaXRpb24iLCJBY2Nlc3NpYmxlU2xpZGVyQ2xhc3MiLCJfc3RhcnREcmFnIiwiXyIsIm5vb3AiLCJfZHJhZyIsIl9lbmREcmFnIiwiY29uc3RydWN0b3IiLCJhcmdzIiwicHJvdmlkZWRPcHRpb25zIiwiYXNzZXJ0IiwiT2JqZWN0IiwiZ2V0UHJvdG90eXBlT2YiLCJwcm90b3R5cGUiLCJzdGFydElucHV0IiwidW5kZWZpbmVkIiwiZW5kSW5wdXQiLCJvbklucHV0IiwiYWNjZXNzaWJsZUlucHV0TGlzdGVuZXIiLCJnZXRBY2Nlc3NpYmxlVmFsdWVIYW5kbGVySW5wdXRMaXN0ZW5lciIsImFkZElucHV0TGlzdGVuZXIiLCJfZGlzcG9zZUFjY2Vzc2libGVTbGlkZXIiLCJyZW1vdmVJbnB1dExpc3RlbmVyIiwic3RhcnREcmFnIiwidmFsdWUiLCJkcmFnIiwiZW5kRHJhZyIsImRpc3Bvc2UiLCJfbXV0YXRvcktleXMiLCJjb25jYXQiLCJsZW5ndGgiLCJ1bmlxIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJBY2Nlc3NpYmxlU2xpZGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEEgdHJhaXQgZm9yIHN1YnR5cGVzIG9mIE5vZGUsIHVzZWQgdG8gbWFrZSB0aGUgTm9kZSBiZWhhdmUgbGlrZSBhICdzbGlkZXInIHdpdGggYXNzaXN0aXZlIHRlY2hub2xvZ3kuIFRoaXMgY291bGQgYmVcclxuICogdXNlZCBieSBhbnl0aGluZyB0aGF0IG1vdmVzIGFsb25nIGEgMS1EIGxpbmUuIEFuIGFjY2Vzc2libGUgc2xpZGVyIGJlaGF2ZXMgbGlrZTpcclxuICpcclxuICogLSBBcnJvdyBrZXlzIGluY3JlbWVudC9kZWNyZW1lbnQgdGhlIHNsaWRlciBieSBhIHNwZWNpZmllZCBzdGVwIHNpemUuXHJcbiAqIC0gSG9sZGluZyBzaGlmdCB3aXRoIGFycm93IGtleXMgd2lsbCBpbmNyZW1lbnQvZGVjcmVtZW50IGJ5IGFsdGVybmF0aXZlIHN0ZXAgc2l6ZSwgdXN1YWxseSBzbWFsbGVyIHRoYW4gZGVmYXVsdC5cclxuICogLSBQYWdlIFVwIGFuZCBQYWdlIERvd24gaW5jcmVtZW50cy9kZWNyZW1lbnRzIHZhbHVlIGJ5IGFuIGFsdGVybmF0aXZlIHN0ZXAgc2l6ZSwgdXN1YWxseSBsYXJnZXIgdGhhbiBkZWZhdWx0LlxyXG4gKiAtIEhvbWUga2V5IHNldHMgdmFsdWUgdG8gaXRzIG1pbmltdW0uXHJcbiAqIC0gRW5kIGtleSBzZXRzIHZhbHVlIHRvIGl0cyBtYXhpbXVtLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgYXNzZXJ0SGFzUHJvcGVydGllcyBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvYXNzZXJ0SGFzUHJvcGVydGllcy5qcyc7XHJcbmltcG9ydCBDb25zdHJ1Y3RvciBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvQ29uc3RydWN0b3IuanMnO1xyXG5pbXBvcnQgSW50ZW50aW9uYWxBbnkgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL0ludGVudGlvbmFsQW55LmpzJztcclxuaW1wb3J0IHsgRGVsYXllZE11dGF0ZSwgTm9kZSwgU2NlbmVyeUV2ZW50IH0gZnJvbSAnLi4vLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IHN1biBmcm9tICcuLi9zdW4uanMnO1xyXG5pbXBvcnQgQWNjZXNzaWJsZVZhbHVlSGFuZGxlciwgeyBBY2Nlc3NpYmxlVmFsdWVIYW5kbGVyT3B0aW9ucywgVEFjY2Vzc2libGVWYWx1ZUhhbmRsZXIgfSBmcm9tICcuL0FjY2Vzc2libGVWYWx1ZUhhbmRsZXIuanMnO1xyXG5cclxuY29uc3QgQUNDRVNTSUJMRV9TTElERVJfT1BUSU9OUyA9IFtcclxuICAnc3RhcnREcmFnJyxcclxuICAnZHJhZycsXHJcbiAgJ2VuZERyYWcnXHJcbl07XHJcblxyXG50eXBlIFNlbGZPcHRpb25zID0ge1xyXG5cclxuICAvLyBjYWxsZWQgd2hlbiBhIGRyYWcgc2VxdWVuY2Ugc3RhcnRzXHJcbiAgc3RhcnREcmFnPzogKCBldmVudDogU2NlbmVyeUV2ZW50ICkgPT4gdm9pZDtcclxuXHJcbiAgLy8gY2FsbGVkIGF0IHRoZSBlbmQgb2YgYSBkcmFnIGV2ZW50LCBhZnRlciB0aGUgdmFsdWVQcm9wZXJ0eSBjaGFuZ2VzXHJcbiAgZHJhZz86ICggZXZlbnQ6IFNjZW5lcnlFdmVudCApID0+IHZvaWQ7XHJcblxyXG4gIC8vIGNhbGxlZCB3aGVuIGEgZHJhZyBzZXF1ZW5jZSBlbmRzXHJcbiAgZW5kRHJhZz86ICggZXZlbnQ6IFNjZW5lcnlFdmVudCB8IG51bGwgKSA9PiB2b2lkO1xyXG59O1xyXG5cclxudHlwZSBBY2Nlc3NpYmxlU2xpZGVyT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgQWNjZXNzaWJsZVZhbHVlSGFuZGxlck9wdGlvbnM7XHJcblxyXG50eXBlIFRBY2Nlc3NpYmxlU2xpZGVyID0ge1xyXG4gIHN0YXJ0RHJhZzogKCBldmVudDogU2NlbmVyeUV2ZW50ICkgPT4gdm9pZDtcclxuICBkcmFnOiAoIGV2ZW50OiBTY2VuZXJ5RXZlbnQgKSA9PiB2b2lkO1xyXG4gIGVuZERyYWc6ICggZXZlbnQ6IFNjZW5lcnlFdmVudCB8IG51bGwgKSA9PiB2b2lkO1xyXG59ICYgVEFjY2Vzc2libGVWYWx1ZUhhbmRsZXI7XHJcblxyXG4vKipcclxuICogQHBhcmFtIFR5cGVcclxuICogQHBhcmFtIG9wdGlvbnNBcmdQb3NpdGlvbiAtIHplcm8taW5kZXhlZCBudW1iZXIgdGhhdCB0aGUgb3B0aW9ucyBhcmd1bWVudCBpcyBwcm92aWRlZCBhdCBpbiB0aGUgY29uc3RydWN0b3IgZm9yIFR5cGVcclxuICovXHJcbmNvbnN0IEFjY2Vzc2libGVTbGlkZXIgPSA8U3VwZXJUeXBlIGV4dGVuZHMgQ29uc3RydWN0b3I8Tm9kZT4+KCBUeXBlOiBTdXBlclR5cGUsIG9wdGlvbnNBcmdQb3NpdGlvbjogbnVtYmVyICk6IFN1cGVyVHlwZSAmIENvbnN0cnVjdG9yPFRBY2Nlc3NpYmxlU2xpZGVyPiA9PiB7XHJcbiAgY29uc3QgQWNjZXNzaWJsZVNsaWRlckNsYXNzID0gRGVsYXllZE11dGF0ZSggJ0FjY2Vzc2libGVTbGlkZXInLCBBQ0NFU1NJQkxFX1NMSURFUl9PUFRJT05TLFxyXG4gICAgY2xhc3MgQWNjZXNzaWJsZVNsaWRlciBleHRlbmRzIEFjY2Vzc2libGVWYWx1ZUhhbmRsZXIoIFR5cGUsIG9wdGlvbnNBcmdQb3NpdGlvbiApIGltcGxlbWVudHMgVEFjY2Vzc2libGVTbGlkZXIge1xyXG5cclxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfZGlzcG9zZUFjY2Vzc2libGVTbGlkZXI6ICgpID0+IHZvaWQ7XHJcblxyXG4gICAgICBwcml2YXRlIF9zdGFydERyYWc6ICggZXZlbnQ6IFNjZW5lcnlFdmVudCApID0+IHZvaWQgPSBfLm5vb3A7XHJcbiAgICAgIHByaXZhdGUgX2RyYWc6ICggZXZlbnQ6IFNjZW5lcnlFdmVudCApID0+IHZvaWQgPSBfLm5vb3A7XHJcbiAgICAgIHByaXZhdGUgX2VuZERyYWc6ICggZXZlbnQ6IFNjZW5lcnlFdmVudCB8IG51bGwgKSA9PiB2b2lkID0gXy5ub29wO1xyXG5cclxuICAgICAgcHVibGljIGNvbnN0cnVjdG9yKCAuLi5hcmdzOiBJbnRlbnRpb25hbEFueVtdICkge1xyXG5cclxuICAgICAgICBjb25zdCBwcm92aWRlZE9wdGlvbnMgPSBhcmdzWyBvcHRpb25zQXJnUG9zaXRpb24gXSBhcyBBY2Nlc3NpYmxlU2xpZGVyT3B0aW9ucztcclxuXHJcbiAgICAgICAgYXNzZXJ0ICYmIHByb3ZpZGVkT3B0aW9ucyAmJiBhc3NlcnQoIE9iamVjdC5nZXRQcm90b3R5cGVPZiggcHJvdmlkZWRPcHRpb25zICkgPT09IE9iamVjdC5wcm90b3R5cGUsXHJcbiAgICAgICAgICAnRXh0cmEgcHJvdG90eXBlIG9uIEFjY2Vzc2libGVTbGlkZXIgb3B0aW9ucyBvYmplY3QgaXMgYSBjb2RlIHNtZWxsIChvciBwcm9iYWJseSBhIGJ1ZyknICk7XHJcblxyXG4gICAgICAgIC8vIEFjY2Vzc2libGVTbGlkZXIgdXNlcyAnZHJhZycgdGVybWlub2xvZ3kgcmF0aGVyIHRoYW4gJ2NoYW5nZScgZm9yIGNvbnNpc3RlbmN5IHdpdGggU2xpZGVyXHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggcHJvdmlkZWRPcHRpb25zLnN0YXJ0SW5wdXQgPT09IHVuZGVmaW5lZCwgJ0FjY2Vzc2libGVTbGlkZXIgc2V0cyBzdGFydElucHV0IHRocm91Z2ggb3B0aW9ucy5zdGFydERyYWcnICk7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggcHJvdmlkZWRPcHRpb25zLmVuZElucHV0ID09PSB1bmRlZmluZWQsICdBY2Nlc3NpYmxlU2xpZGVyIHNldHMgZW5kSW5wdXQgdGhyb3VnaCBvcHRpb25zLmVuZERyYWcnICk7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggcHJvdmlkZWRPcHRpb25zLm9uSW5wdXQgPT09IHVuZGVmaW5lZCwgJ0FjY2Vzc2libGVTbGlkZXIgc2V0cyBvbklucHV0IHRocm91Z2ggb3B0aW9ucy5kcmFnJyApO1xyXG5cclxuICAgICAgICBzdXBlciggLi4uYXJncyApO1xyXG5cclxuICAgICAgICAvLyBtZW1iZXJzIG9mIHRoZSBOb2RlIEFQSSB0aGF0IGFyZSB1c2VkIGJ5IHRoaXMgdHJhaXRcclxuICAgICAgICBhc3NlcnRIYXNQcm9wZXJ0aWVzKCB0aGlzLCBbICdhZGRJbnB1dExpc3RlbmVyJywgJ3JlbW92ZUlucHV0TGlzdGVuZXInIF0gKTtcclxuXHJcbiAgICAgICAgLy8gaGFuZGxlIGFsbCBhY2Nlc3NpYmxlIGV2ZW50IGlucHV0XHJcbiAgICAgICAgY29uc3QgYWNjZXNzaWJsZUlucHV0TGlzdGVuZXIgPSB0aGlzLmdldEFjY2Vzc2libGVWYWx1ZUhhbmRsZXJJbnB1dExpc3RlbmVyKCk7XHJcbiAgICAgICAgdGhpcy5hZGRJbnB1dExpc3RlbmVyKCBhY2Nlc3NpYmxlSW5wdXRMaXN0ZW5lciApO1xyXG5cclxuICAgICAgICAvLyBjYWxsZWQgYnkgZGlzcG9zZUFjY2Vzc2libGVTbGlkZXIgdG8gcHJldmVudCBtZW1vcnkgbGVha3NcclxuICAgICAgICB0aGlzLl9kaXNwb3NlQWNjZXNzaWJsZVNsaWRlciA9ICgpID0+IHtcclxuICAgICAgICAgIHRoaXMucmVtb3ZlSW5wdXRMaXN0ZW5lciggYWNjZXNzaWJsZUlucHV0TGlzdGVuZXIgKTtcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwdWJsaWMgc2V0IHN0YXJ0RHJhZyggdmFsdWU6ICggZXZlbnQ6IFNjZW5lcnlFdmVudCApID0+IHZvaWQgKSB7XHJcbiAgICAgICAgdGhpcy5fc3RhcnREcmFnID0gdmFsdWU7XHJcblxyXG4gICAgICAgIC8vIEFsc28gKHVuZm9ydHVuYXRlbHkpIGZvcndhcmRpbmcgdG8gdGhlIHN0YXJ0SW5wdXRcclxuICAgICAgICB0aGlzLnN0YXJ0SW5wdXQgPSB2YWx1ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcHVibGljIGdldCBzdGFydERyYWcoKTogKCBldmVudDogU2NlbmVyeUV2ZW50ICkgPT4gdm9pZCB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXJ0RHJhZztcclxuICAgICAgfVxyXG5cclxuICAgICAgcHVibGljIHNldCBkcmFnKCB2YWx1ZTogKCBldmVudDogU2NlbmVyeUV2ZW50ICkgPT4gdm9pZCApIHtcclxuICAgICAgICB0aGlzLl9kcmFnID0gdmFsdWU7XHJcblxyXG4gICAgICAgIC8vIEFsc28gKHVuZm9ydHVuYXRlbHkpIGZvcndhcmRpbmcgdG8gdGhlIG9uSW5wdXRcclxuICAgICAgICB0aGlzLm9uSW5wdXQgPSB2YWx1ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcHVibGljIGdldCBkcmFnKCk6ICggZXZlbnQ6IFNjZW5lcnlFdmVudCApID0+IHZvaWQge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kcmFnO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwdWJsaWMgc2V0IGVuZERyYWcoIHZhbHVlOiAoIGV2ZW50OiBTY2VuZXJ5RXZlbnQgfCBudWxsICkgPT4gdm9pZCApIHtcclxuICAgICAgICB0aGlzLl9lbmREcmFnID0gdmFsdWU7XHJcblxyXG4gICAgICAgIC8vIEFsc28gKHVuZm9ydHVuYXRlbHkpIGZvcndhcmRpbmcgdG8gdGhlIGVuZElucHV0XHJcbiAgICAgICAgdGhpcy5lbmRJbnB1dCA9IHZhbHVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwdWJsaWMgZ2V0IGVuZERyYWcoKTogKCBldmVudDogU2NlbmVyeUV2ZW50IHwgbnVsbCApID0+IHZvaWQge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9lbmREcmFnO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogTWFrZSB0aGUgYWNjZXNzaWJsZSBzbGlkZXIgcG9ydGlvbnMgb2YgdGhpcyBub2RlIGVsaWdpYmxlIGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uIENhbGwgd2hlbiBkaXNwb3NpbmdcclxuICAgICAgICogdGhlIHR5cGUgdGhhdCB0aGlzIHRyYWl0IGlzIG1peGVkIGludG8uXHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLl9kaXNwb3NlQWNjZXNzaWJsZVNsaWRlcigpO1xyXG5cclxuICAgICAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgLyoqXHJcbiAgICoge0FycmF5LjxzdHJpbmc+fSAtIFN0cmluZyBrZXlzIGZvciBhbGwgdGhlIGFsbG93ZWQgb3B0aW9ucyB0aGF0IHdpbGwgYmUgc2V0IGJ5IE5vZGUubXV0YXRlKCBvcHRpb25zICksIGluXHJcbiAgICogdGhlIG9yZGVyIHRoZXkgd2lsbCBiZSBldmFsdWF0ZWQuXHJcbiAgICpcclxuICAgKiBOT1RFOiBTZWUgTm9kZSdzIF9tdXRhdG9yS2V5cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uIG9uIGhvdyB0aGlzIG9wZXJhdGVzLCBhbmQgcG90ZW50aWFsIHNwZWNpYWxcclxuICAgKiAgICAgICBjYXNlcyB0aGF0IG1heSBhcHBseS5cclxuICAgKi9cclxuICBBY2Nlc3NpYmxlU2xpZGVyQ2xhc3MucHJvdG90eXBlLl9tdXRhdG9yS2V5cyA9IEFDQ0VTU0lCTEVfU0xJREVSX09QVElPTlMuY29uY2F0KCBBY2Nlc3NpYmxlU2xpZGVyQ2xhc3MucHJvdG90eXBlLl9tdXRhdG9yS2V5cyApO1xyXG5cclxuICBhc3NlcnQgJiYgYXNzZXJ0KCBBY2Nlc3NpYmxlU2xpZGVyQ2xhc3MucHJvdG90eXBlLl9tdXRhdG9yS2V5cy5sZW5ndGggPT09IF8udW5pcSggQWNjZXNzaWJsZVNsaWRlckNsYXNzLnByb3RvdHlwZS5fbXV0YXRvcktleXMgKS5sZW5ndGgsICdkdXBsaWNhdGUgbXV0YXRvciBrZXlzIGluIEFjY2Vzc2libGVTbGlkZXInICk7XHJcblxyXG4gIHJldHVybiBBY2Nlc3NpYmxlU2xpZGVyQ2xhc3M7XHJcbn07XHJcblxyXG5zdW4ucmVnaXN0ZXIoICdBY2Nlc3NpYmxlU2xpZGVyJywgQWNjZXNzaWJsZVNsaWRlciApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgQWNjZXNzaWJsZVNsaWRlcjtcclxuZXhwb3J0IHR5cGUgeyBBY2Nlc3NpYmxlU2xpZGVyT3B0aW9ucyB9OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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