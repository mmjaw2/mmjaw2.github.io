"use strict";

var _Property = _interopRequireDefault(require("../../axon/js/Property.js"));
var _EnumerationDeprecated = _interopRequireDefault(require("./EnumerationDeprecated.js"));
var _merge = _interopRequireDefault(require("./merge.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } // Copyright 2019-2024, University of Colorado Boulder
// @author Michael Kauzmann (PhET Interactive Simulations)
QUnit.module('merge');

// test proper merger for 2 objects
QUnit.test('merge two objects', function (assert) {
  var original = {
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
  var merge1 = {
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
  var preMergeSourceCopy = Object.assign({}, merge1);
  var merged = (0, _merge["default"])(original, merge1);
  assert.equal(merged.prop1, 'value1', 'merge should not alter target keys that aren\'t in the source');
  assert.equal(merged.prop4, 'value4', 'merge should not alter source keys that aren\'t in the target');
  var shouldBe = {
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
QUnit.test('test multiple objects', function (assert) {
  var original = {
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
  var merge1 = {
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
  var merge2 = {
    prop5: 'value5',
    subcomponentOptions: {
      subProp1: 'everything',
      subProp2: 'here is',
      subProp3: 'from',
      subProp4: 'merge2'
    }
  };
  var merge3 = {
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
  var merge1Copy = _.cloneDeep(merge1);
  var merge2Copy = _.cloneDeep(merge2);
  var merge3Copy = _.cloneDeep(merge3);
  Object.freeze(merge1);
  Object.freeze(merge2);
  Object.freeze(merge3);
  var merged = (0, _merge["default"])(original, merge1, merge2, merge3);
  var expected = {
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
QUnit.test('check for proper assertion errors', function (assert) {
  var original = {
    subOptions: {
      test: 'val',
      test2: 'val2'
    }
  };
  var TestClass = /*#__PURE__*/_createClass(function TestClass() {
    _classCallCheck(this, TestClass);
    _defineProperty(this, "test", void 0);
    this.test = 'class';
  });
  var merges = {
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
      subOptions: function subOptions() {
        this.a = 42;
      }
    },
    f: {
      subOptions: new TestClass()
    }
  };
  var getterMerge = {
    get subOptions() {
      return {
        test: 'should not work'
      };
    }
  };
  if (window.assert) {
    assert["throws"](function () {
      return (0, _merge["default"])(original, merges.a);
    }, 'merge should not allow arrays to be merged');
    assert["throws"](function () {
      return (0, _merge["default"])(original, merges.b);
    }, 'merge should not allow inherited objects to be merged');
    assert["throws"](function () {
      return (0, _merge["default"])(original, merges.f);
    }, 'merge should not allow instances to be merged');
    assert["throws"](function () {
      return (0, _merge["default"])(original, merges.c);
    }, 'merge should not allow strings to be merged');
    assert["throws"](function () {
      return (0, _merge["default"])(original, merges.d);
    }, 'merge should not allow numbers to be merged');
    assert["throws"](function () {
      return (0, _merge["default"])(original, merges.e);
    }, 'merge should not allow functions to be merged');
    assert["throws"](function () {
      return (0, _merge["default"])(original, getterMerge);
    }, 'merge should not work with getters');

    // @ts-expect-error INTENTIONAL
    assert["throws"](function () {
      return (0, _merge["default"])(original);
    }, 'merge should not work without a source');
  }
  assert.equal(1, 1, 'for no ?ea query param');
});
QUnit.test('check for reference level equality (e.g. for object literals, Properties, Enumerations)', function (assert) {
  var testEnum = {
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
  var testProperty = {
    value: 42
  };
  var testProperty2 = {
    value: 'forty two'
  };
  var original = {
    prop: testProperty,
    nestedOptions: {
      needsAnEnum: testEnum.A,
      moreOptions: {
        needsAnEnum: testEnum.C
      }
    }
  };
  var merger = {
    prop: testProperty2,
    nestedOptions: {
      needsAnEnum: testEnum.B,
      moreOptions: {
        needsDifferentEnum: testEnum.A
      }
    }
  };
  var originalCopy = _.cloneDeep(original);
  Object.freeze(original);
  var mergedFresh = (0, _merge["default"])({}, original, merger);
  assert.equal(original.prop.value, originalCopy.prop.value, 'merge should not alter source object values');
  assert.ok(_.isEqual(original, originalCopy), 'merge should not alter source objects');
  assert.equal(mergedFresh.nestedOptions.needsAnEnum, testEnum.B, 'merge should preserve references to overwritten object literals');
  assert.equal(mergedFresh.nestedOptions.moreOptions.needsAnEnum, testEnum.C, 'merge should preserve object literals from target');
  assert.equal(mergedFresh.nestedOptions.moreOptions.needsDifferentEnum, testEnum.A, 'merge should preserve object literals from source');
  mergedFresh.prop.value = 'forty three';
  assert.equal(testProperty2.value, 'forty three', 'merge should pass object literal references');
  assert.equal(testProperty.value, 42, 'original object literal should be overwritten');
  var merged = (0, _merge["default"])({}, original, merger);
  assert.ok(merged.nestedOptions.needsAnEnum === testEnum.B, 'merge should preserve overwritten EnumerationDeprecated types');
  assert.ok(merged.nestedOptions.moreOptions.needsAnEnum === testEnum.C, 'merge should preserve EnumerationDeprecated types from target');
  assert.ok(merged.nestedOptions.moreOptions.needsDifferentEnum === testEnum.A, 'merge should preserve EnumerationDeprecated types from source');
});
QUnit.test('try a horribly nested case', function (assert) {
  var original = {
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
  var merge1 = {
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
  var merged = (0, _merge["default"])(original, merge1);
  var expected = {
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
QUnit.test('minor change', function (assert) {
  var a = {
    sliderOptions: {
      hello: 'there'
    }
  };
  var b = {
    sliderOptions: {
      time: 'now'
    }
  };
  (0, _merge["default"])({}, a, b);
  assert.ok(!a.sliderOptions.hasOwnProperty('time'), 'time shouldnt leak over to a');
});
QUnit.test('test wrong args', function (assert) {
  if (window.assert) {
    // in first arg
    assert["throws"](function () {
      return (0, _merge["default"])(undefined, {});
    }, 'unsupported first arg "undefined"');
    assert["throws"](function () {
      return (0, _merge["default"])(null, {});
    }, 'unsupported arg "null"');
    assert["throws"](function () {
      return (0, _merge["default"])(true, {});
    }, 'unsupported arg "boolean"');
    assert["throws"](function () {
      return (0, _merge["default"])('hello', {});
    }, 'unsupported arg "string"');
    assert["throws"](function () {
      return (0, _merge["default"])(4, {});
    }, 'unsupported arg "number"');
    assert["throws"](function () {
      return (0, _merge["default"])(Image, {});
    }, 'unsupported arg of Object with extra prototype');
    assert["throws"](function () {
      return (0, _merge["default"])({
        get hi() {
          return 3;
        }
      }, {});
    }, 'unsupported arg with getter');
    assert["throws"](function () {
      return (0, _merge["default"])({
        set hi(stuff) {/* noop */}
      }, {});
    }, 'unsupported arg with setter');

    // in second arg
    assert["throws"](function () {
      return (0, _merge["default"])({}, true, {});
    }, 'unsupported second arg "boolean"');
    assert["throws"](function () {
      return (0, _merge["default"])({}, 'hello', {});
    }, 'unsupported second arg "string"');
    assert["throws"](function () {
      return (0, _merge["default"])({}, 4, {});
    }, 'unsupported second arg "number"');
    assert["throws"](function () {
      return (0, _merge["default"])({}, Image, {});
    }, 'unsupported second arg of Object with extra prototype');
    assert["throws"](function () {
      return (0, _merge["default"])({}, {
        get hi() {
          return 3;
        }
      }, {});
    }, 'unsupported second arg with getter');
    assert["throws"](function () {
      return (0, _merge["default"])({}, {
        set hi(stuff) {/* noop */}
      }, {});
    }, 'unsupported second arg with setter');

    // in second arg with no third object
    assert["throws"](function () {
      return (0, _merge["default"])({}, true);
    }, 'unsupported second arg with no third "boolean"');
    assert["throws"](function () {
      return (0, _merge["default"])({}, 'hello');
    }, 'unsupported second arg with no third "string"');
    assert["throws"](function () {
      return (0, _merge["default"])({}, 4);
    }, 'unsupported second arg with no third "number"');
    assert["throws"](function () {
      return (0, _merge["default"])({}, Image);
    }, 'unsupported second arg with no third of Object with extra prototype');
    assert["throws"](function () {
      return (0, _merge["default"])({}, {
        get hi() {
          return 3;
        }
      });
    }, 'unsupported second arg with no third with getter');
    assert["throws"](function () {
      return (0, _merge["default"])({}, {
        set hi(stuff) {/* noop */}
      });
    }, 'unsupported second arg with no third with getter');

    // in some options
    assert["throws"](function () {
      return (0, _merge["default"])({}, {
        someOptions: true
      }, {});
    }, 'unsupported arg in options "boolean"');
    assert["throws"](function () {
      return (0, _merge["default"])({}, {
        someOptions: 'hello'
      }, {});
    }, 'unsupported arg in options "string"');
    assert["throws"](function () {
      return (0, _merge["default"])({}, {
        someOptions: 4
      }, {});
    }, 'unsupported arg in options "number"');
    assert["throws"](function () {
      return (0, _merge["default"])({}, {
        someOptions: Image
      }, {});
    }, 'unsupported arg in options of Object with extra prototype');
    assert["throws"](function () {
      return (0, _merge["default"])({}, {
        someOptions: {
          get hi() {
            return 3;
          }
        }
      }, {});
    }, 'unsupported arg in options with getter');
    assert["throws"](function () {
      return (0, _merge["default"])({}, {
        someOptions: {
          set hi(stuff) {/* noop */}
        }
      }, {});
    }, 'unsupported arg in options with getter');
  } else {
    assert.ok(true, 'no assertions enabled');
  }

  // allowed cases that should not error
  (0, _merge["default"])({}, null, {});
  (0, _merge["default"])({}, null);
  (0, _merge["default"])({}, {}, null);
  (0, _merge["default"])({
    xOptions: {
      test: 1
    }
  }, {
    xOptions: null
  });
  (0, _merge["default"])({}, {
    someOptions: null
  }, {});
  (0, _merge["default"])({}, {
    someOptions: undefined
  }, {});
});
QUnit.test('do not recurse for non *Options', function (assert) {
  var testFirstProperty = new _Property["default"]('hi');
  var testSecondProperty = new _Property["default"]('hi2');
  var TestEnumeration = _EnumerationDeprecated["default"].byKeys(['ONE', 'TWO']);
  var TestEnumeration2 = _EnumerationDeprecated["default"].byKeys(['ONE1', 'TWO2']);
  var original = {
    prop: testFirstProperty,
    "enum": TestEnumeration,
    someOptions: {
      nestedProp: testFirstProperty
    }
  };
  var newObject = (0, _merge["default"])({}, original);
  assert.ok(_.isEqual(original, newObject), 'should be equal from reference equality');
  assert.ok(original.prop === newObject.prop, 'same Property');
  assert.ok(original["enum"] === newObject["enum"], 'same EnumerationDeprecated');

  // test defaults with other non mergeable objects
  newObject = (0, _merge["default"])({
    prop: testSecondProperty,
    "enum": TestEnumeration2,
    someOptions: {
      nestedProp: testSecondProperty
    }
  }, original);
  assert.ok(_.isEqual(original, newObject), 'should be equal');
  assert.ok(original.prop === newObject.prop, 'same Property, ignore default');
  assert.ok(original["enum"] === newObject["enum"], 'same EnumerationDeprecated, ignore default');
});
QUnit.test('support optional options', function (assert) {
  var mergeXYZ = function mergeXYZ(options) {
    return (0, _merge["default"])({
      x: 1,
      y: 2,
      z: 3
    }, options);
  };
  var noOptions = mergeXYZ();
  assert.ok(noOptions.x === 1, 'x property should be merged from default');
  assert.ok(noOptions.y === 2, 'y property should be merged from default');
  assert.ok(noOptions.z === 3, 'z property should be merged from default');
  var testNestedFunctionCallOptions = function testNestedFunctionCallOptions(options) {
    return mergeXYZ((0, _merge["default"])({
      x: 2,
      g: 54,
      treeSays: 'hello'
    }, options));
  };
  var noOptions2 = testNestedFunctionCallOptions();
  assert.ok(noOptions2.x === 2, 'x property should be merged from default');
  assert.ok(noOptions2.y === 2, 'y property should be merged from default');
  assert.ok(noOptions2.z === 3, 'z property should be merged from default');
  assert.ok(noOptions2.g === 54, 'g property should be merged from default');
  assert.ok(noOptions2.treeSays === 'hello', 'property should be merged from default');
});
QUnit.test('does not support deep equals on keyname of "Options"', function (assert) {
  var referenceObject = {
    hello: 2
  };
  var merged = (0, _merge["default"])({}, {
    Options: referenceObject
  });
  var deepMerged = (0, _merge["default"])({}, {
    someOptions: referenceObject
  });
  assert.ok(merged.Options === referenceObject, '"Options" should not deep equal');
  referenceObject.hello = 3;
  assert.ok(merged.Options.hello === 3, 'value should change because it is a reference');
  assert.ok(deepMerged.someOptions.hello === 2, 'value should not change because it was deep copied');
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfUHJvcGVydHkiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9FbnVtZXJhdGlvbkRlcHJlY2F0ZWQiLCJfbWVyZ2UiLCJvYmoiLCJfX2VzTW9kdWxlIiwiX3R5cGVvZiIsIm8iLCJTeW1ib2wiLCJpdGVyYXRvciIsImNvbnN0cnVjdG9yIiwicHJvdG90eXBlIiwiX2RlZmluZVByb3BlcnRpZXMiLCJ0YXJnZXQiLCJwcm9wcyIsImkiLCJsZW5ndGgiLCJkZXNjcmlwdG9yIiwiZW51bWVyYWJsZSIsImNvbmZpZ3VyYWJsZSIsIndyaXRhYmxlIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJfdG9Qcm9wZXJ0eUtleSIsImtleSIsIl9jcmVhdGVDbGFzcyIsIkNvbnN0cnVjdG9yIiwicHJvdG9Qcm9wcyIsInN0YXRpY1Byb3BzIiwiX2NsYXNzQ2FsbENoZWNrIiwiaW5zdGFuY2UiLCJUeXBlRXJyb3IiLCJfZGVmaW5lUHJvcGVydHkiLCJ2YWx1ZSIsInQiLCJfdG9QcmltaXRpdmUiLCJyIiwiZSIsInRvUHJpbWl0aXZlIiwiY2FsbCIsIlN0cmluZyIsIk51bWJlciIsIlFVbml0IiwibW9kdWxlIiwidGVzdCIsImFzc2VydCIsIm9yaWdpbmFsIiwicHJvcDEiLCJwcm9wMiIsInN1YmNvbXBvbmVudE9wdGlvbnMiLCJzdWJQcm9wMSIsInN1YlByb3AyIiwic3ViY29tcG9uZW50T3B0aW9uczIiLCJzdWJTdWJjb21wb25lbnRPcHRpb25zIiwic3ViU3ViUHJvcDEiLCJwcm9wMyIsIm1lcmdlMSIsInN1YlByb3AzIiwicHJvcDQiLCJwcmVNZXJnZVNvdXJjZUNvcHkiLCJhc3NpZ24iLCJtZXJnZWQiLCJtZXJnZSIsImVxdWFsIiwic2hvdWxkQmUiLCJkZWVwRXF1YWwiLCJleGNlcHQiLCJtZXJnZTIiLCJwcm9wNSIsInN1YlByb3A0IiwibWVyZ2UzIiwicHJvcDYiLCJzdWJQcm9wNSIsInRlc3QyIiwibWVyZ2UxQ29weSIsIl8iLCJjbG9uZURlZXAiLCJtZXJnZTJDb3B5IiwibWVyZ2UzQ29weSIsImZyZWV6ZSIsImV4cGVjdGVkIiwibm90RXF1YWwiLCJzdWJPcHRpb25zIiwiVGVzdENsYXNzIiwibWVyZ2VzIiwiYSIsImIiLCJjcmVhdGUiLCJ0ZXN0MSIsImMiLCJkIiwiZiIsImdldHRlck1lcmdlIiwid2luZG93IiwidGVzdEVudW0iLCJBIiwidGVzdEEiLCJCIiwidGVzdEIiLCJDIiwidGVzdEMiLCJ0ZXN0UHJvcGVydHkiLCJ0ZXN0UHJvcGVydHkyIiwicHJvcCIsIm5lc3RlZE9wdGlvbnMiLCJuZWVkc0FuRW51bSIsIm1vcmVPcHRpb25zIiwibWVyZ2VyIiwibmVlZHNEaWZmZXJlbnRFbnVtIiwib3JpZ2luYWxDb3B5IiwibWVyZ2VkRnJlc2giLCJvayIsImlzRXF1YWwiLCJwMU9wdGlvbnMiLCJuMU9wdGlvbnMiLCJuMk9wdGlvbnMiLCJuM09wdGlvbnMiLCJuNE9wdGlvbnMiLCJuNSIsInAyT3B0aW9ucyIsInAzIiwicDQiLCJuNU9wdGlvbnMiLCJuNk9wdGlvbnMiLCJwNSIsInNsaWRlck9wdGlvbnMiLCJoZWxsbyIsInRpbWUiLCJoYXNPd25Qcm9wZXJ0eSIsInVuZGVmaW5lZCIsIkltYWdlIiwiaGkiLCJzdHVmZiIsInNvbWVPcHRpb25zIiwieE9wdGlvbnMiLCJ0ZXN0Rmlyc3RQcm9wZXJ0eSIsIlByb3BlcnR5IiwidGVzdFNlY29uZFByb3BlcnR5IiwiVGVzdEVudW1lcmF0aW9uIiwiRW51bWVyYXRpb25EZXByZWNhdGVkIiwiYnlLZXlzIiwiVGVzdEVudW1lcmF0aW9uMiIsIm5lc3RlZFByb3AiLCJuZXdPYmplY3QiLCJtZXJnZVhZWiIsIm9wdGlvbnMiLCJ4IiwieSIsInoiLCJub09wdGlvbnMiLCJ0ZXN0TmVzdGVkRnVuY3Rpb25DYWxsT3B0aW9ucyIsImciLCJ0cmVlU2F5cyIsIm5vT3B0aW9uczIiLCJyZWZlcmVuY2VPYmplY3QiLCJPcHRpb25zIiwiZGVlcE1lcmdlZCJdLCJzb3VyY2VzIjpbIm1lcmdlVGVzdHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcbi8vIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuXHJcblxyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBFbnVtZXJhdGlvbkRlcHJlY2F0ZWQgZnJvbSAnLi9FbnVtZXJhdGlvbkRlcHJlY2F0ZWQuanMnO1xyXG5pbXBvcnQgbWVyZ2UgZnJvbSAnLi9tZXJnZS5qcyc7XHJcbmltcG9ydCBJbnRlbnRpb25hbEFueSBmcm9tICcuL3R5cGVzL0ludGVudGlvbmFsQW55LmpzJztcclxuXHJcblFVbml0Lm1vZHVsZSggJ21lcmdlJyApO1xyXG5cclxuLy8gdGVzdCBwcm9wZXIgbWVyZ2VyIGZvciAyIG9iamVjdHNcclxuUVVuaXQudGVzdCggJ21lcmdlIHR3byBvYmplY3RzJywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCBvcmlnaW5hbCA9IHtcclxuICAgIHByb3AxOiAndmFsdWUxJyxcclxuICAgIHByb3AyOiAndmFsdWUyJyxcclxuICAgIHN1YmNvbXBvbmVudE9wdGlvbnM6IHtcclxuICAgICAgc3ViUHJvcDE6ICdzdWJWYWx1ZTEnLFxyXG4gICAgICBzdWJQcm9wMjogJ3N1YlZhbHVlMidcclxuICAgIH0sXHJcbiAgICBzdWJjb21wb25lbnRPcHRpb25zMjoge1xyXG4gICAgICBzdWJTdWJjb21wb25lbnRPcHRpb25zOiB7XHJcbiAgICAgICAgc3ViU3ViUHJvcDE6ICdzdWJTdWJWYWx1ZTEnXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBwcm9wMzogJ3ZhbHVlMydcclxuICB9O1xyXG5cclxuICBjb25zdCBtZXJnZTEgPSB7XHJcbiAgICBzdWJjb21wb25lbnRPcHRpb25zOiB7XHJcbiAgICAgIHN1YlByb3AxOiAnc3VidmFsdWUxIGNoYW5nZWQnLFxyXG4gICAgICBzdWJQcm9wMzogJ25ldyBzdWJ2YWx1ZSdcclxuICAgIH0sXHJcbiAgICBzdWJjb21wb25lbnRPcHRpb25zMjoge1xyXG4gICAgICBzdWJTdWJjb21wb25lbnRPcHRpb25zOiB7XHJcbiAgICAgICAgc3ViU3ViUHJvcDE6ICdhbGwgZ29uZSBub3cnLFxyXG4gICAgICAgIHRlc3Q6ICd0aGlzIGlzIGhlcmUgdG9vJ1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgcHJvcDM6ICduZXcgdmFsdWUzJyxcclxuICAgIHByb3A0OiAndmFsdWU0J1xyXG4gIH07XHJcbiAgY29uc3QgcHJlTWVyZ2VTb3VyY2VDb3B5ID0gT2JqZWN0LmFzc2lnbigge30sIG1lcmdlMSApO1xyXG4gIGNvbnN0IG1lcmdlZCA9IG1lcmdlKCBvcmlnaW5hbCwgbWVyZ2UxICk7XHJcblxyXG4gIGFzc2VydC5lcXVhbCggbWVyZ2VkLnByb3AxLCAndmFsdWUxJywgJ21lcmdlIHNob3VsZCBub3QgYWx0ZXIgdGFyZ2V0IGtleXMgdGhhdCBhcmVuXFwndCBpbiB0aGUgc291cmNlJyApO1xyXG4gIGFzc2VydC5lcXVhbCggbWVyZ2VkLnByb3A0LCAndmFsdWU0JywgJ21lcmdlIHNob3VsZCBub3QgYWx0ZXIgc291cmNlIGtleXMgdGhhdCBhcmVuXFwndCBpbiB0aGUgdGFyZ2V0JyApO1xyXG5cclxuICBsZXQgc2hvdWxkQmU6IEludGVudGlvbmFsQW55ID0ge1xyXG4gICAgc3ViUHJvcDE6ICdzdWJ2YWx1ZTEgY2hhbmdlZCcsXHJcbiAgICBzdWJQcm9wMjogJ3N1YlZhbHVlMicsXHJcbiAgICBzdWJQcm9wMzogJ25ldyBzdWJ2YWx1ZSdcclxuICB9O1xyXG4gIGFzc2VydC5kZWVwRXF1YWwoIG1lcmdlZC5zdWJjb21wb25lbnRPcHRpb25zLCBzaG91bGRCZSwgJ21lcmdlIHNob3VsZCBjb21iaW5lIHNpbmdseSBuZXN0ZWQgb2JqZWN0cycgKTtcclxuXHJcbiAgc2hvdWxkQmUgPSB7XHJcbiAgICBwcm9wMTogJ3ZhbHVlMScsXHJcbiAgICBwcm9wMjogJ3ZhbHVlMicsXHJcbiAgICBzdWJjb21wb25lbnRPcHRpb25zOiB7XHJcbiAgICAgIHN1YlByb3AxOiAnc3VidmFsdWUxIGNoYW5nZWQnLFxyXG4gICAgICBzdWJQcm9wMzogJ25ldyBzdWJ2YWx1ZScsXHJcbiAgICAgIHN1YlByb3AyOiAnc3ViVmFsdWUyJ1xyXG4gICAgfSxcclxuICAgIHN1YmNvbXBvbmVudE9wdGlvbnMyOiB7XHJcbiAgICAgIHN1YlN1YmNvbXBvbmVudE9wdGlvbnM6IHtcclxuICAgICAgICBzdWJTdWJQcm9wMTogJ2FsbCBnb25lIG5vdycsXHJcbiAgICAgICAgdGVzdDogJ3RoaXMgaXMgaGVyZSB0b28nXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBwcm9wMzogJ25ldyB2YWx1ZTMnLFxyXG4gICAgcHJvcDQ6ICd2YWx1ZTQnXHJcbiAgfTtcclxuICBhc3NlcnQuZGVlcEVxdWFsKCBtZXJnZWQsIHNob3VsZEJlLCAnbWVyZ2Ugc2hvdWxkIGNvbWJpbmUgYXJiaXRyYXJpbHkgbmVzdGVkIG9iamVjdHMnICk7XHJcbiAgYXNzZXJ0LmRlZXBFcXVhbCggbWVyZ2UxLCBwcmVNZXJnZVNvdXJjZUNvcHksICdtZXJnZSBzaG91bGQgbm90IGFsdGVyIHNvdXJjZXMnICk7XHJcbn0gKTtcclxuXHJcbi8vIHRlc3QgbXVsdGlwbGUgb2JqZWN0c1xyXG5RVW5pdC50ZXN0KCAndGVzdCBtdWx0aXBsZSBvYmplY3RzJywgYXNzZXJ0ID0+IHtcclxuICBjb25zdCBvcmlnaW5hbCA9IHtcclxuICAgIHByb3AxOiAndmFsdWUxJyxcclxuICAgIHByb3AyOiAndmFsdWUyJyxcclxuICAgIHN1YmNvbXBvbmVudE9wdGlvbnM6IHtcclxuICAgICAgc3ViUHJvcDE6ICdzdWJWYWx1ZTEnLFxyXG4gICAgICBzdWJQcm9wMjogJ3N1YlZhbHVlMidcclxuICAgIH0sXHJcbiAgICBzdWJjb21wb25lbnRPcHRpb25zMjoge1xyXG4gICAgICBzdWJTdWJjb21wb25lbnRPcHRpb25zOiB7XHJcbiAgICAgICAgc3ViU3ViUHJvcDE6ICdzdWJTdWJWYWx1ZTEnXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBwcm9wMzogJ3ZhbHVlMydcclxuICB9O1xyXG5cclxuICBjb25zdCBtZXJnZTEgPSB7XHJcbiAgICBzdWJjb21wb25lbnRPcHRpb25zOiB7XHJcbiAgICAgIHN1YlByb3AxOiAnc3VidmFsdWUxIGNoYW5nZWQnLFxyXG4gICAgICBzdWJQcm9wMzogJ25ldyBzdWJ2YWx1ZScsXHJcbiAgICAgIGV4Y2VwdDogJ21lJ1xyXG4gICAgfSxcclxuICAgIHN1YmNvbXBvbmVudE9wdGlvbnMyOiB7XHJcbiAgICAgIHN1YlN1YmNvbXBvbmVudE9wdGlvbnM6IHtcclxuICAgICAgICBzdWJTdWJQcm9wMTogJ2FsbCBnb25lIG5vdycsXHJcbiAgICAgICAgdGVzdDogJ3RoaXMgaXMgaGVyZSB0b28nXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBwcm9wMzogJ25ldyB2YWx1ZTMnLFxyXG4gICAgcHJvcDQ6ICd2YWx1ZTQnXHJcbiAgfTtcclxuXHJcbiAgY29uc3QgbWVyZ2UyID0ge1xyXG4gICAgcHJvcDU6ICd2YWx1ZTUnLFxyXG4gICAgc3ViY29tcG9uZW50T3B0aW9uczoge1xyXG4gICAgICBzdWJQcm9wMTogJ2V2ZXJ5dGhpbmcnLFxyXG4gICAgICBzdWJQcm9wMjogJ2hlcmUgaXMnLFxyXG4gICAgICBzdWJQcm9wMzogJ2Zyb20nLFxyXG4gICAgICBzdWJQcm9wNDogJ21lcmdlMidcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjb25zdCBtZXJnZTMgPSB7XHJcbiAgICBwcm9wNjogJ3ZhbHVlNicsXHJcbiAgICBwcm9wNTogJ3ZhbHVlNSBmcm9tIG1lcmdlMycsXHJcbiAgICBzdWJjb21wb25lbnRPcHRpb25zOiB7XHJcbiAgICAgIHN1YlByb3A1OiAnQk9OSk9VUidcclxuICAgIH0sXHJcbiAgICBzdWJjb21wb25lbnRPcHRpb25zMjoge1xyXG4gICAgICB0ZXN0MjogWyAndGVzdDInLCAndGVzdDMnIF0sXHJcbiAgICAgIHN1YlN1YmNvbXBvbmVudE9wdGlvbnM6IHtcclxuICAgICAgICB0ZXN0OiAndGVzdCBmb3JtIG1lcmdlMycsXHJcbiAgICAgICAgc3ViU3ViUHJvcDE6ICdzdWJTdWIgZnJvbSBtZXJnZTMnXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG4gIGNvbnN0IG1lcmdlMUNvcHkgPSBfLmNsb25lRGVlcCggbWVyZ2UxICk7XHJcbiAgY29uc3QgbWVyZ2UyQ29weSA9IF8uY2xvbmVEZWVwKCBtZXJnZTIgKTtcclxuICBjb25zdCBtZXJnZTNDb3B5ID0gXy5jbG9uZURlZXAoIG1lcmdlMyApO1xyXG5cclxuICBPYmplY3QuZnJlZXplKCBtZXJnZTEgKTtcclxuICBPYmplY3QuZnJlZXplKCBtZXJnZTIgKTtcclxuICBPYmplY3QuZnJlZXplKCBtZXJnZTMgKTtcclxuICBjb25zdCBtZXJnZWQgPSBtZXJnZSggb3JpZ2luYWwsIG1lcmdlMSwgbWVyZ2UyLCBtZXJnZTMgKTtcclxuXHJcbiAgY29uc3QgZXhwZWN0ZWQgPSB7XHJcbiAgICBwcm9wMTogJ3ZhbHVlMScsXHJcbiAgICBwcm9wMjogJ3ZhbHVlMicsXHJcbiAgICBzdWJjb21wb25lbnRPcHRpb25zOiB7XHJcbiAgICAgIHN1YlByb3AxOiAnZXZlcnl0aGluZycsXHJcbiAgICAgIHN1YlByb3AyOiAnaGVyZSBpcycsXHJcbiAgICAgIHN1YlByb3AzOiAnZnJvbScsXHJcbiAgICAgIHN1YlByb3A0OiAnbWVyZ2UyJyxcclxuICAgICAgZXhjZXB0OiAnbWUnLFxyXG4gICAgICBzdWJQcm9wNTogJ0JPTkpPVVInXHJcbiAgICB9LFxyXG4gICAgc3ViY29tcG9uZW50T3B0aW9uczI6IHtcclxuICAgICAgdGVzdDI6IFsgJ3Rlc3QyJywgJ3Rlc3QzJyBdLFxyXG4gICAgICBzdWJTdWJjb21wb25lbnRPcHRpb25zOiB7XHJcbiAgICAgICAgdGVzdDogJ3Rlc3QgZm9ybSBtZXJnZTMnLFxyXG4gICAgICAgIHN1YlN1YlByb3AxOiAnc3ViU3ViIGZyb20gbWVyZ2UzJ1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgcHJvcDM6ICduZXcgdmFsdWUzJyxcclxuICAgIHByb3A0OiAndmFsdWU0JyxcclxuICAgIHByb3A1OiAndmFsdWU1IGZyb20gbWVyZ2UzJyxcclxuICAgIHByb3A2OiAndmFsdWU2J1xyXG4gIH07XHJcbiAgYXNzZXJ0Lm5vdEVxdWFsKCBtZXJnZWQsIGV4cGVjdGVkLCAnc2FuaXR5IGNoZWNrOiBlbnN1cmUgbWVyZ2VkIGFuZCBleHBlY3RlZCBvYmplY3RzIGFyZSBub3QgdGhlIHNhbWUgcmVmZXJlbmNlJyApO1xyXG4gIGFzc2VydC5kZWVwRXF1YWwoIG1lcmdlZCwgZXhwZWN0ZWQsICdtZXJnZSBzaG91bGQgcHJvcGVybHkgY29tYmluZSBtdWx0aXBsZSBvYmplY3RzJyApO1xyXG4gIGFzc2VydC5kZWVwRXF1YWwoIG1lcmdlMSwgbWVyZ2UxQ29weSwgJ21lcmdlIHNob3VsZCBub3QgYWx0ZXIgc291cmNlIG9iamVjdHMnICk7XHJcbiAgYXNzZXJ0LmRlZXBFcXVhbCggbWVyZ2UyLCBtZXJnZTJDb3B5LCAnbWVyZ2Ugc2hvdWxkIG5vdCBhbHRlciBzb3VyY2Ugb2JqZWN0cycgKTtcclxuICBhc3NlcnQuZGVlcEVxdWFsKCBtZXJnZTMsIG1lcmdlM0NvcHksICdtZXJnZSBzaG91bGQgbm90IGFsdGVyIHNvdXJjZSBvYmplY3RzJyApO1xyXG59ICk7XHJcblxyXG4vLyBjaGVjayB0aGF0IGl0IGVycm9ycyBsb3VkbHkgaWYgc29tZXRoaW5nIG90aGVyIHRoYW4gYW4gb2JqZWN0IGlzIHVzZWRcclxuUVVuaXQudGVzdCggJ2NoZWNrIGZvciBwcm9wZXIgYXNzZXJ0aW9uIGVycm9ycycsIGFzc2VydCA9PiB7XHJcbiAgY29uc3Qgb3JpZ2luYWwgPSB7XHJcbiAgICBzdWJPcHRpb25zOiB7XHJcbiAgICAgIHRlc3Q6ICd2YWwnLFxyXG4gICAgICB0ZXN0MjogJ3ZhbDInXHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgVGVzdENsYXNzID0gY2xhc3Mge1xyXG4gICAgcHJpdmF0ZSB0ZXN0OiBzdHJpbmc7XHJcblxyXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICB0aGlzLnRlc3QgPSAnY2xhc3MnO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IG1lcmdlcyA9IHtcclxuICAgIGE6IHtcclxuICAgICAgc3ViT3B0aW9uczogWyAndmFsJywgJ3ZhbDInIF1cclxuICAgIH0sXHJcbiAgICBiOiB7XHJcbiAgICAgIHN1Yk9wdGlvbnM6IE9iamVjdC5jcmVhdGUoIHsgdGVzdDogJ2EnLCB0ZXN0MTogMyB9IClcclxuICAgIH0sXHJcbiAgICBjOiB7XHJcbiAgICAgIHN1Yk9wdGlvbnM6ICdhIHN0cmluZyB0byB0ZXN0J1xyXG4gICAgfSxcclxuICAgIGQ6IHtcclxuICAgICAgc3ViT3B0aW9uczogNDJcclxuICAgIH0sXHJcbiAgICBlOiB7XHJcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgICAgc3ViT3B0aW9uczogZnVuY3Rpb24oKSB7IHRoaXMuYSA9IDQyOyB9XHJcbiAgICB9LFxyXG4gICAgZjoge1xyXG4gICAgICBzdWJPcHRpb25zOiBuZXcgVGVzdENsYXNzKClcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjb25zdCBnZXR0ZXJNZXJnZSA9IHtcclxuICAgIGdldCBzdWJPcHRpb25zKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHRlc3Q6ICdzaG91bGQgbm90IHdvcmsnXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgaWYgKCB3aW5kb3cuYXNzZXJ0ICkge1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIG9yaWdpbmFsLCBtZXJnZXMuYSApLCAnbWVyZ2Ugc2hvdWxkIG5vdCBhbGxvdyBhcnJheXMgdG8gYmUgbWVyZ2VkJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIG9yaWdpbmFsLCBtZXJnZXMuYiApLCAnbWVyZ2Ugc2hvdWxkIG5vdCBhbGxvdyBpbmhlcml0ZWQgb2JqZWN0cyB0byBiZSBtZXJnZWQnICk7XHJcbiAgICBhc3NlcnQudGhyb3dzKCAoKSA9PiBtZXJnZSggb3JpZ2luYWwsIG1lcmdlcy5mICksICdtZXJnZSBzaG91bGQgbm90IGFsbG93IGluc3RhbmNlcyB0byBiZSBtZXJnZWQnICk7XHJcbiAgICBhc3NlcnQudGhyb3dzKCAoKSA9PiBtZXJnZSggb3JpZ2luYWwsIG1lcmdlcy5jICksICdtZXJnZSBzaG91bGQgbm90IGFsbG93IHN0cmluZ3MgdG8gYmUgbWVyZ2VkJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIG9yaWdpbmFsLCBtZXJnZXMuZCApLCAnbWVyZ2Ugc2hvdWxkIG5vdCBhbGxvdyBudW1iZXJzIHRvIGJlIG1lcmdlZCcgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCBvcmlnaW5hbCwgbWVyZ2VzLmUgKSwgJ21lcmdlIHNob3VsZCBub3QgYWxsb3cgZnVuY3Rpb25zIHRvIGJlIG1lcmdlZCcgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCBvcmlnaW5hbCwgZ2V0dGVyTWVyZ2UgKSwgJ21lcmdlIHNob3VsZCBub3Qgd29yayB3aXRoIGdldHRlcnMnICk7XHJcblxyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciBJTlRFTlRJT05BTFxyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIG9yaWdpbmFsICksICdtZXJnZSBzaG91bGQgbm90IHdvcmsgd2l0aG91dCBhIHNvdXJjZScgKTtcclxuICB9XHJcbiAgYXNzZXJ0LmVxdWFsKCAxLCAxLCAnZm9yIG5vID9lYSBxdWVyeSBwYXJhbScgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ2NoZWNrIGZvciByZWZlcmVuY2UgbGV2ZWwgZXF1YWxpdHkgKGUuZy4gZm9yIG9iamVjdCBsaXRlcmFscywgUHJvcGVydGllcywgRW51bWVyYXRpb25zKScsIGFzc2VydCA9PiB7XHJcbiAgY29uc3QgdGVzdEVudW0gPSB7XHJcbiAgICBBOiB7XHJcbiAgICAgIHRlc3RBOiAndmFsdWVBJ1xyXG4gICAgfSxcclxuICAgIEI6IHtcclxuICAgICAgdGVzdEI6ICd2YWx1ZUInXHJcbiAgICB9LFxyXG4gICAgQzoge1xyXG4gICAgICB0ZXN0QzogJ3ZhbHVlQydcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB0eXBlIFZhbHVlYWJsZSA9IHsgdmFsdWU6IG51bWJlciB8IHN0cmluZyB9O1xyXG4gIGNvbnN0IHRlc3RQcm9wZXJ0eTogVmFsdWVhYmxlID0geyB2YWx1ZTogNDIgfTtcclxuICBjb25zdCB0ZXN0UHJvcGVydHkyOiBWYWx1ZWFibGUgPSB7IHZhbHVlOiAnZm9ydHkgdHdvJyB9O1xyXG4gIGNvbnN0IG9yaWdpbmFsID0ge1xyXG4gICAgcHJvcDogdGVzdFByb3BlcnR5LFxyXG4gICAgbmVzdGVkT3B0aW9uczoge1xyXG4gICAgICBuZWVkc0FuRW51bTogdGVzdEVudW0uQSxcclxuICAgICAgbW9yZU9wdGlvbnM6IHtcclxuICAgICAgICBuZWVkc0FuRW51bTogdGVzdEVudW0uQ1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxuICBjb25zdCBtZXJnZXIgPSB7XHJcbiAgICBwcm9wOiB0ZXN0UHJvcGVydHkyLFxyXG4gICAgbmVzdGVkT3B0aW9uczoge1xyXG4gICAgICBuZWVkc0FuRW51bTogdGVzdEVudW0uQixcclxuICAgICAgbW9yZU9wdGlvbnM6IHtcclxuICAgICAgICBuZWVkc0RpZmZlcmVudEVudW06IHRlc3RFbnVtLkFcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcbiAgY29uc3Qgb3JpZ2luYWxDb3B5ID0gXy5jbG9uZURlZXAoIG9yaWdpbmFsICk7XHJcbiAgT2JqZWN0LmZyZWV6ZSggb3JpZ2luYWwgKTtcclxuICBjb25zdCBtZXJnZWRGcmVzaCA9IG1lcmdlKCB7fSwgb3JpZ2luYWwsIG1lcmdlciApO1xyXG4gIGFzc2VydC5lcXVhbCggb3JpZ2luYWwucHJvcC52YWx1ZSwgb3JpZ2luYWxDb3B5LnByb3AudmFsdWUsICdtZXJnZSBzaG91bGQgbm90IGFsdGVyIHNvdXJjZSBvYmplY3QgdmFsdWVzJyApO1xyXG4gIGFzc2VydC5vayggXy5pc0VxdWFsKCBvcmlnaW5hbCwgb3JpZ2luYWxDb3B5ICksICdtZXJnZSBzaG91bGQgbm90IGFsdGVyIHNvdXJjZSBvYmplY3RzJyApO1xyXG4gIGFzc2VydC5lcXVhbCggbWVyZ2VkRnJlc2gubmVzdGVkT3B0aW9ucy5uZWVkc0FuRW51bSwgdGVzdEVudW0uQiwgJ21lcmdlIHNob3VsZCBwcmVzZXJ2ZSByZWZlcmVuY2VzIHRvIG92ZXJ3cml0dGVuIG9iamVjdCBsaXRlcmFscycgKTtcclxuICBhc3NlcnQuZXF1YWwoIG1lcmdlZEZyZXNoLm5lc3RlZE9wdGlvbnMubW9yZU9wdGlvbnMubmVlZHNBbkVudW0sIHRlc3RFbnVtLkMsICdtZXJnZSBzaG91bGQgcHJlc2VydmUgb2JqZWN0IGxpdGVyYWxzIGZyb20gdGFyZ2V0JyApO1xyXG4gIGFzc2VydC5lcXVhbCggbWVyZ2VkRnJlc2gubmVzdGVkT3B0aW9ucy5tb3JlT3B0aW9ucy5uZWVkc0RpZmZlcmVudEVudW0sIHRlc3RFbnVtLkEsICdtZXJnZSBzaG91bGQgcHJlc2VydmUgb2JqZWN0IGxpdGVyYWxzIGZyb20gc291cmNlJyApO1xyXG4gIG1lcmdlZEZyZXNoLnByb3AudmFsdWUgPSAnZm9ydHkgdGhyZWUnO1xyXG4gIGFzc2VydC5lcXVhbCggdGVzdFByb3BlcnR5Mi52YWx1ZSwgJ2ZvcnR5IHRocmVlJywgJ21lcmdlIHNob3VsZCBwYXNzIG9iamVjdCBsaXRlcmFsIHJlZmVyZW5jZXMnICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCB0ZXN0UHJvcGVydHkudmFsdWUsIDQyLCAnb3JpZ2luYWwgb2JqZWN0IGxpdGVyYWwgc2hvdWxkIGJlIG92ZXJ3cml0dGVuJyApO1xyXG5cclxuICBjb25zdCBtZXJnZWQgPSBtZXJnZSgge30sIG9yaWdpbmFsLCBtZXJnZXIgKTtcclxuICBhc3NlcnQub2soIG1lcmdlZC5uZXN0ZWRPcHRpb25zLm5lZWRzQW5FbnVtID09PSB0ZXN0RW51bS5CLCAnbWVyZ2Ugc2hvdWxkIHByZXNlcnZlIG92ZXJ3cml0dGVuIEVudW1lcmF0aW9uRGVwcmVjYXRlZCB0eXBlcycgKTtcclxuICBhc3NlcnQub2soIG1lcmdlZC5uZXN0ZWRPcHRpb25zLm1vcmVPcHRpb25zLm5lZWRzQW5FbnVtID09PSB0ZXN0RW51bS5DLCAnbWVyZ2Ugc2hvdWxkIHByZXNlcnZlIEVudW1lcmF0aW9uRGVwcmVjYXRlZCB0eXBlcyBmcm9tIHRhcmdldCcgKTtcclxuICBhc3NlcnQub2soIG1lcmdlZC5uZXN0ZWRPcHRpb25zLm1vcmVPcHRpb25zLm5lZWRzRGlmZmVyZW50RW51bSA9PT0gdGVzdEVudW0uQSwgJ21lcmdlIHNob3VsZCBwcmVzZXJ2ZSBFbnVtZXJhdGlvbkRlcHJlY2F0ZWQgdHlwZXMgZnJvbSBzb3VyY2UnICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICd0cnkgYSBob3JyaWJseSBuZXN0ZWQgY2FzZScsIGFzc2VydCA9PiB7XHJcbiAgY29uc3Qgb3JpZ2luYWwgPSB7XHJcbiAgICBwMU9wdGlvbnM6IHsgbjFPcHRpb25zOiB7IG4yT3B0aW9uczogeyBuM09wdGlvbnM6IHsgbjRPcHRpb25zOiB7IG41OiAnb3ZlcndyaXRlIG1lJyB9IH0gfSB9IH0sXHJcbiAgICBwMk9wdGlvbnM6IHtcclxuICAgICAgbjFPcHRpb25zOiB7XHJcbiAgICAgICAgcDM6ICdrZWVwIG1lJ1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxuICBjb25zdCBtZXJnZTEgPSB7XHJcbiAgICBwMU9wdGlvbnM6IHtcclxuICAgICAgbjFPcHRpb25zOiB7XHJcbiAgICAgICAgbjJPcHRpb25zOiB7XHJcbiAgICAgICAgICBuM09wdGlvbnM6IHtcclxuICAgICAgICAgICAgbjRPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgbjU6ICdvdmVyd3JpdHRlbidcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHAyT3B0aW9uczoge1xyXG4gICAgICBuMU9wdGlvbnM6IHtcclxuICAgICAgICBwNDogJ3AzIGtlcHQnLFxyXG4gICAgICAgIG4yT3B0aW9uczoge1xyXG4gICAgICAgICAgbjNPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIG40T3B0aW9uczoge1xyXG4gICAgICAgICAgICAgIG41T3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgbjZPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgIHA1OiAnbmV2ZXIgbWFrZSBvcHRpb25zIGxpa2UgdGhpcydcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG5cclxuICBPYmplY3QuZnJlZXplKCBtZXJnZTEgKTtcclxuICBjb25zdCBtZXJnZWQgPSBtZXJnZSggb3JpZ2luYWwsIG1lcmdlMSApO1xyXG4gIGNvbnN0IGV4cGVjdGVkID0ge1xyXG4gICAgcDFPcHRpb25zOiB7XHJcbiAgICAgIG4xT3B0aW9uczoge1xyXG4gICAgICAgIG4yT3B0aW9uczoge1xyXG4gICAgICAgICAgbjNPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIG40T3B0aW9uczoge1xyXG4gICAgICAgICAgICAgIG41OiAnb3ZlcndyaXR0ZW4nXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBwMk9wdGlvbnM6IHtcclxuICAgICAgbjFPcHRpb25zOiB7XHJcbiAgICAgICAgcDM6ICdrZWVwIG1lJyxcclxuICAgICAgICBwNDogJ3AzIGtlcHQnLFxyXG4gICAgICAgIG4yT3B0aW9uczoge1xyXG4gICAgICAgICAgbjNPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIG40T3B0aW9uczoge1xyXG4gICAgICAgICAgICAgIG41T3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgbjZPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgIHA1OiAnbmV2ZXIgbWFrZSBvcHRpb25zIGxpa2UgdGhpcydcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG4gIGFzc2VydC5kZWVwRXF1YWwoIG1lcmdlZCwgZXhwZWN0ZWQsICdtZXJnZSBzaG91bGQgaGFuZGxlIHNvbWUgZGVlcGx5IG5lc3RlZCBzdHVmZicgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ21pbm9yIGNoYW5nZScsIGFzc2VydCA9PiB7XHJcbiAgY29uc3QgYSA9IHtcclxuICAgIHNsaWRlck9wdGlvbnM6IHtcclxuICAgICAgaGVsbG86ICd0aGVyZSdcclxuICAgIH1cclxuICB9O1xyXG4gIGNvbnN0IGIgPSB7XHJcbiAgICBzbGlkZXJPcHRpb25zOiB7XHJcbiAgICAgIHRpbWU6ICdub3cnXHJcbiAgICB9XHJcbiAgfTtcclxuICBtZXJnZSgge30sIGEsIGIgKTtcclxuICBhc3NlcnQub2soICFhLnNsaWRlck9wdGlvbnMuaGFzT3duUHJvcGVydHkoICd0aW1lJyApLCAndGltZSBzaG91bGRudCBsZWFrIG92ZXIgdG8gYScgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ3Rlc3Qgd3JvbmcgYXJncycsIGFzc2VydCA9PiB7XHJcbiAgaWYgKCB3aW5kb3cuYXNzZXJ0ICkge1xyXG5cclxuICAgIC8vIGluIGZpcnN0IGFyZ1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIHVuZGVmaW5lZCwge30gKSwgJ3Vuc3VwcG9ydGVkIGZpcnN0IGFyZyBcInVuZGVmaW5lZFwiJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIG51bGwsIHt9ICksICd1bnN1cHBvcnRlZCBhcmcgXCJudWxsXCInICk7XHJcbiAgICBhc3NlcnQudGhyb3dzKCAoKSA9PiBtZXJnZSggdHJ1ZSwge30gKSwgJ3Vuc3VwcG9ydGVkIGFyZyBcImJvb2xlYW5cIicgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCAnaGVsbG8nLCB7fSApLCAndW5zdXBwb3J0ZWQgYXJnIFwic3RyaW5nXCInICk7XHJcbiAgICBhc3NlcnQudGhyb3dzKCAoKSA9PiBtZXJnZSggNCwge30gKSwgJ3Vuc3VwcG9ydGVkIGFyZyBcIm51bWJlclwiJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIEltYWdlLCB7fSApLCAndW5zdXBwb3J0ZWQgYXJnIG9mIE9iamVjdCB3aXRoIGV4dHJhIHByb3RvdHlwZScgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCB7IGdldCBoaSgpIHsgcmV0dXJuIDM7IH0gfSwge30gKSwgJ3Vuc3VwcG9ydGVkIGFyZyB3aXRoIGdldHRlcicgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCB7IHNldCBoaSggc3R1ZmY6IG51bWJlciApIHsgLyogbm9vcCAqL30gfSwge30gKSwgJ3Vuc3VwcG9ydGVkIGFyZyB3aXRoIHNldHRlcicgKTtcclxuXHJcbiAgICAvLyBpbiBzZWNvbmQgYXJnXHJcbiAgICBhc3NlcnQudGhyb3dzKCAoKSA9PiBtZXJnZSgge30sIHRydWUsIHt9ICksICd1bnN1cHBvcnRlZCBzZWNvbmQgYXJnIFwiYm9vbGVhblwiJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIHt9LCAnaGVsbG8nLCB7fSApLCAndW5zdXBwb3J0ZWQgc2Vjb25kIGFyZyBcInN0cmluZ1wiJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIHt9LCA0LCB7fSApLCAndW5zdXBwb3J0ZWQgc2Vjb25kIGFyZyBcIm51bWJlclwiJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIHt9LCBJbWFnZSwge30gKSwgJ3Vuc3VwcG9ydGVkIHNlY29uZCBhcmcgb2YgT2JqZWN0IHdpdGggZXh0cmEgcHJvdG90eXBlJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIHt9LCB7IGdldCBoaSgpIHsgcmV0dXJuIDM7IH0gfSwge30gKSwgJ3Vuc3VwcG9ydGVkIHNlY29uZCBhcmcgd2l0aCBnZXR0ZXInICk7XHJcbiAgICBhc3NlcnQudGhyb3dzKCAoKSA9PiBtZXJnZSgge30sIHsgc2V0IGhpKCBzdHVmZjogbnVtYmVyICkgey8qIG5vb3AgKi99IH0sIHt9ICksICd1bnN1cHBvcnRlZCBzZWNvbmQgYXJnIHdpdGggc2V0dGVyJyApO1xyXG5cclxuICAgIC8vIGluIHNlY29uZCBhcmcgd2l0aCBubyB0aGlyZCBvYmplY3RcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCB7fSwgdHJ1ZSApLCAndW5zdXBwb3J0ZWQgc2Vjb25kIGFyZyB3aXRoIG5vIHRoaXJkIFwiYm9vbGVhblwiJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIHt9LCAnaGVsbG8nICksICd1bnN1cHBvcnRlZCBzZWNvbmQgYXJnIHdpdGggbm8gdGhpcmQgXCJzdHJpbmdcIicgKTtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG1lcmdlKCB7fSwgNCApLCAndW5zdXBwb3J0ZWQgc2Vjb25kIGFyZyB3aXRoIG5vIHRoaXJkIFwibnVtYmVyXCInICk7XHJcbiAgICBhc3NlcnQudGhyb3dzKCAoKSA9PiBtZXJnZSgge30sIEltYWdlICksICd1bnN1cHBvcnRlZCBzZWNvbmQgYXJnIHdpdGggbm8gdGhpcmQgb2YgT2JqZWN0IHdpdGggZXh0cmEgcHJvdG90eXBlJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIHt9LCB7IGdldCBoaSgpIHsgcmV0dXJuIDM7IH0gfSApLCAndW5zdXBwb3J0ZWQgc2Vjb25kIGFyZyB3aXRoIG5vIHRoaXJkIHdpdGggZ2V0dGVyJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIHt9LCB7IHNldCBoaSggc3R1ZmY6IG51bWJlciApIHsvKiBub29wICovfSB9ICksICd1bnN1cHBvcnRlZCBzZWNvbmQgYXJnIHdpdGggbm8gdGhpcmQgd2l0aCBnZXR0ZXInICk7XHJcblxyXG4gICAgLy8gaW4gc29tZSBvcHRpb25zXHJcbiAgICBhc3NlcnQudGhyb3dzKCAoKSA9PiBtZXJnZSgge30sIHsgc29tZU9wdGlvbnM6IHRydWUgfSwge30gKSwgJ3Vuc3VwcG9ydGVkIGFyZyBpbiBvcHRpb25zIFwiYm9vbGVhblwiJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIHt9LCB7IHNvbWVPcHRpb25zOiAnaGVsbG8nIH0sIHt9ICksICd1bnN1cHBvcnRlZCBhcmcgaW4gb3B0aW9ucyBcInN0cmluZ1wiJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIHt9LCB7IHNvbWVPcHRpb25zOiA0IH0sIHt9ICksICd1bnN1cHBvcnRlZCBhcmcgaW4gb3B0aW9ucyBcIm51bWJlclwiJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIHt9LCB7IHNvbWVPcHRpb25zOiBJbWFnZSB9LCB7fSApLCAndW5zdXBwb3J0ZWQgYXJnIGluIG9wdGlvbnMgb2YgT2JqZWN0IHdpdGggZXh0cmEgcHJvdG90eXBlJyApO1xyXG4gICAgYXNzZXJ0LnRocm93cyggKCkgPT4gbWVyZ2UoIHt9LCB7IHNvbWVPcHRpb25zOiB7IGdldCBoaSgpIHsgcmV0dXJuIDM7IH0gfSB9LCB7fSApLCAndW5zdXBwb3J0ZWQgYXJnIGluIG9wdGlvbnMgd2l0aCBnZXR0ZXInICk7XHJcbiAgICBhc3NlcnQudGhyb3dzKCAoKSA9PiBtZXJnZSgge30sIHsgc29tZU9wdGlvbnM6IHsgc2V0IGhpKCBzdHVmZjogbnVtYmVyICkgey8qIG5vb3AgKi99IH0gfSwge30gKSwgJ3Vuc3VwcG9ydGVkIGFyZyBpbiBvcHRpb25zIHdpdGggZ2V0dGVyJyApO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGFzc2VydC5vayggdHJ1ZSwgJ25vIGFzc2VydGlvbnMgZW5hYmxlZCcgKTtcclxuICB9XHJcblxyXG4gIC8vIGFsbG93ZWQgY2FzZXMgdGhhdCBzaG91bGQgbm90IGVycm9yXHJcbiAgbWVyZ2UoIHt9LCBudWxsLCB7fSApO1xyXG4gIG1lcmdlKCB7fSwgbnVsbCApO1xyXG4gIG1lcmdlKCB7fSwge30sIG51bGwgKTtcclxuICBtZXJnZSggeyB4T3B0aW9uczogeyB0ZXN0OiAxIH0gfSwgeyB4T3B0aW9uczogbnVsbCB9ICk7XHJcbiAgbWVyZ2UoIHt9LCB7IHNvbWVPcHRpb25zOiBudWxsIH0sIHt9ICk7XHJcbiAgbWVyZ2UoIHt9LCB7IHNvbWVPcHRpb25zOiB1bmRlZmluZWQgfSwge30gKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ2RvIG5vdCByZWN1cnNlIGZvciBub24gKk9wdGlvbnMnLCBhc3NlcnQgPT4ge1xyXG5cclxuICBjb25zdCB0ZXN0Rmlyc3RQcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSggJ2hpJyApO1xyXG4gIGNvbnN0IHRlc3RTZWNvbmRQcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSggJ2hpMicgKTtcclxuICBjb25zdCBUZXN0RW51bWVyYXRpb24gPSBFbnVtZXJhdGlvbkRlcHJlY2F0ZWQuYnlLZXlzKCBbICdPTkUnLCAnVFdPJyBdICk7XHJcbiAgY29uc3QgVGVzdEVudW1lcmF0aW9uMiA9IEVudW1lcmF0aW9uRGVwcmVjYXRlZC5ieUtleXMoIFsgJ09ORTEnLCAnVFdPMicgXSApO1xyXG4gIGNvbnN0IG9yaWdpbmFsID0ge1xyXG4gICAgcHJvcDogdGVzdEZpcnN0UHJvcGVydHksXHJcbiAgICBlbnVtOiBUZXN0RW51bWVyYXRpb24sXHJcbiAgICBzb21lT3B0aW9uczogeyBuZXN0ZWRQcm9wOiB0ZXN0Rmlyc3RQcm9wZXJ0eSB9XHJcbiAgfTtcclxuXHJcbiAgbGV0IG5ld09iamVjdCA9IG1lcmdlKCB7fSwgb3JpZ2luYWwgKTtcclxuICBhc3NlcnQub2soIF8uaXNFcXVhbCggb3JpZ2luYWwsIG5ld09iamVjdCApLCAnc2hvdWxkIGJlIGVxdWFsIGZyb20gcmVmZXJlbmNlIGVxdWFsaXR5JyApO1xyXG4gIGFzc2VydC5vayggb3JpZ2luYWwucHJvcCA9PT0gbmV3T2JqZWN0LnByb3AsICdzYW1lIFByb3BlcnR5JyApO1xyXG4gIGFzc2VydC5vayggb3JpZ2luYWwuZW51bSA9PT0gbmV3T2JqZWN0LmVudW0sICdzYW1lIEVudW1lcmF0aW9uRGVwcmVjYXRlZCcgKTtcclxuXHJcbiAgLy8gdGVzdCBkZWZhdWx0cyB3aXRoIG90aGVyIG5vbiBtZXJnZWFibGUgb2JqZWN0c1xyXG4gIG5ld09iamVjdCA9IG1lcmdlKCB7XHJcbiAgICBwcm9wOiB0ZXN0U2Vjb25kUHJvcGVydHksXHJcbiAgICBlbnVtOiBUZXN0RW51bWVyYXRpb24yLFxyXG4gICAgc29tZU9wdGlvbnM6IHsgbmVzdGVkUHJvcDogdGVzdFNlY29uZFByb3BlcnR5IH1cclxuICB9LCBvcmlnaW5hbCApO1xyXG4gIGFzc2VydC5vayggXy5pc0VxdWFsKCBvcmlnaW5hbCwgbmV3T2JqZWN0ICksICdzaG91bGQgYmUgZXF1YWwnICk7XHJcbiAgYXNzZXJ0Lm9rKCBvcmlnaW5hbC5wcm9wID09PSBuZXdPYmplY3QucHJvcCwgJ3NhbWUgUHJvcGVydHksIGlnbm9yZSBkZWZhdWx0JyApO1xyXG4gIGFzc2VydC5vayggb3JpZ2luYWwuZW51bSA9PT0gbmV3T2JqZWN0LmVudW0sICdzYW1lIEVudW1lcmF0aW9uRGVwcmVjYXRlZCwgaWdub3JlIGRlZmF1bHQnICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdzdXBwb3J0IG9wdGlvbmFsIG9wdGlvbnMnLCBhc3NlcnQgPT4ge1xyXG5cclxuICBjb25zdCBtZXJnZVhZWiA9ICggb3B0aW9ucz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+ICkgPT4ge1xyXG4gICAgcmV0dXJuIG1lcmdlKCB7XHJcbiAgICAgIHg6IDEsXHJcbiAgICAgIHk6IDIsXHJcbiAgICAgIHo6IDNcclxuICAgIH0sIG9wdGlvbnMgKTtcclxuICB9O1xyXG4gIGNvbnN0IG5vT3B0aW9ucyA9IG1lcmdlWFlaKCk7XHJcbiAgYXNzZXJ0Lm9rKCBub09wdGlvbnMueCA9PT0gMSwgJ3ggcHJvcGVydHkgc2hvdWxkIGJlIG1lcmdlZCBmcm9tIGRlZmF1bHQnICk7XHJcbiAgYXNzZXJ0Lm9rKCBub09wdGlvbnMueSA9PT0gMiwgJ3kgcHJvcGVydHkgc2hvdWxkIGJlIG1lcmdlZCBmcm9tIGRlZmF1bHQnICk7XHJcbiAgYXNzZXJ0Lm9rKCBub09wdGlvbnMueiA9PT0gMywgJ3ogcHJvcGVydHkgc2hvdWxkIGJlIG1lcmdlZCBmcm9tIGRlZmF1bHQnICk7XHJcblxyXG4gIGNvbnN0IHRlc3ROZXN0ZWRGdW5jdGlvbkNhbGxPcHRpb25zID0gKCBvcHRpb25zPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gKSA9PiB7XHJcbiAgICByZXR1cm4gbWVyZ2VYWVooIG1lcmdlKCB7XHJcbiAgICAgIHg6IDIsXHJcbiAgICAgIGc6IDU0LFxyXG4gICAgICB0cmVlU2F5czogJ2hlbGxvJ1xyXG4gICAgfSwgb3B0aW9ucyApICk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3Qgbm9PcHRpb25zMiA9IHRlc3ROZXN0ZWRGdW5jdGlvbkNhbGxPcHRpb25zKCk7XHJcbiAgYXNzZXJ0Lm9rKCBub09wdGlvbnMyLnggPT09IDIsICd4IHByb3BlcnR5IHNob3VsZCBiZSBtZXJnZWQgZnJvbSBkZWZhdWx0JyApO1xyXG4gIGFzc2VydC5vayggbm9PcHRpb25zMi55ID09PSAyLCAneSBwcm9wZXJ0eSBzaG91bGQgYmUgbWVyZ2VkIGZyb20gZGVmYXVsdCcgKTtcclxuICBhc3NlcnQub2soIG5vT3B0aW9uczIueiA9PT0gMywgJ3ogcHJvcGVydHkgc2hvdWxkIGJlIG1lcmdlZCBmcm9tIGRlZmF1bHQnICk7XHJcblxyXG4gIGFzc2VydC5vayggbm9PcHRpb25zMi5nID09PSA1NCwgJ2cgcHJvcGVydHkgc2hvdWxkIGJlIG1lcmdlZCBmcm9tIGRlZmF1bHQnICk7XHJcbiAgYXNzZXJ0Lm9rKCBub09wdGlvbnMyLnRyZWVTYXlzID09PSAnaGVsbG8nLCAncHJvcGVydHkgc2hvdWxkIGJlIG1lcmdlZCBmcm9tIGRlZmF1bHQnICk7XHJcbn0gKTtcclxuXHJcblFVbml0LnRlc3QoICdkb2VzIG5vdCBzdXBwb3J0IGRlZXAgZXF1YWxzIG9uIGtleW5hbWUgb2YgXCJPcHRpb25zXCInLCBhc3NlcnQgPT4ge1xyXG5cclxuICBjb25zdCByZWZlcmVuY2VPYmplY3QgPSB7XHJcbiAgICBoZWxsbzogMlxyXG4gIH07XHJcblxyXG4gIGNvbnN0IG1lcmdlZCA9IG1lcmdlKCB7fSwge1xyXG4gICAgT3B0aW9uczogcmVmZXJlbmNlT2JqZWN0XHJcbiAgfSApO1xyXG5cclxuICBjb25zdCBkZWVwTWVyZ2VkID0gbWVyZ2UoIHt9LCB7XHJcbiAgICBzb21lT3B0aW9uczogcmVmZXJlbmNlT2JqZWN0XHJcbiAgfSApO1xyXG5cclxuICBhc3NlcnQub2soIG1lcmdlZC5PcHRpb25zID09PSByZWZlcmVuY2VPYmplY3QsICdcIk9wdGlvbnNcIiBzaG91bGQgbm90IGRlZXAgZXF1YWwnICk7XHJcbiAgcmVmZXJlbmNlT2JqZWN0LmhlbGxvID0gMztcclxuICBhc3NlcnQub2soIG1lcmdlZC5PcHRpb25zLmhlbGxvID09PSAzLCAndmFsdWUgc2hvdWxkIGNoYW5nZSBiZWNhdXNlIGl0IGlzIGEgcmVmZXJlbmNlJyApO1xyXG4gIGFzc2VydC5vayggZGVlcE1lcmdlZC5zb21lT3B0aW9ucy5oZWxsbyA9PT0gMiwgJ3ZhbHVlIHNob3VsZCBu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