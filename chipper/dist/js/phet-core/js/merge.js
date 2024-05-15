// Copyright 2019-2023, University of Colorado Boulder

/**
 * Like Lodash's _.merge, this will recursively merge nested options objects provided that the keys end in 'Options'
 * (case sensitive) and they are pure object literals.
 * That is, they must be defined by `... = { ... }` or `somePropOptions: { ... }`.
 * Non object literals (arrays, functions, and inherited types) or anything with an extra prototype will all throw
 * assertion errors if passed in as an arg or as a value to a `*Options` field.
 *
 * @author Michael Barlow (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import phetCore from './phetCore.js';
// constants
const OPTIONS_SUFFIX = 'Options';

// Function overloading is described in https://www.tutorialsteacher.com/typescript/function-overloading

/**
 * @param  {Object} target - the object literal that will have keys set to it
 * @param  {...<Object|null>} sources
 */
function merge(target, ...sources) {
  assert && assertIsMergeable(target);
  assert && assert(target !== null, 'target should not be null'); // assertIsMergeable supports null
  assert && assert(sources.length > 0, 'at least one source expected');
  _.each(sources, source => {
    if (source) {
      assert && assertIsMergeable(source);
      for (const property in source) {
        // Providing a value of undefined in the target doesn't override the default, see https://github.com/phetsims/phet-core/issues/111
        if (source.hasOwnProperty(property) && source[property] !== undefined) {
          const sourceProperty = source[property];

          // Recurse on keys that end with 'Options', but not on keys named 'Options'.
          if (_.endsWith(property, OPTIONS_SUFFIX) && property !== OPTIONS_SUFFIX) {
            // *Options property value cannot be undefined, if truthy, it we be validated with assertIsMergeable via recursion.
            assert && assert(sourceProperty !== undefined, 'nested *Options should not be undefined');
            target[property] = merge(target[property] || {}, sourceProperty);
          } else {
            target[property] = sourceProperty;
          }
        }
      }
    }
  });
  return target;
}

/**
 * TODO: can we remove assertIsMergeable? https://github.com/phetsims/phet-core/issues/128
 * Asserts that the object is compatible with merge. That is, it's a POJSO.
 * This function must be called like: assert && assertIsMergeable( arg );
 */
function assertIsMergeable(object) {
  assert && assert(object === null || object && typeof object === 'object' && Object.getPrototypeOf(object) === Object.prototype, 'object is not compatible with merge');
  if (object !== null) {
    // ensure that options keys are not ES5 setters or getters
    Object.keys(object).forEach(prop => {
      const ownPropertyDescriptor = Object.getOwnPropertyDescriptor(object, prop);
      assert && assert(!ownPropertyDescriptor.hasOwnProperty('set'), 'cannot use merge with an object that has a setter');
      assert && assert(!ownPropertyDescriptor.hasOwnProperty('get'), 'cannot use merge with an object that has a getter');
    });
  }
}
phetCore.register('merge', merge);
export default merge;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwaGV0Q29yZSIsIk9QVElPTlNfU1VGRklYIiwibWVyZ2UiLCJ0YXJnZXQiLCJzb3VyY2VzIiwiYXNzZXJ0IiwiYXNzZXJ0SXNNZXJnZWFibGUiLCJsZW5ndGgiLCJfIiwiZWFjaCIsInNvdXJjZSIsInByb3BlcnR5IiwiaGFzT3duUHJvcGVydHkiLCJ1bmRlZmluZWQiLCJzb3VyY2VQcm9wZXJ0eSIsImVuZHNXaXRoIiwib2JqZWN0IiwiT2JqZWN0IiwiZ2V0UHJvdG90eXBlT2YiLCJwcm90b3R5cGUiLCJrZXlzIiwiZm9yRWFjaCIsInByb3AiLCJvd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIm1lcmdlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE5LTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIExpa2UgTG9kYXNoJ3MgXy5tZXJnZSwgdGhpcyB3aWxsIHJlY3Vyc2l2ZWx5IG1lcmdlIG5lc3RlZCBvcHRpb25zIG9iamVjdHMgcHJvdmlkZWQgdGhhdCB0aGUga2V5cyBlbmQgaW4gJ09wdGlvbnMnXHJcbiAqIChjYXNlIHNlbnNpdGl2ZSkgYW5kIHRoZXkgYXJlIHB1cmUgb2JqZWN0IGxpdGVyYWxzLlxyXG4gKiBUaGF0IGlzLCB0aGV5IG11c3QgYmUgZGVmaW5lZCBieSBgLi4uID0geyAuLi4gfWAgb3IgYHNvbWVQcm9wT3B0aW9uczogeyAuLi4gfWAuXHJcbiAqIE5vbiBvYmplY3QgbGl0ZXJhbHMgKGFycmF5cywgZnVuY3Rpb25zLCBhbmQgaW5oZXJpdGVkIHR5cGVzKSBvciBhbnl0aGluZyB3aXRoIGFuIGV4dHJhIHByb3RvdHlwZSB3aWxsIGFsbCB0aHJvd1xyXG4gKiBhc3NlcnRpb24gZXJyb3JzIGlmIHBhc3NlZCBpbiBhcyBhbiBhcmcgb3IgYXMgYSB2YWx1ZSB0byBhIGAqT3B0aW9uc2AgZmllbGQuXHJcbiAqXHJcbiAqIEBhdXRob3IgTWljaGFlbCBCYXJsb3cgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgcGhldENvcmUgZnJvbSAnLi9waGV0Q29yZS5qcyc7XHJcbmltcG9ydCBJbnRlbnRpb25hbEFueSBmcm9tICcuL3R5cGVzL0ludGVudGlvbmFsQW55LmpzJztcclxuXHJcbi8vIGNvbnN0YW50c1xyXG5jb25zdCBPUFRJT05TX1NVRkZJWCA9ICdPcHRpb25zJztcclxuXHJcbi8vIEZ1bmN0aW9uIG92ZXJsb2FkaW5nIGlzIGRlc2NyaWJlZCBpbiBodHRwczovL3d3dy50dXRvcmlhbHN0ZWFjaGVyLmNvbS90eXBlc2NyaXB0L2Z1bmN0aW9uLW92ZXJsb2FkaW5nXHJcbmZ1bmN0aW9uIG1lcmdlPEEsIEI+KCBhOiBBLCBiOiBCICk6IEEgJiBCO1xyXG5mdW5jdGlvbiBtZXJnZTxBLCBCLCBDPiggYTogQSwgYjogQiwgYzogQyApOiBBICYgQiAmIEM7XHJcbmZ1bmN0aW9uIG1lcmdlPEEsIEIsIEMsIEQ+KCBhOiBBLCBiOiBCLCBjOiBDLCBkOiBEICk6IEEgJiBCICYgQyAmIEQ7XHJcbmZ1bmN0aW9uIG1lcmdlPEEsIEIsIEMsIEQsIEU+KCBhOiBBLCBiOiBCLCBjOiBDLCBkOiBELCBlOiBFICk6IEEgJiBCICYgQyAmIEQgJiBFO1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSAge09iamVjdH0gdGFyZ2V0IC0gdGhlIG9iamVjdCBsaXRlcmFsIHRoYXQgd2lsbCBoYXZlIGtleXMgc2V0IHRvIGl0XHJcbiAqIEBwYXJhbSAgey4uLjxPYmplY3R8bnVsbD59IHNvdXJjZXNcclxuICovXHJcbmZ1bmN0aW9uIG1lcmdlKCB0YXJnZXQ6IEludGVudGlvbmFsQW55LCAuLi5zb3VyY2VzOiBJbnRlbnRpb25hbEFueVtdICk6IEludGVudGlvbmFsQW55IHtcclxuICBhc3NlcnQgJiYgYXNzZXJ0SXNNZXJnZWFibGUoIHRhcmdldCApO1xyXG4gIGFzc2VydCAmJiBhc3NlcnQoIHRhcmdldCAhPT0gbnVsbCwgJ3RhcmdldCBzaG91bGQgbm90IGJlIG51bGwnICk7IC8vIGFzc2VydElzTWVyZ2VhYmxlIHN1cHBvcnRzIG51bGxcclxuICBhc3NlcnQgJiYgYXNzZXJ0KCBzb3VyY2VzLmxlbmd0aCA+IDAsICdhdCBsZWFzdCBvbmUgc291cmNlIGV4cGVjdGVkJyApO1xyXG5cclxuICBfLmVhY2goIHNvdXJjZXMsIHNvdXJjZSA9PiB7XHJcbiAgICBpZiAoIHNvdXJjZSApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydElzTWVyZ2VhYmxlKCBzb3VyY2UgKTtcclxuICAgICAgZm9yICggY29uc3QgcHJvcGVydHkgaW4gc291cmNlICkge1xyXG5cclxuICAgICAgICAvLyBQcm92aWRpbmcgYSB2YWx1ZSBvZiB1bmRlZmluZWQgaW4gdGhlIHRhcmdldCBkb2Vzbid0IG92ZXJyaWRlIHRoZSBkZWZhdWx0LCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXQtY29yZS9pc3N1ZXMvMTExXHJcbiAgICAgICAgaWYgKCBzb3VyY2UuaGFzT3duUHJvcGVydHkoIHByb3BlcnR5ICkgJiYgc291cmNlWyBwcm9wZXJ0eSBdICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICBjb25zdCBzb3VyY2VQcm9wZXJ0eSA9IHNvdXJjZVsgcHJvcGVydHkgXTtcclxuXHJcbiAgICAgICAgICAvLyBSZWN1cnNlIG9uIGtleXMgdGhhdCBlbmQgd2l0aCAnT3B0aW9ucycsIGJ1dCBub3Qgb24ga2V5cyBuYW1lZCAnT3B0aW9ucycuXHJcbiAgICAgICAgICBpZiAoIF8uZW5kc1dpdGgoIHByb3BlcnR5LCBPUFRJT05TX1NVRkZJWCApICYmIHByb3BlcnR5ICE9PSBPUFRJT05TX1NVRkZJWCApIHtcclxuXHJcbiAgICAgICAgICAgIC8vICpPcHRpb25zIHByb3BlcnR5IHZhbHVlIGNhbm5vdCBiZSB1bmRlZmluZWQsIGlmIHRydXRoeSwgaXQgd2UgYmUgdmFsaWRhdGVkIHdpdGggYXNzZXJ0SXNNZXJnZWFibGUgdmlhIHJlY3Vyc2lvbi5cclxuICAgICAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggc291cmNlUHJvcGVydHkgIT09IHVuZGVmaW5lZCwgJ25lc3RlZCAqT3B0aW9ucyBzaG91bGQgbm90IGJlIHVuZGVmaW5lZCcgKTtcclxuICAgICAgICAgICAgdGFyZ2V0WyBwcm9wZXJ0eSBdID0gbWVyZ2UoIHRhcmdldFsgcHJvcGVydHkgXSB8fCB7fSwgc291cmNlUHJvcGVydHkgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0YXJnZXRbIHByb3BlcnR5IF0gPSBzb3VyY2VQcm9wZXJ0eTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9ICk7XHJcbiAgcmV0dXJuIHRhcmdldDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFRPRE86IGNhbiB3ZSByZW1vdmUgYXNzZXJ0SXNNZXJnZWFibGU/IGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWNvcmUvaXNzdWVzLzEyOFxyXG4gKiBBc3NlcnRzIHRoYXQgdGhlIG9iamVjdCBpcyBjb21wYXRpYmxlIHdpdGggbWVyZ2UuIFRoYXQgaXMsIGl0J3MgYSBQT0pTTy5cclxuICogVGhpcyBmdW5jdGlvbiBtdXN0IGJlIGNhbGxlZCBsaWtlOiBhc3NlcnQgJiYgYXNzZXJ0SXNNZXJnZWFibGUoIGFyZyApO1xyXG4gKi9cclxuZnVuY3Rpb24gYXNzZXJ0SXNNZXJnZWFibGUoIG9iamVjdDogSW50ZW50aW9uYWxBbnkgKTogdm9pZCB7XHJcbiAgYXNzZXJ0ICYmIGFzc2VydCggb2JqZWN0ID09PSBudWxsIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgKCBvYmplY3QgJiYgdHlwZW9mIG9iamVjdCA9PT0gJ29iamVjdCcgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKCBvYmplY3QgKSA9PT0gT2JqZWN0LnByb3RvdHlwZSApLFxyXG4gICAgJ29iamVjdCBpcyBub3QgY29tcGF0aWJsZSB3aXRoIG1lcmdlJyApO1xyXG5cclxuICBpZiAoIG9iamVjdCAhPT0gbnVsbCApIHtcclxuICAgIC8vIGVuc3VyZSB0aGF0IG9wdGlvbnMga2V5cyBhcmUgbm90IEVTNSBzZXR0ZXJzIG9yIGdldHRlcnNcclxuICAgIE9iamVjdC5rZXlzKCBvYmplY3QgKS5mb3JFYWNoKCBwcm9wID0+IHtcclxuICAgICAgY29uc3Qgb3duUHJvcGVydHlEZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvciggb2JqZWN0LCBwcm9wICkhO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhb3duUHJvcGVydHlEZXNjcmlwdG9yLmhhc093blByb3BlcnR5KCAnc2V0JyApLFxyXG4gICAgICAgICdjYW5ub3QgdXNlIG1lcmdlIHdpdGggYW4gb2JqZWN0IHRoYXQgaGFzIGEgc2V0dGVyJyApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhb3duUHJvcGVydHlEZXNjcmlwdG9yLmhhc093blByb3BlcnR5KCAnZ2V0JyApLFxyXG4gICAgICAgICdjYW5ub3QgdXNlIG1lcmdlIHdpdGggYW4gb2JqZWN0IHRoYXQgaGFzIGEgZ2V0dGVyJyApO1xyXG4gICAgfSApO1xyXG4gIH1cclxufVxyXG5cclxucGhldENvcmUucmVnaXN0ZXIoICdtZXJnZScsIG1lcmdlICk7XHJcbmV4cG9ydCBkZWZhdWx0IG1lcmdlOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsUUFBUSxNQUFNLGVBQWU7QUFHcEM7QUFDQSxNQUFNQyxjQUFjLEdBQUcsU0FBUzs7QUFFaEM7O0FBTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTQyxLQUFLQSxD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