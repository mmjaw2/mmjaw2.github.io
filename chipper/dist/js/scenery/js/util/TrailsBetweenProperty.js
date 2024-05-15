// Copyright 2022-2024, University of Colorado Boulder

/**
 * A Property that will synchronously contain all Trails between two nodes (in a root-leaf direction).
 * Listens from the child to the parent (since we tend to branch much less that way).
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import TinyProperty from '../../../axon/js/TinyProperty.js';
import { scenery, Trail } from '../imports.js';
export default class TrailsBetweenProperty extends TinyProperty {
  listenedNodeSet = new Set();
  constructor(rootNode, leafNode) {
    super([]);
    this.rootNode = rootNode;
    this.leafNode = leafNode;
    this._trailUpdateListener = this.update.bind(this);
    this.update();
  }
  update() {
    // Trails accumulated in our recursion that will be our Property's value
    const trails = [];

    // Nodes that were touched in the scan (we should listen to changes to ANY of these to see if there is a connection
    // or disconnection. This could potentially cause our Property to change
    const nodeSet = new Set();

    // Modified in-place during the search
    const trail = new Trail(this.leafNode);
    const rootNode = this.rootNode;
    (function recurse() {
      const root = trail.rootNode();
      nodeSet.add(root);
      if (root === rootNode) {
        // Create a permanent copy that won't be mutated
        trails.push(trail.copy());
      }
      root.parents.forEach(parent => {
        trail.addAncestor(parent);
        recurse();
        trail.removeAncestor();
      });
    })();

    // Add in new needed listeners
    nodeSet.forEach(node => {
      if (!this.listenedNodeSet.has(node)) {
        this.addNodeListener(node);
      }
    });

    // Remove listeners not needed anymore
    this.listenedNodeSet.forEach(node => {
      if (!nodeSet.has(node)) {
        this.removeNodeListener(node);
      }
    });

    // Guard in a way that deepEquality on the Property wouldn't (because of the Array wrapper)
    const currentTrails = this.value;
    let trailsEqual = currentTrails.length === trails.length;
    if (trailsEqual) {
      for (let i = 0; i < trails.length; i++) {
        if (!currentTrails[i].equals(trails[i])) {
          trailsEqual = false;
          break;
        }
      }
    }
    if (!trailsEqual) {
      this.value = trails;
    }
  }
  addNodeListener(node) {
    this.listenedNodeSet.add(node);
    node.parentAddedEmitter.addListener(this._trailUpdateListener);
    node.parentRemovedEmitter.addListener(this._trailUpdateListener);
  }
  removeNodeListener(node) {
    this.listenedNodeSet.delete(node);
    node.parentAddedEmitter.removeListener(this._trailUpdateListener);
    node.parentRemovedEmitter.removeListener(this._trailUpdateListener);
  }
  dispose() {
    this.listenedNodeSet.forEach(node => this.removeNodeListener(node));
    super.dispose();
  }
}
scenery.register('TrailsBetweenProperty', TrailsBetweenProperty);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUaW55UHJvcGVydHkiLCJzY2VuZXJ5IiwiVHJhaWwiLCJUcmFpbHNCZXR3ZWVuUHJvcGVydHkiLCJsaXN0ZW5lZE5vZGVTZXQiLCJTZXQiLCJjb25zdHJ1Y3RvciIsInJvb3ROb2RlIiwibGVhZk5vZGUiLCJfdHJhaWxVcGRhdGVMaXN0ZW5lciIsInVwZGF0ZSIsImJpbmQiLCJ0cmFpbHMiLCJub2RlU2V0IiwidHJhaWwiLCJyZWN1cnNlIiwicm9vdCIsImFkZCIsInB1c2giLCJjb3B5IiwicGFyZW50cyIsImZvckVhY2giLCJwYXJlbnQiLCJhZGRBbmNlc3RvciIsInJlbW92ZUFuY2VzdG9yIiwibm9kZSIsImhhcyIsImFkZE5vZGVMaXN0ZW5lciIsInJlbW92ZU5vZGVMaXN0ZW5lciIsImN1cnJlbnRUcmFpbHMiLCJ2YWx1ZSIsInRyYWlsc0VxdWFsIiwibGVuZ3RoIiwiaSIsImVxdWFscyIsInBhcmVudEFkZGVkRW1pdHRlciIsImFkZExpc3RlbmVyIiwicGFyZW50UmVtb3ZlZEVtaXR0ZXIiLCJkZWxldGUiLCJyZW1vdmVMaXN0ZW5lciIsImRpc3Bvc2UiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlRyYWlsc0JldHdlZW5Qcm9wZXJ0eS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBIFByb3BlcnR5IHRoYXQgd2lsbCBzeW5jaHJvbm91c2x5IGNvbnRhaW4gYWxsIFRyYWlscyBiZXR3ZWVuIHR3byBub2RlcyAoaW4gYSByb290LWxlYWYgZGlyZWN0aW9uKS5cclxuICogTGlzdGVucyBmcm9tIHRoZSBjaGlsZCB0byB0aGUgcGFyZW50IChzaW5jZSB3ZSB0ZW5kIHRvIGJyYW5jaCBtdWNoIGxlc3MgdGhhdCB3YXkpLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IFRpbnlQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1RpbnlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCB7IE5vZGUsIHNjZW5lcnksIFRyYWlsIH0gZnJvbSAnLi4vaW1wb3J0cy5qcyc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUcmFpbHNCZXR3ZWVuUHJvcGVydHkgZXh0ZW5kcyBUaW55UHJvcGVydHk8VHJhaWxbXT4ge1xyXG5cclxuICBwdWJsaWMgcmVhZG9ubHkgcm9vdE5vZGU6IE5vZGU7XHJcbiAgcHVibGljIHJlYWRvbmx5IGxlYWZOb2RlOiBOb2RlO1xyXG4gIHB1YmxpYyByZWFkb25seSBsaXN0ZW5lZE5vZGVTZXQ6IFNldDxOb2RlPiA9IG5ldyBTZXQ8Tm9kZT4oKTtcclxuICBwcml2YXRlIHJlYWRvbmx5IF90cmFpbFVwZGF0ZUxpc3RlbmVyOiAoKSA9PiB2b2lkO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHJvb3ROb2RlOiBOb2RlLCBsZWFmTm9kZTogTm9kZSApIHtcclxuICAgIHN1cGVyKCBbXSApO1xyXG5cclxuICAgIHRoaXMucm9vdE5vZGUgPSByb290Tm9kZTtcclxuICAgIHRoaXMubGVhZk5vZGUgPSBsZWFmTm9kZTtcclxuXHJcbiAgICB0aGlzLl90cmFpbFVwZGF0ZUxpc3RlbmVyID0gdGhpcy51cGRhdGUuYmluZCggdGhpcyApO1xyXG5cclxuICAgIHRoaXMudXBkYXRlKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHVwZGF0ZSgpOiB2b2lkIHtcclxuICAgIC8vIFRyYWlscyBhY2N1bXVsYXRlZCBpbiBvdXIgcmVjdXJzaW9uIHRoYXQgd2lsbCBiZSBvdXIgUHJvcGVydHkncyB2YWx1ZVxyXG4gICAgY29uc3QgdHJhaWxzOiBUcmFpbFtdID0gW107XHJcblxyXG4gICAgLy8gTm9kZXMgdGhhdCB3ZXJlIHRvdWNoZWQgaW4gdGhlIHNjYW4gKHdlIHNob3VsZCBsaXN0ZW4gdG8gY2hhbmdlcyB0byBBTlkgb2YgdGhlc2UgdG8gc2VlIGlmIHRoZXJlIGlzIGEgY29ubmVjdGlvblxyXG4gICAgLy8gb3IgZGlzY29ubmVjdGlvbi4gVGhpcyBjb3VsZCBwb3RlbnRpYWxseSBjYXVzZSBvdXIgUHJvcGVydHkgdG8gY2hhbmdlXHJcbiAgICBjb25zdCBub2RlU2V0ID0gbmV3IFNldDxOb2RlPigpO1xyXG5cclxuICAgIC8vIE1vZGlmaWVkIGluLXBsYWNlIGR1cmluZyB0aGUgc2VhcmNoXHJcbiAgICBjb25zdCB0cmFpbCA9IG5ldyBUcmFpbCggdGhpcy5sZWFmTm9kZSApO1xyXG5cclxuICAgIGNvbnN0IHJvb3ROb2RlID0gdGhpcy5yb290Tm9kZTtcclxuICAgICggZnVuY3Rpb24gcmVjdXJzZSgpIHtcclxuICAgICAgY29uc3Qgcm9vdCA9IHRyYWlsLnJvb3ROb2RlKCk7XHJcblxyXG4gICAgICBub2RlU2V0LmFkZCggcm9vdCApO1xyXG5cclxuICAgICAgaWYgKCByb290ID09PSByb290Tm9kZSApIHtcclxuICAgICAgICAvLyBDcmVhdGUgYSBwZXJtYW5lbnQgY29weSB0aGF0IHdvbid0IGJlIG11dGF0ZWRcclxuICAgICAgICB0cmFpbHMucHVzaCggdHJhaWwuY29weSgpICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJvb3QucGFyZW50cy5mb3JFYWNoKCBwYXJlbnQgPT4ge1xyXG4gICAgICAgIHRyYWlsLmFkZEFuY2VzdG9yKCBwYXJlbnQgKTtcclxuICAgICAgICByZWN1cnNlKCk7XHJcbiAgICAgICAgdHJhaWwucmVtb3ZlQW5jZXN0b3IoKTtcclxuICAgICAgfSApO1xyXG4gICAgfSApKCk7XHJcblxyXG4gICAgLy8gQWRkIGluIG5ldyBuZWVkZWQgbGlzdGVuZXJzXHJcbiAgICBub2RlU2V0LmZvckVhY2goIG5vZGUgPT4ge1xyXG4gICAgICBpZiAoICF0aGlzLmxpc3RlbmVkTm9kZVNldC5oYXMoIG5vZGUgKSApIHtcclxuICAgICAgICB0aGlzLmFkZE5vZGVMaXN0ZW5lciggbm9kZSApO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gUmVtb3ZlIGxpc3RlbmVycyBub3QgbmVlZGVkIGFueW1vcmVcclxuICAgIHRoaXMubGlzdGVuZWROb2RlU2V0LmZvckVhY2goIG5vZGUgPT4ge1xyXG4gICAgICBpZiAoICFub2RlU2V0Lmhhcyggbm9kZSApICkge1xyXG4gICAgICAgIHRoaXMucmVtb3ZlTm9kZUxpc3RlbmVyKCBub2RlICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBHdWFyZCBpbiBhIHdheSB0aGF0IGRlZXBFcXVhbGl0eSBvbiB0aGUgUHJvcGVydHkgd291bGRuJ3QgKGJlY2F1c2Ugb2YgdGhlIEFycmF5IHdyYXBwZXIpXHJcbiAgICBjb25zdCBjdXJyZW50VHJhaWxzID0gdGhpcy52YWx1ZTtcclxuICAgIGxldCB0cmFpbHNFcXVhbCA9IGN1cnJlbnRUcmFpbHMubGVuZ3RoID09PSB0cmFpbHMubGVuZ3RoO1xyXG4gICAgaWYgKCB0cmFpbHNFcXVhbCApIHtcclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdHJhaWxzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIGlmICggIWN1cnJlbnRUcmFpbHNbIGkgXS5lcXVhbHMoIHRyYWlsc1sgaSBdICkgKSB7XHJcbiAgICAgICAgICB0cmFpbHNFcXVhbCA9IGZhbHNlO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCAhdHJhaWxzRXF1YWwgKSB7XHJcbiAgICAgIHRoaXMudmFsdWUgPSB0cmFpbHM7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFkZE5vZGVMaXN0ZW5lciggbm9kZTogTm9kZSApOiB2b2lkIHtcclxuICAgIHRoaXMubGlzdGVuZWROb2RlU2V0LmFkZCggbm9kZSApO1xyXG4gICAgbm9kZS5wYXJlbnRBZGRlZEVtaXR0ZXIuYWRkTGlzdGVuZXIoIHRoaXMuX3RyYWlsVXBkYXRlTGlzdGVuZXIgKTtcclxuICAgIG5vZGUucGFyZW50UmVtb3ZlZEVtaXR0ZXIuYWRkTGlzdGVuZXIoIHRoaXMuX3RyYWlsVXBkYXRlTGlzdGVuZXIgKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVtb3ZlTm9kZUxpc3RlbmVyKCBub2RlOiBOb2RlICk6IHZvaWQge1xyXG4gICAgdGhpcy5saXN0ZW5lZE5vZGVTZXQuZGVsZXRlKCBub2RlICk7XHJcbiAgICBub2RlLnBhcmVudEFkZGVkRW1pdHRlci5yZW1vdmVMaXN0ZW5lciggdGhpcy5fdHJhaWxVcGRhdGVMaXN0ZW5lciApO1xyXG4gICAgbm9kZS5wYXJlbnRSZW1vdmVkRW1pdHRlci5yZW1vdmVMaXN0ZW5lciggdGhpcy5fdHJhaWxVcGRhdGVMaXN0ZW5lciApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmxpc3RlbmVkTm9kZVNldC5mb3JFYWNoKCBub2RlID0+IHRoaXMucmVtb3ZlTm9kZUxpc3RlbmVyKCBub2RlICkgKTtcclxuXHJcbiAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnVHJhaWxzQmV0d2VlblByb3BlcnR5JywgVHJhaWxzQmV0d2VlblByb3BlcnR5ICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsWUFBWSxNQUFNLGtDQUFrQztBQUMzRCxTQUFlQyxPQUFPLEVBQUVDLEtBQUssUUFBUSxlQUFlO0FBRXBELGVBQWUsTUFBTUMscUJBQXFCLFNBQVNILFlBQVksQ0FBVTtFQUl2REksZUFBZSxHQUFjLElBQUlDLEdBQUcsQ0FBTyxDQUFDO0VBR3JEQyxXQUFXQSxDQUFFQyxRQUFjLEVBQUVDLFFBQWMsRUFBRztJQUNuRCxLQUFLLENBQUUsRUFBRyxDQUFDO0lBRVgsSUFBSSxDQUFDRCxRQUFRLEdBQUdBLFFBQVE7SUFDeEIs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