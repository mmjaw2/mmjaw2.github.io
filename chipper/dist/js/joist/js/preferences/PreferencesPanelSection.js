// Copyright 2021-2023, University of Colorado Boulder

/**
 * A section of content in a PreferencesPanel of the PreferencseDialog. Handles layout for the title of the section
 * and its content. The preferences panels are responsible for layout of multiple PreferencesTabPanelSections.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import optionize, { combineOptions } from '../../../phet-core/js/optionize.js';
import { AlignGroup, Node, VBox } from '../../../scenery/js/imports.js';
import joist from '../joist.js';
import PreferencesDialog from './PreferencesDialog.js';
class PreferencesPanelSection extends VBox {
  constructor(providedOptions) {
    const options = optionize()({
      spacing: PreferencesDialog.CONTENT_SPACING,
      titleNode: null,
      contentNode: null,
      contentNodeOptions: {},
      contentLeftMargin: 30
    }, providedOptions);

    // layout - supports the layout of contentNode nested under the titleNode with indentation
    const sectionAlignGroup = new AlignGroup({
      matchVertical: false
    });
    const sectionChildren = [];
    if (options.titleNode) {
      sectionChildren.push(sectionAlignGroup.createBox(options.titleNode, {
        xAlign: 'left'
      }));
    }
    if (options.contentNode) {
      const contentNodeOptions = combineOptions({
        children: [options.contentNode]
      }, options.contentNodeOptions);
      sectionChildren.push(sectionAlignGroup.createBox(new Node(contentNodeOptions), {
        leftMargin: options.contentLeftMargin,
        xAlign: 'left'
      }));
    }
    options.children = sectionChildren;
    super(options);
  }
}
joist.register('PreferencesPanelSection', PreferencesPanelSection);
export default PreferencesPanelSection;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJvcHRpb25pemUiLCJjb21iaW5lT3B0aW9ucyIsIkFsaWduR3JvdXAiLCJOb2RlIiwiVkJveCIsImpvaXN0IiwiUHJlZmVyZW5jZXNEaWFsb2ciLCJQcmVmZXJlbmNlc1BhbmVsU2VjdGlvbiIsImNvbnN0cnVjdG9yIiwicHJvdmlkZWRPcHRpb25zIiwib3B0aW9ucyIsInNwYWNpbmciLCJDT05URU5UX1NQQUNJTkciLCJ0aXRsZU5vZGUiLCJjb250ZW50Tm9kZSIsImNvbnRlbnROb2RlT3B0aW9ucyIsImNvbnRlbnRMZWZ0TWFyZ2luIiwic2VjdGlvbkFsaWduR3JvdXAiLCJtYXRjaFZlcnRpY2FsIiwic2VjdGlvbkNoaWxkcmVuIiwicHVzaCIsImNyZWF0ZUJveCIsInhBbGlnbiIsImNoaWxkcmVuIiwibGVmdE1hcmdpbiIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiUHJlZmVyZW5jZXNQYW5lbFNlY3Rpb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEtMjAyMywgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBzZWN0aW9uIG9mIGNvbnRlbnQgaW4gYSBQcmVmZXJlbmNlc1BhbmVsIG9mIHRoZSBQcmVmZXJlbmNzZURpYWxvZy4gSGFuZGxlcyBsYXlvdXQgZm9yIHRoZSB0aXRsZSBvZiB0aGUgc2VjdGlvblxyXG4gKiBhbmQgaXRzIGNvbnRlbnQuIFRoZSBwcmVmZXJlbmNlcyBwYW5lbHMgYXJlIHJlc3BvbnNpYmxlIGZvciBsYXlvdXQgb2YgbXVsdGlwbGUgUHJlZmVyZW5jZXNUYWJQYW5lbFNlY3Rpb25zLlxyXG4gKlxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgb3B0aW9uaXplLCB7IGNvbWJpbmVPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IHsgQWxpZ25Hcm91cCwgTm9kZSwgTm9kZU9wdGlvbnMsIFZCb3gsIFZCb3hPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IGpvaXN0IGZyb20gJy4uL2pvaXN0LmpzJztcclxuaW1wb3J0IFByZWZlcmVuY2VzRGlhbG9nIGZyb20gJy4vUHJlZmVyZW5jZXNEaWFsb2cuanMnO1xyXG5cclxudHlwZSBTZWxmT3B0aW9ucyA9IHtcclxuXHJcbiAgLy8gaWYgcHJvdmlkZWQsIHdpbGwgYmUgdGhlIHRpdGxlIGZvciB0aGUgc2VjdGlvbiBhbmQgY29udGVudCB3aWxsIGJlIG5lc3RlZCB1bmRlciB0aGUgdGl0bGVOb2RlXHJcbiAgLy8gaW5kZW50ZWQgd2l0aCBjb250ZW50TGVmdE1hcmdpblxyXG4gIHRpdGxlTm9kZT86IE5vZGUgfCBudWxsO1xyXG5cclxuICAvLyBpZiBwcm92aWRlZCwgdGhlIGNvbnRlbnQgZm9yIHRoZSBzZWN0aW9uIHdoaWNoIHdpbGwgYmUgbmVzdGVkIHVuZGVyIHRoZSB0aXRsZU5vZGVcclxuICBjb250ZW50Tm9kZT86IE5vZGUgfCBudWxsO1xyXG5cclxuICBjb250ZW50Tm9kZU9wdGlvbnM/OiBTdHJpY3RPbWl0PE5vZGVPcHRpb25zLCAnY2hpbGRyZW4nPjtcclxuXHJcbiAgLy8gaW5kZW50YXRpb24gZm9yIHRoZSBjb250ZW50Tm9kZSAoaWYgcHJvdmlkZWQpIGZvciBsYXlvdXQgYXMgaXQgaXMgbmVzdGVkIHVuZGVyIHRoZSB0aXRsZU5vZGVcclxuICBjb250ZW50TGVmdE1hcmdpbj86IG51bWJlcjtcclxufTtcclxuZXhwb3J0IHR5cGUgUHJlZmVyZW5jZXNQYW5lbFNlY3Rpb25PcHRpb25zID0gU2VsZk9wdGlvbnMgJiBTdHJpY3RPbWl0PFZCb3hPcHRpb25zLCAnY2hpbGRyZW4nPjtcclxuXHJcbmNsYXNzIFByZWZlcmVuY2VzUGFuZWxTZWN0aW9uIGV4dGVuZHMgVkJveCB7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBwcm92aWRlZE9wdGlvbnM/OiBQcmVmZXJlbmNlc1BhbmVsU2VjdGlvbk9wdGlvbnMgKSB7XHJcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uaXplPFByZWZlcmVuY2VzUGFuZWxTZWN0aW9uT3B0aW9ucywgU2VsZk9wdGlvbnMsIFZCb3hPcHRpb25zPigpKCB7XHJcbiAgICAgIHNwYWNpbmc6IFByZWZlcmVuY2VzRGlhbG9nLkNPTlRFTlRfU1BBQ0lORyxcclxuICAgICAgdGl0bGVOb2RlOiBudWxsLFxyXG4gICAgICBjb250ZW50Tm9kZTogbnVsbCxcclxuICAgICAgY29udGVudE5vZGVPcHRpb25zOiB7fSxcclxuICAgICAgY29udGVudExlZnRNYXJnaW46IDMwXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICAvLyBsYXlvdXQgLSBzdXBwb3J0cyB0aGUgbGF5b3V0IG9mIGNvbnRlbnROb2RlIG5lc3RlZCB1bmRlciB0aGUgdGl0bGVOb2RlIHdpdGggaW5kZW50YXRpb25cclxuICAgIGNvbnN0IHNlY3Rpb25BbGlnbkdyb3VwID0gbmV3IEFsaWduR3JvdXAoIHsgbWF0Y2hWZXJ0aWNhbDogZmFsc2UgfSApO1xyXG5cclxuICAgIGNvbnN0IHNlY3Rpb25DaGlsZHJlbiA9IFtdO1xyXG4gICAgaWYgKCBvcHRpb25zLnRpdGxlTm9kZSApIHtcclxuICAgICAgc2VjdGlvbkNoaWxkcmVuLnB1c2goIHNlY3Rpb25BbGlnbkdyb3VwLmNyZWF0ZUJveCggb3B0aW9ucy50aXRsZU5vZGUsIHtcclxuICAgICAgICB4QWxpZ246ICdsZWZ0J1xyXG4gICAgICB9ICkgKTtcclxuICAgIH1cclxuICAgIGlmICggb3B0aW9ucy5jb250ZW50Tm9kZSApIHtcclxuICAgICAgY29uc3QgY29udGVudE5vZGVPcHRpb25zID0gY29tYmluZU9wdGlvbnM8Tm9kZU9wdGlvbnM+KCB7IGNoaWxkcmVuOiBbIG9wdGlvbnMuY29udGVudE5vZGUgXSB9LCBvcHRpb25zLmNvbnRlbnROb2RlT3B0aW9ucyApO1xyXG4gICAgICBzZWN0aW9uQ2hpbGRyZW4ucHVzaCggc2VjdGlvbkFsaWduR3JvdXAuY3JlYXRlQm94KCBuZXcgTm9kZSggY29udGVudE5vZGVPcHRpb25zICksIHtcclxuICAgICAgICBsZWZ0TWFyZ2luOiBvcHRpb25zLmNvbnRlbnRMZWZ0TWFyZ2luLFxyXG4gICAgICAgIHhBbGlnbjogJ2xlZnQnXHJcbiAgICAgIH0gKSApO1xyXG4gICAgfVxyXG5cclxuICAgIG9wdGlvbnMuY2hpbGRyZW4gPSBzZWN0aW9uQ2hpbGRyZW47XHJcbiAgICBzdXBlciggb3B0aW9ucyApO1xyXG4gIH1cclxufVxyXG5cclxuam9pc3QucmVnaXN0ZXIoICdQcmVmZXJlbmNlc1BhbmVsU2VjdGlvbicsIFByZWZlcmVuY2VzUGFuZWxTZWN0aW9uICk7XHJcbmV4cG9ydCBkZWZhdWx0IFByZWZlcmVuY2VzUGFuZWxTZWN0aW9uOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLFNBQVMsSUFBSUMsY0FBYyxRQUFRLG9DQUFvQztBQUU5RSxTQUFTQyxVQUFVLEVBQUVDLElBQUksRUFBZUMsSUFBSSxRQUFxQixnQ0FBZ0M7QUFDakcsT0FBT0MsS0FBSyxNQUFNLGFBQWE7QUFDL0IsT0FBT0MsaUJBQWlCLE1BQU0sd0JBQXdCO0FBa0J0RCxNQUFNQyx1QkFBdUIsU0FBU0gsSUFBSSxDQUFDO0VBQ2xDSSxXQUFXQSxDQUFFQyxlQUFnRCxFQUFHO0lBQ3JFLE1BQU1DLE9BQU8sR0FBR1YsU0FBUyxDQUEyRCxDQUFDLENBQUU7TUFDckZXLE9BQU8sRUFBRUwsaUJBQWlCLENBQUNNLGVBQWU7TUFDMUNDLFNBQVMsRUFBRSxJQUFJO01BQ2ZDLFdBQVcsRUFBRSxJQUFJO01BQ2pCQyxrQkFBa0IsRUFBRSxDQUFDLENBQUM7TUFDdEJDLGlCQUFpQixFQUFFO0lBQ3JCLENBQUMsRUFBRVAsZUFBZ0IsQ0FBQzs7SUFFcEI7SUFDQSxNQUFNUSxpQkFBaUIsR0FBRyxJQUFJZixVQUFVLENBQUU7TUFBRWdCLGFBQWEsRUFBRTtJQUFNLENBQUUsQ0FBQztJQUVwRSxNQUFNQyxlQUFlLEdBQUcsRUFBRTtJQUMxQixJQUFLVCxPQUFPLENBQUNHLFNBQVMsRUFBRztNQUN2Qk0sZUFBZSxDQUFDQyxJQUFJLENBQUVILGlCQUFpQixDQUFDSSxTQUFTLENBQUVYLE9BQU8sQ0FBQ0csU0FBUyxFQUFFO1FBQ3BFUyxNQUFNLEVBQUU7TUFDVixDQUFFLENBQUUsQ0FBQztJQUNQO0lBQ0EsSUFBS1osT0FBTyxDQUFDSSxXQUFXLEVBQUc7TUFDekIsTUFBTUMsa0JBQWtCLEdBQUdkLGNBQWMsQ0FBZTtRQUFFc0IsUUFBUSxFQUFFLENBQUViLE9BQU8sQ0FBQ0ksV0FBVztNQUFHLENBQUMsRUFBRUosT0FBTyxDQUFDSyxrQkFBbUIsQ0FBQztNQUMzSEksZUFBZSxDQUFDQyxJQUFJLENBQUVILGlCQUFpQixDQUFDSSxTQUFTLENBQUUsSUFBSWxCLElBQUksQ0FBRVksa0JBQW1CLENBQUMsRUFBRTtRQUNqRlMsVUFBVSxFQUFFZCxPQUFPLENBQUNNLGlCQUFpQjtRQUNyQ00sTUFBTSxFQUFFO01BQ1YsQ0FBRSxDQUFFLENBQUM7SUFDUDtJQUVBWixPQUFPLENBQUNhLFFBQVEsR0FBR0osZUFBZTtJQUNsQyxLQUFLLENBQUVULE9BQVEsQ0FBQztFQUNsQjtBQUNGO0FBRUFMLEtBQUssQ0FBQ29CLFFBQVEsQ0FBRSx5QkFBeUIsRUFBRWxCLHVCQUF3QixDQUFDO0FBQ3BFLGVBQWVBLHVCQUF1QiIsImlnbm9yZUxpc3QiOltdfQ==