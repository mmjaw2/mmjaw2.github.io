// Copyright 2023-2024, University of Colorado Boulder

/**
 * The PhetioStateEngine is defined in the phet-io/ repo, so is not available to developers that cannot clone that repo.
 * Describe the interface explicitly here.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import PhetioObject from './PhetioObject.js';
import { TReadOnlyEmitter } from '../../axon/js/TEmitter.js';
import { FullPhetioState } from './TandemConstants.js';
import TReadOnlyProperty from '../../axon/js/TReadOnlyProperty.js';
import Emitter from '../../axon/js/Emitter.js';

export type TPhetioStateEngine = {
  onBeforeApplyStateEmitter: TReadOnlyEmitter<[ PhetioObject ]>;
  undeferEmitter: Emitter<[ FullPhetioState ]>;
  isSettingStateProperty: TReadOnlyProperty<boolean>;
};