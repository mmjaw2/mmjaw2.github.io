// Copyright 2018-2024, University of Colorado Boulder

/**
 * An easing-based controllable animation.
 *
 * We use some terminology to describe points and regions in time for an animation:
 *
 *             starts                            begins                                finishes
 *               |             delay               |             animation                |
 * time-->       |           (waiting)             |     (animated values changing)       |
 * ---------------------------------------------------------------------------------------------------------------------
 *               |------------------------------running-----------------------------------|
 *                                                 |-------------animating----------------|
 *
 * TODO #3: pause/cancel (and stop->cancel renaming)
 * TODO #3: function for blending with angular/rotational values
 * TODO #3: consider keyframed animation helper?
 * TODO #3: Hooks for attaching/detaching stepping via screens/nodes
 * TODO #3: Add documentation examples (contingent on how screen/node hooks work)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import BooleanProperty from '../../axon/js/BooleanProperty.js';
import Emitter from '../../axon/js/Emitter.js';
import stepTimer from '../../axon/js/stepTimer.js';
import TinyEmitter from '../../axon/js/TinyEmitter.js';
import Utils from '../../dot/js/Utils.js';
import optionize from '../../phet-core/js/optionize.js';
import AnimationTarget from './AnimationTarget.js';
import twixt from './twixt.js';
import Disposable from '../../axon/js/Disposable.js';

// IMPORTANT: See AnimationTarget's config documentation, as those config can be passed in either here, or in
// the targets array.

class Animation extends Disposable {
  // All of the different values that will be animated by this animation.
  // If config.targets was supplied, those targets will be wrapped into AnimationTargets
  // If config.targets was not supplied, the config from this object will be wrapped into one AnimationTarget

  // Saved config to help determine the length of the animation

  // In seconds

  // Computed length for the animation (in seconds)
  length = 0;

  // Length of time remaining in the "delay" portion. Computed after the animation is started, and only used until the
  // animation "begins".
  remainingDelay = 0;

  // Length of time remaining in the actual animation (after the delay) portion. Computed after the delay has passed,
  // and only used until the animation "ends".
  remainingAnimation = 0;

  // True while the animation is being stepped through (both the delay portion AND the actual animation portion).
  runningProperty = new BooleanProperty(false);

  // True while the animation is actually changing the value (false while waiting for the delay, or while the animation
  // is not running at all).
  animatingProperty = new BooleanProperty(false);

  // Fired when the animation is "started" (i.e. when start() is called and the delay, if one is there, starts).
  startEmitter = new Emitter();

  // Fired when the actual animation of the value begins (i.e. when the delay finishes and the actual animation begins).
  beginEmitter = new Emitter();

  // Fired when the animation finishes naturally (was not abnormally stopped). A {number} is provided as a single
  // argument to the emit callback, and represents how much "extra" time occurred after the end of the animation. For
  // example, if you have a 1-second animation and stepped it by 3 seconds, this finished emitter would be called with
  // 2 seconds.
  finishEmitter = new Emitter({
    parameters: [{
      valueType: 'number'
    }]
  });

  // Fired when the animation is manually stopped (with stop()). Does NOT fire when it finishes normally.
  stopEmitter = new Emitter();

  // Fired when the animation ends, regardless of whether it fully finished, or was stopped prematurely.
  endedEmitter = new Emitter({
    hasListenerOrderDependencies: true
  }); // TODO: listener order dependencies in should be dealt with, https://github.com/phetsims/fraction-matcher/issues/110

  // Fired when (just after) the animation has changed animated values/targets.
  updateEmitter = new Emitter();

  /**
   * The constructor config will define one or more animation "targets" (specific values to be animated). The config
   * available for targets is documented in AnimationTarget.
   *
   * If there is only one target, it is recommended to pass in those config in the top-level Animation config, e.g.:
   * | var someNumberProperty = new NumberProperty( 0 );
   * | new Animation( {
   * |   // Options for the Animation as a whole
   * |   duration: 2,
   * |
   * |   // Options for the one target to change
   * |   property: someNumberProperty,
   * |   to: 5
   * | } );
   *
   * However multiple different targets are supported, and should be specified in the `targets` option:
   * | var someNumberProperty = new NumberProperty( 100 );
   * | var someObject = { someAttribute: new Vector2( 100, 5 ) };
   * | new Animation( {
   * |   // Options for the Animation as a whole
   * |   duration: 2,
   * |
   * |   targets: [ {
   * |     // First target
   * |     property: someNumberProperty,
   * |     to: 5
   * |   }, {
   * |     // Second target
   * |     object: someObject,
   * |     attribute: 'someAttribute',
   * |     to: new Vector2( 50, 10 )
   * |   } ]
   * | } );
   *
   * NOTE: The length of the animation needs to be specified in exactly one place. This can usually be done by
   * specifying the `duration` in the config, but `speed` can also be used in any of the targets.
   *
   * EXAMPLE: It's possible to create continuous animation loops, where animations cycle back and forth, e.g.:
   * | var moreOpaque = new Animation( {
   * |   object: animatedCircle,
   * |   attribute: 'opacity',
   * |   from: 0.5,
   * |   to: 1,
   * |   duration: 0.5,
   * |   easing: Easing.QUADRATIC_IN_OUT
   * | } );
   * | var lessOpaque = new Animation( {
   * |   object: animatedCircle,
   * |   attribute: 'opacity',
   * |   from: 1,
   * |   to: 0.5,
   * |   duration: 0.5,
   * |   easing: Easing.QUADRATIC_IN_OUT
   * | } );
   * | moreOpaque.then( lessOpaque );
   * | lessOpaque.then( moreOpaque );
   * | lessOpaque.start();
   */
  constructor(providedConfig) {
    const config = optionize()({
      targets: null,
      duration: null,
      delay: 0,
      stepEmitter: stepTimer
    }, providedConfig);
    assert && assert(+(config.property !== undefined) + +(config.object !== undefined) + +(config.setValue !== undefined) + +(config.targets !== null) === 1, 'Should have one (and only one) way of defining how to set the animated value. Use one of property/object/setValue/targets');
    assert && assert(typeof config.delay === 'number' && isFinite(config.delay) && config.delay >= 0, 'The delay should be a non-negative number.');
    assert && assert(config.stepEmitter === null || config.stepEmitter instanceof Emitter || config.stepEmitter instanceof TinyEmitter, 'stepEmitter must be null or an (Tiny)Emitter');
    super(config);
    this.targets = (config.targets === null ? [config] : config.targets).map(config => {
      return new AnimationTarget(config); // TODO #3: strip out the irrelevant config when using config arg
    });
    assert && assert(+(config.duration !== null) + _.sum(_.map(this.targets, target => target.hasPreferredDuration() ? 1 : 0)) === 1, 'Exactly one duration/speed option should be used.');
    this.duration = config.duration;
    this.delay = config.delay;

    // Wire up to the provided Emitter, if any. Whenever this animation is started, it will add a listener to the Timer
    // (and conversely, will be removed when stopped). This means it will animate with the timer, but will not leak
    // memory as long as the animation doesn't last forever.
    const stepEmitter = config.stepEmitter;
    if (stepEmitter) {
      const stepListener = this.step.bind(this);
      this.runningProperty.link(running => {
        if (running && !stepEmitter.hasListener(stepListener)) {
          stepEmitter.addListener(stepListener);
        } else if (!running && stepEmitter.hasListener(stepListener)) {
          stepEmitter.removeListener(stepListener);
        }
      });
      this.disposeEmitter.addListener(() => {
        stepEmitter.hasListener(stepListener) && stepEmitter.removeListener(stepListener);
      });
    }
  }

  /**
   * Starts the animation (or if it has a delay, sets the animation to start after that delay).
   *
   * @param [dt] - If provided, step this far into the animation initially.  Used for chaining animations.
   */
  start(dt) {
    // If we are already animating, do nothing
    if (this.runningProperty.value) {
      return this;
    }

    // The remaining delay needs to be valid immediately after start is called.
    this.remainingDelay = this.delay;

    // Notifications
    this.runningProperty.value = true;
    this.startEmitter.emit();

    // Set up initial state and value
    this.step(dt !== undefined ? dt : 0);
    return this;
  }

  /**
   * Stops the animation (or if waiting for the delay, will not "start" the animation).
   */
  stop() {
    // If we are not already animating, do nothing
    if (!this.runningProperty.value) {
      return this;
    }

    // Notifications
    this.runningProperty.value = false;
    this.stopEmitter.emit();
    this.endedEmitter.emit();
    return this;
  }

  /**
   * Steps the animation forward by a certain amount of time.
   *
   * @param dt - In seconds
   */
  step(dt) {
    // Ignore the step if our animation is not running
    if (!this.runningProperty.value) {
      return this;
    }

    // First, burn through the delay if animation hasn't started yet.
    if (!this.animatingProperty.value) {
      this.remainingDelay -= dt;
      dt = -this.remainingDelay; // record how far past the delay we go

      // Bail if we are not ready to start the animation
      if (this.remainingDelay > 0) {
        return this;
      }

      // Compute the start/end for each target, and determine the length of our animation
      this.length = this.duration;
      for (let i = 0; i < this.targets.length; i++) {
        const target = this.targets[i];
        target.computeStartEnd();

        // If we don't have a computed length yet, check all of our targets
        if (this.length === null) {
          this.length = target.getPreferredDuration();
        }
      }
      assert && assert(this.length !== null, 'After going through the targets, we should have a length by now');
      this.remainingAnimation = this.length;

      // Notify about the animation starting
      this.animatingProperty.value = true;
      this.beginEmitter.emit();
    }

    // Take our dt off of our remaining time
    this.remainingAnimation -= dt;
    dt = -this.remainingAnimation; // record how far past the animation we go

    assert && assert(this.length !== null);
    const ratio = this.length > 0 ? Utils.clamp((this.length - this.remainingAnimation) / this.length, 0, 1) : 1;
    for (let j = 0; j < this.targets.length; j++) {
      this.targets[j].update(ratio);
    }

    // Notification
    this.updateEmitter.emit();

    // Handle finishing the animation if it is over.
    if (ratio === 1) {
      this.animatingProperty.value = false;
      this.runningProperty.value = false;

      // Step into the next animation by the overflow time
      this.finishEmitter.emit(dt);
      this.endedEmitter.emit();
    }
    return this;
  }

  /**
   * After this animation is complete, the given animation will be started.
   *
   * @returns - Returns the passed-in animation so things can be chained nicely.
   */
  then(animation) {
    this.finishEmitter.addListener(dt => animation.start(dt));
    return animation;
  }
  dispose() {
    this.runningProperty.dispose();
    this.animatingProperty.dispose();
    this.startEmitter.dispose();
    this.beginEmitter.dispose();
    this.finishEmitter.dispose();
    this.stopEmitter.dispose();
    this.endedEmitter.dispose();
    this.updateEmitter.dispose();
    super.dispose();
  }
}
twixt.register('Animation', Animation);
export default Animation;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJFbWl0dGVyIiwic3RlcFRpbWVyIiwiVGlueUVtaXR0ZXIiLCJVdGlscyIsIm9wdGlvbml6ZSIsIkFuaW1hdGlvblRhcmdldCIsInR3aXh0IiwiRGlzcG9zYWJsZSIsIkFuaW1hdGlvbiIsImxlbmd0aCIsInJlbWFpbmluZ0RlbGF5IiwicmVtYWluaW5nQW5pbWF0aW9uIiwicnVubmluZ1Byb3BlcnR5IiwiYW5pbWF0aW5nUHJvcGVydHkiLCJzdGFydEVtaXR0ZXIiLCJiZWdpbkVtaXR0ZXIiLCJmaW5pc2hFbWl0dGVyIiwicGFyYW1ldGVycyIsInZhbHVlVHlwZSIsInN0b3BFbWl0dGVyIiwiZW5kZWRFbWl0dGVyIiwiaGFzTGlzdGVuZXJPcmRlckRlcGVuZGVuY2llcyIsInVwZGF0ZUVtaXR0ZXIiLCJjb25zdHJ1Y3RvciIsInByb3ZpZGVkQ29uZmlnIiwiY29uZmlnIiwidGFyZ2V0cyIsImR1cmF0aW9uIiwiZGVsYXkiLCJzdGVwRW1pdHRlciIsImFzc2VydCIsInByb3BlcnR5IiwidW5kZWZpbmVkIiwib2JqZWN0Iiwic2V0VmFsdWUiLCJpc0Zpbml0ZSIsIm1hcCIsIl8iLCJzdW0iLCJ0YXJnZXQiLCJoYXNQcmVmZXJyZWREdXJhdGlvbiIsInN0ZXBMaXN0ZW5lciIsInN0ZXAiLCJiaW5kIiwibGluayIsInJ1bm5pbmciLCJoYXNMaXN0ZW5lciIsImFkZExpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJkaXNwb3NlRW1pdHRlciIsInN0YXJ0IiwiZHQiLCJ2YWx1ZSIsImVtaXQiLCJzdG9wIiwiaSIsImNvbXB1dGVTdGFydEVuZCIsImdldFByZWZlcnJlZER1cmF0aW9uIiwicmF0aW8iLCJjbGFtcCIsImoiLCJ1cGRhdGUiLCJ0aGVuIiwiYW5pbWF0aW9uIiwiZGlzcG9zZSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiQW5pbWF0aW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEFuIGVhc2luZy1iYXNlZCBjb250cm9sbGFibGUgYW5pbWF0aW9uLlxyXG4gKlxyXG4gKiBXZSB1c2Ugc29tZSB0ZXJtaW5vbG9neSB0byBkZXNjcmliZSBwb2ludHMgYW5kIHJlZ2lvbnMgaW4gdGltZSBmb3IgYW4gYW5pbWF0aW9uOlxyXG4gKlxyXG4gKiAgICAgICAgICAgICBzdGFydHMgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmVnaW5zICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaW5pc2hlc1xyXG4gKiAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgZGVsYXkgICAgICAgICAgICAgICB8ICAgICAgICAgICAgIGFuaW1hdGlvbiAgICAgICAgICAgICAgICB8XHJcbiAqIHRpbWUtLT4gICAgICAgfCAgICAgICAgICAgKHdhaXRpbmcpICAgICAgICAgICAgIHwgICAgIChhbmltYXRlZCB2YWx1ZXMgY2hhbmdpbmcpICAgICAgIHxcclxuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAqICAgICAgICAgICAgICAgfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLXJ1bm5pbmctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLXxcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfC0tLS0tLS0tLS0tLS1hbmltYXRpbmctLS0tLS0tLS0tLS0tLS0tfFxyXG4gKlxyXG4gKiBUT0RPICMzOiBwYXVzZS9jYW5jZWwgKGFuZCBzdG9wLT5jYW5jZWwgcmVuYW1pbmcpXHJcbiAqIFRPRE8gIzM6IGZ1bmN0aW9uIGZvciBibGVuZGluZyB3aXRoIGFuZ3VsYXIvcm90YXRpb25hbCB2YWx1ZXNcclxuICogVE9ETyAjMzogY29uc2lkZXIga2V5ZnJhbWVkIGFuaW1hdGlvbiBoZWxwZXI/XHJcbiAqIFRPRE8gIzM6IEhvb2tzIGZvciBhdHRhY2hpbmcvZGV0YWNoaW5nIHN0ZXBwaW5nIHZpYSBzY3JlZW5zL25vZGVzXHJcbiAqIFRPRE8gIzM6IEFkZCBkb2N1bWVudGF0aW9uIGV4YW1wbGVzIChjb250aW5nZW50IG9uIGhvdyBzY3JlZW4vbm9kZSBob29rcyB3b3JrKVxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5cclxuaW1wb3J0IEJvb2xlYW5Qcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL0Jvb2xlYW5Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBFbWl0dGVyIGZyb20gJy4uLy4uL2F4b24vanMvRW1pdHRlci5qcyc7XHJcbmltcG9ydCBzdGVwVGltZXIgZnJvbSAnLi4vLi4vYXhvbi9qcy9zdGVwVGltZXIuanMnO1xyXG5pbXBvcnQgeyBUUmVhZE9ubHlFbWl0dGVyIH0gZnJvbSAnLi4vLi4vYXhvbi9qcy9URW1pdHRlci5qcyc7XHJcbmltcG9ydCBUaW55RW1pdHRlciBmcm9tICcuLi8uLi9heG9uL2pzL1RpbnlFbWl0dGVyLmpzJztcclxuaW1wb3J0IFV0aWxzIGZyb20gJy4uLy4uL2RvdC9qcy9VdGlscy5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBBbmltYXRpb25UYXJnZXQsIHsgQW5pbWF0aW9uVGFyZ2V0T3B0aW9ucyB9IGZyb20gJy4vQW5pbWF0aW9uVGFyZ2V0LmpzJztcclxuaW1wb3J0IHR3aXh0IGZyb20gJy4vdHdpeHQuanMnO1xyXG5pbXBvcnQgRGlzcG9zYWJsZSwgeyBEaXNwb3NhYmxlT3B0aW9ucyB9IGZyb20gJy4uLy4uL2F4b24vanMvRGlzcG9zYWJsZS5qcyc7XHJcblxyXG50eXBlIFNlbGZPcHRpb25zPFRhcmdldFR5cGVzLCBUYXJnZXRPYmplY3RUeXBlcyBleHRlbmRzIHsgW0sgaW4ga2V5b2YgVGFyZ2V0VHlwZXNdOiB1bmtub3duIH0+ID0ge1xyXG4gIC8vIENhbiBiZSBwcm92aWRlZCBpbnN0ZWFkIG9mIHNldFZhbHVlL3Byb3BlcnR5L29iamVjdCwgYW5kIGl0IGNvbnRhaW5zIGFuIGFycmF5IG9mIGNvbmZpZy1zdHlsZSBvYmplY3RzIHRoYXQgYWxsb3dzXHJcbiAgLy8gYW5pbWF0aW5nIG11bHRpcGxlIGRpZmZlcmVudCB0aGluZ3MgYXQgdGhlIHNhbWUgdGltZS4gU2VlIEFuaW1hdGlvblRhcmdldCBmb3IgZGV0YWlscyBhYm91dCBhbGwgb2YgdGhlIHN1cHBvcnRlZFxyXG4gIC8vIGNvbmZpZy5cclxuICAvLyBOT1RFOiBzcGVlZCwgaWYgcHJvdmlkZWQsIHNob3VsZCBiZSBvbmx5IHNwZWNpZmllZCBvbiBleGFjdGx5IG9uZSBvZiB0aGUgdGFyZ2V0cycgY29uZmlnIGlmIG11bHRpcGxlIHRhcmdldHNcclxuICAvLyBhcmUgc3BlY2lmaWVkLlxyXG4gIHRhcmdldHM/OiB7IFtLIGluIGtleW9mIFRhcmdldFR5cGVzXTogQW5pbWF0aW9uVGFyZ2V0T3B0aW9uczxUYXJnZXRUeXBlc1tLXSwgVGFyZ2V0T2JqZWN0VHlwZXNbS10+IH0gfCBudWxsO1xyXG5cclxuICAvLyBJZiBwcm92aWRlZCwgdGhlIGFuaW1hdGlvbidzIGxlbmd0aCB3aWxsIGJlIHRoaXMgdmFsdWUgKGluIHNlY29uZHMpLiBJZiBvbWl0dGVkLCBvbmUgb2YgdGhlIHRhcmdldHMnIGBzcGVlZGAgb3B0aW9uXHJcbiAgLy8gc2hvdWxkIGJlIHNldCAodGhlIGxlbmd0aCBvZiB0aGUgYW5pbWF0aW9uIHdpbGwgYmUgYmFzZWQgb24gdGhhdCkuXHJcbiAgZHVyYXRpb24/OiBudW1iZXIgfCBudWxsO1xyXG5cclxuICAvLyBUaGUgYW1vdW50IG9mIHRpbWUgKGluIHNlY29uZHMpIGJldHdlZW4gd2hlbiB0aGUgYW5pbWF0aW9uIGlzIFwic3RhcnRlZFwiIGFuZCB3aGVuIHRoZSBhY3R1YWwgYW5pbWF0aW9uIG9mIHRoZSB2YWx1ZVxyXG4gIC8vIGJlZ2lucy4gTmVnYXRpdmUgZGVsYXlzIGFyZSBub3Qgc3VwcG9ydGVkLlxyXG4gIGRlbGF5PzogbnVtYmVyO1xyXG5cclxuICAvLyBPbmUgb2YgdGhlIGZvbGxvd2luZyBjb25maWc6XHJcbiAgLy8gVGhlIEVtaXR0ZXIgKHdoaWNoIHByb3ZpZGVzIGEgZHQge251bWJlcn0gdmFsdWUgb24gZW1pdCkgd2hpY2ggZHJpdmVzIHRoZSBhbmltYXRpb24sIG9yIG51bGwgaWYgdGhlIGNsaWVudFxyXG4gIC8vIHdpbGwgZHJpdmUgdGhlIGFuaW1hdGlvbiBieSBjYWxsaW5nIGBzdGVwKGR0KWAgbWFudWFsbHkuICBEZWZhdWx0cyB0byB0aGUgam9pc3QgVGltZXIgd2hpY2ggcnVucyBhdXRvbWF0aWNhbGx5XHJcbiAgLy8gYXMgcGFydCBvZiB0aGUgU2ltIHRpbWUgc3RlcC5cclxuICAvLyBUT0RPICMzOiB7U2NyZWVuVmlld30gLSBhbmltYXRlcyBvbmx5IHdoZW4gdGhlIFNjcmVlblZpZXcgaXMgdGhlIGFjdGl2ZSBvbmUuXHJcbiAgLy8gVE9ETyAjMzoge05vZGV9IC0gYW5pbWF0ZXMgb25seSB3aGVuIHRoZSBub2RlJ3MgdHJhaWwgaXMgdmlzaWJsZSBvbiBhIERpc3BsYXlcclxuICBzdGVwRW1pdHRlcj86IFRSZWFkT25seUVtaXR0ZXI8WyBudW1iZXIgXT4gfCBudWxsO1xyXG59O1xyXG5cclxuLy8gSU1QT1JUQU5UOiBTZWUgQW5pbWF0aW9uVGFyZ2V0J3MgY29uZmlnIGRvY3VtZW50YXRpb24sIGFzIHRob3NlIGNvbmZpZyBjYW4gYmUgcGFzc2VkIGluIGVpdGhlciBoZXJlLCBvciBpblxyXG4vLyB0aGUgdGFyZ2V0cyBhcnJheS5cclxuZXhwb3J0IHR5cGUgQW5pbWF0aW9uT3B0aW9uczxTZWxmVHlwZSA9IHVua25vd24sIFNlbGZPYmplY3RUeXBlID0gdW5rbm93biwgVGFyZ2V0VHlwZXMgPSB1bmtub3duW10sIFRhcmdldE9iamVjdFR5cGVzIGV4dGVuZHMgeyBbSyBpbiBrZXlvZiBUYXJnZXRUeXBlc106IHVua25vd24gfSA9IHsgW0sgaW4ga2V5b2YgVGFyZ2V0VHlwZXNdOiB1bmtub3duIH0+ID1cclxuICBTZWxmT3B0aW9uczxUYXJnZXRUeXBlcywgVGFyZ2V0T2JqZWN0VHlwZXM+ICZcclxuICBBbmltYXRpb25UYXJnZXRPcHRpb25zPFNlbGZUeXBlLCBTZWxmT2JqZWN0VHlwZT4gJlxyXG4gIERpc3Bvc2FibGVPcHRpb25zO1xyXG5cclxuY2xhc3MgQW5pbWF0aW9uPFNlbGZUeXBlID0gdW5rbm93biwgU2VsZk9iamVjdFR5cGUgPSB1bmtub3duLCBUYXJnZXRUeXBlcyA9IHVua25vd25bXSwgVGFyZ2V0T2JqZWN0VHlwZXMgZXh0ZW5kcyB7IFtLIGluIGtleW9mIFRhcmdldFR5cGVzXTogdW5rbm93biB9ID0geyBbSyBpbiBrZXlvZiBUYXJnZXRUeXBlc106IHVua25vd24gfT4gZXh0ZW5kcyBEaXNwb3NhYmxlIHtcclxuXHJcbiAgLy8gQWxsIG9mIHRoZSBkaWZmZXJlbnQgdmFsdWVzIHRoYXQgd2lsbCBiZSBhbmltYXRlZCBieSB0aGlzIGFuaW1hdGlvbi5cclxuICAvLyBJZiBjb25maWcudGFyZ2V0cyB3YXMgc3VwcGxpZWQsIHRob3NlIHRhcmdldHMgd2lsbCBiZSB3cmFwcGVkIGludG8gQW5pbWF0aW9uVGFyZ2V0c1xyXG4gIC8vIElmIGNvbmZpZy50YXJnZXRzIHdhcyBub3Qgc3VwcGxpZWQsIHRoZSBjb25maWcgZnJvbSB0aGlzIG9iamVjdCB3aWxsIGJlIHdyYXBwZWQgaW50byBvbmUgQW5pbWF0aW9uVGFyZ2V0XHJcbiAgcHJpdmF0ZSByZWFkb25seSB0YXJnZXRzOiBBbmltYXRpb25UYXJnZXQ8dW5rbm93bj5bXTtcclxuXHJcbiAgLy8gU2F2ZWQgY29uZmlnIHRvIGhlbHAgZGV0ZXJtaW5lIHRoZSBsZW5ndGggb2YgdGhlIGFuaW1hdGlvblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgZHVyYXRpb246IG51bWJlciB8IG51bGw7XHJcblxyXG4gIC8vIEluIHNlY29uZHNcclxuICBwcml2YXRlIHJlYWRvbmx5IGRlbGF5OiBudW1iZXI7XHJcblxyXG4gIC8vIENvbXB1dGVkIGxlbmd0aCBmb3IgdGhlIGFuaW1hdGlvbiAoaW4gc2Vjb25kcylcclxuICBwcml2YXRlIGxlbmd0aDogbnVtYmVyIHwgbnVsbCA9IDA7XHJcblxyXG4gIC8vIExlbmd0aCBvZiB0aW1lIHJlbWFpbmluZyBpbiB0aGUgXCJkZWxheVwiIHBvcnRpb24uIENvbXB1dGVkIGFmdGVyIHRoZSBhbmltYXRpb24gaXMgc3RhcnRlZCwgYW5kIG9ubHkgdXNlZCB1bnRpbCB0aGVcclxuICAvLyBhbmltYXRpb24gXCJiZWdpbnNcIi5cclxuICBwcml2YXRlIHJlbWFpbmluZ0RlbGF5ID0gMDtcclxuXHJcbiAgLy8gTGVuZ3RoIG9mIHRpbWUgcmVtYWluaW5nIGluIHRoZSBhY3R1YWwgYW5pbWF0aW9uIChhZnRlciB0aGUgZGVsYXkpIHBvcnRpb24uIENvbXB1dGVkIGFmdGVyIHRoZSBkZWxheSBoYXMgcGFzc2VkLFxyXG4gIC8vIGFuZCBvbmx5IHVzZWQgdW50aWwgdGhlIGFuaW1hdGlvbiBcImVuZHNcIi5cclxuICBwcml2YXRlIHJlbWFpbmluZ0FuaW1hdGlvbiA9IDA7XHJcblxyXG4gIC8vIFRydWUgd2hpbGUgdGhlIGFuaW1hdGlvbiBpcyBiZWluZyBzdGVwcGVkIHRocm91Z2ggKGJvdGggdGhlIGRlbGF5IHBvcnRpb24gQU5EIHRoZSBhY3R1YWwgYW5pbWF0aW9uIHBvcnRpb24pLlxyXG4gIHB1YmxpYyByZWFkb25seSBydW5uaW5nUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCBmYWxzZSApO1xyXG5cclxuICAvLyBUcnVlIHdoaWxlIHRoZSBhbmltYXRpb24gaXMgYWN0dWFsbHkgY2hhbmdpbmcgdGhlIHZhbHVlIChmYWxzZSB3aGlsZSB3YWl0aW5nIGZvciB0aGUgZGVsYXksIG9yIHdoaWxlIHRoZSBhbmltYXRpb25cclxuICAvLyBpcyBub3QgcnVubmluZyBhdCBhbGwpLlxyXG4gIHB1YmxpYyByZWFkb25seSBhbmltYXRpbmdQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIGZhbHNlICk7XHJcblxyXG4gIC8vIEZpcmVkIHdoZW4gdGhlIGFuaW1hdGlvbiBpcyBcInN0YXJ0ZWRcIiAoaS5lLiB3aGVuIHN0YXJ0KCkgaXMgY2FsbGVkIGFuZCB0aGUgZGVsYXksIGlmIG9uZSBpcyB0aGVyZSwgc3RhcnRzKS5cclxuICBwdWJsaWMgcmVhZG9ubHkgc3RhcnRFbWl0dGVyID0gbmV3IEVtaXR0ZXIoKTtcclxuXHJcbiAgLy8gRmlyZWQgd2hlbiB0aGUgYWN0dWFsIGFuaW1hdGlvbiBvZiB0aGUgdmFsdWUgYmVnaW5zIChpLmUuIHdoZW4gdGhlIGRlbGF5IGZpbmlzaGVzIGFuZCB0aGUgYWN0dWFsIGFuaW1hdGlvbiBiZWdpbnMpLlxyXG4gIHB1YmxpYyByZWFkb25seSBiZWdpbkVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpO1xyXG5cclxuICAvLyBGaXJlZCB3aGVuIHRoZSBhbmltYXRpb24gZmluaXNoZXMgbmF0dXJhbGx5ICh3YXMgbm90IGFibm9ybWFsbHkgc3RvcHBlZCkuIEEge251bWJlcn0gaXMgcHJvdmlkZWQgYXMgYSBzaW5nbGVcclxuICAvLyBhcmd1bWVudCB0byB0aGUgZW1pdCBjYWxsYmFjaywgYW5kIHJlcHJlc2VudHMgaG93IG11Y2ggXCJleHRyYVwiIHRpbWUgb2NjdXJyZWQgYWZ0ZXIgdGhlIGVuZCBvZiB0aGUgYW5pbWF0aW9uLiBGb3JcclxuICAvLyBleGFtcGxlLCBpZiB5b3UgaGF2ZSBhIDEtc2Vjb25kIGFuaW1hdGlvbiBhbmQgc3RlcHBlZCBpdCBieSAzIHNlY29uZHMsIHRoaXMgZmluaXNoZWQgZW1pdHRlciB3b3VsZCBiZSBjYWxsZWQgd2l0aFxyXG4gIC8vIDIgc2Vjb25kcy5cclxuICBwdWJsaWMgcmVhZG9ubHkgZmluaXNoRW1pdHRlciA9IG5ldyBFbWl0dGVyPFsgbnVtYmVyIF0+KCB7IHBhcmFtZXRlcnM6IFsgeyB2YWx1ZVR5cGU6ICdudW1iZXInIH0gXSB9ICk7XHJcblxyXG4gIC8vIEZpcmVkIHdoZW4gdGhlIGFuaW1hdGlvbiBpcyBtYW51YWxseSBzdG9wcGVkICh3aXRoIHN0b3AoKSkuIERvZXMgTk9UIGZpcmUgd2hlbiBpdCBmaW5pc2hlcyBub3JtYWxseS5cclxuICBwdWJsaWMgcmVhZG9ubHkgc3RvcEVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpO1xyXG5cclxuICAvLyBGaXJlZCB3aGVuIHRoZSBhbmltYXRpb24gZW5kcywgcmVnYXJkbGVzcyBvZiB3aGV0aGVyIGl0IGZ1bGx5IGZpbmlzaGVkLCBvciB3YXMgc3RvcHBlZCBwcmVtYXR1cmVseS5cclxuICBwdWJsaWMgcmVhZG9ubHkgZW5kZWRFbWl0dGVyID0gbmV3IEVtaXR0ZXIoIHsgaGFzTGlzdGVuZXJPcmRlckRlcGVuZGVuY2llczogdHJ1ZSB9ICk7IC8vIFRPRE86IGxpc3RlbmVyIG9yZGVyIGRlcGVuZGVuY2llcyBpbiBzaG91bGQgYmUgZGVhbHQgd2l0aCwgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2ZyYWN0aW9uLW1hdGNoZXIvaXNzdWVzLzExMFxyXG5cclxuICAvLyBGaXJlZCB3aGVuIChqdXN0IGFmdGVyKSB0aGUgYW5pbWF0aW9uIGhhcyBjaGFuZ2VkIGFuaW1hdGVkIHZhbHVlcy90YXJnZXRzLlxyXG4gIHB1YmxpYyByZWFkb25seSB1cGRhdGVFbWl0dGVyID0gbmV3IEVtaXR0ZXIoKTtcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGNvbnN0cnVjdG9yIGNvbmZpZyB3aWxsIGRlZmluZSBvbmUgb3IgbW9yZSBhbmltYXRpb24gXCJ0YXJnZXRzXCIgKHNwZWNpZmljIHZhbHVlcyB0byBiZSBhbmltYXRlZCkuIFRoZSBjb25maWdcclxuICAgKiBhdmFpbGFibGUgZm9yIHRhcmdldHMgaXMgZG9jdW1lbnRlZCBpbiBBbmltYXRpb25UYXJnZXQuXHJcbiAgICpcclxuICAgKiBJZiB0aGVyZSBpcyBvbmx5IG9uZSB0YXJnZXQsIGl0IGlzIHJlY29tbWVuZGVkIHRvIHBhc3MgaW4gdGhvc2UgY29uZmlnIGluIHRoZSB0b3AtbGV2ZWwgQW5pbWF0aW9uIGNvbmZpZywgZS5nLjpcclxuICAgKiB8IHZhciBzb21lTnVtYmVyUHJvcGVydHkgPSBuZXcgTnVtYmVyUHJvcGVydHkoIDAgKTtcclxuICAgKiB8IG5ldyBBbmltYXRpb24oIHtcclxuICAgKiB8ICAgLy8gT3B0aW9ucyBmb3IgdGhlIEFuaW1hdGlvbiBhcyBhIHdob2xlXHJcbiAgICogfCAgIGR1cmF0aW9uOiAyLFxyXG4gICAqIHxcclxuICAgKiB8ICAgLy8gT3B0aW9ucyBmb3IgdGhlIG9uZSB0YXJnZXQgdG8gY2hhbmdlXHJcbiAgICogfCAgIHByb3BlcnR5OiBzb21lTnVtYmVyUHJvcGVydHksXHJcbiAgICogfCAgIHRvOiA1XHJcbiAgICogfCB9ICk7XHJcbiAgICpcclxuICAgKiBIb3dldmVyIG11bHRpcGxlIGRpZmZlcmVudCB0YXJnZXRzIGFyZSBzdXBwb3J0ZWQsIGFuZCBzaG91bGQgYmUgc3BlY2lmaWVkIGluIHRoZSBgdGFyZ2V0c2Agb3B0aW9uOlxyXG4gICAqIHwgdmFyIHNvbWVOdW1iZXJQcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggMTAwICk7XHJcbiAgICogfCB2YXIgc29tZU9iamVjdCA9IHsgc29tZUF0dHJpYnV0ZTogbmV3IFZlY3RvcjIoIDEwMCwgNSApIH07XHJcbiAgICogfCBuZXcgQW5pbWF0aW9uKCB7XHJcbiAgICogfCAgIC8vIE9wdGlvbnMgZm9yIHRoZSBBbmltYXRpb24gYXMgYSB3aG9sZVxyXG4gICAqIHwgICBkdXJhdGlvbjogMixcclxuICAgKiB8XHJcbiAgICogfCAgIHRhcmdldHM6IFsge1xyXG4gICAqIHwgICAgIC8vIEZpcnN0IHRhcmdldFxyXG4gICAqIHwgICAgIHByb3BlcnR5OiBzb21lTnVtYmVyUHJvcGVydHksXHJcbiAgICogfCAgICAgdG86IDVcclxuICAgKiB8ICAgfSwge1xyXG4gICAqIHwgICAgIC8vIFNlY29uZCB0YXJnZXRcclxuICAgKiB8ICAgICBvYmplY3Q6IHNvbWVPYmplY3QsXHJcbiAgICogfCAgICAgYXR0cmlidXRlOiAnc29tZUF0dHJpYnV0ZScsXHJcbiAgICogfCAgICAgdG86IG5ldyBWZWN0b3IyKCA1MCwgMTAgKVxyXG4gICAqIHwgICB9IF1cclxuICAgKiB8IH0gKTtcclxuICAgKlxyXG4gICAqIE5PVEU6IFRoZSBsZW5ndGggb2YgdGhlIGFuaW1hdGlvbiBuZWVkcyB0byBiZSBzcGVjaWZpZWQgaW4gZXhhY3RseSBvbmUgcGxhY2UuIFRoaXMgY2FuIHVzdWFsbHkgYmUgZG9uZSBieVxyXG4gICAqIHNwZWNpZnlpbmcgdGhlIGBkdXJhdGlvbmAgaW4gdGhlIGNvbmZpZywgYnV0IGBzcGVlZGAgY2FuIGFsc28gYmUgdXNlZCBpbiBhbnkgb2YgdGhlIHRhcmdldHMuXHJcbiAgICpcclxuICAgKiBFWEFNUExFOiBJdCdzIHBvc3NpYmxlIHRvIGNyZWF0ZSBjb250aW51b3VzIGFuaW1hdGlvbiBsb29wcywgd2hlcmUgYW5pbWF0aW9ucyBjeWNsZSBiYWNrIGFuZCBmb3J0aCwgZS5nLjpcclxuICAgKiB8IHZhciBtb3JlT3BhcXVlID0gbmV3IEFuaW1hdGlvbigge1xyXG4gICAqIHwgICBvYmplY3Q6IGFuaW1hdGVkQ2lyY2xlLFxyXG4gICAqIHwgICBhdHRyaWJ1dGU6ICdvcGFjaXR5JyxcclxuICAgKiB8ICAgZnJvbTogMC41LFxyXG4gICAqIHwgICB0bzogMSxcclxuICAgKiB8ICAgZHVyYXRpb246IDAuNSxcclxuICAgKiB8ICAgZWFzaW5nOiBFYXNpbmcuUVVBRFJBVElDX0lOX09VVFxyXG4gICAqIHwgfSApO1xyXG4gICAqIHwgdmFyIGxlc3NPcGFxdWUgPSBuZXcgQW5pbWF0aW9uKCB7XHJcbiAgICogfCAgIG9iamVjdDogYW5pbWF0ZWRDaXJjbGUsXHJcbiAgICogfCAgIGF0dHJpYnV0ZTogJ29wYWNpdHknLFxyXG4gICAqIHwgICBmcm9tOiAxLFxyXG4gICAqIHwgICB0bzogMC41LFxyXG4gICAqIHwgICBkdXJhdGlvbjogMC41LFxyXG4gICAqIHwgICBlYXNpbmc6IEVhc2luZy5RVUFEUkFUSUNfSU5fT1VUXHJcbiAgICogfCB9ICk7XHJcbiAgICogfCBtb3JlT3BhcXVlLnRoZW4oIGxlc3NPcGFxdWUgKTtcclxuICAgKiB8IGxlc3NPcGFxdWUudGhlbiggbW9yZU9wYXF1ZSApO1xyXG4gICAqIHwgbGVzc09wYXF1ZS5zdGFydCgpO1xyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggcHJvdmlkZWRDb25maWc6IEFuaW1hdGlvbk9wdGlvbnM8U2VsZlR5cGUsIFNlbGZPYmplY3RUeXBlLCBUYXJnZXRUeXBlcywgVGFyZ2V0T2JqZWN0VHlwZXM+ICkge1xyXG5cclxuICAgIGNvbnN0IGNvbmZpZyA9IG9wdGlvbml6ZTxBbmltYXRpb25PcHRpb25zPFNlbGZUeXBlLCBTZWxmT2JqZWN0VHlwZSwgVGFyZ2V0VHlwZXMsIFRhcmdldE9iamVjdFR5cGVzPiwgU2VsZk9wdGlvbnM8VGFyZ2V0VHlwZXMsIFRhcmdldE9iamVjdFR5cGVzPiwgRGlzcG9zYWJsZU9wdGlvbnM+KCkoIHtcclxuICAgICAgdGFyZ2V0czogbnVsbCxcclxuICAgICAgZHVyYXRpb246IG51bGwsXHJcbiAgICAgIGRlbGF5OiAwLFxyXG4gICAgICBzdGVwRW1pdHRlcjogc3RlcFRpbWVyXHJcbiAgICB9LCBwcm92aWRlZENvbmZpZyApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICsoIGNvbmZpZy5wcm9wZXJ0eSAhPT0gdW5kZWZpbmVkICkgKyArKCBjb25maWcub2JqZWN0ICE9PSB1bmRlZmluZWQgKSArICsoIGNvbmZpZy5zZXRWYWx1ZSAhPT0gdW5kZWZpbmVkICkgKyArKCBjb25maWcudGFyZ2V0cyAhPT0gbnVsbCApID09PSAxLFxyXG4gICAgICAnU2hvdWxkIGhhdmUgb25lIChhbmQgb25seSBvbmUpIHdheSBvZiBkZWZpbmluZyBob3cgdG8gc2V0IHRoZSBhbmltYXRlZCB2YWx1ZS4gVXNlIG9uZSBvZiBwcm9wZXJ0eS9vYmplY3Qvc2V0VmFsdWUvdGFyZ2V0cycgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2YgY29uZmlnLmRlbGF5ID09PSAnbnVtYmVyJyAmJiBpc0Zpbml0ZSggY29uZmlnLmRlbGF5ICkgJiYgY29uZmlnLmRlbGF5ID49IDAsXHJcbiAgICAgICdUaGUgZGVsYXkgc2hvdWxkIGJlIGEgbm9uLW5lZ2F0aXZlIG51bWJlci4nICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggY29uZmlnLnN0ZXBFbWl0dGVyID09PSBudWxsIHx8IGNvbmZpZy5zdGVwRW1pdHRlciBpbnN0YW5jZW9mIEVtaXR0ZXIgfHwgY29uZmlnLnN0ZXBFbWl0dGVyIGluc3RhbmNlb2YgVGlueUVtaXR0ZXIsXHJcbiAgICAgICdzdGVwRW1pdHRlciBtdXN0IGJlIG51bGwgb3IgYW4gKFRpbnkpRW1pdHRlcicgKTtcclxuXHJcbiAgICBzdXBlciggY29uZmlnICk7XHJcblxyXG4gICAgdGhpcy50YXJnZXRzID0gKCAoIGNvbmZpZy50YXJnZXRzID09PSBudWxsID8gWyBjb25maWcgXSA6IGNvbmZpZy50YXJnZXRzICkgYXMgQW5pbWF0aW9uVGFyZ2V0T3B0aW9uc1tdICkubWFwKCBjb25maWcgPT4ge1xyXG4gICAgICByZXR1cm4gbmV3IEFuaW1hdGlvblRhcmdldCggY29uZmlnICk7IC8vIFRPRE8gIzM6IHN0cmlwIG91dCB0aGUgaXJyZWxldmFudCBjb25maWcgd2hlbiB1c2luZyBjb25maWcgYXJnXHJcbiAgICB9ICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggKyggY29uZmlnLmR1cmF0aW9uICE9PSBudWxsICkgKyBfLnN1bSggXy5tYXAoIHRoaXMudGFyZ2V0cyxcclxuICAgICAgdGFyZ2V0ID0+IHRhcmdldC5oYXNQcmVmZXJyZWREdXJhdGlvbigpID8gMSA6IDBcclxuICAgICkgKSA9PT0gMSwgJ0V4YWN0bHkgb25lIGR1cmF0aW9uL3NwZWVkIG9wdGlvbiBzaG91bGQgYmUgdXNlZC4nICk7XHJcblxyXG4gICAgdGhpcy5kdXJhdGlvbiA9IGNvbmZpZy5kdXJhdGlvbjtcclxuICAgIHRoaXMuZGVsYXkgPSBjb25maWcuZGVsYXk7XHJcblxyXG4gICAgLy8gV2lyZSB1cCB0byB0aGUgcHJvdmlkZWQgRW1pdHRlciwgaWYgYW55LiBXaGVuZXZlciB0aGlzIGFuaW1hdGlvbiBpcyBzdGFydGVkLCBpdCB3aWxsIGFkZCBhIGxpc3RlbmVyIHRvIHRoZSBUaW1lclxyXG4gICAgLy8gKGFuZCBjb252ZXJzZWx5LCB3aWxsIGJlIHJlbW92ZWQgd2hlbiBzdG9wcGVkKS4gVGhpcyBtZWFucyBpdCB3aWxsIGFuaW1hdGUgd2l0aCB0aGUgdGltZXIsIGJ1dCB3aWxsIG5vdCBsZWFrXHJcbiAgICAvLyBtZW1vcnkgYXMgbG9uZyBhcyB0aGUgYW5pbWF0aW9uIGRvZXNuJ3QgbGFzdCBmb3JldmVyLlxyXG4gICAgY29uc3Qgc3RlcEVtaXR0ZXIgPSBjb25maWcuc3RlcEVtaXR0ZXI7XHJcbiAgICBpZiAoIHN0ZXBFbWl0dGVyICkge1xyXG4gICAgICBjb25zdCBzdGVwTGlzdGVuZXIgPSB0aGlzLnN0ZXAuYmluZCggdGhpcyApO1xyXG5cclxuICAgICAgdGhpcy5ydW5uaW5nUHJvcGVydHkubGluayggcnVubmluZyA9PiB7XHJcbiAgICAgICAgaWYgKCBydW5uaW5nICYmICFzdGVwRW1pdHRlci5oYXNMaXN0ZW5lciggc3RlcExpc3RlbmVyICkgKSB7XHJcbiAgICAgICAgICBzdGVwRW1pdHRlci5hZGRMaXN0ZW5lciggc3RlcExpc3RlbmVyICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCAhcnVubmluZyAmJiBzdGVwRW1pdHRlci5oYXNMaXN0ZW5lciggc3RlcExpc3RlbmVyICkgKSB7XHJcbiAgICAgICAgICBzdGVwRW1pdHRlci5yZW1vdmVMaXN0ZW5lciggc3RlcExpc3RlbmVyICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICB0aGlzLmRpc3Bvc2VFbWl0dGVyLmFkZExpc3RlbmVyKCAoKSA9PiB7XHJcbiAgICAgICAgc3RlcEVtaXR0ZXIuaGFzTGlzdGVuZXIoIHN0ZXBMaXN0ZW5lciApICYmIHN0ZXBFbWl0dGVyLnJlbW92ZUxpc3RlbmVyKCBzdGVwTGlzdGVuZXIgKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU3RhcnRzIHRoZSBhbmltYXRpb24gKG9yIGlmIGl0IGhhcyBhIGRlbGF5LCBzZXRzIHRoZSBhbmltYXRpb24gdG8gc3RhcnQgYWZ0ZXIgdGhhdCBkZWxheSkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gW2R0XSAtIElmIHByb3ZpZGVkLCBzdGVwIHRoaXMgZmFyIGludG8gdGhlIGFuaW1hdGlvbiBpbml0aWFsbHkuICBVc2VkIGZvciBjaGFpbmluZyBhbmltYXRpb25zLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGFydCggZHQ/OiBudW1iZXIgKTogdGhpcyB7XHJcbiAgICAvLyBJZiB3ZSBhcmUgYWxyZWFkeSBhbmltYXRpbmcsIGRvIG5vdGhpbmdcclxuICAgIGlmICggdGhpcy5ydW5uaW5nUHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFRoZSByZW1haW5pbmcgZGVsYXkgbmVlZHMgdG8gYmUgdmFsaWQgaW1tZWRpYXRlbHkgYWZ0ZXIgc3RhcnQgaXMgY2FsbGVkLlxyXG4gICAgdGhpcy5yZW1haW5pbmdEZWxheSA9IHRoaXMuZGVsYXk7XHJcblxyXG4gICAgLy8gTm90aWZpY2F0aW9uc1xyXG4gICAgdGhpcy5ydW5uaW5nUHJvcGVydHkudmFsdWUgPSB0cnVlO1xyXG4gICAgdGhpcy5zdGFydEVtaXR0ZXIuZW1pdCgpO1xyXG5cclxuICAgIC8vIFNldCB1cCBpbml0aWFsIHN0YXRlIGFuZCB2YWx1ZVxyXG4gICAgdGhpcy5zdGVwKCBkdCAhPT0gdW5kZWZpbmVkID8gZHQgOiAwICk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTdG9wcyB0aGUgYW5pbWF0aW9uIChvciBpZiB3YWl0aW5nIGZvciB0aGUgZGVsYXksIHdpbGwgbm90IFwic3RhcnRcIiB0aGUgYW5pbWF0aW9uKS5cclxuICAgKi9cclxuICBwdWJsaWMgc3RvcCgpOiB0aGlzIHtcclxuICAgIC8vIElmIHdlIGFyZSBub3QgYWxyZWFkeSBhbmltYXRpbmcsIGRvIG5vdGhpbmdcclxuICAgIGlmICggIXRoaXMucnVubmluZ1Byb3BlcnR5LnZhbHVlICkge1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICAvLyBOb3RpZmljYXRpb25zXHJcbiAgICB0aGlzLnJ1bm5pbmdQcm9wZXJ0eS52YWx1ZSA9IGZhbHNlO1xyXG4gICAgdGhpcy5zdG9wRW1pdHRlci5lbWl0KCk7XHJcbiAgICB0aGlzLmVuZGVkRW1pdHRlci5lbWl0KCk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTdGVwcyB0aGUgYW5pbWF0aW9uIGZvcndhcmQgYnkgYSBjZXJ0YWluIGFtb3VudCBvZiB0aW1lLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGR0IC0gSW4gc2Vjb25kc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGVwKCBkdDogbnVtYmVyICk6IHRoaXMge1xyXG5cclxuICAgIC8vIElnbm9yZSB0aGUgc3RlcCBpZiBvdXIgYW5pbWF0aW9uIGlzIG5vdCBydW5uaW5nXHJcbiAgICBpZiAoICF0aGlzLnJ1bm5pbmdQcm9wZXJ0eS52YWx1ZSApIHtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRmlyc3QsIGJ1cm4gdGhyb3VnaCB0aGUgZGVsYXkgaWYgYW5pbWF0aW9uIGhhc24ndCBzdGFydGVkIHlldC5cclxuICAgIGlmICggIXRoaXMuYW5pbWF0aW5nUHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgIHRoaXMucmVtYWluaW5nRGVsYXkgLT0gZHQ7XHJcbiAgICAgIGR0ID0gLXRoaXMucmVtYWluaW5nRGVsYXk7IC8vIHJlY29yZCBob3cgZmFyIHBhc3QgdGhlIGRlbGF5IHdlIGdvXHJcblxyXG4gICAgICAvLyBCYWlsIGlmIHdlIGFyZSBub3QgcmVhZHkgdG8gc3RhcnQgdGhlIGFuaW1hdGlvblxyXG4gICAgICBpZiAoIHRoaXMucmVtYWluaW5nRGVsYXkgPiAwICkge1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBDb21wdXRlIHRoZSBzdGFydC9lbmQgZm9yIGVhY2ggdGFyZ2V0LCBhbmQgZGV0ZXJtaW5lIHRoZSBsZW5ndGggb2Ygb3VyIGFuaW1hdGlvblxyXG4gICAgICB0aGlzLmxlbmd0aCA9IHRoaXMuZHVyYXRpb247XHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMudGFyZ2V0cy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICBjb25zdCB0YXJnZXQgPSB0aGlzLnRhcmdldHNbIGkgXTtcclxuICAgICAgICB0YXJnZXQuY29tcHV0ZVN0YXJ0RW5kKCk7XHJcblxyXG4gICAgICAgIC8vIElmIHdlIGRvbid0IGhhdmUgYSBjb21wdXRlZCBsZW5ndGggeWV0LCBjaGVjayBhbGwgb2Ygb3VyIHRhcmdldHNcclxuICAgICAgICBpZiAoIHRoaXMubGVuZ3RoID09PSBudWxsICkge1xyXG4gICAgICAgICAgdGhpcy5sZW5ndGggPSB0YXJnZXQuZ2V0UHJlZmVycmVkRHVyYXRpb24oKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5sZW5ndGggIT09IG51bGwsICdBZnRlciBnb2luZyB0aHJvdWdoIHRoZSB0YXJnZXRzLCB3ZSBzaG91bGQgaGF2ZSBhIGxlbmd0aCBieSBub3cnICk7XHJcbiAgICAgIHRoaXMucmVtYWluaW5nQW5pbWF0aW9uID0gdGhpcy5sZW5ndGghO1xyXG5cclxuICAgICAgLy8gTm90aWZ5IGFib3V0IHRoZSBhbmltYXRpb24gc3RhcnRpbmdcclxuICAgICAgdGhpcy5hbmltYXRpbmdQcm9wZXJ0eS52YWx1ZSA9IHRydWU7XHJcbiAgICAgIHRoaXMuYmVnaW5FbWl0dGVyLmVtaXQoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUYWtlIG91ciBkdCBvZmYgb2Ygb3VyIHJlbWFpbmluZyB0aW1lXHJcbiAgICB0aGlzLnJlbWFpbmluZ0FuaW1hdGlvbiAtPSBkdDtcclxuICAgIGR0ID0gLXRoaXMucmVtYWluaW5nQW5pbWF0aW9uOyAvLyByZWNvcmQgaG93IGZhciBwYXN0IHRoZSBhbmltYXRpb24gd2UgZ29cclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmxlbmd0aCAhPT0gbnVsbCApO1xyXG4gICAgY29uc3QgcmF0aW8gPSB0aGlzLmxlbmd0aCEgPiAwID8gVXRpbHMuY2xhbXAoICggdGhpcy5sZW5ndGghIC0gdGhpcy5yZW1haW5pbmdBbmltYXRpb24gKSAvIHRoaXMubGVuZ3RoISwgMCwgMSApIDogMTtcclxuICAgIGZvciAoIGxldCBqID0gMDsgaiA8IHRoaXMudGFyZ2V0cy5sZW5ndGg7IGorKyApIHtcclxuICAgICAgdGhpcy50YXJnZXRzWyBqIF0udXBkYXRlKCByYXRpbyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE5vdGlmaWNhdGlvblxyXG4gICAgdGhpcy51cGRhdGVFbWl0dGVyLmVtaXQoKTtcclxuXHJcbiAgICAvLyBIYW5kbGUgZmluaXNoaW5nIHRoZSBhbmltYXRpb24gaWYgaXQgaXMgb3Zlci5cclxuICAgIGlmICggcmF0aW8gPT09IDEgKSB7XHJcbiAgICAgIHRoaXMuYW5pbWF0aW5nUHJvcGVydHkudmFsdWUgPSBmYWxzZTtcclxuICAgICAgdGhpcy5ydW5uaW5nUHJvcGVydHkudmFsdWUgPSBmYWxzZTtcclxuXHJcbiAgICAgIC8vIFN0ZXAgaW50byB0aGUgbmV4dCBhbmltYXRpb24gYnkgdGhlIG92ZXJmbG93IHRpbWVcclxuICAgICAgdGhpcy5maW5pc2hFbWl0dGVyLmVtaXQoIGR0ICk7XHJcbiAgICAgIHRoaXMuZW5kZWRFbWl0dGVyLmVtaXQoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFmdGVyIHRoaXMgYW5pbWF0aW9uIGlzIGNvbXBsZXRlLCB0aGUgZ2l2ZW4gYW5pbWF0aW9uIHdpbGwgYmUgc3RhcnRlZC5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIC0gUmV0dXJucyB0aGUgcGFzc2VkLWluIGFuaW1hdGlvbiBzbyB0aGluZ3MgY2FuIGJlIGNoYWluZWQgbmljZWx5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyB0aGVuKCBhbmltYXRpb246IEFuaW1hdGlvbiApOiBBbmltYXRpb24ge1xyXG4gICAgdGhpcy5maW5pc2hFbWl0dGVyLmFkZExpc3RlbmVyKCAoIGR0OiBudW1iZXIgKSA9PiBhbmltYXRpb24uc3RhcnQoIGR0ICkgKTtcclxuICAgIHJldHVybiBhbmltYXRpb247XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMucnVubmluZ1Byb3BlcnR5LmRpc3Bvc2UoKTtcclxuICAgIHRoaXMuYW5pbWF0aW5nUHJvcGVydHkuZGlzcG9zZSgpO1xyXG4gICAgdGhpcy5zdGFydEVtaXR0ZXIuZGlzcG9zZSgpO1xyXG4gICAgdGhpcy5iZWdpbkVtaXR0ZXIuZGlzcG9zZSgpO1xyXG4gICAgdGhpcy5maW5pc2hFbWl0dGVyLmRpc3Bvc2UoKTtcclxuICAgIHRoaXMuc3RvcEVtaXR0ZXIuZGlzcG9zZSgpO1xyXG4gICAgdGhpcy5lbmRlZEVtaXR0ZXIuZGlzcG9zZSgpO1xyXG4gICAgdGhpcy51cGRhdGVFbWl0dGVyLmRpc3Bvc2UoKTtcclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICB9XHJcbn1cclxuXHJcbnR3aXh0LnJlZ2lzdGVyKCAnQW5pbWF0aW9uJywgQW5pbWF0aW9uICk7XHJcbmV4cG9ydCBkZWZhdWx0IEFuaW1hdGlvbjsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsZUFBZSxNQUFNLGtDQUFrQztBQUM5RCxPQUFPQyxPQUFPLE1BQU0sMEJBQTBCO0FBQzlDLE9BQU9DLFNBQVMsTUFBTSw0QkFBNEI7QUFFbEQsT0FBT0MsV0FBVyxNQUFNLDhCQUE4QjtBQUN0RCxPQUFPQyxLQUFLLE1BQU0sdUJBQXVCO0FBQ3pDLE9BQU9DLFNBQVMsTUFBTSxpQ0FBaUM7QUFDdkQsT0FBT0MsZUFBZSxNQUFrQyxzQkFBc0I7QUFDOUUsT0FBT0MsS0FBSyxNQUFNLFlBQVk7QUFDOUIsT0FBT0MsVUFBVSxNQUE2Qiw2QkFBNkI7O0FBMkIzRTtBQUNBOztBQU1BLE1BQU1DLFNBQVMsU0FBeUxELFVBQVUsQ0FBQztFQUVqTjtFQUNBO0VBQ0E7O0VBR0E7O0VBR0E7O0VBR0E7RUFDUUUsTUFBTSxHQUFrQixDQUFDOztFQUVqQztFQUNBO0VBQ1FDLGNBQWMsR0FBRyxDQUFDOztFQUUxQjtFQUNBO0VBQ1FDLGtCQUFrQixHQUFHLENBQUM7O0VBRTlCO0VBQ2dCQyxlQUFlLEdBQUcsSUFBSWIsZUFBZSxDQUFFLEtBQU0sQ0FBQzs7RUFFOUQ7RUFDQTtFQUNnQmMsaUJBQWlCLEdBQUcsSUFBSWQsZUFBZSxDQUFFLEtBQU0sQ0FBQzs7RUFFaEU7RUFDZ0JlLFlBQVksR0FBRyxJQUFJZCxPQUFPLENBQUMsQ0FBQzs7RUFFNUM7RUFDZ0JlLFlBQVksR0FBRyxJQUFJZixPQUFPLENBQUMsQ0FBQzs7RUFFNUM7RUFDQTtFQUNBO0VBQ0E7RUFDZ0JnQixhQUFhLEdBQUcsSUFBSWhC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