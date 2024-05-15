// Copyright 2022-2024, University of Colorado Boulder

/**
 * Uses the Web Speech API to produce speech from the browser. There is no speech output until the SpeechSynthesisAnnouncer has
 * been initialized. Supported voices will depend on platform. For each voice, you can customize the rate and pitch.
 *
 * Only one SpeechSynthesisAnnouncer can be used at a time. This class uses a global instance of window.speechSynthesis
 * and assumes it has full control over it. This is not a singleton because subclasses may extend this for specific
 * uses. For example, PhET has one subclass specific to its Voicing feature and another specific to
 * custom speech synthesis in number-suite-common sims.
 *
 * A note about PhET-iO instrumentation:
 * Properties are instrumented for PhET-iO to provide a record of learners that may have used this feature (and how). All
 * Properties should be phetioState:false so the values are not overwritten when a customized state is loaded.
 * Properties are not phetioReadonly so that clients can overwrite the values using the PhET-iO API and studio.
 *
 * @author Jesse Greenberg
 */

import BooleanProperty from '../../axon/js/BooleanProperty.js';
import DerivedProperty from '../../axon/js/DerivedProperty.js';
import Emitter from '../../axon/js/Emitter.js';
import EnabledComponent from '../../axon/js/EnabledComponent.js';
import NumberProperty from '../../axon/js/NumberProperty.js';
import Property from '../../axon/js/Property.js';
import Range from '../../dot/js/Range.js';
import optionize, { optionize3 } from '../../phet-core/js/optionize.js';
import stripEmbeddingMarks from '../../phet-core/js/stripEmbeddingMarks.js';
import Announcer from '../../utterance-queue/js/Announcer.js';
import Utterance from '../../utterance-queue/js/Utterance.js';
import SpeechSynthesisParentPolyfill from './SpeechSynthesisParentPolyfill.js';
import utteranceQueueNamespace from './utteranceQueueNamespace.js';
import stepTimer from '../../axon/js/stepTimer.js';
import platform from '../../phet-core/js/platform.js';
import Multilink from '../../axon/js/Multilink.js';
import IOType from '../../tandem/js/types/IOType.js';
import NullableIO from '../../tandem/js/types/NullableIO.js';
import validate from '../../axon/js/validate.js';
import Validation from '../../axon/js/Validation.js';
// If a polyfill for SpeechSynthesis is requested, try to initialize it here before SpeechSynthesis usages. For
// now this is a PhET specific feature, available by query parameter in initialize-globals. QueryStringMachine
// cannot be used for this, see https://github.com/phetsims/scenery/issues/1366
if (window.phet && phet.chipper && phet.chipper.queryParameters && phet.chipper.queryParameters.speechSynthesisFromParent) {
  SpeechSynthesisParentPolyfill.initialize();
}

// In ms, how frequently we will use SpeechSynthesis to keep the feature active. After long intervals without
// using SpeechSynthesis Chromebooks will take a long time to produce the next speech. Presumably it is disabling
// the feature as an optimization. But this workaround gets around it and keeps speech fast.
const ENGINE_WAKE_INTERVAL = 5000;

// In ms, how long to wait before we consider the SpeechSynthesis engine as having failed to speak a requested
// utterance. ChromeOS and Safari in particular may simply fail to speak. If the amount of time between our speak()
// request and the time we receive the `start` event is too long then we know there was a failure and we can try
// to handle accordingly. Length is somewhat arbitrary, but 5 seconds felt OK and seemed to work well to recover from
// this error case.
const PENDING_UTTERANCE_DELAY = 5000;

// In Windows Chromium, long utterances with the Google voices simply stop after 15 seconds and we never get end or
// cancel events. The workaround proposed in https://bugs.chromium.org/p/chromium/issues/detail?id=679437 is
// to pause/resume the utterance at an interval.
const PAUSE_RESUME_WORKAROUND_INTERVAL = 10000;

// In ms. In Safari, the `start` and `end` listener do not fire consistently, especially after interruption
// with cancel. But speaking behind a timeout/delay improves the behavior significantly. Timeout of 125 ms was
// determined with testing to be a good value to use. Values less than 125 broke the workaround, while larger
// values feel too sluggish. See https://github.com/phetsims/john-travoltage/issues/435
// Beware that UtteranceQueueTests use this value too. Don't change without checking those tests.
const VOICING_UTTERANCE_INTERVAL = 125;

// A list of "novelty" voices made available by the operating system...for some reason. There is nothing special about
// these novelty SpeechSynthesisVoices to exclude them. So having a list to exclude by name and maintining over time
// is the best we can do.
const NOVELTY_VOICES = ['Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos', 'Good News', 'Jester', 'Organ', 'Superstar', 'Trinoids', 'Whisper', 'Wobble', 'Zarvox',
// not technically "novelty" but still sound too bad and would be distracting to users, see
// https://github.com/phetsims/utterance-queue/issues/93#issuecomment-1303901484
'Flo', 'Grandma', 'Grandpa', 'Junior'];

// Only one instance of SpeechSynthesisAnnouncer can be initialized, see top level type documentation.
let initializeCount = 0;
// The SpeechSynthesisVoice.lang property has a schema that is different from our locale (see https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/lang)
// As a result, manually map a couple important values back to our own supported locales, see https://github.com/phetsims/number-play/issues/230.
// You can test that this map is working with something like `'en-GB': 'es'`
const voiceLangToSupportedLocale = {
  cmn: 'zh_CN',
  yue: 'zh_HK',
  'yue-HK': 'zh_HK',
  yue_HK: 'zh_HK',
  'fil-PH': 'tl',
  // ISO 639-1 does not support filipino, so this is better than nothing (since it has translation support)
  fil_PH: 'tl'
};
const UTTERANCE_OPTION_DEFAULTS = {
  // If true and this Utterance is currently being spoken by the speech synth, announcing it
  // to the queue again will immediately cancel the synth and new content will be
  // spoken. Otherwise, new content for this utterance will be spoken whenever the old
  // content has finished speaking. Used when adding the Utterance to be spoken.
  cancelSelf: true,
  // Only applies to two Utterances with the same priority. If true and another Utterance is currently
  // being spoken by the speech synth (or queued by SpeechSynthesisAnnouncer), announcing this Utterance will immediately cancel
  // the other content being spoken by the synth. Otherwise, content for the new utterance will be spoken as soon as
  // the browser finishes speaking the utterances in front of it in line. Used when adding the Utterance to be spoken.
  cancelOther: true,
  // Provide a specific SpeechSynthesisVoice for only this Utterance, or if null use the Announcer's general
  // voiceProperty value. Used when speaking the Utterance.
  voice: null
};

// Options to the initialize function

class SpeechSynthesisAnnouncer extends Announcer {
  // controls the speaking rate of Web Speech

  // controls the pitch of the synth

  // Controls volume of the synth. Intended for use with unit tests only!!

  // In ms, how long to go before "waking the SpeechSynthesis" engine to keep speech
  // fast on Chromebooks, see documentation around ENGINE_WAKE_INTERVAL.

  // In ms, how long since we have applied the "pause/resume" workaround for long utterances in Chromium. Very
  // long SpeechSynthesisUtterances (longer than 15 seconds) get cut on Chromium and we never get "end" or "cancel"
  // events due to a platform bug, see https://bugs.chromium.org/p/chromium/issues/detail?id=679437.

  // In ms, how long it has been since we requested speech of a new utterance and when
  // the synth has successfully started speaking it. It is possible that the synth will fail to speak so if
  // this timer gets too high we handle the failure case.

  // Amount of time in ms to wait between speaking SpeechSynthesisUtterances, see
  // VOICING_UTTERANCE_INTERVAL for details about why this is necessary. Initialized to the interval value
  // so that we can speak instantly the first time.

  // emits events when the speaker starts/stops speaking, with the Utterance that is
  // either starting or stopping

  // To get around multiple inheritance issues, create enabledProperty via composition instead, then create
  // a reference on this component for the enabledProperty

  // Controls whether Voicing is enabled in a "main window" area of the application.
  // This supports the ability to disable Voicing for the important screen content of your application while keeping
  // Voicing for surrounding UI components enabled (for example).

  // Property that indicates that the Voicing feature is enabled for all areas of the application.

  // Indicates whether speech is fully enabled AND speech is allowed, as specified
  // by the Property provided in initialize(). See speechAllowedProperty of initialize(). In order for this Property
  // to be true, speechAllowedProperty, enabledProperty, and mainWindowVoicingEnabledProperty must all be true.
  // Initialized in the constructor because we don't have access to all the dependency Properties until initialize.
  // These two variable keep a public, readonly interface. We cannot use a DerivedProperty because it needs to be
  // listened to before its dependencies are created, see https://github.com/phetsims/utterance-queue/issues/72

  // synth from Web Speech API that drives speech, defined on initialize

  // possible voices for Web Speech synthesis

  // Holds a reference to the Utterance that is actively being spoken by the announcer. Note that depending
  // on the platform, there may be a delay between the speak() request and when the synth actually starts speaking.
  // Keeping a reference supports cancelling, priority changes, and cleaning when finished speaking.

  // is the VoicingManager initialized for use? This is prototypal so it isn't always initialized

  // Controls whether speech is allowed with synthesis. Null until initialized, and can be set by options to
  // initialize().

  // bound so we can link and unlink to this.canSpeakProperty when the SpeechSynthesisAnnouncer becomes initialized.

  // A listener that will cancel the Utterance that is being announced if its canAnnounceProperty becomes false.
  // Set when this Announcer begins to announce a new Utterance and cleared when the Utterance is finished/cancelled.
  // Bound so that the listener can be added and removed on Utterances without creating many closures.

  // Switch to true to enable debugging features (like logging)

  constructor(providedOptions) {
    const options = optionize()({
      // {boolean} - SpeechSynthesisAnnouncer generally doesn't care about ResponseCollectorProperties,
      // that is more specific to the Voicing feature.
      respectResponseCollectorProperties: false,
      debug: false
    }, providedOptions);
    super(options);
    this.debug = options.debug;
    this.voiceProperty = new Property(null, {
      tandem: options.tandem?.createTandem('voiceProperty'),
      phetioValueType: NullableIO(SpeechSynthesisVoiceIO),
      phetioState: false,
      phetioReadOnly: true,
      phetioDocumentation: 'the voice that is currently voicing responses'
    });
    this.voiceRateProperty = new NumberProperty(1.0, {
      range: new Range(0.75, 2),
      tandem: options.tandem?.createTandem('voiceRateProperty'),
      phetioState: false,
      phetioDocumentation: 'changes the rate of the voicing-feature voice'
    });
    this.voicePitchProperty = new NumberProperty(1.0, {
      range: new Range(0.5, 2),
      tandem: options.tandem?.createTandem('voicePitchProperty'),
      phetioState: false,
      phetioDocumentation: 'changes the pitch of the voicing-feature voice'
    });
    this.voiceVolumeProperty = new NumberProperty(1.0, {
      range: new Range(0, 1)
    });

    // Indicates whether speech using SpeechSynthesis has been requested at least once.
    // The first time speech is requested, it must be done synchronously from user input with absolutely no delay.
    // requestSpeech() generally uses a timeout to workaround browser bugs, but those cannot be used until after the
    // first request for speech.
    this.hasSpoken = false;
    this.timeSinceWakingEngine = 0;
    this.timeSincePauseResume = 0;
    this.timeSincePendingUtterance = 0;
    this.timeSinceUtteranceEnd = VOICING_UTTERANCE_INTERVAL;
    this.startSpeakingEmitter = new Emitter({
      parameters: [{
        valueType: 'string'
      }, {
        valueType: Utterance
      }]
    });
    this.endSpeakingEmitter = new Emitter({
      parameters: [{
        valueType: 'string'
      }, {
        valueType: Utterance
      }]
    });
    this.enabledComponentImplementation = new EnabledComponent({
      // initial value for the enabledProperty, false because speech should not happen until requested by user
      enabled: false,
      tandem: options.tandem,
      enabledPropertyOptions: {
        phetioDocumentation: 'toggles this controller of SpeechSynthesis on and off',
        phetioState: false,
        phetioFeatured: false
      }
    });
    assert && assert(this.enabledComponentImplementation.enabledProperty.isSettable(), 'enabledProperty must be settable');
    this.enabledProperty = this.enabledComponentImplementation.enabledProperty;
    this.mainWindowVoicingEnabledProperty = new BooleanProperty(true, {
      tandem: options.tandem?.createTandem('mainWindowVoicingEnabledProperty'),
      phetioState: false,
      phetioDocumentation: 'toggles the voicing feature on and off for the simulation screen (not the voicing preferences and toolbar controls)'
    });
    this.voicingFullyEnabledProperty = DerivedProperty.and([this.enabledProperty, this.mainWindowVoicingEnabledProperty]);
    this._speechAllowedAndFullyEnabledProperty = new BooleanProperty(false);
    this.speechAllowedAndFullyEnabledProperty = this._speechAllowedAndFullyEnabledProperty;
    this.synth = null;
    this.voicesProperty = new Property([]);
    this.speakingSpeechSynthesisUtteranceWrapper = null;
    this.isInitializedProperty = new BooleanProperty(false);
    this.canSpeakProperty = null;
    this.boundHandleCanSpeakChange = this.handleCanSpeakChange.bind(this);
    this.boundHandleCanAnnounceChange = this.handleCanAnnounceChange.bind(this);
    if (this.debug) {
      this.announcementCompleteEmitter.addListener((utterance, string) => {
        console.log('announcement complete', string);
      });
      this.startSpeakingEmitter.addListener(string => {
        this.debug && console.log('startSpeakingListener', string);
      });
      this.endSpeakingEmitter.addListener(string => {
        this.debug && console.log('endSpeakingListener', string);
      });
    }
  }
  get initialized() {
    return this.isInitializedProperty.value;
  }

  /**
   * Indicate that the SpeechSynthesisAnnouncer is ready for use, and attempt to populate voices (if they are ready yet). Adds
   * listeners that control speech.
   *
   * @param userGestureEmitter - Emits when user input happens, which is required before the browser is
   *                                       allowed to use SpeechSynthesis for the first time.
   * @param [providedOptions]
   */
  initialize(userGestureEmitter, providedOptions) {
    assert && assert(!this.initialized, 'can only be initialized once');
    assert && assert(SpeechSynthesisAnnouncer.isSpeechSynthesisSupported(), 'trying to initialize speech, but speech is not supported on this platform.');

    // See top level type documentation.
    assert && assert(initializeCount === 0, 'Only one instance of SpeechSynthesisAnnouncer can be initialized at a time.');
    initializeCount++;
    const options = optionize()({
      // {BooleanProperty|DerivedProperty.<boolean>} - Controls whether speech is allowed with speech synthesis.
      // Combined into another DerivedProperty with this.enabledProperty so you don't have to use that as one
      // of the Properties that derive speechAllowedProperty, if you are passing in a DerivedProperty.
      speechAllowedProperty: new BooleanProperty(true)
    }, providedOptions);
    this.synth = window.speechSynthesis;

    // whether the optional Property indicating speech is allowed and the SpeechSynthesisAnnouncer is enabled
    this.canSpeakProperty = DerivedProperty.and([options.speechAllowedProperty, this.enabledProperty]);
    this.canSpeakProperty.link(this.boundHandleCanSpeakChange);

    // Set the speechAllowedAndFullyEnabledProperty when dependency Properties update
    Multilink.multilink([options.speechAllowedProperty, this.voicingFullyEnabledProperty], (speechAllowed, voicingFullyEnabled) => {
      this._speechAllowedAndFullyEnabledProperty.value = speechAllowed && voicingFullyEnabled;
    });

    // browsers tend to generate the list of voices lazily, so the list of voices may be empty until speech is first
    // requested. Some browsers don't have an addEventListener function on speechSynthesis so check to see if it exists
    // before trying to call it.
    const synth = this.getSynth();
    synth.addEventListener && synth.addEventListener('voiceschanged', () => {
      this.populateVoices();
    });

    // try to populate voices immediately in case the browser populates them eagerly and we never get an
    // onvoiceschanged event
    this.populateVoices();

    // To get Voicing to happen quickly on Chromebooks we set the counter to a value that will trigger the "engine
    // wake" interval on the next animation frame the first time we get a user gesture. See ENGINE_WAKE_INTERVAL
    // for more information about this workaround.
    const startEngineListener = () => {
      this.timeSinceWakingEngine = ENGINE_WAKE_INTERVAL;

      // Display is on the namespace but cannot be imported due to circular dependencies
      userGestureEmitter.removeListener(startEngineListener);
    };
    userGestureEmitter.addListener(startEngineListener);

    // listener for timing variables
    stepTimer.addListener(this.step.bind(this));
    this.isInitializedProperty.value = true;
  }

  /**
   * @param dt - in seconds from stepTimer
   */
  step(dt) {
    // convert to ms
    dt *= 1000;

    // if initialized, this means we have a synth.
    const synth = this.getSynth();
    if (this.initialized && synth) {
      // If we haven't spoken yet, keep checking the synth to determine when there has been a successful usage
      // of SpeechSynthesis. Note this will be true if ANY SpeechSynthesisAnnouncer has successful speech (not just
      // this instance).
      if (!this.hasSpoken) {
        this.hasSpoken = synth.speaking;
      }

      // Increment the amount of time since the synth has stopped speaking the previous utterance, but don't
      // start counting up until the synth has finished speaking its current utterance.
      this.timeSinceUtteranceEnd = synth.speaking ? 0 : this.timeSinceUtteranceEnd + dt;
      this.timeSincePendingUtterance = this.speakingSpeechSynthesisUtteranceWrapper && !this.speakingSpeechSynthesisUtteranceWrapper.started ? this.timeSincePendingUtterance + dt : 0;
      if (this.timeSincePendingUtterance > PENDING_UTTERANCE_DELAY) {
        assert && assert(this.speakingSpeechSynthesisUtteranceWrapper, 'should have this.speakingSpeechSynthesisUtteranceWrapper');

        // It has been too long since we requested speech without speaking, the synth is likely failing on this platform
        this.handleSpeechSynthesisEnd(this.speakingSpeechSynthesisUtteranceWrapper.announceText, this.speakingSpeechSynthesisUtteranceWrapper);
        this.speakingSpeechSynthesisUtteranceWrapper = null;

        // cancel the synth because we really don't want it to keep trying to speak this utterance after handling
        // the assumed failure
        this.cancelSynth();
      }

      // Wait until VOICING_UTTERANCE_INTERVAL to speak again for more consistent behavior on certain platforms,
      // see documentation for the constant for more information. By setting readyToAnnounce in the step function
      // we also don't have to rely at all on the SpeechSynthesisUtterance 'end' event, which is inconsistent on
      // certain platforms. Also, not ready to announce if we are waiting for the synth to start speaking something.
      if (this.timeSinceUtteranceEnd > VOICING_UTTERANCE_INTERVAL && !this.speakingSpeechSynthesisUtteranceWrapper) {
        this.readyToAnnounce = true;
      }

      // SpeechSynthesisUtterances longer than 15 seconds will get interrupted on Chrome and fail to stop with
      // end or error events. https://bugs.chromium.org/p/chromium/issues/detail?id=679437 suggests a workaround
      // that uses pause/resume like this. The workaround is needed for desktop Chrome when using `localService: false`
      // voices. The bug does not appear on any Microsoft Edge voices. This workaround breaks SpeechSynthesis on
      // android. In this check we only use this workaround where needed.
      if (platform.chromium && !platform.android && this.voiceProperty.value && !this.voiceProperty.value.localService) {
        // Not necessary to apply the workaround unless we are currently speaking.
        this.timeSincePauseResume = synth.speaking ? this.timeSincePauseResume + dt : 0;
        if (this.timeSincePauseResume > PAUSE_RESUME_WORKAROUND_INTERVAL) {
          this.timeSincePauseResume = 0;
          synth.pause();
          synth.resume();
        }
      }

      // A workaround to keep SpeechSynthesis responsive on Chromebooks. If there is a long enough interval between
      // speech requests, the next time SpeechSynthesis is used it is very slow on Chromebook. We think the browser
      // turns "off" the synthesis engine for performance. If it has been long enough since using speech synthesis and
      // there is nothing to speak in the queue, requesting speech with empty content keeps the engine active.
      // See https://github.com/phetsims/gravity-force-lab-basics/issues/303.
      if (platform.chromeOS) {
        this.timeSinceWakingEngine += dt;
        if (!synth.speaking && this.timeSinceWakingEngine > ENGINE_WAKE_INTERVAL) {
          this.timeSinceWakingEngine = 0;

          // This space is actually quite important. An empty string began breaking chromebooks in https://github.com/phetsims/friction/issues/328
          synth.speak(new SpeechSynthesisUtterance(' '));
        }
      }
    }
  }

  /**
   * When we can no longer speak, cancel all speech to silence everything.
   */
  handleCanSpeakChange(canSpeak) {
    if (!canSpeak) {
      this.cancel();
    }
  }

  /**
   * Update the list of `voices` available to the synth, and notify that the list has changed.
   */
  populateVoices() {
    const synth = this.getSynth();
    if (synth) {
      // the browser sometimes provides duplicate voices, prune those out of the list
      this.voicesProperty.value = _.uniqBy(synth.getVoices(), voice => voice.name);
    }
  }

  /**
   * Returns an array of SpeechSynthesisVoices that are sorted such that the best sounding voices come first.
   * As of 9/27/21, we find that the "Google" voices sound best while Apple's "Fred" sounds the worst so the list
   * will be ordered to reflect that. This way "Google" voices will be selected by default when available and "Fred"
   * will almost never be the default Voice since it is last in the list. See
   * https://github.com/phetsims/scenery/issues/1282/ for discussion and this decision.
   */
  getPrioritizedVoices() {
    assert && assert(this.initialized, 'No voices available until the SpeechSynthesisAnnouncer is initialized');
    assert && assert(this.voicesProperty.value.length > 0, 'No voices available to provided a prioritized list.');
    const allVoices = this.voicesProperty.value.slice();

    // exclude "novelty" voices that are included by the operating system but marked as English.
    // const voicesWithoutNovelty = _.filter( allVoices, voice => !NOVELTY_VOICES.includes( voice.name ) );
    const voicesWithoutNovelty = _.filter(allVoices, voice => {
      // Remove the voice if the SpeechSynthesisVoice.name includes a substring of the entry in our list (the browser
      // might include more information in the name than we maintain, like locale info or something else).
      return !_.some(NOVELTY_VOICES, noveltyVoice => voice.name.includes(noveltyVoice));
    });
    const getIndex = voice => voice.name.includes('Google') ? -1 :
    // Google should move toward the front
    voice.name.includes('Fred') ? voicesWithoutNovelty.length :
    // Fred should move toward the back
    voicesWithoutNovelty.indexOf(voice); // Otherwise preserve ordering

    return voicesWithoutNovelty.sort((a, b) => getIndex(a) - getIndex(b));
  }

  /**
   * Voicing as a feature is not translatable. This function gets the "prioritized" voices (as decided by PhET) and
   * prunes out the non-english ones. This does not use this.getPrioritizedVoicesForLocale because the required Locale
   * type doesn't include 'en-US' or 'en_US' as valid values, just 'en'.
   */
  getEnglishPrioritizedVoices() {
    return _.filter(this.getPrioritizedVoices(), voice => {
      // most browsers use dashes to separate the local, Android uses underscore.
      return voice.lang === 'en-US' || voice.lang === 'en_US';
    });
  }

  /**
   * Voicing as a feature is not translatable, but some SpeechSynthesisAnnouncer usages outside of voicing are. This
   * function gets the "prioritized" voices (as decided by PhET) and
   * prunes out everything that is not the "provided" locale. The algorithm for mapping locale is as follows:
   *
   * locale: 'en' - Provided locale parameter
   * voice: 'en_GB' - YES matches!
   * voice: 'en' - YES
   *
   * locale: 'en_GB'
   * voice: 'en' - NO
   * voice: 'en_GB' - YES
   * voice: 'en-GB' - YES
   * voice: 'en-US' - NO
   *
   * locale: 'zh_CN'
   * voice: 'zh' - NO
   * voice: 'zh_CN' - YES
   *
   * locale: 'zh'
   * voice: 'zh' - YES
   * voice: 'zh_CN' - YES
   * voice: 'zh-TW' - YES
   *
   * locale: 'es_ES'
   * voice: 'es_MX' - NO
   * voice: 'es' - NO
   * voice: 'es-ES' - YES
   */
  getPrioritizedVoicesForLocale(locale) {
    // Four letter locales of type Locale include an underscore between the language and the region. Most browser voice
    // names use a dash instead of an underscore, so we need to create a version of the locale with dashes.
    const underscoreLocale = locale;
    const dashLocale = locale.replace('_', '-');
    return _.filter(this.getPrioritizedVoices(), voice => {
      // Handle unsupported locale mapping here, see voiceLangToSupportedLocale and https://github.com/phetsims/number-play/issues/230.
      const voiceLang = voiceLangToSupportedLocale.hasOwnProperty(voice.lang) ? voiceLangToSupportedLocale[voice.lang] : voice.lang;
      let matchesShortLocale = false;
      if (voiceLang.includes('_') || voiceLang.includes('-')) {
        // Mapping zh_CN or zh-CN -> zh
        matchesShortLocale = underscoreLocale === voiceLang.slice(0, 2);
      }

      // while most browsers use dashes to separate the local, Android uses underscore, so compare both types. Loosely
      // compare with includes() so all country-specific voices are available for two-letter Locale codes.
      return matchesShortLocale || underscoreLocale === voiceLang || dashLocale === voiceLang;
    });
  }

  /**
   * Implements announce so the SpeechSynthesisAnnouncer can be a source of output for utteranceQueue.
   */
  announce(announceText, utterance) {
    if (this.initialized && this.canSpeakProperty && this.canSpeakProperty.value) {
      this.requestSpeech(announceText, utterance);
    } else {
      // The announcer is not going to announce this utterance, signify that we are done with it.
      this.handleAnnouncementFailure(utterance, announceText);
    }
  }

  /**
   * The announcement of this utterance has failed in some way, signify to clients of this announcer that the utterance
   * will never complete. For example start/end events on the SpeechSynthesisUtterance will never fire.
   */
  handleAnnouncementFailure(utterance, announceText) {
    this.debug && console.log('announcement failure', announceText);
    this.announcementCompleteEmitter.emit(utterance, announceText);
  }

  /**
   * Use speech synthesis to speak an utterance. No-op unless SpeechSynthesisAnnouncer is initialized and other output
   * controlling Properties are true (see speechAllowedProperty in initialize()). This explicitly ignores
   * this.enabledProperty, allowing speech even when SpeechSynthesisAnnouncer is disabled. This is useful in rare cases, for
   * example when the SpeechSynthesisAnnouncer recently becomes disabled by the user and we need to announce confirmation of
   * that decision ("Voicing off" or "All audio off").
   *
   * NOTE: This will interrupt any currently speaking utterance.
   */
  speakIgnoringEnabled(utterance) {
    if (this.initialized) {
      this.cancel();
      this.requestSpeech(utterance.getAlertText(this.respectResponseCollectorProperties), utterance);
    }
  }

  /**
   * Request speech with SpeechSynthesis.
   */
  requestSpeech(announceText, utterance) {
    assert && assert(SpeechSynthesisAnnouncer.isSpeechSynthesisSupported(), 'trying to speak with speechSynthesis, but it is not supported on this platform');
    this.debug && console.log('requestSpeech', announceText);

    // If the utterance text is null, then opt out early
    if (!announceText) {
      this.handleAnnouncementFailure(utterance, announceText);
      return;
    }

    // Utterance.announcerOptions must be more general to allow this type to apply to any implementation of Announcer, thus "Object" as the provided options.
    const utteranceOptions = optionize3()({}, UTTERANCE_OPTION_DEFAULTS, utterance.announcerOptions);

    // embedding marks (for i18n) impact the output, strip before speaking, type cast number to string if applicable (for number)
    const stringToSpeak = removeBrTags(stripEmbeddingMarks(announceText + ''));

    // Disallow any unfilled template variables to be set in the PDOM.
    validate(stringToSpeak, Validation.STRING_WITHOUT_TEMPLATE_VARS_VALIDATOR);
    const speechSynthUtterance = new SpeechSynthesisUtterance(stringToSpeak);
    speechSynthUtterance.voice = utteranceOptions.voice || this.voiceProperty.value;
    speechSynthUtterance.pitch = this.voicePitchProperty.value;
    speechSynthUtterance.rate = this.voiceRateProperty.value;
    speechSynthUtterance.volume = this.voiceVolumeProperty.value;
    const startListener = () => {
      this.startSpeakingEmitter.emit(stringToSpeak, utterance);
      assert && assert(this.speakingSpeechSynthesisUtteranceWrapper, 'should have been set in requestSpeech');
      this.speakingSpeechSynthesisUtteranceWrapper.started = true;
      speechSynthUtterance.removeEventListener('start', startListener);
    };
    const endListener = () => {
      this.handleSpeechSynthesisEnd(stringToSpeak, speechSynthesisUtteranceWrapper);
    };

    // Keep a reference to the SpeechSynthesisUtterance and the start/endListeners so that we can remove them later.
    // Notice this is used in the function scopes above.
    // IMPORTANT NOTE: Also, this acts as a workaround for a Safari bug where the `end` event does not fire
    // consistently. If the SpeechSynthesisUtterance is not in memory when it is time for the `end` event, Safari
    // will fail to emit that event. See
    // https://stackoverflow.com/questions/23483990/speechsynthesis-api-onend-callback-not-working and
    // https://github.com/phetsims/john-travoltage/issues/435 and https://github.com/phetsims/utterance-queue/issues/52
    const speechSynthesisUtteranceWrapper = new SpeechSynthesisUtteranceWrapper(utterance, announceText, speechSynthUtterance, false, endListener, startListener);
    assert && assert(this.speakingSpeechSynthesisUtteranceWrapper === null, 'Wrapper should be null, we should have received an end event to clear it before the next one.');
    this.speakingSpeechSynthesisUtteranceWrapper = speechSynthesisUtteranceWrapper;
    speechSynthUtterance.addEventListener('start', startListener);
    speechSynthUtterance.addEventListener('end', endListener);

    // In Safari the `end` listener does not fire consistently, (especially after cancel)
    // but the error event does. In this case signify that speaking has ended.
    speechSynthUtterance.addEventListener('error', endListener);

    // Signify to the utterance-queue that we cannot speak yet until this utterance has finished
    this.readyToAnnounce = false;

    // This is generally set in the step function when the synth is not speaking, but there is a Firefox issue where
    // the SpeechSynthesis.speaking is set to `true` asynchronously. So we eagerly reset this timing variable to
    // signify that we need to wait VOICING_UTTERANCE_INTERVAL until we are allowed to speak again.
    // See https://github.com/phetsims/utterance-queue/issues/40
    this.timeSinceUtteranceEnd = 0;

    // Interrupt if the Utterance can no longer be announced.
    utterance.canAnnounceProperty.link(this.boundHandleCanAnnounceChange);
    utterance.voicingCanAnnounceProperty.link(this.boundHandleCanAnnounceChange);
    this.getSynth().speak(speechSynthUtterance);
  }

  /**
   * When a canAnnounceProperty changes to false for an Utterance, that utterance should be cancelled.
   */
  handleCanAnnounceChange() {
    if (this.speakingSpeechSynthesisUtteranceWrapper) {
      this.cancelUtteranceIfCanAnnounceFalse(this.speakingSpeechSynthesisUtteranceWrapper.utterance);
    }
  }

  /**
   * When a canAnnounceProperty changes, cancel the Utterance if the value becomes false.
   */
  cancelUtteranceIfCanAnnounceFalse(utterance) {
    if (!utterance.canAnnounceProperty.value || !utterance.voicingCanAnnounceProperty.value) {
      this.cancelUtterance(utterance);
    }
  }

  /**
   * All the work necessary when we are finished with an utterance, intended for end or cancel.
   * Emits events signifying that we are done with speech and does some disposal.
   */
  handleSpeechSynthesisEnd(stringToSpeak, speechSynthesisUtteranceWrapper) {
    this.endSpeakingEmitter.emit(stringToSpeak, speechSynthesisUtteranceWrapper.utterance);
    this.announcementCompleteEmitter.emit(speechSynthesisUtteranceWrapper.utterance, speechSynthesisUtteranceWrapper.speechSynthesisUtterance.text);
    speechSynthesisUtteranceWrapper.speechSynthesisUtterance.removeEventListener('error', speechSynthesisUtteranceWrapper.endListener);
    speechSynthesisUtteranceWrapper.speechSynthesisUtterance.removeEventListener('end', speechSynthesisUtteranceWrapper.endListener);
    speechSynthesisUtteranceWrapper.speechSynthesisUtterance.removeEventListener('start', speechSynthesisUtteranceWrapper.startListener);

    // The endSpeakingEmitter may end up calling handleSpeechSynthesisEnd in its listeners, we need to be graceful
    const utteranceCanAnnounceProperty = speechSynthesisUtteranceWrapper.utterance.canAnnounceProperty;
    if (utteranceCanAnnounceProperty.hasListener(this.boundHandleCanAnnounceChange)) {
      utteranceCanAnnounceProperty.unlink(this.boundHandleCanAnnounceChange);
    }
    const utteranceVoicingCanAnnounceProperty = speechSynthesisUtteranceWrapper.utterance.voicingCanAnnounceProperty;
    if (utteranceVoicingCanAnnounceProperty.hasListener(this.boundHandleCanAnnounceChange)) {
      utteranceVoicingCanAnnounceProperty.unlink(this.boundHandleCanAnnounceChange);
    }
    this.speakingSpeechSynthesisUtteranceWrapper = null;
  }

  /**
   * Returns a references to the SpeechSynthesis of the SpeechSynthesisAnnouncer that is used to request speech with the Web
   * Speech API. Every references has a check to ensure that the synth is available.
   */
  getSynth() {
    assert && assert(SpeechSynthesisAnnouncer.isSpeechSynthesisSupported(), 'Trying to use SpeechSynthesis, but it is not supported on this platform.');
    return this.synth;
  }

  /**
   * Stops any Utterance that is currently being announced or is (about to be announced).
   * (utterance-queue internal)
   */
  cancel() {
    if (this.initialized) {
      this.speakingSpeechSynthesisUtteranceWrapper && this.cancelUtterance(this.speakingSpeechSynthesisUtteranceWrapper.utterance);
    }
  }

  /**
   * Cancel the provided Utterance, if it is currently being spoken by this Announcer. Does not cancel
   * any other utterances that may be in the UtteranceQueue.
   * (utterance-queue internal)
   */
  cancelUtterance(utterance) {
    const wrapper = this.speakingSpeechSynthesisUtteranceWrapper;
    if (wrapper && utterance === wrapper.utterance) {
      this.handleSpeechSynthesisEnd(wrapper.announceText, wrapper);

      // silence all speech - after handleSpeechSynthesisEnd so we don't do that work twice in case `cancelSynth`
      // also triggers end events immediately (but that doesn't happen on all browsers)
      this.cancelSynth();
    }
  }

  /**
   * Given one utterance, should it cancel another provided utterance?
   */
  shouldUtteranceCancelOther(utterance, utteranceToCancel) {
    // Utterance.announcerOptions must be more general to allow this type to apply to any implementation of Announcer, thus "Object" as the provided options.
    const utteranceOptions = optionize3()({}, UTTERANCE_OPTION_DEFAULTS, utterance.announcerOptions);
    let shouldCancel;
    if (utteranceToCancel.priorityProperty.value !== utterance.priorityProperty.value) {
      shouldCancel = utteranceToCancel.priorityProperty.value < utterance.priorityProperty.value;
    } else {
      shouldCancel = utteranceOptions.cancelOther;
      if (utteranceToCancel && utteranceToCancel === utterance) {
        shouldCancel = utteranceOptions.cancelSelf;
      }
    }
    return shouldCancel;
  }

  /**
   * When the priority for a new utterance changes or if a new utterance is added to the queue, determine whether
   * we should cancel the synth immediately.
   */
  onUtterancePriorityChange(nextAvailableUtterance) {
    // test against what is currently being spoken by the synth
    const wrapper = this.speakingSpeechSynthesisUtteranceWrapper;
    if (wrapper && this.shouldUtteranceCancelOther(nextAvailableUtterance, wrapper.utterance)) {
      this.cancelUtterance(wrapper.utterance);
    }
  }

  /**
   * Cancel the synth. This will silence speech. This will silence any speech and cancel the
   */
  cancelSynth() {
    assert && assert(this.initialized, 'must be initialized to use synth');
    const synth = this.getSynth();
    synth && synth.cancel();
  }

  /**
   * Returns true if SpeechSynthesis is available on the window. This check is sufficient for all of
   * SpeechSynthesisAnnouncer. On platforms where speechSynthesis is available, all features of it are available, except for the
   * onvoiceschanged event in a couple of platforms. However, the listener can still be set
   * without issue on those platforms so we don't need to check for its existence. On those platforms, voices
   * are provided right on load.
   */
  static isSpeechSynthesisSupported() {
    return !!window.speechSynthesis && !!window.SpeechSynthesisUtterance;
  }
}

/**
 * An inner class that combines some objects that are necessary to keep track of to dispose
 * SpeechSynthesisUtterances when it is time. It is also used for the "Safari Workaround" to keep a reference
 * of the SpeechSynthesisUtterance in memory long enough for the 'end' event to be emitted.
 */
class SpeechSynthesisUtteranceWrapper {
  constructor(utterance, announceText, speechSynthesisUtterance, started, endListener, startListener) {
    this.utterance = utterance;
    this.announceText = announceText;
    this.speechSynthesisUtterance = speechSynthesisUtterance;
    this.started = started;
    this.endListener = endListener;
    this.startListener = startListener;
  }
}

/**
 * Remove <br> or <br/> tags from a string
 * @param string - plain text or html string
 */
function removeBrTags(string) {
  return string.split('<br/>').join(' ').split('<br>').join(' ');
}
const SpeechSynthesisVoiceIO = new IOType('SpeechSynthesisVoiceIO', {
  isValidValue: v => true,
  // SpeechSynthesisVoice is not available on window
  toStateObject: speechSynthesisVoice => speechSynthesisVoice.name
});
utteranceQueueNamespace.register('SpeechSynthesisAnnouncer', SpeechSynthesisAnnouncer);
export default SpeechSynthesisAnnouncer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJEZXJpdmVkUHJvcGVydHkiLCJFbWl0dGVyIiwiRW5hYmxlZENvbXBvbmVudCIsIk51bWJlclByb3BlcnR5IiwiUHJvcGVydHkiLCJSYW5nZSIsIm9wdGlvbml6ZSIsIm9wdGlvbml6ZTMiLCJzdHJpcEVtYmVkZGluZ01hcmtzIiwiQW5ub3VuY2VyIiwiVXR0ZXJhbmNlIiwiU3BlZWNoU3ludGhlc2lzUGFyZW50UG9seWZpbGwiLCJ1dHRlcmFuY2VRdWV1ZU5hbWVzcGFjZSIsInN0ZXBUaW1lciIsInBsYXRmb3JtIiwiTXVsdGlsaW5rIiwiSU9UeXBlIiwiTnVsbGFibGVJTyIsInZhbGlkYXRlIiwiVmFsaWRhdGlvbiIsIndpbmRvdyIsInBoZXQiLCJjaGlwcGVyIiwicXVlcnlQYXJhbWV0ZXJzIiwic3BlZWNoU3ludGhlc2lzRnJvbVBhcmVudCIsImluaXRpYWxpemUiLCJFTkdJTkVfV0FLRV9JTlRFUlZBTCIsIlBFTkRJTkdfVVRURVJBTkNFX0RFTEFZIiwiUEFVU0VfUkVTVU1FX1dPUktBUk9VTkRfSU5URVJWQUwiLCJWT0lDSU5HX1VUVEVSQU5DRV9JTlRFUlZBTCIsIk5PVkVMVFlfVk9JQ0VTIiwiaW5pdGlhbGl6ZUNvdW50Iiwidm9pY2VMYW5nVG9TdXBwb3J0ZWRMb2NhbGUiLCJjbW4iLCJ5dWUiLCJ5dWVfSEsiLCJmaWxfUEgiLCJVVFRFUkFOQ0VfT1BUSU9OX0RFRkFVTFRTIiwiY2FuY2VsU2VsZiIsImNhbmNlbE90aGVyIiwidm9pY2UiLCJTcGVlY2hTeW50aGVzaXNBbm5vdW5jZXIiLCJjb25zdHJ1Y3RvciIsInByb3ZpZGVkT3B0aW9ucyIsIm9wdGlvbnMiLCJyZXNwZWN0UmVzcG9uc2VDb2xsZWN0b3JQcm9wZXJ0aWVzIiwiZGVidWciLCJ2b2ljZVByb3BlcnR5IiwidGFuZGVtIiwiY3JlYXRlVGFuZGVtIiwicGhldGlvVmFsdWVUeXBlIiwiU3BlZWNoU3ludGhlc2lzVm9pY2VJTyIsInBoZXRpb1N0YXRlIiwicGhldGlvUmVhZE9ubHkiLCJwaGV0aW9Eb2N1bWVudGF0aW9uIiwidm9pY2VSYXRlUHJvcGVydHkiLCJyYW5nZSIsInZvaWNlUGl0Y2hQcm9wZXJ0eSIsInZvaWNlVm9sdW1lUHJvcGVydHkiLCJoYXNTcG9rZW4iLCJ0aW1lU2luY2VXYWtpbmdFbmdpbmUiLCJ0aW1lU2luY2VQYXVzZVJlc3VtZSIsInRpbWVTaW5jZVBlbmRpbmdVdHRlcmFuY2UiLCJ0aW1lU2luY2VVdHRlcmFuY2VFbmQiLCJzdGFydFNwZWFraW5nRW1pdHRlciIsInBhcmFtZXRlcnMiLCJ2YWx1ZVR5cGUiLCJlbmRTcGVha2luZ0VtaXR0ZXIiLCJlbmFibGVkQ29tcG9uZW50SW1wbGVtZW50YXRpb24iLCJlbmFibGVkIiwiZW5hYmxlZFByb3BlcnR5T3B0aW9ucyIsInBoZXRpb0ZlYXR1cmVkIiwiYXNzZXJ0IiwiZW5hYmxlZFByb3BlcnR5IiwiaXNTZXR0YWJsZSIsIm1haW5XaW5kb3dWb2ljaW5nRW5hYmxlZFByb3BlcnR5Iiwidm9pY2luZ0Z1bGx5RW5hYmxlZFByb3BlcnR5IiwiYW5kIiwiX3NwZWVjaEFsbG93ZWRBbmRGdWxseUVuYWJsZWRQcm9wZXJ0eSIsInNwZWVjaEFsbG93ZWRBbmRGdWxseUVuYWJsZWRQcm9wZXJ0eSIsInN5bnRoIiwidm9pY2VzUHJvcGVydHkiLCJzcGVha2luZ1NwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZVdyYXBwZXIiLCJpc0luaXRpYWxpemVkUHJvcGVydHkiLCJjYW5TcGVha1Byb3BlcnR5IiwiYm91bmRIYW5kbGVDYW5TcGVha0NoYW5nZSIsImhhbmRsZUNhblNwZWFrQ2hhbmdlIiwiYmluZCIsImJvdW5kSGFuZGxlQ2FuQW5ub3VuY2VDaGFuZ2UiLCJoYW5kbGVDYW5Bbm5vdW5jZUNoYW5nZSIsImFubm91bmNlbWVudENvbXBsZXRlRW1pdHRlciIsImFkZExpc3RlbmVyIiwidXR0ZXJhbmNlIiwic3RyaW5nIiwiY29uc29sZSIsImxvZyIsImluaXRpYWxpemVkIiwidmFsdWUiLCJ1c2VyR2VzdHVyZUVtaXR0ZXIiLCJpc1NwZWVjaFN5bnRoZXNpc1N1cHBvcnRlZCIsInNwZWVjaEFsbG93ZWRQcm9wZXJ0eSIsInNwZWVjaFN5bnRoZXNpcyIsImxpbmsiLCJtdWx0aWxpbmsiLCJzcGVlY2hBbGxvd2VkIiwidm9pY2luZ0Z1bGx5RW5hYmxlZCIsImdldFN5bnRoIiwiYWRkRXZlbnRMaXN0ZW5lciIsInBvcHVsYXRlVm9pY2VzIiwic3RhcnRFbmdpbmVMaXN0ZW5lciIsInJlbW92ZUxpc3RlbmVyIiwic3RlcCIsImR0Iiwic3BlYWtpbmciLCJzdGFydGVkIiwiaGFuZGxlU3BlZWNoU3ludGhlc2lzRW5kIiwiYW5ub3VuY2VUZXh0IiwiY2FuY2VsU3ludGgiLCJyZWFkeVRvQW5ub3VuY2UiLCJjaHJvbWl1bSIsImFuZHJvaWQiLCJsb2NhbFNlcnZpY2UiLCJwYXVzZSIsInJlc3VtZSIsImNocm9tZU9TIiwic3BlYWsiLCJTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UiLCJjYW5TcGVhayIsImNhbmNlbCIsIl8iLCJ1bmlxQnkiLCJnZXRWb2ljZXMiLCJuYW1lIiwiZ2V0UHJpb3JpdGl6ZWRWb2ljZXMiLCJsZW5ndGgiLCJhbGxWb2ljZXMiLCJzbGljZSIsInZvaWNlc1dpdGhvdXROb3ZlbHR5IiwiZmlsdGVyIiwic29tZSIsIm5vdmVsdHlWb2ljZSIsImluY2x1ZGVzIiwiZ2V0SW5kZXgiLCJpbmRleE9mIiwic29ydCIsImEiLCJiIiwiZ2V0RW5nbGlzaFByaW9yaXRpemVkVm9pY2VzIiwibGFuZyIsImdldFByaW9yaXRpemVkVm9pY2VzRm9yTG9jYWxlIiwibG9jYWxlIiwidW5kZXJzY29yZUxvY2FsZSIsImRhc2hMb2NhbGUiLCJyZXBsYWNlIiwidm9pY2VMYW5nIiwiaGFzT3duUHJvcGVydHkiLCJtYXRjaGVzU2hvcnRMb2NhbGUiLCJhbm5vdW5jZSIsInJlcXVlc3RTcGVlY2giLCJoYW5kbGVBbm5vdW5jZW1lbnRGYWlsdXJlIiwiZW1pdCIsInNwZWFrSWdub3JpbmdFbmFibGVkIiwiZ2V0QWxlcnRUZXh0IiwidXR0ZXJhbmNlT3B0aW9ucyIsImFubm91bmNlck9wdGlvbnMiLCJzdHJpbmdUb1NwZWFrIiwicmVtb3ZlQnJUYWdzIiwiU1RSSU5HX1dJVEhPVVRfVEVNUExBVEVfVkFSU19WQUxJREFUT1IiLCJzcGVlY2hTeW50aFV0dGVyYW5jZSIsInBpdGNoIiwicmF0ZSIsInZvbHVtZSIsInN0YXJ0TGlzdGVuZXIiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiZW5kTGlzdGVuZXIiLCJzcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VXcmFwcGVyIiwiU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlV3JhcHBlciIsImNhbkFubm91bmNlUHJvcGVydHkiLCJ2b2ljaW5nQ2FuQW5ub3VuY2VQcm9wZXJ0eSIsImNhbmNlbFV0dGVyYW5jZUlmQ2FuQW5ub3VuY2VGYWxzZSIsImNhbmNlbFV0dGVyYW5jZSIsInNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSIsInRleHQiLCJ1dHRlcmFuY2VDYW5Bbm5vdW5jZVByb3BlcnR5IiwiaGFzTGlzdGVuZXIiLCJ1bmxpbmsiLCJ1dHRlcmFuY2VWb2ljaW5nQ2FuQW5ub3VuY2VQcm9wZXJ0eSIsIndyYXBwZXIiLCJzaG91bGRVdHRlcmFuY2VDYW5jZWxPdGhlciIsInV0dGVyYW5jZVRvQ2FuY2VsIiwic2hvdWxkQ2FuY2VsIiwicHJpb3JpdHlQcm9wZXJ0eSIsIm9uVXR0ZXJhbmNlUHJpb3JpdHlDaGFuZ2UiLCJuZXh0QXZhaWxhYmxlVXR0ZXJhbmNlIiwic3BsaXQiLCJqb2luIiwiaXNWYWxpZFZhbHVlIiwidiIsInRvU3RhdGVPYmplY3QiLCJzcGVlY2hTeW50aGVzaXNWb2ljZSIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiU3BlZWNoU3ludGhlc2lzQW5ub3VuY2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIyLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIFVzZXMgdGhlIFdlYiBTcGVlY2ggQVBJIHRvIHByb2R1Y2Ugc3BlZWNoIGZyb20gdGhlIGJyb3dzZXIuIFRoZXJlIGlzIG5vIHNwZWVjaCBvdXRwdXQgdW50aWwgdGhlIFNwZWVjaFN5bnRoZXNpc0Fubm91bmNlciBoYXNcclxuICogYmVlbiBpbml0aWFsaXplZC4gU3VwcG9ydGVkIHZvaWNlcyB3aWxsIGRlcGVuZCBvbiBwbGF0Zm9ybS4gRm9yIGVhY2ggdm9pY2UsIHlvdSBjYW4gY3VzdG9taXplIHRoZSByYXRlIGFuZCBwaXRjaC5cclxuICpcclxuICogT25seSBvbmUgU3BlZWNoU3ludGhlc2lzQW5ub3VuY2VyIGNhbiBiZSB1c2VkIGF0IGEgdGltZS4gVGhpcyBjbGFzcyB1c2VzIGEgZ2xvYmFsIGluc3RhbmNlIG9mIHdpbmRvdy5zcGVlY2hTeW50aGVzaXNcclxuICogYW5kIGFzc3VtZXMgaXQgaGFzIGZ1bGwgY29udHJvbCBvdmVyIGl0LiBUaGlzIGlzIG5vdCBhIHNpbmdsZXRvbiBiZWNhdXNlIHN1YmNsYXNzZXMgbWF5IGV4dGVuZCB0aGlzIGZvciBzcGVjaWZpY1xyXG4gKiB1c2VzLiBGb3IgZXhhbXBsZSwgUGhFVCBoYXMgb25lIHN1YmNsYXNzIHNwZWNpZmljIHRvIGl0cyBWb2ljaW5nIGZlYXR1cmUgYW5kIGFub3RoZXIgc3BlY2lmaWMgdG9cclxuICogY3VzdG9tIHNwZWVjaCBzeW50aGVzaXMgaW4gbnVtYmVyLXN1aXRlLWNvbW1vbiBzaW1zLlxyXG4gKlxyXG4gKiBBIG5vdGUgYWJvdXQgUGhFVC1pTyBpbnN0cnVtZW50YXRpb246XHJcbiAqIFByb3BlcnRpZXMgYXJlIGluc3RydW1lbnRlZCBmb3IgUGhFVC1pTyB0byBwcm92aWRlIGEgcmVjb3JkIG9mIGxlYXJuZXJzIHRoYXQgbWF5IGhhdmUgdXNlZCB0aGlzIGZlYXR1cmUgKGFuZCBob3cpLiBBbGxcclxuICogUHJvcGVydGllcyBzaG91bGQgYmUgcGhldGlvU3RhdGU6ZmFsc2Ugc28gdGhlIHZhbHVlcyBhcmUgbm90IG92ZXJ3cml0dGVuIHdoZW4gYSBjdXN0b21pemVkIHN0YXRlIGlzIGxvYWRlZC5cclxuICogUHJvcGVydGllcyBhcmUgbm90IHBoZXRpb1JlYWRvbmx5IHNvIHRoYXQgY2xpZW50cyBjYW4gb3ZlcndyaXRlIHRoZSB2YWx1ZXMgdXNpbmcgdGhlIFBoRVQtaU8gQVBJIGFuZCBzdHVkaW8uXHJcbiAqXHJcbiAqIEBhdXRob3IgSmVzc2UgR3JlZW5iZXJnXHJcbiAqL1xyXG5cclxuaW1wb3J0IEJvb2xlYW5Qcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL0Jvb2xlYW5Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBEZXJpdmVkUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9EZXJpdmVkUHJvcGVydHkuanMnO1xyXG5pbXBvcnQgRW1pdHRlciBmcm9tICcuLi8uLi9heG9uL2pzL0VtaXR0ZXIuanMnO1xyXG5pbXBvcnQgRW5hYmxlZENvbXBvbmVudCBmcm9tICcuLi8uLi9heG9uL2pzL0VuYWJsZWRDb21wb25lbnQuanMnO1xyXG5pbXBvcnQgVFByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvVFByb3BlcnR5LmpzJztcclxuaW1wb3J0IFRSZWFkT25seVByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvVFJlYWRPbmx5UHJvcGVydHkuanMnO1xyXG5pbXBvcnQgTnVtYmVyUHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9OdW1iZXJQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBQcm9wZXJ0eSBmcm9tICcuLi8uLi9heG9uL2pzL1Byb3BlcnR5LmpzJztcclxuaW1wb3J0IFJhbmdlIGZyb20gJy4uLy4uL2RvdC9qcy9SYW5nZS5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUsIHsgb3B0aW9uaXplMywgT3B0aW9uaXplRGVmYXVsdHMgfSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvb3B0aW9uaXplLmpzJztcclxuaW1wb3J0IHN0cmlwRW1iZWRkaW5nTWFya3MgZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL3N0cmlwRW1iZWRkaW5nTWFya3MuanMnO1xyXG5pbXBvcnQgQW5ub3VuY2VyLCB7IEFubm91bmNlck9wdGlvbnMgfSBmcm9tICcuLi8uLi91dHRlcmFuY2UtcXVldWUvanMvQW5ub3VuY2VyLmpzJztcclxuaW1wb3J0IFV0dGVyYW5jZSBmcm9tICcuLi8uLi91dHRlcmFuY2UtcXVldWUvanMvVXR0ZXJhbmNlLmpzJztcclxuaW1wb3J0IFNwZWVjaFN5bnRoZXNpc1BhcmVudFBvbHlmaWxsIGZyb20gJy4vU3BlZWNoU3ludGhlc2lzUGFyZW50UG9seWZpbGwuanMnO1xyXG5pbXBvcnQgdXR0ZXJhbmNlUXVldWVOYW1lc3BhY2UgZnJvbSAnLi91dHRlcmFuY2VRdWV1ZU5hbWVzcGFjZS5qcyc7XHJcbmltcG9ydCB7IFJlc29sdmVkUmVzcG9uc2UgfSBmcm9tICcuL1Jlc3BvbnNlUGFja2V0LmpzJztcclxuaW1wb3J0IHN0ZXBUaW1lciBmcm9tICcuLi8uLi9heG9uL2pzL3N0ZXBUaW1lci5qcyc7XHJcbmltcG9ydCBwbGF0Zm9ybSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvcGxhdGZvcm0uanMnO1xyXG5pbXBvcnQgTXVsdGlsaW5rIGZyb20gJy4uLy4uL2F4b24vanMvTXVsdGlsaW5rLmpzJztcclxuaW1wb3J0IFRFbWl0dGVyLCB7IFRSZWFkT25seUVtaXR0ZXIgfSBmcm9tICcuLi8uLi9heG9uL2pzL1RFbWl0dGVyLmpzJztcclxuaW1wb3J0IElPVHlwZSBmcm9tICcuLi8uLi90YW5kZW0vanMvdHlwZXMvSU9UeXBlLmpzJztcclxuaW1wb3J0IE51bGxhYmxlSU8gZnJvbSAnLi4vLi4vdGFuZGVtL2pzL3R5cGVzL051bGxhYmxlSU8uanMnO1xyXG5pbXBvcnQgdmFsaWRhdGUgZnJvbSAnLi4vLi4vYXhvbi9qcy92YWxpZGF0ZS5qcyc7XHJcbmltcG9ydCBWYWxpZGF0aW9uIGZyb20gJy4uLy4uL2F4b24vanMvVmFsaWRhdGlvbi5qcyc7XHJcbmltcG9ydCB7IExvY2FsZSB9IGZyb20gJy4uLy4uL2pvaXN0L2pzL2kxOG4vbG9jYWxlUHJvcGVydHkuanMnO1xyXG5cclxuLy8gSWYgYSBwb2x5ZmlsbCBmb3IgU3BlZWNoU3ludGhlc2lzIGlzIHJlcXVlc3RlZCwgdHJ5IHRvIGluaXRpYWxpemUgaXQgaGVyZSBiZWZvcmUgU3BlZWNoU3ludGhlc2lzIHVzYWdlcy4gRm9yXHJcbi8vIG5vdyB0aGlzIGlzIGEgUGhFVCBzcGVjaWZpYyBmZWF0dXJlLCBhdmFpbGFibGUgYnkgcXVlcnkgcGFyYW1ldGVyIGluIGluaXRpYWxpemUtZ2xvYmFscy4gUXVlcnlTdHJpbmdNYWNoaW5lXHJcbi8vIGNhbm5vdCBiZSB1c2VkIGZvciB0aGlzLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3NjZW5lcnkvaXNzdWVzLzEzNjZcclxuaWYgKCB3aW5kb3cucGhldCAmJiBwaGV0LmNoaXBwZXIgJiYgcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycyAmJiBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLnNwZWVjaFN5bnRoZXNpc0Zyb21QYXJlbnQgKSB7XHJcbiAgU3BlZWNoU3ludGhlc2lzUGFyZW50UG9seWZpbGwuaW5pdGlhbGl6ZSgpO1xyXG59XHJcblxyXG4vLyBJbiBtcywgaG93IGZyZXF1ZW50bHkgd2Ugd2lsbCB1c2UgU3BlZWNoU3ludGhlc2lzIHRvIGtlZXAgdGhlIGZlYXR1cmUgYWN0aXZlLiBBZnRlciBsb25nIGludGVydmFscyB3aXRob3V0XHJcbi8vIHVzaW5nIFNwZWVjaFN5bnRoZXNpcyBDaHJvbWVib29rcyB3aWxsIHRha2UgYSBsb25nIHRpbWUgdG8gcHJvZHVjZSB0aGUgbmV4dCBzcGVlY2guIFByZXN1bWFibHkgaXQgaXMgZGlzYWJsaW5nXHJcbi8vIHRoZSBmZWF0dXJlIGFzIGFuIG9wdGltaXphdGlvbi4gQnV0IHRoaXMgd29ya2Fyb3VuZCBnZXRzIGFyb3VuZCBpdCBhbmQga2VlcHMgc3BlZWNoIGZhc3QuXHJcbmNvbnN0IEVOR0lORV9XQUtFX0lOVEVSVkFMID0gNTAwMDtcclxuXHJcbi8vIEluIG1zLCBob3cgbG9uZyB0byB3YWl0IGJlZm9yZSB3ZSBjb25zaWRlciB0aGUgU3BlZWNoU3ludGhlc2lzIGVuZ2luZSBhcyBoYXZpbmcgZmFpbGVkIHRvIHNwZWFrIGEgcmVxdWVzdGVkXHJcbi8vIHV0dGVyYW5jZS4gQ2hyb21lT1MgYW5kIFNhZmFyaSBpbiBwYXJ0aWN1bGFyIG1heSBzaW1wbHkgZmFpbCB0byBzcGVhay4gSWYgdGhlIGFtb3VudCBvZiB0aW1lIGJldHdlZW4gb3VyIHNwZWFrKClcclxuLy8gcmVxdWVzdCBhbmQgdGhlIHRpbWUgd2UgcmVjZWl2ZSB0aGUgYHN0YXJ0YCBldmVudCBpcyB0b28gbG9uZyB0aGVuIHdlIGtub3cgdGhlcmUgd2FzIGEgZmFpbHVyZSBhbmQgd2UgY2FuIHRyeVxyXG4vLyB0byBoYW5kbGUgYWNjb3JkaW5nbHkuIExlbmd0aCBpcyBzb21ld2hhdCBhcmJpdHJhcnksIGJ1dCA1IHNlY29uZHMgZmVsdCBPSyBhbmQgc2VlbWVkIHRvIHdvcmsgd2VsbCB0byByZWNvdmVyIGZyb21cclxuLy8gdGhpcyBlcnJvciBjYXNlLlxyXG5jb25zdCBQRU5ESU5HX1VUVEVSQU5DRV9ERUxBWSA9IDUwMDA7XHJcblxyXG4vLyBJbiBXaW5kb3dzIENocm9taXVtLCBsb25nIHV0dGVyYW5jZXMgd2l0aCB0aGUgR29vZ2xlIHZvaWNlcyBzaW1wbHkgc3RvcCBhZnRlciAxNSBzZWNvbmRzIGFuZCB3ZSBuZXZlciBnZXQgZW5kIG9yXHJcbi8vIGNhbmNlbCBldmVudHMuIFRoZSB3b3JrYXJvdW5kIHByb3Bvc2VkIGluIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTY3OTQzNyBpc1xyXG4vLyB0byBwYXVzZS9yZXN1bWUgdGhlIHV0dGVyYW5jZSBhdCBhbiBpbnRlcnZhbC5cclxuY29uc3QgUEFVU0VfUkVTVU1FX1dPUktBUk9VTkRfSU5URVJWQUwgPSAxMDAwMDtcclxuXHJcbi8vIEluIG1zLiBJbiBTYWZhcmksIHRoZSBgc3RhcnRgIGFuZCBgZW5kYCBsaXN0ZW5lciBkbyBub3QgZmlyZSBjb25zaXN0ZW50bHksIGVzcGVjaWFsbHkgYWZ0ZXIgaW50ZXJydXB0aW9uXHJcbi8vIHdpdGggY2FuY2VsLiBCdXQgc3BlYWtpbmcgYmVoaW5kIGEgdGltZW91dC9kZWxheSBpbXByb3ZlcyB0aGUgYmVoYXZpb3Igc2lnbmlmaWNhbnRseS4gVGltZW91dCBvZiAxMjUgbXMgd2FzXHJcbi8vIGRldGVybWluZWQgd2l0aCB0ZXN0aW5nIHRvIGJlIGEgZ29vZCB2YWx1ZSB0byB1c2UuIFZhbHVlcyBsZXNzIHRoYW4gMTI1IGJyb2tlIHRoZSB3b3JrYXJvdW5kLCB3aGlsZSBsYXJnZXJcclxuLy8gdmFsdWVzIGZlZWwgdG9vIHNsdWdnaXNoLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2pvaG4tdHJhdm9sdGFnZS9pc3N1ZXMvNDM1XHJcbi8vIEJld2FyZSB0aGF0IFV0dGVyYW5jZVF1ZXVlVGVzdHMgdXNlIHRoaXMgdmFsdWUgdG9vLiBEb24ndCBjaGFuZ2Ugd2l0aG91dCBjaGVja2luZyB0aG9zZSB0ZXN0cy5cclxuY29uc3QgVk9JQ0lOR19VVFRFUkFOQ0VfSU5URVJWQUwgPSAxMjU7XHJcblxyXG4vLyBBIGxpc3Qgb2YgXCJub3ZlbHR5XCIgdm9pY2VzIG1hZGUgYXZhaWxhYmxlIGJ5IHRoZSBvcGVyYXRpbmcgc3lzdGVtLi4uZm9yIHNvbWUgcmVhc29uLiBUaGVyZSBpcyBub3RoaW5nIHNwZWNpYWwgYWJvdXRcclxuLy8gdGhlc2Ugbm92ZWx0eSBTcGVlY2hTeW50aGVzaXNWb2ljZXMgdG8gZXhjbHVkZSB0aGVtLiBTbyBoYXZpbmcgYSBsaXN0IHRvIGV4Y2x1ZGUgYnkgbmFtZSBhbmQgbWFpbnRpbmluZyBvdmVyIHRpbWVcclxuLy8gaXMgdGhlIGJlc3Qgd2UgY2FuIGRvLlxyXG5jb25zdCBOT1ZFTFRZX1ZPSUNFUyA9IFtcclxuICAnQWxiZXJ0JyxcclxuICAnQmFkIE5ld3MnLFxyXG4gICdCYWhoJyxcclxuICAnQmVsbHMnLFxyXG4gICdCb2luZycsXHJcbiAgJ0J1YmJsZXMnLFxyXG4gICdDZWxsb3MnLFxyXG4gICdHb29kIE5ld3MnLFxyXG4gICdKZXN0ZXInLFxyXG4gICdPcmdhbicsXHJcbiAgJ1N1cGVyc3RhcicsXHJcbiAgJ1RyaW5vaWRzJyxcclxuICAnV2hpc3BlcicsXHJcbiAgJ1dvYmJsZScsXHJcbiAgJ1phcnZveCcsXHJcblxyXG4gIC8vIG5vdCB0ZWNobmljYWxseSBcIm5vdmVsdHlcIiBidXQgc3RpbGwgc291bmQgdG9vIGJhZCBhbmQgd291bGQgYmUgZGlzdHJhY3RpbmcgdG8gdXNlcnMsIHNlZVxyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy91dHRlcmFuY2UtcXVldWUvaXNzdWVzLzkzI2lzc3VlY29tbWVudC0xMzAzOTAxNDg0XHJcbiAgJ0ZsbycsXHJcbiAgJ0dyYW5kbWEnLFxyXG4gICdHcmFuZHBhJyxcclxuICAnSnVuaW9yJ1xyXG5dO1xyXG5cclxuLy8gT25seSBvbmUgaW5zdGFuY2Ugb2YgU3BlZWNoU3ludGhlc2lzQW5ub3VuY2VyIGNhbiBiZSBpbml0aWFsaXplZCwgc2VlIHRvcCBsZXZlbCB0eXBlIGRvY3VtZW50YXRpb24uXHJcbmxldCBpbml0aWFsaXplQ291bnQgPSAwO1xyXG5cclxudHlwZSBTcGVlY2hTeW50aGVzaXNBbm5vdW5jZU9wdGlvbnMgPSB7XHJcbiAgY2FuY2VsU2VsZj86IGJvb2xlYW47XHJcbiAgY2FuY2VsT3RoZXI/OiBib29sZWFuO1xyXG4gIHZvaWNlPzogU3BlZWNoU3ludGhlc2lzVm9pY2UgfCBudWxsO1xyXG59O1xyXG5cclxuLy8gVGhlIFNwZWVjaFN5bnRoZXNpc1ZvaWNlLmxhbmcgcHJvcGVydHkgaGFzIGEgc2NoZW1hIHRoYXQgaXMgZGlmZmVyZW50IGZyb20gb3VyIGxvY2FsZSAoc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TcGVlY2hTeW50aGVzaXNWb2ljZS9sYW5nKVxyXG4vLyBBcyBhIHJlc3VsdCwgbWFudWFsbHkgbWFwIGEgY291cGxlIGltcG9ydGFudCB2YWx1ZXMgYmFjayB0byBvdXIgb3duIHN1cHBvcnRlZCBsb2NhbGVzLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL251bWJlci1wbGF5L2lzc3Vlcy8yMzAuXHJcbi8vIFlvdSBjYW4gdGVzdCB0aGF0IHRoaXMgbWFwIGlzIHdvcmtpbmcgd2l0aCBzb21ldGhpbmcgbGlrZSBgJ2VuLUdCJzogJ2VzJ2BcclxuY29uc3Qgdm9pY2VMYW5nVG9TdXBwb3J0ZWRMb2NhbGU6IFJlY29yZDxzdHJpbmcsIExvY2FsZT4gPSB7XHJcbiAgY21uOiAnemhfQ04nLFxyXG4gIHl1ZTogJ3poX0hLJyxcclxuICAneXVlLUhLJzogJ3poX0hLJyxcclxuICB5dWVfSEs6ICd6aF9ISycsXHJcbiAgJ2ZpbC1QSCc6ICd0bCcsIC8vIElTTyA2MzktMSBkb2VzIG5vdCBzdXBwb3J0IGZpbGlwaW5vLCBzbyB0aGlzIGlzIGJldHRlciB0aGFuIG5vdGhpbmcgKHNpbmNlIGl0IGhhcyB0cmFuc2xhdGlvbiBzdXBwb3J0KVxyXG4gIGZpbF9QSDogJ3RsJ1xyXG59O1xyXG5cclxuY29uc3QgVVRURVJBTkNFX09QVElPTl9ERUZBVUxUUzogT3B0aW9uaXplRGVmYXVsdHM8U3BlZWNoU3ludGhlc2lzQW5ub3VuY2VPcHRpb25zPiA9IHtcclxuXHJcbiAgLy8gSWYgdHJ1ZSBhbmQgdGhpcyBVdHRlcmFuY2UgaXMgY3VycmVudGx5IGJlaW5nIHNwb2tlbiBieSB0aGUgc3BlZWNoIHN5bnRoLCBhbm5vdW5jaW5nIGl0XHJcbiAgLy8gdG8gdGhlIHF1ZXVlIGFnYWluIHdpbGwgaW1tZWRpYXRlbHkgY2FuY2VsIHRoZSBzeW50aCBhbmQgbmV3IGNvbnRlbnQgd2lsbCBiZVxyXG4gIC8vIHNwb2tlbi4gT3RoZXJ3aXNlLCBuZXcgY29udGVudCBmb3IgdGhpcyB1dHRlcmFuY2Ugd2lsbCBiZSBzcG9rZW4gd2hlbmV2ZXIgdGhlIG9sZFxyXG4gIC8vIGNvbnRlbnQgaGFzIGZpbmlzaGVkIHNwZWFraW5nLiBVc2VkIHdoZW4gYWRkaW5nIHRoZSBVdHRlcmFuY2UgdG8gYmUgc3Bva2VuLlxyXG4gIGNhbmNlbFNlbGY6IHRydWUsXHJcblxyXG4gIC8vIE9ubHkgYXBwbGllcyB0byB0d28gVXR0ZXJhbmNlcyB3aXRoIHRoZSBzYW1lIHByaW9yaXR5LiBJZiB0cnVlIGFuZCBhbm90aGVyIFV0dGVyYW5jZSBpcyBjdXJyZW50bHlcclxuICAvLyBiZWluZyBzcG9rZW4gYnkgdGhlIHNwZWVjaCBzeW50aCAob3IgcXVldWVkIGJ5IFNwZWVjaFN5bnRoZXNpc0Fubm91bmNlciksIGFubm91bmNpbmcgdGhpcyBVdHRlcmFuY2Ugd2lsbCBpbW1lZGlhdGVseSBjYW5jZWxcclxuICAvLyB0aGUgb3RoZXIgY29udGVudCBiZWluZyBzcG9rZW4gYnkgdGhlIHN5bnRoLiBPdGhlcndpc2UsIGNvbnRlbnQgZm9yIHRoZSBuZXcgdXR0ZXJhbmNlIHdpbGwgYmUgc3Bva2VuIGFzIHNvb24gYXNcclxuICAvLyB0aGUgYnJvd3NlciBmaW5pc2hlcyBzcGVha2luZyB0aGUgdXR0ZXJhbmNlcyBpbiBmcm9udCBvZiBpdCBpbiBsaW5lLiBVc2VkIHdoZW4gYWRkaW5nIHRoZSBVdHRlcmFuY2UgdG8gYmUgc3Bva2VuLlxyXG4gIGNhbmNlbE90aGVyOiB0cnVlLFxyXG5cclxuICAvLyBQcm92aWRlIGEgc3BlY2lmaWMgU3BlZWNoU3ludGhlc2lzVm9pY2UgZm9yIG9ubHkgdGhpcyBVdHRlcmFuY2UsIG9yIGlmIG51bGwgdXNlIHRoZSBBbm5vdW5jZXIncyBnZW5lcmFsXHJcbiAgLy8gdm9pY2VQcm9wZXJ0eSB2YWx1ZS4gVXNlZCB3aGVuIHNwZWFraW5nIHRoZSBVdHRlcmFuY2UuXHJcbiAgdm9pY2U6IG51bGxcclxufTtcclxuXHJcbi8vIE9wdGlvbnMgdG8gdGhlIGluaXRpYWxpemUgZnVuY3Rpb25cclxuZXhwb3J0IHR5cGUgU3BlZWNoU3ludGhlc2lzSW5pdGlhbGl6ZU9wdGlvbnMgPSB7XHJcbiAgc3BlZWNoQWxsb3dlZFByb3BlcnR5PzogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj47XHJcbn07XHJcblxyXG50eXBlIFNlbGZPcHRpb25zID0ge1xyXG5cclxuICAvLyBTd2l0Y2ggdG8gdHJ1ZSB0byBlbmFibGUgZGVidWdnaW5nIGZlYXR1cmVzIChsaWtlIGxvZ2dpbmcpXHJcbiAgZGVidWc/OiBib29sZWFuO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgU3BlZWNoU3ludGhlc2lzQW5ub3VuY2VyT3B0aW9ucyA9IFNlbGZPcHRpb25zICYgQW5ub3VuY2VyT3B0aW9ucztcclxuXHJcbmNsYXNzIFNwZWVjaFN5bnRoZXNpc0Fubm91bmNlciBleHRlbmRzIEFubm91bmNlciB7XHJcbiAgcHVibGljIHJlYWRvbmx5IHZvaWNlUHJvcGVydHk6IFByb3BlcnR5PG51bGwgfCBTcGVlY2hTeW50aGVzaXNWb2ljZT47XHJcblxyXG4gIC8vIGNvbnRyb2xzIHRoZSBzcGVha2luZyByYXRlIG9mIFdlYiBTcGVlY2hcclxuICBwdWJsaWMgcmVhZG9ubHkgdm9pY2VSYXRlUHJvcGVydHk6IE51bWJlclByb3BlcnR5O1xyXG5cclxuICAvLyBjb250cm9scyB0aGUgcGl0Y2ggb2YgdGhlIHN5bnRoXHJcbiAgcHVibGljIHJlYWRvbmx5IHZvaWNlUGl0Y2hQcm9wZXJ0eTogTnVtYmVyUHJvcGVydHk7XHJcblxyXG4gIC8vIENvbnRyb2xzIHZvbHVtZSBvZiB0aGUgc3ludGguIEludGVuZGVkIGZvciB1c2Ugd2l0aCB1bml0IHRlc3RzIG9ubHkhIVxyXG4gIHByaXZhdGUgcmVhZG9ubHkgdm9pY2VWb2x1bWVQcm9wZXJ0eTogTnVtYmVyUHJvcGVydHk7XHJcblxyXG4gIC8vIEluIG1zLCBob3cgbG9uZyB0byBnbyBiZWZvcmUgXCJ3YWtpbmcgdGhlIFNwZWVjaFN5bnRoZXNpc1wiIGVuZ2luZSB0byBrZWVwIHNwZWVjaFxyXG4gIC8vIGZhc3Qgb24gQ2hyb21lYm9va3MsIHNlZSBkb2N1bWVudGF0aW9uIGFyb3VuZCBFTkdJTkVfV0FLRV9JTlRFUlZBTC5cclxuICBwcml2YXRlIHRpbWVTaW5jZVdha2luZ0VuZ2luZTogbnVtYmVyO1xyXG5cclxuICAvLyBJbiBtcywgaG93IGxvbmcgc2luY2Ugd2UgaGF2ZSBhcHBsaWVkIHRoZSBcInBhdXNlL3Jlc3VtZVwiIHdvcmthcm91bmQgZm9yIGxvbmcgdXR0ZXJhbmNlcyBpbiBDaHJvbWl1bS4gVmVyeVxyXG4gIC8vIGxvbmcgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlcyAobG9uZ2VyIHRoYW4gMTUgc2Vjb25kcykgZ2V0IGN1dCBvbiBDaHJvbWl1bSBhbmQgd2UgbmV2ZXIgZ2V0IFwiZW5kXCIgb3IgXCJjYW5jZWxcIlxyXG4gIC8vIGV2ZW50cyBkdWUgdG8gYSBwbGF0Zm9ybSBidWcsIHNlZSBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD02Nzk0MzcuXHJcbiAgcHJpdmF0ZSB0aW1lU2luY2VQYXVzZVJlc3VtZTogbnVtYmVyO1xyXG5cclxuICAvLyBJbiBtcywgaG93IGxvbmcgaXQgaGFzIGJlZW4gc2luY2Ugd2UgcmVxdWVzdGVkIHNwZWVjaCBvZiBhIG5ldyB1dHRlcmFuY2UgYW5kIHdoZW5cclxuICAvLyB0aGUgc3ludGggaGFzIHN1Y2Nlc3NmdWxseSBzdGFydGVkIHNwZWFraW5nIGl0LiBJdCBpcyBwb3NzaWJsZSB0aGF0IHRoZSBzeW50aCB3aWxsIGZhaWwgdG8gc3BlYWsgc28gaWZcclxuICAvLyB0aGlzIHRpbWVyIGdldHMgdG9vIGhpZ2ggd2UgaGFuZGxlIHRoZSBmYWlsdXJlIGNhc2UuXHJcbiAgcHJpdmF0ZSB0aW1lU2luY2VQZW5kaW5nVXR0ZXJhbmNlOiBudW1iZXI7XHJcblxyXG4gIC8vIEFtb3VudCBvZiB0aW1lIGluIG1zIHRvIHdhaXQgYmV0d2VlbiBzcGVha2luZyBTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VzLCBzZWVcclxuICAvLyBWT0lDSU5HX1VUVEVSQU5DRV9JTlRFUlZBTCBmb3IgZGV0YWlscyBhYm91dCB3aHkgdGhpcyBpcyBuZWNlc3NhcnkuIEluaXRpYWxpemVkIHRvIHRoZSBpbnRlcnZhbCB2YWx1ZVxyXG4gIC8vIHNvIHRoYXQgd2UgY2FuIHNwZWFrIGluc3RhbnRseSB0aGUgZmlyc3QgdGltZS5cclxuICBwcml2YXRlIHRpbWVTaW5jZVV0dGVyYW5jZUVuZDogbnVtYmVyO1xyXG5cclxuICAvLyBlbWl0cyBldmVudHMgd2hlbiB0aGUgc3BlYWtlciBzdGFydHMvc3RvcHMgc3BlYWtpbmcsIHdpdGggdGhlIFV0dGVyYW5jZSB0aGF0IGlzXHJcbiAgLy8gZWl0aGVyIHN0YXJ0aW5nIG9yIHN0b3BwaW5nXHJcbiAgcHVibGljIHJlYWRvbmx5IHN0YXJ0U3BlYWtpbmdFbWl0dGVyOiBURW1pdHRlcjxbIFJlc29sdmVkUmVzcG9uc2UsIFV0dGVyYW5jZSBdPjtcclxuICBwdWJsaWMgcmVhZG9ubHkgZW5kU3BlYWtpbmdFbWl0dGVyOiBURW1pdHRlcjxbIFJlc29sdmVkUmVzcG9uc2UsIFV0dGVyYW5jZSBdPjtcclxuXHJcbiAgLy8gVG8gZ2V0IGFyb3VuZCBtdWx0aXBsZSBpbmhlcml0YW5jZSBpc3N1ZXMsIGNyZWF0ZSBlbmFibGVkUHJvcGVydHkgdmlhIGNvbXBvc2l0aW9uIGluc3RlYWQsIHRoZW4gY3JlYXRlXHJcbiAgLy8gYSByZWZlcmVuY2Ugb24gdGhpcyBjb21wb25lbnQgZm9yIHRoZSBlbmFibGVkUHJvcGVydHlcclxuICBwcml2YXRlIGVuYWJsZWRDb21wb25lbnRJbXBsZW1lbnRhdGlvbjogRW5hYmxlZENvbXBvbmVudDtcclxuICBwdWJsaWMgcmVhZG9ubHkgZW5hYmxlZFByb3BlcnR5OiBUUHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8vIENvbnRyb2xzIHdoZXRoZXIgVm9pY2luZyBpcyBlbmFibGVkIGluIGEgXCJtYWluIHdpbmRvd1wiIGFyZWEgb2YgdGhlIGFwcGxpY2F0aW9uLlxyXG4gIC8vIFRoaXMgc3VwcG9ydHMgdGhlIGFiaWxpdHkgdG8gZGlzYWJsZSBWb2ljaW5nIGZvciB0aGUgaW1wb3J0YW50IHNjcmVlbiBjb250ZW50IG9mIHlvdXIgYXBwbGljYXRpb24gd2hpbGUga2VlcGluZ1xyXG4gIC8vIFZvaWNpbmcgZm9yIHN1cnJvdW5kaW5nIFVJIGNvbXBvbmVudHMgZW5hYmxlZCAoZm9yIGV4YW1wbGUpLlxyXG4gIHB1YmxpYyByZWFkb25seSBtYWluV2luZG93Vm9pY2luZ0VuYWJsZWRQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8vIFByb3BlcnR5IHRoYXQgaW5kaWNhdGVzIHRoYXQgdGhlIFZvaWNpbmcgZmVhdHVyZSBpcyBlbmFibGVkIGZvciBhbGwgYXJlYXMgb2YgdGhlIGFwcGxpY2F0aW9uLlxyXG4gIHB1YmxpYyB2b2ljaW5nRnVsbHlFbmFibGVkUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+O1xyXG5cclxuICAvLyBJbmRpY2F0ZXMgd2hldGhlciBzcGVlY2ggaXMgZnVsbHkgZW5hYmxlZCBBTkQgc3BlZWNoIGlzIGFsbG93ZWQsIGFzIHNwZWNpZmllZFxyXG4gIC8vIGJ5IHRoZSBQcm9wZXJ0eSBwcm92aWRlZCBpbiBpbml0aWFsaXplKCkuIFNlZSBzcGVlY2hBbGxvd2VkUHJvcGVydHkgb2YgaW5pdGlhbGl6ZSgpLiBJbiBvcmRlciBmb3IgdGhpcyBQcm9wZXJ0eVxyXG4gIC8vIHRvIGJlIHRydWUsIHNwZWVjaEFsbG93ZWRQcm9wZXJ0eSwgZW5hYmxlZFByb3BlcnR5LCBhbmQgbWFpbldpbmRvd1ZvaWNpbmdFbmFibGVkUHJvcGVydHkgbXVzdCBhbGwgYmUgdHJ1ZS5cclxuICAvLyBJbml0aWFsaXplZCBpbiB0aGUgY29uc3RydWN0b3IgYmVjYXVzZSB3ZSBkb24ndCBoYXZlIGFjY2VzcyB0byBhbGwgdGhlIGRlcGVuZGVuY3kgUHJvcGVydGllcyB1bnRpbCBpbml0aWFsaXplLlxyXG4gIC8vIFRoZXNlIHR3byB2YXJpYWJsZSBrZWVwIGEgcHVibGljLCByZWFkb25seSBpbnRlcmZhY2UuIFdlIGNhbm5vdCB1c2UgYSBEZXJpdmVkUHJvcGVydHkgYmVjYXVzZSBpdCBuZWVkcyB0byBiZVxyXG4gIC8vIGxpc3RlbmVkIHRvIGJlZm9yZSBpdHMgZGVwZW5kZW5jaWVzIGFyZSBjcmVhdGVkLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3V0dGVyYW5jZS1xdWV1ZS9pc3N1ZXMvNzJcclxuICBwdWJsaWMgcmVhZG9ubHkgc3BlZWNoQWxsb3dlZEFuZEZ1bGx5RW5hYmxlZFByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuPjtcclxuICBwcml2YXRlIHJlYWRvbmx5IF9zcGVlY2hBbGxvd2VkQW5kRnVsbHlFbmFibGVkUHJvcGVydHk6IFRQcm9wZXJ0eTxib29sZWFuPjtcclxuXHJcbiAgLy8gc3ludGggZnJvbSBXZWIgU3BlZWNoIEFQSSB0aGF0IGRyaXZlcyBzcGVlY2gsIGRlZmluZWQgb24gaW5pdGlhbGl6ZVxyXG4gIHByaXZhdGUgc3ludGg6IG51bGwgfCBTcGVlY2hTeW50aGVzaXM7XHJcblxyXG4gIC8vIHBvc3NpYmxlIHZvaWNlcyBmb3IgV2ViIFNwZWVjaCBzeW50aGVzaXNcclxuICBwdWJsaWMgdm9pY2VzUHJvcGVydHk6IFRQcm9wZXJ0eTxTcGVlY2hTeW50aGVzaXNWb2ljZVtdPjtcclxuXHJcbiAgLy8gSG9sZHMgYSByZWZlcmVuY2UgdG8gdGhlIFV0dGVyYW5jZSB0aGF0IGlzIGFjdGl2ZWx5IGJlaW5nIHNwb2tlbiBieSB0aGUgYW5ub3VuY2VyLiBOb3RlIHRoYXQgZGVwZW5kaW5nXHJcbiAgLy8gb24gdGhlIHBsYXRmb3JtLCB0aGVyZSBtYXkgYmUgYSBkZWxheSBiZXR3ZWVuIHRoZSBzcGVhaygpIHJlcXVlc3QgYW5kIHdoZW4gdGhlIHN5bnRoIGFjdHVhbGx5IHN0YXJ0cyBzcGVha2luZy5cclxuICAvLyBLZWVwaW5nIGEgcmVmZXJlbmNlIHN1cHBvcnRzIGNhbmNlbGxpbmcsIHByaW9yaXR5IGNoYW5nZXMsIGFuZCBjbGVhbmluZyB3aGVuIGZpbmlzaGVkIHNwZWFraW5nLlxyXG4gIHByaXZhdGUgc3BlYWtpbmdTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VXcmFwcGVyOiBTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VXcmFwcGVyIHwgbnVsbDtcclxuXHJcbiAgLy8gaXMgdGhlIFZvaWNpbmdNYW5hZ2VyIGluaXRpYWxpemVkIGZvciB1c2U/IFRoaXMgaXMgcHJvdG90eXBhbCBzbyBpdCBpc24ndCBhbHdheXMgaW5pdGlhbGl6ZWRcclxuICBwdWJsaWMgaXNJbml0aWFsaXplZFByb3BlcnR5OiBUUHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8vIENvbnRyb2xzIHdoZXRoZXIgc3BlZWNoIGlzIGFsbG93ZWQgd2l0aCBzeW50aGVzaXMuIE51bGwgdW50aWwgaW5pdGlhbGl6ZWQsIGFuZCBjYW4gYmUgc2V0IGJ5IG9wdGlvbnMgdG9cclxuICAvLyBpbml0aWFsaXplKCkuXHJcbiAgcHJpdmF0ZSBjYW5TcGVha1Byb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuPiB8IG51bGw7XHJcblxyXG4gIC8vIGJvdW5kIHNvIHdlIGNhbiBsaW5rIGFuZCB1bmxpbmsgdG8gdGhpcy5jYW5TcGVha1Byb3BlcnR5IHdoZW4gdGhlIFNwZWVjaFN5bnRoZXNpc0Fubm91bmNlciBiZWNvbWVzIGluaXRpYWxpemVkLlxyXG4gIHByaXZhdGUgcmVhZG9ubHkgYm91bmRIYW5kbGVDYW5TcGVha0NoYW5nZTogKCBjYW5TcGVhazogYm9vbGVhbiApID0+IHZvaWQ7XHJcblxyXG4gIC8vIEEgbGlzdGVuZXIgdGhhdCB3aWxsIGNhbmNlbCB0aGUgVXR0ZXJhbmNlIHRoYXQgaXMgYmVpbmcgYW5ub3VuY2VkIGlmIGl0cyBjYW5Bbm5vdW5jZVByb3BlcnR5IGJlY29tZXMgZmFsc2UuXHJcbiAgLy8gU2V0IHdoZW4gdGhpcyBBbm5vdW5jZXIgYmVnaW5zIHRvIGFubm91bmNlIGEgbmV3IFV0dGVyYW5jZSBhbmQgY2xlYXJlZCB3aGVuIHRoZSBVdHRlcmFuY2UgaXMgZmluaXNoZWQvY2FuY2VsbGVkLlxyXG4gIC8vIEJvdW5kIHNvIHRoYXQgdGhlIGxpc3RlbmVyIGNhbiBiZSBhZGRlZCBhbmQgcmVtb3ZlZCBvbiBVdHRlcmFuY2VzIHdpdGhvdXQgY3JlYXRpbmcgbWFueSBjbG9zdXJlcy5cclxuICBwcml2YXRlIHJlYWRvbmx5IGJvdW5kSGFuZGxlQ2FuQW5ub3VuY2VDaGFuZ2U6ICggY2FuQW5ub3VuY2U6IGJvb2xlYW4gKSA9PiB2b2lkO1xyXG5cclxuICAvLyBTd2l0Y2ggdG8gdHJ1ZSB0byBlbmFibGUgZGVidWdnaW5nIGZlYXR1cmVzIChsaWtlIGxvZ2dpbmcpXHJcbiAgcHJpdmF0ZSByZWFkb25seSBkZWJ1ZzogYm9vbGVhbjtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBwcm92aWRlZE9wdGlvbnM/OiBTcGVlY2hTeW50aGVzaXNBbm5vdW5jZXJPcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8U3BlZWNoU3ludGhlc2lzQW5ub3VuY2VyT3B0aW9ucywgU2VsZk9wdGlvbnMsIEFubm91bmNlck9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgIC8vIHtib29sZWFufSAtIFNwZWVjaFN5bnRoZXNpc0Fubm91bmNlciBnZW5lcmFsbHkgZG9lc24ndCBjYXJlIGFib3V0IFJlc3BvbnNlQ29sbGVjdG9yUHJvcGVydGllcyxcclxuICAgICAgLy8gdGhhdCBpcyBtb3JlIHNwZWNpZmljIHRvIHRoZSBWb2ljaW5nIGZlYXR1cmUuXHJcbiAgICAgIHJlc3BlY3RSZXNwb25zZUNvbGxlY3RvclByb3BlcnRpZXM6IGZhbHNlLFxyXG5cclxuICAgICAgZGVidWc6IGZhbHNlXHJcbiAgICB9LCBwcm92aWRlZE9wdGlvbnMgKTtcclxuXHJcbiAgICBzdXBlciggb3B0aW9ucyApO1xyXG5cclxuICAgIHRoaXMuZGVidWcgPSBvcHRpb25zLmRlYnVnO1xyXG5cclxuICAgIHRoaXMudm9pY2VQcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eTxudWxsIHwgU3BlZWNoU3ludGhlc2lzVm9pY2U+KCBudWxsLCB7XHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0/LmNyZWF0ZVRhbmRlbSggJ3ZvaWNlUHJvcGVydHknICksXHJcbiAgICAgIHBoZXRpb1ZhbHVlVHlwZTogTnVsbGFibGVJTyggU3BlZWNoU3ludGhlc2lzVm9pY2VJTyApLFxyXG4gICAgICBwaGV0aW9TdGF0ZTogZmFsc2UsXHJcbiAgICAgIHBoZXRpb1JlYWRPbmx5OiB0cnVlLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAndGhlIHZvaWNlIHRoYXQgaXMgY3VycmVudGx5IHZvaWNpbmcgcmVzcG9uc2VzJ1xyXG4gICAgfSApO1xyXG4gICAgdGhpcy52b2ljZVJhdGVQcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggMS4wLCB7XHJcbiAgICAgIHJhbmdlOiBuZXcgUmFuZ2UoIDAuNzUsIDIgKSxcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbT8uY3JlYXRlVGFuZGVtKCAndm9pY2VSYXRlUHJvcGVydHknICksXHJcbiAgICAgIHBoZXRpb1N0YXRlOiBmYWxzZSxcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ2NoYW5nZXMgdGhlIHJhdGUgb2YgdGhlIHZvaWNpbmctZmVhdHVyZSB2b2ljZSdcclxuICAgIH0gKTtcclxuICAgIHRoaXMudm9pY2VQaXRjaFByb3BlcnR5ID0gbmV3IE51bWJlclByb3BlcnR5KCAxLjAsIHtcclxuICAgICAgcmFuZ2U6IG5ldyBSYW5nZSggMC41LCAyICksXHJcbiAgICAgIHRhbmRlbTogb3B0aW9ucy50YW5kZW0/LmNyZWF0ZVRhbmRlbSggJ3ZvaWNlUGl0Y2hQcm9wZXJ0eScgKSxcclxuICAgICAgcGhldGlvU3RhdGU6IGZhbHNlLFxyXG4gICAgICBwaGV0aW9Eb2N1bWVudGF0aW9uOiAnY2hhbmdlcyB0aGUgcGl0Y2ggb2YgdGhlIHZvaWNpbmctZmVhdHVyZSB2b2ljZSdcclxuICAgIH0gKTtcclxuICAgIHRoaXMudm9pY2VWb2x1bWVQcm9wZXJ0eSA9IG5ldyBOdW1iZXJQcm9wZXJ0eSggMS4wLCB7XHJcbiAgICAgIHJhbmdlOiBuZXcgUmFuZ2UoIDAsIDEgKVxyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIEluZGljYXRlcyB3aGV0aGVyIHNwZWVjaCB1c2luZyBTcGVlY2hTeW50aGVzaXMgaGFzIGJlZW4gcmVxdWVzdGVkIGF0IGxlYXN0IG9uY2UuXHJcbiAgICAvLyBUaGUgZmlyc3QgdGltZSBzcGVlY2ggaXMgcmVxdWVzdGVkLCBpdCBtdXN0IGJlIGRvbmUgc3luY2hyb25vdXNseSBmcm9tIHVzZXIgaW5wdXQgd2l0aCBhYnNvbHV0ZWx5IG5vIGRlbGF5LlxyXG4gICAgLy8gcmVxdWVzdFNwZWVjaCgpIGdlbmVyYWxseSB1c2VzIGEgdGltZW91dCB0byB3b3JrYXJvdW5kIGJyb3dzZXIgYnVncywgYnV0IHRob3NlIGNhbm5vdCBiZSB1c2VkIHVudGlsIGFmdGVyIHRoZVxyXG4gICAgLy8gZmlyc3QgcmVxdWVzdCBmb3Igc3BlZWNoLlxyXG4gICAgdGhpcy5oYXNTcG9rZW4gPSBmYWxzZTtcclxuXHJcbiAgICB0aGlzLnRpbWVTaW5jZVdha2luZ0VuZ2luZSA9IDA7XHJcbiAgICB0aGlzLnRpbWVTaW5jZVBhdXNlUmVzdW1lID0gMDtcclxuXHJcbiAgICB0aGlzLnRpbWVTaW5jZVBlbmRpbmdVdHRlcmFuY2UgPSAwO1xyXG5cclxuICAgIHRoaXMudGltZVNpbmNlVXR0ZXJhbmNlRW5kID0gVk9JQ0lOR19VVFRFUkFOQ0VfSU5URVJWQUw7XHJcblxyXG4gICAgdGhpcy5zdGFydFNwZWFraW5nRW1pdHRlciA9IG5ldyBFbWl0dGVyKCB7IHBhcmFtZXRlcnM6IFsgeyB2YWx1ZVR5cGU6ICdzdHJpbmcnIH0sIHsgdmFsdWVUeXBlOiBVdHRlcmFuY2UgfSBdIH0gKTtcclxuICAgIHRoaXMuZW5kU3BlYWtpbmdFbWl0dGVyID0gbmV3IEVtaXR0ZXIoIHsgcGFyYW1ldGVyczogWyB7IHZhbHVlVHlwZTogJ3N0cmluZycgfSwgeyB2YWx1ZVR5cGU6IFV0dGVyYW5jZSB9IF0gfSApO1xyXG5cclxuICAgIHRoaXMuZW5hYmxlZENvbXBvbmVudEltcGxlbWVudGF0aW9uID0gbmV3IEVuYWJsZWRDb21wb25lbnQoIHtcclxuXHJcbiAgICAgIC8vIGluaXRpYWwgdmFsdWUgZm9yIHRoZSBlbmFibGVkUHJvcGVydHksIGZhbHNlIGJlY2F1c2Ugc3BlZWNoIHNob3VsZCBub3QgaGFwcGVuIHVudGlsIHJlcXVlc3RlZCBieSB1c2VyXHJcbiAgICAgIGVuYWJsZWQ6IGZhbHNlLFxyXG5cclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbSxcclxuICAgICAgZW5hYmxlZFByb3BlcnR5T3B0aW9uczoge1xyXG4gICAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICd0b2dnbGVzIHRoaXMgY29udHJvbGxlciBvZiBTcGVlY2hTeW50aGVzaXMgb24gYW5kIG9mZicsXHJcbiAgICAgICAgcGhldGlvU3RhdGU6IGZhbHNlLFxyXG4gICAgICAgIHBoZXRpb0ZlYXR1cmVkOiBmYWxzZVxyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5lbmFibGVkQ29tcG9uZW50SW1wbGVtZW50YXRpb24uZW5hYmxlZFByb3BlcnR5LmlzU2V0dGFibGUoKSwgJ2VuYWJsZWRQcm9wZXJ0eSBtdXN0IGJlIHNldHRhYmxlJyApO1xyXG4gICAgdGhpcy5lbmFibGVkUHJvcGVydHkgPSB0aGlzLmVuYWJsZWRDb21wb25lbnRJbXBsZW1lbnRhdGlvbi5lbmFibGVkUHJvcGVydHk7XHJcblxyXG4gICAgdGhpcy5tYWluV2luZG93Vm9pY2luZ0VuYWJsZWRQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIHRydWUsIHtcclxuICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbT8uY3JlYXRlVGFuZGVtKCAnbWFpbldpbmRvd1ZvaWNpbmdFbmFibGVkUHJvcGVydHknICksXHJcbiAgICAgIHBoZXRpb1N0YXRlOiBmYWxzZSxcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ3RvZ2dsZXMgdGhlIHZvaWNpbmcgZmVhdHVyZSBvbiBhbmQgb2ZmIGZvciB0aGUgc2ltdWxhdGlvbiBzY3JlZW4gKG5vdCB0aGUgdm9pY2luZyBwcmVmZXJlbmNlcyBhbmQgdG9vbGJhciBjb250cm9scyknXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy52b2ljaW5nRnVsbHlFbmFibGVkUHJvcGVydHkgPSBEZXJpdmVkUHJvcGVydHkuYW5kKCBbIHRoaXMuZW5hYmxlZFByb3BlcnR5LCB0aGlzLm1haW5XaW5kb3dWb2ljaW5nRW5hYmxlZFByb3BlcnR5IF0gKTtcclxuXHJcbiAgICB0aGlzLl9zcGVlY2hBbGxvd2VkQW5kRnVsbHlFbmFibGVkUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCBmYWxzZSApO1xyXG4gICAgdGhpcy5zcGVlY2hBbGxvd2VkQW5kRnVsbHlFbmFibGVkUHJvcGVydHkgPSB0aGlzLl9zcGVlY2hBbGxvd2VkQW5kRnVsbHlFbmFibGVkUHJvcGVydHk7XHJcblxyXG4gICAgdGhpcy5zeW50aCA9IG51bGw7XHJcbiAgICB0aGlzLnZvaWNlc1Byb3BlcnR5ID0gbmV3IFByb3BlcnR5KCBbXSApO1xyXG5cclxuICAgIHRoaXMuc3BlYWtpbmdTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VXcmFwcGVyID0gbnVsbDtcclxuICAgIHRoaXMuaXNJbml0aWFsaXplZFByb3BlcnR5ID0gbmV3IEJvb2xlYW5Qcm9wZXJ0eSggZmFsc2UgKTtcclxuICAgIHRoaXMuY2FuU3BlYWtQcm9wZXJ0eSA9IG51bGw7XHJcbiAgICB0aGlzLmJvdW5kSGFuZGxlQ2FuU3BlYWtDaGFuZ2UgPSB0aGlzLmhhbmRsZUNhblNwZWFrQ2hhbmdlLmJpbmQoIHRoaXMgKTtcclxuICAgIHRoaXMuYm91bmRIYW5kbGVDYW5Bbm5vdW5jZUNoYW5nZSA9IHRoaXMuaGFuZGxlQ2FuQW5ub3VuY2VDaGFuZ2UuYmluZCggdGhpcyApO1xyXG5cclxuICAgIGlmICggdGhpcy5kZWJ1ZyApIHtcclxuICAgICAgdGhpcy5hbm5vdW5jZW1lbnRDb21wbGV0ZUVtaXR0ZXIuYWRkTGlzdGVuZXIoICggdXR0ZXJhbmNlLCBzdHJpbmcgKSA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coICdhbm5vdW5jZW1lbnQgY29tcGxldGUnLCBzdHJpbmcgKTtcclxuICAgICAgfSApO1xyXG4gICAgICB0aGlzLnN0YXJ0U3BlYWtpbmdFbWl0dGVyLmFkZExpc3RlbmVyKCBzdHJpbmcgPT4ge1xyXG4gICAgICAgIHRoaXMuZGVidWcgJiYgY29uc29sZS5sb2coICdzdGFydFNwZWFraW5nTGlzdGVuZXInLCBzdHJpbmcgKTtcclxuICAgICAgfSApO1xyXG4gICAgICB0aGlzLmVuZFNwZWFraW5nRW1pdHRlci5hZGRMaXN0ZW5lciggc3RyaW5nID0+IHtcclxuICAgICAgICB0aGlzLmRlYnVnICYmIGNvbnNvbGUubG9nKCAnZW5kU3BlYWtpbmdMaXN0ZW5lcicsIHN0cmluZyApO1xyXG4gICAgICB9ICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IGluaXRpYWxpemVkKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuaXNJbml0aWFsaXplZFByb3BlcnR5LnZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5kaWNhdGUgdGhhdCB0aGUgU3BlZWNoU3ludGhlc2lzQW5ub3VuY2VyIGlzIHJlYWR5IGZvciB1c2UsIGFuZCBhdHRlbXB0IHRvIHBvcHVsYXRlIHZvaWNlcyAoaWYgdGhleSBhcmUgcmVhZHkgeWV0KS4gQWRkc1xyXG4gICAqIGxpc3RlbmVycyB0aGF0IGNvbnRyb2wgc3BlZWNoLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHVzZXJHZXN0dXJlRW1pdHRlciAtIEVtaXRzIHdoZW4gdXNlciBpbnB1dCBoYXBwZW5zLCB3aGljaCBpcyByZXF1aXJlZCBiZWZvcmUgdGhlIGJyb3dzZXIgaXNcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93ZWQgdG8gdXNlIFNwZWVjaFN5bnRoZXNpcyBmb3IgdGhlIGZpcnN0IHRpbWUuXHJcbiAgICogQHBhcmFtIFtwcm92aWRlZE9wdGlvbnNdXHJcbiAgICovXHJcbiAgcHVibGljIGluaXRpYWxpemUoIHVzZXJHZXN0dXJlRW1pdHRlcjogVFJlYWRPbmx5RW1pdHRlciwgcHJvdmlkZWRPcHRpb25zPzogU3BlZWNoU3ludGhlc2lzSW5pdGlhbGl6ZU9wdGlvbnMgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhdGhpcy5pbml0aWFsaXplZCwgJ2NhbiBvbmx5IGJlIGluaXRpYWxpemVkIG9uY2UnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBTcGVlY2hTeW50aGVzaXNBbm5vdW5jZXIuaXNTcGVlY2hTeW50aGVzaXNTdXBwb3J0ZWQoKSwgJ3RyeWluZyB0byBpbml0aWFsaXplIHNwZWVjaCwgYnV0IHNwZWVjaCBpcyBub3Qgc3VwcG9ydGVkIG9uIHRoaXMgcGxhdGZvcm0uJyApO1xyXG5cclxuICAgIC8vIFNlZSB0b3AgbGV2ZWwgdHlwZSBkb2N1bWVudGF0aW9uLlxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggaW5pdGlhbGl6ZUNvdW50ID09PSAwLCAnT25seSBvbmUgaW5zdGFuY2Ugb2YgU3BlZWNoU3ludGhlc2lzQW5ub3VuY2VyIGNhbiBiZSBpbml0aWFsaXplZCBhdCBhIHRpbWUuJyApO1xyXG4gICAgaW5pdGlhbGl6ZUNvdW50Kys7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbml6ZTxTcGVlY2hTeW50aGVzaXNJbml0aWFsaXplT3B0aW9ucz4oKSgge1xyXG5cclxuICAgICAgLy8ge0Jvb2xlYW5Qcm9wZXJ0eXxEZXJpdmVkUHJvcGVydHkuPGJvb2xlYW4+fSAtIENvbnRyb2xzIHdoZXRoZXIgc3BlZWNoIGlzIGFsbG93ZWQgd2l0aCBzcGVlY2ggc3ludGhlc2lzLlxyXG4gICAgICAvLyBDb21iaW5lZCBpbnRvIGFub3RoZXIgRGVyaXZlZFByb3BlcnR5IHdpdGggdGhpcy5lbmFibGVkUHJvcGVydHkgc28geW91IGRvbid0IGhhdmUgdG8gdXNlIHRoYXQgYXMgb25lXHJcbiAgICAgIC8vIG9mIHRoZSBQcm9wZXJ0aWVzIHRoYXQgZGVyaXZlIHNwZWVjaEFsbG93ZWRQcm9wZXJ0eSwgaWYgeW91IGFyZSBwYXNzaW5nIGluIGEgRGVyaXZlZFByb3BlcnR5LlxyXG4gICAgICBzcGVlY2hBbGxvd2VkUHJvcGVydHk6IG5ldyBCb29sZWFuUHJvcGVydHkoIHRydWUgKVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy5zeW50aCA9IHdpbmRvdy5zcGVlY2hTeW50aGVzaXM7XHJcblxyXG4gICAgLy8gd2hldGhlciB0aGUgb3B0aW9uYWwgUHJvcGVydHkgaW5kaWNhdGluZyBzcGVlY2ggaXMgYWxsb3dlZCBhbmQgdGhlIFNwZWVjaFN5bnRoZXNpc0Fubm91bmNlciBpcyBlbmFibGVkXHJcbiAgICB0aGlzLmNhblNwZWFrUHJvcGVydHkgPSBEZXJpdmVkUHJvcGVydHkuYW5kKCBbIG9wdGlvbnMuc3BlZWNoQWxsb3dlZFByb3BlcnR5LCB0aGlzLmVuYWJsZWRQcm9wZXJ0eSBdICk7XHJcbiAgICB0aGlzLmNhblNwZWFrUHJvcGVydHkubGluayggdGhpcy5ib3VuZEhhbmRsZUNhblNwZWFrQ2hhbmdlICk7XHJcblxyXG4gICAgLy8gU2V0IHRoZSBzcGVlY2hBbGxvd2VkQW5kRnVsbHlFbmFibGVkUHJvcGVydHkgd2hlbiBkZXBlbmRlbmN5IFByb3BlcnRpZXMgdXBkYXRlXHJcbiAgICBNdWx0aWxpbmsubXVsdGlsaW5rKFxyXG4gICAgICBbIG9wdGlvbnMuc3BlZWNoQWxsb3dlZFByb3BlcnR5LCB0aGlzLnZvaWNpbmdGdWxseUVuYWJsZWRQcm9wZXJ0eSBdLFxyXG4gICAgICAoIHNwZWVjaEFsbG93ZWQsIHZvaWNpbmdGdWxseUVuYWJsZWQgKSA9PiB7XHJcbiAgICAgICAgdGhpcy5fc3BlZWNoQWxsb3dlZEFuZEZ1bGx5RW5hYmxlZFByb3BlcnR5LnZhbHVlID0gc3BlZWNoQWxsb3dlZCAmJiB2b2ljaW5nRnVsbHlFbmFibGVkO1xyXG4gICAgICB9ICk7XHJcblxyXG4gICAgLy8gYnJvd3NlcnMgdGVuZCB0byBnZW5lcmF0ZSB0aGUgbGlzdCBvZiB2b2ljZXMgbGF6aWx5LCBzbyB0aGUgbGlzdCBvZiB2b2ljZXMgbWF5IGJlIGVtcHR5IHVudGlsIHNwZWVjaCBpcyBmaXJzdFxyXG4gICAgLy8gcmVxdWVzdGVkLiBTb21lIGJyb3dzZXJzIGRvbid0IGhhdmUgYW4gYWRkRXZlbnRMaXN0ZW5lciBmdW5jdGlvbiBvbiBzcGVlY2hTeW50aGVzaXMgc28gY2hlY2sgdG8gc2VlIGlmIGl0IGV4aXN0c1xyXG4gICAgLy8gYmVmb3JlIHRyeWluZyB0byBjYWxsIGl0LlxyXG4gICAgY29uc3Qgc3ludGggPSB0aGlzLmdldFN5bnRoKCkhO1xyXG4gICAgc3ludGguYWRkRXZlbnRMaXN0ZW5lciAmJiBzeW50aC5hZGRFdmVudExpc3RlbmVyKCAndm9pY2VzY2hhbmdlZCcsICgpID0+IHtcclxuICAgICAgdGhpcy5wb3B1bGF0ZVZvaWNlcygpO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIHRyeSB0byBwb3B1bGF0ZSB2b2ljZXMgaW1tZWRpYXRlbHkgaW4gY2FzZSB0aGUgYnJvd3NlciBwb3B1bGF0ZXMgdGhlbSBlYWdlcmx5IGFuZCB3ZSBuZXZlciBnZXQgYW5cclxuICAgIC8vIG9udm9pY2VzY2hhbmdlZCBldmVudFxyXG4gICAgdGhpcy5wb3B1bGF0ZVZvaWNlcygpO1xyXG5cclxuICAgIC8vIFRvIGdldCBWb2ljaW5nIHRvIGhhcHBlbiBxdWlja2x5IG9uIENocm9tZWJvb2tzIHdlIHNldCB0aGUgY291bnRlciB0byBhIHZhbHVlIHRoYXQgd2lsbCB0cmlnZ2VyIHRoZSBcImVuZ2luZVxyXG4gICAgLy8gd2FrZVwiIGludGVydmFsIG9uIHRoZSBuZXh0IGFuaW1hdGlvbiBmcmFtZSB0aGUgZmlyc3QgdGltZSB3ZSBnZXQgYSB1c2VyIGdlc3R1cmUuIFNlZSBFTkdJTkVfV0FLRV9JTlRFUlZBTFxyXG4gICAgLy8gZm9yIG1vcmUgaW5mb3JtYXRpb24gYWJvdXQgdGhpcyB3b3JrYXJvdW5kLlxyXG4gICAgY29uc3Qgc3RhcnRFbmdpbmVMaXN0ZW5lciA9ICgpID0+IHtcclxuICAgICAgdGhpcy50aW1lU2luY2VXYWtpbmdFbmdpbmUgPSBFTkdJTkVfV0FLRV9JTlRFUlZBTDtcclxuXHJcbiAgICAgIC8vIERpc3BsYXkgaXMgb24gdGhlIG5hbWVzcGFjZSBidXQgY2Fubm90IGJlIGltcG9ydGVkIGR1ZSB0byBjaXJjdWxhciBkZXBlbmRlbmNpZXNcclxuICAgICAgdXNlckdlc3R1cmVFbWl0dGVyLnJlbW92ZUxpc3RlbmVyKCBzdGFydEVuZ2luZUxpc3RlbmVyICk7XHJcbiAgICB9O1xyXG4gICAgdXNlckdlc3R1cmVFbWl0dGVyLmFkZExpc3RlbmVyKCBzdGFydEVuZ2luZUxpc3RlbmVyICk7XHJcblxyXG4gICAgLy8gbGlzdGVuZXIgZm9yIHRpbWluZyB2YXJpYWJsZXNcclxuICAgIHN0ZXBUaW1lci5hZGRMaXN0ZW5lciggdGhpcy5zdGVwLmJpbmQoIHRoaXMgKSApO1xyXG5cclxuICAgIHRoaXMuaXNJbml0aWFsaXplZFByb3BlcnR5LnZhbHVlID0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBkdCAtIGluIHNlY29uZHMgZnJvbSBzdGVwVGltZXJcclxuICAgKi9cclxuICBwcml2YXRlIHN0ZXAoIGR0OiBudW1iZXIgKTogdm9pZCB7XHJcblxyXG4gICAgLy8gY29udmVydCB0byBtc1xyXG4gICAgZHQgKj0gMTAwMDtcclxuXHJcbiAgICAvLyBpZiBpbml0aWFsaXplZCwgdGhpcyBtZWFucyB3ZSBoYXZlIGEgc3ludGguXHJcbiAgICBjb25zdCBzeW50aCA9IHRoaXMuZ2V0U3ludGgoKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuaW5pdGlhbGl6ZWQgJiYgc3ludGggKSB7XHJcblxyXG4gICAgICAvLyBJZiB3ZSBoYXZlbid0IHNwb2tlbiB5ZXQsIGtlZXAgY2hlY2tpbmcgdGhlIHN5bnRoIHRvIGRldGVybWluZSB3aGVuIHRoZXJlIGhhcyBiZWVuIGEgc3VjY2Vzc2Z1bCB1c2FnZVxyXG4gICAgICAvLyBvZiBTcGVlY2hTeW50aGVzaXMuIE5vdGUgdGhpcyB3aWxsIGJlIHRydWUgaWYgQU5ZIFNwZWVjaFN5bnRoZXNpc0Fubm91bmNlciBoYXMgc3VjY2Vzc2Z1bCBzcGVlY2ggKG5vdCBqdXN0XHJcbiAgICAgIC8vIHRoaXMgaW5zdGFuY2UpLlxyXG4gICAgICBpZiAoICF0aGlzLmhhc1Nwb2tlbiApIHtcclxuICAgICAgICB0aGlzLmhhc1Nwb2tlbiA9IHN5bnRoLnNwZWFraW5nO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJbmNyZW1lbnQgdGhlIGFtb3VudCBvZiB0aW1lIHNpbmNlIHRoZSBzeW50aCBoYXMgc3RvcHBlZCBzcGVha2luZyB0aGUgcHJldmlvdXMgdXR0ZXJhbmNlLCBidXQgZG9uJ3RcclxuICAgICAgLy8gc3RhcnQgY291bnRpbmcgdXAgdW50aWwgdGhlIHN5bnRoIGhhcyBmaW5pc2hlZCBzcGVha2luZyBpdHMgY3VycmVudCB1dHRlcmFuY2UuXHJcbiAgICAgIHRoaXMudGltZVNpbmNlVXR0ZXJhbmNlRW5kID0gc3ludGguc3BlYWtpbmcgPyAwIDogdGhpcy50aW1lU2luY2VVdHRlcmFuY2VFbmQgKyBkdDtcclxuXHJcblxyXG4gICAgICB0aGlzLnRpbWVTaW5jZVBlbmRpbmdVdHRlcmFuY2UgPSAoIHRoaXMuc3BlYWtpbmdTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VXcmFwcGVyICYmICF0aGlzLnNwZWFraW5nU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlV3JhcHBlci5zdGFydGVkICkgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRpbWVTaW5jZVBlbmRpbmdVdHRlcmFuY2UgKyBkdCA6IDA7XHJcblxyXG4gICAgICBpZiAoIHRoaXMudGltZVNpbmNlUGVuZGluZ1V0dGVyYW5jZSA+IFBFTkRJTkdfVVRURVJBTkNFX0RFTEFZICkge1xyXG4gICAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuc3BlYWtpbmdTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VXcmFwcGVyLCAnc2hvdWxkIGhhdmUgdGhpcy5zcGVha2luZ1NwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZVdyYXBwZXInICk7XHJcblxyXG4gICAgICAgIC8vIEl0IGhhcyBiZWVuIHRvbyBsb25nIHNpbmNlIHdlIHJlcXVlc3RlZCBzcGVlY2ggd2l0aG91dCBzcGVha2luZywgdGhlIHN5bnRoIGlzIGxpa2VseSBmYWlsaW5nIG9uIHRoaXMgcGxhdGZvcm1cclxuICAgICAgICB0aGlzLmhhbmRsZVNwZWVjaFN5bnRoZXNpc0VuZCggdGhpcy5zcGVha2luZ1NwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZVdyYXBwZXIhLmFubm91bmNlVGV4dCwgdGhpcy5zcGVha2luZ1NwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZVdyYXBwZXIhICk7XHJcbiAgICAgICAgdGhpcy5zcGVha2luZ1NwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZVdyYXBwZXIgPSBudWxsO1xyXG5cclxuICAgICAgICAvLyBjYW5jZWwgdGhlIHN5bnRoIGJlY2F1c2Ugd2UgcmVhbGx5IGRvbid0IHdhbnQgaXQgdG8ga2VlcCB0cnlpbmcgdG8gc3BlYWsgdGhpcyB1dHRlcmFuY2UgYWZ0ZXIgaGFuZGxpbmdcclxuICAgICAgICAvLyB0aGUgYXNzdW1lZCBmYWlsdXJlXHJcbiAgICAgICAgdGhpcy5jYW5jZWxTeW50aCgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBXYWl0IHVudGlsIFZPSUNJTkdfVVRURVJBTkNFX0lOVEVSVkFMIHRvIHNwZWFrIGFnYWluIGZvciBtb3JlIGNvbnNpc3RlbnQgYmVoYXZpb3Igb24gY2VydGFpbiBwbGF0Zm9ybXMsXHJcbiAgICAgIC8vIHNlZSBkb2N1bWVudGF0aW9uIGZvciB0aGUgY29uc3RhbnQgZm9yIG1vcmUgaW5mb3JtYXRpb24uIEJ5IHNldHRpbmcgcmVhZHlUb0Fubm91bmNlIGluIHRoZSBzdGVwIGZ1bmN0aW9uXHJcbiAgICAgIC8vIHdlIGFsc28gZG9uJ3QgaGF2ZSB0byByZWx5IGF0IGFsbCBvbiB0aGUgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlICdlbmQnIGV2ZW50LCB3aGljaCBpcyBpbmNvbnNpc3RlbnQgb25cclxuICAgICAgLy8gY2VydGFpbiBwbGF0Zm9ybXMuIEFsc28sIG5vdCByZWFkeSB0byBhbm5vdW5jZSBpZiB3ZSBhcmUgd2FpdGluZyBmb3IgdGhlIHN5bnRoIHRvIHN0YXJ0IHNwZWFraW5nIHNvbWV0aGluZy5cclxuICAgICAgaWYgKCB0aGlzLnRpbWVTaW5jZVV0dGVyYW5jZUVuZCA+IFZPSUNJTkdfVVRURVJBTkNFX0lOVEVSVkFMICYmICF0aGlzLnNwZWFraW5nU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlV3JhcHBlciApIHtcclxuICAgICAgICB0aGlzLnJlYWR5VG9Bbm5vdW5jZSA9IHRydWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZXMgbG9uZ2VyIHRoYW4gMTUgc2Vjb25kcyB3aWxsIGdldCBpbnRlcnJ1cHRlZCBvbiBDaHJvbWUgYW5kIGZhaWwgdG8gc3RvcCB3aXRoXHJcbiAgICAgIC8vIGVuZCBvciBlcnJvciBldmVudHMuIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTY3OTQzNyBzdWdnZXN0cyBhIHdvcmthcm91bmRcclxuICAgICAgLy8gdGhhdCB1c2VzIHBhdXNlL3Jlc3VtZSBsaWtlIHRoaXMuIFRoZSB3b3JrYXJvdW5kIGlzIG5lZWRlZCBmb3IgZGVza3RvcCBDaHJvbWUgd2hlbiB1c2luZyBgbG9jYWxTZXJ2aWNlOiBmYWxzZWBcclxuICAgICAgLy8gdm9pY2VzLiBUaGUgYnVnIGRvZXMgbm90IGFwcGVhciBvbiBhbnkgTWljcm9zb2Z0IEVkZ2Ugdm9pY2VzLiBUaGlzIHdvcmthcm91bmQgYnJlYWtzIFNwZWVjaFN5bnRoZXNpcyBvblxyXG4gICAgICAvLyBhbmRyb2lkLiBJbiB0aGlzIGNoZWNrIHdlIG9ubHkgdXNlIHRoaXMgd29ya2Fyb3VuZCB3aGVyZSBuZWVkZWQuXHJcbiAgICAgIGlmICggcGxhdGZvcm0uY2hyb21pdW0gJiYgIXBsYXRmb3JtLmFuZHJvaWQgJiYgKCB0aGlzLnZvaWNlUHJvcGVydHkudmFsdWUgJiYgIXRoaXMudm9pY2VQcm9wZXJ0eS52YWx1ZS5sb2NhbFNlcnZpY2UgKSApIHtcclxuXHJcbiAgICAgICAgLy8gTm90IG5lY2Vzc2FyeSB0byBhcHBseSB0aGUgd29ya2Fyb3VuZCB1bmxlc3Mgd2UgYXJlIGN1cnJlbnRseSBzcGVha2luZy5cclxuICAgICAgICB0aGlzLnRpbWVTaW5jZVBhdXNlUmVzdW1lID0gc3ludGguc3BlYWtpbmcgPyB0aGlzLnRpbWVTaW5jZVBhdXNlUmVzdW1lICsgZHQgOiAwO1xyXG4gICAgICAgIGlmICggdGhpcy50aW1lU2luY2VQYXVzZVJlc3VtZSA+IFBBVVNFX1JFU1VNRV9XT1JLQVJPVU5EX0lOVEVSVkFMICkge1xyXG4gICAgICAgICAgdGhpcy50aW1lU2luY2VQYXVzZVJlc3VtZSA9IDA7XHJcbiAgICAgICAgICBzeW50aC5wYXVzZSgpO1xyXG4gICAgICAgICAgc3ludGgucmVzdW1lKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBBIHdvcmthcm91bmQgdG8ga2VlcCBTcGVlY2hTeW50aGVzaXMgcmVzcG9uc2l2ZSBvbiBDaHJvbWVib29rcy4gSWYgdGhlcmUgaXMgYSBsb25nIGVub3VnaCBpbnRlcnZhbCBiZXR3ZWVuXHJcbiAgICAgIC8vIHNwZWVjaCByZXF1ZXN0cywgdGhlIG5leHQgdGltZSBTcGVlY2hTeW50aGVzaXMgaXMgdXNlZCBpdCBpcyB2ZXJ5IHNsb3cgb24gQ2hyb21lYm9vay4gV2UgdGhpbmsgdGhlIGJyb3dzZXJcclxuICAgICAgLy8gdHVybnMgXCJvZmZcIiB0aGUgc3ludGhlc2lzIGVuZ2luZSBmb3IgcGVyZm9ybWFuY2UuIElmIGl0IGhhcyBiZWVuIGxvbmcgZW5vdWdoIHNpbmNlIHVzaW5nIHNwZWVjaCBzeW50aGVzaXMgYW5kXHJcbiAgICAgIC8vIHRoZXJlIGlzIG5vdGhpbmcgdG8gc3BlYWsgaW4gdGhlIHF1ZXVlLCByZXF1ZXN0aW5nIHNwZWVjaCB3aXRoIGVtcHR5IGNvbnRlbnQga2VlcHMgdGhlIGVuZ2luZSBhY3RpdmUuXHJcbiAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZ3Jhdml0eS1mb3JjZS1sYWItYmFzaWNzL2lzc3Vlcy8zMDMuXHJcbiAgICAgIGlmICggcGxhdGZvcm0uY2hyb21lT1MgKSB7XHJcbiAgICAgICAgdGhpcy50aW1lU2luY2VXYWtpbmdFbmdpbmUgKz0gZHQ7XHJcbiAgICAgICAgaWYgKCAhc3ludGguc3BlYWtpbmcgJiYgdGhpcy50aW1lU2luY2VXYWtpbmdFbmdpbmUgPiBFTkdJTkVfV0FLRV9JTlRFUlZBTCApIHtcclxuICAgICAgICAgIHRoaXMudGltZVNpbmNlV2FraW5nRW5naW5lID0gMDtcclxuXHJcbiAgICAgICAgICAvLyBUaGlzIHNwYWNlIGlzIGFjdHVhbGx5IHF1aXRlIGltcG9ydGFudC4gQW4gZW1wdHkgc3RyaW5nIGJlZ2FuIGJyZWFraW5nIGNocm9tZWJvb2tzIGluIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9mcmljdGlvbi9pc3N1ZXMvMzI4XHJcbiAgICAgICAgICBzeW50aC5zcGVhayggbmV3IFNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSggJyAnICkgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZW4gd2UgY2FuIG5vIGxvbmdlciBzcGVhaywgY2FuY2VsIGFsbCBzcGVlY2ggdG8gc2lsZW5jZSBldmVyeXRoaW5nLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgaGFuZGxlQ2FuU3BlYWtDaGFuZ2UoIGNhblNwZWFrOiBib29sZWFuICk6IHZvaWQge1xyXG4gICAgaWYgKCAhY2FuU3BlYWsgKSB7IHRoaXMuY2FuY2VsKCk7IH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwZGF0ZSB0aGUgbGlzdCBvZiBgdm9pY2VzYCBhdmFpbGFibGUgdG8gdGhlIHN5bnRoLCBhbmQgbm90aWZ5IHRoYXQgdGhlIGxpc3QgaGFzIGNoYW5nZWQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBwb3B1bGF0ZVZvaWNlcygpOiB2b2lkIHtcclxuICAgIGNvbnN0IHN5bnRoID0gdGhpcy5nZXRTeW50aCgpO1xyXG4gICAgaWYgKCBzeW50aCApIHtcclxuXHJcbiAgICAgIC8vIHRoZSBicm93c2VyIHNvbWV0aW1lcyBwcm92aWRlcyBkdXBsaWNhdGUgdm9pY2VzLCBwcnVuZSB0aG9zZSBvdXQgb2YgdGhlIGxpc3RcclxuICAgICAgdGhpcy52b2ljZXNQcm9wZXJ0eS52YWx1ZSA9IF8udW5pcUJ5KCBzeW50aC5nZXRWb2ljZXMoKSwgdm9pY2UgPT4gdm9pY2UubmFtZSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiBTcGVlY2hTeW50aGVzaXNWb2ljZXMgdGhhdCBhcmUgc29ydGVkIHN1Y2ggdGhhdCB0aGUgYmVzdCBzb3VuZGluZyB2b2ljZXMgY29tZSBmaXJzdC5cclxuICAgKiBBcyBvZiA5LzI3LzIxLCB3ZSBmaW5kIHRoYXQgdGhlIFwiR29vZ2xlXCIgdm9pY2VzIHNvdW5kIGJlc3Qgd2hpbGUgQXBwbGUncyBcIkZyZWRcIiBzb3VuZHMgdGhlIHdvcnN0IHNvIHRoZSBsaXN0XHJcbiAgICogd2lsbCBiZSBvcmRlcmVkIHRvIHJlZmxlY3QgdGhhdC4gVGhpcyB3YXkgXCJHb29nbGVcIiB2b2ljZXMgd2lsbCBiZSBzZWxlY3RlZCBieSBkZWZhdWx0IHdoZW4gYXZhaWxhYmxlIGFuZCBcIkZyZWRcIlxyXG4gICAqIHdpbGwgYWxtb3N0IG5ldmVyIGJlIHRoZSBkZWZhdWx0IFZvaWNlIHNpbmNlIGl0IGlzIGxhc3QgaW4gdGhlIGxpc3QuIFNlZVxyXG4gICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9zY2VuZXJ5L2lzc3Vlcy8xMjgyLyBmb3IgZGlzY3Vzc2lvbiBhbmQgdGhpcyBkZWNpc2lvbi5cclxuICAgKi9cclxuICBwdWJsaWMgZ2V0UHJpb3JpdGl6ZWRWb2ljZXMoKTogU3BlZWNoU3ludGhlc2lzVm9pY2VbXSB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmluaXRpYWxpemVkLCAnTm8gdm9pY2VzIGF2YWlsYWJsZSB1bnRpbCB0aGUgU3BlZWNoU3ludGhlc2lzQW5ub3VuY2VyIGlzIGluaXRpYWxpemVkJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy52b2ljZXNQcm9wZXJ0eS52YWx1ZS5sZW5ndGggPiAwLCAnTm8gdm9pY2VzIGF2YWlsYWJsZSB0byBwcm92aWRlZCBhIHByaW9yaXRpemVkIGxpc3QuJyApO1xyXG5cclxuICAgIGNvbnN0IGFsbFZvaWNlcyA9IHRoaXMudm9pY2VzUHJvcGVydHkudmFsdWUuc2xpY2UoKTtcclxuXHJcbiAgICAvLyBleGNsdWRlIFwibm92ZWx0eVwiIHZvaWNlcyB0aGF0IGFyZSBpbmNsdWRlZCBieSB0aGUgb3BlcmF0aW5nIHN5c3RlbSBidXQgbWFya2VkIGFzIEVuZ2xpc2guXHJcbiAgICAvLyBjb25zdCB2b2ljZXNXaXRob3V0Tm92ZWx0eSA9IF8uZmlsdGVyKCBhbGxWb2ljZXMsIHZvaWNlID0+ICFOT1ZFTFRZX1ZPSUNFUy5pbmNsdWRlcyggdm9pY2UubmFtZSApICk7XHJcbiAgICBjb25zdCB2b2ljZXNXaXRob3V0Tm92ZWx0eSA9IF8uZmlsdGVyKCBhbGxWb2ljZXMsIHZvaWNlID0+IHtcclxuXHJcbiAgICAgIC8vIFJlbW92ZSB0aGUgdm9pY2UgaWYgdGhlIFNwZWVjaFN5bnRoZXNpc1ZvaWNlLm5hbWUgaW5jbHVkZXMgYSBzdWJzdHJpbmcgb2YgdGhlIGVudHJ5IGluIG91ciBsaXN0ICh0aGUgYnJvd3NlclxyXG4gICAgICAvLyBtaWdodCBpbmNsdWRlIG1vcmUgaW5mb3JtYXRpb24gaW4gdGhlIG5hbWUgdGhhbiB3ZSBtYWludGFpbiwgbGlrZSBsb2NhbGUgaW5mbyBvciBzb21ldGhpbmcgZWxzZSkuXHJcbiAgICAgIHJldHVybiAhXy5zb21lKCBOT1ZFTFRZX1ZPSUNFUywgbm92ZWx0eVZvaWNlID0+IHZvaWNlLm5hbWUuaW5jbHVkZXMoIG5vdmVsdHlWb2ljZSApICk7XHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3QgZ2V0SW5kZXggPSAoIHZvaWNlOiBTcGVlY2hTeW50aGVzaXNWb2ljZSApID0+XHJcbiAgICAgIHZvaWNlLm5hbWUuaW5jbHVkZXMoICdHb29nbGUnICkgPyAtMSA6IC8vIEdvb2dsZSBzaG91bGQgbW92ZSB0b3dhcmQgdGhlIGZyb250XHJcbiAgICAgIHZvaWNlLm5hbWUuaW5jbHVkZXMoICdGcmVkJyApID8gdm9pY2VzV2l0aG91dE5vdmVsdHkubGVuZ3RoIDogLy8gRnJlZCBzaG91bGQgbW92ZSB0b3dhcmQgdGhlIGJhY2tcclxuICAgICAgdm9pY2VzV2l0aG91dE5vdmVsdHkuaW5kZXhPZiggdm9pY2UgKTsgLy8gT3RoZXJ3aXNlIHByZXNlcnZlIG9yZGVyaW5nXHJcblxyXG4gICAgcmV0dXJuIHZvaWNlc1dpdGhvdXROb3ZlbHR5LnNvcnQoICggYSwgYiApID0+IGdldEluZGV4KCBhICkgLSBnZXRJbmRleCggYiApICk7XHJcblxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVm9pY2luZyBhcyBhIGZlYXR1cmUgaXMgbm90IHRyYW5zbGF0YWJsZS4gVGhpcyBmdW5jdGlvbiBnZXRzIHRoZSBcInByaW9yaXRpemVkXCIgdm9pY2VzIChhcyBkZWNpZGVkIGJ5IFBoRVQpIGFuZFxyXG4gICAqIHBydW5lcyBvdXQgdGhlIG5vbi1lbmdsaXNoIG9uZXMuIFRoaXMgZG9lcyBub3QgdXNlIHRoaXMuZ2V0UHJpb3JpdGl6ZWRWb2ljZXNGb3JMb2NhbGUgYmVjYXVzZSB0aGUgcmVxdWlyZWQgTG9jYWxlXHJcbiAgICogdHlwZSBkb2Vzbid0IGluY2x1ZGUgJ2VuLVVTJyBvciAnZW5fVVMnIGFzIHZhbGlkIHZhbHVlcywganVzdCAnZW4nLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRFbmdsaXNoUHJpb3JpdGl6ZWRWb2ljZXMoKTogU3BlZWNoU3ludGhlc2lzVm9pY2VbXSB7XHJcbiAgICByZXR1cm4gXy5maWx0ZXIoIHRoaXMuZ2V0UHJpb3JpdGl6ZWRWb2ljZXMoKSwgdm9pY2UgPT4ge1xyXG5cclxuICAgICAgLy8gbW9zdCBicm93c2VycyB1c2UgZGFzaGVzIHRvIHNlcGFyYXRlIHRoZSBsb2NhbCwgQW5kcm9pZCB1c2VzIHVuZGVyc2NvcmUuXHJcbiAgICAgIHJldHVybiB2b2ljZS5sYW5nID09PSAnZW4tVVMnIHx8IHZvaWNlLmxhbmcgPT09ICdlbl9VUyc7XHJcbiAgICB9ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBWb2ljaW5nIGFzIGEgZmVhdHVyZSBpcyBub3QgdHJhbnNsYXRhYmxlLCBidXQgc29tZSBTcGVlY2hTeW50aGVzaXNBbm5vdW5jZXIgdXNhZ2VzIG91dHNpZGUgb2Ygdm9pY2luZyBhcmUuIFRoaXNcclxuICAgKiBmdW5jdGlvbiBnZXRzIHRoZSBcInByaW9yaXRpemVkXCIgdm9pY2VzIChhcyBkZWNpZGVkIGJ5IFBoRVQpIGFuZFxyXG4gICAqIHBydW5lcyBvdXQgZXZlcnl0aGluZyB0aGF0IGlzIG5vdCB0aGUgXCJwcm92aWRlZFwiIGxvY2FsZS4gVGhlIGFsZ29yaXRobSBmb3IgbWFwcGluZyBsb2NhbGUgaXMgYXMgZm9sbG93czpcclxuICAgKlxyXG4gICAqIGxvY2FsZTogJ2VuJyAtIFByb3ZpZGVkIGxvY2FsZSBwYXJhbWV0ZXJcclxuICAgKiB2b2ljZTogJ2VuX0dCJyAtIFlFUyBtYXRjaGVzIVxyXG4gICAqIHZvaWNlOiAnZW4nIC0gWUVTXHJcbiAgICpcclxuICAgKiBsb2NhbGU6ICdlbl9HQidcclxuICAgKiB2b2ljZTogJ2VuJyAtIE5PXHJcbiAgICogdm9pY2U6ICdlbl9HQicgLSBZRVNcclxuICAgKiB2b2ljZTogJ2VuLUdCJyAtIFlFU1xyXG4gICAqIHZvaWNlOiAnZW4tVVMnIC0gTk9cclxuICAgKlxyXG4gICAqIGxvY2FsZTogJ3poX0NOJ1xyXG4gICAqIHZvaWNlOiAnemgnIC0gTk9cclxuICAgKiB2b2ljZTogJ3poX0NOJyAtIFlFU1xyXG4gICAqXHJcbiAgICogbG9jYWxlOiAnemgnXHJcbiAgICogdm9pY2U6ICd6aCcgLSBZRVNcclxuICAgKiB2b2ljZTogJ3poX0NOJyAtIFlFU1xyXG4gICAqIHZvaWNlOiAnemgtVFcnIC0gWUVTXHJcbiAgICpcclxuICAgKiBsb2NhbGU6ICdlc19FUydcclxuICAgKiB2b2ljZTogJ2VzX01YJyAtIE5PXHJcbiAgICogdm9pY2U6ICdlcycgLSBOT1xyXG4gICAqIHZvaWNlOiAnZXMtRVMnIC0gWUVTXHJcbiAgICovXHJcbiAgcHVibGljIGdldFByaW9yaXRpemVkVm9pY2VzRm9yTG9jYWxlKCBsb2NhbGU6IExvY2FsZSApOiBTcGVlY2hTeW50aGVzaXNWb2ljZVtdIHtcclxuXHJcbiAgICAvLyBGb3VyIGxldHRlciBsb2NhbGVzIG9mIHR5cGUgTG9jYWxlIGluY2x1ZGUgYW4gdW5kZXJzY29yZSBiZXR3ZWVuIHRoZSBsYW5ndWFnZSBhbmQgdGhlIHJlZ2lvbi4gTW9zdCBicm93c2VyIHZvaWNlXHJcbiAgICAvLyBuYW1lcyB1c2UgYSBkYXNoIGluc3RlYWQgb2YgYW4gdW5kZXJzY29yZSwgc28gd2UgbmVlZCB0byBjcmVhdGUgYSB2ZXJzaW9uIG9mIHRoZSBsb2NhbGUgd2l0aCBkYXNoZXMuXHJcbiAgICBjb25zdCB1bmRlcnNjb3JlTG9jYWxlID0gbG9jYWxlO1xyXG4gICAgY29uc3QgZGFzaExvY2FsZSA9IGxvY2FsZS5yZXBsYWNlKCAnXycsICctJyApO1xyXG5cclxuICAgIHJldHVybiBfLmZpbHRlciggdGhpcy5nZXRQcmlvcml0aXplZFZvaWNlcygpLCB2b2ljZSA9PiB7XHJcblxyXG4gICAgICAvLyBIYW5kbGUgdW5zdXBwb3J0ZWQgbG9jYWxlIG1hcHBpbmcgaGVyZSwgc2VlIHZvaWNlTGFuZ1RvU3VwcG9ydGVkTG9jYWxlIGFuZCBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvbnVtYmVyLXBsYXkvaXNzdWVzLzIzMC5cclxuICAgICAgY29uc3Qgdm9pY2VMYW5nID0gdm9pY2VMYW5nVG9TdXBwb3J0ZWRMb2NhbGUuaGFzT3duUHJvcGVydHkoIHZvaWNlLmxhbmcgKSA/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZvaWNlTGFuZ1RvU3VwcG9ydGVkTG9jYWxlWyB2b2ljZS5sYW5nIF0gOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2b2ljZS5sYW5nO1xyXG5cclxuICAgICAgbGV0IG1hdGNoZXNTaG9ydExvY2FsZSA9IGZhbHNlO1xyXG4gICAgICBpZiAoIHZvaWNlTGFuZy5pbmNsdWRlcyggJ18nICkgfHwgdm9pY2VMYW5nLmluY2x1ZGVzKCAnLScgKSApIHtcclxuXHJcbiAgICAgICAgLy8gTWFwcGluZyB6aF9DTiBvciB6aC1DTiAtPiB6aFxyXG4gICAgICAgIG1hdGNoZXNTaG9ydExvY2FsZSA9IHVuZGVyc2NvcmVMb2NhbGUgPT09IHZvaWNlTGFuZy5zbGljZSggMCwgMiApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyB3aGlsZSBtb3N0IGJyb3dzZXJzIHVzZSBkYXNoZXMgdG8gc2VwYXJhdGUgdGhlIGxvY2FsLCBBbmRyb2lkIHVzZXMgdW5kZXJzY29yZSwgc28gY29tcGFyZSBib3RoIHR5cGVzLiBMb29zZWx5XHJcbiAgICAgIC8vIGNvbXBhcmUgd2l0aCBpbmNsdWRlcygpIHNvIGFsbCBjb3VudHJ5LXNwZWNpZmljIHZvaWNlcyBhcmUgYXZhaWxhYmxlIGZvciB0d28tbGV0dGVyIExvY2FsZSBjb2Rlcy5cclxuICAgICAgcmV0dXJuIG1hdGNoZXNTaG9ydExvY2FsZSB8fCB1bmRlcnNjb3JlTG9jYWxlID09PSB2b2ljZUxhbmcgfHwgZGFzaExvY2FsZSA9PT0gdm9pY2VMYW5nO1xyXG4gICAgfSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW1wbGVtZW50cyBhbm5vdW5jZSBzbyB0aGUgU3BlZWNoU3ludGhlc2lzQW5ub3VuY2VyIGNhbiBiZSBhIHNvdXJjZSBvZiBvdXRwdXQgZm9yIHV0dGVyYW5jZVF1ZXVlLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBhbm5vdW5jZSggYW5ub3VuY2VUZXh0OiBSZXNvbHZlZFJlc3BvbnNlLCB1dHRlcmFuY2U6IFV0dGVyYW5jZSApOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy5pbml0aWFsaXplZCAmJiB0aGlzLmNhblNwZWFrUHJvcGVydHkgJiYgdGhpcy5jYW5TcGVha1Byb3BlcnR5LnZhbHVlICkge1xyXG4gICAgICB0aGlzLnJlcXVlc3RTcGVlY2goIGFubm91bmNlVGV4dCwgdXR0ZXJhbmNlICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuXHJcbiAgICAgIC8vIFRoZSBhbm5vdW5jZXIgaXMgbm90IGdvaW5nIHRvIGFubm91bmNlIHRoaXMgdXR0ZXJhbmNlLCBzaWduaWZ5IHRoYXQgd2UgYXJlIGRvbmUgd2l0aCBpdC5cclxuICAgICAgdGhpcy5oYW5kbGVBbm5vdW5jZW1lbnRGYWlsdXJlKCB1dHRlcmFuY2UsIGFubm91bmNlVGV4dCApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGFubm91bmNlbWVudCBvZiB0aGlzIHV0dGVyYW5jZSBoYXMgZmFpbGVkIGluIHNvbWUgd2F5LCBzaWduaWZ5IHRvIGNsaWVudHMgb2YgdGhpcyBhbm5vdW5jZXIgdGhhdCB0aGUgdXR0ZXJhbmNlXHJcbiAgICogd2lsbCBuZXZlciBjb21wbGV0ZS4gRm9yIGV4YW1wbGUgc3RhcnQvZW5kIGV2ZW50cyBvbiB0aGUgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlIHdpbGwgbmV2ZXIgZmlyZS5cclxuICAgKi9cclxuICBwcml2YXRlIGhhbmRsZUFubm91bmNlbWVudEZhaWx1cmUoIHV0dGVyYW5jZTogVXR0ZXJhbmNlLCBhbm5vdW5jZVRleHQ6IFJlc29sdmVkUmVzcG9uc2UgKTogdm9pZCB7XHJcbiAgICB0aGlzLmRlYnVnICYmIGNvbnNvbGUubG9nKCAnYW5ub3VuY2VtZW50IGZhaWx1cmUnLCBhbm5vdW5jZVRleHQgKTtcclxuICAgIHRoaXMuYW5ub3VuY2VtZW50Q29tcGxldGVFbWl0dGVyLmVtaXQoIHV0dGVyYW5jZSwgYW5ub3VuY2VUZXh0ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVc2Ugc3BlZWNoIHN5bnRoZXNpcyB0byBzcGVhayBhbiB1dHRlcmFuY2UuIE5vLW9wIHVubGVzcyBTcGVlY2hTeW50aGVzaXNBbm5vdW5jZXIgaXMgaW5pdGlhbGl6ZWQgYW5kIG90aGVyIG91dHB1dFxyXG4gICAqIGNvbnRyb2xsaW5nIFByb3BlcnRpZXMgYXJlIHRydWUgKHNlZSBzcGVlY2hBbGxvd2VkUHJvcGVydHkgaW4gaW5pdGlhbGl6ZSgpKS4gVGhpcyBleHBsaWNpdGx5IGlnbm9yZXNcclxuICAgKiB0aGlzLmVuYWJsZWRQcm9wZXJ0eSwgYWxsb3dpbmcgc3BlZWNoIGV2ZW4gd2hlbiBTcGVlY2hTeW50aGVzaXNBbm5vdW5jZXIgaXMgZGlzYWJsZWQuIFRoaXMgaXMgdXNlZnVsIGluIHJhcmUgY2FzZXMsIGZvclxyXG4gICAqIGV4YW1wbGUgd2hlbiB0aGUgU3BlZWNoU3ludGhlc2lzQW5ub3VuY2VyIHJlY2VudGx5IGJlY29tZXMgZGlzYWJsZWQgYnkgdGhlIHVzZXIgYW5kIHdlIG5lZWQgdG8gYW5ub3VuY2UgY29uZmlybWF0aW9uIG9mXHJcbiAgICogdGhhdCBkZWNpc2lvbiAoXCJWb2ljaW5nIG9mZlwiIG9yIFwiQWxsIGF1ZGlvIG9mZlwiKS5cclxuICAgKlxyXG4gICAqIE5PVEU6IFRoaXMgd2lsbCBpbnRlcnJ1cHQgYW55IGN1cnJlbnRseSBzcGVha2luZyB1dHRlcmFuY2UuXHJcbiAgICovXHJcbiAgcHVibGljIHNwZWFrSWdub3JpbmdFbmFibGVkKCB1dHRlcmFuY2U6IFV0dGVyYW5jZSApOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy5pbml0aWFsaXplZCApIHtcclxuICAgICAgdGhpcy5jYW5jZWwoKTtcclxuICAgICAgdGhpcy5yZXF1ZXN0U3BlZWNoKCB1dHRlcmFuY2UuZ2V0QWxlcnRUZXh0KCB0aGlzLnJlc3BlY3RSZXNwb25zZUNvbGxlY3RvclByb3BlcnRpZXMgKSwgdXR0ZXJhbmNlICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXF1ZXN0IHNwZWVjaCB3aXRoIFNwZWVjaFN5bnRoZXNpcy5cclxuICAgKi9cclxuICBwcml2YXRlIHJlcXVlc3RTcGVlY2goIGFubm91bmNlVGV4dDogUmVzb2x2ZWRSZXNwb25zZSwgdXR0ZXJhbmNlOiBVdHRlcmFuY2UgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBTcGVlY2hTeW50aGVzaXNBbm5vdW5jZXIuaXNTcGVlY2hTeW50aGVzaXNTdXBwb3J0ZWQoKSwgJ3RyeWluZyB0byBzcGVhayB3aXRoIHNwZWVjaFN5bnRoZXNpcywgYnV0IGl0IGlzIG5vdCBzdXBwb3J0ZWQgb24gdGhpcyBwbGF0Zm9ybScgKTtcclxuXHJcbiAgICB0aGlzLmRlYnVnICYmIGNvbnNvbGUubG9nKCAncmVxdWVzdFNwZWVjaCcsIGFubm91bmNlVGV4dCApO1xyXG5cclxuICAgIC8vIElmIHRoZSB1dHRlcmFuY2UgdGV4dCBpcyBudWxsLCB0aGVuIG9wdCBvdXQgZWFybHlcclxuICAgIGlmICggIWFubm91bmNlVGV4dCApIHtcclxuICAgICAgdGhpcy5oYW5kbGVBbm5vdW5jZW1lbnRGYWlsdXJlKCB1dHRlcmFuY2UsIGFubm91bmNlVGV4dCApO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVXR0ZXJhbmNlLmFubm91bmNlck9wdGlvbnMgbXVzdCBiZSBtb3JlIGdlbmVyYWwgdG8gYWxsb3cgdGhpcyB0eXBlIHRvIGFwcGx5IHRvIGFueSBpbXBsZW1lbnRhdGlvbiBvZiBBbm5vdW5jZXIsIHRodXMgXCJPYmplY3RcIiBhcyB0aGUgcHJvdmlkZWQgb3B0aW9ucy5cclxuICAgIGNvbnN0IHV0dGVyYW5jZU9wdGlvbnMgPSBvcHRpb25pemUzPFNwZWVjaFN5bnRoZXNpc0Fubm91bmNlT3B0aW9ucywgU3BlZWNoU3ludGhlc2lzQW5ub3VuY2VPcHRpb25zPigpKFxyXG4gICAgICB7fSwgVVRURVJBTkNFX09QVElPTl9ERUZBVUxUUywgdXR0ZXJhbmNlLmFubm91bmNlck9wdGlvbnNcclxuICAgICk7XHJcblxyXG4gICAgLy8gZW1iZWRkaW5nIG1hcmtzIChmb3IgaTE4bikgaW1wYWN0IHRoZSBvdXRwdXQsIHN0cmlwIGJlZm9yZSBzcGVha2luZywgdHlwZSBjYXN0IG51bWJlciB0byBzdHJpbmcgaWYgYXBwbGljYWJsZSAoZm9yIG51bWJlcilcclxuICAgIGNvbnN0IHN0cmluZ1RvU3BlYWsgPSByZW1vdmVCclRhZ3MoIHN0cmlwRW1iZWRkaW5nTWFya3MoIGFubm91bmNlVGV4dCArICcnICkgKTtcclxuXHJcbiAgICAvLyBEaXNhbGxvdyBhbnkgdW5maWxsZWQgdGVtcGxhdGUgdmFyaWFibGVzIHRvIGJlIHNldCBpbiB0aGUgUERPTS5cclxuICAgIHZhbGlkYXRlKCBzdHJpbmdUb1NwZWFrLCBWYWxpZGF0aW9uLlNUUklOR19XSVRIT1VUX1RFTVBMQVRFX1ZBUlNfVkFMSURBVE9SICk7XHJcblxyXG4gICAgY29uc3Qgc3BlZWNoU3ludGhVdHRlcmFuY2UgPSBuZXcgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlKCBzdHJpbmdUb1NwZWFrICk7XHJcbiAgICBzcGVlY2hTeW50aFV0dGVyYW5jZS52b2ljZSA9IHV0dGVyYW5jZU9wdGlvbnMudm9pY2UgfHwgdGhpcy52b2ljZVByb3BlcnR5LnZhbHVlO1xyXG4gICAgc3BlZWNoU3ludGhVdHRlcmFuY2UucGl0Y2ggPSB0aGlzLnZvaWNlUGl0Y2hQcm9wZXJ0eS52YWx1ZTtcclxuICAgIHNwZWVjaFN5bnRoVXR0ZXJhbmNlLnJhdGUgPSB0aGlzLnZvaWNlUmF0ZVByb3BlcnR5LnZhbHVlO1xyXG4gICAgc3BlZWNoU3ludGhVdHRlcmFuY2Uudm9sdW1lID0gdGhpcy52b2ljZVZvbHVtZVByb3BlcnR5LnZhbHVlO1xyXG5cclxuICAgIGNvbnN0IHN0YXJ0TGlzdGVuZXIgPSAoKSA9PiB7XHJcbiAgICAgIHRoaXMuc3RhcnRTcGVha2luZ0VtaXR0ZXIuZW1pdCggc3RyaW5nVG9TcGVhaywgdXR0ZXJhbmNlICk7XHJcblxyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLnNwZWFraW5nU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlV3JhcHBlciwgJ3Nob3VsZCBoYXZlIGJlZW4gc2V0IGluIHJlcXVlc3RTcGVlY2gnICk7XHJcbiAgICAgIHRoaXMuc3BlYWtpbmdTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VXcmFwcGVyIS5zdGFydGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgIHNwZWVjaFN5bnRoVXR0ZXJhbmNlLnJlbW92ZUV2ZW50TGlzdGVuZXIoICdzdGFydCcsIHN0YXJ0TGlzdGVuZXIgKTtcclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgZW5kTGlzdGVuZXIgPSAoKSA9PiB7XHJcbiAgICAgIHRoaXMuaGFuZGxlU3BlZWNoU3ludGhlc2lzRW5kKCBzdHJpbmdUb1NwZWFrLCBzcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VXcmFwcGVyICk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEtlZXAgYSByZWZlcmVuY2UgdG8gdGhlIFNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSBhbmQgdGhlIHN0YXJ0L2VuZExpc3RlbmVycyBzbyB0aGF0IHdlIGNhbiByZW1vdmUgdGhlbSBsYXRlci5cclxuICAgIC8vIE5vdGljZSB0aGlzIGlzIHVzZWQgaW4gdGhlIGZ1bmN0aW9uIHNjb3BlcyBhYm92ZS5cclxuICAgIC8vIElNUE9SVEFOVCBOT1RFOiBBbHNvLCB0aGlzIGFjdHMgYXMgYSB3b3JrYXJvdW5kIGZvciBhIFNhZmFyaSBidWcgd2hlcmUgdGhlIGBlbmRgIGV2ZW50IGRvZXMgbm90IGZpcmVcclxuICAgIC8vIGNvbnNpc3RlbnRseS4gSWYgdGhlIFNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSBpcyBub3QgaW4gbWVtb3J5IHdoZW4gaXQgaXMgdGltZSBmb3IgdGhlIGBlbmRgIGV2ZW50LCBTYWZhcmlcclxuICAgIC8vIHdpbGwgZmFpbCB0byBlbWl0IHRoYXQgZXZlbnQuIFNlZVxyXG4gICAgLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjM0ODM5OTAvc3BlZWNoc3ludGhlc2lzLWFwaS1vbmVuZC1jYWxsYmFjay1ub3Qtd29ya2luZyBhbmRcclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9qb2huLXRyYXZvbHRhZ2UvaXNzdWVzLzQzNSBhbmQgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3V0dGVyYW5jZS1xdWV1ZS9pc3N1ZXMvNTJcclxuICAgIGNvbnN0IHNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZVdyYXBwZXIgPSBuZXcgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlV3JhcHBlciggdXR0ZXJhbmNlLCBhbm5vdW5jZVRleHQsIHNwZWVjaFN5bnRoVXR0ZXJhbmNlLCBmYWxzZSwgZW5kTGlzdGVuZXIsIHN0YXJ0TGlzdGVuZXIgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLnNwZWFraW5nU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlV3JhcHBlciA9PT0gbnVsbCwgJ1dyYXBwZXIgc2hvdWxkIGJlIG51bGwsIHdlIHNob3VsZCBoYXZlIHJlY2VpdmVkIGFuIGVuZCBldmVudCB0byBjbGVhciBpdCBiZWZvcmUgdGhlIG5leHQgb25lLicgKTtcclxuICAgIHRoaXMuc3BlYWtpbmdTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VXcmFwcGVyID0gc3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlV3JhcHBlcjtcclxuXHJcbiAgICBzcGVlY2hTeW50aFV0dGVyYW5jZS5hZGRFdmVudExpc3RlbmVyKCAnc3RhcnQnLCBzdGFydExpc3RlbmVyICk7XHJcbiAgICBzcGVlY2hTeW50aFV0dGVyYW5jZS5hZGRFdmVudExpc3RlbmVyKCAnZW5kJywgZW5kTGlzdGVuZXIgKTtcclxuXHJcbiAgICAvLyBJbiBTYWZhcmkgdGhlIGBlbmRgIGxpc3RlbmVyIGRvZXMgbm90IGZpcmUgY29uc2lzdGVudGx5LCAoZXNwZWNpYWxseSBhZnRlciBjYW5jZWwpXHJcbiAgICAvLyBidXQgdGhlIGVycm9yIGV2ZW50IGRvZXMuIEluIHRoaXMgY2FzZSBzaWduaWZ5IHRoYXQgc3BlYWtpbmcgaGFzIGVuZGVkLlxyXG4gICAgc3BlZWNoU3ludGhVdHRlcmFuY2UuYWRkRXZlbnRMaXN0ZW5lciggJ2Vycm9yJywgZW5kTGlzdGVuZXIgKTtcclxuXHJcbiAgICAvLyBTaWduaWZ5IHRvIHRoZSB1dHRlcmFuY2UtcXVldWUgdGhhdCB3ZSBjYW5ub3Qgc3BlYWsgeWV0IHVudGlsIHRoaXMgdXR0ZXJhbmNlIGhhcyBmaW5pc2hlZFxyXG4gICAgdGhpcy5yZWFkeVRvQW5ub3VuY2UgPSBmYWxzZTtcclxuXHJcbiAgICAvLyBUaGlzIGlzIGdlbmVyYWxseSBzZXQgaW4gdGhlIHN0ZXAgZnVuY3Rpb24gd2hlbiB0aGUgc3ludGggaXMgbm90IHNwZWFraW5nLCBidXQgdGhlcmUgaXMgYSBGaXJlZm94IGlzc3VlIHdoZXJlXHJcbiAgICAvLyB0aGUgU3BlZWNoU3ludGhlc2lzLnNwZWFraW5nIGlzIHNldCB0byBgdHJ1ZWAgYXN5bmNocm9ub3VzbHkuIFNvIHdlIGVhZ2VybHkgcmVzZXQgdGhpcyB0aW1pbmcgdmFyaWFibGUgdG9cclxuICAgIC8vIHNpZ25pZnkgdGhhdCB3ZSBuZWVkIHRvIHdhaXQgVk9JQ0lOR19VVFRFUkFOQ0VfSU5URVJWQUwgdW50aWwgd2UgYXJlIGFsbG93ZWQgdG8gc3BlYWsgYWdhaW4uXHJcbiAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3V0dGVyYW5jZS1xdWV1ZS9pc3N1ZXMvNDBcclxuICAgIHRoaXMudGltZVNpbmNlVXR0ZXJhbmNlRW5kID0gMDtcclxuXHJcbiAgICAvLyBJbnRlcnJ1cHQgaWYgdGhlIFV0dGVyYW5jZSBjYW4gbm8gbG9uZ2VyIGJlIGFubm91bmNlZC5cclxuICAgIHV0dGVyYW5jZS5jYW5Bbm5vdW5jZVByb3BlcnR5LmxpbmsoIHRoaXMuYm91bmRIYW5kbGVDYW5Bbm5vdW5jZUNoYW5nZSApO1xyXG4gICAgdXR0ZXJhbmNlLnZvaWNpbmdDYW5Bbm5vdW5jZVByb3BlcnR5LmxpbmsoIHRoaXMuYm91bmRIYW5kbGVDYW5Bbm5vdW5jZUNoYW5nZSApO1xyXG5cclxuICAgIHRoaXMuZ2V0U3ludGgoKSEuc3BlYWsoIHNwZWVjaFN5bnRoVXR0ZXJhbmNlICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGVuIGEgY2FuQW5ub3VuY2VQcm9wZXJ0eSBjaGFuZ2VzIHRvIGZhbHNlIGZvciBhbiBVdHRlcmFuY2UsIHRoYXQgdXR0ZXJhbmNlIHNob3VsZCBiZSBjYW5jZWxsZWQuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBoYW5kbGVDYW5Bbm5vdW5jZUNoYW5nZSgpOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy5zcGVha2luZ1NwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZVdyYXBwZXIgKSB7XHJcbiAgICAgIHRoaXMuY2FuY2VsVXR0ZXJhbmNlSWZDYW5Bbm5vdW5jZUZhbHNlKCB0aGlzLnNwZWFraW5nU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlV3JhcHBlci51dHRlcmFuY2UgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZW4gYSBjYW5Bbm5vdW5jZVByb3BlcnR5IGNoYW5nZXMsIGNhbmNlbCB0aGUgVXR0ZXJhbmNlIGlmIHRoZSB2YWx1ZSBiZWNvbWVzIGZhbHNlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgY2FuY2VsVXR0ZXJhbmNlSWZDYW5Bbm5vdW5jZUZhbHNlKCB1dHRlcmFuY2U6IFV0dGVyYW5jZSApOiB2b2lkIHtcclxuICAgIGlmICggIXV0dGVyYW5jZS5jYW5Bbm5vdW5jZVByb3BlcnR5LnZhbHVlIHx8ICF1dHRlcmFuY2Uudm9pY2luZ0NhbkFubm91bmNlUHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgIHRoaXMuY2FuY2VsVXR0ZXJhbmNlKCB1dHRlcmFuY2UgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFsbCB0aGUgd29yayBuZWNlc3Nhcnkgd2hlbiB3ZSBhcmUgZmluaXNoZWQgd2l0aCBhbiB1dHRlcmFuY2UsIGludGVuZGVkIGZvciBlbmQgb3IgY2FuY2VsLlxyXG4gICAqIEVtaXRzIGV2ZW50cyBzaWduaWZ5aW5nIHRoYXQgd2UgYXJlIGRvbmUgd2l0aCBzcGVlY2ggYW5kIGRvZXMgc29tZSBkaXNwb3NhbC5cclxuICAgKi9cclxuICBwcml2YXRlIGhhbmRsZVNwZWVjaFN5bnRoZXNpc0VuZCggc3RyaW5nVG9TcGVhazogUmVzb2x2ZWRSZXNwb25zZSwgc3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlV3JhcHBlcjogU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlV3JhcHBlciApOiB2b2lkIHtcclxuICAgIHRoaXMuZW5kU3BlYWtpbmdFbWl0dGVyLmVtaXQoIHN0cmluZ1RvU3BlYWssIHNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZVdyYXBwZXIudXR0ZXJhbmNlICk7XHJcbiAgICB0aGlzLmFubm91bmNlbWVudENvbXBsZXRlRW1pdHRlci5lbWl0KCBzcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VXcmFwcGVyLnV0dGVyYW5jZSwgc3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlV3JhcHBlci5zcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UudGV4dCApO1xyXG5cclxuICAgIHNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZVdyYXBwZXIuc3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlLnJlbW92ZUV2ZW50TGlzdGVuZXIoICdlcnJvcicsIHNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZVdyYXBwZXIuZW5kTGlzdGVuZXIgKTtcclxuICAgIHNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZVdyYXBwZXIuc3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlLnJlbW92ZUV2ZW50TGlzdGVuZXIoICdlbmQnLCBzcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VXcmFwcGVyLmVuZExpc3RlbmVyICk7XHJcbiAgICBzcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VXcmFwcGVyLnNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZS5yZW1vdmVFdmVudExpc3RlbmVyKCAnc3RhcnQnLCBzcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VXcmFwcGVyLnN0YXJ0TGlzdGVuZXIgKTtcclxuXHJcbiAgICAvLyBUaGUgZW5kU3BlYWtpbmdFbWl0dGVyIG1heSBlbmQgdXAgY2FsbGluZyBoYW5kbGVTcGVlY2hTeW50aGVzaXNFbmQgaW4gaXRzIGxpc3RlbmVycywgd2UgbmVlZCB0byBiZSBncmFjZWZ1bFxyXG4gICAgY29uc3QgdXR0ZXJhbmNlQ2FuQW5ub3VuY2VQcm9wZXJ0eSA9IHNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZVdyYXBwZXIudXR0ZXJhbmNlLmNhbkFubm91bmNlUHJvcGVydHk7XHJcbiAgICBpZiAoIHV0dGVyYW5jZUNhbkFubm91bmNlUHJvcGVydHkuaGFzTGlzdGVuZXIoIHRoaXMuYm91bmRIYW5kbGVDYW5Bbm5vdW5jZUNoYW5nZSApICkge1xyXG4gICAgICB1dHRlcmFuY2VDYW5Bbm5vdW5jZVByb3BlcnR5LnVubGluayggdGhpcy5ib3VuZEhhbmRsZUNhbkFubm91bmNlQ2hhbmdlICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdXR0ZXJhbmNlVm9pY2luZ0NhbkFubm91bmNlUHJvcGVydHkgPSBzcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VXcmFwcGVyLnV0dGVyYW5jZS52b2ljaW5nQ2FuQW5ub3VuY2VQcm9wZXJ0eTtcclxuICAgIGlmICggdXR0ZXJhbmNlVm9pY2luZ0NhbkFubm91bmNlUHJvcGVydHkuaGFzTGlzdGVuZXIoIHRoaXMuYm91bmRIYW5kbGVDYW5Bbm5vdW5jZUNoYW5nZSApICkge1xyXG4gICAgICB1dHRlcmFuY2VWb2ljaW5nQ2FuQW5ub3VuY2VQcm9wZXJ0eS51bmxpbmsoIHRoaXMuYm91bmRIYW5kbGVDYW5Bbm5vdW5jZUNoYW5nZSApO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc3BlYWtpbmdTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VXcmFwcGVyID0gbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2VzIHRvIHRoZSBTcGVlY2hTeW50aGVzaXMgb2YgdGhlIFNwZWVjaFN5bnRoZXNpc0Fubm91bmNlciB0aGF0IGlzIHVzZWQgdG8gcmVxdWVzdCBzcGVlY2ggd2l0aCB0aGUgV2ViXHJcbiAgICogU3BlZWNoIEFQSS4gRXZlcnkgcmVmZXJlbmNlcyBoYXMgYSBjaGVjayB0byBlbnN1cmUgdGhhdCB0aGUgc3ludGggaXMgYXZhaWxhYmxlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2V0U3ludGgoKTogbnVsbCB8IFNwZWVjaFN5bnRoZXNpcyB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBTcGVlY2hTeW50aGVzaXNBbm5vdW5jZXIuaXNTcGVlY2hTeW50aGVzaXNTdXBwb3J0ZWQoKSwgJ1RyeWluZyB0byB1c2UgU3BlZWNoU3ludGhlc2lzLCBidXQgaXQgaXMgbm90IHN1cHBvcnRlZCBvbiB0aGlzIHBsYXRmb3JtLicgKTtcclxuICAgIHJldHVybiB0aGlzLnN5bnRoO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU3RvcHMgYW55IFV0dGVyYW5jZSB0aGF0IGlzIGN1cnJlbnRseSBiZWluZyBhbm5vdW5jZWQgb3IgaXMgKGFib3V0IHRvIGJlIGFubm91bmNlZCkuXHJcbiAgICogKHV0dGVyYW5jZS1xdWV1ZSBpbnRlcm5hbClcclxuICAgKi9cclxuICBwdWJsaWMgY2FuY2VsKCk6IHZvaWQge1xyXG4gICAgaWYgKCB0aGlzLmluaXRpYWxpemVkICkge1xyXG4gICAgICB0aGlzLnNwZWFraW5nU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlV3JhcHBlciAmJiB0aGlzLmNhbmNlbFV0dGVyYW5jZSggdGhpcy5zcGVha2luZ1NwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZVdyYXBwZXIudXR0ZXJhbmNlICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYW5jZWwgdGhlIHByb3ZpZGVkIFV0dGVyYW5jZSwgaWYgaXQgaXMgY3VycmVudGx5IGJlaW5nIHNwb2tlbiBieSB0aGlzIEFubm91bmNlci4gRG9lcyBub3QgY2FuY2VsXHJcbiAgICogYW55IG90aGVyIHV0dGVyYW5jZXMgdGhhdCBtYXkgYmUgaW4gdGhlIFV0dGVyYW5jZVF1ZXVlLlxyXG4gICAqICh1dHRlcmFuY2UtcXVldWUgaW50ZXJuYWwpXHJcbiAgICovXHJcbiAgcHVibGljIG92ZXJyaWRlIGNhbmNlbFV0dGVyYW5jZSggdXR0ZXJhbmNlOiBVdHRlcmFuY2UgKTogdm9pZCB7XHJcblxyXG4gICAgY29uc3Qgd3JhcHBlciA9IHRoaXMuc3BlYWtpbmdTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VXcmFwcGVyO1xyXG5cclxuICAgIGlmICggd3JhcHBlciAmJiB1dHRlcmFuY2UgPT09IHdyYXBwZXIudXR0ZXJhbmNlICkge1xyXG4gICAgICB0aGlzLmhhbmRsZVNwZWVjaFN5bnRoZXNpc0VuZCggd3JhcHBlci5hbm5vdW5jZVRleHQsIHdyYXBwZXIgKTtcclxuXHJcbiAgICAgIC8vIHNpbGVuY2UgYWxsIHNwZWVjaCAtIGFmdGVyIGhhbmRsZVNwZWVjaFN5bnRoZXNpc0VuZCBzbyB3ZSBkb24ndCBkbyB0aGF0IHdvcmsgdHdpY2UgaW4gY2FzZSBgY2FuY2VsU3ludGhgXHJcbiAgICAgIC8vIGFsc28gdHJpZ2dlcnMgZW5kIGV2ZW50cyBpbW1lZGlhdGVseSAoYnV0IHRoYXQgZG9lc24ndCBoYXBwZW4gb24gYWxsIGJyb3dzZXJzKVxyXG4gICAgICB0aGlzLmNhbmNlbFN5bnRoKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHaXZlbiBvbmUgdXR0ZXJhbmNlLCBzaG91bGQgaXQgY2FuY2VsIGFub3RoZXIgcHJvdmlkZWQgdXR0ZXJhbmNlP1xyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBzaG91bGRVdHRlcmFuY2VDYW5jZWxPdGhlciggdXR0ZXJhbmNlOiBVdHRlcmFuY2UsIHV0dGVyYW5jZVRvQ2FuY2VsOiBVdHRlcmFuY2UgKTogYm9vbGVhbiB7XHJcblxyXG4gICAgLy8gVXR0ZXJhbmNlLmFubm91bmNlck9wdGlvbnMgbXVzdCBiZSBtb3JlIGdlbmVyYWwgdG8gYWxsb3cgdGhpcyB0eXBlIHRvIGFwcGx5IHRvIGFueSBpbXBsZW1lbnRhdGlvbiBvZiBBbm5vdW5jZXIsIHRodXMgXCJPYmplY3RcIiBhcyB0aGUgcHJvdmlkZWQgb3B0aW9ucy5cclxuICAgIGNvbnN0IHV0dGVyYW5jZU9wdGlvbnMgPSBvcHRpb25pemUzPFNwZWVjaFN5bnRoZXNpc0Fubm91bmNlT3B0aW9ucywgU3BlZWNoU3ludGhlc2lzQW5ub3VuY2VPcHRpb25zPigpKFxyXG4gICAgICB7fSwgVVRURVJBTkNFX09QVElPTl9ERUZBVUxUUywgdXR0ZXJhbmNlLmFubm91bmNlck9wdGlvbnNcclxuICAgICk7XHJcblxyXG4gICAgbGV0IHNob3VsZENhbmNlbDtcclxuICAgIGlmICggdXR0ZXJhbmNlVG9DYW5jZWwucHJpb3JpdHlQcm9wZXJ0eS52YWx1ZSAhPT0gdXR0ZXJhbmNlLnByaW9yaXR5UHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgIHNob3VsZENhbmNlbCA9IHV0dGVyYW5jZVRvQ2FuY2VsLnByaW9yaXR5UHJvcGVydHkudmFsdWUgPCB1dHRlcmFuY2UucHJpb3JpdHlQcm9wZXJ0eS52YWx1ZTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBzaG91bGRDYW5jZWwgPSB1dHRlcmFuY2VPcHRpb25zLmNhbmNlbE90aGVyO1xyXG4gICAgICBpZiAoIHV0dGVyYW5jZVRvQ2FuY2VsICYmIHV0dGVyYW5jZVRvQ2FuY2VsID09PSB1dHRlcmFuY2UgKSB7XHJcbiAgICAgICAgc2hvdWxkQ2FuY2VsID0gdXR0ZXJhbmNlT3B0aW9ucy5jYW5jZWxTZWxmO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHNob3VsZENhbmNlbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZW4gdGhlIHByaW9yaXR5IGZvciBhIG5ldyB1dHRlcmFuY2UgY2hhbmdlcyBvciBpZiBhIG5ldyB1dHRlcmFuY2UgaXMgYWRkZWQgdG8gdGhlIHF1ZXVlLCBkZXRlcm1pbmUgd2hldGhlclxyXG4gICAqIHdlIHNob3VsZCBjYW5jZWwgdGhlIHN5bnRoIGltbWVkaWF0ZWx5LlxyXG4gICAqL1xyXG4gIHB1YmxpYyBvdmVycmlkZSBvblV0dGVyYW5jZVByaW9yaXR5Q2hhbmdlKCBuZXh0QXZhaWxhYmxlVXR0ZXJhbmNlOiBVdHRlcmFuY2UgKTogdm9pZCB7XHJcblxyXG4gICAgLy8gdGVzdCBhZ2FpbnN0IHdoYXQgaXMgY3VycmVudGx5IGJlaW5nIHNwb2tlbiBieSB0aGUgc3ludGhcclxuICAgIGNvbnN0IHdyYXBwZXIgPSB0aGlzLnNwZWFraW5nU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlV3JhcHBlcjtcclxuICAgIGlmICggd3JhcHBlciAmJiB0aGlzLnNob3VsZFV0dGVyYW5jZUNhbmNlbE90aGVyKCBuZXh0QXZhaWxhYmxlVXR0ZXJhbmNlLCB3cmFwcGVyLnV0dGVyYW5jZSApICkge1xyXG4gICAgICB0aGlzLmNhbmNlbFV0dGVyYW5jZSggd3JhcHBlci51dHRlcmFuY2UgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbmNlbCB0aGUgc3ludGguIFRoaXMgd2lsbCBzaWxlbmNlIHNwZWVjaC4gVGhpcyB3aWxsIHNpbGVuY2UgYW55IHNwZWVjaCBhbmQgY2FuY2VsIHRoZVxyXG4gICAqL1xyXG4gIHByaXZhdGUgY2FuY2VsU3ludGgoKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmluaXRpYWxpemVkLCAnbXVzdCBiZSBpbml0aWFsaXplZCB0byB1c2Ugc3ludGgnICk7XHJcbiAgICBjb25zdCBzeW50aCA9IHRoaXMuZ2V0U3ludGgoKSE7XHJcbiAgICBzeW50aCAmJiBzeW50aC5jYW5jZWwoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdHJ1ZSBpZiBTcGVlY2hTeW50aGVzaXMgaXMgYXZhaWxhYmxlIG9uIHRoZSB3aW5kb3cuIFRoaXMgY2hlY2sgaXMgc3VmZmljaWVudCBmb3IgYWxsIG9mXHJcbiAgICogU3BlZWNoU3ludGhlc2lzQW5ub3VuY2VyLiBPbiBwbGF0Zm9ybXMgd2hlcmUgc3BlZWNoU3ludGhlc2lzIGlzIGF2YWlsYWJsZSwgYWxsIGZlYXR1cmVzIG9mIGl0IGFyZSBhdmFpbGFibGUsIGV4Y2VwdCBmb3IgdGhlXHJcbiAgICogb252b2ljZXNjaGFuZ2VkIGV2ZW50IGluIGEgY291cGxlIG9mIHBsYXRmb3Jtcy4gSG93ZXZlciwgdGhlIGxpc3RlbmVyIGNhbiBzdGlsbCBiZSBzZXRcclxuICAgKiB3aXRob3V0IGlzc3VlIG9uIHRob3NlIHBsYXRmb3JtcyBzbyB3ZSBkb24ndCBuZWVkIHRvIGNoZWNrIGZvciBpdHMgZXhpc3RlbmNlLiBPbiB0aG9zZSBwbGF0Zm9ybXMsIHZvaWNlc1xyXG4gICAqIGFyZSBwcm92aWRlZCByaWdodCBvbiBsb2FkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdGF0aWMgaXNTcGVlY2hTeW50aGVzaXNTdXBwb3J0ZWQoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gISF3aW5kb3cuc3BlZWNoU3ludGhlc2lzICYmICEhd2luZG93LlNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBbiBpbm5lciBjbGFzcyB0aGF0IGNvbWJpbmVzIHNvbWUgb2JqZWN0cyB0aGF0IGFyZSBuZWNlc3NhcnkgdG8ga2VlcCB0cmFjayBvZiB0byBkaXNwb3NlXHJcbiAqIFNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZXMgd2hlbiBpdCBpcyB0aW1lLiBJdCBpcyBhbHNvIHVzZWQgZm9yIHRoZSBcIlNhZmFyaSBXb3JrYXJvdW5kXCIgdG8ga2VlcCBhIHJlZmVyZW5jZVxyXG4gKiBvZiB0aGUgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlIGluIG1lbW9yeSBsb25nIGVub3VnaCBmb3IgdGhlICdlbmQnIGV2ZW50IHRvIGJlIGVtaXR0ZWQuXHJcbiAqL1xyXG5jbGFzcyBTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VXcmFwcGVyIHtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHB1YmxpYyByZWFkb25seSB1dHRlcmFuY2U6IFV0dGVyYW5jZSxcclxuICAgICAgICAgICAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBhbm5vdW5jZVRleHQ6IFJlc29sdmVkUmVzcG9uc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgc3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlOiBTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICBwdWJsaWMgc3RhcnRlZDogYm9vbGVhbixcclxuICAgICAgICAgICAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBlbmRMaXN0ZW5lcjogKCkgPT4gdm9pZCxcclxuICAgICAgICAgICAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBzdGFydExpc3RlbmVyOiAoKSA9PiB2b2lkICkge1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFJlbW92ZSA8YnI+IG9yIDxici8+IHRhZ3MgZnJvbSBhIHN0cmluZ1xyXG4gKiBAcGFyYW0gc3RyaW5nIC0gcGxhaW4gdGV4dCBvciBodG1sIHN0cmluZ1xyXG4gKi9cclxuZnVuY3Rpb24gcmVtb3ZlQnJUYWdzKCBzdHJpbmc6IHN0cmluZyApOiBzdHJpbmcge1xyXG4gIHJldHVybiBzdHJpbmcuc3BsaXQoICc8YnIvPicgKS5qb2luKCAnICcgKS5zcGxpdCggJzxicj4nICkuam9pbiggJyAnICk7XHJcbn1cclxuXHJcbmNvbnN0IFNwZWVjaFN5bnRoZXNpc1ZvaWNlSU8gPSBuZXcgSU9UeXBlKCAnU3BlZWNoU3ludGhlc2lzVm9pY2VJTycsIHtcclxuICBpc1ZhbGlkVmFsdWU6IHYgPT4gdHJ1ZSwgLy8gU3BlZWNoU3ludGhlc2lzVm9pY2UgaXMgbm90IGF2YWlsYWJsZSBvbiB3aW5kb3dcclxuICB0b1N0YXRlT2JqZWN0OiBzcGVlY2hTeW50aGVzaXNWb2ljZSA9PiBzcGVlY2hTeW50aGVzaXNWb2ljZS5uYW1lXHJcbn0gKTtcclxuXHJcbnV0dGVyYW5jZVF1ZXVlTmFtZXNwYWNlLnJlZ2lzdGVyKCAnU3BlZWNoU3ludGhlc2lzQW5ub3VuY2VyJywgU3BlZWNoU3ludGhlc2lzQW5ub3VuY2VyICk7XHJcbmV4cG9ydCBkZWZhdWx0IFNwZWVjaFN5bnRoZXNpc0Fubm91bmNlcjsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLGVBQWUsTUFBTSxrQ0FBa0M7QUFDOUQsT0FBT0MsZUFBZSxNQUFNLGtDQUFrQztBQUM5RCxPQUFPQyxPQUFPLE1BQU0sMEJBQTBCO0FBQzlDLE9BQU9DLGdCQUFnQixNQUFNLG1DQUFtQztBQUdoRSxPQUFPQyxjQUFjLE1BQU0saUNBQWlDO0FBQzVELE9BQU9DLFFBQVEsTUFBTSwyQkFBMkI7QUFDaEQsT0FBT0MsS0FBSyxNQUFNLHVCQUF1QjtBQUN6QyxPQUFPQyxTQUFTLElBQUlDLFVBQVUsUUFBMkIsaUNBQWlDO0FBQzFGLE9BQU9DLG1CQUFtQixNQUFNLDJDQUEyQztB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