// Copyright 2013-2023, University of Colorado Boulder

/**
 * The main 'scenery' namespace object for the exported (built) API. Used internally in some places where there are
 * potential circular dependencies.
 *
 * The returned scenery object namespace may be incomplete if not all modules are listed as
 * dependencies. Please use the 'main' module for that purpose if all of Scenery is desired.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 *
 * TODO: When converting to TypeScript, please see ts-expect-error in SimDisplay https://github.com/phetsims/scenery/issues/1581
 */

import extend from '../../phet-core/js/extend.js';
import Namespace from '../../phet-core/js/Namespace.js';

// @public (scenery-internal)
window.sceneryLog = null;
const scratchCanvas = document.createElement('canvas');
const scratchContext = scratchCanvas.getContext('2d');
let logPadding = '';
const scenery = new Namespace('scenery');

// @public - A Canvas and 2D Canvas context used for convenience functions (think of it as having arbitrary state).
scenery.register('scratchCanvas', scratchCanvas);
scenery.register('scratchContext', scratchContext);

/*---------------------------------------------------------------------------*
 * Logging
 * TODO: Move this out of scenery.js if possible https://github.com/phetsims/scenery/issues/1581
 *---------------------------------------------------------------------------*/

// @private - Scenery internal log function to be used to log to scenery.logString (does not include color/css)
function stringLogFunction(message) {
  scenery.logString += `${message.replace(/%c/g, '')}\n`;
}

// @private - Scenery internal log function to be used to log to the console.
function consoleLogFunction(...args) {
  // allow for the console to not exist
  window.console && window.console.log && window.console.log(...Array.prototype.slice.call(args, 0));
}

// @private - List of Scenery's loggers, with their display name and (if using console) the display style.
const logProperties = {
  dirty: {
    name: 'dirty',
    style: 'color: #888;'
  },
  bounds: {
    name: 'bounds',
    style: 'color: #888;'
  },
  hitTest: {
    name: 'hitTest',
    style: 'color: #888;'
  },
  hitTestInternal: {
    name: 'hitTestInternal',
    style: 'color: #888;'
  },
  PerfCritical: {
    name: 'Perf',
    style: 'color: #f00;'
  },
  PerfMajor: {
    name: 'Perf',
    style: 'color: #aa0;'
  },
  PerfMinor: {
    name: 'Perf',
    style: 'color: #088;'
  },
  PerfVerbose: {
    name: 'Perf',
    style: 'color: #888;'
  },
  Cursor: {
    name: 'Cursor',
    style: ''
  },
  Stitch: {
    name: 'Stitch',
    style: ''
  },
  StitchDrawables: {
    name: 'Stitch',
    style: ''
  },
  GreedyStitcher: {
    name: 'Greedy',
    style: 'color: #088;'
  },
  GreedyVerbose: {
    name: 'Greedy',
    style: 'color: #888;'
  },
  RelativeTransform: {
    name: 'RelativeTransform',
    style: 'color: #606;'
  },
  BackboneDrawable: {
    name: 'Backbone',
    style: 'color: #a00;'
  },
  CanvasBlock: {
    name: 'Canvas',
    style: ''
  },
  WebGLBlock: {
    name: 'WebGL',
    style: ''
  },
  Display: {
    name: 'Display',
    style: ''
  },
  DOMBlock: {
    name: 'DOM',
    style: ''
  },
  Drawable: {
    name: '',
    style: ''
  },
  FittedBlock: {
    name: 'FittedBlock',
    style: ''
  },
  Instance: {
    name: 'Instance',
    style: ''
  },
  InstanceTree: {
    name: 'InstanceTree',
    style: ''
  },
  ChangeInterval: {
    name: 'ChangeInterval',
    style: 'color: #0a0;'
  },
  SVGBlock: {
    name: 'SVG',
    style: ''
  },
  SVGGroup: {
    name: 'SVGGroup',
    style: ''
  },
  ImageSVGDrawable: {
    name: 'ImageSVGDrawable',
    style: ''
  },
  Paints: {
    name: 'Paints',
    style: ''
  },
  Filters: {
    name: 'Filters',
    style: ''
  },
  AlignBox: {
    name: 'AlignBox',
    style: ''
  },
  AlignGroup: {
    name: 'AlignGroup',
    style: ''
  },
  RichText: {
    name: 'RichText',
    style: ''
  },
  Sim: {
    name: 'Sim',
    style: ''
  },
  // Accessibility-related
  ParallelDOM: {
    name: 'ParallelDOM',
    style: ''
  },
  PDOMInstance: {
    name: 'PDOMInstance',
    style: ''
  },
  PDOMTree: {
    name: 'PDOMTree',
    style: ''
  },
  PDOMDisplaysInfo: {
    name: 'PDOMDisplaysInfo',
    style: ''
  },
  KeyboardFuzzer: {
    name: 'KeyboardFuzzer',
    style: ''
  },
  // Input-related
  InputListener: {
    name: 'InputListener',
    style: ''
  },
  InputEvent: {
    name: 'InputEvent',
    style: ''
  },
  OnInput: {
    name: 'OnInput',
    style: ''
  },
  Pointer: {
    name: 'Pointer',
    style: ''
  },
  Input: {
    name: 'Input',
    style: ''
  },
  // When "logical" input functions are called, and related tasks
  EventDispatch: {
    name: 'EventDispatch',
    style: ''
  },
  // When an event is dispatched, and when listeners are triggered
  EventPath: {
    name: 'EventPath',
    style: ''
  } // User-readable form for whenever an event is dispatched
};

// will be filled in by other modules
extend(scenery, {
  // @public - Scenery log string (accumulated if switchLogToString() is used).
  logString: '',
  // @private - Scenery internal log function (switchable implementation, the main reference)
  logFunction: function (...args) {
    // allow for the console to not exist
    window.console && window.console.log && window.console.log(...Array.prototype.slice.call(args, 0));
  },
  // @public - Switches Scenery's logging to print to the developer console.
  switchLogToConsole: function () {
    scenery.logFunction = consoleLogFunction;
  },
  // @public - Switches Scenery's logging to append to scenery.logString
  switchLogToString: function () {
    window.console && window.console.log('switching to string log');
    scenery.logFunction = stringLogFunction;
  },
  // @public - Enables a specific single logger, OR a composite logger ('stitch'/'perf')
  enableIndividualLog: function (name) {
    if (name === 'stitch') {
      this.enableIndividualLog('Stitch');
      this.enableIndividualLog('StitchDrawables');
      this.enableIndividualLog('GreedyStitcher');
      this.enableIndividualLog('GreedyVerbose');
      return;
    }
    if (name === 'perf') {
      this.enableIndividualLog('PerfCritical');
      this.enableIndividualLog('PerfMajor');
      this.enableIndividualLog('PerfMinor');
      this.enableIndividualLog('PerfVerbose');
      return;
    }
    if (name === 'input') {
      this.enableIndividualLog('InputListener');
      this.enableIndividualLog('InputEvent');
      this.enableIndividualLog('OnInput');
      this.enableIndividualLog('Pointer');
      this.enableIndividualLog('Input');
      this.enableIndividualLog('EventDispatch');
      this.enableIndividualLog('EventPath');
      return;
    }
    if (name === 'a11y' || name === 'pdom') {
      this.enableIndividualLog('ParallelDOM');
      this.enableIndividualLog('PDOMInstance');
      this.enableIndividualLog('PDOMTree');
      this.enableIndividualLog('PDOMDisplaysInfo');
      return;
    }
    if (name) {
      assert && assert(logProperties[name], `Unknown logger: ${name}, please use periods (.) to separate different log names`);
      window.sceneryLog[name] = window.sceneryLog[name] || function (ob, styleOverride) {
        const data = logProperties[name];
        const prefix = data.name ? `[${data.name}] ` : '';
        const padStyle = 'color: #ddd;';
        scenery.logFunction(`%c${logPadding}%c${prefix}${ob}`, padStyle, styleOverride ? styleOverride : data.style);
      };
    }
  },
  // @public - Disables a specific log. TODO: handle stitch and perf composite loggers https://github.com/phetsims/scenery/issues/1581
  disableIndividualLog: function (name) {
    if (name) {
      delete window.sceneryLog[name];
    }
  },
  /**
   * Enables multiple loggers.
   * @public
   *
   * @param {Array.<string>} logNames - keys from logProperties
   */
  enableLogging: function (logNames) {
    window.sceneryLog = function (ob) {
      scenery.logFunction(ob);
    };
    window.sceneryLog.push = function () {
      logPadding += '| ';
    };
    window.sceneryLog.pop = function () {
      logPadding = logPadding.slice(0, -2);
    };
    window.sceneryLog.getDepth = function () {
      return logPadding.length / 2;
    };
    for (let i = 0; i < logNames.length; i++) {
      this.enableIndividualLog(logNames[i]);
    }
  },
  // @public - Disables Scenery logging
  disableLogging: function () {
    window.sceneryLog = null;
  },
  // @public (scenery-internal) - Whether performance logging is active (may actually reduce performance)
  isLoggingPerformance: function () {
    return window.sceneryLog.PerfCritical || window.sceneryLog.PerfMajor || window.sceneryLog.PerfMinor || window.sceneryLog.PerfVerbose;
  }
});
export default scenery;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleHRlbmQiLCJOYW1lc3BhY2UiLCJ3aW5kb3ciLCJzY2VuZXJ5TG9nIiwic2NyYXRjaENhbnZhcyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsInNjcmF0Y2hDb250ZXh0IiwiZ2V0Q29udGV4dCIsImxvZ1BhZGRpbmciLCJzY2VuZXJ5IiwicmVnaXN0ZXIiLCJzdHJpbmdMb2dGdW5jdGlvbiIsIm1lc3NhZ2UiLCJsb2dTdHJpbmciLCJyZXBsYWNlIiwiY29uc29sZUxvZ0Z1bmN0aW9uIiwiYXJncyIsImNvbnNvbGUiLCJsb2ciLCJBcnJheSIsInByb3RvdHlwZSIsInNsaWNlIiwiY2FsbCIsImxvZ1Byb3BlcnRpZXMiLCJkaXJ0eSIsIm5hbWUiLCJzdHlsZSIsImJvdW5kcyIsImhpdFRlc3QiLCJoaXRUZXN0SW50ZXJuYWwiLCJQZXJmQ3JpdGljYWwiLCJQZXJmTWFqb3IiLCJQZXJmTWlub3IiLCJQZXJmVmVyYm9zZSIsIkN1cnNvciIsIlN0aXRjaCIsIlN0aXRjaERyYXdhYmxlcyIsIkdyZWVkeVN0aXRjaGVyIiwiR3JlZWR5VmVyYm9zZSIsIlJlbGF0aXZlVHJhbnNmb3JtIiwiQmFja2JvbmVEcmF3YWJsZSIsIkNhbnZhc0Jsb2NrIiwiV2ViR0xCbG9jayIsIkRpc3BsYXkiLCJET01CbG9jayIsIkRyYXdhYmxlIiwiRml0dGVkQmxvY2siLCJJbnN0YW5jZSIsIkluc3RhbmNlVHJlZSIsIkNoYW5nZUludGVydmFsIiwiU1ZHQmxvY2siLCJTVkdHcm91cCIsIkltYWdlU1ZHRHJhd2FibGUiLCJQYWludHMiLCJGaWx0ZXJzIiwiQWxpZ25Cb3giLCJBbGlnbkdyb3VwIiwiUmljaFRleHQiLCJTaW0iLCJQYXJhbGxlbERPTSIsIlBET01JbnN0YW5jZSIsIlBET01UcmVlIiwiUERPTURpc3BsYXlzSW5mbyIsIktleWJvYXJkRnV6emVyIiwiSW5wdXRMaXN0ZW5lciIsIklucHV0RXZlbnQiLCJPbklucHV0IiwiUG9pbnRlciIsIklucHV0IiwiRXZlbnREaXNwYXRjaCIsIkV2ZW50UGF0aCIsImxvZ0Z1bmN0aW9uIiwic3dpdGNoTG9nVG9Db25zb2xlIiwic3dpdGNoTG9nVG9TdHJpbmciLCJlbmFibGVJbmRpdmlkdWFsTG9nIiwiYXNzZXJ0Iiwib2IiLCJzdHlsZU92ZXJyaWRlIiwiZGF0YSIsInByZWZpeCIsInBhZFN0eWxlIiwiZGlzYWJsZUluZGl2aWR1YWxMb2ciLCJlbmFibGVMb2dnaW5nIiwibG9nTmFtZXMiLCJwdXNoIiwicG9wIiwiZ2V0RGVwdGgiLCJsZW5ndGgiLCJpIiwiZGlzYWJsZUxvZ2dpbmciLCJpc0xvZ2dpbmdQZXJmb3JtYW5jZSJdLCJzb3VyY2VzIjpbInNjZW5lcnkuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTMtMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogVGhlIG1haW4gJ3NjZW5lcnknIG5hbWVzcGFjZSBvYmplY3QgZm9yIHRoZSBleHBvcnRlZCAoYnVpbHQpIEFQSS4gVXNlZCBpbnRlcm5hbGx5IGluIHNvbWUgcGxhY2VzIHdoZXJlIHRoZXJlIGFyZVxyXG4gKiBwb3RlbnRpYWwgY2lyY3VsYXIgZGVwZW5kZW5jaWVzLlxyXG4gKlxyXG4gKiBUaGUgcmV0dXJuZWQgc2NlbmVyeSBvYmplY3QgbmFtZXNwYWNlIG1heSBiZSBpbmNvbXBsZXRlIGlmIG5vdCBhbGwgbW9kdWxlcyBhcmUgbGlzdGVkIGFzXHJcbiAqIGRlcGVuZGVuY2llcy4gUGxlYXNlIHVzZSB0aGUgJ21haW4nIG1vZHVsZSBmb3IgdGhhdCBwdXJwb3NlIGlmIGFsbCBvZiBTY2VuZXJ5IGlzIGRlc2lyZWQuXHJcbiAqXHJcbiAqIEBhdXRob3IgSm9uYXRoYW4gT2xzb24gPGpvbmF0aGFuLm9sc29uQGNvbG9yYWRvLmVkdT5cclxuICpcclxuICogVE9ETzogV2hlbiBjb252ZXJ0aW5nIHRvIFR5cGVTY3JpcHQsIHBsZWFzZSBzZWUgdHMtZXhwZWN0LWVycm9yIGluIFNpbURpc3BsYXkgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICovXHJcblxyXG5pbXBvcnQgZXh0ZW5kIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9leHRlbmQuanMnO1xyXG5pbXBvcnQgTmFtZXNwYWNlIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9OYW1lc3BhY2UuanMnO1xyXG5cclxuLy8gQHB1YmxpYyAoc2NlbmVyeS1pbnRlcm5hbClcclxud2luZG93LnNjZW5lcnlMb2cgPSBudWxsO1xyXG5cclxuY29uc3Qgc2NyYXRjaENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdjYW52YXMnICk7XHJcbmNvbnN0IHNjcmF0Y2hDb250ZXh0ID0gc2NyYXRjaENhbnZhcy5nZXRDb250ZXh0KCAnMmQnICk7XHJcblxyXG5sZXQgbG9nUGFkZGluZyA9ICcnO1xyXG5cclxuY29uc3Qgc2NlbmVyeSA9IG5ldyBOYW1lc3BhY2UoICdzY2VuZXJ5JyApO1xyXG5cclxuLy8gQHB1YmxpYyAtIEEgQ2FudmFzIGFuZCAyRCBDYW52YXMgY29udGV4dCB1c2VkIGZvciBjb252ZW5pZW5jZSBmdW5jdGlvbnMgKHRoaW5rIG9mIGl0IGFzIGhhdmluZyBhcmJpdHJhcnkgc3RhdGUpLlxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnc2NyYXRjaENhbnZhcycsIHNjcmF0Y2hDYW52YXMgKTtcclxuc2NlbmVyeS5yZWdpc3RlciggJ3NjcmF0Y2hDb250ZXh0Jywgc2NyYXRjaENvbnRleHQgKTtcclxuXHJcbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKlxyXG4gKiBMb2dnaW5nXHJcbiAqIFRPRE86IE1vdmUgdGhpcyBvdXQgb2Ygc2NlbmVyeS5qcyBpZiBwb3NzaWJsZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTU4MVxyXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG4vLyBAcHJpdmF0ZSAtIFNjZW5lcnkgaW50ZXJuYWwgbG9nIGZ1bmN0aW9uIHRvIGJlIHVzZWQgdG8gbG9nIHRvIHNjZW5lcnkubG9nU3RyaW5nIChkb2VzIG5vdCBpbmNsdWRlIGNvbG9yL2NzcylcclxuZnVuY3Rpb24gc3RyaW5nTG9nRnVuY3Rpb24oIG1lc3NhZ2UgKSB7XHJcbiAgc2NlbmVyeS5sb2dTdHJpbmcgKz0gYCR7bWVzc2FnZS5yZXBsYWNlKCAvJWMvZywgJycgKX1cXG5gO1xyXG59XHJcblxyXG4vLyBAcHJpdmF0ZSAtIFNjZW5lcnkgaW50ZXJuYWwgbG9nIGZ1bmN0aW9uIHRvIGJlIHVzZWQgdG8gbG9nIHRvIHRoZSBjb25zb2xlLlxyXG5mdW5jdGlvbiBjb25zb2xlTG9nRnVuY3Rpb24oIC4uLmFyZ3MgKSB7XHJcbiAgLy8gYWxsb3cgZm9yIHRoZSBjb25zb2xlIHRvIG5vdCBleGlzdFxyXG4gIHdpbmRvdy5jb25zb2xlICYmIHdpbmRvdy5jb25zb2xlLmxvZyAmJiB3aW5kb3cuY29uc29sZS5sb2coIC4uLkFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKCBhcmdzLCAwICkgKTtcclxufVxyXG5cclxuLy8gQHByaXZhdGUgLSBMaXN0IG9mIFNjZW5lcnkncyBsb2dnZXJzLCB3aXRoIHRoZWlyIGRpc3BsYXkgbmFtZSBhbmQgKGlmIHVzaW5nIGNvbnNvbGUpIHRoZSBkaXNwbGF5IHN0eWxlLlxyXG5jb25zdCBsb2dQcm9wZXJ0aWVzID0ge1xyXG4gIGRpcnR5OiB7IG5hbWU6ICdkaXJ0eScsIHN0eWxlOiAnY29sb3I6ICM4ODg7JyB9LFxyXG4gIGJvdW5kczogeyBuYW1lOiAnYm91bmRzJywgc3R5bGU6ICdjb2xvcjogIzg4ODsnIH0sXHJcbiAgaGl0VGVzdDogeyBuYW1lOiAnaGl0VGVzdCcsIHN0eWxlOiAnY29sb3I6ICM4ODg7JyB9LFxyXG4gIGhpdFRlc3RJbnRlcm5hbDogeyBuYW1lOiAnaGl0VGVzdEludGVybmFsJywgc3R5bGU6ICdjb2xvcjogIzg4ODsnIH0sXHJcbiAgUGVyZkNyaXRpY2FsOiB7IG5hbWU6ICdQZXJmJywgc3R5bGU6ICdjb2xvcjogI2YwMDsnIH0sXHJcbiAgUGVyZk1ham9yOiB7IG5hbWU6ICdQZXJmJywgc3R5bGU6ICdjb2xvcjogI2FhMDsnIH0sXHJcbiAgUGVyZk1pbm9yOiB7IG5hbWU6ICdQZXJmJywgc3R5bGU6ICdjb2xvcjogIzA4ODsnIH0sXHJcbiAgUGVyZlZlcmJvc2U6IHsgbmFtZTogJ1BlcmYnLCBzdHlsZTogJ2NvbG9yOiAjODg4OycgfSxcclxuICBDdXJzb3I6IHsgbmFtZTogJ0N1cnNvcicsIHN0eWxlOiAnJyB9LFxyXG4gIFN0aXRjaDogeyBuYW1lOiAnU3RpdGNoJywgc3R5bGU6ICcnIH0sXHJcbiAgU3RpdGNoRHJhd2FibGVzOiB7IG5hbWU6ICdTdGl0Y2gnLCBzdHlsZTogJycgfSxcclxuICBHcmVlZHlTdGl0Y2hlcjogeyBuYW1lOiAnR3JlZWR5Jywgc3R5bGU6ICdjb2xvcjogIzA4ODsnIH0sXHJcbiAgR3JlZWR5VmVyYm9zZTogeyBuYW1lOiAnR3JlZWR5Jywgc3R5bGU6ICdjb2xvcjogIzg4ODsnIH0sXHJcbiAgUmVsYXRpdmVUcmFuc2Zvcm06IHsgbmFtZTogJ1JlbGF0aXZlVHJhbnNmb3JtJywgc3R5bGU6ICdjb2xvcjogIzYwNjsnIH0sXHJcbiAgQmFja2JvbmVEcmF3YWJsZTogeyBuYW1lOiAnQmFja2JvbmUnLCBzdHlsZTogJ2NvbG9yOiAjYTAwOycgfSxcclxuICBDYW52YXNCbG9jazogeyBuYW1lOiAnQ2FudmFzJywgc3R5bGU6ICcnIH0sXHJcbiAgV2ViR0xCbG9jazogeyBuYW1lOiAnV2ViR0wnLCBzdHlsZTogJycgfSxcclxuICBEaXNwbGF5OiB7IG5hbWU6ICdEaXNwbGF5Jywgc3R5bGU6ICcnIH0sXHJcbiAgRE9NQmxvY2s6IHsgbmFtZTogJ0RPTScsIHN0eWxlOiAnJyB9LFxyXG4gIERyYXdhYmxlOiB7IG5hbWU6ICcnLCBzdHlsZTogJycgfSxcclxuICBGaXR0ZWRCbG9jazogeyBuYW1lOiAnRml0dGVkQmxvY2snLCBzdHlsZTogJycgfSxcclxuICBJbnN0YW5jZTogeyBuYW1lOiAnSW5zdGFuY2UnLCBzdHlsZTogJycgfSxcclxuICBJbnN0YW5jZVRyZWU6IHsgbmFtZTogJ0luc3RhbmNlVHJlZScsIHN0eWxlOiAnJyB9LFxyXG4gIENoYW5nZUludGVydmFsOiB7IG5hbWU6ICdDaGFuZ2VJbnRlcnZhbCcsIHN0eWxlOiAnY29sb3I6ICMwYTA7JyB9LFxyXG4gIFNWR0Jsb2NrOiB7IG5hbWU6ICdTVkcnLCBzdHlsZTogJycgfSxcclxuICBTVkdHcm91cDogeyBuYW1lOiAnU1ZHR3JvdXAnLCBzdHlsZTogJycgfSxcclxuICBJbWFnZVNWR0RyYXdhYmxlOiB7IG5hbWU6ICdJbWFnZVNWR0RyYXdhYmxlJywgc3R5bGU6ICcnIH0sXHJcbiAgUGFpbnRzOiB7IG5hbWU6ICdQYWludHMnLCBzdHlsZTogJycgfSxcclxuICBGaWx0ZXJzOiB7IG5hbWU6ICdGaWx0ZXJzJywgc3R5bGU6ICcnIH0sXHJcbiAgQWxpZ25Cb3g6IHsgbmFtZTogJ0FsaWduQm94Jywgc3R5bGU6ICcnIH0sXHJcbiAgQWxpZ25Hcm91cDogeyBuYW1lOiAnQWxpZ25Hcm91cCcsIHN0eWxlOiAnJyB9LFxyXG4gIFJpY2hUZXh0OiB7IG5hbWU6ICdSaWNoVGV4dCcsIHN0eWxlOiAnJyB9LFxyXG5cclxuICBTaW06IHsgbmFtZTogJ1NpbScsIHN0eWxlOiAnJyB9LFxyXG5cclxuICAvLyBBY2Nlc3NpYmlsaXR5LXJlbGF0ZWRcclxuICBQYXJhbGxlbERPTTogeyBuYW1lOiAnUGFyYWxsZWxET00nLCBzdHlsZTogJycgfSxcclxuICBQRE9NSW5zdGFuY2U6IHsgbmFtZTogJ1BET01JbnN0YW5jZScsIHN0eWxlOiAnJyB9LFxyXG4gIFBET01UcmVlOiB7IG5hbWU6ICdQRE9NVHJlZScsIHN0eWxlOiAnJyB9LFxyXG4gIFBET01EaXNwbGF5c0luZm86IHsgbmFtZTogJ1BET01EaXNwbGF5c0luZm8nLCBzdHlsZTogJycgfSxcclxuICBLZXlib2FyZEZ1enplcjogeyBuYW1lOiAnS2V5Ym9hcmRGdXp6ZXInLCBzdHlsZTogJycgfSxcclxuXHJcbiAgLy8gSW5wdXQtcmVsYXRlZFxyXG4gIElucHV0TGlzdGVuZXI6IHsgbmFtZTogJ0lucHV0TGlzdGVuZXInLCBzdHlsZTogJycgfSxcclxuICBJbnB1dEV2ZW50OiB7IG5hbWU6ICdJbnB1dEV2ZW50Jywgc3R5bGU6ICcnIH0sXHJcbiAgT25JbnB1dDogeyBuYW1lOiAnT25JbnB1dCcsIHN0eWxlOiAnJyB9LFxyXG4gIFBvaW50ZXI6IHsgbmFtZTogJ1BvaW50ZXInLCBzdHlsZTogJycgfSxcclxuICBJbnB1dDogeyBuYW1lOiAnSW5wdXQnLCBzdHlsZTogJycgfSwgLy8gV2hlbiBcImxvZ2ljYWxcIiBpbnB1dCBmdW5jdGlvbnMgYXJlIGNhbGxlZCwgYW5kIHJlbGF0ZWQgdGFza3NcclxuICBFdmVudERpc3BhdGNoOiB7IG5hbWU6ICdFdmVudERpc3BhdGNoJywgc3R5bGU6ICcnIH0sIC8vIFdoZW4gYW4gZXZlbnQgaXMgZGlzcGF0Y2hlZCwgYW5kIHdoZW4gbGlzdGVuZXJzIGFyZSB0cmlnZ2VyZWRcclxuICBFdmVudFBhdGg6IHsgbmFtZTogJ0V2ZW50UGF0aCcsIHN0eWxlOiAnJyB9IC8vIFVzZXItcmVhZGFibGUgZm9ybSBmb3Igd2hlbmV2ZXIgYW4gZXZlbnQgaXMgZGlzcGF0Y2hlZFxyXG59O1xyXG5cclxuLy8gd2lsbCBiZSBmaWxsZWQgaW4gYnkgb3RoZXIgbW9kdWxlc1xyXG5leHRlbmQoIHNjZW5lcnksIHtcclxuICAvLyBAcHVibGljIC0gU2NlbmVyeSBsb2cgc3RyaW5nIChhY2N1bXVsYXRlZCBpZiBzd2l0Y2hMb2dUb1N0cmluZygpIGlzIHVzZWQpLlxyXG4gIGxvZ1N0cmluZzogJycsXHJcblxyXG4gIC8vIEBwcml2YXRlIC0gU2NlbmVyeSBpbnRlcm5hbCBsb2cgZnVuY3Rpb24gKHN3aXRjaGFibGUgaW1wbGVtZW50YXRpb24sIHRoZSBtYWluIHJlZmVyZW5jZSlcclxuICBsb2dGdW5jdGlvbjogZnVuY3Rpb24oIC4uLmFyZ3MgKSB7XHJcbiAgICAvLyBhbGxvdyBmb3IgdGhlIGNvbnNvbGUgdG8gbm90IGV4aXN0XHJcbiAgICB3aW5kb3cuY29uc29sZSAmJiB3aW5kb3cuY29uc29sZS5sb2cgJiYgd2luZG93LmNvbnNvbGUubG9nKCAuLi5BcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCggYXJncywgMCApICk7XHJcbiAgfSxcclxuXHJcbiAgLy8gQHB1YmxpYyAtIFN3aXRjaGVzIFNjZW5lcnkncyBsb2dnaW5nIHRvIHByaW50IHRvIHRoZSBkZXZlbG9wZXIgY29uc29sZS5cclxuICBzd2l0Y2hMb2dUb0NvbnNvbGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgc2NlbmVyeS5sb2dGdW5jdGlvbiA9IGNvbnNvbGVMb2dGdW5jdGlvbjtcclxuICB9LFxyXG5cclxuICAvLyBAcHVibGljIC0gU3dpdGNoZXMgU2NlbmVyeSdzIGxvZ2dpbmcgdG8gYXBwZW5kIHRvIHNjZW5lcnkubG9nU3RyaW5nXHJcbiAgc3dpdGNoTG9nVG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xyXG4gICAgd2luZG93LmNvbnNvbGUgJiYgd2luZG93LmNvbnNvbGUubG9nKCAnc3dpdGNoaW5nIHRvIHN0cmluZyBsb2cnICk7XHJcbiAgICBzY2VuZXJ5LmxvZ0Z1bmN0aW9uID0gc3RyaW5nTG9nRnVuY3Rpb247XHJcbiAgfSxcclxuXHJcbiAgLy8gQHB1YmxpYyAtIEVuYWJsZXMgYSBzcGVjaWZpYyBzaW5nbGUgbG9nZ2VyLCBPUiBhIGNvbXBvc2l0ZSBsb2dnZXIgKCdzdGl0Y2gnLydwZXJmJylcclxuICBlbmFibGVJbmRpdmlkdWFsTG9nOiBmdW5jdGlvbiggbmFtZSApIHtcclxuICAgIGlmICggbmFtZSA9PT0gJ3N0aXRjaCcgKSB7XHJcbiAgICAgIHRoaXMuZW5hYmxlSW5kaXZpZHVhbExvZyggJ1N0aXRjaCcgKTtcclxuICAgICAgdGhpcy5lbmFibGVJbmRpdmlkdWFsTG9nKCAnU3RpdGNoRHJhd2FibGVzJyApO1xyXG4gICAgICB0aGlzLmVuYWJsZUluZGl2aWR1YWxMb2coICdHcmVlZHlTdGl0Y2hlcicgKTtcclxuICAgICAgdGhpcy5lbmFibGVJbmRpdmlkdWFsTG9nKCAnR3JlZWR5VmVyYm9zZScgKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggbmFtZSA9PT0gJ3BlcmYnICkge1xyXG4gICAgICB0aGlzLmVuYWJsZUluZGl2aWR1YWxMb2coICdQZXJmQ3JpdGljYWwnICk7XHJcbiAgICAgIHRoaXMuZW5hYmxlSW5kaXZpZHVhbExvZyggJ1BlcmZNYWpvcicgKTtcclxuICAgICAgdGhpcy5lbmFibGVJbmRpdmlkdWFsTG9nKCAnUGVyZk1pbm9yJyApO1xyXG4gICAgICB0aGlzLmVuYWJsZUluZGl2aWR1YWxMb2coICdQZXJmVmVyYm9zZScgKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggbmFtZSA9PT0gJ2lucHV0JyApIHtcclxuICAgICAgdGhpcy5lbmFibGVJbmRpdmlkdWFsTG9nKCAnSW5wdXRMaXN0ZW5lcicgKTtcclxuICAgICAgdGhpcy5lbmFibGVJbmRpdmlkdWFsTG9nKCAnSW5wdXRFdmVudCcgKTtcclxuICAgICAgdGhpcy5lbmFibGVJbmRpdmlkdWFsTG9nKCAnT25JbnB1dCcgKTtcclxuICAgICAgdGhpcy5lbmFibGVJbmRpdmlkdWFsTG9nKCAnUG9pbnRlcicgKTtcclxuICAgICAgdGhpcy5lbmFibGVJbmRpdmlkdWFsTG9nKCAnSW5wdXQnICk7XHJcbiAgICAgIHRoaXMuZW5hYmxlSW5kaXZpZHVhbExvZyggJ0V2ZW50RGlzcGF0Y2gnICk7XHJcbiAgICAgIHRoaXMuZW5hYmxlSW5kaXZpZHVhbExvZyggJ0V2ZW50UGF0aCcgKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKCBuYW1lID09PSAnYTExeScgfHwgbmFtZSA9PT0gJ3Bkb20nICkge1xyXG4gICAgICB0aGlzLmVuYWJsZUluZGl2aWR1YWxMb2coICdQYXJhbGxlbERPTScgKTtcclxuICAgICAgdGhpcy5lbmFibGVJbmRpdmlkdWFsTG9nKCAnUERPTUluc3RhbmNlJyApO1xyXG4gICAgICB0aGlzLmVuYWJsZUluZGl2aWR1YWxMb2coICdQRE9NVHJlZScgKTtcclxuICAgICAgdGhpcy5lbmFibGVJbmRpdmlkdWFsTG9nKCAnUERPTURpc3BsYXlzSW5mbycgKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggbmFtZSApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggbG9nUHJvcGVydGllc1sgbmFtZSBdLFxyXG4gICAgICAgIGBVbmtub3duIGxvZ2dlcjogJHtuYW1lfSwgcGxlYXNlIHVzZSBwZXJpb2RzICguKSB0byBzZXBhcmF0ZSBkaWZmZXJlbnQgbG9nIG5hbWVzYCApO1xyXG5cclxuICAgICAgd2luZG93LnNjZW5lcnlMb2dbIG5hbWUgXSA9IHdpbmRvdy5zY2VuZXJ5TG9nWyBuYW1lIF0gfHwgZnVuY3Rpb24oIG9iLCBzdHlsZU92ZXJyaWRlICkge1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSBsb2dQcm9wZXJ0aWVzWyBuYW1lIF07XHJcblxyXG4gICAgICAgIGNvbnN0IHByZWZpeCA9IGRhdGEubmFtZSA/IGBbJHtkYXRhLm5hbWV9XSBgIDogJyc7XHJcbiAgICAgICAgY29uc3QgcGFkU3R5bGUgPSAnY29sb3I6ICNkZGQ7JztcclxuICAgICAgICBzY2VuZXJ5LmxvZ0Z1bmN0aW9uKCBgJWMke2xvZ1BhZGRpbmd9JWMke3ByZWZpeH0ke29ifWAsIHBhZFN0eWxlLCBzdHlsZU92ZXJyaWRlID8gc3R5bGVPdmVycmlkZSA6IGRhdGEuc3R5bGUgKTtcclxuICAgICAgfTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyBAcHVibGljIC0gRGlzYWJsZXMgYSBzcGVjaWZpYyBsb2cuIFRPRE86IGhhbmRsZSBzdGl0Y2ggYW5kIHBlcmYgY29tcG9zaXRlIGxvZ2dlcnMgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzE1ODFcclxuICBkaXNhYmxlSW5kaXZpZHVhbExvZzogZnVuY3Rpb24oIG5hbWUgKSB7XHJcbiAgICBpZiAoIG5hbWUgKSB7XHJcbiAgICAgIGRlbGV0ZSB3aW5kb3cuc2NlbmVyeUxvZ1sgbmFtZSBdO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEVuYWJsZXMgbXVsdGlwbGUgbG9nZ2Vycy5cclxuICAgKiBAcHVibGljXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBsb2dOYW1lcyAtIGtleXMgZnJvbSBsb2dQcm9wZXJ0aWVzXHJcbiAgICovXHJcbiAgZW5hYmxlTG9nZ2luZzogZnVuY3Rpb24oIGxvZ05hbWVzICkge1xyXG4gICAgd2luZG93LnNjZW5lcnlMb2cgPSBmdW5jdGlvbiggb2IgKSB7IHNjZW5lcnkubG9nRnVuY3Rpb24oIG9iICk7IH07XHJcblxyXG4gICAgd2luZG93LnNjZW5lcnlMb2cucHVzaCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICBsb2dQYWRkaW5nICs9ICd8ICc7XHJcbiAgICB9O1xyXG4gICAgd2luZG93LnNjZW5lcnlMb2cucG9wID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIGxvZ1BhZGRpbmcgPSBsb2dQYWRkaW5nLnNsaWNlKCAwLCAtMiApO1xyXG4gICAgfTtcclxuICAgIHdpbmRvdy5zY2VuZXJ5TG9nLmdldERlcHRoID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBsb2dQYWRkaW5nLmxlbmd0aCAvIDI7XHJcbiAgICB9O1xyXG5cclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGxvZ05hbWVzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICB0aGlzLmVuYWJsZUluZGl2aWR1YWxMb2coIGxvZ05hbWVzWyBpIF0gKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyBAcHVibGljIC0gRGlzYWJsZXMgU2NlbmVyeSBsb2dnaW5nXHJcbiAgZGlzYWJsZUxvZ2dpbmc6IGZ1bmN0aW9uKCkge1xyXG4gICAgd2luZG93LnNjZW5lcnlMb2cgPSBudWxsO1xyXG4gIH0sXHJcblxyXG4gIC8vIEBwdWJsaWMgKHNjZW5lcnktaW50ZXJuYWwpIC0gV2hldGhlciBwZXJmb3JtYW5jZSBsb2dnaW5nIGlzIGFjdGl2ZSAobWF5IGFjdHVhbGx5IHJlZHVjZSBwZXJmb3JtYW5jZSlcclxuICBpc0xvZ2dpbmdQZXJmb3JtYW5jZTogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gd2luZG93LnNjZW5lcnlMb2cuUGVyZkNyaXRpY2FsIHx8IHdpbmRvdy5zY2VuZXJ5TG9nLlBlcmZNYWpvciB8fFxyXG4gICAgICAgICAgIHdpbmRvdy5zY2VuZXJ5TG9nLlBlcmZNaW5vciB8fCB3aW5kb3cuc2NlbmVyeUxvZy5QZXJmVmVyYm9zZTtcclxuICB9XHJcbn0gKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHNjZW5lcnk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLE1BQU0sTUFBTSw4QkFBOEI7QUFDakQsT0FBT0MsU0FBUyxNQUFNLGlDQUFpQzs7QUFFdkQ7QUFDQUMsTUFBTSxDQUFDQyxVQUFVLEdBQUcsSUFBSTtBQUV4QixNQUFNQyxhQUFhLEdBQUdDLFFBQVEsQ0FBQ0MsYUFBYSxDQUFFLFFBQVMsQ0FBQztBQUN4RCxNQUFNQyxjQUFjLEdBQUdILGFBQWEsQ0FBQ0ksVUFBVSxDQUFFLElBQUssQ0FBQztBQUV2RCxJQUFJQyxVQUFVLEdBQUcsRUFBRTtBQUVuQixNQUFNQyxPQUFPLEdBQUcsSUFBSVQsU0FBUyxDQUFFLFNBQVUsQ0FBQzs7QUFFMUM7QUFDQVMsT0FBTyxDQUFDQyxRQUFRLENBQUUsZUFBZSxFQUFFUCxhQUFjLENBQUM7QUFDbERNLE9BQU8sQ0FB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