// Copyright 2018-2024, University of Colorado Boulder

/**
 * These are the units that can be associated with Property instances.
 *
 * When adding units to this file, please add abbreviations, preferably SI abbreviations.
 * And keep the array alphabetized by value.
 * See https://github.com/phetsims/phet-io/issues/530
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import axon from './axon.js';
const units = {
  values: ['1/(cm*M)',
  // molar absorptivity
  '%',
  // percent
  'A',
  // amperes
  'AMU',
  // atomic mass unit
  'atm',
  // atmospheres
  'AU',
  // astronomical units
  'AU^2',
  // astronomical units squared
  'cm',
  // centimeters
  'cm^2',
  // centimeters squared
  'C',
  // coulombs
  '\u00B0',
  // °, degrees (angle)
  '\u00B0C',
  // °C, degrees Celsius
  'F',
  // farad
  '\u00B0F',
  // °F, degrees Fahrenheit
  'g',
  // grams
  'G',
  // gauss
  'Hz',
  // hertz
  'J',
  // Joules
  'K',
  // Kelvin
  'kg',
  // kilograms
  'kg/m^3',
  // kg/cubic meter
  'kg/L',
  // kg/liter
  'kg\u00b7m/s',
  // kg·m/s, kilogram-meters/second
  'km/s', 'kPa',
  // kilopascals
  'L', 'L/s', 'm',
  // meters
  'm^3',
  // cubic meter
  'm/s',
  // meters/second
  'm/s/s',
  // meters/second/second
  'm/s^2',
  // meters/seconds squared
  'mA',
  // milliampere
  'mm',
  //millimeters
  'mol', 'mol/L', 'mol/s', 'M',
  // molar
  'N',
  // Newtons
  'N/m',
  // Newtons/meter
  'nm',
  // nanometers
  'nm/ps',
  // nanometers/picosecond
  'N\u00b7s/m',
  // N·s/m, Newton-seconds/meter
  '\u2126',
  // Ω, ohms - don't use the one in MathSymbols to prevent a dependency on scenery-phet
  '\u2126\u00b7cm',
  // Ω·cm, ohm-centimeters
  'Pa\u00b7s',
  // Pascal-seconds
  'particles/ps',
  // particles/picosecond
  'pm',
  // picometers
  'pm/ps',
  // picometers/picosecond
  'pm/s',
  // picometers/second
  'pm/s^2',
  // picometers/second-squared
  'pm^3',
  // picometers cubed
  'ps',
  // picoseconds
  'radians',
  // radians - note this has the same abbreviation as the radiation term "rad" so we use the full term
  'radians/s',
  // radians/second
  'radians/s^2',
  // radians/second^2
  'rpm',
  // revolutions per minute
  's',
  // seconds
  'V',
  // volts
  'view-coordinates/s', 'W',
  // watts
  'Wb',
  // weber
  'years' // years
  ],
  isValidUnits: function (unit) {
    return _.includes(units.values, unit);
  }
};
axon.register('units', units);
export default units;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJheG9uIiwidW5pdHMiLCJ2YWx1ZXMiLCJpc1ZhbGlkVW5pdHMiLCJ1bml0IiwiXyIsImluY2x1ZGVzIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJ1bml0cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBUaGVzZSBhcmUgdGhlIHVuaXRzIHRoYXQgY2FuIGJlIGFzc29jaWF0ZWQgd2l0aCBQcm9wZXJ0eSBpbnN0YW5jZXMuXHJcbiAqXHJcbiAqIFdoZW4gYWRkaW5nIHVuaXRzIHRvIHRoaXMgZmlsZSwgcGxlYXNlIGFkZCBhYmJyZXZpYXRpb25zLCBwcmVmZXJhYmx5IFNJIGFiYnJldmlhdGlvbnMuXHJcbiAqIEFuZCBrZWVwIHRoZSBhcnJheSBhbHBoYWJldGl6ZWQgYnkgdmFsdWUuXHJcbiAqIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvNTMwXHJcbiAqXHJcbiAqIEBhdXRob3IgU2FtIFJlaWQgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IGF4b24gZnJvbSAnLi9heG9uLmpzJztcclxuXHJcbmNvbnN0IHVuaXRzID0ge1xyXG4gIHZhbHVlczogW1xyXG4gICAgJzEvKGNtKk0pJywgLy8gbW9sYXIgYWJzb3JwdGl2aXR5XHJcbiAgICAnJScsIC8vIHBlcmNlbnRcclxuICAgICdBJywgLy8gYW1wZXJlc1xyXG4gICAgJ0FNVScsIC8vIGF0b21pYyBtYXNzIHVuaXRcclxuICAgICdhdG0nLCAvLyBhdG1vc3BoZXJlc1xyXG4gICAgJ0FVJywgLy8gYXN0cm9ub21pY2FsIHVuaXRzXHJcbiAgICAnQVVeMicsIC8vIGFzdHJvbm9taWNhbCB1bml0cyBzcXVhcmVkXHJcbiAgICAnY20nLCAvLyBjZW50aW1ldGVyc1xyXG4gICAgJ2NtXjInLCAvLyBjZW50aW1ldGVycyBzcXVhcmVkXHJcbiAgICAnQycsIC8vIGNvdWxvbWJzXHJcbiAgICAnXFx1MDBCMCcsIC8vIMKwLCBkZWdyZWVzIChhbmdsZSlcclxuICAgICdcXHUwMEIwQycsIC8vIMKwQywgZGVncmVlcyBDZWxzaXVzXHJcbiAgICAnRicsIC8vIGZhcmFkXHJcbiAgICAnXFx1MDBCMEYnLCAvLyDCsEYsIGRlZ3JlZXMgRmFocmVuaGVpdFxyXG4gICAgJ2cnLCAvLyBncmFtc1xyXG4gICAgJ0cnLCAvLyBnYXVzc1xyXG4gICAgJ0h6JywgLy8gaGVydHpcclxuICAgICdKJywgLy8gSm91bGVzXHJcbiAgICAnSycsIC8vIEtlbHZpblxyXG4gICAgJ2tnJywgLy8ga2lsb2dyYW1zXHJcbiAgICAna2cvbV4zJywgLy8ga2cvY3ViaWMgbWV0ZXJcclxuICAgICdrZy9MJywgLy8ga2cvbGl0ZXJcclxuICAgICdrZ1xcdTAwYjdtL3MnLCAvLyBrZ8K3bS9zLCBraWxvZ3JhbS1tZXRlcnMvc2Vjb25kXHJcbiAgICAna20vcycsXHJcbiAgICAna1BhJywgLy8ga2lsb3Bhc2NhbHNcclxuICAgICdMJyxcclxuICAgICdML3MnLFxyXG4gICAgJ20nLCAvLyBtZXRlcnNcclxuICAgICdtXjMnLCAvLyBjdWJpYyBtZXRlclxyXG4gICAgJ20vcycsIC8vIG1ldGVycy9zZWNvbmRcclxuICAgICdtL3MvcycsIC8vIG1ldGVycy9zZWNvbmQvc2Vjb25kXHJcbiAgICAnbS9zXjInLCAvLyBtZXRlcnMvc2Vjb25kcyBzcXVhcmVkXHJcbiAgICAnbUEnLCAvLyBtaWxsaWFtcGVyZVxyXG4gICAgJ21tJywgLy9taWxsaW1ldGVyc1xyXG4gICAgJ21vbCcsXHJcbiAgICAnbW9sL0wnLFxyXG4gICAgJ21vbC9zJyxcclxuICAgICdNJywgLy8gbW9sYXJcclxuICAgICdOJywgLy8gTmV3dG9uc1xyXG4gICAgJ04vbScsIC8vIE5ld3RvbnMvbWV0ZXJcclxuICAgICdubScsIC8vIG5hbm9tZXRlcnNcclxuICAgICdubS9wcycsIC8vIG5hbm9tZXRlcnMvcGljb3NlY29uZFxyXG4gICAgJ05cXHUwMGI3cy9tJywgLy8gTsK3cy9tLCBOZXd0b24tc2Vjb25kcy9tZXRlclxyXG4gICAgJ1xcdTIxMjYnLCAvLyDOqSwgb2htcyAtIGRvbid0IHVzZSB0aGUgb25lIGluIE1hdGhTeW1ib2xzIHRvIHByZXZlbnQgYSBkZXBlbmRlbmN5IG9uIHNjZW5lcnktcGhldFxyXG4gICAgJ1xcdTIxMjZcXHUwMGI3Y20nLCAvLyDOqcK3Y20sIG9obS1jZW50aW1ldGVyc1xyXG4gICAgJ1BhXFx1MDBiN3MnLCAvLyBQYXNjYWwtc2Vjb25kc1xyXG4gICAgJ3BhcnRpY2xlcy9wcycsIC8vIHBhcnRpY2xlcy9waWNvc2Vjb25kXHJcbiAgICAncG0nLCAvLyBwaWNvbWV0ZXJzXHJcbiAgICAncG0vcHMnLCAvLyBwaWNvbWV0ZXJzL3BpY29zZWNvbmRcclxuICAgICdwbS9zJywgLy8gcGljb21ldGVycy9zZWNvbmRcclxuICAgICdwbS9zXjInLCAvLyBwaWNvbWV0ZXJzL3NlY29uZC1zcXVhcmVkXHJcbiAgICAncG1eMycsIC8vIHBpY29tZXRlcnMgY3ViZWRcclxuICAgICdwcycsIC8vIHBpY29zZWNvbmRzXHJcbiAgICAncmFkaWFucycsIC8vIHJhZGlhbnMgLSBub3RlIHRoaXMgaGFzIHRoZSBzYW1lIGFiYnJldmlhdGlvbiBhcyB0aGUgcmFkaWF0aW9uIHRlcm0gXCJyYWRcIiBzbyB3ZSB1c2UgdGhlIGZ1bGwgdGVybVxyXG4gICAgJ3JhZGlhbnMvcycsIC8vIHJhZGlhbnMvc2Vjb25kXHJcbiAgICAncmFkaWFucy9zXjInLCAvLyByYWRpYW5zL3NlY29uZF4yXHJcbiAgICAncnBtJywgLy8gcmV2b2x1dGlvbnMgcGVyIG1pbnV0ZVxyXG4gICAgJ3MnLCAvLyBzZWNvbmRzXHJcbiAgICAnVicsIC8vIHZvbHRzXHJcbiAgICAndmlldy1jb29yZGluYXRlcy9zJyxcclxuICAgICdXJywgLy8gd2F0dHNcclxuICAgICdXYicsIC8vIHdlYmVyXHJcbiAgICAneWVhcnMnIC8vIHllYXJzXHJcbiAgXSxcclxuXHJcbiAgaXNWYWxpZFVuaXRzOiBmdW5jdGlvbiggdW5pdDogc3RyaW5nICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIF8uaW5jbHVkZXMoIHVuaXRzLnZhbHVlcywgdW5pdCApO1xyXG4gIH1cclxufTtcclxuXHJcbmF4b24ucmVnaXN0ZXIoICd1bml0cycsIHVuaXRzICk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCB1bml0czsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxJQUFJLE1BQU0sV0FBVztBQUU1QixNQUFNQyxLQUFLLEdBQUc7RUFDWkMsTUFBTSxFQUFFLENBQ04sVUFBVTtFQUFFO0VBQ1osR0FBRztFQUFFO0VBQ0wsR0FBRztFQUFFO0VBQ0wsS0FBSztFQUFFO0VBQ1AsS0FBSztFQUFFO0VBQ1AsSUFBSTtFQUFFO0VBQ04sTUFBTTtFQUFFO0VBQ1IsSUFBSTtFQUFFO0VBQ04sTUFBTTtFQUFFO0VBQ1IsR0FBRztFQUFFO0VBQ0wsUUFBUTtFQUFFO0VBQ1YsU0FBUztFQUFFO0VBQ1gsR0FBRztFQUFFO0VBQ0wsU0FBUztFQUFFO0VBQ1gsR0FBRztFQUFFO0VBQ0wsR0FBRztFQUFFO0VBQ0wsSUFBSTtFQUFFO0VBQ04sR0FBRztFQUFFO0VBQ0wsR0FBRztFQUFFO0VBQ0wsSUFBSTtFQUFFO0VBQ04sUUFBUTtFQUFFO0VBQ1YsTUFBTTtFQUFFO0VBQ1IsYUFBYTtFQUFFO0VBQ2YsTUFBTSxFQUNOLEtBQUs7RUFBRTtFQUNQLEdBQUcsRUFDSCxLQUFLLEVBQ0wsR0FBRztFQUFFO0VBQ0wsS0FBSztFQUFFO0VBQ1AsS0FBSztFQUFFO0VBQ1AsT0FBTztFQUFFO0VBQ1QsT0FBTztFQUFFO0VBQ1QsSUFBSTtFQUFFO0VBQ04sSUFBSTtFQUFFO0VBQ04sS0FBSyxFQUNMLE9BQU8sRUFDUCxPQUFPLEVBQ1AsR0FBRztFQUFFO0VBQ0wsR0FBRztFQUFFO0VBQ0wsS0FBSztFQUFFO0VBQ1AsSUFBSTtFQUFFO0VBQ04sT0FBTztFQUFFO0VBQ1QsWUFBWTtFQUFFO0VBQ2QsUUFBUTtFQUFFO0VBQ1YsZ0JBQWdCO0VBQUU7RUFDbEIsV0FBVztFQUFFO0VBQ2IsY0FBYztFQUFFO0VBQ2hCLElBQUk7RUFBRTtFQUNOLE9BQU87RUFBRTtFQUNULE1BQU07RUFBRTtFQUNSLFFBQVE7RUFBRTtFQUNWLE1BQU07RUFBRTtFQUNSLElBQUk7RUFBRTtFQUNOLFNBQVM7RUFBRTtFQUNYLFdBQVc7RUFBRTtFQUNiLGFBQWE7RUFBRTtFQUNmLEtBQUs7RUFBRTtFQUNQLEdBQUc7RUFBRTtFQUNMLEdBQUc7RUFBRTtFQUNMLG9CQUFvQixFQUNwQixHQUFHO0VBQUU7RUFDTCxJQUFJO0VBQUU7RUFDTixPQUFPLENBQUM7RUFBQSxDQUNUO0VBRURDLFlBQVksRUFBRSxTQUFBQSxDQUFVQyxJQUFZLEVBQVk7SUFDOUMsT0FBT0MsQ0FBQyxDQUFDQyxRQUFRLENBQUVMLEtBQUssQ0FBQ0MsTUFBTSxFQUFFRSxJQUFLLENBQUM7RUFDekM7QUFDRixDQUFDO0FBRURKLElBQUksQ0FBQ08sUUFBUSxDQUFFLE9BQU8sRUFBRU4sS0FBTSxDQUFDO0FBRS9CLGVBQWVBLEtBQUsiLCJpZ25vcmVMaXN0IjpbXX0=