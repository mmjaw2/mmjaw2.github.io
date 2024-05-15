// Copyright 2014-2024, University of Colorado Boulder

/**
 * Abstraction for timed-event series that helps with variable frame-rates. Useful for things that need to happen at a
 * specific rate real-time regardless of the frame-rate.
 *
 * An EventTimer is created with a specific event "model" that determines when events occur, and a callback that will
 * be triggered for each event (with its time elapsed since it should have occurred). Thus, each callback basically
 * says:
 * - "an event happened <timeElapsed> ago"
 *
 * To have the EventTimer step forward in time (firing callbacks for every event that would have occurred over that
 * time frame, if any), call step( realTimeElapsed ).
 *
 * -----------------------------------------
 *
 * For example, create a timer with a constant rate that will fire events every 1 time units:
 *
 * var timer = new phet.phetCore.EventTimer( new phetCore.ConstantEventModel( 1 ), function( timeElapsed ) {
 *   console.log( 'event with timeElapsed: ' + timeElapsed );
 * } );
 *
 * Stepping once for 1.5 time units will fire once (0.5 seconds since the "end" of the step), and will be 0.5 seconds
 * from the next step:
 *
 * timer.step( 1.5 );
 * > event with timeElapsed: 0.5
 *
 * The 0.5 above is because after 1.5 seconds of time, the event will have happened 0.5 seconds ago:
 *
 *           step 1.5
 * |------------------------>|
 * |                *        |          *                     *    <- constant time of 1 between each event
 * |                <--------|
 *                 0.5 seconds past the event now
 *
 * Stepping for a longer time will result in more events:
 *
 * timer.step( 6 );
 * > event with timeElapsed: 5.5
 * > event with timeElapsed: 4.5
 * > event with timeElapsed: 3.5
 * > event with timeElapsed: 2.5
 * > event with timeElapsed: 1.5
 * > event with timeElapsed: 0.5
 *
 *       step 1.5                                  step 6                                 step 0   step 1.5
 * |---------------->|---------------------------------------------------------------------->|---------------->|
 * |           *           *           *           *           *           *           *           *           *
 * |           <-----|     <-----------------------------------------------------------------|     <-----------|
 * |          0.5         5.5          <-----------------------------------------------------|     1           0
 * |           ^           ^          4.5          <-----------------------------------------|              event at
 * |           |           |                      3.5          <-----------------------------|              current
 * |           |           |                                  2.5          <-----------------|              time
 * |     callback( t ) called, etc.                                       1.5          <-----|
 * |
 *
 * A step with zero time will trigger no events:
 *
 * timer.step( 0 );
 *
 * The timer will fire an event once it reaches the exact point in time:
 *
 * timer.step( 1.5 );
 * > event with timeElapsed: 1
 * > event with timeElapsed: 0
 *
 * NOTE:
 * If your timer callbacks create model objects that would also get stepped forward, make sure to step forward objects
 * before calling eventTimer.step(), so that objects don't get stepped twice. Usually the callback will have:
 * - var modelElement = new ModelElement();
 * - modelElement.step( callbackTimeElapsed );
 * And you don't want to apply step( dt ) to it directly afterwards.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import phetCore from './phetCore.js';
export default class EventTimer {
  /*
   * Create an event timer with a specific model (determines the time between events), and a callback to be called
   * for events.
   *
   * @param eventModel: getPeriodBeforeNextEvent() will be called at
   *    the start and after every event to determine the time required to pass by before the next event occurs.
   * @param eventCallback - Will be called for every event. The timeElapsed passed in as the
   *    only argument denotes the time elapsed since the event would have occurred. E.g. if we step for 5 seconds and
   *    our event would have occurred 1 second into that step, the timeElapsed will be 4 seconds, since after the end
   *    of the 5 seconds the event would have happened 4 seconds ago.
   */
  constructor(eventModel, eventCallback) {
    this.eventModel = eventModel;
    this.eventCallback = eventCallback;
    this.period = this.eventModel.getPeriodBeforeNextEvent();
    this.timeBeforeNextEvent = this.period;
  }

  /**
   * Steps the timer forward by a certain amount of time. This may cause 0 or more events to actually occur.
   */
  step(dt) {
    while (dt >= this.timeBeforeNextEvent) {
      dt -= this.timeBeforeNextEvent;
      this.period = this.eventModel.getPeriodBeforeNextEvent();
      this.timeBeforeNextEvent = this.period;

      // how much time has elapsed since this event began
      this.eventCallback(dt);
    }

    // use up the remaining DT
    this.timeBeforeNextEvent -= dt;
  }

  /**
   * Returns how far we are to the next event firing (where 0 is an event "just" fired, and 1 is the next event
   * firing).
   *
   * @returns In the range [0,1). Is inclusive for 0, but exclusive for 1.
   */
  getRatio() {
    return (this.period - this.timeBeforeNextEvent) / this.period;
  }
}
export class ConstantEventModel {
  /*
   * Event model that will fire events at a constant rate. An event will occur every 1/rate time units.
   */
  constructor(rate) {
    this.rate = rate;
    assert && assert(rate > 0, 'We need to have a strictly positive rate in order to prevent infinite loops.');
  }
  getPeriodBeforeNextEvent() {
    return 1 / this.rate;
  }
}
export class UniformEventModel {
  /*
   * Event model that will fire events averaging a certain rate, but with the time between events being uniformly
   * random.
   *
   * The pseudoRandomNumberSource, when called, should generate uniformly distributed random numbers in the range [0,1).
   */
  constructor(rate, pseudoRandomNumberSource) {
    this.rate = rate;
    this.pseudoRandomNumberSource = pseudoRandomNumberSource;
    assert && assert(rate > 0, 'We need to have a strictly positive rate in order to prevent infinite loops.');
  }
  getPeriodBeforeNextEvent() {
    const uniformRandomNumber = this.pseudoRandomNumberSource();
    assert && assert(uniformRandomNumber >= 0 && uniformRandomNumber < 1, `Our uniform random number is outside of its expected range with a value of ${uniformRandomNumber}`);

    // sample the exponential distribution
    return uniformRandomNumber * 2 / this.rate;
  }
}
export class PoissonEventModel {
  /*
   * Event model that will fire events corresponding to a Poisson process with the specified rate.
   * The pseudoRandomNumberSource, when called, should generate uniformly distributed random numbers in the range [0,1).
   */
  constructor(rate, pseudoRandomNumberSource) {
    this.rate = rate;
    this.pseudoRandomNumberSource = pseudoRandomNumberSource;
    assert && assert(rate > 0, 'We need to have a strictly positive poisson rate in order to prevent infinite loops.');
  }
  getPeriodBeforeNextEvent() {
    // A poisson process can be described as having an independent exponential distribution for the time between
    // consecutive events.
    // see http://en.wikipedia.org/wiki/Exponential_distribution#Generating_exponential_variates and
    // http://en.wikipedia.org/wiki/Poisson_process

    const uniformRandomNumber = this.pseudoRandomNumberSource();
    assert && assert(uniformRandomNumber >= 0 && uniformRandomNumber < 1, `Our uniform random number is outside of its expected range with a value of ${uniformRandomNumber}`);

    // sample the exponential distribution
    return -Math.log(uniformRandomNumber) / this.rate;
  }
}
phetCore.register('PoissonEventModel', PoissonEventModel);
phetCore.register('UniformEventModel', UniformEventModel);
phetCore.register('ConstantEventModel', ConstantEventModel);
phetCore.register('EventTimer', EventTimer);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwaGV0Q29yZSIsIkV2ZW50VGltZXIiLCJjb25zdHJ1Y3RvciIsImV2ZW50TW9kZWwiLCJldmVudENhbGxiYWNrIiwicGVyaW9kIiwiZ2V0UGVyaW9kQmVmb3JlTmV4dEV2ZW50IiwidGltZUJlZm9yZU5leHRFdmVudCIsInN0ZXAiLCJkdCIsImdldFJhdGlvIiwiQ29uc3RhbnRFdmVudE1vZGVsIiwicmF0ZSIsImFzc2VydCIsIlVuaWZvcm1FdmVudE1vZGVsIiwicHNldWRvUmFuZG9tTnVtYmVyU291cmNlIiwidW5pZm9ybVJhbmRvbU51bWJlciIsIlBvaXNzb25FdmVudE1vZGVsIiwiTWF0aCIsImxvZyIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiRXZlbnRUaW1lci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNC0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBYnN0cmFjdGlvbiBmb3IgdGltZWQtZXZlbnQgc2VyaWVzIHRoYXQgaGVscHMgd2l0aCB2YXJpYWJsZSBmcmFtZS1yYXRlcy4gVXNlZnVsIGZvciB0aGluZ3MgdGhhdCBuZWVkIHRvIGhhcHBlbiBhdCBhXHJcbiAqIHNwZWNpZmljIHJhdGUgcmVhbC10aW1lIHJlZ2FyZGxlc3Mgb2YgdGhlIGZyYW1lLXJhdGUuXHJcbiAqXHJcbiAqIEFuIEV2ZW50VGltZXIgaXMgY3JlYXRlZCB3aXRoIGEgc3BlY2lmaWMgZXZlbnQgXCJtb2RlbFwiIHRoYXQgZGV0ZXJtaW5lcyB3aGVuIGV2ZW50cyBvY2N1ciwgYW5kIGEgY2FsbGJhY2sgdGhhdCB3aWxsXHJcbiAqIGJlIHRyaWdnZXJlZCBmb3IgZWFjaCBldmVudCAod2l0aCBpdHMgdGltZSBlbGFwc2VkIHNpbmNlIGl0IHNob3VsZCBoYXZlIG9jY3VycmVkKS4gVGh1cywgZWFjaCBjYWxsYmFjayBiYXNpY2FsbHlcclxuICogc2F5czpcclxuICogLSBcImFuIGV2ZW50IGhhcHBlbmVkIDx0aW1lRWxhcHNlZD4gYWdvXCJcclxuICpcclxuICogVG8gaGF2ZSB0aGUgRXZlbnRUaW1lciBzdGVwIGZvcndhcmQgaW4gdGltZSAoZmlyaW5nIGNhbGxiYWNrcyBmb3IgZXZlcnkgZXZlbnQgdGhhdCB3b3VsZCBoYXZlIG9jY3VycmVkIG92ZXIgdGhhdFxyXG4gKiB0aW1lIGZyYW1lLCBpZiBhbnkpLCBjYWxsIHN0ZXAoIHJlYWxUaW1lRWxhcHNlZCApLlxyXG4gKlxyXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gKlxyXG4gKiBGb3IgZXhhbXBsZSwgY3JlYXRlIGEgdGltZXIgd2l0aCBhIGNvbnN0YW50IHJhdGUgdGhhdCB3aWxsIGZpcmUgZXZlbnRzIGV2ZXJ5IDEgdGltZSB1bml0czpcclxuICpcclxuICogdmFyIHRpbWVyID0gbmV3IHBoZXQucGhldENvcmUuRXZlbnRUaW1lciggbmV3IHBoZXRDb3JlLkNvbnN0YW50RXZlbnRNb2RlbCggMSApLCBmdW5jdGlvbiggdGltZUVsYXBzZWQgKSB7XHJcbiAqICAgY29uc29sZS5sb2coICdldmVudCB3aXRoIHRpbWVFbGFwc2VkOiAnICsgdGltZUVsYXBzZWQgKTtcclxuICogfSApO1xyXG4gKlxyXG4gKiBTdGVwcGluZyBvbmNlIGZvciAxLjUgdGltZSB1bml0cyB3aWxsIGZpcmUgb25jZSAoMC41IHNlY29uZHMgc2luY2UgdGhlIFwiZW5kXCIgb2YgdGhlIHN0ZXApLCBhbmQgd2lsbCBiZSAwLjUgc2Vjb25kc1xyXG4gKiBmcm9tIHRoZSBuZXh0IHN0ZXA6XHJcbiAqXHJcbiAqIHRpbWVyLnN0ZXAoIDEuNSApO1xyXG4gKiA+IGV2ZW50IHdpdGggdGltZUVsYXBzZWQ6IDAuNVxyXG4gKlxyXG4gKiBUaGUgMC41IGFib3ZlIGlzIGJlY2F1c2UgYWZ0ZXIgMS41IHNlY29uZHMgb2YgdGltZSwgdGhlIGV2ZW50IHdpbGwgaGF2ZSBoYXBwZW5lZCAwLjUgc2Vjb25kcyBhZ286XHJcbiAqXHJcbiAqICAgICAgICAgICBzdGVwIDEuNVxyXG4gKiB8LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tPnxcclxuICogfCAgICAgICAgICAgICAgICAqICAgICAgICB8ICAgICAgICAgICogICAgICAgICAgICAgICAgICAgICAqICAgIDwtIGNvbnN0YW50IHRpbWUgb2YgMSBiZXR3ZWVuIGVhY2ggZXZlbnRcclxuICogfCAgICAgICAgICAgICAgICA8LS0tLS0tLS18XHJcbiAqICAgICAgICAgICAgICAgICAwLjUgc2Vjb25kcyBwYXN0IHRoZSBldmVudCBub3dcclxuICpcclxuICogU3RlcHBpbmcgZm9yIGEgbG9uZ2VyIHRpbWUgd2lsbCByZXN1bHQgaW4gbW9yZSBldmVudHM6XHJcbiAqXHJcbiAqIHRpbWVyLnN0ZXAoIDYgKTtcclxuICogPiBldmVudCB3aXRoIHRpbWVFbGFwc2VkOiA1LjVcclxuICogPiBldmVudCB3aXRoIHRpbWVFbGFwc2VkOiA0LjVcclxuICogPiBldmVudCB3aXRoIHRpbWVFbGFwc2VkOiAzLjVcclxuICogPiBldmVudCB3aXRoIHRpbWVFbGFwc2VkOiAyLjVcclxuICogPiBldmVudCB3aXRoIHRpbWVFbGFwc2VkOiAxLjVcclxuICogPiBldmVudCB3aXRoIHRpbWVFbGFwc2VkOiAwLjVcclxuICpcclxuICogICAgICAgc3RlcCAxLjUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RlcCA2ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RlcCAwICAgc3RlcCAxLjVcclxuICogfC0tLS0tLS0tLS0tLS0tLS0+fC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0+fC0tLS0tLS0tLS0tLS0tLS0+fFxyXG4gKiB8ICAgICAgICAgICAqICAgICAgICAgICAqICAgICAgICAgICAqICAgICAgICAgICAqICAgICAgICAgICAqICAgICAgICAgICAqICAgICAgICAgICAqICAgICAgICAgICAqICAgICAgICAgICAqXHJcbiAqIHwgICAgICAgICAgIDwtLS0tLXwgICAgIDwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLXwgICAgIDwtLS0tLS0tLS0tLXxcclxuICogfCAgICAgICAgICAwLjUgICAgICAgICA1LjUgICAgICAgICAgPC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tfCAgICAgMSAgICAgICAgICAgMFxyXG4gKiB8ICAgICAgICAgICBeICAgICAgICAgICBeICAgICAgICAgIDQuNSAgICAgICAgICA8LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS18ICAgICAgICAgICAgICBldmVudCBhdFxyXG4gKiB8ICAgICAgICAgICB8ICAgICAgICAgICB8ICAgICAgICAgICAgICAgICAgICAgIDMuNSAgICAgICAgICA8LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS18ICAgICAgICAgICAgICBjdXJyZW50XHJcbiAqIHwgICAgICAgICAgIHwgICAgICAgICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMi41ICAgICAgICAgIDwtLS0tLS0tLS0tLS0tLS0tLXwgICAgICAgICAgICAgIHRpbWVcclxuICogfCAgICAgY2FsbGJhY2soIHQgKSBjYWxsZWQsIGV0Yy4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAxLjUgICAgICAgICAgPC0tLS0tfFxyXG4gKiB8XHJcbiAqXHJcbiAqIEEgc3RlcCB3aXRoIHplcm8gdGltZSB3aWxsIHRyaWdnZXIgbm8gZXZlbnRzOlxyXG4gKlxyXG4gKiB0aW1lci5zdGVwKCAwICk7XHJcbiAqXHJcbiAqIFRoZSB0aW1lciB3aWxsIGZpcmUgYW4gZXZlbnQgb25jZSBpdCByZWFjaGVzIHRoZSBleGFjdCBwb2ludCBpbiB0aW1lOlxyXG4gKlxyXG4gKiB0aW1lci5zdGVwKCAxLjUgKTtcclxuICogPiBldmVudCB3aXRoIHRpbWVFbGFwc2VkOiAxXHJcbiAqID4gZXZlbnQgd2l0aCB0aW1lRWxhcHNlZDogMFxyXG4gKlxyXG4gKiBOT1RFOlxyXG4gKiBJZiB5b3VyIHRpbWVyIGNhbGxiYWNrcyBjcmVhdGUgbW9kZWwgb2JqZWN0cyB0aGF0IHdvdWxkIGFsc28gZ2V0IHN0ZXBwZWQgZm9yd2FyZCwgbWFrZSBzdXJlIHRvIHN0ZXAgZm9yd2FyZCBvYmplY3RzXHJcbiAqIGJlZm9yZSBjYWxsaW5nIGV2ZW50VGltZXIuc3RlcCgpLCBzbyB0aGF0IG9iamVjdHMgZG9uJ3QgZ2V0IHN0ZXBwZWQgdHdpY2UuIFVzdWFsbHkgdGhlIGNhbGxiYWNrIHdpbGwgaGF2ZTpcclxuICogLSB2YXIgbW9kZWxFbGVtZW50ID0gbmV3IE1vZGVsRWxlbWVudCgpO1xyXG4gKiAtIG1vZGVsRWxlbWVudC5zdGVwKCBjYWxsYmFja1RpbWVFbGFwc2VkICk7XHJcbiAqIEFuZCB5b3UgZG9uJ3Qgd2FudCB0byBhcHBseSBzdGVwKCBkdCApIHRvIGl0IGRpcmVjdGx5IGFmdGVyd2FyZHMuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgcGhldENvcmUgZnJvbSAnLi9waGV0Q29yZS5qcyc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFdmVudFRpbWVyIHtcclxuXHJcbiAgcHJpdmF0ZSBwZXJpb2Q6IG51bWJlcjtcclxuICBwcml2YXRlIHRpbWVCZWZvcmVOZXh0RXZlbnQ6IG51bWJlcjtcclxuXHJcbiAgLypcclxuICAgKiBDcmVhdGUgYW4gZXZlbnQgdGltZXIgd2l0aCBhIHNwZWNpZmljIG1vZGVsIChkZXRlcm1pbmVzIHRoZSB0aW1lIGJldHdlZW4gZXZlbnRzKSwgYW5kIGEgY2FsbGJhY2sgdG8gYmUgY2FsbGVkXHJcbiAgICogZm9yIGV2ZW50cy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBldmVudE1vZGVsOiBnZXRQZXJpb2RCZWZvcmVOZXh0RXZlbnQoKSB3aWxsIGJlIGNhbGxlZCBhdFxyXG4gICAqICAgIHRoZSBzdGFydCBhbmQgYWZ0ZXIgZXZlcnkgZXZlbnQgdG8gZGV0ZXJtaW5lIHRoZSB0aW1lIHJlcXVpcmVkIHRvIHBhc3MgYnkgYmVmb3JlIHRoZSBuZXh0IGV2ZW50IG9jY3Vycy5cclxuICAgKiBAcGFyYW0gZXZlbnRDYWxsYmFjayAtIFdpbGwgYmUgY2FsbGVkIGZvciBldmVyeSBldmVudC4gVGhlIHRpbWVFbGFwc2VkIHBhc3NlZCBpbiBhcyB0aGVcclxuICAgKiAgICBvbmx5IGFyZ3VtZW50IGRlbm90ZXMgdGhlIHRpbWUgZWxhcHNlZCBzaW5jZSB0aGUgZXZlbnQgd291bGQgaGF2ZSBvY2N1cnJlZC4gRS5nLiBpZiB3ZSBzdGVwIGZvciA1IHNlY29uZHMgYW5kXHJcbiAgICogICAgb3VyIGV2ZW50IHdvdWxkIGhhdmUgb2NjdXJyZWQgMSBzZWNvbmQgaW50byB0aGF0IHN0ZXAsIHRoZSB0aW1lRWxhcHNlZCB3aWxsIGJlIDQgc2Vjb25kcywgc2luY2UgYWZ0ZXIgdGhlIGVuZFxyXG4gICAqICAgIG9mIHRoZSA1IHNlY29uZHMgdGhlIGV2ZW50IHdvdWxkIGhhdmUgaGFwcGVuZWQgNCBzZWNvbmRzIGFnby5cclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHByaXZhdGUgcmVhZG9ubHkgZXZlbnRNb2RlbDogeyBnZXRQZXJpb2RCZWZvcmVOZXh0RXZlbnQ6ICgpID0+IG51bWJlciB9LCBwcml2YXRlIHJlYWRvbmx5IGV2ZW50Q2FsbGJhY2s6ICggdGltZUVsYXBzZWQ6IG51bWJlciApID0+IHZvaWQgKSB7XHJcbiAgICB0aGlzLnBlcmlvZCA9IHRoaXMuZXZlbnRNb2RlbC5nZXRQZXJpb2RCZWZvcmVOZXh0RXZlbnQoKTtcclxuICAgIHRoaXMudGltZUJlZm9yZU5leHRFdmVudCA9IHRoaXMucGVyaW9kO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU3RlcHMgdGhlIHRpbWVyIGZvcndhcmQgYnkgYSBjZXJ0YWluIGFtb3VudCBvZiB0aW1lLiBUaGlzIG1heSBjYXVzZSAwIG9yIG1vcmUgZXZlbnRzIHRvIGFjdHVhbGx5IG9jY3VyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGVwKCBkdDogbnVtYmVyICk6IHZvaWQge1xyXG4gICAgd2hpbGUgKCBkdCA+PSB0aGlzLnRpbWVCZWZvcmVOZXh0RXZlbnQgKSB7XHJcbiAgICAgIGR0IC09IHRoaXMudGltZUJlZm9yZU5leHRFdmVudDtcclxuICAgICAgdGhpcy5wZXJpb2QgPSB0aGlzLmV2ZW50TW9kZWwuZ2V0UGVyaW9kQmVmb3JlTmV4dEV2ZW50KCk7XHJcbiAgICAgIHRoaXMudGltZUJlZm9yZU5leHRFdmVudCA9IHRoaXMucGVyaW9kO1xyXG5cclxuICAgICAgLy8gaG93IG11Y2ggdGltZSBoYXMgZWxhcHNlZCBzaW5jZSB0aGlzIGV2ZW50IGJlZ2FuXHJcbiAgICAgIHRoaXMuZXZlbnRDYWxsYmFjayggZHQgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyB1c2UgdXAgdGhlIHJlbWFpbmluZyBEVFxyXG4gICAgdGhpcy50aW1lQmVmb3JlTmV4dEV2ZW50IC09IGR0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBob3cgZmFyIHdlIGFyZSB0byB0aGUgbmV4dCBldmVudCBmaXJpbmcgKHdoZXJlIDAgaXMgYW4gZXZlbnQgXCJqdXN0XCIgZmlyZWQsIGFuZCAxIGlzIHRoZSBuZXh0IGV2ZW50XHJcbiAgICogZmlyaW5nKS5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEluIHRoZSByYW5nZSBbMCwxKS4gSXMgaW5jbHVzaXZlIGZvciAwLCBidXQgZXhjbHVzaXZlIGZvciAxLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRSYXRpbygpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuICggdGhpcy5wZXJpb2QgLSB0aGlzLnRpbWVCZWZvcmVOZXh0RXZlbnQgKSAvIHRoaXMucGVyaW9kO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENvbnN0YW50RXZlbnRNb2RlbCB7XHJcblxyXG4gIC8qXHJcbiAgICogRXZlbnQgbW9kZWwgdGhhdCB3aWxsIGZpcmUgZXZlbnRzIGF0IGEgY29uc3RhbnQgcmF0ZS4gQW4gZXZlbnQgd2lsbCBvY2N1ciBldmVyeSAxL3JhdGUgdGltZSB1bml0cy5cclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHByaXZhdGUgcmVhZG9ubHkgcmF0ZTogbnVtYmVyICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcmF0ZSA+IDAsICdXZSBuZWVkIHRvIGhhdmUgYSBzdHJpY3RseSBwb3NpdGl2ZSByYXRlIGluIG9yZGVyIHRvIHByZXZlbnQgaW5maW5pdGUgbG9vcHMuJyApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldFBlcmlvZEJlZm9yZU5leHRFdmVudCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIDEgLyB0aGlzLnJhdGU7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVW5pZm9ybUV2ZW50TW9kZWwge1xyXG5cclxuICAvKlxyXG4gICAqIEV2ZW50IG1vZGVsIHRoYXQgd2lsbCBmaXJlIGV2ZW50cyBhdmVyYWdpbmcgYSBjZXJ0YWluIHJhdGUsIGJ1dCB3aXRoIHRoZSB0aW1lIGJldHdlZW4gZXZlbnRzIGJlaW5nIHVuaWZvcm1seVxyXG4gICAqIHJhbmRvbS5cclxuICAgKlxyXG4gICAqIFRoZSBwc2V1ZG9SYW5kb21OdW1iZXJTb3VyY2UsIHdoZW4gY2FsbGVkLCBzaG91bGQgZ2VuZXJhdGUgdW5pZm9ybWx5IGRpc3RyaWJ1dGVkIHJhbmRvbSBudW1iZXJzIGluIHRoZSByYW5nZSBbMCwxKS5cclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHByaXZhdGUgcmVhZG9ubHkgcmF0ZTogbnVtYmVyLCBwcml2YXRlIHJlYWRvbmx5IHBzZXVkb1JhbmRvbU51bWJlclNvdXJjZTogKCkgPT4gbnVtYmVyICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcmF0ZSA+IDAsICdXZSBuZWVkIHRvIGhhdmUgYSBzdHJpY3RseSBwb3NpdGl2ZSByYXRlIGluIG9yZGVyIHRvIHByZXZlbnQgaW5maW5pdGUgbG9vcHMuJyApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldFBlcmlvZEJlZm9yZU5leHRFdmVudCgpOiBudW1iZXIge1xyXG4gICAgY29uc3QgdW5pZm9ybVJhbmRvbU51bWJlciA9IHRoaXMucHNldWRvUmFuZG9tTnVtYmVyU291cmNlKCk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB1bmlmb3JtUmFuZG9tTnVtYmVyID49IDAgJiYgdW5pZm9ybVJhbmRvbU51bWJlciA8IDEsXHJcbiAgICAgIGBPdXIgdW5pZm9ybSByYW5kb20gbnVtYmVyIGlzIG91dHNpZGUgb2YgaXRzIGV4cGVjdGVkIHJhbmdlIHdpdGggYSB2YWx1ZSBvZiAke3VuaWZvcm1SYW5kb21OdW1iZXJ9YCApO1xyXG5cclxuICAgIC8vIHNhbXBsZSB0aGUgZXhwb25lbnRpYWwgZGlzdHJpYnV0aW9uXHJcbiAgICByZXR1cm4gdW5pZm9ybVJhbmRvbU51bWJlciAqIDIgLyB0aGlzLnJhdGU7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUG9pc3NvbkV2ZW50TW9kZWwge1xyXG5cclxuICAvKlxyXG4gICAqIEV2ZW50IG1vZGVsIHRoYXQgd2lsbCBmaXJlIGV2ZW50cyBjb3JyZXNwb25kaW5nIHRvIGEgUG9pc3NvbiBwcm9jZXNzIHdpdGggdGhlIHNwZWNpZmllZCByYXRlLlxyXG4gICAqIFRoZSBwc2V1ZG9SYW5kb21OdW1iZXJTb3VyY2UsIHdoZW4gY2FsbGVkLCBzaG91bGQgZ2VuZXJhdGUgdW5pZm9ybWx5IGRpc3RyaWJ1dGVkIHJhbmRvbSBudW1iZXJzIGluIHRoZSByYW5nZSBbMCwxKS5cclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHByaXZhdGUgcmVhZG9ubHkgcmF0ZTogbnVtYmVyLCBwcml2YXRlIHJlYWRvbmx5IHBzZXVkb1JhbmRvbU51bWJlclNvdXJjZTogKCkgPT4gbnVtYmVyICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcmF0ZSA+IDAsXHJcbiAgICAgICdXZSBuZWVkIHRvIGhhdmUgYSBzdHJpY3RseSBwb3NpdGl2ZSBwb2lzc29uIHJhdGUgaW4gb3JkZXIgdG8gcHJldmVudCBpbmZpbml0ZSBsb29wcy4nICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0UGVyaW9kQmVmb3JlTmV4dEV2ZW50KCk6IG51bWJlciB7XHJcblxyXG4gICAgLy8gQSBwb2lzc29uIHByb2Nlc3MgY2FuIGJlIGRlc2NyaWJlZCBhcyBoYXZpbmcgYW4gaW5kZXBlbmRlbnQgZXhwb25lbnRpYWwgZGlzdHJpYnV0aW9uIGZvciB0aGUgdGltZSBiZXR3ZWVuXHJcbiAgICAvLyBjb25zZWN1dGl2ZSBldmVudHMuXHJcbiAgICAvLyBzZWUgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9FeHBvbmVudGlhbF9kaXN0cmlidXRpb24jR2VuZXJhdGluZ19leHBvbmVudGlhbF92YXJpYXRlcyBhbmRcclxuICAgIC8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvUG9pc3Nvbl9wcm9jZXNzXHJcblxyXG4gICAgY29uc3QgdW5pZm9ybVJhbmRvbU51bWJlciA9IHRoaXMucHNldWRvUmFuZG9tTnVtYmVyU291cmNlKCk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB1bmlmb3JtUmFuZG9tTnVtYmVyID49IDAgJiYgdW5pZm9ybVJhbmRvbU51bWJlciA8IDEsXHJcbiAgICAgIGBPdXIgdW5pZm9ybSByYW5kb20gbnVtYmVyIGlzIG91dHNpZGUgb2YgaXRzIGV4cGVjdGVkIHJhbmdlIHdpdGggYSB2YWx1ZSBvZiAke3VuaWZvcm1SYW5kb21OdW1iZXJ9YCApO1xyXG5cclxuICAgIC8vIHNhbXBsZSB0aGUgZXhwb25lbnRpYWwgZGlzdHJpYnV0aW9uXHJcbiAgICByZXR1cm4gLU1hdGgubG9nKCB1bmlmb3JtUmFuZG9tTnVtYmVyICkgLyB0aGlzLnJhdGU7XHJcbiAgfVxyXG59XHJcblxyXG5waGV0Q29yZS5yZWdpc3RlciggJ1BvaXNzb25FdmVudE1vZGVsJywgUG9pc3NvbkV2ZW50TW9kZWwgKTtcclxucGhldENvcmUucmVnaXN0ZXIoICdVbmlmb3JtRXZlbnRNb2RlbCcsIFVuaWZvcm1FdmVudE1vZGVsICk7XHJcbnBoZXRDb3JlLnJlZ2lzdGVyKCAnQ29uc3RhbnRFdmVudE1vZGVsJywgQ29uc3RhbnRFdmVudE1vZGVsICk7XHJcblxyXG5waGV0Q29yZS5yZWdpc3RlciggJ0V2ZW50VGltZXInLCBFdmVudFRpbWVyICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFFBQVEsTUFBTSxlQUFlO0FBRXBDLGVBQWUsTUFBTUMsVUFBVSxDQUFDO0VBSzlCO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDU0MsV0FBV0EsQ0FBbUJDLFVBQXNELEVBQW1CQyxhQUE4QyxFQUFHO0lBQUEsS0FBMUhELFVBQXNELEdBQXREQSxVQUFzRDtJQUFBLEtBQW1CQyxhQUE4QyxHQUE5Q0EsYUFBOEM7SUFDMUosSUFBSSxDQUFDQyxNQUFNLEdBQUcsSUFBSSxDQUFDRixVQUFVLENBQUNHLHdCQUF3QixDQUFDLENBQUM7SUFDeEQsSUFBSSxDQUFDQyxtQkFBbUIsR0FBRyxJQUFJLENBQUNGLE1BQU07RUFDeEM7O0VBRUE7QUFDRjtBQUNBO0VBQ1NHLElBQUlBLENBQUVDLEVBQVUsRUFBUztJQUM5QixPQUFRQSxFQUFFLElBQUksSUFBSSxDQUFDRixtQkFBbUIsRUFBRztNQUN2Q0UsRUFBRSxJQUFJLElBQUksQ0FBQ0YsbUJBQW1CO01BQzlCLElBQUksQ0FBQ0YsTUFBTSxHQUFHLElBQUksQ0FBQ0YsVUFBVSxDQUFDRyx3QkFBd0IsQ0FBQyxDQUFDO01BQ3hELElBQUksQ0FBQ0MsbUJBQW1CLEdBQUcsSUFBSSxDQUFDRixNQUFNOztNQUV0QztNQUNBLElBQUksQ0FBQ0QsYUFBYSxDQUFFSyxFQUFHLENBQUM7SUFDMUI7O0lBRUE7SUFDQSxJQUFJLENBQUNGLG1CQUFtQixJQUFJRSxFQUFFO0VBQ2hDOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTQyxRQUFRQSxDQUFBLEVBQVc7SUFDeEIsT0FBTyxDQUFFLElBQUksQ0FBQ0wsTUFBTSxHQUFHLElBQUksQ0FBQ0UsbUJBQW1CLElBQUssSUFBSSxDQUFDRixNQUFNO0VBQ2pFO0FBQ0Y7QUFFQSxPQUFPLE1BQU1NLGtCQUFrQixDQUFDO0VBRTlCO0FBQ0Y7QUFDQTtFQUNTVCxXQUFXQSxDQUFtQlUsSUFBWSxFQUFHO0lBQUEsS0FBZkEsSUFBWSxHQUFaQSxJQUFZO0lBQy9DQyxNQUFNLElBQUlBLE1BQU0sQ0FBRUQsSUFBSSxHQUFHLENBQUMsRUFBRSw4RUFBK0UsQ0FBQztFQUM5RztFQUVPTix3QkFBd0JBLENBQUEsRUFBVztJQUN4QyxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUNNLElBQUk7RUFDdEI7QUFDRjtBQUVBLE9BQU8sTUFBTUUsaUJBQWlCLENBQUM7RUFFN0I7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1NaLFdBQVdBLENBQW1CVSxJQUFZLEVBQW1CRyx3QkFBc0MsRUFBRztJQUFBLEtBQXhFSCxJQUFZLEdBQVpBLElBQVk7SUFBQSxLQUFtQkcsd0JBQXNDLEdBQXRDQSx3QkFBc0M7SUFDeEdGLE1BQU0sSUFBSUEsTUFBTSxDQUFFRCxJQUFJLEdBQUcsQ0FBQyxFQUFFLDhFQUErRSxDQUFDO0VBQzlHO0VBRU9OLHdCQUF3QkEsQ0FBQSxFQUFXO0lBQ3hDLE1BQU1VLG1CQUFtQixHQUFHLElBQUksQ0FBQ0Qsd0JBQXdCLENBQUMsQ0FBQztJQUMzREYsTUFBTSxJQUFJQSxNQUFNLENBQUVHLG1CQUFtQixJQUFJLENBQUMsSUFBSUEsbUJBQW1CLEdBQUcsQ0FBQyxFQUNsRSw4RUFBNkVBLG1CQUFvQixFQUFFLENBQUM7O0lBRXZHO0lBQ0EsT0FBT0EsbUJBQW1CLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQ0osSUFBSTtFQUM1QztBQUNGO0FBRUEsT0FBTyxNQUFNSyxpQkFBaUIsQ0FBQztFQUU3QjtBQUNGO0FBQ0E7QUFDQTtFQUNTZixXQUFXQSxDQUFtQlUsSUFBWSxFQUFtQkcsd0JBQXNDLEVBQUc7SUFBQSxLQUF4RUgsSUFBWSxHQUFaQSxJQUFZO0lBQUEsS0FBbUJHLHdCQUFzQyxHQUF0Q0Esd0JBQXNDO0lBQ3hHRixNQUFNLElBQUlBLE1BQU0sQ0FBRUQsSUFBSSxHQUFHLENBQUMsRUFDeEIsc0ZBQXVGLENBQUM7RUFDNUY7RUFFT04sd0JBQXdCQSxDQUFBLEVBQVc7SUFFeEM7SUFDQTtJQUNBO0lBQ0E7O0lBRUEsTUFBTVUsbUJBQW1CLEdBQUcsSUFBSSxDQUFDRCx3QkFBd0IsQ0FBQyxDQUFDO0lBQzNERixNQUFNLElBQUlBLE1BQU0sQ0FBRUcsbUJBQW1CLElBQUksQ0FBQyxJQUFJQSxtQkFBbUIsR0FBRyxDQUFDLEVBQ2xFLDhFQUE2RUEsbUJBQW9CLEVBQUUsQ0FBQzs7SUFFdkc7SUFDQSxPQUFPLENBQUNFLElBQUksQ0FBQ0MsR0FBRyxDQUFFSCxtQkFBb0IsQ0FBQyxHQUFHLElBQUksQ0FBQ0osSUFBSTtFQUNyRDtBQUNGO0FBRUFaLFFBQVEsQ0FBQ29CLFFBQVEsQ0FBRSxtQkFBbUIsRUFBRUgsaUJBQWtCLENBQUM7QUFDM0RqQixRQUFRLENBQUNvQixRQUFRLENBQUUsbUJBQW1CLEVBQUVOLGlCQUFrQixDQUFDO0FBQzNEZCxRQUFRLENBQUNvQixRQUFRLENBQUUsb0JBQW9CLEVBQUVULGtCQUFtQixDQUFDO0FBRTdEWCxRQUFRLENBQUNvQixRQUFRLENBQUUsWUFBWSxFQUFFbkIsVUFBVyxDQUFDIiwiaWdub3JlTGlzdCI6W119