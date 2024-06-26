// Copyright 2022-2024, University of Colorado Boulder

/**
 * A convenience superclass for a Node composed with InteractiveHighlighting. Helpful when using this superclass is
 * easier than the trait pattern. And some devs generally prefer traditional inheritance.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import { InteractiveHighlighting, Node, scenery } from '../../../imports.js';
class InteractiveHighlightingNode extends InteractiveHighlighting(Node) {
  constructor(options) {
    super(options);
  }
}
scenery.register('InteractiveHighlightingNode', InteractiveHighlightingNode);
export default InteractiveHighlightingNode;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZyIsIk5vZGUiLCJzY2VuZXJ5IiwiSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdOb2RlIiwiY29uc3RydWN0b3IiLCJvcHRpb25zIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZ05vZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjItMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBjb252ZW5pZW5jZSBzdXBlcmNsYXNzIGZvciBhIE5vZGUgY29tcG9zZWQgd2l0aCBJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZy4gSGVscGZ1bCB3aGVuIHVzaW5nIHRoaXMgc3VwZXJjbGFzcyBpc1xyXG4gKiBlYXNpZXIgdGhhbiB0aGUgdHJhaXQgcGF0dGVybi4gQW5kIHNvbWUgZGV2cyBnZW5lcmFsbHkgcHJlZmVyIHRyYWRpdGlvbmFsIGluaGVyaXRhbmNlLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgeyBJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZywgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdPcHRpb25zLCBOb2RlLCBOb2RlT3B0aW9ucywgc2NlbmVyeSB9IGZyb20gJy4uLy4uLy4uL2ltcG9ydHMuanMnO1xyXG5cclxuZXhwb3J0IHR5cGUgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdOb2RlT3B0aW9ucyA9IEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nT3B0aW9ucyAmIE5vZGVPcHRpb25zO1xyXG5cclxuY2xhc3MgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdOb2RlIGV4dGVuZHMgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmcoIE5vZGUgKSB7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBvcHRpb25zPzogSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdOb2RlT3B0aW9ucyApIHtcclxuICAgIHN1cGVyKCBvcHRpb25zICk7XHJcbiAgfVxyXG59XHJcblxyXG5zY2VuZXJ5LnJlZ2lzdGVyKCAnSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdOb2RlJywgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdOb2RlICk7XHJcbmV4cG9ydCBkZWZhdWx0IEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nTm9kZTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxTQUFTQSx1QkFBdUIsRUFBa0NDLElBQUksRUFBZUMsT0FBTyxRQUFRLHFCQUFxQjtBQUl6SCxNQUFNQywyQkFBMkIsU0FBU0gsdUJBQXVCLENBQUVDLElBQUssQ0FBQyxDQUFDO0VBQ2pFRyxXQUFXQSxDQUFFQyxPQUE0QyxFQUFHO0lBQ2pFLEtBQUssQ0FBRUEsT0FBUSxDQUFDO0VBQ2xCO0FBQ0Y7QUFFQUgsT0FBTyxDQUFDSSxRQUFRLENBQUUsNkJBQTZCLEVBQUVILDJCQUE0QixDQUFDO0FBQzlFLGVBQWVBLDJCQUEyQiIsImlnbm9yZUxpc3QiOltdfQ==