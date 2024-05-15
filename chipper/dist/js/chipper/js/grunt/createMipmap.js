// Copyright 2017-2024, University of Colorado Boulder

const fs = require('fs');
const grunt = require('grunt');
const jpeg = require('jpeg-js'); // eslint-disable-line require-statement-match
const mipmapDownscale = require('../../../chipper/js/common/mipmapDownscale');
const pngjs = require('pngjs');

/**
 * Responsible for converting a single PNG/JPEG file to a structured list of mipmapped versions of it, each
 * at half the scale of the previous version.
 *
 * Level 0 is the original image, level 1 is a half-size image, level 2 is a quarter-size image, etc.
 *
 * For each level, a preferred encoding (PNG/JPEG) is determined. If the image doesn't need alpha information and
 * the JPEG base64 is smaller, the JPEG encoding will be used (PNG otherwise).
 *
 * The resulting object for each mipmap level will be of the form:
 * {
 *   width: {number} - width of the image provided by this level of detail
 *   height: {number} - width of the image provided by this level of detail
 *   data: {Buffer} - 1-dimensional row-major buffer holding RGBA information for the level as an array of bytes 0-255.
 *                    e.g. buffer[2] will be the blue component of the top-left pixel, buffer[4] is the red component
 *                    for the pixel to the right, etc.
 *   url: {string} - Data URL for the preferred image data
 *   buffer: {Buffer} - Raw bytes for the preferred image data (could be written to file and opened as an image)
 *   <pngURL, pngBuffer, jpgURL, jpgBuffer may also be available, but is not meant for general use>
 * }
 *
 * @param {string} filename
 * @param {number} maxLevel - An integer denoting the maximum level of detail that should be included, or -1 to include
 *                            all levels up to and including a 1x1 image.
 * @param {number} quality - An integer from 1-100 determining the quality of the image. Currently only used for the
 *                           JPEG encoding quality.
 * @returns {Promise} - Will be resolved with mipmaps: {Array} (consisting of the mipmap objects, mipmaps[0] will be level 0)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
module.exports = function createMipmap(filename, maxLevel, quality) {
  return new Promise((resolve, reject) => {
    const mipmaps = [];

    // kick everything off
    const suffix = filename.slice(-4);
    if (suffix === '.jpg') {
      loadJPEG();
    } else if (suffix === '.png') {
      loadPNG();
    } else {
      reject(new Error(`unknown image type: ${filename}`));
    }

    // Loads / decodes the initial JPEG image, and when done proceeds to the mipmapping
    function loadJPEG() {
      const imageData = jpeg.decode(fs.readFileSync(filename));
      mipmaps.push({
        data: imageData.data,
        width: imageData.width,
        height: imageData.height
      });
      startMipmapCreation();
    }

    // Loads / decodes the initial PNG image, and when done proceeds to the mipmapping
    function loadPNG() {
      const src = fs.createReadStream(filename);
      const basePNG = new pngjs.PNG({
        // if we need a specific filter type, put it here
      });
      basePNG.on('error', err => {
        reject(err);
      });
      basePNG.on('parsed', () => {
        mipmaps.push({
          data: basePNG.data,
          width: basePNG.width,
          height: basePNG.height
        });
        startMipmapCreation();
      });

      // pass the stream to pngjs
      src.pipe(basePNG);
    }

    /**
     * @param {Buffer} data - Should have 4*width*height elements
     * @param {number} width
     * @param {number} height
     * @param {number} quality - Out of 100
     * @param {function} callback - function( buffer )
     */
    function outputJPEG(data, width, height, quality, callback) {
      const encodedOuput = jpeg.encode({
        data: data,
        width: width,
        height: height
      }, quality);
      callback(encodedOuput.data);
    }

    /**
     * @param {Buffer} data - Should have 4*width*height elements
     * @param {number} width
     * @param {number} height
     * @param {function} callback - function( buffer )
     */
    function outputPNG(data, width, height, callback) {
      // provides width/height so it is initialized with the correct-size buffer
      const png = new pngjs.PNG({
        width: width,
        height: height
      });

      // copy our image data into the pngjs.PNG's data buffer;
      data.copy(png.data, 0, 0, data.length);

      // will concatenate the buffers from the stream into one once it is finished
      const buffers = [];
      png.on('data', buffer => {
        buffers.push(buffer);
      });
      png.on('end', () => {
        const buffer = Buffer.concat(buffers);
        callback(buffer);
      });
      png.on('error', err => {
        reject(err);
      });

      // kick off the encoding of the PNG
      png.pack();
    }

    // called when our mipmap[0] level is loaded by decoding the main image (creates the mipmap levels)
    function startMipmapCreation() {
      // When reduced to 0, we'll be done with encoding (and can call our callback). Needed because they are asynchronous.
      let encodeCounter = 1;

      // Alpha detection on the level-0 image to see if we can swap jpg for png
      let hasAlpha = false;
      for (let i = 3; i < mipmaps[0].data.length; i += 4) {
        if (mipmaps[0].data[i] < 255) {
          hasAlpha = true;
          break;
        }
      }

      // called when all of encoding is complete
      function encodingComplete() {
        grunt.log.debug(`mipmapped ${filename}${maxLevel >= 0 ? ` to level ${maxLevel}` : ''} with quality: ${quality}`);
        for (let level = 0; level < mipmaps.length; level++) {
          // for now, make .url point to the smallest of the two (unless we have an alpha channel need)
          const usePNG = hasAlpha || mipmaps[level].jpgURL.length > mipmaps[level].pngURL.length;
          mipmaps[level].url = usePNG ? mipmaps[level].pngURL : mipmaps[level].jpgURL;
          mipmaps[level].buffer = usePNG ? mipmaps[level].pngBuffer : mipmaps[level].jpgBuffer;
          grunt.log.debug(`level ${level} (${usePNG ? 'PNG' : 'JPG'} ${mipmaps[level].width}x${mipmaps[level].height}) base64: ${mipmaps[level].url.length} bytes `);
        }
        resolve(mipmaps);
      }

      // kicks off asynchronous encoding for a specific level
      function encodeLevel(level) {
        encodeCounter++;
        outputPNG(mipmaps[level].data, mipmaps[level].width, mipmaps[level].height, buffer => {
          mipmaps[level].pngBuffer = buffer;
          mipmaps[level].pngURL = `data:image/png;base64,${buffer.toString('base64')}`;
          if (--encodeCounter === 0) {
            encodingComplete();
          }
        });

        // only encode JPEG if it has no alpha
        if (!hasAlpha) {
          encodeCounter++;
          outputJPEG(mipmaps[level].data, mipmaps[level].width, mipmaps[level].height, quality, buffer => {
            mipmaps[level].jpgBuffer = buffer;
            mipmaps[level].jpgURL = `data:image/jpeg;base64,${buffer.toString('base64')}`;
            if (--encodeCounter === 0) {
              encodingComplete();
            }
          });
        }
      }

      // encode all levels, and compute rasters for levels 1-N
      encodeLevel(0);
      function finestMipmap() {
        return mipmaps[mipmaps.length - 1];
      }

      // bail if we already have a 1x1 image, or if we reach the maxLevel (recall maxLevel===-1 means no maximum level)
      // eslint-disable-next-line no-unmodified-loop-condition
      while ((mipmaps.length - 1 < maxLevel || maxLevel < 0) && (finestMipmap().width > 1 || finestMipmap().height > 1)) {
        const level = mipmaps.length;
        mipmaps.push(mipmapDownscale(finestMipmap(), (width, height) => {
          return Buffer.alloc(4 * width * height);
        }));
        encodeLevel(level);
      }

      // just in case everything happened synchronously
      if (--encodeCounter === 0) {
        encodingComplete();
      }
    }
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJncnVudCIsImpwZWciLCJtaXBtYXBEb3duc2NhbGUiLCJwbmdqcyIsIm1vZHVsZSIsImV4cG9ydHMiLCJjcmVhdGVNaXBtYXAiLCJmaWxlbmFtZSIsIm1heExldmVsIiwicXVhbGl0eSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwibWlwbWFwcyIsInN1ZmZpeCIsInNsaWNlIiwibG9hZEpQRUciLCJsb2FkUE5HIiwiRXJyb3IiLCJpbWFnZURhdGEiLCJkZWNvZGUiLCJyZWFkRmlsZVN5bmMiLCJwdXNoIiwiZGF0YSIsIndpZHRoIiwiaGVpZ2h0Iiwic3RhcnRNaXBtYXBDcmVhdGlvbiIsInNyYyIsImNyZWF0ZVJlYWRTdHJlYW0iLCJiYXNlUE5HIiwiUE5HIiwib24iLCJlcnIiLCJwaXBlIiwib3V0cHV0SlBFRyIsImNhbGxiYWNrIiwiZW5jb2RlZE91cHV0IiwiZW5jb2RlIiwib3V0cHV0UE5HIiwicG5nIiwiY29weSIsImxlbmd0aCIsImJ1ZmZlcnMiLCJidWZmZXIiLCJCdWZmZXIiLCJjb25jYXQiLCJwYWNrIiwiZW5jb2RlQ291bnRlciIsImhhc0FscGhhIiwiaSIsImVuY29kaW5nQ29tcGxldGUiLCJsb2ciLCJkZWJ1ZyIsImxldmVsIiwidXNlUE5HIiwianBnVVJMIiwicG5nVVJMIiwidXJsIiwicG5nQnVmZmVyIiwianBnQnVmZmVyIiwiZW5jb2RlTGV2ZWwiLCJ0b1N0cmluZyIsImZpbmVzdE1pcG1hcCIsImFsbG9jIl0sInNvdXJjZXMiOlsiY3JlYXRlTWlwbWFwLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuXHJcbmNvbnN0IGZzID0gcmVxdWlyZSggJ2ZzJyApO1xyXG5jb25zdCBncnVudCA9IHJlcXVpcmUoICdncnVudCcgKTtcclxuY29uc3QganBlZyA9IHJlcXVpcmUoICdqcGVnLWpzJyApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHJlcXVpcmUtc3RhdGVtZW50LW1hdGNoXHJcbmNvbnN0IG1pcG1hcERvd25zY2FsZSA9IHJlcXVpcmUoICcuLi8uLi8uLi9jaGlwcGVyL2pzL2NvbW1vbi9taXBtYXBEb3duc2NhbGUnICk7XHJcbmNvbnN0IHBuZ2pzID0gcmVxdWlyZSggJ3BuZ2pzJyApO1xyXG5cclxuLyoqXHJcbiAqIFJlc3BvbnNpYmxlIGZvciBjb252ZXJ0aW5nIGEgc2luZ2xlIFBORy9KUEVHIGZpbGUgdG8gYSBzdHJ1Y3R1cmVkIGxpc3Qgb2YgbWlwbWFwcGVkIHZlcnNpb25zIG9mIGl0LCBlYWNoXHJcbiAqIGF0IGhhbGYgdGhlIHNjYWxlIG9mIHRoZSBwcmV2aW91cyB2ZXJzaW9uLlxyXG4gKlxyXG4gKiBMZXZlbCAwIGlzIHRoZSBvcmlnaW5hbCBpbWFnZSwgbGV2ZWwgMSBpcyBhIGhhbGYtc2l6ZSBpbWFnZSwgbGV2ZWwgMiBpcyBhIHF1YXJ0ZXItc2l6ZSBpbWFnZSwgZXRjLlxyXG4gKlxyXG4gKiBGb3IgZWFjaCBsZXZlbCwgYSBwcmVmZXJyZWQgZW5jb2RpbmcgKFBORy9KUEVHKSBpcyBkZXRlcm1pbmVkLiBJZiB0aGUgaW1hZ2UgZG9lc24ndCBuZWVkIGFscGhhIGluZm9ybWF0aW9uIGFuZFxyXG4gKiB0aGUgSlBFRyBiYXNlNjQgaXMgc21hbGxlciwgdGhlIEpQRUcgZW5jb2Rpbmcgd2lsbCBiZSB1c2VkIChQTkcgb3RoZXJ3aXNlKS5cclxuICpcclxuICogVGhlIHJlc3VsdGluZyBvYmplY3QgZm9yIGVhY2ggbWlwbWFwIGxldmVsIHdpbGwgYmUgb2YgdGhlIGZvcm06XHJcbiAqIHtcclxuICogICB3aWR0aDoge251bWJlcn0gLSB3aWR0aCBvZiB0aGUgaW1hZ2UgcHJvdmlkZWQgYnkgdGhpcyBsZXZlbCBvZiBkZXRhaWxcclxuICogICBoZWlnaHQ6IHtudW1iZXJ9IC0gd2lkdGggb2YgdGhlIGltYWdlIHByb3ZpZGVkIGJ5IHRoaXMgbGV2ZWwgb2YgZGV0YWlsXHJcbiAqICAgZGF0YToge0J1ZmZlcn0gLSAxLWRpbWVuc2lvbmFsIHJvdy1tYWpvciBidWZmZXIgaG9sZGluZyBSR0JBIGluZm9ybWF0aW9uIGZvciB0aGUgbGV2ZWwgYXMgYW4gYXJyYXkgb2YgYnl0ZXMgMC0yNTUuXHJcbiAqICAgICAgICAgICAgICAgICAgICBlLmcuIGJ1ZmZlclsyXSB3aWxsIGJlIHRoZSBibHVlIGNvbXBvbmVudCBvZiB0aGUgdG9wLWxlZnQgcGl4ZWwsIGJ1ZmZlcls0XSBpcyB0aGUgcmVkIGNvbXBvbmVudFxyXG4gKiAgICAgICAgICAgICAgICAgICAgZm9yIHRoZSBwaXhlbCB0byB0aGUgcmlnaHQsIGV0Yy5cclxuICogICB1cmw6IHtzdHJpbmd9IC0gRGF0YSBVUkwgZm9yIHRoZSBwcmVmZXJyZWQgaW1hZ2UgZGF0YVxyXG4gKiAgIGJ1ZmZlcjoge0J1ZmZlcn0gLSBSYXcgYnl0ZXMgZm9yIHRoZSBwcmVmZXJyZWQgaW1hZ2UgZGF0YSAoY291bGQgYmUgd3JpdHRlbiB0byBmaWxlIGFuZCBvcGVuZWQgYXMgYW4gaW1hZ2UpXHJcbiAqICAgPHBuZ1VSTCwgcG5nQnVmZmVyLCBqcGdVUkwsIGpwZ0J1ZmZlciBtYXkgYWxzbyBiZSBhdmFpbGFibGUsIGJ1dCBpcyBub3QgbWVhbnQgZm9yIGdlbmVyYWwgdXNlPlxyXG4gKiB9XHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZVxyXG4gKiBAcGFyYW0ge251bWJlcn0gbWF4TGV2ZWwgLSBBbiBpbnRlZ2VyIGRlbm90aW5nIHRoZSBtYXhpbXVtIGxldmVsIG9mIGRldGFpbCB0aGF0IHNob3VsZCBiZSBpbmNsdWRlZCwgb3IgLTEgdG8gaW5jbHVkZVxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGwgbGV2ZWxzIHVwIHRvIGFuZCBpbmNsdWRpbmcgYSAxeDEgaW1hZ2UuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBxdWFsaXR5IC0gQW4gaW50ZWdlciBmcm9tIDEtMTAwIGRldGVybWluaW5nIHRoZSBxdWFsaXR5IG9mIHRoZSBpbWFnZS4gQ3VycmVudGx5IG9ubHkgdXNlZCBmb3IgdGhlXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgSlBFRyBlbmNvZGluZyBxdWFsaXR5LlxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gLSBXaWxsIGJlIHJlc29sdmVkIHdpdGggbWlwbWFwczoge0FycmF5fSAoY29uc2lzdGluZyBvZiB0aGUgbWlwbWFwIG9iamVjdHMsIG1pcG1hcHNbMF0gd2lsbCBiZSBsZXZlbCAwKVxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZU1pcG1hcCggZmlsZW5hbWUsIG1heExldmVsLCBxdWFsaXR5ICkge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSggKCByZXNvbHZlLCByZWplY3QgKSA9PiB7XHJcbiAgICBjb25zdCBtaXBtYXBzID0gW107XHJcblxyXG4gICAgLy8ga2ljayBldmVyeXRoaW5nIG9mZlxyXG4gICAgY29uc3Qgc3VmZml4ID0gZmlsZW5hbWUuc2xpY2UoIC00ICk7XHJcbiAgICBpZiAoIHN1ZmZpeCA9PT0gJy5qcGcnICkge1xyXG4gICAgICBsb2FkSlBFRygpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIHN1ZmZpeCA9PT0gJy5wbmcnICkge1xyXG4gICAgICBsb2FkUE5HKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmVqZWN0KCBuZXcgRXJyb3IoIGB1bmtub3duIGltYWdlIHR5cGU6ICR7ZmlsZW5hbWV9YCApICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTG9hZHMgLyBkZWNvZGVzIHRoZSBpbml0aWFsIEpQRUcgaW1hZ2UsIGFuZCB3aGVuIGRvbmUgcHJvY2VlZHMgdG8gdGhlIG1pcG1hcHBpbmdcclxuICAgIGZ1bmN0aW9uIGxvYWRKUEVHKCkge1xyXG4gICAgICBjb25zdCBpbWFnZURhdGEgPSBqcGVnLmRlY29kZSggZnMucmVhZEZpbGVTeW5jKCBmaWxlbmFtZSApICk7XHJcblxyXG4gICAgICBtaXBtYXBzLnB1c2goIHtcclxuICAgICAgICBkYXRhOiBpbWFnZURhdGEuZGF0YSxcclxuICAgICAgICB3aWR0aDogaW1hZ2VEYXRhLndpZHRoLFxyXG4gICAgICAgIGhlaWdodDogaW1hZ2VEYXRhLmhlaWdodFxyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICBzdGFydE1pcG1hcENyZWF0aW9uKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTG9hZHMgLyBkZWNvZGVzIHRoZSBpbml0aWFsIFBORyBpbWFnZSwgYW5kIHdoZW4gZG9uZSBwcm9jZWVkcyB0byB0aGUgbWlwbWFwcGluZ1xyXG4gICAgZnVuY3Rpb24gbG9hZFBORygpIHtcclxuICAgICAgY29uc3Qgc3JjID0gZnMuY3JlYXRlUmVhZFN0cmVhbSggZmlsZW5hbWUgKTtcclxuXHJcbiAgICAgIGNvbnN0IGJhc2VQTkcgPSBuZXcgcG5nanMuUE5HKCB7XHJcbiAgICAgICAgLy8gaWYgd2UgbmVlZCBhIHNwZWNpZmljIGZpbHRlciB0eXBlLCBwdXQgaXQgaGVyZVxyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICBiYXNlUE5HLm9uKCAnZXJyb3InLCBlcnIgPT4ge1xyXG4gICAgICAgIHJlamVjdCggZXJyICk7XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAgIGJhc2VQTkcub24oICdwYXJzZWQnLCAoKSA9PiB7XHJcbiAgICAgICAgbWlwbWFwcy5wdXNoKCB7XHJcbiAgICAgICAgICBkYXRhOiBiYXNlUE5HLmRhdGEsXHJcbiAgICAgICAgICB3aWR0aDogYmFzZVBORy53aWR0aCxcclxuICAgICAgICAgIGhlaWdodDogYmFzZVBORy5oZWlnaHRcclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgIHN0YXJ0TWlwbWFwQ3JlYXRpb24oKTtcclxuICAgICAgfSApO1xyXG5cclxuICAgICAgLy8gcGFzcyB0aGUgc3RyZWFtIHRvIHBuZ2pzXHJcbiAgICAgIHNyYy5waXBlKCBiYXNlUE5HICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge0J1ZmZlcn0gZGF0YSAtIFNob3VsZCBoYXZlIDQqd2lkdGgqaGVpZ2h0IGVsZW1lbnRzXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGhcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHRcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBxdWFsaXR5IC0gT3V0IG9mIDEwMFxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBmdW5jdGlvbiggYnVmZmVyIClcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gb3V0cHV0SlBFRyggZGF0YSwgd2lkdGgsIGhlaWdodCwgcXVhbGl0eSwgY2FsbGJhY2sgKSB7XHJcbiAgICAgIGNvbnN0IGVuY29kZWRPdXB1dCA9IGpwZWcuZW5jb2RlKCB7XHJcbiAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICB3aWR0aDogd2lkdGgsXHJcbiAgICAgICAgaGVpZ2h0OiBoZWlnaHRcclxuICAgICAgfSwgcXVhbGl0eSApO1xyXG4gICAgICBjYWxsYmFjayggZW5jb2RlZE91cHV0LmRhdGEgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7QnVmZmVyfSBkYXRhIC0gU2hvdWxkIGhhdmUgNCp3aWR0aCpoZWlnaHQgZWxlbWVudHNcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodFxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBmdW5jdGlvbiggYnVmZmVyIClcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gb3V0cHV0UE5HKCBkYXRhLCB3aWR0aCwgaGVpZ2h0LCBjYWxsYmFjayApIHtcclxuICAgICAgLy8gcHJvdmlkZXMgd2lkdGgvaGVpZ2h0IHNvIGl0IGlzIGluaXRpYWxpemVkIHdpdGggdGhlIGNvcnJlY3Qtc2l6ZSBidWZmZXJcclxuICAgICAgY29uc3QgcG5nID0gbmV3IHBuZ2pzLlBORygge1xyXG4gICAgICAgIHdpZHRoOiB3aWR0aCxcclxuICAgICAgICBoZWlnaHQ6IGhlaWdodFxyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICAvLyBjb3B5IG91ciBpbWFnZSBkYXRhIGludG8gdGhlIHBuZ2pzLlBORydzIGRhdGEgYnVmZmVyO1xyXG4gICAgICBkYXRhLmNvcHkoIHBuZy5kYXRhLCAwLCAwLCBkYXRhLmxlbmd0aCApO1xyXG5cclxuICAgICAgLy8gd2lsbCBjb25jYXRlbmF0ZSB0aGUgYnVmZmVycyBmcm9tIHRoZSBzdHJlYW0gaW50byBvbmUgb25jZSBpdCBpcyBmaW5pc2hlZFxyXG4gICAgICBjb25zdCBidWZmZXJzID0gW107XHJcbiAgICAgIHBuZy5vbiggJ2RhdGEnLCBidWZmZXIgPT4ge1xyXG4gICAgICAgIGJ1ZmZlcnMucHVzaCggYnVmZmVyICk7XHJcbiAgICAgIH0gKTtcclxuICAgICAgcG5nLm9uKCAnZW5kJywgKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IEJ1ZmZlci5jb25jYXQoIGJ1ZmZlcnMgKTtcclxuXHJcbiAgICAgICAgY2FsbGJhY2soIGJ1ZmZlciApO1xyXG4gICAgICB9ICk7XHJcbiAgICAgIHBuZy5vbiggJ2Vycm9yJywgZXJyID0+IHtcclxuICAgICAgICByZWplY3QoIGVyciApO1xyXG4gICAgICB9ICk7XHJcblxyXG4gICAgICAvLyBraWNrIG9mZiB0aGUgZW5jb2Rpbmcgb2YgdGhlIFBOR1xyXG4gICAgICBwbmcucGFjaygpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGNhbGxlZCB3aGVuIG91ciBtaXBtYXBbMF0gbGV2ZWwgaXMgbG9hZGVkIGJ5IGRlY29kaW5nIHRoZSBtYWluIGltYWdlIChjcmVhdGVzIHRoZSBtaXBtYXAgbGV2ZWxzKVxyXG4gICAgZnVuY3Rpb24gc3RhcnRNaXBtYXBDcmVhdGlvbigpIHtcclxuICAgICAgLy8gV2hlbiByZWR1Y2VkIHRvIDAsIHdlJ2xsIGJlIGRvbmUgd2l0aCBlbmNvZGluZyAoYW5kIGNhbiBjYWxsIG91ciBjYWxsYmFjaykuIE5lZWRlZCBiZWNhdXNlIHRoZXkgYXJlIGFzeW5jaHJvbm91cy5cclxuICAgICAgbGV0IGVuY29kZUNvdW50ZXIgPSAxO1xyXG5cclxuICAgICAgLy8gQWxwaGEgZGV0ZWN0aW9uIG9uIHRoZSBsZXZlbC0wIGltYWdlIHRvIHNlZSBpZiB3ZSBjYW4gc3dhcCBqcGcgZm9yIHBuZ1xyXG4gICAgICBsZXQgaGFzQWxwaGEgPSBmYWxzZTtcclxuICAgICAgZm9yICggbGV0IGkgPSAzOyBpIDwgbWlwbWFwc1sgMCBdLmRhdGEubGVuZ3RoOyBpICs9IDQgKSB7XHJcbiAgICAgICAgaWYgKCBtaXBtYXBzWyAwIF0uZGF0YVsgaSBdIDwgMjU1ICkge1xyXG4gICAgICAgICAgaGFzQWxwaGEgPSB0cnVlO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBjYWxsZWQgd2hlbiBhbGwgb2YgZW5jb2RpbmcgaXMgY29tcGxldGVcclxuICAgICAgZnVuY3Rpb24gZW5jb2RpbmdDb21wbGV0ZSgpIHtcclxuICAgICAgICBncnVudC5sb2cuZGVidWcoIGBtaXBtYXBwZWQgJHtmaWxlbmFtZX0ke21heExldmVsID49IDAgPyBgIHRvIGxldmVsICR7bWF4TGV2ZWx9YCA6ICcnfSB3aXRoIHF1YWxpdHk6ICR7cXVhbGl0eX1gICk7XHJcblxyXG4gICAgICAgIGZvciAoIGxldCBsZXZlbCA9IDA7IGxldmVsIDwgbWlwbWFwcy5sZW5ndGg7IGxldmVsKysgKSB7XHJcbiAgICAgICAgICAvLyBmb3Igbm93LCBtYWtlIC51cmwgcG9pbnQgdG8gdGhlIHNtYWxsZXN0IG9mIHRoZSB0d28gKHVubGVzcyB3ZSBoYXZlIGFuIGFscGhhIGNoYW5uZWwgbmVlZClcclxuICAgICAgICAgIGNvbnN0IHVzZVBORyA9IGhhc0FscGhhIHx8IG1pcG1hcHNbIGxldmVsIF0uanBnVVJMLmxlbmd0aCA+IG1pcG1hcHNbIGxldmVsIF0ucG5nVVJMLmxlbmd0aDtcclxuICAgICAgICAgIG1pcG1hcHNbIGxldmVsIF0udXJsID0gdXNlUE5HID8gbWlwbWFwc1sgbGV2ZWwgXS5wbmdVUkwgOiBtaXBtYXBzWyBsZXZlbCBdLmpwZ1VSTDtcclxuICAgICAgICAgIG1pcG1hcHNbIGxldmVsIF0uYnVmZmVyID0gdXNlUE5HID8gbWlwbWFwc1sgbGV2ZWwgXS5wbmdCdWZmZXIgOiBtaXBtYXBzWyBsZXZlbCBdLmpwZ0J1ZmZlcjtcclxuXHJcbiAgICAgICAgICBncnVudC5sb2cuZGVidWcoIGBsZXZlbCAke2xldmVsfSAoJHt1c2VQTkcgPyAnUE5HJyA6ICdKUEcnfSAke1xyXG4gICAgICAgICAgICBtaXBtYXBzWyBsZXZlbCBdLndpZHRofXgke21pcG1hcHNbIGxldmVsIF0uaGVpZ2h0fSkgYmFzZTY0OiAke1xyXG4gICAgICAgICAgICBtaXBtYXBzWyBsZXZlbCBdLnVybC5sZW5ndGh9IGJ5dGVzIGAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlc29sdmUoIG1pcG1hcHMgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8ga2lja3Mgb2ZmIGFzeW5jaHJvbm91cyBlbmNvZGluZyBmb3IgYSBzcGVjaWZpYyBsZXZlbFxyXG4gICAgICBmdW5jdGlvbiBlbmNvZGVMZXZlbCggbGV2ZWwgKSB7XHJcbiAgICAgICAgZW5jb2RlQ291bnRlcisrO1xyXG4gICAgICAgIG91dHB1dFBORyggbWlwbWFwc1sgbGV2ZWwgXS5kYXRhLCBtaXBtYXBzWyBsZXZlbCBdLndpZHRoLCBtaXBtYXBzWyBsZXZlbCBdLmhlaWdodCwgYnVmZmVyID0+IHtcclxuICAgICAgICAgIG1pcG1hcHNbIGxldmVsIF0ucG5nQnVmZmVyID0gYnVmZmVyO1xyXG4gICAgICAgICAgbWlwbWFwc1sgbGV2ZWwgXS5wbmdVUkwgPSBgZGF0YTppbWFnZS9wbmc7YmFzZTY0LCR7YnVmZmVyLnRvU3RyaW5nKCAnYmFzZTY0JyApfWA7XHJcbiAgICAgICAgICBpZiAoIC0tZW5jb2RlQ291bnRlciA9PT0gMCApIHtcclxuICAgICAgICAgICAgZW5jb2RpbmdDb21wbGV0ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gKTtcclxuXHJcbiAgICAgICAgLy8gb25seSBlbmNvZGUgSlBFRyBpZiBpdCBoYXMgbm8gYWxwaGFcclxuICAgICAgICBpZiAoICFoYXNBbHBoYSApIHtcclxuICAgICAgICAgIGVuY29kZUNvdW50ZXIrKztcclxuICAgICAgICAgIG91dHB1dEpQRUcoIG1pcG1hcHNbIGxldmVsIF0uZGF0YSwgbWlwbWFwc1sgbGV2ZWwgXS53aWR0aCwgbWlwbWFwc1sgbGV2ZWwgXS5oZWlnaHQsIHF1YWxpdHksIGJ1ZmZlciA9PiB7XHJcbiAgICAgICAgICAgIG1pcG1hcHNbIGxldmVsIF0uanBnQnVmZmVyID0gYnVmZmVyO1xyXG4gICAgICAgICAgICBtaXBtYXBzWyBsZXZlbCBdLmpwZ1VSTCA9IGBkYXRhOmltYWdlL2pwZWc7YmFzZTY0LCR7YnVmZmVyLnRvU3RyaW5nKCAnYmFzZTY0JyApfWA7XHJcbiAgICAgICAgICAgIGlmICggLS1lbmNvZGVDb3VudGVyID09PSAwICkge1xyXG4gICAgICAgICAgICAgIGVuY29kaW5nQ29tcGxldGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gZW5jb2RlIGFsbCBsZXZlbHMsIGFuZCBjb21wdXRlIHJhc3RlcnMgZm9yIGxldmVscyAxLU5cclxuICAgICAgZW5jb2RlTGV2ZWwoIDAgKTtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIGZpbmVzdE1pcG1hcCgpIHtcclxuICAgICAgICByZXR1cm4gbWlwbWFwc1sgbWlwbWFwcy5sZW5ndGggLSAxIF07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGJhaWwgaWYgd2UgYWxyZWFkeSBoYXZlIGEgMXgxIGltYWdlLCBvciBpZiB3ZSByZWFjaCB0aGUgbWF4TGV2ZWwgKHJlY2FsbCBtYXhMZXZlbD09PS0xIG1lYW5zIG5vIG1heGltdW0gbGV2ZWwpXHJcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bm1vZGlmaWVkLWxvb3AtY29uZGl0aW9uXHJcbiAgICAgIHdoaWxlICggKCBtaXBtYXBzLmxlbmd0aCAtIDEgPCBtYXhMZXZlbCB8fCBtYXhMZXZlbCA8IDAgKSAmJiAoIGZpbmVzdE1pcG1hcCgpLndpZHRoID4gMSB8fCBmaW5lc3RNaXBtYXAoKS5oZWlnaHQgPiAxICkgKSB7XHJcbiAgICAgICAgY29uc3QgbGV2ZWwgPSBtaXBtYXBzLmxlbmd0aDtcclxuICAgICAgICBtaXBtYXBzLnB1c2goIG1pcG1hcERvd25zY2FsZSggZmluZXN0TWlwbWFwKCksICggd2lkdGgsIGhlaWdodCApID0+IHtcclxuICAgICAgICAgIHJldHVybiBCdWZmZXIuYWxsb2MoIDQgKiB3aWR0aCAqIGhlaWdodCApO1xyXG4gICAgICAgIH0gKSApO1xyXG4gICAgICAgIGVuY29kZUxldmVsKCBsZXZlbCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBqdXN0IGluIGNhc2UgZXZlcnl0aGluZyBoYXBwZW5lZCBzeW5jaHJvbm91c2x5XHJcbiAgICAgIGlmICggLS1lbmNvZGVDb3VudGVyID09PSAwICkge1xyXG4gICAgICAgIGVuY29kaW5nQ29tcGxldGUoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0gKTtcclxufTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUdBLE1BQU1BLEVBQUUsR0FBR0MsT0FBTyxDQUFFLElBQUssQ0FBQztBQUMxQixNQUFNQyxLQUFLLEdBQUdELE9BQU8sQ0FBRSxPQUFRLENBQUM7QUFDaEMsTUFBTUUsSUFBSSxHQUFHRixPQUFPLENBQUUsU0FBVSxDQUFDLENBQUMsQ0FBQztBQUNuQyxNQUFNRyxlQUFlLEdBQUdILE9BQU8sQ0FBRSw0Q0FBNkMsQ0FBQztB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