// Copyright 2022-2024, University of Colorado Boulder

/**
 * Similar to DerivedProperty, but restricted to one Property and provides value-mapped and bidirectional support.
 * It's basically a DynamicProperty where you don't need to wrap it in an additional Property, and is typed a bit easier
 *
 * For example:
 *
 * const stringProperty = new Property<string>( 'hello' );
 * const lengthProperty = new MappedProperty( stringProperty, {
 *   map: ( str: string ) => str.length
 * } );
 * lengthProperty.value; // 5
 * stringProperty.value = 'hi';
 * lengthProperty.value; // 2
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import axon from './axon.js';
import DynamicProperty from './DynamicProperty.js';
import TinyProperty from './TinyProperty.js';
export default class MappedProperty extends DynamicProperty {
  constructor(property, providedOptions) {
    super(new TinyProperty(property), providedOptions);
  }
}
axon.register('MappedProperty', MappedProperty);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJheG9uIiwiRHluYW1pY1Byb3BlcnR5IiwiVGlueVByb3BlcnR5IiwiTWFwcGVkUHJvcGVydHkiLCJjb25zdHJ1Y3RvciIsInByb3BlcnR5IiwicHJvdmlkZWRPcHRpb25zIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJNYXBwZWRQcm9wZXJ0eS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBTaW1pbGFyIHRvIERlcml2ZWRQcm9wZXJ0eSwgYnV0IHJlc3RyaWN0ZWQgdG8gb25lIFByb3BlcnR5IGFuZCBwcm92aWRlcyB2YWx1ZS1tYXBwZWQgYW5kIGJpZGlyZWN0aW9uYWwgc3VwcG9ydC5cclxuICogSXQncyBiYXNpY2FsbHkgYSBEeW5hbWljUHJvcGVydHkgd2hlcmUgeW91IGRvbid0IG5lZWQgdG8gd3JhcCBpdCBpbiBhbiBhZGRpdGlvbmFsIFByb3BlcnR5LCBhbmQgaXMgdHlwZWQgYSBiaXQgZWFzaWVyXHJcbiAqXHJcbiAqIEZvciBleGFtcGxlOlxyXG4gKlxyXG4gKiBjb25zdCBzdHJpbmdQcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eTxzdHJpbmc+KCAnaGVsbG8nICk7XHJcbiAqIGNvbnN0IGxlbmd0aFByb3BlcnR5ID0gbmV3IE1hcHBlZFByb3BlcnR5KCBzdHJpbmdQcm9wZXJ0eSwge1xyXG4gKiAgIG1hcDogKCBzdHI6IHN0cmluZyApID0+IHN0ci5sZW5ndGhcclxuICogfSApO1xyXG4gKiBsZW5ndGhQcm9wZXJ0eS52YWx1ZTsgLy8gNVxyXG4gKiBzdHJpbmdQcm9wZXJ0eS52YWx1ZSA9ICdoaSc7XHJcbiAqIGxlbmd0aFByb3BlcnR5LnZhbHVlOyAvLyAyXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICovXHJcblxyXG5pbXBvcnQgS2V5c01hdGNoaW5nIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9LZXlzTWF0Y2hpbmcuanMnO1xyXG5pbXBvcnQgU3RyaWN0T21pdCBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvU3RyaWN0T21pdC5qcyc7XHJcbmltcG9ydCBheG9uIGZyb20gJy4vYXhvbi5qcyc7XHJcbmltcG9ydCBUUmVhZE9ubHlQcm9wZXJ0eSBmcm9tICcuL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IER5bmFtaWNQcm9wZXJ0eSwgeyBEeW5hbWljUHJvcGVydHlPcHRpb25zIH0gZnJvbSAnLi9EeW5hbWljUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgVGlueVByb3BlcnR5IGZyb20gJy4vVGlueVByb3BlcnR5LmpzJztcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnM8VGhpc1ZhbHVlVHlwZSwgSW5wdXRWYWx1ZVR5cGU+ID0ge1xyXG4gIC8vIElmIHNldCB0byB0cnVlIHRoZW4gY2hhbmdlcyB0byB0aGlzIFByb3BlcnR5IChpZiB2YWx1ZVByb3BlcnR5UHJvcGVydHkudmFsdWUgaXMgbm9uLW51bGwgYXQgdGhlIHRpbWUpIHdpbGwgYWxzbyBiZVxyXG4gIC8vIG1hZGUgdG8gdmFsdWVQcm9wZXJ0eVByb3BlcnR5LnZhbHVlLlxyXG4gIGJpZGlyZWN0aW9uYWw/OiBib29sZWFuO1xyXG5cclxuICAvLyBNYXBzIG91ciBpbnB1dCBQcm9wZXJ0eSB2YWx1ZSB0by9mcm9tIHRoaXMgUHJvcGVydHkncyB2YWx1ZS4gU2VlIHRvcC1sZXZlbCBkb2N1bWVudGF0aW9uIGZvciB1c2FnZS5cclxuICAvLyBJZiBpdCdzIGEgc3RyaW5nLCBpdCB3aWxsIGdyYWIgdGhhdCBuYW1lZCBwcm9wZXJ0eSBvdXQgKGUuZy4gaXQncyBsaWtlIHBhc3NpbmcgdSA9PiB1WyBkZXJpdmUgXSlcclxuICBtYXA/OiAoICggaW5wdXRWYWx1ZTogSW5wdXRWYWx1ZVR5cGUgKSA9PiBUaGlzVmFsdWVUeXBlICkgfCBLZXlzTWF0Y2hpbmc8SW5wdXRWYWx1ZVR5cGUsIFRoaXNWYWx1ZVR5cGU+O1xyXG4gIGludmVyc2VNYXA/OiAoICggdGhpc1ZhbHVlOiBUaGlzVmFsdWVUeXBlICkgPT4gSW5wdXRWYWx1ZVR5cGUgKSB8IEtleXNNYXRjaGluZzxUaGlzVmFsdWVUeXBlLCBJbnB1dFZhbHVlVHlwZT47XHJcbn07XHJcblxyXG50eXBlIFN1cGVyT3B0aW9uczxUaGlzVmFsdWVUeXBlLCBJbnB1dFZhbHVlVHlwZT4gPSBTdHJpY3RPbWl0PER5bmFtaWNQcm9wZXJ0eU9wdGlvbnM8VGhpc1ZhbHVlVHlwZSwgSW5wdXRWYWx1ZVR5cGUsIFRSZWFkT25seVByb3BlcnR5PElucHV0VmFsdWVUeXBlPj4sICdkZWZhdWx0VmFsdWUnIHwgJ2Rlcml2ZSc+O1xyXG5cclxuZXhwb3J0IHR5cGUgTWFwcGVkUHJvcGVydHlPcHRpb25zPFRoaXNWYWx1ZVR5cGUsIElucHV0VmFsdWVUeXBlPiA9IFNlbGZPcHRpb25zPFRoaXNWYWx1ZVR5cGUsIElucHV0VmFsdWVUeXBlPiAmIFN1cGVyT3B0aW9uczxUaGlzVmFsdWVUeXBlLCBJbnB1dFZhbHVlVHlwZT47XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNYXBwZWRQcm9wZXJ0eTxUaGlzVmFsdWVUeXBlLCBJbnB1dFZhbHVlVHlwZT4gZXh0ZW5kcyBEeW5hbWljUHJvcGVydHk8VGhpc1ZhbHVlVHlwZSwgSW5wdXRWYWx1ZVR5cGUsIFRSZWFkT25seVByb3BlcnR5PElucHV0VmFsdWVUeXBlPj4ge1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggcHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PElucHV0VmFsdWVUeXBlPiwgcHJvdmlkZWRPcHRpb25zPzogTWFwcGVkUHJvcGVydHlPcHRpb25zPFRoaXNWYWx1ZVR5cGUsIElucHV0VmFsdWVUeXBlPiApIHtcclxuICAgIHN1cGVyKCBuZXcgVGlueVByb3BlcnR5KCBwcm9wZXJ0eSApLCBwcm92aWRlZE9wdGlvbnMgKTtcclxuICB9XHJcbn1cclxuXHJcbmF4b24ucmVnaXN0ZXIoICdNYXBwZWRQcm9wZXJ0eScsIE1hcHBlZFByb3BlcnR5ICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFJQSxPQUFPQSxJQUFJLE1BQU0sV0FBVztBQUU1QixPQUFPQyxlQUFlLE1BQWtDLHNCQUFzQjtBQUM5RSxPQUFPQyxZQUFZLE1BQU0sbUJBQW1CO0FBaUI1QyxlQUFlLE1BQU1DLGNBQWMsU0FBd0NGLGVBQWUsQ0FBbUU7RUFDcEpHLFdBQVdBLENBQUVDLFFBQTJDLEVBQUVDLGVBQXNFLEVBQUc7SUFDeEksS0FBSyxDQUFFLElBQUlKLFlBQVksQ0FBRUcsUUFBUyxDQUFDLEVBQUVDLGVBQWdCLENBQUM7RUFDeEQ7QUFDRjtBQUVBTixJQUFJLENBQUNPLFFBQVEsQ0FBRSxnQkFBZ0IsRUFBRUosY0FBZSxDQUFDIiwiaWdub3JlTGlzdCI6W119