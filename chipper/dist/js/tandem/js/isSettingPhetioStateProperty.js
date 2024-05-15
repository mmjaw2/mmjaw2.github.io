// Copyright 2023-2024, University of Colorado Boulder

/**
 * Property that is set to true when the PhET-iO State Engine is setting the state of a simulation.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import tandemNamespace from './tandemNamespace.js';
import TinyProperty from '../../axon/js/TinyProperty.js';
// This one is for specialized usage in the PhetioStateEngine, which changes the value. DO NOT USE in sim code.
export const writableIsSettingPhetioStateProperty = new TinyProperty(false);

// Simulations can use this one to observe the value
const isSettingPhetioStateProperty = writableIsSettingPhetioStateProperty;
tandemNamespace.register('isSettingPhetioStateProperty', isSettingPhetioStateProperty);
export default isSettingPhetioStateProperty;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ0YW5kZW1OYW1lc3BhY2UiLCJUaW55UHJvcGVydHkiLCJ3cml0YWJsZUlzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkiLCJpc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5IiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJpc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFByb3BlcnR5IHRoYXQgaXMgc2V0IHRvIHRydWUgd2hlbiB0aGUgUGhFVC1pTyBTdGF0ZSBFbmdpbmUgaXMgc2V0dGluZyB0aGUgc3RhdGUgb2YgYSBzaW11bGF0aW9uLlxyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIE1pY2hhZWwgS2F1em1hbm4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IHRhbmRlbU5hbWVzcGFjZSBmcm9tICcuL3RhbmRlbU5hbWVzcGFjZS5qcyc7XHJcbmltcG9ydCBUaW55UHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9UaW55UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcblxyXG4vLyBUaGlzIG9uZSBpcyBmb3Igc3BlY2lhbGl6ZWQgdXNhZ2UgaW4gdGhlIFBoZXRpb1N0YXRlRW5naW5lLCB3aGljaCBjaGFuZ2VzIHRoZSB2YWx1ZS4gRE8gTk9UIFVTRSBpbiBzaW0gY29kZS5cclxuZXhwb3J0IGNvbnN0IHdyaXRhYmxlSXNTZXR0aW5nUGhldGlvU3RhdGVQcm9wZXJ0eSA9IG5ldyBUaW55UHJvcGVydHkoIGZhbHNlICk7XHJcblxyXG4vLyBTaW11bGF0aW9ucyBjYW4gdXNlIHRoaXMgb25lIHRvIG9ic2VydmUgdGhlIHZhbHVlXHJcbmNvbnN0IGlzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+ID0gd3JpdGFibGVJc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5O1xyXG5cclxudGFuZGVtTmFtZXNwYWNlLnJlZ2lzdGVyKCAnaXNTZXR0aW5nUGhldGlvU3RhdGVQcm9wZXJ0eScsIGlzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGlzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsZUFBZSxNQUFNLHNCQUFzQjtBQUNsRCxPQUFPQyxZQUFZLE1BQU0sK0JBQStCO0FBR3hEO0FBQ0EsT0FBTyxNQUFNQyxvQ0FBb0MsR0FBRyxJQUFJRCxZQUFZLENBQUUsS0FBTSxDQUFDOztBQUU3RTtBQUNBLE1BQU1FLDRCQUF3RCxHQUFHRCxvQ0FBb0M7QUFFckdGLGVBQWUsQ0FBQ0ksUUFBUSxDQUFFLDhCQUE4QixFQUFFRCw0QkFBNkIsQ0FBQztBQUV4RixlQUFlQSw0QkFBNEIiLCJpZ25vcmVMaXN0IjpbXX0=