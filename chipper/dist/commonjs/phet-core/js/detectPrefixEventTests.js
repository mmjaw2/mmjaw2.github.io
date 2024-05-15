"use strict";

var _detectPrefixEvent = _interopRequireDefault(require("./detectPrefixEvent.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
// Copyright 2017-2023, University of Colorado Boulder

/**
 * detectPrefixEvent tests
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

QUnit.module('detectPrefixEvent');
QUnit.test('detectPrefixEvent', function (assert) {
  var obj = {
    onmain: false,
    onmozprop: ''
  };
  assert.equal((0, _detectPrefixEvent["default"])(obj, 'main'), 'main');
  assert.equal((0, _detectPrefixEvent["default"])(obj, 'prop'), 'mozprop');
  assert.equal((0, _detectPrefixEvent["default"])(obj, 'nothing'), undefined);
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZGV0ZWN0UHJlZml4RXZlbnQiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJRVW5pdCIsIm1vZHVsZSIsInRlc3QiLCJhc3NlcnQiLCJvbm1haW4iLCJvbm1venByb3AiLCJlcXVhbCIsImRldGVjdFByZWZpeEV2ZW50IiwidW5kZWZpbmVkIl0sInNvdXJjZXMiOlsiZGV0ZWN0UHJlZml4RXZlbnRUZXN0cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNy0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBkZXRlY3RQcmVmaXhFdmVudCB0ZXN0c1xyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBkZXRlY3RQcmVmaXhFdmVudCBmcm9tICcuL2RldGVjdFByZWZpeEV2ZW50LmpzJztcclxuXHJcblFVbml0Lm1vZHVsZSggJ2RldGVjdFByZWZpeEV2ZW50JyApO1xyXG5cclxuUVVuaXQudGVzdCggJ2RldGVjdFByZWZpeEV2ZW50JywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCBvYmogPSB7XHJcbiAgICBvbm1haW46IGZhbHNlLFxyXG4gICAgb25tb3pwcm9wOiAnJ1xyXG4gIH07XHJcblxyXG4gIGFzc2VydC5lcXVhbCggZGV0ZWN0UHJlZml4RXZlbnQoIG9iaiwgJ21haW4nICksICdtYWluJyApO1xyXG4gIGFzc2VydC5lcXVhbCggZGV0ZWN0UHJlZml4RXZlbnQoIG9iaiwgJ3Byb3AnICksICdtb3pwcm9wJyApO1xyXG4gIGFzc2VydC5lcXVhbCggZGV0ZWN0UHJlZml4RXZlbnQoIG9iaiwgJ25vdGhpbmcnICksIHVuZGVmaW5lZCApO1xyXG59ICk7Il0sIm1hcHBpbmdzIjoiOztBQVNBLElBQUFBLGtCQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFBdUQsU0FBQUQsdUJBQUFFLEdBQUEsV0FBQUEsR0FBQSxJQUFBQSxHQUFBLENBQUFDLFVBQUEsR0FBQUQsR0FBQSxnQkFBQUEsR0FBQTtBQVR2RDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBSUFFLEtBQUssQ0FBQ0MsTUFBTSxDQUFFLG1CQUFvQixDQUFDO0FBRW5DRCxLQUFLLENBQUNFLElBQUksQ0FBRSxtQkFBbUIsRUFBRSxVQUFBQyxNQUFNLEVBQUk7RUFDekMsSUFBTUwsR0FBRyxHQUFHO0lBQ1ZNLE1BQU0sRUFBRSxLQUFLO0lBQ2JDLFNBQVMsRUFBRTtFQUNiLENBQUM7RUFFREYsTUFBTSxDQUFDRyxLQUFLLENBQUUsSUFBQUMsNkJBQWlCLEVBQUVULEdBQUcsRUFBRSxNQUFPLENBQUMsRUFBRSxNQUFPLENBQUM7RUFDeERLLE1BQU0sQ0FBQ0csS0FBSyxDQUFFLElBQUFDLDZCQUFpQixFQUFFVCxHQUFHLEVBQUUsTUFBTyxDQUFDLEVBQUUsU0FBVSxDQUFDO0VBQzNESyxNQUFNLENBQUNHLEtBQUssQ0FBRSxJQUFBQyw2QkFBaUIsRUFBRVQsR0FBRyxFQUFFLFNBQVUsQ0FBQyxFQUFFVSxTQUFVLENBQUM7QUFDaEUsQ0FBRSxDQUFDIiwiaWdub3JlTGlzdCI6W119