// Copyright 2022-2024, University of Colorado Boulder

/**
 * A universal locale Property that is accessible independently of the running Sim instance.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Property from '../../../axon/js/Property.js';
import StringUtils from '../../../phetcommon/js/util/StringUtils.js';
import { globalKeyStateTracker, KeyboardUtils } from '../../../scenery/js/imports.js';
import Tandem from '../../../tandem/js/Tandem.js';
import StringIO from '../../../tandem/js/types/StringIO.js';
import joist from '../joist.js';
const FALLBACK_LOCALE = 'en';
// All available locales for the runtime
export const availableRuntimeLocales = _.sortBy(Object.keys(phet.chipper.strings), locale => {
  return StringUtils.localeToLocalizedName(locale).toLowerCase();
});

// Start only with a valid locale, see https://github.com/phetsims/phet-io/issues/1882
const isLocaleValid = locale => {
  return !!(locale && availableRuntimeLocales.includes(locale));
};

// Get the "most" valid locale, see https://github.com/phetsims/phet-io/issues/1882
// As part of https://github.com/phetsims/joist/issues/963, this as changed. We check a specific fallback order based
// on the locale. In general, it will usually try a prefix for xx_XX style locales, e.g. 'ar_SA' would try 'ar_SA', 'ar', 'en'
// NOTE: If the locale doesn't actually have any strings: THAT IS OK! Our string system will use the appropriate
// fallback strings.
const validInitialLocale = [phet.chipper.locale, ...(phet.chipper.localeData[phet.chipper.locale]?.fallbackLocales ?? []), FALLBACK_LOCALE].find(isLocaleValid);

// Just in case we had an invalid locale, remap phet.chipper.locale to the "corrected" value
phet.chipper.locale = validInitialLocale;
class LocaleProperty extends Property {
  unguardedSet(value) {
    if (availableRuntimeLocales.includes(value)) {
      super.unguardedSet(value);
    } else {
      assert && assert(false, 'Unsupported locale: ' + value);

      // Do not try to set if the value was invalid
    }
  }
}
const localeProperty = new LocaleProperty(validInitialLocale, {
  tandem: Tandem.GENERAL_MODEL.createTandem('localeProperty'),
  phetioFeatured: true,
  phetioValueType: StringIO,
  validValues: availableRuntimeLocales,
  phetioDocumentation: 'Specifies language currently displayed in the simulation'
});
if (phet?.chipper?.queryParameters?.keyboardLocaleSwitcher) {
  // DUPLICATION ALERT: don't change these without consulting PHET_IO_WRAPPERS/PhetioClient.initializeKeyboardLocaleSwitcher()
  const FORWARD_KEY = KeyboardUtils.KEY_I;
  const BACKWARD_KEY = KeyboardUtils.KEY_U;
  globalKeyStateTracker.keydownEmitter.addListener(event => {
    const bump = delta => {
      // Ctrl + u in Chrome on Windows is "view source" in a new tab
      event.preventDefault();
      const index = availableRuntimeLocales.indexOf(localeProperty.value);
      const nextIndex = (index + delta + availableRuntimeLocales.length) % availableRuntimeLocales.length;
      localeProperty.value = availableRuntimeLocales[nextIndex];

      // Indicate the new locale on the console
      console.log(localeProperty.value);
    };
    if (event.ctrlKey && !event.shiftKey && !event.metaKey && !event.altKey) {
      if (KeyboardUtils.isKeyEvent(event, FORWARD_KEY)) {
        bump(+1);
      } else if (KeyboardUtils.isKeyEvent(event, BACKWARD_KEY)) {
        bump(-1);
      }
    }
  });
}
joist.register('localeProperty', localeProperty);
export default localeProperty;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQcm9wZXJ0eSIsIlN0cmluZ1V0aWxzIiwiZ2xvYmFsS2V5U3RhdGVUcmFja2VyIiwiS2V5Ym9hcmRVdGlscyIsIlRhbmRlbSIsIlN0cmluZ0lPIiwiam9pc3QiLCJGQUxMQkFDS19MT0NBTEUiLCJhdmFpbGFibGVSdW50aW1lTG9jYWxlcyIsIl8iLCJzb3J0QnkiLCJPYmplY3QiLCJrZXlzIiwicGhldCIsImNoaXBwZXIiLCJzdHJpbmdzIiwibG9jYWxlIiwibG9jYWxlVG9Mb2NhbGl6ZWROYW1lIiwidG9Mb3dlckNhc2UiLCJpc0xvY2FsZVZhbGlkIiwiaW5jbHVkZXMiLCJ2YWxpZEluaXRpYWxMb2NhbGUiLCJsb2NhbGVEYXRhIiwiZmFsbGJhY2tMb2NhbGVzIiwiZmluZCIsIkxvY2FsZVByb3BlcnR5IiwidW5ndWFyZGVkU2V0IiwidmFsdWUiLCJhc3NlcnQiLCJsb2NhbGVQcm9wZXJ0eSIsInRhbmRlbSIsIkdFTkVSQUxfTU9ERUwiLCJjcmVhdGVUYW5kZW0iLCJwaGV0aW9GZWF0dXJlZCIsInBoZXRpb1ZhbHVlVHlwZSIsInZhbGlkVmFsdWVzIiwicGhldGlvRG9jdW1lbnRhdGlvbiIsInF1ZXJ5UGFyYW1ldGVycyIsImtleWJvYXJkTG9jYWxlU3dpdGNoZXIiLCJGT1JXQVJEX0tFWSIsIktFWV9JIiwiQkFDS1dBUkRfS0VZIiwiS0VZX1UiLCJrZXlkb3duRW1pdHRlciIsImFkZExpc3RlbmVyIiwiZXZlbnQiLCJidW1wIiwiZGVsdGEiLCJwcmV2ZW50RGVmYXVsdCIsImluZGV4IiwiaW5kZXhPZiIsIm5leHRJbmRleCIsImxlbmd0aCIsImNvbnNvbGUiLCJsb2ciLCJjdHJsS2V5Iiwic2hpZnRLZXkiLCJtZXRhS2V5IiwiYWx0S2V5IiwiaXNLZXlFdmVudCIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsibG9jYWxlUHJvcGVydHkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjItMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSB1bml2ZXJzYWwgbG9jYWxlIFByb3BlcnR5IHRoYXQgaXMgYWNjZXNzaWJsZSBpbmRlcGVuZGVudGx5IG9mIHRoZSBydW5uaW5nIFNpbSBpbnN0YW5jZS5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCBQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IGxvY2FsZUluZm9Nb2R1bGUgZnJvbSAnLi4vLi4vLi4vY2hpcHBlci9qcy9kYXRhL2xvY2FsZUluZm9Nb2R1bGUuanMnO1xyXG5pbXBvcnQgU3RyaW5nVXRpbHMgZnJvbSAnLi4vLi4vLi4vcGhldGNvbW1vbi9qcy91dGlsL1N0cmluZ1V0aWxzLmpzJztcclxuaW1wb3J0IHsgZ2xvYmFsS2V5U3RhdGVUcmFja2VyLCBLZXlib2FyZFV0aWxzIH0gZnJvbSAnLi4vLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuaW1wb3J0IFN0cmluZ0lPIGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy90eXBlcy9TdHJpbmdJTy5qcyc7XHJcbmltcG9ydCBqb2lzdCBmcm9tICcuLi9qb2lzdC5qcyc7XHJcblxyXG5jb25zdCBGQUxMQkFDS19MT0NBTEUgPSAnZW4nO1xyXG5cclxuZXhwb3J0IHR5cGUgTG9jYWxlID0ga2V5b2YgdHlwZW9mIGxvY2FsZUluZm9Nb2R1bGU7XHJcblxyXG4vLyBBbGwgYXZhaWxhYmxlIGxvY2FsZXMgZm9yIHRoZSBydW50aW1lXHJcbmV4cG9ydCBjb25zdCBhdmFpbGFibGVSdW50aW1lTG9jYWxlcyA9IF8uc29ydEJ5KCBPYmplY3Qua2V5cyggcGhldC5jaGlwcGVyLnN0cmluZ3MgKSwgbG9jYWxlID0+IHtcclxuICByZXR1cm4gU3RyaW5nVXRpbHMubG9jYWxlVG9Mb2NhbGl6ZWROYW1lKCBsb2NhbGUgKS50b0xvd2VyQ2FzZSgpO1xyXG59ICkgYXMgTG9jYWxlW107XHJcblxyXG4vLyBTdGFydCBvbmx5IHdpdGggYSB2YWxpZCBsb2NhbGUsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvcGhldC1pby9pc3N1ZXMvMTg4MlxyXG5jb25zdCBpc0xvY2FsZVZhbGlkID0gKCBsb2NhbGU/OiBMb2NhbGUgKTogYm9vbGVhbiA9PiB7XHJcbiAgcmV0dXJuICEhKCBsb2NhbGUgJiYgYXZhaWxhYmxlUnVudGltZUxvY2FsZXMuaW5jbHVkZXMoIGxvY2FsZSApICk7XHJcbn07XHJcblxyXG4vLyBHZXQgdGhlIFwibW9zdFwiIHZhbGlkIGxvY2FsZSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvL2lzc3Vlcy8xODgyXHJcbi8vIEFzIHBhcnQgb2YgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2pvaXN0L2lzc3Vlcy85NjMsIHRoaXMgYXMgY2hhbmdlZC4gV2UgY2hlY2sgYSBzcGVjaWZpYyBmYWxsYmFjayBvcmRlciBiYXNlZFxyXG4vLyBvbiB0aGUgbG9jYWxlLiBJbiBnZW5lcmFsLCBpdCB3aWxsIHVzdWFsbHkgdHJ5IGEgcHJlZml4IGZvciB4eF9YWCBzdHlsZSBsb2NhbGVzLCBlLmcuICdhcl9TQScgd291bGQgdHJ5ICdhcl9TQScsICdhcicsICdlbidcclxuLy8gTk9URTogSWYgdGhlIGxvY2FsZSBkb2Vzbid0IGFjdHVhbGx5IGhhdmUgYW55IHN0cmluZ3M6IFRIQVQgSVMgT0shIE91ciBzdHJpbmcgc3lzdGVtIHdpbGwgdXNlIHRoZSBhcHByb3ByaWF0ZVxyXG4vLyBmYWxsYmFjayBzdHJpbmdzLlxyXG5jb25zdCB2YWxpZEluaXRpYWxMb2NhbGUgPSBbXHJcbiAgcGhldC5jaGlwcGVyLmxvY2FsZSxcclxuICAuLi4oIHBoZXQuY2hpcHBlci5sb2NhbGVEYXRhWyBwaGV0LmNoaXBwZXIubG9jYWxlIF0/LmZhbGxiYWNrTG9jYWxlcyA/PyBbXSApLFxyXG4gIEZBTExCQUNLX0xPQ0FMRVxyXG5dLmZpbmQoIGlzTG9jYWxlVmFsaWQgKTtcclxuXHJcbi8vIEp1c3QgaW4gY2FzZSB3ZSBoYWQgYW4gaW52YWxpZCBsb2NhbGUsIHJlbWFwIHBoZXQuY2hpcHBlci5sb2NhbGUgdG8gdGhlIFwiY29ycmVjdGVkXCIgdmFsdWVcclxucGhldC5jaGlwcGVyLmxvY2FsZSA9IHZhbGlkSW5pdGlhbExvY2FsZTtcclxuXHJcbmNsYXNzIExvY2FsZVByb3BlcnR5IGV4dGVuZHMgUHJvcGVydHk8TG9jYWxlPiB7XHJcbiAgcHJvdGVjdGVkIG92ZXJyaWRlIHVuZ3VhcmRlZFNldCggdmFsdWU6IExvY2FsZSApOiB2b2lkIHtcclxuICAgIGlmICggYXZhaWxhYmxlUnVudGltZUxvY2FsZXMuaW5jbHVkZXMoIHZhbHVlICkgKSB7XHJcbiAgICAgIHN1cGVyLnVuZ3VhcmRlZFNldCggdmFsdWUgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBmYWxzZSwgJ1Vuc3VwcG9ydGVkIGxvY2FsZTogJyArIHZhbHVlICk7XHJcblxyXG4gICAgICAvLyBEbyBub3QgdHJ5IHRvIHNldCBpZiB0aGUgdmFsdWUgd2FzIGludmFsaWRcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IGxvY2FsZVByb3BlcnR5ID0gbmV3IExvY2FsZVByb3BlcnR5KCB2YWxpZEluaXRpYWxMb2NhbGUsIHtcclxuICB0YW5kZW06IFRhbmRlbS5HRU5FUkFMX01PREVMLmNyZWF0ZVRhbmRlbSggJ2xvY2FsZVByb3BlcnR5JyApLFxyXG4gIHBoZXRpb0ZlYXR1cmVkOiB0cnVlLFxyXG4gIHBoZXRpb1ZhbHVlVHlwZTogU3RyaW5nSU8sXHJcbiAgdmFsaWRWYWx1ZXM6IGF2YWlsYWJsZVJ1bnRpbWVMb2NhbGVzLFxyXG4gIHBoZXRpb0RvY3VtZW50YXRpb246ICdTcGVjaWZpZXMgbGFuZ3VhZ2UgY3VycmVudGx5IGRpc3BsYXllZCBpbiB0aGUgc2ltdWxhdGlvbidcclxufSApO1xyXG5cclxuaWYgKCBwaGV0Py5jaGlwcGVyPy5xdWVyeVBhcmFtZXRlcnM/LmtleWJvYXJkTG9jYWxlU3dpdGNoZXIgKSB7XHJcblxyXG4gIC8vIERVUExJQ0FUSU9OIEFMRVJUOiBkb24ndCBjaGFuZ2UgdGhlc2Ugd2l0aG91dCBjb25zdWx0aW5nIFBIRVRfSU9fV1JBUFBFUlMvUGhldGlvQ2xpZW50LmluaXRpYWxpemVLZXlib2FyZExvY2FsZVN3aXRjaGVyKClcclxuICBjb25zdCBGT1JXQVJEX0tFWSA9IEtleWJvYXJkVXRpbHMuS0VZX0k7XHJcbiAgY29uc3QgQkFDS1dBUkRfS0VZID0gS2V5Ym9hcmRVdGlscy5LRVlfVTtcclxuXHJcbiAgZ2xvYmFsS2V5U3RhdGVUcmFja2VyLmtleWRvd25FbWl0dGVyLmFkZExpc3RlbmVyKCAoIGV2ZW50OiBLZXlib2FyZEV2ZW50ICkgPT4ge1xyXG5cclxuICAgIGNvbnN0IGJ1bXAgPSAoIGRlbHRhOiBudW1iZXIgKSA9PiB7XHJcblxyXG4gICAgICAvLyBDdHJsICsgdSBpbiBDaHJvbWUgb24gV2luZG93cyBpcyBcInZpZXcgc291cmNlXCIgaW4gYSBuZXcgdGFiXHJcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICBjb25zdCBpbmRleCA9IGF2YWlsYWJsZVJ1bnRpbWVMb2NhbGVzLmluZGV4T2YoIGxvY2FsZVByb3BlcnR5LnZhbHVlICk7XHJcbiAgICAgIGNvbnN0IG5leHRJbmRleCA9ICggaW5kZXggKyBkZWx0YSArIGF2YWlsYWJsZVJ1bnRpbWVMb2NhbGVzLmxlbmd0aCApICUgYXZhaWxhYmxlUnVudGltZUxvY2FsZXMubGVuZ3RoO1xyXG4gICAgICBsb2NhbGVQcm9wZXJ0eS52YWx1ZSA9IGF2YWlsYWJsZVJ1bnRpbWVMb2NhbGVzWyBuZXh0SW5kZXggXTtcclxuXHJcbiAgICAgIC8vIEluZGljYXRlIHRoZSBuZXcgbG9jYWxlIG9uIHRoZSBjb25zb2xlXHJcbiAgICAgIGNvbnNvbGUubG9nKCBsb2NhbGVQcm9wZXJ0eS52YWx1ZSApO1xyXG4gICAgfTtcclxuXHJcbiAgICBpZiAoIGV2ZW50LmN0cmxLZXkgJiYgIWV2ZW50LnNoaWZ0S2V5ICYmICFldmVudC5tZXRhS2V5ICYmICFldmVudC5hbHRLZXkgKSB7XHJcbiAgICAgIGlmICggS2V5Ym9hcmRVdGlscy5pc0tleUV2ZW50KCBldmVudCwgRk9SV0FSRF9LRVkgKSApIHtcclxuICAgICAgICBidW1wKCArMSApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCBLZXlib2FyZFV0aWxzLmlzS2V5RXZlbnQoIGV2ZW50LCBCQUNLV0FSRF9LRVkgKSApIHtcclxuICAgICAgICBidW1wKCAtMSApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSApO1xyXG59XHJcblxyXG5qb2lzdC5yZWdpc3RlciggJ2xvY2FsZVByb3BlcnR5JywgbG9jYWxlUHJvcGVydHkgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGxvY2FsZVByb3BlcnR5OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxRQUFRLE1BQU0sOEJBQThCO0FBRW5ELE9BQU9DLFdBQVcsTUFBTSw0Q0FBNEM7QUFDcEUsU0FBU0MscUJBQXFCLEVBQUVDLGFBQWEsUUFBUSxnQ0FBZ0M7QUFDckYsT0FBT0MsTUFBTSxNQUFNLDhCQUE4QjtBQUNqRCxPQUFPQyxRQUFRLE1BQU0sc0NBQXNDO0FBQzNELE9BQU9DLEtBQUssTUFBTSxhQUFhO0FBRS9CLE1BQU1DLGVBQWUsR0FBRyxJQUFJO0FBSTVCO0FBQ0EsT0FBTyxNQUFNQyx1QkFBdUIsR0FBR0MsQ0FBQyxDQUFDQyxNQUFNLENBQUVDLE1BQU0sQ0FBQ0MsSUFBSSxDQUFFQyxJQUFJLENBQUNDLE9BQU8sQ0FBQ0MsT0FBUSxDQUFDLEVBQUVDLE1BQU0sSUFBSTtFQUM5RixPQUFPZixXQUFXLENBQUNnQixxQkFB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