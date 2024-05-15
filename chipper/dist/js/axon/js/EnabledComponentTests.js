// Copyright 2021-2024, University of Colorado Boulder

/**
 * QUnit tests for EnabledComponent
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import BooleanProperty from './BooleanProperty.js';
import EnabledComponent from './EnabledComponent.js';
import Property from './Property.js';
QUnit.module('EnabledComponent');
QUnit.test('EnabledComponent into Object', assert => {
  class EnabledObject extends EnabledComponent {
    constructor(options) {
      super(options);
    }
  }
  const object = new EnabledObject();
  testEnabledComponent(assert, object, 'default enabledProperty created');
  object['disposeEnabledComponent']();
  assert.ok(object.enabledProperty.isDisposed, 'enabledProperty should be disposed because it was not passed in');
  const myEnabledProperty = new BooleanProperty(false);
  const passedInEnabledPropertyObject = new EnabledObject({
    enabledProperty: myEnabledProperty
  });
  testEnabledComponent(assert, object, 'passed in enabledProperty');
  assert.ok(myEnabledProperty === passedInEnabledPropertyObject.enabledProperty, 'passed in should be the same');
  passedInEnabledPropertyObject['disposeEnabledComponent']();
  assert.ok(!myEnabledProperty.isDisposed, 'do not dispose my enabledProperty!');
});
QUnit.test('EnabledComponent.isDisposable', assert => {
  assert.ok(true, 'when no window.assertions');
  const object1 = new EnabledComponent({
    isDisposable: true
  });
  const object2 = new EnabledComponent();
  const object3 = new EnabledComponent({
    isDisposable: false
  });
  object1.dispose();
  object2.dispose();
  if (window.assert) {
    assert.throws(() => object3.dispose(), 'should throw if isDisposable is false');
  }
});

/**
 * Test basic functionality for an object that uses EnabledComponent
 * assert - from QUnit
 * enabledObject - subtype of EnabledComponent
 * message - to tack onto assert messages
 */
function testEnabledComponent(assert, enabledObject, message) {
  assert.ok(enabledObject.enabledProperty instanceof Property, `${message}: enabledProperty should exist`);
  assert.ok(enabledObject.enabledProperty.value === enabledObject.enabled, `${message}: test getter`);
  enabledObject.enabled = false;
  assert.ok(!enabledObject.enabled, `${message}: test setter`);
  assert.ok(enabledObject.enabledProperty.value === enabledObject.enabled, `${message}: test getter after setting`);
  assert.ok(!enabledObject.enabledProperty.value, `${message}: test getter after setting`);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJFbmFibGVkQ29tcG9uZW50IiwiUHJvcGVydHkiLCJRVW5pdCIsIm1vZHVsZSIsInRlc3QiLCJhc3NlcnQiLCJFbmFibGVkT2JqZWN0IiwiY29uc3RydWN0b3IiLCJvcHRpb25zIiwib2JqZWN0IiwidGVzdEVuYWJsZWRDb21wb25lbnQiLCJvayIsImVuYWJsZWRQcm9wZXJ0eSIsImlzRGlzcG9zZWQiLCJteUVuYWJsZWRQcm9wZXJ0eSIsInBhc3NlZEluRW5hYmxlZFByb3BlcnR5T2JqZWN0Iiwib2JqZWN0MSIsImlzRGlzcG9zYWJsZSIsIm9iamVjdDIiLCJvYmplY3QzIiwiZGlzcG9zZSIsIndpbmRvdyIsInRocm93cyIsImVuYWJsZWRPYmplY3QiLCJtZXNzYWdlIiwidmFsdWUiLCJlbmFibGVkIl0sInNvdXJjZXMiOlsiRW5hYmxlZENvbXBvbmVudFRlc3RzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFFVbml0IHRlc3RzIGZvciBFbmFibGVkQ29tcG9uZW50XHJcbiAqXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgQm9vbGVhblByb3BlcnR5IGZyb20gJy4vQm9vbGVhblByb3BlcnR5LmpzJztcclxuaW1wb3J0IEVuYWJsZWRDb21wb25lbnQsIHsgRW5hYmxlZENvbXBvbmVudE9wdGlvbnMgfSBmcm9tICcuL0VuYWJsZWRDb21wb25lbnQuanMnO1xyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi9Qcm9wZXJ0eS5qcyc7XHJcblxyXG5RVW5pdC5tb2R1bGUoICdFbmFibGVkQ29tcG9uZW50JyApO1xyXG5cclxuUVVuaXQudGVzdCggJ0VuYWJsZWRDb21wb25lbnQgaW50byBPYmplY3QnLCBhc3NlcnQgPT4ge1xyXG5cclxuICBjbGFzcyBFbmFibGVkT2JqZWN0IGV4dGVuZHMgRW5hYmxlZENvbXBvbmVudCB7XHJcbiAgICBwdWJsaWMgY29uc3RydWN0b3IoIG9wdGlvbnM/OiBFbmFibGVkQ29tcG9uZW50T3B0aW9ucyApIHtcclxuICAgICAgc3VwZXIoIG9wdGlvbnMgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IG9iamVjdCA9IG5ldyBFbmFibGVkT2JqZWN0KCk7XHJcbiAgdGVzdEVuYWJsZWRDb21wb25lbnQoIGFzc2VydCwgb2JqZWN0LCAnZGVmYXVsdCBlbmFibGVkUHJvcGVydHkgY3JlYXRlZCcgKTtcclxuXHJcbiAgb2JqZWN0WyAnZGlzcG9zZUVuYWJsZWRDb21wb25lbnQnIF0oKTtcclxuICBhc3NlcnQub2soIG9iamVjdC5lbmFibGVkUHJvcGVydHkuaXNEaXNwb3NlZCwgJ2VuYWJsZWRQcm9wZXJ0eSBzaG91bGQgYmUgZGlzcG9zZWQgYmVjYXVzZSBpdCB3YXMgbm90IHBhc3NlZCBpbicgKTtcclxuXHJcbiAgY29uc3QgbXlFbmFibGVkUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCBmYWxzZSApO1xyXG4gIGNvbnN0IHBhc3NlZEluRW5hYmxlZFByb3BlcnR5T2JqZWN0ID0gbmV3IEVuYWJsZWRPYmplY3QoIHtcclxuICAgIGVuYWJsZWRQcm9wZXJ0eTogbXlFbmFibGVkUHJvcGVydHlcclxuICB9ICk7XHJcbiAgdGVzdEVuYWJsZWRDb21wb25lbnQoIGFzc2VydCwgb2JqZWN0LCAncGFzc2VkIGluIGVuYWJsZWRQcm9wZXJ0eScgKTtcclxuICBhc3NlcnQub2soIG15RW5hYmxlZFByb3BlcnR5ID09PSBwYXNzZWRJbkVuYWJsZWRQcm9wZXJ0eU9iamVjdC5lbmFibGVkUHJvcGVydHksICdwYXNzZWQgaW4gc2hvdWxkIGJlIHRoZSBzYW1lJyApO1xyXG4gIHBhc3NlZEluRW5hYmxlZFByb3BlcnR5T2JqZWN0WyAnZGlzcG9zZUVuYWJsZWRDb21wb25lbnQnIF0oKTtcclxuICBhc3NlcnQub2soICFteUVuYWJsZWRQcm9wZXJ0eS5pc0Rpc3Bvc2VkLCAnZG8gbm90IGRpc3Bvc2UgbXkgZW5hYmxlZFByb3BlcnR5IScgKTtcclxufSApO1xyXG5cclxuUVVuaXQudGVzdCggJ0VuYWJsZWRDb21wb25lbnQuaXNEaXNwb3NhYmxlJywgYXNzZXJ0ID0+IHtcclxuICBhc3NlcnQub2soIHRydWUsICd3aGVuIG5vIHdpbmRvdy5hc3NlcnRpb25zJyApO1xyXG5cclxuICBjb25zdCBvYmplY3QxID0gbmV3IEVuYWJsZWRDb21wb25lbnQoIHtcclxuICAgIGlzRGlzcG9zYWJsZTogdHJ1ZVxyXG4gIH0gKTtcclxuICBjb25zdCBvYmplY3QyID0gbmV3IEVuYWJsZWRDb21wb25lbnQoKTtcclxuICBjb25zdCBvYmplY3QzID0gbmV3IEVuYWJsZWRDb21wb25lbnQoIHtcclxuICAgIGlzRGlzcG9zYWJsZTogZmFsc2VcclxuICB9ICk7XHJcblxyXG4gIG9iamVjdDEuZGlzcG9zZSgpO1xyXG4gIG9iamVjdDIuZGlzcG9zZSgpO1xyXG4gIGlmICggd2luZG93LmFzc2VydCApIHtcclxuICAgIGFzc2VydC50aHJvd3MoICgpID0+IG9iamVjdDMuZGlzcG9zZSgpLCAnc2hvdWxkIHRocm93IGlmIGlzRGlzcG9zYWJsZSBpcyBmYWxzZScgKTtcclxuICB9XHJcbn0gKTtcclxuXHJcbi8qKlxyXG4gKiBUZXN0IGJhc2ljIGZ1bmN0aW9uYWxpdHkgZm9yIGFuIG9iamVjdCB0aGF0IHVzZXMgRW5hYmxlZENvbXBvbmVudFxyXG4gKiBhc3NlcnQgLSBmcm9tIFFVbml0XHJcbiAqIGVuYWJsZWRPYmplY3QgLSBzdWJ0eXBlIG9mIEVuYWJsZWRDb21wb25lbnRcclxuICogbWVzc2FnZSAtIHRvIHRhY2sgb250byBhc3NlcnQgbWVzc2FnZXNcclxuICovXHJcbmZ1bmN0aW9uIHRlc3RFbmFibGVkQ29tcG9uZW50KCBhc3NlcnQ6IEFzc2VydCwgZW5hYmxlZE9iamVjdDogRW5hYmxlZENvbXBvbmVudCwgbWVzc2FnZTogc3RyaW5nICk6IHZvaWQge1xyXG4gIGFzc2VydC5vayggZW5hYmxlZE9iamVjdC5lbmFibGVkUHJvcGVydHkgaW5zdGFuY2VvZiBQcm9wZXJ0eSwgYCR7bWVzc2FnZX06IGVuYWJsZWRQcm9wZXJ0eSBzaG91bGQgZXhpc3RgICk7XHJcbiAgYXNzZXJ0Lm9rKCBlbmFibGVkT2JqZWN0LmVuYWJsZWRQcm9wZXJ0eS52YWx1ZSA9PT0gZW5hYmxlZE9iamVjdC5lbmFibGVkLCBgJHttZXNzYWdlfTogdGVzdCBnZXR0ZXJgICk7XHJcblxyXG4gIGVuYWJsZWRPYmplY3QuZW5hYmxlZCA9IGZhbHNlO1xyXG4gIGFzc2VydC5vayggIWVuYWJsZWRPYmplY3QuZW5hYmxlZCwgYCR7bWVzc2FnZX06IHRlc3Qgc2V0dGVyYCApO1xyXG4gIGFzc2VydC5vayggZW5hYmxlZE9iamVjdC5lbmFibGVkUHJvcGVydHkudmFsdWUgPT09IGVuYWJsZWRPYmplY3QuZW5hYmxlZCwgYCR7bWVzc2FnZX06IHRlc3QgZ2V0dGVyIGFmdGVyIHNldHRpbmdgICk7XHJcbiAgYXNzZXJ0Lm9rKCAhZW5hYmxlZE9iamVjdC5lbmFibGVkUHJvcGVydHkudmFsdWUsIGAke21lc3NhZ2V9OiB0ZXN0IGdldHRlciBhZnRlciBzZXR0aW5nYCApO1xyXG59Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLGVBQWUsTUFBTSxzQkFBc0I7QUFDbEQsT0FBT0MsZ0JBQWdCLE1BQW1DLHVCQUF1QjtBQUNqRixPQUFPQyxRQUFRLE1BQU0sZUFBZTtBQUVwQ0MsS0FBSyxDQUFDQyxNQUFNLENBQUUsa0JBQW1CLENBQUM7QUFFbENELEtBQUssQ0FBQ0UsSUFBSSxDQUFFLDhCQUE4QixFQUFFQyxNQUFNLElBQUk7RUFFcEQsTUFBTUMsYUFBYSxTQUFTTixnQkFBZ0IsQ0FBQztJQUNwQ08sV0FBV0EsQ0FBRUMsT0FBaUMsRUFBRztNQUN0RCxLQUFLLENBQUVBLE9B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