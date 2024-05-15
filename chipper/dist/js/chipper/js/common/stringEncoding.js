// Copyright 2023-2024, University of Colorado Boulder

/**
 * Handles encoding and decoding of strings to/from a compact format, to lower the file size and download size of
 * simulations.
 *
 * The encoding is stateful, and takes the approximate form of:
 *
 * for each locale:
 *   ( ADD_LOCALE locale )+
 * for each string key:
 *   ( PUSH_TOKEN token )*
 *   START_STRING
 *   for each locale (en, or has a non-en translation):
 *     (SWITCH_LOCALE locale)?
 *     (ADD_STRING string | ADD_STRING_COPY_LAST)
 *   END_STRING
 *   ( POP_TOKEN token )*
 *
 * We add some combinations of "pop + push", and forms that automatically add on the slash/dot/LTR/RTL substrings.
 *
 * String keys are constructed from stack.join( '' ), we'll push/pop substrings of the string key as we go.
 *
 * If a translation is the same as the English translation, it will be omitted (and the END_STRING without having set
 * a translation will indicate it should be filled with this value). If multiple translations share a non-English value,
 * we can note the value is the same as the last-given string.
 *
 * We also record the last-used locale, so that if we only have one translation, we can omit the SWITCH_LOCALE.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

/* eslint-env node */

const _ = require('lodash');
const toLessEscapedString = require('./toLessEscapedString');
const PUSH_TOKEN = '\u0001'; // push string on the stack
const PUSH_TOKEN_SLASH = '\u0002'; // push `${string}/` on the stack
const PUSH_TOKEN_DOT = '\u0003'; // push `${string}.` on the stack
const POP = '\u0004'; // pop from the stack
const POP_PUSH_TOKEN = '\u0005'; // pop from the stack, then push string on the stack
const POP_PUSH_TOKEN_SLASH = '\u0006'; // pop from the stack, then push `${string}/` on the stack
const POP_PUSH_TOKEN_DOT = '\u0007'; // pop from the stack, then push `${string}.` on the stack
const SWITCH_LOCALE = '\u0008'; // switch to the given locale
const START_STRING = '\u0009'; // start a string
const END_STRING = '\u000A'; // end a string (and fill in missing translations)
const ADD_STRING = '\u000B'; // add a translation string to the current locale and stringKey
const ADD_STRING_LTR_POP = '\u000C'; // add `${LTR}${string}${POP}` to the current locale and stringKey
const ADD_STRING_RTL_POP = '\u000D'; // add `${RTL}${string}${POP}` to the current locale and stringKey
const ADD_STRING_COPY_LAST = '\u000E'; // add the last-used translation to the current locale and stringKey
const ADD_LOCALE = '\u000F'; // add a locale (at the start)
const ESCAPE_CHARACTER = '\u0010'; // we'll need to escape any of these characters if they appear in a string

const MAX_CONTROL_CHARACTER_CODE_POINT = 0x10;
const ESCAPE_CHARACTER_CODE_POINT = 0x10;
const CONTROL_CHARACTERS = [PUSH_TOKEN, PUSH_TOKEN_SLASH, PUSH_TOKEN_DOT, POP, POP_PUSH_TOKEN, POP_PUSH_TOKEN_SLASH, POP_PUSH_TOKEN_DOT, SWITCH_LOCALE, START_STRING, END_STRING, ADD_STRING, ADD_STRING_LTR_POP, ADD_STRING_RTL_POP, ADD_STRING_COPY_LAST, ADD_LOCALE, ESCAPE_CHARACTER];

// Our LTR/RTL embedding characters
const CHAR_LTR = '\u202A';
const CHAR_RTL = '\u202B';
const CHAR_POP = '\u202C';

// Converts a map[ locale ][ stringKey ] => string (with a compact encoding)
const encodeStringMap = stringMap => {
  const locales = Object.keys(stringMap).filter(locale => !!stringMap[locale]).sort();

  // Get all string keys
  const stringKeysSet = new Set();
  locales.forEach(locale => {
    Object.keys(stringMap[locale]).forEach(stringKey => {
      stringKeysSet.add(stringKey);
    });
  });
  // For our stack encoding, we'll want them sorted so we can push/pop deltas between each one
  const stringKeys = [...stringKeysSet].sort();
  const stack = [];
  let currentLocale = null;
  let currentStringValue = null;
  let output = '';

  // Returns the index of the first character that differs between a and b
  const getMatchIndex = (a, b) => {
    let i = 0;
    while (i < Math.min(a.length, b.length) && a[i] === b[i]) {
      i++;
    }
    return i;
  };

  // Encodes a string, escaping any control characters
  const encode = string => {
    let result = '';
    string.split(/(?:)/u).forEach(char => {
      if (CONTROL_CHARACTERS.includes(char)) {
        result += ESCAPE_CHARACTER + char;
      } else {
        result += char;
      }
    });
    return result;
  };

  // Adds a locale to the output
  const addLocale = locale => {
    output += ADD_LOCALE + encode(locale);
  };

  // Pushes a token onto the stack (combining with the previous token if possible)
  const push = token => {
    stack.push(token);
    const hasPop = output.length > 0 && output[output.length - 1] === POP;
    if (hasPop) {
      output = output.slice(0, -1);
    }
    let code;
    if (token.endsWith('/')) {
      token = token.slice(0, -1);
      code = hasPop ? POP_PUSH_TOKEN_SLASH : PUSH_TOKEN_SLASH;
    } else if (token.endsWith('.')) {
      token = token.slice(0, -1);
      code = hasPop ? POP_PUSH_TOKEN_DOT : PUSH_TOKEN_DOT;
    } else {
      code = hasPop ? POP_PUSH_TOKEN : PUSH_TOKEN;
    }
    output += code + encode(token);
  };

  // Pops a token from the stack
  const pop = () => {
    stack.pop();
    output += POP;
  };
  const startString = () => {
    output += START_STRING;
  };
  const endString = () => {
    output += END_STRING;
  };
  const switchLocale = locale => {
    currentLocale = locale;
    output += SWITCH_LOCALE + encode(locale);
  };
  const addStringCopyLast = () => {
    output += ADD_STRING_COPY_LAST;
  };

  // Adds a string to the output, encoding LTR/RTL wrapped forms in a more compact way
  const addString = string => {
    currentStringValue = string;
    let code;
    if (string.startsWith(CHAR_LTR) && string.endsWith(CHAR_POP)) {
      code = ADD_STRING_LTR_POP;
      string = string.slice(1, -1);
    } else if (string.startsWith(CHAR_RTL) && string.endsWith(CHAR_POP)) {
      code = ADD_STRING_RTL_POP;
      string = string.slice(1, -1);
    } else {
      code = ADD_STRING;
    }
    output += code + encode(string);
  };

  ////////////////////////////////////////////////////////////
  // Start of encoding
  ////////////////////////////////////////////////////////////

  locales.forEach(locale => {
    addLocale(locale);
  });
  for (let i = 0; i < stringKeys.length; i++) {
    const stringKey = stringKeys[i];

    // Encode the string key
    {
      while (!stringKey.startsWith(stack.join(''))) {
        pop();
      }

      // We will whittle down the remainder of the string key as we go. We start here from the delta from the last key
      let remainder = stringKey.slice(stack.join('').length);

      // Separate out the requirejsNamespace, if it exists
      if (remainder.includes('/')) {
        const bits = remainder.split('/');
        const token = bits[0] + '/';
        push(token);
        remainder = remainder.slice(token.length);
      }

      // Separate out dot-separated tokens to push independently.
      while (remainder.includes('.')) {
        const bits = remainder.split('.');
        const token = bits[0] + '.';
        push(token);
        remainder = remainder.slice(token.length);
      }

      // See if we share a non-trivial prefix with the next string key, and if so, push it
      if (i + 1 < stringKeys.length) {
        const nextStringKey = stringKeys[i + 1];
        const matchIndex = getMatchIndex(remainder, nextStringKey.slice(stack.join('').length));
        if (matchIndex > 1) {
          const token = remainder.slice(0, matchIndex);
          push(token);
          remainder = remainder.slice(token.length);
        }
      }

      // The rest!
      if (remainder.length) {
        push(remainder);
      }
    }

    // Encode the string
    {
      const defaultValue = stringMap.en[stringKey];

      // Find ONLY the locales that we'll include
      const stringLocales = locales.filter(locale => {
        if (locale === 'en') {
          return true;
        }
        const string = stringMap[locale][stringKey];
        return string !== undefined && string !== defaultValue;
      });
      const stringValues = stringLocales.map(locale => stringMap[locale][stringKey]);

      // We'll order things by the string values, so we can "copy" when they are the same
      const indices = _.sortBy(_.range(0, stringLocales.length), i => stringValues[i]);
      startString();
      indices.forEach(i => {
        const locale = stringLocales[i];
        const string = stringValues[i];
        if (locale !== currentLocale) {
          switchLocale(locale);
        }
        if (string === currentStringValue) {
          addStringCopyLast();
        } else {
          addString(string);
        }
      });
      endString();
    }
  }

  // Double-check our output results in the correct structure
  const testStringMap = decodeStringMap(output);
  for (const locale in stringMap) {
    for (const stringKey in stringMap[locale]) {
      if (stringMap[locale][stringKey] !== testStringMap[locale][stringKey]) {
        throw new Error(`String map encoding failed, mismatch at ${locale} ${stringKey}`);
      }
    }
  }
  return output;
};

// Converts a compact encoding to map[ locale ][ stringKey ]: string
const decodeStringMap = encodedString => {
  const stringMap = {}; // map[ locale ][ stringKey ] => string
  const locales = [];
  const stack = []; // string[], stack.join( '' ) will be the current stringKey
  let currentLocale = null;
  let currentStringValue = null; // the last string value we've seen, for ADD_STRING_COPY_LAST
  let enStringValue = null; // the English string value, for omitted translations
  const localeSet = new Set(); // so we can track the omitted translations
  let stringKey = null;
  const addLocale = locale => {
    stringMap[locale] = {};
    locales.push(locale);
  };
  const push = token => {
    stack.push(token);
  };
  const pop = () => {
    stack.pop();
  };
  const switchLocale = locale => {
    currentLocale = locale;
  };
  const addString = string => {
    currentStringValue = string;
    stringMap[currentLocale][stringKey] = string;
    if (currentLocale === 'en') {
      enStringValue = string;
    }
    localeSet.add(currentLocale);
  };
  const addStringCopy = () => {
    addString(currentStringValue);
  };
  const startString = () => {
    localeSet.clear();
    enStringValue = null;
    stringKey = stack.join('');
  };
  const endString = () => {
    for (let i = 0; i < locales.length; i++) {
      const locale = locales[i];
      if (!localeSet.has(locale)) {
        stringMap[locale][stringKey] = enStringValue;
      }
    }
  };
  let index = 0;
  const bits = encodedString.split(/(?:)/u); // split by code point, so we don't have to worry about surrogate pairs

  // Reads a string from the bits (at our current index), until we hit a non-escaped control character
  const readString = () => {
    let result = '';
    while (index < bits.length) {
      const char = bits[index];
      const codePoint = char.codePointAt(0);

      // Pass through any non-control characters
      if (codePoint > MAX_CONTROL_CHARACTER_CODE_POINT) {
        result += char;
        index++;
      } else if (codePoint === ESCAPE_CHARACTER_CODE_POINT) {
        const nextChar = bits[index + 1];
        result += nextChar;
        index += 2;
      } else {
        break;
      }
    }
    return result;
  };
  while (index < bits.length) {
    const code = bits[index++];
    if (code === PUSH_TOKEN) {
      push(readString());
    } else if (code === PUSH_TOKEN_SLASH) {
      push(readString() + '/');
    } else if (code === PUSH_TOKEN_DOT) {
      push(readString() + '.');
    } else if (code === POP) {
      pop();
    } else if (code === POP_PUSH_TOKEN) {
      pop();
      push(readString());
    } else if (code === POP_PUSH_TOKEN_SLASH) {
      pop();
      push(readString() + '/');
    } else if (code === POP_PUSH_TOKEN_DOT) {
      pop();
      push(readString() + '.');
    } else if (code === SWITCH_LOCALE) {
      switchLocale(readString());
    } else if (code === START_STRING) {
      startString();
    } else if (code === END_STRING) {
      endString();
    } else if (code === ADD_STRING) {
      addString(readString());
    } else if (code === ADD_STRING_LTR_POP) {
      addString(CHAR_LTR + readString() + CHAR_POP);
    } else if (code === ADD_STRING_RTL_POP) {
      addString(CHAR_RTL + readString() + CHAR_POP);
    } else if (code === ADD_STRING_COPY_LAST) {
      addStringCopy();
    } else if (code === ADD_LOCALE) {
      addLocale(readString());
    } else {
      throw new Error('Unrecognized code: ' + code);
    }
  }
  return stringMap;
};

// A minified version of the above, for inclusion in the JS bundle. Approximately 1 kB.
// a = addString
// r = readString
// f = String.fromCharCode
// m = stringMap
// x = locales
// l = locale
// s = stack
// X = currentLocale
// S = currentStringValue
// e = enStringValue
// k = stringKey
// t = localeSet
// b = bits
// j = index
// c = code
// d = char
// p = codePoint
// q = string/result
// y = encodedString
/* eslint-disable */
const smallDecodeStringMapString = "y=>{let m={};let x=[];let s=[];let X=null;let S=null;let e=null;let t=new Set();let k=null;let f=String.fromCharCode;let A=f(1);let B=f(2);let C=f(3);let D=f(4);let E=f(5);let F=f(6);let G=f(7);let H=f(8);let I=f(9);let J=f(0xA);let K=f(0xB);let L=f(0xC);let M=f(0xD);let N=f(0xE);let O=f(0xF);let a=q=>{S=q;m[X][k]=q;if(X=='en'){e=q;}t.add(X);};let j=0;let b=y.split(/(?:)/u);let r=()=>{let q='';while(j<b.length){let d=b[j];let p=d.codePointAt(0);if(p>0x10){q+=d;j++;}else if(p==0x10){q+=b[j+1];j+=2;}else{break;}}return q;};while(j<b.length){let c=b[j++];if(c==A){s.push(r());}else if(c==B){s.push(r()+'/');}else if(c==C){s.push(r()+'.');}else if(c==D){s.pop();}else if(c==E){s.pop();s.push(r());}else if(c==F){s.pop();s.push(r()+'/');}else if(c==G){s.pop();s.push(r()+'.');}else if(c==H){X=r();}else if(c==I){t.clear();e=null;k=s.join('');}else if(c==J){for(let i=0;i<x.length;i++){let l=x[i];if(!t.has(l)){m[l][k]=e;}}}else if(c==K){a(r());}else if(c==L){a(`\u202a${r()}\u202c`);}else if(c==M){a(`\u202b${r()}\u202c`);}else if(c==N){a(S);}else if(c==O){let l=r();m[l]={};x.push(l);}}return m;}";
/* eslint-enable */

// Given a stringMap (map[ locale ][ stringKey ] => string), returns a JS expression string that will decode to it.
const encodeStringMapToJS = stringMap => `(${smallDecodeStringMapString})(${toLessEscapedString(encodeStringMap(stringMap))})`;
module.exports = {
  encodeStringMap: encodeStringMap,
  decodeStringMap: decodeStringMap,
  encodeStringMapToJS: encodeStringMapToJS
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsInRvTGVzc0VzY2FwZWRTdHJpbmciLCJQVVNIX1RPS0VOIiwiUFVTSF9UT0tFTl9TTEFTSCIsIlBVU0hfVE9LRU5fRE9UIiwiUE9QIiwiUE9QX1BVU0hfVE9LRU4iLCJQT1BfUFVTSF9UT0tFTl9TTEFTSCIsIlBPUF9QVVNIX1RPS0VOX0RPVCIsIlNXSVRDSF9MT0NBTEUiLCJTVEFSVF9TVFJJTkciLCJFTkRfU1RSSU5HIiwiQUREX1NUUklORyIsIkFERF9TVFJJTkdfTFRSX1BPUCIsIkFERF9TVFJJTkdfUlRMX1BPUCIsIkFERF9TVFJJTkdfQ09QWV9MQVNUIiwiQUREX0xPQ0FMRSIsIkVTQ0FQRV9DSEFSQUNURVIiLCJNQVhfQ09OVFJPTF9DSEFSQUNURVJfQ09ERV9QT0lOVCIsIkVTQ0FQRV9DSEFSQUNURVJfQ09ERV9QT0lOVCIsIkNPTlRST0xfQ0hBUkFDVEVSUyIsIkNIQVJfTFRSIiwiQ0hBUl9SVEwiLCJDSEFSX1BPUCIsImVuY29kZVN0cmluZ01hcCIsInN0cmluZ01hcCIsImxvY2FsZXMiLCJPYmplY3QiLCJrZXlzIiwiZmlsdGVyIiwibG9jYWxlIiwic29ydCIsInN0cmluZ0tleXNTZXQiLCJTZXQiLCJmb3JFYWNoIiwic3RyaW5nS2V5IiwiYWRkIiwic3RyaW5nS2V5cyIsInN0YWNrIiwiY3VycmVudExvY2FsZSIsImN1cnJlbnRTdHJpbmdWYWx1ZSIsIm91dHB1dCIsImdldE1hdGNoSW5kZXgiLCJhIiwiYiIsImkiLCJNYXRoIiwibWluIiwibGVuZ3RoIiwiZW5jb2RlIiwic3RyaW5nIiwicmVzdWx0Iiwic3BsaXQiLCJjaGFyIiwiaW5jbHVkZXMiLCJhZGRMb2NhbGUiLCJwdXNoIiwidG9rZW4iLCJoYXNQb3AiLCJzbGljZSIsImNvZGUiLCJlbmRzV2l0aCIsInBvcCIsInN0YXJ0U3RyaW5nIiwiZW5kU3RyaW5nIiwic3dpdGNoTG9jYWxlIiwiYWRkU3RyaW5nQ29weUxhc3QiLCJhZGRTdHJpbmciLCJzdGFydHNXaXRoIiwiam9pbiIsInJlbWFpbmRlciIsImJpdHMiLCJuZXh0U3RyaW5nS2V5IiwibWF0Y2hJbmRleCIsImRlZmF1bHRWYWx1ZSIsImVuIiwic3RyaW5nTG9jYWxlcyIsInVuZGVmaW5lZCIsInN0cmluZ1ZhbHVlcyIsIm1hcCIsImluZGljZXMiLCJzb3J0QnkiLCJyYW5nZSIsInRlc3RTdHJpbmdNYXAiLCJkZWNvZGVTdHJpbmdNYXAiLCJFcnJvciIsImVuY29kZWRTdHJpbmciLCJlblN0cmluZ1ZhbHVlIiwibG9jYWxlU2V0IiwiYWRkU3RyaW5nQ29weSIsImNsZWFyIiwiaGFzIiwiaW5kZXgiLCJyZWFkU3RyaW5nIiwiY29kZVBvaW50IiwiY29kZVBvaW50QXQiLCJuZXh0Q2hhciIsInNtYWxsRGVjb2RlU3RyaW5nTWFwU3RyaW5nIiwiZW5jb2RlU3RyaW5nTWFwVG9KUyIsIm1vZHVsZSIsImV4cG9ydHMiXSwic291cmNlcyI6WyJzdHJpbmdFbmNvZGluZy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBIYW5kbGVzIGVuY29kaW5nIGFuZCBkZWNvZGluZyBvZiBzdHJpbmdzIHRvL2Zyb20gYSBjb21wYWN0IGZvcm1hdCwgdG8gbG93ZXIgdGhlIGZpbGUgc2l6ZSBhbmQgZG93bmxvYWQgc2l6ZSBvZlxyXG4gKiBzaW11bGF0aW9ucy5cclxuICpcclxuICogVGhlIGVuY29kaW5nIGlzIHN0YXRlZnVsLCBhbmQgdGFrZXMgdGhlIGFwcHJveGltYXRlIGZvcm0gb2Y6XHJcbiAqXHJcbiAqIGZvciBlYWNoIGxvY2FsZTpcclxuICogICAoIEFERF9MT0NBTEUgbG9jYWxlICkrXHJcbiAqIGZvciBlYWNoIHN0cmluZyBrZXk6XHJcbiAqICAgKCBQVVNIX1RPS0VOIHRva2VuICkqXHJcbiAqICAgU1RBUlRfU1RSSU5HXHJcbiAqICAgZm9yIGVhY2ggbG9jYWxlIChlbiwgb3IgaGFzIGEgbm9uLWVuIHRyYW5zbGF0aW9uKTpcclxuICogICAgIChTV0lUQ0hfTE9DQUxFIGxvY2FsZSk/XHJcbiAqICAgICAoQUREX1NUUklORyBzdHJpbmcgfCBBRERfU1RSSU5HX0NPUFlfTEFTVClcclxuICogICBFTkRfU1RSSU5HXHJcbiAqICAgKCBQT1BfVE9LRU4gdG9rZW4gKSpcclxuICpcclxuICogV2UgYWRkIHNvbWUgY29tYmluYXRpb25zIG9mIFwicG9wICsgcHVzaFwiLCBhbmQgZm9ybXMgdGhhdCBhdXRvbWF0aWNhbGx5IGFkZCBvbiB0aGUgc2xhc2gvZG90L0xUUi9SVEwgc3Vic3RyaW5ncy5cclxuICpcclxuICogU3RyaW5nIGtleXMgYXJlIGNvbnN0cnVjdGVkIGZyb20gc3RhY2suam9pbiggJycgKSwgd2UnbGwgcHVzaC9wb3Agc3Vic3RyaW5ncyBvZiB0aGUgc3RyaW5nIGtleSBhcyB3ZSBnby5cclxuICpcclxuICogSWYgYSB0cmFuc2xhdGlvbiBpcyB0aGUgc2FtZSBhcyB0aGUgRW5nbGlzaCB0cmFuc2xhdGlvbiwgaXQgd2lsbCBiZSBvbWl0dGVkIChhbmQgdGhlIEVORF9TVFJJTkcgd2l0aG91dCBoYXZpbmcgc2V0XHJcbiAqIGEgdHJhbnNsYXRpb24gd2lsbCBpbmRpY2F0ZSBpdCBzaG91bGQgYmUgZmlsbGVkIHdpdGggdGhpcyB2YWx1ZSkuIElmIG11bHRpcGxlIHRyYW5zbGF0aW9ucyBzaGFyZSBhIG5vbi1FbmdsaXNoIHZhbHVlLFxyXG4gKiB3ZSBjYW4gbm90ZSB0aGUgdmFsdWUgaXMgdGhlIHNhbWUgYXMgdGhlIGxhc3QtZ2l2ZW4gc3RyaW5nLlxyXG4gKlxyXG4gKiBXZSBhbHNvIHJlY29yZCB0aGUgbGFzdC11c2VkIGxvY2FsZSwgc28gdGhhdCBpZiB3ZSBvbmx5IGhhdmUgb25lIHRyYW5zbGF0aW9uLCB3ZSBjYW4gb21pdCB0aGUgU1dJVENIX0xPQ0FMRS5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbi8qIGVzbGludC1lbnYgbm9kZSAqL1xyXG5cclxuY29uc3QgXyA9IHJlcXVpcmUoICdsb2Rhc2gnICk7XHJcbmNvbnN0IHRvTGVzc0VzY2FwZWRTdHJpbmcgPSByZXF1aXJlKCAnLi90b0xlc3NFc2NhcGVkU3RyaW5nJyApO1xyXG5cclxuY29uc3QgUFVTSF9UT0tFTiA9ICdcXHUwMDAxJzsgLy8gcHVzaCBzdHJpbmcgb24gdGhlIHN0YWNrXHJcbmNvbnN0IFBVU0hfVE9LRU5fU0xBU0ggPSAnXFx1MDAwMic7IC8vIHB1c2ggYCR7c3RyaW5nfS9gIG9uIHRoZSBzdGFja1xyXG5jb25zdCBQVVNIX1RPS0VOX0RPVCA9ICdcXHUwMDAzJzsgLy8gcHVzaCBgJHtzdHJpbmd9LmAgb24gdGhlIHN0YWNrXHJcbmNvbnN0IFBPUCA9ICdcXHUwMDA0JzsgLy8gcG9wIGZyb20gdGhlIHN0YWNrXHJcbmNvbnN0IFBPUF9QVVNIX1RPS0VOID0gJ1xcdTAwMDUnOyAvLyBwb3AgZnJvbSB0aGUgc3RhY2ssIHRoZW4gcHVzaCBzdHJpbmcgb24gdGhlIHN0YWNrXHJcbmNvbnN0IFBPUF9QVVNIX1RPS0VOX1NMQVNIID0gJ1xcdTAwMDYnOyAvLyBwb3AgZnJvbSB0aGUgc3RhY2ssIHRoZW4gcHVzaCBgJHtzdHJpbmd9L2Agb24gdGhlIHN0YWNrXHJcbmNvbnN0IFBPUF9QVVNIX1RPS0VOX0RPVCA9ICdcXHUwMDA3JzsgLy8gcG9wIGZyb20gdGhlIHN0YWNrLCB0aGVuIHB1c2ggYCR7c3RyaW5nfS5gIG9uIHRoZSBzdGFja1xyXG5jb25zdCBTV0lUQ0hfTE9DQUxFID0gJ1xcdTAwMDgnOyAvLyBzd2l0Y2ggdG8gdGhlIGdpdmVuIGxvY2FsZVxyXG5jb25zdCBTVEFSVF9TVFJJTkcgPSAnXFx1MDAwOSc7IC8vIHN0YXJ0IGEgc3RyaW5nXHJcbmNvbnN0IEVORF9TVFJJTkcgPSAnXFx1MDAwQSc7IC8vIGVuZCBhIHN0cmluZyAoYW5kIGZpbGwgaW4gbWlzc2luZyB0cmFuc2xhdGlvbnMpXHJcbmNvbnN0IEFERF9TVFJJTkcgPSAnXFx1MDAwQic7IC8vIGFkZCBhIHRyYW5zbGF0aW9uIHN0cmluZyB0byB0aGUgY3VycmVudCBsb2NhbGUgYW5kIHN0cmluZ0tleVxyXG5jb25zdCBBRERfU1RSSU5HX0xUUl9QT1AgPSAnXFx1MDAwQyc7IC8vIGFkZCBgJHtMVFJ9JHtzdHJpbmd9JHtQT1B9YCB0byB0aGUgY3VycmVudCBsb2NhbGUgYW5kIHN0cmluZ0tleVxyXG5jb25zdCBBRERfU1RSSU5HX1JUTF9QT1AgPSAnXFx1MDAwRCc7IC8vIGFkZCBgJHtSVEx9JHtzdHJpbmd9JHtQT1B9YCB0byB0aGUgY3VycmVudCBsb2NhbGUgYW5kIHN0cmluZ0tleVxyXG5jb25zdCBBRERfU1RSSU5HX0NPUFlfTEFTVCA9ICdcXHUwMDBFJzsgLy8gYWRkIHRoZSBsYXN0LXVzZWQgdHJhbnNsYXRpb24gdG8gdGhlIGN1cnJlbnQgbG9jYWxlIGFuZCBzdHJpbmdLZXlcclxuY29uc3QgQUREX0xPQ0FMRSA9ICdcXHUwMDBGJzsgLy8gYWRkIGEgbG9jYWxlIChhdCB0aGUgc3RhcnQpXHJcbmNvbnN0IEVTQ0FQRV9DSEFSQUNURVIgPSAnXFx1MDAxMCc7IC8vIHdlJ2xsIG5lZWQgdG8gZXNjYXBlIGFueSBvZiB0aGVzZSBjaGFyYWN0ZXJzIGlmIHRoZXkgYXBwZWFyIGluIGEgc3RyaW5nXHJcblxyXG5jb25zdCBNQVhfQ09OVFJPTF9DSEFSQUNURVJfQ09ERV9QT0lOVCA9IDB4MTA7XHJcbmNvbnN0IEVTQ0FQRV9DSEFSQUNURVJfQ09ERV9QT0lOVCA9IDB4MTA7XHJcblxyXG5jb25zdCBDT05UUk9MX0NIQVJBQ1RFUlMgPSBbXHJcbiAgUFVTSF9UT0tFTixcclxuICBQVVNIX1RPS0VOX1NMQVNILFxyXG4gIFBVU0hfVE9LRU5fRE9ULFxyXG4gIFBPUCxcclxuICBQT1BfUFVTSF9UT0tFTixcclxuICBQT1BfUFVTSF9UT0tFTl9TTEFTSCxcclxuICBQT1BfUFVTSF9UT0tFTl9ET1QsXHJcbiAgU1dJVENIX0xPQ0FMRSxcclxuICBTVEFSVF9TVFJJTkcsXHJcbiAgRU5EX1NUUklORyxcclxuICBBRERfU1RSSU5HLFxyXG4gIEFERF9TVFJJTkdfTFRSX1BPUCxcclxuICBBRERfU1RSSU5HX1JUTF9QT1AsXHJcbiAgQUREX1NUUklOR19DT1BZX0xBU1QsXHJcbiAgQUREX0xPQ0FMRSxcclxuICBFU0NBUEVfQ0hBUkFDVEVSXHJcbl07XHJcblxyXG4vLyBPdXIgTFRSL1JUTCBlbWJlZGRpbmcgY2hhcmFjdGVyc1xyXG5jb25zdCBDSEFSX0xUUiA9ICdcXHUyMDJBJztcclxuY29uc3QgQ0hBUl9SVEwgPSAnXFx1MjAyQic7XHJcbmNvbnN0IENIQVJfUE9QID0gJ1xcdTIwMkMnO1xyXG5cclxuLy8gQ29udmVydHMgYSBtYXBbIGxvY2FsZSBdWyBzdHJpbmdLZXkgXSA9PiBzdHJpbmcgKHdpdGggYSBjb21wYWN0IGVuY29kaW5nKVxyXG5jb25zdCBlbmNvZGVTdHJpbmdNYXAgPSBzdHJpbmdNYXAgPT4ge1xyXG4gIGNvbnN0IGxvY2FsZXMgPSBPYmplY3Qua2V5cyggc3RyaW5nTWFwICkuZmlsdGVyKCBsb2NhbGUgPT4gISFzdHJpbmdNYXBbIGxvY2FsZSBdICkuc29ydCgpO1xyXG5cclxuICAvLyBHZXQgYWxsIHN0cmluZyBrZXlzXHJcbiAgY29uc3Qgc3RyaW5nS2V5c1NldCA9IG5ldyBTZXQoKTtcclxuICBsb2NhbGVzLmZvckVhY2goIGxvY2FsZSA9PiB7XHJcbiAgICBPYmplY3Qua2V5cyggc3RyaW5nTWFwWyBsb2NhbGUgXSApLmZvckVhY2goIHN0cmluZ0tleSA9PiB7XHJcbiAgICAgIHN0cmluZ0tleXNTZXQuYWRkKCBzdHJpbmdLZXkgKTtcclxuICAgIH0gKTtcclxuICB9ICk7XHJcbiAgLy8gRm9yIG91ciBzdGFjayBlbmNvZGluZywgd2UnbGwgd2FudCB0aGVtIHNvcnRlZCBzbyB3ZSBjYW4gcHVzaC9wb3AgZGVsdGFzIGJldHdlZW4gZWFjaCBvbmVcclxuICBjb25zdCBzdHJpbmdLZXlzID0gWyAuLi5zdHJpbmdLZXlzU2V0IF0uc29ydCgpO1xyXG5cclxuXHJcbiAgY29uc3Qgc3RhY2sgPSBbXTtcclxuICBsZXQgY3VycmVudExvY2FsZSA9IG51bGw7XHJcbiAgbGV0IGN1cnJlbnRTdHJpbmdWYWx1ZSA9IG51bGw7XHJcbiAgbGV0IG91dHB1dCA9ICcnO1xyXG5cclxuICAvLyBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgZmlyc3QgY2hhcmFjdGVyIHRoYXQgZGlmZmVycyBiZXR3ZWVuIGEgYW5kIGJcclxuICBjb25zdCBnZXRNYXRjaEluZGV4ID0gKCBhLCBiICkgPT4ge1xyXG4gICAgbGV0IGkgPSAwO1xyXG4gICAgd2hpbGUgKCBpIDwgTWF0aC5taW4oIGEubGVuZ3RoLCBiLmxlbmd0aCApICYmIGFbIGkgXSA9PT0gYlsgaSBdICkge1xyXG4gICAgICBpKys7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaTtcclxuICB9O1xyXG5cclxuICAvLyBFbmNvZGVzIGEgc3RyaW5nLCBlc2NhcGluZyBhbnkgY29udHJvbCBjaGFyYWN0ZXJzXHJcbiAgY29uc3QgZW5jb2RlID0gc3RyaW5nID0+IHtcclxuICAgIGxldCByZXN1bHQgPSAnJztcclxuXHJcbiAgICBzdHJpbmcuc3BsaXQoIC8oPzopL3UgKS5mb3JFYWNoKCBjaGFyID0+IHtcclxuICAgICAgaWYgKCBDT05UUk9MX0NIQVJBQ1RFUlMuaW5jbHVkZXMoIGNoYXIgKSApIHtcclxuICAgICAgICByZXN1bHQgKz0gRVNDQVBFX0NIQVJBQ1RFUiArIGNoYXI7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcmVzdWx0ICs9IGNoYXI7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH07XHJcblxyXG4gIC8vIEFkZHMgYSBsb2NhbGUgdG8gdGhlIG91dHB1dFxyXG4gIGNvbnN0IGFkZExvY2FsZSA9IGxvY2FsZSA9PiB7XHJcbiAgICBvdXRwdXQgKz0gQUREX0xPQ0FMRSArIGVuY29kZSggbG9jYWxlICk7XHJcbiAgfTtcclxuXHJcbiAgLy8gUHVzaGVzIGEgdG9rZW4gb250byB0aGUgc3RhY2sgKGNvbWJpbmluZyB3aXRoIHRoZSBwcmV2aW91cyB0b2tlbiBpZiBwb3NzaWJsZSlcclxuICBjb25zdCBwdXNoID0gdG9rZW4gPT4ge1xyXG4gICAgc3RhY2sucHVzaCggdG9rZW4gKTtcclxuICAgIGNvbnN0IGhhc1BvcCA9IG91dHB1dC5sZW5ndGggPiAwICYmIG91dHB1dFsgb3V0cHV0Lmxlbmd0aCAtIDEgXSA9PT0gUE9QO1xyXG5cclxuICAgIGlmICggaGFzUG9wICkge1xyXG4gICAgICBvdXRwdXQgPSBvdXRwdXQuc2xpY2UoIDAsIC0xICk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGNvZGU7XHJcbiAgICBpZiAoIHRva2VuLmVuZHNXaXRoKCAnLycgKSApIHtcclxuICAgICAgdG9rZW4gPSB0b2tlbi5zbGljZSggMCwgLTEgKTtcclxuICAgICAgY29kZSA9IGhhc1BvcCA/IFBPUF9QVVNIX1RPS0VOX1NMQVNIIDogUFVTSF9UT0tFTl9TTEFTSDtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCB0b2tlbi5lbmRzV2l0aCggJy4nICkgKSB7XHJcbiAgICAgIHRva2VuID0gdG9rZW4uc2xpY2UoIDAsIC0xICk7XHJcbiAgICAgIGNvZGUgPSBoYXNQb3AgPyBQT1BfUFVTSF9UT0tFTl9ET1QgOiBQVVNIX1RPS0VOX0RPVDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBjb2RlID0gaGFzUG9wID8gUE9QX1BVU0hfVE9LRU4gOiBQVVNIX1RPS0VOO1xyXG4gICAgfVxyXG5cclxuICAgIG91dHB1dCArPSBjb2RlICsgZW5jb2RlKCB0b2tlbiApO1xyXG4gIH07XHJcblxyXG4gIC8vIFBvcHMgYSB0b2tlbiBmcm9tIHRoZSBzdGFja1xyXG4gIGNvbnN0IHBvcCA9ICgpID0+IHtcclxuICAgIHN0YWNrLnBvcCgpO1xyXG4gICAgb3V0cHV0ICs9IFBPUDtcclxuICB9O1xyXG5cclxuICBjb25zdCBzdGFydFN0cmluZyA9ICgpID0+IHtcclxuICAgIG91dHB1dCArPSBTVEFSVF9TVFJJTkc7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgZW5kU3RyaW5nID0gKCkgPT4ge1xyXG4gICAgb3V0cHV0ICs9IEVORF9TVFJJTkc7XHJcbiAgfTtcclxuXHJcbiAgY29uc3Qgc3dpdGNoTG9jYWxlID0gbG9jYWxlID0+IHtcclxuICAgIGN1cnJlbnRMb2NhbGUgPSBsb2NhbGU7XHJcblxyXG4gICAgb3V0cHV0ICs9IFNXSVRDSF9MT0NBTEUgKyBlbmNvZGUoIGxvY2FsZSApO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IGFkZFN0cmluZ0NvcHlMYXN0ID0gKCkgPT4ge1xyXG4gICAgb3V0cHV0ICs9IEFERF9TVFJJTkdfQ09QWV9MQVNUO1xyXG4gIH07XHJcblxyXG4gIC8vIEFkZHMgYSBzdHJpbmcgdG8gdGhlIG91dHB1dCwgZW5jb2RpbmcgTFRSL1JUTCB3cmFwcGVkIGZvcm1zIGluIGEgbW9yZSBjb21wYWN0IHdheVxyXG4gIGNvbnN0IGFkZFN0cmluZyA9IHN0cmluZyA9PiB7XHJcbiAgICBjdXJyZW50U3RyaW5nVmFsdWUgPSBzdHJpbmc7XHJcblxyXG4gICAgbGV0IGNvZGU7XHJcbiAgICBpZiAoIHN0cmluZy5zdGFydHNXaXRoKCBDSEFSX0xUUiApICYmIHN0cmluZy5lbmRzV2l0aCggQ0hBUl9QT1AgKSApIHtcclxuICAgICAgY29kZSA9IEFERF9TVFJJTkdfTFRSX1BPUDtcclxuICAgICAgc3RyaW5nID0gc3RyaW5nLnNsaWNlKCAxLCAtMSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHN0cmluZy5zdGFydHNXaXRoKCBDSEFSX1JUTCApICYmIHN0cmluZy5lbmRzV2l0aCggQ0hBUl9QT1AgKSApIHtcclxuICAgICAgY29kZSA9IEFERF9TVFJJTkdfUlRMX1BPUDtcclxuICAgICAgc3RyaW5nID0gc3RyaW5nLnNsaWNlKCAxLCAtMSApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGNvZGUgPSBBRERfU1RSSU5HO1xyXG4gICAgfVxyXG5cclxuICAgIG91dHB1dCArPSBjb2RlICsgZW5jb2RlKCBzdHJpbmcgKTtcclxuICB9O1xyXG5cclxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuICAvLyBTdGFydCBvZiBlbmNvZGluZ1xyXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuICBsb2NhbGVzLmZvckVhY2goIGxvY2FsZSA9PiB7XHJcbiAgICBhZGRMb2NhbGUoIGxvY2FsZSApO1xyXG4gIH0gKTtcclxuXHJcbiAgZm9yICggbGV0IGkgPSAwOyBpIDwgc3RyaW5nS2V5cy5sZW5ndGg7IGkrKyApIHtcclxuICAgIGNvbnN0IHN0cmluZ0tleSA9IHN0cmluZ0tleXNbIGkgXTtcclxuXHJcbiAgICAvLyBFbmNvZGUgdGhlIHN0cmluZyBrZXlcclxuICAgIHtcclxuICAgICAgd2hpbGUgKCAhc3RyaW5nS2V5LnN0YXJ0c1dpdGgoIHN0YWNrLmpvaW4oICcnICkgKSApIHtcclxuICAgICAgICBwb3AoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gV2Ugd2lsbCB3aGl0dGxlIGRvd24gdGhlIHJlbWFpbmRlciBvZiB0aGUgc3RyaW5nIGtleSBhcyB3ZSBnby4gV2Ugc3RhcnQgaGVyZSBmcm9tIHRoZSBkZWx0YSBmcm9tIHRoZSBsYXN0IGtleVxyXG4gICAgICBsZXQgcmVtYWluZGVyID0gc3RyaW5nS2V5LnNsaWNlKCBzdGFjay5qb2luKCAnJyApLmxlbmd0aCApO1xyXG5cclxuICAgICAgLy8gU2VwYXJhdGUgb3V0IHRoZSByZXF1aXJlanNOYW1lc3BhY2UsIGlmIGl0IGV4aXN0c1xyXG4gICAgICBpZiAoIHJlbWFpbmRlci5pbmNsdWRlcyggJy8nICkgKSB7XHJcbiAgICAgICAgY29uc3QgYml0cyA9IHJlbWFpbmRlci5zcGxpdCggJy8nICk7XHJcbiAgICAgICAgY29uc3QgdG9rZW4gPSBiaXRzWyAwIF0gKyAnLyc7XHJcbiAgICAgICAgcHVzaCggdG9rZW4gKTtcclxuICAgICAgICByZW1haW5kZXIgPSByZW1haW5kZXIuc2xpY2UoIHRva2VuLmxlbmd0aCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBTZXBhcmF0ZSBvdXQgZG90LXNlcGFyYXRlZCB0b2tlbnMgdG8gcHVzaCBpbmRlcGVuZGVudGx5LlxyXG4gICAgICB3aGlsZSAoIHJlbWFpbmRlci5pbmNsdWRlcyggJy4nICkgKSB7XHJcbiAgICAgICAgY29uc3QgYml0cyA9IHJlbWFpbmRlci5zcGxpdCggJy4nICk7XHJcbiAgICAgICAgY29uc3QgdG9rZW4gPSBiaXRzWyAwIF0gKyAnLic7XHJcbiAgICAgICAgcHVzaCggdG9rZW4gKTtcclxuICAgICAgICByZW1haW5kZXIgPSByZW1haW5kZXIuc2xpY2UoIHRva2VuLmxlbmd0aCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBTZWUgaWYgd2Ugc2hhcmUgYSBub24tdHJpdmlhbCBwcmVmaXggd2l0aCB0aGUgbmV4dCBzdHJpbmcga2V5LCBhbmQgaWYgc28sIHB1c2ggaXRcclxuICAgICAgaWYgKCBpICsgMSA8IHN0cmluZ0tleXMubGVuZ3RoICkge1xyXG4gICAgICAgIGNvbnN0IG5leHRTdHJpbmdLZXkgPSBzdHJpbmdLZXlzWyBpICsgMSBdO1xyXG4gICAgICAgIGNvbnN0IG1hdGNoSW5kZXggPSBnZXRNYXRjaEluZGV4KCByZW1haW5kZXIsIG5leHRTdHJpbmdLZXkuc2xpY2UoIHN0YWNrLmpvaW4oICcnICkubGVuZ3RoICkgKTtcclxuICAgICAgICBpZiAoIG1hdGNoSW5kZXggPiAxICkge1xyXG4gICAgICAgICAgY29uc3QgdG9rZW4gPSByZW1haW5kZXIuc2xpY2UoIDAsIG1hdGNoSW5kZXggKTtcclxuICAgICAgICAgIHB1c2goIHRva2VuICk7XHJcbiAgICAgICAgICByZW1haW5kZXIgPSByZW1haW5kZXIuc2xpY2UoIHRva2VuLmxlbmd0aCApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gVGhlIHJlc3QhXHJcbiAgICAgIGlmICggcmVtYWluZGVyLmxlbmd0aCApIHtcclxuICAgICAgICBwdXNoKCByZW1haW5kZXIgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEVuY29kZSB0aGUgc3RyaW5nXHJcbiAgICB7XHJcbiAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IHN0cmluZ01hcC5lblsgc3RyaW5nS2V5IF07XHJcblxyXG4gICAgICAvLyBGaW5kIE9OTFkgdGhlIGxvY2FsZXMgdGhhdCB3ZSdsbCBpbmNsdWRlXHJcbiAgICAgIGNvbnN0IHN0cmluZ0xvY2FsZXMgPSBsb2NhbGVzLmZpbHRlciggbG9jYWxlID0+IHtcclxuICAgICAgICBpZiAoIGxvY2FsZSA9PT0gJ2VuJyApIHtcclxuICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc3RyaW5nID0gc3RyaW5nTWFwWyBsb2NhbGUgXVsgc3RyaW5nS2V5IF07XHJcblxyXG4gICAgICAgIHJldHVybiBzdHJpbmcgIT09IHVuZGVmaW5lZCAmJiBzdHJpbmcgIT09IGRlZmF1bHRWYWx1ZTtcclxuICAgICAgfSApO1xyXG4gICAgICBjb25zdCBzdHJpbmdWYWx1ZXMgPSBzdHJpbmdMb2NhbGVzLm1hcCggbG9jYWxlID0+IHN0cmluZ01hcFsgbG9jYWxlIF1bIHN0cmluZ0tleSBdICk7XHJcblxyXG4gICAgICAvLyBXZSdsbCBvcmRlciB0aGluZ3MgYnkgdGhlIHN0cmluZyB2YWx1ZXMsIHNvIHdlIGNhbiBcImNvcHlcIiB3aGVuIHRoZXkgYXJlIHRoZSBzYW1lXHJcbiAgICAgIGNvbnN0IGluZGljZXMgPSBfLnNvcnRCeSggXy5yYW5nZSggMCwgc3RyaW5nTG9jYWxlcy5sZW5ndGggKSwgaSA9PiBzdHJpbmdWYWx1ZXNbIGkgXSApO1xyXG5cclxuICAgICAgc3RhcnRTdHJpbmcoKTtcclxuXHJcbiAgICAgIGluZGljZXMuZm9yRWFjaCggaSA9PiB7XHJcbiAgICAgICAgY29uc3QgbG9jYWxlID0gc3RyaW5nTG9jYWxlc1sgaSBdO1xyXG4gICAgICAgIGNvbnN0IHN0cmluZyA9IHN0cmluZ1ZhbHVlc1sgaSBdO1xyXG5cclxuICAgICAgICBpZiAoIGxvY2FsZSAhPT0gY3VycmVudExvY2FsZSApIHtcclxuICAgICAgICAgIHN3aXRjaExvY2FsZSggbG9jYWxlICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIHN0cmluZyA9PT0gY3VycmVudFN0cmluZ1ZhbHVlICkge1xyXG4gICAgICAgICAgYWRkU3RyaW5nQ29weUxhc3QoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBhZGRTdHJpbmcoIHN0cmluZyApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG5cclxuICAgICAgZW5kU3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBEb3VibGUtY2hlY2sgb3VyIG91dHB1dCByZXN1bHRzIGluIHRoZSBjb3JyZWN0IHN0cnVjdHVyZVxyXG4gIGNvbnN0IHRlc3RTdHJpbmdNYXAgPSBkZWNvZGVTdHJpbmdNYXAoIG91dHB1dCApO1xyXG4gIGZvciAoIGNvbnN0IGxvY2FsZSBpbiBzdHJpbmdNYXAgKSB7XHJcbiAgICBmb3IgKCBjb25zdCBzdHJpbmdLZXkgaW4gc3RyaW5nTWFwWyBsb2NhbGUgXSApIHtcclxuICAgICAgaWYgKCBzdHJpbmdNYXBbIGxvY2FsZSBdWyBzdHJpbmdLZXkgXSAhPT0gdGVzdFN0cmluZ01hcFsgbG9jYWxlIF1bIHN0cmluZ0tleSBdICkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvciggYFN0cmluZyBtYXAgZW5jb2RpbmcgZmFpbGVkLCBtaXNtYXRjaCBhdCAke2xvY2FsZX0gJHtzdHJpbmdLZXl9YCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gb3V0cHV0O1xyXG59O1xyXG5cclxuLy8gQ29udmVydHMgYSBjb21wYWN0IGVuY29kaW5nIHRvIG1hcFsgbG9jYWxlIF1bIHN0cmluZ0tleSBdOiBzdHJpbmdcclxuY29uc3QgZGVjb2RlU3RyaW5nTWFwID0gZW5jb2RlZFN0cmluZyA9PiB7XHJcbiAgY29uc3Qgc3RyaW5nTWFwID0ge307IC8vIG1hcFsgbG9jYWxlIF1bIHN0cmluZ0tleSBdID0+IHN0cmluZ1xyXG4gIGNvbnN0IGxvY2FsZXMgPSBbXTtcclxuICBjb25zdCBzdGFjayA9IFtdOyAvLyBzdHJpbmdbXSwgc3RhY2suam9pbiggJycgKSB3aWxsIGJlIHRoZSBjdXJyZW50IHN0cmluZ0tleVxyXG4gIGxldCBjdXJyZW50TG9jYWxlID0gbnVsbDtcclxuICBsZXQgY3VycmVudFN0cmluZ1ZhbHVlID0gbnVsbDsgLy8gdGhlIGxhc3Qgc3RyaW5nIHZhbHVlIHdlJ3ZlIHNlZW4sIGZvciBBRERfU1RSSU5HX0NPUFlfTEFTVFxyXG4gIGxldCBlblN0cmluZ1ZhbHVlID0gbnVsbDsgLy8gdGhlIEVuZ2xpc2ggc3RyaW5nIHZhbHVlLCBmb3Igb21pdHRlZCB0cmFuc2xhdGlvbnNcclxuICBjb25zdCBsb2NhbGVTZXQgPSBuZXcgU2V0KCk7IC8vIHNvIHdlIGNhbiB0cmFjayB0aGUgb21pdHRlZCB0cmFuc2xhdGlvbnNcclxuICBsZXQgc3RyaW5nS2V5ID0gbnVsbDtcclxuXHJcbiAgY29uc3QgYWRkTG9jYWxlID0gbG9jYWxlID0+IHtcclxuICAgIHN0cmluZ01hcFsgbG9jYWxlIF0gPSB7fTtcclxuICAgIGxvY2FsZXMucHVzaCggbG9jYWxlICk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgcHVzaCA9IHRva2VuID0+IHtcclxuICAgIHN0YWNrLnB1c2goIHRva2VuICk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgcG9wID0gKCkgPT4ge1xyXG4gICAgc3RhY2sucG9wKCk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3Qgc3dpdGNoTG9jYWxlID0gbG9jYWxlID0+IHtcclxuICAgIGN1cnJlbnRMb2NhbGUgPSBsb2NhbGU7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgYWRkU3RyaW5nID0gc3RyaW5nID0+IHtcclxuICAgIGN1cnJlbnRTdHJpbmdWYWx1ZSA9IHN0cmluZztcclxuICAgIHN0cmluZ01hcFsgY3VycmVudExvY2FsZSBdWyBzdHJpbmdLZXkgXSA9IHN0cmluZztcclxuICAgIGlmICggY3VycmVudExvY2FsZSA9PT0gJ2VuJyApIHtcclxuICAgICAgZW5TdHJpbmdWYWx1ZSA9IHN0cmluZztcclxuICAgIH1cclxuICAgIGxvY2FsZVNldC5hZGQoIGN1cnJlbnRMb2NhbGUgKTtcclxuICB9O1xyXG5cclxuICBjb25zdCBhZGRTdHJpbmdDb3B5ID0gKCkgPT4ge1xyXG4gICAgYWRkU3RyaW5nKCBjdXJyZW50U3RyaW5nVmFsdWUgKTtcclxuICB9O1xyXG5cclxuICBjb25zdCBzdGFydFN0cmluZyA9ICgpID0+IHtcclxuICAgIGxvY2FsZVNldC5jbGVhcigpO1xyXG4gICAgZW5TdHJpbmdWYWx1ZSA9IG51bGw7XHJcbiAgICBzdHJpbmdLZXkgPSBzdGFjay5qb2luKCAnJyApO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IGVuZFN0cmluZyA9ICgpID0+IHtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGxvY2FsZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGxvY2FsZSA9IGxvY2FsZXNbIGkgXTtcclxuICAgICAgaWYgKCAhbG9jYWxlU2V0LmhhcyggbG9jYWxlICkgKSB7XHJcbiAgICAgICAgc3RyaW5nTWFwWyBsb2NhbGUgXVsgc3RyaW5nS2V5IF0gPSBlblN0cmluZ1ZhbHVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgbGV0IGluZGV4ID0gMDtcclxuICBjb25zdCBiaXRzID0gZW5jb2RlZFN0cmluZy5zcGxpdCggLyg/OikvdSApOyAvLyBzcGxpdCBieSBjb2RlIHBvaW50LCBzbyB3ZSBkb24ndCBoYXZlIHRvIHdvcnJ5IGFib3V0IHN1cnJvZ2F0ZSBwYWlyc1xyXG5cclxuICAvLyBSZWFkcyBhIHN0cmluZyBmcm9tIHRoZSBiaXRzIChhdCBvdXIgY3VycmVudCBpbmRleCksIHVudGlsIHdlIGhpdCBhIG5vbi1lc2NhcGVkIGNvbnRyb2wgY2hhcmFjdGVyXHJcbiAgY29uc3QgcmVhZFN0cmluZyA9ICgpID0+IHtcclxuICAgIGxldCByZXN1bHQgPSAnJztcclxuXHJcbiAgICB3aGlsZSAoIGluZGV4IDwgYml0cy5sZW5ndGggKSB7XHJcbiAgICAgIGNvbnN0IGNoYXIgPSBiaXRzWyBpbmRleCBdO1xyXG4gICAgICBjb25zdCBjb2RlUG9pbnQgPSBjaGFyLmNvZGVQb2ludEF0KCAwICk7XHJcblxyXG4gICAgICAvLyBQYXNzIHRocm91Z2ggYW55IG5vbi1jb250cm9sIGNoYXJhY3RlcnNcclxuICAgICAgaWYgKCBjb2RlUG9pbnQgPiBNQVhfQ09OVFJPTF9DSEFSQUNURVJfQ09ERV9QT0lOVCApIHtcclxuICAgICAgICByZXN1bHQgKz0gY2hhcjtcclxuICAgICAgICBpbmRleCsrO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCBjb2RlUG9pbnQgPT09IEVTQ0FQRV9DSEFSQUNURVJfQ09ERV9QT0lOVCApIHtcclxuICAgICAgICBjb25zdCBuZXh0Q2hhciA9IGJpdHNbIGluZGV4ICsgMSBdO1xyXG4gICAgICAgIHJlc3VsdCArPSBuZXh0Q2hhcjtcclxuICAgICAgICBpbmRleCArPSAyO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9O1xyXG5cclxuICB3aGlsZSAoIGluZGV4IDwgYml0cy5sZW5ndGggKSB7XHJcbiAgICBjb25zdCBjb2RlID0gYml0c1sgaW5kZXgrKyBdO1xyXG5cclxuICAgIGlmICggY29kZSA9PT0gUFVTSF9UT0tFTiApIHtcclxuICAgICAgcHVzaCggcmVhZFN0cmluZygpICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggY29kZSA9PT0gUFVTSF9UT0tFTl9TTEFTSCApIHtcclxuICAgICAgcHVzaCggcmVhZFN0cmluZygpICsgJy8nICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggY29kZSA9PT0gUFVTSF9UT0tFTl9ET1QgKSB7XHJcbiAgICAgIHB1c2goIHJlYWRTdHJpbmcoKSArICcuJyApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGNvZGUgPT09IFBPUCApIHtcclxuICAgICAgcG9wKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggY29kZSA9PT0gUE9QX1BVU0hfVE9LRU4gKSB7XHJcbiAgICAgIHBvcCgpO1xyXG4gICAgICBwdXNoKCByZWFkU3RyaW5nKCkgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBjb2RlID09PSBQT1BfUFVTSF9UT0tFTl9TTEFTSCApIHtcclxuICAgICAgcG9wKCk7XHJcbiAgICAgIHB1c2goIHJlYWRTdHJpbmcoKSArICcvJyApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGNvZGUgPT09IFBPUF9QVVNIX1RPS0VOX0RPVCApIHtcclxuICAgICAgcG9wKCk7XHJcbiAgICAgIHB1c2goIHJlYWRTdHJpbmcoKSArICcuJyApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGNvZGUgPT09IFNXSVRDSF9MT0NBTEUgKSB7XHJcbiAgICAgIHN3aXRjaExvY2FsZSggcmVhZFN0cmluZygpICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggY29kZSA9PT0gU1RBUlRfU1RSSU5HICkge1xyXG4gICAgICBzdGFydFN0cmluZygpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGNvZGUgPT09IEVORF9TVFJJTkcgKSB7XHJcbiAgICAgIGVuZFN0cmluZygpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGNvZGUgPT09IEFERF9TVFJJTkcgKSB7XHJcbiAgICAgIGFkZFN0cmluZyggcmVhZFN0cmluZygpICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggY29kZSA9PT0gQUREX1NUUklOR19MVFJfUE9QICkge1xyXG4gICAgICBhZGRTdHJpbmcoIENIQVJfTFRSICsgcmVhZFN0cmluZygpICsgQ0hBUl9QT1AgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBjb2RlID09PSBBRERfU1RSSU5HX1JUTF9QT1AgKSB7XHJcbiAgICAgIGFkZFN0cmluZyggQ0hBUl9SVEwgKyByZWFkU3RyaW5nKCkgKyBDSEFSX1BPUCApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIGNvZGUgPT09IEFERF9TVFJJTkdfQ09QWV9MQVNUICkge1xyXG4gICAgICBhZGRTdHJpbmdDb3B5KCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggY29kZSA9PT0gQUREX0xPQ0FMRSApIHtcclxuICAgICAgYWRkTG9jYWxlKCByZWFkU3RyaW5nKCkgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoICdVbnJlY29nbml6ZWQgY29kZTogJyArIGNvZGUgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBzdHJpbmdNYXA7XHJcbn07XHJcblxyXG4vLyBBIG1pbmlmaWVkIHZlcnNpb24gb2YgdGhlIGFib3ZlLCBmb3IgaW5jbHVzaW9uIGluIHRoZSBKUyBidW5kbGUuIEFwcHJveGltYXRlbHkgMSBrQi5cclxuLy8gYSA9IGFkZFN0cmluZ1xyXG4vLyByID0gcmVhZFN0cmluZ1xyXG4vLyBmID0gU3RyaW5nLmZyb21DaGFyQ29kZVxyXG4vLyBtID0gc3RyaW5nTWFwXHJcbi8vIHggPSBsb2NhbGVzXHJcbi8vIGwgPSBsb2NhbGVcclxuLy8gcyA9IHN0YWNrXHJcbi8vIFggPSBjdXJyZW50TG9jYWxlXHJcbi8vIFMgPSBjdXJyZW50U3RyaW5nVmFsdWVcclxuLy8gZSA9IGVuU3RyaW5nVmFsdWVcclxuLy8gayA9IHN0cmluZ0tleVxyXG4vLyB0ID0gbG9jYWxlU2V0XHJcbi8vIGIgPSBiaXRzXHJcbi8vIGogPSBpbmRleFxyXG4vLyBjID0gY29kZVxyXG4vLyBkID0gY2hhclxyXG4vLyBwID0gY29kZVBvaW50XHJcbi8vIHEgPSBzdHJpbmcvcmVzdWx0XHJcbi8vIHkgPSBlbmNvZGVkU3RyaW5nXHJcbi8qIGVzbGludC1kaXNhYmxlICovXHJcbmNvbnN0IHNtYWxsRGVjb2RlU3RyaW5nTWFwU3RyaW5nID0gXCJ5PT57bGV0IG09e307bGV0IHg9W107bGV0IHM9W107bGV0IFg9bnVsbDtsZXQgUz1udWxsO2xldCBlPW51bGw7bGV0IHQ9bmV3IFNldCgpO2xldCBrPW51bGw7bGV0IGY9U3RyaW5nLmZyb21DaGFyQ29kZTtsZXQgQT1mKDEpO2xldCBCPWYoMik7bGV0IEM9ZigzKTtsZXQgRD1mKDQpO2xldCBFPWYoNSk7bGV0IEY9Zig2KTtsZXQgRz1mKDcpO2xldCBIPWYoOCk7bGV0IEk9Zig5KTtsZXQgSj1mKDB4QSk7bGV0IEs9ZigweEIpO2xldCBMPWYoMHhDKTtsZXQgTT1mKDB4RCk7bGV0IE49ZigweEUpO2xldCBPPWYoMHhGKTtsZXQgYT1xPT57Uz1xO21bWF1ba109cTtpZihYPT0nZW4nKXtlPXE7fXQuYWRkKFgpO307bGV0IGo9MDtsZXQgYj15LnNwbGl0KC8oPzopL3UpO2xldCByPSgpPT57bGV0IHE9Jyc7d2hpbGUoajxiLmxlbmd0aCl7bGV0IGQ9YltqXTtsZXQgcD1kLmNvZGVQb2ludEF0KDApO2lmKHA+MHgxMCl7cSs9ZDtqKys7fWVsc2UgaWYocD09MHgxMCl7cSs9YltqKzFdO2orPTI7fWVsc2V7YnJlYWs7fX1yZXR1cm4gcTt9O3doaWxlKGo8Yi5sZW5ndGgpe2xldCBjPWJbaisrXTtpZihjPT1BKXtzLnB1c2gocigpKTt9ZWxzZSBpZihjPT1CKXtzLnB1c2gocigpKycvJyk7fWVsc2UgaWYoYz09Qyl7cy5wdXNoKHIoKSsnLicpO31lbHNlIGlmKGM9PUQpe3MucG9wKCk7fWVsc2UgaWYoYz09RSl7cy5wb3AoKTtzLnB1c2gocigpKTt9ZWxzZSBpZihjPT1GKXtzLnBvcCgpO3MucHVzaChyKCkrJy8nKTt9ZWxzZSBpZihjPT1HKXtzLnBvcCgpO3MucHVzaChyKCkrJy4nKTt9ZWxzZSBpZihjPT1IKXtYPXIoKTt9ZWxzZSBpZihjPT1JKXt0LmNsZWFyKCk7ZT1udWxsO2s9cy5qb2luKCcnKTt9ZWxzZSBpZihjPT1KKXtmb3IobGV0IGk9MDtpPHgubGVuZ3RoO2krKyl7bGV0IGw9eFtpXTtpZighdC5oYXMobCkpe21bbF1ba109ZTt9fX1lbHNlIGlmKGM9PUspe2EocigpKTt9ZWxzZSBpZihjPT1MKXthKGBcXHUyMDJhJHtyKCl9XFx1MjAyY2ApO31lbHNlIGlmKGM9PU0pe2EoYFxcdTIwMmIke3IoKX1cXHUyMDJjYCk7fWVsc2UgaWYoYz09Til7YShTKTt9ZWxzZSBpZihjPT1PKXtsZXQgbD1yKCk7bVtsXT17fTt4LnB1c2gobCk7fX1yZXR1cm4gbTt9XCI7XHJcbi8qIGVzbGludC1lbmFibGUgKi9cclxuXHJcbi8vIEdpdmVuIGEgc3RyaW5nTWFwIChtYXBbIGxvY2FsZSBdWyBzdHJpbmdLZXkgXSA9PiBzdHJpbmcpLCByZXR1cm5zIGEgSlMgZXhwcmVzc2lvbiBzdHJpbmcgdGhhdCB3aWxsIGRlY29kZSB0byBpdC5cclxuY29uc3QgZW5jb2RlU3RyaW5nTWFwVG9KUyA9IHN0cmluZ01hcCA9PiBgKCR7c21hbGxEZWNvZGVTdHJpbmdNYXBTdHJpbmd9KSgke3RvTGVzc0VzY2FwZWRTdHJpbmcoIGVuY29kZVN0cmluZ01hcCggc3RyaW5nTWFwICkgKX0pYDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGVuY29kZVN0cmluZ01hcDogZW5jb2RlU3RyaW5nTWFwLFxyXG4gIGRlY29kZVN0cmluZ01hcDogZGVjb2RlU3RyaW5nTWFwLFxyXG4gIGVuY29kZVN0cmluZ01hcFRvSlM6IGVuY29kZVN0cmluZ01hcFRvSlNcclxufTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtB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WUFBWSxDQUFFNEIsVUFBVSxDQUFDLENBQUUsQ0FBQztJQUM5QixDQUFDLE1BQ0ksSUFBS2pDLElBQUksS0FBS2xELFlBQVksRUFBRztNQUNoQ3FELFdBQVcsQ0FBQyxDQUFDO0lBQ2YsQ0FBQyxNQUNJLElBQUtILElBQUksS0FBS2pELFVBQVUsRUFBRztNQUM5QnFELFNBQVMsQ0FBQyxDQUFDO0lBQ2IsQ0FBQyxNQUNJLElBQUtKLElBQUksS0FBS2hELFVBQVUsRUFBRztNQUM5QnVELFNBQVMsQ0FBRTBCLFVBQVUsQ0FBQyxDQUFFLENBQUM7SUFDM0IsQ0FBQyxNQUNJLElBQUtqQyxJQUFJLEtBQUsvQyxrQkFBa0IsRUFBRztNQUN0Q3NELFNBQVMsQ0FBRTlDLFFBQVEsR0FBR3dFLFVBQVUsQ0FBQyxDQUFDLEdBQUd0RSxRQUFTLENBQUM7SUFDakQsQ0FBQyxNQUNJLElBQUtxQyxJQUFJLEtBQUs5QyxrQkFBa0IsRUFBRztNQUN0Q3FELFNBQVMsQ0FBRTdDLFFBQVEsR0FBR3VFLFVBQVUsQ0FBQyxDQUFDLEdBQUd0RSxRQUFTLENBQUM7SUFDakQsQ0FBQyxNQUNJLElBQUtxQyxJQUFJLEtBQUs3QyxvQkFBb0IsRUFBRztNQUN4QzBFLGFBQWEsQ0FBQyxDQUFDO0lBQ2pCLENBQUMsTUFDSSxJQUFLN0IsSUFBSSxLQUFLNUMsVUFBVSxFQUFHO01BQzlCdUMsU0FBUyxDQUFFc0MsVUFBVSxDQUFDLENBQUUsQ0FBQztJQUMzQixDQUFDLE1BQ0k7TUFDSCxNQUFNLElBQUlSLEtBQUssQ0FBRSxxQkFBcUIsR0FBR3pCLElBQUssQ0FBQztJQUNqRDtFQUNGO0VBRUEsT0FBT25DLFNBQVM7QUFDbEIsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNd0UsMEJBQTBCLEdBQUcsNGtDQUE0a0M7QUFDL21DOztBQUVBO0FBQ0EsTUFBTUMsbUJBQW1CLEdBQUd6RSxTQUFTLElBQUssSUFBR3dFLDBCQUEyQixLQUFJaEcsbUJBQW1CLENBQUV1QixlQUFlLENBQUVDLFNBQVUsQ0FBRSxDQUFFLEdBQUU7QUFFbEkwRSxNQUFNLENBQUNDLE9BQU8sR0FBRztFQUNmNUUsZUFBZSxFQUFFQSxlQUFlO0VBQ2hDNEQsZUFBZSxFQUFFQSxlQUFlO0VBQ2hDYyxtQkFBbUIsRUFBRUE7QUFDdkIsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==