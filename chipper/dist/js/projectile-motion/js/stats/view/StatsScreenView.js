// Copyright 2022-2024, University of Colorado Boulder

/**
 * ScreenView for the 'Stats' screen
 * @author Andrea Lin (PhET Interactive Simulations)
 * @author Matthew Blackman (PhET Interactive Simulations)
 */

import merge from '../../../../phet-core/js/merge.js';
import { Node } from '../../../../scenery/js/imports.js';
import ProjectileMotionConstants from '../../common/ProjectileMotionConstants.js';
import '../../common/ProjectileMotionQueryParameters.js';
import ProjectileMotionScreenView from '../../common/view/ProjectileMotionScreenView.js';
import ProjectileMotionViewProperties from '../../common/view/ProjectileMotionViewProperties.js';
import projectileMotion from '../../projectileMotion.js';
import FireMultipleButton from './FireMultipleButton.js';
import StatsControlPanel from './StatsControlPanel.js';
import StatsProjectileControlPanel from './StatsProjectileControlPanel.js';

// constants
const X_MARGIN = 10;
const FIRE_BUTTON_MARGIN_X = 40;
class StatsScreenView extends ProjectileMotionScreenView {
  /**
   * @param {StatsModel} model
   * @param {Object} [options]
   */
  constructor(model, options) {
    options = merge({
      addFlatirons: false,
      cannonNodeOptions: {
        preciseCannonDelta: true
      },
      maxTrajectories: ProjectileMotionConstants.MAX_NUMBER_OF_TRAJECTORIES_STATS,
      showPaths: false,
      constantTrajectoryOpacity: true
    }, options);

    // contains Properties about vector visibility, used in super class
    const viewProperties = new ProjectileMotionViewProperties({
      tandem: options.tandem.createTandem('viewProperties'),
      forceProperties: false
    });

    // acts as listParent for the projectile dropdown box
    const comboBoxListParent = new Node();
    const projectileControlPanel = new StatsProjectileControlPanel(model.objectTypes, model.selectedProjectileObjectTypeProperty, comboBoxListParent, model.projectileMassProperty, model.projectileDiameterProperty, model.projectileDragCoefficientProperty, model.airResistanceOnProperty, {
      tandem: options.tandem.createTandem('projectileControlPanel')
    });
    const statsControlPanel = new StatsControlPanel(model.groupSizeProperty, model.initialSpeedStandardDeviationProperty, model.initialAngleStandardDeviationProperty, model.rapidFireModeProperty, viewProperties, {
      tandem: options.tandem.createTandem('statsControlPanel')
    });
    const fireMultipleButton = new FireMultipleButton({
      minWidth: 75,
      iconWidth: 35,
      minHeight: 42,
      listener: () => {
        model.fireMultipleProjectiles();
        this.cannonNode.flashMuzzle();
      },
      tandem: options.tandem.createTandem('fireMultipleButton'),
      phetioDocumentation: 'button to launch multiple simultaneous projectiles'
    });
    super(model, projectileControlPanel, statsControlPanel, viewProperties, options);

    // @private
    this.projectilePanel = projectileControlPanel;
    this.statsPanel = statsControlPanel;
    this.fireMultipleButton = fireMultipleButton;
    model.fireMultipleEnabledProperty.link(enable => {
      this.fireMultipleButton.setEnabled(enable);
    });

    // insert dropdowns on top of the right-side panels
    this.insertChild(this.indexOfChild(this.topRightPanel) + 1, comboBoxListParent);
    this.addChild(this.fireMultipleButton);
    this.fireButton.left = this.initialAnglePanel.right + FIRE_BUTTON_MARGIN_X;
    this.fireMultipleButton.left = this.fireButton.right + X_MARGIN;
    this.fireMultipleButton.centerY = this.fireButton.centerY;
    this.timeControlNode.left = this.fireMultipleButton.right + FIRE_BUTTON_MARGIN_X;
  }

  /**
   * Layout
   * @param {Bounds2} viewBounds
   * @public (joist-internal)
   * @override
   */
  layout(viewBounds) {
    this.projectilePanel.hideComboBoxList();
    super.layout(viewBounds);
  }
}
projectileMotion.register('StatsScreenView', StatsScreenView);
export default StatsScreenView;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJtZXJnZSIsIk5vZGUiLCJQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzIiwiUHJvamVjdGlsZU1vdGlvblNjcmVlblZpZXciLCJQcm9qZWN0aWxlTW90aW9uVmlld1Byb3BlcnRpZXMiLCJwcm9qZWN0aWxlTW90aW9uIiwiRmlyZU11bHRpcGxlQnV0dG9uIiwiU3RhdHNDb250cm9sUGFuZWwiLCJTdGF0c1Byb2plY3RpbGVDb250cm9sUGFuZWwiLCJYX01BUkdJTiIsIkZJUkVfQlVUVE9OX01BUkdJTl9YIiwiU3RhdHNTY3JlZW5WaWV3IiwiY29uc3RydWN0b3IiLCJtb2RlbCIsIm9wdGlvbnMiLCJhZGRGbGF0aXJvbnMiLCJjYW5ub25Ob2RlT3B0aW9ucyIsInByZWNpc2VDYW5ub25EZWx0YSIsIm1heFRyYWplY3RvcmllcyIsIk1BWF9OVU1CRVJfT0ZfVFJBSkVDVE9SSUVTX1NUQVRTIiwic2hvd1BhdGhzIiwiY29uc3RhbnRUcmFqZWN0b3J5T3BhY2l0eSIsInZpZXdQcm9wZXJ0aWVzIiwidGFuZGVtIiwiY3JlYXRlVGFuZGVtIiwiZm9yY2VQcm9wZXJ0aWVzIiwiY29tYm9Cb3hMaXN0UGFyZW50IiwicHJvamVjdGlsZUNvbnRyb2xQYW5lbCIsIm9iamVjdFR5cGVzIiwic2VsZWN0ZWRQcm9qZWN0aWxlT2JqZWN0VHlwZVByb3BlcnR5IiwicHJvamVjdGlsZU1hc3NQcm9wZXJ0eSIsInByb2plY3RpbGVEaWFtZXRlclByb3BlcnR5IiwicHJvamVjdGlsZURyYWdDb2VmZmljaWVudFByb3BlcnR5IiwiYWlyUmVzaXN0YW5jZU9uUHJvcGVydHkiLCJzdGF0c0NvbnRyb2xQYW5lbCIsImdyb3VwU2l6ZVByb3BlcnR5IiwiaW5pdGlhbFNwZWVkU3RhbmRhcmREZXZpYXRpb25Qcm9wZXJ0eSIsImluaXRpYWxBbmdsZVN0YW5kYXJkRGV2aWF0aW9uUHJvcGVydHkiLCJyYXBpZEZpcmVNb2RlUHJvcGVydHkiLCJmaXJlTXVsdGlwbGVCdXR0b24iLCJtaW5XaWR0aCIsImljb25XaWR0aCIsIm1pbkhlaWdodCIsImxpc3RlbmVyIiwiZmlyZU11bHRpcGxlUHJvamVjdGlsZXMiLCJjYW5ub25Ob2RlIiwiZmxhc2hNdXp6bGUiLCJwaGV0aW9Eb2N1bWVudGF0aW9uIiwicHJvamVjdGlsZVBhbmVsIiwic3RhdHNQYW5lbCIsImZpcmVNdWx0aXBsZUVuYWJsZWRQcm9wZXJ0eSIsImxpbmsiLCJlbmFibGUiLCJzZXRFbmFibGVkIiwiaW5zZXJ0Q2hpbGQiLCJpbmRleE9mQ2hpbGQiLCJ0b3BSaWdodFBhbmVsIiwiYWRkQ2hpbGQiLCJmaXJlQnV0dG9uIiwibGVmdCIsImluaXRpYWxBbmdsZVBhbmVsIiwicmlnaHQiLCJjZW50ZXJZIiwidGltZUNvbnRyb2xOb2RlIiwibGF5b3V0Iiwidmlld0JvdW5kcyIsImhpZGVDb21ib0JveExpc3QiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlN0YXRzU2NyZWVuVmlldy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMi0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBTY3JlZW5WaWV3IGZvciB0aGUgJ1N0YXRzJyBzY3JlZW5cclxuICogQGF1dGhvciBBbmRyZWEgTGluIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKiBAYXV0aG9yIE1hdHRoZXcgQmxhY2ttYW4gKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqL1xyXG5cclxuaW1wb3J0IG1lcmdlIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9tZXJnZS5qcyc7XHJcbmltcG9ydCB7IE5vZGUgfSBmcm9tICcuLi8uLi8uLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cyBmcm9tICcuLi8uLi9jb21tb24vUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cy5qcyc7XHJcbmltcG9ydCAnLi4vLi4vY29tbW9uL1Byb2plY3RpbGVNb3Rpb25RdWVyeVBhcmFtZXRlcnMuanMnO1xyXG5pbXBvcnQgUHJvamVjdGlsZU1vdGlvblNjcmVlblZpZXcgZnJvbSAnLi4vLi4vY29tbW9uL3ZpZXcvUHJvamVjdGlsZU1vdGlvblNjcmVlblZpZXcuanMnO1xyXG5pbXBvcnQgUHJvamVjdGlsZU1vdGlvblZpZXdQcm9wZXJ0aWVzIGZyb20gJy4uLy4uL2NvbW1vbi92aWV3L1Byb2plY3RpbGVNb3Rpb25WaWV3UHJvcGVydGllcy5qcyc7XHJcbmltcG9ydCBwcm9qZWN0aWxlTW90aW9uIGZyb20gJy4uLy4uL3Byb2plY3RpbGVNb3Rpb24uanMnO1xyXG5pbXBvcnQgRmlyZU11bHRpcGxlQnV0dG9uIGZyb20gJy4vRmlyZU11bHRpcGxlQnV0dG9uLmpzJztcclxuaW1wb3J0IFN0YXRzQ29udHJvbFBhbmVsIGZyb20gJy4vU3RhdHNDb250cm9sUGFuZWwuanMnO1xyXG5pbXBvcnQgU3RhdHNQcm9qZWN0aWxlQ29udHJvbFBhbmVsIGZyb20gJy4vU3RhdHNQcm9qZWN0aWxlQ29udHJvbFBhbmVsLmpzJztcclxuXHJcbi8vIGNvbnN0YW50c1xyXG5jb25zdCBYX01BUkdJTiA9IDEwO1xyXG5jb25zdCBGSVJFX0JVVFRPTl9NQVJHSU5fWCA9IDQwO1xyXG5cclxuY2xhc3MgU3RhdHNTY3JlZW5WaWV3IGV4dGVuZHMgUHJvamVjdGlsZU1vdGlvblNjcmVlblZpZXcge1xyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSB7U3RhdHNNb2RlbH0gbW9kZWxcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoIG1vZGVsLCBvcHRpb25zICkge1xyXG4gICAgb3B0aW9ucyA9IG1lcmdlKCB7XHJcbiAgICAgIGFkZEZsYXRpcm9uczogZmFsc2UsXHJcbiAgICAgIGNhbm5vbk5vZGVPcHRpb25zOiB7IHByZWNpc2VDYW5ub25EZWx0YTogdHJ1ZSB9LFxyXG4gICAgICBtYXhUcmFqZWN0b3JpZXM6IFByb2plY3RpbGVNb3Rpb25Db25zdGFudHMuTUFYX05VTUJFUl9PRl9UUkFKRUNUT1JJRVNfU1RBVFMsXHJcbiAgICAgIHNob3dQYXRoczogZmFsc2UsXHJcbiAgICAgIGNvbnN0YW50VHJhamVjdG9yeU9wYWNpdHk6IHRydWVcclxuXHJcbiAgICB9LCBvcHRpb25zICk7XHJcblxyXG4gICAgLy8gY29udGFpbnMgUHJvcGVydGllcyBhYm91dCB2ZWN0b3IgdmlzaWJpbGl0eSwgdXNlZCBpbiBzdXBlciBjbGFzc1xyXG4gICAgY29uc3Qgdmlld1Byb3BlcnRpZXMgPSBuZXcgUHJvamVjdGlsZU1vdGlvblZpZXdQcm9wZXJ0aWVzKCB7XHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAndmlld1Byb3BlcnRpZXMnICksXHJcbiAgICAgIGZvcmNlUHJvcGVydGllczogZmFsc2VcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBhY3RzIGFzIGxpc3RQYXJlbnQgZm9yIHRoZSBwcm9qZWN0aWxlIGRyb3Bkb3duIGJveFxyXG4gICAgY29uc3QgY29tYm9Cb3hMaXN0UGFyZW50ID0gbmV3IE5vZGUoKTtcclxuXHJcbiAgICBjb25zdCBwcm9qZWN0aWxlQ29udHJvbFBhbmVsID0gbmV3IFN0YXRzUHJvamVjdGlsZUNvbnRyb2xQYW5lbChcclxuICAgICAgbW9kZWwub2JqZWN0VHlwZXMsXHJcbiAgICAgIG1vZGVsLnNlbGVjdGVkUHJvamVjdGlsZU9iamVjdFR5cGVQcm9wZXJ0eSxcclxuICAgICAgY29tYm9Cb3hMaXN0UGFyZW50LFxyXG4gICAgICBtb2RlbC5wcm9qZWN0aWxlTWFzc1Byb3BlcnR5LFxyXG4gICAgICBtb2RlbC5wcm9qZWN0aWxlRGlhbWV0ZXJQcm9wZXJ0eSxcclxuICAgICAgbW9kZWwucHJvamVjdGlsZURyYWdDb2VmZmljaWVudFByb3BlcnR5LFxyXG4gICAgICBtb2RlbC5haXJSZXNpc3RhbmNlT25Qcm9wZXJ0eSxcclxuICAgICAgeyB0YW5kZW06IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ3Byb2plY3RpbGVDb250cm9sUGFuZWwnICkgfVxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBzdGF0c0NvbnRyb2xQYW5lbCA9IG5ldyBTdGF0c0NvbnRyb2xQYW5lbChcclxuICAgICAgbW9kZWwuZ3JvdXBTaXplUHJvcGVydHksXHJcbiAgICAgIG1vZGVsLmluaXRpYWxTcGVlZFN0YW5kYXJkRGV2aWF0aW9uUHJvcGVydHksXHJcbiAgICAgIG1vZGVsLmluaXRpYWxBbmdsZVN0YW5kYXJkRGV2aWF0aW9uUHJvcGVydHksXHJcbiAgICAgIG1vZGVsLnJhcGlkRmlyZU1vZGVQcm9wZXJ0eSxcclxuICAgICAgdmlld1Byb3BlcnRpZXMsXHJcbiAgICAgIHsgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdzdGF0c0NvbnRyb2xQYW5lbCcgKSB9XHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IGZpcmVNdWx0aXBsZUJ1dHRvbiA9IG5ldyBGaXJlTXVsdGlwbGVCdXR0b24oIHtcclxuICAgICAgbWluV2lkdGg6IDc1LFxyXG4gICAgICBpY29uV2lkdGg6IDM1LFxyXG4gICAgICBtaW5IZWlnaHQ6IDQyLFxyXG4gICAgICBsaXN0ZW5lcjogKCkgPT4ge1xyXG4gICAgICAgIG1vZGVsLmZpcmVNdWx0aXBsZVByb2plY3RpbGVzKCk7XHJcbiAgICAgICAgdGhpcy5jYW5ub25Ob2RlLmZsYXNoTXV6emxlKCk7XHJcbiAgICAgIH0sXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAnZmlyZU11bHRpcGxlQnV0dG9uJyApLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnYnV0dG9uIHRvIGxhdW5jaCBtdWx0aXBsZSBzaW11bHRhbmVvdXMgcHJvamVjdGlsZXMnXHJcbiAgICB9ICk7XHJcblxyXG4gICAgc3VwZXIoXHJcbiAgICAgIG1vZGVsLFxyXG4gICAgICBwcm9qZWN0aWxlQ29udHJvbFBhbmVsLFxyXG4gICAgICBzdGF0c0NvbnRyb2xQYW5lbCxcclxuICAgICAgdmlld1Byb3BlcnRpZXMsXHJcbiAgICAgIG9wdGlvbnNcclxuICAgICk7XHJcblxyXG4gICAgLy8gQHByaXZhdGVcclxuICAgIHRoaXMucHJvamVjdGlsZVBhbmVsID0gcHJvamVjdGlsZUNvbnRyb2xQYW5lbDtcclxuICAgIHRoaXMuc3RhdHNQYW5lbCA9IHN0YXRzQ29udHJvbFBhbmVsO1xyXG4gICAgdGhpcy5maXJlTXVsdGlwbGVCdXR0b24gPSBmaXJlTXVsdGlwbGVCdXR0b247XHJcblxyXG4gICAgbW9kZWwuZmlyZU11bHRpcGxlRW5hYmxlZFByb3BlcnR5LmxpbmsoIGVuYWJsZSA9PiB7XHJcbiAgICAgIHRoaXMuZmlyZU11bHRpcGxlQnV0dG9uLnNldEVuYWJsZWQoIGVuYWJsZSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIGluc2VydCBkcm9wZG93bnMgb24gdG9wIG9mIHRoZSByaWdodC1zaWRlIHBhbmVsc1xyXG4gICAgdGhpcy5pbnNlcnRDaGlsZChcclxuICAgICAgdGhpcy5pbmRleE9mQ2hpbGQoIHRoaXMudG9wUmlnaHRQYW5lbCApICsgMSxcclxuICAgICAgY29tYm9Cb3hMaXN0UGFyZW50XHJcbiAgICApO1xyXG5cclxuICAgIHRoaXMuYWRkQ2hpbGQoIHRoaXMuZmlyZU11bHRpcGxlQnV0dG9uICk7XHJcblxyXG4gICAgdGhpcy5maXJlQnV0dG9uLmxlZnQgPSB0aGlzLmluaXRpYWxBbmdsZVBhbmVsLnJpZ2h0ICsgRklSRV9CVVRUT05fTUFSR0lOX1g7XHJcbiAgICB0aGlzLmZpcmVNdWx0aXBsZUJ1dHRvbi5sZWZ0ID0gdGhpcy5maXJlQnV0dG9uLnJpZ2h0ICsgWF9NQVJHSU47XHJcbiAgICB0aGlzLmZpcmVNdWx0aXBsZUJ1dHRvbi5jZW50ZXJZID0gdGhpcy5maXJlQnV0dG9uLmNlbnRlclk7XHJcbiAgICB0aGlzLnRpbWVDb250cm9sTm9kZS5sZWZ0ID0gdGhpcy5maXJlTXVsdGlwbGVCdXR0b24ucmlnaHQgKyBGSVJFX0JVVFRPTl9NQVJHSU5fWDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIExheW91dFxyXG4gICAqIEBwYXJhbSB7Qm91bmRzMn0gdmlld0JvdW5kc1xyXG4gICAqIEBwdWJsaWMgKGpvaXN0LWludGVybmFsKVxyXG4gICAqIEBvdmVycmlkZVxyXG4gICAqL1xyXG4gIGxheW91dCggdmlld0JvdW5kcyApIHtcclxuICAgIHRoaXMucHJvamVjdGlsZVBhbmVsLmhpZGVDb21ib0JveExpc3QoKTtcclxuICAgIHN1cGVyLmxheW91dCggdmlld0JvdW5kcyApO1xyXG4gIH1cclxufVxyXG5cclxucHJvamVjdGlsZU1vdGlvbi5yZWdpc3RlciggJ1N0YXRzU2NyZWVuVmlldycsIFN0YXRzU2NyZWVuVmlldyApO1xyXG5leHBvcnQgZGVmYXVsdCBTdGF0c1NjcmVlblZpZXc7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLEtBQUssTUFBTSxtQ0FBbUM7QUFDckQsU0FBU0MsSUFBSSxRQUFRLG1DQUFtQztBQUN4RCxPQUFPQyx5QkFBeUIsTUFBTSwyQ0FBMkM7QUFDakYsT0FBTyxpREFBaUQ7QUFDeEQsT0FBT0MsMEJBQTBCLE1BQU0saURBQWlEO0FBQ3hGLE9BQU9DLDhCQUE4QixNQUFNLHFEQUFxRDtBQUNoRyxPQUFPQyxnQkFBZ0IsTUFBTSwyQkFBMkI7QUFDeEQsT0FBT0Msa0JBQWtCLE1BQU0seUJBQXlCO0FBQ3hELE9BQU9DLGlCQUFpQixNQUFNLHdCQUF3QjtBQUN0RCxPQUFPQywyQkFBMkIsTUFBTSxrQ0FBa0M7O0FBRTFFO0FBQ0EsTUFBTUMsUUFBUSxHQUFHLEVBQUU7QUFDbkIsTUFBTUMsb0JBQW9CLEdBQUcsRUFBRTtBQUUvQixNQUFNQyxlQUFlLFNBQVNSLDBCQUEwQixDQUFDO0VBQ3ZEO0FBQ0Y7QUFDQTtBQUNBO0VBQ0VTLFdBQVdBLENBQUVDLEtBQUssRUFBRUMsT0FBTyxFQUFHO0lBQzVCQSxP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