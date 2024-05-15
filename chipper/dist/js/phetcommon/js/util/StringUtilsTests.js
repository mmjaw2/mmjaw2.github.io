// Copyright 2017-2021, University of Colorado Boulder

/**
 * StringUtils tests
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import StringUtils from './StringUtils.js';
QUnit.module('StringUtils');
QUnit.test('capitalize', assert => {
  assert.equal(StringUtils.capitalize('hello'), 'Hello', 'word should be capitalized');
});

// See https://github.com/phetsims/phetcommon/issues/36
QUnit.test('fillIn', assert => {
  assert.equal(StringUtils.fillIn('no placeholders here', {
    name: 'Fred'
  }), 'no placeholders here', '0 placeholders');
  assert.equal(StringUtils.fillIn('{{name}} is smart', {
    name: 'Fred'
  }), 'Fred is smart', '1 placeholder');
  assert.equal(StringUtils.fillIn('{{name}} is {{age}} years old', {
    name: 'Fred',
    age: 23
  }), 'Fred is 23 years old', '> 1 placeholders');
  assert.equal(StringUtils.fillIn('{{name}} is {{age}} years old', {
    name: 'Fred',
    age: 23,
    height: 60
  }), 'Fred is 23 years old', 'extra value in hash is ignored');
  assert.equal(StringUtils.fillIn('{{name}} is {{age}} years old {really}', {
    name: 'Fred',
    age: 23
  }), 'Fred is 23 years old {really}', 'OK to use curly braces in the string');
  assert.equal(StringUtils.fillIn('{{value}} {{units}}', {
    units: 'm'
  }), '{{value}} m', 'OK to omit a placeholder value');
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTdHJpbmdVdGlscyIsIlFVbml0IiwibW9kdWxlIiwidGVzdCIsImFzc2VydCIsImVxdWFsIiwiY2FwaXRhbGl6ZSIsImZpbGxJbiIsIm5hbWUiLCJhZ2UiLCJoZWlnaHQiLCJ1bml0cyJdLCJzb3VyY2VzIjpbIlN0cmluZ1V0aWxzVGVzdHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTctMjAyMSwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogU3RyaW5nVXRpbHMgdGVzdHNcclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgU3RyaW5nVXRpbHMgZnJvbSAnLi9TdHJpbmdVdGlscy5qcyc7XHJcblxyXG5RVW5pdC5tb2R1bGUoICdTdHJpbmdVdGlscycgKTtcclxuXHJcblFVbml0LnRlc3QoICdjYXBpdGFsaXplJywgYXNzZXJ0ID0+IHtcclxuICBhc3NlcnQuZXF1YWwoIFN0cmluZ1V0aWxzLmNhcGl0YWxpemUoICdoZWxsbycgKSwgJ0hlbGxvJywgJ3dvcmQgc2hvdWxkIGJlIGNhcGl0YWxpemVkJyApO1xyXG59ICk7XHJcblxyXG4vLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXRjb21tb24vaXNzdWVzLzM2XHJcblFVbml0LnRlc3QoICdmaWxsSW4nLCBhc3NlcnQgPT4ge1xyXG5cclxuICBhc3NlcnQuZXF1YWwoIFN0cmluZ1V0aWxzLmZpbGxJbiggJ25vIHBsYWNlaG9sZGVycyBoZXJlJywgeyBuYW1lOiAnRnJlZCcgfSApLFxyXG4gICAgJ25vIHBsYWNlaG9sZGVycyBoZXJlJywgJzAgcGxhY2Vob2xkZXJzJyApO1xyXG4gIGFzc2VydC5lcXVhbCggU3RyaW5nVXRpbHMuZmlsbEluKCAne3tuYW1lfX0gaXMgc21hcnQnLCB7IG5hbWU6ICdGcmVkJyB9ICksXHJcbiAgICAnRnJlZCBpcyBzbWFydCcsICcxIHBsYWNlaG9sZGVyJyApO1xyXG4gIGFzc2VydC5lcXVhbCggU3RyaW5nVXRpbHMuZmlsbEluKCAne3tuYW1lfX0gaXMge3thZ2V9fSB5ZWFycyBvbGQnLCB7XHJcbiAgICBuYW1lOiAnRnJlZCcsXHJcbiAgICBhZ2U6IDIzXHJcbiAgfSApLCAnRnJlZCBpcyAyMyB5ZWFycyBvbGQnLCAnPiAxIHBsYWNlaG9sZGVycycgKTtcclxuICBhc3NlcnQuZXF1YWwoIFN0cmluZ1V0aWxzLmZpbGxJbiggJ3t7bmFtZX19IGlzIHt7YWdlfX0geWVhcnMgb2xkJywge1xyXG4gICAgbmFtZTogJ0ZyZWQnLFxyXG4gICAgYWdlOiAyMyxcclxuICAgIGhlaWdodDogNjBcclxuICB9ICksICdGcmVkIGlzIDIzIHllYXJzIG9sZCcsICdleHRyYSB2YWx1ZSBpbiBoYXNoIGlzIGlnbm9yZWQnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBTdHJpbmdVdGlscy5maWxsSW4oICd7e25hbWV9fSBpcyB7e2FnZX19IHllYXJzIG9sZCB7cmVhbGx5fScsIHtcclxuICAgIG5hbWU6ICdGcmVkJyxcclxuICAgIGFnZTogMjNcclxuICB9ICksICdGcmVkIGlzIDIzIHllYXJzIG9sZCB7cmVhbGx5fScsICdPSyB0byB1c2UgY3VybHkgYnJhY2VzIGluIHRoZSBzdHJpbmcnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBTdHJpbmdVdGlscy5maWxsSW4oICd7e3ZhbHVlfX0ge3t1bml0c319JywgeyB1bml0czogJ20nIH0gKSxcclxuICAgICd7e3ZhbHVlfX0gbScsICdPSyB0byBvbWl0IGEgcGxhY2Vob2xkZXIgdmFsdWUnICk7XHJcbn0gKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxXQUFXLE1BQU0sa0JBQWtCO0FBRTFDQyxLQUFLLENBQUNDLE1BQU0sQ0FBRSxhQUFjLENBQUM7QUFFN0JELEtBQUssQ0FBQ0UsSUFBSSxDQUFFLFlBQVksRUFBRUMsTUFBTSxJQUFJO0VBQ2xDQSxNQUFNLENBQUNDLEtBQUssQ0FBRUwsV0FBVyxDQUFDTSxVQUFVLENBQUUsT0FBUSxDQUFDLEVBQUUsT0FBTyxFQUFFLDRCQUE2QixDQUFDO0FBQzFGLENBQUUsQ0FBQzs7QUFFSDtBQUNBTCxLQUFLLENBQUNFLElBQUksQ0FBRSxRQUFRLEVBQUVDLE1BQU0sSUFBSTtFQUU5QkEsTUFBTSxDQUFDQyxLQUFLLENBQUVMLFdBQVcsQ0FBQ08sTUFBTSxDQUFFLHNCQUFzQixFQUFFO0lBQUVDLElBQUksRUFBRTtFQUFPLENBQUUsQ0FBQyxFQUMxRSxzQkFBc0IsRUFBRSxnQkFBaUIsQ0FBQztFQUM1Q0osTUFBTSxDQUFDQyxLQUFLLENBQUVMLFdBQVcsQ0FBQ08sTUFBTSxDQUFFLG1CQUFtQixFQUFFO0lBQUVDLElBQUksRUFBRTtFQUFPLENBQUUsQ0FBQyxFQUN2RSxlQUFlLEVBQUUsZUFBZ0IsQ0FBQztFQUNwQ0osTUFBTSxDQUFDQyxLQUFLLENBQUVMLFdBQVcsQ0FBQ08sTUFBTSxDQUFFLCtCQUErQixFQUFFO0lBQ2pFQyxJQUFJLEVBQUUsTUFBTTtJQUNaQyxHQUFHLEVBQUU7RUFDUCxDQUFFLENBQUMsRUFBRSxzQkFBc0IsRUFBRSxrQkFBbUIsQ0FBQztFQUNqREwsTUFBTSxDQUFDQyxLQUFLLENBQUVMLFdBQVcsQ0FBQ08sTUFBTSxDQUFFLCtCQUErQixFQUFFO0lBQ2pFQyxJQUFJLEVBQUUsTUFBTTtJQUNaQyxHQUFHLEVBQUUsRUFBRTtJQUNQQyxNQUFNLEVBQUU7RUFDVixDQUFFLENBQUMsRUFBRSxzQkFBc0IsRUFBRSxnQ0FBaUMsQ0FBQztFQUMvRE4sTUFBTSxDQUFDQyxLQUFLLENBQUVMLFdBQVcsQ0FBQ08sTUFBTSxDQUFFLHdDQUF3QyxFQUFFO0lBQzFFQyxJQUFJLEVBQUUsTUFBTTtJQUNaQyxHQUFHLEVBQUU7RUFDUCxDQUFFLENBQUMsRUFBRSwrQkFBK0IsRUFBRSxzQ0FBdUMsQ0FBQztFQUM5RUwsTUFBTSxDQUFDQyxLQUFLLENBQUVMLFdBQVcsQ0FBQ08sTUFBTSxDQUFFLHFCQUFxQixFQUFFO0lBQUVJLEtBQUssRUFBRTtFQUFJLENBQUUsQ0FBQyxFQUN2RSxhQUFhLEVBQUUsZ0NBQWlDLENBQUM7QUFDckQsQ0FBRSxDQUFDIiwiaWdub3JlTGlzdCI6W119