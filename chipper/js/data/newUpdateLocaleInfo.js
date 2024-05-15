// Copyright 2024, University of Colorado Boulder

/**
 * TODO: Move over to updateLocaleInfo.js once we are ready to propagate the locale changes https://github.com/phetsims/joist/issues/963
 *
 * WARNING: This will commit/push the changes. Those changes likely be propagated immediately to the website and rosetta.
 *
 * NOTE: Run with CWD of chipper/js/data
 *
 * @author Matt Pennington (PhET Interactive Simulations)
 */

const child_process = require( 'child_process' );
const fs = require( 'fs' );

/**
 * Converts locale data from babel/localeData.json into legacy formats used by rosetta and the website.
 *
 * Overall description of the localeData system:
 *
 * - babel/localeData.json - Ground truth, includes the "new" format with locale3 and englishName instead of name
 * - chipper/js/data/localeInfo.js - CommonJS legacy module
 * - chipper/js/data/localeInfoModule.js - ES6 legacy module
 * - chipper/js/data/localeInfo.json - JSON legacy
 *
 * IMPORTANT - MUST READ!!!
 * You may modify babel/localeData.json file with new locale information. After modifying the file you must take the following steps:
 * 1. Run ./updateLocaleInfo.js, so that the automatically generated files are also update
 * 2. Notify the responsible developers for rosetta, weddell, yotta, and the website that localeInfo was updated.
 * 3. TODO figure out next steps, see https://github.com/phetsims/joist/issues/963
 *
 * Locale data was originally based on Java's Locale object, but has been modified. Essentially each locale has the
 * following data:
 *
 * - locale: Either in the format `xx` or `xx_XX` (ISO-639-1 with 2-letter country code optional). Sometimes these
 *           do not match with ISO-639-1, we have had to add some for our needs.
 *           - language codes are ISO 639-1, see http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
 *           - country codes are ISO 3166-1 alpha2, see http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
 *
 *           NOTE: We are using an older version of ISO 639-1 because java.util.Locale maps some of the newer language codes to
 *           older codes. See Locale.convertOldISOCodes.
 *           The affected country codes are:
 *           he -> iw (Hebrew)
 *           yi -> ji (Yiddish)
 *           id -> in (Indonesian)
 * - locale3: Format of `xxx`. The ISO-639-2 code for the language (3-letter code), if available. Some locales do not
 *            have this information (most do).
 * - direction: either `ltr` or `rtl` for left-to-right or right-to-left
 * - englishName: The name of the locale in English
 * - localizedName: The name of the locale in the locale itself
 *
 * ALSO NOTE: We had a request to support Lakota, which is not included in ISO 639-1, and is only defined as a three-
 * letter code in ISO 639-3.  The locale combination 'lk' was not taken in ISO 639-1, so we added it.  Strictly
 * speaking, this is a deviation from the spec.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// Load our ground source of truth
const localeData = JSON.parse( fs.readFileSync( '../../../babel/localeData.json', 'utf8' ) );

// Construct the concise JS that defines the legacy locale-info format
let localeInfoSnippet = '{';
// eslint-disable-next-line bad-text
const badText = 'Slave'; // There is an englishName that contains this word, see https://en.wikipedia.org/?title=Slave_language_(Athapascan)&redirect=no
// Add properties for all locales
for ( const locale of Object.keys( localeData ) ) {
  localeInfoSnippet += `
  ${locale}: {
    ${localeData[ locale ].englishName.includes( badText ) ? '// eslint-disable-next-line bad-text\n    ' : ''}name: '${localeData[ locale ].englishName.replace( /'/g, '\\\'' )}',
    localizedName: '${localeData[ locale ].localizedName.replace( /'/g, '\\\'' )}',
    direction: '${localeData[ locale ].direction}'
  },`;
}
// Remove the trailing comma
localeInfoSnippet = localeInfoSnippet.slice( 0, -1 );
// Close the object
localeInfoSnippet += '\n}';

const localeInfo = {};
for ( const locale of Object.keys( localeData ) ) {
  localeInfo[ locale ] = {
    name: localeData[ locale ].englishName,
    localizedName: localeData[ locale ].localizedName,
    direction: localeData[ locale ].direction
  };
}

const newLocaleInfo = {
  _comment: 'This file is automatically generated by js/data/updateLocaleInfo.js. Do not modify it directly.',
  ...localeInfo
};

fs.writeFileSync( '../../data/localeInfo.json', JSON.stringify( newLocaleInfo, null, 2 ) );

const commonDocumentation = `// Copyright 2015-${new Date().getFullYear()}, University of Colorado Boulder

/**
  * This file is automatically generated by js/data/updateLocaleInfo.js. Do not modify it directly.
  *
  * @author automatically generated by updateLocaleInfo.js
  */

/* eslint-env browser, node */


`;

const newCommonJSSouceCode = `${commonDocumentation}module.exports = ${localeInfoSnippet};`;
fs.writeFileSync( './localeInfo.js', newCommonJSSouceCode );

const newModuleSourceCode = `${commonDocumentation}export default ${localeInfoSnippet};`;
fs.writeFileSync( './localeInfoModule.js', newModuleSourceCode );

console.log( 'locale info files updated' );

throw new Error( 'NO COMMIT YET, safeguard so we do not commit changes to main yet' ); // TODO: remove for https://github.com/phetsims/joist/issues/963

// eslint-disable-next-line no-unreachable
let needsCommit = false;
try {

  // 0 exit code if there are no working copy changes from HEAD.
  child_process.execSync( 'git diff-index --quiet HEAD --' );
  console.log( 'No locale info changes, no commit needed.' );
}
catch( e ) {
  needsCommit = true;
}

if ( needsCommit ) {
  try {

    console.log( 'pulling' );

    // Some devs have rebase set by default, and you cannot rebase-pull with working copy changes.
    child_process.execSync( 'git pull --no-rebase' );

    child_process.execSync( 'git add ../../data/localeInfo.json' );
    child_process.execSync( 'git add ./localeInfo.js' );
    child_process.execSync( 'git add ./localeInfoModule.js' );

    if ( needsCommit ) {
      console.log( 'committing' );
      child_process.execSync( 'git commit --no-verify ../../data/localeInfo.json ./localeInfo.js ./localeInfoModule.js -m "Automatically updated generated localeInfo files"' );
      console.log( 'pushing' );
      child_process.execSync( 'git push' );
    }
  }
  catch( e ) {
    console.error( 'Unable to update files in git.', e );
  }
}