// Copyright 2019-2024, University of Colorado Boulder
// @author Michael Kauzmann (PhET Interactive Simulations)

import Property from '../../axon/js/Property.js';
import EnumerationDeprecated from './EnumerationDeprecated.js';
import merge from './merge.js';
QUnit.module('merge');

// test proper merger for 2 objects
QUnit.test('merge two objects', assert => {
  const original = {
    prop1: 'value1',
    prop2: 'value2',
    subcomponentOptions: {
      subProp1: 'subValue1',
      subProp2: 'subValue2'
    },
    subcomponentOptions2: {
      subSubcomponentOptions: {
        subSubProp1: 'subSubValue1'
      }
    },
    prop3: 'value3'
  };
  const merge1 = {
    subcomponentOptions: {
      subProp1: 'subvalue1 changed',
      subProp3: 'new subvalue'
    },
    subcomponentOptions2: {
      subSubcomponentOptions: {
        subSubProp1: 'all gone now',
        test: 'this is here too'
      }
    },
    prop3: 'new value3',
    prop4: 'value4'
  };
  const preMergeSourceCopy = Object.assign({}, merge1);
  const merged = merge(original, merge1);
  assert.equal(merged.prop1, 'value1', 'merge should not alter target keys that aren\'t in the source');
  assert.equal(merged.prop4, 'value4', 'merge should not alter source keys that aren\'t in the target');
  let shouldBe = {
    subProp1: 'subvalue1 changed',
    subProp2: 'subValue2',
    subProp3: 'new subvalue'
  };
  assert.deepEqual(merged.subcomponentOptions, shouldBe, 'merge should combine singly nested objects');
  shouldBe = {
    prop1: 'value1',
    prop2: 'value2',
    subcomponentOptions: {
      subProp1: 'subvalue1 changed',
      subProp3: 'new subvalue',
      subProp2: 'subValue2'
    },
    subcomponentOptions2: {
      subSubcomponentOptions: {
        subSubProp1: 'all gone now',
        test: 'this is here too'
      }
    },
    prop3: 'new value3',
    prop4: 'value4'
  };
  assert.deepEqual(merged, shouldBe, 'merge should combine arbitrarily nested objects');
  assert.deepEqual(merge1, preMergeSourceCopy, 'merge should not alter sources');
});

// test multiple objects
QUnit.test('test multiple objects', assert => {
  const original = {
    prop1: 'value1',
    prop2: 'value2',
    subcomponentOptions: {
      subProp1: 'subValue1',
      subProp2: 'subValue2'
    },
    subcomponentOptions2: {
      subSubcomponentOptions: {
        subSubProp1: 'subSubValue1'
      }
    },
    prop3: 'value3'
  };
  const merge1 = {
    subcomponentOptions: {
      subProp1: 'subvalue1 changed',
      subProp3: 'new subvalue',
      except: 'me'
    },
    subcomponentOptions2: {
      subSubcomponentOptions: {
        subSubProp1: 'all gone now',
        test: 'this is here too'
      }
    },
    prop3: 'new value3',
    prop4: 'value4'
  };
  const merge2 = {
    prop5: 'value5',
    subcomponentOptions: {
      subProp1: 'everything',
      subProp2: 'here is',
      subProp3: 'from',
      subProp4: 'merge2'
    }
  };
  const merge3 = {
    prop6: 'value6',
    prop5: 'value5 from merge3',
    subcomponentOptions: {
      subProp5: 'BONJOUR'
    },
    subcomponentOptions2: {
      test2: ['test2', 'test3'],
      subSubcomponentOptions: {
        test: 'test form merge3',
        subSubProp1: 'subSub from merge3'
      }
    }
  };
  const merge1Copy = _.cloneDeep(merge1);
  const merge2Copy = _.cloneDeep(merge2);
  const merge3Copy = _.cloneDeep(merge3);
  Object.freeze(merge1);
  Object.freeze(merge2);
  Object.freeze(merge3);
  const merged = merge(original, merge1, merge2, merge3);
  const expected = {
    prop1: 'value1',
    prop2: 'value2',
    subcomponentOptions: {
      subProp1: 'everything',
      subProp2: 'here is',
      subProp3: 'from',
      subProp4: 'merge2',
      except: 'me',
      subProp5: 'BONJOUR'
    },
    subcomponentOptions2: {
      test2: ['test2', 'test3'],
      subSubcomponentOptions: {
        test: 'test form merge3',
        subSubProp1: 'subSub from merge3'
      }
    },
    prop3: 'new value3',
    prop4: 'value4',
    prop5: 'value5 from merge3',
    prop6: 'value6'
  };
  assert.notEqual(merged, expected, 'sanity check: ensure merged and expected objects are not the same reference');
  assert.deepEqual(merged, expected, 'merge should properly combine multiple objects');
  assert.deepEqual(merge1, merge1Copy, 'merge should not alter source objects');
  assert.deepEqual(merge2, merge2Copy, 'merge should not alter source objects');
  assert.deepEqual(merge3, merge3Copy, 'merge should not alter source objects');
});

// check that it errors loudly if something other than an object is used
QUnit.test('check for proper assertion errors', assert => {
  const original = {
    subOptions: {
      test: 'val',
      test2: 'val2'
    }
  };
  const TestClass = class {
    constructor() {
      this.test = 'class';
    }
  };
  const merges = {
    a: {
      subOptions: ['val', 'val2']
    },
    b: {
      subOptions: Object.create({
        test: 'a',
        test1: 3
      })
    },
    c: {
      subOptions: 'a string to test'
    },
    d: {
      subOptions: 42
    },
    e: {
      // @ts-expect-error
      subOptions: function () {
        this.a = 42;
      }
    },
    f: {
      subOptions: new TestClass()
    }
  };
  const getterMerge = {
    get subOptions() {
      return {
        test: 'should not work'
      };
    }
  };
  if (window.assert) {
    assert.throws(() => merge(original, merges.a), 'merge should not allow arrays to be merged');
    assert.throws(() => merge(original, merges.b), 'merge should not allow inherited objects to be merged');
    assert.throws(() => merge(original, merges.f), 'merge should not allow instances to be merged');
    assert.throws(() => merge(original, merges.c), 'merge should not allow strings to be merged');
    assert.throws(() => merge(original, merges.d), 'merge should not allow numbers to be merged');
    assert.throws(() => merge(original, merges.e), 'merge should not allow functions to be merged');
    assert.throws(() => merge(original, getterMerge), 'merge should not work with getters');

    // @ts-expect-error INTENTIONAL
    assert.throws(() => merge(original), 'merge should not work without a source');
  }
  assert.equal(1, 1, 'for no ?ea query param');
});
QUnit.test('check for reference level equality (e.g. for object literals, Properties, Enumerations)', assert => {
  const testEnum = {
    A: {
      testA: 'valueA'
    },
    B: {
      testB: 'valueB'
    },
    C: {
      testC: 'valueC'
    }
  };
  const testProperty = {
    value: 42
  };
  const testProperty2 = {
    value: 'forty two'
  };
  const original = {
    prop: testProperty,
    nestedOptions: {
      needsAnEnum: testEnum.A,
      moreOptions: {
        needsAnEnum: testEnum.C
      }
    }
  };
  const merger = {
    prop: testProperty2,
    nestedOptions: {
      needsAnEnum: testEnum.B,
      moreOptions: {
        needsDifferentEnum: testEnum.A
      }
    }
  };
  const originalCopy = _.cloneDeep(original);
  Object.freeze(original);
  const mergedFresh = merge({}, original, merger);
  assert.equal(original.prop.value, originalCopy.prop.value, 'merge should not alter source object values');
  assert.ok(_.isEqual(original, originalCopy), 'merge should not alter source objects');
  assert.equal(mergedFresh.nestedOptions.needsAnEnum, testEnum.B, 'merge should preserve references to overwritten object literals');
  assert.equal(mergedFresh.nestedOptions.moreOptions.needsAnEnum, testEnum.C, 'merge should preserve object literals from target');
  assert.equal(mergedFresh.nestedOptions.moreOptions.needsDifferentEnum, testEnum.A, 'merge should preserve object literals from source');
  mergedFresh.prop.value = 'forty three';
  assert.equal(testProperty2.value, 'forty three', 'merge should pass object literal references');
  assert.equal(testProperty.value, 42, 'original object literal should be overwritten');
  const merged = merge({}, original, merger);
  assert.ok(merged.nestedOptions.needsAnEnum === testEnum.B, 'merge should preserve overwritten EnumerationDeprecated types');
  assert.ok(merged.nestedOptions.moreOptions.needsAnEnum === testEnum.C, 'merge should preserve EnumerationDeprecated types from target');
  assert.ok(merged.nestedOptions.moreOptions.needsDifferentEnum === testEnum.A, 'merge should preserve EnumerationDeprecated types from source');
});
QUnit.test('try a horribly nested case', assert => {
  const original = {
    p1Options: {
      n1Options: {
        n2Options: {
          n3Options: {
            n4Options: {
              n5: 'overwrite me'
            }
          }
        }
      }
    },
    p2Options: {
      n1Options: {
        p3: 'keep me'
      }
    }
  };
  const merge1 = {
    p1Options: {
      n1Options: {
        n2Options: {
          n3Options: {
            n4Options: {
              n5: 'overwritten'
            }
          }
        }
      }
    },
    p2Options: {
      n1Options: {
        p4: 'p3 kept',
        n2Options: {
          n3Options: {
            n4Options: {
              n5Options: {
                n6Options: {
                  p5: 'never make options like this'
                }
              }
            }
          }
        }
      }
    }
  };
  Object.freeze(merge1);
  const merged = merge(original, merge1);
  const expected = {
    p1Options: {
      n1Options: {
        n2Options: {
          n3Options: {
            n4Options: {
              n5: 'overwritten'
            }
          }
        }
      }
    },
    p2Options: {
      n1Options: {
        p3: 'keep me',
        p4: 'p3 kept',
        n2Options: {
          n3Options: {
            n4Options: {
              n5Options: {
                n6Options: {
                  p5: 'never make options like this'
                }
              }
            }
          }
        }
      }
    }
  };
  assert.deepEqual(merged, expected, 'merge should handle some deeply nested stuff');
});
QUnit.test('minor change', assert => {
  const a = {
    sliderOptions: {
      hello: 'there'
    }
  };
  const b = {
    sliderOptions: {
      time: 'now'
    }
  };
  merge({}, a, b);
  assert.ok(!a.sliderOptions.hasOwnProperty('time'), 'time shouldnt leak over to a');
});
QUnit.test('test wrong args', assert => {
  if (window.assert) {
    // in first arg
    assert.throws(() => merge(undefined, {}), 'unsupported first arg "undefined"');
    assert.throws(() => merge(null, {}), 'unsupported arg "null"');
    assert.throws(() => merge(true, {}), 'unsupported arg "boolean"');
    assert.throws(() => merge('hello', {}), 'unsupported arg "string"');
    assert.throws(() => merge(4, {}), 'unsupported arg "number"');
    assert.throws(() => merge(Image, {}), 'unsupported arg of Object with extra prototype');
    assert.throws(() => merge({
      get hi() {
        return 3;
      }
    }, {}), 'unsupported arg with getter');
    assert.throws(() => merge({
      set hi(stuff) {/* noop */}
    }, {}), 'unsupported arg with setter');

    // in second arg
    assert.throws(() => merge({}, true, {}), 'unsupported second arg "boolean"');
    assert.throws(() => merge({}, 'hello', {}), 'unsupported second arg "string"');
    assert.throws(() => merge({}, 4, {}), 'unsupported second arg "number"');
    assert.throws(() => merge({}, Image, {}), 'unsupported second arg of Object with extra prototype');
    assert.throws(() => merge({}, {
      get hi() {
        return 3;
      }
    }, {}), 'unsupported second arg with getter');
    assert.throws(() => merge({}, {
      set hi(stuff) {/* noop */}
    }, {}), 'unsupported second arg with setter');

    // in second arg with no third object
    assert.throws(() => merge({}, true), 'unsupported second arg with no third "boolean"');
    assert.throws(() => merge({}, 'hello'), 'unsupported second arg with no third "string"');
    assert.throws(() => merge({}, 4), 'unsupported second arg with no third "number"');
    assert.throws(() => merge({}, Image), 'unsupported second arg with no third of Object with extra prototype');
    assert.throws(() => merge({}, {
      get hi() {
        return 3;
      }
    }), 'unsupported second arg with no third with getter');
    assert.throws(() => merge({}, {
      set hi(stuff) {/* noop */}
    }), 'unsupported second arg with no third with getter');

    // in some options
    assert.throws(() => merge({}, {
      someOptions: true
    }, {}), 'unsupported arg in options "boolean"');
    assert.throws(() => merge({}, {
      someOptions: 'hello'
    }, {}), 'unsupported arg in options "string"');
    assert.throws(() => merge({}, {
      someOptions: 4
    }, {}), 'unsupported arg in options "number"');
    assert.throws(() => merge({}, {
      someOptions: Image
    }, {}), 'unsupported arg in options of Object with extra prototype');
    assert.throws(() => merge({}, {
      someOptions: {
        get hi() {
          return 3;
        }
      }
    }, {}), 'unsupported arg in options with getter');
    assert.throws(() => merge({}, {
      someOptions: {
        set hi(stuff) {/* noop */}
      }
    }, {}), 'unsupported arg in options with getter');
  } else {
    assert.ok(true, 'no assertions enabled');
  }

  // allowed cases that should not error
  merge({}, null, {});
  merge({}, null);
  merge({}, {}, null);
  merge({
    xOptions: {
      test: 1
    }
  }, {
    xOptions: null
  });
  merge({}, {
    someOptions: null
  }, {});
  merge({}, {
    someOptions: undefined
  }, {});
});
QUnit.test('do not recurse for non *Options', assert => {
  const testFirstProperty = new Property('hi');
  const testSecondProperty = new Property('hi2');
  const TestEnumeration = EnumerationDeprecated.byKeys(['ONE', 'TWO']);
  const TestEnumeration2 = EnumerationDeprecated.byKeys(['ONE1', 'TWO2']);
  const original = {
    prop: testFirstProperty,
    enum: TestEnumeration,
    someOptions: {
      nestedProp: testFirstProperty
    }
  };
  let newObject = merge({}, original);
  assert.ok(_.isEqual(original, newObject), 'should be equal from reference equality');
  assert.ok(original.prop === newObject.prop, 'same Property');
  assert.ok(original.enum === newObject.enum, 'same EnumerationDeprecated');

  // test defaults with other non mergeable objects
  newObject = merge({
    prop: testSecondProperty,
    enum: TestEnumeration2,
    someOptions: {
      nestedProp: testSecondProperty
    }
  }, original);
  assert.ok(_.isEqual(original, newObject), 'should be equal');
  assert.ok(original.prop === newObject.prop, 'same Property, ignore default');
  assert.ok(original.enum === newObject.enum, 'same EnumerationDeprecated, ignore default');
});
QUnit.test('support optional options', assert => {
  const mergeXYZ = options => {
    return merge({
      x: 1,
      y: 2,
      z: 3
    }, options);
  };
  const noOptions = mergeXYZ();
  assert.ok(noOptions.x === 1, 'x property should be merged from default');
  assert.ok(noOptions.y === 2, 'y property should be merged from default');
  assert.ok(noOptions.z === 3, 'z property should be merged from default');
  const testNestedFunctionCallOptions = options => {
    return mergeXYZ(merge({
      x: 2,
      g: 54,
      treeSays: 'hello'
    }, options));
  };
  const noOptions2 = testNestedFunctionCallOptions();
  assert.ok(noOptions2.x === 2, 'x property should be merged from default');
  assert.ok(noOptions2.y === 2, 'y property should be merged from default');
  assert.ok(noOptions2.z === 3, 'z property should be merged from default');
  assert.ok(noOptions2.g === 54, 'g property should be merged from default');
  assert.ok(noOptions2.treeSays === 'hello', 'property should be merged from default');
});
QUnit.test('does not support deep equals on keyname of "Options"', assert => {
  const referenceObject = {
    hello: 2
  };
  const merged = merge({}, {
    Options: referenceObject
  });
  const deepMerged = merge({}, {
    someOptions: referenceObject
  });
  assert.ok(merged.Options === referenceObject, '"Options" should not deep equal');
  referenceObject.hello = 3;
  assert.ok(merged.Options.hello === 3, 'value should change because it is a reference');
  assert.ok(deepMerged.someOptions.hello === 2, 'value should not change because it was deep copied');
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQcm9wZXJ0eSIsIkVudW1lcmF0aW9uRGVwcmVjYXRlZCIsIm1lcmdlIiwiUVVuaXQiLCJtb2R1bGUiLCJ0ZXN0IiwiYXNzZXJ0Iiwib3JpZ2luYWwiLCJwcm9wMSIsInByb3AyIiwic3ViY29tcG9uZW50T3B0aW9ucyIsInN1YlByb3AxIiwic3ViUHJvcDIiLCJzdWJjb21wb25lbnRPcHRpb25zMiIsInN1YlN1YmNvbXBvbmVudE9wdGlvbnMiLCJzdWJTdWJQcm9wMSIsInByb3AzIiwibWVyZ2UxIiwic3ViUHJvcDMiLCJwcm9wNCIsInByZU1lcmdlU291cmNlQ29weSIsIk9iamVjdCIsImFzc2lnbiIsIm1lcmdlZCIsImVxdWFsIiwic2hvdWxkQmUiLCJkZWVwRXF1YWwiLCJleGNlcHQiLCJtZXJnZTIiLCJwcm9wNSIsInN1YlByb3A0IiwibWVyZ2UzIiwicHJvcDYiLCJzdWJQcm9wNSIsInRlc3QyIiwibWVyZ2UxQ29weSIsIl8iLCJjbG9uZURlZXAiLCJtZXJnZTJDb3B5IiwibWVyZ2UzQ29weSIsImZyZWV6ZSIsImV4cGVjdGVkIiwibm90RXF1YWwiLCJzdWJPcHRpb25zIiwiVGVzdENsYXNzIiwiY29uc3RydWN0b3IiLCJtZXJnZXMiLCJhIiwiYiIsImNyZWF0ZSIsInRlc3QxIiwiYyIsImQiLCJlIiwiZiIsImdldHRlck1lcmdlIiwid2luZG93IiwidGhyb3dzIiwidGVzdEVudW0iLCJBIiwidGVzdEEiLCJCIiwidGVzdEIiLCJDIiwidGVzdEMiLCJ0ZXN0UHJvcGVydHkiLCJ2YWx1ZSIsInRlc3RQcm9wZXJ0eTIiLCJwcm9wIiwibmVzdGVkT3B0aW9ucyIsIm5lZWRzQW5FbnVtIiwibW9yZU9wdGlvbnMiLCJtZXJnZXIiLCJuZWVkc0RpZmZlcmVudEVudW0iLCJvcmlnaW5hbENvcHkiLCJtZXJnZWRGcmVzaCIsIm9rIiwiaXNFcXVhbCIsInAxT3B0aW9ucyIsIm4xT3B0aW9ucyIsIm4yT3B0aW9ucyIsIm4zT3B0aW9ucyIsIm40T3B0aW9ucyIsIm41IiwicDJPcHRpb25zIiwicDMiLCJwNCIsIm41T3B0aW9ucyIsIm42T3B0aW9ucyIsInA1Iiwic2xpZGVyT3B0aW9ucyIsImhlbGxvIiwidGltZSIsImhhc093blByb3BlcnR5IiwidW5kZWZpbmVkIiwiSW1hZ2UiLCJoaSIsInN0dWZmIiwic29tZU9wdGlvbnMiLCJ4T3B0aW9ucyIsInRlc3RGaXJzdFByb3BlcnR5IiwidGVzdFNlY29uZFByb3BlcnR5IiwiVGVzdEVudW1lcmF0aW9uIiwiYnlLZXlzIiwiVGVzdEVudW1lcmF0aW9uMiIsImVudW0iLCJuZXN0ZWRQcm9wIiwibmV3T2JqZWN0IiwibWVyZ2VYWVoiLCJvcHRpb25zIiwieCIsInkiLCJ6Iiwibm9PcHRpb25zIiwidGVzdE5lc3RlZEZ1bmN0aW9uQ2FsbE9wdGlvbnMiLCJnIiwidHJlZVNheXMiLCJub09wdGlvbnMyIiwicmVmZXJlbmNlT2JqZWN0IiwiT3B0aW9ucyIsImRlZXBNZXJnZWQiXSwic291cmNlcyI6WyJtZXJnZVRlc3RzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE5LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG4vLyBAYXV0aG9yIE1pY2hhZWwgS2F1em1hbm4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcblxyXG5cclxuaW1wb3J0IFByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgRW51bWVyYXRpb25EZXByZWNhdGVkIGZyb20gJy4vRW51bWVyYXRpb25EZXByZWNhdGVkLmpzJztcclxuaW1wb3J0IG1lcmdlIGZyb20gJy4vbWVyZ2UuanMnO1xyXG5pbXBvcnQgSW50ZW50aW9uYWxBbnkgZnJvbSAnLi90eXBlcy9JbnRlbnRpb25hbEFueS5qcyc7XHJcblxyXG5RVW5pdC5tb2R1bGUoICdtZXJnZScgKTtcclxuXHJcbi8vIHRlc3QgcHJvcGVyIG1lcmdlciBmb3IgMiBvYmplY3RzXHJcblFVbml0LnRlc3QoICdtZXJnZSB0d28gb2JqZWN0cycsIGFzc2VydCA9PiB7XHJcbiAgY29uc3Qgb3JpZ2luYWwgPSB7XHJcbiAgICBwcm9wMTogJ3ZhbHVlMScsXHJcbiAgICBwcm9wMjogJ3ZhbHVlMicsXHJcbiAgICBzdWJjb21wb25lbnRPcHRpb25zOiB7XHJcbiAgICAgIHN1YlByb3AxOiAnc3ViVmFsdWUxJyxcclxuICAgICAgc3ViUHJvcDI6ICdzdWJWYWx1ZTInXHJcbiAgICB9LFxyXG4gICAgc3ViY29tcG9uZW50T3B0aW9uczI6IHtcclxuICAgICAgc3ViU3ViY29tcG9uZW50T3B0aW9uczoge1xyXG4gICAgICAgIHN1YlN1YlByb3AxOiAnc3ViU3ViVmFsdWUxJ1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgcHJvcDM6ICd2YWx1ZTMnXHJcbiAgfTtcclxuXHJcbiAgY29uc3QgbWVyZ2UxID0ge1xyXG4gICAgc3ViY29tcG9uZW50T3B0aW9uczoge1xyXG4gICAgICBzdWJQcm9wMTogJ3N1YnZhbHVlMSBjaGFuZ2VkJyxcclxuICAgICAgc3ViUHJvcDM6ICduZXcgc3VidmFsdWUnXHJcbiAgICB9LFxyXG4gICAgc3ViY29tcG9uZW50T3B0aW9uczI6IHtcclxuICAgICAgc3ViU3ViY29tcG9uZW50T3B0aW9uczoge1xyXG4gICAgICAgIHN1YlN1YlByb3AxOiAnYWxsIGdvbmUgbm93JyxcclxuICAgICAgICB0ZXN0OiAndGhpcyBpcyBoZXJlIHRvbydcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHByb3AzOiAnbmV3IHZhbHVlMycsXHJcbiAgICBwcm9wNDogJ3ZhbHVlNCdcclxuICB9O1xyXG4gIGNvbnN0IHByZU1lcmdlU291cmNlQ29weSA9IE9iamVjdC5hc3NpZ24oIHt9LCBtZXJnZTEgKTtcclxuICBjb25zdCBtZXJnZWQgPSBtZXJnZSggb3JpZ2luYWwsIG1lcmdlMSApO1xyXG5cclxuICBhc3NlcnQuZXF1YWwoIG1lcmdlZC5wcm9wMSwgJ3ZhbHVlMScsICdtZXJnZSBzaG91bGQgbm90IGFsdGVyIHRhcmdldCBrZXlzIHRoYXQgYXJlblxcJ3QgaW4gdGhlIHNvdXJjZScgKTtcclxuICBhc3NlcnQuZXF1YWwoIG1lcmdlZC5wcm9wNCwgJ3ZhbHVlNCcsICdtZXJnZSBzaG91bGQgbm90IGFsdGVyIHNvdXJjZSBrZXlzIHRoYXQgYXJlblxcJ3QgaW4gdGhlIHRhcmdldCcgKTtcclxuXHJcbiAgbGV0IHNob3VsZEJlOiBJbnRlbnRpb25hbEFueSA9IHtcclxuICAgIHN1YlByb3AxOiAnc3VidmFsdWUxIGNoYW5nZWQnLFxyXG4gICAgc3ViUHJvcDI6ICdzdWJWYWx1ZTInLFxyXG4gICAgc3ViUHJvcDM6ICduZXcgc3VidmFsdWUnXHJcbiAgfTtcclxuICBhc3NlcnQuZGVlcEVxdWFsKCBtZXJnZWQuc3ViY29tcG9uZW50T3B0aW9ucywgc2hvdWxkQmUsICdtZXJnZSBzaG91bGQgY29tYmluZSBzaW5nbHkgbmVzdGVkIG9iamVjdHMnICk7XHJcblxyXG4gIHNob3VsZEJlID0ge1xyXG4gICAgcHJvcDE6ICd2YWx1ZTEnLFxyXG4gICAgcHJvcDI6ICd2YWx1ZTInLFxyXG4gICAgc3ViY29tcG9uZW50T3B0aW9uczoge1xyXG4gICAgICBzdWJQcm9wMTogJ3N1YnZhbHVlMSBjaGFuZ2VkJyxcclxuICAgICAgc3ViUHJvcDM6ICduZXcgc3VidmFsdWUnLFxyXG4gICAgICBzdWJQcm9wMjogJ3N1YlZhbHVlMidcclxuICAgIH0sXHJcbiAgICBzdWJjb21wb25lbnRPcHRpb25zMjoge1xyXG4gICAgICBzdWJTdWJjb21wb25lbnRPcHRpb25zOiB7XHJcbiAgICAgICAgc3ViU3ViUHJvcDE6ICdhbGwgZ29uZSBub3cnLFxyXG4gICAgICAgIHRlc3Q6ICd0aGlzIGlzIGhlcmUgdG9vJ1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgcHJvcDM6ICduZXcgdmFsdWUzJyxcclxuICAgIHByb3A0OiAndmFsdWU0J1xyXG4gIH07XHJcbiAgYXNzZXJ0LmRlZXBFcXVhbCggbWVyZ2VkLCBzaG91bGRCZSwgJ21lcmdlIHNob3VsZCBjb21iaW5lIGFyYml0cmFyaWx5IG5lc3RlZCBvYmplY3RzJyApO1xyXG4gIGFzc2VydC5kZWVwRXF1YWwoIG1lcmdlMSwgcHJlTWVyZ2VTb3VyY2VDb3B5LCAnbWVyZ2Ugc2hvdWxkIG5vdCBhbHRlciBzb3VyY2VzJyApO1xyXG59ICk7XHJcblxyXG4vLyB0ZXN0IG11bHRpcGxlIG9iamVjdHNcclxuUVVuaXQudGVzdCggJ3Rlc3QgbXVsdGlwbGUgb2JqZWN0cycsIGFzc2VydCA9PiB7XHJcbiAgY29uc3Qgb3JpZ2luYWwgPSB7XHJcbiAgICBwcm9wMTogJ3ZhbHVlMScsXHJcbiAgICBwcm9wMjogJ3ZhbHVlMicsXHJcbiAgICBzdWJjb21wb25lbnRPcHRpb25zOiB7XHJcbiAgICAgIHN1YlByb3AxOiAnc3ViVmFsdWUxJyxcclxuICAgICAgc3ViUHJvcDI6ICdzdWJWYWx1ZTInXHJcbiAgICB9LFxyXG4gICAgc3ViY29tcG9uZW50T3B0aW9uczI6IHtcclxuICAgICAgc3ViU3ViY29tcG9uZW50T3B0aW9uczoge1xyXG4gICAgICAgIHN1YlN1YlByb3AxOiAnc3ViU3ViVmFsdWUxJ1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgcHJvcDM6ICd2YWx1ZTMnXHJcbiAgfTtcclxuXHJcbiAgY29uc3QgbWVyZ2UxID0ge1xyXG4gICAgc3ViY29tcG9uZW50T3B0aW9uczoge1xyXG4gICAgICBzdWJQcm9wMTogJ3N1YnZhbHVlMSBjaGFuZ2VkJyxcclxuICAgICAgc3ViUHJvcDM6ICduZXcgc3VidmFsdWUnLFxyXG4gICAgICBleGNlcHQ6ICdtZSdcclxuICAgIH0sXHJcbiAgICBzdWJjb21wb25lbnRPcHRpb25zMjoge1xyXG4gICAgICBzdWJTdWJjb21wb25lbnRPcHRpb25zOiB7XHJcbiAgICAgICAgc3ViU3ViUHJvcDE6ICdhbGwgZ29uZSBub3cnLFxyXG4gICAgICAgIHRlc3Q6ICd0aGlzIGlzIGhlcmUgdG9vJ1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgcHJvcDM6ICduZXcgdmFsdWUzJyxcclxuICAgIHByb3A0OiAndmFsdWU0J1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IG1lcmdlMiA9IHtcclxuICAgIHByb3A1OiAndmFsdWU1JyxcclxuICAgIHN1YmNvbXBvbmVudE9wdGlvbnM6IHtcclxuICAgICAgc3ViUHJvcDE6ICdldmVyeXRoaW5nJyxcclxuICAgICAgc3ViUHJvcDI6ICdoZXJlIGlzJyxcclxuICAgICAgc3ViUHJvcDM6ICdmcm9tJyxcclxuICAgICAgc3ViUHJvcDQ6ICdtZXJnZTInXHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgbWVyZ2UzID0ge1xyXG4gICAgcHJvcDY6ICd2YWx1ZTYnLFxyXG4gICAgcHJvcDU6ICd2YWx1ZTUgZnJvbSBtZXJnZTMnLFxyXG4gICAgc3ViY29tcG9uZW50T3B0aW9uczoge1xyXG4gICAgICBzdWJQcm9wNTogJ0JPTkpPVVInXHJcbiAgICB9LFxyXG4gICAgc3ViY29tcG9uZW50T3B0aW9uczI6IHtcclxuICAgICAgdGVzdDI6IFsgJ3Rlc3QyJywgJ3Rlc3QzJyBdLFxyXG4gICAgICBzdWJTdWJjb21wb25lbnRPcHRpb25zOiB7XHJcbiAgICAgICAgdGVzdDogJ3Rlc3QgZm9ybSBtZXJnZTMnLFxyXG4gICAgICAgIHN1YlN1YlByb3AxOiAnc3ViU3ViIGZyb20gbWVyZ2UzJ1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxuICBjb25zdCBtZXJnZTFDb3B5ID0gXy5jbG9uZURlZXAoIG1lcmdlMSApO1xyXG4gIGNvbnN0IG1lcmdlMkNvcHkgPSBfLmNsb25lRGVlcCggbWVyZ2UyICk7XHJcbiAgY29uc3QgbWVyZ2UzQ29weSA9IF8uY2xvbmVEZWVwKCBtZXJnZTMgKTtcclxuXHJcbiAgT2JqZWN0LmZyZWV6ZSggbWVyZ2UxICk7XHJcbiAgT2JqZWN0LmZyZWV6ZSggbWVyZ2UyICk7XHJcbiAgT2JqZWN0LmZyZWV6ZSggbWVyZ2UzICk7XHJcbiAgY29uc3QgbWVyZ2VkID0gbWVyZ2UoIG9yaWdpbmFsLCBtZXJnZTEsIG1lcmdlMiwgbWVyZ2UzICk7XHJcblxyXG4gIGNvbnN0IGV4cGVjdGVkID0ge1xyXG4gICAgcHJvcDE6ICd2YWx1ZTEnLFxyXG4gICAgcHJvcDI6ICd2YWx1ZTInLFxyXG4gICAgc3ViY29tcG9uZW50T3B0aW9uczoge1xyXG4gICAgICBzdWJQcm9wMTogJ2V2ZXJ5dGhpbmcnLFxyXG4gICAgICBzdWJQcm9wMjogJ2hlcmUgaXMnLFxyXG4gICAgICBzdWJQcm9wMzogJ2Zyb20nLFxyXG4gICAgICBzdWJQcm9wNDogJ21lcmdlMicsXHJcbiAgICAgIGV4Y2VwdDogJ21lJyxcclxuICAgICAgc3ViUHJvcDU6ICdCT05KT1VSJ1xyXG4gICAgfSxcclxuICAgIHN1YmNvbXBvbmVudE9wdGlvbnMyOiB7XHJcbiAgICAgIHRlc3QyOiBbICd0ZXN0MicsICd0ZXN0MycgXSxcclxuICAgICAgc3ViU3ViY29tcG9uZW50T3B0aW9uczoge1xyXG4gICAgICAgIHRlc3Q6ICd0ZXN0IGZvcm0gbWVyZ2UzJyxcclxuICAgICAgICBzdWJTdWJQcm9wMTogJ3N1YlN1YiBmcm9tIG1lcmdlMydcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHByb3AzOiAnbmV3IHZhbHVlMycsXHJcbiAgICBwcm9wNDogJ3ZhbHVlNCcsXHJcbiAgICBwcm9wNTogJ3ZhbHVlNSBmcm9tIG1lcmdlMycsXHJcbiAgICBwcm9wNjogJ3ZhbHVlNidcclxuICB9O1xyXG4gIGFzc2VydC5ub3RFcXVhbCggbWVyZ2VkLCBleHBlY3RlZCwgJ3Nhbml0eSBjaGVjazogZW5zdXJlIG1lcmdlZCBhbmQgZXhwZWN0ZWQgb2JqZWN0cyBhcmUgbm90IHRoZSBzYW1lIHJlZmVyZW5jZScgKTtcclxuICBhc3NlcnQuZGVlcEVxdWFsKCBtZXJnZWQsIGV4cGVjdGVkLCAnbWVyZ2Ugc2hvdWxkIHByb3Blcmx5IGNvbWJpbmUgbXVsdGlwbGUgb2JqZWN0cycgKTtcclxuICBhc3NlcnQuZGVlcEVxdWFsKCBtZXJnZTEsIG1lcmdlMUNvcHksICdtZXJnZSBzaG91bGQgbm90IGFsdGVyIHNvdXJjZSBvYmplY3RzJyApO1xyXG4gIGFzc2VydC5kZWVwRXF1YWwoIG1lcmdlMiwgbWVyZ2UyQ29weSwgJ21lcmdlIHNob3VsZCBub3QgYWx0ZXIgc291cmNlIG9iamVjdHMnICk7XHJcbiAgYXNzZXJ0LmRlZXBFcXVhbCggbWVyZ2UzLCBtZXJnZTNDb3B5LCAnbWVyZ2Ugc2hvdWxkIG5vdCBhbHRlciBzb3VyY2Ugb2JqZWN0cycgKTtcclxufSApO1xyXG5cclxuLy8gY2hlY2sgdGhhdCBpdCBlcnJvcnMgbG91ZGx5IGlmIHNvbWV0aGluZyBvdGhlciB0aGFuIGFuIG9iamVjdCBpcyB1c2VkXHJcblFVbml0LnRlc3QoICdjaGVjayBmb3IgcHJvcGVyIGFzc2VydGlvbiBlcnJvcnMnLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IG9yaWdpbmFsID0ge1xyXG4gICAgc3ViT3B0aW9uczoge1xyXG4gICAgICB0ZXN0OiAndmFsJyxcclxuICAgICAgdGVzdDI6ICd2YWwyJ1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IFRlc3RDbGFzcyA9IGNsYXNzIHtcclxuICAgIHByaXZhdGUgdGVzdDogc3RyaW5nO1xyXG5cclxuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgdGhpcy50ZXN0ID0gJ2NsYXNzJztcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjb25zdCBtZXJnZXMgPSB7XHJcbiAgICBhOiB7XHJcbiAgICAgIHN1Yk9wdGlvbnM6IFsgJ3ZhbCcsICd2YWwyJyBdXHJcbiAgICB9LFxyXG4gICAgYjoge1xyXG4gICAgICBzdWJPcHRpb25zOiBPYmplY3QuY3JlYXRlKCB7IHRlc3Q6ICdhJywgdGVzdDE6IDMgfSApXHJcbiAgICB9LFxyXG4gICAgYzoge1xyXG4gICAgICBzdWJPcHRpb25zOiAnYSBzdHJpbmcgdG8gdGVzdCdcclxuICAgIH0sXHJcbiAgICBkOiB7XHJcbiAgICAgIHN1Yk9wdGlvbnM6IDQyXHJcbiAgICB9LFxyXG4gICAgZToge1xyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICAgIHN1Yk9wdGlvbnM6IGZ1bmN0aW9uKCkgeyB0aGlzLmEgPSA0MjsgfVxyXG4gICAgfSxcclxuICAgIGY6IHtcclxuICAgICAgc3ViT3B0aW9uczogbmV3IFRlc3RDbGFzcygpXHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgZ2V0dGVyTWVyZ2UgPSB7XHJcbiAgICBnZXQgc3ViT3B0aW9ucygpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICB0ZXN0OiAnc2hvdWxkIG5vdCB3b3JrJ1xyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGlmICggd2luZG93LmFzc2VydCApIHtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCBvcmlnaW5hbCwgbWVyZ2VzLmEgKSwgJ21lcmdlIHNob3VsZCBub3QgYWxsb3cgYXJyYXlzIHRvIGJlIG1lcmdlZCcgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCBvcmlnaW5hbCwgbWVyZ2VzLmIgKSwgJ21lcmdlIHNob3VsZCBub3QgYWxsb3cgaW5oZXJpdGVkIG9iamVjdHMgdG8gYmUgbWVyZ2VkJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIG9yaWdpbmFsLCBtZXJnZXMuZiApLCAnbWVyZ2Ugc2hvdWxkIG5vdCBhbGxvdyBpbnN0YW5jZXMgdG8gYmUgbWVyZ2VkJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIG9yaWdpbmFsLCBtZXJnZXMuYyApLCAnbWVyZ2Ugc2hvdWxkIG5vdCBhbGxvdyBzdHJpbmdzIHRvIGJlIG1lcmdlZCcgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCBvcmlnaW5hbCwgbWVyZ2VzLmQgKSwgJ21lcmdlIHNob3VsZCBub3QgYWxsb3cgbnVtYmVycyB0byBiZSBtZXJnZWQnICk7XHJcbiAgICBhc3NlcnQudGhyb3dzKCAoKSA9PiBtZXJnZSggb3JpZ2luYWwsIG1lcmdlcy5lICksICdtZXJnZSBzaG91bGQgbm90IGFsbG93IGZ1bmN0aW9ucyB0byBiZSBtZXJnZWQnICk7XHJcbiAgICBhc3NlcnQudGhyb3dzKCAoKSA9PiBtZXJnZSggb3JpZ2luYWwsIGdldHRlck1lcmdlICksICdtZXJnZSBzaG91bGQgbm90IHdvcmsgd2l0aCBnZXR0ZXJzJyApO1xyXG5cclxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgSU5URU5USU9OQUxcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCBvcmlnaW5hbCApLCAnbWVyZ2Ugc2hvdWxkIG5vdCB3b3JrIHdpdGhvdXQgYSBzb3VyY2UnICk7XHJcbiAgfVxyXG4gIGFzc2VydC5lcXVhbCggMSwgMSwgJ2ZvciBubyA/ZWEgcXVlcnkgcGFyYW0nICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdjaGVjayBmb3IgcmVmZXJlbmNlIGxldmVsIGVxdWFsaXR5IChlLmcuIGZvciBvYmplY3QgbGl0ZXJhbHMsIFByb3BlcnRpZXMsIEVudW1lcmF0aW9ucyknLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IHRlc3RFbnVtID0ge1xyXG4gICAgQToge1xyXG4gICAgICB0ZXN0QTogJ3ZhbHVlQSdcclxuICAgIH0sXHJcbiAgICBCOiB7XHJcbiAgICAgIHRlc3RCOiAndmFsdWVCJ1xyXG4gICAgfSxcclxuICAgIEM6IHtcclxuICAgICAgdGVzdEM6ICd2YWx1ZUMnXHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgdHlwZSBWYWx1ZWFibGUgPSB7IHZhbHVlOiBudW1iZXIgfCBzdHJpbmcgfTtcclxuICBjb25zdCB0ZXN0UHJvcGVydHk6IFZhbHVlYWJsZSA9IHsgdmFsdWU6IDQyIH07XHJcbiAgY29uc3QgdGVzdFByb3BlcnR5MjogVmFsdWVhYmxlID0geyB2YWx1ZTogJ2ZvcnR5IHR3bycgfTtcclxuICBjb25zdCBvcmlnaW5hbCA9IHtcclxuICAgIHByb3A6IHRlc3RQcm9wZXJ0eSxcclxuICAgIG5lc3RlZE9wdGlvbnM6IHtcclxuICAgICAgbmVlZHNBbkVudW06IHRlc3RFbnVtLkEsXHJcbiAgICAgIG1vcmVPcHRpb25zOiB7XHJcbiAgICAgICAgbmVlZHNBbkVudW06IHRlc3RFbnVtLkNcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcbiAgY29uc3QgbWVyZ2VyID0ge1xyXG4gICAgcHJvcDogdGVzdFByb3BlcnR5MixcclxuICAgIG5lc3RlZE9wdGlvbnM6IHtcclxuICAgICAgbmVlZHNBbkVudW06IHRlc3RFbnVtLkIsXHJcbiAgICAgIG1vcmVPcHRpb25zOiB7XHJcbiAgICAgICAgbmVlZHNEaWZmZXJlbnRFbnVtOiB0ZXN0RW51bS5BXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG4gIGNvbnN0IG9yaWdpbmFsQ29weSA9IF8uY2xvbmVEZWVwKCBvcmlnaW5hbCApO1xyXG4gIE9iamVjdC5mcmVlemUoIG9yaWdpbmFsICk7XHJcbiAgY29uc3QgbWVyZ2VkRnJlc2ggPSBtZXJnZSgge30sIG9yaWdpbmFsLCBtZXJnZXIgKTtcclxuICBhc3NlcnQuZXF1YWwoIG9yaWdpbmFsLnByb3AudmFsdWUsIG9yaWdpbmFsQ29weS5wcm9wLnZhbHVlLCAnbWVyZ2Ugc2hvdWxkIG5vdCBhbHRlciBzb3VyY2Ugb2JqZWN0IHZhbHVlcycgKTtcclxuICBhc3NlcnQub2soIF8uaXNFcXVhbCggb3JpZ2luYWwsIG9yaWdpbmFsQ29weSApLCAnbWVyZ2Ugc2hvdWxkIG5vdCBhbHRlciBzb3VyY2Ugb2JqZWN0cycgKTtcclxuICBhc3NlcnQuZXF1YWwoIG1lcmdlZEZyZXNoLm5lc3RlZE9wdGlvbnMubmVlZHNBbkVudW0sIHRlc3RFbnVtLkIsICdtZXJnZSBzaG91bGQgcHJlc2VydmUgcmVmZXJlbmNlcyB0byBvdmVyd3JpdHRlbiBvYmplY3QgbGl0ZXJhbHMnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCBtZXJnZWRGcmVzaC5uZXN0ZWRPcHRpb25zLm1vcmVPcHRpb25zLm5lZWRzQW5FbnVtLCB0ZXN0RW51bS5DLCAnbWVyZ2Ugc2hvdWxkIHByZXNlcnZlIG9iamVjdCBsaXRlcmFscyBmcm9tIHRhcmdldCcgKTtcclxuICBhc3NlcnQuZXF1YWwoIG1lcmdlZEZyZXNoLm5lc3RlZE9wdGlvbnMubW9yZU9wdGlvbnMubmVlZHNEaWZmZXJlbnRFbnVtLCB0ZXN0RW51bS5BLCAnbWVyZ2Ugc2hvdWxkIHByZXNlcnZlIG9iamVjdCBsaXRlcmFscyBmcm9tIHNvdXJjZScgKTtcclxuICBtZXJnZWRGcmVzaC5wcm9wLnZhbHVlID0gJ2ZvcnR5IHRocmVlJztcclxuICBhc3NlcnQuZXF1YWwoIHRlc3RQcm9wZXJ0eTIudmFsdWUsICdmb3J0eSB0aHJlZScsICdtZXJnZSBzaG91bGQgcGFzcyBvYmplY3QgbGl0ZXJhbCByZWZlcmVuY2VzJyApO1xyXG4gIGFzc2VydC5lcXVhbCggdGVzdFByb3BlcnR5LnZhbHVlLCA0MiwgJ29yaWdpbmFsIG9iamVjdCBsaXRlcmFsIHNob3VsZCBiZSBvdmVyd3JpdHRlbicgKTtcclxuXHJcbiAgY29uc3QgbWVyZ2VkID0gbWVyZ2UoIHt9LCBvcmlnaW5hbCwgbWVyZ2VyICk7XHJcbiAgYXNzZXJ0Lm9rKCBtZXJnZWQubmVzdGVkT3B0aW9ucy5uZWVkc0FuRW51bSA9PT0gdGVzdEVudW0uQiwgJ21lcmdlIHNob3VsZCBwcmVzZXJ2ZSBvdmVyd3JpdHRlbiBFbnVtZXJhdGlvbkRlcHJlY2F0ZWQgdHlwZXMnICk7XHJcbiAgYXNzZXJ0Lm9rKCBtZXJnZWQubmVzdGVkT3B0aW9ucy5tb3JlT3B0aW9ucy5uZWVkc0FuRW51bSA9PT0gdGVzdEVudW0uQywgJ21lcmdlIHNob3VsZCBwcmVzZXJ2ZSBFbnVtZXJhdGlvbkRlcHJlY2F0ZWQgdHlwZXMgZnJvbSB0YXJnZXQnICk7XHJcbiAgYXNzZXJ0Lm9rKCBtZXJnZWQubmVzdGVkT3B0aW9ucy5tb3JlT3B0aW9ucy5uZWVkc0RpZmZlcmVudEVudW0gPT09IHRlc3RFbnVtLkEsICdtZXJnZSBzaG91bGQgcHJlc2VydmUgRW51bWVyYXRpb25EZXByZWNhdGVkIHR5cGVzIGZyb20gc291cmNlJyApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAndHJ5IGEgaG9ycmlibHkgbmVzdGVkIGNhc2UnLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IG9yaWdpbmFsID0ge1xyXG4gICAgcDFPcHRpb25zOiB7IG4xT3B0aW9uczogeyBuMk9wdGlvbnM6IHsgbjNPcHRpb25zOiB7IG40T3B0aW9uczogeyBuNTogJ292ZXJ3cml0ZSBtZScgfSB9IH0gfSB9LFxyXG4gICAgcDJPcHRpb25zOiB7XHJcbiAgICAgIG4xT3B0aW9uczoge1xyXG4gICAgICAgIHAzOiAna2VlcCBtZSdcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcbiAgY29uc3QgbWVyZ2UxID0ge1xyXG4gICAgcDFPcHRpb25zOiB7XHJcbiAgICAgIG4xT3B0aW9uczoge1xyXG4gICAgICAgIG4yT3B0aW9uczoge1xyXG4gICAgICAgICAgbjNPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIG40T3B0aW9uczoge1xyXG4gICAgICAgICAgICAgIG41OiAnb3ZlcndyaXR0ZW4nXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBwMk9wdGlvbnM6IHtcclxuICAgICAgbjFPcHRpb25zOiB7XHJcbiAgICAgICAgcDQ6ICdwMyBrZXB0JyxcclxuICAgICAgICBuMk9wdGlvbnM6IHtcclxuICAgICAgICAgIG4zT3B0aW9uczoge1xyXG4gICAgICAgICAgICBuNE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICBuNU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIG42T3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICBwNTogJ25ldmVyIG1ha2Ugb3B0aW9ucyBsaWtlIHRoaXMnXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgT2JqZWN0LmZyZWV6ZSggbWVyZ2UxICk7XHJcbiAgY29uc3QgbWVyZ2VkID0gbWVyZ2UoIG9yaWdpbmFsLCBtZXJnZTEgKTtcclxuICBjb25zdCBleHBlY3RlZCA9IHtcclxuICAgIHAxT3B0aW9uczoge1xyXG4gICAgICBuMU9wdGlvbnM6IHtcclxuICAgICAgICBuMk9wdGlvbnM6IHtcclxuICAgICAgICAgIG4zT3B0aW9uczoge1xyXG4gICAgICAgICAgICBuNE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICBuNTogJ292ZXJ3cml0dGVuJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgcDJPcHRpb25zOiB7XHJcbiAgICAgIG4xT3B0aW9uczoge1xyXG4gICAgICAgIHAzOiAna2VlcCBtZScsXHJcbiAgICAgICAgcDQ6ICdwMyBrZXB0JyxcclxuICAgICAgICBuMk9wdGlvbnM6IHtcclxuICAgICAgICAgIG4zT3B0aW9uczoge1xyXG4gICAgICAgICAgICBuNE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICBuNU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIG42T3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICBwNTogJ25ldmVyIG1ha2Ugb3B0aW9ucyBsaWtlIHRoaXMnXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxuICBhc3NlcnQuZGVlcEVxdWFsKCBtZXJnZWQsIGV4cGVjdGVkLCAnbWVyZ2Ugc2hvdWxkIGhhbmRsZSBzb21lIGRlZXBseSBuZXN0ZWQgc3R1ZmYnICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdtaW5vciBjaGFuZ2UnLCBhc3NlcnQgPT4ge1xyXG4gIGNvbnN0IGEgPSB7XHJcbiAgICBzbGlkZXJPcHRpb25zOiB7XHJcbiAgICAgIGhlbGxvOiAndGhlcmUnXHJcbiAgICB9XHJcbiAgfTtcclxuICBjb25zdCBiID0ge1xyXG4gICAgc2xpZGVyT3B0aW9uczoge1xyXG4gICAgICB0aW1lOiAnbm93J1xyXG4gICAgfVxyXG4gIH07XHJcbiAgbWVyZ2UoIHt9LCBhLCBiICk7XHJcbiAgYXNzZXJ0Lm9rKCAhYS5zbGlkZXJPcHRpb25zLmhhc093blByb3BlcnR5KCAndGltZScgKSwgJ3RpbWUgc2hvdWxkbnQgbGVhayBvdmVyIHRvIGEnICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICd0ZXN0IHdyb25nIGFyZ3MnLCBhc3NlcnQgPT4ge1xyXG4gIGlmICggd2luZG93LmFzc2VydCApIHtcclxuXHJcbiAgICAvLyBpbiBmaXJzdCBhcmdcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCB1bmRlZmluZWQsIHt9ICksICd1bnN1cHBvcnRlZCBmaXJzdCBhcmcgXCJ1bmRlZmluZWRcIicgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCBudWxsLCB7fSApLCAndW5zdXBwb3J0ZWQgYXJnIFwibnVsbFwiJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIHRydWUsIHt9ICksICd1bnN1cHBvcnRlZCBhcmcgXCJib29sZWFuXCInICk7XHJcbiAgICBhc3NlcnQudGhyb3dzKCAoKSA9PiBtZXJnZSggJ2hlbGxvJywge30gKSwgJ3Vuc3VwcG9ydGVkIGFyZyBcInN0cmluZ1wiJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIDQsIHt9ICksICd1bnN1cHBvcnRlZCBhcmcgXCJudW1iZXJcIicgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCBJbWFnZSwge30gKSwgJ3Vuc3VwcG9ydGVkIGFyZyBvZiBPYmplY3Qgd2l0aCBleHRyYSBwcm90b3R5cGUnICk7XHJcbiAgICBhc3NlcnQudGhyb3dzKCAoKSA9PiBtZXJnZSggeyBnZXQgaGkoKSB7IHJldHVybiAzOyB9IH0sIHt9ICksICd1bnN1cHBvcnRlZCBhcmcgd2l0aCBnZXR0ZXInICk7XHJcbiAgICBhc3NlcnQudGhyb3dzKCAoKSA9PiBtZXJnZSggeyBzZXQgaGkoIHN0dWZmOiBudW1iZXIgKSB7IC8qIG5vb3AgKi99IH0sIHt9ICksICd1bnN1cHBvcnRlZCBhcmcgd2l0aCBzZXR0ZXInICk7XHJcblxyXG4gICAgLy8gaW4gc2Vjb25kIGFyZ1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIHt9LCB0cnVlLCB7fSApLCAndW5zdXBwb3J0ZWQgc2Vjb25kIGFyZyBcImJvb2xlYW5cIicgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCB7fSwgJ2hlbGxvJywge30gKSwgJ3Vuc3VwcG9ydGVkIHNlY29uZCBhcmcgXCJzdHJpbmdcIicgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCB7fSwgNCwge30gKSwgJ3Vuc3VwcG9ydGVkIHNlY29uZCBhcmcgXCJudW1iZXJcIicgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCB7fSwgSW1hZ2UsIHt9ICksICd1bnN1cHBvcnRlZCBzZWNvbmQgYXJnIG9mIE9iamVjdCB3aXRoIGV4dHJhIHByb3RvdHlwZScgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCB7fSwgeyBnZXQgaGkoKSB7IHJldHVybiAzOyB9IH0sIHt9ICksICd1bnN1cHBvcnRlZCBzZWNvbmQgYXJnIHdpdGggZ2V0dGVyJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIHt9LCB7IHNldCBoaSggc3R1ZmY6IG51bWJlciApIHsvKiBub29wICovfSB9LCB7fSApLCAndW5zdXBwb3J0ZWQgc2Vjb25kIGFyZyB3aXRoIHNldHRlcicgKTtcclxuXHJcbiAgICAvLyBpbiBzZWNvbmQgYXJnIHdpdGggbm8gdGhpcmQgb2JqZWN0XHJcbiAgICBhc3NlcnQudGhyb3dzKCAoKSA9PiBtZXJnZSgge30sIHRydWUgKSwgJ3Vuc3VwcG9ydGVkIHNlY29uZCBhcmcgd2l0aCBubyB0aGlyZCBcImJvb2xlYW5cIicgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCB7fSwgJ2hlbGxvJyApLCAndW5zdXBwb3J0ZWQgc2Vjb25kIGFyZyB3aXRoIG5vIHRoaXJkIFwic3RyaW5nXCInICk7XHJcbiAgICBhc3NlcnQudGhyb3dzKCAoKSA9PiBtZXJnZSgge30sIDQgKSwgJ3Vuc3VwcG9ydGVkIHNlY29uZCBhcmcgd2l0aCBubyB0aGlyZCBcIm51bWJlclwiJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIHt9LCBJbWFnZSApLCAndW5zdXBwb3J0ZWQgc2Vjb25kIGFyZyB3aXRoIG5vIHRoaXJkIG9mIE9iamVjdCB3aXRoIGV4dHJhIHByb3RvdHlwZScgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCB7fSwgeyBnZXQgaGkoKSB7IHJldHVybiAzOyB9IH0gKSwgJ3Vuc3VwcG9ydGVkIHNlY29uZCBhcmcgd2l0aCBubyB0aGlyZCB3aXRoIGdldHRlcicgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCB7fSwgeyBzZXQgaGkoIHN0dWZmOiBudW1iZXIgKSB7Lyogbm9vcCAqL30gfSApLCAndW5zdXBwb3J0ZWQgc2Vjb25kIGFyZyB3aXRoIG5vIHRoaXJkIHdpdGggZ2V0dGVyJyApO1xyXG5cclxuICAgIC8vIGluIHNvbWUgb3B0aW9uc1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIHt9LCB7IHNvbWVPcHRpb25zOiB0cnVlIH0sIHt9ICksICd1bnN1cHBvcnRlZCBhcmcgaW4gb3B0aW9ucyBcImJvb2xlYW5cIicgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCB7fSwgeyBzb21lT3B0aW9uczogJ2hlbGxvJyB9LCB7fSApLCAndW5zdXBwb3J0ZWQgYXJnIGluIG9wdGlvbnMgXCJzdHJpbmdcIicgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCB7fSwgeyBzb21lT3B0aW9uczogNCB9LCB7fSApLCAndW5zdXBwb3J0ZWQgYXJnIGluIG9wdGlvbnMgXCJudW1iZXJcIicgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCB7fSwgeyBzb21lT3B0aW9uczogSW1hZ2UgfSwge30gKSwgJ3Vuc3VwcG9ydGVkIGFyZyBpbiBvcHRpb25zIG9mIE9iamVjdCB3aXRoIGV4dHJhIHByb3RvdHlwZScgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCB7fSwgeyBzb21lT3B0aW9uczogeyBnZXQgaGkoKSB7IHJldHVybiAzOyB9IH0gfSwge30gKSwgJ3Vuc3VwcG9ydGVkIGFyZyBpbiBvcHRpb25zIHdpdGggZ2V0dGVyJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIHt9LCB7IHNvbWVPcHRpb25zOiB7IHNldCBoaSggc3R1ZmY6IG51bWJlciApIHsvKiBub29wICovfSB9IH0sIHt9ICksICd1bnN1cHBvcnRlZCBhcmcgaW4gb3B0aW9ucyB3aXRoIGdldHRlcicgKTtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICBhc3NlcnQub2soIHRydWUsICdubyBhc3NlcnRpb25zIGVuYWJsZWQnICk7XHJcbiAgfVxyXG5cclxuICAvLyBhbGxvd2VkIGNhc2VzIHRoYXQgc2hvdWxkIG5vdCBlcnJvclxyXG4gIG1lcmdlKCB7fSwgbnVsbCwge30gKTtcclxuICBtZXJnZSgge30sIG51bGwgKTtcclxuICBtZXJnZSgge30sIHt9LCBudWxsICk7XHJcbiAgbWVyZ2UoIHsgeE9wdGlvbnM6IHsgdGVzdDogMSB9IH0sIHsgeE9wdGlvbnM6IG51bGwgfSApO1xyXG4gIG1lcmdlKCB7fSwgeyBzb21lT3B0aW9uczogbnVsbCB9LCB7fSApO1xyXG4gIG1lcmdlKCB7fSwgeyBzb21lT3B0aW9uczogdW5kZWZpbmVkIH0sIHt9ICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdkbyBub3QgcmVjdXJzZSBmb3Igbm9uICpPcHRpb25zJywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgY29uc3QgdGVzdEZpcnN0UHJvcGVydHkgPSBuZXcgUHJvcGVydHkoICdoaScgKTtcclxuICBjb25zdCB0ZXN0U2Vjb25kUHJvcGVydHkgPSBuZXcgUHJvcGVydHkoICdoaTInICk7XHJcbiAgY29uc3QgVGVzdEVudW1lcmF0aW9uID0gRW51bWVyYXRpb25EZXByZWNhdGVkLmJ5S2V5cyggWyAnT05FJywgJ1RXTycgXSApO1xyXG4gIGNvbnN0IFRlc3RFbnVtZXJhdGlvbjIgPSBFbnVtZXJhdGlvbkRlcHJlY2F0ZWQuYnlLZXlzKCBbICdPTkUxJywgJ1RXTzInIF0gKTtcclxuICBjb25zdCBvcmlnaW5hbCA9IHtcclxuICAgIHByb3A6IHRlc3RGaXJzdFByb3BlcnR5LFxyXG4gICAgZW51bTogVGVzdEVudW1lcmF0aW9uLFxyXG4gICAgc29tZU9wdGlvbnM6IHsgbmVzdGVkUHJvcDogdGVzdEZpcnN0UHJvcGVydHkgfVxyXG4gIH07XHJcblxyXG4gIGxldCBuZXdPYmplY3QgPSBtZXJnZSgge30sIG9yaWdpbmFsICk7XHJcbiAgYXNzZXJ0Lm9rKCBfLmlzRXF1YWwoIG9yaWdpbmFsLCBuZXdPYmplY3QgKSwgJ3Nob3VsZCBiZSBlcXVhbCBmcm9tIHJlZmVyZW5jZSBlcXVhbGl0eScgKTtcclxuICBhc3NlcnQub2soIG9yaWdpbmFsLnByb3AgPT09IG5ld09iamVjdC5wcm9wLCAnc2FtZSBQcm9wZXJ0eScgKTtcclxuICBhc3NlcnQub2soIG9yaWdpbmFsLmVudW0gPT09IG5ld09iamVjdC5lbnVtLCAnc2FtZSBFbnVtZXJhdGlvbkRlcHJlY2F0ZWQnICk7XHJcblxyXG4gIC8vIHRlc3QgZGVmYXVsdHMgd2l0aCBvdGhlciBub24gbWVyZ2VhYmxlIG9iamVjdHNcclxuICBuZXdPYmplY3QgPSBtZXJnZSgge1xyXG4gICAgcHJvcDogdGVzdFNlY29uZFByb3BlcnR5LFxyXG4gICAgZW51bTogVGVzdEVudW1lcmF0aW9uMixcclxuICAgIHNvbWVPcHRpb25zOiB7IG5lc3RlZFByb3A6IHRlc3RTZWNvbmRQcm9wZXJ0eSB9XHJcbiAgfSwgb3JpZ2luYWwgKTtcclxuICBhc3NlcnQub2soIF8uaXNFcXVhbCggb3JpZ2luYWwsIG5ld09iamVjdCApLCAnc2hvdWxkIGJlIGVxdWFsJyApO1xyXG4gIGFzc2VydC5vayggb3JpZ2luYWwucHJvcCA9PT0gbmV3T2JqZWN0LnByb3AsICdzYW1lIFByb3BlcnR5LCBpZ25vcmUgZGVmYXVsdCcgKTtcclxuICBhc3NlcnQub2soIG9yaWdpbmFsLmVudW0gPT09IG5ld09iamVjdC5lbnVtLCAnc2FtZSBFbnVtZXJhdGlvbkRlcHJlY2F0ZWQsIGlnbm9yZSBkZWZhdWx0JyApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnc3VwcG9ydCBvcHRpb25hbCBvcHRpb25zJywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgY29uc3QgbWVyZ2VYWVogPSAoIG9wdGlvbnM/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiApID0+IHtcclxuICAgIHJldHVybiBtZXJnZSgge1xyXG4gICAgICB4OiAxLFxyXG4gICAgICB5OiAyLFxyXG4gICAgICB6OiAzXHJcbiAgICB9LCBvcHRpb25zICk7XHJcbiAgfTtcclxuICBjb25zdCBub09wdGlvbnMgPSBtZXJnZVhZWigpO1xyXG4gIGFzc2VydC5vayggbm9PcHRpb25zLnggPT09IDEsICd4IHByb3BlcnR5IHNob3VsZCBiZSBtZXJnZWQgZnJvbSBkZWZhdWx0JyApO1xyXG4gIGFzc2VydC5vayggbm9PcHRpb25zLnkgPT09IDIsICd5IHByb3BlcnR5IHNob3VsZCBiZSBtZXJnZWQgZnJvbSBkZWZhdWx0JyApO1xyXG4gIGFzc2VydC5vayggbm9PcHRpb25zLnogPT09IDMsICd6IHByb3BlcnR5IHNob3VsZCBiZSBtZXJnZWQgZnJvbSBkZWZhdWx0JyApO1xyXG5cclxuICBjb25zdCB0ZXN0TmVzdGVkRnVuY3Rpb25DYWxsT3B0aW9ucyA9ICggb3B0aW9ucz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+ICkgPT4ge1xyXG4gICAgcmV0dXJuIG1lcmdlWFlaKCBtZXJnZSgge1xyXG4gICAgICB4OiAyLFxyXG4gICAgICBnOiA1NCxcclxuICAgICAgdHJlZVNheXM6ICdoZWxsbydcclxuICAgIH0sIG9wdGlvbnMgKSApO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IG5vT3B0aW9uczIgPSB0ZXN0TmVzdGVkRnVuY3Rpb25DYWxsT3B0aW9ucygpO1xyXG4gIGFzc2VydC5vayggbm9PcHRpb25zMi54ID09PSAyLCAneCBwcm9wZXJ0eSBzaG91bGQgYmUgbWVyZ2VkIGZyb20gZGVmYXVsdCcgKTtcclxuICBhc3NlcnQub2soIG5vT3B0aW9uczIueSA9PT0gMiwgJ3kgcHJvcGVydHkgc2hvdWxkIGJlIG1lcmdlZCBmcm9tIGRlZmF1bHQnICk7XHJcbiAgYXNzZXJ0Lm9rKCBub09wdGlvbnMyLnogPT09IDMsICd6IHByb3BlcnR5IHNob3VsZCBiZSBtZXJnZWQgZnJvbSBkZWZhdWx0JyApO1xyXG5cclxuICBhc3NlcnQub2soIG5vT3B0aW9uczIuZyA9PT0gNTQsICdnIHByb3BlcnR5IHNob3VsZCBiZSBtZXJnZWQgZnJvbSBkZWZhdWx0JyApO1xyXG4gIGFzc2VydC5vayggbm9PcHRpb25zMi50cmVlU2F5cyA9PT0gJ2hlbGxvJywgJ3Byb3BlcnR5IHNob3VsZCBiZSBtZXJnZWQgZnJvbSBkZWZhdWx0JyApO1xyXG59ICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnZG9lcyBub3Qgc3VwcG9ydCBkZWVwIGVxdWFscyBvbiBrZXluYW1lIG9mIFwiT3B0aW9uc1wiJywgYXNzZXJ0ID0+IHtcclxuXHJcbiAgY29uc3QgcmVmZXJlbmNlT2JqZWN0ID0ge1xyXG4gICAgaGVsbG86IDJcclxuICB9O1xyXG5cclxuICBjb25zdCBtZXJnZWQgPSBtZXJnZSgge30sIHtcclxuICAgIE9wdGlvbnM6IHJlZmVyZW5jZU9iamVjdFxyXG4gIH0gKTtcclxuXHJcbiAgY29uc3QgZGVlcE1lcmdlZCA9IG1lcmdlKCB7fSwge1xyXG4gICAgc29tZU9wdGlvbnM6IHJlZmVyZW5jZU9iamVjdFxyXG4gIH0gKTtcclxuXHJcbiAgYXNzZXJ0Lm9rKCBtZXJnZWQuT3B0aW9ucyA9PT0gcmVmZXJlbmNlT2JqZWN0LCAnXCJPcHRpb25zXCIgc2hvdWxkIG5vdCBkZWVwIGVxdWFsJyApO1xyXG4gIHJlZmVyZW5jZU9iamVjdC5oZWxsbyA9IDM7XHJcbiAgYXNzZXJ0Lm9rKCBtZXJnZWQuT3B0aW9ucy5oZWxsbyA9PT0gMywgJ3ZhbHVlIHNob3VsZCBjaGFuZ2UgYmVjYXVzZSBpdCBpcyBhIHJlZmVyZW5jZScgKTtcclxuICBhc3NlcnQub2soIGRlZXBNZXJnZWQuc29tZU9wdGlvbnMuaGVsbG8gPT09IDIsICd2YWx1ZSBzaG91bGQgbm90IGNoYW5nZSBiZWNhdXNlIGl0IHdhcyBkZWVwIGNvcGllZCcgKTtcclxufSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTs7QUFHQSxPQUFPQSxRQUFRLE1BQU0sMkJBQTJCO0FBQ2hELE9BQU9DLHFCQUFxQixNQUFNLDRCQUE0QjtBQUM5RCxPQUFPQyxLQUFLLE1BQU0sWUFBWTtBQUc5QkMsS0FBSyxDQUFDQyxNQUFNLENBQUUsT0FBUSxDQUFDOztBQUV2QjtBQUNBRCxLQUFLLENBQUNFLElBQUksQ0FBRSxtQkFBbUIsRUFBRUMsTUFBTSxJQUFJO0VBQ3pDLE1BQU1DLFFBQVEsR0FBRztJQUNmQyxLQUFLLEVBQUUsUUFBUTtJQUNmQyxLQUFLLEVBQUUsUUFBUTtJQUNmQyxtQkFBbUIsRUFBRTtNQUNuQkMsUUFBUSxFQUFFLFdBQVc7TUFDckJDLFFBQVEsRUFBRTtJQUNaLENBQUM7SUFDREMsb0JBQW9CLEVBQUU7TUFDcEJDLHNCQUFzQixFQUFFO1FBQ3RCQyxXQUFXLEVBQUU7TUFDZjtJQUNG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