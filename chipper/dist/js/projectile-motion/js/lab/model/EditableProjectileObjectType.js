// Copyright 2019-2024, University of Colorado Boulder

/**
 * ProjectileObjectType subtype that contains editable (mutable) properties of the projectile type
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import merge from '../../../../phet-core/js/merge.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import IOType from '../../../../tandem/js/types/IOType.js';
import ProjectileObjectType from '../../common/model/ProjectileObjectType.js';
import projectileMotion from '../../projectileMotion.js';
class EditableProjectileObjectType extends ProjectileObjectType {
  /**
   * @param {string|null} name - name of the object, such as 'Golf ball', or null if it doesn't have a name
   * @param {number} mass - in kg
   * @param {number} diameter - in meters
   * @param {number} dragCoefficient
   * @param {string|null} benchmark - identifier of the object benchmark, such as 'tankShell', also considered a
   *                                      'name' for it like for Tandems. null for screens with only one object type
   * @param {boolean} rotates - whether the object rotates or just translates in air
   * @param {Object} [options]
   */
  constructor(name, mass, diameter, dragCoefficient, benchmark, rotates, options) {
    // Options contains data about range and rounding for mass, diameter, drag coefficient.
    // defaults to those of custom objects for screens that don't have benchmarks
    options = merge({
      tandem: Tandem.REQUIRED,
      phetioType: EditableProjectileObjectType.EditableProjectileObjectTypeIO
    }, options);
    super(name, mass, diameter, dragCoefficient, benchmark, rotates, options);

    // @public - These overwrite the supertype values, but as a way to declare them as writeable fields.
    this.mass = mass;
    this.diameter = diameter;
    this.dragCoefficient = dragCoefficient;

    // @public (IOType) - these mutable values also store their initial values
    this.initialMass = mass;
    this.initialDiameter = diameter;
    this.initialDragCoefficient = dragCoefficient;
  }

  /**
   * Reset the editable pieces of the objecty type
   * @public
   */
  reset() {
    this.mass = this.initialMass;
    this.diameter = this.initialDiameter;
    this.dragCoefficient = this.initialDragCoefficient;
  }

  /**
   *
   * @param {ProjectileObjectType} projectileObjectType
   * @param {Tandem} tandem
   * @returns {EditableProjectileObjectType}
   * @public
   */
  static fromProjectileObjectType(projectileObjectType, tandem) {
    return new EditableProjectileObjectType(projectileObjectType.name, projectileObjectType.mass, projectileObjectType.diameter, projectileObjectType.dragCoefficient, projectileObjectType.benchmark, projectileObjectType.rotates, merge(projectileObjectType.projectileObjectTypeOptions, {
      phetioType: EditableProjectileObjectType.EditableProjectileObjectTypeIO,
      tandem: tandem
    }));
  }
}
EditableProjectileObjectType.EditableProjectileObjectTypeIO = new IOType('EditableProjectileObjectTypeIO', {
  valueType: ProjectileObjectType,
  documentation: 'A data type that stores the variables for a given object type.',
  supertype: ProjectileObjectType.ProjectileObjectTypeIO,
  applyState: (phetioObjectType, fromStateObject) => {
    ProjectileObjectType.ProjectileObjectTypeIO.applyState(phetioObjectType, fromStateObject);

    // These were just set on the phetioObjectType in the supertype applyState
    phetioObjectType.initialMass = phetioObjectType.mass;
    phetioObjectType.initialDiameter = phetioObjectType.diameter;
    phetioObjectType.initialDragCoefficient = phetioObjectType.dragCoefficient;
  }
});
projectileMotion.register('EditableProjectileObjectType', EditableProjectileObjectType);
export default EditableProjectileObjectType;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJtZXJnZSIsIlRhbmRlbSIsIklPVHlwZSIsIlByb2plY3RpbGVPYmplY3RUeXBlIiwicHJvamVjdGlsZU1vdGlvbiIsIkVkaXRhYmxlUHJvamVjdGlsZU9iamVjdFR5cGUiLCJjb25zdHJ1Y3RvciIsIm5hbWUiLCJtYXNzIiwiZGlhbWV0ZXIiLCJkcmFnQ29lZmZpY2llbnQiLCJiZW5jaG1hcmsiLCJyb3RhdGVzIiwib3B0aW9ucyIsInRhbmRlbSIsIlJFUVVJUkVEIiwicGhldGlvVHlwZSIsIkVkaXRhYmxlUHJvamVjdGlsZU9iamVjdFR5cGVJTyIsImluaXRpYWxNYXNzIiwiaW5pdGlhbERpYW1ldGVyIiwiaW5pdGlhbERyYWdDb2VmZmljaWVudCIsInJlc2V0IiwiZnJvbVByb2plY3RpbGVPYmplY3RUeXBlIiwicHJvamVjdGlsZU9iamVjdFR5cGUiLCJwcm9qZWN0aWxlT2JqZWN0VHlwZU9wdGlvbnMiLCJ2YWx1ZVR5cGUiLCJkb2N1bWVudGF0aW9uIiwic3VwZXJ0eXBlIiwiUHJvamVjdGlsZU9iamVjdFR5cGVJTyIsImFwcGx5U3RhdGUiLCJwaGV0aW9PYmplY3RUeXBlIiwiZnJvbVN0YXRlT2JqZWN0IiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJFZGl0YWJsZVByb2plY3RpbGVPYmplY3RUeXBlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE5LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFByb2plY3RpbGVPYmplY3RUeXBlIHN1YnR5cGUgdGhhdCBjb250YWlucyBlZGl0YWJsZSAobXV0YWJsZSkgcHJvcGVydGllcyBvZiB0aGUgcHJvamVjdGlsZSB0eXBlXHJcbiAqXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgbWVyZ2UgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL21lcmdlLmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi8uLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuaW1wb3J0IElPVHlwZSBmcm9tICcuLi8uLi8uLi8uLi90YW5kZW0vanMvdHlwZXMvSU9UeXBlLmpzJztcclxuaW1wb3J0IFByb2plY3RpbGVPYmplY3RUeXBlIGZyb20gJy4uLy4uL2NvbW1vbi9tb2RlbC9Qcm9qZWN0aWxlT2JqZWN0VHlwZS5qcyc7XHJcbmltcG9ydCBwcm9qZWN0aWxlTW90aW9uIGZyb20gJy4uLy4uL3Byb2plY3RpbGVNb3Rpb24uanMnO1xyXG5cclxuY2xhc3MgRWRpdGFibGVQcm9qZWN0aWxlT2JqZWN0VHlwZSBleHRlbmRzIFByb2plY3RpbGVPYmplY3RUeXBlIHtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8bnVsbH0gbmFtZSAtIG5hbWUgb2YgdGhlIG9iamVjdCwgc3VjaCBhcyAnR29sZiBiYWxsJywgb3IgbnVsbCBpZiBpdCBkb2Vzbid0IGhhdmUgYSBuYW1lXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1hc3MgLSBpbiBrZ1xyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBkaWFtZXRlciAtIGluIG1ldGVyc1xyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBkcmFnQ29lZmZpY2llbnRcclxuICAgKiBAcGFyYW0ge3N0cmluZ3xudWxsfSBiZW5jaG1hcmsgLSBpZGVudGlmaWVyIG9mIHRoZSBvYmplY3QgYmVuY2htYXJrLCBzdWNoIGFzICd0YW5rU2hlbGwnLCBhbHNvIGNvbnNpZGVyZWQgYVxyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmFtZScgZm9yIGl0IGxpa2UgZm9yIFRhbmRlbXMuIG51bGwgZm9yIHNjcmVlbnMgd2l0aCBvbmx5IG9uZSBvYmplY3QgdHlwZVxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gcm90YXRlcyAtIHdoZXRoZXIgdGhlIG9iamVjdCByb3RhdGVzIG9yIGp1c3QgdHJhbnNsYXRlcyBpbiBhaXJcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoIG5hbWUsIG1hc3MsIGRpYW1ldGVyLCBkcmFnQ29lZmZpY2llbnQsIGJlbmNobWFyaywgcm90YXRlcywgb3B0aW9ucyApIHtcclxuXHJcbiAgICAvLyBPcHRpb25zIGNvbnRhaW5zIGRhdGEgYWJvdXQgcmFuZ2UgYW5kIHJvdW5kaW5nIGZvciBtYXNzLCBkaWFtZXRlciwgZHJhZyBjb2VmZmljaWVudC5cclxuICAgIC8vIGRlZmF1bHRzIHRvIHRob3NlIG9mIGN1c3RvbSBvYmplY3RzIGZvciBzY3JlZW5zIHRoYXQgZG9uJ3QgaGF2ZSBiZW5jaG1hcmtzXHJcbiAgICBvcHRpb25zID0gbWVyZ2UoIHtcclxuICAgICAgdGFuZGVtOiBUYW5kZW0uUkVRVUlSRUQsXHJcbiAgICAgIHBoZXRpb1R5cGU6IEVkaXRhYmxlUHJvamVjdGlsZU9iamVjdFR5cGUuRWRpdGFibGVQcm9qZWN0aWxlT2JqZWN0VHlwZUlPXHJcbiAgICB9LCBvcHRpb25zICk7XHJcblxyXG4gICAgc3VwZXIoIG5hbWUsIG1hc3MsIGRpYW1ldGVyLCBkcmFnQ29lZmZpY2llbnQsIGJlbmNobWFyaywgcm90YXRlcywgb3B0aW9ucyApO1xyXG5cclxuICAgIC8vIEBwdWJsaWMgLSBUaGVzZSBvdmVyd3JpdGUgdGhlIHN1cGVydHlwZSB2YWx1ZXMsIGJ1dCBhcyBhIHdheSB0byBkZWNsYXJlIHRoZW0gYXMgd3JpdGVhYmxlIGZpZWxkcy5cclxuICAgIHRoaXMubWFzcyA9IG1hc3M7XHJcbiAgICB0aGlzLmRpYW1ldGVyID0gZGlhbWV0ZXI7XHJcbiAgICB0aGlzLmRyYWdDb2VmZmljaWVudCA9IGRyYWdDb2VmZmljaWVudDtcclxuXHJcbiAgICAvLyBAcHVibGljIChJT1R5cGUpIC0gdGhlc2UgbXV0YWJsZSB2YWx1ZXMgYWxzbyBzdG9yZSB0aGVpciBpbml0aWFsIHZhbHVlc1xyXG4gICAgdGhpcy5pbml0aWFsTWFzcyA9IG1hc3M7XHJcbiAgICB0aGlzLmluaXRpYWxEaWFtZXRlciA9IGRpYW1ldGVyO1xyXG4gICAgdGhpcy5pbml0aWFsRHJhZ0NvZWZmaWNpZW50ID0gZHJhZ0NvZWZmaWNpZW50O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzZXQgdGhlIGVkaXRhYmxlIHBpZWNlcyBvZiB0aGUgb2JqZWN0eSB0eXBlXHJcbiAgICogQHB1YmxpY1xyXG4gICAqL1xyXG4gIHJlc2V0KCkge1xyXG4gICAgdGhpcy5tYXNzID0gdGhpcy5pbml0aWFsTWFzcztcclxuICAgIHRoaXMuZGlhbWV0ZXIgPSB0aGlzLmluaXRpYWxEaWFtZXRlcjtcclxuICAgIHRoaXMuZHJhZ0NvZWZmaWNpZW50ID0gdGhpcy5pbml0aWFsRHJhZ0NvZWZmaWNpZW50O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1Byb2plY3RpbGVPYmplY3RUeXBlfSBwcm9qZWN0aWxlT2JqZWN0VHlwZVxyXG4gICAqIEBwYXJhbSB7VGFuZGVtfSB0YW5kZW1cclxuICAgKiBAcmV0dXJucyB7RWRpdGFibGVQcm9qZWN0aWxlT2JqZWN0VHlwZX1cclxuICAgKiBAcHVibGljXHJcbiAgICovXHJcbiAgc3RhdGljIGZyb21Qcm9qZWN0aWxlT2JqZWN0VHlwZSggcHJvamVjdGlsZU9iamVjdFR5cGUsIHRhbmRlbSApIHtcclxuICAgIHJldHVybiBuZXcgRWRpdGFibGVQcm9qZWN0aWxlT2JqZWN0VHlwZShcclxuICAgICAgcHJvamVjdGlsZU9iamVjdFR5cGUubmFtZSxcclxuICAgICAgcHJvamVjdGlsZU9iamVjdFR5cGUubWFzcyxcclxuICAgICAgcHJvamVjdGlsZU9iamVjdFR5cGUuZGlhbWV0ZXIsXHJcbiAgICAgIHByb2plY3RpbGVPYmplY3RUeXBlLmRyYWdDb2VmZmljaWVudCxcclxuICAgICAgcHJvamVjdGlsZU9iamVjdFR5cGUuYmVuY2htYXJrLFxyXG4gICAgICBwcm9qZWN0aWxlT2JqZWN0VHlwZS5yb3RhdGVzLFxyXG4gICAgICBtZXJnZSggcHJvamVjdGlsZU9iamVjdFR5cGUucHJvamVjdGlsZU9iamVjdFR5cGVPcHRpb25zLCB7XHJcbiAgICAgICAgcGhldGlvVHlwZTogRWRpdGFibGVQcm9qZWN0aWxlT2JqZWN0VHlwZS5FZGl0YWJsZVByb2plY3RpbGVPYmplY3RUeXBlSU8sXHJcbiAgICAgICAgdGFuZGVtOiB0YW5kZW1cclxuICAgICAgfSApICk7XHJcbiAgfVxyXG59XHJcblxyXG5FZGl0YWJsZVByb2plY3RpbGVPYmplY3RUeXBlLkVkaXRhYmxlUHJvamVjdGlsZU9iamVjdFR5cGVJTyA9IG5ldyBJT1R5cGUoICdFZGl0YWJsZVByb2plY3RpbGVPYmplY3RUeXBlSU8nLCB7XHJcbiAgdmFsdWVUeXBlOiBQcm9qZWN0aWxlT2JqZWN0VHlwZSxcclxuICBkb2N1bWVudGF0aW9uOiAnQSBkYXRhIHR5cGUgdGhhdCBzdG9yZXMgdGhlIHZhcmlhYmxlcyBmb3IgYSBnaXZlbiBvYmplY3QgdHlwZS4nLFxyXG4gIHN1cGVydHlwZTogUHJvamVjdGlsZU9iamVjdFR5cGUuUHJvamVjdGlsZU9iamVjdFR5cGVJTyxcclxuXHJcbiAgYXBwbHlTdGF0ZTogKCBwaGV0aW9PYmplY3RUeXBlLCBmcm9tU3RhdGVPYmplY3QgKSA9PiB7XHJcbiAgICBQcm9qZWN0aWxlT2JqZWN0VHlwZS5Qcm9qZWN0aWxlT2JqZWN0VHlwZUlPLmFwcGx5U3RhdGUoIHBoZXRpb09iamVjdFR5cGUsIGZyb21TdGF0ZU9iamVjdCApO1xyXG5cclxuICAgIC8vIFRoZXNlIHdlcmUganVzdCBzZXQgb24gdGhlIHBoZXRpb09iamVjdFR5cGUgaW4gdGhlIHN1cGVydHlwZSBhcHBseVN0YXRlXHJcbiAgICBwaGV0aW9PYmplY3RUeXBlLmluaXRpYWxNYXNzID0gcGhldGlvT2JqZWN0VHlwZS5tYXNzO1xyXG4gICAgcGhldGlvT2JqZWN0VHlwZS5pbml0aWFsRGlhbWV0ZXIgPSBwaGV0aW9PYmplY3RUeXBlLmRpYW1ldGVyO1xyXG4gICAgcGhldGlvT2JqZWN0VHlwZS5pbml0aWFsRHJhZ0NvZWZmaWNpZW50ID0gcGhldGlvT2JqZWN0VHlwZS5kcmFnQ29lZmZpY2llbnQ7XHJcbiAgfVxyXG59ICk7XHJcblxyXG5wcm9qZWN0aWxlTW90aW9uLnJlZ2lzdGVyKCAnRWRpdGFibGVQcm9qZWN0aWxlT2JqZWN0VHlwZScsIEVkaXRhYmxlUHJvamVjdGlsZU9iamVjdFR5cGUgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IEVkaXRhYmxlUHJvamVjdGlsZU9iamVjdFR5cGU7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLEtBQUssTUFBTSxtQ0FBbUM7QUFDckQsT0FBT0MsTUFBTSxNQUFNLGlDQUFpQztBQUNwRCxPQUFPQyxNQUFNLE1BQU0sdUNBQXVDO0FBQzFELE9BQU9DLG9CQUFvQixNQUFNLDRDQUE0QztBQUM3RSxPQUFPQyxnQkFBZ0IsTUFBTSwyQkFBMkI7QUFFeEQsTUFBTUMsNEJBQTRCLFNBQVNGLG9CQUFvQixDQUFDO0VBRTlEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0VHLFdBQVdBLENBQUVDLElBQUksRUFBRUMsSUFBSSxFQUFFQyxRQUFRLEVBQUVDLGVBQWUsRUFBRUMsU0FBUyxFQUFFQyxPQUFPLEVBQUVDLE9BQU8sRUFBRztJQUVoRjtJQUNBO0lBQ0FBLE9BQU8sR0FBR2IsS0FBSyxDQUFFO01BQ2ZjLE1BQU0sRUFBRWIsTUFBTSxDQUFDYyxRQUFRO01BQ3ZCQyxVQUFVLEVBQUVYLDRCQUE0QixDQUFDWTtJQUMzQyxDQUFDLEVBQUVKLE9BQVEsQ0FBQztJQUVaLEtBQUssQ0FBRU4sSUFBSSxFQUFFQyxJQUFJLEVBQUVDLFFBQVEsRUFBRUMsZUFBZSxFQUFFQyxTQUFTLEVBQUVDLE9BQU8sRUFBRUMsT0FBUSxDQUFDOztJQUUzRTtJQUNBLElBQUksQ0FBQ0wsSUFBSSxHQUFHQSxJQUFJO0lBQ2hCLElBQUksQ0FBQ0MsUUFBUSxHQUFHQSxRQUFRO0lBQ3hCLElBQUksQ0FBQ0MsZUFBZSxHQUFHQSxlQUFlOztJQUV0QztJQUNBLElBQUksQ0FBQ1EsV0FBVyxHQUFHVixJQUFJO0lBQ3ZCLElBQUksQ0FBQ1csZUFBZSxHQUFHVixRQUFRO0lBQy9CLElBQUksQ0FBQ1csc0JBQXNCLEdBQUdWLGVBQWU7RUFDL0M7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7RUFDRVcsS0FBS0EsQ0FBQSxFQUFHO0lBQ04sSUFBSSxDQUFDYixJQUFJLEdBQUcsSUFBSSxDQUFDVSxXQUFXO0lBQzVCLElBQUksQ0FBQ1QsUUFBUSxHQUFHLElBQUksQ0FBQ1UsZUFBZTtJQUNwQyxJQUFJLENBQUNULGVBQWUsR0FBRyxJQUFJLENBQUNVLHNCQUFzQjtFQUNwRDs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQU9FLHdCQUF3QkEsQ0FBRUMsb0JBQW9CLEVBQUVULE1BQU0sRUFBRztJQUM5RCxPQUFPLElBQUlULDRCQUE0QixDQUNyQ2tCLG9CQUFvQixDQUFDaEIsSUFBSSxFQUN6QmdCLG9CQUFvQixDQUFDZixJQUFJLEVBQ3pCZSxvQkFBb0IsQ0FBQ2QsUUFBUSxFQUM3QmMsb0JBQW9CLENBQUNiLGVBQWUsRUFDcENhLG9CQUFvQixDQUFDWixTQUFTLEVBQzlCWSxvQkFBb0IsQ0FBQ1gsT0FBTyxFQUM1QlosS0FBSyxDQUFFdUIsb0JBQW9CLENBQUNDLDJCQUEyQixFQUFFO01BQ3ZEUixVQUFVLEVBQUVYLDRCQUE0QixDQUFDWSw4QkFBOEI7TUFDdkVILE1BQU0sRUFBRUE7SUFDVixDQUFFLENBQUUsQ0FBQztFQUNUO0FBQ0Y7QUFFQVQsNEJBQTRCLENBQUNZLDhCQUE4QixHQUFHLElBQUlmLE1BQU0sQ0FBRSxnQ0FBZ0MsRUFBRTtFQUMxR3VCLFNBQVMsRUFBRXRCLG9CQUFvQjtFQUMvQnVCLGFBQWEsRUFBRSxnRUFBZ0U7RUFDL0VDLFNBQVMsRUFBRXhCLG9CQUFvQixDQUFDeUIsc0JBQXNCO0VBRXREQyxVQUFVLEVBQUVBLENBQUVDLGdCQUFnQixFQUFFQyxlQUFlLEtBQU07SUFDbkQ1QixvQkFBb0IsQ0FBQ3lCLHNCQUFzQixDQUFDQyxVQUFVLENBQUVDLGdCQUFnQixFQUFFQyxlQUFnQixDQUFDOztJQUUzRjtJQUNBRCxnQkFBZ0IsQ0FBQ1osV0FBVyxHQUFHWSxnQkFBZ0IsQ0FBQ3RCLElBQUk7SUFDcERzQixnQkFBZ0IsQ0FBQ1gsZUFBZSxHQUFHVyxnQkFBZ0IsQ0FBQ3JCLFFBQVE7SUFDNURxQixnQkFBZ0IsQ0FBQ1Ysc0JBQXNCLEdBQUdVLGdCQUFnQixDQUFDcEIsZUFBZTtFQUM1RTtBQUNGLENBQUUsQ0FBQztBQUVITixnQkFBZ0IsQ0FBQzRCLFFBQVEsQ0FBRSw4QkFBOEIsRUFBRTNCLDRCQUE2QixDQUFDO0FBRXpGLGVBQWVBLDRCQUE0QiIsImlnbm9yZUxpc3QiOltdfQ==