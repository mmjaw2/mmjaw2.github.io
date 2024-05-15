// Copyright 2020-2024, University of Colorado Boulder

/**
 * Generates JS modules from resources such as images/strings/audio/etc.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

const _ = require('lodash');
const createMipmap = require('./createMipmap');
const fs = require('fs');
const path = require('path');
const grunt = require('grunt');
const loadFileAsDataURI = require('../common/loadFileAsDataURI');
const pascalCase = require('../common/pascalCase');
const os = require('os');
const getCopyrightLine = require('./getCopyrightLine');
const toLessEscapedString = require('../common/toLessEscapedString');
const assert = require('assert');
const writeFileAndGitAdd = require('../../../perennial-alias/js/common/writeFileAndGitAdd');
const svgo = require('svgo');

// disable lint in compiled files, because it increases the linting time
const HEADER = '/* eslint-disable */';

// supported image types, not case-sensitive
const IMAGE_SUFFIXES = ['.png', '.jpg', '.cur', '.svg'];

// supported sound file types, not case-sensitive
const SOUND_SUFFIXES = ['.mp3', '.wav'];

// supported shader file types, not case-sensitive
const SHADER_SUFFIXES = ['.glsl', '.vert', '.shader'];

/**
 * String replacement
 * @param {string} string - the string which will be searched
 * @param {string} search - the text to be replaced
 * @param {string} replacement - the new text
 * @returns {string}
 */
const replace = (string, search, replacement) => string.split(search).join(replacement);

/**
 * Get the relative from the modulified repo to the filename through the provided subdirectory.
 *
 * @param {string} subdir
 * @param {string} filename
 * @returns {string}
 */
const getRelativePath = (subdir, filename) => {
  return `${subdir}/${filename}`;
};

/**
 * Gets the relative path to the root based on the depth of a resource
 *
 * @returns {string}
 */
const expandDots = abspath => {
  // Finds the depths of a directory relative to the root of where grunt.recurse was called from (a repo root)
  const depth = abspath.split('/').length - 2;
  let parentDirectory = '';
  for (let i = 0; i < depth; i++) {
    parentDirectory = `${parentDirectory}../`;
  }
  return parentDirectory;
};

/**
 * Output with an OS-specific EOL sequence, see https://github.com/phetsims/chipper/issues/908
 * @param string
 * @returns {string}
 */
const fixEOL = string => replace(string, '\n', os.EOL);

/**
 * Transform an image file to a JS file that loads the image.
 * @param {string} abspath - the absolute path of the image
 * @param {string} repo - repository name for the modulify command
 * @param {string} subdir - subdirectory location for modulified assets
 * @param {string} filename - name of file being modulified
 */
const modulifyImage = async (abspath, repo, subdir, filename) => {
  const dataURI = loadFileAsDataURI(abspath);
  const contents = `${HEADER}
import asyncLoader from '${expandDots(abspath)}phet-core/js/asyncLoader.js';

const image = new Image();
const unlock = asyncLoader.createLock( image );
image.onload = unlock;
image.src = '${dataURI}';
export default image;`;
  const tsFilename = convertSuffix(filename, '.ts');
  await writeFileAndGitAdd(repo, getRelativePath(subdir, tsFilename), fixEOL(contents));
};

/**
 * Transform an SVG image file to a JS file that loads the image.
 * @param {string} abspath - the absolute path of the image
 * @param {string} repo - repository name for the modulify command
 * @param {string} subdir - subdirectory location for modulified assets
 * @param {string} filename - name of file being modulified
 */
const modulifySVG = async (abspath, repo, subdir, filename) => {
  const fileContents = fs.readFileSync(abspath, 'utf-8');
  if (!fileContents.includes('width="') || !fileContents.includes('height="')) {
    throw new Error(`SVG file ${abspath} does not contain width and height attributes`);
  }

  // Use SVGO to optimize the SVG contents, see https://github.com/phetsims/arithmetic/issues/201
  const optimizedContents = svgo.optimize(fileContents, {
    multipass: true,
    plugins: [{
      name: 'preset-default',
      params: {
        overrides: {
          // We can't scale things and get the right bounds if the view box is removed.
          removeViewBox: false
        }
      }
    }]
  }).data;
  const contents = `${HEADER}
import asyncLoader from '${expandDots(abspath)}phet-core/js/asyncLoader.js';

const image = new Image();
const unlock = asyncLoader.createLock( image );
image.onload = unlock;
image.src = \`data:image/svg+xml;base64,\${btoa(${toLessEscapedString(optimizedContents)})}\`;
export default image;`;
  const tsFilename = convertSuffix(filename, '.ts');
  await writeFileAndGitAdd(repo, getRelativePath(subdir, tsFilename), fixEOL(contents));
};

/**
 * Transform an image file to a JS file that loads the image as a mipmap.
 * @param {string} abspath - the absolute path of the image
 * @param {string} repo - repository name for the modulify command
 * @param {string} subdir - subdirectory location for modulified assets
 * @param {string} filename - name of file being modulified
 */
const modulifyMipmap = async (abspath, repo, subdir, filename) => {
  // Defaults. NOTE: using the default settings because we have not run into a need, see
  // https://github.com/phetsims/chipper/issues/820 and https://github.com/phetsims/chipper/issues/945
  const config = {
    level: 4,
    // maximum level
    quality: 98
  };
  const mipmaps = await createMipmap(abspath, config.level, config.quality);
  const entry = mipmaps.map(({
    width,
    height,
    url
  }) => ({
    width: width,
    height: height,
    url: url
  }));
  const mipmapContents = `${HEADER}
import asyncLoader from '${expandDots(abspath)}phet-core/js/asyncLoader.js';

const mipmaps = ${JSON.stringify(entry, null, 2)};
mipmaps.forEach( mipmap => {
  mipmap.img = new Image();
  const unlock = asyncLoader.createLock( mipmap.img );
  mipmap.img.onload = unlock;
  mipmap.img.src = mipmap.url; // trigger the loading of the image for its level
  mipmap.canvas = document.createElement( 'canvas' );
  mipmap.canvas.width = mipmap.width;
  mipmap.canvas.height = mipmap.height;
  const context = mipmap.canvas.getContext( '2d' );
  mipmap.updateCanvas = () => {
    if ( mipmap.img.complete && ( typeof mipmap.img.naturalWidth === 'undefined' || mipmap.img.naturalWidth > 0 ) ) {
      context.drawImage( mipmap.img, 0, 0 );
      delete mipmap.updateCanvas;
    }
  };
} );
export default mipmaps;`;
  const jsFilename = convertSuffix(filename, '.js');
  await writeFileAndGitAdd(repo, getRelativePath(subdir, jsFilename), fixEOL(mipmapContents));
};

/**
 * Transform a GLSL shader file to a JS file that is represented by a string.
 * @param {string} abspath - the absolute path of the image
 * @param {string} repo - repository name for the modulify command
 * @param {string} subdir - subdirectory location for modulified assets
 * @param {string} filename - name of file being modulified
 */
const modulifyShader = async (abspath, repo, subdir, filename) => {
  // load the shader file
  const shaderString = fs.readFileSync(abspath, 'utf-8').replace(/\r/g, '');

  // output the contents of the file that will define the shader in JS format
  const contents = `${HEADER}
export default ${JSON.stringify(shaderString)}`;
  const jsFilename = convertSuffix(filename, '.js');
  await writeFileAndGitAdd(repo, getRelativePath(subdir, jsFilename), fixEOL(contents));
};

/**
 * Decode a sound file into a Web Audio AudioBuffer.
 * @param {string} abspath - the absolute path of the image
 * @param {string} repo - repository name for the modulify command
 * @param {string} subdir - subdirectory location for modulified assets
 * @param {string} filename - name of file being modulified
 */
const modulifySound = async (abspath, repo, subdir, filename) => {
  // load the sound file
  const dataURI = loadFileAsDataURI(abspath);

  // output the contents of the file that will define the sound in JS format
  const contents = `${HEADER}
import asyncLoader from '${expandDots(abspath)}phet-core/js/asyncLoader.js';
import base64SoundToByteArray from '${expandDots(abspath)}tambo/js/base64SoundToByteArray.js';
import WrappedAudioBuffer from '${expandDots(abspath)}tambo/js/WrappedAudioBuffer.js';
import phetAudioContext from '${expandDots(abspath)}tambo/js/phetAudioContext.js';

const soundURI = '${dataURI}';
const soundByteArray = base64SoundToByteArray( phetAudioContext, soundURI );
const unlock = asyncLoader.createLock( soundURI );
const wrappedAudioBuffer = new WrappedAudioBuffer();

// safe way to unlock
let unlocked = false;
const safeUnlock = () => {
  if ( !unlocked ) {
    unlock();
    unlocked = true;
  }
};

const onDecodeSuccess = decodedAudio => {
  if ( wrappedAudioBuffer.audioBufferProperty.value === null ) {
    wrappedAudioBuffer.audioBufferProperty.set( decodedAudio );
    safeUnlock();
  }
};
const onDecodeError = decodeError => {
  console.warn( 'decode of audio data failed, using stubbed sound, error: ' + decodeError );
  wrappedAudioBuffer.audioBufferProperty.set( phetAudioContext.createBuffer( 1, 1, phetAudioContext.sampleRate ) );
  safeUnlock();
};
const decodePromise = phetAudioContext.decodeAudioData( soundByteArray.buffer, onDecodeSuccess, onDecodeError );
if ( decodePromise ) {
  decodePromise
    .then( decodedAudio => {
      if ( wrappedAudioBuffer.audioBufferProperty.value === null ) {
        wrappedAudioBuffer.audioBufferProperty.set( decodedAudio );
        safeUnlock();
      }
    } )
    .catch( e => {
      console.warn( 'promise rejection caught for audio decode, error = ' + e );
      safeUnlock();
    } );
}
export default wrappedAudioBuffer;`;
  const jsFilename = convertSuffix(filename, '.js');
  await writeFileAndGitAdd(repo, getRelativePath(subdir, jsFilename), fixEOL(contents));
};

/**
 * Convert .png => _png_mipmap.js, etc.
 *
 * @param {string} abspath - file name with a suffix or a path to it
 * @param {string} suffix - the new suffix, such as '.js'
 * @returns {string}
 */
const convertSuffix = (abspath, suffix) => {
  const lastDotIndex = abspath.lastIndexOf('.');
  return `${abspath.substring(0, lastDotIndex)}_${abspath.substring(lastDotIndex + 1)}${suffix}`;
};

/**
 * Determines the suffix from a filename, everything after the final '.'
 *
 * @param {string} filename
 * @returns {string}
 */
const getSuffix = filename => {
  const index = filename.lastIndexOf('.');
  return filename.substring(index);
};

/**
 * Creates a *.js file corresponding to matching resources such as images or sounds.
 * @param {string} abspath
 * @param {string} rootdir
 * @param {string} subdir
 * @param {string} filename
 * @param {string} repo
 */
const modulifyFile = async (abspath, rootdir, subdir, filename, repo) => {
  if (subdir && (subdir.startsWith('images') ||
  // for brand
  subdir.startsWith('phet/images') || subdir.startsWith('phet-io/images') || subdir.startsWith('adapted-from-phet/images')) && IMAGE_SUFFIXES.indexOf(getSuffix(filename)) >= 0) {
    if (getSuffix(filename) === '.svg') {
      await modulifySVG(abspath, repo, subdir, filename);
    } else {
      await modulifyImage(abspath, repo, subdir, filename);
    }
  }
  if (subdir && (subdir.startsWith('mipmaps') ||
  // for brand
  subdir.startsWith('phet/mipmaps') || subdir.startsWith('phet-io/mipmaps') || subdir.startsWith('adapted-from-phet/mipmaps')) && IMAGE_SUFFIXES.indexOf(getSuffix(filename)) >= 0) {
    await modulifyMipmap(abspath, repo, subdir, filename);
  }
  if (subdir && subdir.startsWith('sounds') && SOUND_SUFFIXES.indexOf(getSuffix(filename)) >= 0) {
    await modulifySound(abspath, repo, subdir, filename);
  }
  if (subdir && subdir.startsWith('shaders') && SHADER_SUFFIXES.indexOf(getSuffix(filename)) >= 0) {
    await modulifyShader(abspath, repo, subdir, filename);
  }
};

/**
 * Creates the image module at js/${_.camelCase( repo )}Images.js for repos that need it.
 *
 * @param {string} repo
 * @param {string[]} supportedRegionsAndCultures
 * @returns {Promise<void>}
 */
const createImageModule = async (repo, supportedRegionsAndCultures) => {
  const spec = grunt.file.readJSON(`../${repo}/${repo}-images.json`);
  const namespace = _.camelCase(repo);
  const imageModuleName = `${pascalCase(repo)}Images`;
  const relativeImageModuleFile = `js/${imageModuleName}.ts`;
  const providedRegionsAndCultures = Object.keys(spec);

  // Ensure our regionAndCultures in the -images.json file match with the supportedRegionsAndCultures in the package.json
  supportedRegionsAndCultures.forEach(regionAndCulture => {
    if (!providedRegionsAndCultures.includes(regionAndCulture)) {
      throw new Error(`regionAndCulture '${regionAndCulture}' is required, but not found in ${repo}-images.json`);
    }
  });
  providedRegionsAndCultures.forEach(regionAndCulture => {
    if (!supportedRegionsAndCultures.includes(regionAndCulture)) {
      throw new Error(`regionAndCulture '${regionAndCulture}' is not supported, but found in ${repo}-images.json`);
    }
  });
  const imageNames = _.uniq(providedRegionsAndCultures.flatMap(regionAndCulture => {
    return Object.keys(spec[regionAndCulture]);
  })).sort();
  const imageFiles = _.uniq(providedRegionsAndCultures.flatMap(regionAndCulture => {
    return Object.values(spec[regionAndCulture]);
  })).sort();

  // Do images exist?
  imageFiles.forEach(imageFile => {
    if (!fs.existsSync(`../${repo}/${imageFile}`)) {
      throw new Error(`Image file ${imageFile} is referenced in ${repo}-images.json, but does not exist`);
    }
  });

  // Ensure that all image names are provided for all regionAndCultures
  providedRegionsAndCultures.forEach(regionAndCulture => {
    imageNames.forEach(imageName => {
      if (!spec[regionAndCulture].hasOwnProperty(imageName)) {
        throw new Error(`Image name ${imageName} is not provided for regionAndCulture ${regionAndCulture} (but provided for others)`);
      }
    });
  });
  const getImportName = imageFile => path.basename(imageFile, path.extname(imageFile));

  // Check that import names are unique
  // NOTE: we could disambiguate in the future in an automated way fairly easily, but should it be done?
  if (_.uniq(imageFiles.map(getImportName)).length !== imageFiles.length) {
    // Find and report the name collision
    const importNames = imageFiles.map(getImportName);
    const duplicates = importNames.filter((name, index) => importNames.indexOf(name) !== index);
    if (duplicates.length) {
      // sanity check!
      const firstDuplicate = duplicates[0];
      const originalNames = imageFiles.filter(imageFile => getImportName(imageFile) === firstDuplicate);
      throw new Error(`Multiple images result in the same import name ${firstDuplicate}: ${originalNames.join(', ')}`);
    }
  }
  const copyrightLine = await getCopyrightLine(repo, relativeImageModuleFile);
  await writeFileAndGitAdd(repo, relativeImageModuleFile, fixEOL(`${copyrightLine}

/**
 * Auto-generated from modulify, DO NOT manually modify.
 */
/* eslint-disable */
import LocalizedImageProperty from '../../joist/js/i18n/LocalizedImageProperty.js';
import ${namespace} from './${namespace}.js';
${imageFiles.map(imageFile => `import ${getImportName(imageFile)} from '../${imageFile.replace('.ts', '.js')}';`).join('\n')}

const ${imageModuleName} = {
  ${imageNames.map(imageName => `${imageName}ImageProperty: new LocalizedImageProperty( '${imageName}', {
    ${supportedRegionsAndCultures.map(regionAndCulture => `${regionAndCulture}: ${getImportName(spec[regionAndCulture][imageName])}`).join(',\n    ')}
  } )`).join(',\n  ')}
};

${namespace}.register( '${imageModuleName}', ${imageModuleName} );

export default ${imageModuleName};
`));
};

/**
 * Creates the string module at js/${_.camelCase( repo )}Strings.js for repos that need it.
 * @public
 *
 * @param {string} repo
 */
const createStringModule = async repo => {
  const packageObject = grunt.file.readJSON(`../${repo}/package.json`);
  const stringModuleName = `${pascalCase(repo)}Strings`;
  const relativeStringModuleFile = `js/${stringModuleName}.ts`;
  const stringModuleFileJS = `../${repo}/js/${stringModuleName}.js`;
  const namespace = _.camelCase(repo);
  if (fs.existsSync(stringModuleFileJS)) {
    console.log('Found JS string file in TS repo.  It should be deleted manually.  ' + stringModuleFileJS);
  }
  const copyrightLine = await getCopyrightLine(repo, relativeStringModuleFile);
  await writeFileAndGitAdd(repo, relativeStringModuleFile, fixEOL(`${copyrightLine}

/**
 * Auto-generated from modulify, DO NOT manually modify.
 */
/* eslint-disable */
import getStringModule from '../../chipper/js/getStringModule.js';
import type LocalizedStringProperty from '../../chipper/js/LocalizedStringProperty.js';
import ${namespace} from './${namespace}.js';

type StringsType = ${getStringTypes(repo)};

const ${stringModuleName} = getStringModule( '${packageObject.phet.requirejsNamespace}' ) as StringsType;

${namespace}.register( '${stringModuleName}', ${stringModuleName} );

export default ${stringModuleName};
`));
};

/**
 * Creates a *.d.ts file that represents the types of the strings for the repo.
 * @public
 *
 * @param {string} repo
 */
const getStringTypes = repo => {
  const packageObject = grunt.file.readJSON(`../${repo}/package.json`);
  const json = grunt.file.readJSON(`../${repo}/${repo}-strings_en.json`);

  // Track paths to all the keys with values.
  const all = [];

  // Recursively collect all of the paths to keys with values.
  const visit = (level, path) => {
    Object.keys(level).forEach(key => {
      if (key !== '_comment') {
        if (level[key].value && typeof level[key].value === 'string') {
          all.push({
            path: [...path, key],
            value: level[key].value
          });
        } else {
          visit(level[key], [...path, key]);
        }
      }
    });
  };
  visit(json, []);

  // Transform to a new structure that matches the types we access at runtime.
  const structure = {};
  for (let i = 0; i < all.length; i++) {
    const allElement = all[i];
    const path = allElement.path;
    let level = structure;
    for (let k = 0; k < path.length; k++) {
      const pathElement = path[k];
      const tokens = pathElement.split('.');
      for (let m = 0; m < tokens.length; m++) {
        const token = tokens[m];
        assert(!token.includes(';'), `Token ${token} cannot include forbidden characters`);
        assert(!token.includes(','), `Token ${token} cannot include forbidden characters`);
        assert(!token.includes(' '), `Token ${token} cannot include forbidden characters`);
        if (k === path.length - 1 && m === tokens.length - 1) {
          if (!(packageObject.phet && packageObject.phet.simFeatures && packageObject.phet.simFeatures.supportsDynamicLocale)) {
            level[token] = '{{STRING}}'; // instead of value = allElement.value
          }
          level[`${token}StringProperty`] = '{{STRING_PROPERTY}}';
        } else {
          level[token] = level[token] || {};
          level = level[token];
        }
      }
    }
  }
  let text = JSON.stringify(structure, null, 2);

  // Use single quotes instead of the double quotes from JSON
  text = replace(text, '"', '\'');
  text = replace(text, '\'{{STRING}}\'', 'string');
  text = replace(text, '\'{{STRING_PROPERTY}}\'', 'LocalizedStringProperty');

  // Add ; to the last in the list
  text = replace(text, ': string\n', ': string;\n');
  text = replace(text, ': LocalizedStringProperty\n', ': LocalizedStringProperty;\n');

  // Use ; instead of ,
  text = replace(text, ',', ';');
  return text;
};

/**
 * Entry point for modulify, which transforms all of the resources in a repo to *.js files.
 * @param {string} repo - the name of a repo, such as 'joist'
 */
const modulify = async repo => {
  console.log(`modulifying ${repo}`);
  const relativeFiles = [];
  grunt.file.recurse(`../${repo}`, async (abspath, rootdir, subdir, filename) => {
    relativeFiles.push({
      abspath: abspath,
      rootdir: rootdir,
      subdir: subdir,
      filename: filename
    });
  });
  for (let i = 0; i < relativeFiles.length; i++) {
    const entry = relativeFiles[i];
    await modulifyFile(entry.abspath, entry.rootdir, entry.subdir, entry.filename, repo);
  }
  const packageObject = grunt.file.readJSON(`../${repo}/package.json`);

  // Strings module file
  if (fs.existsSync(`../${repo}/${repo}-strings_en.json`) && packageObject.phet && packageObject.phet.requirejsNamespace) {
    await createStringModule(repo);
  }

  // Images module file (localized images)
  if (fs.existsSync(`../${repo}/${repo}-images.json`)) {
    const supportedRegionsAndCultures = packageObject?.phet?.simFeatures?.supportedRegionsAndCultures;
    if (!supportedRegionsAndCultures) {
      throw new Error(`supportedRegionsAndCultures is not defined in package.json, but ${repo}-images.json exists`);
    }
    if (!supportedRegionsAndCultures.includes('usa')) {
      throw new Error('regionAndCulture \'usa\' is required, but not found in supportedRegionsAndCultures');
    }
    if (supportedRegionsAndCultures.includes('multi') && supportedRegionsAndCultures.length < 3) {
      throw new Error('regionAndCulture \'multi\' is supported, but there are not enough regionAndCultures to support it');
    }
    const concreteRegionsAndCultures = supportedRegionsAndCultures.filter(regionAndCulture => regionAndCulture !== 'random');

    // Update the images module file
    await createImageModule(repo, concreteRegionsAndCultures);
  }
};
module.exports = modulify;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsImNyZWF0ZU1pcG1hcCIsImZzIiwicGF0aCIsImdydW50IiwibG9hZEZpbGVBc0RhdGFVUkkiLCJwYXNjYWxDYXNlIiwib3MiLCJnZXRDb3B5cmlnaHRMaW5lIiwidG9MZXNzRXNjYXBlZFN0cmluZyIsImFzc2VydCIsIndyaXRlRmlsZUFuZEdpdEFkZCIsInN2Z28iLCJIRUFERVIiLCJJTUFHRV9TVUZGSVhFUyIsIlNPVU5EX1NVRkZJWEVTIiwiU0hBREVSX1NVRkZJWEVTIiwicmVwbGFjZSIsInN0cmluZyIsInNlYXJjaCIsInJlcGxhY2VtZW50Iiwic3BsaXQiLCJqb2luIiwiZ2V0UmVsYXRpdmVQYXRoIiwic3ViZGlyIiwiZmlsZW5hbWUiLCJleHBhbmREb3RzIiwiYWJzcGF0aCIsImRlcHRoIiwibGVuZ3RoIiwicGFyZW50RGlyZWN0b3J5IiwiaSIsImZpeEVPTCIsIkVPTCIsIm1vZHVsaWZ5SW1hZ2UiLCJyZXBvIiwiZGF0YVVSSSIsImNvbnRlbnRzIiwidHNGaWxlbmFtZSIsImNvbnZlcnRTdWZmaXgiLCJtb2R1bGlmeVNWRyIsImZpbGVDb250ZW50cyIsInJlYWRGaWxlU3luYyIsImluY2x1ZGVzIiwiRXJyb3IiLCJvcHRpbWl6ZWRDb250ZW50cyIsIm9wdGltaXplIiwibXVsdGlwYXNzIiwicGx1Z2lucyIsIm5hbWUiLCJwYXJhbXMiLCJvdmVycmlkZXMiLCJyZW1vdmVWaWV3Qm94IiwiZGF0YSIsIm1vZHVsaWZ5TWlwbWFwIiwiY29uZmlnIiwibGV2ZWwiLCJxdWFsaXR5IiwibWlwbWFwcyIsImVudHJ5IiwibWFwIiwid2lkdGgiLCJoZWlnaHQiLCJ1cmwiLCJtaXBtYXBDb250ZW50cyIsIkpTT04iLCJzdHJpbmdpZnkiLCJqc0ZpbGVuYW1lIiwibW9kdWxpZnlTaGFkZXIiLCJzaGFkZXJTdHJpbmciLCJtb2R1bGlmeVNvdW5kIiwic3VmZml4IiwibGFzdERvdEluZGV4IiwibGFzdEluZGV4T2YiLCJzdWJzdHJpbmciLCJnZXRTdWZmaXgiLCJpbmRleCIsIm1vZHVsaWZ5RmlsZSIsInJvb3RkaXIiLCJzdGFydHNXaXRoIiwiaW5kZXhPZiIsImNyZWF0ZUltYWdlTW9kdWxlIiwic3VwcG9ydGVkUmVnaW9uc0FuZEN1bHR1cmVzIiwic3BlYyIsImZpbGUiLCJyZWFkSlNPTiIsIm5hbWVzcGFjZSIsImNhbWVsQ2FzZSIsImltYWdlTW9kdWxlTmFtZSIsInJlbGF0aXZlSW1hZ2VNb2R1bGVGaWxlIiwicHJvdmlkZWRSZWdpb25zQW5kQ3VsdHVyZXMiLCJPYmplY3QiLCJrZXlzIiwiZm9yRWFjaCIsInJlZ2lvbkFuZEN1bHR1cmUiLCJpbWFnZU5hbWVzIiwidW5pcSIsImZsYXRNYXAiLCJzb3J0IiwiaW1hZ2VGaWxlcyIsInZhbHVlcyIsImltYWdlRmlsZSIsImV4aXN0c1N5bmMiLCJpbWFnZU5hbWUiLCJoYXNPd25Qcm9wZXJ0eSIsImdldEltcG9ydE5hbWUiLCJiYXNlbmFtZSIsImV4dG5hbWUiLCJpbXBvcnROYW1lcyIsImR1cGxpY2F0ZXMiLCJmaWx0ZXIiLCJmaXJzdER1cGxpY2F0ZSIsIm9yaWdpbmFsTmFtZXMiLCJjb3B5cmlnaHRMaW5lIiwiY3JlYXRlU3RyaW5nTW9kdWxlIiwicGFja2FnZU9iamVjdCIsInN0cmluZ01vZHVsZU5hbWUiLCJyZWxhdGl2ZVN0cmluZ01vZHVsZUZpbGUiLCJzdHJpbmdNb2R1bGVGaWxlSlMiLCJjb25zb2xlIiwibG9nIiwiZ2V0U3RyaW5nVHlwZXMiLCJwaGV0IiwicmVxdWlyZWpzTmFtZXNwYWNlIiwianNvbiIsImFsbCIsInZpc2l0Iiwia2V5IiwidmFsdWUiLCJwdXNoIiwic3RydWN0dXJlIiwiYWxsRWxlbWVudCIsImsiLCJwYXRoRWxlbWVudCIsInRva2VucyIsIm0iLCJ0b2tlbiIsInNpbUZlYXR1cmVzIiwic3VwcG9ydHNEeW5hbWljTG9jYWxlIiwidGV4dCIsIm1vZHVsaWZ5IiwicmVsYXRpdmVGaWxlcyIsInJlY3Vyc2UiLCJjb25jcmV0ZVJlZ2lvbnNBbmRDdWx0dXJlcyIsIm1vZHVsZSIsImV4cG9ydHMiXSwic291cmNlcyI6WyJtb2R1bGlmeS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMC0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBHZW5lcmF0ZXMgSlMgbW9kdWxlcyBmcm9tIHJlc291cmNlcyBzdWNoIGFzIGltYWdlcy9zdHJpbmdzL2F1ZGlvL2V0Yy5cclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5cclxuY29uc3QgXyA9IHJlcXVpcmUoICdsb2Rhc2gnICk7XHJcbmNvbnN0IGNyZWF0ZU1pcG1hcCA9IHJlcXVpcmUoICcuL2NyZWF0ZU1pcG1hcCcgKTtcclxuY29uc3QgZnMgPSByZXF1aXJlKCAnZnMnICk7XHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCAncGF0aCcgKTtcclxuY29uc3QgZ3J1bnQgPSByZXF1aXJlKCAnZ3J1bnQnICk7XHJcbmNvbnN0IGxvYWRGaWxlQXNEYXRhVVJJID0gcmVxdWlyZSggJy4uL2NvbW1vbi9sb2FkRmlsZUFzRGF0YVVSSScgKTtcclxuY29uc3QgcGFzY2FsQ2FzZSA9IHJlcXVpcmUoICcuLi9jb21tb24vcGFzY2FsQ2FzZScgKTtcclxuY29uc3Qgb3MgPSByZXF1aXJlKCAnb3MnICk7XHJcbmNvbnN0IGdldENvcHlyaWdodExpbmUgPSByZXF1aXJlKCAnLi9nZXRDb3B5cmlnaHRMaW5lJyApO1xyXG5jb25zdCB0b0xlc3NFc2NhcGVkU3RyaW5nID0gcmVxdWlyZSggJy4uL2NvbW1vbi90b0xlc3NFc2NhcGVkU3RyaW5nJyApO1xyXG5jb25zdCBhc3NlcnQgPSByZXF1aXJlKCAnYXNzZXJ0JyApO1xyXG5jb25zdCB3cml0ZUZpbGVBbmRHaXRBZGQgPSByZXF1aXJlKCAnLi4vLi4vLi4vcGVyZW5uaWFsLWFsaWFzL2pzL2NvbW1vbi93cml0ZUZpbGVBbmRHaXRBZGQnICk7XHJcbmNvbnN0IHN2Z28gPSByZXF1aXJlKCAnc3ZnbycgKTtcclxuXHJcbi8vIGRpc2FibGUgbGludCBpbiBjb21waWxlZCBmaWxlcywgYmVjYXVzZSBpdCBpbmNyZWFzZXMgdGhlIGxpbnRpbmcgdGltZVxyXG5jb25zdCBIRUFERVIgPSAnLyogZXNsaW50LWRpc2FibGUgKi8nO1xyXG5cclxuLy8gc3VwcG9ydGVkIGltYWdlIHR5cGVzLCBub3QgY2FzZS1zZW5zaXRpdmVcclxuY29uc3QgSU1BR0VfU1VGRklYRVMgPSBbICcucG5nJywgJy5qcGcnLCAnLmN1cicsICcuc3ZnJyBdO1xyXG5cclxuLy8gc3VwcG9ydGVkIHNvdW5kIGZpbGUgdHlwZXMsIG5vdCBjYXNlLXNlbnNpdGl2ZVxyXG5jb25zdCBTT1VORF9TVUZGSVhFUyA9IFsgJy5tcDMnLCAnLndhdicgXTtcclxuXHJcbi8vIHN1cHBvcnRlZCBzaGFkZXIgZmlsZSB0eXBlcywgbm90IGNhc2Utc2Vuc2l0aXZlXHJcbmNvbnN0IFNIQURFUl9TVUZGSVhFUyA9IFsgJy5nbHNsJywgJy52ZXJ0JywgJy5zaGFkZXInIF07XHJcblxyXG4vKipcclxuICogU3RyaW5nIHJlcGxhY2VtZW50XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSB0aGUgc3RyaW5nIHdoaWNoIHdpbGwgYmUgc2VhcmNoZWRcclxuICogQHBhcmFtIHtzdHJpbmd9IHNlYXJjaCAtIHRoZSB0ZXh0IHRvIGJlIHJlcGxhY2VkXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBsYWNlbWVudCAtIHRoZSBuZXcgdGV4dFxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gKi9cclxuY29uc3QgcmVwbGFjZSA9ICggc3RyaW5nLCBzZWFyY2gsIHJlcGxhY2VtZW50ICkgPT4gc3RyaW5nLnNwbGl0KCBzZWFyY2ggKS5qb2luKCByZXBsYWNlbWVudCApO1xyXG5cclxuLyoqXHJcbiAqIEdldCB0aGUgcmVsYXRpdmUgZnJvbSB0aGUgbW9kdWxpZmllZCByZXBvIHRvIHRoZSBmaWxlbmFtZSB0aHJvdWdoIHRoZSBwcm92aWRlZCBzdWJkaXJlY3RvcnkuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdWJkaXJcclxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAqL1xyXG5jb25zdCBnZXRSZWxhdGl2ZVBhdGggPSAoIHN1YmRpciwgZmlsZW5hbWUgKSA9PiB7XHJcbiAgcmV0dXJuIGAke3N1YmRpcn0vJHtmaWxlbmFtZX1gO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIHJlbGF0aXZlIHBhdGggdG8gdGhlIHJvb3QgYmFzZWQgb24gdGhlIGRlcHRoIG9mIGEgcmVzb3VyY2VcclxuICpcclxuICogQHJldHVybnMge3N0cmluZ31cclxuICovXHJcbmNvbnN0IGV4cGFuZERvdHMgPSBhYnNwYXRoID0+IHtcclxuXHJcbiAgLy8gRmluZHMgdGhlIGRlcHRocyBvZiBhIGRpcmVjdG9yeSByZWxhdGl2ZSB0byB0aGUgcm9vdCBvZiB3aGVyZSBncnVudC5yZWN1cnNlIHdhcyBjYWxsZWQgZnJvbSAoYSByZXBvIHJvb3QpXHJcbiAgY29uc3QgZGVwdGggPSBhYnNwYXRoLnNwbGl0KCAnLycgKS5sZW5ndGggLSAyO1xyXG4gIGxldCBwYXJlbnREaXJlY3RvcnkgPSAnJztcclxuICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBkZXB0aDsgaSsrICkge1xyXG4gICAgcGFyZW50RGlyZWN0b3J5ID0gYCR7cGFyZW50RGlyZWN0b3J5fS4uL2A7XHJcbiAgfVxyXG4gIHJldHVybiBwYXJlbnREaXJlY3Rvcnk7XHJcbn07XHJcblxyXG4vKipcclxuICogT3V0cHV0IHdpdGggYW4gT1Mtc3BlY2lmaWMgRU9MIHNlcXVlbmNlLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzkwOFxyXG4gKiBAcGFyYW0gc3RyaW5nXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAqL1xyXG5jb25zdCBmaXhFT0wgPSBzdHJpbmcgPT4gcmVwbGFjZSggc3RyaW5nLCAnXFxuJywgb3MuRU9MICk7XHJcblxyXG4vKipcclxuICogVHJhbnNmb3JtIGFuIGltYWdlIGZpbGUgdG8gYSBKUyBmaWxlIHRoYXQgbG9hZHMgdGhlIGltYWdlLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gYWJzcGF0aCAtIHRoZSBhYnNvbHV0ZSBwYXRoIG9mIHRoZSBpbWFnZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbyAtIHJlcG9zaXRvcnkgbmFtZSBmb3IgdGhlIG1vZHVsaWZ5IGNvbW1hbmRcclxuICogQHBhcmFtIHtzdHJpbmd9IHN1YmRpciAtIHN1YmRpcmVjdG9yeSBsb2NhdGlvbiBmb3IgbW9kdWxpZmllZCBhc3NldHNcclxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lIC0gbmFtZSBvZiBmaWxlIGJlaW5nIG1vZHVsaWZpZWRcclxuICovXHJcbmNvbnN0IG1vZHVsaWZ5SW1hZ2UgPSBhc3luYyAoIGFic3BhdGgsIHJlcG8sIHN1YmRpciwgZmlsZW5hbWUgKSA9PiB7XHJcblxyXG4gIGNvbnN0IGRhdGFVUkkgPSBsb2FkRmlsZUFzRGF0YVVSSSggYWJzcGF0aCApO1xyXG5cclxuICBjb25zdCBjb250ZW50cyA9IGAke0hFQURFUn1cclxuaW1wb3J0IGFzeW5jTG9hZGVyIGZyb20gJyR7ZXhwYW5kRG90cyggYWJzcGF0aCApfXBoZXQtY29yZS9qcy9hc3luY0xvYWRlci5qcyc7XHJcblxyXG5jb25zdCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG5jb25zdCB1bmxvY2sgPSBhc3luY0xvYWRlci5jcmVhdGVMb2NrKCBpbWFnZSApO1xyXG5pbWFnZS5vbmxvYWQgPSB1bmxvY2s7XHJcbmltYWdlLnNyYyA9ICcke2RhdGFVUkl9JztcclxuZXhwb3J0IGRlZmF1bHQgaW1hZ2U7YDtcclxuXHJcbiAgY29uc3QgdHNGaWxlbmFtZSA9IGNvbnZlcnRTdWZmaXgoIGZpbGVuYW1lLCAnLnRzJyApO1xyXG4gIGF3YWl0IHdyaXRlRmlsZUFuZEdpdEFkZCggcmVwbywgZ2V0UmVsYXRpdmVQYXRoKCBzdWJkaXIsIHRzRmlsZW5hbWUgKSwgZml4RU9MKCBjb250ZW50cyApICk7XHJcbn07XHJcblxyXG4vKipcclxuICogVHJhbnNmb3JtIGFuIFNWRyBpbWFnZSBmaWxlIHRvIGEgSlMgZmlsZSB0aGF0IGxvYWRzIHRoZSBpbWFnZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IGFic3BhdGggLSB0aGUgYWJzb2x1dGUgcGF0aCBvZiB0aGUgaW1hZ2VcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSByZXBvc2l0b3J5IG5hbWUgZm9yIHRoZSBtb2R1bGlmeSBjb21tYW5kXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdWJkaXIgLSBzdWJkaXJlY3RvcnkgbG9jYXRpb24gZm9yIG1vZHVsaWZpZWQgYXNzZXRzXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZSAtIG5hbWUgb2YgZmlsZSBiZWluZyBtb2R1bGlmaWVkXHJcbiAqL1xyXG5jb25zdCBtb2R1bGlmeVNWRyA9IGFzeW5jICggYWJzcGF0aCwgcmVwbywgc3ViZGlyLCBmaWxlbmFtZSApID0+IHtcclxuXHJcbiAgY29uc3QgZmlsZUNvbnRlbnRzID0gZnMucmVhZEZpbGVTeW5jKCBhYnNwYXRoLCAndXRmLTgnICk7XHJcblxyXG4gIGlmICggIWZpbGVDb250ZW50cy5pbmNsdWRlcyggJ3dpZHRoPVwiJyApIHx8ICFmaWxlQ29udGVudHMuaW5jbHVkZXMoICdoZWlnaHQ9XCInICkgKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoIGBTVkcgZmlsZSAke2Fic3BhdGh9IGRvZXMgbm90IGNvbnRhaW4gd2lkdGggYW5kIGhlaWdodCBhdHRyaWJ1dGVzYCApO1xyXG4gIH1cclxuXHJcbiAgLy8gVXNlIFNWR08gdG8gb3B0aW1pemUgdGhlIFNWRyBjb250ZW50cywgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9hcml0aG1ldGljL2lzc3Vlcy8yMDFcclxuICBjb25zdCBvcHRpbWl6ZWRDb250ZW50cyA9IHN2Z28ub3B0aW1pemUoIGZpbGVDb250ZW50cywge1xyXG4gICAgbXVsdGlwYXNzOiB0cnVlLFxyXG4gICAgcGx1Z2luczogW1xyXG4gICAgICB7XHJcbiAgICAgICAgbmFtZTogJ3ByZXNldC1kZWZhdWx0JyxcclxuICAgICAgICBwYXJhbXM6IHtcclxuICAgICAgICAgIG92ZXJyaWRlczoge1xyXG4gICAgICAgICAgICAvLyBXZSBjYW4ndCBzY2FsZSB0aGluZ3MgYW5kIGdldCB0aGUgcmlnaHQgYm91bmRzIGlmIHRoZSB2aWV3IGJveCBpcyByZW1vdmVkLlxyXG4gICAgICAgICAgICByZW1vdmVWaWV3Qm94OiBmYWxzZVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgXVxyXG4gIH0gKS5kYXRhO1xyXG5cclxuICBjb25zdCBjb250ZW50cyA9IGAke0hFQURFUn1cclxuaW1wb3J0IGFzeW5jTG9hZGVyIGZyb20gJyR7ZXhwYW5kRG90cyggYWJzcGF0aCApfXBoZXQtY29yZS9qcy9hc3luY0xvYWRlci5qcyc7XHJcblxyXG5jb25zdCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG5jb25zdCB1bmxvY2sgPSBhc3luY0xvYWRlci5jcmVhdGVMb2NrKCBpbWFnZSApO1xyXG5pbWFnZS5vbmxvYWQgPSB1bmxvY2s7XHJcbmltYWdlLnNyYyA9IFxcYGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsXFwke2J0b2EoJHt0b0xlc3NFc2NhcGVkU3RyaW5nKCBvcHRpbWl6ZWRDb250ZW50cyApfSl9XFxgO1xyXG5leHBvcnQgZGVmYXVsdCBpbWFnZTtgO1xyXG5cclxuICBjb25zdCB0c0ZpbGVuYW1lID0gY29udmVydFN1ZmZpeCggZmlsZW5hbWUsICcudHMnICk7XHJcbiAgYXdhaXQgd3JpdGVGaWxlQW5kR2l0QWRkKCByZXBvLCBnZXRSZWxhdGl2ZVBhdGgoIHN1YmRpciwgdHNGaWxlbmFtZSApLCBmaXhFT0woIGNvbnRlbnRzICkgKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUcmFuc2Zvcm0gYW4gaW1hZ2UgZmlsZSB0byBhIEpTIGZpbGUgdGhhdCBsb2FkcyB0aGUgaW1hZ2UgYXMgYSBtaXBtYXAuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBhYnNwYXRoIC0gdGhlIGFic29sdXRlIHBhdGggb2YgdGhlIGltYWdlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvIC0gcmVwb3NpdG9yeSBuYW1lIGZvciB0aGUgbW9kdWxpZnkgY29tbWFuZFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3ViZGlyIC0gc3ViZGlyZWN0b3J5IGxvY2F0aW9uIGZvciBtb2R1bGlmaWVkIGFzc2V0c1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWUgLSBuYW1lIG9mIGZpbGUgYmVpbmcgbW9kdWxpZmllZFxyXG4gKi9cclxuY29uc3QgbW9kdWxpZnlNaXBtYXAgPSBhc3luYyAoIGFic3BhdGgsIHJlcG8sIHN1YmRpciwgZmlsZW5hbWUgKSA9PiB7XHJcblxyXG4gIC8vIERlZmF1bHRzLiBOT1RFOiB1c2luZyB0aGUgZGVmYXVsdCBzZXR0aW5ncyBiZWNhdXNlIHdlIGhhdmUgbm90IHJ1biBpbnRvIGEgbmVlZCwgc2VlXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzgyMCBhbmQgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2NoaXBwZXIvaXNzdWVzLzk0NVxyXG4gIGNvbnN0IGNvbmZpZyA9IHtcclxuICAgIGxldmVsOiA0LCAvLyBtYXhpbXVtIGxldmVsXHJcbiAgICBxdWFsaXR5OiA5OFxyXG4gIH07XHJcblxyXG4gIGNvbnN0IG1pcG1hcHMgPSBhd2FpdCBjcmVhdGVNaXBtYXAoIGFic3BhdGgsIGNvbmZpZy5sZXZlbCwgY29uZmlnLnF1YWxpdHkgKTtcclxuICBjb25zdCBlbnRyeSA9IG1pcG1hcHMubWFwKCAoIHsgd2lkdGgsIGhlaWdodCwgdXJsIH0gKSA9PiAoIHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodCwgdXJsOiB1cmwgfSApICk7XHJcblxyXG4gIGNvbnN0IG1pcG1hcENvbnRlbnRzID0gYCR7SEVBREVSfVxyXG5pbXBvcnQgYXN5bmNMb2FkZXIgZnJvbSAnJHtleHBhbmREb3RzKCBhYnNwYXRoICl9cGhldC1jb3JlL2pzL2FzeW5jTG9hZGVyLmpzJztcclxuXHJcbmNvbnN0IG1pcG1hcHMgPSAke0pTT04uc3RyaW5naWZ5KCBlbnRyeSwgbnVsbCwgMiApfTtcclxubWlwbWFwcy5mb3JFYWNoKCBtaXBtYXAgPT4ge1xyXG4gIG1pcG1hcC5pbWcgPSBuZXcgSW1hZ2UoKTtcclxuICBjb25zdCB1bmxvY2sgPSBhc3luY0xvYWRlci5jcmVhdGVMb2NrKCBtaXBtYXAuaW1nICk7XHJcbiAgbWlwbWFwLmltZy5vbmxvYWQgPSB1bmxvY2s7XHJcbiAgbWlwbWFwLmltZy5zcmMgPSBtaXBtYXAudXJsOyAvLyB0cmlnZ2VyIHRoZSBsb2FkaW5nIG9mIHRoZSBpbWFnZSBmb3IgaXRzIGxldmVsXHJcbiAgbWlwbWFwLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdjYW52YXMnICk7XHJcbiAgbWlwbWFwLmNhbnZhcy53aWR0aCA9IG1pcG1hcC53aWR0aDtcclxuICBtaXBtYXAuY2FudmFzLmhlaWdodCA9IG1pcG1hcC5oZWlnaHQ7XHJcbiAgY29uc3QgY29udGV4dCA9IG1pcG1hcC5jYW52YXMuZ2V0Q29udGV4dCggJzJkJyApO1xyXG4gIG1pcG1hcC51cGRhdGVDYW52YXMgPSAoKSA9PiB7XHJcbiAgICBpZiAoIG1pcG1hcC5pbWcuY29tcGxldGUgJiYgKCB0eXBlb2YgbWlwbWFwLmltZy5uYXR1cmFsV2lkdGggPT09ICd1bmRlZmluZWQnIHx8IG1pcG1hcC5pbWcubmF0dXJhbFdpZHRoID4gMCApICkge1xyXG4gICAgICBjb250ZXh0LmRyYXdJbWFnZSggbWlwbWFwLmltZywgMCwgMCApO1xyXG4gICAgICBkZWxldGUgbWlwbWFwLnVwZGF0ZUNhbnZhcztcclxuICAgIH1cclxuICB9O1xyXG59ICk7XHJcbmV4cG9ydCBkZWZhdWx0IG1pcG1hcHM7YDtcclxuICBjb25zdCBqc0ZpbGVuYW1lID0gY29udmVydFN1ZmZpeCggZmlsZW5hbWUsICcuanMnICk7XHJcbiAgYXdhaXQgd3JpdGVGaWxlQW5kR2l0QWRkKCByZXBvLCBnZXRSZWxhdGl2ZVBhdGgoIHN1YmRpciwganNGaWxlbmFtZSApLCBmaXhFT0woIG1pcG1hcENvbnRlbnRzICkgKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUcmFuc2Zvcm0gYSBHTFNMIHNoYWRlciBmaWxlIHRvIGEgSlMgZmlsZSB0aGF0IGlzIHJlcHJlc2VudGVkIGJ5IGEgc3RyaW5nLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gYWJzcGF0aCAtIHRoZSBhYnNvbHV0ZSBwYXRoIG9mIHRoZSBpbWFnZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwbyAtIHJlcG9zaXRvcnkgbmFtZSBmb3IgdGhlIG1vZHVsaWZ5IGNvbW1hbmRcclxuICogQHBhcmFtIHtzdHJpbmd9IHN1YmRpciAtIHN1YmRpcmVjdG9yeSBsb2NhdGlvbiBmb3IgbW9kdWxpZmllZCBhc3NldHNcclxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lIC0gbmFtZSBvZiBmaWxlIGJlaW5nIG1vZHVsaWZpZWRcclxuICovXHJcbmNvbnN0IG1vZHVsaWZ5U2hhZGVyID0gYXN5bmMgKCBhYnNwYXRoLCByZXBvLCBzdWJkaXIsIGZpbGVuYW1lICkgPT4ge1xyXG5cclxuICAvLyBsb2FkIHRoZSBzaGFkZXIgZmlsZVxyXG4gIGNvbnN0IHNoYWRlclN0cmluZyA9IGZzLnJlYWRGaWxlU3luYyggYWJzcGF0aCwgJ3V0Zi04JyApLnJlcGxhY2UoIC9cXHIvZywgJycgKTtcclxuXHJcbiAgLy8gb3V0cHV0IHRoZSBjb250ZW50cyBvZiB0aGUgZmlsZSB0aGF0IHdpbGwgZGVmaW5lIHRoZSBzaGFkZXIgaW4gSlMgZm9ybWF0XHJcbiAgY29uc3QgY29udGVudHMgPSBgJHtIRUFERVJ9XHJcbmV4cG9ydCBkZWZhdWx0ICR7SlNPTi5zdHJpbmdpZnkoIHNoYWRlclN0cmluZyApfWA7XHJcblxyXG4gIGNvbnN0IGpzRmlsZW5hbWUgPSBjb252ZXJ0U3VmZml4KCBmaWxlbmFtZSwgJy5qcycgKTtcclxuICBhd2FpdCB3cml0ZUZpbGVBbmRHaXRBZGQoIHJlcG8sIGdldFJlbGF0aXZlUGF0aCggc3ViZGlyLCBqc0ZpbGVuYW1lICksIGZpeEVPTCggY29udGVudHMgKSApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIERlY29kZSBhIHNvdW5kIGZpbGUgaW50byBhIFdlYiBBdWRpbyBBdWRpb0J1ZmZlci5cclxuICogQHBhcmFtIHtzdHJpbmd9IGFic3BhdGggLSB0aGUgYWJzb2x1dGUgcGF0aCBvZiB0aGUgaW1hZ2VcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG8gLSByZXBvc2l0b3J5IG5hbWUgZm9yIHRoZSBtb2R1bGlmeSBjb21tYW5kXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdWJkaXIgLSBzdWJkaXJlY3RvcnkgbG9jYXRpb24gZm9yIG1vZHVsaWZpZWQgYXNzZXRzXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZSAtIG5hbWUgb2YgZmlsZSBiZWluZyBtb2R1bGlmaWVkXHJcbiAqL1xyXG5jb25zdCBtb2R1bGlmeVNvdW5kID0gYXN5bmMgKCBhYnNwYXRoLCByZXBvLCBzdWJkaXIsIGZpbGVuYW1lICkgPT4ge1xyXG5cclxuICAvLyBsb2FkIHRoZSBzb3VuZCBmaWxlXHJcbiAgY29uc3QgZGF0YVVSSSA9IGxvYWRGaWxlQXNEYXRhVVJJKCBhYnNwYXRoICk7XHJcblxyXG4gIC8vIG91dHB1dCB0aGUgY29udGVudHMgb2YgdGhlIGZpbGUgdGhhdCB3aWxsIGRlZmluZSB0aGUgc291bmQgaW4gSlMgZm9ybWF0XHJcbiAgY29uc3QgY29udGVudHMgPSBgJHtIRUFERVJ9XHJcbmltcG9ydCBhc3luY0xvYWRlciBmcm9tICcke2V4cGFuZERvdHMoIGFic3BhdGggKX1waGV0LWNvcmUvanMvYXN5bmNMb2FkZXIuanMnO1xyXG5pbXBvcnQgYmFzZTY0U291bmRUb0J5dGVBcnJheSBmcm9tICcke2V4cGFuZERvdHMoIGFic3BhdGggKX10YW1iby9qcy9iYXNlNjRTb3VuZFRvQnl0ZUFycmF5LmpzJztcclxuaW1wb3J0IFdyYXBwZWRBdWRpb0J1ZmZlciBmcm9tICcke2V4cGFuZERvdHMoIGFic3BhdGggKX10YW1iby9qcy9XcmFwcGVkQXVkaW9CdWZmZXIuanMnO1xyXG5pbXBvcnQgcGhldEF1ZGlvQ29udGV4dCBmcm9tICcke2V4cGFuZERvdHMoIGFic3BhdGggKX10YW1iby9qcy9waGV0QXVkaW9Db250ZXh0LmpzJztcclxuXHJcbmNvbnN0IHNvdW5kVVJJID0gJyR7ZGF0YVVSSX0nO1xyXG5jb25zdCBzb3VuZEJ5dGVBcnJheSA9IGJhc2U2NFNvdW5kVG9CeXRlQXJyYXkoIHBoZXRBdWRpb0NvbnRleHQsIHNvdW5kVVJJICk7XHJcbmNvbnN0IHVubG9jayA9IGFzeW5jTG9hZGVyLmNyZWF0ZUxvY2soIHNvdW5kVVJJICk7XHJcbmNvbnN0IHdyYXBwZWRBdWRpb0J1ZmZlciA9IG5ldyBXcmFwcGVkQXVkaW9CdWZmZXIoKTtcclxuXHJcbi8vIHNhZmUgd2F5IHRvIHVubG9ja1xyXG5sZXQgdW5sb2NrZWQgPSBmYWxzZTtcclxuY29uc3Qgc2FmZVVubG9jayA9ICgpID0+IHtcclxuICBpZiAoICF1bmxvY2tlZCApIHtcclxuICAgIHVubG9jaygpO1xyXG4gICAgdW5sb2NrZWQgPSB0cnVlO1xyXG4gIH1cclxufTtcclxuXHJcbmNvbnN0IG9uRGVjb2RlU3VjY2VzcyA9IGRlY29kZWRBdWRpbyA9PiB7XHJcbiAgaWYgKCB3cmFwcGVkQXVkaW9CdWZmZXIuYXVkaW9CdWZmZXJQcm9wZXJ0eS52YWx1ZSA9PT0gbnVsbCApIHtcclxuICAgIHdyYXBwZWRBdWRpb0J1ZmZlci5hdWRpb0J1ZmZlclByb3BlcnR5LnNldCggZGVjb2RlZEF1ZGlvICk7XHJcbiAgICBzYWZlVW5sb2NrKCk7XHJcbiAgfVxyXG59O1xyXG5jb25zdCBvbkRlY29kZUVycm9yID0gZGVjb2RlRXJyb3IgPT4ge1xyXG4gIGNvbnNvbGUud2FybiggJ2RlY29kZSBvZiBhdWRpbyBkYXRhIGZhaWxlZCwgdXNpbmcgc3R1YmJlZCBzb3VuZCwgZXJyb3I6ICcgKyBkZWNvZGVFcnJvciApO1xyXG4gIHdyYXBwZWRBdWRpb0J1ZmZlci5hdWRpb0J1ZmZlclByb3BlcnR5LnNldCggcGhldEF1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXIoIDEsIDEsIHBoZXRBdWRpb0NvbnRleHQuc2FtcGxlUmF0ZSApICk7XHJcbiAgc2FmZVVubG9jaygpO1xyXG59O1xyXG5jb25zdCBkZWNvZGVQcm9taXNlID0gcGhldEF1ZGlvQ29udGV4dC5kZWNvZGVBdWRpb0RhdGEoIHNvdW5kQnl0ZUFycmF5LmJ1ZmZlciwgb25EZWNvZGVTdWNjZXNzLCBvbkRlY29kZUVycm9yICk7XHJcbmlmICggZGVjb2RlUHJvbWlzZSApIHtcclxuICBkZWNvZGVQcm9taXNlXHJcbiAgICAudGhlbiggZGVjb2RlZEF1ZGlvID0+IHtcclxuICAgICAgaWYgKCB3cmFwcGVkQXVkaW9CdWZmZXIuYXVkaW9CdWZmZXJQcm9wZXJ0eS52YWx1ZSA9PT0gbnVsbCApIHtcclxuICAgICAgICB3cmFwcGVkQXVkaW9CdWZmZXIuYXVkaW9CdWZmZXJQcm9wZXJ0eS5zZXQoIGRlY29kZWRBdWRpbyApO1xyXG4gICAgICAgIHNhZmVVbmxvY2soKTtcclxuICAgICAgfVxyXG4gICAgfSApXHJcbiAgICAuY2F0Y2goIGUgPT4ge1xyXG4gICAgICBjb25zb2xlLndhcm4oICdwcm9taXNlIHJlamVjdGlvbiBjYXVnaHQgZm9yIGF1ZGlvIGRlY29kZSwgZXJyb3IgPSAnICsgZSApO1xyXG4gICAgICBzYWZlVW5sb2NrKCk7XHJcbiAgICB9ICk7XHJcbn1cclxuZXhwb3J0IGRlZmF1bHQgd3JhcHBlZEF1ZGlvQnVmZmVyO2A7XHJcblxyXG4gIGNvbnN0IGpzRmlsZW5hbWUgPSBjb252ZXJ0U3VmZml4KCBmaWxlbmFtZSwgJy5qcycgKTtcclxuICBhd2FpdCB3cml0ZUZpbGVBbmRHaXRBZGQoIHJlcG8sIGdldFJlbGF0aXZlUGF0aCggc3ViZGlyLCBqc0ZpbGVuYW1lICksIGZpeEVPTCggY29udGVudHMgKSApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnQgLnBuZyA9PiBfcG5nX21pcG1hcC5qcywgZXRjLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gYWJzcGF0aCAtIGZpbGUgbmFtZSB3aXRoIGEgc3VmZml4IG9yIGEgcGF0aCB0byBpdFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3VmZml4IC0gdGhlIG5ldyBzdWZmaXgsIHN1Y2ggYXMgJy5qcydcclxuICogQHJldHVybnMge3N0cmluZ31cclxuICovXHJcbmNvbnN0IGNvbnZlcnRTdWZmaXggPSAoIGFic3BhdGgsIHN1ZmZpeCApID0+IHtcclxuICBjb25zdCBsYXN0RG90SW5kZXggPSBhYnNwYXRoLmxhc3RJbmRleE9mKCAnLicgKTtcclxuICByZXR1cm4gYCR7YWJzcGF0aC5zdWJzdHJpbmcoIDAsIGxhc3REb3RJbmRleCApfV8ke2Fic3BhdGguc3Vic3RyaW5nKCBsYXN0RG90SW5kZXggKyAxICl9JHtzdWZmaXh9YDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZXRlcm1pbmVzIHRoZSBzdWZmaXggZnJvbSBhIGZpbGVuYW1lLCBldmVyeXRoaW5nIGFmdGVyIHRoZSBmaW5hbCAnLidcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAqL1xyXG5jb25zdCBnZXRTdWZmaXggPSBmaWxlbmFtZSA9PiB7XHJcbiAgY29uc3QgaW5kZXggPSBmaWxlbmFtZS5sYXN0SW5kZXhPZiggJy4nICk7XHJcbiAgcmV0dXJuIGZpbGVuYW1lLnN1YnN0cmluZyggaW5kZXggKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgKi5qcyBmaWxlIGNvcnJlc3BvbmRpbmcgdG8gbWF0Y2hpbmcgcmVzb3VyY2VzIHN1Y2ggYXMgaW1hZ2VzIG9yIHNvdW5kcy5cclxuICogQHBhcmFtIHtzdHJpbmd9IGFic3BhdGhcclxuICogQHBhcmFtIHtzdHJpbmd9IHJvb3RkaXJcclxuICogQHBhcmFtIHtzdHJpbmd9IHN1YmRpclxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IHJlcG9cclxuICovXHJcbmNvbnN0IG1vZHVsaWZ5RmlsZSA9IGFzeW5jICggYWJzcGF0aCwgcm9vdGRpciwgc3ViZGlyLCBmaWxlbmFtZSwgcmVwbyApID0+IHtcclxuXHJcbiAgaWYgKCBzdWJkaXIgJiYgKCBzdWJkaXIuc3RhcnRzV2l0aCggJ2ltYWdlcycgKSB8fFxyXG5cclxuICAgICAgICAgICAgICAgICAgIC8vIGZvciBicmFuZFxyXG4gICAgICAgICAgICAgICAgICAgc3ViZGlyLnN0YXJ0c1dpdGgoICdwaGV0L2ltYWdlcycgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgc3ViZGlyLnN0YXJ0c1dpdGgoICdwaGV0LWlvL2ltYWdlcycgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgc3ViZGlyLnN0YXJ0c1dpdGgoICdhZGFwdGVkLWZyb20tcGhldC9pbWFnZXMnICkgKVxyXG4gICAgICAgJiYgSU1BR0VfU1VGRklYRVMuaW5kZXhPZiggZ2V0U3VmZml4KCBmaWxlbmFtZSApICkgPj0gMCApIHtcclxuICAgIGlmICggZ2V0U3VmZml4KCBmaWxlbmFtZSApID09PSAnLnN2ZycgKSB7XHJcbiAgICAgIGF3YWl0IG1vZHVsaWZ5U1ZHKCBhYnNwYXRoLCByZXBvLCBzdWJkaXIsIGZpbGVuYW1lICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgYXdhaXQgbW9kdWxpZnlJbWFnZSggYWJzcGF0aCwgcmVwbywgc3ViZGlyLCBmaWxlbmFtZSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKCBzdWJkaXIgJiYgKCBzdWJkaXIuc3RhcnRzV2l0aCggJ21pcG1hcHMnICkgfHxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAvLyBmb3IgYnJhbmRcclxuICAgICAgICAgICAgICAgICAgIHN1YmRpci5zdGFydHNXaXRoKCAncGhldC9taXBtYXBzJyApIHx8XHJcbiAgICAgICAgICAgICAgICAgICBzdWJkaXIuc3RhcnRzV2l0aCggJ3BoZXQtaW8vbWlwbWFwcycgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgc3ViZGlyLnN0YXJ0c1dpdGgoICdhZGFwdGVkLWZyb20tcGhldC9taXBtYXBzJyApIClcclxuICAgICAgICYmIElNQUdFX1NVRkZJWEVTLmluZGV4T2YoIGdldFN1ZmZpeCggZmlsZW5hbWUgKSApID49IDAgKSB7XHJcbiAgICBhd2FpdCBtb2R1bGlmeU1pcG1hcCggYWJzcGF0aCwgcmVwbywgc3ViZGlyLCBmaWxlbmFtZSApO1xyXG4gIH1cclxuXHJcbiAgaWYgKCBzdWJkaXIgJiYgc3ViZGlyLnN0YXJ0c1dpdGgoICdzb3VuZHMnICkgJiYgU09VTkRfU1VGRklYRVMuaW5kZXhPZiggZ2V0U3VmZml4KCBmaWxlbmFtZSApICkgPj0gMCApIHtcclxuICAgIGF3YWl0IG1vZHVsaWZ5U291bmQoIGFic3BhdGgsIHJlcG8sIHN1YmRpciwgZmlsZW5hbWUgKTtcclxuICB9XHJcblxyXG4gIGlmICggc3ViZGlyICYmIHN1YmRpci5zdGFydHNXaXRoKCAnc2hhZGVycycgKSAmJiBTSEFERVJfU1VGRklYRVMuaW5kZXhPZiggZ2V0U3VmZml4KCBmaWxlbmFtZSApICkgPj0gMCApIHtcclxuICAgIGF3YWl0IG1vZHVsaWZ5U2hhZGVyKCBhYnNwYXRoLCByZXBvLCBzdWJkaXIsIGZpbGVuYW1lICk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgdGhlIGltYWdlIG1vZHVsZSBhdCBqcy8ke18uY2FtZWxDYXNlKCByZXBvICl9SW1hZ2VzLmpzIGZvciByZXBvcyB0aGF0IG5lZWQgaXQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAqIEBwYXJhbSB7c3RyaW5nW119IHN1cHBvcnRlZFJlZ2lvbnNBbmRDdWx0dXJlc1xyXG4gKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn1cclxuICovXHJcbmNvbnN0IGNyZWF0ZUltYWdlTW9kdWxlID0gYXN5bmMgKCByZXBvLCBzdXBwb3J0ZWRSZWdpb25zQW5kQ3VsdHVyZXMgKSA9PiB7XHJcbiAgY29uc3Qgc3BlYyA9IGdydW50LmZpbGUucmVhZEpTT04oIGAuLi8ke3JlcG99LyR7cmVwb30taW1hZ2VzLmpzb25gICk7XHJcbiAgY29uc3QgbmFtZXNwYWNlID0gXy5jYW1lbENhc2UoIHJlcG8gKTtcclxuICBjb25zdCBpbWFnZU1vZHVsZU5hbWUgPSBgJHtwYXNjYWxDYXNlKCByZXBvICl9SW1hZ2VzYDtcclxuICBjb25zdCByZWxhdGl2ZUltYWdlTW9kdWxlRmlsZSA9IGBqcy8ke2ltYWdlTW9kdWxlTmFtZX0udHNgO1xyXG5cclxuICBjb25zdCBwcm92aWRlZFJlZ2lvbnNBbmRDdWx0dXJlcyA9IE9iamVjdC5rZXlzKCBzcGVjICk7XHJcblxyXG4gIC8vIEVuc3VyZSBvdXIgcmVnaW9uQW5kQ3VsdHVyZXMgaW4gdGhlIC1pbWFnZXMuanNvbiBmaWxlIG1hdGNoIHdpdGggdGhlIHN1cHBvcnRlZFJlZ2lvbnNBbmRDdWx0dXJlcyBpbiB0aGUgcGFja2FnZS5qc29uXHJcbiAgc3VwcG9ydGVkUmVnaW9uc0FuZEN1bHR1cmVzLmZvckVhY2goIHJlZ2lvbkFuZEN1bHR1cmUgPT4ge1xyXG4gICAgaWYgKCAhcHJvdmlkZWRSZWdpb25zQW5kQ3VsdHVyZXMuaW5jbHVkZXMoIHJlZ2lvbkFuZEN1bHR1cmUgKSApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCBgcmVnaW9uQW5kQ3VsdHVyZSAnJHtyZWdpb25BbmRDdWx0dXJlfScgaXMgcmVxdWlyZWQsIGJ1dCBub3QgZm91bmQgaW4gJHtyZXBvfS1pbWFnZXMuanNvbmAgKTtcclxuICAgIH1cclxuICB9ICk7XHJcbiAgcHJvdmlkZWRSZWdpb25zQW5kQ3VsdHVyZXMuZm9yRWFjaCggcmVnaW9uQW5kQ3VsdHVyZSA9PiB7XHJcbiAgICBpZiAoICFzdXBwb3J0ZWRSZWdpb25zQW5kQ3VsdHVyZXMuaW5jbHVkZXMoIHJlZ2lvbkFuZEN1bHR1cmUgKSApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCBgcmVnaW9uQW5kQ3VsdHVyZSAnJHtyZWdpb25BbmRDdWx0dXJlfScgaXMgbm90IHN1cHBvcnRlZCwgYnV0IGZvdW5kIGluICR7cmVwb30taW1hZ2VzLmpzb25gICk7XHJcbiAgICB9XHJcbiAgfSApO1xyXG5cclxuICBjb25zdCBpbWFnZU5hbWVzID0gXy51bmlxKCBwcm92aWRlZFJlZ2lvbnNBbmRDdWx0dXJlcy5mbGF0TWFwKCByZWdpb25BbmRDdWx0dXJlID0+IHtcclxuICAgIHJldHVybiBPYmplY3Qua2V5cyggc3BlY1sgcmVnaW9uQW5kQ3VsdHVyZSBdICk7XHJcbiAgfSApICkuc29ydCgpO1xyXG5cclxuICBjb25zdCBpbWFnZUZpbGVzID0gXy51bmlxKCBwcm92aWRlZFJlZ2lvbnNBbmRDdWx0dXJlcy5mbGF0TWFwKCByZWdpb25BbmRDdWx0dXJlID0+IHtcclxuICAgIHJldHVybiBPYmplY3QudmFsdWVzKCBzcGVjWyByZWdpb25BbmRDdWx0dXJlIF0gKTtcclxuICB9ICkgKS5zb3J0KCk7XHJcblxyXG4gIC8vIERvIGltYWdlcyBleGlzdD9cclxuICBpbWFnZUZpbGVzLmZvckVhY2goIGltYWdlRmlsZSA9PiB7XHJcbiAgICBpZiAoICFmcy5leGlzdHNTeW5jKCBgLi4vJHtyZXBvfS8ke2ltYWdlRmlsZX1gICkgKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvciggYEltYWdlIGZpbGUgJHtpbWFnZUZpbGV9IGlzIHJlZmVyZW5jZWQgaW4gJHtyZXBvfS1pbWFnZXMuanNvbiwgYnV0IGRvZXMgbm90IGV4aXN0YCApO1xyXG4gICAgfVxyXG4gIH0gKTtcclxuXHJcbiAgLy8gRW5zdXJlIHRoYXQgYWxsIGltYWdlIG5hbWVzIGFyZSBwcm92aWRlZCBmb3IgYWxsIHJlZ2lvbkFuZEN1bHR1cmVzXHJcbiAgcHJvdmlkZWRSZWdpb25zQW5kQ3VsdHVyZXMuZm9yRWFjaCggcmVnaW9uQW5kQ3VsdHVyZSA9PiB7XHJcbiAgICBpbWFnZU5hbWVzLmZvckVhY2goIGltYWdlTmFtZSA9PiB7XHJcbiAgICAgIGlmICggIXNwZWNbIHJlZ2lvbkFuZEN1bHR1cmUgXS5oYXNPd25Qcm9wZXJ0eSggaW1hZ2VOYW1lICkgKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCBgSW1hZ2UgbmFtZSAke2ltYWdlTmFtZX0gaXMgbm90IHByb3ZpZGVkIGZvciByZWdpb25BbmRDdWx0dXJlICR7cmVnaW9uQW5kQ3VsdHVyZX0gKGJ1dCBwcm92aWRlZCBmb3Igb3RoZXJzKWAgKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gIH0gKTtcclxuXHJcbiAgY29uc3QgZ2V0SW1wb3J0TmFtZSA9IGltYWdlRmlsZSA9PiBwYXRoLmJhc2VuYW1lKCBpbWFnZUZpbGUsIHBhdGguZXh0bmFtZSggaW1hZ2VGaWxlICkgKTtcclxuXHJcbiAgLy8gQ2hlY2sgdGhhdCBpbXBvcnQgbmFtZXMgYXJlIHVuaXF1ZVxyXG4gIC8vIE5PVEU6IHdlIGNvdWxkIGRpc2FtYmlndWF0ZSBpbiB0aGUgZnV0dXJlIGluIGFuIGF1dG9tYXRlZCB3YXkgZmFpcmx5IGVhc2lseSwgYnV0IHNob3VsZCBpdCBiZSBkb25lP1xyXG4gIGlmICggXy51bmlxKCBpbWFnZUZpbGVzLm1hcCggZ2V0SW1wb3J0TmFtZSApICkubGVuZ3RoICE9PSBpbWFnZUZpbGVzLmxlbmd0aCApIHtcclxuICAgIC8vIEZpbmQgYW5kIHJlcG9ydCB0aGUgbmFtZSBjb2xsaXNpb25cclxuICAgIGNvbnN0IGltcG9ydE5hbWVzID0gaW1hZ2VGaWxlcy5tYXAoIGdldEltcG9ydE5hbWUgKTtcclxuICAgIGNvbnN0IGR1cGxpY2F0ZXMgPSBpbXBvcnROYW1lcy5maWx0ZXIoICggbmFtZSwgaW5kZXggKSA9PiBpbXBvcnROYW1lcy5pbmRleE9mKCBuYW1lICkgIT09IGluZGV4ICk7XHJcbiAgICBpZiAoIGR1cGxpY2F0ZXMubGVuZ3RoICkgeyAvLyBzYW5pdHkgY2hlY2shXHJcbiAgICAgIGNvbnN0IGZpcnN0RHVwbGljYXRlID0gZHVwbGljYXRlc1sgMCBdO1xyXG4gICAgICBjb25zdCBvcmlnaW5hbE5hbWVzID0gaW1hZ2VGaWxlcy5maWx0ZXIoIGltYWdlRmlsZSA9PiBnZXRJbXBvcnROYW1lKCBpbWFnZUZpbGUgKSA9PT0gZmlyc3REdXBsaWNhdGUgKTtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCBgTXVsdGlwbGUgaW1hZ2VzIHJlc3VsdCBpbiB0aGUgc2FtZSBpbXBvcnQgbmFtZSAke2ZpcnN0RHVwbGljYXRlfTogJHtvcmlnaW5hbE5hbWVzLmpvaW4oICcsICcgKX1gICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCBjb3B5cmlnaHRMaW5lID0gYXdhaXQgZ2V0Q29weXJpZ2h0TGluZSggcmVwbywgcmVsYXRpdmVJbWFnZU1vZHVsZUZpbGUgKTtcclxuICBhd2FpdCB3cml0ZUZpbGVBbmRHaXRBZGQoIHJlcG8sIHJlbGF0aXZlSW1hZ2VNb2R1bGVGaWxlLCBmaXhFT0woXHJcbiAgICBgJHtjb3B5cmlnaHRMaW5lfVxyXG5cclxuLyoqXHJcbiAqIEF1dG8tZ2VuZXJhdGVkIGZyb20gbW9kdWxpZnksIERPIE5PVCBtYW51YWxseSBtb2RpZnkuXHJcbiAqL1xyXG4vKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgTG9jYWxpemVkSW1hZ2VQcm9wZXJ0eSBmcm9tICcuLi8uLi9qb2lzdC9qcy9pMThuL0xvY2FsaXplZEltYWdlUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgJHtuYW1lc3BhY2V9IGZyb20gJy4vJHtuYW1lc3BhY2V9LmpzJztcclxuJHtpbWFnZUZpbGVzLm1hcCggaW1hZ2VGaWxlID0+IGBpbXBvcnQgJHtnZXRJbXBvcnROYW1lKCBpbWFnZUZpbGUgKX0gZnJvbSAnLi4vJHtpbWFnZUZpbGUucmVwbGFjZSggJy50cycsICcuanMnICl9JztgICkuam9pbiggJ1xcbicgKX1cclxuXHJcbmNvbnN0ICR7aW1hZ2VNb2R1bGVOYW1lfSA9IHtcclxuICAke2ltYWdlTmFtZXMubWFwKCBpbWFnZU5hbWUgPT5cclxuICBgJHtpbWFnZU5hbWV9SW1hZ2VQcm9wZXJ0eTogbmV3IExvY2FsaXplZEltYWdlUHJvcGVydHkoICcke2ltYWdlTmFtZX0nLCB7XHJcbiAgICAke3N1cHBvcnRlZFJlZ2lvbnNBbmRDdWx0dXJlcy5tYXAoIHJlZ2lvbkFuZEN1bHR1cmUgPT4gYCR7cmVnaW9uQW5kQ3VsdHVyZX06ICR7Z2V0SW1wb3J0TmFtZSggc3BlY1sgcmVnaW9uQW5kQ3VsdHVyZSBdWyBpbWFnZU5hbWUgXSApfWAgKS5qb2luKCAnLFxcbiAgICAnICl9XHJcbiAgfSApYCApLmpvaW4oICcsXFxuICAnICl9XHJcbn07XHJcblxyXG4ke25hbWVzcGFjZX0ucmVnaXN0ZXIoICcke2ltYWdlTW9kdWxlTmFtZX0nLCAke2ltYWdlTW9kdWxlTmFtZX0gKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0ICR7aW1hZ2VNb2R1bGVOYW1lfTtcclxuYCApICk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyB0aGUgc3RyaW5nIG1vZHVsZSBhdCBqcy8ke18uY2FtZWxDYXNlKCByZXBvICl9U3RyaW5ncy5qcyBmb3IgcmVwb3MgdGhhdCBuZWVkIGl0LlxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvXHJcbiAqL1xyXG5jb25zdCBjcmVhdGVTdHJpbmdNb2R1bGUgPSBhc3luYyByZXBvID0+IHtcclxuXHJcbiAgY29uc3QgcGFja2FnZU9iamVjdCA9IGdydW50LmZpbGUucmVhZEpTT04oIGAuLi8ke3JlcG99L3BhY2thZ2UuanNvbmAgKTtcclxuICBjb25zdCBzdHJpbmdNb2R1bGVOYW1lID0gYCR7cGFzY2FsQ2FzZSggcmVwbyApfVN0cmluZ3NgO1xyXG4gIGNvbnN0IHJlbGF0aXZlU3RyaW5nTW9kdWxlRmlsZSA9IGBqcy8ke3N0cmluZ01vZHVsZU5hbWV9LnRzYDtcclxuICBjb25zdCBzdHJpbmdNb2R1bGVGaWxlSlMgPSBgLi4vJHtyZXBvfS9qcy8ke3N0cmluZ01vZHVsZU5hbWV9LmpzYDtcclxuICBjb25zdCBuYW1lc3BhY2UgPSBfLmNhbWVsQ2FzZSggcmVwbyApO1xyXG5cclxuICBpZiAoIGZzLmV4aXN0c1N5bmMoIHN0cmluZ01vZHVsZUZpbGVKUyApICkge1xyXG4gICAgY29uc29sZS5sb2coICdGb3VuZCBKUyBzdHJpbmcgZmlsZSBpbiBUUyByZXBvLiAgSXQgc2hvdWxkIGJlIGRlbGV0ZWQgbWFudWFsbHkuICAnICsgc3RyaW5nTW9kdWxlRmlsZUpTICk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBjb3B5cmlnaHRMaW5lID0gYXdhaXQgZ2V0Q29weXJpZ2h0TGluZSggcmVwbywgcmVsYXRpdmVTdHJpbmdNb2R1bGVGaWxlICk7XHJcbiAgYXdhaXQgd3JpdGVGaWxlQW5kR2l0QWRkKCByZXBvLCByZWxhdGl2ZVN0cmluZ01vZHVsZUZpbGUsIGZpeEVPTChcclxuICAgIGAke2NvcHlyaWdodExpbmV9XHJcblxyXG4vKipcclxuICogQXV0by1nZW5lcmF0ZWQgZnJvbSBtb2R1bGlmeSwgRE8gTk9UIG1hbnVhbGx5IG1vZGlmeS5cclxuICovXHJcbi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCBnZXRTdHJpbmdNb2R1bGUgZnJvbSAnLi4vLi4vY2hpcHBlci9qcy9nZXRTdHJpbmdNb2R1bGUuanMnO1xyXG5pbXBvcnQgdHlwZSBMb2NhbGl6ZWRTdHJpbmdQcm9wZXJ0eSBmcm9tICcuLi8uLi9jaGlwcGVyL2pzL0xvY2FsaXplZFN0cmluZ1Byb3BlcnR5LmpzJztcclxuaW1wb3J0ICR7bmFtZXNwYWNlfSBmcm9tICcuLyR7bmFtZXNwYWNlfS5qcyc7XHJcblxyXG50eXBlIFN0cmluZ3NUeXBlID0gJHtnZXRTdHJpbmdUeXBlcyggcmVwbyApfTtcclxuXHJcbmNvbnN0ICR7c3RyaW5nTW9kdWxlTmFtZX0gPSBnZXRTdHJpbmdNb2R1bGUoICcke3BhY2thZ2VPYmplY3QucGhldC5yZXF1aXJlanNOYW1lc3BhY2V9JyApIGFzIFN0cmluZ3NUeXBlO1xyXG5cclxuJHtuYW1lc3BhY2V9LnJlZ2lzdGVyKCAnJHtzdHJpbmdNb2R1bGVOYW1lfScsICR7c3RyaW5nTW9kdWxlTmFtZX0gKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0ICR7c3RyaW5nTW9kdWxlTmFtZX07XHJcbmAgKSApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSAqLmQudHMgZmlsZSB0aGF0IHJlcHJlc2VudHMgdGhlIHR5cGVzIG9mIHRoZSBzdHJpbmdzIGZvciB0aGUgcmVwby5cclxuICogQHB1YmxpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVwb1xyXG4gKi9cclxuY29uc3QgZ2V0U3RyaW5nVHlwZXMgPSByZXBvID0+IHtcclxuICBjb25zdCBwYWNrYWdlT2JqZWN0ID0gZ3J1bnQuZmlsZS5yZWFkSlNPTiggYC4uLyR7cmVwb30vcGFja2FnZS5qc29uYCApO1xyXG4gIGNvbnN0IGpzb24gPSBncnVudC5maWxlLnJlYWRKU09OKCBgLi4vJHtyZXBvfS8ke3JlcG99LXN0cmluZ3NfZW4uanNvbmAgKTtcclxuXHJcbiAgLy8gVHJhY2sgcGF0aHMgdG8gYWxsIHRoZSBrZXlzIHdpdGggdmFsdWVzLlxyXG4gIGNvbnN0IGFsbCA9IFtdO1xyXG5cclxuICAvLyBSZWN1cnNpdmVseSBjb2xsZWN0IGFsbCBvZiB0aGUgcGF0aHMgdG8ga2V5cyB3aXRoIHZhbHVlcy5cclxuICBjb25zdCB2aXNpdCA9ICggbGV2ZWwsIHBhdGggKSA9PiB7XHJcbiAgICBPYmplY3Qua2V5cyggbGV2ZWwgKS5mb3JFYWNoKCBrZXkgPT4ge1xyXG4gICAgICBpZiAoIGtleSAhPT0gJ19jb21tZW50JyApIHtcclxuICAgICAgICBpZiAoIGxldmVsWyBrZXkgXS52YWx1ZSAmJiB0eXBlb2YgbGV2ZWxbIGtleSBdLnZhbHVlID09PSAnc3RyaW5nJyApIHtcclxuICAgICAgICAgIGFsbC5wdXNoKCB7IHBhdGg6IFsgLi4ucGF0aCwga2V5IF0sIHZhbHVlOiBsZXZlbFsga2V5IF0udmFsdWUgfSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHZpc2l0KCBsZXZlbFsga2V5IF0sIFsgLi4ucGF0aCwga2V5IF0gKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuICB9O1xyXG4gIHZpc2l0KCBqc29uLCBbXSApO1xyXG5cclxuICAvLyBUcmFuc2Zvcm0gdG8gYSBuZXcgc3RydWN0dXJlIHRoYXQgbWF0Y2hlcyB0aGUgdHlwZXMgd2UgYWNjZXNzIGF0IHJ1bnRpbWUuXHJcbiAgY29uc3Qgc3RydWN0dXJlID0ge307XHJcbiAgZm9yICggbGV0IGkgPSAwOyBpIDwgYWxsLmxlbmd0aDsgaSsrICkge1xyXG4gICAgY29uc3QgYWxsRWxlbWVudCA9IGFsbFsgaSBdO1xyXG4gICAgY29uc3QgcGF0aCA9IGFsbEVsZW1lbnQucGF0aDtcclxuICAgIGxldCBsZXZlbCA9IHN0cnVjdHVyZTtcclxuICAgIGZvciAoIGxldCBrID0gMDsgayA8IHBhdGgubGVuZ3RoOyBrKysgKSB7XHJcbiAgICAgIGNvbnN0IHBhdGhFbGVtZW50ID0gcGF0aFsgayBdO1xyXG4gICAgICBjb25zdCB0b2tlbnMgPSBwYXRoRWxlbWVudC5zcGxpdCggJy4nICk7XHJcbiAgICAgIGZvciAoIGxldCBtID0gMDsgbSA8IHRva2Vucy5sZW5ndGg7IG0rKyApIHtcclxuICAgICAgICBjb25zdCB0b2tlbiA9IHRva2Vuc1sgbSBdO1xyXG5cclxuICAgICAgICBhc3NlcnQoICF0b2tlbi5pbmNsdWRlcyggJzsnICksIGBUb2tlbiAke3Rva2VufSBjYW5ub3QgaW5jbHVkZSBmb3JiaWRkZW4gY2hhcmFjdGVyc2AgKTtcclxuICAgICAgICBhc3NlcnQoICF0b2tlbi5pbmNsdWRlcyggJywnICksIGBUb2tlbiAke3Rva2VufSBjYW5ub3QgaW5jbHVkZSBmb3JiaWRkZW4gY2hhcmFjdGVyc2AgKTtcclxuICAgICAgICBhc3NlcnQoICF0b2tlbi5pbmNsdWRlcyggJyAnICksIGBUb2tlbiAke3Rva2VufSBjYW5ub3QgaW5jbHVkZSBmb3JiaWRkZW4gY2hhcmFjdGVyc2AgKTtcclxuXHJcbiAgICAgICAgaWYgKCBrID09PSBwYXRoLmxlbmd0aCAtIDEgJiYgbSA9PT0gdG9rZW5zLmxlbmd0aCAtIDEgKSB7XHJcbiAgICAgICAgICBpZiAoICEoIHBhY2thZ2VPYmplY3QucGhldCAmJiBwYWNrYWdlT2JqZWN0LnBoZXQuc2ltRmVhdHVyZXMgJiYgcGFja2FnZU9iamVjdC5waGV0LnNpbUZlYXR1cmVzLnN1cHBvcnRzRHluYW1pY0xvY2FsZSApICkge1xyXG4gICAgICAgICAgICBsZXZlbFsgdG9rZW4gXSA9ICd7e1NUUklOR319JzsgLy8gaW5zdGVhZCBvZiB2YWx1ZSA9IGFsbEVsZW1lbnQudmFsdWVcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGxldmVsWyBgJHt0b2tlbn1TdHJpbmdQcm9wZXJ0eWAgXSA9ICd7e1NUUklOR19QUk9QRVJUWX19JztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBsZXZlbFsgdG9rZW4gXSA9IGxldmVsWyB0b2tlbiBdIHx8IHt9O1xyXG4gICAgICAgICAgbGV2ZWwgPSBsZXZlbFsgdG9rZW4gXTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGxldCB0ZXh0ID0gSlNPTi5zdHJpbmdpZnkoIHN0cnVjdHVyZSwgbnVsbCwgMiApO1xyXG5cclxuICAvLyBVc2Ugc2luZ2xlIHF1b3RlcyBpbnN0ZWFkIG9mIHRoZSBkb3VibGUgcXVvdGVzIGZyb20gSlNPTlxyXG4gIHRleHQgPSByZXBsYWNlKCB0ZXh0LCAnXCInLCAnXFwnJyApO1xyXG5cclxuICB0ZXh0ID0gcmVwbGFjZSggdGV4dCwgJ1xcJ3t7U1RSSU5HfX1cXCcnLCAnc3RyaW5nJyApO1xyXG4gIHRleHQgPSByZXBsYWNlKCB0ZXh0LCAnXFwne3tTVFJJTkdfUFJPUEVSVFl9fVxcJycsICdMb2NhbGl6ZWRTdHJpbmdQcm9wZXJ0eScgKTtcclxuXHJcbiAgLy8gQWRkIDsgdG8gdGhlIGxhc3QgaW4gdGhlIGxpc3RcclxuICB0ZXh0ID0gcmVwbGFjZSggdGV4dCwgJzogc3RyaW5nXFxuJywgJzogc3RyaW5nO1xcbicgKTtcclxuICB0ZXh0ID0gcmVwbGFjZSggdGV4dCwgJzogTG9jYWxpemVkU3RyaW5nUHJvcGVydHlcXG4nLCAnOiBMb2NhbGl6ZWRTdHJpbmdQcm9wZXJ0eTtcXG4nICk7XHJcblxyXG4gIC8vIFVzZSA7IGluc3RlYWQgb2YgLFxyXG4gIHRleHQgPSByZXBsYWNlKCB0ZXh0LCAnLCcsICc7JyApO1xyXG5cclxuICByZXR1cm4gdGV4dDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBFbnRyeSBwb2ludCBmb3IgbW9kdWxpZnksIHdoaWNoIHRyYW5zZm9ybXMgYWxsIG9mIHRoZSByZXNvdXJjZXMgaW4gYSByZXBvIHRvICouanMgZmlsZXMuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSByZXBvIC0gdGhlIG5hbWUgb2YgYSByZXBvLCBzdWNoIGFzICdqb2lzdCdcclxuICovXHJcbmNvbnN0IG1vZHVsaWZ5ID0gYXN5bmMgcmVwbyA9PiB7XHJcbiAgY29uc29sZS5sb2coIGBtb2R1bGlmeWluZyAke3JlcG99YCApO1xyXG4gIGNvbnN0IHJlbGF0aXZlRmlsZXMgPSBbXTtcclxuICBncnVudC5maWxlLnJlY3Vyc2UoIGAuLi8ke3JlcG99YCwgYXN5bmMgKCBhYnNwYXRoLCByb290ZGlyLCBzdWJkaXIsIGZpbGVuYW1lICkgPT4ge1xyXG4gICAgcmVsYXRpdmVGaWxlcy5wdXNoKCB7IGFic3BhdGg6IGFic3BhdGgsIHJvb3RkaXI6IHJvb3RkaXIsIHN1YmRpcjogc3ViZGlyLCBmaWxlbmFtZTogZmlsZW5hbWUgfSApO1xyXG4gIH0gKTtcclxuXHJcbiAgZm9yICggbGV0IGkgPSAwOyBpIDwgcmVsYXRpdmVGaWxlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgIGNvbnN0IGVudHJ5ID0gcmVsYXRpdmVGaWxlc1sgaSBdO1xyXG4gICAgYXdhaXQgbW9kdWxpZnlGaWxlKCBlbnRyeS5hYnNwYXRoLCBlbnRyeS5yb290ZGlyLCBlbnRyeS5zdWJkaXIsIGVudHJ5LmZpbGVuYW1lLCByZXBvICk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBwYWNrYWdlT2JqZWN0ID0gZ3J1bnQuZmlsZS5yZWFkSlNPTiggYC4uLyR7cmVwb30vcGFja2FnZS5qc29uYCApO1xyXG5cclxuICAvLyBTdHJpbmdzIG1vZHVsZSBmaWxlXHJcbiAgaWYgKCBmcy5leGlzdHNTeW5jKCBgLi4vJHtyZXBvfS8ke3JlcG99LXN0cmluZ3NfZW4uanNvbmAgKSAmJiBwYWNrYWdlT2JqZWN0LnBoZXQgJiYgcGFja2FnZU9iamVjdC5waGV0LnJlcXVpcmVqc05hbWVzcGFjZSApIHtcclxuICAgIGF3YWl0IGNyZWF0ZVN0cmluZ01vZHVsZSggcmVwbyApO1xyXG4gIH1cclxuXHJcbiAgLy8gSW1hZ2VzIG1vZHVsZSBmaWxlIChsb2NhbGl6ZWQgaW1hZ2VzKVxyXG4gIGlmICggZnMuZXhpc3RzU3luYyggYC4uLyR7cmVwb30vJHtyZXBvfS1pbWFnZXMuanNvbmAgKSApIHtcclxuICAgIGNvbnN0IHN1cHBvcnRlZFJlZ2lvbnNBbmRDdWx0dXJlcyA9IHBhY2thZ2VPYmplY3Q/LnBoZXQ/LnNpbUZlYXR1cmVzPy5zdXBwb3J0ZWRSZWdpb25zQW5kQ3VsdHVyZXM7XHJcblxyXG4gICAgaWYgKCAhc3VwcG9ydGVkUmVnaW9uc0FuZEN1bHR1cmVzICkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoIGBzdXBwb3J0ZWRSZWdpb25zQW5kQ3VsdHVyZXMgaXMgbm90IGRlZmluZWQgaW4gcGFja2FnZS5qc29uLCBidXQgJHtyZXBvfS1pbWFnZXMuanNvbiBleGlzdHNgICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCAhc3VwcG9ydGVkUmVnaW9uc0FuZEN1bHR1cmVzLmluY2x1ZGVzKCAndXNhJyApICkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoICdyZWdpb25BbmRDdWx0dXJlIFxcJ3VzYVxcJyBpcyByZXF1aXJlZCwgYnV0IG5vdCBmb3VuZCBpbiBzdXBwb3J0ZWRSZWdpb25zQW5kQ3VsdHVyZXMnICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBzdXBwb3J0ZWRSZWdpb25zQW5kQ3VsdHVyZXMuaW5jbHVkZXMoICdtdWx0aScgKSAmJiBzdXBwb3J0ZWRSZWdpb25zQW5kQ3VsdHVyZXMubGVuZ3RoIDwgMyApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCAncmVnaW9uQW5kQ3VsdHVyZSBcXCdtdWx0aVxcJyBpcyBzdXBwb3J0ZWQsIGJ1dCB0aGVyZSBhcmUgbm90IGVub3VnaCByZWdpb25BbmRDdWx0dXJlcyB0byBzdXBwb3J0IGl0JyApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNvbmNyZXRlUmVnaW9uc0FuZEN1bHR1cmVzID0gc3VwcG9ydGVkUmVnaW9uc0FuZEN1bHR1cmVzLmZpbHRlciggcmVnaW9uQW5kQ3VsdHVyZSA9PiByZWdpb25BbmRDdWx0dXJlICE9PSAncmFuZG9tJyApO1xyXG4gICAgXHJcbiAgICAvLyBVcGRhdGUgdGhlIGltYWdlcyBtb2R1bGUgZmlsZVxyXG4gICAgYXdhaXQgY3JlYXRlSW1hZ2VNb2R1bGUoIHJlcG8sIGNvbmNyZXRlUmVnaW9uc0FuZEN1bHR1cmVzICk7XHJcbiAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBtb2R1bGlmeTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQSxNQUFNQSxDQUFDLEdBQUdDLE9BQU8sQ0FBRSxRQUFTLENBQUM7QUFDN0IsTUFBTUMsWUFBWSxHQUFHRCxPQUFPLENB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