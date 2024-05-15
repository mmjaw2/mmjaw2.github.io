// Copyright 2023, University of Colorado Boulder

/**
 * A cache that helps reuse parametric IOTypes so they aren't dynamic created upon each usage. This also has the feature
 * of keeping a registry of all caches. This is predominantly used to clear an API and start over in phetioEngine.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import type IOType from './types/IOType.js';
import tandemNamespace from './tandemNamespace.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';


// By default, the cache key is an IOType (like for a single parameter like PropertyIO)
class IOTypeCache<T = IOType> extends Map<T, IOType> {

  private static readonly caches: IOTypeCache<IntentionalAny>[] = [];

  public constructor( entries?: readonly ( readonly [ T, IOType ] )[] | null ) {
    super( entries );

    IOTypeCache.caches.push( this );
  }

  public static clearAll(): void {
    IOTypeCache.caches.forEach( cache => cache.clear() );
  }
}

tandemNamespace.register( 'IOTypeCache', IOTypeCache );
export default IOTypeCache;