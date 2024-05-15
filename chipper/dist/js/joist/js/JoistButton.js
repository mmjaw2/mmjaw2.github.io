// Copyright 2014-2024, University of Colorado Boulder

/**
 * Base class for Joist buttons such as the "home" button and "PhET" button that show custom highlighting on mouseover.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Multilink from '../../axon/js/Multilink.js';
import { Shape } from '../../kite/js/imports.js';
import optionize from '../../phet-core/js/optionize.js';
import { Color, Node, SceneryConstants, Voicing } from '../../scenery/js/imports.js';
import ButtonInteractionState from '../../sun/js/buttons/ButtonInteractionState.js';
import PushButtonInteractionStateProperty from '../../sun/js/buttons/PushButtonInteractionStateProperty.js';
import PushButtonModel from '../../sun/js/buttons/PushButtonModel.js';
import HighlightNode from './HighlightNode.js';
import joist from './joist.js';
export default class JoistButton extends Voicing(Node) {
  // (phet-io|a11y) - Button model
  // Note it shares a tandem with "this", so the emitter will be instrumented as a child of the button

  /**
   * @param content - the scenery node to render as the content of the button
   * @param navigationBarFillProperty - the color of the navbar, as a string.
   * @param [providedOptions]
   */
  constructor(content, navigationBarFillProperty, providedOptions) {
    const options = optionize()({
      cursor: 'pointer',
      // {string}
      listener: null,
      // {function}

      // Customization for the highlight region, see overrides in HomeButton and PhetButton
      highlightExtensionWidth: 0,
      highlightExtensionHeight: 0,
      highlightCenterOffsetX: 0,
      highlightCenterOffsetY: 0,
      pointerAreaDilationX: 0,
      pointerAreaDilationY: 0,
      // JoistButtons by default do not have a featured enabledProperty
      enabledPropertyOptions: {
        phetioFeatured: false
      },
      disabledOpacity: SceneryConstants.DISABLED_OPACITY,
      // pdom
      tagName: 'button'
    }, providedOptions);

    // Creates the highlights for the button.
    const createHighlight = function (fill) {
      return new HighlightNode(content.width + options.highlightExtensionWidth, content.height + options.highlightExtensionHeight, {
        centerX: content.centerX + options.highlightCenterOffsetX,
        centerY: content.centerY + options.highlightCenterOffsetY,
        fill: fill,
        pickable: false
      });
    };

    // Highlight against the black background
    const brightenHighlight = createHighlight('white');

    // Highlight against the white background
    const darkenHighlight = createHighlight('black');
    options.children = [content, brightenHighlight, darkenHighlight];
    super(options);
    this.buttonModel = new PushButtonModel(options);

    // Button interactions
    const interactionStateProperty = new PushButtonInteractionStateProperty(this.buttonModel);
    this.interactionStateProperty = interactionStateProperty;

    // Update the highlights based on whether the button is highlighted and whether it is against a light or dark background.
    Multilink.multilink([interactionStateProperty, navigationBarFillProperty, this.buttonModel.enabledProperty], (interactionState, navigationBarFill, enabled) => {
      const useDarkenHighlight = !navigationBarFill.equals(Color.BLACK);
      brightenHighlight.visible = !useDarkenHighlight && enabled && (interactionState === ButtonInteractionState.OVER || interactionState === ButtonInteractionState.PRESSED);
      darkenHighlight.visible = useDarkenHighlight && enabled && (interactionState === ButtonInteractionState.OVER || interactionState === ButtonInteractionState.PRESSED);
    });

    // Keep the cursor in sync with if the button is enabled.
    // JoistButtons exist for the lifetime of the sim, and don't need to be disposed
    this.buttonModel.enabledProperty.link(enabled => {
      this.cursor = enabled ? options.cursor : null;
    });

    // Hook up the input listener
    this._pressListener = this.buttonModel.createPressListener({
      tandem: options.tandem.createTandem('pressListener')
    });
    this.addInputListener(this._pressListener);

    // eliminate interactivity gap between label and button
    this.mouseArea = this.touchArea = Shape.bounds(this.bounds.dilatedXY(options.pointerAreaDilationX, options.pointerAreaDilationY));

    // shift the focus highlight for the joist button so that the bottom is always on screen
    this.focusHighlight = Shape.bounds(this.bounds.shiftedY(-3));
  }

  /**
   * Is the button currently firing because of accessibility input coming from the PDOM?
   * (pdom)
   */
  isPDOMClicking() {
    return this._pressListener.pdomClickingProperty.get();
  }
}
joist.register('JoistButton', JoistButton);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNdWx0aWxpbmsiLCJTaGFwZSIsIm9wdGlvbml6ZSIsIkNvbG9yIiwiTm9kZSIsIlNjZW5lcnlDb25zdGFudHMiLCJWb2ljaW5nIiwiQnV0dG9uSW50ZXJhY3Rpb25TdGF0ZSIsIlB1c2hCdXR0b25JbnRlcmFjdGlvblN0YXRlUHJvcGVydHkiLCJQdXNoQnV0dG9uTW9kZWwiLCJIaWdobGlnaHROb2RlIiwiam9pc3QiLCJKb2lzdEJ1dHRvbiIsImNvbnN0cnVjdG9yIiwiY29udGVudCIsIm5hdmlnYXRpb25CYXJGaWxsUHJvcGVydHkiLCJwcm92aWRlZE9wdGlvbnMiLCJvcHRpb25zIiwiY3Vyc29yIiwibGlzdGVuZXIiLCJoaWdobGlnaHRFeHRlbnNpb25XaWR0aCIsImhpZ2hsaWdodEV4dGVuc2lvbkhlaWdodCIsImhpZ2hsaWdodENlbnRlck9mZnNldFgiLCJoaWdobGlnaHRDZW50ZXJPZmZzZXRZIiwicG9pbnRlckFyZWFEaWxhdGlvblgiLCJwb2ludGVyQXJlYURpbGF0aW9uWSIsImVuYWJsZWRQcm9wZXJ0eU9wdGlvbnMiLCJwaGV0aW9GZWF0dXJlZCIsImRpc2FibGVkT3BhY2l0eSIsIkRJU0FCTEVEX09QQUNJVFkiLCJ0YWdOYW1lIiwiY3JlYXRlSGlnaGxpZ2h0IiwiZmlsbCIsIndpZHRoIiwiaGVpZ2h0IiwiY2VudGVyWCIsImNlbnRlclkiLCJwaWNrYWJsZSIsImJyaWdodGVuSGlnaGxpZ2h0IiwiZGFya2VuSGlnaGxpZ2h0IiwiY2hpbGRyZW4iLCJidXR0b25Nb2RlbCIsImludGVyYWN0aW9uU3RhdGVQcm9wZXJ0eSIsIm11bHRpbGluayIsImVuYWJsZWRQcm9wZXJ0eSIsImludGVyYWN0aW9uU3RhdGUiLCJuYXZpZ2F0aW9uQmFyRmlsbCIsImVuYWJsZWQiLCJ1c2VEYXJrZW5IaWdobGlnaHQiLCJlcXVhbHMiLCJCTEFDSyIsInZpc2libGUiLCJPVkVSIiwiUFJFU1NFRCIsImxpbmsiLCJfcHJlc3NMaXN0ZW5lciIsImNyZWF0ZVByZXNzTGlzdGVuZXIiLCJ0YW5kZW0iLCJjcmVhdGVUYW5kZW0iLCJhZGRJbnB1dExpc3RlbmVyIiwibW91c2VBcmVhIiwidG91Y2hBcmVhIiwiYm91bmRzIiwiZGlsYXRlZFhZIiwiZm9jdXNIaWdobGlnaHQiLCJzaGlmdGVkWSIsImlzUERPTUNsaWNraW5nIiwicGRvbUNsaWNraW5nUHJvcGVydHkiLCJnZXQiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkpvaXN0QnV0dG9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE0LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEJhc2UgY2xhc3MgZm9yIEpvaXN0IGJ1dHRvbnMgc3VjaCBhcyB0aGUgXCJob21lXCIgYnV0dG9uIGFuZCBcIlBoRVRcIiBidXR0b24gdGhhdCBzaG93IGN1c3RvbSBoaWdobGlnaHRpbmcgb24gbW91c2VvdmVyLlxyXG4gKlxyXG4gKiBAYXV0aG9yIFNhbSBSZWlkIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBUUmVhZE9ubHlQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IE11bHRpbGluayBmcm9tICcuLi8uLi9heG9uL2pzL011bHRpbGluay5qcyc7XHJcbmltcG9ydCB7IFNoYXBlIH0gZnJvbSAnLi4vLi4va2l0ZS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IFBpY2tSZXF1aXJlZCBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvUGlja1JlcXVpcmVkLmpzJztcclxuaW1wb3J0IFN0cmljdE9taXQgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1N0cmljdE9taXQuanMnO1xyXG5pbXBvcnQgeyBDb2xvciwgTm9kZSwgTm9kZU9wdGlvbnMsIFByZXNzTGlzdGVuZXIsIFNjZW5lcnlDb25zdGFudHMsIFZvaWNpbmcsIFZvaWNpbmdPcHRpb25zIH0gZnJvbSAnLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IEJ1dHRvbkludGVyYWN0aW9uU3RhdGUgZnJvbSAnLi4vLi4vc3VuL2pzL2J1dHRvbnMvQnV0dG9uSW50ZXJhY3Rpb25TdGF0ZS5qcyc7XHJcbmltcG9ydCBQdXNoQnV0dG9uSW50ZXJhY3Rpb25TdGF0ZVByb3BlcnR5IGZyb20gJy4uLy4uL3N1bi9qcy9idXR0b25zL1B1c2hCdXR0b25JbnRlcmFjdGlvblN0YXRlUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgUHVzaEJ1dHRvbk1vZGVsIGZyb20gJy4uLy4uL3N1bi9qcy9idXR0b25zL1B1c2hCdXR0b25Nb2RlbC5qcyc7XHJcbmltcG9ydCBIaWdobGlnaHROb2RlIGZyb20gJy4vSGlnaGxpZ2h0Tm9kZS5qcyc7XHJcbmltcG9ydCBqb2lzdCBmcm9tICcuL2pvaXN0LmpzJztcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcbiAgaGlnaGxpZ2h0RXh0ZW5zaW9uV2lkdGg/OiBudW1iZXI7XHJcbiAgaGlnaGxpZ2h0RXh0ZW5zaW9uSGVpZ2h0PzogbnVtYmVyO1xyXG4gIGhpZ2hsaWdodENlbnRlck9mZnNldFg/OiBudW1iZXI7XHJcbiAgaGlnaGxpZ2h0Q2VudGVyT2Zmc2V0WT86IG51bWJlcjtcclxuICBwb2ludGVyQXJlYURpbGF0aW9uWD86IG51bWJlcjtcclxuICBwb2ludGVyQXJlYURpbGF0aW9uWT86IG51bWJlcjtcclxuICBsaXN0ZW5lcj86ICggKCkgPT4gdm9pZCApIHwgbnVsbDtcclxufTtcclxudHlwZSBQYXJlbnRPcHRpb25zID0gVm9pY2luZ09wdGlvbnMgJiBOb2RlT3B0aW9ucztcclxuZXhwb3J0IHR5cGUgSm9pc3RCdXR0b25PcHRpb25zID0gU2VsZk9wdGlvbnMgJiBTdHJpY3RPbWl0PFBhcmVudE9wdGlvbnMsICdjaGlsZHJlbic+ICYgUGlja1JlcXVpcmVkPFBhcmVudE9wdGlvbnMsICd0YW5kZW0nPjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEpvaXN0QnV0dG9uIGV4dGVuZHMgVm9pY2luZyggTm9kZSApIHtcclxuXHJcbiAgLy8gKHBoZXQtaW98YTExeSkgLSBCdXR0b24gbW9kZWxcclxuICAvLyBOb3RlIGl0IHNoYXJlcyBhIHRhbmRlbSB3aXRoIFwidGhpc1wiLCBzbyB0aGUgZW1pdHRlciB3aWxsIGJlIGluc3RydW1lbnRlZCBhcyBhIGNoaWxkIG9mIHRoZSBidXR0b25cclxuICBwcm90ZWN0ZWQgcmVhZG9ubHkgYnV0dG9uTW9kZWw6IFB1c2hCdXR0b25Nb2RlbDtcclxuICBwcm90ZWN0ZWQgcmVhZG9ubHkgaW50ZXJhY3Rpb25TdGF0ZVByb3BlcnR5OiBQdXNoQnV0dG9uSW50ZXJhY3Rpb25TdGF0ZVByb3BlcnR5O1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgX3ByZXNzTGlzdGVuZXI6IFByZXNzTGlzdGVuZXI7XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBjb250ZW50IC0gdGhlIHNjZW5lcnkgbm9kZSB0byByZW5kZXIgYXMgdGhlIGNvbnRlbnQgb2YgdGhlIGJ1dHRvblxyXG4gICAqIEBwYXJhbSBuYXZpZ2F0aW9uQmFyRmlsbFByb3BlcnR5IC0gdGhlIGNvbG9yIG9mIHRoZSBuYXZiYXIsIGFzIGEgc3RyaW5nLlxyXG4gICAqIEBwYXJhbSBbcHJvdmlkZWRPcHRpb25zXVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggY29udGVudDogTm9kZSwgbmF2aWdhdGlvbkJhckZpbGxQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8Q29sb3I+LCBwcm92aWRlZE9wdGlvbnM6IEpvaXN0QnV0dG9uT3B0aW9ucyApIHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPEpvaXN0QnV0dG9uT3B0aW9ucywgU2VsZk9wdGlvbnMsIFBhcmVudE9wdGlvbnM+KCkoIHtcclxuICAgICAgY3Vyc29yOiAncG9pbnRlcicsIC8vIHtzdHJpbmd9XHJcbiAgICAgIGxpc3RlbmVyOiBudWxsLCAvLyB7ZnVuY3Rpb259XHJcblxyXG4gICAgICAvLyBDdXN0b21pemF0aW9uIGZvciB0aGUgaGlnaGxpZ2h0IHJlZ2lvbiwgc2VlIG92ZXJyaWRlcyBpbiBIb21lQnV0dG9uIGFuZCBQaGV0QnV0dG9uXHJcbiAgICAgIGhpZ2hsaWdodEV4dGVuc2lvbldpZHRoOiAwLFxyXG4gICAgICBoaWdobGlnaHRFeHRlbnNpb25IZWlnaHQ6IDAsXHJcbiAgICAgIGhpZ2hsaWdodENlbnRlck9mZnNldFg6IDAsXHJcbiAgICAgIGhpZ2hsaWdodENlbnRlck9mZnNldFk6IDAsXHJcblxyXG4gICAgICBwb2ludGVyQXJlYURpbGF0aW9uWDogMCxcclxuICAgICAgcG9pbnRlckFyZWFEaWxhdGlvblk6IDAsXHJcblxyXG4gICAgICAvLyBKb2lzdEJ1dHRvbnMgYnkgZGVmYXVsdCBkbyBub3QgaGF2ZSBhIGZlYXR1cmVkIGVuYWJsZWRQcm9wZXJ0eVxyXG4gICAgICBlbmFibGVkUHJvcGVydHlPcHRpb25zOiB7IHBoZXRpb0ZlYXR1cmVkOiBmYWxzZSB9LFxyXG4gICAgICBkaXNhYmxlZE9wYWNpdHk6IFNjZW5lcnlDb25zdGFudHMuRElTQUJMRURfT1BBQ0lUWSxcclxuXHJcbiAgICAgIC8vIHBkb21cclxuICAgICAgdGFnTmFtZTogJ2J1dHRvbidcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIC8vIENyZWF0ZXMgdGhlIGhpZ2hsaWdodHMgZm9yIHRoZSBidXR0b24uXHJcbiAgICBjb25zdCBjcmVhdGVIaWdobGlnaHQgPSBmdW5jdGlvbiggZmlsbDogQ29sb3IgfCBzdHJpbmcgKSB7XHJcbiAgICAgIHJldHVybiBuZXcgSGlnaGxpZ2h0Tm9kZSggY29udGVudC53aWR0aCArIG9wdGlvbnMuaGlnaGxpZ2h0RXh0ZW5zaW9uV2lkdGgsIGNvbnRlbnQuaGVpZ2h0ICsgb3B0aW9ucy5oaWdobGlnaHRFeHRlbnNpb25IZWlnaHQsIHtcclxuICAgICAgICBjZW50ZXJYOiBjb250ZW50LmNlbnRlclggKyBvcHRpb25zLmhpZ2hsaWdodENlbnRlck9mZnNldFgsXHJcbiAgICAgICAgY2VudGVyWTogY29udGVudC5jZW50ZXJZICsgb3B0aW9ucy5oaWdobGlnaHRDZW50ZXJPZmZzZXRZLFxyXG4gICAgICAgIGZpbGw6IGZpbGwsXHJcbiAgICAgICAgcGlja2FibGU6IGZhbHNlXHJcbiAgICAgIH0gKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gSGlnaGxpZ2h0IGFnYWluc3QgdGhlIGJsYWNrIGJhY2tncm91bmRcclxuICAgIGNvbnN0IGJyaWdodGVuSGlnaGxpZ2h0ID0gY3JlYXRlSGlnaGxpZ2h0KCAnd2hpdGUnICk7XHJcblxyXG4gICAgLy8gSGlnaGxpZ2h0IGFnYWluc3QgdGhlIHdoaXRlIGJhY2tncm91bmRcclxuICAgIGNvbnN0IGRhcmtlbkhpZ2hsaWdodCA9IGNyZWF0ZUhpZ2hsaWdodCggJ2JsYWNrJyApO1xyXG5cclxuICAgIG9wdGlvbnMuY2hpbGRyZW4gPSBbIGNvbnRlbnQsIGJyaWdodGVuSGlnaGxpZ2h0LCBkYXJrZW5IaWdobGlnaHQgXTtcclxuXHJcbiAgICBzdXBlciggb3B0aW9ucyApO1xyXG5cclxuICAgIHRoaXMuYnV0dG9uTW9kZWwgPSBuZXcgUHVzaEJ1dHRvbk1vZGVsKCBvcHRpb25zICk7XHJcblxyXG4gICAgLy8gQnV0dG9uIGludGVyYWN0aW9uc1xyXG4gICAgY29uc3QgaW50ZXJhY3Rpb25TdGF0ZVByb3BlcnR5ID0gbmV3IFB1c2hCdXR0b25JbnRlcmFjdGlvblN0YXRlUHJvcGVydHkoIHRoaXMuYnV0dG9uTW9kZWwgKTtcclxuXHJcbiAgICB0aGlzLmludGVyYWN0aW9uU3RhdGVQcm9wZXJ0eSA9IGludGVyYWN0aW9uU3RhdGVQcm9wZXJ0eTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIGhpZ2hsaWdodHMgYmFzZWQgb24gd2hldGhlciB0aGUgYnV0dG9uIGlzIGhpZ2hsaWdodGVkIGFuZCB3aGV0aGVyIGl0IGlzIGFnYWluc3QgYSBsaWdodCBvciBkYXJrIGJhY2tncm91bmQuXHJcbiAgICBNdWx0aWxpbmsubXVsdGlsaW5rKCBbIGludGVyYWN0aW9uU3RhdGVQcm9wZXJ0eSwgbmF2aWdhdGlvbkJhckZpbGxQcm9wZXJ0eSwgdGhpcy5idXR0b25Nb2RlbC5lbmFibGVkUHJvcGVydHkgXSxcclxuICAgICAgKCBpbnRlcmFjdGlvblN0YXRlLCBuYXZpZ2F0aW9uQmFyRmlsbCwgZW5hYmxlZCApID0+IHtcclxuICAgICAgICBjb25zdCB1c2VEYXJrZW5IaWdobGlnaHQgPSAhbmF2aWdhdGlvbkJhckZpbGwuZXF1YWxzKCBDb2xvci5CTEFDSyApO1xyXG5cclxuICAgICAgICBicmlnaHRlbkhpZ2hsaWdodC52aXNpYmxlID0gIXVzZURhcmtlbkhpZ2hsaWdodCAmJiBlbmFibGVkICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICggaW50ZXJhY3Rpb25TdGF0ZSA9PT0gQnV0dG9uSW50ZXJhY3Rpb25TdGF0ZS5PVkVSIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb25TdGF0ZSA9PT0gQnV0dG9uSW50ZXJhY3Rpb25TdGF0ZS5QUkVTU0VEICk7XHJcbiAgICAgICAgZGFya2VuSGlnaGxpZ2h0LnZpc2libGUgPSB1c2VEYXJrZW5IaWdobGlnaHQgJiYgZW5hYmxlZCAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCBpbnRlcmFjdGlvblN0YXRlID09PSBCdXR0b25JbnRlcmFjdGlvblN0YXRlLk9WRVIgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb25TdGF0ZSA9PT0gQnV0dG9uSW50ZXJhY3Rpb25TdGF0ZS5QUkVTU0VEICk7XHJcbiAgICAgIH0gKTtcclxuXHJcbiAgICAvLyBLZWVwIHRoZSBjdXJzb3IgaW4gc3luYyB3aXRoIGlmIHRoZSBidXR0b24gaXMgZW5hYmxlZC5cclxuICAgIC8vIEpvaXN0QnV0dG9ucyBleGlzdCBmb3IgdGhlIGxpZmV0aW1lIG9mIHRoZSBzaW0sIGFuZCBkb24ndCBuZWVkIHRvIGJlIGRpc3Bvc2VkXHJcbiAgICB0aGlzLmJ1dHRvbk1vZGVsLmVuYWJsZWRQcm9wZXJ0eS5saW5rKCBlbmFibGVkID0+IHtcclxuICAgICAgdGhpcy5jdXJzb3IgPSBlbmFibGVkID8gb3B0aW9ucy5jdXJzb3IgOiBudWxsO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIEhvb2sgdXAgdGhlIGlucHV0IGxpc3RlbmVyXHJcbiAgICB0aGlzLl9wcmVzc0xpc3RlbmVyID0gdGhpcy5idXR0b25Nb2RlbC5jcmVhdGVQcmVzc0xpc3RlbmVyKCB7XHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAncHJlc3NMaXN0ZW5lcicgKVxyXG4gICAgfSApO1xyXG4gICAgdGhpcy5hZGRJbnB1dExpc3RlbmVyKCB0aGlzLl9wcmVzc0xpc3RlbmVyICk7XHJcblxyXG4gICAgLy8gZWxpbWluYXRlIGludGVyYWN0aXZpdHkgZ2FwIGJldHdlZW4gbGFiZWwgYW5kIGJ1dHRvblxyXG4gICAgdGhpcy5tb3VzZUFyZWEgPSB0aGlzLnRvdWNoQXJlYSA9IFNoYXBlLmJvdW5kcyggdGhpcy5ib3VuZHMuZGlsYXRlZFhZKCBvcHRpb25zLnBvaW50ZXJBcmVhRGlsYXRpb25YLCBvcHRpb25zLnBvaW50ZXJBcmVhRGlsYXRpb25ZICkgKTtcclxuXHJcbiAgICAvLyBzaGlmdCB0aGUgZm9jdXMgaGlnaGxpZ2h0IGZvciB0aGUgam9pc3QgYnV0dG9uIHNvIHRoYXQgdGhlIGJvdHRvbSBpcyBhbHdheXMgb24gc2NyZWVuXHJcbiAgICB0aGlzLmZvY3VzSGlnaGxpZ2h0ID0gU2hhcGUuYm91bmRzKCB0aGlzLmJvdW5kcy5zaGlmdGVkWSggLTMgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSXMgdGhlIGJ1dHRvbiBjdXJyZW50bHkgZmlyaW5nIGJlY2F1c2Ugb2YgYWNjZXNzaWJpbGl0eSBpbnB1dCBjb21pbmcgZnJvbSB0aGUgUERPTT9cclxuICAgKiAocGRvbSlcclxuICAgKi9cclxuICBwdWJsaWMgaXNQRE9NQ2xpY2tpbmcoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5fcHJlc3NMaXN0ZW5lci5wZG9tQ2xpY2tpbmdQcm9wZXJ0eS5nZXQoKTtcclxuICB9XHJcbn1cclxuXHJcbmpvaXN0LnJlZ2lzdGVyKCAnSm9pc3RCdXR0b24nLCBKb2lzdEJ1dHRvbiApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFHQSxPQUFPQSxTQUFTLE1BQU0sNEJBQTRCO0FBQ2xELFNBQVNDLEtBQUssUUFBUSwwQkFBMEI7QUFDaEQsT0FBT0MsU0FBUyxNQUFNLGlDQUFpQztBQUd2RCxTQUFTQyxLQUFLLEVBQUVDLElBQUksRUFBOEJDLGdCQUFnQixFQUFFQyxPQUFPLFFBQXdCLDZCQUE2QjtBQUNoSSxPQUFPQyxzQkFBc0IsTUFBTSxnREFBZ0Q7QUFDbkYsT0FBT0Msa0NBQWtDLE1BQU0sNERBQTREO0FBQzNHLE9BQU9DLGVBQWUsTUFBTSx5Q0FBeUM7QUFDckUsT0FBT0MsYUFBYSxNQUFNLG9CQUFvQjtBQUM5QyxPQUFPQyxLQUFLLE1BQU0sWUFBWTtBQWM5QixlQUFlLE1BQU1DLFdBQVcsU0FBU04sT0FBTyxDQUFFRixJQUFLLENBQUMsQ0FBQztFQUV2RDtFQUNBOztFQUtBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDU1MsV0FBV0EsQ0FBRUMsT0FBYSxFQUFFQyx5QkFBbUQsRUFBRUMsZUFBbUMsRUFBRztJQUU1SCxNQUFNQyxPQUFPLEdBQUdmLFNBQVMsQ0FBaUQsQ0FBQyxDQUFFO01BQzNFZ0IsTUFBTSxFQUFFLFNBQVM7TUFBRTtNQUNuQkMsUUFBUSxFQUFFLElBQUk7TUFBRTs7TUFFaEI7TUFDQUMsdUJBQXVCLEVBQUUsQ0FBQztNQUMx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