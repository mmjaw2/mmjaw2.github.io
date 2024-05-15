// Copyright 2013-2022, University of Colorado Boulder

/**
 * Module that includes all axon dependencies, so that requiring this module will return an object
 * that consists of the entire exported 'axon' namespace API.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import './animationFrameTimer.js';
import axon from './axon.js';
import './BooleanProperty.js';
import './CallbackTimer.js';
import './createObservableArray.js';
import './DerivedProperty.js';
import './DynamicProperty.js';
import './Emitter.js';
import './EnumerationDeprecatedProperty.js';
import './MappedProperty.js';
import './Multilink.js';
import './NumberProperty.js';
import './PatternStringProperty.js';
import './Property.js';
import './PropertyStateHandler.js';
import './propertyStateHandlerSingleton.js';
import './PropertyStatePhase.js';
import './stepTimer.js';
import './StringProperty.js';
import './Timer.js';
import './TinyEmitter.js';
import './TinyForwardingProperty.js';
import './TinyOverrideProperty.js';
import './TinyProperty.js';
import './TinyStaticProperty.js';
import './UnitConversionProperty.js';
import './units.js';
import './validate.js';
import './Validation.js';
export default axon;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJheG9uIl0sInNvdXJjZXMiOlsibWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxMy0yMDIyLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBNb2R1bGUgdGhhdCBpbmNsdWRlcyBhbGwgYXhvbiBkZXBlbmRlbmNpZXMsIHNvIHRoYXQgcmVxdWlyaW5nIHRoaXMgbW9kdWxlIHdpbGwgcmV0dXJuIGFuIG9iamVjdFxyXG4gKiB0aGF0IGNvbnNpc3RzIG9mIHRoZSBlbnRpcmUgZXhwb3J0ZWQgJ2F4b24nIG5hbWVzcGFjZSBBUEkuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgJy4vYW5pbWF0aW9uRnJhbWVUaW1lci5qcyc7XHJcbmltcG9ydCBheG9uIGZyb20gJy4vYXhvbi5qcyc7XHJcbmltcG9ydCAnLi9Cb29sZWFuUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgJy4vQ2FsbGJhY2tUaW1lci5qcyc7XHJcbmltcG9ydCAnLi9jcmVhdGVPYnNlcnZhYmxlQXJyYXkuanMnO1xyXG5pbXBvcnQgJy4vRGVyaXZlZFByb3BlcnR5LmpzJztcclxuaW1wb3J0ICcuL0R5bmFtaWNQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCAnLi9FbWl0dGVyLmpzJztcclxuaW1wb3J0ICcuL0VudW1lcmF0aW9uRGVwcmVjYXRlZFByb3BlcnR5LmpzJztcclxuaW1wb3J0ICcuL01hcHBlZFByb3BlcnR5LmpzJztcclxuaW1wb3J0ICcuL011bHRpbGluay5qcyc7XHJcbmltcG9ydCAnLi9OdW1iZXJQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCAnLi9QYXR0ZXJuU3RyaW5nUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgJy4vUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgJy4vUHJvcGVydHlTdGF0ZUhhbmRsZXIuanMnO1xyXG5pbXBvcnQgJy4vcHJvcGVydHlTdGF0ZUhhbmRsZXJTaW5nbGV0b24uanMnO1xyXG5pbXBvcnQgJy4vUHJvcGVydHlTdGF0ZVBoYXNlLmpzJztcclxuaW1wb3J0ICcuL3N0ZXBUaW1lci5qcyc7XHJcbmltcG9ydCAnLi9TdHJpbmdQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCAnLi9UaW1lci5qcyc7XHJcbmltcG9ydCAnLi9UaW55RW1pdHRlci5qcyc7XHJcbmltcG9ydCAnLi9UaW55Rm9yd2FyZGluZ1Byb3BlcnR5LmpzJztcclxuaW1wb3J0ICcuL1RpbnlPdmVycmlkZVByb3BlcnR5LmpzJztcclxuaW1wb3J0ICcuL1RpbnlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCAnLi9UaW55U3RhdGljUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgJy4vVW5pdENvbnZlcnNpb25Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCAnLi91bml0cy5qcyc7XHJcbmltcG9ydCAnLi92YWxpZGF0ZS5qcyc7XHJcbmltcG9ydCAnLi9WYWxpZGF0aW9uLmpzJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGF4b247Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBTywwQkFBMEI7QUFDakMsT0FBT0EsSUFBSSxNQUFNLFdBQVc7QUFDNUIsT0FBTyxzQkFBc0I7QUFDN0IsT0FBTyxvQkFBb0I7QUFDM0IsT0FBTyw0QkFBNEI7QUFDbkMsT0FBTyxzQkFBc0I7QUFDN0IsT0FBTyxzQkFBc0I7QUFDN0IsT0FBTyxjQUFjO0FBQ3JCLE9BQU8sb0NBQW9DO0FBQzNDLE9BQU8scUJBQXFCO0FBQzVCLE9BQU8sZ0JBQWdCO0FBQ3ZCLE9BQU8scUJBQXFCO0FBQzVCLE9BQU8sNEJBQTRCO0FBQ25DLE9BQU8sZUFBZTtBQUN0QixPQUFPLDJCQUEyQjtBQUNsQyxPQUFPLG9DQUFvQztBQUMzQyxPQUFPLHlCQUF5QjtBQUNoQyxPQUFPLGdCQUFnQjtBQUN2QixPQUFPLHFCQUFxQjtBQUM1QixPQUFPLFlBQVk7QUFDbkIsT0FBTyxrQkFBa0I7QUFDekIsT0FBTyw2QkFBNkI7QUFDcEMsT0FBTywyQkFBMkI7QUFDbEMsT0FBTyxtQkFBbUI7QUFDMUIsT0FBTyx5QkFBeUI7QUFDaEMsT0FBTyw2QkFBNkI7QUFDcEMsT0FBTyxZQUFZO0FBQ25CLE9BQU8sZUFBZTtBQUN0QixPQUFPLGlCQUFpQjtBQUV4QixlQUFlQSxJQUFJIiwiaWdub3JlTGlzdCI6W119