// Copyright 2016-2024, University of Colorado Boulder

/**
 * Shows a Dialog with content describing keyboard interactions. Opened via a button in the navigation bar.
 *
 * @author Jesse Greenberg
 */

import Multilink from '../../axon/js/Multilink.js';
import optionize from '../../phet-core/js/optionize.js';
import KeyboardHelpSectionRow from '../../scenery-phet/js/keyboard/help/KeyboardHelpSectionRow.js';
import TextKeyNode from '../../scenery-phet/js/keyboard/TextKeyNode.js';
import PhetFont from '../../scenery-phet/js/PhetFont.js';
import { HBox, Node, PDOMPeer, ReadingBlock, VBox, VoicingText } from '../../scenery/js/imports.js';
import Dialog from '../../sun/js/Dialog.js';
import joist from './joist.js';
import JoistStrings from './JoistStrings.js';
import Tandem from '../../tandem/js/Tandem.js';
import InstanceRegistry from '../../phet-core/js/documentation/InstanceRegistry.js';

// constants
const TITLE_MAX_WIDTH = 670;
const tabToGetStartedStringProperty = JoistStrings.a11y.keyboardHelp.tabToGetStartedStringProperty;
export default class KeyboardHelpDialog extends Dialog {
  constructor(screens, screenProperty, providedOptions) {
    const options = optionize()({
      titleAlign: 'center',
      fill: 'rgb( 214, 237, 249 )',
      ySpacing: 15,
      // phet-io
      phetioReadOnly: true,
      // the KeyboardHelpDialog should not be settable
      phetioDynamicElement: true,
      // Append the title to the close button
      closeButtonVoicingDialogTitle: JoistStrings.keyboardShortcuts.titleStringProperty,
      isDisposable: false,
      // Because of the special titleNode, we set the aria-labelledby attribute manually; see below.
      addAriaLabelledByFromTitle: false
    }, providedOptions);
    const content = new Node({
      tagName: 'div'
    });
    const contentTandem = options.tandem.createTandem('content');
    const screenContentNodes = [];
    screens.forEach(screen => {
      assert && assert(screen.createKeyboardHelpNode, 'if any screen has keyboard help content, then all screens need content');
      const screenTandem = screen.tandem.supplied ? contentTandem.createTandem(screen.tandem.name) : Tandem.REQUIRED;
      const keyboardHelpNode = screen.createKeyboardHelpNode(screenTandem);
      screenContentNodes.push(keyboardHelpNode);
    });
    const shortcutsTitleText = new VoicingText(JoistStrings.keyboardShortcuts.titleStringProperty, {
      font: new PhetFont({
        weight: 'bold',
        size: 24
      }),
      maxWidth: TITLE_MAX_WIDTH,
      // pdom options
      tagName: 'h1',
      innerContent: JoistStrings.a11y.keyboardHelp.keyboardShortcutsStringProperty
    });

    // a 'tab to get started' hint
    const tabHintLine = new TabHintLine();

    // stack the two items with a bit of spacing
    assert && assert(!options.title, 'KeyboardHelpDialog sets title');
    const titleVBox = new VBox({
      children: [shortcutsTitleText, tabHintLine],
      spacing: 5,
      // pdom
      tagName: 'div'
    });
    options.title = titleVBox;

    // help content surrounded by a div unless already specified, so that all content is read when dialog opens

    super(content, options);

    // When the screen changes, swap out keyboard help content to the selected screen's content
    Multilink.multilink([screenProperty, this.isShowingProperty], (screen, isShowing) => {
      assert && assert(screens.includes(screen), 'double check that this is an expected screen');
      const currentContentNode = screenContentNodes[screens.indexOf(screen)];
      if (isShowing) {
        assert && assert(currentContentNode, 'a displayed KeyboardHelpButton for a screen should have content');
        content.children = [currentContentNode];
      }
    });

    // (a11y) Make sure that the title passed to the Dialog has an accessible name.
    this.addAriaLabelledbyAssociation({
      thisElementName: PDOMPeer.PRIMARY_SIBLING,
      otherNode: shortcutsTitleText,
      otherElementName: PDOMPeer.PRIMARY_SIBLING
    });

    // support for binder documentation, stripped out in builds and only runs when ?binder is specified
    if (assert && phet?.chipper?.queryParameters?.binder) {
      screenContentNodes.forEach(node => {
        content.children = [node];
        InstanceRegistry.registerDataURL('joist', 'KeyboardHelpDialog', this);
      });
    }
  }
}

/**
 * An inner class that assembles the "Tab to get started" content of the Dialog title. This content
 * is interactive with Voicing in that it can be clicked to hear this content (when Voicing is enabled).
 */

class TabHintLine extends ReadingBlock(Node) {
  constructor(providedOptions) {
    const options = optionize()({
      readingBlockNameResponse: tabToGetStartedStringProperty
    }, providedOptions);
    super();
    const tabIcon = TextKeyNode.tab();

    // a line to say "tab to get started" below the "Keyboard Shortcuts" 'title'
    const labelWithIcon = KeyboardHelpSectionRow.labelWithIcon(JoistStrings.keyboardShortcuts.toGetStartedStringProperty, tabIcon, {
      labelInnerContent: tabToGetStartedStringProperty,
      iconOptions: {
        tagName: 'p' // because there is only one, and the default is an li tag
      }
    });

    // labelWithIcon is meant to be passed to KeyboardHelpSection, so we have to hack a bit here
    const hBox = new HBox({
      children: [labelWithIcon.icon, labelWithIcon.label],
      spacing: 4
    });
    this.addChild(hBox);
    this.mutate(options);
  }
}
joist.register('KeyboardHelpDialog', KeyboardHelpDialog);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNdWx0aWxpbmsiLCJvcHRpb25pemUiLCJLZXlib2FyZEhlbHBTZWN0aW9uUm93IiwiVGV4dEtleU5vZGUiLCJQaGV0Rm9udCIsIkhCb3giLCJOb2RlIiwiUERPTVBlZXIiLCJSZWFkaW5nQmxvY2siLCJWQm94IiwiVm9pY2luZ1RleHQiLCJEaWFsb2ciLCJqb2lzdCIsIkpvaXN0U3RyaW5ncyIsIlRhbmRlbSIsIkluc3RhbmNlUmVnaXN0cnkiLCJUSVRMRV9NQVhfV0lEVEgiLCJ0YWJUb0dldFN0YXJ0ZWRTdHJpbmdQcm9wZXJ0eSIsImExMXkiLCJrZXlib2FyZEhlbHAiLCJLZXlib2FyZEhlbHBEaWFsb2ciLCJjb25zdHJ1Y3RvciIsInNjcmVlbnMiLCJzY3JlZW5Qcm9wZXJ0eSIsInByb3ZpZGVkT3B0aW9ucyIsIm9wdGlvbnMiLCJ0aXRsZUFsaWduIiwiZmlsbCIsInlTcGFjaW5nIiwicGhldGlvUmVhZE9ubHkiLCJwaGV0aW9EeW5hbWljRWxlbWVudCIsImNsb3NlQnV0dG9uVm9pY2luZ0RpYWxvZ1RpdGxlIiwia2V5Ym9hcmRTaG9ydGN1dHMiLCJ0aXRsZVN0cmluZ1Byb3BlcnR5IiwiaXNEaXNwb3NhYmxlIiwiYWRkQXJpYUxhYmVsbGVkQnlGcm9tVGl0bGUiLCJjb250ZW50IiwidGFnTmFtZSIsImNvbnRlbnRUYW5kZW0iLCJ0YW5kZW0iLCJjcmVhdGVUYW5kZW0iLCJzY3JlZW5Db250ZW50Tm9kZXMiLCJmb3JFYWNoIiwic2NyZWVuIiwiYXNzZXJ0IiwiY3JlYXRlS2V5Ym9hcmRIZWxwTm9kZSIsInNjcmVlblRhbmRlbSIsInN1cHBsaWVkIiwibmFtZSIsIlJFUVVJUkVEIiwia2V5Ym9hcmRIZWxwTm9kZSIsInB1c2giLCJzaG9ydGN1dHNUaXRsZVRleHQiLCJmb250Iiwid2VpZ2h0Iiwic2l6ZSIsIm1heFdpZHRoIiwiaW5uZXJDb250ZW50Iiwia2V5Ym9hcmRTaG9ydGN1dHNTdHJpbmdQcm9wZXJ0eSIsInRhYkhpbnRMaW5lIiwiVGFiSGludExpbmUiLCJ0aXRsZSIsInRpdGxlVkJveCIsImNoaWxkcmVuIiwic3BhY2luZyIsIm11bHRpbGluayIsImlzU2hvd2luZ1Byb3BlcnR5IiwiaXNTaG93aW5nIiwiaW5jbHVkZXMiLCJjdXJyZW50Q29udGVudE5vZGUiLCJpbmRleE9mIiwiYWRkQXJpYUxhYmVsbGVkYnlBc3NvY2lhdGlvbiIsInRoaXNFbGVtZW50TmFtZSIsIlBSSU1BUllfU0lCTElORyIsIm90aGVyTm9kZSIsIm90aGVyRWxlbWVudE5hbWUiLCJwaGV0IiwiY2hpcHBlciIsInF1ZXJ5UGFyYW1ldGVycyIsImJpbmRlciIsIm5vZGUiLCJyZWdpc3RlckRhdGFVUkwiLCJyZWFkaW5nQmxvY2tOYW1lUmVzcG9uc2UiLCJ0YWJJY29uIiwidGFiIiwibGFiZWxXaXRoSWNvbiIsInRvR2V0U3RhcnRlZFN0cmluZ1Byb3BlcnR5IiwibGFiZWxJbm5lckNvbnRlbnQiLCJpY29uT3B0aW9ucyIsImhCb3giLCJpY29uIiwibGFiZWwiLCJhZGRDaGlsZCIsIm11dGF0ZSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiS2V5Ym9hcmRIZWxwRGlhbG9nLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE2LTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFNob3dzIGEgRGlhbG9nIHdpdGggY29udGVudCBkZXNjcmliaW5nIGtleWJvYXJkIGludGVyYWN0aW9ucy4gT3BlbmVkIHZpYSBhIGJ1dHRvbiBpbiB0aGUgbmF2aWdhdGlvbiBiYXIuXHJcbiAqXHJcbiAqIEBhdXRob3IgSmVzc2UgR3JlZW5iZXJnXHJcbiAqL1xyXG5cclxuaW1wb3J0IE11bHRpbGluayBmcm9tICcuLi8uLi9heG9uL2pzL011bHRpbGluay5qcyc7XHJcbmltcG9ydCBQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBFbXB0eVNlbGZPcHRpb25zIH0gZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBQaWNrUmVxdWlyZWQgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL1BpY2tSZXF1aXJlZC5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IEtleWJvYXJkSGVscFNlY3Rpb25Sb3cgZnJvbSAnLi4vLi4vc2NlbmVyeS1waGV0L2pzL2tleWJvYXJkL2hlbHAvS2V5Ym9hcmRIZWxwU2VjdGlvblJvdy5qcyc7XHJcbmltcG9ydCBUZXh0S2V5Tm9kZSBmcm9tICcuLi8uLi9zY2VuZXJ5LXBoZXQvanMva2V5Ym9hcmQvVGV4dEtleU5vZGUuanMnO1xyXG5pbXBvcnQgUGhldEZvbnQgZnJvbSAnLi4vLi4vc2NlbmVyeS1waGV0L2pzL1BoZXRGb250LmpzJztcclxuaW1wb3J0IHsgSEJveCwgTm9kZSwgTm9kZU9wdGlvbnMsIFBET01QZWVyLCBSZWFkaW5nQmxvY2ssIFJlYWRpbmdCbG9ja09wdGlvbnMsIFZCb3gsIFZvaWNpbmdUZXh0IH0gZnJvbSAnLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IERpYWxvZywgeyBEaWFsb2dPcHRpb25zIH0gZnJvbSAnLi4vLi4vc3VuL2pzL0RpYWxvZy5qcyc7XHJcbmltcG9ydCBqb2lzdCBmcm9tICcuL2pvaXN0LmpzJztcclxuaW1wb3J0IEpvaXN0U3RyaW5ncyBmcm9tICcuL0pvaXN0U3RyaW5ncy5qcyc7XHJcbmltcG9ydCB7IEFueVNjcmVlbiB9IGZyb20gJy4vU2NyZWVuLmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuaW1wb3J0IEluc3RhbmNlUmVnaXN0cnkgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL2RvY3VtZW50YXRpb24vSW5zdGFuY2VSZWdpc3RyeS5qcyc7XHJcblxyXG4vLyBjb25zdGFudHNcclxuY29uc3QgVElUTEVfTUFYX1dJRFRIID0gNjcwO1xyXG5cclxuY29uc3QgdGFiVG9HZXRTdGFydGVkU3RyaW5nUHJvcGVydHkgPSBKb2lzdFN0cmluZ3MuYTExeS5rZXlib2FyZEhlbHAudGFiVG9HZXRTdGFydGVkU3RyaW5nUHJvcGVydHk7XHJcblxyXG50eXBlIFNlbGZPcHRpb25zID0gRW1wdHlTZWxmT3B0aW9ucztcclxuXHJcbmV4cG9ydCB0eXBlIEtleWJvYXJkSGVscERpYWxvZ09wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIFN0cmljdE9taXQ8RGlhbG9nT3B0aW9ucywgJ3RpdGxlJz4gJiBQaWNrUmVxdWlyZWQ8RGlhbG9nT3B0aW9ucywgJ3RhbmRlbSc+O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgS2V5Ym9hcmRIZWxwRGlhbG9nIGV4dGVuZHMgRGlhbG9nIHtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBzY3JlZW5zOiBBbnlTY3JlZW5bXSwgc2NyZWVuUHJvcGVydHk6IFByb3BlcnR5PEFueVNjcmVlbj4sIHByb3ZpZGVkT3B0aW9ucz86IEtleWJvYXJkSGVscERpYWxvZ09wdGlvbnMgKSB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxLZXlib2FyZEhlbHBEaWFsb2dPcHRpb25zLCBTZWxmT3B0aW9ucywgRGlhbG9nT3B0aW9ucz4oKSgge1xyXG4gICAgICB0aXRsZUFsaWduOiAnY2VudGVyJyxcclxuICAgICAgZmlsbDogJ3JnYiggMjE0LCAyMzcsIDI0OSApJyxcclxuICAgICAgeVNwYWNpbmc6IDE1LFxyXG5cclxuICAgICAgLy8gcGhldC1pb1xyXG4gICAgICBwaGV0aW9SZWFkT25seTogdHJ1ZSwgLy8gdGhlIEtleWJvYXJkSGVscERpYWxvZyBzaG91bGQgbm90IGJlIHNldHRhYmxlXHJcbiAgICAgIHBoZXRpb0R5bmFtaWNFbGVtZW50OiB0cnVlLFxyXG5cclxuICAgICAgLy8gQXBwZW5kIHRoZSB0aXRsZSB0byB0aGUgY2xvc2UgYnV0dG9uXHJcbiAgICAgIGNsb3NlQnV0dG9uVm9pY2luZ0RpYWxvZ1RpdGxlOiBKb2lzdFN0cmluZ3Mua2V5Ym9hcmRTaG9ydGN1dHMudGl0bGVTdHJpbmdQcm9wZXJ0eSxcclxuICAgICAgaXNEaXNwb3NhYmxlOiBmYWxzZSxcclxuXHJcbiAgICAgIC8vIEJlY2F1c2Ugb2YgdGhlIHNwZWNpYWwgdGl0bGVOb2RlLCB3ZSBzZXQgdGhlIGFyaWEtbGFiZWxsZWRieSBhdHRyaWJ1dGUgbWFudWFsbHk7IHNlZSBiZWxvdy5cclxuICAgICAgYWRkQXJpYUxhYmVsbGVkQnlGcm9tVGl0bGU6IGZhbHNlXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBjb25zdCBjb250ZW50ID0gbmV3IE5vZGUoIHtcclxuICAgICAgdGFnTmFtZTogJ2RpdidcclxuICAgIH0gKTtcclxuXHJcbiAgICBjb25zdCBjb250ZW50VGFuZGVtID0gb3B0aW9ucy50YW5kZW0uY3JlYXRlVGFuZGVtKCAnY29udGVudCcgKTtcclxuICAgIGNvbnN0IHNjcmVlbkNvbnRlbnROb2RlczogTm9kZVtdID0gW107XHJcbiAgICBzY3JlZW5zLmZvckVhY2goIHNjcmVlbiA9PiB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHNjcmVlbi5jcmVhdGVLZXlib2FyZEhlbHBOb2RlLCAnaWYgYW55IHNjcmVlbiBoYXMga2V5Ym9hcmQgaGVscCBjb250ZW50LCB0aGVuIGFsbCBzY3JlZW5zIG5lZWQgY29udGVudCcgKTtcclxuICAgICAgY29uc3Qgc2NyZWVuVGFuZGVtID0gc2NyZWVuLnRhbmRlbS5zdXBwbGllZCA/IGNvbnRlbnRUYW5kZW0uY3JlYXRlVGFuZGVtKCBzY3JlZW4udGFuZGVtLm5hbWUgKSA6IFRhbmRlbS5SRVFVSVJFRDtcclxuICAgICAgY29uc3Qga2V5Ym9hcmRIZWxwTm9kZSA9IHNjcmVlbi5jcmVhdGVLZXlib2FyZEhlbHBOb2RlISggc2NyZWVuVGFuZGVtICk7XHJcbiAgICAgIHNjcmVlbkNvbnRlbnROb2Rlcy5wdXNoKCBrZXlib2FyZEhlbHBOb2RlICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3Qgc2hvcnRjdXRzVGl0bGVUZXh0ID0gbmV3IFZvaWNpbmdUZXh0KCBKb2lzdFN0cmluZ3Mua2V5Ym9hcmRTaG9ydGN1dHMudGl0bGVTdHJpbmdQcm9wZXJ0eSwge1xyXG4gICAgICBmb250OiBuZXcgUGhldEZvbnQoIHtcclxuICAgICAgICB3ZWlnaHQ6ICdib2xkJyxcclxuICAgICAgICBzaXplOiAyNFxyXG4gICAgICB9ICksXHJcbiAgICAgIG1heFdpZHRoOiBUSVRMRV9NQVhfV0lEVEgsXHJcblxyXG4gICAgICAvLyBwZG9tIG9wdGlvbnNcclxuICAgICAgdGFnTmFtZTogJ2gxJyxcclxuICAgICAgaW5uZXJDb250ZW50OiBKb2lzdFN0cmluZ3MuYTExeS5rZXlib2FyZEhlbHAua2V5Ym9hcmRTaG9ydGN1dHNTdHJpbmdQcm9wZXJ0eVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIGEgJ3RhYiB0byBnZXQgc3RhcnRlZCcgaGludFxyXG4gICAgY29uc3QgdGFiSGludExpbmUgPSBuZXcgVGFiSGludExpbmUoKTtcclxuXHJcbiAgICAvLyBzdGFjayB0aGUgdHdvIGl0ZW1zIHdpdGggYSBiaXQgb2Ygc3BhY2luZ1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIW9wdGlvbnMudGl0bGUsICdLZXlib2FyZEhlbHBEaWFsb2cgc2V0cyB0aXRsZScgKTtcclxuICAgIGNvbnN0IHRpdGxlVkJveCA9IG5ldyBWQm94KCB7XHJcbiAgICAgICAgY2hpbGRyZW46IFsgc2hvcnRjdXRzVGl0bGVUZXh0LCB0YWJIaW50TGluZSBdLFxyXG4gICAgICAgIHNwYWNpbmc6IDUsXHJcblxyXG4gICAgICAgIC8vIHBkb21cclxuICAgICAgICB0YWdOYW1lOiAnZGl2J1xyXG4gICAgICB9XHJcbiAgICApO1xyXG4gICAgb3B0aW9ucy50aXRsZSA9IHRpdGxlVkJveDtcclxuXHJcbiAgICAvLyBoZWxwIGNvbnRlbnQgc3Vycm91bmRlZCBieSBhIGRpdiB1bmxlc3MgYWxyZWFkeSBzcGVjaWZpZWQsIHNvIHRoYXQgYWxsIGNvbnRlbnQgaXMgcmVhZCB3aGVuIGRpYWxvZyBvcGVuc1xyXG5cclxuICAgIHN1cGVyKCBjb250ZW50LCBvcHRpb25zICk7XHJcblxyXG4gICAgLy8gV2hlbiB0aGUgc2NyZWVuIGNoYW5nZXMsIHN3YXAgb3V0IGtleWJvYXJkIGhlbHAgY29udGVudCB0byB0aGUgc2VsZWN0ZWQgc2NyZWVuJ3MgY29udGVudFxyXG4gICAgTXVsdGlsaW5rLm11bHRpbGluayggWyBzY3JlZW5Qcm9wZXJ0eSwgdGhpcy5pc1Nob3dpbmdQcm9wZXJ0eSBdLCAoIHNjcmVlbiwgaXNTaG93aW5nICkgPT4ge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBzY3JlZW5zLmluY2x1ZGVzKCBzY3JlZW4gKSwgJ2RvdWJsZSBjaGVjayB0aGF0IHRoaXMgaXMgYW4gZXhwZWN0ZWQgc2NyZWVuJyApO1xyXG4gICAgICBjb25zdCBjdXJyZW50Q29udGVudE5vZGUgPSBzY3JlZW5Db250ZW50Tm9kZXNbIHNjcmVlbnMuaW5kZXhPZiggc2NyZWVuICkgXTtcclxuICAgICAgaWYgKCBpc1Nob3dpbmcgKSB7XHJcbiAgICAgICAgYXNzZXJ0ICYmIGFzc2VydCggY3VycmVudENvbnRlbnROb2RlLCAnYSBkaXNwbGF5ZWQgS2V5Ym9hcmRIZWxwQnV0dG9uIGZvciBhIHNjcmVlbiBzaG91bGQgaGF2ZSBjb250ZW50JyApO1xyXG4gICAgICAgIGNvbnRlbnQuY2hpbGRyZW4gPSBbIGN1cnJlbnRDb250ZW50Tm9kZSBdO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gKGExMXkpIE1ha2Ugc3VyZSB0aGF0IHRoZSB0aXRsZSBwYXNzZWQgdG8gdGhlIERpYWxvZyBoYXMgYW4gYWNjZXNzaWJsZSBuYW1lLlxyXG4gICAgdGhpcy5hZGRBcmlhTGFiZWxsZWRieUFzc29jaWF0aW9uKCB7XHJcbiAgICAgIHRoaXNFbGVtZW50TmFtZTogUERPTVBlZXIuUFJJTUFSWV9TSUJMSU5HLFxyXG4gICAgICBvdGhlck5vZGU6IHNob3J0Y3V0c1RpdGxlVGV4dCxcclxuICAgICAgb3RoZXJFbGVtZW50TmFtZTogUERPTVBlZXIuUFJJTUFSWV9TSUJMSU5HXHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gc3VwcG9ydCBmb3IgYmluZGVyIGRvY3VtZW50YXRpb24sIHN0cmlwcGVkIG91dCBpbiBidWlsZHMgYW5kIG9ubHkgcnVucyB3aGVuID9iaW5kZXIgaXMgc3BlY2lmaWVkXHJcbiAgICBpZiAoIGFzc2VydCAmJiBwaGV0Py5jaGlwcGVyPy5xdWVyeVBhcmFtZXRlcnM/LmJpbmRlciApIHtcclxuICAgICAgc2NyZWVuQ29udGVudE5vZGVzLmZvckVhY2goIG5vZGUgPT4ge1xyXG4gICAgICAgIGNvbnRlbnQuY2hpbGRyZW4gPSBbIG5vZGUgXTtcclxuICAgICAgICBJbnN0YW5jZVJlZ2lzdHJ5LnJlZ2lzdGVyRGF0YVVSTCggJ2pvaXN0JywgJ0tleWJvYXJkSGVscERpYWxvZycsIHRoaXMgKTtcclxuICAgICAgfSApO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEFuIGlubmVyIGNsYXNzIHRoYXQgYXNzZW1ibGVzIHRoZSBcIlRhYiB0byBnZXQgc3RhcnRlZFwiIGNvbnRlbnQgb2YgdGhlIERpYWxvZyB0aXRsZS4gVGhpcyBjb250ZW50XHJcbiAqIGlzIGludGVyYWN0aXZlIHdpdGggVm9pY2luZyBpbiB0aGF0IGl0IGNhbiBiZSBjbGlja2VkIHRvIGhlYXIgdGhpcyBjb250ZW50ICh3aGVuIFZvaWNpbmcgaXMgZW5hYmxlZCkuXHJcbiAqL1xyXG5cclxudHlwZSBUYWJIaW50TGluZVNlbGZPcHRpb25zID0gRW1wdHlTZWxmT3B0aW9ucztcclxudHlwZSBUYWJIaW50TGluZU9wdGlvbnMgPSBUYWJIaW50TGluZVNlbGZPcHRpb25zICYgTm9kZU9wdGlvbnMgJiBSZWFkaW5nQmxvY2tPcHRpb25zO1xyXG5cclxuY2xhc3MgVGFiSGludExpbmUgZXh0ZW5kcyBSZWFkaW5nQmxvY2soIE5vZGUgKSB7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggcHJvdmlkZWRPcHRpb25zPzogVGFiSGludExpbmVPcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8VGFiSGludExpbmVPcHRpb25zLCBUYWJIaW50TGluZVNlbGZPcHRpb25zLCBSZWFkaW5nQmxvY2tPcHRpb25zPigpKCB7XHJcbiAgICAgIHJlYWRpbmdCbG9ja05hbWVSZXNwb25zZTogdGFiVG9HZXRTdGFydGVkU3RyaW5nUHJvcGVydHlcclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIHN1cGVyKCk7XHJcblxyXG4gICAgY29uc3QgdGFiSWNvbiA9IFRleHRLZXlOb2RlLnRhYigpO1xyXG5cclxuICAgIC8vIGEgbGluZSB0byBzYXkgXCJ0YWIgdG8gZ2V0IHN0YXJ0ZWRcIiBiZWxvdyB0aGUgXCJLZXlib2FyZCBTaG9ydGN1dHNcIiAndGl0bGUnXHJcbiAgICBjb25zdCBsYWJlbFdpdGhJY29uID0gS2V5Ym9hcmRIZWxwU2VjdGlvblJvdy5sYWJlbFdpdGhJY29uKCBKb2lzdFN0cmluZ3Mua2V5Ym9hcmRTaG9ydGN1dHMudG9HZXRTdGFydGVkU3RyaW5nUHJvcGVydHksXHJcbiAgICAgIHRhYkljb24sIHtcclxuICAgICAgICBsYWJlbElubmVyQ29udGVudDogdGFiVG9HZXRTdGFydGVkU3RyaW5nUHJvcGVydHksXHJcbiAgICAgICAgaWNvbk9wdGlvbnM6IHtcclxuICAgICAgICAgIHRhZ05hbWU6ICdwJyAvLyBiZWNhdXNlIHRoZXJlIGlzIG9ubHkgb25lLCBhbmQgdGhlIGRlZmF1bHQgaXMgYW4gbGkgdGFnXHJcbiAgICAgICAgfVxyXG4gICAgICB9ICk7XHJcblxyXG4gICAgLy8gbGFiZWxXaXRoSWNvbiBpcyBtZWFudCB0byBiZSBwYXNzZWQgdG8gS2V5Ym9hcmRIZWxwU2VjdGlvbiwgc28gd2UgaGF2ZSB0byBoYWNrIGEgYml0IGhlcmVcclxuICAgIGNvbnN0IGhCb3ggPSBuZXcgSEJveCgge1xyXG4gICAgICBjaGlsZHJlbjogWyBsYWJlbFdpdGhJY29uLmljb24sIGxhYmVsV2l0aEljb24ubGFiZWwgXSxcclxuICAgICAgc3BhY2luZzogNFxyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuYWRkQ2hpbGQoIGhCb3ggKTtcclxuICAgIHRoaXMubXV0YXRlKCBvcHRpb25zICk7XHJcbiAgfVxyXG59XHJcblxyXG5qb2lzdC5yZWdpc3RlciggJ0tleWJvYXJkSGVscERpYWxvZycsIEtleWJvYXJkSGVscERpYWxvZyApOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxTQUFTLE1BQU0sNEJBQTRCO0FBRWxELE9BQU9DLFNBQVMsTUFBNEIsaUNBQWlDO0FBRzdFLE9BQU9DLHNCQUFzQixNQUFNLCtEQUErRDtBQUNsRyxPQUFPQyxXQUFXLE1BQU0sK0NBQStDO0FBQ3ZFLE9BQU9DLFFBQVEsTUFBTSxtQ0FBbUM7QUFDeEQsU0FBU0MsSUFBSSxFQUFFQyxJQUFJLEVBQWVDLFFBQVEsRUFBRUMsWUFBWSxFQUF1QkMsSUFBSSxFQUFFQyxXQUFXLFFBQVEsNkJBQTZCO0FBQ3JJLE9BQU9DLE1BQU0sTUFBeUIsd0JBQXdCO0FBQzlELE9BQU9DLEtBQUssTUFBTSxZQUFZO0FBQzlCLE9BQU9DLFlBQVksTUFBTSxtQkFBbUI7QUFFNUMsT0FBT0MsTUFBTSxNQUFNLDJCQUEyQjtBQUM5QyxPQUFPQyxnQkFBZ0IsTUFBTSxzREFBc0Q7O0FBRW5GO0FBQ0EsTUFBTUMsZUFBZSxHQUFHLEdBQUc7QUFFM0IsTUFBTUMsNkJBQTZCLEdBQUdKLFlBQVksQ0FBQ0ssSUFBSSxDQUFDQyxZQUFZLENBQUNGLDZCQUE2QjtBQU1sRyxlQUFlLE1BQU1HLGtCQUFrQixTQUFTVCxNQUFNLENBQUM7RUFFOUNVLFdBQVdBLENBQUVDLE9BQW9C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