// Copyright 2014-2024, University of Colorado Boulder

/**
 * ABSwitch is a control for switching between 2 choices, referred to as 'A' & 'B'.
 * Choice 'A' is to the left of the switch, choice 'B' is to the right.
 * This decorates ToggleSwitch with labels.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Emitter from '../../axon/js/Emitter.js';
import InstanceRegistry from '../../phet-core/js/documentation/InstanceRegistry.js';
import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
import { AlignBox, AlignGroup, HBox, PressListener, SceneryConstants } from '../../scenery/js/imports.js';
import Tandem from '../../tandem/js/Tandem.js';
import sun from './sun.js';
import ToggleSwitch from './ToggleSwitch.js';
// constants

// Uses opacity as the default method of indicating whether a {Node} label is {boolean} enabled.
const DEFAULT_SET_LABEL_ENABLED = (label, enabled) => {
  label.opacity = enabled ? 1.0 : SceneryConstants.DISABLED_OPACITY;
};
export default class ABSwitch extends HBox {
  // Emits on input that results in a change to the Property value, after the Property has changed.
  onInputEmitter = new Emitter();

  /**
   * @param property - value of the current choice
   * @param valueA - value for choice 'A'
   * @param labelA - label for choice 'A'
   * @param valueB - value for choice 'B'
   * @param labelB - label for choice 'B'
   * @param providedOptions
   */
  constructor(property, valueA, labelA, valueB, labelB, providedOptions) {
    assert && assert(property.valueComparisonStrategy === 'reference', 'ABSwitch depends on "===" equality for value comparison');

    // PhET-iO requirements
    assert && assert(labelA.tandem, 'labelA must have a tandem');
    assert && assert(labelB.tandem, 'labelB must have a tandem');

    // default option values
    const options = optionize()({
      // SelfOptions
      toggleSwitchOptions: {
        enabledPropertyOptions: {
          phetioFeatured: false // ABSwitch has an enabledProperty that is preferred to the sub-component's
        }
      },
      setLabelEnabled: DEFAULT_SET_LABEL_ENABLED,
      centerOnSwitch: false,
      // HBoxOptions
      cursor: 'pointer',
      disabledOpacity: SceneryConstants.DISABLED_OPACITY,
      spacing: 8,
      // phet-io
      tandem: Tandem.REQUIRED,
      tandemNameSuffix: 'Switch',
      visiblePropertyOptions: {
        phetioFeatured: true
      },
      phetioEnabledPropertyInstrumented: true // opt into default PhET-iO instrumented enabledProperty
    }, providedOptions);
    const toggleSwitch = new ToggleSwitch(property, valueA, valueB, combineOptions({
      tandem: options.tandem.createTandem('toggleSwitch')
    }, options.toggleSwitchOptions));
    let nodeA = labelA;
    let nodeB = labelB;
    if (options.centerOnSwitch) {
      // Make both labels have the same effective size, so that this.center is at the center of toggleSwitch.
      const alignGroup = new AlignGroup();
      nodeA = new AlignBox(labelA, {
        group: alignGroup,
        xAlign: 'right'
      });
      nodeB = new AlignBox(labelB, {
        group: alignGroup,
        xAlign: 'left'
      });
    }
    options.children = [nodeA, toggleSwitch, nodeB];
    super(options);
    this.property = property;
    this.valueA = valueA;
    this.valueB = valueB;
    this.labelA = labelA;
    this.labelB = labelB;
    this.toggleSwitch = toggleSwitch;
    this.setLabelEnabled = options.setLabelEnabled;
    const propertyListener = () => this.updateLabelsEnabled();
    property.link(propertyListener); // unlink on dispose

    // click on labels to select
    const pressListenerA = new PressListener({
      release: () => {
        const oldValue = property.value;
        property.value = valueA;
        if (oldValue !== valueA) {
          this.onInputEmitter.emit();
        }
      },
      tandem: labelA.tandem.createTandem('pressListener')
    });
    labelA.addInputListener(pressListenerA); // removeInputListener on dispose

    const pressListenerB = new PressListener({
      release: () => {
        const oldValue = property.value;
        property.value = valueB;
        if (oldValue !== valueB) {
          this.onInputEmitter.emit();
        }
      },
      tandem: labelB.tandem.createTandem('pressListener')
    });
    labelB.addInputListener(pressListenerB); // removeInputListener on dispose

    // The toggleSwitch input triggers ABSwitch input.
    toggleSwitch.onInputEmitter.addListener(() => this.onInputEmitter.emit());

    // Wire up sound on input
    this.onInputEmitter.addListener(() => {
      if (property.value === valueB) {
        toggleSwitch.switchToRightSoundPlayer.play();
      }
      if (property.value === valueA) {
        toggleSwitch.switchToLeftSoundPlayer.play();
      }
    });
    this.disposeABSwitch = () => {
      property.unlink(propertyListener);
      toggleSwitch.dispose();
      this.onInputEmitter.dispose();
      labelA.removeInputListener(pressListenerA);
      labelB.removeInputListener(pressListenerB);
      pressListenerA.dispose();
      pressListenerB.dispose();
    };

    // support for binder documentation, stripped out in builds and only runs when ?binder is specified
    assert && phet?.chipper?.queryParameters?.binder && InstanceRegistry.registerDataURL('sun', 'ABSwitch', this);
  }
  dispose() {
    this.disposeABSwitch();
    super.dispose();
  }

  /**
   * Provide a custom look for when this switch is disabled. We are overriding the default implementation so that
   * the unselected label does not appear to be doubly disabled when the ABSwitch is disabled.
   * See https://github.com/phetsims/sun/issues/853
   */
  onEnabledPropertyChange(enabled) {
    !enabled && this.interruptSubtreeInput();
    this.inputEnabled = enabled;
    this.toggleSwitch.enabled = enabled;
    this.updateLabelsEnabled();
  }

  /**
   * Updates the enabled state of the labels based on the current value of the associated Property.
   * The selected label will appear to be enabled, while the unselected label will appear to be disabled.
   * If the ABSwitch itself is disabled, both labels will appear to be disabled.
   */
  updateLabelsEnabled() {
    this.setLabelEnabled(this.labelA, this.enabled && this.property.value === this.valueA);
    this.setLabelEnabled(this.labelB, this.enabled && this.property.value === this.valueB);
  }
}
sun.register('ABSwitch', ABSwitch);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJFbWl0dGVyIiwiSW5zdGFuY2VSZWdpc3RyeSIsIm9wdGlvbml6ZSIsImNvbWJpbmVPcHRpb25zIiwiQWxpZ25Cb3giLCJBbGlnbkdyb3VwIiwiSEJveCIsIlByZXNzTGlzdGVuZXIiLCJTY2VuZXJ5Q29uc3RhbnRzIiwiVGFuZGVtIiwic3VuIiwiVG9nZ2xlU3dpdGNoIiwiREVGQVVMVF9TRVRfTEFCRUxfRU5BQkxFRCIsImxhYmVsIiwiZW5hYmxlZCIsIm9wYWNpdHkiLCJESVNBQkxFRF9PUEFDSVRZIiwiQUJTd2l0Y2giLCJvbklucHV0RW1pdHRlciIsImNvbnN0cnVjdG9yIiwicHJvcGVydHkiLCJ2YWx1ZUEiLCJsYWJlbEEiLCJ2YWx1ZUIiLCJsYWJlbEIiLCJwcm92aWRlZE9wdGlvbnMiLCJhc3NlcnQiLCJ2YWx1ZUNvbXBhcmlzb25TdHJhdGVneSIsInRhbmRlbSIsIm9wdGlvbnMiLCJ0b2dnbGVTd2l0Y2hPcHRpb25zIiwiZW5hYmxlZFByb3BlcnR5T3B0aW9ucyIsInBoZXRpb0ZlYXR1cmVkIiwic2V0TGFiZWxFbmFibGVkIiwiY2VudGVyT25Td2l0Y2giLCJjdXJzb3IiLCJkaXNhYmxlZE9wYWNpdHkiLCJzcGFjaW5nIiwiUkVRVUlSRUQiLCJ0YW5kZW1OYW1lU3VmZml4IiwidmlzaWJsZVByb3BlcnR5T3B0aW9ucyIsInBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCIsInRvZ2dsZVN3aXRjaCIsImNyZWF0ZVRhbmRlbSIsIm5vZGVBIiwibm9kZUIiLCJhbGlnbkdyb3VwIiwiZ3JvdXAiLCJ4QWxpZ24iLCJjaGlsZHJlbiIsInByb3BlcnR5TGlzdGVuZXIiLCJ1cGRhdGVMYWJlbHNFbmFibGVkIiwibGluayIsInByZXNzTGlzdGVuZXJBIiwicmVsZWFzZSIsIm9sZFZhbHVlIiwidmFsdWUiLCJlbWl0IiwiYWRkSW5wdXRMaXN0ZW5lciIsInByZXNzTGlzdGVuZXJCIiwiYWRkTGlzdGVuZXIiLCJzd2l0Y2hUb1JpZ2h0U291bmRQbGF5ZXIiLCJwbGF5Iiwic3dpdGNoVG9MZWZ0U291bmRQbGF5ZXIiLCJkaXNwb3NlQUJTd2l0Y2giLCJ1bmxpbmsiLCJkaXNwb3NlIiwicmVtb3ZlSW5wdXRMaXN0ZW5lciIsInBoZXQiLCJjaGlwcGVyIiwicXVlcnlQYXJhbWV0ZXJzIiwiYmluZGVyIiwicmVnaXN0ZXJEYXRhVVJMIiwib25FbmFibGVkUHJvcGVydHlDaGFuZ2UiLCJpbnRlcnJ1cHRTdWJ0cmVlSW5wdXQiLCJpbnB1dEVuYWJsZWQiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkFCU3dpdGNoLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE0LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEFCU3dpdGNoIGlzIGEgY29udHJvbCBmb3Igc3dpdGNoaW5nIGJldHdlZW4gMiBjaG9pY2VzLCByZWZlcnJlZCB0byBhcyAnQScgJiAnQicuXHJcbiAqIENob2ljZSAnQScgaXMgdG8gdGhlIGxlZnQgb2YgdGhlIHN3aXRjaCwgY2hvaWNlICdCJyBpcyB0byB0aGUgcmlnaHQuXHJcbiAqIFRoaXMgZGVjb3JhdGVzIFRvZ2dsZVN3aXRjaCB3aXRoIGxhYmVscy5cclxuICpcclxuICogQGF1dGhvciBDaHJpcyBNYWxsZXkgKFBpeGVsWm9vbSwgSW5jLilcclxuICovXHJcblxyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBFbWl0dGVyIGZyb20gJy4uLy4uL2F4b24vanMvRW1pdHRlci5qcyc7XHJcbmltcG9ydCBJbnN0YW5jZVJlZ2lzdHJ5IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9kb2N1bWVudGF0aW9uL0luc3RhbmNlUmVnaXN0cnkuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplLCB7IGNvbWJpbmVPcHRpb25zIH0gZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCB7IEFsaWduQm94LCBBbGlnbkdyb3VwLCBIQm94LCBIQm94T3B0aW9ucywgTm9kZSwgUHJlc3NMaXN0ZW5lciwgU2NlbmVyeUNvbnN0YW50cyB9IGZyb20gJy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcbmltcG9ydCBzdW4gZnJvbSAnLi9zdW4uanMnO1xyXG5pbXBvcnQgVG9nZ2xlU3dpdGNoLCB7IFRvZ2dsZVN3aXRjaE9wdGlvbnMgfSBmcm9tICcuL1RvZ2dsZVN3aXRjaC5qcyc7XHJcbmltcG9ydCBURW1pdHRlciBmcm9tICcuLi8uLi9heG9uL2pzL1RFbWl0dGVyLmpzJztcclxuXHJcbi8vIGNvbnN0YW50c1xyXG5cclxuLy8gVXNlcyBvcGFjaXR5IGFzIHRoZSBkZWZhdWx0IG1ldGhvZCBvZiBpbmRpY2F0aW5nIHdoZXRoZXIgYSB7Tm9kZX0gbGFiZWwgaXMge2Jvb2xlYW59IGVuYWJsZWQuXHJcbmNvbnN0IERFRkFVTFRfU0VUX0xBQkVMX0VOQUJMRUQgPSAoIGxhYmVsOiBOb2RlLCBlbmFibGVkOiBib29sZWFuICkgPT4ge1xyXG4gIGxhYmVsLm9wYWNpdHkgPSBlbmFibGVkID8gMS4wIDogU2NlbmVyeUNvbnN0YW50cy5ESVNBQkxFRF9PUEFDSVRZO1xyXG59O1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuXHJcbiAgLy8gb3B0aW9ucyBwYXNzZWQgdG8gVG9nZ2xlU3dpdGNoXHJcbiAgdG9nZ2xlU3dpdGNoT3B0aW9ucz86IFRvZ2dsZVN3aXRjaE9wdGlvbnM7XHJcblxyXG4gIC8vIG1ldGhvZCBvZiBtYWtpbmcgYSBsYWJlbCBsb29rIGRpc2FibGVkXHJcbiAgc2V0TGFiZWxFbmFibGVkPzogKCBsYWJlbE5vZGU6IE5vZGUsIGVuYWJsZWQ6IGJvb2xlYW4gKSA9PiB2b2lkO1xyXG5cclxuICAvLyBpZiB0cnVlLCB0aGlzLmNlbnRlciB3aWxsIGJlIGF0IHRoZSBjZW50ZXIgb2YgdGhlIFRvZ2dsZVN3aXRjaFxyXG4gIGNlbnRlck9uU3dpdGNoPzogYm9vbGVhbjtcclxufTtcclxuXHJcbmV4cG9ydCB0eXBlIEFCU3dpdGNoT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgSEJveE9wdGlvbnM7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBQlN3aXRjaDxUPiBleHRlbmRzIEhCb3gge1xyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IHByb3BlcnR5OiBQcm9wZXJ0eTxUPjtcclxuICBwcml2YXRlIHJlYWRvbmx5IHZhbHVlQTogVDtcclxuICBwcml2YXRlIHJlYWRvbmx5IHZhbHVlQjogVDtcclxuICBwcml2YXRlIHJlYWRvbmx5IGxhYmVsQTogTm9kZTtcclxuICBwcml2YXRlIHJlYWRvbmx5IGxhYmVsQjogTm9kZTtcclxuICBwcml2YXRlIHJlYWRvbmx5IHRvZ2dsZVN3aXRjaDogVG9nZ2xlU3dpdGNoPFQ+O1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgc2V0TGFiZWxFbmFibGVkOiAoIGxhYmVsTm9kZTogTm9kZSwgZW5hYmxlZDogYm9vbGVhbiApID0+IHZvaWQ7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNwb3NlQUJTd2l0Y2g6ICgpID0+IHZvaWQ7XHJcblxyXG4gIC8vIEVtaXRzIG9uIGlucHV0IHRoYXQgcmVzdWx0cyBpbiBhIGNoYW5nZSB0byB0aGUgUHJvcGVydHkgdmFsdWUsIGFmdGVyIHRoZSBQcm9wZXJ0eSBoYXMgY2hhbmdlZC5cclxuICBwdWJsaWMgcmVhZG9ubHkgb25JbnB1dEVtaXR0ZXI6IFRFbWl0dGVyID0gbmV3IEVtaXR0ZXIoKTtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHByb3BlcnR5IC0gdmFsdWUgb2YgdGhlIGN1cnJlbnQgY2hvaWNlXHJcbiAgICogQHBhcmFtIHZhbHVlQSAtIHZhbHVlIGZvciBjaG9pY2UgJ0EnXHJcbiAgICogQHBhcmFtIGxhYmVsQSAtIGxhYmVsIGZvciBjaG9pY2UgJ0EnXHJcbiAgICogQHBhcmFtIHZhbHVlQiAtIHZhbHVlIGZvciBjaG9pY2UgJ0InXHJcbiAgICogQHBhcmFtIGxhYmVsQiAtIGxhYmVsIGZvciBjaG9pY2UgJ0InXHJcbiAgICogQHBhcmFtIHByb3ZpZGVkT3B0aW9uc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggcHJvcGVydHk6IFByb3BlcnR5PFQ+LCB2YWx1ZUE6IFQsIGxhYmVsQTogTm9kZSwgdmFsdWVCOiBULCBsYWJlbEI6IE5vZGUsIHByb3ZpZGVkT3B0aW9ucz86IEFCU3dpdGNoT3B0aW9ucyApIHtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHByb3BlcnR5LnZhbHVlQ29tcGFyaXNvblN0cmF0ZWd5ID09PSAncmVmZXJlbmNlJyxcclxuICAgICAgJ0FCU3dpdGNoIGRlcGVuZHMgb24gXCI9PT1cIiBlcXVhbGl0eSBmb3IgdmFsdWUgY29tcGFyaXNvbicgKTtcclxuXHJcbiAgICAvLyBQaEVULWlPIHJlcXVpcmVtZW50c1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggbGFiZWxBLnRhbmRlbSwgJ2xhYmVsQSBtdXN0IGhhdmUgYSB0YW5kZW0nICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBsYWJlbEIudGFuZGVtLCAnbGFiZWxCIG11c3QgaGF2ZSBhIHRhbmRlbScgKTtcclxuXHJcbiAgICAvLyBkZWZhdWx0IG9wdGlvbiB2YWx1ZXNcclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8QUJTd2l0Y2hPcHRpb25zLCBTZWxmT3B0aW9ucywgSEJveE9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgIC8vIFNlbGZPcHRpb25zXHJcbiAgICAgIHRvZ2dsZVN3aXRjaE9wdGlvbnM6IHtcclxuICAgICAgICBlbmFibGVkUHJvcGVydHlPcHRpb25zOiB7XHJcbiAgICAgICAgICBwaGV0aW9GZWF0dXJlZDogZmFsc2UgLy8gQUJTd2l0Y2ggaGFzIGFuIGVuYWJsZWRQcm9wZXJ0eSB0aGF0IGlzIHByZWZlcnJlZCB0byB0aGUgc3ViLWNvbXBvbmVudCdzXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBzZXRMYWJlbEVuYWJsZWQ6IERFRkFVTFRfU0VUX0xBQkVMX0VOQUJMRUQsXHJcbiAgICAgIGNlbnRlck9uU3dpdGNoOiBmYWxzZSxcclxuXHJcbiAgICAgIC8vIEhCb3hPcHRpb25zXHJcbiAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxyXG4gICAgICBkaXNhYmxlZE9wYWNpdHk6IFNjZW5lcnlDb25zdGFudHMuRElTQUJMRURfT1BBQ0lUWSxcclxuICAgICAgc3BhY2luZzogOCxcclxuXHJcbiAgICAgIC8vIHBoZXQtaW9cclxuICAgICAgdGFuZGVtOiBUYW5kZW0uUkVRVUlSRUQsXHJcbiAgICAgIHRhbmRlbU5hbWVTdWZmaXg6ICdTd2l0Y2gnLFxyXG4gICAgICB2aXNpYmxlUHJvcGVydHlPcHRpb25zOiB7IHBoZXRpb0ZlYXR1cmVkOiB0cnVlIH0sXHJcbiAgICAgIHBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZDogdHJ1ZSAvLyBvcHQgaW50byBkZWZhdWx0IFBoRVQtaU8gaW5zdHJ1bWVudGVkIGVuYWJsZWRQcm9wZXJ0eVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgY29uc3QgdG9nZ2xlU3dpdGNoID0gbmV3IFRvZ2dsZVN3aXRjaDxUPiggcHJvcGVydHksIHZhbHVlQSwgdmFsdWVCLFxyXG4gICAgICBjb21iaW5lT3B0aW9uczxUb2dnbGVTd2l0Y2hPcHRpb25zPigge1xyXG4gICAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAndG9nZ2xlU3dpdGNoJyApXHJcbiAgICAgIH0sIG9wdGlvbnMudG9nZ2xlU3dpdGNoT3B0aW9ucyApICk7XHJcblxyXG4gICAgbGV0IG5vZGVBID0gbGFiZWxBO1xyXG4gICAgbGV0IG5vZGVCID0gbGFiZWxCO1xyXG4gICAgaWYgKCBvcHRpb25zLmNlbnRlck9uU3dpdGNoICkge1xyXG5cclxuICAgICAgLy8gTWFrZSBib3RoIGxhYmVscyBoYXZlIHRoZSBzYW1lIGVmZmVjdGl2ZSBzaXplLCBzbyB0aGF0IHRoaXMuY2VudGVyIGlzIGF0IHRoZSBjZW50ZXIgb2YgdG9nZ2xlU3dpdGNoLlxyXG4gICAgICBjb25zdCBhbGlnbkdyb3VwID0gbmV3IEFsaWduR3JvdXAoKTtcclxuICAgICAgbm9kZUEgPSBuZXcgQWxpZ25Cb3goIGxhYmVsQSwge1xyXG4gICAgICAgIGdyb3VwOiBhbGlnbkdyb3VwLFxyXG4gICAgICAgIHhBbGlnbjogJ3JpZ2h0J1xyXG4gICAgICB9ICk7XHJcbiAgICAgIG5vZGVCID0gbmV3IEFsaWduQm94KCBsYWJlbEIsIHtcclxuICAgICAgICBncm91cDogYWxpZ25Hcm91cCxcclxuICAgICAgICB4QWxpZ246ICdsZWZ0J1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgb3B0aW9ucy5jaGlsZHJlbiA9IFsgbm9kZUEsIHRvZ2dsZVN3aXRjaCwgbm9kZUIgXTtcclxuXHJcbiAgICBzdXBlciggb3B0aW9ucyApO1xyXG5cclxuICAgIHRoaXMucHJvcGVydHkgPSBwcm9wZXJ0eTtcclxuICAgIHRoaXMudmFsdWVBID0gdmFsdWVBO1xyXG4gICAgdGhpcy52YWx1ZUIgPSB2YWx1ZUI7XHJcbiAgICB0aGlzLmxhYmVsQSA9IGxhYmVsQTtcclxuICAgIHRoaXMubGFiZWxCID0gbGFiZWxCO1xyXG4gICAgdGhpcy50b2dnbGVTd2l0Y2ggPSB0b2dnbGVTd2l0Y2g7XHJcbiAgICB0aGlzLnNldExhYmVsRW5hYmxlZCA9IG9wdGlvbnMuc2V0TGFiZWxFbmFibGVkO1xyXG5cclxuICAgIGNvbnN0IHByb3BlcnR5TGlzdGVuZXIgPSAoKSA9PiB0aGlzLnVwZGF0ZUxhYmVsc0VuYWJsZWQoKTtcclxuICAgIHByb3BlcnR5LmxpbmsoIHByb3BlcnR5TGlzdGVuZXIgKTsgLy8gdW5saW5rIG9uIGRpc3Bvc2VcclxuXHJcbiAgICAvLyBjbGljayBvbiBsYWJlbHMgdG8gc2VsZWN0XHJcbiAgICBjb25zdCBwcmVzc0xpc3RlbmVyQSA9IG5ldyBQcmVzc0xpc3RlbmVyKCB7XHJcbiAgICAgIHJlbGVhc2U6ICgpID0+IHtcclxuICAgICAgICBjb25zdCBvbGRWYWx1ZSA9IHByb3BlcnR5LnZhbHVlO1xyXG4gICAgICAgIHByb3BlcnR5LnZhbHVlID0gdmFsdWVBO1xyXG4gICAgICAgIGlmICggb2xkVmFsdWUgIT09IHZhbHVlQSApIHtcclxuICAgICAgICAgIHRoaXMub25JbnB1dEVtaXR0ZXIuZW1pdCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgdGFuZGVtOiBsYWJlbEEudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ3ByZXNzTGlzdGVuZXInIClcclxuICAgIH0gKTtcclxuICAgIGxhYmVsQS5hZGRJbnB1dExpc3RlbmVyKCBwcmVzc0xpc3RlbmVyQSApOyAvLyByZW1vdmVJbnB1dExpc3RlbmVyIG9uIGRpc3Bvc2VcclxuXHJcbiAgICBjb25zdCBwcmVzc0xpc3RlbmVyQiA9IG5ldyBQcmVzc0xpc3RlbmVyKCB7XHJcbiAgICAgIHJlbGVhc2U6ICgpID0+IHtcclxuICAgICAgICBjb25zdCBvbGRWYWx1ZSA9IHByb3BlcnR5LnZhbHVlO1xyXG4gICAgICAgIHByb3BlcnR5LnZhbHVlID0gdmFsdWVCO1xyXG4gICAgICAgIGlmICggb2xkVmFsdWUgIT09IHZhbHVlQiApIHtcclxuICAgICAgICAgIHRoaXMub25JbnB1dEVtaXR0ZXIuZW1pdCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgdGFuZGVtOiBsYWJlbEIudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ3ByZXNzTGlzdGVuZXInIClcclxuICAgIH0gKTtcclxuICAgIGxhYmVsQi5hZGRJbnB1dExpc3RlbmVyKCBwcmVzc0xpc3RlbmVyQiApOyAvLyByZW1vdmVJbnB1dExpc3RlbmVyIG9uIGRpc3Bvc2VcclxuXHJcbiAgICAvLyBUaGUgdG9nZ2xlU3dpdGNoIGlucHV0IHRyaWdnZXJzIEFCU3dpdGNoIGlucHV0LlxyXG4gICAgdG9nZ2xlU3dpdGNoLm9uSW5wdXRFbWl0dGVyLmFkZExpc3RlbmVyKCAoKSA9PiB0aGlzLm9uSW5wdXRFbWl0dGVyLmVtaXQoKSApO1xyXG5cclxuICAgIC8vIFdpcmUgdXAgc291bmQgb24gaW5wdXRcclxuICAgIHRoaXMub25JbnB1dEVtaXR0ZXIuYWRkTGlzdGVuZXIoICgpID0+IHtcclxuICAgICAgaWYgKCBwcm9wZXJ0eS52YWx1ZSA9PT0gdmFsdWVCICkge1xyXG4gICAgICAgIHRvZ2dsZVN3aXRjaC5zd2l0Y2hUb1JpZ2h0U291bmRQbGF5ZXIucGxheSgpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggcHJvcGVydHkudmFsdWUgPT09IHZhbHVlQSApIHtcclxuICAgICAgICB0b2dnbGVTd2l0Y2guc3dpdGNoVG9MZWZ0U291bmRQbGF5ZXIucGxheSgpO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5kaXNwb3NlQUJTd2l0Y2ggPSAoKSA9PiB7XHJcbiAgICAgIHByb3BlcnR5LnVubGluayggcHJvcGVydHlMaXN0ZW5lciApO1xyXG4gICAgICB0b2dnbGVTd2l0Y2guZGlzcG9zZSgpO1xyXG4gICAgICB0aGlzLm9uSW5wdXRFbWl0dGVyLmRpc3Bvc2UoKTtcclxuICAgICAgbGFiZWxBLnJlbW92ZUlucHV0TGlzdGVuZXIoIHByZXNzTGlzdGVuZXJBICk7XHJcbiAgICAgIGxhYmVsQi5yZW1vdmVJbnB1dExpc3RlbmVyKCBwcmVzc0xpc3RlbmVyQiApO1xyXG4gICAgICBwcmVzc0xpc3RlbmVyQS5kaXNwb3NlKCk7XHJcbiAgICAgIHByZXNzTGlzdGVuZXJCLmRpc3Bvc2UoKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gc3VwcG9ydCBmb3IgYmluZGVyIGRvY3VtZW50YXRpb24sIHN0cmlwcGVkIG91dCBpbiBidWlsZHMgYW5kIG9ubHkgcnVucyB3aGVuID9iaW5kZXIgaXMgc3BlY2lmaWVkXHJcbiAgICBhc3NlcnQgJiYgcGhldD8uY2hpcHBlcj8ucXVlcnlQYXJhbWV0ZXJzPy5iaW5kZXIgJiYgSW5zdGFuY2VSZWdpc3RyeS5yZWdpc3RlckRhdGFVUkwoICdzdW4nLCAnQUJTd2l0Y2gnLCB0aGlzICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuZGlzcG9zZUFCU3dpdGNoKCk7XHJcbiAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogUHJvdmlkZSBhIGN1c3RvbSBsb29rIGZvciB3aGVuIHRoaXMgc3dpdGNoIGlzIGRpc2FibGVkLiBXZSBhcmUgb3ZlcnJpZGluZyB0aGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBzbyB0aGF0XHJcbiAgICogdGhlIHVuc2VsZWN0ZWQgbGFiZWwgZG9lcyBub3QgYXBwZWFyIHRvIGJlIGRvdWJseSBkaXNhYmxlZCB3aGVuIHRoZSBBQlN3aXRjaCBpcyBkaXNhYmxlZC5cclxuICAgKiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3N1bi9pc3N1ZXMvODUzXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIG92ZXJyaWRlIG9uRW5hYmxlZFByb3BlcnR5Q2hhbmdlKCBlbmFibGVkOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgIWVuYWJsZWQgJiYgdGhpcy5pbnRlcnJ1cHRTdWJ0cmVlSW5wdXQoKTtcclxuICAgIHRoaXMuaW5wdXRFbmFibGVkID0gZW5hYmxlZDtcclxuICAgIHRoaXMudG9nZ2xlU3dpdGNoLmVuYWJsZWQgPSBlbmFibGVkO1xyXG4gICAgdGhpcy51cGRhdGVMYWJlbHNFbmFibGVkKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVcGRhdGVzIHRoZSBlbmFibGVkIHN0YXRlIG9mIHRoZSBsYWJlbHMgYmFzZWQgb24gdGhlIGN1cnJlbnQgdmFsdWUgb2YgdGhlIGFzc29jaWF0ZWQgUHJvcGVydHkuXHJcbiAgICogVGhlIHNlbGVjdGVkIGxhYmVsIHdpbGwgYXBwZWFyIHRvIGJlIGVuYWJsZWQsIHdoaWxlIHRoZSB1bnNlbGVjdGVkIGxhYmVsIHdpbGwgYXBwZWFyIHRvIGJlIGRpc2FibGVkLlxyXG4gICAqIElmIHRoZSBBQlN3aXRjaCBpdHNlbGYgaXMgZGlzYWJsZWQsIGJvdGggbGFiZWxzIHdpbGwgYXBwZWFyIHRvIGJlIGRpc2FibGVkLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgdXBkYXRlTGFiZWxzRW5hYmxlZCgpOiB2b2lkIHtcclxuICAgIHRoaXMuc2V0TGFiZWxFbmFibGVkKCB0aGlzLmxhYmVsQSwgdGhpcy5lbmFibGVkICYmIHRoaXMucHJvcGVydHkudmFsdWUgPT09IHRoaXMudmFsdWVBICk7XHJcbiAgICB0aGlzLnNldExhYmVsRW5hYmxlZCggdGhpcy5sYWJlbEIsIHRoaXMuZW5hYmxlZCAmJiB0aGlzLnByb3BlcnR5LnZhbHVlID09PSB0aGlzLnZhbHVlQiApO1xyXG4gIH1cclxufVxyXG5cclxuc3VuLnJlZ2lzdGVyKCAnQUJTd2l0Y2gnLCBBQlN3aXRjaCApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBR0EsT0FBT0EsT0FBTyxNQUFNLDBCQUEwQjtBQUM5QyxPQUFPQyxnQkFBZ0IsTUFBTSxzREFBc0Q7QUFDbkYsT0FBT0MsU0FBUyxJQUFJQyxjQUFjLFFBQVEsaUNBQWlDO0FBQzNFLFNBQVNDLFFBQVEsRUFBRUMsVUFBVSxFQUFFQyxJQUFJLEVBQXFCQyxhQUFhLEVBQUVDLGdCQUFnQixRQUFRLDZCQUE2QjtBQUM1SCxPQUFPQyxNQUFNLE1BQU0sMkJBQTJCO0FBQzlDLE9BQU9DLEdBQUcsTUFBTSxVQUFVO0FBQzFCLE9BQU9DLFlBQVksTUFBK0IsbUJBQW1CO0FBR3JFOztBQUVBO0FBQ0EsTUFBTUMseUJBQXlCLEdBQUdBLENBQUVDLEtBQVcsRUFBRUMsT0FBZ0IsS0FBTTtFQUNyRUQsS0FBSyxDQUFDRSxPQUFPLEdBQUdELE9BQU8sR0FBRyxHQUFHLEdBQUdOLGdCQUFnQixDQUFDUSxnQkFBZ0I7QUFDbkUsQ0FBQztB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