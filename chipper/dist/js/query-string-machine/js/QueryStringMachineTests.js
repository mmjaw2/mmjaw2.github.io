// Copyright 2016-2024, University of Colorado Boulder

/**
 * QueryStringMachine tests
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

QUnit.module('QueryStringMachine');

// assert shadows window.assert
QUnit.test('basic tests', assert => {
  const value = 'hello';
  assert.equal(value, 'hello', 'We expect value to be hello');
  const schemaMap = {
    height: {
      type: 'number',
      defaultValue: 6,
      validValues: [4, 5, 6, 7, 8]
    },
    name: {
      type: 'string',
      defaultValue: 'Larry',
      isValidValue: function (str) {
        return str.indexOf('Z') !== 0; // Name cannot start with 'Z'
      }
    },
    custom: {
      type: 'custom',
      defaultValue: 'abc',
      validValues: ['abc', 'def', 'ghi'],
      parse: function (string) {
        return string.toLowerCase();
      }
    },
    isWebGL: {
      type: 'flag'
    },
    screens: {
      type: 'array',
      defaultValue: [],
      elementSchema: {
        type: 'number'
      }
    },
    colors: {
      type: 'array',
      defaultValue: ['red', 'green', 'blue'],
      elementSchema: {
        type: 'string'
      }
    }
  };
  assert.deepEqual(QueryStringMachine.getAllForString(schemaMap, ''), {
    height: 6,
    name: 'Larry',
    custom: 'abc',
    isWebGL: false,
    screens: [],
    colors: ['red', 'green', 'blue']
  }, 'A blank query string should provide defaults');
  assert.deepEqual(QueryStringMachine.getAllForString(schemaMap, '?height=7&isWebGL'), {
    height: 7,
    name: 'Larry',
    custom: 'abc',
    isWebGL: true,
    screens: [],
    colors: ['red', 'green', 'blue']
  }, 'Query parameter values should be parsed');
  assert.deepEqual(QueryStringMachine.getAllForString(schemaMap, '?screens='), {
    height: 6,
    name: 'Larry',
    custom: 'abc',
    isWebGL: false,
    screens: [],
    colors: ['red', 'green', 'blue']
  }, 'No value for screens should result in an empty array ');
  assert.deepEqual(QueryStringMachine.getAllForString(schemaMap, '?height=7&isWebGL&custom=DEF'), {
    height: 7,
    name: 'Larry',
    custom: 'def',
    isWebGL: true,
    screens: [],
    colors: ['red', 'green', 'blue']
  }, 'Custom query parameter should be supported');
  assert.deepEqual(QueryStringMachine.getAllForString(schemaMap, '?isWebGL&screens=1,2,3,5&colors=yellow,orange,pink'), {
    height: 6,
    name: 'Larry',
    custom: 'abc',
    isWebGL: true,
    screens: [1, 2, 3, 5],
    colors: ['yellow', 'orange', 'pink']
  }, 'Array should be parsed');
  const flagSchema = {
    flag: {
      type: 'flag'
    }
  };
  assert.deepEqual(QueryStringMachine.getAllForString(flagSchema, '?flag'), {
    flag: true
  }, 'Flag was provided');
  assert.deepEqual(QueryStringMachine.getAllForString(flagSchema, '?flag='), {
    flag: true
  }, 'Flag was provided with no value');
  assert.throws(() => {
    QueryStringMachine.getAllForString(flagSchema, '?flag=hello');
  }, 'Flags cannot have values');
  assert.throws(() => {
    QueryStringMachine.getAllForString(flagSchema, '?flag=true');
  }, 'Flags cannot have values');

  // Test that isValidValue is supported for arrays with a contrived check (element sum == 7).
  // With an input of [2,4,0], QSM should throw an error, and it should be caught here.
  assert.throws(() => {
    QueryStringMachine.getAllForString({
      numbers: {
        type: 'array',
        elementSchema: {
          type: 'number'
        },
        defaultValue: [1, 6, 0],
        isValidValue: function (arr) {
          // Fake test: check that elements sum to 7 for phetsims/query-string-machine#11
          const arraySum = arr.reduce((a, b) => a + b, 0);
          return arraySum === 7;
        }
      }
    }, '?numbers=2,4,0');
  }, 'Array error handling should catch exception');
  assert.throws(() => {
    QueryStringMachine.getAllForString({
      sim: {
        type: 'string'
      }
    }, '?ea&hello=true');
  }, 'Catch missing required query parameter');
  assert.deepEqual(QueryStringMachine.getForString('hello', {
    type: 'array',
    elementSchema: {
      type: 'number'
    },
    validValues: [[1, 2], [3, 4], [1, 2, 3]],
    defaultValue: [1, 2]
  }, '?ea&hello=1,2,3'), [1, 2, 3], 'Arrays should support defaultValue and validValues');
  assert.throws(() => {
    QueryStringMachine.getForString('hello', {
      type: 'array',
      elementSchema: {
        type: 'number'
      },
      validValues: [[1, 2], [3, 4], [1, 2, 3]],
      defaultValue: [1, 2]
    }, '?ea&hello=1,2,3,99');
  }, 'Catch invalid value for array');
  assert.deepEqual(QueryStringMachine.getForString('screens', {
    type: 'array',
    elementSchema: {
      type: 'number'
    },
    defaultValue: null
  }, '?screens=1,2,3'), [1, 2, 3], 'Test array of numbers');
});

// Tests for our own deepEquals method
QUnit.test('deepEquals', assert => {
  assert.equal(QueryStringMachine.deepEquals(7, 7), true, '7 should equal itself');
  assert.equal(QueryStringMachine.deepEquals(7, 8), false, '7 should not equal 8');
  assert.equal(QueryStringMachine.deepEquals(7, '7'), false, '7 should not equal "7"');
  assert.equal(QueryStringMachine.deepEquals({
    0: 'A'
  }, 'A'), false, 'string tests');
  assert.equal(QueryStringMachine.deepEquals(['hello', 7], ['hello', 7]), true, 'array equality test');
  assert.equal(QueryStringMachine.deepEquals(['hello', 7], ['hello', '7']), false, 'array inequality test');
  assert.equal(QueryStringMachine.deepEquals(['hello', {
    hello: true
  }], ['hello', {
    hello: true
  }]), true, 'object in array inequality test');
  assert.equal(QueryStringMachine.deepEquals(['hello', {
    hello: true
  }], ['hello', {
    hello: false
  }]), false, 'object in array  inequality test');
  assert.equal(QueryStringMachine.deepEquals({
    x: [{
      y: 'hello'
    }, true, 123, 'x']
  }, {
    x: [{
      y: 'hello'
    }, true, 123, 'x']
  }), true, 'object in array  inequality test');
  assert.equal(QueryStringMachine.deepEquals({
    x: [{
      y: 'hello'
    }, true, 123, 'x']
  }, {
    x: [true, {
      y: 'hello'
    }, true, 123, 'x']
  }), false, 'object in array  inequality test');
  assert.equal(QueryStringMachine.deepEquals({
    x: [{
      y: 'hello'
    }, true, 123, 'x']
  }, {
    y: [{
      y: 'hello'
    }, true, 123, 'x']
  }), false, 'object in array  inequality test');
  assert.equal(QueryStringMachine.deepEquals(null, null), true, 'null null');
  assert.equal(QueryStringMachine.deepEquals(null, undefined), false, 'null undefined');
  assert.equal(QueryStringMachine.deepEquals(undefined, undefined), true, 'undefined undefined');
  assert.equal(QueryStringMachine.deepEquals(() => {}, () => {}), false, 'different implementations of similar functions');
  const f = function () {};
  assert.equal(QueryStringMachine.deepEquals(f, f), true, 'same reference function');
});
QUnit.test('removeKeyValuePair', assert => {
  assert.equal(QueryStringMachine.removeKeyValuePair('?time=now', 'time'), '', 'Remove single occurrence');
  assert.equal(QueryStringMachine.removeKeyValuePair('?time=now&place=here', 'time'), '?place=here', 'Remove single occurrence but leave other');
  assert.equal(QueryStringMachine.removeKeyValuePair('?time=now&time=later', 'time'), '', 'Remove multiple occurrences');
  assert.equal(QueryStringMachine.removeKeyValuePair('?time=now&time', 'time'), '', 'Remove multiple occurrences, one with value');
  assert.equal(QueryStringMachine.removeKeyValuePair('?place=here&time=now', 'time'), '?place=here', 'Different order');
  assert.equal(QueryStringMachine.removeKeyValuePair('?time&place', 'time'), '?place', 'Remove with no values');
  assert.equal(QueryStringMachine.removeKeyValuePair('?place&time', 'time'), '?place', 'Remove with no values');
  assert.equal(QueryStringMachine.removeKeyValuePair('?place&time', 'times'), '?place&time', 'Key to remove not present');
  assert.equal(QueryStringMachine.removeKeyValuePair('?sim=ohms-law&phetioValidation&phetioDebug=true', 'fuzz'), '?sim=ohms-law&phetioValidation&phetioDebug=true', 'Key to remove not present');
  assert.equal(QueryStringMachine.removeKeyValuePair('', 'fuzz'), '', 'No search present');
  if (window.assert) {
    assert.throws(() => QueryStringMachine.removeKeyValuePair('time=now', 'time'), 'Not removed if there is no question mark');
  }
});
QUnit.test('appendQueryString', assert => {
  const test = function (url, queryParameters, expected) {
    assert.equal(QueryStringMachine.appendQueryString(url, queryParameters), expected, `${url} + ${queryParameters} should be ok`);
  };
  test('http://localhost.com/hello.html', '', 'http://localhost.com/hello.html');
  test('http://localhost.com/hello.html?hi', '', 'http://localhost.com/hello.html?hi');
  test('http://localhost.com/hello.html', '?test', 'http://localhost.com/hello.html?test');
  test('http://localhost.com/hello.html', '&test', 'http://localhost.com/hello.html?test');
  test('http://localhost.com/hello.html?abc', '', 'http://localhost.com/hello.html?abc');
  test('http://localhost.com/hello.html?abc', '?123', 'http://localhost.com/hello.html?abc&123');
  test('http://localhost.com/hello.html?abc', '&123', 'http://localhost.com/hello.html?abc&123');
  test('?abc', '&123', '?abc&123');
  test('?abc', '123', '?abc&123');
  test('?abc', '123&hi', '?abc&123&hi');
  test('?', 'abc&123&hi', '?&abc&123&hi');
});
QUnit.test('getSingleQueryParameterString', assert => {
  const test = function (url, key, expected) {
    assert.equal(QueryStringMachine.getSingleQueryParameterString(key, url), expected, `${url} + ${key} should be equal`);
  };
  test('http://phet.colorado.com/hello.html?test', 'test', 'test');
  test('http://phet.colorado.com/hello.html?test=hi', 'test', 'test=hi');
  test('http://phet.colorado.com/hello.html?hi&test=hi', 'test', 'test=hi');
  test('?hi&test=hi,4,3,%203', 'test', 'test=hi,4,3,%203');
  const parameterKey = encodeURIComponent('jf4238597043*$(%$*()#%&*#(^_(&');
  const parameterEntire = `${parameterKey}=7`;
  test(`http://something.edu/hello.html?${parameterEntire}`, decodeURIComponent(parameterKey), parameterEntire);
});
QUnit.test('public query parameters should be graceful', assert => {
  // clear any warnings from before this test
  QueryStringMachine.warnings.length = 0;
  const screensSchema = {
    type: 'array',
    elementSchema: {
      type: 'number',
      isValidValue: Number.isInteger
    },
    defaultValue: null,
    isValidValue: function (value) {
      // screen indices cannot be duplicated
      return value === null || value.length === _.uniq(value).length;
    },
    public: true
  };
  let screens = QueryStringMachine.getForString('screens', screensSchema, '?screens=1');
  assert.ok(screens.length === 1);
  assert.ok(screens[0] === 1);
  screens = QueryStringMachine.getForString('screens', screensSchema, '?screens=1.1');
  assert.ok(QueryStringMachine.warnings.length === 1);
  assert.ok(screens === null, 'should have the default value');
  screens = QueryStringMachine.getForString('screens', screensSchema, '?screens=54890,fd');
  assert.ok(QueryStringMachine.warnings.length === 2);
  assert.ok(screens === null, 'should have the default value');
  screens = QueryStringMachine.getForString('screens', screensSchema, '?screens=1,1,1');
  assert.ok(QueryStringMachine.warnings.length === 3);
  assert.ok(screens === null, 'should have the default value');

  // should use the fallback
  screens = QueryStringMachine.getForString('screens', screensSchema, '?screens=Hello1,1,Goose1');
  assert.ok(screens === null, 'should have the default value');
  QueryStringMachine.warnings.length = 0;
  const otherScreensSchema = {
    type: 'array',
    elementSchema: {
      type: 'string',
      validValues: ['first', 'notFirst']
    },
    defaultValue: null,
    isValidValue: function (value) {
      // screen indices cannot be duplicated
      return value === null || value.length === _.uniq(value).length;
    },
    public: true
  };
  screens = QueryStringMachine.getForString('screens', otherScreensSchema, '?screens=first');
  assert.ok(screens.length === 1);
  assert.ok(screens[0] === 'first');
  screens = QueryStringMachine.getForString('screens', otherScreensSchema, '?screens=first,notFirst');
  assert.ok(screens.length === 2);
  assert.ok(screens[0] === 'first');
  assert.ok(screens[1] === 'notFirst');
  screens = QueryStringMachine.getForString('screens', otherScreensSchema, '?screens=firsfdt,notFisrst');
  assert.ok(QueryStringMachine.warnings.length === 1);
  assert.ok(screens === null);
  screens = QueryStringMachine.getForString('screens', otherScreensSchema, '?screens=firsfdt,1');
  assert.ok(QueryStringMachine.warnings.length === 2);
  assert.ok(screens === null);
  QueryStringMachine.warnings.length = 0;
  const flagSchema = {
    type: 'flag',
    public: true
  };
  let flag = QueryStringMachine.getForString('flag', flagSchema, '?flag=true');
  assert.ok(flag === true);
  assert.ok(QueryStringMachine.warnings.length === 1);
  flag = QueryStringMachine.getForString('flag', flagSchema, '?flag=');
  assert.ok(flag === true);
  assert.ok(QueryStringMachine.warnings.length === 1);
  flag = QueryStringMachine.getForString('flag', flagSchema, '?hello');
  assert.ok(flag === false);
  assert.ok(QueryStringMachine.warnings.length === 1);
  QueryStringMachine.warnings.length = 0;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJRVW5pdCIsIm1vZHVsZSIsInRlc3QiLCJhc3NlcnQiLCJ2YWx1ZSIsImVxdWFsIiwic2NoZW1hTWFwIiwiaGVpZ2h0IiwidHlwZSIsImRlZmF1bHRWYWx1ZSIsInZhbGlkVmFsdWVzIiwibmFtZSIsImlzVmFsaWRWYWx1ZSIsInN0ciIsImluZGV4T2YiLCJjdXN0b20iLCJwYXJzZSIsInN0cmluZyIsInRvTG93ZXJDYXNlIiwiaXNXZWJHTCIsInNjcmVlbnMiLCJlbGVtZW50U2NoZW1hIiwiY29sb3JzIiwiZGVlcEVxdWFsIiwiUXVlcnlTdHJpbmdNYWNoaW5lIiwiZ2V0QWxsRm9yU3RyaW5nIiwiZmxhZ1NjaGVtYSIsImZsYWciLCJ0aHJvd3MiLCJudW1iZXJzIiwiYXJyIiwiYXJyYXlTdW0iLCJyZWR1Y2UiLCJhIiwiYiIsInNpbSIsImdldEZvclN0cmluZyIsImRlZXBFcXVhbHMiLCJoZWxsbyIsIngiLCJ5IiwidW5kZWZpbmVkIiwiZiIsInJlbW92ZUtleVZhbHVlUGFpciIsIndpbmRvdyIsInVybCIsInF1ZXJ5UGFyYW1ldGVycyIsImV4cGVjdGVkIiwiYXBwZW5kUXVlcnlTdHJpbmciLCJrZXkiLCJnZXRTaW5nbGVRdWVyeVBhcmFtZXRlclN0cmluZyIsInBhcmFtZXRlcktleSIsImVuY29kZVVSSUNvbXBvbmVudCIsInBhcmFtZXRlckVudGlyZSIsImRlY29kZVVSSUNvbXBvbmVudCIsIndhcm5pbmdzIiwibGVuZ3RoIiwic2NyZWVuc1NjaGVtYSIsIk51bWJlciIsImlzSW50ZWdlciIsIl8iLCJ1bmlxIiwicHVibGljIiwib2siLCJvdGhlclNjcmVlbnNTY2hlbWEiXSwic291cmNlcyI6WyJRdWVyeVN0cmluZ01hY2hpbmVUZXN0cy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBRdWVyeVN0cmluZ01hY2hpbmUgdGVzdHNcclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5cclxuUVVuaXQubW9kdWxlKCAnUXVlcnlTdHJpbmdNYWNoaW5lJyApO1xyXG5cclxuLy8gYXNzZXJ0IHNoYWRvd3Mgd2luZG93LmFzc2VydFxyXG5RVW5pdC50ZXN0KCAnYmFzaWMgdGVzdHMnLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IHZhbHVlID0gJ2hlbGxvJztcclxuICBhc3NlcnQuZXF1YWwoIHZhbHVlLCAnaGVsbG8nLCAnV2UgZXhwZWN0IHZhbHVlIHRvIGJlIGhlbGxvJyApO1xyXG5cclxuICBjb25zdCBzY2hlbWFNYXAgPSB7XHJcbiAgICBoZWlnaHQ6IHtcclxuICAgICAgdHlwZTogJ251bWJlcicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogNixcclxuICAgICAgdmFsaWRWYWx1ZXM6IFsgNCwgNSwgNiwgNywgOCBdXHJcbiAgICB9LFxyXG4gICAgbmFtZToge1xyXG4gICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgZGVmYXVsdFZhbHVlOiAnTGFycnknLFxyXG4gICAgICBpc1ZhbGlkVmFsdWU6IGZ1bmN0aW9uKCBzdHIgKSB7XHJcbiAgICAgICAgcmV0dXJuICggc3RyLmluZGV4T2YoICdaJyApICE9PSAwICk7IC8vIE5hbWUgY2Fubm90IHN0YXJ0IHdpdGggJ1onXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBjdXN0b206IHtcclxuICAgICAgdHlwZTogJ2N1c3RvbScsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogJ2FiYycsXHJcbiAgICAgIHZhbGlkVmFsdWVzOiBbICdhYmMnLCAnZGVmJywgJ2doaScgXSxcclxuICAgICAgcGFyc2U6IGZ1bmN0aW9uKCBzdHJpbmcgKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0cmluZy50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgaXNXZWJHTDoge1xyXG4gICAgICB0eXBlOiAnZmxhZydcclxuICAgIH0sXHJcbiAgICBzY3JlZW5zOiB7XHJcbiAgICAgIHR5cGU6ICdhcnJheScsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogW10sXHJcbiAgICAgIGVsZW1lbnRTY2hlbWE6IHtcclxuICAgICAgICB0eXBlOiAnbnVtYmVyJ1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgY29sb3JzOiB7XHJcbiAgICAgIHR5cGU6ICdhcnJheScsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogWyAncmVkJywgJ2dyZWVuJywgJ2JsdWUnIF0sXHJcbiAgICAgIGVsZW1lbnRTY2hlbWE6IHtcclxuICAgICAgICB0eXBlOiAnc3RyaW5nJ1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgYXNzZXJ0LmRlZXBFcXVhbCggUXVlcnlTdHJpbmdNYWNoaW5lLmdldEFsbEZvclN0cmluZyggc2NoZW1hTWFwLCAnJyApLCB7XHJcbiAgICBoZWlnaHQ6IDYsXHJcbiAgICBuYW1lOiAnTGFycnknLFxyXG4gICAgY3VzdG9tOiAnYWJjJyxcclxuICAgIGlzV2ViR0w6IGZhbHNlLFxyXG4gICAgc2NyZWVuczogW10sXHJcbiAgICBjb2xvcnM6IFsgJ3JlZCcsICdncmVlbicsICdibHVlJyBdXHJcbiAgfSwgJ0EgYmxhbmsgcXVlcnkgc3RyaW5nIHNob3VsZCBwcm92aWRlIGRlZmF1bHRzJyApO1xyXG5cclxuICBhc3NlcnQuZGVlcEVxdWFsKCBRdWVyeVN0cmluZ01hY2hpbmUuZ2V0QWxsRm9yU3RyaW5nKCBzY2hlbWFNYXAsICc/aGVpZ2h0PTcmaXNXZWJHTCcgKSwge1xyXG4gICAgaGVpZ2h0OiA3LFxyXG4gICAgbmFtZTogJ0xhcnJ5JyxcclxuICAgIGN1c3RvbTogJ2FiYycsXHJcbiAgICBpc1dlYkdMOiB0cnVlLFxyXG4gICAgc2NyZWVuczogW10sXHJcbiAgICBjb2xvcnM6IFsgJ3JlZCcsICdncmVlbicsICdibHVlJyBdXHJcbiAgfSwgJ1F1ZXJ5IHBhcmFtZXRlciB2YWx1ZXMgc2hvdWxkIGJlIHBhcnNlZCcgKTtcclxuXHJcbiAgYXNzZXJ0LmRlZXBFcXVhbCggUXVlcnlTdHJpbmdNYWNoaW5lLmdldEFsbEZvclN0cmluZyggc2NoZW1hTWFwLCAnP3NjcmVlbnM9JyApLCB7XHJcbiAgICBoZWlnaHQ6IDYsXHJcbiAgICBuYW1lOiAnTGFycnknLFxyXG4gICAgY3VzdG9tOiAnYWJjJyxcclxuICAgIGlzV2ViR0w6IGZhbHNlLFxyXG4gICAgc2NyZWVuczogW10sXHJcbiAgICBjb2xvcnM6IFsgJ3JlZCcsICdncmVlbicsICdibHVlJyBdXHJcbiAgfSwgJ05vIHZhbHVlIGZvciBzY3JlZW5zIHNob3VsZCByZXN1bHQgaW4gYW4gZW1wdHkgYXJyYXkgJyApO1xyXG5cclxuICBhc3NlcnQuZGVlcEVxdWFsKCBRdWVyeVN0cmluZ01hY2hpbmUuZ2V0QWxsRm9yU3RyaW5nKCBzY2hlbWFNYXAsICc/aGVpZ2h0PTcmaXNXZWJHTCZjdXN0b209REVGJyApLCB7XHJcbiAgICBoZWlnaHQ6IDcsXHJcbiAgICBuYW1lOiAnTGFycnknLFxyXG4gICAgY3VzdG9tOiAnZGVmJyxcclxuICAgIGlzV2ViR0w6IHRydWUsXHJcbiAgICBzY3JlZW5zOiBbXSxcclxuICAgIGNvbG9yczogWyAncmVkJywgJ2dyZWVuJywgJ2JsdWUnIF1cclxuICB9LCAnQ3VzdG9tIHF1ZXJ5IHBhcmFtZXRlciBzaG91bGQgYmUgc3VwcG9ydGVkJyApO1xyXG5cclxuICBhc3NlcnQuZGVlcEVxdWFsKCBRdWVyeVN0cmluZ01hY2hpbmUuZ2V0QWxsRm9yU3RyaW5nKCBzY2hlbWFNYXAsICc/aXNXZWJHTCZzY3JlZW5zPTEsMiwzLDUmY29sb3JzPXllbGxvdyxvcmFuZ2UscGluaycgKSwge1xyXG4gICAgaGVpZ2h0OiA2LFxyXG4gICAgbmFtZTogJ0xhcnJ5JyxcclxuICAgIGN1c3RvbTogJ2FiYycsXHJcbiAgICBpc1dlYkdMOiB0cnVlLFxyXG4gICAgc2NyZWVuczogWyAxLCAyLCAzLCA1IF0sXHJcbiAgICBjb2xvcnM6IFsgJ3llbGxvdycsICdvcmFuZ2UnLCAncGluaycgXVxyXG4gIH0sICdBcnJheSBzaG91bGQgYmUgcGFyc2VkJyApO1xyXG5cclxuICBjb25zdCBmbGFnU2NoZW1hID0ge1xyXG4gICAgZmxhZzoge1xyXG4gICAgICB0eXBlOiAnZmxhZydcclxuICAgIH1cclxuICB9O1xyXG4gIGFzc2VydC5kZWVwRXF1YWwoIFF1ZXJ5U3RyaW5nTWFjaGluZS5nZXRBbGxGb3JTdHJpbmcoIGZsYWdTY2hlbWEsICc/ZmxhZycgKSwge1xyXG4gICAgZmxhZzogdHJ1ZVxyXG4gIH0sICdGbGFnIHdhcyBwcm92aWRlZCcgKTtcclxuXHJcbiAgYXNzZXJ0LmRlZXBFcXVhbCggUXVlcnlTdHJpbmdNYWNoaW5lLmdldEFsbEZvclN0cmluZyggZmxhZ1NjaGVtYSwgJz9mbGFnPScgKSwge1xyXG4gICAgZmxhZzogdHJ1ZVxyXG4gIH0sICdGbGFnIHdhcyBwcm92aWRlZCB3aXRoIG5vIHZhbHVlJyApO1xyXG5cclxuICBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICBRdWVyeVN0cmluZ01hY2hpbmUuZ2V0QWxsRm9yU3RyaW5nKCBmbGFnU2NoZW1hLCAnP2ZsYWc9aGVsbG8nICk7XHJcbiAgfSwgJ0ZsYWdzIGNhbm5vdCBoYXZlIHZhbHVlcycgKTtcclxuXHJcbiAgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG4gICAgUXVlcnlTdHJpbmdNYWNoaW5lLmdldEFsbEZvclN0cmluZyggZmxhZ1NjaGVtYSwgJz9mbGFnPXRydWUnICk7XHJcbiAgfSwgJ0ZsYWdzIGNhbm5vdCBoYXZlIHZhbHVlcycgKTtcclxuXHJcbiAgLy8gVGVzdCB0aGF0IGlzVmFsaWRWYWx1ZSBpcyBzdXBwb3J0ZWQgZm9yIGFycmF5cyB3aXRoIGEgY29udHJpdmVkIGNoZWNrIChlbGVtZW50IHN1bSA9PSA3KS5cclxuICAvLyBXaXRoIGFuIGlucHV0IG9mIFsyLDQsMF0sIFFTTSBzaG91bGQgdGhyb3cgYW4gZXJyb3IsIGFuZCBpdCBzaG91bGQgYmUgY2F1Z2h0IGhlcmUuXHJcbiAgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG4gICAgUXVlcnlTdHJpbmdNYWNoaW5lLmdldEFsbEZvclN0cmluZygge1xyXG4gICAgICBudW1iZXJzOiB7XHJcbiAgICAgICAgdHlwZTogJ2FycmF5JyxcclxuICAgICAgICBlbGVtZW50U2NoZW1hOiB7XHJcbiAgICAgICAgICB0eXBlOiAnbnVtYmVyJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGVmYXVsdFZhbHVlOiBbIDEsIDYsIDAgXSxcclxuICAgICAgICBpc1ZhbGlkVmFsdWU6IGZ1bmN0aW9uKCBhcnIgKSB7XHJcbiAgICAgICAgICAvLyBGYWtlIHRlc3Q6IGNoZWNrIHRoYXQgZWxlbWVudHMgc3VtIHRvIDcgZm9yIHBoZXRzaW1zL3F1ZXJ5LXN0cmluZy1tYWNoaW5lIzExXHJcbiAgICAgICAgICBjb25zdCBhcnJheVN1bSA9IGFyci5yZWR1Y2UoICggYSwgYiApID0+IGEgKyBiLCAwICk7XHJcbiAgICAgICAgICByZXR1cm4gKCBhcnJheVN1bSA9PT0gNyApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSwgJz9udW1iZXJzPTIsNCwwJyApO1xyXG4gIH0sICdBcnJheSBlcnJvciBoYW5kbGluZyBzaG91bGQgY2F0Y2ggZXhjZXB0aW9uJyApO1xyXG5cclxuICBhc3NlcnQudGhyb3dzKCAoKSA9PiB7XHJcbiAgICBRdWVyeVN0cmluZ01hY2hpbmUuZ2V0QWxsRm9yU3RyaW5nKCB7XHJcbiAgICAgIHNpbToge1xyXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnXHJcbiAgICAgIH1cclxuICAgIH0sICc/ZWEmaGVsbG89dHJ1ZScgKTtcclxuXHJcbiAgfSwgJ0NhdGNoIG1pc3NpbmcgcmVxdWlyZWQgcXVlcnkgcGFyYW1ldGVyJyApO1xyXG5cclxuICBhc3NlcnQuZGVlcEVxdWFsKCBRdWVyeVN0cmluZ01hY2hpbmUuZ2V0Rm9yU3RyaW5nKCAnaGVsbG8nLCB7XHJcbiAgICB0eXBlOiAnYXJyYXknLFxyXG4gICAgZWxlbWVudFNjaGVtYToge1xyXG4gICAgICB0eXBlOiAnbnVtYmVyJ1xyXG4gICAgfSxcclxuICAgIHZhbGlkVmFsdWVzOiBbXHJcbiAgICAgIFsgMSwgMiBdLCBbIDMsIDQgXSwgWyAxLCAyLCAzIF1cclxuICAgIF0sXHJcbiAgICBkZWZhdWx0VmFsdWU6IFsgMSwgMiBdXHJcbiAgfSwgJz9lYSZoZWxsbz0xLDIsMycgKSwgWyAxLCAyLCAzIF0sICdBcnJheXMgc2hvdWxkIHN1cHBvcnQgZGVmYXVsdFZhbHVlIGFuZCB2YWxpZFZhbHVlcycgKTtcclxuXHJcbiAgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG4gICAgUXVlcnlTdHJpbmdNYWNoaW5lLmdldEZvclN0cmluZyggJ2hlbGxvJywge1xyXG4gICAgICB0eXBlOiAnYXJyYXknLFxyXG4gICAgICBlbGVtZW50U2NoZW1hOiB7XHJcbiAgICAgICAgdHlwZTogJ251bWJlcidcclxuICAgICAgfSxcclxuICAgICAgdmFsaWRWYWx1ZXM6IFtcclxuICAgICAgICBbIDEsIDIgXSwgWyAzLCA0IF0sIFsgMSwgMiwgMyBdXHJcbiAgICAgIF0sXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogWyAxLCAyIF1cclxuICAgIH0sICc/ZWEmaGVsbG89MSwyLDMsOTknICk7XHJcbiAgfSwgJ0NhdGNoIGludmFsaWQgdmFsdWUgZm9yIGFycmF5JyApO1xyXG5cclxuICBhc3NlcnQuZGVlcEVxdWFsKCBRdWVyeVN0cmluZ01hY2hpbmUuZ2V0Rm9yU3RyaW5nKCAnc2NyZWVucycsIHtcclxuICAgIHR5cGU6ICdhcnJheScsXHJcbiAgICBlbGVtZW50U2NoZW1hOiB7XHJcbiAgICAgIHR5cGU6ICdudW1iZXInXHJcbiAgICB9LFxyXG4gICAgZGVmYXVsdFZhbHVlOiBudWxsXHJcbiAgfSwgJz9zY3JlZW5zPTEsMiwzJyApLCBbIDEsIDIsIDMgXSwgJ1Rlc3QgYXJyYXkgb2YgbnVtYmVycycgKTtcclxuXHJcbn0gKTtcclxuXHJcbi8vIFRlc3RzIGZvciBvdXIgb3duIGRlZXBFcXVhbHMgbWV0aG9kXHJcblFVbml0LnRlc3QoICdkZWVwRXF1YWxzJywgYXNzZXJ0ID0+IHtcclxuICBhc3NlcnQuZXF1YWwoIFF1ZXJ5U3RyaW5nTWFjaGluZS5kZWVwRXF1YWxzKCA3LCA3ICksIHRydWUsICc3IHNob3VsZCBlcXVhbCBpdHNlbGYnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBRdWVyeVN0cmluZ01hY2hpbmUuZGVlcEVxdWFscyggNywgOCApLCBmYWxzZSwgJzcgc2hvdWxkIG5vdCBlcXVhbCA4JyApO1xyXG4gIGFzc2VydC5lcXVhbCggUXVlcnlTdHJpbmdNYWNoaW5lLmRlZXBFcXVhbHMoIDcsICc3JyApLCBmYWxzZSwgJzcgc2hvdWxkIG5vdCBlcXVhbCBcIjdcIicgKTtcclxuICBhc3NlcnQuZXF1YWwoIFF1ZXJ5U3RyaW5nTWFjaGluZS5kZWVwRXF1YWxzKCB7IDA6ICdBJyB9LCAnQScgKSwgZmFsc2UsICdzdHJpbmcgdGVzdHMnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBRdWVyeVN0cmluZ01hY2hpbmUuZGVlcEVxdWFscyggWyAnaGVsbG8nLCA3IF0sIFsgJ2hlbGxvJywgNyBdICksIHRydWUsICdhcnJheSBlcXVhbGl0eSB0ZXN0JyApO1xyXG4gIGFzc2VydC5lcXVhbCggUXVlcnlTdHJpbmdNYWNoaW5lLmRlZXBFcXVhbHMoIFsgJ2hlbGxvJywgNyBdLCBbICdoZWxsbycsICc3JyBdICksIGZhbHNlLCAnYXJyYXkgaW5lcXVhbGl0eSB0ZXN0JyApO1xyXG4gIGFzc2VydC5lcXVhbCggUXVlcnlTdHJpbmdNYWNoaW5lLmRlZXBFcXVhbHMoIFsgJ2hlbGxvJywgeyBoZWxsbzogdHJ1ZSB9IF0sIFsgJ2hlbGxvJywgeyBoZWxsbzogdHJ1ZSB9IF0gKSwgdHJ1ZSwgJ29iamVjdCBpbiBhcnJheSBpbmVxdWFsaXR5IHRlc3QnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBRdWVyeVN0cmluZ01hY2hpbmUuZGVlcEVxdWFscyggWyAnaGVsbG8nLCB7IGhlbGxvOiB0cnVlIH0gXSwgWyAnaGVsbG8nLCB7IGhlbGxvOiBmYWxzZSB9IF0gKSwgZmFsc2UsICdvYmplY3QgaW4gYXJyYXkgIGluZXF1YWxpdHkgdGVzdCcgKTtcclxuICBhc3NlcnQuZXF1YWwoIFF1ZXJ5U3RyaW5nTWFjaGluZS5kZWVwRXF1YWxzKCB7IHg6IFsgeyB5OiAnaGVsbG8nIH0sIHRydWUsIDEyMywgJ3gnIF0gfSwgeyB4OiBbIHsgeTogJ2hlbGxvJyB9LCB0cnVlLCAxMjMsICd4JyBdIH0gKSwgdHJ1ZSwgJ29iamVjdCBpbiBhcnJheSAgaW5lcXVhbGl0eSB0ZXN0JyApO1xyXG4gIGFzc2VydC5lcXVhbCggUXVlcnlTdHJpbmdNYWNoaW5lLmRlZXBFcXVhbHMoIHsgeDogWyB7IHk6ICdoZWxsbycgfSwgdHJ1ZSwgMTIzLCAneCcgXSB9LCB7IHg6IFsgdHJ1ZSwgeyB5OiAnaGVsbG8nIH0sIHRydWUsIDEyMywgJ3gnIF0gfSApLCBmYWxzZSwgJ29iamVjdCBpbiBhcnJheSAgaW5lcXVhbGl0eSB0ZXN0JyApO1xyXG4gIGFzc2VydC5lcXVhbCggUXVlcnlTdHJpbmdNYWNoaW5lLmRlZXBFcXVhbHMoIHsgeDogWyB7IHk6ICdoZWxsbycgfSwgdHJ1ZSwgMTIzLCAneCcgXSB9LCB7IHk6IFsgeyB5OiAnaGVsbG8nIH0sIHRydWUsIDEyMywgJ3gnIF0gfSApLCBmYWxzZSwgJ29iamVjdCBpbiBhcnJheSAgaW5lcXVhbGl0eSB0ZXN0JyApO1xyXG4gIGFzc2VydC5lcXVhbCggUXVlcnlTdHJpbmdNYWNoaW5lLmRlZXBFcXVhbHMoIG51bGwsIG51bGwgKSwgdHJ1ZSwgJ251bGwgbnVsbCcgKTtcclxuICBhc3NlcnQuZXF1YWwoIFF1ZXJ5U3RyaW5nTWFjaGluZS5kZWVwRXF1YWxzKCBudWxsLCB1bmRlZmluZWQgKSwgZmFsc2UsICdudWxsIHVuZGVmaW5lZCcgKTtcclxuICBhc3NlcnQuZXF1YWwoIFF1ZXJ5U3RyaW5nTWFjaGluZS5kZWVwRXF1YWxzKCB1bmRlZmluZWQsIHVuZGVmaW5lZCApLCB0cnVlLCAndW5kZWZpbmVkIHVuZGVmaW5lZCcgKTtcclxuICBhc3NlcnQuZXF1YWwoIFF1ZXJ5U3RyaW5nTWFjaGluZS5kZWVwRXF1YWxzKCAoKSA9PiB7fSwgKCkgPT4ge30gKSwgZmFsc2UsICdkaWZmZXJlbnQgaW1wbGVtZW50YXRpb25zIG9mIHNpbWlsYXIgZnVuY3Rpb25zJyApO1xyXG4gIGNvbnN0IGYgPSBmdW5jdGlvbigpIHt9O1xyXG4gIGFzc2VydC5lcXVhbCggUXVlcnlTdHJpbmdNYWNoaW5lLmRlZXBFcXVhbHMoIGYsIGYgKSwgdHJ1ZSwgJ3NhbWUgcmVmZXJlbmNlIGZ1bmN0aW9uJyApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAncmVtb3ZlS2V5VmFsdWVQYWlyJywgYXNzZXJ0ID0+IHtcclxuICBhc3NlcnQuZXF1YWwoIFF1ZXJ5U3RyaW5nTWFjaGluZS5yZW1vdmVLZXlWYWx1ZVBhaXIoICc/dGltZT1ub3cnLCAndGltZScgKSwgJycsICdSZW1vdmUgc2luZ2xlIG9jY3VycmVuY2UnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBRdWVyeVN0cmluZ01hY2hpbmUucmVtb3ZlS2V5VmFsdWVQYWlyKCAnP3RpbWU9bm93JnBsYWNlPWhlcmUnLCAndGltZScgKSwgJz9wbGFjZT1oZXJlJywgJ1JlbW92ZSBzaW5nbGUgb2NjdXJyZW5jZSBidXQgbGVhdmUgb3RoZXInICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBRdWVyeVN0cmluZ01hY2hpbmUucmVtb3ZlS2V5VmFsdWVQYWlyKCAnP3RpbWU9bm93JnRpbWU9bGF0ZXInLCAndGltZScgKSwgJycsICdSZW1vdmUgbXVsdGlwbGUgb2NjdXJyZW5jZXMnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBRdWVyeVN0cmluZ01hY2hpbmUucmVtb3ZlS2V5VmFsdWVQYWlyKCAnP3RpbWU9bm93JnRpbWUnLCAndGltZScgKSwgJycsICdSZW1vdmUgbXVsdGlwbGUgb2NjdXJyZW5jZXMsIG9uZSB3aXRoIHZhbHVlJyApO1xyXG4gIGFzc2VydC5lcXVhbCggUXVlcnlTdHJpbmdNYWNoaW5lLnJlbW92ZUtleVZhbHVlUGFpciggJz9wbGFjZT1oZXJlJnRpbWU9bm93JywgJ3RpbWUnICksICc/cGxhY2U9aGVyZScsICdEaWZmZXJlbnQgb3JkZXInICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBRdWVyeVN0cmluZ01hY2hpbmUucmVtb3ZlS2V5VmFsdWVQYWlyKCAnP3RpbWUmcGxhY2UnLCAndGltZScgKSwgJz9wbGFjZScsICdSZW1vdmUgd2l0aCBubyB2YWx1ZXMnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBRdWVyeVN0cmluZ01hY2hpbmUucmVtb3ZlS2V5VmFsdWVQYWlyKCAnP3BsYWNlJnRpbWUnLCAndGltZScgKSwgJz9wbGFjZScsICdSZW1vdmUgd2l0aCBubyB2YWx1ZXMnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBRdWVyeVN0cmluZ01hY2hpbmUucmVtb3ZlS2V5VmFsdWVQYWlyKCAnP3BsYWNlJnRpbWUnLCAndGltZXMnICksICc/cGxhY2UmdGltZScsICdLZXkgdG8gcmVtb3ZlIG5vdCBwcmVzZW50JyApO1xyXG4gIGFzc2VydC5lcXVhbCggUXVlcnlTdHJpbmdNYWNoaW5lLnJlbW92ZUtleVZhbHVlUGFpciggJz9zaW09b2htcy1sYXcmcGhldGlvVmFsaWRhdGlvbiZwaGV0aW9EZWJ1Zz10cnVlJywgJ2Z1enonICksXHJcbiAgICAnP3NpbT1vaG1zLWxhdyZwaGV0aW9WYWxpZGF0aW9uJnBoZXRpb0RlYnVnPXRydWUnLCAnS2V5IHRvIHJlbW92ZSBub3QgcHJlc2VudCcgKTtcclxuICBhc3NlcnQuZXF1YWwoIFF1ZXJ5U3RyaW5nTWFjaGluZS5yZW1vdmVLZXlWYWx1ZVBhaXIoICcnLCAnZnV6eicgKSxcclxuICAgICcnLCAnTm8gc2VhcmNoIHByZXNlbnQnICk7XHJcblxyXG4gIGlmICggd2luZG93LmFzc2VydCApIHtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IFF1ZXJ5U3RyaW5nTWFjaGluZS5yZW1vdmVLZXlWYWx1ZVBhaXIoICd0aW1lPW5vdycsICd0aW1lJyApLCAnTm90IHJlbW92ZWQgaWYgdGhlcmUgaXMgbm8gcXVlc3Rpb24gbWFyaycgKTtcclxuICB9XHJcblxyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnYXBwZW5kUXVlcnlTdHJpbmcnLCBhc3NlcnQgPT4ge1xyXG5cclxuICBjb25zdCB0ZXN0ID0gZnVuY3Rpb24oIHVybCwgcXVlcnlQYXJhbWV0ZXJzLCBleHBlY3RlZCApIHtcclxuICAgIGFzc2VydC5lcXVhbCggUXVlcnlTdHJpbmdNYWNoaW5lLmFwcGVuZFF1ZXJ5U3RyaW5nKCB1cmwsIHF1ZXJ5UGFyYW1ldGVycyApLCBleHBlY3RlZCwgYCR7dXJsfSArICR7cXVlcnlQYXJhbWV0ZXJzfSBzaG91bGQgYmUgb2tgICk7XHJcbiAgfTtcclxuXHJcbiAgdGVzdCggJ2h0dHA6Ly9sb2NhbGhvc3QuY29tL2hlbGxvLmh0bWwnLCAnJywgJ2h0dHA6Ly9sb2NhbGhvc3QuY29tL2hlbGxvLmh0bWwnICk7XHJcbiAgdGVzdCggJ2h0dHA6Ly9sb2NhbGhvc3QuY29tL2hlbGxvLmh0bWw/aGknLCAnJywgJ2h0dHA6Ly9sb2NhbGhvc3QuY29tL2hlbGxvLmh0bWw/aGknICk7XHJcbiAgdGVzdCggJ2h0dHA6Ly9sb2NhbGhvc3QuY29tL2hlbGxvLmh0bWwnLCAnP3Rlc3QnLCAnaHR0cDovL2xvY2FsaG9zdC5jb20vaGVsbG8uaHRtbD90ZXN0JyApO1xyXG4gIHRlc3QoICdodHRwOi8vbG9jYWxob3N0LmNvbS9oZWxsby5odG1sJywgJyZ0ZXN0JywgJ2h0dHA6Ly9sb2NhbGhvc3QuY29tL2hlbGxvLmh0bWw/dGVzdCcgKTtcclxuICB0ZXN0KCAnaHR0cDovL2xvY2FsaG9zdC5jb20vaGVsbG8uaHRtbD9hYmMnLCAnJywgJ2h0dHA6Ly9sb2NhbGhvc3QuY29tL2hlbGxvLmh0bWw/YWJjJyApO1xyXG4gIHRlc3QoICdodHRwOi8vbG9jYWxob3N0LmNvbS9oZWxsby5odG1sP2FiYycsICc/MTIzJywgJ2h0dHA6Ly9sb2NhbGhvc3QuY29tL2hlbGxvLmh0bWw/YWJjJjEyMycgKTtcclxuICB0ZXN0KCAnaHR0cDovL2xvY2FsaG9zdC5jb20vaGVsbG8uaHRtbD9hYmMnLCAnJjEyMycsICdodHRwOi8vbG9jYWxob3N0LmNvbS9oZWxsby5odG1sP2FiYyYxMjMnICk7XHJcbiAgdGVzdCggJz9hYmMnLCAnJjEyMycsICc/YWJjJjEyMycgKTtcclxuICB0ZXN0KCAnP2FiYycsICcxMjMnLCAnP2FiYyYxMjMnICk7XHJcbiAgdGVzdCggJz9hYmMnLCAnMTIzJmhpJywgJz9hYmMmMTIzJmhpJyApO1xyXG4gIHRlc3QoICc/JywgJ2FiYyYxMjMmaGknLCAnPyZhYmMmMTIzJmhpJyApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnZ2V0U2luZ2xlUXVlcnlQYXJhbWV0ZXJTdHJpbmcnLCBhc3NlcnQgPT4ge1xyXG5cclxuICBjb25zdCB0ZXN0ID0gZnVuY3Rpb24oIHVybCwga2V5LCBleHBlY3RlZCApIHtcclxuICAgIGFzc2VydC5lcXVhbCggUXVlcnlTdHJpbmdNYWNoaW5lLmdldFNpbmdsZVF1ZXJ5UGFyYW1ldGVyU3RyaW5nKCBrZXksIHVybCApLCBleHBlY3RlZCwgYCR7dXJsfSArICR7a2V5fSBzaG91bGQgYmUgZXF1YWxgICk7XHJcbiAgfTtcclxuXHJcbiAgdGVzdCggJ2h0dHA6Ly9waGV0LmNvbG9yYWRvLmNvbS9oZWxsby5odG1sP3Rlc3QnLCAndGVzdCcsICd0ZXN0JyApO1xyXG4gIHRlc3QoICdodHRwOi8vcGhldC5jb2xvcmFkby5jb20vaGVsbG8uaHRtbD90ZXN0PWhpJywgJ3Rlc3QnLCAndGVzdD1oaScgKTtcclxuICB0ZXN0KCAnaHR0cDovL3BoZXQuY29sb3JhZG8uY29tL2hlbGxvLmh0bWw/aGkmdGVzdD1oaScsICd0ZXN0JywgJ3Rlc3Q9aGknICk7XHJcbiAgdGVzdCggJz9oaSZ0ZXN0PWhpLDQsMywlMjAzJywgJ3Rlc3QnLCAndGVzdD1oaSw0LDMsJTIwMycgKTtcclxuXHJcbiAgY29uc3QgcGFyYW1ldGVyS2V5ID0gZW5jb2RlVVJJQ29tcG9uZW50KCAnamY0MjM4NTk3MDQzKiQoJSQqKCkjJSYqIyheXygmJyApO1xyXG4gIGNvbnN0IHBhcmFtZXRlckVudGlyZSA9IGAke3BhcmFtZXRlcktleX09N2A7XHJcblxyXG4gIHRlc3QoIGBodHRwOi8vc29tZXRoaW5nLmVkdS9oZWxsby5odG1sPyR7cGFyYW1ldGVyRW50aXJlfWAsIGRlY29kZVVSSUNvbXBvbmVudCggcGFyYW1ldGVyS2V5ICksIHBhcmFtZXRlckVudGlyZSApO1xyXG59ICk7XHJcblFVbml0LnRlc3QoICdwdWJsaWMgcXVlcnkgcGFyYW1ldGVycyBzaG91bGQgYmUgZ3JhY2VmdWwnLCBhc3NlcnQgPT4ge1xyXG5cclxuICAvLyBjbGVhciBhbnkgd2FybmluZ3MgZnJvbSBiZWZvcmUgdGhpcyB0ZXN0XHJcbiAgUXVlcnlTdHJpbmdNYWNoaW5lLndhcm5pbmdzLmxlbmd0aCA9IDA7XHJcblxyXG4gIGNvbnN0IHNjcmVlbnNTY2hlbWEgPSB7XHJcbiAgICB0eXBlOiAnYXJyYXknLFxyXG4gICAgZWxlbWVudFNjaGVtYToge1xyXG4gICAgICB0eXBlOiAnbnVtYmVyJyxcclxuICAgICAgaXNWYWxpZFZhbHVlOiBOdW1iZXIuaXNJbnRlZ2VyXHJcbiAgICB9LFxyXG4gICAgZGVmYXVsdFZhbHVlOiBudWxsLFxyXG4gICAgaXNWYWxpZFZhbHVlOiBmdW5jdGlvbiggdmFsdWUgKSB7XHJcblxyXG4gICAgICAvLyBzY3JlZW4gaW5kaWNlcyBjYW5ub3QgYmUgZHVwbGljYXRlZFxyXG4gICAgICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgKCB2YWx1ZS5sZW5ndGggPT09IF8udW5pcSggdmFsdWUgKS5sZW5ndGggKTtcclxuICAgIH0sXHJcbiAgICBwdWJsaWM6IHRydWVcclxuICB9O1xyXG5cclxuICBsZXQgc2NyZWVucyA9IFF1ZXJ5U3RyaW5nTWFjaGluZS5nZXRGb3JTdHJpbmcoICdzY3JlZW5zJywgc2NyZWVuc1NjaGVtYSwgJz9zY3JlZW5zPTEnICk7XHJcbiAgYXNzZXJ0Lm9rKCBzY3JlZW5zLmxlbmd0aCA9PT0gMSApO1xyXG4gIGFzc2VydC5vayggc2NyZWVuc1sgMCBdID09PSAxICk7XHJcblxyXG4gIHNjcmVlbnMgPSBRdWVyeVN0cmluZ01hY2hpbmUuZ2V0Rm9yU3RyaW5nKCAnc2NyZWVucycsIHNjcmVlbnNTY2hlbWEsICc/c2NyZWVucz0xLjEnICk7XHJcbiAgYXNzZXJ0Lm9rKCBRdWVyeVN0cmluZ01hY2hpbmUud2FybmluZ3MubGVuZ3RoID09PSAxICk7XHJcbiAgYXNzZXJ0Lm9rKCBzY3JlZW5zID09PSBudWxsLCAnc2hvdWxkIGhhdmUgdGhlIGRlZmF1bHQgdmFsdWUnICk7XHJcbiAgc2NyZWVucyA9IFF1ZXJ5U3RyaW5nTWFjaGluZS5nZXRGb3JTdHJpbmcoICdzY3JlZW5zJywgc2NyZWVuc1NjaGVtYSwgJz9zY3JlZW5zPTU0ODkwLGZkJyApO1xyXG4gIGFzc2VydC5vayggUXVlcnlTdHJpbmdNYWNoaW5lLndhcm5pbmdzLmxlbmd0aCA9PT0gMiApO1xyXG4gIGFzc2VydC5vayggc2NyZWVucyA9PT0gbnVsbCwgJ3Nob3VsZCBoYXZlIHRoZSBkZWZhdWx0IHZhbHVlJyApO1xyXG5cclxuICBzY3JlZW5zID0gUXVlcnlTdHJpbmdNYWNoaW5lLmdldEZvclN0cmluZyggJ3NjcmVlbnMnLCBzY3JlZW5zU2NoZW1hLCAnP3NjcmVlbnM9MSwxLDEnICk7XHJcbiAgYXNzZXJ0Lm9rKCBRdWVyeVN0cmluZ01hY2hpbmUud2FybmluZ3MubGVuZ3RoID09PSAzICk7XHJcbiAgYXNzZXJ0Lm9rKCBzY3JlZW5zID09PSBudWxsLCAnc2hvdWxkIGhhdmUgdGhlIGRlZmF1bHQgdmFsdWUnICk7XHJcblxyXG4gIC8vIHNob3VsZCB1c2UgdGhlIGZhbGxiYWNrXHJcbiAgc2NyZWVucyA9IFF1ZXJ5U3RyaW5nTWFjaGluZS5nZXRGb3JTdHJpbmcoICdzY3JlZW5zJywgc2NyZWVuc1NjaGVtYSwgJz9zY3JlZW5zPUhlbGxvMSwxLEdvb3NlMScgKTtcclxuICBhc3NlcnQub2soIHNjcmVlbnMgPT09IG51bGwsICdzaG91bGQgaGF2ZSB0aGUgZGVmYXVsdCB2YWx1ZScgKTtcclxuXHJcbiAgUXVlcnlTdHJpbmdNYWNoaW5lLndhcm5pbmdzLmxlbmd0aCA9IDA7XHJcblxyXG4gIGNvbnN0IG90aGVyU2NyZWVuc1NjaGVtYSA9IHtcclxuICAgIHR5cGU6ICdhcnJheScsXHJcbiAgICBlbGVtZW50U2NoZW1hOiB7XHJcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICB2YWxpZFZhbHVlczogWyAnZmlyc3QnLCAnbm90Rmlyc3QnIF1cclxuICAgIH0sXHJcbiAgICBkZWZhdWx0VmFsdWU6IG51bGwsXHJcbiAgICBpc1ZhbGlkVmFsdWU6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcclxuXHJcbiAgICAgIC8vIHNjcmVlbiBpbmRpY2VzIGNhbm5vdCBiZSBkdXBsaWNhdGVkXHJcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gbnVsbCB8fCAoIHZhbHVlLmxlbmd0aCA9PT0gXy51bmlxKCB2YWx1ZSApLmxlbmd0aCApO1xyXG4gICAgfSxcclxuICAgIHB1YmxpYzogdHJ1ZVxyXG4gIH07XHJcbiAgc2NyZWVucyA9IFF1ZXJ5U3RyaW5nTWFjaGluZS5nZXRGb3JTdHJpbmcoICdzY3JlZW5zJywgb3RoZXJTY3JlZW5zU2NoZW1hLCAnP3NjcmVlbnM9Zmlyc3QnICk7XHJcbiAgYXNzZXJ0Lm9rKCBzY3JlZW5zLmxlbmd0aCA9PT0gMSApO1xyXG4gIGFzc2VydC5vayggc2NyZWVuc1sgMCBdID09PSAnZmlyc3QnICk7XHJcblxyXG4gIHNjcmVlbnMgPSBRdWVyeVN0cmluZ01hY2hpbmUuZ2V0Rm9yU3RyaW5nKCAnc2NyZWVucycsIG90aGVyU2NyZWVuc1NjaGVtYSwgJz9zY3JlZW5zPWZpcnN0LG5vdEZpcnN0JyApO1xyXG4gIGFzc2VydC5vayggc2NyZWVucy5sZW5ndGggPT09IDIgKTtcclxuICBhc3NlcnQub2soIHNjcmVlbnNbIDAgXSA9PT0gJ2ZpcnN0JyApO1xyXG4gIGFzc2VydC5vayggc2NyZWVuc1sgMSBdID09PSAnbm90Rmlyc3QnICk7XHJcblxyXG4gIHNjcmVlbnMgPSBRdWVyeVN0cmluZ01hY2hpbmUuZ2V0Rm9yU3RyaW5nKCAnc2NyZWVucycsIG90aGVyU2NyZWVuc1NjaGVtYSwgJz9zY3JlZW5zPWZpcnNmZHQsbm90RmlzcnN0JyApO1xyXG4gIGFzc2VydC5vayggUXVlcnlTdHJpbmdNYWNoaW5lLndhcm5pbmdzLmxlbmd0aCA9PT0gMSApO1xyXG4gIGFzc2VydC5vayggc2NyZWVucyA9PT0gbnVsbCApO1xyXG5cclxuICBzY3JlZW5zID0gUXVlcnlTdHJpbmdNYWNoaW5lLmdldEZvclN0cmluZyggJ3NjcmVlbnMnLCBvdGhlclNjcmVlbnNTY2hlbWEsICc/c2NyZWVucz1maXJzZmR0LDEnICk7XHJcbiAgYXNzZXJ0Lm9rKCBRdWVyeVN0cmluZ01hY2hpbmUud2FybmluZ3MubGVuZ3RoID09PSAyICk7XHJcbiAgYXNzZXJ0Lm9rKCBzY3JlZW5zID09PSBudWxsICk7XHJcblxyXG4gIFF1ZXJ5U3RyaW5nTWFjaGluZS53YXJuaW5ncy5sZW5ndGggPSAwO1xyXG5cclxuICBjb25zdCBmbGFnU2NoZW1hID0ge1xyXG4gICAgdHlwZTogJ2ZsYWcnLFxyXG4gICAgcHVibGljOiB0cnVlXHJcbiAgfTtcclxuXHJcbiAgbGV0IGZsYWcgPSBRdWVyeVN0cmluZ01hY2hpbmUuZ2V0Rm9yU3RyaW5nKCAnZmxhZycsIGZsYWdTY2hlbWEsICc/ZmxhZz10cnVlJyApO1xyXG4gIGFzc2VydC5vayggZmxhZyA9PT0gdHJ1ZSApO1xyXG4gIGFzc2VydC5vayggUXVlcnlTdHJpbmdNYWNoaW5lLndhcm5pbmdzLmxlbmd0aCA9PT0gMSApO1xyXG5cclxuICBmbGFnID0gUXVlcnlTdHJpbmdNYWNoaW5lLmdldEZvclN0cmluZyggJ2ZsYWcnLCBmbGFnU2NoZW1hLCAnP2ZsYWc9JyApO1xyXG4gIGFzc2VydC5vayggZmxhZyA9PT0gdHJ1ZSApO1xyXG4gIGFzc2VydC5vayggUXVlcnlTdHJpbmdNYWNoaW5lLndhcm5pbmdzLmxlbmd0aCA9PT0gMSApO1xyXG5cclxuICBmbGFnID0gUXVlcnlTdHJpbmdNYWNoaW5lLmdldEZvclN0cmluZyggJ2ZsYWcnLCBmbGFnU2NoZW1hLCAnP2hlbGxvJyApO1xyXG4gIGFzc2VydC5vayggZmxhZyA9PT0gZmFsc2UgKTtcclxuICBhc3NlcnQub2soIFF1ZXJ5U3RyaW5nTWFjaGluZS53YXJuaW5ncy5sZW5ndGggPT09IDEgKTtcclxuXHJcbiAgUXVlcnlTdHJpbmdNYWNoaW5lLndhcm5pbmdzLmxlbmd0aCA9IDA7XHJcbn0gKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBR0FBLEtBQUssQ0FBQ0MsTUFBTSxDQUFFLG9CQUFxQixDQUFDOztBQUVwQztBQUNBRCxLQUFLLENBQUNFLElBQUksQ0FBRSxhQUFhLEVBQUVDLE1BQU0sSUFBSTtFQUNuQyxNQUFNQyxLQUFLLEdBQUcsT0FBTztFQUNyQkQsTUFBTSxDQUFDRSxLQUFLLENBQUVELEtBQUssRUFBRSxPQUFPLEVBQUUsNkJBQThCLENBQUM7RUFFN0QsTUFBTUUsU0FBUyxHQUFHO0lBQ2hCQyxNQUFNLEVBQUU7TUFDTkMsSUFBSSxFQUFFLFFBQVE7TUFDZEMsWUFBWSxFQUFFLENBQUM7TUFDZkMsV0FBVyxFQUFFLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUNEQyxJQUFJLEVBQUU7TUFDSkgsSUFBSSxFQUFFLFFBQVE7TUFDZEMsWUFBWSxFQUFFLE9BQU87TUFDckJHLFlBQVksRUFBRSxTQUFBQSxDQUFVQyxHQUFHLEVBQUc7UUFDNUIsT0FBU0EsR0FBRyxDQUFDQyxPQUFPLENBQUUsR0FBSSxDQUFDLEtBQUssQ0FBQyxDQUFHLENBQUM7TUFDdkM7SUFDRixDQUFDO0lBQ0RDLE1BQU0sRUFBRTtNQUNOUCxJQUFJLEVBQUUsUUFBUTtNQUNkQyxZQUFZLEVBQUUsS0FBSztNQUNuQkMsV0FBVyxFQUFFLENB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