// Copyright 2018-2024, University of Colorado Boulder

/**
 * TimeControlNode provides a UI for controlling time.  It includes a play/pause button, step-forward button,
 * optional step-backward button, and optional radio buttons for time speed. Various layouts are supported via options.
 *
 * @author Denzell Barnett (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import InstanceRegistry from '../../phet-core/js/documentation/InstanceRegistry.js';
import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
import { Node, SceneryConstants } from '../../scenery/js/imports.js';
import Panel from '../../sun/js/Panel.js';
import Tandem from '../../tandem/js/Tandem.js';
import sceneryPhet from './sceneryPhet.js';
import SceneryPhetStrings from './SceneryPhetStrings.js';
import TimeSpeed from './TimeSpeed.js';
import TimeSpeedRadioButtonGroup from './TimeSpeedRadioButtonGroup.js';
import PlayPauseStepButtonGroup from './buttons/PlayPauseStepButtonGroup.js';
// default speeds for SpeedRadioButtonGroup
const DEFAULT_TIME_SPEEDS = [TimeSpeed.NORMAL, TimeSpeed.SLOW];
export default class TimeControlNode extends Node {
  // push button for play/pause and (optionally) step forward, step back

  // radio buttons from controlling speed

  // parent for speedRadioButtonGroup, optionally a Panel

  // whether the radio buttons are to the left or right of the push buttons

  // horizontal spacing between push buttons and radio buttons

  constructor(isPlayingProperty, providedOptions) {
    const options = optionize()({
      // TimeControlNodeOptions
      timeSpeedProperty: null,
      timeSpeeds: DEFAULT_TIME_SPEEDS,
      speedRadioButtonGroupOnLeft: false,
      buttonGroupXSpacing: 40,
      wrapSpeedRadioButtonGroupInPanel: false,
      speedRadioButtonGroupPanelOptions: {
        xMargin: 8,
        yMargin: 6
      },
      // NodeOptions
      disabledOpacity: SceneryConstants.DISABLED_OPACITY,
      // phet-io
      tandem: Tandem.REQUIRED,
      tandemNameSuffix: 'TimeControlNode',
      visiblePropertyOptions: {
        phetioFeatured: true
      },
      phetioEnabledPropertyInstrumented: true,
      // opt into default PhET-iO instrumented enabledProperty

      // pdom
      tagName: 'div',
      labelTagName: 'h3',
      labelContent: SceneryPhetStrings.a11y.timeControlNode.labelStringProperty
    }, providedOptions);
    super();
    const children = [];
    this.playPauseStepButtons = new PlayPauseStepButtonGroup(isPlayingProperty, combineOptions({
      tandem: options.tandem.createTandem('playPauseStepButtonGroup')
    }, options.playPauseStepButtonOptions));
    children.push(this.playPauseStepButtons);
    this.speedRadioButtonGroup = null;
    this.speedRadioButtonGroupParent = null;
    if (options.timeSpeedProperty !== null) {
      this.speedRadioButtonGroup = new TimeSpeedRadioButtonGroup(options.timeSpeedProperty, options.timeSpeeds, combineOptions({
        tandem: options.tandem.createTandem('speedRadioButtonGroup')
      }, options.speedRadioButtonGroupOptions));
      if (options.wrapSpeedRadioButtonGroupInPanel) {
        this.speedRadioButtonGroupParent = new Panel(this.speedRadioButtonGroup, options.speedRadioButtonGroupPanelOptions);
      } else {
        this.speedRadioButtonGroupParent = new Node({
          children: [this.speedRadioButtonGroup]
        });
      }
      if (options.speedRadioButtonGroupOnLeft) {
        children.unshift(this.speedRadioButtonGroupParent);
      } else {
        children.push(this.speedRadioButtonGroupParent);
      }
      this.speedRadioButtonGroupParent.centerY = this.playPauseStepButtons.centerY;
    }
    options.children = children;
    this.speedRadioButtonGroupOnLeft = options.speedRadioButtonGroupOnLeft;
    this.buttonGroupXSpacing = options.buttonGroupXSpacing;
    this.setButtonGroupXSpacing(this.buttonGroupXSpacing);
    this.disposeTimeControlNode = () => {
      this.playPauseStepButtons.dispose();
      this.speedRadioButtonGroup && this.speedRadioButtonGroup.dispose();
    };

    // mutate with options after spacing and layout is complete so other layout options apply correctly to the
    // whole TimeControlNode
    this.mutate(options);

    // support for binder documentation, stripped out in builds and only runs when ?binder is specified
    assert && phet?.chipper?.queryParameters?.binder && InstanceRegistry.registerDataURL('scenery-phet', 'TimeControlNode', this);
  }

  /**
   * Translate this node so that the center of the PlayPauseButton is at the specified point in the parent
   * coordinate frame for the TimeControlNode.
   */
  setPlayPauseButtonCenter(center) {
    const distanceToCenter = this.localToParentPoint(this.getPlayPauseButtonCenter()).minus(this.center);
    this.center = center.minus(distanceToCenter);
  }

  /**
   * Get the center of the PlayPauseButton, in the local coordinate frame of the TimeControlNode. Useful if the
   * TimeControlNode needs to be positioned relative to the PlayPauseButtons.
   */
  getPlayPauseButtonCenter() {
    return this.playPauseStepButtons.getPlayPauseButtonCenter();
  }

  /**
   * Set the spacing between the SpeedRadioButtonGroup and the PlayPauseStepButtons. Spacing is from horizontal
   * edge to edge for each Node. This will move the SpeedRadioButtonGroup relative to the edge of the
   * PlayPauseStepButtons. No-op if there is no SpeedRadioButtonGroup for this TimeControlNode.
   */
  setButtonGroupXSpacing(spacing) {
    this.buttonGroupXSpacing = spacing;
    if (this.speedRadioButtonGroupParent) {
      if (this.speedRadioButtonGroupOnLeft) {
        this.speedRadioButtonGroupParent.right = this.playPauseStepButtons.left - this.buttonGroupXSpacing;
      } else {
        this.speedRadioButtonGroupParent.left = this.playPauseStepButtons.right + this.buttonGroupXSpacing;
      }
    }
  }
  getButtonGroupXSpacing() {
    return this.buttonGroupXSpacing;
  }
  dispose() {
    this.disposeTimeControlNode();
    super.dispose();
  }
}
sceneryPhet.register('TimeControlNode', TimeControlNode);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJJbnN0YW5jZVJlZ2lzdHJ5Iiwib3B0aW9uaXplIiwiY29tYmluZU9wdGlvbnMiLCJOb2RlIiwiU2NlbmVyeUNvbnN0YW50cyIsIlBhbmVsIiwiVGFuZGVtIiwic2NlbmVyeVBoZXQiLCJTY2VuZXJ5UGhldFN0cmluZ3MiLCJUaW1lU3BlZWQiLCJUaW1lU3BlZWRSYWRpb0J1dHRvbkdyb3VwIiwiUGxheVBhdXNlU3RlcEJ1dHRvbkdyb3VwIiwiREVGQVVMVF9USU1FX1NQRUVEUyIsIk5PUk1BTCIsIlNMT1ciLCJUaW1lQ29udHJvbE5vZGUiLCJjb25zdHJ1Y3RvciIsImlzUGxheWluZ1Byb3BlcnR5IiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsInRpbWVTcGVlZFByb3BlcnR5IiwidGltZVNwZWVkcyIsInNwZWVkUmFkaW9CdXR0b25Hcm91cE9uTGVmdCIsImJ1dHRvbkdyb3VwWFNwYWNpbmciLCJ3cmFwU3BlZWRSYWRpb0J1dHRvbkdyb3VwSW5QYW5lbCIsInNwZWVkUmFkaW9CdXR0b25Hcm91cFBhbmVsT3B0aW9ucyIsInhNYXJnaW4iLCJ5TWFyZ2luIiwiZGlzYWJsZWRPcGFjaXR5IiwiRElTQUJMRURfT1BBQ0lUWSIsInRhbmRlbSIsIlJFUVVJUkVEIiwidGFuZGVtTmFtZVN1ZmZpeCIsInZpc2libGVQcm9wZXJ0eU9wdGlvbnMiLCJwaGV0aW9GZWF0dXJlZCIsInBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZCIsInRhZ05hbWUiLCJsYWJlbFRhZ05hbWUiLCJsYWJlbENvbnRlbnQiLCJhMTF5IiwidGltZUNvbnRyb2xOb2RlIiwibGFiZWxTdHJpbmdQcm9wZXJ0eSIsImNoaWxkcmVuIiwicGxheVBhdXNlU3RlcEJ1dHRvbnMiLCJjcmVhdGVUYW5kZW0iLCJwbGF5UGF1c2VTdGVwQnV0dG9uT3B0aW9ucyIsInB1c2giLCJzcGVlZFJhZGlvQnV0dG9uR3JvdXAiLCJzcGVlZFJhZGlvQnV0dG9uR3JvdXBQYXJlbnQiLCJzcGVlZFJhZGlvQnV0dG9uR3JvdXBPcHRpb25zIiwidW5zaGlmdCIsImNlbnRlclkiLCJzZXRCdXR0b25Hcm91cFhTcGFjaW5nIiwiZGlzcG9zZVRpbWVDb250cm9sTm9kZSIsImRpc3Bvc2UiLCJtdXRhdGUiLCJhc3NlcnQiLCJwaGV0IiwiY2hpcHBlciIsInF1ZXJ5UGFyYW1ldGVycyIsImJpbmRlciIsInJlZ2lzdGVyRGF0YVVSTCIsInNldFBsYXlQYXVzZUJ1dHRvbkNlbnRlciIsImNlbnRlciIsImRpc3RhbmNlVG9DZW50ZXIiLCJsb2NhbFRvUGFyZW50UG9pbnQiLCJnZXRQbGF5UGF1c2VCdXR0b25DZW50ZXIiLCJtaW51cyIsInNwYWNpbmciLCJyaWdodCIsImxlZnQiLCJnZXRCdXR0b25Hcm91cFhTcGFjaW5nIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJUaW1lQ29udHJvbE5vZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVGltZUNvbnRyb2xOb2RlIHByb3ZpZGVzIGEgVUkgZm9yIGNvbnRyb2xsaW5nIHRpbWUuICBJdCBpbmNsdWRlcyBhIHBsYXkvcGF1c2UgYnV0dG9uLCBzdGVwLWZvcndhcmQgYnV0dG9uLFxyXG4gKiBvcHRpb25hbCBzdGVwLWJhY2t3YXJkIGJ1dHRvbiwgYW5kIG9wdGlvbmFsIHJhZGlvIGJ1dHRvbnMgZm9yIHRpbWUgc3BlZWQuIFZhcmlvdXMgbGF5b3V0cyBhcmUgc3VwcG9ydGVkIHZpYSBvcHRpb25zLlxyXG4gKlxyXG4gKiBAYXV0aG9yIERlbnplbGwgQmFybmV0dCAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKiBAYXV0aG9yIENocmlzIE1hbGxleSAoUGl4ZWxab29tLCBJbmMuKVxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgRW51bWVyYXRpb25Qcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL0VudW1lcmF0aW9uUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgU3RyaWN0T21pdCBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvU3RyaWN0T21pdC5qcyc7XHJcbmltcG9ydCBWZWN0b3IyIGZyb20gJy4uLy4uL2RvdC9qcy9WZWN0b3IyLmpzJztcclxuaW1wb3J0IEluc3RhbmNlUmVnaXN0cnkgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL2RvY3VtZW50YXRpb24vSW5zdGFuY2VSZWdpc3RyeS5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUsIHsgY29tYmluZU9wdGlvbnMgfSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IHsgTm9kZSwgTm9kZU9wdGlvbnMsIFNjZW5lcnlDb25zdGFudHMgfSBmcm9tICcuLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgUGFuZWwsIHsgUGFuZWxPcHRpb25zIH0gZnJvbSAnLi4vLi4vc3VuL2pzL1BhbmVsLmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuaW1wb3J0IHNjZW5lcnlQaGV0IGZyb20gJy4vc2NlbmVyeVBoZXQuanMnO1xyXG5pbXBvcnQgU2NlbmVyeVBoZXRTdHJpbmdzIGZyb20gJy4vU2NlbmVyeVBoZXRTdHJpbmdzLmpzJztcclxuaW1wb3J0IFRpbWVTcGVlZCBmcm9tICcuL1RpbWVTcGVlZC5qcyc7XHJcbmltcG9ydCBUaW1lU3BlZWRSYWRpb0J1dHRvbkdyb3VwLCB7IFRpbWVTcGVlZFJhZGlvQnV0dG9uR3JvdXBPcHRpb25zIH0gZnJvbSAnLi9UaW1lU3BlZWRSYWRpb0J1dHRvbkdyb3VwLmpzJztcclxuaW1wb3J0IFBsYXlQYXVzZVN0ZXBCdXR0b25Hcm91cCwgeyBQbGF5UGF1c2VTdGVwQnV0dG9uR3JvdXBPcHRpb25zIH0gZnJvbSAnLi9idXR0b25zL1BsYXlQYXVzZVN0ZXBCdXR0b25Hcm91cC5qcyc7XHJcbmltcG9ydCBQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1Byb3BlcnR5LmpzJztcclxuXHJcbi8vIGRlZmF1bHQgc3BlZWRzIGZvciBTcGVlZFJhZGlvQnV0dG9uR3JvdXBcclxuY29uc3QgREVGQVVMVF9USU1FX1NQRUVEUyA9IFsgVGltZVNwZWVkLk5PUk1BTCwgVGltZVNwZWVkLlNMT1cgXTtcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcblxyXG4gIC8vIFBsYXkgc3BlZWQgUHJvcGVydHkgZm9yIHRoZSByYWRpbyBidXR0b24gZ3JvdXAuIElmIG51bGwsIG5vIHJhZGlvIGJ1dHRvbnMgaW5jbHVkZWQgaW4gdGhpcyBjb250cm9sLlxyXG4gIHRpbWVTcGVlZFByb3BlcnR5PzogRW51bWVyYXRpb25Qcm9wZXJ0eTxUaW1lU3BlZWQ+IHwgbnVsbDtcclxuXHJcbiAgLy8gU3BlZWRzIHN1cHBvcnRlZCBieSB0aGlzIFRpbWVDb250cm9sTm9kZS4gVmVydGljYWwgcmFkaW8gYnV0dG9ucyBhcmUgY3JlYXRlZCBmb3IgZWFjaCBpbiB0aGUgb3JkZXIgcHJvdmlkZWQuXHJcbiAgdGltZVNwZWVkcz86IFRpbWVTcGVlZFtdO1xyXG5cclxuICAvLyB0cnVlID0gc3BlZWQgcmFkaW8gYnV0dG9ucyB0byBsZWZ0IG9mIHB1c2ggYnV0dG9uc1xyXG4gIC8vIGZhbHNlID0gc3BlZWQgcmFkaW8gYnV0dG9ucyB0byByaWdodCBvZiBwdXNoIGJ1dHRvbnNcclxuICBzcGVlZFJhZGlvQnV0dG9uR3JvdXBPbkxlZnQ/OiBib29sZWFuO1xyXG5cclxuICAvLyBob3Jpem9udGFsIHNwYWNlIGJldHdlZW4gUGxheVBhdXNlU3RlcEJ1dHRvbnMgYW5kIFNwZWVkUmFkaW9CdXR0b25Hcm91cCwgaWYgU3BlZWRSYWRpb0J1dHRvbkdyb3VwIGlzIGluY2x1ZGVkXHJcbiAgYnV0dG9uR3JvdXBYU3BhY2luZz86IG51bWJlcjtcclxuXHJcbiAgLy8gb3B0aW9ucyBwYXNzZWQgYWxvbmcgdG8gdGhlIFBsYXlQYXVzZVN0ZXBCdXR0b25zLCBzZWUgdGhlIGlubmVyIGNsYXNzIGZvciBkZWZhdWx0c1xyXG4gIHBsYXlQYXVzZVN0ZXBCdXR0b25PcHRpb25zPzogUGxheVBhdXNlU3RlcEJ1dHRvbkdyb3VwT3B0aW9ucztcclxuXHJcbiAgLy8gb3B0aW9ucyBwYXNzZWQgYWxvbmcgdG8gdGhlIFNwZWVkUmFkaW9CdXR0b25Hcm91cCwgaWYgaW5jbHVkZWRcclxuICBzcGVlZFJhZGlvQnV0dG9uR3JvdXBPcHRpb25zPzogU3RyaWN0T21pdDxUaW1lU3BlZWRSYWRpb0J1dHRvbkdyb3VwT3B0aW9ucywgJ3RhbmRlbSc+O1xyXG5cclxuICAvLyBpZiB0cnVlLCB0aGUgU3BlZWRSYWRpb0J1dHRvbkdyb3VwIHdpbGwgYmUgd3JhcHBlZCBpbiBhIFBhbmVsXHJcbiAgd3JhcFNwZWVkUmFkaW9CdXR0b25Hcm91cEluUGFuZWw/OiBib29sZWFuO1xyXG5cclxuICAvLyBvcHRpb25zIHBhc3NlZCB0byB0aGUgcGFuZWwgd3JhcHBpbmcgU3BlZWRSYWRpb0J1dHRvbkdyb3VwLCBpZiBTcGVlZFJhZGlvQnV0dG9uR3JvdXAgaW5jbHVkZWQgQU5EIHdlIGFyZSB3cmFwcGluZ1xyXG4gIC8vIHRoZW0gaW4gYSBwYW5lbFxyXG4gIHNwZWVkUmFkaW9CdXR0b25Hcm91cFBhbmVsT3B0aW9ucz86IFBhbmVsT3B0aW9ucztcclxufTtcclxuXHJcbmV4cG9ydCB0eXBlIFRpbWVDb250cm9sTm9kZU9wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIFN0cmljdE9taXQ8Tm9kZU9wdGlvbnMsICdjaGlsZHJlbic+O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGltZUNvbnRyb2xOb2RlIGV4dGVuZHMgTm9kZSB7XHJcblxyXG4gIC8vIHB1c2ggYnV0dG9uIGZvciBwbGF5L3BhdXNlIGFuZCAob3B0aW9uYWxseSkgc3RlcCBmb3J3YXJkLCBzdGVwIGJhY2tcclxuICBwcm90ZWN0ZWQgcmVhZG9ubHkgcGxheVBhdXNlU3RlcEJ1dHRvbnM6IFBsYXlQYXVzZVN0ZXBCdXR0b25Hcm91cDtcclxuXHJcbiAgLy8gcmFkaW8gYnV0dG9ucyBmcm9tIGNvbnRyb2xsaW5nIHNwZWVkXHJcbiAgcHJpdmF0ZSByZWFkb25seSBzcGVlZFJhZGlvQnV0dG9uR3JvdXA6IFRpbWVTcGVlZFJhZGlvQnV0dG9uR3JvdXAgfCBudWxsO1xyXG5cclxuICAvLyBwYXJlbnQgZm9yIHNwZWVkUmFkaW9CdXR0b25Hcm91cCwgb3B0aW9uYWxseSBhIFBhbmVsXHJcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IHNwZWVkUmFkaW9CdXR0b25Hcm91cFBhcmVudDogTm9kZSB8IFBhbmVsIHwgbnVsbDtcclxuXHJcbiAgLy8gd2hldGhlciB0aGUgcmFkaW8gYnV0dG9ucyBhcmUgdG8gdGhlIGxlZnQgb3IgcmlnaHQgb2YgdGhlIHB1c2ggYnV0dG9uc1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgc3BlZWRSYWRpb0J1dHRvbkdyb3VwT25MZWZ0OiBib29sZWFuO1xyXG5cclxuICAvLyBob3Jpem9udGFsIHNwYWNpbmcgYmV0d2VlbiBwdXNoIGJ1dHRvbnMgYW5kIHJhZGlvIGJ1dHRvbnNcclxuICBwcml2YXRlIGJ1dHRvbkdyb3VwWFNwYWNpbmc6IG51bWJlcjtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNwb3NlVGltZUNvbnRyb2xOb2RlOiAoKSA9PiB2b2lkO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIGlzUGxheWluZ1Byb3BlcnR5OiBQcm9wZXJ0eTxib29sZWFuPiwgcHJvdmlkZWRPcHRpb25zPzogVGltZUNvbnRyb2xOb2RlT3B0aW9ucyApIHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPFRpbWVDb250cm9sTm9kZU9wdGlvbnMsXHJcbiAgICAgIFN0cmljdE9taXQ8U2VsZk9wdGlvbnMsICdwbGF5UGF1c2VTdGVwQnV0dG9uT3B0aW9ucycgfCAnc3BlZWRSYWRpb0J1dHRvbkdyb3VwT3B0aW9ucyc+LCBOb2RlT3B0aW9ucz4oKSgge1xyXG5cclxuICAgICAgLy8gVGltZUNvbnRyb2xOb2RlT3B0aW9uc1xyXG4gICAgICB0aW1lU3BlZWRQcm9wZXJ0eTogbnVsbCxcclxuICAgICAgdGltZVNwZWVkczogREVGQVVMVF9USU1FX1NQRUVEUyxcclxuICAgICAgc3BlZWRSYWRpb0J1dHRvbkdyb3VwT25MZWZ0OiBmYWxzZSxcclxuICAgICAgYnV0dG9uR3JvdXBYU3BhY2luZzogNDAsXHJcbiAgICAgIHdyYXBTcGVlZFJhZGlvQnV0dG9uR3JvdXBJblBhbmVsOiBmYWxzZSxcclxuICAgICAgc3BlZWRSYWRpb0J1dHRvbkdyb3VwUGFuZWxPcHRpb25zOiB7XHJcbiAgICAgICAgeE1hcmdpbjogOCxcclxuICAgICAgICB5TWFyZ2luOiA2XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBOb2RlT3B0aW9uc1xyXG4gICAgICBkaXNhYmxlZE9wYWNpdHk6IFNjZW5lcnlDb25zdGFudHMuRElTQUJMRURfT1BBQ0lUWSxcclxuXHJcbiAgICAgIC8vIHBoZXQtaW9cclxuICAgICAgdGFuZGVtOiBUYW5kZW0uUkVRVUlSRUQsXHJcbiAgICAgIHRhbmRlbU5hbWVTdWZmaXg6ICdUaW1lQ29udHJvbE5vZGUnLFxyXG4gICAgICB2aXNpYmxlUHJvcGVydHlPcHRpb25zOiB7IHBoZXRpb0ZlYXR1cmVkOiB0cnVlIH0sXHJcbiAgICAgIHBoZXRpb0VuYWJsZWRQcm9wZXJ0eUluc3RydW1lbnRlZDogdHJ1ZSwgLy8gb3B0IGludG8gZGVmYXVsdCBQaEVULWlPIGluc3RydW1lbnRlZCBlbmFibGVkUHJvcGVydHlcclxuXHJcbiAgICAgIC8vIHBkb21cclxuICAgICAgdGFnTmFtZTogJ2RpdicsXHJcbiAgICAgIGxhYmVsVGFnTmFtZTogJ2gzJyxcclxuICAgICAgbGFiZWxDb250ZW50OiBTY2VuZXJ5UGhldFN0cmluZ3MuYTExeS50aW1lQ29udHJvbE5vZGUubGFiZWxTdHJpbmdQcm9wZXJ0eVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgc3VwZXIoKTtcclxuXHJcbiAgICBjb25zdCBjaGlsZHJlbiA9IFtdO1xyXG5cclxuICAgIHRoaXMucGxheVBhdXNlU3RlcEJ1dHRvbnMgPSBuZXcgUGxheVBhdXNlU3RlcEJ1dHRvbkdyb3VwKCBpc1BsYXlpbmdQcm9wZXJ0eSxcclxuICAgICAgY29tYmluZU9wdGlvbnM8UGxheVBhdXNlU3RlcEJ1dHRvbkdyb3VwT3B0aW9ucz4oIHtcclxuICAgICAgICB0YW5kZW06IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggJ3BsYXlQYXVzZVN0ZXBCdXR0b25Hcm91cCcgKVxyXG4gICAgICB9LCBvcHRpb25zLnBsYXlQYXVzZVN0ZXBCdXR0b25PcHRpb25zICkgKTtcclxuICAgIGNoaWxkcmVuLnB1c2goIHRoaXMucGxheVBhdXNlU3RlcEJ1dHRvbnMgKTtcclxuXHJcbiAgICB0aGlzLnNwZWVkUmFkaW9CdXR0b25Hcm91cCA9IG51bGw7XHJcbiAgICB0aGlzLnNwZWVkUmFkaW9CdXR0b25Hcm91cFBhcmVudCA9IG51bGw7XHJcbiAgICBpZiAoIG9wdGlvbnMudGltZVNwZWVkUHJvcGVydHkgIT09IG51bGwgKSB7XHJcblxyXG4gICAgICB0aGlzLnNwZWVkUmFkaW9CdXR0b25Hcm91cCA9IG5ldyBUaW1lU3BlZWRSYWRpb0J1dHRvbkdyb3VwKFxyXG4gICAgICAgIG9wdGlvbnMudGltZVNwZWVkUHJvcGVydHksXHJcbiAgICAgICAgb3B0aW9ucy50aW1lU3BlZWRzLFxyXG4gICAgICAgIGNvbWJpbmVPcHRpb25zPFRpbWVTcGVlZFJhZGlvQnV0dG9uR3JvdXBPcHRpb25zPigge1xyXG4gICAgICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oICdzcGVlZFJhZGlvQnV0dG9uR3JvdXAnIClcclxuICAgICAgICB9LCBvcHRpb25zLnNwZWVkUmFkaW9CdXR0b25Hcm91cE9wdGlvbnMgKVxyXG4gICAgICApO1xyXG5cclxuICAgICAgaWYgKCBvcHRpb25zLndyYXBTcGVlZFJhZGlvQnV0dG9uR3JvdXBJblBhbmVsICkge1xyXG4gICAgICAgIHRoaXMuc3BlZWRSYWRpb0J1dHRvbkdyb3VwUGFyZW50ID0gbmV3IFBhbmVsKCB0aGlzLnNwZWVkUmFkaW9CdXR0b25Hcm91cCwgb3B0aW9ucy5zcGVlZFJhZGlvQnV0dG9uR3JvdXBQYW5lbE9wdGlvbnMgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB0aGlzLnNwZWVkUmFkaW9CdXR0b25Hcm91cFBhcmVudCA9IG5ldyBOb2RlKCB7IGNoaWxkcmVuOiBbIHRoaXMuc3BlZWRSYWRpb0J1dHRvbkdyb3VwIF0gfSApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIG9wdGlvbnMuc3BlZWRSYWRpb0J1dHRvbkdyb3VwT25MZWZ0ICkge1xyXG4gICAgICAgIGNoaWxkcmVuLnVuc2hpZnQoIHRoaXMuc3BlZWRSYWRpb0J1dHRvbkdyb3VwUGFyZW50ICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgY2hpbGRyZW4ucHVzaCggdGhpcy5zcGVlZFJhZGlvQnV0dG9uR3JvdXBQYXJlbnQgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5zcGVlZFJhZGlvQnV0dG9uR3JvdXBQYXJlbnQuY2VudGVyWSA9IHRoaXMucGxheVBhdXNlU3RlcEJ1dHRvbnMuY2VudGVyWTtcclxuICAgIH1cclxuXHJcbiAgICBvcHRpb25zLmNoaWxkcmVuID0gY2hpbGRyZW47XHJcblxyXG4gICAgdGhpcy5zcGVlZFJhZGlvQnV0dG9uR3JvdXBPbkxlZnQgPSBvcHRpb25zLnNwZWVkUmFkaW9CdXR0b25Hcm91cE9uTGVmdDtcclxuICAgIHRoaXMuYnV0dG9uR3JvdXBYU3BhY2luZyA9IG9wdGlvbnMuYnV0dG9uR3JvdXBYU3BhY2luZztcclxuXHJcbiAgICB0aGlzLnNldEJ1dHRvbkdyb3VwWFNwYWNpbmcoIHRoaXMuYnV0dG9uR3JvdXBYU3BhY2luZyApO1xyXG5cclxuICAgIHRoaXMuZGlzcG9zZVRpbWVDb250cm9sTm9kZSA9ICgpID0+IHtcclxuICAgICAgdGhpcy5wbGF5UGF1c2VTdGVwQnV0dG9ucy5kaXNwb3NlKCk7XHJcbiAgICAgIHRoaXMuc3BlZWRSYWRpb0J1dHRvbkdyb3VwICYmIHRoaXMuc3BlZWRSYWRpb0J1dHRvbkdyb3VwLmRpc3Bvc2UoKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gbXV0YXRlIHdpdGggb3B0aW9ucyBhZnRlciBzcGFjaW5nIGFuZCBsYXlvdXQgaXMgY29tcGxldGUgc28gb3RoZXIgbGF5b3V0IG9wdGlvbnMgYXBwbHkgY29ycmVjdGx5IHRvIHRoZVxyXG4gICAgLy8gd2hvbGUgVGltZUNvbnRyb2xOb2RlXHJcbiAgICB0aGlzLm11dGF0ZSggb3B0aW9ucyApO1xyXG5cclxuICAgIC8vIHN1cHBvcnQgZm9yIGJpbmRlciBkb2N1bWVudGF0aW9uLCBzdHJpcHBlZCBvdXQgaW4gYnVpbGRzIGFuZCBvbmx5IHJ1bnMgd2hlbiA/YmluZGVyIGlzIHNwZWNpZmllZFxyXG4gICAgYXNzZXJ0ICYmIHBoZXQ/LmNoaXBwZXI/LnF1ZXJ5UGFyYW1ldGVycz8uYmluZGVyICYmIEluc3RhbmNlUmVnaXN0cnkucmVnaXN0ZXJEYXRhVVJMKCAnc2NlbmVyeS1waGV0JywgJ1RpbWVDb250cm9sTm9kZScsIHRoaXMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRyYW5zbGF0ZSB0aGlzIG5vZGUgc28gdGhhdCB0aGUgY2VudGVyIG9mIHRoZSBQbGF5UGF1c2VCdXR0b24gaXMgYXQgdGhlIHNwZWNpZmllZCBwb2ludCBpbiB0aGUgcGFyZW50XHJcbiAgICogY29vcmRpbmF0ZSBmcmFtZSBmb3IgdGhlIFRpbWVDb250cm9sTm9kZS5cclxuICAgKi9cclxuICBwdWJsaWMgc2V0UGxheVBhdXNlQnV0dG9uQ2VudGVyKCBjZW50ZXI6IFZlY3RvcjIgKTogdm9pZCB7XHJcbiAgICBjb25zdCBkaXN0YW5jZVRvQ2VudGVyID0gdGhpcy5sb2NhbFRvUGFyZW50UG9pbnQoIHRoaXMuZ2V0UGxheVBhdXNlQnV0dG9uQ2VudGVyKCkgKS5taW51cyggdGhpcy5jZW50ZXIgKTtcclxuICAgIHRoaXMuY2VudGVyID0gY2VudGVyLm1pbnVzKCBkaXN0YW5jZVRvQ2VudGVyICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIGNlbnRlciBvZiB0aGUgUGxheVBhdXNlQnV0dG9uLCBpbiB0aGUgbG9jYWwgY29vcmRpbmF0ZSBmcmFtZSBvZiB0aGUgVGltZUNvbnRyb2xOb2RlLiBVc2VmdWwgaWYgdGhlXHJcbiAgICogVGltZUNvbnRyb2xOb2RlIG5lZWRzIHRvIGJlIHBvc2l0aW9uZWQgcmVsYXRpdmUgdG8gdGhlIFBsYXlQYXVzZUJ1dHRvbnMuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFBsYXlQYXVzZUJ1dHRvbkNlbnRlcigpOiBWZWN0b3IyIHtcclxuICAgIHJldHVybiB0aGlzLnBsYXlQYXVzZVN0ZXBCdXR0b25zLmdldFBsYXlQYXVzZUJ1dHRvbkNlbnRlcigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHRoZSBzcGFjaW5nIGJldHdlZW4gdGhlIFNwZWVkUmFkaW9CdXR0b25Hcm91cCBhbmQgdGhlIFBsYXlQYXVzZVN0ZXBCdXR0b25zLiBTcGFjaW5nIGlzIGZyb20gaG9yaXpvbnRhbFxyXG4gICAqIGVkZ2UgdG8gZWRnZSBmb3IgZWFjaCBOb2RlLiBUaGlzIHdpbGwgbW92ZSB0aGUgU3BlZWRSYWRpb0J1dHRvbkdyb3VwIHJlbGF0aXZlIHRvIHRoZSBlZGdlIG9mIHRoZVxyXG4gICAqIFBsYXlQYXVzZVN0ZXBCdXR0b25zLiBOby1vcCBpZiB0aGVyZSBpcyBubyBTcGVlZFJhZGlvQnV0dG9uR3JvdXAgZm9yIHRoaXMgVGltZUNvbnRyb2xOb2RlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzZXRCdXR0b25Hcm91cFhTcGFjaW5nKCBzcGFjaW5nOiBudW1iZXIgKTogdm9pZCB7XHJcbiAgICB0aGlzLmJ1dHRvbkdyb3VwWFNwYWNpbmcgPSBzcGFjaW5nO1xyXG4gICAgaWYgKCB0aGlzLnNwZWVkUmFkaW9CdXR0b25Hcm91cFBhcmVudCApIHtcclxuICAgICAgaWYgKCB0aGlzLnNwZWVkUmFkaW9CdXR0b25Hcm91cE9uTGVmdCApIHtcclxuICAgICAgICB0aGlzLnNwZWVkUmFkaW9CdXR0b25Hcm91cFBhcmVudC5yaWdodCA9IHRoaXMucGxheVBhdXNlU3RlcEJ1dHRvbnMubGVmdCAtIHRoaXMuYnV0dG9uR3JvdXBYU3BhY2luZztcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB0aGlzLnNwZWVkUmFkaW9CdXR0b25Hcm91cFBhcmVudC5sZWZ0ID0gdGhpcy5wbGF5UGF1c2VTdGVwQnV0dG9ucy5yaWdodCArIHRoaXMuYnV0dG9uR3JvdXBYU3BhY2luZztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldEJ1dHRvbkdyb3VwWFNwYWNpbmcoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmJ1dHRvbkdyb3VwWFNwYWNpbmc7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb3ZlcnJpZGUgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuZGlzcG9zZVRpbWVDb250cm9sTm9kZSgpO1xyXG4gICAgc3VwZXIuZGlzcG9zZSgpO1xyXG4gIH1cclxufVxyXG5cclxuc2NlbmVyeVBoZXQucmVnaXN0ZXIoICdUaW1lQ29udHJvbE5vZGUnLCBUaW1lQ29udHJvbE5vZGUgKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFLQSxPQUFPQSxnQkFBZ0IsTUFBTSxzREFBc0Q7QUFDbkYsT0FBT0MsU0FBUyxJQUFJQyxjQUFjLFFBQVEsaUNBQWlDO0FBQzNFLFNBQVNDLElB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