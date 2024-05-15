// Copyright 2019-2024, University of Colorado Boulder

/**
 * QUnit tests for Validator
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Vector2 from '../../dot/js/Vector2.js';
import EnumerationDeprecated from '../../phet-core/js/EnumerationDeprecated.js';
import { Node } from '../../scenery/js/imports.js';
import BooleanIO from '../../tandem/js/types/BooleanIO.js';
import IOType from '../../tandem/js/types/IOType.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import Emitter from './Emitter.js';
import Property from './Property.js';
import validate from './validate.js';
import Validation from './Validation.js';
import Vector3 from '../../dot/js/Vector3.js';

// constants
const ASSERTIONS_TRUE = {
  assertions: true
};
QUnit.module('Validator');

// Note that many validation tests are in PropertyTests
QUnit.test('Test validate and Validation.isValidValue', assert => {
  window.assert && assert.throws(() => validate(4, {
    validValues: [1, 2, 3]
  }), 'invalid number');
  window.assert && assert.throws(() => validate('hello', {
    valueType: Array
  }), 'string isn\'t Array');
  assert.ok(Validation.isValueValid(3, {
    validValues: [1, 2, 3]
  }));
  assert.ok(Validation.isValueValid([], {
    valueType: Array
  }));
  assert.ok(Validation.isValueValid(7, {
    valueType: 'number',
    isValidValue: v => v > 5
  }));
  assert.ok(!Validation.isValueValid(7, {
    valueType: 'number',
    isValidValue: v => v > 7
  }));
  assert.ok(!Validation.isValueValid(7, {
    valueType: 'number',
    isValidValue: v => v < 3
  }));
});
QUnit.test('Test containsValidatorKey', assert => {
  assert.ok(Validation.containsValidatorKey({
    validValues: []
  }), 'has key validValues');
  assert.ok(!Validation.containsValidatorKey({
    shmalidValues: []
  }), 'does not have key: validValues');
  assert.ok(Validation.containsValidatorKey({
    validValues: [],
    valueType: []
  }), 'does have keys: valueType and validValues');
  assert.ok(Validation.containsValidatorKey({
    validValue: [],
    valueType: []
  }), 'still have valueType and be ok even though it doesn\'t have validValues');
  assert.ok(!Validation.containsValidatorKey(undefined), 'undefined: no validator key');
  assert.ok(!Validation.containsValidatorKey(null), 'null: no validator key');
  assert.ok(!Validation.containsValidatorKey(5), 'number: no validator key');
  assert.ok(!Validation.containsValidatorKey({
    fdsaf: true
  }), 'undefined: no validator key');
  assert.ok(!Validation.containsValidatorKey(new IOType('TestIO', {
    valueType: 'string'
  })), 'undefined: no validator key');
  assert.ok(Validation.containsValidatorKey({
    valueType: 'fdsaf'
  }), 'has valueType, even though valueType has the wrong value');
});
QUnit.test('Test getValidatorValidationError and validateValidator', assert => {
  window.assert && assert.throws(() => Validation.validateValidator({
    valueType: Array,
    // @ts-expect-error INTENTIONAL
    isValidValue: 4
  }), 'isValidValue should be function');
  window.assert && assert.ok(typeof Validation.getValidatorValidationError({
    valueType: Array,
    validValues: ['hi']
  }) === 'string', 'validValues contains invalid value');
  assert.ok(!Validation.getValidatorValidationError({
    valueType: 'number'
  }), 'good valueType');

  // @ts-expect-error
  assert.ok(Validation.getValidatorValidationError({
    validValue: 'number'
  }), 'no validator keys supplied');

  // @ts-expect-error
  assert.ok(Validation.getValidatorValidationError({
    validValue: 4
  }), 'no validator keys supplied');
  assert.ok(Validation.getValidatorValidationError({
    valueType: 'blaradysharady'
  }), 'invalid valueType string');
  assert.ok(!Validation.getValidatorValidationError({
    isValidValue: () => true
  }), 'isValidValue is a function');

  // @ts-expect-error
  assert.ok(Validation.getValidatorValidationError({
    isValidValue: 'hi'
  }), 'isValidValue should not be string');
  assert.ok(!Validation.getValidatorValidationError({
    valueType: null
  }), 'null is valid');
  assert.ok(!Validation.getValidatorValidationError({
    valueType: ['number', null]
  }), 'array of null and number is valid');
  assert.ok(!Validation.getValidatorValidationError({
    valueType: ['number', null, Node]
  }), 'array of null and number is valid');
  assert.ok(Validation.getValidatorValidationError({
    valueType: ['numberf', null, Node]
  }), 'numberf is not a valid valueType');
  assert.ok(!Validation.isValueValid(undefined, {
    valueType: ['number', 'sstring']
  }), 'sstring is not a valid valueType');

  // @ts-expect-error
  assert.ok(!Validation.isValueValid(undefined, {
    valueType: [7]
  }, ASSERTIONS_TRUE), '7 is not a valid valueType');

  // @ts-expect-error
  assert.ok(!Validation.isValueValid(undefined, {
    valueType: ['number', {}]
  }, ASSERTIONS_TRUE), 'Object literal  is not a valid valueType');
});
QUnit.test('Test valueType: {Array.<number|null|string|function|EnumerationDeprecated>}', assert => {
  assert.ok(Validation.isValueValid(null, {
    valueType: null
  }), 'null is valid');
  assert.ok(Validation.isValueValid(7, {
    valueType: ['number', null]
  }), '7 is valid for null and number');
  assert.ok(Validation.isValueValid(null, {
    valueType: ['number', null]
  }), 'null is valid for null and number');
  assert.ok(Validation.isValueValid(new Node(), {
    valueType: ['number', null, Node]
  }), 'Node is valid');
  assert.ok(Validation.isValueValid(EnumerationDeprecated.byKeys(['ROBIN', 'JAY', 'WREN']), {
    valueType: [EnumerationDeprecated, null, Node]
  }), 'Node is valid');
  assert.ok(!Validation.isValueValid('hello', {
    valueType: ['number', null, Node]
  }), 'string not valid');
  window.assert && assert.throws(() => validate(true, {
    valueType: ['number', 'string']
  }), 'number and string do not validate boolean');
  window.assert && assert.throws(() => validate(null, {
    valueType: ['number', 'string']
  }), 'number and string do not validate null');
  window.assert && assert.throws(() => validate(undefined, {
    valueType: ['number', 'string']
  }), 'number and string do not validate undefined');
  window.assert && assert.throws(() => validate(_.noop, {
    valueType: ['number', 'string']
  }), 'number and string do not validate undefined');
  const Birds = EnumerationDeprecated.byKeys(['ROBIN', 'JAY', 'WREN']);
  window.assert && assert.throws(() => validate(_.noop, {
    valueType: [Birds, 'string']
  }), 'number and string do not validate undefined');
});
QUnit.test('Test valueType: {EnumerationDeprecated}', assert => {
  const Birds = EnumerationDeprecated.byKeys(['ROBIN', 'JAY', 'WREN']);
  assert.ok(!Validation.getValidatorValidationError({
    valueType: Birds
  }), 'good valueType');

  // @ts-expect-error
  assert.ok(Validation.isValueValid(Birds.ROBIN, {
    valueType: Birds
  }), 'good value');
  assert.ok(!Validation.isValueValid(4, {
    valueType: Birds
  }), 'bad value');
});
QUnit.test('Test phetioType', assert => {
  // Stub phetioType here for testing. ts-expect-errors may be able to be removed when IOType is in typescript.
  // @ts-expect-error
  assert.ok(!Validation.getValidatorValidationError({
    phetioType: {
      validator: {
        valueType: 'number'
      }
    }
  }), 'good phetioType');
  // @ts-expect-error
  assert.ok(!Validation.getValidatorValidationError({
    phetioType: {
      validator: {
        isValidValue: () => true
      }
    }
  }), 'good phetioType');
  // @ts-expect-error
  assert.ok(Validation.getValidatorValidationError({
    phetioType: {
      notValidator: {
        isValidValue: () => true
      }
    }
  }), 'bad phetioType');
  // @ts-expect-error
  assert.ok(Validation.getValidatorValidationError({
    phetioType: {
      validator: {
        isValidValue: 'number'
      }
    }
  }), 'bad phetioType');
  // @ts-expect-error
  assert.ok(Validation.getValidatorValidationError({
    phetioType: {
      validator: {}
    }
  }), 'bad phetioType');
  // @ts-expect-error
  assert.ok(Validation.getValidatorValidationError({
    phetioType: {
      validator: null
    }
  }), 'bad phetioType');
  // @ts-expect-error
  assert.ok(Validation.getValidatorValidationError({
    phetioType: 'null'
  }), 'bad phetioType');
  // @ts-expect-error
  assert.ok(Validation.getValidatorValidationError({
    phetioType: null
  }), 'bad phetioType');
  assert.ok(Validation.isValueValid('hello', {
    phetioType: StringIO
  }), 'string valid');
  assert.ok(!Validation.isValueValid(null, {
    phetioType: StringIO
  }), 'null not valid');
  assert.ok(!Validation.isValueValid(undefined, {
    phetioType: StringIO
  }), 'undefined not valid');
  assert.ok(Validation.isValueValid('oh hi', {
    phetioType: StringIO
  }), 'string valid');
  assert.ok(Validation.isValueValid('oh no', {
    phetioType: StringIO,
    isValidValue: v => v.startsWith('o')
  }), 'string valid');
  assert.ok(!Validation.isValueValid('ho on', {
    phetioType: StringIO,
    isValidValue: v => v.startsWith('o')
  }), 'string not valid');
  assert.ok(Validation.isValueValid(new Emitter(), {
    phetioType: Emitter.EmitterIO([])
  }), 'emitter is valid');
});
QUnit.test('validationMessage is presented for all validation errors', assert => {
  const testContainsErrorMessage = (value, validator, validationMessage = validator.validationMessage) => {
    const message = typeof validationMessage === 'function' ? validationMessage() : validationMessage;
    assert.ok(message, 'should have a message');
    const validationError = Validation.getValidationError(value, validator);
    assert.ok(validationError && validationError.includes(message), message);
  };
  testContainsErrorMessage(5, {
    valueType: 'boolean',
    validationMessage: 'valueType boolean, value number'
  });
  testContainsErrorMessage(true, {
    valueType: 'number',
    validationMessage: 'valueType number, value boolean'
  });
  testContainsErrorMessage(true, {
    valueType: ['string', 'number'],
    validationMessage: 'valueType string`,number value boolean'
  });
  testContainsErrorMessage(true, {
    valueType: [null, 'number'],
    validationMessage: 'valueType null,number value boolean'
  });
  testContainsErrorMessage(false, {
    validValues: ['hi', true],
    validationMessage: 'validValues with value:false'
  });
  testContainsErrorMessage(5, {
    validValues: ['hi', true],
    validationMessage: 'validValues with value:5'
  });
  testContainsErrorMessage(4, {
    isValidValue: v => v === 3,
    validationMessage: 'isValidValue 3, value 4'
  });
  testContainsErrorMessage(4, {
    isValidValue: v => v === 3,
    validationMessage: () => 'isValidValue 3, value 4'
  });
  const myVar = 5;
  testContainsErrorMessage(4, {
    isValidValue: v => v === myVar,
    validationMessage: () => `isValidValue ${myVar}, value 4`
  });
  testContainsErrorMessage('oh hello', {
    phetioType: Property.PropertyIO(BooleanIO),
    validationMessage: 'isValidValue 3, value string'
  });
  const ioType = new IOType('TestIO', {
    valueType: 'boolean'
  });
  const ioTypeValidationMessage = 'should be a boolean from this IOType in tests';
  ioType.validator.validationMessage = ioTypeValidationMessage;
  testContainsErrorMessage('hi', {
    phetioType: ioType
  }, ioTypeValidationMessage);
});
QUnit.test('test Validator.validators', assert => {
  assert.ok(!Validation.getValidatorValidationError({
    validators: [{
      valueType: 'boolean'
    }, {
      isValidValue: v => v === false
    }]
  }), 'correct validator');

  // @ts-expect-error
  assert.ok(Validation.getValidatorValidationError({
    validators: [{
      valueType: 'boolean'
    }, {
      isValidValue: 7
    }]
  }), 'incorrect validator');

  // @ts-expect-error
  assert.ok(Validation.getValidatorValidationError({
    validators: [{
      valueType: 'boolean'
    }, 7]
  }), 'incorrect validator2');
  assert.ok(Validation.getValidationError('7', {
    validators: [{
      valueType: 'boolean'
    }, {
      isValidValue: v => v === false
    }]
  }));
  assert.ok(Validation.getValidationError(true, {
    validators: [{
      valueType: 'boolean'
    }, {
      isValidValue: v => v === false
    }]
  }));
  assert.ok(Validation.getValidationError(undefined, {
    validators: [{
      valueType: 'boolean'
    }, {
      isValidValue: v => v === false
    }]
  }));
  assert.ok(!Validation.getValidationError(false, {
    validators: [{
      valueType: 'boolean'
    }, {
      isValidValue: v => v === false
    }]
  }));
});

// See similar tests in TinyProperty for valueComparisonStrategy
QUnit.test('Validator.equalsForValidationStrategy', assert => {
  assert.ok(Validation.equalsForValidationStrategy(1, 1, 'reference'));
  assert.ok(Validation.equalsForValidationStrategy(1, 1));
  assert.ok(!Validation.equalsForValidationStrategy(1, '1'));
  const object = {};
  assert.ok(!Validation.equalsForValidationStrategy(object, {}, 'reference'));
  assert.ok(Validation.equalsForValidationStrategy(object, object, 'reference'));
  assert.ok(Validation.equalsForValidationStrategy({}, {}, (a, b) => a instanceof Object && b instanceof Object));
  assert.ok(Validation.equalsForValidationStrategy(new Vector2(0, 0), new Vector2(0, 0), 'equalsFunction'));
  assert.ok(Validation.equalsForValidationStrategy(new Vector2(0, 0), Vector2.ZERO, 'equalsFunction'));
  assert.ok(!Validation.equalsForValidationStrategy(new Vector2(0, 1), new Vector2(0, 0), 'equalsFunction'));
  assert.ok(Validation.equalsForValidationStrategy(new Vector2(0, 1), new Vector2(0, 3), (a, b) => a.x === b.x));
  assert.ok(Validation.equalsForValidationStrategy(new Vector2(0, 1), new Vector3(0, 4, 3), () => true));
  assert.ok(Validation.equalsForValidationStrategy({}, {}, 'lodashDeep'));
  assert.ok(Validation.equalsForValidationStrategy({
    hi: true
  }, {
    hi: true
  }, 'lodashDeep'));
  assert.ok(!Validation.equalsForValidationStrategy({
    hi: true
  }, {
    hi: true,
    other: false
  }, 'lodashDeep'));
});

// See similar tests in TinyProperty for valueComparisonStrategy
QUnit.test('equalsFunction quirks', assert => {
  // DIFFERENT CONSTRUCTORS
  class MyNumber {
    constructor(value) {
      this.value = value;
    }
    equals(other) {
      return this.value === other.value;
    }
  }
  class MyNumberEqualsWhenSameSideOf5 {
    constructor(value) {
      this.value = value;
    }

    // If both are greater than or both are less than 5. Unequal if different. Equals 5 is treated as less than.
    equals(other) {
      return this.value > 5 === other.value > 5;
    }
  }
  assert.ok(Validation.equalsForValidationStrategy(new MyNumber(1), new MyNumber(1), 'equalsFunction'));
  assert.ok(!Validation.equalsForValidationStrategy(new MyNumber(2), new MyNumber(1), 'equalsFunction'));
  assert.ok(Validation.equalsForValidationStrategy(new MyNumber(1), new MyNumberEqualsWhenSameSideOf5(1), 'equalsFunction'));
  assert.ok(Validation.equalsForValidationStrategy(new MyNumberEqualsWhenSameSideOf5(6), new MyNumberEqualsWhenSameSideOf5(7), 'equalsFunction'));
  assert.ok(!Validation.equalsForValidationStrategy(new MyNumberEqualsWhenSameSideOf5(3), new MyNumberEqualsWhenSameSideOf5(7), 'equalsFunction'));
  window.assert && assert.throws(() => !Validation.equalsForValidationStrategy(new MyNumber(6), new MyNumberEqualsWhenSameSideOf5(7), 'equalsFunction'));

  //////////////////////////////////////
  // SUPPORT NULL AND UNDEFINED
  assert.ok(Validation.equalsForValidationStrategy(null, null, 'equalsFunction'));
  assert.ok(!Validation.equalsForValidationStrategy(null, undefined, 'equalsFunction'));
  assert.ok(!Validation.equalsForValidationStrategy(null, new MyNumber(3), 'equalsFunction'));
  assert.ok(!Validation.equalsForValidationStrategy(undefined, new MyNumber(3), 'equalsFunction'));
  assert.ok(!Validation.equalsForValidationStrategy(new MyNumber(3), null, 'equalsFunction'));
  assert.ok(!Validation.equalsForValidationStrategy(new MyNumber(3), undefined, 'equalsFunction'));
  window.assert && assert.throws(() => Validation.equalsForValidationStrategy(false, 7, 'equalsFunction'));
  window.assert && assert.throws(() => Validation.equalsForValidationStrategy(false, new MyNumber(3), 'equalsFunction'));
  window.assert && assert.throws(() => Validation.equalsForValidationStrategy('', new MyNumber(3), 'equalsFunction'));
  /////////////////////////////
});
QUnit.test('Validator.valueComparisonStrategy', assert => {
  const myValueArray = [7, 6, 5];

  // @ts-expect-error wrong value for valueComparisonStrategy
  assert.ok(Validation.getValidatorValidationError({
    valueComparisonStrategy: 'referfdsafdsence'
  }), 'that is not a correct valueComparisonStrategy');
  assert.ok(!Validation.getValidationError(myValueArray, {
    validators: [{
      validValues: [myValueArray],
      valueComparisonStrategy: 'reference'
    }]
  }));
  assert.ok(!Validation.getValidationError(myValueArray, {
    validators: [{
      validValues: [[7, 6, 5]],
      valueComparisonStrategy: 'lodashDeep'
    }]
  }));
  assert.ok(Validation.getValidationError(myValueArray, {
    validators: [{
      validValues: [[7, 6, 5]],
      valueComparisonStrategy: 'reference'
    }]
  }), 'That isn\'t the same array!');
  window.assert && assert.throws(() => {
    Validation.getValidationError(myValueArray, {
      validators: [{
        validValues: [[7, 6, 5]],
        valueComparisonStrategy: 'equalsFunction'
      }]
    });
  }, 'arrays do not have an equals function');
  const sameInstanceVector = new Vector2(2, 6);
  assert.ok(!Validation.getValidationError(sameInstanceVector, {
    validators: [{
      validValues: [new Vector2(0, 1), sameInstanceVector],
      valueComparisonStrategy: 'equalsFunction'
    }]
  }));
  assert.ok(!Validation.getValidationError(new Vector2(0, 0), {
    validators: [{
      validValues: [new Vector2(0, 1), new Vector2(0, 0)],
      valueComparisonStrategy: 'equalsFunction'
    }]
  }));
  assert.ok(Validation.getValidationError(new Vector2(0, 2), {
    validators: [{
      validValues: [new Vector2(0, 1), new Vector2(0, 0)],
      valueComparisonStrategy: 'equalsFunction'
    }]
  }));
  assert.ok(!Validation.getValidationError(sameInstanceVector, {
    validators: [{
      validValues: [new Vector2(0, 1), sameInstanceVector],
      valueComparisonStrategy: (a, b) => a.x === b.x
    }]
  }));
  assert.ok(!Validation.getValidationError(new Vector2(0, 0), {
    validators: [{
      validValues: [new Vector2(5, 1), new Vector2(0, 3)],
      valueComparisonStrategy: (a, b) => a.x === b.x
    }]
  }));
  assert.ok(Validation.getValidationError(new Vector2(0, 0), {
    validators: [{
      validValues: [new Vector2(1, 1), new Vector2(2, 0)],
      valueComparisonStrategy: (a, b) => a.x === b.x
    }]
  }));
  assert.ok(!Validation.equalsForValidationStrategy(new Vector2(0, 0), new Vector2(0, 0), (a, b) => a === b));
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJWZWN0b3IyIiwiRW51bWVyYXRpb25EZXByZWNhdGVkIiwiTm9kZSIsIkJvb2xlYW5JTyIsIklPVHlwZSIsIlN0cmluZ0lPIiwiRW1pdHRlciIsIlByb3BlcnR5IiwidmFsaWRhdGUiLCJWYWxpZGF0aW9uIiwiVmVjdG9yMyIsIkFTU0VSVElPTlNfVFJVRSIsImFzc2VydGlvbnMiLCJRVW5pdCIsIm1vZHVsZSIsInRlc3QiLCJhc3NlcnQiLCJ3aW5kb3ciLCJ0aHJvd3MiLCJ2YWxpZFZhbHVlcyIsInZhbHVlVHlwZSIsIkFycmF5Iiwib2siLCJpc1ZhbHVlVmFsaWQiLCJpc1ZhbGlkVmFsdWUiLCJ2IiwiY29udGFpbnNWYWxpZGF0b3JLZXkiLCJzaG1hbGlkVmFsdWVzIiwidmFsaWRWYWx1ZSIsInVuZGVmaW5lZCIsImZkc2FmIiwidmFsaWRhdGVWYWxpZGF0b3IiLCJnZXRWYWxpZGF0b3JWYWxpZGF0aW9uRXJyb3IiLCJieUtleXMiLCJfIiwibm9vcCIsIkJpcmRzIiwiUk9CSU4iLCJwaGV0aW9UeXBlIiwidmFsaWRhdG9yIiwibm90VmFsaWRhdG9yIiwic3RhcnRzV2l0aCIsIkVtaXR0ZXJJTyIsInRlc3RDb250YWluc0Vycm9yTWVzc2FnZSIsInZhbHVlIiwidmFsaWRhdGlvbk1lc3NhZ2UiLCJtZXNzYWdlIiwidmFsaWRhdGlvbkVycm9yIiwiZ2V0VmFsaWRhdGlvbkVycm9yIiwiaW5jbHVkZXMiLCJteVZhciIsIlByb3BlcnR5SU8iLCJpb1R5cGUiLCJpb1R5cGVWYWxpZGF0aW9uTWVzc2FnZSIsInZhbGlkYXRvcnMiLCJlcXVhbHNGb3JWYWxpZGF0aW9uU3RyYXRlZ3kiLCJvYmplY3QiLCJhIiwiYiIsIk9iamVjdCIsIlpFUk8iLCJ4IiwiaGkiLCJvdGhlciIsIk15TnVtYmVyIiwiY29uc3RydWN0b3IiLCJlcXVhbHMiLCJNeU51bWJlckVxdWFsc1doZW5TYW1lU2lkZU9mNSIsIm15VmFsdWVBcnJheSIsInZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5Iiwic2FtZUluc3RhbmNlVmVjdG9yIl0sInNvdXJjZXMiOlsiVmFsaWRhdGlvblRlc3RzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE5LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFFVbml0IHRlc3RzIGZvciBWYWxpZGF0b3JcclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgVmVjdG9yMiBmcm9tICcuLi8uLi9kb3QvanMvVmVjdG9yMi5qcyc7XHJcbmltcG9ydCBFbnVtZXJhdGlvbkRlcHJlY2F0ZWQgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL0VudW1lcmF0aW9uRGVwcmVjYXRlZC5qcyc7XHJcbmltcG9ydCB7IE5vZGUgfSBmcm9tICcuLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgQm9vbGVhbklPIGZyb20gJy4uLy4uL3RhbmRlbS9qcy90eXBlcy9Cb29sZWFuSU8uanMnO1xyXG5pbXBvcnQgSU9UeXBlIGZyb20gJy4uLy4uL3RhbmRlbS9qcy90eXBlcy9JT1R5cGUuanMnO1xyXG5pbXBvcnQgU3RyaW5nSU8gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL3R5cGVzL1N0cmluZ0lPLmpzJztcclxuaW1wb3J0IEVtaXR0ZXIgZnJvbSAnLi9FbWl0dGVyLmpzJztcclxuaW1wb3J0IFByb3BlcnR5IGZyb20gJy4vUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgdmFsaWRhdGUgZnJvbSAnLi92YWxpZGF0ZS5qcyc7XHJcbmltcG9ydCBWYWxpZGF0aW9uLCB7IFZhbGlkYXRvciB9IGZyb20gJy4vVmFsaWRhdGlvbi5qcyc7XHJcbmltcG9ydCBJbnRlbnRpb25hbEFueSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvSW50ZW50aW9uYWxBbnkuanMnO1xyXG5pbXBvcnQgVmVjdG9yMyBmcm9tICcuLi8uLi9kb3QvanMvVmVjdG9yMy5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgQVNTRVJUSU9OU19UUlVFID0geyBhc3NlcnRpb25zOiB0cnVlIH07XHJcblxyXG5RVW5pdC5tb2R1bGUoICdWYWxpZGF0b3InICk7XHJcblxyXG4vLyBOb3RlIHRoYXQgbWFueSB2YWxpZGF0aW9uIHRlc3RzIGFyZSBpbiBQcm9wZXJ0eVRlc3RzXHJcblFVbml0LnRlc3QoICdUZXN0IHZhbGlkYXRlIGFuZCBWYWxpZGF0aW9uLmlzVmFsaWRWYWx1ZScsIGFzc2VydCA9PiB7XHJcblxyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4gdmFsaWRhdGUoIDQsIHsgdmFsaWRWYWx1ZXM6IFsgMSwgMiwgMyBdIH0gKSwgJ2ludmFsaWQgbnVtYmVyJyApO1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4gdmFsaWRhdGUoICdoZWxsbycsIHsgdmFsdWVUeXBlOiBBcnJheSB9ICksICdzdHJpbmcgaXNuXFwndCBBcnJheScgKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmlzVmFsdWVWYWxpZCggMywgeyB2YWxpZFZhbHVlczogWyAxLCAyLCAzIF0gfSApICk7XHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmlzVmFsdWVWYWxpZCggW10sIHsgdmFsdWVUeXBlOiBBcnJheSB9ICkgKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmlzVmFsdWVWYWxpZCggNywgeyB2YWx1ZVR5cGU6ICdudW1iZXInLCBpc1ZhbGlkVmFsdWU6ICggdjogbnVtYmVyICkgPT4gdiA+IDUgfSApICk7XHJcbiAgYXNzZXJ0Lm9rKCAhVmFsaWRhdGlvbi5pc1ZhbHVlVmFsaWQoIDcsIHsgdmFsdWVUeXBlOiAnbnVtYmVyJywgaXNWYWxpZFZhbHVlOiAoIHY6IG51bWJlciApID0+IHYgPiA3IH0gKSApO1xyXG4gIGFzc2VydC5vayggIVZhbGlkYXRpb24uaXNWYWx1ZVZhbGlkKCA3LCB7IHZhbHVlVHlwZTogJ251bWJlcicsIGlzVmFsaWRWYWx1ZTogKCB2OiBudW1iZXIgKSA9PiB2IDwgMyB9ICkgKTtcclxuXHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdUZXN0IGNvbnRhaW5zVmFsaWRhdG9yS2V5JywgYXNzZXJ0ID0+IHtcclxuICBhc3NlcnQub2soIFZhbGlkYXRpb24uY29udGFpbnNWYWxpZGF0b3JLZXkoIHsgdmFsaWRWYWx1ZXM6IFtdIH0gKSwgJ2hhcyBrZXkgdmFsaWRWYWx1ZXMnICk7XHJcbiAgYXNzZXJ0Lm9rKCAhVmFsaWRhdGlvbi5jb250YWluc1ZhbGlkYXRvcktleSggeyBzaG1hbGlkVmFsdWVzOiBbXSB9ICksICdkb2VzIG5vdCBoYXZlIGtleTogdmFsaWRWYWx1ZXMnICk7XHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmNvbnRhaW5zVmFsaWRhdG9yS2V5KCB7XHJcbiAgICB2YWxpZFZhbHVlczogW10sXHJcbiAgICB2YWx1ZVR5cGU6IFtdXHJcbiAgfSApLCAnZG9lcyBoYXZlIGtleXM6IHZhbHVlVHlwZSBhbmQgdmFsaWRWYWx1ZXMnICk7XHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmNvbnRhaW5zVmFsaWRhdG9yS2V5KCB7XHJcbiAgICB2YWxpZFZhbHVlOiBbXSxcclxuICAgIHZhbHVlVHlwZTogW11cclxuICB9ICksICdzdGlsbCBoYXZlIHZhbHVlVHlwZSBhbmQgYmUgb2sgZXZlbiB0aG91Z2ggaXQgZG9lc25cXCd0IGhhdmUgdmFsaWRWYWx1ZXMnICk7XHJcblxyXG4gIGFzc2VydC5vayggIVZhbGlkYXRpb24uY29udGFpbnNWYWxpZGF0b3JLZXkoIHVuZGVmaW5lZCApLCAndW5kZWZpbmVkOiBubyB2YWxpZGF0b3Iga2V5JyApO1xyXG4gIGFzc2VydC5vayggIVZhbGlkYXRpb24uY29udGFpbnNWYWxpZGF0b3JLZXkoIG51bGwgKSwgJ251bGw6IG5vIHZhbGlkYXRvciBrZXknICk7XHJcbiAgYXNzZXJ0Lm9rKCAhVmFsaWRhdGlvbi5jb250YWluc1ZhbGlkYXRvcktleSggNSApLCAnbnVtYmVyOiBubyB2YWxpZGF0b3Iga2V5JyApO1xyXG4gIGFzc2VydC5vayggIVZhbGlkYXRpb24uY29udGFpbnNWYWxpZGF0b3JLZXkoIHsgZmRzYWY6IHRydWUgfSApLCAndW5kZWZpbmVkOiBubyB2YWxpZGF0b3Iga2V5JyApO1xyXG4gIGFzc2VydC5vayggIVZhbGlkYXRpb24uY29udGFpbnNWYWxpZGF0b3JLZXkoIG5ldyBJT1R5cGUoICdUZXN0SU8nLCB7IHZhbHVlVHlwZTogJ3N0cmluZycgfSApICksXHJcbiAgICAndW5kZWZpbmVkOiBubyB2YWxpZGF0b3Iga2V5JyApO1xyXG4gIGFzc2VydC5vayggVmFsaWRhdGlvbi5jb250YWluc1ZhbGlkYXRvcktleSggeyB2YWx1ZVR5cGU6ICdmZHNhZicgfSApLFxyXG4gICAgJ2hhcyB2YWx1ZVR5cGUsIGV2ZW4gdGhvdWdoIHZhbHVlVHlwZSBoYXMgdGhlIHdyb25nIHZhbHVlJyApO1xyXG59ICk7XHJcblxyXG5cclxuUVVuaXQudGVzdCggJ1Rlc3QgZ2V0VmFsaWRhdG9yVmFsaWRhdGlvbkVycm9yIGFuZCB2YWxpZGF0ZVZhbGlkYXRvcicsIGFzc2VydCA9PiB7XHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiBWYWxpZGF0aW9uLnZhbGlkYXRlVmFsaWRhdG9yKCB7XHJcbiAgICB2YWx1ZVR5cGU6IEFycmF5LFxyXG5cclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgSU5URU5USU9OQUxcclxuICAgIGlzVmFsaWRWYWx1ZTogNFxyXG4gIH0gKSwgJ2lzVmFsaWRWYWx1ZSBzaG91bGQgYmUgZnVuY3Rpb24nICk7XHJcblxyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0Lm9rKCB0eXBlb2YgVmFsaWRhdGlvbi5nZXRWYWxpZGF0b3JWYWxpZGF0aW9uRXJyb3IoIHtcclxuICAgIHZhbHVlVHlwZTogQXJyYXksXHJcbiAgICB2YWxpZFZhbHVlczogWyAnaGknIF1cclxuXHJcbiAgfSApID09PSAnc3RyaW5nJywgJ3ZhbGlkVmFsdWVzIGNvbnRhaW5zIGludmFsaWQgdmFsdWUnICk7XHJcblxyXG4gIGFzc2VydC5vayggIVZhbGlkYXRpb24uZ2V0VmFsaWRhdG9yVmFsaWRhdGlvbkVycm9yKCB7IHZhbHVlVHlwZTogJ251bWJlcicgfSApLCAnZ29vZCB2YWx1ZVR5cGUnICk7XHJcblxyXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICBhc3NlcnQub2soIFZhbGlkYXRpb24uZ2V0VmFsaWRhdG9yVmFsaWRhdGlvbkVycm9yKCB7IHZhbGlkVmFsdWU6ICdudW1iZXInIH0gKSwgJ25vIHZhbGlkYXRvciBrZXlzIHN1cHBsaWVkJyApO1xyXG5cclxuICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmdldFZhbGlkYXRvclZhbGlkYXRpb25FcnJvciggeyB2YWxpZFZhbHVlOiA0IH0gKSwgJ25vIHZhbGlkYXRvciBrZXlzIHN1cHBsaWVkJyApO1xyXG4gIGFzc2VydC5vayggVmFsaWRhdGlvbi5nZXRWYWxpZGF0b3JWYWxpZGF0aW9uRXJyb3IoIHsgdmFsdWVUeXBlOiAnYmxhcmFkeXNoYXJhZHknIH0gKSwgJ2ludmFsaWQgdmFsdWVUeXBlIHN0cmluZycgKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCAhVmFsaWRhdGlvbi5nZXRWYWxpZGF0b3JWYWxpZGF0aW9uRXJyb3IoIHsgaXNWYWxpZFZhbHVlOiAoKSA9PiB0cnVlIH0gKSwgJ2lzVmFsaWRWYWx1ZSBpcyBhIGZ1bmN0aW9uJyApO1xyXG5cclxuICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmdldFZhbGlkYXRvclZhbGlkYXRpb25FcnJvciggeyBpc1ZhbGlkVmFsdWU6ICdoaScgfSApLCAnaXNWYWxpZFZhbHVlIHNob3VsZCBub3QgYmUgc3RyaW5nJyApO1xyXG5cclxuICBhc3NlcnQub2soICFWYWxpZGF0aW9uLmdldFZhbGlkYXRvclZhbGlkYXRpb25FcnJvciggeyB2YWx1ZVR5cGU6IG51bGwgfSApLCAnbnVsbCBpcyB2YWxpZCcgKTtcclxuICBhc3NlcnQub2soICFWYWxpZGF0aW9uLmdldFZhbGlkYXRvclZhbGlkYXRpb25FcnJvciggeyB2YWx1ZVR5cGU6IFsgJ251bWJlcicsIG51bGwgXSB9ICksXHJcbiAgICAnYXJyYXkgb2YgbnVsbCBhbmQgbnVtYmVyIGlzIHZhbGlkJyApO1xyXG4gIGFzc2VydC5vayggIVZhbGlkYXRpb24uZ2V0VmFsaWRhdG9yVmFsaWRhdGlvbkVycm9yKCB7IHZhbHVlVHlwZTogWyAnbnVtYmVyJywgbnVsbCwgTm9kZSBdIH0gKSxcclxuICAgICdhcnJheSBvZiBudWxsIGFuZCBudW1iZXIgaXMgdmFsaWQnICk7XHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmdldFZhbGlkYXRvclZhbGlkYXRpb25FcnJvciggeyB2YWx1ZVR5cGU6IFsgJ251bWJlcmYnLCBudWxsLCBOb2RlIF0gfSApLFxyXG4gICAgJ251bWJlcmYgaXMgbm90IGEgdmFsaWQgdmFsdWVUeXBlJyApO1xyXG5cclxuICBhc3NlcnQub2soICFWYWxpZGF0aW9uLmlzVmFsdWVWYWxpZCggdW5kZWZpbmVkLCB7IHZhbHVlVHlwZTogWyAnbnVtYmVyJywgJ3NzdHJpbmcnIF0gfSApLFxyXG4gICAgJ3NzdHJpbmcgaXMgbm90IGEgdmFsaWQgdmFsdWVUeXBlJyApO1xyXG5cclxuICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgYXNzZXJ0Lm9rKCAhVmFsaWRhdGlvbi5pc1ZhbHVlVmFsaWQoIHVuZGVmaW5lZCwgeyB2YWx1ZVR5cGU6IFsgNyBdIH0sIEFTU0VSVElPTlNfVFJVRSApLFxyXG4gICAgJzcgaXMgbm90IGEgdmFsaWQgdmFsdWVUeXBlJyApO1xyXG5cclxuICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgYXNzZXJ0Lm9rKCAhVmFsaWRhdGlvbi5pc1ZhbHVlVmFsaWQoIHVuZGVmaW5lZCwgeyB2YWx1ZVR5cGU6IFsgJ251bWJlcicsIHt9IF0gfSwgQVNTRVJUSU9OU19UUlVFICksXHJcbiAgICAnT2JqZWN0IGxpdGVyYWwgIGlzIG5vdCBhIHZhbGlkIHZhbHVlVHlwZScgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ1Rlc3QgdmFsdWVUeXBlOiB7QXJyYXkuPG51bWJlcnxudWxsfHN0cmluZ3xmdW5jdGlvbnxFbnVtZXJhdGlvbkRlcHJlY2F0ZWQ+fScsIGFzc2VydCA9PiB7XHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmlzVmFsdWVWYWxpZCggbnVsbCwgeyB2YWx1ZVR5cGU6IG51bGwgfSApLCAnbnVsbCBpcyB2YWxpZCcgKTtcclxuICBhc3NlcnQub2soIFZhbGlkYXRpb24uaXNWYWx1ZVZhbGlkKCA3LCB7IHZhbHVlVHlwZTogWyAnbnVtYmVyJywgbnVsbCBdIH0gKSwgJzcgaXMgdmFsaWQgZm9yIG51bGwgYW5kIG51bWJlcicgKTtcclxuICBhc3NlcnQub2soIFZhbGlkYXRpb24uaXNWYWx1ZVZhbGlkKCBudWxsLCB7IHZhbHVlVHlwZTogWyAnbnVtYmVyJywgbnVsbCBdIH0gKSxcclxuICAgICdudWxsIGlzIHZhbGlkIGZvciBudWxsIGFuZCBudW1iZXInICk7XHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmlzVmFsdWVWYWxpZCggbmV3IE5vZGUoKSwgeyB2YWx1ZVR5cGU6IFsgJ251bWJlcicsIG51bGwsIE5vZGUgXSB9ICksICdOb2RlIGlzIHZhbGlkJyApO1xyXG4gIGFzc2VydC5vayggVmFsaWRhdGlvbi5pc1ZhbHVlVmFsaWQoIEVudW1lcmF0aW9uRGVwcmVjYXRlZC5ieUtleXMoIFsgJ1JPQklOJywgJ0pBWScsICdXUkVOJyBdICksIHtcclxuICAgIHZhbHVlVHlwZTogWyBFbnVtZXJhdGlvbkRlcHJlY2F0ZWQsIG51bGwsIE5vZGUgXVxyXG4gIH0gKSwgJ05vZGUgaXMgdmFsaWQnICk7XHJcbiAgYXNzZXJ0Lm9rKCAhVmFsaWRhdGlvbi5pc1ZhbHVlVmFsaWQoICdoZWxsbycsIHsgdmFsdWVUeXBlOiBbICdudW1iZXInLCBudWxsLCBOb2RlIF0gfSApLCAnc3RyaW5nIG5vdCB2YWxpZCcgKTtcclxuXHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB2YWxpZGF0ZSggdHJ1ZSwgeyB2YWx1ZVR5cGU6IFsgJ251bWJlcicsICdzdHJpbmcnIF0gfSApLFxyXG4gICAgJ251bWJlciBhbmQgc3RyaW5nIGRvIG5vdCB2YWxpZGF0ZSBib29sZWFuJyApO1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4gdmFsaWRhdGUoIG51bGwsIHsgdmFsdWVUeXBlOiBbICdudW1iZXInLCAnc3RyaW5nJyBdIH0gKSxcclxuICAgICdudW1iZXIgYW5kIHN0cmluZyBkbyBub3QgdmFsaWRhdGUgbnVsbCcgKTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHZhbGlkYXRlKCB1bmRlZmluZWQsIHsgdmFsdWVUeXBlOiBbICdudW1iZXInLCAnc3RyaW5nJyBdIH0gKSxcclxuICAgICdudW1iZXIgYW5kIHN0cmluZyBkbyBub3QgdmFsaWRhdGUgdW5kZWZpbmVkJyApO1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4gdmFsaWRhdGUoIF8ubm9vcCwgeyB2YWx1ZVR5cGU6IFsgJ251bWJlcicsICdzdHJpbmcnIF0gfSApLFxyXG4gICAgJ251bWJlciBhbmQgc3RyaW5nIGRvIG5vdCB2YWxpZGF0ZSB1bmRlZmluZWQnICk7XHJcblxyXG4gIGNvbnN0IEJpcmRzID0gRW51bWVyYXRpb25EZXByZWNhdGVkLmJ5S2V5cyggWyAnUk9CSU4nLCAnSkFZJywgJ1dSRU4nIF0gKTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHZhbGlkYXRlKCBfLm5vb3AsIHsgdmFsdWVUeXBlOiBbIEJpcmRzLCAnc3RyaW5nJyBdIH0gKSxcclxuICAgICdudW1iZXIgYW5kIHN0cmluZyBkbyBub3QgdmFsaWRhdGUgdW5kZWZpbmVkJyApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnVGVzdCB2YWx1ZVR5cGU6IHtFbnVtZXJhdGlvbkRlcHJlY2F0ZWR9JywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgY29uc3QgQmlyZHMgPSBFbnVtZXJhdGlvbkRlcHJlY2F0ZWQuYnlLZXlzKCBbICdST0JJTicsICdKQVknLCAnV1JFTicgXSApO1xyXG4gIGFzc2VydC5vayggIVZhbGlkYXRpb24uZ2V0VmFsaWRhdG9yVmFsaWRhdGlvbkVycm9yKCB7IHZhbHVlVHlwZTogQmlyZHMgfSApLCAnZ29vZCB2YWx1ZVR5cGUnICk7XHJcblxyXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICBhc3NlcnQub2soIFZhbGlkYXRpb24uaXNWYWx1ZVZhbGlkKCBCaXJkcy5ST0JJTiwgeyB2YWx1ZVR5cGU6IEJpcmRzIH0gKSwgJ2dvb2QgdmFsdWUnICk7XHJcbiAgYXNzZXJ0Lm9rKCAhVmFsaWRhdGlvbi5pc1ZhbHVlVmFsaWQoIDQsIHsgdmFsdWVUeXBlOiBCaXJkcyB9ICksICdiYWQgdmFsdWUnICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdUZXN0IHBoZXRpb1R5cGUnLCBhc3NlcnQgPT4ge1xyXG5cclxuICAvLyBTdHViIHBoZXRpb1R5cGUgaGVyZSBmb3IgdGVzdGluZy4gdHMtZXhwZWN0LWVycm9ycyBtYXkgYmUgYWJsZSB0byBiZSByZW1vdmVkIHdoZW4gSU9UeXBlIGlzIGluIHR5cGVzY3JpcHQuXHJcbiAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gIGFzc2VydC5vayggIVZhbGlkYXRpb24uZ2V0VmFsaWRhdG9yVmFsaWRhdGlvbkVycm9yKCB7IHBoZXRpb1R5cGU6IHsgdmFsaWRhdG9yOiB7IHZhbHVlVHlwZTogJ251bWJlcicgfSB9IH0gKSxcclxuICAgICdnb29kIHBoZXRpb1R5cGUnICk7XHJcbiAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gIGFzc2VydC5vayggIVZhbGlkYXRpb24uZ2V0VmFsaWRhdG9yVmFsaWRhdGlvbkVycm9yKCB7IHBoZXRpb1R5cGU6IHsgdmFsaWRhdG9yOiB7IGlzVmFsaWRWYWx1ZTogKCkgPT4gdHJ1ZSB9IH0gfSApLFxyXG4gICAgJ2dvb2QgcGhldGlvVHlwZScgKTtcclxuICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmdldFZhbGlkYXRvclZhbGlkYXRpb25FcnJvciggeyBwaGV0aW9UeXBlOiB7IG5vdFZhbGlkYXRvcjogeyBpc1ZhbGlkVmFsdWU6ICgpID0+IHRydWUgfSB9IH0gKSxcclxuICAgICdiYWQgcGhldGlvVHlwZScgKTtcclxuICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmdldFZhbGlkYXRvclZhbGlkYXRpb25FcnJvciggeyBwaGV0aW9UeXBlOiB7IHZhbGlkYXRvcjogeyBpc1ZhbGlkVmFsdWU6ICdudW1iZXInIH0gfSB9ICksXHJcbiAgICAnYmFkIHBoZXRpb1R5cGUnICk7XHJcbiAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gIGFzc2VydC5vayggVmFsaWRhdGlvbi5nZXRWYWxpZGF0b3JWYWxpZGF0aW9uRXJyb3IoIHsgcGhldGlvVHlwZTogeyB2YWxpZGF0b3I6IHt9IH0gfSApLCAnYmFkIHBoZXRpb1R5cGUnICk7XHJcbiAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gIGFzc2VydC5vayggVmFsaWRhdGlvbi5nZXRWYWxpZGF0b3JWYWxpZGF0aW9uRXJyb3IoIHsgcGhldGlvVHlwZTogeyB2YWxpZGF0b3I6IG51bGwgfSB9ICksICdiYWQgcGhldGlvVHlwZScgKTtcclxuICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmdldFZhbGlkYXRvclZhbGlkYXRpb25FcnJvciggeyBwaGV0aW9UeXBlOiAnbnVsbCcgfSApLCAnYmFkIHBoZXRpb1R5cGUnICk7XHJcbiAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gIGFzc2VydC5vayggVmFsaWRhdGlvbi5nZXRWYWxpZGF0b3JWYWxpZGF0aW9uRXJyb3IoIHsgcGhldGlvVHlwZTogbnVsbCB9ICksICdiYWQgcGhldGlvVHlwZScgKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmlzVmFsdWVWYWxpZCggJ2hlbGxvJywgeyBwaGV0aW9UeXBlOiBTdHJpbmdJTyB9ICksICdzdHJpbmcgdmFsaWQnICk7XHJcbiAgYXNzZXJ0Lm9rKCAhVmFsaWRhdGlvbi5pc1ZhbHVlVmFsaWQoIG51bGwsIHsgcGhldGlvVHlwZTogU3RyaW5nSU8gfSApLCAnbnVsbCBub3QgdmFsaWQnICk7XHJcbiAgYXNzZXJ0Lm9rKCAhVmFsaWRhdGlvbi5pc1ZhbHVlVmFsaWQoIHVuZGVmaW5lZCwgeyBwaGV0aW9UeXBlOiBTdHJpbmdJTyB9ICksICd1bmRlZmluZWQgbm90IHZhbGlkJyApO1xyXG4gIGFzc2VydC5vayggVmFsaWRhdGlvbi5pc1ZhbHVlVmFsaWQoICdvaCBoaScsIHsgcGhldGlvVHlwZTogU3RyaW5nSU8gfSApLCAnc3RyaW5nIHZhbGlkJyApO1xyXG4gIGFzc2VydC5vayggVmFsaWRhdGlvbi5pc1ZhbHVlVmFsaWQoICdvaCBubycsIHtcclxuICAgIHBoZXRpb1R5cGU6IFN0cmluZ0lPLFxyXG4gICAgaXNWYWxpZFZhbHVlOiB2ID0+IHYuc3RhcnRzV2l0aCggJ28nIClcclxuICB9ICksICdzdHJpbmcgdmFsaWQnICk7XHJcbiAgYXNzZXJ0Lm9rKCAhVmFsaWRhdGlvbi5pc1ZhbHVlVmFsaWQoICdobyBvbicsIHtcclxuICAgIHBoZXRpb1R5cGU6IFN0cmluZ0lPLFxyXG4gICAgaXNWYWxpZFZhbHVlOiB2ID0+IHYuc3RhcnRzV2l0aCggJ28nIClcclxuICB9ICksICdzdHJpbmcgbm90IHZhbGlkJyApO1xyXG5cclxuICBhc3NlcnQub2soIFZhbGlkYXRpb24uaXNWYWx1ZVZhbGlkKCBuZXcgRW1pdHRlcigpLCB7IHBoZXRpb1R5cGU6IEVtaXR0ZXIuRW1pdHRlcklPKCBbXSApIH0gKSxcclxuICAgICdlbWl0dGVyIGlzIHZhbGlkJyApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAndmFsaWRhdGlvbk1lc3NhZ2UgaXMgcHJlc2VudGVkIGZvciBhbGwgdmFsaWRhdGlvbiBlcnJvcnMnLCBhc3NlcnQgPT4ge1xyXG5cclxuICBjb25zdCB0ZXN0Q29udGFpbnNFcnJvck1lc3NhZ2UgPSAoIHZhbHVlOiBudW1iZXIgfCBib29sZWFuIHwgc3RyaW5nIHwgbnVtYmVyW10gfCBBcnJheTxudW1iZXIgfCBib29sZWFuIHwgc3RyaW5nPixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvcjogVmFsaWRhdG9yLCB2YWxpZGF0aW9uTWVzc2FnZSA9IHZhbGlkYXRvci52YWxpZGF0aW9uTWVzc2FnZSApID0+IHtcclxuICAgIGNvbnN0IG1lc3NhZ2UgPSB0eXBlb2YgdmFsaWRhdGlvbk1lc3NhZ2UgPT09ICdmdW5jdGlvbicgPyB2YWxpZGF0aW9uTWVzc2FnZSgpIDogdmFsaWRhdGlvbk1lc3NhZ2U7XHJcbiAgICBhc3NlcnQub2soIG1lc3NhZ2UsICdzaG91bGQgaGF2ZSBhIG1lc3NhZ2UnICk7XHJcbiAgICBjb25zdCB2YWxpZGF0aW9uRXJyb3IgPSBWYWxpZGF0aW9uLmdldFZhbGlkYXRpb25FcnJvciggdmFsdWUsIHZhbGlkYXRvciApO1xyXG4gICAgYXNzZXJ0Lm9rKCB2YWxpZGF0aW9uRXJyb3IgJiYgdmFsaWRhdGlvbkVycm9yLmluY2x1ZGVzKCBtZXNzYWdlISApLCBtZXNzYWdlICk7XHJcbiAgfTtcclxuXHJcbiAgdGVzdENvbnRhaW5zRXJyb3JNZXNzYWdlKCA1LCB7IHZhbHVlVHlwZTogJ2Jvb2xlYW4nLCB2YWxpZGF0aW9uTWVzc2FnZTogJ3ZhbHVlVHlwZSBib29sZWFuLCB2YWx1ZSBudW1iZXInIH0gKTtcclxuICB0ZXN0Q29udGFpbnNFcnJvck1lc3NhZ2UoIHRydWUsIHsgdmFsdWVUeXBlOiAnbnVtYmVyJywgdmFsaWRhdGlvbk1lc3NhZ2U6ICd2YWx1ZVR5cGUgbnVtYmVyLCB2YWx1ZSBib29sZWFuJyB9ICk7XHJcbiAgdGVzdENvbnRhaW5zRXJyb3JNZXNzYWdlKCB0cnVlLCB7IHZhbHVlVHlwZTogWyAnc3RyaW5nJywgJ251bWJlcicgXSwgdmFsaWRhdGlvbk1lc3NhZ2U6ICd2YWx1ZVR5cGUgc3RyaW5nYCxudW1iZXIgdmFsdWUgYm9vbGVhbicgfSApO1xyXG4gIHRlc3RDb250YWluc0Vycm9yTWVzc2FnZSggdHJ1ZSwgeyB2YWx1ZVR5cGU6IFsgbnVsbCwgJ251bWJlcicgXSwgdmFsaWRhdGlvbk1lc3NhZ2U6ICd2YWx1ZVR5cGUgbnVsbCxudW1iZXIgdmFsdWUgYm9vbGVhbicgfSApO1xyXG4gIHRlc3RDb250YWluc0Vycm9yTWVzc2FnZSggZmFsc2UsIHsgdmFsaWRWYWx1ZXM6IFsgJ2hpJywgdHJ1ZSBdLCB2YWxpZGF0aW9uTWVzc2FnZTogJ3ZhbGlkVmFsdWVzIHdpdGggdmFsdWU6ZmFsc2UnIH0gKTtcclxuICB0ZXN0Q29udGFpbnNFcnJvck1lc3NhZ2UoIDUsIHsgdmFsaWRWYWx1ZXM6IFsgJ2hpJywgdHJ1ZSBdLCB2YWxpZGF0aW9uTWVzc2FnZTogJ3ZhbGlkVmFsdWVzIHdpdGggdmFsdWU6NScgfSApO1xyXG4gIHRlc3RDb250YWluc0Vycm9yTWVzc2FnZSggNCwgeyBpc1ZhbGlkVmFsdWU6IHYgPT4gdiA9PT0gMywgdmFsaWRhdGlvbk1lc3NhZ2U6ICdpc1ZhbGlkVmFsdWUgMywgdmFsdWUgNCcgfSApO1xyXG4gIHRlc3RDb250YWluc0Vycm9yTWVzc2FnZSggNCwgeyBpc1ZhbGlkVmFsdWU6IHYgPT4gdiA9PT0gMywgdmFsaWRhdGlvbk1lc3NhZ2U6ICgpID0+ICdpc1ZhbGlkVmFsdWUgMywgdmFsdWUgNCcgfSApO1xyXG4gIGNvbnN0IG15VmFyID0gNTtcclxuICB0ZXN0Q29udGFpbnNFcnJvck1lc3NhZ2UoIDQsIHsgaXNWYWxpZFZhbHVlOiB2ID0+IHYgPT09IG15VmFyLCB2YWxpZGF0aW9uTWVzc2FnZTogKCkgPT4gYGlzVmFsaWRWYWx1ZSAke215VmFyfSwgdmFsdWUgNGAgfSApO1xyXG4gIHRlc3RDb250YWluc0Vycm9yTWVzc2FnZSggJ29oIGhlbGxvJywgeyBwaGV0aW9UeXBlOiBQcm9wZXJ0eS5Qcm9wZXJ0eUlPKCBCb29sZWFuSU8gKSwgdmFsaWRhdGlvbk1lc3NhZ2U6ICdpc1ZhbGlkVmFsdWUgMywgdmFsdWUgc3RyaW5nJyB9ICk7XHJcblxyXG4gIGNvbnN0IGlvVHlwZSA9IG5ldyBJT1R5cGUoICdUZXN0SU8nLCB7IHZhbHVlVHlwZTogJ2Jvb2xlYW4nIH0gKTtcclxuICBjb25zdCBpb1R5cGVWYWxpZGF0aW9uTWVzc2FnZSA9ICdzaG91bGQgYmUgYSBib29sZWFuIGZyb20gdGhpcyBJT1R5cGUgaW4gdGVzdHMnO1xyXG5cclxuICBpb1R5cGUudmFsaWRhdG9yLnZhbGlkYXRpb25NZXNzYWdlID0gaW9UeXBlVmFsaWRhdGlvbk1lc3NhZ2U7XHJcbiAgdGVzdENvbnRhaW5zRXJyb3JNZXNzYWdlKCAnaGknLCB7IHBoZXRpb1R5cGU6IGlvVHlwZSB9LCBpb1R5cGVWYWxpZGF0aW9uTWVzc2FnZSApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAndGVzdCBWYWxpZGF0b3IudmFsaWRhdG9ycycsIGFzc2VydCA9PiB7XHJcblxyXG4gIGFzc2VydC5vayggIVZhbGlkYXRpb24uZ2V0VmFsaWRhdG9yVmFsaWRhdGlvbkVycm9yKCB7IHZhbGlkYXRvcnM6IFsgeyB2YWx1ZVR5cGU6ICdib29sZWFuJyB9LCB7IGlzVmFsaWRWYWx1ZTogdiA9PiB2ID09PSBmYWxzZSB9IF0gfSApLCAnY29ycmVjdCB2YWxpZGF0b3InICk7XHJcblxyXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICBhc3NlcnQub2soIFZhbGlkYXRpb24uZ2V0VmFsaWRhdG9yVmFsaWRhdGlvbkVycm9yKCB7IHZhbGlkYXRvcnM6IFsgeyB2YWx1ZVR5cGU6ICdib29sZWFuJyB9LCB7IGlzVmFsaWRWYWx1ZTogNyB9IF0gfSApLCAnaW5jb3JyZWN0IHZhbGlkYXRvcicgKTtcclxuXHJcbiAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gIGFzc2VydC5vayggVmFsaWRhdGlvbi5nZXRWYWxpZGF0b3JWYWxpZGF0aW9uRXJyb3IoIHsgdmFsaWRhdG9yczogWyB7IHZhbHVlVHlwZTogJ2Jvb2xlYW4nIH0sIDcgXSB9ICksICdpbmNvcnJlY3QgdmFsaWRhdG9yMicgKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmdldFZhbGlkYXRpb25FcnJvciggJzcnLCB7IHZhbGlkYXRvcnM6IFsgeyB2YWx1ZVR5cGU6ICdib29sZWFuJyB9LCB7IGlzVmFsaWRWYWx1ZTogdiA9PiB2ID09PSBmYWxzZSB9IF0gfSApICk7XHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmdldFZhbGlkYXRpb25FcnJvciggdHJ1ZSwgeyB2YWxpZGF0b3JzOiBbIHsgdmFsdWVUeXBlOiAnYm9vbGVhbicgfSwgeyBpc1ZhbGlkVmFsdWU6IHYgPT4gdiA9PT0gZmFsc2UgfSBdIH0gKSApO1xyXG4gIGFzc2VydC5vayggVmFsaWRhdGlvbi5nZXRWYWxpZGF0aW9uRXJyb3IoIHVuZGVmaW5lZCwgeyB2YWxpZGF0b3JzOiBbIHsgdmFsdWVUeXBlOiAnYm9vbGVhbicgfSwgeyBpc1ZhbGlkVmFsdWU6IHYgPT4gdiA9PT0gZmFsc2UgfSBdIH0gKSApO1xyXG4gIGFzc2VydC5vayggIVZhbGlkYXRpb24uZ2V0VmFsaWRhdGlvbkVycm9yKCBmYWxzZSwgeyB2YWxpZGF0b3JzOiBbIHsgdmFsdWVUeXBlOiAnYm9vbGVhbicgfSwgeyBpc1ZhbGlkVmFsdWU6IHYgPT4gdiA9PT0gZmFsc2UgfSBdIH0gKSApO1xyXG59ICk7XHJcblxyXG4vLyBTZWUgc2ltaWxhciB0ZXN0cyBpbiBUaW55UHJvcGVydHkgZm9yIHZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5XHJcblFVbml0LnRlc3QoICdWYWxpZGF0b3IuZXF1YWxzRm9yVmFsaWRhdGlvblN0cmF0ZWd5JywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmVxdWFsc0ZvclZhbGlkYXRpb25TdHJhdGVneSggMSwgMSwgJ3JlZmVyZW5jZScgKSApO1xyXG4gIGFzc2VydC5vayggVmFsaWRhdGlvbi5lcXVhbHNGb3JWYWxpZGF0aW9uU3RyYXRlZ3koIDEsIDEgKSApO1xyXG4gIGFzc2VydC5vayggIVZhbGlkYXRpb24uZXF1YWxzRm9yVmFsaWRhdGlvblN0cmF0ZWd5PEludGVudGlvbmFsQW55PiggMSwgJzEnICkgKTtcclxuICBjb25zdCBvYmplY3QgPSB7fTtcclxuICBhc3NlcnQub2soICFWYWxpZGF0aW9uLmVxdWFsc0ZvclZhbGlkYXRpb25TdHJhdGVneTxJbnRlbnRpb25hbEFueT4oIG9iamVjdCwge30sICdyZWZlcmVuY2UnICkgKTtcclxuICBhc3NlcnQub2soIFZhbGlkYXRpb24uZXF1YWxzRm9yVmFsaWRhdGlvblN0cmF0ZWd5PEludGVudGlvbmFsQW55Piggb2JqZWN0LCBvYmplY3QsICdyZWZlcmVuY2UnICkgKTtcclxuICBhc3NlcnQub2soIFZhbGlkYXRpb24uZXF1YWxzRm9yVmFsaWRhdGlvblN0cmF0ZWd5PEludGVudGlvbmFsQW55Pigge30sIHt9LCAoIGEsIGIgKSA9PiAoIGEgaW5zdGFuY2VvZiBPYmplY3QgJiYgYiBpbnN0YW5jZW9mIE9iamVjdCApICkgKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmVxdWFsc0ZvclZhbGlkYXRpb25TdHJhdGVneSggbmV3IFZlY3RvcjIoIDAsIDAgKSwgbmV3IFZlY3RvcjIoIDAsIDAgKSwgJ2VxdWFsc0Z1bmN0aW9uJyApICk7XHJcblxyXG4gIGFzc2VydC5vayggVmFsaWRhdGlvbi5lcXVhbHNGb3JWYWxpZGF0aW9uU3RyYXRlZ3koIG5ldyBWZWN0b3IyKCAwLCAwICksIFZlY3RvcjIuWkVSTywgJ2VxdWFsc0Z1bmN0aW9uJyApICk7XHJcbiAgYXNzZXJ0Lm9rKCAhVmFsaWRhdGlvbi5lcXVhbHNGb3JWYWxpZGF0aW9uU3RyYXRlZ3koIG5ldyBWZWN0b3IyKCAwLCAxICksIG5ldyBWZWN0b3IyKCAwLCAwICksICdlcXVhbHNGdW5jdGlvbicgKSApO1xyXG5cclxuICBhc3NlcnQub2soIFZhbGlkYXRpb24uZXF1YWxzRm9yVmFsaWRhdGlvblN0cmF0ZWd5KCBuZXcgVmVjdG9yMiggMCwgMSApLCBuZXcgVmVjdG9yMiggMCwgMyApLCAoIGEsIGIgKSA9PiBhLnggPT09IGIueCApICk7XHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmVxdWFsc0ZvclZhbGlkYXRpb25TdHJhdGVneTxJbnRlbnRpb25hbEFueT4oIG5ldyBWZWN0b3IyKCAwLCAxICksIG5ldyBWZWN0b3IzKCAwLCA0LCAzICksICgpID0+IHRydWUgKSApO1xyXG5cclxuICBhc3NlcnQub2soIFZhbGlkYXRpb24uZXF1YWxzRm9yVmFsaWRhdGlvblN0cmF0ZWd5KCB7fSwge30sICdsb2Rhc2hEZWVwJyApICk7XHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmVxdWFsc0ZvclZhbGlkYXRpb25TdHJhdGVneSggeyBoaTogdHJ1ZSB9LCB7IGhpOiB0cnVlIH0sICdsb2Rhc2hEZWVwJyApICk7XHJcbiAgYXNzZXJ0Lm9rKCAhVmFsaWRhdGlvbi5lcXVhbHNGb3JWYWxpZGF0aW9uU3RyYXRlZ3koIHsgaGk6IHRydWUgfSwgeyBoaTogdHJ1ZSwgb3RoZXI6IGZhbHNlIH0sICdsb2Rhc2hEZWVwJyApICk7XHJcbn0gKTtcclxuXHJcblxyXG4vLyBTZWUgc2ltaWxhciB0ZXN0cyBpbiBUaW55UHJvcGVydHkgZm9yIHZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5XHJcblFVbml0LnRlc3QoICdlcXVhbHNGdW5jdGlvbiBxdWlya3MnLCBhc3NlcnQgPT4ge1xyXG5cclxuICAvLyBESUZGRVJFTlQgQ09OU1RSVUNUT1JTXHJcbiAgY2xhc3MgTXlOdW1iZXIge1xyXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKCBwdWJsaWMgcmVhZG9ubHkgdmFsdWU6IG51bWJlciApIHt9XHJcblxyXG4gICAgcHVibGljIGVxdWFscyggb3RoZXI6IHsgdmFsdWU6IG51bWJlciB9ICk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy52YWx1ZSA9PT0gb3RoZXIudmFsdWU7fVxyXG4gIH1cclxuXHJcbiAgY2xhc3MgTXlOdW1iZXJFcXVhbHNXaGVuU2FtZVNpZGVPZjUge1xyXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKCBwdWJsaWMgcmVhZG9ubHkgdmFsdWU6IG51bWJlciApIHt9XHJcblxyXG4gICAgLy8gSWYgYm90aCBhcmUgZ3JlYXRlciB0aGFuIG9yIGJvdGggYXJlIGxlc3MgdGhhbiA1LiBVbmVxdWFsIGlmIGRpZmZlcmVudC4gRXF1YWxzIDUgaXMgdHJlYXRlZCBhcyBsZXNzIHRoYW4uXHJcbiAgICBwdWJsaWMgZXF1YWxzKCBvdGhlcjogeyB2YWx1ZTogbnVtYmVyIH0gKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLnZhbHVlID4gNSA9PT0gb3RoZXIudmFsdWUgPiA1O31cclxuICB9XHJcblxyXG4gIGFzc2VydC5vayggVmFsaWRhdGlvbi5lcXVhbHNGb3JWYWxpZGF0aW9uU3RyYXRlZ3k8SW50ZW50aW9uYWxBbnk+KCBuZXcgTXlOdW1iZXIoIDEgKSwgbmV3IE15TnVtYmVyKCAxICksICdlcXVhbHNGdW5jdGlvbicgKSApO1xyXG4gIGFzc2VydC5vayggIVZhbGlkYXRpb24uZXF1YWxzRm9yVmFsaWRhdGlvblN0cmF0ZWd5PEludGVudGlvbmFsQW55PiggbmV3IE15TnVtYmVyKCAyICksIG5ldyBNeU51bWJlciggMSApLCAnZXF1YWxzRnVuY3Rpb24nICkgKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBWYWxpZGF0aW9uLmVxdWFsc0ZvclZhbGlkYXRpb25TdHJhdGVneTxJbnRlbnRpb25hbEFueT4oXHJcbiAgICBuZXcgTXlOdW1iZXIoIDEgKSxcclxuICAgIG5ldyBNeU51bWJlckVxdWFsc1doZW5TYW1lU2lkZU9mNSggMSApLFxyXG4gICAgJ2VxdWFsc0Z1bmN0aW9uJyApICk7XHJcblxyXG4gIGFzc2VydC5vayggVmFsaWRhdGlvbi5lcXVhbHNGb3JWYWxpZGF0aW9uU3RyYXRlZ3k8SW50ZW50aW9uYWxBbnk+KFxyXG4gICAgbmV3IE15TnVtYmVyRXF1YWxzV2hlblNhbWVTaWRlT2Y1KCA2ICksXHJcbiAgICBuZXcgTXlOdW1iZXJFcXVhbHNXaGVuU2FtZVNpZGVPZjUoIDcgKSxcclxuICAgICdlcXVhbHNGdW5jdGlvbicgKSApO1xyXG5cclxuICBhc3NlcnQub2soICFWYWxpZGF0aW9uLmVxdWFsc0ZvclZhbGlkYXRpb25TdHJhdGVneTxJbnRlbnRpb25hbEFueT4oXHJcbiAgICBuZXcgTXlOdW1iZXJFcXVhbHNXaGVuU2FtZVNpZGVPZjUoIDMgKSxcclxuICAgIG5ldyBNeU51bWJlckVxdWFsc1doZW5TYW1lU2lkZU9mNSggNyApLFxyXG4gICAgJ2VxdWFsc0Z1bmN0aW9uJyApICk7XHJcblxyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4gIVZhbGlkYXRpb24uZXF1YWxzRm9yVmFsaWRhdGlvblN0cmF0ZWd5PEludGVudGlvbmFsQW55PihcclxuICAgIG5ldyBNeU51bWJlciggNiApLFxyXG4gICAgbmV3IE15TnVtYmVyRXF1YWxzV2hlblNhbWVTaWRlT2Y1KCA3ICksXHJcbiAgICAnZXF1YWxzRnVuY3Rpb24nICkgKTtcclxuXHJcbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAvLyBTVVBQT1JUIE5VTEwgQU5EIFVOREVGSU5FRFxyXG4gIGFzc2VydC5vayggVmFsaWRhdGlvbi5lcXVhbHNGb3JWYWxpZGF0aW9uU3RyYXRlZ3k8SW50ZW50aW9uYWxBbnk+KCBudWxsLCBudWxsLCAnZXF1YWxzRnVuY3Rpb24nICkgKTtcclxuICBhc3NlcnQub2soICFWYWxpZGF0aW9uLmVxdWFsc0ZvclZhbGlkYXRpb25TdHJhdGVneTxJbnRlbnRpb25hbEFueT4oIG51bGwsIHVuZGVmaW5lZCwgJ2VxdWFsc0Z1bmN0aW9uJyApICk7XHJcbiAgYXNzZXJ0Lm9rKCAhVmFsaWRhdGlvbi5lcXVhbHNGb3JWYWxpZGF0aW9uU3RyYXRlZ3k8SW50ZW50aW9uYWxBbnk+KCBudWxsLCBuZXcgTXlOdW1iZXIoIDMgKSwgJ2VxdWFsc0Z1bmN0aW9uJyApICk7XHJcbiAgYXNzZXJ0Lm9rKCAhVmFsaWRhdGlvbi5lcXVhbHNGb3JWYWxpZGF0aW9uU3RyYXRlZ3k8SW50ZW50aW9uYWxBbnk+KCB1bmRlZmluZWQsIG5ldyBNeU51bWJlciggMyApLCAnZXF1YWxzRnVuY3Rpb24nICkgKTtcclxuICBhc3NlcnQub2soICFWYWxpZGF0aW9uLmVxdWFsc0ZvclZhbGlkYXRpb25TdHJhdGVneTxJbnRlbnRpb25hbEFueT4oIG5ldyBNeU51bWJlciggMyApLCBudWxsLCAnZXF1YWxzRnVuY3Rpb24nICkgKTtcclxuICBhc3NlcnQub2soICFWYWxpZGF0aW9uLmVxdWFsc0ZvclZhbGlkYXRpb25TdHJhdGVneTxJbnRlbnRpb25hbEFueT4oIG5ldyBNeU51bWJlciggMyApLCB1bmRlZmluZWQsICdlcXVhbHNGdW5jdGlvbicgKSApO1xyXG5cclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IFZhbGlkYXRpb24uZXF1YWxzRm9yVmFsaWRhdGlvblN0cmF0ZWd5PEludGVudGlvbmFsQW55PiggZmFsc2UsIDcsICdlcXVhbHNGdW5jdGlvbicgKSApO1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4gVmFsaWRhdGlvbi5lcXVhbHNGb3JWYWxpZGF0aW9uU3RyYXRlZ3k8SW50ZW50aW9uYWxBbnk+KCBmYWxzZSwgbmV3IE15TnVtYmVyKCAzICksICdlcXVhbHNGdW5jdGlvbicgKSApO1xyXG4gIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4gVmFsaWRhdGlvbi5lcXVhbHNGb3JWYWxpZGF0aW9uU3RyYXRlZ3k8SW50ZW50aW9uYWxBbnk+KCAnJywgbmV3IE15TnVtYmVyKCAzICksICdlcXVhbHNGdW5jdGlvbicgKSApO1xyXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdWYWxpZGF0b3IudmFsdWVDb21wYXJpc29uU3RyYXRlZ3knLCBhc3NlcnQgPT4ge1xyXG5cclxuICBjb25zdCBteVZhbHVlQXJyYXkgPSBbIDcsIDYsIDUgXTtcclxuXHJcbiAgLy8gQHRzLWV4cGVjdC1lcnJvciB3cm9uZyB2YWx1ZSBmb3IgdmFsdWVDb21wYXJpc29uU3RyYXRlZ3lcclxuICBhc3NlcnQub2soIFZhbGlkYXRpb24uZ2V0VmFsaWRhdG9yVmFsaWRhdGlvbkVycm9yKCB7IHZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5OiAncmVmZXJmZHNhZmRzZW5jZScgfSApLFxyXG4gICAgJ3RoYXQgaXMgbm90IGEgY29ycmVjdCB2YWx1ZUNvbXBhcmlzb25TdHJhdGVneScgKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCAhVmFsaWRhdGlvbi5nZXRWYWxpZGF0aW9uRXJyb3IoIG15VmFsdWVBcnJheSwge1xyXG4gICAgdmFsaWRhdG9yczogWyB7IHZhbGlkVmFsdWVzOiBbIG15VmFsdWVBcnJheSBdLCB2YWx1ZUNvbXBhcmlzb25TdHJhdGVneTogJ3JlZmVyZW5jZScgfSBdXHJcbiAgfSApICk7XHJcblxyXG4gIGFzc2VydC5vayggIVZhbGlkYXRpb24uZ2V0VmFsaWRhdGlvbkVycm9yKCBteVZhbHVlQXJyYXksIHtcclxuICAgIHZhbGlkYXRvcnM6IFsgeyB2YWxpZFZhbHVlczogWyBbIDcsIDYsIDUgXSBdLCB2YWx1ZUNvbXBhcmlzb25TdHJhdGVneTogJ2xvZGFzaERlZXAnIH0gXVxyXG4gIH0gKSApO1xyXG5cclxuICBhc3NlcnQub2soIFZhbGlkYXRpb24uZ2V0VmFsaWRhdGlvbkVycm9yKCBteVZhbHVlQXJyYXksIHtcclxuICAgIHZhbGlkYXRvcnM6IFsgeyB2YWxpZFZhbHVlczogWyBbIDcsIDYsIDUgXSBdLCB2YWx1ZUNvbXBhcmlzb25TdHJhdGVneTogJ3JlZmVyZW5jZScgfSBdXHJcbiAgfSApLCAnVGhhdCBpc25cXCd0IHRoZSBzYW1lIGFycmF5IScgKTtcclxuXHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICBWYWxpZGF0aW9uLmdldFZhbGlkYXRpb25FcnJvciggbXlWYWx1ZUFycmF5LCB7XHJcbiAgICAgIHZhbGlkYXRvcnM6IFsgeyB2YWxpZFZhbHVlczogWyBbIDcsIDYsIDUgXSBdLCB2YWx1ZUNvbXBhcmlzb25TdHJhdGVneTogJ2VxdWFsc0Z1bmN0aW9uJyB9IF1cclxuICAgIH0gKTtcclxuICB9LCAnYXJyYXlzIGRvIG5vdCBoYXZlIGFuIGVxdWFscyBmdW5jdGlvbicgKTtcclxuXHJcbiAgY29uc3Qgc2FtZUluc3RhbmNlVmVjdG9yID0gbmV3IFZlY3RvcjIoIDIsIDYgKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCAhVmFsaWRhdGlvbi5nZXRWYWxpZGF0aW9uRXJyb3IoIHNhbWVJbnN0YW5jZVZlY3Rvciwge1xyXG4gICAgdmFsaWRhdG9yczogWyB7IHZhbGlkVmFsdWVzOiBbIG5ldyBWZWN0b3IyKCAwLCAxICksIHNhbWVJbnN0YW5jZVZlY3RvciBdLCB2YWx1ZUNvbXBhcmlzb25TdHJhdGVneTogJ2VxdWFsc0Z1bmN0aW9uJyB9IF1cclxuICB9ICkgKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCAhVmFsaWRhdGlvbi5nZXRWYWxpZGF0aW9uRXJyb3IoIG5ldyBWZWN0b3IyKCAwLCAwICksIHtcclxuICAgIHZhbGlkYXRvcnM6IFsgeyB2YWxpZFZhbHVlczogWyBuZXcgVmVjdG9yMiggMCwgMSApLCBuZXcgVmVjdG9yMiggMCwgMCApIF0sIHZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5OiAnZXF1YWxzRnVuY3Rpb24nIH0gXVxyXG4gIH0gKSApO1xyXG5cclxuICBhc3NlcnQub2soIFZhbGlkYXRpb24uZ2V0VmFsaWRhdGlvbkVycm9yKCBuZXcgVmVjdG9yMiggMCwgMiApLCB7XHJcbiAgICB2YWxpZGF0b3JzOiBbIHsgdmFsaWRWYWx1ZXM6IFsgbmV3IFZlY3RvcjIoIDAsIDEgKSwgbmV3IFZlY3RvcjIoIDAsIDAgKSBdLCB2YWx1ZUNvbXBhcmlzb25TdHJhdGVneTogJ2VxdWFsc0Z1bmN0aW9uJyB9IF1cclxuICB9ICkgKTtcclxuXHJcblxyXG4gIGFzc2VydC5vayggIVZhbGlkYXRpb24uZ2V0VmFsaWRhdGlvbkVycm9yKCBzYW1lSW5zdGFuY2VWZWN0b3IsIHtcclxuICAgIHZhbGlkYXRvcnM6IFsgeyB2YWxpZFZhbHVlczogWyBuZXcgVmVjdG9yMiggMCwgMSApLCBzYW1lSW5zdGFuY2VWZWN0b3IgXSwgdmFsdWVDb21wYXJpc29uU3RyYXRlZ3k6ICggYSwgYiApID0+IGEueCA9PT0gYi54IH0gXVxyXG4gIH0gKSApO1xyXG5cclxuICBhc3NlcnQub2soICFWYWxpZGF0aW9uLmdldFZhbGlkYXRpb25FcnJvciggbmV3IFZlY3RvcjIoIDAsIDAgKSwge1xyXG4gICAgdmFsaWRhdG9yczogWyB7IHZhbGlkVmFsdWVzOiBbIG5ldyBWZWN0b3IyKCA1LCAxICksIG5ldyBWZWN0b3IyKCAwLCAzICkgXSwgdmFsdWVDb21wYXJpc29uU3RyYXRlZ3k6ICggYSwgYiApID0+IGEueCA9PT0gYi54IH0gXVxyXG4gIH0gKSApO1xyXG5cclxuICBhc3NlcnQub2soIFZhbGlkYXRpb24uZ2V0VmFsaWRhdGlvbkVycm9yKCBuZXcgVmVjdG9yMiggMCwgMCApLCB7XHJcbiAgICB2YWxpZGF0b3JzOiBbIHsgdmFsaWRWYWx1ZXM6IFsgbmV3IFZlY3RvcjIoIDEsIDEgKSwgbmV3IFZlY3RvcjIoIDIsIDAgKSBdLCB2YWx1ZUNvbXBhcmlzb25TdHJhdGVneTogKCBhLCBiICkgPT4gYS54ID09PSBiLnggfSBdXHJcbiAgfSApICk7XHJcblxyXG4gIGFzc2VydC5vayggIVZhbGlkYXRpb24uZXF1YWxzRm9yVmFsaWRhdGlvblN0cmF0ZWd5PHVua25vd24+KCBuZXcgVmVjdG9yMiggMCwgMCApLCBuZXcgVmVjdG9yMiggMCwgMCApLCAo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