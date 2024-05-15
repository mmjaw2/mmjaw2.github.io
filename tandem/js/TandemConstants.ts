// Copyright 2021-2024, University of Colorado Boulder

import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import PickRequired from '../../phet-core/js/types/PickRequired.js';
import tandemNamespace from './tandemNamespace.js';

/**
 * Factored-out constant values for use in Tandem.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

const OBJECT_IO_TYPE_NAME = 'ObjectIO';
const EVENT_TYPE_MODEL = 'MODEL';

export type PhetioID = string;

export type IOTypeName = string;

export type PhetioElementData = {
  initialState: PhetioElementState;
};

export type PhetioElement = {
  _metadata: PhetioElementMetadata;
  _data?: PhetioElementData;
};

// In tree structure
export type PhetioElements = {

  // Each string is a component name of a PhetioID
  [ name: string ]: PhetioElements;
} & PhetioElement;

export type Method = {
  returnType: string;
  parameterTypes: string[];
  documentation: string;
  invocableForReadOnlyElements?: boolean;
};

// The "top level" state associated with a phetioID in state. This is NOT and never should be a "substate" or nested.
// value within a top-level state.
export type PhetioElementState = Record<string, IntentionalAny>;

export type PhetioState = Record<PhetioID, PhetioElementState>;
export type FullPhetioState = Record<PhetioID, PhetioElementState | 'DELETED'>;

export type Methods = Record<string, Method>;

export type CompositeStateSchemaAPI = Record<string, IOTypeName>;
export type StateSchemaAPI = string | CompositeStateSchemaAPI;

// The API schema, for the actual class on the sim side see IOType.ts
export type PhetioType = {
  methods: Methods;
  supertype?: string; // no supertype for root of hierarchy
  typeName: IOTypeName;
  documentation?: string;
  events: string[];
  metadataDefaults?: Partial<PhetioElementMetadata>;
  dataDefaults?: Record<string, unknown>;
  methodOrder?: string[];
  stateSchema?: StateSchemaAPI;
  parameterTypes?: string[]; // each ioTypeName
};
export type PhetioTypes = Record<IOTypeName, PhetioType>;

export type PhetioOverrides = Record<string, Partial<PhetioElementMetadata>>;

// Abstraction for flattened or treelike PhetioAPI
export type AbstractPhetioAPI = {
  version: {
    major: number;
    minor: number;
  };
  phetioFullAPI?: boolean;
  sim: string;
  phetioTypes: PhetioTypes;
};

// The PhET-iO API json structure as it appears in the api files. This nests PhET-iO Elements like the Studio tree, in
// part to save space in the file.
export type PhetioAPI = AbstractPhetioAPI & { phetioElements: PhetioElements };

// The PhET-iO API as it is easiest to use in code. This takes PhetioAPI type (nested elements) and "expands" (flattens)
// each out so that the keys are phetioIDs.
export type FlattenedAPIPhetioElements = Record<PhetioID, PhetioElement>;

export type PhetioElementMetadata = {

  // Used in PhetioObjectOptions
  phetioState: boolean;
  phetioReadOnly: boolean;
  phetioEventType: string;
  phetioDocumentation: string;
  phetioHighFrequency: boolean; // @deprecated
  phetioPlayback: boolean;
  phetioFeatured?: boolean; // LinkedElements have no phetioFeatured because they defer to their core element
  phetioDynamicElement: boolean;
  phetioDesigned: boolean;

  // Specific to Metadata
  phetioTypeName: IOTypeName;
  phetioIsArchetype: boolean;
  phetioArchetypePhetioID?: string | null;

  // For PhetioDynamicElementContainer.
  phetioDynamicElementName?: string | null;
};

const metadataDefaults: PhetioElementMetadata & PickRequired<PhetioElementMetadata, 'phetioFeatured'> = {
  phetioTypeName: OBJECT_IO_TYPE_NAME,
  phetioDocumentation: '',
  phetioState: true,
  phetioReadOnly: false,

  // NOTE: Relies on the details about how Enumerations are serialized (via name), like EventType.phetioType.toStateObject( object.phetioEventType )
  phetioEventType: EVENT_TYPE_MODEL,
  phetioHighFrequency: false,
  phetioPlayback: false,
  phetioDynamicElement: false,
  phetioIsArchetype: false,
  phetioFeatured: false,
  phetioDesigned: false,
  phetioArchetypePhetioID: null
};

// The base definition of allowed characters in a tandem name. In regex form. This will be added to a character
// class (inside `[]`). See isValidTandemName(). This applies to all Tandem subtypes, not just Tandem()
// Allowable terms for tandems, like myObject, or myObject3[1,4], or MyObject
// Note: This allows some tandems we would not prefer, such as "My,Obje[ct", but we will catch that during the design phase.
// Note: This block must go before we start creating static Tandem instances at the bottom of this class.
const BASE_TANDEM_CHARACTER_CLASS = 'a-zA-Z0-9[\\],';
const BASE_DYNAMIC_TANDEM_CHARACTER_CLASS = `${BASE_TANDEM_CHARACTER_CLASS}_`;
const BASE_DERIVED_TANDEM_CHARACTER_CLASS = `${BASE_DYNAMIC_TANDEM_CHARACTER_CLASS}\\-`;

const TandemConstants = {
  OBJECT_IO_TYPE_NAME: OBJECT_IO_TYPE_NAME,
  EVENT_TYPE_MODEL: EVENT_TYPE_MODEL,

  // Default metadata set for an ObjectIO in the PhET-iO API.  These are used as the default options in PhetioObject
  // and when outputting an API (since values that match the defaults are omitted)
  PHET_IO_OBJECT_METADATA_DEFAULTS: metadataDefaults,

  METADATA_KEY_NAME: '_metadata',
  DATA_KEY_NAME: '_data',

  BASE_TANDEM_CHARACTER_CLASS: BASE_TANDEM_CHARACTER_CLASS,
  BASE_DYNAMIC_TANDEM_CHARACTER_CLASS: BASE_DYNAMIC_TANDEM_CHARACTER_CLASS,
  BASE_DERIVED_TANDEM_CHARACTER_CLASS: BASE_DERIVED_TANDEM_CHARACTER_CLASS
} as const;

tandemNamespace.register( 'TandemConstants', TandemConstants );
export default TandemConstants;