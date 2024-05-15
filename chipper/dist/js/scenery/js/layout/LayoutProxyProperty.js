// Copyright 2022-2024, University of Colorado Boulder

/**
 * A Property that takes the value of:
 * - a LayoutProxy with the single connected Trail (if it exists)
 * - null if there are zero or 2+ connected Trails between the two Nodes
 *
 * When defined, this will provide a LayoutProxy for the leafNode within the rootNode's local coordinate frame. This
 * will allow positioning the leafNode within the rootNode's coordinate frame (which is ONLY well-defined when there
 * is exactly one trail between the two).
 *
 * Thus, it will only be defined as a proxy if there is a unique trail between the two Nodes. This is needed for layout
 * work, where often we'll need to provide a proxy IF this condition is true, and NO proxy if it's not (since layout
 * would be ambiguous). E.g. for ManualConstraint, if a Node isn't connected to the root, there's nothing the constraint
 * can do.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { DerivedProperty1 } from '../../../axon/js/DerivedProperty.js';
import { LayoutProxy, scenery, TrailsBetweenProperty, TransformTracker } from '../imports.js';
export default class LayoutProxyProperty extends DerivedProperty1 {
  // This will contain the number of trails connecting our rootNode and leafNode. Our value will be solely based off of
  // this Property's value, and is thus created as a DerivedProperty.

  // Should be set if we provide an onTransformChange callback
  transformTracker = null;

  /**
   * @param rootNode - The root whose local coordinate frame we'll want the proxy to be in
   * @param leafNode - The leaf that we'll create the proxy for
   * @param providedOptions
   */
  constructor(rootNode, leafNode, providedOptions) {
    const trailsBetweenProperty = new TrailsBetweenProperty(rootNode, leafNode);
    super([trailsBetweenProperty], trails => {
      return trails.length === 1 ? LayoutProxy.pool.create(trails[0].copy().removeAncestor()) : null;
    });
    this.trailsBetweenProperty = trailsBetweenProperty;
    this.lazyLink((value, oldValue) => {
      oldValue && oldValue.dispose();
    });
    const onTransformChange = providedOptions?.onTransformChange;
    if (onTransformChange) {
      this.link(proxy => {
        if (this.transformTracker) {
          this.transformTracker.dispose();
          this.transformTracker = null;
        }
        if (proxy) {
          this.transformTracker = new TransformTracker(proxy.trail.copy().addAncestor(rootNode));
          this.transformTracker.addListener(onTransformChange);
        }
      });
    }
  }
  dispose() {
    this.trailsBetweenProperty.dispose();
    this.transformTracker && this.transformTracker.dispose();
    super.dispose();
  }
}
scenery.register('LayoutProxyProperty', LayoutProxyProperty);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJEZXJpdmVkUHJvcGVydHkxIiwiTGF5b3V0UHJveHkiLCJzY2VuZXJ5IiwiVHJhaWxzQmV0d2VlblByb3BlcnR5IiwiVHJhbnNmb3JtVHJhY2tlciIsIkxheW91dFByb3h5UHJvcGVydHkiLCJ0cmFuc2Zvcm1UcmFja2VyIiwiY29uc3RydWN0b3IiLCJyb290Tm9kZSIsImxlYWZOb2RlIiwicHJvdmlkZWRPcHRpb25zIiwidHJhaWxzQmV0d2VlblByb3BlcnR5IiwidHJhaWxzIiwibGVuZ3RoIiwicG9vbCIsImNyZWF0ZSIsImNvcHkiLCJyZW1vdmVBbmNlc3RvciIsImxhenlMaW5rIiwidmFsdWUiLCJvbGRWYWx1ZSIsImRpc3Bvc2UiLCJvblRyYW5zZm9ybUNoYW5nZSIsImxpbmsiLCJwcm94eSIsInRyYWlsIiwiYWRkQW5jZXN0b3IiLCJhZGRMaXN0ZW5lciIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiTGF5b3V0UHJveHlQcm9wZXJ0eS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBIFByb3BlcnR5IHRoYXQgdGFrZXMgdGhlIHZhbHVlIG9mOlxyXG4gKiAtIGEgTGF5b3V0UHJveHkgd2l0aCB0aGUgc2luZ2xlIGNvbm5lY3RlZCBUcmFpbCAoaWYgaXQgZXhpc3RzKVxyXG4gKiAtIG51bGwgaWYgdGhlcmUgYXJlIHplcm8gb3IgMisgY29ubmVjdGVkIFRyYWlscyBiZXR3ZWVuIHRoZSB0d28gTm9kZXNcclxuICpcclxuICogV2hlbiBkZWZpbmVkLCB0aGlzIHdpbGwgcHJvdmlkZSBhIExheW91dFByb3h5IGZvciB0aGUgbGVhZk5vZGUgd2l0aGluIHRoZSByb290Tm9kZSdzIGxvY2FsIGNvb3JkaW5hdGUgZnJhbWUuIFRoaXNcclxuICogd2lsbCBhbGxvdyBwb3NpdGlvbmluZyB0aGUgbGVhZk5vZGUgd2l0aGluIHRoZSByb290Tm9kZSdzIGNvb3JkaW5hdGUgZnJhbWUgKHdoaWNoIGlzIE9OTFkgd2VsbC1kZWZpbmVkIHdoZW4gdGhlcmVcclxuICogaXMgZXhhY3RseSBvbmUgdHJhaWwgYmV0d2VlbiB0aGUgdHdvKS5cclxuICpcclxuICogVGh1cywgaXQgd2lsbCBvbmx5IGJlIGRlZmluZWQgYXMgYSBwcm94eSBpZiB0aGVyZSBpcyBhIHVuaXF1ZSB0cmFpbCBiZXR3ZWVuIHRoZSB0d28gTm9kZXMuIFRoaXMgaXMgbmVlZGVkIGZvciBsYXlvdXRcclxuICogd29yaywgd2hlcmUgb2Z0ZW4gd2UnbGwgbmVlZCB0byBwcm92aWRlIGEgcHJveHkgSUYgdGhpcyBjb25kaXRpb24gaXMgdHJ1ZSwgYW5kIE5PIHByb3h5IGlmIGl0J3Mgbm90IChzaW5jZSBsYXlvdXRcclxuICogd291bGQgYmUgYW1iaWd1b3VzKS4gRS5nLiBmb3IgTWFudWFsQ29uc3RyYWludCwgaWYgYSBOb2RlIGlzbid0IGNvbm5lY3RlZCB0byB0aGUgcm9vdCwgdGhlcmUncyBub3RoaW5nIHRoZSBjb25zdHJhaW50XHJcbiAqIGNhbiBkby5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCB7IERlcml2ZWRQcm9wZXJ0eTEgfSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL0Rlcml2ZWRQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCB7IExheW91dFByb3h5LCBOb2RlLCBzY2VuZXJ5LCBUcmFpbCwgVHJhaWxzQmV0d2VlblByb3BlcnR5LCBUcmFuc2Zvcm1UcmFja2VyIH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcblxyXG50eXBlIFNlbGZPcHRpb25zID0ge1xyXG4gIC8vIElmIHByb3ZpZGVkLCB0aGlzIHdpbGwgYmUgY2FsbGVkIHdoZW4gdGhlIHRyYW5zZm9ybSBvZiB0aGUgcHJveHkgY2hhbmdlc1xyXG4gIG9uVHJhbnNmb3JtQ2hhbmdlPzogKCkgPT4gdm9pZDtcclxufTtcclxuXHJcbmV4cG9ydCB0eXBlIExheW91dFByb3h5UHJvcGVydHlPcHRpb25zID0gU2VsZk9wdGlvbnM7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMYXlvdXRQcm94eVByb3BlcnR5IGV4dGVuZHMgRGVyaXZlZFByb3BlcnR5MTxMYXlvdXRQcm94eSB8IG51bGwsIFRyYWlsW10+IHtcclxuXHJcbiAgLy8gVGhpcyB3aWxsIGNvbnRhaW4gdGhlIG51bWJlciBvZiB0cmFpbHMgY29ubmVjdGluZyBvdXIgcm9vdE5vZGUgYW5kIGxlYWZOb2RlLiBPdXIgdmFsdWUgd2lsbCBiZSBzb2xlbHkgYmFzZWQgb2ZmIG9mXHJcbiAgLy8gdGhpcyBQcm9wZXJ0eSdzIHZhbHVlLCBhbmQgaXMgdGh1cyBjcmVhdGVkIGFzIGEgRGVyaXZlZFByb3BlcnR5LlxyXG4gIHByaXZhdGUgcmVhZG9ubHkgdHJhaWxzQmV0d2VlblByb3BlcnR5OiBUcmFpbHNCZXR3ZWVuUHJvcGVydHk7XHJcblxyXG4gIC8vIFNob3VsZCBiZSBzZXQgaWYgd2UgcHJvdmlkZSBhbiBvblRyYW5zZm9ybUNoYW5nZSBjYWxsYmFja1xyXG4gIHByaXZhdGUgdHJhbnNmb3JtVHJhY2tlcjogVHJhbnNmb3JtVHJhY2tlciB8IG51bGwgPSBudWxsO1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gcm9vdE5vZGUgLSBUaGUgcm9vdCB3aG9zZSBsb2NhbCBjb29yZGluYXRlIGZyYW1lIHdlJ2xsIHdhbnQgdGhlIHByb3h5IHRvIGJlIGluXHJcbiAgICogQHBhcmFtIGxlYWZOb2RlIC0gVGhlIGxlYWYgdGhhdCB3ZSdsbCBjcmVhdGUgdGhlIHByb3h5IGZvclxyXG4gICAqIEBwYXJhbSBwcm92aWRlZE9wdGlvbnNcclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHJvb3ROb2RlOiBOb2RlLCBsZWFmTm9kZTogTm9kZSwgcHJvdmlkZWRPcHRpb25zPzogTGF5b3V0UHJveHlQcm9wZXJ0eU9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3QgdHJhaWxzQmV0d2VlblByb3BlcnR5ID0gbmV3IFRyYWlsc0JldHdlZW5Qcm9wZXJ0eSggcm9vdE5vZGUsIGxlYWZOb2RlICk7XHJcblxyXG4gICAgc3VwZXIoIFsgdHJhaWxzQmV0d2VlblByb3BlcnR5IF0sIHRyYWlscyA9PiB7XHJcbiAgICAgIHJldHVybiB0cmFpbHMubGVuZ3RoID09PSAxID8gTGF5b3V0UHJveHkucG9vbC5jcmVhdGUoIHRyYWlsc1sgMCBdLmNvcHkoKS5yZW1vdmVBbmNlc3RvcigpICkgOiBudWxsO1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMudHJhaWxzQmV0d2VlblByb3BlcnR5ID0gdHJhaWxzQmV0d2VlblByb3BlcnR5O1xyXG4gICAgdGhpcy5sYXp5TGluayggKCB2YWx1ZSwgb2xkVmFsdWUgKSA9PiB7XHJcbiAgICAgIG9sZFZhbHVlICYmIG9sZFZhbHVlLmRpc3Bvc2UoKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICBjb25zdCBvblRyYW5zZm9ybUNoYW5nZSA9IHByb3ZpZGVkT3B0aW9ucz8ub25UcmFuc2Zvcm1DaGFuZ2U7XHJcbiAgICBpZiAoIG9uVHJhbnNmb3JtQ2hhbmdlICkge1xyXG4gICAgICB0aGlzLmxpbmsoIHByb3h5ID0+IHtcclxuICAgICAgICBpZiAoIHRoaXMudHJhbnNmb3JtVHJhY2tlciApIHtcclxuICAgICAgICAgIHRoaXMudHJhbnNmb3JtVHJhY2tlci5kaXNwb3NlKCk7XHJcbiAgICAgICAgICB0aGlzLnRyYW5zZm9ybVRyYWNrZXIgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIHByb3h5ICkge1xyXG4gICAgICAgICAgdGhpcy50cmFuc2Zvcm1UcmFja2VyID0gbmV3IFRyYW5zZm9ybVRyYWNrZXIoIHByb3h5LnRyYWlsIS5jb3B5KCkuYWRkQW5jZXN0b3IoIHJvb3ROb2RlICkgKTtcclxuICAgICAgICAgIHRoaXMudHJhbnNmb3JtVHJhY2tlci5hZGRMaXN0ZW5lciggb25UcmFuc2Zvcm1DaGFuZ2UgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy50cmFpbHNCZXR3ZWVuUHJvcGVydHkuZGlzcG9zZSgpO1xyXG4gICAgdGhpcy50cmFuc2Zvcm1UcmFja2VyICYmIHRoaXMudHJhbnNmb3JtVHJhY2tlci5kaXNwb3NlKCk7XHJcblxyXG4gICAgc3VwZXIuZGlzcG9zZSgpO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ0xheW91dFByb3h5UHJvcGVydHknLCBMYXlvdXRQcm94eVByb3BlcnR5ICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxTQUFTQSxnQkFBZ0IsUUFBUSxxQ0FBcUM7QUFDdEUsU0FBU0MsV0FBVyxFQUFRQyxPQUFPLEVBQVNDLHFCQUFxQixFQUFFQyxnQkFBZ0IsUUFBUSxlQUFlO0FBUzFHLGVBQWUsTUFBTUMsbUJBQW1CLFNBQVNMLGdCQUFnQixDQUE4QjtFQUU3RjtFQUNBOztFQUdBO0VBQ1FNLGdCQUFnQixHQUE0QixJQUFJOztFQUV4RDtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ1NDLFdBQVdBLENBQUVDLFFBQWMsRUFBRUMsUUFBYyxFQUFFQyxlQUE0QyxFQUFHO0lBRWpHLE1BQU1DLHFCQUFxQixHQUFHLElBQUlSLHFCQUFxQixDQUFFSyxRQUFRLEVBQUVDLFFBQVMsQ0FBQztJQUU3RSxLQUFLLENBQUUsQ0FBRUUscUJBQXFCLENBQUUsRUFBRUMsTUFBTSxJQUFJO01BQzFDLE9BQU9BLE1BQU0sQ0FBQ0MsTUFBTSxLQUFLLENBQUMsR0FBR1osV0FBVyxDQUFDYSxJQUFJLENBQUNDLE1BQU0sQ0FBRUgsTUFBTSxDQUFFLENBQUMsQ0FBRSxDQUFDSSxJQUFJLENBQUMsQ0FBQyxDQUFDQyxjQUFjLENBQUMsQ0FBRSxDQUFDLEdBQUcsSUFBSTtJQUNwRyxDQUFFLENBQUM7SUFFSCxJQUFJLENBQUNOLHFCQUFxQixHQUFHQSxxQkFBcUI7SUFDbEQsSUFBSSxDQUFDTyxRQUFRLENBQUUsQ0FBRUMsS0FBSyxFQUFFQyxRQUFRLEtBQU07TUFDcENBLFFBQVEsSUFBSUEsUUFBUSxDQUFDQyxPQUFPLENBQUMsQ0FBQztJQUNoQyxDQUFFLENBQUM7SUFFSCxNQUFNQyxpQkFBaUIsR0FBR1osZUFBZSxFQUFFWSxpQkFBaUI7SUFDNUQsSUFBS0EsaUJBQWlCLEVBQUc7TUFDdkIsSUFBSSxDQUFDQyxJQUFJLENBQUVDLEtBQUssSUFBSTtRQUNsQixJQUFLLElBQUksQ0FBQ2xCLGdCQUFnQixFQUFHO1VBQzNCLElBQUksQ0FBQ0EsZ0JBQWdCLENBQUNlLE9BQU8sQ0FBQyxDQUFDO1VBQy9CLElBQUksQ0FBQ2YsZ0JBQWdCLEdBQUcsSUFBSTtRQUM5QjtRQUNBLElBQUtrQixLQUFLLEVBQUc7VUFDWCxJQUFJLENBQUNsQixnQkFBZ0IsR0FBRyxJQUFJRixnQkFBZ0IsQ0FBRW9CLEtBQUssQ0FBQ0MsS0FBSyxDQUFFVCxJQUFJLENBQUMsQ0FBQyxDQUFDVSxXQUFXLENBQUVsQixRQUFTLENBQUUsQ0FBQztVQUMzRixJQUFJLENBQUNGLGdCQUFnQixDQUFDcUIsV0FBVyxDQUFFTCxpQkFBa0IsQ0FBQztRQUN4RDtNQUNGLENBQUUsQ0FBQztJQUNMO0VBQ0Y7RUFFZ0JELE9BQU9BLENBQUEsRUFBUztJQUM5QixJQUFJLENBQUNWLHFCQUFxQixDQUFDVSxPQUFPLENBQUMsQ0FBQztJQUNwQyxJQUFJLENBQUNmLGdCQUFnQixJQUFJLElBQUksQ0FBQ0EsZ0JBQWdCLENBQUNlLE9BQU8sQ0FBQyxDQUFDO0lBRXhELEtBQUssQ0FBQ0EsT0FBTyxDQUFDLENBQUM7RUFDakI7QUFDRjtBQUVBbkIsT0FBTyxDQUFDMEIsUUFBUSxDQUFFLHFCQUFxQixFQUFFdkIsbUJBQW9CLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=