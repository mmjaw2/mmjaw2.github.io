// Copyright 2017-2024, University of Colorado Boulder

/**
 * A scenery-internal type for tracking what currently has focus in Display. If a focused Node is shared between
 * two Displays, it is possible that only one Node may have focus between the two displays. This is especially
 * true for DOM focus since only one element can have DOM focus at a time.
 *
 * @author Jesse Greenberg
 */

import ArrayIO from '../../../tandem/js/types/ArrayIO.js';
import IOType from '../../../tandem/js/types/IOType.js';
import StringIO from '../../../tandem/js/types/StringIO.js';
import { scenery } from '../imports.js';
class Focus {
  // The trail to the focused Node.

  // The Display containing the Trail to the focused Node.

  static FocusIO = new IOType('FocusIO', {
    valueType: Focus,
    documentation: 'A PhET-iO Type for the instance in the simulation which currently has keyboard focus. FocusIO is ' + 'serialized into and Object with key `focusedPhetioElement` that is a list of PhET-iO Elements, ' + 'from parent-most to child-most corresponding to the PhET-iO Element that was instrumented.',
    toStateObject: focus => {
      const phetioIDs = [];
      focus.trail.nodes.forEach((node, i) => {
        // If the node was PhET-iO instrumented, include its phetioID instead of its index (because phetioID is more stable)
        if (node.isPhetioInstrumented()) {
          phetioIDs.push(node.tandem.phetioID);
        }
      });
      return {
        focusedPhetioElement: phetioIDs
      };
    },
    stateSchema: {
      focusedPhetioElement: ArrayIO(StringIO)
    }
  });
  constructor(display, trail) {
    this.display = display;
    this.trail = trail;
  }
}
scenery.register('Focus', Focus);
export default Focus;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJBcnJheUlPIiwiSU9UeXBlIiwiU3RyaW5nSU8iLCJzY2VuZXJ5IiwiRm9jdXMiLCJGb2N1c0lPIiwidmFsdWVUeXBlIiwiZG9jdW1lbnRhdGlvbiIsInRvU3RhdGVPYmplY3QiLCJmb2N1cyIsInBoZXRpb0lEcyIsInRyYWlsIiwibm9kZXMiLCJmb3JFYWNoIiwibm9kZSIsImkiLCJpc1BoZXRpb0luc3RydW1lbnRlZCIsInB1c2giLCJ0YW5kZW0iLCJwaGV0aW9JRCIsImZvY3VzZWRQaGV0aW9FbGVtZW50Iiwic3RhdGVTY2hlbWEiLCJjb25zdHJ1Y3RvciIsImRpc3BsYXkiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkZvY3VzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEEgc2NlbmVyeS1pbnRlcm5hbCB0eXBlIGZvciB0cmFja2luZyB3aGF0IGN1cnJlbnRseSBoYXMgZm9jdXMgaW4gRGlzcGxheS4gSWYgYSBmb2N1c2VkIE5vZGUgaXMgc2hhcmVkIGJldHdlZW5cclxuICogdHdvIERpc3BsYXlzLCBpdCBpcyBwb3NzaWJsZSB0aGF0IG9ubHkgb25lIE5vZGUgbWF5IGhhdmUgZm9jdXMgYmV0d2VlbiB0aGUgdHdvIGRpc3BsYXlzLiBUaGlzIGlzIGVzcGVjaWFsbHlcclxuICogdHJ1ZSBmb3IgRE9NIGZvY3VzIHNpbmNlIG9ubHkgb25lIGVsZW1lbnQgY2FuIGhhdmUgRE9NIGZvY3VzIGF0IGEgdGltZS5cclxuICpcclxuICogQGF1dGhvciBKZXNzZSBHcmVlbmJlcmdcclxuICovXHJcblxyXG5pbXBvcnQgQXJyYXlJTyBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvdHlwZXMvQXJyYXlJTy5qcyc7XHJcbmltcG9ydCBJT1R5cGUgZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL3R5cGVzL0lPVHlwZS5qcyc7XHJcbmltcG9ydCBTdHJpbmdJTyBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvdHlwZXMvU3RyaW5nSU8uanMnO1xyXG5pbXBvcnQgeyBEaXNwbGF5LCBzY2VuZXJ5LCBUcmFpbCB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5cclxudHlwZSBGb2N1c1N0YXRlVHlwZSA9IHtcclxuICBmb2N1c2VkUGhldGlvRWxlbWVudDogc3RyaW5nW107XHJcbn07XHJcblxyXG5jbGFzcyBGb2N1cyB7XHJcblxyXG4gIC8vIFRoZSB0cmFpbCB0byB0aGUgZm9jdXNlZCBOb2RlLlxyXG4gIHB1YmxpYyByZWFkb25seSB0cmFpbDogVHJhaWw7XHJcblxyXG4gIC8vIFRoZSBEaXNwbGF5IGNvbnRhaW5pbmcgdGhlIFRyYWlsIHRvIHRoZSBmb2N1c2VkIE5vZGUuXHJcbiAgcHVibGljIHJlYWRvbmx5IGRpc3BsYXk6IERpc3BsYXk7XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgRm9jdXNJTyA9IG5ldyBJT1R5cGU8Rm9jdXMsIEZvY3VzU3RhdGVUeXBlPiggJ0ZvY3VzSU8nLCB7XHJcbiAgICB2YWx1ZVR5cGU6IEZvY3VzLFxyXG4gICAgZG9jdW1lbnRhdGlvbjogJ0EgUGhFVC1pTyBUeXBlIGZvciB0aGUgaW5zdGFuY2UgaW4gdGhlIHNpbXVsYXRpb24gd2hpY2ggY3VycmVudGx5IGhhcyBrZXlib2FyZCBmb2N1cy4gRm9jdXNJTyBpcyAnICtcclxuICAgICAgICAgICAgICAgICAgICdzZXJpYWxpemVkIGludG8gYW5kIE9iamVjdCB3aXRoIGtleSBgZm9jdXNlZFBoZXRpb0VsZW1lbnRgIHRoYXQgaXMgYSBsaXN0IG9mIFBoRVQtaU8gRWxlbWVudHMsICcgK1xyXG4gICAgICAgICAgICAgICAgICAgJ2Zyb20gcGFyZW50LW1vc3QgdG8gY2hpbGQtbW9zdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBQaEVULWlPIEVsZW1lbnQgdGhhdCB3YXMgaW5zdHJ1bWVudGVkLicsXHJcbiAgICB0b1N0YXRlT2JqZWN0OiAoIGZvY3VzOiBGb2N1cyApID0+IHtcclxuICAgICAgY29uc3QgcGhldGlvSURzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICBmb2N1cy50cmFpbC5ub2Rlcy5mb3JFYWNoKCAoIG5vZGUsIGkgKSA9PiB7XHJcblxyXG4gICAgICAgIC8vIElmIHRoZSBub2RlIHdhcyBQaEVULWlPIGluc3RydW1lbnRlZCwgaW5jbHVkZSBpdHMgcGhldGlvSUQgaW5zdGVhZCBvZiBpdHMgaW5kZXggKGJlY2F1c2UgcGhldGlvSUQgaXMgbW9yZSBzdGFibGUpXHJcbiAgICAgICAgaWYgKCBub2RlLmlzUGhldGlvSW5zdHJ1bWVudGVkKCkgKSB7XHJcbiAgICAgICAgICBwaGV0aW9JRHMucHVzaCggbm9kZS50YW5kZW0ucGhldGlvSUQgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgZm9jdXNlZFBoZXRpb0VsZW1lbnQ6IHBoZXRpb0lEc1xyXG4gICAgICB9O1xyXG4gICAgfSxcclxuICAgIHN0YXRlU2NoZW1hOiB7XHJcbiAgICAgIGZvY3VzZWRQaGV0aW9FbGVtZW50OiBBcnJheUlPKCBTdHJpbmdJTyApXHJcbiAgICB9XHJcbiAgfSApO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIGRpc3BsYXk6IERpc3BsYXksIHRyYWlsOiBUcmFpbCApIHtcclxuICAgIHRoaXMuZGlzcGxheSA9IGRpc3BsYXk7XHJcbiAgICB0aGlzLnRyYWlsID0gdHJhaWw7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnRm9jdXMnLCBGb2N1cyApO1xyXG5leHBvcnQgZGVmYXVsdCBGb2N1czsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLE9BQU8sTUFBTSxxQ0FBcUM7QUFDekQsT0FBT0MsTUFBTSxNQUFNLG9DQUFvQztBQUN2RCxPQUFPQyxRQUFRLE1BQU0sc0NBQXNDO0FBQzNELFNBQWtCQyxPQUFPLFFBQWUsZUFBZTtBQU12RCxNQUFNQyxLQUFLLENBQUM7RUFFVjs7RUFHQTs7RUFHQSxPQUF1QkMsT0FBTyxHQUFHLElBQUlKLE1BQU0sQ0FBeUIsU0FBUyxFQUFFO0lBQzdFSyxTQUFTLEVBQUVGLEtBQUs7SUFDaEJHLGFBQWEsRUFBRSxtR0FBbUcsR0FDbkcsaUdBQWlHLEdBQ2pHLDRGQUE0RjtJQUMzR0MsYUFBYSxFQUFJQyxLQUFZLElBQU07TUFDakMsTUFBTUMsU0FBbUIsR0FBRyxFQUFFO01BQzlCRCxLQUFLLENBQUNFLEtBQUssQ0FBQ0MsS0FBSyxDQUFDQyxPQUFPLENBQUUsQ0FBRUMsSUFBSSxFQUFFQyxDQUFDLEtBQU07UUFFeEM7UUFDQSxJQUFLRCxJQUFJLENBQUNFLG9CQUFvQixDQUFDLENBQUMsRUFBRztVQUNqQ04sU0FBUyxDQUFDTyxJQUFJLENBQUVILElBQUksQ0FBQ0ksTUFBTSxDQUFDQyxRQUFTLENBQUM7UUFDeEM7TUFDRixDQUFFLENBQUM7TUFFSCxPQUFPO1FBQ0xDLG9CQUFvQixFQUFFVjtNQUN4QixDQUFDO0lBQ0gsQ0FBQztJQUNEVyxXQUFXLEVBQUU7TUFDWEQsb0JBQW9CLEVBQUVwQixPQUFPLENBQUVFLFFBQVM7SUFDMUM7RUFDRixDQUFFLENBQUM7RUFFSW9CLFdBQVdBLENBQUVDLE9BQWdCLEVBQUVaLEtBQVksRUFBRztJQUNuRCxJQUFJLENBQUNZLE9BQU8sR0FBR0EsT0FBTztJQUN0QixJQUFJLENBQUNaLEtBQUssR0FBR0EsS0FBSztFQUNwQjtBQUNGO0FBRUFSLE9BQU8sQ0FBQ3FCLFFBQVEsQ0FBRSxPQUFPLEVBQUVwQixLQUFNLENBQUM7QUFDbEMsZUFBZUEsS0FBSyIsImlnbm9yZUxpc3QiOltdfQ==