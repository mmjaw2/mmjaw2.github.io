// Copyright 2019-2024, University of Colorado Boulder

/**
 * ReferenceIO uses reference identity for toStateObject/fromStateObject
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Validation from '../../../axon/js/Validation.js';
import CouldNotYetDeserializeError from '../CouldNotYetDeserializeError.js';
import tandemNamespace from '../tandemNamespace.js';
import IOType from './IOType.js';
import StringIO from './StringIO.js';
import IOTypeCache from '../IOTypeCache.js';

// Cache each parameterized ReferenceIO so that it is only created once
const cache = new IOTypeCache();
const ReferenceIO = parameterType => {
  assert && assert(parameterType, 'ReferenceIO needs parameterType');
  const cacheKey = parameterType;
  if (!cache.has(cacheKey)) {
    assert && assert(typeof parameterType.typeName === 'string', 'type name should be a string');
    cache.set(cacheKey, new IOType(`ReferenceIO<${parameterType.typeName}>`, {
      isValidValue: value => Validation.isValueValid(value, parameterType.validator),
      documentation: 'Uses reference identity for serializing and deserializing, and validates based on its parameter PhET-iO Type.',
      parameterTypes: [parameterType],
      /**
       * Return the json that ReferenceIO is wrapping.  This can be overridden by subclasses, or types can use ReferenceIO type
       * directly to use this implementation.
       */
      toStateObject(phetioObject) {
        // NOTE: We cannot assert that phetioObject.phetioState === false here because sometimes ReferenceIO is used statically like
        // ReferenceIO( Vector2IO ).toStateObject( myVector );
        return {
          phetioID: phetioObject.tandem.phetioID
        };
      },
      stateSchema: {
        phetioID: StringIO
      },
      /**
       * Decodes the object from a state, used in PhetioStateEngine.setState.  This can be overridden by subclasses, or types can
       * use ReferenceIO type directly to use this implementation.
       * @throws CouldNotYetDeserializeError
       */
      fromStateObject(stateObject) {
        assert && assert(stateObject && typeof stateObject.phetioID === 'string', 'phetioID should be a string');
        if (phet.phetio.phetioEngine.hasPhetioObject(stateObject.phetioID)) {
          return phet.phetio.phetioEngine.getPhetioElement(stateObject.phetioID);
        } else {
          throw new CouldNotYetDeserializeError();
        }
      },
      /**
       * References should be using fromStateObject to get a copy of the PhET-iO Element.
       */
      applyState(coreObject) {
        assert && assert(false, `ReferenceIO is meant to be used as DataType serialization (see fromStateObject) for phetioID: ${coreObject.tandem.phetioID}`);
      }
    }));
  }
  return cache.get(cacheKey);
};
tandemNamespace.register('ReferenceIO', ReferenceIO);
export default ReferenceIO;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJWYWxpZGF0aW9uIiwiQ291bGROb3RZZXREZXNlcmlhbGl6ZUVycm9yIiwidGFuZGVtTmFtZXNwYWNlIiwiSU9UeXBlIiwiU3RyaW5nSU8iLCJJT1R5cGVDYWNoZSIsImNhY2hlIiwiUmVmZXJlbmNlSU8iLCJwYXJhbWV0ZXJUeXBlIiwiYXNzZXJ0IiwiY2FjaGVLZXkiLCJoYXMiLCJ0eXBlTmFtZSIsInNldCIsImlzVmFsaWRWYWx1ZSIsInZhbHVlIiwiaXNWYWx1ZVZhbGlkIiwidmFsaWRhdG9yIiwiZG9jdW1lbnRhdGlvbiIsInBhcmFtZXRlclR5cGVzIiwidG9TdGF0ZU9iamVjdCIsInBoZXRpb09iamVjdCIsInBoZXRpb0lEIiwidGFuZGVtIiwic3RhdGVTY2hlbWEiLCJmcm9tU3RhdGVPYmplY3QiLCJzdGF0ZU9iamVjdCIsInBoZXQiLCJwaGV0aW8iLCJwaGV0aW9FbmdpbmUiLCJoYXNQaGV0aW9PYmplY3QiLCJnZXRQaGV0aW9FbGVtZW50IiwiYXBwbHlTdGF0ZSIsImNvcmVPYmplY3QiLCJnZXQiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlJlZmVyZW5jZUlPLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE5LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFJlZmVyZW5jZUlPIHVzZXMgcmVmZXJlbmNlIGlkZW50aXR5IGZvciB0b1N0YXRlT2JqZWN0L2Zyb21TdGF0ZU9iamVjdFxyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIENocmlzIEtsdXNlbmRvcmYgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgVmFsaWRhdGlvbiBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1ZhbGlkYXRpb24uanMnO1xyXG5pbXBvcnQgQ291bGROb3RZZXREZXNlcmlhbGl6ZUVycm9yIGZyb20gJy4uL0NvdWxkTm90WWV0RGVzZXJpYWxpemVFcnJvci5qcyc7XHJcbmltcG9ydCB0YW5kZW1OYW1lc3BhY2UgZnJvbSAnLi4vdGFuZGVtTmFtZXNwYWNlLmpzJztcclxuaW1wb3J0IElPVHlwZSBmcm9tICcuL0lPVHlwZS5qcyc7XHJcbmltcG9ydCBTdHJpbmdJTyBmcm9tICcuL1N0cmluZ0lPLmpzJztcclxuaW1wb3J0IHsgUGhldGlvSUQgfSBmcm9tICcuLi9UYW5kZW1Db25zdGFudHMuanMnO1xyXG5pbXBvcnQgSU9UeXBlQ2FjaGUgZnJvbSAnLi4vSU9UeXBlQ2FjaGUuanMnO1xyXG5cclxuLy8gQ2FjaGUgZWFjaCBwYXJhbWV0ZXJpemVkIFJlZmVyZW5jZUlPIHNvIHRoYXQgaXQgaXMgb25seSBjcmVhdGVkIG9uY2VcclxuY29uc3QgY2FjaGUgPSBuZXcgSU9UeXBlQ2FjaGUoKTtcclxuXHJcbmV4cG9ydCB0eXBlIFJlZmVyZW5jZUlPU3RhdGUgPSB7XHJcbiAgcGhldGlvSUQ6IFBoZXRpb0lEO1xyXG59O1xyXG5cclxuY29uc3QgUmVmZXJlbmNlSU8gPSAoIHBhcmFtZXRlclR5cGU6IElPVHlwZSApOiBJT1R5cGUgPT4ge1xyXG4gIGFzc2VydCAmJiBhc3NlcnQoIHBhcmFtZXRlclR5cGUsICdSZWZlcmVuY2VJTyBuZWVkcyBwYXJhbWV0ZXJUeXBlJyApO1xyXG5cclxuICBjb25zdCBjYWNoZUtleSA9IHBhcmFtZXRlclR5cGU7XHJcblxyXG4gIGlmICggIWNhY2hlLmhhcyggY2FjaGVLZXkgKSApIHtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2YgcGFyYW1ldGVyVHlwZS50eXBlTmFtZSA9PT0gJ3N0cmluZycsICd0eXBlIG5hbWUgc2hvdWxkIGJlIGEgc3RyaW5nJyApO1xyXG4gICAgY2FjaGUuc2V0KCBjYWNoZUtleSwgbmV3IElPVHlwZSggYFJlZmVyZW5jZUlPPCR7cGFyYW1ldGVyVHlwZS50eXBlTmFtZX0+YCwge1xyXG4gICAgICBpc1ZhbGlkVmFsdWU6IHZhbHVlID0+IFZhbGlkYXRpb24uaXNWYWx1ZVZhbGlkKCB2YWx1ZSwgcGFyYW1ldGVyVHlwZS52YWxpZGF0b3IgKSxcclxuICAgICAgZG9jdW1lbnRhdGlvbjogJ1VzZXMgcmVmZXJlbmNlIGlkZW50aXR5IGZvciBzZXJpYWxpemluZyBhbmQgZGVzZXJpYWxpemluZywgYW5kIHZhbGlkYXRlcyBiYXNlZCBvbiBpdHMgcGFyYW1ldGVyIFBoRVQtaU8gVHlwZS4nLFxyXG4gICAgICBwYXJhbWV0ZXJUeXBlczogWyBwYXJhbWV0ZXJUeXBlIF0sXHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogUmV0dXJuIHRoZSBqc29uIHRoYXQgUmVmZXJlbmNlSU8gaXMgd3JhcHBpbmcuICBUaGlzIGNhbiBiZSBvdmVycmlkZGVuIGJ5IHN1YmNsYXNzZXMsIG9yIHR5cGVzIGNhbiB1c2UgUmVmZXJlbmNlSU8gdHlwZVxyXG4gICAgICAgKiBkaXJlY3RseSB0byB1c2UgdGhpcyBpbXBsZW1lbnRhdGlvbi5cclxuICAgICAgICovXHJcbiAgICAgIHRvU3RhdGVPYmplY3QoIHBoZXRpb09iamVjdCApOiBSZWZlcmVuY2VJT1N0YXRlIHtcclxuXHJcbiAgICAgICAgLy8gTk9URTogV2UgY2Fubm90IGFzc2VydCB0aGF0IHBoZXRpb09iamVjdC5waGV0aW9TdGF0ZSA9PT0gZmFsc2UgaGVyZSBiZWNhdXNlIHNvbWV0aW1lcyBSZWZlcmVuY2VJTyBpcyB1c2VkIHN0YXRpY2FsbHkgbGlrZVxyXG4gICAgICAgIC8vIFJlZmVyZW5jZUlPKCBWZWN0b3IySU8gKS50b1N0YXRlT2JqZWN0KCBteVZlY3RvciApO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBwaGV0aW9JRDogcGhldGlvT2JqZWN0LnRhbmRlbS5waGV0aW9JRFxyXG4gICAgICAgIH07XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBzdGF0ZVNjaGVtYToge1xyXG4gICAgICAgIHBoZXRpb0lEOiBTdHJpbmdJT1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIERlY29kZXMgdGhlIG9iamVjdCBmcm9tIGEgc3RhdGUsIHVzZWQgaW4gUGhldGlvU3RhdGVFbmdpbmUuc2V0U3RhdGUuICBUaGlzIGNhbiBiZSBvdmVycmlkZGVuIGJ5IHN1YmNsYXNzZXMsIG9yIHR5cGVzIGNhblxyXG4gICAgICAgKiB1c2UgUmVmZXJlbmNlSU8gdHlwZSBkaXJlY3RseSB0byB1c2UgdGhpcyBpbXBsZW1lbnRhdGlvbi5cclxuICAgICAgICogQHRocm93cyBDb3VsZE5vdFlldERlc2VyaWFsaXplRXJyb3JcclxuICAgICAgICovXHJcbiAgICAgIGZyb21TdGF0ZU9iamVjdCggc3RhdGVPYmplY3Q6IFJlZmVyZW5jZUlPU3RhdGUgKSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggc3RhdGVPYmplY3QgJiYgdHlwZW9mIHN0YXRlT2JqZWN0LnBoZXRpb0lEID09PSAnc3RyaW5nJywgJ3BoZXRpb0lEIHNob3VsZCBiZSBhIHN0cmluZycgKTtcclxuICAgICAgICBpZiAoIHBoZXQucGhldGlvLnBoZXRpb0VuZ2luZS5oYXNQaGV0aW9PYmplY3QoIHN0YXRlT2JqZWN0LnBoZXRpb0lEICkgKSB7XHJcbiAgICAgICAgICByZXR1cm4gcGhldC5waGV0aW8ucGhldGlvRW5naW5lLmdldFBoZXRpb0VsZW1lbnQoIHN0YXRlT2JqZWN0LnBoZXRpb0lEICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IENvdWxkTm90WWV0RGVzZXJpYWxpemVFcnJvcigpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBSZWZlcmVuY2VzIHNob3VsZCBiZSB1c2luZyBmcm9tU3RhdGVPYmplY3QgdG8gZ2V0IGEgY29weSBvZiB0aGUgUGhFVC1pTyBFbGVtZW50LlxyXG4gICAgICAgKi9cclxuICAgICAgYXBwbHlTdGF0ZSggY29yZU9iamVjdCApIHtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBmYWxzZSwgYFJlZmVyZW5jZUlPIGlzIG1lYW50IHRvIGJlIHVzZWQgYXMgRGF0YVR5cGUgc2VyaWFsaXphdGlvbiAoc2VlIGZyb21TdGF0ZU9iamVjdCkgZm9yIHBoZXRpb0lEOiAke2NvcmVPYmplY3QudGFuZGVtLnBoZXRpb0lEfWAgKTtcclxuICAgICAgfVxyXG4gICAgfSApICk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gY2FjaGUuZ2V0KCBjYWNoZUtleSApITtcclxufTtcclxuXHJcbnRhbmRlbU5hbWVzcGFjZS5yZWdpc3RlciggJ1JlZmVyZW5jZUlPJywgUmVmZXJlbmNlSU8gKTtcclxuZXhwb3J0IGRlZmF1bHQgUmVmZXJlbmNlSU87Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxVQUFVLE1BQU0sZ0NBQWdDO0FBQ3ZELE9BQU9DLDJCQUEyQixNQUFNLG1DQUFtQztBQUMzRSxPQUFPQyxlQUFlLE1BQU0sdUJBQXVCO0FBQ25ELE9BQU9DLE1BQU0sTUFBTSxhQUFhO0FBQ2hDLE9BQU9DLFFBQVEsTUFBTSxlQUFlO0FBRXBDLE9BQU9DLFdBQVcsTUFBTSxtQkFBbUI7O0FBRTNDO0FBQ0EsTUFBTUMsS0FBSyxHQUFHLElBQUlELFdBQVcsQ0FBQyxDQUFDO0FBTS9CLE1BQU1FLFdBQVcsR0FBS0MsYUFBcUIsSUFBYztFQUN2REMsTUFBTSxJQUFJQSxNQUFNLENBQUVELGFBQWEsRUFBRSxpQ0FBa0MsQ0FBQztFQUVwRSxNQUFNRSxRQUFRLEdBQUdGLGFBQWE7RUFFOUIsSUFBSyxDQUFDRixLQUFLLENBQUNLLEdBQUcsQ0FBRUQsUUFBUyxDQUFDLEVBQUc7SUFFNUJELE1BQU0sSUFBSUEsTUFBTSxDQUFFLE9BQU9ELGFBQWEsQ0FBQ0ksUUFBUSxLQUFLLFFBQVEsRUFBRSw4QkFBK0IsQ0FBQztJQUM5Rk4sS0FBSyxDQUFDTyxHQUFHLENBQUVILFFBQVEsRUFBRSxJQUFJUCxNQUFNLENBQUcsZUFBY0ssYUFBYSxDQUFDSSxRQUFTLEdBQUUsRUFBRTtNQUN6RUUsWUFBWSxFQUFFQyxLQUFLLElBQUlmLFVBQVUsQ0FBQ2dCLFlBQVksQ0FBRUQsS0FBSyxFQUFFUCxhQUFhLENBQUNTLFNBQVUsQ0FBQztNQUNoRkMsYUFBYSxFQUFFLCtHQUErRztNQUM5SEMsY0FBYyxFQUFFLENBQUVYLGFBQWEsQ0FBRTtNQUVqQztBQUNOO0FBQ0E7QUFDQTtNQUNNWSxhQUFhQSxDQUFFQyxZQUFZLEVBQXFCO1FBRTlDO1FBQ0E7UUFDQSxPQUFPO1VBQ0xDLFFBQVEsRUFBRUQsWUFBWSxDQUFDRSxNQUFNLENBQUNEO1FBQ2hDLENBQUM7TUFDSCxDQUFDO01BRURFLFdBQVcsRUFBRTtRQUNYRixRQUFRLEVBQUVsQjtNQUNaLENBQUM7TUFFRDtBQUNOO0FBQ0E7QUFDQTtBQUNBO01BQ01xQixlQUFlQSxDQUFFQyxXQUE2QixFQUFHO1FBQy9DakIsTUFBTSxJQUFJQSxNQUFNLENBQUVpQixXQUFXLElBQUksT0FBT0EsV0FBVyxDQUFDSixRQUFRLEtBQUssUUFBUSxFQUFFLDZCQUE4QixDQUFDO1FBQzFHLElBQUtLLElBQUksQ0FBQ0MsTUFBTSxDQUFDQyxZQUFZLENBQUNDLGVBQWUsQ0FBRUosV0FBVyxDQUFDSixRQUFTLENBQUMsRUFBRztVQUN0RSxPQUFPSyxJQUFJLENBQUNDLE1BQU0sQ0FBQ0MsWUFBWSxDQUFDRSxnQkFBZ0IsQ0FBRUwsV0FBVyxDQUFDSixRQUFTLENBQUM7UUFDMUUsQ0FBQyxNQUNJO1VBQ0gsTUFBTSxJQUFJckIsMkJBQTJCLENBQUMsQ0FBQztRQUN6QztNQUNGLENBQUM7TUFFRDtBQUNOO0FBQ0E7TUFDTStCLFVBQVVBLENBQUVDLFVBQVUsRUFBRztRQUN2QnhCLE1BQU0sSUFBSUEsTUFBTSxDQUFFLEtBQUssRUFBRyxpR0FBZ0d3QixVQUFVLENBQUNWLE1BQU0sQ0FBQ0QsUUFBUyxFQUFFLENBQUM7TUFDMUo7SUFDRixDQUFFLENBQUUsQ0FBQztFQUNQO0VBRUEsT0FBT2hCLEtBQUssQ0FBQzRCLEdBQUcsQ0FBRXhCLFFBQVMsQ0FBQztBQUM5QixDQUFDO0FBRURSLGVBQWUsQ0FBQ2lDLFFBQVEsQ0FBRSxhQUFhLEVBQUU1QixXQUFZLENBQUM7QUFDdEQsZUFBZUEsV0FBVyIsImlnbm9yZUxpc3QiOltdfQ==