// Copyright 2020-2022, University of Colorado Boulder

/**
 * WrappedAudioBuffer is an object that contains a Web Audio AudioBuffer and a TinyProperty that indicates whether the
 * audio buffer has been decoded.  This is *only* intended for usage during the loading process, not during run time,
 * which is why it isn't namespaced.  This is part of the mechanism in PhET sims through which sounds are imported using
 * the standard JavaScript 'import' statement.
 *
 * @author John Blanco (PhET Interactive Simulations)
 */

import TinyProperty from '../../axon/js/TinyProperty.js';
import tambo from './tambo.js';
class WrappedAudioBuffer {
  // This TinyProperty is set to null during construction.  Later, when audio data is loaded and decoded, the client
  // should set this to the resultant AudioBuffer.  Once this is set to an AudioBuffer, it should not be set again.

  constructor() {
    this.audioBufferProperty = new TinyProperty(null);

    // Make sure that the audio buffer is only ever set once.
    assert && this.audioBufferProperty.lazyLink((audioBuffer, previousAudioBuffer) => {
      assert && assert(previousAudioBuffer === null && audioBuffer !== null, 'The audio buffer can only be set once');
    });
  }
}
tambo.register('WrappedAudioBuffer', WrappedAudioBuffer);
export default WrappedAudioBuffer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUaW55UHJvcGVydHkiLCJ0YW1ibyIsIldyYXBwZWRBdWRpb0J1ZmZlciIsImNvbnN0cnVjdG9yIiwiYXVkaW9CdWZmZXJQcm9wZXJ0eSIsImFzc2VydCIsImxhenlMaW5rIiwiYXVkaW9CdWZmZXIiLCJwcmV2aW91c0F1ZGlvQnVmZmVyIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJXcmFwcGVkQXVkaW9CdWZmZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjAtMjAyMiwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogV3JhcHBlZEF1ZGlvQnVmZmVyIGlzIGFuIG9iamVjdCB0aGF0IGNvbnRhaW5zIGEgV2ViIEF1ZGlvIEF1ZGlvQnVmZmVyIGFuZCBhIFRpbnlQcm9wZXJ0eSB0aGF0IGluZGljYXRlcyB3aGV0aGVyIHRoZVxyXG4gKiBhdWRpbyBidWZmZXIgaGFzIGJlZW4gZGVjb2RlZC4gIFRoaXMgaXMgKm9ubHkqIGludGVuZGVkIGZvciB1c2FnZSBkdXJpbmcgdGhlIGxvYWRpbmcgcHJvY2Vzcywgbm90IGR1cmluZyBydW4gdGltZSxcclxuICogd2hpY2ggaXMgd2h5IGl0IGlzbid0IG5hbWVzcGFjZWQuICBUaGlzIGlzIHBhcnQgb2YgdGhlIG1lY2hhbmlzbSBpbiBQaEVUIHNpbXMgdGhyb3VnaCB3aGljaCBzb3VuZHMgYXJlIGltcG9ydGVkIHVzaW5nXHJcbiAqIHRoZSBzdGFuZGFyZCBKYXZhU2NyaXB0ICdpbXBvcnQnIHN0YXRlbWVudC5cclxuICpcclxuICogQGF1dGhvciBKb2huIEJsYW5jbyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgVGlueVByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvVGlueVByb3BlcnR5LmpzJztcclxuaW1wb3J0IHRhbWJvIGZyb20gJy4vdGFtYm8uanMnO1xyXG5cclxuY2xhc3MgV3JhcHBlZEF1ZGlvQnVmZmVyIHtcclxuXHJcbiAgLy8gVGhpcyBUaW55UHJvcGVydHkgaXMgc2V0IHRvIG51bGwgZHVyaW5nIGNvbnN0cnVjdGlvbi4gIExhdGVyLCB3aGVuIGF1ZGlvIGRhdGEgaXMgbG9hZGVkIGFuZCBkZWNvZGVkLCB0aGUgY2xpZW50XHJcbiAgLy8gc2hvdWxkIHNldCB0aGlzIHRvIHRoZSByZXN1bHRhbnQgQXVkaW9CdWZmZXIuICBPbmNlIHRoaXMgaXMgc2V0IHRvIGFuIEF1ZGlvQnVmZmVyLCBpdCBzaG91bGQgbm90IGJlIHNldCBhZ2Fpbi5cclxuICBwdWJsaWMgcmVhZG9ubHkgYXVkaW9CdWZmZXJQcm9wZXJ0eTogVGlueVByb3BlcnR5PEF1ZGlvQnVmZmVyIHwgbnVsbD47XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcclxuXHJcbiAgICB0aGlzLmF1ZGlvQnVmZmVyUHJvcGVydHkgPSBuZXcgVGlueVByb3BlcnR5PEF1ZGlvQnVmZmVyIHwgbnVsbD4oIG51bGwgKTtcclxuXHJcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCB0aGUgYXVkaW8gYnVmZmVyIGlzIG9ubHkgZXZlciBzZXQgb25jZS5cclxuICAgIGFzc2VydCAmJiB0aGlzLmF1ZGlvQnVmZmVyUHJvcGVydHkubGF6eUxpbmsoICggYXVkaW9CdWZmZXIsIHByZXZpb3VzQXVkaW9CdWZmZXIgKSA9PiB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHByZXZpb3VzQXVkaW9CdWZmZXIgPT09IG51bGwgJiYgYXVkaW9CdWZmZXIgIT09IG51bGwsICdUaGUgYXVkaW8gYnVmZmVyIGNhbiBvbmx5IGJlIHNldCBvbmNlJyApO1xyXG4gICAgfSApO1xyXG4gIH1cclxufVxyXG5cclxudGFtYm8ucmVnaXN0ZXIoICdXcmFwcGVkQXVkaW9CdWZmZXInLCBXcmFwcGVkQXVkaW9CdWZmZXIgKTtcclxuZXhwb3J0IGRlZmF1bHQgV3JhcHBlZEF1ZGlvQnVmZmVyOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxZQUFZLE1BQU0sK0JBQStCO0FBQ3hELE9BQU9DLEtBQUssTUFBTSxZQUFZO0FBRTlCLE1BQU1DLGtCQUFrQixDQUFDO0VBRXZCO0VBQ0E7O0VBR09DLFdBQVdBLENBQUEsRUFBRztJQUVuQixJQUFJLENBQUNDLG1CQUFtQixHQUFHLElBQUlKLFlBQVksQ0FBc0IsSUFBSyxDQUFDOztJQUV2RTtJQUNBSyxNQUFNLElBQUksSUFBSSxDQUFDRCxtQkFBbUIsQ0FBQ0UsUUFBUSxDQUFFLENBQUVDLFdBQVcsRUFBRUMsbUJBQW1CLEtBQU07TUFDbkZILE1BQU0sSUFBSUEsTUFBTSxDQUFFRyxtQkFBbUIsS0FBSyxJQUFJLElBQUlELFdBQVcsS0FBSyxJQUFJLEVBQUUsdUNBQXdDLENBQUM7SUFDbkgsQ0FBRSxDQUFDO0VBQ0w7QUFDRjtBQUVBTixLQUFLLENBQUNRLFFBQVEsQ0FBRSxvQkFBb0IsRUFBRVAsa0JBQW1CLENBQUM7QUFDMUQsZUFBZUEsa0JBQWtCIiwiaWdub3JlTGlzdCI6W119