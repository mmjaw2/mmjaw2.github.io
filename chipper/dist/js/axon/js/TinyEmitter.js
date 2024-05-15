// Copyright 2015-2024, University of Colorado Boulder

/**
 * Lightweight event & listener abstraction for a single event type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import axon from './axon.js';
import Random from '../../dot/js/Random.js';
import dotRandom from '../../dot/js/dotRandom.js';
import Pool from '../../phet-core/js/Pool.js';

// constants
const listenerOrder = _.hasIn(window, 'phet.chipper.queryParameters') && phet.chipper.queryParameters.listenerOrder;
const listenerLimit = _.hasIn(window, 'phet.chipper.queryParameters') && phet.chipper.queryParameters.listenerLimit;
const EMIT_CONTEXT_MAX_LENGTH = 1000;
let random = null;
if (listenerOrder && listenerOrder.startsWith('random')) {
  // NOTE: this regular expression must be maintained in initialize-globals as well.
  const match = listenerOrder.match(/random(?:%28|\()(\d+)(?:%29|\))/);
  const seed = match ? Number(match[1]) : dotRandom.nextInt(1000000);
  random = new Random({
    seed: seed
  });
  console.log('listenerOrder random seed: ' + seed);
}

/**
 * How to handle the notification of listeners in reentrant emit() cases. There are two possibilities:
 * 'stack': Each new reentrant call to emit (from a listener), takes precedent. This behaves like a "depth first"
 *        algorithm because it will not finish calling all listeners from the original call until nested emit() calls
 *        notify fully. Notify listeners from the emit call with "stack-like" behavior. We also sometimes call this
 *        "depth-first" notification. This algorithm will prioritize the most recent emit call's listeners, such that
 *        reentrant emits will cause a full recursive call to emit() to complete before continuing to notify the
 *        rest of the listeners from the original call.
 *        Note: This was the only method of notifying listeners on emit before 2/2024.
 *
 * 'queue': Each new reentrant call to emit queues those listeners to run once the current notifications are done
 *        firing. Here a recursive (reentrant) emit is basically a noop, because the original call will continue
 *        looping through listeners from each new emit() call until there are no more. See notifyAsQueue().
 *        Notify listeners from the emit call with "queue-like" behavior (FIFO). We also sometimes call this "breadth-first"
 *        notification. In this function, listeners for an earlier emit call will be called before any newer emit call that
 *        may occur inside of listeners (in a reentrant case).
 *
 *        This is a better strategy in cases where order may matter, for example:
 *        const emitter = new TinyEmitter<[ number ]>(  null, null, 'queue' );
 *        emitter.addListener( number => {
 *          if ( number < 10 ) {
 *            emitter.emit( number + 1 );
 *            console.log( number );
 *          }
 *        } );
 *        emitter.emit( 1 );
 *        -> 1,2,3,4,5,6,7,8,9
 *
 *        Whereas stack-based notification would yield the oppose order: 9->1, since the most recently called emit
 *        would be the very first one notified.
 *
 *        Note, this algorithm does involve queueing a reentrant emit() calls' listeners for later notification. So in
 *        effect, reentrant emit() calls are no-ops. This could potentially lead some awkward or confusing cases. As a
 *        result it is recommended to use this predominantly with Properties, in which their stateful value makes more
 *        sense to notify changes on in order (preserving the correct oldValue through all notifications).
 */

// While TinyEmitter doesn't use this in an optionize call, it is nice to be able to reuse the types of these options.

// Store the number of listeners from the single TinyEmitter instance that has the most listeners in the whole runtime.
let maxListenerCount = 0;
export default class TinyEmitter {
  // Not defined usually because of memory usage. If defined, this will be called when the listener count changes,
  // e.g. changeCount( {number} listenersAddedQuantity ), with the number being negative for listeners removed.

  // Only defined when assertions are enabled - to keep track if it has been disposed or not

  // If specified, this will be called before listeners are notified.
  // NOTE: This is set ONLY if it's non-null

  // If specified as true, this flag will ensure that listener order never changes (like via ?listenerOrder=random)
  // NOTE: This is set ONLY if it's actually true

  // How best to handle reentrant calls to emit(). Defaults to stack. See full doc where the Type is declared.

  // The listeners that will be called on emit

  // During emit() keep track of iteration progress and guard listeners if mutated during emit()
  emitContexts = [];

  // Null on parameters is a no-op
  constructor(onBeforeNotify, hasListenerOrderDependencies, reentrantNotificationStrategy) {
    if (onBeforeNotify) {
      this.onBeforeNotify = onBeforeNotify;
    }
    if (hasListenerOrderDependencies) {
      this.hasListenerOrderDependencies = hasListenerOrderDependencies;
    }
    if (reentrantNotificationStrategy) {
      this.reentrantNotificationStrategy = reentrantNotificationStrategy;
    }

    // Listener order is preserved in Set
    this.listeners = new Set();

    // for production memory concerns; no need to keep this around.
    if (assert) {
      this.isDisposed = false;
    }
  }

  /**
   * Disposes an Emitter. All listeners are removed.
   */
  dispose() {
    this.removeAllListeners();
    if (assert) {
      this.isDisposed = true;
    }
  }

  /**
   * Notify listeners
   */
  emit(...args) {
    assert && assert(!this.isDisposed, 'TinyEmitter.emit() should not be called if disposed.');

    // optional callback, before notifying listeners
    this.onBeforeNotify && this.onBeforeNotify.apply(null, args);

    // Support for a query parameter that shuffles listeners, but bury behind assert so it will be stripped out on build
    // so it won't impact production performance.
    if (assert && listenerOrder && listenerOrder !== 'default' && !this.hasListenerOrderDependencies) {
      const asArray = Array.from(this.listeners);
      const reorderedListeners = listenerOrder.startsWith('random') ? random.shuffle(asArray) : asArray.reverse();
      this.listeners = new Set(reorderedListeners);
    }

    // Notify wired-up listeners, if any
    if (this.listeners.size > 0) {
      // We may not be able to emit right away. If we are already emitting and this is a recursive call, then that
      // first emit needs to finish notifying its listeners before we start our notifications (in queue mode), so store
      // the args for later. No slice needed, we're not modifying the args array.
      const emitContext = EmitContext.create(0, args);
      this.emitContexts.push(emitContext);
      if (this.reentrantNotificationStrategy === 'queue') {
        // This handles all reentrancy here (with a while loop), instead of doing so with recursion. If not the first context, then no-op because a previous call will handle this call's listener notifications.
        if (this.emitContexts.length === 1) {
          while (this.emitContexts.length) {
            // Don't remove it from the list here. We need to be able to guardListeners.
            const emitContext = this.emitContexts[0];

            // It is possible that this emitContext is later on in the while loop, and has already had a listenerArray set
            const listeners = emitContext.hasListenerArray ? emitContext.listenerArray : this.listeners;
            this.notifyLoop(emitContext, listeners);
            this.emitContexts.shift()?.freeToPool();
          }
        } else {
          assert && assert(this.emitContexts.length <= EMIT_CONTEXT_MAX_LENGTH, `emitting reentrant depth of ${EMIT_CONTEXT_MAX_LENGTH} seems like a infinite loop to me!`);
        }
      } else if (!this.reentrantNotificationStrategy || this.reentrantNotificationStrategy === 'stack') {
        this.notifyLoop(emitContext, this.listeners);
        this.emitContexts.pop()?.freeToPool();
      } else {
        assert && assert(false, `Unknown reentrantNotificationStrategy: ${this.reentrantNotificationStrategy}`);
      }
    }
  }

  /**
   * Execute the notification of listeners (from the provided context and list). This function supports guarding against
   * if listener order changes during the notification process, see guardListeners.
   */
  notifyLoop(emitContext, listeners) {
    const args = emitContext.args;
    for (const listener of listeners) {
      listener(...args);
      emitContext.index++;

      // If a listener was added or removed, we cannot continue processing the mutated Set, we must switch to
      // iterate over the guarded array
      if (emitContext.hasListenerArray) {
        break;
      }
    }

    // If the listeners were guarded during emit, we bailed out on the for..of and continue iterating over the original
    // listeners in order from where we left off.
    if (emitContext.hasListenerArray) {
      for (let i = emitContext.index; i < emitContext.listenerArray.length; i++) {
        emitContext.listenerArray[i](...args);
      }
    }
  }

  /**
   * Adds a listener which will be called during emit.
   */
  addListener(listener) {
    assert && assert(!this.isDisposed, 'Cannot add a listener to a disposed TinyEmitter');
    assert && assert(!this.hasListener(listener), 'Cannot add the same listener twice');

    // If a listener is added during an emit(), we must make a copy of the current list of listeners--the newly added
    // listener will be available for the next emit() but not the one in progress.  This is to match behavior with
    // removeListener.
    this.guardListeners();
    this.listeners.add(listener);
    this.changeCount && this.changeCount(1);
    if (assert && listenerLimit && isFinite(listenerLimit) && maxListenerCount < this.listeners.size) {
      maxListenerCount = this.listeners.size;
      console.log(`Max TinyEmitter listeners: ${maxListenerCount}`);
      assert(maxListenerCount <= listenerLimit, `listener count of ${maxListenerCount} above ?listenerLimit=${listenerLimit}`);
    }
  }

  /**
   * Removes a listener
   */
  removeListener(listener) {
    // Throw an error when removing a non-listener (except when the Emitter has already been disposed, see
    // https://github.com/phetsims/sun/issues/394#issuecomment-419998231
    if (assert && !this.isDisposed) {
      assert(this.listeners.has(listener), 'tried to removeListener on something that wasn\'t a listener');
    }
    this.guardListeners();
    this.listeners.delete(listener);
    this.changeCount && this.changeCount(-1);
  }

  /**
   * Removes all the listeners
   */
  removeAllListeners() {
    const size = this.listeners.size;
    this.guardListeners();
    this.listeners.clear();
    this.changeCount && this.changeCount(-size);
  }

  /**
   * If listeners are added/removed while emit() is in progress, we must make a defensive copy of the array of listeners
   * before changing the array, and use it for the rest of the notifications until the emit call has completed.
   */
  guardListeners() {
    for (let i = this.emitContexts.length - 1; i >= 0; i--) {
      const emitContext = this.emitContexts[i];

      // Once we meet a level that was already guarded, we can stop, since all previous levels were already guarded
      if (emitContext.hasListenerArray) {
        break;
      }

      // Mark copies as 'guarded' so that it will use the original listeners when emit started and not the modified
      // list.
      emitContext.listenerArray.push(...this.listeners);
      emitContext.hasListenerArray = true;
    }
  }

  /**
   * Checks whether a listener is registered with this Emitter
   */
  hasListener(listener) {
    assert && assert(arguments.length === 1, 'Emitter.hasListener should be called with 1 argument');
    return this.listeners.has(listener);
  }

  /**
   * Returns true if there are any listeners.
   */
  hasListeners() {
    assert && assert(arguments.length === 0, 'Emitter.hasListeners should be called without arguments');
    return this.listeners.size > 0;
  }

  /**
   * Returns the number of listeners.
   */
  getListenerCount() {
    return this.listeners.size;
  }

  /**
   * Invokes a callback once for each listener - meant for Property's use
   */
  forEachListener(callback) {
    this.listeners.forEach(callback);
  }
}

/**
 * Utility class for managing the context of an emit call. This is used to manage the state of the emit call, and
 * especially to handle reentrant emit calls (through the stack/queue notification strategies)
 */
class EmitContext {
  // Gets incremented with notifications

  // Arguments that the emit was called with

  // Whether we should act like there is a listenerArray (has it been copied?)
  hasListenerArray = false;

  // Only use this if hasListenerArray is true. NOTE: for performance, we're not using getters/etc.
  listenerArray = [];
  constructor(index, args) {
    this.initialize(index, args);
  }
  initialize(index, args) {
    this.index = index;
    this.args = args;
    this.hasListenerArray = false;
    return this;
  }
  freeToPool() {
    // TypeScript doesn't need to know that we're using this for different types. When it is "active", it will be
    // the correct type.
    EmitContext.pool.freeToPool(this);

    // NOTE: If we have fewer concerns about memory in the future, we could potentially improve performance by
    // removing the clearing out of memory here. We don't seem to create many EmitContexts, HOWEVER if we have ONE
    // "more re-entrant" case on sim startup that references a BIG BIG object, it could theoretically keep that
    // object alive forever.

    // We want to null things out to prevent memory leaks. Don't tell TypeScript!
    // (It will have the correct types after the initialization, so this works well with our pooling pattern).
    this.args = null;

    // Clear out the listeners array, so we don't leak memory while we are in the pool. If we have less concerns
    this.listenerArray.length = 0;
  }
  static pool = new Pool(EmitContext, {
    initialize: EmitContext.prototype.initialize
  });
  static create(index, args) {
    // TypeScript doesn't need to know that we're using this for different types. When it is "active", it will be
    // the correct type.
    return EmitContext.pool.create(index, args);
  }
}
axon.register('TinyEmitter', TinyEmitter);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJheG9uIiwiUmFuZG9tIiwiZG90UmFuZG9tIiwiUG9vbCIsImxpc3RlbmVyT3JkZXIiLCJfIiwiaGFzSW4iLCJ3aW5kb3ciLCJwaGV0IiwiY2hpcHBlciIsInF1ZXJ5UGFyYW1ldGVycyIsImxpc3RlbmVyTGltaXQiLCJFTUlUX0NPTlRFWFRfTUFYX0xFTkdUSCIsInJhbmRvbSIsInN0YXJ0c1dpdGgiLCJtYXRjaCIsInNlZWQiLCJOdW1iZXIiLCJuZXh0SW50IiwiY29uc29sZSIsImxvZyIsIm1heExpc3RlbmVyQ291bnQiLCJUaW55RW1pdHRlciIsImVtaXRDb250ZXh0cyIsImNvbnN0cnVjdG9yIiwib25CZWZvcmVOb3RpZnkiLCJoYXNMaXN0ZW5lck9yZGVyRGVwZW5kZW5jaWVzIiwicmVlbnRyYW50Tm90aWZpY2F0aW9uU3RyYXRlZ3kiLCJsaXN0ZW5lcnMiLCJTZXQiLCJhc3NlcnQiLCJpc0Rpc3Bvc2VkIiwiZGlzcG9zZSIsInJlbW92ZUFsbExpc3RlbmVycyIsImVtaXQiLCJhcmdzIiwiYXBwbHkiLCJhc0FycmF5IiwiQXJyYXkiLCJmcm9tIiwicmVvcmRlcmVkTGlzdGVuZXJzIiwic2h1ZmZsZSIsInJldmVyc2UiLCJzaXplIiwiZW1pdENvbnRleHQiLCJFbWl0Q29udGV4dCIsImNyZWF0ZSIsInB1c2giLCJsZW5ndGgiLCJoYXNMaXN0ZW5lckFycmF5IiwibGlzdGVuZXJBcnJheSIsIm5vdGlmeUxvb3AiLCJzaGlmdCIsImZyZWVUb1Bvb2wiLCJwb3AiLCJsaXN0ZW5lciIsImluZGV4IiwiaSIsImFkZExpc3RlbmVyIiwiaGFzTGlzdGVuZXIiLCJndWFyZExpc3RlbmVycyIsImFkZCIsImNoYW5nZUNvdW50IiwiaXNGaW5pdGUiLCJyZW1vdmVMaXN0ZW5lciIsImhhcyIsImRlbGV0ZSIsImNsZWFyIiwiYXJndW1lbnRzIiwiaGFzTGlzdGVuZXJzIiwiZ2V0TGlzdGVuZXJDb3VudCIsImZvckVhY2hMaXN0ZW5lciIsImNhbGxiYWNrIiwiZm9yRWFjaCIsImluaXRpYWxpemUiLCJwb29sIiwicHJvdG90eXBlIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJUaW55RW1pdHRlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNS0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBMaWdodHdlaWdodCBldmVudCAmIGxpc3RlbmVyIGFic3RyYWN0aW9uIGZvciBhIHNpbmdsZSBldmVudCB0eXBlLlxyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIE1pY2hhZWwgS2F1em1hbm4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IEludGVudGlvbmFsQW55IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9JbnRlbnRpb25hbEFueS5qcyc7XHJcbmltcG9ydCBheG9uIGZyb20gJy4vYXhvbi5qcyc7XHJcbmltcG9ydCBURW1pdHRlciwgeyBURW1pdHRlckxpc3RlbmVyLCBURW1pdHRlclBhcmFtZXRlciB9IGZyb20gJy4vVEVtaXR0ZXIuanMnO1xyXG5pbXBvcnQgUmFuZG9tIGZyb20gJy4uLy4uL2RvdC9qcy9SYW5kb20uanMnO1xyXG5pbXBvcnQgZG90UmFuZG9tIGZyb20gJy4uLy4uL2RvdC9qcy9kb3RSYW5kb20uanMnO1xyXG5pbXBvcnQgUG9vbCwgeyBUUG9vbGFibGUgfSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvUG9vbC5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgbGlzdGVuZXJPcmRlciA9IF8uaGFzSW4oIHdpbmRvdywgJ3BoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMnICkgJiYgcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5saXN0ZW5lck9yZGVyO1xyXG5jb25zdCBsaXN0ZW5lckxpbWl0ID0gXy5oYXNJbiggd2luZG93LCAncGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycycgKSAmJiBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmxpc3RlbmVyTGltaXQ7XHJcblxyXG5jb25zdCBFTUlUX0NPTlRFWFRfTUFYX0xFTkdUSCA9IDEwMDA7XHJcblxyXG5sZXQgcmFuZG9tOiBSYW5kb20gfCBudWxsID0gbnVsbDtcclxuaWYgKCBsaXN0ZW5lck9yZGVyICYmIGxpc3RlbmVyT3JkZXIuc3RhcnRzV2l0aCggJ3JhbmRvbScgKSApIHtcclxuXHJcbiAgLy8gTk9URTogdGhpcyByZWd1bGFyIGV4cHJlc3Npb24gbXVzdCBiZSBtYWludGFpbmVkIGluIGluaXRpYWxpemUtZ2xvYmFscyBhcyB3ZWxsLlxyXG4gIGNvbnN0IG1hdGNoID0gbGlzdGVuZXJPcmRlci5tYXRjaCggL3JhbmRvbSg/OiUyOHxcXCgpKFxcZCspKD86JTI5fFxcKSkvICk7XHJcbiAgY29uc3Qgc2VlZCA9IG1hdGNoID8gTnVtYmVyKCBtYXRjaFsgMSBdICkgOiBkb3RSYW5kb20ubmV4dEludCggMTAwMDAwMCApO1xyXG4gIHJhbmRvbSA9IG5ldyBSYW5kb20oIHsgc2VlZDogc2VlZCB9ICk7XHJcbiAgY29uc29sZS5sb2coICdsaXN0ZW5lck9yZGVyIHJhbmRvbSBzZWVkOiAnICsgc2VlZCApO1xyXG59XHJcblxyXG4vKipcclxuICogSG93IHRvIGhhbmRsZSB0aGUgbm90aWZpY2F0aW9uIG9mIGxpc3RlbmVycyBpbiByZWVudHJhbnQgZW1pdCgpIGNhc2VzLiBUaGVyZSBhcmUgdHdvIHBvc3NpYmlsaXRpZXM6XHJcbiAqICdzdGFjayc6IEVhY2ggbmV3IHJlZW50cmFudCBjYWxsIHRvIGVtaXQgKGZyb20gYSBsaXN0ZW5lciksIHRha2VzIHByZWNlZGVudC4gVGhpcyBiZWhhdmVzIGxpa2UgYSBcImRlcHRoIGZpcnN0XCJcclxuICogICAgICAgIGFsZ29yaXRobSBiZWNhdXNlIGl0IHdpbGwgbm90IGZpbmlzaCBjYWxsaW5nIGFsbCBsaXN0ZW5lcnMgZnJvbSB0aGUgb3JpZ2luYWwgY2FsbCB1bnRpbCBuZXN0ZWQgZW1pdCgpIGNhbGxzXHJcbiAqICAgICAgICBub3RpZnkgZnVsbHkuIE5vdGlmeSBsaXN0ZW5lcnMgZnJvbSB0aGUgZW1pdCBjYWxsIHdpdGggXCJzdGFjay1saWtlXCIgYmVoYXZpb3IuIFdlIGFsc28gc29tZXRpbWVzIGNhbGwgdGhpc1xyXG4gKiAgICAgICAgXCJkZXB0aC1maXJzdFwiIG5vdGlmaWNhdGlvbi4gVGhpcyBhbGdvcml0aG0gd2lsbCBwcmlvcml0aXplIHRoZSBtb3N0IHJlY2VudCBlbWl0IGNhbGwncyBsaXN0ZW5lcnMsIHN1Y2ggdGhhdFxyXG4gKiAgICAgICAgcmVlbnRyYW50IGVtaXRzIHdpbGwgY2F1c2UgYSBmdWxsIHJlY3Vyc2l2ZSBjYWxsIHRvIGVtaXQoKSB0byBjb21wbGV0ZSBiZWZvcmUgY29udGludWluZyB0byBub3RpZnkgdGhlXHJcbiAqICAgICAgICByZXN0IG9mIHRoZSBsaXN0ZW5lcnMgZnJvbSB0aGUgb3JpZ2luYWwgY2FsbC5cclxuICogICAgICAgIE5vdGU6IFRoaXMgd2FzIHRoZSBvbmx5IG1ldGhvZCBvZiBub3RpZnlpbmcgbGlzdGVuZXJzIG9uIGVtaXQgYmVmb3JlIDIvMjAyNC5cclxuICpcclxuICogJ3F1ZXVlJzogRWFjaCBuZXcgcmVlbnRyYW50IGNhbGwgdG8gZW1pdCBxdWV1ZXMgdGhvc2UgbGlzdGVuZXJzIHRvIHJ1biBvbmNlIHRoZSBjdXJyZW50IG5vdGlmaWNhdGlvbnMgYXJlIGRvbmVcclxuICogICAgICAgIGZpcmluZy4gSGVyZSBhIHJlY3Vyc2l2ZSAocmVlbnRyYW50KSBlbWl0IGlzIGJhc2ljYWxseSBhIG5vb3AsIGJlY2F1c2UgdGhlIG9yaWdpbmFsIGNhbGwgd2lsbCBjb250aW51ZVxyXG4gKiAgICAgICAgbG9vcGluZyB0aHJvdWdoIGxpc3RlbmVycyBmcm9tIGVhY2ggbmV3IGVtaXQoKSBjYWxsIHVudGlsIHRoZXJlIGFyZSBubyBtb3JlLiBTZWUgbm90aWZ5QXNRdWV1ZSgpLlxyXG4gKiAgICAgICAgTm90aWZ5IGxpc3RlbmVycyBmcm9tIHRoZSBlbWl0IGNhbGwgd2l0aCBcInF1ZXVlLWxpa2VcIiBiZWhhdmlvciAoRklGTykuIFdlIGFsc28gc29tZXRpbWVzIGNhbGwgdGhpcyBcImJyZWFkdGgtZmlyc3RcIlxyXG4gKiAgICAgICAgbm90aWZpY2F0aW9uLiBJbiB0aGlzIGZ1bmN0aW9uLCBsaXN0ZW5lcnMgZm9yIGFuIGVhcmxpZXIgZW1pdCBjYWxsIHdpbGwgYmUgY2FsbGVkIGJlZm9yZSBhbnkgbmV3ZXIgZW1pdCBjYWxsIHRoYXRcclxuICogICAgICAgIG1heSBvY2N1ciBpbnNpZGUgb2YgbGlzdGVuZXJzIChpbiBhIHJlZW50cmFudCBjYXNlKS5cclxuICpcclxuICogICAgICAgIFRoaXMgaXMgYSBiZXR0ZXIgc3RyYXRlZ3kgaW4gY2FzZXMgd2hlcmUgb3JkZXIgbWF5IG1hdHRlciwgZm9yIGV4YW1wbGU6XHJcbiAqICAgICAgICBjb25zdCBlbWl0dGVyID0gbmV3IFRpbnlFbWl0dGVyPFsgbnVtYmVyIF0+KCAgbnVsbCwgbnVsbCwgJ3F1ZXVlJyApO1xyXG4gKiAgICAgICAgZW1pdHRlci5hZGRMaXN0ZW5lciggbnVtYmVyID0+IHtcclxuICogICAgICAgICAgaWYgKCBudW1iZXIgPCAxMCApIHtcclxuICogICAgICAgICAgICBlbWl0dGVyLmVtaXQoIG51bWJlciArIDEgKTtcclxuICogICAgICAgICAgICBjb25zb2xlLmxvZyggbnVtYmVyICk7XHJcbiAqICAgICAgICAgIH1cclxuICogICAgICAgIH0gKTtcclxuICogICAgICAgIGVtaXR0ZXIuZW1pdCggMSApO1xyXG4gKiAgICAgICAgLT4gMSwyLDMsNCw1LDYsNyw4LDlcclxuICpcclxuICogICAgICAgIFdoZXJlYXMgc3RhY2stYmFzZWQgbm90aWZpY2F0aW9uIHdvdWxkIHlpZWxkIHRoZSBvcHBvc2Ugb3JkZXI6IDktPjEsIHNpbmNlIHRoZSBtb3N0IHJlY2VudGx5IGNhbGxlZCBlbWl0XHJcbiAqICAgICAgICB3b3VsZCBiZSB0aGUgdmVyeSBmaXJzdCBvbmUgbm90aWZpZWQuXHJcbiAqXHJcbiAqICAgICAgICBOb3RlLCB0aGlzIGFsZ29yaXRobSBkb2VzIGludm9sdmUgcXVldWVpbmcgYSByZWVudHJhbnQgZW1pdCgpIGNhbGxzJyBsaXN0ZW5lcnMgZm9yIGxhdGVyIG5vdGlmaWNhdGlvbi4gU28gaW5cclxuICogICAgICAgIGVmZmVjdCwgcmVlbnRyYW50IGVtaXQoKSBjYWxscyBhcmUgbm8tb3BzLiBUaGlzIGNvdWxkIHBvdGVudGlhbGx5IGxlYWQgc29tZSBhd2t3YXJkIG9yIGNvbmZ1c2luZyBjYXNlcy4gQXMgYVxyXG4gKiAgICAgICAgcmVzdWx0IGl0IGlzIHJlY29tbWVuZGVkIHRvIHVzZSB0aGlzIHByZWRvbWluYW50bHkgd2l0aCBQcm9wZXJ0aWVzLCBpbiB3aGljaCB0aGVpciBzdGF0ZWZ1bCB2YWx1ZSBtYWtlcyBtb3JlXHJcbiAqICAgICAgICBzZW5zZSB0byBub3RpZnkgY2hhbmdlcyBvbiBpbiBvcmRlciAocHJlc2VydmluZyB0aGUgY29ycmVjdCBvbGRWYWx1ZSB0aHJvdWdoIGFsbCBub3RpZmljYXRpb25zKS5cclxuICovXHJcbmV4cG9ydCB0eXBlIFJlZW50cmFudE5vdGlmaWNhdGlvblN0cmF0ZWd5ID0gJ3F1ZXVlJyB8ICdzdGFjayc7XHJcblxyXG4vLyBXaGlsZSBUaW55RW1pdHRlciBkb2Vzbid0IHVzZSB0aGlzIGluIGFuIG9wdGlvbml6ZSBjYWxsLCBpdCBpcyBuaWNlIHRvIGJlIGFibGUgdG8gcmV1c2UgdGhlIHR5cGVzIG9mIHRoZXNlIG9wdGlvbnMuXHJcbmV4cG9ydCB0eXBlIFRpbnlFbWl0dGVyT3B0aW9uczxUIGV4dGVuZHMgVEVtaXR0ZXJQYXJhbWV0ZXJbXSA9IFtdPiA9IHtcclxuICBvbkJlZm9yZU5vdGlmeT86IFRFbWl0dGVyTGlzdGVuZXI8VD47XHJcbiAgaGFzTGlzdGVuZXJPcmRlckRlcGVuZGVuY2llcz86IGJvb2xlYW47XHJcbiAgcmVlbnRyYW50Tm90aWZpY2F0aW9uU3RyYXRlZ3k/OiBSZWVudHJhbnROb3RpZmljYXRpb25TdHJhdGVneTtcclxufTtcclxuXHJcbnR5cGUgUGFyYW1ldGVyTGlzdCA9IEludGVudGlvbmFsQW55W107XHJcblxyXG4vLyBTdG9yZSB0aGUgbnVtYmVyIG9mIGxpc3RlbmVycyBmcm9tIHRoZSBzaW5nbGUgVGlueUVtaXR0ZXIgaW5zdGFuY2UgdGhhdCBoYXMgdGhlIG1vc3QgbGlzdGVuZXJzIGluIHRoZSB3aG9sZSBydW50aW1lLlxyXG5sZXQgbWF4TGlzdGVuZXJDb3VudCA9IDA7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUaW55RW1pdHRlcjxUIGV4dGVuZHMgVEVtaXR0ZXJQYXJhbWV0ZXJbXSA9IFtdPiBpbXBsZW1lbnRzIFRFbWl0dGVyPFQ+IHtcclxuXHJcbiAgLy8gTm90IGRlZmluZWQgdXN1YWxseSBiZWNhdXNlIG9mIG1lbW9yeSB1c2FnZS4gSWYgZGVmaW5lZCwgdGhpcyB3aWxsIGJlIGNhbGxlZCB3aGVuIHRoZSBsaXN0ZW5lciBjb3VudCBjaGFuZ2VzLFxyXG4gIC8vIGUuZy4gY2hhbmdlQ291bnQoIHtudW1iZXJ9IGxpc3RlbmVyc0FkZGVkUXVhbnRpdHkgKSwgd2l0aCB0aGUgbnVtYmVyIGJlaW5nIG5lZ2F0aXZlIGZvciBsaXN0ZW5lcnMgcmVtb3ZlZC5cclxuICBwdWJsaWMgY2hhbmdlQ291bnQ/OiAoIGNvdW50OiBudW1iZXIgKSA9PiB2b2lkO1xyXG5cclxuICAvLyBPbmx5IGRlZmluZWQgd2hlbiBhc3NlcnRpb25zIGFyZSBlbmFibGVkIC0gdG8ga2VlcCB0cmFjayBpZiBpdCBoYXMgYmVlbiBkaXNwb3NlZCBvciBub3RcclxuICBwdWJsaWMgaXNEaXNwb3NlZD86IGJvb2xlYW47XHJcblxyXG4gIC8vIElmIHNwZWNpZmllZCwgdGhpcyB3aWxsIGJlIGNhbGxlZCBiZWZvcmUgbGlzdGVuZXJzIGFyZSBub3RpZmllZC5cclxuICAvLyBOT1RFOiBUaGlzIGlzIHNldCBPTkxZIGlmIGl0J3Mgbm9uLW51bGxcclxuICBwcml2YXRlIHJlYWRvbmx5IG9uQmVmb3JlTm90aWZ5PzogVEVtaXR0ZXJMaXN0ZW5lcjxUPjtcclxuXHJcbiAgLy8gSWYgc3BlY2lmaWVkIGFzIHRydWUsIHRoaXMgZmxhZyB3aWxsIGVuc3VyZSB0aGF0IGxpc3RlbmVyIG9yZGVyIG5ldmVyIGNoYW5nZXMgKGxpa2UgdmlhID9saXN0ZW5lck9yZGVyPXJhbmRvbSlcclxuICAvLyBOT1RFOiBUaGlzIGlzIHNldCBPTkxZIGlmIGl0J3MgYWN0dWFsbHkgdHJ1ZVxyXG4gIHByaXZhdGUgcmVhZG9ubHkgaGFzTGlzdGVuZXJPcmRlckRlcGVuZGVuY2llcz86IHRydWU7XHJcblxyXG4gIC8vIEhvdyBiZXN0IHRvIGhhbmRsZSByZWVudHJhbnQgY2FsbHMgdG8gZW1pdCgpLiBEZWZhdWx0cyB0byBzdGFjay4gU2VlIGZ1bGwgZG9jIHdoZXJlIHRoZSBUeXBlIGlzIGRlY2xhcmVkLlxyXG4gIHByaXZhdGUgcmVhZG9ubHkgcmVlbnRyYW50Tm90aWZpY2F0aW9uU3RyYXRlZ3k/OiBSZWVudHJhbnROb3RpZmljYXRpb25TdHJhdGVneTtcclxuXHJcbiAgLy8gVGhlIGxpc3RlbmVycyB0aGF0IHdpbGwgYmUgY2FsbGVkIG9uIGVtaXRcclxuICBwcml2YXRlIGxpc3RlbmVyczogU2V0PFRFbWl0dGVyTGlzdGVuZXI8VD4+O1xyXG5cclxuICAvLyBEdXJpbmcgZW1pdCgpIGtlZXAgdHJhY2sgb2YgaXRlcmF0aW9uIHByb2dyZXNzIGFuZCBndWFyZCBsaXN0ZW5lcnMgaWYgbXV0YXRlZCBkdXJpbmcgZW1pdCgpXHJcbiAgcHJpdmF0ZSBlbWl0Q29udGV4dHM6IEVtaXRDb250ZXh0PFQ+W10gPSBbXTtcclxuXHJcbiAgLy8gTnVsbCBvbiBwYXJhbWV0ZXJzIGlzIGEgbm8tb3BcclxuICBwdWJsaWMgY29uc3RydWN0b3IoIG9uQmVmb3JlTm90aWZ5PzogVGlueUVtaXR0ZXJPcHRpb25zPFQ+WydvbkJlZm9yZU5vdGlmeSddIHwgbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICAgIGhhc0xpc3RlbmVyT3JkZXJEZXBlbmRlbmNpZXM/OiBUaW55RW1pdHRlck9wdGlvbnM8VD5bJ2hhc0xpc3RlbmVyT3JkZXJEZXBlbmRlbmNpZXMnXSB8IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgICByZWVudHJhbnROb3RpZmljYXRpb25TdHJhdGVneT86IFRpbnlFbWl0dGVyT3B0aW9uczxUPlsncmVlbnRyYW50Tm90aWZpY2F0aW9uU3RyYXRlZ3knXSB8IG51bGwgKSB7XHJcblxyXG4gICAgaWYgKCBvbkJlZm9yZU5vdGlmeSApIHtcclxuICAgICAgdGhpcy5vbkJlZm9yZU5vdGlmeSA9IG9uQmVmb3JlTm90aWZ5O1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggaGFzTGlzdGVuZXJPcmRlckRlcGVuZGVuY2llcyApIHtcclxuICAgICAgdGhpcy5oYXNMaXN0ZW5lck9yZGVyRGVwZW5kZW5jaWVzID0gaGFzTGlzdGVuZXJPcmRlckRlcGVuZGVuY2llcztcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHJlZW50cmFudE5vdGlmaWNhdGlvblN0cmF0ZWd5ICkge1xyXG4gICAgICB0aGlzLnJlZW50cmFudE5vdGlmaWNhdGlvblN0cmF0ZWd5ID0gcmVlbnRyYW50Tm90aWZpY2F0aW9uU3RyYXRlZ3k7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTGlzdGVuZXIgb3JkZXIgaXMgcHJlc2VydmVkIGluIFNldFxyXG4gICAgdGhpcy5saXN0ZW5lcnMgPSBuZXcgU2V0KCk7XHJcblxyXG4gICAgLy8gZm9yIHByb2R1Y3Rpb24gbWVtb3J5IGNvbmNlcm5zOyBubyBuZWVkIHRvIGtlZXAgdGhpcyBhcm91bmQuXHJcbiAgICBpZiAoIGFzc2VydCApIHtcclxuICAgICAgdGhpcy5pc0Rpc3Bvc2VkID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEaXNwb3NlcyBhbiBFbWl0dGVyLiBBbGwgbGlzdGVuZXJzIGFyZSByZW1vdmVkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcclxuXHJcbiAgICBpZiAoIGFzc2VydCApIHtcclxuICAgICAgdGhpcy5pc0Rpc3Bvc2VkID0gdHJ1ZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE5vdGlmeSBsaXN0ZW5lcnNcclxuICAgKi9cclxuICBwdWJsaWMgZW1pdCggLi4uYXJnczogVCApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLmlzRGlzcG9zZWQsICdUaW55RW1pdHRlci5lbWl0KCkgc2hvdWxkIG5vdCBiZSBjYWxsZWQgaWYgZGlzcG9zZWQuJyApO1xyXG5cclxuICAgIC8vIG9wdGlvbmFsIGNhbGxiYWNrLCBiZWZvcmUgbm90aWZ5aW5nIGxpc3RlbmVyc1xyXG4gICAgdGhpcy5vbkJlZm9yZU5vdGlmeSAmJiB0aGlzLm9uQmVmb3JlTm90aWZ5LmFwcGx5KCBudWxsLCBhcmdzICk7XHJcblxyXG4gICAgLy8gU3VwcG9ydCBmb3IgYSBxdWVyeSBwYXJhbWV0ZXIgdGhhdCBzaHVmZmxlcyBsaXN0ZW5lcnMsIGJ1dCBidXJ5IGJlaGluZCBhc3NlcnQgc28gaXQgd2lsbCBiZSBzdHJpcHBlZCBvdXQgb24gYnVpbGRcclxuICAgIC8vIHNvIGl0IHdvbid0IGltcGFjdCBwcm9kdWN0aW9uIHBlcmZvcm1hbmNlLlxyXG4gICAgaWYgKCBhc3NlcnQgJiYgbGlzdGVuZXJPcmRlciAmJiAoIGxpc3RlbmVyT3JkZXIgIT09ICdkZWZhdWx0JyApICYmICF0aGlzLmhhc0xpc3RlbmVyT3JkZXJEZXBlbmRlbmNpZXMgKSB7XHJcbiAgICAgIGNvbnN0IGFzQXJyYXkgPSBBcnJheS5mcm9tKCB0aGlzLmxpc3RlbmVycyApO1xyXG5cclxuICAgICAgY29uc3QgcmVvcmRlcmVkTGlzdGVuZXJzID0gbGlzdGVuZXJPcmRlci5zdGFydHNXaXRoKCAncmFuZG9tJyApID8gcmFuZG9tIS5zaHVmZmxlKCBhc0FycmF5ICkgOiBhc0FycmF5LnJldmVyc2UoKTtcclxuICAgICAgdGhpcy5saXN0ZW5lcnMgPSBuZXcgU2V0KCByZW9yZGVyZWRMaXN0ZW5lcnMgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBOb3RpZnkgd2lyZWQtdXAgbGlzdGVuZXJzLCBpZiBhbnlcclxuICAgIGlmICggdGhpcy5saXN0ZW5lcnMuc2l6ZSA+IDAgKSB7XHJcblxyXG4gICAgICAvLyBXZSBtYXkgbm90IGJlIGFibGUgdG8gZW1pdCByaWdodCBhd2F5LiBJZiB3ZSBhcmUgYWxyZWFkeSBlbWl0dGluZyBhbmQgdGhpcyBpcyBhIHJlY3Vyc2l2ZSBjYWxsLCB0aGVuIHRoYXRcclxuICAgICAgLy8gZmlyc3QgZW1pdCBuZWVkcyB0byBmaW5pc2ggbm90aWZ5aW5nIGl0cyBsaXN0ZW5lcnMgYmVmb3JlIHdlIHN0YXJ0IG91ciBub3RpZmljYXRpb25zIChpbiBxdWV1ZSBtb2RlKSwgc28gc3RvcmVcclxuICAgICAgLy8gdGhlIGFyZ3MgZm9yIGxhdGVyLiBObyBzbGljZSBuZWVkZWQsIHdlJ3JlIG5vdCBtb2RpZnlpbmcgdGhlIGFyZ3MgYXJyYXkuXHJcbiAgICAgIGNvbnN0IGVtaXRDb250ZXh0ID0gRW1pdENvbnRleHQuY3JlYXRlKCAwLCBhcmdzICk7XHJcbiAgICAgIHRoaXMuZW1pdENvbnRleHRzLnB1c2goIGVtaXRDb250ZXh0ICk7XHJcblxyXG4gICAgICBpZiAoIHRoaXMucmVlbnRyYW50Tm90aWZpY2F0aW9uU3RyYXRlZ3kgPT09ICdxdWV1ZScgKSB7XHJcblxyXG4gICAgICAgIC8vIFRoaXMgaGFuZGxlcyBhbGwgcmVlbnRyYW5jeSBoZXJlICh3aXRoIGEgd2hpbGUgbG9vcCksIGluc3RlYWQgb2YgZG9pbmcgc28gd2l0aCByZWN1cnNpb24uIElmIG5vdCB0aGUgZmlyc3QgY29udGV4dCwgdGhlbiBuby1vcCBiZWNhdXNlIGEgcHJldmlvdXMgY2FsbCB3aWxsIGhhbmRsZSB0aGlzIGNhbGwncyBsaXN0ZW5lciBub3RpZmljYXRpb25zLlxyXG4gICAgICAgIGlmICggdGhpcy5lbWl0Q29udGV4dHMubGVuZ3RoID09PSAxICkge1xyXG4gICAgICAgICAgd2hpbGUgKCB0aGlzLmVtaXRDb250ZXh0cy5sZW5ndGggKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBEb24ndCByZW1vdmUgaXQgZnJvbSB0aGUgbGlzdCBoZXJlLiBXZSBuZWVkIHRvIGJlIGFibGUgdG8gZ3VhcmRMaXN0ZW5lcnMuXHJcbiAgICAgICAgICAgIGNvbnN0IGVtaXRDb250ZXh0ID0gdGhpcy5lbWl0Q29udGV4dHNbIDAgXTtcclxuXHJcbiAgICAgICAgICAgIC8vIEl0IGlzIHBvc3NpYmxlIHRoYXQgdGhpcyBlbWl0Q29udGV4dCBpcyBsYXRlciBvbiBpbiB0aGUgd2hpbGUgbG9vcCwgYW5kIGhhcyBhbHJlYWR5IGhhZCBhIGxpc3RlbmVyQXJyYXkgc2V0XHJcbiAgICAgICAgICAgIGNvbnN0IGxpc3RlbmVycyA9IGVtaXRDb250ZXh0Lmhhc0xpc3RlbmVyQXJyYXkgPyBlbWl0Q29udGV4dC5saXN0ZW5lckFycmF5IDogdGhpcy5saXN0ZW5lcnM7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm5vdGlmeUxvb3AoIGVtaXRDb250ZXh0LCBsaXN0ZW5lcnMgKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZW1pdENvbnRleHRzLnNoaWZ0KCk/LmZyZWVUb1Bvb2woKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmVtaXRDb250ZXh0cy5sZW5ndGggPD0gRU1JVF9DT05URVhUX01BWF9MRU5HVEgsXHJcbiAgICAgICAgICAgIGBlbWl0dGluZyByZWVudHJhbnQgZGVwdGggb2YgJHtFTUlUX0NPTlRFWFRfTUFYX0xFTkdUSH0gc2VlbXMgbGlrZSBhIGluZmluaXRlIGxvb3AgdG8gbWUhYCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICggIXRoaXMucmVlbnRyYW50Tm90aWZpY2F0aW9uU3RyYXRlZ3kgfHwgdGhpcy5yZWVudHJhbnROb3RpZmljYXRpb25TdHJhdGVneSA9PT0gJ3N0YWNrJyApIHtcclxuICAgICAgICB0aGlzLm5vdGlmeUxvb3AoIGVtaXRDb250ZXh0LCB0aGlzLmxpc3RlbmVycyApO1xyXG4gICAgICAgIHRoaXMuZW1pdENvbnRleHRzLnBvcCgpPy5mcmVlVG9Qb29sKCk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggZmFsc2UsIGBVbmtub3duIHJlZW50cmFudE5vdGlmaWNhdGlvblN0cmF0ZWd5OiAke3RoaXMucmVlbnRyYW50Tm90aWZpY2F0aW9uU3RyYXRlZ3l9YCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFeGVjdXRlIHRoZSBub3RpZmljYXRpb24gb2YgbGlzdGVuZXJzIChmcm9tIHRoZSBwcm92aWRlZCBjb250ZXh0IGFuZCBsaXN0KS4gVGhpcyBmdW5jdGlvbiBzdXBwb3J0cyBndWFyZGluZyBhZ2FpbnN0XHJcbiAgICogaWYgbGlzdGVuZXIgb3JkZXIgY2hhbmdlcyBkdXJpbmcgdGhlIG5vdGlmaWNhdGlvbiBwcm9jZXNzLCBzZWUgZ3VhcmRMaXN0ZW5lcnMuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBub3RpZnlMb29wKCBlbWl0Q29udGV4dDogRW1pdENvbnRleHQ8VD4sIGxpc3RlbmVyczogVEVtaXR0ZXJMaXN0ZW5lcjxUPltdIHwgU2V0PFRFbWl0dGVyTGlzdGVuZXI8VD4+ICk6IHZvaWQge1xyXG4gICAgY29uc3QgYXJncyA9IGVtaXRDb250ZXh0LmFyZ3M7XHJcblxyXG4gICAgZm9yICggY29uc3QgbGlzdGVuZXIgb2YgbGlzdGVuZXJzICkge1xyXG4gICAgICBsaXN0ZW5lciggLi4uYXJncyApO1xyXG5cclxuICAgICAgZW1pdENvbnRleHQuaW5kZXgrKztcclxuXHJcbiAgICAgIC8vIElmIGEgbGlzdGVuZXIgd2FzIGFkZGVkIG9yIHJlbW92ZWQsIHdlIGNhbm5vdCBjb250aW51ZSBwcm9jZXNzaW5nIHRoZSBtdXRhdGVkIFNldCwgd2UgbXVzdCBzd2l0Y2ggdG9cclxuICAgICAgLy8gaXRlcmF0ZSBvdmVyIHRoZSBndWFyZGVkIGFycmF5XHJcbiAgICAgIGlmICggZW1pdENvbnRleHQuaGFzTGlzdGVuZXJBcnJheSApIHtcclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIHRoZSBsaXN0ZW5lcnMgd2VyZSBndWFyZGVkIGR1cmluZyBlbWl0LCB3ZSBiYWlsZWQgb3V0IG9uIHRoZSBmb3IuLm9mIGFuZCBjb250aW51ZSBpdGVyYXRpbmcgb3ZlciB0aGUgb3JpZ2luYWxcclxuICAgIC8vIGxpc3RlbmVycyBpbiBvcmRlciBmcm9tIHdoZXJlIHdlIGxlZnQgb2ZmLlxyXG4gICAgaWYgKCBlbWl0Q29udGV4dC5oYXNMaXN0ZW5lckFycmF5ICkge1xyXG4gICAgICBmb3IgKCBsZXQgaSA9IGVtaXRDb250ZXh0LmluZGV4OyBpIDwgZW1pdENvbnRleHQubGlzdGVuZXJBcnJheS5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICBlbWl0Q29udGV4dC5saXN0ZW5lckFycmF5WyBpIF0oIC4uLmFyZ3MgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhIGxpc3RlbmVyIHdoaWNoIHdpbGwgYmUgY2FsbGVkIGR1cmluZyBlbWl0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGRMaXN0ZW5lciggbGlzdGVuZXI6IFRFbWl0dGVyTGlzdGVuZXI8VD4gKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5pc0Rpc3Bvc2VkLCAnQ2Fubm90IGFkZCBhIGxpc3RlbmVyIHRvIGEgZGlzcG9zZWQgVGlueUVtaXR0ZXInICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5oYXNMaXN0ZW5lciggbGlzdGVuZXIgKSwgJ0Nhbm5vdCBhZGQgdGhlIHNhbWUgbGlzdGVuZXIgdHdpY2UnICk7XHJcblxyXG4gICAgLy8gSWYgYSBsaXN0ZW5lciBpcyBhZGRlZCBkdXJpbmcgYW4gZW1pdCgpLCB3ZSBtdXN0IG1ha2UgYSBjb3B5IG9mIHRoZSBjdXJyZW50IGxpc3Qgb2YgbGlzdGVuZXJzLS10aGUgbmV3bHkgYWRkZWRcclxuICAgIC8vIGxpc3RlbmVyIHdpbGwgYmUgYXZhaWxhYmxlIGZvciB0aGUgbmV4dCBlbWl0KCkgYnV0IG5vdCB0aGUgb25lIGluIHByb2dyZXNzLiAgVGhpcyBpcyB0byBtYXRjaCBiZWhhdmlvciB3aXRoXHJcbiAgICAvLyByZW1vdmVMaXN0ZW5lci5cclxuICAgIHRoaXMuZ3VhcmRMaXN0ZW5lcnMoKTtcclxuICAgIHRoaXMubGlzdGVuZXJzLmFkZCggbGlzdGVuZXIgKTtcclxuXHJcbiAgICB0aGlzLmNoYW5nZUNvdW50ICYmIHRoaXMuY2hhbmdlQ291bnQoIDEgKTtcclxuXHJcbiAgICBpZiAoIGFzc2VydCAmJiBsaXN0ZW5lckxpbWl0ICYmIGlzRmluaXRlKCBsaXN0ZW5lckxpbWl0ICkgJiYgbWF4TGlzdGVuZXJDb3VudCA8IHRoaXMubGlzdGVuZXJzLnNpemUgKSB7XHJcbiAgICAgIG1heExpc3RlbmVyQ291bnQgPSB0aGlzLmxpc3RlbmVycy5zaXplO1xyXG4gICAgICBjb25zb2xlLmxvZyggYE1heCBUaW55RW1pdHRlciBsaXN0ZW5lcnM6ICR7bWF4TGlzdGVuZXJDb3VudH1gICk7XHJcbiAgICAgIGFzc2VydCggbWF4TGlzdGVuZXJDb3VudCA8PSBsaXN0ZW5lckxpbWl0LCBgbGlzdGVuZXIgY291bnQgb2YgJHttYXhMaXN0ZW5lckNvdW50fSBhYm92ZSA/bGlzdGVuZXJMaW1pdD0ke2xpc3RlbmVyTGltaXR9YCApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyBhIGxpc3RlbmVyXHJcbiAgICovXHJcbiAgcHVibGljIHJlbW92ZUxpc3RlbmVyKCBsaXN0ZW5lcjogVEVtaXR0ZXJMaXN0ZW5lcjxUPiApOiB2b2lkIHtcclxuXHJcbiAgICAvLyBUaHJvdyBhbiBlcnJvciB3aGVuIHJlbW92aW5nIGEgbm9uLWxpc3RlbmVyIChleGNlcHQgd2hlbiB0aGUgRW1pdHRlciBoYXMgYWxyZWFkeSBiZWVuIGRpc3Bvc2VkLCBzZWVcclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zdW4vaXNzdWVzLzM5NCNpc3N1ZWNvbW1lbnQtNDE5OTk4MjMxXHJcbiAgICBpZiAoIGFzc2VydCAmJiAhdGhpcy5pc0Rpc3Bvc2VkICkge1xyXG4gICAgICBhc3NlcnQoIHRoaXMubGlzdGVuZXJzLmhhcyggbGlzdGVuZXIgKSwgJ3RyaWVkIHRvIHJlbW92ZUxpc3RlbmVyIG9uIHNvbWV0aGluZyB0aGF0IHdhc25cXCd0IGEgbGlzdGVuZXInICk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmd1YXJkTGlzdGVuZXJzKCk7XHJcbiAgICB0aGlzLmxpc3RlbmVycy5kZWxldGUoIGxpc3RlbmVyICk7XHJcblxyXG4gICAgdGhpcy5jaGFuZ2VDb3VudCAmJiB0aGlzLmNoYW5nZUNvdW50KCAtMSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyBhbGwgdGhlIGxpc3RlbmVyc1xyXG4gICAqL1xyXG4gIHB1YmxpYyByZW1vdmVBbGxMaXN0ZW5lcnMoKTogdm9pZCB7XHJcblxyXG4gICAgY29uc3Qgc2l6ZSA9IHRoaXMubGlzdGVuZXJzLnNpemU7XHJcblxyXG4gICAgdGhpcy5ndWFyZExpc3RlbmVycygpO1xyXG4gICAgdGhpcy5saXN0ZW5lcnMuY2xlYXIoKTtcclxuXHJcbiAgICB0aGlzLmNoYW5nZUNvdW50ICYmIHRoaXMuY2hhbmdlQ291bnQoIC1zaXplICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJZiBsaXN0ZW5lcnMgYXJlIGFkZGVkL3JlbW92ZWQgd2hpbGUgZW1pdCgpIGlzIGluIHByb2dyZXNzLCB3ZSBtdXN0IG1ha2UgYSBkZWZlbnNpdmUgY29weSBvZiB0aGUgYXJyYXkgb2YgbGlzdGVuZXJzXHJcbiAgICogYmVmb3JlIGNoYW5naW5nIHRoZSBhcnJheSwgYW5kIHVzZSBpdCBmb3IgdGhlIHJlc3Qgb2YgdGhlIG5vdGlmaWNhdGlvbnMgdW50aWwgdGhlIGVtaXQgY2FsbCBoYXMgY29tcGxldGVkLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ3VhcmRMaXN0ZW5lcnMoKTogdm9pZCB7XHJcblxyXG4gICAgZm9yICggbGV0IGkgPSB0aGlzLmVtaXRDb250ZXh0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSApIHtcclxuXHJcbiAgICAgIGNvbnN0IGVtaXRDb250ZXh0ID0gdGhpcy5lbWl0Q29udGV4dHNbIGkgXTtcclxuXHJcbiAgICAgIC8vIE9uY2Ugd2UgbWVldCBhIGxldmVsIHRoYXQgd2FzIGFscmVhZHkgZ3VhcmRlZCwgd2UgY2FuIHN0b3AsIHNpbmNlIGFsbCBwcmV2aW91cyBsZXZlbHMgd2VyZSBhbHJlYWR5IGd1YXJkZWRcclxuICAgICAgaWYgKCBlbWl0Q29udGV4dC5oYXNMaXN0ZW5lckFycmF5ICkge1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBNYXJrIGNvcGllcyBhcyAnZ3VhcmRlZCcgc28gdGhhdCBpdCB3aWxsIHVzZSB0aGUgb3JpZ2luYWwgbGlzdGVuZXJzIHdoZW4gZW1pdCBzdGFydGVkIGFuZCBub3QgdGhlIG1vZGlmaWVkXHJcbiAgICAgIC8vIGxpc3QuXHJcbiAgICAgIGVtaXRDb250ZXh0Lmxpc3RlbmVyQXJyYXkucHVzaCggLi4udGhpcy5saXN0ZW5lcnMgKTtcclxuICAgICAgZW1pdENvbnRleHQuaGFzTGlzdGVuZXJBcnJheSA9IHRydWU7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDaGVja3Mgd2hldGhlciBhIGxpc3RlbmVyIGlzIHJlZ2lzdGVyZWQgd2l0aCB0aGlzIEVtaXR0ZXJcclxuICAgKi9cclxuICBwdWJsaWMgaGFzTGlzdGVuZXIoIGxpc3RlbmVyOiBURW1pdHRlckxpc3RlbmVyPFQ+ICk6IGJvb2xlYW4ge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggYXJndW1lbnRzLmxlbmd0aCA9PT0gMSwgJ0VtaXR0ZXIuaGFzTGlzdGVuZXIgc2hvdWxkIGJlIGNhbGxlZCB3aXRoIDEgYXJndW1lbnQnICk7XHJcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcnMuaGFzKCBsaXN0ZW5lciApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0cnVlIGlmIHRoZXJlIGFyZSBhbnkgbGlzdGVuZXJzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBoYXNMaXN0ZW5lcnMoKTogYm9vbGVhbiB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhcmd1bWVudHMubGVuZ3RoID09PSAwLCAnRW1pdHRlci5oYXNMaXN0ZW5lcnMgc2hvdWxkIGJlIGNhbGxlZCB3aXRob3V0IGFyZ3VtZW50cycgKTtcclxuICAgIHJldHVybiB0aGlzLmxpc3RlbmVycy5zaXplID4gMDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG51bWJlciBvZiBsaXN0ZW5lcnMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldExpc3RlbmVyQ291bnQoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmxpc3RlbmVycy5zaXplO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW52b2tlcyBhIGNhbGxiYWNrIG9uY2UgZm9yIGVhY2ggbGlzdGVuZXIgLSBtZWFudCBmb3IgUHJvcGVydHkncyB1c2VcclxuICAgKi9cclxuICBwdWJsaWMgZm9yRWFjaExpc3RlbmVyKCBjYWxsYmFjazogKCBsaXN0ZW5lcjogVEVtaXR0ZXJMaXN0ZW5lcjxUPiApID0+IHZvaWQgKTogdm9pZCB7XHJcbiAgICB0aGlzLmxpc3RlbmVycy5mb3JFYWNoKCBjYWxsYmFjayApO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFV0aWxpdHkgY2xhc3MgZm9yIG1hbmFnaW5nIHRoZSBjb250ZXh0IG9mIGFuIGVtaXQgY2FsbC4gVGhpcyBpcyB1c2VkIHRvIG1hbmFnZSB0aGUgc3RhdGUgb2YgdGhlIGVtaXQgY2FsbCwgYW5kXHJcbiAqIGVzcGVjaWFsbHkgdG8gaGFuZGxlIHJlZW50cmFudCBlbWl0IGNhbGxzICh0aHJvdWdoIHRoZSBzdGFjay9xdWV1ZSBub3RpZmljYXRpb24gc3RyYXRlZ2llcylcclxuICovXHJcbmNsYXNzIEVtaXRDb250ZXh0PFQgZXh0ZW5kcyBQYXJhbWV0ZXJMaXN0ID0gUGFyYW1ldGVyTGlzdD4gaW1wbGVtZW50cyBUUG9vbGFibGUge1xyXG4gIC8vIEdldHMgaW5jcmVtZW50ZWQgd2l0aCBub3RpZmljYXRpb25zXHJcbiAgcHVibGljIGluZGV4ITogbnVtYmVyO1xyXG5cclxuICAvLyBBcmd1bWVudHMgdGhhdCB0aGUgZW1pdCB3YXMgY2FsbGVkIHdpdGhcclxuICBwdWJsaWMgYXJncyE6IFQ7XHJcblxyXG4gIC8vIFdoZXRoZXIgd2Ugc2hvdWxkIGFjdCBsaWtlIHRoZXJlIGlzIGEgbGlzdGVuZXJBcnJheSAoaGFzIGl0IGJlZW4gY29waWVkPylcclxuICBwdWJsaWMgaGFzTGlzdGVuZXJBcnJheSA9IGZhbHNlO1xyXG5cclxuICAvLyBPbmx5IHVzZSB0aGlzIGlmIGhhc0xpc3RlbmVyQXJyYXkgaXMgdHJ1ZS4gTk9URTogZm9yIHBlcmZvcm1hbmNlLCB3ZSdyZSBub3QgdXNpbmcgZ2V0dGVycy9ldGMuXHJcbiAgcHVibGljIGxpc3RlbmVyQXJyYXk6IFRFbWl0dGVyTGlzdGVuZXI8VD5bXSA9IFtdO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIGluZGV4OiBudW1iZXIsIGFyZ3M6IFQgKSB7XHJcbiAgICB0aGlzLmluaXRpYWxpemUoIGluZGV4LCBhcmdzICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaW5pdGlhbGl6ZSggaW5kZXg6IG51bWJlciwgYXJnczogVCApOiB0aGlzIHtcclxuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcclxuICAgIHRoaXMuYXJncyA9IGFyZ3M7XHJcbiAgICB0aGlzLmhhc0xpc3RlbmVyQXJyYXkgPSBmYWxzZTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBmcmVlVG9Qb29sKCk6IHZvaWQge1xyXG4gICAgLy8gVHlwZVNjcmlwdCBkb2Vzbid0IG5lZWQgdG8ga25vdyB0aGF0IHdlJ3JlIHVzaW5nIHRoaXMgZm9yIGRpZmZlcmVudCB0eXBlcy4gV2hlbiBpdCBpcyBcImFjdGl2ZVwiLCBpdCB3aWxsIGJlXHJcbiAgICAvLyB0aGUgY29ycmVjdCB0eXBlLlxyXG4gICAgRW1pdENvbnRleHQucG9vbC5mcmVlVG9Qb29sKCB0aGlzIGFzIHVua25vd24gYXMgRW1pdENvbnRleHQgKTtcclxuXHJcbiAgICAvLyBOT1RFOiBJZiB3ZSBoYXZlIGZld2VyIGNvbmNlcm5zIGFib3V0IG1lbW9yeSBpbiB0aGUgZnV0dXJlLCB3ZSBjb3VsZCBwb3RlbnRpYWxseSBpbXByb3ZlIHBlcmZvcm1hbmNlIGJ5XHJcbiAgICAvLyByZW1vdmluZyB0aGUgY2xlYXJpbmcgb3V0IG9mIG1lbW9yeSBoZXJlLiBXZSBkb24ndCBzZWVtIHRvIGNyZWF0ZSBtYW55IEVtaXRDb250ZXh0cywgSE9XRVZFUiBpZiB3ZSBoYXZlIE9ORVxyXG4gICAgLy8gXCJtb3JlIHJlLWVudHJhbnRcIiBjYXNlIG9uIHNpbSBzdGFydHVwIHRoYXQgcmVmZXJlbmNlcyBhIEJJRyBCSUcgb2JqZWN0LCBpdCBjb3VsZCB0aGVvcmV0aWNhbGx5IGtlZXAgdGhhdFxyXG4gICAgLy8gb2JqZWN0IGFsaXZlIGZvcmV2ZXIuXHJcblxyXG4gICAgLy8gV2Ugd2FudCB0byBudWxsIHRoaW5ncyBvdXQgdG8gcHJldmVudCBtZW1vcnkgbGVha3MuIERvbid0IHRlbGwgVHlwZVNjcmlwdCFcclxuICAgIC8vIChJdCB3aWxsIGhhdmUgdGhlIGNvcnJlY3QgdHlwZXMgYWZ0ZXIgdGhlIGluaXRpYWxpemF0aW9uLCBzbyB0aGlzIHdvcmtzIHdlbGwgd2l0aCBvdXIgcG9vbGluZyBwYXR0ZXJuKS5cclxuICAgIHRoaXMuYXJncyA9IG51bGwgYXMgdW5rbm93biBhcyBUO1xyXG5cclxuICAgIC8vIENsZWFyIG91dCB0aGUgbGlzdGVuZXJzIGFycmF5LCBzbyB3ZSBkb24ndCBsZWFrIG1lbW9yeSB3aGlsZSB3ZSBhcmUgaW4gdGhlIHBvb2wuIElmIHdlIGhhdmUgbGVzcyBjb25jZXJuc1xyXG4gICAgdGhpcy5saXN0ZW5lckFycmF5Lmxlbmd0aCA9IDA7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IHBvb2wgPSBuZXcgUG9vbCggRW1pdENvbnRleHQsIHtcclxuICAgIGluaXRpYWxpemU6IEVtaXRDb250ZXh0LnByb3RvdHlwZS5pbml0aWFsaXplXHJcbiAgfSApO1xyXG5cclxuICBwdWJsaWMgc3RhdGljIGNyZWF0ZTxUIGV4dGVuZHMgUGFyYW1ldGVyTGlzdD4oIGluZGV4OiBudW1iZXIsIGFyZ3M6IFQgKTogRW1pdENvbnRleHQ8VD4ge1xyXG4gICAgLy8gVHlwZVNjcmlwdCBkb2Vzbid0IG5lZWQgdG8ga25vdyB0aGF0IHdlJ3JlIHVzaW5nIHRoaXMgZm9yIGRpZmZlcmVudCB0eXBlcy4gV2hlbiBpdCBpcyBcImFjdGl2ZVwiLCBpdCB3aWxsIGJlXHJcbiAgICAvLyB0aGUgY29ycmVjdCB0eXBlLlxyXG4gICAgcmV0dXJuIEVtaXRDb250ZXh0LnBvb2wuY3JlYXRlKCBpbmRleCwgYXJncyApIGFzIHVua25vd24gYXMgRW1pdENvbnRleHQ8VD47XHJcbiAgfVxyXG59XHJcblxyXG5heG9uLnJlZ2lzdGVyKCAnVGlueUVtaXR0ZXInLCBUaW55RW1pdHRlciApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUdBLE9BQU9BLElBQUksTUFBTSxXQUFXO0FBRTVCLE9BQU9DLE1BQU0sTUFBTSx3QkFBd0I7QUFDM0MsT0FBT0MsU0FBUyxNQUFNLDJCQUEyQjtBQUNqRCxPQUFPQyxJQUFJLE1BQXFCLDRCQUE0Qjs7QUFFNUQ7QUFDQSxNQUFNQyxhQUFhLEdBQUdDLENBQUMsQ0FBQ0MsS0FBSyxDQUFFQyxNQUFNLEVBQUUsOEJBQStCLENBQUMsSUFBSUMsSUFBSSxDQUFDQyxPQUFPLENBQUNDLGVBQWUsQ0FBQ04sYUFBYTtBQUNySCxNQUFNTyxhQUFhLEdBQUdOLENBQUMsQ0FBQ0MsS0FBSyxDQUFFQyxNQUFNLEVBQUUsOEJBQStCLENBQUMsSUFBSUMsSUFBSSxDQUFDQyxPQUFPLENBQUNDLGVBQWUsQ0FBQ0MsYUFBYTtBQUVySCxNQUFNQyx1QkFBdUIsR0FBRyxJQUFJO0FBRXBDLElBQUlDLE1BQXFCLEdBQUcsSUFBSTtBQUNoQyxJQUFLVCxhQUFhLElBQUlBLGFBQWEsQ0FBQ1UsVUFBVSxDQUFFLFFBQVMsQ0FBQyxFQUFHO0VBRTNEO0VBQ0EsTUFBTUMsS0FBSyxHQUFHWCxhQUFhLENBQUNXLEtBQUssQ0FBRSxpQ0FBa0MsQ0FBQztFQUN0RSxNQUFNQyxJQUFJLEdBQUdELEtBQUssR0FBR0UsTUFBTSxDQUFFRixLQUFLLENBQUUsQ0FBQyxDQUFHLENBQUMsR0FBR2IsU0FBUyxDQUFDZ0IsT0FBTyxDQUFFLE9BQVEsQ0FBQztFQUN4RUwsTUFBTSxHQUFHLElBQUlaLE1BQU0sQ0FBRTtJQUFFZSxJQUFJLEVBQUVBO0VBQUssQ0FBRSxDQUFDO0VBQ3JDRyxPQUFPLENBQUNDLEdBQUcsQ0FBRSw2QkFBNkIsR0FBR0osSUFBSyxDQUFDO0FBQ3JEOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQTs7QUFTQTtBQUNBLElBQUlLLGdCQUFnQixHQUFHLENBQUM7QUFFeEIsZUFBZSxNQUFNQyxXQUFXLENBQTREO0VBRTFGO0VBQ0E7O0VBR0E7O0VBR0E7RUFDQTs7RUFHQTtFQUNBOztFQUdBOztFQUdBOztFQUdBO0VBQ1FDLFlBQVksR0FBcUIsRUFBRTs7RUFFM0M7RUFDT0MsV0FBV0EsQ0FBRUMsY0FBK0QsRUFDL0RDLDRCQUEyRixFQUMzRkMsNkJBQTZGLEVBQUc7SUFFbEgsSUFBS0YsY0FBYyxFQUFHO01BQ3BCLElBQUksQ0FBQ0EsY0FBYyxHQUFHQSxjQUFjO0lBQ3RDO0lBRUEsSUFBS0MsNEJBQTRCLEVBQUc7TUFDbEMsSUFBSSxDQUFDQSw0QkFBNEIsR0FBR0EsNEJBQTRCO0lBQ2xFO0lBRUEsSUFBS0MsNkJBQTZCLEVBQUc7TUFDbkMsSUFBSSxDQUFDQSw2QkFBNkIsR0FBR0EsNkJBQTZCO0lBQ3BFOztJQUVBO0lBQ0EsSUFBSSxDQUFDQyxTQUFTLEdBQUcsSUFBSUMsR0FBRyxDQUFDLENBQUM7O0lBRTFCO0lBQ0EsSUFBS0MsTUFBTSxFQUFHO01BQ1osSUFBSSxDQUFDQyxVQUFVLEdBQUcsS0FBSztJQUN6QjtFQUNGOztFQUVBO0FBQ0Y7QUFDQTtFQUNTQyxPQUFPQSxDQUFBLEVBQVM7SUFDckIsSUFBSSxDQUFDQyxrQkFBa0IsQ0FBQyxDQUFDO0lBRXpCLElBQUtILE1BQU0sRUFBRztNQUNaLElBQUksQ0FBQ0MsVUFBVSxHQUFHLElBQUk7SUFDeEI7RUFDRjs7RUFFQTtBQUNGO0FBQ0E7RUFDU0csSUFBSUEsQ0FBRSxHQUFHQyxJQUFPLEVBQVM7SUFDOUJMLE1BQU0sSUFBSUEsTUFBTSxDQUFFLENBQUMsSUFBSSxDQUFDQyxVQUFVLEVBQUUsc0RBQXVELENBQUM7O0lBRTVGO0lBQ0EsSUFBSSxDQUFDTixjQUFjLElBQUksSUFBSSxDQUFDQSxjQUFjLENBQUNXLEtBQUssQ0FBRSxJQUFJLEVBQUVELElBQUssQ0FBQzs7SUFFOUQ7SUFDQTtJQUNBLElBQUtMLE1BQU0sSUFBSTFCLGFBQWEsSUFBTUEsYUFBYSxLQUFLLFNBQVcsSUFBSSxDQUFDLElBQUksQ0FBQ3NCLDRCQUE0QixFQUFHO01BQ3RHLE1BQU1XLE9BQU8sR0FBR0MsS0FBSyxDQUFDQyxJQUFJLENBQUUsSUFBSSxDQUFDWCxTQUFVLENBQUM7TUFFNUMsTUFBTVksa0JBQWtCLEdBQUdwQyxhQUFhLENBQUNVLFVBQVUsQ0FBRSxRQUFTLENBQUMsR0FBR0QsTUFBTSxDQUFFNEIsT0FBTyxDQUFFSixPQUFRLENBQUMsR0FBR0EsT0FBTyxDQUFDSyxPQUFPLENBQUMsQ0FBQztNQUNoSCxJQUFJLENBQUNkLFNBQVMsR0FBRyxJQUFJQyxHQUFHLENBQUVXLGtCQUFtQixDQUFDO0lBQ2hEOztJQUVBO0lBQ0EsSUFBSyxJQUFJLENBQUNaLFNBQVMsQ0FBQ2UsSUFBSSxHQUFHLENBQUMsRUFBRztNQUU3QjtNQUNBO01BQ0E7TUFDQSxNQUFNQyxXQUFXLEdBQUdDLFdBQVcsQ0FBQ0MsTUFBTSxDQUFFLENBQUMsRUFBRVgsSUFBSyxDQUFDO01BQ2pELElBQUksQ0FBQ1osWUFBWSxDQUFDd0IsSUFBSSxDQUFFSCxXQUFZLENBQUM7TUFFckMsSUFBSyxJQUFJLENBQUNqQiw2QkFBNkIsS0FBSyxPQUFPLEVBQUc7UUFFcEQ7UUFDQSxJQUFLLElBQUksQ0FBQ0osWUFBWSxDQUFDeUIsTUFBTSxLQUFLLENBQUMsRUFBRztVQUNwQyxPQUFRLElBQUksQ0FBQ3pCLFlBQVksQ0FBQ3lCLE1BQU0sRUFBRztZQUVqQztZQUNBLE1BQU1KLFdBQVcsR0FBRyxJQUFJLENBQUNyQixZQUFZLENBQUUsQ0FBQyxDQUFFOztZQUUxQztZQUNBLE1BQU1LLFNBQVMsR0FBR2dCLFdBQVcsQ0FBQ0ssZ0JBQWdCLEdBQUdMLFdBQVcsQ0FBQ00sYUFBYSxHQUFHLElBQUksQ0FBQ3RCLFNBQVM7WUFFM0YsSUFBSSxDQUFDdUIsVUFBVSxDQUFFUCxXQUFXLEVBQUVoQixTQUFVLENBQUM7WUFFekMsSUFBSSxDQUFDTCxZQUFZLENBQUM2QixLQUFLLENBQUMsQ0FBQyxFQUFFQyxVQUFVLENBQUMsQ0FBQztVQUN6QztRQUNGLENBQUMsTUFDSTtVQUNIdkIsTUFBTSxJQUFJQSxNQUFNLENBQUUsSUFBSSxDQUFDUCxZQUFZLENBQUN5QixNQUFNLElBQUlwQyx1QkFBdUIsRUFDbEUsK0JBQThCQSx1QkFBd0Isb0NBQW9DLENBQUM7UUFDaEc7TUFDRixDQUFDLE1BQ0ksSUFBSyxDQUFDLElBQUksQ0FBQ2UsNkJBQTZCLElBQUksSUFBSSxDQUFDQSw2QkFBNkIsS0FBSyxPQUFPLEVBQUc7UUFDaEcsSUFBSSxDQUFDd0IsVUFBVSxDQUFFUCxXQUFXLEVBQUUsSUFBSSxDQUFDaEIsU0FBVSxDQUFDO1FBQzlDLElBQUksQ0FBQ0wsWUFBWSxDQUFDK0IsR0FBRyxDQUFDLENBQUMsRUFBRUQsVUFBVSxDQUFDLENBQUM7TUFDdkMsQ0FBQyxNQUNJO1FBQ0h2QixNQUFNLElBQUlBLE1BQU0sQ0FBRSxLQUFLLEVBQUcsMENBQXlDLElBQUksQ0FBQ0gsNkJBQThCLEVBQUUsQ0FBQztNQUMzRztJQUNGO0VBQ0Y7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7RUFDVXdCLFVBQVVBLENBQUVQLFdBQTJCLEVBQUVoQixTQUEyRCxFQUFTO0lBQ25ILE1BQU1PLElBQUksR0FBR1MsV0FBVyxDQUFDVCxJQUFJO0lBRTdCLEtBQU0sTUFBTW9CLFFBQVEsSUFBSTNCLFNBQVMsRUFBRztNQUNsQzJCLFFBQVEsQ0FBRSxHQUFHcEIsSUFBSyxDQUFDO01BRW5CUyxXQUFXLENBQUNZLEtBQUssRUFBRTs7TUFFbkI7TUFDQTtNQUNBLElBQUtaLFdBQVcsQ0FBQ0ssZ0JBQWdCLEVBQUc7UUFDbEM7TUFDRjtJQUNGOztJQUVBO0lBQ0E7SUFDQSxJQUFLTCxXQUFXLENBQUNLLGdCQUFnQixFQUFHO01BQ2xDLEtBQU0sSUFBSVEsQ0FBQyxHQUFHYixXQUFXLENBQUNZLEtBQUssRUFBRUMsQ0FBQyxHQUFHYixXQUFXLENBQUNNLGFBQWEsQ0FBQ0YsTUFBTSxFQUFFUyxDQUFDLEVBQUUsRUFBRztRQUMzRWIsV0FBVyxDQUFDTSxhQUFhLENBQUVPLENBQUMsQ0FBRSxDQUFFLEdBQUd0QixJQUFLLENBQUM7TUFDM0M7SUFDRjtFQUNGOztFQUVBO0FBQ0Y7QUFDQTtFQUNTdUIsV0FBV0EsQ0FBRUgsUUFBNkIsRUFBUztJQUN4RHpCLE1BQU0sSUFBSUEsTUFBTSxDQUFFLENBQUMsSUFBSSxDQUFDQyxVQUFVLEVBQUUsaURBQWtELENBQUM7SUFDdkZELE1BQU0sSUFBSUEsTUFBTSxDQUFFLENBQUMsSUFBSSxDQUFDNkIsV0FBVyxDQUFFSixRQUFTLENBQUMsRUFBRSxvQ0FBcUMsQ0FBQzs7SUFFdkY7SUFDQTtJQUNBO0lBQ0EsSUFBSSxDQUFDSyxjQUFjLENBQUMsQ0FBQztJQUNyQixJQUFJLENBQUNoQyxTQUFTLENBQUNpQyxHQUFHLENBQUVOLFFBQVMsQ0FBQztJQUU5QixJQUFJLENBQUNPLFdBQVcsSUFBSSxJQUFJLENBQUNBLFdBQVcsQ0FBRSxDQUFFLENBQUM7SUFFekMsSUFBS2hDLE1BQU0sSUFBSW5CLGFBQWEsSUFBSW9ELFFBQVEsQ0FBRXBELGFBQWMsQ0FBQyxJQUFJVSxnQkFBZ0IsR0FBRyxJQUFJLENBQUNPLFNBQVMsQ0FBQ2UsSUFBSSxFQUFHO01BQ3BHdEIsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDTyxTQUFTLENBQUNlLElBQUk7TUFDdEN4QixPQUFPLENBQUNDLEdBQUcsQ0FBRyw4QkFBNkJDLGdCQUFpQixFQUFFLENBQUM7TUFDL0RTLE1BQU0sQ0FBRVQsZ0JBQWdCLElBQUlWLGFBQWEsRUFBRyxxQkFBb0JVLGdCQUFpQix5QkFBd0JWLGFBQWMsRUFBRSxDQUFDO0lBQzVIO0VBQ0Y7O0VBRUE7QUFDRjtBQUNBO0VBQ1NxRCxjQUFjQSxDQUFFVCxRQUE2QixFQUFTO0lBRTNEO0lBQ0E7SUFDQSxJQUFLekIsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDQyxVQUFVLEVBQUc7TUFDaENELE1BQU0sQ0FBRSxJQUFJLENBQUNGLFNBQVMsQ0FBQ3FDLEdBQUcsQ0FBRVYsUUFBUyxDQUFDLEVBQUUsOERBQStELENBQUM7SUFDMUc7SUFDQSxJQUFJLENBQUNLLGNBQWMsQ0FBQyxDQUFDO0lBQ3JCLElBQUksQ0FBQ2hDLFNBQVMsQ0FBQ3NDLE1BQU0sQ0FBRVgsUUFBUyxDQUFDO0lBRWpDLElBQUksQ0FBQ08sV0FBVyxJQUFJLElBQUksQ0FBQ0EsV0FBVyxDQUFFLENBQUMsQ0FBRSxDQUFDO0VBQzVDOztFQUVBO0FBQ0Y7QUFDQTtFQUNTN0Isa0JBQWtCQSxDQUFBLEVBQVM7SUFFaEMsTUFBTVUsSUFBSSxHQUFHLElBQUksQ0FBQ2YsU0FBUyxDQUFDZSxJQUFJO0lBRWhDLElBQUksQ0FBQ2lCLGNBQWMsQ0FBQyxDQUFDO0lBQ3JCLElBQUksQ0FBQ2hDLFNBQVMsQ0FBQ3VDLEtBQUssQ0FBQyxDQUFDO0lBRXRCLElBQUksQ0FBQ0wsV0FBVyxJQUFJLElBQUksQ0FBQ0EsV0FBVyxDQUFFLENBQUNuQixJQUFLLENBQUM7RUFDL0M7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7RUFDVWlCLGNBQWNBLENBQUEsRUFBUztJQUU3QixLQUFNLElBQUlILENBQUMsR0FBRyxJQUFJLENBQUNsQyxZQUFZLENBQUN5QixNQUFNLEdBQUcsQ0FBQyxFQUFFUyxDQUFDLElBQUksQ0FBQyxFQUFFQSxDQUFDLEVBQUUsRUFBRztNQUV4RCxNQUFNYixXQUFXLEdBQUcsSUFBSSxDQUFDckIsWUFBWSxDQUFFa0MsQ0FBQyxDQUFFOztNQUUxQztNQUNBLElBQUtiLFdBQVcsQ0FBQ0ssZ0JBQWdCLEVBQUc7UUFDbEM7TUFDRjs7TUFFQTtNQUNBO01BQ0FMLFdBQVcsQ0FBQ00sYUFBYSxDQUFDSCxJQUFJLENBQUUsR0FBRyxJQUFJLENBQUNuQixTQUFVLENBQUM7TUFDbkRnQixXQUFXLENBQUNLLGdCQUFnQixHQUFHLElBQUk7SUFDckM7RUFDRjs7RUFFQTtBQUNGO0FBQ0E7RUFDU1UsV0FBV0EsQ0FBRUosUUFBNkIsRUFBWTtJQUMzRHpCLE1BQU0sSUFBSUEsTUFBTSxDQUFFc0MsU0FBUyxDQUFDcEIsTUFBTSxLQUFLLENBQUMsRUFBRSxzREFBdUQsQ0FBQztJQUNsRyxPQUFPLElBQUksQ0FBQ3BCLFNBQVMsQ0FBQ3FDLEdBQUcsQ0FBRVYsUUFBUyxDQUFDO0VBQ3ZDOztFQUVBO0FBQ0Y7QUFDQTtFQUNTYyxZQUFZQSxDQUFBLEVBQVk7SUFDN0J2QyxNQUFNLElBQUlBLE1BQU0sQ0FBRXNDLFNBQVMsQ0FBQ3BCLE1BQU0sS0FBSyxDQUFDLEVBQUUseURBQTBELENBQUM7SUFDckcsT0FBTyxJQUFJLENBQUNwQixTQUFTLENBQUNlLElBQUksR0FBRyxDQUFDO0VBQ2hDOztFQUVBO0FBQ0Y7QUFDQTtFQUNTMkIsZ0JBQWdCQSxDQUFBLEVBQVc7SUFDaEMsT0FBTyxJQUFJLENBQUMxQyxTQUFTLENBQUNlLElBQUk7RUFDNUI7O0VBRUE7QUFDRjtBQUNBO0VBQ1M0QixlQUFlQSxDQUFFQyxRQUFtRCxFQUFTO0lBQ2xGLElBQUksQ0FBQzVDLFNBQVMsQ0FBQzZDLE9BQU8sQ0FBRUQsUUFBUyxDQUFDO0VBQ3BDO0FBQ0Y7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNM0IsV0FBVyxDQUErRDtFQUM5RTs7RUFHQTs7RUFHQTtFQUNPSSxnQkFBZ0IsR0FBRyxLQUFLOztFQUUvQjtFQUNPQyxhQUFhLEdBQTBCLEVBQUU7RUFFekMxQixXQUFXQSxDQUFFZ0MsS0FBYSxFQUFFckIsSUFBTyxFQUFHO0lBQzNDLElBQUksQ0FBQ3VDLFVBQVUsQ0FBRWxCLEtBQUssRUFBRXJCLElBQUssQ0FBQztFQUNoQztFQUVPdUMsVUFBVUEsQ0FBRWxCLEtBQWEsRUFBRXJCLElBQU8sRUFBUztJQUNoRCxJQUFJLENBQUNxQixLQUFLLEdBQUdBLEtBQUs7SUFDbEIsSUFBSSxDQUFDckIsSUFBSSxHQUFHQSxJQUFJO0lBQ2hCLElBQUksQ0FBQ2MsZ0JBQWdCLEdBQUcsS0FBSztJQUU3QixPQUFPLElBQUk7RUFDYjtFQUVPSSxVQUFVQSxDQUFBLEVBQVM7SUFDeEI7SUFDQTtJQUNBUixXQUFXLENBQUM4QixJQUFJLENBQUN0QixVQUFVLENBQUUsSUFBK0IsQ0FBQzs7SUFFN0Q7SUFDQTtJQUNBO0lBQ0E7O0lBRUE7SUFDQTtJQUNBLElBQUksQ0FBQ2xCLElBQUksR0FBRyxJQUFvQjs7SUFFaEM7SUFDQSxJQUFJLENBQUNlLGFBQWEsQ0FBQ0YsTUFBTSxHQUFHLENBQUM7RUFDL0I7RUFFQSxPQUF1QjJCLElBQUksR0FBRyxJQUFJeEUsSUFBSSxDQUFFMEMsV0FBVyxFQUFFO0lBQ25ENkIsVUFBVSxFQUFFN0IsV0FBVyxDQUFDK0IsU0FBUyxDQUFDRjtFQUNwQyxDQUFFLENBQUM7RUFFSCxPQUFjNUIsTUFBTUEsQ0FBMkJVLEtBQWEsRUFBRXJCLElBQU8sRUFBbUI7SUFDdEY7SUFDQTtJQUNBLE9BQU9VLFdBQVcsQ0FBQzhCLElBQUksQ0FBQzdCLE1BQU0sQ0FBRVUsS0FBSyxFQUFFckIsSUFBSyxDQUFDO0VBQy9DO0FBQ0Y7QUFFQW5DLElBQUksQ0FBQzZFLFFBQVEsQ0FBRSxhQUFhLEVBQUV2RCxXQUFZLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=