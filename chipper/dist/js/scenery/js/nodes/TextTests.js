// Copyright 2021-2024, University of Colorado Boulder

/**
 * Text tests
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../axon/js/DerivedProperty.js';
import StringProperty from '../../../axon/js/StringProperty.js';
import Text from './Text.js';
QUnit.module('Text');
QUnit.test('Mutually exclusive options', assert => {
  assert.ok(true, 'always true, even when assertions are not on.');
  const stringProperty = new StringProperty('oh boy, here we go.');
  window.assert && assert.throws(() => {
    return new Text({
      // @ts-expect-error for testing
      string: 'hi',
      stringProperty: stringProperty
    });
  }, 'text and stringProperty values do not match');
});
QUnit.test('DerivedProperty stringProperty', assert => {
  assert.ok(true, 'always true, even when assertions are not on.');
  const string = 'oh boy, here we go';
  const stringProperty = new StringProperty(string);
  const extra = '!!';
  const aBitExtraForAStringProperty = new DerivedProperty([stringProperty], value => value + extra);
  const text = new Text(aBitExtraForAStringProperty);
  assert.ok(text.stringProperty.value === string + extra);
  stringProperty.value = string + extra;
  assert.ok(text.string === string + extra + extra);
  window.assert && assert.throws(() => {
    text.string = 'hi';
  }, 'cannot set a derivedProperty');
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJEZXJpdmVkUHJvcGVydHkiLCJTdHJpbmdQcm9wZXJ0eSIsIlRleHQiLCJRVW5pdCIsIm1vZHVsZSIsInRlc3QiLCJhc3NlcnQiLCJvayIsInN0cmluZ1Byb3BlcnR5Iiwid2luZG93IiwidGhyb3dzIiwic3RyaW5nIiwiZXh0cmEiLCJhQml0RXh0cmFGb3JBU3RyaW5nUHJvcGVydHkiLCJ2YWx1ZSIsInRleHQiXSwic291cmNlcyI6WyJUZXh0VGVzdHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVGV4dCB0ZXN0c1xyXG4gKlxyXG4gKiBAYXV0aG9yIE1pY2hhZWwgS2F1em1hbm4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IERlcml2ZWRQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL0Rlcml2ZWRQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBTdHJpbmdQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1N0cmluZ1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IFRleHQgZnJvbSAnLi9UZXh0LmpzJztcclxuXHJcblFVbml0Lm1vZHVsZSggJ1RleHQnICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnTXV0dWFsbHkgZXhjbHVzaXZlIG9wdGlvbnMnLCBhc3NlcnQgPT4ge1xyXG5cclxuICBhc3NlcnQub2soIHRydWUsICdhbHdheXMgdHJ1ZSwgZXZlbiB3aGVuIGFzc2VydGlvbnMgYXJlIG5vdCBvbi4nICk7XHJcblxyXG4gIGNvbnN0IHN0cmluZ1Byb3BlcnR5ID0gbmV3IFN0cmluZ1Byb3BlcnR5KCAnb2ggYm95LCBoZXJlIHdlIGdvLicgKTtcclxuICB3aW5kb3cuYXNzZXJ0ICYmIGFzc2VydC50aHJvd3MoICgpID0+IHtcclxuICAgIHJldHVybiBuZXcgVGV4dCgge1xyXG5cclxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBmb3IgdGVzdGluZ1xyXG4gICAgICBzdHJpbmc6ICdoaScsXHJcbiAgICAgIHN0cmluZ1Byb3BlcnR5OiBzdHJpbmdQcm9wZXJ0eVxyXG4gICAgfSApO1xyXG4gIH0sICd0ZXh0IGFuZCBzdHJpbmdQcm9wZXJ0eSB2YWx1ZXMgZG8gbm90IG1hdGNoJyApO1xyXG5cclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ0Rlcml2ZWRQcm9wZXJ0eSBzdHJpbmdQcm9wZXJ0eScsIGFzc2VydCA9PiB7XHJcblxyXG4gIGFzc2VydC5vayggdHJ1ZSwgJ2Fsd2F5cyB0cnVlLCBldmVuIHdoZW4gYXNzZXJ0aW9ucyBhcmUgbm90IG9uLicgKTtcclxuXHJcbiAgY29uc3Qgc3RyaW5nID0gJ29oIGJveSwgaGVyZSB3ZSBnbyc7XHJcbiAgY29uc3Qgc3RyaW5nUHJvcGVydHkgPSBuZXcgU3RyaW5nUHJvcGVydHkoIHN0cmluZyApO1xyXG5cclxuICBjb25zdCBleHRyYSA9ICchISc7XHJcbiAgY29uc3QgYUJpdEV4dHJhRm9yQVN0cmluZ1Byb3BlcnR5ID0gbmV3IERlcml2ZWRQcm9wZXJ0eSggWyBzdHJpbmdQcm9wZXJ0eSBdLCB2YWx1ZSA9PiB2YWx1ZSArIGV4dHJhICk7XHJcblxyXG4gIGNvbnN0IHRleHQgPSBuZXcgVGV4dCggYUJpdEV4dHJhRm9yQVN0cmluZ1Byb3BlcnR5ICk7XHJcblxyXG4gIGFzc2VydC5vayggdGV4dC5zdHJpbmdQcm9wZXJ0eS52YWx1ZSA9PT0gc3RyaW5nICsgZXh0cmEgKTtcclxuICBzdHJpbmdQcm9wZXJ0eS52YWx1ZSA9IHN0cmluZyArIGV4dHJhO1xyXG4gIGFzc2VydC5vayggdGV4dC5zdHJpbmcgPT09IHN0cmluZyArIGV4dHJhICsgZXh0cmEgKTtcclxuXHJcbiAgd2luZG93LmFzc2VydCAmJiBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICB0ZXh0LnN0cmluZyA9ICdoaSc7XHJcbiAgfSwgJ2Nhbm5vdCBzZXQgYSBkZXJpdmVkUHJvcGVydHknICk7XHJcbn0gKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsZUFBZSxNQUFNLHFDQUFxQztBQUNqRSxPQUFPQyxjQUFjLE1BQU0sb0NBQW9DO0FBQy9ELE9BQU9DLElBQUksTUFBTSxXQUFXO0FBRTVCQyxLQUFLLENBQUNDLE1BQU0sQ0FBRSxNQUFPLENBQUM7QUFFdEJELEtBQUssQ0FBQ0UsSUFBSSxDQUFFLDRCQUE0QixFQUFFQyxNQUFNLElBQUk7RUFFbERBLE1BQU0sQ0FBQ0MsRUFBRSxDQUFFLElBQUksRUFBRSwrQ0FBZ0QsQ0FBQztFQUVsRSxNQUFNQyxjQUFjLEdBQUcsSUFBSVAsY0FBYyxDQUFFLHFCQUFzQixDQUFDO0VBQ2xFUSxNQUFNLENBQUNILE1BQU0sSUFBSUEsTUFBTSxDQUFDSSxNQUFNLENBQUUsTUFBTTtJQUNwQyxPQUFPLElBQUlSLElBQUksQ0FBRTtNQUVmO01BQ0FTLE1BQU0sRUFBRSxJQUFJO01BQ1pILGNBQWMsRUFBRUE7SUFDbEIsQ0FBRSxDQUFDO0VBQ0wsQ0FBQyxFQUFFLDZDQUE4QyxDQUFDO0FBRXBELENBQUUsQ0FBQztBQUVITCxLQUFLLENBQUNFLElBQUksQ0FBRSxnQ0FBZ0MsRUFBRUMsTUFBTSxJQUFJO0VBRXREQSxNQUFNLENBQUNDLEVBQUUsQ0FBRSxJQUFJLEVBQUUsK0NBQWdELENBQUM7RUFFbEUsTUFBTUksTUFBTSxHQUFHLG9CQUFvQjtFQUNuQyxNQUFNSCxjQUFjLEdBQUcsSUFBSVAsY0FBYyxDQUFFVSxNQUFPLENBQUM7RUFFbkQsTUFBTUMsS0FBSyxHQUFHLElBQUk7RUFDbEIsTUFBTUMsMkJBQTJCLEdBQUcsSUFBSWIsZUFBZSxDQUFFLENBQUVRLGNBQWMsQ0FBRSxFQUFFTSxLQUFLLElBQUlBLEtBQUssR0FBR0YsS0FBTSxDQUFDO0VBRXJHLE1BQU1HLElBQUksR0FBRyxJQUFJYixJQUFJLENBQUVXLDJCQUE0QixDQUFDO0VBRXBEUCxNQUFNLENBQUNDLEVBQUUsQ0FBRVEsSUFBSSxDQUFDUCxjQUFjLENBQUNNLEtBQUssS0FBS0gsTUFBTSxHQUFHQyxLQUFNLENBQUM7RUFDekRKLGNBQWMsQ0FBQ00sS0FBSyxHQUFHSCxNQUFNLEdBQUdDLEtBQUs7RUFDckNOLE1BQU0sQ0FBQ0MsRUFBRSxDQUFFUSxJQUFJLENBQUNKLE1BQU0sS0FBS0EsTUFBTSxHQUFHQyxLQUFLLEdBQUdBLEtBQU0sQ0FBQztFQUVuREgsTUFBTSxDQUFDSCxNQUFNLElBQUlBLE1BQU0sQ0FBQ0ksTUFBTSxDQUFFLE1BQU07SUFDcENLLElBQUksQ0FBQ0osTUFBTSxHQUFHLElBQUk7RUFDcEIsQ0FBQyxFQUFFLDhCQUErQixDQUFDO0FBQ3JDLENBQUUsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==