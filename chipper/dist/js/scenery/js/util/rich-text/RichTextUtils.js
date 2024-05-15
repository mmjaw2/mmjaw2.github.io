// Copyright 2023-2024, University of Colorado Boulder

/**
 * Utilities and globals to support RichText
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
import { scenery, Text } from '../../imports.js';

// Types for Himalaya

export const isHimalayaElementNode = node => node.type.toLowerCase() === 'element';
export const isHimalayaTextNode = node => node.type.toLowerCase() === 'text';
const RichTextUtils = {
  // We need to do some font-size tests, so we have a Text for that.
  scratchText: new Text(''),
  // Get the attribute value from an element. Return null if that attribute isn't on the element.
  himalayaGetAttribute(attribute, element) {
    if (!element) {
      return null;
    }
    const attributeObject = _.find(element.attributes, x => x.key === attribute);
    if (!attributeObject) {
      return null;
    }
    return attributeObject.value || null;
  },
  // Turn a string of style like "font-sie:6; font-weight:6; favorite-number:6" into a may of style key/values (trimmed of whitespace)
  himalayaStyleStringToMap(styleString) {
    const styleElements = styleString.split(';');
    const styleMap = {};
    styleElements.forEach(styleKeyValue => {
      if (styleKeyValue.length > 0) {
        const keyValueTuple = styleKeyValue.split(':');
        assert && assert(keyValueTuple.length === 2, 'too many colons');
        styleMap[keyValueTuple[0].trim()] = keyValueTuple[1].trim();
      }
    });
    return styleMap;
  }
};
export default RichTextUtils;
scenery.register('RichTextUtils', RichTextUtils);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJzY2VuZXJ5IiwiVGV4dCIsImlzSGltYWxheWFFbGVtZW50Tm9kZSIsIm5vZGUiLCJ0eXBlIiwidG9Mb3dlckNhc2UiLCJpc0hpbWFsYXlhVGV4dE5vZGUiLCJSaWNoVGV4dFV0aWxzIiwic2NyYXRjaFRleHQiLCJoaW1hbGF5YUdldEF0dHJpYnV0ZSIsImF0dHJpYnV0ZSIsImVsZW1lbnQiLCJhdHRyaWJ1dGVPYmplY3QiLCJfIiwiZmluZCIsImF0dHJpYnV0ZXMiLCJ4Iiwia2V5IiwidmFsdWUiLCJoaW1hbGF5YVN0eWxlU3RyaW5nVG9NYXAiLCJzdHlsZVN0cmluZyIsInN0eWxlRWxlbWVudHMiLCJzcGxpdCIsInN0eWxlTWFwIiwiZm9yRWFjaCIsInN0eWxlS2V5VmFsdWUiLCJsZW5ndGgiLCJrZXlWYWx1ZVR1cGxlIiwiYXNzZXJ0IiwidHJpbSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiUmljaFRleHRVdGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMy0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBVdGlsaXRpZXMgYW5kIGdsb2JhbHMgdG8gc3VwcG9ydCBSaWNoVGV4dFxyXG4gKlxyXG4gKiBAYXV0aG9yIEpvbmF0aGFuIE9sc29uIDxqb25hdGhhbi5vbHNvbkBjb2xvcmFkby5lZHU+XHJcbiAqL1xyXG5pbXBvcnQgeyBzY2VuZXJ5LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW1wb3J0cy5qcyc7XHJcblxyXG4vLyBUeXBlcyBmb3IgSGltYWxheWFcclxuZXhwb3J0IHR5cGUgSGltYWxheWFBdHRyaWJ1dGUgPSB7XHJcbiAga2V5OiBzdHJpbmc7XHJcbiAgdmFsdWU/OiBzdHJpbmc7XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBIaW1hbGF5YU5vZGUgPSB7XHJcbiAgdHlwZTogJ2VsZW1lbnQnIHwgJ2NvbW1lbnQnIHwgJ3RleHQnO1xyXG4gIGlubmVyQ29udGVudDogc3RyaW5nO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgSGltYWxheWFFbGVtZW50Tm9kZSA9IHtcclxuICB0eXBlOiAnZWxlbWVudCc7XHJcbiAgdGFnTmFtZTogc3RyaW5nO1xyXG4gIGNoaWxkcmVuOiBIaW1hbGF5YU5vZGVbXTtcclxuICBhdHRyaWJ1dGVzOiBIaW1hbGF5YUF0dHJpYnV0ZVtdO1xyXG4gIGlubmVyQ29udGVudD86IHN0cmluZzsgLy8gSXMgdGhpcyBpbiB0aGUgZ2VuZXJhdGVkIHN0dWZmPyBEbyB3ZSBqdXN0IG92ZXJyaWRlIHRoaXM/IFVuY2xlYXJcclxufSAmIEhpbWFsYXlhTm9kZTtcclxuXHJcbmV4cG9ydCBjb25zdCBpc0hpbWFsYXlhRWxlbWVudE5vZGUgPSAoIG5vZGU6IEhpbWFsYXlhTm9kZSApOiBub2RlIGlzIEhpbWFsYXlhRWxlbWVudE5vZGUgPT4gbm9kZS50eXBlLnRvTG93ZXJDYXNlKCkgPT09ICdlbGVtZW50JztcclxuXHJcbmV4cG9ydCB0eXBlIEhpbWFsYXlhVGV4dE5vZGUgPSB7XHJcbiAgdHlwZTogJ3RleHQnO1xyXG4gIGNvbnRlbnQ6IHN0cmluZztcclxufSAmIEhpbWFsYXlhTm9kZTtcclxuXHJcbmV4cG9ydCBjb25zdCBpc0hpbWFsYXlhVGV4dE5vZGUgPSAoIG5vZGU6IEhpbWFsYXlhTm9kZSApOiBub2RlIGlzIEhpbWFsYXlhVGV4dE5vZGUgPT4gbm9kZS50eXBlLnRvTG93ZXJDYXNlKCkgPT09ICd0ZXh0JztcclxuXHJcbmNvbnN0IFJpY2hUZXh0VXRpbHMgPSB7XHJcbiAgLy8gV2UgbmVlZCB0byBkbyBzb21lIGZvbnQtc2l6ZSB0ZXN0cywgc28gd2UgaGF2ZSBhIFRleHQgZm9yIHRoYXQuXHJcbiAgc2NyYXRjaFRleHQ6IG5ldyBUZXh0KCAnJyApLFxyXG5cclxuICAvLyBHZXQgdGhlIGF0dHJpYnV0ZSB2YWx1ZSBmcm9tIGFuIGVsZW1lbnQuIFJldHVybiBudWxsIGlmIHRoYXQgYXR0cmlidXRlIGlzbid0IG9uIHRoZSBlbGVtZW50LlxyXG4gIGhpbWFsYXlhR2V0QXR0cmlidXRlKCBhdHRyaWJ1dGU6IHN0cmluZywgZWxlbWVudDogSGltYWxheWFFbGVtZW50Tm9kZSB8IG51bGwgKTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgICBpZiAoICFlbGVtZW50ICkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIGNvbnN0IGF0dHJpYnV0ZU9iamVjdCA9IF8uZmluZCggZWxlbWVudC5hdHRyaWJ1dGVzLCB4ID0+IHgua2V5ID09PSBhdHRyaWJ1dGUgKTtcclxuICAgIGlmICggIWF0dHJpYnV0ZU9iamVjdCApIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXR0cmlidXRlT2JqZWN0LnZhbHVlIHx8IG51bGw7XHJcbiAgfSxcclxuXHJcbiAgLy8gVHVybiBhIHN0cmluZyBvZiBzdHlsZSBsaWtlIFwiZm9udC1zaWU6NjsgZm9udC13ZWlnaHQ6NjsgZmF2b3JpdGUtbnVtYmVyOjZcIiBpbnRvIGEgbWF5IG9mIHN0eWxlIGtleS92YWx1ZXMgKHRyaW1tZWQgb2Ygd2hpdGVzcGFjZSlcclxuICBoaW1hbGF5YVN0eWxlU3RyaW5nVG9NYXAoIHN0eWxlU3RyaW5nOiBzdHJpbmcgKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XHJcbiAgICBjb25zdCBzdHlsZUVsZW1lbnRzID0gc3R5bGVTdHJpbmcuc3BsaXQoICc7JyApO1xyXG4gICAgY29uc3Qgc3R5bGVNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcclxuICAgIHN0eWxlRWxlbWVudHMuZm9yRWFjaCggc3R5bGVLZXlWYWx1ZSA9PiB7XHJcbiAgICAgIGlmICggc3R5bGVLZXlWYWx1ZS5sZW5ndGggPiAwICkge1xyXG4gICAgICAgIGNvbnN0IGtleVZhbHVlVHVwbGUgPSBzdHlsZUtleVZhbHVlLnNwbGl0KCAnOicgKTtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBrZXlWYWx1ZVR1cGxlLmxlbmd0aCA9PT0gMiwgJ3RvbyBtYW55IGNvbG9ucycgKTtcclxuICAgICAgICBzdHlsZU1hcFsga2V5VmFsdWVUdXBsZVsgMCBdLnRyaW0oKSBdID0ga2V5VmFsdWVUdXBsZVsgMSBdLnRyaW0oKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gICAgcmV0dXJuIHN0eWxlTWFwO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFJpY2hUZXh0VXRpbHM7XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnUmljaFRleHRVdGlscycsIFJpY2hUZXh0VXRpbHMgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTQSxPQUFPLEVBQUVDLElBQUksUUFBUSxrQkFBa0I7O0FBRWhEOztBQW1CQSxPQUFPLE1BQU1DLHFCQUFxQixHQUFLQyxJQUFrQixJQUFtQ0EsSUFBSSxDQUFDQyxJQUFJLENBQUNDLFdBQVcsQ0FBQyxDQUFDLEtBQUssU0FBUztBQU9qSSxPQUFPLE1BQU1DLGtCQUFrQixHQUFLSCxJQUFrQixJQUFnQ0EsSUFBSSxDQUFDQyxJQUFJLENBQUNDLFdBQVcsQ0FBQyxDQUFDLEtBQUssTUFBTTtBQUV4SCxNQUFNRSxhQUFhLEdBQUc7RUFDcEI7RUFDQUMsV0FBVyxFQUFFLElBQUlQLElBQUksQ0FBRSxFQUFHLENBQUM7RUFFM0I7RUFDQVEsb0JBQW9CQSxDQUFFQyxTQUFpQixFQUFFQyxPQUFtQyxFQUFrQjtJQUM1RixJQUFLLENBQUNBLE9BQU8sRUFBRztNQUNkLE9BQU8sSUFBSTtJQUNiO0lBQ0EsTUFBTUMsZUFBZSxHQUFHQyxDQUFDLENBQUNDLElBQUksQ0FBRUgsT0FBTyxDQUFDSSxVQUFVLEVBQUVDLENBQUMsSUFBSUEsQ0FBQyxDQUFDQyxHQUFHLEtBQUtQLFNBQVUsQ0FBQztJQUM5RSxJQUFLLENBQUNFLGVBQWUsRUFBRztNQUN0QixPQUFPLElBQUk7SUFDYjtJQUNBLE9BQU9BLGVBQWUsQ0FBQ00sS0FBSyxJQUFJLElBQUk7RUFDdEMsQ0FBQztFQUVEO0VBQ0FDLHdCQUF3QkEsQ0FBRUMsV0FBbUIsRUFBMkI7SUFDdEUsTUFBTUMsYUFBYSxHQUFHRCxXQUFXLENBQUNFLEtBQUssQ0FBRSxHQUFJLENBQUM7SUFDOUMsTUFBTUMsUUFBZ0MsR0FBRyxDQUFDLENBQUM7SUFDM0NGLGFBQWEsQ0FBQ0csT0FBTyxDQUFFQyxhQUFhLElBQUk7TUFDdEMsSUFBS0EsYUFBYSxDQUFDQyxNQUFNLEdBQUcsQ0FBQyxFQUFHO1FBQzlCLE1BQU1DLGFBQWEsR0FBR0YsYUFBYSxDQUFDSCxLQUFLLENBQUUsR0FBSSxDQUFDO1FBQ2hETSxNQUFNLElBQUlBLE1BQU0sQ0FBRUQsYUFBYSxDQUFDRCxNQUFNLEtBQUssQ0FBQyxFQUFFLGlCQUFrQixDQUFDO1FBQ2pFSCxRQUFRLENBQUVJLGFBQWEsQ0FBRSxDQUFDLENBQUUsQ0FBQ0UsSUFBSSxDQUFDLENBQUMsQ0FBRSxHQUFHRixhQUFhLENBQUUsQ0FBQyxDQUFFLENBQUNFLElBQUksQ0FBQyxDQUFDO01BQ25FO0lBQ0YsQ0FBRSxDQUFDO0lBQ0gsT0FBT04sUUFBUTtFQUNqQjtBQUNGLENBQUM7QUFFRCxlQUFlaEIsYUFBYTtBQUU1QlAsT0FBTyxDQUFDOEIsUUFBUSxDQUFFLGVBQWUsRUFBRXZCLGFBQWMsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==