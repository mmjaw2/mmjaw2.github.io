// Copyright 2018-2024, University of Colorado Boulder

/**
 * A singleton object that registers sound generators, connects them to the audio output, and provides a number of
 * related services, such as:
 *  - main enable/disable
 *  - main gain control
 *  - enable/disable of sounds based on visibility of an associated Scenery node
 *  - enable/disable of sounds based on their assigned sonification level (e.g. "basic" or "extra")
 *  - gain control for sounds based on their assigned category, e.g. UI versus sim-specific sounds
 *  - a shared reverb unit to add some spatialization and make all sounds seem to originate with the same space
 *
 *  The singleton object must be initialized before sound generators can be added.
 *
 *  @author John Blanco (PhET Interactive Simulations)
 */

import BooleanProperty from '../../axon/js/BooleanProperty.js';
import Utils from '../../dot/js/Utils.js';
import { Display, DisplayedProperty } from '../../scenery/js/imports.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';
import emptyApartmentBedroom06Resampled_mp3 from '../sounds/emptyApartmentBedroom06Resampled_mp3.js';
import audioContextStateChangeMonitor from './audioContextStateChangeMonitor.js';
import phetAudioContext from './phetAudioContext.js';
import soundConstants from './soundConstants.js';
import SoundLevelEnum from './SoundLevelEnum.js';
import tambo from './tambo.js';
import optionize from '../../phet-core/js/optionize.js';
import Multilink from '../../axon/js/Multilink.js';
import arrayRemove from '../../phet-core/js/arrayRemove.js';
import createObservableArray from '../../axon/js/createObservableArray.js';

// constants
const AUDIO_DUCKING_LEVEL = 0.15; // gain value to use for the ducking gain node when ducking is active

// options that can be used when adding a sound generator that can control some aspects of its behavior

// sound generators that are queued up and waiting to be added when initialization is complete

// sound generator with its sonification level

// constants
const DEFAULT_REVERB_LEVEL = 0.02;
const LINEAR_GAIN_CHANGE_TIME = soundConstants.DEFAULT_LINEAR_GAIN_CHANGE_TIME; // in seconds
const GAIN_LOGGING_ENABLED = false;
class SoundManager extends PhetioObject {
  // global enabled state for sound generation

  // enabled state for extra sounds

  // an array where the sound generators are stored along with information about how to manage them

  // output level for the main gain node when sonification is enabled

  // reverb level, needed because some browsers don't support reading of gain values, see methods for more info

  // A map of category names to GainNode instances that control gains for that category name.  This filled in during
  // initialization, see the usage of options.categories in the initialize function for more information.

  // an array of properties where, if any of these are true, overall output level is "ducked" (i.e. reduced)

  // flag that tracks whether the sonification manager has been initialized, should never be set outside this file

  // sound generators that are queued up if attempts are made to add them before initialization has occurred

  // audio nodes that are used in the signal chain between sound generators and the audio context destination

  // a Map object that keeps track of DisplayedProperty instances that can be associated with the sound generator
  viewNodeDisplayedPropertyMap = new Map();
  constructor(tandem) {
    super({
      tandem: tandem,
      phetioState: false,
      phetioDocumentation: 'Controls the simulation\'s sound. For sims that do not support sound, this element and ' + 'its children can be ignored.'
    });
    this.enabledProperty = new BooleanProperty(phet?.chipper?.queryParameters?.supportsSound || false, {
      tandem: tandem?.createTandem('enabledProperty'),
      phetioState: false,
      // This is a preference, global sound control is handled by the audioManager
      phetioDocumentation: 'Determines whether sound is enabled. Supported only if this sim supportsSound=true.'
    });
    this.extraSoundEnabledProperty = new BooleanProperty(phet?.chipper?.queryParameters?.extraSoundInitiallyEnabled || false, {
      tandem: tandem?.createTandem('extraSoundEnabledProperty'),
      phetioState: false,
      // This is a preference, global sound control is handled by the audioManager
      phetioDocumentation: 'Determines whether extra sound is enabled. Extra sound is additional sounds that ' + 'can serve to improve the learning experience for individuals with visual disabilities. ' + 'Note that not all simulations that support sound also support extra sound. Also note ' + 'that the value is irrelevant when enabledProperty is false.'
    });
    this.soundGeneratorInfoArray = [];
    this._mainOutputLevel = 1;
    this._reverbLevel = DEFAULT_REVERB_LEVEL;
    this.gainNodesForCategories = new Map();
    this.duckingProperties = createObservableArray();
    this.initialized = false;
    this.soundGeneratorsAwaitingAdd = [];
    this.mainGainNode = null;
    this.duckingGainNode = null;
    this.convolver = null;
    this.reverbGainNode = null;
    this.dryGainNode = null;
  }

  /**
   * Initialize the sonification manager. This function must be invoked before any sound generators can be added.
   */
  initialize(simConstructionCompleteProperty, audioEnabledProperty, simVisibleProperty, simActiveProperty, simSettingPhetioStateProperty, providedOptions) {
    assert && assert(!this.initialized, 'can\'t initialize the sound manager more than once');
    const options = optionize()({
      categories: ['sim-specific', 'user-interface']
    }, providedOptions);

    // options validation
    assert && assert(options.categories.length === _.uniq(options.categories).length, 'categories must be unique');
    const now = phetAudioContext.currentTime;

    // The final stage is a dynamics compressor that is used essentially as a limiter to prevent clipping.
    const dynamicsCompressor = phetAudioContext.createDynamicsCompressor();
    dynamicsCompressor.threshold.setValueAtTime(-6, now);
    dynamicsCompressor.knee.setValueAtTime(5, now);
    dynamicsCompressor.ratio.setValueAtTime(12, now);
    dynamicsCompressor.attack.setValueAtTime(0, now);
    dynamicsCompressor.release.setValueAtTime(0.25, now);
    dynamicsCompressor.connect(phetAudioContext.destination);

    // Create the ducking gain node, which is used to reduce the overall sound output level temporarily in certain
    // situations, such as when the voicing feature is actively producing speech.
    this.duckingGainNode = phetAudioContext.createGain();
    this.duckingGainNode.connect(dynamicsCompressor);

    // Create the main gain node for all sounds managed by this sonification manager.
    this.mainGainNode = phetAudioContext.createGain();
    this.mainGainNode.connect(this.duckingGainNode);

    // Set up a convolver node, which will be used to create the reverb effect.
    this.convolver = phetAudioContext.createConvolver();
    const setConvolverBuffer = audioBuffer => {
      if (audioBuffer) {
        this.convolver.buffer = audioBuffer;
        emptyApartmentBedroom06Resampled_mp3.audioBufferProperty.unlink(setConvolverBuffer);
      }
    };
    emptyApartmentBedroom06Resampled_mp3.audioBufferProperty.link(setConvolverBuffer);

    // gain node that will control the reverb level
    this.reverbGainNode = phetAudioContext.createGain();
    this.reverbGainNode.connect(this.mainGainNode);
    this.reverbGainNode.gain.setValueAtTime(this._reverbLevel, phetAudioContext.currentTime);
    this.convolver.connect(this.reverbGainNode);

    // dry (non-reverbed) portion of the output
    this.dryGainNode = phetAudioContext.createGain();
    this.dryGainNode.gain.setValueAtTime(1 - this._reverbLevel, phetAudioContext.currentTime);
    this.dryGainNode.gain.linearRampToValueAtTime(1 - this._reverbLevel, phetAudioContext.currentTime + LINEAR_GAIN_CHANGE_TIME);
    this.dryGainNode.connect(this.mainGainNode);

    // Create and hook up gain nodes for each of the defined categories.
    assert && assert(this.convolver !== null && this.dryGainNode !== null, 'some audio nodes have not been initialized');
    options.categories.forEach(categoryName => {
      const gainNode = phetAudioContext.createGain();
      gainNode.connect(this.convolver);
      gainNode.connect(this.dryGainNode);
      this.gainNodesForCategories.set(categoryName, gainNode);
    });

    // Hook up a listener that turns down the main gain if sonification is disabled or if the sim isn't visible or
    // isn't active.
    Multilink.multilink([this.enabledProperty, audioEnabledProperty, simConstructionCompleteProperty, simVisibleProperty, simActiveProperty, simSettingPhetioStateProperty], (enabled, audioEnabled, simInitComplete, simVisible, simActive, simSettingPhetioState) => {
      const fullyEnabled = enabled && audioEnabled && simInitComplete && simVisible && simActive && !simSettingPhetioState;
      const gain = fullyEnabled ? this._mainOutputLevel : 0;

      // Set the gain, but somewhat gradually in order to avoid rapid transients, which can sound like clicks.
      this.mainGainNode.gain.linearRampToValueAtTime(gain, phetAudioContext.currentTime + LINEAR_GAIN_CHANGE_TIME);
    });
    const duckMainOutputLevelProperty = new BooleanProperty(false);

    // Define a listener that will update the state of the collective ducking Property that indicates whether ducking
    // (overall volume reduction to prevent overlap with other sounds) should be active or inactive.
    const updateDuckingState = () => {
      // Reduce the array of individual ducking Properties array to a single boolean value.
      duckMainOutputLevelProperty.value = this.duckingProperties.reduce((valueSoFar, currentProperty) => valueSoFar || currentProperty.value, false);
    };

    // Implement ducking of the main output.
    duckMainOutputLevelProperty.lazyLink(duckOutput => {
      // State checking - make sure the ducking gain node exists.
      assert && assert(this.duckingGainNode, 'ducking listener fired, but no ducking gain node exists');

      // Use time constant values that will turn down the output level faster than it will turn it up.  This sounds
      // better, since it prevents overlap with the voice.
      const timeConstant = duckOutput ? 0.05 : 0.5;

      // Duck or don't.
      const now = phetAudioContext.currentTime;
      this.duckingGainNode?.gain.cancelScheduledValues(now);
      this.duckingGainNode?.gain.setTargetAtTime(duckOutput ? AUDIO_DUCKING_LEVEL : 1, now, timeConstant);
    });

    // Handle the adding and removal of individual ducking Properties.
    this.duckingProperties.addItemAddedListener(addedDuckingProperty => {
      addedDuckingProperty.link(updateDuckingState);
      const checkAndRemove = removedDuckingProperty => {
        if (removedDuckingProperty === addedDuckingProperty) {
          removedDuckingProperty.unlink(updateDuckingState);
          this.duckingProperties.removeItemRemovedListener(checkAndRemove);
        }
      };
      this.duckingProperties.addItemRemovedListener(checkAndRemove);
    });

    //------------------------------------------------------------------------------------------------------------------
    // Handle the audio context state, both when changes occur and when it is initially muted due to the autoplay
    // policy.  As of this writing (Feb 2019), there are some differences in how the audio context state behaves on
    // different platforms, so the code monitors different events and states to keep the audio context running.  As the
    // behavior of the audio context becomes more consistent across browsers, it may be possible to simplify this.
    //------------------------------------------------------------------------------------------------------------------

    // function to remove the user interaction listeners, used to avoid code duplication
    const removeUserInteractionListeners = () => {
      window.removeEventListener('touchstart', resumeAudioContext, false);
      if (Display.userGestureEmitter.hasListener(resumeAudioContext)) {
        Display.userGestureEmitter.removeListener(resumeAudioContext);
      }
    };

    // listener that resumes the audio context
    const resumeAudioContext = () => {
      if (phetAudioContext.state !== 'running') {
        phet.log && phet.log(`audio context not running, attempting to resume, state = ${phetAudioContext.state}`);

        // tell the audio context to resume
        phetAudioContext.resume().then(() => {
          phet.log && phet.log(`resume appears to have succeeded, phetAudioContext.state = ${phetAudioContext.state}`);
          removeUserInteractionListeners();
        }).catch(err => {
          const errorMessage = `error when trying to resume audio context, err = ${err}`;
          console.error(errorMessage);
          assert && alert(errorMessage);
        });
      } else {
        // audio context is already running, no need to listen anymore
        removeUserInteractionListeners();
      }
    };

    // listen for a touchstart - this only works to resume the audio context on iOS devices (as of this writing)
    window.addEventListener('touchstart', resumeAudioContext, false);

    // listen for other user gesture events
    Display.userGestureEmitter.addListener(resumeAudioContext);

    // During testing, several use cases were found where the audio context state changes to something other than the
    // "running" state while the sim is in use (generally either "suspended" or "interrupted", depending on the
    // browser).  The following code is intended to handle this situation by trying to resume it right away.  GitHub
    // issues with details about why this is necessary are:
    // - https://github.com/phetsims/tambo/issues/58
    // - https://github.com/phetsims/tambo/issues/59
    // - https://github.com/phetsims/fractions-common/issues/82
    // - https://github.com/phetsims/friction/issues/173
    // - https://github.com/phetsims/resistance-in-a-wire/issues/190
    // - https://github.com/phetsims/tambo/issues/90
    let previousAudioContextState = phetAudioContext.state;
    audioContextStateChangeMonitor.addStateChangeListener(phetAudioContext, state => {
      phet.log && phet.log(`audio context state changed, old state = ${previousAudioContextState}, new state = ${state}, audio context time = ${phetAudioContext.currentTime}`);
      if (state !== 'running') {
        // Add a listener that will resume the audio context on the next touchstart.
        window.addEventListener('touchstart', resumeAudioContext, false);

        // Listen also for other user gesture events that can be used to resume the audio context.
        if (!Display.userGestureEmitter.hasListener(resumeAudioContext)) {
          Display.userGestureEmitter.addListener(resumeAudioContext);
        }
      } else {
        console.log('AudioContext is now running.');
      }
      previousAudioContextState = state;
    });
    this.initialized = true;

    // Add any sound generators that were waiting for initialization to complete (must be done after init complete).
    this.soundGeneratorsAwaitingAdd.forEach(soundGeneratorAwaitingAdd => {
      this.addSoundGenerator(soundGeneratorAwaitingAdd.soundGenerator, soundGeneratorAwaitingAdd.soundGeneratorAddOptions);
    });
    this.soundGeneratorsAwaitingAdd.length = 0;
  }

  /**
   * Returns true if the specified soundGenerator has been previously added to the soundManager.
   */
  hasSoundGenerator(soundGenerator) {
    return _.some(this.soundGeneratorInfoArray, soundGeneratorInfo => soundGeneratorInfo.soundGenerator === soundGenerator);
  }

  /**
   * Add a sound generator.  This connects the sound generator to the audio path, puts it on the list of sound
   * generators, and creates and returns a unique ID.
   */
  addSoundGenerator(soundGenerator, providedOptions) {
    // We'll need an empty object of no options were provided.
    if (providedOptions === undefined) {
      providedOptions = {};
    }

    // Check if initialization has been done and, if not, queue the sound generator and its options for addition
    // once initialization is complete.  Note that when sound is not supported, initialization will never occur.
    if (!this.initialized) {
      this.soundGeneratorsAwaitingAdd.push({
        soundGenerator: soundGenerator,
        soundGeneratorAddOptions: providedOptions
      });
      return;
    }

    // state checking - make sure the needed nodes have been created
    assert && assert(this.convolver !== null && this.dryGainNode !== null, 'some audio nodes have not been initialized');

    // Verify that this is not a duplicate addition.
    const hasSoundGenerator = this.hasSoundGenerator(soundGenerator);
    assert && assert(!hasSoundGenerator, 'can\'t add the same sound generator twice');

    // default options
    const options = optionize()({
      sonificationLevel: SoundLevelEnum.BASIC,
      associatedViewNode: null,
      categoryName: null
    }, providedOptions);

    // option validation
    assert && assert(_.includes(_.values(SoundLevelEnum), options.sonificationLevel), `invalid value for sonification level: ${options.sonificationLevel}`);

    // Connect the sound generator to an output path.
    if (options.categoryName === null) {
      soundGenerator.connect(this.convolver);
      soundGenerator.connect(this.dryGainNode);
    } else {
      assert && assert(this.gainNodesForCategories.has(options.categoryName), `category does not exist : ${options.categoryName}`);
      soundGenerator.connect(this.gainNodesForCategories.get(options.categoryName));
    }

    // Keep a record of the sound generator along with additional information about it.
    const soundGeneratorInfo = {
      soundGenerator: soundGenerator,
      sonificationLevel: options.sonificationLevel
    };
    this.soundGeneratorInfoArray.push(soundGeneratorInfo);

    // Add the global enable Property to the list of Properties that enable this sound generator.
    soundGenerator.addEnableControlProperty(this.enabledProperty);

    // If this sound generator is only enabled in extra mode, add the extra mode Property as an enable-control.
    if (options.sonificationLevel === SoundLevelEnum.EXTRA) {
      soundGenerator.addEnableControlProperty(this.extraSoundEnabledProperty);
    }

    // If a view node was specified, create and pass in a boolean Property that is true only when the node is displayed.
    if (options.associatedViewNode) {
      const viewNodeDisplayedProperty = new DisplayedProperty(options.associatedViewNode);
      soundGenerator.addEnableControlProperty(viewNodeDisplayedProperty);

      // Keep track of this DisplayedProperty instance so that it can be disposed if the sound generator is disposed.
      this.viewNodeDisplayedPropertyMap.set(soundGenerator, viewNodeDisplayedProperty);
    }
  }

  /**
   * Remove the specified sound generator.
   */
  removeSoundGenerator(soundGenerator) {
    // Check if the sound manager is initialized and, if not, issue a warning and ignore the request.  This is not an
    // assertion because the sound manager may not be initialized in cases where the sound is not enabled for the
    // simulation, but this method can still end up being invoked.
    if (!this.initialized) {
      const toRemove = this.soundGeneratorsAwaitingAdd.filter(s => s.soundGenerator === soundGenerator);
      assert && assert(toRemove.length > 0, 'unable to remove sound generator - not found');
      while (toRemove.length > 0) {
        arrayRemove(this.soundGeneratorsAwaitingAdd, toRemove[0]);
        toRemove.shift();
      }
      return;
    }

    // find the info object for this sound generator
    let soundGeneratorInfo = null;
    for (let i = 0; i < this.soundGeneratorInfoArray.length; i++) {
      if (this.soundGeneratorInfoArray[i].soundGenerator === soundGenerator) {
        // found it
        soundGeneratorInfo = this.soundGeneratorInfoArray[i];
        break;
      }
    }

    // make sure it is actually present on the list
    assert && assert(soundGeneratorInfo, 'unable to remove sound generator - not found');

    // disconnect the sound generator from any audio nodes to which it may be connected
    if (soundGenerator.isConnectedTo(this.convolver)) {
      soundGenerator.disconnect(this.convolver);
    }
    if (soundGenerator.isConnectedTo(this.dryGainNode)) {
      soundGenerator.disconnect(this.dryGainNode);
    }
    this.gainNodesForCategories.forEach(gainNode => {
      if (soundGenerator.isConnectedTo(gainNode)) {
        soundGenerator.disconnect(gainNode);
      }
    });

    // Remove the sound generator from the list.
    if (soundGeneratorInfo) {
      this.soundGeneratorInfoArray.splice(this.soundGeneratorInfoArray.indexOf(soundGeneratorInfo), 1);
    }

    // Clean up created DisplayedProperties that were created for the associated soundGenerator
    if (this.viewNodeDisplayedPropertyMap.has(soundGenerator)) {
      this.viewNodeDisplayedPropertyMap.get(soundGenerator).dispose();
      this.viewNodeDisplayedPropertyMap.delete(soundGenerator);
    }
  }

  /**
   * Set the main output level for sounds.
   * @param level - valid values from 0 (min) through 1 (max)
   */
  setMainOutputLevel(level) {
    // Check if initialization has been done.  This is not an assertion because the sound manager may not be
    // initialized if sound is not enabled for the sim.
    if (!this.initialized) {
      console.warn('an attempt was made to set the main output level on an uninitialized sound manager, ignoring');
      return;
    }

    // range check
    assert && assert(level >= 0 && level <= 1, `output level value out of range: ${level}`);
    this._mainOutputLevel = level;
    if (this.enabledProperty.value) {
      this.mainGainNode.gain.linearRampToValueAtTime(level, phetAudioContext.currentTime + LINEAR_GAIN_CHANGE_TIME);
    }
  }
  set mainOutputLevel(outputLevel) {
    this.setMainOutputLevel(outputLevel);
  }
  get mainOutputLevel() {
    return this.getMainOutputLevel();
  }

  /**
   * Get the current output level setting.
   */
  getMainOutputLevel() {
    return this._mainOutputLevel;
  }

  /**
   * Set the output level for the specified category of sound generator.
   * @param categoryName - name of category to which this invocation applies
   * @param outputLevel - valid values from 0 through 1
   */
  setOutputLevelForCategory(categoryName, outputLevel) {
    // Check if initialization has been done.  This is not an assertion because the sound manager may not be
    // initialized if sound is not enabled for the sim.
    if (!this.initialized) {
      console.warn('an attempt was made to set the output level for a sound category on an uninitialized sound manager, ignoring');
      return;
    }
    assert && assert(this.initialized, 'output levels for categories cannot be added until initialization has been done');

    // range check
    assert && assert(outputLevel >= 0 && outputLevel <= 1, `output level value out of range: ${outputLevel}`);

    // verify that the specified category exists
    assert && assert(this.gainNodesForCategories.get(categoryName), `no category with name = ${categoryName}`);

    // Set the gain value on the appropriate gain node.
    const gainNode = this.gainNodesForCategories.get(categoryName);
    if (gainNode) {
      gainNode.gain.setValueAtTime(outputLevel, phetAudioContext.currentTime);
    }
  }

  /**
   * Add a ducking Property.  When any of the ducking Properties are true, the output level will be "ducked", meaning
   * that it will be reduced.
   */
  addDuckingProperty(duckingProperty) {
    this.duckingProperties.add(duckingProperty);
  }

  /**
   * Remove a ducking Property that had been previously added.
   */
  removeDuckingProperty(duckingProperty) {
    assert && assert(this.duckingProperties.includes(duckingProperty), 'ducking Property not present');
    this.duckingProperties.remove(duckingProperty);
  }

  /**
   * Get the output level for the specified sound generator category.
   * @param categoryName - name of category to which this invocation applies
   */
  getOutputLevelForCategory(categoryName) {
    // Check if initialization has been done.  This is not an assertion because the sound manager may not be
    // initialized if sound is not enabled for the sim.
    if (!this.initialized) {
      console.warn('an attempt was made to get the output level for a sound category on an uninitialized sound manager, returning 0');
      return 0;
    }

    // Get the GainNode for the specified category.
    const gainNode = this.gainNodesForCategories.get(categoryName);
    assert && assert(gainNode, `no category with name = ${categoryName}`);
    return gainNode.gain.value;
  }

  /**
   * Set the amount of reverb.
   * @param newReverbLevel - value from 0 to 1, 0 = totally dry, 1 = wet
   */
  setReverbLevel(newReverbLevel) {
    // Check if initialization has been done.  This is not an assertion because the sound manager may not be
    // initialized if sound is not enabled for the sim.
    if (!this.initialized) {
      console.warn('an attempt was made to set the reverb level on an uninitialized sound manager, ignoring');
      return;
    }
    if (newReverbLevel !== this._reverbLevel) {
      assert && assert(newReverbLevel >= 0 && newReverbLevel <= 1, `reverb value out of range: ${newReverbLevel}`);
      const now = phetAudioContext.currentTime;
      this.reverbGainNode.gain.linearRampToValueAtTime(newReverbLevel, now + LINEAR_GAIN_CHANGE_TIME);
      this.dryGainNode.gain.linearRampToValueAtTime(1 - newReverbLevel, now + LINEAR_GAIN_CHANGE_TIME);
      this._reverbLevel = newReverbLevel;
    }
  }
  set reverbLevel(reverbLevel) {
    this.setReverbLevel(reverbLevel);
  }
  get reverbLevel() {
    return this.getReverbLevel();
  }
  getReverbLevel() {
    return this._reverbLevel;
  }
  set enabled(enabled) {
    this.enabledProperty.value = enabled;
  }
  get enabled() {
    return this.enabledProperty.value;
  }
  set sonificationLevel(sonificationLevel) {
    this.extraSoundEnabledProperty.value = sonificationLevel === SoundLevelEnum.EXTRA;
  }

  /**
   * ES5 getter for sonification level
   */
  get sonificationLevel() {
    return this.extraSoundEnabledProperty.value ? SoundLevelEnum.EXTRA : SoundLevelEnum.BASIC;
  }

  /**
   * Log the value of the gain parameter at every animation frame for the specified duration.  This is useful for
   * debugging, because these parameters change over time when set using methods like "setTargetAtTime", and the
   * details of how they change seems to be different on the different browsers.
   *
   * It may be possible to remove this method someday once the behavior is more consistent across browsers.  See
   * https://github.com/phetsims/resistance-in-a-wire/issues/205 for some history on this.
   *
   * @param gainNode
   * @param duration - duration for logging, in seconds
   */
  logGain(gainNode, duration) {
    duration = duration || 1;
    const startTime = Date.now();

    // closure that will be invoked multiple times to log the changing values
    function logGain() {
      const now = Date.now();
      const timeInMilliseconds = now - startTime;
      console.log(`Time (ms): ${Utils.toFixed(timeInMilliseconds, 2)}, Gain Value: ${gainNode.gain.value}`);
      if (now - startTime < duration * 1000) {
        window.requestAnimationFrame(logGain);
      }
    }
    if (GAIN_LOGGING_ENABLED) {
      // kick off the logging
      console.log('------- start of gain logging -----');
      logGain();
    }
  }

  /**
   * Log the value of the main gain as it changes, used primarily for debug.
   * @param duration - in seconds
   */
  logMainGain(duration) {
    if (this.mainGainNode) {
      this.logGain(this.mainGainNode, duration);
    }
  }

  /**
   * Log the value of the reverb gain as it changes, used primarily for debug.
   * @param duration - duration for logging, in seconds
   */
  logReverbGain(duration) {
    if (this.reverbGainNode) {
      this.logGain(this.reverbGainNode, duration);
    }
  }
}
const soundManager = new SoundManager();
tambo.register('soundManager', soundManager);
export default soundManager;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCb29sZWFuUHJvcGVydHkiLCJVdGlscyIsIkRpc3BsYXkiLCJEaXNwbGF5ZWRQcm9wZXJ0eSIsIlBoZXRpb09iamVjdCIsImVtcHR5QXBhcnRtZW50QmVkcm9vbTA2UmVzYW1wbGVkX21wMyIsImF1ZGlvQ29udGV4dFN0YXRlQ2hhbmdlTW9uaXRvciIsInBoZXRBdWRpb0NvbnRleHQiLCJzb3VuZENvbnN0YW50cyIsIlNvdW5kTGV2ZWxFbnVtIiwidGFtYm8iLCJvcHRpb25pemUiLCJNdWx0aWxpbmsiLCJhcnJheVJlbW92ZSIsImNyZWF0ZU9ic2VydmFibGVBcnJheSIsIkFVRElPX0RVQ0tJTkdfTEVWRUwiLCJERUZBVUxUX1JFVkVSQl9MRVZFTCIsIkxJTkVBUl9HQUlOX0NIQU5HRV9USU1FIiwiREVGQVVMVF9MSU5FQVJfR0FJTl9DSEFOR0VfVElNRSIsIkdBSU5fTE9HR0lOR19FTkFCTEVEIiwiU291bmRNYW5hZ2VyIiwidmlld05vZGVEaXNwbGF5ZWRQcm9wZXJ0eU1hcCIsIk1hcCIsImNvbnN0cnVjdG9yIiwidGFuZGVtIiwicGhldGlvU3RhdGUiLCJwaGV0aW9Eb2N1bWVudGF0aW9uIiwiZW5hYmxlZFByb3BlcnR5IiwicGhldCIsImNoaXBwZXIiLCJxdWVyeVBhcmFtZXRlcnMiLCJzdXBwb3J0c1NvdW5kIiwiY3JlYXRlVGFuZGVtIiwiZXh0cmFTb3VuZEVuYWJsZWRQcm9wZXJ0eSIsImV4dHJhU291bmRJbml0aWFsbHlFbmFibGVkIiwic291bmRHZW5lcmF0b3JJbmZvQXJyYXkiLCJfbWFpbk91dHB1dExldmVsIiwiX3JldmVyYkxldmVsIiwiZ2Fpbk5vZGVzRm9yQ2F0ZWdvcmllcyIsImR1Y2tpbmdQcm9wZXJ0aWVzIiwiaW5pdGlhbGl6ZWQiLCJzb3VuZEdlbmVyYXRvcnNBd2FpdGluZ0FkZCIsIm1haW5HYWluTm9kZSIsImR1Y2tpbmdHYWluTm9kZSIsImNvbnZvbHZlciIsInJldmVyYkdhaW5Ob2RlIiwiZHJ5R2Fpbk5vZGUiLCJpbml0aWFsaXplIiwic2ltQ29uc3RydWN0aW9uQ29tcGxldGVQcm9wZXJ0eSIsImF1ZGlvRW5hYmxlZFByb3BlcnR5Iiwic2ltVmlzaWJsZVByb3BlcnR5Iiwic2ltQWN0aXZlUHJvcGVydHkiLCJzaW1TZXR0aW5nUGhldGlvU3RhdGVQcm9wZXJ0eSIsInByb3ZpZGVkT3B0aW9ucyIsImFzc2VydCIsIm9wdGlvbnMiLCJjYXRlZ29yaWVzIiwibGVuZ3RoIiwiXyIsInVuaXEiLCJub3ciLCJjdXJyZW50VGltZSIsImR5bmFtaWNzQ29tcHJlc3NvciIsImNyZWF0ZUR5bmFtaWNzQ29tcHJlc3NvciIsInRocmVzaG9sZCIsInNldFZhbHVlQXRUaW1lIiwia25lZSIsInJhdGlvIiwiYXR0YWNrIiwicmVsZWFzZSIsImNvbm5lY3QiLCJkZXN0aW5hdGlvbiIsImNyZWF0ZUdhaW4iLCJjcmVhdGVDb252b2x2ZXIiLCJzZXRDb252b2x2ZXJCdWZmZXIiLCJhdWRpb0J1ZmZlciIsImJ1ZmZlciIsImF1ZGlvQnVmZmVyUHJvcGVydHkiLCJ1bmxpbmsiLCJsaW5rIiwiZ2FpbiIsImxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lIiwiZm9yRWFjaCIsImNhdGVnb3J5TmFtZSIsImdhaW5Ob2RlIiwic2V0IiwibXVsdGlsaW5rIiwiZW5hYmxlZCIsImF1ZGlvRW5hYmxlZCIsInNpbUluaXRDb21wbGV0ZSIsInNpbVZpc2libGUiLCJzaW1BY3RpdmUiLCJzaW1TZXR0aW5nUGhldGlvU3RhdGUiLCJmdWxseUVuYWJsZWQiLCJkdWNrTWFpbk91dHB1dExldmVsUHJvcGVydHkiLCJ1cGRhdGVEdWNraW5nU3RhdGUiLCJ2YWx1ZSIsInJlZHVjZSIsInZhbHVlU29GYXIiLCJjdXJyZW50UHJvcGVydHkiLCJsYXp5TGluayIsImR1Y2tPdXRwdXQiLCJ0aW1lQ29uc3RhbnQiLCJjYW5jZWxTY2hlZHVsZWRWYWx1ZXMiLCJzZXRUYXJnZXRBdFRpbWUiLCJhZGRJdGVtQWRkZWRMaXN0ZW5lciIsImFkZGVkRHVja2luZ1Byb3BlcnR5IiwiY2hlY2tBbmRSZW1vdmUiLCJyZW1vdmVkRHVja2luZ1Byb3BlcnR5IiwicmVtb3ZlSXRlbVJlbW92ZWRMaXN0ZW5lciIsImFkZEl0ZW1SZW1vdmVkTGlzdGVuZXIiLCJyZW1vdmVVc2VySW50ZXJhY3Rpb25MaXN0ZW5lcnMiLCJ3aW5kb3ciLCJyZW1vdmVFdmVudExpc3RlbmVyIiwicmVzdW1lQXVkaW9Db250ZXh0IiwidXNlckdlc3R1cmVFbWl0dGVyIiwiaGFzTGlzdGVuZXIiLCJyZW1vdmVMaXN0ZW5lciIsInN0YXRlIiwibG9nIiwicmVzdW1lIiwidGhlbiIsImNhdGNoIiwiZXJyIiwiZXJyb3JNZXNzYWdlIiwiY29uc29sZSIsImVycm9yIiwiYWxlcnQiLCJhZGRFdmVudExpc3RlbmVyIiwiYWRkTGlzdGVuZXIiLCJwcmV2aW91c0F1ZGlvQ29udGV4dFN0YXRlIiwiYWRkU3RhdGVDaGFuZ2VMaXN0ZW5lciIsInNvdW5kR2VuZXJhdG9yQXdhaXRpbmdBZGQiLCJhZGRTb3VuZEdlbmVyYXRvciIsInNvdW5kR2VuZXJhdG9yIiwic291bmRHZW5lcmF0b3JBZGRPcHRpb25zIiwiaGFzU291bmRHZW5lcmF0b3IiLCJzb21lIiwic291bmRHZW5lcmF0b3JJbmZvIiwidW5kZWZpbmVkIiwicHVzaCIsInNvbmlmaWNhdGlvbkxldmVsIiwiQkFTSUMiLCJhc3NvY2lhdGVkVmlld05vZGUiLCJpbmNsdWRlcyIsInZhbHVlcyIsImhhcyIsImdldCIsImFkZEVuYWJsZUNvbnRyb2xQcm9wZXJ0eSIsIkVYVFJBIiwidmlld05vZGVEaXNwbGF5ZWRQcm9wZXJ0eSIsInJlbW92ZVNvdW5kR2VuZXJhdG9yIiwidG9SZW1vdmUiLCJmaWx0ZXIiLCJzIiwic2hpZnQiLCJpIiwiaXNDb25uZWN0ZWRUbyIsImRpc2Nvbm5lY3QiLCJzcGxpY2UiLCJpbmRleE9mIiwiZGlzcG9zZSIsImRlbGV0ZSIsInNldE1haW5PdXRwdXRMZXZlbCIsImxldmVsIiwid2FybiIsIm1haW5PdXRwdXRMZXZlbCIsIm91dHB1dExldmVsIiwiZ2V0TWFpbk91dHB1dExldmVsIiwic2V0T3V0cHV0TGV2ZWxGb3JDYXRlZ29yeSIsImFkZER1Y2tpbmdQcm9wZXJ0eSIsImR1Y2tpbmdQcm9wZXJ0eSIsImFkZCIsInJlbW92ZUR1Y2tpbmdQcm9wZXJ0eSIsInJlbW92ZSIsImdldE91dHB1dExldmVsRm9yQ2F0ZWdvcnkiLCJzZXRSZXZlcmJMZXZlbCIsIm5ld1JldmVyYkxldmVsIiwicmV2ZXJiTGV2ZWwiLCJnZXRSZXZlcmJMZXZlbCIsImxvZ0dhaW4iLCJkdXJhdGlvbiIsInN0YXJ0VGltZSIsIkRhdGUiLCJ0aW1lSW5NaWxsaXNlY29uZHMiLCJ0b0ZpeGVkIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwibG9nTWFpbkdhaW4iLCJsb2dSZXZlcmJHYWluIiwic291bmRNYW5hZ2VyIiwicmVnaXN0ZXIiXSwic291cmNlcyI6WyJzb3VuZE1hbmFnZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogQSBzaW5nbGV0b24gb2JqZWN0IHRoYXQgcmVnaXN0ZXJzIHNvdW5kIGdlbmVyYXRvcnMsIGNvbm5lY3RzIHRoZW0gdG8gdGhlIGF1ZGlvIG91dHB1dCwgYW5kIHByb3ZpZGVzIGEgbnVtYmVyIG9mXHJcbiAqIHJlbGF0ZWQgc2VydmljZXMsIHN1Y2ggYXM6XHJcbiAqICAtIG1haW4gZW5hYmxlL2Rpc2FibGVcclxuICogIC0gbWFpbiBnYWluIGNvbnRyb2xcclxuICogIC0gZW5hYmxlL2Rpc2FibGUgb2Ygc291bmRzIGJhc2VkIG9uIHZpc2liaWxpdHkgb2YgYW4gYXNzb2NpYXRlZCBTY2VuZXJ5IG5vZGVcclxuICogIC0gZW5hYmxlL2Rpc2FibGUgb2Ygc291bmRzIGJhc2VkIG9uIHRoZWlyIGFzc2lnbmVkIHNvbmlmaWNhdGlvbiBsZXZlbCAoZS5nLiBcImJhc2ljXCIgb3IgXCJleHRyYVwiKVxyXG4gKiAgLSBnYWluIGNvbnRyb2wgZm9yIHNvdW5kcyBiYXNlZCBvbiB0aGVpciBhc3NpZ25lZCBjYXRlZ29yeSwgZS5nLiBVSSB2ZXJzdXMgc2ltLXNwZWNpZmljIHNvdW5kc1xyXG4gKiAgLSBhIHNoYXJlZCByZXZlcmIgdW5pdCB0byBhZGQgc29tZSBzcGF0aWFsaXphdGlvbiBhbmQgbWFrZSBhbGwgc291bmRzIHNlZW0gdG8gb3JpZ2luYXRlIHdpdGggdGhlIHNhbWUgc3BhY2VcclxuICpcclxuICogIFRoZSBzaW5nbGV0b24gb2JqZWN0IG11c3QgYmUgaW5pdGlhbGl6ZWQgYmVmb3JlIHNvdW5kIGdlbmVyYXRvcnMgY2FuIGJlIGFkZGVkLlxyXG4gKlxyXG4gKiAgQGF1dGhvciBKb2huIEJsYW5jbyAoUGhFVCBJbnRlcmFjdGl2ZSBTaW11bGF0aW9ucylcclxuICovXHJcblxyXG5pbXBvcnQgQm9vbGVhblByb3BlcnR5IGZyb20gJy4uLy4uL2F4b24vanMvQm9vbGVhblByb3BlcnR5LmpzJztcclxuaW1wb3J0IFV0aWxzIGZyb20gJy4uLy4uL2RvdC9qcy9VdGlscy5qcyc7XHJcbmltcG9ydCB7IERpc3BsYXksIERpc3BsYXllZFByb3BlcnR5LCBOb2RlIH0gZnJvbSAnLi4vLi4vc2NlbmVyeS9qcy9pbXBvcnRzLmpzJztcclxuaW1wb3J0IFBoZXRpb09iamVjdCBmcm9tICcuLi8uLi90YW5kZW0vanMvUGhldGlvT2JqZWN0LmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuaW1wb3J0IGVtcHR5QXBhcnRtZW50QmVkcm9vbTA2UmVzYW1wbGVkX21wMyBmcm9tICcuLi9zb3VuZHMvZW1wdHlBcGFydG1lbnRCZWRyb29tMDZSZXNhbXBsZWRfbXAzLmpzJztcclxuaW1wb3J0IGF1ZGlvQ29udGV4dFN0YXRlQ2hhbmdlTW9uaXRvciBmcm9tICcuL2F1ZGlvQ29udGV4dFN0YXRlQ2hhbmdlTW9uaXRvci5qcyc7XHJcbmltcG9ydCBwaGV0QXVkaW9Db250ZXh0IGZyb20gJy4vcGhldEF1ZGlvQ29udGV4dC5qcyc7XHJcbmltcG9ydCBzb3VuZENvbnN0YW50cyBmcm9tICcuL3NvdW5kQ29uc3RhbnRzLmpzJztcclxuaW1wb3J0IFNvdW5kTGV2ZWxFbnVtIGZyb20gJy4vU291bmRMZXZlbEVudW0uanMnO1xyXG5pbXBvcnQgdGFtYm8gZnJvbSAnLi90YW1iby5qcyc7XHJcbmltcG9ydCBTb3VuZEdlbmVyYXRvciBmcm9tICcuL3NvdW5kLWdlbmVyYXRvcnMvU291bmRHZW5lcmF0b3IuanMnO1xyXG5pbXBvcnQgb3B0aW9uaXplIGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHksIHsgUHJvcGVydHlMaW5rTGlzdGVuZXIgfSBmcm9tICcuLi8uLi9heG9uL2pzL1RSZWFkT25seVByb3BlcnR5LmpzJztcclxuaW1wb3J0IE11bHRpbGluayBmcm9tICcuLi8uLi9heG9uL2pzL011bHRpbGluay5qcyc7XHJcbmltcG9ydCBhcnJheVJlbW92ZSBmcm9tICcuLi8uLi9waGV0LWNvcmUvanMvYXJyYXlSZW1vdmUuanMnO1xyXG5pbXBvcnQgY3JlYXRlT2JzZXJ2YWJsZUFycmF5LCB7IE9ic2VydmFibGVBcnJheSB9IGZyb20gJy4uLy4uL2F4b24vanMvY3JlYXRlT2JzZXJ2YWJsZUFycmF5LmpzJztcclxuXHJcbi8vIGNvbnN0YW50c1xyXG5jb25zdCBBVURJT19EVUNLSU5HX0xFVkVMID0gMC4xNTsgLy8gZ2FpbiB2YWx1ZSB0byB1c2UgZm9yIHRoZSBkdWNraW5nIGdhaW4gbm9kZSB3aGVuIGR1Y2tpbmcgaXMgYWN0aXZlXHJcblxyXG4vLyBvcHRpb25zIHRoYXQgY2FuIGJlIHVzZWQgd2hlbiBhZGRpbmcgYSBzb3VuZCBnZW5lcmF0b3IgdGhhdCBjYW4gY29udHJvbCBzb21lIGFzcGVjdHMgb2YgaXRzIGJlaGF2aW9yXHJcbmV4cG9ydCB0eXBlIFNvdW5kR2VuZXJhdG9yQWRkT3B0aW9ucyA9IHtcclxuXHJcbiAgLy8gVGhlICdzb25pZmljYXRpb24gbGV2ZWwnIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYSBnaXZlbiBzb3VuZCBzaG91bGQgYmUgZW5hYmxlZCBnaXZlbiB0aGUgc2V0dGluZyBvZiB0aGVcclxuICAvLyBzb25pZmljYXRpb24gbGV2ZWwgcGFyYW1ldGVyIGZvciB0aGUgc2ltLlxyXG4gIHNvbmlmaWNhdGlvbkxldmVsPzogU291bmRMZXZlbEVudW07XHJcblxyXG4gIC8vIFRoZSBhc3NvY2lhdGVkIHZpZXcgbm9kZSBpcyBhIFNjZW5lcnkgbm9kZSB0aGF0LCBpZiBwcm92aWRlZCwgbXVzdCBiZSB2aXNpYmxlIGluIHRoZSBkaXNwbGF5IGZvciB0aGUgc291bmRcclxuICAvLyBnZW5lcmF0b3IgdG8gYmUgZW5hYmxlZC4gIFRoaXMgaXMgZ2VuZXJhbGx5IHVzZWQgb25seSBmb3Igc291bmRzIHRoYXQgY2FuIHBsYXkgZm9yIGxvbmcgZHVyYXRpb25zLCBzdWNoIGFzIGFcclxuICAvLyBsb29waW5nIHNvdW5kIGNsaXAsIHRoYXQgc2hvdWxkIGJlIHN0b3BwZWQgd2hlbiB0aGUgYXNzb2NpYXRlZCB2aXN1YWwgcmVwcmVzZW50YXRpb24gaXMgaGlkZGVuLlxyXG4gIGFzc29jaWF0ZWRWaWV3Tm9kZT86IE5vZGUgfCBudWxsO1xyXG5cclxuICAvLyBjYXRlZ29yeSBuYW1lIGZvciB0aGlzIHNvdW5kXHJcbiAgY2F0ZWdvcnlOYW1lPzogc3RyaW5nIHwgbnVsbDtcclxufTtcclxuXHJcbi8vIHNvdW5kIGdlbmVyYXRvcnMgdGhhdCBhcmUgcXVldWVkIHVwIGFuZCB3YWl0aW5nIHRvIGJlIGFkZGVkIHdoZW4gaW5pdGlhbGl6YXRpb24gaXMgY29tcGxldGVcclxudHlwZSBTb3VuZEdlbmVyYXRvckF3YWl0aW5nQWRkID0ge1xyXG4gIHNvdW5kR2VuZXJhdG9yOiBTb3VuZEdlbmVyYXRvcjtcclxuICBzb3VuZEdlbmVyYXRvckFkZE9wdGlvbnM6IFNvdW5kR2VuZXJhdG9yQWRkT3B0aW9ucztcclxufTtcclxuXHJcbi8vIHNvdW5kIGdlbmVyYXRvciB3aXRoIGl0cyBzb25pZmljYXRpb24gbGV2ZWxcclxudHlwZSBTb3VuZEdlbmVyYXRvckluZm8gPSB7XHJcbiAgc291bmRHZW5lcmF0b3I6IFNvdW5kR2VuZXJhdG9yO1xyXG4gIHNvbmlmaWNhdGlvbkxldmVsOiBTb3VuZExldmVsRW51bTtcclxufTtcclxuXHJcbnR5cGUgU291bmRHZW5lcmF0b3JJbml0aWFsaXphdGlvbk9wdGlvbnMgPSB7XHJcblxyXG4gIC8vIFRoaXMgb3B0aW9uIGNhbiBiZSB1c2VkIHRvIGRlZmluZSBhIHNldCBvZiBjYXRlZ29yaWVzIHRoYXQgY2FuIGJlIHVzZWQgdG8gZ3JvdXAgc291bmQgZ2VuZXJhdG9ycyB0b2dldGhlciBhbmRcclxuICAvLyB0aGVuIGNvbnRyb2wgdGhlaXIgdm9sdW1lIGNvbGxlY3RpdmVseS4gIFRoZSBuYW1lcyBzaG91bGQgYmUgdW5pcXVlLiAgU2VlIHRoZSBkZWZhdWx0IGluaXRpYWxpemF0aW9uIHZhbHVlcyBmb3IgYW5cclxuICAvLyBleGFtcGxlIGxpc3QuXHJcbiAgY2F0ZWdvcmllcz86IHN0cmluZ1tdO1xyXG59O1xyXG5cclxuLy8gY29uc3RhbnRzXHJcbmNvbnN0IERFRkFVTFRfUkVWRVJCX0xFVkVMID0gMC4wMjtcclxuY29uc3QgTElORUFSX0dBSU5fQ0hBTkdFX1RJTUUgPSBzb3VuZENvbnN0YW50cy5ERUZBVUxUX0xJTkVBUl9HQUlOX0NIQU5HRV9USU1FOyAvLyBpbiBzZWNvbmRzXHJcbmNvbnN0IEdBSU5fTE9HR0lOR19FTkFCTEVEID0gZmFsc2U7XHJcblxyXG5jbGFzcyBTb3VuZE1hbmFnZXIgZXh0ZW5kcyBQaGV0aW9PYmplY3Qge1xyXG5cclxuICAvLyBnbG9iYWwgZW5hYmxlZCBzdGF0ZSBmb3Igc291bmQgZ2VuZXJhdGlvblxyXG4gIHB1YmxpYyByZWFkb25seSBlbmFibGVkUHJvcGVydHk6IEJvb2xlYW5Qcm9wZXJ0eTtcclxuXHJcbiAgLy8gZW5hYmxlZCBzdGF0ZSBmb3IgZXh0cmEgc291bmRzXHJcbiAgcHVibGljIHJlYWRvbmx5IGV4dHJhU291bmRFbmFibGVkUHJvcGVydHk6IEJvb2xlYW5Qcm9wZXJ0eTtcclxuXHJcbiAgLy8gYW4gYXJyYXkgd2hlcmUgdGhlIHNvdW5kIGdlbmVyYXRvcnMgYXJlIHN0b3JlZCBhbG9uZyB3aXRoIGluZm9ybWF0aW9uIGFib3V0IGhvdyB0byBtYW5hZ2UgdGhlbVxyXG4gIHByaXZhdGUgcmVhZG9ubHkgc291bmRHZW5lcmF0b3JJbmZvQXJyYXk6IFNvdW5kR2VuZXJhdG9ySW5mb1tdO1xyXG5cclxuICAvLyBvdXRwdXQgbGV2ZWwgZm9yIHRoZSBtYWluIGdhaW4gbm9kZSB3aGVuIHNvbmlmaWNhdGlvbiBpcyBlbmFibGVkXHJcbiAgcHJpdmF0ZSBfbWFpbk91dHB1dExldmVsOiBudW1iZXI7XHJcblxyXG4gIC8vIHJldmVyYiBsZXZlbCwgbmVlZGVkIGJlY2F1c2Ugc29tZSBicm93c2VycyBkb24ndCBzdXBwb3J0IHJlYWRpbmcgb2YgZ2FpbiB2YWx1ZXMsIHNlZSBtZXRob2RzIGZvciBtb3JlIGluZm9cclxuICBwcml2YXRlIF9yZXZlcmJMZXZlbDogbnVtYmVyO1xyXG5cclxuICAvLyBBIG1hcCBvZiBjYXRlZ29yeSBuYW1lcyB0byBHYWluTm9kZSBpbnN0YW5jZXMgdGhhdCBjb250cm9sIGdhaW5zIGZvciB0aGF0IGNhdGVnb3J5IG5hbWUuICBUaGlzIGZpbGxlZCBpbiBkdXJpbmdcclxuICAvLyBpbml0aWFsaXphdGlvbiwgc2VlIHRoZSB1c2FnZSBvZiBvcHRpb25zLmNhdGVnb3JpZXMgaW4gdGhlIGluaXRpYWxpemUgZnVuY3Rpb24gZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgcHJpdmF0ZSByZWFkb25seSBnYWluTm9kZXNGb3JDYXRlZ29yaWVzOiBNYXA8c3RyaW5nLCBHYWluTm9kZT47XHJcblxyXG4gIC8vIGFuIGFycmF5IG9mIHByb3BlcnRpZXMgd2hlcmUsIGlmIGFueSBvZiB0aGVzZSBhcmUgdHJ1ZSwgb3ZlcmFsbCBvdXRwdXQgbGV2ZWwgaXMgXCJkdWNrZWRcIiAoaS5lLiByZWR1Y2VkKVxyXG4gIHByaXZhdGUgcmVhZG9ubHkgZHVja2luZ1Byb3BlcnRpZXM6IE9ic2VydmFibGVBcnJheTxUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuPj47XHJcblxyXG4gIC8vIGZsYWcgdGhhdCB0cmFja3Mgd2hldGhlciB0aGUgc29uaWZpY2F0aW9uIG1hbmFnZXIgaGFzIGJlZW4gaW5pdGlhbGl6ZWQsIHNob3VsZCBuZXZlciBiZSBzZXQgb3V0c2lkZSB0aGlzIGZpbGVcclxuICBwdWJsaWMgaW5pdGlhbGl6ZWQ6IGJvb2xlYW47XHJcblxyXG4gIC8vIHNvdW5kIGdlbmVyYXRvcnMgdGhhdCBhcmUgcXVldWVkIHVwIGlmIGF0dGVtcHRzIGFyZSBtYWRlIHRvIGFkZCB0aGVtIGJlZm9yZSBpbml0aWFsaXphdGlvbiBoYXMgb2NjdXJyZWRcclxuICBwcml2YXRlIHJlYWRvbmx5IHNvdW5kR2VuZXJhdG9yc0F3YWl0aW5nQWRkOiBTb3VuZEdlbmVyYXRvckF3YWl0aW5nQWRkW107XHJcblxyXG4gIC8vIGF1ZGlvIG5vZGVzIHRoYXQgYXJlIHVzZWQgaW4gdGhlIHNpZ25hbCBjaGFpbiBiZXR3ZWVuIHNvdW5kIGdlbmVyYXRvcnMgYW5kIHRoZSBhdWRpbyBjb250ZXh0IGRlc3RpbmF0aW9uXHJcbiAgcHJpdmF0ZSBtYWluR2Fpbk5vZGU6IEdhaW5Ob2RlIHwgbnVsbDtcclxuICBwcml2YXRlIGNvbnZvbHZlcjogQ29udm9sdmVyTm9kZSB8IG51bGw7XHJcbiAgcHJpdmF0ZSByZXZlcmJHYWluTm9kZTogR2Fpbk5vZGUgfCBudWxsO1xyXG4gIHByaXZhdGUgZHJ5R2Fpbk5vZGU6IEdhaW5Ob2RlIHwgbnVsbDtcclxuICBwcml2YXRlIGR1Y2tpbmdHYWluTm9kZTogR2Fpbk5vZGUgfCBudWxsO1xyXG5cclxuICAvLyBhIE1hcCBvYmplY3QgdGhhdCBrZWVwcyB0cmFjayBvZiBEaXNwbGF5ZWRQcm9wZXJ0eSBpbnN0YW5jZXMgdGhhdCBjYW4gYmUgYXNzb2NpYXRlZCB3aXRoIHRoZSBzb3VuZCBnZW5lcmF0b3JcclxuICBwcml2YXRlIHJlYWRvbmx5IHZpZXdOb2RlRGlzcGxheWVkUHJvcGVydHlNYXAgPSBuZXcgTWFwPFNvdW5kR2VuZXJhdG9yLCBEaXNwbGF5ZWRQcm9wZXJ0eT4oKTtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCB0YW5kZW0/OiBUYW5kZW0gKSB7XHJcblxyXG4gICAgc3VwZXIoIHtcclxuICAgICAgdGFuZGVtOiB0YW5kZW0sXHJcbiAgICAgIHBoZXRpb1N0YXRlOiBmYWxzZSxcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ0NvbnRyb2xzIHRoZSBzaW11bGF0aW9uXFwncyBzb3VuZC4gRm9yIHNpbXMgdGhhdCBkbyBub3Qgc3VwcG9ydCBzb3VuZCwgdGhpcyBlbGVtZW50IGFuZCAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2l0cyBjaGlsZHJlbiBjYW4gYmUgaWdub3JlZC4nXHJcbiAgICB9ICk7XHJcblxyXG4gICAgdGhpcy5lbmFibGVkUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCBwaGV0Py5jaGlwcGVyPy5xdWVyeVBhcmFtZXRlcnM/LnN1cHBvcnRzU291bmQgfHwgZmFsc2UsIHtcclxuICAgICAgdGFuZGVtOiB0YW5kZW0/LmNyZWF0ZVRhbmRlbSggJ2VuYWJsZWRQcm9wZXJ0eScgKSxcclxuICAgICAgcGhldGlvU3RhdGU6IGZhbHNlLCAvLyBUaGlzIGlzIGEgcHJlZmVyZW5jZSwgZ2xvYmFsIHNvdW5kIGNvbnRyb2wgaXMgaGFuZGxlZCBieSB0aGUgYXVkaW9NYW5hZ2VyXHJcbiAgICAgIHBoZXRpb0RvY3VtZW50YXRpb246ICdEZXRlcm1pbmVzIHdoZXRoZXIgc291bmQgaXMgZW5hYmxlZC4gU3VwcG9ydGVkIG9ubHkgaWYgdGhpcyBzaW0gc3VwcG9ydHNTb3VuZD10cnVlLidcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLmV4dHJhU291bmRFbmFibGVkUHJvcGVydHkgPSBuZXcgQm9vbGVhblByb3BlcnR5KCBwaGV0Py5jaGlwcGVyPy5xdWVyeVBhcmFtZXRlcnM/LmV4dHJhU291bmRJbml0aWFsbHlFbmFibGVkIHx8IGZhbHNlLCB7XHJcbiAgICAgIHRhbmRlbTogdGFuZGVtPy5jcmVhdGVUYW5kZW0oICdleHRyYVNvdW5kRW5hYmxlZFByb3BlcnR5JyApLFxyXG4gICAgICBwaGV0aW9TdGF0ZTogZmFsc2UsIC8vIFRoaXMgaXMgYSBwcmVmZXJlbmNlLCBnbG9iYWwgc291bmQgY29udHJvbCBpcyBoYW5kbGVkIGJ5IHRoZSBhdWRpb01hbmFnZXJcclxuICAgICAgcGhldGlvRG9jdW1lbnRhdGlvbjogJ0RldGVybWluZXMgd2hldGhlciBleHRyYSBzb3VuZCBpcyBlbmFibGVkLiBFeHRyYSBzb3VuZCBpcyBhZGRpdGlvbmFsIHNvdW5kcyB0aGF0ICcgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAnY2FuIHNlcnZlIHRvIGltcHJvdmUgdGhlIGxlYXJuaW5nIGV4cGVyaWVuY2UgZm9yIGluZGl2aWR1YWxzIHdpdGggdmlzdWFsIGRpc2FiaWxpdGllcy4gJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICdOb3RlIHRoYXQgbm90IGFsbCBzaW11bGF0aW9ucyB0aGF0IHN1cHBvcnQgc291bmQgYWxzbyBzdXBwb3J0IGV4dHJhIHNvdW5kLiBBbHNvIG5vdGUgJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICd0aGF0IHRoZSB2YWx1ZSBpcyBpcnJlbGV2YW50IHdoZW4gZW5hYmxlZFByb3BlcnR5IGlzIGZhbHNlLidcclxuICAgIH0gKTtcclxuXHJcbiAgICB0aGlzLnNvdW5kR2VuZXJhdG9ySW5mb0FycmF5ID0gW107XHJcbiAgICB0aGlzLl9tYWluT3V0cHV0TGV2ZWwgPSAxO1xyXG4gICAgdGhpcy5fcmV2ZXJiTGV2ZWwgPSBERUZBVUxUX1JFVkVSQl9MRVZFTDtcclxuICAgIHRoaXMuZ2Fpbk5vZGVzRm9yQ2F0ZWdvcmllcyA9IG5ldyBNYXA8c3RyaW5nLCBHYWluTm9kZT4oKTtcclxuICAgIHRoaXMuZHVja2luZ1Byb3BlcnRpZXMgPSBjcmVhdGVPYnNlcnZhYmxlQXJyYXkoKTtcclxuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcclxuICAgIHRoaXMuc291bmRHZW5lcmF0b3JzQXdhaXRpbmdBZGQgPSBbXTtcclxuICAgIHRoaXMubWFpbkdhaW5Ob2RlID0gbnVsbDtcclxuICAgIHRoaXMuZHVja2luZ0dhaW5Ob2RlID0gbnVsbDtcclxuICAgIHRoaXMuY29udm9sdmVyID0gbnVsbDtcclxuICAgIHRoaXMucmV2ZXJiR2Fpbk5vZGUgPSBudWxsO1xyXG4gICAgdGhpcy5kcnlHYWluTm9kZSA9IG51bGw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplIHRoZSBzb25pZmljYXRpb24gbWFuYWdlci4gVGhpcyBmdW5jdGlvbiBtdXN0IGJlIGludm9rZWQgYmVmb3JlIGFueSBzb3VuZCBnZW5lcmF0b3JzIGNhbiBiZSBhZGRlZC5cclxuICAgKi9cclxuICBwdWJsaWMgaW5pdGlhbGl6ZSggc2ltQ29uc3RydWN0aW9uQ29tcGxldGVQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj4sXHJcbiAgICAgICAgICAgICAgICAgICAgIGF1ZGlvRW5hYmxlZFByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuPixcclxuICAgICAgICAgICAgICAgICAgICAgc2ltVmlzaWJsZVByb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuPixcclxuICAgICAgICAgICAgICAgICAgICAgc2ltQWN0aXZlUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+LFxyXG4gICAgICAgICAgICAgICAgICAgICBzaW1TZXR0aW5nUGhldGlvU3RhdGVQcm9wZXJ0eTogVFJlYWRPbmx5UHJvcGVydHk8Ym9vbGVhbj4sXHJcbiAgICAgICAgICAgICAgICAgICAgIHByb3ZpZGVkT3B0aW9ucz86IFNvdW5kR2VuZXJhdG9ySW5pdGlhbGl6YXRpb25PcHRpb25zICk6IHZvaWQge1xyXG5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICF0aGlzLmluaXRpYWxpemVkLCAnY2FuXFwndCBpbml0aWFsaXplIHRoZSBzb3VuZCBtYW5hZ2VyIG1vcmUgdGhhbiBvbmNlJyApO1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8U291bmRHZW5lcmF0b3JJbml0aWFsaXphdGlvbk9wdGlvbnMsIFNvdW5kR2VuZXJhdG9ySW5pdGlhbGl6YXRpb25PcHRpb25zPigpKCB7XHJcbiAgICAgIGNhdGVnb3JpZXM6IFsgJ3NpbS1zcGVjaWZpYycsICd1c2VyLWludGVyZmFjZScgXVxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgLy8gb3B0aW9ucyB2YWxpZGF0aW9uXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KFxyXG4gICAgICBvcHRpb25zLmNhdGVnb3JpZXMubGVuZ3RoID09PSBfLnVuaXEoIG9wdGlvbnMuY2F0ZWdvcmllcyApLmxlbmd0aCxcclxuICAgICAgJ2NhdGVnb3JpZXMgbXVzdCBiZSB1bmlxdWUnXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IG5vdyA9IHBoZXRBdWRpb0NvbnRleHQuY3VycmVudFRpbWU7XHJcblxyXG4gICAgLy8gVGhlIGZpbmFsIHN0YWdlIGlzIGEgZHluYW1pY3MgY29tcHJlc3NvciB0aGF0IGlzIHVzZWQgZXNzZW50aWFsbHkgYXMgYSBsaW1pdGVyIHRvIHByZXZlbnQgY2xpcHBpbmcuXHJcbiAgICBjb25zdCBkeW5hbWljc0NvbXByZXNzb3IgPSBwaGV0QXVkaW9Db250ZXh0LmNyZWF0ZUR5bmFtaWNzQ29tcHJlc3NvcigpO1xyXG4gICAgZHluYW1pY3NDb21wcmVzc29yLnRocmVzaG9sZC5zZXRWYWx1ZUF0VGltZSggLTYsIG5vdyApO1xyXG4gICAgZHluYW1pY3NDb21wcmVzc29yLmtuZWUuc2V0VmFsdWVBdFRpbWUoIDUsIG5vdyApO1xyXG4gICAgZHluYW1pY3NDb21wcmVzc29yLnJhdGlvLnNldFZhbHVlQXRUaW1lKCAxMiwgbm93ICk7XHJcbiAgICBkeW5hbWljc0NvbXByZXNzb3IuYXR0YWNrLnNldFZhbHVlQXRUaW1lKCAwLCBub3cgKTtcclxuICAgIGR5bmFtaWNzQ29tcHJlc3Nvci5yZWxlYXNlLnNldFZhbHVlQXRUaW1lKCAwLjI1LCBub3cgKTtcclxuICAgIGR5bmFtaWNzQ29tcHJlc3Nvci5jb25uZWN0KCBwaGV0QXVkaW9Db250ZXh0LmRlc3RpbmF0aW9uICk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIHRoZSBkdWNraW5nIGdhaW4gbm9kZSwgd2hpY2ggaXMgdXNlZCB0byByZWR1Y2UgdGhlIG92ZXJhbGwgc291bmQgb3V0cHV0IGxldmVsIHRlbXBvcmFyaWx5IGluIGNlcnRhaW5cclxuICAgIC8vIHNpdHVhdGlvbnMsIHN1Y2ggYXMgd2hlbiB0aGUgdm9pY2luZyBmZWF0dXJlIGlzIGFjdGl2ZWx5IHByb2R1Y2luZyBzcGVlY2guXHJcbiAgICB0aGlzLmR1Y2tpbmdHYWluTm9kZSA9IHBoZXRBdWRpb0NvbnRleHQuY3JlYXRlR2FpbigpO1xyXG4gICAgdGhpcy5kdWNraW5nR2Fpbk5vZGUuY29ubmVjdCggZHluYW1pY3NDb21wcmVzc29yICk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIHRoZSBtYWluIGdhaW4gbm9kZSBmb3IgYWxsIHNvdW5kcyBtYW5hZ2VkIGJ5IHRoaXMgc29uaWZpY2F0aW9uIG1hbmFnZXIuXHJcbiAgICB0aGlzLm1haW5HYWluTm9kZSA9IHBoZXRBdWRpb0NvbnRleHQuY3JlYXRlR2FpbigpO1xyXG4gICAgdGhpcy5tYWluR2Fpbk5vZGUuY29ubmVjdCggdGhpcy5kdWNraW5nR2Fpbk5vZGUgKTtcclxuXHJcbiAgICAvLyBTZXQgdXAgYSBjb252b2x2ZXIgbm9kZSwgd2hpY2ggd2lsbCBiZSB1c2VkIHRvIGNyZWF0ZSB0aGUgcmV2ZXJiIGVmZmVjdC5cclxuICAgIHRoaXMuY29udm9sdmVyID0gcGhldEF1ZGlvQ29udGV4dC5jcmVhdGVDb252b2x2ZXIoKTtcclxuICAgIGNvbnN0IHNldENvbnZvbHZlckJ1ZmZlcjogUHJvcGVydHlMaW5rTGlzdGVuZXI8QXVkaW9CdWZmZXIgfCBudWxsPiA9IGF1ZGlvQnVmZmVyID0+IHtcclxuICAgICAgaWYgKCBhdWRpb0J1ZmZlciApIHtcclxuICAgICAgICB0aGlzLmNvbnZvbHZlciEuYnVmZmVyID0gYXVkaW9CdWZmZXI7XHJcbiAgICAgICAgZW1wdHlBcGFydG1lbnRCZWRyb29tMDZSZXNhbXBsZWRfbXAzLmF1ZGlvQnVmZmVyUHJvcGVydHkudW5saW5rKCBzZXRDb252b2x2ZXJCdWZmZXIgKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIGVtcHR5QXBhcnRtZW50QmVkcm9vbTA2UmVzYW1wbGVkX21wMy5hdWRpb0J1ZmZlclByb3BlcnR5LmxpbmsoIHNldENvbnZvbHZlckJ1ZmZlciApO1xyXG5cclxuICAgIC8vIGdhaW4gbm9kZSB0aGF0IHdpbGwgY29udHJvbCB0aGUgcmV2ZXJiIGxldmVsXHJcbiAgICB0aGlzLnJldmVyYkdhaW5Ob2RlID0gcGhldEF1ZGlvQ29udGV4dC5jcmVhdGVHYWluKCk7XHJcbiAgICB0aGlzLnJldmVyYkdhaW5Ob2RlLmNvbm5lY3QoIHRoaXMubWFpbkdhaW5Ob2RlICk7XHJcbiAgICB0aGlzLnJldmVyYkdhaW5Ob2RlLmdhaW4uc2V0VmFsdWVBdFRpbWUoIHRoaXMuX3JldmVyYkxldmVsLCBwaGV0QXVkaW9Db250ZXh0LmN1cnJlbnRUaW1lICk7XHJcbiAgICB0aGlzLmNvbnZvbHZlci5jb25uZWN0KCB0aGlzLnJldmVyYkdhaW5Ob2RlICk7XHJcblxyXG4gICAgLy8gZHJ5IChub24tcmV2ZXJiZWQpIHBvcnRpb24gb2YgdGhlIG91dHB1dFxyXG4gICAgdGhpcy5kcnlHYWluTm9kZSA9IHBoZXRBdWRpb0NvbnRleHQuY3JlYXRlR2FpbigpO1xyXG4gICAgdGhpcy5kcnlHYWluTm9kZS5nYWluLnNldFZhbHVlQXRUaW1lKCAxIC0gdGhpcy5fcmV2ZXJiTGV2ZWwsIHBoZXRBdWRpb0NvbnRleHQuY3VycmVudFRpbWUgKTtcclxuICAgIHRoaXMuZHJ5R2Fpbk5vZGUuZ2Fpbi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZShcclxuICAgICAgMSAtIHRoaXMuX3JldmVyYkxldmVsLFxyXG4gICAgICBwaGV0QXVkaW9Db250ZXh0LmN1cnJlbnRUaW1lICsgTElORUFSX0dBSU5fQ0hBTkdFX1RJTUVcclxuICAgICk7XHJcbiAgICB0aGlzLmRyeUdhaW5Ob2RlLmNvbm5lY3QoIHRoaXMubWFpbkdhaW5Ob2RlICk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGFuZCBob29rIHVwIGdhaW4gbm9kZXMgZm9yIGVhY2ggb2YgdGhlIGRlZmluZWQgY2F0ZWdvcmllcy5cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuY29udm9sdmVyICE9PSBudWxsICYmIHRoaXMuZHJ5R2Fpbk5vZGUgIT09IG51bGwsICdzb21lIGF1ZGlvIG5vZGVzIGhhdmUgbm90IGJlZW4gaW5pdGlhbGl6ZWQnICk7XHJcbiAgICBvcHRpb25zLmNhdGVnb3JpZXMuZm9yRWFjaCggY2F0ZWdvcnlOYW1lID0+IHtcclxuICAgICAgY29uc3QgZ2Fpbk5vZGUgPSBwaGV0QXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKTtcclxuICAgICAgZ2Fpbk5vZGUuY29ubmVjdCggdGhpcy5jb252b2x2ZXIhICk7XHJcbiAgICAgIGdhaW5Ob2RlLmNvbm5lY3QoIHRoaXMuZHJ5R2Fpbk5vZGUhICk7XHJcbiAgICAgIHRoaXMuZ2Fpbk5vZGVzRm9yQ2F0ZWdvcmllcy5zZXQoIGNhdGVnb3J5TmFtZSwgZ2Fpbk5vZGUgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBIb29rIHVwIGEgbGlzdGVuZXIgdGhhdCB0dXJucyBkb3duIHRoZSBtYWluIGdhaW4gaWYgc29uaWZpY2F0aW9uIGlzIGRpc2FibGVkIG9yIGlmIHRoZSBzaW0gaXNuJ3QgdmlzaWJsZSBvclxyXG4gICAgLy8gaXNuJ3QgYWN0aXZlLlxyXG4gICAgTXVsdGlsaW5rLm11bHRpbGluayhcclxuICAgICAgW1xyXG4gICAgICAgIHRoaXMuZW5hYmxlZFByb3BlcnR5LFxyXG4gICAgICAgIGF1ZGlvRW5hYmxlZFByb3BlcnR5LFxyXG4gICAgICAgIHNpbUNvbnN0cnVjdGlvbkNvbXBsZXRlUHJvcGVydHksXHJcbiAgICAgICAgc2ltVmlzaWJsZVByb3BlcnR5LFxyXG4gICAgICAgIHNpbUFjdGl2ZVByb3BlcnR5LFxyXG4gICAgICAgIHNpbVNldHRpbmdQaGV0aW9TdGF0ZVByb3BlcnR5XHJcbiAgICAgIF0sXHJcbiAgICAgICggZW5hYmxlZCwgYXVkaW9FbmFibGVkLCBzaW1Jbml0Q29tcGxldGUsIHNpbVZpc2libGUsIHNpbUFjdGl2ZSwgc2ltU2V0dGluZ1BoZXRpb1N0YXRlICkgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBmdWxseUVuYWJsZWQgPSBlbmFibGVkICYmIGF1ZGlvRW5hYmxlZCAmJiBzaW1Jbml0Q29tcGxldGUgJiYgc2ltVmlzaWJsZSAmJiBzaW1BY3RpdmUgJiYgIXNpbVNldHRpbmdQaGV0aW9TdGF0ZTtcclxuICAgICAgICBjb25zdCBnYWluID0gZnVsbHlFbmFibGVkID8gdGhpcy5fbWFpbk91dHB1dExldmVsIDogMDtcclxuXHJcbiAgICAgICAgLy8gU2V0IHRoZSBnYWluLCBidXQgc29tZXdoYXQgZ3JhZHVhbGx5IGluIG9yZGVyIHRvIGF2b2lkIHJhcGlkIHRyYW5zaWVudHMsIHdoaWNoIGNhbiBzb3VuZCBsaWtlIGNsaWNrcy5cclxuICAgICAgICB0aGlzLm1haW5HYWluTm9kZSEuZ2Fpbi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZShcclxuICAgICAgICAgIGdhaW4sXHJcbiAgICAgICAgICBwaGV0QXVkaW9Db250ZXh0LmN1cnJlbnRUaW1lICsgTElORUFSX0dBSU5fQ0hBTkdFX1RJTUVcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IGR1Y2tNYWluT3V0cHV0TGV2ZWxQcm9wZXJ0eSA9IG5ldyBCb29sZWFuUHJvcGVydHkoIGZhbHNlICk7XHJcblxyXG4gICAgLy8gRGVmaW5lIGEgbGlzdGVuZXIgdGhhdCB3aWxsIHVwZGF0ZSB0aGUgc3RhdGUgb2YgdGhlIGNvbGxlY3RpdmUgZHVja2luZyBQcm9wZXJ0eSB0aGF0IGluZGljYXRlcyB3aGV0aGVyIGR1Y2tpbmdcclxuICAgIC8vIChvdmVyYWxsIHZvbHVtZSByZWR1Y3Rpb24gdG8gcHJldmVudCBvdmVybGFwIHdpdGggb3RoZXIgc291bmRzKSBzaG91bGQgYmUgYWN0aXZlIG9yIGluYWN0aXZlLlxyXG4gICAgY29uc3QgdXBkYXRlRHVja2luZ1N0YXRlID0gKCkgPT4ge1xyXG5cclxuICAgICAgLy8gUmVkdWNlIHRoZSBhcnJheSBvZiBpbmRpdmlkdWFsIGR1Y2tpbmcgUHJvcGVydGllcyBhcnJheSB0byBhIHNpbmdsZSBib29sZWFuIHZhbHVlLlxyXG4gICAgICBkdWNrTWFpbk91dHB1dExldmVsUHJvcGVydHkudmFsdWUgPSB0aGlzLmR1Y2tpbmdQcm9wZXJ0aWVzLnJlZHVjZShcclxuICAgICAgICAoIHZhbHVlU29GYXIsIGN1cnJlbnRQcm9wZXJ0eSApID0+IHZhbHVlU29GYXIgfHwgY3VycmVudFByb3BlcnR5LnZhbHVlLFxyXG4gICAgICAgIGZhbHNlXHJcbiAgICAgICk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEltcGxlbWVudCBkdWNraW5nIG9mIHRoZSBtYWluIG91dHB1dC5cclxuICAgIGR1Y2tNYWluT3V0cHV0TGV2ZWxQcm9wZXJ0eS5sYXp5TGluayggZHVja091dHB1dCA9PiB7XHJcblxyXG4gICAgICAvLyBTdGF0ZSBjaGVja2luZyAtIG1ha2Ugc3VyZSB0aGUgZHVja2luZyBnYWluIG5vZGUgZXhpc3RzLlxyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmR1Y2tpbmdHYWluTm9kZSwgJ2R1Y2tpbmcgbGlzdGVuZXIgZmlyZWQsIGJ1dCBubyBkdWNraW5nIGdhaW4gbm9kZSBleGlzdHMnICk7XHJcblxyXG4gICAgICAvLyBVc2UgdGltZSBjb25zdGFudCB2YWx1ZXMgdGhhdCB3aWxsIHR1cm4gZG93biB0aGUgb3V0cHV0IGxldmVsIGZhc3RlciB0aGFuIGl0IHdpbGwgdHVybiBpdCB1cC4gIFRoaXMgc291bmRzXHJcbiAgICAgIC8vIGJldHRlciwgc2luY2UgaXQgcHJldmVudHMgb3ZlcmxhcCB3aXRoIHRoZSB2b2ljZS5cclxuICAgICAgY29uc3QgdGltZUNvbnN0YW50ID0gZHVja091dHB1dCA/IDAuMDUgOiAwLjU7XHJcblxyXG4gICAgICAvLyBEdWNrIG9yIGRvbid0LlxyXG4gICAgICBjb25zdCBub3cgPSBwaGV0QXVkaW9Db250ZXh0LmN1cnJlbnRUaW1lO1xyXG4gICAgICB0aGlzLmR1Y2tpbmdHYWluTm9kZT8uZ2Fpbi5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMoIG5vdyApO1xyXG4gICAgICB0aGlzLmR1Y2tpbmdHYWluTm9kZT8uZ2Fpbi5zZXRUYXJnZXRBdFRpbWUoIGR1Y2tPdXRwdXQgPyBBVURJT19EVUNLSU5HX0xFVkVMIDogMSwgbm93LCB0aW1lQ29uc3RhbnQgKTtcclxuICAgIH0gKTtcclxuXHJcbiAgICAvLyBIYW5kbGUgdGhlIGFkZGluZyBhbmQgcmVtb3ZhbCBvZiBpbmRpdmlkdWFsIGR1Y2tpbmcgUHJvcGVydGllcy5cclxuICAgIHRoaXMuZHVja2luZ1Byb3BlcnRpZXMuYWRkSXRlbUFkZGVkTGlzdGVuZXIoIGFkZGVkRHVja2luZ1Byb3BlcnR5ID0+IHtcclxuICAgICAgYWRkZWREdWNraW5nUHJvcGVydHkubGluayggdXBkYXRlRHVja2luZ1N0YXRlICk7XHJcbiAgICAgIGNvbnN0IGNoZWNrQW5kUmVtb3ZlID0gKCByZW1vdmVkRHVja2luZ1Byb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuPiApID0+IHtcclxuICAgICAgICBpZiAoIHJlbW92ZWREdWNraW5nUHJvcGVydHkgPT09IGFkZGVkRHVja2luZ1Byb3BlcnR5ICkge1xyXG4gICAgICAgICAgcmVtb3ZlZER1Y2tpbmdQcm9wZXJ0eS51bmxpbmsoIHVwZGF0ZUR1Y2tpbmdTdGF0ZSApO1xyXG4gICAgICAgICAgdGhpcy5kdWNraW5nUHJvcGVydGllcy5yZW1vdmVJdGVtUmVtb3ZlZExpc3RlbmVyKCBjaGVja0FuZFJlbW92ZSApO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgICAgdGhpcy5kdWNraW5nUHJvcGVydGllcy5hZGRJdGVtUmVtb3ZlZExpc3RlbmVyKCBjaGVja0FuZFJlbW92ZSApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBIYW5kbGUgdGhlIGF1ZGlvIGNvbnRleHQgc3RhdGUsIGJvdGggd2hlbiBjaGFuZ2VzIG9jY3VyIGFuZCB3aGVuIGl0IGlzIGluaXRpYWxseSBtdXRlZCBkdWUgdG8gdGhlIGF1dG9wbGF5XHJcbiAgICAvLyBwb2xpY3kuICBBcyBvZiB0aGlzIHdyaXRpbmcgKEZlYiAyMDE5KSwgdGhlcmUgYXJlIHNvbWUgZGlmZmVyZW5jZXMgaW4gaG93IHRoZSBhdWRpbyBjb250ZXh0IHN0YXRlIGJlaGF2ZXMgb25cclxuICAgIC8vIGRpZmZlcmVudCBwbGF0Zm9ybXMsIHNvIHRoZSBjb2RlIG1vbml0b3JzIGRpZmZlcmVudCBldmVudHMgYW5kIHN0YXRlcyB0byBrZWVwIHRoZSBhdWRpbyBjb250ZXh0IHJ1bm5pbmcuICBBcyB0aGVcclxuICAgIC8vIGJlaGF2aW9yIG9mIHRoZSBhdWRpbyBjb250ZXh0IGJlY29tZXMgbW9yZSBjb25zaXN0ZW50IGFjcm9zcyBicm93c2VycywgaXQgbWF5IGJlIHBvc3NpYmxlIHRvIHNpbXBsaWZ5IHRoaXMuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIC8vIGZ1bmN0aW9uIHRvIHJlbW92ZSB0aGUgdXNlciBpbnRlcmFjdGlvbiBsaXN0ZW5lcnMsIHVzZWQgdG8gYXZvaWQgY29kZSBkdXBsaWNhdGlvblxyXG4gICAgY29uc3QgcmVtb3ZlVXNlckludGVyYWN0aW9uTGlzdGVuZXJzID0gKCkgPT4ge1xyXG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ3RvdWNoc3RhcnQnLCByZXN1bWVBdWRpb0NvbnRleHQsIGZhbHNlICk7XHJcbiAgICAgIGlmICggRGlzcGxheS51c2VyR2VzdHVyZUVtaXR0ZXIuaGFzTGlzdGVuZXIoIHJlc3VtZUF1ZGlvQ29udGV4dCApICkge1xyXG4gICAgICAgIERpc3BsYXkudXNlckdlc3R1cmVFbWl0dGVyLnJlbW92ZUxpc3RlbmVyKCByZXN1bWVBdWRpb0NvbnRleHQgKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBsaXN0ZW5lciB0aGF0IHJlc3VtZXMgdGhlIGF1ZGlvIGNvbnRleHRcclxuICAgIGNvbnN0IHJlc3VtZUF1ZGlvQ29udGV4dCA9ICgpID0+IHtcclxuXHJcbiAgICAgIGlmICggcGhldEF1ZGlvQ29udGV4dC5zdGF0ZSAhPT0gJ3J1bm5pbmcnICkge1xyXG5cclxuICAgICAgICBwaGV0LmxvZyAmJiBwaGV0LmxvZyggYGF1ZGlvIGNvbnRleHQgbm90IHJ1bm5pbmcsIGF0dGVtcHRpbmcgdG8gcmVzdW1lLCBzdGF0ZSA9ICR7cGhldEF1ZGlvQ29udGV4dC5zdGF0ZX1gICk7XHJcblxyXG4gICAgICAgIC8vIHRlbGwgdGhlIGF1ZGlvIGNvbnRleHQgdG8gcmVzdW1lXHJcbiAgICAgICAgcGhldEF1ZGlvQ29udGV4dC5yZXN1bWUoKVxyXG4gICAgICAgICAgLnRoZW4oICgpID0+IHtcclxuICAgICAgICAgICAgcGhldC5sb2cgJiYgcGhldC5sb2coIGByZXN1bWUgYXBwZWFycyB0byBoYXZlIHN1Y2NlZWRlZCwgcGhldEF1ZGlvQ29udGV4dC5zdGF0ZSA9ICR7cGhldEF1ZGlvQ29udGV4dC5zdGF0ZX1gICk7XHJcbiAgICAgICAgICAgIHJlbW92ZVVzZXJJbnRlcmFjdGlvbkxpc3RlbmVycygpO1xyXG4gICAgICAgICAgfSApXHJcbiAgICAgICAgICAuY2F0Y2goIGVyciA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGBlcnJvciB3aGVuIHRyeWluZyB0byByZXN1bWUgYXVkaW8gY29udGV4dCwgZXJyID0gJHtlcnJ9YDtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvciggZXJyb3JNZXNzYWdlICk7XHJcbiAgICAgICAgICAgIGFzc2VydCAmJiBhbGVydCggZXJyb3JNZXNzYWdlICk7XHJcbiAgICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgIC8vIGF1ZGlvIGNvbnRleHQgaXMgYWxyZWFkeSBydW5uaW5nLCBubyBuZWVkIHRvIGxpc3RlbiBhbnltb3JlXHJcbiAgICAgICAgcmVtb3ZlVXNlckludGVyYWN0aW9uTGlzdGVuZXJzKCk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLy8gbGlzdGVuIGZvciBhIHRvdWNoc3RhcnQgLSB0aGlzIG9ubHkgd29ya3MgdG8gcmVzdW1lIHRoZSBhdWRpbyBjb250ZXh0IG9uIGlPUyBkZXZpY2VzIChhcyBvZiB0aGlzIHdyaXRpbmcpXHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ3RvdWNoc3RhcnQnLCByZXN1bWVBdWRpb0NvbnRleHQsIGZhbHNlICk7XHJcblxyXG4gICAgLy8gbGlzdGVuIGZvciBvdGhlciB1c2VyIGdlc3R1cmUgZXZlbnRzXHJcbiAgICBEaXNwbGF5LnVzZXJHZXN0dXJlRW1pdHRlci5hZGRMaXN0ZW5lciggcmVzdW1lQXVkaW9Db250ZXh0ICk7XHJcblxyXG4gICAgLy8gRHVyaW5nIHRlc3RpbmcsIHNldmVyYWwgdXNlIGNhc2VzIHdlcmUgZm91bmQgd2hlcmUgdGhlIGF1ZGlvIGNvbnRleHQgc3RhdGUgY2hhbmdlcyB0byBzb21ldGhpbmcgb3RoZXIgdGhhbiB0aGVcclxuICAgIC8vIFwicnVubmluZ1wiIHN0YXRlIHdoaWxlIHRoZSBzaW0gaXMgaW4gdXNlIChnZW5lcmFsbHkgZWl0aGVyIFwic3VzcGVuZGVkXCIgb3IgXCJpbnRlcnJ1cHRlZFwiLCBkZXBlbmRpbmcgb24gdGhlXHJcbiAgICAvLyBicm93c2VyKS4gIFRoZSBmb2xsb3dpbmcgY29kZSBpcyBpbnRlbmRlZCB0byBoYW5kbGUgdGhpcyBzaXR1YXRpb24gYnkgdHJ5aW5nIHRvIHJlc3VtZSBpdCByaWdodCBhd2F5LiAgR2l0SHViXHJcbiAgICAvLyBpc3N1ZXMgd2l0aCBkZXRhaWxzIGFib3V0IHdoeSB0aGlzIGlzIG5lY2Vzc2FyeSBhcmU6XHJcbiAgICAvLyAtIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy90YW1iby9pc3N1ZXMvNThcclxuICAgIC8vIC0gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3RhbWJvL2lzc3Vlcy81OVxyXG4gICAgLy8gLSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZnJhY3Rpb25zLWNvbW1vbi9pc3N1ZXMvODJcclxuICAgIC8vIC0gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL2ZyaWN0aW9uL2lzc3Vlcy8xNzNcclxuICAgIC8vIC0gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3Jlc2lzdGFuY2UtaW4tYS13aXJlL2lzc3Vlcy8xOTBcclxuICAgIC8vIC0gaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3RhbWJvL2lzc3Vlcy85MFxyXG4gICAgbGV0IHByZXZpb3VzQXVkaW9Db250ZXh0U3RhdGU6IEF1ZGlvQ29udGV4dFN0YXRlID0gcGhldEF1ZGlvQ29udGV4dC5zdGF0ZTtcclxuICAgIGF1ZGlvQ29udGV4dFN0YXRlQ2hhbmdlTW9uaXRvci5hZGRTdGF0ZUNoYW5nZUxpc3RlbmVyKCBwaGV0QXVkaW9Db250ZXh0LCAoIHN0YXRlOiBBdWRpb0NvbnRleHRTdGF0ZSApID0+IHtcclxuXHJcbiAgICAgIHBoZXQubG9nICYmIHBoZXQubG9nKFxyXG4gICAgICAgIGBhdWRpbyBjb250ZXh0IHN0YXRlIGNoYW5nZWQsIG9sZCBzdGF0ZSA9ICR7XHJcbiAgICAgICAgICBwcmV2aW91c0F1ZGlvQ29udGV4dFN0YXRlXHJcbiAgICAgICAgfSwgbmV3IHN0YXRlID0gJHtcclxuICAgICAgICAgIHN0YXRlXHJcbiAgICAgICAgfSwgYXVkaW8gY29udGV4dCB0aW1lID0gJHtcclxuICAgICAgICAgIHBoZXRBdWRpb0NvbnRleHQuY3VycmVudFRpbWV9YFxyXG4gICAgICApO1xyXG5cclxuICAgICAgaWYgKCBzdGF0ZSAhPT0gJ3J1bm5pbmcnICkge1xyXG5cclxuICAgICAgICAvLyBBZGQgYSBsaXN0ZW5lciB0aGF0IHdpbGwgcmVzdW1lIHRoZSBhdWRpbyBjb250ZXh0IG9uIHRoZSBuZXh0IHRvdWNoc3RhcnQuXHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICd0b3VjaHN0YXJ0JywgcmVzdW1lQXVkaW9Db250ZXh0LCBmYWxzZSApO1xyXG5cclxuICAgICAgICAvLyBMaXN0ZW4gYWxzbyBmb3Igb3RoZXIgdXNlciBnZXN0dXJlIGV2ZW50cyB0aGF0IGNhbiBiZSB1c2VkIHRvIHJlc3VtZSB0aGUgYXVkaW8gY29udGV4dC5cclxuICAgICAgICBpZiAoICFEaXNwbGF5LnVzZXJHZXN0dXJlRW1pdHRlci5oYXNMaXN0ZW5lciggcmVzdW1lQXVkaW9Db250ZXh0ICkgKSB7XHJcbiAgICAgICAgICBEaXNwbGF5LnVzZXJHZXN0dXJlRW1pdHRlci5hZGRMaXN0ZW5lciggcmVzdW1lQXVkaW9Db250ZXh0ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCAnQXVkaW9Db250ZXh0IGlzIG5vdyBydW5uaW5nLicgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcHJldmlvdXNBdWRpb0NvbnRleHRTdGF0ZSA9IHN0YXRlO1xyXG4gICAgfSApO1xyXG5cclxuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG5cclxuICAgIC8vIEFkZCBhbnkgc291bmQgZ2VuZXJhdG9ycyB0aGF0IHdlcmUgd2FpdGluZyBmb3IgaW5pdGlhbGl6YXRpb24gdG8gY29tcGxldGUgKG11c3QgYmUgZG9uZSBhZnRlciBpbml0IGNvbXBsZXRlKS5cclxuICAgIHRoaXMuc291bmRHZW5lcmF0b3JzQXdhaXRpbmdBZGQuZm9yRWFjaCggc291bmRHZW5lcmF0b3JBd2FpdGluZ0FkZCA9PiB7XHJcbiAgICAgIHRoaXMuYWRkU291bmRHZW5lcmF0b3IoXHJcbiAgICAgICAgc291bmRHZW5lcmF0b3JBd2FpdGluZ0FkZC5zb3VuZEdlbmVyYXRvcixcclxuICAgICAgICBzb3VuZEdlbmVyYXRvckF3YWl0aW5nQWRkLnNvdW5kR2VuZXJhdG9yQWRkT3B0aW9uc1xyXG4gICAgICApO1xyXG4gICAgfSApO1xyXG4gICAgdGhpcy5zb3VuZEdlbmVyYXRvcnNBd2FpdGluZ0FkZC5sZW5ndGggPSAwO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBzcGVjaWZpZWQgc291bmRHZW5lcmF0b3IgaGFzIGJlZW4gcHJldmlvdXNseSBhZGRlZCB0byB0aGUgc291bmRNYW5hZ2VyLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBoYXNTb3VuZEdlbmVyYXRvciggc291bmRHZW5lcmF0b3I6IFNvdW5kR2VuZXJhdG9yICk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIF8uc29tZShcclxuICAgICAgdGhpcy5zb3VuZEdlbmVyYXRvckluZm9BcnJheSxcclxuICAgICAgc291bmRHZW5lcmF0b3JJbmZvID0+IHNvdW5kR2VuZXJhdG9ySW5mby5zb3VuZEdlbmVyYXRvciA9PT0gc291bmRHZW5lcmF0b3JcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGQgYSBzb3VuZCBnZW5lcmF0b3IuICBUaGlzIGNvbm5lY3RzIHRoZSBzb3VuZCBnZW5lcmF0b3IgdG8gdGhlIGF1ZGlvIHBhdGgsIHB1dHMgaXQgb24gdGhlIGxpc3Qgb2Ygc291bmRcclxuICAgKiBnZW5lcmF0b3JzLCBhbmQgY3JlYXRlcyBhbmQgcmV0dXJucyBhIHVuaXF1ZSBJRC5cclxuICAgKi9cclxuICBwdWJsaWMgYWRkU291bmRHZW5lcmF0b3IoIHNvdW5kR2VuZXJhdG9yOiBTb3VuZEdlbmVyYXRvciwgcHJvdmlkZWRPcHRpb25zPzogU291bmRHZW5lcmF0b3JBZGRPcHRpb25zICk6IHZvaWQge1xyXG5cclxuICAgIC8vIFdlJ2xsIG5lZWQgYW4gZW1wdHkgb2JqZWN0IG9mIG5vIG9wdGlvbnMgd2VyZSBwcm92aWRlZC5cclxuICAgIGlmICggcHJvdmlkZWRPcHRpb25zID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgIHByb3ZpZGVkT3B0aW9ucyA9IHt9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENoZWNrIGlmIGluaXRpYWxpemF0aW9uIGhhcyBiZWVuIGRvbmUgYW5kLCBpZiBub3QsIHF1ZXVlIHRoZSBzb3VuZCBnZW5lcmF0b3IgYW5kIGl0cyBvcHRpb25zIGZvciBhZGRpdGlvblxyXG4gICAgLy8gb25jZSBpbml0aWFsaXphdGlvbiBpcyBjb21wbGV0ZS4gIE5vdGUgdGhhdCB3aGVuIHNvdW5kIGlzIG5vdCBzdXBwb3J0ZWQsIGluaXRpYWxpemF0aW9uIHdpbGwgbmV2ZXIgb2NjdXIuXHJcbiAgICBpZiAoICF0aGlzLmluaXRpYWxpemVkICkge1xyXG4gICAgICB0aGlzLnNvdW5kR2VuZXJhdG9yc0F3YWl0aW5nQWRkLnB1c2goIHtcclxuICAgICAgICBzb3VuZEdlbmVyYXRvcjogc291bmRHZW5lcmF0b3IsXHJcbiAgICAgICAgc291bmRHZW5lcmF0b3JBZGRPcHRpb25zOiBwcm92aWRlZE9wdGlvbnNcclxuICAgICAgfSApO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc3RhdGUgY2hlY2tpbmcgLSBtYWtlIHN1cmUgdGhlIG5lZWRlZCBub2RlcyBoYXZlIGJlZW4gY3JlYXRlZFxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5jb252b2x2ZXIgIT09IG51bGwgJiYgdGhpcy5kcnlHYWluTm9kZSAhPT0gbnVsbCwgJ3NvbWUgYXVkaW8gbm9kZXMgaGF2ZSBub3QgYmVlbiBpbml0aWFsaXplZCcgKTtcclxuXHJcbiAgICAvLyBWZXJpZnkgdGhhdCB0aGlzIGlzIG5vdCBhIGR1cGxpY2F0ZSBhZGRpdGlvbi5cclxuICAgIGNvbnN0IGhhc1NvdW5kR2VuZXJhdG9yID0gdGhpcy5oYXNTb3VuZEdlbmVyYXRvciggc291bmRHZW5lcmF0b3IgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoICFoYXNTb3VuZEdlbmVyYXRvciwgJ2NhblxcJ3QgYWRkIHRoZSBzYW1lIHNvdW5kIGdlbmVyYXRvciB0d2ljZScgKTtcclxuXHJcbiAgICAvLyBkZWZhdWx0IG9wdGlvbnNcclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8U291bmRHZW5lcmF0b3JBZGRPcHRpb25zLCBTb3VuZEdlbmVyYXRvckFkZE9wdGlvbnM+KCkoIHtcclxuICAgICAgc29uaWZpY2F0aW9uTGV2ZWw6IFNvdW5kTGV2ZWxFbnVtLkJBU0lDLFxyXG4gICAgICBhc3NvY2lhdGVkVmlld05vZGU6IG51bGwsXHJcbiAgICAgIGNhdGVnb3J5TmFtZTogbnVsbFxyXG4gICAgfSwgcHJvdmlkZWRPcHRpb25zICk7XHJcblxyXG4gICAgLy8gb3B0aW9uIHZhbGlkYXRpb25cclxuICAgIGFzc2VydCAmJiBhc3NlcnQoXHJcbiAgICAgIF8uaW5jbHVkZXMoIF8udmFsdWVzKCBTb3VuZExldmVsRW51bSApLCBvcHRpb25zLnNvbmlmaWNhdGlvbkxldmVsICksXHJcbiAgICAgIGBpbnZhbGlkIHZhbHVlIGZvciBzb25pZmljYXRpb24gbGV2ZWw6ICR7b3B0aW9ucy5zb25pZmljYXRpb25MZXZlbH1gXHJcbiAgICApO1xyXG5cclxuICAgIC8vIENvbm5lY3QgdGhlIHNvdW5kIGdlbmVyYXRvciB0byBhbiBvdXRwdXQgcGF0aC5cclxuICAgIGlmICggb3B0aW9ucy5jYXRlZ29yeU5hbWUgPT09IG51bGwgKSB7XHJcbiAgICAgIHNvdW5kR2VuZXJhdG9yLmNvbm5lY3QoIHRoaXMuY29udm9sdmVyISApO1xyXG4gICAgICBzb3VuZEdlbmVyYXRvci5jb25uZWN0KCB0aGlzLmRyeUdhaW5Ob2RlISApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoXHJcbiAgICAgICAgdGhpcy5nYWluTm9kZXNGb3JDYXRlZ29yaWVzLmhhcyggb3B0aW9ucy5jYXRlZ29yeU5hbWUgKSxcclxuICAgICAgICBgY2F0ZWdvcnkgZG9lcyBub3QgZXhpc3QgOiAke29wdGlvbnMuY2F0ZWdvcnlOYW1lfWBcclxuICAgICAgKTtcclxuICAgICAgc291bmRHZW5lcmF0b3IuY29ubmVjdCggdGhpcy5nYWluTm9kZXNGb3JDYXRlZ29yaWVzLmdldCggb3B0aW9ucy5jYXRlZ29yeU5hbWUgKSEgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBLZWVwIGEgcmVjb3JkIG9mIHRoZSBzb3VuZCBnZW5lcmF0b3IgYWxvbmcgd2l0aCBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIGFib3V0IGl0LlxyXG4gICAgY29uc3Qgc291bmRHZW5lcmF0b3JJbmZvID0ge1xyXG4gICAgICBzb3VuZEdlbmVyYXRvcjogc291bmRHZW5lcmF0b3IsXHJcbiAgICAgIHNvbmlmaWNhdGlvbkxldmVsOiBvcHRpb25zLnNvbmlmaWNhdGlvbkxldmVsXHJcbiAgICB9O1xyXG4gICAgdGhpcy5zb3VuZEdlbmVyYXRvckluZm9BcnJheS5wdXNoKCBzb3VuZEdlbmVyYXRvckluZm8gKTtcclxuXHJcbiAgICAvLyBBZGQgdGhlIGdsb2JhbCBlbmFibGUgUHJvcGVydHkgdG8gdGhlIGxpc3Qgb2YgUHJvcGVydGllcyB0aGF0IGVuYWJsZSB0aGlzIHNvdW5kIGdlbmVyYXRvci5cclxuICAgIHNvdW5kR2VuZXJhdG9yLmFkZEVuYWJsZUNvbnRyb2xQcm9wZXJ0eSggdGhpcy5lbmFibGVkUHJvcGVydHkgKTtcclxuXHJcbiAgICAvLyBJZiB0aGlzIHNvdW5kIGdlbmVyYXRvciBpcyBvbmx5IGVuYWJsZWQgaW4gZXh0cmEgbW9kZSwgYWRkIHRoZSBleHRyYSBtb2RlIFByb3BlcnR5IGFzIGFuIGVuYWJsZS1jb250cm9sLlxyXG4gICAgaWYgKCBvcHRpb25zLnNvbmlmaWNhdGlvbkxldmVsID09PSBTb3VuZExldmVsRW51bS5FWFRSQSApIHtcclxuICAgICAgc291bmRHZW5lcmF0b3IuYWRkRW5hYmxlQ29udHJvbFByb3BlcnR5KCB0aGlzLmV4dHJhU291bmRFbmFibGVkUHJvcGVydHkgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiBhIHZpZXcgbm9kZSB3YXMgc3BlY2lmaWVkLCBjcmVhdGUgYW5kIHBhc3MgaW4gYSBib29sZWFuIFByb3BlcnR5IHRoYXQgaXMgdHJ1ZSBvbmx5IHdoZW4gdGhlIG5vZGUgaXMgZGlzcGxheWVkLlxyXG4gICAgaWYgKCBvcHRpb25zLmFzc29jaWF0ZWRWaWV3Tm9kZSApIHtcclxuICAgICAgY29uc3Qgdmlld05vZGVEaXNwbGF5ZWRQcm9wZXJ0eSA9IG5ldyBEaXNwbGF5ZWRQcm9wZXJ0eSggb3B0aW9ucy5hc3NvY2lhdGVkVmlld05vZGUgKTtcclxuICAgICAgc291bmRHZW5lcmF0b3IuYWRkRW5hYmxlQ29udHJvbFByb3BlcnR5KCB2aWV3Tm9kZURpc3BsYXllZFByb3BlcnR5ICk7XHJcblxyXG4gICAgICAvLyBLZWVwIHRyYWNrIG9mIHRoaXMgRGlzcGxheWVkUHJvcGVydHkgaW5zdGFuY2Ugc28gdGhhdCBpdCBjYW4gYmUgZGlzcG9zZWQgaWYgdGhlIHNvdW5kIGdlbmVyYXRvciBpcyBkaXNwb3NlZC5cclxuICAgICAgdGhpcy52aWV3Tm9kZURpc3BsYXllZFByb3BlcnR5TWFwLnNldCggc291bmRHZW5lcmF0b3IsIHZpZXdOb2RlRGlzcGxheWVkUHJvcGVydHkgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZSB0aGUgc3BlY2lmaWVkIHNvdW5kIGdlbmVyYXRvci5cclxuICAgKi9cclxuICBwdWJsaWMgcmVtb3ZlU291bmRHZW5lcmF0b3IoIHNvdW5kR2VuZXJhdG9yOiBTb3VuZEdlbmVyYXRvciApOiB2b2lkIHtcclxuXHJcbiAgICAvLyBDaGVjayBpZiB0aGUgc291bmQgbWFuYWdlciBpcyBpbml0aWFsaXplZCBhbmQsIGlmIG5vdCwgaXNzdWUgYSB3YXJuaW5nIGFuZCBpZ25vcmUgdGhlIHJlcXVlc3QuICBUaGlzIGlzIG5vdCBhblxyXG4gICAgLy8gYXNzZXJ0aW9uIGJlY2F1c2UgdGhlIHNvdW5kIG1hbmFnZXIgbWF5IG5vdCBiZSBpbml0aWFsaXplZCBpbiBjYXNlcyB3aGVyZSB0aGUgc291bmQgaXMgbm90IGVuYWJsZWQgZm9yIHRoZVxyXG4gICAgLy8gc2ltdWxhdGlvbiwgYnV0IHRoaXMgbWV0aG9kIGNhbiBzdGlsbCBlbmQgdXAgYmVpbmcgaW52b2tlZC5cclxuICAgIGlmICggIXRoaXMuaW5pdGlhbGl6ZWQgKSB7XHJcblxyXG4gICAgICBjb25zdCB0b1JlbW92ZSA9IHRoaXMuc291bmRHZW5lcmF0b3JzQXdhaXRpbmdBZGQuZmlsdGVyKCBzID0+IHMuc291bmRHZW5lcmF0b3IgPT09IHNvdW5kR2VuZXJhdG9yICk7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRvUmVtb3ZlLmxlbmd0aCA+IDAsICd1bmFibGUgdG8gcmVtb3ZlIHNvdW5kIGdlbmVyYXRvciAtIG5vdCBmb3VuZCcgKTtcclxuICAgICAgd2hpbGUgKCB0b1JlbW92ZS5sZW5ndGggPiAwICkge1xyXG4gICAgICAgIGFycmF5UmVtb3ZlKCB0aGlzLnNvdW5kR2VuZXJhdG9yc0F3YWl0aW5nQWRkLCB0b1JlbW92ZVsgMCBdICk7XHJcbiAgICAgICAgdG9SZW1vdmUuc2hpZnQoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGZpbmQgdGhlIGluZm8gb2JqZWN0IGZvciB0aGlzIHNvdW5kIGdlbmVyYXRvclxyXG4gICAgbGV0IHNvdW5kR2VuZXJhdG9ySW5mbyA9IG51bGw7XHJcbiAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCB0aGlzLnNvdW5kR2VuZXJhdG9ySW5mb0FycmF5Lmxlbmd0aDsgaSsrICkge1xyXG4gICAgICBpZiAoIHRoaXMuc291bmRHZW5lcmF0b3JJbmZvQXJyYXlbIGkgXS5zb3VuZEdlbmVyYXRvciA9PT0gc291bmRHZW5lcmF0b3IgKSB7XHJcblxyXG4gICAgICAgIC8vIGZvdW5kIGl0XHJcbiAgICAgICAgc291bmRHZW5lcmF0b3JJbmZvID0gdGhpcy5zb3VuZEdlbmVyYXRvckluZm9BcnJheVsgaSBdO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gbWFrZSBzdXJlIGl0IGlzIGFjdHVhbGx5IHByZXNlbnQgb24gdGhlIGxpc3RcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIHNvdW5kR2VuZXJhdG9ySW5mbywgJ3VuYWJsZSB0byByZW1vdmUgc291bmQgZ2VuZXJhdG9yIC0gbm90IGZvdW5kJyApO1xyXG5cclxuICAgIC8vIGRpc2Nvbm5lY3QgdGhlIHNvdW5kIGdlbmVyYXRvciBmcm9tIGFueSBhdWRpbyBub2RlcyB0byB3aGljaCBpdCBtYXkgYmUgY29ubmVjdGVkXHJcbiAgICBpZiAoIHNvdW5kR2VuZXJhdG9yLmlzQ29ubmVjdGVkVG8oIHRoaXMuY29udm9sdmVyISApICkge1xyXG4gICAgICBzb3VuZEdlbmVyYXRvci5kaXNjb25uZWN0KCB0aGlzLmNvbnZvbHZlciEgKTtcclxuICAgIH1cclxuICAgIGlmICggc291bmRHZW5lcmF0b3IuaXNDb25uZWN0ZWRUbyggdGhpcy5kcnlHYWluTm9kZSEgKSApIHtcclxuICAgICAgc291bmRHZW5lcmF0b3IuZGlzY29ubmVjdCggdGhpcy5kcnlHYWluTm9kZSEgKTtcclxuICAgIH1cclxuICAgIHRoaXMuZ2Fpbk5vZGVzRm9yQ2F0ZWdvcmllcy5mb3JFYWNoKCBnYWluTm9kZSA9PiB7XHJcbiAgICAgIGlmICggc291bmRHZW5lcmF0b3IuaXNDb25uZWN0ZWRUbyggZ2Fpbk5vZGUgKSApIHtcclxuICAgICAgICBzb3VuZEdlbmVyYXRvci5kaXNjb25uZWN0KCBnYWluTm9kZSApO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgLy8gUmVtb3ZlIHRoZSBzb3VuZCBnZW5lcmF0b3IgZnJvbSB0aGUgbGlzdC5cclxuICAgIGlmICggc291bmRHZW5lcmF0b3JJbmZvICkge1xyXG4gICAgICB0aGlzLnNvdW5kR2VuZXJhdG9ySW5mb0FycmF5LnNwbGljZSggdGhpcy5zb3VuZEdlbmVyYXRvckluZm9BcnJheS5pbmRleE9mKCBzb3VuZEdlbmVyYXRvckluZm8gKSwgMSApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENsZWFuIHVwIGNyZWF0ZWQgRGlzcGxheWVkUHJvcGVydGllcyB0aGF0IHdlcmUgY3JlYXRlZCBmb3IgdGhlIGFzc29jaWF0ZWQgc291bmRHZW5lcmF0b3JcclxuICAgIGlmICggdGhpcy52aWV3Tm9kZURpc3BsYXllZFByb3BlcnR5TWFwLmhhcyggc291bmRHZW5lcmF0b3IgKSApIHtcclxuICAgICAgdGhpcy52aWV3Tm9kZURpc3BsYXllZFByb3BlcnR5TWFwLmdldCggc291bmRHZW5lcmF0b3IgKSEuZGlzcG9zZSgpO1xyXG4gICAgICB0aGlzLnZpZXdOb2RlRGlzcGxheWVkUHJvcGVydHlNYXAuZGVsZXRlKCBzb3VuZEdlbmVyYXRvciApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHRoZSBtYWluIG91dHB1dCBsZXZlbCBmb3Igc291bmRzLlxyXG4gICAqIEBwYXJhbSBsZXZlbCAtIHZhbGlkIHZhbHVlcyBmcm9tIDAgKG1pbikgdGhyb3VnaCAxIChtYXgpXHJcbiAgICovXHJcbiAgcHVibGljIHNldE1haW5PdXRwdXRMZXZlbCggbGV2ZWw6IG51bWJlciApOiB2b2lkIHtcclxuXHJcbiAgICAvLyBDaGVjayBpZiBpbml0aWFsaXphdGlvbiBoYXMgYmVlbiBkb25lLiAgVGhpcyBpcyBub3QgYW4gYXNzZXJ0aW9uIGJlY2F1c2UgdGhlIHNvdW5kIG1hbmFnZXIgbWF5IG5vdCBiZVxyXG4gICAgLy8gaW5pdGlhbGl6ZWQgaWYgc291bmQgaXMgbm90IGVuYWJsZWQgZm9yIHRoZSBzaW0uXHJcbiAgICBpZiAoICF0aGlzLmluaXRpYWxpemVkICkge1xyXG4gICAgICBjb25zb2xlLndhcm4oICdhbiBhdHRlbXB0IHdhcyBtYWRlIHRvIHNldCB0aGUgbWFpbiBvdXRwdXQgbGV2ZWwgb24gYW4gdW5pbml0aWFsaXplZCBzb3VuZCBtYW5hZ2VyLCBpZ25vcmluZycgKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHJhbmdlIGNoZWNrXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBsZXZlbCA+PSAwICYmIGxldmVsIDw9IDEsIGBvdXRwdXQgbGV2ZWwgdmFsdWUgb3V0IG9mIHJhbmdlOiAke2xldmVsfWAgKTtcclxuXHJcbiAgICB0aGlzLl9tYWluT3V0cHV0TGV2ZWwgPSBsZXZlbDtcclxuICAgIGlmICggdGhpcy5lbmFibGVkUHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgIHRoaXMubWFpbkdhaW5Ob2RlIS5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKFxyXG4gICAgICAgIGxldmVsLFxyXG4gICAgICAgIHBoZXRBdWRpb0NvbnRleHQuY3VycmVudFRpbWUgKyBMSU5FQVJfR0FJTl9DSEFOR0VfVElNRVxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBtYWluT3V0cHV0TGV2ZWwoIG91dHB1dExldmVsICkge1xyXG4gICAgdGhpcy5zZXRNYWluT3V0cHV0TGV2ZWwoIG91dHB1dExldmVsICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0IG1haW5PdXRwdXRMZXZlbCgpIHtcclxuICAgIHJldHVybiB0aGlzLmdldE1haW5PdXRwdXRMZXZlbCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBjdXJyZW50IG91dHB1dCBsZXZlbCBzZXR0aW5nLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXRNYWluT3V0cHV0TGV2ZWwoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9tYWluT3V0cHV0TGV2ZWw7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHRoZSBvdXRwdXQgbGV2ZWwgZm9yIHRoZSBzcGVjaWZpZWQgY2F0ZWdvcnkgb2Ygc291bmQgZ2VuZXJhdG9yLlxyXG4gICAqIEBwYXJhbSBjYXRlZ29yeU5hbWUgLSBuYW1lIG9mIGNhdGVnb3J5IHRvIHdoaWNoIHRoaXMgaW52b2NhdGlvbiBhcHBsaWVzXHJcbiAgICogQHBhcmFtIG91dHB1dExldmVsIC0gdmFsaWQgdmFsdWVzIGZyb20gMCB0aHJvdWdoIDFcclxuICAgKi9cclxuICBwdWJsaWMgc2V0T3V0cHV0TGV2ZWxGb3JDYXRlZ29yeSggY2F0ZWdvcnlOYW1lOiBzdHJpbmcsIG91dHB1dExldmVsOiBudW1iZXIgKTogdm9pZCB7XHJcblxyXG4gICAgLy8gQ2hlY2sgaWYgaW5pdGlhbGl6YXRpb24gaGFzIGJlZW4gZG9uZS4gIFRoaXMgaXMgbm90IGFuIGFzc2VydGlvbiBiZWNhdXNlIHRoZSBzb3VuZCBtYW5hZ2VyIG1heSBub3QgYmVcclxuICAgIC8vIGluaXRpYWxpemVkIGlmIHNvdW5kIGlzIG5vdCBlbmFibGVkIGZvciB0aGUgc2ltLlxyXG4gICAgaWYgKCAhdGhpcy5pbml0aWFsaXplZCApIHtcclxuICAgICAgY29uc29sZS53YXJuKCAnYW4gYXR0ZW1wdCB3YXMgbWFkZSB0byBzZXQgdGhlIG91dHB1dCBsZXZlbCBmb3IgYSBzb3VuZCBjYXRlZ29yeSBvbiBhbiB1bmluaXRpYWxpemVkIHNvdW5kIG1hbmFnZXIsIGlnbm9yaW5nJyApO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5pbml0aWFsaXplZCwgJ291dHB1dCBsZXZlbHMgZm9yIGNhdGVnb3JpZXMgY2Fubm90IGJlIGFkZGVkIHVudGlsIGluaXRpYWxpemF0aW9uIGhhcyBiZWVuIGRvbmUnICk7XHJcblxyXG4gICAgLy8gcmFuZ2UgY2hlY2tcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIG91dHB1dExldmVsID49IDAgJiYgb3V0cHV0TGV2ZWwgPD0gMSwgYG91dHB1dCBsZXZlbCB2YWx1ZSBvdXQgb2YgcmFuZ2U6ICR7b3V0cHV0TGV2ZWx9YCApO1xyXG5cclxuICAgIC8vIHZlcmlmeSB0aGF0IHRoZSBzcGVjaWZpZWQgY2F0ZWdvcnkgZXhpc3RzXHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCB0aGlzLmdhaW5Ob2Rlc0ZvckNhdGVnb3JpZXMuZ2V0KCBjYXRlZ29yeU5hbWUgKSwgYG5vIGNhdGVnb3J5IHdpdGggbmFtZSA9ICR7Y2F0ZWdvcnlOYW1lfWAgKTtcclxuXHJcbiAgICAvLyBTZXQgdGhlIGdhaW4gdmFsdWUgb24gdGhlIGFwcHJvcHJpYXRlIGdhaW4gbm9kZS5cclxuICAgIGNvbnN0IGdhaW5Ob2RlID0gdGhpcy5nYWluTm9kZXNGb3JDYXRlZ29yaWVzLmdldCggY2F0ZWdvcnlOYW1lICk7XHJcbiAgICBpZiAoIGdhaW5Ob2RlICkge1xyXG4gICAgICBnYWluTm9kZS5nYWluLnNldFZhbHVlQXRUaW1lKCBvdXRwdXRMZXZlbCwgcGhldEF1ZGlvQ29udGV4dC5jdXJyZW50VGltZSApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkIGEgZHVja2luZyBQcm9wZXJ0eS4gIFdoZW4gYW55IG9mIHRoZSBkdWNraW5nIFByb3BlcnRpZXMgYXJlIHRydWUsIHRoZSBvdXRwdXQgbGV2ZWwgd2lsbCBiZSBcImR1Y2tlZFwiLCBtZWFuaW5nXHJcbiAgICogdGhhdCBpdCB3aWxsIGJlIHJlZHVjZWQuXHJcbiAgICovXHJcbiAgcHVibGljIGFkZER1Y2tpbmdQcm9wZXJ0eSggZHVja2luZ1Byb3BlcnR5OiBUUmVhZE9ubHlQcm9wZXJ0eTxib29sZWFuPiApOiB2b2lkIHtcclxuICAgIHRoaXMuZHVja2luZ1Byb3BlcnRpZXMuYWRkKCBkdWNraW5nUHJvcGVydHkgKTtcclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmUgYSBkdWNraW5nIFByb3BlcnR5IHRoYXQgaGFkIGJlZW4gcHJldmlvdXNseSBhZGRlZC5cclxuICAgKi9cclxuICBwdWJsaWMgcmVtb3ZlRHVja2luZ1Byb3BlcnR5KCBkdWNraW5nUHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PGJvb2xlYW4+ICk6IHZvaWQge1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggdGhpcy5kdWNraW5nUHJvcGVydGllcy5pbmNsdWRlcyggZHVja2luZ1Byb3BlcnR5ICksICdkdWNraW5nIFByb3BlcnR5IG5vdCBwcmVzZW50JyApO1xyXG4gICAgdGhpcy5kdWNraW5nUHJvcGVydGllcy5yZW1vdmUoIGR1Y2tpbmdQcm9wZXJ0eSApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBvdXRwdXQgbGV2ZWwgZm9yIHRoZSBzcGVjaWZpZWQgc291bmQgZ2VuZXJhdG9yIGNhdGVnb3J5LlxyXG4gICAqIEBwYXJhbSBjYXRlZ29yeU5hbWUgLSBuYW1lIG9mIGNhdGVnb3J5IHRvIHdoaWNoIHRoaXMgaW52b2NhdGlvbiBhcHBsaWVzXHJcbiAgICovXHJcbiAgcHVibGljIGdldE91dHB1dExldmVsRm9yQ2F0ZWdvcnkoIGNhdGVnb3J5TmFtZTogc3RyaW5nICk6IG51bWJlciB7XHJcblxyXG4gICAgLy8gQ2hlY2sgaWYgaW5pdGlhbGl6YXRpb24gaGFzIGJlZW4gZG9uZS4gIFRoaXMgaXMgbm90IGFuIGFzc2VydGlvbiBiZWNhdXNlIHRoZSBzb3VuZCBtYW5hZ2VyIG1heSBub3QgYmVcclxuICAgIC8vIGluaXRpYWxpemVkIGlmIHNvdW5kIGlzIG5vdCBlbmFibGVkIGZvciB0aGUgc2ltLlxyXG4gICAgaWYgKCAhdGhpcy5pbml0aWFsaXplZCApIHtcclxuICAgICAgY29uc29sZS53YXJuKCAnYW4gYXR0ZW1wdCB3YXMgbWFkZSB0byBnZXQgdGhlIG91dHB1dCBsZXZlbCBmb3IgYSBzb3VuZCBjYXRlZ29yeSBvbiBhbiB1bmluaXRpYWxpemVkIHNvdW5kIG1hbmFnZXIsIHJldHVybmluZyAwJyApO1xyXG4gICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBHZXQgdGhlIEdhaW5Ob2RlIGZvciB0aGUgc3BlY2lmaWVkIGNhdGVnb3J5LlxyXG4gICAgY29uc3QgZ2Fpbk5vZGUgPSB0aGlzLmdhaW5Ob2Rlc0ZvckNhdGVnb3JpZXMuZ2V0KCBjYXRlZ29yeU5hbWUgKTtcclxuICAgIGFzc2VydCAmJiBhc3NlcnQoIGdhaW5Ob2RlLCBgbm8gY2F0ZWdvcnkgd2l0aCBuYW1lID0gJHtjYXRlZ29yeU5hbWV9YCApO1xyXG5cclxuICAgIHJldHVybiBnYWluTm9kZSEuZ2Fpbi52YWx1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgYW1vdW50IG9mIHJldmVyYi5cclxuICAgKiBAcGFyYW0gbmV3UmV2ZXJiTGV2ZWwgLSB2YWx1ZSBmcm9tIDAgdG8gMSwgMCA9IHRvdGFsbHkgZHJ5LCAxID0gd2V0XHJcbiAgICovXHJcbiAgcHVibGljIHNldFJldmVyYkxldmVsKCBuZXdSZXZlcmJMZXZlbDogbnVtYmVyICk6IHZvaWQge1xyXG5cclxuICAgIC8vIENoZWNrIGlmIGluaXRpYWxpemF0aW9uIGhhcyBiZWVuIGRvbmUuICBUaGlzIGlzIG5vdCBhbiBhc3NlcnRpb24gYmVjYXVzZSB0aGUgc291bmQgbWFuYWdlciBtYXkgbm90IGJlXHJcbiAgICAvLyBpbml0aWFsaXplZCBpZiBzb3VuZCBpcyBub3QgZW5hYmxlZCBmb3IgdGhlIHNpbS5cclxuICAgIGlmICggIXRoaXMuaW5pdGlhbGl6ZWQgKSB7XHJcbiAgICAgIGNvbnNvbGUud2FybiggJ2FuIGF0dGVtcHQgd2FzIG1hZGUgdG8gc2V0IHRoZSByZXZlcmIgbGV2ZWwgb24gYW4gdW5pbml0aWFsaXplZCBzb3VuZCBtYW5hZ2VyLCBpZ25vcmluZycgKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggbmV3UmV2ZXJiTGV2ZWwgIT09IHRoaXMuX3JldmVyYkxldmVsICkge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBuZXdSZXZlcmJMZXZlbCA+PSAwICYmIG5ld1JldmVyYkxldmVsIDw9IDEsIGByZXZlcmIgdmFsdWUgb3V0IG9mIHJhbmdlOiAke25ld1JldmVyYkxldmVsfWAgKTtcclxuICAgICAgY29uc3Qgbm93ID0gcGhldEF1ZGlvQ29udGV4dC5jdXJyZW50VGltZTtcclxuICAgICAgdGhpcy5yZXZlcmJHYWluTm9kZSEuZ2Fpbi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSggbmV3UmV2ZXJiTGV2ZWwsIG5vdyArIExJTkVBUl9HQUlOX0NIQU5HRV9USU1FICk7XHJcbiAgICAgIHRoaXMuZHJ5R2Fpbk5vZGUhLmdhaW4ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoIDEgLSBuZXdSZXZlcmJMZXZlbCwgbm93ICsgTElORUFSX0dBSU5fQ0hBTkdFX1RJTUUgKTtcclxuICAgICAgdGhpcy5fcmV2ZXJiTGV2ZWwgPSBuZXdSZXZlcmJMZXZlbDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgcmV2ZXJiTGV2ZWwoIHJldmVyYkxldmVsICkge1xyXG4gICAgdGhpcy5zZXRSZXZlcmJMZXZlbCggcmV2ZXJiTGV2ZWwgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgcmV2ZXJiTGV2ZWwoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmdldFJldmVyYkxldmVsKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0UmV2ZXJiTGV2ZWwoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl9yZXZlcmJMZXZlbDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgZW5hYmxlZCggZW5hYmxlZDogYm9vbGVhbiApIHtcclxuICAgIHRoaXMuZW5hYmxlZFByb3BlcnR5LnZhbHVlID0gZW5hYmxlZDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXQgZW5hYmxlZCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmVuYWJsZWRQcm9wZXJ0eS52YWx1ZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZXQgc29uaWZpY2F0aW9uTGV2ZWwoIHNvbmlmaWNhdGlvbkxldmVsOiBTb3VuZExldmVsRW51bSApIHtcclxuICAgIHRoaXMuZXh0cmFTb3VuZEVuYWJsZWRQcm9wZXJ0eS52YWx1ZSA9IHNvbmlmaWNhdGlvbkxldmVsID09PSBTb3VuZExldmVsRW51bS5FWFRSQTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEVTNSBnZXR0ZXIgZm9yIHNvbmlmaWNhdGlvbiBsZXZlbFxyXG4gICAqL1xyXG4gIHB1YmxpYyBnZXQgc29uaWZpY2F0aW9uTGV2ZWwoKTogU291bmRMZXZlbEVudW0ge1xyXG4gICAgcmV0dXJuIHRoaXMuZXh0cmFTb3VuZEVuYWJsZWRQcm9wZXJ0eS52YWx1ZSA/IFNvdW5kTGV2ZWxFbnVtLkVYVFJBIDogU291bmRMZXZlbEVudW0uQkFTSUM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBMb2cgdGhlIHZhbHVlIG9mIHRoZSBnYWluIHBhcmFtZXRlciBhdCBldmVyeSBhbmltYXRpb24gZnJhbWUgZm9yIHRoZSBzcGVjaWZpZWQgZHVyYXRpb24uICBUaGlzIGlzIHVzZWZ1bCBmb3JcclxuICAgKiBkZWJ1Z2dpbmcsIGJlY2F1c2UgdGhlc2UgcGFyYW1ldGVycyBjaGFuZ2Ugb3ZlciB0aW1lIHdoZW4gc2V0IHVzaW5nIG1ldGhvZHMgbGlrZSBcInNldFRhcmdldEF0VGltZVwiLCBhbmQgdGhlXHJcbiAgICogZGV0YWlscyBvZiBob3cgdGhleSBjaGFuZ2Ugc2VlbXMgdG8gYmUgZGlmZmVyZW50IG9uIHRoZSBkaWZmZXJlbnQgYnJvd3NlcnMuXHJcbiAgICpcclxuICAgKiBJdCBtYXkgYmUgcG9zc2libGUgdG8gcmVtb3ZlIHRoaXMgbWV0aG9kIHNvbWVkYXkgb25jZSB0aGUgYmVoYXZpb3IgaXMgbW9yZSBjb25zaXN0ZW50IGFjcm9zcyBicm93c2Vycy4gIFNlZVxyXG4gICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9yZXNpc3RhbmNlLWluLWEtd2lyZS9pc3N1ZXMvMjA1IGZvciBzb21lIGhpc3Rvcnkgb24gdGhpcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBnYWluTm9kZVxyXG4gICAqIEBwYXJhbSBkdXJhdGlvbiAtIGR1cmF0aW9uIGZvciBsb2dnaW5nLCBpbiBzZWNvbmRzXHJcbiAgICovXHJcbiAgcHVibGljIGxvZ0dhaW4oIGdhaW5Ob2RlOiBHYWluTm9kZSwgZHVyYXRpb246IG51bWJlciApOiB2b2lkIHtcclxuXHJcbiAgICBkdXJhdGlvbiA9IGR1cmF0aW9uIHx8IDE7XHJcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xyXG5cclxuICAgIC8vIGNsb3N1cmUgdGhhdCB3aWxsIGJlIGludm9rZWQgbXVsdGlwbGUgdGltZXMgdG8gbG9nIHRoZSBjaGFuZ2luZyB2YWx1ZXNcclxuICAgIGZ1bmN0aW9uIGxvZ0dhaW4oKTogdm9pZCB7XHJcbiAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XHJcbiAgICAgIGNvbnN0IHRpbWVJbk1pbGxpc2Vjb25kcyA9IG5vdyAtIHN0YXJ0VGltZTtcclxuICAgICAgY29uc29sZS5sb2coIGBUaW1lIChtcyk6ICR7VXRpbHMudG9GaXhlZCggdGltZUluTWlsbGlzZWNvbmRzLCAyICl9LCBHYWluIFZhbHVlOiAke2dhaW5Ob2RlLmdhaW4udmFsdWV9YCApO1xyXG4gICAgICBpZiAoIG5vdyAtIHN0YXJ0VGltZSA8ICggZHVyYXRpb24gKiAxMDAwICkgKSB7XHJcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSggbG9nR2FpbiApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCBHQUlOX0xPR0dJTkdfRU5BQkxFRCApIHtcclxuXHJcbiAgICAgIC8vIGtpY2sgb2ZmIHRoZSBsb2dnaW5nXHJcbiAgICAgIGNvbnNvbGUubG9nKCAnLS0tLS0tLSBzdGFydCBvZiBnYWluIGxvZ2dpbmcgLS0tLS0nICk7XHJcbiAgICAgIGxvZ0dhaW4oKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIExvZyB0aGUgdmFsdWUgb2YgdGhlIG1haW4gZ2FpbiBhcyBpdCBjaGFuZ2VzLCB1c2VkIHByaW1hcmlseSBmb3IgZGVidWcuXHJcbiAgICogQHBhcmFtIGR1cmF0aW9uIC0gaW4gc2Vjb25kc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBsb2dNYWluR2FpbiggZHVyYXRpb246IG51bWJlciApOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy5tYWluR2Fpbk5vZGUgKSB7XHJcbiAgICAgIHRoaXMubG9nR2FpbiggdGhpcy5tYWluR2Fpbk5vZGUsIGR1cmF0aW9uICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBMb2cgdGhlIHZhbHVlIG9mIHRoZSByZXZlcmIgZ2FpbiBhcyBpdCBjaGFuZ2VzLCB1c2VkIHByaW1hcmlseSBmb3IgZGVidWcuXHJcbiAgICogQHBhcmFtIGR1cmF0aW9uIC0gZHVyYXRpb24gZm9yIGxvZ2dpbmcsIGluIHNlY29uZHNcclxuICAgKi9cclxuICBwdWJsaWMgbG9nUmV2ZXJiR2FpbiggZHVyYXRpb246IG51bWJlciApOiB2b2lkIHtcclxuICAgIGlmICggdGhpcy5yZXZlcmJHYWluTm9kZSApIHtcclxuICAgICAgdGhpcy5sb2dHYWluKCB0aGlzLnJldmVyYkdhaW5Ob2RlLCBkdXJhdGlvbiApO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuY29uc3Qgc291bmRNYW5hZ2VyID0gbmV3IFNvdW5kTWFuYWdlcigpO1xyXG50YW1iby5yZWdpc3RlciggJ3NvdW5kTWFuYWdlcicsIHNvdW5kTWFuYWdlciApO1xyXG5leHBvcnQgZGVmYXVsdCBzb3VuZE1hbmFnZXI7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE9BQU9BLGVBQWUsTUFBTSxrQ0FBa0M7QUFDOUQsT0FBT0MsS0FBSyxNQUFNLHVCQUF1QjtBQUN6QyxTQUFTQyxPQUFPLEVBQUVDLGlCQUFpQixRQUFjLDZCQUE2QjtBQUM5RSxPQUFPQyxZQUFZLE1BQU0saUNBQWlDO0FBRTFELE9BQU9DLG9DQUFvQyxNQUFNLG1EQUFtRDtBQUNwRyxPQUFPQyw4QkFBOEIsTUFBTSxxQ0FBcUM7QUFDaEYsT0FBT0MsZ0JBQWdCLE1BQU0sdUJBQXVCO0FBQ3BELE9BQU9DLGNBQWMsTUFBTSxxQkFBcUI7QUFDaEQsT0FBT0MsY0FBYyxNQUFNLHFCQUFxQjtBQUNoRCxPQUFPQyxLQUFLLE1BQU0sWUFBWTtBQUU5QixPQUFPQyxTQUFTLE1BQU0saUNBQWlDO0FBRXZELE9BQU9DLFNBQVMsTUFBTSw0QkFBNEI7QUFDbEQsT0FBT0MsV0FBVyxNQUFNLG1DQUFtQztBQUMzRCxPQUFPQyxxQkFBcUIsTUFBMkIsd0NBQXdDOztBQUUvRjtBQUNBLE1BQU1DLG1CQUFtQixHQUFHLElBQUksQ0FBQyxDQUFDOztBQUVsQzs7QUFnQkE7O0FBTUE7O0FBY0E7QUFDQSxNQUFNQyxvQkFBb0IsR0FBRyxJQUFJO0FBQ2pDLE1BQU1DLHVCQUF1QixHQUFHVCxjQUFjLENBQUNVLCtCQUErQixDQUFDLENBQUM7QUFDaEYsTUFBTUMsb0JBQW9CLEdBQUcsS0FBSztB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