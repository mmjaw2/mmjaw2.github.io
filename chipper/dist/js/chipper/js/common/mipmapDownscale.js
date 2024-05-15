// Copyright 2015-2024, University of Colorado Boulder

/* eslint-env node */

/**
 * Takes in a mipmap object with data/width/height and returns another mipmap object with data/width/height that is
 * downscaled by a factor of 2. Needs to round the width/height up to include all of the image (if it's not a
 * power of 2).
 *
 * mipmap.data should be array-accessible with bytes (typed array, Buffer, etc.)
 *
 * Handles alpha blending of 4 pixels into 1, and does so with the proper gamma corrections so that we only add/blend
 * colors in the linear sRGB colorspace.
 *
 * @param {Object} mipmap - Mipmap object with { data: {Buffer}, width: {number}, height: {number} }
 * @param {function} createData - function( width, height ), creates an array-accessible data container, Buffer
 *                                for Node.js, or presumably a typed array otherwise, with 4*width*height components
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
function mipmapDownscale(mipmap, createData) {
  // array index constants for the channels
  const R = 0;
  const G = 1;
  const B = 2;
  const A = 3;

  // hard-coded gamma (assuming the exponential part of the sRGB curve as a simplification)
  const GAMMA = 2.2;

  // dimension handling for the larger image
  const width = mipmap.width;
  const height = mipmap.height;
  const data = mipmap.data;
  function inside(row, col) {
    return row < height && col < width;
  }

  // grabbing pixel data for a row/col, applying corrections into the [0,1] range.
  function pixel(row, col) {
    if (!inside(row, col)) {
      return [0, 0, 0, 0];
    }
    const index = 4 * (row * width + col);
    return [
    // maps to [0,1]
    Math.pow(data[index + R] / 255, GAMMA),
    // red
    Math.pow(data[index + G] / 255, GAMMA),
    // green
    Math.pow(data[index + B] / 255, GAMMA),
    // blue
    Math.pow(data[index + A] / 255, GAMMA) // alpha
    ];
  }

  // dimension h andling for the smaller downscaled image
  const smallWidth = Math.ceil(width / 2);
  const smallHeight = Math.ceil(height / 2);
  const smallData = createData(smallWidth, smallHeight);
  function smallPixel(row, col) {
    return 4 * (row * smallWidth + col);
  }

  // for each pixel in our downscaled image
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      // Original pixel values for the quadrant
      const p1 = pixel(2 * row, 2 * col); // upper-left
      const p2 = pixel(2 * row, 2 * col + 1); // upper-right
      const p3 = pixel(2 * row + 1, 2 * col); // lower-left
      const p4 = pixel(2 * row + 1, 2 * col + 1); // lower-right
      const output = [0, 0, 0, 0];
      const alphaSum = p1[A] + p2[A] + p3[A] + p4[A];

      // blending of pixels, weighted by alphas
      output[R] = (p1[R] * p1[A] + p2[R] * p2[A] + p3[R] * p3[A] + p4[R] * p4[A]) / alphaSum;
      output[G] = (p1[G] * p1[A] + p2[G] * p2[A] + p3[G] * p3[A] + p4[G] * p4[A]) / alphaSum;
      output[B] = (p1[B] * p1[A] + p2[B] * p2[A] + p3[B] * p3[A] + p4[B] * p4[A]) / alphaSum;
      output[A] = alphaSum / 4; // average of alphas

      // convert back into [0,255] range with reverse corrections, and store in our buffer
      const outputIndex = smallPixel(row, col);
      smallData[outputIndex + R] = Math.floor(Math.pow(output[R], 1 / GAMMA) * 255);
      smallData[outputIndex + G] = Math.floor(Math.pow(output[G], 1 / GAMMA) * 255);
      smallData[outputIndex + B] = Math.floor(Math.pow(output[B], 1 / GAMMA) * 255);
      smallData[outputIndex + A] = Math.floor(Math.pow(output[A], 1 / GAMMA) * 255);
    }
  }
  return {
    data: smallData,
    width: smallWidth,
    height: smallHeight
  };
}
module.exports = mipmapDownscale;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJtaXBtYXBEb3duc2NhbGUiLCJtaXBtYXAiLCJjcmVhdGVEYXRhIiwiUiIsIkciLCJCIiwiQSIsIkdBTU1BIiwid2lkdGgiLCJoZWlnaHQiLCJkYXRhIiwiaW5zaWRlIiwicm93IiwiY29sIiwicGl4ZWwiLCJpbmRleCIsIk1hdGgiLCJwb3ciLCJzbWFsbFdpZHRoIiwiY2VpbCIsInNtYWxsSGVpZ2h0Iiwic21hbGxEYXRhIiwic21hbGxQaXhlbCIsInAxIiwicDIiLCJwMyIsInA0Iiwib3V0cHV0IiwiYWxwaGFTdW0iLCJvdXRwdXRJbmRleCIsImZsb29yIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJzb3VyY2VzIjpbIm1pcG1hcERvd25zY2FsZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNS0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qIGVzbGludC1lbnYgbm9kZSAqL1xyXG5cclxuXHJcbi8qKlxyXG4gKiBUYWtlcyBpbiBhIG1pcG1hcCBvYmplY3Qgd2l0aCBkYXRhL3dpZHRoL2hlaWdodCBhbmQgcmV0dXJucyBhbm90aGVyIG1pcG1hcCBvYmplY3Qgd2l0aCBkYXRhL3dpZHRoL2hlaWdodCB0aGF0IGlzXHJcbiAqIGRvd25zY2FsZWQgYnkgYSBmYWN0b3Igb2YgMi4gTmVlZHMgdG8gcm91bmQgdGhlIHdpZHRoL2hlaWdodCB1cCB0byBpbmNsdWRlIGFsbCBvZiB0aGUgaW1hZ2UgKGlmIGl0J3Mgbm90IGFcclxuICogcG93ZXIgb2YgMikuXHJcbiAqXHJcbiAqIG1pcG1hcC5kYXRhIHNob3VsZCBiZSBhcnJheS1hY2Nlc3NpYmxlIHdpdGggYnl0ZXMgKHR5cGVkIGFycmF5LCBCdWZmZXIsIGV0Yy4pXHJcbiAqXHJcbiAqIEhhbmRsZXMgYWxwaGEgYmxlbmRpbmcgb2YgNCBwaXhlbHMgaW50byAxLCBhbmQgZG9lcyBzbyB3aXRoIHRoZSBwcm9wZXIgZ2FtbWEgY29ycmVjdGlvbnMgc28gdGhhdCB3ZSBvbmx5IGFkZC9ibGVuZFxyXG4gKiBjb2xvcnMgaW4gdGhlIGxpbmVhciBzUkdCIGNvbG9yc3BhY2UuXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBtaXBtYXAgLSBNaXBtYXAgb2JqZWN0IHdpdGggeyBkYXRhOiB7QnVmZmVyfSwgd2lkdGg6IHtudW1iZXJ9LCBoZWlnaHQ6IHtudW1iZXJ9IH1cclxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3JlYXRlRGF0YSAtIGZ1bmN0aW9uKCB3aWR0aCwgaGVpZ2h0ICksIGNyZWF0ZXMgYW4gYXJyYXktYWNjZXNzaWJsZSBkYXRhIGNvbnRhaW5lciwgQnVmZmVyXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgTm9kZS5qcywgb3IgcHJlc3VtYWJseSBhIHR5cGVkIGFycmF5IG90aGVyd2lzZSwgd2l0aCA0KndpZHRoKmhlaWdodCBjb21wb25lbnRzXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcbmZ1bmN0aW9uIG1pcG1hcERvd25zY2FsZSggbWlwbWFwLCBjcmVhdGVEYXRhICkge1xyXG4gIC8vIGFycmF5IGluZGV4IGNvbnN0YW50cyBmb3IgdGhlIGNoYW5uZWxzXHJcbiAgY29uc3QgUiA9IDA7XHJcbiAgY29uc3QgRyA9IDE7XHJcbiAgY29uc3QgQiA9IDI7XHJcbiAgY29uc3QgQSA9IDM7XHJcblxyXG4gIC8vIGhhcmQtY29kZWQgZ2FtbWEgKGFzc3VtaW5nIHRoZSBleHBvbmVudGlhbCBwYXJ0IG9mIHRoZSBzUkdCIGN1cnZlIGFzIGEgc2ltcGxpZmljYXRpb24pXHJcbiAgY29uc3QgR0FNTUEgPSAyLjI7XHJcblxyXG4gIC8vIGRpbWVuc2lvbiBoYW5kbGluZyBmb3IgdGhlIGxhcmdlciBpbWFnZVxyXG4gIGNvbnN0IHdpZHRoID0gbWlwbWFwLndpZHRoO1xyXG4gIGNvbnN0IGhlaWdodCA9IG1pcG1hcC5oZWlnaHQ7XHJcbiAgY29uc3QgZGF0YSA9IG1pcG1hcC5kYXRhO1xyXG5cclxuICBmdW5jdGlvbiBpbnNpZGUoIHJvdywgY29sICkge1xyXG4gICAgcmV0dXJuIHJvdyA8IGhlaWdodCAmJiBjb2wgPCB3aWR0aDtcclxuICB9XHJcblxyXG4gIC8vIGdyYWJiaW5nIHBpeGVsIGRhdGEgZm9yIGEgcm93L2NvbCwgYXBwbHlpbmcgY29ycmVjdGlvbnMgaW50byB0aGUgWzAsMV0gcmFuZ2UuXHJcbiAgZnVuY3Rpb24gcGl4ZWwoIHJvdywgY29sICkge1xyXG4gICAgaWYgKCAhaW5zaWRlKCByb3csIGNvbCApICkge1xyXG4gICAgICByZXR1cm4gWyAwLCAwLCAwLCAwIF07XHJcbiAgICB9XHJcbiAgICBjb25zdCBpbmRleCA9IDQgKiAoIHJvdyAqIHdpZHRoICsgY29sICk7XHJcbiAgICByZXR1cm4gW1xyXG4gICAgICAvLyBtYXBzIHRvIFswLDFdXHJcbiAgICAgIE1hdGgucG93KCBkYXRhWyBpbmRleCArIFIgXSAvIDI1NSwgR0FNTUEgKSwgLy8gcmVkXHJcbiAgICAgIE1hdGgucG93KCBkYXRhWyBpbmRleCArIEcgXSAvIDI1NSwgR0FNTUEgKSwgLy8gZ3JlZW5cclxuICAgICAgTWF0aC5wb3coIGRhdGFbIGluZGV4ICsgQiBdIC8gMjU1LCBHQU1NQSApLCAvLyBibHVlXHJcbiAgICAgIE1hdGgucG93KCBkYXRhWyBpbmRleCArIEEgXSAvIDI1NSwgR0FNTUEgKSAvLyBhbHBoYVxyXG4gICAgXTtcclxuICB9XHJcblxyXG4gIC8vIGRpbWVuc2lvbiBoIGFuZGxpbmcgZm9yIHRoZSBzbWFsbGVyIGRvd25zY2FsZWQgaW1hZ2VcclxuICBjb25zdCBzbWFsbFdpZHRoID0gTWF0aC5jZWlsKCB3aWR0aCAvIDIgKTtcclxuICBjb25zdCBzbWFsbEhlaWdodCA9IE1hdGguY2VpbCggaGVpZ2h0IC8gMiApO1xyXG4gIGNvbnN0IHNtYWxsRGF0YSA9IGNyZWF0ZURhdGEoIHNtYWxsV2lkdGgsIHNtYWxsSGVpZ2h0ICk7XHJcblxyXG4gIGZ1bmN0aW9uIHNtYWxsUGl4ZWwoIHJvdywgY29sICkge1xyXG4gICAgcmV0dXJuIDQgKiAoIHJvdyAqIHNtYWxsV2lkdGggKyBjb2wgKTtcclxuICB9XHJcblxyXG4gIC8vIGZvciBlYWNoIHBpeGVsIGluIG91ciBkb3duc2NhbGVkIGltYWdlXHJcbiAgZm9yICggbGV0IHJvdyA9IDA7IHJvdyA8IGhlaWdodDsgcm93KysgKSB7XHJcbiAgICBmb3IgKCBsZXQgY29sID0gMDsgY29sIDwgd2lkdGg7IGNvbCsrICkge1xyXG4gICAgICAvLyBPcmlnaW5hbCBwaXhlbCB2YWx1ZXMgZm9yIHRoZSBxdWFkcmFudFxyXG4gICAgICBjb25zdCBwMSA9IHBpeGVsKCAyICogcm93LCAyICogY29sICk7IC8vIHVwcGVyLWxlZnRcclxuICAgICAgY29uc3QgcDIgPSBwaXhlbCggMiAqIHJvdywgMiAqIGNvbCArIDEgKTsgLy8gdXBwZXItcmlnaHRcclxuICAgICAgY29uc3QgcDMgPSBwaXhlbCggMiAqIHJvdyArIDEsIDIgKiBjb2wgKTsgLy8gbG93ZXItbGVmdFxyXG4gICAgICBjb25zdCBwNCA9IHBpeGVsKCAyICogcm93ICsgMSwgMiAqIGNvbCArIDEgKTsgLy8gbG93ZXItcmlnaHRcclxuICAgICAgY29uc3Qgb3V0cHV0ID0gWyAwLCAwLCAwLCAwIF07XHJcblxyXG4gICAgICBjb25zdCBhbHBoYVN1bSA9IHAxWyBBIF0gKyBwMlsgQSBdICsgcDNbIEEgXSArIHA0WyBBIF07XHJcblxyXG4gICAgICAvLyBibGVuZGluZyBvZiBwaXhlbHMsIHdlaWdodGVkIGJ5IGFscGhhc1xyXG4gICAgICBvdXRwdXRbIFIgXSA9ICggcDFbIFIgXSAqIHAxWyBBIF0gKyBwMlsgUiBdICogcDJbIEEgXSArIHAzWyBSIF0gKiBwM1sgQSBdICsgcDRbIFIgXSAqIHA0WyBBIF0gKSAvIGFscGhhU3VtO1xyXG4gICAgICBvdXRwdXRbIEcgXSA9ICggcDFbIEcgXSAqIHAxWyBBIF0gKyBwMlsgRyBdICogcDJbIEEgXSArIHAzWyBHIF0gKiBwM1sgQSBdICsgcDRbIEcgXSAqIHA0WyBBIF0gKSAvIGFscGhhU3VtO1xyXG4gICAgICBvdXRwdXRbIEIgXSA9ICggcDFbIEIgXSAqIHAxWyBBIF0gKyBwMlsgQiBdICogcDJbIEEgXSArIHAzWyBCIF0gKiBwM1sgQSBdICsgcDRbIEIgXSAqIHA0WyBBIF0gKSAvIGFscGhhU3VtO1xyXG4gICAgICBvdXRwdXRbIEEgXSA9IGFscGhhU3VtIC8gNDsgLy8gYXZlcmFnZSBvZiBhbHBoYXNcclxuXHJcbiAgICAgIC8vIGNvbnZlcnQgYmFjayBpbnRvIFswLDI1NV0gcmFuZ2Ugd2l0aCByZXZlcnNlIGNvcnJlY3Rpb25zLCBhbmQgc3RvcmUgaW4gb3VyIGJ1ZmZlclxyXG4gICAgICBjb25zdCBvdXRwdXRJbmRleCA9IHNtYWxsUGl4ZWwoIHJvdywgY29sICk7XHJcbiAgICAgIHNtYWxsRGF0YVsgb3V0cHV0SW5kZXggKyBSIF0gPSBNYXRoLmZsb29yKCBNYXRoLnBvdyggb3V0cHV0WyBSIF0sIDEgLyBHQU1NQSApICogMjU1ICk7XHJcbiAgICAgIHNtYWxsRGF0YVsgb3V0cHV0SW5kZXggKyBHIF0gPSBNYXRoLmZsb29yKCBNYXRoLnBvdyggb3V0cHV0WyBHIF0sIDEgLyBHQU1NQSApICogMjU1ICk7XHJcbiAgICAgIHNtYWxsRGF0YVsgb3V0cHV0SW5kZXggKyBCIF0gPSBNYXRoLmZsb29yKCBNYXRoLnBvdyggb3V0cHV0WyBCIF0sIDEgLyBHQU1NQSApICogMjU1ICk7XHJcbiAgICAgIHNtYWxsRGF0YVsgb3V0cHV0SW5kZXggKyBBIF0gPSBNYXRoLmZsb29yKCBNYXRoLnBvdyggb3V0cHV0WyBBIF0sIDEgLyBHQU1NQSApICogMjU1ICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgZGF0YTogc21hbGxEYXRhLFxyXG4gICAgd2lkdGg6IHNtYWxsV2lkdGgsXHJcbiAgICBoZWlnaHQ6IHNtYWxsSGVpZ2h0XHJcbiAgfTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9y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