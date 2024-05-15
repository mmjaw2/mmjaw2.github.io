// Copyright 2023, University of Colorado Boulder

/**
 * Add content to file.
 *
 * @author Liam Mulhall <liammulh@gmail.com>
 */

import { writeFileSync } from 'node:fs';

/**
 * Append the given content to the file.
 *
 * @param {String} pathToFile - path to the file you want to append to
 * @param {String} content - content you want to add to the file
 */
const appendToFile = (pathToFile, content) => {
  writeFileSync(pathToFile, content, {
    encoding: 'utf-8',
    flag: 'a'
  });
};
export default appendToFile;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ3cml0ZUZpbGVTeW5jIiwiYXBwZW5kVG9GaWxlIiwicGF0aFRvRmlsZSIsImNvbnRlbnQiLCJlbmNvZGluZyIsImZsYWciXSwic291cmNlcyI6WyJhcHBlbmQtdG8tZmlsZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQWRkIGNvbnRlbnQgdG8gZmlsZS5cclxuICpcclxuICogQGF1dGhvciBMaWFtIE11bGhhbGwgPGxpYW1tdWxoQGdtYWlsLmNvbT5cclxuICovXHJcblxyXG5pbXBvcnQgeyB3cml0ZUZpbGVTeW5jIH0gZnJvbSAnbm9kZTpmcyc7XHJcblxyXG4vKipcclxuICogQXBwZW5kIHRoZSBnaXZlbiBjb250ZW50IHRvIHRoZSBmaWxlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aFRvRmlsZSAtIHBhdGggdG8gdGhlIGZpbGUgeW91IHdhbnQgdG8gYXBwZW5kIHRvXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBjb250ZW50IC0gY29udGVudCB5b3Ugd2FudCB0byBhZGQgdG8gdGhlIGZpbGVcclxuICovXHJcbmNvbnN0IGFwcGVuZFRvRmlsZSA9ICggcGF0aFRvRmlsZSwgY29udGVudCApID0+IHtcclxuICB3cml0ZUZpbGVTeW5jKCBwYXRoVG9GaWxlLCBjb250ZW50LCB7IGVuY29kaW5nOiAndXRmLTgnLCBmbGFnOiAnYScgfSApO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXBwZW5kVG9GaWxlOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxTQUFTQSxhQUFhLFFBQVEsU0FBUzs7QUFFdkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTUMsWUFBWSxHQUFHQSxDQUFFQyxVQUFVLEVBQUVDLE9BQU8sS0FBTTtFQUM5Q0gsYUFBYSxDQUFFRSxVQUFVLEVBQUVDLE9BQU8sRUFBRTtJQUFFQyxRQUFRLEVBQUUsT0FBTztJQUFFQyxJQUFJLEVBQUU7RUFBSSxDQUFFLENBQUM7QUFDeEUsQ0FBQztBQUVELGVBQWVKLFlBQVkiLCJpZ25vcmVMaXN0IjpbXX0=