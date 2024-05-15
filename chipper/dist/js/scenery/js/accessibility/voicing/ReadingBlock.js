// Copyright 2021-2024, University of Colorado Boulder

/**
 * A trait that extends Voicing, adding support for "Reading Blocks" of the voicing feature. "Reading Blocks" are
 * UI components in the application that have unique functionality with respect to Voicing.
 *
 *  - Reading Blocks are generally around graphical objects that are not otherwise interactive (like Text).
 *  - They have a unique focus highlight to indicate they can be clicked on to hear voiced content.
 *  - When activated with press or click readingBlockNameResponse is spoken.
 *  - ReadingBlock content is always spoken if the voicingManager is enabled, ignoring Properties of responseCollector.
 *  - While speaking, a yellow highlight will appear over the Node composed with ReadingBlock.
 *  - While voicing is enabled, reading blocks will be added to the focus order.
 *
 * This trait is to be composed with Nodes and assumes that the Node is composed with ParallelDOM.  It uses Node to
 * support mouse/touch input and ParallelDOM to support being added to the focus order and alternative input.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import TinyEmitter from '../../../../axon/js/TinyEmitter.js';
import ResponsePatternCollection from '../../../../utterance-queue/js/ResponsePatternCollection.js';
import { DelayedMutate, Focus, PDOMInstance, ReadingBlockHighlight, ReadingBlockUtterance, scenery, Voicing, voicingManager } from '../../imports.js';
import memoize from '../../../../phet-core/js/memoize.js';
const READING_BLOCK_OPTION_KEYS = ['readingBlockTagName', 'readingBlockNameResponse', 'readingBlockHintResponse', 'readingBlockResponsePatternCollection', 'readingBlockActiveHighlight'];
// Use an assertion signature to narrow the type to ReadingBlockUtterance
function assertReadingBlockUtterance(utterance) {
  if (!(utterance instanceof ReadingBlockUtterance)) {
    assert && assert(false, 'utterance is not a ReadinBlockUtterance');
  }
}

// An implementation class for ReadingBlock.ts, only used in this class so that we know if we own the Utterance and can
// therefore dispose it.
class OwnedReadingBlockUtterance extends ReadingBlockUtterance {
  constructor(focus, providedOptions) {
    super(focus, providedOptions);
  }
}
const DEFAULT_CONTENT_HINT_PATTERN = new ResponsePatternCollection({
  nameHint: '{{NAME}}. {{HINT}}'
});
const ReadingBlock = memoize(Type => {
  const ReadingBlockClass = DelayedMutate('ReadingBlock', READING_BLOCK_OPTION_KEYS, class ReadingBlockClass extends Voicing(Type) {
    // The tagName used for the ReadingBlock when "Voicing" is enabled, default
    // of button so that it is added to the focus order and can receive 'click' events. You may wish to set this
    // to some other tagName or set to null to remove the ReadingBlock from the focus order. If this is changed,
    // be sure that the ReadingBlock will still respond to `click` events when enabled.

    // The tagName to apply to the Node when voicing is disabled.

    // The highlight that surrounds this ReadingBlock when it is "active" and
    // the Voicing framework is speaking the content associated with this Node. By default, a semi-transparent
    // yellow highlight surrounds this Node's bounds.

    // (scenery-internal) - Sends a message when the highlight for the ReadingBlock changes. Used
    // by the HighlightOverlay to redraw it if it changes while the highlight is active.

    // Updates the hit bounds of this Node when the local bounds change.

    // Triggers activation of the ReadingBlock, requesting speech of its content.

    // Controls whether the ReadingBlock should be interactive and focusable. At the time of this writing, that is true
    // for all ReadingBlocks when the voicingManager is fully enabled and can speak.

    constructor(...args) {
      super(...args);
      this._readingBlockTagName = 'button';
      this._readingBlockDisabledTagName = 'p';
      this._readingBlockActiveHighlight = null;
      this.readingBlockActiveHighlightChangedEmitter = new TinyEmitter();
      this.readingBlockResponsePatternCollection = DEFAULT_CONTENT_HINT_PATTERN;
      this._localBoundsChangedListener = this._onLocalBoundsChanged.bind(this);
      this.localBoundsProperty.link(this._localBoundsChangedListener);
      this._readingBlockInputListener = {
        focus: event => this._speakReadingBlockContentListener(event),
        up: event => this._speakReadingBlockContentListener(event),
        click: event => this._speakReadingBlockContentListener(event)
      };
      this._readingBlockFocusableChangeListener = this._onReadingBlockFocusableChanged.bind(this);
      voicingManager.speechAllowedAndFullyEnabledProperty.link(this._readingBlockFocusableChangeListener);

      // All ReadingBlocks have a ReadingBlockHighlight, a focus highlight that is black to indicate it has
      // a different behavior.
      this.focusHighlight = new ReadingBlockHighlight(this);

      // All ReadingBlocks use a ReadingBlockUtterance with Focus and Trail data to this Node so that it can be
      // highlighted in the FocusOverlay when this Utterance is being announced.
      this.voicingUtterance = new OwnedReadingBlockUtterance(null);
    }

    /**
     * Whether a Node composes ReadingBlock.
     */
    get isReadingBlock() {
      return true;
    }

    /**
     * Set the tagName for the node composing ReadingBlock. This is the tagName (of ParallelDOM) that will be applied
     * to this Node when Reading Blocks are enabled.
     */
    setReadingBlockTagName(tagName) {
      this._readingBlockTagName = tagName;
      this._onReadingBlockFocusableChanged(voicingManager.speechAllowedAndFullyEnabledProperty.value);
    }
    set readingBlockTagName(tagName) {
      this.setReadingBlockTagName(tagName);
    }
    get readingBlockTagName() {
      return this.getReadingBlockTagName();
    }

    /**
     * Get the tagName for this Node (of ParallelDOM) when Reading Blocks are enabled.
     */
    getReadingBlockTagName() {
      return this._readingBlockTagName;
    }

    /**
     * Sets the content that should be read whenever the ReadingBlock receives input that initiates speech.
     */
    setReadingBlockNameResponse(content) {
      this._voicingResponsePacket.nameResponse = content;
    }
    set readingBlockNameResponse(content) {
      this.setReadingBlockNameResponse(content);
    }
    get readingBlockNameResponse() {
      return this.getReadingBlockNameResponse();
    }

    /**
     * Gets the content that is spoken whenever the ReadingBLock receives input that would initiate speech.
     */
    getReadingBlockNameResponse() {
      return this._voicingResponsePacket.nameResponse;
    }

    /**
     * Sets the hint response for this ReadingBlock. This is only spoken if "Helpful Hints" are enabled by the user.
     */
    setReadingBlockHintResponse(content) {
      this._voicingResponsePacket.hintResponse = content;
    }
    set readingBlockHintResponse(content) {
      this.setReadingBlockHintResponse(content);
    }
    get readingBlockHintResponse() {
      return this.getReadingBlockHintResponse();
    }

    /**
     * Get the hint response for this ReadingBlock. This is additional content that is only read if "Helpful Hints"
     * are enabled.
     */
    getReadingBlockHintResponse() {
      return this._voicingResponsePacket.hintResponse;
    }

    /**
     * Sets the collection of patterns to use for voicing responses, controlling the order, punctuation, and
     * additional content for each combination of response. See ResponsePatternCollection.js if you wish to use
     * a collection of string patterns that are not the default.
     */
    setReadingBlockResponsePatternCollection(patterns) {
      this._voicingResponsePacket.responsePatternCollection = patterns;
    }
    set readingBlockResponsePatternCollection(patterns) {
      this.setReadingBlockResponsePatternCollection(patterns);
    }
    get readingBlockResponsePatternCollection() {
      return this.getReadingBlockResponsePatternCollection();
    }

    /**
     * Get the ResponsePatternCollection object that this ReadingBlock Node is using to collect responses.
     */
    getReadingBlockResponsePatternCollection() {
      return this._voicingResponsePacket.responsePatternCollection;
    }

    /**
     * ReadingBlock must take a ReadingBlockUtterance for its voicingUtterance. You generally shouldn't be using this.
     * But if you must, you are responsible for setting the ReadingBlockUtterance.readingBlockFocus when this
     * ReadingBlock is activated so that it gets highlighted correctly. See how the default readingBlockFocus is set.
     */
    setVoicingUtterance(utterance) {
      super.setVoicingUtterance(utterance);
    }
    set voicingUtterance(utterance) {
      super.voicingUtterance = utterance;
    }
    get voicingUtterance() {
      return this.getVoicingUtterance();
    }
    getVoicingUtterance() {
      const utterance = super.getVoicingUtterance();
      assertReadingBlockUtterance(utterance);
      return utterance;
    }
    setVoicingNameResponse() {
      assert && assert(false, 'ReadingBlocks only support setting the name response via readingBlockNameResponse');
    }
    getVoicingNameResponse() {
      assert && assert(false, 'ReadingBlocks only support getting the name response via readingBlockNameResponse');
    }
    setVoicingObjectResponse() {
      assert && assert(false, 'ReadingBlocks do not support setting object response');
    }
    getVoicingObjectResponse() {
      assert && assert(false, 'ReadingBlocks do not support setting object response');
    }
    setVoicingContextResponse() {
      assert && assert(false, 'ReadingBlocks do not support setting context response');
    }
    getVoicingContextResponse() {
      assert && assert(false, 'ReadingBlocks do not support setting context response');
    }
    setVoicingHintResponse() {
      assert && assert(false, 'ReadingBlocks only support setting the hint response via readingBlockHintResponse.');
    }
    getVoicingHintResponse() {
      assert && assert(false, 'ReadingBlocks only support getting the hint response via readingBlockHintResponse.');
    }
    setVoicingResponsePatternCollection() {
      assert && assert(false, 'ReadingBlocks only support setting the response patterns via readingBlockResponsePatternCollection.');
    }
    getVoicingResponsePatternCollection() {
      assert && assert(false, 'ReadingBlocks only support getting the response patterns via readingBlockResponsePatternCollection.');
    }

    /**
     * Sets the highlight used to surround this Node while the Voicing framework is speaking this content.
     * If a Node is provided, do not add this Node to the scene graph, it is added and made visible by the HighlightOverlay.
     */
    setReadingBlockActiveHighlight(readingBlockActiveHighlight) {
      if (this._readingBlockActiveHighlight !== readingBlockActiveHighlight) {
        this._readingBlockActiveHighlight = readingBlockActiveHighlight;
        this.readingBlockActiveHighlightChangedEmitter.emit();
      }
    }
    set readingBlockActiveHighlight(readingBlockActiveHighlight) {
      this.setReadingBlockActiveHighlight(readingBlockActiveHighlight);
    }
    get readingBlockActiveHighlight() {
      return this._readingBlockActiveHighlight;
    }

    /**
     * Returns the highlight used to surround this Node when the Voicing framework is reading its
     * content.
     */
    getReadingBlockActiveHighlight() {
      return this._readingBlockActiveHighlight;
    }

    /**
     * Returns true if this ReadingBlock is "activated", indicating that it has received interaction
     * and the Voicing framework is speaking its content.
     */
    isReadingBlockActivated() {
      let activated = false;
      const trailIds = Object.keys(this.displays);
      for (let i = 0; i < trailIds.length; i++) {
        const pointerFocus = this.displays[trailIds[i]].focusManager.readingBlockFocusProperty.value;
        if (pointerFocus && pointerFocus.trail.lastNode() === this) {
          activated = true;
          break;
        }
      }
      return activated;
    }
    get readingBlockActivated() {
      return this.isReadingBlockActivated();
    }

    /**
     * When this Node becomes focusable (because Reading Blocks have just been enabled or disabled), either
     * apply or remove the readingBlockTagName.
     *
     * @param focusable - whether ReadingBlocks should be focusable
     */
    _onReadingBlockFocusableChanged(focusable) {
      this.focusable = focusable;
      if (focusable) {
        this.tagName = this._readingBlockTagName;

        // don't add the input listener if we are already active, we may just be updating the tagName in this case
        if (!this.hasInputListener(this._readingBlockInputListener)) {
          this.addInputListener(this._readingBlockInputListener);
        }
      } else {
        this.tagName = this._readingBlockDisabledTagName;
        if (this.hasInputListener(this._readingBlockInputListener)) {
          this.removeInputListener(this._readingBlockInputListener);
        }
      }
    }

    /**
     * Update the hit areas for this Node whenever the bounds change.
     */
    _onLocalBoundsChanged(localBounds) {
      this.mouseArea = localBounds;
      this.touchArea = localBounds;
    }

    /**
     * Speak the content associated with the ReadingBlock. Sets the readingBlockFocusProperties on
     * the displays so that HighlightOverlays know to activate a highlight while the voicingManager
     * is reading about this Node.
     */
    _speakReadingBlockContentListener(event) {
      const displays = this.getConnectedDisplays();
      const readingBlockUtterance = this.voicingUtterance;
      const content = this.collectResponse({
        nameResponse: this.getReadingBlockNameResponse(),
        hintResponse: this.getReadingBlockHintResponse(),
        ignoreProperties: this.voicingIgnoreVoicingManagerProperties,
        responsePatternCollection: this._voicingResponsePacket.responsePatternCollection,
        utterance: readingBlockUtterance
      });
      if (content) {
        for (let i = 0; i < displays.length; i++) {
          if (!this.getDescendantsUseHighlighting(event.trail)) {
            // the SceneryEvent might have gone through a descendant of this Node
            const rootToSelf = event.trail.subtrailTo(this);

            // the trail to a Node may be discontinuous for PDOM events due to pdomOrder,
            // this finds the actual visual trail to use
            const visualTrail = PDOMInstance.guessVisualTrail(rootToSelf, displays[i].rootNode);
            const focus = new Focus(displays[i], visualTrail);
            readingBlockUtterance.readingBlockFocus = focus;
            this.speakContent(content);
          }
        }
      }
    }

    /**
     * If we created and own the voicingUtterance we can fully dispose of it.
     * @mixin-protected - made public for use in the mixin only
     */
    cleanVoicingUtterance() {
      if (this._voicingUtterance instanceof OwnedReadingBlockUtterance) {
        this._voicingUtterance.dispose();
      }
      super.cleanVoicingUtterance();
    }
    dispose() {
      voicingManager.speechAllowedAndFullyEnabledProperty.unlink(this._readingBlockFocusableChangeListener);
      this.localBoundsProperty.unlink(this._localBoundsChangedListener);

      // remove the input listener that activates the ReadingBlock, only do this if the listener is attached while
      // the ReadingBlock is enabled
      if (this.hasInputListener(this._readingBlockInputListener)) {
        this.removeInputListener(this._readingBlockInputListener);
      }
      super.dispose();
    }
    mutate(options) {
      return super.mutate(options);
    }
  });

  /**
   * {Array.<string>} - String keys for all the allowed options that will be set by Node.mutate( options ), in
   * the order they will be evaluated.
   *
   * NOTE: See Node's _mutatorKeys documentation for more information on how this operates, and potential special
   *       cases that may apply.
   */
  ReadingBlockClass.prototype._mutatorKeys = READING_BLOCK_OPTION_KEYS.concat(ReadingBlockClass.prototype._mutatorKeys);
  assert && assert(ReadingBlockClass.prototype._mutatorKeys.length === _.uniq(ReadingBlockClass.prototype._mutatorKeys).length, 'x mutator keys in ReadingBlock');
  return ReadingBlockClass;
});

// Export a type that lets you check if your Node is composed with ReadingBlock

scenery.register('ReadingBlock', ReadingBlock);
export default ReadingBlock;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUaW55RW1pdHRlciIsIlJlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb24iLCJEZWxheWVkTXV0YXRlIiwiRm9jdXMiLCJQRE9NSW5zdGFuY2UiLCJSZWFkaW5nQmxvY2tIaWdobGlnaHQiLCJSZWFkaW5nQmxvY2tVdHRlcmFuY2UiLCJzY2VuZXJ5IiwiVm9pY2luZyIsInZvaWNpbmdNYW5hZ2VyIiwibWVtb2l6ZSIsIlJFQURJTkdfQkxPQ0tfT1BUSU9OX0tFWVMiLCJhc3NlcnRSZWFkaW5nQmxvY2tVdHRlcmFuY2UiLCJ1dHRlcmFuY2UiLCJhc3NlcnQiLCJPd25lZFJlYWRpbmdCbG9ja1V0dGVyYW5jZSIsImNvbnN0cnVjdG9yIiwiZm9jdXMiLCJwcm92aWRlZE9wdGlvbnMiLCJERUZBVUxUX0NPTlRFTlRfSElOVF9QQVRURVJOIiwibmFtZUhpbnQiLCJSZWFkaW5nQmxvY2siLCJUeXBlIiwiUmVhZGluZ0Jsb2NrQ2xhc3MiLCJhcmdzIiwiX3JlYWRpbmdCbG9ja1RhZ05hbWUiLCJfcmVhZGluZ0Jsb2NrRGlzYWJsZWRUYWdOYW1lIiwiX3JlYWRpbmdCbG9ja0FjdGl2ZUhpZ2hsaWdodCIsInJlYWRpbmdCbG9ja0FjdGl2ZUhpZ2hsaWdodENoYW5nZWRFbWl0dGVyIiwicmVhZGluZ0Jsb2NrUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbiIsIl9sb2NhbEJvdW5kc0NoYW5nZWRMaXN0ZW5lciIsIl9vbkxvY2FsQm91bmRzQ2hhbmdlZCIsImJpbmQiLCJsb2NhbEJvdW5kc1Byb3BlcnR5IiwibGluayIsIl9yZWFkaW5nQmxvY2tJbnB1dExpc3RlbmVyIiwiZXZlbnQiLCJfc3BlYWtSZWFkaW5nQmxvY2tDb250ZW50TGlzdGVuZXIiLCJ1cCIsImNsaWNrIiwiX3JlYWRpbmdCbG9ja0ZvY3VzYWJsZUNoYW5nZUxpc3RlbmVyIiwiX29uUmVhZGluZ0Jsb2NrRm9jdXNhYmxlQ2hhbmdlZCIsInNwZWVjaEFsbG93ZWRBbmRGdWxseUVuYWJsZWRQcm9wZXJ0eSIsImZvY3VzSGlnaGxpZ2h0Iiwidm9pY2luZ1V0dGVyYW5jZSIsImlzUmVhZGluZ0Jsb2NrIiwic2V0UmVhZGluZ0Jsb2NrVGFnTmFtZSIsInRhZ05hbWUiLCJ2YWx1ZSIsInJlYWRpbmdCbG9ja1RhZ05hbWUiLCJnZXRSZWFkaW5nQmxvY2tUYWdOYW1lIiwic2V0UmVhZGluZ0Jsb2NrTmFtZVJlc3BvbnNlIiwiY29udGVudCIsIl92b2ljaW5nUmVzcG9uc2VQYWNrZXQiLCJuYW1lUmVzcG9uc2UiLCJyZWFkaW5nQmxvY2tOYW1lUmVzcG9uc2UiLCJnZXRSZWFkaW5nQmxvY2tOYW1lUmVzcG9uc2UiLCJzZXRSZWFkaW5nQmxvY2tIaW50UmVzcG9uc2UiLCJoaW50UmVzcG9uc2UiLCJyZWFkaW5nQmxvY2tIaW50UmVzcG9uc2UiLCJnZXRSZWFkaW5nQmxvY2tIaW50UmVzcG9uc2UiLCJzZXRSZWFkaW5nQmxvY2tSZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uIiwicGF0dGVybnMiLCJyZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uIiwiZ2V0UmVhZGluZ0Jsb2NrUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbiIsInNldFZvaWNpbmdVdHRlcmFuY2UiLCJnZXRWb2ljaW5nVXR0ZXJhbmNlIiwic2V0Vm9pY2luZ05hbWVSZXNwb25zZSIsImdldFZvaWNpbmdOYW1lUmVzcG9uc2UiLCJzZXRWb2ljaW5nT2JqZWN0UmVzcG9uc2UiLCJnZXRWb2ljaW5nT2JqZWN0UmVzcG9uc2UiLCJzZXRWb2ljaW5nQ29udGV4dFJlc3BvbnNlIiwiZ2V0Vm9pY2luZ0NvbnRleHRSZXNwb25zZSIsInNldFZvaWNpbmdIaW50UmVzcG9uc2UiLCJnZXRWb2ljaW5nSGludFJlc3BvbnNlIiwic2V0Vm9pY2luZ1Jlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb24iLCJnZXRWb2ljaW5nUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbiIsInNldFJlYWRpbmdCbG9ja0FjdGl2ZUhpZ2hsaWdodCIsInJlYWRpbmdCbG9ja0FjdGl2ZUhpZ2hsaWdodCIsImVtaXQiLCJnZXRSZWFkaW5nQmxvY2tBY3RpdmVIaWdobGlnaHQiLCJpc1JlYWRpbmdCbG9ja0FjdGl2YXRlZCIsImFjdGl2YXRlZCIsInRyYWlsSWRzIiwiT2JqZWN0Iiwia2V5cyIsImRpc3BsYXlzIiwiaSIsImxlbmd0aCIsInBvaW50ZXJGb2N1cyIsImZvY3VzTWFuYWdlciIsInJlYWRpbmdCbG9ja0ZvY3VzUHJvcGVydHkiLCJ0cmFpbCIsImxhc3ROb2RlIiwicmVhZGluZ0Jsb2NrQWN0aXZhdGVkIiwiZm9jdXNhYmxlIiwiaGFzSW5wdXRMaXN0ZW5lciIsImFkZElucHV0TGlzdGVuZXIiLCJyZW1vdmVJbnB1dExpc3RlbmVyIiwibG9jYWxCb3VuZHMiLCJtb3VzZUFyZWEiLCJ0b3VjaEFyZWEiLCJnZXRDb25uZWN0ZWREaXNwbGF5cyIsInJlYWRpbmdCbG9ja1V0dGVyYW5jZSIsImNvbGxlY3RSZXNwb25zZSIsImlnbm9yZVByb3BlcnRpZXMiLCJ2b2ljaW5nSWdub3JlVm9pY2luZ01hbmFnZXJQcm9wZXJ0aWVzIiwiZ2V0RGVzY2VuZGFudHNVc2VIaWdobGlnaHRpbmciLCJyb290VG9TZWxmIiwic3VidHJhaWxUbyIsInZpc3VhbFRyYWlsIiwiZ3Vlc3NWaXN1YWxUcmFpbCIsInJvb3ROb2RlIiwicmVhZGluZ0Jsb2NrRm9jdXMiLCJzcGVha0NvbnRlbnQiLCJjbGVhblZvaWNpbmdVdHRlcmFuY2UiLCJfdm9pY2luZ1V0dGVyYW5jZSIsImRpc3Bvc2UiLCJ1bmxpbmsiLCJtdXRhdGUiLCJvcHRpb25zIiwicHJvdG90eXBlIiwiX211dGF0b3JLZXlzIiwiY29uY2F0IiwiXyIsInVuaXEiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlJlYWRpbmdCbG9jay50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMS0yMDI0LCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBBIHRyYWl0IHRoYXQgZXh0ZW5kcyBWb2ljaW5nLCBhZGRpbmcgc3VwcG9ydCBmb3IgXCJSZWFkaW5nIEJsb2Nrc1wiIG9mIHRoZSB2b2ljaW5nIGZlYXR1cmUuIFwiUmVhZGluZyBCbG9ja3NcIiBhcmVcclxuICogVUkgY29tcG9uZW50cyBpbiB0aGUgYXBwbGljYXRpb24gdGhhdCBoYXZlIHVuaXF1ZSBmdW5jdGlvbmFsaXR5IHdpdGggcmVzcGVjdCB0byBWb2ljaW5nLlxyXG4gKlxyXG4gKiAgLSBSZWFkaW5nIEJsb2NrcyBhcmUgZ2VuZXJhbGx5IGFyb3VuZCBncmFwaGljYWwgb2JqZWN0cyB0aGF0IGFyZSBub3Qgb3RoZXJ3aXNlIGludGVyYWN0aXZlIChsaWtlIFRleHQpLlxyXG4gKiAgLSBUaGV5IGhhdmUgYSB1bmlxdWUgZm9jdXMgaGlnaGxpZ2h0IHRvIGluZGljYXRlIHRoZXkgY2FuIGJlIGNsaWNrZWQgb24gdG8gaGVhciB2b2ljZWQgY29udGVudC5cclxuICogIC0gV2hlbiBhY3RpdmF0ZWQgd2l0aCBwcmVzcyBvciBjbGljayByZWFkaW5nQmxvY2tOYW1lUmVzcG9uc2UgaXMgc3Bva2VuLlxyXG4gKiAgLSBSZWFkaW5nQmxvY2sgY29udGVudCBpcyBhbHdheXMgc3Bva2VuIGlmIHRoZSB2b2ljaW5nTWFuYWdlciBpcyBlbmFibGVkLCBpZ25vcmluZyBQcm9wZXJ0aWVzIG9mIHJlc3BvbnNlQ29sbGVjdG9yLlxyXG4gKiAgLSBXaGlsZSBzcGVha2luZywgYSB5ZWxsb3cgaGlnaGxpZ2h0IHdpbGwgYXBwZWFyIG92ZXIgdGhlIE5vZGUgY29tcG9zZWQgd2l0aCBSZWFkaW5nQmxvY2suXHJcbiAqICAtIFdoaWxlIHZvaWNpbmcgaXMgZW5hYmxlZCwgcmVhZGluZyBibG9ja3Mgd2lsbCBiZSBhZGRlZCB0byB0aGUgZm9jdXMgb3JkZXIuXHJcbiAqXHJcbiAqIFRoaXMgdHJhaXQgaXMgdG8gYmUgY29tcG9zZWQgd2l0aCBOb2RlcyBhbmQgYXNzdW1lcyB0aGF0IHRoZSBOb2RlIGlzIGNvbXBvc2VkIHdpdGggUGFyYWxsZWxET00uICBJdCB1c2VzIE5vZGUgdG9cclxuICogc3VwcG9ydCBtb3VzZS90b3VjaCBpbnB1dCBhbmQgUGFyYWxsZWxET00gdG8gc3VwcG9ydCBiZWluZyBhZGRlZCB0byB0aGUgZm9jdXMgb3JkZXIgYW5kIGFsdGVybmF0aXZlIGlucHV0LlxyXG4gKlxyXG4gKiBAYXV0aG9yIEplc3NlIEdyZWVuYmVyZyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgVGlueUVtaXR0ZXIgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9UaW55RW1pdHRlci5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IEJvdW5kczIgZnJvbSAnLi4vLi4vLi4vLi4vZG90L2pzL0JvdW5kczIuanMnO1xyXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gJy4uLy4uLy4uLy4uL2tpdGUvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCBDb25zdHJ1Y3RvciBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvQ29uc3RydWN0b3IuanMnO1xyXG5pbXBvcnQgSW50ZW50aW9uYWxBbnkgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL3R5cGVzL0ludGVudGlvbmFsQW55LmpzJztcclxuaW1wb3J0IFJlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb24gZnJvbSAnLi4vLi4vLi4vLi4vdXR0ZXJhbmNlLXF1ZXVlL2pzL1Jlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb24uanMnO1xyXG5pbXBvcnQgeyBEZWxheWVkTXV0YXRlLCBGb2N1cywgSGlnaGxpZ2h0LCBOb2RlLCBQRE9NSW5zdGFuY2UsIFJlYWRpbmdCbG9ja0hpZ2hsaWdodCwgUmVhZGluZ0Jsb2NrVXR0ZXJhbmNlLCBSZWFkaW5nQmxvY2tVdHRlcmFuY2VPcHRpb25zLCBzY2VuZXJ5LCBTY2VuZXJ5RXZlbnQsIFZvaWNpbmcsIHZvaWNpbmdNYW5hZ2VyLCBWb2ljaW5nT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgVElucHV0TGlzdGVuZXIgZnJvbSAnLi4vLi4vaW5wdXQvVElucHV0TGlzdGVuZXIuanMnO1xyXG5pbXBvcnQgeyBSZXNvbHZlZFJlc3BvbnNlLCBWb2ljaW5nUmVzcG9uc2UgfSBmcm9tICcuLi8uLi8uLi8uLi91dHRlcmFuY2UtcXVldWUvanMvUmVzcG9uc2VQYWNrZXQuanMnO1xyXG5pbXBvcnQgVXR0ZXJhbmNlIGZyb20gJy4uLy4uLy4uLy4uL3V0dGVyYW5jZS1xdWV1ZS9qcy9VdHRlcmFuY2UuanMnO1xyXG5pbXBvcnQgVEVtaXR0ZXIgZnJvbSAnLi4vLi4vLi4vLi4vYXhvbi9qcy9URW1pdHRlci5qcyc7XHJcbmltcG9ydCBtZW1vaXplIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy9tZW1vaXplLmpzJztcclxuaW1wb3J0IHsgVFZvaWNpbmcgfSBmcm9tICcuL1ZvaWNpbmcuanMnO1xyXG5cclxuY29uc3QgUkVBRElOR19CTE9DS19PUFRJT05fS0VZUyA9IFtcclxuICAncmVhZGluZ0Jsb2NrVGFnTmFtZScsXHJcbiAgJ3JlYWRpbmdCbG9ja05hbWVSZXNwb25zZScsXHJcbiAgJ3JlYWRpbmdCbG9ja0hpbnRSZXNwb25zZScsXHJcbiAgJ3JlYWRpbmdCbG9ja1Jlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb24nLFxyXG4gICdyZWFkaW5nQmxvY2tBY3RpdmVIaWdobGlnaHQnXHJcbl07XHJcblxyXG50eXBlIFNlbGZPcHRpb25zID0ge1xyXG4gIHJlYWRpbmdCbG9ja1RhZ05hbWU/OiBzdHJpbmcgfCBudWxsO1xyXG4gIHJlYWRpbmdCbG9ja05hbWVSZXNwb25zZT86IFZvaWNpbmdSZXNwb25zZTtcclxuICByZWFkaW5nQmxvY2tIaW50UmVzcG9uc2U/OiBWb2ljaW5nUmVzcG9uc2U7XHJcbiAgcmVhZGluZ0Jsb2NrUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbj86IFJlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb247XHJcbiAgcmVhZGluZ0Jsb2NrQWN0aXZlSGlnaGxpZ2h0PzogbnVsbCB8IFNoYXBlIHwgTm9kZTtcclxufTtcclxuXHJcbnR5cGUgVW5zdXBwb3J0ZWRWb2ljaW5nT3B0aW9ucyA9XHJcbiAgJ3ZvaWNpbmdOYW1lUmVzcG9uc2UnIHxcclxuICAndm9pY2luZ09iamVjdFJlc3BvbnNlJyB8XHJcbiAgJ3ZvaWNpbmdDb250ZXh0UmVzcG9uc2UnIHxcclxuICAndm9pY2luZ0hpbnRSZXNwb25zZScgfFxyXG4gICd2b2ljaW5nVXR0ZXJhbmNlJyB8XHJcbiAgJ3ZvaWNpbmdSZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uJztcclxuXHJcbmV4cG9ydCB0eXBlIFJlYWRpbmdCbG9ja09wdGlvbnMgPSBTZWxmT3B0aW9ucyAmXHJcbiAgU3RyaWN0T21pdDxWb2ljaW5nT3B0aW9ucywgVW5zdXBwb3J0ZWRWb2ljaW5nT3B0aW9ucz47XHJcblxyXG4vLyBVc2UgYW4gYXNzZXJ0aW9uIHNpZ25hdHVyZSB0byBuYXJyb3cgdGhlIHR5cGUgdG8gUmVhZGluZ0Jsb2NrVXR0ZXJhbmNlXHJcbmZ1bmN0aW9uIGFzc2VydFJlYWRpbmdCbG9ja1V0dGVyYW5jZSggdXR0ZXJhbmNlOiBVdHRlcmFuY2UgKTogYXNzZXJ0cyB1dHRlcmFuY2UgaXMgUmVhZGluZ0Jsb2NrVXR0ZXJhbmNlIHtcclxuICBpZiAoICEoIHV0dGVyYW5jZSBpbnN0YW5jZW9mIFJlYWRpbmdCbG9ja1V0dGVyYW5jZSApICkge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggZmFsc2UsICd1dHRlcmFuY2UgaXMgbm90IGEgUmVhZGluQmxvY2tVdHRlcmFuY2UnICk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBBbiBpbXBsZW1lbnRhdGlvbiBjbGFzcyBmb3IgUmVhZGluZ0Jsb2NrLnRzLCBvbmx5IHVzZWQgaW4gdGhpcyBjbGFzcyBzbyB0aGF0IHdlIGtub3cgaWYgd2Ugb3duIHRoZSBVdHRlcmFuY2UgYW5kIGNhblxyXG4vLyB0aGVyZWZvcmUgZGlzcG9zZSBpdC5cclxuY2xhc3MgT3duZWRSZWFkaW5nQmxvY2tVdHRlcmFuY2UgZXh0ZW5kcyBSZWFkaW5nQmxvY2tVdHRlcmFuY2Uge1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvciggZm9jdXM6IEZvY3VzIHwgbnVsbCwgcHJvdmlkZWRPcHRpb25zPzogUmVhZGluZ0Jsb2NrVXR0ZXJhbmNlT3B0aW9ucyApIHtcclxuICAgIHN1cGVyKCBmb2N1cywgcHJvdmlkZWRPcHRpb25zICk7XHJcbiAgfVxyXG59XHJcblxyXG5cclxuY29uc3QgREVGQVVMVF9DT05URU5UX0hJTlRfUEFUVEVSTiA9IG5ldyBSZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uKCB7XHJcbiAgbmFtZUhpbnQ6ICd7e05BTUV9fS4ge3tISU5UfX0nXHJcbn0gKTtcclxuXHJcbmV4cG9ydCB0eXBlIFRSZWFkaW5nQmxvY2sgPSB7XHJcbiAgcmVhZGluZ0Jsb2NrQWN0aXZlSGlnaGxpZ2h0Q2hhbmdlZEVtaXR0ZXI6IFRFbWl0dGVyO1xyXG4gIGdldCBpc1JlYWRpbmdCbG9jaygpOiBib29sZWFuO1xyXG4gIHNldFJlYWRpbmdCbG9ja1RhZ05hbWUoIHRhZ05hbWU6IHN0cmluZyB8IG51bGwgKTogdm9pZDtcclxuICByZWFkaW5nQmxvY2tUYWdOYW1lOiBzdHJpbmcgfCBudWxsO1xyXG4gIGdldFJlYWRpbmdCbG9ja1RhZ05hbWUoKTogc3RyaW5nIHwgbnVsbDtcclxuICBzZXRSZWFkaW5nQmxvY2tOYW1lUmVzcG9uc2UoIGNvbnRlbnQ6IFZvaWNpbmdSZXNwb25zZSApOiB2b2lkO1xyXG4gIHNldCByZWFkaW5nQmxvY2tOYW1lUmVzcG9uc2UoIGNvbnRlbnQ6IFZvaWNpbmdSZXNwb25zZSApO1xyXG4gIGdldCByZWFkaW5nQmxvY2tOYW1lUmVzcG9uc2UoKTogUmVzb2x2ZWRSZXNwb25zZTtcclxuICBnZXRSZWFkaW5nQmxvY2tOYW1lUmVzcG9uc2UoKTogUmVzb2x2ZWRSZXNwb25zZTtcclxuICBzZXRSZWFkaW5nQmxvY2tIaW50UmVzcG9uc2UoIGNvbnRlbnQ6IFZvaWNpbmdSZXNwb25zZSApOiB2b2lkO1xyXG4gIHNldCByZWFkaW5nQmxvY2tIaW50UmVzcG9uc2UoIGNvbnRlbnQ6IFZvaWNpbmdSZXNwb25zZSApO1xyXG4gIGdldCByZWFkaW5nQmxvY2tIaW50UmVzcG9uc2UoKTogUmVzb2x2ZWRSZXNwb25zZTtcclxuICBnZXRSZWFkaW5nQmxvY2tIaW50UmVzcG9uc2UoKTogUmVzb2x2ZWRSZXNwb25zZTtcclxuICBzZXRSZWFkaW5nQmxvY2tSZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uKCBwYXR0ZXJuczogUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbiApOiB2b2lkO1xyXG4gIHJlYWRpbmdCbG9ja1Jlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb246IFJlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb247XHJcbiAgZ2V0UmVhZGluZ0Jsb2NrUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbigpOiBSZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uO1xyXG4gIHNldFJlYWRpbmdCbG9ja0FjdGl2ZUhpZ2hsaWdodCggcmVhZGluZ0Jsb2NrQWN0aXZlSGlnaGxpZ2h0OiBIaWdobGlnaHQgKTogdm9pZDtcclxuICByZWFkaW5nQmxvY2tBY3RpdmVIaWdobGlnaHQ6IEhpZ2hsaWdodDtcclxuICBnZXRSZWFkaW5nQmxvY2tBY3RpdmVIaWdobGlnaHQoKTogSGlnaGxpZ2h0O1xyXG4gIGlzUmVhZGluZ0Jsb2NrQWN0aXZhdGVkKCk6IGJvb2xlYW47XHJcbiAgZ2V0IHJlYWRpbmdCbG9ja0FjdGl2YXRlZCgpOiBib29sZWFuO1xyXG59ICYgVFZvaWNpbmc7XHJcblxyXG5jb25zdCBSZWFkaW5nQmxvY2sgPSBtZW1vaXplKCA8U3VwZXJUeXBlIGV4dGVuZHMgQ29uc3RydWN0b3I8Tm9kZT4+KCBUeXBlOiBTdXBlclR5cGUgKTogU3VwZXJUeXBlICYgQ29uc3RydWN0b3I8VFJlYWRpbmdCbG9jaz4gPT4ge1xyXG5cclxuICBjb25zdCBSZWFkaW5nQmxvY2tDbGFzcyA9IERlbGF5ZWRNdXRhdGUoICdSZWFkaW5nQmxvY2snLCBSRUFESU5HX0JMT0NLX09QVElPTl9LRVlTLFxyXG4gICAgY2xhc3MgUmVhZGluZ0Jsb2NrQ2xhc3MgZXh0ZW5kcyBWb2ljaW5nKCBUeXBlICkgaW1wbGVtZW50cyBUUmVhZGluZ0Jsb2NrIHtcclxuXHJcbiAgICAgIC8vIFRoZSB0YWdOYW1lIHVzZWQgZm9yIHRoZSBSZWFkaW5nQmxvY2sgd2hlbiBcIlZvaWNpbmdcIiBpcyBlbmFibGVkLCBkZWZhdWx0XHJcbiAgICAgIC8vIG9mIGJ1dHRvbiBzbyB0aGF0IGl0IGlzIGFkZGVkIHRvIHRoZSBmb2N1cyBvcmRlciBhbmQgY2FuIHJlY2VpdmUgJ2NsaWNrJyBldmVudHMuIFlvdSBtYXkgd2lzaCB0byBzZXQgdGhpc1xyXG4gICAgICAvLyB0byBzb21lIG90aGVyIHRhZ05hbWUgb3Igc2V0IHRvIG51bGwgdG8gcmVtb3ZlIHRoZSBSZWFkaW5nQmxvY2sgZnJvbSB0aGUgZm9jdXMgb3JkZXIuIElmIHRoaXMgaXMgY2hhbmdlZCxcclxuICAgICAgLy8gYmUgc3VyZSB0aGF0IHRoZSBSZWFkaW5nQmxvY2sgd2lsbCBzdGlsbCByZXNwb25kIHRvIGBjbGlja2AgZXZlbnRzIHdoZW4gZW5hYmxlZC5cclxuICAgICAgcHJpdmF0ZSBfcmVhZGluZ0Jsb2NrVGFnTmFtZTogc3RyaW5nIHwgbnVsbDtcclxuXHJcbiAgICAgIC8vIFRoZSB0YWdOYW1lIHRvIGFwcGx5IHRvIHRoZSBOb2RlIHdoZW4gdm9pY2luZyBpcyBkaXNhYmxlZC5cclxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfcmVhZGluZ0Jsb2NrRGlzYWJsZWRUYWdOYW1lOiBzdHJpbmc7XHJcblxyXG4gICAgICAvLyBUaGUgaGlnaGxpZ2h0IHRoYXQgc3Vycm91bmRzIHRoaXMgUmVhZGluZ0Jsb2NrIHdoZW4gaXQgaXMgXCJhY3RpdmVcIiBhbmRcclxuICAgICAgLy8gdGhlIFZvaWNpbmcgZnJhbWV3b3JrIGlzIHNwZWFraW5nIHRoZSBjb250ZW50IGFzc29jaWF0ZWQgd2l0aCB0aGlzIE5vZGUuIEJ5IGRlZmF1bHQsIGEgc2VtaS10cmFuc3BhcmVudFxyXG4gICAgICAvLyB5ZWxsb3cgaGlnaGxpZ2h0IHN1cnJvdW5kcyB0aGlzIE5vZGUncyBib3VuZHMuXHJcbiAgICAgIHByaXZhdGUgX3JlYWRpbmdCbG9ja0FjdGl2ZUhpZ2hsaWdodDogSGlnaGxpZ2h0O1xyXG5cclxuICAgICAgLy8gKHNjZW5lcnktaW50ZXJuYWwpIC0gU2VuZHMgYSBtZXNzYWdlIHdoZW4gdGhlIGhpZ2hsaWdodCBmb3IgdGhlIFJlYWRpbmdCbG9jayBjaGFuZ2VzLiBVc2VkXHJcbiAgICAgIC8vIGJ5IHRoZSBIaWdobGlnaHRPdmVybGF5IHRvIHJlZHJhdyBpdCBpZiBpdCBjaGFuZ2VzIHdoaWxlIHRoZSBoaWdobGlnaHQgaXMgYWN0aXZlLlxyXG4gICAgICBwdWJsaWMgcmVhZGluZ0Jsb2NrQWN0aXZlSGlnaGxpZ2h0Q2hhbmdlZEVtaXR0ZXI6IFRFbWl0dGVyO1xyXG5cclxuICAgICAgLy8gVXBkYXRlcyB0aGUgaGl0IGJvdW5kcyBvZiB0aGlzIE5vZGUgd2hlbiB0aGUgbG9jYWwgYm91bmRzIGNoYW5nZS5cclxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfbG9jYWxCb3VuZHNDaGFuZ2VkTGlzdGVuZXI6IE9taXRUaGlzUGFyYW1ldGVyPCggbG9jYWxCb3VuZHM6IEJvdW5kczIgKSA9PiB2b2lkPjtcclxuXHJcbiAgICAgIC8vIFRyaWdnZXJzIGFjdGl2YXRpb24gb2YgdGhlIFJlYWRpbmdCbG9jaywgcmVxdWVzdGluZyBzcGVlY2ggb2YgaXRzIGNvbnRlbnQuXHJcbiAgICAgIHByaXZhdGUgcmVhZG9ubHkgX3JlYWRpbmdCbG9ja0lucHV0TGlzdGVuZXI6IFRJbnB1dExpc3RlbmVyO1xyXG5cclxuICAgICAgLy8gQ29udHJvbHMgd2hldGhlciB0aGUgUmVhZGluZ0Jsb2NrIHNob3VsZCBiZSBpbnRlcmFjdGl2ZSBhbmQgZm9jdXNhYmxlLiBBdCB0aGUgdGltZSBvZiB0aGlzIHdyaXRpbmcsIHRoYXQgaXMgdHJ1ZVxyXG4gICAgICAvLyBmb3IgYWxsIFJlYWRpbmdCbG9ja3Mgd2hlbiB0aGUgdm9pY2luZ01hbmFnZXIgaXMgZnVsbHkgZW5hYmxlZCBhbmQgY2FuIHNwZWFrLlxyXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IF9yZWFkaW5nQmxvY2tGb2N1c2FibGVDaGFuZ2VMaXN0ZW5lcjogT21pdFRoaXNQYXJhbWV0ZXI8KCBmb2N1c2FibGU6IGJvb2xlYW4gKSA9PiB2b2lkPjtcclxuXHJcbiAgICAgIHB1YmxpYyBjb25zdHJ1Y3RvciggLi4uYXJnczogSW50ZW50aW9uYWxBbnlbXSApIHtcclxuICAgICAgICBzdXBlciggLi4uYXJncyApO1xyXG5cclxuICAgICAgICB0aGlzLl9yZWFkaW5nQmxvY2tUYWdOYW1lID0gJ2J1dHRvbic7XHJcbiAgICAgICAgdGhpcy5fcmVhZGluZ0Jsb2NrRGlzYWJsZWRUYWdOYW1lID0gJ3AnO1xyXG4gICAgICAgIHRoaXMuX3JlYWRpbmdCbG9ja0FjdGl2ZUhpZ2hsaWdodCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5yZWFkaW5nQmxvY2tBY3RpdmVIaWdobGlnaHRDaGFuZ2VkRW1pdHRlciA9IG5ldyBUaW55RW1pdHRlcigpO1xyXG4gICAgICAgIHRoaXMucmVhZGluZ0Jsb2NrUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbiA9IERFRkFVTFRfQ09OVEVOVF9ISU5UX1BBVFRFUk47XHJcblxyXG4gICAgICAgIHRoaXMuX2xvY2FsQm91bmRzQ2hhbmdlZExpc3RlbmVyID0gdGhpcy5fb25Mb2NhbEJvdW5kc0NoYW5nZWQuYmluZCggdGhpcyApO1xyXG4gICAgICAgIHRoaXMubG9jYWxCb3VuZHNQcm9wZXJ0eS5saW5rKCB0aGlzLl9sb2NhbEJvdW5kc0NoYW5nZWRMaXN0ZW5lciApO1xyXG5cclxuICAgICAgICB0aGlzLl9yZWFkaW5nQmxvY2tJbnB1dExpc3RlbmVyID0ge1xyXG4gICAgICAgICAgZm9jdXM6IGV2ZW50ID0+IHRoaXMuX3NwZWFrUmVhZGluZ0Jsb2NrQ29udGVudExpc3RlbmVyKCBldmVudCApLFxyXG4gICAgICAgICAgdXA6IGV2ZW50ID0+IHRoaXMuX3NwZWFrUmVhZGluZ0Jsb2NrQ29udGVudExpc3RlbmVyKCBldmVudCApLFxyXG4gICAgICAgICAgY2xpY2s6IGV2ZW50ID0+IHRoaXMuX3NwZWFrUmVhZGluZ0Jsb2NrQ29udGVudExpc3RlbmVyKCBldmVudCApXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5fcmVhZGluZ0Jsb2NrRm9jdXNhYmxlQ2hhbmdlTGlzdGVuZXIgPSB0aGlzLl9vblJlYWRpbmdCbG9ja0ZvY3VzYWJsZUNoYW5nZWQuYmluZCggdGhpcyApO1xyXG4gICAgICAgIHZvaWNpbmdNYW5hZ2VyLnNwZWVjaEFsbG93ZWRBbmRGdWxseUVuYWJsZWRQcm9wZXJ0eS5saW5rKCB0aGlzLl9yZWFkaW5nQmxvY2tGb2N1c2FibGVDaGFuZ2VMaXN0ZW5lciApO1xyXG5cclxuICAgICAgICAvLyBBbGwgUmVhZGluZ0Jsb2NrcyBoYXZlIGEgUmVhZGluZ0Jsb2NrSGlnaGxpZ2h0LCBhIGZvY3VzIGhpZ2hsaWdodCB0aGF0IGlzIGJsYWNrIHRvIGluZGljYXRlIGl0IGhhc1xyXG4gICAgICAgIC8vIGEgZGlmZmVyZW50IGJlaGF2aW9yLlxyXG4gICAgICAgIHRoaXMuZm9jdXNIaWdobGlnaHQgPSBuZXcgUmVhZGluZ0Jsb2NrSGlnaGxpZ2h0KCB0aGlzICk7XHJcblxyXG4gICAgICAgIC8vIEFsbCBSZWFkaW5nQmxvY2tzIHVzZSBhIFJlYWRpbmdCbG9ja1V0dGVyYW5jZSB3aXRoIEZvY3VzIGFuZCBUcmFpbCBkYXRhIHRvIHRoaXMgTm9kZSBzbyB0aGF0IGl0IGNhbiBiZVxyXG4gICAgICAgIC8vIGhpZ2hsaWdodGVkIGluIHRoZSBGb2N1c092ZXJsYXkgd2hlbiB0aGlzIFV0dGVyYW5jZSBpcyBiZWluZyBhbm5vdW5jZWQuXHJcbiAgICAgICAgdGhpcy52b2ljaW5nVXR0ZXJhbmNlID0gbmV3IE93bmVkUmVhZGluZ0Jsb2NrVXR0ZXJhbmNlKCBudWxsICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBXaGV0aGVyIGEgTm9kZSBjb21wb3NlcyBSZWFkaW5nQmxvY2suXHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgZ2V0IGlzUmVhZGluZ0Jsb2NrKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogU2V0IHRoZSB0YWdOYW1lIGZvciB0aGUgbm9kZSBjb21wb3NpbmcgUmVhZGluZ0Jsb2NrLiBUaGlzIGlzIHRoZSB0YWdOYW1lIChvZiBQYXJhbGxlbERPTSkgdGhhdCB3aWxsIGJlIGFwcGxpZWRcclxuICAgICAgICogdG8gdGhpcyBOb2RlIHdoZW4gUmVhZGluZyBCbG9ja3MgYXJlIGVuYWJsZWQuXHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgc2V0UmVhZGluZ0Jsb2NrVGFnTmFtZSggdGFnTmFtZTogc3RyaW5nIHwgbnVsbCApOiB2b2lkIHtcclxuICAgICAgICB0aGlzLl9yZWFkaW5nQmxvY2tUYWdOYW1lID0gdGFnTmFtZTtcclxuICAgICAgICB0aGlzLl9vblJlYWRpbmdCbG9ja0ZvY3VzYWJsZUNoYW5nZWQoIHZvaWNpbmdNYW5hZ2VyLnNwZWVjaEFsbG93ZWRBbmRGdWxseUVuYWJsZWRQcm9wZXJ0eS52YWx1ZSApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwdWJsaWMgc2V0IHJlYWRpbmdCbG9ja1RhZ05hbWUoIHRhZ05hbWU6IHN0cmluZyB8IG51bGwgKSB7IHRoaXMuc2V0UmVhZGluZ0Jsb2NrVGFnTmFtZSggdGFnTmFtZSApOyB9XHJcblxyXG4gICAgICBwdWJsaWMgZ2V0IHJlYWRpbmdCbG9ja1RhZ05hbWUoKTogc3RyaW5nIHwgbnVsbCB7IHJldHVybiB0aGlzLmdldFJlYWRpbmdCbG9ja1RhZ05hbWUoKTsgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEdldCB0aGUgdGFnTmFtZSBmb3IgdGhpcyBOb2RlIChvZiBQYXJhbGxlbERPTSkgd2hlbiBSZWFkaW5nIEJsb2NrcyBhcmUgZW5hYmxlZC5cclxuICAgICAgICovXHJcbiAgICAgIHB1YmxpYyBnZXRSZWFkaW5nQmxvY2tUYWdOYW1lKCk6IHN0cmluZyB8IG51bGwge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9yZWFkaW5nQmxvY2tUYWdOYW1lO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogU2V0cyB0aGUgY29udGVudCB0aGF0IHNob3VsZCBiZSByZWFkIHdoZW5ldmVyIHRoZSBSZWFkaW5nQmxvY2sgcmVjZWl2ZXMgaW5wdXQgdGhhdCBpbml0aWF0ZXMgc3BlZWNoLlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIHNldFJlYWRpbmdCbG9ja05hbWVSZXNwb25zZSggY29udGVudDogVm9pY2luZ1Jlc3BvbnNlICk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuX3ZvaWNpbmdSZXNwb25zZVBhY2tldC5uYW1lUmVzcG9uc2UgPSBjb250ZW50O1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwdWJsaWMgc2V0IHJlYWRpbmdCbG9ja05hbWVSZXNwb25zZSggY29udGVudDogVm9pY2luZ1Jlc3BvbnNlICkgeyB0aGlzLnNldFJlYWRpbmdCbG9ja05hbWVSZXNwb25zZSggY29udGVudCApOyB9XHJcblxyXG4gICAgICBwdWJsaWMgZ2V0IHJlYWRpbmdCbG9ja05hbWVSZXNwb25zZSgpOiBSZXNvbHZlZFJlc3BvbnNlIHsgcmV0dXJuIHRoaXMuZ2V0UmVhZGluZ0Jsb2NrTmFtZVJlc3BvbnNlKCk7IH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBHZXRzIHRoZSBjb250ZW50IHRoYXQgaXMgc3Bva2VuIHdoZW5ldmVyIHRoZSBSZWFkaW5nQkxvY2sgcmVjZWl2ZXMgaW5wdXQgdGhhdCB3b3VsZCBpbml0aWF0ZSBzcGVlY2guXHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgZ2V0UmVhZGluZ0Jsb2NrTmFtZVJlc3BvbnNlKCk6IFJlc29sdmVkUmVzcG9uc2Uge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl92b2ljaW5nUmVzcG9uc2VQYWNrZXQubmFtZVJlc3BvbnNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogU2V0cyB0aGUgaGludCByZXNwb25zZSBmb3IgdGhpcyBSZWFkaW5nQmxvY2suIFRoaXMgaXMgb25seSBzcG9rZW4gaWYgXCJIZWxwZnVsIEhpbnRzXCIgYXJlIGVuYWJsZWQgYnkgdGhlIHVzZXIuXHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgc2V0UmVhZGluZ0Jsb2NrSGludFJlc3BvbnNlKCBjb250ZW50OiBWb2ljaW5nUmVzcG9uc2UgKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5fdm9pY2luZ1Jlc3BvbnNlUGFja2V0LmhpbnRSZXNwb25zZSA9IGNvbnRlbnQ7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHB1YmxpYyBzZXQgcmVhZGluZ0Jsb2NrSGludFJlc3BvbnNlKCBjb250ZW50OiBWb2ljaW5nUmVzcG9uc2UgKSB7IHRoaXMuc2V0UmVhZGluZ0Jsb2NrSGludFJlc3BvbnNlKCBjb250ZW50ICk7IH1cclxuXHJcbiAgICAgIHB1YmxpYyBnZXQgcmVhZGluZ0Jsb2NrSGludFJlc3BvbnNlKCk6IFJlc29sdmVkUmVzcG9uc2UgeyByZXR1cm4gdGhpcy5nZXRSZWFkaW5nQmxvY2tIaW50UmVzcG9uc2UoKTsgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEdldCB0aGUgaGludCByZXNwb25zZSBmb3IgdGhpcyBSZWFkaW5nQmxvY2suIFRoaXMgaXMgYWRkaXRpb25hbCBjb250ZW50IHRoYXQgaXMgb25seSByZWFkIGlmIFwiSGVscGZ1bCBIaW50c1wiXHJcbiAgICAgICAqIGFyZSBlbmFibGVkLlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIGdldFJlYWRpbmdCbG9ja0hpbnRSZXNwb25zZSgpOiBSZXNvbHZlZFJlc3BvbnNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdm9pY2luZ1Jlc3BvbnNlUGFja2V0LmhpbnRSZXNwb25zZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFNldHMgdGhlIGNvbGxlY3Rpb24gb2YgcGF0dGVybnMgdG8gdXNlIGZvciB2b2ljaW5nIHJlc3BvbnNlcywgY29udHJvbGxpbmcgdGhlIG9yZGVyLCBwdW5jdHVhdGlvbiwgYW5kXHJcbiAgICAgICAqIGFkZGl0aW9uYWwgY29udGVudCBmb3IgZWFjaCBjb21iaW5hdGlvbiBvZiByZXNwb25zZS4gU2VlIFJlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb24uanMgaWYgeW91IHdpc2ggdG8gdXNlXHJcbiAgICAgICAqIGEgY29sbGVjdGlvbiBvZiBzdHJpbmcgcGF0dGVybnMgdGhhdCBhcmUgbm90IHRoZSBkZWZhdWx0LlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIHNldFJlYWRpbmdCbG9ja1Jlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb24oIHBhdHRlcm5zOiBSZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uICk6IHZvaWQge1xyXG5cclxuICAgICAgICB0aGlzLl92b2ljaW5nUmVzcG9uc2VQYWNrZXQucmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbiA9IHBhdHRlcm5zO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwdWJsaWMgc2V0IHJlYWRpbmdCbG9ja1Jlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb24oIHBhdHRlcm5zOiBSZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uICkgeyB0aGlzLnNldFJlYWRpbmdCbG9ja1Jlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb24oIHBhdHRlcm5zICk7IH1cclxuXHJcbiAgICAgIHB1YmxpYyBnZXQgcmVhZGluZ0Jsb2NrUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbigpOiBSZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uIHsgcmV0dXJuIHRoaXMuZ2V0UmVhZGluZ0Jsb2NrUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbigpOyB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogR2V0IHRoZSBSZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uIG9iamVjdCB0aGF0IHRoaXMgUmVhZGluZ0Jsb2NrIE5vZGUgaXMgdXNpbmcgdG8gY29sbGVjdCByZXNwb25zZXMuXHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgZ2V0UmVhZGluZ0Jsb2NrUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbigpOiBSZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdm9pY2luZ1Jlc3BvbnNlUGFja2V0LnJlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb247XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBSZWFkaW5nQmxvY2sgbXVzdCB0YWtlIGEgUmVhZGluZ0Jsb2NrVXR0ZXJhbmNlIGZvciBpdHMgdm9pY2luZ1V0dGVyYW5jZS4gWW91IGdlbmVyYWxseSBzaG91bGRuJ3QgYmUgdXNpbmcgdGhpcy5cclxuICAgICAgICogQnV0IGlmIHlvdSBtdXN0LCB5b3UgYXJlIHJlc3BvbnNpYmxlIGZvciBzZXR0aW5nIHRoZSBSZWFkaW5nQmxvY2tVdHRlcmFuY2UucmVhZGluZ0Jsb2NrRm9jdXMgd2hlbiB0aGlzXHJcbiAgICAgICAqIFJlYWRpbmdCbG9jayBpcyBhY3RpdmF0ZWQgc28gdGhhdCBpdCBnZXRzIGhpZ2hsaWdodGVkIGNvcnJlY3RseS4gU2VlIGhvdyB0aGUgZGVmYXVsdCByZWFkaW5nQmxvY2tGb2N1cyBpcyBzZXQuXHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgb3ZlcnJpZGUgc2V0Vm9pY2luZ1V0dGVyYW5jZSggdXR0ZXJhbmNlOiBSZWFkaW5nQmxvY2tVdHRlcmFuY2UgKTogdm9pZCB7XHJcbiAgICAgICAgc3VwZXIuc2V0Vm9pY2luZ1V0dGVyYW5jZSggdXR0ZXJhbmNlICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHB1YmxpYyBvdmVycmlkZSBzZXQgdm9pY2luZ1V0dGVyYW5jZSggdXR0ZXJhbmNlOiBSZWFkaW5nQmxvY2tVdHRlcmFuY2UgKSB7IHN1cGVyLnZvaWNpbmdVdHRlcmFuY2UgPSB1dHRlcmFuY2U7IH1cclxuXHJcbiAgICAgIHB1YmxpYyBvdmVycmlkZSBnZXQgdm9pY2luZ1V0dGVyYW5jZSgpOiBSZWFkaW5nQmxvY2tVdHRlcmFuY2UgeyByZXR1cm4gdGhpcy5nZXRWb2ljaW5nVXR0ZXJhbmNlKCk7IH1cclxuXHJcbiAgICAgIHB1YmxpYyBvdmVycmlkZSBnZXRWb2ljaW5nVXR0ZXJhbmNlKCk6IFJlYWRpbmdCbG9ja1V0dGVyYW5jZSB7XHJcbiAgICAgICAgY29uc3QgdXR0ZXJhbmNlID0gc3VwZXIuZ2V0Vm9pY2luZ1V0dGVyYW5jZSgpO1xyXG4gICAgICAgIGFzc2VydFJlYWRpbmdCbG9ja1V0dGVyYW5jZSggdXR0ZXJhbmNlICk7XHJcbiAgICAgICAgcmV0dXJuIHV0dGVyYW5jZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcHVibGljIG92ZXJyaWRlIHNldFZvaWNpbmdOYW1lUmVzcG9uc2UoKTogdm9pZCB7IGFzc2VydCAmJiBhc3NlcnQoIGZhbHNlLCAnUmVhZGluZ0Jsb2NrcyBvbmx5IHN1cHBvcnQgc2V0dGluZyB0aGUgbmFtZSByZXNwb25zZSB2aWEgcmVhZGluZ0Jsb2NrTmFtZVJlc3BvbnNlJyApOyB9XHJcblxyXG4gICAgICBwdWJsaWMgb3ZlcnJpZGUgZ2V0Vm9pY2luZ05hbWVSZXNwb25zZSgpOiBJbnRlbnRpb25hbEFueSB7IGFzc2VydCAmJiBhc3NlcnQoIGZhbHNlLCAnUmVhZGluZ0Jsb2NrcyBvbmx5IHN1cHBvcnQgZ2V0dGluZyB0aGUgbmFtZSByZXNwb25zZSB2aWEgcmVhZGluZ0Jsb2NrTmFtZVJlc3BvbnNlJyApOyB9XHJcblxyXG4gICAgICBwdWJsaWMgb3ZlcnJpZGUgc2V0Vm9pY2luZ09iamVjdFJlc3BvbnNlKCk6IHZvaWQgeyBhc3NlcnQgJiYgYXNzZXJ0KCBmYWxzZSwgJ1JlYWRpbmdCbG9ja3MgZG8gbm90IHN1cHBvcnQgc2V0dGluZyBvYmplY3QgcmVzcG9uc2UnICk7IH1cclxuXHJcbiAgICAgIHB1YmxpYyBvdmVycmlkZSBnZXRWb2ljaW5nT2JqZWN0UmVzcG9uc2UoKTogSW50ZW50aW9uYWxBbnkgeyBhc3NlcnQgJiYgYXNzZXJ0KCBmYWxzZSwgJ1JlYWRpbmdCbG9ja3MgZG8gbm90IHN1cHBvcnQgc2V0dGluZyBvYmplY3QgcmVzcG9uc2UnICk7IH1cclxuXHJcbiAgICAgIHB1YmxpYyBvdmVycmlkZSBzZXRWb2ljaW5nQ29udGV4dFJlc3BvbnNlKCk6IHZvaWQgeyBhc3NlcnQgJiYgYXNzZXJ0KCBmYWxzZSwgJ1JlYWRpbmdCbG9ja3MgZG8gbm90IHN1cHBvcnQgc2V0dGluZyBjb250ZXh0IHJlc3BvbnNlJyApOyB9XHJcblxyXG4gICAgICBwdWJsaWMgb3ZlcnJpZGUgZ2V0Vm9pY2luZ0NvbnRleHRSZXNwb25zZSgpOiBJbnRlbnRpb25hbEFueSB7IGFzc2VydCAmJiBhc3NlcnQoIGZhbHNlLCAnUmVhZGluZ0Jsb2NrcyBkbyBub3Qgc3VwcG9ydCBzZXR0aW5nIGNvbnRleHQgcmVzcG9uc2UnICk7IH1cclxuXHJcbiAgICAgIHB1YmxpYyBvdmVycmlkZSBzZXRWb2ljaW5nSGludFJlc3BvbnNlKCk6IHZvaWQgeyBhc3NlcnQgJiYgYXNzZXJ0KCBmYWxzZSwgJ1JlYWRpbmdCbG9ja3Mgb25seSBzdXBwb3J0IHNldHRpbmcgdGhlIGhpbnQgcmVzcG9uc2UgdmlhIHJlYWRpbmdCbG9ja0hpbnRSZXNwb25zZS4nICk7IH1cclxuXHJcbiAgICAgIHB1YmxpYyBvdmVycmlkZSBnZXRWb2ljaW5nSGludFJlc3BvbnNlKCk6IEludGVudGlvbmFsQW55IHsgYXNzZXJ0ICYmIGFzc2VydCggZmFsc2UsICdSZWFkaW5nQmxvY2tzIG9ubHkgc3VwcG9ydCBnZXR0aW5nIHRoZSBoaW50IHJlc3BvbnNlIHZpYSByZWFkaW5nQmxvY2tIaW50UmVzcG9uc2UuJyApOyB9XHJcblxyXG4gICAgICBwdWJsaWMgb3ZlcnJpZGUgc2V0Vm9pY2luZ1Jlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb24oKTogdm9pZCB7IGFzc2VydCAmJiBhc3NlcnQoIGZhbHNlLCAnUmVhZGluZ0Jsb2NrcyBvbmx5IHN1cHBvcnQgc2V0dGluZyB0aGUgcmVzcG9uc2UgcGF0dGVybnMgdmlhIHJlYWRpbmdCbG9ja1Jlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb24uJyApOyB9XHJcblxyXG4gICAgICBwdWJsaWMgb3ZlcnJpZGUgZ2V0Vm9pY2luZ1Jlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb24oKTogSW50ZW50aW9uYWxBbnkgeyBhc3NlcnQgJiYgYXNzZXJ0KCBmYWxzZSwgJ1JlYWRpbmdCbG9ja3Mgb25seSBzdXBwb3J0IGdldHRpbmcgdGhlIHJlc3BvbnNlIHBhdHRlcm5zIHZpYSByZWFkaW5nQmxvY2tSZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uLicgKTsgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFNldHMgdGhlIGhpZ2hsaWdodCB1c2VkIHRvIHN1cnJvdW5kIHRoaXMgTm9kZSB3aGlsZSB0aGUgVm9pY2luZyBmcmFtZXdvcmsgaXMgc3BlYWtpbmcgdGhpcyBjb250ZW50LlxyXG4gICAgICAgKiBJZiBhIE5vZGUgaXMgcHJvdmlkZWQsIGRvIG5vdCBhZGQgdGhpcyBOb2RlIHRvIHRoZSBzY2VuZSBncmFwaCwgaXQgaXMgYWRkZWQgYW5kIG1hZGUgdmlzaWJsZSBieSB0aGUgSGlnaGxpZ2h0T3ZlcmxheS5cclxuICAgICAgICovXHJcbiAgICAgIHB1YmxpYyBzZXRSZWFkaW5nQmxvY2tBY3RpdmVIaWdobGlnaHQoIHJlYWRpbmdCbG9ja0FjdGl2ZUhpZ2hsaWdodDogSGlnaGxpZ2h0ICk6IHZvaWQge1xyXG4gICAgICAgIGlmICggdGhpcy5fcmVhZGluZ0Jsb2NrQWN0aXZlSGlnaGxpZ2h0ICE9PSByZWFkaW5nQmxvY2tBY3RpdmVIaWdobGlnaHQgKSB7XHJcbiAgICAgICAgICB0aGlzLl9yZWFkaW5nQmxvY2tBY3RpdmVIaWdobGlnaHQgPSByZWFkaW5nQmxvY2tBY3RpdmVIaWdobGlnaHQ7XHJcblxyXG4gICAgICAgICAgdGhpcy5yZWFkaW5nQmxvY2tBY3RpdmVIaWdobGlnaHRDaGFuZ2VkRW1pdHRlci5lbWl0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBwdWJsaWMgc2V0IHJlYWRpbmdCbG9ja0FjdGl2ZUhpZ2hsaWdodCggcmVhZGluZ0Jsb2NrQWN0aXZlSGlnaGxpZ2h0OiBIaWdobGlnaHQgKSB7IHRoaXMuc2V0UmVhZGluZ0Jsb2NrQWN0aXZlSGlnaGxpZ2h0KCByZWFkaW5nQmxvY2tBY3RpdmVIaWdobGlnaHQgKTsgfVxyXG5cclxuICAgICAgcHVibGljIGdldCByZWFkaW5nQmxvY2tBY3RpdmVIaWdobGlnaHQoKTogSGlnaGxpZ2h0IHsgcmV0dXJuIHRoaXMuX3JlYWRpbmdCbG9ja0FjdGl2ZUhpZ2hsaWdodDsgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFJldHVybnMgdGhlIGhpZ2hsaWdodCB1c2VkIHRvIHN1cnJvdW5kIHRoaXMgTm9kZSB3aGVuIHRoZSBWb2ljaW5nIGZyYW1ld29yayBpcyByZWFkaW5nIGl0c1xyXG4gICAgICAgKiBjb250ZW50LlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIGdldFJlYWRpbmdCbG9ja0FjdGl2ZUhpZ2hsaWdodCgpOiBIaWdobGlnaHQge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9yZWFkaW5nQmxvY2tBY3RpdmVIaWdobGlnaHQ7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBSZXR1cm5zIHRydWUgaWYgdGhpcyBSZWFkaW5nQmxvY2sgaXMgXCJhY3RpdmF0ZWRcIiwgaW5kaWNhdGluZyB0aGF0IGl0IGhhcyByZWNlaXZlZCBpbnRlcmFjdGlvblxyXG4gICAgICAgKiBhbmQgdGhlIFZvaWNpbmcgZnJhbWV3b3JrIGlzIHNwZWFraW5nIGl0cyBjb250ZW50LlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIGlzUmVhZGluZ0Jsb2NrQWN0aXZhdGVkKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIGxldCBhY3RpdmF0ZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgY29uc3QgdHJhaWxJZHMgPSBPYmplY3Qua2V5cyggdGhpcy5kaXNwbGF5cyApO1xyXG4gICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHRyYWlsSWRzLmxlbmd0aDsgaSsrICkge1xyXG5cclxuICAgICAgICAgIGNvbnN0IHBvaW50ZXJGb2N1cyA9IHRoaXMuZGlzcGxheXNbIHRyYWlsSWRzWyBpIF0gXS5mb2N1c01hbmFnZXIucmVhZGluZ0Jsb2NrRm9jdXNQcm9wZXJ0eS52YWx1ZTtcclxuICAgICAgICAgIGlmICggcG9pbnRlckZvY3VzICYmIHBvaW50ZXJGb2N1cy50cmFpbC5sYXN0Tm9kZSgpID09PSB0aGlzICkge1xyXG4gICAgICAgICAgICBhY3RpdmF0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFjdGl2YXRlZDtcclxuICAgICAgfVxyXG5cclxuICAgICAgcHVibGljIGdldCByZWFkaW5nQmxvY2tBY3RpdmF0ZWQoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmlzUmVhZGluZ0Jsb2NrQWN0aXZhdGVkKCk7IH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBXaGVuIHRoaXMgTm9kZSBiZWNvbWVzIGZvY3VzYWJsZSAoYmVjYXVzZSBSZWFkaW5nIEJsb2NrcyBoYXZlIGp1c3QgYmVlbiBlbmFibGVkIG9yIGRpc2FibGVkKSwgZWl0aGVyXHJcbiAgICAgICAqIGFwcGx5IG9yIHJlbW92ZSB0aGUgcmVhZGluZ0Jsb2NrVGFnTmFtZS5cclxuICAgICAgICpcclxuICAgICAgICogQHBhcmFtIGZvY3VzYWJsZSAtIHdoZXRoZXIgUmVhZGluZ0Jsb2NrcyBzaG91bGQgYmUgZm9jdXNhYmxlXHJcbiAgICAgICAqL1xyXG4gICAgICBwcml2YXRlIF9vblJlYWRpbmdCbG9ja0ZvY3VzYWJsZUNoYW5nZWQoIGZvY3VzYWJsZTogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmZvY3VzYWJsZSA9IGZvY3VzYWJsZTtcclxuXHJcbiAgICAgICAgaWYgKCBmb2N1c2FibGUgKSB7XHJcbiAgICAgICAgICB0aGlzLnRhZ05hbWUgPSB0aGlzLl9yZWFkaW5nQmxvY2tUYWdOYW1lO1xyXG5cclxuICAgICAgICAgIC8vIGRvbid0IGFkZCB0aGUgaW5wdXQgbGlzdGVuZXIgaWYgd2UgYXJlIGFscmVhZHkgYWN0aXZlLCB3ZSBtYXkganVzdCBiZSB1cGRhdGluZyB0aGUgdGFnTmFtZSBpbiB0aGlzIGNhc2VcclxuICAgICAgICAgIGlmICggIXRoaXMuaGFzSW5wdXRMaXN0ZW5lciggdGhpcy5fcmVhZGluZ0Jsb2NrSW5wdXRMaXN0ZW5lciApICkge1xyXG4gICAgICAgICAgICB0aGlzLmFkZElucHV0TGlzdGVuZXIoIHRoaXMuX3JlYWRpbmdCbG9ja0lucHV0TGlzdGVuZXIgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLnRhZ05hbWUgPSB0aGlzLl9yZWFkaW5nQmxvY2tEaXNhYmxlZFRhZ05hbWU7XHJcbiAgICAgICAgICBpZiAoIHRoaXMuaGFzSW5wdXRMaXN0ZW5lciggdGhpcy5fcmVhZGluZ0Jsb2NrSW5wdXRMaXN0ZW5lciApICkge1xyXG4gICAgICAgICAgICB0aGlzLnJlbW92ZUlucHV0TGlzdGVuZXIoIHRoaXMuX3JlYWRpbmdCbG9ja0lucHV0TGlzdGVuZXIgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBVcGRhdGUgdGhlIGhpdCBhcmVhcyBmb3IgdGhpcyBOb2RlIHdoZW5ldmVyIHRoZSBib3VuZHMgY2hhbmdlLlxyXG4gICAgICAgKi9cclxuICAgICAgcHJpdmF0ZSBfb25Mb2NhbEJvdW5kc0NoYW5nZWQoIGxvY2FsQm91bmRzOiBCb3VuZHMyICk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMubW91c2VBcmVhID0gbG9jYWxCb3VuZHM7XHJcbiAgICAgICAgdGhpcy50b3VjaEFyZWEgPSBsb2NhbEJvdW5kcztcclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFNwZWFrIHRoZSBjb250ZW50IGFzc29jaWF0ZWQgd2l0aCB0aGUgUmVhZGluZ0Jsb2NrLiBTZXRzIHRoZSByZWFkaW5nQmxvY2tGb2N1c1Byb3BlcnRpZXMgb25cclxuICAgICAgICogdGhlIGRpc3BsYXlzIHNvIHRoYXQgSGlnaGxpZ2h0T3ZlcmxheXMga25vdyB0byBhY3RpdmF0ZSBhIGhpZ2hsaWdodCB3aGlsZSB0aGUgdm9pY2luZ01hbmFnZXJcclxuICAgICAgICogaXMgcmVhZGluZyBhYm91dCB0aGlzIE5vZGUuXHJcbiAgICAgICAqL1xyXG4gICAgICBwcml2YXRlIF9zcGVha1JlYWRpbmdCbG9ja0NvbnRlbnRMaXN0ZW5lciggZXZlbnQ6IFNjZW5lcnlFdmVudCApOiB2b2lkIHtcclxuXHJcbiAgICAgICAgY29uc3QgZGlzcGxheXMgPSB0aGlzLmdldENvbm5lY3RlZERpc3BsYXlzKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlYWRpbmdCbG9ja1V0dGVyYW5jZSA9IHRoaXMudm9pY2luZ1V0dGVyYW5jZTtcclxuXHJcbiAgICAgICAgY29uc3QgY29udGVudCA9IHRoaXMuY29sbGVjdFJlc3BvbnNlKCB7XHJcbiAgICAgICAgICBuYW1lUmVzcG9uc2U6IHRoaXMuZ2V0UmVhZGluZ0Jsb2NrTmFtZVJlc3BvbnNlKCksXHJcbiAgICAgICAgICBoaW50UmVzcG9uc2U6IHRoaXMuZ2V0UmVhZGluZ0Jsb2NrSGludFJlc3BvbnNlKCksXHJcbiAgICAgICAgICBpZ25vcmVQcm9wZXJ0aWVzOiB0aGlzLnZvaWNpbmdJZ25vcmVWb2ljaW5nTWFuYWdlclByb3BlcnRpZXMsXHJcbiAgICAgICAgICByZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uOiB0aGlzLl92b2ljaW5nUmVzcG9uc2VQYWNrZXQucmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbixcclxuICAgICAgICAgIHV0dGVyYW5jZTogcmVhZGluZ0Jsb2NrVXR0ZXJhbmNlXHJcbiAgICAgICAgfSApO1xyXG4gICAgICAgIGlmICggY29udGVudCApIHtcclxuICAgICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGRpc3BsYXlzLmxlbmd0aDsgaSsrICkge1xyXG5cclxuICAgICAgICAgICAgaWYgKCAhdGhpcy5nZXREZXNjZW5kYW50c1VzZUhpZ2hsaWdodGluZyggZXZlbnQudHJhaWwgKSApIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gdGhlIFNjZW5lcnlFdmVudCBtaWdodCBoYXZlIGdvbmUgdGhyb3VnaCBhIGRlc2NlbmRhbnQgb2YgdGhpcyBOb2RlXHJcbiAgICAgICAgICAgICAgY29uc3Qgcm9vdFRvU2VsZiA9IGV2ZW50LnRyYWlsLnN1YnRyYWlsVG8oIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gdGhlIHRyYWlsIHRvIGEgTm9kZSBtYXkgYmUgZGlzY29udGludW91cyBmb3IgUERPTSBldmVudHMgZHVlIHRvIHBkb21PcmRlcixcclxuICAgICAgICAgICAgICAvLyB0aGlzIGZpbmRzIHRoZSBhY3R1YWwgdmlzdWFsIHRyYWlsIHRvIHVzZVxyXG4gICAgICAgICAgICAgIGNvbnN0IHZpc3VhbFRyYWlsID0gUERPTUluc3RhbmNlLmd1ZXNzVmlzdWFsVHJhaWwoIHJvb3RUb1NlbGYsIGRpc3BsYXlzWyBpIF0ucm9vdE5vZGUgKTtcclxuXHJcbiAgICAgICAgICAgICAgY29uc3QgZm9jdXMgPSBuZXcgRm9jdXMoIGRpc3BsYXlzWyBpIF0sIHZpc3VhbFRyYWlsICk7XHJcbiAgICAgICAgICAgICAgcmVhZGluZ0Jsb2NrVXR0ZXJhbmNlLnJlYWRpbmdCbG9ja0ZvY3VzID0gZm9jdXM7XHJcbiAgICAgICAgICAgICAgdGhpcy5zcGVha0NvbnRlbnQoIGNvbnRlbnQgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIElmIHdlIGNyZWF0ZWQgYW5kIG93biB0aGUgdm9pY2luZ1V0dGVyYW5jZSB3ZSBjYW4gZnVsbHkgZGlzcG9zZSBvZiBpdC5cclxuICAgICAgICogQG1peGluLXByb3RlY3RlZCAtIG1hZGUgcHVibGljIGZvciB1c2UgaW4gdGhlIG1peGluIG9ubHlcclxuICAgICAgICovXHJcbiAgICAgIHB1YmxpYyBvdmVycmlkZSBjbGVhblZvaWNpbmdVdHRlcmFuY2UoKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKCB0aGlzLl92b2ljaW5nVXR0ZXJhbmNlIGluc3RhbmNlb2YgT3duZWRSZWFkaW5nQmxvY2tVdHRlcmFuY2UgKSB7XHJcbiAgICAgICAgICB0aGlzLl92b2ljaW5nVXR0ZXJhbmNlLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3VwZXIuY2xlYW5Wb2ljaW5nVXR0ZXJhbmNlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHB1YmxpYyBvdmVycmlkZSBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgICAgIHZvaWNpbmdNYW5hZ2VyLnNwZWVjaEFsbG93ZWRBbmRGdWxseUVuYWJsZWRQcm9wZXJ0eS51bmxpbmsoIHRoaXMuX3JlYWRpbmdCbG9ja0ZvY3VzYWJsZUNoYW5nZUxpc3RlbmVyICk7XHJcbiAgICAgICAgdGhpcy5sb2NhbEJvdW5kc1Byb3BlcnR5LnVubGluayggdGhpcy5fbG9jYWxCb3VuZHNDaGFuZ2VkTGlzdGVuZXIgKTtcclxuXHJcbiAgICAgICAgLy8gcmVtb3ZlIHRoZSBpbnB1dCBsaXN0ZW5lciB0aGF0IGFjdGl2YXRlcyB0aGUgUmVhZGluZ0Jsb2NrLCBvbmx5IGRvIHRoaXMgaWYgdGhlIGxpc3RlbmVyIGlzIGF0dGFjaGVkIHdoaWxlXHJcbiAgICAgICAgLy8gdGhlIFJlYWRpbmdCbG9jayBpcyBlbmFibGVkXHJcbiAgICAgICAgaWYgKCB0aGlzLmhhc0lucHV0TGlzdGVuZXIoIHRoaXMuX3JlYWRpbmdCbG9ja0lucHV0TGlzdGVuZXIgKSApIHtcclxuICAgICAgICAgIHRoaXMucmVtb3ZlSW5wdXRMaXN0ZW5lciggdGhpcy5fcmVhZGluZ0Jsb2NrSW5wdXRMaXN0ZW5lciApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3VwZXIuZGlzcG9zZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwdWJsaWMgb3ZlcnJpZGUgbXV0YXRlKCBvcHRpb25zPzogU2VsZk9wdGlvbnMgJiBQYXJhbWV0ZXJzPEluc3RhbmNlVHlwZTxTdXBlclR5cGU+WyAnbXV0YXRlJyBdPlsgMCBdICk6IHRoaXMge1xyXG4gICAgICAgIHJldHVybiBzdXBlci5tdXRhdGUoIG9wdGlvbnMgKTtcclxuICAgICAgfVxyXG4gICAgfSApO1xyXG5cclxuICAvKipcclxuICAgKiB7QXJyYXkuPHN0cmluZz59IC0gU3RyaW5nIGtleXMgZm9yIGFsbCB0aGUgYWxsb3dlZCBvcHRpb25zIHRoYXQgd2lsbCBiZSBzZXQgYnkgTm9kZS5tdXRhdGUoIG9wdGlvbnMgKSwgaW5cclxuICAgKiB0aGUgb3JkZXIgdGhleSB3aWxsIGJlIGV2YWx1YXRlZC5cclxuICAgKlxyXG4gICAqIE5PVEU6IFNlZSBOb2RlJ3MgX211dGF0b3JLZXlzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24gb24gaG93IHRoaXMgb3BlcmF0ZXMsIGFuZCBwb3RlbnRpYWwgc3BlY2lhbFxyXG4gICAqICAgICAgIGNhc2VzIHRoYXQgbWF5IGFwcGx5LlxyXG4gICAqL1xyXG4gIFJlYWRpbmdCbG9ja0NsYXNzLnByb3RvdHlwZS5fbXV0YXRvcktleXMgPSBSRUFESU5HX0JMT0NLX09QVElPTl9LRVlTLmNvbmNhdCggUmVhZGluZ0Jsb2NrQ2xhc3MucHJvdG90eXBlLl9tdXRhdG9yS2V5cyApO1xyXG4gIGFzc2VydCAmJiBhc3NlcnQoIFJlYWRpbmdCbG9ja0NsYXNzLnByb3RvdHlwZS5fbXV0YXRvcktleXMubGVuZ3RoID09PSBfLnVuaXEoIFJlYWRpbmdCbG9ja0NsYXNzLnByb3RvdHlwZS5fbXV0YXRvcktleXMgKS5sZW5ndGgsXHJcbiAgICAneCBtdXRhdG9yIGtleXMgaW4gUmVhZGluZ0Jsb2NrJyApO1xyXG5cclxuICByZXR1cm4gUmVhZGluZ0Jsb2NrQ2xhc3M7XHJcbn0gKTtcclxuXHJcbi8vIEV4cG9ydCBhIHR5cGUgdGhhdCBsZXRzIHlvdSBjaGVjayBpZiB5b3VyIE5vZGUgaXMgY29tcG9zZWQgd2l0aCBSZWFkaW5nQmxvY2tcclxuZXhwb3J0IHR5cGUgUmVhZGluZ0Jsb2NrTm9kZSA9IE5vZGUgJiBUUmVhZGluZ0Jsb2NrO1xyXG5cclxuc2NlbmVyeS5yZWdpc3RlciggJ1JlYWRpbmdCbG9jaycsIFJlYWRpbmdCbG9jayApO1xyXG5leHBvcnQgZGVmYXVsdCBSZWFkaW5nQmxvY2s7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxXQUFXLE1BQU0sb0NBQW9DO0FBTTVELE9BQU9DLHlCQUF5QixNQUFNLDZEQUE2RDtBQUNuRyxTQUFTQyxhQUFhLEVBQUVDLEtBQUssRUFBbUJDLFlBQVksRUFBRUMscUJBQXFCLEVBQUVDLHFCQUFxQixFQUFnQ0MsT0FBTyxFQUFnQkMsT0FBTyxFQUFFQyxjQUFjLFFBQXdCLGtCQUFrQjtBQUtsTyxPQUFPQyxPQUFPLE1BQU0scUNBQXFDO0FBR3pELE1BQU1DLHlCQUF5QixHQUFHLENBQ2hDLHFCQUFxQixFQUNyQiwwQkFBMEIsRUFDMUIsMEJBQTBCLEVBQzFCLHVDQUF1QyxFQUN2Qyw2QkFBNkIsQ0FDOUI7QUFxQkQ7QUFDQSxTQUFTQywyQkFBMkJB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