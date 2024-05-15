// Copyright 2017-2024, University of Colorado Boulder

/**
 * A multigraph whose edges are segments.
 *
 * Supports general shape simplification, overlap/intersection removal and computation. General output would include
 * Shapes (from CAG - Constructive Area Geometry) and triangulations.
 *
 * See Graph.binaryResult for the general procedure for CAG.
 *
 * TODO: Use https://github.com/mauriciosantos/Buckets-JS for priority queue, implement simple sweep line https://github.com/phetsims/kite/issues/76
 *       with "enters" and "leaves" entries in the queue. When edge removed, remove "leave" from queue.
 *       and add any replacement edges. Applies to overlap and intersection handling.
 *       NOTE: This should impact performance a lot, as we are currently over-scanning and re-scanning a lot.
 *       Intersection is currently (by far?) the performance bottleneck.
 * TODO: Collapse non-Line adjacent edges together. Similar logic to overlap for each segment time, hopefully can
 *       factor this out.
 * TODO: Properly handle sorting edges around a vertex when two edges have the same tangent out. We'll need to use
 *       curvature, or do tricks to follow both curves by an 'epsilon' and sort based on that.
 * TODO: Consider separating out epsilon values (may be a general Kite thing rather than just ops)
 * TODO: Loop-Blinn output and constrained Delaunay triangulation
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Bounds2 from '../../../dot/js/Bounds2.js';
import Matrix3 from '../../../dot/js/Matrix3.js';
import Transform3 from '../../../dot/js/Transform3.js';
import Utils from '../../../dot/js/Utils.js';
import Vector2 from '../../../dot/js/Vector2.js';
import arrayRemove from '../../../phet-core/js/arrayRemove.js';
import cleanArray from '../../../phet-core/js/cleanArray.js';
import merge from '../../../phet-core/js/merge.js';
import { Arc, Boundary, Cubic, Edge, EdgeSegmentTree, EllipticalArc, Face, kite, Line, Loop, Segment, Subpath, Vertex, VertexSegmentTree } from '../imports.js';
let bridgeId = 0;
let globalId = 0;
const VERTEX_COLLAPSE_THRESHOLD_DISTANCE = 1e-5;
const INTERSECTION_ENDPOINT_THRESHOLD_DISTANCE = 0.1 * VERTEX_COLLAPSE_THRESHOLD_DISTANCE;
const SPLIT_ENDPOINT_THRESHOLD_DISTANCE = 0.01 * VERTEX_COLLAPSE_THRESHOLD_DISTANCE;
const T_THRESHOLD = 1e-6;
class Graph {
  /**
   * @public (kite-internal)
   */
  constructor() {
    // @public {Array.<Vertex>}
    this.vertices = [];

    // @public {Array.<Edge>}
    this.edges = [];

    // @public {Array.<Boundary>}
    this.innerBoundaries = [];
    this.outerBoundaries = [];
    this.boundaries = [];

    // @public {Array.<number>}
    this.shapeIds = [];

    // @public {Array.<Loop>}
    this.loops = [];

    // @public {Face}
    this.unboundedFace = Face.pool.create(null);

    // @public {Array.<Face>}
    this.faces = [this.unboundedFace];
  }

  /**
   * Returns an object form that can be turned back into a segment with the corresponding deserialize method.
   * @public
   *
   * @returns {Object}
   */
  serialize() {
    return {
      type: 'Graph',
      vertices: this.vertices.map(vertex => vertex.serialize()),
      edges: this.edges.map(edge => edge.serialize()),
      boundaries: this.boundaries.map(boundary => boundary.serialize()),
      innerBoundaries: this.innerBoundaries.map(boundary => boundary.id),
      outerBoundaries: this.outerBoundaries.map(boundary => boundary.id),
      shapeIds: this.shapeIds,
      loops: this.loops.map(loop => loop.serialize()),
      unboundedFace: this.unboundedFace.id,
      faces: this.faces.map(face => face.serialize())
    };
  }

  /**
   * Recreate a Graph based on serialized state from serialize()
   * @public
   *
   * @param {Object} obj
   */
  static deserialize(obj) {
    const graph = new Graph();
    const vertexMap = {};
    const edgeMap = {};
    const halfEdgeMap = {};
    const boundaryMap = {};
    const loopMap = {};
    const faceMap = {};
    graph.vertices = obj.vertices.map(data => {
      const vertex = new Vertex(Vector2.Vector2IO.fromStateObject(data.point));
      vertexMap[data.id] = vertex;
      // incidentHalfEdges connected below
      vertex.visited = data.visited;
      vertex.visitIndex = data.visitIndex;
      vertex.lowIndex = data.lowIndex;
      return vertex;
    });
    graph.edges = obj.edges.map(data => {
      const edge = new Edge(Segment.deserialize(data.segment), vertexMap[data.startVertex], vertexMap[data.endVertex]);
      edgeMap[data.id] = edge;
      edge.signedAreaFragment = data.signedAreaFragment;
      const deserializeHalfEdge = (halfEdge, halfEdgeData) => {
        halfEdgeMap[halfEdgeData.id] = halfEdge;
        // face connected later
        halfEdge.isReversed = halfEdgeData.isReversed;
        halfEdge.signedAreaFragment = halfEdgeData.signedAreaFragment;
        halfEdge.startVertex = vertexMap[halfEdgeData.startVertex.id];
        halfEdge.endVertex = vertexMap[halfEdgeData.endVertex.id];
        halfEdge.sortVector = Vector2.Vector2IO.fromStateObject(halfEdgeData.sortVector);
        halfEdge.data = halfEdgeData.data;
      };
      deserializeHalfEdge(edge.forwardHalf, data.forwardHalf);
      deserializeHalfEdge(edge.reversedHalf, data.reversedHalf);
      edge.visited = data.visited;
      edge.data = data.data;
      return edge;
    });

    // Connect Vertex incidentHalfEdges
    obj.vertices.forEach((data, i) => {
      const vertex = graph.vertices[i];
      vertex.incidentHalfEdges = data.incidentHalfEdges.map(id => halfEdgeMap[id]);
    });
    graph.boundaries = obj.boundaries.map(data => {
      const boundary = Boundary.pool.create(data.halfEdges.map(id => halfEdgeMap[id]));
      boundaryMap[data.id] = boundary;
      boundary.signedArea = data.signedArea;
      boundary.bounds = Bounds2.Bounds2IO.fromStateObject(data.bounds);
      // childBoundaries handled below
      return boundary;
    });
    obj.boundaries.forEach((data, i) => {
      const boundary = graph.boundaries[i];
      boundary.childBoundaries = data.childBoundaries.map(id => boundaryMap[id]);
    });
    graph.innerBoundaries = obj.innerBoundaries.map(id => boundaryMap[id]);
    graph.outerBoundaries = obj.outerBoundaries.map(id => boundaryMap[id]);
    graph.shapeIds = obj.shapeIds;
    graph.loops = obj.loops.map(data => {
      const loop = new Loop(data.shapeId, data.closed);
      loopMap[data.id] = loop;
      loop.halfEdges = data.halfEdges.map(id => halfEdgeMap[id]);
      return loop;
    });
    graph.faces = obj.faces.map((data, i) => {
      const face = i === 0 ? graph.unboundedFace : new Face(boundaryMap[data.boundary]);
      faceMap[data.id] = face;
      face.holes = data.holes.map(id => boundaryMap[id]);
      face.windingMap = data.windingMap;
      face.filled = data.filled;
      return face;
    });

    // Connected faces to halfEdges
    obj.edges.forEach((data, i) => {
      const edge = graph.edges[i];
      edge.forwardHalf.face = data.forwardHalf.face === null ? null : faceMap[data.forwardHalf.face];
      edge.reversedHalf.face = data.reversedHalf.face === null ? null : faceMap[data.reversedHalf.face];
    });
    return graph;
  }

  /**
   * Adds a Shape (with a given ID for CAG purposes) to the graph.
   * @public
   *
   * @param {number} shapeId - The ID which should be shared for all paths/shapes that should be combined with
   *                           respect to the winding number of faces. For CAG, independent shapes should be given
   *                           different IDs (so they have separate winding numbers recorded).
   * @param {Shape} shape
   * @param {Object} [options] - See addSubpath
   */
  addShape(shapeId, shape, options) {
    for (let i = 0; i < shape.subpaths.length; i++) {
      this.addSubpath(shapeId, shape.subpaths[i], options);
    }
  }

  /**
   * Adds a subpath of a Shape (with a given ID for CAG purposes) to the graph.
   * @public
   *
   * @param {number} shapeId - See addShape() documentation
   * @param {Subpath} subpath
   * @param {Object} [options]
   */
  addSubpath(shapeId, subpath, options) {
    assert && assert(typeof shapeId === 'number');
    assert && assert(subpath instanceof Subpath);
    options = merge({
      ensureClosed: true
    }, options);

    // Ensure the shapeId is recorded
    if (this.shapeIds.indexOf(shapeId) < 0) {
      this.shapeIds.push(shapeId);
    }
    if (subpath.segments.length === 0) {
      return;
    }
    const closed = subpath.closed || options.ensureClosed;
    const segments = options.ensureClosed ? subpath.getFillSegments() : subpath.segments;
    let index;

    // Collects all of the vertices
    const vertices = [];
    for (index = 0; index < segments.length; index++) {
      let previousIndex = index - 1;
      if (previousIndex < 0) {
        previousIndex = segments.length - 1;
      }

      // Get the end of the previous segment and start of the next. Generally they should be equal or almost equal,
      // as it's the point at the joint of two segments.
      let end = segments[previousIndex].end;
      const start = segments[index].start;

      // If we are creating an open "loop", don't interpolate the start/end of the entire subpath together.
      if (!closed && index === 0) {
        end = start;
      }

      // If they are exactly equal, don't take a chance on floating-point arithmetic
      if (start.equals(end)) {
        vertices.push(Vertex.pool.create(start));
      } else {
        assert && assert(start.distance(end) < 1e-5, 'Inaccurate start/end points');
        vertices.push(Vertex.pool.create(start.average(end)));
      }
    }
    if (!closed) {
      // If we aren't closed, create an "end" vertex since it may be different from the "start"
      vertices.push(Vertex.pool.create(segments[segments.length - 1].end));
    }

    // Create the loop object from the vertices, filling in edges
    const loop = Loop.pool.create(shapeId, closed);
    for (index = 0; index < segments.length; index++) {
      let nextIndex = index + 1;
      if (closed && nextIndex === segments.length) {
        nextIndex = 0;
      }
      const edge = Edge.pool.create(segments[index], vertices[index], vertices[nextIndex]);
      loop.halfEdges.push(edge.forwardHalf);
      this.addEdge(edge);
    }
    this.loops.push(loop);
    this.vertices.push(...vertices);
  }

  /**
   * Simplifies edges/vertices, computes boundaries and faces (with the winding map).
   * @public
   */
  computeSimplifiedFaces() {
    // Before we find any intersections (self-intersection or between edges), we'll want to identify and fix up
    // any cases where there are an infinite number of intersections between edges (they are continuously
    // overlapping). For any overlap, we'll split it into one "overlap" edge and any remaining edges. After this
    // process, there should be no continuous overlaps.
    this.eliminateOverlap();

    // Detects any edge self-intersection, and splits it into multiple edges. This currently happens with cubics only,
    // but needs to be done before we intersect those cubics with any other edges.
    this.eliminateSelfIntersection();

    // Find inter-edge intersections (that aren't at endpoints). Splits edges involved into the intersection. After
    // this pass, we should have a well-defined graph where in the planar embedding edges don't intersect or overlap.
    this.eliminateIntersection();

    // From the above process (and input), we may have multiple vertices that occupy essentially the same location.
    // These vertices get combined into one vertex in the location. If there was a mostly-degenerate edge that was
    // very small between edges, it will be removed.
    this.collapseVertices();

    // Our graph can end up with edges that would have the same face on both sides (are considered a "bridge" edge).
    // These need to be removed, so that our face handling logic doesn't have to handle another class of cases.
    this.removeBridges();

    // Vertices can be left over where they have less than 2 incident edges, and they can be safely removed (since
    // they won't contribute to the area output).
    this.removeLowOrderVertices();

    // // TODO: Why does this resolve some things? It seems like it should be unnecessary. https://github.com/phetsims/kite/issues/98
    // this.eliminateIntersection();
    // this.collapseVertices();
    // this.removeBridges();
    // this.removeLowOrderVertices();

    // Now that the graph has well-defined vertices and edges (2-edge-connected, nonoverlapping), we'll want to know
    // the order of edges around a vertex (if you rotate around a vertex, what edges are in what order?).
    this.orderVertexEdges();

    // Extracts boundaries and faces, by following each half-edge counter-clockwise, and faces are created for
    // boundaries that have positive signed area.
    this.extractFaces();

    // We need to determine which boundaries are holes for each face. This creates a "boundary tree" where the nodes
    // are boundaries. All connected components should be one face and its holes. The holes get stored on the
    // respective face.
    this.computeBoundaryTree();

    // Compute the winding numbers of each face for each shapeId, to determine whether the input would have that
    // face "filled". It should then be ready for future processing.
    this.computeWindingMap();
  }

  /**
   * Sets whether each face should be filled or unfilled based on a filter function.
   * @public
   *
   * The windingMapFilter will be called on each face's winding map, and will use the return value as whether the face
   * is filled or not.
   *
   * The winding map is an {Object} associated with each face that has a key for every shapeId that was used in
   * addShape/addSubpath, and the value for those keys is the winding number of the face given all paths with the
   * shapeId.
   *
   * For example, imagine you added two shapeIds (0 and 1), and the iteration is on a face that is included in
   * one loop specified with shapeId:0 (inside a counter-clockwise curve), and is outside of any segments specified
   * by the second loop (shapeId:1). Then the winding map will be:
   * {
   *   0: 1 // shapeId:0 has a winding number of 1 for this face (generally filled)
   *   1: 0 // shapeId:1 has a winding number of 0 for this face (generally not filled)
   * }
   *
   * Generally, winding map filters can be broken down into two steps:
   * 1. Given the winding number for each shapeId, compute whether that loop was originally filled. Normally, this is
   *    done with a non-zero rule (any winding number is filled, except zero). SVG also provides an even-odd rule
   *    (odd numbers are filled, even numbers are unfilled).
   * 2. Given booleans for each shapeId from step 1, compute CAG operations based on boolean formulas. Say you wanted
   *    to take the union of shapeIds 0 and 1, then remove anything in shapeId 2. Given the booleans above, this can
   *    be directly computed as (filled0 || filled1) && !filled2.
   *
   * @param {function} windingMapFilter
   */
  computeFaceInclusion(windingMapFilter) {
    for (let i = 0; i < this.faces.length; i++) {
      const face = this.faces[i];
      face.filled = windingMapFilter(face.windingMap);
    }
  }

  /**
   * Create a new Graph object based only on edges in this graph that separate a "filled" face from an "unfilled"
   * face.
   * @public
   *
   * This is a convenient way to "collapse" adjacent filled and unfilled faces together, and compute the curves and
   * holes properly, given a filled "normal" graph.
   */
  createFilledSubGraph() {
    const graph = new Graph();
    const vertexMap = {}; // old id => newVertex

    for (let i = 0; i < this.edges.length; i++) {
      const edge = this.edges[i];
      if (edge.forwardHalf.face.filled !== edge.reversedHalf.face.filled) {
        if (!vertexMap[edge.startVertex.id]) {
          const newStartVertex = Vertex.pool.create(edge.startVertex.point);
          graph.vertices.push(newStartVertex);
          vertexMap[edge.startVertex.id] = newStartVertex;
        }
        if (!vertexMap[edge.endVertex.id]) {
          const newEndVertex = Vertex.pool.create(edge.endVertex.point);
          graph.vertices.push(newEndVertex);
          vertexMap[edge.endVertex.id] = newEndVertex;
        }
        const startVertex = vertexMap[edge.startVertex.id];
        const endVertex = vertexMap[edge.endVertex.id];
        graph.addEdge(Edge.pool.create(edge.segment, startVertex, endVertex));
      }
    }

    // Run some more "simplified" processing on this graph to determine which faces are filled (after simplification).
    // We don't need the intersection or other processing steps, since this was accomplished (presumably) already
    // for the given graph.
    graph.collapseAdjacentEdges();
    graph.orderVertexEdges();
    graph.extractFaces();
    graph.computeBoundaryTree();
    graph.fillAlternatingFaces();
    return graph;
  }

  /**
   * Returns a Shape that creates a subpath for each filled face (with the desired holes).
   * @public
   *
   * Generally should be called on a graph created with createFilledSubGraph().
   *
   * @returns {Shape}
   */
  facesToShape() {
    const subpaths = [];
    for (let i = 0; i < this.faces.length; i++) {
      const face = this.faces[i];
      if (face.filled) {
        subpaths.push(face.boundary.toSubpath());
        for (let j = 0; j < face.holes.length; j++) {
          subpaths.push(face.holes[j].toSubpath());
        }
      }
    }
    return new kite.Shape(subpaths);
  }

  /**
   * Releases owned objects to their pools, and clears references that may have been picked up from external sources.
   * @public
   */
  dispose() {
    // this.boundaries should contain all elements of innerBoundaries and outerBoundaries
    while (this.boundaries.length) {
      this.boundaries.pop().dispose();
    }
    cleanArray(this.innerBoundaries);
    cleanArray(this.outerBoundaries);
    while (this.loops.length) {
      this.loops.pop().dispose();
    }
    while (this.faces.length) {
      this.faces.pop().dispose();
    }
    while (this.vertices.length) {
      this.vertices.pop().dispose();
    }
    while (this.edges.length) {
      this.edges.pop().dispose();
    }
  }

  /**
   * Adds an edge to the graph (and sets up connection information).
   * @private
   *
   * @param {Edge} edge
   */
  addEdge(edge) {
    assert && assert(edge instanceof Edge);
    assert && assert(!_.includes(edge.startVertex.incidentHalfEdges, edge.reversedHalf), 'Should not already be connected');
    assert && assert(!_.includes(edge.endVertex.incidentHalfEdges, edge.forwardHalf), 'Should not already be connected');
    this.edges.push(edge);
    edge.startVertex.incidentHalfEdges.push(edge.reversedHalf);
    edge.endVertex.incidentHalfEdges.push(edge.forwardHalf);
  }

  /**
   * Removes an edge from the graph (and disconnects incident information).
   * @private
   *
   * @param {Edge} edge
   */
  removeEdge(edge) {
    assert && assert(edge instanceof Edge);
    arrayRemove(this.edges, edge);
    arrayRemove(edge.startVertex.incidentHalfEdges, edge.reversedHalf);
    arrayRemove(edge.endVertex.incidentHalfEdges, edge.forwardHalf);
  }

  /**
   * Replaces a single edge (in loops) with a series of edges (possibly empty).
   * @private
   *
   * @param {Edge} edge
   * @param {Array.<HalfEdge>} forwardHalfEdges
   */
  replaceEdgeInLoops(edge, forwardHalfEdges) {
    // Compute reversed half-edges
    const reversedHalfEdges = [];
    for (let i = 0; i < forwardHalfEdges.length; i++) {
      reversedHalfEdges.push(forwardHalfEdges[forwardHalfEdges.length - 1 - i].getReversed());
    }
    for (let i = 0; i < this.loops.length; i++) {
      const loop = this.loops[i];
      for (let j = loop.halfEdges.length - 1; j >= 0; j--) {
        const halfEdge = loop.halfEdges[j];
        if (halfEdge.edge === edge) {
          const replacementHalfEdges = halfEdge === edge.forwardHalf ? forwardHalfEdges : reversedHalfEdges;
          Array.prototype.splice.apply(loop.halfEdges, [j, 1].concat(replacementHalfEdges));
        }
      }
    }
  }

  /**
   * Tries to combine adjacent edges (with a 2-order vertex) into one edge where possible.
   * @private
   *
   * This helps to combine things like collinear lines, where there's a vertex that can basically be removed.
   */
  collapseAdjacentEdges() {
    let needsLoop = true;
    while (needsLoop) {
      needsLoop = false;
      for (let i = 0; i < this.vertices.length; i++) {
        const vertex = this.vertices[i];
        if (vertex.incidentHalfEdges.length === 2) {
          const aEdge = vertex.incidentHalfEdges[0].edge;
          const bEdge = vertex.incidentHalfEdges[1].edge;
          let aSegment = aEdge.segment;
          let bSegment = bEdge.segment;
          const aVertex = aEdge.getOtherVertex(vertex);
          const bVertex = bEdge.getOtherVertex(vertex);
          assert && assert(this.loops.length === 0);

          // TODO: Can we avoid this in the inner loop? https://github.com/phetsims/kite/issues/76
          if (aEdge.startVertex === vertex) {
            aSegment = aSegment.reversed();
          }
          if (bEdge.endVertex === vertex) {
            bSegment = bSegment.reversed();
          }
          if (aSegment instanceof Line && bSegment instanceof Line) {
            // See if the lines are collinear, so that we can combine them into one edge
            if (aSegment.tangentAt(0).normalized().distance(bSegment.tangentAt(0).normalized()) < 1e-6) {
              this.removeEdge(aEdge);
              this.removeEdge(bEdge);
              aEdge.dispose();
              bEdge.dispose();
              arrayRemove(this.vertices, vertex);
              vertex.dispose();
              const newSegment = new Line(aVertex.point, bVertex.point);
              this.addEdge(new Edge(newSegment, aVertex, bVertex));
              needsLoop = true;
              break;
            }
          }
        }
      }
    }
  }

  /**
   * Gets rid of overlapping segments by combining overlaps into a shared edge.
   * @private
   */
  eliminateOverlap() {
    // We'll expand bounds by this amount, so that "adjacent" bounds (with a potentially overlapping vertical or
    // horizontal line) will have a non-zero amount of area overlapping.
    const epsilon = 1e-4;

    // Our queue will store entries of { start: boolean, edge: Edge }, representing a sweep line similar to the
    // Bentley-Ottmann approach. We'll track which edges are passing through the sweep line.
    const queue = new window.FlatQueue();

    // Tracks which edges are through the sweep line, but in a graph structure like a segment/interval tree, so that we
    // can have fast lookup (what edges are in a certain range) and also fast inserts/removals.
    const segmentTree = new EdgeSegmentTree(epsilon);

    // Assorted operations use a shortcut to "tag" edges with a unique ID, to indicate it has already been processed
    // for this call of eliminateOverlap(). This is a higher-performance option to storing an array of "already
    // processed" edges.
    const nextId = globalId++;

    // Adds an edge to the queue
    const addToQueue = edge => {
      const bounds = edge.segment.bounds;

      // TODO: see if object allocations are slow here https://github.com/phetsims/kite/issues/76
      queue.push({
        start: true,
        edge: edge
      }, bounds.minY - epsilon);
      queue.push({
        start: false,
        edge: edge
      }, bounds.maxY + epsilon);
    };

    // Removes an edge from the queue (effectively... when we pop from the queue, we'll check its ID data, and if it was
    // "removed" we will ignore it. Higher-performance than using an array.
    const removeFromQueue = edge => {
      // Store the ID so we can have a high-performance removal
      edge.internalData.removedId = nextId;
    };
    for (let i = 0; i < this.edges.length; i++) {
      addToQueue(this.edges[i]);
    }

    // We track edges to dispose separately, instead of synchronously disposing them. This is mainly due to the trick of
    // removal IDs, since if we re-used pooled Edges when creating, they would still have the ID OR they would lose the
    // "removed" information.
    const edgesToDispose = [];
    while (queue.length) {
      const entry = queue.pop();
      const edge = entry.edge;

      // Skip edges we already removed
      if (edge.internalData.removedId === nextId) {
        continue;
      }
      if (entry.start) {
        // We'll bail out of the loop if we find overlaps, and we'll store the relevant information in these
        let found = false;
        let overlappedEdge;
        let addedEdges;

        // TODO: Is this closure killing performance? https://github.com/phetsims/kite/issues/76
        segmentTree.query(edge, otherEdge => {
          const overlaps = edge.segment.getOverlaps(otherEdge.segment);
          if (overlaps !== null && overlaps.length) {
            for (let k = 0; k < overlaps.length; k++) {
              const overlap = overlaps[k];
              if (Math.abs(overlap.t1 - overlap.t0) > 1e-5 && Math.abs(overlap.qt1 - overlap.qt0) > 1e-5) {
                addedEdges = this.splitOverlap(edge, otherEdge, overlap);
                found = true;
                overlappedEdge = otherEdge;
                return true;
              }
            }
          }
          return false;
        });
        if (found) {
          // We haven't added our edge yet, so no need to remove it.
          segmentTree.removeItem(overlappedEdge);

          // Adjust the queue
          removeFromQueue(overlappedEdge);
          removeFromQueue(edge);
          for (let i = 0; i < addedEdges.length; i++) {
            addToQueue(addedEdges[i]);
          }
          edgesToDispose.push(edge);
          edgesToDispose.push(overlappedEdge);
        } else {
          // No overlaps found, add it and continue
          segmentTree.addItem(edge);
        }
      } else {
        // Removal can't trigger an intersection, so we can safely remove it
        segmentTree.removeItem(edge);
      }
    }
    for (let i = 0; i < edgesToDispose.length; i++) {
      edgesToDispose[i].dispose();
    }
  }

  /**
   * Splits/combines edges when there is an overlap of two edges (two edges who have an infinite number of
   * intersection points).
   * @private
   *
   * NOTE: This does NOT dispose aEdge/bEdge, due to eliminateOverlap's needs.
   *
   * Generally this creates an edge for the "shared" part of both segments, and then creates edges for the parts
   * outside of the shared region, connecting them together.
   *
   * @param {Edge} aEdge
   * @param {Edge} bEdge
   * @param {Overlap} overlap
   * @returns {Array.<Edge>}
   */
  splitOverlap(aEdge, bEdge, overlap) {
    const newEdges = [];
    const aSegment = aEdge.segment;
    const bSegment = bEdge.segment;

    // Remove the edges from before
    this.removeEdge(aEdge);
    this.removeEdge(bEdge);
    let t0 = overlap.t0;
    let t1 = overlap.t1;
    let qt0 = overlap.qt0;
    let qt1 = overlap.qt1;

    // Apply rounding so we don't generate really small segments on the ends
    if (t0 < 1e-5) {
      t0 = 0;
    }
    if (t1 > 1 - 1e-5) {
      t1 = 1;
    }
    if (qt0 < 1e-5) {
      qt0 = 0;
    }
    if (qt1 > 1 - 1e-5) {
      qt1 = 1;
    }

    // Whether there will be remaining edges on each side.
    const aBefore = t0 > 0 ? aSegment.subdivided(t0)[0] : null;
    const bBefore = qt0 > 0 ? bSegment.subdivided(qt0)[0] : null;
    const aAfter = t1 < 1 ? aSegment.subdivided(t1)[1] : null;
    const bAfter = qt1 < 1 ? bSegment.subdivided(qt1)[1] : null;
    let middle = aSegment;
    if (t0 > 0) {
      middle = middle.subdivided(t0)[1];
    }
    if (t1 < 1) {
      middle = middle.subdivided(Utils.linear(t0, 1, 0, 1, t1))[0];
    }
    let beforeVertex;
    if (aBefore && bBefore) {
      beforeVertex = Vertex.pool.create(middle.start);
      this.vertices.push(beforeVertex);
    } else if (aBefore) {
      beforeVertex = overlap.a > 0 ? bEdge.startVertex : bEdge.endVertex;
    } else {
      beforeVertex = aEdge.startVertex;
    }
    let afterVertex;
    if (aAfter && bAfter) {
      afterVertex = Vertex.pool.create(middle.end);
      this.vertices.push(afterVertex);
    } else if (aAfter) {
      afterVertex = overlap.a > 0 ? bEdge.endVertex : bEdge.startVertex;
    } else {
      afterVertex = aEdge.endVertex;
    }
    const middleEdge = Edge.pool.create(middle, beforeVertex, afterVertex);
    newEdges.push(middleEdge);
    let aBeforeEdge;
    let aAfterEdge;
    let bBeforeEdge;
    let bAfterEdge;

    // Add "leftover" edges
    if (aBefore) {
      aBeforeEdge = Edge.pool.create(aBefore, aEdge.startVertex, beforeVertex);
      newEdges.push(aBeforeEdge);
    }
    if (aAfter) {
      aAfterEdge = Edge.pool.create(aAfter, afterVertex, aEdge.endVertex);
      newEdges.push(aAfterEdge);
    }
    if (bBefore) {
      bBeforeEdge = Edge.pool.create(bBefore, bEdge.startVertex, overlap.a > 0 ? beforeVertex : afterVertex);
      newEdges.push(bBeforeEdge);
    }
    if (bAfter) {
      bAfterEdge = Edge.pool.create(bAfter, overlap.a > 0 ? afterVertex : beforeVertex, bEdge.endVertex);
      newEdges.push(bAfterEdge);
    }
    for (let i = 0; i < newEdges.length; i++) {
      this.addEdge(newEdges[i]);
    }

    // Collect "replacement" edges
    const aEdges = (aBefore ? [aBeforeEdge] : []).concat([middleEdge]).concat(aAfter ? [aAfterEdge] : []);
    const bEdges = (bBefore ? [bBeforeEdge] : []).concat([middleEdge]).concat(bAfter ? [bAfterEdge] : []);
    const aForwardHalfEdges = [];
    const bForwardHalfEdges = [];
    for (let i = 0; i < aEdges.length; i++) {
      aForwardHalfEdges.push(aEdges[i].forwardHalf);
    }
    for (let i = 0; i < bEdges.length; i++) {
      // Handle reversing the "middle" edge
      const isForward = bEdges[i] !== middleEdge || overlap.a > 0;
      bForwardHalfEdges.push(isForward ? bEdges[i].forwardHalf : bEdges[i].reversedHalf);
    }

    // Replace edges in the loops
    this.replaceEdgeInLoops(aEdge, aForwardHalfEdges);
    this.replaceEdgeInLoops(bEdge, bForwardHalfEdges);
    return newEdges;
  }

  /**
   * Handles splitting of self-intersection of segments (happens with Cubics).
   * @private
   */
  eliminateSelfIntersection() {
    assert && assert(this.boundaries.length === 0, 'Only handles simpler level primitive splitting right now');
    for (let i = this.edges.length - 1; i >= 0; i--) {
      const edge = this.edges[i];
      const segment = edge.segment;
      if (segment instanceof Cubic) {
        // TODO: This might not properly handle when it only one endpoint is on the curve https://github.com/phetsims/kite/issues/76
        const selfIntersection = segment.getSelfIntersection();
        if (selfIntersection) {
          assert && assert(selfIntersection.aT < selfIntersection.bT);
          const segments = segment.subdivisions([selfIntersection.aT, selfIntersection.bT]);
          const vertex = Vertex.pool.create(selfIntersection.point);
          this.vertices.push(vertex);
          const startEdge = Edge.pool.create(segments[0], edge.startVertex, vertex);
          const middleEdge = Edge.pool.create(segments[1], vertex, vertex);
          const endEdge = Edge.pool.create(segments[2], vertex, edge.endVertex);
          this.removeEdge(edge);
          this.addEdge(startEdge);
          this.addEdge(middleEdge);
          this.addEdge(endEdge);
          this.replaceEdgeInLoops(edge, [startEdge.forwardHalf, middleEdge.forwardHalf, endEdge.forwardHalf]);
          edge.dispose();
        }
      }
    }
  }

  /**
   * Replace intersections between different segments by splitting them and creating a vertex.
   * @private
   */
  eliminateIntersection() {
    // We'll expand bounds by this amount, so that "adjacent" bounds (with a potentially overlapping vertical or
    // horizontal line) will have a non-zero amount of area overlapping.
    const epsilon = 1e-4;

    // Our queue will store entries of { start: boolean, edge: Edge }, representing a sweep line similar to the
    // Bentley-Ottmann approach. We'll track which edges are passing through the sweep line.
    const queue = new window.FlatQueue();

    // Tracks which edges are through the sweep line, but in a graph structure like a segment/interval tree, so that we
    // can have fast lookup (what edges are in a certain range) and also fast inserts/removals.
    const segmentTree = new EdgeSegmentTree(epsilon);

    // Assorted operations use a shortcut to "tag" edges with a unique ID, to indicate it has already been processed
    // for this call of eliminateOverlap(). This is a higher-performance option to storing an array of "already
    // processed" edges.
    const nextId = globalId++;

    // Adds an edge to the queue
    const addToQueue = edge => {
      const bounds = edge.segment.bounds;

      // TODO: see if object allocations are slow here https://github.com/phetsims/kite/issues/76
      queue.push({
        start: true,
        edge: edge
      }, bounds.minY - epsilon);
      queue.push({
        start: false,
        edge: edge
      }, bounds.maxY + epsilon);
    };

    // Removes an edge from the queue (effectively... when we pop from the queue, we'll check its ID data, and if it was
    // "removed" we will ignore it. Higher-performance than using an array.
    const removeFromQueue = edge => {
      // Store the ID so we can have a high-performance removal
      edge.internalData.removedId = nextId;
    };
    for (let i = 0; i < this.edges.length; i++) {
      addToQueue(this.edges[i]);
    }

    // We track edges to dispose separately, instead of synchronously disposing them. This is mainly due to the trick of
    // removal IDs, since if we re-used pooled Edges when creating, they would still have the ID OR they would lose the
    // "removed" information.
    const edgesToDispose = [];
    while (queue.length) {
      const entry = queue.pop();
      const edge = entry.edge;

      // Skip edges we already removed
      if (edge.internalData.removedId === nextId) {
        continue;
      }
      if (entry.start) {
        // We'll bail out of the loop if we find overlaps, and we'll store the relevant information in these
        let found = false;
        let overlappedEdge;
        let addedEdges;
        let removedEdges;

        // TODO: Is this closure killing performance? https://github.com/phetsims/kite/issues/76
        segmentTree.query(edge, otherEdge => {
          const aSegment = edge.segment;
          const bSegment = otherEdge.segment;
          let intersections = Segment.intersect(aSegment, bSegment);
          intersections = intersections.filter(intersection => {
            const point = intersection.point;

            // Filter out endpoint-to-endpoint intersections, and at a radius where they would get collapsed into an
            // endpoint anyway. If it's "internal" to one segment, we'll keep it.
            return Graph.isInternal(point, intersection.aT, aSegment, INTERSECTION_ENDPOINT_THRESHOLD_DISTANCE, T_THRESHOLD) || Graph.isInternal(point, intersection.bT, bSegment, INTERSECTION_ENDPOINT_THRESHOLD_DISTANCE, T_THRESHOLD);
          });
          if (intersections.length) {
            // TODO: In the future, handle multiple intersections (instead of re-running) https://github.com/phetsims/kite/issues/76
            const intersection = intersections[0];
            const result = this.simpleSplit(edge, otherEdge, intersection.aT, intersection.bT, intersection.point);
            if (result) {
              found = true;
              overlappedEdge = otherEdge;
              addedEdges = result.addedEdges;
              removedEdges = result.removedEdges;
              return true;
            }
          }
          return false;
        });
        if (found) {
          // If we didn't "remove" that edge, we'll still need to add it in.
          if (removedEdges.includes(edge)) {
            removeFromQueue(edge);
            edgesToDispose.push(edge);
          } else {
            segmentTree.addItem(edge);
          }
          if (removedEdges.includes(overlappedEdge)) {
            segmentTree.removeItem(overlappedEdge);
            removeFromQueue(overlappedEdge);
            edgesToDispose.push(overlappedEdge);
          }

          // Adjust the queue
          for (let i = 0; i < addedEdges.length; i++) {
            addToQueue(addedEdges[i]);
          }
        } else {
          // No overlaps found, add it and continue
          segmentTree.addItem(edge);
        }
      } else {
        // Removal can't trigger an intersection, so we can safely remove it
        segmentTree.removeItem(edge);
      }
    }
    for (let i = 0; i < edgesToDispose.length; i++) {
      edgesToDispose[i].dispose();
    }
  }

  /**
   * Handles splitting two intersecting edges.
   * @private
   *
   * @param {Edge} aEdge
   * @param {Edge} bEdge
   * @param {number} aT - Parametric t value of the intersection for aEdge
   * @param {number} bT - Parametric t value of the intersection for bEdge
   * @param {Vector2} point - Location of the intersection
   *
   * @returns {{addedEdges: Edge[], removedEdges: Edge[]}|null}
   */
  simpleSplit(aEdge, bEdge, aT, bT, point) {
    const aInternal = Graph.isInternal(point, aT, aEdge.segment, SPLIT_ENDPOINT_THRESHOLD_DISTANCE, T_THRESHOLD);
    const bInternal = Graph.isInternal(point, bT, bEdge.segment, SPLIT_ENDPOINT_THRESHOLD_DISTANCE, T_THRESHOLD);
    let vertex = null;
    if (!aInternal) {
      vertex = aT < 0.5 ? aEdge.startVertex : aEdge.endVertex;
    } else if (!bInternal) {
      vertex = bT < 0.5 ? bEdge.startVertex : bEdge.endVertex;
    } else {
      vertex = Vertex.pool.create(point);
      this.vertices.push(vertex);
    }
    let changed = false;
    const addedEdges = [];
    const removedEdges = [];
    if (aInternal && vertex !== aEdge.startVertex && vertex !== aEdge.endVertex) {
      addedEdges.push(...this.splitEdge(aEdge, aT, vertex));
      removedEdges.push(aEdge);
      changed = true;
    }
    if (bInternal && vertex !== bEdge.startVertex && vertex !== bEdge.endVertex) {
      addedEdges.push(...this.splitEdge(bEdge, bT, vertex));
      removedEdges.push(bEdge);
      changed = true;
    }
    return changed ? {
      addedEdges: addedEdges,
      removedEdges: removedEdges
    } : null;
  }

  /**
   * Splits an edge into two edges at a specific parametric t value.
   * @private
   *
   * @param {Edge} edge
   * @param {number} t
   * @param {Vertex} vertex - The vertex that is placed at the split location
   */
  splitEdge(edge, t, vertex) {
    assert && assert(this.boundaries.length === 0, 'Only handles simpler level primitive splitting right now');
    assert && assert(edge.startVertex !== vertex);
    assert && assert(edge.endVertex !== vertex);
    const segments = edge.segment.subdivided(t);
    assert && assert(segments.length === 2);
    const firstEdge = Edge.pool.create(segments[0], edge.startVertex, vertex);
    const secondEdge = Edge.pool.create(segments[1], vertex, edge.endVertex);

    // Remove old connections
    this.removeEdge(edge);

    // Add new connections
    this.addEdge(firstEdge);
    this.addEdge(secondEdge);
    this.replaceEdgeInLoops(edge, [firstEdge.forwardHalf, secondEdge.forwardHalf]);
    return [firstEdge, secondEdge];
  }

  /**
   * Combine vertices that are almost exactly in the same place (removing edges and vertices where necessary).
   * @private
   */
  collapseVertices() {
    assert && assert(_.every(this.edges, edge => _.includes(this.vertices, edge.startVertex)));
    assert && assert(_.every(this.edges, edge => _.includes(this.vertices, edge.endVertex)));

    // We'll expand bounds by this amount, so that "adjacent" bounds (with a potentially overlapping vertical or
    // horizontal line) will have a non-zero amount of area overlapping.
    const epsilon = 10 * VERTEX_COLLAPSE_THRESHOLD_DISTANCE; // TODO: could we reduce this factor to closer to the distance? https://github.com/phetsims/kite/issues/98

    // Our queue will store entries of { start: boolean, vertex: Vertex }, representing a sweep line similar to the
    // Bentley-Ottmann approach. We'll track which edges are passing through the sweep line.
    const queue = new window.FlatQueue();

    // Tracks which vertices are through the sweep line, but in a graph structure like a segment/interval tree, so that
    // we can have fast lookup (what vertices are in a certain range) and also fast inserts/removals.
    const segmentTree = new VertexSegmentTree(epsilon);

    // Assorted operations use a shortcut to "tag" vertices with a unique ID, to indicate it has already been processed
    // for this call of eliminateOverlap(). This is a higher-performance option to storing an array of "already
    // processed" edges.
    const nextId = globalId++;

    // Adds an vertex to the queue
    const addToQueue = vertex => {
      // TODO: see if object allocations are slow here https://github.com/phetsims/kite/issues/76
      queue.push({
        start: true,
        vertex: vertex
      }, vertex.point.y - epsilon);
      queue.push({
        start: false,
        vertex: vertex
      }, vertex.point.y + epsilon);
    };

    // Removes a vertex from the queue (effectively... when we pop from the queue, we'll check its ID data, and if it
    // was "removed" we will ignore it. Higher-performance than using an array.
    const removeFromQueue = vertex => {
      // Store the ID so we can have a high-performance removal
      vertex.internalData.removedId = nextId;
    };
    for (let i = 0; i < this.vertices.length; i++) {
      addToQueue(this.vertices[i]);
    }

    // We track vertices to dispose separately, instead of synchronously disposing them. This is mainly due to the trick
    // of removal IDs, since if we re-used pooled Vertices when creating, they would still have the ID OR they would
    // lose the "removed" information.
    const verticesToDispose = [];
    while (queue.length) {
      const entry = queue.pop();
      const vertex = entry.vertex;

      // Skip vertices we already removed
      if (vertex.internalData.removedId === nextId) {
        continue;
      }
      if (entry.start) {
        // We'll bail out of the loop if we find overlaps, and we'll store the relevant information in these
        let found = false;
        let overlappedVertex;
        let addedVertices;

        // TODO: Is this closure killing performance? https://github.com/phetsims/kite/issues/76
        segmentTree.query(vertex, otherVertex => {
          const distance = vertex.point.distance(otherVertex.point);
          if (distance < VERTEX_COLLAPSE_THRESHOLD_DISTANCE) {
            const newVertex = Vertex.pool.create(distance === 0 ? vertex.point : vertex.point.average(otherVertex.point));
            this.vertices.push(newVertex);
            arrayRemove(this.vertices, vertex);
            arrayRemove(this.vertices, otherVertex);
            for (let k = this.edges.length - 1; k >= 0; k--) {
              const edge = this.edges[k];
              const startMatches = edge.startVertex === vertex || edge.startVertex === otherVertex;
              const endMatches = edge.endVertex === vertex || edge.endVertex === otherVertex;

              // Outright remove edges that were between A and B that aren't loops
              if (startMatches && endMatches) {
                if ((edge.segment.bounds.width > 1e-5 || edge.segment.bounds.height > 1e-5) && (edge.segment instanceof Cubic || edge.segment instanceof Arc || edge.segment instanceof EllipticalArc)) {
                  // Replace it with a new edge that is from the vertex to itself
                  const replacementEdge = Edge.pool.create(edge.segment, newVertex, newVertex);
                  this.addEdge(replacementEdge);
                  this.replaceEdgeInLoops(edge, [replacementEdge.forwardHalf]);
                } else {
                  this.replaceEdgeInLoops(edge, []); // remove the edge from loops with no replacement
                }
                this.removeEdge(edge);
                edge.dispose();
              } else if (startMatches) {
                edge.startVertex = newVertex;
                newVertex.incidentHalfEdges.push(edge.reversedHalf);
                edge.updateReferences();
              } else if (endMatches) {
                edge.endVertex = newVertex;
                newVertex.incidentHalfEdges.push(edge.forwardHalf);
                edge.updateReferences();
              }
            }
            addedVertices = [newVertex];
            found = true;
            overlappedVertex = otherVertex;
            return true;
          }
          return false;
        });
        if (found) {
          // We haven't added our edge yet, so no need to remove it.
          segmentTree.removeItem(overlappedVertex);

          // Adjust the queue
          removeFromQueue(overlappedVertex);
          removeFromQueue(vertex);
          for (let i = 0; i < addedVertices.length; i++) {
            addToQueue(addedVertices[i]);
          }
          verticesToDispose.push(vertex);
          verticesToDispose.push(overlappedVertex);
        } else {
          // No overlaps found, add it and continue
          segmentTree.addItem(vertex);
        }
      } else {
        // Removal can't trigger an intersection, so we can safely remove it
        segmentTree.removeItem(vertex);
      }
    }
    for (let i = 0; i < verticesToDispose.length; i++) {
      verticesToDispose[i].dispose();
    }
    assert && assert(_.every(this.edges, edge => _.includes(this.vertices, edge.startVertex)));
    assert && assert(_.every(this.edges, edge => _.includes(this.vertices, edge.endVertex)));
  }

  /**
   * Scan a given vertex for bridges recursively with a depth-first search.
   * @private
   *
   * Records visit times to each vertex, and back-propagates so that we can efficiently determine if there was another
   * path around to the vertex.
   *
   * Assumes this is only called one time once all edges/vertices are set up. Repeated calls will fail because we
   * don't mark visited/etc. references again on startup
   *
   * See Tarjan's algorithm for more information. Some modifications were needed, since this is technically a
   * multigraph/pseudograph (can have edges that have the same start/end vertex, and can have multiple edges
   * going from the same two vertices).
   *
   * @param {Array.<Edge>} bridges - Appends bridge edges to here.
   * @param {Vertex} vertex
   */
  markBridges(bridges, vertex) {
    vertex.visited = true;
    vertex.visitIndex = vertex.lowIndex = bridgeId++;
    for (let i = 0; i < vertex.incidentHalfEdges.length; i++) {
      const edge = vertex.incidentHalfEdges[i].edge;
      const childVertex = vertex.incidentHalfEdges[i].startVertex; // by definition, our vertex should be the endVertex
      if (!childVertex.visited) {
        edge.visited = true;
        childVertex.parent = vertex;
        this.markBridges(bridges, childVertex);

        // Check if there's another route that reaches back to our vertex from an ancestor
        vertex.lowIndex = Math.min(vertex.lowIndex, childVertex.lowIndex);

        // If there was no route, then we reached a bridge
        if (childVertex.lowIndex > vertex.visitIndex) {
          bridges.push(edge);
        }
      } else if (!edge.visited) {
        vertex.lowIndex = Math.min(vertex.lowIndex, childVertex.visitIndex);
      }
    }
  }

  /**
   * Removes edges that are the only edge holding two connected components together. Based on our problem, the
   * face on either side of the "bridge" edges would always be the same, so we can safely remove them.
   * @private
   */
  removeBridges() {
    const bridges = [];
    for (let i = 0; i < this.vertices.length; i++) {
      const vertex = this.vertices[i];
      if (!vertex.visited) {
        this.markBridges(bridges, vertex);
      }
    }
    for (let i = 0; i < bridges.length; i++) {
      const bridgeEdge = bridges[i];
      this.removeEdge(bridgeEdge);
      this.replaceEdgeInLoops(bridgeEdge, []);
      bridgeEdge.dispose();
    }
  }

  /**
   * Removes vertices that have order less than 2 (so either a vertex with one or zero edges adjacent).
   * @private
   */
  removeLowOrderVertices() {
    assert && assert(_.every(this.edges, edge => _.includes(this.vertices, edge.startVertex)));
    assert && assert(_.every(this.edges, edge => _.includes(this.vertices, edge.endVertex)));
    let needsLoop = true;
    while (needsLoop) {
      needsLoop = false;
      for (let i = this.vertices.length - 1; i >= 0; i--) {
        const vertex = this.vertices[i];
        if (vertex.incidentHalfEdges.length < 2) {
          // Disconnect any existing edges
          for (let j = 0; j < vertex.incidentHalfEdges.length; j++) {
            const edge = vertex.incidentHalfEdges[j].edge;
            this.removeEdge(edge);
            this.replaceEdgeInLoops(edge, []); // remove the edge from the loops
            edge.dispose();
          }

          // Remove the vertex
          this.vertices.splice(i, 1);
          vertex.dispose();
          needsLoop = true;
          break;
        }
      }
    }
    assert && assert(_.every(this.edges, edge => _.includes(this.vertices, edge.startVertex)));
    assert && assert(_.every(this.edges, edge => _.includes(this.vertices, edge.endVertex)));
  }

  /**
   * Sorts incident half-edges for each vertex.
   * @private
   */
  orderVertexEdges() {
    for (let i = 0; i < this.vertices.length; i++) {
      this.vertices[i].sortEdges();
    }
  }

  /**
   * Creates boundaries and faces by following each half-edge counter-clockwise
   * @private
   */
  extractFaces() {
    const halfEdges = [];
    for (let i = 0; i < this.edges.length; i++) {
      halfEdges.push(this.edges[i].forwardHalf);
      halfEdges.push(this.edges[i].reversedHalf);
    }
    while (halfEdges.length) {
      const boundaryHalfEdges = [];
      let halfEdge = halfEdges[0];
      const startingHalfEdge = halfEdge;
      while (halfEdge) {
        arrayRemove(halfEdges, halfEdge);
        boundaryHalfEdges.push(halfEdge);
        halfEdge = halfEdge.getNext();
        if (halfEdge === startingHalfEdge) {
          break;
        }
      }
      const boundary = Boundary.pool.create(boundaryHalfEdges);
      (boundary.signedArea > 0 ? this.innerBoundaries : this.outerBoundaries).push(boundary);
      this.boundaries.push(boundary);
    }
    for (let i = 0; i < this.innerBoundaries.length; i++) {
      this.faces.push(Face.pool.create(this.innerBoundaries[i]));
    }
  }

  /**
   * Given the inner and outer boundaries, it computes a tree representation to determine what boundaries are
   * holes of what other boundaries, then sets up face holes with the result.
   * @public
   *
   * This information is stored in the childBoundaries array of Boundary, and is then read out to set up faces.
   */
  computeBoundaryTree() {
    // TODO: detect "indeterminate" for robustness (and try new angles?) https://github.com/phetsims/kite/issues/76
    const unboundedHoles = []; // {Array.<Boundary>}

    // We'll want to compute a ray for each outer boundary that starts at an extreme point for that direction and
    // continues outwards. The next boundary it intersects will be linked together in the tree.
    // We have a mostly-arbitrary angle here that hopefully won't be used.
    const transform = new Transform3(Matrix3.rotation2(1.5729657));
    for (let i = 0; i < this.outerBoundaries.length; i++) {
      const outerBoundary = this.outerBoundaries[i];
      const ray = outerBoundary.computeExtremeRay(transform);
      let closestEdge = null;
      let closestDistance = Number.POSITIVE_INFINITY;
      let closestWind = false;
      for (let j = 0; j < this.edges.length; j++) {
        const edge = this.edges[j];
        const intersections = edge.segment.intersection(ray);
        for (let k = 0; k < intersections.length; k++) {
          const intersection = intersections[k];
          if (intersection.distance < closestDistance) {
            closestEdge = edge;
            closestDistance = intersection.distance;
            closestWind = intersection.wind;
          }
        }
      }
      if (closestEdge === null) {
        unboundedHoles.push(outerBoundary);
      } else {
        const reversed = closestWind < 0;
        const closestHalfEdge = reversed ? closestEdge.reversedHalf : closestEdge.forwardHalf;
        const closestBoundary = this.getBoundaryOfHalfEdge(closestHalfEdge);
        closestBoundary.childBoundaries.push(outerBoundary);
      }
    }
    unboundedHoles.forEach(this.unboundedFace.recursivelyAddHoles.bind(this.unboundedFace));
    for (let i = 0; i < this.faces.length; i++) {
      const face = this.faces[i];
      if (face.boundary !== null) {
        face.boundary.childBoundaries.forEach(face.recursivelyAddHoles.bind(face));
      }
    }
  }

  /**
   * Computes the winding map for each face, starting with 0 on the unbounded face (for each shapeId).
   * @private
   */
  computeWindingMap() {
    const edges = this.edges.slice();

    // Winding numbers for "outside" are 0.
    const outsideMap = {};
    for (let i = 0; i < this.shapeIds.length; i++) {
      outsideMap[this.shapeIds[i]] = 0;
    }
    this.unboundedFace.windingMap = outsideMap;

    // We have "solved" the unbounded face, and then iteratively go over the edges looking for a case where we have
    // solved one of the faces that is adjacent to that edge. We can then compute the difference between winding
    // numbers between the two faces, and thus determine the (absolute) winding numbers for the unsolved face.
    while (edges.length) {
      for (let j = edges.length - 1; j >= 0; j--) {
        const edge = edges[j];
        const forwardHalf = edge.forwardHalf;
        const reversedHalf = edge.reversedHalf;
        const forwardFace = forwardHalf.face;
        const reversedFace = reversedHalf.face;
        assert && assert(forwardFace !== reversedFace);
        const solvedForward = forwardFace.windingMap !== null;
        const solvedReversed = reversedFace.windingMap !== null;
        if (solvedForward && solvedReversed) {
          edges.splice(j, 1);
          if (assert) {
            for (let m = 0; m < this.shapeIds.length; m++) {
              const id = this.shapeIds[m];
              assert(forwardFace.windingMap[id] - reversedFace.windingMap[id] === this.computeDifferential(edge, id));
            }
          }
        } else if (!solvedForward && !solvedReversed) {
          continue;
        } else {
          const solvedFace = solvedForward ? forwardFace : reversedFace;
          const unsolvedFace = solvedForward ? reversedFace : forwardFace;
          const windingMap = {};
          for (let k = 0; k < this.shapeIds.length; k++) {
            const shapeId = this.shapeIds[k];
            const differential = this.computeDifferential(edge, shapeId);
            windingMap[shapeId] = solvedFace.windingMap[shapeId] + differential * (solvedForward ? -1 : 1);
          }
          unsolvedFace.windingMap = windingMap;
        }
      }
    }
  }

  /**
   * Computes the differential in winding numbers (forward face winding number minus the reversed face winding number)
   * ("forward face" is the face on the forward half-edge side, etc.)
   * @private
   *
   * @param {Edge} edge
   * @param {number} shapeId
   * @returns {number} - The difference between forward face and reversed face winding numbers.
   */
  computeDifferential(edge, shapeId) {
    let differential = 0; // forward face - reversed face
    for (let m = 0; m < this.loops.length; m++) {
      const loop = this.loops[m];
      assert && assert(loop.closed, 'This is only defined to work for closed loops');
      if (loop.shapeId !== shapeId) {
        continue;
      }
      for (let n = 0; n < loop.halfEdges.length; n++) {
        const loopHalfEdge = loop.halfEdges[n];
        if (loopHalfEdge === edge.forwardHalf) {
          differential++;
        } else if (loopHalfEdge === edge.reversedHalf) {
          differential--;
        }
      }
    }
    return differential;
  }

  /**
   * Sets the unbounded face as unfilled, and then sets each face's fill so that edges separate one filled face with
   * one unfilled face.
   * @private
   *
   * NOTE: Best to call this on the result from createFilledSubGraph(), since it should have guaranteed properties
   *       to make this consistent. Notably, all vertices need to have an even order (number of edges)
   */
  fillAlternatingFaces() {
    let nullFaceFilledCount = 0;
    for (let i = 0; i < this.faces.length; i++) {
      this.faces[i].filled = null;
      nullFaceFilledCount++;
    }
    this.unboundedFace.filled = false;
    nullFaceFilledCount--;
    while (nullFaceFilledCount) {
      for (let i = 0; i < this.edges.length; i++) {
        const edge = this.edges[i];
        const forwardFace = edge.forwardHalf.face;
        const reversedFace = edge.reversedHalf.face;
        const forwardNull = forwardFace.filled === null;
        const reversedNull = reversedFace.filled === null;
        if (forwardNull && !reversedNull) {
          forwardFace.filled = !reversedFace.filled;
          nullFaceFilledCount--;
        } else if (!forwardNull && reversedNull) {
          reversedFace.filled = !forwardFace.filled;
          nullFaceFilledCount--;
        }
      }
    }
  }

  /**
   * Returns the boundary that contains the specified half-edge.
   * @private
   *
   * TODO: find a better way, this is crazy inefficient https://github.com/phetsims/kite/issues/76
   *
   * @param {HalfEdge} halfEdge
   * @returns {Boundary}
   */
  getBoundaryOfHalfEdge(halfEdge) {
    for (let i = 0; i < this.boundaries.length; i++) {
      const boundary = this.boundaries[i];
      if (boundary.hasHalfEdge(halfEdge)) {
        return boundary;
      }
    }
    throw new Error('Could not find boundary');
  }

  // @public
  static isInternal(point, t, segment, distanceThreshold, tThreshold) {
    return t > tThreshold && t < 1 - tThreshold && point.distance(segment.start) > distanceThreshold && point.distance(segment.end) > distanceThreshold;
  }

  /**
   * "Union" binary winding map filter for use with Graph.binaryResult.
   * @public
   *
   * This combines both shapes together so that a point is in the resulting shape if it was in either of the input
   * shapes.
   *
   * @param {Object} windingMap - See computeFaceInclusion for more details
   * @returns {boolean}
   */
  static BINARY_NONZERO_UNION(windingMap) {
    return windingMap['0'] !== 0 || windingMap['1'] !== 0;
  }

  /**
   * "Intersection" binary winding map filter for use with Graph.binaryResult.
   * @public
   *
   * This combines both shapes together so that a point is in the resulting shape if it was in both of the input
   * shapes.
   *
   * @param {Object} windingMap - See computeFaceInclusion for more details
   * @returns {boolean}
   */
  static BINARY_NONZERO_INTERSECTION(windingMap) {
    return windingMap['0'] !== 0 && windingMap['1'] !== 0;
  }

  /**
   * "Difference" binary winding map filter for use with Graph.binaryResult.
   * @public
   *
   * This combines both shapes together so that a point is in the resulting shape if it was in the first shape AND
   * was NOT in the second shape.
   *
   * @param {Object} windingMap - See computeFaceInclusion for more details
   * @returns {boolean}
   */
  static BINARY_NONZERO_DIFFERENCE(windingMap) {
    return windingMap['0'] !== 0 && windingMap['1'] === 0;
  }

  /**
   * "XOR" binary winding map filter for use with Graph.binaryResult.
   * @public
   *
   * This combines both shapes together so that a point is in the resulting shape if it is only in exactly one of the
   * input shapes. It's like the union minus intersection.
   *
   * @param {Object} windingMap - See computeFaceInclusion for more details
   * @returns {boolean}
   */
  static BINARY_NONZERO_XOR(windingMap) {
    return (windingMap['0'] !== 0 ^ windingMap['1'] !== 0) === 1; // eslint-disable-line no-bitwise
  }

  /**
   * Returns the resulting Shape obtained by combining the two shapes given with the filter.
   * @public
   *
   * @param {Shape} shapeA
   * @param {Shape} shapeB
   * @param {function} windingMapFilter - See computeFaceInclusion for details on the format
   * @returns {Shape}
   */
  static binaryResult(shapeA, shapeB, windingMapFilter) {
    const graph = new Graph();
    graph.addShape(0, shapeA);
    graph.addShape(1, shapeB);
    graph.computeSimplifiedFaces();
    graph.computeFaceInclusion(windingMapFilter);
    const subgraph = graph.createFilledSubGraph();
    const shape = subgraph.facesToShape();
    graph.dispose();
    subgraph.dispose();
    return shape;
  }

  /**
   * Returns the union of an array of shapes.
   * @public
   *
   * @param {Array.<Shape>} shapes
   * @returns {Shape}
   */
  static unionNonZero(shapes) {
    const graph = new Graph();
    for (let i = 0; i < shapes.length; i++) {
      graph.addShape(i, shapes[i]);
    }
    graph.computeSimplifiedFaces();
    graph.computeFaceInclusion(windingMap => {
      for (let j = 0; j < shapes.length; j++) {
        if (windingMap[j] !== 0) {
          return true;
        }
      }
      return false;
    });
    const subgraph = graph.createFilledSubGraph();
    const shape = subgraph.facesToShape();
    graph.dispose();
    subgraph.dispose();
    return shape;
  }

  /**
   * Returns the intersection of an array of shapes.
   * @public
   *
   * @param {Array.<Shape>} shapes
   * @returns {Shape}
   */
  static intersectionNonZero(shapes) {
    const graph = new Graph();
    for (let i = 0; i < shapes.length; i++) {
      graph.addShape(i, shapes[i]);
    }
    graph.computeSimplifiedFaces();
    graph.computeFaceInclusion(windingMap => {
      for (let j = 0; j < shapes.length; j++) {
        if (windingMap[j] === 0) {
          return false;
        }
      }
      return true;
    });
    const subgraph = graph.createFilledSubGraph();
    const shape = subgraph.facesToShape();
    graph.dispose();
    subgraph.dispose();
    return shape;
  }

  /**
   * Returns the xor of an array of shapes.
   * @public
   *
   * TODO: reduce code duplication? https://github.com/phetsims/kite/issues/76
   *
   * @param {Array.<Shape>} shapes
   * @returns {Shape}
   */
  static xorNonZero(shapes) {
    const graph = new Graph();
    for (let i = 0; i < shapes.length; i++) {
      graph.addShape(i, shapes[i]);
    }
    graph.computeSimplifiedFaces();
    graph.computeFaceInclusion(windingMap => {
      let included = false;
      for (let j = 0; j < shapes.length; j++) {
        if (windingMap[j] !== 0) {
          included = !included;
        }
      }
      return included;
    });
    const subgraph = graph.createFilledSubGraph();
    const shape = subgraph.facesToShape();
    graph.dispose();
    subgraph.dispose();
    return shape;
  }

  /**
   * Returns a simplified Shape obtained from running it through the simplification steps with non-zero output.
   * @public
   *
   * @param {Shape} shape
   * @returns {Shape}
   */
  static simplifyNonZero(shape) {
    const graph = new Graph();
    graph.addShape(0, shape);
    graph.computeSimplifiedFaces();
    graph.computeFaceInclusion(map => map['0'] !== 0);
    const subgraph = graph.createFilledSubGraph();
    const resultShape = subgraph.facesToShape();
    graph.dispose();
    subgraph.dispose();
    return resultShape;
  }

  /**
   * Returns a clipped version of `shape` that contains only the parts that are within the area defined by
   * `clipAreaShape`
   * @public
   *
   * @param {Shape} clipAreaShape
   * @param {Shape} shape
   * @param {Object} [options]
   * @returns {Shape}
   */
  static clipShape(clipAreaShape, shape, options) {
    let i;
    let j;
    let loop;
    const SHAPE_ID = 0;
    const CLIP_SHAPE_ID = 1;
    options = merge({
      // {boolean} - Respectively whether segments should be in the returned shape if they are in the exterior of the
      // clipAreaShape (outside), on the boundary, or in the interior.
      includeExterior: false,
      includeBoundary: true,
      includeInterior: true
    }, options);
    const simplifiedClipAreaShape = Graph.simplifyNonZero(clipAreaShape);
    const graph = new Graph();
    graph.addShape(SHAPE_ID, shape, {
      ensureClosed: false // don't add closing segments, since we'll be recreating subpaths/etc.
    });
    graph.addShape(CLIP_SHAPE_ID, simplifiedClipAreaShape);

    // A subset of simplifications (we want to keep low-order vertices, etc.)
    graph.eliminateOverlap();
    graph.eliminateSelfIntersection();
    graph.eliminateIntersection();
    graph.collapseVertices();

    // Mark clip edges with data=true
    for (i = 0; i < graph.loops.length; i++) {
      loop = graph.loops[i];
      if (loop.shapeId === CLIP_SHAPE_ID) {
        for (j = 0; j < loop.halfEdges.length; j++) {
          loop.halfEdges[j].edge.data = true;
        }
      }
    }
    const subpaths = [];
    for (i = 0; i < graph.loops.length; i++) {
      loop = graph.loops[i];
      if (loop.shapeId === SHAPE_ID) {
        let segments = [];
        for (j = 0; j < loop.halfEdges.length; j++) {
          const halfEdge = loop.halfEdges[j];
          const included = halfEdge.edge.data ? options.includeBoundary : simplifiedClipAreaShape.containsPoint(halfEdge.edge.segment.positionAt(0.5)) ? options.includeInterior : options.includeExterior;
          if (included) {
            segments.push(halfEdge.getDirectionalSegment());
          }
          // If we have an excluded segment in-between included segments, we'll need to split into more subpaths to handle
          // the gap.
          else if (segments.length) {
            subpaths.push(new Subpath(segments, undefined, loop.closed));
            segments = [];
          }
        }
        if (segments.length) {
          subpaths.push(new Subpath(segments, undefined, loop.closed));
        }
      }
    }
    graph.dispose();
    return new kite.Shape(subpaths);
  }
}
kite.register('Graph', Graph);
export default Graph;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb3VuZHMyIiwiTWF0cml4MyIsIlRyYW5zZm9ybTMiLCJVdGlscyIsIlZlY3RvcjIiLCJhcnJheVJlbW92ZSIsImNsZWFuQXJyYXkiLCJtZXJnZSIsIkFyYyIsIkJvdW5kYXJ5IiwiQ3ViaWMiLCJFZGdlIiwiRWRnZVNlZ21lbnRUcmVlIiwiRWxsaXB0aWNhbEFyYyIsIkZhY2UiLCJraXRlIiwiTGluZSIsIkxvb3AiLCJTZWdtZW50IiwiU3VicGF0aCIsIlZlcnRleCIsIlZlcnRleFNlZ21lbnRUcmVlIiwiYnJpZGdlSWQiLCJnbG9iYWxJZCIsIlZFUlRFWF9DT0xMQVBTRV9USFJFU0hPTERfRElTVEFOQ0UiLCJJTlRFUlNFQ1RJT05fRU5EUE9JTlRfVEhSRVNIT0xEX0RJU1RBTkNFIiwiU1BMSVRfRU5EUE9JTlRfVEhSRVNIT0xEX0RJU1RBTkNFIiwiVF9USFJFU0hPTEQiLCJHcmFwaCIsImNvbnN0cnVjdG9yIiwidmVydGljZXMiLCJlZGdlcyIsImlubmVyQm91bmRhcmllcyIsIm91dGVyQm91bmRhcmllcyIsImJvdW5kYXJpZXMiLCJzaGFwZUlkcyIsImxvb3BzIiwidW5ib3VuZGVkRmFjZSIsInBvb2wiLCJjcmVhdGUiLCJmYWNlcyIsInNlcmlhbGl6ZSIsInR5cGUiLCJtYXAiLCJ2ZXJ0ZXgiLCJlZGdlIiwiYm91bmRhcnkiLCJpZCIsImxvb3AiLCJmYWNlIiwiZGVzZXJpYWxpemUiLCJvYmoiLCJncmFwaCIsInZlcnRleE1hcCIsImVkZ2VNYXAiLCJoYWxmRWRnZU1hcCIsImJvdW5kYXJ5TWFwIiwibG9vcE1hcCIsImZhY2VNYXAiLCJkYXRhIiwiVmVjdG9yMklPIiwiZnJvbVN0YXRlT2JqZWN0IiwicG9pbnQiLCJ2aXNpdGVkIiwidmlzaXRJbmRleCIsImxvd0luZGV4Iiwic2VnbWVudCIsInN0YXJ0VmVydGV4IiwiZW5kVmVydGV4Iiwic2lnbmVkQXJlYUZyYWdtZW50IiwiZGVzZXJpYWxpemVIYWxmRWRnZSIsImhhbGZFZGdlIiwiaGFsZkVkZ2VEYXRhIiwiaXNSZXZlcnNlZCIsInNvcnRWZWN0b3IiLCJmb3J3YXJkSGFsZiIsInJldmVyc2VkSGFsZiIsImZvckVhY2giLCJpIiwiaW5jaWRlbnRIYWxmRWRnZXMiLCJoYWxmRWRnZXMiLCJzaWduZWRBcmVhIiwiYm91bmRzIiwiQm91bmRzMklPIiwiY2hpbGRCb3VuZGFyaWVzIiwic2hhcGVJZCIsImNsb3NlZCIsImhvbGVzIiwid2luZGluZ01hcCIsImZpbGxlZCIsImFkZFNoYXBlIiwic2hhcGUiLCJvcHRpb25zIiwic3VicGF0aHMiLCJsZW5ndGgiLCJhZGRTdWJwYXRoIiwic3VicGF0aCIsImFzc2VydCIsImVuc3VyZUNsb3NlZCIsImluZGV4T2YiLCJwdXNoIiwic2VnbWVudHMiLCJnZXRGaWxsU2VnbWVudHMiLCJpbmRleCIsInByZXZpb3VzSW5kZXgiLCJlbmQiLCJzdGFydCIsImVxdWFscyIsImRpc3RhbmNlIiwiYXZlcmFnZSIsIm5leHRJbmRleCIsImFkZEVkZ2UiLCJjb21wdXRlU2ltcGxpZmllZEZhY2VzIiwiZWxpbWluYXRlT3ZlcmxhcCIsImVsaW1pbmF0ZVNlbGZJbnRlcnNlY3Rpb24iLCJlbGltaW5hdGVJbnRlcnNlY3Rpb24iLCJjb2xsYXBzZVZlcnRpY2VzIiwicmVtb3ZlQnJpZGdlcyIsInJlbW92ZUxvd09yZGVyVmVydGljZXMiLCJvcmRlclZlcnRleEVkZ2VzIiwiZXh0cmFjdEZhY2VzIiwiY29tcHV0ZUJvdW5kYXJ5VHJlZSIsImNvbXB1dGVXaW5kaW5nTWFwIiwiY29tcHV0ZUZhY2VJbmNsdXNpb24iLCJ3aW5kaW5nTWFwRmlsdGVyIiwiY3JlYXRlRmlsbGVkU3ViR3JhcGgiLCJuZXdTdGFydFZlcnRleCIsIm5ld0VuZFZlcnRleCIsImNvbGxhcHNlQWRqYWNlbnRFZGdlcyIsImZpbGxBbHRlcm5hdGluZ0ZhY2VzIiwiZmFjZXNUb1NoYXBlIiwidG9TdWJwYXRoIiwiaiIsIlNoYXBlIiwiZGlzcG9zZSIsInBvcCIsIl8iLCJpbmNsdWRlcyIsInJlbW92ZUVkZ2UiLCJyZXBsYWNlRWRnZUluTG9vcHMiLCJmb3J3YXJkSGFsZkVkZ2VzIiwicmV2ZXJzZWRIYWxmRWRnZXMiLCJnZXRSZXZlcnNlZCIsInJlcGxhY2VtZW50SGFsZkVkZ2VzIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJzcGxpY2UiLCJhcHBseSIsImNvbmNhdCIsIm5lZWRzTG9vcCIsImFFZGdlIiwiYkVkZ2UiLCJhU2VnbWVudCIsImJTZWdtZW50IiwiYVZlcnRleCIsImdldE90aGVyVmVydGV4IiwiYlZlcnRleCIsInJldmVyc2VkIiwidGFuZ2VudEF0Iiwibm9ybWFsaXplZCIsIm5ld1NlZ21lbnQiLCJlcHNpbG9uIiwicXVldWUiLCJ3aW5kb3ciLCJGbGF0UXVldWUiLCJzZWdtZW50VHJlZSIsIm5leHRJZCIsImFkZFRvUXVldWUiLCJtaW5ZIiwibWF4WSIsInJlbW92ZUZyb21RdWV1ZSIsImludGVybmFsRGF0YSIsInJlbW92ZWRJZCIsImVkZ2VzVG9EaXNwb3NlIiwiZW50cnkiLCJmb3VuZCIsIm92ZXJsYXBwZWRFZGdlIiwiYWRkZWRFZGdlcyIsInF1ZXJ5Iiwib3RoZXJFZGdlIiwib3ZlcmxhcHMiLCJnZXRPdmVybGFwcyIsImsiLCJvdmVybGFwIiwiTWF0aCIsImFicyIsInQxIiwidDAiLCJxdDEiLCJxdDAiLCJzcGxpdE92ZXJsYXAiLCJyZW1vdmVJdGVtIiwiYWRkSXRlbSIsIm5ld0VkZ2VzIiwiYUJlZm9yZSIsInN1YmRpdmlkZWQiLCJiQmVmb3JlIiwiYUFmdGVyIiwiYkFmdGVyIiwibWlkZGxlIiwibGluZWFyIiwiYmVmb3JlVmVydGV4IiwiYSIsImFmdGVyVmVydGV4IiwibWlkZGxlRWRnZSIsImFCZWZvcmVFZGdlIiwiYUFmdGVyRWRnZSIsImJCZWZvcmVFZGdlIiwiYkFmdGVyRWRnZSIsImFFZGdlcyIsImJFZGdlcyIsImFGb3J3YXJkSGFsZkVkZ2VzIiwiYkZvcndhcmRIYWxmRWRnZXMiLCJpc0ZvcndhcmQiLCJzZWxmSW50ZXJzZWN0aW9uIiwiZ2V0U2VsZkludGVyc2VjdGlvbiIsImFUIiwiYlQiLCJzdWJkaXZpc2lvbnMiLCJzdGFydEVkZ2UiLCJlbmRFZGdlIiwicmVtb3ZlZEVkZ2VzIiwiaW50ZXJzZWN0aW9ucyIsImludGVyc2VjdCIsImZpbHRlciIsImludGVyc2VjdGlvbiIsImlzSW50ZXJuYWwiLCJyZXN1bHQiLCJzaW1wbGVTcGxpdCIsImFJbnRlcm5hbCIsImJJbnRlcm5hbCIsImNoYW5nZWQiLCJzcGxpdEVkZ2UiLCJ0IiwiZmlyc3RFZGdlIiwic2Vjb25kRWRnZSIsImV2ZXJ5IiwieSIsInZlcnRpY2VzVG9EaXNwb3NlIiwib3ZlcmxhcHBlZFZlcnRleCIsImFkZGVkVmVydGljZXMiLCJvdGhlclZlcnRleCIsIm5ld1ZlcnRleCIsInN0YXJ0TWF0Y2hlcyIsImVuZE1hdGNoZXMiLCJ3aWR0aCIsImhlaWdodCIsInJlcGxhY2VtZW50RWRnZSIsInVwZGF0ZVJlZmVyZW5jZXMiLCJtYXJrQnJpZGdlcyIsImJyaWRnZXMiLCJjaGlsZFZlcnRleCIsInBhcmVudCIsIm1pbiIsImJyaWRnZUVkZ2UiLCJzb3J0RWRnZXMiLCJib3VuZGFyeUhhbGZFZGdlcyIsInN0YXJ0aW5nSGFsZkVkZ2UiLCJnZXROZXh0IiwidW5ib3VuZGVkSG9sZXMiLCJ0cmFuc2Zvcm0iLCJyb3RhdGlvbjIiLCJvdXRlckJvdW5kYXJ5IiwicmF5IiwiY29tcHV0ZUV4dHJlbWVSYXkiLCJjbG9zZXN0RWRnZSIsImNsb3Nlc3REaXN0YW5jZSIsIk51bWJlciIsIlBPU0lUSVZFX0lORklOSVRZIiwiY2xvc2VzdFdpbmQiLCJ3aW5kIiwiY2xvc2VzdEhhbGZFZGdlIiwiY2xvc2VzdEJvdW5kYXJ5IiwiZ2V0Qm91bmRhcnlPZkhhbGZFZGdlIiwicmVjdXJzaXZlbHlBZGRIb2xlcyIsImJpbmQiLCJzbGljZSIsIm91dHNpZGVNYXAiLCJmb3J3YXJkRmFjZSIsInJldmVyc2VkRmFjZSIsInNvbHZlZEZvcndhcmQiLCJzb2x2ZWRSZXZlcnNlZCIsIm0iLCJjb21wdXRlRGlmZmVyZW50aWFsIiwic29sdmVkRmFjZSIsInVuc29sdmVkRmFjZSIsImRpZmZlcmVudGlhbCIsIm4iLCJsb29wSGFsZkVkZ2UiLCJudWxsRmFjZUZpbGxlZENvdW50IiwiZm9yd2FyZE51bGwiLCJyZXZlcnNlZE51bGwiLCJoYXNIYWxmRWRnZSIsIkVycm9yIiwiZGlzdGFuY2VUaHJlc2hvbGQiLCJ0VGhyZXNob2xkIiwiQklOQVJZX05PTlpFUk9fVU5JT04iLCJCSU5BUllfTk9OWkVST19JTlRFUlNFQ1RJT04iLCJCSU5BUllfTk9OWkVST19ESUZGRVJFTkNFIiwiQklOQVJZX05PTlpFUk9fWE9SIiwiYmluYXJ5UmVzdWx0Iiwic2hhcGVBIiwic2hhcGVCIiwic3ViZ3JhcGgiLCJ1bmlvbk5vblplcm8iLCJzaGFwZXMiLCJpbnRlcnNlY3Rpb25Ob25aZXJvIiwieG9yTm9uWmVybyIsImluY2x1ZGVkIiwic2ltcGxpZnlOb25aZXJvIiwicmVzdWx0U2hhcGUiLCJjbGlwU2hhcGUiLCJjbGlwQXJlYVNoYXBlIiwiU0hBUEVfSUQiLCJDTElQX1NIQVBFX0lEIiwiaW5jbHVkZUV4dGVyaW9yIiwiaW5jbHVkZUJvdW5kYXJ5IiwiaW5jbHVkZUludGVyaW9yIiwic2ltcGxpZmllZENsaXBBcmVhU2hhcGUiLCJjb250YWluc1BvaW50IiwicG9zaXRpb25BdCIsImdldERpcmVjdGlvbmFsU2VnbWVudCIsInVuZGVmaW5lZCIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiR3JhcGguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBtdWx0aWdyYXBoIHdob3NlIGVkZ2VzIGFyZSBzZWdtZW50cy5cclxuICpcclxuICogU3VwcG9ydHMgZ2VuZXJhbCBzaGFwZSBzaW1wbGlmaWNhdGlvbiwgb3ZlcmxhcC9pbnRlcnNlY3Rpb24gcmVtb3ZhbCBhbmQgY29tcHV0YXRpb24uIEdlbmVyYWwgb3V0cHV0IHdvdWxkIGluY2x1ZGVcclxuICogU2hhcGVzIChmcm9tIENBRyAtIENvbnN0cnVjdGl2ZSBBcmVhIEdlb21ldHJ5KSBhbmQgdHJpYW5ndWxhdGlvbnMuXHJcbiAqXHJcbiAqIFNlZSBHcmFwaC5iaW5hcnlSZXN1bHQgZm9yIHRoZSBnZW5lcmFsIHByb2NlZHVyZSBmb3IgQ0FHLlxyXG4gKlxyXG4gKiBUT0RPOiBVc2UgaHR0cHM6Ly9naXRodWIuY29tL21hdXJpY2lvc2FudG9zL0J1Y2tldHMtSlMgZm9yIHByaW9yaXR5IHF1ZXVlLCBpbXBsZW1lbnQgc2ltcGxlIHN3ZWVwIGxpbmUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAqICAgICAgIHdpdGggXCJlbnRlcnNcIiBhbmQgXCJsZWF2ZXNcIiBlbnRyaWVzIGluIHRoZSBxdWV1ZS4gV2hlbiBlZGdlIHJlbW92ZWQsIHJlbW92ZSBcImxlYXZlXCIgZnJvbSBxdWV1ZS5cclxuICogICAgICAgYW5kIGFkZCBhbnkgcmVwbGFjZW1lbnQgZWRnZXMuIEFwcGxpZXMgdG8gb3ZlcmxhcCBhbmQgaW50ZXJzZWN0aW9uIGhhbmRsaW5nLlxyXG4gKiAgICAgICBOT1RFOiBUaGlzIHNob3VsZCBpbXBhY3QgcGVyZm9ybWFuY2UgYSBsb3QsIGFzIHdlIGFyZSBjdXJyZW50bHkgb3Zlci1zY2FubmluZyBhbmQgcmUtc2Nhbm5pbmcgYSBsb3QuXHJcbiAqICAgICAgIEludGVyc2VjdGlvbiBpcyBjdXJyZW50bHkgKGJ5IGZhcj8pIHRoZSBwZXJmb3JtYW5jZSBib3R0bGVuZWNrLlxyXG4gKiBUT0RPOiBDb2xsYXBzZSBub24tTGluZSBhZGphY2VudCBlZGdlcyB0b2dldGhlci4gU2ltaWxhciBsb2dpYyB0byBvdmVybGFwIGZvciBlYWNoIHNlZ21lbnQgdGltZSwgaG9wZWZ1bGx5IGNhblxyXG4gKiAgICAgICBmYWN0b3IgdGhpcyBvdXQuXHJcbiAqIFRPRE86IFByb3Blcmx5IGhhbmRsZSBzb3J0aW5nIGVkZ2VzIGFyb3VuZCBhIHZlcnRleCB3aGVuIHR3byBlZGdlcyBoYXZlIHRoZSBzYW1lIHRhbmdlbnQgb3V0LiBXZSdsbCBuZWVkIHRvIHVzZVxyXG4gKiAgICAgICBjdXJ2YXR1cmUsIG9yIGRvIHRyaWNrcyB0byBmb2xsb3cgYm90aCBjdXJ2ZXMgYnkgYW4gJ2Vwc2lsb24nIGFuZCBzb3J0IGJhc2VkIG9uIHRoYXQuXHJcbiAqIFRPRE86IENvbnNpZGVyIHNlcGFyYXRpbmcgb3V0IGVwc2lsb24gdmFsdWVzIChtYXkgYmUgYSBnZW5lcmFsIEtpdGUgdGhpbmcgcmF0aGVyIHRoYW4ganVzdCBvcHMpXHJcbiAqIFRPRE86IExvb3AtQmxpbm4gb3V0cHV0IGFuZCBjb25zdHJhaW5lZCBEZWxhdW5heSB0cmlhbmd1bGF0aW9uXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcbmltcG9ydCBNYXRyaXgzIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9NYXRyaXgzLmpzJztcclxuaW1wb3J0IFRyYW5zZm9ybTMgZnJvbSAnLi4vLi4vLi4vZG90L2pzL1RyYW5zZm9ybTMuanMnO1xyXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vLi4vZG90L2pzL1V0aWxzLmpzJztcclxuaW1wb3J0IFZlY3RvcjIgZnJvbSAnLi4vLi4vLi4vZG90L2pzL1ZlY3RvcjIuanMnO1xyXG5pbXBvcnQgYXJyYXlSZW1vdmUgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL2FycmF5UmVtb3ZlLmpzJztcclxuaW1wb3J0IGNsZWFuQXJyYXkgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL2NsZWFuQXJyYXkuanMnO1xyXG5pbXBvcnQgbWVyZ2UgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL21lcmdlLmpzJztcclxuaW1wb3J0IHsgQXJjLCBCb3VuZGFyeSwgQ3ViaWMsIEVkZ2UsIEVkZ2VTZWdtZW50VHJlZSwgRWxsaXB0aWNhbEFyYywgRmFjZSwga2l0ZSwgTGluZSwgTG9vcCwgU2VnbWVudCwgU3VicGF0aCwgVmVydGV4LCBWZXJ0ZXhTZWdtZW50VHJlZSB9IGZyb20gJy4uL2ltcG9ydHMuanMnO1xyXG5cclxubGV0IGJyaWRnZUlkID0gMDtcclxubGV0IGdsb2JhbElkID0gMDtcclxuXHJcbmNvbnN0IFZFUlRFWF9DT0xMQVBTRV9USFJFU0hPTERfRElTVEFOQ0UgPSAxZS01O1xyXG5jb25zdCBJTlRFUlNFQ1RJT05fRU5EUE9JTlRfVEhSRVNIT0xEX0RJU1RBTkNFID0gMC4xICogVkVSVEVYX0NPTExBUFNFX1RIUkVTSE9MRF9ESVNUQU5DRTtcclxuY29uc3QgU1BMSVRfRU5EUE9JTlRfVEhSRVNIT0xEX0RJU1RBTkNFID0gMC4wMSAqIFZFUlRFWF9DT0xMQVBTRV9USFJFU0hPTERfRElTVEFOQ0U7XHJcbmNvbnN0IFRfVEhSRVNIT0xEID0gMWUtNjtcclxuXHJcbmNsYXNzIEdyYXBoIHtcclxuICAvKipcclxuICAgKiBAcHVibGljIChraXRlLWludGVybmFsKVxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgLy8gQHB1YmxpYyB7QXJyYXkuPFZlcnRleD59XHJcbiAgICB0aGlzLnZlcnRpY2VzID0gW107XHJcblxyXG4gICAgLy8gQHB1YmxpYyB7QXJyYXkuPEVkZ2U+fVxyXG4gICAgdGhpcy5lZGdlcyA9IFtdO1xyXG5cclxuICAgIC8vIEBwdWJsaWMge0FycmF5LjxCb3VuZGFyeT59XHJcbiAgICB0aGlzLmlubmVyQm91bmRhcmllcyA9IFtdO1xyXG4gICAgdGhpcy5vdXRlckJvdW5kYXJpZXMgPSBbXTtcclxuICAgIHRoaXMuYm91bmRhcmllcyA9IFtdO1xyXG5cclxuICAgIC8vIEBwdWJsaWMge0FycmF5LjxudW1iZXI+fVxyXG4gICAgdGhpcy5zaGFwZUlkcyA9IFtdO1xyXG5cclxuICAgIC8vIEBwdWJsaWMge0FycmF5LjxMb29wPn1cclxuICAgIHRoaXMubG9vcHMgPSBbXTtcclxuXHJcbiAgICAvLyBAcHVibGljIHtGYWNlfVxyXG4gICAgdGhpcy51bmJvdW5kZWRGYWNlID0gRmFjZS5wb29sLmNyZWF0ZSggbnVsbCApO1xyXG5cclxuICAgIC8vIEBwdWJsaWMge0FycmF5LjxGYWNlPn1cclxuICAgIHRoaXMuZmFjZXMgPSBbIHRoaXMudW5ib3VuZGVkRmFjZSBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBvYmplY3QgZm9ybSB0aGF0IGNhbiBiZSB0dXJuZWQgYmFjayBpbnRvIGEgc2VnbWVudCB3aXRoIHRoZSBjb3JyZXNwb25kaW5nIGRlc2VyaWFsaXplIG1ldGhvZC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxyXG4gICAqL1xyXG4gIHNlcmlhbGl6ZSgpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHR5cGU6ICdHcmFwaCcsXHJcbiAgICAgIHZlcnRpY2VzOiB0aGlzLnZlcnRpY2VzLm1hcCggdmVydGV4ID0+IHZlcnRleC5zZXJpYWxpemUoKSApLFxyXG4gICAgICBlZGdlczogdGhpcy5lZGdlcy5tYXAoIGVkZ2UgPT4gZWRnZS5zZXJpYWxpemUoKSApLFxyXG4gICAgICBib3VuZGFyaWVzOiB0aGlzLmJvdW5kYXJpZXMubWFwKCBib3VuZGFyeSA9PiBib3VuZGFyeS5zZXJpYWxpemUoKSApLFxyXG4gICAgICBpbm5lckJvdW5kYXJpZXM6IHRoaXMuaW5uZXJCb3VuZGFyaWVzLm1hcCggYm91bmRhcnkgPT4gYm91bmRhcnkuaWQgKSxcclxuICAgICAgb3V0ZXJCb3VuZGFyaWVzOiB0aGlzLm91dGVyQm91bmRhcmllcy5tYXAoIGJvdW5kYXJ5ID0+IGJvdW5kYXJ5LmlkICksXHJcbiAgICAgIHNoYXBlSWRzOiB0aGlzLnNoYXBlSWRzLFxyXG4gICAgICBsb29wczogdGhpcy5sb29wcy5tYXAoIGxvb3AgPT4gbG9vcC5zZXJpYWxpemUoKSApLFxyXG4gICAgICB1bmJvdW5kZWRGYWNlOiB0aGlzLnVuYm91bmRlZEZhY2UuaWQsXHJcbiAgICAgIGZhY2VzOiB0aGlzLmZhY2VzLm1hcCggZmFjZSA9PiBmYWNlLnNlcmlhbGl6ZSgpIClcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWNyZWF0ZSBhIEdyYXBoIGJhc2VkIG9uIHNlcmlhbGl6ZWQgc3RhdGUgZnJvbSBzZXJpYWxpemUoKVxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcclxuICAgKi9cclxuICBzdGF0aWMgZGVzZXJpYWxpemUoIG9iaiApIHtcclxuICAgIGNvbnN0IGdyYXBoID0gbmV3IEdyYXBoKCk7XHJcblxyXG4gICAgY29uc3QgdmVydGV4TWFwID0ge307XHJcbiAgICBjb25zdCBlZGdlTWFwID0ge307XHJcbiAgICBjb25zdCBoYWxmRWRnZU1hcCA9IHt9O1xyXG4gICAgY29uc3QgYm91bmRhcnlNYXAgPSB7fTtcclxuICAgIGNvbnN0IGxvb3BNYXAgPSB7fTtcclxuICAgIGNvbnN0IGZhY2VNYXAgPSB7fTtcclxuXHJcbiAgICBncmFwaC52ZXJ0aWNlcyA9IG9iai52ZXJ0aWNlcy5tYXAoIGRhdGEgPT4ge1xyXG4gICAgICBjb25zdCB2ZXJ0ZXggPSBuZXcgVmVydGV4KCBWZWN0b3IyLlZlY3RvcjJJTy5mcm9tU3RhdGVPYmplY3QoIGRhdGEucG9pbnQgKSApO1xyXG4gICAgICB2ZXJ0ZXhNYXBbIGRhdGEuaWQgXSA9IHZlcnRleDtcclxuICAgICAgLy8gaW5jaWRlbnRIYWxmRWRnZXMgY29ubmVjdGVkIGJlbG93XHJcbiAgICAgIHZlcnRleC52aXNpdGVkID0gZGF0YS52aXNpdGVkO1xyXG4gICAgICB2ZXJ0ZXgudmlzaXRJbmRleCA9IGRhdGEudmlzaXRJbmRleDtcclxuICAgICAgdmVydGV4Lmxvd0luZGV4ID0gZGF0YS5sb3dJbmRleDtcclxuICAgICAgcmV0dXJuIHZlcnRleDtcclxuICAgIH0gKTtcclxuXHJcbiAgICBncmFwaC5lZGdlcyA9IG9iai5lZGdlcy5tYXAoIGRhdGEgPT4ge1xyXG4gICAgICBjb25zdCBlZGdlID0gbmV3IEVkZ2UoIFNlZ21lbnQuZGVzZXJpYWxpemUoIGRhdGEuc2VnbWVudCApLCB2ZXJ0ZXhNYXBbIGRhdGEuc3RhcnRWZXJ0ZXggXSwgdmVydGV4TWFwWyBkYXRhLmVuZFZlcnRleCBdICk7XHJcbiAgICAgIGVkZ2VNYXBbIGRhdGEuaWQgXSA9IGVkZ2U7XHJcbiAgICAgIGVkZ2Uuc2lnbmVkQXJlYUZyYWdtZW50ID0gZGF0YS5zaWduZWRBcmVhRnJhZ21lbnQ7XHJcblxyXG4gICAgICBjb25zdCBkZXNlcmlhbGl6ZUhhbGZFZGdlID0gKCBoYWxmRWRnZSwgaGFsZkVkZ2VEYXRhICkgPT4ge1xyXG4gICAgICAgIGhhbGZFZGdlTWFwWyBoYWxmRWRnZURhdGEuaWQgXSA9IGhhbGZFZGdlO1xyXG4gICAgICAgIC8vIGZhY2UgY29ubmVjdGVkIGxhdGVyXHJcbiAgICAgICAgaGFsZkVkZ2UuaXNSZXZlcnNlZCA9IGhhbGZFZGdlRGF0YS5pc1JldmVyc2VkO1xyXG4gICAgICAgIGhhbGZFZGdlLnNpZ25lZEFyZWFGcmFnbWVudCA9IGhhbGZFZGdlRGF0YS5zaWduZWRBcmVhRnJhZ21lbnQ7XHJcbiAgICAgICAgaGFsZkVkZ2Uuc3RhcnRWZXJ0ZXggPSB2ZXJ0ZXhNYXBbIGhhbGZFZGdlRGF0YS5zdGFydFZlcnRleC5pZCBdO1xyXG4gICAgICAgIGhhbGZFZGdlLmVuZFZlcnRleCA9IHZlcnRleE1hcFsgaGFsZkVkZ2VEYXRhLmVuZFZlcnRleC5pZCBdO1xyXG4gICAgICAgIGhhbGZFZGdlLnNvcnRWZWN0b3IgPSBWZWN0b3IyLlZlY3RvcjJJTy5mcm9tU3RhdGVPYmplY3QoIGhhbGZFZGdlRGF0YS5zb3J0VmVjdG9yICk7XHJcbiAgICAgICAgaGFsZkVkZ2UuZGF0YSA9IGhhbGZFZGdlRGF0YS5kYXRhO1xyXG4gICAgICB9O1xyXG4gICAgICBkZXNlcmlhbGl6ZUhhbGZFZGdlKCBlZGdlLmZvcndhcmRIYWxmLCBkYXRhLmZvcndhcmRIYWxmICk7XHJcbiAgICAgIGRlc2VyaWFsaXplSGFsZkVkZ2UoIGVkZ2UucmV2ZXJzZWRIYWxmLCBkYXRhLnJldmVyc2VkSGFsZiApO1xyXG5cclxuICAgICAgZWRnZS52aXNpdGVkID0gZGF0YS52aXNpdGVkO1xyXG4gICAgICBlZGdlLmRhdGEgPSBkYXRhLmRhdGE7XHJcbiAgICAgIHJldHVybiBlZGdlO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIENvbm5lY3QgVmVydGV4IGluY2lkZW50SGFsZkVkZ2VzXHJcbiAgICBvYmoudmVydGljZXMuZm9yRWFjaCggKCBkYXRhLCBpICkgPT4ge1xyXG4gICAgICBjb25zdCB2ZXJ0ZXggPSBncmFwaC52ZXJ0aWNlc1sgaSBdO1xyXG4gICAgICB2ZXJ0ZXguaW5jaWRlbnRIYWxmRWRnZXMgPSBkYXRhLmluY2lkZW50SGFsZkVkZ2VzLm1hcCggaWQgPT4gaGFsZkVkZ2VNYXBbIGlkIF0gKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICBncmFwaC5ib3VuZGFyaWVzID0gb2JqLmJvdW5kYXJpZXMubWFwKCBkYXRhID0+IHtcclxuICAgICAgY29uc3QgYm91bmRhcnkgPSBCb3VuZGFyeS5wb29sLmNyZWF0ZSggZGF0YS5oYWxmRWRnZXMubWFwKCBpZCA9PiBoYWxmRWRnZU1hcFsgaWQgXSApICk7XHJcbiAgICAgIGJvdW5kYXJ5TWFwWyBkYXRhLmlkIF0gPSBib3VuZGFyeTtcclxuICAgICAgYm91bmRhcnkuc2lnbmVkQXJlYSA9IGRhdGEuc2lnbmVkQXJlYTtcclxuICAgICAgYm91bmRhcnkuYm91bmRzID0gQm91bmRzMi5Cb3VuZHMySU8uZnJvbVN0YXRlT2JqZWN0KCBkYXRhLmJvdW5kcyApO1xyXG4gICAgICAvLyBjaGlsZEJvdW5kYXJpZXMgaGFuZGxlZCBiZWxvd1xyXG4gICAgICByZXR1cm4gYm91bmRhcnk7XHJcbiAgICB9ICk7XHJcbiAgICBvYmouYm91bmRhcmllcy5mb3JFYWNoKCAoIGRhdGEsIGkgKSA9PiB7XHJcbiAgICAgIGNvbnN0IGJvdW5kYXJ5ID0gZ3JhcGguYm91bmRhcmllc1sgaSBdO1xyXG4gICAgICBib3VuZGFyeS5jaGlsZEJvdW5kYXJpZXMgPSBkYXRhLmNoaWxkQm91bmRhcmllcy5tYXAoIGlkID0+IGJvdW5kYXJ5TWFwWyBpZCBdICk7XHJcbiAgICB9ICk7XHJcbiAgICBncmFwaC5pbm5lckJvdW5kYXJpZXMgPSBvYmouaW5uZXJCb3VuZGFyaWVzLm1hcCggaWQgPT4gYm91bmRhcnlNYXBbIGlkIF0gKTtcclxuICAgIGdyYXBoLm91dGVyQm91bmRhcmllcyA9IG9iai5vdXRlckJvdW5kYXJpZXMubWFwKCBpZCA9PiBib3VuZGFyeU1hcFsgaWQgXSApO1xyXG5cclxuICAgIGdyYXBoLnNoYXBlSWRzID0gb2JqLnNoYXBlSWRzO1xyXG5cclxuICAgIGdyYXBoLmxvb3BzID0gb2JqLmxvb3BzLm1hcCggZGF0YSA9PiB7XHJcbiAgICAgIGNvbnN0IGxvb3AgPSBuZXcgTG9vcCggZGF0YS5zaGFwZUlkLCBkYXRhLmNsb3NlZCApO1xyXG4gICAgICBsb29wTWFwWyBkYXRhLmlkIF0gPSBsb29wO1xyXG4gICAgICBsb29wLmhhbGZFZGdlcyA9IGRhdGEuaGFsZkVkZ2VzLm1hcCggaWQgPT4gaGFsZkVkZ2VNYXBbIGlkIF0gKTtcclxuICAgICAgcmV0dXJuIGxvb3A7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgZ3JhcGguZmFjZXMgPSBvYmouZmFjZXMubWFwKCAoIGRhdGEsIGkgKSA9PiB7XHJcbiAgICAgIGNvbnN0IGZhY2UgPSBpID09PSAwID8gZ3JhcGgudW5ib3VuZGVkRmFjZSA6IG5ldyBGYWNlKCBib3VuZGFyeU1hcFsgZGF0YS5ib3VuZGFyeSBdICk7XHJcbiAgICAgIGZhY2VNYXBbIGRhdGEuaWQgXSA9IGZhY2U7XHJcbiAgICAgIGZhY2UuaG9sZXMgPSBkYXRhLmhvbGVzLm1hcCggaWQgPT4gYm91bmRhcnlNYXBbIGlkIF0gKTtcclxuICAgICAgZmFjZS53aW5kaW5nTWFwID0gZGF0YS53aW5kaW5nTWFwO1xyXG4gICAgICBmYWNlLmZpbGxlZCA9IGRhdGEuZmlsbGVkO1xyXG4gICAgICByZXR1cm4gZmFjZTtcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBDb25uZWN0ZWQgZmFjZXMgdG8gaGFsZkVkZ2VzXHJcbiAgICBvYmouZWRnZXMuZm9yRWFjaCggKCBkYXRhLCBpICkgPT4ge1xyXG4gICAgICBjb25zdCBlZGdlID0gZ3JhcGguZWRnZXNbIGkgXTtcclxuICAgICAgZWRnZS5mb3J3YXJkSGFsZi5mYWNlID0gZGF0YS5mb3J3YXJkSGFsZi5mYWNlID09PSBudWxsID8gbnVsbCA6IGZhY2VNYXBbIGRhdGEuZm9yd2FyZEhhbGYuZmFjZSBdO1xyXG4gICAgICBlZGdlLnJldmVyc2VkSGFsZi5mYWNlID0gZGF0YS5yZXZlcnNlZEhhbGYuZmFjZSA9PT0gbnVsbCA/IG51bGwgOiBmYWNlTWFwWyBkYXRhLnJldmVyc2VkSGFsZi5mYWNlIF07XHJcbiAgICB9ICk7XHJcblxyXG4gICAgcmV0dXJuIGdyYXBoO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhIFNoYXBlICh3aXRoIGEgZ2l2ZW4gSUQgZm9yIENBRyBwdXJwb3NlcykgdG8gdGhlIGdyYXBoLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzaGFwZUlkIC0gVGhlIElEIHdoaWNoIHNob3VsZCBiZSBzaGFyZWQgZm9yIGFsbCBwYXRocy9zaGFwZXMgdGhhdCBzaG91bGQgYmUgY29tYmluZWQgd2l0aFxyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcGVjdCB0byB0aGUgd2luZGluZyBudW1iZXIgb2YgZmFjZXMuIEZvciBDQUcsIGluZGVwZW5kZW50IHNoYXBlcyBzaG91bGQgYmUgZ2l2ZW5cclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpZmZlcmVudCBJRHMgKHNvIHRoZXkgaGF2ZSBzZXBhcmF0ZSB3aW5kaW5nIG51bWJlcnMgcmVjb3JkZWQpLlxyXG4gICAqIEBwYXJhbSB7U2hhcGV9IHNoYXBlXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIFNlZSBhZGRTdWJwYXRoXHJcbiAgICovXHJcbiAgYWRkU2hhcGUoIHNoYXBlSWQsIHNoYXBlLCBvcHRpb25zICkge1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgc2hhcGUuc3VicGF0aHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIHRoaXMuYWRkU3VicGF0aCggc2hhcGVJZCwgc2hhcGUuc3VicGF0aHNbIGkgXSwgb3B0aW9ucyApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhIHN1YnBhdGggb2YgYSBTaGFwZSAod2l0aCBhIGdpdmVuIElEIGZvciBDQUcgcHVycG9zZXMpIHRvIHRoZSBncmFwaC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge251bWJlcn0gc2hhcGVJZCAtIFNlZSBhZGRTaGFwZSgpIGRvY3VtZW50YXRpb25cclxuICAgKiBAcGFyYW0ge1N1YnBhdGh9IHN1YnBhdGhcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXHJcbiAgICovXHJcbiAgYWRkU3VicGF0aCggc2hhcGVJZCwgc3VicGF0aCwgb3B0aW9ucyApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiBzaGFwZUlkID09PSAnbnVtYmVyJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggc3VicGF0aCBpbnN0YW5jZW9mIFN1YnBhdGggKTtcclxuXHJcbiAgICBvcHRpb25zID0gbWVyZ2UoIHtcclxuICAgICAgZW5zdXJlQ2xvc2VkOiB0cnVlXHJcbiAgICB9LCBvcHRpb25zICk7XHJcblxyXG4gICAgLy8gRW5zdXJlIHRoZSBzaGFwZUlkIGlzIHJlY29yZGVkXHJcbiAgICBpZiAoIHRoaXMuc2hhcGVJZHMuaW5kZXhPZiggc2hhcGVJZCApIDwgMCApIHtcclxuICAgICAgdGhpcy5zaGFwZUlkcy5wdXNoKCBzaGFwZUlkICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBzdWJwYXRoLnNlZ21lbnRzLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNsb3NlZCA9IHN1YnBhdGguY2xvc2VkIHx8IG9wdGlvbnMuZW5zdXJlQ2xvc2VkO1xyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBvcHRpb25zLmVuc3VyZUNsb3NlZCA/IHN1YnBhdGguZ2V0RmlsbFNlZ21lbnRzKCkgOiBzdWJwYXRoLnNlZ21lbnRzO1xyXG4gICAgbGV0IGluZGV4O1xyXG5cclxuICAgIC8vIENvbGxlY3RzIGFsbCBvZiB0aGUgdmVydGljZXNcclxuICAgIGNvbnN0IHZlcnRpY2VzID0gW107XHJcbiAgICBmb3IgKCBpbmRleCA9IDA7IGluZGV4IDwgc2VnbWVudHMubGVuZ3RoOyBpbmRleCsrICkge1xyXG4gICAgICBsZXQgcHJldmlvdXNJbmRleCA9IGluZGV4IC0gMTtcclxuICAgICAgaWYgKCBwcmV2aW91c0luZGV4IDwgMCApIHtcclxuICAgICAgICBwcmV2aW91c0luZGV4ID0gc2VnbWVudHMubGVuZ3RoIC0gMTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gR2V0IHRoZSBlbmQgb2YgdGhlIHByZXZpb3VzIHNlZ21lbnQgYW5kIHN0YXJ0IG9mIHRoZSBuZXh0LiBHZW5lcmFsbHkgdGhleSBzaG91bGQgYmUgZXF1YWwgb3IgYWxtb3N0IGVxdWFsLFxyXG4gICAgICAvLyBhcyBpdCdzIHRoZSBwb2ludCBhdCB0aGUgam9pbnQgb2YgdHdvIHNlZ21lbnRzLlxyXG4gICAgICBsZXQgZW5kID0gc2VnbWVudHNbIHByZXZpb3VzSW5kZXggXS5lbmQ7XHJcbiAgICAgIGNvbnN0IHN0YXJ0ID0gc2VnbWVudHNbIGluZGV4IF0uc3RhcnQ7XHJcblxyXG4gICAgICAvLyBJZiB3ZSBhcmUgY3JlYXRpbmcgYW4gb3BlbiBcImxvb3BcIiwgZG9uJ3QgaW50ZXJwb2xhdGUgdGhlIHN0YXJ0L2VuZCBvZiB0aGUgZW50aXJlIHN1YnBhdGggdG9nZXRoZXIuXHJcbiAgICAgIGlmICggIWNsb3NlZCAmJiBpbmRleCA9PT0gMCApIHtcclxuICAgICAgICBlbmQgPSBzdGFydDtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gSWYgdGhleSBhcmUgZXhhY3RseSBlcXVhbCwgZG9uJ3QgdGFrZSBhIGNoYW5jZSBvbiBmbG9hdGluZy1wb2ludCBhcml0aG1ldGljXHJcbiAgICAgIGlmICggc3RhcnQuZXF1YWxzKCBlbmQgKSApIHtcclxuICAgICAgICB2ZXJ0aWNlcy5wdXNoKCBWZXJ0ZXgucG9vbC5jcmVhdGUoIHN0YXJ0ICkgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBzdGFydC5kaXN0YW5jZSggZW5kICkgPCAxZS01LCAnSW5hY2N1cmF0ZSBzdGFydC9lbmQgcG9pbnRzJyApO1xyXG4gICAgICAgIHZlcnRpY2VzLnB1c2goIFZlcnRleC5wb29sLmNyZWF0ZSggc3RhcnQuYXZlcmFnZSggZW5kICkgKSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoICFjbG9zZWQgKSB7XHJcbiAgICAgIC8vIElmIHdlIGFyZW4ndCBjbG9zZWQsIGNyZWF0ZSBhbiBcImVuZFwiIHZlcnRleCBzaW5jZSBpdCBtYXkgYmUgZGlmZmVyZW50IGZyb20gdGhlIFwic3RhcnRcIlxyXG4gICAgICB2ZXJ0aWNlcy5wdXNoKCBWZXJ0ZXgucG9vbC5jcmVhdGUoIHNlZ21lbnRzWyBzZWdtZW50cy5sZW5ndGggLSAxIF0uZW5kICkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDcmVhdGUgdGhlIGxvb3Agb2JqZWN0IGZyb20gdGhlIHZlcnRpY2VzLCBmaWxsaW5nIGluIGVkZ2VzXHJcbiAgICBjb25zdCBsb29wID0gTG9vcC5wb29sLmNyZWF0ZSggc2hhcGVJZCwgY2xvc2VkICk7XHJcbiAgICBmb3IgKCBpbmRleCA9IDA7IGluZGV4IDwgc2VnbWVudHMubGVuZ3RoOyBpbmRleCsrICkge1xyXG4gICAgICBsZXQgbmV4dEluZGV4ID0gaW5kZXggKyAxO1xyXG4gICAgICBpZiAoIGNsb3NlZCAmJiBuZXh0SW5kZXggPT09IHNlZ21lbnRzLmxlbmd0aCApIHtcclxuICAgICAgICBuZXh0SW5kZXggPSAwO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBlZGdlID0gRWRnZS5wb29sLmNyZWF0ZSggc2VnbWVudHNbIGluZGV4IF0sIHZlcnRpY2VzWyBpbmRleCBdLCB2ZXJ0aWNlc1sgbmV4dEluZGV4IF0gKTtcclxuICAgICAgbG9vcC5oYWxmRWRnZXMucHVzaCggZWRnZS5mb3J3YXJkSGFsZiApO1xyXG4gICAgICB0aGlzLmFkZEVkZ2UoIGVkZ2UgKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmxvb3BzLnB1c2goIGxvb3AgKTtcclxuICAgIHRoaXMudmVydGljZXMucHVzaCggLi4udmVydGljZXMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNpbXBsaWZpZXMgZWRnZXMvdmVydGljZXMsIGNvbXB1dGVzIGJvdW5kYXJpZXMgYW5kIGZhY2VzICh3aXRoIHRoZSB3aW5kaW5nIG1hcCkuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqL1xyXG4gIGNvbXB1dGVTaW1wbGlmaWVkRmFjZXMoKSB7XHJcbiAgICAvLyBCZWZvcmUgd2UgZmluZCBhbnkgaW50ZXJzZWN0aW9ucyAoc2VsZi1pbnRlcnNlY3Rpb24gb3IgYmV0d2VlbiBlZGdlcyksIHdlJ2xsIHdhbnQgdG8gaWRlbnRpZnkgYW5kIGZpeCB1cFxyXG4gICAgLy8gYW55IGNhc2VzIHdoZXJlIHRoZXJlIGFyZSBhbiBpbmZpbml0ZSBudW1iZXIgb2YgaW50ZXJzZWN0aW9ucyBiZXR3ZWVuIGVkZ2VzICh0aGV5IGFyZSBjb250aW51b3VzbHlcclxuICAgIC8vIG92ZXJsYXBwaW5nKS4gRm9yIGFueSBvdmVybGFwLCB3ZSdsbCBzcGxpdCBpdCBpbnRvIG9uZSBcIm92ZXJsYXBcIiBlZGdlIGFuZCBhbnkgcmVtYWluaW5nIGVkZ2VzLiBBZnRlciB0aGlzXHJcbiAgICAvLyBwcm9jZXNzLCB0aGVyZSBzaG91bGQgYmUgbm8gY29udGludW91cyBvdmVybGFwcy5cclxuICAgIHRoaXMuZWxpbWluYXRlT3ZlcmxhcCgpO1xyXG5cclxuICAgIC8vIERldGVjdHMgYW55IGVkZ2Ugc2VsZi1pbnRlcnNlY3Rpb24sIGFuZCBzcGxpdHMgaXQgaW50byBtdWx0aXBsZSBlZGdlcy4gVGhpcyBjdXJyZW50bHkgaGFwcGVucyB3aXRoIGN1YmljcyBvbmx5LFxyXG4gICAgLy8gYnV0IG5lZWRzIHRvIGJlIGRvbmUgYmVmb3JlIHdlIGludGVyc2VjdCB0aG9zZSBjdWJpY3Mgd2l0aCBhbnkgb3RoZXIgZWRnZXMuXHJcbiAgICB0aGlzLmVsaW1pbmF0ZVNlbGZJbnRlcnNlY3Rpb24oKTtcclxuXHJcbiAgICAvLyBGaW5kIGludGVyLWVkZ2UgaW50ZXJzZWN0aW9ucyAodGhhdCBhcmVuJ3QgYXQgZW5kcG9pbnRzKS4gU3BsaXRzIGVkZ2VzIGludm9sdmVkIGludG8gdGhlIGludGVyc2VjdGlvbi4gQWZ0ZXJcclxuICAgIC8vIHRoaXMgcGFzcywgd2Ugc2hvdWxkIGhhdmUgYSB3ZWxsLWRlZmluZWQgZ3JhcGggd2hlcmUgaW4gdGhlIHBsYW5hciBlbWJlZGRpbmcgZWRnZXMgZG9uJ3QgaW50ZXJzZWN0IG9yIG92ZXJsYXAuXHJcbiAgICB0aGlzLmVsaW1pbmF0ZUludGVyc2VjdGlvbigpO1xyXG5cclxuICAgIC8vIEZyb20gdGhlIGFib3ZlIHByb2Nlc3MgKGFuZCBpbnB1dCksIHdlIG1heSBoYXZlIG11bHRpcGxlIHZlcnRpY2VzIHRoYXQgb2NjdXB5IGVzc2VudGlhbGx5IHRoZSBzYW1lIGxvY2F0aW9uLlxyXG4gICAgLy8gVGhlc2UgdmVydGljZXMgZ2V0IGNvbWJpbmVkIGludG8gb25lIHZlcnRleCBpbiB0aGUgbG9jYXRpb24uIElmIHRoZXJlIHdhcyBhIG1vc3RseS1kZWdlbmVyYXRlIGVkZ2UgdGhhdCB3YXNcclxuICAgIC8vIHZlcnkgc21hbGwgYmV0d2VlbiBlZGdlcywgaXQgd2lsbCBiZSByZW1vdmVkLlxyXG4gICAgdGhpcy5jb2xsYXBzZVZlcnRpY2VzKCk7XHJcblxyXG4gICAgLy8gT3VyIGdyYXBoIGNhbiBlbmQgdXAgd2l0aCBlZGdlcyB0aGF0IHdvdWxkIGhhdmUgdGhlIHNhbWUgZmFjZSBvbiBib3RoIHNpZGVzIChhcmUgY29uc2lkZXJlZCBhIFwiYnJpZGdlXCIgZWRnZSkuXHJcbiAgICAvLyBUaGVzZSBuZWVkIHRvIGJlIHJlbW92ZWQsIHNvIHRoYXQgb3VyIGZhY2UgaGFuZGxpbmcgbG9naWMgZG9lc24ndCBoYXZlIHRvIGhhbmRsZSBhbm90aGVyIGNsYXNzIG9mIGNhc2VzLlxyXG4gICAgdGhpcy5yZW1vdmVCcmlkZ2VzKCk7XHJcblxyXG4gICAgLy8gVmVydGljZXMgY2FuIGJlIGxlZnQgb3ZlciB3aGVyZSB0aGV5IGhhdmUgbGVzcyB0aGFuIDIgaW5jaWRlbnQgZWRnZXMsIGFuZCB0aGV5IGNhbiBiZSBzYWZlbHkgcmVtb3ZlZCAoc2luY2VcclxuICAgIC8vIHRoZXkgd29uJ3QgY29udHJpYnV0ZSB0byB0aGUgYXJlYSBvdXRwdXQpLlxyXG4gICAgdGhpcy5yZW1vdmVMb3dPcmRlclZlcnRpY2VzKCk7XHJcblxyXG4gICAgLy8gLy8gVE9ETzogV2h5IGRvZXMgdGhpcyByZXNvbHZlIHNvbWUgdGhpbmdzPyBJdCBzZWVtcyBsaWtlIGl0IHNob3VsZCBiZSB1bm5lY2Vzc2FyeS4gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzk4XHJcbiAgICAvLyB0aGlzLmVsaW1pbmF0ZUludGVyc2VjdGlvbigpO1xyXG4gICAgLy8gdGhpcy5jb2xsYXBzZVZlcnRpY2VzKCk7XHJcbiAgICAvLyB0aGlzLnJlbW92ZUJyaWRnZXMoKTtcclxuICAgIC8vIHRoaXMucmVtb3ZlTG93T3JkZXJWZXJ0aWNlcygpO1xyXG5cclxuICAgIC8vIE5vdyB0aGF0IHRoZSBncmFwaCBoYXMgd2VsbC1kZWZpbmVkIHZlcnRpY2VzIGFuZCBlZGdlcyAoMi1lZGdlLWNvbm5lY3RlZCwgbm9ub3ZlcmxhcHBpbmcpLCB3ZSdsbCB3YW50IHRvIGtub3dcclxuICAgIC8vIHRoZSBvcmRlciBvZiBlZGdlcyBhcm91bmQgYSB2ZXJ0ZXggKGlmIHlvdSByb3RhdGUgYXJvdW5kIGEgdmVydGV4LCB3aGF0IGVkZ2VzIGFyZSBpbiB3aGF0IG9yZGVyPykuXHJcbiAgICB0aGlzLm9yZGVyVmVydGV4RWRnZXMoKTtcclxuXHJcbiAgICAvLyBFeHRyYWN0cyBib3VuZGFyaWVzIGFuZCBmYWNlcywgYnkgZm9sbG93aW5nIGVhY2ggaGFsZi1lZGdlIGNvdW50ZXItY2xvY2t3aXNlLCBhbmQgZmFjZXMgYXJlIGNyZWF0ZWQgZm9yXHJcbiAgICAvLyBib3VuZGFyaWVzIHRoYXQgaGF2ZSBwb3NpdGl2ZSBzaWduZWQgYXJlYS5cclxuICAgIHRoaXMuZXh0cmFjdEZhY2VzKCk7XHJcblxyXG4gICAgLy8gV2UgbmVlZCB0byBkZXRlcm1pbmUgd2hpY2ggYm91bmRhcmllcyBhcmUgaG9sZXMgZm9yIGVhY2ggZmFjZS4gVGhpcyBjcmVhdGVzIGEgXCJib3VuZGFyeSB0cmVlXCIgd2hlcmUgdGhlIG5vZGVzXHJcbiAgICAvLyBhcmUgYm91bmRhcmllcy4gQWxsIGNvbm5lY3RlZCBjb21wb25lbnRzIHNob3VsZCBiZSBvbmUgZmFjZSBhbmQgaXRzIGhvbGVzLiBUaGUgaG9sZXMgZ2V0IHN0b3JlZCBvbiB0aGVcclxuICAgIC8vIHJlc3BlY3RpdmUgZmFjZS5cclxuICAgIHRoaXMuY29tcHV0ZUJvdW5kYXJ5VHJlZSgpO1xyXG5cclxuICAgIC8vIENvbXB1dGUgdGhlIHdpbmRpbmcgbnVtYmVycyBvZiBlYWNoIGZhY2UgZm9yIGVhY2ggc2hhcGVJZCwgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhlIGlucHV0IHdvdWxkIGhhdmUgdGhhdFxyXG4gICAgLy8gZmFjZSBcImZpbGxlZFwiLiBJdCBzaG91bGQgdGhlbiBiZSByZWFkeSBmb3IgZnV0dXJlIHByb2Nlc3NpbmcuXHJcbiAgICB0aGlzLmNvbXB1dGVXaW5kaW5nTWFwKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHdoZXRoZXIgZWFjaCBmYWNlIHNob3VsZCBiZSBmaWxsZWQgb3IgdW5maWxsZWQgYmFzZWQgb24gYSBmaWx0ZXIgZnVuY3Rpb24uXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogVGhlIHdpbmRpbmdNYXBGaWx0ZXIgd2lsbCBiZSBjYWxsZWQgb24gZWFjaCBmYWNlJ3Mgd2luZGluZyBtYXAsIGFuZCB3aWxsIHVzZSB0aGUgcmV0dXJuIHZhbHVlIGFzIHdoZXRoZXIgdGhlIGZhY2VcclxuICAgKiBpcyBmaWxsZWQgb3Igbm90LlxyXG4gICAqXHJcbiAgICogVGhlIHdpbmRpbmcgbWFwIGlzIGFuIHtPYmplY3R9IGFzc29jaWF0ZWQgd2l0aCBlYWNoIGZhY2UgdGhhdCBoYXMgYSBrZXkgZm9yIGV2ZXJ5IHNoYXBlSWQgdGhhdCB3YXMgdXNlZCBpblxyXG4gICAqIGFkZFNoYXBlL2FkZFN1YnBhdGgsIGFuZCB0aGUgdmFsdWUgZm9yIHRob3NlIGtleXMgaXMgdGhlIHdpbmRpbmcgbnVtYmVyIG9mIHRoZSBmYWNlIGdpdmVuIGFsbCBwYXRocyB3aXRoIHRoZVxyXG4gICAqIHNoYXBlSWQuXHJcbiAgICpcclxuICAgKiBGb3IgZXhhbXBsZSwgaW1hZ2luZSB5b3UgYWRkZWQgdHdvIHNoYXBlSWRzICgwIGFuZCAxKSwgYW5kIHRoZSBpdGVyYXRpb24gaXMgb24gYSBmYWNlIHRoYXQgaXMgaW5jbHVkZWQgaW5cclxuICAgKiBvbmUgbG9vcCBzcGVjaWZpZWQgd2l0aCBzaGFwZUlkOjAgKGluc2lkZSBhIGNvdW50ZXItY2xvY2t3aXNlIGN1cnZlKSwgYW5kIGlzIG91dHNpZGUgb2YgYW55IHNlZ21lbnRzIHNwZWNpZmllZFxyXG4gICAqIGJ5IHRoZSBzZWNvbmQgbG9vcCAoc2hhcGVJZDoxKS4gVGhlbiB0aGUgd2luZGluZyBtYXAgd2lsbCBiZTpcclxuICAgKiB7XHJcbiAgICogICAwOiAxIC8vIHNoYXBlSWQ6MCBoYXMgYSB3aW5kaW5nIG51bWJlciBvZiAxIGZvciB0aGlzIGZhY2UgKGdlbmVyYWxseSBmaWxsZWQpXHJcbiAgICogICAxOiAwIC8vIHNoYXBlSWQ6MSBoYXMgYSB3aW5kaW5nIG51bWJlciBvZiAwIGZvciB0aGlzIGZhY2UgKGdlbmVyYWxseSBub3QgZmlsbGVkKVxyXG4gICAqIH1cclxuICAgKlxyXG4gICAqIEdlbmVyYWxseSwgd2luZGluZyBtYXAgZmlsdGVycyBjYW4gYmUgYnJva2VuIGRvd24gaW50byB0d28gc3RlcHM6XHJcbiAgICogMS4gR2l2ZW4gdGhlIHdpbmRpbmcgbnVtYmVyIGZvciBlYWNoIHNoYXBlSWQsIGNvbXB1dGUgd2hldGhlciB0aGF0IGxvb3Agd2FzIG9yaWdpbmFsbHkgZmlsbGVkLiBOb3JtYWxseSwgdGhpcyBpc1xyXG4gICAqICAgIGRvbmUgd2l0aCBhIG5vbi16ZXJvIHJ1bGUgKGFueSB3aW5kaW5nIG51bWJlciBpcyBmaWxsZWQsIGV4Y2VwdCB6ZXJvKS4gU1ZHIGFsc28gcHJvdmlkZXMgYW4gZXZlbi1vZGQgcnVsZVxyXG4gICAqICAgIChvZGQgbnVtYmVycyBhcmUgZmlsbGVkLCBldmVuIG51bWJlcnMgYXJlIHVuZmlsbGVkKS5cclxuICAgKiAyLiBHaXZlbiBib29sZWFucyBmb3IgZWFjaCBzaGFwZUlkIGZyb20gc3RlcCAxLCBjb21wdXRlIENBRyBvcGVyYXRpb25zIGJhc2VkIG9uIGJvb2xlYW4gZm9ybXVsYXMuIFNheSB5b3Ugd2FudGVkXHJcbiAgICogICAgdG8gdGFrZSB0aGUgdW5pb24gb2Ygc2hhcGVJZHMgMCBhbmQgMSwgdGhlbiByZW1vdmUgYW55dGhpbmcgaW4gc2hhcGVJZCAyLiBHaXZlbiB0aGUgYm9vbGVhbnMgYWJvdmUsIHRoaXMgY2FuXHJcbiAgICogICAgYmUgZGlyZWN0bHkgY29tcHV0ZWQgYXMgKGZpbGxlZDAgfHwgZmlsbGVkMSkgJiYgIWZpbGxlZDIuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSB3aW5kaW5nTWFwRmlsdGVyXHJcbiAgICovXHJcbiAgY29tcHV0ZUZhY2VJbmNsdXNpb24oIHdpbmRpbmdNYXBGaWx0ZXIgKSB7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLmZhY2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBmYWNlID0gdGhpcy5mYWNlc1sgaSBdO1xyXG4gICAgICBmYWNlLmZpbGxlZCA9IHdpbmRpbmdNYXBGaWx0ZXIoIGZhY2Uud2luZGluZ01hcCApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlIGEgbmV3IEdyYXBoIG9iamVjdCBiYXNlZCBvbmx5IG9uIGVkZ2VzIGluIHRoaXMgZ3JhcGggdGhhdCBzZXBhcmF0ZSBhIFwiZmlsbGVkXCIgZmFjZSBmcm9tIGFuIFwidW5maWxsZWRcIlxyXG4gICAqIGZhY2UuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogVGhpcyBpcyBhIGNvbnZlbmllbnQgd2F5IHRvIFwiY29sbGFwc2VcIiBhZGphY2VudCBmaWxsZWQgYW5kIHVuZmlsbGVkIGZhY2VzIHRvZ2V0aGVyLCBhbmQgY29tcHV0ZSB0aGUgY3VydmVzIGFuZFxyXG4gICAqIGhvbGVzIHByb3Blcmx5LCBnaXZlbiBhIGZpbGxlZCBcIm5vcm1hbFwiIGdyYXBoLlxyXG4gICAqL1xyXG4gIGNyZWF0ZUZpbGxlZFN1YkdyYXBoKCkge1xyXG4gICAgY29uc3QgZ3JhcGggPSBuZXcgR3JhcGgoKTtcclxuXHJcbiAgICBjb25zdCB2ZXJ0ZXhNYXAgPSB7fTsgLy8gb2xkIGlkID0+IG5ld1ZlcnRleFxyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuZWRnZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGVkZ2UgPSB0aGlzLmVkZ2VzWyBpIF07XHJcbiAgICAgIGlmICggZWRnZS5mb3J3YXJkSGFsZi5mYWNlLmZpbGxlZCAhPT0gZWRnZS5yZXZlcnNlZEhhbGYuZmFjZS5maWxsZWQgKSB7XHJcbiAgICAgICAgaWYgKCAhdmVydGV4TWFwWyBlZGdlLnN0YXJ0VmVydGV4LmlkIF0gKSB7XHJcbiAgICAgICAgICBjb25zdCBuZXdTdGFydFZlcnRleCA9IFZlcnRleC5wb29sLmNyZWF0ZSggZWRnZS5zdGFydFZlcnRleC5wb2ludCApO1xyXG4gICAgICAgICAgZ3JhcGgudmVydGljZXMucHVzaCggbmV3U3RhcnRWZXJ0ZXggKTtcclxuICAgICAgICAgIHZlcnRleE1hcFsgZWRnZS5zdGFydFZlcnRleC5pZCBdID0gbmV3U3RhcnRWZXJ0ZXg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggIXZlcnRleE1hcFsgZWRnZS5lbmRWZXJ0ZXguaWQgXSApIHtcclxuICAgICAgICAgIGNvbnN0IG5ld0VuZFZlcnRleCA9IFZlcnRleC5wb29sLmNyZWF0ZSggZWRnZS5lbmRWZXJ0ZXgucG9pbnQgKTtcclxuICAgICAgICAgIGdyYXBoLnZlcnRpY2VzLnB1c2goIG5ld0VuZFZlcnRleCApO1xyXG4gICAgICAgICAgdmVydGV4TWFwWyBlZGdlLmVuZFZlcnRleC5pZCBdID0gbmV3RW5kVmVydGV4O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc3RhcnRWZXJ0ZXggPSB2ZXJ0ZXhNYXBbIGVkZ2Uuc3RhcnRWZXJ0ZXguaWQgXTtcclxuICAgICAgICBjb25zdCBlbmRWZXJ0ZXggPSB2ZXJ0ZXhNYXBbIGVkZ2UuZW5kVmVydGV4LmlkIF07XHJcbiAgICAgICAgZ3JhcGguYWRkRWRnZSggRWRnZS5wb29sLmNyZWF0ZSggZWRnZS5zZWdtZW50LCBzdGFydFZlcnRleCwgZW5kVmVydGV4ICkgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFJ1biBzb21lIG1vcmUgXCJzaW1wbGlmaWVkXCIgcHJvY2Vzc2luZyBvbiB0aGlzIGdyYXBoIHRvIGRldGVybWluZSB3aGljaCBmYWNlcyBhcmUgZmlsbGVkIChhZnRlciBzaW1wbGlmaWNhdGlvbikuXHJcbiAgICAvLyBXZSBkb24ndCBuZWVkIHRoZSBpbnRlcnNlY3Rpb24gb3Igb3RoZXIgcHJvY2Vzc2luZyBzdGVwcywgc2luY2UgdGhpcyB3YXMgYWNjb21wbGlzaGVkIChwcmVzdW1hYmx5KSBhbHJlYWR5XHJcbiAgICAvLyBmb3IgdGhlIGdpdmVuIGdyYXBoLlxyXG4gICAgZ3JhcGguY29sbGFwc2VBZGphY2VudEVkZ2VzKCk7XHJcbiAgICBncmFwaC5vcmRlclZlcnRleEVkZ2VzKCk7XHJcbiAgICBncmFwaC5leHRyYWN0RmFjZXMoKTtcclxuICAgIGdyYXBoLmNvbXB1dGVCb3VuZGFyeVRyZWUoKTtcclxuICAgIGdyYXBoLmZpbGxBbHRlcm5hdGluZ0ZhY2VzKCk7XHJcblxyXG4gICAgcmV0dXJuIGdyYXBoO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIFNoYXBlIHRoYXQgY3JlYXRlcyBhIHN1YnBhdGggZm9yIGVhY2ggZmlsbGVkIGZhY2UgKHdpdGggdGhlIGRlc2lyZWQgaG9sZXMpLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEdlbmVyYWxseSBzaG91bGQgYmUgY2FsbGVkIG9uIGEgZ3JhcGggY3JlYXRlZCB3aXRoIGNyZWF0ZUZpbGxlZFN1YkdyYXBoKCkuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7U2hhcGV9XHJcbiAgICovXHJcbiAgZmFjZXNUb1NoYXBlKCkge1xyXG4gICAgY29uc3Qgc3VicGF0aHMgPSBbXTtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuZmFjZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGZhY2UgPSB0aGlzLmZhY2VzWyBpIF07XHJcbiAgICAgIGlmICggZmFjZS5maWxsZWQgKSB7XHJcbiAgICAgICAgc3VicGF0aHMucHVzaCggZmFjZS5ib3VuZGFyeS50b1N1YnBhdGgoKSApO1xyXG4gICAgICAgIGZvciAoIGxldCBqID0gMDsgaiA8IGZhY2UuaG9sZXMubGVuZ3RoOyBqKysgKSB7XHJcbiAgICAgICAgICBzdWJwYXRocy5wdXNoKCBmYWNlLmhvbGVzWyBqIF0udG9TdWJwYXRoKCkgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXcga2l0ZS5TaGFwZSggc3VicGF0aHMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbGVhc2VzIG93bmVkIG9iamVjdHMgdG8gdGhlaXIgcG9vbHMsIGFuZCBjbGVhcnMgcmVmZXJlbmNlcyB0aGF0IG1heSBoYXZlIGJlZW4gcGlja2VkIHVwIGZyb20gZXh0ZXJuYWwgc291cmNlcy5cclxuICAgKiBAcHVibGljXHJcbiAgICovXHJcbiAgZGlzcG9zZSgpIHtcclxuXHJcbiAgICAvLyB0aGlzLmJvdW5kYXJpZXMgc2hvdWxkIGNvbnRhaW4gYWxsIGVsZW1lbnRzIG9mIGlubmVyQm91bmRhcmllcyBhbmQgb3V0ZXJCb3VuZGFyaWVzXHJcbiAgICB3aGlsZSAoIHRoaXMuYm91bmRhcmllcy5sZW5ndGggKSB7XHJcbiAgICAgIHRoaXMuYm91bmRhcmllcy5wb3AoKS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcbiAgICBjbGVhbkFycmF5KCB0aGlzLmlubmVyQm91bmRhcmllcyApO1xyXG4gICAgY2xlYW5BcnJheSggdGhpcy5vdXRlckJvdW5kYXJpZXMgKTtcclxuXHJcbiAgICB3aGlsZSAoIHRoaXMubG9vcHMubGVuZ3RoICkge1xyXG4gICAgICB0aGlzLmxvb3BzLnBvcCgpLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuICAgIHdoaWxlICggdGhpcy5mYWNlcy5sZW5ndGggKSB7XHJcbiAgICAgIHRoaXMuZmFjZXMucG9wKCkuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG4gICAgd2hpbGUgKCB0aGlzLnZlcnRpY2VzLmxlbmd0aCApIHtcclxuICAgICAgdGhpcy52ZXJ0aWNlcy5wb3AoKS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcbiAgICB3aGlsZSAoIHRoaXMuZWRnZXMubGVuZ3RoICkge1xyXG4gICAgICB0aGlzLmVkZ2VzLnBvcCgpLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYW4gZWRnZSB0byB0aGUgZ3JhcGggKGFuZCBzZXRzIHVwIGNvbm5lY3Rpb24gaW5mb3JtYXRpb24pLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0VkZ2V9IGVkZ2VcclxuICAgKi9cclxuICBhZGRFZGdlKCBlZGdlICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggZWRnZSBpbnN0YW5jZW9mIEVkZ2UgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFfLmluY2x1ZGVzKCBlZGdlLnN0YXJ0VmVydGV4LmluY2lkZW50SGFsZkVkZ2VzLCBlZGdlLnJldmVyc2VkSGFsZiApLCAnU2hvdWxkIG5vdCBhbHJlYWR5IGJlIGNvbm5lY3RlZCcgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFfLmluY2x1ZGVzKCBlZGdlLmVuZFZlcnRleC5pbmNpZGVudEhhbGZFZGdlcywgZWRnZS5mb3J3YXJkSGFsZiApLCAnU2hvdWxkIG5vdCBhbHJlYWR5IGJlIGNvbm5lY3RlZCcgKTtcclxuXHJcbiAgICB0aGlzLmVkZ2VzLnB1c2goIGVkZ2UgKTtcclxuICAgIGVkZ2Uuc3RhcnRWZXJ0ZXguaW5jaWRlbnRIYWxmRWRnZXMucHVzaCggZWRnZS5yZXZlcnNlZEhhbGYgKTtcclxuICAgIGVkZ2UuZW5kVmVydGV4LmluY2lkZW50SGFsZkVkZ2VzLnB1c2goIGVkZ2UuZm9yd2FyZEhhbGYgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgYW4gZWRnZSBmcm9tIHRoZSBncmFwaCAoYW5kIGRpc2Nvbm5lY3RzIGluY2lkZW50IGluZm9ybWF0aW9uKS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtFZGdlfSBlZGdlXHJcbiAgICovXHJcbiAgcmVtb3ZlRWRnZSggZWRnZSApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGVkZ2UgaW5zdGFuY2VvZiBFZGdlICk7XHJcblxyXG4gICAgYXJyYXlSZW1vdmUoIHRoaXMuZWRnZXMsIGVkZ2UgKTtcclxuICAgIGFycmF5UmVtb3ZlKCBlZGdlLnN0YXJ0VmVydGV4LmluY2lkZW50SGFsZkVkZ2VzLCBlZGdlLnJldmVyc2VkSGFsZiApO1xyXG4gICAgYXJyYXlSZW1vdmUoIGVkZ2UuZW5kVmVydGV4LmluY2lkZW50SGFsZkVkZ2VzLCBlZGdlLmZvcndhcmRIYWxmICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXBsYWNlcyBhIHNpbmdsZSBlZGdlIChpbiBsb29wcykgd2l0aCBhIHNlcmllcyBvZiBlZGdlcyAocG9zc2libHkgZW1wdHkpLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0VkZ2V9IGVkZ2VcclxuICAgKiBAcGFyYW0ge0FycmF5LjxIYWxmRWRnZT59IGZvcndhcmRIYWxmRWRnZXNcclxuICAgKi9cclxuICByZXBsYWNlRWRnZUluTG9vcHMoIGVkZ2UsIGZvcndhcmRIYWxmRWRnZXMgKSB7XHJcbiAgICAvLyBDb21wdXRlIHJldmVyc2VkIGhhbGYtZWRnZXNcclxuICAgIGNvbnN0IHJldmVyc2VkSGFsZkVkZ2VzID0gW107XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBmb3J3YXJkSGFsZkVkZ2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICByZXZlcnNlZEhhbGZFZGdlcy5wdXNoKCBmb3J3YXJkSGFsZkVkZ2VzWyBmb3J3YXJkSGFsZkVkZ2VzLmxlbmd0aCAtIDEgLSBpIF0uZ2V0UmV2ZXJzZWQoKSApO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMubG9vcHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGxvb3AgPSB0aGlzLmxvb3BzWyBpIF07XHJcblxyXG4gICAgICBmb3IgKCBsZXQgaiA9IGxvb3AuaGFsZkVkZ2VzLmxlbmd0aCAtIDE7IGogPj0gMDsgai0tICkge1xyXG4gICAgICAgIGNvbnN0IGhhbGZFZGdlID0gbG9vcC5oYWxmRWRnZXNbIGogXTtcclxuXHJcbiAgICAgICAgaWYgKCBoYWxmRWRnZS5lZGdlID09PSBlZGdlICkge1xyXG4gICAgICAgICAgY29uc3QgcmVwbGFjZW1lbnRIYWxmRWRnZXMgPSBoYWxmRWRnZSA9PT0gZWRnZS5mb3J3YXJkSGFsZiA/IGZvcndhcmRIYWxmRWRnZXMgOiByZXZlcnNlZEhhbGZFZGdlcztcclxuICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5zcGxpY2UuYXBwbHkoIGxvb3AuaGFsZkVkZ2VzLCBbIGosIDEgXS5jb25jYXQoIHJlcGxhY2VtZW50SGFsZkVkZ2VzICkgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyaWVzIHRvIGNvbWJpbmUgYWRqYWNlbnQgZWRnZXMgKHdpdGggYSAyLW9yZGVyIHZlcnRleCkgaW50byBvbmUgZWRnZSB3aGVyZSBwb3NzaWJsZS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogVGhpcyBoZWxwcyB0byBjb21iaW5lIHRoaW5ncyBsaWtlIGNvbGxpbmVhciBsaW5lcywgd2hlcmUgdGhlcmUncyBhIHZlcnRleCB0aGF0IGNhbiBiYXNpY2FsbHkgYmUgcmVtb3ZlZC5cclxuICAgKi9cclxuICBjb2xsYXBzZUFkamFjZW50RWRnZXMoKSB7XHJcbiAgICBsZXQgbmVlZHNMb29wID0gdHJ1ZTtcclxuICAgIHdoaWxlICggbmVlZHNMb29wICkge1xyXG4gICAgICBuZWVkc0xvb3AgPSBmYWxzZTtcclxuXHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMudmVydGljZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgY29uc3QgdmVydGV4ID0gdGhpcy52ZXJ0aWNlc1sgaSBdO1xyXG4gICAgICAgIGlmICggdmVydGV4LmluY2lkZW50SGFsZkVkZ2VzLmxlbmd0aCA9PT0gMiApIHtcclxuICAgICAgICAgIGNvbnN0IGFFZGdlID0gdmVydGV4LmluY2lkZW50SGFsZkVkZ2VzWyAwIF0uZWRnZTtcclxuICAgICAgICAgIGNvbnN0IGJFZGdlID0gdmVydGV4LmluY2lkZW50SGFsZkVkZ2VzWyAxIF0uZWRnZTtcclxuICAgICAgICAgIGxldCBhU2VnbWVudCA9IGFFZGdlLnNlZ21lbnQ7XHJcbiAgICAgICAgICBsZXQgYlNlZ21lbnQgPSBiRWRnZS5zZWdtZW50O1xyXG4gICAgICAgICAgY29uc3QgYVZlcnRleCA9IGFFZGdlLmdldE90aGVyVmVydGV4KCB2ZXJ0ZXggKTtcclxuICAgICAgICAgIGNvbnN0IGJWZXJ0ZXggPSBiRWRnZS5nZXRPdGhlclZlcnRleCggdmVydGV4ICk7XHJcblxyXG4gICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5sb29wcy5sZW5ndGggPT09IDAgKTtcclxuXHJcbiAgICAgICAgICAvLyBUT0RPOiBDYW4gd2UgYXZvaWQgdGhpcyBpbiB0aGUgaW5uZXIgbG9vcD8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICAgICAgICBpZiAoIGFFZGdlLnN0YXJ0VmVydGV4ID09PSB2ZXJ0ZXggKSB7XHJcbiAgICAgICAgICAgIGFTZWdtZW50ID0gYVNlZ21lbnQucmV2ZXJzZWQoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICggYkVkZ2UuZW5kVmVydGV4ID09PSB2ZXJ0ZXggKSB7XHJcbiAgICAgICAgICAgIGJTZWdtZW50ID0gYlNlZ21lbnQucmV2ZXJzZWQoKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoIGFTZWdtZW50IGluc3RhbmNlb2YgTGluZSAmJiBiU2VnbWVudCBpbnN0YW5jZW9mIExpbmUgKSB7XHJcbiAgICAgICAgICAgIC8vIFNlZSBpZiB0aGUgbGluZXMgYXJlIGNvbGxpbmVhciwgc28gdGhhdCB3ZSBjYW4gY29tYmluZSB0aGVtIGludG8gb25lIGVkZ2VcclxuICAgICAgICAgICAgaWYgKCBhU2VnbWVudC50YW5nZW50QXQoIDAgKS5ub3JtYWxpemVkKCkuZGlzdGFuY2UoIGJTZWdtZW50LnRhbmdlbnRBdCggMCApLm5vcm1hbGl6ZWQoKSApIDwgMWUtNiApIHtcclxuICAgICAgICAgICAgICB0aGlzLnJlbW92ZUVkZ2UoIGFFZGdlICk7XHJcbiAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFZGdlKCBiRWRnZSApO1xyXG4gICAgICAgICAgICAgIGFFZGdlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICBiRWRnZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgYXJyYXlSZW1vdmUoIHRoaXMudmVydGljZXMsIHZlcnRleCApO1xyXG4gICAgICAgICAgICAgIHZlcnRleC5kaXNwb3NlKCk7XHJcblxyXG4gICAgICAgICAgICAgIGNvbnN0IG5ld1NlZ21lbnQgPSBuZXcgTGluZSggYVZlcnRleC5wb2ludCwgYlZlcnRleC5wb2ludCApO1xyXG4gICAgICAgICAgICAgIHRoaXMuYWRkRWRnZSggbmV3IEVkZ2UoIG5ld1NlZ21lbnQsIGFWZXJ0ZXgsIGJWZXJ0ZXggKSApO1xyXG5cclxuICAgICAgICAgICAgICBuZWVkc0xvb3AgPSB0cnVlO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHJpZCBvZiBvdmVybGFwcGluZyBzZWdtZW50cyBieSBjb21iaW5pbmcgb3ZlcmxhcHMgaW50byBhIHNoYXJlZCBlZGdlLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgZWxpbWluYXRlT3ZlcmxhcCgpIHtcclxuXHJcbiAgICAvLyBXZSdsbCBleHBhbmQgYm91bmRzIGJ5IHRoaXMgYW1vdW50LCBzbyB0aGF0IFwiYWRqYWNlbnRcIiBib3VuZHMgKHdpdGggYSBwb3RlbnRpYWxseSBvdmVybGFwcGluZyB2ZXJ0aWNhbCBvclxyXG4gICAgLy8gaG9yaXpvbnRhbCBsaW5lKSB3aWxsIGhhdmUgYSBub24temVybyBhbW91bnQgb2YgYXJlYSBvdmVybGFwcGluZy5cclxuICAgIGNvbnN0IGVwc2lsb24gPSAxZS00O1xyXG5cclxuICAgIC8vIE91ciBxdWV1ZSB3aWxsIHN0b3JlIGVudHJpZXMgb2YgeyBzdGFydDogYm9vbGVhbiwgZWRnZTogRWRnZSB9LCByZXByZXNlbnRpbmcgYSBzd2VlcCBsaW5lIHNpbWlsYXIgdG8gdGhlXHJcbiAgICAvLyBCZW50bGV5LU90dG1hbm4gYXBwcm9hY2guIFdlJ2xsIHRyYWNrIHdoaWNoIGVkZ2VzIGFyZSBwYXNzaW5nIHRocm91Z2ggdGhlIHN3ZWVwIGxpbmUuXHJcbiAgICBjb25zdCBxdWV1ZSA9IG5ldyB3aW5kb3cuRmxhdFF1ZXVlKCk7XHJcblxyXG4gICAgLy8gVHJhY2tzIHdoaWNoIGVkZ2VzIGFyZSB0aHJvdWdoIHRoZSBzd2VlcCBsaW5lLCBidXQgaW4gYSBncmFwaCBzdHJ1Y3R1cmUgbGlrZSBhIHNlZ21lbnQvaW50ZXJ2YWwgdHJlZSwgc28gdGhhdCB3ZVxyXG4gICAgLy8gY2FuIGhhdmUgZmFzdCBsb29rdXAgKHdoYXQgZWRnZXMgYXJlIGluIGEgY2VydGFpbiByYW5nZSkgYW5kIGFsc28gZmFzdCBpbnNlcnRzL3JlbW92YWxzLlxyXG4gICAgY29uc3Qgc2VnbWVudFRyZWUgPSBuZXcgRWRnZVNlZ21lbnRUcmVlKCBlcHNpbG9uICk7XHJcblxyXG4gICAgLy8gQXNzb3J0ZWQgb3BlcmF0aW9ucyB1c2UgYSBzaG9ydGN1dCB0byBcInRhZ1wiIGVkZ2VzIHdpdGggYSB1bmlxdWUgSUQsIHRvIGluZGljYXRlIGl0IGhhcyBhbHJlYWR5IGJlZW4gcHJvY2Vzc2VkXHJcbiAgICAvLyBmb3IgdGhpcyBjYWxsIG9mIGVsaW1pbmF0ZU92ZXJsYXAoKS4gVGhpcyBpcyBhIGhpZ2hlci1wZXJmb3JtYW5jZSBvcHRpb24gdG8gc3RvcmluZyBhbiBhcnJheSBvZiBcImFscmVhZHlcclxuICAgIC8vIHByb2Nlc3NlZFwiIGVkZ2VzLlxyXG4gICAgY29uc3QgbmV4dElkID0gZ2xvYmFsSWQrKztcclxuXHJcbiAgICAvLyBBZGRzIGFuIGVkZ2UgdG8gdGhlIHF1ZXVlXHJcbiAgICBjb25zdCBhZGRUb1F1ZXVlID0gZWRnZSA9PiB7XHJcbiAgICAgIGNvbnN0IGJvdW5kcyA9IGVkZ2Uuc2VnbWVudC5ib3VuZHM7XHJcblxyXG4gICAgICAvLyBUT0RPOiBzZWUgaWYgb2JqZWN0IGFsbG9jYXRpb25zIGFyZSBzbG93IGhlcmUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICAgIHF1ZXVlLnB1c2goIHsgc3RhcnQ6IHRydWUsIGVkZ2U6IGVkZ2UgfSwgYm91bmRzLm1pblkgLSBlcHNpbG9uICk7XHJcbiAgICAgIHF1ZXVlLnB1c2goIHsgc3RhcnQ6IGZhbHNlLCBlZGdlOiBlZGdlIH0sIGJvdW5kcy5tYXhZICsgZXBzaWxvbiApO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBSZW1vdmVzIGFuIGVkZ2UgZnJvbSB0aGUgcXVldWUgKGVmZmVjdGl2ZWx5Li4uIHdoZW4gd2UgcG9wIGZyb20gdGhlIHF1ZXVlLCB3ZSdsbCBjaGVjayBpdHMgSUQgZGF0YSwgYW5kIGlmIGl0IHdhc1xyXG4gICAgLy8gXCJyZW1vdmVkXCIgd2Ugd2lsbCBpZ25vcmUgaXQuIEhpZ2hlci1wZXJmb3JtYW5jZSB0aGFuIHVzaW5nIGFuIGFycmF5LlxyXG4gICAgY29uc3QgcmVtb3ZlRnJvbVF1ZXVlID0gZWRnZSA9PiB7XHJcbiAgICAgIC8vIFN0b3JlIHRoZSBJRCBzbyB3ZSBjYW4gaGF2ZSBhIGhpZ2gtcGVyZm9ybWFuY2UgcmVtb3ZhbFxyXG4gICAgICBlZGdlLmludGVybmFsRGF0YS5yZW1vdmVkSWQgPSBuZXh0SWQ7XHJcbiAgICB9O1xyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuZWRnZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGFkZFRvUXVldWUoIHRoaXMuZWRnZXNbIGkgXSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFdlIHRyYWNrIGVkZ2VzIHRvIGRpc3Bvc2Ugc2VwYXJhdGVseSwgaW5zdGVhZCBvZiBzeW5jaHJvbm91c2x5IGRpc3Bvc2luZyB0aGVtLiBUaGlzIGlzIG1haW5seSBkdWUgdG8gdGhlIHRyaWNrIG9mXHJcbiAgICAvLyByZW1vdmFsIElEcywgc2luY2UgaWYgd2UgcmUtdXNlZCBwb29sZWQgRWRnZXMgd2hlbiBjcmVhdGluZywgdGhleSB3b3VsZCBzdGlsbCBoYXZlIHRoZSBJRCBPUiB0aGV5IHdvdWxkIGxvc2UgdGhlXHJcbiAgICAvLyBcInJlbW92ZWRcIiBpbmZvcm1hdGlvbi5cclxuICAgIGNvbnN0IGVkZ2VzVG9EaXNwb3NlID0gW107XHJcblxyXG4gICAgd2hpbGUgKCBxdWV1ZS5sZW5ndGggKSB7XHJcbiAgICAgIGNvbnN0IGVudHJ5ID0gcXVldWUucG9wKCk7XHJcbiAgICAgIGNvbnN0IGVkZ2UgPSBlbnRyeS5lZGdlO1xyXG5cclxuICAgICAgLy8gU2tpcCBlZGdlcyB3ZSBhbHJlYWR5IHJlbW92ZWRcclxuICAgICAgaWYgKCBlZGdlLmludGVybmFsRGF0YS5yZW1vdmVkSWQgPT09IG5leHRJZCApIHtcclxuICAgICAgICBjb250aW51ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCBlbnRyeS5zdGFydCApIHtcclxuICAgICAgICAvLyBXZSdsbCBiYWlsIG91dCBvZiB0aGUgbG9vcCBpZiB3ZSBmaW5kIG92ZXJsYXBzLCBhbmQgd2UnbGwgc3RvcmUgdGhlIHJlbGV2YW50IGluZm9ybWF0aW9uIGluIHRoZXNlXHJcbiAgICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XHJcbiAgICAgICAgbGV0IG92ZXJsYXBwZWRFZGdlO1xyXG4gICAgICAgIGxldCBhZGRlZEVkZ2VzO1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBJcyB0aGlzIGNsb3N1cmUga2lsbGluZyBwZXJmb3JtYW5jZT8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICAgICAgc2VnbWVudFRyZWUucXVlcnkoIGVkZ2UsIG90aGVyRWRnZSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBvdmVybGFwcyA9IGVkZ2Uuc2VnbWVudC5nZXRPdmVybGFwcyggb3RoZXJFZGdlLnNlZ21lbnQgKTtcclxuXHJcbiAgICAgICAgICBpZiAoIG92ZXJsYXBzICE9PSBudWxsICYmIG92ZXJsYXBzLmxlbmd0aCApIHtcclxuICAgICAgICAgICAgZm9yICggbGV0IGsgPSAwOyBrIDwgb3ZlcmxhcHMubGVuZ3RoOyBrKysgKSB7XHJcbiAgICAgICAgICAgICAgY29uc3Qgb3ZlcmxhcCA9IG92ZXJsYXBzWyBrIF07XHJcbiAgICAgICAgICAgICAgaWYgKCBNYXRoLmFicyggb3ZlcmxhcC50MSAtIG92ZXJsYXAudDAgKSA+IDFlLTUgJiZcclxuICAgICAgICAgICAgICAgICAgIE1hdGguYWJzKCBvdmVybGFwLnF0MSAtIG92ZXJsYXAucXQwICkgPiAxZS01ICkge1xyXG5cclxuICAgICAgICAgICAgICAgIGFkZGVkRWRnZXMgPSB0aGlzLnNwbGl0T3ZlcmxhcCggZWRnZSwgb3RoZXJFZGdlLCBvdmVybGFwICk7XHJcbiAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBvdmVybGFwcGVkRWRnZSA9IG90aGVyRWRnZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgIGlmICggZm91bmQgKSB7XHJcbiAgICAgICAgICAvLyBXZSBoYXZlbid0IGFkZGVkIG91ciBlZGdlIHlldCwgc28gbm8gbmVlZCB0byByZW1vdmUgaXQuXHJcbiAgICAgICAgICBzZWdtZW50VHJlZS5yZW1vdmVJdGVtKCBvdmVybGFwcGVkRWRnZSApO1xyXG5cclxuICAgICAgICAgIC8vIEFkanVzdCB0aGUgcXVldWVcclxuICAgICAgICAgIHJlbW92ZUZyb21RdWV1ZSggb3ZlcmxhcHBlZEVkZ2UgKTtcclxuICAgICAgICAgIHJlbW92ZUZyb21RdWV1ZSggZWRnZSApO1xyXG4gICAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgYWRkZWRFZGdlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgYWRkVG9RdWV1ZSggYWRkZWRFZGdlc1sgaSBdICk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgZWRnZXNUb0Rpc3Bvc2UucHVzaCggZWRnZSApO1xyXG4gICAgICAgICAgZWRnZXNUb0Rpc3Bvc2UucHVzaCggb3ZlcmxhcHBlZEVkZ2UgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAvLyBObyBvdmVybGFwcyBmb3VuZCwgYWRkIGl0IGFuZCBjb250aW51ZVxyXG4gICAgICAgICAgc2VnbWVudFRyZWUuYWRkSXRlbSggZWRnZSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICAvLyBSZW1vdmFsIGNhbid0IHRyaWdnZXIgYW4gaW50ZXJzZWN0aW9uLCBzbyB3ZSBjYW4gc2FmZWx5IHJlbW92ZSBpdFxyXG4gICAgICAgIHNlZ21lbnRUcmVlLnJlbW92ZUl0ZW0oIGVkZ2UgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGVkZ2VzVG9EaXNwb3NlLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBlZGdlc1RvRGlzcG9zZVsgaSBdLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNwbGl0cy9jb21iaW5lcyBlZGdlcyB3aGVuIHRoZXJlIGlzIGFuIG92ZXJsYXAgb2YgdHdvIGVkZ2VzICh0d28gZWRnZXMgd2hvIGhhdmUgYW4gaW5maW5pdGUgbnVtYmVyIG9mXHJcbiAgICogaW50ZXJzZWN0aW9uIHBvaW50cykuXHJcbiAgICogQHByaXZhdGVcclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgZG9lcyBOT1QgZGlzcG9zZSBhRWRnZS9iRWRnZSwgZHVlIHRvIGVsaW1pbmF0ZU92ZXJsYXAncyBuZWVkcy5cclxuICAgKlxyXG4gICAqIEdlbmVyYWxseSB0aGlzIGNyZWF0ZXMgYW4gZWRnZSBmb3IgdGhlIFwic2hhcmVkXCIgcGFydCBvZiBib3RoIHNlZ21lbnRzLCBhbmQgdGhlbiBjcmVhdGVzIGVkZ2VzIGZvciB0aGUgcGFydHNcclxuICAgKiBvdXRzaWRlIG9mIHRoZSBzaGFyZWQgcmVnaW9uLCBjb25uZWN0aW5nIHRoZW0gdG9nZXRoZXIuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0VkZ2V9IGFFZGdlXHJcbiAgICogQHBhcmFtIHtFZGdlfSBiRWRnZVxyXG4gICAqIEBwYXJhbSB7T3ZlcmxhcH0gb3ZlcmxhcFxyXG4gICAqIEByZXR1cm5zIHtBcnJheS48RWRnZT59XHJcbiAgICovXHJcbiAgc3BsaXRPdmVybGFwKCBhRWRnZSwgYkVkZ2UsIG92ZXJsYXAgKSB7XHJcbiAgICBjb25zdCBuZXdFZGdlcyA9IFtdO1xyXG5cclxuICAgIGNvbnN0IGFTZWdtZW50ID0gYUVkZ2Uuc2VnbWVudDtcclxuICAgIGNvbnN0IGJTZWdtZW50ID0gYkVkZ2Uuc2VnbWVudDtcclxuXHJcbiAgICAvLyBSZW1vdmUgdGhlIGVkZ2VzIGZyb20gYmVmb3JlXHJcbiAgICB0aGlzLnJlbW92ZUVkZ2UoIGFFZGdlICk7XHJcbiAgICB0aGlzLnJlbW92ZUVkZ2UoIGJFZGdlICk7XHJcblxyXG4gICAgbGV0IHQwID0gb3ZlcmxhcC50MDtcclxuICAgIGxldCB0MSA9IG92ZXJsYXAudDE7XHJcbiAgICBsZXQgcXQwID0gb3ZlcmxhcC5xdDA7XHJcbiAgICBsZXQgcXQxID0gb3ZlcmxhcC5xdDE7XHJcblxyXG4gICAgLy8gQXBwbHkgcm91bmRpbmcgc28gd2UgZG9uJ3QgZ2VuZXJhdGUgcmVhbGx5IHNtYWxsIHNlZ21lbnRzIG9uIHRoZSBlbmRzXHJcbiAgICBpZiAoIHQwIDwgMWUtNSApIHsgdDAgPSAwOyB9XHJcbiAgICBpZiAoIHQxID4gMSAtIDFlLTUgKSB7IHQxID0gMTsgfVxyXG4gICAgaWYgKCBxdDAgPCAxZS01ICkgeyBxdDAgPSAwOyB9XHJcbiAgICBpZiAoIHF0MSA+IDEgLSAxZS01ICkgeyBxdDEgPSAxOyB9XHJcblxyXG4gICAgLy8gV2hldGhlciB0aGVyZSB3aWxsIGJlIHJlbWFpbmluZyBlZGdlcyBvbiBlYWNoIHNpZGUuXHJcbiAgICBjb25zdCBhQmVmb3JlID0gdDAgPiAwID8gYVNlZ21lbnQuc3ViZGl2aWRlZCggdDAgKVsgMCBdIDogbnVsbDtcclxuICAgIGNvbnN0IGJCZWZvcmUgPSBxdDAgPiAwID8gYlNlZ21lbnQuc3ViZGl2aWRlZCggcXQwIClbIDAgXSA6IG51bGw7XHJcbiAgICBjb25zdCBhQWZ0ZXIgPSB0MSA8IDEgPyBhU2VnbWVudC5zdWJkaXZpZGVkKCB0MSApWyAxIF0gOiBudWxsO1xyXG4gICAgY29uc3QgYkFmdGVyID0gcXQxIDwgMSA/IGJTZWdtZW50LnN1YmRpdmlkZWQoIHF0MSApWyAxIF0gOiBudWxsO1xyXG5cclxuICAgIGxldCBtaWRkbGUgPSBhU2VnbWVudDtcclxuICAgIGlmICggdDAgPiAwICkge1xyXG4gICAgICBtaWRkbGUgPSBtaWRkbGUuc3ViZGl2aWRlZCggdDAgKVsgMSBdO1xyXG4gICAgfVxyXG4gICAgaWYgKCB0MSA8IDEgKSB7XHJcbiAgICAgIG1pZGRsZSA9IG1pZGRsZS5zdWJkaXZpZGVkKCBVdGlscy5saW5lYXIoIHQwLCAxLCAwLCAxLCB0MSApIClbIDAgXTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgYmVmb3JlVmVydGV4O1xyXG4gICAgaWYgKCBhQmVmb3JlICYmIGJCZWZvcmUgKSB7XHJcbiAgICAgIGJlZm9yZVZlcnRleCA9IFZlcnRleC5wb29sLmNyZWF0ZSggbWlkZGxlLnN0YXJ0ICk7XHJcbiAgICAgIHRoaXMudmVydGljZXMucHVzaCggYmVmb3JlVmVydGV4ICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggYUJlZm9yZSApIHtcclxuICAgICAgYmVmb3JlVmVydGV4ID0gb3ZlcmxhcC5hID4gMCA/IGJFZGdlLnN0YXJ0VmVydGV4IDogYkVkZ2UuZW5kVmVydGV4O1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGJlZm9yZVZlcnRleCA9IGFFZGdlLnN0YXJ0VmVydGV4O1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBhZnRlclZlcnRleDtcclxuICAgIGlmICggYUFmdGVyICYmIGJBZnRlciApIHtcclxuICAgICAgYWZ0ZXJWZXJ0ZXggPSBWZXJ0ZXgucG9vbC5jcmVhdGUoIG1pZGRsZS5lbmQgKTtcclxuICAgICAgdGhpcy52ZXJ0aWNlcy5wdXNoKCBhZnRlclZlcnRleCApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGFBZnRlciApIHtcclxuICAgICAgYWZ0ZXJWZXJ0ZXggPSBvdmVybGFwLmEgPiAwID8gYkVkZ2UuZW5kVmVydGV4IDogYkVkZ2Uuc3RhcnRWZXJ0ZXg7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgYWZ0ZXJWZXJ0ZXggPSBhRWRnZS5lbmRWZXJ0ZXg7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbWlkZGxlRWRnZSA9IEVkZ2UucG9vbC5jcmVhdGUoIG1pZGRsZSwgYmVmb3JlVmVydGV4LCBhZnRlclZlcnRleCApO1xyXG4gICAgbmV3RWRnZXMucHVzaCggbWlkZGxlRWRnZSApO1xyXG5cclxuICAgIGxldCBhQmVmb3JlRWRnZTtcclxuICAgIGxldCBhQWZ0ZXJFZGdlO1xyXG4gICAgbGV0IGJCZWZvcmVFZGdlO1xyXG4gICAgbGV0IGJBZnRlckVkZ2U7XHJcblxyXG4gICAgLy8gQWRkIFwibGVmdG92ZXJcIiBlZGdlc1xyXG4gICAgaWYgKCBhQmVmb3JlICkge1xyXG4gICAgICBhQmVmb3JlRWRnZSA9IEVkZ2UucG9vbC5jcmVhdGUoIGFCZWZvcmUsIGFFZGdlLnN0YXJ0VmVydGV4LCBiZWZvcmVWZXJ0ZXggKTtcclxuICAgICAgbmV3RWRnZXMucHVzaCggYUJlZm9yZUVkZ2UgKTtcclxuICAgIH1cclxuICAgIGlmICggYUFmdGVyICkge1xyXG4gICAgICBhQWZ0ZXJFZGdlID0gRWRnZS5wb29sLmNyZWF0ZSggYUFmdGVyLCBhZnRlclZlcnRleCwgYUVkZ2UuZW5kVmVydGV4ICk7XHJcbiAgICAgIG5ld0VkZ2VzLnB1c2goIGFBZnRlckVkZ2UgKTtcclxuICAgIH1cclxuICAgIGlmICggYkJlZm9yZSApIHtcclxuICAgICAgYkJlZm9yZUVkZ2UgPSBFZGdlLnBvb2wuY3JlYXRlKCBiQmVmb3JlLCBiRWRnZS5zdGFydFZlcnRleCwgb3ZlcmxhcC5hID4gMCA/IGJlZm9yZVZlcnRleCA6IGFmdGVyVmVydGV4ICk7XHJcbiAgICAgIG5ld0VkZ2VzLnB1c2goIGJCZWZvcmVFZGdlICk7XHJcbiAgICB9XHJcbiAgICBpZiAoIGJBZnRlciApIHtcclxuICAgICAgYkFmdGVyRWRnZSA9IEVkZ2UucG9vbC5jcmVhdGUoIGJBZnRlciwgb3ZlcmxhcC5hID4gMCA/IGFmdGVyVmVydGV4IDogYmVmb3JlVmVydGV4LCBiRWRnZS5lbmRWZXJ0ZXggKTtcclxuICAgICAgbmV3RWRnZXMucHVzaCggYkFmdGVyRWRnZSApO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IG5ld0VkZ2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICB0aGlzLmFkZEVkZ2UoIG5ld0VkZ2VzWyBpIF0gKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDb2xsZWN0IFwicmVwbGFjZW1lbnRcIiBlZGdlc1xyXG4gICAgY29uc3QgYUVkZ2VzID0gKCBhQmVmb3JlID8gWyBhQmVmb3JlRWRnZSBdIDogW10gKS5jb25jYXQoIFsgbWlkZGxlRWRnZSBdICkuY29uY2F0KCBhQWZ0ZXIgPyBbIGFBZnRlckVkZ2UgXSA6IFtdICk7XHJcbiAgICBjb25zdCBiRWRnZXMgPSAoIGJCZWZvcmUgPyBbIGJCZWZvcmVFZGdlIF0gOiBbXSApLmNvbmNhdCggWyBtaWRkbGVFZGdlIF0gKS5jb25jYXQoIGJBZnRlciA/IFsgYkFmdGVyRWRnZSBdIDogW10gKTtcclxuXHJcbiAgICBjb25zdCBhRm9yd2FyZEhhbGZFZGdlcyA9IFtdO1xyXG4gICAgY29uc3QgYkZvcndhcmRIYWxmRWRnZXMgPSBbXTtcclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBhRWRnZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGFGb3J3YXJkSGFsZkVkZ2VzLnB1c2goIGFFZGdlc1sgaSBdLmZvcndhcmRIYWxmICk7XHJcbiAgICB9XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBiRWRnZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIC8vIEhhbmRsZSByZXZlcnNpbmcgdGhlIFwibWlkZGxlXCIgZWRnZVxyXG4gICAgICBjb25zdCBpc0ZvcndhcmQgPSBiRWRnZXNbIGkgXSAhPT0gbWlkZGxlRWRnZSB8fCBvdmVybGFwLmEgPiAwO1xyXG4gICAgICBiRm9yd2FyZEhhbGZFZGdlcy5wdXNoKCBpc0ZvcndhcmQgPyBiRWRnZXNbIGkgXS5mb3J3YXJkSGFsZiA6IGJFZGdlc1sgaSBdLnJldmVyc2VkSGFsZiApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFJlcGxhY2UgZWRnZXMgaW4gdGhlIGxvb3BzXHJcbiAgICB0aGlzLnJlcGxhY2VFZGdlSW5Mb29wcyggYUVkZ2UsIGFGb3J3YXJkSGFsZkVkZ2VzICk7XHJcbiAgICB0aGlzLnJlcGxhY2VFZGdlSW5Mb29wcyggYkVkZ2UsIGJGb3J3YXJkSGFsZkVkZ2VzICk7XHJcblxyXG4gICAgcmV0dXJuIG5ld0VkZ2VzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlcyBzcGxpdHRpbmcgb2Ygc2VsZi1pbnRlcnNlY3Rpb24gb2Ygc2VnbWVudHMgKGhhcHBlbnMgd2l0aCBDdWJpY3MpLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgZWxpbWluYXRlU2VsZkludGVyc2VjdGlvbigpIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuYm91bmRhcmllcy5sZW5ndGggPT09IDAsICdPbmx5IGhhbmRsZXMgc2ltcGxlciBsZXZlbCBwcmltaXRpdmUgc3BsaXR0aW5nIHJpZ2h0IG5vdycgKTtcclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IHRoaXMuZWRnZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0gKSB7XHJcbiAgICAgIGNvbnN0IGVkZ2UgPSB0aGlzLmVkZ2VzWyBpIF07XHJcbiAgICAgIGNvbnN0IHNlZ21lbnQgPSBlZGdlLnNlZ21lbnQ7XHJcblxyXG4gICAgICBpZiAoIHNlZ21lbnQgaW5zdGFuY2VvZiBDdWJpYyApIHtcclxuICAgICAgICAvLyBUT0RPOiBUaGlzIG1pZ2h0IG5vdCBwcm9wZXJseSBoYW5kbGUgd2hlbiBpdCBvbmx5IG9uZSBlbmRwb2ludCBpcyBvbiB0aGUgY3VydmUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICAgICAgY29uc3Qgc2VsZkludGVyc2VjdGlvbiA9IHNlZ21lbnQuZ2V0U2VsZkludGVyc2VjdGlvbigpO1xyXG5cclxuICAgICAgICBpZiAoIHNlbGZJbnRlcnNlY3Rpb24gKSB7XHJcbiAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBzZWxmSW50ZXJzZWN0aW9uLmFUIDwgc2VsZkludGVyc2VjdGlvbi5iVCApO1xyXG5cclxuICAgICAgICAgIGNvbnN0IHNlZ21lbnRzID0gc2VnbWVudC5zdWJkaXZpc2lvbnMoIFsgc2VsZkludGVyc2VjdGlvbi5hVCwgc2VsZkludGVyc2VjdGlvbi5iVCBdICk7XHJcblxyXG4gICAgICAgICAgY29uc3QgdmVydGV4ID0gVmVydGV4LnBvb2wuY3JlYXRlKCBzZWxmSW50ZXJzZWN0aW9uLnBvaW50ICk7XHJcbiAgICAgICAgICB0aGlzLnZlcnRpY2VzLnB1c2goIHZlcnRleCApO1xyXG5cclxuICAgICAgICAgIGNvbnN0IHN0YXJ0RWRnZSA9IEVkZ2UucG9vbC5jcmVhdGUoIHNlZ21lbnRzWyAwIF0sIGVkZ2Uuc3RhcnRWZXJ0ZXgsIHZlcnRleCApO1xyXG4gICAgICAgICAgY29uc3QgbWlkZGxlRWRnZSA9IEVkZ2UucG9vbC5jcmVhdGUoIHNlZ21lbnRzWyAxIF0sIHZlcnRleCwgdmVydGV4ICk7XHJcbiAgICAgICAgICBjb25zdCBlbmRFZGdlID0gRWRnZS5wb29sLmNyZWF0ZSggc2VnbWVudHNbIDIgXSwgdmVydGV4LCBlZGdlLmVuZFZlcnRleCApO1xyXG5cclxuICAgICAgICAgIHRoaXMucmVtb3ZlRWRnZSggZWRnZSApO1xyXG5cclxuICAgICAgICAgIHRoaXMuYWRkRWRnZSggc3RhcnRFZGdlICk7XHJcbiAgICAgICAgICB0aGlzLmFkZEVkZ2UoIG1pZGRsZUVkZ2UgKTtcclxuICAgICAgICAgIHRoaXMuYWRkRWRnZSggZW5kRWRnZSApO1xyXG5cclxuICAgICAgICAgIHRoaXMucmVwbGFjZUVkZ2VJbkxvb3BzKCBlZGdlLCBbIHN0YXJ0RWRnZS5mb3J3YXJkSGFsZiwgbWlkZGxlRWRnZS5mb3J3YXJkSGFsZiwgZW5kRWRnZS5mb3J3YXJkSGFsZiBdICk7XHJcblxyXG4gICAgICAgICAgZWRnZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXBsYWNlIGludGVyc2VjdGlvbnMgYmV0d2VlbiBkaWZmZXJlbnQgc2VnbWVudHMgYnkgc3BsaXR0aW5nIHRoZW0gYW5kIGNyZWF0aW5nIGEgdmVydGV4LlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgZWxpbWluYXRlSW50ZXJzZWN0aW9uKCkge1xyXG5cclxuICAgIC8vIFdlJ2xsIGV4cGFuZCBib3VuZHMgYnkgdGhpcyBhbW91bnQsIHNvIHRoYXQgXCJhZGphY2VudFwiIGJvdW5kcyAod2l0aCBhIHBvdGVudGlhbGx5IG92ZXJsYXBwaW5nIHZlcnRpY2FsIG9yXHJcbiAgICAvLyBob3Jpem9udGFsIGxpbmUpIHdpbGwgaGF2ZSBhIG5vbi16ZXJvIGFtb3VudCBvZiBhcmVhIG92ZXJsYXBwaW5nLlxyXG4gICAgY29uc3QgZXBzaWxvbiA9IDFlLTQ7XHJcblxyXG4gICAgLy8gT3VyIHF1ZXVlIHdpbGwgc3RvcmUgZW50cmllcyBvZiB7IHN0YXJ0OiBib29sZWFuLCBlZGdlOiBFZGdlIH0sIHJlcHJlc2VudGluZyBhIHN3ZWVwIGxpbmUgc2ltaWxhciB0byB0aGVcclxuICAgIC8vIEJlbnRsZXktT3R0bWFubiBhcHByb2FjaC4gV2UnbGwgdHJhY2sgd2hpY2ggZWRnZXMgYXJlIHBhc3NpbmcgdGhyb3VnaCB0aGUgc3dlZXAgbGluZS5cclxuICAgIGNvbnN0IHF1ZXVlID0gbmV3IHdpbmRvdy5GbGF0UXVldWUoKTtcclxuXHJcbiAgICAvLyBUcmFja3Mgd2hpY2ggZWRnZXMgYXJlIHRocm91Z2ggdGhlIHN3ZWVwIGxpbmUsIGJ1dCBpbiBhIGdyYXBoIHN0cnVjdHVyZSBsaWtlIGEgc2VnbWVudC9pbnRlcnZhbCB0cmVlLCBzbyB0aGF0IHdlXHJcbiAgICAvLyBjYW4gaGF2ZSBmYXN0IGxvb2t1cCAod2hhdCBlZGdlcyBhcmUgaW4gYSBjZXJ0YWluIHJhbmdlKSBhbmQgYWxzbyBmYXN0IGluc2VydHMvcmVtb3ZhbHMuXHJcbiAgICBjb25zdCBzZWdtZW50VHJlZSA9IG5ldyBFZGdlU2VnbWVudFRyZWUoIGVwc2lsb24gKTtcclxuXHJcbiAgICAvLyBBc3NvcnRlZCBvcGVyYXRpb25zIHVzZSBhIHNob3J0Y3V0IHRvIFwidGFnXCIgZWRnZXMgd2l0aCBhIHVuaXF1ZSBJRCwgdG8gaW5kaWNhdGUgaXQgaGFzIGFscmVhZHkgYmVlbiBwcm9jZXNzZWRcclxuICAgIC8vIGZvciB0aGlzIGNhbGwgb2YgZWxpbWluYXRlT3ZlcmxhcCgpLiBUaGlzIGlzIGEgaGlnaGVyLXBlcmZvcm1hbmNlIG9wdGlvbiB0byBzdG9yaW5nIGFuIGFycmF5IG9mIFwiYWxyZWFkeVxyXG4gICAgLy8gcHJvY2Vzc2VkXCIgZWRnZXMuXHJcbiAgICBjb25zdCBuZXh0SWQgPSBnbG9iYWxJZCsrO1xyXG5cclxuICAgIC8vIEFkZHMgYW4gZWRnZSB0byB0aGUgcXVldWVcclxuICAgIGNvbnN0IGFkZFRvUXVldWUgPSBlZGdlID0+IHtcclxuICAgICAgY29uc3QgYm91bmRzID0gZWRnZS5zZWdtZW50LmJvdW5kcztcclxuXHJcbiAgICAgIC8vIFRPRE86IHNlZSBpZiBvYmplY3QgYWxsb2NhdGlvbnMgYXJlIHNsb3cgaGVyZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzZcclxuICAgICAgcXVldWUucHVzaCggeyBzdGFydDogdHJ1ZSwgZWRnZTogZWRnZSB9LCBib3VuZHMubWluWSAtIGVwc2lsb24gKTtcclxuICAgICAgcXVldWUucHVzaCggeyBzdGFydDogZmFsc2UsIGVkZ2U6IGVkZ2UgfSwgYm91bmRzLm1heFkgKyBlcHNpbG9uICk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIFJlbW92ZXMgYW4gZWRnZSBmcm9tIHRoZSBxdWV1ZSAoZWZmZWN0aXZlbHkuLi4gd2hlbiB3ZSBwb3AgZnJvbSB0aGUgcXVldWUsIHdlJ2xsIGNoZWNrIGl0cyBJRCBkYXRhLCBhbmQgaWYgaXQgd2FzXHJcbiAgICAvLyBcInJlbW92ZWRcIiB3ZSB3aWxsIGlnbm9yZSBpdC4gSGlnaGVyLXBlcmZvcm1hbmNlIHRoYW4gdXNpbmcgYW4gYXJyYXkuXHJcbiAgICBjb25zdCByZW1vdmVGcm9tUXVldWUgPSBlZGdlID0+IHtcclxuICAgICAgLy8gU3RvcmUgdGhlIElEIHNvIHdlIGNhbiBoYXZlIGEgaGlnaC1wZXJmb3JtYW5jZSByZW1vdmFsXHJcbiAgICAgIGVkZ2UuaW50ZXJuYWxEYXRhLnJlbW92ZWRJZCA9IG5leHRJZDtcclxuICAgIH07XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5lZGdlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgYWRkVG9RdWV1ZSggdGhpcy5lZGdlc1sgaSBdICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gV2UgdHJhY2sgZWRnZXMgdG8gZGlzcG9zZSBzZXBhcmF0ZWx5LCBpbnN0ZWFkIG9mIHN5bmNocm9ub3VzbHkgZGlzcG9zaW5nIHRoZW0uIFRoaXMgaXMgbWFpbmx5IGR1ZSB0byB0aGUgdHJpY2sgb2ZcclxuICAgIC8vIHJlbW92YWwgSURzLCBzaW5jZSBpZiB3ZSByZS11c2VkIHBvb2xlZCBFZGdlcyB3aGVuIGNyZWF0aW5nLCB0aGV5IHdvdWxkIHN0aWxsIGhhdmUgdGhlIElEIE9SIHRoZXkgd291bGQgbG9zZSB0aGVcclxuICAgIC8vIFwicmVtb3ZlZFwiIGluZm9ybWF0aW9uLlxyXG4gICAgY29uc3QgZWRnZXNUb0Rpc3Bvc2UgPSBbXTtcclxuXHJcbiAgICB3aGlsZSAoIHF1ZXVlLmxlbmd0aCApIHtcclxuICAgICAgY29uc3QgZW50cnkgPSBxdWV1ZS5wb3AoKTtcclxuICAgICAgY29uc3QgZWRnZSA9IGVudHJ5LmVkZ2U7XHJcblxyXG4gICAgICAvLyBTa2lwIGVkZ2VzIHdlIGFscmVhZHkgcmVtb3ZlZFxyXG4gICAgICBpZiAoIGVkZ2UuaW50ZXJuYWxEYXRhLnJlbW92ZWRJZCA9PT0gbmV4dElkICkge1xyXG4gICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIGVudHJ5LnN0YXJ0ICkge1xyXG4gICAgICAgIC8vIFdlJ2xsIGJhaWwgb3V0IG9mIHRoZSBsb29wIGlmIHdlIGZpbmQgb3ZlcmxhcHMsIGFuZCB3ZSdsbCBzdG9yZSB0aGUgcmVsZXZhbnQgaW5mb3JtYXRpb24gaW4gdGhlc2VcclxuICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcclxuICAgICAgICBsZXQgb3ZlcmxhcHBlZEVkZ2U7XHJcbiAgICAgICAgbGV0IGFkZGVkRWRnZXM7XHJcbiAgICAgICAgbGV0IHJlbW92ZWRFZGdlcztcclxuXHJcbiAgICAgICAgLy8gVE9ETzogSXMgdGhpcyBjbG9zdXJlIGtpbGxpbmcgcGVyZm9ybWFuY2U/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAgICAgIHNlZ21lbnRUcmVlLnF1ZXJ5KCBlZGdlLCBvdGhlckVkZ2UgPT4ge1xyXG5cclxuICAgICAgICAgIGNvbnN0IGFTZWdtZW50ID0gZWRnZS5zZWdtZW50O1xyXG4gICAgICAgICAgY29uc3QgYlNlZ21lbnQgPSBvdGhlckVkZ2Uuc2VnbWVudDtcclxuICAgICAgICAgIGxldCBpbnRlcnNlY3Rpb25zID0gU2VnbWVudC5pbnRlcnNlY3QoIGFTZWdtZW50LCBiU2VnbWVudCApO1xyXG4gICAgICAgICAgaW50ZXJzZWN0aW9ucyA9IGludGVyc2VjdGlvbnMuZmlsdGVyKCBpbnRlcnNlY3Rpb24gPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBwb2ludCA9IGludGVyc2VjdGlvbi5wb2ludDtcclxuXHJcbiAgICAgICAgICAgIC8vIEZpbHRlciBvdXQgZW5kcG9pbnQtdG8tZW5kcG9pbnQgaW50ZXJzZWN0aW9ucywgYW5kIGF0IGEgcmFkaXVzIHdoZXJlIHRoZXkgd291bGQgZ2V0IGNvbGxhcHNlZCBpbnRvIGFuXHJcbiAgICAgICAgICAgIC8vIGVuZHBvaW50IGFueXdheS4gSWYgaXQncyBcImludGVybmFsXCIgdG8gb25lIHNlZ21lbnQsIHdlJ2xsIGtlZXAgaXQuXHJcbiAgICAgICAgICAgIHJldHVybiBHcmFwaC5pc0ludGVybmFsKCBwb2ludCwgaW50ZXJzZWN0aW9uLmFULCBhU2VnbWVudCwgSU5URVJTRUNUSU9OX0VORFBPSU5UX1RIUkVTSE9MRF9ESVNUQU5DRSwgVF9USFJFU0hPTEQgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgR3JhcGguaXNJbnRlcm5hbCggcG9pbnQsIGludGVyc2VjdGlvbi5iVCwgYlNlZ21lbnQsIElOVEVSU0VDVElPTl9FTkRQT0lOVF9USFJFU0hPTERfRElTVEFOQ0UsIFRfVEhSRVNIT0xEICk7XHJcbiAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICBpZiAoIGludGVyc2VjdGlvbnMubGVuZ3RoICkge1xyXG5cclxuICAgICAgICAgICAgLy8gVE9ETzogSW4gdGhlIGZ1dHVyZSwgaGFuZGxlIG11bHRpcGxlIGludGVyc2VjdGlvbnMgKGluc3RlYWQgb2YgcmUtcnVubmluZykgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzc2XHJcbiAgICAgICAgICAgIGNvbnN0IGludGVyc2VjdGlvbiA9IGludGVyc2VjdGlvbnNbIDAgXTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuc2ltcGxlU3BsaXQoIGVkZ2UsIG90aGVyRWRnZSwgaW50ZXJzZWN0aW9uLmFULCBpbnRlcnNlY3Rpb24uYlQsIGludGVyc2VjdGlvbi5wb2ludCApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCByZXN1bHQgKSB7XHJcbiAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgIG92ZXJsYXBwZWRFZGdlID0gb3RoZXJFZGdlO1xyXG4gICAgICAgICAgICAgIGFkZGVkRWRnZXMgPSByZXN1bHQuYWRkZWRFZGdlcztcclxuICAgICAgICAgICAgICByZW1vdmVkRWRnZXMgPSByZXN1bHQucmVtb3ZlZEVkZ2VzO1xyXG4gICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0gKTtcclxuXHJcbiAgICAgICAgaWYgKCBmb3VuZCApIHtcclxuICAgICAgICAgIC8vIElmIHdlIGRpZG4ndCBcInJlbW92ZVwiIHRoYXQgZWRnZSwgd2UnbGwgc3RpbGwgbmVlZCB0byBhZGQgaXQgaW4uXHJcbiAgICAgICAgICBpZiAoIHJlbW92ZWRFZGdlcy5pbmNsdWRlcyggZWRnZSApICkge1xyXG4gICAgICAgICAgICByZW1vdmVGcm9tUXVldWUoIGVkZ2UgKTtcclxuICAgICAgICAgICAgZWRnZXNUb0Rpc3Bvc2UucHVzaCggZWRnZSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHNlZ21lbnRUcmVlLmFkZEl0ZW0oIGVkZ2UgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICggcmVtb3ZlZEVkZ2VzLmluY2x1ZGVzKCBvdmVybGFwcGVkRWRnZSApICkge1xyXG4gICAgICAgICAgICBzZWdtZW50VHJlZS5yZW1vdmVJdGVtKCBvdmVybGFwcGVkRWRnZSApO1xyXG4gICAgICAgICAgICByZW1vdmVGcm9tUXVldWUoIG92ZXJsYXBwZWRFZGdlICk7XHJcbiAgICAgICAgICAgIGVkZ2VzVG9EaXNwb3NlLnB1c2goIG92ZXJsYXBwZWRFZGdlICk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQWRqdXN0IHRoZSBxdWV1ZVxyXG4gICAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgYWRkZWRFZGdlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgYWRkVG9RdWV1ZSggYWRkZWRFZGdlc1sgaSBdICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgLy8gTm8gb3ZlcmxhcHMgZm91bmQsIGFkZCBpdCBhbmQgY29udGludWVcclxuICAgICAgICAgIHNlZ21lbnRUcmVlLmFkZEl0ZW0oIGVkZ2UgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gUmVtb3ZhbCBjYW4ndCB0cmlnZ2VyIGFuIGludGVyc2VjdGlvbiwgc28gd2UgY2FuIHNhZmVseSByZW1vdmUgaXRcclxuICAgICAgICBzZWdtZW50VHJlZS5yZW1vdmVJdGVtKCBlZGdlICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBlZGdlc1RvRGlzcG9zZS5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgZWRnZXNUb0Rpc3Bvc2VbIGkgXS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGVzIHNwbGl0dGluZyB0d28gaW50ZXJzZWN0aW5nIGVkZ2VzLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0VkZ2V9IGFFZGdlXHJcbiAgICogQHBhcmFtIHtFZGdlfSBiRWRnZVxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhVCAtIFBhcmFtZXRyaWMgdCB2YWx1ZSBvZiB0aGUgaW50ZXJzZWN0aW9uIGZvciBhRWRnZVxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBiVCAtIFBhcmFtZXRyaWMgdCB2YWx1ZSBvZiB0aGUgaW50ZXJzZWN0aW9uIGZvciBiRWRnZVxyXG4gICAqIEBwYXJhbSB7VmVjdG9yMn0gcG9pbnQgLSBMb2NhdGlvbiBvZiB0aGUgaW50ZXJzZWN0aW9uXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7e2FkZGVkRWRnZXM6IEVkZ2VbXSwgcmVtb3ZlZEVkZ2VzOiBFZGdlW119fG51bGx9XHJcbiAgICovXHJcbiAgc2ltcGxlU3BsaXQoIGFFZGdlLCBiRWRnZSwgYVQsIGJULCBwb2ludCApIHtcclxuICAgIGNvbnN0IGFJbnRlcm5hbCA9IEdyYXBoLmlzSW50ZXJuYWwoIHBvaW50LCBhVCwgYUVkZ2Uuc2VnbWVudCwgU1BMSVRfRU5EUE9JTlRfVEhSRVNIT0xEX0RJU1RBTkNFLCBUX1RIUkVTSE9MRCApO1xyXG4gICAgY29uc3QgYkludGVybmFsID0gR3JhcGguaXNJbnRlcm5hbCggcG9pbnQsIGJULCBiRWRnZS5zZWdtZW50LCBTUExJVF9FTkRQT0lOVF9USFJFU0hPTERfRElTVEFOQ0UsIFRfVEhSRVNIT0xEICk7XHJcblxyXG4gICAgbGV0IHZlcnRleCA9IG51bGw7XHJcbiAgICBpZiAoICFhSW50ZXJuYWwgKSB7XHJcbiAgICAgIHZlcnRleCA9IGFUIDwgMC41ID8gYUVkZ2Uuc3RhcnRWZXJ0ZXggOiBhRWRnZS5lbmRWZXJ0ZXg7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggIWJJbnRlcm5hbCApIHtcclxuICAgICAgdmVydGV4ID0gYlQgPCAwLjUgPyBiRWRnZS5zdGFydFZlcnRleCA6IGJFZGdlLmVuZFZlcnRleDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB2ZXJ0ZXggPSBWZXJ0ZXgucG9vbC5jcmVhdGUoIHBvaW50ICk7XHJcbiAgICAgIHRoaXMudmVydGljZXMucHVzaCggdmVydGV4ICk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGNoYW5nZWQgPSBmYWxzZTtcclxuICAgIGNvbnN0IGFkZGVkRWRnZXMgPSBbXTtcclxuICAgIGNvbnN0IHJlbW92ZWRFZGdlcyA9IFtdO1xyXG5cclxuICAgIGlmICggYUludGVybmFsICYmIHZlcnRleCAhPT0gYUVkZ2Uuc3RhcnRWZXJ0ZXggJiYgdmVydGV4ICE9PSBhRWRnZS5lbmRWZXJ0ZXggKSB7XHJcbiAgICAgIGFkZGVkRWRnZXMucHVzaCggLi4udGhpcy5zcGxpdEVkZ2UoIGFFZGdlLCBhVCwgdmVydGV4ICkgKTtcclxuICAgICAgcmVtb3ZlZEVkZ2VzLnB1c2goIGFFZGdlICk7XHJcbiAgICAgIGNoYW5nZWQgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgaWYgKCBiSW50ZXJuYWwgJiYgdmVydGV4ICE9PSBiRWRnZS5zdGFydFZlcnRleCAmJiB2ZXJ0ZXggIT09IGJFZGdlLmVuZFZlcnRleCApIHtcclxuICAgICAgYWRkZWRFZGdlcy5wdXNoKCAuLi50aGlzLnNwbGl0RWRnZSggYkVkZ2UsIGJULCB2ZXJ0ZXggKSApO1xyXG4gICAgICByZW1vdmVkRWRnZXMucHVzaCggYkVkZ2UgKTtcclxuICAgICAgY2hhbmdlZCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNoYW5nZWQgPyB7XHJcbiAgICAgIGFkZGVkRWRnZXM6IGFkZGVkRWRnZXMsXHJcbiAgICAgIHJlbW92ZWRFZGdlczogcmVtb3ZlZEVkZ2VzXHJcbiAgICB9IDogbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNwbGl0cyBhbiBlZGdlIGludG8gdHdvIGVkZ2VzIGF0IGEgc3BlY2lmaWMgcGFyYW1ldHJpYyB0IHZhbHVlLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0VkZ2V9IGVkZ2VcclxuICAgKiBAcGFyYW0ge251bWJlcn0gdFxyXG4gICAqIEBwYXJhbSB7VmVydGV4fSB2ZXJ0ZXggLSBUaGUgdmVydGV4IHRoYXQgaXMgcGxhY2VkIGF0IHRoZSBzcGxpdCBsb2NhdGlvblxyXG4gICAqL1xyXG4gIHNwbGl0RWRnZSggZWRnZSwgdCwgdmVydGV4ICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5ib3VuZGFyaWVzLmxlbmd0aCA9PT0gMCwgJ09ubHkgaGFuZGxlcyBzaW1wbGVyIGxldmVsIHByaW1pdGl2ZSBzcGxpdHRpbmcgcmlnaHQgbm93JyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggZWRnZS5zdGFydFZlcnRleCAhPT0gdmVydGV4ICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBlZGdlLmVuZFZlcnRleCAhPT0gdmVydGV4ICk7XHJcblxyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBlZGdlLnNlZ21lbnQuc3ViZGl2aWRlZCggdCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggc2VnbWVudHMubGVuZ3RoID09PSAyICk7XHJcblxyXG4gICAgY29uc3QgZmlyc3RFZGdlID0gRWRnZS5wb29sLmNyZWF0ZSggc2VnbWVudHNbIDAgXSwgZWRnZS5zdGFydFZlcnRleCwgdmVydGV4ICk7XHJcbiAgICBjb25zdCBzZWNvbmRFZGdlID0gRWRnZS5wb29sLmNyZWF0ZSggc2VnbWVudHNbIDEgXSwgdmVydGV4LCBlZGdlLmVuZFZlcnRleCApO1xyXG5cclxuICAgIC8vIFJlbW92ZSBvbGQgY29ubmVjdGlvbnNcclxuICAgIHRoaXMucmVtb3ZlRWRnZSggZWRnZSApO1xyXG5cclxuICAgIC8vIEFkZCBuZXcgY29ubmVjdGlvbnNcclxuICAgIHRoaXMuYWRkRWRnZSggZmlyc3RFZGdlICk7XHJcbiAgICB0aGlzLmFkZEVkZ2UoIHNlY29uZEVkZ2UgKTtcclxuXHJcbiAgICB0aGlzLnJlcGxhY2VFZGdlSW5Mb29wcyggZWRnZSwgWyBmaXJzdEVkZ2UuZm9yd2FyZEhhbGYsIHNlY29uZEVkZ2UuZm9yd2FyZEhhbGYgXSApO1xyXG5cclxuICAgIHJldHVybiBbIGZpcnN0RWRnZSwgc2Vjb25kRWRnZSBdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tYmluZSB2ZXJ0aWNlcyB0aGF0IGFyZSBhbG1vc3QgZXhhY3RseSBpbiB0aGUgc2FtZSBwbGFjZSAocmVtb3ZpbmcgZWRnZXMgYW5kIHZlcnRpY2VzIHdoZXJlIG5lY2Vzc2FyeSkuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBjb2xsYXBzZVZlcnRpY2VzKCkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggXy5ldmVyeSggdGhpcy5lZGdlcywgZWRnZSA9PiBfLmluY2x1ZGVzKCB0aGlzLnZlcnRpY2VzLCBlZGdlLnN0YXJ0VmVydGV4ICkgKSApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggXy5ldmVyeSggdGhpcy5lZGdlcywgZWRnZSA9PiBfLmluY2x1ZGVzKCB0aGlzLnZlcnRpY2VzLCBlZGdlLmVuZFZlcnRleCApICkgKTtcclxuXHJcbiAgICAvLyBXZSdsbCBleHBhbmQgYm91bmRzIGJ5IHRoaXMgYW1vdW50LCBzbyB0aGF0IFwiYWRqYWNlbnRcIiBib3VuZHMgKHdpdGggYSBwb3RlbnRpYWxseSBvdmVybGFwcGluZyB2ZXJ0aWNhbCBvclxyXG4gICAgLy8gaG9yaXpvbnRhbCBsaW5lKSB3aWxsIGhhdmUgYSBub24temVybyBhbW91bnQgb2YgYXJlYSBvdmVybGFwcGluZy5cclxuICAgIGNvbnN0IGVwc2lsb24gPSAxMCAqIFZFUlRFWF9DT0xMQVBTRV9USFJFU0hPTERfRElTVEFOQ0U7IC8vIFRPRE86IGNvdWxkIHdlIHJlZHVjZSB0aGlzIGZhY3RvciB0byBjbG9zZXIgdG8gdGhlIGRpc3RhbmNlPyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvOThcclxuXHJcbiAgICAvLyBPdXIgcXVldWUgd2lsbCBzdG9yZSBlbnRyaWVzIG9mIHsgc3RhcnQ6IGJvb2xlYW4sIHZlcnRleDogVmVydGV4IH0sIHJlcHJlc2VudGluZyBhIHN3ZWVwIGxpbmUgc2ltaWxhciB0byB0aGVcclxuICAgIC8vIEJlbnRsZXktT3R0bWFubiBhcHByb2FjaC4gV2UnbGwgdHJhY2sgd2hpY2ggZWRnZXMgYXJlIHBhc3NpbmcgdGhyb3VnaCB0aGUgc3dlZXAgbGluZS5cclxuICAgIGNvbnN0IHF1ZXVlID0gbmV3IHdpbmRvdy5GbGF0UXVldWUoKTtcclxuXHJcbiAgICAvLyBUcmFja3Mgd2hpY2ggdmVydGljZXMgYXJlIHRocm91Z2ggdGhlIHN3ZWVwIGxpbmUsIGJ1dCBpbiBhIGdyYXBoIHN0cnVjdHVyZSBsaWtlIGEgc2VnbWVudC9pbnRlcnZhbCB0cmVlLCBzbyB0aGF0XHJcbiAgICAvLyB3ZSBjYW4gaGF2ZSBmYXN0IGxvb2t1cCAod2hhdCB2ZXJ0aWNlcyBhcmUgaW4gYSBjZXJ0YWluIHJhbmdlKSBhbmQgYWxzbyBmYXN0IGluc2VydHMvcmVtb3ZhbHMuXHJcbiAgICBjb25zdCBzZWdtZW50VHJlZSA9IG5ldyBWZXJ0ZXhTZWdtZW50VHJlZSggZXBzaWxvbiApO1xyXG5cclxuICAgIC8vIEFzc29ydGVkIG9wZXJhdGlvbnMgdXNlIGEgc2hvcnRjdXQgdG8gXCJ0YWdcIiB2ZXJ0aWNlcyB3aXRoIGEgdW5pcXVlIElELCB0byBpbmRpY2F0ZSBpdCBoYXMgYWxyZWFkeSBiZWVuIHByb2Nlc3NlZFxyXG4gICAgLy8gZm9yIHRoaXMgY2FsbCBvZiBlbGltaW5hdGVPdmVybGFwKCkuIFRoaXMgaXMgYSBoaWdoZXItcGVyZm9ybWFuY2Ugb3B0aW9uIHRvIHN0b3JpbmcgYW4gYXJyYXkgb2YgXCJhbHJlYWR5XHJcbiAgICAvLyBwcm9jZXNzZWRcIiBlZGdlcy5cclxuICAgIGNvbnN0IG5leHRJZCA9IGdsb2JhbElkKys7XHJcblxyXG4gICAgLy8gQWRkcyBhbiB2ZXJ0ZXggdG8gdGhlIHF1ZXVlXHJcbiAgICBjb25zdCBhZGRUb1F1ZXVlID0gdmVydGV4ID0+IHtcclxuICAgICAgLy8gVE9ETzogc2VlIGlmIG9iamVjdCBhbGxvY2F0aW9ucyBhcmUgc2xvdyBoZXJlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAgICBxdWV1ZS5wdXNoKCB7IHN0YXJ0OiB0cnVlLCB2ZXJ0ZXg6IHZlcnRleCB9LCB2ZXJ0ZXgucG9pbnQueSAtIGVwc2lsb24gKTtcclxuICAgICAgcXVldWUucHVzaCggeyBzdGFydDogZmFsc2UsIHZlcnRleDogdmVydGV4IH0sIHZlcnRleC5wb2ludC55ICsgZXBzaWxvbiApO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBSZW1vdmVzIGEgdmVydGV4IGZyb20gdGhlIHF1ZXVlIChlZmZlY3RpdmVseS4uLiB3aGVuIHdlIHBvcCBmcm9tIHRoZSBxdWV1ZSwgd2UnbGwgY2hlY2sgaXRzIElEIGRhdGEsIGFuZCBpZiBpdFxyXG4gICAgLy8gd2FzIFwicmVtb3ZlZFwiIHdlIHdpbGwgaWdub3JlIGl0LiBIaWdoZXItcGVyZm9ybWFuY2UgdGhhbiB1c2luZyBhbiBhcnJheS5cclxuICAgIGNvbnN0IHJlbW92ZUZyb21RdWV1ZSA9IHZlcnRleCA9PiB7XHJcbiAgICAgIC8vIFN0b3JlIHRoZSBJRCBzbyB3ZSBjYW4gaGF2ZSBhIGhpZ2gtcGVyZm9ybWFuY2UgcmVtb3ZhbFxyXG4gICAgICB2ZXJ0ZXguaW50ZXJuYWxEYXRhLnJlbW92ZWRJZCA9IG5leHRJZDtcclxuICAgIH07XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy52ZXJ0aWNlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgYWRkVG9RdWV1ZSggdGhpcy52ZXJ0aWNlc1sgaSBdICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gV2UgdHJhY2sgdmVydGljZXMgdG8gZGlzcG9zZSBzZXBhcmF0ZWx5LCBpbnN0ZWFkIG9mIHN5bmNocm9ub3VzbHkgZGlzcG9zaW5nIHRoZW0uIFRoaXMgaXMgbWFpbmx5IGR1ZSB0byB0aGUgdHJpY2tcclxuICAgIC8vIG9mIHJlbW92YWwgSURzLCBzaW5jZSBpZiB3ZSByZS11c2VkIHBvb2xlZCBWZXJ0aWNlcyB3aGVuIGNyZWF0aW5nLCB0aGV5IHdvdWxkIHN0aWxsIGhhdmUgdGhlIElEIE9SIHRoZXkgd291bGRcclxuICAgIC8vIGxvc2UgdGhlIFwicmVtb3ZlZFwiIGluZm9ybWF0aW9uLlxyXG4gICAgY29uc3QgdmVydGljZXNUb0Rpc3Bvc2UgPSBbXTtcclxuXHJcbiAgICB3aGlsZSAoIHF1ZXVlLmxlbmd0aCApIHtcclxuICAgICAgY29uc3QgZW50cnkgPSBxdWV1ZS5wb3AoKTtcclxuICAgICAgY29uc3QgdmVydGV4ID0gZW50cnkudmVydGV4O1xyXG5cclxuICAgICAgLy8gU2tpcCB2ZXJ0aWNlcyB3ZSBhbHJlYWR5IHJlbW92ZWRcclxuICAgICAgaWYgKCB2ZXJ0ZXguaW50ZXJuYWxEYXRhLnJlbW92ZWRJZCA9PT0gbmV4dElkICkge1xyXG4gICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIGVudHJ5LnN0YXJ0ICkge1xyXG4gICAgICAgIC8vIFdlJ2xsIGJhaWwgb3V0IG9mIHRoZSBsb29wIGlmIHdlIGZpbmQgb3ZlcmxhcHMsIGFuZCB3ZSdsbCBzdG9yZSB0aGUgcmVsZXZhbnQgaW5mb3JtYXRpb24gaW4gdGhlc2VcclxuICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcclxuICAgICAgICBsZXQgb3ZlcmxhcHBlZFZlcnRleDtcclxuICAgICAgICBsZXQgYWRkZWRWZXJ0aWNlcztcclxuXHJcbiAgICAgICAgLy8gVE9ETzogSXMgdGhpcyBjbG9zdXJlIGtpbGxpbmcgcGVyZm9ybWFuY2U/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAgICAgIHNlZ21lbnRUcmVlLnF1ZXJ5KCB2ZXJ0ZXgsIG90aGVyVmVydGV4ID0+IHtcclxuICAgICAgICAgIGNvbnN0IGRpc3RhbmNlID0gdmVydGV4LnBvaW50LmRpc3RhbmNlKCBvdGhlclZlcnRleC5wb2ludCApO1xyXG4gICAgICAgICAgaWYgKCBkaXN0YW5jZSA8IFZFUlRFWF9DT0xMQVBTRV9USFJFU0hPTERfRElTVEFOQ0UgKSB7XHJcblxyXG4gICAgICAgICAgICAgIGNvbnN0IG5ld1ZlcnRleCA9IFZlcnRleC5wb29sLmNyZWF0ZSggZGlzdGFuY2UgPT09IDAgPyB2ZXJ0ZXgucG9pbnQgOiB2ZXJ0ZXgucG9pbnQuYXZlcmFnZSggb3RoZXJWZXJ0ZXgucG9pbnQgKSApO1xyXG4gICAgICAgICAgICAgIHRoaXMudmVydGljZXMucHVzaCggbmV3VmVydGV4ICk7XHJcblxyXG4gICAgICAgICAgICAgIGFycmF5UmVtb3ZlKCB0aGlzLnZlcnRpY2VzLCB2ZXJ0ZXggKTtcclxuICAgICAgICAgICAgICBhcnJheVJlbW92ZSggdGhpcy52ZXJ0aWNlcywgb3RoZXJWZXJ0ZXggKTtcclxuICAgICAgICAgICAgICBmb3IgKCBsZXQgayA9IHRoaXMuZWRnZXMubGVuZ3RoIC0gMTsgayA+PSAwOyBrLS0gKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlZGdlID0gdGhpcy5lZGdlc1sgayBdO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnRNYXRjaGVzID0gZWRnZS5zdGFydFZlcnRleCA9PT0gdmVydGV4IHx8IGVkZ2Uuc3RhcnRWZXJ0ZXggPT09IG90aGVyVmVydGV4O1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZW5kTWF0Y2hlcyA9IGVkZ2UuZW5kVmVydGV4ID09PSB2ZXJ0ZXggfHwgZWRnZS5lbmRWZXJ0ZXggPT09IG90aGVyVmVydGV4O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIE91dHJpZ2h0IHJlbW92ZSBlZGdlcyB0aGF0IHdlcmUgYmV0d2VlbiBBIGFuZCBCIHRoYXQgYXJlbid0IGxvb3BzXHJcbiAgICAgICAgICAgICAgICBpZiAoIHN0YXJ0TWF0Y2hlcyAmJiBlbmRNYXRjaGVzICkge1xyXG4gICAgICAgICAgICAgICAgICBpZiAoICggZWRnZS5zZWdtZW50LmJvdW5kcy53aWR0aCA+IDFlLTUgfHwgZWRnZS5zZWdtZW50LmJvdW5kcy5oZWlnaHQgPiAxZS01ICkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAoIGVkZ2Uuc2VnbWVudCBpbnN0YW5jZW9mIEN1YmljIHx8IGVkZ2Uuc2VnbWVudCBpbnN0YW5jZW9mIEFyYyB8fCBlZGdlLnNlZ21lbnQgaW5zdGFuY2VvZiBFbGxpcHRpY2FsQXJjICkgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVwbGFjZSBpdCB3aXRoIGEgbmV3IGVkZ2UgdGhhdCBpcyBmcm9tIHRoZSB2ZXJ0ZXggdG8gaXRzZWxmXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVwbGFjZW1lbnRFZGdlID0gRWRnZS5wb29sLmNyZWF0ZSggZWRnZS5zZWdtZW50LCBuZXdWZXJ0ZXgsIG5ld1ZlcnRleCApO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRWRnZSggcmVwbGFjZW1lbnRFZGdlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXBsYWNlRWRnZUluTG9vcHMoIGVkZ2UsIFsgcmVwbGFjZW1lbnRFZGdlLmZvcndhcmRIYWxmIF0gKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlcGxhY2VFZGdlSW5Mb29wcyggZWRnZSwgW10gKTsgLy8gcmVtb3ZlIHRoZSBlZGdlIGZyb20gbG9vcHMgd2l0aCBubyByZXBsYWNlbWVudFxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRWRnZSggZWRnZSApO1xyXG4gICAgICAgICAgICAgICAgICBlZGdlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBzdGFydE1hdGNoZXMgKSB7XHJcbiAgICAgICAgICAgICAgICAgIGVkZ2Uuc3RhcnRWZXJ0ZXggPSBuZXdWZXJ0ZXg7XHJcbiAgICAgICAgICAgICAgICAgIG5ld1ZlcnRleC5pbmNpZGVudEhhbGZFZGdlcy5wdXNoKCBlZGdlLnJldmVyc2VkSGFsZiApO1xyXG4gICAgICAgICAgICAgICAgICBlZGdlLnVwZGF0ZVJlZmVyZW5jZXMoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBlbmRNYXRjaGVzICkge1xyXG4gICAgICAgICAgICAgICAgICBlZGdlLmVuZFZlcnRleCA9IG5ld1ZlcnRleDtcclxuICAgICAgICAgICAgICAgICAgbmV3VmVydGV4LmluY2lkZW50SGFsZkVkZ2VzLnB1c2goIGVkZ2UuZm9yd2FyZEhhbGYgKTtcclxuICAgICAgICAgICAgICAgICAgZWRnZS51cGRhdGVSZWZlcmVuY2VzKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgYWRkZWRWZXJ0aWNlcyA9IFsgbmV3VmVydGV4IF07XHJcbiAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgb3ZlcmxhcHBlZFZlcnRleCA9IG90aGVyVmVydGV4O1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSApO1xyXG5cclxuICAgICAgICBpZiAoIGZvdW5kICkge1xyXG4gICAgICAgICAgLy8gV2UgaGF2ZW4ndCBhZGRlZCBvdXIgZWRnZSB5ZXQsIHNvIG5vIG5lZWQgdG8gcmVtb3ZlIGl0LlxyXG4gICAgICAgICAgc2VnbWVudFRyZWUucmVtb3ZlSXRlbSggb3ZlcmxhcHBlZFZlcnRleCApO1xyXG5cclxuICAgICAgICAgIC8vIEFkanVzdCB0aGUgcXVldWVcclxuICAgICAgICAgIHJlbW92ZUZyb21RdWV1ZSggb3ZlcmxhcHBlZFZlcnRleCApO1xyXG4gICAgICAgICAgcmVtb3ZlRnJvbVF1ZXVlKCB2ZXJ0ZXggKTtcclxuICAgICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGFkZGVkVmVydGljZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICAgIGFkZFRvUXVldWUoIGFkZGVkVmVydGljZXNbIGkgXSApO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZlcnRpY2VzVG9EaXNwb3NlLnB1c2goIHZlcnRleCApO1xyXG4gICAgICAgICAgdmVydGljZXNUb0Rpc3Bvc2UucHVzaCggb3ZlcmxhcHBlZFZlcnRleCApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIC8vIE5vIG92ZXJsYXBzIGZvdW5kLCBhZGQgaXQgYW5kIGNvbnRpbnVlXHJcbiAgICAgICAgICBzZWdtZW50VHJlZS5hZGRJdGVtKCB2ZXJ0ZXggKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gUmVtb3ZhbCBjYW4ndCB0cmlnZ2VyIGFuIGludGVyc2VjdGlvbiwgc28gd2UgY2FuIHNhZmVseSByZW1vdmUgaXRcclxuICAgICAgICBzZWdtZW50VHJlZS5yZW1vdmVJdGVtKCB2ZXJ0ZXggKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHZlcnRpY2VzVG9EaXNwb3NlLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICB2ZXJ0aWNlc1RvRGlzcG9zZVsgaSBdLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBfLmV2ZXJ5KCB0aGlzLmVkZ2VzLCBlZGdlID0+IF8uaW5jbHVkZXMoIHRoaXMudmVydGljZXMsIGVkZ2Uuc3RhcnRWZXJ0ZXggKSApICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBfLmV2ZXJ5KCB0aGlzLmVkZ2VzLCBlZGdlID0+IF8uaW5jbHVkZXMoIHRoaXMudmVydGljZXMsIGVkZ2UuZW5kVmVydGV4ICkgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2NhbiBhIGdpdmVuIHZlcnRleCBmb3IgYnJpZGdlcyByZWN1cnNpdmVseSB3aXRoIGEgZGVwdGgtZmlyc3Qgc2VhcmNoLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBSZWNvcmRzIHZpc2l0IHRpbWVzIHRvIGVhY2ggdmVydGV4LCBhbmQgYmFjay1wcm9wYWdhdGVzIHNvIHRoYXQgd2UgY2FuIGVmZmljaWVudGx5IGRldGVybWluZSBpZiB0aGVyZSB3YXMgYW5vdGhlclxyXG4gICAqIHBhdGggYXJvdW5kIHRvIHRoZSB2ZXJ0ZXguXHJcbiAgICpcclxuICAgKiBBc3N1bWVzIHRoaXMgaXMgb25seSBjYWxsZWQgb25lIHRpbWUgb25jZSBhbGwgZWRnZXMvdmVydGljZXMgYXJlIHNldCB1cC4gUmVwZWF0ZWQgY2FsbHMgd2lsbCBmYWlsIGJlY2F1c2Ugd2VcclxuICAgKiBkb24ndCBtYXJrIHZpc2l0ZWQvZXRjLiByZWZlcmVuY2VzIGFnYWluIG9uIHN0YXJ0dXBcclxuICAgKlxyXG4gICAqIFNlZSBUYXJqYW4ncyBhbGdvcml0aG0gZm9yIG1vcmUgaW5mb3JtYXRpb24uIFNvbWUgbW9kaWZpY2F0aW9ucyB3ZXJlIG5lZWRlZCwgc2luY2UgdGhpcyBpcyB0ZWNobmljYWxseSBhXHJcbiAgICogbXVsdGlncmFwaC9wc2V1ZG9ncmFwaCAoY2FuIGhhdmUgZWRnZXMgdGhhdCBoYXZlIHRoZSBzYW1lIHN0YXJ0L2VuZCB2ZXJ0ZXgsIGFuZCBjYW4gaGF2ZSBtdWx0aXBsZSBlZGdlc1xyXG4gICAqIGdvaW5nIGZyb20gdGhlIHNhbWUgdHdvIHZlcnRpY2VzKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7QXJyYXkuPEVkZ2U+fSBicmlkZ2VzIC0gQXBwZW5kcyBicmlkZ2UgZWRnZXMgdG8gaGVyZS5cclxuICAgKiBAcGFyYW0ge1ZlcnRleH0gdmVydGV4XHJcbiAgICovXHJcbiAgbWFya0JyaWRnZXMoIGJyaWRnZXMsIHZlcnRleCApIHtcclxuICAgIHZlcnRleC52aXNpdGVkID0gdHJ1ZTtcclxuICAgIHZlcnRleC52aXNpdEluZGV4ID0gdmVydGV4Lmxvd0luZGV4ID0gYnJpZGdlSWQrKztcclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB2ZXJ0ZXguaW5jaWRlbnRIYWxmRWRnZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGVkZ2UgPSB2ZXJ0ZXguaW5jaWRlbnRIYWxmRWRnZXNbIGkgXS5lZGdlO1xyXG4gICAgICBjb25zdCBjaGlsZFZlcnRleCA9IHZlcnRleC5pbmNpZGVudEhhbGZFZGdlc1sgaSBdLnN0YXJ0VmVydGV4OyAvLyBieSBkZWZpbml0aW9uLCBvdXIgdmVydGV4IHNob3VsZCBiZSB0aGUgZW5kVmVydGV4XHJcbiAgICAgIGlmICggIWNoaWxkVmVydGV4LnZpc2l0ZWQgKSB7XHJcbiAgICAgICAgZWRnZS52aXNpdGVkID0gdHJ1ZTtcclxuICAgICAgICBjaGlsZFZlcnRleC5wYXJlbnQgPSB2ZXJ0ZXg7XHJcbiAgICAgICAgdGhpcy5tYXJrQnJpZGdlcyggYnJpZGdlcywgY2hpbGRWZXJ0ZXggKTtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUncyBhbm90aGVyIHJvdXRlIHRoYXQgcmVhY2hlcyBiYWNrIHRvIG91ciB2ZXJ0ZXggZnJvbSBhbiBhbmNlc3RvclxyXG4gICAgICAgIHZlcnRleC5sb3dJbmRleCA9IE1hdGgubWluKCB2ZXJ0ZXgubG93SW5kZXgsIGNoaWxkVmVydGV4Lmxvd0luZGV4ICk7XHJcblxyXG4gICAgICAgIC8vIElmIHRoZXJlIHdhcyBubyByb3V0ZSwgdGhlbiB3ZSByZWFjaGVkIGEgYnJpZGdlXHJcbiAgICAgICAgaWYgKCBjaGlsZFZlcnRleC5sb3dJbmRleCA+IHZlcnRleC52aXNpdEluZGV4ICkge1xyXG4gICAgICAgICAgYnJpZGdlcy5wdXNoKCBlZGdlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCAhZWRnZS52aXNpdGVkICkge1xyXG4gICAgICAgIHZlcnRleC5sb3dJbmRleCA9IE1hdGgubWluKCB2ZXJ0ZXgubG93SW5kZXgsIGNoaWxkVmVydGV4LnZpc2l0SW5kZXggKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyBlZGdlcyB0aGF0IGFyZSB0aGUgb25seSBlZGdlIGhvbGRpbmcgdHdvIGNvbm5lY3RlZCBjb21wb25lbnRzIHRvZ2V0aGVyLiBCYXNlZCBvbiBvdXIgcHJvYmxlbSwgdGhlXHJcbiAgICogZmFjZSBvbiBlaXRoZXIgc2lkZSBvZiB0aGUgXCJicmlkZ2VcIiBlZGdlcyB3b3VsZCBhbHdheXMgYmUgdGhlIHNhbWUsIHNvIHdlIGNhbiBzYWZlbHkgcmVtb3ZlIHRoZW0uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICByZW1vdmVCcmlkZ2VzKCkge1xyXG4gICAgY29uc3QgYnJpZGdlcyA9IFtdO1xyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMudmVydGljZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IHZlcnRleCA9IHRoaXMudmVydGljZXNbIGkgXTtcclxuICAgICAgaWYgKCAhdmVydGV4LnZpc2l0ZWQgKSB7XHJcbiAgICAgICAgdGhpcy5tYXJrQnJpZGdlcyggYnJpZGdlcywgdmVydGV4ICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBicmlkZ2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBicmlkZ2VFZGdlID0gYnJpZGdlc1sgaSBdO1xyXG5cclxuICAgICAgdGhpcy5yZW1vdmVFZGdlKCBicmlkZ2VFZGdlICk7XHJcbiAgICAgIHRoaXMucmVwbGFjZUVkZ2VJbkxvb3BzKCBicmlkZ2VFZGdlLCBbXSApO1xyXG4gICAgICBicmlkZ2VFZGdlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgdmVydGljZXMgdGhhdCBoYXZlIG9yZGVyIGxlc3MgdGhhbiAyIChzbyBlaXRoZXIgYSB2ZXJ0ZXggd2l0aCBvbmUgb3IgemVybyBlZGdlcyBhZGphY2VudCkuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICByZW1vdmVMb3dPcmRlclZlcnRpY2VzKCkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggXy5ldmVyeSggdGhpcy5lZGdlcywgZWRnZSA9PiBfLmluY2x1ZGVzKCB0aGlzLnZlcnRpY2VzLCBlZGdlLnN0YXJ0VmVydGV4ICkgKSApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggXy5ldmVyeSggdGhpcy5lZGdlcywgZWRnZSA9PiBfLmluY2x1ZGVzKCB0aGlzLnZlcnRpY2VzLCBlZGdlLmVuZFZlcnRleCApICkgKTtcclxuXHJcbiAgICBsZXQgbmVlZHNMb29wID0gdHJ1ZTtcclxuICAgIHdoaWxlICggbmVlZHNMb29wICkge1xyXG4gICAgICBuZWVkc0xvb3AgPSBmYWxzZTtcclxuXHJcbiAgICAgIGZvciAoIGxldCBpID0gdGhpcy52ZXJ0aWNlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSApIHtcclxuICAgICAgICBjb25zdCB2ZXJ0ZXggPSB0aGlzLnZlcnRpY2VzWyBpIF07XHJcblxyXG4gICAgICAgIGlmICggdmVydGV4LmluY2lkZW50SGFsZkVkZ2VzLmxlbmd0aCA8IDIgKSB7XHJcbiAgICAgICAgICAvLyBEaXNjb25uZWN0IGFueSBleGlzdGluZyBlZGdlc1xyXG4gICAgICAgICAgZm9yICggbGV0IGogPSAwOyBqIDwgdmVydGV4LmluY2lkZW50SGFsZkVkZ2VzLmxlbmd0aDsgaisrICkge1xyXG4gICAgICAgICAgICBjb25zdCBlZGdlID0gdmVydGV4LmluY2lkZW50SGFsZkVkZ2VzWyBqIF0uZWRnZTtcclxuICAgICAgICAgICAgdGhpcy5yZW1vdmVFZGdlKCBlZGdlICk7XHJcbiAgICAgICAgICAgIHRoaXMucmVwbGFjZUVkZ2VJbkxvb3BzKCBlZGdlLCBbXSApOyAvLyByZW1vdmUgdGhlIGVkZ2UgZnJvbSB0aGUgbG9vcHNcclxuICAgICAgICAgICAgZWRnZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gUmVtb3ZlIHRoZSB2ZXJ0ZXhcclxuICAgICAgICAgIHRoaXMudmVydGljZXMuc3BsaWNlKCBpLCAxICk7XHJcbiAgICAgICAgICB2ZXJ0ZXguZGlzcG9zZSgpO1xyXG5cclxuICAgICAgICAgIG5lZWRzTG9vcCA9IHRydWU7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIF8uZXZlcnkoIHRoaXMuZWRnZXMsIGVkZ2UgPT4gXy5pbmNsdWRlcyggdGhpcy52ZXJ0aWNlcywgZWRnZS5zdGFydFZlcnRleCApICkgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIF8uZXZlcnkoIHRoaXMuZWRnZXMsIGVkZ2UgPT4gXy5pbmNsdWRlcyggdGhpcy52ZXJ0aWNlcywgZWRnZS5lbmRWZXJ0ZXggKSApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTb3J0cyBpbmNpZGVudCBoYWxmLWVkZ2VzIGZvciBlYWNoIHZlcnRleC5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIG9yZGVyVmVydGV4RWRnZXMoKSB7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLnZlcnRpY2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICB0aGlzLnZlcnRpY2VzWyBpIF0uc29ydEVkZ2VzKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGJvdW5kYXJpZXMgYW5kIGZhY2VzIGJ5IGZvbGxvd2luZyBlYWNoIGhhbGYtZWRnZSBjb3VudGVyLWNsb2Nrd2lzZVxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgZXh0cmFjdEZhY2VzKCkge1xyXG4gICAgY29uc3QgaGFsZkVkZ2VzID0gW107XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLmVkZ2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBoYWxmRWRnZXMucHVzaCggdGhpcy5lZGdlc1sgaSBdLmZvcndhcmRIYWxmICk7XHJcbiAgICAgIGhhbGZFZGdlcy5wdXNoKCB0aGlzLmVkZ2VzWyBpIF0ucmV2ZXJzZWRIYWxmICk7XHJcbiAgICB9XHJcblxyXG4gICAgd2hpbGUgKCBoYWxmRWRnZXMubGVuZ3RoICkge1xyXG4gICAgICBjb25zdCBib3VuZGFyeUhhbGZFZGdlcyA9IFtdO1xyXG4gICAgICBsZXQgaGFsZkVkZ2UgPSBoYWxmRWRnZXNbIDAgXTtcclxuICAgICAgY29uc3Qgc3RhcnRpbmdIYWxmRWRnZSA9IGhhbGZFZGdlO1xyXG4gICAgICB3aGlsZSAoIGhhbGZFZGdlICkge1xyXG4gICAgICAgIGFycmF5UmVtb3ZlKCBoYWxmRWRnZXMsIGhhbGZFZGdlICk7XHJcbiAgICAgICAgYm91bmRhcnlIYWxmRWRnZXMucHVzaCggaGFsZkVkZ2UgKTtcclxuICAgICAgICBoYWxmRWRnZSA9IGhhbGZFZGdlLmdldE5leHQoKTtcclxuICAgICAgICBpZiAoIGhhbGZFZGdlID09PSBzdGFydGluZ0hhbGZFZGdlICkge1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGJvdW5kYXJ5ID0gQm91bmRhcnkucG9vbC5jcmVhdGUoIGJvdW5kYXJ5SGFsZkVkZ2VzICk7XHJcbiAgICAgICggYm91bmRhcnkuc2lnbmVkQXJlYSA+IDAgPyB0aGlzLmlubmVyQm91bmRhcmllcyA6IHRoaXMub3V0ZXJCb3VuZGFyaWVzICkucHVzaCggYm91bmRhcnkgKTtcclxuICAgICAgdGhpcy5ib3VuZGFyaWVzLnB1c2goIGJvdW5kYXJ5ICk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5pbm5lckJvdW5kYXJpZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIHRoaXMuZmFjZXMucHVzaCggRmFjZS5wb29sLmNyZWF0ZSggdGhpcy5pbm5lckJvdW5kYXJpZXNbIGkgXSApICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHaXZlbiB0aGUgaW5uZXIgYW5kIG91dGVyIGJvdW5kYXJpZXMsIGl0IGNvbXB1dGVzIGEgdHJlZSByZXByZXNlbnRhdGlvbiB0byBkZXRlcm1pbmUgd2hhdCBib3VuZGFyaWVzIGFyZVxyXG4gICAqIGhvbGVzIG9mIHdoYXQgb3RoZXIgYm91bmRhcmllcywgdGhlbiBzZXRzIHVwIGZhY2UgaG9sZXMgd2l0aCB0aGUgcmVzdWx0LlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIFRoaXMgaW5mb3JtYXRpb24gaXMgc3RvcmVkIGluIHRoZSBjaGlsZEJvdW5kYXJpZXMgYXJyYXkgb2YgQm91bmRhcnksIGFuZCBpcyB0aGVuIHJlYWQgb3V0IHRvIHNldCB1cCBmYWNlcy5cclxuICAgKi9cclxuICBjb21wdXRlQm91bmRhcnlUcmVlKCkge1xyXG4gICAgLy8gVE9ETzogZGV0ZWN0IFwiaW5kZXRlcm1pbmF0ZVwiIGZvciByb2J1c3RuZXNzIChhbmQgdHJ5IG5ldyBhbmdsZXM/KSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzZcclxuICAgIGNvbnN0IHVuYm91bmRlZEhvbGVzID0gW107IC8vIHtBcnJheS48Qm91bmRhcnk+fVxyXG5cclxuICAgIC8vIFdlJ2xsIHdhbnQgdG8gY29tcHV0ZSBhIHJheSBmb3IgZWFjaCBvdXRlciBib3VuZGFyeSB0aGF0IHN0YXJ0cyBhdCBhbiBleHRyZW1lIHBvaW50IGZvciB0aGF0IGRpcmVjdGlvbiBhbmRcclxuICAgIC8vIGNvbnRpbnVlcyBvdXR3YXJkcy4gVGhlIG5leHQgYm91bmRhcnkgaXQgaW50ZXJzZWN0cyB3aWxsIGJlIGxpbmtlZCB0b2dldGhlciBpbiB0aGUgdHJlZS5cclxuICAgIC8vIFdlIGhhdmUgYSBtb3N0bHktYXJiaXRyYXJ5IGFuZ2xlIGhlcmUgdGhhdCBob3BlZnVsbHkgd29uJ3QgYmUgdXNlZC5cclxuICAgIGNvbnN0IHRyYW5zZm9ybSA9IG5ldyBUcmFuc2Zvcm0zKCBNYXRyaXgzLnJvdGF0aW9uMiggMS41NzI5NjU3ICkgKTtcclxuXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLm91dGVyQm91bmRhcmllcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgY29uc3Qgb3V0ZXJCb3VuZGFyeSA9IHRoaXMub3V0ZXJCb3VuZGFyaWVzWyBpIF07XHJcblxyXG4gICAgICBjb25zdCByYXkgPSBvdXRlckJvdW5kYXJ5LmNvbXB1dGVFeHRyZW1lUmF5KCB0cmFuc2Zvcm0gKTtcclxuXHJcbiAgICAgIGxldCBjbG9zZXN0RWRnZSA9IG51bGw7XHJcbiAgICAgIGxldCBjbG9zZXN0RGlzdGFuY2UgPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XHJcbiAgICAgIGxldCBjbG9zZXN0V2luZCA9IGZhbHNlO1xyXG5cclxuICAgICAgZm9yICggbGV0IGogPSAwOyBqIDwgdGhpcy5lZGdlcy5sZW5ndGg7IGorKyApIHtcclxuICAgICAgICBjb25zdCBlZGdlID0gdGhpcy5lZGdlc1sgaiBdO1xyXG5cclxuICAgICAgICBjb25zdCBpbnRlcnNlY3Rpb25zID0gZWRnZS5zZWdtZW50LmludGVyc2VjdGlvbiggcmF5ICk7XHJcbiAgICAgICAgZm9yICggbGV0IGsgPSAwOyBrIDwgaW50ZXJzZWN0aW9ucy5sZW5ndGg7IGsrKyApIHtcclxuICAgICAgICAgIGNvbnN0IGludGVyc2VjdGlvbiA9IGludGVyc2VjdGlvbnNbIGsgXTtcclxuXHJcbiAgICAgICAgICBpZiAoIGludGVyc2VjdGlvbi5kaXN0YW5jZSA8IGNsb3Nlc3REaXN0YW5jZSApIHtcclxuICAgICAgICAgICAgY2xvc2VzdEVkZ2UgPSBlZGdlO1xyXG4gICAgICAgICAgICBjbG9zZXN0RGlzdGFuY2UgPSBpbnRlcnNlY3Rpb24uZGlzdGFuY2U7XHJcbiAgICAgICAgICAgIGNsb3Nlc3RXaW5kID0gaW50ZXJzZWN0aW9uLndpbmQ7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIGNsb3Nlc3RFZGdlID09PSBudWxsICkge1xyXG4gICAgICAgIHVuYm91bmRlZEhvbGVzLnB1c2goIG91dGVyQm91bmRhcnkgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBjb25zdCByZXZlcnNlZCA9IGNsb3Nlc3RXaW5kIDwgMDtcclxuICAgICAgICBjb25zdCBjbG9zZXN0SGFsZkVkZ2UgPSByZXZlcnNlZCA/IGNsb3Nlc3RFZGdlLnJldmVyc2VkSGFsZiA6IGNsb3Nlc3RFZGdlLmZvcndhcmRIYWxmO1xyXG4gICAgICAgIGNvbnN0IGNsb3Nlc3RCb3VuZGFyeSA9IHRoaXMuZ2V0Qm91bmRhcnlPZkhhbGZFZGdlKCBjbG9zZXN0SGFsZkVkZ2UgKTtcclxuICAgICAgICBjbG9zZXN0Qm91bmRhcnkuY2hpbGRCb3VuZGFyaWVzLnB1c2goIG91dGVyQm91bmRhcnkgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHVuYm91bmRlZEhvbGVzLmZvckVhY2goIHRoaXMudW5ib3VuZGVkRmFjZS5yZWN1cnNpdmVseUFkZEhvbGVzLmJpbmQoIHRoaXMudW5ib3VuZGVkRmFjZSApICk7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLmZhY2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBmYWNlID0gdGhpcy5mYWNlc1sgaSBdO1xyXG4gICAgICBpZiAoIGZhY2UuYm91bmRhcnkgIT09IG51bGwgKSB7XHJcbiAgICAgICAgZmFjZS5ib3VuZGFyeS5jaGlsZEJvdW5kYXJpZXMuZm9yRWFjaCggZmFjZS5yZWN1cnNpdmVseUFkZEhvbGVzLmJpbmQoIGZhY2UgKSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb21wdXRlcyB0aGUgd2luZGluZyBtYXAgZm9yIGVhY2ggZmFjZSwgc3RhcnRpbmcgd2l0aCAwIG9uIHRoZSB1bmJvdW5kZWQgZmFjZSAoZm9yIGVhY2ggc2hhcGVJZCkuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBjb21wdXRlV2luZGluZ01hcCgpIHtcclxuICAgIGNvbnN0IGVkZ2VzID0gdGhpcy5lZGdlcy5zbGljZSgpO1xyXG5cclxuICAgIC8vIFdpbmRpbmcgbnVtYmVycyBmb3IgXCJvdXRzaWRlXCIgYXJlIDAuXHJcbiAgICBjb25zdCBvdXRzaWRlTWFwID0ge307XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLnNoYXBlSWRzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBvdXRzaWRlTWFwWyB0aGlzLnNoYXBlSWRzWyBpIF0gXSA9IDA7XHJcbiAgICB9XHJcbiAgICB0aGlzLnVuYm91bmRlZEZhY2Uud2luZGluZ01hcCA9IG91dHNpZGVNYXA7XHJcblxyXG4gICAgLy8gV2UgaGF2ZSBcInNvbHZlZFwiIHRoZSB1bmJvdW5kZWQgZmFjZSwgYW5kIHRoZW4gaXRlcmF0aXZlbHkgZ28gb3ZlciB0aGUgZWRnZXMgbG9va2luZyBmb3IgYSBjYXNlIHdoZXJlIHdlIGhhdmVcclxuICAgIC8vIHNvbHZlZCBvbmUgb2YgdGhlIGZhY2VzIHRoYXQgaXMgYWRqYWNlbnQgdG8gdGhhdCBlZGdlLiBXZSBjYW4gdGhlbiBjb21wdXRlIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gd2luZGluZ1xyXG4gICAgLy8gbnVtYmVycyBiZXR3ZWVuIHRoZSB0d28gZmFjZXMsIGFuZCB0aHVzIGRldGVybWluZSB0aGUgKGFic29sdXRlKSB3aW5kaW5nIG51bWJlcnMgZm9yIHRoZSB1bnNvbHZlZCBmYWNlLlxyXG4gICAgd2hpbGUgKCBlZGdlcy5sZW5ndGggKSB7XHJcbiAgICAgIGZvciAoIGxldCBqID0gZWRnZXMubGVuZ3RoIC0gMTsgaiA+PSAwOyBqLS0gKSB7XHJcbiAgICAgICAgY29uc3QgZWRnZSA9IGVkZ2VzWyBqIF07XHJcblxyXG4gICAgICAgIGNvbnN0IGZvcndhcmRIYWxmID0gZWRnZS5mb3J3YXJkSGFsZjtcclxuICAgICAgICBjb25zdCByZXZlcnNlZEhhbGYgPSBlZGdlLnJldmVyc2VkSGFsZjtcclxuXHJcbiAgICAgICAgY29uc3QgZm9yd2FyZEZhY2UgPSBmb3J3YXJkSGFsZi5mYWNlO1xyXG4gICAgICAgIGNvbnN0IHJldmVyc2VkRmFjZSA9IHJldmVyc2VkSGFsZi5mYWNlO1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGZvcndhcmRGYWNlICE9PSByZXZlcnNlZEZhY2UgKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc29sdmVkRm9yd2FyZCA9IGZvcndhcmRGYWNlLndpbmRpbmdNYXAgIT09IG51bGw7XHJcbiAgICAgICAgY29uc3Qgc29sdmVkUmV2ZXJzZWQgPSByZXZlcnNlZEZhY2Uud2luZGluZ01hcCAhPT0gbnVsbDtcclxuXHJcbiAgICAgICAgaWYgKCBzb2x2ZWRGb3J3YXJkICYmIHNvbHZlZFJldmVyc2VkICkge1xyXG4gICAgICAgICAgZWRnZXMuc3BsaWNlKCBqLCAxICk7XHJcblxyXG4gICAgICAgICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgICAgICAgIGZvciAoIGxldCBtID0gMDsgbSA8IHRoaXMuc2hhcGVJZHMubGVuZ3RoOyBtKysgKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgaWQgPSB0aGlzLnNoYXBlSWRzWyBtIF07XHJcbiAgICAgICAgICAgICAgYXNzZXJ0KCBmb3J3YXJkRmFjZS53aW5kaW5nTWFwWyBpZCBdIC0gcmV2ZXJzZWRGYWNlLndpbmRpbmdNYXBbIGlkIF0gPT09IHRoaXMuY29tcHV0ZURpZmZlcmVudGlhbCggZWRnZSwgaWQgKSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCAhc29sdmVkRm9yd2FyZCAmJiAhc29sdmVkUmV2ZXJzZWQgKSB7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBjb25zdCBzb2x2ZWRGYWNlID0gc29sdmVkRm9yd2FyZCA/IGZvcndhcmRGYWNlIDogcmV2ZXJzZWRGYWNlO1xyXG4gICAgICAgICAgY29uc3QgdW5zb2x2ZWRGYWNlID0gc29sdmVkRm9yd2FyZCA/IHJldmVyc2VkRmFjZSA6IGZvcndhcmRGYWNlO1xyXG5cclxuICAgICAgICAgIGNvbnN0IHdpbmRpbmdNYXAgPSB7fTtcclxuICAgICAgICAgIGZvciAoIGxldCBrID0gMDsgayA8IHRoaXMuc2hhcGVJZHMubGVuZ3RoOyBrKysgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNoYXBlSWQgPSB0aGlzLnNoYXBlSWRzWyBrIF07XHJcbiAgICAgICAgICAgIGNvbnN0IGRpZmZlcmVudGlhbCA9IHRoaXMuY29tcHV0ZURpZmZlcmVudGlhbCggZWRnZSwgc2hhcGVJZCApO1xyXG4gICAgICAgICAgICB3aW5kaW5nTWFwWyBzaGFwZUlkIF0gPSBzb2x2ZWRGYWNlLndpbmRpbmdNYXBbIHNoYXBlSWQgXSArIGRpZmZlcmVudGlhbCAqICggc29sdmVkRm9yd2FyZCA/IC0xIDogMSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdW5zb2x2ZWRGYWNlLndpbmRpbmdNYXAgPSB3aW5kaW5nTWFwO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcHV0ZXMgdGhlIGRpZmZlcmVudGlhbCBpbiB3aW5kaW5nIG51bWJlcnMgKGZvcndhcmQgZmFjZSB3aW5kaW5nIG51bWJlciBtaW51cyB0aGUgcmV2ZXJzZWQgZmFjZSB3aW5kaW5nIG51bWJlcilcclxuICAgKiAoXCJmb3J3YXJkIGZhY2VcIiBpcyB0aGUgZmFjZSBvbiB0aGUgZm9yd2FyZCBoYWxmLWVkZ2Ugc2lkZSwgZXRjLilcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtFZGdlfSBlZGdlXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHNoYXBlSWRcclxuICAgKiBAcmV0dXJucyB7bnVtYmVyfSAtIFRoZSBkaWZmZXJlbmNlIGJldHdlZW4gZm9yd2FyZCBmYWNlIGFuZCByZXZlcnNlZCBmYWNlIHdpbmRpbmcgbnVtYmVycy5cclxuICAgKi9cclxuICBjb21wdXRlRGlmZmVyZW50aWFsKCBlZGdlLCBzaGFwZUlkICkge1xyXG4gICAgbGV0IGRpZmZlcmVudGlhbCA9IDA7IC8vIGZvcndhcmQgZmFjZSAtIHJldmVyc2VkIGZhY2VcclxuICAgIGZvciAoIGxldCBtID0gMDsgbSA8IHRoaXMubG9vcHMubGVuZ3RoOyBtKysgKSB7XHJcbiAgICAgIGNvbnN0IGxvb3AgPSB0aGlzLmxvb3BzWyBtIF07XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGxvb3AuY2xvc2VkLCAnVGhpcyBpcyBvbmx5IGRlZmluZWQgdG8gd29yayBmb3IgY2xvc2VkIGxvb3BzJyApO1xyXG4gICAgICBpZiAoIGxvb3Auc2hhcGVJZCAhPT0gc2hhcGVJZCApIHtcclxuICAgICAgICBjb250aW51ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZm9yICggbGV0IG4gPSAwOyBuIDwgbG9vcC5oYWxmRWRnZXMubGVuZ3RoOyBuKysgKSB7XHJcbiAgICAgICAgY29uc3QgbG9vcEhhbGZFZGdlID0gbG9vcC5oYWxmRWRnZXNbIG4gXTtcclxuICAgICAgICBpZiAoIGxvb3BIYWxmRWRnZSA9PT0gZWRnZS5mb3J3YXJkSGFsZiApIHtcclxuICAgICAgICAgIGRpZmZlcmVudGlhbCsrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggbG9vcEhhbGZFZGdlID09PSBlZGdlLnJldmVyc2VkSGFsZiApIHtcclxuICAgICAgICAgIGRpZmZlcmVudGlhbC0tO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGRpZmZlcmVudGlhbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHVuYm91bmRlZCBmYWNlIGFzIHVuZmlsbGVkLCBhbmQgdGhlbiBzZXRzIGVhY2ggZmFjZSdzIGZpbGwgc28gdGhhdCBlZGdlcyBzZXBhcmF0ZSBvbmUgZmlsbGVkIGZhY2Ugd2l0aFxyXG4gICAqIG9uZSB1bmZpbGxlZCBmYWNlLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBOT1RFOiBCZXN0IHRvIGNhbGwgdGhpcyBvbiB0aGUgcmVzdWx0IGZyb20gY3JlYXRlRmlsbGVkU3ViR3JhcGgoKSwgc2luY2UgaXQgc2hvdWxkIGhhdmUgZ3VhcmFudGVlZCBwcm9wZXJ0aWVzXHJcbiAgICogICAgICAgdG8gbWFrZSB0aGlzIGNvbnNpc3RlbnQuIE5vdGFibHksIGFsbCB2ZXJ0aWNlcyBuZWVkIHRvIGhhdmUgYW4gZXZlbiBvcmRlciAobnVtYmVyIG9mIGVkZ2VzKVxyXG4gICAqL1xyXG4gIGZpbGxBbHRlcm5hdGluZ0ZhY2VzKCkge1xyXG4gICAgbGV0IG51bGxGYWNlRmlsbGVkQ291bnQgPSAwO1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy5mYWNlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgdGhpcy5mYWNlc1sgaSBdLmZpbGxlZCA9IG51bGw7XHJcbiAgICAgIG51bGxGYWNlRmlsbGVkQ291bnQrKztcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnVuYm91bmRlZEZhY2UuZmlsbGVkID0gZmFsc2U7XHJcbiAgICBudWxsRmFjZUZpbGxlZENvdW50LS07XHJcblxyXG4gICAgd2hpbGUgKCBudWxsRmFjZUZpbGxlZENvdW50ICkge1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLmVkZ2VzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIGNvbnN0IGVkZ2UgPSB0aGlzLmVkZ2VzWyBpIF07XHJcbiAgICAgICAgY29uc3QgZm9yd2FyZEZhY2UgPSBlZGdlLmZvcndhcmRIYWxmLmZhY2U7XHJcbiAgICAgICAgY29uc3QgcmV2ZXJzZWRGYWNlID0gZWRnZS5yZXZlcnNlZEhhbGYuZmFjZTtcclxuXHJcbiAgICAgICAgY29uc3QgZm9yd2FyZE51bGwgPSBmb3J3YXJkRmFjZS5maWxsZWQgPT09IG51bGw7XHJcbiAgICAgICAgY29uc3QgcmV2ZXJzZWROdWxsID0gcmV2ZXJzZWRGYWNlLmZpbGxlZCA9PT0gbnVsbDtcclxuXHJcbiAgICAgICAgaWYgKCBmb3J3YXJkTnVsbCAmJiAhcmV2ZXJzZWROdWxsICkge1xyXG4gICAgICAgICAgZm9yd2FyZEZhY2UuZmlsbGVkID0gIXJldmVyc2VkRmFjZS5maWxsZWQ7XHJcbiAgICAgICAgICBudWxsRmFjZUZpbGxlZENvdW50LS07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCAhZm9yd2FyZE51bGwgJiYgcmV2ZXJzZWROdWxsICkge1xyXG4gICAgICAgICAgcmV2ZXJzZWRGYWNlLmZpbGxlZCA9ICFmb3J3YXJkRmFjZS5maWxsZWQ7XHJcbiAgICAgICAgICBudWxsRmFjZUZpbGxlZENvdW50LS07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBib3VuZGFyeSB0aGF0IGNvbnRhaW5zIHRoZSBzcGVjaWZpZWQgaGFsZi1lZGdlLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICpcclxuICAgKiBUT0RPOiBmaW5kIGEgYmV0dGVyIHdheSwgdGhpcyBpcyBjcmF6eSBpbmVmZmljaWVudCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMva2l0ZS9pc3N1ZXMvNzZcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7SGFsZkVkZ2V9IGhhbGZFZGdlXHJcbiAgICogQHJldHVybnMge0JvdW5kYXJ5fVxyXG4gICAqL1xyXG4gIGdldEJvdW5kYXJ5T2ZIYWxmRWRnZSggaGFsZkVkZ2UgKSB7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLmJvdW5kYXJpZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGJvdW5kYXJ5ID0gdGhpcy5ib3VuZGFyaWVzWyBpIF07XHJcblxyXG4gICAgICBpZiAoIGJvdW5kYXJ5Lmhhc0hhbGZFZGdlKCBoYWxmRWRnZSApICkge1xyXG4gICAgICAgIHJldHVybiBib3VuZGFyeTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRocm93IG5ldyBFcnJvciggJ0NvdWxkIG5vdCBmaW5kIGJvdW5kYXJ5JyApO1xyXG4gIH1cclxuXHJcbiAgLy8gQHB1YmxpY1xyXG4gIHN0YXRpYyBpc0ludGVybmFsKCBwb2ludCwgdCwgc2VnbWVudCwgZGlzdGFuY2VUaHJlc2hvbGQsIHRUaHJlc2hvbGQgKSB7XHJcbiAgICByZXR1cm4gdCA+IHRUaHJlc2hvbGQgJiZcclxuICAgICAgICAgICB0IDwgKCAxIC0gdFRocmVzaG9sZCApICYmXHJcbiAgICAgICAgICAgcG9pbnQuZGlzdGFuY2UoIHNlZ21lbnQuc3RhcnQgKSA+IGRpc3RhbmNlVGhyZXNob2xkICYmXHJcbiAgICAgICAgICAgcG9pbnQuZGlzdGFuY2UoIHNlZ21lbnQuZW5kICkgPiBkaXN0YW5jZVRocmVzaG9sZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFwiVW5pb25cIiBiaW5hcnkgd2luZGluZyBtYXAgZmlsdGVyIGZvciB1c2Ugd2l0aCBHcmFwaC5iaW5hcnlSZXN1bHQuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogVGhpcyBjb21iaW5lcyBib3RoIHNoYXBlcyB0b2dldGhlciBzbyB0aGF0IGEgcG9pbnQgaXMgaW4gdGhlIHJlc3VsdGluZyBzaGFwZSBpZiBpdCB3YXMgaW4gZWl0aGVyIG9mIHRoZSBpbnB1dFxyXG4gICAqIHNoYXBlcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB3aW5kaW5nTWFwIC0gU2VlIGNvbXB1dGVGYWNlSW5jbHVzaW9uIGZvciBtb3JlIGRldGFpbHNcclxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgKi9cclxuICBzdGF0aWMgQklOQVJZX05PTlpFUk9fVU5JT04oIHdpbmRpbmdNYXAgKSB7XHJcbiAgICByZXR1cm4gd2luZGluZ01hcFsgJzAnIF0gIT09IDAgfHwgd2luZGluZ01hcFsgJzEnIF0gIT09IDA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBcIkludGVyc2VjdGlvblwiIGJpbmFyeSB3aW5kaW5nIG1hcCBmaWx0ZXIgZm9yIHVzZSB3aXRoIEdyYXBoLmJpbmFyeVJlc3VsdC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBUaGlzIGNvbWJpbmVzIGJvdGggc2hhcGVzIHRvZ2V0aGVyIHNvIHRoYXQgYSBwb2ludCBpcyBpbiB0aGUgcmVzdWx0aW5nIHNoYXBlIGlmIGl0IHdhcyBpbiBib3RoIG9mIHRoZSBpbnB1dFxyXG4gICAqIHNoYXBlcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB3aW5kaW5nTWFwIC0gU2VlIGNvbXB1dGVGYWNlSW5jbHVzaW9uIGZvciBtb3JlIGRldGFpbHNcclxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgKi9cclxuICBzdGF0aWMgQklOQVJZX05PTlpFUk9fSU5URVJTRUNUSU9OKCB3aW5kaW5nTWFwICkge1xyXG4gICAgcmV0dXJuIHdpbmRpbmdNYXBbICcwJyBdICE9PSAwICYmIHdpbmRpbmdNYXBbICcxJyBdICE9PSAwO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogXCJEaWZmZXJlbmNlXCIgYmluYXJ5IHdpbmRpbmcgbWFwIGZpbHRlciBmb3IgdXNlIHdpdGggR3JhcGguYmluYXJ5UmVzdWx0LlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIFRoaXMgY29tYmluZXMgYm90aCBzaGFwZXMgdG9nZXRoZXIgc28gdGhhdCBhIHBvaW50IGlzIGluIHRoZSByZXN1bHRpbmcgc2hhcGUgaWYgaXQgd2FzIGluIHRoZSBmaXJzdCBzaGFwZSBBTkRcclxuICAgKiB3YXMgTk9UIGluIHRoZSBzZWNvbmQgc2hhcGUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gd2luZGluZ01hcCAtIFNlZSBjb21wdXRlRmFjZUluY2x1c2lvbiBmb3IgbW9yZSBkZXRhaWxzXHJcbiAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICovXHJcbiAgc3RhdGljIEJJTkFSWV9OT05aRVJPX0RJRkZFUkVOQ0UoIHdpbmRpbmdNYXAgKSB7XHJcbiAgICByZXR1cm4gd2luZGluZ01hcFsgJzAnIF0gIT09IDAgJiYgd2luZGluZ01hcFsgJzEnIF0gPT09IDA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBcIlhPUlwiIGJpbmFyeSB3aW5kaW5nIG1hcCBmaWx0ZXIgZm9yIHVzZSB3aXRoIEdyYXBoLmJpbmFyeVJlc3VsdC5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBUaGlzIGNvbWJpbmVzIGJvdGggc2hhcGVzIHRvZ2V0aGVyIHNvIHRoYXQgYSBwb2ludCBpcyBpbiB0aGUgcmVzdWx0aW5nIHNoYXBlIGlmIGl0IGlzIG9ubHkgaW4gZXhhY3RseSBvbmUgb2YgdGhlXHJcbiAgICogaW5wdXQgc2hhcGVzLiBJdCdzIGxpa2UgdGhlIHVuaW9uIG1pbnVzIGludGVyc2VjdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB3aW5kaW5nTWFwIC0gU2VlIGNvbXB1dGVGYWNlSW5jbHVzaW9uIGZvciBtb3JlIGRldGFpbHNcclxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgKi9cclxuICBzdGF0aWMgQklOQVJZX05PTlpFUk9fWE9SKCB3aW5kaW5nTWFwICkge1xyXG4gICAgcmV0dXJuICggKCB3aW5kaW5nTWFwWyAnMCcgXSAhPT0gMCApIF4gKCB3aW5kaW5nTWFwWyAnMScgXSAhPT0gMCApICkgPT09IDE7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYml0d2lzZVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgcmVzdWx0aW5nIFNoYXBlIG9idGFpbmVkIGJ5IGNvbWJpbmluZyB0aGUgdHdvIHNoYXBlcyBnaXZlbiB3aXRoIHRoZSBmaWx0ZXIuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtTaGFwZX0gc2hhcGVBXHJcbiAgICogQHBhcmFtIHtTaGFwZX0gc2hhcGVCXHJcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gd2luZGluZ01hcEZpbHRlciAtIFNlZSBjb21wdXRlRmFjZUluY2x1c2lvbiBmb3IgZGV0YWlscyBvbiB0aGUgZm9ybWF0XHJcbiAgICogQHJldHVybnMge1NoYXBlfVxyXG4gICAqL1xyXG4gIHN0YXRpYyBiaW5hcnlSZXN1bHQoIHNoYXBlQSwgc2hhcGVCLCB3aW5kaW5nTWFwRmlsdGVyICkge1xyXG4gICAgY29uc3QgZ3JhcGggPSBuZXcgR3JhcGgoKTtcclxuICAgIGdyYXBoLmFkZFNoYXBlKCAwLCBzaGFwZUEgKTtcclxuICAgIGdyYXBoLmFkZFNoYXBlKCAxLCBzaGFwZUIgKTtcclxuXHJcbiAgICBncmFwaC5jb21wdXRlU2ltcGxpZmllZEZhY2VzKCk7XHJcbiAgICBncmFwaC5jb21wdXRlRmFjZUluY2x1c2lvbiggd2luZGluZ01hcEZpbHRlciApO1xyXG4gICAgY29uc3Qgc3ViZ3JhcGggPSBncmFwaC5jcmVhdGVGaWxsZWRTdWJHcmFwaCgpO1xyXG4gICAgY29uc3Qgc2hhcGUgPSBzdWJncmFwaC5mYWNlc1RvU2hhcGUoKTtcclxuXHJcbiAgICBncmFwaC5kaXNwb3NlKCk7XHJcbiAgICBzdWJncmFwaC5kaXNwb3NlKCk7XHJcblxyXG4gICAgcmV0dXJuIHNoYXBlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgdW5pb24gb2YgYW4gYXJyYXkgb2Ygc2hhcGVzLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7QXJyYXkuPFNoYXBlPn0gc2hhcGVzXHJcbiAgICogQHJldHVybnMge1NoYXBlfVxyXG4gICAqL1xyXG4gIHN0YXRpYyB1bmlvbk5vblplcm8oIHNoYXBlcyApIHtcclxuICAgIGNvbnN0IGdyYXBoID0gbmV3IEdyYXBoKCk7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzaGFwZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGdyYXBoLmFkZFNoYXBlKCBpLCBzaGFwZXNbIGkgXSApO1xyXG4gICAgfVxyXG5cclxuICAgIGdyYXBoLmNvbXB1dGVTaW1wbGlmaWVkRmFjZXMoKTtcclxuICAgIGdyYXBoLmNvbXB1dGVGYWNlSW5jbHVzaW9uKCB3aW5kaW5nTWFwID0+IHtcclxuICAgICAgZm9yICggbGV0IGogPSAwOyBqIDwgc2hhcGVzLmxlbmd0aDsgaisrICkge1xyXG4gICAgICAgIGlmICggd2luZGluZ01hcFsgaiBdICE9PSAwICkge1xyXG4gICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0gKTtcclxuICAgIGNvbnN0IHN1YmdyYXBoID0gZ3JhcGguY3JlYXRlRmlsbGVkU3ViR3JhcGgoKTtcclxuICAgIGNvbnN0IHNoYXBlID0gc3ViZ3JhcGguZmFjZXNUb1NoYXBlKCk7XHJcblxyXG4gICAgZ3JhcGguZGlzcG9zZSgpO1xyXG4gICAgc3ViZ3JhcGguZGlzcG9zZSgpO1xyXG5cclxuICAgIHJldHVybiBzaGFwZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGludGVyc2VjdGlvbiBvZiBhbiBhcnJheSBvZiBzaGFwZXMuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtBcnJheS48U2hhcGU+fSBzaGFwZXNcclxuICAgKiBAcmV0dXJucyB7U2hhcGV9XHJcbiAgICovXHJcbiAgc3RhdGljIGludGVyc2VjdGlvbk5vblplcm8oIHNoYXBlcyApIHtcclxuICAgIGNvbnN0IGdyYXBoID0gbmV3IEdyYXBoKCk7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzaGFwZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGdyYXBoLmFkZFNoYXBlKCBpLCBzaGFwZXNbIGkgXSApO1xyXG4gICAgfVxyXG5cclxuICAgIGdyYXBoLmNvbXB1dGVTaW1wbGlmaWVkRmFjZXMoKTtcclxuICAgIGdyYXBoLmNvbXB1dGVGYWNlSW5jbHVzaW9uKCB3aW5kaW5nTWFwID0+IHtcclxuICAgICAgZm9yICggbGV0IGogPSAwOyBqIDwgc2hhcGVzLmxlbmd0aDsgaisrICkge1xyXG4gICAgICAgIGlmICggd2luZGluZ01hcFsgaiBdID09PSAwICkge1xyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0gKTtcclxuICAgIGNvbnN0IHN1YmdyYXBoID0gZ3JhcGguY3JlYXRlRmlsbGVkU3ViR3JhcGgoKTtcclxuICAgIGNvbnN0IHNoYXBlID0gc3ViZ3JhcGguZmFjZXNUb1NoYXBlKCk7XHJcblxyXG4gICAgZ3JhcGguZGlzcG9zZSgpO1xyXG4gICAgc3ViZ3JhcGguZGlzcG9zZSgpO1xyXG5cclxuICAgIHJldHVybiBzaGFwZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHhvciBvZiBhbiBhcnJheSBvZiBzaGFwZXMuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogVE9ETzogcmVkdWNlIGNvZGUgZHVwbGljYXRpb24/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9raXRlL2lzc3Vlcy83NlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtBcnJheS48U2hhcGU+fSBzaGFwZXNcclxuICAgKiBAcmV0dXJucyB7U2hhcGV9XHJcbiAgICovXHJcbiAgc3RhdGljIHhvck5vblplcm8oIHNoYXBlcyApIHtcclxuICAgIGNvbnN0IGdyYXBoID0gbmV3IEdyYXBoKCk7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBzaGFwZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGdyYXBoLmFkZFNoYXBlKCBpLCBzaGFwZXNbIGkgXSApO1xyXG4gICAgfVxyXG5cclxuICAgIGdyYXBoLmNvbXB1dGVTaW1wbGlmaWVkRmFjZXMoKTtcclxuICAgIGdyYXBoLmNvbXB1dGVGYWNlSW5jbHVzaW9uKCB3aW5kaW5nTWFwID0+IHtcclxuICAgICAgbGV0IGluY2x1ZGVkID0gZmFsc2U7XHJcbiAgICAgIGZvciAoIGxldCBqID0gMDsgaiA8IHNoYXBlcy5sZW5ndGg7IGorKyApIHtcclxuICAgICAgICBpZiAoIHdpbmRpbmdNYXBbIGogXSAhPT0gMCApIHtcclxuICAgICAgICAgIGluY2x1ZGVkID0gIWluY2x1ZGVkO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gaW5jbHVkZWQ7XHJcbiAgICB9ICk7XHJcbiAgICBjb25zdCBzdWJncmFwaCA9IGdyYXBoLmNyZWF0ZUZpbGxlZFN1YkdyYXBoKCk7XHJcbiAgICBjb25zdCBzaGFwZSA9IHN1YmdyYXBoLmZhY2VzVG9TaGFwZSgpO1xyXG5cclxuICAgIGdyYXBoLmRpc3Bvc2UoKTtcclxuICAgIHN1YmdyYXBoLmRpc3Bvc2UoKTtcclxuXHJcbiAgICByZXR1cm4gc2hhcGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgc2ltcGxpZmllZCBTaGFwZSBvYnRhaW5lZCBmcm9tIHJ1bm5pbmcgaXQgdGhyb3VnaCB0aGUgc2ltcGxpZmljYXRpb24gc3RlcHMgd2l0aCBub24temVybyBvdXRwdXQuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtTaGFwZX0gc2hhcGVcclxuICAgKiBAcmV0dXJucyB7U2hhcGV9XHJcbiAgICovXHJcbiAgc3RhdGljIHNpbXBsaWZ5Tm9uWmVybyggc2hhcGUgKSB7XHJcbiAgICBjb25zdCBncmFwaCA9IG5ldyBHcmFwaCgpO1xyXG4gICAgZ3JhcGguYWRkU2hhcGUoIDAsIHNoYXBlICk7XHJcblxyXG4gICAgZ3JhcGguY29tcHV0ZVNpbXBsaWZpZWRGYWNlcygpO1xyXG4gICAgZ3JhcGguY29tcHV0ZUZhY2VJbmNsdXNpb24oIG1hcCA9PiBtYXBbICcwJyBdICE9PSAwICk7XHJcbiAgICBjb25zdCBzdWJncmFwaCA9IGdyYXBoLmNyZWF0ZUZpbGxlZFN1YkdyYXBoKCk7XHJcbiAgICBjb25zdCByZXN1bHRTaGFwZSA9IHN1YmdyYXBoLmZhY2VzVG9TaGFwZSgpO1xyXG5cclxuICAgIGdyYXBoLmRpc3Bvc2UoKTtcclxuICAgIHN1YmdyYXBoLmRpc3Bvc2UoKTtcclxuXHJcbiAgICByZXR1cm4gcmVzdWx0U2hhcGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgY2xpcHBlZCB2ZXJzaW9uIG9mIGBzaGFwZWAgdGhhdCBjb250YWlucyBvbmx5IHRoZSBwYXJ0cyB0aGF0IGFyZSB3aXRoaW4gdGhlIGFyZWEgZGVmaW5lZCBieVxyXG4gICAqIGBjbGlwQXJlYVNoYXBlYFxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7U2hhcGV9IGNsaXBBcmVhU2hhcGVcclxuICAgKiBAcGFyYW0ge1NoYXBlfSBzaGFwZVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cclxuICAgKiBAcmV0dXJucyB7U2hhcGV9XHJcbiAgICovXHJcbiAgc3RhdGljIGNsaXBTaGFwZSggY2xpcEFyZWFTaGFwZSwgc2hhcGUsIG9wdGlvbnMgKSB7XHJcbiAgICBsZXQgaTtcclxuICAgIGxldCBqO1xyXG4gICAgbGV0IGxvb3A7XHJcblxyXG4gICAgY29uc3QgU0hBUEVfSUQgPSAwO1xyXG4gICAgY29uc3QgQ0xJUF9TSEFQRV9JRCA9IDE7XHJcblxyXG4gICAgb3B0aW9ucyA9IG1lcmdlKCB7XHJcbiAgICAgIC8vIHtib29sZWFufSAtIFJlc3BlY3RpdmVseSB3aGV0aGVyIHNlZ21lbnRzIHNob3VsZCBiZSBpbiB0aGUgcmV0dXJuZWQgc2hhcGUgaWYgdGhleSBhcmUgaW4gdGhlIGV4dGVyaW9yIG9mIHRoZVxyXG4gICAgICAvLyBjbGlwQXJlYVNoYXBlIChvdXRzaWRlKSwgb24gdGhlIGJvdW5kYXJ5LCBvciBpbiB0aGUgaW50ZXJpb3IuXHJcbiAgICAgIGluY2x1ZGVFeHRlcmlvcjogZmFsc2UsXHJcbiAgICAgIGluY2x1ZGVCb3VuZGFyeTogdHJ1ZSxcclxuICAgICAgaW5jbHVkZUludGVyaW9yOiB0cnVlXHJcbiAgICB9LCBvcHRpb25zICk7XHJcblxyXG4gICAgY29uc3Qgc2ltcGxpZmllZENsaXBBcmVhU2hhcGUgPSBHcmFwaC5zaW1wbGlmeU5vblplcm8oIGNsaXBBcmVhU2hhcGUgKTtcclxuXHJcbiAgICBjb25zdCBncmFwaCA9IG5ldyBHcmFwaCgpO1xyXG4gICAgZ3JhcGguYWRkU2hhcGUoIFNIQVBFX0lELCBzaGFwZSwge1xyXG4gICAgICBlbnN1cmVDbG9zZWQ6IGZhbHNlIC8vIGRvbid0IGFkZCBjbG9zaW5nIHNlZ21lbnRzLCBzaW5jZSB3ZSdsbCBiZSByZWNyZWF0aW5nIHN1YnBhdGhzL2V0Yy5cclxuICAgIH0gKTtcclxuICAgIGdyYXBoLmFkZFNoYXBlKCBDTElQX1NIQVBFX0lELCBzaW1wbGlmaWVkQ2xpcEFyZWFTaGFwZSApO1xyXG5cclxuICAgIC8vIEEgc3Vic2V0IG9mIHNpbXBsaWZpY2F0aW9ucyAod2Ugd2FudCB0byBrZWVwIGxvdy1vcmRlciB2ZXJ0aWNlcywgZXRjLilcclxuICAgIGdyYXBoLmVsaW1pbmF0ZU92ZXJsYXAoKTtcclxuICAgIGdyYXBoLmVsaW1pbmF0ZVNlbGZJbnRlcnNlY3Rpb24oKTtcclxuICAgIGdyYXBoLmVsaW1pbmF0ZUludGVyc2VjdGlvbigpO1xyXG4gICAgZ3JhcGguY29sbGFwc2VWZXJ0aWNlcygpO1xyXG5cclxuICAgIC8vIE1hcmsgY2xpcCBlZGdlcyB3aXRoIGRhdGE9dHJ1ZVxyXG4gICAgZm9yICggaSA9IDA7IGkgPCBncmFwaC5sb29wcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgbG9vcCA9IGdyYXBoLmxvb3BzWyBpIF07XHJcbiAgICAgIGlmICggbG9vcC5zaGFwZUlkID09PSBDTElQX1NIQVBFX0lEICkge1xyXG4gICAgICAgIGZvciAoIGogPSAwOyBqIDwgbG9vcC5oYWxmRWRnZXMubGVuZ3RoOyBqKysgKSB7XHJcbiAgICAgICAgICBsb29wLmhhbGZFZGdlc1sgaiBdLmVkZ2UuZGF0YSA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc3VicGF0aHMgPSBbXTtcclxuICAgIGZvciAoIGkgPSAwOyBpIDwgZ3JhcGgubG9vcHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGxvb3AgPSBncmFwaC5sb29wc1sgaSBdO1xyXG4gICAgICBpZiAoIGxvb3Auc2hhcGVJZCA9PT0gU0hBUEVfSUQgKSB7XHJcbiAgICAgICAgbGV0IHNlZ21lbnRzID0gW107XHJcbiAgICAgICAgZm9yICggaiA9IDA7IGogPCBsb29wLmhhbGZFZGdlcy5sZW5ndGg7IGorKyApIHtcclxuICAgICAgICAgIGNvbnN0IGhhbGZFZGdlID0gbG9vcC5oYWxmRWRnZXNbIGogXTtcclxuXHJcbiAgICAgICAgICBjb25zdCBpbmNsdWRlZCA9IGhhbGZFZGdlLmVkZ2UuZGF0YSA/IG9wdGlvbnMuaW5jbHVkZUJvdW5kYXJ5IDogKFxyXG4gICAgICAgICAgICBzaW1wbGlmaWVkQ2xpcEFyZWFTaGFwZS5jb250YWluc1BvaW50KCBoYWxmRWRnZS5lZGdlLnNlZ21lbnQucG9zaXRpb25BdCggMC41ICkgKSA/IG9wdGlvbnMuaW5jbHVkZUludGVyaW9yIDogb3B0aW9ucy5pbmNsdWRlRXh0ZXJpb3JcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgICBpZiAoIGluY2x1ZGVkICkge1xyXG4gICAgICAgICAgICBzZWdtZW50cy5wdXNoKCBoYWxmRWRnZS5nZXREaXJlY3Rpb25hbFNlZ21lbnQoKSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBJZiB3ZSBoYXZlIGFuIGV4Y2x1ZGVkIHNlZ21lbnQgaW4tYmV0d2VlbiBpbmNsdWRlZCBzZWdtZW50cywgd2UnbGwgbmVlZCB0byBzcGxpdCBpbnRvIG1vcmUgc3VicGF0aHMgdG8gaGFuZGxlXHJcbiAgICAgICAgICAvLyB0aGUgZ2FwLlxyXG4gICAgICAgICAgZWxzZSBpZiAoIHNlZ21lbnRzLmxlbmd0aCApIHtcclxuICAgICAgICAgICAgc3VicGF0aHMucHVzaCggbmV3IFN1YnBhdGgoIHNlZ21lbnRzLCB1bmRlZmluZWQsIGxvb3AuY2xvc2VkICkgKTtcclxuICAgICAgICAgICAgc2VnbWVudHMgPSBbXTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBzZWdtZW50cy5sZW5ndGggKSB7XHJcbiAgICAgICAgICBzdWJwYXRocy5wdXNoKCBuZXcgU3VicGF0aCggc2VnbWVudHMsIHVuZGVmaW5lZCwgbG9vcC5jbG9zZWQgKSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdyYXBoLmRpc3Bvc2UoKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IGtpdGUuU2hhcGUoIHN1YnBhdGhzICk7XHJcbiAgfVxyXG59XHJcblxyXG5raXRlLnJlZ2lzdGVyKCAnR3JhcGgnLCBHcmFwaCApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgR3JhcGg7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxPQUFPLE1BQU0sNEJBQTRCO0FBQ2hELE9BQU9DLE9BQU8sTUFBTSw0QkFBNEI7QUFDaEQsT0FB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