// Copyright 2021-2024, University of Colorado Boulder

/**
 * A trait for Node that supports the Voicing feature, under accessibility. Allows you to define responses for the Node
 * and make requests to speak that content using HTML5 SpeechSynthesis and the UtteranceQueue. Voicing content is
 * organized into four categories which are responsible for describing different things. Responses are stored on the
 * composed type: "ResponsePacket." See that file for details about what responses it stores. Output of this content
 * can be controlled by the responseCollector. Responses are defined as the following. . .
 *
 * - "Name" response: The name of the object that uses Voicing. Similar to the "Accessible Name" in web accessibility.
 * - "Object" response: The state information about the object that uses Voicing.
 * - "Context" response: The contextual changes that result from interaction with the Node that uses Voicing.
 * - "Hint" response: A supporting hint that guides the user toward a desired interaction with this Node.
 *
 * See ResponsePacket, as well as the property and setter documentation for each of these responses for more
 * information.
 *
 * Once this content is set, you can make a request to speak it using an UtteranceQueue with one of the provided
 * functions in this Trait. It is up to you to call one of these functions when you wish for speech to be made. The only
 * exception is on the 'focus' event. Every Node that composes Voicing will speak its responses by when it
 * receives focus.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import inheritance from '../../../../phet-core/js/inheritance.js';
import ResponsePacket from '../../../../utterance-queue/js/ResponsePacket.js';
import Utterance from '../../../../utterance-queue/js/Utterance.js';
import { DelayedMutate, InteractiveHighlighting, Node, scenery, voicingUtteranceQueue } from '../../imports.js';
import { combineOptions } from '../../../../phet-core/js/optionize.js';
import responseCollector from '../../../../utterance-queue/js/responseCollector.js';
import TinyProperty from '../../../../axon/js/TinyProperty.js';
import Tandem from '../../../../tandem/js/Tandem.js';
// Helps enforce that the utterance is defined.
function assertUtterance(utterance) {
  if (!(utterance instanceof Utterance)) {
    throw new Error('utterance is not an Utterance');
  }
}

// An implementation class for Voicing.ts, only used in this class so that we know if we own the Utterance and can
// therefore dispose it.
class OwnedVoicingUtterance extends Utterance {
  constructor(providedOptions) {
    super(providedOptions);
  }
}

// options that are supported by Voicing.js. Added to mutator keys so that Voicing properties can be set with mutate.
const VOICING_OPTION_KEYS = ['voicingNameResponse', 'voicingObjectResponse', 'voicingContextResponse', 'voicingHintResponse', 'voicingUtterance', 'voicingResponsePatternCollection', 'voicingIgnoreVoicingManagerProperties', 'voicingFocusListener'];

// Normally our project prefers type aliases to interfaces, but interfaces are necessary for correct usage of "this", see https://github.com/phetsims/tasks/issues/1132
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions

const Voicing = Type => {
  assert && assert(_.includes(inheritance(Type), Node), 'Only Node subtypes should compose Voicing');
  const VoicingClass = DelayedMutate('Voicing', VOICING_OPTION_KEYS, class VoicingClass extends InteractiveHighlighting(Type) {
    // ResponsePacket that holds all the supported responses to be Voiced

    // The utterance that all responses are spoken through.
    // @mixin-protected - made public for use in the mixin only

    // Called when this node is focused.

    // Indicates whether this Node can speak. A Node can speak if self and all of its ancestors are visible and
    // voicingVisible. This is private because its value depends on the state of the Instance tree. Listening to this
    // to change the scene graph state can be incredibly dangerous and buggy, see https://github.com/phetsims/scenery/issues/1615
    // @mixin-private - private to this file, but public needed for the interface

    // A counter that keeps track of visible and voicingVisible Instances of this Node.
    // As long as this value is greater than zero, this Node can speak. See onInstanceVisibilityChange
    // and onInstanceVoicingVisibilityChange for more implementation details.

    // Called when `canVoiceEmitter` emits for an Instance.

    // Whenever an Instance of this Node is added or removed, add/remove listeners that will update the
    // canSpeakProperty.

    // Input listener that speaks content on focus. This is the only input listener added
    // by Voicing, but it is the one that is consistent for all Voicing nodes. On focus, speak the name, object
    // response, and interaction hint.

    constructor(...args) {
      super(...args);

      // Bind the listeners on construction to be added to observables on initialize and removed on clean/dispose.
      // Instances are updated asynchronously in updateDisplay. The bind creates a new function and we need the
      // reference to persist through the completion of initialize and disposal.
      this._boundInstanceCanVoiceChangeListener = this.onInstanceCanVoiceChange.bind(this);
      this._voicingUtterance = null;

      // We only want to call this method, not any subtype implementation
      VoicingClass.prototype.initialize.call(this);
    }

    // Separate from the constructor to support cases where Voicing is used in Poolable Nodes.
    // ...args: IntentionalAny[] because things like RichTextLink need to provide arguments to initialize, and TS complains
    // otherwise
    initialize(...args) {
      // @ts-expect-error
      super.initialize && super.initialize(args);
      this._voicingCanSpeakProperty = new TinyProperty(true);
      this._voicingResponsePacket = new ResponsePacket();
      this._voicingFocusListener = this.defaultFocusListener;

      // Sets the default voicingUtterance and makes this.canSpeakProperty a dependency on its ability to announce.
      this.setVoicingUtterance(new OwnedVoicingUtterance());
      this._voicingCanSpeakCount = 0;
      this._boundInstancesChangedListener = this.addOrRemoveInstanceListeners.bind(this);

      // This is potentially dangerous to listen to generally, but in this case it is safe because the state we change
      // will only affect how we voice (part of the audio view), and not part of this display's scene graph.
      this.changedInstanceEmitter.addListener(this._boundInstancesChangedListener);
      this._speakContentOnFocusListener = {
        focus: event => {
          this._voicingFocusListener && this._voicingFocusListener(event);
        }
      };
      this.addInputListener(this._speakContentOnFocusListener);
      return this;
    }

    /**
     * Speak all responses assigned to this Node. Options allow you to override a responses for this particular
     * speech request. Each response is only spoken if the associated Property of responseCollector is true. If
     * all are Properties are false, nothing will be spoken.
     */
    voicingSpeakFullResponse(providedOptions) {
      // options are passed along to collectAndSpeakResponse, see that function for additional options
      const options = combineOptions({}, providedOptions);

      // Lazily formulate strings only as needed
      if (!options.hasOwnProperty('nameResponse')) {
        options.nameResponse = this._voicingResponsePacket.nameResponse;
      }
      if (!options.hasOwnProperty('objectResponse')) {
        options.objectResponse = this._voicingResponsePacket.objectResponse;
      }
      if (!options.hasOwnProperty('contextResponse')) {
        options.contextResponse = this._voicingResponsePacket.contextResponse;
      }
      if (!options.hasOwnProperty('hintResponse')) {
        options.hintResponse = this._voicingResponsePacket.hintResponse;
      }
      this.collectAndSpeakResponse(options);
    }

    /**
     * Speak ONLY the provided responses that you pass in with options. This will NOT speak the name, object,
     * context, or hint responses assigned to this node by default. But it allows for clarity at usages so it is
     * clear that you are only requesting certain responses. If you want to speak all of the responses assigned
     * to this Node, use voicingSpeakFullResponse().
     *
     * Each response will only be spoken if the Properties of responseCollector are true. If all of those are false,
     * nothing will be spoken.
     */
    voicingSpeakResponse(providedOptions) {
      // options are passed along to collectAndSpeakResponse, see that function for additional options
      const options = combineOptions({
        nameResponse: null,
        objectResponse: null,
        contextResponse: null,
        hintResponse: null
      }, providedOptions);
      this.collectAndSpeakResponse(options);
    }

    /**
     * By default, speak the name response. But accepts all other responses through options. Respects responseCollector
     * Properties, so the name response may not be spoken if responseCollector.nameResponseEnabledProperty is false.
     */
    voicingSpeakNameResponse(providedOptions) {
      // options are passed along to collectAndSpeakResponse, see that function for additional options
      const options = combineOptions({}, providedOptions);

      // Lazily formulate strings only as needed
      if (!options.hasOwnProperty('nameResponse')) {
        options.nameResponse = this._voicingResponsePacket.nameResponse;
      }
      this.collectAndSpeakResponse(options);
    }

    /**
     * By default, speak the object response. But accepts all other responses through options. Respects responseCollector
     * Properties, so the object response may not be spoken if responseCollector.objectResponseEnabledProperty is false.
     */
    voicingSpeakObjectResponse(providedOptions) {
      // options are passed along to collectAndSpeakResponse, see that function for additional options
      const options = combineOptions({}, providedOptions);

      // Lazily formulate strings only as needed
      if (!options.hasOwnProperty('objectResponse')) {
        options.objectResponse = this._voicingResponsePacket.objectResponse;
      }
      this.collectAndSpeakResponse(options);
    }

    /**
     * By default, speak the context response. But accepts all other responses through options. Respects
     * responseCollector Properties, so the context response may not be spoken if
     * responseCollector.contextResponseEnabledProperty is false.
     */
    voicingSpeakContextResponse(providedOptions) {
      // options are passed along to collectAndSpeakResponse, see that function for additional options
      const options = combineOptions({}, providedOptions);

      // Lazily formulate strings only as needed
      if (!options.hasOwnProperty('contextResponse')) {
        options.contextResponse = this._voicingResponsePacket.contextResponse;
      }
      this.collectAndSpeakResponse(options);
    }

    /**
     * By default, speak the hint response. But accepts all other responses through options. Respects
     * responseCollector Properties, so the hint response may not be spoken if
     * responseCollector.hintResponseEnabledProperty is false.
     */
    voicingSpeakHintResponse(providedOptions) {
      // options are passed along to collectAndSpeakResponse, see that function for additional options
      const options = combineOptions({}, providedOptions);

      // Lazily formulate strings only as needed
      if (!options.hasOwnProperty('hintResponse')) {
        options.hintResponse = this._voicingResponsePacket.hintResponse;
      }
      this.collectAndSpeakResponse(options);
    }

    /**
     * Collect responses with the responseCollector and speak the output with an UtteranceQueue.
     */
    collectAndSpeakResponse(providedOptions) {
      this.speakContent(this.collectResponse(providedOptions));
    }

    /**
     * Combine all types of response into a single alertable, potentially depending on the current state of
     * responseCollector Properties (filtering what kind of responses to present in the resolved response).
     * @mixin-protected - made public for use in the mixin only
     */
    collectResponse(providedOptions) {
      const options = combineOptions({
        ignoreProperties: this._voicingResponsePacket.ignoreProperties,
        responsePatternCollection: this._voicingResponsePacket.responsePatternCollection,
        utterance: this.voicingUtterance
      }, providedOptions);
      let response = responseCollector.collectResponses(options);
      if (options.utterance) {
        options.utterance.alert = response;
        response = options.utterance;
      }
      return response;
    }

    /**
     * Use the provided function to create content to speak in response to input. The content is then added to the
     * back of the voicing UtteranceQueue.
     */
    speakContent(content) {
      const notPhetioArchetype = !Tandem.PHET_IO_ENABLED || !this.isInsidePhetioArchetype();

      // don't send to utteranceQueue if response is empty
      // don't send to utteranceQueue for PhET-iO dynamic element archetypes, https://github.com/phetsims/joist/issues/817
      if (content && notPhetioArchetype) {
        voicingUtteranceQueue.addToBack(content); // eslint-disable-line bad-sim-text
      }
    }

    /**
     * Sets the voicingNameResponse for this Node. This is usually the label of the element and is spoken
     * when the object receives input. When requesting speech, this will only be spoken if
     * responseCollector.nameResponsesEnabledProperty is set to true.
     */
    setVoicingNameResponse(response) {
      this._voicingResponsePacket.nameResponse = response;
    }
    set voicingNameResponse(response) {
      this.setVoicingNameResponse(response);
    }
    get voicingNameResponse() {
      return this.getVoicingNameResponse();
    }

    /**
     * Get the voicingNameResponse for this Node.
     */
    getVoicingNameResponse() {
      return this._voicingResponsePacket.nameResponse;
    }

    /**
     * Set the object response for this Node. This is usually the state information associated with this Node, such
     * as its current input value. When requesting speech, this will only be heard when
     * responseCollector.objectResponsesEnabledProperty is set to true.
     */
    setVoicingObjectResponse(response) {
      this._voicingResponsePacket.objectResponse = response;
    }
    set voicingObjectResponse(response) {
      this.setVoicingObjectResponse(response);
    }
    get voicingObjectResponse() {
      return this.getVoicingObjectResponse();
    }

    /**
     * Gets the object response for this Node.
     */
    getVoicingObjectResponse() {
      return this._voicingResponsePacket.objectResponse;
    }

    /**
     * Set the context response for this Node. This is usually the content that describes what has happened in
     * the surrounding application in response to interaction with this Node. When requesting speech, this will
     * only be heard if responseCollector.contextResponsesEnabledProperty is set to true.
     */
    setVoicingContextResponse(response) {
      this._voicingResponsePacket.contextResponse = response;
    }
    set voicingContextResponse(response) {
      this.setVoicingContextResponse(response);
    }
    get voicingContextResponse() {
      return this.getVoicingContextResponse();
    }

    /**
     * Gets the context response for this Node.
     */
    getVoicingContextResponse() {
      return this._voicingResponsePacket.contextResponse;
    }

    /**
     * Sets the hint response for this Node. This is usually a response that describes how to interact with this Node.
     * When requesting speech, this will only be spoken when responseCollector.hintResponsesEnabledProperty is set to
     * true.
     */
    setVoicingHintResponse(response) {
      this._voicingResponsePacket.hintResponse = response;
    }
    set voicingHintResponse(response) {
      this.setVoicingHintResponse(response);
    }
    get voicingHintResponse() {
      return this.getVoicingHintResponse();
    }

    /**
     * Gets the hint response for this Node.
     */
    getVoicingHintResponse() {
      return this._voicingResponsePacket.hintResponse;
    }

    /**
     * Set whether or not all responses for this Node will ignore the Properties of responseCollector. If false,
     * all responses will be spoken regardless of responseCollector Properties, which are generally set in user
     * preferences.
     */
    setVoicingIgnoreVoicingManagerProperties(ignoreProperties) {
      this._voicingResponsePacket.ignoreProperties = ignoreProperties;
    }
    set voicingIgnoreVoicingManagerProperties(ignoreProperties) {
      this.setVoicingIgnoreVoicingManagerProperties(ignoreProperties);
    }
    get voicingIgnoreVoicingManagerProperties() {
      return this.getVoicingIgnoreVoicingManagerProperties();
    }

    /**
     * Get whether or not responses are ignoring responseCollector Properties.
     */
    getVoicingIgnoreVoicingManagerProperties() {
      return this._voicingResponsePacket.ignoreProperties;
    }

    /**
     * Sets the collection of patterns to use for voicing responses, controlling the order, punctuation, and
     * additional content for each combination of response. See ResponsePatternCollection.js if you wish to use
     * a collection of string patterns that are not the default.
     */
    setVoicingResponsePatternCollection(patterns) {
      this._voicingResponsePacket.responsePatternCollection = patterns;
    }
    set voicingResponsePatternCollection(patterns) {
      this.setVoicingResponsePatternCollection(patterns);
    }
    get voicingResponsePatternCollection() {
      return this.getVoicingResponsePatternCollection();
    }

    /**
     * Get the ResponsePatternCollection object that this Voicing Node is using to collect responses.
     */
    getVoicingResponsePatternCollection() {
      return this._voicingResponsePacket.responsePatternCollection;
    }

    /**
     * Sets the utterance through which voicing associated with this Node will be spoken. By default on initialize,
     * one will be created, but a custom one can optionally be provided.
     */
    setVoicingUtterance(utterance) {
      if (this._voicingUtterance !== utterance) {
        if (this._voicingUtterance) {
          this.cleanVoicingUtterance();
        }
        Voicing.registerUtteranceToVoicingNode(utterance, this);
        this._voicingUtterance = utterance;
      }
    }
    set voicingUtterance(utterance) {
      this.setVoicingUtterance(utterance);
    }
    get voicingUtterance() {
      return this.getVoicingUtterance();
    }

    /**
     * Gets the utterance through which voicing associated with this Node will be spoken.
     */
    getVoicingUtterance() {
      assertUtterance(this._voicingUtterance);
      return this._voicingUtterance;
    }

    /**
     * Called whenever this Node is focused.
     */
    setVoicingFocusListener(focusListener) {
      this._voicingFocusListener = focusListener;
    }
    set voicingFocusListener(focusListener) {
      this.setVoicingFocusListener(focusListener);
    }
    get voicingFocusListener() {
      return this.getVoicingFocusListener();
    }

    /**
     * Gets the utteranceQueue through which voicing associated with this Node will be spoken.
     */
    getVoicingFocusListener() {
      return this._voicingFocusListener;
    }

    /**
     * The default focus listener attached to this Node during initialization.
     */
    defaultFocusListener() {
      this.voicingSpeakFullResponse({
        contextResponse: null
      });
    }

    /**
     * Whether a Node composes Voicing.
     */
    get isVoicing() {
      return true;
    }

    /**
     * Detaches references that ensure this components of this Trait are eligible for garbage collection.
     */
    dispose() {
      this.removeInputListener(this._speakContentOnFocusListener);
      this.changedInstanceEmitter.removeListener(this._boundInstancesChangedListener);
      if (this._voicingUtterance) {
        this.cleanVoicingUtterance();
        this._voicingUtterance = null;
      }
      super.dispose();
    }
    clean() {
      this.removeInputListener(this._speakContentOnFocusListener);
      this.changedInstanceEmitter.removeListener(this._boundInstancesChangedListener);
      if (this._voicingUtterance) {
        this.cleanVoicingUtterance();
        this._voicingUtterance = null;
      }

      // @ts-expect-error
      super.clean && super.clean();
    }

    /***********************************************************************************************************/
    // PRIVATE METHODS
    /***********************************************************************************************************/

    /**
     * When visibility and voicingVisibility change such that the Instance can now speak, update the counting
     * variable that tracks how many Instances of this VoicingNode can speak. To speak the Instance must be globally\
     * visible and voicingVisible.
     */
    onInstanceCanVoiceChange(canSpeak) {
      if (canSpeak) {
        this._voicingCanSpeakCount++;
      } else {
        this._voicingCanSpeakCount--;
      }
      assert && assert(this._voicingCanSpeakCount >= 0, 'the voicingCanSpeakCount should not go below zero');
      assert && assert(this._voicingCanSpeakCount <= this.instances.length, 'The voicingCanSpeakCount cannot be greater than the number of Instances.');
      this._voicingCanSpeakProperty.value = this._voicingCanSpeakCount > 0;
    }

    /**
     * Update the canSpeakProperty and counting variable in response to an Instance of this Node being added or
     * removed.
     */
    handleInstancesChanged(instance, added) {
      const isVisible = instance.visible && instance.voicingVisible;
      if (isVisible) {
        // If the added Instance was visible and voicingVisible it should increment the counter. If the removed
        // instance is NOT visible/voicingVisible it would not have contributed to the counter so we should not
        // decrement in that case.
        this._voicingCanSpeakCount = added ? this._voicingCanSpeakCount + 1 : this._voicingCanSpeakCount - 1;
      }
      this._voicingCanSpeakProperty.value = this._voicingCanSpeakCount > 0;
    }

    /**
     * Add or remove listeners on an Instance watching for changes to visible or voicingVisible that will modify
     * the voicingCanSpeakCount. See documentation for voicingCanSpeakCount for details about how this controls the
     * voicingCanSpeakProperty.
     */
    addOrRemoveInstanceListeners(instance, added) {
      assert && assert(instance.canVoiceEmitter, 'Instance must be initialized.');
      if (added) {
        // @ts-expect-error - Emitters in Instance need typing
        instance.canVoiceEmitter.addListener(this._boundInstanceCanVoiceChangeListener);
      } else {
        // @ts-expect-error - Emitters in Instance need typing
        instance.canVoiceEmitter.removeListener(this._boundInstanceCanVoiceChangeListener);
      }

      // eagerly update the canSpeakProperty and counting variables in addition to adding change listeners
      this.handleInstancesChanged(instance, added);
    }

    /**
     * Clean this._voicingUtterance, disposing if we own it or unregistering it if we do not.
     * @mixin-protected - made public for use in the mixin only
     */
    cleanVoicingUtterance() {
      assert && assert(this._voicingUtterance, 'A voicingUtterance must be available to clean.');
      if (this._voicingUtterance instanceof OwnedVoicingUtterance) {
        this._voicingUtterance.dispose();
      } else if (this._voicingUtterance && !this._voicingUtterance.isDisposed) {
        Voicing.unregisterUtteranceToVoicingNode(this._voicingUtterance, this);
      }
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
  VoicingClass.prototype._mutatorKeys = VOICING_OPTION_KEYS.concat(VoicingClass.prototype._mutatorKeys);
  assert && assert(VoicingClass.prototype._mutatorKeys.length === _.uniq(VoicingClass.prototype._mutatorKeys).length, 'duplicate mutator keys in Voicing');
  return VoicingClass;
};
Voicing.VOICING_OPTION_KEYS = VOICING_OPTION_KEYS;

/**
 * Alert an Utterance to the voicingUtteranceQueue. The Utterance must have voicingCanAnnounceProperties and hopefully
 * at least one of the Properties is a VoicingNode's canAnnounceProperty so that this Utterance is only announced
 * when the VoicingNode is globally visible and voicingVisible.
 * @static
 */
Voicing.alertUtterance = utterance => {
  assert && assert(utterance.voicingCanAnnounceProperties.length > 0, 'voicingCanAnnounceProperties required, this Utterance might not be connected to Node in the scene graph.');
  voicingUtteranceQueue.addToBack(utterance); // eslint-disable-line bad-sim-text
};

/**
 * Assign the voicingNode's voicingCanSpeakProperty to the Utterance so that the Utterance can only be announced
 * if the voicingNode is globally visible and voicingVisible in the display.
 * @static
 */
Voicing.registerUtteranceToVoicingNode = (utterance, voicingNode) => {
  const existingCanAnnounceProperties = utterance.voicingCanAnnounceProperties;
  const voicingCanSpeakProperty = voicingNode._voicingCanSpeakProperty;
  if (!existingCanAnnounceProperties.includes(voicingCanSpeakProperty)) {
    utterance.voicingCanAnnounceProperties = existingCanAnnounceProperties.concat([voicingCanSpeakProperty]);
  }
};

/**
 * Remove a voicingNode's voicingCanSpeakProperty from the Utterance.
 * @static
 */
Voicing.unregisterUtteranceToVoicingNode = (utterance, voicingNode) => {
  const existingCanAnnounceProperties = utterance.voicingCanAnnounceProperties;
  const voicingCanSpeakProperty = voicingNode._voicingCanSpeakProperty;
  const index = existingCanAnnounceProperties.indexOf(voicingCanSpeakProperty);
  assert && assert(index > -1, 'voicingNode.voicingCanSpeakProperty is not on the Utterance, was it not registered?');
  utterance.voicingCanAnnounceProperties = existingCanAnnounceProperties.splice(index, 1);
};

/**
 * Assign the Node's voicingVisibleProperty and visibleProperty to the Utterance so that the Utterance can only be
 * announced if the Node is visible and voicingVisible. This is LOCAL visibility and does not care about ancestors.
 * This should rarely be used, in general you should be registering an Utterance to a VoicingNode and its
 * voicingCanSpeakProperty.
 * @static
 */
Voicing.registerUtteranceToNode = (utterance, node) => {
  const existingCanAnnounceProperties = utterance.voicingCanAnnounceProperties;
  if (!existingCanAnnounceProperties.includes(node.visibleProperty)) {
    utterance.voicingCanAnnounceProperties = utterance.voicingCanAnnounceProperties.concat([node.visibleProperty]);
  }
  if (!existingCanAnnounceProperties.includes(node.voicingVisibleProperty)) {
    utterance.voicingCanAnnounceProperties = utterance.voicingCanAnnounceProperties.concat([node.voicingVisibleProperty]);
  }
};

/**
 * Remove a Node's voicingVisibleProperty and visibleProperty from the voicingCanAnnounceProperties of the Utterance.
 * @static
 */
Voicing.unregisterUtteranceToNode = (utterance, node) => {
  const existingCanAnnounceProperties = utterance.voicingCanAnnounceProperties;
  assert && assert(existingCanAnnounceProperties.includes(node.visibleProperty) && existingCanAnnounceProperties.includes(node.voicingVisibleProperty), 'visibleProperty and voicingVisibleProperty were not on the Utterance, was it not registered to the node?');
  const visiblePropertyIndex = existingCanAnnounceProperties.indexOf(node.visibleProperty);
  const withoutVisibleProperty = existingCanAnnounceProperties.splice(visiblePropertyIndex, 1);
  const voicingVisiblePropertyIndex = withoutVisibleProperty.indexOf(node.voicingVisibleProperty);
  const withoutBothProperties = existingCanAnnounceProperties.splice(voicingVisiblePropertyIndex, 1);
  utterance.voicingCanAnnounceProperties = withoutBothProperties;
};
scenery.register('Voicing', Voicing);
export default Voicing;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJpbmhlcml0YW5jZSIsIlJlc3BvbnNlUGFja2V0IiwiVXR0ZXJhbmNlIiwiRGVsYXllZE11dGF0ZSIsIkludGVyYWN0aXZlSGlnaGxpZ2h0aW5nIiwiTm9kZSIsInNjZW5lcnkiLCJ2b2ljaW5nVXR0ZXJhbmNlUXVldWUiLCJjb21iaW5lT3B0aW9ucyIsInJlc3BvbnNlQ29sbGVjdG9yIiwiVGlueVByb3BlcnR5IiwiVGFuZGVtIiwiYXNzZXJ0VXR0ZXJhbmNlIiwidXR0ZXJhbmNlIiwiRXJyb3IiLCJPd25lZFZvaWNpbmdVdHRlcmFuY2UiLCJjb25zdHJ1Y3RvciIsInByb3ZpZGVkT3B0aW9ucyIsIlZPSUNJTkdfT1BUSU9OX0tFWVMiLCJWb2ljaW5nIiwiVHlwZSIsImFzc2VydCIsIl8iLCJpbmNsdWRlcyIsIlZvaWNpbmdDbGFzcyIsImFyZ3MiLCJfYm91bmRJbnN0YW5jZUNhblZvaWNlQ2hhbmdlTGlzdGVuZXIiLCJvbkluc3RhbmNlQ2FuVm9pY2VDaGFuZ2UiLCJiaW5kIiwiX3ZvaWNpbmdVdHRlcmFuY2UiLCJwcm90b3R5cGUiLCJpbml0aWFsaXplIiwiY2FsbCIsIl92b2ljaW5nQ2FuU3BlYWtQcm9wZXJ0eSIsIl92b2ljaW5nUmVzcG9uc2VQYWNrZXQiLCJfdm9pY2luZ0ZvY3VzTGlzdGVuZXIiLCJkZWZhdWx0Rm9jdXNMaXN0ZW5lciIsInNldFZvaWNpbmdVdHRlcmFuY2UiLCJfdm9pY2luZ0NhblNwZWFrQ291bnQiLCJfYm91bmRJbnN0YW5jZXNDaGFuZ2VkTGlzdGVuZXIiLCJhZGRPclJlbW92ZUluc3RhbmNlTGlzdGVuZXJzIiwiY2hhbmdlZEluc3RhbmNlRW1pdHRlciIsImFkZExpc3RlbmVyIiwiX3NwZWFrQ29udGVudE9uRm9jdXNMaXN0ZW5lciIsImZvY3VzIiwiZXZlbnQiLCJhZGRJbnB1dExpc3RlbmVyIiwidm9pY2luZ1NwZWFrRnVsbFJlc3BvbnNlIiwib3B0aW9ucyIsImhhc093blByb3BlcnR5IiwibmFtZVJlc3BvbnNlIiwib2JqZWN0UmVzcG9uc2UiLCJjb250ZXh0UmVzcG9uc2UiLCJoaW50UmVzcG9uc2UiLCJjb2xsZWN0QW5kU3BlYWtSZXNwb25zZSIsInZvaWNpbmdTcGVha1Jlc3BvbnNlIiwidm9pY2luZ1NwZWFrTmFtZVJlc3BvbnNlIiwidm9pY2luZ1NwZWFrT2JqZWN0UmVzcG9uc2UiLCJ2b2ljaW5nU3BlYWtDb250ZXh0UmVzcG9uc2UiLCJ2b2ljaW5nU3BlYWtIaW50UmVzcG9uc2UiLCJzcGVha0NvbnRlbnQiLCJjb2xsZWN0UmVzcG9uc2UiLCJpZ25vcmVQcm9wZXJ0aWVzIiwicmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbiIsInZvaWNpbmdVdHRlcmFuY2UiLCJyZXNwb25zZSIsImNvbGxlY3RSZXNwb25zZXMiLCJhbGVydCIsImNvbnRlbnQiLCJub3RQaGV0aW9BcmNoZXR5cGUiLCJQSEVUX0lPX0VOQUJMRUQiLCJpc0luc2lkZVBoZXRpb0FyY2hldHlwZSIsImFkZFRvQmFjayIsInNldFZvaWNpbmdOYW1lUmVzcG9uc2UiLCJ2b2ljaW5nTmFtZVJlc3BvbnNlIiwiZ2V0Vm9pY2luZ05hbWVSZXNwb25zZSIsInNldFZvaWNpbmdPYmplY3RSZXNwb25zZSIsInZvaWNpbmdPYmplY3RSZXNwb25zZSIsImdldFZvaWNpbmdPYmplY3RSZXNwb25zZSIsInNldFZvaWNpbmdDb250ZXh0UmVzcG9uc2UiLCJ2b2ljaW5nQ29udGV4dFJlc3BvbnNlIiwiZ2V0Vm9pY2luZ0NvbnRleHRSZXNwb25zZSIsInNldFZvaWNpbmdIaW50UmVzcG9uc2UiLCJ2b2ljaW5nSGludFJlc3BvbnNlIiwiZ2V0Vm9pY2luZ0hpbnRSZXNwb25zZSIsInNldFZvaWNpbmdJZ25vcmVWb2ljaW5nTWFuYWdlclByb3BlcnRpZXMiLCJ2b2ljaW5nSWdub3JlVm9pY2luZ01hbmFnZXJQcm9wZXJ0aWVzIiwiZ2V0Vm9pY2luZ0lnbm9yZVZvaWNpbmdNYW5hZ2VyUHJvcGVydGllcyIsInNldFZvaWNpbmdSZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uIiwicGF0dGVybnMiLCJ2b2ljaW5nUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbiIsImdldFZvaWNpbmdSZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uIiwiY2xlYW5Wb2ljaW5nVXR0ZXJhbmNlIiwicmVnaXN0ZXJVdHRlcmFuY2VUb1ZvaWNpbmdOb2RlIiwiZ2V0Vm9pY2luZ1V0dGVyYW5jZSIsInNldFZvaWNpbmdGb2N1c0xpc3RlbmVyIiwiZm9jdXNMaXN0ZW5lciIsInZvaWNpbmdGb2N1c0xpc3RlbmVyIiwiZ2V0Vm9pY2luZ0ZvY3VzTGlzdGVuZXIiLCJpc1ZvaWNpbmciLCJkaXNwb3NlIiwicmVtb3ZlSW5wdXRMaXN0ZW5lciIsInJlbW92ZUxpc3RlbmVyIiwiY2xlYW4iLCJjYW5TcGVhayIsImluc3RhbmNlcyIsImxlbmd0aCIsInZhbHVlIiwiaGFuZGxlSW5zdGFuY2VzQ2hhbmdlZCIsImluc3RhbmNlIiwiYWRkZWQiLCJpc1Zpc2libGUiLCJ2aXNpYmxlIiwidm9pY2luZ1Zpc2libGUiLCJjYW5Wb2ljZUVtaXR0ZXIiLCJpc0Rpc3Bvc2VkIiwidW5yZWdpc3RlclV0dGVyYW5jZVRvVm9pY2luZ05vZGUiLCJtdXRhdGUiLCJfbXV0YXRvcktleXMiLCJjb25jYXQiLCJ1bmlxIiwiYWxlcnRVdHRlcmFuY2UiLCJ2b2ljaW5nQ2FuQW5ub3VuY2VQcm9wZXJ0aWVzIiwidm9pY2luZ05vZGUiLCJleGlzdGluZ0NhbkFubm91bmNlUHJvcGVydGllcyIsInZvaWNpbmdDYW5TcGVha1Byb3BlcnR5IiwiaW5kZXgiLCJpbmRleE9mIiwic3BsaWNlIiwicmVnaXN0ZXJVdHRlcmFuY2VUb05vZGUiLCJub2RlIiwidmlzaWJsZVByb3BlcnR5Iiwidm9pY2luZ1Zpc2libGVQcm9wZXJ0eSIsInVucmVnaXN0ZXJVdHRlcmFuY2VUb05vZGUiLCJ2aXNpYmxlUHJvcGVydHlJbmRleCIsIndpdGhvdXRWaXNpYmxlUHJvcGVydHkiLCJ2b2ljaW5nVmlzaWJsZVByb3BlcnR5SW5kZXgiLCJ3aXRob3V0Qm90aFByb3BlcnRpZXMiLCJyZWdpc3RlciJdLCJzb3VyY2VzIjpbIlZvaWNpbmcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSB0cmFpdCBmb3IgTm9kZSB0aGF0IHN1cHBvcnRzIHRoZSBWb2ljaW5nIGZlYXR1cmUsIHVuZGVyIGFjY2Vzc2liaWxpdHkuIEFsbG93cyB5b3UgdG8gZGVmaW5lIHJlc3BvbnNlcyBmb3IgdGhlIE5vZGVcclxuICogYW5kIG1ha2UgcmVxdWVzdHMgdG8gc3BlYWsgdGhhdCBjb250ZW50IHVzaW5nIEhUTUw1IFNwZWVjaFN5bnRoZXNpcyBhbmQgdGhlIFV0dGVyYW5jZVF1ZXVlLiBWb2ljaW5nIGNvbnRlbnQgaXNcclxuICogb3JnYW5pemVkIGludG8gZm91ciBjYXRlZ29yaWVzIHdoaWNoIGFyZSByZXNwb25zaWJsZSBmb3IgZGVzY3JpYmluZyBkaWZmZXJlbnQgdGhpbmdzLiBSZXNwb25zZXMgYXJlIHN0b3JlZCBvbiB0aGVcclxuICogY29tcG9zZWQgdHlwZTogXCJSZXNwb25zZVBhY2tldC5cIiBTZWUgdGhhdCBmaWxlIGZvciBkZXRhaWxzIGFib3V0IHdoYXQgcmVzcG9uc2VzIGl0IHN0b3Jlcy4gT3V0cHV0IG9mIHRoaXMgY29udGVudFxyXG4gKiBjYW4gYmUgY29udHJvbGxlZCBieSB0aGUgcmVzcG9uc2VDb2xsZWN0b3IuIFJlc3BvbnNlcyBhcmUgZGVmaW5lZCBhcyB0aGUgZm9sbG93aW5nLiAuIC5cclxuICpcclxuICogLSBcIk5hbWVcIiByZXNwb25zZTogVGhlIG5hbWUgb2YgdGhlIG9iamVjdCB0aGF0IHVzZXMgVm9pY2luZy4gU2ltaWxhciB0byB0aGUgXCJBY2Nlc3NpYmxlIE5hbWVcIiBpbiB3ZWIgYWNjZXNzaWJpbGl0eS5cclxuICogLSBcIk9iamVjdFwiIHJlc3BvbnNlOiBUaGUgc3RhdGUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIG9iamVjdCB0aGF0IHVzZXMgVm9pY2luZy5cclxuICogLSBcIkNvbnRleHRcIiByZXNwb25zZTogVGhlIGNvbnRleHR1YWwgY2hhbmdlcyB0aGF0IHJlc3VsdCBmcm9tIGludGVyYWN0aW9uIHdpdGggdGhlIE5vZGUgdGhhdCB1c2VzIFZvaWNpbmcuXHJcbiAqIC0gXCJIaW50XCIgcmVzcG9uc2U6IEEgc3VwcG9ydGluZyBoaW50IHRoYXQgZ3VpZGVzIHRoZSB1c2VyIHRvd2FyZCBhIGRlc2lyZWQgaW50ZXJhY3Rpb24gd2l0aCB0aGlzIE5vZGUuXHJcbiAqXHJcbiAqIFNlZSBSZXNwb25zZVBhY2tldCwgYXMgd2VsbCBhcyB0aGUgcHJvcGVydHkgYW5kIHNldHRlciBkb2N1bWVudGF0aW9uIGZvciBlYWNoIG9mIHRoZXNlIHJlc3BvbnNlcyBmb3IgbW9yZVxyXG4gKiBpbmZvcm1hdGlvbi5cclxuICpcclxuICogT25jZSB0aGlzIGNvbnRlbnQgaXMgc2V0LCB5b3UgY2FuIG1ha2UgYSByZXF1ZXN0IHRvIHNwZWFrIGl0IHVzaW5nIGFuIFV0dGVyYW5jZVF1ZXVlIHdpdGggb25lIG9mIHRoZSBwcm92aWRlZFxyXG4gKiBmdW5jdGlvbnMgaW4gdGhpcyBUcmFpdC4gSXQgaXMgdXAgdG8geW91IHRvIGNhbGwgb25lIG9mIHRoZXNlIGZ1bmN0aW9ucyB3aGVuIHlvdSB3aXNoIGZvciBzcGVlY2ggdG8gYmUgbWFkZS4gVGhlIG9ubHlcclxuICogZXhjZXB0aW9uIGlzIG9uIHRoZSAnZm9jdXMnIGV2ZW50LiBFdmVyeSBOb2RlIHRoYXQgY29tcG9zZXMgVm9pY2luZyB3aWxsIHNwZWFrIGl0cyByZXNwb25zZXMgYnkgd2hlbiBpdFxyXG4gKiByZWNlaXZlcyBmb2N1cy5cclxuICpcclxuICogQGF1dGhvciBKZXNzZSBHcmVlbmJlcmcgKFBoRVQgSW50ZXJhY3RpdmUgU2ltdWxhdGlvbnMpXHJcbiAqIEBhdXRob3IgTWljaGFlbCBLYXV6bWFubiAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgaW5oZXJpdGFuY2UgZnJvbSAnLi4vLi4vLi4vLi4vcGhldC1jb3JlL2pzL2luaGVyaXRhbmNlLmpzJztcclxuaW1wb3J0IFJlc3BvbnNlUGFja2V0LCB7IFJlc29sdmVkUmVzcG9uc2UsIFNwZWFrYWJsZVJlc29sdmVkT3B0aW9ucywgVm9pY2luZ1Jlc3BvbnNlIH0gZnJvbSAnLi4vLi4vLi4vLi4vdXR0ZXJhbmNlLXF1ZXVlL2pzL1Jlc3BvbnNlUGFja2V0LmpzJztcclxuaW1wb3J0IFJlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb24gZnJvbSAnLi4vLi4vLi4vLi4vdXR0ZXJhbmNlLXF1ZXVlL2pzL1Jlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb24uanMnO1xyXG5pbXBvcnQgVXR0ZXJhbmNlLCB7IFRBbGVydGFibGUsIFV0dGVyYW5jZU9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi8uLi91dHRlcmFuY2UtcXVldWUvanMvVXR0ZXJhbmNlLmpzJztcclxuaW1wb3J0IHsgRGVsYXllZE11dGF0ZSwgSW5zdGFuY2UsIEludGVyYWN0aXZlSGlnaGxpZ2h0aW5nLCBJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZ09wdGlvbnMsIE5vZGUsIHNjZW5lcnksIFNjZW5lcnlMaXN0ZW5lckZ1bmN0aW9uLCB2b2ljaW5nVXR0ZXJhbmNlUXVldWUgfSBmcm9tICcuLi8uLi9pbXBvcnRzLmpzJztcclxuaW1wb3J0IHsgY29tYmluZU9wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IENvbnN0cnVjdG9yIGZyb20gJy4uLy4uLy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9Db25zdHJ1Y3Rvci5qcyc7XHJcbmltcG9ydCBJbnRlbnRpb25hbEFueSBmcm9tICcuLi8uLi8uLi8uLi9waGV0LWNvcmUvanMvdHlwZXMvSW50ZW50aW9uYWxBbnkuanMnO1xyXG5pbXBvcnQgcmVzcG9uc2VDb2xsZWN0b3IgZnJvbSAnLi4vLi4vLi4vLi4vdXR0ZXJhbmNlLXF1ZXVlL2pzL3Jlc3BvbnNlQ29sbGVjdG9yLmpzJztcclxuaW1wb3J0IFRpbnlQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi8uLi9heG9uL2pzL1RpbnlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBUYW5kZW0gZnJvbSAnLi4vLi4vLi4vLi4vdGFuZGVtL2pzL1RhbmRlbS5qcyc7XHJcbmltcG9ydCB7IFRJbnRlcmFjdGl2ZUhpZ2hsaWdodGluZyB9IGZyb20gJy4vSW50ZXJhY3RpdmVIaWdobGlnaHRpbmcuanMnO1xyXG5cclxuLy8gSGVscHMgZW5mb3JjZSB0aGF0IHRoZSB1dHRlcmFuY2UgaXMgZGVmaW5lZC5cclxuZnVuY3Rpb24gYXNzZXJ0VXR0ZXJhbmNlKCB1dHRlcmFuY2U6IFV0dGVyYW5jZSB8IG51bGwgKTogYXNzZXJ0cyB1dHRlcmFuY2UgaXMgVXR0ZXJhbmNlIHtcclxuICBpZiAoICEoIHV0dGVyYW5jZSBpbnN0YW5jZW9mIFV0dGVyYW5jZSApICkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCAndXR0ZXJhbmNlIGlzIG5vdCBhbiBVdHRlcmFuY2UnICk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBBbiBpbXBsZW1lbnRhdGlvbiBjbGFzcyBmb3IgVm9pY2luZy50cywgb25seSB1c2VkIGluIHRoaXMgY2xhc3Mgc28gdGhhdCB3ZSBrbm93IGlmIHdlIG93biB0aGUgVXR0ZXJhbmNlIGFuZCBjYW5cclxuLy8gdGhlcmVmb3JlIGRpc3Bvc2UgaXQuXHJcbmNsYXNzIE93bmVkVm9pY2luZ1V0dGVyYW5jZSBleHRlbmRzIFV0dGVyYW5jZSB7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBwcm92aWRlZE9wdGlvbnM/OiBVdHRlcmFuY2VPcHRpb25zICkge1xyXG4gICAgc3VwZXIoIHByb3ZpZGVkT3B0aW9ucyApO1xyXG4gIH1cclxufVxyXG5cclxuLy8gb3B0aW9ucyB0aGF0IGFyZSBzdXBwb3J0ZWQgYnkgVm9pY2luZy5qcy4gQWRkZWQgdG8gbXV0YXRvciBrZXlzIHNvIHRoYXQgVm9pY2luZyBwcm9wZXJ0aWVzIGNhbiBiZSBzZXQgd2l0aCBtdXRhdGUuXHJcbmNvbnN0IFZPSUNJTkdfT1BUSU9OX0tFWVMgPSBbXHJcbiAgJ3ZvaWNpbmdOYW1lUmVzcG9uc2UnLFxyXG4gICd2b2ljaW5nT2JqZWN0UmVzcG9uc2UnLFxyXG4gICd2b2ljaW5nQ29udGV4dFJlc3BvbnNlJyxcclxuICAndm9pY2luZ0hpbnRSZXNwb25zZScsXHJcbiAgJ3ZvaWNpbmdVdHRlcmFuY2UnLFxyXG4gICd2b2ljaW5nUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbicsXHJcbiAgJ3ZvaWNpbmdJZ25vcmVWb2ljaW5nTWFuYWdlclByb3BlcnRpZXMnLFxyXG4gICd2b2ljaW5nRm9jdXNMaXN0ZW5lcidcclxuXTtcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcblxyXG4gIC8vIHNlZSBSZXNwb25zZVBhY2tldC5uYW1lUmVzcG9uc2VcclxuICB2b2ljaW5nTmFtZVJlc3BvbnNlPzogVm9pY2luZ1Jlc3BvbnNlO1xyXG5cclxuICAvLyBzZWUgUmVzcG9uc2VQYWNrZXQub2JqZWN0UmVzcG9uc2VcclxuICB2b2ljaW5nT2JqZWN0UmVzcG9uc2U/OiBWb2ljaW5nUmVzcG9uc2U7XHJcblxyXG4gIC8vIHNlZSBSZXNwb25zZVBhY2tldC5jb250ZXh0UmVzcG9uc2VcclxuICB2b2ljaW5nQ29udGV4dFJlc3BvbnNlPzogVm9pY2luZ1Jlc3BvbnNlO1xyXG5cclxuICAvLyBzZWUgUmVzcG9uc2VQYWNrZXQuaGludFJlc3BvbnNlXHJcbiAgdm9pY2luZ0hpbnRSZXNwb25zZT86IFZvaWNpbmdSZXNwb25zZTtcclxuXHJcbiAgLy8gc2VlIFJlc3BvbnNlUGFja2V0LnJlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb25cclxuICB2b2ljaW5nUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbj86IFJlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb247XHJcblxyXG4gIC8vIHNlZSBSZXNwb25zZVBhY2tldC5pZ25vcmVQcm9wZXJ0aWVzXHJcbiAgdm9pY2luZ0lnbm9yZVZvaWNpbmdNYW5hZ2VyUHJvcGVydGllcz86IGJvb2xlYW47XHJcblxyXG4gIC8vIENhbGxlZCB3aGVuIHRoaXMgTm9kZSBpcyBmb2N1c2VkIHRvIHNwZWFrIHZvaWNpbmcgcmVzcG9uc2VzIG9uIGZvY3VzLiBTZWUgVm9pY2luZy5kZWZhdWx0Rm9jdXNMaXN0ZW5lciBmb3IgZGVmYXVsdFxyXG4gIC8vIGxpc3RlbmVyLlxyXG4gIHZvaWNpbmdGb2N1c0xpc3RlbmVyPzogU2NlbmVyeUxpc3RlbmVyRnVuY3Rpb248Rm9jdXNFdmVudD4gfCBudWxsO1xyXG5cclxuICAvLyBUaGUgdXR0ZXJhbmNlIHRvIHVzZSBpZiB5b3Ugd2FudCB0aGlzIHJlc3BvbnNlIHRvIGJlIG1vcmUgY29udHJvbGxlZCBpbiB0aGUgVXR0ZXJhbmNlUXVldWUuIFRoaXMgVXR0ZXJhbmNlIHdpbGwgYmVcclxuICAvLyB1c2VkIGJ5IGFsbCByZXNwb25zZXMgc3Bva2VuIGJ5IHRoaXMgY2xhc3MuIE51bGwgdG8gbm90IHVzZSBhbiBVdHRlcmFuY2UuXHJcbiAgdm9pY2luZ1V0dGVyYW5jZT86IFV0dGVyYW5jZSB8IG51bGw7XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBWb2ljaW5nT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmdPcHRpb25zO1xyXG5cclxuZXhwb3J0IHR5cGUgU3BlYWtpbmdPcHRpb25zID0ge1xyXG4gIHV0dGVyYW5jZT86IFNlbGZPcHRpb25zWyd2b2ljaW5nVXR0ZXJhbmNlJ107XHJcbn0gJiBTcGVha2FibGVSZXNvbHZlZE9wdGlvbnM7XHJcblxyXG4vLyBOb3JtYWxseSBvdXIgcHJvamVjdCBwcmVmZXJzIHR5cGUgYWxpYXNlcyB0byBpbnRlcmZhY2VzLCBidXQgaW50ZXJmYWNlcyBhcmUgbmVjZXNzYXJ5IGZvciBjb3JyZWN0IHVzYWdlIG9mIFwidGhpc1wiLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3Rhc2tzL2lzc3Vlcy8xMTMyXHJcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvY29uc2lzdGVudC10eXBlLWRlZmluaXRpb25zXHJcbmV4cG9ydCBpbnRlcmZhY2UgVFZvaWNpbmcgZXh0ZW5kcyBUSW50ZXJhY3RpdmVIaWdobGlnaHRpbmcge1xyXG4gIF92b2ljaW5nUmVzcG9uc2VQYWNrZXQ6IFJlc3BvbnNlUGFja2V0O1xyXG5cclxuICAvLyBAbWl4aW4tcHJvdGVjdGVkIC0gbWFkZSBwdWJsaWMgZm9yIHVzZSBpbiB0aGUgbWl4aW4gb25seVxyXG4gIF92b2ljaW5nVXR0ZXJhbmNlOiBVdHRlcmFuY2UgfCBudWxsO1xyXG5cclxuICAvLyBAbWl4aW4tcHJpdmF0ZSAtIHByaXZhdGUgdG8gdGhpcyBmaWxlLCBidXQgcHVibGljIG5lZWRlZCBmb3IgdGhlIGludGVyZmFjZVxyXG4gIF92b2ljaW5nQ2FuU3BlYWtQcm9wZXJ0eTogVGlueVByb3BlcnR5PGJvb2xlYW4+O1xyXG5cclxuICBpbml0aWFsaXplKCAuLi5hcmdzOiBJbnRlbnRpb25hbEFueVtdICk6IHRoaXM7XHJcblxyXG4gIHZvaWNpbmdTcGVha0Z1bGxSZXNwb25zZSggcHJvdmlkZWRPcHRpb25zPzogU3BlYWtpbmdPcHRpb25zICk6IHZvaWQ7XHJcblxyXG4gIHZvaWNpbmdTcGVha1Jlc3BvbnNlKCBwcm92aWRlZE9wdGlvbnM/OiBTcGVha2luZ09wdGlvbnMgKTogdm9pZDtcclxuXHJcbiAgdm9pY2luZ1NwZWFrTmFtZVJlc3BvbnNlKCBwcm92aWRlZE9wdGlvbnM/OiBTcGVha2luZ09wdGlvbnMgKTogdm9pZDtcclxuXHJcbiAgdm9pY2luZ1NwZWFrT2JqZWN0UmVzcG9uc2UoIHByb3ZpZGVkT3B0aW9ucz86IFNwZWFraW5nT3B0aW9ucyApOiB2b2lkO1xyXG5cclxuICB2b2ljaW5nU3BlYWtDb250ZXh0UmVzcG9uc2UoIHByb3ZpZGVkT3B0aW9ucz86IFNwZWFraW5nT3B0aW9ucyApOiB2b2lkO1xyXG5cclxuICB2b2ljaW5nU3BlYWtIaW50UmVzcG9uc2UoIHByb3ZpZGVkT3B0aW9ucz86IFNwZWFraW5nT3B0aW9ucyApOiB2b2lkO1xyXG5cclxuICAvLyBAbWl4aW4tcHJvdGVjdGVkIC0gbWFkZSBwdWJsaWMgZm9yIHVzZSBpbiB0aGUgbWl4aW4gb25seVxyXG4gIGNvbGxlY3RSZXNwb25zZSggcHJvdmlkZWRPcHRpb25zPzogU3BlYWtpbmdPcHRpb25zICk6IFRBbGVydGFibGU7XHJcblxyXG4gIHNwZWFrQ29udGVudCggY29udGVudDogVEFsZXJ0YWJsZSApOiB2b2lkO1xyXG5cclxuICBzZXRWb2ljaW5nTmFtZVJlc3BvbnNlKCByZXNwb25zZTogVm9pY2luZ1Jlc3BvbnNlICk6IHZvaWQ7XHJcblxyXG4gIHZvaWNpbmdOYW1lUmVzcG9uc2U6IFJlc29sdmVkUmVzcG9uc2U7XHJcblxyXG4gIGdldFZvaWNpbmdOYW1lUmVzcG9uc2UoKTogUmVzb2x2ZWRSZXNwb25zZTtcclxuXHJcbiAgc2V0Vm9pY2luZ09iamVjdFJlc3BvbnNlKCByZXNwb25zZTogVm9pY2luZ1Jlc3BvbnNlICk6IHZvaWQ7XHJcblxyXG4gIHZvaWNpbmdPYmplY3RSZXNwb25zZTogUmVzb2x2ZWRSZXNwb25zZTtcclxuXHJcbiAgZ2V0Vm9pY2luZ09iamVjdFJlc3BvbnNlKCk6IFJlc29sdmVkUmVzcG9uc2U7XHJcblxyXG4gIHNldFZvaWNpbmdDb250ZXh0UmVzcG9uc2UoIHJlc3BvbnNlOiBWb2ljaW5nUmVzcG9uc2UgKTogdm9pZDtcclxuXHJcbiAgdm9pY2luZ0NvbnRleHRSZXNwb25zZTogUmVzb2x2ZWRSZXNwb25zZTtcclxuXHJcbiAgZ2V0Vm9pY2luZ0NvbnRleHRSZXNwb25zZSgpOiBSZXNvbHZlZFJlc3BvbnNlO1xyXG5cclxuICBzZXRWb2ljaW5nSGludFJlc3BvbnNlKCByZXNwb25zZTogVm9pY2luZ1Jlc3BvbnNlICk6IHZvaWQ7XHJcblxyXG4gIHZvaWNpbmdIaW50UmVzcG9uc2U6IFJlc29sdmVkUmVzcG9uc2U7XHJcblxyXG4gIGdldFZvaWNpbmdIaW50UmVzcG9uc2UoKTogUmVzb2x2ZWRSZXNwb25zZTtcclxuXHJcbiAgc2V0Vm9pY2luZ0lnbm9yZVZvaWNpbmdNYW5hZ2VyUHJvcGVydGllcyggaWdub3JlUHJvcGVydGllczogYm9vbGVhbiApOiB2b2lkO1xyXG5cclxuICB2b2ljaW5nSWdub3JlVm9pY2luZ01hbmFnZXJQcm9wZXJ0aWVzOiBib29sZWFuO1xyXG5cclxuICBnZXRWb2ljaW5nSWdub3JlVm9pY2luZ01hbmFnZXJQcm9wZXJ0aWVzKCk6IGJvb2xlYW47XHJcblxyXG4gIHNldFZvaWNpbmdSZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uKCBwYXR0ZXJuczogUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbiApOiB2b2lkO1xyXG5cclxuICB2b2ljaW5nUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbjogUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbjtcclxuXHJcbiAgZ2V0Vm9pY2luZ1Jlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb24oKTogUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbjtcclxuXHJcbiAgc2V0Vm9pY2luZ1V0dGVyYW5jZSggdXR0ZXJhbmNlOiBVdHRlcmFuY2UgKTogdm9pZDtcclxuXHJcbiAgdm9pY2luZ1V0dGVyYW5jZTogVXR0ZXJhbmNlO1xyXG5cclxuICBnZXRWb2ljaW5nVXR0ZXJhbmNlKCk6IFV0dGVyYW5jZTtcclxuXHJcbiAgc2V0Vm9pY2luZ0ZvY3VzTGlzdGVuZXIoIGZvY3VzTGlzdGVuZXI6IFNjZW5lcnlMaXN0ZW5lckZ1bmN0aW9uPEZvY3VzRXZlbnQ+IHwgbnVsbCApOiB2b2lkO1xyXG5cclxuICB2b2ljaW5nRm9jdXNMaXN0ZW5lcjogU2NlbmVyeUxpc3RlbmVyRnVuY3Rpb248Rm9jdXNFdmVudD4gfCBudWxsO1xyXG5cclxuICBnZXRWb2ljaW5nRm9jdXNMaXN0ZW5lcigpOiBTY2VuZXJ5TGlzdGVuZXJGdW5jdGlvbjxGb2N1c0V2ZW50PiB8IG51bGw7XHJcblxyXG4gIGRlZmF1bHRGb2N1c0xpc3RlbmVyKCk6IHZvaWQ7XHJcblxyXG4gIGdldCBpc1ZvaWNpbmcoKTogYm9vbGVhbjtcclxuXHJcbiAgY2xlYW4oKTogdm9pZDtcclxuXHJcbiAgLy8gQG1peGluLXByb3RlY3RlZCAtIG1hZGUgcHVibGljIGZvciB1c2UgaW4gdGhlIG1peGluIG9ubHlcclxuICBjbGVhblZvaWNpbmdVdHRlcmFuY2UoKTogdm9pZDtcclxufVxyXG5cclxuY29uc3QgVm9pY2luZyA9IDxTdXBlclR5cGUgZXh0ZW5kcyBDb25zdHJ1Y3RvcjxOb2RlPj4oIFR5cGU6IFN1cGVyVHlwZSApOiBTdXBlclR5cGUgJiBDb25zdHJ1Y3RvcjxUVm9pY2luZz4gPT4ge1xyXG5cclxuICBhc3NlcnQgJiYgYXNzZXJ0KCBfLmluY2x1ZGVzKCBpbmhlcml0YW5jZSggVHlwZSApLCBOb2RlICksICdPbmx5IE5vZGUgc3VidHlwZXMgc2hvdWxkIGNvbXBvc2UgVm9pY2luZycgKTtcclxuXHJcbiAgY29uc3QgVm9pY2luZ0NsYXNzID0gRGVsYXllZE11dGF0ZSggJ1ZvaWNpbmcnLCBWT0lDSU5HX09QVElPTl9LRVlTLFxyXG4gICAgY2xhc3MgVm9pY2luZ0NsYXNzIGV4dGVuZHMgSW50ZXJhY3RpdmVIaWdobGlnaHRpbmcoIFR5cGUgKSBpbXBsZW1lbnRzIFRWb2ljaW5nIHtcclxuXHJcbiAgICAgIC8vIFJlc3BvbnNlUGFja2V0IHRoYXQgaG9sZHMgYWxsIHRoZSBzdXBwb3J0ZWQgcmVzcG9uc2VzIHRvIGJlIFZvaWNlZFxyXG4gICAgICBwdWJsaWMgX3ZvaWNpbmdSZXNwb25zZVBhY2tldCE6IFJlc3BvbnNlUGFja2V0O1xyXG5cclxuICAgICAgLy8gVGhlIHV0dGVyYW5jZSB0aGF0IGFsbCByZXNwb25zZXMgYXJlIHNwb2tlbiB0aHJvdWdoLlxyXG4gICAgICAvLyBAbWl4aW4tcHJvdGVjdGVkIC0gbWFkZSBwdWJsaWMgZm9yIHVzZSBpbiB0aGUgbWl4aW4gb25seVxyXG4gICAgICBwdWJsaWMgX3ZvaWNpbmdVdHRlcmFuY2U6IFV0dGVyYW5jZSB8IG51bGw7XHJcblxyXG4gICAgICAvLyBDYWxsZWQgd2hlbiB0aGlzIG5vZGUgaXMgZm9jdXNlZC5cclxuICAgICAgcHJpdmF0ZSBfdm9pY2luZ0ZvY3VzTGlzdGVuZXIhOiBTY2VuZXJ5TGlzdGVuZXJGdW5jdGlvbjxGb2N1c0V2ZW50PiB8IG51bGw7XHJcblxyXG4gICAgICAvLyBJbmRpY2F0ZXMgd2hldGhlciB0aGlzIE5vZGUgY2FuIHNwZWFrLiBBIE5vZGUgY2FuIHNwZWFrIGlmIHNlbGYgYW5kIGFsbCBvZiBpdHMgYW5jZXN0b3JzIGFyZSB2aXNpYmxlIGFuZFxyXG4gICAgICAvLyB2b2ljaW5nVmlzaWJsZS4gVGhpcyBpcyBwcml2YXRlIGJlY2F1c2UgaXRzIHZhbHVlIGRlcGVuZHMgb24gdGhlIHN0YXRlIG9mIHRoZSBJbnN0YW5jZSB0cmVlLiBMaXN0ZW5pbmcgdG8gdGhpc1xyXG4gICAgICAvLyB0byBjaGFuZ2UgdGhlIHNjZW5lIGdyYXBoIHN0YXRlIGNhbiBiZSBpbmNyZWRpYmx5IGRhbmdlcm91cyBhbmQgYnVnZ3ksIHNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvc2NlbmVyeS9pc3N1ZXMvMTYxNVxyXG4gICAgICAvLyBAbWl4aW4tcHJpdmF0ZSAtIHByaXZhdGUgdG8gdGhpcyBmaWxlLCBidXQgcHVibGljIG5lZWRlZCBmb3IgdGhlIGludGVyZmFjZVxyXG4gICAgICBwdWJsaWMgX3ZvaWNpbmdDYW5TcGVha1Byb3BlcnR5ITogVGlueVByb3BlcnR5PGJvb2xlYW4+O1xyXG5cclxuICAgICAgLy8gQSBjb3VudGVyIHRoYXQga2VlcHMgdHJhY2sgb2YgdmlzaWJsZSBhbmQgdm9pY2luZ1Zpc2libGUgSW5zdGFuY2VzIG9mIHRoaXMgTm9kZS5cclxuICAgICAgLy8gQXMgbG9uZyBhcyB0aGlzIHZhbHVlIGlzIGdyZWF0ZXIgdGhhbiB6ZXJvLCB0aGlzIE5vZGUgY2FuIHNwZWFrLiBTZWUgb25JbnN0YW5jZVZpc2liaWxpdHlDaGFuZ2VcclxuICAgICAgLy8gYW5kIG9uSW5zdGFuY2VWb2ljaW5nVmlzaWJpbGl0eUNoYW5nZSBmb3IgbW9yZSBpbXBsZW1lbnRhdGlvbiBkZXRhaWxzLlxyXG4gICAgICBwcml2YXRlIF92b2ljaW5nQ2FuU3BlYWtDb3VudCE6IG51bWJlcjtcclxuXHJcbiAgICAgIC8vIENhbGxlZCB3aGVuIGBjYW5Wb2ljZUVtaXR0ZXJgIGVtaXRzIGZvciBhbiBJbnN0YW5jZS5cclxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfYm91bmRJbnN0YW5jZUNhblZvaWNlQ2hhbmdlTGlzdGVuZXI6ICggY2FuU3BlYWs6IGJvb2xlYW4gKSA9PiB2b2lkO1xyXG5cclxuICAgICAgLy8gV2hlbmV2ZXIgYW4gSW5zdGFuY2Ugb2YgdGhpcyBOb2RlIGlzIGFkZGVkIG9yIHJlbW92ZWQsIGFkZC9yZW1vdmUgbGlzdGVuZXJzIHRoYXQgd2lsbCB1cGRhdGUgdGhlXHJcbiAgICAgIC8vIGNhblNwZWFrUHJvcGVydHkuXHJcbiAgICAgIHByaXZhdGUgX2JvdW5kSW5zdGFuY2VzQ2hhbmdlZExpc3RlbmVyITogKCBpbnN0YW5jZTogSW5zdGFuY2UsIGFkZGVkOiBib29sZWFuICkgPT4gdm9pZDtcclxuXHJcbiAgICAgIC8vIElucHV0IGxpc3RlbmVyIHRoYXQgc3BlYWtzIGNvbnRlbnQgb24gZm9jdXMuIFRoaXMgaXMgdGhlIG9ubHkgaW5wdXQgbGlzdGVuZXIgYWRkZWRcclxuICAgICAgLy8gYnkgVm9pY2luZywgYnV0IGl0IGlzIHRoZSBvbmUgdGhhdCBpcyBjb25zaXN0ZW50IGZvciBhbGwgVm9pY2luZyBub2Rlcy4gT24gZm9jdXMsIHNwZWFrIHRoZSBuYW1lLCBvYmplY3RcclxuICAgICAgLy8gcmVzcG9uc2UsIGFuZCBpbnRlcmFjdGlvbiBoaW50LlxyXG4gICAgICBwcml2YXRlIF9zcGVha0NvbnRlbnRPbkZvY3VzTGlzdGVuZXIhOiB7IGZvY3VzOiBTY2VuZXJ5TGlzdGVuZXJGdW5jdGlvbjxGb2N1c0V2ZW50PiB9O1xyXG5cclxuICAgICAgcHVibGljIGNvbnN0cnVjdG9yKCAuLi5hcmdzOiBJbnRlbnRpb25hbEFueVtdICkge1xyXG4gICAgICAgIHN1cGVyKCAuLi5hcmdzICk7XHJcblxyXG4gICAgICAgIC8vIEJpbmQgdGhlIGxpc3RlbmVycyBvbiBjb25zdHJ1Y3Rpb24gdG8gYmUgYWRkZWQgdG8gb2JzZXJ2YWJsZXMgb24gaW5pdGlhbGl6ZSBhbmQgcmVtb3ZlZCBvbiBjbGVhbi9kaXNwb3NlLlxyXG4gICAgICAgIC8vIEluc3RhbmNlcyBhcmUgdXBkYXRlZCBhc3luY2hyb25vdXNseSBpbiB1cGRhdGVEaXNwbGF5LiBUaGUgYmluZCBjcmVhdGVzIGEgbmV3IGZ1bmN0aW9uIGFuZCB3ZSBuZWVkIHRoZVxyXG4gICAgICAgIC8vIHJlZmVyZW5jZSB0byBwZXJzaXN0IHRocm91Z2ggdGhlIGNvbXBsZXRpb24gb2YgaW5pdGlhbGl6ZSBhbmQgZGlzcG9zYWwuXHJcbiAgICAgICAgdGhpcy5fYm91bmRJbnN0YW5jZUNhblZvaWNlQ2hhbmdlTGlzdGVuZXIgPSB0aGlzLm9uSW5zdGFuY2VDYW5Wb2ljZUNoYW5nZS5iaW5kKCB0aGlzICk7XHJcblxyXG4gICAgICAgIHRoaXMuX3ZvaWNpbmdVdHRlcmFuY2UgPSBudWxsO1xyXG5cclxuICAgICAgICAvLyBXZSBvbmx5IHdhbnQgdG8gY2FsbCB0aGlzIG1ldGhvZCwgbm90IGFueSBzdWJ0eXBlIGltcGxlbWVudGF0aW9uXHJcbiAgICAgICAgVm9pY2luZ0NsYXNzLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwoIHRoaXMgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gU2VwYXJhdGUgZnJvbSB0aGUgY29uc3RydWN0b3IgdG8gc3VwcG9ydCBjYXNlcyB3aGVyZSBWb2ljaW5nIGlzIHVzZWQgaW4gUG9vbGFibGUgTm9kZXMuXHJcbiAgICAgIC8vIC4uLmFyZ3M6IEludGVudGlvbmFsQW55W10gYmVjYXVzZSB0aGluZ3MgbGlrZSBSaWNoVGV4dExpbmsgbmVlZCB0byBwcm92aWRlIGFyZ3VtZW50cyB0byBpbml0aWFsaXplLCBhbmQgVFMgY29tcGxhaW5zXHJcbiAgICAgIC8vIG90aGVyd2lzZVxyXG4gICAgICBwdWJsaWMgaW5pdGlhbGl6ZSggLi4uYXJnczogSW50ZW50aW9uYWxBbnlbXSApOiB0aGlzIHtcclxuXHJcbiAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICAgIHN1cGVyLmluaXRpYWxpemUgJiYgc3VwZXIuaW5pdGlhbGl6ZSggYXJncyApO1xyXG5cclxuICAgICAgICB0aGlzLl92b2ljaW5nQ2FuU3BlYWtQcm9wZXJ0eSA9IG5ldyBUaW55UHJvcGVydHk8Ym9vbGVhbj4oIHRydWUgKTtcclxuICAgICAgICB0aGlzLl92b2ljaW5nUmVzcG9uc2VQYWNrZXQgPSBuZXcgUmVzcG9uc2VQYWNrZXQoKTtcclxuICAgICAgICB0aGlzLl92b2ljaW5nRm9jdXNMaXN0ZW5lciA9IHRoaXMuZGVmYXVsdEZvY3VzTGlzdGVuZXI7XHJcblxyXG4gICAgICAgIC8vIFNldHMgdGhlIGRlZmF1bHQgdm9pY2luZ1V0dGVyYW5jZSBhbmQgbWFrZXMgdGhpcy5jYW5TcGVha1Byb3BlcnR5IGEgZGVwZW5kZW5jeSBvbiBpdHMgYWJpbGl0eSB0byBhbm5vdW5jZS5cclxuICAgICAgICB0aGlzLnNldFZvaWNpbmdVdHRlcmFuY2UoIG5ldyBPd25lZFZvaWNpbmdVdHRlcmFuY2UoKSApO1xyXG5cclxuICAgICAgICB0aGlzLl92b2ljaW5nQ2FuU3BlYWtDb3VudCA9IDA7XHJcblxyXG4gICAgICAgIHRoaXMuX2JvdW5kSW5zdGFuY2VzQ2hhbmdlZExpc3RlbmVyID0gdGhpcy5hZGRPclJlbW92ZUluc3RhbmNlTGlzdGVuZXJzLmJpbmQoIHRoaXMgKTtcclxuXHJcbiAgICAgICAgLy8gVGhpcyBpcyBwb3RlbnRpYWxseSBkYW5nZXJvdXMgdG8gbGlzdGVuIHRvIGdlbmVyYWxseSwgYnV0IGluIHRoaXMgY2FzZSBpdCBpcyBzYWZlIGJlY2F1c2UgdGhlIHN0YXRlIHdlIGNoYW5nZVxyXG4gICAgICAgIC8vIHdpbGwgb25seSBhZmZlY3QgaG93IHdlIHZvaWNlIChwYXJ0IG9mIHRoZSBhdWRpbyB2aWV3KSwgYW5kIG5vdCBwYXJ0IG9mIHRoaXMgZGlzcGxheSdzIHNjZW5lIGdyYXBoLlxyXG4gICAgICAgIHRoaXMuY2hhbmdlZEluc3RhbmNlRW1pdHRlci5hZGRMaXN0ZW5lciggdGhpcy5fYm91bmRJbnN0YW5jZXNDaGFuZ2VkTGlzdGVuZXIgKTtcclxuXHJcbiAgICAgICAgdGhpcy5fc3BlYWtDb250ZW50T25Gb2N1c0xpc3RlbmVyID0ge1xyXG4gICAgICAgICAgZm9jdXM6IGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fdm9pY2luZ0ZvY3VzTGlzdGVuZXIgJiYgdGhpcy5fdm9pY2luZ0ZvY3VzTGlzdGVuZXIoIGV2ZW50ICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLmFkZElucHV0TGlzdGVuZXIoIHRoaXMuX3NwZWFrQ29udGVudE9uRm9jdXNMaXN0ZW5lciApO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFNwZWFrIGFsbCByZXNwb25zZXMgYXNzaWduZWQgdG8gdGhpcyBOb2RlLiBPcHRpb25zIGFsbG93IHlvdSB0byBvdmVycmlkZSBhIHJlc3BvbnNlcyBmb3IgdGhpcyBwYXJ0aWN1bGFyXHJcbiAgICAgICAqIHNwZWVjaCByZXF1ZXN0LiBFYWNoIHJlc3BvbnNlIGlzIG9ubHkgc3Bva2VuIGlmIHRoZSBhc3NvY2lhdGVkIFByb3BlcnR5IG9mIHJlc3BvbnNlQ29sbGVjdG9yIGlzIHRydWUuIElmXHJcbiAgICAgICAqIGFsbCBhcmUgUHJvcGVydGllcyBhcmUgZmFsc2UsIG5vdGhpbmcgd2lsbCBiZSBzcG9rZW4uXHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgdm9pY2luZ1NwZWFrRnVsbFJlc3BvbnNlKCBwcm92aWRlZE9wdGlvbnM/OiBTcGVha2luZ09wdGlvbnMgKTogdm9pZCB7XHJcblxyXG4gICAgICAgIC8vIG9wdGlvbnMgYXJlIHBhc3NlZCBhbG9uZyB0byBjb2xsZWN0QW5kU3BlYWtSZXNwb25zZSwgc2VlIHRoYXQgZnVuY3Rpb24gZm9yIGFkZGl0aW9uYWwgb3B0aW9uc1xyXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBjb21iaW5lT3B0aW9uczxTcGVha2luZ09wdGlvbnM+KCB7fSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgICAgIC8vIExhemlseSBmb3JtdWxhdGUgc3RyaW5ncyBvbmx5IGFzIG5lZWRlZFxyXG4gICAgICAgIGlmICggIW9wdGlvbnMuaGFzT3duUHJvcGVydHkoICduYW1lUmVzcG9uc2UnICkgKSB7XHJcbiAgICAgICAgICBvcHRpb25zLm5hbWVSZXNwb25zZSA9IHRoaXMuX3ZvaWNpbmdSZXNwb25zZVBhY2tldC5uYW1lUmVzcG9uc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggIW9wdGlvbnMuaGFzT3duUHJvcGVydHkoICdvYmplY3RSZXNwb25zZScgKSApIHtcclxuICAgICAgICAgIG9wdGlvbnMub2JqZWN0UmVzcG9uc2UgPSB0aGlzLl92b2ljaW5nUmVzcG9uc2VQYWNrZXQub2JqZWN0UmVzcG9uc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggIW9wdGlvbnMuaGFzT3duUHJvcGVydHkoICdjb250ZXh0UmVzcG9uc2UnICkgKSB7XHJcbiAgICAgICAgICBvcHRpb25zLmNvbnRleHRSZXNwb25zZSA9IHRoaXMuX3ZvaWNpbmdSZXNwb25zZVBhY2tldC5jb250ZXh0UmVzcG9uc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggIW9wdGlvbnMuaGFzT3duUHJvcGVydHkoICdoaW50UmVzcG9uc2UnICkgKSB7XHJcbiAgICAgICAgICBvcHRpb25zLmhpbnRSZXNwb25zZSA9IHRoaXMuX3ZvaWNpbmdSZXNwb25zZVBhY2tldC5oaW50UmVzcG9uc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmNvbGxlY3RBbmRTcGVha1Jlc3BvbnNlKCBvcHRpb25zICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBTcGVhayBPTkxZIHRoZSBwcm92aWRlZCByZXNwb25zZXMgdGhhdCB5b3UgcGFzcyBpbiB3aXRoIG9wdGlvbnMuIFRoaXMgd2lsbCBOT1Qgc3BlYWsgdGhlIG5hbWUsIG9iamVjdCxcclxuICAgICAgICogY29udGV4dCwgb3IgaGludCByZXNwb25zZXMgYXNzaWduZWQgdG8gdGhpcyBub2RlIGJ5IGRlZmF1bHQuIEJ1dCBpdCBhbGxvd3MgZm9yIGNsYXJpdHkgYXQgdXNhZ2VzIHNvIGl0IGlzXHJcbiAgICAgICAqIGNsZWFyIHRoYXQgeW91IGFyZSBvbmx5IHJlcXVlc3RpbmcgY2VydGFpbiByZXNwb25zZXMuIElmIHlvdSB3YW50IHRvIHNwZWFrIGFsbCBvZiB0aGUgcmVzcG9uc2VzIGFzc2lnbmVkXHJcbiAgICAgICAqIHRvIHRoaXMgTm9kZSwgdXNlIHZvaWNpbmdTcGVha0Z1bGxSZXNwb25zZSgpLlxyXG4gICAgICAgKlxyXG4gICAgICAgKiBFYWNoIHJlc3BvbnNlIHdpbGwgb25seSBiZSBzcG9rZW4gaWYgdGhlIFByb3BlcnRpZXMgb2YgcmVzcG9uc2VDb2xsZWN0b3IgYXJlIHRydWUuIElmIGFsbCBvZiB0aG9zZSBhcmUgZmFsc2UsXHJcbiAgICAgICAqIG5vdGhpbmcgd2lsbCBiZSBzcG9rZW4uXHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgdm9pY2luZ1NwZWFrUmVzcG9uc2UoIHByb3ZpZGVkT3B0aW9ucz86IFNwZWFraW5nT3B0aW9ucyApOiB2b2lkIHtcclxuXHJcbiAgICAgICAgLy8gb3B0aW9ucyBhcmUgcGFzc2VkIGFsb25nIHRvIGNvbGxlY3RBbmRTcGVha1Jlc3BvbnNlLCBzZWUgdGhhdCBmdW5jdGlvbiBmb3IgYWRkaXRpb25hbCBvcHRpb25zXHJcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGNvbWJpbmVPcHRpb25zPFNwZWFraW5nT3B0aW9ucz4oIHtcclxuICAgICAgICAgIG5hbWVSZXNwb25zZTogbnVsbCxcclxuICAgICAgICAgIG9iamVjdFJlc3BvbnNlOiBudWxsLFxyXG4gICAgICAgICAgY29udGV4dFJlc3BvbnNlOiBudWxsLFxyXG4gICAgICAgICAgaGludFJlc3BvbnNlOiBudWxsXHJcbiAgICAgICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgICAgIHRoaXMuY29sbGVjdEFuZFNwZWFrUmVzcG9uc2UoIG9wdGlvbnMgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEJ5IGRlZmF1bHQsIHNwZWFrIHRoZSBuYW1lIHJlc3BvbnNlLiBCdXQgYWNjZXB0cyBhbGwgb3RoZXIgcmVzcG9uc2VzIHRocm91Z2ggb3B0aW9ucy4gUmVzcGVjdHMgcmVzcG9uc2VDb2xsZWN0b3JcclxuICAgICAgICogUHJvcGVydGllcywgc28gdGhlIG5hbWUgcmVzcG9uc2UgbWF5IG5vdCBiZSBzcG9rZW4gaWYgcmVzcG9uc2VDb2xsZWN0b3IubmFtZVJlc3BvbnNlRW5hYmxlZFByb3BlcnR5IGlzIGZhbHNlLlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIHZvaWNpbmdTcGVha05hbWVSZXNwb25zZSggcHJvdmlkZWRPcHRpb25zPzogU3BlYWtpbmdPcHRpb25zICk6IHZvaWQge1xyXG5cclxuICAgICAgICAvLyBvcHRpb25zIGFyZSBwYXNzZWQgYWxvbmcgdG8gY29sbGVjdEFuZFNwZWFrUmVzcG9uc2UsIHNlZSB0aGF0IGZ1bmN0aW9uIGZvciBhZGRpdGlvbmFsIG9wdGlvbnNcclxuICAgICAgICBjb25zdCBvcHRpb25zID0gY29tYmluZU9wdGlvbnM8U3BlYWtpbmdPcHRpb25zPigge30sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgICAgICAvLyBMYXppbHkgZm9ybXVsYXRlIHN0cmluZ3Mgb25seSBhcyBuZWVkZWRcclxuICAgICAgICBpZiAoICFvcHRpb25zLmhhc093blByb3BlcnR5KCAnbmFtZVJlc3BvbnNlJyApICkge1xyXG4gICAgICAgICAgb3B0aW9ucy5uYW1lUmVzcG9uc2UgPSB0aGlzLl92b2ljaW5nUmVzcG9uc2VQYWNrZXQubmFtZVJlc3BvbnNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5jb2xsZWN0QW5kU3BlYWtSZXNwb25zZSggb3B0aW9ucyApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogQnkgZGVmYXVsdCwgc3BlYWsgdGhlIG9iamVjdCByZXNwb25zZS4gQnV0IGFjY2VwdHMgYWxsIG90aGVyIHJlc3BvbnNlcyB0aHJvdWdoIG9wdGlvbnMuIFJlc3BlY3RzIHJlc3BvbnNlQ29sbGVjdG9yXHJcbiAgICAgICAqIFByb3BlcnRpZXMsIHNvIHRoZSBvYmplY3QgcmVzcG9uc2UgbWF5IG5vdCBiZSBzcG9rZW4gaWYgcmVzcG9uc2VDb2xsZWN0b3Iub2JqZWN0UmVzcG9uc2VFbmFibGVkUHJvcGVydHkgaXMgZmFsc2UuXHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgdm9pY2luZ1NwZWFrT2JqZWN0UmVzcG9uc2UoIHByb3ZpZGVkT3B0aW9ucz86IFNwZWFraW5nT3B0aW9ucyApOiB2b2lkIHtcclxuXHJcbiAgICAgICAgLy8gb3B0aW9ucyBhcmUgcGFzc2VkIGFsb25nIHRvIGNvbGxlY3RBbmRTcGVha1Jlc3BvbnNlLCBzZWUgdGhhdCBmdW5jdGlvbiBmb3IgYWRkaXRpb25hbCBvcHRpb25zXHJcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGNvbWJpbmVPcHRpb25zPFNwZWFraW5nT3B0aW9ucz4oIHt9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICAgICAgLy8gTGF6aWx5IGZvcm11bGF0ZSBzdHJpbmdzIG9ubHkgYXMgbmVlZGVkXHJcbiAgICAgICAgaWYgKCAhb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSggJ29iamVjdFJlc3BvbnNlJyApICkge1xyXG4gICAgICAgICAgb3B0aW9ucy5vYmplY3RSZXNwb25zZSA9IHRoaXMuX3ZvaWNpbmdSZXNwb25zZVBhY2tldC5vYmplY3RSZXNwb25zZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuY29sbGVjdEFuZFNwZWFrUmVzcG9uc2UoIG9wdGlvbnMgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEJ5IGRlZmF1bHQsIHNwZWFrIHRoZSBjb250ZXh0IHJlc3BvbnNlLiBCdXQgYWNjZXB0cyBhbGwgb3RoZXIgcmVzcG9uc2VzIHRocm91Z2ggb3B0aW9ucy4gUmVzcGVjdHNcclxuICAgICAgICogcmVzcG9uc2VDb2xsZWN0b3IgUHJvcGVydGllcywgc28gdGhlIGNvbnRleHQgcmVzcG9uc2UgbWF5IG5vdCBiZSBzcG9rZW4gaWZcclxuICAgICAgICogcmVzcG9uc2VDb2xsZWN0b3IuY29udGV4dFJlc3BvbnNlRW5hYmxlZFByb3BlcnR5IGlzIGZhbHNlLlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIHZvaWNpbmdTcGVha0NvbnRleHRSZXNwb25zZSggcHJvdmlkZWRPcHRpb25zPzogU3BlYWtpbmdPcHRpb25zICk6IHZvaWQge1xyXG5cclxuICAgICAgICAvLyBvcHRpb25zIGFyZSBwYXNzZWQgYWxvbmcgdG8gY29sbGVjdEFuZFNwZWFrUmVzcG9uc2UsIHNlZSB0aGF0IGZ1bmN0aW9uIGZvciBhZGRpdGlvbmFsIG9wdGlvbnNcclxuICAgICAgICBjb25zdCBvcHRpb25zID0gY29tYmluZU9wdGlvbnM8U3BlYWtpbmdPcHRpb25zPigge30sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgICAgICAvLyBMYXppbHkgZm9ybXVsYXRlIHN0cmluZ3Mgb25seSBhcyBuZWVkZWRcclxuICAgICAgICBpZiAoICFvcHRpb25zLmhhc093blByb3BlcnR5KCAnY29udGV4dFJlc3BvbnNlJyApICkge1xyXG4gICAgICAgICAgb3B0aW9ucy5jb250ZXh0UmVzcG9uc2UgPSB0aGlzLl92b2ljaW5nUmVzcG9uc2VQYWNrZXQuY29udGV4dFJlc3BvbnNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5jb2xsZWN0QW5kU3BlYWtSZXNwb25zZSggb3B0aW9ucyApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogQnkgZGVmYXVsdCwgc3BlYWsgdGhlIGhpbnQgcmVzcG9uc2UuIEJ1dCBhY2NlcHRzIGFsbCBvdGhlciByZXNwb25zZXMgdGhyb3VnaCBvcHRpb25zLiBSZXNwZWN0c1xyXG4gICAgICAgKiByZXNwb25zZUNvbGxlY3RvciBQcm9wZXJ0aWVzLCBzbyB0aGUgaGludCByZXNwb25zZSBtYXkgbm90IGJlIHNwb2tlbiBpZlxyXG4gICAgICAgKiByZXNwb25zZUNvbGxlY3Rvci5oaW50UmVzcG9uc2VFbmFibGVkUHJvcGVydHkgaXMgZmFsc2UuXHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgdm9pY2luZ1NwZWFrSGludFJlc3BvbnNlKCBwcm92aWRlZE9wdGlvbnM/OiBTcGVha2luZ09wdGlvbnMgKTogdm9pZCB7XHJcblxyXG4gICAgICAgIC8vIG9wdGlvbnMgYXJlIHBhc3NlZCBhbG9uZyB0byBjb2xsZWN0QW5kU3BlYWtSZXNwb25zZSwgc2VlIHRoYXQgZnVuY3Rpb24gZm9yIGFkZGl0aW9uYWwgb3B0aW9uc1xyXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBjb21iaW5lT3B0aW9uczxTcGVha2luZ09wdGlvbnM+KCB7fSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgICAgIC8vIExhemlseSBmb3JtdWxhdGUgc3RyaW5ncyBvbmx5IGFzIG5lZWRlZFxyXG4gICAgICAgIGlmICggIW9wdGlvbnMuaGFzT3duUHJvcGVydHkoICdoaW50UmVzcG9uc2UnICkgKSB7XHJcbiAgICAgICAgICBvcHRpb25zLmhpbnRSZXNwb25zZSA9IHRoaXMuX3ZvaWNpbmdSZXNwb25zZVBhY2tldC5oaW50UmVzcG9uc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmNvbGxlY3RBbmRTcGVha1Jlc3BvbnNlKCBvcHRpb25zICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBDb2xsZWN0IHJlc3BvbnNlcyB3aXRoIHRoZSByZXNwb25zZUNvbGxlY3RvciBhbmQgc3BlYWsgdGhlIG91dHB1dCB3aXRoIGFuIFV0dGVyYW5jZVF1ZXVlLlxyXG4gICAgICAgKi9cclxuICAgICAgcHJpdmF0ZSBjb2xsZWN0QW5kU3BlYWtSZXNwb25zZSggcHJvdmlkZWRPcHRpb25zPzogU3BlYWtpbmdPcHRpb25zICk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuc3BlYWtDb250ZW50KCB0aGlzLmNvbGxlY3RSZXNwb25zZSggcHJvdmlkZWRPcHRpb25zICkgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIENvbWJpbmUgYWxsIHR5cGVzIG9mIHJlc3BvbnNlIGludG8gYSBzaW5nbGUgYWxlcnRhYmxlLCBwb3RlbnRpYWxseSBkZXBlbmRpbmcgb24gdGhlIGN1cnJlbnQgc3RhdGUgb2ZcclxuICAgICAgICogcmVzcG9uc2VDb2xsZWN0b3IgUHJvcGVydGllcyAoZmlsdGVyaW5nIHdoYXQga2luZCBvZiByZXNwb25zZXMgdG8gcHJlc2VudCBpbiB0aGUgcmVzb2x2ZWQgcmVzcG9uc2UpLlxyXG4gICAgICAgKiBAbWl4aW4tcHJvdGVjdGVkIC0gbWFkZSBwdWJsaWMgZm9yIHVzZSBpbiB0aGUgbWl4aW4gb25seVxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIGNvbGxlY3RSZXNwb25zZSggcHJvdmlkZWRPcHRpb25zPzogU3BlYWtpbmdPcHRpb25zICk6IFRBbGVydGFibGUge1xyXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBjb21iaW5lT3B0aW9uczxTcGVha2luZ09wdGlvbnM+KCB7XHJcbiAgICAgICAgICBpZ25vcmVQcm9wZXJ0aWVzOiB0aGlzLl92b2ljaW5nUmVzcG9uc2VQYWNrZXQuaWdub3JlUHJvcGVydGllcyxcclxuICAgICAgICAgIHJlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb246IHRoaXMuX3ZvaWNpbmdSZXNwb25zZVBhY2tldC5yZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uLFxyXG4gICAgICAgICAgdXR0ZXJhbmNlOiB0aGlzLnZvaWNpbmdVdHRlcmFuY2VcclxuICAgICAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICAgICAgbGV0IHJlc3BvbnNlOiBUQWxlcnRhYmxlID0gcmVzcG9uc2VDb2xsZWN0b3IuY29sbGVjdFJlc3BvbnNlcyggb3B0aW9ucyApO1xyXG5cclxuICAgICAgICBpZiAoIG9wdGlvbnMudXR0ZXJhbmNlICkge1xyXG4gICAgICAgICAgb3B0aW9ucy51dHRlcmFuY2UuYWxlcnQgPSByZXNwb25zZTtcclxuICAgICAgICAgIHJlc3BvbnNlID0gb3B0aW9ucy51dHRlcmFuY2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXNwb25zZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFVzZSB0aGUgcHJvdmlkZWQgZnVuY3Rpb24gdG8gY3JlYXRlIGNvbnRlbnQgdG8gc3BlYWsgaW4gcmVzcG9uc2UgdG8gaW5wdXQuIFRoZSBjb250ZW50IGlzIHRoZW4gYWRkZWQgdG8gdGhlXHJcbiAgICAgICAqIGJhY2sgb2YgdGhlIHZvaWNpbmcgVXR0ZXJhbmNlUXVldWUuXHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgc3BlYWtDb250ZW50KCBjb250ZW50OiBUQWxlcnRhYmxlICk6IHZvaWQge1xyXG5cclxuICAgICAgICBjb25zdCBub3RQaGV0aW9BcmNoZXR5cGUgPSAhVGFuZGVtLlBIRVRfSU9fRU5BQkxFRCB8fCAhdGhpcy5pc0luc2lkZVBoZXRpb0FyY2hldHlwZSgpO1xyXG5cclxuICAgICAgICAvLyBkb24ndCBzZW5kIHRvIHV0dGVyYW5jZVF1ZXVlIGlmIHJlc3BvbnNlIGlzIGVtcHR5XHJcbiAgICAgICAgLy8gZG9uJ3Qgc2VuZCB0byB1dHRlcmFuY2VRdWV1ZSBmb3IgUGhFVC1pTyBkeW5hbWljIGVsZW1lbnQgYXJjaGV0eXBlcywgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2pvaXN0L2lzc3Vlcy84MTdcclxuICAgICAgICBpZiAoIGNvbnRlbnQgJiYgbm90UGhldGlvQXJjaGV0eXBlICkge1xyXG4gICAgICAgICAgdm9pY2luZ1V0dGVyYW5jZVF1ZXVlLmFkZFRvQmFjayggY29udGVudCApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGJhZC1zaW0tdGV4dFxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFNldHMgdGhlIHZvaWNpbmdOYW1lUmVzcG9uc2UgZm9yIHRoaXMgTm9kZS4gVGhpcyBpcyB1c3VhbGx5IHRoZSBsYWJlbCBvZiB0aGUgZWxlbWVudCBhbmQgaXMgc3Bva2VuXHJcbiAgICAgICAqIHdoZW4gdGhlIG9iamVjdCByZWNlaXZlcyBpbnB1dC4gV2hlbiByZXF1ZXN0aW5nIHNwZWVjaCwgdGhpcyB3aWxsIG9ubHkgYmUgc3Bva2VuIGlmXHJcbiAgICAgICAqIHJlc3BvbnNlQ29sbGVjdG9yLm5hbWVSZXNwb25zZXNFbmFibGVkUHJvcGVydHkgaXMgc2V0IHRvIHRydWUuXHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgc2V0Vm9pY2luZ05hbWVSZXNwb25zZSggcmVzcG9uc2U6IFZvaWNpbmdSZXNwb25zZSApOiB2b2lkIHtcclxuICAgICAgICB0aGlzLl92b2ljaW5nUmVzcG9uc2VQYWNrZXQubmFtZVJlc3BvbnNlID0gcmVzcG9uc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHB1YmxpYyBzZXQgdm9pY2luZ05hbWVSZXNwb25zZSggcmVzcG9uc2U6IFZvaWNpbmdSZXNwb25zZSApIHsgdGhpcy5zZXRWb2ljaW5nTmFtZVJlc3BvbnNlKCByZXNwb25zZSApOyB9XHJcblxyXG4gICAgICBwdWJsaWMgZ2V0IHZvaWNpbmdOYW1lUmVzcG9uc2UoKTogUmVzb2x2ZWRSZXNwb25zZSB7IHJldHVybiB0aGlzLmdldFZvaWNpbmdOYW1lUmVzcG9uc2UoKTsgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEdldCB0aGUgdm9pY2luZ05hbWVSZXNwb25zZSBmb3IgdGhpcyBOb2RlLlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIGdldFZvaWNpbmdOYW1lUmVzcG9uc2UoKTogUmVzb2x2ZWRSZXNwb25zZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZvaWNpbmdSZXNwb25zZVBhY2tldC5uYW1lUmVzcG9uc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBTZXQgdGhlIG9iamVjdCByZXNwb25zZSBmb3IgdGhpcyBOb2RlLiBUaGlzIGlzIHVzdWFsbHkgdGhlIHN0YXRlIGluZm9ybWF0aW9uIGFzc29jaWF0ZWQgd2l0aCB0aGlzIE5vZGUsIHN1Y2hcclxuICAgICAgICogYXMgaXRzIGN1cnJlbnQgaW5wdXQgdmFsdWUuIFdoZW4gcmVxdWVzdGluZyBzcGVlY2gsIHRoaXMgd2lsbCBvbmx5IGJlIGhlYXJkIHdoZW5cclxuICAgICAgICogcmVzcG9uc2VDb2xsZWN0b3Iub2JqZWN0UmVzcG9uc2VzRW5hYmxlZFByb3BlcnR5IGlzIHNldCB0byB0cnVlLlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIHNldFZvaWNpbmdPYmplY3RSZXNwb25zZSggcmVzcG9uc2U6IFZvaWNpbmdSZXNwb25zZSApOiB2b2lkIHtcclxuICAgICAgICB0aGlzLl92b2ljaW5nUmVzcG9uc2VQYWNrZXQub2JqZWN0UmVzcG9uc2UgPSByZXNwb25zZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcHVibGljIHNldCB2b2ljaW5nT2JqZWN0UmVzcG9uc2UoIHJlc3BvbnNlOiBWb2ljaW5nUmVzcG9uc2UgKSB7IHRoaXMuc2V0Vm9pY2luZ09iamVjdFJlc3BvbnNlKCByZXNwb25zZSApOyB9XHJcblxyXG4gICAgICBwdWJsaWMgZ2V0IHZvaWNpbmdPYmplY3RSZXNwb25zZSgpOiBSZXNvbHZlZFJlc3BvbnNlIHsgcmV0dXJuIHRoaXMuZ2V0Vm9pY2luZ09iamVjdFJlc3BvbnNlKCk7IH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBHZXRzIHRoZSBvYmplY3QgcmVzcG9uc2UgZm9yIHRoaXMgTm9kZS5cclxuICAgICAgICovXHJcbiAgICAgIHB1YmxpYyBnZXRWb2ljaW5nT2JqZWN0UmVzcG9uc2UoKTogUmVzb2x2ZWRSZXNwb25zZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZvaWNpbmdSZXNwb25zZVBhY2tldC5vYmplY3RSZXNwb25zZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFNldCB0aGUgY29udGV4dCByZXNwb25zZSBmb3IgdGhpcyBOb2RlLiBUaGlzIGlzIHVzdWFsbHkgdGhlIGNvbnRlbnQgdGhhdCBkZXNjcmliZXMgd2hhdCBoYXMgaGFwcGVuZWQgaW5cclxuICAgICAgICogdGhlIHN1cnJvdW5kaW5nIGFwcGxpY2F0aW9uIGluIHJlc3BvbnNlIHRvIGludGVyYWN0aW9uIHdpdGggdGhpcyBOb2RlLiBXaGVuIHJlcXVlc3Rpbmcgc3BlZWNoLCB0aGlzIHdpbGxcclxuICAgICAgICogb25seSBiZSBoZWFyZCBpZiByZXNwb25zZUNvbGxlY3Rvci5jb250ZXh0UmVzcG9uc2VzRW5hYmxlZFByb3BlcnR5IGlzIHNldCB0byB0cnVlLlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIHNldFZvaWNpbmdDb250ZXh0UmVzcG9uc2UoIHJlc3BvbnNlOiBWb2ljaW5nUmVzcG9uc2UgKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5fdm9pY2luZ1Jlc3BvbnNlUGFja2V0LmNvbnRleHRSZXNwb25zZSA9IHJlc3BvbnNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwdWJsaWMgc2V0IHZvaWNpbmdDb250ZXh0UmVzcG9uc2UoIHJlc3BvbnNlOiBWb2ljaW5nUmVzcG9uc2UgKSB7IHRoaXMuc2V0Vm9pY2luZ0NvbnRleHRSZXNwb25zZSggcmVzcG9uc2UgKTsgfVxyXG5cclxuICAgICAgcHVibGljIGdldCB2b2ljaW5nQ29udGV4dFJlc3BvbnNlKCk6IFJlc29sdmVkUmVzcG9uc2UgeyByZXR1cm4gdGhpcy5nZXRWb2ljaW5nQ29udGV4dFJlc3BvbnNlKCk7IH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBHZXRzIHRoZSBjb250ZXh0IHJlc3BvbnNlIGZvciB0aGlzIE5vZGUuXHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgZ2V0Vm9pY2luZ0NvbnRleHRSZXNwb25zZSgpOiBSZXNvbHZlZFJlc3BvbnNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdm9pY2luZ1Jlc3BvbnNlUGFja2V0LmNvbnRleHRSZXNwb25zZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFNldHMgdGhlIGhpbnQgcmVzcG9uc2UgZm9yIHRoaXMgTm9kZS4gVGhpcyBpcyB1c3VhbGx5IGEgcmVzcG9uc2UgdGhhdCBkZXNjcmliZXMgaG93IHRvIGludGVyYWN0IHdpdGggdGhpcyBOb2RlLlxyXG4gICAgICAgKiBXaGVuIHJlcXVlc3Rpbmcgc3BlZWNoLCB0aGlzIHdpbGwgb25seSBiZSBzcG9rZW4gd2hlbiByZXNwb25zZUNvbGxlY3Rvci5oaW50UmVzcG9uc2VzRW5hYmxlZFByb3BlcnR5IGlzIHNldCB0b1xyXG4gICAgICAgKiB0cnVlLlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIHNldFZvaWNpbmdIaW50UmVzcG9uc2UoIHJlc3BvbnNlOiBWb2ljaW5nUmVzcG9uc2UgKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5fdm9pY2luZ1Jlc3BvbnNlUGFja2V0LmhpbnRSZXNwb25zZSA9IHJlc3BvbnNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwdWJsaWMgc2V0IHZvaWNpbmdIaW50UmVzcG9uc2UoIHJlc3BvbnNlOiBWb2ljaW5nUmVzcG9uc2UgKSB7IHRoaXMuc2V0Vm9pY2luZ0hpbnRSZXNwb25zZSggcmVzcG9uc2UgKTsgfVxyXG5cclxuICAgICAgcHVibGljIGdldCB2b2ljaW5nSGludFJlc3BvbnNlKCk6IFJlc29sdmVkUmVzcG9uc2UgeyByZXR1cm4gdGhpcy5nZXRWb2ljaW5nSGludFJlc3BvbnNlKCk7IH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBHZXRzIHRoZSBoaW50IHJlc3BvbnNlIGZvciB0aGlzIE5vZGUuXHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgZ2V0Vm9pY2luZ0hpbnRSZXNwb25zZSgpOiBSZXNvbHZlZFJlc3BvbnNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdm9pY2luZ1Jlc3BvbnNlUGFja2V0LmhpbnRSZXNwb25zZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFNldCB3aGV0aGVyIG9yIG5vdCBhbGwgcmVzcG9uc2VzIGZvciB0aGlzIE5vZGUgd2lsbCBpZ25vcmUgdGhlIFByb3BlcnRpZXMgb2YgcmVzcG9uc2VDb2xsZWN0b3IuIElmIGZhbHNlLFxyXG4gICAgICAgKiBhbGwgcmVzcG9uc2VzIHdpbGwgYmUgc3Bva2VuIHJlZ2FyZGxlc3Mgb2YgcmVzcG9uc2VDb2xsZWN0b3IgUHJvcGVydGllcywgd2hpY2ggYXJlIGdlbmVyYWxseSBzZXQgaW4gdXNlclxyXG4gICAgICAgKiBwcmVmZXJlbmNlcy5cclxuICAgICAgICovXHJcbiAgICAgIHB1YmxpYyBzZXRWb2ljaW5nSWdub3JlVm9pY2luZ01hbmFnZXJQcm9wZXJ0aWVzKCBpZ25vcmVQcm9wZXJ0aWVzOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuX3ZvaWNpbmdSZXNwb25zZVBhY2tldC5pZ25vcmVQcm9wZXJ0aWVzID0gaWdub3JlUHJvcGVydGllcztcclxuICAgICAgfVxyXG5cclxuICAgICAgcHVibGljIHNldCB2b2ljaW5nSWdub3JlVm9pY2luZ01hbmFnZXJQcm9wZXJ0aWVzKCBpZ25vcmVQcm9wZXJ0aWVzOiBib29sZWFuICkgeyB0aGlzLnNldFZvaWNpbmdJZ25vcmVWb2ljaW5nTWFuYWdlclByb3BlcnRpZXMoIGlnbm9yZVByb3BlcnRpZXMgKTsgfVxyXG5cclxuICAgICAgcHVibGljIGdldCB2b2ljaW5nSWdub3JlVm9pY2luZ01hbmFnZXJQcm9wZXJ0aWVzKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5nZXRWb2ljaW5nSWdub3JlVm9pY2luZ01hbmFnZXJQcm9wZXJ0aWVzKCk7IH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBHZXQgd2hldGhlciBvciBub3QgcmVzcG9uc2VzIGFyZSBpZ25vcmluZyByZXNwb25zZUNvbGxlY3RvciBQcm9wZXJ0aWVzLlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIGdldFZvaWNpbmdJZ25vcmVWb2ljaW5nTWFuYWdlclByb3BlcnRpZXMoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZvaWNpbmdSZXNwb25zZVBhY2tldC5pZ25vcmVQcm9wZXJ0aWVzO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogU2V0cyB0aGUgY29sbGVjdGlvbiBvZiBwYXR0ZXJucyB0byB1c2UgZm9yIHZvaWNpbmcgcmVzcG9uc2VzLCBjb250cm9sbGluZyB0aGUgb3JkZXIsIHB1bmN0dWF0aW9uLCBhbmRcclxuICAgICAgICogYWRkaXRpb25hbCBjb250ZW50IGZvciBlYWNoIGNvbWJpbmF0aW9uIG9mIHJlc3BvbnNlLiBTZWUgUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbi5qcyBpZiB5b3Ugd2lzaCB0byB1c2VcclxuICAgICAgICogYSBjb2xsZWN0aW9uIG9mIHN0cmluZyBwYXR0ZXJucyB0aGF0IGFyZSBub3QgdGhlIGRlZmF1bHQuXHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgc2V0Vm9pY2luZ1Jlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb24oIHBhdHRlcm5zOiBSZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uICk6IHZvaWQge1xyXG5cclxuICAgICAgICB0aGlzLl92b2ljaW5nUmVzcG9uc2VQYWNrZXQucmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbiA9IHBhdHRlcm5zO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwdWJsaWMgc2V0IHZvaWNpbmdSZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uKCBwYXR0ZXJuczogUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbiApIHsgdGhpcy5zZXRWb2ljaW5nUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbiggcGF0dGVybnMgKTsgfVxyXG5cclxuICAgICAgcHVibGljIGdldCB2b2ljaW5nUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbigpOiBSZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uIHsgcmV0dXJuIHRoaXMuZ2V0Vm9pY2luZ1Jlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb24oKTsgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEdldCB0aGUgUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbiBvYmplY3QgdGhhdCB0aGlzIFZvaWNpbmcgTm9kZSBpcyB1c2luZyB0byBjb2xsZWN0IHJlc3BvbnNlcy5cclxuICAgICAgICovXHJcbiAgICAgIHB1YmxpYyBnZXRWb2ljaW5nUmVzcG9uc2VQYXR0ZXJuQ29sbGVjdGlvbigpOiBSZXNwb25zZVBhdHRlcm5Db2xsZWN0aW9uIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdm9pY2luZ1Jlc3BvbnNlUGFja2V0LnJlc3BvbnNlUGF0dGVybkNvbGxlY3Rpb247XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBTZXRzIHRoZSB1dHRlcmFuY2UgdGhyb3VnaCB3aGljaCB2b2ljaW5nIGFzc29jaWF0ZWQgd2l0aCB0aGlzIE5vZGUgd2lsbCBiZSBzcG9rZW4uIEJ5IGRlZmF1bHQgb24gaW5pdGlhbGl6ZSxcclxuICAgICAgICogb25lIHdpbGwgYmUgY3JlYXRlZCwgYnV0IGEgY3VzdG9tIG9uZSBjYW4gb3B0aW9uYWxseSBiZSBwcm92aWRlZC5cclxuICAgICAgICovXHJcbiAgICAgIHB1YmxpYyBzZXRWb2ljaW5nVXR0ZXJhbmNlKCB1dHRlcmFuY2U6IFV0dGVyYW5jZSApOiB2b2lkIHtcclxuICAgICAgICBpZiAoIHRoaXMuX3ZvaWNpbmdVdHRlcmFuY2UgIT09IHV0dGVyYW5jZSApIHtcclxuXHJcbiAgICAgICAgICBpZiAoIHRoaXMuX3ZvaWNpbmdVdHRlcmFuY2UgKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xlYW5Wb2ljaW5nVXR0ZXJhbmNlKCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgVm9pY2luZy5yZWdpc3RlclV0dGVyYW5jZVRvVm9pY2luZ05vZGUoIHV0dGVyYW5jZSwgdGhpcyApO1xyXG4gICAgICAgICAgdGhpcy5fdm9pY2luZ1V0dGVyYW5jZSA9IHV0dGVyYW5jZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHB1YmxpYyBzZXQgdm9pY2luZ1V0dGVyYW5jZSggdXR0ZXJhbmNlOiBVdHRlcmFuY2UgKSB7IHRoaXMuc2V0Vm9pY2luZ1V0dGVyYW5jZSggdXR0ZXJhbmNlICk7IH1cclxuXHJcbiAgICAgIHB1YmxpYyBnZXQgdm9pY2luZ1V0dGVyYW5jZSgpOiBVdHRlcmFuY2UgeyByZXR1cm4gdGhpcy5nZXRWb2ljaW5nVXR0ZXJhbmNlKCk7IH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBHZXRzIHRoZSB1dHRlcmFuY2UgdGhyb3VnaCB3aGljaCB2b2ljaW5nIGFzc29jaWF0ZWQgd2l0aCB0aGlzIE5vZGUgd2lsbCBiZSBzcG9rZW4uXHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgZ2V0Vm9pY2luZ1V0dGVyYW5jZSgpOiBVdHRlcmFuY2Uge1xyXG4gICAgICAgIGFzc2VydFV0dGVyYW5jZSggdGhpcy5fdm9pY2luZ1V0dGVyYW5jZSApO1xyXG4gICAgICAgIHJldHVybiB0aGlzLl92b2ljaW5nVXR0ZXJhbmNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogQ2FsbGVkIHdoZW5ldmVyIHRoaXMgTm9kZSBpcyBmb2N1c2VkLlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIHNldFZvaWNpbmdGb2N1c0xpc3RlbmVyKCBmb2N1c0xpc3RlbmVyOiBTY2VuZXJ5TGlzdGVuZXJGdW5jdGlvbjxGb2N1c0V2ZW50PiB8IG51bGwgKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5fdm9pY2luZ0ZvY3VzTGlzdGVuZXIgPSBmb2N1c0xpc3RlbmVyO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwdWJsaWMgc2V0IHZvaWNpbmdGb2N1c0xpc3RlbmVyKCBmb2N1c0xpc3RlbmVyOiBTY2VuZXJ5TGlzdGVuZXJGdW5jdGlvbjxGb2N1c0V2ZW50PiB8IG51bGwgKSB7IHRoaXMuc2V0Vm9pY2luZ0ZvY3VzTGlzdGVuZXIoIGZvY3VzTGlzdGVuZXIgKTsgfVxyXG5cclxuICAgICAgcHVibGljIGdldCB2b2ljaW5nRm9jdXNMaXN0ZW5lcigpOiBTY2VuZXJ5TGlzdGVuZXJGdW5jdGlvbjxGb2N1c0V2ZW50PiB8IG51bGwgeyByZXR1cm4gdGhpcy5nZXRWb2ljaW5nRm9jdXNMaXN0ZW5lcigpOyB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogR2V0cyB0aGUgdXR0ZXJhbmNlUXVldWUgdGhyb3VnaCB3aGljaCB2b2ljaW5nIGFzc29jaWF0ZWQgd2l0aCB0aGlzIE5vZGUgd2lsbCBiZSBzcG9rZW4uXHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgZ2V0Vm9pY2luZ0ZvY3VzTGlzdGVuZXIoKTogU2NlbmVyeUxpc3RlbmVyRnVuY3Rpb248Rm9jdXNFdmVudD4gfCBudWxsIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdm9pY2luZ0ZvY3VzTGlzdGVuZXI7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBUaGUgZGVmYXVsdCBmb2N1cyBsaXN0ZW5lciBhdHRhY2hlZCB0byB0aGlzIE5vZGUgZHVyaW5nIGluaXRpYWxpemF0aW9uLlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIGRlZmF1bHRGb2N1c0xpc3RlbmVyKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMudm9pY2luZ1NwZWFrRnVsbFJlc3BvbnNlKCB7XHJcbiAgICAgICAgICBjb250ZXh0UmVzcG9uc2U6IG51bGxcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBXaGV0aGVyIGEgTm9kZSBjb21wb3NlcyBWb2ljaW5nLlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIGdldCBpc1ZvaWNpbmcoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBEZXRhY2hlcyByZWZlcmVuY2VzIHRoYXQgZW5zdXJlIHRoaXMgY29tcG9uZW50cyBvZiB0aGlzIFRyYWl0IGFyZSBlbGlnaWJsZSBmb3IgZ2FyYmFnZSBjb2xsZWN0aW9uLlxyXG4gICAgICAgKi9cclxuICAgICAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5yZW1vdmVJbnB1dExpc3RlbmVyKCB0aGlzLl9zcGVha0NvbnRlbnRPbkZvY3VzTGlzdGVuZXIgKTtcclxuICAgICAgICB0aGlzLmNoYW5nZWRJbnN0YW5jZUVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoIHRoaXMuX2JvdW5kSW5zdGFuY2VzQ2hhbmdlZExpc3RlbmVyICk7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5fdm9pY2luZ1V0dGVyYW5jZSApIHtcclxuICAgICAgICAgIHRoaXMuY2xlYW5Wb2ljaW5nVXR0ZXJhbmNlKCk7XHJcbiAgICAgICAgICB0aGlzLl92b2ljaW5nVXR0ZXJhbmNlID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcHVibGljIGNsZWFuKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMucmVtb3ZlSW5wdXRMaXN0ZW5lciggdGhpcy5fc3BlYWtDb250ZW50T25Gb2N1c0xpc3RlbmVyICk7XHJcbiAgICAgICAgdGhpcy5jaGFuZ2VkSW5zdGFuY2VFbWl0dGVyLnJlbW92ZUxpc3RlbmVyKCB0aGlzLl9ib3VuZEluc3RhbmNlc0NoYW5nZWRMaXN0ZW5lciApO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMuX3ZvaWNpbmdVdHRlcmFuY2UgKSB7XHJcbiAgICAgICAgICB0aGlzLmNsZWFuVm9pY2luZ1V0dGVyYW5jZSgpO1xyXG4gICAgICAgICAgdGhpcy5fdm9pY2luZ1V0dGVyYW5jZSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXHJcbiAgICAgICAgc3VwZXIuY2xlYW4gJiYgc3VwZXIuY2xlYW4oKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG4gICAgICAvLyBQUklWQVRFIE1FVEhPRFNcclxuICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFdoZW4gdmlzaWJpbGl0eSBhbmQgdm9pY2luZ1Zpc2liaWxpdHkgY2hhbmdlIHN1Y2ggdGhhdCB0aGUgSW5zdGFuY2UgY2FuIG5vdyBzcGVhaywgdXBkYXRlIHRoZSBjb3VudGluZ1xyXG4gICAgICAgKiB2YXJpYWJsZSB0aGF0IHRyYWNrcyBob3cgbWFueSBJbnN0YW5jZXMgb2YgdGhpcyBWb2ljaW5nTm9kZSBjYW4gc3BlYWsuIFRvIHNwZWFrIHRoZSBJbnN0YW5jZSBtdXN0IGJlIGdsb2JhbGx5XFxcclxuICAgICAgICogdmlzaWJsZSBhbmQgdm9pY2luZ1Zpc2libGUuXHJcbiAgICAgICAqL1xyXG4gICAgICBwcml2YXRlIG9uSW5zdGFuY2VDYW5Wb2ljZUNoYW5nZSggY2FuU3BlYWs6IGJvb2xlYW4gKTogdm9pZCB7XHJcblxyXG4gICAgICAgIGlmICggY2FuU3BlYWsgKSB7XHJcbiAgICAgICAgICB0aGlzLl92b2ljaW5nQ2FuU3BlYWtDb3VudCsrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHRoaXMuX3ZvaWNpbmdDYW5TcGVha0NvdW50LS07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl92b2ljaW5nQ2FuU3BlYWtDb3VudCA+PSAwLCAndGhlIHZvaWNpbmdDYW5TcGVha0NvdW50IHNob3VsZCBub3QgZ28gYmVsb3cgemVybycgKTtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLl92b2ljaW5nQ2FuU3BlYWtDb3VudCA8PSB0aGlzLmluc3RhbmNlcy5sZW5ndGgsXHJcbiAgICAgICAgICAnVGhlIHZvaWNpbmdDYW5TcGVha0NvdW50IGNhbm5vdCBiZSBncmVhdGVyIHRoYW4gdGhlIG51bWJlciBvZiBJbnN0YW5jZXMuJyApO1xyXG5cclxuICAgICAgICB0aGlzLl92b2ljaW5nQ2FuU3BlYWtQcm9wZXJ0eS52YWx1ZSA9IHRoaXMuX3ZvaWNpbmdDYW5TcGVha0NvdW50ID4gMDtcclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFVwZGF0ZSB0aGUgY2FuU3BlYWtQcm9wZXJ0eSBhbmQgY291bnRpbmcgdmFyaWFibGUgaW4gcmVzcG9uc2UgdG8gYW4gSW5zdGFuY2Ugb2YgdGhpcyBOb2RlIGJlaW5nIGFkZGVkIG9yXHJcbiAgICAgICAqIHJlbW92ZWQuXHJcbiAgICAgICAqL1xyXG4gICAgICBwcml2YXRlIGhhbmRsZUluc3RhbmNlc0NoYW5nZWQoIGluc3RhbmNlOiBJbnN0YW5jZSwgYWRkZWQ6IGJvb2xlYW4gKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgaXNWaXNpYmxlID0gaW5zdGFuY2UudmlzaWJsZSAmJiBpbnN0YW5jZS52b2ljaW5nVmlzaWJsZTtcclxuICAgICAgICBpZiAoIGlzVmlzaWJsZSApIHtcclxuXHJcbiAgICAgICAgICAvLyBJZiB0aGUgYWRkZWQgSW5zdGFuY2Ugd2FzIHZpc2libGUgYW5kIHZvaWNpbmdWaXNpYmxlIGl0IHNob3VsZCBpbmNyZW1lbnQgdGhlIGNvdW50ZXIuIElmIHRoZSByZW1vdmVkXHJcbiAgICAgICAgICAvLyBpbnN0YW5jZSBpcyBOT1QgdmlzaWJsZS92b2ljaW5nVmlzaWJsZSBpdCB3b3VsZCBub3QgaGF2ZSBjb250cmlidXRlZCB0byB0aGUgY291bnRlciBzbyB3ZSBzaG91bGQgbm90XHJcbiAgICAgICAgICAvLyBkZWNyZW1lbnQgaW4gdGhhdCBjYXNlLlxyXG4gICAgICAgICAgdGhpcy5fdm9pY2luZ0NhblNwZWFrQ291bnQgPSBhZGRlZCA/IHRoaXMuX3ZvaWNpbmdDYW5TcGVha0NvdW50ICsgMSA6IHRoaXMuX3ZvaWNpbmdDYW5TcGVha0NvdW50IC0gMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX3ZvaWNpbmdDYW5TcGVha1Byb3BlcnR5LnZhbHVlID0gdGhpcy5fdm9pY2luZ0NhblNwZWFrQ291bnQgPiAwO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogQWRkIG9yIHJlbW92ZSBsaXN0ZW5lcnMgb24gYW4gSW5zdGFuY2Ugd2F0Y2hpbmcgZm9yIGNoYW5nZXMgdG8gdmlzaWJsZSBvciB2b2ljaW5nVmlzaWJsZSB0aGF0IHdpbGwgbW9kaWZ5XHJcbiAgICAgICAqIHRoZSB2b2ljaW5nQ2FuU3BlYWtDb3VudC4gU2VlIGRvY3VtZW50YXRpb24gZm9yIHZvaWNpbmdDYW5TcGVha0NvdW50IGZvciBkZXRhaWxzIGFib3V0IGhvdyB0aGlzIGNvbnRyb2xzIHRoZVxyXG4gICAgICAgKiB2b2ljaW5nQ2FuU3BlYWtQcm9wZXJ0eS5cclxuICAgICAgICovXHJcbiAgICAgIHByaXZhdGUgYWRkT3JSZW1vdmVJbnN0YW5jZUxpc3RlbmVycyggaW5zdGFuY2U6IEluc3RhbmNlLCBhZGRlZDogYm9vbGVhbiApOiB2b2lkIHtcclxuICAgICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBpbnN0YW5jZS5jYW5Wb2ljZUVtaXR0ZXIsICdJbnN0YW5jZSBtdXN0IGJlIGluaXRpYWxpemVkLicgKTtcclxuXHJcbiAgICAgICAgaWYgKCBhZGRlZCApIHtcclxuICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBFbWl0dGVycyBpbiBJbnN0YW5jZSBuZWVkIHR5cGluZ1xyXG4gICAgICAgICAgaW5zdGFuY2UuY2FuVm9pY2VFbWl0dGVyIS5hZGRMaXN0ZW5lciggdGhpcy5fYm91bmRJbnN0YW5jZUNhblZvaWNlQ2hhbmdlTGlzdGVuZXIgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gRW1pdHRlcnMgaW4gSW5zdGFuY2UgbmVlZCB0eXBpbmdcclxuICAgICAgICAgIGluc3RhbmNlLmNhblZvaWNlRW1pdHRlciEucmVtb3ZlTGlzdGVuZXIoIHRoaXMuX2JvdW5kSW5zdGFuY2VDYW5Wb2ljZUNoYW5nZUxpc3RlbmVyICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBlYWdlcmx5IHVwZGF0ZSB0aGUgY2FuU3BlYWtQcm9wZXJ0eSBhbmQgY291bnRpbmcgdmFyaWFibGVzIGluIGFkZGl0aW9uIHRvIGFkZGluZyBjaGFuZ2UgbGlzdGVuZXJzXHJcbiAgICAgICAgdGhpcy5oYW5kbGVJbnN0YW5jZXNDaGFuZ2VkKCBpbnN0YW5jZSwgYWRkZWQgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIENsZWFuIHRoaXMuX3ZvaWNpbmdVdHRlcmFuY2UsIGRpc3Bvc2luZyBpZiB3ZSBvd24gaXQgb3IgdW5yZWdpc3RlcmluZyBpdCBpZiB3ZSBkbyBub3QuXHJcbiAgICAgICAqIEBtaXhpbi1wcm90ZWN0ZWQgLSBtYWRlIHB1YmxpYyBmb3IgdXNlIGluIHRoZSBtaXhpbiBvbmx5XHJcbiAgICAgICAqL1xyXG4gICAgICBwdWJsaWMgY2xlYW5Wb2ljaW5nVXR0ZXJhbmNlKCk6IHZvaWQge1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuX3ZvaWNpbmdVdHRlcmFuY2UsICdBIHZvaWNpbmdVdHRlcmFuY2UgbXVzdCBiZSBhdmFpbGFibGUgdG8gY2xlYW4uJyApO1xyXG4gICAgICAgIGlmICggdGhpcy5fdm9pY2luZ1V0dGVyYW5jZSBpbnN0YW5jZW9mIE93bmVkVm9pY2luZ1V0dGVyYW5jZSApIHtcclxuICAgICAgICAgIHRoaXMuX3ZvaWNpbmdVdHRlcmFuY2UuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5fdm9pY2luZ1V0dGVyYW5jZSAmJiAhdGhpcy5fdm9pY2luZ1V0dGVyYW5jZS5pc0Rpc3Bvc2VkICkge1xyXG4gICAgICAgICAgVm9pY2luZy51bnJlZ2lzdGVyVXR0ZXJhbmNlVG9Wb2ljaW5nTm9kZSggdGhpcy5fdm9pY2luZ1V0dGVyYW5jZSwgdGhpcyApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcHVibGljIG92ZXJyaWRlIG11dGF0ZSggb3B0aW9ucz86IFNlbGZPcHRpb25zICYgUGFyYW1ldGVyczxJbnN0YW5jZVR5cGU8U3VwZXJUeXBlPlsgJ211dGF0ZScgXT5bIDAgXSApOiB0aGlzIHtcclxuICAgICAgICByZXR1cm4gc3VwZXIubXV0YXRlKCBvcHRpb25zICk7XHJcbiAgICAgIH1cclxuICAgIH0gKTtcclxuXHJcbiAgLyoqXHJcbiAgICoge0FycmF5LjxzdHJpbmc+fSAtIFN0cmluZyBrZXlzIGZvciBhbGwgdGhlIGFsbG93ZWQgb3B0aW9ucyB0aGF0IHdpbGwgYmUgc2V0IGJ5IE5vZGUubXV0YXRlKCBvcHRpb25zICksIGluXHJcbiAgICogdGhlIG9yZGVyIHRoZXkgd2lsbCBiZSBldmFsdWF0ZWQuXHJcbiAgICpcclxuICAgKiBOT1RFOiBTZWUgTm9kZSdzIF9tdXRhdG9yS2V5cyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm9ybWF0aW9uIG9uIGhvdyB0aGlzIG9wZXJhdGVzLCBhbmQgcG90ZW50aWFsIHNwZWNpYWxcclxuICAgKiAgICAgICBjYXNlcyB0aGF0IG1heSBhcHBseS5cclxuICAgKi9cclxuICBWb2ljaW5nQ2xhc3MucHJvdG90eXBlLl9tdXRhdG9yS2V5cyA9IFZPSUNJTkdfT1BUSU9OX0tFWVMuY29uY2F0KCBWb2ljaW5nQ2xhc3MucHJvdG90eXBlLl9tdXRhdG9yS2V5cyApO1xyXG5cclxuICBhc3NlcnQgJiYgYXNzZXJ0KCBWb2ljaW5nQ2xhc3MucHJvdG90eXBlLl9tdXRhdG9yS2V5cy5sZW5ndGggPT09IF8udW5pcSggVm9pY2luZ0NsYXNzLnByb3RvdHlwZS5fbXV0YXRvcktleXMgKS5sZW5ndGgsICdkdXBsaWNhdGUgbXV0YXRvciBrZXlzIGluIFZvaWNpbmcnICk7XHJcblxyXG4gIHJldHVybiBWb2ljaW5nQ2xhc3M7XHJcbn07XHJcblxyXG5Wb2ljaW5nLlZPSUNJTkdfT1BUSU9OX0tFWVMgPSBWT0lDSU5HX09QVElPTl9LRVlTO1xyXG5cclxuLyoqXHJcbiAqIEFsZXJ0IGFuIFV0dGVyYW5jZSB0byB0aGUgdm9pY2luZ1V0dGVyYW5jZVF1ZXVlLiBUaGUgVXR0ZXJhbmNlIG11c3QgaGF2ZSB2b2ljaW5nQ2FuQW5ub3VuY2VQcm9wZXJ0aWVzIGFuZCBob3BlZnVsbHlcclxuICogYXQgbGVhc3Qgb25lIG9mIHRoZSBQcm9wZXJ0aWVzIGlzIGEgVm9pY2luZ05vZGUncyBjYW5Bbm5vdW5jZVByb3BlcnR5IHNvIHRoYXQgdGhpcyBVdHRlcmFuY2UgaXMgb25seSBhbm5vdW5jZWRcclxuICogd2hlbiB0aGUgVm9pY2luZ05vZGUgaXMgZ2xvYmFsbHkgdmlzaWJsZSBhbmQgdm9pY2luZ1Zpc2libGUuXHJcbiAqIEBzdGF0aWNcclxuICovXHJcblZvaWNpbmcuYWxlcnRVdHRlcmFuY2UgPSAoIHV0dGVyYW5jZTogVXR0ZXJhbmNlICkgPT4ge1xyXG4gIGFzc2VydCAmJiBhc3NlcnQoIHV0dGVyYW5jZS52b2ljaW5nQ2FuQW5ub3VuY2VQcm9wZXJ0aWVzLmxlbmd0aCA+IDAsICd2b2ljaW5nQ2FuQW5ub3VuY2VQcm9wZXJ0aWVzIHJlcXVpcmVkLCB0aGlzIFV0dGVyYW5jZSBtaWdodCBub3QgYmUgY29ubmVjdGVkIHRvIE5vZGUgaW4gdGhlIHNjZW5lIGdyYXBoLicgKTtcclxuICB2b2ljaW5nVXR0ZXJhbmNlUXVldWUuYWRkVG9CYWNrKCB1dHRlcmFuY2UgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBiYWQtc2ltLXRleHRcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBc3NpZ24gdGhlIHZvaWNpbmdOb2RlJ3Mgdm9pY2luZ0NhblNwZWFrUHJvcGVydHkgdG8gdGhlIFV0dGVyYW5jZSBzbyB0aGF0IHRoZSBVdHRlcmFuY2UgY2FuIG9ubHkgYmUgYW5ub3VuY2VkXHJcbiAqIGlmIHRoZSB2b2ljaW5nTm9kZSBpcyBnbG9iYWxseSB2aXNpYmxlIGFuZCB2b2ljaW5nVmlzaWJsZSBpbiB0aGUgZGlzcGxheS5cclxuICogQHN0YXRpY1xyXG4gKi9cclxuVm9pY2luZy5yZWdpc3RlclV0dGVyYW5jZVRvVm9pY2luZ05vZGUgPSAoIHV0dGVyYW5jZTogVXR0ZXJhbmNlLCB2b2ljaW5nTm9kZTogVFZvaWNpbmcgKSA9PiB7XHJcbiAgY29uc3QgZXhpc3RpbmdDYW5Bbm5vdW5jZVByb3BlcnRpZXMgPSB1dHRlcmFuY2Uudm9pY2luZ0NhbkFubm91bmNlUHJvcGVydGllcztcclxuXHJcbiAgY29uc3Qgdm9pY2luZ0NhblNwZWFrUHJvcGVydHkgPSB2b2ljaW5nTm9kZS5fdm9pY2luZ0NhblNwZWFrUHJvcGVydHk7XHJcbiAgaWYgKCAhZXhpc3RpbmdDYW5Bbm5vdW5jZVByb3BlcnRpZXMuaW5jbHVkZXMoIHZvaWNpbmdDYW5TcGVha1Byb3BlcnR5ICkgKSB7XHJcbiAgICB1dHRlcmFuY2Uudm9pY2luZ0NhbkFubm91bmNlUHJvcGVydGllcyA9IGV4aXN0aW5nQ2FuQW5ub3VuY2VQcm9wZXJ0aWVzLmNvbmNhdCggWyB2b2ljaW5nQ2FuU3BlYWtQcm9wZXJ0eSBdICk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZSBhIHZvaWNpbmdOb2RlJ3Mgdm9pY2luZ0NhblNwZWFrUHJvcGVydHkgZnJvbSB0aGUgVXR0ZXJhbmNlLlxyXG4gKiBAc3RhdGljXHJcbiAqL1xyXG5Wb2ljaW5nLnVucmVnaXN0ZXJVdHRlcmFuY2VUb1ZvaWNpbmdOb2RlID0gKCB1dHRlcmFuY2U6IFV0dGVyYW5jZSwgdm9pY2luZ05vZGU6IFZvaWNpbmdOb2RlICkgPT4ge1xyXG4gIGNvbnN0IGV4aXN0aW5nQ2FuQW5ub3VuY2VQcm9wZXJ0aWVzID0gdXR0ZXJhbmNlLnZvaWNpbmdDYW5Bbm5vdW5jZVByb3BlcnRpZXM7XHJcblxyXG4gIGNvbnN0IHZvaWNpbmdDYW5TcGVha1Byb3BlcnR5ID0gdm9pY2luZ05vZGUuX3ZvaWNpbmdDYW5TcGVha1Byb3BlcnR5O1xyXG4gIGNvbnN0IGluZGV4ID0gZXhpc3RpbmdDYW5Bbm5vdW5jZVByb3BlcnRpZXMuaW5kZXhPZiggdm9pY2luZ0NhblNwZWFrUHJvcGVydHkgKTtcclxuICBhc3NlcnQgJiYgYXNzZXJ0KCBpbmRleCA+IC0xLCAndm9pY2luZ05vZGUudm9pY2luZ0NhblNwZWFrUHJvcGVydHkgaXMgbm90IG9uIHRoZSBVdHRlcmFuY2UsIHdhcyBpdCBub3QgcmVnaXN0ZXJlZD8nICk7XHJcbiAgdXR0ZXJhbmNlLnZvaWNpbmdDYW5Bbm5vdW5jZVByb3BlcnRpZXMgPSBleGlzdGluZ0NhbkFubm91bmNlUHJvcGVydGllcy5zcGxpY2UoIGluZGV4LCAxICk7XHJcbn07XHJcblxyXG4vKipcclxuICogQXNzaWduIHRoZSBOb2RlJ3Mgdm9pY2luZ1Zpc2libGVQcm9wZXJ0eSBhbmQgdmlzaWJsZVByb3BlcnR5IHRvIHRoZSBVdHRlcmFuY2Ugc28gdGhhdCB0aGUgVXR0ZXJhbmNlIGNhbiBvbmx5IGJlXHJcbiAqIGFubm91bmNlZCBpZiB0aGUgTm9kZSBpcyB2aXNpYmxlIGFuZCB2b2ljaW5nVmlzaWJsZS4gVGhpcyBpcyBMT0NBTCB2aXNpYmlsaXR5IGFuZCBkb2VzIG5vdCBjYXJlIGFib3V0IGFuY2VzdG9ycy5cclxuICogVGhpcyBzaG91bGQgcmFyZWx5IGJlIHVzZWQsIGluIGdlbmVyYWwgeW91IHNob3VsZCBiZSByZWdpc3RlcmluZyBhbiBVdHRlcmFuY2UgdG8gYSBWb2ljaW5nTm9kZSBhbmQgaXRzXHJcbiAqIHZvaWNpbmdDYW5TcGVha1Byb3BlcnR5LlxyXG4gKiBAc3RhdGljXHJcbiAqL1xyXG5Wb2ljaW5nLnJlZ2lzdGVyVXR0ZXJhbmNlVG9Ob2RlID0gKCB1dHRlcmFuY2U6IFV0dGVyYW5jZSwgbm9kZTogTm9kZSApID0+IHtcclxuICBjb25zdCBleGlzdGluZ0NhbkFubm91bmNlUHJvcGVydGllcyA9IHV0dGVyYW5jZS52b2ljaW5nQ2FuQW5ub3VuY2VQcm9wZXJ0aWVzO1xyXG4gIGlmICggIWV4aXN0aW5nQ2FuQW5ub3VuY2VQcm9wZXJ0aWVzLmluY2x1ZGVzKCBub2RlLnZpc2libGVQcm9wZXJ0eSApICkge1xyXG4gICAgdXR0ZXJhbmNlLnZvaWNpbmdDYW5Bbm5vdW5jZVByb3BlcnRpZXMgPSB1dHRlcmFuY2Uudm9pY2luZ0NhbkFubm91bmNlUHJvcGVydGllcy5jb25jYXQoIFsgbm9kZS52aXNpYmxlUHJvcGVydHkgXSApO1xyXG4gIH1cclxuICBpZiAoICFleGlzdGluZ0NhbkFubm91bmNlUHJvcGVydGllcy5pbmNsdWRlcyggbm9kZS52b2ljaW5nVmlzaWJsZVByb3BlcnR5ICkgKSB7XHJcbiAgICB1dHRlcmFuY2Uudm9pY2luZ0NhbkFubm91bmNlUHJvcGVydGllcyA9IHV0dGVyYW5jZS52b2ljaW5nQ2FuQW5ub3VuY2VQcm9wZXJ0aWVzLmNvbmNhdCggWyBub2RlLnZvaWNpbmdWaXNpYmxlUHJvcGVydHkgXSApO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmUgYSBOb2RlJ3Mgdm9pY2luZ1Zpc2libGVQcm9wZXJ0eSBhbmQgdmlzaWJsZVByb3BlcnR5IGZyb20gdGhlIHZvaWNpbmdDYW5Bbm5vdW5jZVByb3BlcnRpZXMgb2YgdGhlIFV0dGVyYW5jZS5cclxuICogQHN0YXRpY1xyXG4gKi9cclxuVm9pY2luZy51bnJlZ2lzdGVyVXR0ZXJhbmNlVG9Ob2RlID0gKCB1dHRlcmFuY2U6IFV0dGVyYW5jZSwgbm9kZTogTm9kZSApID0+IHtcclxuICBjb25zdCBleGlzdGluZ0NhbkFubm91bmNlUHJvcGVydGllcyA9IHV0dGVyYW5jZS52b2ljaW5nQ2FuQW5ub3VuY2VQcm9wZXJ0aWVzO1xyXG4gIGFzc2VydCAmJiBhc3NlcnQoIGV4aXN0aW5nQ2FuQW5ub3VuY2VQcm9wZXJ0aWVzLmluY2x1ZGVzKCBub2RlLnZpc2libGVQcm9wZXJ0eSApICYmIGV4aXN0aW5nQ2FuQW5ub3VuY2VQcm9wZXJ0aWVzLmluY2x1ZGVzKCBub2RlLnZvaWNpbmdWaXNpYmxlUHJvcGVydHkgKSxcclxuICAgICd2aXNpYmxlUHJvcGVydHkgYW5kIHZvaWNpbmdWaXNpYmxlUHJvcGVydHkgd2VyZSBub3Qgb24gdGhlIFV0dGVyYW5jZSwgd2FzIGl0IG5vdCByZWdpc3RlcmVkIHRvIHRoZSBub2RlPycgKTtcclxuXHJcbiAgY29uc3QgdmlzaWJsZVByb3BlcnR5SW5kZXggPSBleGlzdGluZ0NhbkFubm91bmNlUHJvcGVydGllcy5pbmRleE9mKCBub2RlLnZpc2libGVQcm9wZXJ0eSApO1xyXG4gIGNvbnN0IHdpdGhvdXRWaXNpYmxlUHJvcGVydHkgPSBleGlzdGluZ0NhbkFubm91bmNlUHJvcGVydGllcy5zcGxpY2UoIHZpc2libGVQcm9wZXJ0eUluZGV4LCAxICk7XHJcblxyXG4gIGNvbnN0IHZvaWNpbmdWaXNpYmxlUHJvcGVydHlJbmRleCA9IHdpdGhvdXRWaXNpYmxlUHJvcGVydHkuaW5kZXhPZiggbm9kZS52b2ljaW5nVmlzaWJsZVByb3BlcnR5ICk7XHJcbiAgY29uc3Qgd2l0aG91dEJvdGhQcm9wZXJ0aWVzID0gZXhpc3RpbmdDYW5Bbm5vdW5jZVByb3BlcnRpZXMuc3BsaWNlKCB2b2ljaW5nVmlzaWJsZVByb3BlcnR5SW5kZXgsIDEgKTtcclxuXHJcbiAgdXR0ZXJhbmNlLnZvaWNpbmdDYW5Bbm5vdW5jZVByb3BlcnRpZXMgPSB3aXRob3V0Qm90aFByb3BlcnRpZXM7XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBWb2ljaW5nTm9kZSA9IE5vZGUgJiBUVm9pY2luZztcclxuXHJcbnNjZW5lcnkucmVnaXN0ZXIoICdWb2ljaW5nJywgVm9pY2luZyApO1xyXG5leHBvcnQgZGVmYXVsdCBWb2ljaW5nOyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxPQUFPQSxXQUFXLE1BQU0seUNBQXlDO0FBQ2pFLE9BQU9DLGNBQWMsTUFBdUUsa0RBQWtEO0FBRTlJLE9BQU9DLFNBQVMsTUFBd0MsNkNBQTZDO0FBQ3JHLFNBQVNDLGFBQWEsRUFBWUMsdUJBQXVCLEVBQWtDQyxJQUFJLEVBQUVDLE9BQU8sRUFBMkJDLHFCQUFxQixRQUFRLGtCQUFrQjtBQUNsTCxTQUFTQyxjQUFjLFFBQVEsdUNBQXVDO0FBR3RFLE9BQU9DLGlCQUFpQixNQUFNLHFEQUFxRDtBQUNuRixPQUFPQyxZQUFZLE1BQU0scUNBQXFDO0FBQzlELE9BQU9DLE1BQU0sTUFBTSxpQ0FBaUM7QUFHcEQ7QUFDQSxTQUFTQyxlQUFlQSxDQUFFQyxTQUEyQixFQUFtQztFQUN0RixJQUFLLEVBQUdBLFNBQVMsWUFBWVgsU0FBUyxDQUFFLEVBQUc7SUFDekMsTUFBTSxJQUFJWSxLQUFLLENBQUUsK0JBQWdDLENBQUM7RUFDcEQ7QUFDRjs7QUFFQTtBQUNBO0FBQ0EsTUFBTUMscUJBQXFCLFNBQVNiLFNBQVMsQ0FBQztFQUNyQ2MsV0FBV0EsQ0FBRUMsZUFBa0MsRUFBRztJQUN2RCxLQUFLLENBQUVBLGVBQWdCLENBQUM7RUFDMUI7QUFDRjs7QUFFQTtBQUNBLE1BQU1DLG1CQUFtQixHQUFHLENBQzFCLHFCQUFxQixFQUNyQix1QkFBdUIsRUFDdkIsd0JBQXdCLEVBQ3hCLHFCQUFxQixFQUNyQixrQkFBa0IsRUFDbEIsa0NBQWtDLEVBQ2xDLHVDQUF1QyxFQUN2QyxzQkFBc0IsQ0FDdkI7O0FBcUNEO0FBQ0E7O0FBdUZBLE1BQU1DLE9BQU8sR0FBMENDLElBQWUsSUFBeUM7RUFFN0dDLE1BQU0sSUFBSUEsTUFBTSxDQUFFQyxDQUFDLENBQUNDLFFBQVEsQ0FBRXZCLFdBQVcsQ0FBRW9CLElBQUssQ0FBQyxFQUFFZixJQUFLLENBQUMsRUFBRSwyQ0FBNEMsQ0FBQztFQUV4RyxNQUFNbUIsWUFBWSxHQUFHckIsYUFBYSxDQUFFLFNBQVMsRUFBRWUsbUJBQW1CLEVBQ2hFLE1BQU1NLFlBQVksU0FBU3BCLHVCQUF1QixDQUFFZ0IsSUFBSyxDQUFDLENBQXFCO0lBRTdFOztJQUdBO0lBQ0E7O0lBR0E7O0lBR0E7SUFDQTtJQUNBO0lBQ0E7O0lBR0E7SUFDQTtJQUNBOztJQUdBOztJQUdBO0lBQ0E7O0lBR0E7SUFDQTtJQUNBOztJQUdPSixXQUFXQSxDQUFFLEdBQUdTLElBQXNCLEVBQUc7TUFDOUMsS0FBSyxDQUFFLEdBQUdBLElBQUssQ0FBQzs7TUFFaEI7TUFDQTtNQUNBO01BQ0EsSUFBSSxDQUFDQyxvQ0FBb0MsR0FBRyxJQUFJLENBQUNDLHdCQUF3QixDQUFDQyxJQUFJLENBQUUsSUFBSyxDQUFDO01BRXRGLElBQUksQ0FBQ0MsaUJBQWlCLEdBQUcsSUFBSTs7TUFFN0I7TUFDQUwsWUFBWSxDQUFDTSxTQUFTLENBQUNDLFVBQVUsQ0FBQ0MsSUFBSSxDQUFFLElBQUssQ0FBQztJQUNoRDs7SUFFQTtJQUNBO0lBQ0E7SUFDT0QsVUFBVUEsQ0FBRSxHQUFHTixJQUFzQixFQUFTO01BRW5EO01BQ0EsS0FBSyxDQUFDTSxVQUFVLElBQUksS0FBSyxDQUFDQSxVQUFVLENBQUVOLElBQUssQ0FBQztNQUU1QyxJQUFJLENBQUNRLHdCQUF3QixHQUFHLElBQUl2QixZQUFZLENBQVcsSUFBSyxDQUFDO01BQ2pFLElBQUksQ0FBQ3dCLHNCQUFzQixHQUFHLElBQUlqQyxjQUFjLENBQUMsQ0FBQztNQUNsRCxJQUFJLENBQUNrQyxxQkFBcUIsR0FBRyxJQUFJLENBQUNDLG9CQUFvQjs7TUFFdEQ7TUFDQSxJQUFJLENBQUNDLG1CQUFtQixDQUFFLElBQUl0QixxQkFBcUIsQ0FBQyxDQUFFLENBQUM7TUFFdkQsSUFBSSxDQUFDdUIscUJBQXFCLEdBQUcsQ0FBQztNQUU5QixJQUFJLENBQUNDLDhCQUE4QixHQUFHLElBQUksQ0FBQ0MsNEJBQTRCLENBQUNaLElBQUksQ0FBRSxJQUFLLENBQUM7O01BRXBGO01BQ0E7TUFDQSxJQUFJLENBQUNhLHNCQUFzQixDQUFDQyxXQUFXLENBQUUsSUFBSSxDQUFDSCw4QkFBK0IsQ0FBQztNQUU5RSxJQUFJLENBQUNJLDRCQUE0QixHQUFHO1FBQ2xDQyxLQUFLLEVBQUVDLEtBQUssSUFBSTtVQUNkLElBQUksQ0FBQ1YscUJBQXFCLElBQUksSUFBSSxDQUFDQSxxQkFBcUIsQ0FBRVUsS0FBTSxDQUFDO1FBQ25FO01BQ0YsQ0FBQztNQUNELElBQUksQ0FBQ0MsZ0JBQWdCLENBQUUsSUFBSSxDQUFDSCw0QkFBNkIsQ0FBQztNQUUxRCxPQUFPLElBQUk7SUFDYjs7SUFFQTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0lBQ2FJLHdCQUF3QkEsQ0FBRTlCLGVBQWlDLEVBQVM7TUFFekU7TUFDQSxNQUFNK0IsT0FBTyxHQUFHeEMsY0FBYyxDQUFtQixDQUFDLENBQUMsRUFBRVMsZUFBZ0IsQ0FBQzs7TUFFdEU7TUFDQSxJQUFLLENBQUMrQixPQUFPLENBQUNDLGNBQWMsQ0FBRSxjQUFlLENBQUMsRUFBRztRQUMvQ0QsT0FBTyxDQUFDRSxZQUFZLEdBQUcsSUFBSSxDQUFDaEIsc0JBQXNCLENBQUNnQixZQUFZO01BQ2pFO01BQ0EsSUFBSyxDQUFDRixPQUFPLENBQUNDLGNBQWMsQ0FBRSxnQkFBaUIsQ0FBQyxFQUFHO1FBQ2pERCxPQUFPLENBQUNHLGNBQWMsR0FBRyxJQUFJLENBQUNqQixzQkFBc0IsQ0FBQ2lCLGNBQWM7TUFDckU7TUFDQSxJQUFLLENBQUNILE9BQU8sQ0FBQ0MsY0FBYyxDQUFFLGlCQUFrQixDQUFDLEVBQUc7UUFDbERELE9BQU8sQ0FBQ0ksZUFBZSxHQUFHLElBQUksQ0FBQ2xCLHNCQUFzQixDQUFDa0IsZUFBZTtNQUN2RTtNQUNBLElBQUssQ0FBQ0osT0FBTyxDQUFDQyxjQUFjLENBQUUsY0FBZSxDQUFDLEVBQUc7UUFDL0NELE9BQU8sQ0FBQ0ssWUFBWSxHQUFHLElBQUksQ0FBQ25CLHNCQUFzQixDQUFDbUIsWUFBWTtNQUNqRTtNQUVBLElBQUksQ0FBQ0MsdUJBQXVCLENBQUVOLE9BQVEsQ0FBQztJQUN6Qzs7SUFFQTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7SUFDYU8sb0JBQW9CQSxDQUFFdEMsZUFBaUMsRUFBUztNQUVyRTtNQUNBLE1BQU0rQixPQUFPLEdBQUd4QyxjQUFjLENBQW1CO1FBQy9DMEMsWUFBWSxFQUFFLElBQUk7UUFDbEJDLGNBQWMsRUFBRSxJQUFJO1FBQ3BCQyxlQUFlLEVBQUUsSUFBSTtRQUNyQkMsWUFBWSxFQUFFO01BQ2hCLENBQUMsRUFBRXBDLGVBQWdCLENBQUM7TUFFcEIsSUFBSSxDQUFDcUMsdUJBQXVCLENBQUVOLE9BQVEsQ0FBQztJQUN6Qzs7SUFFQTtBQUNOO0FBQ0E7QUFDQTtJQUNhUSx3QkFBd0JBLENBQUV2QyxlQUFpQyxFQUFTO01BRXpFO01BQ0EsTUFBTStCLE9BQU8sR0FBR3hDLGNBQWMsQ0FBbUIsQ0FBQyxDQUFDLEVBQUVTLGVBQWdCLENBQUM7O01BRXRFO01BQ0EsSUFBSyxDQUFDK0IsT0FBTyxDQUFDQyxjQUFjLENBQUUsY0FBZSxDQUFDLEVBQUc7UUFDL0NELE9BQU8sQ0FBQ0UsWUFBWSxHQUFHLElBQUksQ0FBQ2hCLHNCQUFzQixDQUFDZ0IsWUFBWTtNQUNqRTtNQUVBLElBQUksQ0FBQ0ksdUJBQXVCLENBQUVOLE9BQVEsQ0FBQztJQUN6Qzs7SUFFQTtBQUNOO0FBQ0E7QUFDQTtJQUNhUywwQkFBMEJBLENBQUV4QyxlQUFpQyxFQUFTO01BRTNFO01BQ0EsTUFBTStCLE9BQU8sR0FBR3hDLGNBQWMsQ0FBbUIsQ0FBQyxDQUFDLEVBQUVTLGVBQWdCLENBQUM7O01BRXRFO01BQ0EsSUFBSyxDQUFDK0IsT0FBTyxDQUFDQyxjQUFjLENBQUUsZ0JBQWlCLENBQUMsRUFBRztRQUNqREQsT0FBTyxDQUFDRyxjQUFjLEdBQUcsSUFBSSxDQUFDakIsc0JBQXNCLENBQUNpQixjQUFjO01BQ3JFO01BRUEsSUFBSSxDQUFDRyx1QkFBdUIsQ0FBRU4sT0FBUSxDQUFDO0lBQ3pDOztJQUVBO0FBQ047QUFDQTtBQUNBO0FBQ0E7SUFDYVUsMkJBQTJCQSxDQUFFekMsZUFBaUMsRUFBUztNQUU1RTtNQUNBLE1BQU0rQixPQUFPLEdBQUd4QyxjQUFjLENBQW1CLENBQUMsQ0FBQyxFQUFFUyxlQUFnQixDQUFDOztNQUV0RTtNQUNBLElBQUssQ0FBQytCLE9BQU8sQ0FBQ0MsY0FBYyxDQUFFLGlCQUFrQixDQUFDLEVBQUc7UUFDbERELE9BQU8sQ0FBQ0ksZUFBZSxHQUFHLElBQUksQ0FBQ2xCLHNCQUFzQixDQUFDa0IsZUFBZTtNQUN2RTtNQUVBLElBQUksQ0FBQ0UsdUJBQXVCLENBQUVOLE9BQVEsQ0FBQztJQUN6Qzs7SUFFQTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0lBQ2FXLHdCQUF3QkEsQ0FBRTFDLGVBQWlDLEVBQVM7TUFFekU7TUFDQSxNQUFNK0IsT0FBTyxHQUFHeEMsY0FBYyxDQUFtQixDQUFDLENBQUMsRUFBRVMsZUFBZ0IsQ0FBQzs7TUFFdEU7TUFDQSxJQUFLLENBQUMrQixPQUFPLENBQUNDLGNBQWMsQ0FBRSxjQUFlLENBQUMsRUFBRztRQUMvQ0QsT0FBTyxDQUFDSyxZQUFZLEdBQUcsSUFBSSxDQUFDbkIsc0JBQXNCLENBQUNtQixZQUFZO01BQ2pFO01BRUEsSUFBSSxDQUFDQyx1QkFBdUIsQ0FBRU4sT0FBUSxDQUFDO0lBQ3pDOztJQUVBO0FBQ047QUFDQTtJQUNjTSx1QkFBdUJBLENBQUVyQyxlQUFpQyxFQUFTO01BQ3pFLElBQUksQ0FBQzJDLFlBQVksQ0FBRSxJQUFJLENBQUNDLGVBQWUsQ0FBRTVDLGVBQWdCLENBQUUsQ0FBQztJQUM5RDs7SUFFQTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0lBQ2E0QyxlQUFlQSxDQUFFNUMsZUFBaUMsRUFBZTtNQUN0RSxNQUFNK0IsT0FBTyxHQUFHeEMsY0FBYyxDQUFtQjtRQUMvQ3NELGdCQUFnQixFQUFFLElBQUksQ0FBQzVCLHNCQUFzQixDQUFDNEIsZ0JBQWdCO1FBQzlEQyx5QkFBeUIsRUFBRSxJQUFJLENBQUM3QixzQkFBc0IsQ0FBQzZCLHlCQUF5QjtRQUNoRmxELFNBQVMsRUFBRSxJQUFJLENBQUNtRDtNQUNsQixDQUFDLEVBQUUvQyxlQUFnQixDQUFDO01BRXBCLElBQUlnRCxRQUFvQixHQUFHeEQsaUJBQWlCLENBQUN5RCxnQkFBZ0IsQ0FBRWxCLE9BQVEsQ0FBQztNQUV4RSxJQUFLQSxPQUFPLENBQUNuQyxTQUFTLEVBQUc7UUFDdkJtQyxPQUFPLENBQUNuQyxTQUFTLENBQUNzRCxLQUFLLEdBQUdGLFFBQVE7UUFDbENBLFFBQVEsR0FBR2pCLE9BQU8sQ0FBQ25DLFNBQVM7TUFDOUI7TUFDQSxPQUFPb0QsUUFBUTtJQUNqQjs7SUFFQTtBQUNOO0FBQ0E7QUFDQTtJQUNhTCxZQUFZQSxDQUFFUSxPQUFtQixFQUFTO01BRS9DLE1BQU1DLGtCQUFrQixHQUFHLENBQUMxRCxNQUFNLENBQUMyRCxlQUFlLElBQUksQ0FBQyxJQUFJLENBQUNDLHVCQUF1QixDQUFDLENBQUM7O01BRXJGO01BQ0E7TUFDQSxJQUFLSCxPQUFPLElBQUlDLGtCQUFrQixFQUFHO1FBQ25DOUQscUJBQXFCLENBQUNpRSxTQUFTLENBQUVKLE9BQVEsQ0FBQyxDQUFDLENBQUM7TUFDOUM7SUFDRjs7SUFFQTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0lBQ2FLLHNCQUFzQkEsQ0FBRVIsUUFBeUIsRUFBUztNQUMvRCxJQUFJLENBQUMvQixzQkFBc0IsQ0FBQ2dCLFlBQVksR0FBR2UsUUFBUTtJQUNyRDtJQUVBLElBQVdTLG1CQUFtQkEsQ0FBRVQsUUFBeUIsRUFBRztNQUFFLElBQUksQ0FBQ1Esc0JBQXNCLENBQUVSLFFBQVMsQ0FBQztJQUFFO0lBRXZHLElBQVdTLG1CQUFtQkEsQ0FBQSxFQUFxQjtNQUFFLE9BQU8sSUFBSSxDQUFDQyxzQkFBc0IsQ0FBQyxDQUFDO0lBQUU7O0lBRTNGO0FBQ047QUFDQTtJQUNhQSxzQkFBc0JBLENBQUEsRUFBcUI7TUFDaEQsT0FBTyxJQUFJLENBQUN6QyxzQkFBc0IsQ0FBQ2dCLFlBQVk7SUFDakQ7O0lBRUE7QUFDTjtBQUNBO0FBQ0E7QUFDQTtJQUNhMEIsd0JBQXdCQSxDQUFFWCxRQUF5QixFQUFTO01BQ2pFLElBQUksQ0FBQy9CLHNCQUFzQixDQUFDaUIsY0FBYyxHQUFHYyxRQUFRO0lBQ3ZEO0lBRUEsSUFBV1kscUJBQXFCQSxDQUFFWixRQUF5QixFQUFHO01BQUUsSUFBSSxDQUFDVyx3QkFBd0IsQ0FBRVgsUUFBUyxDQUFDO0lBQUU7SUFFM0csSUFBV1kscUJBQXFCQSxDQUFBLEVBQXFCO01BQUUsT0FBTyxJQUFJLENBQUNDLHdCQUF3QixDQUFDLENBQUM7SUFBRTs7SUFFL0Y7QUFDTjtBQUNBO0lBQ2FBLHdCQUF3QkEsQ0FBQSxFQUFxQjtNQUNsRCxPQUFPLElBQUksQ0FBQzVDLHNCQUFzQixDQUFDaUIsY0FBYztJQUNuRDs7SUFFQTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0lBQ2E0Qix5QkFBeUJBLENBQUVkLFFBQXlCLEVBQVM7TUFDbEUsSUFBSSxDQUFDL0Isc0JBQXNCLENBQUNrQixlQUFlLEdBQUdhLFFBQVE7SUFDeEQ7SUFFQSxJQUFXZSxzQkFBc0JBLENBQUVmLFFBQXlCLEVBQUc7TUFBRSxJQUFJLENBQUNjLHlCQUF5QixDQUFFZCxRQUFTLENBQUM7SUFBRTtJQUU3RyxJQUFXZSxzQkFBc0JBLENBQUEsRUFBcUI7TUFBRSxPQUFPLElBQUksQ0FBQ0MseUJBQXlCLENBQUMsQ0FBQztJQUFFOztJQUVqRztBQUNOO0FBQ0E7SUFDYUEseUJBQXlCQSxDQUFBLEVBQXFCO01BQ25ELE9BQU8sSUFBSSxDQUFDL0Msc0JBQXNCLENBQUNrQixlQUFlO0lBQ3BEOztJQUVBO0FBQ047QUFDQTtBQUNBO0FBQ0E7SUFDYThCLHNCQUFzQkEsQ0FBRWpCLFFBQXlCLEVBQVM7TUFDL0QsSUFBSSxDQUFDL0Isc0JBQXNCLENBQUNtQixZQUFZLEdBQUdZLFFBQVE7SUFDckQ7SUFFQSxJQUFXa0IsbUJBQW1CQSxDQUFFbEIsUUFBeUIsRUFBRztNQUFFLElBQUksQ0FBQ2lCLHNCQUFzQixDQUFFakIsUUFBUyxDQUFDO0lBQUU7SUFFdkcsSUFBV2tCLG1CQUFtQkEsQ0FBQSxFQUFxQjtNQUFFLE9BQU8sSUFBSSxDQUFDQyxzQkFBc0IsQ0FBQyxDQUFDO0lBQUU7O0lBRTNGO0FBQ047QUFDQTtJQUNhQSxzQkFBc0JBLENBQUEsRUFBcUI7TUFDaEQsT0FBTyxJQUFJLENBQUNsRCxzQkFBc0IsQ0FBQ21CLFlBQVk7SUFDakQ7O0lBRUE7QUFDTjtBQUNBO0FBQ0E7QUFDQTtJQUNhZ0Msd0NBQXdDQSxDQUFFdkIsZ0JBQXlCLEVBQVM7TUFDakYsSUFBSSxDQUFDNUIsc0JBQXNCLENBQUM0QixnQkFBZ0IsR0FBR0EsZ0JBQWdCO0lBQ2pFO0lBRUEsSUFBV3dCLHFDQUFxQ0EsQ0FBRXhCLGdCQUF5QixFQUFHO01BQUUsSUFBSSxDQUFDdUIsd0NBQXdDLENBQUV2QixnQkFBaUIsQ0FBQztJQUFFO0lBRW5KLElBQVd3QixxQ0FBcUNBLENBQUEsRUFBWTtNQUFFLE9BQU8sSUFBSSxDQUFDQyx3Q0FBd0MsQ0FBQyxDQUFDO0lBQUU7O0lBRXRIO0FBQ047QUFDQTtJQUNhQSx3Q0FBd0NBLENBQUEsRUFBWTtNQUN6RCxPQUFPLElBQUksQ0FBQ3JELHNCQUFzQixDQUFDNEIsZ0JBQWdCO0lBQ3JEOztJQUVBO0FBQ047QUFDQTtBQUNBO0FBQ0E7SUFDYTBCLG1DQUFtQ0EsQ0FBRUMsUUFBbUMsRUFBUztNQUV0RixJQUFJLENBQUN2RCxzQkFBc0IsQ0FBQzZCLHlCQUF5QixHQUFHMEIsUUFBUTtJQUNsRTtJQUVBLElBQVdDLGdDQUFnQ0EsQ0FBRUQsUUFBbUMsRUFBRztNQUFFLElBQUksQ0FBQ0QsbUNBQW1DLENBQUVDLFFBQVMsQ0FBQztJQUFFO0lBRTNJLElBQVdDLGdDQUFnQ0EsQ0FBQSxFQUE4QjtNQUFFLE9BQU8sSUFBSSxDQUFDQyxtQ0FBbUMsQ0FBQyxDQUFDO0lBQUU7O0lBRTlIO0FBQ047QUFDQTtJQUNhQSxtQ0FBbUNBLENBQUEsRUFBOEI7TUFDdEUsT0FBTyxJQUFJLENBQUN6RCxzQkFBc0IsQ0FBQzZCLHlCQUF5QjtJQUM5RDs7SUFFQTtBQUNOO0FBQ0E7QUFDQTtJQUNhMUIsbUJBQW1CQSxDQUFFeEIsU0FBb0IsRUFBUztNQUN2RCxJQUFLLElBQUksQ0FBQ2dCLGlCQUFpQixLQUFLaEIsU0FBUyxFQUFHO1FBRTFDLElBQUssSUFBSSxDQUFDZ0IsaUJBQWlCLEVBQUc7VUFDNUIsSUFBSSxDQUFDK0QscUJBQXFCLENBQUMsQ0FBQztRQUM5QjtRQUVBekUsT0FBTyxDQUFDMEUsOEJBQThCLENBQUVoRixTQUFTLEVBQUUsSUFBSyxDQUFDO1FBQ3pELElBQUksQ0FBQ2dCLGlCQUFpQixHQUFHaEIsU0FBUztNQUNwQztJQUNGO0lBRUEsSUFBV21ELGdCQUFnQkEsQ0FBRW5ELFNBQW9CLEVBQUc7TUFBRSxJQUFJLENBQUN3QixtQkFBbUIsQ0FBRXhCLFNBQVUsQ0FBQztJQUFFO0lBRTdGLElBQVdtRCxnQkFBZ0JBLENBQUEsRUFBYztNQUFFLE9BQU8sSUFBSSxDQUFDOEIsbUJBQW1CLENBQUMsQ0FBQztJQUFFOztJQUU5RTtBQUNOO0FBQ0E7SUFDYUEsbUJBQW1CQSxDQUFBLEVBQWM7TUFDdENsRixlQUFlLENBQUUsSUFBSSxDQUFDaUIsaUJBQWtCLENBQUM7TUFDekMsT0FBTyxJQUFJLENBQUNBLGlCQUFpQjtJQUMvQjs7SUFFQTtBQUNOO0FBQ0E7SUFDYWtFLHVCQUF1QkEsQ0FBRUMsYUFBeUQsRUFBUztNQUNoRyxJQUFJLENBQUM3RCxxQkFBcUIsR0FBRzZELGFBQWE7SUFDNUM7SUFFQSxJQUFXQyxvQkFBb0JBLENBQUVELGFBQXlELEVBQUc7TUFBRSxJQUFJLENBQUNELHVCQUF1QixDQUFFQyxhQUFjLENBQUM7SUFBRTtJQUU5SSxJQUFXQyxvQkFBb0JBLENBQUEsRUFBK0M7TUFBRSxPQUFPLElBQUksQ0FBQ0MsdUJBQXVCLENBQUMsQ0FBQztJQUFFOztJQUV2SDtBQUNOO0FBQ0E7SUFDYUEsdUJBQXVCQSxDQUFBLEVBQStDO01BQzNFLE9BQU8sSUFBSSxDQUFDL0QscUJBQXFCO0lBQ25DOztJQUVBO0FBQ047QUFDQTtJQUNhQyxvQkFBb0JBLENBQUEsRUFBUztNQUNsQyxJQUFJLENBQUNXLHdCQUF3QixDQUFFO1FBQzdCSyxlQUFlLEVBQUU7TUFDbkIsQ0FBRSxDQUFDO0lBQ0w7O0lBRUE7QUFDTjtBQUNBO0lBQ00sSUFBVytDLFNBQVNBLENBQUEsRUFBWTtNQUM5QixPQUFPLElBQUk7SUFDYjs7SUFFQTtBQUNOO0FBQ0E7SUFDc0JDLE9BQU9BLENBQUEsRUFBUztNQUM5QixJQUFJLENBQUNDLG1CQUFtQixDQUFFLElBQUksQ0FBQzFELDRCQUE2QixDQUFDO01BQzdELElBQUksQ0FBQ0Ysc0JBQXNCLENBQUM2RCxjQUFjLENBQUUsSUFBSSxDQUFDL0QsOEJBQStCLENBQUM7TUFFakYsSUFBSyxJQUFJLENBQUNWLGlCQUFpQixFQUFHO1FBQzVCLElBQUksQ0FBQytELHFCQUFxQixDQUFDLENBQUM7UUFDNUIsSUFBSSxDQUFDL0QsaUJBQWlCLEdBQUcsSUFBSTtNQUMvQjtNQUVBLEtBQUssQ0FBQ3VFLE9BQU8sQ0FBQyxDQUFDO0lBQ2pCO0lBRU9HLEtBQUtBLENBQUEsRUFBUztNQUNuQixJQUFJLENBQUNGLG1CQUFtQixDQUFFLElBQUksQ0FBQzFELDRCQUE2QixDQUFDO01BQzdELElBQUksQ0FBQ0Ysc0JBQXNCLENBQUM2RCxjQUFjLENBQUUsSUFBSSxDQUFDL0QsOEJBQStCLENBQUM7TUFFakYsSUFBSyxJQUFJLENBQUNWLGlCQUFpQixFQUFHO1FBQzVCLElBQUksQ0FBQytELHFCQUFxQixDQUFDLENBQUM7UUFDNUIsSUFBSSxDQUFDL0QsaUJBQWlCLEdBQUcsSUFBSTtNQUMvQjs7TUFFQTtNQUNBLEtBQUssQ0FBQzBFLEtBQUssSUFBSSxLQUFLLENBQUNBLEtBQUssQ0FBQyxDQUFDO0lBQzlCOztJQUVBO0lBQ0E7SUFDQTs7SUFFQTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0lBQ2M1RSx3QkFBd0JBLENBQUU2RSxRQUFpQixFQUFTO01BRTFELElBQUtBLFFBQVEsRUFBRztRQUNkLElBQUksQ0FBQ2xFLHFCQUFxQixFQUFFO01BQzlCLENBQUMsTUFDSTtRQUNILElBQUksQ0FBQ0EscUJBQXFCLEVBQUU7TUFDOUI7TUFFQWpCLE1BQU0sSUFBSUEsTUFBTSxDQUFFLElBQUksQ0FBQ2lCLHFCQUFxQixJQUFJLENBQUMsRUFBRSxtREFBb0QsQ0FBQztNQUN4R2pCLE1BQU0sSUFBSUEsTUFBTSxDQUFFLElBQUksQ0FBQ2lCLHFCQUFxQixJQUFJLElBQUksQ0FBQ21FLFNBQVMsQ0FBQ0MsTUFBTSxFQUNuRSwwRUFBMkUsQ0FBQztNQUU5RSxJQUFJLENBQUN6RSx3QkFBd0IsQ0FBQzBFLEtBQUssR0FBRyxJQUFJLENBQUNyRSxxQkFBcUIsR0FBRyxDQUFDO0lBQ3RFOztJQUVBO0FBQ047QUFDQTtBQUNBO0lBQ2NzRSxzQkFBc0JBLENBQUVDLFFBQWtCLEVBQUVDLEtBQWMsRUFBUztNQUN6RSxNQUFNQyxTQUFTLEdBQUdGLFFBQVEsQ0FBQ0csT0FBTyxJQUFJSCxRQUFRLENBQUNJLGNBQWM7TUFDN0QsSUFBS0YsU0FBUyxFQUFHO1FBRWY7UUFDQTtRQUNBO1FBQ0EsSUFBSSxDQUFDekUscUJBQXFCLEdBQUd3RSxLQUFLLEdBQUcsSUFBSSxDQUFDeEUscUJBQXFCLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQ0EscUJBQXFCLEdBQUcsQ0FBQztNQUN0RztNQUVBLElBQUksQ0FBQ0wsd0JBQXdCLENBQUMwRSxLQUFLLEdBQUcsSUFBSSxDQUFDckUscUJBQXFCLEdBQUcsQ0FBQztJQUN0RTs7SUFFQTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0lBQ2NFLDRCQUE0QkEsQ0FBRXFFLFFBQWtCLEVBQUVDLEtBQWMsRUFBUztNQUMvRXpGLE1BQU0sSUFBSUEsTUFBTSxDQUFFd0YsUUFBUSxDQUFDSyxlQUFlLEVBQUUsK0JBQWdDLENBQUM7TUFFN0UsSUFBS0osS0FBSyxFQUFHO1FBQ1g7UUFDQUQsUUFBUSxDQUFDSyxlQUFlLENBQUV4RSxXQUFXLENBQUUsSUFBSSxDQUFDaEIsb0NBQXFDLENBQUM7TUFDcEYsQ0FBQyxNQUNJO1FBQ0g7UUFDQW1GLFFBQVEsQ0FBQ0ssZUFBZSxDQUFFWixjQUFjLENBQUUsSUFBSSxDQUFDNUUsb0NBQXFDLENBQUM7TUFDdkY7O01BRUE7TUFDQSxJQUFJLENBQUNrRixzQkFBc0IsQ0FBRUMsUUFBUSxFQUFFQyxLQUFNLENBQUM7SUFDaEQ7O0lBRUE7QUFDTjtBQUNBO0FBQ0E7SUFDYWxCLHFCQUFxQkEsQ0FBQSxFQUFTO01BQ25DdkUsTUFBTSxJQUFJQSxNQUFNLENBQUUsSUFBSSxDQUFDUSxpQkFBaUIsRUFBRSxnREFBaUQsQ0FBQztNQUM1RixJQUFLLElBQUksQ0FBQ0EsaUJBQWlCLFlBQVlkLHFCQUFxQixFQUFHO1FBQzdELElBQUksQ0FBQ2MsaUJBQWlCLENBQUN1RSxPQUFPLENBQUMsQ0FBQztNQUNsQyxDQUFDLE1BQ0ksSUFBSyxJQUFJLENBQUN2RSxpQkFBaUIsSUFBSSxDQUFDLElBQUksQ0FBQ0EsaUJBQWlCLENBQUNzRixVQUFVLEVBQUc7UUFDdkVoRyxPQUFPLENBQUNpRyxnQ0FBZ0MsQ0FBRSxJQUFJLENBQUN2RixpQkFBaUIsRUFBRSxJQUFLLENBQUM7TUFDMUU7SUFDRjtJQUVnQndGLE1BQU1BLENBQUVyRSxPQUE0RSxFQUFTO01BQzNHLE9BQU8sS0FBSyxDQUFDcUUsTUFBTSxDQUFFckUsT0FBUSxDQUFDO0lBQ2hDO0VBQ0YsQ0FBRSxDQUFDOztFQUVMO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0V4QixZQUFZLENBQUNNLFNBQVMsQ0FBQ3dGLFlBQVksR0FBR3BHLG1CQUFtQixDQUFDcUcsTUFBTSxDQUFFL0YsWUFBWSxDQUFDTSxTQUFTLENBQUN3RixZQUFhLENBQUM7RUFFdkdqRyxNQUFNLElBQUlBLE1BQU0sQ0FBRUcsWUFBWSxDQUFDTSxTQUFTLENBQUN3RixZQUFZLENBQUNaLE1BQU0sS0FBS3BGLENBQUMsQ0FBQ2tHLElBQUksQ0FBRWhHLFlBQVksQ0FBQ00sU0FBUyxDQUFDd0YsWUFBYSxDQUFDLENBQUNaLE1BQU0sRUFBRSxtQ0FBb0MsQ0FBQztFQUU1SixPQUFPbEYsWUFBWTtBQUNyQixDQUFDO0FBRURMLE9BQU8sQ0FBQ0QsbUJBQW1CLEdBQUdBLG1CQUFtQjs7QUFFakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FDLE9BQU8sQ0FBQ3NHLGNBQWMsR0FBSzVHLFNBQW9CLElBQU07RUFDbkRRLE1BQU0sSUFBSUEsTUFBTSxDQUFFUixTQUFTLENBQUM2Ryw0QkFBNEIsQ0FBQ2hCLE1BQU0sR0FBRyxDQUFDLEVBQUUsMEdBQTJHLENBQUM7RUFDakxuRyxxQkFBcUIsQ0FBQ2lFLFNBQVMsQ0FBRTNELFNBQVUsQ0FBQyxDQUFDLENBQUM7QUFDaEQsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FNLE9BQU8sQ0FBQzBFLDhCQUE4QixHQUFHLENBQUVoRixTQUFvQixFQUFFOEcsV0FBcUIsS0FBTTtFQUMxRixNQUFNQyw2QkFBNkIsR0FBRy9HLFNBQVMsQ0FBQzZHLDRCQUE0QjtFQUU1RSxNQUFNRyx1QkFBdUIsR0FBR0YsV0FBVyxDQUFDMUYsd0JBQXdCO0VBQ3BFLElBQUssQ0FBQzJGLDZCQUE2QixDQUFDckcsUUFBUSxDQUFFc0csdUJBQXdCLENBQUMsRUFBRztJQUN4RWhILFNBQVMsQ0FBQzZHLDRCQUE0QixHQUFHRSw2QkFBNkIsQ0FBQ0wsTUFBTSxDQUFFLENBQUVNLHVCQUF1QixDQUFHLENBQUM7RUFDOUc7QUFDRixDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0ExRyxPQUFPLENBQUNpRyxnQ0FBZ0MsR0FBRyxDQUFFdkcsU0FBb0IsRUFBRThHLFdBQXdCLEtBQU07RUFDL0YsTUFBTUMsNkJBQTZCLEdBQUcvRyxTQUFTLENBQUM2Ryw0QkFBNEI7RUFFNUUsTUFBTUcsdUJBQXVCLEdBQUdGLFdBQVcsQ0FBQzFGLHdCQUF3QjtFQUNwRSxNQUFNNkYsS0FBSyxHQUFHRiw2QkFBNkIsQ0FBQ0csT0FBTyxDQUFFRix1QkFBd0IsQ0FBQztFQUM5RXhHLE1BQU0sSUFBSUEsTUFBTSxDQUFFeUcsS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFLHFGQUFzRixDQUFDO0VBQ3JIakgsU0FBUyxDQUFDNkcsNEJBQTRCLEdBQUdFLDZCQUE2QixDQUFDSSxNQUFNLENBQUVGLEtBQUssRUFBRSxDQUFFLENBQUM7QUFDM0YsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBM0csT0FBTyxDQUFDOEcsdUJBQXVCLEdBQUcsQ0FBRXBILFNBQW9CLEVBQUVxSCxJQUFVLEtBQU07RUFDeEUsTUFBTU4sNkJBQTZCLEdBQUcvRyxTQUFTLENBQUM2Ryw0QkFBNEI7RUFDNUUsSUFBSyxDQUFDRSw2QkFBNkIsQ0FBQ3JHLFFBQVEsQ0FBRTJHLElBQUksQ0FBQ0MsZUFBZ0IsQ0FBQyxFQUFHO0lBQ3JFdEgsU0FBUyxDQUFDNkcsNEJBQTRCLEdBQUc3RyxTQUFTLENBQUM2Ryw0QkFBNEIsQ0FBQ0gsTUFBTSxDQUFFLENBQUVXLElBQUksQ0FBQ0MsZUFBZSxDQUFHLENBQUM7RUFDcEg7RUFDQSxJQUFLLENBQUNQLDZCQUE2QixDQUFDckcsUUFBUSxDQUFFMkcsSUFBSSxDQUFDRSxzQkFBdUIsQ0FBQyxFQUFHO0lBQzVFdkgsU0FBUyxDQUFDNkcsNEJBQTRCLEdBQUc3RyxTQUFTLENBQUM2Ryw0QkFBNEIsQ0FBQ0gsTUFBTSxDQUFFLENBQUVXLElBQUksQ0FBQ0Usc0JBQXNCLENBQUcsQ0FBQztFQUMzSDtBQUNGLENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQWpILE9BQU8sQ0FBQ2tILHlCQUF5QixHQUFHLENBQUV4SCxTQUFvQixFQUFFcUgsSUFBVSxLQUFNO0VBQzFFLE1BQU1OLDZCQUE2QixHQUFHL0csU0FBUyxDQUFDNkcsNEJBQTRCO0VBQzVFckcsTUFBTSxJQUFJQSxNQUFNLENBQUV1Ryw2QkFBNkIsQ0FBQ3JHLFFBQVEsQ0FBRTJHLElBQUksQ0FBQ0MsZUFBZ0IsQ0FBQyxJQUFJUCw2QkFBNkIsQ0FBQ3JHLFFBQVEsQ0FBRTJHLElBQUksQ0FBQ0Usc0JBQXVCLENBQUMsRUFDdkosMEdBQTJHLENBQUM7RUFFOUcsTUFBTUUsb0JBQW9CLEdBQUdWLDZCQUE2QixDQUFDRyxPQUFPLENBQUVHLElBQUksQ0FBQ0MsZUFBZ0IsQ0FBQztFQUMxRixNQUFNSSxzQkFBc0IsR0FBR1gsNkJBQTZCLENBQUNJLE1BQU0sQ0FBRU0sb0JBQW9CLEVBQUUsQ0FBRSxDQUFDO0VBRTlGLE1BQU1FLDJCQUEyQixHQUFHRCxzQkFBc0IsQ0FBQ1IsT0FBTyxDQUFFRyxJQUFJLENBQUNFLHNCQUF1QixDQUFDO0VBQ2pHLE1BQU1LLHFCQUFxQixHQUFHYiw2QkFBNkIsQ0FBQ0ksTUFBTSxDQUFFUSwyQkFBMkIsRUFBRSxDQUFFLENBQUM7RUFFcEczSCxTQUFTLENBQUM2Ryw0QkFBNEIsR0FBR2UscUJBQXFCO0FBQ2hFLENBQUM7QUFJRG5JLE9BQU8sQ0FBQ29JLFFBQVEsQ0FBRSxTQUFTLEVBQUV2SCxPQUFRLENBQUM7QUFDdEMsZUFBZUEsT0FBTyIsImlnbm9yZUxpc3QiOltdfQ==