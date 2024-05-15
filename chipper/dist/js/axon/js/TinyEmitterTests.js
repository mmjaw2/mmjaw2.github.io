// Copyright 2018-2024, University of Colorado Boulder

/**
 * QUnit tests for Emitter
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */

import TinyEmitter from './TinyEmitter.js';
QUnit.module('TinyEmitter');
QUnit.test('TinyEmitter can emit anything', assert => {
  assert.ok(true, 'Token test, because each test must have at least one assert.');
  const e1 = new TinyEmitter();
  e1.emit(1);
  e1.emit(2, 2);
  e1.emit(true);
  e1.emit('2, 2');
  e1.emit(undefined);
  e1.emit(null);
  const e2 = new TinyEmitter();
  e2.emit(new TinyEmitter(), {}, _.noop());
  e2.emit(2, 2);
  e2.emit(true);
  e2.emit('2, 2');
  e2.emit(undefined);
  e2.emit(null);
  e2.emit(new TinyEmitter(), 7, _.noop());
  e2.emit(new TinyEmitter());
});
QUnit.test('Test emit timing TinyEmitter', assert => {
  const e = new TinyEmitter();
  let x = 0;
  e.addListener(() => {
    x++;
  });
  e.addListener(() => {
    x++;
  });
  e.addListener(() => {
    x++;
  });
  e.addListener(() => {
    x++;
  });
  e.addListener(() => {
    x++;
  });
  e.emit();
  assert.ok(x === 5, 'fired all listeners');
  const e1 = new TinyEmitter();
  e1.addListener(() => {
    _.noop();
  });

  // const testEmitter = ( emitter, numberOfLoopings ) => {
  //
  //   const start = Date.now();
  //
  //   for ( let i = 0; i < numberOfLoopings; i++ ) {
  //     emitter.emit();
  //   }
  //   const end = Date.now();
  //   const totalTime = end - start;
  //   console.log( `Time for ${numberOfLoopings}: `, totalTime, totalTime / numberOfLoopings );
  // };
  //
  // // No assertions here, but it can be nice to test how expensive emit calls are
  // testEmitter( e1, 10000000 );
  // testEmitter( e, 10000000 );
});
QUnit.test('TinyEmitter Basics', assert => {
  const stack = [];
  const emitter = new TinyEmitter();
  const a = () => {
    stack.push('a');
    emitter.removeListener(b);
  };
  const b = () => {
    stack.push('b');
  };
  emitter.addListener(a);
  emitter.addListener(b);
  emitter.emit();
  assert.equal(stack.length, 2, 'Should have received 2 callbacks');
  assert.equal(stack[0], 'a', 'true');
  assert.equal(stack[1], 'b', 'true');
  assert.equal(emitter.hasListener(b), false, 'b should have been removed');
  emitter.dispose();
  window.assert && assert.throws(() => emitter.addListener(() => {
    _.noop();
  }), 'should throw error when adding a listener to disposed');
});
QUnit.test('TinyEmitter Tricks', assert => {
  const create = reentrantNotificationStrategy => {
    const entries = [];
    const emitter = new TinyEmitter(null, null, reentrantNotificationStrategy);
    const a = arg => {
      entries.push({
        listener: 'a',
        arg: arg
      });
      if (arg === 'first') {
        emitter.emit('second');
      }
    };
    const b = arg => {
      entries.push({
        listener: 'b',
        arg: arg
      });
      if (arg === 'second') {
        emitter.addListener(c);
        emitter.emit('third');
      }
    };
    const c = arg => {
      entries.push({
        listener: 'c',
        arg: arg
      });
    };
    emitter.addListener(a);
    emitter.addListener(b);
    emitter.emit('first');
    return entries;
  };
  const stackEntries = create('stack');

  /**
   * Stack notify strategy
   *
   * Expected order:
   *   a first
   *     a second
   *     b second
   *       a third
   *       b third
   *       c third
   *   b first
   *
   * It looks like "c first" is (currently?) being triggered since defendCallbacks only defends the top of the stack.
   * If the stack is [ undefended, undefended ], changing listeners copies only the top, leaving
   * [ undefended, defended ], and our first event triggers a listener that wasn't listening when it was called.
   */
  _.each(stackEntries, entry => {
    assert.ok(!(entry.listener === 'c' && entry.arg === 'first'), 'not C,first');
  });
  assert.equal(stackEntries.length, 7, 'Should have 7 callbacks');
  assert.equal(stackEntries[0].listener, 'a');
  assert.equal(stackEntries[0].arg, 'first');
  assert.equal(stackEntries[1].listener, 'a');
  assert.equal(stackEntries[1].arg, 'second');
  assert.equal(stackEntries[2].listener, 'b');
  assert.equal(stackEntries[2].arg, 'second');
  assert.equal(stackEntries[3].listener, 'a');
  assert.equal(stackEntries[3].arg, 'third');
  assert.equal(stackEntries[4].listener, 'b');
  assert.equal(stackEntries[4].arg, 'third');
  assert.equal(stackEntries[5].listener, 'c');
  assert.equal(stackEntries[5].arg, 'third');
  assert.equal(stackEntries[6].listener, 'b');
  assert.equal(stackEntries[6].arg, 'first');

  /////////////////////////////////////////
  // Queue notify strategy
  const queueEntries = create('queue');
  _.each(stackEntries, entry => {
    assert.ok(!(entry.listener === 'c' && entry.arg === 'first'), 'not C,first');
  });
  const testCorrect = (index, listenerName, emitCall) => {
    assert.equal(queueEntries[index].listener, listenerName, `${index} correctness`);
    assert.equal(queueEntries[index].arg, emitCall, `${index} correctness`);
  };
  testCorrect(0, 'a', 'first');
  testCorrect(1, 'b', 'first');
  testCorrect(2, 'a', 'second');
  testCorrect(3, 'b', 'second');
  testCorrect(4, 'a', 'third');
  testCorrect(5, 'b', 'third');
  testCorrect(6, 'c', 'third');
});
QUnit.test('TinyEmitter onBeforeNotify', assert => {
  const state = {
    happiness: 0
  };
  const callForHappinessEmitter = new TinyEmitter(() => {
    state.happiness++;
  });
  let countCalled = 0;
  callForHappinessEmitter.addListener(() => {
    assert.ok(++countCalled === state.happiness, `happiness should change as emitted: ${countCalled}`);
  });
  callForHappinessEmitter.emit();
  callForHappinessEmitter.emit();
  callForHappinessEmitter.emit();
  callForHappinessEmitter.emit();
  callForHappinessEmitter.emit();
  assert.ok(state.happiness === 5, 'end count');
});
QUnit.test('TinyEmitter reverse and random', assert => {
  assert.ok(true, 'first test');
  const emitter = new TinyEmitter();
  const values = [];
  emitter.addListener(() => values.push('a'));
  emitter.addListener(() => values.push('b'));
  emitter.addListener(() => values.push('c'));
  emitter.addListener(() => values.push('d'));
  emitter.emit();
  assert.ok(values.join('') === 'abcd', 'normal order');

  // Check these values when running with ?listenerOrder=reverse or ?listenerOrder=random or ?listenerOrder=random(123)
  console.log(values.join(''));
});
QUnit.test('TinyEmitter listener order should match emit order (reentrantNotify:queue)', assert => {
  const emitter = new TinyEmitter(null, null, 'queue');
  let count = 1;
  emitter.addListener(number => {
    if (number < 10) {
      emitter.emit(number + 1);
      console.log(number);
    }
  });
  emitter.addListener(number => {
    assert.ok(number === count++, `should go in order of emitting: ${number}`);
  });
  emitter.emit(count);
});
QUnit.test('TinyEmitter listener order should match emit order (reentrantNotify:stack)', assert => {
  const emitter = new TinyEmitter(null, null, 'stack');
  let finalCount = 10;
  emitter.addListener(number => {
    if (number < 10) {
      emitter.emit(number + 1);
      console.log(number);
    }
  });
  emitter.addListener(number => {
    assert.ok(number === finalCount--, `should go in order of emitting: ${number}`);
  });
  emitter.emit(1);
});
QUnit.test('TinyEmitter reentrant listener order should not call newly added listener (reentrant:queue)', assert => {
  const emitter = new TinyEmitter(null, null, 'queue');
  let count = 1;
  const neverCall = addedNumber => {
    return number => {
      assert.ok(number > addedNumber, `this should never be called for ${addedNumber} or earlier since it was added after that number's emit call`);
    };
  };
  emitter.addListener(number => {
    if (number < 10) {
      emitter.addListener(neverCall(number));
      emitter.emit(number + 1);
    }
  });
  emitter.addListener(number => {
    assert.ok(number === count++, `should go in order of emitting: ${number}`);
  });
  emitter.emit(count);
});
QUnit.test('TinyEmitter reentrant listener order should not call newly added listener (reentrant:stack)', assert => {
  const emitter = new TinyEmitter(null, null, 'stack');
  const finalNumber = 10;
  let countDown = finalNumber;
  const neverCall = addedNumber => {
    return number => {
      assert.ok(number > addedNumber, `this should never be called for ${addedNumber} or earlier since it was added after that number's emit call`);
    };
  };
  emitter.addListener(number => {
    if (number < finalNumber) {
      emitter.addListener(neverCall(number));
      emitter.emit(number + 1);
    }
  });
  emitter.addListener(number => {
    console.log(number);
    assert.ok(number === countDown--, `should go in order of emitting: ${number}`);
  });
  emitter.emit(1);
});
QUnit.test('TinyEmitter reentrant emit and addListener (reentrantNotify:queue)', assert => {
  const emitter = new TinyEmitter(null, null, 'queue');
  assert.ok('hi');

  // don't change this number without consulting startNumber below
  let count = 1;
  const beforeNestedEmitListenerCalls = [];
  const afterNestedEmitListenerCalls = [];
  emitter.addListener(number => {
    if (number < 10) {
      // This listener should be called update the next emit, even though it is recursive
      emitter.addListener(nestedNumber => {
        assert.ok(nestedNumber !== number, 'nope');
        if (nestedNumber === number + 1) {
          beforeNestedEmitListenerCalls.push(nestedNumber);
        }
      });
      emitter.emit(number + 1);

      // This listener won't be called until n+2 since it was added after then n+1 emit
      emitter.addListener(nestedNumber => {
        assert.ok(nestedNumber !== number, 'nope');
        assert.ok(nestedNumber !== number + 1, 'nope');
        if (nestedNumber === number + 2) {
          afterNestedEmitListenerCalls.push(nestedNumber);
        }
      });
    }
  });
  emitter.addListener(number => {
    assert.ok(number === count++, `should go in order of emitting: ${number}`);
  });
  emitter.emit(count);
  [beforeNestedEmitListenerCalls, afterNestedEmitListenerCalls].forEach((collection, index) => {
    const startNumber = index + 2;
    collection.forEach((number, index) => {
      assert.ok(number === startNumber + index, `called correctly when emitting ${number}`);
    });
  });
});
QUnit.test('Test multiple reentrant emitters (notify:queue)', assert => {
  const lotsInMiddleEmitter = new TinyEmitter(null, null, 'queue');
  const firstLastEmitter = new TinyEmitter(null, null, 'queue');
  lotsInMiddleEmitter.addListener(number => {
    if (number === 1 || number === 10) {
      firstLastEmitter.emit(number);
    }
    if (number < 10) {
      lotsInMiddleEmitter.emit(number + 1);
    }
  });
  firstLastEmitter.addListener(number => {
    if (number < 20) {
      firstLastEmitter.emit(number + 1);
    }
  });
  const actual = [];
  lotsInMiddleEmitter.addListener(number => {
    actual.push(['middle', number]);
  });
  firstLastEmitter.addListener(number => {
    actual.push(['firstLast', number]);
  });
  lotsInMiddleEmitter.emit(1);
  const expected = [..._.range(1, 21).map(number => ['firstLast', number]), ..._.range(1, 10).map(number => ['middle', number]), ..._.range(10, 21).map(number => ['firstLast', number]), ['middle', 10]];
  assert.deepEqual(actual, expected, 'notifications should happen like a queueu');
});
QUnit.test('Test multiple reentrant emitters (notify:stack)', assert => {
  const firstEmitter = new TinyEmitter(null, null, 'stack');
  const secondEmitter = new TinyEmitter(null, null, 'stack');
  secondEmitter.addListener(number => {
    if (number === 1 || number === 10) {
      firstEmitter.emit(number);
    }
    if (number < 10) {
      secondEmitter.emit(number + 1);
    }
  });
  firstEmitter.addListener(number => {
    if (number < 20) {
      firstEmitter.emit(number + 1);
    }
  });
  const actual = [];
  secondEmitter.addListener(number => {
    actual.push(['first', number]);
  });
  firstEmitter.addListener(number => {
    actual.push(['last', number]);
  });
  secondEmitter.emit(1);
  const expected = [..._.range(20, 0).map(number => ['last', number]), ..._.range(20, 9).map(number => ['last', number]), ..._.range(10, 0).map(number => ['first', number])];
  assert.deepEqual(actual, expected, 'Notifications should happen like a stack');
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUaW55RW1pdHRlciIsIlFVbml0IiwibW9kdWxlIiwidGVzdCIsImFzc2VydCIsIm9rIiwiZTEiLCJlbWl0IiwidW5kZWZpbmVkIiwiZTIiLCJfIiwibm9vcCIsImUiLCJ4IiwiYWRkTGlzdGVuZXIiLCJzdGFjayIsImVtaXR0ZXIiLCJhIiwicHVzaCIsInJlbW92ZUxpc3RlbmVyIiwiYiIsImVxdWFsIiwibGVuZ3RoIiwiaGFzTGlzdGVuZXIiLCJkaXNwb3NlIiwid2luZG93IiwidGhyb3dzIiwiY3JlYXRlIiwicmVlbnRyYW50Tm90aWZpY2F0aW9uU3RyYXRlZ3kiLCJlbnRyaWVzIiwiYXJnIiwibGlzdGVuZXIiLCJjIiwic3RhY2tFbnRyaWVzIiwiZWFjaCIsImVudHJ5IiwicXVldWVFbnRyaWVzIiwidGVzdENvcnJlY3QiLCJpbmRleCIsImxpc3RlbmVyTmFtZSIsImVtaXRDYWxsIiwic3RhdGUiLCJoYXBwaW5lc3MiLCJjYWxsRm9ySGFwcGluZXNzRW1pdHRlciIsImNvdW50Q2FsbGVkIiwidmFsdWVzIiwiam9pbiIsImNvbnNvbGUiLCJsb2ciLCJjb3VudCIsIm51bWJlciIsImZpbmFsQ291bnQiLCJuZXZlckNhbGwiLCJhZGRlZE51bWJlciIsImZpbmFsTnVtYmVyIiwiY291bnREb3duIiwiYmVmb3JlTmVzdGVkRW1pdExpc3RlbmVyQ2FsbHMiLCJhZnRlck5lc3RlZEVtaXRMaXN0ZW5lckNhbGxzIiwibmVzdGVkTnVtYmVyIiwiZm9yRWFjaCIsImNvbGxlY3Rpb24iLCJzdGFydE51bWJlciIsImxvdHNJbk1pZGRsZUVtaXR0ZXIiLCJmaXJzdExhc3RFbWl0dGVyIiwiYWN0dWFsIiwiZXhwZWN0ZWQiLCJyYW5nZSIsIm1hcCIsImRlZXBFcXVhbCIsImZpcnN0RW1pdHRlciIsInNlY29uZEVtaXR0ZXIiXSwic291cmNlcyI6WyJUaW55RW1pdHRlclRlc3RzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFFVbml0IHRlc3RzIGZvciBFbWl0dGVyXHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBDaHJpcyBLbHVzZW5kb3JmIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBUaW55RW1pdHRlciwgeyBSZWVudHJhbnROb3RpZmljYXRpb25TdHJhdGVneSB9IGZyb20gJy4vVGlueUVtaXR0ZXIuanMnO1xyXG5pbXBvcnQgVEVtaXR0ZXIgZnJvbSAnLi9URW1pdHRlci5qcyc7XHJcblxyXG5RVW5pdC5tb2R1bGUoICdUaW55RW1pdHRlcicgKTtcclxuXHJcblFVbml0LnRlc3QoICdUaW55RW1pdHRlciBjYW4gZW1pdCBhbnl0aGluZycsIGFzc2VydCA9PiB7XHJcblxyXG4gIGFzc2VydC5vayggdHJ1ZSwgJ1Rva2VuIHRlc3QsIGJlY2F1c2UgZWFjaCB0ZXN0IG11c3QgaGF2ZSBhdCBsZWFzdCBvbmUgYXNzZXJ0LicgKTtcclxuXHJcbiAgY29uc3QgZTE6IFRFbWl0dGVyPFsgYXJnMTogdW5rbm93biwgYXJnMj86IHVua25vd24gXT4gPSBuZXcgVGlueUVtaXR0ZXIoKTtcclxuICBlMS5lbWl0KCAxICk7XHJcbiAgZTEuZW1pdCggMiwgMiApO1xyXG4gIGUxLmVtaXQoIHRydWUgKTtcclxuICBlMS5lbWl0KCAnMiwgMicgKTtcclxuICBlMS5lbWl0KCB1bmRlZmluZWQgKTtcclxuICBlMS5lbWl0KCBudWxsICk7XHJcblxyXG4gIGNvbnN0IGUyOiBURW1pdHRlcjxbIGFyZzE6IHVua25vd24sIGFyZzI/OiB1bmtub3duLCBhcmczPzogdW5rbm93biBdPiA9IG5ldyBUaW55RW1pdHRlcigpO1xyXG4gIGUyLmVtaXQoIG5ldyBUaW55RW1pdHRlcigpLCB7fSwgXy5ub29wKCkgKTtcclxuICBlMi5lbWl0KCAyLCAyICk7XHJcbiAgZTIuZW1pdCggdHJ1ZSApO1xyXG4gIGUyLmVtaXQoICcyLCAyJyApO1xyXG4gIGUyLmVtaXQoIHVuZGVmaW5lZCApO1xyXG4gIGUyLmVtaXQoIG51bGwgKTtcclxuICBlMi5lbWl0KCBuZXcgVGlueUVtaXR0ZXIoKSwgNywgXy5ub29wKCkgKTtcclxuICBlMi5lbWl0KCBuZXcgVGlueUVtaXR0ZXIoKSApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnVGVzdCBlbWl0IHRpbWluZyBUaW55RW1pdHRlcicsIGFzc2VydCA9PiB7XHJcblxyXG4gIGNvbnN0IGUgPSBuZXcgVGlueUVtaXR0ZXIoKTtcclxuICBsZXQgeCA9IDA7XHJcbiAgZS5hZGRMaXN0ZW5lciggKCkgPT4ge3grKzt9ICk7XHJcbiAgZS5hZGRMaXN0ZW5lciggKCkgPT4ge3grKzt9ICk7XHJcbiAgZS5hZGRMaXN0ZW5lciggKCkgPT4ge3grKzt9ICk7XHJcbiAgZS5hZGRMaXN0ZW5lciggKCkgPT4ge3grKzt9ICk7XHJcbiAgZS5hZGRMaXN0ZW5lciggKCkgPT4ge3grKzt9ICk7XHJcblxyXG4gIGUuZW1pdCgpO1xyXG5cclxuICBhc3NlcnQub2soIHggPT09IDUsICdmaXJlZCBhbGwgbGlzdGVuZXJzJyApO1xyXG5cclxuICBjb25zdCBlMSA9IG5ldyBUaW55RW1pdHRlcigpO1xyXG4gIGUxLmFkZExpc3RlbmVyKCAoKSA9PiB7IF8ubm9vcCgpOyB9ICk7XHJcblxyXG4gIC8vIGNvbnN0IHRlc3RFbWl0dGVyID0gKCBlbWl0dGVyLCBudW1iZXJPZkxvb3BpbmdzICkgPT4ge1xyXG4gIC8vXHJcbiAgLy8gICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XHJcbiAgLy9cclxuICAvLyAgIGZvciAoIGxldCBpID0gMDsgaSA8IG51bWJlck9mTG9vcGluZ3M7IGkrKyApIHtcclxuICAvLyAgICAgZW1pdHRlci5lbWl0KCk7XHJcbiAgLy8gICB9XHJcbiAgLy8gICBjb25zdCBlbmQgPSBEYXRlLm5vdygpO1xyXG4gIC8vICAgY29uc3QgdG90YWxUaW1lID0gZW5kIC0gc3RhcnQ7XHJcbiAgLy8gICBjb25zb2xlLmxvZyggYFRpbWUgZm9yICR7bnVtYmVyT2ZMb29waW5nc306IGAsIHRvdGFsVGltZSwgdG90YWxUaW1lIC8gbnVtYmVyT2ZMb29waW5ncyApO1xyXG4gIC8vIH07XHJcbiAgLy9cclxuICAvLyAvLyBObyBhc3NlcnRpb25zIGhlcmUsIGJ1dCBpdCBjYW4gYmUgbmljZSB0byB0ZXN0IGhvdyBleHBlbnNpdmUgZW1pdCBjYWxscyBhcmVcclxuICAvLyB0ZXN0RW1pdHRlciggZTEsIDEwMDAwMDAwICk7XHJcbiAgLy8gdGVzdEVtaXR0ZXIoIGUsIDEwMDAwMDAwICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdUaW55RW1pdHRlciBCYXNpY3MnLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IHN0YWNrOiBBcnJheTxzdHJpbmc+ID0gW107XHJcbiAgY29uc3QgZW1pdHRlciA9IG5ldyBUaW55RW1pdHRlcigpO1xyXG4gIGNvbnN0IGEgPSAoKSA9PiB7XHJcbiAgICBzdGFjay5wdXNoKCAnYScgKTtcclxuICAgIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoIGIgKTtcclxuICB9O1xyXG4gIGNvbnN0IGIgPSAoKSA9PiB7XHJcbiAgICBzdGFjay5wdXNoKCAnYicgKTtcclxuICB9O1xyXG4gIGVtaXR0ZXIuYWRkTGlzdGVuZXIoIGEgKTtcclxuICBlbWl0dGVyLmFkZExpc3RlbmVyKCBiICk7XHJcbiAgZW1pdHRlci5lbWl0KCk7XHJcblxyXG4gIGFzc2VydC5lcXVhbCggc3RhY2subGVuZ3RoLCAyLCAnU2hvdWxkIGhhdmUgcmVjZWl2ZWQgMiBjYWxsYmFja3MnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBzdGFja1sgMCBdLCAnYScsICd0cnVlJyApO1xyXG4gIGFzc2VydC5lcXVhbCggc3RhY2tbIDEgXSwgJ2InLCAndHJ1ZScgKTtcclxuXHJcbiAgYXNzZXJ0LmVxdWFsKCBlbWl0dGVyLmhhc0xpc3RlbmVyKCBiICksIGZhbHNlLCAnYiBzaG91bGQgaGF2ZSBiZWVuIHJlbW92ZWQnICk7XHJcblxyXG4gIGVtaXR0ZXIuZGlzcG9zZSgpO1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4gZW1pdHRlci5hZGRMaXN0ZW5lciggKCkgPT4geyBfLm5vb3AoKTsgfSApLCAnc2hvdWxkIHRocm93IGVycm9yIHdoZW4gYWRkaW5nIGEgbGlzdGVuZXIgdG8gZGlzcG9zZWQnICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdUaW55RW1pdHRlciBUcmlja3MnLCBhc3NlcnQgPT4ge1xyXG5cclxuICBjb25zdCBjcmVhdGUgPSAoIHJlZW50cmFudE5vdGlmaWNhdGlvblN0cmF0ZWd5OiBSZWVudHJhbnROb3RpZmljYXRpb25TdHJhdGVneSApOiBBcnJheTx7IGxpc3RlbmVyOiBzdHJpbmc7IGFyZzogc3RyaW5nIH0+ID0+IHtcclxuICAgIGNvbnN0IGVudHJpZXM6IEFycmF5PHsgbGlzdGVuZXI6IHN0cmluZzsgYXJnOiBzdHJpbmcgfT4gPSBbXTtcclxuXHJcbiAgICBjb25zdCBlbWl0dGVyOiBURW1pdHRlcjxbIHN0cmluZyBdPiA9IG5ldyBUaW55RW1pdHRlciggbnVsbCwgbnVsbCwgcmVlbnRyYW50Tm90aWZpY2F0aW9uU3RyYXRlZ3kgKTtcclxuXHJcbiAgICBjb25zdCBhID0gKCBhcmc6IHN0cmluZyApID0+IHtcclxuICAgICAgZW50cmllcy5wdXNoKCB7IGxpc3RlbmVyOiAnYScsIGFyZzogYXJnIH0gKTtcclxuXHJcbiAgICAgIGlmICggYXJnID09PSAnZmlyc3QnICkge1xyXG4gICAgICAgIGVtaXR0ZXIuZW1pdCggJ3NlY29uZCcgKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIGNvbnN0IGIgPSAoIGFyZzogc3RyaW5nICkgPT4ge1xyXG4gICAgICBlbnRyaWVzLnB1c2goIHsgbGlzdGVuZXI6ICdiJywgYXJnOiBhcmcgfSApO1xyXG5cclxuICAgICAgaWYgKCBhcmcgPT09ICdzZWNvbmQnICkge1xyXG4gICAgICAgIGVtaXR0ZXIuYWRkTGlzdGVuZXIoIGMgKTtcclxuICAgICAgICBlbWl0dGVyLmVtaXQoICd0aGlyZCcgKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIGNvbnN0IGMgPSAoIGFyZzogc3RyaW5nICkgPT4ge1xyXG4gICAgICBlbnRyaWVzLnB1c2goIHsgbGlzdGVuZXI6ICdjJywgYXJnOiBhcmcgfSApO1xyXG4gICAgfTtcclxuXHJcbiAgICBlbWl0dGVyLmFkZExpc3RlbmVyKCBhICk7XHJcbiAgICBlbWl0dGVyLmFkZExpc3RlbmVyKCBiICk7XHJcbiAgICBlbWl0dGVyLmVtaXQoICdmaXJzdCcgKTtcclxuICAgIHJldHVybiBlbnRyaWVzO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IHN0YWNrRW50cmllcyA9IGNyZWF0ZSggJ3N0YWNrJyApO1xyXG5cclxuICAvKipcclxuICAgKiBTdGFjayBub3RpZnkgc3RyYXRlZ3lcclxuICAgKlxyXG4gICAqIEV4cGVjdGVkIG9yZGVyOlxyXG4gICAqICAgYSBmaXJzdFxyXG4gICAqICAgICBhIHNlY29uZFxyXG4gICAqICAgICBiIHNlY29uZFxyXG4gICAqICAgICAgIGEgdGhpcmRcclxuICAgKiAgICAgICBiIHRoaXJkXHJcbiAgICogICAgICAgYyB0aGlyZFxyXG4gICAqICAgYiBmaXJzdFxyXG4gICAqXHJcbiAgICogSXQgbG9va3MgbGlrZSBcImMgZmlyc3RcIiBpcyAoY3VycmVudGx5PykgYmVpbmcgdHJpZ2dlcmVkIHNpbmNlIGRlZmVuZENhbGxiYWNrcyBvbmx5IGRlZmVuZHMgdGhlIHRvcCBvZiB0aGUgc3RhY2suXHJcbiAgICogSWYgdGhlIHN0YWNrIGlzIFsgdW5kZWZlbmRlZCwgdW5kZWZlbmRlZCBdLCBjaGFuZ2luZyBsaXN0ZW5lcnMgY29waWVzIG9ubHkgdGhlIHRvcCwgbGVhdmluZ1xyXG4gICAqIFsgdW5kZWZlbmRlZCwgZGVmZW5kZWQgXSwgYW5kIG91ciBmaXJzdCBldmVudCB0cmlnZ2VycyBhIGxpc3RlbmVyIHRoYXQgd2Fzbid0IGxpc3RlbmluZyB3aGVuIGl0IHdhcyBjYWxsZWQuXHJcbiAgICovXHJcbiAgXy5lYWNoKCBzdGFja0VudHJpZXMsIGVudHJ5ID0+IHtcclxuICAgIGFzc2VydC5vayggISggZW50cnkubGlzdGVuZXIgPT09ICdjJyAmJiBlbnRyeS5hcmcgPT09ICdmaXJzdCcgKSwgJ25vdCBDLGZpcnN0JyApO1xyXG4gIH0gKTtcclxuXHJcbiAgYXNzZXJ0LmVxdWFsKCBzdGFja0VudHJpZXMubGVuZ3RoLCA3LCAnU2hvdWxkIGhhdmUgNyBjYWxsYmFja3MnICk7XHJcblxyXG4gIGFzc2VydC5lcXVhbCggc3RhY2tFbnRyaWVzWyAwIF0ubGlzdGVuZXIsICdhJyApO1xyXG4gIGFzc2VydC5lcXVhbCggc3RhY2tFbnRyaWVzWyAwIF0uYXJnLCAnZmlyc3QnICk7XHJcblxyXG4gIGFzc2VydC5lcXVhbCggc3RhY2tFbnRyaWVzWyAxIF0ubGlzdGVuZXIsICdhJyApO1xyXG4gIGFzc2VydC5lcXVhbCggc3RhY2tFbnRyaWVzWyAxIF0uYXJnLCAnc2Vjb25kJyApO1xyXG5cclxuICBhc3NlcnQuZXF1YWwoIHN0YWNrRW50cmllc1sgMiBdLmxpc3RlbmVyLCAnYicgKTtcclxuICBhc3NlcnQuZXF1YWwoIHN0YWNrRW50cmllc1sgMiBdLmFyZywgJ3NlY29uZCcgKTtcclxuXHJcbiAgYXNzZXJ0LmVxdWFsKCBzdGFja0VudHJpZXNbIDMgXS5saXN0ZW5lciwgJ2EnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBzdGFja0VudHJpZXNbIDMgXS5hcmcsICd0aGlyZCcgKTtcclxuXHJcbiAgYXNzZXJ0LmVxdWFsKCBzdGFja0VudHJpZXNbIDQgXS5saXN0ZW5lciwgJ2InICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBzdGFja0VudHJpZXNbIDQgXS5hcmcsICd0aGlyZCcgKTtcclxuXHJcbiAgYXNzZXJ0LmVxdWFsKCBzdGFja0VudHJpZXNbIDUgXS5saXN0ZW5lciwgJ2MnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBzdGFja0VudHJpZXNbIDUgXS5hcmcsICd0aGlyZCcgKTtcclxuXHJcbiAgYXNzZXJ0LmVxdWFsKCBzdGFja0VudHJpZXNbIDYgXS5saXN0ZW5lciwgJ2InICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBzdGFja0VudHJpZXNbIDYgXS5hcmcsICdmaXJzdCcgKTtcclxuXHJcbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAvLyBRdWV1ZSBub3RpZnkgc3RyYXRlZ3lcclxuICBjb25zdCBxdWV1ZUVudHJpZXMgPSBjcmVhdGUoICdxdWV1ZScgKTtcclxuXHJcbiAgXy5lYWNoKCBzdGFja0VudHJpZXMsIGVudHJ5ID0+IHtcclxuICAgIGFzc2VydC5vayggISggZW50cnkubGlzdGVuZXIgPT09ICdjJyAmJiBlbnRyeS5hcmcgPT09ICdmaXJzdCcgKSwgJ25vdCBDLGZpcnN0JyApO1xyXG4gIH0gKTtcclxuICBjb25zdCB0ZXN0Q29ycmVjdCA9ICggaW5kZXg6IG51bWJlciwgbGlzdGVuZXJOYW1lOiBzdHJpbmcsIGVtaXRDYWxsOiBzdHJpbmcgKSA9PiB7XHJcbiAgICBhc3NlcnQuZXF1YWwoIHF1ZXVlRW50cmllc1sgaW5kZXggXS5saXN0ZW5lciwgbGlzdGVuZXJOYW1lLCBgJHtpbmRleH0gY29ycmVjdG5lc3NgICk7XHJcbiAgICBhc3NlcnQuZXF1YWwoIHF1ZXVlRW50cmllc1sgaW5kZXggXS5hcmcsIGVtaXRDYWxsLCBgJHtpbmRleH0gY29ycmVjdG5lc3NgICk7XHJcbiAgfTtcclxuICB0ZXN0Q29ycmVjdCggMCwgJ2EnLCAnZmlyc3QnICk7XHJcbiAgdGVzdENvcnJlY3QoIDEsICdiJywgJ2ZpcnN0JyApO1xyXG4gIHRlc3RDb3JyZWN0KCAyLCAnYScsICdzZWNvbmQnICk7XHJcbiAgdGVzdENvcnJlY3QoIDMsICdiJywgJ3NlY29uZCcgKTtcclxuICB0ZXN0Q29ycmVjdCggNCwgJ2EnLCAndGhpcmQnICk7XHJcbiAgdGVzdENvcnJlY3QoIDUsICdiJywgJ3RoaXJkJyApO1xyXG4gIHRlc3RDb3JyZWN0KCA2LCAnYycsICd0aGlyZCcgKTtcclxufSApO1xyXG5cclxuXHJcblFVbml0LnRlc3QoICdUaW55RW1pdHRlciBvbkJlZm9yZU5vdGlmeScsIGFzc2VydCA9PiB7XHJcblxyXG4gIGNvbnN0IHN0YXRlID0geyBoYXBwaW5lc3M6IDAgfTtcclxuXHJcbiAgY29uc3QgY2FsbEZvckhhcHBpbmVzc0VtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXIoICgpID0+IHtcclxuICAgIHN0YXRlLmhhcHBpbmVzcysrO1xyXG4gIH0gKTtcclxuXHJcbiAgbGV0IGNvdW50Q2FsbGVkID0gMDtcclxuICBjYWxsRm9ySGFwcGluZXNzRW1pdHRlci5hZGRMaXN0ZW5lciggKCkgPT4ge1xyXG5cclxuICAgIGFzc2VydC5vayggKytjb3VudENhbGxlZCA9PT0gc3RhdGUuaGFwcGluZXNzLCBgaGFwcGluZXNzIHNob3VsZCBjaGFuZ2UgYXMgZW1pdHRlZDogJHtjb3VudENhbGxlZH1gICk7XHJcblxyXG4gIH0gKTtcclxuXHJcbiAgY2FsbEZvckhhcHBpbmVzc0VtaXR0ZXIuZW1pdCgpO1xyXG4gIGNhbGxGb3JIYXBwaW5lc3NFbWl0dGVyLmVtaXQoKTtcclxuICBjYWxsRm9ySGFwcGluZXNzRW1pdHRlci5lbWl0KCk7XHJcbiAgY2FsbEZvckhhcHBpbmVzc0VtaXR0ZXIuZW1pdCgpO1xyXG4gIGNhbGxGb3JIYXBwaW5lc3NFbWl0dGVyLmVtaXQoKTtcclxuICBhc3NlcnQub2soIHN0YXRlLmhhcHBpbmVzcyA9PT0gNSwgJ2VuZCBjb3VudCcgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1RpbnlFbWl0dGVyIHJldmVyc2UgYW5kIHJhbmRvbScsIGFzc2VydCA9PiB7XHJcblxyXG4gIGFzc2VydC5vayggdHJ1ZSwgJ2ZpcnN0IHRlc3QnICk7XHJcblxyXG4gIGNvbnN0IGVtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXIoKTtcclxuICBjb25zdCB2YWx1ZXM6IHN0cmluZ1tdID0gW107XHJcbiAgZW1pdHRlci5hZGRMaXN0ZW5lciggKCkgPT4gdmFsdWVzLnB1c2goICdhJyApICk7XHJcbiAgZW1pdHRlci5hZGRMaXN0ZW5lciggKCkgPT4gdmFsdWVzLnB1c2goICdiJyApICk7XHJcbiAgZW1pdHRlci5hZGRMaXN0ZW5lciggKCkgPT4gdmFsdWVzLnB1c2goICdjJyApICk7XHJcbiAgZW1pdHRlci5hZGRMaXN0ZW5lciggKCkgPT4gdmFsdWVzLnB1c2goICdkJyApICk7XHJcblxyXG4gIGVtaXR0ZXIuZW1pdCgpO1xyXG4gIGFzc2VydC5vayggdmFsdWVzLmpvaW4oICcnICkgPT09ICdhYmNkJywgJ25vcm1hbCBvcmRlcicgKTtcclxuXHJcbiAgLy8gQ2hlY2sgdGhlc2UgdmFsdWVzIHdoZW4gcnVubmluZyB3aXRoID9saXN0ZW5lck9yZGVyPXJldmVyc2Ugb3IgP2xpc3RlbmVyT3JkZXI9cmFuZG9tIG9yID9saXN0ZW5lck9yZGVyPXJhbmRvbSgxMjMpXHJcbiAgY29uc29sZS5sb2coIHZhbHVlcy5qb2luKCAnJyApICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdUaW55RW1pdHRlciBsaXN0ZW5lciBvcmRlciBzaG91bGQgbWF0Y2ggZW1pdCBvcmRlciAocmVlbnRyYW50Tm90aWZ5OnF1ZXVlKScsIGFzc2VydCA9PiB7XHJcbiAgY29uc3QgZW1pdHRlciA9IG5ldyBUaW55RW1pdHRlcjxbIG51bWJlciBdPiggbnVsbCwgbnVsbCwgJ3F1ZXVlJyApO1xyXG4gIGxldCBjb3VudCA9IDE7XHJcbiAgZW1pdHRlci5hZGRMaXN0ZW5lciggbnVtYmVyID0+IHtcclxuICAgIGlmICggbnVtYmVyIDwgMTAgKSB7XHJcbiAgICAgIGVtaXR0ZXIuZW1pdCggbnVtYmVyICsgMSApO1xyXG4gICAgICBjb25zb2xlLmxvZyggbnVtYmVyICk7XHJcbiAgICB9XHJcbiAgfSApO1xyXG4gIGVtaXR0ZXIuYWRkTGlzdGVuZXIoIG51bWJlciA9PiB7XHJcbiAgICBhc3NlcnQub2soIG51bWJlciA9PT0gY291bnQrKywgYHNob3VsZCBnbyBpbiBvcmRlciBvZiBlbWl0dGluZzogJHtudW1iZXJ9YCApO1xyXG4gIH0gKTtcclxuICBlbWl0dGVyLmVtaXQoIGNvdW50ICk7XHJcbn0gKTtcclxuXHJcblxyXG5RVW5pdC50ZXN0KCAnVGlueUVtaXR0ZXIgbGlzdGVuZXIgb3JkZXIgc2hvdWxkIG1hdGNoIGVtaXQgb3JkZXIgKHJlZW50cmFudE5vdGlmeTpzdGFjayknLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IGVtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXI8WyBudW1iZXIgXT4oIG51bGwsIG51bGwsICdzdGFjaycgKTtcclxuICBsZXQgZmluYWxDb3VudCA9IDEwO1xyXG4gIGVtaXR0ZXIuYWRkTGlzdGVuZXIoIG51bWJlciA9PiB7XHJcbiAgICBpZiAoIG51bWJlciA8IDEwICkge1xyXG4gICAgICBlbWl0dGVyLmVtaXQoIG51bWJlciArIDEgKTtcclxuICAgICAgY29uc29sZS5sb2coIG51bWJlciApO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuICBlbWl0dGVyLmFkZExpc3RlbmVyKCBudW1iZXIgPT4ge1xyXG4gICAgYXNzZXJ0Lm9rKCBudW1iZXIgPT09IGZpbmFsQ291bnQtLSwgYHNob3VsZCBnbyBpbiBvcmRlciBvZiBlbWl0dGluZzogJHtudW1iZXJ9YCApO1xyXG4gIH0gKTtcclxuICBlbWl0dGVyLmVtaXQoIDEgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1RpbnlFbWl0dGVyIHJlZW50cmFudCBsaXN0ZW5lciBvcmRlciBzaG91bGQgbm90IGNhbGwgbmV3bHkgYWRkZWQgbGlzdGVuZXIgKHJlZW50cmFudDpxdWV1ZSknLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IGVtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXI8WyBudW1iZXIgXT4oIG51bGwsIG51bGwsICdxdWV1ZScgKTtcclxuICBsZXQgY291bnQgPSAxO1xyXG4gIGNvbnN0IG5ldmVyQ2FsbCA9ICggYWRkZWROdW1iZXI6IG51bWJlciApID0+IHtcclxuICAgIHJldHVybiAoIG51bWJlcjogbnVtYmVyICkgPT4ge1xyXG4gICAgICBhc3NlcnQub2soIG51bWJlciA+IGFkZGVkTnVtYmVyLCBgdGhpcyBzaG91bGQgbmV2ZXIgYmUgY2FsbGVkIGZvciAke2FkZGVkTnVtYmVyfSBvciBlYXJsaWVyIHNpbmNlIGl0IHdhcyBhZGRlZCBhZnRlciB0aGF0IG51bWJlcidzIGVtaXQgY2FsbGAgKTtcclxuICAgIH07XHJcbiAgfTtcclxuICBlbWl0dGVyLmFkZExpc3RlbmVyKCBudW1iZXIgPT4ge1xyXG4gICAgaWYgKCBudW1iZXIgPCAxMCApIHtcclxuICAgICAgZW1pdHRlci5hZGRMaXN0ZW5lciggbmV2ZXJDYWxsKCBudW1iZXIgKSApO1xyXG4gICAgICBlbWl0dGVyLmVtaXQoIG51bWJlciArIDEgKTtcclxuICAgIH1cclxuICB9ICk7XHJcbiAgZW1pdHRlci5hZGRMaXN0ZW5lciggbnVtYmVyID0+IHtcclxuICAgIGFzc2VydC5vayggbnVtYmVyID09PSBjb3VudCsrLCBgc2hvdWxkIGdvIGluIG9yZGVyIG9mIGVtaXR0aW5nOiAke251bWJlcn1gICk7XHJcbiAgfSApO1xyXG4gIGVtaXR0ZXIuZW1pdCggY291bnQgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1RpbnlFbWl0dGVyIHJlZW50cmFudCBsaXN0ZW5lciBvcmRlciBzaG91bGQgbm90IGNhbGwgbmV3bHkgYWRkZWQgbGlzdGVuZXIgKHJlZW50cmFudDpzdGFjayknLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IGVtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXI8WyBudW1iZXIgXT4oIG51bGwsIG51bGwsICdzdGFjaycgKTtcclxuICBjb25zdCBmaW5hbE51bWJlciA9IDEwO1xyXG4gIGxldCBjb3VudERvd24gPSBmaW5hbE51bWJlcjtcclxuICBjb25zdCBuZXZlckNhbGwgPSAoIGFkZGVkTnVtYmVyOiBudW1iZXIgKSA9PiB7XHJcbiAgICByZXR1cm4gKCBudW1iZXI6IG51bWJlciApID0+IHtcclxuICAgICAgYXNzZXJ0Lm9rKCBudW1iZXIgPiBhZGRlZE51bWJlciwgYHRoaXMgc2hvdWxkIG5ldmVyIGJlIGNhbGxlZCBmb3IgJHthZGRlZE51bWJlcn0gb3IgZWFybGllciBzaW5jZSBpdCB3YXMgYWRkZWQgYWZ0ZXIgdGhhdCBudW1iZXIncyBlbWl0IGNhbGxgICk7XHJcbiAgICB9O1xyXG4gIH07XHJcbiAgZW1pdHRlci5hZGRMaXN0ZW5lciggbnVtYmVyID0+IHtcclxuICAgIGlmICggbnVtYmVyIDwgZmluYWxOdW1iZXIgKSB7XHJcbiAgICAgIGVtaXR0ZXIuYWRkTGlzdGVuZXIoIG5ldmVyQ2FsbCggbnVtYmVyICkgKTtcclxuICAgICAgZW1pdHRlci5lbWl0KCBudW1iZXIgKyAxICk7XHJcbiAgICB9XHJcbiAgfSApO1xyXG4gIGVtaXR0ZXIuYWRkTGlzdGVuZXIoIG51bWJlciA9PiB7XHJcbiAgICBjb25zb2xlLmxvZyggbnVtYmVyICk7XHJcbiAgICBhc3NlcnQub2soIG51bWJlciA9PT0gY291bnREb3duLS0sIGBzaG91bGQgZ28gaW4gb3JkZXIgb2YgZW1pdHRpbmc6ICR7bnVtYmVyfWAgKTtcclxuICB9ICk7XHJcbiAgZW1pdHRlci5lbWl0KCAxICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdUaW55RW1pdHRlciByZWVudHJhbnQgZW1pdCBhbmQgYWRkTGlzdGVuZXIgKHJlZW50cmFudE5vdGlmeTpxdWV1ZSknLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IGVtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXI8WyBudW1iZXIgXT4oIG51bGwsIG51bGwsICdxdWV1ZScgKTtcclxuICBhc3NlcnQub2soICdoaScgKTtcclxuXHJcbiAgLy8gZG9uJ3QgY2hhbmdlIHRoaXMgbnVtYmVyIHdpdGhvdXQgY29uc3VsdGluZyBzdGFydE51bWJlciBiZWxvd1xyXG4gIGxldCBjb3VudCA9IDE7XHJcbiAgY29uc3QgYmVmb3JlTmVzdGVkRW1pdExpc3RlbmVyQ2FsbHM6IG51bWJlcltdID0gW107XHJcbiAgY29uc3QgYWZ0ZXJOZXN0ZWRFbWl0TGlzdGVuZXJDYWxsczogbnVtYmVyW10gPSBbXTtcclxuICBlbWl0dGVyLmFkZExpc3RlbmVyKCBudW1iZXIgPT4ge1xyXG4gICAgaWYgKCBudW1iZXIgPCAxMCApIHtcclxuXHJcbiAgICAgIC8vIFRoaXMgbGlzdGVuZXIgc2hvdWxkIGJlIGNhbGxlZCB1cGRhdGUgdGhlIG5leHQgZW1pdCwgZXZlbiB0aG91Z2ggaXQgaXMgcmVjdXJzaXZlXHJcbiAgICAgIGVtaXR0ZXIuYWRkTGlzdGVuZXIoIG5lc3RlZE51bWJlciA9PiB7XHJcbiAgICAgICAgYXNzZXJ0Lm9rKCBuZXN0ZWROdW1iZXIgIT09IG51bWJlciwgJ25vcGUnICk7XHJcbiAgICAgICAgaWYgKCBuZXN0ZWROdW1iZXIgPT09IG51bWJlciArIDEgKSB7XHJcbiAgICAgICAgICBiZWZvcmVOZXN0ZWRFbWl0TGlzdGVuZXJDYWxscy5wdXNoKCBuZXN0ZWROdW1iZXIgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuICAgICAgZW1pdHRlci5lbWl0KCBudW1iZXIgKyAxICk7XHJcblxyXG4gICAgICAvLyBUaGlzIGxpc3RlbmVyIHdvbid0IGJlIGNhbGxlZCB1bnRpbCBuKzIgc2luY2UgaXQgd2FzIGFkZGVkIGFmdGVyIHRoZW4gbisxIGVtaXRcclxuICAgICAgZW1pdHRlci5hZGRMaXN0ZW5lciggbmVzdGVkTnVtYmVyID0+IHtcclxuICAgICAgICBhc3NlcnQub2soIG5lc3RlZE51bWJlciAhPT0gbnVtYmVyLCAnbm9wZScgKTtcclxuICAgICAgICBhc3NlcnQub2soIG5lc3RlZE51bWJlciAhPT0gbnVtYmVyICsgMSwgJ25vcGUnICk7XHJcbiAgICAgICAgaWYgKCBuZXN0ZWROdW1iZXIgPT09IG51bWJlciArIDIgKSB7XHJcbiAgICAgICAgICBhZnRlck5lc3RlZEVtaXRMaXN0ZW5lckNhbGxzLnB1c2goIG5lc3RlZE51bWJlciApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuXHJcbiAgZW1pdHRlci5hZGRMaXN0ZW5lciggbnVtYmVyID0+IHtcclxuICAgIGFzc2VydC5vayggbnVtYmVyID09PSBjb3VudCsrLCBgc2hvdWxkIGdvIGluIG9yZGVyIG9mIGVtaXR0aW5nOiAke251bWJlcn1gICk7XHJcbiAgfSApO1xyXG4gIGVtaXR0ZXIuZW1pdCggY291bnQgKTtcclxuXHJcbiAgW1xyXG4gICAgYmVmb3JlTmVzdGVkRW1pdExpc3RlbmVyQ2FsbHMsXHJcbiAgICBhZnRlck5lc3RlZEVtaXRMaXN0ZW5lckNhbGxzXHJcbiAgXS5mb3JFYWNoKCAoIGNvbGxlY3Rpb24sIGluZGV4ICkgPT4ge1xyXG5cclxuICAgIGNvbnN0IHN0YXJ0TnVtYmVyID0gaW5kZXggKyAyO1xyXG4gICAgY29sbGVjdGlvbi5mb3JFYWNoKCAoIG51bWJlciwgaW5kZXggKSA9PiB7XHJcbiAgICAgIGFzc2VydC5vayggbnVtYmVyID09PSBzdGFydE51bWJlciArIGluZGV4LCBgY2FsbGVkIGNvcnJlY3RseSB3aGVuIGVtaXR0aW5nICR7bnVtYmVyfWAgKTtcclxuICAgIH0gKTtcclxuICB9ICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdUZXN0IG11bHRpcGxlIHJlZW50cmFudCBlbWl0dGVycyAobm90aWZ5OnF1ZXVlKScsIGFzc2VydCA9PiB7XHJcbiAgY29uc3QgbG90c0luTWlkZGxlRW1pdHRlciA9IG5ldyBUaW55RW1pdHRlcjxbIG51bWJlciBdPiggbnVsbCwgbnVsbCwgJ3F1ZXVlJyApO1xyXG4gIGNvbnN0IGZpcnN0TGFzdEVtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXI8WyBudW1iZXIgXT4oIG51bGwsIG51bGwsICdxdWV1ZScgKTtcclxuICBsb3RzSW5NaWRkbGVFbWl0dGVyLmFkZExpc3RlbmVyKCBudW1iZXIgPT4ge1xyXG4gICAgaWYgKCBudW1iZXIgPT09IDEgfHwgbnVtYmVyID09PSAxMCApIHtcclxuICAgICAgZmlyc3RMYXN0RW1pdHRlci5lbWl0KCBudW1iZXIgKTtcclxuICAgIH1cclxuICAgIGlmICggbnVtYmVyIDwgMTAgKSB7XHJcbiAgICAgIGxvdHNJbk1pZGRsZUVtaXR0ZXIuZW1pdCggbnVtYmVyICsgMSApO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuICBmaXJzdExhc3RFbWl0dGVyLmFkZExpc3RlbmVyKCBudW1iZXIgPT4ge1xyXG4gICAgaWYgKCBudW1iZXIgPCAyMCApIHtcclxuICAgICAgZmlyc3RMYXN0RW1pdHRlci5lbWl0KCBudW1iZXIgKyAxICk7XHJcbiAgICB9XHJcbiAgfSApO1xyXG4gIGNvbnN0IGFjdHVhbDogQXJyYXk8cmVhZG9ubHkgWyBzdHJpbmcsIG51bWJlciBdPiA9IFtdO1xyXG4gIGxvdHNJbk1pZGRsZUVtaXR0ZXIuYWRkTGlzdGVuZXIoIG51bWJlciA9PiB7XHJcbiAgICBhY3R1YWwucHVzaCggWyAnbWlkZGxlJywgbnVtYmVyIF0gYXMgY29uc3QgKTtcclxuICB9ICk7XHJcbiAgZmlyc3RMYXN0RW1pdHRlci5hZGRMaXN0ZW5lciggbnVtYmVyID0+IHtcclxuICAgIGFjdHVhbC5wdXNoKCBbICdmaXJzdExhc3QnLCBudW1iZXIgXSBhcyBjb25zdCApO1xyXG4gIH0gKTtcclxuICBsb3RzSW5NaWRkbGVFbWl0dGVyLmVtaXQoIDEgKTtcclxuXHJcbiAgY29uc3QgZXhwZWN0ZWQ6IEFycmF5PHJlYWRvbmx5IFsgc3RyaW5nLCBudW1iZXIgXT4gPSBbXHJcbiAgICAuLi5fLnJhbmdlKCAxLCAyMSApLm1hcCggbnVtYmVyID0+IFsgJ2ZpcnN0TGFzdCcsIG51bWJlciBdIGFzIGNvbnN0ICksXHJcbiAgICAuLi5fLnJhbmdlKCAxLCAxMCApLm1hcCggbnVtYmVyID0+IFsgJ21pZGRsZScsIG51bWJlciBdIGFzIGNvbnN0ICksXHJcbiAgICAuLi5fLnJhbmdlKCAxMCwgMjEgKS5tYXAoIG51bWJlciA9PiBbICdmaXJzdExhc3QnLCBudW1iZXIgXSBhcyBjb25zdCApLFxyXG4gICAgWyAnbWlkZGxlJywgMTAgXVxyXG4gIF07XHJcbiAgYXNzZXJ0LmRlZXBFcXVhbCggYWN0dWFsLCBleHBlY3RlZCwgJ25vdGlmaWNhdGlvbnMgc2hvdWxkIGhhcHBlbiBsaWtlIGEgcXVldWV1JyApO1xyXG59ICk7XHJcblxyXG5cclxuUVVuaXQudGVzdCggJ1Rlc3QgbXVsdGlwbGUgcmVlbnRyYW50IGVtaXR0ZXJzIChub3RpZnk6c3RhY2spJywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCBmaXJzdEVtaXR0ZXIgPSBuZXcgVGlueUVtaXR0ZXI8WyBudW1iZXIgXT4oIG51bGwsIG51bGwsICdzdGFjaycgKTtcclxuICBjb25zdCBzZWNvbmRFbWl0dGVyID0gbmV3IFRpbnlFbWl0dGVyPFsgbnVtYmVyIF0+KCBudWxsLCBudWxsLCAnc3RhY2snICk7XHJcbiAgc2Vjb25kRW1pdHRlci5hZGRMaXN0ZW5lciggbnVtYmVyID0+IHtcclxuICAgIGlmICggbnVtYmVyID09PSAxIHx8IG51bWJlciA9PT0gMTAgKSB7XHJcbiAgICAgIGZpcnN0RW1pdHRlci5lbWl0KCBudW1iZXIgKTtcclxuICAgIH1cclxuICAgIGlmICggbnVtYmVyIDwgMTAgKSB7XHJcbiAgICAgIHNlY29uZEVtaXR0ZXIuZW1pdCggbnVtYmVyICsgMSApO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuICBmaXJzdEVtaXR0ZXIuYWRkTGlzdGVuZXIoIG51bWJlciA9PiB7XHJcbiAgICBpZiAoIG51bWJlciA8IDIwICkge1xyXG4gICAgICBmaXJzdEVtaXR0ZXIuZW1pdCggbnVtYmVyICsgMSApO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuICBjb25zdCBhY3R1YWw6IEFycmF5PHJlYWRvbmx5IFsgc3RyaW5nLCBudW1iZXIgXT4gPSBbXTtcclxuICBzZWNvbmRFbWl0dGVyLmFkZExpc3RlbmVyKCBudW1iZXIgPT4ge1xyXG4gICAgYWN0dWFsLnB1c2goIFsgJ2ZpcnN0JywgbnVtYmVyIF0gYXMgY29uc3QgKTtcclxuICB9ICk7XHJcbiAgZmlyc3RFbWl0dGVyLmFkZExpc3RlbmVyKCBudW1iZXIgPT4ge1xyXG4gICAgYWN0dWFsLnB1c2goIFsgJ2xhc3QnLCBudW1iZXIgXSBhcyBjb25zdCApO1xyXG4gIH0gKTtcclxuICBzZWNvbmRFbWl0dGVyLmVtaXQoIDEgKTtcclxuXHJcbiAgY29uc3QgZXhwZWN0ZWQ6IEFycmF5PHJlYWRvbmx5IFsgc3RyaW5nLCBudW1iZXIgXT4gPSBbXHJcbiAgICAuLi5fLnJhbmdlKCAyMCwgMCApLm1hcCggbnVtYmVyID0+IFsgJ2xhc3QnLCBudW1iZXIgXSBhcyBjb25zdCApLFxyXG4gICAgLi4uXy5yYW5nZSggMjAsIDkgKS5tYXAoIG51bWJlciA9PiBbICdsYXN0JywgbnVtYmVyIF0gYXMgY29uc3QgKSxcclxuICAgIC4uLl8ucmFuZ2UoIDEwLCAwICkubWFwKCBudW1iZXIgPT4gWyAnZmlyc3QnLCBudW1iZXIgXSBhcyBjb25zdCApXHJcbiAgXTtcclxuICBhc3NlcnQuZGVlcEVxdWFsKCBhY3R1YWwsIGV4cGVjdGVkLCAnTm90aWZpY2F0aW9ucyBzaG91bGQgaGFwcGVuIGxpa2UgYSBzdGFjaycgKTtcclxufSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsV0FBVyxNQUF5QyxrQkFBa0I7QUFHN0VDLEtBQUssQ0FBQ0MsTUFBTSxDQUFFLGFBQWMsQ0FBQztBQUU3QkQsS0FBSyxDQUFDRSxJQUFJLENBQUUsK0JBQStCLEVBQUVDLE1BQU0sSUFBSTtFQUVyREEsTUFBTSxDQUFDQyxFQUFFLENBQUUsSUFBSSxFQUFFLDhEQUErRCxDQUFDO0VBRWpGLE1BQU1DLEVBQStDLEdBQUcsSUFBSU4sV0FBVyxDQUFDLENBQUM7RUFDekVNLEVBQUUsQ0FBQ0MsSUFBSSxD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