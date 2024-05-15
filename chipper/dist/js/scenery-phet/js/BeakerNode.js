// Copyright 2018-2024, University of Colorado Boulder

/**
 * BeakerNode draws a pseudo-3D cylindrical beaker, with optional tick marks, containing a solution.
 * Based on the value of solutionLevelProperty, it fills the beaker with solution from the bottom up.
 * The Beaker and solution use flat style shading and highlights to provide pseudo-3D dimension.
 *
 * This node expects the provided solutionLevelProperty that maps between 0 (empty) and 1 (full).
 *
 * @author Marla Schulz <marla.schulz@colorado.edu>
 */

import { Shape } from '../../kite/js/imports.js';
import SceneryPhetColors from './SceneryPhetColors.js';
import sceneryPhet from './sceneryPhet.js';
import { Node, PaintColorProperty, Path } from '../../scenery/js/imports.js';
import optionize from '../../phet-core/js/optionize.js';
export default class BeakerNode extends Node {
  constructor(solutionLevelProperty, providedOptions) {
    assert && assert(solutionLevelProperty.range.min >= 0 && solutionLevelProperty.range.max <= 1, 'SolutionLevelProperty must be a NumberProperty with min >= 0 and max <= 1');

    // Generates highlight and shading when a custom solutionFill is provided.
    const originalGlareFill = providedOptions?.solutionFill !== undefined ? providedOptions.solutionFill : SceneryPhetColors.solutionShineFillProperty;
    const originalShadowFill = providedOptions?.solutionFill !== undefined ? providedOptions.solutionFill : SceneryPhetColors.solutionShadowFillProperty;

    // Keep our solution glare/shadow up-to-date if solutionFill is a Property<Color> and it changes
    const solutionGlareFillProperty = new PaintColorProperty(originalGlareFill, {
      luminanceFactor: 0.5
    });
    const solutionShadowFillProperty = new PaintColorProperty(originalShadowFill, {
      luminanceFactor: -0.2
    });
    const options = optionize()({
      emptyBeakerFill: SceneryPhetColors.emptyBeakerFillProperty,
      solutionFill: SceneryPhetColors.solutionFillProperty,
      solutionGlareFill: solutionGlareFillProperty,
      solutionShadowFill: solutionShadowFillProperty,
      beakerGlareFill: SceneryPhetColors.beakerShineFillProperty,
      beakerStroke: SceneryPhetColors.beakerStroke,
      lineWidth: 1,
      beakerHeight: 100,
      beakerWidth: 60,
      yRadiusOfEnds: 12,
      ticksVisible: false,
      numberOfTicks: 3,
      majorTickMarkModulus: 2,
      // Default to every other tick mark is major.
      tickStroke: SceneryPhetColors.tickStroke
    }, providedOptions);
    const xRadius = options.beakerWidth / 2;
    const centerTop = -options.beakerHeight / 2;
    const centerBottom = options.beakerHeight / 2;

    // Beaker structure and glare shapes
    const beakerGlareShape = new Shape().moveTo(-xRadius * 0.6, centerTop * 0.6).verticalLineTo(centerBottom * 0.85).lineTo(-xRadius * 0.5, centerBottom * 0.9).verticalLineTo(centerTop * 0.55).close();
    const beakerFrontShape = new Shape().ellipticalArc(0, centerBottom, xRadius, options.yRadiusOfEnds, 0, 0, Math.PI, false).ellipticalArc(0, centerTop, xRadius, options.yRadiusOfEnds, 0, Math.PI, 0, true).close();
    const beakerBackTopShape = new Shape().ellipticalArc(0, centerTop, xRadius, options.yRadiusOfEnds, 0, Math.PI, 0, false);
    const beakerBackShape = new Shape().ellipticalArc(0, centerTop, xRadius, options.yRadiusOfEnds, 0, Math.PI, 0, false).ellipticalArc(0, centerBottom, xRadius, options.yRadiusOfEnds, 0, 0, Math.PI, true).close();
    const beakerBottomShape = new Shape().ellipticalArc(0, centerBottom, xRadius, options.yRadiusOfEnds, 0, 0, 2 * Math.PI, false);

    // Water fill and shading paths
    const solutionSide = new Path(null, {
      fill: options.solutionFill,
      pickable: false
    });
    const solutionTop = new Path(null, {
      fill: options.solutionFill,
      pickable: false
    });
    const solutionFrontEdge = new Path(null, {
      fill: options.solutionShadowFill,
      pickable: false
    });
    const solutionBackEdge = new Path(null, {
      fill: options.solutionShadowFill,
      opacity: 0.6,
      pickable: false
    });
    const solutionGlare = new Path(null, {
      fill: options.solutionGlareFill
    });

    // Beaker structure and glare paths
    const beakerFront = new Path(beakerFrontShape, {
      stroke: options.beakerStroke,
      lineWidth: options.lineWidth
    });
    const beakerBack = new Path(beakerBackShape, {
      stroke: options.beakerStroke,
      lineWidth: options.lineWidth,
      fill: options.emptyBeakerFill
    });
    const beakerBackTop = new Path(beakerBackTopShape, {
      stroke: options.beakerStroke,
      lineWidth: options.lineWidth
    });
    beakerBack.setScaleMagnitude(-1, 1);
    const beakerBottom = new Path(beakerBottomShape, {
      stroke: options.beakerStroke,
      fill: options.emptyBeakerFill,
      pickable: false
    });
    const beakerGlare = new Path(beakerGlareShape.getOffsetShape(2), {
      fill: options.beakerGlareFill
    });
    const tickDivision = 1 / (options.numberOfTicks + 1);
    const ticksShape = new Shape();
    let y = centerBottom;
    for (let i = 1; i <= options.numberOfTicks; i++) {
      y -= options.beakerHeight * tickDivision;
      const centralAngle = Math.PI * 0.83;
      const offsetAngle = Math.PI * (i % options.majorTickMarkModulus !== 0 ? 0.07 : 0.1);
      ticksShape.ellipticalArc(0, y, xRadius, options.yRadiusOfEnds, 0, centralAngle + offsetAngle, centralAngle - offsetAngle, true).newSubpath();
    }
    const ticks = new Path(ticksShape, {
      stroke: options.tickStroke,
      lineWidth: 1.5,
      pickable: false,
      visible: options.ticksVisible
    });

    // solution level adjustment listener
    const solutionLevelListener = solutionLevel => {
      const centerLiquidY = centerBottom - options.beakerHeight * solutionLevel;
      const solutionTopShape = new Shape().ellipticalArc(0, centerLiquidY, xRadius, options.yRadiusOfEnds, 0, 0, Math.PI * 2, false).close();
      const solutionSideShape = new Shape().ellipticalArc(0, centerLiquidY, xRadius, options.yRadiusOfEnds, 0, Math.PI, 0, true).ellipticalArc(0, centerBottom, xRadius, options.yRadiusOfEnds, 0, 0, Math.PI, false).close();
      const solutionFrontEdgeShape = new Shape().ellipticalArc(0, centerLiquidY + 1, xRadius, options.yRadiusOfEnds + 2, 0, Math.PI, 0, true).ellipticalArc(0, centerLiquidY, xRadius, options.yRadiusOfEnds, 0, 0, Math.PI, false);
      const solutionBackEdgeShape = new Shape().ellipticalArc(0, centerBottom - 1, xRadius, options.yRadiusOfEnds + 4, Math.PI, Math.PI, 0, true).ellipticalArc(0, centerBottom, xRadius, options.yRadiusOfEnds, Math.PI, 0, Math.PI, false);
      const solutionCrescentShape = new Shape().ellipticalArc(xRadius * 0.2, centerLiquidY, options.yRadiusOfEnds * 0.75, xRadius * 0.4, Math.PI * 1.5, Math.PI, 0, true).ellipticalArc(xRadius * 0.2, centerLiquidY, options.yRadiusOfEnds * 0.75, xRadius * 0.6, Math.PI * 1.5, 0, Math.PI, false);
      solutionTop.shape = solutionTopShape;
      solutionSide.shape = solutionSideShape;
      solutionFrontEdge.shape = solutionFrontEdgeShape;
      solutionBackEdge.shape = solutionBackEdgeShape;
      solutionGlare.shape = solutionCrescentShape;

      // Set solution visibility based on solution level
      if (solutionLevel < 0.001) {
        solutionTop.visible = false;
        solutionSide.visible = false;
        solutionFrontEdge.visible = false;
        solutionBackEdge.visible = false;
        solutionGlare.visible = false;
      } else {
        // Prevents back edge from appearing when solution level empty.  Only compute this when the solutionBackEdge
        // will be shown, because when computed for very small solutionLevel it triggers a kite corner case problem
        // see https://github.com/phetsims/kite/issues/98
        solutionBackEdge.clipArea = Shape.union([solutionTopShape, solutionSideShape]);
        solutionTop.visible = true;
        solutionSide.visible = true;
        solutionFrontEdge.visible = true;
        solutionBackEdge.visible = true;
        solutionGlare.visible = true;
      }
    };
    solutionLevelProperty.link(solutionLevelListener);

    // Prevents front edge from dipping below beaker boundary when dragged all the way down.
    solutionFrontEdge.clipArea = Shape.union([beakerFrontShape, beakerBottomShape]);
    options.children = [beakerBack, beakerBottom, solutionSide, solutionBackEdge, solutionTop, solutionGlare, solutionFrontEdge, beakerBackTop, beakerFront, ticks, beakerGlare];
    super(options);
    this.ticks = ticks;
    this.disposeBeakerNode = () => {
      solutionGlareFillProperty.dispose();
      solutionShadowFillProperty.dispose();
      solutionLevelProperty.unlink(solutionLevelListener);
    };
  }
  dispose() {
    this.disposeBeakerNode();
    super.dispose();
  }
  setTicksVisible(visible) {
    this.ticks.visible = visible;
  }
}
sceneryPhet.register('BeakerNode', BeakerNode);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTaGFwZSIsIlNjZW5lcnlQaGV0Q29sb3JzIiwic2NlbmVyeVBoZXQiLCJOb2RlIiwiUGFpbnRDb2xvclByb3BlcnR5IiwiUGF0aCIsIm9wdGlvbml6ZSIsIkJlYWtlck5vZGUiLCJjb25zdHJ1Y3RvciIsInNvbHV0aW9uTGV2ZWxQcm9wZXJ0eSIsInByb3ZpZGVkT3B0aW9ucyIsImFzc2VydCIsInJhbmdlIiwibWluIiwibWF4Iiwib3JpZ2luYWxHbGFyZUZpbGwiLCJzb2x1dGlvbkZpbGwiLCJ1bmRlZmluZWQiLCJzb2x1dGlvblNoaW5lRmlsbFByb3BlcnR5Iiwib3JpZ2luYWxTaGFkb3dGaWxsIiwic29sdXRpb25TaGFkb3dGaWxsUHJvcGVydHkiLCJzb2x1dGlvbkdsYXJlRmlsbFByb3BlcnR5IiwibHVtaW5hbmNlRmFjdG9yIiwib3B0aW9ucyIsImVtcHR5QmVha2VyRmlsbCIsImVtcHR5QmVha2VyRmlsbFByb3BlcnR5Iiwic29sdXRpb25GaWxsUHJvcGVydHkiLCJzb2x1dGlvbkdsYXJlRmlsbCIsInNvbHV0aW9uU2hhZG93RmlsbCIsImJlYWtlckdsYXJlRmlsbCIsImJlYWtlclNoaW5lRmlsbFByb3BlcnR5IiwiYmVha2VyU3Ryb2tlIiwibGluZVdpZHRoIiwiYmVha2VySGVpZ2h0IiwiYmVha2VyV2lkdGgiLCJ5UmFkaXVzT2ZFbmRzIiwidGlja3NWaXNpYmxlIiwibnVtYmVyT2ZUaWNrcyIsIm1ham9yVGlja01hcmtNb2R1bHVzIiwidGlja1N0cm9rZSIsInhSYWRpdXMiLCJjZW50ZXJUb3AiLCJjZW50ZXJCb3R0b20iLCJiZWFrZXJHbGFyZVNoYXBlIiwibW92ZVRvIiwidmVydGljYWxMaW5lVG8iLCJsaW5lVG8iLCJjbG9zZSIsImJlYWtlckZyb250U2hhcGUiLCJlbGxpcHRpY2FsQXJjIiwiTWF0aCIsIlBJIiwiYmVha2VyQmFja1RvcFNoYXBlIiwiYmVha2VyQmFja1NoYXBlIiwiYmVha2VyQm90dG9tU2hhcGUiLCJzb2x1dGlvblNpZGUiLCJmaWxsIiwicGlja2FibGUiLCJzb2x1dGlvblRvcCIsInNvbHV0aW9uRnJvbnRFZGdlIiwic29sdXRpb25CYWNrRWRnZSIsIm9wYWNpdHkiLCJzb2x1dGlvbkdsYXJlIiwiYmVha2VyRnJvbnQiLCJzdHJva2UiLCJiZWFrZXJCYWNrIiwiYmVha2VyQmFja1RvcCIsInNldFNjYWxlTWFnbml0dWRlIiwiYmVha2VyQm90dG9tIiwiYmVha2VyR2xhcmUiLCJnZXRPZmZzZXRTaGFwZSIsInRpY2tEaXZpc2lvbiIsInRpY2tzU2hhcGUiLCJ5IiwiaSIsImNlbnRyYWxBbmdsZSIsIm9mZnNldEFuZ2xlIiwibmV3U3VicGF0aCIsInRpY2tzIiwidmlzaWJsZSIsInNvbHV0aW9uTGV2ZWxMaXN0ZW5lciIsInNvbHV0aW9uTGV2ZWwiLCJjZW50ZXJMaXF1aWRZIiwic29sdXRpb25Ub3BTaGFwZSIsInNvbHV0aW9uU2lkZVNoYXBlIiwic29sdXRpb25Gcm9udEVkZ2VTaGFwZSIsInNvbHV0aW9uQmFja0VkZ2VTaGFwZSIsInNvbHV0aW9uQ3Jlc2NlbnRTaGFwZSIsInNoYXBlIiwiY2xpcEFyZWEiLCJ1bmlvbiIsImxpbmsiLCJjaGlsZHJlbiIsImRpc3Bvc2VCZWFrZXJOb2RlIiwiZGlzcG9zZSIsInVubGluayIsInNldFRpY2tzVmlzaWJsZSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiQmVha2VyTm9kZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBCZWFrZXJOb2RlIGRyYXdzIGEgcHNldWRvLTNEIGN5bGluZHJpY2FsIGJlYWtlciwgd2l0aCBvcHRpb25hbCB0aWNrIG1hcmtzLCBjb250YWluaW5nIGEgc29sdXRpb24uXHJcbiAqIEJhc2VkIG9uIHRoZSB2YWx1ZSBvZiBzb2x1dGlvbkxldmVsUHJvcGVydHksIGl0IGZpbGxzIHRoZSBiZWFrZXIgd2l0aCBzb2x1dGlvbiBmcm9tIHRoZSBib3R0b20gdXAuXHJcbiAqIFRoZSBCZWFrZXIgYW5kIHNvbHV0aW9uIHVzZSBmbGF0IHN0eWxlIHNoYWRpbmcgYW5kIGhpZ2hsaWdodHMgdG8gcHJvdmlkZSBwc2V1ZG8tM0QgZGltZW5zaW9uLlxyXG4gKlxyXG4gKiBUaGlzIG5vZGUgZXhwZWN0cyB0aGUgcHJvdmlkZWQgc29sdXRpb25MZXZlbFByb3BlcnR5IHRoYXQgbWFwcyBiZXR3ZWVuIDAgKGVtcHR5KSBhbmQgMSAoZnVsbCkuXHJcbiAqXHJcbiAqIEBhdXRob3IgTWFybGEgU2NodWx6IDxtYXJsYS5zY2h1bHpAY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCB7IFNoYXBlIH0gZnJvbSAnLi4vLi4va2l0ZS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IFNjZW5lcnlQaGV0Q29sb3JzIGZyb20gJy4vU2NlbmVyeVBoZXRDb2xvcnMuanMnO1xyXG5pbXBvcnQgc2NlbmVyeVBoZXQgZnJvbSAnLi9zY2VuZXJ5UGhldC5qcyc7XHJcbmltcG9ydCB7IE5vZGUsIE5vZGVPcHRpb25zLCBQYWludENvbG9yUHJvcGVydHksIFBhdGgsIFRDb2xvciwgVFBhaW50IH0gZnJvbSAnLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IFN0cmljdE9taXQgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1N0cmljdE9taXQuanMnO1xyXG5pbXBvcnQgVFJhbmdlZFByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvVFJhbmdlZFByb3BlcnR5LmpzJztcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcbiAgZW1wdHlCZWFrZXJGaWxsPzogVFBhaW50O1xyXG4gIHNvbHV0aW9uRmlsbD86IFRDb2xvcjtcclxuICBzb2x1dGlvblNoYWRvd0ZpbGw/OiBUUGFpbnQ7XHJcbiAgc29sdXRpb25HbGFyZUZpbGw/OiBUUGFpbnQ7XHJcbiAgYmVha2VyR2xhcmVGaWxsPzogVFBhaW50O1xyXG4gIGJlYWtlckhlaWdodD86IG51bWJlcjtcclxuICBiZWFrZXJXaWR0aD86IG51bWJlcjtcclxuICB5UmFkaXVzT2ZFbmRzPzogbnVtYmVyOyAvLyByYWRpdXMgb2YgdGhlIGVsbGlwc2VzIHVzZWQgZm9yIHRoZSBlbmRzLCB0byBwcm92aWRlIDNEIHBlcnNwZWN0aXZlXHJcbiAgdGlja3NWaXNpYmxlPzogYm9vbGVhbjtcclxuICB0aWNrU3Ryb2tlPzogVFBhaW50O1xyXG4gIGJlYWtlclN0cm9rZT86IFRQYWludDtcclxuICBsaW5lV2lkdGg/OiBudW1iZXI7XHJcbiAgbnVtYmVyT2ZUaWNrcz86IG51bWJlcjsgLy8gVGhlIG51bWJlciBvZiB0aWNrIG1hcmtzIHNob3duIG9uIGJlYWtlci5cclxuICBtYWpvclRpY2tNYXJrTW9kdWx1cz86IG51bWJlcjsgLy8gbW9kdWx1cyBudW1iZXIgc3VjaCB0aGF0IGV2ZXJ5IE50aCB0aWNrIG1hcmsgaXMgYSBtYWpvciB0aWNrIG1hcmsuIFVzZSB3aXRoIG9wdGlvbnMubnVtYmVyT2ZUaWNrc1xyXG59O1xyXG5leHBvcnQgdHlwZSBCZWFrZXJOb2RlT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgU3RyaWN0T21pdDxOb2RlT3B0aW9ucywgJ2NoaWxkcmVuJz47XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCZWFrZXJOb2RlIGV4dGVuZHMgTm9kZSB7XHJcblxyXG4gIHByaXZhdGUgcmVhZG9ubHkgdGlja3M6IFBhdGg7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNwb3NlQmVha2VyTm9kZTogKCkgPT4gdm9pZDtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBzb2x1dGlvbkxldmVsUHJvcGVydHk6IFRSYW5nZWRQcm9wZXJ0eSwgcHJvdmlkZWRPcHRpb25zPzogQmVha2VyTm9kZU9wdGlvbnMgKSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBzb2x1dGlvbkxldmVsUHJvcGVydHkucmFuZ2UubWluID49IDAgJiYgc29sdXRpb25MZXZlbFByb3BlcnR5LnJhbmdlLm1heCA8PSAxLFxyXG4gICAgICAnU29sdXRpb25MZXZlbFByb3BlcnR5IG11c3QgYmUgYSBOdW1iZXJQcm9wZXJ0eSB3aXRoIG1pbiA+PSAwIGFuZCBtYXggPD0gMScgKTtcclxuXHJcbiAgICAvLyBHZW5lcmF0ZXMgaGlnaGxpZ2h0IGFuZCBzaGFkaW5nIHdoZW4gYSBjdXN0b20gc29sdXRpb25GaWxsIGlzIHByb3ZpZGVkLlxyXG4gICAgY29uc3Qgb3JpZ2luYWxHbGFyZUZpbGwgPSBwcm92aWRlZE9wdGlvbnM/LnNvbHV0aW9uRmlsbCAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gcHJvdmlkZWRPcHRpb25zLnNvbHV0aW9uRmlsbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFNjZW5lcnlQaGV0Q29sb3JzLnNvbHV0aW9uU2hpbmVGaWxsUHJvcGVydHk7XHJcbiAgICBjb25zdCBvcmlnaW5hbFNoYWRvd0ZpbGwgPSBwcm92aWRlZE9wdGlvbnM/LnNvbHV0aW9uRmlsbCAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHByb3ZpZGVkT3B0aW9ucy5zb2x1dGlvbkZpbGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogU2NlbmVyeVBoZXRDb2xvcnMuc29sdXRpb25TaGFkb3dGaWxsUHJvcGVydHk7XHJcblxyXG4gICAgLy8gS2VlcCBvdXIgc29sdXRpb24gZ2xhcmUvc2hhZG93IHVwLXRvLWRhdGUgaWYgc29sdXRpb25GaWxsIGlzIGEgUHJvcGVydHk8Q29sb3I+IGFuZCBpdCBjaGFuZ2VzXHJcbiAgICBjb25zdCBzb2x1dGlvbkdsYXJlRmlsbFByb3BlcnR5ID0gbmV3IFBhaW50Q29sb3JQcm9wZXJ0eSggb3JpZ2luYWxHbGFyZUZpbGwsIHsgbHVtaW5hbmNlRmFjdG9yOiAwLjUgfSApO1xyXG4gICAgY29uc3Qgc29sdXRpb25TaGFkb3dGaWxsUHJvcGVydHkgPSBuZXcgUGFpbnRDb2xvclByb3BlcnR5KCBvcmlnaW5hbFNoYWRvd0ZpbGwsIHsgbHVtaW5hbmNlRmFjdG9yOiAtMC4yIH0gKTtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPEJlYWtlck5vZGVPcHRpb25zLCBTZWxmT3B0aW9ucywgTm9kZU9wdGlvbnM+KCkoIHtcclxuICAgICAgZW1wdHlCZWFrZXJGaWxsOiBTY2VuZXJ5UGhldENvbG9ycy5lbXB0eUJlYWtlckZpbGxQcm9wZXJ0eSxcclxuICAgICAgc29sdXRpb25GaWxsOiBTY2VuZXJ5UGhldENvbG9ycy5zb2x1dGlvbkZpbGxQcm9wZXJ0eSxcclxuICAgICAgc29sdXRpb25HbGFyZUZpbGw6IHNvbHV0aW9uR2xhcmVGaWxsUHJvcGVydHksXHJcbiAgICAgIHNvbHV0aW9uU2hhZG93RmlsbDogc29sdXRpb25TaGFkb3dGaWxsUHJvcGVydHksXHJcbiAgICAgIGJlYWtlckdsYXJlRmlsbDogU2NlbmVyeVBoZXRDb2xvcnMuYmVha2VyU2hpbmVGaWxsUHJvcGVydHksXHJcbiAgICAgIGJlYWtlclN0cm9rZTogU2NlbmVyeVBoZXRDb2xvcnMuYmVha2VyU3Ryb2tlLFxyXG4gICAgICBsaW5lV2lkdGg6IDEsXHJcbiAgICAgIGJlYWtlckhlaWdodDogMTAwLFxyXG4gICAgICBiZWFrZXJXaWR0aDogNjAsXHJcbiAgICAgIHlSYWRpdXNPZkVuZHM6IDEyLFxyXG4gICAgICB0aWNrc1Zpc2libGU6IGZhbHNlLFxyXG4gICAgICBudW1iZXJPZlRpY2tzOiAzLFxyXG4gICAgICBtYWpvclRpY2tNYXJrTW9kdWx1czogMiwgLy8gRGVmYXVsdCB0byBldmVyeSBvdGhlciB0aWNrIG1hcmsgaXMgbWFqb3IuXHJcbiAgICAgIHRpY2tTdHJva2U6IFNjZW5lcnlQaGV0Q29sb3JzLnRpY2tTdHJva2VcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIGNvbnN0IHhSYWRpdXMgPSBvcHRpb25zLmJlYWtlcldpZHRoIC8gMjtcclxuXHJcbiAgICBjb25zdCBjZW50ZXJUb3AgPSAtb3B0aW9ucy5iZWFrZXJIZWlnaHQgLyAyO1xyXG4gICAgY29uc3QgY2VudGVyQm90dG9tID0gb3B0aW9ucy5iZWFrZXJIZWlnaHQgLyAyO1xyXG5cclxuICAgIC8vIEJlYWtlciBzdHJ1Y3R1cmUgYW5kIGdsYXJlIHNoYXBlc1xyXG4gICAgY29uc3QgYmVha2VyR2xhcmVTaGFwZSA9IG5ldyBTaGFwZSgpXHJcbiAgICAgIC5tb3ZlVG8oIC14UmFkaXVzICogMC42LCBjZW50ZXJUb3AgKiAwLjYgKVxyXG4gICAgICAudmVydGljYWxMaW5lVG8oIGNlbnRlckJvdHRvbSAqIDAuODUgKVxyXG4gICAgICAubGluZVRvKCAteFJhZGl1cyAqIDAuNSwgY2VudGVyQm90dG9tICogMC45IClcclxuICAgICAgLnZlcnRpY2FsTGluZVRvKCBjZW50ZXJUb3AgKiAwLjU1IClcclxuICAgICAgLmNsb3NlKCk7XHJcblxyXG4gICAgY29uc3QgYmVha2VyRnJvbnRTaGFwZSA9IG5ldyBTaGFwZSgpXHJcbiAgICAgIC5lbGxpcHRpY2FsQXJjKCAwLCBjZW50ZXJCb3R0b20sIHhSYWRpdXMsIG9wdGlvbnMueVJhZGl1c09mRW5kcywgMCwgMCwgTWF0aC5QSSwgZmFsc2UgKVxyXG4gICAgICAuZWxsaXB0aWNhbEFyYyggMCwgY2VudGVyVG9wLCB4UmFkaXVzLCBvcHRpb25zLnlSYWRpdXNPZkVuZHMsIDAsIE1hdGguUEksIDAsIHRydWUgKVxyXG4gICAgICAuY2xvc2UoKTtcclxuXHJcbiAgICBjb25zdCBiZWFrZXJCYWNrVG9wU2hhcGUgPSBuZXcgU2hhcGUoKVxyXG4gICAgICAuZWxsaXB0aWNhbEFyYyggMCwgY2VudGVyVG9wLCB4UmFkaXVzLCBvcHRpb25zLnlSYWRpdXNPZkVuZHMsIDAsIE1hdGguUEksIDAsIGZhbHNlICk7XHJcblxyXG4gICAgY29uc3QgYmVha2VyQmFja1NoYXBlID0gbmV3IFNoYXBlKClcclxuICAgICAgLmVsbGlwdGljYWxBcmMoIDAsIGNlbnRlclRvcCwgeFJhZGl1cywgb3B0aW9ucy55UmFkaXVzT2ZFbmRzLCAwLCBNYXRoLlBJLCAwLCBmYWxzZSApXHJcbiAgICAgIC5lbGxpcHRpY2FsQXJjKCAwLCBjZW50ZXJCb3R0b20sIHhSYWRpdXMsIG9wdGlvbnMueVJhZGl1c09mRW5kcywgMCwgMCwgTWF0aC5QSSwgdHJ1ZSApXHJcbiAgICAgIC5jbG9zZSgpO1xyXG5cclxuICAgIGNvbnN0IGJlYWtlckJvdHRvbVNoYXBlID0gbmV3IFNoYXBlKClcclxuICAgICAgLmVsbGlwdGljYWxBcmMoIDAsIGNlbnRlckJvdHRvbSwgeFJhZGl1cywgb3B0aW9ucy55UmFkaXVzT2ZFbmRzLCAwLCAwLCAyICogTWF0aC5QSSwgZmFsc2UgKTtcclxuXHJcbiAgICAvLyBXYXRlciBmaWxsIGFuZCBzaGFkaW5nIHBhdGhzXHJcbiAgICBjb25zdCBzb2x1dGlvblNpZGUgPSBuZXcgUGF0aCggbnVsbCwge1xyXG4gICAgICBmaWxsOiBvcHRpb25zLnNvbHV0aW9uRmlsbCxcclxuICAgICAgcGlja2FibGU6IGZhbHNlXHJcbiAgICB9ICk7XHJcbiAgICBjb25zdCBzb2x1dGlvblRvcCA9IG5ldyBQYXRoKCBudWxsLCB7XHJcbiAgICAgIGZpbGw6IG9wdGlvbnMuc29sdXRpb25GaWxsLFxyXG4gICAgICBwaWNrYWJsZTogZmFsc2VcclxuICAgIH0gKTtcclxuICAgIGNvbnN0IHNvbHV0aW9uRnJvbnRFZGdlID0gbmV3IFBhdGgoIG51bGwsIHtcclxuICAgICAgZmlsbDogb3B0aW9ucy5zb2x1dGlvblNoYWRvd0ZpbGwsXHJcbiAgICAgIHBpY2thYmxlOiBmYWxzZVxyXG4gICAgfSApO1xyXG4gICAgY29uc3Qgc29sdXRpb25CYWNrRWRnZSA9IG5ldyBQYXRoKCBudWxsLCB7XHJcbiAgICAgIGZpbGw6IG9wdGlvbnMuc29sdXRpb25TaGFkb3dGaWxsLFxyXG4gICAgICBvcGFjaXR5OiAwLjYsXHJcbiAgICAgIHBpY2thYmxlOiBmYWxzZVxyXG4gICAgfSApO1xyXG4gICAgY29uc3Qgc29sdXRpb25HbGFyZSA9IG5ldyBQYXRoKCBudWxsLCB7XHJcbiAgICAgIGZpbGw6IG9wdGlvbnMuc29sdXRpb25HbGFyZUZpbGxcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBCZWFrZXIgc3RydWN0dXJlIGFuZCBnbGFyZSBwYXRoc1xyXG4gICAgY29uc3QgYmVha2VyRnJvbnQgPSBuZXcgUGF0aCggYmVha2VyRnJvbnRTaGFwZSwge1xyXG4gICAgICBzdHJva2U6IG9wdGlvbnMuYmVha2VyU3Ryb2tlLFxyXG4gICAgICBsaW5lV2lkdGg6IG9wdGlvbnMubGluZVdpZHRoXHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3QgYmVha2VyQmFjayA9IG5ldyBQYXRoKCBiZWFrZXJCYWNrU2hhcGUsIHtcclxuICAgICAgc3Ryb2tlOiBvcHRpb25zLmJlYWtlclN0cm9rZSxcclxuICAgICAgbGluZVdpZHRoOiBvcHRpb25zLmxpbmVXaWR0aCxcclxuICAgICAgZmlsbDogb3B0aW9ucy5lbXB0eUJlYWtlckZpbGxcclxuICAgIH0gKTtcclxuXHJcbiAgICBjb25zdCBiZWFrZXJCYWNrVG9wID0gbmV3IFBhdGgoIGJlYWtlckJhY2tUb3BTaGFwZSwge1xyXG4gICAgICBzdHJva2U6IG9wdGlvbnMuYmVha2VyU3Ryb2tlLFxyXG4gICAgICBsaW5lV2lkdGg6IG9wdGlvbnMubGluZVdpZHRoXHJcbiAgICB9ICk7XHJcblxyXG4gICAgYmVha2VyQmFjay5zZXRTY2FsZU1hZ25pdHVkZSggLTEsIDEgKTtcclxuXHJcbiAgICBjb25zdCBiZWFrZXJCb3R0b20gPSBuZXcgUGF0aCggYmVha2VyQm90dG9tU2hhcGUsIHtcclxuICAgICAgc3Ryb2tlOiBvcHRpb25zLmJlYWtlclN0cm9rZSxcclxuICAgICAgZmlsbDogb3B0aW9ucy5lbXB0eUJlYWtlckZpbGwsXHJcbiAgICAgIHBpY2thYmxlOiBmYWxzZVxyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IGJlYWtlckdsYXJlID0gbmV3IFBhdGgoIGJlYWtlckdsYXJlU2hhcGUuZ2V0T2Zmc2V0U2hhcGUoIDIgKSwge1xyXG4gICAgICBmaWxsOiBvcHRpb25zLmJlYWtlckdsYXJlRmlsbFxyXG4gICAgfSApO1xyXG5cclxuICAgIGNvbnN0IHRpY2tEaXZpc2lvbiA9IDEgLyAoIG9wdGlvbnMubnVtYmVyT2ZUaWNrcyArIDEgKTtcclxuICAgIGNvbnN0IHRpY2tzU2hhcGUgPSBuZXcgU2hhcGUoKTtcclxuICAgIGxldCB5ID0gY2VudGVyQm90dG9tO1xyXG4gICAgZm9yICggbGV0IGkgPSAxOyBpIDw9IG9wdGlvbnMubnVtYmVyT2ZUaWNrczsgaSsrICkge1xyXG4gICAgICB5IC09IG9wdGlvbnMuYmVha2VySGVpZ2h0ICogdGlja0RpdmlzaW9uO1xyXG4gICAgICBjb25zdCBjZW50cmFsQW5nbGUgPSBNYXRoLlBJICogMC44MztcclxuICAgICAgY29uc3Qgb2Zmc2V0QW5nbGUgPSBNYXRoLlBJICogKCBpICUgb3B0aW9ucy5tYWpvclRpY2tNYXJrTW9kdWx1cyAhPT0gMCA/IDAuMDcgOiAwLjEgKTtcclxuICAgICAgdGlja3NTaGFwZS5lbGxpcHRpY2FsQXJjKCAwLCB5LCB4UmFkaXVzLCBvcHRpb25zLnlSYWRpdXNPZkVuZHMsIDAsIGNlbnRyYWxBbmdsZSArIG9mZnNldEFuZ2xlLCBjZW50cmFsQW5nbGUgLSBvZmZzZXRBbmdsZSwgdHJ1ZSApLm5ld1N1YnBhdGgoKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0aWNrcyA9IG5ldyBQYXRoKCB0aWNrc1NoYXBlLCB7XHJcbiAgICAgIHN0cm9rZTogb3B0aW9ucy50aWNrU3Ryb2tlLFxyXG4gICAgICBsaW5lV2lkdGg6IDEuNSxcclxuICAgICAgcGlja2FibGU6IGZhbHNlLFxyXG4gICAgICB2aXNpYmxlOiBvcHRpb25zLnRpY2tzVmlzaWJsZVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIHNvbHV0aW9uIGxldmVsIGFkanVzdG1lbnQgbGlzdGVuZXJcclxuICAgIGNvbnN0IHNvbHV0aW9uTGV2ZWxMaXN0ZW5lciA9ICggc29sdXRpb25MZXZlbDogbnVtYmVyICkgPT4ge1xyXG4gICAgICBjb25zdCBjZW50ZXJMaXF1aWRZID0gY2VudGVyQm90dG9tIC0gb3B0aW9ucy5iZWFrZXJIZWlnaHQgKiBzb2x1dGlvbkxldmVsO1xyXG4gICAgICBjb25zdCBzb2x1dGlvblRvcFNoYXBlID0gbmV3IFNoYXBlKClcclxuICAgICAgICAuZWxsaXB0aWNhbEFyYyggMCwgY2VudGVyTGlxdWlkWSwgeFJhZGl1cywgb3B0aW9ucy55UmFkaXVzT2ZFbmRzLCAwLCAwLCBNYXRoLlBJICogMiwgZmFsc2UgKVxyXG4gICAgICAgIC5jbG9zZSgpO1xyXG4gICAgICBjb25zdCBzb2x1dGlvblNpZGVTaGFwZSA9IG5ldyBTaGFwZSgpXHJcbiAgICAgICAgLmVsbGlwdGljYWxBcmMoIDAsIGNlbnRlckxpcXVpZFksIHhSYWRpdXMsIG9wdGlvbnMueVJhZGl1c09mRW5kcywgMCwgTWF0aC5QSSwgMCwgdHJ1ZSApXHJcbiAgICAgICAgLmVsbGlwdGljYWxBcmMoIDAsIGNlbnRlckJvdHRvbSwgeFJhZGl1cywgb3B0aW9ucy55UmFkaXVzT2ZFbmRzLCAwLCAwLCBNYXRoLlBJLCBmYWxzZSApXHJcbiAgICAgICAgLmNsb3NlKCk7XHJcbiAgICAgIGNvbnN0IHNvbHV0aW9uRnJvbnRFZGdlU2hhcGUgPSBuZXcgU2hhcGUoKVxyXG4gICAgICAgIC5lbGxpcHRpY2FsQXJjKCAwLCBjZW50ZXJMaXF1aWRZICsgMSwgeFJhZGl1cywgb3B0aW9ucy55UmFkaXVzT2ZFbmRzICsgMiwgMCwgTWF0aC5QSSwgMCwgdHJ1ZSApXHJcbiAgICAgICAgLmVsbGlwdGljYWxBcmMoIDAsIGNlbnRlckxpcXVpZFksIHhSYWRpdXMsIG9wdGlvbnMueVJhZGl1c09mRW5kcywgMCwgMCwgTWF0aC5QSSwgZmFsc2UgKTtcclxuICAgICAgY29uc3Qgc29sdXRpb25CYWNrRWRnZVNoYXBlID0gbmV3IFNoYXBlKClcclxuICAgICAgICAuZWxsaXB0aWNhbEFyYyggMCwgY2VudGVyQm90dG9tIC0gMSwgeFJhZGl1cywgb3B0aW9ucy55UmFkaXVzT2ZFbmRzICsgNCwgTWF0aC5QSSwgTWF0aC5QSSwgMCwgdHJ1ZSApXHJcbiAgICAgICAgLmVsbGlwdGljYWxBcmMoIDAsIGNlbnRlckJvdHRvbSwgeFJhZGl1cywgb3B0aW9ucy55UmFkaXVzT2ZFbmRzLCBNYXRoLlBJLCAwLCBNYXRoLlBJLCBmYWxzZSApO1xyXG4gICAgICBjb25zdCBzb2x1dGlvbkNyZXNjZW50U2hhcGUgPSBuZXcgU2hhcGUoKVxyXG4gICAgICAgIC5lbGxpcHRpY2FsQXJjKCB4UmFkaXVzICogMC4yLCBjZW50ZXJMaXF1aWRZLCBvcHRpb25zLnlSYWRpdXNPZkVuZHMgKiAwLjc1LCB4UmFkaXVzICogMC40LCBNYXRoLlBJICogMS41LCBNYXRoLlBJLCAwLCB0cnVlIClcclxuICAgICAgICAuZWxsaXB0aWNhbEFyYyggeFJhZGl1cyAqIDAuMiwgY2VudGVyTGlxdWlkWSwgb3B0aW9ucy55UmFkaXVzT2ZFbmRzICogMC43NSwgeFJhZGl1cyAqIDAuNiwgTWF0aC5QSSAqIDEuNSwgMCwgTWF0aC5QSSwgZmFsc2UgKTtcclxuXHJcbiAgICAgIHNvbHV0aW9uVG9wLnNoYXBlID0gc29sdXRpb25Ub3BTaGFwZTtcclxuICAgICAgc29sdXRpb25TaWRlLnNoYXBlID0gc29sdXRpb25TaWRlU2hhcGU7XHJcbiAgICAgIHNvbHV0aW9uRnJvbnRFZGdlLnNoYXBlID0gc29sdXRpb25Gcm9udEVkZ2VTaGFwZTtcclxuICAgICAgc29sdXRpb25CYWNrRWRnZS5zaGFwZSA9IHNvbHV0aW9uQmFja0VkZ2VTaGFwZTtcclxuICAgICAgc29sdXRpb25HbGFyZS5zaGFwZSA9IHNvbHV0aW9uQ3Jlc2NlbnRTaGFwZTtcclxuXHJcbiAgICAgIC8vIFNldCBzb2x1dGlvbiB2aXNpYmlsaXR5IGJhc2VkIG9uIHNvbHV0aW9uIGxldmVsXHJcbiAgICAgIGlmICggc29sdXRpb25MZXZlbCA8IDAuMDAxICkge1xyXG4gICAgICAgIHNvbHV0aW9uVG9wLnZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICBzb2x1dGlvblNpZGUudmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgIHNvbHV0aW9uRnJvbnRFZGdlLnZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICBzb2x1dGlvbkJhY2tFZGdlLnZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICBzb2x1dGlvbkdsYXJlLnZpc2libGUgPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuXHJcbiAgICAgICAgLy8gUHJldmVudHMgYmFjayBlZGdlIGZyb20gYXBwZWFyaW5nIHdoZW4gc29sdXRpb24gbGV2ZWwgZW1wdHkuICBPbmx5IGNvbXB1dGUgdGhpcyB3aGVuIHRoZSBzb2x1dGlvbkJhY2tFZGdlXHJcbiAgICAgICAgLy8gd2lsbCBiZSBzaG93biwgYmVjYXVzZSB3aGVuIGNvbXB1dGVkIGZvciB2ZXJ5IHNtYWxsIHNvbHV0aW9uTGV2ZWwgaXQgdHJpZ2dlcnMgYSBraXRlIGNvcm5lciBjYXNlIHByb2JsZW1cclxuICAgICAgICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2tpdGUvaXNzdWVzLzk4XHJcbiAgICAgICAgc29sdXRpb25CYWNrRWRnZS5jbGlwQXJlYSA9IFNoYXBlLnVuaW9uKCBbIHNvbHV0aW9uVG9wU2hhcGUsIHNvbHV0aW9uU2lkZVNoYXBlIF0gKTtcclxuXHJcbiAgICAgICAgc29sdXRpb25Ub3AudmlzaWJsZSA9IHRydWU7XHJcbiAgICAgICAgc29sdXRpb25TaWRlLnZpc2libGUgPSB0cnVlO1xyXG4gICAgICAgIHNvbHV0aW9uRnJvbnRFZGdlLnZpc2libGUgPSB0cnVlO1xyXG4gICAgICAgIHNvbHV0aW9uQmFja0VkZ2UudmlzaWJsZSA9IHRydWU7XHJcbiAgICAgICAgc29sdXRpb25HbGFyZS52aXNpYmxlID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIHNvbHV0aW9uTGV2ZWxQcm9wZXJ0eS5saW5rKCBzb2x1dGlvbkxldmVsTGlzdGVuZXIgKTtcclxuXHJcbiAgICAvLyBQcmV2ZW50cyBmcm9udCBlZGdlIGZyb20gZGlwcGluZyBiZWxvdyBiZWFrZXIgYm91bmRhcnkgd2hlbiBkcmFnZ2VkIGFsbCB0aGUgd2F5IGRvd24uXHJcbiAgICBzb2x1dGlvbkZyb250RWRnZS5jbGlwQXJlYSA9IFNoYXBlLnVuaW9uKCBbIGJlYWtlckZyb250U2hhcGUsIGJlYWtlckJvdHRvbVNoYXBlIF0gKTtcclxuXHJcbiAgICBvcHRpb25zLmNoaWxkcmVuID0gW1xyXG4gICAgICBiZWFrZXJCYWNrLFxyXG4gICAgICBiZWFrZXJCb3R0b20sXHJcbiAgICAgIHNvbHV0aW9uU2lkZSxcclxuICAgICAgc29sdXRpb25CYWNrRWRnZSxcclxuICAgICAgc29sdXRpb25Ub3AsXHJcbiAgICAgIHNvbHV0aW9uR2xhcmUsXHJcbiAgICAgIHNvbHV0aW9uRnJvbnRFZGdlLFxyXG4gICAgICBiZWFrZXJCYWNrVG9wLFxyXG4gICAgICBiZWFrZXJGcm9udCxcclxuICAgICAgdGlja3MsXHJcbiAgICAgIGJlYWtlckdsYXJlXHJcbiAgICBdO1xyXG5cclxuICAgIHN1cGVyKCBvcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy50aWNrcyA9IHRpY2tzO1xyXG5cclxuICAgIHRoaXMuZGlzcG9zZUJlYWtlck5vZGUgPSAoKSA9PiB7XHJcbiAgICAgIHNvbHV0aW9uR2xhcmVGaWxsUHJvcGVydHkuZGlzcG9zZSgpO1xyXG4gICAgICBzb2x1dGlvblNoYWRvd0ZpbGxQcm9wZXJ0eS5kaXNwb3NlKCk7XHJcbiAgICAgIHNvbHV0aW9uTGV2ZWxQcm9wZXJ0eS51bmxpbmsoIHNvbHV0aW9uTGV2ZWxMaXN0ZW5lciApO1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvdmVycmlkZSBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5kaXNwb3NlQmVha2VyTm9kZSgpO1xyXG4gICAgc3VwZXIuZGlzcG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldFRpY2tzVmlzaWJsZSggdmlzaWJsZTogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgIHRoaXMudGlja3MudmlzaWJsZSA9IHZpc2libGU7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5UGhldC5yZWdpc3RlciggJ0JlYWtlck5vZGUnLCBCZWFrZXJOb2RlICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsU0FBU0EsS0FBSyxRQUFRLDBCQUEwQjtBQUNoRCxPQUFPQyxpQkFBaUIsTUFBTSx3QkFBd0I7QUFDdEQsT0FBT0MsV0FBVyxNQUFNLGtCQUFrQjtBQUMxQyxTQUFTQyxJQUFJLEVBQWVDLGtCQUFrQixFQUFFQyxJQUFJLFFBQXdCLDZCQUE2QjtBQUN6RyxPQUFPQyxTQUFTLE1BQU0saUNBQWlDO0FBc0J2RCxlQUFlLE1BQU1DLFVBQVUsU0FBU0osSUFBSSxDQUFDO0VBS3BDSyxXQUFXQSxDQUFFQyxxQkFBc0MsRUFBRUMsZUFBbUMsRUFBRztJQUNoR0MsTUFBTSxJQUFJQSxNQUFNLENBQUVGLHFCQUFxQixDQUFDRyxLQUFLLENBQUNDLEdBQUcsSUFBSSxDQUFDLElBQUlKLHFCQUFxQixDQUFDRyxLQUFLLENBQUNFLEdBQUcsSUFBSSxDQUFDLEVBQzVGLDJFQUE0RSxDQUFDOztJQUUvRTtJQUNBLE1BQU1DLGlCQUFpQixHQUFHTCxlQUFlLEVBQUVNLFlBQVksS0FBS0MsU0FBUyxHQUN6Q1AsZUFBZSxDQUFDTSxZQUFZLEdBQzVCZixpQkFBaUIsQ0FBQ2lCLHlCQUF5QjtJQUN2RSxNQUFNQyxrQkFBa0IsR0FBR1QsZUFBZSxFQUFFTSxZQUFZLEtBQUtDLFNBQVMsR0FDekNQLGVBQWUsQ0FBQ00sWUFBWSxHQUM1QmYsaUJBQWlCLENBQUNtQiwwQkFBMEI7O0lBRXpFO0lBQ0EsTUFBTUMseUJB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Q2pCLGFBQWEsQ0FBQ2lCLE9BQU8sR0FBRyxLQUFLO01BQy9CLENBQUMsTUFDSTtRQUVIO1FBQ0E7UUFDQTtRQUNBbkIsZ0JBQWdCLENBQUM2QixRQUFRLEdBQUd6RixLQUFLLENBQUMwRixLQUFLLENBQUUsQ0FBRVAsZ0JBQWdCLEVBQUVDLGlCQUFpQixDQUFHLENBQUM7UUFFbEYxQixXQUFXLENBQUNxQixPQUFPLEdBQUcsSUFBSTtRQUMxQnhCLFlBQVksQ0FBQ3dCLE9BQU8sR0FBRyxJQUFJO1FBQzNCcEIsaUJBQWlCLENBQUNvQixPQUFPLEdBQUcsSUFBSTtRQUNoQ25CLGdCQUFnQixDQUFDbUIsT0FBTyxHQUFHLElBQUk7UUFDL0JqQixhQUFhLENBQUNpQixPQUFPLEdBQUcsSUFBSTtNQUM5QjtJQUNGLENBQUM7SUFDRHRFLHFCQUFxQixDQUFDa0YsSUFBSSxDQUFFWCxxQkFBc0IsQ0FBQzs7SUFFbkQ7SUFDQXJCLGlCQUFpQixDQUFDOEIsUUFBUSxHQUFHekYsS0FBSyxDQUFDMEYsS0FBSyxDQUFFLENBQUUxQyxnQkFBZ0IsRUFBRU0saUJBQWlCLENBQUcsQ0FBQztJQUVuRi9CLE9BQU8sQ0FBQ3FFLFFBQVEsR0FBRyxDQUNqQjNCLFVBQVUsRUFDVkcsWUFBWSxFQUNaYixZQUFZLEVBQ1pLLGdCQUFnQixFQUNoQkYsV0FBVyxFQUNYSSxhQUFhLEVBQ2JILGlCQUFpQixFQUNqQk8sYUFBYSxFQUNiSCxXQUFXLEVBQ1hlLEtBQUssRUFDTFQsV0FBVyxDQUNaO0lBRUQsS0FBSyxDQUFFOUMsT0FBUSxDQUFDO0lBRWhCLElBQUksQ0FBQ3VELEtBQUssR0FBR0EsS0FBSztJQUVsQixJQUFJLENBQUNlLGlCQUFpQixHQUFHLE1BQU07TUFDN0J4RSx5QkFBeUIsQ0FBQ3lFLE9BQU8sQ0FBQyxDQUFDO01BQ25DMUUsMEJBQTBCLENBQUMwRSxPQUFPLENBQUMsQ0FBQztNQUNwQ3JGLHFCQUFxQixDQUFDc0YsTUFBTSxDQUFFZixxQkFBc0IsQ0FBQztJQUN2RCxDQUFDO0VBQ0g7RUFFZ0JjLE9BQU9BLENBQUEsRUFBUztJQUM5QixJQUFJLENBQUNELGlCQUFpQixDQUFDLENBQUM7SUFDeEIsS0FBSyxDQUFDQyxPQUFPLENBQUMsQ0FBQztFQUNqQjtFQUVPRSxlQUFlQSxDQUFFakIsT0FBZ0IsRUFBUztJQUMvQyxJQUFJLENBQUNELEtBQUssQ0FBQ0MsT0FBTyxHQUFHQSxPQUFPO0VBQzlCO0FBQ0Y7QUFFQTdFLFdBQVcsQ0FBQytGLFFBQVEsQ0FBRSxZQUFZLEVBQUUxRixVQUFXLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=