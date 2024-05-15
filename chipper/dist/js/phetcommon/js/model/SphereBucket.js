// Copyright 2013-2024, University of Colorado Boulder

/**
 * SphereBucket is a model of a bucket that can be used to store spherical objects.  It manages the addition and removal
 * of the spheres, stacks them as they are added, and manages the stack as spheres are removed.
 *
 * This expects the spheres to have certain properties, please inspect the code to understand the 'contract' between the
 * bucket and the spheres.
 *
 * @author John Blanco
 */

import Utils from '../../../dot/js/Utils.js';
import Vector2 from '../../../dot/js/Vector2.js';
import cleanArray from '../../../phet-core/js/cleanArray.js';
import Tandem from '../../../tandem/js/Tandem.js';
import ArrayIO from '../../../tandem/js/types/ArrayIO.js';
import IOType from '../../../tandem/js/types/IOType.js';
import ReferenceIO from '../../../tandem/js/types/ReferenceIO.js';
import phetcommon from '../phetcommon.js';
import Bucket from './Bucket.js';
import optionize from '../../../phet-core/js/optionize.js';
const ReferenceObjectArrayIO = ArrayIO(ReferenceIO(IOType.ObjectIO));
class SphereBucket extends Bucket {
  // empirically determined, for positioning particles inside the bucket

  // particles managed by this bucket
  _particles = [];
  constructor(providedOptions) {
    const options = optionize()({
      sphereRadius: 10,
      // expected radius of the spheres that will be placed in this bucket
      usableWidthProportion: 1.0,
      // proportion of the bucket width that the spheres can occupy
      tandem: Tandem.OPTIONAL,
      phetioType: SphereBucket.SphereBucketIO,
      verticalParticleOffset: null
    }, providedOptions);
    super(options);
    this.sphereBucketTandem = options.tandem;
    this._sphereRadius = options.sphereRadius;
    this._usableWidthProportion = options.usableWidthProportion;
    this._verticalParticleOffset = options.verticalParticleOffset === null ? -this._sphereRadius * 0.4 : options.verticalParticleOffset;
    this._particles = [];
  }

  /**
   * add a particle to the first open position in the stacking order
   */
  addParticleFirstOpen(particle, animate) {
    particle.destinationProperty.set(this.getFirstOpenPosition());
    this.addParticle(particle, animate);
  }

  /**
   * add a particle to the nearest open position in the particle stack
   */
  addParticleNearestOpen(particle, animate) {
    particle.destinationProperty.set(this.getNearestOpenPosition(particle.destinationProperty.get()));
    this.addParticle(particle, animate);
  }

  /**
   * Add a particle to the bucket and set up listeners for when the particle is removed.
   */
  addParticle(particle, animate) {
    if (!animate) {
      particle.positionProperty.set(particle.destinationProperty.get());
    }
    this._particles.push(particle);

    // Add a listener that will remove this particle from the bucket if the user grabs it.
    const particleRemovedListener = userControlled => {
      // We have to verify that userControlled is transitioning to true here because in phet-io it is possible to
      // run into situations where the particle is already in the bucket but userControlled is being set to false, see
      // https://github.com/phetsims/build-an-atom/issues/239.
      if (userControlled) {
        this.removeParticle(particle);

        // The process of removing the particle from the bucket should also disconnect removal listener.
        assert && assert(!particle.bucketRemovalListener, 'listener still present after being removed from bucket');
      }
    };
    particle.userControlledProperty.lazyLink(particleRemovedListener);
    particle.bucketRemovalListener = particleRemovedListener; // Attach to the particle to aid unlinking in some cases.
  }

  /**
   * remove a particle from the bucket, updating listeners as necessary
   */
  removeParticle(particle, skipLayout = false) {
    assert && assert(this.containsParticle(particle), 'attempt made to remove particle that is not in bucket');

    // remove the particle from the array
    this._particles = _.without(this._particles, particle);

    // remove the removal listener if it is still present
    if (particle.bucketRemovalListener) {
      particle.userControlledProperty.unlink(particle.bucketRemovalListener);
      delete particle.bucketRemovalListener;
    }

    // redo the layout of the particles if enabled
    if (!skipLayout) {
      this.relayoutBucketParticles();
    }
  }
  containsParticle(particle) {
    return this._particles.includes(particle);
  }

  /**
   * extract the particle that is closest to the provided position from the bucket
   */
  extractClosestParticle(position) {
    let closestParticle = null;
    this._particles.forEach(particle => {
      if (closestParticle === null || closestParticle.positionProperty.get().distance(position) > particle.positionProperty.get().distance(position)) {
        closestParticle = particle;
      }
    });
    const closestParticleValue = closestParticle;
    if (closestParticleValue !== null) {
      // The particle is removed by setting 'userControlled' to true.  This relies on the listener that was added when
      // the particle was placed into the bucket.
      closestParticleValue.userControlledProperty.set(true);
    }
    return closestParticle;
  }

  /**
   * get the list of particles currently contained within this bucket
   */
  getParticleList() {
    return this._particles;
  }
  reset() {
    this._particles.forEach(particle => {
      // Remove listeners that are watching for removal from bucket.
      if (typeof particle.bucketRemovalListener === 'function') {
        particle.userControlledProperty.unlink(particle.bucketRemovalListener);
        delete particle.bucketRemovalListener;
      }
    });
    cleanArray(this._particles);
  }

  /**
   * check if the provided position is open, i.e. unoccupied by a particle
   */
  isPositionOpen(position) {
    let positionOpen = true;
    for (let i = 0; i < this._particles.length; i++) {
      const particle = this._particles[i];
      if (particle.destinationProperty.get().equals(position)) {
        positionOpen = false;
        break;
      }
    }
    return positionOpen;
  }

  /**
   * Find the first open position in the stacking order, which is a triangular stack starting from the lower left.
   */
  getFirstOpenPosition() {
    let openPosition = Vector2.ZERO;
    const usableWidth = this.size.width * this._usableWidthProportion - 2 * this._sphereRadius;
    let offsetFromBucketEdge = (this.size.width - usableWidth) / 2 + this._sphereRadius;
    let numParticlesInLayer = Math.floor(usableWidth / (this._sphereRadius * 2));
    let row = 0;
    let positionInLayer = 0;
    let found = false;
    while (!found) {
      const testPosition = new Vector2(this.position.x - this.size.width / 2 + offsetFromBucketEdge + positionInLayer * 2 * this._sphereRadius, this.getYPositionForLayer(row));
      if (this.isPositionOpen(testPosition)) {
        // We found a position that is open.
        openPosition = testPosition;
        found = true;
      } else {
        positionInLayer++;
        if (positionInLayer >= numParticlesInLayer) {
          // Move to the next layer.
          row++;
          positionInLayer = 0;
          numParticlesInLayer--;
          offsetFromBucketEdge += this._sphereRadius;
          if (numParticlesInLayer === 0) {
            // This algorithm doesn't handle the situation where
            // more particles are added than can be stacked into
            // a pyramid of the needed size, but so far it hasn't
            // needed to.  If this requirement changes, the
            // algorithm will need to change too.
            numParticlesInLayer = 1;
            offsetFromBucketEdge -= this._sphereRadius;
          }
        }
      }
    }
    return openPosition;
  }

  /**
   * get the layer in the stacking order for the provided y (vertical) position
   */
  getLayerForYPosition(yPosition) {
    return Math.abs(Utils.roundSymmetric((yPosition - (this.position.y + this._verticalParticleOffset)) / (this._sphereRadius * 2 * 0.866)));
  }

  /**
   * Get the nearest open position in the stacking order that would be supported if the particle were to be placed
   * there.  This is used for particle stacking.
   */
  getNearestOpenPosition(position) {
    // Determine the highest occupied layer.  The bottom layer is 0.
    let highestOccupiedLayer = 0;
    _.each(this._particles, particle => {
      const layer = this.getLayerForYPosition(particle.destinationProperty.get().y);
      if (layer > highestOccupiedLayer) {
        highestOccupiedLayer = layer;
      }
    });

    // Make a list of all open positions in the occupied layers.
    const openPositions = [];
    const usableWidth = this.size.width * this._usableWidthProportion - 2 * this._sphereRadius;
    let offsetFromBucketEdge = (this.size.width - usableWidth) / 2 + this._sphereRadius;
    let numParticlesInLayer = Math.floor(usableWidth / (this._sphereRadius * 2));

    // Loop, searching for open positions in the particle stack.
    for (let layer = 0; layer <= highestOccupiedLayer + 1; layer++) {
      // Add all open positions in the current layer.
      for (let positionInLayer = 0; positionInLayer < numParticlesInLayer; positionInLayer++) {
        const testPosition = new Vector2(this.position.x - this.size.width / 2 + offsetFromBucketEdge + positionInLayer * 2 * this._sphereRadius, this.getYPositionForLayer(layer));
        if (this.isPositionOpen(testPosition)) {
          // We found a position that is unoccupied.
          if (layer === 0 || this.countSupportingParticles(testPosition) === 2) {
            // This is a valid open position.
            openPositions.push(testPosition);
          }
        }
      }

      // Adjust variables for the next layer.
      numParticlesInLayer--;
      offsetFromBucketEdge += this._sphereRadius;
      if (numParticlesInLayer === 0) {
        // If the stacking pyramid is full, meaning that there are no positions that are open within it, this algorithm
        // classifies the positions directly above the top of the pyramid as being open.  This would result in a stack
        // of particles with a pyramid base.  So far, this hasn't been a problem, but this limitation may limit
        // reusability of this algorithm.
        numParticlesInLayer = 1;
        offsetFromBucketEdge -= this._sphereRadius;
      }
    }

    // Find the closest open position to the provided current position.
    // Only the X-component is used for this determination, because if
    // the Y-component is used the particles often appear to fall sideways
    // when released above the bucket, which just looks weird.
    let closestOpenPosition = openPositions[0] || Vector2.ZERO;
    _.each(openPositions, openPosition => {
      if (openPosition.distance(position) < closestOpenPosition.distance(position)) {
        // This openPosition is closer.
        closestOpenPosition = openPosition;
      }
    });
    return closestOpenPosition;
  }

  /**
   * given a layer in the stack, calculate the corresponding Y position for a particle in that layer
   */
  getYPositionForLayer(layer) {
    return this.position.y + this._verticalParticleOffset + layer * this._sphereRadius * 2 * 0.866;
  }

  /**
   * Determine whether a particle is 'dangling', i.e. hanging above an open space in the stack of particles.  Dangling
   * particles should be made to fall to a stable position.
   */
  isDangling(particle) {
    const onBottomRow = particle.destinationProperty.get().y === this.position.y + this._verticalParticleOffset;
    return !onBottomRow && this.countSupportingParticles(particle.destinationProperty.get()) < 2;
  }

  /**
   * count the number of particles that are positioned to support a particle in the provided position
   * @returns - a number from 0 to 2, inclusive
   */
  countSupportingParticles(position) {
    let count = 0;
    for (let i = 0; i < this._particles.length; i++) {
      const p = this._particles[i];
      if (p.destinationProperty.get().y < position.y &&
      // Must be in a lower layer
      p.destinationProperty.get().distance(position) < this._sphereRadius * 3) {
        // Must be a supporting particle.
        count++;
      }
    }
    return count;
  }

  /**
   * Relayout the particles, generally done after a particle is removed and some other need to fall.
   */
  relayoutBucketParticles() {
    let particleMoved;
    do {
      for (let i = 0; i < this._particles.length; i++) {
        particleMoved = false;
        const particle = this._particles[i];
        if (this.isDangling(particle)) {
          particle.destinationProperty.set(this.getNearestOpenPosition(particle.destinationProperty.get()));
          particleMoved = true;
          break;
        }
      }
    } while (particleMoved);
  }
  static SphereBucketIO = new IOType('SphereBucketIO', {
    valueType: SphereBucket,
    documentation: 'A model of a bucket into which spherical objects can be placed.',
    stateSchema: {
      particles: ReferenceObjectArrayIO
    },
    toStateObject: sphereBucket => {
      return {
        particles: ReferenceObjectArrayIO.toStateObject(sphereBucket._particles)
      };
    },
    applyState: (sphereBucket, stateObject) => {
      // remove all the particles from the observable arrays
      sphereBucket.reset();
      const particles = ReferenceObjectArrayIO.fromStateObject(stateObject.particles);

      // add back the particles
      particles.forEach(particle => {
        sphereBucket.addParticle(particle);
      });
    }
  });
}
phetcommon.register('SphereBucket', SphereBucket);
export default SphereBucket;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJVdGlscyIsIlZlY3RvcjIiLCJjbGVhbkFycmF5IiwiVGFuZGVtIiwiQXJyYXlJTyIsIklPVHlwZSIsIlJlZmVyZW5jZUlPIiwicGhldGNvbW1vbiIsIkJ1Y2tldCIsIm9wdGlvbml6ZSIsIlJlZmVyZW5jZU9iamVjdEFycmF5SU8iLCJPYmplY3RJTyIsIlNwaGVyZUJ1Y2tldCIsIl9wYXJ0aWNsZXMiLCJjb25zdHJ1Y3RvciIsInByb3ZpZGVkT3B0aW9ucyIsIm9wdGlvbnMiLCJzcGhlcmVSYWRpdXMiLCJ1c2FibGVXaWR0aFByb3BvcnRpb24iLCJ0YW5kZW0iLCJPUFRJT05BTCIsInBoZXRpb1R5cGUiLCJTcGhlcmVCdWNrZXRJTyIsInZlcnRpY2FsUGFydGljbGVPZmZzZXQiLCJzcGhlcmVCdWNrZXRUYW5kZW0iLCJfc3BoZXJlUmFkaXVzIiwiX3VzYWJsZVdpZHRoUHJvcG9ydGlvbiIsIl92ZXJ0aWNhbFBhcnRpY2xlT2Zmc2V0IiwiYWRkUGFydGljbGVGaXJzdE9wZW4iLCJwYXJ0aWNsZSIsImFuaW1hdGUiLCJkZXN0aW5hdGlvblByb3BlcnR5Iiwic2V0IiwiZ2V0Rmlyc3RPcGVuUG9zaXRpb24iLCJhZGRQYXJ0aWNsZSIsImFkZFBhcnRpY2xlTmVhcmVzdE9wZW4iLCJnZXROZWFyZXN0T3BlblBvc2l0aW9uIiwiZ2V0IiwicG9zaXRpb25Qcm9wZXJ0eSIsInB1c2giLCJwYXJ0aWNsZVJlbW92ZWRMaXN0ZW5lciIsInVzZXJDb250cm9sbGVkIiwicmVtb3ZlUGFydGljbGUiLCJhc3NlcnQiLCJidWNrZXRSZW1vdmFsTGlzdGVuZXIiLCJ1c2VyQ29udHJvbGxlZFByb3BlcnR5IiwibGF6eUxpbmsiLCJza2lwTGF5b3V0IiwiY29udGFpbnNQYXJ0aWNsZSIsIl8iLCJ3aXRob3V0IiwidW5saW5rIiwicmVsYXlvdXRCdWNrZXRQYXJ0aWNsZXMiLCJpbmNsdWRlcyIsImV4dHJhY3RDbG9zZXN0UGFydGljbGUiLCJwb3NpdGlvbiIsImNsb3Nlc3RQYXJ0aWNsZSIsImZvckVhY2giLCJkaXN0YW5jZSIsImNsb3Nlc3RQYXJ0aWNsZVZhbHVlIiwiZ2V0UGFydGljbGVMaXN0IiwicmVzZXQiLCJpc1Bvc2l0aW9uT3BlbiIsInBvc2l0aW9uT3BlbiIsImkiLCJsZW5ndGgiLCJlcXVhbHMiLCJvcGVuUG9zaXRpb24iLCJaRVJPIiwidXNhYmxlV2lkdGgiLCJzaXplIiwid2lkdGgiLCJvZmZzZXRGcm9tQnVja2V0RWRnZSIsIm51bVBhcnRpY2xlc0luTGF5ZXIiLCJNYXRoIiwiZmxvb3IiLCJyb3ciLCJwb3NpdGlvbkluTGF5ZXIiLCJmb3VuZCIsInRlc3RQb3NpdGlvbiIsIngiLCJnZXRZUG9zaXRpb25Gb3JMYXllciIsImdldExheWVyRm9yWVBvc2l0aW9uIiwieVBvc2l0aW9uIiwiYWJzIiwicm91bmRTeW1tZXRyaWMiLCJ5IiwiaGlnaGVzdE9jY3VwaWVkTGF5ZXIiLCJlYWNoIiwibGF5ZXIiLCJvcGVuUG9zaXRpb25zIiwiY291bnRTdXBwb3J0aW5nUGFydGljbGVzIiwiY2xvc2VzdE9wZW5Qb3NpdGlvbiIsImlzRGFuZ2xpbmciLCJvbkJvdHRvbVJvdyIsImNvdW50IiwicCIsInBhcnRpY2xlTW92ZWQiLCJ2YWx1ZVR5cGUiLCJkb2N1bWVudGF0aW9uIiwic3RhdGVTY2hlbWEiLCJwYXJ0aWNsZXMiLCJ0b1N0YXRlT2JqZWN0Iiwic3BoZXJlQnVja2V0IiwiYXBwbHlTdGF0ZSIsInN0YXRlT2JqZWN0IiwiZnJvbVN0YXRlT2JqZWN0IiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJTcGhlcmVCdWNrZXQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogU3BoZXJlQnVja2V0IGlzIGEgbW9kZWwgb2YgYSBidWNrZXQgdGhhdCBjYW4gYmUgdXNlZCB0byBzdG9yZSBzcGhlcmljYWwgb2JqZWN0cy4gIEl0IG1hbmFnZXMgdGhlIGFkZGl0aW9uIGFuZCByZW1vdmFsXHJcbiAqIG9mIHRoZSBzcGhlcmVzLCBzdGFja3MgdGhlbSBhcyB0aGV5IGFyZSBhZGRlZCwgYW5kIG1hbmFnZXMgdGhlIHN0YWNrIGFzIHNwaGVyZXMgYXJlIHJlbW92ZWQuXHJcbiAqXHJcbiAqIFRoaXMgZXhwZWN0cyB0aGUgc3BoZXJlcyB0byBoYXZlIGNlcnRhaW4gcHJvcGVydGllcywgcGxlYXNlIGluc3BlY3QgdGhlIGNvZGUgdG8gdW5kZXJzdGFuZCB0aGUgJ2NvbnRyYWN0JyBiZXR3ZWVuIHRoZVxyXG4gKiBidWNrZXQgYW5kIHRoZSBzcGhlcmVzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvaG4gQmxhbmNvXHJcbiAqL1xyXG5cclxuaW1wb3J0IFV0aWxzIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9VdGlscy5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IGNsZWFuQXJyYXkgZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL2NsZWFuQXJyYXkuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgQXJyYXlJTyBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvdHlwZXMvQXJyYXlJTy5qcyc7XHJcbmltcG9ydCBJT1R5cGUgZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL3R5cGVzL0lPVHlwZS5qcyc7XHJcbmltcG9ydCBSZWZlcmVuY2VJTyBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvdHlwZXMvUmVmZXJlbmNlSU8uanMnO1xyXG5pbXBvcnQgcGhldGNvbW1vbiBmcm9tICcuLi9waGV0Y29tbW9uLmpzJztcclxuaW1wb3J0IEJ1Y2tldCwgeyBCdWNrZXRPcHRpb25zIH0gZnJvbSAnLi9CdWNrZXQuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplIGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgVFByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvVFByb3BlcnR5LmpzJztcclxuXHJcbnR5cGUgU3BoZXJpY2FsID0ge1xyXG4gIHVzZXJDb250cm9sbGVkUHJvcGVydHk6IFRQcm9wZXJ0eTxib29sZWFuPjtcclxuICBwb3NpdGlvblByb3BlcnR5OiBUUHJvcGVydHk8VmVjdG9yMj47XHJcbiAgZGVzdGluYXRpb25Qcm9wZXJ0eTogVFByb3BlcnR5PFZlY3RvcjI+O1xyXG59O1xyXG5cclxudHlwZSBQYXJ0aWNsZVdpdGhCdWNrZXRSZW1vdmFsTGlzdGVuZXI8UGFydGljbGUgZXh0ZW5kcyBTcGhlcmljYWw+ID0gUGFydGljbGUgJlxyXG4gIHsgYnVja2V0UmVtb3ZhbExpc3RlbmVyPzogKCB1c2VyQ29udHJvbGxlZDogYm9vbGVhbiApID0+IHZvaWQgfTtcclxuXHJcbmNvbnN0IFJlZmVyZW5jZU9iamVjdEFycmF5SU8gPSBBcnJheUlPKCBSZWZlcmVuY2VJTyggSU9UeXBlLk9iamVjdElPICkgKTtcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcbiAgc3BoZXJlUmFkaXVzPzogbnVtYmVyO1xyXG4gIHVzYWJsZVdpZHRoUHJvcG9ydGlvbj86IG51bWJlcjtcclxuICB2ZXJ0aWNhbFBhcnRpY2xlT2Zmc2V0PzogbnVtYmVyIHwgbnVsbDtcclxufTtcclxudHlwZSBTcGhlcmVCdWNrZXRPcHRpb25zID0gU2VsZk9wdGlvbnMgJiBCdWNrZXRPcHRpb25zO1xyXG5cclxuY2xhc3MgU3BoZXJlQnVja2V0PFBhcnRpY2xlIGV4dGVuZHMgU3BoZXJpY2FsPiBleHRlbmRzIEJ1Y2tldCB7XHJcblxyXG4gIHB1YmxpYyByZWFkb25seSBzcGhlcmVCdWNrZXRUYW5kZW06IFRhbmRlbTtcclxuICBwcml2YXRlIHJlYWRvbmx5IF9zcGhlcmVSYWRpdXM6IG51bWJlcjtcclxuICBwcml2YXRlIHJlYWRvbmx5IF91c2FibGVXaWR0aFByb3BvcnRpb246IG51bWJlcjtcclxuXHJcbiAgLy8gZW1waXJpY2FsbHkgZGV0ZXJtaW5lZCwgZm9yIHBvc2l0aW9uaW5nIHBhcnRpY2xlcyBpbnNpZGUgdGhlIGJ1Y2tldFxyXG4gIHByaXZhdGUgcmVhZG9ubHkgX3ZlcnRpY2FsUGFydGljbGVPZmZzZXQ6IG51bWJlcjtcclxuXHJcbiAgLy8gcGFydGljbGVzIG1hbmFnZWQgYnkgdGhpcyBidWNrZXRcclxuICBwcml2YXRlIF9wYXJ0aWNsZXM6IFBhcnRpY2xlV2l0aEJ1Y2tldFJlbW92YWxMaXN0ZW5lcjxQYXJ0aWNsZT5bXSA9IFtdO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHByb3ZpZGVkT3B0aW9ucz86IFNwaGVyZUJ1Y2tldE9wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxTcGhlcmVCdWNrZXRPcHRpb25zLCBTZWxmT3B0aW9ucywgQnVja2V0T3B0aW9ucz4oKSgge1xyXG4gICAgICBzcGhlcmVSYWRpdXM6IDEwLCAgLy8gZXhwZWN0ZWQgcmFkaXVzIG9mIHRoZSBzcGhlcmVzIHRoYXQgd2lsbCBiZSBwbGFjZWQgaW4gdGhpcyBidWNrZXRcclxuICAgICAgdXNhYmxlV2lkdGhQcm9wb3J0aW9uOiAxLjAsICAvLyBwcm9wb3J0aW9uIG9mIHRoZSBidWNrZXQgd2lkdGggdGhhdCB0aGUgc3BoZXJlcyBjYW4gb2NjdXB5XHJcbiAgICAgIHRhbmRlbTogVGFuZGVtLk9QVElPTkFMLFxyXG4gICAgICBwaGV0aW9UeXBlOiBTcGhlcmVCdWNrZXQuU3BoZXJlQnVja2V0SU8sXHJcbiAgICAgIHZlcnRpY2FsUGFydGljbGVPZmZzZXQ6IG51bGxcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIHN1cGVyKCBvcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy5zcGhlcmVCdWNrZXRUYW5kZW0gPSBvcHRpb25zLnRhbmRlbTtcclxuICAgIHRoaXMuX3NwaGVyZVJhZGl1cyA9IG9wdGlvbnMuc3BoZXJlUmFkaXVzO1xyXG4gICAgdGhpcy5fdXNhYmxlV2lkdGhQcm9wb3J0aW9uID0gb3B0aW9ucy51c2FibGVXaWR0aFByb3BvcnRpb247XHJcblxyXG4gICAgdGhpcy5fdmVydGljYWxQYXJ0aWNsZU9mZnNldCA9IG9wdGlvbnMudmVydGljYWxQYXJ0aWNsZU9mZnNldCA9PT0gbnVsbCA/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLXRoaXMuX3NwaGVyZVJhZGl1cyAqIDAuNCA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy52ZXJ0aWNhbFBhcnRpY2xlT2Zmc2V0O1xyXG5cclxuICAgIHRoaXMuX3BhcnRpY2xlcyA9IFtdO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogYWRkIGEgcGFydGljbGUgdG8gdGhlIGZpcnN0IG9wZW4gcG9zaXRpb24gaW4gdGhlIHN0YWNraW5nIG9yZGVyXHJcbiAgICovXHJcbiAgcHVibGljIGFkZFBhcnRpY2xlRmlyc3RPcGVuKCBwYXJ0aWNsZTogUGFydGljbGUsIGFuaW1hdGU6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICBwYXJ0aWNsZS5kZXN0aW5hdGlvblByb3BlcnR5LnNldCggdGhpcy5nZXRGaXJzdE9wZW5Qb3NpdGlvbigpICk7XHJcbiAgICB0aGlzLmFkZFBhcnRpY2xlKCBwYXJ0aWNsZSwgYW5pbWF0ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogYWRkIGEgcGFydGljbGUgdG8gdGhlIG5lYXJlc3Qgb3BlbiBwb3NpdGlvbiBpbiB0aGUgcGFydGljbGUgc3RhY2tcclxuICAgKi9cclxuICBwdWJsaWMgYWRkUGFydGljbGVOZWFyZXN0T3BlbiggcGFydGljbGU6IFBhcnRpY2xlLCBhbmltYXRlOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgcGFydGljbGUuZGVzdGluYXRpb25Qcm9wZXJ0eS5zZXQoIHRoaXMuZ2V0TmVhcmVzdE9wZW5Qb3NpdGlvbiggcGFydGljbGUuZGVzdGluYXRpb25Qcm9wZXJ0eS5nZXQoKSApICk7XHJcbiAgICB0aGlzLmFkZFBhcnRpY2xlKCBwYXJ0aWNsZSwgYW5pbWF0ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkIGEgcGFydGljbGUgdG8gdGhlIGJ1Y2tldCBhbmQgc2V0IHVwIGxpc3RlbmVycyBmb3Igd2hlbiB0aGUgcGFydGljbGUgaXMgcmVtb3ZlZC5cclxuICAgKi9cclxuICBwcml2YXRlIGFkZFBhcnRpY2xlKCBwYXJ0aWNsZTogUGFydGljbGVXaXRoQnVja2V0UmVtb3ZhbExpc3RlbmVyPFBhcnRpY2xlPiwgYW5pbWF0ZTogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIGlmICggIWFuaW1hdGUgKSB7XHJcbiAgICAgIHBhcnRpY2xlLnBvc2l0aW9uUHJvcGVydHkuc2V0KCBwYXJ0aWNsZS5kZXN0aW5hdGlvblByb3BlcnR5LmdldCgpICk7XHJcbiAgICB9XHJcbiAgICB0aGlzLl9wYXJ0aWNsZXMucHVzaCggcGFydGljbGUgKTtcclxuXHJcbiAgICAvLyBBZGQgYSBsaXN0ZW5lciB0aGF0IHdpbGwgcmVtb3ZlIHRoaXMgcGFydGljbGUgZnJvbSB0aGUgYnVja2V0IGlmIHRoZSB1c2VyIGdyYWJzIGl0LlxyXG4gICAgY29uc3QgcGFydGljbGVSZW1vdmVkTGlzdGVuZXIgPSAoIHVzZXJDb250cm9sbGVkOiBib29sZWFuICkgPT4ge1xyXG5cclxuICAgICAgLy8gV2UgaGF2ZSB0byB2ZXJpZnkgdGhhdCB1c2VyQ29udHJvbGxlZCBpcyB0cmFuc2l0aW9uaW5nIHRvIHRydWUgaGVyZSBiZWNhdXNlIGluIHBoZXQtaW8gaXQgaXMgcG9zc2libGUgdG9cclxuICAgICAgLy8gcnVuIGludG8gc2l0dWF0aW9ucyB3aGVyZSB0aGUgcGFydGljbGUgaXMgYWxyZWFkeSBpbiB0aGUgYnVja2V0IGJ1dCB1c2VyQ29udHJvbGxlZCBpcyBiZWluZyBzZXQgdG8gZmFsc2UsIHNlZVxyXG4gICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYnVpbGQtYW4tYXRvbS9pc3N1ZXMvMjM5LlxyXG4gICAgICBpZiAoIHVzZXJDb250cm9sbGVkICkge1xyXG4gICAgICAgIHRoaXMucmVtb3ZlUGFydGljbGUoIHBhcnRpY2xlICk7XHJcblxyXG4gICAgICAgIC8vIFRoZSBwcm9jZXNzIG9mIHJlbW92aW5nIHRoZSBwYXJ0aWNsZSBmcm9tIHRoZSBidWNrZXQgc2hvdWxkIGFsc28gZGlzY29ubmVjdCByZW1vdmFsIGxpc3RlbmVyLlxyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoICFwYXJ0aWNsZS5idWNrZXRSZW1vdmFsTGlzdGVuZXIsICdsaXN0ZW5lciBzdGlsbCBwcmVzZW50IGFmdGVyIGJlaW5nIHJlbW92ZWQgZnJvbSBidWNrZXQnICk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgICBwYXJ0aWNsZS51c2VyQ29udHJvbGxlZFByb3BlcnR5LmxhenlMaW5rKCBwYXJ0aWNsZVJlbW92ZWRMaXN0ZW5lciApO1xyXG4gICAgcGFydGljbGUuYnVja2V0UmVtb3ZhbExpc3RlbmVyID0gcGFydGljbGVSZW1vdmVkTGlzdGVuZXI7IC8vIEF0dGFjaCB0byB0aGUgcGFydGljbGUgdG8gYWlkIHVubGlua2luZyBpbiBzb21lIGNhc2VzLlxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogcmVtb3ZlIGEgcGFydGljbGUgZnJvbSB0aGUgYnVja2V0LCB1cGRhdGluZyBsaXN0ZW5lcnMgYXMgbmVjZXNzYXJ5XHJcbiAgICovXHJcbiAgcHVibGljIHJlbW92ZVBhcnRpY2xlKCBwYXJ0aWNsZTogUGFydGljbGVXaXRoQnVja2V0UmVtb3ZhbExpc3RlbmVyPFBhcnRpY2xlPiwgc2tpcExheW91dCA9IGZhbHNlICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5jb250YWluc1BhcnRpY2xlKCBwYXJ0aWNsZSApLCAnYXR0ZW1wdCBtYWRlIHRvIHJlbW92ZSBwYXJ0aWNsZSB0aGF0IGlzIG5vdCBpbiBidWNrZXQnICk7XHJcblxyXG4gICAgLy8gcmVtb3ZlIHRoZSBwYXJ0aWNsZSBmcm9tIHRoZSBhcnJheVxyXG4gICAgdGhpcy5fcGFydGljbGVzID0gXy53aXRob3V0KCB0aGlzLl9wYXJ0aWNsZXMsIHBhcnRpY2xlICk7XHJcblxyXG4gICAgLy8gcmVtb3ZlIHRoZSByZW1vdmFsIGxpc3RlbmVyIGlmIGl0IGlzIHN0aWxsIHByZXNlbnRcclxuICAgIGlmICggcGFydGljbGUuYnVja2V0UmVtb3ZhbExpc3RlbmVyICkge1xyXG4gICAgICBwYXJ0aWNsZS51c2VyQ29udHJvbGxlZFByb3BlcnR5LnVubGluayggcGFydGljbGUuYnVja2V0UmVtb3ZhbExpc3RlbmVyICk7XHJcbiAgICAgIGRlbGV0ZSBwYXJ0aWNsZS5idWNrZXRSZW1vdmFsTGlzdGVuZXI7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcmVkbyB0aGUgbGF5b3V0IG9mIHRoZSBwYXJ0aWNsZXMgaWYgZW5hYmxlZFxyXG4gICAgaWYgKCAhc2tpcExheW91dCApIHtcclxuICAgICAgdGhpcy5yZWxheW91dEJ1Y2tldFBhcnRpY2xlcygpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIGNvbnRhaW5zUGFydGljbGUoIHBhcnRpY2xlOiBQYXJ0aWNsZSApOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLl9wYXJ0aWNsZXMuaW5jbHVkZXMoIHBhcnRpY2xlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBleHRyYWN0IHRoZSBwYXJ0aWNsZSB0aGF0IGlzIGNsb3Nlc3QgdG8gdGhlIHByb3ZpZGVkIHBvc2l0aW9uIGZyb20gdGhlIGJ1Y2tldFxyXG4gICAqL1xyXG4gIHB1YmxpYyBleHRyYWN0Q2xvc2VzdFBhcnRpY2xlKCBwb3NpdGlvbjogVmVjdG9yMiApOiBQYXJ0aWNsZSB8IG51bGwge1xyXG4gICAgbGV0IGNsb3Nlc3RQYXJ0aWNsZTogUGFydGljbGUgfCBudWxsID0gbnVsbDtcclxuICAgIHRoaXMuX3BhcnRpY2xlcy5mb3JFYWNoKCBwYXJ0aWNsZSA9PiB7XHJcbiAgICAgIGlmICggY2xvc2VzdFBhcnRpY2xlID09PSBudWxsIHx8XHJcbiAgICAgICAgICAgY2xvc2VzdFBhcnRpY2xlLnBvc2l0aW9uUHJvcGVydHkuZ2V0KCkuZGlzdGFuY2UoIHBvc2l0aW9uICkgPiBwYXJ0aWNsZS5wb3NpdGlvblByb3BlcnR5LmdldCgpLmRpc3RhbmNlKCBwb3NpdGlvbiApICkge1xyXG4gICAgICAgIGNsb3Nlc3RQYXJ0aWNsZSA9IHBhcnRpY2xlO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3QgY2xvc2VzdFBhcnRpY2xlVmFsdWUgPSBjbG9zZXN0UGFydGljbGUgYXMgUGFydGljbGUgfCBudWxsO1xyXG4gICAgaWYgKCBjbG9zZXN0UGFydGljbGVWYWx1ZSAhPT0gbnVsbCApIHtcclxuXHJcbiAgICAgIC8vIFRoZSBwYXJ0aWNsZSBpcyByZW1vdmVkIGJ5IHNldHRpbmcgJ3VzZXJDb250cm9sbGVkJyB0byB0cnVlLiAgVGhpcyByZWxpZXMgb24gdGhlIGxpc3RlbmVyIHRoYXQgd2FzIGFkZGVkIHdoZW5cclxuICAgICAgLy8gdGhlIHBhcnRpY2xlIHdhcyBwbGFjZWQgaW50byB0aGUgYnVja2V0LlxyXG4gICAgICBjbG9zZXN0UGFydGljbGVWYWx1ZS51c2VyQ29udHJvbGxlZFByb3BlcnR5LnNldCggdHJ1ZSApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNsb3Nlc3RQYXJ0aWNsZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIGdldCB0aGUgbGlzdCBvZiBwYXJ0aWNsZXMgY3VycmVudGx5IGNvbnRhaW5lZCB3aXRoaW4gdGhpcyBidWNrZXRcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0UGFydGljbGVMaXN0KCk6IFBhcnRpY2xlW10geyByZXR1cm4gdGhpcy5fcGFydGljbGVzOyB9XHJcblxyXG4gIHB1YmxpYyByZXNldCgpOiB2b2lkIHtcclxuICAgIHRoaXMuX3BhcnRpY2xlcy5mb3JFYWNoKCBwYXJ0aWNsZSA9PiB7XHJcblxyXG4gICAgICAvLyBSZW1vdmUgbGlzdGVuZXJzIHRoYXQgYXJlIHdhdGNoaW5nIGZvciByZW1vdmFsIGZyb20gYnVja2V0LlxyXG4gICAgICBpZiAoIHR5cGVvZiAoIHBhcnRpY2xlLmJ1Y2tldFJlbW92YWxMaXN0ZW5lciApID09PSAnZnVuY3Rpb24nICkge1xyXG4gICAgICAgIHBhcnRpY2xlLnVzZXJDb250cm9sbGVkUHJvcGVydHkudW5saW5rKCBwYXJ0aWNsZS5idWNrZXRSZW1vdmFsTGlzdGVuZXIgKTtcclxuICAgICAgICBkZWxldGUgcGFydGljbGUuYnVja2V0UmVtb3ZhbExpc3RlbmVyO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgICBjbGVhbkFycmF5KCB0aGlzLl9wYXJ0aWNsZXMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIGNoZWNrIGlmIHRoZSBwcm92aWRlZCBwb3NpdGlvbiBpcyBvcGVuLCBpLmUuIHVub2NjdXBpZWQgYnkgYSBwYXJ0aWNsZVxyXG4gICAqL1xyXG4gIHByaXZhdGUgaXNQb3NpdGlvbk9wZW4oIHBvc2l0aW9uOiBWZWN0b3IyICk6IGJvb2xlYW4ge1xyXG4gICAgbGV0IHBvc2l0aW9uT3BlbiA9IHRydWU7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLl9wYXJ0aWNsZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IHBhcnRpY2xlID0gdGhpcy5fcGFydGljbGVzWyBpIF07XHJcbiAgICAgIGlmICggcGFydGljbGUuZGVzdGluYXRpb25Qcm9wZXJ0eS5nZXQoKS5lcXVhbHMoIHBvc2l0aW9uICkgKSB7XHJcbiAgICAgICAgcG9zaXRpb25PcGVuID0gZmFsc2U7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBwb3NpdGlvbk9wZW47XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGaW5kIHRoZSBmaXJzdCBvcGVuIHBvc2l0aW9uIGluIHRoZSBzdGFja2luZyBvcmRlciwgd2hpY2ggaXMgYSB0cmlhbmd1bGFyIHN0YWNrIHN0YXJ0aW5nIGZyb20gdGhlIGxvd2VyIGxlZnQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRGaXJzdE9wZW5Qb3NpdGlvbigpOiBWZWN0b3IyIHtcclxuICAgIGxldCBvcGVuUG9zaXRpb24gPSBWZWN0b3IyLlpFUk87XHJcbiAgICBjb25zdCB1c2FibGVXaWR0aCA9IHRoaXMuc2l6ZS53aWR0aCAqIHRoaXMuX3VzYWJsZVdpZHRoUHJvcG9ydGlvbiAtIDIgKiB0aGlzLl9zcGhlcmVSYWRpdXM7XHJcbiAgICBsZXQgb2Zmc2V0RnJvbUJ1Y2tldEVkZ2UgPSAoIHRoaXMuc2l6ZS53aWR0aCAtIHVzYWJsZVdpZHRoICkgLyAyICsgdGhpcy5fc3BoZXJlUmFkaXVzO1xyXG4gICAgbGV0IG51bVBhcnRpY2xlc0luTGF5ZXIgPSBNYXRoLmZsb29yKCB1c2FibGVXaWR0aCAvICggdGhpcy5fc3BoZXJlUmFkaXVzICogMiApICk7XHJcbiAgICBsZXQgcm93ID0gMDtcclxuICAgIGxldCBwb3NpdGlvbkluTGF5ZXIgPSAwO1xyXG4gICAgbGV0IGZvdW5kID0gZmFsc2U7XHJcbiAgICB3aGlsZSAoICFmb3VuZCApIHtcclxuICAgICAgY29uc3QgdGVzdFBvc2l0aW9uID0gbmV3IFZlY3RvcjIoXHJcbiAgICAgICAgdGhpcy5wb3NpdGlvbi54IC0gdGhpcy5zaXplLndpZHRoIC8gMiArIG9mZnNldEZyb21CdWNrZXRFZGdlICsgcG9zaXRpb25JbkxheWVyICogMiAqIHRoaXMuX3NwaGVyZVJhZGl1cyxcclxuICAgICAgICB0aGlzLmdldFlQb3NpdGlvbkZvckxheWVyKCByb3cgKVxyXG4gICAgICApO1xyXG4gICAgICBpZiAoIHRoaXMuaXNQb3NpdGlvbk9wZW4oIHRlc3RQb3NpdGlvbiApICkge1xyXG5cclxuICAgICAgICAvLyBXZSBmb3VuZCBhIHBvc2l0aW9uIHRoYXQgaXMgb3Blbi5cclxuICAgICAgICBvcGVuUG9zaXRpb24gPSB0ZXN0UG9zaXRpb247XHJcbiAgICAgICAgZm91bmQgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHBvc2l0aW9uSW5MYXllcisrO1xyXG4gICAgICAgIGlmICggcG9zaXRpb25JbkxheWVyID49IG51bVBhcnRpY2xlc0luTGF5ZXIgKSB7XHJcbiAgICAgICAgICAvLyBNb3ZlIHRvIHRoZSBuZXh0IGxheWVyLlxyXG4gICAgICAgICAgcm93Kys7XHJcbiAgICAgICAgICBwb3NpdGlvbkluTGF5ZXIgPSAwO1xyXG4gICAgICAgICAgbnVtUGFydGljbGVzSW5MYXllci0tO1xyXG4gICAgICAgICAgb2Zmc2V0RnJvbUJ1Y2tldEVkZ2UgKz0gdGhpcy5fc3BoZXJlUmFkaXVzO1xyXG4gICAgICAgICAgaWYgKCBudW1QYXJ0aWNsZXNJbkxheWVyID09PSAwICkge1xyXG4gICAgICAgICAgICAvLyBUaGlzIGFsZ29yaXRobSBkb2Vzbid0IGhhbmRsZSB0aGUgc2l0dWF0aW9uIHdoZXJlXHJcbiAgICAgICAgICAgIC8vIG1vcmUgcGFydGljbGVzIGFyZSBhZGRlZCB0aGFuIGNhbiBiZSBzdGFja2VkIGludG9cclxuICAgICAgICAgICAgLy8gYSBweXJhbWlkIG9mIHRoZSBuZWVkZWQgc2l6ZSwgYnV0IHNvIGZhciBpdCBoYXNuJ3RcclxuICAgICAgICAgICAgLy8gbmVlZGVkIHRvLiAgSWYgdGhpcyByZXF1aXJlbWVudCBjaGFuZ2VzLCB0aGVcclxuICAgICAgICAgICAgLy8gYWxnb3JpdGhtIHdpbGwgbmVlZCB0byBjaGFuZ2UgdG9vLlxyXG4gICAgICAgICAgICBudW1QYXJ0aWNsZXNJbkxheWVyID0gMTtcclxuICAgICAgICAgICAgb2Zmc2V0RnJvbUJ1Y2tldEVkZ2UgLT0gdGhpcy5fc3BoZXJlUmFkaXVzO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9wZW5Qb3NpdGlvbjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIGdldCB0aGUgbGF5ZXIgaW4gdGhlIHN0YWNraW5nIG9yZGVyIGZvciB0aGUgcHJvdmlkZWQgeSAodmVydGljYWwpIHBvc2l0aW9uXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRMYXllckZvcllQb3NpdGlvbiggeVBvc2l0aW9uOiBudW1iZXIgKTogbnVtYmVyIHtcclxuICAgIHJldHVybiBNYXRoLmFicyggVXRpbHMucm91bmRTeW1tZXRyaWMoICggeVBvc2l0aW9uIC0gKCB0aGlzLnBvc2l0aW9uLnkgKyB0aGlzLl92ZXJ0aWNhbFBhcnRpY2xlT2Zmc2V0ICkgKSAvICggdGhpcy5fc3BoZXJlUmFkaXVzICogMiAqIDAuODY2ICkgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBuZWFyZXN0IG9wZW4gcG9zaXRpb24gaW4gdGhlIHN0YWNraW5nIG9yZGVyIHRoYXQgd291bGQgYmUgc3VwcG9ydGVkIGlmIHRoZSBwYXJ0aWNsZSB3ZXJlIHRvIGJlIHBsYWNlZFxyXG4gICAqIHRoZXJlLiAgVGhpcyBpcyB1c2VkIGZvciBwYXJ0aWNsZSBzdGFja2luZy5cclxuICAgKi9cclxuICBwcml2YXRlIGdldE5lYXJlc3RPcGVuUG9zaXRpb24oIHBvc2l0aW9uOiBWZWN0b3IyICk6IFZlY3RvcjIge1xyXG5cclxuICAgIC8vIERldGVybWluZSB0aGUgaGlnaGVzdCBvY2N1cGllZCBsYXllci4gIFRoZSBib3R0b20gbGF5ZXIgaXMgMC5cclxuICAgIGxldCBoaWdoZXN0T2NjdXBpZWRMYXllciA9IDA7XHJcbiAgICBfLmVhY2goIHRoaXMuX3BhcnRpY2xlcywgcGFydGljbGUgPT4ge1xyXG4gICAgICBjb25zdCBsYXllciA9IHRoaXMuZ2V0TGF5ZXJGb3JZUG9zaXRpb24oIHBhcnRpY2xlLmRlc3RpbmF0aW9uUHJvcGVydHkuZ2V0KCkueSApO1xyXG4gICAgICBpZiAoIGxheWVyID4gaGlnaGVzdE9jY3VwaWVkTGF5ZXIgKSB7XHJcbiAgICAgICAgaGlnaGVzdE9jY3VwaWVkTGF5ZXIgPSBsYXllcjtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIE1ha2UgYSBsaXN0IG9mIGFsbCBvcGVuIHBvc2l0aW9ucyBpbiB0aGUgb2NjdXBpZWQgbGF5ZXJzLlxyXG4gICAgY29uc3Qgb3BlblBvc2l0aW9ucyA9IFtdO1xyXG4gICAgY29uc3QgdXNhYmxlV2lkdGggPSB0aGlzLnNpemUud2lkdGggKiB0aGlzLl91c2FibGVXaWR0aFByb3BvcnRpb24gLSAyICogdGhpcy5fc3BoZXJlUmFkaXVzO1xyXG4gICAgbGV0IG9mZnNldEZyb21CdWNrZXRFZGdlID0gKCB0aGlzLnNpemUud2lkdGggLSB1c2FibGVXaWR0aCApIC8gMiArIHRoaXMuX3NwaGVyZVJhZGl1cztcclxuICAgIGxldCBudW1QYXJ0aWNsZXNJbkxheWVyID0gTWF0aC5mbG9vciggdXNhYmxlV2lkdGggLyAoIHRoaXMuX3NwaGVyZVJhZGl1cyAqIDIgKSApO1xyXG5cclxuICAgIC8vIExvb3AsIHNlYXJjaGluZyBmb3Igb3BlbiBwb3NpdGlvbnMgaW4gdGhlIHBhcnRpY2xlIHN0YWNrLlxyXG4gICAgZm9yICggbGV0IGxheWVyID0gMDsgbGF5ZXIgPD0gaGlnaGVzdE9jY3VwaWVkTGF5ZXIgKyAxOyBsYXllcisrICkge1xyXG5cclxuICAgICAgLy8gQWRkIGFsbCBvcGVuIHBvc2l0aW9ucyBpbiB0aGUgY3VycmVudCBsYXllci5cclxuICAgICAgZm9yICggbGV0IHBvc2l0aW9uSW5MYXllciA9IDA7IHBvc2l0aW9uSW5MYXllciA8IG51bVBhcnRpY2xlc0luTGF5ZXI7IHBvc2l0aW9uSW5MYXllcisrICkge1xyXG4gICAgICAgIGNvbnN0IHRlc3RQb3NpdGlvbiA9IG5ldyBWZWN0b3IyKCB0aGlzLnBvc2l0aW9uLnggLSB0aGlzLnNpemUud2lkdGggLyAyICsgb2Zmc2V0RnJvbUJ1Y2tldEVkZ2UgKyBwb3NpdGlvbkluTGF5ZXIgKiAyICogdGhpcy5fc3BoZXJlUmFkaXVzLFxyXG4gICAgICAgICAgdGhpcy5nZXRZUG9zaXRpb25Gb3JMYXllciggbGF5ZXIgKSApO1xyXG4gICAgICAgIGlmICggdGhpcy5pc1Bvc2l0aW9uT3BlbiggdGVzdFBvc2l0aW9uICkgKSB7XHJcblxyXG4gICAgICAgICAgLy8gV2UgZm91bmQgYSBwb3NpdGlvbiB0aGF0IGlzIHVub2NjdXBpZWQuXHJcbiAgICAgICAgICBpZiAoIGxheWVyID09PSAwIHx8IHRoaXMuY291bnRTdXBwb3J0aW5nUGFydGljbGVzKCB0ZXN0UG9zaXRpb24gKSA9PT0gMiApIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYSB2YWxpZCBvcGVuIHBvc2l0aW9uLlxyXG4gICAgICAgICAgICBvcGVuUG9zaXRpb25zLnB1c2goIHRlc3RQb3NpdGlvbiApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQWRqdXN0IHZhcmlhYmxlcyBmb3IgdGhlIG5leHQgbGF5ZXIuXHJcbiAgICAgIG51bVBhcnRpY2xlc0luTGF5ZXItLTtcclxuICAgICAgb2Zmc2V0RnJvbUJ1Y2tldEVkZ2UgKz0gdGhpcy5fc3BoZXJlUmFkaXVzO1xyXG4gICAgICBpZiAoIG51bVBhcnRpY2xlc0luTGF5ZXIgPT09IDAgKSB7XHJcblxyXG4gICAgICAgIC8vIElmIHRoZSBzdGFja2luZyBweXJhbWlkIGlzIGZ1bGwsIG1lYW5pbmcgdGhhdCB0aGVyZSBhcmUgbm8gcG9zaXRpb25zIHRoYXQgYXJlIG9wZW4gd2l0aGluIGl0LCB0aGlzIGFsZ29yaXRobVxyXG4gICAgICAgIC8vIGNsYXNzaWZpZXMgdGhlIHBvc2l0aW9ucyBkaXJlY3RseSBhYm92ZSB0aGUgdG9wIG9mIHRoZSBweXJhbWlkIGFzIGJlaW5nIG9wZW4uICBUaGlzIHdvdWxkIHJlc3VsdCBpbiBhIHN0YWNrXHJcbiAgICAgICAgLy8gb2YgcGFydGljbGVzIHdpdGggYSBweXJhbWlkIGJhc2UuICBTbyBmYXIsIHRoaXMgaGFzbid0IGJlZW4gYSBwcm9ibGVtLCBidXQgdGhpcyBsaW1pdGF0aW9uIG1heSBsaW1pdFxyXG4gICAgICAgIC8vIHJldXNhYmlsaXR5IG9mIHRoaXMgYWxnb3JpdGhtLlxyXG4gICAgICAgIG51bVBhcnRpY2xlc0luTGF5ZXIgPSAxO1xyXG4gICAgICAgIG9mZnNldEZyb21CdWNrZXRFZGdlIC09IHRoaXMuX3NwaGVyZVJhZGl1cztcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEZpbmQgdGhlIGNsb3Nlc3Qgb3BlbiBwb3NpdGlvbiB0byB0aGUgcHJvdmlkZWQgY3VycmVudCBwb3NpdGlvbi5cclxuICAgIC8vIE9ubHkgdGhlIFgtY29tcG9uZW50IGlzIHVzZWQgZm9yIHRoaXMgZGV0ZXJtaW5hdGlvbiwgYmVjYXVzZSBpZlxyXG4gICAgLy8gdGhlIFktY29tcG9uZW50IGlzIHVzZWQgdGhlIHBhcnRpY2xlcyBvZnRlbiBhcHBlYXIgdG8gZmFsbCBzaWRld2F5c1xyXG4gICAgLy8gd2hlbiByZWxlYXNlZCBhYm92ZSB0aGUgYnVja2V0LCB3aGljaCBqdXN0IGxvb2tzIHdlaXJkLlxyXG4gICAgbGV0IGNsb3Nlc3RPcGVuUG9zaXRpb24gPSBvcGVuUG9zaXRpb25zWyAwIF0gfHwgVmVjdG9yMi5aRVJPO1xyXG5cclxuICAgIF8uZWFjaCggb3BlblBvc2l0aW9ucywgb3BlblBvc2l0aW9uID0+IHtcclxuICAgICAgaWYgKCBvcGVuUG9zaXRpb24uZGlzdGFuY2UoIHBvc2l0aW9uICkgPCBjbG9zZXN0T3BlblBvc2l0aW9uLmRpc3RhbmNlKCBwb3NpdGlvbiApICkge1xyXG4gICAgICAgIC8vIFRoaXMgb3BlblBvc2l0aW9uIGlzIGNsb3Nlci5cclxuICAgICAgICBjbG9zZXN0T3BlblBvc2l0aW9uID0gb3BlblBvc2l0aW9uO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgICByZXR1cm4gY2xvc2VzdE9wZW5Qb3NpdGlvbjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIGdpdmVuIGEgbGF5ZXIgaW4gdGhlIHN0YWNrLCBjYWxjdWxhdGUgdGhlIGNvcnJlc3BvbmRpbmcgWSBwb3NpdGlvbiBmb3IgYSBwYXJ0aWNsZSBpbiB0aGF0IGxheWVyXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRZUG9zaXRpb25Gb3JMYXllciggbGF5ZXI6IG51bWJlciApOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMucG9zaXRpb24ueSArIHRoaXMuX3ZlcnRpY2FsUGFydGljbGVPZmZzZXQgKyBsYXllciAqIHRoaXMuX3NwaGVyZVJhZGl1cyAqIDIgKiAwLjg2NjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERldGVybWluZSB3aGV0aGVyIGEgcGFydGljbGUgaXMgJ2RhbmdsaW5nJywgaS5lLiBoYW5naW5nIGFib3ZlIGFuIG9wZW4gc3BhY2UgaW4gdGhlIHN0YWNrIG9mIHBhcnRpY2xlcy4gIERhbmdsaW5nXHJcbiAgICogcGFydGljbGVzIHNob3VsZCBiZSBtYWRlIHRvIGZhbGwgdG8gYSBzdGFibGUgcG9zaXRpb24uXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBpc0RhbmdsaW5nKCBwYXJ0aWNsZTogUGFydGljbGUgKTogYm9vbGVhbiB7XHJcbiAgICBjb25zdCBvbkJvdHRvbVJvdyA9IHBhcnRpY2xlLmRlc3RpbmF0aW9uUHJvcGVydHkuZ2V0KCkueSA9PT0gdGhpcy5wb3NpdGlvbi55ICsgdGhpcy5fdmVydGljYWxQYXJ0aWNsZU9mZnNldDtcclxuICAgIHJldHVybiAhb25Cb3R0b21Sb3cgJiYgdGhpcy5jb3VudFN1cHBvcnRpbmdQYXJ0aWNsZXMoIHBhcnRpY2xlLmRlc3RpbmF0aW9uUHJvcGVydHkuZ2V0KCkgKSA8IDI7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBjb3VudCB0aGUgbnVtYmVyIG9mIHBhcnRpY2xlcyB0aGF0IGFyZSBwb3NpdGlvbmVkIHRvIHN1cHBvcnQgYSBwYXJ0aWNsZSBpbiB0aGUgcHJvdmlkZWQgcG9zaXRpb25cclxuICAgKiBAcmV0dXJucyAtIGEgbnVtYmVyIGZyb20gMCB0byAyLCBpbmNsdXNpdmVcclxuICAgKi9cclxuICBwcml2YXRlIGNvdW50U3VwcG9ydGluZ1BhcnRpY2xlcyggcG9zaXRpb246IFZlY3RvcjIgKTogbnVtYmVyIHtcclxuICAgIGxldCBjb3VudCA9IDA7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLl9wYXJ0aWNsZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IHAgPSB0aGlzLl9wYXJ0aWNsZXNbIGkgXTtcclxuICAgICAgaWYgKCBwLmRlc3RpbmF0aW9uUHJvcGVydHkuZ2V0KCkueSA8IHBvc2l0aW9uLnkgJiYgLy8gTXVzdCBiZSBpbiBhIGxvd2VyIGxheWVyXHJcbiAgICAgICAgICAgcC5kZXN0aW5hdGlvblByb3BlcnR5LmdldCgpLmRpc3RhbmNlKCBwb3NpdGlvbiApIDwgdGhpcy5fc3BoZXJlUmFkaXVzICogMyApIHtcclxuXHJcbiAgICAgICAgLy8gTXVzdCBiZSBhIHN1cHBvcnRpbmcgcGFydGljbGUuXHJcbiAgICAgICAgY291bnQrKztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNvdW50O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVsYXlvdXQgdGhlIHBhcnRpY2xlcywgZ2VuZXJhbGx5IGRvbmUgYWZ0ZXIgYSBwYXJ0aWNsZSBpcyByZW1vdmVkIGFuZCBzb21lIG90aGVyIG5lZWQgdG8gZmFsbC5cclxuICAgKi9cclxuICBwcml2YXRlIHJlbGF5b3V0QnVja2V0UGFydGljbGVzKCk6IHZvaWQge1xyXG4gICAgbGV0IHBhcnRpY2xlTW92ZWQ7XHJcbiAgICBkbyB7XHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMuX3BhcnRpY2xlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICBwYXJ0aWNsZU1vdmVkID0gZmFsc2U7XHJcbiAgICAgICAgY29uc3QgcGFydGljbGUgPSB0aGlzLl9wYXJ0aWNsZXNbIGkgXTtcclxuICAgICAgICBpZiAoIHRoaXMuaXNEYW5nbGluZyggcGFydGljbGUgKSApIHtcclxuICAgICAgICAgIHBhcnRpY2xlLmRlc3RpbmF0aW9uUHJvcGVydHkuc2V0KCB0aGlzLmdldE5lYXJlc3RPcGVuUG9zaXRpb24oIHBhcnRpY2xlLmRlc3RpbmF0aW9uUHJvcGVydHkuZ2V0KCkgKSApO1xyXG4gICAgICAgICAgcGFydGljbGVNb3ZlZCA9IHRydWU7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gd2hpbGUgKCBwYXJ0aWNsZU1vdmVkICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIFNwaGVyZUJ1Y2tldElPID0gbmV3IElPVHlwZSggJ1NwaGVyZUJ1Y2tldElPJywge1xyXG4gICAgdmFsdWVUeXBlOiBTcGhlcmVCdWNrZXQsXHJcbiAgICBkb2N1bWVudGF0aW9uOiAnQSBtb2RlbCBvZiBhIGJ1Y2tldCBpbnRvIHdoaWNoIHNwaGVyaWNhbCBvYmplY3RzIGNhbiBiZSBwbGFjZWQuJyxcclxuICAgIHN0YXRlU2NoZW1hOiB7XHJcbiAgICAgIHBhcnRpY2xlczogUmVmZXJlbmNlT2JqZWN0QXJyYXlJT1xyXG4gICAgfSxcclxuICAgIHRvU3RhdGVPYmplY3Q6IHNwaGVyZUJ1Y2tldCA9PiB7XHJcbiAgICAgIHJldHVybiB7IHBhcnRpY2xlczogUmVmZXJlbmNlT2JqZWN0QXJyYXlJTy50b1N0YXRlT2JqZWN0KCBzcGhlcmVCdWNrZXQuX3BhcnRpY2xlcyApIH07XHJcbiAgICB9LFxyXG4gICAgYXBwbHlTdGF0ZTogKCBzcGhlcmVCdWNrZXQsIHN0YXRlT2JqZWN0ICkgPT4ge1xyXG5cclxuICAgICAgLy8gcmVtb3ZlIGFsbCB0aGUgcGFydGljbGVzIGZyb20gdGhlIG9ic2VydmFibGUgYXJyYXlzXHJcbiAgICAgIHNwaGVyZUJ1Y2tldC5yZXNldCgpO1xyXG5cclxuICAgICAgY29uc3QgcGFydGljbGVzID0gUmVmZXJlbmNlT2JqZWN0QXJyYXlJTy5mcm9tU3RhdGVPYmplY3QoIHN0YXRlT2JqZWN0LnBhcnRpY2xlcyApO1xyXG5cclxuICAgICAgLy8gYWRkIGJhY2sgdGhlIHBhcnRpY2xlc1xyXG4gICAgICBwYXJ0aWNsZXMuZm9yRWFjaCggcGFydGljbGUgPT4geyBzcGhlcmVCdWNrZXQuYWRkUGFydGljbGUoIHBhcnRpY2xlICk7IH0gKTtcclxuICAgIH1cclxuICB9ICk7XHJcbn1cclxuXHJcbnBoZXRjb21tb24ucmVnaXN0ZXIoICdTcGhlcmVCdWNrZXQnLCBTcGhlcmVCdWNrZXQgKTtcclxuZXhwb3J0IGRlZmF1bHQgU3BoZXJlQnVja2V0OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLEtBQUssTUFBTSwwQkFBMEI7QUFDNUMsT0FBT0MsT0FBTyxNQUFNLDRCQUE0QjtBQUNoRCxPQUFPQyxVQUFVLE1BQU0scUNBQXFDO0FBQzVELE9BQU9DLE1BQU0sTUFBTSw4QkFBOEI7QUFDakQsT0FBT0MsT0FBTyxNQUFNLHFDQUFxQztBQUN6RCxPQUFPQyxNQUFNLE1BQU0sb0NBQW9DO0FBQ3ZELE9BQU9DLFdBQVcsTUFBTSx5Q0FBeUM7QUFDakUsT0FBT0MsVUFBVSxNQUFNLGtCQUFrQjtBQUN6QyxPQUFPQyxNQUFNLE1BQXlCLGFBQWE7QUFDbkQsT0FBT0MsU0FBUyxNQUFNLG9DQUFvQztBQVkxRCxNQUFNQyxzQkFBc0IsR0FBR04sT0FBTyxDQUFFRSxXQUFXLENBQUVELE1BQU0sQ0FBQ00sUUFBUyxDQUFFLENBQUM7QUFTeEUsTUFBTUMsWUFBWSxTQUFxQ0osTUFBTSxDQUFDO0VBTTVEOztFQUdBO0VBQ1FLLFVBQVUsR0FBa0QsRUFBRTtFQUUvREMsV0FBV0EsQ0FBRUMsZUFBcUMsRUFBRztJQUUxRCxNQUFNQyxPQUFPLEdBQUdQLFNBQVMsQ0FBa0QsQ0FBQyxDQUFFO01BQzVFUSxZQUFZLEVBQUUsRUFBRTtNQUFHO01BQ25CQyxxQkFBcUIsRUFBRSxHQUFHO01BQUc7TUFDN0JDLE1BQU0sRUFBRWhCLE1BQU0sQ0FBQ2lCLFFBQVE7TUFDdkJD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