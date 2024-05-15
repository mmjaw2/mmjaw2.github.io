// Copyright 2023-2024, University of Colorado Boulder

/**
 * Registry for all objects with a tandem/descriptionTandem set, for use by the description system.
 *
 * NOTE: Experimental currently, see https://github.com/phetsims/joist/issues/941
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import tandemNamespace from './tandemNamespace.js';
import TinyEmitter from '../../axon/js/TinyEmitter.js';
export default class DescriptionRegistry {
  // Provides an object-structure matching the tandem hierarchy. On anything with a tandem with a matching
  // PhetioObject, it will be set as the _value property.
  // E.g. root.density.introScreen.model._value will be the IntroScreen object.
  static root = {};

  // Map from TandemID to PhetioObject, so we can pull out the PhetioObject for a given tandemID
  static map = new Map();

  // Emits with (tandemID, phetioObject) on PhetioObject addition/removal.
  static addedEmitter = new TinyEmitter();
  static removedEmitter = new TinyEmitter();

  /**
   * Called when a PhetioObject is created with a tandem, or when a tandem is set on a PhetioObject.
   */
  static add(tandem, phetioObject) {
    assert && assert(!DescriptionRegistry.map.has(tandem.phetioID), 'TandemID already exists in the DescriptionRegistry');
    DescriptionRegistry.map.set(tandem.phetioID, phetioObject);

    // Traverse our DescriptionEntries, creating them as needed
    const bits = tandem.phetioID.split('.');
    let current = DescriptionRegistry.root;
    for (let i = 0; i < bits.length; i++) {
      const bit = bits[i];
      if (!current[bit]) {
        current[bit] = {};
      }
      current = current[bit];
    }

    // Tag the _value on the leaf so it's accessible
    current._value = phetioObject;
    DescriptionRegistry.addedEmitter.emit(tandem.phetioID, phetioObject);
  }

  /**
   * Called when a PhetioObject is disposed.
   */
  static remove(phetioObject) {
    const tandemID = phetioObject.phetioID;
    if (DescriptionRegistry.map.has(tandemID)) {
      DescriptionRegistry.removedEmitter.emit(tandemID, phetioObject);
      DescriptionRegistry.map.delete(tandemID);

      // Traverse our DescriptionEntries, recording the "trail" of entries
      const bits = tandemID.split('.');
      const entries = [];
      let current = DescriptionRegistry.root;
      for (let i = 0; i < bits.length; i++) {
        const bit = bits[i];
        if (current) {
          current = current[bit];
          if (current) {
            entries.push(current);
          }
        }
      }

      // If we have the full trail, remove the tagged _value
      if (entries.length === bits.length) {
        delete current._value;
      }

      // Remove empty entries recursively
      for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i];
        if (entry && Object.keys(entry).length === 0) {
          delete entries[i];
        }
      }
    } else {
      assert && assert(false, 'PhetioObject not found in DescriptionRegistry');
    }
  }
}
tandemNamespace.register('DescriptionRegistry', DescriptionRegistry);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ0YW5kZW1OYW1lc3BhY2UiLCJUaW55RW1pdHRlciIsIkRlc2NyaXB0aW9uUmVnaXN0cnkiLCJyb290IiwibWFwIiwiTWFwIiwiYWRkZWRFbWl0dGVyIiwicmVtb3ZlZEVtaXR0ZXIiLCJhZGQiLCJ0YW5kZW0iLCJwaGV0aW9PYmplY3QiLCJhc3NlcnQiLCJoYXMiLCJwaGV0aW9JRCIsInNldCIsImJpdHMiLCJzcGxpdCIsImN1cnJlbnQiLCJpIiwibGVuZ3RoIiwiYml0IiwiX3ZhbHVlIiwiZW1pdCIsInJlbW92ZSIsInRhbmRlbUlEIiwiZGVsZXRlIiwiZW50cmllcyIsInB1c2giLCJlbnRyeSIsIk9iamVjdCIsImtleXMiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkRlc2NyaXB0aW9uUmVnaXN0cnkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUmVnaXN0cnkgZm9yIGFsbCBvYmplY3RzIHdpdGggYSB0YW5kZW0vZGVzY3JpcHRpb25UYW5kZW0gc2V0LCBmb3IgdXNlIGJ5IHRoZSBkZXNjcmlwdGlvbiBzeXN0ZW0uXHJcbiAqXHJcbiAqIE5PVEU6IEV4cGVyaW1lbnRhbCBjdXJyZW50bHksIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvam9pc3QvaXNzdWVzLzk0MVxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IHRhbmRlbU5hbWVzcGFjZSBmcm9tICcuL3RhbmRlbU5hbWVzcGFjZS5qcyc7XHJcbmltcG9ydCBQaGV0aW9PYmplY3QgZnJvbSAnLi9QaGV0aW9PYmplY3QuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4vVGFuZGVtLmpzJztcclxuaW1wb3J0IFRpbnlFbWl0dGVyIGZyb20gJy4uLy4uL2F4b24vanMvVGlueUVtaXR0ZXIuanMnO1xyXG5cclxudHlwZSBEZXNjcmlwdGlvbkVudHJ5ID0ge1xyXG4gIC8vIEJvbywgdGhpcyBkb2Vzbid0IHdvcmtcclxuICAvLyBbIEsgaW4gc3RyaW5nIF06IEsgZXh0ZW5kcyAnX3ZhbHVlJyA/ICggUGhldGlvT2JqZWN0IHwgbnVsbCApIDogRGVzY3JpcHRpb25FbnRyeTtcclxuXHJcbiAgWyBLOiBzdHJpbmcgXTogRGVzY3JpcHRpb25FbnRyeSB8IFBoZXRpb09iamVjdCB8IG51bGw7XHJcbn07XHJcblxyXG50eXBlIFRhbmRlbUlEID0gc3RyaW5nO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGVzY3JpcHRpb25SZWdpc3RyeSB7XHJcbiAgLy8gUHJvdmlkZXMgYW4gb2JqZWN0LXN0cnVjdHVyZSBtYXRjaGluZyB0aGUgdGFuZGVtIGhpZXJhcmNoeS4gT24gYW55dGhpbmcgd2l0aCBhIHRhbmRlbSB3aXRoIGEgbWF0Y2hpbmdcclxuICAvLyBQaGV0aW9PYmplY3QsIGl0IHdpbGwgYmUgc2V0IGFzIHRoZSBfdmFsdWUgcHJvcGVydHkuXHJcbiAgLy8gRS5nLiByb290LmRlbnNpdHkuaW50cm9TY3JlZW4ubW9kZWwuX3ZhbHVlIHdpbGwgYmUgdGhlIEludHJvU2NyZWVuIG9iamVjdC5cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IHJvb3Q6IERlc2NyaXB0aW9uRW50cnkgPSB7fTtcclxuXHJcbiAgLy8gTWFwIGZyb20gVGFuZGVtSUQgdG8gUGhldGlvT2JqZWN0LCBzbyB3ZSBjYW4gcHVsbCBvdXQgdGhlIFBoZXRpb09iamVjdCBmb3IgYSBnaXZlbiB0YW5kZW1JRFxyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgbWFwOiBNYXA8VGFuZGVtSUQsIFBoZXRpb09iamVjdD4gPSBuZXcgTWFwPFRhbmRlbUlELCBQaGV0aW9PYmplY3Q+KCk7XHJcblxyXG4gIC8vIEVtaXRzIHdpdGggKHRhbmRlbUlELCBwaGV0aW9PYmplY3QpIG9uIFBoZXRpb09iamVjdCBhZGRpdGlvbi9yZW1vdmFsLlxyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgYWRkZWRFbWl0dGVyID0gbmV3IFRpbnlFbWl0dGVyPFsgVGFuZGVtSUQsIFBoZXRpb09iamVjdCBdPigpO1xyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgcmVtb3ZlZEVtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXI8WyBUYW5kZW1JRCwgUGhldGlvT2JqZWN0IF0+KCk7XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCB3aGVuIGEgUGhldGlvT2JqZWN0IGlzIGNyZWF0ZWQgd2l0aCBhIHRhbmRlbSwgb3Igd2hlbiBhIHRhbmRlbSBpcyBzZXQgb24gYSBQaGV0aW9PYmplY3QuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBhZGQoIHRhbmRlbTogVGFuZGVtLCBwaGV0aW9PYmplY3Q6IFBoZXRpb09iamVjdCApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFEZXNjcmlwdGlvblJlZ2lzdHJ5Lm1hcC5oYXMoIHRhbmRlbS5waGV0aW9JRCApLCAnVGFuZGVtSUQgYWxyZWFkeSBleGlzdHMgaW4gdGhlIERlc2NyaXB0aW9uUmVnaXN0cnknICk7XHJcblxyXG4gICAgRGVzY3JpcHRpb25SZWdpc3RyeS5tYXAuc2V0KCB0YW5kZW0ucGhldGlvSUQsIHBoZXRpb09iamVjdCApO1xyXG5cclxuICAgIC8vIFRyYXZlcnNlIG91ciBEZXNjcmlwdGlvbkVudHJpZXMsIGNyZWF0aW5nIHRoZW0gYXMgbmVlZGVkXHJcbiAgICBjb25zdCBiaXRzID0gdGFuZGVtLnBoZXRpb0lELnNwbGl0KCAnLicgKTtcclxuICAgIGxldCBjdXJyZW50OiBEZXNjcmlwdGlvbkVudHJ5ID0gRGVzY3JpcHRpb25SZWdpc3RyeS5yb290O1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgYml0cy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgYml0ID0gYml0c1sgaSBdO1xyXG5cclxuICAgICAgaWYgKCAhY3VycmVudFsgYml0IF0gKSB7XHJcbiAgICAgICAgY3VycmVudFsgYml0IF0gPSB7fTtcclxuICAgICAgfVxyXG4gICAgICBjdXJyZW50ID0gY3VycmVudFsgYml0IF0gYXMgRGVzY3JpcHRpb25FbnRyeTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUYWcgdGhlIF92YWx1ZSBvbiB0aGUgbGVhZiBzbyBpdCdzIGFjY2Vzc2libGVcclxuICAgIGN1cnJlbnQuX3ZhbHVlID0gcGhldGlvT2JqZWN0O1xyXG5cclxuICAgIERlc2NyaXB0aW9uUmVnaXN0cnkuYWRkZWRFbWl0dGVyLmVtaXQoIHRhbmRlbS5waGV0aW9JRCwgcGhldGlvT2JqZWN0ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgd2hlbiBhIFBoZXRpb09iamVjdCBpcyBkaXNwb3NlZC5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJlbW92ZSggcGhldGlvT2JqZWN0OiBQaGV0aW9PYmplY3QgKTogdm9pZCB7XHJcbiAgICBjb25zdCB0YW5kZW1JRCA9IHBoZXRpb09iamVjdC5waGV0aW9JRDtcclxuXHJcbiAgICBpZiAoIERlc2NyaXB0aW9uUmVnaXN0cnkubWFwLmhhcyggdGFuZGVtSUQgKSApIHtcclxuXHJcbiAgICAgIERlc2NyaXB0aW9uUmVnaXN0cnkucmVtb3ZlZEVtaXR0ZXIuZW1pdCggdGFuZGVtSUQsIHBoZXRpb09iamVjdCApO1xyXG4gICAgICBEZXNjcmlwdGlvblJlZ2lzdHJ5Lm1hcC5kZWxldGUoIHRhbmRlbUlEICk7XHJcblxyXG4gICAgICAvLyBUcmF2ZXJzZSBvdXIgRGVzY3JpcHRpb25FbnRyaWVzLCByZWNvcmRpbmcgdGhlIFwidHJhaWxcIiBvZiBlbnRyaWVzXHJcbiAgICAgIGNvbnN0IGJpdHMgPSB0YW5kZW1JRC5zcGxpdCggJy4nICk7XHJcbiAgICAgIGNvbnN0IGVudHJpZXM6IERlc2NyaXB0aW9uRW50cnlbXSA9IFtdO1xyXG4gICAgICBsZXQgY3VycmVudDogRGVzY3JpcHRpb25FbnRyeSA9IERlc2NyaXB0aW9uUmVnaXN0cnkucm9vdDtcclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgYml0cy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICBjb25zdCBiaXQgPSBiaXRzWyBpIF07XHJcblxyXG4gICAgICAgIGlmICggY3VycmVudCApIHtcclxuICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50WyBiaXQgXSBhcyBEZXNjcmlwdGlvbkVudHJ5O1xyXG5cclxuICAgICAgICAgIGlmICggY3VycmVudCApIHtcclxuICAgICAgICAgICAgZW50cmllcy5wdXNoKCBjdXJyZW50ICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJZiB3ZSBoYXZlIHRoZSBmdWxsIHRyYWlsLCByZW1vdmUgdGhlIHRhZ2dlZCBfdmFsdWVcclxuICAgICAgaWYgKCBlbnRyaWVzLmxlbmd0aCA9PT0gYml0cy5sZW5ndGggKSB7XHJcbiAgICAgICAgZGVsZXRlIGN1cnJlbnQuX3ZhbHVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBSZW1vdmUgZW1wdHkgZW50cmllcyByZWN1cnNpdmVseVxyXG4gICAgICBmb3IgKCBsZXQgaSA9IGVudHJpZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0gKSB7XHJcbiAgICAgICAgY29uc3QgZW50cnkgPSBlbnRyaWVzWyBpIF07XHJcbiAgICAgICAgaWYgKCBlbnRyeSAmJiBPYmplY3Qua2V5cyggZW50cnkgKS5sZW5ndGggPT09IDAgKSB7XHJcbiAgICAgICAgICBkZWxldGUgZW50cmllc1sgaSBdO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGZhbHNlLCAnUGhldGlvT2JqZWN0IG5vdCBmb3VuZCBpbiBEZXNjcmlwdGlvblJlZ2lzdHJ5JyApO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxudGFuZGVtTmFtZXNwYWNl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