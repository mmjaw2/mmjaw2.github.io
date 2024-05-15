// Copyright 2016-2024, University of Colorado Boulder

/**
 * Common model (base type) for Projectile Motion.
 *
 * @author Andrea Lin (PhET Interactive Simulations)
 * @author Matthew Blackman (PhET Interactive Simulations)
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import Emitter from '../../../../axon/js/Emitter.js';
import EnumerationProperty from '../../../../axon/js/EnumerationProperty.js';
import NumberProperty from '../../../../axon/js/NumberProperty.js';
import Property from '../../../../axon/js/Property.js';
import VarianceNumberProperty from '../../../../axon/js/VarianceNumberProperty.js';
import Range from '../../../../dot/js/Range.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import EventTimer, { ConstantEventModel } from '../../../../phet-core/js/EventTimer.js';
import optionize from '../../../../phet-core/js/optionize.js';
import PhysicalConstants from '../../../../phet-core/js/PhysicalConstants.js';
import TimeSpeed from '../../../../scenery-phet/js/TimeSpeed.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import BooleanIO from '../../../../tandem/js/types/BooleanIO.js';
import NumberIO from '../../../../tandem/js/types/NumberIO.js';
import ReferenceIO from '../../../../tandem/js/types/ReferenceIO.js';
import projectileMotion from '../../projectileMotion.js';
import ProjectileMotionConstants from '../ProjectileMotionConstants.js';
import StatUtils from '../StatUtils.js';
import DataProbe from './DataProbe.js';
import ProjectileMotionMeasuringTape from './ProjectileMotionMeasuringTape.js';
import ProjectileObjectType from './ProjectileObjectType.js';
import Target from './Target.js';
import Trajectory from './Trajectory.js';
import isSettingPhetioStateProperty from '../../../../tandem/js/isSettingPhetioStateProperty.js';

// constants
const MIN_ZOOM = ProjectileMotionConstants.MIN_ZOOM;
const MAX_ZOOM = ProjectileMotionConstants.MAX_ZOOM;
const DEFAULT_ZOOM = ProjectileMotionConstants.DEFAULT_ZOOM;
const TIME_PER_DATA_POINT = ProjectileMotionConstants.TIME_PER_DATA_POINT; // ms

class ProjectileMotionModel {
  // emits when cannon needs to update its muzzle flash animation

  // a group of trajectories, limited to this.maxProjectilesVSMField

  /**
   * @param defaultProjectileObjectType -  default object type for the model
   * @param defaultAirResistanceOn -  default air resistance on value
   * @param possibleObjectTypes - a list of the possible ProjectileObjectTypes for the model
   */
  constructor(defaultProjectileObjectType, defaultAirResistanceOn, possibleObjectTypes, tandem, providedOptions) {
    const options = optionize()({
      maxProjectiles: ProjectileMotionConstants.MAX_NUMBER_OF_TRAJECTORIES,
      defaultCannonHeight: 0,
      defaultCannonAngle: 80,
      defaultInitialSpeed: 18,
      defaultSpeedStandardDeviation: 0,
      defaultAngleStandardDeviation: 0,
      targetX: ProjectileMotionConstants.TARGET_X_DEFAULT,
      phetioInstrumentAltitudeProperty: true
    }, providedOptions);
    this.maxProjectiles = options.maxProjectiles;
    this.target = new Target(options.targetX, tandem.createTandem('target'));
    this.measuringTape = new ProjectileMotionMeasuringTape(tandem.createTandem('measuringTape'));
    this.cannonHeightProperty = new NumberProperty(options.defaultCannonHeight, {
      tandem: tandem.createTandem('cannonHeightProperty'),
      phetioDocumentation: 'Height of the cannon',
      units: 'm',
      range: ProjectileMotionConstants.CANNON_HEIGHT_RANGE
    });
    this.initialSpeedStandardDeviationProperty = new NumberProperty(options.defaultSpeedStandardDeviation, {
      tandem: tandem.createTandem('initialSpeedStandardDeviationProperty'),
      phetioDocumentation: 'The standard deviation of the launch speed',
      units: 'm/s',
      range: new Range(0, 10)
    });
    this.initialSpeedProperty = new VarianceNumberProperty(options.defaultInitialSpeed, value => {
      return StatUtils.randomFromNormal(value, this.initialSpeedStandardDeviationProperty.value);
    }, {
      tandem: tandem.createTandem('initialSpeedProperty'),
      phetioDocumentation: 'The speed on launch',
      units: 'm/s',
      range: ProjectileMotionConstants.LAUNCH_VELOCITY_RANGE
    });
    this.initialAngleStandardDeviationProperty = new NumberProperty(options.defaultAngleStandardDeviation, {
      tandem: tandem.createTandem('initialAngleStandardDeviationProperty'),
      phetioDocumentation: 'The standard deviation of the launch angle',
      units: '\u00B0',
      // degrees
      range: new Range(0, 30)
    });
    this.cannonAngleProperty = new VarianceNumberProperty(options.defaultCannonAngle, value => {
      return StatUtils.randomFromNormal(value, this.initialAngleStandardDeviationProperty.value);
    }, {
      tandem: tandem.createTandem('cannonAngleProperty'),
      phetioDocumentation: 'Angle of the cannon',
      units: '\u00B0',
      // degrees
      range: ProjectileMotionConstants.CANNON_ANGLE_RANGE
    });
    this.projectileMassProperty = new NumberProperty(defaultProjectileObjectType.mass, {
      tandem: tandem.createTandem('projectileMassProperty'),
      phetioDocumentation: 'Mass of the projectile',
      units: 'kg',
      range: ProjectileMotionConstants.PROJECTILE_MASS_RANGE
    });
    this.projectileDiameterProperty = new NumberProperty(defaultProjectileObjectType.diameter, {
      tandem: tandem.createTandem('projectileDiameterProperty'),
      phetioDocumentation: 'Diameter of the projectile',
      units: 'm',
      range: ProjectileMotionConstants.PROJECTILE_DIAMETER_RANGE
    });
    this.projectileDragCoefficientProperty = new NumberProperty(defaultProjectileObjectType.dragCoefficient, {
      tandem: tandem.createTandem('projectileDragCoefficientProperty'),
      phetioDocumentation: 'Drag coefficient of the projectile, unitless as it is a coefficient',
      range: ProjectileMotionConstants.PROJECTILE_DRAG_COEFFICIENT_RANGE
    });
    this.selectedProjectileObjectTypeProperty = new Property(defaultProjectileObjectType, {
      tandem: tandem.createTandem('selectedProjectileObjectTypeProperty'),
      phetioDocumentation: 'The currently selected projectile object type',
      phetioValueType: ReferenceIO(ProjectileObjectType.ProjectileObjectTypeIO),
      validValues: possibleObjectTypes
    });
    this.gravityProperty = new NumberProperty(PhysicalConstants.GRAVITY_ON_EARTH, {
      tandem: tandem.createTandem('gravityProperty'),
      phetioDocumentation: 'Acceleration due to gravity',
      units: 'm/s^2'
    });
    this.altitudeProperty = new NumberProperty(0, {
      tandem: options.phetioInstrumentAltitudeProperty ? tandem.createTandem('altitudeProperty') : Tandem.OPT_OUT,
      phetioDocumentation: 'Altitude of the environment',
      range: ProjectileMotionConstants.ALTITUDE_RANGE,
      units: 'm'
    });
    this.airResistanceOnProperty = new BooleanProperty(defaultAirResistanceOn, {
      tandem: tandem.createTandem('airResistanceOnProperty'),
      phetioDocumentation: 'Whether air resistance is on'
    });
    this.airDensityProperty = new DerivedProperty([this.altitudeProperty, this.airResistanceOnProperty], calculateAirDensity, {
      tandem: tandem.createTandem('airDensityProperty'),
      units: 'kg/m^3',
      phetioDocumentation: 'air density, depends on altitude and whether air resistance is on',
      phetioValueType: NumberIO
    });
    this.timeSpeedProperty = new EnumerationProperty(TimeSpeed.NORMAL, {
      validValues: [TimeSpeed.NORMAL, TimeSpeed.SLOW],
      tandem: tandem.createTandem('timeSpeedProperty'),
      phetioDocumentation: 'Speed of animation, either normal or slow.'
    });
    this.isPlayingProperty = new BooleanProperty(true, {
      tandem: tandem.createTandem('isPlayingProperty'),
      phetioDocumentation: 'whether animation is playing (as opposed to paused)'
    });
    this.davidHeight = 2; // meters
    this.davidPosition = new Vector2(7, 0); // meters

    this.numberOfMovingProjectilesProperty = new NumberProperty(0, {
      tandem: tandem.createTandem('numberOfMovingProjectilesProperty'),
      phetioReadOnly: true,
      phetioDocumentation: 'number of projectiles that are still moving'
    });
    this.rapidFireModeProperty = new BooleanProperty(false, {
      tandem: tandem.createTandem('rapidFireModeProperty'),
      phetioDocumentation: 'Is the stats screen in rapid-fire mode?'
    });
    this.fireEnabledProperty = new DerivedProperty([this.numberOfMovingProjectilesProperty, this.rapidFireModeProperty], (numMoving, rapidFireMode) => !rapidFireMode && numMoving < this.maxProjectiles, {
      tandem: tandem.createTandem('fireEnabledProperty'),
      phetioDocumentation: `The fire button is only enabled if there are less than ${this.maxProjectiles} projectiles in the air.`,
      phetioValueType: BooleanIO
    });
    this.updateTrajectoryRanksEmitter = new Emitter();
    this.eventTimer = new EventTimer(new ConstantEventModel(1000 / TIME_PER_DATA_POINT), this.stepModelElements.bind(this, TIME_PER_DATA_POINT / 1000));
    this.muzzleFlashStepper = new Emitter({
      parameters: [{
        valueType: 'number'
      }]
    });
    this.zoomProperty = new NumberProperty(DEFAULT_ZOOM, {
      tandem: tandem.createTandem('zoomProperty'),
      range: new Range(MIN_ZOOM, MAX_ZOOM),
      phetioDocumentation: 'Used to adjust to visual zoom for this screen. Each new zoom level increases the value by a factor of 2.',
      phetioReadOnly: true
    });

    // Create this after model properties to support the PhetioGroup creating the prototype immediately
    this.trajectoryGroup = Trajectory.createGroup(this, tandem.createTandem('trajectoryGroup'));
    this.dataProbe = new DataProbe(this.trajectoryGroup, 10, 10, this.zoomProperty, tandem.createTandem('dataProbe')); // position arbitrary

    // Links in this constructor last for the lifetime of the sim, so no need to dispose

    // if any of the global Properties change, update the status of moving projectiles
    this.airDensityProperty.link(() => {
      if (!isSettingPhetioStateProperty.value) {
        this.markMovingTrajectoriesChangedMidAir();
      }
    });
    this.gravityProperty.link(() => {
      if (!isSettingPhetioStateProperty.value) {
        this.markMovingTrajectoriesChangedMidAir();
      }
    });
    this.selectedProjectileObjectTypeProperty.link(selectedProjectileObjectType => {
      if (!isSettingPhetioStateProperty.value) {
        this.setProjectileParameters(selectedProjectileObjectType);
      }
    });
  }
  reset() {
    // disposes all trajectories and resets number of moving projectiles Property
    this.eraseTrajectories();
    this.target.reset();
    this.measuringTape.reset();
    this.dataProbe.reset();
    this.zoomProperty.reset();
    this.cannonHeightProperty.reset();
    this.cannonAngleProperty.reset();
    this.initialAngleStandardDeviationProperty.reset();
    this.initialSpeedProperty.reset();
    this.initialSpeedStandardDeviationProperty.reset();
    this.selectedProjectileObjectTypeProperty.reset();
    this.projectileMassProperty.reset();
    this.projectileDiameterProperty.reset();
    this.projectileDragCoefficientProperty.reset();
    this.gravityProperty.reset();
    this.altitudeProperty.reset();
    this.airResistanceOnProperty.reset();
    this.timeSpeedProperty.reset();
    this.isPlayingProperty.reset();
    this.rapidFireModeProperty.reset();
    this.muzzleFlashStepper.emit(0);
  }
  step(dt) {
    if (this.isPlayingProperty.value) {
      this.eventTimer.step((this.timeSpeedProperty.value === TimeSpeed.SLOW ? 0.33 : 1) * dt);
    }
  }

  // Steps model elements given a time step, used by the step button
  stepModelElements(dt) {
    for (let i = 0; i < this.trajectoryGroup.count; i++) {
      const trajectory = this.trajectoryGroup.getElement(i);
      if (!trajectory.reachedGround) {
        trajectory.step(dt);
      }
    }
    this.muzzleFlashStepper.emit(dt);
  }

  // Remove and dispose old trajectories that are over the limit from the observable array
  limitTrajectories() {
    // create a temporary array to hold all trajectories to be disposed, to avoid array mutation of trajectoryGroup while looping
    const trajectoriesToDispose = [];
    const numTrajectoriesToDispose = this.trajectoryGroup.count - this.maxProjectiles;
    if (numTrajectoriesToDispose > 0) {
      for (let i = 0; i < this.trajectoryGroup.count; i++) {
        const trajectory = this.trajectoryGroup.getElement(i);
        if (trajectory.reachedGround) {
          trajectoriesToDispose.push(trajectory);
          if (trajectoriesToDispose.length >= numTrajectoriesToDispose) {
            break;
          }
        }
      }
      trajectoriesToDispose.forEach(t => this.trajectoryGroup.disposeElement(t));
    }
  }

  // Removes all trajectories and resets corresponding Properties
  eraseTrajectories() {
    this.trajectoryGroup.clear();
    this.numberOfMovingProjectilesProperty.reset();
  }

  /**
   * @param numProjectiles - the number of simultaneous projectiles to fire
   */
  fireNumProjectiles(numProjectiles) {
    for (let i = 0; i < numProjectiles; i++) {
      const initialSpeed = this.initialSpeedProperty.getRandomizedValue();
      const initialAngle = this.cannonAngleProperty.getRandomizedValue();
      this.trajectoryGroup.createNextElement(this.selectedProjectileObjectTypeProperty.value, this.projectileMassProperty.value, this.projectileDiameterProperty.value, this.projectileDragCoefficientProperty.value, initialSpeed, this.cannonHeightProperty.value, initialAngle);
      this.updateTrajectoryRanksEmitter.emit(); // increment rank of all trajectories
    }
    this.limitTrajectories();
  }

  // Set changedInMidAir to true for trajectories with currently moving projectiles
  markMovingTrajectoriesChangedMidAir() {
    let trajectory;
    for (let j = 0; j < this.trajectoryGroup.count; j++) {
      trajectory = this.trajectoryGroup.getElement(j);

      // Trajectory has not reached ground
      if (!trajectory.changedInMidAir && !trajectory.reachedGround) {
        trajectory.changedInMidAir = true;
      }
    }
  }

  /**
   * Set mass, diameter, and drag coefficient based on the currently selected projectile object type
   * @param selectedProjectileObjectType - contains information such as mass, diameter, etc.
   */
  setProjectileParameters(selectedProjectileObjectType) {
    this.projectileMassProperty.set(selectedProjectileObjectType.mass);
    this.projectileDiameterProperty.set(selectedProjectileObjectType.diameter);
    this.projectileDragCoefficientProperty.set(selectedProjectileObjectType.dragCoefficient);
  }
}

/**
 * @param altitude - in meters
 * @param airResistanceOn - if off, zero air density
 */
const calculateAirDensity = (altitude, airResistanceOn) => {
  // Atmospheric model algorithm is taken from https://www.grc.nasa.gov/www/k-12/airplane/atmosmet.html
  // Checked the values at http://www.engineeringtoolbox.com/standard-atmosphere-d_604.html

  if (airResistanceOn) {
    let temperature;
    let pressure;

    // The sim doesn't go beyond 5000, rendering the elses unnecessary, but keeping if others would like to
    // increase the altitude range.

    if (altitude < 11000) {
      // troposphere
      temperature = 15.04 - 0.00649 * altitude;
      pressure = 101.29 * Math.pow((temperature + 273.1) / 288.08, 5.256);
    } else if (altitude < 25000) {
      // lower stratosphere
      temperature = -56.46;
      pressure = 22.65 * Math.exp(1.73 - 0.000157 * altitude);
    } else {
      // upper stratosphere (altitude >= 25000 meters)
      temperature = -131.21 + 0.00299 * altitude;
      pressure = 2.488 * Math.pow((temperature + 273.1) / 216.6, -11.388);
    }
    return pressure / (0.2869 * (temperature + 273.1));
  } else {
    return 0;
  }
};
projectileMotion.register('ProjectileMotionModel', ProjectileMotionModel);
export default ProjectileMotionModel;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJEZXJpdmVkUHJvcGVydHkiLCJFbWl0dGVyIiwiRW51bWVyYXRpb25Qcm9wZXJ0eSIsIk51bWJlclByb3BlcnR5IiwiUHJvcGVydHkiLCJWYXJpYW5jZU51bWJlclByb3BlcnR5IiwiUmFuZ2UiLCJWZWN0b3IyIiwiRXZlbnRUaW1lciIsIkNvbnN0YW50RXZlbnRNb2RlbCIsIm9wdGlvbml6ZSIsIlBoeXNpY2FsQ29uc3RhbnRzIiwiVGltZVNwZWVkIiwiVGFuZGVtIiwiQm9vbGVhbklPIiwiTnVtYmVySU8iLCJSZWZlcmVuY2VJTyIsInByb2plY3RpbGVNb3Rpb24iLCJQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzIiwiU3RhdFV0aWxzIiwiRGF0YVByb2JlIiwiUHJvamVjdGlsZU1vdGlvbk1lYXN1cmluZ1RhcGUiLCJQcm9qZWN0aWxlT2JqZWN0VHlwZSIsIlRhcmdldCIsIlRyYWplY3RvcnkiLCJpc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5IiwiTUlOX1pPT00iLCJNQVhfWk9PTSIsIkRFRkFVTFRfWk9PTSIsIlRJTUVfUEVSX0RBVEFfUE9JTlQiLCJQcm9qZWN0aWxlTW90aW9uTW9kZWwiLCJjb25zdHJ1Y3RvciIsImRlZmF1bHRQcm9qZWN0aWxlT2JqZWN0VHlwZSIsImRlZmF1bHRBaXJSZXNpc3RhbmNlT24iLCJwb3NzaWJsZU9iamVjdFR5cGVzIiwidGFuZGVtIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsIm1heFByb2plY3RpbGVzIiwiTUFYX05VTUJFUl9PRl9UUkFKRUNUT1JJRVMiLCJkZWZhdWx0Q2Fubm9uSGVpZ2h0IiwiZGVmYXVsdENhbm5vbkFuZ2xlIiwiZGVmYXVsdEluaXRpYWxTcGVlZCIsImRlZmF1bHRTcGVlZFN0YW5kYXJkRGV2aWF0aW9uIiwiZGVmYXVsdEFuZ2xlU3RhbmRhcmREZXZpYXRpb24iLCJ0YXJnZXRYIiwiVEFSR0VUX1hfREVGQVVMVCIsInBoZXRpb0luc3RydW1lbnRBbHRpdHVkZVByb3BlcnR5IiwidGFyZ2V0IiwiY3JlYXRlVGFuZGVtIiwibWVhc3VyaW5nVGFwZSIsImNhbm5vbkhlaWdodFByb3BlcnR5IiwicGhldGlvRG9jdW1lbnRhdGlvbiIsInVuaXRzIiwicmFuZ2UiLCJDQU5OT05fSEVJR0hUX1JBTkdFIiwiaW5pdGlhbFNwZWVkU3RhbmRhcmREZXZpYXRpb25Qcm9wZXJ0eSIsImluaXRpYWxTcGVlZFByb3BlcnR5IiwidmFsdWUiLCJyYW5kb21Gcm9tTm9ybWFsIiwiTEFVTkNIX1ZFTE9DSVRZX1JBTkdFIiwiaW5pdGlhbEFuZ2xlU3RhbmRhcmREZXZpYXRpb25Qcm9wZXJ0eSIsImNhbm5vbkFuZ2xlUHJvcGVydHkiLCJDQU5OT05fQU5HTEVfUkFOR0UiLCJwcm9qZWN0aWxlTWFzc1Byb3BlcnR5IiwibWFzcyIsIlBST0pFQ1RJTEVfTUFTU19SQU5HRSIsInByb2plY3RpbGVEaWFtZXRlclByb3BlcnR5IiwiZGlhbWV0ZXIiLCJQUk9KRUNUSUxFX0RJQU1FVEVSX1JBTkdFIiwicHJvamVjdGlsZURyYWdDb2VmZmljaWVudFByb3BlcnR5IiwiZHJhZ0NvZWZmaWNpZW50IiwiUFJPSkVDVElMRV9EUkFHX0NPRUZGSUNJRU5UX1JBTkdFIiwic2VsZWN0ZWRQcm9qZWN0aWxlT2JqZWN0VHlwZVByb3BlcnR5IiwicGhldGlvVmFsdWVUeXBlIiwiUHJvamVjdGlsZU9iamVjdFR5cGVJTyIsInZhbGlkVmFsdWVzIiwiZ3Jhdml0eVByb3BlcnR5IiwiR1JBVklUWV9PTl9FQVJUSCIsImFsdGl0dWRlUHJvcGVydHkiLCJPUFRfT1VUIiwiQUxUSVRVREVfUkFOR0UiLCJhaXJSZXNpc3RhbmNlT25Qcm9wZXJ0eSIsImFpckRlbnNpdHlQcm9wZXJ0eSIsImNhbGN1bGF0ZUFpckRlbnNpdHkiLCJ0aW1lU3BlZWRQcm9wZXJ0eSIsIk5PUk1BTCIsIlNMT1ciLCJpc1BsYXlpbmdQcm9wZXJ0eSIsImRhdmlkSGVpZ2h0IiwiZGF2aWRQb3NpdGlvbiIsIm51bWJlck9mTW92aW5nUHJvamVjdGlsZXNQcm9wZXJ0eSIsInBoZXRpb1JlYWRPbmx5IiwicmFwaWRGaXJlTW9kZVByb3BlcnR5IiwiZmlyZUVuYWJsZWRQcm9wZXJ0eSIsIm51bU1vdmluZyIsInJhcGlkRmlyZU1vZGUiLCJ1cGRhdGVUcmFqZWN0b3J5UmFua3NFbWl0dGVyIiwiZXZlbnRUaW1lciIsInN0ZXBNb2RlbEVsZW1lbnRzIiwiYmluZCIsIm11enpsZUZsYXNoU3RlcHBlciIsInBhcmFtZXRlcnMiLCJ2YWx1ZVR5cGUiLCJ6b29tUHJvcGVydHkiLCJ0cmFqZWN0b3J5R3JvdXAiLCJjcmVhdGVHcm91cCIsImRhdGFQcm9iZSIsImxpbmsiLCJtYXJrTW92aW5nVHJhamVjdG9yaWVzQ2hhbmdlZE1pZEFpciIsInNlbGVjdGVkUHJvamVjdGlsZU9iamVjdFR5cGUiLCJzZXRQcm9qZWN0aWxlUGFyYW1ldGVycyIsInJlc2V0IiwiZXJhc2VUcmFqZWN0b3JpZXMiLCJlbWl0Iiwic3RlcCIsImR0IiwiaSIsImNvdW50IiwidHJhamVjdG9yeSIsImdldEVsZW1lbnQiLCJyZWFjaGVkR3JvdW5kIiwibGltaXRUcmFqZWN0b3JpZXMiLCJ0cmFqZWN0b3JpZXNUb0Rpc3Bvc2UiLCJudW1UcmFqZWN0b3JpZXNUb0Rpc3Bvc2UiLCJwdXNoIiwibGVuZ3RoIiwiZm9yRWFjaCIsInQiLCJkaXNwb3NlRWxlbWVudCIsImNsZWFyIiwiZmlyZU51bVByb2plY3RpbGVzIiwibnVtUHJvamVjdGlsZXMiLCJpbml0aWFsU3BlZWQiLCJnZXRSYW5kb21pemVkVmFsdWUiLCJpbml0aWFsQW5nbGUiLCJjcmVhdGVOZXh0RWxlbWVudCIsImoiLCJjaGFuZ2VkSW5NaWRBaXIiLCJzZXQiLCJhbHRpdHVkZSIsImFpclJlc2lzdGFuY2VPbiIsInRlbXBlcmF0dXJlIiwicHJlc3N1cmUiLCJNYXRoIiwicG93IiwiZXhwIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJQcm9qZWN0aWxlTW90aW9uTW9kZWwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTYtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQ29tbW9uIG1vZGVsIChiYXNlIHR5cGUpIGZvciBQcm9qZWN0aWxlIE1vdGlvbi5cclxuICpcclxuICogQGF1dGhvciBBbmRyZWEgTGluIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIE1hdHRoZXcgQmxhY2ttYW4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IEJvb2xlYW5Qcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL0Jvb2xlYW5Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBEZXJpdmVkUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9EZXJpdmVkUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgRW1pdHRlciBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL0VtaXR0ZXIuanMnO1xyXG5pbXBvcnQgRW51bWVyYXRpb25Qcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL0VudW1lcmF0aW9uUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgTnVtYmVyUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9OdW1iZXJQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IFRSZWFkT25seVByb3BlcnR5IGZyb20gJy4uLy4uLy4uLy4uL2F4b24vanMvVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgVmFyaWFuY2VOdW1iZXJQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL1ZhcmlhbmNlTnVtYmVyUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgUmFuZ2UgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL1JhbmdlLmpzJztcclxuaW1wb3J0IFZlY3RvcjIgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL1ZlY3RvcjIuanMnO1xyXG5pbXBvcnQgVE1vZGVsIGZyb20gJy4uLy4uLy4uLy4uL2pvaXN0L2pzL1RNb2RlbC5qcyc7XHJcbmltcG9ydCBFdmVudFRpbWVyLCB7IENvbnN0YW50RXZlbnRNb2RlbCB9IGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9FdmVudFRpbWVyLmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IFBoeXNpY2FsQ29uc3RhbnRzIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9QaHlzaWNhbENvbnN0YW50cy5qcyc7XHJcbmltcG9ydCBUaW1lU3BlZWQgZnJvbSAnLi4vLi4vLi4vLi4vc2NlbmVyeS1waGV0L2pzL1RpbWVTcGVlZC5qcyc7XHJcbmltcG9ydCBQaGV0aW9Hcm91cCBmcm9tICcuLi8uLi8uLi8uLi90YW5kZW0vanMvUGhldGlvR3JvdXAuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uLy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgQm9vbGVhbklPIGZyb20gJy4uLy4uLy4uLy4uL3RhbmRlbS9qcy90eXBlcy9Cb29sZWFuSU8uanMnO1xyXG5pbXBvcnQgTnVtYmVySU8gZnJvbSAnLi4vLi4vLi4vLi4vdGFuZGVtL2pzL3R5cGVzL051bWJlcklPLmpzJztcclxuaW1wb3J0IFJlZmVyZW5jZUlPIGZyb20gJy4uLy4uLy4uLy4uL3RhbmRlbS9qcy90eXBlcy9SZWZlcmVuY2VJTy5qcyc7XHJcbmltcG9ydCBwcm9qZWN0aWxlTW90aW9uIGZyb20gJy4uLy4uL3Byb2plY3RpbGVNb3Rpb24uanMnO1xyXG5pbXBvcnQgUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cyBmcm9tICcuLi9Qcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLmpzJztcclxuaW1wb3J0IFN0YXRVdGlscyBmcm9tICcuLi9TdGF0VXRpbHMuanMnO1xyXG5pbXBvcnQgRGF0YVByb2JlIGZyb20gJy4vRGF0YVByb2JlLmpzJztcclxuaW1wb3J0IFByb2plY3RpbGVNb3Rpb25NZWFzdXJpbmdUYXBlIGZyb20gJy4vUHJvamVjdGlsZU1vdGlvbk1lYXN1cmluZ1RhcGUuanMnO1xyXG5pbXBvcnQgUHJvamVjdGlsZU9iamVjdFR5cGUgZnJvbSAnLi9Qcm9qZWN0aWxlT2JqZWN0VHlwZS5qcyc7XHJcbmltcG9ydCBUYXJnZXQgZnJvbSAnLi9UYXJnZXQuanMnO1xyXG5pbXBvcnQgVHJhamVjdG9yeSwgeyBUcmFqZWN0b3J5R3JvdXBDcmVhdGVFbGVtZW50QXJndW1lbnRzIH0gZnJvbSAnLi9UcmFqZWN0b3J5LmpzJztcclxuaW1wb3J0IGlzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vLi4vdGFuZGVtL2pzL2lzU2V0dGluZ1BoZXRpb1N0YXRlUHJvcGVydHkuanMnO1xyXG5cclxuLy8gY29uc3RhbnRzXHJcbmNvbnN0IE1JTl9aT09NID0gUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cy5NSU5fWk9PTTtcclxuY29uc3QgTUFYX1pPT00gPSBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLk1BWF9aT09NO1xyXG5jb25zdCBERUZBVUxUX1pPT00gPSBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLkRFRkFVTFRfWk9PTTtcclxuXHJcbmNvbnN0IFRJTUVfUEVSX0RBVEFfUE9JTlQgPSBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLlRJTUVfUEVSX0RBVEFfUE9JTlQ7IC8vIG1zXHJcblxyXG50eXBlIFByb2plY3RpbGVNb3Rpb25Nb2RlbE9wdGlvbnMgPSB7XHJcbiAgbWF4UHJvamVjdGlsZXM/OiBudW1iZXI7XHJcbiAgZGVmYXVsdENhbm5vbkhlaWdodD86IG51bWJlcjtcclxuICBkZWZhdWx0Q2Fubm9uQW5nbGU/OiBudW1iZXI7XHJcbiAgZGVmYXVsdEluaXRpYWxTcGVlZD86IG51bWJlcjtcclxuICBkZWZhdWx0U3BlZWRTdGFuZGFyZERldmlhdGlvbj86IG51bWJlcjtcclxuICBkZWZhdWx0QW5nbGVTdGFuZGFyZERldmlhdGlvbj86IG51bWJlcjtcclxuICB0YXJnZXRYPzogbnVtYmVyO1xyXG4gIHBoZXRpb0luc3RydW1lbnRBbHRpdHVkZVByb3BlcnR5PzogYm9vbGVhbjtcclxufTtcclxuXHJcbmNsYXNzIFByb2plY3RpbGVNb3Rpb25Nb2RlbCBpbXBsZW1lbnRzIFRNb2RlbCB7XHJcbiAgcHVibGljIG1heFByb2plY3RpbGVzOiBudW1iZXI7XHJcbiAgcHVibGljIHRhcmdldDogVGFyZ2V0O1xyXG4gIHB1YmxpYyBtZWFzdXJpbmdUYXBlOiBQcm9qZWN0aWxlTW90aW9uTWVhc3VyaW5nVGFwZTtcclxuICBwdWJsaWMgY2Fubm9uSGVpZ2h0UHJvcGVydHk6IFByb3BlcnR5PG51bWJlcj47XHJcbiAgcHVibGljIGluaXRpYWxTcGVlZFN0YW5kYXJkRGV2aWF0aW9uUHJvcGVydHk6IFByb3BlcnR5PG51bWJlcj47XHJcbiAgcHVibGljIGluaXRpYWxTcGVlZFByb3BlcnR5OiBWYXJpYW5jZU51bWJlclByb3BlcnR5O1xyXG4gIHB1YmxpYyBpbml0aWFsQW5nbGVTdGFuZGFyZERldmlhdGlvblByb3BlcnR5OiBQcm9wZXJ0eTxudW1iZXI+O1xyXG4gIHB1YmxpYyBjYW5ub25BbmdsZVByb3BlcnR5OiBWYXJpYW5jZU51bWJlclByb3BlcnR5O1xyXG4gIHB1YmxpYyBwcm9qZWN0aWxlTWFzc1Byb3BlcnR5OiBQcm9wZXJ0eTxudW1iZXI+O1xyXG4gIHB1YmxpYyBwcm9qZWN0aWxlRGlhbWV0ZXJQcm9wZXJ0eTogUHJvcGVydHk8bnVtYmVyPjtcclxuICBwdWJsaWMgcHJvamVjdGlsZURyYWdDb2VmZmljaWVudFByb3BlcnR5OiBQcm9wZXJ0eTxudW1iZXI+O1xyXG4gIHB1YmxpYyBzZWxlY3RlZFByb2plY3RpbGVPYmplY3RUeXBlUHJvcGVydHk6IFByb3BlcnR5PFByb2plY3RpbGVPYmplY3RUeXBlPjtcclxuICBwdWJsaWMgZ3Jhdml0eVByb3BlcnR5OiBQcm9wZXJ0eTxudW1iZXI+O1xyXG4gIHB1YmxpYyBhbHRpdHVkZVByb3BlcnR5OiBQcm9wZXJ0eTxudW1iZXI+O1xyXG4gIHB1YmxpYyBhaXJSZXNpc3RhbmNlT25Qcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcbiAgcHVibGljIGFpckRlbnNpdHlQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8bnVtYmVyPjtcclxuICBwdWJsaWMgdGltZVNwZWVkUHJvcGVydHk6IEVudW1lcmF0aW9uUHJvcGVydHk8VGltZVNwZWVkPjtcclxuICBwdWJsaWMgaXNQbGF5aW5nUHJvcGVydHk6IFByb3BlcnR5PGJvb2xlYW4+O1xyXG4gIHB1YmxpYyByZWFkb25seSBkYXZpZEhlaWdodDogbnVtYmVyO1xyXG4gIHB1YmxpYyByZWFkb25seSBkYXZpZFBvc2l0aW9uOiBWZWN0b3IyO1xyXG4gIHB1YmxpYyBudW1iZXJPZk1vdmluZ1Byb2plY3RpbGVzUHJvcGVydHk6IFByb3BlcnR5PG51bWJlcj47XHJcbiAgcHVibGljIHJhcGlkRmlyZU1vZGVQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcbiAgcHVibGljIGZpcmVFbmFibGVkUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+O1xyXG4gIHB1YmxpYyB1cGRhdGVUcmFqZWN0b3J5UmFua3NFbWl0dGVyOiBFbWl0dGVyO1xyXG4gIHByaXZhdGUgZXZlbnRUaW1lcjogRXZlbnRUaW1lcjtcclxuICBwdWJsaWMgbXV6emxlRmxhc2hTdGVwcGVyOiBFbWl0dGVyPFsgbnVtYmVyIF0+OyAvLyBlbWl0cyB3aGVuIGNhbm5vbiBuZWVkcyB0byB1cGRhdGUgaXRzIG11enpsZSBmbGFzaCBhbmltYXRpb25cclxuICBwdWJsaWMgem9vbVByb3BlcnR5OiBOdW1iZXJQcm9wZXJ0eTtcclxuICBwdWJsaWMgdHJhamVjdG9yeUdyb3VwOiBQaGV0aW9Hcm91cDxUcmFqZWN0b3J5LCBUcmFqZWN0b3J5R3JvdXBDcmVhdGVFbGVtZW50QXJndW1lbnRzPjsgLy8gYSBncm91cCBvZiB0cmFqZWN0b3JpZXMsIGxpbWl0ZWQgdG8gdGhpcy5tYXhQcm9qZWN0aWxlc1ZTTUZpZWxkXHJcbiAgcHVibGljIGRhdGFQcm9iZTogRGF0YVByb2JlO1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gZGVmYXVsdFByb2plY3RpbGVPYmplY3RUeXBlIC0gIGRlZmF1bHQgb2JqZWN0IHR5cGUgZm9yIHRoZSBtb2RlbFxyXG4gICAqIEBwYXJhbSBkZWZhdWx0QWlyUmVzaXN0YW5jZU9uIC0gIGRlZmF1bHQgYWlyIHJlc2lzdGFuY2Ugb24gdmFsdWVcclxuICAgKiBAcGFyYW0gcG9zc2libGVPYmplY3RUeXBlcyAtIGEgbGlzdCBvZiB0aGUgcG9zc2libGUgUHJvamVjdGlsZU9iamVjdFR5cGVzIGZvciB0aGUgbW9kZWxcclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIGRlZmF1bHRQcm9qZWN0aWxlT2JqZWN0VHlwZTogUHJvamVjdGlsZU9iamVjdFR5cGUsIGRlZmF1bHRBaXJSZXNpc3RhbmNlT246IGJvb2xlYW4sXHJcbiAgICAgICAgICAgICAgICAgICAgICBwb3NzaWJsZU9iamVjdFR5cGVzOiBQcm9qZWN0aWxlT2JqZWN0VHlwZVtdLCB0YW5kZW06IFRhbmRlbSwgcHJvdmlkZWRPcHRpb25zPzogUHJvamVjdGlsZU1vdGlvbk1vZGVsT3B0aW9ucyApIHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPFByb2plY3RpbGVNb3Rpb25Nb2RlbE9wdGlvbnM+KCkoIHtcclxuICAgICAgbWF4UHJvamVjdGlsZXM6IFByb2plY3RpbGVNb3Rpb25Db25zdGFudHMuTUFYX05VTUJFUl9PRl9UUkFKRUNUT1JJRVMsXHJcbiAgICAgIGRlZmF1bHRDYW5ub25IZWlnaHQ6IDAsXHJcbiAgICAgIGRlZmF1bHRDYW5ub25BbmdsZTogODAsXHJcbiAgICAgIGRlZmF1bHRJbml0aWFsU3BlZWQ6IDE4LFxyXG4gICAgICBkZWZhdWx0U3BlZWRTdGFuZGFyZERldmlhdGlvbjogMCxcclxuICAgICAgZGVmYXVsdEFuZ2xlU3RhbmRhcmREZXZpYXRpb246IDAsXHJcbiAgICAgIHRhcmdldFg6IFByb2plY3RpbGVNb3Rpb25Db25zdGFudHMuVEFSR0VUX1hfREVGQVVMVCxcclxuICAgICAgcGhldGlvSW5zdHJ1bWVudEFsdGl0dWRlUHJvcGVydHk6IHRydWVcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIHRoaXMubWF4UHJvamVjdGlsZXMgPSBvcHRpb25zLm1heFByb2plY3RpbGVzO1xyXG4gICAgdGhpcy50YXJnZXQgPSBuZXcgVGFyZ2V0KCBvcHRpb25zLnRhcmdldFgsIHRhbmRlbS5jcmVhdGVUYW5kZW0oICd0YXJnZXQnICkgKTtcclxuICAgIHRoaXMubWVhc3VyaW5nVGFwZSA9IG5ldyBQcm9qZWN0aWxlTW90aW9uTWVhc3VyaW5nVGFwZSggdGFuZGVtLmNyZWF0ZVRhbmRlbSggJ21lYXN1cmluZ1RhcGUnICkgKTtcclxuXHJcbiAgICB0aGlzLmNhbm5vbkhlaWdodFByb3BlcnR5ID0gbmV3IE51bWJlclByb3BlcnR5KCBvcHRpb25zLmRlZmF1bHRDYW5ub25IZWlnaHQsIHtcclxuICAgICAgdGFuZGVtOiB0YW5kZW0uY3JlYXRlVGFuZGVtKCAnY2Fubm9uSGVpZ2h0UHJvcGVydHknICksXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdIZWlnaHQgb2YgdGhlIGNhbm5vbicsXHJcbiAgICAgIHVuaXRzOiAnbScsXHJcbiAgICAgIHJhbmdlOiBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLkNBTk5PTl9IRUlHSFRfUkFOR0VcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLmluaXRpYWxTcGVlZFN0YW5kYXJkRGV2aWF0aW9uUHJvcGVydHkgPSBuZXcgTnVtYmVyUHJvcGVydHkoIG9wdGlvbnMuZGVmYXVsdFNwZWVkU3RhbmRhcmREZXZpYXRpb24sIHtcclxuICAgICAgdGFuZGVtOiB0YW5kZW0uY3JlYXRlVGFuZGVtKCAnaW5pdGlhbFNwZWVkU3RhbmRhcmREZXZpYXRpb25Qcm9wZXJ0eScgKSxcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ1RoZSBzdGFuZGFyZCBkZXZpYXRpb24gb2YgdGhlIGxhdW5jaCBzcGVlZCcsXHJcbiAgICAgIHVuaXRzOiAnbS9zJyxcclxuICAgICAgcmFuZ2U6IG5ldyBSYW5nZSggMCwgMTAgKVxyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuaW5pdGlhbFNwZWVkUHJvcGVydHkgPSBuZXcgVmFyaWFuY2VOdW1iZXJQcm9wZXJ0eSggb3B0aW9ucy5kZWZhdWx0SW5pdGlhbFNwZWVkLCB2YWx1ZSA9PiB7XHJcbiAgICAgIHJldHVybiBTdGF0VXRpbHMucmFuZG9tRnJvbU5vcm1hbCggdmFsdWUsIHRoaXMuaW5pdGlhbFNwZWVkU3RhbmRhcmREZXZpYXRpb25Qcm9wZXJ0eS52YWx1ZSApO1xyXG4gICAgfSwge1xyXG4gICAgICB0YW5kZW06IHRhbmRlbS5jcmVhdGVUYW5kZW0oICdpbml0aWFsU3BlZWRQcm9wZXJ0eScgKSxcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ1RoZSBzcGVlZCBvbiBsYXVuY2gnLFxyXG4gICAgICB1bml0czogJ20vcycsXHJcbiAgICAgIHJhbmdlOiBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLkxBVU5DSF9WRUxPQ0lUWV9SQU5HRVxyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuaW5pdGlhbEFuZ2xlU3RhbmRhcmREZXZpYXRpb25Qcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggb3B0aW9ucy5kZWZhdWx0QW5nbGVTdGFuZGFyZERldmlhdGlvbiwge1xyXG4gICAgICB0YW5kZW06IHRhbmRlbS5jcmVhdGVUYW5kZW0oICdpbml0aWFsQW5nbGVTdGFuZGFyZERldmlhdGlvblByb3BlcnR5JyApLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnVGhlIHN0YW5kYXJkIGRldmlhdGlvbiBvZiB0aGUgbGF1bmNoIGFuZ2xlJyxcclxuICAgICAgdW5pdHM6ICdcXHUwMEIwJywgLy8gZGVncmVlc1xyXG4gICAgICByYW5nZTogbmV3IFJhbmdlKCAwLCAzMCApXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5jYW5ub25BbmdsZVByb3BlcnR5ID0gbmV3IFZhcmlhbmNlTnVtYmVyUHJvcGVydHkoIG9wdGlvbnMuZGVmYXVsdENhbm5vbkFuZ2xlLCB2YWx1ZSA9PiB7XHJcbiAgICAgIHJldHVybiBTdGF0VXRpbHMucmFuZG9tRnJvbU5vcm1hbCggdmFsdWUsIHRoaXMuaW5pdGlhbEFuZ2xlU3RhbmRhcmREZXZpYXRpb25Qcm9wZXJ0eS52YWx1ZSApO1xyXG4gICAgfSwge1xyXG4gICAgICB0YW5kZW06IHRhbmRlbS5jcmVhdGVUYW5kZW0oICdjYW5ub25BbmdsZVByb3BlcnR5JyApLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnQW5nbGUgb2YgdGhlIGNhbm5vbicsXHJcbiAgICAgIHVuaXRzOiAnXFx1MDBCMCcsIC8vIGRlZ3JlZXNcclxuICAgICAgcmFuZ2U6IFByb2plY3RpbGVNb3Rpb25Db25zdGFudHMuQ0FOTk9OX0FOR0xFX1JBTkdFXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5wcm9qZWN0aWxlTWFzc1Byb3BlcnR5ID0gbmV3IE51bWJlclByb3BlcnR5KCBkZWZhdWx0UHJvamVjdGlsZU9iamVjdFR5cGUubWFzcywge1xyXG4gICAgICB0YW5kZW06IHRhbmRlbS5jcmVhdGVUYW5kZW0oICdwcm9qZWN0aWxlTWFzc1Byb3BlcnR5JyApLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnTWFzcyBvZiB0aGUgcHJvamVjdGlsZScsXHJcbiAgICAgIHVuaXRzOiAna2cnLFxyXG4gICAgICByYW5nZTogUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cy5QUk9KRUNUSUxFX01BU1NfUkFOR0VcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLnByb2plY3RpbGVEaWFtZXRlclByb3BlcnR5ID0gbmV3IE51bWJlclByb3BlcnR5KCBkZWZhdWx0UHJvamVjdGlsZU9iamVjdFR5cGUuZGlhbWV0ZXIsIHtcclxuICAgICAgdGFuZGVtOiB0YW5kZW0uY3JlYXRlVGFuZGVtKCAncHJvamVjdGlsZURpYW1ldGVyUHJvcGVydHknICksXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdEaWFtZXRlciBvZiB0aGUgcHJvamVjdGlsZScsXHJcbiAgICAgIHVuaXRzOiAnbScsXHJcbiAgICAgIHJhbmdlOiBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLlBST0pFQ1RJTEVfRElBTUVURVJfUkFOR0VcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLnByb2plY3RpbGVEcmFnQ29lZmZpY2llbnRQcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggZGVmYXVsdFByb2plY3RpbGVPYmplY3RUeXBlLmRyYWdDb2VmZmljaWVudCwge1xyXG4gICAgICB0YW5kZW06IHRhbmRlbS5jcmVhdGVUYW5kZW0oICdwcm9qZWN0aWxlRHJhZ0NvZWZmaWNpZW50UHJvcGVydHknICksXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246XHJcbiAgICAgICAgJ0RyYWcgY29lZmZpY2llbnQgb2YgdGhlIHByb2plY3RpbGUsIHVuaXRsZXNzIGFzIGl0IGlzIGEgY29lZmZpY2llbnQnLFxyXG4gICAgICByYW5nZTogUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cy5QUk9KRUNUSUxFX0RSQUdfQ09FRkZJQ0lFTlRfUkFOR0VcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLnNlbGVjdGVkUHJvamVjdGlsZU9iamVjdFR5cGVQcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eSggZGVmYXVsdFByb2plY3RpbGVPYmplY3RUeXBlLCB7XHJcbiAgICAgIHRhbmRlbTogdGFuZGVtLmNyZWF0ZVRhbmRlbSggJ3NlbGVjdGVkUHJvamVjdGlsZU9iamVjdFR5cGVQcm9wZXJ0eScgKSxcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ1RoZSBjdXJyZW50bHkgc2VsZWN0ZWQgcHJvamVjdGlsZSBvYmplY3QgdHlwZScsXHJcbiAgICAgIHBoZXRpb1ZhbHVlVHlwZTogUmVmZXJlbmNlSU8oIFByb2plY3RpbGVPYmplY3RUeXBlLlByb2plY3RpbGVPYmplY3RUeXBlSU8gKSxcclxuICAgICAgdmFsaWRWYWx1ZXM6IHBvc3NpYmxlT2JqZWN0VHlwZXNcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLmdyYXZpdHlQcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggUGh5c2ljYWxDb25zdGFudHMuR1JBVklUWV9PTl9FQVJUSCwge1xyXG4gICAgICB0YW5kZW06IHRhbmRlbS5jcmVhdGVUYW5kZW0oICdncmF2aXR5UHJvcGVydHknICksXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdBY2NlbGVyYXRpb24gZHVlIHRvIGdyYXZpdHknLFxyXG4gICAgICB1bml0czogJ20vc14yJ1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuYWx0aXR1ZGVQcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggMCwge1xyXG4gICAgICB0YW5kZW06IG9wdGlvbnMucGhldGlvSW5zdHJ1bWVudEFsdGl0dWRlUHJvcGVydHkgPyB0YW5kZW0uY3JlYXRlVGFuZGVtKCAnYWx0aXR1ZGVQcm9wZXJ0eScgKSA6IFRhbmRlbS5PUFRfT1VULFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnQWx0aXR1ZGUgb2YgdGhlIGVudmlyb25tZW50JyxcclxuICAgICAgcmFuZ2U6IFByb2plY3RpbGVNb3Rpb25Db25zdGFudHMuQUxUSVRVREVfUkFOR0UsXHJcbiAgICAgIHVuaXRzOiAnbSdcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLmFpclJlc2lzdGFuY2VPblByb3BlcnR5ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggZGVmYXVsdEFpclJlc2lzdGFuY2VPbiwge1xyXG4gICAgICB0YW5kZW06IHRhbmRlbS5jcmVhdGVUYW5kZW0oICdhaXJSZXNpc3RhbmNlT25Qcm9wZXJ0eScgKSxcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ1doZXRoZXIgYWlyIHJlc2lzdGFuY2UgaXMgb24nXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5haXJEZW5zaXR5UHJvcGVydHkgPSBuZXcgRGVyaXZlZFByb3BlcnR5KCBbIHRoaXMuYWx0aXR1ZGVQcm9wZXJ0eSwgdGhpcy5haXJSZXNpc3RhbmNlT25Qcm9wZXJ0eSBdLCBjYWxjdWxhdGVBaXJEZW5zaXR5LCB7XHJcbiAgICAgIHRhbmRlbTogdGFuZGVtLmNyZWF0ZVRhbmRlbSggJ2FpckRlbnNpdHlQcm9wZXJ0eScgKSxcclxuICAgICAgdW5pdHM6ICdrZy9tXjMnLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOlxyXG4gICAgICAgICdhaXIgZGVuc2l0eSwgZGVwZW5kcyBvbiBhbHRpdHVkZSBhbmQgd2hldGhlciBhaXIgcmVzaXN0YW5jZSBpcyBvbicsXHJcbiAgICAgIHBoZXRpb1ZhbHVlVHlwZTogTnVtYmVySU9cclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLnRpbWVTcGVlZFByb3BlcnR5ID0gbmV3IEVudW1lcmF0aW9uUHJvcGVydHkoIFRpbWVTcGVlZC5OT1JNQUwsIHtcclxuICAgICAgdmFsaWRWYWx1ZXM6IFsgVGltZVNwZWVkLk5PUk1BTCwgVGltZVNwZWVkLlNMT1cgXSxcclxuICAgICAgdGFuZGVtOiB0YW5kZW0uY3JlYXRlVGFuZGVtKCAndGltZVNwZWVkUHJvcGVydHknICksXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdTcGVlZCBvZiBhbmltYXRpb24sIGVpdGhlciBub3JtYWwgb3Igc2xvdy4nXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5pc1BsYXlpbmdQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIHRydWUsIHtcclxuICAgICAgdGFuZGVtOiB0YW5kZW0uY3JlYXRlVGFuZGVtKCAnaXNQbGF5aW5nUHJvcGVydHknICksXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICd3aGV0aGVyIGFuaW1hdGlvbiBpcyBwbGF5aW5nIChhcyBvcHBvc2VkIHRvIHBhdXNlZCknXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5kYXZpZEhlaWdodCA9IDI7IC8vIG1ldGVyc1xyXG4gICAgdGhpcy5kYXZpZFBvc2l0aW9uID0gbmV3IFZlY3RvcjIoIDcsIDAgKTsgLy8gbWV0ZXJzXHJcblxyXG4gICAgdGhpcy5udW1iZXJPZk1vdmluZ1Byb2plY3RpbGVzUHJvcGVydHkgPSBuZXcgTnVtYmVyUHJvcGVydHkoIDAsIHtcclxuICAgICAgdGFuZGVtOiB0YW5kZW0uY3JlYXRlVGFuZGVtKCAnbnVtYmVyT2ZNb3ZpbmdQcm9qZWN0aWxlc1Byb3BlcnR5JyApLFxyXG4gICAgICBwaGV0aW9SZWFkT25seTogdHJ1ZSxcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ251bWJlciBvZiBwcm9qZWN0aWxlcyB0aGF0IGFyZSBzdGlsbCBtb3ZpbmcnXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5yYXBpZEZpcmVNb2RlUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCBmYWxzZSwge1xyXG4gICAgICB0YW5kZW06IHRhbmRlbS5jcmVhdGVUYW5kZW0oICdyYXBpZEZpcmVNb2RlUHJvcGVydHknICksXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdJcyB0aGUgc3RhdHMgc2NyZWVuIGluIHJhcGlkLWZpcmUgbW9kZT8nXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5maXJlRW5hYmxlZFByb3BlcnR5ID0gbmV3IERlcml2ZWRQcm9wZXJ0eSggWyB0aGlzLm51bWJlck9mTW92aW5nUHJvamVjdGlsZXNQcm9wZXJ0eSwgdGhpcy5yYXBpZEZpcmVNb2RlUHJvcGVydHkgXSxcclxuICAgICAgKCBudW1Nb3ZpbmcsIHJhcGlkRmlyZU1vZGUgKSA9PlxyXG4gICAgICAgICFyYXBpZEZpcmVNb2RlICYmIG51bU1vdmluZyA8IHRoaXMubWF4UHJvamVjdGlsZXMsIHtcclxuICAgICAgICB0YW5kZW06IHRhbmRlbS5jcmVhdGVUYW5kZW0oICdmaXJlRW5hYmxlZFByb3BlcnR5JyApLFxyXG4gICAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246IGBUaGUgZmlyZSBidXR0b24gaXMgb25seSBlbmFibGVkIGlmIHRoZXJlIGFyZSBsZXNzIHRoYW4gJHt0aGlzLm1heFByb2plY3RpbGVzfSBwcm9qZWN0aWxlcyBpbiB0aGUgYWlyLmAsXHJcbiAgICAgICAgcGhldGlvVmFsdWVUeXBlOiBCb29sZWFuSU9cclxuICAgICAgfSApO1xyXG5cclxuICAgIHRoaXMudXBkYXRlVHJhamVjdG9yeVJhbmtzRW1pdHRlciA9IG5ldyBFbWl0dGVyKCk7XHJcblxyXG4gICAgdGhpcy5ldmVudFRpbWVyID0gbmV3IEV2ZW50VGltZXIoXHJcbiAgICAgIG5ldyBDb25zdGFudEV2ZW50TW9kZWwoIDEwMDAgLyBUSU1FX1BFUl9EQVRBX1BPSU5UICksXHJcbiAgICAgIHRoaXMuc3RlcE1vZGVsRWxlbWVudHMuYmluZCggdGhpcywgVElNRV9QRVJfREFUQV9QT0lOVCAvIDEwMDAgKVxyXG4gICAgKTtcclxuXHJcbiAgICB0aGlzLm11enpsZUZsYXNoU3RlcHBlciA9IG5ldyBFbWl0dGVyKCB7XHJcbiAgICAgIHBhcmFtZXRlcnM6IFsgeyB2YWx1ZVR5cGU6ICdudW1iZXInIH0gXVxyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuem9vbVByb3BlcnR5ID0gbmV3IE51bWJlclByb3BlcnR5KCBERUZBVUxUX1pPT00sIHtcclxuICAgICAgdGFuZGVtOiB0YW5kZW0uY3JlYXRlVGFuZGVtKCAnem9vbVByb3BlcnR5JyApLFxyXG4gICAgICByYW5nZTogbmV3IFJhbmdlKCBNSU5fWk9PTSwgTUFYX1pPT00gKSxcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ1VzZWQgdG8gYWRqdXN0IHRvIHZpc3VhbCB6b29tIGZvciB0aGlzIHNjcmVlbi4gRWFjaCBuZXcgem9vbSBsZXZlbCBpbmNyZWFzZXMgdGhlIHZhbHVlIGJ5IGEgZmFjdG9yIG9mIDIuJyxcclxuICAgICAgcGhldGlvUmVhZE9ubHk6IHRydWVcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgdGhpcyBhZnRlciBtb2RlbCBwcm9wZXJ0aWVzIHRvIHN1cHBvcnQgdGhlIFBoZXRpb0dyb3VwIGNyZWF0aW5nIHRoZSBwcm90b3R5cGUgaW1tZWRpYXRlbHlcclxuICAgIHRoaXMudHJhamVjdG9yeUdyb3VwID0gVHJhamVjdG9yeS5jcmVhdGVHcm91cCggdGhpcywgdGFuZGVtLmNyZWF0ZVRhbmRlbSggJ3RyYWplY3RvcnlHcm91cCcgKSApO1xyXG5cclxuICAgIHRoaXMuZGF0YVByb2JlID0gbmV3IERhdGFQcm9iZSggdGhpcy50cmFqZWN0b3J5R3JvdXAsIDEwLCAxMCwgdGhpcy56b29tUHJvcGVydHksIHRhbmRlbS5jcmVhdGVUYW5kZW0oICdkYXRhUHJvYmUnICkgKTsgLy8gcG9zaXRpb24gYXJiaXRyYXJ5XHJcblxyXG4gICAgLy8gTGlua3MgaW4gdGhpcyBjb25zdHJ1Y3RvciBsYXN0IGZvciB0aGUgbGlmZXRpbWUgb2YgdGhlIHNpbSwgc28gbm8gbmVlZCB0byBkaXNwb3NlXHJcblxyXG4gICAgLy8gaWYgYW55IG9mIHRoZSBnbG9iYWwgUHJvcGVydGllcyBjaGFuZ2UsIHVwZGF0ZSB0aGUgc3RhdHVzIG9mIG1vdmluZyBwcm9qZWN0aWxlc1xyXG4gICAgdGhpcy5haXJEZW5zaXR5UHJvcGVydHkubGluayggKCkgPT4ge1xyXG4gICAgICBpZiAoICFpc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5LnZhbHVlICkge1xyXG4gICAgICAgIHRoaXMubWFya01vdmluZ1RyYWplY3Rvcmllc0NoYW5nZWRNaWRBaXIoKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gICAgdGhpcy5ncmF2aXR5UHJvcGVydHkubGluayggKCkgPT4ge1xyXG4gICAgICBpZiAoICFpc1NldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5LnZhbHVlICkge1xyXG4gICAgICAgIHRoaXMubWFya01vdmluZ1RyYWplY3Rvcmllc0NoYW5nZWRNaWRBaXIoKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG4gICAgdGhpcy5zZWxlY3RlZFByb2plY3RpbGVPYmplY3RUeXBlUHJvcGVydHkubGluayhcclxuICAgICAgc2VsZWN0ZWRQcm9qZWN0aWxlT2JqZWN0VHlwZSA9PiB7XHJcbiAgICAgICAgaWYgKCAhaXNTZXR0aW5nUGhldGlvU3RhdGVQcm9wZXJ0eS52YWx1ZSApIHtcclxuICAgICAgICAgIHRoaXMuc2V0UHJvamVjdGlsZVBhcmFtZXRlcnMoIHNlbGVjdGVkUHJvamVjdGlsZU9iamVjdFR5cGUgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVzZXQoKTogdm9pZCB7XHJcbiAgICAvLyBkaXNwb3NlcyBhbGwgdHJhamVjdG9yaWVzIGFuZCByZXNldHMgbnVtYmVyIG9mIG1vdmluZyBwcm9qZWN0aWxlcyBQcm9wZXJ0eVxyXG4gICAgdGhpcy5lcmFzZVRyYWplY3RvcmllcygpO1xyXG5cclxuICAgIHRoaXMudGFyZ2V0LnJlc2V0KCk7XHJcbiAgICB0aGlzLm1lYXN1cmluZ1RhcGUucmVzZXQoKTtcclxuICAgIHRoaXMuZGF0YVByb2JlLnJlc2V0KCk7XHJcbiAgICB0aGlzLnpvb21Qcm9wZXJ0eS5yZXNldCgpO1xyXG4gICAgdGhpcy5jYW5ub25IZWlnaHRQcm9wZXJ0eS5yZXNldCgpO1xyXG4gICAgdGhpcy5jYW5ub25BbmdsZVByb3BlcnR5LnJlc2V0KCk7XHJcbiAgICB0aGlzLmluaXRpYWxBbmdsZVN0YW5kYXJkRGV2aWF0aW9uUHJvcGVydHkucmVzZXQoKTtcclxuICAgIHRoaXMuaW5pdGlhbFNwZWVkUHJvcGVydHkucmVzZXQoKTtcclxuICAgIHRoaXMuaW5pdGlhbFNwZWVkU3RhbmRhcmREZXZpYXRpb25Qcm9wZXJ0eS5yZXNldCgpO1xyXG4gICAgdGhpcy5zZWxlY3RlZFByb2plY3RpbGVPYmplY3RUeXBlUHJvcGVydHkucmVzZXQoKTtcclxuICAgIHRoaXMucHJvamVjdGlsZU1hc3NQcm9wZXJ0eS5yZXNldCgpO1xyXG4gICAgdGhpcy5wcm9qZWN0aWxlRGlhbWV0ZXJQcm9wZXJ0eS5yZXNldCgpO1xyXG4gICAgdGhpcy5wcm9qZWN0aWxlRHJhZ0NvZWZmaWNpZW50UHJvcGVydHkucmVzZXQoKTtcclxuICAgIHRoaXMuZ3Jhdml0eVByb3BlcnR5LnJlc2V0KCk7XHJcbiAgICB0aGlzLmFsdGl0dWRlUHJvcGVydHkucmVzZXQoKTtcclxuICAgIHRoaXMuYWlyUmVzaXN0YW5jZU9uUHJvcGVydHkucmVzZXQoKTtcclxuICAgIHRoaXMudGltZVNwZWVkUHJvcGVydHkucmVzZXQoKTtcclxuICAgIHRoaXMuaXNQbGF5aW5nUHJvcGVydHkucmVzZXQoKTtcclxuICAgIHRoaXMucmFwaWRGaXJlTW9kZVByb3BlcnR5LnJlc2V0KCk7XHJcblxyXG4gICAgdGhpcy5tdXp6bGVGbGFzaFN0ZXBwZXIuZW1pdCggMCApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0ZXAoIGR0OiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICBpZiAoIHRoaXMuaXNQbGF5aW5nUHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgIHRoaXMuZXZlbnRUaW1lci5zdGVwKCAoIHRoaXMudGltZVNwZWVkUHJvcGVydHkudmFsdWUgPT09IFRpbWVTcGVlZC5TTE9XID8gMC4zMyA6IDEgKSAqIGR0ICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBTdGVwcyBtb2RlbCBlbGVtZW50cyBnaXZlbiBhIHRpbWUgc3RlcCwgdXNlZCBieSB0aGUgc3RlcCBidXR0b25cclxuICBwdWJsaWMgc3RlcE1vZGVsRWxlbWVudHMoIGR0OiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLnRyYWplY3RvcnlHcm91cC5jb3VudDsgaSsrICkge1xyXG4gICAgICBjb25zdCB0cmFqZWN0b3J5ID0gdGhpcy50cmFqZWN0b3J5R3JvdXAuZ2V0RWxlbWVudCggaSApO1xyXG4gICAgICBpZiAoICF0cmFqZWN0b3J5LnJlYWNoZWRHcm91bmQgKSB7XHJcbiAgICAgICAgdHJhamVjdG9yeS5zdGVwKCBkdCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLm11enpsZUZsYXNoU3RlcHBlci5lbWl0KCBkdCApO1xyXG4gIH1cclxuXHJcbiAgLy8gUmVtb3ZlIGFuZCBkaXNwb3NlIG9sZCB0cmFqZWN0b3JpZXMgdGhhdCBhcmUgb3ZlciB0aGUgbGltaXQgZnJvbSB0aGUgb2JzZXJ2YWJsZSBhcnJheVxyXG4gIHB1YmxpYyBsaW1pdFRyYWplY3RvcmllcygpOiB2b2lkIHtcclxuICAgIC8vIGNyZWF0ZSBhIHRlbXBvcmFyeSBhcnJheSB0byBob2xkIGFsbCB0cmFqZWN0b3JpZXMgdG8gYmUgZGlzcG9zZWQsIHRvIGF2b2lkIGFycmF5IG11dGF0aW9uIG9mIHRyYWplY3RvcnlHcm91cCB3aGlsZSBsb29waW5nXHJcbiAgICBjb25zdCB0cmFqZWN0b3JpZXNUb0Rpc3Bvc2UgPSBbXTtcclxuICAgIGNvbnN0IG51bVRyYWplY3Rvcmllc1RvRGlzcG9zZSA9IHRoaXMudHJhamVjdG9yeUdyb3VwLmNvdW50IC0gdGhpcy5tYXhQcm9qZWN0aWxlcztcclxuICAgIGlmICggbnVtVHJhamVjdG9yaWVzVG9EaXNwb3NlID4gMCApIHtcclxuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdGhpcy50cmFqZWN0b3J5R3JvdXAuY291bnQ7IGkrKyApIHtcclxuICAgICAgICBjb25zdCB0cmFqZWN0b3J5ID0gdGhpcy50cmFqZWN0b3J5R3JvdXAuZ2V0RWxlbWVudCggaSApO1xyXG4gICAgICAgIGlmICggdHJhamVjdG9yeS5yZWFjaGVkR3JvdW5kICkge1xyXG4gICAgICAgICAgdHJhamVjdG9yaWVzVG9EaXNwb3NlLnB1c2goIHRyYWplY3RvcnkgKTtcclxuICAgICAgICAgIGlmICggdHJhamVjdG9yaWVzVG9EaXNwb3NlLmxlbmd0aCA+PSBudW1UcmFqZWN0b3JpZXNUb0Rpc3Bvc2UgKSB7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICB0cmFqZWN0b3JpZXNUb0Rpc3Bvc2UuZm9yRWFjaCggdCA9PiB0aGlzLnRyYWplY3RvcnlHcm91cC5kaXNwb3NlRWxlbWVudCggdCApICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBSZW1vdmVzIGFsbCB0cmFqZWN0b3JpZXMgYW5kIHJlc2V0cyBjb3JyZXNwb25kaW5nIFByb3BlcnRpZXNcclxuICBwdWJsaWMgZXJhc2VUcmFqZWN0b3JpZXMoKTogdm9pZCB7XHJcbiAgICB0aGlzLnRyYWplY3RvcnlHcm91cC5jbGVhcigpO1xyXG4gICAgdGhpcy5udW1iZXJPZk1vdmluZ1Byb2plY3RpbGVzUHJvcGVydHkucmVzZXQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBudW1Qcm9qZWN0aWxlcyAtIHRoZSBudW1iZXIgb2Ygc2ltdWx0YW5lb3VzIHByb2plY3RpbGVzIHRvIGZpcmVcclxuICAgKi9cclxuICBwdWJsaWMgZmlyZU51bVByb2plY3RpbGVzKCBudW1Qcm9qZWN0aWxlczogbnVtYmVyICk6IHZvaWQge1xyXG4gICAgZm9yICggbGV0IGkgPSAwOyBpIDwgbnVtUHJvamVjdGlsZXM7IGkrKyApIHtcclxuICAgICAgY29uc3QgaW5pdGlhbFNwZWVkID0gdGhpcy5pbml0aWFsU3BlZWRQcm9wZXJ0eS5nZXRSYW5kb21pemVkVmFsdWUoKTtcclxuICAgICAgY29uc3QgaW5pdGlhbEFuZ2xlID0gdGhpcy5jYW5ub25BbmdsZVByb3BlcnR5LmdldFJhbmRvbWl6ZWRWYWx1ZSgpO1xyXG5cclxuICAgICAgdGhpcy50cmFqZWN0b3J5R3JvdXAuY3JlYXRlTmV4dEVsZW1lbnQoIHRoaXMuc2VsZWN0ZWRQcm9qZWN0aWxlT2JqZWN0VHlwZVByb3BlcnR5LnZhbHVlLFxyXG4gICAgICAgIHRoaXMucHJvamVjdGlsZU1hc3NQcm9wZXJ0eS52YWx1ZSxcclxuICAgICAgICB0aGlzLnByb2plY3RpbGVEaWFtZXRlclByb3BlcnR5LnZhbHVlLFxyXG4gICAgICAgIHRoaXMucHJvamVjdGlsZURyYWdDb2VmZmljaWVudFByb3BlcnR5LnZhbHVlLFxyXG4gICAgICAgIGluaXRpYWxTcGVlZCxcclxuICAgICAgICB0aGlzLmNhbm5vbkhlaWdodFByb3BlcnR5LnZhbHVlLFxyXG4gICAgICAgIGluaXRpYWxBbmdsZSApO1xyXG5cclxuICAgICAgdGhpcy51cGRhdGVUcmFqZWN0b3J5UmFua3NFbWl0dGVyLmVtaXQoKTsgLy8gaW5jcmVtZW50IHJhbmsgb2YgYWxsIHRyYWplY3Rvcmllc1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMubGltaXRUcmFqZWN0b3JpZXMoKTtcclxuICB9XHJcblxyXG4gIC8vIFNldCBjaGFuZ2VkSW5NaWRBaXIgdG8gdHJ1ZSBmb3IgdHJhamVjdG9yaWVzIHdpdGggY3VycmVudGx5IG1vdmluZyBwcm9qZWN0aWxlc1xyXG4gIHByaXZhdGUgbWFya01vdmluZ1RyYWplY3Rvcmllc0NoYW5nZWRNaWRBaXIoKTogdm9pZCB7XHJcbiAgICBsZXQgdHJhamVjdG9yeTtcclxuICAgIGZvciAoIGxldCBqID0gMDsgaiA8IHRoaXMudHJhamVjdG9yeUdyb3VwLmNvdW50OyBqKysgKSB7XHJcbiAgICAgIHRyYWplY3RvcnkgPSB0aGlzLnRyYWplY3RvcnlHcm91cC5nZXRFbGVtZW50KCBqICk7XHJcblxyXG4gICAgICAvLyBUcmFqZWN0b3J5IGhhcyBub3QgcmVhY2hlZCBncm91bmRcclxuICAgICAgaWYgKCAhdHJhamVjdG9yeS5jaGFuZ2VkSW5NaWRBaXIgJiYgIXRyYWplY3RvcnkucmVhY2hlZEdyb3VuZCApIHtcclxuICAgICAgICB0cmFqZWN0b3J5LmNoYW5nZWRJbk1pZEFpciA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCBtYXNzLCBkaWFtZXRlciwgYW5kIGRyYWcgY29lZmZpY2llbnQgYmFzZWQgb24gdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBwcm9qZWN0aWxlIG9iamVjdCB0eXBlXHJcbiAgICogQHBhcmFtIHNlbGVjdGVkUHJvamVjdGlsZU9iamVjdFR5cGUgLSBjb250YWlucyBpbmZvcm1hdGlvbiBzdWNoIGFzIG1hc3MsIGRpYW1ldGVyLCBldGMuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBzZXRQcm9qZWN0aWxlUGFyYW1ldGVycyggc2VsZWN0ZWRQcm9qZWN0aWxlT2JqZWN0VHlwZTogUHJvamVjdGlsZU9iamVjdFR5cGUgKTogdm9pZCB7XHJcbiAgICB0aGlzLnByb2plY3RpbGVNYXNzUHJvcGVydHkuc2V0KCBzZWxlY3RlZFByb2plY3RpbGVPYmplY3RUeXBlLm1hc3MgKTtcclxuICAgIHRoaXMucHJvamVjdGlsZURpYW1ldGVyUHJvcGVydHkuc2V0KCBzZWxlY3RlZFByb2plY3RpbGVPYmplY3RUeXBlLmRpYW1ldGVyICk7XHJcbiAgICB0aGlzLnByb2plY3RpbGVEcmFnQ29lZmZpY2llbnRQcm9wZXJ0eS5zZXQoIHNlbGVjdGVkUHJvamVjdGlsZU9iamVjdFR5cGUuZHJhZ0NvZWZmaWNpZW50ICk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIGFsdGl0dWRlIC0gaW4gbWV0ZXJzXHJcbiAqIEBwYXJhbSBhaXJSZXNpc3RhbmNlT24gLSBpZiBvZmYsIHplcm8gYWlyIGRlbnNpdHlcclxuICovXHJcbmNvbnN0IGNhbGN1bGF0ZUFpckRlbnNpdHkgPSAoIGFsdGl0dWRlOiBudW1iZXIsIGFpclJlc2lzdGFuY2VPbjogYm9vbGVhbiApOiBudW1iZXIgPT4ge1xyXG4gIC8vIEF0bW9zcGhlcmljIG1vZGVsIGFsZ29yaXRobSBpcyB0YWtlbiBmcm9tIGh0dHBzOi8vd3d3LmdyYy5uYXNhLmdvdi93d3cvay0xMi9haXJwbGFuZS9hdG1vc21ldC5odG1sXHJcbiAgLy8gQ2hlY2tlZCB0aGUgdmFsdWVzIGF0IGh0dHA6Ly93d3cuZW5naW5lZXJpbmd0b29sYm94LmNvbS9zdGFuZGFyZC1hdG1vc3BoZXJlLWRfNjA0Lmh0bWxcclxuXHJcbiAgaWYgKCBhaXJSZXNpc3RhbmNlT24gKSB7XHJcbiAgICBsZXQgdGVtcGVyYXR1cmU7XHJcbiAgICBsZXQgcHJlc3N1cmU7XHJcblxyXG4gICAgLy8gVGhlIHNpbSBkb2Vzbid0IGdvIGJleW9uZCA1MDAwLCByZW5kZXJpbmcgdGhlIGVsc2VzIHVubmVjZXNzYXJ5LCBidXQga2VlcGluZyBpZiBvdGhlcnMgd291bGQgbGlrZSB0b1xyXG4gICAgLy8gaW5jcmVhc2UgdGhlIGFsdGl0dWRlIHJhbmdlLlxyXG5cclxuICAgIGlmICggYWx0aXR1ZGUgPCAxMTAwMCApIHtcclxuICAgICAgLy8gdHJvcG9zcGhlcmVcclxuICAgICAgdGVtcGVyYXR1cmUgPSAxNS4wNCAtIDAuMDA2NDkgKiBhbHRpdHVkZTtcclxuICAgICAgcHJlc3N1cmUgPSAxMDEuMjkgKiBNYXRoLnBvdyggKCB0ZW1wZXJhdHVyZSArIDI3My4xICkgLyAyODguMDgsIDUuMjU2ICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggYWx0aXR1ZGUgPCAyNTAwMCApIHtcclxuICAgICAgLy8gbG93ZXIgc3RyYXRvc3BoZXJlXHJcbiAgICAgIHRlbXBlcmF0dXJlID0gLTU2LjQ2O1xyXG4gICAgICBwcmVzc3VyZSA9IDIyLjY1ICogTWF0aC5leHAoIDEuNzMgLSAwLjAwMDE1NyAqIGFsdGl0dWRlICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgLy8gdXBwZXIgc3RyYXRvc3BoZXJlIChhbHRpdHVkZSA+PSAyNTAwMCBtZXRlcnMpXHJcbiAgICAgIHRlbXBlcmF0dXJlID0gLTEzMS4yMSArIDAuMDAyOTkgKiBhbHRpdHVkZTtcclxuICAgICAgcHJlc3N1cmUgPSAyLjQ4OCAqIE1hdGgucG93KCAoIHRlbXBlcmF0dXJlICsgMjczLjEgKSAvIDIxNi42LCAtMTEuMzg4ICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHByZXNzdXJlIC8gKCAwLjI4NjkgKiAoIHRlbXBlcmF0dXJlICsgMjczLjEgKSApO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIHJldHVybiAwO1xyXG4gIH1cclxufTtcclxuXHJcbnByb2plY3RpbGVNb3Rpb24ucmVnaXN0ZXIoICdQcm9qZWN0aWxlTW90aW9uTW9kZWwnLCBQcm9qZWN0aWxlTW90aW9uTW9kZWwgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFByb2plY3RpbGVNb3Rpb25Nb2RlbDsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxlQUFlLE1BQU0sd0NBQXdDO0FBQ3BFLE9BQU9DLGVBQWUsTUFBTSx3Q0FBd0M7QUFDcEUsT0FBT0MsT0FBTyxNQUFNLGdDQUFnQztBQUNwRCxPQUFPQyxtQkFBbUIsTUFBTSw0Q0FBNEM7QUFDNUUsT0FBT0MsY0FBYyxNQUFNLHVDQUF1QztBQUNsRSxPQUFPQyxRQUFRLE1BQU0saUNBQWlDO0FBRXRELE9BQU9DLHNCQUFzQixNQUFNLCtDQUErQztBQUNsRixPQUFPQyxLQUFLLE1BQU0sNkJBQTZCO0FBQy9DLE9BQU9DLE9BQU8sTUFBTSwrQkFBK0I7QUFFbkQsT0FBT0MsVUFBVSxJQUFJQyxrQkFBa0IsUUFBUSx3Q0FBd0M7QUFDdkYsT0FBT0MsU0FBUyxNQUFNLHVDQUF1QztBQUM3RCxPQUFPQyxpQkFBaUIsTUFBTSwrQ0FBK0M7QUFDN0UsT0FBT0MsU0FBUyxNQUFNLDBDQUEwQztBQUVoRSxPQUFPQyxNQUFNLE1BQU0saUNBQWlDO0FBQ3BELE9BQU9DLFNBQVMsTUFBTSwwQ0FBMEM7QUFDaEUsT0FBT0MsUUFBUSxNQUFNLHlDQUF5QztBQUM5RCxPQUFPQyxXQUFXLE1BQU0sNENBQTRDO0FBQ3BFLE9BQU9DLGdCQUFnQixNQUFNLDJCQUEyQjtBQUN4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