// Copyright 2016-2024, University of Colorado Boulder

/**
 * Model of a trajectory.
 * One trajectory can have multiple projectiles on its path.
 * Air resistance and altitude can immediately change the path of the projectiles in the air.
 * Velocity, angle, mass, diameter, dragcoefficient only affect the next projectile fired.
 * Units are meters, kilograms, and seconds (mks)
 *
 * @author Andrea Lin (PhET Interactive Simulations)
 * @author Matthew Blackman (PhET Interactive Simulations)
 */

import createObservableArray from '../../../../axon/js/createObservableArray.js';
import Emitter from '../../../../axon/js/Emitter.js';
import NumberProperty from '../../../../axon/js/NumberProperty.js';
import Property from '../../../../axon/js/Property.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import optionize from '../../../../phet-core/js/optionize.js';
import PhetioGroup from '../../../../tandem/js/PhetioGroup.js';
import PhetioObject from '../../../../tandem/js/PhetioObject.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import BooleanIO from '../../../../tandem/js/types/BooleanIO.js';
import IOType from '../../../../tandem/js/types/IOType.js';
import NullableIO from '../../../../tandem/js/types/NullableIO.js';
import NumberIO from '../../../../tandem/js/types/NumberIO.js';
import ReferenceIO from '../../../../tandem/js/types/ReferenceIO.js';
import projectileMotion from '../../projectileMotion.js';
import DataPoint from './DataPoint.js';
import ProjectileObjectType from './ProjectileObjectType.js';
import isSettingPhetioStateProperty from '../../../../tandem/js/isSettingPhetioStateProperty.js';
class Trajectory extends PhetioObject {
  // the type of projectile being launched
  // mass of projectiles in kilograms
  // diameter of projectiles in meters
  // drag coefficient of the projectiles
  // launch speed of the projectiles
  // initial height of the projectiles
  // cannon launch angle
  // world gravity
  // air density
  // the number of projectiles that are currently in flight
  // emitter to update the ranks of the trajectories
  // contains reference to the apex point, or null if apex point doesn't exist/has been recorded
  // the maximum height reached by the projectile
  // the horizontal displacement of the projectile from its launch point
  // the horizontal displacement of the projectile from its launch point
  // the callback from the common Target to check and return if the projectile hit the target
  // whether the projectile has hit the target
  // accessor for DataProbe component

  constructor(projectileObjectType, projectileMass, projectileDiameter, projectileDragCoefficient, initialSpeed, initialHeight, initialAngle, airDensityProperty, gravityProperty, updateTrajectoryRanksEmitter, numberOfMovingProjectilesProperty, checkIfHitTarget, getDataProbe, providedOptions) {
    const options = optionize()({
      tandem: Tandem.REQUIRED,
      phetioDynamicElement: true,
      phetioType: Trajectory.TrajectoryIO
    }, providedOptions);
    super(options);
    this.projectileObjectType = projectileObjectType;
    this.mass = projectileMass;
    this.diameter = projectileDiameter;
    this.dragCoefficient = projectileDragCoefficient;
    this.initialSpeed = initialSpeed;
    this.initialHeight = initialHeight;
    this.initialAngle = initialAngle;
    this.gravityProperty = gravityProperty;
    this.airDensityProperty = airDensityProperty;
    this.numberOfMovingProjectilesProperty = numberOfMovingProjectilesProperty;
    this.numberOfMovingProjectilesProperty.value++;
    this.updateTrajectoryRanksEmitter = updateTrajectoryRanksEmitter;
    this.apexPoint = null;
    this.maxHeight = this.initialHeight;
    this.horizontalDisplacement = 0;
    this.flightTime = 0;
    this.checkIfHitTarget = checkIfHitTarget;
    this.hasHitTarget = false;
    this.getDataProbe = getDataProbe;
    this.rankProperty = new NumberProperty(0, {
      tandem: options.tandem.createTandem('rankProperty'),
      phetioDocumentation: `${'The count of how old this projectile trajectory is. Older trajectories have more ' + 'opacity until they are subsequently removed. The most recent trajectory fired has rank 0. ' + 'The second most recent has rank 1.'}`,
      phetioReadOnly: true
    });

    // did the trajectory path change in midair due to air density change
    this.changedInMidAir = false;

    // record points along the trajectory with critical information
    this.dataPoints = createObservableArray({
      phetioType: createObservableArray.ObservableArrayIO(DataPoint.DataPointIO),
      tandem: options.tandem.createTandem('dataPoints'),
      phetioDocumentation: 'An ordered list of all data points taken on this trajectory. The earliest data point ' + 'will be first'
    });

    // set by TrajectoryIO.js
    this.reachedGround = false;

    // Add one to the rank
    const incrementRank = () => this.rankProperty.value++;

    // Listen to whether this rank should be incremented
    this.updateTrajectoryRanksEmitter.addListener(incrementRank);

    // Set the initial velocity based on the initial speed and angle
    const velocity = Vector2.pool.fetch().setPolar(this.initialSpeed, this.initialAngle * Math.PI / 180);
    const dragForce = this.dragForceForVelocity(velocity);
    const acceleration = this.accelerationForDragForce(dragForce);
    const initialPoint = new DataPoint(0, Vector2.pool.create(0, this.initialHeight), this.airDensityProperty.value, velocity, acceleration, dragForce, this.gravityForce());

    // the data points apply their own state
    !isSettingPhetioStateProperty.value && this.addDataPoint(initialPoint);

    // The "projectile object" is really just what data point the projectile is currently at.
    // TODO: this should be PhET-iO instrumented as a ReferenceIO, https://github.com/phetsims/projectile-motion/issues/262
    this.projectileDataPointProperty = new Property(initialPoint, {
      phetioValueType: DataPoint.DataPointIO
    });
    this.trajectoryLandedEmitter = new Emitter({
      tandem: options.tandem.createTandem('trajectoryLandedEmitter'),
      parameters: [{
        name: 'trajectory',
        phetioType: Trajectory.TrajectoryIO
      }]
    });
    this.dataPoints.elementAddedEmitter.addListener(addedDataPoint => {
      this.maxHeight = Math.max(addedDataPoint.position.y, this.maxHeight);
      this.horizontalDisplacement = addedDataPoint.position.x;
      this.flightTime = addedDataPoint.time;
      if (addedDataPoint.reachedGround) {
        this.trajectoryLandedEmitter.emit(this);
      }
    });
    this.disposeTrajectory = () => {
      this.apexPoint = null; // remove reference
      this.dataPoints.dispose();
      this.trajectoryLandedEmitter.dispose();
      this.rankProperty.dispose();
      this.updateTrajectoryRanksEmitter.removeListener(incrementRank);
    };
  }
  gravityForce() {
    return -this.gravityProperty.value * this.mass;
  }

  /**
   * @param dragForce - the drag force on the projectile
   */
  accelerationForDragForce(dragForce) {
    return Vector2.pool.fetch().setXY(-dragForce.x / this.mass, -this.gravityProperty.value - dragForce.y / this.mass);
  }

  /**
   * @param velocity - the velocity of the projectile
   */
  dragForceForVelocity(velocity) {
    // cross-sectional area of the projectile
    const area = Math.PI * this.diameter * this.diameter / 4;
    return Vector2.pool.fetch().set(velocity).multiplyScalar(0.5 * this.airDensityProperty.value * area * this.dragCoefficient * velocity.magnitude);
  }
  step(dt) {
    assert && assert(!this.reachedGround, 'Trajectories should not step after reaching ground');
    const previousPoint = this.dataPoints.get(this.dataPoints.length - 1);
    let newY = nextPosition(previousPoint.position.y, previousPoint.velocity.y, previousPoint.acceleration.y, dt);
    if (newY <= 0) {
      newY = 0;
      this.reachedGround = true;
    }
    const cappedDeltaTime = this.reachedGround ? timeToGround(previousPoint) : dt;
    let newX = nextPosition(previousPoint.position.x, previousPoint.velocity.x, previousPoint.acceleration.x, cappedDeltaTime);
    let newVx = previousPoint.velocity.x + previousPoint.acceleration.x * cappedDeltaTime;
    const newVy = previousPoint.velocity.y + previousPoint.acceleration.y * cappedDeltaTime;

    // if drag force reverses the x-velocity in this step, set vx to zero to better approximate reality
    // We do not need to do this adjustment for the y direction because gravity is already resulting in a change in
    // direction, and because our air-resistance model is not 100% accurate already (via linear interpolation).
    if (Math.sign(newVx) !== Math.sign(previousPoint.velocity.x)) {
      const deltaTimeForLargeDragForceX = -1 * previousPoint.velocity.x / previousPoint.acceleration.x;
      newX = nextPosition(previousPoint.position.x, previousPoint.velocity.x, previousPoint.acceleration.x, deltaTimeForLargeDragForceX);
      newVx = 0;
    }
    const newPosition = Vector2.pool.fetch().setXY(newX, newY);
    const newVelocity = Vector2.pool.fetch().setXY(newVx, newVy);
    const newDragForce = this.dragForceForVelocity(newVelocity);
    const newAcceleration = this.accelerationForDragForce(newDragForce);

    //if the apex has been reached
    if (previousPoint.velocity.y > 0 && newVelocity.y < 0) {
      this.handleApex(previousPoint);
    }
    const newPoint = new DataPoint(previousPoint.time + cappedDeltaTime, newPosition, this.airDensityProperty.value, newVelocity, newAcceleration, newDragForce, this.gravityForce(), {
      reachedGround: this.reachedGround
    });
    this.addDataPoint(newPoint);
    this.projectileDataPointProperty.set(newPoint);

    // make sure the data point is created before calling handleLanded and notifying any listeners
    this.reachedGround && this.handleLanded();
  }
  handleLanded() {
    this.trajectoryLandedEmitter.emit(this);
    this.numberOfMovingProjectilesProperty.value--;
    const displacement = this.projectileDataPointProperty.get().position.x;

    // checkIfHitTarget calls back to the target in the common model, where the checking takes place
    this.hasHitTarget = this.checkIfHitTarget(displacement);
  }
  handleApex(previousPoint) {
    // These are all approximations if there is air resistance
    const dtToApex = Math.abs(previousPoint.velocity.y / previousPoint.acceleration.y);
    const apexX = nextPosition(previousPoint.position.x, previousPoint.velocity.x, previousPoint.acceleration.x, dtToApex);
    const apexY = nextPosition(previousPoint.position.y, previousPoint.velocity.y, previousPoint.acceleration.y, dtToApex);
    const apexVelocityX = previousPoint.velocity.x + previousPoint.acceleration.x * dtToApex;
    const apexVelocityY = 0; // by definition this is what makes it the apex
    const apexVelocity = Vector2.pool.fetch().setXY(apexVelocityX, apexVelocityY);
    const apexDragForce = this.dragForceForVelocity(apexVelocity);
    const apexAcceleration = this.accelerationForDragForce(apexDragForce);
    const apexPoint = new DataPoint(previousPoint.time + dtToApex, Vector2.pool.fetch().setXY(apexX, apexY), this.airDensityProperty.value, apexVelocity, apexAcceleration, apexDragForce, this.gravityForce(), {
      apex: true
    });
    assert && assert(this.apexPoint === null, 'already have an apex point');
    this.apexPoint = apexPoint; // save apex point
    this.addDataPoint(apexPoint);
  }
  addDataPoint(dataPoint) {
    this.dataPoints.push(dataPoint);

    // update data probe if apex point is within range
    this.getDataProbe() && this.getDataProbe()?.updateDataIfWithinRange(dataPoint);
  }

  /**
   * Finds the dataPoint in this trajectory with the least euclidian distance to coordinates given,
   * or returns null if this trajectory has no datapoints
   * @param x - coordinate in model
   * @param y - coordinate in model
   */
  getNearestPoint(x, y) {
    if (this.dataPoints.length === 0) {
      return null;
    }

    // First, set the nearest point and corresponding distance to the first datapoint.
    let nearestPoint = this.dataPoints.get(0);
    let minDistance = nearestPoint.position.distanceXY(x, y);

    // Search through datapoints for the smallest distance. If there are two datapoints with equal distance, the one
    // with more time is chosen.
    for (let i = 0; i < this.dataPoints.length; i++) {
      const currentPoint = this.dataPoints.get(i);
      const currentDistance = currentPoint.position.distanceXY(x, y);
      if (currentDistance <= minDistance) {
        nearestPoint = currentPoint;
        minDistance = currentDistance;
      }
    }
    return nearestPoint;
  }

  /**
   * Create a PhetioGroup for the trajectories
   * @param model
   * @param tandem
   */
  static createGroup(model, tandem) {
    const checkIfHitTarget = model.target.checkIfHitTarget.bind(model.target);
    return new PhetioGroup((tandem, projectileObjectType, projectileMass, projectileDiameter, projectileDragCoefficient, initialSpeed, initialHeight, initialAngle) => {
      return new Trajectory(projectileObjectType, projectileMass, projectileDiameter, projectileDragCoefficient, initialSpeed, initialHeight, initialAngle, model.airDensityProperty, model.gravityProperty, model.updateTrajectoryRanksEmitter, model.numberOfMovingProjectilesProperty, checkIfHitTarget, () => {
        return model.dataProbe;
      }, {
        tandem: tandem
      });
    }, [model.selectedProjectileObjectTypeProperty.value, model.projectileMassProperty.value, model.projectileDiameterProperty.value, model.projectileDragCoefficientProperty.value, model.initialSpeedProperty.value, model.cannonHeightProperty.value, model.cannonAngleProperty.value], {
      tandem: tandem,
      phetioType: PhetioGroup.PhetioGroupIO(Trajectory.TrajectoryIO),
      phetioDocumentation: 'The container for any trajectory that is created when a projectile is fired.'
    });
  }

  /**
   * Dispose this Trajectory, for memory management
   */
  dispose() {
    this.disposeTrajectory();
    super.dispose();
  }

  /**
   * Returns a map of state keys and their associated IOTypes, see IOType for details.
   */
  static get STATE_SCHEMA() {
    return {
      mass: NumberIO,
      diameter: NumberIO,
      dragCoefficient: NumberIO,
      changedInMidAir: BooleanIO,
      reachedGround: BooleanIO,
      apexPoint: NullableIO(DataPoint.DataPointIO),
      maxHeight: NumberIO,
      horizontalDisplacement: NumberIO,
      flightTime: NumberIO,
      hasHitTarget: BooleanIO,
      projectileObjectType: ReferenceIO(ProjectileObjectType.ProjectileObjectTypeIO),
      initialSpeed: NumberIO,
      initialHeight: NumberIO,
      initialAngle: NumberIO
    };
  }

  /**
   * @returns map from state object to parameters being passed to createNextElement
   */
  static stateObjectToCreateElementArguments(stateObject) {
    return [ReferenceIO(ProjectileObjectType.ProjectileObjectTypeIO).fromStateObject(stateObject.projectileObjectType), stateObject.mass, stateObject.diameter, stateObject.dragCoefficient, stateObject.initialSpeed, stateObject.initialHeight, stateObject.initialAngle];
  }

  // Name the types needed to serialize each field on the Trajectory so that it can be used in toStateObject, fromStateObject, and applyState.
  static TrajectoryIO = new IOType('TrajectoryIO', {
    valueType: Trajectory,
    documentation: 'A trajectory outlining the projectile\'s path. The following are passed into the state schema:' + '<ul>' + '<li>mass: the mass of the projectile' + '<li>diameter: the diameter of the projectile' + '<li>dragCoefficient: the drag coefficient of the projectile' + '<li>initialSpeed: the initial speed of the projectile' + '<li>initialHeight: the initial height of the projectile' + '<li>initialAngle: the initial angle of the projectile' + '</ul>',
    stateSchema: Trajectory.STATE_SCHEMA,
    stateObjectToCreateElementArguments: s => Trajectory.stateObjectToCreateElementArguments(s)
  });
}

// Calculate the next 1-d position using the basic kinematic function.
const nextPosition = (position, velocity, acceleration, time) => {
  return position + velocity * time + 0.5 * acceleration * time * time;
};
const timeToGround = previousPoint => {
  if (previousPoint.acceleration.y === 0) {
    if (previousPoint.velocity.y === 0) {
      assert && assert(false, 'How did newY reach <=0 if there was no velocity.y?');
      return 0;
    } else {
      return -previousPoint.position.y / previousPoint.velocity.y;
    }
  } else {
    const squareRoot = -Math.sqrt(previousPoint.velocity.y * previousPoint.velocity.y - 2 * previousPoint.acceleration.y * previousPoint.position.y);
    return (squareRoot - previousPoint.velocity.y) / previousPoint.acceleration.y;
  }
};
projectileMotion.register('Trajectory', Trajectory);
export default Trajectory;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjcmVhdGVPYnNlcnZhYmxlQXJyYXkiLCJFbWl0dGVyIiwiTnVtYmVyUHJvcGVydHkiLCJQcm9wZXJ0eSIsIlZlY3RvcjIiLCJvcHRpb25pemUiLCJQaGV0aW9Hcm91cCIsIlBoZXRpb09iamVjdCIsIlRhbmRlbSIsIkJvb2xlYW5JTyIsIklPVHlwZSIsIk51bGxhYmxlSU8iLCJOdW1iZXJJTyIsIlJlZmVyZW5jZUlPIiwicHJvamVjdGlsZU1vdGlvbiIsIkRhdGFQb2ludCIsIlByb2plY3RpbGVPYmplY3RUeXBlIiwiaXNTZXR0aW5nUGhldGlvU3RhdGVQcm9wZXJ0eSIsIlRyYWplY3RvcnkiLCJjb25zdHJ1Y3RvciIsInByb2plY3RpbGVPYmplY3RUeXBlIiwicHJvamVjdGlsZU1hc3MiLCJwcm9qZWN0aWxlRGlhbWV0ZXIiLCJwcm9qZWN0aWxlRHJhZ0NvZWZmaWNpZW50IiwiaW5pdGlhbFNwZWVkIiwiaW5pdGlhbEhlaWdodCIsImluaXRpYWxBbmdsZSIsImFpckRlbnNpdHlQcm9wZXJ0eSIsImdyYXZpdHlQcm9wZXJ0eSIsInVwZGF0ZVRyYWplY3RvcnlSYW5rc0VtaXR0ZXIiLCJudW1iZXJPZk1vdmluZ1Byb2plY3RpbGVzUHJvcGVydHkiLCJjaGVja0lmSGl0VGFyZ2V0IiwiZ2V0RGF0YVByb2JlIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsInRhbmRlbSIsIlJFUVVJUkVEIiwicGhldGlvRHluYW1pY0VsZW1lbnQiLCJwaGV0aW9UeXBlIiwiVHJhamVjdG9yeUlPIiwibWFzcyIsImRpYW1ldGVyIiwiZHJhZ0NvZWZmaWNpZW50IiwidmFsdWUiLCJhcGV4UG9pbnQiLCJtYXhIZWlnaHQiLCJob3Jpem9udGFsRGlzcGxhY2VtZW50IiwiZmxpZ2h0VGltZSIsImhhc0hpdFRhcmdldCIsInJhbmtQcm9wZXJ0eSIsImNyZWF0ZVRhbmRlbSIsInBoZXRpb0RvY3VtZW50YXRpb24iLCJwaGV0aW9SZWFkT25seSIsImNoYW5nZWRJbk1pZEFpciIsImRhdGFQb2ludHMiLCJPYnNlcnZhYmxlQXJyYXlJTyIsIkRhdGFQb2ludElPIiwicmVhY2hlZEdyb3VuZCIsImluY3JlbWVudFJhbmsiLCJhZGRMaXN0ZW5lciIsInZlbG9jaXR5IiwicG9vbCIsImZldGNoIiwic2V0UG9sYXIiLCJNYXRoIiwiUEkiLCJkcmFnRm9yY2UiLCJkcmFnRm9yY2VGb3JWZWxvY2l0eSIsImFjY2VsZXJhdGlvbiIsImFjY2VsZXJhdGlvbkZvckRyYWdGb3JjZSIsImluaXRpYWxQb2ludCIsImNyZWF0ZSIsImdyYXZpdHlGb3JjZSIsImFkZERhdGFQb2ludCIsInByb2plY3RpbGVEYXRhUG9pbnRQcm9wZXJ0eSIsInBoZXRpb1ZhbHVlVHlwZSIsInRyYWplY3RvcnlMYW5kZWRFbWl0dGVyIiwicGFyYW1ldGVycyIsIm5hbWUiLCJlbGVtZW50QWRkZWRFbWl0dGVyIiwiYWRkZWREYXRhUG9pbnQiLCJtYXgiLCJwb3NpdGlvbiIsInkiLCJ4IiwidGltZSIsImVtaXQiLCJkaXNwb3NlVHJhamVjdG9yeSIsImRpc3Bvc2UiLCJyZW1vdmVMaXN0ZW5lciIsInNldFhZIiwiYXJlYSIsInNldCIsIm11bHRpcGx5U2NhbGFyIiwibWFnbml0dWRlIiwic3RlcCIsImR0IiwiYXNzZXJ0IiwicHJldmlvdXNQb2ludCIsImdldCIsImxlbmd0aCIsIm5ld1kiLCJuZXh0UG9zaXRpb24iLCJjYXBwZWREZWx0YVRpbWUiLCJ0aW1lVG9Hcm91bmQiLCJuZXdYIiwibmV3VngiLCJuZXdWeSIsInNpZ24iLCJkZWx0YVRpbWVGb3JMYXJnZURyYWdGb3JjZVgiLCJuZXdQb3NpdGlvbiIsIm5ld1ZlbG9jaXR5IiwibmV3RHJhZ0ZvcmNlIiwibmV3QWNjZWxlcmF0aW9uIiwiaGFuZGxlQXBleCIsIm5ld1BvaW50IiwiaGFuZGxlTGFuZGVkIiwiZGlzcGxhY2VtZW50IiwiZHRUb0FwZXgiLCJhYnMiLCJhcGV4WCIsImFwZXhZIiwiYXBleFZlbG9jaXR5WCIsImFwZXhWZWxvY2l0eVkiLCJhcGV4VmVsb2NpdHkiLCJhcGV4RHJhZ0ZvcmNlIiwiYXBleEFjY2VsZXJhdGlvbiIsImFwZXgiLCJkYXRhUG9pbnQiLCJwdXNoIiwidXBkYXRlRGF0YUlmV2l0aGluUmFuZ2UiLCJnZXROZWFyZXN0UG9pbnQiLCJuZWFyZXN0UG9pbnQiLCJtaW5EaXN0YW5jZSIsImRpc3RhbmNlWFkiLCJpIiwiY3VycmVudFBvaW50IiwiY3VycmVudERpc3RhbmNlIiwiY3JlYXRlR3JvdXAiLCJtb2RlbCIsInRhcmdldCIsImJpbmQiLCJkYXRhUHJvYmUiLCJzZWxlY3RlZFByb2plY3RpbGVPYmplY3RUeXBlUHJvcGVydHkiLCJwcm9qZWN0aWxlTWFzc1Byb3BlcnR5IiwicHJvamVjdGlsZURpYW1ldGVyUHJvcGVydHkiLCJwcm9qZWN0aWxlRHJhZ0NvZWZmaWNpZW50UHJvcGVydHkiLCJpbml0aWFsU3BlZWRQcm9wZXJ0eSIsImNhbm5vbkhlaWdodFByb3BlcnR5IiwiY2Fubm9uQW5nbGVQcm9wZXJ0eSIsIlBoZXRpb0dyb3VwSU8iLCJTVEFURV9TQ0hFTUEiLCJQcm9qZWN0aWxlT2JqZWN0VHlwZUlPIiwic3RhdGVPYmplY3RUb0NyZWF0ZUVsZW1lbnRBcmd1bWVudHMiLCJzdGF0ZU9iamVjdCIsImZyb21TdGF0ZU9iamVjdCIsInZhbHVlVHlwZSIsImRvY3VtZW50YXRpb24iLCJzdGF0ZVNjaGVtYSIsInMiLCJzcXVhcmVSb290Iiwic3FydCIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiVHJhamVjdG9yeS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBNb2RlbCBvZiBhIHRyYWplY3RvcnkuXHJcbiAqIE9uZSB0cmFqZWN0b3J5IGNhbiBoYXZlIG11bHRpcGxlIHByb2plY3RpbGVzIG9uIGl0cyBwYXRoLlxyXG4gKiBBaXIgcmVzaXN0YW5jZSBhbmQgYWx0aXR1ZGUgY2FuIGltbWVkaWF0ZWx5IGNoYW5nZSB0aGUgcGF0aCBvZiB0aGUgcHJvamVjdGlsZXMgaW4gdGhlIGFpci5cclxuICogVmVsb2NpdHksIGFuZ2xlLCBtYXNzLCBkaWFtZXRlciwgZHJhZ2NvZWZmaWNpZW50IG9ubHkgYWZmZWN0IHRoZSBuZXh0IHByb2plY3RpbGUgZmlyZWQuXHJcbiAqIFVuaXRzIGFyZSBtZXRlcnMsIGtpbG9ncmFtcywgYW5kIHNlY29uZHMgKG1rcylcclxuICpcclxuICogQGF1dGhvciBBbmRyZWEgTGluIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIE1hdHRoZXcgQmxhY2ttYW4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IGNyZWF0ZU9ic2VydmFibGVBcnJheSwgeyBPYnNlcnZhYmxlQXJyYXkgfSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL2NyZWF0ZU9ic2VydmFibGVBcnJheS5qcyc7XHJcbmltcG9ydCBFbWl0dGVyIGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvRW1pdHRlci5qcyc7XHJcbmltcG9ydCBOdW1iZXJQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL051bWJlclByb3BlcnR5LmpzJztcclxuaW1wb3J0IFByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgVmVjdG9yMiBmcm9tICcuLi8uLi8uLi8uLi9kb3QvanMvVmVjdG9yMi5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUsIHsgRW1wdHlTZWxmT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgUGhldGlvR3JvdXAgZnJvbSAnLi4vLi4vLi4vLi4vdGFuZGVtL2pzL1BoZXRpb0dyb3VwLmpzJztcclxuaW1wb3J0IFBoZXRpb09iamVjdCwgeyBQaGV0aW9PYmplY3RPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vLi4vdGFuZGVtL2pzL1BoZXRpb09iamVjdC5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcbmltcG9ydCBCb29sZWFuSU8gZnJvbSAnLi4vLi4vLi4vLi4vdGFuZGVtL2pzL3R5cGVzL0Jvb2xlYW5JTy5qcyc7XHJcbmltcG9ydCBJT1R5cGUgZnJvbSAnLi4vLi4vLi4vLi4vdGFuZGVtL2pzL3R5cGVzL0lPVHlwZS5qcyc7XHJcbmltcG9ydCBOdWxsYWJsZUlPIGZyb20gJy4uLy4uLy4uLy4uL3RhbmRlbS9qcy90eXBlcy9OdWxsYWJsZUlPLmpzJztcclxuaW1wb3J0IE51bWJlcklPIGZyb20gJy4uLy4uLy4uLy4uL3RhbmRlbS9qcy90eXBlcy9OdW1iZXJJTy5qcyc7XHJcbmltcG9ydCBSZWZlcmVuY2VJTywgeyBSZWZlcmVuY2VJT1N0YXRlIH0gZnJvbSAnLi4vLi4vLi4vLi4vdGFuZGVtL2pzL3R5cGVzL1JlZmVyZW5jZUlPLmpzJztcclxuaW1wb3J0IHByb2plY3RpbGVNb3Rpb24gZnJvbSAnLi4vLi4vcHJvamVjdGlsZU1vdGlvbi5qcyc7XHJcbmltcG9ydCBEYXRhUG9pbnQsIHsgRGF0YVBvaW50U3RhdGVPYmplY3QgfSBmcm9tICcuL0RhdGFQb2ludC5qcyc7XHJcbmltcG9ydCBEYXRhUHJvYmUgZnJvbSAnLi9EYXRhUHJvYmUuanMnO1xyXG5pbXBvcnQgUHJvamVjdGlsZU9iamVjdFR5cGUgZnJvbSAnLi9Qcm9qZWN0aWxlT2JqZWN0VHlwZS5qcyc7XHJcbmltcG9ydCBQcm9qZWN0aWxlTW90aW9uTW9kZWwgZnJvbSAnLi9Qcm9qZWN0aWxlTW90aW9uTW9kZWwuanMnO1xyXG5pbXBvcnQgeyBDb21wb3NpdGVTY2hlbWEgfSBmcm9tICcuLi8uLi8uLi8uLi90YW5kZW0vanMvdHlwZXMvU3RhdGVTY2hlbWEuanMnO1xyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBpc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uL3RhbmRlbS9qcy9pc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5LmpzJztcclxuXHJcbnR5cGUgVHJhamVjdG9yeU9wdGlvbnMgPSBFbXB0eVNlbGZPcHRpb25zICYgUGhldGlvT2JqZWN0T3B0aW9ucztcclxuXHJcbnR5cGUgTGFuZGVkRW1pdHRlclBhcmFtcyA9IHtcclxuICBuYW1lPzogc3RyaW5nO1xyXG4gIHBoZXRpb1R5cGU/OiBJT1R5cGU7XHJcbn07XHJcblxyXG50eXBlIFRyYWplY3RvcnlTdGF0ZU9iamVjdCA9IHtcclxuICBtYXNzOiBudW1iZXI7XHJcbiAgZGlhbWV0ZXI6IG51bWJlcjtcclxuICBkcmFnQ29lZmZpY2llbnQ6IG51bWJlcjtcclxuICBjaGFuZ2VkSW5NaWRBaXI6IGJvb2xlYW47XHJcbiAgcmVhY2hlZEdyb3VuZDogYm9vbGVhbjtcclxuICBhcGV4UG9pbnQ6IERhdGFQb2ludFN0YXRlT2JqZWN0IHwgbnVsbDtcclxuICBtYXhIZWlnaHQ6IG51bWJlcjtcclxuICBob3Jpem9udGFsRGlzcGxhY2VtZW50OiBudW1iZXI7XHJcbiAgZmxpZ2h0VGltZTogbnVtYmVyO1xyXG4gIGhhc0hpdFRhcmdldDogYm9vbGVhbjtcclxuICBwcm9qZWN0aWxlT2JqZWN0VHlwZTogUmVmZXJlbmNlSU9TdGF0ZTtcclxuICBpbml0aWFsU3BlZWQ6IG51bWJlcjtcclxuICBpbml0aWFsSGVpZ2h0OiBudW1iZXI7XHJcbiAgaW5pdGlhbEFuZ2xlOiBudW1iZXI7XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBUcmFqZWN0b3J5R3JvdXBDcmVhdGVFbGVtZW50QXJndW1lbnRzID0gWyBQcm9qZWN0aWxlT2JqZWN0VHlwZSwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciBdO1xyXG5cclxuY2xhc3MgVHJhamVjdG9yeSBleHRlbmRzIFBoZXRpb09iamVjdCB7XHJcbiAgcHVibGljIHJlYWRvbmx5IHByb2plY3RpbGVPYmplY3RUeXBlOiBQcm9qZWN0aWxlT2JqZWN0VHlwZTsgLy8gdGhlIHR5cGUgb2YgcHJvamVjdGlsZSBiZWluZyBsYXVuY2hlZFxyXG4gIHByaXZhdGUgcmVhZG9ubHkgbWFzczogbnVtYmVyOyAvLyBtYXNzIG9mIHByb2plY3RpbGVzIGluIGtpbG9ncmFtc1xyXG4gIHB1YmxpYyByZWFkb25seSBkaWFtZXRlcjogbnVtYmVyOyAvLyBkaWFtZXRlciBvZiBwcm9qZWN0aWxlcyBpbiBtZXRlcnNcclxuICBwdWJsaWMgcmVhZG9ubHkgZHJhZ0NvZWZmaWNpZW50OiBudW1iZXI7IC8vIGRyYWcgY29lZmZpY2llbnQgb2YgdGhlIHByb2plY3RpbGVzXHJcbiAgcHJpdmF0ZSByZWFkb25seSBpbml0aWFsU3BlZWQ6IG51bWJlcjsgLy8gbGF1bmNoIHNwZWVkIG9mIHRoZSBwcm9qZWN0aWxlc1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgaW5pdGlhbEhlaWdodDogbnVtYmVyOyAvLyBpbml0aWFsIGhlaWdodCBvZiB0aGUgcHJvamVjdGlsZXNcclxuICBwcml2YXRlIHJlYWRvbmx5IGluaXRpYWxBbmdsZTogbnVtYmVyOyAvLyBjYW5ub24gbGF1bmNoIGFuZ2xlXHJcbiAgcHJpdmF0ZSByZWFkb25seSBncmF2aXR5UHJvcGVydHk6IFByb3BlcnR5PG51bWJlcj47IC8vIHdvcmxkIGdyYXZpdHlcclxuICBwcml2YXRlIHJlYWRvbmx5IGFpckRlbnNpdHlQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8bnVtYmVyPjsgLy8gYWlyIGRlbnNpdHlcclxuICBwcml2YXRlIG51bWJlck9mTW92aW5nUHJvamVjdGlsZXNQcm9wZXJ0eTogUHJvcGVydHk8bnVtYmVyPjsgLy8gdGhlIG51bWJlciBvZiBwcm9qZWN0aWxlcyB0aGF0IGFyZSBjdXJyZW50bHkgaW4gZmxpZ2h0XHJcbiAgcHJpdmF0ZSByZWFkb25seSB1cGRhdGVUcmFqZWN0b3J5UmFua3NFbWl0dGVyOiBFbWl0dGVyOyAvLyBlbWl0dGVyIHRvIHVwZGF0ZSB0aGUgcmFua3Mgb2YgdGhlIHRyYWplY3Rvcmllc1xyXG4gIHB1YmxpYyBhcGV4UG9pbnQ6IERhdGFQb2ludCB8IG51bGw7IC8vIGNvbnRhaW5zIHJlZmVyZW5jZSB0byB0aGUgYXBleCBwb2ludCwgb3IgbnVsbCBpZiBhcGV4IHBvaW50IGRvZXNuJ3QgZXhpc3QvaGFzIGJlZW4gcmVjb3JkZWRcclxuICBwcml2YXRlIG1heEhlaWdodDogbnVtYmVyOyAvLyB0aGUgbWF4aW11bSBoZWlnaHQgcmVhY2hlZCBieSB0aGUgcHJvamVjdGlsZVxyXG4gIHByaXZhdGUgaG9yaXpvbnRhbERpc3BsYWNlbWVudDogbnVtYmVyOyAvLyB0aGUgaG9yaXpvbnRhbCBkaXNwbGFjZW1lbnQgb2YgdGhlIHByb2plY3RpbGUgZnJvbSBpdHMgbGF1bmNoIHBvaW50XHJcbiAgcHJpdmF0ZSBmbGlnaHRUaW1lOiBudW1iZXI7IC8vIHRoZSBob3Jpem9udGFsIGRpc3BsYWNlbWVudCBvZiB0aGUgcHJvamVjdGlsZSBmcm9tIGl0cyBsYXVuY2ggcG9pbnRcclxuICBwcml2YXRlIGNoZWNrSWZIaXRUYXJnZXQ6ICggcG9zaXRpb25YOiBudW1iZXIgKSA9PiBib29sZWFuOyAvLyB0aGUgY2FsbGJhY2sgZnJvbSB0aGUgY29tbW9uIFRhcmdldCB0byBjaGVjayBhbmQgcmV0dXJuIGlmIHRoZSBwcm9qZWN0aWxlIGhpdCB0aGUgdGFyZ2V0XHJcbiAgcHVibGljIGhhc0hpdFRhcmdldDogYm9vbGVhbjsgLy8gd2hldGhlciB0aGUgcHJvamVjdGlsZSBoYXMgaGl0IHRoZSB0YXJnZXRcclxuICBwcml2YXRlIGdldERhdGFQcm9iZTogKCkgPT4gRGF0YVByb2JlIHwgbnVsbDsgLy8gYWNjZXNzb3IgZm9yIERhdGFQcm9iZSBjb21wb25lbnRcclxuICBwdWJsaWMgcmFua1Byb3BlcnR5OiBQcm9wZXJ0eTxudW1iZXI+O1xyXG4gIHB1YmxpYyBjaGFuZ2VkSW5NaWRBaXI6IGJvb2xlYW47XHJcbiAgcHVibGljIHJlYWRvbmx5IGRhdGFQb2ludHM6IE9ic2VydmFibGVBcnJheTxEYXRhUG9pbnQ+O1xyXG4gIHB1YmxpYyByZWFjaGVkR3JvdW5kOiBib29sZWFuO1xyXG4gIHB1YmxpYyBwcm9qZWN0aWxlRGF0YVBvaW50UHJvcGVydHk6IFByb3BlcnR5PERhdGFQb2ludD47XHJcbiAgcHJpdmF0ZSB0cmFqZWN0b3J5TGFuZGVkRW1pdHRlcjogRW1pdHRlcjxMYW5kZWRFbWl0dGVyUGFyYW1zW10+O1xyXG4gIHByaXZhdGUgZGlzcG9zZVRyYWplY3Rvcnk6ICgpID0+IHZvaWQ7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggcHJvamVjdGlsZU9iamVjdFR5cGU6IFByb2plY3RpbGVPYmplY3RUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgcHJvamVjdGlsZU1hc3M6IG51bWJlcixcclxuICAgICAgICAgICAgICAgICAgICAgIHByb2plY3RpbGVEaWFtZXRlcjogbnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgcHJvamVjdGlsZURyYWdDb2VmZmljaWVudDogbnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbFNwZWVkOiBudW1iZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICBpbml0aWFsSGVpZ2h0OiBudW1iZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICBpbml0aWFsQW5nbGU6IG51bWJlcixcclxuICAgICAgICAgICAgICAgICAgICAgIGFpckRlbnNpdHlQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8bnVtYmVyPixcclxuICAgICAgICAgICAgICAgICAgICAgIGdyYXZpdHlQcm9wZXJ0eTogUHJvcGVydHk8bnVtYmVyPixcclxuICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVRyYWplY3RvcnlSYW5rc0VtaXR0ZXI6IEVtaXR0ZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICBudW1iZXJPZk1vdmluZ1Byb2plY3RpbGVzUHJvcGVydHk6IFByb3BlcnR5PG51bWJlcj4sXHJcbiAgICAgICAgICAgICAgICAgICAgICBjaGVja0lmSGl0VGFyZ2V0OiAoIHBvc2l0aW9uWDogbnVtYmVyICkgPT4gYm9vbGVhbixcclxuICAgICAgICAgICAgICAgICAgICAgIGdldERhdGFQcm9iZTogKCkgPT4gRGF0YVByb2JlIHwgbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICAgIHByb3ZpZGVkT3B0aW9ucz86IFRyYWplY3RvcnlPcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8VHJhamVjdG9yeU9wdGlvbnMsIEVtcHR5U2VsZk9wdGlvbnMsIFBoZXRpb09iamVjdE9wdGlvbnM+KCkoIHtcclxuICAgICAgdGFuZGVtOiBUYW5kZW0uUkVRVUlSRUQsXHJcbiAgICAgIHBoZXRpb0R5bmFtaWNFbGVtZW50OiB0cnVlLFxyXG4gICAgICBwaGV0aW9UeXBlOiBUcmFqZWN0b3J5LlRyYWplY3RvcnlJT1xyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgc3VwZXIoIG9wdGlvbnMgKTtcclxuXHJcbiAgICB0aGlzLnByb2plY3RpbGVPYmplY3RUeXBlID0gcHJvamVjdGlsZU9iamVjdFR5cGU7XHJcbiAgICB0aGlzLm1hc3MgPSBwcm9qZWN0aWxlTWFzcztcclxuICAgIHRoaXMuZGlhbWV0ZXIgPSBwcm9qZWN0aWxlRGlhbWV0ZXI7XHJcbiAgICB0aGlzLmRyYWdDb2VmZmljaWVudCA9IHByb2plY3RpbGVEcmFnQ29lZmZpY2llbnQ7XHJcbiAgICB0aGlzLmluaXRpYWxTcGVlZCA9IGluaXRpYWxTcGVlZDtcclxuICAgIHRoaXMuaW5pdGlhbEhlaWdodCA9IGluaXRpYWxIZWlnaHQ7XHJcbiAgICB0aGlzLmluaXRpYWxBbmdsZSA9IGluaXRpYWxBbmdsZTtcclxuICAgIHRoaXMuZ3Jhdml0eVByb3BlcnR5ID0gZ3Jhdml0eVByb3BlcnR5O1xyXG4gICAgdGhpcy5haXJEZW5zaXR5UHJvcGVydHkgPSBhaXJEZW5zaXR5UHJvcGVydHk7XHJcbiAgICB0aGlzLm51bWJlck9mTW92aW5nUHJvamVjdGlsZXNQcm9wZXJ0eSA9IG51bWJlck9mTW92aW5nUHJvamVjdGlsZXNQcm9wZXJ0eTtcclxuICAgIHRoaXMubnVtYmVyT2ZNb3ZpbmdQcm9qZWN0aWxlc1Byb3BlcnR5LnZhbHVlKys7XHJcbiAgICB0aGlzLnVwZGF0ZVRyYWplY3RvcnlSYW5rc0VtaXR0ZXIgPSB1cGRhdGVUcmFqZWN0b3J5UmFua3NFbWl0dGVyO1xyXG4gICAgdGhpcy5hcGV4UG9pbnQgPSBudWxsO1xyXG4gICAgdGhpcy5tYXhIZWlnaHQgPSB0aGlzLmluaXRpYWxIZWlnaHQ7XHJcbiAgICB0aGlzLmhvcml6b250YWxEaXNwbGFjZW1lbnQgPSAwO1xyXG4gICAgdGhpcy5mbGlnaHRUaW1lID0gMDtcclxuICAgIHRoaXMuY2hlY2tJZkhpdFRhcmdldCA9IGNoZWNrSWZIaXRUYXJnZXQ7XHJcbiAgICB0aGlzLmhhc0hpdFRhcmdldCA9IGZhbHNlO1xyXG4gICAgdGhpcy5nZXREYXRhUHJvYmUgPSBnZXREYXRhUHJvYmU7XHJcblxyXG4gICAgdGhpcy5yYW5rUHJvcGVydHkgPSBuZXcgTnVtYmVyUHJvcGVydHkoIDAsIHtcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdyYW5rUHJvcGVydHknICksXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246IGAkeydUaGUgY291bnQgb2YgaG93IG9sZCB0aGlzIHByb2plY3RpbGUgdHJhamVjdG9yeSBpcy4gT2xkZXIgdHJhamVjdG9yaWVzIGhhdmUgbW9yZSAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ29wYWNpdHkgdW50aWwgdGhleSBhcmUgc3Vic2VxdWVudGx5IHJlbW92ZWQuIFRoZSBtb3N0IHJlY2VudCB0cmFqZWN0b3J5IGZpcmVkIGhhcyByYW5rIDAuICcgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnVGhlIHNlY29uZCBtb3N0IHJlY2VudCBoYXMgcmFuayAxLid9YCxcclxuICAgICAgcGhldGlvUmVhZE9ubHk6IHRydWVcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBkaWQgdGhlIHRyYWplY3RvcnkgcGF0aCBjaGFuZ2UgaW4gbWlkYWlyIGR1ZSB0byBhaXIgZGVuc2l0eSBjaGFuZ2VcclxuICAgIHRoaXMuY2hhbmdlZEluTWlkQWlyID0gZmFsc2U7XHJcblxyXG4gICAgLy8gcmVjb3JkIHBvaW50cyBhbG9uZyB0aGUgdHJhamVjdG9yeSB3aXRoIGNyaXRpY2FsIGluZm9ybWF0aW9uXHJcbiAgICB0aGlzLmRhdGFQb2ludHMgPSBjcmVhdGVPYnNlcnZhYmxlQXJyYXkoIHtcclxuICAgICAgcGhldGlvVHlwZTogY3JlYXRlT2JzZXJ2YWJsZUFycmF5Lk9ic2VydmFibGVBcnJheUlPKCBEYXRhUG9pbnQuRGF0YVBvaW50SU8gKSxcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdkYXRhUG9pbnRzJyApLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnQW4gb3JkZXJlZCBsaXN0IG9mIGFsbCBkYXRhIHBvaW50cyB0YWtlbiBvbiB0aGlzIHRyYWplY3RvcnkuIFRoZSBlYXJsaWVzdCBkYXRhIHBvaW50ICcgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAnd2lsbCBiZSBmaXJzdCdcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBzZXQgYnkgVHJhamVjdG9yeUlPLmpzXHJcbiAgICB0aGlzLnJlYWNoZWRHcm91bmQgPSBmYWxzZTtcclxuXHJcbiAgICAvLyBBZGQgb25lIHRvIHRoZSByYW5rXHJcbiAgICBjb25zdCBpbmNyZW1lbnRSYW5rID0gKCkgPT4gdGhpcy5yYW5rUHJvcGVydHkudmFsdWUrKztcclxuXHJcbiAgICAvLyBMaXN0ZW4gdG8gd2hldGhlciB0aGlzIHJhbmsgc2hvdWxkIGJlIGluY3JlbWVudGVkXHJcbiAgICB0aGlzLnVwZGF0ZVRyYWplY3RvcnlSYW5rc0VtaXR0ZXIuYWRkTGlzdGVuZXIoIGluY3JlbWVudFJhbmsgKTtcclxuXHJcbiAgICAvLyBTZXQgdGhlIGluaXRpYWwgdmVsb2NpdHkgYmFzZWQgb24gdGhlIGluaXRpYWwgc3BlZWQgYW5kIGFuZ2xlXHJcbiAgICBjb25zdCB2ZWxvY2l0eSA9IFZlY3RvcjIucG9vbC5mZXRjaCgpLnNldFBvbGFyKCB0aGlzLmluaXRpYWxTcGVlZCwgKCB0aGlzLmluaXRpYWxBbmdsZSAqIE1hdGguUEkgKSAvIDE4MCApO1xyXG5cclxuICAgIGNvbnN0IGRyYWdGb3JjZSA9IHRoaXMuZHJhZ0ZvcmNlRm9yVmVsb2NpdHkoIHZlbG9jaXR5ICk7XHJcbiAgICBjb25zdCBhY2NlbGVyYXRpb24gPSB0aGlzLmFjY2VsZXJhdGlvbkZvckRyYWdGb3JjZSggZHJhZ0ZvcmNlICk7XHJcblxyXG4gICAgY29uc3QgaW5pdGlhbFBvaW50ID0gbmV3IERhdGFQb2ludCggMCwgVmVjdG9yMi5wb29sLmNyZWF0ZSggMCwgdGhpcy5pbml0aWFsSGVpZ2h0ICksIHRoaXMuYWlyRGVuc2l0eVByb3BlcnR5LnZhbHVlLFxyXG4gICAgICB2ZWxvY2l0eSwgYWNjZWxlcmF0aW9uLCBkcmFnRm9yY2UsIHRoaXMuZ3Jhdml0eUZvcmNlKCkgKTtcclxuXHJcbiAgICAvLyB0aGUgZGF0YSBwb2ludHMgYXBwbHkgdGhlaXIgb3duIHN0YXRlXHJcbiAgICAhaXNTZXR0aW5nUGhldGlvU3RhdGVQcm9wZXJ0eS52YWx1ZSAmJiB0aGlzLmFkZERhdGFQb2ludCggaW5pdGlhbFBvaW50ICk7XHJcblxyXG4gICAgLy8gVGhlIFwicHJvamVjdGlsZSBvYmplY3RcIiBpcyByZWFsbHkganVzdCB3aGF0IGRhdGEgcG9pbnQgdGhlIHByb2plY3RpbGUgaXMgY3VycmVudGx5IGF0LlxyXG4gICAgLy8gVE9ETzogdGhpcyBzaG91bGQgYmUgUGhFVC1pTyBpbnN0cnVtZW50ZWQgYXMgYSBSZWZlcmVuY2VJTywgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3Byb2plY3RpbGUtbW90aW9uL2lzc3Vlcy8yNjJcclxuICAgIHRoaXMucHJvamVjdGlsZURhdGFQb2ludFByb3BlcnR5ID0gbmV3IFByb3BlcnR5KCBpbml0aWFsUG9pbnQsIHsgcGhldGlvVmFsdWVUeXBlOiBEYXRhUG9pbnQuRGF0YVBvaW50SU8gfSApO1xyXG5cclxuICAgIHRoaXMudHJhamVjdG9yeUxhbmRlZEVtaXR0ZXIgPSBuZXcgRW1pdHRlcigge1xyXG4gICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ3RyYWplY3RvcnlMYW5kZWRFbWl0dGVyJyApLFxyXG4gICAgICBwYXJhbWV0ZXJzOiBbIHsgbmFtZTogJ3RyYWplY3RvcnknLCBwaGV0aW9UeXBlOiBUcmFqZWN0b3J5LlRyYWplY3RvcnlJTyB9IF1cclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLmRhdGFQb2ludHMuZWxlbWVudEFkZGVkRW1pdHRlci5hZGRMaXN0ZW5lciggYWRkZWREYXRhUG9pbnQgPT4ge1xyXG4gICAgICB0aGlzLm1heEhlaWdodCA9IE1hdGgubWF4KCBhZGRlZERhdGFQb2ludC5wb3NpdGlvbi55LCB0aGlzLm1heEhlaWdodCApO1xyXG4gICAgICB0aGlzLmhvcml6b250YWxEaXNwbGFjZW1lbnQgPSBhZGRlZERhdGFQb2ludC5wb3NpdGlvbi54O1xyXG4gICAgICB0aGlzLmZsaWdodFRpbWUgPSBhZGRlZERhdGFQb2ludC50aW1lO1xyXG5cclxuICAgICAgaWYgKCBhZGRlZERhdGFQb2ludC5yZWFjaGVkR3JvdW5kICkge1xyXG4gICAgICAgIHRoaXMudHJhamVjdG9yeUxhbmRlZEVtaXR0ZXIuZW1pdCggdGhpcyApO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5kaXNwb3NlVHJhamVjdG9yeSA9ICgpID0+IHtcclxuICAgICAgdGhpcy5hcGV4UG9pbnQgPSBudWxsOyAvLyByZW1vdmUgcmVmZXJlbmNlXHJcbiAgICAgIHRoaXMuZGF0YVBvaW50cy5kaXNwb3NlKCk7XHJcbiAgICAgIHRoaXMudHJhamVjdG9yeUxhbmRlZEVtaXR0ZXIuZGlzcG9zZSgpO1xyXG4gICAgICB0aGlzLnJhbmtQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICAgIHRoaXMudXBkYXRlVHJhamVjdG9yeVJhbmtzRW1pdHRlci5yZW1vdmVMaXN0ZW5lciggaW5jcmVtZW50UmFuayApO1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZ3Jhdml0eUZvcmNlKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gLXRoaXMuZ3Jhdml0eVByb3BlcnR5LnZhbHVlICogdGhpcy5tYXNzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIGRyYWdGb3JjZSAtIHRoZSBkcmFnIGZvcmNlIG9uIHRoZSBwcm9qZWN0aWxlXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhY2NlbGVyYXRpb25Gb3JEcmFnRm9yY2UoIGRyYWdGb3JjZTogVmVjdG9yMiApOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiBWZWN0b3IyLnBvb2wuZmV0Y2goKS5zZXRYWSggLWRyYWdGb3JjZS54IC8gdGhpcy5tYXNzLCAtdGhpcy5ncmF2aXR5UHJvcGVydHkudmFsdWUgLSBkcmFnRm9yY2UueSAvIHRoaXMubWFzcyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHZlbG9jaXR5IC0gdGhlIHZlbG9jaXR5IG9mIHRoZSBwcm9qZWN0aWxlXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBkcmFnRm9yY2VGb3JWZWxvY2l0eSggdmVsb2NpdHk6IFZlY3RvcjIgKTogVmVjdG9yMiB7XHJcbiAgICAvLyBjcm9zcy1zZWN0aW9uYWwgYXJlYSBvZiB0aGUgcHJvamVjdGlsZVxyXG4gICAgY29uc3QgYXJlYSA9ICggTWF0aC5QSSAqIHRoaXMuZGlhbWV0ZXIgKiB0aGlzLmRpYW1ldGVyICkgLyA0O1xyXG4gICAgcmV0dXJuIFZlY3RvcjIucG9vbC5mZXRjaCgpLnNldCggdmVsb2NpdHkgKS5tdWx0aXBseVNjYWxhcihcclxuICAgICAgMC41ICogdGhpcy5haXJEZW5zaXR5UHJvcGVydHkudmFsdWUgKiBhcmVhICogdGhpcy5kcmFnQ29lZmZpY2llbnQgKiB2ZWxvY2l0eS5tYWduaXR1ZGVcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RlcCggZHQ6IG51bWJlciApOiB2b2lkIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLnJlYWNoZWRHcm91bmQsICdUcmFqZWN0b3JpZXMgc2hvdWxkIG5vdCBzdGVwIGFmdGVyIHJlYWNoaW5nIGdyb3VuZCcgKTtcclxuXHJcbiAgICBjb25zdCBwcmV2aW91c1BvaW50ID0gdGhpcy5kYXRhUG9pbnRzLmdldCggdGhpcy5kYXRhUG9pbnRzLmxlbmd0aCAtIDEgKTtcclxuXHJcbiAgICBsZXQgbmV3WSA9IG5leHRQb3NpdGlvbiggcHJldmlvdXNQb2ludC5wb3NpdGlvbi55LCBwcmV2aW91c1BvaW50LnZlbG9jaXR5LnksIHByZXZpb3VzUG9pbnQuYWNjZWxlcmF0aW9uLnksIGR0ICk7XHJcblxyXG4gICAgaWYgKCBuZXdZIDw9IDAgKSB7XHJcbiAgICAgIG5ld1kgPSAwO1xyXG4gICAgICB0aGlzLnJlYWNoZWRHcm91bmQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNhcHBlZERlbHRhVGltZSA9IHRoaXMucmVhY2hlZEdyb3VuZCA/IHRpbWVUb0dyb3VuZCggcHJldmlvdXNQb2ludCApIDogZHQ7XHJcblxyXG4gICAgbGV0IG5ld1ggPSBuZXh0UG9zaXRpb24oIHByZXZpb3VzUG9pbnQucG9zaXRpb24ueCwgcHJldmlvdXNQb2ludC52ZWxvY2l0eS54LCBwcmV2aW91c1BvaW50LmFjY2VsZXJhdGlvbi54LCBjYXBwZWREZWx0YVRpbWUgKTtcclxuICAgIGxldCBuZXdWeCA9IHByZXZpb3VzUG9pbnQudmVsb2NpdHkueCArIHByZXZpb3VzUG9pbnQuYWNjZWxlcmF0aW9uLnggKiBjYXBwZWREZWx0YVRpbWU7XHJcbiAgICBjb25zdCBuZXdWeSA9IHByZXZpb3VzUG9pbnQudmVsb2NpdHkueSArIHByZXZpb3VzUG9pbnQuYWNjZWxlcmF0aW9uLnkgKiBjYXBwZWREZWx0YVRpbWU7XHJcblxyXG4gICAgLy8gaWYgZHJhZyBmb3JjZSByZXZlcnNlcyB0aGUgeC12ZWxvY2l0eSBpbiB0aGlzIHN0ZXAsIHNldCB2eCB0byB6ZXJvIHRvIGJldHRlciBhcHByb3hpbWF0ZSByZWFsaXR5XHJcbiAgICAvLyBXZSBkbyBub3QgbmVlZCB0byBkbyB0aGlzIGFkanVzdG1lbnQgZm9yIHRoZSB5IGRpcmVjdGlvbiBiZWNhdXNlIGdyYXZpdHkgaXMgYWxyZWFkeSByZXN1bHRpbmcgaW4gYSBjaGFuZ2UgaW5cclxuICAgIC8vIGRpcmVjdGlvbiwgYW5kIGJlY2F1c2Ugb3VyIGFpci1yZXNpc3RhbmNlIG1vZGVsIGlzIG5vdCAxMDAlIGFjY3VyYXRlIGFscmVhZHkgKHZpYSBsaW5lYXIgaW50ZXJwb2xhdGlvbikuXHJcbiAgICBpZiAoIE1hdGguc2lnbiggbmV3VnggKSAhPT0gTWF0aC5zaWduKCBwcmV2aW91c1BvaW50LnZlbG9jaXR5LnggKSApIHtcclxuICAgICAgY29uc3QgZGVsdGFUaW1lRm9yTGFyZ2VEcmFnRm9yY2VYID0gLTEgKiBwcmV2aW91c1BvaW50LnZlbG9jaXR5LnggLyBwcmV2aW91c1BvaW50LmFjY2VsZXJhdGlvbi54O1xyXG4gICAgICBuZXdYID0gbmV4dFBvc2l0aW9uKCBwcmV2aW91c1BvaW50LnBvc2l0aW9uLngsIHByZXZpb3VzUG9pbnQudmVsb2NpdHkueCwgcHJldmlvdXNQb2ludC5hY2NlbGVyYXRpb24ueCwgZGVsdGFUaW1lRm9yTGFyZ2VEcmFnRm9yY2VYICk7XHJcbiAgICAgIG5ld1Z4ID0gMDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBuZXdQb3NpdGlvbiA9IFZlY3RvcjIucG9vbC5mZXRjaCgpLnNldFhZKCBuZXdYLCBuZXdZICk7XHJcbiAgICBjb25zdCBuZXdWZWxvY2l0eSA9IFZlY3RvcjIucG9vbC5mZXRjaCgpLnNldFhZKCBuZXdWeCwgbmV3VnkgKTtcclxuICAgIGNvbnN0IG5ld0RyYWdGb3JjZSA9IHRoaXMuZHJhZ0ZvcmNlRm9yVmVsb2NpdHkoIG5ld1ZlbG9jaXR5ICk7XHJcbiAgICBjb25zdCBuZXdBY2NlbGVyYXRpb24gPSB0aGlzLmFjY2VsZXJhdGlvbkZvckRyYWdGb3JjZSggbmV3RHJhZ0ZvcmNlICk7XHJcblxyXG4gICAgLy9pZiB0aGUgYXBleCBoYXMgYmVlbiByZWFjaGVkXHJcbiAgICBpZiAoIHByZXZpb3VzUG9pbnQudmVsb2NpdHkueSA+IDAgJiYgbmV3VmVsb2NpdHkueSA8IDAgKSB7XHJcbiAgICAgIHRoaXMuaGFuZGxlQXBleCggcHJldmlvdXNQb2ludCApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG5ld1BvaW50ID0gbmV3IERhdGFQb2ludCggcHJldmlvdXNQb2ludC50aW1lICsgY2FwcGVkRGVsdGFUaW1lLCBuZXdQb3NpdGlvbiwgdGhpcy5haXJEZW5zaXR5UHJvcGVydHkudmFsdWUsXHJcbiAgICAgIG5ld1ZlbG9jaXR5LCBuZXdBY2NlbGVyYXRpb24sIG5ld0RyYWdGb3JjZSwgdGhpcy5ncmF2aXR5Rm9yY2UoKSwgeyByZWFjaGVkR3JvdW5kOiB0aGlzLnJlYWNoZWRHcm91bmQgfVxyXG4gICAgKTtcclxuXHJcbiAgICB0aGlzLmFkZERhdGFQb2ludCggbmV3UG9pbnQgKTtcclxuICAgIHRoaXMucHJvamVjdGlsZURhdGFQb2ludFByb3BlcnR5LnNldCggbmV3UG9pbnQgKTtcclxuXHJcbiAgICAvLyBtYWtlIHN1cmUgdGhlIGRhdGEgcG9pbnQgaXMgY3JlYXRlZCBiZWZvcmUgY2FsbGluZyBoYW5kbGVMYW5kZWQgYW5kIG5vdGlmeWluZyBhbnkgbGlzdGVuZXJzXHJcbiAgICB0aGlzLnJlYWNoZWRHcm91bmQgJiYgdGhpcy5oYW5kbGVMYW5kZWQoKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlTGFuZGVkKCk6IHZvaWQge1xyXG4gICAgdGhpcy50cmFqZWN0b3J5TGFuZGVkRW1pdHRlci5lbWl0KCB0aGlzICk7XHJcbiAgICB0aGlzLm51bWJlck9mTW92aW5nUHJvamVjdGlsZXNQcm9wZXJ0eS52YWx1ZS0tO1xyXG4gICAgY29uc3QgZGlzcGxhY2VtZW50ID0gdGhpcy5wcm9qZWN0aWxlRGF0YVBvaW50UHJvcGVydHkuZ2V0KCkucG9zaXRpb24ueDtcclxuXHJcbiAgICAvLyBjaGVja0lmSGl0VGFyZ2V0IGNhbGxzIGJhY2sgdG8gdGhlIHRhcmdldCBpbiB0aGUgY29tbW9uIG1vZGVsLCB3aGVyZSB0aGUgY2hlY2tpbmcgdGFrZXMgcGxhY2VcclxuICAgIHRoaXMuaGFzSGl0VGFyZ2V0ID0gdGhpcy5jaGVja0lmSGl0VGFyZ2V0KCBkaXNwbGFjZW1lbnQgKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlQXBleCggcHJldmlvdXNQb2ludDogRGF0YVBvaW50ICk6IHZvaWQge1xyXG4gICAgLy8gVGhlc2UgYXJlIGFsbCBhcHByb3hpbWF0aW9ucyBpZiB0aGVyZSBpcyBhaXIgcmVzaXN0YW5jZVxyXG4gICAgY29uc3QgZHRUb0FwZXggPSBNYXRoLmFicyggcHJldmlvdXNQb2ludC52ZWxvY2l0eS55IC8gcHJldmlvdXNQb2ludC5hY2NlbGVyYXRpb24ueSApO1xyXG4gICAgY29uc3QgYXBleFggPSBuZXh0UG9zaXRpb24oIHByZXZpb3VzUG9pbnQucG9zaXRpb24ueCwgcHJldmlvdXNQb2ludC52ZWxvY2l0eS54LCBwcmV2aW91c1BvaW50LmFjY2VsZXJhdGlvbi54LCBkdFRvQXBleCApO1xyXG4gICAgY29uc3QgYXBleFkgPSBuZXh0UG9zaXRpb24oIHByZXZpb3VzUG9pbnQucG9zaXRpb24ueSwgcHJldmlvdXNQb2ludC52ZWxvY2l0eS55LCBwcmV2aW91c1BvaW50LmFjY2VsZXJhdGlvbi55LCBkdFRvQXBleCApO1xyXG5cclxuICAgIGNvbnN0IGFwZXhWZWxvY2l0eVggPSBwcmV2aW91c1BvaW50LnZlbG9jaXR5LnggKyBwcmV2aW91c1BvaW50LmFjY2VsZXJhdGlvbi54ICogZHRUb0FwZXg7XHJcbiAgICBjb25zdCBhcGV4VmVsb2NpdHlZID0gMDsgLy8gYnkgZGVmaW5pdGlvbiB0aGlzIGlzIHdoYXQgbWFrZXMgaXQgdGhlIGFwZXhcclxuICAgIGNvbnN0IGFwZXhWZWxvY2l0eSA9IFZlY3RvcjIucG9vbC5mZXRjaCgpLnNldFhZKCBhcGV4VmVsb2NpdHlYLCBhcGV4VmVsb2NpdHlZICk7XHJcblxyXG4gICAgY29uc3QgYXBleERyYWdGb3JjZSA9IHRoaXMuZHJhZ0ZvcmNlRm9yVmVsb2NpdHkoIGFwZXhWZWxvY2l0eSApO1xyXG4gICAgY29uc3QgYXBleEFjY2VsZXJhdGlvbiA9IHRoaXMuYWNjZWxlcmF0aW9uRm9yRHJhZ0ZvcmNlKCBhcGV4RHJhZ0ZvcmNlICk7XHJcblxyXG4gICAgY29uc3QgYXBleFBvaW50ID0gbmV3IERhdGFQb2ludCggcHJldmlvdXNQb2ludC50aW1lICsgZHRUb0FwZXgsIFZlY3RvcjIucG9vbC5mZXRjaCgpLnNldFhZKCBhcGV4WCwgYXBleFkgKSxcclxuICAgICAgdGhpcy5haXJEZW5zaXR5UHJvcGVydHkudmFsdWUsIGFwZXhWZWxvY2l0eSwgYXBleEFjY2VsZXJhdGlvbiwgYXBleERyYWdGb3JjZSwgdGhpcy5ncmF2aXR5Rm9yY2UoKSxcclxuICAgICAgeyBhcGV4OiB0cnVlIH1cclxuICAgICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5hcGV4UG9pbnQgPT09IG51bGwsICdhbHJlYWR5IGhhdmUgYW4gYXBleCBwb2ludCcgKTtcclxuICAgIHRoaXMuYXBleFBvaW50ID0gYXBleFBvaW50OyAvLyBzYXZlIGFwZXggcG9pbnRcclxuICAgIHRoaXMuYWRkRGF0YVBvaW50KCBhcGV4UG9pbnQgKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYWRkRGF0YVBvaW50KCBkYXRhUG9pbnQ6IERhdGFQb2ludCApOiB2b2lkIHtcclxuICAgIHRoaXMuZGF0YVBvaW50cy5wdXNoKCBkYXRhUG9pbnQgKTtcclxuXHJcbiAgICAvLyB1cGRhdGUgZGF0YSBwcm9iZSBpZiBhcGV4IHBvaW50IGlzIHdpdGhpbiByYW5nZVxyXG4gICAgdGhpcy5nZXREYXRhUHJvYmUoKSAmJiB0aGlzLmdldERhdGFQcm9iZSgpPy51cGRhdGVEYXRhSWZXaXRoaW5SYW5nZSggZGF0YVBvaW50ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGaW5kcyB0aGUgZGF0YVBvaW50IGluIHRoaXMgdHJhamVjdG9yeSB3aXRoIHRoZSBsZWFzdCBldWNsaWRpYW4gZGlzdGFuY2UgdG8gY29vcmRpbmF0ZXMgZ2l2ZW4sXHJcbiAgICogb3IgcmV0dXJucyBudWxsIGlmIHRoaXMgdHJhamVjdG9yeSBoYXMgbm8gZGF0YXBvaW50c1xyXG4gICAqIEBwYXJhbSB4IC0gY29vcmRpbmF0ZSBpbiBtb2RlbFxyXG4gICAqIEBwYXJhbSB5IC0gY29vcmRpbmF0ZSBpbiBtb2RlbFxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXROZWFyZXN0UG9pbnQoIHg6IG51bWJlciwgeTogbnVtYmVyICk6IERhdGFQb2ludCB8IG51bGwge1xyXG4gICAgaWYgKCB0aGlzLmRhdGFQb2ludHMubGVuZ3RoID09PSAwICkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGaXJzdCwgc2V0IHRoZSBuZWFyZXN0IHBvaW50IGFuZCBjb3JyZXNwb25kaW5nIGRpc3RhbmNlIHRvIHRoZSBmaXJzdCBkYXRhcG9pbnQuXHJcbiAgICBsZXQgbmVhcmVzdFBvaW50ID0gdGhpcy5kYXRhUG9pbnRzLmdldCggMCApO1xyXG4gICAgbGV0IG1pbkRpc3RhbmNlID0gbmVhcmVzdFBvaW50LnBvc2l0aW9uLmRpc3RhbmNlWFkoIHgsIHkgKTtcclxuXHJcbiAgICAvLyBTZWFyY2ggdGhyb3VnaCBkYXRhcG9pbnRzIGZvciB0aGUgc21hbGxlc3QgZGlzdGFuY2UuIElmIHRoZXJlIGFyZSB0d28gZGF0YXBvaW50cyB3aXRoIGVxdWFsIGRpc3RhbmNlLCB0aGUgb25lXHJcbiAgICAvLyB3aXRoIG1vcmUgdGltZSBpcyBjaG9zZW4uXHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLmRhdGFQb2ludHMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRQb2ludCA9IHRoaXMuZGF0YVBvaW50cy5nZXQoIGkgKTtcclxuICAgICAgY29uc3QgY3VycmVudERpc3RhbmNlID0gY3VycmVudFBvaW50LnBvc2l0aW9uLmRpc3RhbmNlWFkoIHgsIHkgKTtcclxuXHJcbiAgICAgIGlmICggY3VycmVudERpc3RhbmNlIDw9IG1pbkRpc3RhbmNlICkge1xyXG4gICAgICAgIG5lYXJlc3RQb2ludCA9IGN1cnJlbnRQb2ludDtcclxuICAgICAgICBtaW5EaXN0YW5jZSA9IGN1cnJlbnREaXN0YW5jZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5lYXJlc3RQb2ludDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZSBhIFBoZXRpb0dyb3VwIGZvciB0aGUgdHJhamVjdG9yaWVzXHJcbiAgICogQHBhcmFtIG1vZGVsXHJcbiAgICogQHBhcmFtIHRhbmRlbVxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlR3JvdXAoIG1vZGVsOiBQcm9qZWN0aWxlTW90aW9uTW9kZWwsIHRhbmRlbTogVGFuZGVtICk6IFBoZXRpb0dyb3VwPFRyYWplY3RvcnksIFRyYWplY3RvcnlHcm91cENyZWF0ZUVsZW1lbnRBcmd1bWVudHM+IHtcclxuICAgIGNvbnN0IGNoZWNrSWZIaXRUYXJnZXQgPSBtb2RlbC50YXJnZXQuY2hlY2tJZkhpdFRhcmdldC5iaW5kKCBtb2RlbC50YXJnZXQgKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IFBoZXRpb0dyb3VwPFRyYWplY3RvcnksIFRyYWplY3RvcnlHcm91cENyZWF0ZUVsZW1lbnRBcmd1bWVudHM+KFxyXG4gICAgICAoIHRhbmRlbSwgcHJvamVjdGlsZU9iamVjdFR5cGUsIHByb2plY3RpbGVNYXNzLCBwcm9qZWN0aWxlRGlhbWV0ZXIsIHByb2plY3RpbGVEcmFnQ29lZmZpY2llbnQsXHJcbiAgICAgICAgaW5pdGlhbFNwZWVkLCBpbml0aWFsSGVpZ2h0LCBpbml0aWFsQW5nbGUgKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBUcmFqZWN0b3J5KCBwcm9qZWN0aWxlT2JqZWN0VHlwZSwgcHJvamVjdGlsZU1hc3MsIHByb2plY3RpbGVEaWFtZXRlciwgcHJvamVjdGlsZURyYWdDb2VmZmljaWVudCxcclxuICAgICAgICAgIGluaXRpYWxTcGVlZCwgaW5pdGlhbEhlaWdodCwgaW5pdGlhbEFuZ2xlLCBtb2RlbC5haXJEZW5zaXR5UHJvcGVydHksIG1vZGVsLmdyYXZpdHlQcm9wZXJ0eSxcclxuICAgICAgICAgIG1vZGVsLnVwZGF0ZVRyYWplY3RvcnlSYW5rc0VtaXR0ZXIsIG1vZGVsLm51bWJlck9mTW92aW5nUHJvamVjdGlsZXNQcm9wZXJ0eSwgY2hlY2tJZkhpdFRhcmdldCxcclxuICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIG1vZGVsLmRhdGFQcm9iZTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7IHRhbmRlbTogdGFuZGVtIH0gKTtcclxuICAgICAgfSxcclxuICAgICAgWyBtb2RlbC5zZWxlY3RlZFByb2plY3RpbGVPYmplY3RUeXBlUHJvcGVydHkudmFsdWUsXHJcbiAgICAgICAgbW9kZWwucHJvamVjdGlsZU1hc3NQcm9wZXJ0eS52YWx1ZSwgbW9kZWwucHJvamVjdGlsZURpYW1ldGVyUHJvcGVydHkudmFsdWUsXHJcbiAgICAgICAgbW9kZWwucHJvamVjdGlsZURyYWdDb2VmZmljaWVudFByb3BlcnR5LnZhbHVlLCBtb2RlbC5pbml0aWFsU3BlZWRQcm9wZXJ0eS52YWx1ZSxcclxuICAgICAgICBtb2RlbC5jYW5ub25IZWlnaHRQcm9wZXJ0eS52YWx1ZSwgbW9kZWwuY2Fubm9uQW5nbGVQcm9wZXJ0eS52YWx1ZSBdLFxyXG4gICAgICB7XHJcbiAgICAgICAgdGFuZGVtOiB0YW5kZW0sXHJcbiAgICAgICAgcGhldGlvVHlwZTogUGhldGlvR3JvdXAuUGhldGlvR3JvdXBJTyggVHJhamVjdG9yeS5UcmFqZWN0b3J5SU8gKSxcclxuICAgICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnVGhlIGNvbnRhaW5lciBmb3IgYW55IHRyYWplY3RvcnkgdGhhdCBpcyBjcmVhdGVkIHdoZW4gYSBwcm9qZWN0aWxlIGlzIGZpcmVkLidcclxuICAgICAgfVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERpc3Bvc2UgdGhpcyBUcmFqZWN0b3J5LCBmb3IgbWVtb3J5IG1hbmFnZW1lbnRcclxuICAgKi9cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuZGlzcG9zZVRyYWplY3RvcnkoKTtcclxuICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBtYXAgb2Ygc3RhdGUga2V5cyBhbmQgdGhlaXIgYXNzb2NpYXRlZCBJT1R5cGVzLCBzZWUgSU9UeXBlIGZvciBkZXRhaWxzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgZ2V0IFNUQVRFX1NDSEVNQSgpOiBDb21wb3NpdGVTY2hlbWE8VHJhamVjdG9yeVN0YXRlT2JqZWN0PiB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBtYXNzOiBOdW1iZXJJTyxcclxuICAgICAgZGlhbWV0ZXI6IE51bWJlcklPLFxyXG4gICAgICBkcmFnQ29lZmZpY2llbnQ6IE51bWJlcklPLFxyXG4gICAgICBjaGFuZ2VkSW5NaWRBaXI6IEJvb2xlYW5JTyxcclxuICAgICAgcmVhY2hlZEdyb3VuZDogQm9vbGVhbklPLFxyXG4gICAgICBhcGV4UG9pbnQ6IE51bGxhYmxlSU8oIERhdGFQb2ludC5EYXRhUG9pbnRJTyApLFxyXG4gICAgICBtYXhIZWlnaHQ6IE51bWJlcklPLFxyXG4gICAgICBob3Jpem9udGFsRGlzcGxhY2VtZW50OiBOdW1iZXJJTyxcclxuICAgICAgZmxpZ2h0VGltZTogTnVtYmVySU8sXHJcbiAgICAgIGhhc0hpdFRhcmdldDogQm9vbGVhbklPLFxyXG4gICAgICBwcm9qZWN0aWxlT2JqZWN0VHlwZTogUmVmZXJlbmNlSU8oXHJcbiAgICAgICAgUHJvamVjdGlsZU9iamVjdFR5cGUuUHJvamVjdGlsZU9iamVjdFR5cGVJT1xyXG4gICAgICApLFxyXG4gICAgICBpbml0aWFsU3BlZWQ6IE51bWJlcklPLFxyXG4gICAgICBpbml0aWFsSGVpZ2h0OiBOdW1iZXJJTyxcclxuICAgICAgaW5pdGlhbEFuZ2xlOiBOdW1iZXJJT1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEByZXR1cm5zIG1hcCBmcm9tIHN0YXRlIG9iamVjdCB0byBwYXJhbWV0ZXJzIGJlaW5nIHBhc3NlZCB0byBjcmVhdGVOZXh0RWxlbWVudFxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgc3RhdGVPYmplY3RUb0NyZWF0ZUVsZW1lbnRBcmd1bWVudHMoIHN0YXRlT2JqZWN0OiBUcmFqZWN0b3J5U3RhdGVPYmplY3QgKTogVHJhamVjdG9yeUdyb3VwQ3JlYXRlRWxlbWVudEFyZ3VtZW50cyB7XHJcbiAgICByZXR1cm4gW1xyXG4gICAgICBSZWZlcmVuY2VJTyggUHJvamVjdGlsZU9iamVjdFR5cGUuUHJvamVjdGlsZU9iamVjdFR5cGVJTyApLmZyb21TdGF0ZU9iamVjdCggc3RhdGVPYmplY3QucHJvamVjdGlsZU9iamVjdFR5cGUgKSxcclxuICAgICAgc3RhdGVPYmplY3QubWFzcyxcclxuICAgICAgc3RhdGVPYmplY3QuZGlhbWV0ZXIsXHJcbiAgICAgIHN0YXRlT2JqZWN0LmRyYWdDb2VmZmljaWVudCxcclxuICAgICAgc3RhdGVPYmplY3QuaW5pdGlhbFNwZWVkLFxyXG4gICAgICBzdGF0ZU9iamVjdC5pbml0aWFsSGVpZ2h0LFxyXG4gICAgICBzdGF0ZU9iamVjdC5pbml0aWFsQW5nbGVcclxuICAgIF07XHJcbiAgfVxyXG5cclxuICAvLyBOYW1lIHRoZSB0eXBlcyBuZWVkZWQgdG8gc2VyaWFsaXplIGVhY2ggZmllbGQgb24gdGhlIFRyYWplY3Rvcnkgc28gdGhhdCBpdCBjYW4gYmUgdXNlZCBpbiB0b1N0YXRlT2JqZWN0LCBmcm9tU3RhdGVPYmplY3QsIGFuZCBhcHBseVN0YXRlLlxyXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVHJhamVjdG9yeUlPID0gbmV3IElPVHlwZSggJ1RyYWplY3RvcnlJTycsIHtcclxuICAgIHZhbHVlVHlwZTogVHJhamVjdG9yeSxcclxuXHJcbiAgICBkb2N1bWVudGF0aW9uOiAnQSB0cmFqZWN0b3J5IG91dGxpbmluZyB0aGUgcHJvamVjdGlsZVxcJ3MgcGF0aC4gVGhlIGZvbGxvd2luZyBhcmUgcGFzc2VkIGludG8gdGhlIHN0YXRlIHNjaGVtYTonICtcclxuICAgICAgICAgICAgICAgICAgICc8dWw+JyArXHJcbiAgICAgICAgICAgICAgICAgICAnPGxpPm1hc3M6IHRoZSBtYXNzIG9mIHRoZSBwcm9qZWN0aWxlJyArXHJcbiAgICAgICAgICAgICAgICAgICAnPGxpPmRpYW1ldGVyOiB0aGUgZGlhbWV0ZXIgb2YgdGhlIHByb2plY3RpbGUnICtcclxuICAgICAgICAgICAgICAgICAgICc8bGk+ZHJhZ0NvZWZmaWNpZW50OiB0aGUgZHJhZyBjb2VmZmljaWVudCBvZiB0aGUgcHJvamVjdGlsZScgK1xyXG4gICAgICAgICAgICAgICAgICAgJzxsaT5pbml0aWFsU3BlZWQ6IHRoZSBpbml0aWFsIHNwZWVkIG9mIHRoZSBwcm9qZWN0aWxlJyArXHJcbiAgICAgICAgICAgICAgICAgICAnPGxpPmluaXRpYWxIZWlnaHQ6IHRoZSBpbml0aWFsIGhlaWdodCBvZiB0aGUgcHJvamVjdGlsZScgK1xyXG4gICAgICAgICAgICAgICAgICAgJzxsaT5pbml0aWFsQW5nbGU6IHRoZSBpbml0aWFsIGFuZ2xlIG9mIHRoZSBwcm9qZWN0aWxlJyArXHJcbiAgICAgICAgICAgICAgICAgICAnPC91bD4nLFxyXG4gICAgc3RhdGVTY2hlbWE6IFRyYWplY3RvcnkuU1RBVEVfU0NIRU1BLFxyXG4gICAgc3RhdGVPYmplY3RUb0NyZWF0ZUVsZW1lbnRBcmd1bWVudHM6IHMgPT4gVHJhamVjdG9yeS5zdGF0ZU9iamVjdFRvQ3JlYXRlRWxlbWVudEFyZ3VtZW50cyggcyApXHJcbiAgfSApO1xyXG59XHJcblxyXG4vLyBDYWxjdWxhdGUgdGhlIG5leHQgMS1kIHBvc2l0aW9uIHVzaW5nIHRoZSBiYXNpYyBraW5lbWF0aWMgZnVuY3Rpb24uXHJcbmNvbnN0IG5leHRQb3NpdGlvbiA9ICggcG9zaXRpb246IG51bWJlciwgdmVsb2NpdHk6IG51bWJlciwgYWNjZWxlcmF0aW9uOiBudW1iZXIsIHRpbWU6IG51bWJlciApID0+IHtcclxuICByZXR1cm4gcG9zaXRpb24gKyB2ZWxvY2l0eSAqIHRpbWUgKyAwLjUgKiBhY2NlbGVyYXRpb24gKiB0aW1lICogdGltZTtcclxufTtcclxuXHJcbmNvbnN0IHRpbWVUb0dyb3VuZCA9ICggcHJldmlvdXNQb2ludDogRGF0YVBvaW50ICk6IG51bWJlciA9PiB7XHJcbiAgaWYgKCBwcmV2aW91c1BvaW50LmFjY2VsZXJhdGlvbi55ID09PSAwICkge1xyXG4gICAgaWYgKCBwcmV2aW91c1BvaW50LnZlbG9jaXR5LnkgPT09IDAgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIGZhbHNlLCAnSG93IGRpZCBuZXdZIHJlYWNoIDw9MCBpZiB0aGVyZSB3YXMgbm8gdmVsb2NpdHkueT8nICk7XHJcbiAgICAgIHJldHVybiAwO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiAtcHJldmlvdXNQb2ludC5wb3NpdGlvbi55IC8gcHJldmlvdXNQb2ludC52ZWxvY2l0eS55O1xyXG4gICAgfVxyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGNvbnN0IHNxdWFyZVJvb3QgPSAtTWF0aC5zcXJ0KCBwcmV2aW91c1BvaW50LnZlbG9jaXR5LnkgKiBwcmV2aW91c1BvaW50LnZlbG9jaXR5LnkgLVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDIgKiBwcmV2aW91c1BvaW50LmFjY2VsZXJhdGlvbi55ICogcHJldmlvdXNQb2ludC5wb3NpdGlvbi55ICk7XHJcbiAgICByZXR1cm4gKCBzcXVhcmVSb290IC0gcHJldmlvdXNQb2ludC52ZWxvY2l0eS55ICkgLyBwcmV2aW91c1BvaW50LmFjY2VsZXJhdGlvbi55O1xyXG4gIH1cclxufTtcclxuXHJcbnByb2plY3RpbGVNb3Rpb24ucmVnaXN0ZXIoICdUcmFqZWN0b3J5JywgVHJhamVjdG9yeSApO1xyXG5leHBvcnQgZGVmYXVsdCBUcmFqZWN0b3J5OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EscUJBQXFCLE1BQTJCLDhDQUE4QztBQUNyRyxPQUFPQyxPQUFPLE1BQU0sZ0NBQWdDO0FBQ3BELE9BQU9DLGNBQWMsTUFBTSx1Q0FBdUM7QUFDbEUsT0FBT0MsUUFBUSxNQUFNLGlDQUFpQztBQUN0RCxPQUFPQyxPQUFPLE1BQU0sK0JBQStCO0FBQ25ELE9BQU9DLFNBQVMsTUFBNEIsdUNBQXVDO0FBQ25GLE9BQU9DLFdBQVcsTUFBTSxzQ0FBc0M7QUFDOUQsT0FBT0MsWUFBWSxNQUErQix1Q0FBdUM7QUFDekYsT0FBT0MsTUFBTSxNQUFNLGlDQUFpQztBQUNwRCxPQUFPQyxTQUFTLE1BQU0sMENBQTBDO0FBQ2hFLE9BQU9DLE1BQU0sTUFBTSx1Q0FBdUM7QUFDMUQsT0FBT0MsVUFBVSxNQUFNLDJDQUEyQztBQUNsRSxPQUFPQyxRQUFRLE1BQU0seUNBQXlDO0FBQzlELE9BQU9DLFdBQVcsTUFBNEIsNENBQTRDO0FBQzFGLE9BQU9DLGdCQUFnQixNQUFNLDJCQUEyQjtBQUN4RCxPQUFPQyxTQUFTLE1BQWdDLGdC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