"use strict";

var _swapObjectKeys = _interopRequireDefault(require("./swapObjectKeys.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
// Copyright 2019-2023, University of Colorado Boulder

/**
 * swapObjectKeys tests
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

QUnit.module('swapObjectKeys');
QUnit.test('swapObjectKeys', function (assert) {
  var object = {
    x: 3,
    y: 4
  };
  (0, _swapObjectKeys["default"])(object, 'x', 'y');
  assert.ok(object.x === 4);
  assert.ok(object.y === 3);
  object = {
    x: 3,
    y: undefined
  };
  (0, _swapObjectKeys["default"])(object, 'x', 'y');
  assert.ok(object.x === undefined);
  assert.ok(object.hasOwnProperty('x'));
  assert.ok(object.y === 3);
  object = {
    x: 3,
    y: new RegExp('matchOnThis')
  };
  var regex = object.y; // store the reference
  (0, _swapObjectKeys["default"])(object, 'x', 'y');
  assert.ok(object.x === regex, 'reference to object');
  assert.ok(object.y === 3, 'reference to primitive');
  object = {
    x: 4
  };
  (0, _swapObjectKeys["default"])(object, 'x', 'y');
  assert.ok(object.y === 4);
  assert.ok(!Object.hasOwnProperty('x'));
  object = {
    otherStuff: 'hi'
  };
  (0, _swapObjectKeys["default"])(object, 'x', 'y');
  assert.ok(object.otherStuff === 'hi');
  assert.ok(!Object.hasOwnProperty('x'));
  assert.ok(!Object.hasOwnProperty('y'));
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfc3dhcE9iamVjdEtleXMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIm9iaiIsIl9fZXNNb2R1bGUiLCJRVW5pdCIsIm1vZHVsZSIsInRlc3QiLCJhc3NlcnQiLCJvYmplY3QiLCJ4IiwieSIsInN3YXBPYmplY3RLZXlzIiwib2siLCJ1bmRlZmluZWQiLCJoYXNPd25Qcm9wZXJ0eSIsIlJlZ0V4cCIsInJlZ2V4IiwiT2JqZWN0Iiwib3RoZXJTdHVmZiJdLCJzb3VyY2VzIjpbInN3YXBPYmplY3RLZXlzVGVzdHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTktMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogc3dhcE9iamVjdEtleXMgdGVzdHNcclxuICpcclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBzd2FwT2JqZWN0S2V5cyBmcm9tICcuL3N3YXBPYmplY3RLZXlzLmpzJztcclxuaW1wb3J0IEludGVudGlvbmFsQW55IGZyb20gJy4vdHlwZXMvSW50ZW50aW9uYWxBbnkuanMnO1xyXG5cclxuUVVuaXQubW9kdWxlKCAnc3dhcE9iamVjdEtleXMnICk7XHJcblxyXG5RVW5pdC50ZXN0KCAnc3dhcE9iamVjdEtleXMnLCBhc3NlcnQgPT4ge1xyXG4gIGxldCBvYmplY3Q6IFJlY29yZDxzdHJpbmcsIEludGVudGlvbmFsQW55PiA9IHsgeDogMywgeTogNCB9O1xyXG4gIHN3YXBPYmplY3RLZXlzKCBvYmplY3QsICd4JywgJ3knICk7XHJcbiAgYXNzZXJ0Lm9rKCBvYmplY3QueCA9PT0gNCApO1xyXG4gIGFzc2VydC5vayggb2JqZWN0LnkgPT09IDMgKTtcclxuXHJcbiAgb2JqZWN0ID0geyB4OiAzLCB5OiB1bmRlZmluZWQgfTtcclxuICBzd2FwT2JqZWN0S2V5cyggb2JqZWN0LCAneCcsICd5JyApO1xyXG4gIGFzc2VydC5vayggb2JqZWN0LnggPT09IHVuZGVmaW5lZCApO1xyXG4gIGFzc2VydC5vayggb2JqZWN0Lmhhc093blByb3BlcnR5KCAneCcgKSApO1xyXG4gIGFzc2VydC5vayggb2JqZWN0LnkgPT09IDMgKTtcclxuXHJcbiAgb2JqZWN0ID0geyB4OiAzLCB5OiBuZXcgUmVnRXhwKCAnbWF0Y2hPblRoaXMnICkgfTtcclxuICBjb25zdCByZWdleCA9IG9iamVjdC55OyAvLyBzdG9yZSB0aGUgcmVmZXJlbmNlXHJcbiAgc3dhcE9iamVjdEtleXMoIG9iamVjdCwgJ3gnLCAneScgKTtcclxuICBhc3NlcnQub2soIG9iamVjdC54ID09PSByZWdleCwgJ3JlZmVyZW5jZSB0byBvYmplY3QnICk7XHJcbiAgYXNzZXJ0Lm9rKCBvYmplY3QueSA9PT0gMywgJ3JlZmVyZW5jZSB0byBwcmltaXRpdmUnICk7XHJcblxyXG4gIG9iamVjdCA9IHsgeDogNCB9O1xyXG4gIHN3YXBPYmplY3RLZXlzKCBvYmplY3QsICd4JywgJ3knICk7XHJcbiAgYXNzZXJ0Lm9rKCBvYmplY3QueSA9PT0gNCApO1xyXG4gIGFzc2VydC5vayggIU9iamVjdC5oYXNPd25Qcm9wZXJ0eSggJ3gnICkgKTtcclxuXHJcbiAgb2JqZWN0ID0geyBvdGhlclN0dWZmOiAnaGknIH07XHJcbiAgc3dhcE9iamVjdEtleXMoIG9iamVjdCwgJ3gnLCAneScgKTtcclxuICBhc3NlcnQub2soIG9iamVjdC5vdGhlclN0dWZmID09PSAnaGknICk7XHJcbiAgYXNzZXJ0Lm9rKCAhT2JqZWN0Lmhhc093blByb3BlcnR5KCAneCcgKSApO1xyXG4gIGFzc2VydC5vayggIU9iamVjdC5oYXNPd25Qcm9wZXJ0eSggJ3knICkgKTtcclxufSApOyJdLCJtYXBwaW5ncyI6Ijs7QUFRQSxJQUFBQSxlQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFBaUQsU0FBQUQsdUJBQUFFLEdBQUEsV0FBQUEsR0FBQSxJQUFB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