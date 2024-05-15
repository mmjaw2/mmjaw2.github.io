// Copyright 2023, University of Colorado Boulder

/**
 * An animation that will animate one object (usually a Node) out, and another in.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { Shape } from '../../kite/js/imports.js';
import merge from '../../phet-core/js/merge.js';
import required from '../../phet-core/js/required.js';
import Animation from './Animation.js';
import twixt from './twixt.js';
import optionize, { combineOptions } from '../../phet-core/js/optionize.js';
class Transition extends Animation {
  /**
   * NOTE: The nodes' transform/pickability/visibility/opacity/clipArea/etc. can be modified, and will be reset to
   * the default value when the transition finishes.
   */
  constructor(fromNode, toNode, config) {
    const defaults = {
      fromTargets: required(config.fromTargets),
      toTargets: required(config.toTargets),
      resetNode: required(config.resetNode),
      // {Object|null} (optional) - Passed as additional objects to every target
      targetOptions: null
    };
    config = merge({}, defaults, config);
    assert && assert(typeof config.resetNode === 'function');
    const targetOptions = merge({
      // NOTE: no defaults, but we want it to be an object so we merge anyways
    }, config.targetOptions);
    let targets = [];
    if (fromNode) {
      targets = targets.concat(config.fromTargets.map(target => {
        return combineOptions(target, {
          object: fromNode
        }, targetOptions);
      }));
    }
    if (toNode) {
      targets = targets.concat(config.toTargets.map(target => {
        return combineOptions(target, {
          object: toNode
        }, targetOptions);
      }));
    }
    super(combineOptions({
      // @ts-expect-error - Because we can't unroll the types in the maps above.
      targets: targets
    }, _.omit(config, _.keys(defaults))));

    // When this animation ends, reset the values for both nodes
    this.endedEmitter.addListener(() => {
      fromNode && config.resetNode(fromNode);
      toNode && config.resetNode(toNode);
    });
  }

  /**
   * Creates an animation that slides the `fromNode` out to the left (and the `toNode` in from the right).
   *
   * @param bounds
   * @param fromNode
   * @param toNode
   * @param [options] - Usually specify duration, easing, or other Animation options.
   */
  static slideLeft(bounds, fromNode, toNode, options) {
    return Transition.createSlide(fromNode, toNode, 'x', bounds.width, true, options);
  }

  /**
   * Creates an animation that slides the `fromNode` out to the right (and the `toNode` in from the left).
   *
   * @param bounds
   * @param fromNode
   * @param toNode
   * @param [options] - Usually specify duration, easing, or other Animation options.
   */
  static slideRight(bounds, fromNode, toNode, options) {
    return Transition.createSlide(fromNode, toNode, 'x', bounds.width, false, options);
  }

  /**
   * Creates an animation that slides the `fromNode` out to the top (and the `toNode` in from the bottom).
   *
   * @param bounds
   * @param fromNode
   * @param toNode
   * @param [options] - Usually specify duration, easing, or other Animation options.
   */
  static slideUp(bounds, fromNode, toNode, options) {
    return Transition.createSlide(fromNode, toNode, 'y', bounds.height, true, options);
  }

  /**
   * Creates an animation that slides the `fromNode` out to the bottom (and the `toNode` in from the top).
   *
   * @param bounds
   * @param fromNode
   * @param toNode
   * @param [options] - Usually specify duration, easing, or other Animation options.
   */
  static slideDown(bounds, fromNode, toNode, options) {
    return Transition.createSlide(fromNode, toNode, 'y', bounds.height, false, options);
  }

  /**
   * Creates a transition that wipes across the screen, moving to the left.
   *
   * @param bounds
   * @param fromNode
   * @param toNode
   * @param [options] - Usually specify duration, easing, or other Animation options.
   */
  static wipeLeft(bounds, fromNode, toNode, options) {
    return Transition.createWipe(bounds, fromNode, toNode, 'maxX', 'minX', options);
  }

  /**
   * Creates a transition that wipes across the screen, moving to the right.
   *
   * @param bounds
   * @param fromNode
   * @param toNode
   * @param [options] - Usually specify duration, easing, or other Animation options.
   */
  static wipeRight(bounds, fromNode, toNode, options) {
    return Transition.createWipe(bounds, fromNode, toNode, 'minX', 'maxX', options);
  }

  /**
   * Creates a transition that wipes across the screen, moving up.
   *
   * @param bounds
   * @param fromNode
   * @param toNode
   * @param [options] - Usually specify duration, easing, or other Animation options.
   */
  static wipeUp(bounds, fromNode, toNode, options) {
    return Transition.createWipe(bounds, fromNode, toNode, 'maxY', 'minY', options);
  }

  /**
   * Creates a transition that wipes across the screen, moving down.
   *
   * @param bounds
   * @param fromNode
   * @param toNode
   * @param [options] - Usually specify duration, easing, or other Animation options.
   */
  static wipeDown(bounds, fromNode, toNode, options) {
    return Transition.createWipe(bounds, fromNode, toNode, 'minY', 'maxY', options);
  }

  /**
   * Creates a transition that fades from `fromNode` to `toNode` by varying the opacity of both.
   *
   * @param fromNode
   * @param toNode
   * @param [providedOptions] - Usually specify duration, easing, or other Animation options.
   */
  static dissolve(fromNode, toNode, providedOptions) {
    const gammaBlend = (a, b, ratio) => {
      return Math.pow((1 - ratio) * a + ratio * b, options.gamma);
    };
    const options = optionize()({
      // Handles gamma correction for the opacity when required
      gamma: 1,
      fromTargets: [{
        attribute: 'opacity',
        from: 1,
        to: 0,
        blend: gammaBlend
      }],
      toTargets: [{
        attribute: 'opacity',
        from: 0,
        to: 1,
        blend: gammaBlend
      }],
      resetNode: node => {
        node.opacity = 1;
      }
    }, providedOptions);

    // @ts-expect-error WHY?
    return new Transition(fromNode, toNode, options);
  }

  /**
   * Creates a sliding transition within the bounds.
   *
   * @param fromNode
   * @param toNode
   * @param attribute - The positional attribute to animate
   * @param size - The size of the animation (for the positional attribute)
   * @param reversed - Whether to reverse the animation. By default it goes right/down.
   * @param [options]
   */
  static createSlide(fromNode, toNode, attribute, size, reversed, options) {
    const sign = reversed ? -1 : 1;
    return new Transition(fromNode, toNode, optionize()({
      fromTargets: [{
        attribute: attribute,
        from: 0,
        to: size * sign
      }],
      toTargets: [{
        attribute: attribute,
        from: -size * sign,
        to: 0
      }],
      resetNode: node => {
        node[attribute] = 0;
      }
    }, options));
  }

  /**
   * Creates a wiping transition within the bounds.
   *
   * @param bounds
   * @param fromNode
   * @param toNode
   * @param minAttribute - One side of the bounds on the minimal side (where the animation starts)
   * @param maxAttribute - The other side of the bounds (where animation ends)
   * @param [options]
   */
  static createWipe(bounds, fromNode, toNode, minAttribute, maxAttribute, options) {
    const fromNodeBounds = bounds.copy();
    const toNodeBounds = bounds.copy();
    fromNodeBounds[minAttribute] = bounds[maxAttribute];
    toNodeBounds[maxAttribute] = bounds[minAttribute];

    // We need to apply custom clip area interpolation
    const clipBlend = (boundsA, boundsB, ratio) => {
      return Shape.bounds(boundsA.blend(boundsB, ratio));
    };
    return new Transition(fromNode, toNode, optionize()({
      fromTargets: [{
        attribute: 'clipArea',
        from: bounds,
        to: fromNodeBounds,
        // @ts-expect-error EEEEK - we're relying on blend to convert a bounds to a shape...?
        blend: clipBlend
      }],
      toTargets: [{
        attribute: 'clipArea',
        from: toNodeBounds,
        to: bounds,
        // @ts-expect-error EEEEK - we're relying on blend to convert a bounds to a shape...?
        blend: clipBlend
      }],
      resetNode: function (node) {
        node.clipArea = null;
      }
    }, options));
  }
}
twixt.register('Transition', Transition);
export default Transition;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTaGFwZSIsIm1lcmdlIiwicmVxdWlyZWQiLCJBbmltYXRpb24iLCJ0d2l4dCIsIm9wdGlvbml6ZSIsImNvbWJpbmVPcHRpb25zIiwiVHJhbnNpdGlvbiIsImNvbnN0cnVjdG9yIiwiZnJvbU5vZGUiLCJ0b05vZGUiLCJjb25maWciLCJkZWZhdWx0cyIsImZyb21UYXJnZXRzIiwidG9UYXJnZXRzIiwicmVzZXROb2RlIiwidGFyZ2V0T3B0aW9ucyIsImFzc2VydCIsInRhcmdldHMiLCJjb25jYXQiLCJtYXAiLCJ0YXJnZXQiLCJvYmplY3QiLCJfIiwib21pdCIsImtleXMiLCJlbmRlZEVtaXR0ZXIiLCJhZGRMaXN0ZW5lciIsInNsaWRlTGVmdCIsImJvdW5kcyIsIm9wdGlvbnMiLCJjcmVhdGVTbGlkZSIsIndpZHRoIiwic2xpZGVSaWdodCIsInNsaWRlVXAiLCJoZWlnaHQiLCJzbGlkZURvd24iLCJ3aXBlTGVmdCIsImNyZWF0ZVdpcGUiLCJ3aXBlUmlnaHQiLCJ3aXBlVXAiLCJ3aXBlRG93biIsImRpc3NvbHZlIiwicHJvdmlkZWRPcHRpb25zIiwiZ2FtbWFCbGVuZCIsImEiLCJiIiwicmF0aW8iLCJNYXRoIiwicG93IiwiZ2FtbWEiLCJhdHRyaWJ1dGUiLCJmcm9tIiwidG8iLCJibGVuZCIsIm5vZGUiLCJvcGFjaXR5Iiwic2l6ZSIsInJldmVyc2VkIiwic2lnbiIsIm1pbkF0dHJpYnV0ZSIsIm1heEF0dHJpYnV0ZSIsImZyb21Ob2RlQm91bmRzIiwiY29weSIsInRvTm9kZUJvdW5kcyIsImNsaXBCbGVuZCIsImJvdW5kc0EiLCJib3VuZHNCIiwiY2xpcEFyZWEiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlRyYW5zaXRpb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjMsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEFuIGFuaW1hdGlvbiB0aGF0IHdpbGwgYW5pbWF0ZSBvbmUgb2JqZWN0ICh1c3VhbGx5IGEgTm9kZSkgb3V0LCBhbmQgYW5vdGhlciBpbi5cclxuICpcclxuICogQGF1dGhvciBKb25hdGhhbiBPbHNvbiA8am9uYXRoYW4ub2xzb25AY29sb3JhZG8uZWR1PlxyXG4gKi9cclxuXHJcbmltcG9ydCB7IFNoYXBlIH0gZnJvbSAnLi4vLi4va2l0ZS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IHsgTm9kZSB9IGZyb20gJy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBtZXJnZSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvbWVyZ2UuanMnO1xyXG5pbXBvcnQgcmVxdWlyZWQgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL3JlcXVpcmVkLmpzJztcclxuaW1wb3J0IEFuaW1hdGlvbiwgeyBBbmltYXRpb25PcHRpb25zIH0gZnJvbSAnLi9BbmltYXRpb24uanMnO1xyXG5pbXBvcnQgdHdpeHQgZnJvbSAnLi90d2l4dC5qcyc7XHJcbmltcG9ydCB7IEFuaW1hdGlvblRhcmdldE9wdGlvbnMgfSBmcm9tICcuL0FuaW1hdGlvblRhcmdldC5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUsIHsgY29tYmluZU9wdGlvbnMsIEVtcHR5U2VsZk9wdGlvbnMgfSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IEtleXNNYXRjaGluZyBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvS2V5c01hdGNoaW5nLmpzJztcclxuaW1wb3J0IFdyaXRhYmxlS2V5cyBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvV3JpdGFibGVLZXlzLmpzJztcclxuaW1wb3J0IFN0cmljdE9taXQgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1N0cmljdE9taXQuanMnO1xyXG5pbXBvcnQgQm91bmRzMiBmcm9tICcuLi8uLi9kb3QvanMvQm91bmRzMi5qcyc7XHJcblxyXG50eXBlIFNlbGZPcHRpb25zPFRhcmdldFR5cGVzPiA9IHtcclxuICAvLyBBIGxpc3Qgb2YgcGFydGlhbCBjb25maWd1cmF0aW9ucyB0aGF0IHdpbGwgaW5kaXZpZHVhbGx5IGJlIHBhc3NlZCB0byB0aGUgdGFyZ2V0cyBmb3IgYW4gQW5pbWF0aW9uIChhbmQgdGh1cyB0b1xyXG4gIC8vIEFuaW1hdGlvblRhcmdldCkuIFRoZXkgd2lsbCBiZSBjb21iaW5lZCB3aXRoIGBvYmplY3Q6IG5vZGVgIGFuZCBvcHRpb25zLnRhcmdldE9wdGlvbnMgdG8gY3JlYXRlIHRoZSBBbmltYXRpb24uXHJcbiAgLy8gU2VlIEFuaW1hdGlvbidzIHRhcmdldHMgcGFyYW1ldGVyIGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgZnJvbVRhcmdldHM6IHsgW0sgaW4ga2V5b2YgVGFyZ2V0VHlwZXNdOiBBbmltYXRpb25UYXJnZXRPcHRpb25zPFRhcmdldFR5cGVzW0tdLCBOb2RlPiB9O1xyXG4gIHRvVGFyZ2V0czogeyBbSyBpbiBrZXlvZiBUYXJnZXRUeXBlc106IEFuaW1hdGlvblRhcmdldE9wdGlvbnM8VGFyZ2V0VHlwZXNbS10sIE5vZGU+IH07XHJcblxyXG4gIC8vIHJlc2V0cyB0aGUgYW5pbWF0ZWQgcGFyYW1ldGVyKHMpIHRvIHRoZWlyIGRlZmF1bHQgdmFsdWVzLlxyXG4gIHJlc2V0Tm9kZTogKCBub2RlOiBOb2RlICkgPT4gdm9pZDtcclxuXHJcbiAgdGFyZ2V0T3B0aW9ucz86IEFuaW1hdGlvblRhcmdldE9wdGlvbnM8dW5rbm93biwgTm9kZT47XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBQYXJ0aWFsVHJhbnNpdGlvbk9wdGlvbnM8VD4gPSBTdHJpY3RPbWl0PFNlbGZPcHRpb25zPFtUXT4sICdmcm9tVGFyZ2V0cycgfCAndG9UYXJnZXRzJyB8ICdyZXNldE5vZGUnPiAmIEFuaW1hdGlvbk9wdGlvbnM8dW5rbm93biwgdW5rbm93biwgW1RdLCBbTm9kZV0+O1xyXG5cclxuZXhwb3J0IHR5cGUgU2xpZGVUcmFuc2l0aW9uT3B0aW9ucyA9IFBhcnRpYWxUcmFuc2l0aW9uT3B0aW9uczxudW1iZXI+O1xyXG5leHBvcnQgdHlwZSBXaXBlVHJhbnNpdGlvbk9wdGlvbnMgPSBQYXJ0aWFsVHJhbnNpdGlvbk9wdGlvbnM8U2hhcGU+O1xyXG5cclxuZXhwb3J0IHR5cGUgRGlzc29sdmVUcmFuc2l0aW9uU2VsZk9wdGlvbnMgPSB7IGdhbW1hPzogbnVtYmVyIH07XHJcbmV4cG9ydCB0eXBlIERpc3NvbHZlVHJhbnNpdGlvbk9wdGlvbnMgPSBQYXJ0aWFsVHJhbnNpdGlvbk9wdGlvbnM8bnVtYmVyPiAmIERpc3NvbHZlVHJhbnNpdGlvblNlbGZPcHRpb25zO1xyXG5cclxuZXhwb3J0IHR5cGUgVHJhbnNpdGlvbk9wdGlvbnM8U2VsZlR5cGUgPSB1bmtub3duLCBTZWxmT2JqZWN0VHlwZSA9IHVua25vd24sIFRhcmdldFR5cGVzID0gdW5rbm93bltdLCBUYXJnZXRPYmplY3RUeXBlcyBleHRlbmRzIHsgW0sgaW4ga2V5b2YgVGFyZ2V0VHlwZXNdOiBOb2RlIH0gPSB7IFtLIGluIGtleW9mIFRhcmdldFR5cGVzXTogTm9kZSB9PiA9IFNlbGZPcHRpb25zPFRhcmdldFR5cGVzPiAmIEFuaW1hdGlvbk9wdGlvbnM8U2VsZlR5cGUsIFNlbGZPYmplY3RUeXBlLCBUYXJnZXRUeXBlcywgVGFyZ2V0T2JqZWN0VHlwZXM+O1xyXG5cclxuY2xhc3MgVHJhbnNpdGlvbjxTZWxmVHlwZSA9IHVua25vd24sIFNlbGZPYmplY3RUeXBlID0gdW5rbm93biwgVGFyZ2V0VHlwZXMgPSB1bmtub3duW10sIFRhcmdldE9iamVjdFR5cGVzIGV4dGVuZHMgeyBbSyBpbiBrZXlvZiBUYXJnZXRUeXBlc106IE5vZGUgfSA9IHsgW0sgaW4ga2V5b2YgVGFyZ2V0VHlwZXNdOiBOb2RlIH0+IGV4dGVuZHMgQW5pbWF0aW9uPFNlbGZUeXBlLCBTZWxmT2JqZWN0VHlwZSwgVGFyZ2V0VHlwZXMsIFRhcmdldE9iamVjdFR5cGVzPiB7XHJcblxyXG4gIC8qKlxyXG4gICAqIE5PVEU6IFRoZSBub2RlcycgdHJhbnNmb3JtL3BpY2thYmlsaXR5L3Zpc2liaWxpdHkvb3BhY2l0eS9jbGlwQXJlYS9ldGMuIGNhbiBiZSBtb2RpZmllZCwgYW5kIHdpbGwgYmUgcmVzZXQgdG9cclxuICAgKiB0aGUgZGVmYXVsdCB2YWx1ZSB3aGVuIHRoZSB0cmFuc2l0aW9uIGZpbmlzaGVzLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggZnJvbU5vZGU6IE5vZGUgfCBudWxsLCB0b05vZGU6IE5vZGUgfCBudWxsLCBjb25maWc6IFRyYW5zaXRpb25PcHRpb25zICkge1xyXG4gICAgY29uc3QgZGVmYXVsdHMgPSB7XHJcbiAgICAgIGZyb21UYXJnZXRzOiByZXF1aXJlZCggY29uZmlnLmZyb21UYXJnZXRzICksXHJcbiAgICAgIHRvVGFyZ2V0czogcmVxdWlyZWQoIGNvbmZpZy50b1RhcmdldHMgKSxcclxuICAgICAgcmVzZXROb2RlOiByZXF1aXJlZCggY29uZmlnLnJlc2V0Tm9kZSApLFxyXG5cclxuICAgICAgLy8ge09iamVjdHxudWxsfSAob3B0aW9uYWwpIC0gUGFzc2VkIGFzIGFkZGl0aW9uYWwgb2JqZWN0cyB0byBldmVyeSB0YXJnZXRcclxuICAgICAgdGFyZ2V0T3B0aW9uczogbnVsbFxyXG4gICAgfTtcclxuICAgIGNvbmZpZyA9IG1lcmdlKCB7fSwgZGVmYXVsdHMsIGNvbmZpZyApO1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHR5cGVvZiBjb25maWcucmVzZXROb2RlID09PSAnZnVuY3Rpb24nICk7XHJcblxyXG4gICAgY29uc3QgdGFyZ2V0T3B0aW9ucyA9IG1lcmdlKCB7XHJcbiAgICAgIC8vIE5PVEU6IG5vIGRlZmF1bHRzLCBidXQgd2Ugd2FudCBpdCB0byBiZSBhbiBvYmplY3Qgc28gd2UgbWVyZ2UgYW55d2F5c1xyXG4gICAgfSwgY29uZmlnLnRhcmdldE9wdGlvbnMgKTtcclxuXHJcbiAgICBsZXQgdGFyZ2V0czogQW5pbWF0aW9uVGFyZ2V0T3B0aW9uczx1bmtub3duLCBOb2RlPltdID0gW107XHJcblxyXG4gICAgaWYgKCBmcm9tTm9kZSApIHtcclxuICAgICAgdGFyZ2V0cyA9IHRhcmdldHMuY29uY2F0KCBjb25maWcuZnJvbVRhcmdldHMubWFwKCB0YXJnZXQgPT4ge1xyXG4gICAgICAgIHJldHVybiBjb21iaW5lT3B0aW9uczxBbmltYXRpb25UYXJnZXRPcHRpb25zPHVua25vd24sIE5vZGU+PiggdGFyZ2V0LCB7XHJcbiAgICAgICAgICBvYmplY3Q6IGZyb21Ob2RlXHJcbiAgICAgICAgfSwgdGFyZ2V0T3B0aW9ucyApO1xyXG4gICAgICB9ICkgKTtcclxuICAgIH1cclxuICAgIGlmICggdG9Ob2RlICkge1xyXG4gICAgICB0YXJnZXRzID0gdGFyZ2V0cy5jb25jYXQoIGNvbmZpZy50b1RhcmdldHMubWFwKCB0YXJnZXQgPT4ge1xyXG4gICAgICAgIHJldHVybiBjb21iaW5lT3B0aW9uczxBbmltYXRpb25UYXJnZXRPcHRpb25zPHVua25vd24sIE5vZGU+PiggdGFyZ2V0LCB7XHJcbiAgICAgICAgICBvYmplY3Q6IHRvTm9kZVxyXG4gICAgICAgIH0sIHRhcmdldE9wdGlvbnMgKTtcclxuICAgICAgfSApICk7XHJcbiAgICB9XHJcblxyXG4gICAgc3VwZXIoIGNvbWJpbmVPcHRpb25zPEFuaW1hdGlvbk9wdGlvbnM8U2VsZlR5cGUsIFNlbGZPYmplY3RUeXBlLCBUYXJnZXRUeXBlcywgVGFyZ2V0T2JqZWN0VHlwZXM+Pigge1xyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gQmVjYXVzZSB3ZSBjYW4ndCB1bnJvbGwgdGhlIHR5cGVzIGluIHRoZSBtYXBzIGFib3ZlLlxyXG4gICAgICB0YXJnZXRzOiB0YXJnZXRzXHJcbiAgICB9LCBfLm9taXQoIGNvbmZpZywgXy5rZXlzKCBkZWZhdWx0cyApICkgKSApO1xyXG5cclxuICAgIC8vIFdoZW4gdGhpcyBhbmltYXRpb24gZW5kcywgcmVzZXQgdGhlIHZhbHVlcyBmb3IgYm90aCBub2Rlc1xyXG4gICAgdGhpcy5lbmRlZEVtaXR0ZXIuYWRkTGlzdGVuZXIoICgpID0+IHtcclxuICAgICAgZnJvbU5vZGUgJiYgY29uZmlnLnJlc2V0Tm9kZSggZnJvbU5vZGUgKTtcclxuICAgICAgdG9Ob2RlICYmIGNvbmZpZy5yZXNldE5vZGUoIHRvTm9kZSApO1xyXG4gICAgfSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhbiBhbmltYXRpb24gdGhhdCBzbGlkZXMgdGhlIGBmcm9tTm9kZWAgb3V0IHRvIHRoZSBsZWZ0IChhbmQgdGhlIGB0b05vZGVgIGluIGZyb20gdGhlIHJpZ2h0KS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBib3VuZHNcclxuICAgKiBAcGFyYW0gZnJvbU5vZGVcclxuICAgKiBAcGFyYW0gdG9Ob2RlXHJcbiAgICogQHBhcmFtIFtvcHRpb25zXSAtIFVzdWFsbHkgc3BlY2lmeSBkdXJhdGlvbiwgZWFzaW5nLCBvciBvdGhlciBBbmltYXRpb24gb3B0aW9ucy5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHNsaWRlTGVmdCggYm91bmRzOiBCb3VuZHMyLCBmcm9tTm9kZTogTm9kZSB8IG51bGwsIHRvTm9kZTogTm9kZSB8IG51bGwsIG9wdGlvbnM/OiBTbGlkZVRyYW5zaXRpb25PcHRpb25zICk6IFRyYW5zaXRpb24ge1xyXG4gICAgcmV0dXJuIFRyYW5zaXRpb24uY3JlYXRlU2xpZGUoIGZyb21Ob2RlLCB0b05vZGUsICd4JywgYm91bmRzLndpZHRoLCB0cnVlLCBvcHRpb25zICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGFuIGFuaW1hdGlvbiB0aGF0IHNsaWRlcyB0aGUgYGZyb21Ob2RlYCBvdXQgdG8gdGhlIHJpZ2h0IChhbmQgdGhlIGB0b05vZGVgIGluIGZyb20gdGhlIGxlZnQpLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGJvdW5kc1xyXG4gICAqIEBwYXJhbSBmcm9tTm9kZVxyXG4gICAqIEBwYXJhbSB0b05vZGVcclxuICAgKiBAcGFyYW0gW29wdGlvbnNdIC0gVXN1YWxseSBzcGVjaWZ5IGR1cmF0aW9uLCBlYXNpbmcsIG9yIG90aGVyIEFuaW1hdGlvbiBvcHRpb25zLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgc2xpZGVSaWdodCggYm91bmRzOiBCb3VuZHMyLCBmcm9tTm9kZTogTm9kZSB8IG51bGwsIHRvTm9kZTogTm9kZSB8IG51bGwsIG9wdGlvbnM/OiBTbGlkZVRyYW5zaXRpb25PcHRpb25zICk6IFRyYW5zaXRpb24ge1xyXG4gICAgcmV0dXJuIFRyYW5zaXRpb24uY3JlYXRlU2xpZGUoIGZyb21Ob2RlLCB0b05vZGUsICd4JywgYm91bmRzLndpZHRoLCBmYWxzZSwgb3B0aW9ucyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhbiBhbmltYXRpb24gdGhhdCBzbGlkZXMgdGhlIGBmcm9tTm9kZWAgb3V0IHRvIHRoZSB0b3AgKGFuZCB0aGUgYHRvTm9kZWAgaW4gZnJvbSB0aGUgYm90dG9tKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBib3VuZHNcclxuICAgKiBAcGFyYW0gZnJvbU5vZGVcclxuICAgKiBAcGFyYW0gdG9Ob2RlXHJcbiAgICogQHBhcmFtIFtvcHRpb25zXSAtIFVzdWFsbHkgc3BlY2lmeSBkdXJhdGlvbiwgZWFzaW5nLCBvciBvdGhlciBBbmltYXRpb24gb3B0aW9ucy5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHNsaWRlVXAoIGJvdW5kczogQm91bmRzMiwgZnJvbU5vZGU6IE5vZGUgfCBudWxsLCB0b05vZGU6IE5vZGUgfCBudWxsLCBvcHRpb25zPzogU2xpZGVUcmFuc2l0aW9uT3B0aW9ucyApOiBUcmFuc2l0aW9uIHtcclxuICAgIHJldHVybiBUcmFuc2l0aW9uLmNyZWF0ZVNsaWRlKCBmcm9tTm9kZSwgdG9Ob2RlLCAneScsIGJvdW5kcy5oZWlnaHQsIHRydWUsIG9wdGlvbnMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW4gYW5pbWF0aW9uIHRoYXQgc2xpZGVzIHRoZSBgZnJvbU5vZGVgIG91dCB0byB0aGUgYm90dG9tIChhbmQgdGhlIGB0b05vZGVgIGluIGZyb20gdGhlIHRvcCkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYm91bmRzXHJcbiAgICogQHBhcmFtIGZyb21Ob2RlXHJcbiAgICogQHBhcmFtIHRvTm9kZVxyXG4gICAqIEBwYXJhbSBbb3B0aW9uc10gLSBVc3VhbGx5IHNwZWNpZnkgZHVyYXRpb24sIGVhc2luZywgb3Igb3RoZXIgQW5pbWF0aW9uIG9wdGlvbnMuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBzbGlkZURvd24oIGJvdW5kczogQm91bmRzMiwgZnJvbU5vZGU6IE5vZGUgfCBudWxsLCB0b05vZGU6IE5vZGUgfCBudWxsLCBvcHRpb25zPzogU2xpZGVUcmFuc2l0aW9uT3B0aW9ucyApOiBUcmFuc2l0aW9uIHtcclxuICAgIHJldHVybiBUcmFuc2l0aW9uLmNyZWF0ZVNsaWRlKCBmcm9tTm9kZSwgdG9Ob2RlLCAneScsIGJvdW5kcy5oZWlnaHQsIGZhbHNlLCBvcHRpb25zICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgdHJhbnNpdGlvbiB0aGF0IHdpcGVzIGFjcm9zcyB0aGUgc2NyZWVuLCBtb3ZpbmcgdG8gdGhlIGxlZnQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYm91bmRzXHJcbiAgICogQHBhcmFtIGZyb21Ob2RlXHJcbiAgICogQHBhcmFtIHRvTm9kZVxyXG4gICAqIEBwYXJhbSBbb3B0aW9uc10gLSBVc3VhbGx5IHNwZWNpZnkgZHVyYXRpb24sIGVhc2luZywgb3Igb3RoZXIgQW5pbWF0aW9uIG9wdGlvbnMuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyB3aXBlTGVmdCggYm91bmRzOiBCb3VuZHMyLCBmcm9tTm9kZTogTm9kZSB8IG51bGwsIHRvTm9kZTogTm9kZSB8IG51bGwsIG9wdGlvbnM/OiBXaXBlVHJhbnNpdGlvbk9wdGlvbnMgKTogVHJhbnNpdGlvbiB7XHJcbiAgICByZXR1cm4gVHJhbnNpdGlvbi5jcmVhdGVXaXBlKCBib3VuZHMsIGZyb21Ob2RlLCB0b05vZGUsICdtYXhYJywgJ21pblgnLCBvcHRpb25zICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgdHJhbnNpdGlvbiB0aGF0IHdpcGVzIGFjcm9zcyB0aGUgc2NyZWVuLCBtb3ZpbmcgdG8gdGhlIHJpZ2h0LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGJvdW5kc1xyXG4gICAqIEBwYXJhbSBmcm9tTm9kZVxyXG4gICAqIEBwYXJhbSB0b05vZGVcclxuICAgKiBAcGFyYW0gW29wdGlvbnNdIC0gVXN1YWxseSBzcGVjaWZ5IGR1cmF0aW9uLCBlYXNpbmcsIG9yIG90aGVyIEFuaW1hdGlvbiBvcHRpb25zLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgd2lwZVJpZ2h0KCBib3VuZHM6IEJvdW5kczIsIGZyb21Ob2RlOiBOb2RlIHwgbnVsbCwgdG9Ob2RlOiBOb2RlIHwgbnVsbCwgb3B0aW9ucz86IFdpcGVUcmFuc2l0aW9uT3B0aW9ucyApOiBUcmFuc2l0aW9uIHtcclxuICAgIHJldHVybiBUcmFuc2l0aW9uLmNyZWF0ZVdpcGUoIGJvdW5kcywgZnJvbU5vZGUsIHRvTm9kZSwgJ21pblgnLCAnbWF4WCcsIG9wdGlvbnMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSB0cmFuc2l0aW9uIHRoYXQgd2lwZXMgYWNyb3NzIHRoZSBzY3JlZW4sIG1vdmluZyB1cC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBib3VuZHNcclxuICAgKiBAcGFyYW0gZnJvbU5vZGVcclxuICAgKiBAcGFyYW0gdG9Ob2RlXHJcbiAgICogQHBhcmFtIFtvcHRpb25zXSAtIFVzdWFsbHkgc3BlY2lmeSBkdXJhdGlvbiwgZWFzaW5nLCBvciBvdGhlciBBbmltYXRpb24gb3B0aW9ucy5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHdpcGVVcCggYm91bmRzOiBCb3VuZHMyLCBmcm9tTm9kZTogTm9kZSB8IG51bGwsIHRvTm9kZTogTm9kZSB8IG51bGwsIG9wdGlvbnM/OiBXaXBlVHJhbnNpdGlvbk9wdGlvbnMgKTogVHJhbnNpdGlvbiB7XHJcbiAgICByZXR1cm4gVHJhbnNpdGlvbi5jcmVhdGVXaXBlKCBib3VuZHMsIGZyb21Ob2RlLCB0b05vZGUsICdtYXhZJywgJ21pblknLCBvcHRpb25zICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgdHJhbnNpdGlvbiB0aGF0IHdpcGVzIGFjcm9zcyB0aGUgc2NyZWVuLCBtb3ZpbmcgZG93bi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBib3VuZHNcclxuICAgKiBAcGFyYW0gZnJvbU5vZGVcclxuICAgKiBAcGFyYW0gdG9Ob2RlXHJcbiAgICogQHBhcmFtIFtvcHRpb25zXSAtIFVzdWFsbHkgc3BlY2lmeSBkdXJhdGlvbiwgZWFzaW5nLCBvciBvdGhlciBBbmltYXRpb24gb3B0aW9ucy5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIHdpcGVEb3duKCBib3VuZHM6IEJvdW5kczIsIGZyb21Ob2RlOiBOb2RlIHwgbnVsbCwgdG9Ob2RlOiBOb2RlIHwgbnVsbCwgb3B0aW9ucz86IFdpcGVUcmFuc2l0aW9uT3B0aW9ucyApOiBUcmFuc2l0aW9uIHtcclxuICAgIHJldHVybiBUcmFuc2l0aW9uLmNyZWF0ZVdpcGUoIGJvdW5kcywgZnJvbU5vZGUsIHRvTm9kZSwgJ21pblknLCAnbWF4WScsIG9wdGlvbnMgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSB0cmFuc2l0aW9uIHRoYXQgZmFkZXMgZnJvbSBgZnJvbU5vZGVgIHRvIGB0b05vZGVgIGJ5IHZhcnlpbmcgdGhlIG9wYWNpdHkgb2YgYm90aC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBmcm9tTm9kZVxyXG4gICAqIEBwYXJhbSB0b05vZGVcclxuICAgKiBAcGFyYW0gW3Byb3ZpZGVkT3B0aW9uc10gLSBVc3VhbGx5IHNwZWNpZnkgZHVyYXRpb24sIGVhc2luZywgb3Igb3RoZXIgQW5pbWF0aW9uIG9wdGlvbnMuXHJcbiAgICovXHJcbiAgcHVibGljIHN0YXRpYyBkaXNzb2x2ZSggZnJvbU5vZGU6IE5vZGUgfCBudWxsLCB0b05vZGU6IE5vZGUgfCBudWxsLCBwcm92aWRlZE9wdGlvbnM/OiBEaXNzb2x2ZVRyYW5zaXRpb25PcHRpb25zICk6IFRyYW5zaXRpb24ge1xyXG5cclxuICAgIGNvbnN0IGdhbW1hQmxlbmQgPSAoIGE6IG51bWJlciwgYjogbnVtYmVyLCByYXRpbzogbnVtYmVyICk6IG51bWJlciA9PiB7XHJcbiAgICAgIHJldHVybiBNYXRoLnBvdyggKCAxIC0gcmF0aW8gKSAqIGEgKyByYXRpbyAqIGIsIG9wdGlvbnMuZ2FtbWEgKTtcclxuICAgIH07XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxEaXNzb2x2ZVRyYW5zaXRpb25PcHRpb25zLCBEaXNzb2x2ZVRyYW5zaXRpb25TZWxmT3B0aW9ucywgVHJhbnNpdGlvbk9wdGlvbnM8dW5rbm93biwgdW5rbm93biwgW251bWJlcl0sIFtOb2RlXT4+KCkoIHtcclxuICAgICAgLy8gSGFuZGxlcyBnYW1tYSBjb3JyZWN0aW9uIGZvciB0aGUgb3BhY2l0eSB3aGVuIHJlcXVpcmVkXHJcbiAgICAgIGdhbW1hOiAxLFxyXG5cclxuICAgICAgZnJvbVRhcmdldHM6IFsge1xyXG4gICAgICAgIGF0dHJpYnV0ZTogJ29wYWNpdHknLFxyXG4gICAgICAgIGZyb206IDEsXHJcbiAgICAgICAgdG86IDAsXHJcbiAgICAgICAgYmxlbmQ6IGdhbW1hQmxlbmRcclxuICAgICAgfSBdLFxyXG4gICAgICB0b1RhcmdldHM6IFsge1xyXG4gICAgICAgIGF0dHJpYnV0ZTogJ29wYWNpdHknLFxyXG4gICAgICAgIGZyb206IDAsXHJcbiAgICAgICAgdG86IDEsXHJcbiAgICAgICAgYmxlbmQ6IGdhbW1hQmxlbmRcclxuICAgICAgfSBdLFxyXG4gICAgICByZXNldE5vZGU6ICggbm9kZTogTm9kZSApID0+IHtcclxuICAgICAgICBub2RlLm9wYWNpdHkgPSAxO1xyXG4gICAgICB9XHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIFdIWT9cclxuICAgIHJldHVybiBuZXcgVHJhbnNpdGlvbiggZnJvbU5vZGUsIHRvTm9kZSwgb3B0aW9ucyApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIHNsaWRpbmcgdHJhbnNpdGlvbiB3aXRoaW4gdGhlIGJvdW5kcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBmcm9tTm9kZVxyXG4gICAqIEBwYXJhbSB0b05vZGVcclxuICAgKiBAcGFyYW0gYXR0cmlidXRlIC0gVGhlIHBvc2l0aW9uYWwgYXR0cmlidXRlIHRvIGFuaW1hdGVcclxuICAgKiBAcGFyYW0gc2l6ZSAtIFRoZSBzaXplIG9mIHRoZSBhbmltYXRpb24gKGZvciB0aGUgcG9zaXRpb25hbCBhdHRyaWJ1dGUpXHJcbiAgICogQHBhcmFtIHJldmVyc2VkIC0gV2hldGhlciB0byByZXZlcnNlIHRoZSBhbmltYXRpb24uIEJ5IGRlZmF1bHQgaXQgZ29lcyByaWdodC9kb3duLlxyXG4gICAqIEBwYXJhbSBbb3B0aW9uc11cclxuICAgKi9cclxuICBwcml2YXRlIHN0YXRpYyBjcmVhdGVTbGlkZSggZnJvbU5vZGU6IE5vZGUgfCBudWxsLCB0b05vZGU6IE5vZGUgfCBudWxsLCBhdHRyaWJ1dGU6IEtleXNNYXRjaGluZzxOb2RlLCBudW1iZXI+ICYgV3JpdGFibGVLZXlzPE5vZGU+LCBzaXplOiBudW1iZXIsIHJldmVyc2VkOiBib29sZWFuLCBvcHRpb25zPzogUGFydGlhbFRyYW5zaXRpb25PcHRpb25zPG51bWJlcj4gKTogVHJhbnNpdGlvbiB7XHJcbiAgICBjb25zdCBzaWduID0gcmV2ZXJzZWQgPyAtMSA6IDE7XHJcbiAgICByZXR1cm4gbmV3IFRyYW5zaXRpb24oIGZyb21Ob2RlLCB0b05vZGUsIG9wdGlvbml6ZTxQYXJ0aWFsVHJhbnNpdGlvbk9wdGlvbnM8bnVtYmVyPiwgRW1wdHlTZWxmT3B0aW9ucywgVHJhbnNpdGlvbk9wdGlvbnM+KCkoIHtcclxuICAgICAgZnJvbVRhcmdldHM6IFsge1xyXG4gICAgICAgIGF0dHJpYnV0ZTogYXR0cmlidXRlLFxyXG4gICAgICAgIGZyb206IDAsXHJcbiAgICAgICAgdG86IHNpemUgKiBzaWduXHJcbiAgICAgIH0gXSxcclxuICAgICAgdG9UYXJnZXRzOiBbIHtcclxuICAgICAgICBhdHRyaWJ1dGU6IGF0dHJpYnV0ZSxcclxuICAgICAgICBmcm9tOiAtc2l6ZSAqIHNpZ24sXHJcbiAgICAgICAgdG86IDBcclxuICAgICAgfSBdLFxyXG4gICAgICByZXNldE5vZGU6ICggbm9kZTogTm9kZSApID0+IHtcclxuICAgICAgICBub2RlWyBhdHRyaWJ1dGUgXSA9IDA7XHJcbiAgICAgIH1cclxuICAgIH0sIG9wdGlvbnMgKSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIHdpcGluZyB0cmFuc2l0aW9uIHdpdGhpbiB0aGUgYm91bmRzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGJvdW5kc1xyXG4gICAqIEBwYXJhbSBmcm9tTm9kZVxyXG4gICAqIEBwYXJhbSB0b05vZGVcclxuICAgKiBAcGFyYW0gbWluQXR0cmlidXRlIC0gT25lIHNpZGUgb2YgdGhlIGJvdW5kcyBvbiB0aGUgbWluaW1hbCBzaWRlICh3aGVyZSB0aGUgYW5pbWF0aW9uIHN0YXJ0cylcclxuICAgKiBAcGFyYW0gbWF4QXR0cmlidXRlIC0gVGhlIG90aGVyIHNpZGUgb2YgdGhlIGJvdW5kcyAod2hlcmUgYW5pbWF0aW9uIGVuZHMpXHJcbiAgICogQHBhcmFtIFtvcHRpb25zXVxyXG4gICAqL1xyXG4gIHByaXZhdGUgc3RhdGljIGNyZWF0ZVdpcGUoIGJvdW5kczogQm91bmRzMiwgZnJvbU5vZGU6IE5vZGUgfCBudWxsLCB0b05vZGU6IE5vZGUgfCBudWxsLCBtaW5BdHRyaWJ1dGU6ICdtaW5YJyB8ICdtaW5ZJyB8ICdtYXhYJyB8ICdtYXhZJywgbWF4QXR0cmlidXRlOiAnbWluWCcgfCAnbWluWScgfCAnbWF4WCcgfCAnbWF4WScsIG9wdGlvbnM/OiBQYXJ0aWFsVHJhbnNpdGlvbk9wdGlvbnM8U2hhcGU+ICk6IFRyYW5zaXRpb24ge1xyXG4gICAgY29uc3QgZnJvbU5vZGVCb3VuZHMgPSBib3VuZHMuY29weSgpO1xyXG4gICAgY29uc3QgdG9Ob2RlQm91bmRzID0gYm91bmRzLmNvcHkoKTtcclxuXHJcbiAgICBmcm9tTm9kZUJvdW5kc1sgbWluQXR0cmlidXRlIF0gPSBib3VuZHNbIG1heEF0dHJpYnV0ZSBdO1xyXG4gICAgdG9Ob2RlQm91bmRzWyBtYXhBdHRyaWJ1dGUgXSA9IGJvdW5kc1sgbWluQXR0cmlidXRlIF07XHJcblxyXG4gICAgLy8gV2UgbmVlZCB0byBhcHBseSBjdXN0b20gY2xpcCBhcmVhIGludGVycG9sYXRpb25cclxuICAgIGNvbnN0IGNsaXBCbGVuZCA9ICggYm91bmRzQTogQm91bmRzMiwgYm91bmRzQjogQm91bmRzMiwgcmF0aW86IG51bWJlciApID0+IHtcclxuICAgICAgcmV0dXJuIFNoYXBlLmJvdW5kcyggYm91bmRzQS5ibGVuZCggYm91bmRzQiwgcmF0aW8gKSApO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gbmV3IFRyYW5zaXRpb24oIGZyb21Ob2RlLCB0b05vZGUsIG9wdGlvbml6ZTxQYXJ0aWFsVHJhbnNpdGlvbk9wdGlvbnM8U2hhcGU+LCBFbXB0eVNlbGZPcHRpb25zLCBUcmFuc2l0aW9uT3B0aW9ucz4oKSgge1xyXG4gICAgICBmcm9tVGFyZ2V0czogWyB7XHJcbiAgICAgICAgYXR0cmlidXRlOiAnY2xpcEFyZWEnLFxyXG4gICAgICAgIGZyb206IGJvdW5kcyxcclxuICAgICAgICB0bzogZnJvbU5vZGVCb3VuZHMsXHJcbiAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBFRUVFSyAtIHdlJ3JlIHJlbHlpbmcgb24gYmxlbmQgdG8gY29udmVydCBhIGJvdW5kcyB0byBhIHNoYXBlLi4uP1xyXG4gICAgICAgIGJsZW5kOiBjbGlwQmxlbmRcclxuICAgICAgfSBdLFxyXG4gICAgICB0b1RhcmdldHM6IFsge1xyXG4gICAgICAgIGF0dHJpYnV0ZTogJ2NsaXBBcmVhJyxcclxuICAgICAgICBmcm9tOiB0b05vZGVCb3VuZHMsXHJcbiAgICAgICAgdG86IGJvdW5kcyxcclxuICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIEVFRUVLIC0gd2UncmUgcmVseWluZyBvbiBibGVuZCB0byBjb252ZXJ0IGEgYm91bmRzIHRvIGEgc2hhcGUuLi4/XHJcbiAgICAgICAgYmxlbmQ6IGNsaXBCbGVuZFxyXG4gICAgICB9IF0sXHJcbiAgICAgIHJlc2V0Tm9kZTogZnVuY3Rpb24oIG5vZGUgKSB7XHJcbiAgICAgICAgbm9kZS5jbGlwQXJlYSA9IG51bGw7XHJcbiAgICAgIH1cclxuICAgIH0sIG9wdGlvbnMgKSApO1xyXG4gIH1cclxufVxyXG5cclxudHdpeHQucmVnaXN0ZXIoICdUcmFuc2l0aW9uJywgVHJhbnNpdGlvbiApO1xyXG5leHBvcnQgZGVmYXVsdCBUcmFuc2l0aW9uOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxTQUFTQSxLQUFLLFFBQVEsMEJBQTBCO0FBRWhELE9BQU9DLEtBQUssTUFBTSw2QkFBNkI7QUFDL0MsT0FBT0MsUUFBUSxNQUFNLGdDQUFnQztBQUNyRCxPQUFPQyxTQUFTLE1BQTRCLGdCQUFnQjtBQUM1RCxPQUFPQyxLQUFLLE1BQU0sWUFBWTtBQUU5QixPQUFPQyxTQUFTLElBQUlDLGNBQWMsUUFBMEIsaUNBQWlDO0FBNkI3RixNQUFNQyxVQUFVLFNBQW1MSixTQUFTLENBQTJEO0VBRXJRO0FBQ0Y7QUFDQTtBQUNBO0VBQ1NLLFdBQVdBLENBQUVDLFFBQXFCLEVBQUVDLE1BQW1CLEVBQUVDLE1BQXlCLEVBQUc7SUFDMUYsTUFBTUMsUUFBUSxHQUFHO01BQ2ZDLFdBQVcsRUFBRVgs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