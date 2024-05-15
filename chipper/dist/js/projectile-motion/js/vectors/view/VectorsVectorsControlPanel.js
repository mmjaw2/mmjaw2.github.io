// Copyright 2016-2023, University of Colorado Boulder

/**
 * Control panel for choosing which vectors are visible.
 *
 * @author Andrea Lin (PhET Interactive Simulations)
 */

import merge from '../../../../phet-core/js/merge.js';
import { HBox, Node, Text, VBox } from '../../../../scenery/js/imports.js';
import Checkbox from '../../../../sun/js/Checkbox.js';
import Panel from '../../../../sun/js/Panel.js';
import VerticalAquaRadioButtonGroup from '../../../../sun/js/VerticalAquaRadioButtonGroup.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import ProjectileMotionConstants from '../../common/ProjectileMotionConstants.js';
import VectorsDisplayEnumeration from '../../common/view/VectorsDisplayEnumeration.js';
import projectileMotion from '../../projectileMotion.js';
import ProjectileMotionStrings from '../../ProjectileMotionStrings.js';
const accelerationVectorsString = ProjectileMotionStrings.accelerationVectors;
const componentsString = ProjectileMotionStrings.components;
const forceVectorsString = ProjectileMotionStrings.forceVectors;
const totalString = ProjectileMotionStrings.total;
const velocityVectorsString = ProjectileMotionStrings.velocityVectors;

// constants
const LABEL_OPTIONS = ProjectileMotionConstants.PANEL_LABEL_OPTIONS;
const VELOCITY_VECTOR_ICON = ProjectileMotionConstants.VELOCITY_VECTOR_ICON;
const ACCELERATION_VECTOR_ICON = ProjectileMotionConstants.ACCELERATION_VECTOR_ICON;
const FORCE_VECTOR_ICON = ProjectileMotionConstants.FORCE_VECTOR_ICON;
class VectorsVectorsControlPanel extends Panel {
  /**
   * @param {ProjectileMotionViewProperties} viewProperties - Properties that determine which vectors are shown
   * @param {Object} [options]
   */
  constructor(viewProperties, options) {
    // The first object is a placeholder so none of the others get mutated
    // The second object is the default, in the constants files
    // The third object is options specific to this panel, which overrides the defaults
    // The fourth object is options given at time of construction, which overrides all the others
    options = merge({}, ProjectileMotionConstants.RIGHTSIDE_PANEL_OPTIONS, {
      align: 'left',
      tandem: Tandem.REQUIRED
    }, options);
    const checkboxOptions = {
      maxWidth: options.minWidth - 3 * options.xMargin - VELOCITY_VECTOR_ICON.width,
      boxWidth: 18
    };
    const vectorsDisplayRadioButtonGroup = new VerticalAquaRadioButtonGroup(viewProperties.vectorsDisplayProperty, [{
      createNode: () => new Text(totalString, LABEL_OPTIONS),
      tandemName: 'totalRadioButton',
      value: VectorsDisplayEnumeration.TOTAL
    }, {
      createNode: () => new Text(componentsString, LABEL_OPTIONS),
      tandemName: 'componentsRadioButton',
      value: VectorsDisplayEnumeration.COMPONENTS
    }], {
      radioButtonOptions: {
        radius: 8
      },
      spacing: 10,
      // vertical spacing between each radio button
      touchAreaXDilation: 5,
      maxWidth: checkboxOptions.maxWidth,
      tandem: options.tandem.createTandem('vectorsDisplayRadioButtonGroup'),
      phetioDocumentation: 'Radio button group to select what type of vectors are displayed with a flying projectile'
    });
    const velocityLabel = new Text(velocityVectorsString, LABEL_OPTIONS);
    const velocityCheckboxContent = new HBox({
      spacing: options.xMargin,
      children: [velocityLabel, new Node({
        children: [VELOCITY_VECTOR_ICON]
      }) // so that HBox transforms the intermediary Node
      ]
    });
    const velocityCheckbox = new Checkbox(viewProperties.velocityVectorsOnProperty, velocityCheckboxContent, merge({
      tandem: options.tandem.createTandem('velocityCheckbox')
    }, checkboxOptions));
    const accelerationLabel = new Text(accelerationVectorsString, LABEL_OPTIONS);
    const accelerationCheckboxContent = new HBox({
      spacing: options.xMargin,
      children: [accelerationLabel, new Node({
        children: [ACCELERATION_VECTOR_ICON]
      }) // so that HBox transforms the intermediary Node
      ]
    });
    const accelerationCheckbox = new Checkbox(viewProperties.accelerationVectorsOnProperty, accelerationCheckboxContent, merge({
      tandem: options.tandem.createTandem('accelerationCheckbox')
    }, checkboxOptions));
    const forceLabel = new Text(forceVectorsString, LABEL_OPTIONS);
    const forceCheckboxContent = new HBox({
      spacing: options.xMargin,
      children: [forceLabel, new Node({
        children: [FORCE_VECTOR_ICON]
      }) // so that HBox transforms the intermediary Node
      ]
    });
    const forceCheckbox = new Checkbox(viewProperties.forceVectorsOnProperty, forceCheckboxContent, merge({
      tandem: options.tandem.createTandem('forceCheckbox')
    }, checkboxOptions));

    // The contents of the control panel
    const content = new VBox({
      align: 'left',
      spacing: options.controlsVerticalSpace,
      children: [vectorsDisplayRadioButtonGroup, velocityCheckbox, accelerationCheckbox, forceCheckbox]
    });
    super(content, options);
  }
}
projectileMotion.register('VectorsVectorsControlPanel', VectorsVectorsControlPanel);
export default VectorsVectorsControlPanel;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJtZXJnZSIsIkhCb3giLCJOb2RlIiwiVGV4dCIsIlZCb3giLCJDaGVja2JveCIsIlBhbmVsIiwiVmVydGljYWxBcXVhUmFkaW9CdXR0b25Hcm91cCIsIlRhbmRlbSIsIlByb2plY3RpbGVNb3Rpb25Db25zdGFudHMiLCJWZWN0b3JzRGlzcGxheUVudW1lcmF0aW9uIiwicHJvamVjdGlsZU1vdGlvbiIsIlByb2plY3RpbGVNb3Rpb25TdHJpbmdzIiwiYWNjZWxlcmF0aW9uVmVjdG9yc1N0cmluZyIsImFjY2VsZXJhdGlvblZlY3RvcnMiLCJjb21wb25lbnRzU3RyaW5nIiwiY29tcG9uZW50cyIsImZvcmNlVmVjdG9yc1N0cmluZyIsImZvcmNlVmVjdG9ycyIsInRvdGFsU3RyaW5nIiwidG90YWwiLCJ2ZWxvY2l0eVZlY3RvcnNTdHJpbmciLCJ2ZWxvY2l0eVZlY3RvcnMiLCJMQUJFTF9PUFRJT05TIiwiUEFORUxfTEFCRUxfT1BUSU9OUyIsIlZFTE9DSVRZX1ZFQ1RPUl9JQ09OIiwiQUNDRUxFUkFUSU9OX1ZFQ1RPUl9JQ09OIiwiRk9SQ0VfVkVDVE9SX0lDT04iLCJWZWN0b3JzVmVjdG9yc0NvbnRyb2xQYW5lbCIsImNvbnN0cnVjdG9yIiwidmlld1Byb3BlcnRpZXMiLCJvcHRpb25zIiwiUklHSFRTSURFX1BBTkVMX09QVElPTlMiLCJhbGlnbiIsInRhbmRlbSIsIlJFUVVJUkVEIiwiY2hlY2tib3hPcHRpb25zIiwibWF4V2lkdGgiLCJtaW5XaWR0aCIsInhNYXJnaW4iLCJ3aWR0aCIsImJveFdpZHRoIiwidmVjdG9yc0Rpc3BsYXlSYWRpb0J1dHRvbkdyb3VwIiwidmVjdG9yc0Rpc3BsYXlQcm9wZXJ0eSIsImNyZWF0ZU5vZGUiLCJ0YW5kZW1OYW1lIiwidmFsdWUiLCJUT1RBTCIsIkNPTVBPTkVOVFMiLCJyYWRpb0J1dHRvbk9wdGlvbnMiLCJyYWRpdXMiLCJzcGFjaW5nIiwidG91Y2hBcmVhWERpbGF0aW9uIiwiY3JlYXRlVGFuZGVtIiwicGhldGlvRG9jdW1lbnRhdGlvbiIsInZlbG9jaXR5TGFiZWwiLCJ2ZWxvY2l0eUNoZWNrYm94Q29udGVudCIsImNoaWxkcmVuIiwidmVsb2NpdHlDaGVja2JveCIsInZlbG9jaXR5VmVjdG9yc09uUHJvcGVydHkiLCJhY2NlbGVyYXRpb25MYWJlbCIsImFjY2VsZXJhdGlvbkNoZWNrYm94Q29udGVudCIsImFjY2VsZXJhdGlvbkNoZWNrYm94IiwiYWNjZWxlcmF0aW9uVmVjdG9yc09uUHJvcGVydHkiLCJmb3JjZUxhYmVsIiwiZm9yY2VDaGVja2JveENvbnRlbnQiLCJmb3JjZUNoZWNrYm94IiwiZm9yY2VWZWN0b3JzT25Qcm9wZXJ0eSIsImNvbnRlbnQiLCJjb250cm9sc1ZlcnRpY2FsU3BhY2UiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlZlY3RvcnNWZWN0b3JzQ29udHJvbFBhbmVsLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE2LTIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIENvbnRyb2wgcGFuZWwgZm9yIGNob29zaW5nIHdoaWNoIHZlY3RvcnMgYXJlIHZpc2libGUuXHJcbiAqXHJcbiAqIEBhdXRob3IgQW5kcmVhIExpbiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgbWVyZ2UgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL21lcmdlLmpzJztcclxuaW1wb3J0IHsgSEJveCwgTm9kZSwgVGV4dCwgVkJveCB9IGZyb20gJy4uLy4uLy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBDaGVja2JveCBmcm9tICcuLi8uLi8uLi8uLi9zdW4vanMvQ2hlY2tib3guanMnO1xyXG5pbXBvcnQgUGFuZWwgZnJvbSAnLi4vLi4vLi4vLi4vc3VuL2pzL1BhbmVsLmpzJztcclxuaW1wb3J0IFZlcnRpY2FsQXF1YVJhZGlvQnV0dG9uR3JvdXAgZnJvbSAnLi4vLi4vLi4vLi4vc3VuL2pzL1ZlcnRpY2FsQXF1YVJhZGlvQnV0dG9uR3JvdXAuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uLy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cyBmcm9tICcuLi8uLi9jb21tb24vUHJvamVjdGlsZU1vdGlvbkNvbnN0YW50cy5qcyc7XHJcbmltcG9ydCBWZWN0b3JzRGlzcGxheUVudW1lcmF0aW9uIGZyb20gJy4uLy4uL2NvbW1vbi92aWV3L1ZlY3RvcnNEaXNwbGF5RW51bWVyYXRpb24uanMnO1xyXG5pbXBvcnQgcHJvamVjdGlsZU1vdGlvbiBmcm9tICcuLi8uLi9wcm9qZWN0aWxlTW90aW9uLmpzJztcclxuaW1wb3J0IFByb2plY3RpbGVNb3Rpb25TdHJpbmdzIGZyb20gJy4uLy4uL1Byb2plY3RpbGVNb3Rpb25TdHJpbmdzLmpzJztcclxuXHJcbmNvbnN0IGFjY2VsZXJhdGlvblZlY3RvcnNTdHJpbmcgPSBQcm9qZWN0aWxlTW90aW9uU3RyaW5ncy5hY2NlbGVyYXRpb25WZWN0b3JzO1xyXG5jb25zdCBjb21wb25lbnRzU3RyaW5nID0gUHJvamVjdGlsZU1vdGlvblN0cmluZ3MuY29tcG9uZW50cztcclxuY29uc3QgZm9yY2VWZWN0b3JzU3RyaW5nID0gUHJvamVjdGlsZU1vdGlvblN0cmluZ3MuZm9yY2VWZWN0b3JzO1xyXG5jb25zdCB0b3RhbFN0cmluZyA9IFByb2plY3RpbGVNb3Rpb25TdHJpbmdzLnRvdGFsO1xyXG5jb25zdCB2ZWxvY2l0eVZlY3RvcnNTdHJpbmcgPSBQcm9qZWN0aWxlTW90aW9uU3RyaW5ncy52ZWxvY2l0eVZlY3RvcnM7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgTEFCRUxfT1BUSU9OUyA9IFByb2plY3RpbGVNb3Rpb25Db25zdGFudHMuUEFORUxfTEFCRUxfT1BUSU9OUztcclxuY29uc3QgVkVMT0NJVFlfVkVDVE9SX0lDT04gPSBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLlZFTE9DSVRZX1ZFQ1RPUl9JQ09OO1xyXG5jb25zdCBBQ0NFTEVSQVRJT05fVkVDVE9SX0lDT04gPSBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLkFDQ0VMRVJBVElPTl9WRUNUT1JfSUNPTjtcclxuY29uc3QgRk9SQ0VfVkVDVE9SX0lDT04gPSBQcm9qZWN0aWxlTW90aW9uQ29uc3RhbnRzLkZPUkNFX1ZFQ1RPUl9JQ09OO1xyXG5cclxuY2xhc3MgVmVjdG9yc1ZlY3RvcnNDb250cm9sUGFuZWwgZXh0ZW5kcyBQYW5lbCB7XHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHtQcm9qZWN0aWxlTW90aW9uVmlld1Byb3BlcnRpZXN9IHZpZXdQcm9wZXJ0aWVzIC0gUHJvcGVydGllcyB0aGF0IGRldGVybWluZSB3aGljaCB2ZWN0b3JzIGFyZSBzaG93blxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cclxuICAgKi9cclxuICBjb25zdHJ1Y3Rvciggdmlld1Byb3BlcnRpZXMsIG9wdGlvbnMgKSB7XHJcblxyXG4gICAgLy8gVGhlIGZpcnN0IG9iamVjdCBpcyBhIHBsYWNlaG9sZGVyIHNvIG5vbmUgb2YgdGhlIG90aGVycyBnZXQgbXV0YXRlZFxyXG4gICAgLy8gVGhlIHNlY29uZCBvYmplY3QgaXMgdGhlIGRlZmF1bHQsIGluIHRoZSBjb25zdGFudHMgZmlsZXNcclxuICAgIC8vIFRoZSB0aGlyZCBvYmplY3QgaXMgb3B0aW9ucyBzcGVjaWZpYyB0byB0aGlzIHBhbmVsLCB3aGljaCBvdmVycmlkZXMgdGhlIGRlZmF1bHRzXHJcbiAgICAvLyBUaGUgZm91cnRoIG9iamVjdCBpcyBvcHRpb25zIGdpdmVuIGF0IHRpbWUgb2YgY29uc3RydWN0aW9uLCB3aGljaCBvdmVycmlkZXMgYWxsIHRoZSBvdGhlcnNcclxuICAgIG9wdGlvbnMgPSBtZXJnZSgge30sIFByb2plY3RpbGVNb3Rpb25Db25zdGFudHMuUklHSFRTSURFX1BBTkVMX09QVElPTlMsIHtcclxuICAgICAgYWxpZ246ICdsZWZ0JyxcclxuICAgICAgdGFuZGVtOiBUYW5kZW0uUkVRVUlSRURcclxuICAgIH0sIG9wdGlvbnMgKTtcclxuXHJcbiAgICBjb25zdCBjaGVja2JveE9wdGlvbnMgPSB7XHJcbiAgICAgIG1heFdpZHRoOiBvcHRpb25zLm1pbldpZHRoIC0gMyAqIG9wdGlvbnMueE1hcmdpbiAtIFZFTE9DSVRZX1ZFQ1RPUl9JQ09OLndpZHRoLFxyXG4gICAgICBib3hXaWR0aDogMThcclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgdmVjdG9yc0Rpc3BsYXlSYWRpb0J1dHRvbkdyb3VwID0gbmV3IFZlcnRpY2FsQXF1YVJhZGlvQnV0dG9uR3JvdXAoIHZpZXdQcm9wZXJ0aWVzLnZlY3RvcnNEaXNwbGF5UHJvcGVydHksIFsge1xyXG4gICAgICBjcmVhdGVOb2RlOiAoKSA9PiBuZXcgVGV4dCggdG90YWxTdHJpbmcsIExBQkVMX09QVElPTlMgKSxcclxuICAgICAgdGFuZGVtTmFtZTogJ3RvdGFsUmFkaW9CdXR0b24nLFxyXG4gICAgICB2YWx1ZTogVmVjdG9yc0Rpc3BsYXlFbnVtZXJhdGlvbi5UT1RBTFxyXG4gICAgfSwge1xyXG4gICAgICBjcmVhdGVOb2RlOiAoKSA9PiBuZXcgVGV4dCggY29tcG9uZW50c1N0cmluZywgTEFCRUxfT1BUSU9OUyApLFxyXG4gICAgICB0YW5kZW1OYW1lOiAnY29tcG9uZW50c1JhZGlvQnV0dG9uJyxcclxuICAgICAgdmFsdWU6IFZlY3RvcnNEaXNwbGF5RW51bWVyYXRpb24uQ09NUE9ORU5UU1xyXG4gICAgfSBdLCB7XHJcbiAgICAgIHJhZGlvQnV0dG9uT3B0aW9uczogeyByYWRpdXM6IDggfSxcclxuICAgICAgc3BhY2luZzogMTAsICAgICAvLyB2ZXJ0aWNhbCBzcGFjaW5nIGJldHdlZW4gZWFjaCByYWRpbyBidXR0b25cclxuICAgICAgdG91Y2hBcmVhWERpbGF0aW9uOiA1LFxyXG4gICAgICBtYXhXaWR0aDogY2hlY2tib3hPcHRpb25zLm1heFdpZHRoLFxyXG4gICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ3ZlY3RvcnNEaXNwbGF5UmFkaW9CdXR0b25Hcm91cCcgKSxcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ1JhZGlvIGJ1dHRvbiBncm91cCB0byBzZWxlY3Qgd2hhdCB0eXBlIG9mIHZlY3RvcnMgYXJlIGRpc3BsYXllZCB3aXRoIGEgZmx5aW5nIHByb2plY3RpbGUnXHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3QgdmVsb2NpdHlMYWJlbCA9IG5ldyBUZXh0KCB2ZWxvY2l0eVZlY3RvcnNTdHJpbmcsIExBQkVMX09QVElPTlMgKTtcclxuICAgIGNvbnN0IHZlbG9jaXR5Q2hlY2tib3hDb250ZW50ID0gbmV3IEhCb3goIHtcclxuICAgICAgc3BhY2luZzogb3B0aW9ucy54TWFyZ2luLFxyXG4gICAgICBjaGlsZHJlbjogW1xyXG4gICAgICAgIHZlbG9jaXR5TGFiZWwsXHJcbiAgICAgICAgbmV3IE5vZGUoIHsgY2hpbGRyZW46IFsgVkVMT0NJVFlfVkVDVE9SX0lDT04gXSB9ICkgLy8gc28gdGhhdCBIQm94IHRyYW5zZm9ybXMgdGhlIGludGVybWVkaWFyeSBOb2RlXHJcbiAgICAgIF1cclxuICAgIH0gKTtcclxuICAgIGNvbnN0IHZlbG9jaXR5Q2hlY2tib3ggPSBuZXcgQ2hlY2tib3goIHZpZXdQcm9wZXJ0aWVzLnZlbG9jaXR5VmVjdG9yc09uUHJvcGVydHksIHZlbG9jaXR5Q2hlY2tib3hDb250ZW50LCBtZXJnZSggeyB0YW5kZW06IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ3ZlbG9jaXR5Q2hlY2tib3gnICkgfSwgY2hlY2tib3hPcHRpb25zICkgKTtcclxuXHJcbiAgICBjb25zdCBhY2NlbGVyYXRpb25MYWJlbCA9IG5ldyBUZXh0KCBhY2NlbGVyYXRpb25WZWN0b3JzU3RyaW5nLCBMQUJFTF9PUFRJT05TICk7XHJcbiAgICBjb25zdCBhY2NlbGVyYXRpb25DaGVja2JveENvbnRlbnQgPSBuZXcgSEJveCgge1xyXG4gICAgICBzcGFjaW5nOiBvcHRpb25zLnhNYXJnaW4sXHJcbiAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgYWNjZWxlcmF0aW9uTGFiZWwsXHJcbiAgICAgICAgbmV3IE5vZGUoIHsgY2hpbGRyZW46IFsgQUNDRUxFUkFUSU9OX1ZFQ1RPUl9JQ09OIF0gfSApIC8vIHNvIHRoYXQgSEJveCB0cmFuc2Zvcm1zIHRoZSBpbnRlcm1lZGlhcnkgTm9kZVxyXG4gICAgICBdXHJcbiAgICB9ICk7XHJcbiAgICBjb25zdCBhY2NlbGVyYXRpb25DaGVja2JveCA9IG5ldyBDaGVja2JveCggdmlld1Byb3BlcnRpZXMuYWNjZWxlcmF0aW9uVmVjdG9yc09uUHJvcGVydHksIGFjY2VsZXJhdGlvbkNoZWNrYm94Q29udGVudCwgbWVyZ2UoIHsgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdhY2NlbGVyYXRpb25DaGVja2JveCcgKSB9LCBjaGVja2JveE9wdGlvbnMgKSApO1xyXG5cclxuICAgIGNvbnN0IGZvcmNlTGFiZWwgPSBuZXcgVGV4dCggZm9yY2VWZWN0b3JzU3RyaW5nLCBMQUJFTF9PUFRJT05TICk7XHJcbiAgICBjb25zdCBmb3JjZUNoZWNrYm94Q29udGVudCA9IG5ldyBIQm94KCB7XHJcbiAgICAgIHNwYWNpbmc6IG9wdGlvbnMueE1hcmdpbixcclxuICAgICAgY2hpbGRyZW46IFtcclxuICAgICAgICBmb3JjZUxhYmVsLFxyXG4gICAgICAgIG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIEZPUkNFX1ZFQ1RPUl9JQ09OIF0gfSApIC8vIHNvIHRoYXQgSEJveCB0cmFuc2Zvcm1zIHRoZSBpbnRlcm1lZGlhcnkgTm9kZVxyXG4gICAgICBdXHJcbiAgICB9ICk7XHJcbiAgICBjb25zdCBmb3JjZUNoZWNrYm94ID0gbmV3IENoZWNrYm94KCB2aWV3UHJvcGVydGllcy5mb3JjZVZlY3RvcnNPblByb3BlcnR5LCBmb3JjZUNoZWNrYm94Q29udGVudCwgbWVyZ2UoIHsgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdmb3JjZUNoZWNrYm94JyApIH0sIGNoZWNrYm94T3B0aW9ucyApICk7XHJcblxyXG4gICAgLy8gVGhlIGNvbnRlbnRzIG9mIHRoZSBjb250cm9sIHBhbmVsXHJcbiAgICBjb25zdCBjb250ZW50ID0gbmV3IFZCb3goIHtcclxuICAgICAgYWxpZ246ICdsZWZ0JyxcclxuICAgICAgc3BhY2luZzogb3B0aW9ucy5jb250cm9sc1ZlcnRpY2FsU3BhY2UsXHJcbiAgICAgIGNoaWxkcmVuOiBbXHJcbiAgICAgICAgdmVjdG9yc0Rpc3BsYXlSYWRpb0J1dHRvbkdyb3VwLFxyXG4gICAgICAgIHZlbG9jaXR5Q2hlY2tib3gsXHJcbiAgICAgICAgYWNjZWxlcmF0aW9uQ2hlY2tib3gsXHJcbiAgICAgICAgZm9yY2VDaGVja2JveFxyXG4gICAgICBdXHJcbiAgICB9ICk7XHJcblxyXG4gICAgc3VwZXIoIGNvbnRlbnQsIG9wdGlvbnMgKTtcclxuICB9XHJcbn1cclxuXHJcbnByb2plY3RpbGVNb3Rpb24ucmVnaXN0ZXIoICdWZWN0b3JzVmVjdG9yc0NvbnRyb2xQYW5lbCcsIFZlY3RvcnNWZWN0b3JzQ29udHJvbFBhbmVsICk7XHJcbmV4cG9ydCBkZWZhdWx0IFZlY3RvcnNWZWN0b3JzQ29udHJvbFBhbmVsOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxLQUFLLE1BQU0sbUNBQW1DO0FBQ3JELFNBQVNDLElBQUksRUFBRUMsSUFBSSxFQUFFQyxJQUFJLEVBQUVDLElBQUksUUFBUSxtQ0FBbUM7QUFDMUUsT0FBT0MsUUFBUSxNQUFNLGdDQUFnQztBQUNyRCxPQUFPQyxLQUFLLE1BQU0sNkJBQTZCO0FBQy9DLE9BQU9DLDRCQUE0QixNQUFNLG9EQUFvRDtBQUM3RixPQUFPQyxNQUFNLE1BQU0saUNBQWlDO0FBQ3BELE9BQU9DLHlCQUF5QixNQUFNLDJDQUEyQztBQUNqRixPQUFPQyx5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