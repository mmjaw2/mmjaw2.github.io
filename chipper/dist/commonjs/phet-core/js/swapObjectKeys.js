"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _phetCore = _interopRequireDefault(require("./phetCore.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
// Copyright 2019-2024, University of Colorado Boulder

/**
 * Swap the values of two keys on an object, but only if the value is defined
 *
 * @example
 * swapObjectKeys( { x: 4,y: 3 }, 'x', 'y' ) -> { x: 4, y:3 }
 * swapObjectKeys( { x: 4 }, 'x', 'y' ) -> { y:4 }
 * swapObjectKeys( { x: 4, y: undefined }, 'x', 'y' ) -> { x: undefined, y:4 }
 * swapObjectKeys( { otherStuff: 'hi' }, 'x', 'y' ) -> { otherStuff: 'hi' }
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

// Get a unique object reference to compare against. This is preferable to comparing against `undefined` because
// that doesn't differentiate between and object with a key that has a value of undefined, `{x:undefined}` verses
// `{}` in which `x === undefined` also.
var placeholderObject = {};
function swapObjectKeys(object, keyName1, keyName2) {
  var placeholderWithType = placeholderObject;

  // store both values into temp vars before trying to overwrite onto the object
  var value1 = placeholderWithType;
  var value2 = placeholderWithType;
  if (object.hasOwnProperty(keyName1)) {
    value1 = object[keyName1];
  }
  if (object.hasOwnProperty(keyName2)) {
    value2 = object[keyName2];
  }

  // If the value changed, then swap the keys
  if (value1 !== placeholderObject) {
    object[keyName2] = value1;
  } else {
    // if not defined, then make sure it is removed
    delete object[keyName2];
  }

  // If the value changed, then swap the keys
  if (value2 !== placeholderObject) {
    object[keyName1] = value2;
  } else {
    // if not defined, then make sure it is removed
    delete object[keyName1];
  }
  return object; // for chaining
}
_phetCore["default"].register('swapObjectKeys', swapObjectKeys);
var _default = exports["default"] = swapObjectKeys;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcGhldENvcmUiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJwbGFjZWhvbGRlck9iamVjdCIsInN3YXBPYmplY3RLZXlzIiwib2JqZWN0Iiwia2V5TmFtZTEiLCJrZXlOYW1lMiIsInBsYWNlaG9sZGVyV2l0aFR5cGUiLCJ2YWx1ZTEiLCJ2YWx1ZTIiLCJoYXNPd25Qcm9wZXJ0eSIsInBoZXRDb3JlIiwicmVnaXN0ZXIiLCJfZGVmYXVsdCIsImV4cG9ydHMiXSwic291cmNlcyI6WyJzd2FwT2JqZWN0S2V5cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOS0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBTd2FwIHRoZSB2YWx1ZXMgb2YgdHdvIGtleXMgb24gYW4gb2JqZWN0LCBidXQgb25seSBpZiB0aGUgdmFsdWUgaXMgZGVmaW5lZFxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzd2FwT2JqZWN0S2V5cyggeyB4OiA0LHk6IDMgfSwgJ3gnLCAneScgKSAtPiB7IHg6IDQsIHk6MyB9XHJcbiAqIHN3YXBPYmplY3RLZXlzKCB7IHg6IDQgfSwgJ3gnLCAneScgKSAtPiB7IHk6NCB9XHJcbiAqIHN3YXBPYmplY3RLZXlzKCB7IHg6IDQsIHk6IHVuZGVmaW5lZCB9LCAneCcsICd5JyApIC0+IHsgeDogdW5kZWZpbmVkLCB5OjQgfVxyXG4gKiBzd2FwT2JqZWN0S2V5cyggeyBvdGhlclN0dWZmOiAnaGknIH0sICd4JywgJ3knICkgLT4geyBvdGhlclN0dWZmOiAnaGknIH1cclxuICpcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBwaGV0Q29yZSBmcm9tICcuL3BoZXRDb3JlLmpzJztcclxuaW1wb3J0IEludGVudGlvbmFsQW55IGZyb20gJy4vdHlwZXMvSW50ZW50aW9uYWxBbnkuanMnO1xyXG5cclxuLy8gR2V0IGEgdW5pcXVlIG9iamVjdCByZWZlcmVuY2UgdG8gY29tcGFyZSBhZ2FpbnN0LiBUaGlzIGlzIHByZWZlcmFibGUgdG8gY29tcGFyaW5nIGFnYWluc3QgYHVuZGVmaW5lZGAgYmVjYXVzZVxyXG4vLyB0aGF0IGRvZXNuJ3QgZGlmZmVyZW50aWF0ZSBiZXR3ZWVuIGFuZCBvYmplY3Qgd2l0aCBhIGtleSB0aGF0IGhhcyBhIHZhbHVlIG9mIHVuZGVmaW5lZCwgYHt4OnVuZGVmaW5lZH1gIHZlcnNlc1xyXG4vLyBge31gIGluIHdoaWNoIGB4ID09PSB1bmRlZmluZWRgIGFsc28uXHJcbmNvbnN0IHBsYWNlaG9sZGVyT2JqZWN0OiBJbnRlbnRpb25hbEFueSA9IHt9O1xyXG5cclxuZnVuY3Rpb24gc3dhcE9iamVjdEtleXM8VCBleHRlbmRzIG9iamVjdD4oIG9iamVjdDogVCwga2V5TmFtZTE6IGtleW9mIFQsIGtleU5hbWUyOiBrZXlvZiBUICk6IFQge1xyXG4gIGNvbnN0IHBsYWNlaG9sZGVyV2l0aFR5cGU6IFRba2V5b2YgVF0gPSBwbGFjZWhvbGRlck9iamVjdDtcclxuXHJcbiAgLy8gc3RvcmUgYm90aCB2YWx1ZXMgaW50byB0ZW1wIHZhcnMgYmVmb3JlIHRyeWluZyB0byBvdmVyd3JpdGUgb250byB0aGUgb2JqZWN0XHJcbiAgbGV0IHZhbHVlMSA9IHBsYWNlaG9sZGVyV2l0aFR5cGU7XHJcbiAgbGV0IHZhbHVlMiA9IHBsYWNlaG9sZGVyV2l0aFR5cGU7XHJcbiAgaWYgKCBvYmplY3QuaGFzT3duUHJvcGVydHkoIGtleU5hbWUxICkgKSB7XHJcbiAgICB2YWx1ZTEgPSBvYmplY3RbIGtleU5hbWUxIF07XHJcbiAgfVxyXG4gIGlmICggb2JqZWN0Lmhhc093blByb3BlcnR5KCBrZXlOYW1lMiApICkge1xyXG4gICAgdmFsdWUyID0gb2JqZWN0WyBrZXlOYW1lMiBdO1xyXG4gIH1cclxuXHJcbiAgLy8gSWYgdGhlIHZhbHVlIGNoYW5nZWQsIHRoZW4gc3dhcCB0aGUga2V5c1xyXG4gIGlmICggdmFsdWUxICE9PSBwbGFjZWhvbGRlck9iamVjdCApIHtcclxuICAgIG9iamVjdFsga2V5TmFtZTIgXSA9IHZhbHVlMTtcclxuICB9XHJcbiAgZWxzZSB7XHJcblxyXG4gICAgLy8gaWYgbm90IGRlZmluZWQsIHRoZW4gbWFrZSBzdXJlIGl0IGlzIHJlbW92ZWRcclxuICAgIGRlbGV0ZSBvYmplY3RbIGtleU5hbWUyIF07XHJcbiAgfVxyXG5cclxuICAvLyBJZiB0aGUgdmFsdWUgY2hhbmdlZCwgdGhlbiBzd2FwIHRoZSBrZXlzXHJcbiAgaWYgKCB2YWx1ZTIgIT09IHBsYWNlaG9sZGVyT2JqZWN0ICkge1xyXG4gICAgb2JqZWN0WyBrZXlOYW1lMSBdID0gdmFsdWUyO1xyXG4gIH1cclxuICBlbHNlIHtcclxuXHJcbiAgICAvLyBpZiBub3QgZGVmaW5lZCwgdGhlbiBtYWtlIHN1cmUgaXQgaXMgcmVtb3ZlZFxyXG4gICAgZGVsZXRlIG9iamVjdFsga2V5TmFtZTEgXTtcclxuICB9XHJcbiAgcmV0dXJuIG9iamVjdDsgLy8gZm9yIGNoYWluaW5nXHJcbn1cclxuXHJcbnBoZXRDb3JlLnJlZ2lzdGVyKCAnc3dhcE9iamVjdEtleXMnLCBzd2FwT2JqZWN0S2V5cyApO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgc3dhcE9iamVjdEtleXM7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFjQSxJQUFBQSxTQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFBcUMsU0FBQUQsdUJBQUFFLEdBQUEsV0FBQUEsR0FBQSxJQUFBQSxHQUFBLENBQUFDLFVBQUEsR0FBQUQsR0FBQSxnQkFBQUEsR0FBQTtBQWRyQzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUtBO0FBQ0E7QUFDQTtBQUNBLElBQU1FLGlCQUFpQyxHQUFHLENBQUMsQ0FBQztBQUU1QyxTQUFTQyxjQUFjQSxDQUFvQkMsTUFBUyxFQUFFQyxRQUFpQixFQUFFQyxRQUFpQixFQUFNO0VBQzlGLElBQU1DLG1CQUErQixHQUFHTCxpQkFBaUI7O0VBRXpEO0VBQ0EsSUFBSU0sTUFBTSxHQUFHRCxtQkFBbUI7RUFDaEMsSUFBSUUsTUFBTSxHQUFHRixtQkFBbUI7RUFDaEMsSUFBS0gsTUFBTSxDQUFDTSxjQUFjLENBQUVMLFFBQVMsQ0FBQyxFQUFHO0lBQ3ZDRyxNQUFNLEdBQUdKLE1BQU0sQ0FBRUMsUUFBUSxDQUFFO0VBQzdCO0VBQ0EsSUFBS0QsTUFBTSxDQUFDTSxjQUFjLENBQUVKLFFBQVMsQ0FBQyxFQUFHO0lBQ3ZDRyxNQUFNLEdBQUdMLE1BQU0sQ0FBRUUsUUFBUSxDQUFFO0VBQzdCOztFQUVBO0VBQ0EsSUFBS0UsTUFBTSxLQUFLTixpQkFBaUIsRUFBRztJQUNsQ0UsTUFBTSxDQUFFRSxRQUFRLENBQUUsR0FBR0UsTUFBTTtFQUM3QixDQUFDLE1BQ0k7SUFFSDtJQUNBLE9BQU9KLE1BQU0sQ0FBRUUsUUFBUSxDQUFFO0VBQzNCOztFQUVBO0VBQ0EsSUFBS0csTUFBTSxLQUFLUCxpQkFBaUIsRUFBRztJQUNsQ0UsTUFBTSxDQUFFQyxRQUFRLENBQUUsR0FBR0ksTUFBTTtFQUM3QixDQUFDLE1BQ0k7SUFFSDtJQUNBLE9BQU9MLE1BQU0sQ0FBRUMsUUFBUSxDQUFFO0VBQzNCO0VBQ0EsT0FBT0QsTUFBTSxDQUFDLENBQUM7QUFDakI7QUFFQU8sb0JBQVEsQ0FBQ0MsUUFBUSxDQUFFLGdCQUFnQixFQUFFVCxjQUFlLENBQUM7QUFBQyxJQUFBVSxRQUFBLEdBQUFDLE9BQUEsY0FFdkNYLGNBQWMiLCJpZ25vcmVMaXN0IjpbXX0=