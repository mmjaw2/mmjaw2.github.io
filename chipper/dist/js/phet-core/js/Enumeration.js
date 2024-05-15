// Copyright 2021-2023, University of Colorado Boulder

/**
 * This implementation auto-detects the enumeration values by Object.keys and instanceof. Every property that has a
 * type matching the enumeration type is marked as a value.  See sample usage in Orientation.ts.
 *
 * For general pattern see https://github.com/phetsims/phet-info/blob/main/doc/phet-software-design-patterns.md#enumeration
 *
 * This creates 2-way maps (key-to-value and value-to-key) for ease of use and to enable phet-io serialization.
 *
 * class T extends EnumerationValue {
 *     static a=new T();
 *     static b =new T();
 *     getName(){return 'he';}
 *     get thing(){return 'text';}
 *     static get age(){return 77;}
 *     static enumeration = new Enumeration( T );
 * }
 * T.enumeration.keys => ['a', 'b']
 * T.enumeration.values => [T, T]
 *
 * Note how `keys` only picks up 'a' and 'b'.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import phetCore from './phetCore.js';
import EnumerationValue from './EnumerationValue.js';
import inheritance from './inheritance.js';
import optionize from './optionize.js';
class Enumeration {
  // in the order that static instances are defined

  constructor(Enumeration, providedOptions) {
    const options = optionize()({
      phetioDocumentation: '',
      // Values are plucked from the supplied Enumeration, but in order to support subtyping (augmenting) Enumerations,
      // you can specify the rule for what counts as a member of the enumeration. This should only be used in the
      // special case of augmenting existing enumerations.
      instanceType: Enumeration
    }, providedOptions);
    this.phetioDocumentation = options.phetioDocumentation;
    const instanceType = options.instanceType;

    // Iterate over the type hierarchy to support augmenting enumerations, but reverse so that newly added enumeration
    // values appear after previously existing enumeration values
    const types = _.reverse(inheritance(Enumeration));
    assert && assert(types.includes(instanceType), 'the specified type should be in its own hierarchy');
    this.keys = [];
    this.values = [];
    types.forEach(type => {
      Object.keys(type).forEach(key => {
        const value = type[key];
        if (value instanceof instanceType) {
          assert && assert(key === key.toUpperCase(), 'keys should be upper case by convention');
          this.keys.push(key);
          this.values.push(value);

          // Only assign this to the lowest Enumeration in the hierarchy. Otherwise this would overwrite the
          // supertype-assigned Enumeration. See https://github.com/phetsims/phet-core/issues/102
          if (value instanceof Enumeration) {
            value.name = key;
            value.enumeration = this;
          }
        }
      });
    });
    assert && assert(this.keys.length > 0, 'no keys found');
    assert && assert(this.values.length > 0, 'no values found');
    this.Enumeration = Enumeration;
    EnumerationValue.sealedCache.add(Enumeration);
  }
  getKey(value) {
    return value.name;
  }
  getValue(key) {
    return this.Enumeration[key];
  }
  includes(value) {
    return this.values.includes(value);
  }
}
phetCore.register('Enumeration', Enumeration);
export default Enumeration;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwaGV0Q29yZSIsIkVudW1lcmF0aW9uVmFsdWUiLCJpbmhlcml0YW5jZSIsIm9wdGlvbml6ZSIsIkVudW1lcmF0aW9uIiwiY29uc3RydWN0b3IiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwicGhldGlvRG9jdW1lbnRhdGlvbiIsImluc3RhbmNlVHlwZSIsInR5cGVzIiwiXyIsInJldmVyc2UiLCJhc3NlcnQiLCJpbmNsdWRlcyIsImtleXMiLCJ2YWx1ZXMiLCJmb3JFYWNoIiwidHlwZSIsIk9iamVjdCIsImtleSIsInZhbHVlIiwidG9VcHBlckNhc2UiLCJwdXNoIiwibmFtZSIsImVudW1lcmF0aW9uIiwibGVuZ3RoIiwic2VhbGVkQ2FjaGUiLCJhZGQiLCJnZXRLZXkiLCJnZXRWYWx1ZSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiRW51bWVyYXRpb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEtMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVGhpcyBpbXBsZW1lbnRhdGlvbiBhdXRvLWRldGVjdHMgdGhlIGVudW1lcmF0aW9uIHZhbHVlcyBieSBPYmplY3Qua2V5cyBhbmQgaW5zdGFuY2VvZi4gRXZlcnkgcHJvcGVydHkgdGhhdCBoYXMgYVxyXG4gKiB0eXBlIG1hdGNoaW5nIHRoZSBlbnVtZXJhdGlvbiB0eXBlIGlzIG1hcmtlZCBhcyBhIHZhbHVlLiAgU2VlIHNhbXBsZSB1c2FnZSBpbiBPcmllbnRhdGlvbi50cy5cclxuICpcclxuICogRm9yIGdlbmVyYWwgcGF0dGVybiBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXQtaW5mby9ibG9iL21haW4vZG9jL3BoZXQtc29mdHdhcmUtZGVzaWduLXBhdHRlcm5zLm1kI2VudW1lcmF0aW9uXHJcbiAqXHJcbiAqIFRoaXMgY3JlYXRlcyAyLXdheSBtYXBzIChrZXktdG8tdmFsdWUgYW5kIHZhbHVlLXRvLWtleSkgZm9yIGVhc2Ugb2YgdXNlIGFuZCB0byBlbmFibGUgcGhldC1pbyBzZXJpYWxpemF0aW9uLlxyXG4gKlxyXG4gKiBjbGFzcyBUIGV4dGVuZHMgRW51bWVyYXRpb25WYWx1ZSB7XHJcbiAqICAgICBzdGF0aWMgYT1uZXcgVCgpO1xyXG4gKiAgICAgc3RhdGljIGIgPW5ldyBUKCk7XHJcbiAqICAgICBnZXROYW1lKCl7cmV0dXJuICdoZSc7fVxyXG4gKiAgICAgZ2V0IHRoaW5nKCl7cmV0dXJuICd0ZXh0Jzt9XHJcbiAqICAgICBzdGF0aWMgZ2V0IGFnZSgpe3JldHVybiA3Nzt9XHJcbiAqICAgICBzdGF0aWMgZW51bWVyYXRpb24gPSBuZXcgRW51bWVyYXRpb24oIFQgKTtcclxuICogfVxyXG4gKiBULmVudW1lcmF0aW9uLmtleXMgPT4gWydhJywgJ2InXVxyXG4gKiBULmVudW1lcmF0aW9uLnZhbHVlcyA9PiBbVCwgVF1cclxuICpcclxuICogTm90ZSBob3cgYGtleXNgIG9ubHkgcGlja3MgdXAgJ2EnIGFuZCAnYicuXHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgcGhldENvcmUgZnJvbSAnLi9waGV0Q29yZS5qcyc7XHJcbmltcG9ydCBURW51bWVyYXRpb24gZnJvbSAnLi9URW51bWVyYXRpb24uanMnO1xyXG5pbXBvcnQgRW51bWVyYXRpb25WYWx1ZSBmcm9tICcuL0VudW1lcmF0aW9uVmFsdWUuanMnO1xyXG5pbXBvcnQgaW5oZXJpdGFuY2UgZnJvbSAnLi9pbmhlcml0YW5jZS5qcyc7XHJcbmltcG9ydCBDb25zdHJ1Y3RvciBmcm9tICcuL3R5cGVzL0NvbnN0cnVjdG9yLmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSBmcm9tICcuL29wdGlvbml6ZS5qcyc7XHJcblxyXG5leHBvcnQgdHlwZSBFbnVtZXJhdGlvbk9wdGlvbnM8VCBleHRlbmRzIEVudW1lcmF0aW9uVmFsdWU+ID0ge1xyXG4gIHBoZXRpb0RvY3VtZW50YXRpb24/OiBzdHJpbmc7XHJcbiAgaW5zdGFuY2VUeXBlPzogQ29uc3RydWN0b3I8VD47XHJcbn07XHJcblxyXG5jbGFzcyBFbnVtZXJhdGlvbjxUIGV4dGVuZHMgRW51bWVyYXRpb25WYWx1ZT4gaW1wbGVtZW50cyBURW51bWVyYXRpb248VD4ge1xyXG4gIHB1YmxpYyByZWFkb25seSB2YWx1ZXM6IFRbXTsgLy8gaW4gdGhlIG9yZGVyIHRoYXQgc3RhdGljIGluc3RhbmNlcyBhcmUgZGVmaW5lZFxyXG4gIHB1YmxpYyByZWFkb25seSBrZXlzOiBzdHJpbmdbXTtcclxuICBwdWJsaWMgcmVhZG9ubHkgRW51bWVyYXRpb246IENvbnN0cnVjdG9yPFQ+ICYgUmVjb3JkPHN0cmluZywgVD47XHJcbiAgcHVibGljIHJlYWRvbmx5IHBoZXRpb0RvY3VtZW50YXRpb24/OiBzdHJpbmc7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggRW51bWVyYXRpb246IENvbnN0cnVjdG9yPFQ+LCBwcm92aWRlZE9wdGlvbnM/OiBFbnVtZXJhdGlvbk9wdGlvbnM8VD4gKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxFbnVtZXJhdGlvbk9wdGlvbnM8VD4+KCkoIHtcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJycsXHJcblxyXG4gICAgICAvLyBWYWx1ZXMgYXJlIHBsdWNrZWQgZnJvbSB0aGUgc3VwcGxpZWQgRW51bWVyYXRpb24sIGJ1dCBpbiBvcmRlciB0byBzdXBwb3J0IHN1YnR5cGluZyAoYXVnbWVudGluZykgRW51bWVyYXRpb25zLFxyXG4gICAgICAvLyB5b3UgY2FuIHNwZWNpZnkgdGhlIHJ1bGUgZm9yIHdoYXQgY291bnRzIGFzIGEgbWVtYmVyIG9mIHRoZSBlbnVtZXJhdGlvbi4gVGhpcyBzaG91bGQgb25seSBiZSB1c2VkIGluIHRoZVxyXG4gICAgICAvLyBzcGVjaWFsIGNhc2Ugb2YgYXVnbWVudGluZyBleGlzdGluZyBlbnVtZXJhdGlvbnMuXHJcbiAgICAgIGluc3RhbmNlVHlwZTogRW51bWVyYXRpb25cclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG4gICAgdGhpcy5waGV0aW9Eb2N1bWVudGF0aW9uID0gb3B0aW9ucy5waGV0aW9Eb2N1bWVudGF0aW9uO1xyXG5cclxuICAgIGNvbnN0IGluc3RhbmNlVHlwZSA9IG9wdGlvbnMuaW5zdGFuY2VUeXBlO1xyXG5cclxuICAgIC8vIEl0ZXJhdGUgb3ZlciB0aGUgdHlwZSBoaWVyYXJjaHkgdG8gc3VwcG9ydCBhdWdtZW50aW5nIGVudW1lcmF0aW9ucywgYnV0IHJldmVyc2Ugc28gdGhhdCBuZXdseSBhZGRlZCBlbnVtZXJhdGlvblxyXG4gICAgLy8gdmFsdWVzIGFwcGVhciBhZnRlciBwcmV2aW91c2x5IGV4aXN0aW5nIGVudW1lcmF0aW9uIHZhbHVlc1xyXG4gICAgY29uc3QgdHlwZXMgPSBfLnJldmVyc2UoIGluaGVyaXRhbmNlKCBFbnVtZXJhdGlvbiApICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdHlwZXMuaW5jbHVkZXMoIGluc3RhbmNlVHlwZSApLCAndGhlIHNwZWNpZmllZCB0eXBlIHNob3VsZCBiZSBpbiBpdHMgb3duIGhpZXJhcmNoeScgKTtcclxuXHJcbiAgICB0aGlzLmtleXMgPSBbXTtcclxuICAgIHRoaXMudmFsdWVzID0gW107XHJcbiAgICB0eXBlcy5mb3JFYWNoKCB0eXBlID0+IHtcclxuICAgICAgT2JqZWN0LmtleXMoIHR5cGUgKS5mb3JFYWNoKCBrZXkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gdHlwZVsga2V5IF07XHJcbiAgICAgICAgaWYgKCB2YWx1ZSBpbnN0YW5jZW9mIGluc3RhbmNlVHlwZSApIHtcclxuICAgICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGtleSA9PT0ga2V5LnRvVXBwZXJDYXNlKCksICdrZXlzIHNob3VsZCBiZSB1cHBlciBjYXNlIGJ5IGNvbnZlbnRpb24nICk7XHJcbiAgICAgICAgICB0aGlzLmtleXMucHVzaCgga2V5ICk7XHJcbiAgICAgICAgICB0aGlzLnZhbHVlcy5wdXNoKCB2YWx1ZSApO1xyXG5cclxuICAgICAgICAgIC8vIE9ubHkgYXNzaWduIHRoaXMgdG8gdGhlIGxvd2VzdCBFbnVtZXJhdGlvbiBpbiB0aGUgaGllcmFyY2h5LiBPdGhlcndpc2UgdGhpcyB3b3VsZCBvdmVyd3JpdGUgdGhlXHJcbiAgICAgICAgICAvLyBzdXBlcnR5cGUtYXNzaWduZWQgRW51bWVyYXRpb24uIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1jb3JlL2lzc3Vlcy8xMDJcclxuICAgICAgICAgIGlmICggdmFsdWUgaW5zdGFuY2VvZiBFbnVtZXJhdGlvbiApIHtcclxuICAgICAgICAgICAgdmFsdWUubmFtZSA9IGtleTtcclxuICAgICAgICAgICAgdmFsdWUuZW51bWVyYXRpb24gPSB0aGlzO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMua2V5cy5sZW5ndGggPiAwLCAnbm8ga2V5cyBmb3VuZCcgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMudmFsdWVzLmxlbmd0aCA+IDAsICdubyB2YWx1ZXMgZm91bmQnICk7XHJcblxyXG4gICAgdGhpcy5FbnVtZXJhdGlvbiA9IEVudW1lcmF0aW9uIGFzIENvbnN0cnVjdG9yPFQ+ICYgUmVjb3JkPHN0cmluZywgVD47XHJcbiAgICBFbnVtZXJhdGlvblZhbHVlLnNlYWxlZENhY2hlLmFkZCggRW51bWVyYXRpb24gKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXRLZXkoIHZhbHVlOiBUICk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdmFsdWUubmFtZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXRWYWx1ZSgga2V5OiBzdHJpbmcgKTogVCB7XHJcbiAgICByZXR1cm4gdGhpcy5FbnVtZXJhdGlvblsga2V5IF07XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaW5jbHVkZXMoIHZhbHVlOiBUICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMudmFsdWVzLmluY2x1ZGVzKCB2YWx1ZSApO1xyXG4gIH1cclxufVxyXG5cclxucGhldENvcmUucmVnaXN0ZXIoICdFbnVtZXJhdGlvbicsIEVudW1lcmF0aW9uICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBFbnVtZXJhdGlvbjsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxRQUFRLE1BQU0sZUFBZTtBQUVwQyxPQUFPQyxnQkFBZ0IsTUFBTSx1QkFBdUI7QUFDcEQsT0FBT0MsV0FBVyxNQUFNLGtCQUFrQjtBQUUxQyxPQUFPQyxTQUFTLE1BQU0sZ0JBQWdCO0FBT3RDLE1BQU1DLFdBQVcsQ0FBd0Q7RUFDMUM7O0VBS3RCQyxXQUFXQSxDQUFFRCxXQUEyQixFQUFFRSxlQUF1QyxFQUFHO0lBRXpGLE1BQU1DLE9BQU8sR0FBR0osU0FBUyxDQUF3QixDQUFDLENBQUU7TUFDbERLLG1CQUFtQixFQUFFLEVBQUU7TUFFdkI7TUFDQTtNQUNBO01BQ0FDLFlBQVksRUFBRUw7SUFDaEIsQ0FBQyxFQUFFRSxlQUFnQixDQUFDO0lBQ3BCLElBQUksQ0FBQ0UsbUJBQW1CLEdBQUdELE9BQU8sQ0FBQ0MsbUJBQW1CO0lBRXRELE1BQU1DLFlBQVksR0FBR0YsT0FBTyxDQUFDRSxZQUFZOztJQUV6QztJQUNBO0lBQ0EsTUFBTUMsS0FBSyxHQUFHQyxDQUFDLENBQUNDLE9BQU8sQ0FBRVYsV0FBVyxDQUFFRSxXQUFZLENBQUUsQ0FBQztJQUVyRFMsTUFBTSxJQUFJQSxNQUFNLENBQUVILEtBQUssQ0FBQ0ksUUFBUSxDQUFFTCxZQUFhLENBQUMsRUFBRSxtREFBb0QsQ0FBQztJQUV2RyxJQUFJLENBQUNNLElBQUksR0FBRyxFQUFFO0lBQ2QsSUFBSSxDQUFDQyxNQUFNLEdBQUcsRUFBRTtJQUNoQk4sS0FBSyxDQUFDTyxPQUFPLENBQUVDLElBQUksSUFBSTtNQUNyQkMsTUFBTSxDQUFDSixJQUFJLENBQUVHLElBQUssQ0FBQyxDQUFDRCxPQUFPLENBQUVHLEdBQUcsSUFBSTtRQUNsQyxNQUFNQyxLQUFLLEdBQUdILElBQUksQ0FBRUUsR0FBRyxDQUFFO1FBQ3pCLElBQUtDLEtBQUssWUFBWVosWUFBWSxFQUFHO1VBQ25DSSxNQUFNLElBQUlBLE1BQU0sQ0FBRU8sR0FBRyxLQUFLQSxHQUFHLENBQUNFLFdBQVcsQ0FBQyxDQUFDLEVBQUUseUNBQTBDLENBQUM7VUFDeEYsSUFBSSxDQUFDUCxJQUFJLENBQUNRLElBQUksQ0FBRUgsR0FBSSxDQUFDO1VBQ3JCLElBQUksQ0FBQ0osTUFBTSxDQUFDTyxJQUFJLENBQUVGLEtBQU0sQ0FBQzs7VUFFekI7VUFDQTtVQUNBLElBQUtBLEtBQUssWUFBWWpCLFdBQVcsRUFBRztZQUNsQ2lCLEtBQUssQ0FBQ0csSUFBSSxHQUFHSixHQUFHO1lBQ2hCQyxLQUFLLENBQUNJLFdBQVcsR0FBRyxJQUFJO1VBQzFCO1FBQ0Y7TUFDRixDQUFFLENBQUM7SUFDTCxDQUFFLENBQUM7SUFFSFosTUFBTSxJQUFJQSxNQUFNLENBQUUsSUFBSSxDQUFDRSxJQUFJLENBQUNXLE1BQU0sR0FBRyxDQUFDLEVBQUUsZUFBZ0IsQ0FBQztJQUN6RGIsTUFBTSxJQUFJQSxNQUFNLENBQUUsSUFBSSxDQUFDRyxNQUFNLENBQUNVLE1BQU0sR0FBRyxDQUFDLEVBQUUsaUJBQWtCLENBQUM7SUFFN0QsSUFBSSxDQUFDdEIsV0FBVyxHQUFHQSxXQUFpRDtJQUNwRUgsZ0JBQWdCLENBQUMwQixXQUFXLENBQUNDLEdBQUcsQ0FBRXhCLFdBQVksQ0FBQztFQUNqRDtFQUVPeUIsTUFBTUEsQ0FBRVIsS0FBUSxFQUFXO0lBQ2hDLE9BQU9BLEtBQUssQ0FBQ0csSUFBSTtFQUNuQjtFQUVPTSxRQUFRQSxDQUFFVixHQUFXLEVBQU07SUFDaEMsT0FBTyxJQUFJLENBQUNoQixXQUFXLENBQUVnQixHQUFHLENBQUU7RUFDaEM7RUFFT04sUUFBUUEsQ0FBRU8sS0FBUSxFQUFZO0lBQ25DLE9BQU8sSUFBSSxDQUFDTCxNQUFNLENBQUNGLFFBQVEsQ0FBRU8sS0FBTSxDQUFDO0VBQ3RDO0FBQ0Y7QUFFQXJCLFFBQVEsQ0FBQytCLFFBQVEsQ0FBRSxhQUFhLEVBQUUzQixXQUFZLENBQUM7QUFFL0MsZUFBZUEsV0FBVyIsImlnbm9yZUxpc3QiOltdfQ==