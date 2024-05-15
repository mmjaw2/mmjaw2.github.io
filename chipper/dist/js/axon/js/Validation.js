// Copyright 2019-2024, University of Colorado Boulder

/**
 * The definition file for "validators" used to validate values. This file holds associated logic that validates the
 * schema of the "validator" object, as well as testing if a value adheres to the restrictions provided by a validator.
 * See validate.js for usage with assertions to check that values are valid.
 *
 * Examples:
 *
 * A Validator that only accepts number values:
 * { valueType: 'number' }
 *
 * A Validator that only accepts the numbers "2" or "3":
 * { valueType: 'number', validValues: [ 2, 3 ] }
 *
 * A Validator that accepts any Object:
 * { valueType: Object }
 *
 * A Validator that accepts EnumerationDeprecated values (NOTE! This is deprecated, use the new class-based enumeration pattern as the valueType):
 * { valueType: MyEnumeration }
 * and/or
 * { validValues: MyEnumeration.VALUES }
 *
 * A Validator that accepts a string or a number greater than 2:
 * { isValidValue: value => { typeof value === 'string' || (typeof value === 'number' && value > 2)} }
 *
 * A Validator for a number that should be an even number greater than 10
 * { valueType: 'number', validators: [ { isValidValue: v => v > 10 }, { isValidValue: v => v%2 === 0 }] }
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import EnumerationDeprecated from '../../phet-core/js/EnumerationDeprecated.js';
import optionize from '../../phet-core/js/optionize.js';
import axon from './axon.js';
const TYPEOF_STRINGS = ['string', 'number', 'boolean', 'function'];

// eslint-disable-line @typescript-eslint/ban-types

/**
 * The way that two values can be compared for equality:
 * "reference" - uses triple equals comparison (most often the default)
 * "equalsFunction" - asserts that the two values have an `equals()` function that can used to compare (see "ComparableObject" type)
 * "lodashDeep" - uses _.isEqual() for comparison
 * custom function - define any function that returns if the two provided values are equal.
 */

// Key names are verbose so this can be mixed into other contexts like AXON/Property. `undefined` and `null` have the
// same semantics so that we can use this feature without having extend and allocate new objects at every validation.
const VALIDATOR_KEYS = ['valueType', 'validValues', 'valueComparisonStrategy', 'isValidValue', 'phetioType', 'validators'];
export default class Validation {
  /**
   * @returns an error string if incorrect, otherwise null if valid
   */
  static getValidatorValidationError(validator) {
    if (!(validator instanceof Object)) {
      // There won't be a validationMessage on a non-object
      return 'validator must be an Object';
    }
    if (!(validator.hasOwnProperty('isValidValue') || validator.hasOwnProperty('valueType') || validator.hasOwnProperty('validValues') || validator.hasOwnProperty('valueComparisonStrategy') || validator.hasOwnProperty('phetioType') || validator.hasOwnProperty('validators'))) {
      return this.combineErrorMessages(`validator must have at least one of: ${VALIDATOR_KEYS.join(',')}`, validator.validationMessage);
    }
    if (validator.hasOwnProperty('valueType')) {
      const valueTypeValidationError = Validation.getValueOrElementTypeValidationError(validator.valueType);
      if (valueTypeValidationError) {
        return this.combineErrorMessages(`Invalid valueType: ${validator.valueType}, error: ${valueTypeValidationError}`, validator.validationMessage);
      }
    }
    if (validator.hasOwnProperty('isValidValue')) {
      if (!(typeof validator.isValidValue === 'function' || validator.isValidValue === null || validator.isValidValue === undefined)) {
        return this.combineErrorMessages(`isValidValue must be a function: ${validator.isValidValue}`, validator.validationMessage);
      }
    }
    if (validator.hasOwnProperty('valueComparisonStrategy')) {
      // Only accepted values are below
      if (!(validator.valueComparisonStrategy === 'reference' || validator.valueComparisonStrategy === 'lodashDeep' || validator.valueComparisonStrategy === 'equalsFunction' || typeof validator.valueComparisonStrategy === 'function')) {
        return this.combineErrorMessages(`valueComparisonStrategy must be "reference", "lodashDeep", 
        "equalsFunction", or a comparison function: ${validator.valueComparisonStrategy}`, validator.validationMessage);
      }
    }
    if (validator.validValues !== undefined && validator.validValues !== null) {
      if (!Array.isArray(validator.validValues)) {
        return this.combineErrorMessages(`validValues must be an array: ${validator.validValues}`, validator.validationMessage);
      }

      // Make sure each validValue matches the other rules, if any.
      const validatorWithoutValidValues = _.omit(validator, 'validValues');
      if (Validation.containsValidatorKey(validatorWithoutValidValues)) {
        for (let i = 0; i < validator.validValues.length; i++) {
          const validValue = validator.validValues[i];
          const validValueValidationError = Validation.getValidationError(validValue, validatorWithoutValidValues);
          if (validValueValidationError) {
            return this.combineErrorMessages(`Item not valid in validValues: ${validValue}, error: ${validValueValidationError}`, validator.validationMessage);
          }
        }
      }
    }
    if (validator.hasOwnProperty('phetioType')) {
      if (!validator.phetioType) {
        return this.combineErrorMessages('falsey phetioType provided', validator.validationMessage);
      }
      if (!validator.phetioType.validator) {
        return this.combineErrorMessages(`validator needed for phetioType: ${validator.phetioType.typeName}`, validator.validationMessage);
      }
      const phetioTypeValidationError = Validation.getValidatorValidationError(validator.phetioType.validator);
      if (phetioTypeValidationError) {
        return this.combineErrorMessages(phetioTypeValidationError, validator.validationMessage);
      }
    }
    if (validator.hasOwnProperty('validators')) {
      const validators = validator.validators;
      for (let i = 0; i < validators.length; i++) {
        const subValidator = validators[i];
        const subValidationError = Validation.getValidatorValidationError(subValidator);
        if (subValidationError) {
          return this.combineErrorMessages(`validators[${i}] invalid: ${subValidationError}`, validator.validationMessage);
        }
      }
    }
    return null;
  }

  /**
   * Validate that the valueType is of the expected format. Does not add validationMessage to any error it reports.
   * @returns - null if valid
   */
  static getValueTypeValidatorValidationError(valueType) {
    if (!(typeof valueType === 'function' || typeof valueType === 'string' || valueType instanceof EnumerationDeprecated || valueType === null || valueType === undefined)) {
      return `valueType must be {function|string|EnumerationDeprecated|null|undefined}, valueType=${valueType}`;
    }

    // {string} valueType must be one of the primitives in TYPEOF_STRINGS, for typeof comparison
    if (typeof valueType === 'string') {
      if (!_.includes(TYPEOF_STRINGS, valueType)) {
        return `valueType not a supported primitive types: ${valueType}`;
      }
    }
    return null;
  }
  static validateValidator(validator) {
    if (assert) {
      const error = Validation.getValidatorValidationError(validator);
      error && assert(false, error);
    }
  }

  /**
   * @param validator - object which may or may not contain validation keys
   */
  static containsValidatorKey(validator) {
    if (!(validator instanceof Object)) {
      return false;
    }
    for (let i = 0; i < VALIDATOR_KEYS.length; i++) {
      if (validator.hasOwnProperty(VALIDATOR_KEYS[i])) {
        return true;
      }
    }
    return false;
  }
  static combineErrorMessages(genericMessage, specificMessage) {
    if (specificMessage) {
      genericMessage = `${typeof specificMessage === 'function' ? specificMessage() : specificMessage}: ${genericMessage}`;
    }
    return genericMessage;
  }
  static isValueValid(value, validator, providedOptions) {
    return this.getValidationError(value, validator, providedOptions) === null;
  }

  /**
   * Determines whether a value is valid (returning a boolean value), returning the problem as a string if invalid,
   * otherwise returning null when valid.
   */
  static getValidationError(value, validator, providedOptions) {
    const options = optionize()({
      validateValidator: true
    }, providedOptions);
    if (options.validateValidator) {
      const validatorValidationError = Validation.getValidatorValidationError(validator);
      if (validatorValidationError) {
        return validatorValidationError;
      }
    }

    // Check valueType, which can be an array, string, type, or null
    if (validator.hasOwnProperty('valueType')) {
      const valueType = validator.valueType;
      if (Array.isArray(valueType)) {
        // Only one should be valid, so error out if none of them returned valid (valid=null)
        if (!_.some(valueType.map(typeInArray => !Validation.getValueTypeValidationError(value, typeInArray, validator.validationMessage)))) {
          return this.combineErrorMessages(`value not valid for any valueType in ${valueType.toString().substring(0, 100)}, value: ${value}`, validator.validationMessage);
        }
      } else if (valueType) {
        const valueTypeValidationError = Validation.getValueTypeValidationError(value, valueType, validator.validationMessage);
        if (valueTypeValidationError) {
          // getValueTypeValidationError will add the validationMessage for us
          return valueTypeValidationError;
        }
      }
    }
    if (validator.validValues) {
      const valueComparisonStrategy = validator.valueComparisonStrategy || 'reference';
      const valueValid = validator.validValues.some(validValue => {
        return Validation.equalsForValidationStrategy(validValue, value, valueComparisonStrategy);
      });
      if (!valueValid) {
        return this.combineErrorMessages(`value not in validValues: ${value}`, validator.validationMessage);
      }
    }
    if (validator.hasOwnProperty('isValidValue') && !validator.isValidValue(value)) {
      return this.combineErrorMessages(`value failed isValidValue: ${value}`, validator.validationMessage);
    }
    if (validator.hasOwnProperty('phetioType')) {
      const phetioTypeValidationError = Validation.getValidationError(value, validator.phetioType.validator, options);
      if (phetioTypeValidationError) {
        return this.combineErrorMessages(`value failed phetioType validator: ${value}, error: ${phetioTypeValidationError}`, validator.validationMessage);
      }
    }
    if (validator.hasOwnProperty('validators')) {
      const validators = validator.validators;
      for (let i = 0; i < validators.length; i++) {
        const subValidator = validators[i];
        const subValidationError = Validation.getValidationError(value, subValidator, options);
        if (subValidationError) {
          return this.combineErrorMessages(`Failed validation for validators[${i}]: ${subValidationError}`, validator.validationMessage);
        }
      }
    }
    return null;
  }
  static getValueTypeValidationError(value, valueType, message) {
    if (typeof valueType === 'string' && typeof value !== valueType) {
      // primitive type
      return this.combineErrorMessages(`value should have typeof ${valueType}, value=${value}`, message);
    } else if (valueType === Array && !Array.isArray(value)) {
      return this.combineErrorMessages(`value should have been an array, value=${value}`, message);
    } else if (valueType instanceof EnumerationDeprecated && !valueType.includes(value)) {
      return this.combineErrorMessages(`value is not a member of EnumerationDeprecated ${valueType}`, message);
    } else if (typeof valueType === 'function' && !(value instanceof valueType)) {
      // constructor
      return this.combineErrorMessages(`value should be instanceof ${valueType.name}, value=${value}`, message);
    }
    if (valueType === null && value !== null) {
      return this.combineErrorMessages(`value should be null, value=${value}`, message);
    }
    return null;
  }

  /**
   * Validate a type that can be a type, or an array of multiple types. Does not add validationMessage to any error
   * it reports
   */
  static getValueOrElementTypeValidationError(type) {
    if (Array.isArray(type)) {
      // If not every type in the list is valid, then return false, pass options through verbatim.
      for (let i = 0; i < type.length; i++) {
        const typeElement = type[i];
        const error = Validation.getValueTypeValidatorValidationError(typeElement);
        if (error) {
          return `Array value invalid: ${error}`;
        }
      }
    } else if (type) {
      const error = Validation.getValueTypeValidatorValidationError(type);
      if (error) {
        return `Value type invalid: ${error}`;
      }
    }
    return null;
  }

  /**
   * Compare the two provided values for equality using the valueComparisonStrategy provided, see
   * ValueComparisonStrategy type.
   */
  static equalsForValidationStrategy(a, b, valueComparisonStrategy = 'reference') {
    if (valueComparisonStrategy === 'reference') {
      return a === b;
    }
    if (valueComparisonStrategy === 'equalsFunction') {
      // AHH!! We're sorry. Performance really matters here, so we use double equals to test for null and undefined.
      // eslint-disable-next-line eqeqeq, no-eq-null
      if (a != null && b != null) {
        const aComparable = a;
        const bComparable = b;
        assert && assert(!!aComparable.equals, 'no equals function for 1st arg');
        assert && assert(!!bComparable.equals, 'no equals function for 2nd arg');

        // NOTE: If you hit this, and you think it is a bad assertion because of subtyping or something, then let's
        // talk about removing this. Likely this should stick around (thinks JO and MK), but we can definitely discuss.
        // Basically using the instance defined `equals` function makes assumptions, and if this assertion fails, then
        // it may be possible to have Property setting order dependencies. Likely it is just best to use a custom
        // function provided as a valueComparisonStrategy. See https://github.com/phetsims/axon/issues/428#issuecomment-2030463728
        assert && assert(aComparable.equals(bComparable) === bComparable.equals(aComparable), 'incompatible equality checks');
        const aEqualsB = aComparable.equals(bComparable);

        // Support for heterogeneous values with equalsFunction. No need to check both directions if they are the
        // same class.
        return a.constructor === b.constructor ? aEqualsB : aEqualsB && bComparable.equals(a);
      }
      return a === b; // Reference equality as a null/undefined fallback
    }
    if (valueComparisonStrategy === 'lodashDeep') {
      return _.isEqual(a, b);
    } else {
      return valueComparisonStrategy(a, b);
    }
  }
  static VALIDATOR_KEYS = VALIDATOR_KEYS;

  /**
   * General validator for validating that a string doesn't have template variables in it.
   */
  static STRING_WITHOUT_TEMPLATE_VARS_VALIDATOR = {
    valueType: 'string',
    isValidValue: v => !/\{\{\w*\}\}/.test(v)
  };
}
axon.register('Validation', Validation);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFbnVtZXJhdGlvbkRlcHJlY2F0ZWQiLCJvcHRpb25pemUiLCJheG9uIiwiVFlQRU9GX1NUUklOR1MiLCJWQUxJREFUT1JfS0VZUyIsIlZhbGlkYXRpb24iLCJnZXRWYWxpZGF0b3JWYWxpZGF0aW9uRXJyb3IiLCJ2YWxpZGF0b3IiLCJPYmplY3QiLCJoYXNPd25Qcm9wZXJ0eSIsImNvbWJpbmVFcnJvck1lc3NhZ2VzIiwiam9pbiIsInZhbGlkYXRpb25NZXNzYWdlIiwidmFsdWVUeXBlVmFsaWRhdGlvbkVycm9yIiwiZ2V0VmFsdWVPckVsZW1lbnRUeXBlVmFsaWRhdGlvbkVycm9yIiwidmFsdWVUeXBlIiwiaXNWYWxpZFZhbHVlIiwidW5kZWZpbmVkIiwidmFsdWVDb21wYXJpc29uU3RyYXRlZ3kiLCJ2YWxpZFZhbHVlcyIsIkFycmF5IiwiaXNBcnJheSIsInZhbGlkYXRvcldpdGhvdXRWYWxpZFZhbHVlcyIsIl8iLCJvbWl0IiwiY29udGFpbnNWYWxpZGF0b3JLZXkiLCJpIiwibGVuZ3RoIiwidmFsaWRWYWx1ZSIsInZhbGlkVmFsdWVWYWxpZGF0aW9uRXJyb3IiLCJnZXRWYWxpZGF0aW9uRXJyb3IiLCJwaGV0aW9UeXBlIiwidHlwZU5hbWUiLCJwaGV0aW9UeXBlVmFsaWRhdGlvbkVycm9yIiwidmFsaWRhdG9ycyIsInN1YlZhbGlkYXRvciIsInN1YlZhbGlkYXRpb25FcnJvciIsImdldFZhbHVlVHlwZVZhbGlkYXRvclZhbGlkYXRpb25FcnJvciIsImluY2x1ZGVzIiwidmFsaWRhdGVWYWxpZGF0b3IiLCJhc3NlcnQiLCJlcnJvciIsImdlbmVyaWNNZXNzYWdlIiwic3BlY2lmaWNNZXNzYWdlIiwiaXNWYWx1ZVZhbGlkIiwidmFsdWUiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwidmFsaWRhdG9yVmFsaWRhdGlvbkVycm9yIiwic29tZSIsIm1hcCIsInR5cGVJbkFycmF5IiwiZ2V0VmFsdWVUeXBlVmFsaWRhdGlvbkVycm9yIiwidG9TdHJpbmciLCJzdWJzdHJpbmciLCJ2YWx1ZVZhbGlkIiwiZXF1YWxzRm9yVmFsaWRhdGlvblN0cmF0ZWd5IiwibWVzc2FnZSIsIm5hbWUiLCJ0eXBlIiwidHlwZUVsZW1lbnQiLCJhIiwiYiIsImFDb21wYXJhYmxlIiwiYkNvbXBhcmFibGUiLCJlcXVhbHMiLCJhRXF1YWxzQiIsImNvbnN0cnVjdG9yIiwiaXNFcXVhbCIsIlNUUklOR19XSVRIT1VUX1RFTVBMQVRFX1ZBUlNfVkFMSURBVE9SIiwidiIsInRlc3QiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlZhbGlkYXRpb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVGhlIGRlZmluaXRpb24gZmlsZSBmb3IgXCJ2YWxpZGF0b3JzXCIgdXNlZCB0byB2YWxpZGF0ZSB2YWx1ZXMuIFRoaXMgZmlsZSBob2xkcyBhc3NvY2lhdGVkIGxvZ2ljIHRoYXQgdmFsaWRhdGVzIHRoZVxyXG4gKiBzY2hlbWEgb2YgdGhlIFwidmFsaWRhdG9yXCIgb2JqZWN0LCBhcyB3ZWxsIGFzIHRlc3RpbmcgaWYgYSB2YWx1ZSBhZGhlcmVzIHRvIHRoZSByZXN0cmljdGlvbnMgcHJvdmlkZWQgYnkgYSB2YWxpZGF0b3IuXHJcbiAqIFNlZSB2YWxpZGF0ZS5qcyBmb3IgdXNhZ2Ugd2l0aCBhc3NlcnRpb25zIHRvIGNoZWNrIHRoYXQgdmFsdWVzIGFyZSB2YWxpZC5cclxuICpcclxuICogRXhhbXBsZXM6XHJcbiAqXHJcbiAqIEEgVmFsaWRhdG9yIHRoYXQgb25seSBhY2NlcHRzIG51bWJlciB2YWx1ZXM6XHJcbiAqIHsgdmFsdWVUeXBlOiAnbnVtYmVyJyB9XHJcbiAqXHJcbiAqIEEgVmFsaWRhdG9yIHRoYXQgb25seSBhY2NlcHRzIHRoZSBudW1iZXJzIFwiMlwiIG9yIFwiM1wiOlxyXG4gKiB7IHZhbHVlVHlwZTogJ251bWJlcicsIHZhbGlkVmFsdWVzOiBbIDIsIDMgXSB9XHJcbiAqXHJcbiAqIEEgVmFsaWRhdG9yIHRoYXQgYWNjZXB0cyBhbnkgT2JqZWN0OlxyXG4gKiB7IHZhbHVlVHlwZTogT2JqZWN0IH1cclxuICpcclxuICogQSBWYWxpZGF0b3IgdGhhdCBhY2NlcHRzIEVudW1lcmF0aW9uRGVwcmVjYXRlZCB2YWx1ZXMgKE5PVEUhIFRoaXMgaXMgZGVwcmVjYXRlZCwgdXNlIHRoZSBuZXcgY2xhc3MtYmFzZWQgZW51bWVyYXRpb24gcGF0dGVybiBhcyB0aGUgdmFsdWVUeXBlKTpcclxuICogeyB2YWx1ZVR5cGU6IE15RW51bWVyYXRpb24gfVxyXG4gKiBhbmQvb3JcclxuICogeyB2YWxpZFZhbHVlczogTXlFbnVtZXJhdGlvbi5WQUxVRVMgfVxyXG4gKlxyXG4gKiBBIFZhbGlkYXRvciB0aGF0IGFjY2VwdHMgYSBzdHJpbmcgb3IgYSBudW1iZXIgZ3JlYXRlciB0aGFuIDI6XHJcbiAqIHsgaXNWYWxpZFZhbHVlOiB2YWx1ZSA9PiB7IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgfHwgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgdmFsdWUgPiAyKX0gfVxyXG4gKlxyXG4gKiBBIFZhbGlkYXRvciBmb3IgYSBudW1iZXIgdGhhdCBzaG91bGQgYmUgYW4gZXZlbiBudW1iZXIgZ3JlYXRlciB0aGFuIDEwXHJcbiAqIHsgdmFsdWVUeXBlOiAnbnVtYmVyJywgdmFsaWRhdG9yczogWyB7IGlzVmFsaWRWYWx1ZTogdiA9PiB2ID4gMTAgfSwgeyBpc1ZhbGlkVmFsdWU6IHYgPT4gdiUyID09PSAwIH1dIH1cclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBFbnVtZXJhdGlvbkRlcHJlY2F0ZWQgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL0VudW1lcmF0aW9uRGVwcmVjYXRlZC5qcyc7XHJcbmltcG9ydCBJbnRlbnRpb25hbEFueSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvSW50ZW50aW9uYWxBbnkuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgSU9UeXBlIGZyb20gJy4uLy4uL3RhbmRlbS9qcy90eXBlcy9JT1R5cGUuanMnO1xyXG5pbXBvcnQgYXhvbiBmcm9tICcuL2F4b24uanMnO1xyXG5cclxuY29uc3QgVFlQRU9GX1NUUklOR1MgPSBbICdzdHJpbmcnLCAnbnVtYmVyJywgJ2Jvb2xlYW4nLCAnZnVuY3Rpb24nIF07XHJcblxyXG5leHBvcnQgdHlwZSBJc1ZhbGlkVmFsdWVPcHRpb25zID0ge1xyXG5cclxuICAvLyBCeSBkZWZhdWx0IHZhbGlkYXRpb24gd2lsbCBhbHdheXMgY2hlY2sgdGhlIHZhbGlkaXR5IG9mIHRoZSB2YWxpZGF0b3IgaXRzZWxmLiBIb3dldmVyLCBmb3IgdHlwZXMgbGlrZVxyXG4gIC8vIFByb3BlcnR5IGFuZCBFbWl0dGVyIHJlLWNoZWNraW5nIHRoZSB2YWxpZGF0b3IgZXZlcnkgdGltZSB0aGUgUHJvcGVydHkgdmFsdWUgY2hhbmdlcyBvciB0aGUgRW1pdHRlciBlbWl0c1xyXG4gIC8vIHdhc3RlcyBjcHUuIEhlbmNlIGNhc2VzIGxpa2UgdGhvc2UgY2FuIG9wdC1vdXRcclxuICB2YWxpZGF0ZVZhbGlkYXRvcj86IGJvb2xlYW47XHJcbn07XHJcblxyXG50eXBlIFZhbHVlVHlwZSA9XHJcbiAgc3RyaW5nIHxcclxuICBFbnVtZXJhdGlvbkRlcHJlY2F0ZWQgfFxyXG4gIG51bGwgfFxyXG4gIFZhbHVlVHlwZVtdIHxcclxuXHJcbiAgLy8gYWxsb3cgRnVuY3Rpb24gaGVyZSBzaW5jZSBpdCBpcyB0aGUgYXBwcm9wcmlhdGUgbGV2ZWwgb2YgYWJzdHJhY3Rpb24gZm9yIGNoZWNraW5nIGluc3RhbmNlb2ZcclxuICBGdW5jdGlvbjsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvYmFuLXR5cGVzXHJcblxyXG50eXBlIENvbXBhcmFibGVPYmplY3QgPSB7XHJcbiAgZXF1YWxzOiAoIGE6IHVua25vd24gKSA9PiBib29sZWFuO1xyXG59O1xyXG5cclxudHlwZSBDdXN0b21WYWx1ZUNvbXBhcmlzb25NZXRob2RIb2xkZXI8VD4gPSB7XHJcblxyXG4gIC8vIEl0IGlzIHZpdGFsIHRoYXQgdGhpcyBpcyBcIm1ldGhvZFwiIHN0eWxlIHN5bnRheCwgYW5kIG5vdCBcInByb3BlcnR5XCIgc3R5bGUsIGxpa2UgY3VzdG9tVmFsdWVDb21wYXJpc29uOlxyXG4gIC8vIChhOlQsYjpUKT0+Ym9vbGVhbi4gIFRoaXMgaXMgYmVjYXVzZSBUeXBlU2NyaXB0IHNwZWNpZmljYWxseSBtYWtlcyBhIGNhbGwgdG8gaWdub3JlIGNvbnRyYXZhcmlhbnQgdHlwZSBjaGVja2luZ1xyXG4gIC8vIGZvciBtZXRob2RzLCBidXQgaXQgZG9lc24ndCBmb3IgUHJvcGVydGllcy4gTW9zdCBpbXBvcnRhbnRseSwgdGhpcyBtYWtlcyBpdHMgd2F5IGludG8gVFJlYWRPbmx5UHJvcGVydHksIGFuZCBjYXVzZXNcclxuICAvLyBsb3RzIG9mIHRyb3VibGUgd2hlbiB0cnlpbmcgdG8gdXNlIGl0IHdpdGggYHVua25vd25gIHBhcmFtZXRlciB0eXBlcy5cclxuICAvLyBQYXBlciB0cmFpbDE6IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9heG9uL2lzc3Vlcy80MjgjaXNzdWVjb21tZW50LTIwMzMwNzE0MzJcclxuICAvLyBQYXBlciB0cmFpbDI6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS81NTk5Mjg0MC8zNDA4NTAyXHJcbiAgLy8gUGFwZXIgdHJhaWwzOiBodHRwczovL3d3dy50eXBlc2NyaXB0bGFuZy5vcmcvZG9jcy9oYW5kYm9vay9yZWxlYXNlLW5vdGVzL3R5cGVzY3JpcHQtMi02Lmh0bWwjc3RyaWN0LWZ1bmN0aW9uLXR5cGVzXHJcbiAgY3VzdG9tVmFsdWVDb21wYXJpc29uKCBhOiBULCBiOiBUICk6IGJvb2xlYW47XHJcbn07XHJcblxyXG4vKipcclxuICogVGhlIHdheSB0aGF0IHR3byB2YWx1ZXMgY2FuIGJlIGNvbXBhcmVkIGZvciBlcXVhbGl0eTpcclxuICogXCJyZWZlcmVuY2VcIiAtIHVzZXMgdHJpcGxlIGVxdWFscyBjb21wYXJpc29uIChtb3N0IG9mdGVuIHRoZSBkZWZhdWx0KVxyXG4gKiBcImVxdWFsc0Z1bmN0aW9uXCIgLSBhc3NlcnRzIHRoYXQgdGhlIHR3byB2YWx1ZXMgaGF2ZSBhbiBgZXF1YWxzKClgIGZ1bmN0aW9uIHRoYXQgY2FuIHVzZWQgdG8gY29tcGFyZSAoc2VlIFwiQ29tcGFyYWJsZU9iamVjdFwiIHR5cGUpXHJcbiAqIFwibG9kYXNoRGVlcFwiIC0gdXNlcyBfLmlzRXF1YWwoKSBmb3IgY29tcGFyaXNvblxyXG4gKiBjdXN0b20gZnVuY3Rpb24gLSBkZWZpbmUgYW55IGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBpZiB0aGUgdHdvIHByb3ZpZGVkIHZhbHVlcyBhcmUgZXF1YWwuXHJcbiAqL1xyXG5leHBvcnQgdHlwZSBWYWx1ZUNvbXBhcmlzb25TdHJhdGVneTxUPiA9ICdlcXVhbHNGdW5jdGlvbicgfCAncmVmZXJlbmNlJyB8ICdsb2Rhc2hEZWVwJyB8IEN1c3RvbVZhbHVlQ29tcGFyaXNvbk1ldGhvZEhvbGRlcjxUPlsnY3VzdG9tVmFsdWVDb21wYXJpc29uJ107XHJcblxyXG5leHBvcnQgdHlwZSBWYWxpZGF0aW9uTWVzc2FnZSA9IHN0cmluZyB8ICggKCkgPT4gc3RyaW5nICk7XHJcblxyXG5leHBvcnQgdHlwZSBWYWxpZGF0b3I8VCA9IHVua25vd24+ID0ge1xyXG5cclxuICAvLyBUeXBlIG9mIHRoZSB2YWx1ZS5cclxuICAvLyBJZiB7ZnVuY3Rpb259LCB0aGUgZnVuY3Rpb24gbXVzdCBiZSBhIGNvbnN0cnVjdG9yLlxyXG4gIC8vIElmIHtzdHJpbmd9LCB0aGUgc3RyaW5nIG11c3QgYmUgb25lIG9mIHRoZSBwcmltaXRpdmUgdHlwZXMgbGlzdGVkIGluIFRZUEVPRl9TVFJJTkdTLlxyXG4gIC8vIElmIHtudWxsfHVuZGVmaW5lZH0sIHRoZSB2YWx1ZSBtdXN0IGJlIG51bGwgKHdoaWNoIGRvZXNuJ3QgbWFrZSBzZW5zZSB1bnRpbCB0aGUgbmV4dCBsaW5lIG9mIGRvYylcclxuICAvLyBJZiB7QXJyYXkuPHN0cmluZ3xmdW5jdGlvbnxudWxsfHVuZGVmaW5lZD59LCBlYWNoIGl0ZW0gbXVzdCBiZSBhIGxlZ2FsIHZhbHVlIGFzIGV4cGxhaW5lZCBpbiB0aGUgYWJvdmUgZG9jXHJcbiAgLy8gVW51c2VkIGlmIG51bGwuXHJcbiAgLy8gRXhhbXBsZXM6XHJcbiAgLy8gdmFsdWVUeXBlOiBWZWN0b3IyXHJcbiAgLy8gdmFsdWVUeXBlOiAnc3RyaW5nJ1xyXG4gIC8vIHZhbHVlVHlwZTogJ251bWJlcicsXHJcbiAgLy8gdmFsdWVUeXBlOiBbICdudW1iZXInLCBudWxsIF1cclxuICAvLyB2YWx1ZVR5cGU6IFsgJ251bWJlcicsICdzdHJpbmcnLCBOb2RlLCBudWxsIF1cclxuICB2YWx1ZVR5cGU/OiBWYWx1ZVR5cGUgfCBWYWx1ZVR5cGVbXTtcclxuXHJcbiAgLy8gVmFsaWQgdmFsdWVzIGZvciB0aGlzIFByb3BlcnR5LiBVbnVzZWQgaWYgbnVsbC5cclxuICAvLyBFeGFtcGxlOlxyXG4gIC8vIHZhbGlkVmFsdWVzOiBbICdob3Jpem9udGFsJywgJ3ZlcnRpY2FsJyBdXHJcbiAgdmFsaWRWYWx1ZXM/OiByZWFkb25seSBUW107XHJcblxyXG4gIC8vIGVxdWFsc0Z1bmN0aW9uIC0+IG11c3QgaGF2ZSAuZXF1YWxzKCkgZnVuY3Rpb24gb24gdGhlIHR5cGUgVFxyXG4gIHZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5PzogVmFsdWVDb21wYXJpc29uU3RyYXRlZ3k8VD47XHJcblxyXG4gIC8vIEZ1bmN0aW9uIHRoYXQgdmFsaWRhdGVzIHRoZSB2YWx1ZS4gU2luZ2xlIGFyZ3VtZW50IGlzIHRoZSB2YWx1ZSwgcmV0dXJucyBib29sZWFuLiBVbnVzZWQgaWYgbnVsbC5cclxuICAvLyBFeGFtcGxlOlxyXG4gIC8vIGlzVmFsaWRWYWx1ZTogZnVuY3Rpb24oIHZhbHVlICkgeyByZXR1cm4gTnVtYmVyLmlzSW50ZWdlciggdmFsdWUgKSAmJiB2YWx1ZSA+PSAwOyB9XHJcbiAgaXNWYWxpZFZhbHVlPzogKCB2OiBUICkgPT4gYm9vbGVhbjtcclxuXHJcbiAgLy8gQW4gSU9UeXBlIHVzZWQgdG8gc3BlY2lmeSB0aGUgcHVibGljIHR5cGluZyBmb3IgUGhFVC1pTy4gRWFjaCBJT1R5cGUgbXVzdCBoYXZlIGFcclxuICAvLyBgdmFsaWRhdG9yYCBrZXkgc3BlY2lmaWVkIHRoYXQgY2FuIGJlIHVzZWQgZm9yIHZhbGlkYXRpb24uIFNlZSBJT1R5cGUgZm9yIGFuIGV4YW1wbGUuXHJcbiAgcGhldGlvVHlwZT86IElPVHlwZTtcclxuXHJcbiAgLy8gaWYgcHJvdmlkZWQsIHRoaXMgd2lsbCBwcm92aWRlIHN1cHBsZW1lbnRhbCBpbmZvcm1hdGlvbiB0byB0aGUgYXNzZXJ0aW9uL3ZhbGlkYXRpb24gbWVzc2FnZXMgaW4gYWRkaXRpb24gdG8gdGhlXHJcbiAgLy8gdmFsaWRhdGUta2V5LXNwZWNpZmljIG1lc3NhZ2UgdGhhdCB3aWxsIGJlIGdpdmVuLlxyXG4gIHZhbGlkYXRpb25NZXNzYWdlPzogVmFsaWRhdGlvbk1lc3NhZ2U7XHJcblxyXG4gIC8vIEEgbGlzdCBvZiBWYWxpZGF0b3Igb2JqZWN0cywgZWFjaCBvZiB3aGljaCBtdXN0IHBhc3MgdG8gYmUgYSB2YWxpZCB2YWx1ZVxyXG4gIHZhbGlkYXRvcnM/OiBWYWxpZGF0b3I8VD5bXTtcclxufTtcclxuXHJcbi8vIEtleSBuYW1lcyBhcmUgdmVyYm9zZSBzbyB0aGlzIGNhbiBiZSBtaXhlZCBpbnRvIG90aGVyIGNvbnRleHRzIGxpa2UgQVhPTi9Qcm9wZXJ0eS4gYHVuZGVmaW5lZGAgYW5kIGBudWxsYCBoYXZlIHRoZVxyXG4vLyBzYW1lIHNlbWFudGljcyBzbyB0aGF0IHdlIGNhbiB1c2UgdGhpcyBmZWF0dXJlIHdpdGhvdXQgaGF2aW5nIGV4dGVuZCBhbmQgYWxsb2NhdGUgbmV3IG9iamVjdHMgYXQgZXZlcnkgdmFsaWRhdGlvbi5cclxuY29uc3QgVkFMSURBVE9SX0tFWVM6IEFycmF5PGtleW9mIFZhbGlkYXRvcj4gPSBbXHJcbiAgJ3ZhbHVlVHlwZScsXHJcbiAgJ3ZhbGlkVmFsdWVzJyxcclxuICAndmFsdWVDb21wYXJpc29uU3RyYXRlZ3knLFxyXG4gICdpc1ZhbGlkVmFsdWUnLFxyXG4gICdwaGV0aW9UeXBlJyxcclxuICAndmFsaWRhdG9ycydcclxuXTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFZhbGlkYXRpb24ge1xyXG5cclxuICAvKipcclxuICAgKiBAcmV0dXJucyBhbiBlcnJvciBzdHJpbmcgaWYgaW5jb3JyZWN0LCBvdGhlcndpc2UgbnVsbCBpZiB2YWxpZFxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgZ2V0VmFsaWRhdG9yVmFsaWRhdGlvbkVycm9yPFQ+KCB2YWxpZGF0b3I6IFZhbGlkYXRvcjxUPiApOiBzdHJpbmcgfCBudWxsIHtcclxuXHJcbiAgICBpZiAoICEoIHZhbGlkYXRvciBpbnN0YW5jZW9mIE9iamVjdCApICkge1xyXG5cclxuICAgICAgLy8gVGhlcmUgd29uJ3QgYmUgYSB2YWxpZGF0aW9uTWVzc2FnZSBvbiBhIG5vbi1vYmplY3RcclxuICAgICAgcmV0dXJuICd2YWxpZGF0b3IgbXVzdCBiZSBhbiBPYmplY3QnO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggISggdmFsaWRhdG9yLmhhc093blByb3BlcnR5KCAnaXNWYWxpZFZhbHVlJyApIHx8XHJcbiAgICAgICAgICAgIHZhbGlkYXRvci5oYXNPd25Qcm9wZXJ0eSggJ3ZhbHVlVHlwZScgKSB8fFxyXG4gICAgICAgICAgICB2YWxpZGF0b3IuaGFzT3duUHJvcGVydHkoICd2YWxpZFZhbHVlcycgKSB8fFxyXG4gICAgICAgICAgICB2YWxpZGF0b3IuaGFzT3duUHJvcGVydHkoICd2YWx1ZUNvbXBhcmlzb25TdHJhdGVneScgKSB8fFxyXG4gICAgICAgICAgICB2YWxpZGF0b3IuaGFzT3duUHJvcGVydHkoICdwaGV0aW9UeXBlJyApIHx8XHJcbiAgICAgICAgICAgIHZhbGlkYXRvci5oYXNPd25Qcm9wZXJ0eSggJ3ZhbGlkYXRvcnMnICkgKSApIHtcclxuICAgICAgcmV0dXJuIHRoaXMuY29tYmluZUVycm9yTWVzc2FnZXMoIGB2YWxpZGF0b3IgbXVzdCBoYXZlIGF0IGxlYXN0IG9uZSBvZjogJHtWQUxJREFUT1JfS0VZUy5qb2luKCAnLCcgKX1gLCB2YWxpZGF0b3IudmFsaWRhdGlvbk1lc3NhZ2UgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHZhbGlkYXRvci5oYXNPd25Qcm9wZXJ0eSggJ3ZhbHVlVHlwZScgKSApIHtcclxuICAgICAgY29uc3QgdmFsdWVUeXBlVmFsaWRhdGlvbkVycm9yID0gVmFsaWRhdGlvbi5nZXRWYWx1ZU9yRWxlbWVudFR5cGVWYWxpZGF0aW9uRXJyb3IoIHZhbGlkYXRvci52YWx1ZVR5cGUhICk7XHJcbiAgICAgIGlmICggdmFsdWVUeXBlVmFsaWRhdGlvbkVycm9yICkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbWJpbmVFcnJvck1lc3NhZ2VzKFxyXG4gICAgICAgICAgYEludmFsaWQgdmFsdWVUeXBlOiAke3ZhbGlkYXRvci52YWx1ZVR5cGV9LCBlcnJvcjogJHt2YWx1ZVR5cGVWYWxpZGF0aW9uRXJyb3J9YCxcclxuICAgICAgICAgIHZhbGlkYXRvci52YWxpZGF0aW9uTWVzc2FnZSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB2YWxpZGF0b3IuaGFzT3duUHJvcGVydHkoICdpc1ZhbGlkVmFsdWUnICkgKSB7XHJcbiAgICAgIGlmICggISggdHlwZW9mIHZhbGlkYXRvci5pc1ZhbGlkVmFsdWUgPT09ICdmdW5jdGlvbicgfHxcclxuICAgICAgICAgICAgICB2YWxpZGF0b3IuaXNWYWxpZFZhbHVlID09PSBudWxsIHx8XHJcbiAgICAgICAgICAgICAgdmFsaWRhdG9yLmlzVmFsaWRWYWx1ZSA9PT0gdW5kZWZpbmVkICkgKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tYmluZUVycm9yTWVzc2FnZXMoIGBpc1ZhbGlkVmFsdWUgbXVzdCBiZSBhIGZ1bmN0aW9uOiAke3ZhbGlkYXRvci5pc1ZhbGlkVmFsdWV9YCxcclxuICAgICAgICAgIHZhbGlkYXRvci52YWxpZGF0aW9uTWVzc2FnZSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB2YWxpZGF0b3IuaGFzT3duUHJvcGVydHkoICd2YWx1ZUNvbXBhcmlzb25TdHJhdGVneScgKSApIHtcclxuXHJcbiAgICAgIC8vIE9ubHkgYWNjZXB0ZWQgdmFsdWVzIGFyZSBiZWxvd1xyXG4gICAgICBpZiAoICEoIHZhbGlkYXRvci52YWx1ZUNvbXBhcmlzb25TdHJhdGVneSA9PT0gJ3JlZmVyZW5jZScgfHxcclxuICAgICAgICAgICAgICB2YWxpZGF0b3IudmFsdWVDb21wYXJpc29uU3RyYXRlZ3kgPT09ICdsb2Rhc2hEZWVwJyB8fFxyXG4gICAgICAgICAgICAgIHZhbGlkYXRvci52YWx1ZUNvbXBhcmlzb25TdHJhdGVneSA9PT0gJ2VxdWFsc0Z1bmN0aW9uJyB8fFxyXG4gICAgICAgICAgICAgIHR5cGVvZiB2YWxpZGF0b3IudmFsdWVDb21wYXJpc29uU3RyYXRlZ3kgPT09ICdmdW5jdGlvbicgKSApIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb21iaW5lRXJyb3JNZXNzYWdlcyggYHZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5IG11c3QgYmUgXCJyZWZlcmVuY2VcIiwgXCJsb2Rhc2hEZWVwXCIsIFxyXG4gICAgICAgIFwiZXF1YWxzRnVuY3Rpb25cIiwgb3IgYSBjb21wYXJpc29uIGZ1bmN0aW9uOiAke3ZhbGlkYXRvci52YWx1ZUNvbXBhcmlzb25TdHJhdGVneX1gLFxyXG4gICAgICAgICAgdmFsaWRhdG9yLnZhbGlkYXRpb25NZXNzYWdlICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHZhbGlkYXRvci52YWxpZFZhbHVlcyAhPT0gdW5kZWZpbmVkICYmIHZhbGlkYXRvci52YWxpZFZhbHVlcyAhPT0gbnVsbCApIHtcclxuICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggdmFsaWRhdG9yLnZhbGlkVmFsdWVzICkgKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tYmluZUVycm9yTWVzc2FnZXMoIGB2YWxpZFZhbHVlcyBtdXN0IGJlIGFuIGFycmF5OiAke3ZhbGlkYXRvci52YWxpZFZhbHVlc31gLFxyXG4gICAgICAgICAgdmFsaWRhdG9yLnZhbGlkYXRpb25NZXNzYWdlICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIE1ha2Ugc3VyZSBlYWNoIHZhbGlkVmFsdWUgbWF0Y2hlcyB0aGUgb3RoZXIgcnVsZXMsIGlmIGFueS5cclxuICAgICAgY29uc3QgdmFsaWRhdG9yV2l0aG91dFZhbGlkVmFsdWVzID0gXy5vbWl0KCB2YWxpZGF0b3IsICd2YWxpZFZhbHVlcycgKTtcclxuICAgICAgaWYgKCBWYWxpZGF0aW9uLmNvbnRhaW5zVmFsaWRhdG9yS2V5KCB2YWxpZGF0b3JXaXRob3V0VmFsaWRWYWx1ZXMgKSApIHtcclxuICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB2YWxpZGF0b3IudmFsaWRWYWx1ZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICBjb25zdCB2YWxpZFZhbHVlID0gdmFsaWRhdG9yLnZhbGlkVmFsdWVzWyBpIF07XHJcbiAgICAgICAgICBjb25zdCB2YWxpZFZhbHVlVmFsaWRhdGlvbkVycm9yID0gVmFsaWRhdGlvbi5nZXRWYWxpZGF0aW9uRXJyb3IoIHZhbGlkVmFsdWUsIHZhbGlkYXRvcldpdGhvdXRWYWxpZFZhbHVlcyApO1xyXG4gICAgICAgICAgaWYgKCB2YWxpZFZhbHVlVmFsaWRhdGlvbkVycm9yICkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb21iaW5lRXJyb3JNZXNzYWdlcyhcclxuICAgICAgICAgICAgICBgSXRlbSBub3QgdmFsaWQgaW4gdmFsaWRWYWx1ZXM6ICR7dmFsaWRWYWx1ZX0sIGVycm9yOiAke3ZhbGlkVmFsdWVWYWxpZGF0aW9uRXJyb3J9YCwgdmFsaWRhdG9yLnZhbGlkYXRpb25NZXNzYWdlICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB2YWxpZGF0b3IuaGFzT3duUHJvcGVydHkoICdwaGV0aW9UeXBlJyApICkge1xyXG4gICAgICBpZiAoICF2YWxpZGF0b3IucGhldGlvVHlwZSApIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb21iaW5lRXJyb3JNZXNzYWdlcyggJ2ZhbHNleSBwaGV0aW9UeXBlIHByb3ZpZGVkJywgdmFsaWRhdG9yLnZhbGlkYXRpb25NZXNzYWdlICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCAhdmFsaWRhdG9yLnBoZXRpb1R5cGUudmFsaWRhdG9yICkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbWJpbmVFcnJvck1lc3NhZ2VzKCBgdmFsaWRhdG9yIG5lZWRlZCBmb3IgcGhldGlvVHlwZTogJHt2YWxpZGF0b3IucGhldGlvVHlwZS50eXBlTmFtZX1gLFxyXG4gICAgICAgICAgdmFsaWRhdG9yLnZhbGlkYXRpb25NZXNzYWdlICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHBoZXRpb1R5cGVWYWxpZGF0aW9uRXJyb3IgPSBWYWxpZGF0aW9uLmdldFZhbGlkYXRvclZhbGlkYXRpb25FcnJvciggdmFsaWRhdG9yLnBoZXRpb1R5cGUudmFsaWRhdG9yICk7XHJcbiAgICAgIGlmICggcGhldGlvVHlwZVZhbGlkYXRpb25FcnJvciApIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb21iaW5lRXJyb3JNZXNzYWdlcyggcGhldGlvVHlwZVZhbGlkYXRpb25FcnJvciwgdmFsaWRhdG9yLnZhbGlkYXRpb25NZXNzYWdlICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHZhbGlkYXRvci5oYXNPd25Qcm9wZXJ0eSggJ3ZhbGlkYXRvcnMnICkgKSB7XHJcbiAgICAgIGNvbnN0IHZhbGlkYXRvcnMgPSB2YWxpZGF0b3IudmFsaWRhdG9ycyE7XHJcblxyXG4gICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB2YWxpZGF0b3JzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgIGNvbnN0IHN1YlZhbGlkYXRvciA9IHZhbGlkYXRvcnNbIGkgXTtcclxuICAgICAgICBjb25zdCBzdWJWYWxpZGF0aW9uRXJyb3IgPSBWYWxpZGF0aW9uLmdldFZhbGlkYXRvclZhbGlkYXRpb25FcnJvciggc3ViVmFsaWRhdG9yICk7XHJcbiAgICAgICAgaWYgKCBzdWJWYWxpZGF0aW9uRXJyb3IgKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5jb21iaW5lRXJyb3JNZXNzYWdlcyggYHZhbGlkYXRvcnNbJHtpfV0gaW52YWxpZDogJHtzdWJWYWxpZGF0aW9uRXJyb3J9YCwgdmFsaWRhdG9yLnZhbGlkYXRpb25NZXNzYWdlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBWYWxpZGF0ZSB0aGF0IHRoZSB2YWx1ZVR5cGUgaXMgb2YgdGhlIGV4cGVjdGVkIGZvcm1hdC4gRG9lcyBub3QgYWRkIHZhbGlkYXRpb25NZXNzYWdlIHRvIGFueSBlcnJvciBpdCByZXBvcnRzLlxyXG4gICAqIEByZXR1cm5zIC0gbnVsbCBpZiB2YWxpZFxyXG4gICAqL1xyXG4gIHByaXZhdGUgc3RhdGljIGdldFZhbHVlVHlwZVZhbGlkYXRvclZhbGlkYXRpb25FcnJvciggdmFsdWVUeXBlOiBWYWx1ZVR5cGUgKTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgICBpZiAoICEoIHR5cGVvZiB2YWx1ZVR5cGUgPT09ICdmdW5jdGlvbicgfHxcclxuICAgICAgICAgICAgdHlwZW9mIHZhbHVlVHlwZSA9PT0gJ3N0cmluZycgfHxcclxuICAgICAgICAgICAgdmFsdWVUeXBlIGluc3RhbmNlb2YgRW51bWVyYXRpb25EZXByZWNhdGVkIHx8XHJcbiAgICAgICAgICAgIHZhbHVlVHlwZSA9PT0gbnVsbCB8fFxyXG4gICAgICAgICAgICB2YWx1ZVR5cGUgPT09IHVuZGVmaW5lZCApICkge1xyXG4gICAgICByZXR1cm4gYHZhbHVlVHlwZSBtdXN0IGJlIHtmdW5jdGlvbnxzdHJpbmd8RW51bWVyYXRpb25EZXByZWNhdGVkfG51bGx8dW5kZWZpbmVkfSwgdmFsdWVUeXBlPSR7dmFsdWVUeXBlfWA7XHJcbiAgICB9XHJcblxyXG4gICAgLy8ge3N0cmluZ30gdmFsdWVUeXBlIG11c3QgYmUgb25lIG9mIHRoZSBwcmltaXRpdmVzIGluIFRZUEVPRl9TVFJJTkdTLCBmb3IgdHlwZW9mIGNvbXBhcmlzb25cclxuICAgIGlmICggdHlwZW9mIHZhbHVlVHlwZSA9PT0gJ3N0cmluZycgKSB7XHJcbiAgICAgIGlmICggIV8uaW5jbHVkZXMoIFRZUEVPRl9TVFJJTkdTLCB2YWx1ZVR5cGUgKSApIHtcclxuICAgICAgICByZXR1cm4gYHZhbHVlVHlwZSBub3QgYSBzdXBwb3J0ZWQgcHJpbWl0aXZlIHR5cGVzOiAke3ZhbHVlVHlwZX1gO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgdmFsaWRhdGVWYWxpZGF0b3I8VD4oIHZhbGlkYXRvcjogVmFsaWRhdG9yPFQ+ICk6IHZvaWQge1xyXG4gICAgaWYgKCBhc3NlcnQgKSB7XHJcbiAgICAgIGNvbnN0IGVycm9yID0gVmFsaWRhdGlvbi5nZXRWYWxpZGF0b3JWYWxpZGF0aW9uRXJyb3IoIHZhbGlkYXRvciApO1xyXG4gICAgICBlcnJvciAmJiBhc3NlcnQoIGZhbHNlLCBlcnJvciApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHZhbGlkYXRvciAtIG9iamVjdCB3aGljaCBtYXkgb3IgbWF5IG5vdCBjb250YWluIHZhbGlkYXRpb24ga2V5c1xyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgY29udGFpbnNWYWxpZGF0b3JLZXkoIHZhbGlkYXRvcjogSW50ZW50aW9uYWxBbnkgKTogYm9vbGVhbiB7XHJcbiAgICBpZiAoICEoIHZhbGlkYXRvciBpbnN0YW5jZW9mIE9iamVjdCApICkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBWQUxJREFUT1JfS0VZUy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgaWYgKCB2YWxpZGF0b3IuaGFzT3duUHJvcGVydHkoIFZBTElEQVRPUl9LRVlTWyBpIF0gKSApIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzdGF0aWMgY29tYmluZUVycm9yTWVzc2FnZXMoIGdlbmVyaWNNZXNzYWdlOiBzdHJpbmcsIHNwZWNpZmljTWVzc2FnZT86IFZhbGlkYXRpb25NZXNzYWdlICk6IHN0cmluZyB7XHJcbiAgICBpZiAoIHNwZWNpZmljTWVzc2FnZSApIHtcclxuICAgICAgZ2VuZXJpY01lc3NhZ2UgPSBgJHt0eXBlb2Ygc3BlY2lmaWNNZXNzYWdlID09PSAnZnVuY3Rpb24nID8gc3BlY2lmaWNNZXNzYWdlKCkgOiBzcGVjaWZpY01lc3NhZ2V9OiAke2dlbmVyaWNNZXNzYWdlfWA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZ2VuZXJpY01lc3NhZ2U7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIGlzVmFsdWVWYWxpZDxUPiggdmFsdWU6IFQsIHZhbGlkYXRvcjogVmFsaWRhdG9yPFQ+LCBwcm92aWRlZE9wdGlvbnM/OiBJc1ZhbGlkVmFsdWVPcHRpb25zICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0VmFsaWRhdGlvbkVycm9yKCB2YWx1ZSwgdmFsaWRhdG9yLCBwcm92aWRlZE9wdGlvbnMgKSA9PT0gbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERldGVybWluZXMgd2hldGhlciBhIHZhbHVlIGlzIHZhbGlkIChyZXR1cm5pbmcgYSBib29sZWFuIHZhbHVlKSwgcmV0dXJuaW5nIHRoZSBwcm9ibGVtIGFzIGEgc3RyaW5nIGlmIGludmFsaWQsXHJcbiAgICogb3RoZXJ3aXNlIHJldHVybmluZyBudWxsIHdoZW4gdmFsaWQuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBnZXRWYWxpZGF0aW9uRXJyb3I8VD4oIHZhbHVlOiBJbnRlbnRpb25hbEFueSwgdmFsaWRhdG9yOiBWYWxpZGF0b3I8VD4sIHByb3ZpZGVkT3B0aW9ucz86IElzVmFsaWRWYWx1ZU9wdGlvbnMgKTogc3RyaW5nIHwgbnVsbCB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxJc1ZhbGlkVmFsdWVPcHRpb25zPigpKCB7XHJcbiAgICAgIHZhbGlkYXRlVmFsaWRhdG9yOiB0cnVlXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBpZiAoIG9wdGlvbnMudmFsaWRhdGVWYWxpZGF0b3IgKSB7XHJcbiAgICAgIGNvbnN0IHZhbGlkYXRvclZhbGlkYXRpb25FcnJvciA9IFZhbGlkYXRpb24uZ2V0VmFsaWRhdG9yVmFsaWRhdGlvbkVycm9yKCB2YWxpZGF0b3IgKTtcclxuICAgICAgaWYgKCB2YWxpZGF0b3JWYWxpZGF0aW9uRXJyb3IgKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbGlkYXRvclZhbGlkYXRpb25FcnJvcjtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIENoZWNrIHZhbHVlVHlwZSwgd2hpY2ggY2FuIGJlIGFuIGFycmF5LCBzdHJpbmcsIHR5cGUsIG9yIG51bGxcclxuICAgIGlmICggdmFsaWRhdG9yLmhhc093blByb3BlcnR5KCAndmFsdWVUeXBlJyApICkge1xyXG4gICAgICBjb25zdCB2YWx1ZVR5cGUgPSB2YWxpZGF0b3IudmFsdWVUeXBlO1xyXG4gICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIHZhbHVlVHlwZSApICkge1xyXG5cclxuICAgICAgICAvLyBPbmx5IG9uZSBzaG91bGQgYmUgdmFsaWQsIHNvIGVycm9yIG91dCBpZiBub25lIG9mIHRoZW0gcmV0dXJuZWQgdmFsaWQgKHZhbGlkPW51bGwpXHJcbiAgICAgICAgaWYgKCAhXy5zb21lKCB2YWx1ZVR5cGUubWFwKCAoIHR5cGVJbkFycmF5OiBWYWx1ZVR5cGUgKSA9PiAhVmFsaWRhdGlvbi5nZXRWYWx1ZVR5cGVWYWxpZGF0aW9uRXJyb3IoIHZhbHVlLCB0eXBlSW5BcnJheSwgdmFsaWRhdG9yLnZhbGlkYXRpb25NZXNzYWdlICkgKSApICkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuY29tYmluZUVycm9yTWVzc2FnZXMoXHJcbiAgICAgICAgICAgIGB2YWx1ZSBub3QgdmFsaWQgZm9yIGFueSB2YWx1ZVR5cGUgaW4gJHt2YWx1ZVR5cGUudG9TdHJpbmcoKS5zdWJzdHJpbmcoIDAsIDEwMCApfSwgdmFsdWU6ICR7dmFsdWV9YCxcclxuICAgICAgICAgICAgdmFsaWRhdG9yLnZhbGlkYXRpb25NZXNzYWdlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCB2YWx1ZVR5cGUgKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IHZhbHVlVHlwZVZhbGlkYXRpb25FcnJvciA9IFZhbGlkYXRpb24uZ2V0VmFsdWVUeXBlVmFsaWRhdGlvbkVycm9yKCB2YWx1ZSwgdmFsdWVUeXBlLCB2YWxpZGF0b3IudmFsaWRhdGlvbk1lc3NhZ2UgKTtcclxuICAgICAgICBpZiAoIHZhbHVlVHlwZVZhbGlkYXRpb25FcnJvciApIHtcclxuXHJcbiAgICAgICAgICAvLyBnZXRWYWx1ZVR5cGVWYWxpZGF0aW9uRXJyb3Igd2lsbCBhZGQgdGhlIHZhbGlkYXRpb25NZXNzYWdlIGZvciB1c1xyXG4gICAgICAgICAgcmV0dXJuIHZhbHVlVHlwZVZhbGlkYXRpb25FcnJvcjtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHZhbGlkYXRvci52YWxpZFZhbHVlcyApIHtcclxuXHJcbiAgICAgIGNvbnN0IHZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5ID0gdmFsaWRhdG9yLnZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5IHx8ICdyZWZlcmVuY2UnO1xyXG4gICAgICBjb25zdCB2YWx1ZVZhbGlkID0gdmFsaWRhdG9yLnZhbGlkVmFsdWVzLnNvbWUoIHZhbGlkVmFsdWUgPT4ge1xyXG4gICAgICAgIHJldHVybiBWYWxpZGF0aW9uLmVxdWFsc0ZvclZhbGlkYXRpb25TdHJhdGVneTxUPiggdmFsaWRWYWx1ZSwgdmFsdWUsIHZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5ICk7XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGlmICggIXZhbHVlVmFsaWQgKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tYmluZUVycm9yTWVzc2FnZXMoIGB2YWx1ZSBub3QgaW4gdmFsaWRWYWx1ZXM6ICR7dmFsdWV9YCwgdmFsaWRhdG9yLnZhbGlkYXRpb25NZXNzYWdlICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICggdmFsaWRhdG9yLmhhc093blByb3BlcnR5KCAnaXNWYWxpZFZhbHVlJyApICYmICF2YWxpZGF0b3IuaXNWYWxpZFZhbHVlISggdmFsdWUgKSApIHtcclxuICAgICAgcmV0dXJuIHRoaXMuY29tYmluZUVycm9yTWVzc2FnZXMoIGB2YWx1ZSBmYWlsZWQgaXNWYWxpZFZhbHVlOiAke3ZhbHVlfWAsIHZhbGlkYXRvci52YWxpZGF0aW9uTWVzc2FnZSApO1xyXG4gICAgfVxyXG4gICAgaWYgKCB2YWxpZGF0b3IuaGFzT3duUHJvcGVydHkoICdwaGV0aW9UeXBlJyApICkge1xyXG5cclxuICAgICAgY29uc3QgcGhldGlvVHlwZVZhbGlkYXRpb25FcnJvciA9IFZhbGlkYXRpb24uZ2V0VmFsaWRhdGlvbkVycm9yKCB2YWx1ZSwgdmFsaWRhdG9yLnBoZXRpb1R5cGUhLnZhbGlkYXRvciwgb3B0aW9ucyApO1xyXG4gICAgICBpZiAoIHBoZXRpb1R5cGVWYWxpZGF0aW9uRXJyb3IgKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tYmluZUVycm9yTWVzc2FnZXMoIGB2YWx1ZSBmYWlsZWQgcGhldGlvVHlwZSB2YWxpZGF0b3I6ICR7dmFsdWV9LCBlcnJvcjogJHtwaGV0aW9UeXBlVmFsaWRhdGlvbkVycm9yfWAsIHZhbGlkYXRvci52YWxpZGF0aW9uTWVzc2FnZSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB2YWxpZGF0b3IuaGFzT3duUHJvcGVydHkoICd2YWxpZGF0b3JzJyApICkge1xyXG4gICAgICBjb25zdCB2YWxpZGF0b3JzID0gdmFsaWRhdG9yLnZhbGlkYXRvcnMhO1xyXG5cclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdmFsaWRhdG9ycy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICBjb25zdCBzdWJWYWxpZGF0b3IgPSB2YWxpZGF0b3JzWyBpIF07XHJcbiAgICAgICAgY29uc3Qgc3ViVmFsaWRhdGlvbkVycm9yID0gVmFsaWRhdGlvbi5nZXRWYWxpZGF0aW9uRXJyb3IoIHZhbHVlLCBzdWJWYWxpZGF0b3IsIG9wdGlvbnMgKTtcclxuICAgICAgICBpZiAoIHN1YlZhbGlkYXRpb25FcnJvciApIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLmNvbWJpbmVFcnJvck1lc3NhZ2VzKCBgRmFpbGVkIHZhbGlkYXRpb24gZm9yIHZhbGlkYXRvcnNbJHtpfV06ICR7c3ViVmFsaWRhdGlvbkVycm9yfWAsIHZhbGlkYXRvci52YWxpZGF0aW9uTWVzc2FnZSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzdGF0aWMgZ2V0VmFsdWVUeXBlVmFsaWRhdGlvbkVycm9yKCB2YWx1ZTogSW50ZW50aW9uYWxBbnksIHZhbHVlVHlwZTogVmFsdWVUeXBlLCBtZXNzYWdlPzogVmFsaWRhdGlvbk1lc3NhZ2UgKTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgICBpZiAoIHR5cGVvZiB2YWx1ZVR5cGUgPT09ICdzdHJpbmcnICYmIHR5cGVvZiB2YWx1ZSAhPT0gdmFsdWVUeXBlICkgeyAvLyBwcmltaXRpdmUgdHlwZVxyXG4gICAgICByZXR1cm4gdGhpcy5jb21iaW5lRXJyb3JNZXNzYWdlcyggYHZhbHVlIHNob3VsZCBoYXZlIHR5cGVvZiAke3ZhbHVlVHlwZX0sIHZhbHVlPSR7dmFsdWV9YCwgbWVzc2FnZSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHZhbHVlVHlwZSA9PT0gQXJyYXkgJiYgIUFycmF5LmlzQXJyYXkoIHZhbHVlICkgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmNvbWJpbmVFcnJvck1lc3NhZ2VzKCBgdmFsdWUgc2hvdWxkIGhhdmUgYmVlbiBhbiBhcnJheSwgdmFsdWU9JHt2YWx1ZX1gLCBtZXNzYWdlICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggdmFsdWVUeXBlIGluc3RhbmNlb2YgRW51bWVyYXRpb25EZXByZWNhdGVkICYmICF2YWx1ZVR5cGUuaW5jbHVkZXMoIHZhbHVlICkgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmNvbWJpbmVFcnJvck1lc3NhZ2VzKCBgdmFsdWUgaXMgbm90IGEgbWVtYmVyIG9mIEVudW1lcmF0aW9uRGVwcmVjYXRlZCAke3ZhbHVlVHlwZX1gLCBtZXNzYWdlICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggdHlwZW9mIHZhbHVlVHlwZSA9PT0gJ2Z1bmN0aW9uJyAmJiAhKCB2YWx1ZSBpbnN0YW5jZW9mIHZhbHVlVHlwZSApICkgeyAvLyBjb25zdHJ1Y3RvclxyXG4gICAgICByZXR1cm4gdGhpcy5jb21iaW5lRXJyb3JNZXNzYWdlcyggYHZhbHVlIHNob3VsZCBiZSBpbnN0YW5jZW9mICR7dmFsdWVUeXBlLm5hbWV9LCB2YWx1ZT0ke3ZhbHVlfWAsIG1lc3NhZ2UgKTtcclxuICAgIH1cclxuICAgIGlmICggdmFsdWVUeXBlID09PSBudWxsICYmIHZhbHVlICE9PSBudWxsICkge1xyXG4gICAgICByZXR1cm4gdGhpcy5jb21iaW5lRXJyb3JNZXNzYWdlcyggYHZhbHVlIHNob3VsZCBiZSBudWxsLCB2YWx1ZT0ke3ZhbHVlfWAsIG1lc3NhZ2UgKTtcclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVmFsaWRhdGUgYSB0eXBlIHRoYXQgY2FuIGJlIGEgdHlwZSwgb3IgYW4gYXJyYXkgb2YgbXVsdGlwbGUgdHlwZXMuIERvZXMgbm90IGFkZCB2YWxpZGF0aW9uTWVzc2FnZSB0byBhbnkgZXJyb3JcclxuICAgKiBpdCByZXBvcnRzXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBzdGF0aWMgZ2V0VmFsdWVPckVsZW1lbnRUeXBlVmFsaWRhdGlvbkVycm9yKCB0eXBlOiBWYWx1ZVR5cGUgKTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgICBpZiAoIEFycmF5LmlzQXJyYXkoIHR5cGUgKSApIHtcclxuXHJcbiAgICAgIC8vIElmIG5vdCBldmVyeSB0eXBlIGluIHRoZSBsaXN0IGlzIHZhbGlkLCB0aGVuIHJldHVybiBmYWxzZSwgcGFzcyBvcHRpb25zIHRocm91Z2ggdmVyYmF0aW0uXHJcbiAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHR5cGUubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgY29uc3QgdHlwZUVsZW1lbnQgPSB0eXBlWyBpIF07XHJcbiAgICAgICAgY29uc3QgZXJyb3IgPSBWYWxpZGF0aW9uLmdldFZhbHVlVHlwZVZhbGlkYXRvclZhbGlkYXRpb25FcnJvciggdHlwZUVsZW1lbnQgKTtcclxuICAgICAgICBpZiAoIGVycm9yICkge1xyXG4gICAgICAgICAgcmV0dXJuIGBBcnJheSB2YWx1ZSBpbnZhbGlkOiAke2Vycm9yfWA7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggdHlwZSApIHtcclxuICAgICAgY29uc3QgZXJyb3IgPSBWYWxpZGF0aW9uLmdldFZhbHVlVHlwZVZhbGlkYXRvclZhbGlkYXRpb25FcnJvciggdHlwZSApO1xyXG4gICAgICBpZiAoIGVycm9yICkge1xyXG4gICAgICAgIHJldHVybiBgVmFsdWUgdHlwZSBpbnZhbGlkOiAke2Vycm9yfWA7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcGFyZSB0aGUgdHdvIHByb3ZpZGVkIHZhbHVlcyBmb3IgZXF1YWxpdHkgdXNpbmcgdGhlIHZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5IHByb3ZpZGVkLCBzZWVcclxuICAgKiBWYWx1ZUNvbXBhcmlzb25TdHJhdGVneSB0eXBlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgZXF1YWxzRm9yVmFsaWRhdGlvblN0cmF0ZWd5PFQ+KCBhOiBULCBiOiBULCB2YWx1ZUNvbXBhcmlzb25TdHJhdGVneTogVmFsdWVDb21wYXJpc29uU3RyYXRlZ3k8VD4gPSAncmVmZXJlbmNlJyApOiBib29sZWFuIHtcclxuXHJcbiAgICBpZiAoIHZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5ID09PSAncmVmZXJlbmNlJyApIHtcclxuICAgICAgcmV0dXJuIGEgPT09IGI7XHJcbiAgICB9XHJcbiAgICBpZiAoIHZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5ID09PSAnZXF1YWxzRnVuY3Rpb24nICkge1xyXG5cclxuICAgICAgLy8gQUhIISEgV2UncmUgc29ycnkuIFBlcmZvcm1hbmNlIHJlYWxseSBtYXR0ZXJzIGhlcmUsIHNvIHdlIHVzZSBkb3VibGUgZXF1YWxzIHRvIHRlc3QgZm9yIG51bGwgYW5kIHVuZGVmaW5lZC5cclxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGVxZXFlcSwgbm8tZXEtbnVsbFxyXG4gICAgICBpZiAoIGEgIT0gbnVsbCAmJiBiICE9IG51bGwgKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IGFDb21wYXJhYmxlID0gYSBhcyB1bmtub3duIGFzIENvbXBhcmFibGVPYmplY3Q7XHJcbiAgICAgICAgY29uc3QgYkNvbXBhcmFibGUgPSBiIGFzIHVua25vd24gYXMgQ29tcGFyYWJsZU9iamVjdDtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhIWFDb21wYXJhYmxlLmVxdWFscywgJ25vIGVxdWFscyBmdW5jdGlvbiBmb3IgMXN0IGFyZycgKTtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhIWJDb21wYXJhYmxlLmVxdWFscywgJ25vIGVxdWFscyBmdW5jdGlvbiBmb3IgMm5kIGFyZycgKTtcclxuXHJcbiAgICAgICAgLy8gTk9URTogSWYgeW91IGhpdCB0aGlzLCBhbmQgeW91IHRoaW5rIGl0IGlzIGEgYmFkIGFzc2VydGlvbiBiZWNhdXNlIG9mIHN1YnR5cGluZyBvciBzb21ldGhpbmcsIHRoZW4gbGV0J3NcclxuICAgICAgICAvLyB0YWxrIGFib3V0IHJlbW92aW5nIHRoaXMuIExpa2VseSB0aGlzIHNob3VsZCBzdGljayBhcm91bmQgKHRoaW5rcyBKTyBhbmQgTUspLCBidXQgd2UgY2FuIGRlZmluaXRlbHkgZGlzY3Vzcy5cclxuICAgICAgICAvLyBCYXNpY2FsbHkgdXNpbmcgdGhlIGluc3RhbmNlIGRlZmluZWQgYGVxdWFsc2AgZnVuY3Rpb24gbWFrZXMgYXNzdW1wdGlvbnMsIGFuZCBpZiB0aGlzIGFzc2VydGlvbiBmYWlscywgdGhlblxyXG4gICAgICAgIC8vIGl0IG1heSBiZSBwb3NzaWJsZSB0byBoYXZlIFByb3BlcnR5IHNldHRpbmcgb3JkZXIgZGVwZW5kZW5jaWVzLiBMaWtlbHkgaXQgaXMganVzdCBiZXN0IHRvIHVzZSBhIGN1c3RvbVxyXG4gICAgICAgIC8vIGZ1bmN0aW9uIHByb3ZpZGVkIGFzIGEgdmFsdWVDb21wYXJpc29uU3RyYXRlZ3kuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYXhvbi9pc3N1ZXMvNDI4I2lzc3VlY29tbWVudC0yMDMwNDYzNzI4XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggYUNvbXBhcmFibGUuZXF1YWxzKCBiQ29tcGFyYWJsZSApID09PSBiQ29tcGFyYWJsZS5lcXVhbHMoIGFDb21wYXJhYmxlICksXHJcbiAgICAgICAgICAnaW5jb21wYXRpYmxlIGVxdWFsaXR5IGNoZWNrcycgKTtcclxuXHJcbiAgICAgICAgY29uc3QgYUVxdWFsc0IgPSBhQ29tcGFyYWJsZS5lcXVhbHMoIGJDb21wYXJhYmxlICk7XHJcblxyXG4gICAgICAgIC8vIFN1cHBvcnQgZm9yIGhldGVyb2dlbmVvdXMgdmFsdWVzIHdpdGggZXF1YWxzRnVuY3Rpb24uIE5vIG5lZWQgdG8gY2hlY2sgYm90aCBkaXJlY3Rpb25zIGlmIHRoZXkgYXJlIHRoZVxyXG4gICAgICAgIC8vIHNhbWUgY2xhc3MuXHJcbiAgICAgICAgcmV0dXJuIGEuY29uc3RydWN0b3IgPT09IGIuY29uc3RydWN0b3IgPyBhRXF1YWxzQiA6IGFFcXVhbHNCICYmIGJDb21wYXJhYmxlLmVxdWFscyggYSApO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBhID09PSBiOyAvLyBSZWZlcmVuY2UgZXF1YWxpdHkgYXMgYSBudWxsL3VuZGVmaW5lZCBmYWxsYmFja1xyXG4gICAgfVxyXG4gICAgaWYgKCB2YWx1ZUNvbXBhcmlzb25TdHJhdGVneSA9PT0gJ2xvZGFzaERlZXAnICkge1xyXG4gICAgICByZXR1cm4gXy5pc0VxdWFsKCBhLCBiICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIHZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5KCBhLCBiICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFZBTElEQVRPUl9LRVlTID0gVkFMSURBVE9SX0tFWVM7XHJcblxyXG4gIC8qKlxyXG4gICAqIEdlbmVyYWwgdmFsaWRhdG9yIGZvciB2YWxpZGF0aW5nIHRoYXQgYSBzdHJpbmcgZG9lc24ndCBoYXZlIHRlbXBsYXRlIHZhcmlhYmxlcyBpbiBpdC5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFNUUklOR19XSVRIT1VUX1RFTVBMQVRFX1ZBUlNfVkFMSURBVE9SOiBWYWxpZGF0b3I8c3RyaW5nPiA9IHtcclxuICAgIHZhbHVlVHlwZTogJ3N0cmluZycsXHJcbiAgICBpc1ZhbGlkVmFsdWU6IHYgPT4gIS9cXHtcXHtcXHcqXFx9XFx9Ly50ZXN0KCB2IClcclxuICB9O1xyXG59XHJcblxyXG5heG9uLnJlZ2lzdGVyKCAnVmFsaWRhdGlvbicsIFZhbGlkYXRpb24gKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxxQkFBcUIsTUFBTSw2Q0FBNkM7QUFFL0UsT0FBT0MsU0FBUyxNQUFNLGlDQUFpQztBQUV2RCxPQUFPQyxJQUFJLE1BQU0sV0FBVztBQUU1QixNQUFNQyxjQUFjLEdBQUcsQ0FBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxVQUFVLENBQUU7O0FBaUJ4RDs7QUFrQlo7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBOENBO0FBQ0E7QUFDQSxNQUFNQyxjQUFzQyxHQUFHLENBQzdDLFdBQVcsRUFDWCxhQUFhLEVBQ2IseUJBQXlCLEVBQ3pCLGNBQWMsRUFDZCxZQUFZLEVBQ1osWUFBWSxDQUNiO0FBRUQsZUFBZSxNQUFNQyxVQUFVLENBQUM7RUFFOUI7QUFDRjtBQUNBO0VBQ0UsT0FBY0MsMkJBQTJCQSxD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S0FBS0MsQ0FBQztJQUNoQjtJQUNBLElBQUs1Qyx1QkFBdUIsS0FBSyxnQkFBZ0IsRUFBRztNQUVsRDtNQUNBO01BQ0EsSUFBSzJDLENBQUMsSUFBSSxJQUFJLElBQUlDLENBQUMsSUFBSSxJQUFJLEVBQUc7UUFFNUIsTUFBTUMsV0FBVyxHQUFHRixDQUFnQztRQUNwRCxNQUFNRyxXQUFXLEdBQUdGLENBQWdDO1FBQ3BEdEIsTUFBTSxJQUFJQSxNQUFNLENBQUUsQ0FBQyxDQUFDdUIsV0FBVyxDQUFDRSxNQUFNLEVBQUUsZ0NBQWlDLENBQUM7UUFDMUV6QixNQUFNLElBQUlBLE1BQU0sQ0FBRSxDQUFDLENBQUN3QixXQUFXLENBQUNDLE1BQU0sRUFBRSxnQ0FBaUMsQ0FBQzs7UUFFMUU7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBekIsTUFBTSxJQUFJQSxNQUFNLENBQUV1QixXQUFXLENBQUNFLE1BQU0sQ0FBRUQsV0FBWSxDQUFDLEtBQUtBLFdBQVcsQ0FBQ0MsTUFBTSxDQUFFRixXQUFZLENBQUMsRUFDdkYsOEJBQStCLENBQUM7UUFFbEMsTUFBTUcsUUFBUSxHQUFHSCxXQUFXLENBQUNFLE1BQU0sQ0FBRUQsV0FBWSxDQUFDOztRQUVsRDtRQUNBO1FBQ0EsT0FBT0gsQ0FBQyxDQUFDTSxXQUFXLEtBQUtMLENBQUMsQ0FBQ0ssV0FBVyxHQUFHRCxRQUFRLEdBQUdBLFFBQVEsSUFBSUYsV0FBVyxDQUFDQyxNQUFNLENBQUVKLENBQUUsQ0FBQztNQUN6RjtNQUNBLE9BQU9BLENBQUMsS0FBS0MsQ0FBQyxDQUFDLENBQUM7SUFDbEI7SUFDQSxJQUFLNUMsdUJBQXVCLEtBQUssWUFBWSxFQUFHO01BQzlDLE9BQU9LLENBQUMsQ0FBQzZDLE9BQU8sQ0FBRVAsQ0FBQyxFQUFFQyxDQUFFLENBQUM7SUFDMUIsQ0FBQyxNQUNJO01BQ0gsT0FBTzVDLHVCQUF1QixDQUFFMkMsQ0FBQyxFQUFFQyxDQUFFLENBQUM7SUFDeEM7RUFDRjtFQUVBLE9BQXVCMUQsY0FBYyxHQUFHQSxjQUFjOztFQUV0RDtBQUNGO0FBQ0E7RUFDRSxPQUF1QmlFLHNDQUFzQyxHQUFzQjtJQUNqRnRELFNBQVMsRUFBRSxRQUFRO0lBQ25CQyxZQUFZLEVBQUVzRCxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUNDLElBQUksQ0FBRUQsQ0FBRTtFQUM1QyxDQUFDO0FBQ0g7QUFFQXBFLElBQUksQ0FBQ3NFLFFBQVEsQ0FBRSxZQUFZLEVBQUVuRSxVQUFXLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=