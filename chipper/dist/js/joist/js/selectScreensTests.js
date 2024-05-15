// Copyright 2020-2024, University of Colorado Boulder

/**
 * QUnit tests for ScreenSelector
 *
 * Porting to TS will require re-writing tests to create Screen fixtures.
 *
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */

import selectScreens from './selectScreens.js';
// test screen constants. Since these are tests, it is actually more valuable to typecast instead of making these actual screens.
const a = 'a';
const b = 'b';
const c = 'c';
const hs = 'hs';
const getQueryParameterValues = queryString => {
  // TODO: Get schema from initialize-globals.js instead of duplicating here, see https://github.com/phetsims/chipper/issues/936
  // For documentation, please see initialize-globals
  return QueryStringMachine.getAllForString({
    homeScreen: {
      type: 'boolean',
      defaultValue: true,
      public: true
    },
    initialScreen: {
      type: 'number',
      defaultValue: 0,
      public: true
    },
    screens: {
      type: 'array',
      elementSchema: {
        type: 'number',
        isValidValue: Number.isInteger
      },
      defaultValue: null,
      isValidValue: function (value) {
        return value === null || value.length === _.uniq(value).length && value.length > 0;
      },
      public: true
    }
  }, queryString);
};

/**
 * Formats a message for each testValidScreenSelector result
 */
const formatMessage = (key, expectedResult, result, description) => `expected ${key}: ${expectedResult[key]}, actual ${key}: ${result[key]} for valid selectScreens test ${description}`;

/**
 * Format the query string + all sim screens to uniquely identify the test.
 */
const getDescription = (queryString, allSimScreens) => `${queryString} ${JSON.stringify(allSimScreens)}`;

/**
 * Tests a valid combination of allSimScreens and screens-related query parameters, where the expectedResult should
 * equal the result returned from ScreenSelector.select
 */
const testValidScreenSelector = (queryString, allSimScreens, assert, expectedResult) => {
  const queryParameterValues = getQueryParameterValues(queryString);
  const result = selectScreens(allSimScreens, queryParameterValues.homeScreen, QueryStringMachine.containsKeyForString('homeScreen', queryString), queryParameterValues.initialScreen, QueryStringMachine.containsKeyForString('initialScreen', queryString), queryParameterValues.screens, QueryStringMachine.containsKeyForString('screens', queryString), _.noop, () => hs);
  const description = getDescription(queryString, allSimScreens);

  // test the four return values from selectScreens
  assert.ok(result.homeScreen === expectedResult.homeScreen, formatMessage('homeScreen', expectedResult, result, description));
  assert.ok(result.initialScreen === expectedResult.initialScreen, formatMessage('initialScreen', expectedResult, result, description));
  assert.ok(_.isEqual(result.selectedSimScreens, expectedResult.selectedSimScreens), formatMessage('selectedSimScreens', expectedResult, result, description));
  assert.ok(_.isEqual(result.screens, expectedResult.screens), formatMessage('screens', expectedResult, result, description));
  assert.ok(_.isEqual(result.allScreensCreated, expectedResult.allScreensCreated), formatMessage('allScreensCreated', expectedResult, result, description));
};
QUnit.test('valid selectScreens', async assert => {
  // multi-screen
  testValidScreenSelector('?screens=1', [a, b], assert, {
    homeScreen: null,
    initialScreen: a,
    selectedSimScreens: [a],
    screens: [a],
    allScreensCreated: false
  });
  testValidScreenSelector('?screens=2', [a, b], assert, {
    homeScreen: null,
    initialScreen: b,
    selectedSimScreens: [b],
    screens: [b],
    allScreensCreated: false
  });
  testValidScreenSelector('?screens=1,2', [a, b], assert, {
    homeScreen: hs,
    initialScreen: hs,
    selectedSimScreens: [a, b],
    screens: [hs, a, b],
    allScreensCreated: true
  });
  testValidScreenSelector('?screens=2,1', [a, b], assert, {
    homeScreen: hs,
    initialScreen: hs,
    selectedSimScreens: [b, a],
    screens: [hs, b, a],
    allScreensCreated: true
  });
  testValidScreenSelector('?initialScreen=2&homeScreen=false', [a, b], assert, {
    homeScreen: null,
    initialScreen: b,
    selectedSimScreens: [a, b],
    screens: [a, b],
    allScreensCreated: false
  });
  testValidScreenSelector('?homeScreen=false', [a, b], assert, {
    homeScreen: null,
    initialScreen: a,
    selectedSimScreens: [a, b],
    screens: [a, b],
    allScreensCreated: false
  });
  testValidScreenSelector('?screens=2,1', [a, b, c], assert, {
    homeScreen: hs,
    initialScreen: hs,
    selectedSimScreens: [b, a],
    screens: [hs, b, a],
    allScreensCreated: false
  });
  testValidScreenSelector('?screens=3,1', [a, b, c], assert, {
    homeScreen: hs,
    initialScreen: hs,
    selectedSimScreens: [c, a],
    screens: [hs, c, a],
    allScreensCreated: false
  });
  testValidScreenSelector('?screens=2,3', [a, b, c], assert, {
    homeScreen: hs,
    initialScreen: hs,
    selectedSimScreens: [b, c],
    screens: [hs, b, c],
    allScreensCreated: false
  });
  testValidScreenSelector('?initialScreen=1&homeScreen=false&screens=2,1', [a, b], assert, {
    homeScreen: null,
    initialScreen: a,
    selectedSimScreens: [b, a],
    screens: [b, a],
    allScreensCreated: false
  });
  testValidScreenSelector('?initialScreen=0&homeScreen=true&screens=2,1', [a, b], assert, {
    homeScreen: hs,
    initialScreen: hs,
    selectedSimScreens: [b, a],
    screens: [hs, b, a],
    allScreensCreated: true
  });
  testValidScreenSelector('?initialScreen=1&homeScreen=true&screens=2,1', [a, b], assert, {
    homeScreen: hs,
    initialScreen: a,
    selectedSimScreens: [b, a],
    screens: [hs, b, a],
    allScreensCreated: true
  });
  testValidScreenSelector('?initialScreen=2&homeScreen=true&screens=1,2', [a, b], assert, {
    homeScreen: hs,
    initialScreen: b,
    selectedSimScreens: [a, b],
    screens: [hs, a, b],
    allScreensCreated: true
  });
  testValidScreenSelector('?initialScreen=1&homeScreen=false&screens=1', [a, b], assert, {
    homeScreen: null,
    initialScreen: a,
    selectedSimScreens: [a],
    screens: [a],
    allScreensCreated: false
  });
  testValidScreenSelector('?initialScreen=2&homeScreen=false&screens=2', [a, b], assert, {
    homeScreen: null,
    initialScreen: b,
    selectedSimScreens: [b],
    screens: [b],
    allScreensCreated: false
  });

  // single-screen
  // Like ph-scale-basics_en.html?screens=1
  testValidScreenSelector('?screens=1', [a], assert, {
    homeScreen: null,
    initialScreen: a,
    selectedSimScreens: [a],
    screens: [a],
    allScreensCreated: true
  });
  testValidScreenSelector('?initialScreen=1', [a], assert, {
    homeScreen: null,
    initialScreen: a,
    selectedSimScreens: [a],
    screens: [a],
    allScreensCreated: true
  });
  testValidScreenSelector('?homeScreen=false', [a], assert, {
    homeScreen: null,
    initialScreen: a,
    selectedSimScreens: [a],
    screens: [a],
    allScreensCreated: true
  });
});
QUnit.test('invalid selectScreens (with assertions)', async assert => {
  assert.ok(true, 'At least one assert must run, even if not running with ?ea');

  /**
   * Tests an invalid combination of allSimScreens and screens-related query parameters, where selectScreens should
   * throw an error
   */
  const testInvalidScreenSelector = (queryString, allSimScreens) => {
    const queryParameterValues = getQueryParameterValues(queryString);
    const description = getDescription(queryString, allSimScreens);
    window.assert && assert.throws(() => {
      selectScreens(allSimScreens, queryParameterValues.homeScreen, QueryStringMachine.containsKeyForString('homeScreen', queryString), queryParameterValues.initialScreen, QueryStringMachine.containsKeyForString('initialScreen', queryString), queryParameterValues.screens, QueryStringMachine.containsKeyForString('screens', queryString), _.noop, () => hs);
    }, `expected error for invalid selectScreens test ${description}`);
  };

  // multi-screen
  testInvalidScreenSelector('?screens=0', [a, b]);
  testInvalidScreenSelector('?screens=3', [a, b]);
  testInvalidScreenSelector('?screens=', [a, b]);
  testInvalidScreenSelector('?initialScreen=0&homeScreen=true&screens=1', [a, b]);
  testInvalidScreenSelector('?initialScreen=0&homeScreen=false&screens=0', [a, b]);
  testInvalidScreenSelector('?initialScreen=0&homeScreen=false&screens=2,1', [a, b]);
  testInvalidScreenSelector('?initialScreen=0&homeScreen=false&screens=1', [a, b]);
  testInvalidScreenSelector('?initialScreen=2&homeScreen=false&screens=1', [a, b]);

  // Like ph-scale_en.html?screens=1,4
  testInvalidScreenSelector('?screens=1,4', [a, b, c]);

  // single-screen
  testInvalidScreenSelector('?initialScreen=0', [a]);
  testInvalidScreenSelector('?initialScreen=2', [a]);
  testInvalidScreenSelector('?homeScreen=true', [a]);
  testInvalidScreenSelector('?screens=0', [a]);
  testInvalidScreenSelector('?screens=2', [a]);
  testInvalidScreenSelector('?screens=2', [a]);

  // These contain errors, display warning dialog, and revert to default.
  // like ph-scale-basics_en.html?screens=2,1
  testInvalidScreenSelector('?screens=2,1', [a]);
});

// Public query parameters can't just error out, they need to support adding warnings and setting to a reasonable default, so only run these when assertions are disabled. At the time of writing, the above assertion tests were copied directly into this test, to ensure each of those had a correct fallback default.
QUnit.test('invalid selectScreens (grace without assertions)', async assert => {
  if (window.assert === null) {
    testValidScreenSelector('?screens=1,2,5&initialScreen=4', [a, b, c], assert, {
      homeScreen: hs,
      initialScreen: hs,
      selectedSimScreens: [a, b, c],
      screens: [hs, a, b, c],
      allScreensCreated: true
    });
    testValidScreenSelector('?screens=1,2,5&initialScreen=2', [a, b, c], assert, {
      homeScreen: hs,
      initialScreen: b,
      selectedSimScreens: [a, b, c],
      screens: [hs, a, b, c],
      allScreensCreated: true
    });
    testValidScreenSelector('?screens=1,2&homeScreen=false&initialScreen=7', [a, b, c], assert, {
      homeScreen: null,
      initialScreen: a,
      selectedSimScreens: [a, b],
      screens: [a, b],
      allScreensCreated: false
    });
    testValidScreenSelector('?screens=1,2&initialScreen=7', [a, b, c], assert, {
      homeScreen: hs,
      initialScreen: hs,
      selectedSimScreens: [a, b],
      screens: [hs, a, b],
      allScreensCreated: false
    });

    // multi-screen
    testValidScreenSelector('?screens=0', [a, b], assert, {
      homeScreen: hs,
      initialScreen: hs,
      selectedSimScreens: [a, b],
      screens: [hs, a, b],
      allScreensCreated: true
    });
    testValidScreenSelector('?screens=3', [a, b], assert, {
      homeScreen: hs,
      initialScreen: hs,
      selectedSimScreens: [a, b],
      screens: [hs, a, b],
      allScreensCreated: true
    });
    testValidScreenSelector('?screens=', [a, b], assert, {
      homeScreen: hs,
      initialScreen: hs,
      selectedSimScreens: [a, b],
      screens: [hs, a, b],
      allScreensCreated: true
    });
    testValidScreenSelector('?homeScreen=false&screens=', [a, b], assert, {
      homeScreen: null,
      initialScreen: a,
      selectedSimScreens: [a, b],
      screens: [a, b],
      allScreensCreated: false
    });
    testValidScreenSelector('?initialScreen=0&homeScreen=true&screens=1', [a, b], assert, {
      homeScreen: null,
      initialScreen: a,
      selectedSimScreens: [a],
      screens: [a],
      allScreensCreated: false
    });
    testValidScreenSelector('?initialScreen=0&homeScreen=true&screens=2,1', [a, b], assert, {
      homeScreen: hs,
      initialScreen: hs,
      selectedSimScreens: [b, a],
      screens: [hs, b, a],
      allScreensCreated: true
    });
    testValidScreenSelector('?initialScreen=0&homeScreen=false&screens=0', [a, b], assert, {
      homeScreen: null,
      initialScreen: a,
      selectedSimScreens: [a, b],
      screens: [a, b],
      allScreensCreated: false
    });
    testValidScreenSelector('?initialScreen=1&homeScreen=false&screens=0', [a, b], assert, {
      homeScreen: null,
      initialScreen: a,
      selectedSimScreens: [a, b],
      screens: [a, b],
      allScreensCreated: false
    });
    testValidScreenSelector('?initialScreen=0&homeScreen=false&screens=2,1', [a, b], assert, {
      homeScreen: null,
      initialScreen: b,
      selectedSimScreens: [b, a],
      screens: [b, a],
      allScreensCreated: false
    });
    testValidScreenSelector('?initialScreen=0&homeScreen=false&screens=1', [a, b], assert, {
      homeScreen: null,
      initialScreen: a,
      selectedSimScreens: [a],
      screens: [a],
      allScreensCreated: false
    });
    testValidScreenSelector('?initialScreen=2&homeScreen=false&screens=1', [a, b], assert, {
      homeScreen: null,
      initialScreen: a,
      selectedSimScreens: [a],
      screens: [a],
      allScreensCreated: false
    });

    // Like ph-scale_en.html?screens=1,4
    testValidScreenSelector('?screens=1,4', [a, b, c], assert, {
      homeScreen: hs,
      initialScreen: hs,
      selectedSimScreens: [a, b, c],
      screens: [hs, a, b, c],
      allScreensCreated: true
    });

    // single-screen
    testValidScreenSelector('?initialScreen=0', [a], assert, {
      homeScreen: null,
      initialScreen: a,
      selectedSimScreens: [a],
      screens: [a],
      allScreensCreated: true
    });
    testValidScreenSelector('?initialScreen=2', [a], assert, {
      homeScreen: null,
      initialScreen: a,
      selectedSimScreens: [a],
      screens: [a],
      allScreensCreated: true
    });
    testValidScreenSelector('?homeScreen=true', [a], assert, {
      homeScreen: null,
      initialScreen: a,
      selectedSimScreens: [a],
      screens: [a],
      allScreensCreated: true
    });
    testValidScreenSelector('?screens=0', [a], assert, {
      homeScreen: null,
      initialScreen: a,
      selectedSimScreens: [a],
      screens: [a],
      allScreensCreated: true
    });
    testValidScreenSelector('?screens=2', [a], assert, {
      homeScreen: null,
      initialScreen: a,
      selectedSimScreens: [a],
      screens: [a],
      allScreensCreated: true
    });
    testValidScreenSelector('?screens=2', [a], assert, {
      homeScreen: null,
      initialScreen: a,
      selectedSimScreens: [a],
      screens: [a],
      allScreensCreated: true
    });

    // These contain errors, display warning dialog, and revert to default.
    // like ph-scale-basics_en.html?screens=2,1
    testValidScreenSelector('?screens=2,1', [a], assert, {
      homeScreen: null,
      initialScreen: a,
      selectedSimScreens: [a],
      screens: [a],
      allScreensCreated: true
    });
    testValidScreenSelector('?screens=1.2,Screen2', [a, b, c], assert, {
      homeScreen: hs,
      initialScreen: hs,
      selectedSimScreens: [a, b, c],
      screens: [hs, a, b, c],
      allScreensCreated: true
    });
  } else {
    assert.ok(true, 'cannot test for grace when assertions are enabled');
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJzZWxlY3RTY3JlZW5zIiwiYSIsImIiLCJjIiwiaHMiLCJnZXRRdWVyeVBhcmFtZXRlclZhbHVlcyIsInF1ZXJ5U3RyaW5nIiwiUXVlcnlTdHJpbmdNYWNoaW5lIiwiZ2V0QWxsRm9yU3RyaW5nIiwiaG9tZVNjcmVlbiIsInR5cGUiLCJkZWZhdWx0VmFsdWUiLCJwdWJsaWMiLCJpbml0aWFsU2NyZWVuIiwic2NyZWVucyIsImVsZW1lbnRTY2hlbWEiLCJpc1ZhbGlkVmFsdWUiLCJOdW1iZXIiLCJpc0ludGVnZXIiLCJ2YWx1ZSIsImxlbmd0aCIsIl8iLCJ1bmlxIiwiZm9ybWF0TWVzc2FnZSIsImtleSIsImV4cGVjdGVkUmVzdWx0IiwicmVzdWx0IiwiZGVzY3JpcHRpb24iLCJnZXREZXNjcmlwdGlvbiIsImFsbFNpbVNjcmVlbnMiLCJKU09OIiwic3RyaW5naWZ5IiwidGVzdFZhbGlkU2NyZWVuU2VsZWN0b3IiLCJhc3NlcnQiLCJxdWVyeVBhcmFtZXRlclZhbHVlcyIsImNvbnRhaW5zS2V5Rm9yU3RyaW5nIiwibm9vcCIsIm9rIiwiaXNFcXVhbCIsInNlbGVjdGVkU2ltU2NyZWVucyIsImFsbFNjcmVlbnNDcmVhdGVkIiwiUVVuaXQiLCJ0ZXN0IiwidGVzdEludmFsaWRTY3JlZW5TZWxlY3RvciIsIndpbmRvdyIsInRocm93cyJdLCJzb3VyY2VzIjpbInNlbGVjdFNjcmVlbnNUZXN0cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMC0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBRVW5pdCB0ZXN0cyBmb3IgU2NyZWVuU2VsZWN0b3JcclxuICpcclxuICogUG9ydGluZyB0byBUUyB3aWxsIHJlcXVpcmUgcmUtd3JpdGluZyB0ZXN0cyB0byBjcmVhdGUgU2NyZWVuIGZpeHR1cmVzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIENocmlzIEtsdXNlbmRvcmYgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IHNlbGVjdFNjcmVlbnMsIHsgU2NyZWVuUmV0dXJuVHlwZSB9IGZyb20gJy4vc2VsZWN0U2NyZWVucy5qcyc7XHJcbmltcG9ydCB7IEFueVNjcmVlbiB9IGZyb20gJy4vU2NyZWVuLmpzJztcclxuaW1wb3J0IEhvbWVTY3JlZW4gZnJvbSAnLi9Ib21lU2NyZWVuLmpzJztcclxuXHJcbi8vIHRlc3Qgc2NyZWVuIGNvbnN0YW50cy4gU2luY2UgdGhlc2UgYXJlIHRlc3RzLCBpdCBpcyBhY3R1YWxseSBtb3JlIHZhbHVhYmxlIHRvIHR5cGVjYXN0IGluc3RlYWQgb2YgbWFraW5nIHRoZXNlIGFjdHVhbCBzY3JlZW5zLlxyXG5jb25zdCBhID0gJ2EnIGFzIHVua25vd24gYXMgQW55U2NyZWVuO1xyXG5jb25zdCBiID0gJ2InIGFzIHVua25vd24gYXMgQW55U2NyZWVuO1xyXG5jb25zdCBjID0gJ2MnIGFzIHVua25vd24gYXMgQW55U2NyZWVuO1xyXG5jb25zdCBocyA9ICdocycgYXMgdW5rbm93biBhcyBIb21lU2NyZWVuO1xyXG5cclxuY29uc3QgZ2V0UXVlcnlQYXJhbWV0ZXJWYWx1ZXMgPSAoIHF1ZXJ5U3RyaW5nOiBzdHJpbmcgKSA9PiB7XHJcblxyXG4gIC8vIFRPRE86IEdldCBzY2hlbWEgZnJvbSBpbml0aWFsaXplLWdsb2JhbHMuanMgaW5zdGVhZCBvZiBkdXBsaWNhdGluZyBoZXJlLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzkzNlxyXG4gIC8vIEZvciBkb2N1bWVudGF0aW9uLCBwbGVhc2Ugc2VlIGluaXRpYWxpemUtZ2xvYmFsc1xyXG4gIHJldHVybiBRdWVyeVN0cmluZ01hY2hpbmUuZ2V0QWxsRm9yU3RyaW5nKCB7XHJcblxyXG4gICAgaG9tZVNjcmVlbjoge1xyXG4gICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogdHJ1ZSxcclxuICAgICAgcHVibGljOiB0cnVlXHJcbiAgICB9LFxyXG5cclxuICAgIGluaXRpYWxTY3JlZW46IHtcclxuICAgICAgdHlwZTogJ251bWJlcicsXHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogMCxcclxuICAgICAgcHVibGljOiB0cnVlXHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBzY3JlZW5zOiB7XHJcbiAgICAgIHR5cGU6ICdhcnJheScsXHJcbiAgICAgIGVsZW1lbnRTY2hlbWE6IHtcclxuICAgICAgICB0eXBlOiAnbnVtYmVyJyxcclxuICAgICAgICBpc1ZhbGlkVmFsdWU6IE51bWJlci5pc0ludGVnZXJcclxuICAgICAgfSxcclxuICAgICAgZGVmYXVsdFZhbHVlOiBudWxsLFxyXG4gICAgICBpc1ZhbGlkVmFsdWU6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcclxuICAgICAgICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgKCB2YWx1ZS5sZW5ndGggPT09IF8udW5pcSggdmFsdWUgKS5sZW5ndGggJiYgdmFsdWUubGVuZ3RoID4gMCApO1xyXG4gICAgICB9LFxyXG4gICAgICBwdWJsaWM6IHRydWVcclxuICAgIH1cclxuICB9LCBxdWVyeVN0cmluZyApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZvcm1hdHMgYSBtZXNzYWdlIGZvciBlYWNoIHRlc3RWYWxpZFNjcmVlblNlbGVjdG9yIHJlc3VsdFxyXG4gKi9cclxuY29uc3QgZm9ybWF0TWVzc2FnZSA9ICgga2V5OiBrZXlvZiBTY3JlZW5SZXR1cm5UeXBlLCBleHBlY3RlZFJlc3VsdDogU2NyZWVuUmV0dXJuVHlwZSwgcmVzdWx0OiBTY3JlZW5SZXR1cm5UeXBlLCBkZXNjcmlwdGlvbjogc3RyaW5nICk6IHN0cmluZyA9PlxyXG4gIGBleHBlY3RlZCAke2tleX06ICR7ZXhwZWN0ZWRSZXN1bHRbIGtleSBdfSwgYWN0dWFsICR7a2V5fTogJHtyZXN1bHRbIGtleSBdfSBmb3IgdmFsaWQgc2VsZWN0U2NyZWVucyB0ZXN0ICR7ZGVzY3JpcHRpb259YDtcclxuXHJcbi8qKlxyXG4gKiBGb3JtYXQgdGhlIHF1ZXJ5IHN0cmluZyArIGFsbCBzaW0gc2NyZWVucyB0byB1bmlxdWVseSBpZGVudGlmeSB0aGUgdGVzdC5cclxuICovXHJcbmNvbnN0IGdldERlc2NyaXB0aW9uID0gKCBxdWVyeVN0cmluZzogc3RyaW5nLCBhbGxTaW1TY3JlZW5zOiBBbnlTY3JlZW5bXSApOiBzdHJpbmcgPT4gYCR7cXVlcnlTdHJpbmd9ICR7SlNPTi5zdHJpbmdpZnkoIGFsbFNpbVNjcmVlbnMgKX1gO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBUZXN0cyBhIHZhbGlkIGNvbWJpbmF0aW9uIG9mIGFsbFNpbVNjcmVlbnMgYW5kIHNjcmVlbnMtcmVsYXRlZCBxdWVyeSBwYXJhbWV0ZXJzLCB3aGVyZSB0aGUgZXhwZWN0ZWRSZXN1bHQgc2hvdWxkXHJcbiAqIGVxdWFsIHRoZSByZXN1bHQgcmV0dXJuZWQgZnJvbSBTY3JlZW5TZWxlY3Rvci5zZWxlY3RcclxuICovXHJcbmNvbnN0IHRlc3RWYWxpZFNjcmVlblNlbGVjdG9yID0gKCBxdWVyeVN0cmluZzogc3RyaW5nLCBhbGxTaW1TY3JlZW5zOiBBbnlTY3JlZW5bXSwgYXNzZXJ0OiBBc3NlcnQsIGV4cGVjdGVkUmVzdWx0OiBTY3JlZW5SZXR1cm5UeXBlICkgPT4ge1xyXG4gIGNvbnN0IHF1ZXJ5UGFyYW1ldGVyVmFsdWVzID0gZ2V0UXVlcnlQYXJhbWV0ZXJWYWx1ZXMoIHF1ZXJ5U3RyaW5nICk7XHJcblxyXG4gIGNvbnN0IHJlc3VsdCA9IHNlbGVjdFNjcmVlbnMoXHJcbiAgICBhbGxTaW1TY3JlZW5zLFxyXG4gICAgcXVlcnlQYXJhbWV0ZXJWYWx1ZXMuaG9tZVNjcmVlbixcclxuICAgIFF1ZXJ5U3RyaW5nTWFjaGluZS5jb250YWluc0tleUZvclN0cmluZyggJ2hvbWVTY3JlZW4nLCBxdWVyeVN0cmluZyApLFxyXG4gICAgcXVlcnlQYXJhbWV0ZXJWYWx1ZXMuaW5pdGlhbFNjcmVlbixcclxuICAgIFF1ZXJ5U3RyaW5nTWFjaGluZS5jb250YWluc0tleUZvclN0cmluZyggJ2luaXRpYWxTY3JlZW4nLCBxdWVyeVN0cmluZyApLFxyXG4gICAgcXVlcnlQYXJhbWV0ZXJWYWx1ZXMuc2NyZWVucyxcclxuICAgIFF1ZXJ5U3RyaW5nTWFjaGluZS5jb250YWluc0tleUZvclN0cmluZyggJ3NjcmVlbnMnLCBxdWVyeVN0cmluZyApLFxyXG4gICAgXy5ub29wLFxyXG4gICAgKCkgPT4gaHNcclxuICApO1xyXG5cclxuICBjb25zdCBkZXNjcmlwdGlvbiA9IGdldERlc2NyaXB0aW9uKCBxdWVyeVN0cmluZywgYWxsU2ltU2NyZWVucyApO1xyXG5cclxuICAvLyB0ZXN0IHRoZSBmb3VyIHJldHVybiB2YWx1ZXMgZnJvbSBzZWxlY3RTY3JlZW5zXHJcbiAgYXNzZXJ0Lm9rKCByZXN1bHQuaG9tZVNjcmVlbiA9PT0gZXhwZWN0ZWRSZXN1bHQuaG9tZVNjcmVlbixcclxuICAgIGZvcm1hdE1lc3NhZ2UoICdob21lU2NyZWVuJywgZXhwZWN0ZWRSZXN1bHQsIHJlc3VsdCwgZGVzY3JpcHRpb24gKSApO1xyXG4gIGFzc2VydC5vayggcmVzdWx0LmluaXRpYWxTY3JlZW4gPT09IGV4cGVjdGVkUmVzdWx0LmluaXRpYWxTY3JlZW4sXHJcbiAgICBmb3JtYXRNZXNzYWdlKCAnaW5pdGlhbFNjcmVlbicsIGV4cGVjdGVkUmVzdWx0LCByZXN1bHQsIGRlc2NyaXB0aW9uICkgKTtcclxuICBhc3NlcnQub2soIF8uaXNFcXVhbCggcmVzdWx0LnNlbGVjdGVkU2ltU2NyZWVucywgZXhwZWN0ZWRSZXN1bHQuc2VsZWN0ZWRTaW1TY3JlZW5zICksXHJcbiAgICBmb3JtYXRNZXNzYWdlKCAnc2VsZWN0ZWRTaW1TY3JlZW5zJywgZXhwZWN0ZWRSZXN1bHQsIHJlc3VsdCwgZGVzY3JpcHRpb24gKSApO1xyXG4gIGFzc2VydC5vayggXy5pc0VxdWFsKCByZXN1bHQuc2NyZWVucywgZXhwZWN0ZWRSZXN1bHQuc2NyZWVucyApLFxyXG4gICAgZm9ybWF0TWVzc2FnZSggJ3NjcmVlbnMnLCBleHBlY3RlZFJlc3VsdCwgcmVzdWx0LCBkZXNjcmlwdGlvbiApICk7XHJcblxyXG4gIGFzc2VydC5vayggXy5pc0VxdWFsKCByZXN1bHQuYWxsU2NyZWVuc0NyZWF0ZWQsIGV4cGVjdGVkUmVzdWx0LmFsbFNjcmVlbnNDcmVhdGVkICksXHJcbiAgICBmb3JtYXRNZXNzYWdlKCAnYWxsU2NyZWVuc0NyZWF0ZWQnLCBleHBlY3RlZFJlc3VsdCwgcmVzdWx0LCBkZXNjcmlwdGlvbiApICk7XHJcbn07XHJcblxyXG5RVW5pdC50ZXN0KCAndmFsaWQgc2VsZWN0U2NyZWVucycsIGFzeW5jIGFzc2VydCA9PiB7XHJcblxyXG4gIC8vIG11bHRpLXNjcmVlblxyXG4gIHRlc3RWYWxpZFNjcmVlblNlbGVjdG9yKCAnP3NjcmVlbnM9MScsIFsgYSwgYiBdLCBhc3NlcnQsIHtcclxuICAgIGhvbWVTY3JlZW46IG51bGwsXHJcbiAgICBpbml0aWFsU2NyZWVuOiBhLFxyXG4gICAgc2VsZWN0ZWRTaW1TY3JlZW5zOiBbIGEgXSxcclxuICAgIHNjcmVlbnM6IFsgYSBdLFxyXG4gICAgYWxsU2NyZWVuc0NyZWF0ZWQ6IGZhbHNlXHJcbiAgfSApO1xyXG4gIHRlc3RWYWxpZFNjcmVlblNlbGVjdG9yKCAnP3NjcmVlbnM9MicsIFsgYSwgYiBdLCBhc3NlcnQsIHtcclxuICAgIGhvbWVTY3JlZW46IG51bGwsXHJcbiAgICBpbml0aWFsU2NyZWVuOiBiLFxyXG4gICAgc2VsZWN0ZWRTaW1TY3JlZW5zOiBbIGIgXSxcclxuICAgIHNjcmVlbnM6IFsgYiBdLFxyXG4gICAgYWxsU2NyZWVuc0NyZWF0ZWQ6IGZhbHNlXHJcbiAgfSApO1xyXG4gIHRlc3RWYWxpZFNjcmVlblNlbGVjdG9yKCAnP3NjcmVlbnM9MSwyJywgWyBhLCBiIF0sIGFzc2VydCwge1xyXG4gICAgaG9tZVNjcmVlbjogaHMsXHJcbiAgICBpbml0aWFsU2NyZWVuOiBocyxcclxuICAgIHNlbGVjdGVkU2ltU2NyZWVuczogWyBhLCBiIF0sXHJcbiAgICBzY3JlZW5zOiBbIGhzLCBhLCBiIF0sXHJcbiAgICBhbGxTY3JlZW5zQ3JlYXRlZDogdHJ1ZVxyXG4gIH0gKTtcclxuICB0ZXN0VmFsaWRTY3JlZW5TZWxlY3RvciggJz9zY3JlZW5zPTIsMScsIFsgYSwgYiBdLCBhc3NlcnQsIHtcclxuICAgIGhvbWVTY3JlZW46IGhzLFxyXG4gICAgaW5pdGlhbFNjcmVlbjogaHMsXHJcbiAgICBzZWxlY3RlZFNpbVNjcmVlbnM6IFsgYiwgYSBdLFxyXG4gICAgc2NyZWVuczogWyBocywgYiwgYSBdLFxyXG4gICAgYWxsU2NyZWVuc0NyZWF0ZWQ6IHRydWVcclxuICB9ICk7XHJcbiAgdGVzdFZhbGlkU2NyZWVuU2VsZWN0b3IoICc/aW5pdGlhbFNjcmVlbj0yJmhvbWVTY3JlZW49ZmFsc2UnLCBbIGEsIGIgXSwgYXNzZXJ0LCB7XHJcbiAgICBob21lU2NyZWVuOiBudWxsLFxyXG4gICAgaW5pdGlhbFNjcmVlbjogYixcclxuICAgIHNlbGVjdGVkU2ltU2NyZWVuczogWyBhLCBiIF0sXHJcbiAgICBzY3JlZW5zOiBbIGEsIGIgXSxcclxuICAgIGFsbFNjcmVlbnNDcmVhdGVkOiBmYWxzZVxyXG4gIH0gKTtcclxuICB0ZXN0VmFsaWRTY3JlZW5TZWxlY3RvciggJz9ob21lU2NyZWVuPWZhbHNlJywgWyBhLCBiIF0sIGFzc2VydCwge1xyXG4gICAgaG9tZVNjcmVlbjogbnVsbCxcclxuICAgIGluaXRpYWxTY3JlZW46IGEsXHJcbiAgICBzZWxlY3RlZFNpbVNjcmVlbnM6IFsgYSwgYiBdLFxyXG4gICAgc2NyZWVuczogWyBhLCBiIF0sXHJcbiAgICBhbGxTY3JlZW5zQ3JlYXRlZDogZmFsc2VcclxuICB9ICk7XHJcbiAgdGVzdFZhbGlkU2NyZWVuU2VsZWN0b3IoICc/c2NyZWVucz0yLDEnLCBbIGEsIGIsIGMgXSwgYXNzZXJ0LCB7XHJcbiAgICBob21lU2NyZWVuOiBocyxcclxuICAgIGluaXRpYWxTY3JlZW46IGhzLFxyXG4gICAgc2VsZWN0ZWRTaW1TY3JlZW5zOiBbIGIsIGEgXSxcclxuICAgIHNjcmVlbnM6IFsgaHMsIGIsIGEgXSxcclxuICAgIGFsbFNjcmVlbnNDcmVhdGVkOiBmYWxzZVxyXG4gIH0gKTtcclxuICB0ZXN0VmFsaWRTY3JlZW5TZWxlY3RvciggJz9zY3JlZW5zPTMsMScsIFsgYSwgYiwgYyBdLCBhc3NlcnQsIHtcclxuICAgIGhvbWVTY3JlZW46IGhzLFxyXG4gICAgaW5pdGlhbFNjcmVlbjogaHMsXHJcbiAgICBzZWxlY3RlZFNpbVNjcmVlbnM6IFsgYywgYSBdLFxyXG4gICAgc2NyZWVuczogWyBocywgYywgYSBdLFxyXG4gICAgYWxsU2NyZWVuc0NyZWF0ZWQ6IGZhbHNlXHJcbiAgfSApO1xyXG4gIHRlc3RWYWxpZFNjcmVlblNlbGVjdG9yKCAnP3NjcmVlbnM9MiwzJywgWyBhLCBiLCBjIF0sIGFzc2VydCwge1xyXG4gICAgaG9tZVNjcmVlbjogaHMsXHJcbiAgICBpbml0aWFsU2NyZWVuOiBocyxcclxuICAgIHNlbGVjdGVkU2ltU2NyZWVuczogWyBiLCBjIF0sXHJcbiAgICBzY3JlZW5zOiBbIGhzLCBiLCBjIF0sXHJcbiAgICBhbGxTY3JlZW5zQ3JlYXRlZDogZmFsc2VcclxuICB9ICk7XHJcbiAgdGVzdFZhbGlkU2NyZWVuU2VsZWN0b3IoICc/aW5pdGlhbFNjcmVlbj0xJmhvbWVTY3JlZW49ZmFsc2Umc2NyZWVucz0yLDEnLCBbIGEsIGIgXSwgYXNzZXJ0LCB7XHJcbiAgICBob21lU2NyZWVuOiBudWxsLFxyXG4gICAgaW5pdGlhbFNjcmVlbjogYSxcclxuICAgIHNlbGVjdGVkU2ltU2NyZWVuczogWyBiLCBhIF0sXHJcbiAgICBzY3JlZW5zOiBbIGIsIGEgXSxcclxuICAgIGFsbFNjcmVlbnNDcmVhdGVkOiBmYWxzZVxyXG4gIH0gKTtcclxuICB0ZXN0VmFsaWRTY3JlZW5TZWxlY3RvciggJz9pbml0aWFsU2NyZWVuPTAmaG9tZVNjcmVlbj10cnVlJnNjcmVlbnM9MiwxJywgWyBhLCBiIF0sIGFzc2VydCwge1xyXG4gICAgaG9tZVNjcmVlbjogaHMsXHJcbiAgICBpbml0aWFsU2NyZWVuOiBocyxcclxuICAgIHNlbGVjdGVkU2ltU2NyZWVuczogWyBiLCBhIF0sXHJcbiAgICBzY3JlZW5zOiBbIGhzLCBiLCBhIF0sXHJcbiAgICBhbGxTY3JlZW5zQ3JlYXRlZDogdHJ1ZVxyXG4gIH0gKTtcclxuICB0ZXN0VmFsaWRTY3JlZW5TZWxlY3RvciggJz9pbml0aWFsU2NyZWVuPTEmaG9tZVNjcmVlbj10cnVlJnNjcmVlbnM9MiwxJywgWyBhLCBiIF0sIGFzc2VydCwge1xyXG4gICAgaG9tZVNjcmVlbjogaHMsXHJcbiAgICBpbml0aWFsU2NyZWVuOiBhLFxyXG4gICAgc2VsZWN0ZWRTaW1TY3JlZW5zOiBbIGIsIGEgXSxcclxuICAgIHNjcmVlbnM6IFsgaHMsIGIsIGEgXSxcclxuICAgIGFsbFNjcmVlbnNDcmVhdGVkOiB0cnVlXHJcbiAgfSApO1xyXG4gIHRlc3RWYWxpZFNjcmVlblNlbGVjdG9yKCAnP2luaXRpYWxTY3JlZW49MiZob21lU2NyZWVuPXRydWUmc2NyZWVucz0xLDInLCBbIGEsIGIgXSwgYXNzZXJ0LCB7XHJcbiAgICBob21lU2NyZWVuOiBocyxcclxuICAgIGluaXRpYWxTY3JlZW46IGIsXHJcbiAgICBzZWxlY3RlZFNpbVNjcmVlbnM6IFsgYSwgYiBdLFxyXG4gICAgc2NyZWVuczogWyBocywgYSwgYiBdLFxyXG4gICAgYWxsU2NyZWVuc0NyZWF0ZWQ6IHRydWVcclxuICB9ICk7XHJcbiAgdGVzdFZhbGlkU2NyZWVuU2VsZWN0b3IoICc/aW5pdGlhbFNjcmVlbj0xJmhvbWVTY3JlZW49ZmFsc2Umc2NyZWVucz0xJywgWyBhLCBiIF0sIGFzc2VydCwge1xyXG4gICAgaG9tZVNjcmVlbjogbnVsbCxcclxuICAgIGluaXRpYWxTY3JlZW46IGEsXHJcbiAgICBzZWxlY3RlZFNpbVNjcmVlbnM6IFsgYSBdLFxyXG4gICAgc2NyZWVuczogWyBhIF0sXHJcbiAgICBhbGxTY3JlZW5zQ3JlYXRlZDogZmFsc2VcclxuICB9ICk7XHJcbiAgdGVzdFZhbGlkU2NyZWVuU2VsZWN0b3IoICc/aW5pdGlhbFNjcmVlbj0yJmhvbWVTY3JlZW49ZmFsc2Umc2NyZWVucz0yJywgWyBhLCBiIF0sIGFzc2VydCwge1xyXG4gICAgaG9tZVNjcmVlbjogbnVsbCxcclxuICAgIGluaXRpYWxTY3JlZW46IGIsXHJcbiAgICBzZWxlY3RlZFNpbVNjcmVlbnM6IFsgYiBdLFxyXG4gICAgc2NyZWVuczogWyBiIF0sXHJcbiAgICBhbGxTY3JlZW5zQ3JlYXRlZDogZmFsc2VcclxuICB9ICk7XHJcblxyXG4gIC8vIHNpbmdsZS1zY3JlZW5cclxuICAvLyBMaWtlIHBoLXNjYWxlLWJhc2ljc19lbi5odG1sP3NjcmVlbnM9MVxyXG4gIHRlc3RWYWxpZFNjcmVlblNlbGVjdG9yKCAnP3NjcmVlbnM9MScsIFsgYSBdLCBhc3NlcnQsIHtcclxuICAgIGhvbWVTY3JlZW46IG51bGwsXHJcbiAgICBpbml0aWFsU2NyZWVuOiBhLFxyXG4gICAgc2VsZWN0ZWRTaW1TY3JlZW5zOiBbIGEgXSxcclxuICAgIHNjcmVlbnM6IFsgYSBdLFxyXG4gICAgYWxsU2NyZWVuc0NyZWF0ZWQ6IHRydWVcclxuICB9ICk7XHJcbiAgdGVzdFZhbGlkU2NyZWVuU2VsZWN0b3IoICc/aW5pdGlhbFNjcmVlbj0xJywgWyBhIF0sIGFzc2VydCwge1xyXG4gICAgaG9tZVNjcmVlbjogbnVsbCxcclxuICAgIGluaXRpYWxTY3JlZW46IGEsXHJcbiAgICBzZWxlY3RlZFNpbVNjcmVlbnM6IFsgYSBdLFxyXG4gICAgc2NyZWVuczogWyBhIF0sXHJcbiAgICBhbGxTY3JlZW5zQ3JlYXRlZDogdHJ1ZVxyXG4gIH0gKTtcclxuICB0ZXN0VmFsaWRTY3JlZW5TZWxlY3RvciggJz9ob21lU2NyZWVuPWZhbHNlJywgWyBhIF0sIGFzc2VydCwge1xyXG4gICAgaG9tZVNjcmVlbjogbnVsbCxcclxuICAgIGluaXRpYWxTY3JlZW46IGEsXHJcbiAgICBzZWxlY3RlZFNpbVNjcmVlbnM6IFsgYSBdLFxyXG4gICAgc2NyZWVuczogWyBhIF0sXHJcbiAgICBhbGxTY3JlZW5zQ3JlYXRlZDogdHJ1ZVxyXG4gIH0gKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ2ludmFsaWQgc2VsZWN0U2NyZWVucyAod2l0aCBhc3NlcnRpb25zKScsIGFzeW5jIGFzc2VydCA9PiB7XHJcblxyXG4gIGFzc2VydC5vayggdHJ1ZSwgJ0F0IGxlYXN0IG9uZSBhc3NlcnQgbXVzdCBydW4sIGV2ZW4gaWYgbm90IHJ1bm5pbmcgd2l0aCA/ZWEnICk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRlc3RzIGFuIGludmFsaWQgY29tYmluYXRpb24gb2YgYWxsU2ltU2NyZWVucyBhbmQgc2NyZWVucy1yZWxhdGVkIHF1ZXJ5IHBhcmFtZXRlcnMsIHdoZXJlIHNlbGVjdFNjcmVlbnMgc2hvdWxkXHJcbiAgICogdGhyb3cgYW4gZXJyb3JcclxuICAgKi9cclxuICBjb25zdCB0ZXN0SW52YWxpZFNjcmVlblNlbGVjdG9yID0gKCBxdWVyeVN0cmluZzogc3RyaW5nLCBhbGxTaW1TY3JlZW5zOiBBbnlTY3JlZW5bXSApID0+IHtcclxuICAgIGNvbnN0IHF1ZXJ5UGFyYW1ldGVyVmFsdWVzID0gZ2V0UXVlcnlQYXJhbWV0ZXJWYWx1ZXMoIHF1ZXJ5U3RyaW5nICk7XHJcbiAgICBjb25zdCBkZXNjcmlwdGlvbiA9IGdldERlc2NyaXB0aW9uKCBxdWVyeVN0cmluZywgYWxsU2ltU2NyZWVucyApO1xyXG5cclxuICAgIHdpbmRvdy5hc3NlcnQgJiYgYXNzZXJ0LnRocm93cyggKCkgPT4ge1xyXG4gICAgICBzZWxlY3RTY3JlZW5zKFxyXG4gICAgICAgIGFsbFNpbVNjcmVlbnMsXHJcbiAgICAgICAgcXVlcnlQYXJhbWV0ZXJWYWx1ZXMuaG9tZVNjcmVlbixcclxuICAgICAgICBRdWVyeVN0cmluZ01hY2hpbmUuY29udGFpbnNLZXlGb3JTdHJpbmcoICdob21lU2NyZWVuJywgcXVlcnlTdHJpbmcgKSxcclxuICAgICAgICBxdWVyeVBhcmFtZXRlclZhbHVlcy5pbml0aWFsU2NyZWVuLFxyXG4gICAgICAgIFF1ZXJ5U3RyaW5nTWFjaGluZS5jb250YWluc0tleUZvclN0cmluZyggJ2luaXRpYWxTY3JlZW4nLCBxdWVyeVN0cmluZyApLFxyXG4gICAgICAgIHF1ZXJ5UGFyYW1ldGVyVmFsdWVzLnNjcmVlbnMsXHJcbiAgICAgICAgUXVlcnlTdHJpbmdNYWNoaW5lLmNvbnRhaW5zS2V5Rm9yU3RyaW5nKCAnc2NyZWVucycsIHF1ZXJ5U3RyaW5nICksXHJcbiAgICAgICAgXy5ub29wLFxyXG4gICAgICAgICgpID0+IGhzXHJcbiAgICAgICk7XHJcbiAgICB9LCBgZXhwZWN0ZWQgZXJyb3IgZm9yIGludmFsaWQgc2VsZWN0U2NyZWVucyB0ZXN0ICR7ZGVzY3JpcHRpb259YCApO1xyXG4gIH07XHJcblxyXG4gIC8vIG11bHRpLXNjcmVlblxyXG4gIHRlc3RJbnZhbGlkU2NyZWVuU2VsZWN0b3IoICc/c2NyZWVucz0wJywgWyBhLCBiIF0gKTtcclxuICB0ZXN0SW52YWxpZFNjcmVlblNlbGVjdG9yKCAnP3NjcmVlbnM9MycsIFsgYSwgYiBdICk7XHJcbiAgdGVzdEludmFsaWRTY3JlZW5TZWxlY3RvciggJz9zY3JlZW5zPScsIFsgYSwgYiBdICk7XHJcbiAgdGVzdEludmFsaWRTY3JlZW5TZWxlY3RvciggJz9pbml0aWFsU2NyZWVuPTAmaG9tZVNjcmVlbj10cnVlJnNjcmVlbnM9MScsIFsgYSwgYiBdICk7XHJcbiAgdGVzdEludmFsaWRTY3JlZW5TZWxlY3RvciggJz9pbml0aWFsU2NyZWVuPTAmaG9tZVNjcmVlbj1mYWxzZSZzY3JlZW5zPTAnLCBbIGEsIGIgXSApO1xyXG4gIHRlc3RJbnZhbGlkU2NyZWVuU2VsZWN0b3IoICc/aW5pdGlhbFNjcmVlbj0wJmhvbWVTY3JlZW49ZmFsc2Umc2NyZWVucz0yLDEnLCBbIGEsIGIgXSApO1xyXG4gIHRlc3RJbnZhbGlkU2NyZWVuU2VsZWN0b3IoICc/aW5pdGlhbFNjcmVlbj0wJmhvbWVTY3JlZW49ZmFsc2Umc2NyZWVucz0xJywgWyBhLCBiIF0gKTtcclxuICB0ZXN0SW52YWxpZFNjcmVlblNlbGVjdG9yKCAnP2luaXRpYWxTY3JlZW49MiZob21lU2NyZWVuPWZhbHNlJnNjcmVlbnM9MScsIFsgYSwgYiBdICk7XHJcblxyXG4gIC8vIExpa2UgcGgtc2NhbGVfZW4uaHRtbD9zY3JlZW5zPTEsNFxyXG4gIHRlc3RJbnZhbGlkU2NyZWVuU2VsZWN0b3IoICc/c2NyZWVucz0xLDQnLCBbIGEsIGIsIGMgXSApO1xyXG5cclxuICAvLyBzaW5nbGUtc2NyZWVuXHJcbiAgdGVzdEludmFsaWRTY3JlZW5TZWxlY3RvciggJz9pbml0aWFsU2NyZWVuPTAnLCBbIGEgXSApO1xyXG4gIHRlc3RJbnZhbGlkU2NyZWVuU2VsZWN0b3IoICc/aW5pdGlhbFNjcmVlbj0yJywgWyBhIF0gKTtcclxuICB0ZXN0SW52YWxpZFNjcmVlblNlbGVjdG9yKCAnP2hvbWVTY3JlZW49dHJ1ZScsIFsgYSBdICk7XHJcbiAgdGVzdEludmFsaWRTY3JlZW5TZWxlY3RvciggJz9zY3JlZW5zPTAnLCBbIGEgXSApO1xyXG4gIHRlc3RJbnZhbGlkU2NyZWVuU2VsZWN0b3IoICc/c2NyZWVucz0yJywgWyBhIF0gKTtcclxuXHJcbiAgdGVzdEludmFsaWRTY3JlZW5TZWxlY3RvciggJz9zY3JlZW5zPTInLCBbIGEgXSApO1xyXG5cclxuICAvLyBUaGVzZSBjb250YWluIGVycm9ycywgZGlzcGxheSB3YXJuaW5nIGRpYWxvZywgYW5kIHJldmVydCB0byBkZWZhdWx0LlxyXG4gIC8vIGxpa2UgcGgtc2NhbGUtYmFzaWNzX2VuLmh0bWw/c2NyZWVucz0yLDFcclxuICB0ZXN0SW52YWxpZFNjcmVlblNlbGVjdG9yKCAnP3NjcmVlbnM9MiwxJywgWyBhIF0gKTtcclxufSApO1xyXG5cclxuLy8gUHVibGljIHF1ZXJ5IHBhcmFtZXRlcnMgY2FuJ3QganVzdCBlcnJvciBvdXQsIHRoZXkgbmVlZCB0byBzdXBwb3J0IGFkZGluZyB3YXJuaW5ncyBhbmQgc2V0dGluZyB0byBhIHJlYXNvbmFibGUgZGVmYXVsdCwgc28gb25seSBydW4gdGhlc2Ugd2hlbiBhc3NlcnRpb25zIGFyZSBkaXNhYmxlZC4gQXQgdGhlIHRpbWUgb2Ygd3JpdGluZywgdGhlIGFib3ZlIGFzc2VydGlvbiB0ZXN0cyB3ZXJlIGNvcGllZCBkaXJlY3RseSBpbnRvIHRoaXMgdGVzdCwgdG8gZW5zdXJlIGVhY2ggb2YgdGhvc2UgaGFkIGEgY29ycmVjdCBmYWxsYmFjayBkZWZhdWx0LlxyXG5RVW5pdC50ZXN0KCAnaW52YWxpZCBzZWxlY3RTY3JlZW5zIChncmFjZSB3aXRob3V0IGFzc2VydGlvbnMpJywgYXN5bmMgYXNzZXJ0ID0+IHtcclxuXHJcbiAgaWYgKCB3aW5kb3cuYXNzZXJ0ID09PSBudWxsICkge1xyXG5cclxuICAgIHRlc3RWYWxpZFNjcmVlblNlbGVjdG9yKCAnP3NjcmVlbnM9MSwyLDUmaW5pdGlhbFNjcmVlbj00JywgWyBhLCBiLCBjIF0sIGFzc2VydCwge1xyXG4gICAgICBob21lU2NyZWVuOiBocyxcclxuICAgICAgaW5pdGlhbFNjcmVlbjogaHMsXHJcbiAgICAgIHNlbGVjdGVkU2ltU2NyZWVuczogWyBhLCBiLCBjIF0sXHJcbiAgICAgIHNjcmVlbnM6IFsgaHMsIGEsIGIsIGMgXSxcclxuICAgICAgYWxsU2NyZWVuc0NyZWF0ZWQ6IHRydWVcclxuICAgIH0gKTtcclxuICAgIHRlc3RWYWxpZFNjcmVlblNlbGVjdG9yKCAnP3NjcmVlbnM9MSwyLDUmaW5pdGlhbFNjcmVlbj0yJywgWyBhLCBiLCBjIF0sIGFzc2VydCwge1xyXG4gICAgICBob21lU2NyZWVuOiBocyxcclxuICAgICAgaW5pdGlhbFNjcmVlbjogYixcclxuICAgICAgc2VsZWN0ZWRTaW1TY3JlZW5zOiBbIGEsIGIsIGMgXSxcclxuICAgICAgc2NyZWVuczogWyBocywgYSwgYiwgYyBdLFxyXG4gICAgICBhbGxTY3JlZW5zQ3JlYXRlZDogdHJ1ZVxyXG4gICAgfSApO1xyXG5cclxuICAgIHRlc3RWYWxpZFNjcmVlblNlbGVjdG9yKCAnP3NjcmVlbnM9MSwyJmhvbWVTY3JlZW49ZmFsc2UmaW5pdGlhbFNjcmVlbj03JywgWyBhLCBiLCBjIF0sIGFzc2VydCwge1xyXG4gICAgICBob21lU2NyZWVuOiBudWxsLFxyXG4gICAgICBpbml0aWFsU2NyZWVuOiBhLFxyXG4gICAgICBzZWxlY3RlZFNpbVNjcmVlbnM6IFsgYSwgYiBdLFxyXG4gICAgICBzY3JlZW5zOiBbIGEsIGIgXSxcclxuICAgICAgYWxsU2NyZWVuc0NyZWF0ZWQ6IGZhbHNlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGVzdFZhbGlkU2NyZWVuU2VsZWN0b3IoICc/c2NyZWVucz0xLDImaW5pdGlhbFNjcmVlbj03JywgWyBhLCBiLCBjIF0sIGFzc2VydCwge1xyXG4gICAgICBob21lU2NyZWVuOiBocyxcclxuICAgICAgaW5pdGlhbFNjcmVlbjogaHMsXHJcbiAgICAgIHNlbGVjdGVkU2ltU2NyZWVuczogWyBhLCBiIF0sXHJcbiAgICAgIHNjcmVlbnM6IFsgaHMsIGEsIGIgXSxcclxuICAgICAgYWxsU2NyZWVuc0NyZWF0ZWQ6IGZhbHNlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gbXVsdGktc2NyZWVuXHJcbiAgICB0ZXN0VmFsaWRTY3JlZW5TZWxlY3RvciggJz9zY3JlZW5zPTAnLCBbIGEsIGIgXSwgYXNzZXJ0LCB7XHJcbiAgICAgIGhvbWVTY3JlZW46IGhzLFxyXG4gICAgICBpbml0aWFsU2NyZWVuOiBocyxcclxuICAgICAgc2VsZWN0ZWRTaW1TY3JlZW5zOiBbIGEsIGIgXSxcclxuICAgICAgc2NyZWVuczogWyBocywgYSwgYiBdLFxyXG4gICAgICBhbGxTY3JlZW5zQ3JlYXRlZDogdHJ1ZVxyXG4gICAgfSApO1xyXG4gICAgdGVzdFZhbGlkU2NyZWVuU2VsZWN0b3IoICc/c2NyZWVucz0zJywgWyBhLCBiIF0sIGFzc2VydCwge1xyXG4gICAgICBob21lU2NyZWVuOiBocyxcclxuICAgICAgaW5pdGlhbFNjcmVlbjogaHMsXHJcbiAgICAgIHNlbGVjdGVkU2ltU2NyZWVuczogWyBhLCBiIF0sXHJcbiAgICAgIHNjcmVlbnM6IFsgaHMsIGEsIGIgXSxcclxuICAgICAgYWxsU2NyZWVuc0NyZWF0ZWQ6IHRydWVcclxuICAgIH0gKTtcclxuICAgIHRlc3RWYWxpZFNjcmVlblNlbGVjdG9yKCAnP3NjcmVlbnM9JywgWyBhLCBiIF0sIGFzc2VydCwge1xyXG4gICAgICBob21lU2NyZWVuOiBocyxcclxuICAgICAgaW5pdGlhbFNjcmVlbjogaHMsXHJcbiAgICAgIHNlbGVjdGVkU2ltU2NyZWVuczogWyBhLCBiIF0sXHJcbiAgICAgIHNjcmVlbnM6IFsgaHMsIGEsIGIgXSxcclxuICAgICAgYWxsU2NyZWVuc0NyZWF0ZWQ6IHRydWVcclxuICAgIH0gKTtcclxuICAgIHRlc3RWYWxpZFNjcmVlblNlbGVjdG9yKCAnP2hvbWVTY3JlZW49ZmFsc2Umc2NyZWVucz0nLCBbIGEsIGIgXSwgYXNzZXJ0LCB7XHJcbiAgICAgIGhvbWVTY3JlZW46IG51bGwsXHJcbiAgICAgIGluaXRpYWxTY3JlZW46IGEsXHJcbiAgICAgIHNlbGVjdGVkU2ltU2NyZWVuczogWyBhLCBiIF0sXHJcbiAgICAgIHNjcmVlbnM6IFsgYSwgYiBdLFxyXG4gICAgICBhbGxTY3JlZW5zQ3JlYXRlZDogZmFsc2VcclxuICAgIH0gKTtcclxuICAgIHRlc3RWYWxpZFNjcmVlblNlbGVjdG9yKCAnP2luaXRpYWxTY3JlZW49MCZob21lU2NyZWVuPXRydWUmc2NyZWVucz0xJywgWyBhLCBiIF0sIGFzc2VydCwge1xyXG4gICAgICBob21lU2NyZWVuOiBudWxsLFxyXG4gICAgICBpbml0aWFsU2NyZWVuOiBhLFxyXG4gICAgICBzZWxlY3RlZFNpbVNjcmVlbnM6IFsgYSBdLFxyXG4gICAgICBzY3JlZW5zOiBbIGEgXSxcclxuICAgICAgYWxsU2NyZWVuc0NyZWF0ZWQ6IGZhbHNlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGVzdFZhbGlkU2NyZWVuU2VsZWN0b3IoICc/aW5pdGlhbFNjcmVlbj0wJmhvbWVTY3JlZW49dHJ1ZSZzY3JlZW5zPTIsMScsIFsgYSwgYiBdLCBhc3NlcnQsIHtcclxuICAgICAgaG9tZVNjcmVlbjogaHMsXHJcbiAgICAgIGluaXRpYWxTY3JlZW46IGhzLFxyXG4gICAgICBzZWxlY3RlZFNpbVNjcmVlbnM6IFsgYiwgYSBdLFxyXG4gICAgICBzY3JlZW5zOiBbIGhzLCBiLCBhIF0sXHJcbiAgICAgIGFsbFNjcmVlbnNDcmVhdGVkOiB0cnVlXHJcbiAgICB9ICk7XHJcbiAgICB0ZXN0VmFsaWRTY3JlZW5TZWxlY3RvciggJz9pbml0aWFsU2NyZWVuPTAmaG9tZVNjcmVlbj1mYWxzZSZzY3JlZW5zPTAnLCBbIGEsIGIgXSwgYXNzZXJ0LCB7XHJcbiAgICAgIGhvbWVTY3JlZW46IG51bGwsXHJcbiAgICAgIGluaXRpYWxTY3JlZW46IGEsXHJcbiAgICAgIHNlbGVjdGVkU2ltU2NyZWVuczogWyBhLCBiIF0sXHJcbiAgICAgIHNjcmVlbnM6IFsgYSwgYiBdLFxyXG4gICAgICBhbGxTY3JlZW5zQ3JlYXRlZDogZmFsc2VcclxuICAgIH0gKTtcclxuICAgIHRlc3RWYWxpZFNjcmVlblNlbGVjdG9yKCAnP2luaXRpYWxTY3JlZW49MSZob21lU2NyZWVuPWZhbHNlJnNjcmVlbnM9MCcsIFsgYSwgYiBdLCBhc3NlcnQsIHtcclxuICAgICAgaG9tZVNjcmVlbjogbnVsbCxcclxuICAgICAgaW5pdGlhbFNjcmVlbjogYSxcclxuICAgICAgc2VsZWN0ZWRTaW1TY3JlZW5zOiBbIGEsIGIgXSxcclxuICAgICAgc2NyZWVuczogWyBhLCBiIF0sXHJcbiAgICAgIGFsbFNjcmVlbnNDcmVhdGVkOiBmYWxzZVxyXG4gICAgfSApO1xyXG4gICAgdGVzdFZhbGlkU2NyZWVuU2VsZWN0b3IoICc/aW5pdGlhbFNjcmVlbj0wJmhvbWVTY3JlZW49ZmFsc2Umc2NyZWVucz0yLDEnLCBbIGEsIGIgXSwgYXNzZXJ0LCB7XHJcbiAgICAgIGhvbWVTY3JlZW46IG51bGwsXHJcbiAgICAgIGluaXRpYWxTY3JlZW46IGIsXHJcbiAgICAgIHNlbGVjdGVkU2ltU2NyZWVuczogWyBiLCBhIF0sXHJcbiAgICAgIHNjcmVlbnM6IFsgYiwgYSBdLFxyXG4gICAgICBhbGxTY3JlZW5zQ3JlYXRlZDogZmFsc2VcclxuICAgIH0gKTtcclxuICAgIHRlc3RWYWxpZFNjcmVlblNlbGVjdG9yKCAnP2luaXRpYWxTY3JlZW49MCZob21lU2NyZWVuPWZhbHNlJnNjcmVlbnM9MScsIFsgYSwgYiBdLCBhc3NlcnQsIHtcclxuICAgICAgaG9tZVNjcmVlbjogbnVsbCxcclxuICAgICAgaW5pdGlhbFNjcmVlbjogYSxcclxuICAgICAgc2VsZWN0ZWRTaW1TY3JlZW5zOiBbIGEgXSxcclxuICAgICAgc2NyZWVuczogWyBhIF0sXHJcbiAgICAgIGFsbFNjcmVlbnNDcmVhdGVkOiBmYWxzZVxyXG4gICAgfSApO1xyXG4gICAgdGVzdFZhbGlkU2NyZWVuU2VsZWN0b3IoICc/aW5pdGlhbFNjcmVlbj0yJmhvbWVTY3JlZW49ZmFsc2Umc2NyZWVucz0xJywgWyBhLCBiIF0sIGFzc2VydCwge1xyXG4gICAgICBob21lU2NyZWVuOiBudWxsLFxyXG4gICAgICBpbml0aWFsU2NyZWVuOiBhLFxyXG4gICAgICBzZWxlY3RlZFNpbVNjcmVlbnM6IFsgYSBdLFxyXG4gICAgICBzY3JlZW5zOiBbIGEgXSxcclxuICAgICAgYWxsU2NyZWVuc0NyZWF0ZWQ6IGZhbHNlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gTGlrZSBwaC1zY2FsZV9lbi5odG1sP3NjcmVlbnM9MSw0XHJcbiAgICB0ZXN0VmFsaWRTY3JlZW5TZWxlY3RvciggJz9zY3JlZW5zPTEsNCcsIFsgYSwgYiwgYyBdLCBhc3NlcnQsIHtcclxuICAgICAgaG9tZVNjcmVlbjogaHMsXHJcbiAgICAgIGluaXRpYWxTY3JlZW46IGhzLFxyXG4gICAgICBzZWxlY3RlZFNpbVNjcmVlbnM6IFsgYSwgYiwgYyBdLFxyXG4gICAgICBzY3JlZW5zOiBbIGhzLCBhLCBiLCBjIF0sXHJcbiAgICAgIGFsbFNjcmVlbnNDcmVhdGVkOiB0cnVlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gc2luZ2xlLXNjcmVlblxyXG4gICAgdGVzdFZhbGlkU2NyZWVuU2VsZWN0b3IoICc/aW5pdGlhbFNjcmVlbj0wJywgWyBhIF0sIGFzc2VydCwge1xyXG4gICAgICBob21lU2NyZWVuOiBudWxsLFxyXG4gICAgICBpbml0aWFsU2NyZWVuOiBhLFxyXG4gICAgICBzZWxlY3RlZFNpbVNjcmVlbnM6IFsgYSBdLFxyXG4gICAgICBzY3JlZW5zOiBbIGEgXSxcclxuICAgICAgYWxsU2NyZWVuc0NyZWF0ZWQ6IHRydWVcclxuICAgIH0gKTtcclxuICAgIHRlc3RWYWxpZFNjcmVlblNlbGVjdG9yKCAnP2luaXRpYWxTY3JlZW49MicsIFsgYSBdLCBhc3NlcnQsIHtcclxuICAgICAgaG9tZVNjcmVlbjogbnVsbCxcclxuICAgICAgaW5pdGlhbFNjcmVlbjogYSxcclxuICAgICAgc2VsZWN0ZWRTaW1TY3JlZW5zOiBbIGEgXSxcclxuICAgICAgc2NyZWVuczogWyBhIF0sXHJcbiAgICAgIGFsbFNjcmVlbnNDcmVhdGVkOiB0cnVlXHJcbiAgICB9ICk7XHJcbiAgICB0ZXN0VmFsaWRTY3JlZW5TZWxlY3RvciggJz9ob21lU2NyZWVuPXRydWUnLCBbIGEgXSwgYXNzZXJ0LCB7XHJcbiAgICAgIGhvbWVTY3JlZW46IG51bGwsXHJcbiAgICAgIGluaXRpYWxTY3JlZW46IGEsXHJcbiAgICAgIHNlbGVjdGVkU2ltU2NyZWVuczogWyBhIF0sXHJcbiAgICAgIHNjcmVlbnM6IFsgYSBdLFxyXG4gICAgICBhbGxTY3JlZW5zQ3JlYXRlZDogdHJ1ZVxyXG4gICAgfSApO1xyXG4gICAgdGVzdFZhbGlkU2NyZWVuU2VsZWN0b3IoICc/c2NyZWVucz0wJywgWyBhIF0sIGFzc2VydCwge1xyXG4gICAgICBob21lU2NyZWVuOiBudWxsLFxyXG4gICAgICBpbml0aWFsU2NyZWVuOiBhLFxyXG4gICAgICBzZWxlY3RlZFNpbVNjcmVlbnM6IFsgYSBdLFxyXG4gICAgICBzY3JlZW5zOiBbIGEgXSxcclxuICAgICAgYWxsU2NyZWVuc0NyZWF0ZWQ6IHRydWVcclxuICAgIH0gKTtcclxuICAgIHRlc3RWYWxpZFNjcmVlblNlbGVjdG9yKCAnP3NjcmVlbnM9MicsIFsgYSBdLCBhc3NlcnQsIHtcclxuICAgICAgaG9tZVNjcmVlbjogbnVsbCxcclxuICAgICAgaW5pdGlhbFNjcmVlbjogYSxcclxuICAgICAgc2VsZWN0ZWRTaW1TY3JlZW5zOiBbIGEgXSxcclxuICAgICAgc2NyZWVuczogWyBhIF0sXHJcbiAgICAgIGFsbFNjcmVlbnNDcmVhdGVkOiB0cnVlXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGVzdFZhbGlkU2NyZWVuU2VsZWN0b3IoICc/c2NyZWVucz0yJywgWyBhIF0sIGFzc2VydCwge1xyXG4gICAgICBob21lU2NyZWVuOiBudWxsLFxyXG4gICAgICBpbml0aWFsU2NyZWVuOiBhLFxyXG4gICAgICBzZWxlY3RlZFNpbVNjcmVlbnM6IFsgYSBdLFxyXG4gICAgICBzY3JlZW5zOiBbIGEgXSxcclxuICAgICAgYWxsU2NyZWVuc0NyZWF0ZWQ6IHRydWVcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBUaGVzZSBjb250YWluIGVycm9ycywgZGlzcGxheSB3YXJuaW5nIGRpYWxvZywgYW5kIHJldmVydCB0byBkZWZhdWx0LlxyXG4gICAgLy8gbGlrZSBwaC1zY2FsZS1iYXNpY3NfZW4uaHRtbD9zY3JlZW5zPTIsMVxyXG4gICAgdGVzdFZhbGlkU2NyZWVuU2VsZWN0b3IoICc/c2NyZWVucz0yLDEnLCBbIGEgXSwgYXNzZXJ0LCB7XHJcbiAgICAgIGhvbWVTY3JlZW46IG51bGwsXHJcbiAgICAgIGluaXRpYWxTY3JlZW46IGEsXHJcbiAgICAgIHNlbGVjdGVkU2ltU2NyZWVuczogWyBhIF0sXHJcbiAgICAgIHNjcmVlbnM6IFsgYSBdLFxyXG4gICAgICBhbGxTY3JlZW5zQ3JlYXRlZDogdHJ1ZVxyXG4gICAgfSApO1xyXG5cclxuICAgIHRlc3RWYWxpZFNjcmVlblNlbGVjdG9yKCAnP3NjcmVlbnM9MS4yLFNjcmVlbjInLCBbIGEsIGIsIGMgXSwgYXNzZXJ0LCB7XHJcbiAgICAgIGhvbWVTY3JlZW46IGhzLFxyXG4gICAgICBpbml0aWFsU2NyZWVuOiBocyxcclxuICAgICAgc2VsZWN0ZWRTaW1TY3JlZW5zOiBbIGEsIGIsIGMgXSxcclxuICAgICAgc2NyZWVuczogWyBocywgYSwgYiwgYyBdLFxyXG4gICAgICBhbGxTY3JlZW5zQ3JlYXRlZDogdHJ1ZVxyXG4gICAgfSApO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGFzc2VydC5vayggdHJ1ZSwgJ2Nhbm5vdCB0ZXN0IGZvciBncmFjZSB3aGVuIGFzc2VydGlvbnMgYXJlIGVuYWJsZWQnICk7XHJcbiAgfVxyXG59ICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxhQUFhLE1BQTRCLG9CQUFvQjtBQUlwRTtBQUNBLE1BQU1DLENBQUMsR0FBRyxHQUEyQjtBQUNyQyxNQUFNQyxDQUFDLEdBQUcsR0FBMkI7QUFDckMsTUFBTUMsQ0FBQyxHQUFHLEdBQTJCO0FBQ3JDLE1BQU1DLEVBQUUsR0FBRyxJQUE2QjtBQUV4QyxNQUFNQyx1QkFBdUIsR0FBS0MsV0FBbUIsSUFBTTtFQUV6RDtFQUNBO0VBQ0EsT0FBT0Msa0JBQWtCLENBQUNDLGVBQWUsQ0FBRTtJQUV6Q0MsVUFBVSxFQUFFO01BQ1ZDLElBQUksRUFBRSxTQUFTO01BQ2ZDLFlBQVksRUFBRSxJQUFJO01BQ2xCQyxNQUFNLEVBQUU7SUFDVixDQUFDO0lBRURDLGFBQWEsRUFBRTtNQUNiSCxJQUFJLEVBQUUsUUFBUTtNQUNkQyxZQUFZLEVBQUUsQ0FBQztNQUNmQyxNQUFNLEVBQUU7SUFFVixDQUFDO0lBRURFLE9BQU8sRUFBRTtNQUNQSixJQUFJLEVBQUUsT0FBTztNQUNiSyxhQUFhLEVBQUU7UUFDYkwsSUFBSSxFQUFFLFFBQVE7UUFDZE0sWUFBWSxFQUFFQyxNQUFNLENBQUNDO01B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