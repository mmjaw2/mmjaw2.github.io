// Copyright 2017-2023, University of Colorado Boulder

/**
 * Represents a point in space that connects to edges. It stores the edges that are connected (directionally as
 * half-edges since Cubic segments can start and end at the same point/vertex), and can handle sorting edges so that
 * a half-edge's "next" half-edge (following counter-clockwise) can be determined.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Vector2 from '../../../dot/js/Vector2.js';
import cleanArray from '../../../phet-core/js/cleanArray.js';
import Pool from '../../../phet-core/js/Pool.js';
import { kite, Line } from '../imports.js';
let globaId = 0;
class Vertex {
  /**
   * @public (kite-internal)
   *
   * NOTE: Use Vertex.pool.create for most usage instead of using the constructor directly.
   *
   * @param {Vector2} point - The point where the vertex should be located.
   */
  constructor(point) {
    // @public {number}
    this.id = ++globaId;

    // NOTE: most object properties are declared/documented in the initialize method. Please look there for most
    // definitions.
    this.initialize(point);
  }

  /**
   * Similar to a usual constructor, but is set up so it can be called multiple times (with dispose() in-between) to
   * support pooling.
   * @private
   *
   * @param {Vector2} point
   * @returns {Vertex} - This reference for chaining
   */
  initialize(point) {
    assert && assert(point instanceof Vector2);

    // @public {Vector2}
    this.point = point;

    // @public {Array.<HalfEdge>} - Records the half-edge that points to (ends at) this vertex.
    this.incidentHalfEdges = cleanArray(this.incidentHalfEdges);

    // @public {boolean} - Used for depth-first search
    this.visited = false;

    // @public {number} - Visit index for bridge detection (more efficient to have inline here)
    this.visitIndex = 0;

    // @public {number} - Low index for bridge detection (more efficient to have inline here)
    this.lowIndex = 0;

    // @public {*} - Available for arbitrary client usage. -- Keep JSONable
    this.data = null;

    // @public {*} - kite-internal
    this.internalData = {};
    return this;
  }

  /**
   * Returns an object form that can be turned back into a segment with the corresponding deserialize method.
   * @public
   *
   * @returns {Object}
   */
  serialize() {
    return {
      type: 'Vertex',
      id: this.id,
      point: Vector2.Vector2IO.toStateObject(this.point),
      incidentHalfEdges: this.incidentHalfEdges.map(halfEdge => halfEdge.id),
      visited: this.visited,
      visitIndex: this.visitIndex,
      lowIndex: this.lowIndex
    };
  }

  /**
   * Removes references (so it can allow other objects to be GC'ed or pooled), and frees itself to the pool so it
   * can be reused.
   * @public
   */
  dispose() {
    this.point = Vector2.ZERO;
    cleanArray(this.incidentHalfEdges);
    this.freeToPool();
  }

  /**
   * Sorts the edges in increasing angle order.
   * @public
   */
  sortEdges() {
    const vectors = []; // x coordinate will be "angle", y coordinate will be curvature
    for (let i = 0; i < this.incidentHalfEdges.length; i++) {
      const halfEdge = this.incidentHalfEdges[i];
      // NOTE: If it is expensive to precompute curvature, we could save it until edgeComparison needs it.
      vectors.push(halfEdge.sortVector.setXY(halfEdge.getEndTangent().angle, halfEdge.getEndCurvature()));
    }

    // "Rotate" the angles until we are sure that our "cut" (where -pi goes to pi around the circle) is at a place
    // not near any angle. This should prevent ambiguity in sorting (which can lead to bugs in the order)
    const cutoff = -Math.PI + 1e-4;
    let atCutAngle = false;
    while (!atCutAngle) {
      atCutAngle = true;
      for (let i = 0; i < vectors.length; i++) {
        if (vectors[i].x < cutoff) {
          atCutAngle = false;
        }
      }
      if (!atCutAngle) {
        for (let i = 0; i < vectors.length; i++) {
          const vector = vectors[i];
          vector.x -= 1.62594024516; // Definitely not choosing random digits by typing! (shouldn't matter)
          if (vector.x < -Math.PI - 1e-4) {
            vector.x += Math.PI * 2;
          }
        }
      }
    }
    this.incidentHalfEdges.sort(Vertex.edgeComparison);
  }

  /**
   * Compare two edges for sortEdges. Should have executed that first, as it relies on information looked up in that
   * process.
   * @public
   *
   * @param {Edge} halfEdgeA
   * @param {Edge} halfEdgeB
   * @returns {number}
   */
  static edgeComparison(halfEdgeA, halfEdgeB) {
    const angleA = halfEdgeA.sortVector.x;
    const angleB = halfEdgeB.sortVector.x;

    // Don't allow angleA=-pi, angleB=pi (they are equivalent)
    // If our angle is very small, we need to accept it still if we have two lines (since they will have the same
    // curvature).
    if (Math.abs(angleA - angleB) > 1e-5 || angleA !== angleB && halfEdgeA.edge.segment instanceof Line && halfEdgeB.edge.segment instanceof Line) {
      return angleA < angleB ? -1 : 1;
    } else {
      const curvatureA = halfEdgeA.sortVector.y;
      const curvatureB = halfEdgeB.sortVector.y;
      if (Math.abs(curvatureA - curvatureB) > 1e-5) {
        return curvatureA < curvatureB ? 1 : -1;
      } else {
        const t = 1 - 1e-3;
        const curvatureAX = halfEdgeA.getDirectionalSegment().subdivided(t)[1].curvatureAt(0);
        const curvatureBX = halfEdgeB.getDirectionalSegment().subdivided(t)[1].curvatureAt(0);
        return curvatureAX < curvatureBX ? 1 : -1;
      }
    }
  }

  // @public
  freeToPool() {
    Vertex.pool.freeToPool(this);
  }

  // @public
  static pool = new Pool(Vertex);
}
kite.register('Vertex', Vertex);
export default Vertex;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJWZWN0b3IyIiwiY2xlYW5BcnJheSIsIlBvb2wiLCJraXRlIiwiTGluZSIsImdsb2JhSWQiLCJWZXJ0ZXgiLCJjb25zdHJ1Y3RvciIsInBvaW50IiwiaWQiLCJpbml0aWFsaXplIiwiYXNzZXJ0IiwiaW5jaWRlbnRIYWxmRWRnZXMiLCJ2aXNpdGVkIiwidmlzaXRJbmRleCIsImxvd0luZGV4IiwiZGF0YSIsImludGVybmFsRGF0YSIsInNlcmlhbGl6ZSIsInR5cGUiLCJWZWN0b3IySU8iLCJ0b1N0YXRlT2JqZWN0IiwibWFwIiwiaGFsZkVkZ2UiLCJkaXNwb3NlIiwiWkVSTyIsImZyZWVUb1Bvb2wiLCJzb3J0RWRnZXMiLCJ2ZWN0b3JzIiwiaSIsImxlbmd0aCIsInB1c2giLCJzb3J0VmVjdG9yIiwic2V0WFkiLCJnZXRFbmRUYW5nZW50IiwiYW5nbGUiLCJnZXRFbmRDdXJ2YXR1cmUiLCJjdXRvZmYiLCJNYXRoIiwiUEkiLCJhdEN1dEFuZ2xlIiwieCIsInZlY3RvciIsInNvcnQiLCJlZGdlQ29tcGFyaXNvbiIsImhhbGZFZGdlQSIsImhhbGZFZGdlQiIsImFuZ2xlQSIsImFuZ2xlQiIsImFicyIsImVkZ2UiLCJzZWdtZW50IiwiY3VydmF0dXJlQSIsInkiLCJjdXJ2YXR1cmVCIiwidCIsImN1cnZhdHVyZUFYIiwiZ2V0RGlyZWN0aW9uYWxTZWdtZW50Iiwic3ViZGl2aWRlZCIsImN1cnZhdHVyZUF0IiwiY3VydmF0dXJlQlgiLCJwb29sIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJWZXJ0ZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUmVwcmVzZW50cyBhIHBvaW50IGluIHNwYWNlIHRoYXQgY29ubmVjdHMgdG8gZWRnZXMuIEl0IHN0b3JlcyB0aGUgZWRnZXMgdGhhdCBhcmUgY29ubmVjdGVkIChkaXJlY3Rpb25hbGx5IGFzXHJcbiAqIGhhbGYtZWRnZXMgc2luY2UgQ3ViaWMgc2VnbWVudHMgY2FuIHN0YXJ0IGFuZCBlbmQgYXQgdGhlIHNhbWUgcG9pbnQvdmVydGV4KSwgYW5kIGNhbiBoYW5kbGUgc29ydGluZyBlZGdlcyBzbyB0aGF0XHJcbiAqIGEgaGFsZi1lZGdlJ3MgXCJuZXh0XCIgaGFsZi1lZGdlIChmb2xsb3dpbmcgY291bnRlci1jbG9ja3dpc2UpIGNhbiBiZSBkZXRlcm1pbmVkLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IFZlY3RvcjIgZnJvbSAnLi4vLi4vLi4vZG90L2pzL1ZlY3RvcjIuanMnO1xyXG5pbXBvcnQgY2xlYW5BcnJheSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvY2xlYW5BcnJheS5qcyc7XHJcbmltcG9ydCBQb29sIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9Qb29sLmpzJztcclxuaW1wb3J0IHsga2l0ZSwgTGluZSB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5cclxubGV0IGdsb2JhSWQgPSAwO1xyXG5cclxuY2xhc3MgVmVydGV4IHtcclxuICAvKipcclxuICAgKiBAcHVibGljIChraXRlLWludGVybmFsKVxyXG4gICAqXHJcbiAgICogTk9URTogVXNlIFZlcnRleC5wb29sLmNyZWF0ZSBmb3IgbW9zdCB1c2FnZSBpbnN0ZWFkIG9mIHVzaW5nIHRoZSBjb25zdHJ1Y3RvciBkaXJlY3RseS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7VmVjdG9yMn0gcG9pbnQgLSBUaGUgcG9pbnQgd2hlcmUgdGhlIHZlcnRleCBzaG91bGQgYmUgbG9jYXRlZC5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvciggcG9pbnQgKSB7XHJcbiAgICAvLyBAcHVibGljIHtudW1iZXJ9XHJcbiAgICB0aGlzLmlkID0gKytnbG9iYUlkO1xyXG5cclxuICAgIC8vIE5PVEU6IG1vc3Qgb2JqZWN0IHByb3BlcnRpZXMgYXJlIGRlY2xhcmVkL2RvY3VtZW50ZWQgaW4gdGhlIGluaXRpYWxpemUgbWV0aG9kLiBQbGVhc2UgbG9vayB0aGVyZSBmb3IgbW9zdFxyXG4gICAgLy8gZGVmaW5pdGlvbnMuXHJcbiAgICB0aGlzLmluaXRpYWxpemUoIHBvaW50ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTaW1pbGFyIHRvIGEgdXN1YWwgY29uc3RydWN0b3IsIGJ1dCBpcyBzZXQgdXAgc28gaXQgY2FuIGJlIGNhbGxlZCBtdWx0aXBsZSB0aW1lcyAod2l0aCBkaXNwb3NlKCkgaW4tYmV0d2VlbikgdG9cclxuICAgKiBzdXBwb3J0IHBvb2xpbmcuXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7VmVjdG9yMn0gcG9pbnRcclxuICAgKiBAcmV0dXJucyB7VmVydGV4fSAtIFRoaXMgcmVmZXJlbmNlIGZvciBjaGFpbmluZ1xyXG4gICAqL1xyXG4gIGluaXRpYWxpemUoIHBvaW50ICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcG9pbnQgaW5zdGFuY2VvZiBWZWN0b3IyICk7XHJcblxyXG4gICAgLy8gQHB1YmxpYyB7VmVjdG9yMn1cclxuICAgIHRoaXMucG9pbnQgPSBwb2ludDtcclxuXHJcbiAgICAvLyBAcHVibGljIHtBcnJheS48SGFsZkVkZ2U+fSAtIFJlY29yZHMgdGhlIGhhbGYtZWRnZSB0aGF0IHBvaW50cyB0byAoZW5kcyBhdCkgdGhpcyB2ZXJ0ZXguXHJcbiAgICB0aGlzLmluY2lkZW50SGFsZkVkZ2VzID0gY2xlYW5BcnJheSggdGhpcy5pbmNpZGVudEhhbGZFZGdlcyApO1xyXG5cclxuICAgIC8vIEBwdWJsaWMge2Jvb2xlYW59IC0gVXNlZCBmb3IgZGVwdGgtZmlyc3Qgc2VhcmNoXHJcbiAgICB0aGlzLnZpc2l0ZWQgPSBmYWxzZTtcclxuXHJcbiAgICAvLyBAcHVibGljIHtudW1iZXJ9IC0gVmlzaXQgaW5kZXggZm9yIGJyaWRnZSBkZXRlY3Rpb24gKG1vcmUgZWZmaWNpZW50IHRvIGhhdmUgaW5saW5lIGhlcmUpXHJcbiAgICB0aGlzLnZpc2l0SW5kZXggPSAwO1xyXG5cclxuICAgIC8vIEBwdWJsaWMge251bWJlcn0gLSBMb3cgaW5kZXggZm9yIGJyaWRnZSBkZXRlY3Rpb24gKG1vcmUgZWZmaWNpZW50IHRvIGhhdmUgaW5saW5lIGhlcmUpXHJcbiAgICB0aGlzLmxvd0luZGV4ID0gMDtcclxuXHJcbiAgICAvLyBAcHVibGljIHsqfSAtIEF2YWlsYWJsZSBmb3IgYXJiaXRyYXJ5IGNsaWVudCB1c2FnZS4gLS0gS2VlcCBKU09OYWJsZVxyXG4gICAgdGhpcy5kYXRhID0gbnVsbDtcclxuXHJcbiAgICAvLyBAcHVibGljIHsqfSAtIGtpdGUtaW50ZXJuYWxcclxuICAgIHRoaXMuaW50ZXJuYWxEYXRhID0ge307XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIG9iamVjdCBmb3JtIHRoYXQgY2FuIGJlIHR1cm5lZCBiYWNrIGludG8gYSBzZWdtZW50IHdpdGggdGhlIGNvcnJlc3BvbmRpbmcgZGVzZXJpYWxpemUgbWV0aG9kLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtPYmplY3R9XHJcbiAgICovXHJcbiAgc2VyaWFsaXplKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdHlwZTogJ1ZlcnRleCcsXHJcbiAgICAgIGlkOiB0aGlzLmlkLFxyXG4gICAgICBwb2ludDogVmVjdG9yMi5WZWN0b3IySU8udG9TdGF0ZU9iamVjdCggdGhpcy5wb2ludCApLFxyXG4gICAgICBpbmNpZGVudEhhbGZFZGdlczogdGhpcy5pbmNpZGVudEhhbGZFZGdlcy5tYXAoIGhhbGZFZGdlID0+IGhhbGZFZGdlLmlkICksXHJcbiAgICAgIHZpc2l0ZWQ6IHRoaXMudmlzaXRlZCxcclxuICAgICAgdmlzaXRJbmRleDogdGhpcy52aXNpdEluZGV4LFxyXG4gICAgICBsb3dJbmRleDogdGhpcy5sb3dJbmRleFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgcmVmZXJlbmNlcyAoc28gaXQgY2FuIGFsbG93IG90aGVyIG9iamVjdHMgdG8gYmUgR0MnZWQgb3IgcG9vbGVkKSwgYW5kIGZyZWVzIGl0c2VsZiB0byB0aGUgcG9vbCBzbyBpdFxyXG4gICAqIGNhbiBiZSByZXVzZWQuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqL1xyXG4gIGRpc3Bvc2UoKSB7XHJcbiAgICB0aGlzLnBvaW50ID0gVmVjdG9yMi5aRVJPO1xyXG4gICAgY2xlYW5BcnJheSggdGhpcy5pbmNpZGVudEhhbGZFZGdlcyApO1xyXG4gICAgdGhpcy5mcmVlVG9Qb29sKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTb3J0cyB0aGUgZWRnZXMgaW4gaW5jcmVhc2luZyBhbmdsZSBvcmRlci5cclxuICAgKiBAcHVibGljXHJcbiAgICovXHJcbiAgc29ydEVkZ2VzKCkge1xyXG4gICAgY29uc3QgdmVjdG9ycyA9IFtdOyAvLyB4IGNvb3JkaW5hdGUgd2lsbCBiZSBcImFuZ2xlXCIsIHkgY29vcmRpbmF0ZSB3aWxsIGJlIGN1cnZhdHVyZVxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5pbmNpZGVudEhhbGZFZGdlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3QgaGFsZkVkZ2UgPSB0aGlzLmluY2lkZW50SGFsZkVkZ2VzWyBpIF07XHJcbiAgICAgIC8vIE5PVEU6IElmIGl0IGlzIGV4cGVuc2l2ZSB0byBwcmVjb21wdXRlIGN1cnZhdHVyZSwgd2UgY291bGQgc2F2ZSBpdCB1bnRpbCBlZGdlQ29tcGFyaXNvbiBuZWVkcyBpdC5cclxuICAgICAgdmVjdG9ycy5wdXNoKCBoYWxmRWRnZS5zb3J0VmVjdG9yLnNldFhZKCBoYWxmRWRnZS5nZXRFbmRUYW5nZW50KCkuYW5nbGUsIGhhbGZFZGdlLmdldEVuZEN1cnZhdHVyZSgpICkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBcIlJvdGF0ZVwiIHRoZSBhbmdsZXMgdW50aWwgd2UgYXJlIHN1cmUgdGhhdCBvdXIgXCJjdXRcIiAod2hlcmUgLXBpIGdvZXMgdG8gcGkgYXJvdW5kIHRoZSBjaXJjbGUpIGlzIGF0IGEgcGxhY2VcclxuICAgIC8vIG5vdCBuZWFyIGFueSBhbmdsZS4gVGhpcyBzaG91bGQgcHJldmVudCBhbWJpZ3VpdHkgaW4gc29ydGluZyAod2hpY2ggY2FuIGxlYWQgdG8gYnVncyBpbiB0aGUgb3JkZXIpXHJcbiAgICBjb25zdCBjdXRvZmYgPSAtTWF0aC5QSSArIDFlLTQ7XHJcbiAgICBsZXQgYXRDdXRBbmdsZSA9IGZhbHNlO1xyXG4gICAgd2hpbGUgKCAhYXRDdXRBbmdsZSApIHtcclxuICAgICAgYXRDdXRBbmdsZSA9IHRydWU7XHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHZlY3RvcnMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgaWYgKCB2ZWN0b3JzWyBpIF0ueCA8IGN1dG9mZiApIHtcclxuICAgICAgICAgIGF0Q3V0QW5nbGUgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCAhYXRDdXRBbmdsZSApIHtcclxuICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB2ZWN0b3JzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgY29uc3QgdmVjdG9yID0gdmVjdG9yc1sgaSBdO1xyXG4gICAgICAgICAgdmVjdG9yLnggLT0gMS42MjU5NDAyNDUxNjsgLy8gRGVmaW5pdGVseSBub3QgY2hvb3NpbmcgcmFuZG9tIGRpZ2l0cyBieSB0eXBpbmchIChzaG91bGRuJ3QgbWF0dGVyKVxyXG4gICAgICAgICAgaWYgKCB2ZWN0b3IueCA8IC1NYXRoLlBJIC0gMWUtNCApIHtcclxuICAgICAgICAgICAgdmVjdG9yLnggKz0gTWF0aC5QSSAqIDI7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5pbmNpZGVudEhhbGZFZGdlcy5zb3J0KCBWZXJ0ZXguZWRnZUNvbXBhcmlzb24gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXBhcmUgdHdvIGVkZ2VzIGZvciBzb3J0RWRnZXMuIFNob3VsZCBoYXZlIGV4ZWN1dGVkIHRoYXQgZmlyc3QsIGFzIGl0IHJlbGllcyBvbiBpbmZvcm1hdGlvbiBsb29rZWQgdXAgaW4gdGhhdFxyXG4gICAqIHByb2Nlc3MuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtFZGdlfSBoYWxmRWRnZUFcclxuICAgKiBAcGFyYW0ge0VkZ2V9IGhhbGZFZGdlQlxyXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgc3RhdGljIGVkZ2VDb21wYXJpc29uKCBoYWxmRWRnZUEsIGhhbGZFZGdlQiApIHtcclxuICAgIGNvbnN0IGFuZ2xlQSA9IGhhbGZFZGdlQS5zb3J0VmVjdG9yLng7XHJcbiAgICBjb25zdCBhbmdsZUIgPSBoYWxmRWRnZUIuc29ydFZlY3Rvci54O1xyXG5cclxuICAgIC8vIERvbid0IGFsbG93IGFuZ2xlQT0tcGksIGFuZ2xlQj1waSAodGhleSBhcmUgZXF1aXZhbGVudClcclxuICAgIC8vIElmIG91ciBhbmdsZSBpcyB2ZXJ5IHNtYWxsLCB3ZSBuZWVkIHRvIGFjY2VwdCBpdCBzdGlsbCBpZiB3ZSBoYXZlIHR3byBsaW5lcyAoc2luY2UgdGhleSB3aWxsIGhhdmUgdGhlIHNhbWVcclxuICAgIC8vIGN1cnZhdHVyZSkuXHJcbiAgICBpZiAoIE1hdGguYWJzKCBhbmdsZUEgLSBhbmdsZUIgKSA+IDFlLTUgfHxcclxuICAgICAgICAgKCBhbmdsZUEgIT09IGFuZ2xlQiAmJiAoIGhhbGZFZGdlQS5lZGdlLnNlZ21lbnQgaW5zdGFuY2VvZiBMaW5lICkgJiYgKCBoYWxmRWRnZUIuZWRnZS5zZWdtZW50IGluc3RhbmNlb2YgTGluZSApICkgKSB7XHJcbiAgICAgIHJldHVybiBhbmdsZUEgPCBhbmdsZUIgPyAtMSA6IDE7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgY29uc3QgY3VydmF0dXJlQSA9IGhhbGZFZGdlQS5zb3J0VmVjdG9yLnk7XHJcbiAgICAgIGNvbnN0IGN1cnZhdHVyZUIgPSBoYWxmRWRnZUIuc29ydFZlY3Rvci55O1xyXG4gICAgICBpZiAoIE1hdGguYWJzKCBjdXJ2YXR1cmVBIC0gY3VydmF0dXJlQiApID4gMWUtNSApIHtcclxuICAgICAgICByZXR1cm4gY3VydmF0dXJlQSA8IGN1cnZhdHVyZUIgPyAxIDogLTE7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgY29uc3QgdCA9IDEgLSAxZS0zO1xyXG4gICAgICAgIGNvbnN0IGN1cnZhdHVyZUFYID0gaGFsZkVkZ2VBLmdldERpcmVjdGlvbmFsU2VnbWVudCgpLnN1YmRpdmlkZWQoIHQgKVsgMSBdLmN1cnZhdHVyZUF0KCAwICk7XHJcbiAgICAgICAgY29uc3QgY3VydmF0dXJlQlggPSBoYWxmRWRnZUIuZ2V0RGlyZWN0aW9uYWxTZWdtZW50KCkuc3ViZGl2aWRlZCggdCApWyAxIF0uY3VydmF0dXJlQXQoIDAgKTtcclxuICAgICAgICByZXR1cm4gY3VydmF0dXJlQVggPCBjdXJ2YXR1cmVCWCA/IDEgOiAtMTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gQHB1YmxpY1xyXG4gIGZyZWVUb1Bvb2woKSB7XHJcbiAgICBWZXJ0ZXgucG9vbC5mcmVlVG9Qb29sKCB0aGlzICk7XHJcbiAgfVxyXG5cclxuICAvLyBAcHVibGljXHJcbiAgc3RhdGljIHBvb2wgPSBuZXcgUG9vbCggVmVydGV4ICk7XHJcbn1cclxuXHJcbmtpdGUucmVnaXN0ZXIoICdWZXJ0ZXgnLCBWZXJ0ZXggKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFZlcnRleDsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLE9BQU8sTUFBTSw0QkFBNEI7QUFDaEQsT0FBT0MsVUFBVSxNQUFNLHFDQUFxQztBQUM1RCxPQUFPQyxJQUFJLE1BQU0sK0JBQStCO0FBQ2hELFNBQVNDLElBQUksRUFBRUMsSUFBSSxRQUFRLGVBQWU7QUFFMUMsSUFBSUMsT0FBTyxHQUFHLENBQUM7QUFFZixNQUFNQyxNQUFNLENBQUM7RUFDWDtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFQyxXQUFXQSxDQUFFQyxLQUFLLEVBQUc7SUFDbkI7SUFDQSxJQUFJLENBQUNDLEVBQUUsR0FBRyxFQUFFSixPQUFPOztJQUVuQjtJQUNBO0lBQ0EsSUFBSSxDQUFDSyxVQUFVLENBQUVGLEtBQU0sQ0FBQztFQUMxQjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0VFLFVBQVVBLENBQUVGLEtBQUssRUFBRztJQUNsQkcsTUFBTSxJQUFJQSxNQUFNLENBQUVILEtBQUssWUFBWVIsT0FBUSxDQUFDOztJQUU1QztJQUNBLElBQUksQ0FBQ1EsS0FBSyxHQUFHQSxLQUFLOztJQUVsQjtJQUNBLElBQUksQ0FBQ0ksaUJBQWlCLEdBQUdYLFVBQVUsQ0FBRSxJQUFJLENBQUNXLGlCQUFrQixDQUFDOztJQUU3RDtJQUNBLElBQUksQ0FBQ0MsT0FBTyxHQUFHLEtBQUs7O0lBRXBCO0lBQ0EsSUFBSSxDQUFDQyxVQUFVLEdBQUcsQ0FBQzs7SUFFbkI7SUFDQSxJQUFJLENBQUNDLFFBQVEsR0FBRyxDQUFDOztJQUVqQjtJQUNBLElBQUksQ0FBQ0MsSUFBSSxHQUFHLElBQUk7O0lBRWhCO0lBQ0EsSUFBSSxDQUFDQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO0lBRXRCLE9BQU8sSUFBSTtFQUNiOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFQyxTQUFTQSxDQUFBLEVBQUc7SUFDVixPQUFPO01BQ0xDLElBQUksRUFBRSxRQUFRO01BQ2RWLEVBQUUsRUFBRSxJQUFJLENBQUNBLEVBQUU7TUFDWEQsS0FBSyxFQUFFUixPQUFPLENBQUNvQixTQUFTLENBQUNDLGFBQWEsQ0FBRSxJQUFJLENBQUNiLEtBQU0sQ0FBQztNQUNwREksaUJBQWlCLEVBQUUsSUFBSSxDQUFDQSxpQkFBaUIsQ0FBQ1UsR0FBRyxDQUFFQyxRQUFRLElBQUlBLFFBQVEsQ0FBQ2QsRUFBRyxDQUFDO01BQ3hFSSxPQUFPLEVBQUUsSUFBSSxDQUFDQSxPQUFPO01BQ3JCQyxVQUFVLEVBQUUsSUFBSSxDQUFDQSxVQUFVO01BQzNCQyxRQUFRLEVBQUUsSUFBSSxDQUFDQTtJQUNqQixDQUFDO0VBQ0g7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNFUyxPQUFPQSxDQUFBLEVBQUc7SUFDUixJQUFJLENBQUNoQixLQUFLLEdBQUdSLE9BQU8sQ0FBQ3lCLElBQUk7SUFDekJ4QixVQUFVLENBQUUsSUFBSSxDQUFDVyxpQkFBa0IsQ0FBQztJQUNwQyxJQUFJLENBQUNjLFVBQVUsQ0FBQyxDQUFDO0VBQ25COztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0VBQ0VDLFNBQVNBLENBQUEsRUFBRztJQUNWLE1BQU1DLE9BQU8sR0FBRyxFQUFFLENBQUMsQ0FBQztJQUNwQixLQUFNLElBQUlDLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBRyxJQUFJLENBQUNqQixpQkFBaUIsQ0FBQ2tCLE1BQU0sRUFBRUQsQ0FBQyxFQUFFLEVBQUc7TUFDeEQsTUFBTU4sUUFBUSxHQUFHLElBQUksQ0FBQ1gsaUJBQWlCLENBQUVpQixDQUFDLENBQUU7TUFDNUM7TUFDQUQsT0FBTyxDQUFDRyxJQUFJLENBQUVSLFFBQVEsQ0FBQ1MsVUFBVSxDQUFDQyxLQUFLLENBQUVWLFFBQVEsQ0FBQ1csYUFBYSxDQUFDLENBQUMsQ0FBQ0MsS0FBSyxFQUFFWixRQUFRLENBQUNhLGVBQWUsQ0FBQyxDQUFFLENBQUUsQ0FBQztJQUN6Rzs7SUFFQTtJQUNBO0lBQ0EsTUFBTUMsTUFBTSxHQUFHLENBQUNDLElBQUksQ0FBQ0MsRUFBRSxHQUFHLElBQUk7SUFDOUIsSUFBSUMsVUFBVSxHQUFHLEtBQUs7SUFDdEIsT0FBUSxDQUFDQSxVQUFVLEVBQUc7TUFDcEJBLFVBQVUsR0FBRyxJQUFJO01BQ2pCLEtBQU0sSUFBSVgsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHRCxPQUFPLENBQUNFLE1BQU0sRUFBRUQsQ0FBQyxFQUFFLEVBQUc7UUFDekMsSUFBS0QsT0FBTyxDQUFFQyxDQUFDLENBQUUsQ0FBQ1ksQ0FBQyxHQUFHSixNQUFNLEVBQUc7VUFDN0JHLFVBQVUsR0FBRyxLQUFLO1FBQ3BCO01BQ0Y7TUFDQSxJQUFLLENBQUNBLFVBQVUsRUFBRztRQUNqQixLQUFNLElBQUlYLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR0QsT0FBTyxDQUFDRSxNQUFNLEVBQUVELENBQUMsRUFBRSxFQUFHO1VBQ3pDLE1BQU1hLE1BQU0sR0FBR2QsT0FBTyxDQUFFQyxDQUFDLENBQUU7VUFDM0JhLE1BQU0sQ0FBQ0QsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxDQUFDO1VBQzNCLElBQUtDLE1BQU0sQ0FBQ0QsQ0FBQyxHQUFHLENBQUNILElBQUksQ0FBQ0MsRUFBRSxHQUFHLElBQUksRUFBRztZQUNoQ0csTUFBTSxDQUFDRCxDQUFDLElBQUlILElBQUksQ0FBQ0MsRUFBRSxHQUFHLENBQUM7VUFDekI7UUFDRjtNQUNGO0lBQ0Y7SUFFQSxJQUFJLENBQUMzQixpQkFBaUIsQ0FBQytCLElBQUksQ0FBRXJDLE1BQU0sQ0FBQ3NDLGNBQWUsQ0FBQztFQUN0RDs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxPQUFPQSxjQUFjQSxDQUFFQyxTQUFTLEVBQUVDLFNBQVMsRUFBRztJQUM1QyxNQUFNQyxNQUFNLEdBQUdGLFNBQVMsQ0FBQ2IsVUFBVSxDQUFDUyxDQUFDO0lBQ3JDLE1BQU1PLE1BQU0sR0FBR0YsU0FBUyxDQUFDZCxVQUFVLENBQUNTLENBQUM7O0lBRXJDO0lBQ0E7SUFDQTtJQUNBLElBQUtILElBQUksQ0FBQ1csR0FBRyxDQUFFRixNQUFNLEdBQUdDLE1BQU8sQ0FBQyxHQUFHLElBQUksSUFDaENELE1BQU0sS0FBS0MsTUFBTSxJQUFNSCxTQUFTLENBQUNLLElBQUksQ0FBQ0MsT0FBTyxZQUFZL0MsSUFBTSxJQUFNMEMsU0FBUyxDQUFDSSxJQUFJLENBQUNDLE9BQU8sWUFBWS9DLElBQVEsRUFBRztNQUN2SCxPQUFPMkMsTUFBTSxHQUFHQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQztJQUNqQyxDQUFDLE1BQ0k7TUFDSCxNQUFNSSxVQUFVLEdBQUdQLFNBQVMsQ0FBQ2IsVUFBVSxDQUFDcUIsQ0FBQztNQUN6QyxNQUFNQyxVQUFVLEdBQUdSLFNBQVMsQ0FBQ2QsVUFBVSxDQUFDcUIsQ0FBQztNQUN6QyxJQUFLZixJQUFJLENBQUNXLEdBQUcsQ0FBRUcsVUFBVSxHQUFHRSxVQUFXLENBQUMsR0FBRyxJQUFJLEVBQUc7UUFDaEQsT0FBT0YsVUFBVSxHQUFHRSxVQUFVLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztNQUN6QyxDQUFDLE1BQ0k7UUFDSCxNQUFNQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUk7UUFDbEIsTUFBTUMsV0FBVyxHQUFHWCxTQUFTLENBQUNZLHFCQUFxQixDQUFDLENBQUMsQ0FBQ0MsVUFBVSxDQUFFSCxDQUFFLENBQUMsQ0FBRSxDQUFDLENBQUUsQ0FBQ0ksV0FBVyxDQUFFLENBQUUsQ0FBQztRQUMzRixNQUFNQyxXQUFXLEdBQUdkLFNBQVMsQ0FBQ1cscUJBQXFCLENBQUMsQ0FBQyxDQUFDQyxVQUFVLENBQUVILENBQUUsQ0FBQyxDQUFFLENBQUMsQ0FBRSxDQUFDSSxXQUFXLENBQUUsQ0FBRSxDQUFDO1FBQzNGLE9BQU9ILFdBQVcsR0FBR0ksV0FBVyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7TUFDM0M7SUFDRjtFQUNGOztFQUVBO0VBQ0FsQyxVQUFVQSxDQUFBLEVBQUc7SUFDWHBCLE1BQU0sQ0FBQ3VELElBQUksQ0FBQ25DLFVBQVUsQ0FBRSxJQUFLLENBQUM7RUFDaEM7O0VBRUE7RUFDQSxPQUFPbUMsSUFBSSxHQUFHLElBQUkzRCxJQUFJLENBQUVJLE1BQU8sQ0FBQztBQUNsQztBQUVBSCxJQUFJLENBQUMyRCxRQUFRLENBQUUsUUFBUSxFQUFFeEQsTUFBTyxDQUFDO0FBRWpDLGVBQWVBLE1BQU0iLCJpZ25vcmVMaXN0IjpbXX0=