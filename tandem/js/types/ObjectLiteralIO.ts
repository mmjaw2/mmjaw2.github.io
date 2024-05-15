// Copyright 2021-2024, University of Colorado Boulder

import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import tandemNamespace from '../tandemNamespace.js';
import IOType from './IOType.js';
import StateSchema from './StateSchema.js';
import ValueIO from './ValueIO.js';

type ObjectIOState = Record<string, IntentionalAny>;
const noExtraPrototype = ( object: object ) => Object.getPrototypeOf( object ) === Object.prototype;
/**
 * IOType intended for usage with object literals, primarily for toStateObject/fromStateObject.
 * @author Sam Reid (PhET Interactive Simulations)
 */
const ObjectLiteralIO = new IOType<object, ObjectIOState>( 'ObjectLiteralIO', {
  documentation: 'PhET-iO Type for object literals',
  isValidValue: noExtraPrototype,
  supertype: ValueIO,
  stateSchema: StateSchema.asValue<ObjectIOState, ObjectIOState>( 'object', { valueType: Object, isValidValue: noExtraPrototype } ),
  toStateObject: _.identity
} );

tandemNamespace.register( 'ObjectLiteralIO', ObjectLiteralIO );
export default ObjectLiteralIO;