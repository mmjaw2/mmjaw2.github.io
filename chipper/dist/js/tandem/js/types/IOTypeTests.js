// Copyright 2021-2024, University of Colorado Boulder

/**
 * Unit tests for IOType
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import IOType from './IOType.js';
import BooleanIO from './BooleanIO.js';
import NumberIO from './NumberIO.js';
import StringIO from './StringIO.js';
QUnit.module('IOType');
QUnit.test('always true', assert => {
  assert.ok(true, 'initial test');
});
QUnit.test('default toStateObject and applyState', assert => {
  class MyClass {
    firstField = true;
    secondField = 5;
    willBePrivateInStateObject = 42;
    _myUnsettableField = 'unacceptable!';
    _secretName = 'Larry';
    _secretNameButPublicState = 'Larry2';
    _valueForGetterAndSetter = 'hi';
    get gettersAndSettersTest() {
      return this._valueForGetterAndSetter;
    }
    set gettersAndSettersTest(value) {
      this._valueForGetterAndSetter = value;
    }
    static MyClassIO = new IOType('MyClassIO', {
      valueType: MyClass,
      stateSchema: {
        firstField: BooleanIO,
        secondField: NumberIO,
        _willBePrivateInStateObject: NumberIO,
        myUnsettableField: StringIO,
        gettersAndSettersTest: StringIO,
        _secretName: StringIO,
        secretNameButPublicState: StringIO
      }
    });
  }
  const x = new MyClass();
  const stateObject = MyClass.MyClassIO.toStateObject(x);
  assert.ok(stateObject.firstField === true, 'stateObject firstField');
  assert.ok(stateObject.secondField === 5, 'stateObject secondField');
  assert.ok(stateObject._willBePrivateInStateObject === 42, 'stateObject willBePrivateInStateObject');
  assert.ok(stateObject.myUnsettableField === 'unacceptable!', 'stateObject myUnsettableField');
  assert.ok(stateObject.gettersAndSettersTest === 'hi', 'stateObject gettersAndSettersTest');
  assert.ok(stateObject._secretName === 'Larry', 'stateObject underscore key + underscore core');
  assert.ok(stateObject.secretNameButPublicState === 'Larry2', 'stateObject nonunderscored key + underscore core');
  const myStateObject = {
    firstField: false,
    secondField: 2,
    _willBePrivateInStateObject: 100,
    myUnsettableField: 'other',
    gettersAndSettersTest: 'other2',
    _secretName: 'Bob',
    secretNameButPublicState: 'Bob2'
  };
  MyClass.MyClassIO.applyState(x, myStateObject);
  assert.equal(x.firstField, false, 'applyState firstField');
  assert.ok(x.secondField === 2, 'applyState secondField');
  assert.ok(x.willBePrivateInStateObject === 100, 'applyState willBePrivateInStateObject');
  assert.ok(x['_myUnsettableField'] === 'other', 'applyState myUnsettableField');
  assert.ok(x.gettersAndSettersTest === 'other2', 'applyState gettersAndSettersTest');
  assert.ok(x['_secretName'] === 'Bob', 'applyState underscore key + underscore core');
  assert.ok(!x.hasOwnProperty('secretName'), 'do not write a bad field secretName');
  assert.ok(x['_secretNameButPublicState'] === 'Bob2', 'applyState nonunderscore key + underscore core');
  assert.ok(!x.hasOwnProperty('secretNameButPublicState'), 'do not write a bad field secretNameButPublicState');
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJJT1R5cGUiLCJCb29sZWFuSU8iLCJOdW1iZXJJTyIsIlN0cmluZ0lPIiwiUVVuaXQiLCJtb2R1bGUiLCJ0ZXN0IiwiYXNzZXJ0Iiwib2siLCJNeUNsYXNzIiwiZmlyc3RGaWVsZCIsInNlY29uZEZpZWxkIiwid2lsbEJlUHJpdmF0ZUluU3RhdGVPYmplY3QiLCJfbXlVbnNldHRhYmxlRmllbGQiLCJfc2VjcmV0TmFtZSIsIl9zZWNyZXROYW1lQnV0UHVibGljU3RhdGUiLCJfdmFsdWVGb3JHZXR0ZXJBbmRTZXR0ZXIiLCJnZXR0ZXJzQW5kU2V0dGVyc1Rlc3QiLCJ2YWx1ZSIsIk15Q2xhc3NJTyIsInZhbHVlVHlwZSIsInN0YXRlU2NoZW1hIiwiX3dpbGxCZVByaXZhdGVJblN0YXRlT2JqZWN0IiwibXlVbnNldHRhYmxlRmllbGQiLCJzZWNyZXROYW1lQnV0UHVibGljU3RhdGUiLCJ4Iiwic3RhdGVPYmplY3QiLCJ0b1N0YXRlT2JqZWN0IiwibXlTdGF0ZU9iamVjdCIsImFwcGx5U3RhdGUiLCJlcXVhbCIsImhhc093blByb3BlcnR5Il0sInNvdXJjZXMiOlsiSU9UeXBlVGVzdHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVW5pdCB0ZXN0cyBmb3IgSU9UeXBlXHJcbiAqXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgSU9UeXBlIGZyb20gJy4vSU9UeXBlLmpzJztcclxuaW1wb3J0IEJvb2xlYW5JTyBmcm9tICcuL0Jvb2xlYW5JTy5qcyc7XHJcbmltcG9ydCBOdW1iZXJJTyBmcm9tICcuL051bWJlcklPLmpzJztcclxuaW1wb3J0IFN0cmluZ0lPIGZyb20gJy4vU3RyaW5nSU8uanMnO1xyXG5cclxuUVVuaXQubW9kdWxlKCAnSU9UeXBlJyApO1xyXG5cclxuUVVuaXQudGVzdCggJ2Fsd2F5cyB0cnVlJywgYXNzZXJ0ID0+IHtcclxuICBhc3NlcnQub2soIHRydWUsICdpbml0aWFsIHRlc3QnICk7XHJcbn0gKTtcclxuUVVuaXQudGVzdCggJ2RlZmF1bHQgdG9TdGF0ZU9iamVjdCBhbmQgYXBwbHlTdGF0ZScsIGFzc2VydCA9PiB7XHJcblxyXG4gIGNsYXNzIE15Q2xhc3Mge1xyXG4gICAgcHVibGljIGZpcnN0RmllbGQgPSB0cnVlO1xyXG4gICAgcHVibGljIHNlY29uZEZpZWxkID0gNTtcclxuICAgIHB1YmxpYyB3aWxsQmVQcml2YXRlSW5TdGF0ZU9iamVjdCA9IDQyO1xyXG4gICAgcHJpdmF0ZSBfbXlVbnNldHRhYmxlRmllbGQgPSAndW5hY2NlcHRhYmxlISc7XHJcbiAgICBwcml2YXRlIF9zZWNyZXROYW1lID0gJ0xhcnJ5JztcclxuICAgIHByaXZhdGUgX3NlY3JldE5hbWVCdXRQdWJsaWNTdGF0ZSA9ICdMYXJyeTInO1xyXG4gICAgcHJpdmF0ZSBfdmFsdWVGb3JHZXR0ZXJBbmRTZXR0ZXIgPSAnaGknO1xyXG5cclxuICAgIHB1YmxpYyBnZXQgZ2V0dGVyc0FuZFNldHRlcnNUZXN0KCkgeyByZXR1cm4gdGhpcy5fdmFsdWVGb3JHZXR0ZXJBbmRTZXR0ZXI7IH1cclxuXHJcbiAgICBwdWJsaWMgc2V0IGdldHRlcnNBbmRTZXR0ZXJzVGVzdCggdmFsdWU6IHN0cmluZyApIHsgdGhpcy5fdmFsdWVGb3JHZXR0ZXJBbmRTZXR0ZXIgPSB2YWx1ZTsgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgTXlDbGFzc0lPID0gbmV3IElPVHlwZSggJ015Q2xhc3NJTycsIHtcclxuICAgICAgdmFsdWVUeXBlOiBNeUNsYXNzLFxyXG4gICAgICBzdGF0ZVNjaGVtYToge1xyXG4gICAgICAgIGZpcnN0RmllbGQ6IEJvb2xlYW5JTyxcclxuICAgICAgICBzZWNvbmRGaWVsZDogTnVtYmVySU8sXHJcbiAgICAgICAgX3dpbGxCZVByaXZhdGVJblN0YXRlT2JqZWN0OiBOdW1iZXJJTyxcclxuICAgICAgICBteVVuc2V0dGFibGVGaWVsZDogU3RyaW5nSU8sXHJcbiAgICAgICAgZ2V0dGVyc0FuZFNldHRlcnNUZXN0OiBTdHJpbmdJTyxcclxuICAgICAgICBfc2VjcmV0TmFtZTogU3RyaW5nSU8sXHJcbiAgICAgICAgc2VjcmV0TmFtZUJ1dFB1YmxpY1N0YXRlOiBTdHJpbmdJT1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICBjb25zdCB4ID0gbmV3IE15Q2xhc3MoKTtcclxuICBjb25zdCBzdGF0ZU9iamVjdCA9IE15Q2xhc3MuTXlDbGFzc0lPLnRvU3RhdGVPYmplY3QoIHggKTtcclxuICBhc3NlcnQub2soIHN0YXRlT2JqZWN0LmZpcnN0RmllbGQgPT09IHRydWUsICdzdGF0ZU9iamVjdCBmaXJzdEZpZWxkJyApO1xyXG4gIGFzc2VydC5vayggc3RhdGVPYmplY3Quc2Vjb25kRmllbGQgPT09IDUsICdzdGF0ZU9iamVjdCBzZWNvbmRGaWVsZCcgKTtcclxuICBhc3NlcnQub2soIHN0YXRlT2JqZWN0Ll93aWxsQmVQcml2YXRlSW5TdGF0ZU9iamVjdCA9PT0gNDIsICdzdGF0ZU9iamVjdCB3aWxsQmVQcml2YXRlSW5TdGF0ZU9iamVjdCcgKTtcclxuICBhc3NlcnQub2soIHN0YXRlT2JqZWN0Lm15VW5zZXR0YWJsZUZpZWxkID09PSAndW5hY2NlcHRhYmxlIScsICdzdGF0ZU9iamVjdCBteVVuc2V0dGFibGVGaWVsZCcgKTtcclxuICBhc3NlcnQub2soIHN0YXRlT2JqZWN0LmdldHRlcnNBbmRTZXR0ZXJzVGVzdCA9PT0gJ2hpJywgJ3N0YXRlT2JqZWN0IGdldHRlcnNBbmRTZXR0ZXJzVGVzdCcgKTtcclxuICBhc3NlcnQub2soIHN0YXRlT2JqZWN0Ll9zZWNyZXROYW1lID09PSAnTGFycnknLCAnc3RhdGVPYmplY3QgdW5kZXJzY29yZSBrZXkgKyB1bmRlcnNjb3JlIGNvcmUnICk7XHJcbiAgYXNzZXJ0Lm9rKCBzdGF0ZU9iamVjdC5zZWNyZXROYW1lQnV0UHVibGljU3RhdGUgPT09ICdMYXJyeTInLCAnc3RhdGVPYmplY3Qgbm9udW5kZXJzY29yZWQga2V5ICsgdW5kZXJzY29yZSBjb3JlJyApO1xyXG5cclxuICBjb25zdCBteVN0YXRlT2JqZWN0ID0ge1xyXG4gICAgZmlyc3RGaWVsZDogZmFsc2UsXHJcbiAgICBzZWNvbmRGaWVsZDogMixcclxuICAgIF93aWxsQmVQcml2YXRlSW5TdGF0ZU9iamVjdDogMTAwLFxyXG4gICAgbXlVbnNldHRhYmxlRmllbGQ6ICdvdGhlcicsXHJcbiAgICBnZXR0ZXJzQW5kU2V0dGVyc1Rlc3Q6ICdvdGhlcjInLFxyXG4gICAgX3NlY3JldE5hbWU6ICdCb2InLFxyXG4gICAgc2VjcmV0TmFtZUJ1dFB1YmxpY1N0YXRlOiAnQm9iMidcclxuICB9O1xyXG5cclxuICBNeUNsYXNzLk15Q2xhc3NJTy5hcHBseVN0YXRlKCB4LCBteVN0YXRlT2JqZWN0ICk7XHJcbiAgYXNzZXJ0LmVxdWFsKCB4LmZpcnN0RmllbGQsIGZhbHNlLCAnYXBwbHlTdGF0ZSBmaXJzdEZpZWxkJyApO1xyXG4gIGFzc2VydC5vayggeC5zZWNvbmRGaWVsZCA9PT0gMiwgJ2FwcGx5U3RhdGUgc2Vjb25kRmllbGQnICk7XHJcbiAgYXNzZXJ0Lm9rKCB4LndpbGxCZVByaXZhdGVJblN0YXRlT2JqZWN0ID09PSAxMDAsICdhcHBseVN0YXRlIHdpbGxCZVByaXZhdGVJblN0YXRlT2JqZWN0JyApO1xyXG4gIGFzc2VydC5vayggeFsgJ19teVVuc2V0dGFibGVGaWVsZCcgXSA9PT0gJ290aGVyJywgJ2FwcGx5U3RhdGUgbXlVbnNldHRhYmxlRmllbGQnICk7XHJcbiAgYXNzZXJ0Lm9rKCB4LmdldHRlcnNBbmRTZXR0ZXJzVGVzdCA9PT0gJ290aGVyMicsICdhcHBseVN0YXRlIGdldHRlcnNBbmRTZXR0ZXJzVGVzdCcgKTtcclxuICBhc3NlcnQub2soIHhbICdfc2VjcmV0TmFtZScgXSA9PT0gJ0JvYicsICdhcHBseVN0YXRlIHVuZGVyc2NvcmUga2V5ICsgdW5kZXJzY29yZSBjb3JlJyApO1xyXG4gIGFzc2VydC5vayggIXguaGFzT3duUHJvcGVydHkoICdzZWNyZXROYW1lJyApLCAnZG8gbm90IHdyaXRlIGEgYmFkIGZpZWxkIHNlY3JldE5hbWUnICk7XHJcbiAgYXNzZXJ0Lm9rKCB4WyAnX3NlY3JldE5hbWVCdXRQdWJsaWNTdGF0ZScgXSA9PT0gJ0JvYjInLCAnYXBwbHlTdGF0ZSBub251bmRlcnNjb3JlIGtleSArIHVuZGVyc2NvcmUgY29yZScgKTtcclxuICBhc3NlcnQub2soICF4Lmhhc093blByb3BlcnR5KCAnc2VjcmV0TmFtZUJ1dFB1YmxpY1N0YXRlJyApLCAnZG8gbm90IHdyaXRlIGEgYmFkIGZpZWxkIHNlY3JldE5hbWVCdXRQdWJsaWNTdGF0ZScgKTtcclxufSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxNQUFNLE1BQU0sYUFBYTtBQUNoQyxPQUFPQyxTQUFTLE1BQU0sZ0JBQWdCO0FBQ3RDLE9BQU9DLFFBQVEsTUFBTSxlQUFlO0FBQ3BDLE9BQU9DLFFBQVEsTUFBTSxlQUFlO0FBRXBDQyxLQUFLLENBQUNDLE1BQU0sQ0FBRSxRQUFTLENBQUM7QUFFeEJELEtBQUssQ0FBQ0UsSUFBSSxDQUFFLGFBQWEsRUFBRUMsTUFBTSxJQUFJO0VBQ25DQSxNQUFNLENBQUNDLEVBQUUsQ0FBRSxJQUFJLEVBQUUsY0FBZSxDQUFDO0FBQ25DLENBQUUsQ0FBQztBQUNISixLQUFLLENBQUNFLElBQUksQ0FBRSxzQ0FBc0MsRUFBRUMsTUFBTSxJQUFJO0VBRTVELE1BQU1FLE9BQU8sQ0FBQztJQUNMQyxVQUFVLEdBQUcsSUFBSTtJQUNqQkMsV0FBVyxHQUFHLENBQUM7SUFDZkMsMEJBQTBCLEdBQUcsRUFBRTtJQUM5QkMsa0JBQWtCLEdBQUcsZUFBZTtJQUNwQ0MsV0FBVyxHQUFHLE9BQU87SUFDckJDLHlCQUF5QixHQUFHLFFBQVE7SUFDcENDLHdCQUF3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