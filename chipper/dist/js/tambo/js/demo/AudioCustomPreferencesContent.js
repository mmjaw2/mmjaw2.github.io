// Copyright 2020-2022, University of Colorado Boulder

/**
 * AudioCustomPreferencesContent is intended as an example of a node that can serve as the content the Preferences
 * dialog that enables the user to select between different candidate sounds that are under consideration for use in a
 * sound design.
 *
 * @author John Blanco (PhET Interactive Simulations)
 */

import NumberProperty from '../../../axon/js/NumberProperty.js';
import PreferencesDialog from '../../../joist/js/preferences/PreferencesDialog.js';
import { Node, Text } from '../../../scenery/js/imports.js';
import AquaRadioButtonGroup from '../../../sun/js/AquaRadioButtonGroup.js';
import tambo from '../tambo.js';
class AudioCustomPreferencesContent extends Node {
  constructor() {
    // global property that specifies which sound to use when balls bounce on the walls of the box (but not the ceiling)
    phet.tambo.soundIndexForWallBounceProperty = new NumberProperty(0);
    const items = [{
      value: 0,
      createNode: tandem => new Text('1st option', PreferencesDialog.PANEL_SECTION_CONTENT_OPTIONS)
    }, {
      value: 1,
      createNode: tandem => new Text('2nd option', PreferencesDialog.PANEL_SECTION_CONTENT_OPTIONS)
    }, {
      value: 2,
      createNode: tandem => new Text('3rd option', PreferencesDialog.PANEL_SECTION_CONTENT_OPTIONS)
    }];
    const radioButtonGroup = new AquaRadioButtonGroup(phet.tambo.soundIndexForWallBounceProperty, items, {
      orientation: 'vertical',
      align: 'left'
    });
    super({
      children: [radioButtonGroup]
    });
  }
}
tambo.register('AudioCustomPreferencesContent', AudioCustomPreferencesContent);
export default AudioCustomPreferencesContent;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJOdW1iZXJQcm9wZXJ0eSIsIlByZWZlcmVuY2VzRGlhbG9nIiwiTm9kZSIsIlRleHQiLCJBcXVhUmFkaW9CdXR0b25Hcm91cCIsInRhbWJvIiwiQXVkaW9DdXN0b21QcmVmZXJlbmNlc0NvbnRlbnQiLCJjb25zdHJ1Y3RvciIsInBoZXQiLCJzb3VuZEluZGV4Rm9yV2FsbEJvdW5jZVByb3BlcnR5IiwiaXRlbXMiLCJ2YWx1ZSIsImNyZWF0ZU5vZGUiLCJ0YW5kZW0iLCJQQU5FTF9TRUNUSU9OX0NPTlRFTlRfT1BUSU9OUyIsInJhZGlvQnV0dG9uR3JvdXAiLCJvcmllbnRhdGlvbiIsImFsaWduIiwiY2hpbGRyZW4iLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIkF1ZGlvQ3VzdG9tUHJlZmVyZW5jZXNDb250ZW50LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIwLTIwMjIsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEF1ZGlvQ3VzdG9tUHJlZmVyZW5jZXNDb250ZW50IGlzIGludGVuZGVkIGFzIGFuIGV4YW1wbGUgb2YgYSBub2RlIHRoYXQgY2FuIHNlcnZlIGFzIHRoZSBjb250ZW50IHRoZSBQcmVmZXJlbmNlc1xyXG4gKiBkaWFsb2cgdGhhdCBlbmFibGVzIHRoZSB1c2VyIHRvIHNlbGVjdCBiZXR3ZWVuIGRpZmZlcmVudCBjYW5kaWRhdGUgc291bmRzIHRoYXQgYXJlIHVuZGVyIGNvbnNpZGVyYXRpb24gZm9yIHVzZSBpbiBhXHJcbiAqIHNvdW5kIGRlc2lnbi5cclxuICpcclxuICogQGF1dGhvciBKb2huIEJsYW5jbyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgTnVtYmVyUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9OdW1iZXJQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBQcmVmZXJlbmNlc0RpYWxvZyBmcm9tICcuLi8uLi8uLi9qb2lzdC9qcy9wcmVmZXJlbmNlcy9QcmVmZXJlbmNlc0RpYWxvZy5qcyc7XHJcbmltcG9ydCB7IE5vZGUsIFRleHQgfSBmcm9tICcuLi8uLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgQXF1YVJhZGlvQnV0dG9uR3JvdXAgZnJvbSAnLi4vLi4vLi4vc3VuL2pzL0FxdWFSYWRpb0J1dHRvbkdyb3VwLmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuaW1wb3J0IHRhbWJvIGZyb20gJy4uL3RhbWJvLmpzJztcclxuXHJcbmNsYXNzIEF1ZGlvQ3VzdG9tUHJlZmVyZW5jZXNDb250ZW50IGV4dGVuZHMgTm9kZSB7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcclxuXHJcbiAgICAvLyBnbG9iYWwgcHJvcGVydHkgdGhhdCBzcGVjaWZpZXMgd2hpY2ggc291bmQgdG8gdXNlIHdoZW4gYmFsbHMgYm91bmNlIG9uIHRoZSB3YWxscyBvZiB0aGUgYm94IChidXQgbm90IHRoZSBjZWlsaW5nKVxyXG4gICAgcGhldC50YW1iby5zb3VuZEluZGV4Rm9yV2FsbEJvdW5jZVByb3BlcnR5ID0gbmV3IE51bWJlclByb3BlcnR5KCAwICk7XHJcblxyXG4gICAgY29uc3QgaXRlbXMgPSBbXHJcbiAgICAgIHtcclxuICAgICAgICB2YWx1ZTogMCxcclxuICAgICAgICBjcmVhdGVOb2RlOiAoIHRhbmRlbTogVGFuZGVtICkgPT4gbmV3IFRleHQoICcxc3Qgb3B0aW9uJywgUHJlZmVyZW5jZXNEaWFsb2cuUEFORUxfU0VDVElPTl9DT05URU5UX09QVElPTlMgKVxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgdmFsdWU6IDEsXHJcbiAgICAgICAgY3JlYXRlTm9kZTogKCB0YW5kZW06IFRhbmRlbSApID0+IG5ldyBUZXh0KCAnMm5kIG9wdGlvbicsIFByZWZlcmVuY2VzRGlhbG9nLlBBTkVMX1NFQ1RJT05fQ09OVEVOVF9PUFRJT05TIClcclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIHZhbHVlOiAyLFxyXG4gICAgICAgIGNyZWF0ZU5vZGU6ICggdGFuZGVtOiBUYW5kZW0gKSA9PiBuZXcgVGV4dCggJzNyZCBvcHRpb24nLCBQcmVmZXJlbmNlc0RpYWxvZy5QQU5FTF9TRUNUSU9OX0NPTlRFTlRfT1BUSU9OUyApXHJcbiAgICAgIH1cclxuICAgIF07XHJcblxyXG4gICAgY29uc3QgcmFkaW9CdXR0b25Hcm91cCA9IG5ldyBBcXVhUmFkaW9CdXR0b25Hcm91cCggcGhldC50YW1iby5zb3VuZEluZGV4Rm9yV2FsbEJvdW5jZVByb3BlcnR5LCBpdGVtcywge1xyXG4gICAgICBvcmllbnRhdGlvbjogJ3ZlcnRpY2FsJyxcclxuICAgICAgYWxpZ246ICdsZWZ0J1xyXG4gICAgfSApO1xyXG5cclxuICAgIHN1cGVyKCB7IGNoaWxkcmVuOiBbIHJhZGlvQnV0dG9uR3JvdXAgXSB9ICk7XHJcbiAgfVxyXG59XHJcblxyXG50YW1iby5yZWdpc3RlciggJ0F1ZGlvQ3VzdG9tUHJlZmVyZW5jZXNDb250ZW50JywgQXVkaW9DdXN0b21QcmVmZXJlbmNlc0NvbnRlbnQgKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IEF1ZGlvQ3VzdG9tUHJlZmVyZW5jZXNDb250ZW50OyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsY0FBYyxNQUFNLG9DQUFvQztBQUMvRCxPQUFPQyxpQkFBaUIsTUFBTSxvREFBb0Q7QUFDbEYsU0FBU0MsSUFBSSxFQUFFQyxJQUFJLFFBQVEsZ0NBQWdDO0FBQzNELE9BQU9DLG9CQUFvQixNQUFNLHlDQUF5QztBQUUxRSxPQUFPQyxLQUFLLE1BQU0sYUFBYTtBQUUvQixNQUFNQyw2QkFBNkIsU0FBU0osSUFBSSxDQUFDO0VBRXhDSyxXQUFXQSxDQUFBLEVBQUc7SUFFbkI7SUFDQUMsSUFBSSxDQUFDSCxLQUFLLENBQUNJLCtCQUErQixHQUFHLElBQUlULGNBQWMsQ0FBRSxDQUFFLENBQUM7SUFFcEUsTUFBTVUsS0FBSyxHQUFHLENBQ1o7TUFDRUMsS0FBSyxFQUFFLENBQUM7TUFDUkMsVUFBVSxFQUFJQyxNQUFjLElBQU0sSUFBSVYsSUFBSSxDQUFFLFlBQVksRUFBRUYsaUJBQWlCLENBQUNhLDZCQUE4QjtJQUM1RyxDQUFDLEVBQ0Q7TUFDRUgsS0FBSyxFQUFFLENBQUM7TUFDUkMsVUFBVSxFQUFJQyxNQUFjLElBQU0sSUFBSVYsSUFBSSxDQUFFLFlBQVksRUFBRUYsaUJBQWlCLENBQUNhLDZCQUE4QjtJQUM1RyxDQUFDLEVBQ0Q7TUFDRUgsS0FBSyxFQUFFLENBQUM7TUFDUkMsVUFBVSxFQUFJQyxNQUFjLElBQU0sSUFBSVYsSUFBSSxDQUFFLFlBQVksRUFBRUYsaUJBQWlCLENBQUNhLDZCQUE4QjtJQUM1RyxDQUFDLENBQ0Y7SUFFRCxNQUFNQyxnQkFBZ0IsR0FBRyxJQUFJWCxvQkFBb0IsQ0FBRUksSUFBSSxDQUFDSCxLQUFLLENBQUNJLCtCQUErQixFQUFFQyxLQUFLLEVBQUU7TUFDcEdNLFdBQVcsRUFBRSxVQUFVO01BQ3ZCQyxLQUFLLEVBQUU7SUFDVCxDQUFFLENBQUM7SUFFSCxLQUFLLENBQUU7TUFBRUMsUUFBUSxFQUFFLENBQUVILGdCQUFnQjtJQUFHLENBQUUsQ0FBQztFQUM3QztBQUNGO0FBRUFWLEtBQUssQ0FBQ2MsUUFBUSxDQUFFLCtCQUErQixFQUFFYiw2QkFBOEIsQ0FBQztBQUVoRixlQUFlQSw2QkFBNkIiLCJpZ25vcmVMaXN0IjpbXX0=