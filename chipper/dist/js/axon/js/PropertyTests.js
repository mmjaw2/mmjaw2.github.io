// Copyright 2017-2024, University of Colorado Boulder

/**
 * QUnit tests for Property
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Tandem from '../../tandem/js/Tandem.js';
import Multilink from './Multilink.js';
import NumberProperty from './NumberProperty.js';
import Property from './Property.js';
import Vector2 from '../../dot/js/Vector2.js';
QUnit.module('Property');
QUnit.test('Test unlink', assert => {
  const property = new Property(1);
  const startingPListenerCount = property['getListenerCount']();
  const a = function (a) {
    _.noop;
  };
  const b = function (b) {
    _.noop;
  };
  const c = function (c) {
    _.noop;
  };
  property.link(a);
  property.link(b);
  property.link(c);
  assert.equal(property['getListenerCount'](), 3 + startingPListenerCount, 'should have 3 observers now');
  property.unlink(b);
  assert.ok(property.hasListener(a), 'should have removed b');
  assert.ok(property.hasListener(c), 'should have removed b');
  assert.equal(property['getListenerCount'](), 2 + startingPListenerCount, 'should have removed an item');
});
QUnit.test('Test Multilink.multilink', assert => {
  const aProperty = new Property(1);
  const bProperty = new Property(2);
  let callbacks = 0;
  Multilink.multilink([aProperty, bProperty], (a, b) => {
    callbacks++;
    assert.equal(a, 1, 'first value should pass through');
    assert.equal(b, 2, 'second value should pass through');
  });
  assert.equal(callbacks, 1, 'should have called back to a multilink');
});
QUnit.test('Test Multilink.lazyMultilink', assert => {
  const aProperty = new Property(1);
  const bProperty = new Property(2);
  let callbacks = 0;
  Multilink.lazyMultilink([aProperty, bProperty], (a, b) => {
    callbacks++;
    assert.equal(a, 1);
    assert.equal(b, 2);
  });
  assert.equal(callbacks, 0, 'should not call back to a lazy multilink');
});
QUnit.test('Test defer', assert => {
  const property = new Property(0);
  let callbacks = 0;
  property.lazyLink((newValue, oldValue) => {
    callbacks++;
    assert.equal(newValue, 2, 'newValue should be the final value after the transaction');
    assert.equal(oldValue, 0, 'oldValue should be the original value before the transaction');
  });
  property.setDeferred(true);
  property.value = 1;
  property.value = 2;
  assert.equal(property.value, 0, 'should have original value');
  const update = property.setDeferred(false);
  assert.equal(callbacks, 0, 'should not call back while deferred');
  assert.equal(property.value, 2, 'should have new value');

  // @ts-expect-error .setDeferred(false) will always return () => void
  update();
  assert.equal(callbacks, 1, 'should have been called back after update');
  assert.equal(property.value, 2, 'should take final value');
});
QUnit.test('Property ID checks', assert => {
  assert.ok(new Property(1)['id'] !== new Property(1)['id'], 'Properties should have unique IDs'); // eslint-disable-line no-self-compare
});
QUnit.test('Property link parameters', assert => {
  const property = new Property(1);
  const calls = [];
  property.link((newValue, oldValue, property) => {
    calls.push({
      newValue: newValue,
      oldValue: oldValue,
      property: property
    });
  });
  property.value = 2;
  assert.ok(calls.length === 2);
  assert.ok(calls[0].newValue === 1);
  assert.ok(calls[0].oldValue === null);
  assert.ok(calls[0].property === property);
  assert.ok(calls[1].newValue === 2);
  assert.ok(calls[1].oldValue === 1);
  assert.ok(calls[1].property === property);
});

/**
 * Make sure linking attributes and unlinking attributes works on Property
 */
QUnit.test('Property.linkAttribute', assert => {
  const property = new Property(7);
  const state = {
    age: 99
  };
  const listener = age => {
    state.age = age;
  };
  property.link(listener);
  assert.equal(state.age, 7, 'link should synchronize values');
  property.value = 8;
  assert.equal(state.age, 8, 'link should update values');
  property.unlink(listener);
  property.value = 9;
  assert.equal(state.age, 8, 'state should not have changed after unlink');
});
QUnit.test('Property value validation', assert => {
  // Type that is specific to valueType tests
  class TestType {
    constructor() {
      _.noop();
    }
  }
  let property = null;
  let options = {};

  // valueType is a primitive type (typeof validation)
  options = {
    valueType: 'string'
  };
  window.assert && assert.throws(() => {
    new Property(0, {
      valueType: 'foo'
    }); // eslint-disable-line no-new
  }, 'options.valueType is invalid, expected a primitive data type');
  window.assert && assert.throws(() => {
    new Property(0, options); // eslint-disable-line no-new
  }, 'invalid initial value with options.valueType typeof validation');
  property = new Property('horizontal', options);
  property.set('vertical');
  window.assert && assert.throws(() => {
    property.set(0);
  }, 'invalid set value with options.valueType typeof validation');

  // valueType is a constructor (instanceof validation)
  options = {
    valueType: TestType
  };
  window.assert && assert.throws(() => {
    new Property(0, options); // eslint-disable-line no-new
  }, 'invalid initial value for options.valueType instanceof validation');
  property = new Property(new TestType(), options);
  property.set(new TestType());
  window.assert && assert.throws(() => {
    property.set(0);
  }, 'invalid set value with options.valueType instanceof validation');

  // validValues
  options = {
    validValues: [1, 2, 3]
  };
  window.assert && assert.throws(() => {
    // @ts-expect-error INTENTIONAL value is invalid for testing
    new Property(0, {
      validValues: 0
    }); // eslint-disable-line no-new
  }, 'options.validValues is invalid');
  window.assert && assert.throws(() => {
    new Property(0, options); // eslint-disable-line no-new
  }, 'invalid initial value with options.validValues');
  property = new Property(1, options);
  property.set(3);
  window.assert && assert.throws(() => {
    property.set(4);
  }, 'invalid set value with options.validValues');

  // isValidValues
  options = {
    isValidValue: function (value) {
      return value > 0 && value < 4;
    }
  };
  window.assert && assert.throws(() => {
    // @ts-expect-error INTENTIONAL value is invalid for testing
    new Property(0, {
      isValidValue: 0
    }); // eslint-disable-line no-new
  }, 'options.isValidValue is invalid');
  window.assert && assert.throws(() => {
    new Property(0, options); // eslint-disable-line no-new
  }, 'invalid initial value with options.isValidValue');
  property = new Property(1, options);
  property.set(3);
  window.assert && assert.throws(() => {
    property.set(4);
  }, 'invalid set value with options.isValidValue');

  // Compatible combinations of validation options, possibly redundant (not exhaustive)
  options = {
    valueType: 'string',
    validValues: ['bob', 'joe', 'sam'],
    isValidValue: function (value) {
      return value.length === 3;
    }
  };
  property = new Property('bob', options);
  window.assert && assert.throws(() => {
    property.set(0);
  }, 'invalid set value with compatible combination of validation options');
  window.assert && assert.throws(() => {
    property.set('ted');
  }, 'invalid set value with compatible combination of validation options');

  // Incompatible combinations of validation options (not exhaustive)
  // These tests will always fail on initialization, since the validation criteria are contradictory.
  options = {
    valueType: 'number',
    validValues: ['bob', 'joe', 'sam'],
    isValidValue: function (value) {
      return value.length === 4;
    }
  };
  window.assert && assert.throws(() => {
    property = new Property(0, options);
  }, 'invalid initial value with incompatible combination of validation options');
  window.assert && assert.throws(() => {
    property = new Property('bob', options);
  }, 'invalid initial value with incompatible combination of validation options');
  window.assert && assert.throws(() => {
    property = new Property('fred', options);
  }, 'invalid initial value with incompatible combination of validation options');
  assert.ok(true, 'so we have at least 1 test in this set');
});
QUnit.test('reentrantNotificationStrategy', assert => {
  assert.ok(new Property('hi')['tinyProperty']['reentrantNotificationStrategy'] === 'queue', 'default notification strategy for Property should be "queue"');

  ////////////////////////////////////////////
  // queue
  let queueCount = 2; // starts as a value of 1, so 2 is the first value we change to.

  // queue is default
  const queueProperty = new Property(1, {
    reentrantNotificationStrategy: 'queue',
    reentrant: true
  });
  queueProperty.lazyLink(value => {
    if (value < 10) {
      queueProperty.value = value + 1;
    }
  });

  // notify-queue:
  // 1->2
  // 2->3
  // 3->4
  // ...
  // 8->9

  queueProperty.lazyLink((value, oldValue) => {
    assert.ok(value === oldValue + 1, `increment each time: ${oldValue} -> ${value}`);
    assert.ok(value === queueCount++, `increment by most recent changed: ${queueCount - 2}->${queueCount - 1}, received: ${oldValue} -> ${value}`);
  });
  queueProperty.value = queueCount;
  let stackCount = 2; // starts as a value of 1, so 2 is the first value we change to.
  const finalCount = 10;
  let lastListenerCount = 10;
  ////////////////////////////////////////////

  ////////////////////////////////////////////
  // stack
  const stackProperty = new Property(stackCount - 1, {
    reentrantNotificationStrategy: 'stack',
    reentrant: true
  });
  stackProperty.lazyLink(value => {
    if (value < finalCount) {
      stackProperty.value = value + 1;
    }
  });

  // stack-notify:
  // 8->9
  // 7->8
  // 6->7
  // ...
  // 1->2
  stackProperty.lazyLink((value, oldValue) => {
    stackCount++;
    assert.ok(value === oldValue + 1, `increment each time: ${oldValue} -> ${value}`);
    assert.ok(value === lastListenerCount--, `increment in order expected: ${lastListenerCount}->${lastListenerCount + 1}, received: ${oldValue} -> ${value}`);
    assert.ok(oldValue === lastListenerCount, `new count is ${lastListenerCount}: the oldValue (most recent first in stack first`);
  });
  stackProperty.value = stackCount;
  //////////////////////////////////////////////////
});
QUnit.test('options.valueComparisonStrategy', assert => {
  let calledCount = 0;
  let myProperty = new Property(new Vector2(0, 0), {
    valueComparisonStrategy: 'equalsFunction'
  });
  myProperty.lazyLink(() => calledCount++);
  myProperty.value = new Vector2(0, 0);
  assert.ok(calledCount === 0, 'equal');
  myProperty.value = new Vector2(0, 3);
  assert.ok(calledCount === 1, 'not equal');
  calledCount = 0;
  myProperty = new Property(new Vector2(0, 0), {
    valueComparisonStrategy: 'lodashDeep'
  });
  myProperty.lazyLink(() => calledCount++);
  myProperty.value = {
    something: 'hi'
  };
  assert.ok(calledCount === 1, 'not equal');
  myProperty.value = {
    something: 'hi'
  };
  assert.ok(calledCount === 1, 'equal');
  myProperty.value = {
    something: 'hi',
    other: false
  };
  assert.ok(calledCount === 2, 'not equal with other key');
});

// Tests that can only run in phet-io mode
if (Tandem.PHET_IO_ENABLED) {
  QUnit.test('Test PropertyIO toStateObject/fromStateObject', assert => {
    const done = assert.async();
    const tandem = Tandem.ROOT_TEST.createTandem('testTandemProperty');
    const phetioType = NumberProperty.NumberPropertyIO;
    const propertyValue = 123;
    const validValues = [0, 1, 2, 3, propertyValue];

    // @ts-expect-error redefining function for testing
    tandem.addPhetioObject = function (instance, options) {
      // PhET-iO operates under the assumption that nothing will access a PhetioObject until the next animation frame
      // when the object is fully constructed.  For example, Property state variables are set after the callback
      // to addPhetioObject, which occurs during Property.constructor.super().
      setTimeout(() => {
        // eslint-disable-line bad-sim-text

        // Run in the next frame after the object finished getting constructed
        const stateObject = phetioType.toStateObject(instance);
        assert.equal(stateObject.value, propertyValue, 'toStateObject should match');
        assert.deepEqual(stateObject.validValues, validValues, 'toStateObject should match');
        done();
      }, 0);
    };
    new NumberProperty(propertyValue, {
      // eslint-disable-line no-new
      tandem: tandem,
      validValues: validValues
    });
  });
}
///////////////////////////////
// END PHET_IO ONLY TESTS
///////////////////////////////
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUYW5kZW0iLCJNdWx0aWxpbmsiLCJOdW1iZXJQcm9wZXJ0eSIsIlByb3BlcnR5IiwiVmVjdG9yMiIsIlFVbml0IiwibW9kdWxlIiwidGVzdCIsImFzc2VydCIsInByb3BlcnR5Iiwic3RhcnRpbmdQTGlzdGVuZXJDb3VudCIsImEiLCJfIiwibm9vcCIsImIiLCJjIiwibGluayIsImVxdWFsIiwidW5saW5rIiwib2siLCJoYXNMaXN0ZW5lciIsImFQcm9wZXJ0eSIsImJQcm9wZXJ0eSIsImNhbGxiYWNrcyIsIm11bHRpbGluayIsImxhenlNdWx0aWxpbmsiLCJsYXp5TGluayIsIm5ld1ZhbHVlIiwib2xkVmFsdWUiLCJzZXREZWZlcnJlZCIsInZhbHVlIiwidXBkYXRlIiwiY2FsbHMiLCJwdXNoIiwibGVuZ3RoIiwic3RhdGUiLCJhZ2UiLCJsaXN0ZW5lciIsIlRlc3RUeXBlIiwiY29uc3RydWN0b3IiLCJvcHRpb25zIiwidmFsdWVUeXBlIiwid2luZG93IiwidGhyb3dzIiwic2V0IiwidmFsaWRWYWx1ZXMiLCJpc1ZhbGlkVmFsdWUiLCJxdWV1ZUNvdW50IiwicXVldWVQcm9wZXJ0eSIsInJlZW50cmFudE5vdGlmaWNhdGlvblN0cmF0ZWd5IiwicmVlbnRyYW50Iiwic3RhY2tDb3VudCIsImZpbmFsQ291bnQiLCJsYXN0TGlzdGVuZXJDb3VudCIsInN0YWNrUHJvcGVydHkiLCJjYWxsZWRDb3VudCIsIm15UHJvcGVydHkiLCJ2YWx1ZUNvbXBhcmlzb25TdHJhdGVneSIsInNvbWV0aGluZyIsIm90aGVyIiwiUEhFVF9JT19FTkFCTEVEIiwiZG9uZSIsImFzeW5jIiwidGFuZGVtIiwiUk9PVF9URVNUIiwiY3JlYXRlVGFuZGVtIiwicGhldGlvVHlwZSIsIk51bWJlclByb3BlcnR5SU8iLCJwcm9wZXJ0eVZhbHVlIiwiYWRkUGhldGlvT2JqZWN0IiwiaW5zdGFuY2UiLCJzZXRUaW1lb3V0Iiwic3RhdGVPYmplY3QiLCJ0b1N0YXRlT2JqZWN0IiwiZGVlcEVxdWFsIl0sInNvdXJjZXMiOlsiUHJvcGVydHlUZXN0cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBRVW5pdCB0ZXN0cyBmb3IgUHJvcGVydHlcclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgTXVsdGlsaW5rIGZyb20gJy4vTXVsdGlsaW5rLmpzJztcclxuaW1wb3J0IE51bWJlclByb3BlcnR5IGZyb20gJy4vTnVtYmVyUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi9Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUUmVhZE9ubHlQcm9wZXJ0eSBmcm9tICcuL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IEludGVudGlvbmFsQW55IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9JbnRlbnRpb25hbEFueS5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuXHJcblFVbml0Lm1vZHVsZSggJ1Byb3BlcnR5JyApO1xyXG5cclxuUVVuaXQudGVzdCggJ1Rlc3QgdW5saW5rJywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCBwcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSggMSApO1xyXG4gIGNvbnN0IHN0YXJ0aW5nUExpc3RlbmVyQ291bnQgPSBwcm9wZXJ0eVsgJ2dldExpc3RlbmVyQ291bnQnIF0oKTtcclxuICBjb25zdCBhID0gZnVuY3Rpb24oIGE6IHVua25vd24gKSB7IF8ubm9vcDsgfTtcclxuICBjb25zdCBiID0gZnVuY3Rpb24oIGI6IHVua25vd24gKSB7IF8ubm9vcDsgfTtcclxuICBjb25zdCBjID0gZnVuY3Rpb24oIGM6IHVua25vd24gKSB7IF8ubm9vcDsgfTtcclxuICBwcm9wZXJ0eS5saW5rKCBhICk7XHJcbiAgcHJvcGVydHkubGluayggYiApO1xyXG4gIHByb3BlcnR5LmxpbmsoIGMgKTtcclxuICBhc3NlcnQuZXF1YWwoIHByb3BlcnR5WyAnZ2V0TGlzdGVuZXJDb3VudCcgXSgpLCAzICsgc3RhcnRpbmdQTGlzdGVuZXJDb3VudCwgJ3Nob3VsZCBoYXZlIDMgb2JzZXJ2ZXJzIG5vdycgKTtcclxuICBwcm9wZXJ0eS51bmxpbmsoIGIgKTtcclxuICBhc3NlcnQub2soIHByb3BlcnR5Lmhhc0xpc3RlbmVyKCBhICksICdzaG91bGQgaGF2ZSByZW1vdmVkIGInICk7XHJcbiAgYXNzZXJ0Lm9rKCBwcm9wZXJ0eS5oYXNMaXN0ZW5lciggYyApLCAnc2hvdWxkIGhhdmUgcmVtb3ZlZCBiJyApO1xyXG4gIGFzc2VydC5lcXVhbCggcHJvcGVydHlbICdnZXRMaXN0ZW5lckNvdW50JyBdKCksIDIgKyBzdGFydGluZ1BMaXN0ZW5lckNvdW50LCAnc2hvdWxkIGhhdmUgcmVtb3ZlZCBhbiBpdGVtJyApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnVGVzdCBNdWx0aWxpbmsubXVsdGlsaW5rJywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCBhUHJvcGVydHkgPSBuZXcgUHJvcGVydHkoIDEgKTtcclxuICBjb25zdCBiUHJvcGVydHkgPSBuZXcgUHJvcGVydHkoIDIgKTtcclxuICBsZXQgY2FsbGJhY2tzID0gMDtcclxuICBNdWx0aWxpbmsubXVsdGlsaW5rKCBbIGFQcm9wZXJ0eSwgYlByb3BlcnR5IF0sICggYSwgYiApID0+IHtcclxuICAgIGNhbGxiYWNrcysrO1xyXG4gICAgYXNzZXJ0LmVxdWFsKCBhLCAxLCAnZmlyc3QgdmFsdWUgc2hvdWxkIHBhc3MgdGhyb3VnaCcgKTtcclxuICAgIGFzc2VydC5lcXVhbCggYiwgMiwgJ3NlY29uZCB2YWx1ZSBzaG91bGQgcGFzcyB0aHJvdWdoJyApO1xyXG4gIH0gKTtcclxuICBhc3NlcnQuZXF1YWwoIGNhbGxiYWNrcywgMSwgJ3Nob3VsZCBoYXZlIGNhbGxlZCBiYWNrIHRvIGEgbXVsdGlsaW5rJyApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnVGVzdCBNdWx0aWxpbmsubGF6eU11bHRpbGluaycsIGFzc2VydCA9PiB7XHJcbiAgY29uc3QgYVByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCAxICk7XHJcbiAgY29uc3QgYlByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCAyICk7XHJcbiAgbGV0IGNhbGxiYWNrcyA9IDA7XHJcbiAgTXVsdGlsaW5rLmxhenlNdWx0aWxpbmsoIFsgYVByb3BlcnR5LCBiUHJvcGVydHkgXSwgKCBhLCBiICkgPT4ge1xyXG4gICAgY2FsbGJhY2tzKys7XHJcbiAgICBhc3NlcnQuZXF1YWwoIGEsIDEgKTtcclxuICAgIGFzc2VydC5lcXVhbCggYiwgMiApO1xyXG4gIH0gKTtcclxuICBhc3NlcnQuZXF1YWwoIGNhbGxiYWNrcywgMCwgJ3Nob3VsZCBub3QgY2FsbCBiYWNrIHRvIGEgbGF6eSBtdWx0aWxpbmsnICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdUZXN0IGRlZmVyJywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCBwcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSggMCApO1xyXG4gIGxldCBjYWxsYmFja3MgPSAwO1xyXG4gIHByb3BlcnR5LmxhenlMaW5rKCAoIG5ld1ZhbHVlLCBvbGRWYWx1ZSApID0+IHtcclxuICAgIGNhbGxiYWNrcysrO1xyXG4gICAgYXNzZXJ0LmVxdWFsKCBuZXdWYWx1ZSwgMiwgJ25ld1ZhbHVlIHNob3VsZCBiZSB0aGUgZmluYWwgdmFsdWUgYWZ0ZXIgdGhlIHRyYW5zYWN0aW9uJyApO1xyXG4gICAgYXNzZXJ0LmVxdWFsKCBvbGRWYWx1ZSwgMCwgJ29sZFZhbHVlIHNob3VsZCBiZSB0aGUgb3JpZ2luYWwgdmFsdWUgYmVmb3JlIHRoZSB0cmFuc2FjdGlvbicgKTtcclxuICB9ICk7XHJcbiAgcHJvcGVydHkuc2V0RGVmZXJyZWQoIHRydWUgKTtcclxuICBwcm9wZXJ0eS52YWx1ZSA9IDE7XHJcbiAgcHJvcGVydHkudmFsdWUgPSAyO1xyXG4gIGFzc2VydC5lcXVhbCggcHJvcGVydHkudmFsdWUsIDAsICdzaG91bGQgaGF2ZSBvcmlnaW5hbCB2YWx1ZScgKTtcclxuICBjb25zdCB1cGRhdGUgPSBwcm9wZXJ0eS5zZXREZWZlcnJlZCggZmFsc2UgKTtcclxuICBhc3NlcnQuZXF1YWwoIGNhbGxiYWNrcywgMCwgJ3Nob3VsZCBub3QgY2FsbCBiYWNrIHdoaWxlIGRlZmVycmVkJyApO1xyXG4gIGFzc2VydC5lcXVhbCggcHJvcGVydHkudmFsdWUsIDIsICdzaG91bGQgaGF2ZSBuZXcgdmFsdWUnICk7XHJcblxyXG4gIC8vIEB0cy1leHBlY3QtZXJyb3IgLnNldERlZmVycmVkKGZhbHNlKSB3aWxsIGFsd2F5cyByZXR1cm4gKCkgPT4gdm9pZFxyXG4gIHVwZGF0ZSgpO1xyXG4gIGFzc2VydC5lcXVhbCggY2FsbGJhY2tzLCAxLCAnc2hvdWxkIGhhdmUgYmVlbiBjYWxsZWQgYmFjayBhZnRlciB1cGRhdGUnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBwcm9wZXJ0eS52YWx1ZSwgMiwgJ3Nob3VsZCB0YWtlIGZpbmFsIHZhbHVlJyApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnUHJvcGVydHkgSUQgY2hlY2tzJywgYXNzZXJ0ID0+IHtcclxuICBhc3NlcnQub2soIG5ldyBQcm9wZXJ0eSggMSApWyAnaWQnIF0gIT09IG5ldyBQcm9wZXJ0eSggMSApWyAnaWQnIF0sICdQcm9wZXJ0aWVzIHNob3VsZCBoYXZlIHVuaXF1ZSBJRHMnICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlXHJcbn0gKTtcclxuXHJcbnR5cGUgY2FsbFZhbHVlcyA9IHtcclxuICBuZXdWYWx1ZTogbnVtYmVyO1xyXG4gIG9sZFZhbHVlOiBudW1iZXIgfCBudWxsO1xyXG4gIHByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxudW1iZXI+O1xyXG59O1xyXG5cclxuUVVuaXQudGVzdCggJ1Byb3BlcnR5IGxpbmsgcGFyYW1ldGVycycsIGFzc2VydCA9PiB7XHJcbiAgY29uc3QgcHJvcGVydHkgPSBuZXcgUHJvcGVydHkoIDEgKTtcclxuICBjb25zdCBjYWxsczogQXJyYXk8Y2FsbFZhbHVlcz4gPSBbXTtcclxuICBwcm9wZXJ0eS5saW5rKCAoIG5ld1ZhbHVlLCBvbGRWYWx1ZSwgcHJvcGVydHkgKSA9PiB7XHJcbiAgICBjYWxscy5wdXNoKCB7XHJcbiAgICAgIG5ld1ZhbHVlOiBuZXdWYWx1ZSxcclxuICAgICAgb2xkVmFsdWU6IG9sZFZhbHVlLFxyXG4gICAgICBwcm9wZXJ0eTogcHJvcGVydHlcclxuICAgIH0gKTtcclxuICB9ICk7XHJcbiAgcHJvcGVydHkudmFsdWUgPSAyO1xyXG5cclxuICBhc3NlcnQub2soIGNhbGxzLmxlbmd0aCA9PT0gMiApO1xyXG5cclxuICBhc3NlcnQub2soIGNhbGxzWyAwIF0ubmV3VmFsdWUgPT09IDEgKTtcclxuICBhc3NlcnQub2soIGNhbGxzWyAwIF0ub2xkVmFsdWUgPT09IG51bGwgKTtcclxuICBhc3NlcnQub2soIGNhbGxzWyAwIF0ucHJvcGVydHkgPT09IHByb3BlcnR5ICk7XHJcblxyXG4gIGFzc2VydC5vayggY2FsbHNbIDEgXS5uZXdWYWx1ZSA9PT0gMiApO1xyXG4gIGFzc2VydC5vayggY2FsbHNbIDEgXS5vbGRWYWx1ZSA9PT0gMSApO1xyXG4gIGFzc2VydC5vayggY2FsbHNbIDEgXS5wcm9wZXJ0eSA9PT0gcHJvcGVydHkgKTtcclxufSApO1xyXG5cclxuLyoqXHJcbiAqIE1ha2Ugc3VyZSBsaW5raW5nIGF0dHJpYnV0ZXMgYW5kIHVubGlua2luZyBhdHRyaWJ1dGVzIHdvcmtzIG9uIFByb3BlcnR5XHJcbiAqL1xyXG5RVW5pdC50ZXN0KCAnUHJvcGVydHkubGlua0F0dHJpYnV0ZScsIGFzc2VydCA9PiB7XHJcbiAgY29uc3QgcHJvcGVydHkgPSBuZXcgUHJvcGVydHkoIDcgKTtcclxuICBjb25zdCBzdGF0ZSA9IHsgYWdlOiA5OSB9O1xyXG4gIGNvbnN0IGxpc3RlbmVyID0gKCBhZ2U6IG51bWJlciApID0+IHtcclxuICAgIHN0YXRlLmFnZSA9IGFnZTtcclxuICB9O1xyXG4gIHByb3BlcnR5LmxpbmsoIGxpc3RlbmVyICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBzdGF0ZS5hZ2UsIDcsICdsaW5rIHNob3VsZCBzeW5jaHJvbml6ZSB2YWx1ZXMnICk7XHJcbiAgcHJvcGVydHkudmFsdWUgPSA4O1xyXG4gIGFzc2VydC5lcXVhbCggc3RhdGUuYWdlLCA4LCAnbGluayBzaG91bGQgdXBkYXRlIHZhbHVlcycgKTtcclxuICBwcm9wZXJ0eS51bmxpbmsoIGxpc3RlbmVyICk7XHJcbiAgcHJvcGVydHkudmFsdWUgPSA5O1xyXG4gIGFzc2VydC5lcXVhbCggc3RhdGUuYWdlLCA4LCAnc3RhdGUgc2hvdWxkIG5vdCBoYXZlIGNoYW5nZWQgYWZ0ZXIgdW5saW5rJyApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnUHJvcGVydHkgdmFsdWUgdmFsaWRhdGlvbicsIGFzc2VydCA9PiB7XHJcblxyXG4gIC8vIFR5cGUgdGhhdCBpcyBzcGVjaWZpYyB0byB2YWx1ZVR5cGUgdGVzdHNcclxuICBjbGFzcyBUZXN0VHlwZSB7XHJcbiAgICBwdWJsaWMgY29uc3RydWN0b3IoKSB7IF8ubm9vcCgpOyB9XHJcbiAgfVxyXG5cclxuICBsZXQgcHJvcGVydHk6IEludGVudGlvbmFsQW55ID0gbnVsbDtcclxuICBsZXQgb3B0aW9ucyA9IHt9O1xyXG5cclxuICAvLyB2YWx1ZVR5cGUgaXMgYSBwcmltaXRpdmUgdHlwZSAodHlwZW9mIHZhbGlkYXRpb24pXHJcbiAgb3B0aW9ucyA9IHtcclxuICAgIHZhbHVlVHlwZTogJ3N0cmluZydcclxuICB9O1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG4gICAgbmV3IFByb3BlcnR5KCAwLCB7IHZhbHVlVHlwZTogJ2ZvbycgfSApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW5ld1xyXG4gIH0sICdvcHRpb25zLnZhbHVlVHlwZSBpcyBpbnZhbGlkLCBleHBlY3RlZCBhIHByaW1pdGl2ZSBkYXRhIHR5cGUnICk7XHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICBuZXcgUHJvcGVydHkoIDAsIG9wdGlvbnMgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1uZXdcclxuICB9LCAnaW52YWxpZCBpbml0aWFsIHZhbHVlIHdpdGggb3B0aW9ucy52YWx1ZVR5cGUgdHlwZW9mIHZhbGlkYXRpb24nICk7XHJcbiAgcHJvcGVydHkgPSBuZXcgUHJvcGVydHkoICdob3Jpem9udGFsJywgb3B0aW9ucyApO1xyXG4gIHByb3BlcnR5LnNldCggJ3ZlcnRpY2FsJyApO1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG4gICAgcHJvcGVydHkuc2V0KCAwICk7XHJcbiAgfSwgJ2ludmFsaWQgc2V0IHZhbHVlIHdpdGggb3B0aW9ucy52YWx1ZVR5cGUgdHlwZW9mIHZhbGlkYXRpb24nICk7XHJcblxyXG4gIC8vIHZhbHVlVHlwZSBpcyBhIGNvbnN0cnVjdG9yIChpbnN0YW5jZW9mIHZhbGlkYXRpb24pXHJcbiAgb3B0aW9ucyA9IHtcclxuICAgIHZhbHVlVHlwZTogVGVzdFR5cGVcclxuICB9O1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG4gICAgbmV3IFByb3BlcnR5KCAwLCBvcHRpb25zICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbmV3XHJcbiAgfSwgJ2ludmFsaWQgaW5pdGlhbCB2YWx1ZSBmb3Igb3B0aW9ucy52YWx1ZVR5cGUgaW5zdGFuY2VvZiB2YWxpZGF0aW9uJyApO1xyXG4gIHByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCBuZXcgVGVzdFR5cGUoKSwgb3B0aW9ucyApO1xyXG4gIHByb3BlcnR5LnNldCggbmV3IFRlc3RUeXBlKCkgKTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuICAgIHByb3BlcnR5LnNldCggMCApO1xyXG4gIH0sICdpbnZhbGlkIHNldCB2YWx1ZSB3aXRoIG9wdGlvbnMudmFsdWVUeXBlIGluc3RhbmNlb2YgdmFsaWRhdGlvbicgKTtcclxuXHJcbiAgLy8gdmFsaWRWYWx1ZXNcclxuICBvcHRpb25zID0ge1xyXG4gICAgdmFsaWRWYWx1ZXM6IFsgMSwgMiwgMyBdXHJcbiAgfTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuXHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIElOVEVOVElPTkFMIHZhbHVlIGlzIGludmFsaWQgZm9yIHRlc3RpbmdcclxuICAgIG5ldyBQcm9wZXJ0eSggMCwgeyB2YWxpZFZhbHVlczogMCB9ICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbmV3XHJcbiAgfSwgJ29wdGlvbnMudmFsaWRWYWx1ZXMgaXMgaW52YWxpZCcgKTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuICAgIG5ldyBQcm9wZXJ0eSggMCwgb3B0aW9ucyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW5ld1xyXG4gIH0sICdpbnZhbGlkIGluaXRpYWwgdmFsdWUgd2l0aCBvcHRpb25zLnZhbGlkVmFsdWVzJyApO1xyXG4gIHByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCAxLCBvcHRpb25zICk7XHJcbiAgcHJvcGVydHkuc2V0KCAzICk7XHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICBwcm9wZXJ0eS5zZXQoIDQgKTtcclxuICB9LCAnaW52YWxpZCBzZXQgdmFsdWUgd2l0aCBvcHRpb25zLnZhbGlkVmFsdWVzJyApO1xyXG5cclxuICAvLyBpc1ZhbGlkVmFsdWVzXHJcbiAgb3B0aW9ucyA9IHtcclxuICAgIGlzVmFsaWRWYWx1ZTogZnVuY3Rpb24oIHZhbHVlOiBudW1iZXIgKSB7XHJcbiAgICAgIHJldHVybiAoIHZhbHVlID4gMCAmJiB2YWx1ZSA8IDQgKTtcclxuICAgIH1cclxuICB9O1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG5cclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgSU5URU5USU9OQUwgdmFsdWUgaXMgaW52YWxpZCBmb3IgdGVzdGluZ1xyXG4gICAgbmV3IFByb3BlcnR5KCAwLCB7IGlzVmFsaWRWYWx1ZTogMCB9ICk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbmV3XHJcbiAgfSwgJ29wdGlvbnMuaXNWYWxpZFZhbHVlIGlzIGludmFsaWQnICk7XHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICBuZXcgUHJvcGVydHkoIDAsIG9wdGlvbnMgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1uZXdcclxuICB9LCAnaW52YWxpZCBpbml0aWFsIHZhbHVlIHdpdGggb3B0aW9ucy5pc1ZhbGlkVmFsdWUnICk7XHJcbiAgcHJvcGVydHkgPSBuZXcgUHJvcGVydHkoIDEsIG9wdGlvbnMgKTtcclxuICBwcm9wZXJ0eS5zZXQoIDMgKTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuICAgIHByb3BlcnR5LnNldCggNCApO1xyXG4gIH0sICdpbnZhbGlkIHNldCB2YWx1ZSB3aXRoIG9wdGlvbnMuaXNWYWxpZFZhbHVlJyApO1xyXG5cclxuICAvLyBDb21wYXRpYmxlIGNvbWJpbmF0aW9ucyBvZiB2YWxpZGF0aW9uIG9wdGlvbnMsIHBvc3NpYmx5IHJlZHVuZGFudCAobm90IGV4aGF1c3RpdmUpXHJcbiAgb3B0aW9ucyA9IHtcclxuICAgIHZhbHVlVHlwZTogJ3N0cmluZycsXHJcbiAgICB2YWxpZFZhbHVlczogWyAnYm9iJywgJ2pvZScsICdzYW0nIF0sXHJcbiAgICBpc1ZhbGlkVmFsdWU6IGZ1bmN0aW9uKCB2YWx1ZTogc3RyaW5nICkge1xyXG4gICAgICByZXR1cm4gdmFsdWUubGVuZ3RoID09PSAzO1xyXG4gICAgfVxyXG4gIH07XHJcbiAgcHJvcGVydHkgPSBuZXcgUHJvcGVydHkoICdib2InLCBvcHRpb25zICk7XHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICBwcm9wZXJ0eS5zZXQoIDAgKTtcclxuICB9LCAnaW52YWxpZCBzZXQgdmFsdWUgd2l0aCBjb21wYXRpYmxlIGNvbWJpbmF0aW9uIG9mIHZhbGlkYXRpb24gb3B0aW9ucycgKTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuICAgIHByb3BlcnR5LnNldCggJ3RlZCcgKTtcclxuICB9LCAnaW52YWxpZCBzZXQgdmFsdWUgd2l0aCBjb21wYXRpYmxlIGNvbWJpbmF0aW9uIG9mIHZhbGlkYXRpb24gb3B0aW9ucycgKTtcclxuXHJcbiAgLy8gSW5jb21wYXRpYmxlIGNvbWJpbmF0aW9ucyBvZiB2YWxpZGF0aW9uIG9wdGlvbnMgKG5vdCBleGhhdXN0aXZlKVxyXG4gIC8vIFRoZXNlIHRlc3RzIHdpbGwgYWx3YXlzIGZhaWwgb24gaW5pdGlhbGl6YXRpb24sIHNpbmNlIHRoZSB2YWxpZGF0aW9uIGNyaXRlcmlhIGFyZSBjb250cmFkaWN0b3J5LlxyXG4gIG9wdGlvbnMgPSB7XHJcbiAgICB2YWx1ZVR5cGU6ICdudW1iZXInLFxyXG4gICAgdmFsaWRWYWx1ZXM6IFsgJ2JvYicsICdqb2UnLCAnc2FtJyBdLFxyXG4gICAgaXNWYWxpZFZhbHVlOiBmdW5jdGlvbiggdmFsdWU6IHN0cmluZyApIHtcclxuICAgICAgcmV0dXJuIHZhbHVlLmxlbmd0aCA9PT0gNDtcclxuICAgIH1cclxuICB9O1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG4gICAgcHJvcGVydHkgPSBuZXcgUHJvcGVydHkoIDAsIG9wdGlvbnMgKTtcclxuICB9LCAnaW52YWxpZCBpbml0aWFsIHZhbHVlIHdpdGggaW5jb21wYXRpYmxlIGNvbWJpbmF0aW9uIG9mIHZhbGlkYXRpb24gb3B0aW9ucycgKTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuICAgIHByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCAnYm9iJywgb3B0aW9ucyApO1xyXG4gIH0sICdpbnZhbGlkIGluaXRpYWwgdmFsdWUgd2l0aCBpbmNvbXBhdGlibGUgY29tYmluYXRpb24gb2YgdmFsaWRhdGlvbiBvcHRpb25zJyApO1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG4gICAgcHJvcGVydHkgPSBuZXcgUHJvcGVydHkoICdmcmVkJywgb3B0aW9ucyApO1xyXG4gIH0sICdpbnZhbGlkIGluaXRpYWwgdmFsdWUgd2l0aCBpbmNvbXBhdGlibGUgY29tYmluYXRpb24gb2YgdmFsaWRhdGlvbiBvcHRpb25zJyApO1xyXG5cclxuICBhc3NlcnQub2soIHRydWUsICdzbyB3ZSBoYXZlIGF0IGxlYXN0IDEgdGVzdCBpbiB0aGlzIHNldCcgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ3JlZW50cmFudE5vdGlmaWNhdGlvblN0cmF0ZWd5JywgYXNzZXJ0ID0+IHtcclxuICBhc3NlcnQub2soIG5ldyBQcm9wZXJ0eSggJ2hpJyApWyAndGlueVByb3BlcnR5JyBdWyAncmVlbnRyYW50Tm90aWZpY2F0aW9uU3RyYXRlZ3knIF0gPT09ICdxdWV1ZScsXHJcbiAgICAnZGVmYXVsdCBub3RpZmljYXRpb24gc3RyYXRlZ3kgZm9yIFByb3BlcnR5IHNob3VsZCBiZSBcInF1ZXVlXCInICk7XHJcblxyXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbiAgLy8gcXVldWVcclxuICBsZXQgcXVldWVDb3VudCA9IDI7IC8vIHN0YXJ0cyBhcyBhIHZhbHVlIG9mIDEsIHNvIDIgaXMgdGhlIGZpcnN0IHZhbHVlIHdlIGNoYW5nZSB0by5cclxuXHJcbiAgLy8gcXVldWUgaXMgZGVmYXVsdFxyXG4gIGNvbnN0IHF1ZXVlUHJvcGVydHkgPSBuZXcgUHJvcGVydHk8bnVtYmVyPiggMSwge1xyXG4gICAgcmVlbnRyYW50Tm90aWZpY2F0aW9uU3RyYXRlZ3k6ICdxdWV1ZScsXHJcbiAgICByZWVudHJhbnQ6IHRydWVcclxuICB9ICk7XHJcblxyXG4gIHF1ZXVlUHJvcGVydHkubGF6eUxpbmsoIHZhbHVlID0+IHtcclxuICAgIGlmICggdmFsdWUgPCAxMCApIHtcclxuICAgICAgcXVldWVQcm9wZXJ0eS52YWx1ZSA9IHZhbHVlICsgMTtcclxuICAgIH1cclxuICB9ICk7XHJcblxyXG4gIC8vIG5vdGlmeS1xdWV1ZTpcclxuICAvLyAxLT4yXHJcbiAgLy8gMi0+M1xyXG4gIC8vIDMtPjRcclxuICAvLyAuLi5cclxuICAvLyA4LT45XHJcblxyXG4gIHF1ZXVlUHJvcGVydHkubGF6eUxpbmsoICggdmFsdWUsIG9sZFZhbHVlICkgPT4ge1xyXG4gICAgYXNzZXJ0Lm9rKCB2YWx1ZSA9PT0gb2xkVmFsdWUgKyAxLCBgaW5jcmVtZW50IGVhY2ggdGltZTogJHtvbGRWYWx1ZX0gLT4gJHt2YWx1ZX1gICk7XHJcbiAgICBhc3NlcnQub2soIHZhbHVlID09PSBxdWV1ZUNvdW50KyssIGBpbmNyZW1lbnQgYnkgbW9zdCByZWNlbnQgY2hhbmdlZDogJHtxdWV1ZUNvdW50IC0gMn0tPiR7cXVldWVDb3VudCAtIDF9LCByZWNlaXZlZDogJHtvbGRWYWx1ZX0gLT4gJHt2YWx1ZX1gICk7XHJcbiAgfSApO1xyXG4gIHF1ZXVlUHJvcGVydHkudmFsdWUgPSBxdWV1ZUNvdW50O1xyXG5cclxuICBsZXQgc3RhY2tDb3VudCA9IDI7IC8vIHN0YXJ0cyBhcyBhIHZhbHVlIG9mIDEsIHNvIDIgaXMgdGhlIGZpcnN0IHZhbHVlIHdlIGNoYW5nZSB0by5cclxuICBjb25zdCBmaW5hbENvdW50ID0gMTA7XHJcbiAgbGV0IGxhc3RMaXN0ZW5lckNvdW50ID0gMTA7XHJcbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAvLyBzdGFja1xyXG4gIGNvbnN0IHN0YWNrUHJvcGVydHkgPSBuZXcgUHJvcGVydHk8bnVtYmVyPiggc3RhY2tDb3VudCAtIDEsIHtcclxuICAgIHJlZW50cmFudE5vdGlmaWNhdGlvblN0cmF0ZWd5OiAnc3RhY2snLFxyXG4gICAgcmVlbnRyYW50OiB0cnVlXHJcbiAgfSApO1xyXG5cclxuICBzdGFja1Byb3BlcnR5LmxhenlMaW5rKCB2YWx1ZSA9PiB7XHJcbiAgICBpZiAoIHZhbHVlIDwgZmluYWxDb3VudCApIHtcclxuICAgICAgc3RhY2tQcm9wZXJ0eS52YWx1ZSA9IHZhbHVlICsgMTtcclxuICAgIH1cclxuICB9ICk7XHJcblxyXG4gIC8vIHN0YWNrLW5vdGlmeTpcclxuICAvLyA4LT45XHJcbiAgLy8gNy0+OFxyXG4gIC8vIDYtPjdcclxuICAvLyAuLi5cclxuICAvLyAxLT4yXHJcbiAgc3RhY2tQcm9wZXJ0eS5sYXp5TGluayggKCB2YWx1ZSwgb2xkVmFsdWUgKSA9PiB7XHJcbiAgICBzdGFja0NvdW50Kys7XHJcbiAgICBhc3NlcnQub2soIHZhbHVlID09PSBvbGRWYWx1ZSArIDEsIGBpbmNyZW1lbnQgZWFjaCB0aW1lOiAke29sZFZhbHVlfSAtPiAke3ZhbHVlfWAgKTtcclxuICAgIGFzc2VydC5vayggdmFsdWUgPT09IGxhc3RMaXN0ZW5lckNvdW50LS0sIGBpbmNyZW1lbnQgaW4gb3JkZXIgZXhwZWN0ZWQ6ICR7bGFzdExpc3RlbmVyQ291bnR9LT4ke2xhc3RMaXN0ZW5lckNvdW50ICsgMX0sIHJlY2VpdmVkOiAke29sZFZhbHVlfSAtPiAke3ZhbHVlfWAgKTtcclxuICAgIGFzc2VydC5vayggb2xkVmFsdWUgPT09IGxhc3RMaXN0ZW5lckNvdW50LCBgbmV3IGNvdW50IGlzICR7bGFzdExpc3RlbmVyQ291bnR9OiB0aGUgb2xkVmFsdWUgKG1vc3QgcmVjZW50IGZpcnN0IGluIHN0YWNrIGZpcnN0YCApO1xyXG4gIH0gKTtcclxuICBzdGFja1Byb3BlcnR5LnZhbHVlID0gc3RhY2tDb3VudDtcclxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ29wdGlvbnMudmFsdWVDb21wYXJpc29uU3RyYXRlZ3knLCBhc3NlcnQgPT4ge1xyXG5cclxuICBsZXQgY2FsbGVkQ291bnQgPSAwO1xyXG4gIGxldCBteVByb3BlcnR5ID0gbmV3IFByb3BlcnR5PEludGVudGlvbmFsQW55PiggbmV3IFZlY3RvcjIoIDAsIDAgKSwge1xyXG4gICAgdmFsdWVDb21wYXJpc29uU3RyYXRlZ3k6ICdlcXVhbHNGdW5jdGlvbidcclxuICB9ICk7XHJcbiAgbXlQcm9wZXJ0eS5sYXp5TGluayggKCkgPT4gY2FsbGVkQ291bnQrKyApO1xyXG5cclxuICBteVByb3BlcnR5LnZhbHVlID0gbmV3IFZlY3RvcjIoIDAsIDAgKTtcclxuICBhc3NlcnQub2soIGNhbGxlZENvdW50ID09PSAwLCAnZXF1YWwnICk7XHJcbiAgbXlQcm9wZXJ0eS52YWx1ZSA9IG5ldyBWZWN0b3IyKCAwLCAzICk7XHJcbiAgYXNzZXJ0Lm9rKCBjYWxsZWRDb3VudCA9PT0gMSwgJ25vdCBlcXVhbCcgKTtcclxuXHJcbiAgY2FsbGVkQ291bnQgPSAwO1xyXG4gIG15UHJvcGVydHkgPSBuZXcgUHJvcGVydHk8SW50ZW50aW9uYWxBbnk+KCBuZXcgVmVjdG9yMiggMCwgMCApLCB7XHJcbiAgICB2YWx1ZUNvbXBhcmlzb25TdHJhdGVneTogJ2xvZGFzaERlZXAnXHJcbiAgfSApO1xyXG4gIG15UHJvcGVydHkubGF6eUxpbmsoICgpID0+IGNhbGxlZENvdW50KysgKTtcclxuXHJcbiAgbXlQcm9wZXJ0eS52YWx1ZSA9IHsgc29tZXRoaW5nOiAnaGknIH07XHJcbiAgYXNzZXJ0Lm9rKCBjYWxsZWRDb3VudCA9PT0gMSwgJ25vdCBlcXVhbCcgKTtcclxuICBteVByb3BlcnR5LnZhbHVlID0geyBzb21ldGhpbmc6ICdoaScgfTtcclxuICBhc3NlcnQub2soIGNhbGxlZENvdW50ID09PSAxLCAnZXF1YWwnICk7XHJcbiAgbXlQcm9wZXJ0eS52YWx1ZSA9IHsgc29tZXRoaW5nOiAnaGknLCBvdGhlcjogZmFsc2UgfTtcclxuICBhc3NlcnQub2soIGNhbGxlZENvdW50ID09PSAyLCAnbm90IGVxdWFsIHdpdGggb3RoZXIga2V5JyApO1xyXG59ICk7XHJcblxyXG4vLyBUZXN0cyB0aGF0IGNhbiBvbmx5IHJ1biBpbiBwaGV0LWlvIG1vZGVcclxuaWYgKCBUYW5kZW0uUEhFVF9JT19FTkFCTEVEICkge1xyXG4gIFFVbml0LnRlc3QoICdUZXN0IFByb3BlcnR5SU8gdG9TdGF0ZU9iamVjdC9mcm9tU3RhdGVPYmplY3QnLCBhc3NlcnQgPT4ge1xyXG4gICAgY29uc3QgZG9uZSA9IGFzc2VydC5hc3luYygpO1xyXG4gICAgY29uc3QgdGFuZGVtID0gVGFuZGVtLlJPT1RfVEVTVC5jcmVhdGVUYW5kZW0oICd0ZXN0VGFuZGVtUHJvcGVydHknICk7XHJcbiAgICBjb25zdCBwaGV0aW9UeXBlID0gTnVtYmVyUHJvcGVydHkuTnVtYmVyUHJvcGVydHlJTztcclxuICAgIGNvbnN0IHByb3BlcnR5VmFsdWUgPSAxMjM7XHJcbiAgICBjb25zdCB2YWxpZFZhbHVlcyA9IFsgMCwgMSwgMiwgMywgcHJvcGVydHlWYWx1ZSBdO1xyXG5cclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgcmVkZWZpbmluZyBmdW5jdGlvbiBmb3IgdGVzdGluZ1xyXG4gICAgdGFuZGVtLmFkZFBoZXRpb09iamVjdCA9IGZ1bmN0aW9uKCBpbnN0YW5jZTogTnVtYmVyUHJvcGVydHksIG9wdGlvbnM6IEludGVudGlvbmFsQW55ICk6IHZvaWQge1xyXG5cclxuICAgICAgLy8gUGhFVC1pTyBvcGVyYXRlcyB1bmRlciB0aGUgYXNzdW1wdGlvbiB0aGF0IG5vdGhpbmcgd2lsbCBhY2Nlc3MgYSBQaGV0aW9PYmplY3QgdW50aWwgdGhlIG5leHQgYW5pbWF0aW9uIGZyYW1lXHJcbiAgICAgIC8vIHdoZW4gdGhlIG9iamVjdCBpcyBmdWxseSBjb25zdHJ1Y3RlZC4gIEZvciBleGFtcGxlLCBQcm9wZXJ0eSBzdGF0ZSB2YXJpYWJsZXMgYXJlIHNldCBhZnRlciB0aGUgY2FsbGJhY2tcclxuICAgICAgLy8gdG8gYWRkUGhldGlvT2JqZWN0LCB3aGljaCBvY2N1cnMgZHVyaW5nIFByb3BlcnR5LmNvbnN0cnVjdG9yLnN1cGVyKCkuXHJcbiAgICAgIHNldFRpbWVvdXQoICgpID0+IHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBiYWQtc2ltLXRleHRcclxuXHJcbiAgICAgICAgLy8gUnVuIGluIHRoZSBuZXh0IGZyYW1lIGFmdGVyIHRoZSBvYmplY3QgZmluaXNoZWQgZ2V0dGluZyBjb25zdHJ1Y3RlZFxyXG4gICAgICAgIGNvbnN0IHN0YXRlT2JqZWN0ID0gcGhldGlvVHlwZS50b1N0YXRlT2JqZWN0KCBpbnN0YW5jZSApO1xyXG4gICAgICAgIGFzc2VydC5lcXVhbCggc3RhdGVPYmplY3QudmFsdWUsIHByb3BlcnR5VmFsdWUsICd0b1N0YXRlT2JqZWN0IHNob3VsZCBtYXRjaCcgKTtcclxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsKCBzdGF0ZU9iamVjdC52YWxpZFZhbHVlcywgdmFsaWRWYWx1ZXMsICd0b1N0YXRlT2JqZWN0IHNob3VsZCBtYXRjaCcgKTtcclxuICAgICAgICBkb25lKCk7XHJcbiAgICAgIH0sIDAgKTtcclxuICAgIH07XHJcbiAgICBuZXcgTnVtYmVyUHJvcGVydHkoIHByb3BlcnR5VmFsdWUsIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1uZXdcclxuICAgICAgdGFuZGVtOiB0YW5kZW0sXHJcbiAgICAgIHZhbGlkVmFsdWVzOiB2YWxpZFZhbHVlc1xyXG4gICAgfSApO1xyXG4gIH0gKTtcclxufVxyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIEVORCBQSEVUX0lPIE9OTFkgVEVTVFNcclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxNQUFNLE1BQU0sMkJBQTJCO0FBQzlDLE9BQU9DLFNBQVMsTUFBTSxnQkFBZ0I7QUFDdEMsT0FBT0MsY0FBYyxNQUFNLHFCQUFxQjtBQUNoRCxPQUFPQyxRQUFRLE1BQU0sZUFBZTtBQUdwQyxPQUFPQyxPQUFPLE1BQU0seUJBQXlCO0FBRTdDQyxLQUFLLENBQUNDLE1BQU0sQ0FBRSxVQUFXLENBQUM7QUFFMUJELEtBQUssQ0FBQ0UsSUFBSSxDQUFFLGFBQWEsRUFBRUMsTUFBTSxJQUFJO0VBQ25DLE1BQU1DLFFBQVEsR0FBRyxJQUFJTixRQUFRLENBQUUsQ0FBRSxDQUFDO0VBQ2xDLE1BQU1PLHNCQUFzQixHQUFHRCxRQUFRLENBQUUsa0JBQWtCLENBQUUsQ0FBQyxDQUFDO0VBQy9ELE1BQU1FLENBQUMsR0FBRyxTQUFBQSxDQUFVQSxDQUFVLEVBQUc7SUFBRUMsQ0FBQyxDQUFDQyxJQUFJO0VBQUUsQ0FBQztFQUM1QyxNQUFNQyxDQUFDLEdBQUcsU0FBQUEsQ0FBVUEsQ0FBVSxFQUFHO0lBQUVGLENBQUMsQ0FBQ0MsSUFBSTtFQUFFLENBQUM7RUFDNUMsTUFBTUUsQ0FBQyxHQUFHLFNBQUFBLENBQVVBLENBQVUsRUFBRztJQUFFSCxDQUFDLENBQUNDLElBQUk7RUFBRSxDQUFDO0VBQzVDSixRQUFRLENBQUNPLElBQUksQ0FBRUwsQ0FBRSxDQUFDO0VBQ2xCRixRQUFRLENBQUNPLElBQUksQ0FBRUYsQ0FBRSxDQUFDO0VBQ2xCTCxRQUFRLENBQUNPLElBQUksQ0FBRUQsQ0FBRSxDQUFDO0VBQ2xCUCxN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