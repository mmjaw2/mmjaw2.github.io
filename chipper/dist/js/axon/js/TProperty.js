// Copyright 2021-2024, University of Colorado Boulder

import ReadOnlyProperty from './ReadOnlyProperty.js';
import TinyProperty from './TinyProperty.js';

/**
 * A simple Property/TinyProperty like interface
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// See comments in Property.ts / TinyProperty.ts

export function isTProperty(something) {
  return (something instanceof ReadOnlyProperty || something instanceof TinyProperty) && something.isSettable();
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFkT25seVByb3BlcnR5IiwiVGlueVByb3BlcnR5IiwiaXNUUHJvcGVydHkiLCJzb21ldGhpbmciLCJpc1NldHRhYmxlIl0sInNvdXJjZXMiOlsiVFByb3BlcnR5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuaW1wb3J0IFN0cmljdE9taXQgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1N0cmljdE9taXQuanMnO1xyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBSZWFkT25seVByb3BlcnR5IGZyb20gJy4vUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUaW55UHJvcGVydHkgZnJvbSAnLi9UaW55UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgSW50ZW50aW9uYWxBbnkgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL0ludGVudGlvbmFsQW55LmpzJztcclxuXHJcbi8qKlxyXG4gKiBBIHNpbXBsZSBQcm9wZXJ0eS9UaW55UHJvcGVydHkgbGlrZSBpbnRlcmZhY2VcclxuICpcclxuICogQGF1dGhvciBTYW0gUmVpZCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbi8vIFNlZSBjb21tZW50cyBpbiBQcm9wZXJ0eS50cyAvIFRpbnlQcm9wZXJ0eS50c1xyXG50eXBlIFRQcm9wZXJ0eTxUPiA9IFN0cmljdE9taXQ8VFJlYWRPbmx5UHJvcGVydHk8VD4sICd2YWx1ZSc+ICYge1xyXG4gIHNldCggdmFsdWU6IFQgKTogdm9pZDtcclxuICBzZXQgdmFsdWUoIHZhbHVlOiBUICk7XHJcbiAgZ2V0IHZhbHVlKCk6IFQ7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNUUHJvcGVydHk8VCA9IHVua25vd24+KCBzb21ldGhpbmc6IEludGVudGlvbmFsQW55ICk6IHNvbWV0aGluZyBpcyBUUHJvcGVydHk8VD4ge1xyXG4gIHJldHVybiAoIHNvbWV0aGluZyBpbnN0YW5jZW9mIFJlYWRPbmx5UHJvcGVydHkgfHwgc29tZXRoaW5nIGluc3RhbmNlb2YgVGlueVByb3BlcnR5ICkgJiYgc29tZXRoaW5nLmlzU2V0dGFibGUoKTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgVFByb3BlcnR5OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBSUEsT0FBT0EsZ0JBQWdCLE1BQU0sdUJBQXVCO0FBQ3BELE9BQU9DLFlBQVksTUFBTSxtQkFBbUI7O0FBRzVDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFPQSxPQUFPLFNBQVNDLFdBQVdBLENBQWVDLFNBQXlCLEVBQThCO0VBQy9GLE9BQU8sQ0FBRUEsU0FBUyxZQUFZSCxnQkFBZ0IsSUFBSUcsU0FBUyxZQUFZRixZQUFZLEtBQU1FLFNBQVMsQ0FBQ0MsVUFBVSxDQUFDLENBQUM7QUFDakgiLCJpZ25vcmVMaXN0IjpbXX0=