// Copyright 2013-2024, University of Colorado Boulder

/**
 * Encapsulation of the font used for PhET simulations.
 * Provides PhET-specific defaults, and guarantees a fallback for font family.
 *
 * Sample use:
 * new PhetFont( { family: 'Futura', size: 24, weight: 'bold' } )
 * new PhetFont( 24 )
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import { combineOptions } from '../../phet-core/js/optionize.js';
import { Font } from '../../scenery/js/imports.js';
import sceneryPhet from './sceneryPhet.js';
import sceneryPhetQueryParameters from './sceneryPhetQueryParameters.js';
export default class PhetFont extends Font {
  /**
   * @param providedOptions - number or string indicate the font size, otherwise same options as phet.scenery.Font
   */
  constructor(providedOptions) {
    assert && assert(arguments.length === 0 || arguments.length === 1, 'Too many arguments');

    // convenience constructor: new PhetFont( {number|string} size )
    let options;
    if (typeof providedOptions === 'number' || typeof providedOptions === 'string') {
      options = {
        size: providedOptions
      };
    } else {
      options = providedOptions || {};
    }

    // PhET defaults
    options = combineOptions({
      family: sceneryPhetQueryParameters.fontFamily
    }, options);

    // Guarantee a fallback family
    assert && assert(options.family);
    options.family = [options.family, 'sans-serif'].join(', ');
    super(options);
  }
}
sceneryPhet.register('PhetFont', PhetFont);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb21iaW5lT3B0aW9ucyIsIkZvbnQiLCJzY2VuZXJ5UGhldCIsInNjZW5lcnlQaGV0UXVlcnlQYXJhbWV0ZXJzIiwiUGhldEZvbnQiLCJjb25zdHJ1Y3RvciIsInByb3ZpZGVkT3B0aW9ucyIsImFzc2VydCIsImFyZ3VtZW50cyIsImxlbmd0aCIsIm9wdGlvbnMiLCJzaXplIiwiZmFtaWx5IiwiZm9udEZhbWlseSIsImpvaW4iLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlBoZXRGb250LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEVuY2Fwc3VsYXRpb24gb2YgdGhlIGZvbnQgdXNlZCBmb3IgUGhFVCBzaW11bGF0aW9ucy5cclxuICogUHJvdmlkZXMgUGhFVC1zcGVjaWZpYyBkZWZhdWx0cywgYW5kIGd1YXJhbnRlZXMgYSBmYWxsYmFjayBmb3IgZm9udCBmYW1pbHkuXHJcbiAqXHJcbiAqIFNhbXBsZSB1c2U6XHJcbiAqIG5ldyBQaGV0Rm9udCggeyBmYW1pbHk6ICdGdXR1cmEnLCBzaXplOiAyNCwgd2VpZ2h0OiAnYm9sZCcgfSApXHJcbiAqIG5ldyBQaGV0Rm9udCggMjQgKVxyXG4gKlxyXG4gKiBAYXV0aG9yIENocmlzIE1hbGxleSAoUGl4ZWxab29tLCBJbmMuKVxyXG4gKi9cclxuXHJcbmltcG9ydCB7IGNvbWJpbmVPcHRpb25zIH0gZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCB7IEZvbnQsIEZvbnRPcHRpb25zIH0gZnJvbSAnLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IHNjZW5lcnlQaGV0IGZyb20gJy4vc2NlbmVyeVBoZXQuanMnO1xyXG5pbXBvcnQgc2NlbmVyeVBoZXRRdWVyeVBhcmFtZXRlcnMgZnJvbSAnLi9zY2VuZXJ5UGhldFF1ZXJ5UGFyYW1ldGVycy5qcyc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQaGV0Rm9udCBleHRlbmRzIEZvbnQge1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gcHJvdmlkZWRPcHRpb25zIC0gbnVtYmVyIG9yIHN0cmluZyBpbmRpY2F0ZSB0aGUgZm9udCBzaXplLCBvdGhlcndpc2Ugc2FtZSBvcHRpb25zIGFzIHBoZXQuc2NlbmVyeS5Gb250XHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBwcm92aWRlZE9wdGlvbnM/OiBudW1iZXIgfCBzdHJpbmcgfCBGb250T3B0aW9ucyApIHtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBhcmd1bWVudHMubGVuZ3RoID09PSAwIHx8IGFyZ3VtZW50cy5sZW5ndGggPT09IDEsICdUb28gbWFueSBhcmd1bWVudHMnICk7XHJcblxyXG4gICAgLy8gY29udmVuaWVuY2UgY29uc3RydWN0b3I6IG5ldyBQaGV0Rm9udCgge251bWJlcnxzdHJpbmd9IHNpemUgKVxyXG4gICAgbGV0IG9wdGlvbnM6IEZvbnRPcHRpb25zO1xyXG4gICAgaWYgKCB0eXBlb2YgcHJvdmlkZWRPcHRpb25zID09PSAnbnVtYmVyJyB8fCB0eXBlb2YgcHJvdmlkZWRPcHRpb25zID09PSAnc3RyaW5nJyApIHtcclxuICAgICAgb3B0aW9ucyA9IHsgc2l6ZTogcHJvdmlkZWRPcHRpb25zIH07XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgb3B0aW9ucyA9IHByb3ZpZGVkT3B0aW9ucyB8fCB7fTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBQaEVUIGRlZmF1bHRzXHJcbiAgICBvcHRpb25zID0gY29tYmluZU9wdGlvbnM8Rm9udE9wdGlvbnM+KCB7XHJcbiAgICAgIGZhbWlseTogc2NlbmVyeVBoZXRRdWVyeVBhcmFtZXRlcnMuZm9udEZhbWlseSFcclxuICAgIH0sIG9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyBHdWFyYW50ZWUgYSBmYWxsYmFjayBmYW1pbHlcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG9wdGlvbnMuZmFtaWx5ICk7XHJcblxyXG4gICAgb3B0aW9ucy5mYW1pbHkgPSBbXHJcbiAgICAgIG9wdGlvbnMuZmFtaWx5LFxyXG4gICAgICAnc2Fucy1zZXJpZidcclxuICAgIF0uam9pbiggJywgJyApO1xyXG5cclxuICAgIHN1cGVyKCBvcHRpb25zICk7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5UGhldC5yZWdpc3RlciggJ1BoZXRGb250JywgUGhldEZvbnQgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFNBQVNBLGNBQWMsUUFBUSxpQ0FBaUM7QUFDaEUsU0FBU0MsSUFBSSxRQUFxQiw2QkFBNkI7QUFDL0QsT0FBT0MsV0FBVyxNQUFNLGtCQUFrQjtBQUMxQyxPQUFPQywwQkFBMEIsTUFBTSxpQ0FBaUM7QUFFeEUsZUFBZSxNQUFNQyxRQUFRLFNBQVNILElBQUksQ0FBQztFQUV6QztBQUNGO0FBQ0E7RUFDU0ksV0FBV0EsQ0FBRUMsZUFBK0MsRUFBRztJQUVwRUMsTUFBTSxJQUFJQSxNQUFNLENBQUVDLFNBQVMsQ0FBQ0MsTUFBTSxLQUFLLENBQUMsSUFBSUQsU0FBUyxDQUFDQyxNQUFNLEtBQUssQ0FBQyxFQUFFLG9CQUFxQixDQUFDOztJQUUxRjtJQUNBLElBQUlDLE9BQW9CO0lBQ3hCLElBQUssT0FBT0osZUFBZSxLQUFLLFFBQVEsSUFBSSxPQUFPQSxlQUFlLEtBQUssUUFBUSxFQUFHO01BQ2hGSSxPQUFPLEdBQUc7UUFBRUMsSUFBSSxFQUFFTDtNQUFnQixDQUFDO0lBQ3JDLENBQUMsTUFDSTtNQUNISSxPQUFPLEdBQUdKLGVBQWUsSUFBSSxDQUFDLENBQUM7SUFDakM7O0lBRUE7SUFDQUksT0FBTyxHQUFHVixjQUFjLENBQWU7TUFDckNZLE1BQU0sRUFBRVQsMEJBQTBCLENBQUNVO0lBQ3JDLENBQUMsRUFBRUgsT0FBUSxDQUFDOztJQUVaO0lBQ0FILE1BQU0sSUFBSUEsTUFBTSxDQUFFRyxPQUFPLENBQUNFLE1BQU8sQ0FBQztJQUVsQ0YsT0FBTyxDQUFDRSxNQUFNLEdBQUcsQ0FDZkYsT0FBTyxDQUFDRSxNQUFNLEVBQ2QsWUFBWSxDQUNiLENBQUNFLElBQUksQ0FBRSxJQUFLLENBQUM7SUFFZCxLQUFLLENBQUVKLE9BQVEsQ0FBQztFQUNsQjtBQUNGO0FBRUFSLFdBQVcsQ0FBQ2EsUUFBUSxDQUFFLFVBQVUsRUFBRVgsUUFBUyxDQUFDIiwiaWdub3JlTGlzdCI6W119