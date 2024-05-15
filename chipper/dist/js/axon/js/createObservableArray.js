// Copyright 2020-2024, University of Colorado Boulder

// createObservableArray conforms to the Proxy interface, which is polluted with `any` types.  Therefore we disable
// this rule for this file.
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Creates an object that has the same API as an Array, but also supports notifications and PhET-iO. When an item
 * is added or removed, the lengthProperty changes before elementAddedEmitter or elementRemovedEmitter emit.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import arrayRemove from '../../phet-core/js/arrayRemove.js';
import assertMutuallyExclusiveOptions from '../../phet-core/js/assertMutuallyExclusiveOptions.js';
import merge from '../../phet-core/js/merge.js';
import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';
import ArrayIO from '../../tandem/js/types/ArrayIO.js';
import IOType from '../../tandem/js/types/IOType.js';
import axon from './axon.js';
import Emitter from './Emitter.js';
import NumberProperty from './NumberProperty.js';
import Validation from './Validation.js';
import isSettingPhetioStateProperty from '../../tandem/js/isSettingPhetioStateProperty.js';
import IOTypeCache from '../../tandem/js/IOTypeCache.js';
import Tandem from '../../tandem/js/Tandem.js';

// NOTE: Is this up-to-date and correct? Looks like we tack on phet-io stuff depending on the phetioType.

// eslint-disable-line -- futureproof type param if we type this
// // We don't import because of the repo dependency

// Typed for internal usage

const createObservableArray = providedOptions => {
  assertMutuallyExclusiveOptions(providedOptions, ['length'], ['elements']);
  const options = optionize()({
    hasListenerOrderDependencies: false,
    // Also supports phetioType or validator options.  If both are supplied, only the phetioType is respected

    length: 0,
    elements: [],
    elementAddedEmitterOptions: {},
    elementRemovedEmitterOptions: {},
    lengthPropertyOptions: {}
  }, providedOptions);
  let emitterParameterOptions = null;
  if (options.phetioType) {
    assert && assert(options.phetioType.typeName.startsWith('ObservableArrayIO'));
    emitterParameterOptions = {
      name: 'value',
      phetioType: options.phetioType.parameterTypes[0]
    };
  }
  // NOTE: Improve with Validation
  else if (!Validation.getValidatorValidationError(options)) {
    const validator = _.pick(options, Validation.VALIDATOR_KEYS);
    emitterParameterOptions = merge({
      name: 'value'
    }, validator);
  } else {
    emitterParameterOptions = merge({
      name: 'value'
    }, {
      isValidValue: _.stubTrue
    });
  }

  // notifies when an element has been added
  const elementAddedEmitter = new Emitter(combineOptions({
    tandem: options.tandem?.createTandem('elementAddedEmitter'),
    parameters: [emitterParameterOptions],
    phetioReadOnly: true,
    hasListenerOrderDependencies: options.hasListenerOrderDependencies
  }, options.elementAddedEmitterOptions));

  // notifies when an element has been removed
  const elementRemovedEmitter = new Emitter(combineOptions({
    tandem: options.tandem?.createTandem('elementRemovedEmitter'),
    parameters: [emitterParameterOptions],
    phetioReadOnly: true,
    hasListenerOrderDependencies: options.hasListenerOrderDependencies
  }, options.elementRemovedEmitterOptions));

  // observe this, but don't set it. Updated when Array modifiers are called (except array.length=...)
  const lengthProperty = new NumberProperty(0, combineOptions({
    numberType: 'Integer',
    tandem: options.tandem?.createTandem('lengthProperty'),
    phetioReadOnly: true,
    hasListenerOrderDependencies: options.hasListenerOrderDependencies
  }, options.lengthPropertyOptions));

  // The underlying array which is wrapped by the Proxy
  const targetArray = [];

  // Verify that lengthProperty is updated before listeners are notified, but not when setting PhET-iO State,
  // This is because we cannot specify ordering dependencies between Properties and ObservableArrays,
  assert && elementAddedEmitter.addListener(() => {
    if (!isSettingPhetioStateProperty.value) {
      assert && assert(lengthProperty.value === targetArray.length, 'lengthProperty out of sync while adding element');
    }
  });
  assert && elementRemovedEmitter.addListener(() => {
    if (!isSettingPhetioStateProperty.value) {
      assert && assert(lengthProperty.value === targetArray.length, 'lengthProperty out of sync while removing element');
    }
  });
  const deferredActions = [];
  const emitNotification = (emitter, element) => {
    if (observableArray.notificationsDeferred) {
      observableArray.deferredActions.push(() => emitter.emit(element));
    } else {
      emitter.emit(element);
    }
  };

  // The Proxy which will intercept method calls and trigger notifications.
  const observableArray = new Proxy(targetArray, {
    /**
     * Trap for getting a property or method.
     * @param array - the targetArray
     * @param key
     * @param receiver
     * @returns - the requested value
     */
    get: function (array, key, receiver) {
      assert && assert(array === targetArray, 'array should match the targetArray');
      if (methods.hasOwnProperty(key)) {
        return methods[key];
      } else {
        return Reflect.get(array, key, receiver);
      }
    },
    /**
     * Trap for setting a property value.
     * @param array - the targetArray
     * @param key
     * @param newValue
     * @returns - success
     */
    set: function (array, key, newValue) {
      assert && assert(array === targetArray, 'array should match the targetArray');
      const oldValue = array[key];
      let removedElements = null;

      // See which items are removed
      if (key === 'length') {
        removedElements = array.slice(newValue);
      }
      const returnValue = Reflect.set(array, key, newValue);

      // If we're using the bracket operator [index] of Array, then parse the index between the brackets.
      const numberKey = Number(key);
      if (Number.isInteger(numberKey) && numberKey >= 0 && oldValue !== newValue) {
        lengthProperty.value = array.length;
        if (oldValue !== undefined) {
          emitNotification(elementRemovedEmitter, array[key]);
        }
        if (newValue !== undefined) {
          emitNotification(elementAddedEmitter, newValue);
        }
      } else if (key === 'length') {
        lengthProperty.value = newValue;
        assert && assert(removedElements, 'removedElements should be defined for key===length');
        removedElements && removedElements.forEach(element => emitNotification(elementRemovedEmitter, element));
      }
      return returnValue;
    },
    /**
     * This is the trap for the delete operator.
     */
    deleteProperty: function (array, key) {
      assert && assert(array === targetArray, 'array should match the targetArray');

      // If we're using the bracket operator [index] of Array, then parse the index between the brackets.
      const numberKey = Number(key);
      let removed;
      if (Number.isInteger(numberKey) && numberKey >= 0) {
        removed = array[key];
      }
      const returnValue = Reflect.deleteProperty(array, key);
      if (removed !== undefined) {
        emitNotification(elementRemovedEmitter, removed);
      }
      return returnValue;
    }
  });

  // private
  observableArray.targetArray = targetArray;
  observableArray.notificationsDeferred = false;
  observableArray.emitNotification = emitNotification;
  observableArray.deferredActions = deferredActions;

  // public
  observableArray.elementAddedEmitter = elementAddedEmitter;
  observableArray.elementRemovedEmitter = elementRemovedEmitter;
  observableArray.lengthProperty = lengthProperty;
  const init = () => {
    if (options.length >= 0) {
      observableArray.length = options.length;
    }
    if (options.elements.length > 0) {
      Array.prototype.push.apply(observableArray, options.elements);
    }
  };
  init();

  //TODO https://github.com/phetsims/axon/issues/334 Move to "prototype" above or drop support
  observableArray.reset = () => {
    observableArray.length = 0;
    init();
  };

  /******************************************
   * PhET-iO support
   *******************************************/
  if (options.tandem?.supplied) {
    assert && assert(options.phetioType);
    observableArray.phetioElementType = options.phetioType.parameterTypes[0];

    // for managing state in phet-io
    // Use the same tandem and phetioState options so it can "masquerade" as the real object.  When PhetioObject is a mixin this can be changed.
    observableArray._observableArrayPhetioObject = new ObservableArrayPhetioObject(observableArray, options);
    if (Tandem.PHET_IO_ENABLED) {
      assert && assert(_.hasIn(window, 'phet.phetio.phetioEngine.phetioStateEngine'), 'PhET-iO Instrumented ObservableArrays must be created once phetioEngine has been constructed');
      const phetioStateEngine = phet.phetio.phetioEngine.phetioStateEngine;

      // On state start, clear out the container and set to defer notifications.
      phetioStateEngine.clearDynamicElementsEmitter.addListener((state, scopeTandem) => {
        // Only clear if this PhetioDynamicElementContainer is in scope of the state to be set
        if (observableArray._observableArrayPhetioObject?.tandem.hasAncestor(scopeTandem)) {
          // Clear before deferring, so that removal notifications occur eagerly before state set.
          observableArray.length = 0;
          observableArray.setNotificationsDeferred(true);
        }
      });

      // done with state setting
      phetioStateEngine.undeferEmitter.addListener(() => {
        if (observableArray.notificationsDeferred) {
          observableArray.setNotificationsDeferred(false);
        }
      });

      // It is possible and often that ObservableArray listeners are responsible for creating dynamic elements, and so
      // we cannot assume that all listeners can be deferred until after setting values. This prevents "impossible set state. . ."
      // assertions.
      phetioStateEngine.addSetStateHelper(() => {
        // If we have any deferred actions at this point, execute one. Then the PhET-iO State Engine can ask for more
        // if needed next time. It may be better at some point to do more than just one action here (for performance),
        // but it is a balance. Actions here may also have an order dependency expecting a Property to have its new
        // value already, so one at a time seems best for now. Note that PhetioDynamicElementContainer elects to fire
        // as many as possible, since it is more likely that the creation of one dynamic element would cause the
        // creation of another (model element -> view element).
        if (observableArray.deferredActions.length > 0) {
          observableArray.deferredActions.shift()();
          return true;
        } else {
          return false;
        }
      });
    }
  }
  return observableArray;
};

/**
 * Manages state save/load. This implementation uses Proxy and hence cannot be instrumented as a PhetioObject.  This type
 * provides that functionality.
 */
class ObservableArrayPhetioObject extends PhetioObject {
  // internal, don't use

  /**
   * @param observableArray
   * @param [providedOptions] - same as the options to the parent ObservableArrayDef
   */
  constructor(observableArray, providedOptions) {
    super(providedOptions);
    this.observableArray = observableArray;
  }
}

// Methods shared by all ObservableArrayDef instances
const methods = {
  /******************************************
   * Overridden Array methods
   *******************************************/

  pop(...args) {
    const thisArray = this;
    const initialLength = thisArray.targetArray.length;
    const returnValue = Array.prototype.pop.apply(thisArray.targetArray, args);
    thisArray.lengthProperty.value = thisArray.length;
    initialLength > 0 && thisArray.emitNotification(thisArray.elementRemovedEmitter, returnValue);
    return returnValue;
  },
  shift(...args) {
    const thisArray = this;
    const initialLength = thisArray.targetArray.length;
    const returnValue = Array.prototype.shift.apply(thisArray.targetArray, args);
    thisArray.lengthProperty.value = thisArray.length;
    initialLength > 0 && thisArray.emitNotification(thisArray.elementRemovedEmitter, returnValue);
    return returnValue;
  },
  push(...args) {
    const thisArray = this;
    const returnValue = Array.prototype.push.apply(thisArray.targetArray, args);
    thisArray.lengthProperty.value = thisArray.length;
    for (let i = 0; i < arguments.length; i++) {
      thisArray.emitNotification(thisArray.elementAddedEmitter, args[i]);
    }
    return returnValue;
  },
  unshift(...args) {
    const thisArray = this;
    const returnValue = Array.prototype.unshift.apply(thisArray.targetArray, args);
    thisArray.lengthProperty.value = thisArray.length;
    for (let i = 0; i < args.length; i++) {
      thisArray.emitNotification(thisArray.elementAddedEmitter, args[i]);
    }
    return returnValue;
  },
  splice(...args) {
    const thisArray = this;
    const returnValue = Array.prototype.splice.apply(thisArray.targetArray, args);
    thisArray.lengthProperty.value = thisArray.length;
    const deletedElements = returnValue;
    for (let i = 2; i < args.length; i++) {
      thisArray.emitNotification(thisArray.elementAddedEmitter, args[i]);
    }
    deletedElements.forEach(deletedElement => thisArray.emitNotification(thisArray.elementRemovedEmitter, deletedElement));
    return returnValue;
  },
  copyWithin(...args) {
    const thisArray = this;
    const before = thisArray.targetArray.slice();
    const returnValue = Array.prototype.copyWithin.apply(thisArray.targetArray, args);
    reportDifference(before, thisArray);
    return returnValue;
  },
  fill(...args) {
    const thisArray = this;
    const before = thisArray.targetArray.slice();
    const returnValue = Array.prototype.fill.apply(thisArray.targetArray, args);
    reportDifference(before, thisArray);
    return returnValue;
  },
  /******************************************
   * For compatibility with ObservableArrayDef
   * TODO https://github.com/phetsims/axon/issues/334 consider deleting after migration
   * TODO https://github.com/phetsims/axon/issues/334 if not deleted, rename 'Item' with 'Element'
   *******************************************/
  get: function (index) {
    return this[index];
  },
  addItemAddedListener: function (listener) {
    this.elementAddedEmitter.addListener(listener);
  },
  removeItemAddedListener: function (listener) {
    this.elementAddedEmitter.removeListener(listener);
  },
  addItemRemovedListener: function (listener) {
    this.elementRemovedEmitter.addListener(listener);
  },
  removeItemRemovedListener: function (listener) {
    this.elementRemovedEmitter.removeListener(listener);
  },
  add: function (element) {
    this.push(element);
  },
  addAll: function (elements) {
    this.push(...elements);
  },
  remove: function (element) {
    arrayRemove(this, element);
  },
  removeAll: function (elements) {
    elements.forEach(element => arrayRemove(this, element));
  },
  clear: function () {
    while (this.length > 0) {
      this.pop();
    }
  },
  count: function (predicate) {
    let count = 0;
    for (let i = 0; i < this.length; i++) {
      if (predicate(this[i])) {
        count++;
      }
    }
    return count;
  },
  find: function (predicate, fromIndex) {
    assert && fromIndex !== undefined && assert(typeof fromIndex === 'number', 'fromIndex must be numeric, if provided');
    assert && typeof fromIndex === 'number' && assert(fromIndex >= 0 && fromIndex < this.length, `fromIndex out of bounds: ${fromIndex}`);
    return _.find(this, predicate, fromIndex);
  },
  shuffle: function (random) {
    assert && assert(random, 'random must be supplied');

    // preserve the same _array reference in case any clients got a reference to it with getArray()
    const shuffled = random.shuffle(this);

    // Act on the targetArray so that removal and add notifications aren't sent.
    this.targetArray.length = 0;
    Array.prototype.push.apply(this.targetArray, shuffled);
  },
  // TODO https://github.com/phetsims/axon/issues/334 This also seems important to eliminate
  getArrayCopy: function () {
    return this.slice();
  },
  dispose: function () {
    const thisArray = this;
    thisArray.elementAddedEmitter.dispose();
    thisArray.elementRemovedEmitter.dispose();
    thisArray.lengthProperty.dispose();
    thisArray._observableArrayPhetioObject && thisArray._observableArrayPhetioObject.dispose();
  },
  /******************************************
   * PhET-iO
   *******************************************/
  toStateObject: function () {
    return {
      array: this.map(item => this.phetioElementType.toStateObject(item))
    };
  },
  applyState: function (stateObject) {
    assert && assert(this.length === 0, 'ObservableArrays should be cleared at the beginning of state setting.');
    this.length = 0;
    const elements = stateObject.array.map(paramStateObject => this.phetioElementType.fromStateObject(paramStateObject));
    this.push(...elements);
  },
  setNotificationsDeferred: function (notificationsDeferred) {
    // Handle the case where a listener causes another element to be added/removed. That new action should notify last.
    if (!notificationsDeferred) {
      while (this.deferredActions.length > 0) {
        this.deferredActions.shift()();
      }
    }
    this.notificationsDeferred = notificationsDeferred;
  }
};

/**
 * For copyWithin and fill, which have more complex behavior, we treat the array as a black box, making a shallow copy
 * before the operation in order to identify what has been added and removed.
 */
const reportDifference = (shallowCopy, observableArray) => {
  const before = shallowCopy;
  const after = observableArray.targetArray.slice();
  for (let i = 0; i < before.length; i++) {
    const beforeElement = before[i];
    const afterIndex = after.indexOf(beforeElement);
    if (afterIndex >= 0) {
      before.splice(i, 1);
      after.splice(afterIndex, 1);
      i--;
    }
  }
  before.forEach(element => observableArray.emitNotification(observableArray.elementRemovedEmitter, element));
  after.forEach(element => observableArray.emitNotification(observableArray.elementAddedEmitter, element));
};

// Cache each parameterized ObservableArrayIO
// based on the parameter type, so that it is only created once.
const cache = new IOTypeCache();

/**
 * ObservableArrayIO is the IOType for ObservableArrayDef. It delegates most of its implementation to ObservableArrayDef.
 * Instead of being a parametric type, it leverages the phetioElementType on ObservableArrayDef.
 */
const ObservableArrayIO = parameterType => {
  if (!cache.has(parameterType)) {
    cache.set(parameterType, new IOType(`ObservableArrayIO<${parameterType.typeName}>`, {
      valueType: ObservableArrayPhetioObject,
      parameterTypes: [parameterType],
      toStateObject: observableArrayPhetioObject => observableArrayPhetioObject.observableArray.toStateObject(),
      applyState: (observableArrayPhetioObject, state) => observableArrayPhetioObject.observableArray.applyState(state),
      stateSchema: {
        array: ArrayIO(parameterType)
      }
    }));
  }
  return cache.get(parameterType);
};
createObservableArray.ObservableArrayIO = ObservableArrayIO;
axon.register('createObservableArray', createObservableArray);
export default createObservableArray;
export { ObservableArrayIO };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhcnJheVJlbW92ZSIsImFzc2VydE11dHVhbGx5RXhjbHVzaXZlT3B0aW9ucyIsIm1lcmdlIiwib3B0aW9uaXplIiwiY29tYmluZU9wdGlvbnMiLCJQaGV0aW9PYmplY3QiLCJBcnJheUlPIiwiSU9UeXBlIiwiYXhvbiIsIkVtaXR0ZXIiLCJOdW1iZXJQcm9wZXJ0eSIsIlZhbGlkYXRpb24iLCJpc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5IiwiSU9UeXBlQ2FjaGUiLCJUYW5kZW0iLCJjcmVhdGVPYnNlcnZhYmxlQXJyYXkiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwiaGFzTGlzdGVuZXJPcmRlckRlcGVuZGVuY2llcyIsImxlbmd0aCIsImVsZW1lbnRzIiwiZWxlbWVudEFkZGVkRW1pdHRlck9wdGlvbnMiLCJlbGVtZW50UmVtb3ZlZEVtaXR0ZXJPcHRpb25zIiwibGVuZ3RoUHJvcGVydHlPcHRpb25zIiwiZW1pdHRlclBhcmFtZXRlck9wdGlvbnMiLCJwaGV0aW9UeXBlIiwiYXNzZXJ0IiwidHlwZU5hbWUiLCJzdGFydHNXaXRoIiwibmFtZSIsInBhcmFtZXRlclR5cGVzIiwiZ2V0VmFsaWRhdG9yVmFsaWRhdGlvbkVycm9yIiwidmFsaWRhdG9yIiwiXyIsInBpY2siLCJWQUxJREFUT1JfS0VZUyIsImlzVmFsaWRWYWx1ZSIsInN0dWJUcnVlIiwiZWxlbWVudEFkZGVkRW1pdHRlciIsInRhbmRlbSIsImNyZWF0ZVRhbmRlbSIsInBhcmFtZXRlcnMiLCJwaGV0aW9SZWFkT25seSIsImVsZW1lbnRSZW1vdmVkRW1pdHRlciIsImxlbmd0aFByb3BlcnR5IiwibnVtYmVyVHlwZSIsInRhcmdldEFycmF5IiwiYWRkTGlzdGVuZXIiLCJ2YWx1ZSIsImRlZmVycmVkQWN0aW9ucyIsImVtaXROb3RpZmljYXRpb24iLCJlbWl0dGVyIiwiZWxlbWVudCIsIm9ic2VydmFibGVBcnJheSIsIm5vdGlmaWNhdGlvbnNEZWZlcnJlZCIsInB1c2giLCJlbWl0IiwiUHJveHkiLCJnZXQiLCJhcnJheSIsImtleSIsInJlY2VpdmVyIiwibWV0aG9kcyIsImhhc093blByb3BlcnR5IiwiUmVmbGVjdCIsInNldCIsIm5ld1ZhbHVlIiwib2xkVmFsdWUiLCJyZW1vdmVkRWxlbWVudHMiLCJzbGljZSIsInJldHVyblZhbHVlIiwibnVtYmVyS2V5IiwiTnVtYmVyIiwiaXNJbnRlZ2VyIiwidW5kZWZpbmVkIiwiZm9yRWFjaCIsImRlbGV0ZVByb3BlcnR5IiwicmVtb3ZlZCIsImluaXQiLCJBcnJheSIsInByb3RvdHlwZSIsImFwcGx5IiwicmVzZXQiLCJzdXBwbGllZCIsInBoZXRpb0VsZW1lbnRUeXBlIiwiX29ic2VydmFibGVBcnJheVBoZXRpb09iamVjdCIsIk9ic2VydmFibGVBcnJheVBoZXRpb09iamVjdCIsIlBIRVRfSU9fRU5BQkxFRCIsImhhc0luIiwid2luZG93IiwicGhldGlvU3RhdGVFbmdpbmUiLCJwaGV0IiwicGhldGlvIiwicGhldGlvRW5naW5lIiwiY2xlYXJEeW5hbWljRWxlbWVudHNFbWl0dGVyIiwic3RhdGUiLCJzY29wZVRhbmRlbSIsImhhc0FuY2VzdG9yIiwic2V0Tm90aWZpY2F0aW9uc0RlZmVycmVkIiwidW5kZWZlckVtaXR0ZXIiLCJhZGRTZXRTdGF0ZUhlbHBlciIsInNoaWZ0IiwiY29uc3RydWN0b3IiLCJwb3AiLCJhcmdzIiwidGhpc0FycmF5IiwiaW5pdGlhbExlbmd0aCIsImkiLCJhcmd1bWVudHMiLCJ1bnNoaWZ0Iiwic3BsaWNlIiwiZGVsZXRlZEVsZW1lbnRzIiwiZGVsZXRlZEVsZW1lbnQiLCJjb3B5V2l0aGluIiwiYmVmb3JlIiwicmVwb3J0RGlmZmVyZW5jZSIsImZpbGwiLCJpbmRleCIsImFkZEl0ZW1BZGRlZExpc3RlbmVyIiwibGlzdGVuZXIiLCJyZW1vdmVJdGVtQWRkZWRMaXN0ZW5lciIsInJlbW92ZUxpc3RlbmVyIiwiYWRkSXRlbVJlbW92ZWRMaXN0ZW5lciIsInJlbW92ZUl0ZW1SZW1vdmVkTGlzdGVuZXIiLCJhZGQiLCJhZGRBbGwiLCJyZW1vdmUiLCJyZW1vdmVBbGwiLCJjbGVhciIsImNvdW50IiwicHJlZGljYXRlIiwiZmluZCIsImZyb21JbmRleCIsInNodWZmbGUiLCJyYW5kb20iLCJzaHVmZmxlZCIsImdldEFycmF5Q29weSIsImRpc3Bvc2UiLCJ0b1N0YXRlT2JqZWN0IiwibWFwIiwiaXRlbSIsImFwcGx5U3RhdGUiLCJzdGF0ZU9iamVjdCIsInBhcmFtU3RhdGVPYmplY3QiLCJmcm9tU3RhdGVPYmplY3QiLCJzaGFsbG93Q29weSIsImFmdGVyIiwiYmVmb3JlRWxlbWVudCIsImFmdGVySW5kZXgiLCJpbmRleE9mIiwiY2FjaGUiLCJPYnNlcnZhYmxlQXJyYXlJTyIsInBhcmFtZXRlclR5cGUiLCJoYXMiLCJ2YWx1ZVR5cGUiLCJvYnNlcnZhYmxlQXJyYXlQaGV0aW9PYmplY3QiLCJzdGF0ZVNjaGVtYSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiY3JlYXRlT2JzZXJ2YWJsZUFycmF5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIwLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLy8gY3JlYXRlT2JzZXJ2YWJsZUFycmF5IGNvbmZvcm1zIHRvIHRoZSBQcm94eSBpbnRlcmZhY2UsIHdoaWNoIGlzIHBvbGx1dGVkIHdpdGggYGFueWAgdHlwZXMuICBUaGVyZWZvcmUgd2UgZGlzYWJsZVxyXG4vLyB0aGlzIHJ1bGUgZm9yIHRoaXMgZmlsZS5cclxuLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueSAqL1xyXG4vKipcclxuICogQ3JlYXRlcyBhbiBvYmplY3QgdGhhdCBoYXMgdGhlIHNhbWUgQVBJIGFzIGFuIEFycmF5LCBidXQgYWxzbyBzdXBwb3J0cyBub3RpZmljYXRpb25zIGFuZCBQaEVULWlPLiBXaGVuIGFuIGl0ZW1cclxuICogaXMgYWRkZWQgb3IgcmVtb3ZlZCwgdGhlIGxlbmd0aFByb3BlcnR5IGNoYW5nZXMgYmVmb3JlIGVsZW1lbnRBZGRlZEVtaXR0ZXIgb3IgZWxlbWVudFJlbW92ZWRFbWl0dGVyIGVtaXQuXHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IGFycmF5UmVtb3ZlIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9hcnJheVJlbW92ZS5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IGFzc2VydE11dHVhbGx5RXhjbHVzaXZlT3B0aW9ucyBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvYXNzZXJ0TXV0dWFsbHlFeGNsdXNpdmVPcHRpb25zLmpzJztcclxuaW1wb3J0IG1lcmdlIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9tZXJnZS5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUsIHsgY29tYmluZU9wdGlvbnMgfSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IFBoZXRpb09iamVjdCwgeyBQaGV0aW9PYmplY3RPcHRpb25zIH0gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL1BoZXRpb09iamVjdC5qcyc7XHJcbmltcG9ydCBBcnJheUlPIGZyb20gJy4uLy4uL3RhbmRlbS9qcy90eXBlcy9BcnJheUlPLmpzJztcclxuaW1wb3J0IElPVHlwZSBmcm9tICcuLi8uLi90YW5kZW0vanMvdHlwZXMvSU9UeXBlLmpzJztcclxuaW1wb3J0IGF4b24gZnJvbSAnLi9heG9uLmpzJztcclxuaW1wb3J0IEVtaXR0ZXIsIHsgRW1pdHRlck9wdGlvbnMgfSBmcm9tICcuL0VtaXR0ZXIuanMnO1xyXG5pbXBvcnQgTnVtYmVyUHJvcGVydHksIHsgTnVtYmVyUHJvcGVydHlPcHRpb25zIH0gZnJvbSAnLi9OdW1iZXJQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBWYWxpZGF0aW9uIGZyb20gJy4vVmFsaWRhdGlvbi5qcyc7XHJcbmltcG9ydCBURW1pdHRlciBmcm9tICcuL1RFbWl0dGVyLmpzJztcclxuaW1wb3J0IGlzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkgZnJvbSAnLi4vLi4vdGFuZGVtL2pzL2lzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgSU9UeXBlQ2FjaGUgZnJvbSAnLi4vLi4vdGFuZGVtL2pzL0lPVHlwZUNhY2hlLmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuaW1wb3J0IHsgUGhldGlvU3RhdGUgfSBmcm9tICcuLi8uLi90YW5kZW0vanMvVGFuZGVtQ29uc3RhbnRzLmpzJztcclxuXHJcbi8vIE5PVEU6IElzIHRoaXMgdXAtdG8tZGF0ZSBhbmQgY29ycmVjdD8gTG9va3MgbGlrZSB3ZSB0YWNrIG9uIHBoZXQtaW8gc3R1ZmYgZGVwZW5kaW5nIG9uIHRoZSBwaGV0aW9UeXBlLlxyXG50eXBlIE9ic2VydmFibGVBcnJheUxpc3RlbmVyPFQ+ID0gKCBlbGVtZW50OiBUICkgPT4gdm9pZDtcclxudHlwZSBQcmVkaWNhdGU8VD4gPSAoIGVsZW1lbnQ6IFQgKSA9PiBib29sZWFuO1xyXG50eXBlIE9ic2VydmFibGVBcnJheVN0YXRlT2JqZWN0PFQ+ID0geyBhcnJheTogYW55W10gfTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSAtLSBmdXR1cmVwcm9vZiB0eXBlIHBhcmFtIGlmIHdlIHR5cGUgdGhpc1xyXG50eXBlIEZha2VSYW5kb208VD4gPSB7IHNodWZmbGU6ICggYXJyOiBUW10gKSA9PiBUW10gfTsgLy8gLy8gV2UgZG9uJ3QgaW1wb3J0IGJlY2F1c2Ugb2YgdGhlIHJlcG8gZGVwZW5kZW5jeVxyXG50eXBlIFNlbGZPcHRpb25zPFQ+ID0ge1xyXG4gIGxlbmd0aD86IG51bWJlcjtcclxuICBlbGVtZW50cz86IFRbXTtcclxuICBoYXNMaXN0ZW5lck9yZGVyRGVwZW5kZW5jaWVzPzogYm9vbGVhbjsgLy8gU2VlIFRpbnlFbWl0dGVyLmhhc0xpc3RlbmVyT3JkZXJEZXBlbmRlbmNpZXNcclxuXHJcbiAgLy8gT3B0aW9ucyBmb3IgdGhlIGFycmF5J3MgY2hpbGQgZWxlbWVudHMuIE9taXR0ZWQgb3B0aW9ucyBhcmUgdGhlIHJlc3BvbnNpYmlsaXR5IG9mIHRoZSBhcnJheS5cclxuICBlbGVtZW50QWRkZWRFbWl0dGVyT3B0aW9ucz86IFN0cmljdE9taXQ8RW1pdHRlck9wdGlvbnMsICd0YW5kZW0nIHwgJ3BhcmFtZXRlcnMnIHwgJ3BoZXRpb1JlYWRPbmx5Jz47XHJcbiAgZWxlbWVudFJlbW92ZWRFbWl0dGVyT3B0aW9ucz86IFN0cmljdE9taXQ8RW1pdHRlck9wdGlvbnMsICd0YW5kZW0nIHwgJ3BhcmFtZXRlcnMnIHwgJ3BoZXRpb1JlYWRPbmx5Jz47XHJcbiAgbGVuZ3RoUHJvcGVydHlPcHRpb25zPzogU3RyaWN0T21pdDxOdW1iZXJQcm9wZXJ0eU9wdGlvbnMsICd0YW5kZW0nIHwgJ251bWJlclR5cGUnIHwgJ3BoZXRpb1JlYWRPbmx5Jz47XHJcbn07XHJcbmV4cG9ydCB0eXBlIE9ic2VydmFibGVBcnJheU9wdGlvbnM8VD4gPSBTZWxmT3B0aW9uczxUPiAmIFBoZXRpb09iamVjdE9wdGlvbnM7XHJcblxyXG50eXBlIE9ic2VydmFibGVBcnJheTxUPiA9IHtcclxuICBnZXQ6ICggaW5kZXg6IG51bWJlciApID0+IFQ7XHJcbiAgYWRkSXRlbUFkZGVkTGlzdGVuZXI6ICggbGlzdGVuZXI6IE9ic2VydmFibGVBcnJheUxpc3RlbmVyPFQ+ICkgPT4gdm9pZDtcclxuICByZW1vdmVJdGVtQWRkZWRMaXN0ZW5lcjogKCBsaXN0ZW5lcjogT2JzZXJ2YWJsZUFycmF5TGlzdGVuZXI8VD4gKSA9PiB2b2lkO1xyXG4gIGFkZEl0ZW1SZW1vdmVkTGlzdGVuZXI6ICggbGlzdGVuZXI6IE9ic2VydmFibGVBcnJheUxpc3RlbmVyPFQ+ICkgPT4gdm9pZDtcclxuICByZW1vdmVJdGVtUmVtb3ZlZExpc3RlbmVyOiAoIGxpc3RlbmVyOiBPYnNlcnZhYmxlQXJyYXlMaXN0ZW5lcjxUPiApID0+IHZvaWQ7XHJcbiAgYWRkOiAoIGVsZW1lbnQ6IFQgKSA9PiB2b2lkO1xyXG4gIGFkZEFsbDogKCBlbGVtZW50czogVFtdICkgPT4gdm9pZDtcclxuICByZW1vdmU6ICggZWxlbWVudDogVCApID0+IHZvaWQ7XHJcbiAgcmVtb3ZlQWxsOiAoIGVsZW1lbnRzOiBUW10gKSA9PiB2b2lkO1xyXG4gIGNsZWFyOiAoKSA9PiB2b2lkO1xyXG4gIGNvdW50OiAoIHByZWRpY2F0ZTogUHJlZGljYXRlPFQ+ICkgPT4gbnVtYmVyO1xyXG4gIGZpbmQ6ICggcHJlZGljYXRlOiBQcmVkaWNhdGU8VD4sIGZyb21JbmRleD86IG51bWJlciApID0+IFQgfCB1bmRlZmluZWQ7XHJcbiAgc2h1ZmZsZTogKCByYW5kb206IEZha2VSYW5kb208VD4gKSA9PiB2b2lkO1xyXG4gIGdldEFycmF5Q29weTogKCkgPT4gVFtdO1xyXG4gIGRpc3Bvc2U6ICgpID0+IHZvaWQ7XHJcbiAgdG9TdGF0ZU9iamVjdDogKCkgPT4gT2JzZXJ2YWJsZUFycmF5U3RhdGVPYmplY3Q8VD47XHJcbiAgYXBwbHlTdGF0ZTogKCBzdGF0ZTogT2JzZXJ2YWJsZUFycmF5U3RhdGVPYmplY3Q8VD4gKSA9PiB2b2lkO1xyXG5cclxuICAvLyBsaXN0ZW4gb25seSBwbGVhc2VcclxuICBlbGVtZW50QWRkZWRFbWl0dGVyOiBURW1pdHRlcjxbIFQgXT47XHJcbiAgZWxlbWVudFJlbW92ZWRFbWl0dGVyOiBURW1pdHRlcjxbIFQgXT47XHJcbiAgbGVuZ3RoUHJvcGVydHk6IE51bWJlclByb3BlcnR5O1xyXG5cclxuICAvL1RPRE8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2F4b24vaXNzdWVzLzMzNCBNb3ZlIHRvIFwicHJvdG90eXBlXCIgYWJvdmUgb3IgZHJvcCBzdXBwb3J0XHJcbiAgcmVzZXQ6ICgpID0+IHZvaWQ7XHJcblxyXG4gIC8vIFBvc3NpYmx5IHBhc3NlZCB0aHJvdWdoIHRvIHRoZSBFbWl0dGVyXHJcbiAgcGhldGlvRWxlbWVudFR5cGU/OiBJT1R5cGU7XHJcbn0gJiBUW107XHJcblxyXG4vLyBUeXBlZCBmb3IgaW50ZXJuYWwgdXNhZ2VcclxudHlwZSBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PFQ+ID0ge1xyXG4gIC8vIE1ha2UgaXQgcG9zc2libGUgdG8gdXNlIHRoZSB0YXJnZXRBcnJheSBpbiB0aGUgb3ZlcnJpZGRlbiBtZXRob2RzLlxyXG4gIHRhcmdldEFycmF5OiBUW107XHJcblxyXG4gIF9vYnNlcnZhYmxlQXJyYXlQaGV0aW9PYmplY3Q/OiBPYnNlcnZhYmxlQXJyYXlQaGV0aW9PYmplY3Q8VD47XHJcblxyXG4gIC8vIGtlZXAgdHJhY2sgb2YgbGlzdGVuZXJzIHRvIGJlIGNhbGxlZCB3aGlsZSBkZWZlcnJlZFxyXG4gIGRlZmVycmVkQWN0aW9uczogVm9pZEZ1bmN0aW9uW107XHJcbiAgbm90aWZpY2F0aW9uc0RlZmVycmVkOiBib29sZWFuO1xyXG4gIGVtaXROb3RpZmljYXRpb246ICggZW1pdHRlcjogVEVtaXR0ZXI8WyBUIF0+LCBlbGVtZW50OiBUICkgPT4gdm9pZDtcclxuICBzZXROb3RpZmljYXRpb25zRGVmZXJyZWQoIG5vdGlmaWNhdGlvbnNEZWZlcnJlZDogYm9vbGVhbiApOiB2b2lkO1xyXG59ICYgT2JzZXJ2YWJsZUFycmF5PFQ+O1xyXG5cclxuXHJcbmNvbnN0IGNyZWF0ZU9ic2VydmFibGVBcnJheSA9IDxUPiggcHJvdmlkZWRPcHRpb25zPzogT2JzZXJ2YWJsZUFycmF5T3B0aW9uczxUPiApOiBPYnNlcnZhYmxlQXJyYXk8VD4gPT4ge1xyXG5cclxuICBhc3NlcnRNdXR1YWxseUV4Y2x1c2l2ZU9wdGlvbnMoIHByb3ZpZGVkT3B0aW9ucywgWyAnbGVuZ3RoJyBdLCBbICdlbGVtZW50cycgXSApO1xyXG5cclxuICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPE9ic2VydmFibGVBcnJheU9wdGlvbnM8VD4sIFNlbGZPcHRpb25zPFQ+LCBQaGV0aW9PYmplY3RPcHRpb25zPigpKCB7XHJcblxyXG4gICAgaGFzTGlzdGVuZXJPcmRlckRlcGVuZGVuY2llczogZmFsc2UsXHJcblxyXG4gICAgLy8gQWxzbyBzdXBwb3J0cyBwaGV0aW9UeXBlIG9yIHZhbGlkYXRvciBvcHRpb25zLiAgSWYgYm90aCBhcmUgc3VwcGxpZWQsIG9ubHkgdGhlIHBoZXRpb1R5cGUgaXMgcmVzcGVjdGVkXHJcblxyXG4gICAgbGVuZ3RoOiAwLFxyXG4gICAgZWxlbWVudHM6IFtdLFxyXG4gICAgZWxlbWVudEFkZGVkRW1pdHRlck9wdGlvbnM6IHt9LFxyXG4gICAgZWxlbWVudFJlbW92ZWRFbWl0dGVyT3B0aW9uczoge30sXHJcbiAgICBsZW5ndGhQcm9wZXJ0eU9wdGlvbnM6IHt9XHJcbiAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gIGxldCBlbWl0dGVyUGFyYW1ldGVyT3B0aW9ucyA9IG51bGw7XHJcbiAgaWYgKCBvcHRpb25zLnBoZXRpb1R5cGUgKSB7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5waGV0aW9UeXBlLnR5cGVOYW1lLnN0YXJ0c1dpdGgoICdPYnNlcnZhYmxlQXJyYXlJTycgKSApO1xyXG4gICAgZW1pdHRlclBhcmFtZXRlck9wdGlvbnMgPSB7IG5hbWU6ICd2YWx1ZScsIHBoZXRpb1R5cGU6IG9wdGlvbnMucGhldGlvVHlwZS5wYXJhbWV0ZXJUeXBlcyFbIDAgXSB9O1xyXG4gIH1cclxuICAvLyBOT1RFOiBJbXByb3ZlIHdpdGggVmFsaWRhdGlvblxyXG4gIGVsc2UgaWYgKCAhVmFsaWRhdGlvbi5nZXRWYWxpZGF0b3JWYWxpZGF0aW9uRXJyb3IoIG9wdGlvbnMgKSApIHtcclxuICAgIGNvbnN0IHZhbGlkYXRvciA9IF8ucGljayggb3B0aW9ucywgVmFsaWRhdGlvbi5WQUxJREFUT1JfS0VZUyApO1xyXG4gICAgZW1pdHRlclBhcmFtZXRlck9wdGlvbnMgPSBtZXJnZSggeyBuYW1lOiAndmFsdWUnIH0sIHZhbGlkYXRvciApO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGVtaXR0ZXJQYXJhbWV0ZXJPcHRpb25zID0gbWVyZ2UoIHsgbmFtZTogJ3ZhbHVlJyB9LCB7IGlzVmFsaWRWYWx1ZTogXy5zdHViVHJ1ZSB9ICk7XHJcbiAgfVxyXG5cclxuICAvLyBub3RpZmllcyB3aGVuIGFuIGVsZW1lbnQgaGFzIGJlZW4gYWRkZWRcclxuICBjb25zdCBlbGVtZW50QWRkZWRFbWl0dGVyID0gbmV3IEVtaXR0ZXI8WyBUIF0+KCBjb21iaW5lT3B0aW9uczxFbWl0dGVyT3B0aW9ucz4oIHtcclxuICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0/LmNyZWF0ZVRhbmRlbSggJ2VsZW1lbnRBZGRlZEVtaXR0ZXInICksXHJcbiAgICBwYXJhbWV0ZXJzOiBbIGVtaXR0ZXJQYXJhbWV0ZXJPcHRpb25zIF0sXHJcbiAgICBwaGV0aW9SZWFkT25seTogdHJ1ZSxcclxuICAgIGhhc0xpc3RlbmVyT3JkZXJEZXBlbmRlbmNpZXM6IG9wdGlvbnMuaGFzTGlzdGVuZXJPcmRlckRlcGVuZGVuY2llc1xyXG4gIH0sIG9wdGlvbnMuZWxlbWVudEFkZGVkRW1pdHRlck9wdGlvbnMgKSApO1xyXG5cclxuICAvLyBub3RpZmllcyB3aGVuIGFuIGVsZW1lbnQgaGFzIGJlZW4gcmVtb3ZlZFxyXG4gIGNvbnN0IGVsZW1lbnRSZW1vdmVkRW1pdHRlciA9IG5ldyBFbWl0dGVyPFsgVCBdPiggY29tYmluZU9wdGlvbnM8RW1pdHRlck9wdGlvbnM+KCB7XHJcbiAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtPy5jcmVhdGVUYW5kZW0oICdlbGVtZW50UmVtb3ZlZEVtaXR0ZXInICksXHJcbiAgICBwYXJhbWV0ZXJzOiBbIGVtaXR0ZXJQYXJhbWV0ZXJPcHRpb25zIF0sXHJcbiAgICBwaGV0aW9SZWFkT25seTogdHJ1ZSxcclxuICAgIGhhc0xpc3RlbmVyT3JkZXJEZXBlbmRlbmNpZXM6IG9wdGlvbnMuaGFzTGlzdGVuZXJPcmRlckRlcGVuZGVuY2llc1xyXG4gIH0sIG9wdGlvbnMuZWxlbWVudFJlbW92ZWRFbWl0dGVyT3B0aW9ucyApICk7XHJcblxyXG4gIC8vIG9ic2VydmUgdGhpcywgYnV0IGRvbid0IHNldCBpdC4gVXBkYXRlZCB3aGVuIEFycmF5IG1vZGlmaWVycyBhcmUgY2FsbGVkIChleGNlcHQgYXJyYXkubGVuZ3RoPS4uLilcclxuICBjb25zdCBsZW5ndGhQcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggMCwgY29tYmluZU9wdGlvbnM8TnVtYmVyUHJvcGVydHlPcHRpb25zPigge1xyXG4gICAgbnVtYmVyVHlwZTogJ0ludGVnZXInLFxyXG4gICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbT8uY3JlYXRlVGFuZGVtKCAnbGVuZ3RoUHJvcGVydHknICksXHJcbiAgICBwaGV0aW9SZWFkT25seTogdHJ1ZSxcclxuICAgIGhhc0xpc3RlbmVyT3JkZXJEZXBlbmRlbmNpZXM6IG9wdGlvbnMuaGFzTGlzdGVuZXJPcmRlckRlcGVuZGVuY2llc1xyXG4gIH0sIG9wdGlvbnMubGVuZ3RoUHJvcGVydHlPcHRpb25zICkgKTtcclxuXHJcbiAgLy8gVGhlIHVuZGVybHlpbmcgYXJyYXkgd2hpY2ggaXMgd3JhcHBlZCBieSB0aGUgUHJveHlcclxuICBjb25zdCB0YXJnZXRBcnJheTogVFtdID0gW107XHJcblxyXG4gIC8vIFZlcmlmeSB0aGF0IGxlbmd0aFByb3BlcnR5IGlzIHVwZGF0ZWQgYmVmb3JlIGxpc3RlbmVycyBhcmUgbm90aWZpZWQsIGJ1dCBub3Qgd2hlbiBzZXR0aW5nIFBoRVQtaU8gU3RhdGUsXHJcbiAgLy8gVGhpcyBpcyBiZWNhdXNlIHdlIGNhbm5vdCBzcGVjaWZ5IG9yZGVyaW5nIGRlcGVuZGVuY2llcyBiZXR3ZWVuIFByb3BlcnRpZXMgYW5kIE9ic2VydmFibGVBcnJheXMsXHJcbiAgYXNzZXJ0ICYmIGVsZW1lbnRBZGRlZEVtaXR0ZXIuYWRkTGlzdGVuZXIoICgpID0+IHtcclxuICAgIGlmICggIWlzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGxlbmd0aFByb3BlcnR5LnZhbHVlID09PSB0YXJnZXRBcnJheS5sZW5ndGgsICdsZW5ndGhQcm9wZXJ0eSBvdXQgb2Ygc3luYyB3aGlsZSBhZGRpbmcgZWxlbWVudCcgKTtcclxuICAgIH1cclxuICB9ICk7XHJcbiAgYXNzZXJ0ICYmIGVsZW1lbnRSZW1vdmVkRW1pdHRlci5hZGRMaXN0ZW5lciggKCkgPT4ge1xyXG4gICAgaWYgKCAhaXNTZXR0aW5nUGhldGlvU3RhdGVQcm9wZXJ0eS52YWx1ZSApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggbGVuZ3RoUHJvcGVydHkudmFsdWUgPT09IHRhcmdldEFycmF5Lmxlbmd0aCwgJ2xlbmd0aFByb3BlcnR5IG91dCBvZiBzeW5jIHdoaWxlIHJlbW92aW5nIGVsZW1lbnQnICk7XHJcbiAgICB9XHJcbiAgfSApO1xyXG5cclxuICBjb25zdCBkZWZlcnJlZEFjdGlvbnM6IFZvaWRGdW5jdGlvbltdID0gW107XHJcbiAgY29uc3QgZW1pdE5vdGlmaWNhdGlvbiA9ICggZW1pdHRlcjogVEVtaXR0ZXI8WyBUIF0+LCBlbGVtZW50OiBUICkgPT4ge1xyXG4gICAgaWYgKCBvYnNlcnZhYmxlQXJyYXkubm90aWZpY2F0aW9uc0RlZmVycmVkICkge1xyXG4gICAgICBvYnNlcnZhYmxlQXJyYXkuZGVmZXJyZWRBY3Rpb25zLnB1c2goICgpID0+IGVtaXR0ZXIuZW1pdCggZWxlbWVudCApICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgZW1pdHRlci5lbWl0KCBlbGVtZW50ICk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLy8gVGhlIFByb3h5IHdoaWNoIHdpbGwgaW50ZXJjZXB0IG1ldGhvZCBjYWxscyBhbmQgdHJpZ2dlciBub3RpZmljYXRpb25zLlxyXG4gIGNvbnN0IG9ic2VydmFibGVBcnJheTogUHJpdmF0ZU9ic2VydmFibGVBcnJheTxUPiA9IG5ldyBQcm94eSggdGFyZ2V0QXJyYXksIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyYXAgZm9yIGdldHRpbmcgYSBwcm9wZXJ0eSBvciBtZXRob2QuXHJcbiAgICAgKiBAcGFyYW0gYXJyYXkgLSB0aGUgdGFyZ2V0QXJyYXlcclxuICAgICAqIEBwYXJhbSBrZXlcclxuICAgICAqIEBwYXJhbSByZWNlaXZlclxyXG4gICAgICogQHJldHVybnMgLSB0aGUgcmVxdWVzdGVkIHZhbHVlXHJcbiAgICAgKi9cclxuICAgIGdldDogZnVuY3Rpb24oIGFycmF5OiBUW10sIGtleToga2V5b2YgdHlwZW9mIG1ldGhvZHMsIHJlY2VpdmVyICk6IGFueSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGFycmF5ID09PSB0YXJnZXRBcnJheSwgJ2FycmF5IHNob3VsZCBtYXRjaCB0aGUgdGFyZ2V0QXJyYXknICk7XHJcbiAgICAgIGlmICggbWV0aG9kcy5oYXNPd25Qcm9wZXJ0eSgga2V5ICkgKSB7XHJcbiAgICAgICAgcmV0dXJuIG1ldGhvZHNbIGtleSBdO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBSZWZsZWN0LmdldCggYXJyYXksIGtleSwgcmVjZWl2ZXIgKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyYXAgZm9yIHNldHRpbmcgYSBwcm9wZXJ0eSB2YWx1ZS5cclxuICAgICAqIEBwYXJhbSBhcnJheSAtIHRoZSB0YXJnZXRBcnJheVxyXG4gICAgICogQHBhcmFtIGtleVxyXG4gICAgICogQHBhcmFtIG5ld1ZhbHVlXHJcbiAgICAgKiBAcmV0dXJucyAtIHN1Y2Nlc3NcclxuICAgICAqL1xyXG4gICAgc2V0OiBmdW5jdGlvbiggYXJyYXk6IFRbXSwga2V5OiBzdHJpbmcgfCBzeW1ib2wsIG5ld1ZhbHVlOiBhbnkgKTogYm9vbGVhbiB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGFycmF5ID09PSB0YXJnZXRBcnJheSwgJ2FycmF5IHNob3VsZCBtYXRjaCB0aGUgdGFyZ2V0QXJyYXknICk7XHJcbiAgICAgIGNvbnN0IG9sZFZhbHVlID0gYXJyYXlbIGtleSBhcyBhbnkgXTtcclxuXHJcbiAgICAgIGxldCByZW1vdmVkRWxlbWVudHMgPSBudWxsO1xyXG5cclxuICAgICAgLy8gU2VlIHdoaWNoIGl0ZW1zIGFyZSByZW1vdmVkXHJcbiAgICAgIGlmICgga2V5ID09PSAnbGVuZ3RoJyApIHtcclxuICAgICAgICByZW1vdmVkRWxlbWVudHMgPSBhcnJheS5zbGljZSggbmV3VmFsdWUgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgcmV0dXJuVmFsdWUgPSBSZWZsZWN0LnNldCggYXJyYXksIGtleSwgbmV3VmFsdWUgKTtcclxuXHJcbiAgICAgIC8vIElmIHdlJ3JlIHVzaW5nIHRoZSBicmFja2V0IG9wZXJhdG9yIFtpbmRleF0gb2YgQXJyYXksIHRoZW4gcGFyc2UgdGhlIGluZGV4IGJldHdlZW4gdGhlIGJyYWNrZXRzLlxyXG4gICAgICBjb25zdCBudW1iZXJLZXkgPSBOdW1iZXIoIGtleSApO1xyXG4gICAgICBpZiAoIE51bWJlci5pc0ludGVnZXIoIG51bWJlcktleSApICYmIG51bWJlcktleSA+PSAwICYmIG9sZFZhbHVlICE9PSBuZXdWYWx1ZSApIHtcclxuICAgICAgICBsZW5ndGhQcm9wZXJ0eS52YWx1ZSA9IGFycmF5Lmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCBvbGRWYWx1ZSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgZW1pdE5vdGlmaWNhdGlvbiggZWxlbWVudFJlbW92ZWRFbWl0dGVyLCBhcnJheVsga2V5IGFzIGFueSBdICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggbmV3VmFsdWUgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgIGVtaXROb3RpZmljYXRpb24oIGVsZW1lbnRBZGRlZEVtaXR0ZXIsIG5ld1ZhbHVlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCBrZXkgPT09ICdsZW5ndGgnICkge1xyXG4gICAgICAgIGxlbmd0aFByb3BlcnR5LnZhbHVlID0gbmV3VmFsdWU7XHJcblxyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHJlbW92ZWRFbGVtZW50cywgJ3JlbW92ZWRFbGVtZW50cyBzaG91bGQgYmUgZGVmaW5lZCBmb3Iga2V5PT09bGVuZ3RoJyApO1xyXG4gICAgICAgIHJlbW92ZWRFbGVtZW50cyAmJiByZW1vdmVkRWxlbWVudHMuZm9yRWFjaCggZWxlbWVudCA9PiBlbWl0Tm90aWZpY2F0aW9uKCBlbGVtZW50UmVtb3ZlZEVtaXR0ZXIsIGVsZW1lbnQgKSApO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiByZXR1cm5WYWx1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIGlzIHRoZSB0cmFwIGZvciB0aGUgZGVsZXRlIG9wZXJhdG9yLlxyXG4gICAgICovXHJcbiAgICBkZWxldGVQcm9wZXJ0eTogZnVuY3Rpb24oIGFycmF5OiBUW10sIGtleTogc3RyaW5nIHwgc3ltYm9sICk6IGJvb2xlYW4ge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhcnJheSA9PT0gdGFyZ2V0QXJyYXksICdhcnJheSBzaG91bGQgbWF0Y2ggdGhlIHRhcmdldEFycmF5JyApO1xyXG5cclxuICAgICAgLy8gSWYgd2UncmUgdXNpbmcgdGhlIGJyYWNrZXQgb3BlcmF0b3IgW2luZGV4XSBvZiBBcnJheSwgdGhlbiBwYXJzZSB0aGUgaW5kZXggYmV0d2VlbiB0aGUgYnJhY2tldHMuXHJcbiAgICAgIGNvbnN0IG51bWJlcktleSA9IE51bWJlcigga2V5ICk7XHJcblxyXG4gICAgICBsZXQgcmVtb3ZlZDtcclxuICAgICAgaWYgKCBOdW1iZXIuaXNJbnRlZ2VyKCBudW1iZXJLZXkgKSAmJiBudW1iZXJLZXkgPj0gMCApIHtcclxuICAgICAgICByZW1vdmVkID0gYXJyYXlbIGtleSBhcyBhbnkgXTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByZXR1cm5WYWx1ZSA9IFJlZmxlY3QuZGVsZXRlUHJvcGVydHkoIGFycmF5LCBrZXkgKTtcclxuICAgICAgaWYgKCByZW1vdmVkICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgZW1pdE5vdGlmaWNhdGlvbiggZWxlbWVudFJlbW92ZWRFbWl0dGVyLCByZW1vdmVkICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiByZXR1cm5WYWx1ZTtcclxuICAgIH1cclxuICB9ICkgYXMgUHJpdmF0ZU9ic2VydmFibGVBcnJheTxUPjtcclxuXHJcbiAgLy8gcHJpdmF0ZVxyXG4gIG9ic2VydmFibGVBcnJheS50YXJnZXRBcnJheSA9IHRhcmdldEFycmF5O1xyXG4gIG9ic2VydmFibGVBcnJheS5ub3RpZmljYXRpb25zRGVmZXJyZWQgPSBmYWxzZTtcclxuICBvYnNlcnZhYmxlQXJyYXkuZW1pdE5vdGlmaWNhdGlvbiA9IGVtaXROb3RpZmljYXRpb247XHJcbiAgb2JzZXJ2YWJsZUFycmF5LmRlZmVycmVkQWN0aW9ucyA9IGRlZmVycmVkQWN0aW9ucztcclxuXHJcbiAgLy8gcHVibGljXHJcbiAgb2JzZXJ2YWJsZUFycmF5LmVsZW1lbnRBZGRlZEVtaXR0ZXIgPSBlbGVtZW50QWRkZWRFbWl0dGVyO1xyXG4gIG9ic2VydmFibGVBcnJheS5lbGVtZW50UmVtb3ZlZEVtaXR0ZXIgPSBlbGVtZW50UmVtb3ZlZEVtaXR0ZXI7XHJcbiAgb2JzZXJ2YWJsZUFycmF5Lmxlbmd0aFByb3BlcnR5ID0gbGVuZ3RoUHJvcGVydHk7XHJcblxyXG4gIGNvbnN0IGluaXQgPSAoKSA9PiB7XHJcbiAgICBpZiAoIG9wdGlvbnMubGVuZ3RoID49IDAgKSB7XHJcbiAgICAgIG9ic2VydmFibGVBcnJheS5sZW5ndGggPSBvcHRpb25zLmxlbmd0aDtcclxuICAgIH1cclxuICAgIGlmICggb3B0aW9ucy5lbGVtZW50cy5sZW5ndGggPiAwICkge1xyXG4gICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSggb2JzZXJ2YWJsZUFycmF5LCBvcHRpb25zLmVsZW1lbnRzICk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgaW5pdCgpO1xyXG5cclxuICAvL1RPRE8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2F4b24vaXNzdWVzLzMzNCBNb3ZlIHRvIFwicHJvdG90eXBlXCIgYWJvdmUgb3IgZHJvcCBzdXBwb3J0XHJcbiAgb2JzZXJ2YWJsZUFycmF5LnJlc2V0ID0gKCkgPT4ge1xyXG4gICAgb2JzZXJ2YWJsZUFycmF5Lmxlbmd0aCA9IDA7XHJcbiAgICBpbml0KCk7XHJcbiAgfTtcclxuXHJcbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAqIFBoRVQtaU8gc3VwcG9ydFxyXG4gICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG4gIGlmICggb3B0aW9ucy50YW5kZW0/LnN1cHBsaWVkICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggb3B0aW9ucy5waGV0aW9UeXBlICk7XHJcblxyXG4gICAgb2JzZXJ2YWJsZUFycmF5LnBoZXRpb0VsZW1lbnRUeXBlID0gb3B0aW9ucy5waGV0aW9UeXBlLnBhcmFtZXRlclR5cGVzIVsgMCBdO1xyXG5cclxuICAgIC8vIGZvciBtYW5hZ2luZyBzdGF0ZSBpbiBwaGV0LWlvXHJcbiAgICAvLyBVc2UgdGhlIHNhbWUgdGFuZGVtIGFuZCBwaGV0aW9TdGF0ZSBvcHRpb25zIHNvIGl0IGNhbiBcIm1hc3F1ZXJhZGVcIiBhcyB0aGUgcmVhbCBvYmplY3QuICBXaGVuIFBoZXRpb09iamVjdCBpcyBhIG1peGluIHRoaXMgY2FuIGJlIGNoYW5nZWQuXHJcbiAgICBvYnNlcnZhYmxlQXJyYXkuX29ic2VydmFibGVBcnJheVBoZXRpb09iamVjdCA9IG5ldyBPYnNlcnZhYmxlQXJyYXlQaGV0aW9PYmplY3QoIG9ic2VydmFibGVBcnJheSwgb3B0aW9ucyApO1xyXG5cclxuICAgIGlmICggVGFuZGVtLlBIRVRfSU9fRU5BQkxFRCApIHtcclxuXHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIF8uaGFzSW4oIHdpbmRvdywgJ3BoZXQucGhldGlvLnBoZXRpb0VuZ2luZS5waGV0aW9TdGF0ZUVuZ2luZScgKSxcclxuICAgICAgICAnUGhFVC1pTyBJbnN0cnVtZW50ZWQgT2JzZXJ2YWJsZUFycmF5cyBtdXN0IGJlIGNyZWF0ZWQgb25jZSBwaGV0aW9FbmdpbmUgaGFzIGJlZW4gY29uc3RydWN0ZWQnICk7XHJcblxyXG4gICAgICBjb25zdCBwaGV0aW9TdGF0ZUVuZ2luZSA9IHBoZXQucGhldGlvLnBoZXRpb0VuZ2luZS5waGV0aW9TdGF0ZUVuZ2luZTtcclxuXHJcbiAgICAgIC8vIE9uIHN0YXRlIHN0YXJ0LCBjbGVhciBvdXQgdGhlIGNvbnRhaW5lciBhbmQgc2V0IHRvIGRlZmVyIG5vdGlmaWNhdGlvbnMuXHJcbiAgICAgIHBoZXRpb1N0YXRlRW5naW5lLmNsZWFyRHluYW1pY0VsZW1lbnRzRW1pdHRlci5hZGRMaXN0ZW5lciggKCBzdGF0ZTogUGhldGlvU3RhdGUsIHNjb3BlVGFuZGVtOiBUYW5kZW0gKSA9PiB7XHJcblxyXG4gICAgICAgIC8vIE9ubHkgY2xlYXIgaWYgdGhpcyBQaGV0aW9EeW5hbWljRWxlbWVudENvbnRhaW5lciBpcyBpbiBzY29wZSBvZiB0aGUgc3RhdGUgdG8gYmUgc2V0XHJcbiAgICAgICAgaWYgKCBvYnNlcnZhYmxlQXJyYXkuX29ic2VydmFibGVBcnJheVBoZXRpb09iamVjdD8udGFuZGVtLmhhc0FuY2VzdG9yKCBzY29wZVRhbmRlbSApICkge1xyXG5cclxuICAgICAgICAgIC8vIENsZWFyIGJlZm9yZSBkZWZlcnJpbmcsIHNvIHRoYXQgcmVtb3ZhbCBub3RpZmljYXRpb25zIG9jY3VyIGVhZ2VybHkgYmVmb3JlIHN0YXRlIHNldC5cclxuICAgICAgICAgIG9ic2VydmFibGVBcnJheS5sZW5ndGggPSAwO1xyXG5cclxuICAgICAgICAgIG9ic2VydmFibGVBcnJheS5zZXROb3RpZmljYXRpb25zRGVmZXJyZWQoIHRydWUgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIC8vIGRvbmUgd2l0aCBzdGF0ZSBzZXR0aW5nXHJcbiAgICAgIHBoZXRpb1N0YXRlRW5naW5lLnVuZGVmZXJFbWl0dGVyLmFkZExpc3RlbmVyKCAoKSA9PiB7XHJcbiAgICAgICAgaWYgKCBvYnNlcnZhYmxlQXJyYXkubm90aWZpY2F0aW9uc0RlZmVycmVkICkge1xyXG4gICAgICAgICAgb2JzZXJ2YWJsZUFycmF5LnNldE5vdGlmaWNhdGlvbnNEZWZlcnJlZCggZmFsc2UgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIC8vIEl0IGlzIHBvc3NpYmxlIGFuZCBvZnRlbiB0aGF0IE9ic2VydmFibGVBcnJheSBsaXN0ZW5lcnMgYXJlIHJlc3BvbnNpYmxlIGZvciBjcmVhdGluZyBkeW5hbWljIGVsZW1lbnRzLCBhbmQgc29cclxuICAgICAgLy8gd2UgY2Fubm90IGFzc3VtZSB0aGF0IGFsbCBsaXN0ZW5lcnMgY2FuIGJlIGRlZmVycmVkIHVudGlsIGFmdGVyIHNldHRpbmcgdmFsdWVzLiBUaGlzIHByZXZlbnRzIFwiaW1wb3NzaWJsZSBzZXQgc3RhdGUuIC4gLlwiXHJcbiAgICAgIC8vIGFzc2VydGlvbnMuXHJcbiAgICAgIHBoZXRpb1N0YXRlRW5naW5lLmFkZFNldFN0YXRlSGVscGVyKCAoKSA9PiB7XHJcblxyXG4gICAgICAgIC8vIElmIHdlIGhhdmUgYW55IGRlZmVycmVkIGFjdGlvbnMgYXQgdGhpcyBwb2ludCwgZXhlY3V0ZSBvbmUuIFRoZW4gdGhlIFBoRVQtaU8gU3RhdGUgRW5naW5lIGNhbiBhc2sgZm9yIG1vcmVcclxuICAgICAgICAvLyBpZiBuZWVkZWQgbmV4dCB0aW1lLiBJdCBtYXkgYmUgYmV0dGVyIGF0IHNvbWUgcG9pbnQgdG8gZG8gbW9yZSB0aGFuIGp1c3Qgb25lIGFjdGlvbiBoZXJlIChmb3IgcGVyZm9ybWFuY2UpLFxyXG4gICAgICAgIC8vIGJ1dCBpdCBpcyBhIGJhbGFuY2UuIEFjdGlvbnMgaGVyZSBtYXkgYWxzbyBoYXZlIGFuIG9yZGVyIGRlcGVuZGVuY3kgZXhwZWN0aW5nIGEgUHJvcGVydHkgdG8gaGF2ZSBpdHMgbmV3XHJcbiAgICAgICAgLy8gdmFsdWUgYWxyZWFkeSwgc28gb25lIGF0IGEgdGltZSBzZWVtcyBiZXN0IGZvciBub3cuIE5vdGUgdGhhdCBQaGV0aW9EeW5hbWljRWxlbWVudENvbnRhaW5lciBlbGVjdHMgdG8gZmlyZVxyXG4gICAgICAgIC8vIGFzIG1hbnkgYXMgcG9zc2libGUsIHNpbmNlIGl0IGlzIG1vcmUgbGlrZWx5IHRoYXQgdGhlIGNyZWF0aW9uIG9mIG9uZSBkeW5hbWljIGVsZW1lbnQgd291bGQgY2F1c2UgdGhlXHJcbiAgICAgICAgLy8gY3JlYXRpb24gb2YgYW5vdGhlciAobW9kZWwgZWxlbWVudCAtPiB2aWV3IGVsZW1lbnQpLlxyXG4gICAgICAgIGlmICggb2JzZXJ2YWJsZUFycmF5LmRlZmVycmVkQWN0aW9ucy5sZW5ndGggPiAwICkge1xyXG4gICAgICAgICAgb2JzZXJ2YWJsZUFycmF5LmRlZmVycmVkQWN0aW9ucy5zaGlmdCgpISgpO1xyXG4gICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG9ic2VydmFibGVBcnJheTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNYW5hZ2VzIHN0YXRlIHNhdmUvbG9hZC4gVGhpcyBpbXBsZW1lbnRhdGlvbiB1c2VzIFByb3h5IGFuZCBoZW5jZSBjYW5ub3QgYmUgaW5zdHJ1bWVudGVkIGFzIGEgUGhldGlvT2JqZWN0LiAgVGhpcyB0eXBlXHJcbiAqIHByb3ZpZGVzIHRoYXQgZnVuY3Rpb25hbGl0eS5cclxuICovXHJcbmNsYXNzIE9ic2VydmFibGVBcnJheVBoZXRpb09iamVjdDxUPiBleHRlbmRzIFBoZXRpb09iamVjdCB7XHJcblxyXG4gIC8vIGludGVybmFsLCBkb24ndCB1c2VcclxuICBwdWJsaWMgb2JzZXJ2YWJsZUFycmF5OiBPYnNlcnZhYmxlQXJyYXk8VD47XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBvYnNlcnZhYmxlQXJyYXlcclxuICAgKiBAcGFyYW0gW3Byb3ZpZGVkT3B0aW9uc10gLSBzYW1lIGFzIHRoZSBvcHRpb25zIHRvIHRoZSBwYXJlbnQgT2JzZXJ2YWJsZUFycmF5RGVmXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBvYnNlcnZhYmxlQXJyYXk6IE9ic2VydmFibGVBcnJheTxUPiwgcHJvdmlkZWRPcHRpb25zPzogT2JzZXJ2YWJsZUFycmF5T3B0aW9uczxUPiApIHtcclxuXHJcbiAgICBzdXBlciggcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy5vYnNlcnZhYmxlQXJyYXkgPSBvYnNlcnZhYmxlQXJyYXk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBNZXRob2RzIHNoYXJlZCBieSBhbGwgT2JzZXJ2YWJsZUFycmF5RGVmIGluc3RhbmNlc1xyXG5jb25zdCBtZXRob2RzOiBUaGlzVHlwZTxQcml2YXRlT2JzZXJ2YWJsZUFycmF5PHVua25vd24+PiA9IHtcclxuXHJcbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAqIE92ZXJyaWRkZW4gQXJyYXkgbWV0aG9kc1xyXG4gICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuICBwb3AoIC4uLmFyZ3M6IGFueVtdICk6IGFueSB7XHJcbiAgICBjb25zdCB0aGlzQXJyYXkgPSB0aGlzIGFzIFByaXZhdGVPYnNlcnZhYmxlQXJyYXk8YW55PjtcclxuXHJcbiAgICBjb25zdCBpbml0aWFsTGVuZ3RoID0gdGhpc0FycmF5LnRhcmdldEFycmF5Lmxlbmd0aDtcclxuICAgIGNvbnN0IHJldHVyblZhbHVlID0gQXJyYXkucHJvdG90eXBlLnBvcC5hcHBseSggdGhpc0FycmF5LnRhcmdldEFycmF5LCBhcmdzIGFzIGFueSApO1xyXG4gICAgdGhpc0FycmF5Lmxlbmd0aFByb3BlcnR5LnZhbHVlID0gdGhpc0FycmF5Lmxlbmd0aDtcclxuICAgIGluaXRpYWxMZW5ndGggPiAwICYmIHRoaXNBcnJheS5lbWl0Tm90aWZpY2F0aW9uKCB0aGlzQXJyYXkuZWxlbWVudFJlbW92ZWRFbWl0dGVyLCByZXR1cm5WYWx1ZSApO1xyXG4gICAgcmV0dXJuIHJldHVyblZhbHVlO1xyXG4gIH0sXHJcblxyXG4gIHNoaWZ0KCAuLi5hcmdzOiBhbnlbXSApOiBhbnkge1xyXG4gICAgY29uc3QgdGhpc0FycmF5ID0gdGhpcyBhcyBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PGFueT47XHJcblxyXG4gICAgY29uc3QgaW5pdGlhbExlbmd0aCA9IHRoaXNBcnJheS50YXJnZXRBcnJheS5sZW5ndGg7XHJcbiAgICBjb25zdCByZXR1cm5WYWx1ZSA9IEFycmF5LnByb3RvdHlwZS5zaGlmdC5hcHBseSggdGhpc0FycmF5LnRhcmdldEFycmF5LCBhcmdzIGFzIGFueSApO1xyXG4gICAgdGhpc0FycmF5Lmxlbmd0aFByb3BlcnR5LnZhbHVlID0gdGhpc0FycmF5Lmxlbmd0aDtcclxuICAgIGluaXRpYWxMZW5ndGggPiAwICYmIHRoaXNBcnJheS5lbWl0Tm90aWZpY2F0aW9uKCB0aGlzQXJyYXkuZWxlbWVudFJlbW92ZWRFbWl0dGVyLCByZXR1cm5WYWx1ZSApO1xyXG4gICAgcmV0dXJuIHJldHVyblZhbHVlO1xyXG4gIH0sXHJcblxyXG4gIHB1c2goIC4uLmFyZ3M6IGFueVtdICk6IGFueSB7XHJcbiAgICBjb25zdCB0aGlzQXJyYXkgPSB0aGlzIGFzIFByaXZhdGVPYnNlcnZhYmxlQXJyYXk8YW55PjtcclxuXHJcbiAgICBjb25zdCByZXR1cm5WYWx1ZSA9IEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KCB0aGlzQXJyYXkudGFyZ2V0QXJyYXksIGFyZ3MgKTtcclxuICAgIHRoaXNBcnJheS5sZW5ndGhQcm9wZXJ0eS52YWx1ZSA9IHRoaXNBcnJheS5sZW5ndGg7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIHRoaXNBcnJheS5lbWl0Tm90aWZpY2F0aW9uKCB0aGlzQXJyYXkuZWxlbWVudEFkZGVkRW1pdHRlciwgYXJnc1sgaSBdICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmV0dXJuVmFsdWU7XHJcbiAgfSxcclxuXHJcbiAgdW5zaGlmdCggLi4uYXJnczogYW55W10gKTogYW55IHtcclxuICAgIGNvbnN0IHRoaXNBcnJheSA9IHRoaXMgYXMgUHJpdmF0ZU9ic2VydmFibGVBcnJheTxhbnk+O1xyXG5cclxuICAgIGNvbnN0IHJldHVyblZhbHVlID0gQXJyYXkucHJvdG90eXBlLnVuc2hpZnQuYXBwbHkoIHRoaXNBcnJheS50YXJnZXRBcnJheSwgYXJncyApO1xyXG4gICAgdGhpc0FycmF5Lmxlbmd0aFByb3BlcnR5LnZhbHVlID0gdGhpc0FycmF5Lmxlbmd0aDtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIHRoaXNBcnJheS5lbWl0Tm90aWZpY2F0aW9uKCB0aGlzQXJyYXkuZWxlbWVudEFkZGVkRW1pdHRlciwgYXJnc1sgaSBdICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmV0dXJuVmFsdWU7XHJcbiAgfSxcclxuXHJcbiAgc3BsaWNlKCAuLi5hcmdzOiBhbnlbXSApOiBhbnkge1xyXG4gICAgY29uc3QgdGhpc0FycmF5ID0gdGhpcyBhcyBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PGFueT47XHJcblxyXG4gICAgY29uc3QgcmV0dXJuVmFsdWUgPSBBcnJheS5wcm90b3R5cGUuc3BsaWNlLmFwcGx5KCB0aGlzQXJyYXkudGFyZ2V0QXJyYXksIGFyZ3MgYXMgYW55ICk7XHJcbiAgICB0aGlzQXJyYXkubGVuZ3RoUHJvcGVydHkudmFsdWUgPSB0aGlzQXJyYXkubGVuZ3RoO1xyXG4gICAgY29uc3QgZGVsZXRlZEVsZW1lbnRzID0gcmV0dXJuVmFsdWU7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDI7IGkgPCBhcmdzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICB0aGlzQXJyYXkuZW1pdE5vdGlmaWNhdGlvbiggdGhpc0FycmF5LmVsZW1lbnRBZGRlZEVtaXR0ZXIsIGFyZ3NbIGkgXSApO1xyXG4gICAgfVxyXG4gICAgZGVsZXRlZEVsZW1lbnRzLmZvckVhY2goIGRlbGV0ZWRFbGVtZW50ID0+IHRoaXNBcnJheS5lbWl0Tm90aWZpY2F0aW9uKCB0aGlzQXJyYXkuZWxlbWVudFJlbW92ZWRFbWl0dGVyLCBkZWxldGVkRWxlbWVudCApICk7XHJcbiAgICByZXR1cm4gcmV0dXJuVmFsdWU7XHJcbiAgfSxcclxuXHJcbiAgY29weVdpdGhpbiggLi4uYXJnczogYW55W10gKTogYW55IHtcclxuICAgIGNvbnN0IHRoaXNBcnJheSA9IHRoaXMgYXMgUHJpdmF0ZU9ic2VydmFibGVBcnJheTxhbnk+O1xyXG5cclxuICAgIGNvbnN0IGJlZm9yZSA9IHRoaXNBcnJheS50YXJnZXRBcnJheS5zbGljZSgpO1xyXG4gICAgY29uc3QgcmV0dXJuVmFsdWUgPSBBcnJheS5wcm90b3R5cGUuY29weVdpdGhpbi5hcHBseSggdGhpc0FycmF5LnRhcmdldEFycmF5LCBhcmdzIGFzIGFueSApO1xyXG4gICAgcmVwb3J0RGlmZmVyZW5jZSggYmVmb3JlLCB0aGlzQXJyYXkgKTtcclxuICAgIHJldHVybiByZXR1cm5WYWx1ZTtcclxuICB9LFxyXG5cclxuICBmaWxsKCAuLi5hcmdzOiBhbnlbXSApOiBhbnkge1xyXG4gICAgY29uc3QgdGhpc0FycmF5ID0gdGhpcyBhcyBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PGFueT47XHJcblxyXG4gICAgY29uc3QgYmVmb3JlID0gdGhpc0FycmF5LnRhcmdldEFycmF5LnNsaWNlKCk7XHJcbiAgICBjb25zdCByZXR1cm5WYWx1ZSA9IEFycmF5LnByb3RvdHlwZS5maWxsLmFwcGx5KCB0aGlzQXJyYXkudGFyZ2V0QXJyYXksIGFyZ3MgYXMgYW55ICk7XHJcbiAgICByZXBvcnREaWZmZXJlbmNlKCBiZWZvcmUsIHRoaXNBcnJheSApO1xyXG4gICAgcmV0dXJuIHJldHVyblZhbHVlO1xyXG4gIH0sXHJcblxyXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgKiBGb3IgY29tcGF0aWJpbGl0eSB3aXRoIE9ic2VydmFibGVBcnJheURlZlxyXG4gICAqIFRPRE8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2F4b24vaXNzdWVzLzMzNCBjb25zaWRlciBkZWxldGluZyBhZnRlciBtaWdyYXRpb25cclxuICAgKiBUT0RPIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9heG9uL2lzc3Vlcy8zMzQgaWYgbm90IGRlbGV0ZWQsIHJlbmFtZSAnSXRlbScgd2l0aCAnRWxlbWVudCdcclxuICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuICBnZXQ6IGZ1bmN0aW9uKCBpbmRleDogbnVtYmVyICkgeyByZXR1cm4gdGhpc1sgaW5kZXggXTsgfSxcclxuICBhZGRJdGVtQWRkZWRMaXN0ZW5lcjogZnVuY3Rpb24oIGxpc3RlbmVyOiBPYnNlcnZhYmxlQXJyYXlMaXN0ZW5lcjxhbnk+ICkgeyB0aGlzLmVsZW1lbnRBZGRlZEVtaXR0ZXIuYWRkTGlzdGVuZXIoIGxpc3RlbmVyICk7IH0sXHJcbiAgcmVtb3ZlSXRlbUFkZGVkTGlzdGVuZXI6IGZ1bmN0aW9uKCBsaXN0ZW5lcjogT2JzZXJ2YWJsZUFycmF5TGlzdGVuZXI8YW55PiApIHsgdGhpcy5lbGVtZW50QWRkZWRFbWl0dGVyLnJlbW92ZUxpc3RlbmVyKCBsaXN0ZW5lciApOyB9LFxyXG4gIGFkZEl0ZW1SZW1vdmVkTGlzdGVuZXI6IGZ1bmN0aW9uKCBsaXN0ZW5lcjogT2JzZXJ2YWJsZUFycmF5TGlzdGVuZXI8YW55PiApIHsgdGhpcy5lbGVtZW50UmVtb3ZlZEVtaXR0ZXIuYWRkTGlzdGVuZXIoIGxpc3RlbmVyICk7IH0sXHJcbiAgcmVtb3ZlSXRlbVJlbW92ZWRMaXN0ZW5lcjogZnVuY3Rpb24oIGxpc3RlbmVyOiBPYnNlcnZhYmxlQXJyYXlMaXN0ZW5lcjxhbnk+ICkgeyB0aGlzLmVsZW1lbnRSZW1vdmVkRW1pdHRlci5yZW1vdmVMaXN0ZW5lciggbGlzdGVuZXIgKTsgfSxcclxuICBhZGQ6IGZ1bmN0aW9uKCBlbGVtZW50OiBhbnkgKSB7IHRoaXMucHVzaCggZWxlbWVudCApOyB9LFxyXG4gIGFkZEFsbDogZnVuY3Rpb24oIGVsZW1lbnRzOiBhbnlbXSApIHsgdGhpcy5wdXNoKCAuLi5lbGVtZW50cyApOyB9LFxyXG4gIHJlbW92ZTogZnVuY3Rpb24oIGVsZW1lbnQ6IGFueSApIHsgYXJyYXlSZW1vdmUoIHRoaXMsIGVsZW1lbnQgKTsgfSxcclxuICByZW1vdmVBbGw6IGZ1bmN0aW9uKCBlbGVtZW50czogYW55W10gKSB7XHJcbiAgICBlbGVtZW50cy5mb3JFYWNoKCBlbGVtZW50ID0+IGFycmF5UmVtb3ZlKCB0aGlzLCBlbGVtZW50ICkgKTtcclxuICB9LFxyXG4gIGNsZWFyOiBmdW5jdGlvbigpIHtcclxuICAgIHdoaWxlICggdGhpcy5sZW5ndGggPiAwICkge1xyXG4gICAgICB0aGlzLnBvcCgpO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgY291bnQ6IGZ1bmN0aW9uKCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxhbnk+ICkge1xyXG4gICAgbGV0IGNvdW50ID0gMDtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGlmICggcHJlZGljYXRlKCB0aGlzWyBpIF0gKSApIHtcclxuICAgICAgICBjb3VudCsrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY291bnQ7XHJcbiAgfSxcclxuICBmaW5kOiBmdW5jdGlvbiggcHJlZGljYXRlOiBQcmVkaWNhdGU8YW55PiwgZnJvbUluZGV4PzogbnVtYmVyICkge1xyXG4gICAgYXNzZXJ0ICYmICggZnJvbUluZGV4ICE9PSB1bmRlZmluZWQgKSAmJiBhc3NlcnQoIHR5cGVvZiBmcm9tSW5kZXggPT09ICdudW1iZXInLCAnZnJvbUluZGV4IG11c3QgYmUgbnVtZXJpYywgaWYgcHJvdmlkZWQnICk7XHJcbiAgICBhc3NlcnQgJiYgKCB0eXBlb2YgZnJvbUluZGV4ID09PSAnbnVtYmVyJyApICYmIGFzc2VydCggZnJvbUluZGV4ID49IDAgJiYgZnJvbUluZGV4IDwgdGhpcy5sZW5ndGgsXHJcbiAgICAgIGBmcm9tSW5kZXggb3V0IG9mIGJvdW5kczogJHtmcm9tSW5kZXh9YCApO1xyXG4gICAgcmV0dXJuIF8uZmluZCggdGhpcywgcHJlZGljYXRlLCBmcm9tSW5kZXggKTtcclxuICB9LFxyXG4gIHNodWZmbGU6IGZ1bmN0aW9uKCByYW5kb206IEZha2VSYW5kb208YW55PiApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHJhbmRvbSwgJ3JhbmRvbSBtdXN0IGJlIHN1cHBsaWVkJyApO1xyXG5cclxuICAgIC8vIHByZXNlcnZlIHRoZSBzYW1lIF9hcnJheSByZWZlcmVuY2UgaW4gY2FzZSBhbnkgY2xpZW50cyBnb3QgYSByZWZlcmVuY2UgdG8gaXQgd2l0aCBnZXRBcnJheSgpXHJcbiAgICBjb25zdCBzaHVmZmxlZCA9IHJhbmRvbS5zaHVmZmxlKCB0aGlzICk7XHJcblxyXG4gICAgLy8gQWN0IG9uIHRoZSB0YXJnZXRBcnJheSBzbyB0aGF0IHJlbW92YWwgYW5kIGFkZCBub3RpZmljYXRpb25zIGFyZW4ndCBzZW50LlxyXG4gICAgdGhpcy50YXJnZXRBcnJheS5sZW5ndGggPSAwO1xyXG4gICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoIHRoaXMudGFyZ2V0QXJyYXksIHNodWZmbGVkICk7XHJcbiAgfSxcclxuXHJcbiAgLy8gVE9ETyBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYXhvbi9pc3N1ZXMvMzM0IFRoaXMgYWxzbyBzZWVtcyBpbXBvcnRhbnQgdG8gZWxpbWluYXRlXHJcbiAgZ2V0QXJyYXlDb3B5OiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuc2xpY2UoKTsgfSxcclxuXHJcbiAgZGlzcG9zZTogZnVuY3Rpb24oKSB7XHJcbiAgICBjb25zdCB0aGlzQXJyYXkgPSB0aGlzIGFzIFByaXZhdGVPYnNlcnZhYmxlQXJyYXk8YW55PjtcclxuICAgIHRoaXNBcnJheS5lbGVtZW50QWRkZWRFbWl0dGVyLmRpc3Bvc2UoKTtcclxuICAgIHRoaXNBcnJheS5lbGVtZW50UmVtb3ZlZEVtaXR0ZXIuZGlzcG9zZSgpO1xyXG4gICAgdGhpc0FycmF5Lmxlbmd0aFByb3BlcnR5LmRpc3Bvc2UoKTtcclxuICAgIHRoaXNBcnJheS5fb2JzZXJ2YWJsZUFycmF5UGhldGlvT2JqZWN0ICYmIHRoaXNBcnJheS5fb2JzZXJ2YWJsZUFycmF5UGhldGlvT2JqZWN0LmRpc3Bvc2UoKTtcclxuICB9LFxyXG5cclxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICogUGhFVC1pT1xyXG4gICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG4gIHRvU3RhdGVPYmplY3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHsgYXJyYXk6IHRoaXMubWFwKCBpdGVtID0+IHRoaXMucGhldGlvRWxlbWVudFR5cGUhLnRvU3RhdGVPYmplY3QoIGl0ZW0gKSApIH07XHJcbiAgfSxcclxuICBhcHBseVN0YXRlOiBmdW5jdGlvbiggc3RhdGVPYmplY3Q6IE9ic2VydmFibGVBcnJheVN0YXRlT2JqZWN0PGFueT4gKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmxlbmd0aCA9PT0gMCwgJ09ic2VydmFibGVBcnJheXMgc2hvdWxkIGJlIGNsZWFyZWQgYXQgdGhlIGJlZ2lubmluZyBvZiBzdGF0ZSBzZXR0aW5nLicgKTtcclxuICAgIHRoaXMubGVuZ3RoID0gMDtcclxuICAgIGNvbnN0IGVsZW1lbnRzID0gc3RhdGVPYmplY3QuYXJyYXkubWFwKCBwYXJhbVN0YXRlT2JqZWN0ID0+IHRoaXMucGhldGlvRWxlbWVudFR5cGUhLmZyb21TdGF0ZU9iamVjdCggcGFyYW1TdGF0ZU9iamVjdCApICk7XHJcbiAgICB0aGlzLnB1c2goIC4uLmVsZW1lbnRzICk7XHJcbiAgfSxcclxuICBzZXROb3RpZmljYXRpb25zRGVmZXJyZWQ6IGZ1bmN0aW9uKCBub3RpZmljYXRpb25zRGVmZXJyZWQ6IGJvb2xlYW4gKSB7XHJcblxyXG4gICAgLy8gSGFuZGxlIHRoZSBjYXNlIHdoZXJlIGEgbGlzdGVuZXIgY2F1c2VzIGFub3RoZXIgZWxlbWVudCB0byBiZSBhZGRlZC9yZW1vdmVkLiBUaGF0IG5ldyBhY3Rpb24gc2hvdWxkIG5vdGlmeSBsYXN0LlxyXG4gICAgaWYgKCAhbm90aWZpY2F0aW9uc0RlZmVycmVkICkge1xyXG4gICAgICB3aGlsZSAoIHRoaXMuZGVmZXJyZWRBY3Rpb25zLmxlbmd0aCA+IDAgKSB7XHJcbiAgICAgICAgdGhpcy5kZWZlcnJlZEFjdGlvbnMuc2hpZnQoKSEoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5ub3RpZmljYXRpb25zRGVmZXJyZWQgPSBub3RpZmljYXRpb25zRGVmZXJyZWQ7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZvciBjb3B5V2l0aGluIGFuZCBmaWxsLCB3aGljaCBoYXZlIG1vcmUgY29tcGxleCBiZWhhdmlvciwgd2UgdHJlYXQgdGhlIGFycmF5IGFzIGEgYmxhY2sgYm94LCBtYWtpbmcgYSBzaGFsbG93IGNvcHlcclxuICogYmVmb3JlIHRoZSBvcGVyYXRpb24gaW4gb3JkZXIgdG8gaWRlbnRpZnkgd2hhdCBoYXMgYmVlbiBhZGRlZCBhbmQgcmVtb3ZlZC5cclxuICovXHJcbmNvbnN0IHJlcG9ydERpZmZlcmVuY2UgPSAoIHNoYWxsb3dDb3B5OiBhbnlbXSwgb2JzZXJ2YWJsZUFycmF5OiBQcml2YXRlT2JzZXJ2YWJsZUFycmF5PGFueT4gKSA9PiB7XHJcblxyXG4gIGNvbnN0IGJlZm9yZSA9IHNoYWxsb3dDb3B5O1xyXG4gIGNvbnN0IGFmdGVyID0gb2JzZXJ2YWJsZUFycmF5LnRhcmdldEFycmF5LnNsaWNlKCk7XHJcblxyXG4gIGZvciAoIGxldCBpID0gMDsgaSA8IGJlZm9yZS5sZW5ndGg7IGkrKyApIHtcclxuICAgIGNvbnN0IGJlZm9yZUVsZW1lbnQgPSBiZWZvcmVbIGkgXTtcclxuICAgIGNvbnN0IGFmdGVySW5kZXggPSBhZnRlci5pbmRleE9mKCBiZWZvcmVFbGVtZW50ICk7XHJcbiAgICBpZiAoIGFmdGVySW5kZXggPj0gMCApIHtcclxuICAgICAgYmVmb3JlLnNwbGljZSggaSwgMSApO1xyXG4gICAgICBhZnRlci5zcGxpY2UoIGFmdGVySW5kZXgsIDEgKTtcclxuICAgICAgaS0tO1xyXG4gICAgfVxyXG4gIH1cclxuICBiZWZvcmUuZm9yRWFjaCggZWxlbWVudCA9PiBvYnNlcnZhYmxlQXJyYXkuZW1pdE5vdGlmaWNhdGlvbiggb2JzZXJ2YWJsZUFycmF5LmVsZW1lbnRSZW1vdmVkRW1pdHRlciwgZWxlbWVudCApICk7XHJcbiAgYWZ0ZXIuZm9yRWFjaCggZWxlbWVudCA9PiBvYnNlcnZhYmxlQXJyYXkuZW1pdE5vdGlmaWNhdGlvbiggb2JzZXJ2YWJsZUFycmF5LmVsZW1lbnRBZGRlZEVtaXR0ZXIsIGVsZW1lbnQgKSApO1xyXG59O1xyXG5cclxuLy8gQ2FjaGUgZWFjaCBwYXJhbWV0ZXJpemVkIE9ic2VydmFibGVBcnJheUlPXHJcbi8vIGJhc2VkIG9uIHRoZSBwYXJhbWV0ZXIgdHlwZSwgc28gdGhhdCBpdCBpcyBvbmx5IGNyZWF0ZWQgb25jZS5cclxuY29uc3QgY2FjaGUgPSBuZXcgSU9UeXBlQ2FjaGUoKTtcclxuXHJcblxyXG4vKipcclxuICogT2JzZXJ2YWJsZUFycmF5SU8gaXMgdGhlIElPVHlwZSBmb3IgT2JzZXJ2YWJsZUFycmF5RGVmLiBJdCBkZWxlZ2F0ZXMgbW9zdCBvZiBpdHMgaW1wbGVtZW50YXRpb24gdG8gT2JzZXJ2YWJsZUFycmF5RGVmLlxyXG4gKiBJbnN0ZWFkIG9mIGJlaW5nIGEgcGFyYW1ldHJpYyB0eXBlLCBpdCBsZXZlcmFnZXMgdGhlIHBoZXRpb0VsZW1lbnRUeXBlIG9uIE9ic2VydmFibGVBcnJheURlZi5cclxuICovXHJcbmNvbnN0IE9ic2VydmFibGVBcnJheUlPID0gKCBwYXJhbWV0ZXJUeXBlOiBJT1R5cGUgKTogSU9UeXBlID0+IHtcclxuICBpZiAoICFjYWNoZS5oYXMoIHBhcmFtZXRlclR5cGUgKSApIHtcclxuICAgIGNhY2hlLnNldCggcGFyYW1ldGVyVHlwZSwgbmV3IElPVHlwZSggYE9ic2VydmFibGVBcnJheUlPPCR7cGFyYW1ldGVyVHlwZS50eXBlTmFtZX0+YCwge1xyXG4gICAgICB2YWx1ZVR5cGU6IE9ic2VydmFibGVBcnJheVBoZXRpb09iamVjdCxcclxuICAgICAgcGFyYW1ldGVyVHlwZXM6IFsgcGFyYW1ldGVyVHlwZSBdLFxyXG4gICAgICB0b1N0YXRlT2JqZWN0OiAoIG9ic2VydmFibGVBcnJheVBoZXRpb09iamVjdDogT2JzZXJ2YWJsZUFycmF5UGhldGlvT2JqZWN0PGFueT4gKSA9PiBvYnNlcnZhYmxlQXJyYXlQaGV0aW9PYmplY3Qub2JzZXJ2YWJsZUFycmF5LnRvU3RhdGVPYmplY3QoKSxcclxuICAgICAgYXBwbHlTdGF0ZTogKCBvYnNlcnZhYmxlQXJyYXlQaGV0aW9PYmplY3Q6IE9ic2VydmFibGVBcnJheVBoZXRpb09iamVjdDxhbnk+LCBzdGF0ZTogT2JzZXJ2YWJsZUFycmF5U3RhdGVPYmplY3Q8YW55PiApID0+IG9ic2VydmFibGVBcnJheVBoZXRpb09iamVjdC5vYnNlcnZhYmxlQXJyYXkuYXBwbHlTdGF0ZSggc3RhdGUgKSxcclxuICAgICAgc3RhdGVTY2hlbWE6IHtcclxuICAgICAgICBhcnJheTogQXJyYXlJTyggcGFyYW1ldGVyVHlwZSApXHJcbiAgICAgIH1cclxuICAgIH0gKSApO1xyXG4gIH1cclxuICByZXR1cm4gY2FjaGUuZ2V0KCBwYXJhbWV0ZXJUeXBlICkhO1xyXG59O1xyXG5cclxuY3JlYXRlT2JzZXJ2YWJsZUFycmF5Lk9ic2VydmFibGVBcnJheUlPID0gT2JzZXJ2YWJsZUFycmF5SU87XHJcblxyXG5heG9uLnJlZ2lzdGVyKCAnY3JlYXRlT2JzZXJ2YWJsZUFycmF5JywgY3JlYXRlT2JzZXJ2YWJsZUFycmF5ICk7XHJcbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZU9ic2VydmFibGVBcnJheTtcclxuZXhwb3J0IHsgT2JzZXJ2YWJsZUFycmF5SU8gfTtcclxuZXhwb3J0IHR5cGUgeyBPYnNlcnZhYmxlQXJyYXkgfTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxXQUFXLE1BQU0sbUNBQW1DO0FBRTNELE9BQU9DLDhCQUE4QixNQUFNLHNEQUFzRDtBQUNqRyxPQUFPQyxLQUFLLE1BQU0sNkJBQTZCO0FBQy9DLE9BQU9DLFNBQVMsSUFBSUMsY0FBYyxRQUFRLGlDQUFpQztBQUMzRSxPQUFPQyxZQUFZLE1BQStCLGlDQUFpQztBQUNuRixPQUFPQyxPQUFPLE1BQU0sa0NBQWtDO0FBQ3RELE9BQU9DLE1BQU0sTUFBTSxpQ0FBaUM7QUFDcEQsT0FBT0MsSUFBSSxNQUFNLFdBQVc7QUFDNUIsT0FBT0MsT0FBTyxNQUEwQixjQUFjO0FBQ3RELE9BQU9DLGNBQWMsTUFBaUMscUJBQXFCO0FBQzNFLE9BQU9DLFVBQVUsTUFBTSxpQkFBaUI7QUFFeEMsT0FBT0MsNEJBQTRCLE1BQU0saURBQWlEO0FBQzFGLE9BQU9DLFdBQVcsTUFBTSxnQ0FBZ0M7QUFDeEQsT0FBT0MsTUFBTSxNQUFNLDJCQUEyQjs7QUFHOUM7O0FBR3VEO0FBQ0E7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