// Copyright 2020-2024, University of Colorado Boulder

/**
 * QUnit tests for createObservableArray
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Random from '../../dot/js/Random.js';
import arrayRemove from '../../phet-core/js/arrayRemove.js';
import createObservableArray from './createObservableArray.js';
QUnit.module('createObservableArray');
QUnit.test('Hello', assert => {
  assert.ok('first test');
  const run = (name, command) => {
    console.log(`START: ${name}`);
    const result = command();
    console.log(`END: ${name}\n\n`);
    return result;
  };
  const observableArray = run('create', () => createObservableArray({
    elements: ['a', 'bc']
  }));
  assert.ok(Array.isArray(observableArray), 'isArray check');
  assert.ok(observableArray instanceof Array, 'instanceof check'); // eslint-disable-line no-instanceof-array

  run('push hello', () => observableArray.push('hello'));
  run('set element 0', () => {
    observableArray[0] = 'dinosaur';
  });
  run('set element 5', () => {
    observableArray[5] = 'hamburger';
  });
  run('length = 0', () => {
    observableArray.length = 0;
  });
  run('a,b,c', () => {
    observableArray.push('a');
    observableArray.push('b');
    observableArray.push('c');
  });
  run('splice', () => observableArray.splice(0, 1));
});

// Creates an array that is tested with the given modifiers against the expected results.
const testArrayEmitters = (assert, modifier, expected) => {
  const array = createObservableArray();
  const deltas = [];
  array.elementAddedEmitter.addListener(e => deltas.push({
    type: 'added',
    value: e
  }));
  array.elementRemovedEmitter.addListener(e => deltas.push({
    type: 'removed',
    value: e
  }));
  modifier(array);
  assert.deepEqual(deltas, expected);
};
QUnit.test('Test axon array length', assert => {
  const array = createObservableArray();
  array.push('hello');
  assert.equal(array.lengthProperty.value, 1, 'array lengthProperty test');
  assert.equal(array.length, 1, 'array length test');
  array.pop();
  assert.equal(array.lengthProperty.value, 0, 'array lengthProperty test');
  assert.equal(array.length, 0, 'array length test');
  array.push(1, 2, 3);
  assert.equal(array.lengthProperty.value, 3, 'array lengthProperty test');
  assert.equal(array.length, 3, 'array length test');
  array.shift();
  assert.equal(array.lengthProperty.value, 2, 'array lengthProperty test');
  assert.equal(array.length, 2, 'array length test');
  array.splice(0, 2, 'parrot', 'anemone', 'blue');
  assert.equal(array.lengthProperty.value, 3, 'array lengthProperty test');
  assert.equal(array.length, 3, 'array length test');
  array.unshift('qunit', 'test');
  assert.equal(array.lengthProperty.value, 5, 'array lengthProperty test');
  assert.equal(array.length, 5, 'array length test');
  array.length = 0;
  assert.equal(array.lengthProperty.value, 0, 'array lengthProperty test after setLengthAndNotify');
  assert.equal(array.length, 0, 'array length test after setLengthAndNotify');
});
QUnit.test('Test delete', assert => {
  testArrayEmitters(assert, array => {
    array.push('test');
    delete array[0];

    // FOR REVIEWER: The commented out code does not appear to have been testing anything. Expected does not include any
    // return value comparisons for array.hello. Should this be actually testing something or safe to delete?
    // array.hello = 'there';
    // delete array.hello;

    array[-7] = 'time';
    delete array[-7];
  }, [{
    type: 'added',
    value: 'test'
  }, {
    type: 'removed',
    value: 'test'
  }]);
});
QUnit.test('Test same value', assert => {
  testArrayEmitters(assert, array => {
    array.push('test');
    array.shuffle(new Random()); // eslint-disable-line bad-sim-text
  }, [{
    type: 'added',
    value: 'test'
  }]);
});
QUnit.test('Test axon array', assert => {
  testArrayEmitters(assert, array => {
    array.push('test');
    array.push('test');
    array.push('test');
    array.push('test');
    array.length = 1;
    array.pop();
    array.push('hello');
    array.push('hello');
    array.push('hello');
    array.push('time');
    arrayRemove(array, 'hello');
  }, [{
    type: 'added',
    value: 'test'
  }, {
    type: 'added',
    value: 'test'
  }, {
    type: 'added',
    value: 'test'
  }, {
    type: 'added',
    value: 'test'
  }, {
    type: 'removed',
    value: 'test'
  }, {
    type: 'removed',
    value: 'test'
  }, {
    type: 'removed',
    value: 'test'
  }, {
    type: 'removed',
    value: 'test'
  }, {
    type: 'added',
    value: 'hello'
  }, {
    type: 'added',
    value: 'hello'
  }, {
    type: 'added',
    value: 'hello'
  }, {
    type: 'added',
    value: 'time'
  }, {
    type: 'removed',
    value: 'hello'
  }]);
});
QUnit.test('Test axon array using Array.prototype.push.call etc', assert => {
  testArrayEmitters(assert, array => {
    array.push('test');
    array.push('test');
    array.push('test');
    array.push('test');
    array.length = 1;
    array.pop();
    array.push('hello');
    Array.prototype.push.call(array, 'hello');
    array.push('hello');
    Array.prototype.push.apply(array, ['time']);
    arrayRemove(array, 'hello');
  }, [{
    type: 'added',
    value: 'test'
  }, {
    type: 'added',
    value: 'test'
  }, {
    type: 'added',
    value: 'test'
  }, {
    type: 'added',
    value: 'test'
  }, {
    type: 'removed',
    value: 'test'
  }, {
    type: 'removed',
    value: 'test'
  }, {
    type: 'removed',
    value: 'test'
  }, {
    type: 'removed',
    value: 'test'
  }, {
    type: 'added',
    value: 'hello'
  }, {
    type: 'added',
    value: 'hello'
  }, {
    type: 'added',
    value: 'hello'
  }, {
    type: 'added',
    value: 'time'
  }, {
    type: 'removed',
    value: 'hello'
  }]);
});
QUnit.test('Test axon array setLength', assert => {
  testArrayEmitters(assert, array => {
    array.push('hello');
    array.length = 0;
    array.length = 4;
    array[12] = 'cheetah';
  }, [{
    type: 'added',
    value: 'hello'
  }, {
    type: 'removed',
    value: 'hello'
  }, {
    type: 'added',
    value: 'cheetah'
  }]);
});
QUnit.test('Test createObservableArray.push', assert => {
  testArrayEmitters(assert, array => {
    array.push('hello', 'there', 'old', undefined);
  }, [{
    type: 'added',
    value: 'hello'
  }, {
    type: 'added',
    value: 'there'
  }, {
    type: 'added',
    value: 'old'
  }, {
    type: 'added',
    value: undefined
  }]);
});
QUnit.test('Test createObservableArray.pop', assert => {
  testArrayEmitters(assert, array => {
    array.push(7);
    const popped = array.pop();
    assert.equal(popped, 7);
  }, [{
    type: 'added',
    value: 7
  }, {
    type: 'removed',
    value: 7
  }]);
});
QUnit.test('Test createObservableArray.shift', assert => {
  testArrayEmitters(assert, array => {
    array.push(7, 3);
    const removed = array.shift();
    assert.equal(removed, 7);
  }, [{
    type: 'added',
    value: 7
  }, {
    type: 'added',
    value: 3
  }, {
    type: 'removed',
    value: 7
  }]);
});
QUnit.test('Test createObservableArray.unshift', assert => {
  // From this example: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
  testArrayEmitters(assert, array => {
    array.push('angel', 'clown', 'drum', 'sturgeon');
    array.unshift('trumpet', 'dino');
    assert.ok(array[0] === 'trumpet');
  }, [{
    type: 'added',
    value: 'angel'
  }, {
    type: 'added',
    value: 'clown'
  }, {
    type: 'added',
    value: 'drum'
  }, {
    type: 'added',
    value: 'sturgeon'
  }, {
    type: 'added',
    value: 'trumpet'
  }, {
    type: 'added',
    value: 'dino'
  }]);
});

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/copyWithin
QUnit.test('Test createObservableArray.copyWithin', assert => {
  testArrayEmitters(assert, array => {
    array.push(1, 2, 3, 4, 5);
    array.copyWithin(-2, 0); // [1, 2, 3, 1, 2]
  }, [{
    type: 'added',
    value: 1
  }, {
    type: 'added',
    value: 2
  }, {
    type: 'added',
    value: 3
  }, {
    type: 'added',
    value: 4
  }, {
    type: 'added',
    value: 5
  }, {
    type: 'removed',
    value: 4
  }, {
    type: 'removed',
    value: 5
  }, {
    type: 'added',
    value: 1
  }, {
    type: 'added',
    value: 2
  }]);
  testArrayEmitters(assert, array => {
    array.push(1, 2, 3, 4, 5);
    array.copyWithin(0, 3); //  [4, 5, 3, 4, 5]
  }, [{
    type: 'added',
    value: 1
  }, {
    type: 'added',
    value: 2
  }, {
    type: 'added',
    value: 3
  }, {
    type: 'added',
    value: 4
  }, {
    type: 'added',
    value: 5
  }, {
    type: 'removed',
    value: 1
  }, {
    type: 'removed',
    value: 2
  }, {
    type: 'added',
    value: 4
  }, {
    type: 'added',
    value: 5
  }]);
  testArrayEmitters(assert, array => {
    array.push(1, 2, 3, 4, 5);
    array.copyWithin(0, 3, 4); //  [4, 2, 3, 4, 5]
  }, [{
    type: 'added',
    value: 1
  }, {
    type: 'added',
    value: 2
  }, {
    type: 'added',
    value: 3
  }, {
    type: 'added',
    value: 4
  }, {
    type: 'added',
    value: 5
  }, {
    type: 'removed',
    value: 1
  }, {
    type: 'added',
    value: 4
  }]);
  testArrayEmitters(assert, array => {
    array.push(1, 2, 3, 4, 5);
    array.copyWithin(-2, -3, -1); //   [1, 2, 3, 3, 4]
  }, [{
    type: 'added',
    value: 1
  }, {
    type: 'added',
    value: 2
  }, {
    type: 'added',
    value: 3
  }, {
    type: 'added',
    value: 4
  }, {
    type: 'added',
    value: 5
  }, {
    type: 'removed',
    value: 5
  }, {
    type: 'added',
    value: 3
  }]);
});

// Examples from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill
QUnit.test('Test createObservableArray.fill', assert => {
  testArrayEmitters(assert, array => {
    array.push(1, 2, 3);
    array.fill(4); // [4,4,4]
  }, [{
    type: 'added',
    value: 1
  }, {
    type: 'added',
    value: 2
  }, {
    type: 'added',
    value: 3
  }, {
    type: 'removed',
    value: 1
  }, {
    type: 'removed',
    value: 2
  }, {
    type: 'removed',
    value: 3
  }, {
    type: 'added',
    value: 4
  }, {
    type: 'added',
    value: 4
  }, {
    type: 'added',
    value: 4
  }]);
  testArrayEmitters(assert, array => {
    array.push(1, 2, 3);
    array.fill(4, 1); // [1,4,4]
  }, [{
    type: 'added',
    value: 1
  }, {
    type: 'added',
    value: 2
  }, {
    type: 'added',
    value: 3
  }, {
    type: 'removed',
    value: 2
  }, {
    type: 'removed',
    value: 3
  }, {
    type: 'added',
    value: 4
  }, {
    type: 'added',
    value: 4
  }]);
  testArrayEmitters(assert, array => {
    array.push(1, 2, 3);
    array.fill(4, 1, 2); // [1,4,3]
  }, [{
    type: 'added',
    value: 1
  }, {
    type: 'added',
    value: 2
  }, {
    type: 'added',
    value: 3
  }, {
    type: 'removed',
    value: 2
  }, {
    type: 'added',
    value: 4
  }]);
  testArrayEmitters(assert, array => {
    array.push(1, 2, 3);
    array.fill(4, 1, 1); // [1,2,3]
  }, [{
    type: 'added',
    value: 1
  }, {
    type: 'added',
    value: 2
  }, {
    type: 'added',
    value: 3
  }]);
  testArrayEmitters(assert, array => {
    array.push(1, 2, 3);
    array.fill(4, 3, 3); // [1,2,3]
  }, [{
    type: 'added',
    value: 1
  }, {
    type: 'added',
    value: 2
  }, {
    type: 'added',
    value: 3
  }]);
  testArrayEmitters(assert, array => {
    array.push(1, 2, 3);
    array.fill(4, -3, -2); // [4,2,3]
  }, [{
    type: 'added',
    value: 1
  }, {
    type: 'added',
    value: 2
  }, {
    type: 'added',
    value: 3
  }, {
    type: 'removed',
    value: 1
  }, {
    type: 'added',
    value: 4
  }]);
  testArrayEmitters(assert, array => {
    array.push(1, 2, 3);
    array.fill(4, NaN, NaN); // [1,2,3]
  }, [{
    type: 'added',
    value: 1
  }, {
    type: 'added',
    value: 2
  }, {
    type: 'added',
    value: 3
  }]);
  testArrayEmitters(assert, array => {
    array.push(1, 2, 3);
    array.fill(4, 3, 5); // [1,2,3]
  }, [{
    type: 'added',
    value: 1
  }, {
    type: 'added',
    value: 2
  }, {
    type: 'added',
    value: 3
  }]);
});
QUnit.test('Test that length is correct in emitter callbacks after push', assert => {
  const a = createObservableArray();
  a.elementAddedEmitter.addListener(element => {
    assert.equal(a.length, 1);
    assert.equal(a.lengthProperty.value, 1);
    assert.equal(element, 'hello');
  });
  a.push('hello');
});
QUnit.test('Test return types', assert => {
  assert.ok(true);
  const a = createObservableArray();
  a.push('hello');
  const x = a.slice();
  x.unshift(7);
  assert.ok(true, 'make sure it is safe to unshift on a sliced createObservableArray');
});
QUnit.test('Test constructor arguments', assert => {
  const a1 = createObservableArray({
    length: 7
  });
  assert.equal(a1.lengthProperty.value, 7, 'array length test');
  a1.push('hello');
  assert.equal(a1.lengthProperty.value, 8, 'array length test');
  assert.equal(a1[7], 'hello', 'for push, element should be added at the end of the array');
  const a2 = createObservableArray({
    elements: ['hi', 'there']
  });
  assert.equal(a2.length, 2, 'array length test');
  assert.equal(a2[0], 'hi', 'first element correct');
  assert.equal(a2[1], 'there', 'second element correct');
  assert.equal(a2.length, 2, 'length correct');
  let a3 = null;
  window.assert && assert.throws(() => {
    a3 = createObservableArray({
      elements: [3],
      length: 1
    });
  }, 'length and elements are mutually exclusive');
  assert.equal(a3, null, 'should not have been assigned');

  // valid element types should succeed
  const a4 = createObservableArray({
    elements: ['a', 'b'],
    // @ts-expect-error, force set value type for testing
    valueType: 'string'
  });
  assert.ok(!!a4, 'correct element types should succeed');

  // invalid element types should fail
  window.assert && assert.throws(() => createObservableArray({
    elements: ['a', 'b'],
    // @ts-expect-error, force set value type for testing
    valueType: 'number'
  }), 'should fail for invalid element types');
});
QUnit.test('Test function values', assert => {
  const array = createObservableArray();
  let number = 7;
  array.push(() => {
    number++;
  });
  array[0]();
  assert.equal(8, number, 'array should support function values');
});
QUnit.test('createObservableArrayTests misc', assert => {
  const array = createObservableArray();
  assert.ok(Array.isArray(array), 'should be an array');
});
QUnit.test('createObservableArrayTests notification deferring', assert => {
  const array = createObservableArray();

  // @ts-expect-error
  array.setNotificationsDeferred(true);
  // @ts-expect-error
  assert.ok(array.notificationsDeferred, 'should be');
  let fullCount = 0;
  array.addItemAddedListener(count => {
    fullCount += count;
  });
  array.push(5);
  assert.equal(fullCount, 0);
  // @ts-expect-error
  array.setNotificationsDeferred(false);

  // @ts-expect-error
  assert.ok(!array.notificationsDeferred, 'should be');
  assert.equal(fullCount, 5);
  array.push(5);
  assert.equal(fullCount, 10);
  // @ts-expect-error
  array.setNotificationsDeferred(true);
  array.push(5);
  array.push(4);
  array.push(6);
  assert.equal(fullCount, 10);
  // @ts-expect-error
  array.setNotificationsDeferred(false);
  assert.equal(fullCount, 25);
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSYW5kb20iLCJhcnJheVJlbW92ZSIsImNyZWF0ZU9ic2VydmFibGVBcnJheSIsIlFVbml0IiwibW9kdWxlIiwidGVzdCIsImFzc2VydCIsIm9rIiwicnVuIiwibmFtZSIsImNvbW1hbmQiLCJjb25zb2xlIiwibG9nIiwicmVzdWx0Iiwib2JzZXJ2YWJsZUFycmF5IiwiZWxlbWVudHMiLCJBcnJheSIsImlzQXJyYXkiLCJwdXNoIiwibGVuZ3RoIiwic3BsaWNlIiwidGVzdEFycmF5RW1pdHRlcnMiLCJtb2RpZmllciIsImV4cGVjdGVkIiwiYXJyYXkiLCJkZWx0YXMiLCJlbGVtZW50QWRkZWRFbWl0dGVyIiwiYWRkTGlzdGVuZXIiLCJlIiwidHlwZSIsInZhbHVlIiwiZWxlbWVudFJlbW92ZWRFbWl0dGVyIiwiZGVlcEVxdWFsIiwiZXF1YWwiLCJsZW5ndGhQcm9wZXJ0eSIsInBvcCIsInNoaWZ0IiwidW5zaGlmdCIsInNodWZmbGUiLCJwcm90b3R5cGUiLCJjYWxsIiwiYXBwbHkiLCJ1bmRlZmluZWQiLCJwb3BwZWQiLCJyZW1vdmVkIiwiY29weVdpdGhpbiIsImZpbGwiLCJOYU4iLCJhIiwiZWxlbWVudCIsIngiLCJzbGljZSIsImExIiwiYTIiLCJhMyIsIndpbmRvdyIsInRocm93cyIsImE0IiwidmFsdWVUeXBlIiwibnVtYmVyIiwic2V0Tm90aWZpY2F0aW9uc0RlZmVycmVkIiwibm90aWZpY2F0aW9uc0RlZmVycmVkIiwiZnVsbENvdW50IiwiYWRkSXRlbUFkZGVkTGlzdGVuZXIiLCJjb3VudCJdLCJzb3VyY2VzIjpbImNyZWF0ZU9ic2VydmFibGVBcnJheVRlc3RzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIwLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFFVbml0IHRlc3RzIGZvciBjcmVhdGVPYnNlcnZhYmxlQXJyYXlcclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgUmFuZG9tIGZyb20gJy4uLy4uL2RvdC9qcy9SYW5kb20uanMnO1xyXG5pbXBvcnQgYXJyYXlSZW1vdmUgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL2FycmF5UmVtb3ZlLmpzJztcclxuaW1wb3J0IGNyZWF0ZU9ic2VydmFibGVBcnJheSwgeyBPYnNlcnZhYmxlQXJyYXkgfSBmcm9tICcuL2NyZWF0ZU9ic2VydmFibGVBcnJheS5qcyc7XHJcbmltcG9ydCBJbnRlbnRpb25hbEFueSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvSW50ZW50aW9uYWxBbnkuanMnO1xyXG5cclxuUVVuaXQubW9kdWxlKCAnY3JlYXRlT2JzZXJ2YWJsZUFycmF5JyApO1xyXG5cclxudHlwZSBydW5DYWxsYmFjayA9ICgpID0+IEludGVudGlvbmFsQW55O1xyXG5cclxudHlwZSB0ZXN0QXJyYXlFbWl0dGVyc0NhbGxiYWNrID0geyAoIGFycmF5OiBPYnNlcnZhYmxlQXJyYXk8dW5rbm93bj4gKTogdm9pZCB9O1xyXG5cclxuUVVuaXQudGVzdCggJ0hlbGxvJywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgYXNzZXJ0Lm9rKCAnZmlyc3QgdGVzdCcgKTtcclxuXHJcbiAgY29uc3QgcnVuID0gKCBuYW1lOiBzdHJpbmcsIGNvbW1hbmQ6IHJ1bkNhbGxiYWNrICkgPT4ge1xyXG4gICAgY29uc29sZS5sb2coIGBTVEFSVDogJHtuYW1lfWAgKTtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGNvbW1hbmQoKTtcclxuICAgIGNvbnNvbGUubG9nKCBgRU5EOiAke25hbWV9XFxuXFxuYCApO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9O1xyXG5cclxuICBjb25zdCBvYnNlcnZhYmxlQXJyYXkgPSBydW4oICdjcmVhdGUnLCAoKSA9PiBjcmVhdGVPYnNlcnZhYmxlQXJyYXkoIHtcclxuICAgIGVsZW1lbnRzOiBbICdhJywgJ2JjJyBdXHJcbiAgfSApICk7XHJcblxyXG4gIGFzc2VydC5vayggQXJyYXkuaXNBcnJheSggb2JzZXJ2YWJsZUFycmF5ICksICdpc0FycmF5IGNoZWNrJyApO1xyXG4gIGFzc2VydC5vayggb2JzZXJ2YWJsZUFycmF5IGluc3RhbmNlb2YgQXJyYXksICdpbnN0YW5jZW9mIGNoZWNrJyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWluc3RhbmNlb2YtYXJyYXlcclxuXHJcbiAgcnVuKCAncHVzaCBoZWxsbycsICgpID0+IG9ic2VydmFibGVBcnJheS5wdXNoKCAnaGVsbG8nICkgKTtcclxuICBydW4oICdzZXQgZWxlbWVudCAwJywgKCkgPT4geyBvYnNlcnZhYmxlQXJyYXlbIDAgXSA9ICdkaW5vc2F1cic7IH0gKTtcclxuICBydW4oICdzZXQgZWxlbWVudCA1JywgKCkgPT4geyBvYnNlcnZhYmxlQXJyYXlbIDUgXSA9ICdoYW1idXJnZXInOyB9ICk7XHJcbiAgcnVuKCAnbGVuZ3RoID0gMCcsICgpID0+IHsgb2JzZXJ2YWJsZUFycmF5Lmxlbmd0aCA9IDA7IH0gKTtcclxuICBydW4oICdhLGIsYycsICgpID0+IHtcclxuICAgIG9ic2VydmFibGVBcnJheS5wdXNoKCAnYScgKTtcclxuICAgIG9ic2VydmFibGVBcnJheS5wdXNoKCAnYicgKTtcclxuICAgIG9ic2VydmFibGVBcnJheS5wdXNoKCAnYycgKTtcclxuICB9ICk7XHJcbiAgcnVuKCAnc3BsaWNlJywgKCkgPT4gb2JzZXJ2YWJsZUFycmF5LnNwbGljZSggMCwgMSApICk7XHJcbn0gKTtcclxuXHJcbi8vIENyZWF0ZXMgYW4gYXJyYXkgdGhhdCBpcyB0ZXN0ZWQgd2l0aCB0aGUgZ2l2ZW4gbW9kaWZpZXJzIGFnYWluc3QgdGhlIGV4cGVjdGVkIHJlc3VsdHMuXHJcbmNvbnN0IHRlc3RBcnJheUVtaXR0ZXJzID0gKCBhc3NlcnQ6IEFzc2VydCwgbW9kaWZpZXI6IHRlc3RBcnJheUVtaXR0ZXJzQ2FsbGJhY2ssIGV4cGVjdGVkOiBBcnJheTx1bmtub3duPiApID0+IHtcclxuICBjb25zdCBhcnJheSA9IGNyZWF0ZU9ic2VydmFibGVBcnJheSgpO1xyXG4gIGNvbnN0IGRlbHRhczogQXJyYXk8dW5rbm93bj4gPSBbXTtcclxuICBhcnJheS5lbGVtZW50QWRkZWRFbWl0dGVyLmFkZExpc3RlbmVyKCBlID0+IGRlbHRhcy5wdXNoKCB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiBlIH0gKSApO1xyXG4gIGFycmF5LmVsZW1lbnRSZW1vdmVkRW1pdHRlci5hZGRMaXN0ZW5lciggZSA9PiBkZWx0YXMucHVzaCggeyB0eXBlOiAncmVtb3ZlZCcsIHZhbHVlOiBlIH0gKSApO1xyXG4gIG1vZGlmaWVyKCBhcnJheSApO1xyXG4gIGFzc2VydC5kZWVwRXF1YWwoIGRlbHRhcywgZXhwZWN0ZWQgKTtcclxufTtcclxuXHJcblFVbml0LnRlc3QoICdUZXN0IGF4b24gYXJyYXkgbGVuZ3RoJywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgY29uc3QgYXJyYXkgPSBjcmVhdGVPYnNlcnZhYmxlQXJyYXkoKTtcclxuICBhcnJheS5wdXNoKCAnaGVsbG8nICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBhcnJheS5sZW5ndGhQcm9wZXJ0eS52YWx1ZSwgMSwgJ2FycmF5IGxlbmd0aFByb3BlcnR5IHRlc3QnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBhcnJheS5sZW5ndGgsIDEsICdhcnJheSBsZW5ndGggdGVzdCcgKTtcclxuICBhcnJheS5wb3AoKTtcclxuICBhc3NlcnQuZXF1YWwoIGFycmF5Lmxlbmd0aFByb3BlcnR5LnZhbHVlLCAwLCAnYXJyYXkgbGVuZ3RoUHJvcGVydHkgdGVzdCcgKTtcclxuICBhc3NlcnQuZXF1YWwoIGFycmF5Lmxlbmd0aCwgMCwgJ2FycmF5IGxlbmd0aCB0ZXN0JyApO1xyXG4gIGFycmF5LnB1c2goIDEsIDIsIDMgKTtcclxuICBhc3NlcnQuZXF1YWwoIGFycmF5Lmxlbmd0aFByb3BlcnR5LnZhbHVlLCAzLCAnYXJyYXkgbGVuZ3RoUHJvcGVydHkgdGVzdCcgKTtcclxuICBhc3NlcnQuZXF1YWwoIGFycmF5Lmxlbmd0aCwgMywgJ2FycmF5IGxlbmd0aCB0ZXN0JyApO1xyXG4gIGFycmF5LnNoaWZ0KCk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBhcnJheS5sZW5ndGhQcm9wZXJ0eS52YWx1ZSwgMiwgJ2FycmF5IGxlbmd0aFByb3BlcnR5IHRlc3QnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBhcnJheS5sZW5ndGgsIDIsICdhcnJheSBsZW5ndGggdGVzdCcgKTtcclxuICBhcnJheS5zcGxpY2UoIDAsIDIsICdwYXJyb3QnLCAnYW5lbW9uZScsICdibHVlJyApO1xyXG4gIGFzc2VydC5lcXVhbCggYXJyYXkubGVuZ3RoUHJvcGVydHkudmFsdWUsIDMsICdhcnJheSBsZW5ndGhQcm9wZXJ0eSB0ZXN0JyApO1xyXG4gIGFzc2VydC5lcXVhbCggYXJyYXkubGVuZ3RoLCAzLCAnYXJyYXkgbGVuZ3RoIHRlc3QnICk7XHJcbiAgYXJyYXkudW5zaGlmdCggJ3F1bml0JywgJ3Rlc3QnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBhcnJheS5sZW5ndGhQcm9wZXJ0eS52YWx1ZSwgNSwgJ2FycmF5IGxlbmd0aFByb3BlcnR5IHRlc3QnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBhcnJheS5sZW5ndGgsIDUsICdhcnJheSBsZW5ndGggdGVzdCcgKTtcclxuICBhcnJheS5sZW5ndGggPSAwO1xyXG4gIGFzc2VydC5lcXVhbCggYXJyYXkubGVuZ3RoUHJvcGVydHkudmFsdWUsIDAsICdhcnJheSBsZW5ndGhQcm9wZXJ0eSB0ZXN0IGFmdGVyIHNldExlbmd0aEFuZE5vdGlmeScgKTtcclxuICBhc3NlcnQuZXF1YWwoIGFycmF5Lmxlbmd0aCwgMCwgJ2FycmF5IGxlbmd0aCB0ZXN0IGFmdGVyIHNldExlbmd0aEFuZE5vdGlmeScgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1Rlc3QgZGVsZXRlJywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgdGVzdEFycmF5RW1pdHRlcnMoIGFzc2VydCwgYXJyYXkgPT4ge1xyXG5cclxuICAgIGFycmF5LnB1c2goICd0ZXN0JyApO1xyXG4gICAgZGVsZXRlIGFycmF5WyAwIF07XHJcblxyXG4gICAgLy8gRk9SIFJFVklFV0VSOiBUaGUgY29tbWVudGVkIG91dCBjb2RlIGRvZXMgbm90IGFwcGVhciB0byBoYXZlIGJlZW4gdGVzdGluZyBhbnl0aGluZy4gRXhwZWN0ZWQgZG9lcyBub3QgaW5jbHVkZSBhbnlcclxuICAgIC8vIHJldHVybiB2YWx1ZSBjb21wYXJpc29ucyBmb3IgYXJyYXkuaGVsbG8uIFNob3VsZCB0aGlzIGJlIGFjdHVhbGx5IHRlc3Rpbmcgc29tZXRoaW5nIG9yIHNhZmUgdG8gZGVsZXRlP1xyXG4gICAgLy8gYXJyYXkuaGVsbG8gPSAndGhlcmUnO1xyXG4gICAgLy8gZGVsZXRlIGFycmF5LmhlbGxvO1xyXG5cclxuICAgIGFycmF5WyAtNyBdID0gJ3RpbWUnO1xyXG4gICAgZGVsZXRlIGFycmF5WyAtNyBdO1xyXG4gIH0sIFtcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6ICd0ZXN0JyB9LFxyXG4gICAgeyB0eXBlOiAncmVtb3ZlZCcsIHZhbHVlOiAndGVzdCcgfVxyXG4gIF0gKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1Rlc3Qgc2FtZSB2YWx1ZScsIGFzc2VydCA9PiB7XHJcblxyXG4gIHRlc3RBcnJheUVtaXR0ZXJzKCBhc3NlcnQsIGFycmF5ID0+IHtcclxuXHJcbiAgICBhcnJheS5wdXNoKCAndGVzdCcgKTtcclxuICAgIGFycmF5LnNodWZmbGUoIG5ldyBSYW5kb20oKSApOy8vIGVzbGludC1kaXNhYmxlLWxpbmUgYmFkLXNpbS10ZXh0XHJcbiAgfSwgW1xyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogJ3Rlc3QnIH1cclxuICBdICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdUZXN0IGF4b24gYXJyYXknLCBhc3NlcnQgPT4ge1xyXG5cclxuICB0ZXN0QXJyYXlFbWl0dGVycyggYXNzZXJ0LCBhcnJheSA9PiB7XHJcblxyXG4gICAgYXJyYXkucHVzaCggJ3Rlc3QnICk7XHJcbiAgICBhcnJheS5wdXNoKCAndGVzdCcgKTtcclxuICAgIGFycmF5LnB1c2goICd0ZXN0JyApO1xyXG4gICAgYXJyYXkucHVzaCggJ3Rlc3QnICk7XHJcblxyXG4gICAgYXJyYXkubGVuZ3RoID0gMTtcclxuXHJcbiAgICBhcnJheS5wb3AoKTtcclxuICAgIGFycmF5LnB1c2goICdoZWxsbycgKTtcclxuICAgIGFycmF5LnB1c2goICdoZWxsbycgKTtcclxuICAgIGFycmF5LnB1c2goICdoZWxsbycgKTtcclxuICAgIGFycmF5LnB1c2goICd0aW1lJyApO1xyXG5cclxuICAgIGFycmF5UmVtb3ZlKCBhcnJheSwgJ2hlbGxvJyApO1xyXG4gIH0sIFtcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6ICd0ZXN0JyB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogJ3Rlc3QnIH0sXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiAndGVzdCcgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6ICd0ZXN0JyB9LFxyXG4gICAgeyB0eXBlOiAncmVtb3ZlZCcsIHZhbHVlOiAndGVzdCcgfSxcclxuICAgIHsgdHlwZTogJ3JlbW92ZWQnLCB2YWx1ZTogJ3Rlc3QnIH0sXHJcbiAgICB7IHR5cGU6ICdyZW1vdmVkJywgdmFsdWU6ICd0ZXN0JyB9LFxyXG4gICAgeyB0eXBlOiAncmVtb3ZlZCcsIHZhbHVlOiAndGVzdCcgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6ICdoZWxsbycgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6ICdoZWxsbycgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6ICdoZWxsbycgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6ICd0aW1lJyB9LFxyXG4gICAgeyB0eXBlOiAncmVtb3ZlZCcsIHZhbHVlOiAnaGVsbG8nIH1cclxuICBdICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdUZXN0IGF4b24gYXJyYXkgdXNpbmcgQXJyYXkucHJvdG90eXBlLnB1c2guY2FsbCBldGMnLCBhc3NlcnQgPT4ge1xyXG5cclxuICB0ZXN0QXJyYXlFbWl0dGVycyggYXNzZXJ0LCBhcnJheSA9PiB7XHJcblxyXG4gICAgYXJyYXkucHVzaCggJ3Rlc3QnICk7XHJcbiAgICBhcnJheS5wdXNoKCAndGVzdCcgKTtcclxuICAgIGFycmF5LnB1c2goICd0ZXN0JyApO1xyXG4gICAgYXJyYXkucHVzaCggJ3Rlc3QnICk7XHJcblxyXG4gICAgYXJyYXkubGVuZ3RoID0gMTtcclxuXHJcbiAgICBhcnJheS5wb3AoKTtcclxuICAgIGFycmF5LnB1c2goICdoZWxsbycgKTtcclxuICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmNhbGwoIGFycmF5LCAnaGVsbG8nICk7XHJcbiAgICBhcnJheS5wdXNoKCAnaGVsbG8nICk7XHJcbiAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSggYXJyYXksIFsgJ3RpbWUnIF0gKTtcclxuICAgIGFycmF5UmVtb3ZlKCBhcnJheSwgJ2hlbGxvJyApO1xyXG4gIH0sIFtcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6ICd0ZXN0JyB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogJ3Rlc3QnIH0sXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiAndGVzdCcgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6ICd0ZXN0JyB9LFxyXG4gICAgeyB0eXBlOiAncmVtb3ZlZCcsIHZhbHVlOiAndGVzdCcgfSxcclxuICAgIHsgdHlwZTogJ3JlbW92ZWQnLCB2YWx1ZTogJ3Rlc3QnIH0sXHJcbiAgICB7IHR5cGU6ICdyZW1vdmVkJywgdmFsdWU6ICd0ZXN0JyB9LFxyXG4gICAgeyB0eXBlOiAncmVtb3ZlZCcsIHZhbHVlOiAndGVzdCcgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6ICdoZWxsbycgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6ICdoZWxsbycgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6ICdoZWxsbycgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6ICd0aW1lJyB9LFxyXG4gICAgeyB0eXBlOiAncmVtb3ZlZCcsIHZhbHVlOiAnaGVsbG8nIH1cclxuICBdICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdUZXN0IGF4b24gYXJyYXkgc2V0TGVuZ3RoJywgYXNzZXJ0ID0+IHtcclxuICB0ZXN0QXJyYXlFbWl0dGVycyggYXNzZXJ0LCBhcnJheSA9PiB7XHJcbiAgICBhcnJheS5wdXNoKCAnaGVsbG8nICk7XHJcbiAgICBhcnJheS5sZW5ndGggPSAwO1xyXG4gICAgYXJyYXkubGVuZ3RoID0gNDtcclxuICAgIGFycmF5WyAxMiBdID0gJ2NoZWV0YWgnO1xyXG4gIH0sIFtcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6ICdoZWxsbycgfSxcclxuICAgIHsgdHlwZTogJ3JlbW92ZWQnLCB2YWx1ZTogJ2hlbGxvJyB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogJ2NoZWV0YWgnIH1cclxuICBdICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdUZXN0IGNyZWF0ZU9ic2VydmFibGVBcnJheS5wdXNoJywgYXNzZXJ0ID0+IHtcclxuICB0ZXN0QXJyYXlFbWl0dGVycyggYXNzZXJ0LCBhcnJheSA9PiB7XHJcbiAgICBhcnJheS5wdXNoKCAnaGVsbG8nLCAndGhlcmUnLCAnb2xkJywgdW5kZWZpbmVkICk7XHJcbiAgfSwgW1xyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogJ2hlbGxvJyB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogJ3RoZXJlJyB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogJ29sZCcgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6IHVuZGVmaW5lZCB9XHJcbiAgXSApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnVGVzdCBjcmVhdGVPYnNlcnZhYmxlQXJyYXkucG9wJywgYXNzZXJ0ID0+IHtcclxuICB0ZXN0QXJyYXlFbWl0dGVycyggYXNzZXJ0LCBhcnJheSA9PiB7XHJcbiAgICBhcnJheS5wdXNoKCA3ICk7XHJcbiAgICBjb25zdCBwb3BwZWQgPSBhcnJheS5wb3AoKTtcclxuICAgIGFzc2VydC5lcXVhbCggcG9wcGVkLCA3ICk7XHJcbiAgfSwgW1xyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogNyB9LFxyXG4gICAgeyB0eXBlOiAncmVtb3ZlZCcsIHZhbHVlOiA3IH1cclxuICBdICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdUZXN0IGNyZWF0ZU9ic2VydmFibGVBcnJheS5zaGlmdCcsIGFzc2VydCA9PiB7XHJcbiAgdGVzdEFycmF5RW1pdHRlcnMoIGFzc2VydCwgYXJyYXkgPT4ge1xyXG4gICAgYXJyYXkucHVzaCggNywgMyApO1xyXG4gICAgY29uc3QgcmVtb3ZlZCA9IGFycmF5LnNoaWZ0KCk7XHJcbiAgICBhc3NlcnQuZXF1YWwoIHJlbW92ZWQsIDcgKTtcclxuICB9LCBbXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiA3IH0sXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiAzIH0sXHJcbiAgICB7IHR5cGU6ICdyZW1vdmVkJywgdmFsdWU6IDcgfVxyXG4gIF0gKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1Rlc3QgY3JlYXRlT2JzZXJ2YWJsZUFycmF5LnVuc2hpZnQnLCBhc3NlcnQgPT4ge1xyXG5cclxuICAvLyBGcm9tIHRoaXMgZXhhbXBsZTogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvc3BsaWNlXHJcbiAgdGVzdEFycmF5RW1pdHRlcnMoIGFzc2VydCwgYXJyYXkgPT4ge1xyXG4gICAgYXJyYXkucHVzaCggJ2FuZ2VsJywgJ2Nsb3duJywgJ2RydW0nLCAnc3R1cmdlb24nICk7XHJcbiAgICBhcnJheS51bnNoaWZ0KCAndHJ1bXBldCcsICdkaW5vJyApO1xyXG5cclxuICAgIGFzc2VydC5vayggYXJyYXlbIDAgXSA9PT0gJ3RydW1wZXQnICk7XHJcbiAgfSwgW1xyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogJ2FuZ2VsJyB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogJ2Nsb3duJyB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogJ2RydW0nIH0sXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiAnc3R1cmdlb24nIH0sXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiAndHJ1bXBldCcgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6ICdkaW5vJyB9XHJcbiAgXSApO1xyXG59ICk7XHJcblxyXG4vLyBGcm9tIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2NvcHlXaXRoaW5cclxuUVVuaXQudGVzdCggJ1Rlc3QgY3JlYXRlT2JzZXJ2YWJsZUFycmF5LmNvcHlXaXRoaW4nLCBhc3NlcnQgPT4ge1xyXG4gIHRlc3RBcnJheUVtaXR0ZXJzKCBhc3NlcnQsIGFycmF5ID0+IHtcclxuICAgIGFycmF5LnB1c2goIDEsIDIsIDMsIDQsIDUgKTtcclxuICAgIGFycmF5LmNvcHlXaXRoaW4oIC0yLCAwICk7IC8vIFsxLCAyLCAzLCAxLCAyXVxyXG4gIH0sIFtcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6IDEgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6IDIgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6IDMgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6IDQgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6IDUgfSxcclxuICAgIHsgdHlwZTogJ3JlbW92ZWQnLCB2YWx1ZTogNCB9LFxyXG4gICAgeyB0eXBlOiAncmVtb3ZlZCcsIHZhbHVlOiA1IH0sXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiAxIH0sXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiAyIH1cclxuICBdICk7XHJcblxyXG4gIHRlc3RBcnJheUVtaXR0ZXJzKCBhc3NlcnQsIGFycmF5ID0+IHtcclxuICAgIGFycmF5LnB1c2goIDEsIDIsIDMsIDQsIDUgKTtcclxuICAgIGFycmF5LmNvcHlXaXRoaW4oIDAsIDMgKTsgLy8gIFs0LCA1LCAzLCA0LCA1XVxyXG4gIH0sIFtcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6IDEgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6IDIgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6IDMgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6IDQgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6IDUgfSxcclxuICAgIHsgdHlwZTogJ3JlbW92ZWQnLCB2YWx1ZTogMSB9LFxyXG4gICAgeyB0eXBlOiAncmVtb3ZlZCcsIHZhbHVlOiAyIH0sXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiA0IH0sXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiA1IH1cclxuICBdICk7XHJcblxyXG4gIHRlc3RBcnJheUVtaXR0ZXJzKCBhc3NlcnQsIGFycmF5ID0+IHtcclxuICAgIGFycmF5LnB1c2goIDEsIDIsIDMsIDQsIDUgKTtcclxuICAgIGFycmF5LmNvcHlXaXRoaW4oIDAsIDMsIDQgKTsgLy8gIFs0LCAyLCAzLCA0LCA1XVxyXG4gIH0sIFtcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6IDEgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6IDIgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6IDMgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6IDQgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6IDUgfSxcclxuICAgIHsgdHlwZTogJ3JlbW92ZWQnLCB2YWx1ZTogMSB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogNCB9XHJcbiAgXSApO1xyXG5cclxuICB0ZXN0QXJyYXlFbWl0dGVycyggYXNzZXJ0LCBhcnJheSA9PiB7XHJcbiAgICBhcnJheS5wdXNoKCAxLCAyLCAzLCA0LCA1ICk7XHJcbiAgICBhcnJheS5jb3B5V2l0aGluKCAtMiwgLTMsIC0xICk7IC8vICAgWzEsIDIsIDMsIDMsIDRdXHJcbiAgfSwgW1xyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogMSB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogMiB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogMyB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogNCB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogNSB9LFxyXG4gICAgeyB0eXBlOiAncmVtb3ZlZCcsIHZhbHVlOiA1IH0sXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiAzIH1cclxuICBdICk7XHJcbn0gKTtcclxuXHJcbi8vIEV4YW1wbGVzIGZyb20gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvZmlsbFxyXG5RVW5pdC50ZXN0KCAnVGVzdCBjcmVhdGVPYnNlcnZhYmxlQXJyYXkuZmlsbCcsIGFzc2VydCA9PiB7XHJcbiAgdGVzdEFycmF5RW1pdHRlcnMoIGFzc2VydCwgYXJyYXkgPT4ge1xyXG4gICAgYXJyYXkucHVzaCggMSwgMiwgMyApO1xyXG4gICAgYXJyYXkuZmlsbCggNCApOyAvLyBbNCw0LDRdXHJcbiAgfSwgW1xyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogMSB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogMiB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogMyB9LFxyXG4gICAgeyB0eXBlOiAncmVtb3ZlZCcsIHZhbHVlOiAxIH0sXHJcbiAgICB7IHR5cGU6ICdyZW1vdmVkJywgdmFsdWU6IDIgfSxcclxuICAgIHsgdHlwZTogJ3JlbW92ZWQnLCB2YWx1ZTogMyB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogNCB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogNCB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogNCB9XHJcbiAgXSApO1xyXG5cclxuICB0ZXN0QXJyYXlFbWl0dGVycyggYXNzZXJ0LCBhcnJheSA9PiB7XHJcbiAgICBhcnJheS5wdXNoKCAxLCAyLCAzICk7XHJcbiAgICBhcnJheS5maWxsKCA0LCAxICk7IC8vIFsxLDQsNF1cclxuICB9LCBbXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiAxIH0sXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiAyIH0sXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiAzIH0sXHJcbiAgICB7IHR5cGU6ICdyZW1vdmVkJywgdmFsdWU6IDIgfSxcclxuICAgIHsgdHlwZTogJ3JlbW92ZWQnLCB2YWx1ZTogMyB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogNCB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogNCB9XHJcbiAgXSApO1xyXG5cclxuICB0ZXN0QXJyYXlFbWl0dGVycyggYXNzZXJ0LCBhcnJheSA9PiB7XHJcbiAgICBhcnJheS5wdXNoKCAxLCAyLCAzICk7XHJcbiAgICBhcnJheS5maWxsKCA0LCAxLCAyICk7IC8vIFsxLDQsM11cclxuICB9LCBbXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiAxIH0sXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiAyIH0sXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiAzIH0sXHJcbiAgICB7IHR5cGU6ICdyZW1vdmVkJywgdmFsdWU6IDIgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6IDQgfVxyXG4gIF0gKTtcclxuXHJcbiAgdGVzdEFycmF5RW1pdHRlcnMoIGFzc2VydCwgYXJyYXkgPT4ge1xyXG4gICAgYXJyYXkucHVzaCggMSwgMiwgMyApO1xyXG4gICAgYXJyYXkuZmlsbCggNCwgMSwgMSApOyAvLyBbMSwyLDNdXHJcbiAgfSwgW1xyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogMSB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogMiB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogMyB9XHJcbiAgXSApO1xyXG5cclxuICB0ZXN0QXJyYXlFbWl0dGVycyggYXNzZXJ0LCBhcnJheSA9PiB7XHJcbiAgICBhcnJheS5wdXNoKCAxLCAyLCAzICk7XHJcbiAgICBhcnJheS5maWxsKCA0LCAzLCAzICk7IC8vIFsxLDIsM11cclxuICB9LCBbXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiAxIH0sXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiAyIH0sXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiAzIH1cclxuICBdICk7XHJcblxyXG4gIHRlc3RBcnJheUVtaXR0ZXJzKCBhc3NlcnQsIGFycmF5ID0+IHtcclxuICAgIGFycmF5LnB1c2goIDEsIDIsIDMgKTtcclxuICAgIGFycmF5LmZpbGwoIDQsIC0zLCAtMiApOyAvLyBbNCwyLDNdXHJcbiAgfSwgW1xyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogMSB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogMiB9LFxyXG4gICAgeyB0eXBlOiAnYWRkZWQnLCB2YWx1ZTogMyB9LFxyXG4gICAgeyB0eXBlOiAncmVtb3ZlZCcsIHZhbHVlOiAxIH0sXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiA0IH1cclxuICBdICk7XHJcblxyXG4gIHRlc3RBcnJheUVtaXR0ZXJzKCBhc3NlcnQsIGFycmF5ID0+IHtcclxuICAgIGFycmF5LnB1c2goIDEsIDIsIDMgKTtcclxuICAgIGFycmF5LmZpbGwoIDQsIE5hTiwgTmFOICk7IC8vIFsxLDIsM11cclxuICB9LCBbXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiAxIH0sXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiAyIH0sXHJcbiAgICB7IHR5cGU6ICdhZGRlZCcsIHZhbHVlOiAzIH1cclxuICBdICk7XHJcblxyXG4gIHRlc3RBcnJheUVtaXR0ZXJzKCBhc3NlcnQsIGFycmF5ID0+IHtcclxuICAgIGFycmF5LnB1c2goIDEsIDIsIDMgKTtcclxuICAgIGFycmF5LmZpbGwoIDQsIDMsIDUgKTsgLy8gWzEsMiwzXVxyXG4gIH0sIFtcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6IDEgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6IDIgfSxcclxuICAgIHsgdHlwZTogJ2FkZGVkJywgdmFsdWU6IDMgfVxyXG4gIF0gKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1Rlc3QgdGhhdCBsZW5ndGggaXMgY29ycmVjdCBpbiBlbWl0dGVyIGNhbGxiYWNrcyBhZnRlciBwdXNoJywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCBhID0gY3JlYXRlT2JzZXJ2YWJsZUFycmF5KCk7XHJcbiAgYS5lbGVtZW50QWRkZWRFbWl0dGVyLmFkZExpc3RlbmVyKCBlbGVtZW50ID0+IHtcclxuICAgIGFzc2VydC5lcXVhbCggYS5sZW5ndGgsIDEgKTtcclxuICAgIGFzc2VydC5lcXVhbCggYS5sZW5ndGhQcm9wZXJ0eS52YWx1ZSwgMSApO1xyXG4gICAgYXNzZXJ0LmVxdWFsKCBlbGVtZW50LCAnaGVsbG8nICk7XHJcbiAgfSApO1xyXG4gIGEucHVzaCggJ2hlbGxvJyApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnVGVzdCByZXR1cm4gdHlwZXMnLCBhc3NlcnQgPT4ge1xyXG5cclxuICBhc3NlcnQub2soIHRydWUgKTtcclxuICBjb25zdCBhID0gY3JlYXRlT2JzZXJ2YWJsZUFycmF5KCk7XHJcbiAgYS5wdXNoKCAnaGVsbG8nICk7XHJcblxyXG4gIGNvbnN0IHggPSBhLnNsaWNlKCk7XHJcbiAgeC51bnNoaWZ0KCA3ICk7XHJcbiAgYXNzZXJ0Lm9rKCB0cnVlLCAnbWFrZSBzdXJlIGl0IGlzIHNhZmUgdG8gdW5zaGlmdCBvbiBhIHNsaWNlZCBjcmVhdGVPYnNlcnZhYmxlQXJyYXknICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdUZXN0IGNvbnN0cnVjdG9yIGFyZ3VtZW50cycsIGFzc2VydCA9PiB7XHJcblxyXG4gIGNvbnN0IGExID0gY3JlYXRlT2JzZXJ2YWJsZUFycmF5KCB7XHJcbiAgICBsZW5ndGg6IDdcclxuICB9ICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBhMS5sZW5ndGhQcm9wZXJ0eS52YWx1ZSwgNywgJ2FycmF5IGxlbmd0aCB0ZXN0JyApO1xyXG4gIGExLnB1c2goICdoZWxsbycgKTtcclxuICBhc3NlcnQuZXF1YWwoIGExLmxlbmd0aFByb3BlcnR5LnZhbHVlLCA4LCAnYXJyYXkgbGVuZ3RoIHRlc3QnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBhMVsgNyBdLCAnaGVsbG8nLCAnZm9yIHB1c2gsIGVsZW1lbnQgc2hvdWxkIGJlIGFkZGVkIGF0IHRoZSBlbmQgb2YgdGhlIGFycmF5JyApO1xyXG5cclxuICBjb25zdCBhMiA9IGNyZWF0ZU9ic2VydmFibGVBcnJheSgge1xyXG4gICAgZWxlbWVudHM6IFsgJ2hpJywgJ3RoZXJlJyBdXHJcbiAgfSApO1xyXG4gIGFzc2VydC5lcXVhbCggYTIubGVuZ3RoLCAyLCAnYXJyYXkgbGVuZ3RoIHRlc3QnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBhMlsgMCBdLCAnaGknLCAnZmlyc3QgZWxlbWVudCBjb3JyZWN0JyApO1xyXG4gIGFzc2VydC5lcXVhbCggYTJbIDEgXSwgJ3RoZXJlJywgJ3NlY29uZCBlbGVtZW50IGNvcnJlY3QnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBhMi5sZW5ndGgsIDIsICdsZW5ndGggY29ycmVjdCcgKTtcclxuXHJcbiAgbGV0IGEzID0gbnVsbDtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuICAgIGEzID0gY3JlYXRlT2JzZXJ2YWJsZUFycmF5KCB7IGVsZW1lbnRzOiBbIDMgXSwgbGVuZ3RoOiAxIH0gKTtcclxuICB9LCAnbGVuZ3RoIGFuZCBlbGVtZW50cyBhcmUgbXV0dWFsbHkgZXhjbHVzaXZlJyApO1xyXG4gIGFzc2VydC5lcXVhbCggYTMsIG51bGwsICdzaG91bGQgbm90IGhhdmUgYmVlbiBhc3NpZ25lZCcgKTtcclxuXHJcbiAgLy8gdmFsaWQgZWxlbWVudCB0eXBlcyBzaG91bGQgc3VjY2VlZFxyXG4gIGNvbnN0IGE0ID0gY3JlYXRlT2JzZXJ2YWJsZUFycmF5KCB7XHJcbiAgICBlbGVtZW50czogWyAnYScsICdiJyBdLFxyXG5cclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IsIGZvcmNlIHNldCB2YWx1ZSB0eXBlIGZvciB0ZXN0aW5nXHJcbiAgICB2YWx1ZVR5cGU6ICdzdHJpbmcnXHJcbiAgfSApO1xyXG4gIGFzc2VydC5vayggISFhNCwgJ2NvcnJlY3QgZWxlbWVudCB0eXBlcyBzaG91bGQgc3VjY2VlZCcgKTtcclxuXHJcbiAgLy8gaW52YWxpZCBlbGVtZW50IHR5cGVzIHNob3VsZCBmYWlsXHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiBjcmVhdGVPYnNlcnZhYmxlQXJyYXkoIHtcclxuICAgIGVsZW1lbnRzOiBbICdhJywgJ2InIF0sXHJcblxyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciwgZm9yY2Ugc2V0IHZhbHVlIHR5cGUgZm9yIHRlc3RpbmdcclxuICAgIHZhbHVlVHlwZTogJ251bWJlcidcclxuICB9ICksICdzaG91bGQgZmFpbCBmb3IgaW52YWxpZCBlbGVtZW50IHR5cGVzJyApO1xyXG5cclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1Rlc3QgZnVuY3Rpb24gdmFsdWVzJywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCBhcnJheTogQXJyYXk8KCkgPT4gdm9pZD4gPSBjcmVhdGVPYnNlcnZhYmxlQXJyYXkoKTtcclxuICBsZXQgbnVtYmVyID0gNztcclxuICBhcnJheS5wdXNoKCAoKSA9PiB7XHJcbiAgICBudW1iZXIrKztcclxuICB9ICk7XHJcbiAgYXJyYXlbIDAgXSgpO1xyXG4gIGFzc2VydC5lcXVhbCggOCwgbnVtYmVyLCAnYXJyYXkgc2hvdWxkIHN1cHBvcnQgZnVuY3Rpb24gdmFsdWVzJyApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnY3JlYXRlT2JzZXJ2YWJsZUFycmF5VGVzdHMgbWlzYycsIGFzc2VydCA9PiB7XHJcbiAgY29uc3QgYXJyYXkgPSBjcmVhdGVPYnNlcnZhYmxlQXJyYXkoKTtcclxuICBhc3NlcnQub2soIEFycmF5LmlzQXJyYXkoIGFycmF5ICksICdzaG91bGQgYmUgYW4gYXJyYXknICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdjcmVhdGVPYnNlcnZhYmxlQXJyYXlUZXN0cyBub3RpZmljYXRpb24gZGVmZXJyaW5nJywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCBhcnJheSA9IGNyZWF0ZU9ic2VydmFibGVBcnJheTxudW1iZXI+KCk7XHJcblxyXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICBhcnJheS5zZXROb3RpZmljYXRpb25zRGVmZXJyZWQoIHRydWUgKTtcclxuICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgYXNzZXJ0Lm9rKCBhcnJheS5ub3RpZmljYXRpb25zRGVmZXJyZWQsICdzaG91bGQgYmUnICk7XHJcbiAgbGV0IGZ1bGxDb3VudCA9IDA7XHJcbiAgYXJyYXkuYWRkSXRlbUFkZGVkTGlzdGVuZXIoIGNvdW50ID0+IHtcclxuICAgIGZ1bGxDb3VudCArPSBjb3VudDtcclxuICB9ICk7XHJcblxyXG4gIGFycmF5LnB1c2goIDUgKTtcclxuICBhc3NlcnQuZXF1YWwoIGZ1bGxDb3VudCwgMCApO1xyXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICBhcnJheS5zZXROb3RpZmljYXRpb25zRGVmZXJyZWQoIGZhbHNlICk7XHJcblxyXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICBhc3NlcnQub2soICFhcnJheS5ub3RpZmljYXRpb25zRGVmZXJyZWQsICdzaG91bGQgYmUnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBmdWxsQ291bnQsIDUgKTtcclxuXHJcbiAgYXJyYXkucHVzaCggNSApO1xyXG4gIGFzc2VydC5lcXVhbCggZnVsbENvdW50LCAxMCApO1xyXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICBhcnJheS5zZXROb3RpZmljYXRpb25zRGVmZXJyZWQoIHRydWUgKTtcclxuICBhcnJheS5wdXNoKCA1ICk7XHJcbiAgYXJyYXkucHVzaCggNCApO1xyXG4gIGFycmF5LnB1c2goIDYgKTtcclxuICBhc3NlcnQuZXF1YWwoIGZ1bGxDb3VudCwgMTAgKTtcclxuICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgYXJyYXkuc2V0Tm90aWZpY2F0aW9uc0RlZmVycmVkKCBmYWxzZSApO1xyXG4gIGFzc2VydC5lcXVhbCggZnVsbENvdW50LCAyNSApO1xyXG59ICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLE1BQU0sTUFBTSx3QkFBd0I7QUFDM0MsT0FBT0MsV0FBVyxNQUFNLG1DQUFtQztBQUMzRCxPQUFPQyxxQkFBcUIsTUFBMkIsNEJBQTRCO0FBR25GQyxLQUFLLENBQUNDLE1BQU0sQ0FBRSx1QkFBd0IsQ0FBQztBQU12Q0QsS0FBSyxDQUFDRSxJQUFJLENBQUUsT0FB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