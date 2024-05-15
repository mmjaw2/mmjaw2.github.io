// Copyright 2013-2024, University of Colorado Boulder
/**
 * An observable property which notifies listeners when the value changes.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import PhetioObject from '../../tandem/js/PhetioObject.js';
import Tandem, { DYNAMIC_ARCHETYPE_NAME } from '../../tandem/js/Tandem.js';
import ArrayIO from '../../tandem/js/types/ArrayIO.js';
import FunctionIO from '../../tandem/js/types/FunctionIO.js';
import IOType from '../../tandem/js/types/IOType.js';
import NullableIO from '../../tandem/js/types/NullableIO.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import VoidIO from '../../tandem/js/types/VoidIO.js';
import propertyStateHandlerSingleton from './propertyStateHandlerSingleton.js';
import PropertyStatePhase from './PropertyStatePhase.js';
import TinyProperty from './TinyProperty.js';
import units from './units.js';
import validate from './validate.js';
import optionize from '../../phet-core/js/optionize.js';
import Validation from './Validation.js';
import axon from './axon.js';
import isClearingPhetioDynamicElementsProperty from '../../tandem/js/isClearingPhetioDynamicElementsProperty.js';
import isPhetioStateEngineManagingPropertyValuesProperty from '../../tandem/js/isPhetioStateEngineManagingPropertyValuesProperty.js';
import IOTypeCache from '../../tandem/js/IOTypeCache.js';
// constants
const VALIDATE_OPTIONS_FALSE = {
  validateValidator: false
};

// variables
let globalId = 0; // auto-incremented for unique IDs

// Cache each parameterized PropertyIO based on the parameter type, so that it is only created once
const cache = new IOTypeCache();

// Options defined by Property

// Options that can be passed in

// When changing the listener order via ?listenerOrder, we were running into strictAxonDependencies failures that
// did not otherwise occur. Because we aren't interested in these corner cases, and because they are difficult to
// understand and debug, we chose to turn off strictAxonDependencies if listener order is changed.
// See https://github.com/phetsims/faradays-electromagnetic-lab/issues/57#issuecomment-1909089735
const strictAxonDependencies = _.hasIn(window, 'phet.chipper.queryParameters') && phet.chipper.queryParameters.strictAxonDependencies && phet.chipper.queryParameters.listenerOrder === 'default';
export const derivationStack = [];

/**
 * Base class for Property, DerivedProperty, DynamicProperty.  Set methods are protected/not part of the public
 * interface.  Initial value and resetting is not defined here.
 */
export default class ReadOnlyProperty extends PhetioObject {
  // Unique identifier for this Property.

  // (phet-io) Units, if any.  See units.js for valid values

  // emit is called when the value changes (or on link)

  // whether we are in the process of notifying listeners; changed in some Property test files with @ts-expect-error

  // whether to allow reentry of calls to set

  // while deferred, new values neither take effect nor send notifications.  When isDeferred changes from
  // true to false, the final deferred value becomes the Property value.  An action is created which can be invoked to
  // send notifications.

  // the value that this Property will take after no longer deferred

  // whether a deferred value has been set

  /**
   * This is protected to indicate to clients that subclasses should be used instead.
   * @param value - the initial value of the property
   * @param [providedOptions]
   */
  constructor(value, providedOptions) {
    const options = optionize()({
      units: null,
      reentrant: false,
      hasListenerOrderDependencies: false,
      reentrantNotificationStrategy: 'queue',
      // See Validation.ts for ValueComparisonStrategy for available values. Please note that this will be used for
      // equality comparison both with validation (i.e. for validValue comparison), as well as determining if the
      // value has changed such that listeners should fire, see TinyProperty.areValuesEqual().
      valueComparisonStrategy: 'reference',
      // phet-io
      tandemNameSuffix: ['Property', DYNAMIC_ARCHETYPE_NAME],
      // DYNAMIC_ARCHETYPE_NAME means that this Property is an archetype.
      phetioOuterType: ReadOnlyProperty.PropertyIO,
      phetioValueType: IOType.ObjectIO
    }, providedOptions);
    assert && options.units && assert(units.isValidUnits(options.units), `invalid units: ${options.units}`);
    if (options.units) {
      options.phetioEventMetadata = options.phetioEventMetadata || {};
      assert && assert(!options.phetioEventMetadata.hasOwnProperty('units'), 'units should be supplied by Property, not elsewhere');
      options.phetioEventMetadata.units = options.units;
    }
    if (assert && providedOptions) {
      // @ts-expect-error -- for checking JS code
      assert && assert(!providedOptions.phetioType, 'Set phetioType via phetioValueType');
    }

    // Construct the IOType
    if (options.phetioOuterType && options.phetioValueType) {
      options.phetioType = options.phetioOuterType(options.phetioValueType);
    }

    // Support non-validated Property
    if (!Validation.containsValidatorKey(options)) {
      options.isValidValue = () => true;
    }
    super(options);
    this.id = globalId++;
    this.units = options.units;

    // When running as phet-io, if the tandem is specified, the type must be specified.
    if (this.isPhetioInstrumented()) {
      // This assertion helps in instrumenting code that has the tandem but not type
      assert && Tandem.VALIDATION && assert(this.phetioType, `phetioType passed to Property must be specified. Tandem.phetioID: ${this.tandem.phetioID}`);
      assert && Tandem.VALIDATION && assert(options.phetioType.parameterTypes[0], `phetioType parameter type must be specified (only one). Tandem.phetioID: ${this.tandem.phetioID}`);
      assert && assert(options.phetioValueType !== IOType.ObjectIO, 'PhET-iO Properties must specify a phetioValueType: ' + this.phetioID);
    }
    this.validValues = options.validValues;
    this.tinyProperty = new TinyProperty(value, null, options.hasListenerOrderDependencies, options.reentrantNotificationStrategy);

    // Since we are already in the heavyweight Property, we always assign TinyProperty.valueComparisonStrategy for clarity.
    this.tinyProperty.valueComparisonStrategy = options.valueComparisonStrategy;
    this.notifying = false;
    this.reentrant = options.reentrant;
    this.isDeferred = false;
    this.deferredValue = null;
    this.hasDeferredValue = false;
    this.valueValidator = _.pick(options, Validation.VALIDATOR_KEYS);
    this.valueValidator.validationMessage = this.valueValidator.validationMessage || 'Property value not valid';
    if (this.valueValidator.phetioType) {
      // Validate the value type's phetioType of the Property, not the PropertyIO itself.
      // For example, for PropertyIO( BooleanIO ), assign this valueValidator's phetioType to be BooleanIO's validator.
      assert && assert(!!this.valueValidator.phetioType.parameterTypes[0], 'unexpected number of parameters for Property');

      // This is the validator for the value, not for the Property itself
      this.valueValidator.phetioType = this.valueValidator.phetioType.parameterTypes[0];
    }

    // Assertions regarding value validation
    if (assert) {
      Validation.validateValidator(this.valueValidator);

      // validate the initial value as well as any changes in the future
      validate(value, this.valueValidator, VALIDATE_OPTIONS_FALSE);
    }
  }

  /**
   * Returns true if the value can be set externally, using .value= or set()
   */
  isSettable() {
    return false;
  }

  /**
   * Gets the value.
   * You can also use the es5 getter (property.value) but this means is provided for inner loops
   * or internal code that must be fast.
   */
  get() {
    if (assert && strictAxonDependencies && derivationStack.length > 0) {
      const currentDependencies = derivationStack[derivationStack.length - 1];
      if (!currentDependencies.includes(this)) {
        assert && assert(false, 'accessed value outside of dependency tracking');
      }
    }
    return this.tinyProperty.get();
  }

  /**
   * Sets the value and notifies listeners, unless deferred or disposed. You can also use the es5 getter
   * (property.value) but this means is provided for inner loops or internal code that must be fast. If the value
   * hasn't changed, this is a no-op.
   *
   * NOTE: For PhET-iO instrumented Properties that are phetioState: true, the value is only
   * set by the PhetioStateEngine and cannot be modified by other code while isSettingPhetioStateProperty === true.
   */
  set(value) {
    // State is managed by the PhetioStateEngine, see https://github.com/phetsims/axon/issues/409
    const setManagedByPhetioState = isPhetioStateEngineManagingPropertyValuesProperty.value &&
    // We still want to set Properties when clearing dynamic elements, see https://github.com/phetsims/phet-io/issues/1906
    !isClearingPhetioDynamicElementsProperty.value && this.isPhetioInstrumented() && this.phetioState &&
    // However, DerivedProperty should be able to update during PhET-iO state set
    this.isSettable();
    if (!setManagedByPhetioState) {
      this.unguardedSet(value);
    } else {
      // Uncomment while implementing PhET-iO State for your simulation to see what value-setting is being silently ignored.
      // console.warn( `Ignoring attempt to ReadOnlyProperty.set(): ${this.phetioID}` );
    }
  }

  /**
   * For usage by the IOType during PhET-iO state setting.
   */
  unguardedSet(value) {
    if (!this.isDisposed) {
      if (this.isDeferred) {
        this.deferredValue = value;
        this.hasDeferredValue = true;
      } else if (!this.equalsValue(value)) {
        const oldValue = this.get();
        this.setPropertyValue(value);
        this._notifyListeners(oldValue);
      }
    }
  }

  /**
   * Sets the value without notifying any listeners. This is a place to override if a subtype performs additional work
   * when setting the value.
   */
  setPropertyValue(value) {
    this.tinyProperty.setPropertyValue(value);
  }

  /**
   * Returns true if and only if the specified value equals the value of this property
   */
  equalsValue(value) {
    // Ideally, we would call the equalsValue in tinyProperty, but it is protected. Furthermore, it is nice to get
    // the assertions associated with ReadOnlyProperty.get().
    return this.areValuesEqual(value, this.get());
  }

  /**
   * Determine if the two values are equal, see TinyProperty.areValuesEqual().
   */
  areValuesEqual(a, b) {
    return this.tinyProperty.areValuesEqual(a, b);
  }

  /**
   * NOTE: a few sims are calling this even though they shouldn't
   */
  _notifyListeners(oldValue) {
    const newValue = this.get();

    // validate the before notifying listeners
    assert && validate(newValue, this.valueValidator, VALIDATE_OPTIONS_FALSE);

    // Although this is not the idiomatic pattern (since it is guarded in the phetioStartEvent), this function is
    // called so many times that it is worth the optimization for PhET brand.
    Tandem.PHET_IO_ENABLED && this.isPhetioInstrumented() && this.phetioStartEvent(ReadOnlyProperty.CHANGED_EVENT_NAME, {
      getData: () => {
        const parameterType = this.phetioType.parameterTypes[0];
        return {
          oldValue: NullableIO(parameterType).toStateObject(oldValue),
          newValue: parameterType.toStateObject(newValue)
        };
      }
    });

    // notify listeners, optionally detect loops where this Property is set again before this completes.
    assert && assert(!this.notifying || this.reentrant, `reentry detected, value=${newValue}, oldValue=${oldValue}`);
    this.notifying = true;
    this.tinyProperty.emit(newValue, oldValue, this); // cannot use tinyProperty.notifyListeners because it uses the wrong this
    this.notifying = false;
    Tandem.PHET_IO_ENABLED && this.isPhetioInstrumented() && this.phetioEndEvent();
  }

  /**
   * Use this method when mutating a value (not replacing with a new instance) and you want to send notifications about the change.
   * This is different from the normal axon strategy, but may be necessary to prevent memory allocations.
   * This method is unsafe for removing listeners because it assumes the listener list not modified, to save another allocation
   * Only provides the new reference as a callback (no oldvalue)
   * See https://github.com/phetsims/axon/issues/6
   */
  notifyListenersStatic() {
    this._notifyListeners(null);
  }

  /**
   * When deferred, set values do not take effect or send out notifications.  After defer ends, the Property takes
   * its deferred value (if any), and a follow-up action (return value) can be invoked to send out notifications
   * once other Properties have also taken their deferred values.
   *
   * @param isDeferred - whether the Property should be deferred or not
   * @returns - function to notify listeners after calling setDeferred(false),
   *          - null if isDeferred is true, or if the value is unchanged since calling setDeferred(true)
   */
  setDeferred(isDeferred) {
    assert && assert(!this.isDisposed, 'cannot defer Property if already disposed.');
    if (isDeferred) {
      assert && assert(!this.isDeferred, 'Property already deferred');
      this.isDeferred = true;
    } else {
      assert && assert(this.isDeferred, 'Property wasn\'t deferred');
      this.isDeferred = false;
      const oldValue = this.get();

      // Take the new value
      if (this.hasDeferredValue) {
        this.setPropertyValue(this.deferredValue);
        this.hasDeferredValue = false;
        this.deferredValue = null;
      }

      // If the value has changed, prepare to send out notifications (after all other Properties in this transaction
      // have their final values)
      if (!this.equalsValue(oldValue)) {
        return () => !this.isDisposed && this._notifyListeners(oldValue);
      }
    }

    // no action to signify change
    return null;
  }
  get value() {
    return this.get();
  }
  set value(newValue) {
    this.set(newValue);
  }

  /**
   * This function registers an order dependency between this Property and another. Basically this says that when
   * setting PhET-iO state, each dependency must take its final value before this Property fires its notifications.
   * See propertyStateHandlerSingleton.registerPhetioOrderDependency and https://github.com/phetsims/axon/issues/276 for more info.
   */
  addPhetioStateDependencies(dependencies) {
    assert && assert(Array.isArray(dependencies), 'Array expected');
    for (let i = 0; i < dependencies.length; i++) {
      const dependencyProperty = dependencies[i];

      // only if running in PhET-iO brand and both Properties are instrumenting
      if (dependencyProperty instanceof ReadOnlyProperty && dependencyProperty.isPhetioInstrumented() && this.isPhetioInstrumented()) {
        // The dependency should undefer (taking deferred value) before this Property notifies.
        propertyStateHandlerSingleton.registerPhetioOrderDependency(dependencyProperty, PropertyStatePhase.UNDEFER, this, PropertyStatePhase.NOTIFY);
      }
    }
  }

  /**
   * Adds listener and calls it immediately. If listener is already registered, this is a no-op. The initial
   * notification provides the current value for newValue and null for oldValue.
   *
   * @param listener - a function that takes a new value, old value, and this Property as arguments
   * @param [options]
   */
  link(listener, options) {
    if (options && options.phetioDependencies) {
      this.addPhetioStateDependencies(options.phetioDependencies);
    }
    this.tinyProperty.addListener(listener); // cannot use tinyProperty.link() because of wrong this
    listener(this.get(), null, this); // null should be used when an object is expected but unavailable
  }

  /**
   * Add a listener to the Property, without calling it back right away. This is used when you need to register a
   * listener without an immediate callback.
   */
  lazyLink(listener, options) {
    if (options && options.phetioDependencies) {
      this.addPhetioStateDependencies(options.phetioDependencies);
    }
    this.tinyProperty.lazyLink(listener);
  }

  /**
   * Removes a listener. If listener is not registered, this is a no-op.
   */
  unlink(listener) {
    this.tinyProperty.unlink(listener);
  }

  /**
   * Removes all listeners. If no listeners are registered, this is a no-op.
   */
  unlinkAll() {
    this.tinyProperty.unlinkAll();
  }

  /**
   * Links an object's named attribute to this property.  Returns a handle so it can be removed using Property.unlink();
   * Example: modelVisibleProperty.linkAttribute(view,'visible');
   *
   * NOTE: Duplicated with TinyProperty.linkAttribute
   */
  linkAttribute(object, attributeName) {
    const handle = value => {
      object[attributeName] = value;
    };
    this.link(handle);
    return handle;
  }

  /**
   * Provide toString for console debugging, see http://stackoverflow.com/questions/2485632/valueof-vs-tostring-in-javascript
   */
  toString() {
    return `Property#${this.id}{${this.get()}}`;
  }

  /**
   * Convenience function for debugging a Property's value. It prints the new value on registration and when changed.
   * @param name - debug name to be printed on the console
   * @returns - the handle to the linked listener in case it needs to be removed later
   */
  debug(name) {
    const listener = value => console.log(name, value);
    this.link(listener);
    return listener;
  }
  isValueValid(value) {
    return this.getValidationError(value) === null;
  }
  getValidationError(value) {
    return Validation.getValidationError(value, this.valueValidator, VALIDATE_OPTIONS_FALSE);
  }

  // Ensures that the Property is eligible for GC
  dispose() {
    // unregister any order dependencies for this Property for PhET-iO state
    if (this.isPhetioInstrumented()) {
      propertyStateHandlerSingleton.unregisterOrderDependenciesForProperty(this);
    }
    super.dispose();
    this.tinyProperty.dispose();
  }

  /**
   * Checks whether a listener is registered with this Property
   */
  hasListener(listener) {
    return this.tinyProperty.hasListener(listener);
  }

  /**
   * Returns the number of listeners.
   */
  getListenerCount() {
    return this.tinyProperty.getListenerCount();
  }

  /**
   * Invokes a callback once for each listener
   * @param callback - takes the listener as an argument
   */
  forEachListener(callback) {
    this.tinyProperty.forEachListener(callback);
  }

  /**
   * Returns true if there are any listeners.
   */
  hasListeners() {
    assert && assert(arguments.length === 0, 'Property.hasListeners should be called without arguments');
    return this.tinyProperty.hasListeners();
  }
  get valueComparisonStrategy() {
    return this.tinyProperty.valueComparisonStrategy;
  }
  set valueComparisonStrategy(valueComparisonStrategy) {
    this.tinyProperty.valueComparisonStrategy = valueComparisonStrategy;
  }

  /**
   * An observable Property that triggers notifications when the value changes.
   * This caching implementation should be kept in sync with the other parametric IOType caching implementations.
   */
  static PropertyIO(parameterType) {
    assert && assert(parameterType, 'PropertyIO needs parameterType');
    if (!cache.has(parameterType)) {
      cache.set(parameterType, new IOType(`PropertyIO<${parameterType.typeName}>`, {
        // We want PropertyIO to work for DynamicProperty and DerivedProperty, but they extend ReadOnlyProperty
        valueType: ReadOnlyProperty,
        documentation: 'Observable values that send out notifications when the value changes. This differs from the ' + 'traditional listener pattern in that added listeners also receive a callback with the current value ' + 'when the listeners are registered. This is a widely-used pattern in PhET-iO simulations.',
        methodOrder: ['link', 'lazyLink'],
        events: [ReadOnlyProperty.CHANGED_EVENT_NAME],
        parameterTypes: [parameterType],
        toStateObject: property => {
          assert && assert(parameterType.toStateObject, `toStateObject doesn't exist for ${parameterType.typeName}`);
          return {
            value: parameterType.toStateObject(property.value),
            validValues: NullableIO(ArrayIO(parameterType)).toStateObject(property.validValues === undefined ? null : property.validValues),
            units: NullableIO(StringIO).toStateObject(property.units)
          };
        },
        applyState: (property, stateObject) => {
          const units = NullableIO(StringIO).fromStateObject(stateObject.units);
          assert && assert(property.units === units, 'Property units do not match');
          assert && assert(property.isSettable(), 'Property should be settable');
          property.unguardedSet(parameterType.fromStateObject(stateObject.value));
          if (stateObject.validValues) {
            property.validValues = stateObject.validValues.map(validValue => parameterType.fromStateObject(validValue));
          }
        },
        stateSchema: {
          value: parameterType,
          validValues: NullableIO(ArrayIO(parameterType)),
          units: NullableIO(StringIO)
        },
        methods: {
          getValue: {
            returnType: parameterType,
            parameterTypes: [],
            implementation: ReadOnlyProperty.prototype.get,
            documentation: 'Gets the current value.'
          },
          getValidationError: {
            returnType: NullableIO(StringIO),
            parameterTypes: [parameterType],
            implementation: ReadOnlyProperty.prototype.getValidationError,
            documentation: 'Checks to see if a proposed value is valid. Returns the first validation error, or null if the value is valid.'
          },
          setValue: {
            returnType: VoidIO,
            parameterTypes: [parameterType],
            implementation: function (value) {
              this.set(value);
            },
            documentation: 'Sets the value of the Property. If the value differs from the previous value, listeners are ' + 'notified with the new value.',
            invocableForReadOnlyElements: false
          },
          link: {
            returnType: VoidIO,
            // oldValue will start as "null" the first time called
            parameterTypes: [FunctionIO(VoidIO, [parameterType, NullableIO(parameterType)])],
            implementation: ReadOnlyProperty.prototype.link,
            documentation: 'Adds a listener which will be called when the value changes. On registration, the listener is ' + 'also called with the current value. The listener takes two arguments, the new value and the ' + 'previous value.'
          },
          lazyLink: {
            returnType: VoidIO,
            // oldValue will start as "null" the first time called
            parameterTypes: [FunctionIO(VoidIO, [parameterType, NullableIO(parameterType)])],
            implementation: ReadOnlyProperty.prototype.lazyLink,
            documentation: 'Adds a listener which will be called when the value changes. This method is like "link", but ' + 'without the current-value callback on registration. The listener takes two arguments, the new ' + 'value and the previous value.'
          },
          unlink: {
            returnType: VoidIO,
            parameterTypes: [FunctionIO(VoidIO, [parameterType])],
            implementation: ReadOnlyProperty.prototype.unlink,
            documentation: 'Removes a listener.'
          }
        }
      }));
    }
    return cache.get(parameterType);
  }

  /**
   * Support treating ourselves as an autoselectable entity for the "strings" selection mode.
   */
  getPhetioMouseHitTarget(fromLinking = false) {
    if (phet.tandem.phetioElementSelectionProperty.value === 'string') {
      // As of this writing, the only way to get to this function is for Properties that have a value of strings, but
      // in the future that may not be the case. SR and MK still think it is preferable to keep this general, as false
      // positives for autoselect are generally better than false negatives.
      return this.getPhetioMouseHitTargetSelf();
    }
    return super.getPhetioMouseHitTarget(fromLinking);
  }
  static CHANGED_EVENT_NAME = 'changed';
}
axon.register('ReadOnlyProperty', ReadOnlyProperty);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQaGV0aW9PYmplY3QiLCJUYW5kZW0iLCJEWU5BTUlDX0FSQ0hFVFlQRV9OQU1FIiwiQXJyYXlJTyIsIkZ1bmN0aW9uSU8iLCJJT1R5cGUiLCJOdWxsYWJsZUlPIiwiU3RyaW5nSU8iLCJWb2lkSU8iLCJwcm9wZXJ0eVN0YXRlSGFuZGxlclNpbmdsZXRvbiIsIlByb3BlcnR5U3RhdGVQaGFzZSIsIlRpbnlQcm9wZXJ0eSIsInVuaXRzIiwidmFsaWRhdGUiLCJvcHRpb25pemUiLCJWYWxpZGF0aW9uIiwiYXhvbiIsImlzQ2xlYXJpbmdQaGV0aW9EeW5hbWljRWxlbWVudHNQcm9wZXJ0eSIsImlzUGhldGlvU3RhdGVFbmdpbmVNYW5hZ2luZ1Byb3BlcnR5VmFsdWVzUHJvcGVydHkiLCJJT1R5cGVDYWNoZSIsIlZBTElEQVRFX09QVElPTlNfRkFMU0UiLCJ2YWxpZGF0ZVZhbGlkYXRvciIsImdsb2JhbElkIiwiY2FjaGUiLCJzdHJpY3RBeG9uRGVwZW5kZW5jaWVzIiwiXyIsImhhc0luIiwid2luZG93IiwicGhldCIsImNoaXBwZXIiLCJxdWVyeVBhcmFtZXRlcnMiLCJsaXN0ZW5lck9yZGVyIiwiZGVyaXZhdGlvblN0YWNrIiwiUmVhZE9ubHlQcm9wZXJ0eSIsImNvbnN0cnVjdG9yIiwidmFsdWUiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwicmVlbnRyYW50IiwiaGFzTGlzdGVuZXJPcmRlckRlcGVuZGVuY2llcyIsInJlZW50cmFudE5vdGlmaWNhdGlvblN0cmF0ZWd5IiwidmFsdWVDb21wYXJpc29uU3RyYXRlZ3kiLCJ0YW5kZW1OYW1lU3VmZml4IiwicGhldGlvT3V0ZXJUeXBlIiwiUHJvcGVydHlJTyIsInBoZXRpb1ZhbHVlVHlwZSIsIk9iamVjdElPIiwiYXNzZXJ0IiwiaXNWYWxpZFVuaXRzIiwicGhldGlvRXZlbnRNZXRhZGF0YSIsImhhc093blByb3BlcnR5IiwicGhldGlvVHlwZSIsImNvbnRhaW5zVmFsaWRhdG9yS2V5IiwiaXNWYWxpZFZhbHVlIiwiaWQiLCJpc1BoZXRpb0luc3RydW1lbnRlZCIsIlZBTElEQVRJT04iLCJ0YW5kZW0iLCJwaGV0aW9JRCIsInBhcmFtZXRlclR5cGVzIiwidmFsaWRWYWx1ZXMiLCJ0aW55UHJvcGVydHkiLCJub3RpZnlpbmciLCJpc0RlZmVycmVkIiwiZGVmZXJyZWRWYWx1ZSIsImhhc0RlZmVycmVkVmFsdWUiLCJ2YWx1ZVZhbGlkYXRvciIsInBpY2siLCJWQUxJREFUT1JfS0VZUyIsInZhbGlkYXRpb25NZXNzYWdlIiwiaXNTZXR0YWJsZSIsImdldCIsImxlbmd0aCIsImN1cnJlbnREZXBlbmRlbmNpZXMiLCJpbmNsdWRlcyIsInNldCIsInNldE1hbmFnZWRCeVBoZXRpb1N0YXRlIiwicGhldGlvU3RhdGUiLCJ1bmd1YXJkZWRTZXQiLCJpc0Rpc3Bvc2VkIiwiZXF1YWxzVmFsdWUiLCJvbGRWYWx1ZSIsInNldFByb3BlcnR5VmFsdWUiLCJfbm90aWZ5TGlzdGVuZXJzIiwiYXJlVmFsdWVzRXF1YWwiLCJhIiwiYiIsIm5ld1ZhbHVlIiwiUEhFVF9JT19FTkFCTEVEIiwicGhldGlvU3RhcnRFdmVudCIsIkNIQU5HRURfRVZFTlRfTkFNRSIsImdldERhdGEiLCJwYXJhbWV0ZXJUeXBlIiwidG9TdGF0ZU9iamVjdCIsImVtaXQiLCJwaGV0aW9FbmRFdmVudCIsIm5vdGlmeUxpc3RlbmVyc1N0YXRpYyIsInNldERlZmVycmVkIiwiYWRkUGhldGlvU3RhdGVEZXBlbmRlbmNpZXMiLCJkZXBlbmRlbmNpZXMiLCJBcnJheSIsImlzQXJyYXkiLCJpIiwiZGVwZW5kZW5jeVByb3BlcnR5IiwicmVnaXN0ZXJQaGV0aW9PcmRlckRlcGVuZGVuY3kiLCJVTkRFRkVSIiwiTk9USUZZIiwibGluayIsImxpc3RlbmVyIiwicGhldGlvRGVwZW5kZW5jaWVzIiwiYWRkTGlzdGVuZXIiLCJsYXp5TGluayIsInVubGluayIsInVubGlua0FsbCIsImxpbmtBdHRyaWJ1dGUiLCJvYmplY3QiLCJhdHRyaWJ1dGVOYW1lIiwiaGFuZGxlIiwidG9TdHJpbmciLCJkZWJ1ZyIsIm5hbWUiLCJjb25zb2xlIiwibG9nIiwiaXNWYWx1ZVZhbGlkIiwiZ2V0VmFsaWRhdGlvbkVycm9yIiwiZGlzcG9zZSIsInVucmVnaXN0ZXJPcmRlckRlcGVuZGVuY2llc0ZvclByb3BlcnR5IiwiaGFzTGlzdGVuZXIiLCJnZXRMaXN0ZW5lckNvdW50IiwiZm9yRWFjaExpc3RlbmVyIiwiY2FsbGJhY2siLCJoYXNMaXN0ZW5lcnMiLCJhcmd1bWVudHMiLCJoYXMiLCJ0eXBlTmFtZSIsInZhbHVlVHlwZSIsImRvY3VtZW50YXRpb24iLCJtZXRob2RPcmRlciIsImV2ZW50cyIsInByb3BlcnR5IiwidW5kZWZpbmVkIiwiYXBwbHlTdGF0ZSIsInN0YXRlT2JqZWN0IiwiZnJvbVN0YXRlT2JqZWN0IiwibWFwIiwidmFsaWRWYWx1ZSIsInN0YXRlU2NoZW1hIiwibWV0aG9kcyIsImdldFZhbHVlIiwicmV0dXJuVHlwZSIsImltcGxlbWVudGF0aW9uIiwicHJvdG90eXBlIiwic2V0VmFsdWUiLCJpbnZvY2FibGVGb3JSZWFkT25seUVsZW1lbnRzIiwiZ2V0UGhldGlvTW91c2VIaXRUYXJnZXQiLCJmcm9tTGlua2luZyIsInBoZXRpb0VsZW1lbnRTZWxlY3Rpb25Qcm9wZXJ0eSIsImdldFBoZXRpb01vdXNlSGl0VGFyZ2V0U2VsZiIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiUmVhZE9ubHlQcm9wZXJ0eS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxMy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuLyoqXHJcbiAqIEFuIG9ic2VydmFibGUgcHJvcGVydHkgd2hpY2ggbm90aWZpZXMgbGlzdGVuZXJzIHdoZW4gdGhlIHZhbHVlIGNoYW5nZXMuXHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgQ2hyaXMgTWFsbGV5IChQaXhlbFpvb20sIEluYy4pXHJcbiAqL1xyXG5cclxuaW1wb3J0IFBoZXRpb09iamVjdCwgeyBQaGV0aW9PYmplY3RPcHRpb25zIH0gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL1BoZXRpb09iamVjdC5qcyc7XHJcbmltcG9ydCBUYW5kZW0sIHsgRFlOQU1JQ19BUkNIRVRZUEVfTkFNRSB9IGZyb20gJy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgQXJyYXlJTyBmcm9tICcuLi8uLi90YW5kZW0vanMvdHlwZXMvQXJyYXlJTy5qcyc7XHJcbmltcG9ydCBGdW5jdGlvbklPIGZyb20gJy4uLy4uL3RhbmRlbS9qcy90eXBlcy9GdW5jdGlvbklPLmpzJztcclxuaW1wb3J0IElPVHlwZSBmcm9tICcuLi8uLi90YW5kZW0vanMvdHlwZXMvSU9UeXBlLmpzJztcclxuaW1wb3J0IE51bGxhYmxlSU8gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL3R5cGVzL051bGxhYmxlSU8uanMnO1xyXG5pbXBvcnQgU3RyaW5nSU8gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL3R5cGVzL1N0cmluZ0lPLmpzJztcclxuaW1wb3J0IFZvaWRJTyBmcm9tICcuLi8uLi90YW5kZW0vanMvdHlwZXMvVm9pZElPLmpzJztcclxuaW1wb3J0IHByb3BlcnR5U3RhdGVIYW5kbGVyU2luZ2xldG9uIGZyb20gJy4vcHJvcGVydHlTdGF0ZUhhbmRsZXJTaW5nbGV0b24uanMnO1xyXG5pbXBvcnQgUHJvcGVydHlTdGF0ZVBoYXNlIGZyb20gJy4vUHJvcGVydHlTdGF0ZVBoYXNlLmpzJztcclxuaW1wb3J0IFRpbnlQcm9wZXJ0eSBmcm9tICcuL1RpbnlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCB1bml0cyBmcm9tICcuL3VuaXRzLmpzJztcclxuaW1wb3J0IHZhbGlkYXRlIGZyb20gJy4vdmFsaWRhdGUuanMnO1xyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHksIHsgUHJvcGVydHlMYXp5TGlua0xpc3RlbmVyLCBQcm9wZXJ0eUxpbmtMaXN0ZW5lciwgUHJvcGVydHlMaXN0ZW5lciB9IGZyb20gJy4vVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgVmFsaWRhdGlvbiwgeyBWYWxpZGF0b3IsIFZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5IH0gZnJvbSAnLi9WYWxpZGF0aW9uLmpzJztcclxuaW1wb3J0IEludGVudGlvbmFsQW55IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9JbnRlbnRpb25hbEFueS5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IGF4b24gZnJvbSAnLi9heG9uLmpzJztcclxuaW1wb3J0IGlzQ2xlYXJpbmdQaGV0aW9EeW5hbWljRWxlbWVudHNQcm9wZXJ0eSBmcm9tICcuLi8uLi90YW5kZW0vanMvaXNDbGVhcmluZ1BoZXRpb0R5bmFtaWNFbGVtZW50c1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IGlzUGhldGlvU3RhdGVFbmdpbmVNYW5hZ2luZ1Byb3BlcnR5VmFsdWVzUHJvcGVydHkgZnJvbSAnLi4vLi4vdGFuZGVtL2pzL2lzUGhldGlvU3RhdGVFbmdpbmVNYW5hZ2luZ1Byb3BlcnR5VmFsdWVzUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgSU9UeXBlQ2FjaGUgZnJvbSAnLi4vLi4vdGFuZGVtL2pzL0lPVHlwZUNhY2hlLmpzJztcclxuaW1wb3J0IHsgVGlueUVtaXR0ZXJPcHRpb25zIH0gZnJvbSAnLi9UaW55RW1pdHRlci5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgVkFMSURBVEVfT1BUSU9OU19GQUxTRSA9IHsgdmFsaWRhdGVWYWxpZGF0b3I6IGZhbHNlIH07XHJcblxyXG4vLyB2YXJpYWJsZXNcclxubGV0IGdsb2JhbElkID0gMDsgLy8gYXV0by1pbmNyZW1lbnRlZCBmb3IgdW5pcXVlIElEc1xyXG5cclxuLy8gQ2FjaGUgZWFjaCBwYXJhbWV0ZXJpemVkIFByb3BlcnR5SU8gYmFzZWQgb24gdGhlIHBhcmFtZXRlciB0eXBlLCBzbyB0aGF0IGl0IGlzIG9ubHkgY3JlYXRlZCBvbmNlXHJcbmNvbnN0IGNhY2hlID0gbmV3IElPVHlwZUNhY2hlKCk7XHJcblxyXG5leHBvcnQgdHlwZSBSZWFkT25seVByb3BlcnR5U3RhdGU8U3RhdGVUeXBlPiA9IHtcclxuICB2YWx1ZTogU3RhdGVUeXBlO1xyXG5cclxuICAvLyBPbmx5IGluY2x1ZGUgdmFsaWRWYWx1ZXMgaWYgc3BlY2lmaWVkLCBzbyB0aGV5IG9ubHkgc2hvdyB1cCBpbiBQaEVULWlPIFN0dWRpbyB3aGVuIHN1cHBsaWVkLlxyXG4gIHZhbGlkVmFsdWVzOiBTdGF0ZVR5cGVbXSB8IG51bGw7XHJcblxyXG4gIHVuaXRzOiBzdHJpbmcgfCBudWxsO1xyXG59O1xyXG5cclxuLy8gT3B0aW9ucyBkZWZpbmVkIGJ5IFByb3BlcnR5XHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcblxyXG4gIC8vIHVuaXRzIGZvciB0aGUgbnVtYmVyLCBzZWUgdW5pdHMuanMuIFNob3VsZCBwcmVmZXIgYWJicmV2aWF0ZWQgdW5pdHMsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvNTMwXHJcbiAgdW5pdHM/OiBzdHJpbmcgfCBudWxsO1xyXG5cclxuICAvLyBXaGV0aGVyIHJlZW50cmFudCBjYWxscyB0byAnc2V0JyBhcmUgYWxsb3dlZC5cclxuICAvLyBVc2UgdGhpcyB0byBkZXRlY3Qgb3IgcHJldmVudCB1cGRhdGUgY3ljbGVzLiBVcGRhdGUgY3ljbGVzIG1heSBiZSBkdWUgdG8gZmxvYXRpbmcgcG9pbnQgZXJyb3IsXHJcbiAgLy8gZmF1bHR5IGxvZ2ljLCBldGMuIFRoaXMgbWF5IGJlIG9mIHBhcnRpY3VsYXIgaW50ZXJlc3QgZm9yIFBoRVQtaU8gaW5zdHJ1bWVudGF0aW9uLCB3aGVyZSBzdWNoXHJcbiAgLy8gY3ljbGVzIG1heSBwb2xsdXRlIHRoZSBkYXRhIHN0cmVhbS4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9heG9uL2lzc3Vlcy8xNzlcclxuICByZWVudHJhbnQ/OiBib29sZWFuO1xyXG5cclxuICAvLyBBdCB0aGlzIGxldmVsLCBpdCBkb2Vzbid0IG1hdHRlciB3aGF0IHRoZSBzdGF0ZSB0eXBlIGlzLCBzbyBpdCBkZWZhdWx0cyB0byBJbnRlbnRpb25hbEFueVxyXG4gIHBoZXRpb1ZhbHVlVHlwZT86IElPVHlwZTtcclxuXHJcbiAgLy8gVGhlIElPVHlwZSBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSBwYXJhbWV0ZXJpemVkIElPVHlwZSBiYXNlZCBvbiB0aGUgdmFsdWVUeXBlLiBUaGVyZSBpcyBhIGdlbmVyYWwgZGVmYXVsdCwgYnV0XHJcbiAgLy8gc3VidHlwZXMgY2FuIGltcGxlbWVudCB0aGVpciBvd24sIG1vcmUgc3BlY2lmaWMgSU9UeXBlLlxyXG4gIHBoZXRpb091dGVyVHlwZT86ICggcGFyYW1ldGVyVHlwZTogSU9UeXBlICkgPT4gSU9UeXBlO1xyXG5cclxuICAvLyBJZiBzcGVjaWZpZWQgYXMgdHJ1ZSwgdGhpcyBmbGFnIHdpbGwgZW5zdXJlIHRoYXQgbGlzdGVuZXIgb3JkZXIgbmV2ZXIgY2hhbmdlcyAobGlrZSB2aWEgP2xpc3RlbmVyT3JkZXI9cmFuZG9tKVxyXG4gIGhhc0xpc3RlbmVyT3JkZXJEZXBlbmRlbmNpZXM/OiBib29sZWFuO1xyXG5cclxuICAvLyBDaGFuZ2VzIHRoZSBiZWhhdmlvciBvZiBob3cgbGlzdGVuZXJzIGFyZSBub3RpZmllZCBpbiByZWVudHJhbnQgY2FzZXMgKHdoZXJlIGxpbmtlZCBsaXN0ZW5lcnMgY2F1c2UgdGhpcyBQcm9wZXJ0eVxyXG4gIC8vIHRvIGNoYW5nZSBpdHMgdmFsdWUgYWdhaW4pLiBEZWZhdWx0cyB0byBcInF1ZXVlXCIgZm9yIFByb3BlcnRpZXMgc28gdGhhdCB3ZSBub3RpZnkgYWxsIGxpc3RlbmVycyBmb3IgYSB2YWx1ZSBjaGFuZ2VcclxuICAvLyBiZWZvcmUgbm90aWZ5aW5nIGZvciB0aGUgbmV4dCB2YWx1ZSBjaGFuZ2UuIEZvciBleGFtcGxlLCBpZiB3ZSBjaGFuZ2UgZnJvbSBhLT5iLCBhbmQgb25lIGxpc3RlbmVyIGNoYW5nZXMgdGhlIHZhbHVlXHJcbiAgLy8gZnJvbSBiLT5jLCB0aGF0IHJlZW50cmFudCB2YWx1ZSBjaGFuZ2Ugd2lsbCBxdWV1ZSBpdHMgbGlzdGVuZXJzIGZvciBhZnRlciBhbGwgbGlzdGVuZXJzIGhhdmUgZmlyZWQgZm9yIGEtPmIuIEZvclxyXG4gIC8vIHNwZWNpZmljcyBzZWUgZG9jdW1lbnRhdGlvbiBpbiBUaW55RW1pdHRlci5cclxufSAmIFBpY2s8VGlueUVtaXR0ZXJPcHRpb25zLCAncmVlbnRyYW50Tm90aWZpY2F0aW9uU3RyYXRlZ3knPjtcclxuXHJcbnR5cGUgUGFyZW50T3B0aW9uczxUPiA9IFZhbGlkYXRvcjxUPiAmIFBoZXRpb09iamVjdE9wdGlvbnM7XHJcblxyXG4vLyBPcHRpb25zIHRoYXQgY2FuIGJlIHBhc3NlZCBpblxyXG5leHBvcnQgdHlwZSBQcm9wZXJ0eU9wdGlvbnM8VD4gPSBTZWxmT3B0aW9ucyAmIFN0cmljdE9taXQ8UGFyZW50T3B0aW9uczxUPiwgJ3BoZXRpb1R5cGUnPjtcclxuXHJcbmV4cG9ydCB0eXBlIExpbmtPcHRpb25zID0ge1xyXG4gIHBoZXRpb0RlcGVuZGVuY2llcz86IEFycmF5PFRSZWFkT25seVByb3BlcnR5PHVua25vd24+PjtcclxufTtcclxuXHJcbi8vIFdoZW4gY2hhbmdpbmcgdGhlIGxpc3RlbmVyIG9yZGVyIHZpYSA/bGlzdGVuZXJPcmRlciwgd2Ugd2VyZSBydW5uaW5nIGludG8gc3RyaWN0QXhvbkRlcGVuZGVuY2llcyBmYWlsdXJlcyB0aGF0XHJcbi8vIGRpZCBub3Qgb3RoZXJ3aXNlIG9jY3VyLiBCZWNhdXNlIHdlIGFyZW4ndCBpbnRlcmVzdGVkIGluIHRoZXNlIGNvcm5lciBjYXNlcywgYW5kIGJlY2F1c2UgdGhleSBhcmUgZGlmZmljdWx0IHRvXHJcbi8vIHVuZGVyc3RhbmQgYW5kIGRlYnVnLCB3ZSBjaG9zZSB0byB0dXJuIG9mZiBzdHJpY3RBeG9uRGVwZW5kZW5jaWVzIGlmIGxpc3RlbmVyIG9yZGVyIGlzIGNoYW5nZWQuXHJcbi8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZmFyYWRheXMtZWxlY3Ryb21hZ25ldGljLWxhYi9pc3N1ZXMvNTcjaXNzdWVjb21tZW50LTE5MDkwODk3MzVcclxuY29uc3Qgc3RyaWN0QXhvbkRlcGVuZGVuY2llcyA9IF8uaGFzSW4oIHdpbmRvdywgJ3BoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMnICkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMuc3RyaWN0QXhvbkRlcGVuZGVuY2llcyAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5saXN0ZW5lck9yZGVyID09PSAnZGVmYXVsdCc7XHJcbmV4cG9ydCBjb25zdCBkZXJpdmF0aW9uU3RhY2s6IEFycmF5PEludGVudGlvbmFsQW55PiA9IFtdO1xyXG5cclxuLyoqXHJcbiAqIEJhc2UgY2xhc3MgZm9yIFByb3BlcnR5LCBEZXJpdmVkUHJvcGVydHksIER5bmFtaWNQcm9wZXJ0eS4gIFNldCBtZXRob2RzIGFyZSBwcm90ZWN0ZWQvbm90IHBhcnQgb2YgdGhlIHB1YmxpY1xyXG4gKiBpbnRlcmZhY2UuICBJbml0aWFsIHZhbHVlIGFuZCByZXNldHRpbmcgaXMgbm90IGRlZmluZWQgaGVyZS5cclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlYWRPbmx5UHJvcGVydHk8VD4gZXh0ZW5kcyBQaGV0aW9PYmplY3QgaW1wbGVtZW50cyBUUmVhZE9ubHlQcm9wZXJ0eTxUPiB7XHJcblxyXG4gIC8vIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGlzIFByb3BlcnR5LlxyXG4gIHByaXZhdGUgcmVhZG9ubHkgaWQ6IG51bWJlcjtcclxuXHJcbiAgLy8gKHBoZXQtaW8pIFVuaXRzLCBpZiBhbnkuICBTZWUgdW5pdHMuanMgZm9yIHZhbGlkIHZhbHVlc1xyXG4gIHB1YmxpYyByZWFkb25seSB1bml0czogc3RyaW5nIHwgbnVsbDtcclxuXHJcbiAgcHVibGljIHZhbGlkVmFsdWVzPzogcmVhZG9ubHkgVFtdO1xyXG5cclxuICAvLyBlbWl0IGlzIGNhbGxlZCB3aGVuIHRoZSB2YWx1ZSBjaGFuZ2VzIChvciBvbiBsaW5rKVxyXG4gIHByaXZhdGUgdGlueVByb3BlcnR5OiBUaW55UHJvcGVydHk8VD47XHJcblxyXG4gIC8vIHdoZXRoZXIgd2UgYXJlIGluIHRoZSBwcm9jZXNzIG9mIG5vdGlmeWluZyBsaXN0ZW5lcnM7IGNoYW5nZWQgaW4gc29tZSBQcm9wZXJ0eSB0ZXN0IGZpbGVzIHdpdGggQHRzLWV4cGVjdC1lcnJvclxyXG4gIHByaXZhdGUgbm90aWZ5aW5nOiBib29sZWFuO1xyXG5cclxuICAvLyB3aGV0aGVyIHRvIGFsbG93IHJlZW50cnkgb2YgY2FsbHMgdG8gc2V0XHJcbiAgcHJpdmF0ZSByZWFkb25seSByZWVudHJhbnQ6IGJvb2xlYW47XHJcblxyXG4gIC8vIHdoaWxlIGRlZmVycmVkLCBuZXcgdmFsdWVzIG5laXRoZXIgdGFrZSBlZmZlY3Qgbm9yIHNlbmQgbm90aWZpY2F0aW9ucy4gIFdoZW4gaXNEZWZlcnJlZCBjaGFuZ2VzIGZyb21cclxuICAvLyB0cnVlIHRvIGZhbHNlLCB0aGUgZmluYWwgZGVmZXJyZWQgdmFsdWUgYmVjb21lcyB0aGUgUHJvcGVydHkgdmFsdWUuICBBbiBhY3Rpb24gaXMgY3JlYXRlZCB3aGljaCBjYW4gYmUgaW52b2tlZCB0b1xyXG4gIC8vIHNlbmQgbm90aWZpY2F0aW9ucy5cclxuICBwdWJsaWMgaXNEZWZlcnJlZDogYm9vbGVhbjtcclxuXHJcbiAgLy8gdGhlIHZhbHVlIHRoYXQgdGhpcyBQcm9wZXJ0eSB3aWxsIHRha2UgYWZ0ZXIgbm8gbG9uZ2VyIGRlZmVycmVkXHJcbiAgcHJvdGVjdGVkIGRlZmVycmVkVmFsdWU6IFQgfCBudWxsO1xyXG5cclxuICAvLyB3aGV0aGVyIGEgZGVmZXJyZWQgdmFsdWUgaGFzIGJlZW4gc2V0XHJcbiAgcHJvdGVjdGVkIGhhc0RlZmVycmVkVmFsdWU6IGJvb2xlYW47XHJcblxyXG4gIHByb3RlY3RlZCByZWFkb25seSB2YWx1ZVZhbGlkYXRvcjogVmFsaWRhdG9yPFQ+O1xyXG5cclxuICAvKipcclxuICAgKiBUaGlzIGlzIHByb3RlY3RlZCB0byBpbmRpY2F0ZSB0byBjbGllbnRzIHRoYXQgc3ViY2xhc3NlcyBzaG91bGQgYmUgdXNlZCBpbnN0ZWFkLlxyXG4gICAqIEBwYXJhbSB2YWx1ZSAtIHRoZSBpbml0aWFsIHZhbHVlIG9mIHRoZSBwcm9wZXJ0eVxyXG4gICAqIEBwYXJhbSBbcHJvdmlkZWRPcHRpb25zXVxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBjb25zdHJ1Y3RvciggdmFsdWU6IFQsIHByb3ZpZGVkT3B0aW9ucz86IFByb3BlcnR5T3B0aW9uczxUPiApIHtcclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8UHJvcGVydHlPcHRpb25zPFQ+LCBTZWxmT3B0aW9ucywgUGFyZW50T3B0aW9uczxUPj4oKSgge1xyXG4gICAgICB1bml0czogbnVsbCxcclxuICAgICAgcmVlbnRyYW50OiBmYWxzZSxcclxuICAgICAgaGFzTGlzdGVuZXJPcmRlckRlcGVuZGVuY2llczogZmFsc2UsXHJcbiAgICAgIHJlZW50cmFudE5vdGlmaWNhdGlvblN0cmF0ZWd5OiAncXVldWUnLFxyXG5cclxuICAgICAgLy8gU2VlIFZhbGlkYXRpb24udHMgZm9yIFZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5IGZvciBhdmFpbGFibGUgdmFsdWVzLiBQbGVhc2Ugbm90ZSB0aGF0IHRoaXMgd2lsbCBiZSB1c2VkIGZvclxyXG4gICAgICAvLyBlcXVhbGl0eSBjb21wYXJpc29uIGJvdGggd2l0aCB2YWxpZGF0aW9uIChpLmUuIGZvciB2YWxpZFZhbHVlIGNvbXBhcmlzb24pLCBhcyB3ZWxsIGFzIGRldGVybWluaW5nIGlmIHRoZVxyXG4gICAgICAvLyB2YWx1ZSBoYXMgY2hhbmdlZCBzdWNoIHRoYXQgbGlzdGVuZXJzIHNob3VsZCBmaXJlLCBzZWUgVGlueVByb3BlcnR5LmFyZVZhbHVlc0VxdWFsKCkuXHJcbiAgICAgIHZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5OiAncmVmZXJlbmNlJyxcclxuXHJcbiAgICAgIC8vIHBoZXQtaW9cclxuICAgICAgdGFuZGVtTmFtZVN1ZmZpeDogWyAnUHJvcGVydHknLCBEWU5BTUlDX0FSQ0hFVFlQRV9OQU1FIF0sIC8vIERZTkFNSUNfQVJDSEVUWVBFX05BTUUgbWVhbnMgdGhhdCB0aGlzIFByb3BlcnR5IGlzIGFuIGFyY2hldHlwZS5cclxuICAgICAgcGhldGlvT3V0ZXJUeXBlOiBSZWFkT25seVByb3BlcnR5LlByb3BlcnR5SU8sXHJcbiAgICAgIHBoZXRpb1ZhbHVlVHlwZTogSU9UeXBlLk9iamVjdElPXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcblxyXG4gICAgYXNzZXJ0ICYmIG9wdGlvbnMudW5pdHMgJiYgYXNzZXJ0KCB1bml0cy5pc1ZhbGlkVW5pdHMoIG9wdGlvbnMudW5pdHMgKSwgYGludmFsaWQgdW5pdHM6ICR7b3B0aW9ucy51bml0c31gICk7XHJcbiAgICBpZiAoIG9wdGlvbnMudW5pdHMgKSB7XHJcbiAgICAgIG9wdGlvbnMucGhldGlvRXZlbnRNZXRhZGF0YSA9IG9wdGlvbnMucGhldGlvRXZlbnRNZXRhZGF0YSB8fCB7fTtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggIW9wdGlvbnMucGhldGlvRXZlbnRNZXRhZGF0YS5oYXNPd25Qcm9wZXJ0eSggJ3VuaXRzJyApLCAndW5pdHMgc2hvdWxkIGJlIHN1cHBsaWVkIGJ5IFByb3BlcnR5LCBub3QgZWxzZXdoZXJlJyApO1xyXG4gICAgICBvcHRpb25zLnBoZXRpb0V2ZW50TWV0YWRhdGEudW5pdHMgPSBvcHRpb25zLnVuaXRzO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggYXNzZXJ0ICYmIHByb3ZpZGVkT3B0aW9ucyApIHtcclxuXHJcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLS0gZm9yIGNoZWNraW5nIEpTIGNvZGVcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggIXByb3ZpZGVkT3B0aW9ucy5waGV0aW9UeXBlLCAnU2V0IHBoZXRpb1R5cGUgdmlhIHBoZXRpb1ZhbHVlVHlwZScgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDb25zdHJ1Y3QgdGhlIElPVHlwZVxyXG4gICAgaWYgKCBvcHRpb25zLnBoZXRpb091dGVyVHlwZSAmJiBvcHRpb25zLnBoZXRpb1ZhbHVlVHlwZSApIHtcclxuICAgICAgb3B0aW9ucy5waGV0aW9UeXBlID0gb3B0aW9ucy5waGV0aW9PdXRlclR5cGUoIG9wdGlvbnMucGhldGlvVmFsdWVUeXBlICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3VwcG9ydCBub24tdmFsaWRhdGVkIFByb3BlcnR5XHJcbiAgICBpZiAoICFWYWxpZGF0aW9uLmNvbnRhaW5zVmFsaWRhdG9yS2V5KCBvcHRpb25zICkgKSB7XHJcbiAgICAgIG9wdGlvbnMuaXNWYWxpZFZhbHVlID0gKCkgPT4gdHJ1ZTtcclxuICAgIH1cclxuICAgIHN1cGVyKCBvcHRpb25zICk7XHJcbiAgICB0aGlzLmlkID0gZ2xvYmFsSWQrKztcclxuICAgIHRoaXMudW5pdHMgPSBvcHRpb25zLnVuaXRzO1xyXG5cclxuICAgIC8vIFdoZW4gcnVubmluZyBhcyBwaGV0LWlvLCBpZiB0aGUgdGFuZGVtIGlzIHNwZWNpZmllZCwgdGhlIHR5cGUgbXVzdCBiZSBzcGVjaWZpZWQuXHJcbiAgICBpZiAoIHRoaXMuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSApIHtcclxuXHJcbiAgICAgIC8vIFRoaXMgYXNzZXJ0aW9uIGhlbHBzIGluIGluc3RydW1lbnRpbmcgY29kZSB0aGF0IGhhcyB0aGUgdGFuZGVtIGJ1dCBub3QgdHlwZVxyXG4gICAgICBhc3NlcnQgJiYgVGFuZGVtLlZBTElEQVRJT04gJiYgYXNzZXJ0KCB0aGlzLnBoZXRpb1R5cGUsXHJcbiAgICAgICAgYHBoZXRpb1R5cGUgcGFzc2VkIHRvIFByb3BlcnR5IG11c3QgYmUgc3BlY2lmaWVkLiBUYW5kZW0ucGhldGlvSUQ6ICR7dGhpcy50YW5kZW0ucGhldGlvSUR9YCApO1xyXG5cclxuICAgICAgYXNzZXJ0ICYmIFRhbmRlbS5WQUxJREFUSU9OICYmIGFzc2VydCggb3B0aW9ucy5waGV0aW9UeXBlLnBhcmFtZXRlclR5cGVzIVsgMCBdLFxyXG4gICAgICAgIGBwaGV0aW9UeXBlIHBhcmFtZXRlciB0eXBlIG11c3QgYmUgc3BlY2lmaWVkIChvbmx5IG9uZSkuIFRhbmRlbS5waGV0aW9JRDogJHt0aGlzLnRhbmRlbS5waGV0aW9JRH1gICk7XHJcblxyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBvcHRpb25zLnBoZXRpb1ZhbHVlVHlwZSAhPT0gSU9UeXBlLk9iamVjdElPLFxyXG4gICAgICAgICdQaEVULWlPIFByb3BlcnRpZXMgbXVzdCBzcGVjaWZ5IGEgcGhldGlvVmFsdWVUeXBlOiAnICsgdGhpcy5waGV0aW9JRCApO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudmFsaWRWYWx1ZXMgPSBvcHRpb25zLnZhbGlkVmFsdWVzO1xyXG5cclxuICAgIHRoaXMudGlueVByb3BlcnR5ID0gbmV3IFRpbnlQcm9wZXJ0eSggdmFsdWUsIG51bGwsIG9wdGlvbnMuaGFzTGlzdGVuZXJPcmRlckRlcGVuZGVuY2llcywgb3B0aW9ucy5yZWVudHJhbnROb3RpZmljYXRpb25TdHJhdGVneSApO1xyXG5cclxuICAgIC8vIFNpbmNlIHdlIGFyZSBhbHJlYWR5IGluIHRoZSBoZWF2eXdlaWdodCBQcm9wZXJ0eSwgd2UgYWx3YXlzIGFzc2lnbiBUaW55UHJvcGVydHkudmFsdWVDb21wYXJpc29uU3RyYXRlZ3kgZm9yIGNsYXJpdHkuXHJcbiAgICB0aGlzLnRpbnlQcm9wZXJ0eS52YWx1ZUNvbXBhcmlzb25TdHJhdGVneSA9IG9wdGlvbnMudmFsdWVDb21wYXJpc29uU3RyYXRlZ3k7XHJcbiAgICB0aGlzLm5vdGlmeWluZyA9IGZhbHNlO1xyXG4gICAgdGhpcy5yZWVudHJhbnQgPSBvcHRpb25zLnJlZW50cmFudDtcclxuICAgIHRoaXMuaXNEZWZlcnJlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5kZWZlcnJlZFZhbHVlID0gbnVsbDtcclxuICAgIHRoaXMuaGFzRGVmZXJyZWRWYWx1ZSA9IGZhbHNlO1xyXG5cclxuICAgIHRoaXMudmFsdWVWYWxpZGF0b3IgPSBfLnBpY2soIG9wdGlvbnMsIFZhbGlkYXRpb24uVkFMSURBVE9SX0tFWVMgKTtcclxuICAgIHRoaXMudmFsdWVWYWxpZGF0b3IudmFsaWRhdGlvbk1lc3NhZ2UgPSB0aGlzLnZhbHVlVmFsaWRhdG9yLnZhbGlkYXRpb25NZXNzYWdlIHx8ICdQcm9wZXJ0eSB2YWx1ZSBub3QgdmFsaWQnO1xyXG5cclxuICAgIGlmICggdGhpcy52YWx1ZVZhbGlkYXRvci5waGV0aW9UeXBlICkge1xyXG5cclxuICAgICAgLy8gVmFsaWRhdGUgdGhlIHZhbHVlIHR5cGUncyBwaGV0aW9UeXBlIG9mIHRoZSBQcm9wZXJ0eSwgbm90IHRoZSBQcm9wZXJ0eUlPIGl0c2VsZi5cclxuICAgICAgLy8gRm9yIGV4YW1wbGUsIGZvciBQcm9wZXJ0eUlPKCBCb29sZWFuSU8gKSwgYXNzaWduIHRoaXMgdmFsdWVWYWxpZGF0b3IncyBwaGV0aW9UeXBlIHRvIGJlIEJvb2xlYW5JTydzIHZhbGlkYXRvci5cclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggISF0aGlzLnZhbHVlVmFsaWRhdG9yLnBoZXRpb1R5cGUucGFyYW1ldGVyVHlwZXMhWyAwIF0sICd1bmV4cGVjdGVkIG51bWJlciBvZiBwYXJhbWV0ZXJzIGZvciBQcm9wZXJ0eScgKTtcclxuXHJcbiAgICAgIC8vIFRoaXMgaXMgdGhlIHZhbGlkYXRvciBmb3IgdGhlIHZhbHVlLCBub3QgZm9yIHRoZSBQcm9wZXJ0eSBpdHNlbGZcclxuICAgICAgdGhpcy52YWx1ZVZhbGlkYXRvci5waGV0aW9UeXBlID0gdGhpcy52YWx1ZVZhbGlkYXRvci5waGV0aW9UeXBlLnBhcmFtZXRlclR5cGVzIVsgMCBdO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFzc2VydGlvbnMgcmVnYXJkaW5nIHZhbHVlIHZhbGlkYXRpb25cclxuICAgIGlmICggYXNzZXJ0ICkge1xyXG5cclxuICAgICAgVmFsaWRhdGlvbi52YWxpZGF0ZVZhbGlkYXRvciggdGhpcy52YWx1ZVZhbGlkYXRvciApO1xyXG5cclxuICAgICAgLy8gdmFsaWRhdGUgdGhlIGluaXRpYWwgdmFsdWUgYXMgd2VsbCBhcyBhbnkgY2hhbmdlcyBpbiB0aGUgZnV0dXJlXHJcbiAgICAgIHZhbGlkYXRlKCB2YWx1ZSwgdGhpcy52YWx1ZVZhbGlkYXRvciwgVkFMSURBVEVfT1BUSU9OU19GQUxTRSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0cnVlIGlmIHRoZSB2YWx1ZSBjYW4gYmUgc2V0IGV4dGVybmFsbHksIHVzaW5nIC52YWx1ZT0gb3Igc2V0KClcclxuICAgKi9cclxuICBwdWJsaWMgaXNTZXR0YWJsZSgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIHZhbHVlLlxyXG4gICAqIFlvdSBjYW4gYWxzbyB1c2UgdGhlIGVzNSBnZXR0ZXIgKHByb3BlcnR5LnZhbHVlKSBidXQgdGhpcyBtZWFucyBpcyBwcm92aWRlZCBmb3IgaW5uZXIgbG9vcHNcclxuICAgKiBvciBpbnRlcm5hbCBjb2RlIHRoYXQgbXVzdCBiZSBmYXN0LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQoKTogVCB7XHJcbiAgICBpZiAoIGFzc2VydCAmJiBzdHJpY3RBeG9uRGVwZW5kZW5jaWVzICYmIGRlcml2YXRpb25TdGFjay5sZW5ndGggPiAwICkge1xyXG4gICAgICBjb25zdCBjdXJyZW50RGVwZW5kZW5jaWVzID0gZGVyaXZhdGlvblN0YWNrWyBkZXJpdmF0aW9uU3RhY2subGVuZ3RoIC0gMSBdO1xyXG4gICAgICBpZiAoICFjdXJyZW50RGVwZW5kZW5jaWVzLmluY2x1ZGVzKCB0aGlzICkgKSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggZmFsc2UsICdhY2Nlc3NlZCB2YWx1ZSBvdXRzaWRlIG9mIGRlcGVuZGVuY3kgdHJhY2tpbmcnICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLnRpbnlQcm9wZXJ0eS5nZXQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHZhbHVlIGFuZCBub3RpZmllcyBsaXN0ZW5lcnMsIHVubGVzcyBkZWZlcnJlZCBvciBkaXNwb3NlZC4gWW91IGNhbiBhbHNvIHVzZSB0aGUgZXM1IGdldHRlclxyXG4gICAqIChwcm9wZXJ0eS52YWx1ZSkgYnV0IHRoaXMgbWVhbnMgaXMgcHJvdmlkZWQgZm9yIGlubmVyIGxvb3BzIG9yIGludGVybmFsIGNvZGUgdGhhdCBtdXN0IGJlIGZhc3QuIElmIHRoZSB2YWx1ZVxyXG4gICAqIGhhc24ndCBjaGFuZ2VkLCB0aGlzIGlzIGEgbm8tb3AuXHJcbiAgICpcclxuICAgKiBOT1RFOiBGb3IgUGhFVC1pTyBpbnN0cnVtZW50ZWQgUHJvcGVydGllcyB0aGF0IGFyZSBwaGV0aW9TdGF0ZTogdHJ1ZSwgdGhlIHZhbHVlIGlzIG9ubHlcclxuICAgKiBzZXQgYnkgdGhlIFBoZXRpb1N0YXRlRW5naW5lIGFuZCBjYW5ub3QgYmUgbW9kaWZpZWQgYnkgb3RoZXIgY29kZSB3aGlsZSBpc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5ID09PSB0cnVlLlxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBzZXQoIHZhbHVlOiBUICk6IHZvaWQge1xyXG5cclxuICAgIC8vIFN0YXRlIGlzIG1hbmFnZWQgYnkgdGhlIFBoZXRpb1N0YXRlRW5naW5lLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2F4b24vaXNzdWVzLzQwOVxyXG4gICAgY29uc3Qgc2V0TWFuYWdlZEJ5UGhldGlvU3RhdGUgPSBpc1BoZXRpb1N0YXRlRW5naW5lTWFuYWdpbmdQcm9wZXJ0eVZhbHVlc1Byb3BlcnR5LnZhbHVlICYmXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBzdGlsbCB3YW50IHRvIHNldCBQcm9wZXJ0aWVzIHdoZW4gY2xlYXJpbmcgZHluYW1pYyBlbGVtZW50cywgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvL2lzc3Vlcy8xOTA2XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFpc0NsZWFyaW5nUGhldGlvRHluYW1pY0VsZW1lbnRzUHJvcGVydHkudmFsdWUgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpICYmIHRoaXMucGhldGlvU3RhdGUgJiZcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhvd2V2ZXIsIERlcml2ZWRQcm9wZXJ0eSBzaG91bGQgYmUgYWJsZSB0byB1cGRhdGUgZHVyaW5nIFBoRVQtaU8gc3RhdGUgc2V0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaXNTZXR0YWJsZSgpO1xyXG5cclxuICAgIGlmICggIXNldE1hbmFnZWRCeVBoZXRpb1N0YXRlICkge1xyXG4gICAgICB0aGlzLnVuZ3VhcmRlZFNldCggdmFsdWUgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyBVbmNvbW1lbnQgd2hpbGUgaW1wbGVtZW50aW5nIFBoRVQtaU8gU3RhdGUgZm9yIHlvdXIgc2ltdWxhdGlvbiB0byBzZWUgd2hhdCB2YWx1ZS1zZXR0aW5nIGlzIGJlaW5nIHNpbGVudGx5IGlnbm9yZWQuXHJcbiAgICAgIC8vIGNvbnNvbGUud2FybiggYElnbm9yaW5nIGF0dGVtcHQgdG8gUmVhZE9ubHlQcm9wZXJ0eS5zZXQoKTogJHt0aGlzLnBoZXRpb0lEfWAgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZvciB1c2FnZSBieSB0aGUgSU9UeXBlIGR1cmluZyBQaEVULWlPIHN0YXRlIHNldHRpbmcuXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIHVuZ3VhcmRlZFNldCggdmFsdWU6IFQgKTogdm9pZCB7XHJcbiAgICBpZiAoICF0aGlzLmlzRGlzcG9zZWQgKSB7XHJcbiAgICAgIGlmICggdGhpcy5pc0RlZmVycmVkICkge1xyXG4gICAgICAgIHRoaXMuZGVmZXJyZWRWYWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgIHRoaXMuaGFzRGVmZXJyZWRWYWx1ZSA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoICF0aGlzLmVxdWFsc1ZhbHVlKCB2YWx1ZSApICkge1xyXG4gICAgICAgIGNvbnN0IG9sZFZhbHVlID0gdGhpcy5nZXQoKTtcclxuICAgICAgICB0aGlzLnNldFByb3BlcnR5VmFsdWUoIHZhbHVlICk7XHJcbiAgICAgICAgdGhpcy5fbm90aWZ5TGlzdGVuZXJzKCBvbGRWYWx1ZSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSB2YWx1ZSB3aXRob3V0IG5vdGlmeWluZyBhbnkgbGlzdGVuZXJzLiBUaGlzIGlzIGEgcGxhY2UgdG8gb3ZlcnJpZGUgaWYgYSBzdWJ0eXBlIHBlcmZvcm1zIGFkZGl0aW9uYWwgd29ya1xyXG4gICAqIHdoZW4gc2V0dGluZyB0aGUgdmFsdWUuXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIHNldFByb3BlcnR5VmFsdWUoIHZhbHVlOiBUICk6IHZvaWQge1xyXG4gICAgdGhpcy50aW55UHJvcGVydHkuc2V0UHJvcGVydHlWYWx1ZSggdmFsdWUgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdHJ1ZSBpZiBhbmQgb25seSBpZiB0aGUgc3BlY2lmaWVkIHZhbHVlIGVxdWFscyB0aGUgdmFsdWUgb2YgdGhpcyBwcm9wZXJ0eVxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBlcXVhbHNWYWx1ZSggdmFsdWU6IFQgKTogYm9vbGVhbiB7XHJcblxyXG4gICAgLy8gSWRlYWxseSwgd2Ugd291bGQgY2FsbCB0aGUgZXF1YWxzVmFsdWUgaW4gdGlueVByb3BlcnR5LCBidXQgaXQgaXMgcHJvdGVjdGVkLiBGdXJ0aGVybW9yZSwgaXQgaXMgbmljZSB0byBnZXRcclxuICAgIC8vIHRoZSBhc3NlcnRpb25zIGFzc29jaWF0ZWQgd2l0aCBSZWFkT25seVByb3BlcnR5LmdldCgpLlxyXG4gICAgcmV0dXJuIHRoaXMuYXJlVmFsdWVzRXF1YWwoIHZhbHVlLCB0aGlzLmdldCgpICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmUgaWYgdGhlIHR3byB2YWx1ZXMgYXJlIGVxdWFsLCBzZWUgVGlueVByb3BlcnR5LmFyZVZhbHVlc0VxdWFsKCkuXHJcbiAgICovXHJcbiAgcHVibGljIGFyZVZhbHVlc0VxdWFsKCBhOiBULCBiOiBUICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMudGlueVByb3BlcnR5LmFyZVZhbHVlc0VxdWFsKCBhLCBiICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBOT1RFOiBhIGZldyBzaW1zIGFyZSBjYWxsaW5nIHRoaXMgZXZlbiB0aG91Z2ggdGhleSBzaG91bGRuJ3RcclxuICAgKi9cclxuICBwcml2YXRlIF9ub3RpZnlMaXN0ZW5lcnMoIG9sZFZhbHVlOiBUIHwgbnVsbCApOiB2b2lkIHtcclxuICAgIGNvbnN0IG5ld1ZhbHVlID0gdGhpcy5nZXQoKTtcclxuXHJcbiAgICAvLyB2YWxpZGF0ZSB0aGUgYmVmb3JlIG5vdGlmeWluZyBsaXN0ZW5lcnNcclxuICAgIGFzc2VydCAmJiB2YWxpZGF0ZSggbmV3VmFsdWUsIHRoaXMudmFsdWVWYWxpZGF0b3IsIFZBTElEQVRFX09QVElPTlNfRkFMU0UgKTtcclxuXHJcbiAgICAvLyBBbHRob3VnaCB0aGlzIGlzIG5vdCB0aGUgaWRpb21hdGljIHBhdHRlcm4gKHNpbmNlIGl0IGlzIGd1YXJkZWQgaW4gdGhlIHBoZXRpb1N0YXJ0RXZlbnQpLCB0aGlzIGZ1bmN0aW9uIGlzXHJcbiAgICAvLyBjYWxsZWQgc28gbWFueSB0aW1lcyB0aGF0IGl0IGlzIHdvcnRoIHRoZSBvcHRpbWl6YXRpb24gZm9yIFBoRVQgYnJhbmQuXHJcbiAgICBUYW5kZW0uUEhFVF9JT19FTkFCTEVEICYmIHRoaXMuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSAmJiB0aGlzLnBoZXRpb1N0YXJ0RXZlbnQoIFJlYWRPbmx5UHJvcGVydHkuQ0hBTkdFRF9FVkVOVF9OQU1FLCB7XHJcbiAgICAgIGdldERhdGE6ICgpID0+IHtcclxuICAgICAgICBjb25zdCBwYXJhbWV0ZXJUeXBlID0gdGhpcy5waGV0aW9UeXBlLnBhcmFtZXRlclR5cGVzIVsgMCBdO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBvbGRWYWx1ZTogTnVsbGFibGVJTyggcGFyYW1ldGVyVHlwZSApLnRvU3RhdGVPYmplY3QoIG9sZFZhbHVlICksXHJcbiAgICAgICAgICBuZXdWYWx1ZTogcGFyYW1ldGVyVHlwZS50b1N0YXRlT2JqZWN0KCBuZXdWYWx1ZSApXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIG5vdGlmeSBsaXN0ZW5lcnMsIG9wdGlvbmFsbHkgZGV0ZWN0IGxvb3BzIHdoZXJlIHRoaXMgUHJvcGVydHkgaXMgc2V0IGFnYWluIGJlZm9yZSB0aGlzIGNvbXBsZXRlcy5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLm5vdGlmeWluZyB8fCB0aGlzLnJlZW50cmFudCxcclxuICAgICAgYHJlZW50cnkgZGV0ZWN0ZWQsIHZhbHVlPSR7bmV3VmFsdWV9LCBvbGRWYWx1ZT0ke29sZFZhbHVlfWAgKTtcclxuICAgIHRoaXMubm90aWZ5aW5nID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLnRpbnlQcm9wZXJ0eS5lbWl0KCBuZXdWYWx1ZSwgb2xkVmFsdWUsIHRoaXMgKTsgLy8gY2Fubm90IHVzZSB0aW55UHJvcGVydHkubm90aWZ5TGlzdGVuZXJzIGJlY2F1c2UgaXQgdXNlcyB0aGUgd3JvbmcgdGhpc1xyXG4gICAgdGhpcy5ub3RpZnlpbmcgPSBmYWxzZTtcclxuXHJcbiAgICBUYW5kZW0uUEhFVF9JT19FTkFCTEVEICYmIHRoaXMuaXNQaGV0aW9JbnN0cnVtZW50ZWQoKSAmJiB0aGlzLnBoZXRpb0VuZEV2ZW50KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVc2UgdGhpcyBtZXRob2Qgd2hlbiBtdXRhdGluZyBhIHZhbHVlIChub3QgcmVwbGFjaW5nIHdpdGggYSBuZXcgaW5zdGFuY2UpIGFuZCB5b3Ugd2FudCB0byBzZW5kIG5vdGlmaWNhdGlvbnMgYWJvdXQgdGhlIGNoYW5nZS5cclxuICAgKiBUaGlzIGlzIGRpZmZlcmVudCBmcm9tIHRoZSBub3JtYWwgYXhvbiBzdHJhdGVneSwgYnV0IG1heSBiZSBuZWNlc3NhcnkgdG8gcHJldmVudCBtZW1vcnkgYWxsb2NhdGlvbnMuXHJcbiAgICogVGhpcyBtZXRob2QgaXMgdW5zYWZlIGZvciByZW1vdmluZyBsaXN0ZW5lcnMgYmVjYXVzZSBpdCBhc3N1bWVzIHRoZSBsaXN0ZW5lciBsaXN0IG5vdCBtb2RpZmllZCwgdG8gc2F2ZSBhbm90aGVyIGFsbG9jYXRpb25cclxuICAgKiBPbmx5IHByb3ZpZGVzIHRoZSBuZXcgcmVmZXJlbmNlIGFzIGEgY2FsbGJhY2sgKG5vIG9sZHZhbHVlKVxyXG4gICAqIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvYXhvbi9pc3N1ZXMvNlxyXG4gICAqL1xyXG4gIHB1YmxpYyBub3RpZnlMaXN0ZW5lcnNTdGF0aWMoKTogdm9pZCB7XHJcbiAgICB0aGlzLl9ub3RpZnlMaXN0ZW5lcnMoIG51bGwgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZW4gZGVmZXJyZWQsIHNldCB2YWx1ZXMgZG8gbm90IHRha2UgZWZmZWN0IG9yIHNlbmQgb3V0IG5vdGlmaWNhdGlvbnMuICBBZnRlciBkZWZlciBlbmRzLCB0aGUgUHJvcGVydHkgdGFrZXNcclxuICAgKiBpdHMgZGVmZXJyZWQgdmFsdWUgKGlmIGFueSksIGFuZCBhIGZvbGxvdy11cCBhY3Rpb24gKHJldHVybiB2YWx1ZSkgY2FuIGJlIGludm9rZWQgdG8gc2VuZCBvdXQgbm90aWZpY2F0aW9uc1xyXG4gICAqIG9uY2Ugb3RoZXIgUHJvcGVydGllcyBoYXZlIGFsc28gdGFrZW4gdGhlaXIgZGVmZXJyZWQgdmFsdWVzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGlzRGVmZXJyZWQgLSB3aGV0aGVyIHRoZSBQcm9wZXJ0eSBzaG91bGQgYmUgZGVmZXJyZWQgb3Igbm90XHJcbiAgICogQHJldHVybnMgLSBmdW5jdGlvbiB0byBub3RpZnkgbGlzdGVuZXJzIGFmdGVyIGNhbGxpbmcgc2V0RGVmZXJyZWQoZmFsc2UpLFxyXG4gICAqICAgICAgICAgIC0gbnVsbCBpZiBpc0RlZmVycmVkIGlzIHRydWUsIG9yIGlmIHRoZSB2YWx1ZSBpcyB1bmNoYW5nZWQgc2luY2UgY2FsbGluZyBzZXREZWZlcnJlZCh0cnVlKVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXREZWZlcnJlZCggaXNEZWZlcnJlZDogYm9vbGVhbiApOiAoICgpID0+IHZvaWQgKSB8IG51bGwge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMuaXNEaXNwb3NlZCwgJ2Nhbm5vdCBkZWZlciBQcm9wZXJ0eSBpZiBhbHJlYWR5IGRpc3Bvc2VkLicgKTtcclxuICAgIGlmICggaXNEZWZlcnJlZCApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggIXRoaXMuaXNEZWZlcnJlZCwgJ1Byb3BlcnR5IGFscmVhZHkgZGVmZXJyZWQnICk7XHJcbiAgICAgIHRoaXMuaXNEZWZlcnJlZCA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5pc0RlZmVycmVkLCAnUHJvcGVydHkgd2FzblxcJ3QgZGVmZXJyZWQnICk7XHJcbiAgICAgIHRoaXMuaXNEZWZlcnJlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgY29uc3Qgb2xkVmFsdWUgPSB0aGlzLmdldCgpO1xyXG5cclxuICAgICAgLy8gVGFrZSB0aGUgbmV3IHZhbHVlXHJcbiAgICAgIGlmICggdGhpcy5oYXNEZWZlcnJlZFZhbHVlICkge1xyXG4gICAgICAgIHRoaXMuc2V0UHJvcGVydHlWYWx1ZSggdGhpcy5kZWZlcnJlZFZhbHVlISApO1xyXG4gICAgICAgIHRoaXMuaGFzRGVmZXJyZWRWYWx1ZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZGVmZXJyZWRWYWx1ZSA9IG51bGw7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIElmIHRoZSB2YWx1ZSBoYXMgY2hhbmdlZCwgcHJlcGFyZSB0byBzZW5kIG91dCBub3RpZmljYXRpb25zIChhZnRlciBhbGwgb3RoZXIgUHJvcGVydGllcyBpbiB0aGlzIHRyYW5zYWN0aW9uXHJcbiAgICAgIC8vIGhhdmUgdGhlaXIgZmluYWwgdmFsdWVzKVxyXG4gICAgICBpZiAoICF0aGlzLmVxdWFsc1ZhbHVlKCBvbGRWYWx1ZSApICkge1xyXG4gICAgICAgIHJldHVybiAoKSA9PiAhdGhpcy5pc0Rpc3Bvc2VkICYmIHRoaXMuX25vdGlmeUxpc3RlbmVycyggb2xkVmFsdWUgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIG5vIGFjdGlvbiB0byBzaWduaWZ5IGNoYW5nZVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IHZhbHVlKCk6IFQge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0KCk7XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgc2V0IHZhbHVlKCBuZXdWYWx1ZTogVCApIHtcclxuICAgIHRoaXMuc2V0KCBuZXdWYWx1ZSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhpcyBmdW5jdGlvbiByZWdpc3RlcnMgYW4gb3JkZXIgZGVwZW5kZW5jeSBiZXR3ZWVuIHRoaXMgUHJvcGVydHkgYW5kIGFub3RoZXIuIEJhc2ljYWxseSB0aGlzIHNheXMgdGhhdCB3aGVuXHJcbiAgICogc2V0dGluZyBQaEVULWlPIHN0YXRlLCBlYWNoIGRlcGVuZGVuY3kgbXVzdCB0YWtlIGl0cyBmaW5hbCB2YWx1ZSBiZWZvcmUgdGhpcyBQcm9wZXJ0eSBmaXJlcyBpdHMgbm90aWZpY2F0aW9ucy5cclxuICAgKiBTZWUgcHJvcGVydHlTdGF0ZUhhbmRsZXJTaW5nbGV0b24ucmVnaXN0ZXJQaGV0aW9PcmRlckRlcGVuZGVuY3kgYW5kIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9heG9uL2lzc3Vlcy8yNzYgZm9yIG1vcmUgaW5mby5cclxuICAgKi9cclxuICBwdWJsaWMgYWRkUGhldGlvU3RhdGVEZXBlbmRlbmNpZXMoIGRlcGVuZGVuY2llczogQXJyYXk8VFJlYWRPbmx5UHJvcGVydHk8SW50ZW50aW9uYWxBbnk+PiApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIEFycmF5LmlzQXJyYXkoIGRlcGVuZGVuY2llcyApLCAnQXJyYXkgZXhwZWN0ZWQnICk7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBkZXBlbmRlbmNpZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGRlcGVuZGVuY3lQcm9wZXJ0eSA9IGRlcGVuZGVuY2llc1sgaSBdO1xyXG5cclxuICAgICAgLy8gb25seSBpZiBydW5uaW5nIGluIFBoRVQtaU8gYnJhbmQgYW5kIGJvdGggUHJvcGVydGllcyBhcmUgaW5zdHJ1bWVudGluZ1xyXG4gICAgICBpZiAoIGRlcGVuZGVuY3lQcm9wZXJ0eSBpbnN0YW5jZW9mIFJlYWRPbmx5UHJvcGVydHkgJiYgZGVwZW5kZW5jeVByb3BlcnR5LmlzUGhldGlvSW5zdHJ1bWVudGVkKCkgJiYgdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpICkge1xyXG5cclxuICAgICAgICAvLyBUaGUgZGVwZW5kZW5jeSBzaG91bGQgdW5kZWZlciAodGFraW5nIGRlZmVycmVkIHZhbHVlKSBiZWZvcmUgdGhpcyBQcm9wZXJ0eSBub3RpZmllcy5cclxuICAgICAgICBwcm9wZXJ0eVN0YXRlSGFuZGxlclNpbmdsZXRvbi5yZWdpc3RlclBoZXRpb09yZGVyRGVwZW5kZW5jeSggZGVwZW5kZW5jeVByb3BlcnR5LCBQcm9wZXJ0eVN0YXRlUGhhc2UuVU5ERUZFUiwgdGhpcywgUHJvcGVydHlTdGF0ZVBoYXNlLk5PVElGWSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGxpc3RlbmVyIGFuZCBjYWxscyBpdCBpbW1lZGlhdGVseS4gSWYgbGlzdGVuZXIgaXMgYWxyZWFkeSByZWdpc3RlcmVkLCB0aGlzIGlzIGEgbm8tb3AuIFRoZSBpbml0aWFsXHJcbiAgICogbm90aWZpY2F0aW9uIHByb3ZpZGVzIHRoZSBjdXJyZW50IHZhbHVlIGZvciBuZXdWYWx1ZSBhbmQgbnVsbCBmb3Igb2xkVmFsdWUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbGlzdGVuZXIgLSBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSBuZXcgdmFsdWUsIG9sZCB2YWx1ZSwgYW5kIHRoaXMgUHJvcGVydHkgYXMgYXJndW1lbnRzXHJcbiAgICogQHBhcmFtIFtvcHRpb25zXVxyXG4gICAqL1xyXG4gIHB1YmxpYyBsaW5rKCBsaXN0ZW5lcjogUHJvcGVydHlMaW5rTGlzdGVuZXI8VD4sIG9wdGlvbnM/OiBMaW5rT3B0aW9ucyApOiB2b2lkIHtcclxuICAgIGlmICggb3B0aW9ucyAmJiBvcHRpb25zLnBoZXRpb0RlcGVuZGVuY2llcyApIHtcclxuICAgICAgdGhpcy5hZGRQaGV0aW9TdGF0ZURlcGVuZGVuY2llcyggb3B0aW9ucy5waGV0aW9EZXBlbmRlbmNpZXMgKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRpbnlQcm9wZXJ0eS5hZGRMaXN0ZW5lciggbGlzdGVuZXIgKTsgLy8gY2Fubm90IHVzZSB0aW55UHJvcGVydHkubGluaygpIGJlY2F1c2Ugb2Ygd3JvbmcgdGhpc1xyXG4gICAgbGlzdGVuZXIoIHRoaXMuZ2V0KCksIG51bGwsIHRoaXMgKTsgLy8gbnVsbCBzaG91bGQgYmUgdXNlZCB3aGVuIGFuIG9iamVjdCBpcyBleHBlY3RlZCBidXQgdW5hdmFpbGFibGVcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZCBhIGxpc3RlbmVyIHRvIHRoZSBQcm9wZXJ0eSwgd2l0aG91dCBjYWxsaW5nIGl0IGJhY2sgcmlnaHQgYXdheS4gVGhpcyBpcyB1c2VkIHdoZW4geW91IG5lZWQgdG8gcmVnaXN0ZXIgYVxyXG4gICAqIGxpc3RlbmVyIHdpdGhvdXQgYW4gaW1tZWRpYXRlIGNhbGxiYWNrLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBsYXp5TGluayggbGlzdGVuZXI6IFByb3BlcnR5TGF6eUxpbmtMaXN0ZW5lcjxUPiwgb3B0aW9ucz86IExpbmtPcHRpb25zICk6IHZvaWQge1xyXG4gICAgaWYgKCBvcHRpb25zICYmIG9wdGlvbnMucGhldGlvRGVwZW5kZW5jaWVzICkge1xyXG4gICAgICB0aGlzLmFkZFBoZXRpb1N0YXRlRGVwZW5kZW5jaWVzKCBvcHRpb25zLnBoZXRpb0RlcGVuZGVuY2llcyApO1xyXG4gICAgfVxyXG4gICAgdGhpcy50aW55UHJvcGVydHkubGF6eUxpbmsoIGxpc3RlbmVyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmVzIGEgbGlzdGVuZXIuIElmIGxpc3RlbmVyIGlzIG5vdCByZWdpc3RlcmVkLCB0aGlzIGlzIGEgbm8tb3AuXHJcbiAgICovXHJcbiAgcHVibGljIHVubGluayggbGlzdGVuZXI6IFByb3BlcnR5TGlzdGVuZXI8VD4gKTogdm9pZCB7XHJcbiAgICB0aGlzLnRpbnlQcm9wZXJ0eS51bmxpbmsoIGxpc3RlbmVyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMuIElmIG5vIGxpc3RlbmVycyBhcmUgcmVnaXN0ZXJlZCwgdGhpcyBpcyBhIG5vLW9wLlxyXG4gICAqL1xyXG4gIHB1YmxpYyB1bmxpbmtBbGwoKTogdm9pZCB7XHJcbiAgICB0aGlzLnRpbnlQcm9wZXJ0eS51bmxpbmtBbGwoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIExpbmtzIGFuIG9iamVjdCdzIG5hbWVkIGF0dHJpYnV0ZSB0byB0aGlzIHByb3BlcnR5LiAgUmV0dXJucyBhIGhhbmRsZSBzbyBpdCBjYW4gYmUgcmVtb3ZlZCB1c2luZyBQcm9wZXJ0eS51bmxpbmsoKTtcclxuICAgKiBFeGFtcGxlOiBtb2RlbFZpc2libGVQcm9wZXJ0eS5saW5rQXR0cmlidXRlKHZpZXcsJ3Zpc2libGUnKTtcclxuICAgKlxyXG4gICAqIE5PVEU6IER1cGxpY2F0ZWQgd2l0aCBUaW55UHJvcGVydHkubGlua0F0dHJpYnV0ZVxyXG4gICAqL1xyXG4gIHB1YmxpYyBsaW5rQXR0cmlidXRlKCBvYmplY3Q6IEludGVudGlvbmFsQW55LCBhdHRyaWJ1dGVOYW1lOiBzdHJpbmcgKTogKCB2YWx1ZTogVCApID0+IHZvaWQge1xyXG4gICAgY29uc3QgaGFuZGxlID0gKCB2YWx1ZTogVCApID0+IHsgb2JqZWN0WyBhdHRyaWJ1dGVOYW1lIF0gPSB2YWx1ZTsgfTtcclxuICAgIHRoaXMubGluayggaGFuZGxlICk7XHJcbiAgICByZXR1cm4gaGFuZGxlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUHJvdmlkZSB0b1N0cmluZyBmb3IgY29uc29sZSBkZWJ1Z2dpbmcsIHNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI0ODU2MzIvdmFsdWVvZi12cy10b3N0cmluZy1pbi1qYXZhc2NyaXB0XHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIHRvU3RyaW5nKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gYFByb3BlcnR5IyR7dGhpcy5pZH17JHt0aGlzLmdldCgpfX1gO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29udmVuaWVuY2UgZnVuY3Rpb24gZm9yIGRlYnVnZ2luZyBhIFByb3BlcnR5J3MgdmFsdWUuIEl0IHByaW50cyB0aGUgbmV3IHZhbHVlIG9uIHJlZ2lzdHJhdGlvbiBhbmQgd2hlbiBjaGFuZ2VkLlxyXG4gICAqIEBwYXJhbSBuYW1lIC0gZGVidWcgbmFtZSB0byBiZSBwcmludGVkIG9uIHRoZSBjb25zb2xlXHJcbiAgICogQHJldHVybnMgLSB0aGUgaGFuZGxlIHRvIHRoZSBsaW5rZWQgbGlzdGVuZXIgaW4gY2FzZSBpdCBuZWVkcyB0byBiZSByZW1vdmVkIGxhdGVyXHJcbiAgICovXHJcbiAgcHVibGljIGRlYnVnKCBuYW1lOiBzdHJpbmcgKTogKCB2YWx1ZTogVCApID0+IHZvaWQge1xyXG4gICAgY29uc3QgbGlzdGVuZXIgPSAoIHZhbHVlOiBUICkgPT4gY29uc29sZS5sb2coIG5hbWUsIHZhbHVlICk7XHJcbiAgICB0aGlzLmxpbmsoIGxpc3RlbmVyICk7XHJcbiAgICByZXR1cm4gbGlzdGVuZXI7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaXNWYWx1ZVZhbGlkKCB2YWx1ZTogVCApOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmdldFZhbGlkYXRpb25FcnJvciggdmFsdWUgKSA9PT0gbnVsbDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXRWYWxpZGF0aW9uRXJyb3IoIHZhbHVlOiBUICk6IHN0cmluZyB8IG51bGwge1xyXG4gICAgcmV0dXJuIFZhbGlkYXRpb24uZ2V0VmFsaWRhdGlvbkVycm9yKCB2YWx1ZSwgdGhpcy52YWx1ZVZhbGlkYXRvciwgVkFMSURBVEVfT1BUSU9OU19GQUxTRSApO1xyXG4gIH1cclxuXHJcbiAgLy8gRW5zdXJlcyB0aGF0IHRoZSBQcm9wZXJ0eSBpcyBlbGlnaWJsZSBmb3IgR0NcclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuXHJcbiAgICAvLyB1bnJlZ2lzdGVyIGFueSBvcmRlciBkZXBlbmRlbmNpZXMgZm9yIHRoaXMgUHJvcGVydHkgZm9yIFBoRVQtaU8gc3RhdGVcclxuICAgIGlmICggdGhpcy5pc1BoZXRpb0luc3RydW1lbnRlZCgpICkge1xyXG4gICAgICBwcm9wZXJ0eVN0YXRlSGFuZGxlclNpbmdsZXRvbi51bnJlZ2lzdGVyT3JkZXJEZXBlbmRlbmNpZXNGb3JQcm9wZXJ0eSggdGhpcyApO1xyXG4gICAgfVxyXG5cclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICAgIHRoaXMudGlueVByb3BlcnR5LmRpc3Bvc2UoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrcyB3aGV0aGVyIGEgbGlzdGVuZXIgaXMgcmVnaXN0ZXJlZCB3aXRoIHRoaXMgUHJvcGVydHlcclxuICAgKi9cclxuICBwdWJsaWMgaGFzTGlzdGVuZXIoIGxpc3RlbmVyOiBQcm9wZXJ0eUxpbmtMaXN0ZW5lcjxUPiApOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLnRpbnlQcm9wZXJ0eS5oYXNMaXN0ZW5lciggbGlzdGVuZXIgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG51bWJlciBvZiBsaXN0ZW5lcnMuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnZXRMaXN0ZW5lckNvdW50KCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy50aW55UHJvcGVydHkuZ2V0TGlzdGVuZXJDb3VudCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW52b2tlcyBhIGNhbGxiYWNrIG9uY2UgZm9yIGVhY2ggbGlzdGVuZXJcclxuICAgKiBAcGFyYW0gY2FsbGJhY2sgLSB0YWtlcyB0aGUgbGlzdGVuZXIgYXMgYW4gYXJndW1lbnRcclxuICAgKi9cclxuICBwdWJsaWMgZm9yRWFjaExpc3RlbmVyKCBjYWxsYmFjazogKCB2YWx1ZTogKCAuLi5hcmdzOiBbIFQsIFQgfCBudWxsLCBUaW55UHJvcGVydHk8VD4gfCBSZWFkT25seVByb3BlcnR5PFQ+IF0gKSA9PiB2b2lkICkgPT4gdm9pZCApOiB2b2lkIHtcclxuICAgIHRoaXMudGlueVByb3BlcnR5LmZvckVhY2hMaXN0ZW5lciggY2FsbGJhY2sgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGVyZSBhcmUgYW55IGxpc3RlbmVycy5cclxuICAgKi9cclxuICBwdWJsaWMgaGFzTGlzdGVuZXJzKCk6IGJvb2xlYW4ge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggYXJndW1lbnRzLmxlbmd0aCA9PT0gMCwgJ1Byb3BlcnR5Lmhhc0xpc3RlbmVycyBzaG91bGQgYmUgY2FsbGVkIHdpdGhvdXQgYXJndW1lbnRzJyApO1xyXG4gICAgcmV0dXJuIHRoaXMudGlueVByb3BlcnR5Lmhhc0xpc3RlbmVycygpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldCB2YWx1ZUNvbXBhcmlzb25TdHJhdGVneSgpOiBWYWx1ZUNvbXBhcmlzb25TdHJhdGVneTxUPiB7XHJcbiAgICByZXR1cm4gdGhpcy50aW55UHJvcGVydHkudmFsdWVDb21wYXJpc29uU3RyYXRlZ3k7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0IHZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5KCB2YWx1ZUNvbXBhcmlzb25TdHJhdGVneTogVmFsdWVDb21wYXJpc29uU3RyYXRlZ3k8VD4gKSB7XHJcbiAgICB0aGlzLnRpbnlQcm9wZXJ0eS52YWx1ZUNvbXBhcmlzb25TdHJhdGVneSA9IHZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5O1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEFuIG9ic2VydmFibGUgUHJvcGVydHkgdGhhdCB0cmlnZ2VycyBub3RpZmljYXRpb25zIHdoZW4gdGhlIHZhbHVlIGNoYW5nZXMuXHJcbiAgICogVGhpcyBjYWNoaW5nIGltcGxlbWVudGF0aW9uIHNob3VsZCBiZSBrZXB0IGluIHN5bmMgd2l0aCB0aGUgb3RoZXIgcGFyYW1ldHJpYyBJT1R5cGUgY2FjaGluZyBpbXBsZW1lbnRhdGlvbnMuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBQcm9wZXJ0eUlPPFQsIFN0YXRlVHlwZT4oIHBhcmFtZXRlclR5cGU6IElPVHlwZTxULCBTdGF0ZVR5cGU+ICk6IElPVHlwZSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBwYXJhbWV0ZXJUeXBlLCAnUHJvcGVydHlJTyBuZWVkcyBwYXJhbWV0ZXJUeXBlJyApO1xyXG5cclxuICAgIGlmICggIWNhY2hlLmhhcyggcGFyYW1ldGVyVHlwZSApICkge1xyXG4gICAgICBjYWNoZS5zZXQoIHBhcmFtZXRlclR5cGUsIG5ldyBJT1R5cGU8UmVhZE9ubHlQcm9wZXJ0eTxUPiwgUmVhZE9ubHlQcm9wZXJ0eVN0YXRlPFN0YXRlVHlwZT4+KCBgUHJvcGVydHlJTzwke3BhcmFtZXRlclR5cGUudHlwZU5hbWV9PmAsIHtcclxuXHJcbiAgICAgICAgLy8gV2Ugd2FudCBQcm9wZXJ0eUlPIHRvIHdvcmsgZm9yIER5bmFtaWNQcm9wZXJ0eSBhbmQgRGVyaXZlZFByb3BlcnR5LCBidXQgdGhleSBleHRlbmQgUmVhZE9ubHlQcm9wZXJ0eVxyXG4gICAgICAgIHZhbHVlVHlwZTogUmVhZE9ubHlQcm9wZXJ0eSxcclxuICAgICAgICBkb2N1bWVudGF0aW9uOiAnT2JzZXJ2YWJsZSB2YWx1ZXMgdGhhdCBzZW5kIG91dCBub3RpZmljYXRpb25zIHdoZW4gdGhlIHZhbHVlIGNoYW5nZXMuIFRoaXMgZGlmZmVycyBmcm9tIHRoZSAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAndHJhZGl0aW9uYWwgbGlzdGVuZXIgcGF0dGVybiBpbiB0aGF0IGFkZGVkIGxpc3RlbmVycyBhbHNvIHJlY2VpdmUgYSBjYWxsYmFjayB3aXRoIHRoZSBjdXJyZW50IHZhbHVlICcgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICd3aGVuIHRoZSBsaXN0ZW5lcnMgYXJlIHJlZ2lzdGVyZWQuIFRoaXMgaXMgYSB3aWRlbHktdXNlZCBwYXR0ZXJuIGluIFBoRVQtaU8gc2ltdWxhdGlvbnMuJyxcclxuICAgICAgICBtZXRob2RPcmRlcjogWyAnbGluaycsICdsYXp5TGluaycgXSxcclxuICAgICAgICBldmVudHM6IFsgUmVhZE9ubHlQcm9wZXJ0eS5DSEFOR0VEX0VWRU5UX05BTUUgXSxcclxuICAgICAgICBwYXJhbWV0ZXJUeXBlczogWyBwYXJhbWV0ZXJUeXBlIF0sXHJcbiAgICAgICAgdG9TdGF0ZU9iamVjdDogcHJvcGVydHkgPT4ge1xyXG4gICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggcGFyYW1ldGVyVHlwZS50b1N0YXRlT2JqZWN0LCBgdG9TdGF0ZU9iamVjdCBkb2Vzbid0IGV4aXN0IGZvciAke3BhcmFtZXRlclR5cGUudHlwZU5hbWV9YCApO1xyXG4gICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdmFsdWU6IHBhcmFtZXRlclR5cGUudG9TdGF0ZU9iamVjdCggcHJvcGVydHkudmFsdWUgKSxcclxuICAgICAgICAgICAgdmFsaWRWYWx1ZXM6IE51bGxhYmxlSU8oIEFycmF5SU8oIHBhcmFtZXRlclR5cGUgKSApLnRvU3RhdGVPYmplY3QoIHByb3BlcnR5LnZhbGlkVmFsdWVzID09PSB1bmRlZmluZWQgPyBudWxsIDogcHJvcGVydHkudmFsaWRWYWx1ZXMgKSxcclxuICAgICAgICAgICAgdW5pdHM6IE51bGxhYmxlSU8oIFN0cmluZ0lPICkudG9TdGF0ZU9iamVjdCggcHJvcGVydHkudW5pdHMgKVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGFwcGx5U3RhdGU6ICggcHJvcGVydHksIHN0YXRlT2JqZWN0ICkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgdW5pdHMgPSBOdWxsYWJsZUlPKCBTdHJpbmdJTyApLmZyb21TdGF0ZU9iamVjdCggc3RhdGVPYmplY3QudW5pdHMgKTtcclxuICAgICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHByb3BlcnR5LnVuaXRzID09PSB1bml0cywgJ1Byb3BlcnR5IHVuaXRzIGRvIG5vdCBtYXRjaCcgKTtcclxuICAgICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHByb3BlcnR5LmlzU2V0dGFibGUoKSwgJ1Byb3BlcnR5IHNob3VsZCBiZSBzZXR0YWJsZScgKTtcclxuICAgICAgICAgIHByb3BlcnR5LnVuZ3VhcmRlZFNldCggcGFyYW1ldGVyVHlwZS5mcm9tU3RhdGVPYmplY3QoIHN0YXRlT2JqZWN0LnZhbHVlICkgKTtcclxuXHJcbiAgICAgICAgICBpZiAoIHN0YXRlT2JqZWN0LnZhbGlkVmFsdWVzICkge1xyXG4gICAgICAgICAgICBwcm9wZXJ0eS52YWxpZFZhbHVlcyA9IHN0YXRlT2JqZWN0LnZhbGlkVmFsdWVzLm1hcCggKCB2YWxpZFZhbHVlOiBTdGF0ZVR5cGUgKSA9PiBwYXJhbWV0ZXJUeXBlLmZyb21TdGF0ZU9iamVjdCggdmFsaWRWYWx1ZSApICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzdGF0ZVNjaGVtYToge1xyXG4gICAgICAgICAgdmFsdWU6IHBhcmFtZXRlclR5cGUsXHJcbiAgICAgICAgICB2YWxpZFZhbHVlczogTnVsbGFibGVJTyggQXJyYXlJTyggcGFyYW1ldGVyVHlwZSApICksXHJcbiAgICAgICAgICB1bml0czogTnVsbGFibGVJTyggU3RyaW5nSU8gKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbWV0aG9kczoge1xyXG4gICAgICAgICAgZ2V0VmFsdWU6IHtcclxuICAgICAgICAgICAgcmV0dXJuVHlwZTogcGFyYW1ldGVyVHlwZSxcclxuICAgICAgICAgICAgcGFyYW1ldGVyVHlwZXM6IFtdLFxyXG4gICAgICAgICAgICBpbXBsZW1lbnRhdGlvbjogUmVhZE9ubHlQcm9wZXJ0eS5wcm90b3R5cGUuZ2V0LFxyXG4gICAgICAgICAgICBkb2N1bWVudGF0aW9uOiAnR2V0cyB0aGUgY3VycmVudCB2YWx1ZS4nXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZ2V0VmFsaWRhdGlvbkVycm9yOiB7XHJcbiAgICAgICAgICAgIHJldHVyblR5cGU6IE51bGxhYmxlSU8oIFN0cmluZ0lPICksXHJcbiAgICAgICAgICAgIHBhcmFtZXRlclR5cGVzOiBbIHBhcmFtZXRlclR5cGUgXSxcclxuICAgICAgICAgICAgaW1wbGVtZW50YXRpb246IFJlYWRPbmx5UHJvcGVydHkucHJvdG90eXBlLmdldFZhbGlkYXRpb25FcnJvcixcclxuICAgICAgICAgICAgZG9jdW1lbnRhdGlvbjogJ0NoZWNrcyB0byBzZWUgaWYgYSBwcm9wb3NlZCB2YWx1ZSBpcyB2YWxpZC4gUmV0dXJucyB0aGUgZmlyc3QgdmFsaWRhdGlvbiBlcnJvciwgb3IgbnVsbCBpZiB0aGUgdmFsdWUgaXMgdmFsaWQuJ1xyXG4gICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICBzZXRWYWx1ZToge1xyXG4gICAgICAgICAgICByZXR1cm5UeXBlOiBWb2lkSU8sXHJcbiAgICAgICAgICAgIHBhcmFtZXRlclR5cGVzOiBbIHBhcmFtZXRlclR5cGUgXSxcclxuICAgICAgICAgICAgaW1wbGVtZW50YXRpb246IGZ1bmN0aW9uKCB0aGlzOiBSZWFkT25seVByb3BlcnR5PHVua25vd24+LCB2YWx1ZTogVCApIHtcclxuICAgICAgICAgICAgICB0aGlzLnNldCggdmFsdWUgKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZG9jdW1lbnRhdGlvbjogJ1NldHMgdGhlIHZhbHVlIG9mIHRoZSBQcm9wZXJ0eS4gSWYgdGhlIHZhbHVlIGRpZmZlcnMgZnJvbSB0aGUgcHJldmlvdXMgdmFsdWUsIGxpc3RlbmVycyBhcmUgJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICdub3RpZmllZCB3aXRoIHRoZSBuZXcgdmFsdWUuJyxcclxuICAgICAgICAgICAgaW52b2NhYmxlRm9yUmVhZE9ubHlFbGVtZW50czogZmFsc2VcclxuICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgbGluazoge1xyXG4gICAgICAgICAgICByZXR1cm5UeXBlOiBWb2lkSU8sXHJcblxyXG4gICAgICAgICAgICAvLyBvbGRWYWx1ZSB3aWxsIHN0YXJ0IGFzIFwibnVsbFwiIHRoZSBmaXJzdCB0aW1lIGNhbGxlZFxyXG4gICAgICAgICAgICBwYXJhbWV0ZXJUeXBlczogWyBGdW5jdGlvbklPKCBWb2lkSU8sIFsgcGFyYW1ldGVyVHlwZSwgTnVsbGFibGVJTyggcGFyYW1ldGVyVHlwZSApIF0gKSBdLFxyXG4gICAgICAgICAgICBpbXBsZW1lbnRhdGlvbjogUmVhZE9ubHlQcm9wZXJ0eS5wcm90b3R5cGUubGluayxcclxuICAgICAgICAgICAgZG9jdW1lbnRhdGlvbjogJ0FkZHMgYSBsaXN0ZW5lciB3aGljaCB3aWxsIGJlIGNhbGxlZCB3aGVuIHRoZSB2YWx1ZSBjaGFuZ2VzLiBPbiByZWdpc3RyYXRpb24sIHRoZSBsaXN0ZW5lciBpcyAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2Fsc28gY2FsbGVkIHdpdGggdGhlIGN1cnJlbnQgdmFsdWUuIFRoZSBsaXN0ZW5lciB0YWtlcyB0d28gYXJndW1lbnRzLCB0aGUgbmV3IHZhbHVlIGFuZCB0aGUgJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICdwcmV2aW91cyB2YWx1ZS4nXHJcbiAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgIGxhenlMaW5rOiB7XHJcbiAgICAgICAgICAgIHJldHVyblR5cGU6IFZvaWRJTyxcclxuXHJcbiAgICAgICAgICAgIC8vIG9sZFZhbHVlIHdpbGwgc3RhcnQgYXMgXCJudWxsXCIgdGhlIGZpcnN0IHRpbWUgY2FsbGVkXHJcbiAgICAgICAgICAgIHBhcmFtZXRlclR5cGVzOiBbIEZ1bmN0aW9uSU8oIFZvaWRJTywgWyBwYXJhbWV0ZXJUeXBlLCBOdWxsYWJsZUlPKCBwYXJhbWV0ZXJUeXBlICkgXSApIF0sXHJcbiAgICAgICAgICAgIGltcGxlbWVudGF0aW9uOiBSZWFkT25seVByb3BlcnR5LnByb3RvdHlwZS5sYXp5TGluayxcclxuICAgICAgICAgICAgZG9jdW1lbnRhdGlvbjogJ0FkZHMgYSBsaXN0ZW5lciB3aGljaCB3aWxsIGJlIGNhbGxlZCB3aGVuIHRoZSB2YWx1ZSBjaGFuZ2VzLiBUaGlzIG1ldGhvZCBpcyBsaWtlIFwibGlua1wiLCBidXQgJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICd3aXRob3V0IHRoZSBjdXJyZW50LXZhbHVlIGNhbGxiYWNrIG9uIHJlZ2lzdHJhdGlvbi4gVGhlIGxpc3RlbmVyIHRha2VzIHR3byBhcmd1bWVudHMsIHRoZSBuZXcgJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICd2YWx1ZSBhbmQgdGhlIHByZXZpb3VzIHZhbHVlLidcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB1bmxpbms6IHtcclxuICAgICAgICAgICAgcmV0dXJuVHlwZTogVm9pZElPLFxyXG4gICAgICAgICAgICBwYXJhbWV0ZXJUeXBlczogWyBGdW5jdGlvbklPKCBWb2lkSU8sIFsgcGFyYW1ldGVyVHlwZSBdICkgXSxcclxuICAgICAgICAgICAgaW1wbGVtZW50YXRpb246IFJlYWRPbmx5UHJvcGVydHkucHJvdG90eXBlLnVubGluayxcclxuICAgICAgICAgICAgZG9jdW1lbnRhdGlvbjogJ1JlbW92ZXMgYSBsaXN0ZW5lci4nXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9ICkgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0KCBwYXJhbWV0ZXJUeXBlICkhO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU3VwcG9ydCB0cmVhdGluZyBvdXJzZWx2ZXMgYXMgYW4gYXV0b3NlbGVjdGFibGUgZW50aXR5IGZvciB0aGUgXCJzdHJpbmdzXCIgc2VsZWN0aW9uIG1vZGUuXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGdldFBoZXRpb01vdXNlSGl0VGFyZ2V0KCBmcm9tTGlua2luZyA9IGZhbHNlICk6IFBoZXRpb09iamVjdCB8ICdwaGV0aW9Ob3RTZWxlY3RhYmxlJyB7XHJcblxyXG4gICAgaWYgKCBwaGV0LnRhbmRlbS5waGV0aW9FbGVtZW50U2VsZWN0aW9uUHJvcGVydHkudmFsdWUgPT09ICdzdHJpbmcnICkge1xyXG5cclxuICAgICAgLy8gQXMgb2YgdGhpcyB3cml0aW5nLCB0aGUgb25seSB3YXkgdG8gZ2V0IHRvIHRoaXMgZnVuY3Rpb24gaXMgZm9yIFByb3BlcnRpZXMgdGhhdCBoYXZlIGEgdmFsdWUgb2Ygc3RyaW5ncywgYnV0XHJcbiAgICAgIC8vIGluIHRoZSBmdXR1cmUgdGhhdCBtYXkgbm90IGJlIHRoZSBjYXNlLiBTUiBhbmQgTUsgc3RpbGwgdGhpbmsgaXQgaXMgcHJlZmVyYWJsZSB0byBrZWVwIHRoaXMgZ2VuZXJhbCwgYXMgZmFsc2VcclxuICAgICAgLy8gcG9zaXRpdmVzIGZvciBhdXRvc2VsZWN0IGFyZSBnZW5lcmFsbHkgYmV0dGVyIHRoYW4gZmFsc2UgbmVnYXRpdmVzLlxyXG4gICAgICByZXR1cm4gdGhpcy5nZXRQaGV0aW9Nb3VzZUhpdFRhcmdldFNlbGYoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc3VwZXIuZ2V0UGhldGlvTW91c2VIaXRUYXJnZXQoIGZyb21MaW5raW5nICk7XHJcbiAgfVxyXG5cclxuXHJcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBDSEFOR0VEX0VWRU5UX05BTUUgPSAnY2hhbmdlZCc7XHJcbn1cclxuXHJcbmF4b24ucmVnaXN0ZXIoICdSZWFkT25seVByb3BlcnR5JywgUmVhZE9ubHlQcm9wZXJ0eSApOyJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsWUFBWSxNQUErQixpQ0FBaUM7QUFDbkYsT0FBT0MsTUFBTSxJQUFJQyxzQkFBc0IsUUFBUSwyQkFBMkI7QUFDMUUsT0FBT0MsT0FBTyxNQUFNLGtDQUFrQztBQUN0RCxPQUFPQyxVQUFVLE1BQU0scUNBQXFDO0FBQzVELE9BQU9DLE1BQU0s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