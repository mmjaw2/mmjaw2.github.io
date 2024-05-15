// Copyright 2023-2024, University of Colorado Boulder

/**
 * A set of utility constants and functions for working with the english keys PhET has defined in
 * EnglishStringToCodeMap.ts.
 *
 * This is a separate file from EnglishStringToCodeMap.ts and KeyboardUtils.ts to avoid circular dependencies.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

const ARROW_KEYS = ['arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown'];
const MOVEMENT_KEYS = [...ARROW_KEYS, 'w', 'a', 's', 'd'];
const RANGE_KEYS = [...ARROW_KEYS, 'pageUp', 'pageDown', 'end', 'home'];
const NUMBER_KEYS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const EnglishStringKeyUtils = {
  ARROW_KEYS: ARROW_KEYS,
  MOVEMENT_KEYS: MOVEMENT_KEYS,
  RANGE_KEYS: RANGE_KEYS,
  NUMBER_KEYS: NUMBER_KEYS,
  /**
   * Returns true if the key maps to an arrow key. This is an EnglishStringToCodeMap key, NOT a KeyboardEvent.code.
   */
  isArrowKey(key) {
    return ARROW_KEYS.includes(key);
  },
  /**
   * Returns true if the provided key maps to a typical "movement" key, using arrow and WASD keys. This is
   * an EnglishStringToCodeMap key, NOT a KeyboardEvent.code.
   */
  isMovementKey(key) {
    return MOVEMENT_KEYS.includes(key);
  },
  /**
   * Returns true if the key maps to a key used with "range" type input (like a slider). Provided key
   * should be one of EnglishStringToCodeMap's keys, NOT a KeyboardEvent.code.
   */
  isRangeKey(key) {
    return RANGE_KEYS.includes(key);
  },
  /**
   * Returns true if the key is a number key. Provided key should be one of EnglishStringToCodeMap's keys, NOT a
   * KeyboardEvent.code.
   */
  isNumberKey(key) {
    return NUMBER_KEYS.includes(key);
  }
};
export default EnglishStringKeyUtils;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJBUlJPV19LRVlTIiwiTU9WRU1FTlRfS0VZUyIsIlJBTkdFX0tFWVMiLCJOVU1CRVJfS0VZUyIsIkVuZ2xpc2hTdHJpbmdLZXlVdGlscyIsImlzQXJyb3dLZXkiLCJrZXkiLCJpbmNsdWRlcyIsImlzTW92ZW1lbnRLZXkiLCJpc1JhbmdlS2V5IiwiaXNOdW1iZXJLZXkiXSwic291cmNlcyI6WyJFbmdsaXNoU3RyaW5nS2V5VXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjMtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBzZXQgb2YgdXRpbGl0eSBjb25zdGFudHMgYW5kIGZ1bmN0aW9ucyBmb3Igd29ya2luZyB3aXRoIHRoZSBlbmdsaXNoIGtleXMgUGhFVCBoYXMgZGVmaW5lZCBpblxyXG4gKiBFbmdsaXNoU3RyaW5nVG9Db2RlTWFwLnRzLlxyXG4gKlxyXG4gKiBUaGlzIGlzIGEgc2VwYXJhdGUgZmlsZSBmcm9tIEVuZ2xpc2hTdHJpbmdUb0NvZGVNYXAudHMgYW5kIEtleWJvYXJkVXRpbHMudHMgdG8gYXZvaWQgY2lyY3VsYXIgZGVwZW5kZW5jaWVzLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgeyBFbmdsaXNoS2V5IH0gZnJvbSAnLi9FbmdsaXNoU3RyaW5nVG9Db2RlTWFwLmpzJztcclxuXHJcbmNvbnN0IEFSUk9XX0tFWVM6IEVuZ2xpc2hLZXlbXSA9IFsgJ2Fycm93TGVmdCcsICdhcnJvd1JpZ2h0JywgJ2Fycm93VXAnLCAnYXJyb3dEb3duJyBdO1xyXG5jb25zdCBNT1ZFTUVOVF9LRVlTOiBFbmdsaXNoS2V5W10gPSBbIC4uLkFSUk9XX0tFWVMsICd3JywgJ2EnLCAncycsICdkJyBdO1xyXG5jb25zdCBSQU5HRV9LRVlTOiBFbmdsaXNoS2V5W10gPSBbIC4uLkFSUk9XX0tFWVMsICdwYWdlVXAnLCAncGFnZURvd24nLCAnZW5kJywgJ2hvbWUnIF07XHJcbmNvbnN0IE5VTUJFUl9LRVlTOiBFbmdsaXNoS2V5W10gPSBbIDAsIDEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDkgXTtcclxuXHJcbmNvbnN0IEVuZ2xpc2hTdHJpbmdLZXlVdGlscyA9IHtcclxuXHJcbiAgQVJST1dfS0VZUzogQVJST1dfS0VZUyxcclxuICBNT1ZFTUVOVF9LRVlTOiBNT1ZFTUVOVF9LRVlTLFxyXG4gIFJBTkdFX0tFWVM6IFJBTkdFX0tFWVMsXHJcbiAgTlVNQkVSX0tFWVM6IE5VTUJFUl9LRVlTLFxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIGtleSBtYXBzIHRvIGFuIGFycm93IGtleS4gVGhpcyBpcyBhbiBFbmdsaXNoU3RyaW5nVG9Db2RlTWFwIGtleSwgTk9UIGEgS2V5Ym9hcmRFdmVudC5jb2RlLlxyXG4gICAqL1xyXG4gIGlzQXJyb3dLZXkoIGtleTogRW5nbGlzaEtleSApOiBib29sZWFuIHtcclxuICAgIHJldHVybiBBUlJPV19LRVlTLmluY2x1ZGVzKCBrZXkgKTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIHByb3ZpZGVkIGtleSBtYXBzIHRvIGEgdHlwaWNhbCBcIm1vdmVtZW50XCIga2V5LCB1c2luZyBhcnJvdyBhbmQgV0FTRCBrZXlzLiBUaGlzIGlzXHJcbiAgICogYW4gRW5nbGlzaFN0cmluZ1RvQ29kZU1hcCBrZXksIE5PVCBhIEtleWJvYXJkRXZlbnQuY29kZS5cclxuICAgKi9cclxuICBpc01vdmVtZW50S2V5KCBrZXk6IEVuZ2xpc2hLZXkgKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gTU9WRU1FTlRfS0VZUy5pbmNsdWRlcygga2V5ICk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBrZXkgbWFwcyB0byBhIGtleSB1c2VkIHdpdGggXCJyYW5nZVwiIHR5cGUgaW5wdXQgKGxpa2UgYSBzbGlkZXIpLiBQcm92aWRlZCBrZXlcclxuICAgKiBzaG91bGQgYmUgb25lIG9mIEVuZ2xpc2hTdHJpbmdUb0NvZGVNYXAncyBrZXlzLCBOT1QgYSBLZXlib2FyZEV2ZW50LmNvZGUuXHJcbiAgICovXHJcbiAgaXNSYW5nZUtleSgga2V5OiBFbmdsaXNoS2V5ICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIFJBTkdFX0tFWVMuaW5jbHVkZXMoIGtleSApO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUga2V5IGlzIGEgbnVtYmVyIGtleS4gUHJvdmlkZWQga2V5IHNob3VsZCBiZSBvbmUgb2YgRW5nbGlzaFN0cmluZ1RvQ29kZU1hcCdzIGtleXMsIE5PVCBhXHJcbiAgICogS2V5Ym9hcmRFdmVudC5jb2RlLlxyXG4gICAqL1xyXG4gIGlzTnVtYmVyS2V5KCBrZXk6IEVuZ2xpc2hLZXkgKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gTlVNQkVSX0tFWVMuaW5jbHVkZXMoIGtleSApO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IEVuZ2xpc2hTdHJpbmdLZXlVdGlsczsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBSUEsTUFBTUEsVUFBd0IsR0FBRyxDQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBRTtBQUN0RixNQUFNQyxhQUEyQixHQUFHLENBQUUsR0FBR0QsVUFBVSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBRTtBQUN6RSxNQUFNRSxVQUF3QixHQUFHLENBQUUsR0FBR0YsVUFBVSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBRTtBQUN2RixNQUFNRyxXQUF5QixHQUFHLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFO0FBRWxFLE1BQU1DLHFCQUFxQixHQUFHO0VBRTVCSixVQUFVLEVBQUVBLFVBQVU7RUFDdEJDLGFBQWEsRUFBRUEsYUFBYTtFQUM1QkMsVUFBVSxFQUFFQSxVQUFVO0VBQ3RCQyxXQUFXLEVBQUVBLFdBQVc7RUFFeEI7QUFDRjtBQUNBO0VBQ0VFLFVBQVVBLENBQUVDLEdBQWUsRUFBWTtJQUNyQyxPQUFPTixVQUFVLENBQUNPLFFBQVEsQ0FBRUQsR0FBSSxDQUFDO0VBQ25DLENBQUM7RUFFRDtBQUNGO0FBQ0E7QUFDQTtFQUNFRSxhQUFhQSxDQUFFRixHQUFlLEVBQVk7SUFDeEMsT0FBT0wsYUFBYSxDQUFDTSxRQUFRLENBQUVELEdBQUksQ0FBQztFQUN0QyxDQUFDO0VBRUQ7QUFDRjtBQUNBO0FBQ0E7RUFDRUcsVUFBVUEsQ0FBRUgsR0FBZSxFQUFZO0lBQ3JDLE9BQU9KLFVBQVUsQ0FBQ0ssUUFBUSxDQUFFRCxHQUFJLENBQUM7RUFDbkMsQ0FBQztFQUVEO0FBQ0Y7QUFDQTtBQUNBO0VBQ0VJLFdBQVdBLENBQUVKLEdBQWUsRUFBWTtJQUN0QyxPQUFPSCxXQUFXLENBQUNJLFFBQVEsQ0FBRUQsR0FBSSxDQUFDO0VBQ3BDO0FBQ0YsQ0FBQztBQUVELGVBQWVGLHFCQUFxQiIsImlnbm9yZUxpc3QiOltdfQ==