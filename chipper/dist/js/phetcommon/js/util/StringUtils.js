// Copyright 2013-2024, University of Colorado Boulder

/**
 * Collection of utility functions related to Strings.
 * @author Sam Reid (PhET Interactive Simulations)
 */

import phetcommon from '../phetcommon.js';

// Unicode embedding marks that we use.
const LTR = '\u202a';
const RTL = '\u202b';
const POP = '\u202c';
const StringUtils = {
  /**
   * NOTE: Please use StringUtils.fillIn instead of this function.
   *
   * http://mobzish.blogspot.com/2008/10/simple-messageformat-for-javascript.html
   * Similar to Java's MessageFormat, supports simple substitution, simple substitution only.
   * The full MessageFormat specification allows conditional formatting, for example to support pluralisation.
   *
   * Example:
   * > StringUtils.format( '{0} + {1}', 2, 3 )
   * "2 + 3"
   *
   * @param {string} pattern pattern string, with N placeholders, where N is an integer
   * @returns {string}
   * @public
   * @deprecated - please use StringUtils.fillIn
   */
  format: function (pattern) {
    // eslint-disable-next-line prefer-rest-params
    const args = arguments;
    return pattern.replace(/{(\d)}/g, (r, n) => args[+n + 1]);
  },
  /**
   * Fills in a set of placeholders in a template.
   * Placeholders are specified with pairs of curly braces, e.g. '{{name}} is {{age}} years old'
   * See https://github.com/phetsims/phetcommon/issues/36
   *
   * Example:
   * > StringUtils.fillIn( '{{name}} is {{age}} years old', { name: 'Fred', age: 23 } )
   * "Fred is 23 years old"
   *
   * @param {string|TReadOnlyProperty<string>} template - the template, containing zero or more placeholders
   * @param {Object} values - a hash whose keys correspond to the placeholder names, e.g. { name: 'Fred', age: 23 }
   *                          Unused keys are silently ignored. All placeholders do not need to be filled.
   * @returns {string}
   * @public
   */
  fillIn: function (template, values) {
    template = template && template.get ? template.get() : template;
    assert && assert(typeof template === 'string', `invalid template: ${template}`);

    // To catch attempts to use StringUtils.fillIn like StringUtils.format
    assert && assert(values && typeof values === 'object', `invalid values: ${values}`);
    let newString = template;

    // {string[]} parse out the set of placeholders
    const placeholders = template.match(/\{\{[^{}]+\}\}/g) || [];

    // replace each placeholder with its corresponding value
    for (let i = 0; i < placeholders.length; i++) {
      const placeholder = placeholders[i];

      // key is the portion of the placeholder between the curly braces
      const key = placeholder.replace('{{', '').replace('}}', '');
      if (values[key] !== undefined) {
        // Support Properties as values
        const valueString = values[key] && values[key].get ? values[key].get() : values[key];
        newString = newString.replace(placeholder, valueString);
      }
    }
    return newString;
  },
  /**
   * @public
   * @returns {boolean} - Whether this length-1 string is equal to one of the three directional embedding marks used.
   */
  isEmbeddingMark: function (chr) {
    return chr === LTR || chr === RTL || chr === POP;
  },
  /**
   * Given a string with embedding marks, this function returns an equivalent string.slice() but prefixes and suffixes
   * the string with the embedding marks needed to ensure things have the correct LTR/RTL order.
   * @public
   *
   * For example, with a test string:
   *
   * embeddedDebugString( '\u202a\u202bhi\u202c\u202c' )
   * === "[LTR][RTL]hi[POP][POP]"
   *
   * We could grab the first word, and it adds the ending POP:
   * embeddedDebugString( embeddedSlice( '\u202afirst\u202bsecond\u202cthird\u202c', 0, 6 ) )
   * === "[LTR]first[POP]"
   *
   * Or the second word:
   * embeddedDebugString( embeddedSlice( '\u202afirst\u202bsecond\u202cthird\u202c', 6, 14 ) )
   * === "[RTL]second[POP]"
   *
   * Or a custom range:
   * embeddedDebugString( embeddedSlice( '\u202afirst\u202bsecond\u202cthird\u202c', 3, -3 ) )
   * === "[LTR]rst[RTL]second[POP]thi[POP]"
   *
   * @param {string} string - The main source string to slice from
   * @param {number} startIndex - The starting index where the slice starts (includes char at this index)
   * @param {number} [endIndex] - The ending index where the slice stops (does NOT include char at this index)
   * @returns {string} - The sliced string, with embedding marks added at hte start and end.
   */
  embeddedSlice: function (string, startIndex, endIndex) {
    // {Array.<string>} - array of LTR/RTL embedding marks that are currently on the stack for the current location.
    const stack = [];
    let chr;
    if (endIndex === undefined) {
      endIndex = string.length;
    }
    if (endIndex < 0) {
      endIndex += string.length;
    }

    // To avoid returning an extra adjacent [LTR][POP] or [RTL][POP], we can move the start forward and the
    // end backwards as long as they are over embedding marks to avoid this.
    while (startIndex < string.length && StringUtils.isEmbeddingMark(string.charAt(startIndex))) {
      startIndex++;
    }
    while (endIndex >= 1 && StringUtils.isEmbeddingMark(string.charAt(endIndex - 1))) {
      endIndex--;
    }

    // If our string will be empty, just bail out.
    if (startIndex >= endIndex || startIndex >= string.length) {
      return '';
    }

    // Walk up to the start of the string
    for (let i = 0; i < startIndex; i++) {
      chr = string.charAt(i);
      if (chr === LTR || chr === RTL) {
        stack.push(chr);
      } else if (chr === POP) {
        stack.pop();
      }
    }

    // Will store the minimum stack size during our slice. This allows us to turn [LTR][RTL]boo[POP][POP] into
    // [RTL]boo[POP] by skipping the "outer" layers.
    let minimumStackSize = stack.length;

    // Save our initial stack for prefix computation
    let startStack = stack.slice();

    // A normal string slice
    const slice = string.slice(startIndex, endIndex);

    // Walk through the sliced string, to determine what we need for the suffix
    for (let j = 0; j < slice.length; j++) {
      chr = slice.charAt(j);
      if (chr === LTR || chr === RTL) {
        stack.push(chr);
      } else if (chr === POP) {
        stack.pop();
        minimumStackSize = Math.min(stack.length, minimumStackSize);
      }
    }

    // Our ending stack for suffix computation
    let endStack = stack;

    // Always leave one stack level on top
    const numSkippedStackLevels = Math.max(0, minimumStackSize - 1);
    startStack = startStack.slice(numSkippedStackLevels);
    endStack = endStack.slice(numSkippedStackLevels);

    // Our prefix will be the embedding marks that have been skipped and not popped.
    const prefix = startStack.join('');

    // Our suffix includes one POP for each embedding mark currently on the stack
    const suffix = endStack.join('').replace(/./g, POP);
    return prefix + slice + suffix;
  },
  /**
   * String's split() API, but uses embeddedSlice() on the extracted strings.
   * @public
   *
   * For example, given a string:
   *
   * StringUtils.embeddedDebugString( '\u202aHello  there, \u202bHow are you\u202c doing?\u202c' );
   * === "[LTR]Hello  there, [RTL]How are you[POP] doing?[POP]"
   *
   * Using embeddedSplit with a regular expression matching a sequence of spaces:
   * StringUtils.embeddedSplit( '\u202aHello  there, \u202bHow are you\u202c doing?\u202c', / +/ )
   *            .map( StringUtils.embeddedDebugString );
   * === [ "[LTR]Hello[POP]",
   *       "[LTR]there,[POP]",
   *       "[RTL]How[POP]",
   *       "[RTL]are[POP]",
   *       "[RTL]you[POP]",
   *       "[LTR]doing?[POP]" ]
   */
  embeddedSplit: function (string, separator, limit) {
    // Matching split API
    if (separator === undefined) {
      return [string];
    }

    // {Array.<string>} - What we will push to and return.
    let result = [];

    // { index: {number}, length: {number} } - Last result of findSeparatorMatch()
    let separatorMatch;

    // Remaining part of the string to split up. Will have substrings removed from the start.
    let stringToSplit = string;

    // Finds the index and length of the first substring of stringToSplit that matches the separator (string or regex)
    // and returns an object with the type  { index: {number}, length: {number} }.
    // If index === -1, there was no match for the separator.
    function findSeparatorMatch() {
      let index;
      let length;
      if (separator instanceof window.RegExp) {
        const match = stringToSplit.match(separator);
        if (match) {
          index = match.index;
          length = match[0].length;
        } else {
          index = -1;
        }
      } else {
        assert && assert(typeof separator === 'string');
        index = stringToSplit.indexOf(separator);
        length = separator.length;
      }
      return {
        index: index,
        length: length
      };
    }

    // Loop until we run out of matches for the separator. For each separator match, stringToSplit for the next
    // iteration will have everything up to the end of the separator match chopped off. The indexOffset variable
    // stores how many characters we have chopped off in this fashion, so that we can index into the original string.
    let indexOffset = 0;
    while ((separatorMatch = findSeparatorMatch()).index >= 0) {
      // Extract embedded slice from the original, up until the separator match
      result.push(StringUtils.embeddedSlice(string, indexOffset, indexOffset + separatorMatch.index));

      // Handle chopping off the section of stringToSplit, so we can do simple matching in findSeparatorMatch()
      const offset = separatorMatch.index + separatorMatch.length;
      stringToSplit = stringToSplit.slice(offset);
      indexOffset += offset;
    }

    // Embedded slice for after the last match. May be an empty string.
    result.push(StringUtils.embeddedSlice(string, indexOffset));

    // Matching split API
    if (limit !== undefined) {
      assert && assert(typeof limit === 'number');
      result = _.first(result, limit);
    }
    return result;
  },
  /**
   * Replaces embedding mark characters with visible strings. Useful for debugging for strings with embedding marks.
   * @public
   *
   * @param {string} string
   * @returns {string} - With embedding marks replaced.
   */
  embeddedDebugString: function (string) {
    return string.replace(/\u202a/g, '[LTR]').replace(/\u202b/g, '[RTL]').replace(/\u202c/g, '[POP]');
  },
  /**
   * Wraps a string with embedding marks for LTR display.
   * @public
   *
   * @param {string} string
   * @returns {string}
   */
  wrapLTR: function (string) {
    return LTR + string + POP;
  },
  /**
   * Wraps a string with embedding marks for RTL display.
   * @public
   *
   * @param {string} string
   * @returns {string}
   */
  wrapRTL: function (string) {
    return RTL + string + POP;
  },
  /**
   * Wraps a string with embedding marks for LTR/RTL display, depending on the direction
   * @public
   *
   * @param {string} string
   * @param {string} direction - either 'ltr' or 'rtl'
   * @returns {string}
   */
  wrapDirection: function (string, direction) {
    assert && assert(direction === 'ltr' || direction === 'rtl');
    if (direction === 'ltr') {
      return StringUtils.wrapLTR(string);
    } else {
      return StringUtils.wrapRTL(string);
    }
  },
  /**
   * Given a locale, e.g. 'es', provides the localized name, e.g. 'Español'
   *
   * @param {string} locale
   * @returns {string}
   */
  localeToLocalizedName: function (locale) {
    assert && assert(phet.chipper.localeData[locale], 'locale needs to be a valid locale code defined in localeData');
    return StringUtils.wrapDirection(phet.chipper.localeData[locale].localizedName, phet.chipper.localeData[locale].direction);
  },
  /**
   * Capitalize the first letter of the given string.  This will skip control characters and whitespace at the beginning
   * of a string.  If the letter is already capitalized the returned string will match the provided one.  Strings that
   * start with numbers, such as "1 of these things" will be essentially unchanged too.
   *
   * This will only work reliably for English strings.
   *
   * @param {string} str
   * @returns {string}
   * @public
   */
  capitalize(str) {
    // Find the index of the first character that can be capitalized.  Control characters and whitespace are skipped.
    const firstCharIndex = str.search(/[A-Za-z0-9]/);
    if (firstCharIndex === -1) {
      // No characters were found in the string that can be capitalized, so return an unchanged copy.
      return str.slice(0);
    }

    // Break the string apart and capitalize the identified character.
    const preChangeString = firstCharIndex > 0 ? str.slice(0, firstCharIndex) : '';
    const capitalizedCharacter = str.charAt(firstCharIndex).toUpperCase();
    const postChangeString = firstCharIndex + 1 < str.length ? str.slice(firstCharIndex + 1) : '';
    return preChangeString + capitalizedCharacter + postChangeString;
  }
};
phetcommon.register('StringUtils', StringUtils);
export default StringUtils;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwaGV0Y29tbW9uIiwiTFRSIiwiUlRMIiwiUE9QIiwiU3RyaW5nVXRpbHMiLCJmb3JtYXQiLCJwYXR0ZXJuIiwiYXJncyIsImFyZ3VtZW50cyIsInJlcGxhY2UiLCJyIiwibiIsImZpbGxJbiIsInRlbXBsYXRlIiwidmFsdWVzIiwiZ2V0IiwiYXNzZXJ0IiwibmV3U3RyaW5nIiwicGxhY2Vob2xkZXJzIiwibWF0Y2giLCJpIiwibGVuZ3RoIiwicGxhY2Vob2xkZXIiLCJrZXkiLCJ1bmRlZmluZWQiLCJ2YWx1ZVN0cmluZyIsImlzRW1iZWRkaW5nTWFyayIsImNociIsImVtYmVkZGVkU2xpY2UiLCJzdHJpbmciLCJzdGFydEluZGV4IiwiZW5kSW5kZXgiLCJzdGFjayIsImNoYXJBdCIsInB1c2giLCJwb3AiLCJtaW5pbXVtU3RhY2tTaXplIiwic3RhcnRTdGFjayIsInNsaWNlIiwiaiIsIk1hdGgiLCJtaW4iLCJlbmRTdGFjayIsIm51bVNraXBwZWRTdGFja0xldmVscyIsIm1heCIsInByZWZpeCIsImpvaW4iLCJzdWZmaXgiLCJlbWJlZGRlZFNwbGl0Iiwic2VwYXJhdG9yIiwibGltaXQiLCJyZXN1bHQiLCJzZXBhcmF0b3JNYXRjaCIsInN0cmluZ1RvU3BsaXQiLCJmaW5kU2VwYXJhdG9yTWF0Y2giLCJpbmRleCIsIndpbmRvdyIsIlJlZ0V4cCIsImluZGV4T2YiLCJpbmRleE9mZnNldCIsIm9mZnNldCIsIl8iLCJmaXJzdCIsImVtYmVkZGVkRGVidWdTdHJpbmciLCJ3cmFwTFRSIiwid3JhcFJUTCIsIndyYXBEaXJlY3Rpb24iLCJkaXJlY3Rpb24iLCJsb2NhbGVUb0xvY2FsaXplZE5hbWUiLCJsb2NhbGUiLCJwaGV0IiwiY2hpcHBlciIsImxvY2FsZURhdGEiLCJsb2NhbGl6ZWROYW1lIiwiY2FwaXRhbGl6ZSIsInN0ciIsImZpcnN0Q2hhckluZGV4Iiwic2VhcmNoIiwicHJlQ2hhbmdlU3RyaW5nIiwiY2FwaXRhbGl6ZWRDaGFyYWN0ZXIiLCJ0b1VwcGVyQ2FzZSIsInBvc3RDaGFuZ2VTdHJpbmciLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlN0cmluZ1V0aWxzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEzLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIENvbGxlY3Rpb24gb2YgdXRpbGl0eSBmdW5jdGlvbnMgcmVsYXRlZCB0byBTdHJpbmdzLlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBwaGV0Y29tbW9uIGZyb20gJy4uL3BoZXRjb21tb24uanMnO1xyXG5cclxuLy8gVW5pY29kZSBlbWJlZGRpbmcgbWFya3MgdGhhdCB3ZSB1c2UuXHJcbmNvbnN0IExUUiA9ICdcXHUyMDJhJztcclxuY29uc3QgUlRMID0gJ1xcdTIwMmInO1xyXG5jb25zdCBQT1AgPSAnXFx1MjAyYyc7XHJcblxyXG5jb25zdCBTdHJpbmdVdGlscyA9IHtcclxuXHJcbiAgLyoqXHJcbiAgICogTk9URTogUGxlYXNlIHVzZSBTdHJpbmdVdGlscy5maWxsSW4gaW5zdGVhZCBvZiB0aGlzIGZ1bmN0aW9uLlxyXG4gICAqXHJcbiAgICogaHR0cDovL21vYnppc2guYmxvZ3Nwb3QuY29tLzIwMDgvMTAvc2ltcGxlLW1lc3NhZ2Vmb3JtYXQtZm9yLWphdmFzY3JpcHQuaHRtbFxyXG4gICAqIFNpbWlsYXIgdG8gSmF2YSdzIE1lc3NhZ2VGb3JtYXQsIHN1cHBvcnRzIHNpbXBsZSBzdWJzdGl0dXRpb24sIHNpbXBsZSBzdWJzdGl0dXRpb24gb25seS5cclxuICAgKiBUaGUgZnVsbCBNZXNzYWdlRm9ybWF0IHNwZWNpZmljYXRpb24gYWxsb3dzIGNvbmRpdGlvbmFsIGZvcm1hdHRpbmcsIGZvciBleGFtcGxlIHRvIHN1cHBvcnQgcGx1cmFsaXNhdGlvbi5cclxuICAgKlxyXG4gICAqIEV4YW1wbGU6XHJcbiAgICogPiBTdHJpbmdVdGlscy5mb3JtYXQoICd7MH0gKyB7MX0nLCAyLCAzIClcclxuICAgKiBcIjIgKyAzXCJcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXR0ZXJuIHBhdHRlcm4gc3RyaW5nLCB3aXRoIE4gcGxhY2Vob2xkZXJzLCB3aGVyZSBOIGlzIGFuIGludGVnZXJcclxuICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAqIEBwdWJsaWNcclxuICAgKiBAZGVwcmVjYXRlZCAtIHBsZWFzZSB1c2UgU3RyaW5nVXRpbHMuZmlsbEluXHJcbiAgICovXHJcbiAgZm9ybWF0OiBmdW5jdGlvbiggcGF0dGVybiApIHtcclxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBwcmVmZXItcmVzdC1wYXJhbXNcclxuICAgIGNvbnN0IGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICByZXR1cm4gcGF0dGVybi5yZXBsYWNlKCAveyhcXGQpfS9nLCAoIHIsIG4gKSA9PiBhcmdzWyArbiArIDEgXSApO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEZpbGxzIGluIGEgc2V0IG9mIHBsYWNlaG9sZGVycyBpbiBhIHRlbXBsYXRlLlxyXG4gICAqIFBsYWNlaG9sZGVycyBhcmUgc3BlY2lmaWVkIHdpdGggcGFpcnMgb2YgY3VybHkgYnJhY2VzLCBlLmcuICd7e25hbWV9fSBpcyB7e2FnZX19IHllYXJzIG9sZCdcclxuICAgKiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXRjb21tb24vaXNzdWVzLzM2XHJcbiAgICpcclxuICAgKiBFeGFtcGxlOlxyXG4gICAqID4gU3RyaW5nVXRpbHMuZmlsbEluKCAne3tuYW1lfX0gaXMge3thZ2V9fSB5ZWFycyBvbGQnLCB7IG5hbWU6ICdGcmVkJywgYWdlOiAyMyB9IClcclxuICAgKiBcIkZyZWQgaXMgMjMgeWVhcnMgb2xkXCJcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfFRSZWFkT25seVByb3BlcnR5PHN0cmluZz59IHRlbXBsYXRlIC0gdGhlIHRlbXBsYXRlLCBjb250YWluaW5nIHplcm8gb3IgbW9yZSBwbGFjZWhvbGRlcnNcclxuICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWVzIC0gYSBoYXNoIHdob3NlIGtleXMgY29ycmVzcG9uZCB0byB0aGUgcGxhY2Vob2xkZXIgbmFtZXMsIGUuZy4geyBuYW1lOiAnRnJlZCcsIGFnZTogMjMgfVxyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICBVbnVzZWQga2V5cyBhcmUgc2lsZW50bHkgaWdub3JlZC4gQWxsIHBsYWNlaG9sZGVycyBkbyBub3QgbmVlZCB0byBiZSBmaWxsZWQuXHJcbiAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgKiBAcHVibGljXHJcbiAgICovXHJcbiAgZmlsbEluOiBmdW5jdGlvbiggdGVtcGxhdGUsIHZhbHVlcyApIHtcclxuICAgIHRlbXBsYXRlID0gKCB0ZW1wbGF0ZSAmJiB0ZW1wbGF0ZS5nZXQgKSA/IHRlbXBsYXRlLmdldCgpIDogdGVtcGxhdGU7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2YgdGVtcGxhdGUgPT09ICdzdHJpbmcnLCBgaW52YWxpZCB0ZW1wbGF0ZTogJHt0ZW1wbGF0ZX1gICk7XHJcblxyXG4gICAgLy8gVG8gY2F0Y2ggYXR0ZW1wdHMgdG8gdXNlIFN0cmluZ1V0aWxzLmZpbGxJbiBsaWtlIFN0cmluZ1V0aWxzLmZvcm1hdFxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdmFsdWVzICYmIHR5cGVvZiB2YWx1ZXMgPT09ICdvYmplY3QnLCBgaW52YWxpZCB2YWx1ZXM6ICR7dmFsdWVzfWAgKTtcclxuXHJcbiAgICBsZXQgbmV3U3RyaW5nID0gdGVtcGxhdGU7XHJcblxyXG4gICAgLy8ge3N0cmluZ1tdfSBwYXJzZSBvdXQgdGhlIHNldCBvZiBwbGFjZWhvbGRlcnNcclxuICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IHRlbXBsYXRlLm1hdGNoKCAvXFx7XFx7W157fV0rXFx9XFx9L2cgKSB8fCBbXTtcclxuXHJcbiAgICAvLyByZXBsYWNlIGVhY2ggcGxhY2Vob2xkZXIgd2l0aCBpdHMgY29ycmVzcG9uZGluZyB2YWx1ZVxyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgcGxhY2Vob2xkZXJzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBjb25zdCBwbGFjZWhvbGRlciA9IHBsYWNlaG9sZGVyc1sgaSBdO1xyXG5cclxuICAgICAgLy8ga2V5IGlzIHRoZSBwb3J0aW9uIG9mIHRoZSBwbGFjZWhvbGRlciBiZXR3ZWVuIHRoZSBjdXJseSBicmFjZXNcclxuICAgICAgY29uc3Qga2V5ID0gcGxhY2Vob2xkZXIucmVwbGFjZSggJ3t7JywgJycgKS5yZXBsYWNlKCAnfX0nLCAnJyApO1xyXG4gICAgICBpZiAoIHZhbHVlc1sga2V5IF0gIT09IHVuZGVmaW5lZCApIHtcclxuXHJcbiAgICAgICAgLy8gU3VwcG9ydCBQcm9wZXJ0aWVzIGFzIHZhbHVlc1xyXG4gICAgICAgIGNvbnN0IHZhbHVlU3RyaW5nID0gKCB2YWx1ZXNbIGtleSBdICYmIHZhbHVlc1sga2V5IF0uZ2V0ICkgPyB2YWx1ZXNbIGtleSBdLmdldCgpIDogdmFsdWVzWyBrZXkgXTtcclxuICAgICAgICBuZXdTdHJpbmcgPSBuZXdTdHJpbmcucmVwbGFjZSggcGxhY2Vob2xkZXIsIHZhbHVlU3RyaW5nICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3U3RyaW5nO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEBwdWJsaWNcclxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoaXMgbGVuZ3RoLTEgc3RyaW5nIGlzIGVxdWFsIHRvIG9uZSBvZiB0aGUgdGhyZWUgZGlyZWN0aW9uYWwgZW1iZWRkaW5nIG1hcmtzIHVzZWQuXHJcbiAgICovXHJcbiAgaXNFbWJlZGRpbmdNYXJrOiBmdW5jdGlvbiggY2hyICkge1xyXG4gICAgcmV0dXJuIGNociA9PT0gTFRSIHx8IGNociA9PT0gUlRMIHx8IGNociA9PT0gUE9QO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEdpdmVuIGEgc3RyaW5nIHdpdGggZW1iZWRkaW5nIG1hcmtzLCB0aGlzIGZ1bmN0aW9uIHJldHVybnMgYW4gZXF1aXZhbGVudCBzdHJpbmcuc2xpY2UoKSBidXQgcHJlZml4ZXMgYW5kIHN1ZmZpeGVzXHJcbiAgICogdGhlIHN0cmluZyB3aXRoIHRoZSBlbWJlZGRpbmcgbWFya3MgbmVlZGVkIHRvIGVuc3VyZSB0aGluZ3MgaGF2ZSB0aGUgY29ycmVjdCBMVFIvUlRMIG9yZGVyLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEZvciBleGFtcGxlLCB3aXRoIGEgdGVzdCBzdHJpbmc6XHJcbiAgICpcclxuICAgKiBlbWJlZGRlZERlYnVnU3RyaW5nKCAnXFx1MjAyYVxcdTIwMmJoaVxcdTIwMmNcXHUyMDJjJyApXHJcbiAgICogPT09IFwiW0xUUl1bUlRMXWhpW1BPUF1bUE9QXVwiXHJcbiAgICpcclxuICAgKiBXZSBjb3VsZCBncmFiIHRoZSBmaXJzdCB3b3JkLCBhbmQgaXQgYWRkcyB0aGUgZW5kaW5nIFBPUDpcclxuICAgKiBlbWJlZGRlZERlYnVnU3RyaW5nKCBlbWJlZGRlZFNsaWNlKCAnXFx1MjAyYWZpcnN0XFx1MjAyYnNlY29uZFxcdTIwMmN0aGlyZFxcdTIwMmMnLCAwLCA2ICkgKVxyXG4gICAqID09PSBcIltMVFJdZmlyc3RbUE9QXVwiXHJcbiAgICpcclxuICAgKiBPciB0aGUgc2Vjb25kIHdvcmQ6XHJcbiAgICogZW1iZWRkZWREZWJ1Z1N0cmluZyggZW1iZWRkZWRTbGljZSggJ1xcdTIwMmFmaXJzdFxcdTIwMmJzZWNvbmRcXHUyMDJjdGhpcmRcXHUyMDJjJywgNiwgMTQgKSApXHJcbiAgICogPT09IFwiW1JUTF1zZWNvbmRbUE9QXVwiXHJcbiAgICpcclxuICAgKiBPciBhIGN1c3RvbSByYW5nZTpcclxuICAgKiBlbWJlZGRlZERlYnVnU3RyaW5nKCBlbWJlZGRlZFNsaWNlKCAnXFx1MjAyYWZpcnN0XFx1MjAyYnNlY29uZFxcdTIwMmN0aGlyZFxcdTIwMmMnLCAzLCAtMyApIClcclxuICAgKiA9PT0gXCJbTFRSXXJzdFtSVExdc2Vjb25kW1BPUF10aGlbUE9QXVwiXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gVGhlIG1haW4gc291cmNlIHN0cmluZyB0byBzbGljZSBmcm9tXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0SW5kZXggLSBUaGUgc3RhcnRpbmcgaW5kZXggd2hlcmUgdGhlIHNsaWNlIHN0YXJ0cyAoaW5jbHVkZXMgY2hhciBhdCB0aGlzIGluZGV4KVxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbZW5kSW5kZXhdIC0gVGhlIGVuZGluZyBpbmRleCB3aGVyZSB0aGUgc2xpY2Ugc3RvcHMgKGRvZXMgTk9UIGluY2x1ZGUgY2hhciBhdCB0aGlzIGluZGV4KVxyXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IC0gVGhlIHNsaWNlZCBzdHJpbmcsIHdpdGggZW1iZWRkaW5nIG1hcmtzIGFkZGVkIGF0IGh0ZSBzdGFydCBhbmQgZW5kLlxyXG4gICAqL1xyXG4gIGVtYmVkZGVkU2xpY2U6IGZ1bmN0aW9uKCBzdHJpbmcsIHN0YXJ0SW5kZXgsIGVuZEluZGV4ICkge1xyXG4gICAgLy8ge0FycmF5LjxzdHJpbmc+fSAtIGFycmF5IG9mIExUUi9SVEwgZW1iZWRkaW5nIG1hcmtzIHRoYXQgYXJlIGN1cnJlbnRseSBvbiB0aGUgc3RhY2sgZm9yIHRoZSBjdXJyZW50IGxvY2F0aW9uLlxyXG4gICAgY29uc3Qgc3RhY2sgPSBbXTtcclxuICAgIGxldCBjaHI7XHJcblxyXG4gICAgaWYgKCBlbmRJbmRleCA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICBlbmRJbmRleCA9IHN0cmluZy5sZW5ndGg7XHJcbiAgICB9XHJcbiAgICBpZiAoIGVuZEluZGV4IDwgMCApIHtcclxuICAgICAgZW5kSW5kZXggKz0gc3RyaW5nLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUbyBhdm9pZCByZXR1cm5pbmcgYW4gZXh0cmEgYWRqYWNlbnQgW0xUUl1bUE9QXSBvciBbUlRMXVtQT1BdLCB3ZSBjYW4gbW92ZSB0aGUgc3RhcnQgZm9yd2FyZCBhbmQgdGhlXHJcbiAgICAvLyBlbmQgYmFja3dhcmRzIGFzIGxvbmcgYXMgdGhleSBhcmUgb3ZlciBlbWJlZGRpbmcgbWFya3MgdG8gYXZvaWQgdGhpcy5cclxuICAgIHdoaWxlICggc3RhcnRJbmRleCA8IHN0cmluZy5sZW5ndGggJiYgU3RyaW5nVXRpbHMuaXNFbWJlZGRpbmdNYXJrKCBzdHJpbmcuY2hhckF0KCBzdGFydEluZGV4ICkgKSApIHtcclxuICAgICAgc3RhcnRJbmRleCsrO1xyXG4gICAgfVxyXG4gICAgd2hpbGUgKCBlbmRJbmRleCA+PSAxICYmIFN0cmluZ1V0aWxzLmlzRW1iZWRkaW5nTWFyayggc3RyaW5nLmNoYXJBdCggZW5kSW5kZXggLSAxICkgKSApIHtcclxuICAgICAgZW5kSW5kZXgtLTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiBvdXIgc3RyaW5nIHdpbGwgYmUgZW1wdHksIGp1c3QgYmFpbCBvdXQuXHJcbiAgICBpZiAoIHN0YXJ0SW5kZXggPj0gZW5kSW5kZXggfHwgc3RhcnRJbmRleCA+PSBzdHJpbmcubGVuZ3RoICkge1xyXG4gICAgICByZXR1cm4gJyc7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gV2FsayB1cCB0byB0aGUgc3RhcnQgb2YgdGhlIHN0cmluZ1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgc3RhcnRJbmRleDsgaSsrICkge1xyXG4gICAgICBjaHIgPSBzdHJpbmcuY2hhckF0KCBpICk7XHJcbiAgICAgIGlmICggY2hyID09PSBMVFIgfHwgY2hyID09PSBSVEwgKSB7XHJcbiAgICAgICAgc3RhY2sucHVzaCggY2hyICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIGNociA9PT0gUE9QICkge1xyXG4gICAgICAgIHN0YWNrLnBvcCgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gV2lsbCBzdG9yZSB0aGUgbWluaW11bSBzdGFjayBzaXplIGR1cmluZyBvdXIgc2xpY2UuIFRoaXMgYWxsb3dzIHVzIHRvIHR1cm4gW0xUUl1bUlRMXWJvb1tQT1BdW1BPUF0gaW50b1xyXG4gICAgLy8gW1JUTF1ib29bUE9QXSBieSBza2lwcGluZyB0aGUgXCJvdXRlclwiIGxheWVycy5cclxuICAgIGxldCBtaW5pbXVtU3RhY2tTaXplID0gc3RhY2subGVuZ3RoO1xyXG5cclxuICAgIC8vIFNhdmUgb3VyIGluaXRpYWwgc3RhY2sgZm9yIHByZWZpeCBjb21wdXRhdGlvblxyXG4gICAgbGV0IHN0YXJ0U3RhY2sgPSBzdGFjay5zbGljZSgpO1xyXG5cclxuICAgIC8vIEEgbm9ybWFsIHN0cmluZyBzbGljZVxyXG4gICAgY29uc3Qgc2xpY2UgPSBzdHJpbmcuc2xpY2UoIHN0YXJ0SW5kZXgsIGVuZEluZGV4ICk7XHJcblxyXG4gICAgLy8gV2FsayB0aHJvdWdoIHRoZSBzbGljZWQgc3RyaW5nLCB0byBkZXRlcm1pbmUgd2hhdCB3ZSBuZWVkIGZvciB0aGUgc3VmZml4XHJcbiAgICBmb3IgKCBsZXQgaiA9IDA7IGogPCBzbGljZS5sZW5ndGg7IGorKyApIHtcclxuICAgICAgY2hyID0gc2xpY2UuY2hhckF0KCBqICk7XHJcbiAgICAgIGlmICggY2hyID09PSBMVFIgfHwgY2hyID09PSBSVEwgKSB7XHJcbiAgICAgICAgc3RhY2sucHVzaCggY2hyICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIGNociA9PT0gUE9QICkge1xyXG4gICAgICAgIHN0YWNrLnBvcCgpO1xyXG4gICAgICAgIG1pbmltdW1TdGFja1NpemUgPSBNYXRoLm1pbiggc3RhY2subGVuZ3RoLCBtaW5pbXVtU3RhY2tTaXplICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBPdXIgZW5kaW5nIHN0YWNrIGZvciBzdWZmaXggY29tcHV0YXRpb25cclxuICAgIGxldCBlbmRTdGFjayA9IHN0YWNrO1xyXG5cclxuICAgIC8vIEFsd2F5cyBsZWF2ZSBvbmUgc3RhY2sgbGV2ZWwgb24gdG9wXHJcbiAgICBjb25zdCBudW1Ta2lwcGVkU3RhY2tMZXZlbHMgPSBNYXRoLm1heCggMCwgbWluaW11bVN0YWNrU2l6ZSAtIDEgKTtcclxuICAgIHN0YXJ0U3RhY2sgPSBzdGFydFN0YWNrLnNsaWNlKCBudW1Ta2lwcGVkU3RhY2tMZXZlbHMgKTtcclxuICAgIGVuZFN0YWNrID0gZW5kU3RhY2suc2xpY2UoIG51bVNraXBwZWRTdGFja0xldmVscyApO1xyXG5cclxuICAgIC8vIE91ciBwcmVmaXggd2lsbCBiZSB0aGUgZW1iZWRkaW5nIG1hcmtzIHRoYXQgaGF2ZSBiZWVuIHNraXBwZWQgYW5kIG5vdCBwb3BwZWQuXHJcbiAgICBjb25zdCBwcmVmaXggPSBzdGFydFN0YWNrLmpvaW4oICcnICk7XHJcblxyXG4gICAgLy8gT3VyIHN1ZmZpeCBpbmNsdWRlcyBvbmUgUE9QIGZvciBlYWNoIGVtYmVkZGluZyBtYXJrIGN1cnJlbnRseSBvbiB0aGUgc3RhY2tcclxuICAgIGNvbnN0IHN1ZmZpeCA9IGVuZFN0YWNrLmpvaW4oICcnICkucmVwbGFjZSggLy4vZywgUE9QICk7XHJcblxyXG4gICAgcmV0dXJuIHByZWZpeCArIHNsaWNlICsgc3VmZml4O1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFN0cmluZydzIHNwbGl0KCkgQVBJLCBidXQgdXNlcyBlbWJlZGRlZFNsaWNlKCkgb24gdGhlIGV4dHJhY3RlZCBzdHJpbmdzLlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEZvciBleGFtcGxlLCBnaXZlbiBhIHN0cmluZzpcclxuICAgKlxyXG4gICAqIFN0cmluZ1V0aWxzLmVtYmVkZGVkRGVidWdTdHJpbmcoICdcXHUyMDJhSGVsbG8gIHRoZXJlLCBcXHUyMDJiSG93IGFyZSB5b3VcXHUyMDJjIGRvaW5nP1xcdTIwMmMnICk7XHJcbiAgICogPT09IFwiW0xUUl1IZWxsbyAgdGhlcmUsIFtSVExdSG93IGFyZSB5b3VbUE9QXSBkb2luZz9bUE9QXVwiXHJcbiAgICpcclxuICAgKiBVc2luZyBlbWJlZGRlZFNwbGl0IHdpdGggYSByZWd1bGFyIGV4cHJlc3Npb24gbWF0Y2hpbmcgYSBzZXF1ZW5jZSBvZiBzcGFjZXM6XHJcbiAgICogU3RyaW5nVXRpbHMuZW1iZWRkZWRTcGxpdCggJ1xcdTIwMmFIZWxsbyAgdGhlcmUsIFxcdTIwMmJIb3cgYXJlIHlvdVxcdTIwMmMgZG9pbmc/XFx1MjAyYycsIC8gKy8gKVxyXG4gICAqICAgICAgICAgICAgLm1hcCggU3RyaW5nVXRpbHMuZW1iZWRkZWREZWJ1Z1N0cmluZyApO1xyXG4gICAqID09PSBbIFwiW0xUUl1IZWxsb1tQT1BdXCIsXHJcbiAgICogICAgICAgXCJbTFRSXXRoZXJlLFtQT1BdXCIsXHJcbiAgICogICAgICAgXCJbUlRMXUhvd1tQT1BdXCIsXHJcbiAgICogICAgICAgXCJbUlRMXWFyZVtQT1BdXCIsXHJcbiAgICogICAgICAgXCJbUlRMXXlvdVtQT1BdXCIsXHJcbiAgICogICAgICAgXCJbTFRSXWRvaW5nP1tQT1BdXCIgXVxyXG4gICAqL1xyXG4gIGVtYmVkZGVkU3BsaXQ6IGZ1bmN0aW9uKCBzdHJpbmcsIHNlcGFyYXRvciwgbGltaXQgKSB7XHJcbiAgICAvLyBNYXRjaGluZyBzcGxpdCBBUElcclxuICAgIGlmICggc2VwYXJhdG9yID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgIHJldHVybiBbIHN0cmluZyBdO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHtBcnJheS48c3RyaW5nPn0gLSBXaGF0IHdlIHdpbGwgcHVzaCB0byBhbmQgcmV0dXJuLlxyXG4gICAgbGV0IHJlc3VsdCA9IFtdO1xyXG5cclxuICAgIC8vIHsgaW5kZXg6IHtudW1iZXJ9LCBsZW5ndGg6IHtudW1iZXJ9IH0gLSBMYXN0IHJlc3VsdCBvZiBmaW5kU2VwYXJhdG9yTWF0Y2goKVxyXG4gICAgbGV0IHNlcGFyYXRvck1hdGNoO1xyXG5cclxuICAgIC8vIFJlbWFpbmluZyBwYXJ0IG9mIHRoZSBzdHJpbmcgdG8gc3BsaXQgdXAuIFdpbGwgaGF2ZSBzdWJzdHJpbmdzIHJlbW92ZWQgZnJvbSB0aGUgc3RhcnQuXHJcbiAgICBsZXQgc3RyaW5nVG9TcGxpdCA9IHN0cmluZztcclxuXHJcbiAgICAvLyBGaW5kcyB0aGUgaW5kZXggYW5kIGxlbmd0aCBvZiB0aGUgZmlyc3Qgc3Vic3RyaW5nIG9mIHN0cmluZ1RvU3BsaXQgdGhhdCBtYXRjaGVzIHRoZSBzZXBhcmF0b3IgKHN0cmluZyBvciByZWdleClcclxuICAgIC8vIGFuZCByZXR1cm5zIGFuIG9iamVjdCB3aXRoIHRoZSB0eXBlICB7IGluZGV4OiB7bnVtYmVyfSwgbGVuZ3RoOiB7bnVtYmVyfSB9LlxyXG4gICAgLy8gSWYgaW5kZXggPT09IC0xLCB0aGVyZSB3YXMgbm8gbWF0Y2ggZm9yIHRoZSBzZXBhcmF0b3IuXHJcbiAgICBmdW5jdGlvbiBmaW5kU2VwYXJhdG9yTWF0Y2goKSB7XHJcbiAgICAgIGxldCBpbmRleDtcclxuICAgICAgbGV0IGxlbmd0aDtcclxuICAgICAgaWYgKCBzZXBhcmF0b3IgaW5zdGFuY2VvZiB3aW5kb3cuUmVnRXhwICkge1xyXG4gICAgICAgIGNvbnN0IG1hdGNoID0gc3RyaW5nVG9TcGxpdC5tYXRjaCggc2VwYXJhdG9yICk7XHJcbiAgICAgICAgaWYgKCBtYXRjaCApIHtcclxuICAgICAgICAgIGluZGV4ID0gbWF0Y2guaW5kZXg7XHJcbiAgICAgICAgICBsZW5ndGggPSBtYXRjaFsgMCBdLmxlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBpbmRleCA9IC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2Ygc2VwYXJhdG9yID09PSAnc3RyaW5nJyApO1xyXG5cclxuICAgICAgICBpbmRleCA9IHN0cmluZ1RvU3BsaXQuaW5kZXhPZiggc2VwYXJhdG9yICk7XHJcbiAgICAgICAgbGVuZ3RoID0gc2VwYXJhdG9yLmxlbmd0aDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGluZGV4OiBpbmRleCxcclxuICAgICAgICBsZW5ndGg6IGxlbmd0aFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIExvb3AgdW50aWwgd2UgcnVuIG91dCBvZiBtYXRjaGVzIGZvciB0aGUgc2VwYXJhdG9yLiBGb3IgZWFjaCBzZXBhcmF0b3IgbWF0Y2gsIHN0cmluZ1RvU3BsaXQgZm9yIHRoZSBuZXh0XHJcbiAgICAvLyBpdGVyYXRpb24gd2lsbCBoYXZlIGV2ZXJ5dGhpbmcgdXAgdG8gdGhlIGVuZCBvZiB0aGUgc2VwYXJhdG9yIG1hdGNoIGNob3BwZWQgb2ZmLiBUaGUgaW5kZXhPZmZzZXQgdmFyaWFibGVcclxuICAgIC8vIHN0b3JlcyBob3cgbWFueSBjaGFyYWN0ZXJzIHdlIGhhdmUgY2hvcHBlZCBvZmYgaW4gdGhpcyBmYXNoaW9uLCBzbyB0aGF0IHdlIGNhbiBpbmRleCBpbnRvIHRoZSBvcmlnaW5hbCBzdHJpbmcuXHJcbiAgICBsZXQgaW5kZXhPZmZzZXQgPSAwO1xyXG4gICAgd2hpbGUgKCAoIHNlcGFyYXRvck1hdGNoID0gZmluZFNlcGFyYXRvck1hdGNoKCkgKS5pbmRleCA+PSAwICkge1xyXG4gICAgICAvLyBFeHRyYWN0IGVtYmVkZGVkIHNsaWNlIGZyb20gdGhlIG9yaWdpbmFsLCB1cCB1bnRpbCB0aGUgc2VwYXJhdG9yIG1hdGNoXHJcbiAgICAgIHJlc3VsdC5wdXNoKCBTdHJpbmdVdGlscy5lbWJlZGRlZFNsaWNlKCBzdHJpbmcsIGluZGV4T2Zmc2V0LCBpbmRleE9mZnNldCArIHNlcGFyYXRvck1hdGNoLmluZGV4ICkgKTtcclxuXHJcbiAgICAgIC8vIEhhbmRsZSBjaG9wcGluZyBvZmYgdGhlIHNlY3Rpb24gb2Ygc3RyaW5nVG9TcGxpdCwgc28gd2UgY2FuIGRvIHNpbXBsZSBtYXRjaGluZyBpbiBmaW5kU2VwYXJhdG9yTWF0Y2goKVxyXG4gICAgICBjb25zdCBvZmZzZXQgPSBzZXBhcmF0b3JNYXRjaC5pbmRleCArIHNlcGFyYXRvck1hdGNoLmxlbmd0aDtcclxuICAgICAgc3RyaW5nVG9TcGxpdCA9IHN0cmluZ1RvU3BsaXQuc2xpY2UoIG9mZnNldCApO1xyXG4gICAgICBpbmRleE9mZnNldCArPSBvZmZzZXQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRW1iZWRkZWQgc2xpY2UgZm9yIGFmdGVyIHRoZSBsYXN0IG1hdGNoLiBNYXkgYmUgYW4gZW1wdHkgc3RyaW5nLlxyXG4gICAgcmVzdWx0LnB1c2goIFN0cmluZ1V0aWxzLmVtYmVkZGVkU2xpY2UoIHN0cmluZywgaW5kZXhPZmZzZXQgKSApO1xyXG5cclxuICAgIC8vIE1hdGNoaW5nIHNwbGl0IEFQSVxyXG4gICAgaWYgKCBsaW1pdCAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0eXBlb2YgbGltaXQgPT09ICdudW1iZXInICk7XHJcblxyXG4gICAgICByZXN1bHQgPSBfLmZpcnN0KCByZXN1bHQsIGxpbWl0ICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBSZXBsYWNlcyBlbWJlZGRpbmcgbWFyayBjaGFyYWN0ZXJzIHdpdGggdmlzaWJsZSBzdHJpbmdzLiBVc2VmdWwgZm9yIGRlYnVnZ2luZyBmb3Igc3RyaW5ncyB3aXRoIGVtYmVkZGluZyBtYXJrcy5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nXHJcbiAgICogQHJldHVybnMge3N0cmluZ30gLSBXaXRoIGVtYmVkZGluZyBtYXJrcyByZXBsYWNlZC5cclxuICAgKi9cclxuICBlbWJlZGRlZERlYnVnU3RyaW5nOiBmdW5jdGlvbiggc3RyaW5nICkge1xyXG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKCAvXFx1MjAyYS9nLCAnW0xUUl0nICkucmVwbGFjZSggL1xcdTIwMmIvZywgJ1tSVExdJyApLnJlcGxhY2UoIC9cXHUyMDJjL2csICdbUE9QXScgKTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBXcmFwcyBhIHN0cmluZyB3aXRoIGVtYmVkZGluZyBtYXJrcyBmb3IgTFRSIGRpc3BsYXkuXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZ1xyXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICovXHJcbiAgd3JhcExUUjogZnVuY3Rpb24oIHN0cmluZyApIHtcclxuICAgIHJldHVybiBMVFIgKyBzdHJpbmcgKyBQT1A7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogV3JhcHMgYSBzdHJpbmcgd2l0aCBlbWJlZGRpbmcgbWFya3MgZm9yIFJUTCBkaXNwbGF5LlxyXG4gICAqIEBwdWJsaWNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmdcclxuICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAqL1xyXG4gIHdyYXBSVEw6IGZ1bmN0aW9uKCBzdHJpbmcgKSB7XHJcbiAgICByZXR1cm4gUlRMICsgc3RyaW5nICsgUE9QO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFdyYXBzIGEgc3RyaW5nIHdpdGggZW1iZWRkaW5nIG1hcmtzIGZvciBMVFIvUlRMIGRpc3BsYXksIGRlcGVuZGluZyBvbiB0aGUgZGlyZWN0aW9uXHJcbiAgICogQHB1YmxpY1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZ1xyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBkaXJlY3Rpb24gLSBlaXRoZXIgJ2x0cicgb3IgJ3J0bCdcclxuICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAqL1xyXG4gIHdyYXBEaXJlY3Rpb246IGZ1bmN0aW9uKCBzdHJpbmcsIGRpcmVjdGlvbiApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGRpcmVjdGlvbiA9PT0gJ2x0cicgfHwgZGlyZWN0aW9uID09PSAncnRsJyApO1xyXG5cclxuICAgIGlmICggZGlyZWN0aW9uID09PSAnbHRyJyApIHtcclxuICAgICAgcmV0dXJuIFN0cmluZ1V0aWxzLndyYXBMVFIoIHN0cmluZyApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBTdHJpbmdVdGlscy53cmFwUlRMKCBzdHJpbmcgKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBHaXZlbiBhIGxvY2FsZSwgZS5nLiAnZXMnLCBwcm92aWRlcyB0aGUgbG9jYWxpemVkIG5hbWUsIGUuZy4gJ0VzcGHDsW9sJ1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGxvY2FsZVxyXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICovXHJcbiAgbG9jYWxlVG9Mb2NhbGl6ZWROYW1lOiBmdW5jdGlvbiggbG9jYWxlICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggcGhldC5jaGlwcGVyLmxvY2FsZURhdGFbIGxvY2FsZSBdLCAnbG9jYWxlIG5lZWRzIHRvIGJlIGEgdmFsaWQgbG9jYWxlIGNvZGUgZGVmaW5lZCBpbiBsb2NhbGVEYXRhJyApO1xyXG5cclxuICAgIHJldHVybiBTdHJpbmdVdGlscy53cmFwRGlyZWN0aW9uKFxyXG4gICAgICBwaGV0LmNoaXBwZXIubG9jYWxlRGF0YVsgbG9jYWxlIF0ubG9jYWxpemVkTmFtZSxcclxuICAgICAgcGhldC5jaGlwcGVyLmxvY2FsZURhdGFbIGxvY2FsZSBdLmRpcmVjdGlvblxyXG4gICAgKTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBDYXBpdGFsaXplIHRoZSBmaXJzdCBsZXR0ZXIgb2YgdGhlIGdpdmVuIHN0cmluZy4gIFRoaXMgd2lsbCBza2lwIGNvbnRyb2wgY2hhcmFjdGVycyBhbmQgd2hpdGVzcGFjZSBhdCB0aGUgYmVnaW5uaW5nXHJcbiAgICogb2YgYSBzdHJpbmcuICBJZiB0aGUgbGV0dGVyIGlzIGFscmVhZHkgY2FwaXRhbGl6ZWQgdGhlIHJldHVybmVkIHN0cmluZyB3aWxsIG1hdGNoIHRoZSBwcm92aWRlZCBvbmUuICBTdHJpbmdzIHRoYXRcclxuICAgKiBzdGFydCB3aXRoIG51bWJlcnMsIHN1Y2ggYXMgXCIxIG9mIHRoZXNlIHRoaW5nc1wiIHdpbGwgYmUgZXNzZW50aWFsbHkgdW5jaGFuZ2VkIHRvby5cclxuICAgKlxyXG4gICAqIFRoaXMgd2lsbCBvbmx5IHdvcmsgcmVsaWFibHkgZm9yIEVuZ2xpc2ggc3RyaW5ncy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcclxuICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAqIEBwdWJsaWNcclxuICAgKi9cclxuICBjYXBpdGFsaXplKCBzdHIgKSB7XHJcblxyXG4gICAgLy8gRmluZCB0aGUgaW5kZXggb2YgdGhlIGZpcnN0IGNoYXJhY3RlciB0aGF0IGNhbiBiZSBjYXBpdGFsaXplZC4gIENvbnRyb2wgY2hhcmFjdGVycyBhbmQgd2hpdGVzcGFjZSBhcmUgc2tpcHBlZC5cclxuICAgIGNvbnN0IGZpcnN0Q2hhckluZGV4ID0gc3RyLnNlYXJjaCggL1tBLVphLXowLTldLyApO1xyXG5cclxuICAgIGlmICggZmlyc3RDaGFySW5kZXggPT09IC0xICkge1xyXG5cclxuICAgICAgLy8gTm8gY2hhcmFjdGVycyB3ZXJlIGZvdW5kIGluIHRoZSBzdHJpbmcgdGhhdCBjYW4gYmUgY2FwaXRhbGl6ZWQsIHNvIHJldHVybiBhbiB1bmNoYW5nZWQgY29weS5cclxuICAgICAgcmV0dXJuIHN0ci5zbGljZSggMCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEJyZWFrIHRoZSBzdHJpbmcgYXBhcnQgYW5kIGNhcGl0YWxpemUgdGhlIGlkZW50aWZpZWQgY2hhcmFjdGVyLlxyXG4gICAgY29uc3QgcHJlQ2hhbmdlU3RyaW5nID0gZmlyc3RDaGFySW5kZXggPiAwID8gc3RyLnNsaWNlKCAwLCBmaXJzdENoYXJJbmRleCApIDogJyc7XHJcbiAgICBjb25zdCBjYXBpdGFsaXplZENoYXJhY3RlciA9IHN0ci5jaGFyQXQoIGZpcnN0Q2hhckluZGV4ICkudG9VcHBlckNhc2UoKTtcclxuICAgIGNvbnN0IHBvc3RDaGFuZ2VTdHJpbmcgPSBmaXJzdENoYXJJbmRleCArIDEgPCBzdHIubGVuZ3RoID8gc3RyLnNsaWNlKCBmaXJzdENoYXJJbmRleCArIDEgKSA6ICcnO1xyXG5cclxuICAgIHJldHVybiBwcmVDaGFuZ2VTdHJpbmcgKyBjYXBpdGFsaXplZENoYXJhY3RlciArIHBvc3RDaGFuZ2VTdHJpbmc7XHJcbiAgfVxyXG59O1xyXG5cclxucGhldGNvbW1vbi5yZWdpc3RlciggJ1N0cmluZ1V0aWxzJywgU3RyaW5nVXRpbHMgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFN0cmluZ1V0aWxzOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsVUFBVSxNQUFNLGtCQUFrQjs7QUFFekM7QUFDQSxNQUFNQyxHQUFHLEdBQUcsUUFBUTtBQUNwQixNQUFNQyxHQUFHLEdBQUcsUUFBUTtBQUNwQixNQUFNQyxHQUFHLEdBQUcsUUFBUTtBQUVwQixNQUFNQyxXQUFXLEdBQUc7RUFFbEI7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRUMsTUFBTSxFQUFFLFNBQUFBLENBQVVDLE9BQU8sRUFBRztJQUMxQjtJQUNBLE1BQU1DLElBQUksR0FBR0MsU0FBUztJQUN0QixPQUFPRixPQUFPLENBQUNHLE9BQU8sQ0FBRSxTQUFTLEVBQUUsQ0FBRUMsQ0FBQyxFQUFFQyxDQUFDLEtBQU1KLElBQUksQ0FBRSxDQUFDSSxDQUFDLEdBQUcsQ0FBQyxDQUFHLENBQUM7RUFDakUsQ0FBQztFQUVEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFQyxNQUFNLEVBQUUsU0FBQUEsQ0FBVUMsUUFBUSxFQUFFQyxNQUFNLEVBQUc7SUFDbkNELFFBQVEsR0FBS0EsUUFBUSxJQUFJQSxRQUFRLENBQUNFLEdBQUcsR0FBS0YsUUFBUSxDQUFDRSxHQUFHLENBQUMsQ0FBQyxHQUFHRixRQUFRO0lBQ25FRyxNQUFNLElBQUlBLE1BQU0sQ0FBRSxPQUFPSCxRQUFRLEtBQUssUUFBUSxFQUFHLHFCQUFvQkEsUUFBUyxFQUFFLENBQUM7O0lBRWpGO0lBQ0FHLE1BQU0sSUFBSUEsTUFBTSxDQUFFRixNQUFNLElBQUksT0FBT0EsTUFBTSxLQUFLLFFBQVEsRUFBRyxtQkFBa0JBLE1BQU8sRUFBRSxDQUFDO0lBRXJGLElBQUlHLFNBQVMsR0FBR0osUUFBUTs7SUFFeEI7SUFDQSxNQUFNSyxZQUFZLEdBQUdMLFFBQVEsQ0FBQ00sS0FBSyxDQUFFLGlCQUFrQixDQUFDLElBQUksRUFBRTs7SUFFOUQ7SUFDQSxLQUFNLElBQUlDLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR0YsWUFBWSxDQUFDRyxNQUFNLEVBQUVELENBQUMsRUFBRSxFQUFHO01BQzlDLE1BQU1FLFdBQVcsR0FBR0osWUFBWSxDQUFFRSxDQUFDLENBQUU7O01BRXJDO01BQ0EsTUFBTUcsR0FBRyxHQUFHRCxXQUFXLENBQUNiLE9BQU8sQ0FBRSxJQUFJLEVBQUUsRUFBRyxDQUFDLENBQUNBLE9BQU8sQ0FBRSxJQUFJLEVBQUUsRUFBRyxDQUFDO01BQy9ELElBQUtLLE1BQU0sQ0FBRVMsR0FBRyxDQUFFLEtBQUtDLFNBQVMsRUFBRztRQUVqQztRQUNBLE1BQU1DLFdBQVcsR0FBS1gsTUFBTSxDQUFFUyxHQUFHLENBQUUsSUFBSVQsTUFBTSxDQUFFUyxHQUFHLENBQUUsQ0FBQ1IsR0FBRyxHQUFLRCxNQUFNLENBQUVTLEdBQUcsQ0FBRSxDQUFDUixHQUFHLENBQUMsQ0FBQyxHQUFHRCxNQUFNLENBQUVTLEdBQUcsQ0FBRTtRQUNoR04sU0FBUyxHQUFHQSxTQUFTLENBQUNSLE9BQU8sQ0FBRWEsV0FBVyxFQUFFRyxXQUFZLENBQUM7TUFDM0Q7SUFDRjtJQUVBLE9BQU9SLFNBQVM7RUFDbEIsQ0FBQztFQUVEO0FBQ0Y7QUFDQTtBQUNBO0VBQ0VTLGVBQWUsRUFBRSxTQUFBQSxDQUFVQyxHQUFHLEVBQUc7SUFDL0IsT0FBT0EsR0FBRyxLQUFLMUIsR0FBRyxJQUFJMEIsR0FBRyxLQUFLekIsR0FBRyxJQUFJeUIsR0FBRyxLQUFLeEIsR0FBRztFQUNsRCxDQUFDO0VBRUQ7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0V5QixhQUFhLEVBQUUsU0FBQUEsQ0FBVUMsTUFBTSxFQUFFQyxVQUFVLEVBQUVDLFFBQVEsRUFBRztJQUN0RDtJQUNBLE1BQU1DLEtBQUssR0FBRyxFQUFFO0lBQ2hCLElBQUlMLEdBQUc7SUFFUCxJQUFLSSxRQUFRLEtBQUtQLFNBQVMsRUFBRztNQUM1Qk8sUUFBUSxHQUFHRixNQUFNLENBQUNSLE1BQU07SUFDMUI7SUFDQSxJQUFLVSxRQUFRLEdBQUcsQ0FBQyxFQUFHO01BQ2xCQSxRQUFRLElBQUlGLE1BQU0sQ0FBQ1IsTUFBTTtJQUMzQjs7SUFFQTtJQUNBO0lBQ0EsT0FBUVMsVUFBVSxHQUFHRCxNQUFNLENBQUNSLE1BQU0sSUFBSWpCLFdBQVcsQ0FBQ3NCLGVBQWUsQ0FBRUcsTUFBTSxDQUFDSSxNQUFNLENBQUVILFVBQVcsQ0FBRSxDQUFDLEVBQUc7TUFDakdBLFVBQVUsRUFBRTtJQUNkO0lBQ0EsT0FBUUMsUUFBUSxJQUFJLENBQUMsSUFBSTNCLFdBQVcsQ0FBQ3NCLGVBQWUsQ0FBRUcsTUFBTSxDQUFDSSxNQUFNLENBQUVGLFFBQVEsR0FBRyxDQUFFLENBQUUsQ0FBQyxFQUFHO01BQ3RGQSxRQUFRLEVBQUU7SUFDWjs7SUFFQTtJQUNBLElBQUtELFVBQVUsSUFBSUMsUUFBUSxJQUFJRCxVQUFVLElBQUlELE1BQU0sQ0FBQ1IsTUFBTSxFQUFHO01BQzNELE9BQU8sRUFBRTtJQUNYOztJQUVBO0lBQ0EsS0FBTSxJQUFJRCxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdVLFVBQVUsRUFBRVYsQ0FBQyxFQUFFLEVBQUc7TUFDckNPLEdBQUcsR0FBR0UsTUFBTSxDQUFDSSxNQUFNLENBQUViLENBQUUsQ0FBQztNQUN4QixJQUFLTyxHQUFHLEtBQUsxQixHQUFHLElBQUkwQixHQUFHLEtBQUt6QixHQUFHLEVBQUc7UUFDaEM4QixLQUFLLENBQUNFLElBQUksQ0FBRVAsR0FBSSxDQUFDO01BQ25CLENBQUMsTUFDSSxJQUFLQSxHQUFHLEtBQUt4QixHQUFHLEVBQUc7UUFDdEI2QixLQUFLLENBQUNHLEdBQUcsQ0FBQyxDQUFDO01BQ2I7SUFDRjs7SUFFQTtJQUNBO0lBQ0EsSUFBSUMsZ0JBQWdCLEdBQUdKLEtBQUssQ0FBQ1gsTUFBTTs7SUFFbkM7SUFDQSxJQUFJZ0IsVUFBVSxHQUFHTCxLQUFLLENBQUNNLEtBQUssQ0FBQyxDQUFDOztJQUU5QjtJQUNBLE1BQU1BLEtBQUssR0FBR1QsTUFBTSxDQUFDUyxLQUFLLENBQUVSLFVBQVUsRUFBRUMsUUFBUyxDQUFDOztJQUVsRDtJQUNBLEtBQU0sSUFBSVEsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHRCxLQUFLLENBQUNqQixNQUFNLEVBQUVrQixDQUFDLEVBQUUsRUFBRztNQUN2Q1osR0FBRyxHQUFHVyxLQUFLLENBQUNMLE1BQU0sQ0FBRU0sQ0FBRSxDQUFDO01BQ3ZCLElBQUtaLEdBQUcsS0FBSzFCLEdBQUcsSUFBSTBCLEdBQUcsS0FBS3pCLEdBQUcsRUFBRztRQUNoQzhCLEtBQUssQ0FBQ0UsSUFBSSxDQUFFUCxHQUFJLENBQUM7TUFDbkIsQ0FBQyxNQUNJLElBQUtBLEdBQUcsS0FBS3hCLEdBQUcsRUFBRztRQUN0QjZCLEtBQUssQ0FBQ0csR0FBRyxDQUFDLENBQUM7UUFDWEMsZ0JBQWdCLEdBQUdJLElBQUksQ0FBQ0MsR0FBRyxDQUFFVCxLQUFLLENBQUNYLE1BQU0sRUFBRWUsZ0JBQWlCLENBQUM7TUFDL0Q7SUFDRjs7SUFFQTtJQUNBLElBQUlNLFFBQVEsR0FBR1YsS0FBSzs7SUFFcEI7SUFDQSxNQUFNVyxxQkFBcUIsR0FBR0gsSUFBSSxDQUFDSSxHQUFHLENBQUUsQ0FBQyxFQUFFUixnQkFBZ0IsR0FBRyxDQUFFLENBQUM7SUFDakVDLFVBQVUsR0FBR0EsVUFBVSxDQUFDQyxLQUFLLENBQUVLLHFCQUFzQixDQUFDO0lBQ3RERCxRQUFRLEdBQUdBLFFBQVEsQ0FBQ0osS0FBSyxDQUFFSyxxQkFBc0IsQ0FBQzs7SUFFbEQ7SUFDQSxNQUFNRSxNQUFNLEdBQUdSLFVBQVUsQ0FBQ1MsSUFBSSxDQUFFLEVBQUcsQ0FBQzs7SUFFcEM7SUFDQSxNQUFNQyxNQUFNLEdBQUdMLFFBQVEsQ0FBQ0ksSUFBSSxDQUFFLEVBQUcsQ0FBQyxDQUFDckMsT0FBTyxDQUFFLElBQUksRUFBRU4sR0FBSSxDQUFDO0lBRXZELE9BQU8wQyxNQUFNLEdBQUdQLEtBQUssR0FBR1MsTUFBTTtFQUNoQyxDQUFDO0VBRUQ7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRUMsYUFBYSxFQUFFLFNBQUFBLENBQVVuQixNQUFNLEVBQUVvQixTQUFTLEVBQUVDLEtBQUssRUFBRztJQUNsRDtJQUNBLElBQUtELFNBQVMsS0FBS3pCLFNBQVMsRUFBRztNQUM3QixPQUFPLENBQUVLLE1BQU0sQ0FBRTtJQUNuQjs7SUFFQTtJQUNBLElBQUlzQixNQUFNLEdBQUcsRUFBRTs7SUFFZjtJQUNBLElBQUlDLGNBQWM7O0lBRWxCO0lBQ0EsSUFBSUMsYUFBYSxHQUFHeEIsTUFBTTs7SUFFMUI7SUFDQTtJQUNBO0lBQ0EsU0FBU3lCLGtCQUFrQkEsQ0FBQSxFQUFHO01BQzVCLElBQUlDLEtBQUs7TUFDVCxJQUFJbEMsTUFBTTtNQUNWLElBQUs0QixTQUFTLFlBQVlPLE1BQU0sQ0FBQ0MsTUFBTSxFQUFHO1FBQ3hDLE1BQU10QyxLQUFLLEdBQUdrQyxhQUFhLENBQUNsQyxLQUFLLENBQUU4QixTQUFVLENBQUM7UUFDOUMsSUFBSzlCLEtBQUssRUFBRztVQUNYb0MsS0FBSyxHQUFHcEMsS0FBSyxDQUFDb0MsS0FBSztVQUNuQmxDLE1BQU0sR0FBR0YsS0FBSyxDQUFFLENBQUMsQ0FBRSxDQUFDRSxNQUFNO1FBQzVCLENBQUMsTUFDSTtVQUNIa0MsS0FBSyxHQUFHLENBQUMsQ0FBQztRQUNaO01BQ0YsQ0FBQyxNQUNJO1FBQ0h2QyxNQUFNLElBQUlBLE1BQU0sQ0FBRSxPQUFPaUMsU0FBUyxLQUFLLFFBQVMsQ0FBQztRQUVqRE0sS0FBSyxHQUFHRixhQUFhLENBQUNLLE9BQU8sQ0FBRVQsU0FBVSxDQUFDO1FBQzFDNUIsTUFBTSxHQUFHNEIsU0FBUyxDQUFDNUIsTUFBTTtNQUMzQjtNQUNBLE9BQU87UUFDTGtDLEtBQUssRUFBRUEsS0FBSztRQUNabEMsTUFBTSxFQUFFQTtNQUNWLENBQUM7SUFDSDs7SUFFQTtJQUNBO0lBQ0E7SUFDQSxJQUFJc0MsV0FBVyxHQUFHLENBQUM7SUFDbkIsT0FBUSxDQUFFUCxjQUFjLEdBQUdFLGtCQUFrQixDQUFDLENBQUMsRUFBR0MsS0FBSyxJQUFJLENBQUMsRUFBRztNQUM3RDtNQUNBSixNQUFNLENBQUNqQixJQUFJLENBQUU5QixXQUFXLENBQUN3QixhQUFhLENBQUVDLE1BQU0sRUFBRThCLFdBQVcsRUFBRUEsV0FBVyxHQUFHUCxjQUFjLENBQUNHLEtBQU0sQ0FBRSxDQUFDOztNQUVuRztNQUNBLE1BQU1LLE1BQU0sR0FBR1IsY0FBYyxDQUFDRyxLQUFLLEdBQUdILGNBQWMsQ0FBQy9CLE1BQU07TUFDM0RnQyxhQUFhLEdBQUdBLGFBQWEsQ0FBQ2YsS0FBSyxDQUFFc0IsTUFBTyxDQUFDO01BQzdDRCxXQUFXLElBQUlDLE1BQU07SUFDdkI7O0lBRUE7SUFDQVQsTUFBTSxDQUFDakIsSUFBSSxDQUFFOUIsV0FBVyxDQUFDd0IsYUFBYSxDQUFFQyxNQUFNLEVBQUU4QixXQUFZLENBQUUsQ0FBQzs7SUFFL0Q7SUFDQSxJQUFLVCxLQUFLLEtBQUsxQixTQUFTLEVBQUc7TUFDekJSLE1BQU0sSUFBSUEsTUFBTSxDQUFFLE9BQU9rQyxLQUFLLEtBQUssUUFBUyxDQUFDO01BRTdDQyxNQUFNLEdBQUdVLENBQUMsQ0FBQ0MsS0FBSyxDQUFFWCxNQUFNLEVBQUVELEtBQU0sQ0FBQztJQUNuQztJQUVBLE9BQU9DLE1BQU07RUFDZixDQUFDO0VBRUQ7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRVksbUJBQW1CLEVBQUUsU0FBQUEsQ0FBVWxDLE1BQU0sRUFBRztJQUN0QyxPQUFPQSxNQUFNLENBQUNwQixPQUFPLENBQUUsU0FBUyxFQUFFLE9BQVEsQ0FBQyxDQUFDQSxPQUFPLENBQUUsU0FBUyxFQUFFLE9BQVEsQ0FBQyxDQUFDQSxPQUFPLENBQUUsU0FBUyxFQUFFLE9BQVEsQ0FBQztFQUN6RyxDQUFDO0VBRUQ7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRXVELE9BQU8sRUFBRSxTQUFBQSxDQUFVbkMsTUFBTSxFQUFHO0lBQzFCLE9BQU81QixHQUFHLEdBQUc0QixNQUFNLEdBQUcxQixHQUFHO0VBQzNCLENBQUM7RUFFRDtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFOEQsT0FBTyxFQUFFLFNBQUFBLENBQVVwQyxNQUFNLEVBQUc7SUFDMUIsT0FBTzNCLEdBQUcsR0FBRzJCLE1BQU0sR0FBRzFCLEdBQUc7RUFDM0IsQ0FBQztFQUVEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRStELGFBQWEsRUFBRSxTQUFBQSxDQUFVckMsTUFBTSxFQUFFc0MsU0FBUyxFQUFHO0lBQzNDbkQsTUFBTSxJQUFJQSxNQUFNLENBQUVtRCxTQUFTLEtBQUssS0FBSyxJQUFJQSxTQUFTLEtBQUssS0FBTSxDQUFDO0lBRTlELElBQUtBLFNBQVMsS0FBSyxLQUFLLEVBQUc7TUFDekIsT0FBTy9ELFdBQVcsQ0FBQzRELE9BQU8sQ0FBRW5DLE1BQU8sQ0FBQztJQUN0QyxDQUFDLE1BQ0k7TUFDSCxPQUFPekIsV0FBVyxDQUFDNkQsT0FBTyxDQUFFcEMsTUFBTyxDQUFDO0lBQ3RDO0VBQ0YsQ0FBQztFQUVEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFdUMscUJBQXFCLEVBQUUsU0FBQUEsQ0FBVUMsTUFBTSxFQUFHO0lBQ3hDckQsTUFBTSxJQUFJQSxNQUFNLENBQUVzRCxJQUFJLENBQUNDLE9BQU8sQ0FBQ0MsVUFBVSxDQUFFSCxNQUFNLENBQUUsRUFBRSw4REFBK0QsQ0FBQztJQUVySCxPQUFPakUsV0FBVyxDQUFDOEQsYUFBYSxDQUM5QkksSUFBSSxDQUFDQyxPQUFPLENBQUNDLFVBQVUsQ0FBRUgsTUFBTSxDQUFFLENBQUNJLGFBQWEsRUFDL0NILElBQUksQ0FBQ0MsT0FBTyxDQUFDQyxVQUFVLENBQUVILE1BQU0sQ0FBRSxDQUFDRixTQUNwQyxDQUFDO0VBQ0gsQ0FBQztFQUVEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRU8sVUFBVUEsQ0FBRUMsR0FBRyxFQUFHO0lBRWhCO0lBQ0EsTUFBTUMsY0FBYyxHQUFHRCxHQUFHLENBQUNFLE1BQU0sQ0FBRSxhQUFjLENBQUM7SUFFbEQsSUFBS0QsY0FBYyxLQUFLLENBQUMsQ0FBQyxFQUFHO01BRTNCO01BQ0EsT0FBT0QsR0FBRyxDQUFDckMsS0FBSyxDQUFFLENBQUUsQ0FBQztJQUN2Qjs7SUFFQTtJQUNBLE1BQU13QyxlQUFlLEdBQUdGLGNBQWMsR0FBRyxDQUFDLEdBQUdELEdBQUcsQ0FBQ3JDLEtBQUssQ0FBRSxDQUFDLEVBQUVzQyxjQUFlLENBQUMsR0FBRyxFQUFFO0lBQ2hGLE1BQU1HLG9CQUFvQixHQUFHSixHQUFHLENBQUMxQyxNQUFNLENBQUUyQyxjQUFlLENBQUMsQ0FBQ0ksV0FBVyxDQUFDLENBQUM7SUFDdkUsTUFBTUMsZ0JBQWdCLEdBQUdMLGNBQWMsR0FBRyxDQUFDLEdBQUdELEdBQUcsQ0FBQ3RELE1BQU0sR0FBR3NELEdBQUcsQ0FBQ3JDLEtBQUssQ0FBRXNDLGNBQWMsR0FBRyxDQUFFLENBQUMsR0FBRyxFQUFFO0lBRS9GLE9BQU9FLGVBQWUsR0FBR0Msb0JBQW9CLEdBQUdFLGdCQUFnQjtFQUNsRTtBQUNGLENBQUM7QUFFRGpGLFVBQVUsQ0FBQ2tGLFFBQVEsQ0FBRSxhQUFhLEVBQUU5RSxXQUFZLENBQUM7QUFFakQsZUFBZUEsV0FBVyIsImlnbm9yZUxpc3QiOltdfQ==