// Copyright 2021-2024, University of Colorado Boulder

/**
 * A Class that manages Simulation features that are enabled and disabled by user Preferences.
 *
 * @author Jesse Greenberg
 */

import { colorProfileProperty, voicingManager, voicingUtteranceQueue } from '../../../scenery/js/imports.js';
import responseCollector from '../../../utterance-queue/js/responseCollector.js';
import BooleanProperty from '../../../axon/js/BooleanProperty.js';
import joist from '../joist.js';
import PreferencesStorage from './PreferencesStorage.js';
import soundManager from '../../../tambo/js/soundManager.js';
import audioManager from '../audioManager.js';
import PhetioObject from '../../../tandem/js/PhetioObject.js';
import optionize from '../../../phet-core/js/optionize.js';
import SpeechSynthesisAnnouncer from '../../../utterance-queue/js/SpeechSynthesisAnnouncer.js';
import Tandem from '../../../tandem/js/Tandem.js';
import localeProperty from '../i18n/localeProperty.js';
import merge from '../../../phet-core/js/merge.js';
import IOType from '../../../tandem/js/types/IOType.js';
import BooleanIO from '../../../tandem/js/types/BooleanIO.js';
import Multilink from '../../../axon/js/Multilink.js';
import { supportedRegionAndCultureValues } from '../i18n/regionAndCultureProperty.js';
const AUDIO_MODEL_TANDEM = 'audioModel';
const VISUAL_MODEL_TANDEM = 'visualModel';
const INPUT_MODEL_TANDEM = 'inputModel';

///////////////////////////////////////////
// Options types

// preferences that are simulation-specific

/////////////////////////////////////
// Model types

// Model for controls that appear in the "Simulation" panel of preferences

// Model for controls that appear in the "Visual" panel of preferences

// Model for controls that appear in the "Audio" panel of preferences

export default class PreferencesModel extends PhetioObject {
  constructor(providedOptions = {}) {
    // initialize-globals uses package.json to determine defaults for features enabled by the sim and those defaults
    // can be overwritten by query parameter.  So phet.chipper.queryParameters contains an accurate representation of
    // which features are required.
    const phetFeaturesFromQueryParameters = phet.chipper.queryParameters;

    // Multiple optionize calls + spread in one initialization site so that TypeScript has the correct type for nested
    // options immediately, and we don't need multiple variables to achieve it.
    const options = {
      // Put the spread first so that nested options' defaults will correctly override
      // eslint-disable-next-line no-object-spread-on-non-literals
      ...optionize()({
        // phet-io
        tandem: Tandem.OPT_OUT,
        // Uninstrumented for now, but keep the file's instrumentation just in case, see https://github.com/phetsims/phet-io/issues/1913
        phetioType: PreferencesModel.PreferencesModelIO,
        phetioFeatured: true,
        phetioState: false,
        phetioReadOnly: true
      }, providedOptions),
      simulationOptions: optionize()({
        tandemName: 'simulationModel',
        customPreferences: []
      }, providedOptions.simulationOptions),
      visualOptions: optionize()({
        tandemName: VISUAL_MODEL_TANDEM,
        supportsProjectorMode: false,
        supportsInteractiveHighlights: phetFeaturesFromQueryParameters.supportsInteractiveHighlights,
        customPreferences: []
      }, providedOptions.visualOptions),
      audioOptions: optionize()({
        tandemName: AUDIO_MODEL_TANDEM,
        supportsVoicing: phetFeaturesFromQueryParameters.supportsVoicing,
        supportsSound: phetFeaturesFromQueryParameters.supportsSound,
        supportsExtraSound: phetFeaturesFromQueryParameters.supportsExtraSound,
        customPreferences: []
      }, providedOptions.audioOptions),
      inputOptions: optionize()({
        tandemName: INPUT_MODEL_TANDEM,
        supportsGestureControl: phetFeaturesFromQueryParameters.supportsGestureControl,
        customPreferences: []
      }, providedOptions.inputOptions),
      localizationOptions: optionize()({
        tandemName: 'localizationModel',
        supportsDynamicLocale: !!localeProperty.validValues && localeProperty.validValues.length > 1 && phet.chipper.queryParameters.supportsDynamicLocale,
        customPreferences: [],
        includeLocalePanel: true
      }, providedOptions.localizationOptions)
    };
    super(options);
    this.simulationModel = options.simulationOptions;
    const visualTandem = options.tandem.createTandem(VISUAL_MODEL_TANDEM);
    this.visualModel = merge({
      interactiveHighlightsEnabledProperty: new BooleanProperty(phet.chipper.queryParameters.interactiveHighlightsInitiallyEnabled, {
        tandem: visualTandem.createTandem('interactiveHighlightsEnabledProperty'),
        phetioState: false
      }),
      colorProfileProperty: colorProfileProperty
    }, options.visualOptions);

    // For now, the Voicing feature is only available when we are running in the English locale, accessibility
    // strings are not made available for translation. When running with dynamic locales, the voicing feature
    // is supported if English is available, but will be disabled until English is selected.
    const supportsVoicing = options.audioOptions.supportsVoicing && SpeechSynthesisAnnouncer.isSpeechSynthesisSupported() && (
    // Running with english locale OR an environment where locale switching is supported and
    // english is one of the available languages.
    phet.chipper.locale.startsWith('en') || phet.chipper.queryParameters.supportsDynamicLocale && _.some(localeProperty.validValues, value => value.startsWith('en')));

    // Audio can be disabled explicitly via query parameter
    const audioEnabled = phet.chipper.queryParameters.audio !== 'disabled';
    this.audioModel = {
      supportsVoicing: supportsVoicing && audioEnabled,
      supportsSound: options.audioOptions.supportsSound && audioEnabled,
      supportsExtraSound: options.audioOptions.supportsExtraSound && audioEnabled,
      audioEnabledProperty: audioManager.audioEnabledProperty,
      soundEnabledProperty: soundManager.enabledProperty,
      extraSoundEnabledProperty: soundManager.extraSoundEnabledProperty,
      voicingEnabledProperty: voicingManager.enabledProperty,
      voicingMainWindowVoicingEnabledProperty: voicingManager.mainWindowVoicingEnabledProperty,
      voicingObjectResponsesEnabledProperty: responseCollector.objectResponsesEnabledProperty,
      voicingContextResponsesEnabledProperty: responseCollector.contextResponsesEnabledProperty,
      voicingHintResponsesEnabledProperty: responseCollector.hintResponsesEnabledProperty,
      voicePitchProperty: voicingManager.voicePitchProperty,
      voiceRateProperty: voicingManager.voiceRateProperty,
      voiceProperty: voicingManager.voiceProperty,
      toolbarEnabledProperty: new BooleanProperty(true, {
        tandem: options.tandem.createTandem(AUDIO_MODEL_TANDEM).createTandem('toolbarEnabledProperty'),
        phetioState: false
      }),
      customPreferences: options.audioOptions.customPreferences,
      tandemName: options.audioOptions.tandemName
    };
    const inputTandem = options.tandem.createTandem(INPUT_MODEL_TANDEM);
    this.inputModel = merge({
      gestureControlsEnabledProperty: new BooleanProperty(false, {
        tandem: inputTandem.createTandem('gestureControlsEnabledProperty'),
        phetioState: false
      })
    }, options.inputOptions);
    this.localizationModel = merge({
      localeProperty: localeProperty
    }, options.localizationOptions);
    if (this.audioModel.supportsExtraSound) {
      assert && assert(this.audioModel.supportsSound, 'supportsSound must be true to also support extraSound');
    }
    this.addPhetioLinkedElementsForModel(options.tandem, this.simulationModel);
    this.addPhetioLinkedElementsForModel(options.tandem, this.visualModel, [{
      property: this.visualModel.colorProfileProperty
    }]);
    this.addPhetioLinkedElementsForModel(options.tandem, this.audioModel, [{
      property: this.audioModel.audioEnabledProperty,
      tandemName: 'audioEnabledProperty'
    }, {
      property: this.audioModel.soundEnabledProperty,
      tandemName: 'soundEnabledProperty'
    }, {
      property: this.audioModel.extraSoundEnabledProperty,
      tandemName: 'extraSoundEnabledProperty'
    }, {
      property: this.audioModel.voicingEnabledProperty,
      tandemName: 'voicingEnabledProperty'
    }, {
      property: this.audioModel.voicingMainWindowVoicingEnabledProperty,
      tandemName: 'voicingMainWindowVoicingEnabledProperty'
    }, {
      property: this.audioModel.voicingObjectResponsesEnabledProperty,
      tandemName: 'voicingObjectResponsesEnabledProperty'
    }, {
      property: this.audioModel.voicingContextResponsesEnabledProperty,
      tandemName: 'voicingContextResponsesEnabledProperty'
    }, {
      property: this.audioModel.voicingHintResponsesEnabledProperty,
      tandemName: 'voicingHintResponsesEnabledProperty'
    }, {
      property: this.audioModel.voicePitchProperty,
      tandemName: 'voicePitchProperty'
    }, {
      property: this.audioModel.voiceRateProperty,
      tandemName: 'voiceRateProperty'
    }]);
    this.addPhetioLinkedElementsForModel(options.tandem, this.inputModel);
    this.addPhetioLinkedElementsForModel(options.tandem, this.localizationModel, [{
      property: this.localizationModel.localeProperty,
      tandemName: 'localeProperty'
    }]);

    // Since voicingManager in Scenery can not use initialize-globals, set the initial value for whether Voicing is
    // enabled here in the PreferencesModel.
    if (supportsVoicing) {
      voicingManager.enabledProperty.value = phet.chipper.queryParameters.voicingInitiallyEnabled;

      // Voicing is only available in the 'en' locale currently. If the locale is changed away from English, Voicing is
      // disabled. The next time Voicing returns to 'en', Voicing will be enabled again.
      let voicingDisabledFromLocale = false;
      localeProperty.link(locale => {
        const englishLocale = voicingManager.voicingSupportedForLocale(locale);
        if (voicingManager.enabledProperty.value) {
          voicingManager.enabledProperty.value = englishLocale;
          voicingDisabledFromLocale = true;
        } else if (voicingDisabledFromLocale && englishLocale) {
          voicingManager.enabledProperty.value = true;
          voicingDisabledFromLocale = false;
        }
      });

      // The default utteranceQueue will be used for voicing of simulation components, and it is enabled when the
      // voicingManager is fully enabled (voicingManager is enabled and the voicing is enabled for the "main window"
      // sim screens)
      voicingManager.enabledProperty.link(enabled => {
        voicingUtteranceQueue.enabled = enabled;
        !enabled && voicingUtteranceQueue.clear();
      });

      // If initially enabled, then apply all responses on startup, can (and should) be overwritten by PreferencesStorage.
      if (phet.chipper.queryParameters.voicingInitiallyEnabled) {
        responseCollector.objectResponsesEnabledProperty.value = true;
        responseCollector.contextResponsesEnabledProperty.value = true;
        responseCollector.hintResponsesEnabledProperty.value = true;

        // Set the first voice according to PhET's preferred english voices
        const voicesMultilink = Multilink.multilink([voicingManager.voicesProperty, voicingManager.isInitializedProperty], (voices, initialized) => {
          if (initialized && voices.length > 0) {
            voicingManager.voiceProperty.value = voicingManager.getEnglishPrioritizedVoices()[0];
            Multilink.unmultilink(voicesMultilink);
          }
        });
      }
    }
    if (phet.chipper.queryParameters.printVoicingResponses) {
      voicingManager.startSpeakingEmitter.addListener(text => console.log(text));
    }
    this.registerPreferencesStorage();
  }

  /**
   * Set up preferencesStorage for supported PreferencesProperties. Don't include all-sound and all-audio controls
   * because that feel too global to automatically take the last value.
   */
  registerPreferencesStorage() {
    if (this.visualModel.supportsInteractiveHighlights) {
      PreferencesStorage.register(this.visualModel.interactiveHighlightsEnabledProperty, 'interactiveHighlightsEnabledProperty');
    }
    if (this.audioModel.supportsVoicing) {
      // Register these to be stored when PreferencesStorage is enabled.
      PreferencesStorage.register(this.audioModel.voicingObjectResponsesEnabledProperty, 'objectResponsesEnabledProperty');
      PreferencesStorage.register(this.audioModel.voicingContextResponsesEnabledProperty, 'contextResponsesEnabledProperty');
      PreferencesStorage.register(this.audioModel.voicingHintResponsesEnabledProperty, 'hintResponsesEnabledProperty');
      PreferencesStorage.register(this.audioModel.voiceRateProperty, 'voiceRateProperty');
      PreferencesStorage.register(this.audioModel.voicePitchProperty, 'voicePitchProperty');
    }
    if (this.audioModel.supportsExtraSound) {
      PreferencesStorage.register(this.audioModel.extraSoundEnabledProperty, 'extraSoundEnabledProperty');
    }
    if (this.inputModel.supportsGestureControl) {
      PreferencesStorage.register(this.inputModel.gestureControlsEnabledProperty, 'gestureControlsEnabledProperty');
    }
  }
  addPhetioLinkedElementsForModel(parentTandem, featureModel, additionalProperties = []) {
    const tandem = parentTandem.createTandem(featureModel.tandemName);
    const propertiesToLink = additionalProperties;
    for (let j = 0; j < propertiesToLink.length; j++) {
      const modelPropertyObject = propertiesToLink[j];
      const tandemName = modelPropertyObject.tandemName || modelPropertyObject.property.tandem.name;
      this.addLinkedElement(modelPropertyObject.property, {
        tandem: tandem.createTandem(tandemName)
      });
    }
  }
  preferenceModelHasCustom(preferenceModel) {
    return preferenceModel.customPreferences.length > 0;
  }

  /**
   * Returns true if the SimulationModel supports any preferences that can be changed.
   */
  supportsSimulationPreferences() {
    return this.preferenceModelHasCustom(this.simulationModel);
  }

  /**
   * Returns true if the VisualModel has any preferences that can be changed.
   */
  supportsVisualPreferences() {
    return this.visualModel.supportsInteractiveHighlights || this.visualModel.supportsProjectorMode || this.preferenceModelHasCustom(this.visualModel);
  }

  /**
   * Returns true if the AudioModel has any preferences that can be changed.
   */
  supportsAudioPreferences() {
    return this.audioModel.supportsSound || this.audioModel.supportsExtraSound || this.audioModel.supportsVoicing || this.preferenceModelHasCustom(this.audioModel);
  }

  /**
   * Returns true if the InputModel has any preferences that can be changed.
   */
  supportsInputPreferences() {
    return this.inputModel.supportsGestureControl || this.preferenceModelHasCustom(this.inputModel);
  }

  /**
   * Returns true if the LocalizationModel has any preferences that can be changed.
   */
  supportsLocalizationPreferences() {
    return this.localizationModel.supportsDynamicLocale || supportedRegionAndCultureValues.length > 1 || this.preferenceModelHasCustom(this.localizationModel);
  }

  /**
   * Returns true if this model supports any controllable preferences for the dialog. Returns false when the dialog
   * would have nothing to display.
   */
  shouldShowDialog() {
    return this.supportsSimulationPreferences() || this.supportsVisualPreferences() || this.supportsInputPreferences() || this.supportsLocalizationPreferences() || this.supportsAudioPreferences();
  }
  static PreferencesModelIO = new IOType('PreferencesModelIO', {
    valueType: PreferencesModel,
    toStateObject: preferencesModel => {
      return {
        supportsProjectorMode: preferencesModel.visualModel.supportsProjectorMode,
        supportsInteractiveHighlights: preferencesModel.visualModel.supportsInteractiveHighlights,
        supportsVoicing: preferencesModel.audioModel.supportsVoicing,
        supportsSound: preferencesModel.audioModel.supportsSound,
        supportsExtraSound: preferencesModel.audioModel.supportsExtraSound,
        supportsGestureControl: preferencesModel.inputModel.supportsGestureControl,
        supportsDynamicLocale: preferencesModel.localizationModel.supportsDynamicLocale,
        // Method-based
        supportsAudioPreferences: preferencesModel.supportsAudioPreferences(),
        supportsInputPreferences: preferencesModel.supportsInputPreferences(),
        supportsLocalizationPreferences: preferencesModel.supportsLocalizationPreferences(),
        supportsSimulationPreferences: preferencesModel.supportsSimulationPreferences(),
        supportsVisualPreferences: preferencesModel.supportsVisualPreferences()
      };
    },
    stateSchema: {
      supportsProjectorMode: BooleanIO,
      supportsInteractiveHighlights: BooleanIO,
      supportsVoicing: BooleanIO,
      supportsSound: BooleanIO,
      supportsExtraSound: BooleanIO,
      supportsGestureControl: BooleanIO,
      supportsDynamicLocale: BooleanIO,
      // Method-based
      supportsAudioPreferences: BooleanIO,
      supportsInputPreferences: BooleanIO,
      supportsLocalizationPreferences: BooleanIO,
      supportsSimulationPreferences: BooleanIO,
      supportsVisualPreferences: BooleanIO
    }
  });
}
joist.register('PreferencesModel', PreferencesModel);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb2xvclByb2ZpbGVQcm9wZXJ0eSIsInZvaWNpbmdNYW5hZ2VyIiwidm9pY2luZ1V0dGVyYW5jZVF1ZXVlIiwicmVzcG9uc2VDb2xsZWN0b3IiLCJCb29sZWFuUHJvcGVydHkiLCJqb2lzdCIsIlByZWZlcmVuY2VzU3RvcmFnZSIsInNvdW5kTWFuYWdlciIsImF1ZGlvTWFuYWdlciIsIlBoZXRpb09iamVjdCIsIm9wdGlvbml6ZSIsIlNwZWVjaFN5bnRoZXNpc0Fubm91bmNlciIsIlRhbmRlbSIsImxvY2FsZVByb3BlcnR5IiwibWVyZ2UiLCJJT1R5cGUiLCJCb29sZWFuSU8iLCJNdWx0aWxpbmsiLCJzdXBwb3J0ZWRSZWdpb25BbmRDdWx0dXJlVmFsdWVzIiwiQVVESU9fTU9ERUxfVEFOREVNIiwiVklTVUFMX01PREVMX1RBTkRFTSIsIklOUFVUX01PREVMX1RBTkRFTSIsIlByZWZlcmVuY2VzTW9kZWwiLCJjb25zdHJ1Y3RvciIsInByb3ZpZGVkT3B0aW9ucyIsInBoZXRGZWF0dXJlc0Zyb21RdWVyeVBhcmFtZXRlcnMiLCJwaGV0IiwiY2hpcHBlciIsInF1ZXJ5UGFyYW1ldGVycyIsIm9wdGlvbnMiLCJ0YW5kZW0iLCJPUFRfT1VUIiwicGhldGlvVHlwZSIsIlByZWZlcmVuY2VzTW9kZWxJTyIsInBoZXRpb0ZlYXR1cmVkIiwicGhldGlvU3RhdGUiLCJwaGV0aW9SZWFkT25seSIsInNpbXVsYXRpb25PcHRpb25zIiwidGFuZGVtTmFtZSIsImN1c3RvbVByZWZlcmVuY2VzIiwidmlzdWFsT3B0aW9ucyIsInN1cHBvcnRzUHJvamVjdG9yTW9kZSIsInN1cHBvcnRzSW50ZXJhY3RpdmVIaWdobGlnaHRzIiwiYXVkaW9PcHRpb25zIiwic3VwcG9ydHNWb2ljaW5nIiwic3VwcG9ydHNTb3VuZCIsInN1cHBvcnRzRXh0cmFTb3VuZCIsImlucHV0T3B0aW9ucyIsInN1cHBvcnRzR2VzdHVyZUNvbnRyb2wiLCJsb2NhbGl6YXRpb25PcHRpb25zIiwic3VwcG9ydHNEeW5hbWljTG9jYWxlIiwidmFsaWRWYWx1ZXMiLCJsZW5ndGgiLCJpbmNsdWRlTG9jYWxlUGFuZWwiLCJzaW11bGF0aW9uTW9kZWwiLCJ2aXN1YWxUYW5kZW0iLCJjcmVhdGVUYW5kZW0iLCJ2aXN1YWxNb2RlbCIsImludGVyYWN0aXZlSGlnaGxpZ2h0c0VuYWJsZWRQcm9wZXJ0eSIsImludGVyYWN0aXZlSGlnaGxpZ2h0c0luaXRpYWxseUVuYWJsZWQiLCJpc1NwZWVjaFN5bnRoZXNpc1N1cHBvcnRlZCIsImxvY2FsZSIsInN0YXJ0c1dpdGgiLCJfIiwic29tZSIsInZhbHVlIiwiYXVkaW9FbmFibGVkIiwiYXVkaW8iLCJhdWRpb01vZGVsIiwiYXVkaW9FbmFibGVkUHJvcGVydHkiLCJzb3VuZEVuYWJsZWRQcm9wZXJ0eSIsImVuYWJsZWRQcm9wZXJ0eSIsImV4dHJhU291bmRFbmFibGVkUHJvcGVydHkiLCJ2b2ljaW5nRW5hYmxlZFByb3BlcnR5Iiwidm9pY2luZ01haW5XaW5kb3dWb2ljaW5nRW5hYmxlZFByb3BlcnR5IiwibWFpbldpbmRvd1ZvaWNpbmdFbmFibGVkUHJvcGVydHkiLCJ2b2ljaW5nT2JqZWN0UmVzcG9uc2VzRW5hYmxlZFByb3BlcnR5Iiwib2JqZWN0UmVzcG9uc2VzRW5hYmxlZFByb3BlcnR5Iiwidm9pY2luZ0NvbnRleHRSZXNwb25zZXNFbmFibGVkUHJvcGVydHkiLCJjb250ZXh0UmVzcG9uc2VzRW5hYmxlZFByb3BlcnR5Iiwidm9pY2luZ0hpbnRSZXNwb25zZXNFbmFibGVkUHJvcGVydHkiLCJoaW50UmVzcG9uc2VzRW5hYmxlZFByb3BlcnR5Iiwidm9pY2VQaXRjaFByb3BlcnR5Iiwidm9pY2VSYXRlUHJvcGVydHkiLCJ2b2ljZVByb3BlcnR5IiwidG9vbGJhckVuYWJsZWRQcm9wZXJ0eSIsImlucHV0VGFuZGVtIiwiaW5wdXRNb2RlbCIsImdlc3R1cmVDb250cm9sc0VuYWJsZWRQcm9wZXJ0eSIsImxvY2FsaXphdGlvbk1vZGVsIiwiYXNzZXJ0IiwiYWRkUGhldGlvTGlua2VkRWxlbWVudHNGb3JNb2RlbCIsInByb3BlcnR5Iiwidm9pY2luZ0luaXRpYWxseUVuYWJsZWQiLCJ2b2ljaW5nRGlzYWJsZWRGcm9tTG9jYWxlIiwibGluayIsImVuZ2xpc2hMb2NhbGUiLCJ2b2ljaW5nU3VwcG9ydGVkRm9yTG9jYWxlIiwiZW5hYmxlZCIsImNsZWFyIiwidm9pY2VzTXVsdGlsaW5rIiwibXVsdGlsaW5rIiwidm9pY2VzUHJvcGVydHkiLCJpc0luaXRpYWxpemVkUHJvcGVydHkiLCJ2b2ljZXMiLCJpbml0aWFsaXplZCIsImdldEVuZ2xpc2hQcmlvcml0aXplZFZvaWNlcyIsInVubXVsdGlsaW5rIiwicHJpbnRWb2ljaW5nUmVzcG9uc2VzIiwic3RhcnRTcGVha2luZ0VtaXR0ZXIiLCJhZGRMaXN0ZW5lciIsInRleHQiLCJjb25zb2xlIiwibG9nIiwicmVnaXN0ZXJQcmVmZXJlbmNlc1N0b3JhZ2UiLCJyZWdpc3RlciIsInBhcmVudFRhbmRlbSIsImZlYXR1cmVNb2RlbCIsImFkZGl0aW9uYWxQcm9wZXJ0aWVzIiwicHJvcGVydGllc1RvTGluayIsImoiLCJtb2RlbFByb3BlcnR5T2JqZWN0IiwibmFtZSIsImFkZExpbmtlZEVsZW1lbnQiLCJwcmVmZXJlbmNlTW9kZWxIYXNDdXN0b20iLCJwcmVmZXJlbmNlTW9kZWwiLCJzdXBwb3J0c1NpbXVsYXRpb25QcmVmZXJlbmNlcyIsInN1cHBvcnRzVmlzdWFsUHJlZmVyZW5jZXMiLCJzdXBwb3J0c0F1ZGlvUHJlZmVyZW5jZXMiLCJzdXBwb3J0c0lucHV0UHJlZmVyZW5jZXMiLCJzdXBwb3J0c0xvY2FsaXphdGlvblByZWZlcmVuY2VzIiwic2hvdWxkU2hvd0RpYWxvZyIsInZhbHVlVHlwZSIsInRvU3RhdGVPYmplY3QiLCJwcmVmZXJlbmNlc01vZGVsIiwic3RhdGVTY2hlbWEiXSwic291cmNlcyI6WyJQcmVmZXJlbmNlc01vZGVsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxLTIwMjQsIFVuaXZlcnNpdHkgb2YgQ29sb3JhZG8gQm91bGRlclxyXG5cclxuLyoqXHJcbiAqIEEgQ2xhc3MgdGhhdCBtYW5hZ2VzIFNpbXVsYXRpb24gZmVhdHVyZXMgdGhhdCBhcmUgZW5hYmxlZCBhbmQgZGlzYWJsZWQgYnkgdXNlciBQcmVmZXJlbmNlcy5cclxuICpcclxuICogQGF1dGhvciBKZXNzZSBHcmVlbmJlcmdcclxuICovXHJcblxyXG5pbXBvcnQgeyBjb2xvclByb2ZpbGVQcm9wZXJ0eSwgTm9kZSwgdm9pY2luZ01hbmFnZXIsIHZvaWNpbmdVdHRlcmFuY2VRdWV1ZSB9IGZyb20gJy4uLy4uLy4uL3NjZW5lcnkvanMvaW1wb3J0cy5qcyc7XHJcbmltcG9ydCByZXNwb25zZUNvbGxlY3RvciBmcm9tICcuLi8uLi8uLi91dHRlcmFuY2UtcXVldWUvanMvcmVzcG9uc2VDb2xsZWN0b3IuanMnO1xyXG5pbXBvcnQgQm9vbGVhblByb3BlcnR5IGZyb20gJy4uLy4uLy4uL2F4b24vanMvQm9vbGVhblByb3BlcnR5LmpzJztcclxuaW1wb3J0IGpvaXN0IGZyb20gJy4uL2pvaXN0LmpzJztcclxuaW1wb3J0IFByZWZlcmVuY2VzU3RvcmFnZSBmcm9tICcuL1ByZWZlcmVuY2VzU3RvcmFnZS5qcyc7XHJcbmltcG9ydCBzb3VuZE1hbmFnZXIgZnJvbSAnLi4vLi4vLi4vdGFtYm8vanMvc291bmRNYW5hZ2VyLmpzJztcclxuaW1wb3J0IGF1ZGlvTWFuYWdlciBmcm9tICcuLi9hdWRpb01hbmFnZXIuanMnO1xyXG5pbXBvcnQgUHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9Qcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBOdW1iZXJQcm9wZXJ0eSBmcm9tICcuLi8uLi8uLi9heG9uL2pzL051bWJlclByb3BlcnR5LmpzJztcclxuaW1wb3J0IFBoZXRpb09iamVjdCwgeyBQaGV0aW9PYmplY3RPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL1BoZXRpb09iamVjdC5qcyc7XHJcbmltcG9ydCBvcHRpb25pemUsIHsgRW1wdHlTZWxmT3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL3BoZXQtY29yZS9qcy9vcHRpb25pemUuanMnO1xyXG5pbXBvcnQgU3BlZWNoU3ludGhlc2lzQW5ub3VuY2VyIGZyb20gJy4uLy4uLy4uL3V0dGVyYW5jZS1xdWV1ZS9qcy9TcGVlY2hTeW50aGVzaXNBbm5vdW5jZXIuanMnO1xyXG5pbXBvcnQgVGFuZGVtIGZyb20gJy4uLy4uLy4uL3RhbmRlbS9qcy9UYW5kZW0uanMnO1xyXG5pbXBvcnQgbG9jYWxlUHJvcGVydHksIHsgTG9jYWxlIH0gZnJvbSAnLi4vaTE4bi9sb2NhbGVQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBtZXJnZSBmcm9tICcuLi8uLi8uLi9waGV0LWNvcmUvanMvbWVyZ2UuanMnO1xyXG5pbXBvcnQgVFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9UUmVhZE9ubHlQcm9wZXJ0eS5qcyc7XHJcbmltcG9ydCBJT1R5cGUgZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL3R5cGVzL0lPVHlwZS5qcyc7XHJcbmltcG9ydCBCb29sZWFuSU8gZnJvbSAnLi4vLi4vLi4vdGFuZGVtL2pzL3R5cGVzL0Jvb2xlYW5JTy5qcyc7XHJcbmltcG9ydCBNdWx0aWxpbmsgZnJvbSAnLi4vLi4vLi4vYXhvbi9qcy9NdWx0aWxpbmsuanMnO1xyXG5pbXBvcnQgeyBzdXBwb3J0ZWRSZWdpb25BbmRDdWx0dXJlVmFsdWVzIH0gZnJvbSAnLi4vaTE4bi9yZWdpb25BbmRDdWx0dXJlUHJvcGVydHkuanMnO1xyXG5cclxudHlwZSBNb2RlbFByb3BlcnR5TGlua2FibGUgPSB7XHJcbiAgcHJvcGVydHk6IFRSZWFkT25seVByb3BlcnR5PHVua25vd24+ICYgUGhldGlvT2JqZWN0O1xyXG4gIHRhbmRlbU5hbWU/OiBzdHJpbmc7IC8vIGlmIGJsYW5rLCB3aWxsIHVzZSB0aGUgdGFuZGVtLm5hbWUgb2YgdGhlIFByb3BlcnR5LlxyXG59O1xyXG50eXBlIEN1c3RvbVByZWZlcmVuY2UgPSB7XHJcblxyXG4gIC8vIENvbnRlbnQgc2hvdWxkIGNyZWF0ZSBhIGNoaWxkIHRhbmRlbSBjYWxsZWQgJ3NpbVByZWZlcmVuY2VzJ1xyXG4gIGNyZWF0ZUNvbnRlbnQ6ICggcGFyZW50VGFuZGVtOiBUYW5kZW0gKSA9PiBOb2RlO1xyXG59O1xyXG5cclxudHlwZSBDdXN0b21QcmVmZXJlbmNlc09wdGlvbnMgPSB7XHJcbiAgY3VzdG9tUHJlZmVyZW5jZXM/OiBDdXN0b21QcmVmZXJlbmNlW107XHJcbn07XHJcblxyXG5jb25zdCBBVURJT19NT0RFTF9UQU5ERU0gPSAnYXVkaW9Nb2RlbCc7XHJcbmNvbnN0IFZJU1VBTF9NT0RFTF9UQU5ERU0gPSAndmlzdWFsTW9kZWwnO1xyXG5jb25zdCBJTlBVVF9NT0RFTF9UQU5ERU0gPSAnaW5wdXRNb2RlbCc7XHJcblxyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIE9wdGlvbnMgdHlwZXNcclxuXHJcbi8vIHByZWZlcmVuY2VzIHRoYXQgYXJlIHNpbXVsYXRpb24tc3BlY2lmaWNcclxudHlwZSBTaW11bGF0aW9uUHJlZmVyZW5jZXNPcHRpb25zID0gQ3VzdG9tUHJlZmVyZW5jZXNPcHRpb25zO1xyXG5cclxudHlwZSBWaXN1YWxQcmVmZXJlbmNlc09wdGlvbnMgPSB7XHJcblxyXG4gIC8vIFdoZXRoZXIgdGhlIHNpbSBzdXBwb3J0cyBwcm9qZWN0b3IgbW9kZSBhbmQgYSB0b2dnbGUgc3dpdGNoIHRvIGVuYWJsZSBpdCBpbiB0aGUgUHJlZmVyZW5jZXNEaWFsb2cuXHJcbiAgc3VwcG9ydHNQcm9qZWN0b3JNb2RlPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gd2hldGhlciB0aGUgc2ltIHN1cHBvcnRzIHRoZSBcIkludGVyYWN0aXZlIEhpZ2hsaWdodHNcIiBmZWF0dXJlLCBhbmQgY2hlY2tib3ggdG8gZW5hYmxlIGluIHRoZVxyXG4gIC8vIFByZWZlcmVuY2VzIERpYWxvZ1xyXG4gIHN1cHBvcnRzSW50ZXJhY3RpdmVIaWdobGlnaHRzPzogYm9vbGVhbjtcclxufSAmIEN1c3RvbVByZWZlcmVuY2VzT3B0aW9ucztcclxuXHJcbnR5cGUgQXVkaW9QcmVmZXJlbmNlc09wdGlvbnMgPSB7XHJcblxyXG4gIC8vIFRoZSBlbnRyeSBwb2ludCBmb3IgVm9pY2luZywgYW5kIGlmIHRydWUgdGhlIHNpbSB3aWxsIHN1cHBvcnQgVm9pY2luZyBhbmQgVm9pY2luZyBvcHRpb25zIGluIFByZWZlcmVuY2VzLlxyXG4gIC8vIFRoZSBmZWF0dXJlIGlzIG9ubHkgYXZhaWxhYmxlIG9uIHBsYXRmb3JtcyB3aGVyZSBTcGVlY2hTeW50aGVzaXMgaXMgc3VwcG9ydGVkLiBGb3Igbm93LCBpdCBpcyBvbmx5IGF2YWlsYWJsZVxyXG4gIC8vIHdoZW4gcnVubmluZyB3aXRoIEVuZ2xpc2ggbG9jYWxlcywgYWNjZXNzaWJpbGl0eSBzdHJpbmdzIGFyZSBub3QgbWFkZSBhdmFpbGFibGUgZm9yIHRyYW5zbGF0aW9uIHlldC5cclxuICBzdXBwb3J0c1ZvaWNpbmc/OiBib29sZWFuO1xyXG5cclxuICAvLyBXaGV0aGVyIHRvIGluY2x1ZGUgY2hlY2tib3hlcyByZWxhdGVkIHRvIHNvdW5kIGFuZCBleHRyYSBzb3VuZC4gc3VwcG9ydHNFeHRyYVNvdW5kIGNhbiBvbmx5IGJlXHJcbiAgLy8gaW5jbHVkZWQgaWYgc3VwcG9ydHNTb3VuZCBpcyBhbHNvIHRydWUuXHJcbiAgc3VwcG9ydHNTb3VuZD86IGJvb2xlYW47XHJcbiAgc3VwcG9ydHNFeHRyYVNvdW5kPzogYm9vbGVhbjtcclxufSAmIEN1c3RvbVByZWZlcmVuY2VzT3B0aW9ucztcclxuXHJcbnR5cGUgSW5wdXRQcmVmZXJlbmNlc09wdGlvbnMgPSB7XHJcblxyXG4gIC8vIFdoZXRoZXIgdG8gaW5jbHVkZSBcImdlc3R1cmVcIiBjb250cm9sc1xyXG4gIHN1cHBvcnRzR2VzdHVyZUNvbnRyb2w/OiBib29sZWFuO1xyXG59ICYgQ3VzdG9tUHJlZmVyZW5jZXNPcHRpb25zO1xyXG5cclxudHlwZSBMb2NhbGl6YXRpb25QcmVmZXJlbmNlc09wdGlvbnMgPSB7XHJcblxyXG4gIC8vIFdoZXRoZXIgdG8gaW5jbHVkZSBhIFVJIGNvbXBvbmVudCB0aGF0IGNoYW5nZXMgdGhlIHNpbSBsYW5ndWFnZS4gRGVmYXVsdCBmb3IgdGhpcyBpbiBwaGV0RmVhdHVyZXMgaXMgdHJ1ZS4gQnV0IGl0XHJcbiAgLy8gaXMgc3RpbGwgb25seSBhdmFpbGFibGUgd2hlbiBsb2NhbGVQcm9wZXJ0eSBpbmRpY2F0ZXMgdGhhdCBtb3JlIHRoYW4gb25lIGxvY2FsZSBpcyBhdmFpbGFibGUuXHJcbiAgc3VwcG9ydHNEeW5hbWljTG9jYWxlPzogYm9vbGVhbjtcclxuXHJcbiAgLy8gV2hldGhlciB0byBpbmNsdWRlIHRoZSBkZWZhdWx0IExvY2FsZVBhbmVsIGZvciBzZWxlY3RpbmcgbG9jYWxlLiBUaGlzIHdhcyBhZGRlZCB0byBhbGxvdyBzaW1zIGxpa2VcclxuICAvLyBOdW1iZXIgUGxheSBhbmQgTnVtYmVyIENvbXBhcmUgdG8gc3Vic3RpdHV0ZSB0aGVpciBvd24gY3VzdG9tIGNvbnRyb2xzLlxyXG4gIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvbnVtYmVyLXN1aXRlLWNvbW1vbi9pc3N1ZXMvNDcuXHJcbiAgaW5jbHVkZUxvY2FsZVBhbmVsPzogYm9vbGVhbjtcclxufSAmIEN1c3RvbVByZWZlcmVuY2VzT3B0aW9ucztcclxuXHJcbnR5cGUgUHJlZmVyZW5jZXNNb2RlbFNlbGZPcHRpb25zID0ge1xyXG5cclxuICAvLyBjb25maWd1cmF0aW9uIGZvciBjb250cm9scyBpbiB0aGUgXCJTaW11bGF0aW9uXCIgdGFiIG9mIHRoZSBQcmVmZXJlbmNlc0RpYWxvZ1xyXG4gIHNpbXVsYXRpb25PcHRpb25zPzogU2ltdWxhdGlvblByZWZlcmVuY2VzT3B0aW9ucztcclxuXHJcbiAgLy8gY29uZmlndXJhdGlvbiBmb3IgY29udHJvbHMgaW4gdGhlIFwiVmlzdWFsXCIgdGFiIG9mIHRoZSBQcmVmZXJlbmNlc0RpYWxvZ1xyXG4gIHZpc3VhbE9wdGlvbnM/OiBWaXN1YWxQcmVmZXJlbmNlc09wdGlvbnM7XHJcblxyXG4gIC8vIGNvbmZpZ3VyYXRpb24gZm9yIGNvbnRyb2xzIGluIHRoZSBcIkF1ZGlvXCIgdGFiIG9mIHRoZSBQcmVmZXJlbmNlc0RpYWxvZ1xyXG4gIGF1ZGlvT3B0aW9ucz86IEF1ZGlvUHJlZmVyZW5jZXNPcHRpb25zO1xyXG5cclxuICAvLyBjb25maWd1cmF0aW9uIGZvciBjb250cm9scyBpbiB0aGUgXCJJbnB1dFwiIHRhYiBvZiB0aGUgUHJlZmVyZW5jZXNEaWFsb2dcclxuICBpbnB1dE9wdGlvbnM/OiBJbnB1dFByZWZlcmVuY2VzT3B0aW9ucztcclxuXHJcbiAgLy8gY29uZmlndXJhdGlvbiBmb3IgY29udHJvbHMgaW4gdGhlIFwiTG9jYWxpemF0aW9uXCIgdGFiIG9mIHRoZSBQcmVmZXJlbmNlc0RpYWxvZ1xyXG4gIGxvY2FsaXphdGlvbk9wdGlvbnM/OiBMb2NhbGl6YXRpb25QcmVmZXJlbmNlc09wdGlvbnM7XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBQcmVmZXJlbmNlc01vZGVsT3B0aW9ucyA9IFByZWZlcmVuY2VzTW9kZWxTZWxmT3B0aW9ucyAmIFBoZXRpb09iamVjdE9wdGlvbnM7XHJcblxyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIE1vZGVsIHR5cGVzXHJcblxyXG50eXBlIEJhc2VNb2RlbFR5cGUgPSB7XHJcbiAgdGFuZGVtTmFtZTogc3RyaW5nOyAvLyB0YW5kZW0gbmFtZSBvZiB0aGUgbW9kZWwsIGxpa2UgXCJhdWRpb01vZGVsXCJcclxufTtcclxuXHJcbi8vIE1vZGVsIGZvciBjb250cm9scyB0aGF0IGFwcGVhciBpbiB0aGUgXCJTaW11bGF0aW9uXCIgcGFuZWwgb2YgcHJlZmVyZW5jZXNcclxuZXhwb3J0IHR5cGUgU2ltdWxhdGlvbk1vZGVsID0gQmFzZU1vZGVsVHlwZSAmIFJlcXVpcmVkPFNpbXVsYXRpb25QcmVmZXJlbmNlc09wdGlvbnM+O1xyXG5cclxuLy8gTW9kZWwgZm9yIGNvbnRyb2xzIHRoYXQgYXBwZWFyIGluIHRoZSBcIlZpc3VhbFwiIHBhbmVsIG9mIHByZWZlcmVuY2VzXHJcbmV4cG9ydCB0eXBlIFZpc3VhbE1vZGVsID0gQmFzZU1vZGVsVHlwZSAmIHtcclxuXHJcbiAgLy8gV2hldGhlciBcIkludGVyYWN0aXZlIEhpZ2hsaWdodHNcIiBhcmUgZW5hYmxlZCBmb3IgdGhlIHNpbXVsYXRpb24uIElmIGVuYWJsZWQsIGZvY3VzIGhpZ2hsaWdodHMgd2lsbCBhcHBlYXIgYXJvdW5kXHJcbiAgLy8gZm9jdXNhYmxlIGNvbXBvbmVudHMgd2l0aCAnb3ZlcicgZXZlbnRzLCBhbmQgcGVyc2lzdCBhcm91bmQgdGhlIGZvY3VzZWQgZWxlbWVudCBldmVuIHdpdGggbW91c2UgYW5kIHRvdWNoXHJcbiAgLy8gaW50ZXJhY3Rpb24uXHJcbiAgaW50ZXJhY3RpdmVIaWdobGlnaHRzRW5hYmxlZFByb3BlcnR5OiBQcm9wZXJ0eTxib29sZWFuPjtcclxuXHJcbiAgLy8gVGhlIGN1cnJlbnQgY29sb3JQcm9maWxlIG9mIHRoZSBTaW11bGF0aW9uXHJcbiAgY29sb3JQcm9maWxlUHJvcGVydHk6IFByb3BlcnR5PHN0cmluZz47XHJcbn0gJiBSZXF1aXJlZDxWaXN1YWxQcmVmZXJlbmNlc09wdGlvbnM+O1xyXG5cclxuLy8gTW9kZWwgZm9yIGNvbnRyb2xzIHRoYXQgYXBwZWFyIGluIHRoZSBcIkF1ZGlvXCIgcGFuZWwgb2YgcHJlZmVyZW5jZXNcclxuZXhwb3J0IHR5cGUgQXVkaW9Nb2RlbCA9IEJhc2VNb2RlbFR5cGUgJiB7XHJcblxyXG4gIC8vIFdoZW4gZmFsc2UsIG5vIGF1ZGlvIGZlYXR1cmVzIGFyZSBoZWFyZC4gU2VlIGF1ZGlvTWFuYWdlci50cyBmb3IgZG9jdW1lbnRhdGlvbiBhYm91dCBhdWRpbyBhbmQgc3ViIGZlYXR1cmVzLlxyXG4gIGF1ZGlvRW5hYmxlZFByb3BlcnR5OiBQcm9wZXJ0eTxib29sZWFuPjtcclxuICBzb3VuZEVuYWJsZWRQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcbiAgZXh0cmFTb3VuZEVuYWJsZWRQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcbiAgdm9pY2luZ0VuYWJsZWRQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcblxyXG4gIC8vIFdoZXRoZXIgc3ViLWZlYXR1cmVzIG9mIFZvaWNpbmcgYXJlIGVuYWJsZWQuIFNlZSB2b2ljaW5nTWFuYWdlciBhbmQgcmVzcG9uc2VDb2xsZWN0b3IgZm9yIGRvY3VtZW50YXRpb24gYWJvdXRcclxuICAvLyBlYWNoIG9mIHRoZXNlIGZlYXR1cmVzLlxyXG4gIHZvaWNpbmdNYWluV2luZG93Vm9pY2luZ0VuYWJsZWRQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcbiAgdm9pY2luZ09iamVjdFJlc3BvbnNlc0VuYWJsZWRQcm9wZXJ0eTogUHJvcGVydHk8Ym9vbGVhbj47XHJcbiAgdm9pY2luZ0NvbnRleHRSZXNwb25zZXNFbmFibGVkUHJvcGVydHk6IFByb3BlcnR5PGJvb2xlYW4+O1xyXG4gIHZvaWNpbmdIaW50UmVzcG9uc2VzRW5hYmxlZFByb3BlcnR5OiBQcm9wZXJ0eTxib29sZWFuPjtcclxuXHJcbiAgLy8gQ29udHJvbHMgZm9yIHRoZSB2b2ljZSBvZiBTcGVlY2hTeW50aGVzaXNBbm5vdW5jZXIudHNcclxuICB2b2ljZVBpdGNoUHJvcGVydHk6IE51bWJlclByb3BlcnR5O1xyXG4gIHZvaWNlUmF0ZVByb3BlcnR5OiBOdW1iZXJQcm9wZXJ0eTtcclxuICB2b2ljZVByb3BlcnR5OiBQcm9wZXJ0eTxudWxsIHwgU3BlZWNoU3ludGhlc2lzVm9pY2U+OyAvLyBOb3QgYSBQaEVULWlPIGxpbmtlZCBlbGVtZW50IGJlY2F1c2UgaXQgY2FuJ3QgYmUgY3VzdG9taXplZCB0aHJvdWdoIHRoZSBBUEkuXHJcblxyXG4gIC8vIFdoZXRoZXIgdGhlIFNpbSBUb29sYmFyIGlzIGVuYWJsZWQsIHdoaWNoIGdpdmVzIHF1aWNrIGFjY2VzcyB0byBWb2ljaW5nIGNvbnRyb2xzIGFuZCBmZWF0dXJlcy5cclxuICB0b29sYmFyRW5hYmxlZFByb3BlcnR5OiBQcm9wZXJ0eTxib29sZWFuPjtcclxufSAmIFJlcXVpcmVkPEF1ZGlvUHJlZmVyZW5jZXNPcHRpb25zPjtcclxuXHJcbmV4cG9ydCB0eXBlIElucHV0TW9kZWwgPSBCYXNlTW9kZWxUeXBlICYge1xyXG5cclxuICAvLyBXaGV0aGVyIFwiR2VzdHVyZSBDb250cm9sc1wiIGFyZSBlbmFibGVkIGZvciB0aGUgc2ltdWxhdGlvbi4gSWYgZW5hYmxlZCwgdG91Y2ggc2NyZWVuIGlucHV0IHdpbGwgY2hhbmdlIHRvIHdvcmtcclxuICAvLyBsaWtlIGEgc2NyZWVuIHJlYWRlci4gSG9yaXpvbnRhbCBzd2lwZXMgYWNyb3NzIHRoZSBzY3JlZW4gd2lsbCBtb3ZlIGZvY3VzLCBkb3VibGUtdGFwcyB3aWxsIGFjdGl2YXRlIHRoZVxyXG4gIC8vIHNlbGVjdGVkIGl0ZW0sIGFuZCB0YXAgdGhlbiBob2xkIHdpbGwgaW5pdGlhdGUgZHJhZyBhbmQgZHJvcCBpbnRlcmFjdGlvbnMuIE5vdGUgdGhhdCBlbmFibGluZyB0aGlzIHdpbGwgZ2VuZXJhbGx5XHJcbiAgLy8gcHJldmVudCBhbGwgdG91Y2ggaW5wdXQgZnJvbSB3b3JraW5nIGFzIGl0IGRvZXMgbm9ybWFsbHkuXHJcbiAgZ2VzdHVyZUNvbnRyb2xzRW5hYmxlZFByb3BlcnR5OiBQcm9wZXJ0eTxib29sZWFuPjtcclxuXHJcbn0gJiBSZXF1aXJlZDxJbnB1dFByZWZlcmVuY2VzT3B0aW9ucz47XHJcblxyXG5leHBvcnQgdHlwZSBMb2NhbGl6YXRpb25Nb2RlbCA9IEJhc2VNb2RlbFR5cGUgJiB7XHJcbiAgbG9jYWxlUHJvcGVydHk6IFByb3BlcnR5PExvY2FsZT47XHJcbn0gJiBSZXF1aXJlZDxMb2NhbGl6YXRpb25QcmVmZXJlbmNlc09wdGlvbnM+O1xyXG5cclxudHlwZSBGZWF0dXJlTW9kZWwgPSBTaW11bGF0aW9uTW9kZWwgfCBBdWRpb01vZGVsIHwgVmlzdWFsTW9kZWwgfCBJbnB1dE1vZGVsIHwgTG9jYWxpemF0aW9uTW9kZWw7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcmVmZXJlbmNlc01vZGVsIGV4dGVuZHMgUGhldGlvT2JqZWN0IHtcclxuICBwdWJsaWMgcmVhZG9ubHkgc2ltdWxhdGlvbk1vZGVsOiBTaW11bGF0aW9uTW9kZWw7XHJcbiAgcHVibGljIHJlYWRvbmx5IHZpc3VhbE1vZGVsOiBWaXN1YWxNb2RlbDtcclxuICBwdWJsaWMgcmVhZG9ubHkgYXVkaW9Nb2RlbDogQXVkaW9Nb2RlbDtcclxuICBwdWJsaWMgcmVhZG9ubHkgaW5wdXRNb2RlbDogSW5wdXRNb2RlbDtcclxuICBwdWJsaWMgcmVhZG9ubHkgbG9jYWxpemF0aW9uTW9kZWw6IExvY2FsaXphdGlvbk1vZGVsO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoIHByb3ZpZGVkT3B0aW9uczogUHJlZmVyZW5jZXNNb2RlbE9wdGlvbnMgPSB7fSApIHtcclxuXHJcbiAgICAvLyBpbml0aWFsaXplLWdsb2JhbHMgdXNlcyBwYWNrYWdlLmpzb24gdG8gZGV0ZXJtaW5lIGRlZmF1bHRzIGZvciBmZWF0dXJlcyBlbmFibGVkIGJ5IHRoZSBzaW0gYW5kIHRob3NlIGRlZmF1bHRzXHJcbiAgICAvLyBjYW4gYmUgb3ZlcndyaXR0ZW4gYnkgcXVlcnkgcGFyYW1ldGVyLiAgU28gcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycyBjb250YWlucyBhbiBhY2N1cmF0ZSByZXByZXNlbnRhdGlvbiBvZlxyXG4gICAgLy8gd2hpY2ggZmVhdHVyZXMgYXJlIHJlcXVpcmVkLlxyXG4gICAgY29uc3QgcGhldEZlYXR1cmVzRnJvbVF1ZXJ5UGFyYW1ldGVycyA9IHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnM7XHJcblxyXG4gICAgLy8gTXVsdGlwbGUgb3B0aW9uaXplIGNhbGxzICsgc3ByZWFkIGluIG9uZSBpbml0aWFsaXphdGlvbiBzaXRlIHNvIHRoYXQgVHlwZVNjcmlwdCBoYXMgdGhlIGNvcnJlY3QgdHlwZSBmb3IgbmVzdGVkXHJcbiAgICAvLyBvcHRpb25zIGltbWVkaWF0ZWx5LCBhbmQgd2UgZG9uJ3QgbmVlZCBtdWx0aXBsZSB2YXJpYWJsZXMgdG8gYWNoaWV2ZSBpdC5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSB7XHJcblxyXG4gICAgICAvLyBQdXQgdGhlIHNwcmVhZCBmaXJzdCBzbyB0aGF0IG5lc3RlZCBvcHRpb25zJyBkZWZhdWx0cyB3aWxsIGNvcnJlY3RseSBvdmVycmlkZVxyXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tb2JqZWN0LXNwcmVhZC1vbi1ub24tbGl0ZXJhbHNcclxuICAgICAgLi4uKCBvcHRpb25pemU8UHJlZmVyZW5jZXNNb2RlbE9wdGlvbnMsIEVtcHR5U2VsZk9wdGlvbnMsIFBoZXRpb09iamVjdE9wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgICAgLy8gcGhldC1pb1xyXG4gICAgICAgIHRhbmRlbTogVGFuZGVtLk9QVF9PVVQsIC8vIFVuaW5zdHJ1bWVudGVkIGZvciBub3csIGJ1dCBrZWVwIHRoZSBmaWxlJ3MgaW5zdHJ1bWVudGF0aW9uIGp1c3QgaW4gY2FzZSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy9waGV0LWlvL2lzc3Vlcy8xOTEzXHJcbiAgICAgICAgcGhldGlvVHlwZTogUHJlZmVyZW5jZXNNb2RlbC5QcmVmZXJlbmNlc01vZGVsSU8sXHJcbiAgICAgICAgcGhldGlvRmVhdHVyZWQ6IHRydWUsXHJcbiAgICAgICAgcGhldGlvU3RhdGU6IGZhbHNlLFxyXG4gICAgICAgIHBoZXRpb1JlYWRPbmx5OiB0cnVlXHJcbiAgICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApICksXHJcbiAgICAgIHNpbXVsYXRpb25PcHRpb25zOiBvcHRpb25pemU8U2ltdWxhdGlvblByZWZlcmVuY2VzT3B0aW9ucywgU2ltdWxhdGlvblByZWZlcmVuY2VzT3B0aW9ucywgQmFzZU1vZGVsVHlwZT4oKSgge1xyXG4gICAgICAgIHRhbmRlbU5hbWU6ICdzaW11bGF0aW9uTW9kZWwnLFxyXG4gICAgICAgIGN1c3RvbVByZWZlcmVuY2VzOiBbXVxyXG4gICAgICB9LCBwcm92aWRlZE9wdGlvbnMuc2ltdWxhdGlvbk9wdGlvbnMgKSxcclxuICAgICAgdmlzdWFsT3B0aW9uczogb3B0aW9uaXplPFZpc3VhbFByZWZlcmVuY2VzT3B0aW9ucywgVmlzdWFsUHJlZmVyZW5jZXNPcHRpb25zLCBCYXNlTW9kZWxUeXBlPigpKCB7XHJcbiAgICAgICAgdGFuZGVtTmFtZTogVklTVUFMX01PREVMX1RBTkRFTSxcclxuICAgICAgICBzdXBwb3J0c1Byb2plY3Rvck1vZGU6IGZhbHNlLFxyXG4gICAgICAgIHN1cHBvcnRzSW50ZXJhY3RpdmVIaWdobGlnaHRzOiBwaGV0RmVhdHVyZXNGcm9tUXVlcnlQYXJhbWV0ZXJzLnN1cHBvcnRzSW50ZXJhY3RpdmVIaWdobGlnaHRzLFxyXG4gICAgICAgIGN1c3RvbVByZWZlcmVuY2VzOiBbXVxyXG4gICAgICB9LCBwcm92aWRlZE9wdGlvbnMudmlzdWFsT3B0aW9ucyApLFxyXG4gICAgICBhdWRpb09wdGlvbnM6IG9wdGlvbml6ZTxBdWRpb1ByZWZlcmVuY2VzT3B0aW9ucywgQXVkaW9QcmVmZXJlbmNlc09wdGlvbnMsIEJhc2VNb2RlbFR5cGU+KCkoIHtcclxuICAgICAgICB0YW5kZW1OYW1lOiBBVURJT19NT0RFTF9UQU5ERU0sXHJcbiAgICAgICAgc3VwcG9ydHNWb2ljaW5nOiBwaGV0RmVhdHVyZXNGcm9tUXVlcnlQYXJhbWV0ZXJzLnN1cHBvcnRzVm9pY2luZyxcclxuICAgICAgICBzdXBwb3J0c1NvdW5kOiBwaGV0RmVhdHVyZXNGcm9tUXVlcnlQYXJhbWV0ZXJzLnN1cHBvcnRzU291bmQsXHJcbiAgICAgICAgc3VwcG9ydHNFeHRyYVNvdW5kOiBwaGV0RmVhdHVyZXNGcm9tUXVlcnlQYXJhbWV0ZXJzLnN1cHBvcnRzRXh0cmFTb3VuZCxcclxuICAgICAgICBjdXN0b21QcmVmZXJlbmNlczogW11cclxuICAgICAgfSwgcHJvdmlkZWRPcHRpb25zLmF1ZGlvT3B0aW9ucyApLFxyXG4gICAgICBpbnB1dE9wdGlvbnM6IG9wdGlvbml6ZTxJbnB1dFByZWZlcmVuY2VzT3B0aW9ucywgSW5wdXRQcmVmZXJlbmNlc09wdGlvbnMsIEJhc2VNb2RlbFR5cGU+KCkoIHtcclxuICAgICAgICB0YW5kZW1OYW1lOiBJTlBVVF9NT0RFTF9UQU5ERU0sXHJcbiAgICAgICAgc3VwcG9ydHNHZXN0dXJlQ29udHJvbDogcGhldEZlYXR1cmVzRnJvbVF1ZXJ5UGFyYW1ldGVycy5zdXBwb3J0c0dlc3R1cmVDb250cm9sLFxyXG4gICAgICAgIGN1c3RvbVByZWZlcmVuY2VzOiBbXVxyXG4gICAgICB9LCBwcm92aWRlZE9wdGlvbnMuaW5wdXRPcHRpb25zICksXHJcbiAgICAgIGxvY2FsaXphdGlvbk9wdGlvbnM6IG9wdGlvbml6ZTxMb2NhbGl6YXRpb25QcmVmZXJlbmNlc09wdGlvbnMsIExvY2FsaXphdGlvblByZWZlcmVuY2VzT3B0aW9ucywgQmFzZU1vZGVsVHlwZT4oKSgge1xyXG4gICAgICAgIHRhbmRlbU5hbWU6ICdsb2NhbGl6YXRpb25Nb2RlbCcsXHJcbiAgICAgICAgc3VwcG9ydHNEeW5hbWljTG9jYWxlOiAhIWxvY2FsZVByb3BlcnR5LnZhbGlkVmFsdWVzICYmIGxvY2FsZVByb3BlcnR5LnZhbGlkVmFsdWVzLmxlbmd0aCA+IDEgJiYgcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5zdXBwb3J0c0R5bmFtaWNMb2NhbGUsXHJcbiAgICAgICAgY3VzdG9tUHJlZmVyZW5jZXM6IFtdLFxyXG4gICAgICAgIGluY2x1ZGVMb2NhbGVQYW5lbDogdHJ1ZVxyXG4gICAgICB9LCBwcm92aWRlZE9wdGlvbnMubG9jYWxpemF0aW9uT3B0aW9ucyApXHJcbiAgICB9O1xyXG5cclxuICAgIHN1cGVyKCBvcHRpb25zICk7XHJcblxyXG4gICAgdGhpcy5zaW11bGF0aW9uTW9kZWwgPSBvcHRpb25zLnNpbXVsYXRpb25PcHRpb25zO1xyXG5cclxuICAgIGNvbnN0IHZpc3VhbFRhbmRlbSA9IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggVklTVUFMX01PREVMX1RBTkRFTSApO1xyXG4gICAgdGhpcy52aXN1YWxNb2RlbCA9IG1lcmdlKCB7XHJcbiAgICAgIGludGVyYWN0aXZlSGlnaGxpZ2h0c0VuYWJsZWRQcm9wZXJ0eTogbmV3IEJvb2xlYW5Qcm9wZXJ0eSggcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5pbnRlcmFjdGl2ZUhpZ2hsaWdodHNJbml0aWFsbHlFbmFibGVkLCB7XHJcbiAgICAgICAgdGFuZGVtOiB2aXN1YWxUYW5kZW0uY3JlYXRlVGFuZGVtKCAnaW50ZXJhY3RpdmVIaWdobGlnaHRzRW5hYmxlZFByb3BlcnR5JyApLFxyXG4gICAgICAgIHBoZXRpb1N0YXRlOiBmYWxzZVxyXG4gICAgICB9ICksXHJcbiAgICAgIGNvbG9yUHJvZmlsZVByb3BlcnR5OiBjb2xvclByb2ZpbGVQcm9wZXJ0eVxyXG4gICAgfSwgb3B0aW9ucy52aXN1YWxPcHRpb25zICk7XHJcblxyXG4gICAgLy8gRm9yIG5vdywgdGhlIFZvaWNpbmcgZmVhdHVyZSBpcyBvbmx5IGF2YWlsYWJsZSB3aGVuIHdlIGFyZSBydW5uaW5nIGluIHRoZSBFbmdsaXNoIGxvY2FsZSwgYWNjZXNzaWJpbGl0eVxyXG4gICAgLy8gc3RyaW5ncyBhcmUgbm90IG1hZGUgYXZhaWxhYmxlIGZvciB0cmFuc2xhdGlvbi4gV2hlbiBydW5uaW5nIHdpdGggZHluYW1pYyBsb2NhbGVzLCB0aGUgdm9pY2luZyBmZWF0dXJlXHJcbiAgICAvLyBpcyBzdXBwb3J0ZWQgaWYgRW5nbGlzaCBpcyBhdmFpbGFibGUsIGJ1dCB3aWxsIGJlIGRpc2FibGVkIHVudGlsIEVuZ2xpc2ggaXMgc2VsZWN0ZWQuXHJcbiAgICBjb25zdCBzdXBwb3J0c1ZvaWNpbmcgPSBvcHRpb25zLmF1ZGlvT3B0aW9ucy5zdXBwb3J0c1ZvaWNpbmcgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNwZWVjaFN5bnRoZXNpc0Fubm91bmNlci5pc1NwZWVjaFN5bnRoZXNpc1N1cHBvcnRlZCgpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJ1bm5pbmcgd2l0aCBlbmdsaXNoIGxvY2FsZSBPUiBhbiBlbnZpcm9ubWVudCB3aGVyZSBsb2NhbGUgc3dpdGNoaW5nIGlzIHN1cHBvcnRlZCBhbmRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZW5nbGlzaCBpcyBvbmUgb2YgdGhlIGF2YWlsYWJsZSBsYW5ndWFnZXMuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBoZXQuY2hpcHBlci5sb2NhbGUuc3RhcnRzV2l0aCggJ2VuJyApIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICggcGhldC5jaGlwcGVyLnF1ZXJ5UGFyYW1ldGVycy5zdXBwb3J0c0R5bmFtaWNMb2NhbGUgJiYgXy5zb21lKCBsb2NhbGVQcm9wZXJ0eS52YWxpZFZhbHVlcywgdmFsdWUgPT4gdmFsdWUuc3RhcnRzV2l0aCggJ2VuJyApICkgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAvLyBBdWRpbyBjYW4gYmUgZGlzYWJsZWQgZXhwbGljaXRseSB2aWEgcXVlcnkgcGFyYW1ldGVyXHJcbiAgICBjb25zdCBhdWRpb0VuYWJsZWQgPSBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLmF1ZGlvICE9PSAnZGlzYWJsZWQnO1xyXG5cclxuICAgIHRoaXMuYXVkaW9Nb2RlbCA9IHtcclxuICAgICAgc3VwcG9ydHNWb2ljaW5nOiBzdXBwb3J0c1ZvaWNpbmcgJiYgYXVkaW9FbmFibGVkLFxyXG5cclxuICAgICAgc3VwcG9ydHNTb3VuZDogb3B0aW9ucy5hdWRpb09wdGlvbnMuc3VwcG9ydHNTb3VuZCAmJiBhdWRpb0VuYWJsZWQsXHJcbiAgICAgIHN1cHBvcnRzRXh0cmFTb3VuZDogb3B0aW9ucy5hdWRpb09wdGlvbnMuc3VwcG9ydHNFeHRyYVNvdW5kICYmIGF1ZGlvRW5hYmxlZCxcclxuXHJcbiAgICAgIGF1ZGlvRW5hYmxlZFByb3BlcnR5OiBhdWRpb01hbmFnZXIuYXVkaW9FbmFibGVkUHJvcGVydHksXHJcbiAgICAgIHNvdW5kRW5hYmxlZFByb3BlcnR5OiBzb3VuZE1hbmFnZXIuZW5hYmxlZFByb3BlcnR5LFxyXG4gICAgICBleHRyYVNvdW5kRW5hYmxlZFByb3BlcnR5OiBzb3VuZE1hbmFnZXIuZXh0cmFTb3VuZEVuYWJsZWRQcm9wZXJ0eSxcclxuXHJcbiAgICAgIHZvaWNpbmdFbmFibGVkUHJvcGVydHk6IHZvaWNpbmdNYW5hZ2VyLmVuYWJsZWRQcm9wZXJ0eSBhcyBQcm9wZXJ0eTxib29sZWFuPixcclxuICAgICAgdm9pY2luZ01haW5XaW5kb3dWb2ljaW5nRW5hYmxlZFByb3BlcnR5OiB2b2ljaW5nTWFuYWdlci5tYWluV2luZG93Vm9pY2luZ0VuYWJsZWRQcm9wZXJ0eSxcclxuICAgICAgdm9pY2luZ09iamVjdFJlc3BvbnNlc0VuYWJsZWRQcm9wZXJ0eTogcmVzcG9uc2VDb2xsZWN0b3Iub2JqZWN0UmVzcG9uc2VzRW5hYmxlZFByb3BlcnR5LFxyXG4gICAgICB2b2ljaW5nQ29udGV4dFJlc3BvbnNlc0VuYWJsZWRQcm9wZXJ0eTogcmVzcG9uc2VDb2xsZWN0b3IuY29udGV4dFJlc3BvbnNlc0VuYWJsZWRQcm9wZXJ0eSxcclxuICAgICAgdm9pY2luZ0hpbnRSZXNwb25zZXNFbmFibGVkUHJvcGVydHk6IHJlc3BvbnNlQ29sbGVjdG9yLmhpbnRSZXNwb25zZXNFbmFibGVkUHJvcGVydHksXHJcbiAgICAgIHZvaWNlUGl0Y2hQcm9wZXJ0eTogdm9pY2luZ01hbmFnZXIudm9pY2VQaXRjaFByb3BlcnR5LFxyXG4gICAgICB2b2ljZVJhdGVQcm9wZXJ0eTogdm9pY2luZ01hbmFnZXIudm9pY2VSYXRlUHJvcGVydHksXHJcbiAgICAgIHZvaWNlUHJvcGVydHk6IHZvaWNpbmdNYW5hZ2VyLnZvaWNlUHJvcGVydHksXHJcblxyXG4gICAgICB0b29sYmFyRW5hYmxlZFByb3BlcnR5OiBuZXcgQm9vbGVhblByb3BlcnR5KCB0cnVlLCB7XHJcbiAgICAgICAgdGFuZGVtOiBvcHRpb25zLnRhbmRlbS5jcmVhdGVUYW5kZW0oIEFVRElPX01PREVMX1RBTkRFTSApLmNyZWF0ZVRhbmRlbSggJ3Rvb2xiYXJFbmFibGVkUHJvcGVydHknICksXHJcbiAgICAgICAgcGhldGlvU3RhdGU6IGZhbHNlXHJcbiAgICAgIH0gKSxcclxuXHJcbiAgICAgIGN1c3RvbVByZWZlcmVuY2VzOiBvcHRpb25zLmF1ZGlvT3B0aW9ucy5jdXN0b21QcmVmZXJlbmNlcyxcclxuICAgICAgdGFuZGVtTmFtZTogb3B0aW9ucy5hdWRpb09wdGlvbnMudGFuZGVtTmFtZVxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBpbnB1dFRhbmRlbSA9IG9wdGlvbnMudGFuZGVtLmNyZWF0ZVRhbmRlbSggSU5QVVRfTU9ERUxfVEFOREVNICk7XHJcbiAgICB0aGlzLmlucHV0TW9kZWwgPSBtZXJnZSgge1xyXG4gICAgICBnZXN0dXJlQ29udHJvbHNFbmFibGVkUHJvcGVydHk6IG5ldyBCb29sZWFuUHJvcGVydHkoIGZhbHNlLCB7XHJcbiAgICAgICAgdGFuZGVtOiBpbnB1dFRhbmRlbS5jcmVhdGVUYW5kZW0oICdnZXN0dXJlQ29udHJvbHNFbmFibGVkUHJvcGVydHknICksXHJcbiAgICAgICAgcGhldGlvU3RhdGU6IGZhbHNlXHJcbiAgICAgIH0gKVxyXG4gICAgfSwgb3B0aW9ucy5pbnB1dE9wdGlvbnMgKTtcclxuXHJcbiAgICB0aGlzLmxvY2FsaXphdGlvbk1vZGVsID0gbWVyZ2UoIHtcclxuICAgICAgbG9jYWxlUHJvcGVydHk6IGxvY2FsZVByb3BlcnR5XHJcbiAgICB9LCBvcHRpb25zLmxvY2FsaXphdGlvbk9wdGlvbnMgKTtcclxuXHJcbiAgICBpZiAoIHRoaXMuYXVkaW9Nb2RlbC5zdXBwb3J0c0V4dHJhU291bmQgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoIHRoaXMuYXVkaW9Nb2RlbC5zdXBwb3J0c1NvdW5kLCAnc3VwcG9ydHNTb3VuZCBtdXN0IGJlIHRydWUgdG8gYWxzbyBzdXBwb3J0IGV4dHJhU291bmQnICk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5hZGRQaGV0aW9MaW5rZWRFbGVtZW50c0Zvck1vZGVsKCBvcHRpb25zLnRhbmRlbSwgdGhpcy5zaW11bGF0aW9uTW9kZWwgKTtcclxuXHJcbiAgICB0aGlzLmFkZFBoZXRpb0xpbmtlZEVsZW1lbnRzRm9yTW9kZWwoIG9wdGlvbnMudGFuZGVtLCB0aGlzLnZpc3VhbE1vZGVsLCBbXHJcbiAgICAgIHsgcHJvcGVydHk6IHRoaXMudmlzdWFsTW9kZWwuY29sb3JQcm9maWxlUHJvcGVydHkgfVxyXG4gICAgXSApO1xyXG5cclxuICAgIHRoaXMuYWRkUGhldGlvTGlua2VkRWxlbWVudHNGb3JNb2RlbCggb3B0aW9ucy50YW5kZW0sIHRoaXMuYXVkaW9Nb2RlbCwgW1xyXG4gICAgICB7IHByb3BlcnR5OiB0aGlzLmF1ZGlvTW9kZWwuYXVkaW9FbmFibGVkUHJvcGVydHksIHRhbmRlbU5hbWU6ICdhdWRpb0VuYWJsZWRQcm9wZXJ0eScgfSxcclxuICAgICAgeyBwcm9wZXJ0eTogdGhpcy5hdWRpb01vZGVsLnNvdW5kRW5hYmxlZFByb3BlcnR5LCB0YW5kZW1OYW1lOiAnc291bmRFbmFibGVkUHJvcGVydHknIH0sXHJcbiAgICAgIHsgcHJvcGVydHk6IHRoaXMuYXVkaW9Nb2RlbC5leHRyYVNvdW5kRW5hYmxlZFByb3BlcnR5LCB0YW5kZW1OYW1lOiAnZXh0cmFTb3VuZEVuYWJsZWRQcm9wZXJ0eScgfSxcclxuICAgICAgeyBwcm9wZXJ0eTogdGhpcy5hdWRpb01vZGVsLnZvaWNpbmdFbmFibGVkUHJvcGVydHksIHRhbmRlbU5hbWU6ICd2b2ljaW5nRW5hYmxlZFByb3BlcnR5JyB9LFxyXG4gICAgICB7IHByb3BlcnR5OiB0aGlzLmF1ZGlvTW9kZWwudm9pY2luZ01haW5XaW5kb3dWb2ljaW5nRW5hYmxlZFByb3BlcnR5LCB0YW5kZW1OYW1lOiAndm9pY2luZ01haW5XaW5kb3dWb2ljaW5nRW5hYmxlZFByb3BlcnR5JyB9LFxyXG4gICAgICB7IHByb3BlcnR5OiB0aGlzLmF1ZGlvTW9kZWwudm9pY2luZ09iamVjdFJlc3BvbnNlc0VuYWJsZWRQcm9wZXJ0eSwgdGFuZGVtTmFtZTogJ3ZvaWNpbmdPYmplY3RSZXNwb25zZXNFbmFibGVkUHJvcGVydHknIH0sXHJcbiAgICAgIHsgcHJvcGVydHk6IHRoaXMuYXVkaW9Nb2RlbC52b2ljaW5nQ29udGV4dFJlc3BvbnNlc0VuYWJsZWRQcm9wZXJ0eSwgdGFuZGVtTmFtZTogJ3ZvaWNpbmdDb250ZXh0UmVzcG9uc2VzRW5hYmxlZFByb3BlcnR5JyB9LFxyXG4gICAgICB7IHByb3BlcnR5OiB0aGlzLmF1ZGlvTW9kZWwudm9pY2luZ0hpbnRSZXNwb25zZXNFbmFibGVkUHJvcGVydHksIHRhbmRlbU5hbWU6ICd2b2ljaW5nSGludFJlc3BvbnNlc0VuYWJsZWRQcm9wZXJ0eScgfSxcclxuICAgICAgeyBwcm9wZXJ0eTogdGhpcy5hdWRpb01vZGVsLnZvaWNlUGl0Y2hQcm9wZXJ0eSwgdGFuZGVtTmFtZTogJ3ZvaWNlUGl0Y2hQcm9wZXJ0eScgfSxcclxuICAgICAgeyBwcm9wZXJ0eTogdGhpcy5hdWRpb01vZGVsLnZvaWNlUmF0ZVByb3BlcnR5LCB0YW5kZW1OYW1lOiAndm9pY2VSYXRlUHJvcGVydHknIH1cclxuICAgIF0gKTtcclxuICAgIHRoaXMuYWRkUGhldGlvTGlua2VkRWxlbWVudHNGb3JNb2RlbCggb3B0aW9ucy50YW5kZW0sIHRoaXMuaW5wdXRNb2RlbCApO1xyXG4gICAgdGhpcy5hZGRQaGV0aW9MaW5rZWRFbGVtZW50c0Zvck1vZGVsKCBvcHRpb25zLnRhbmRlbSwgdGhpcy5sb2NhbGl6YXRpb25Nb2RlbCwgW1xyXG4gICAgICB7IHByb3BlcnR5OiB0aGlzLmxvY2FsaXphdGlvbk1vZGVsLmxvY2FsZVByb3BlcnR5LCB0YW5kZW1OYW1lOiAnbG9jYWxlUHJvcGVydHknIH1cclxuICAgIF0gKTtcclxuXHJcbiAgICAvLyBTaW5jZSB2b2ljaW5nTWFuYWdlciBpbiBTY2VuZXJ5IGNhbiBub3QgdXNlIGluaXRpYWxpemUtZ2xvYmFscywgc2V0IHRoZSBpbml0aWFsIHZhbHVlIGZvciB3aGV0aGVyIFZvaWNpbmcgaXNcclxuICAgIC8vIGVuYWJsZWQgaGVyZSBpbiB0aGUgUHJlZmVyZW5jZXNNb2RlbC5cclxuICAgIGlmICggc3VwcG9ydHNWb2ljaW5nICkge1xyXG4gICAgICB2b2ljaW5nTWFuYWdlci5lbmFibGVkUHJvcGVydHkudmFsdWUgPSBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLnZvaWNpbmdJbml0aWFsbHlFbmFibGVkO1xyXG5cclxuICAgICAgLy8gVm9pY2luZyBpcyBvbmx5IGF2YWlsYWJsZSBpbiB0aGUgJ2VuJyBsb2NhbGUgY3VycmVudGx5LiBJZiB0aGUgbG9jYWxlIGlzIGNoYW5nZWQgYXdheSBmcm9tIEVuZ2xpc2gsIFZvaWNpbmcgaXNcclxuICAgICAgLy8gZGlzYWJsZWQuIFRoZSBuZXh0IHRpbWUgVm9pY2luZyByZXR1cm5zIHRvICdlbicsIFZvaWNpbmcgd2lsbCBiZSBlbmFibGVkIGFnYWluLlxyXG4gICAgICBsZXQgdm9pY2luZ0Rpc2FibGVkRnJvbUxvY2FsZSA9IGZhbHNlO1xyXG4gICAgICBsb2NhbGVQcm9wZXJ0eS5saW5rKCBsb2NhbGUgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBlbmdsaXNoTG9jYWxlID0gdm9pY2luZ01hbmFnZXIudm9pY2luZ1N1cHBvcnRlZEZvckxvY2FsZSggbG9jYWxlICk7XHJcbiAgICAgICAgaWYgKCB2b2ljaW5nTWFuYWdlci5lbmFibGVkUHJvcGVydHkudmFsdWUgKSB7XHJcbiAgICAgICAgICB2b2ljaW5nTWFuYWdlci5lbmFibGVkUHJvcGVydHkudmFsdWUgPSBlbmdsaXNoTG9jYWxlO1xyXG4gICAgICAgICAgdm9pY2luZ0Rpc2FibGVkRnJvbUxvY2FsZSA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCB2b2ljaW5nRGlzYWJsZWRGcm9tTG9jYWxlICYmIGVuZ2xpc2hMb2NhbGUgKSB7XHJcbiAgICAgICAgICB2b2ljaW5nTWFuYWdlci5lbmFibGVkUHJvcGVydHkudmFsdWUgPSB0cnVlO1xyXG4gICAgICAgICAgdm9pY2luZ0Rpc2FibGVkRnJvbUxvY2FsZSA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgfSApO1xyXG5cclxuICAgICAgLy8gVGhlIGRlZmF1bHQgdXR0ZXJhbmNlUXVldWUgd2lsbCBiZSB1c2VkIGZvciB2b2ljaW5nIG9mIHNpbXVsYXRpb24gY29tcG9uZW50cywgYW5kIGl0IGlzIGVuYWJsZWQgd2hlbiB0aGVcclxuICAgICAgLy8gdm9pY2luZ01hbmFnZXIgaXMgZnVsbHkgZW5hYmxlZCAodm9pY2luZ01hbmFnZXIgaXMgZW5hYmxlZCBhbmQgdGhlIHZvaWNpbmcgaXMgZW5hYmxlZCBmb3IgdGhlIFwibWFpbiB3aW5kb3dcIlxyXG4gICAgICAvLyBzaW0gc2NyZWVucylcclxuICAgICAgdm9pY2luZ01hbmFnZXIuZW5hYmxlZFByb3BlcnR5LmxpbmsoIGVuYWJsZWQgPT4ge1xyXG4gICAgICAgIHZvaWNpbmdVdHRlcmFuY2VRdWV1ZS5lbmFibGVkID0gZW5hYmxlZDtcclxuICAgICAgICAhZW5hYmxlZCAmJiB2b2ljaW5nVXR0ZXJhbmNlUXVldWUuY2xlYXIoKTtcclxuICAgICAgfSApO1xyXG5cclxuICAgICAgLy8gSWYgaW5pdGlhbGx5IGVuYWJsZWQsIHRoZW4gYXBwbHkgYWxsIHJlc3BvbnNlcyBvbiBzdGFydHVwLCBjYW4gKGFuZCBzaG91bGQpIGJlIG92ZXJ3cml0dGVuIGJ5IFByZWZlcmVuY2VzU3RvcmFnZS5cclxuICAgICAgaWYgKCBwaGV0LmNoaXBwZXIucXVlcnlQYXJhbWV0ZXJzLnZvaWNpbmdJbml0aWFsbHlFbmFibGVkICkge1xyXG4gICAgICAgIHJlc3BvbnNlQ29sbGVjdG9yLm9iamVjdFJlc3BvbnNlc0VuYWJsZWRQcm9wZXJ0eS52YWx1ZSA9IHRydWU7XHJcbiAgICAgICAgcmVzcG9uc2VDb2xsZWN0b3IuY29udGV4dFJlc3BvbnNlc0VuYWJsZWRQcm9wZXJ0eS52YWx1ZSA9IHRydWU7XHJcbiAgICAgICAgcmVzcG9uc2VDb2xsZWN0b3IuaGludFJlc3BvbnNlc0VuYWJsZWRQcm9wZXJ0eS52YWx1ZSA9IHRydWU7XHJcblxyXG4gICAgICAgIC8vIFNldCB0aGUgZmlyc3Qgdm9pY2UgYWNjb3JkaW5nIHRvIFBoRVQncyBwcmVmZXJyZWQgZW5nbGlzaCB2b2ljZXNcclxuICAgICAgICBjb25zdCB2b2ljZXNNdWx0aWxpbmsgPSBNdWx0aWxpbmsubXVsdGlsaW5rKFxyXG4gICAgICAgICAgWyB2b2ljaW5nTWFuYWdlci52b2ljZXNQcm9wZXJ0eSwgdm9pY2luZ01hbmFnZXIuaXNJbml0aWFsaXplZFByb3BlcnR5IF0sXHJcbiAgICAgICAgICAoIHZvaWNlcywgaW5pdGlhbGl6ZWQgKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICggaW5pdGlhbGl6ZWQgJiYgdm9pY2VzLmxlbmd0aCA+IDAgKSB7XHJcbiAgICAgICAgICAgICAgdm9pY2luZ01hbmFnZXIudm9pY2VQcm9wZXJ0eS52YWx1ZSA9IHZvaWNpbmdNYW5hZ2VyLmdldEVuZ2xpc2hQcmlvcml0aXplZFZvaWNlcygpWyAwIF07XHJcbiAgICAgICAgICAgICAgTXVsdGlsaW5rLnVubXVsdGlsaW5rKCB2b2ljZXNNdWx0aWxpbmsgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIHBoZXQuY2hpcHBlci5xdWVyeVBhcmFtZXRlcnMucHJpbnRWb2ljaW5nUmVzcG9uc2VzICkge1xyXG4gICAgICB2b2ljaW5nTWFuYWdlci5zdGFydFNwZWFraW5nRW1pdHRlci5hZGRMaXN0ZW5lciggdGV4dCA9PiBjb25zb2xlLmxvZyggdGV4dCApICk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5yZWdpc3RlclByZWZlcmVuY2VzU3RvcmFnZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHVwIHByZWZlcmVuY2VzU3RvcmFnZSBmb3Igc3VwcG9ydGVkIFByZWZlcmVuY2VzUHJvcGVydGllcy4gRG9uJ3QgaW5jbHVkZSBhbGwtc291bmQgYW5kIGFsbC1hdWRpbyBjb250cm9sc1xyXG4gICAqIGJlY2F1c2UgdGhhdCBmZWVsIHRvbyBnbG9iYWwgdG8gYXV0b21hdGljYWxseSB0YWtlIHRoZSBsYXN0IHZhbHVlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgcmVnaXN0ZXJQcmVmZXJlbmNlc1N0b3JhZ2UoKTogdm9pZCB7XHJcblxyXG4gICAgaWYgKCB0aGlzLnZpc3VhbE1vZGVsLnN1cHBvcnRzSW50ZXJhY3RpdmVIaWdobGlnaHRzICkge1xyXG4gICAgICBQcmVmZXJlbmNlc1N0b3JhZ2UucmVnaXN0ZXIoIHRoaXMudmlzdWFsTW9kZWwuaW50ZXJhY3RpdmVIaWdobGlnaHRzRW5hYmxlZFByb3BlcnR5LCAnaW50ZXJhY3RpdmVIaWdobGlnaHRzRW5hYmxlZFByb3BlcnR5JyApO1xyXG4gICAgfVxyXG4gICAgaWYgKCB0aGlzLmF1ZGlvTW9kZWwuc3VwcG9ydHNWb2ljaW5nICkge1xyXG5cclxuICAgICAgLy8gUmVnaXN0ZXIgdGhlc2UgdG8gYmUgc3RvcmVkIHdoZW4gUHJlZmVyZW5jZXNTdG9yYWdlIGlzIGVuYWJsZWQuXHJcbiAgICAgIFByZWZlcmVuY2VzU3RvcmFnZS5yZWdpc3RlciggdGhpcy5hdWRpb01vZGVsLnZvaWNpbmdPYmplY3RSZXNwb25zZXNFbmFibGVkUHJvcGVydHksICdvYmplY3RSZXNwb25zZXNFbmFibGVkUHJvcGVydHknICk7XHJcbiAgICAgIFByZWZlcmVuY2VzU3RvcmFnZS5yZWdpc3RlciggdGhpcy5hdWRpb01vZGVsLnZvaWNpbmdDb250ZXh0UmVzcG9uc2VzRW5hYmxlZFByb3BlcnR5LCAnY29udGV4dFJlc3BvbnNlc0VuYWJsZWRQcm9wZXJ0eScgKTtcclxuICAgICAgUHJlZmVyZW5jZXNTdG9yYWdlLnJlZ2lzdGVyKCB0aGlzLmF1ZGlvTW9kZWwudm9pY2luZ0hpbnRSZXNwb25zZXNFbmFibGVkUHJvcGVydHksICdoaW50UmVzcG9uc2VzRW5hYmxlZFByb3BlcnR5JyApO1xyXG4gICAgICBQcmVmZXJlbmNlc1N0b3JhZ2UucmVnaXN0ZXIoIHRoaXMuYXVkaW9Nb2RlbC52b2ljZVJhdGVQcm9wZXJ0eSwgJ3ZvaWNlUmF0ZVByb3BlcnR5JyApO1xyXG4gICAgICBQcmVmZXJlbmNlc1N0b3JhZ2UucmVnaXN0ZXIoIHRoaXMuYXVkaW9Nb2RlbC52b2ljZVBpdGNoUHJvcGVydHksICd2b2ljZVBpdGNoUHJvcGVydHknICk7XHJcbiAgICB9XHJcbiAgICBpZiAoIHRoaXMuYXVkaW9Nb2RlbC5zdXBwb3J0c0V4dHJhU291bmQgKSB7XHJcbiAgICAgIFByZWZlcmVuY2VzU3RvcmFnZS5yZWdpc3RlciggdGhpcy5hdWRpb01vZGVsLmV4dHJhU291bmRFbmFibGVkUHJvcGVydHksICdleHRyYVNvdW5kRW5hYmxlZFByb3BlcnR5JyApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICggdGhpcy5pbnB1dE1vZGVsLnN1cHBvcnRzR2VzdHVyZUNvbnRyb2wgKSB7XHJcbiAgICAgIFByZWZlcmVuY2VzU3RvcmFnZS5yZWdpc3RlciggdGhpcy5pbnB1dE1vZGVsLmdlc3R1cmVDb250cm9sc0VuYWJsZWRQcm9wZXJ0eSwgJ2dlc3R1cmVDb250cm9sc0VuYWJsZWRQcm9wZXJ0eScgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgYWRkUGhldGlvTGlua2VkRWxlbWVudHNGb3JNb2RlbCggcGFyZW50VGFuZGVtOiBUYW5kZW0sIGZlYXR1cmVNb2RlbDogRmVhdHVyZU1vZGVsLCBhZGRpdGlvbmFsUHJvcGVydGllczogQXJyYXk8TW9kZWxQcm9wZXJ0eUxpbmthYmxlPiA9IFtdICk6IHZvaWQge1xyXG4gICAgY29uc3QgdGFuZGVtID0gcGFyZW50VGFuZGVtLmNyZWF0ZVRhbmRlbSggZmVhdHVyZU1vZGVsLnRhbmRlbU5hbWUgKTtcclxuICAgIGNvbnN0IHByb3BlcnRpZXNUb0xpbmsgPSBhZGRpdGlvbmFsUHJvcGVydGllcztcclxuXHJcbiAgICBmb3IgKCBsZXQgaiA9IDA7IGogPCBwcm9wZXJ0aWVzVG9MaW5rLmxlbmd0aDsgaisrICkge1xyXG4gICAgICBjb25zdCBtb2RlbFByb3BlcnR5T2JqZWN0ID0gcHJvcGVydGllc1RvTGlua1sgaiBdO1xyXG4gICAgICBjb25zdCB0YW5kZW1OYW1lID0gbW9kZWxQcm9wZXJ0eU9iamVjdC50YW5kZW1OYW1lIHx8IG1vZGVsUHJvcGVydHlPYmplY3QucHJvcGVydHkudGFuZGVtLm5hbWU7XHJcbiAgICAgIHRoaXMuYWRkTGlua2VkRWxlbWVudCggbW9kZWxQcm9wZXJ0eU9iamVjdC5wcm9wZXJ0eSwgeyB0YW5kZW06IHRhbmRlbS5jcmVhdGVUYW5kZW0oIHRhbmRlbU5hbWUgKSB9ICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcHJlZmVyZW5jZU1vZGVsSGFzQ3VzdG9tKCBwcmVmZXJlbmNlTW9kZWw6IFJlcXVpcmVkPEN1c3RvbVByZWZlcmVuY2VzT3B0aW9ucz4gKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gcHJlZmVyZW5jZU1vZGVsLmN1c3RvbVByZWZlcmVuY2VzLmxlbmd0aCA+IDA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIFNpbXVsYXRpb25Nb2RlbCBzdXBwb3J0cyBhbnkgcHJlZmVyZW5jZXMgdGhhdCBjYW4gYmUgY2hhbmdlZC5cclxuICAgKi9cclxuICBwdWJsaWMgc3VwcG9ydHNTaW11bGF0aW9uUHJlZmVyZW5jZXMoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5wcmVmZXJlbmNlTW9kZWxIYXNDdXN0b20oIHRoaXMuc2ltdWxhdGlvbk1vZGVsICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIFZpc3VhbE1vZGVsIGhhcyBhbnkgcHJlZmVyZW5jZXMgdGhhdCBjYW4gYmUgY2hhbmdlZC5cclxuICAgKi9cclxuICBwdWJsaWMgc3VwcG9ydHNWaXN1YWxQcmVmZXJlbmNlcygpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLnZpc3VhbE1vZGVsLnN1cHBvcnRzSW50ZXJhY3RpdmVIaWdobGlnaHRzIHx8XHJcbiAgICAgICAgICAgdGhpcy52aXN1YWxNb2RlbC5zdXBwb3J0c1Byb2plY3Rvck1vZGUgfHxcclxuICAgICAgICAgICB0aGlzLnByZWZlcmVuY2VNb2RlbEhhc0N1c3RvbSggdGhpcy52aXN1YWxNb2RlbCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBBdWRpb01vZGVsIGhhcyBhbnkgcHJlZmVyZW5jZXMgdGhhdCBjYW4gYmUgY2hhbmdlZC5cclxuICAgKi9cclxuICBwdWJsaWMgc3VwcG9ydHNBdWRpb1ByZWZlcmVuY2VzKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuYXVkaW9Nb2RlbC5zdXBwb3J0c1NvdW5kIHx8XHJcbiAgICAgICAgICAgdGhpcy5hdWRpb01vZGVsLnN1cHBvcnRzRXh0cmFTb3VuZCB8fFxyXG4gICAgICAgICAgIHRoaXMuYXVkaW9Nb2RlbC5zdXBwb3J0c1ZvaWNpbmcgfHxcclxuICAgICAgICAgICB0aGlzLnByZWZlcmVuY2VNb2RlbEhhc0N1c3RvbSggdGhpcy5hdWRpb01vZGVsICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIElucHV0TW9kZWwgaGFzIGFueSBwcmVmZXJlbmNlcyB0aGF0IGNhbiBiZSBjaGFuZ2VkLlxyXG4gICAqL1xyXG4gIHB1YmxpYyBzdXBwb3J0c0lucHV0UHJlZmVyZW5jZXMoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5pbnB1dE1vZGVsLnN1cHBvcnRzR2VzdHVyZUNvbnRyb2wgfHwgdGhpcy5wcmVmZXJlbmNlTW9kZWxIYXNDdXN0b20oIHRoaXMuaW5wdXRNb2RlbCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBMb2NhbGl6YXRpb25Nb2RlbCBoYXMgYW55IHByZWZlcmVuY2VzIHRoYXQgY2FuIGJlIGNoYW5nZWQuXHJcbiAgICovXHJcbiAgcHVibGljIHN1cHBvcnRzTG9jYWxpemF0aW9uUHJlZmVyZW5jZXMoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5sb2NhbGl6YXRpb25Nb2RlbC5zdXBwb3J0c0R5bmFtaWNMb2NhbGUgfHxcclxuICAgICAgICAgICBzdXBwb3J0ZWRSZWdpb25BbmRDdWx0dXJlVmFsdWVzLmxlbmd0aCA+IDEgfHxcclxuICAgICAgICAgICB0aGlzLnByZWZlcmVuY2VNb2RlbEhhc0N1c3RvbSggdGhpcy5sb2NhbGl6YXRpb25Nb2RlbCApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0cnVlIGlmIHRoaXMgbW9kZWwgc3VwcG9ydHMgYW55IGNvbnRyb2xsYWJsZSBwcmVmZXJlbmNlcyBmb3IgdGhlIGRpYWxvZy4gUmV0dXJucyBmYWxzZSB3aGVuIHRoZSBkaWFsb2dcclxuICAgKiB3b3VsZCBoYXZlIG5vdGhpbmcgdG8gZGlzcGxheS5cclxuICAgKi9cclxuICBwdWJsaWMgc2hvdWxkU2hvd0RpYWxvZygpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLnN1cHBvcnRzU2ltdWxhdGlvblByZWZlcmVuY2VzKCkgfHwgdGhpcy5zdXBwb3J0c1Zpc3VhbFByZWZlcmVuY2VzKCkgfHxcclxuICAgICAgICAgICB0aGlzLnN1cHBvcnRzSW5wdXRQcmVmZXJlbmNlcygpIHx8IHRoaXMuc3VwcG9ydHNMb2NhbGl6YXRpb25QcmVmZXJlbmNlcygpIHx8XHJcbiAgICAgICAgICAgdGhpcy5zdXBwb3J0c0F1ZGlvUHJlZmVyZW5jZXMoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgUHJlZmVyZW5jZXNNb2RlbElPID0gbmV3IElPVHlwZSggJ1ByZWZlcmVuY2VzTW9kZWxJTycsIHtcclxuICAgIHZhbHVlVHlwZTogUHJlZmVyZW5jZXNNb2RlbCxcclxuXHJcbiAgICB0b1N0YXRlT2JqZWN0OiAoIHByZWZlcmVuY2VzTW9kZWw6IFByZWZlcmVuY2VzTW9kZWwgKSA9PiB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc3VwcG9ydHNQcm9qZWN0b3JNb2RlOiBwcmVmZXJlbmNlc01vZGVsLnZpc3VhbE1vZGVsLnN1cHBvcnRzUHJvamVjdG9yTW9kZSxcclxuICAgICAgICBzdXBwb3J0c0ludGVyYWN0aXZlSGlnaGxpZ2h0czogcHJlZmVyZW5jZXNNb2RlbC52aXN1YWxNb2RlbC5zdXBwb3J0c0ludGVyYWN0aXZlSGlnaGxpZ2h0cyxcclxuICAgICAgICBzdXBwb3J0c1ZvaWNpbmc6IHByZWZlcmVuY2VzTW9kZWwuYXVkaW9Nb2RlbC5zdXBwb3J0c1ZvaWNpbmcsXHJcbiAgICAgICAgc3VwcG9ydHNTb3VuZDogcHJlZmVyZW5jZXNNb2RlbC5hdWRpb01vZGVsLnN1cHBvcnRzU291bmQsXHJcbiAgICAgICAgc3VwcG9ydHNFeHRyYVNvdW5kOiBwcmVmZXJlbmNlc01vZGVsLmF1ZGlvTW9kZWwuc3VwcG9ydHNFeHRyYVNvdW5kLFxyXG4gICAgICAgIHN1cHBvcnRzR2VzdHVyZUNvbnRyb2w6IHByZWZlcmVuY2VzTW9kZWwuaW5wdXRNb2RlbC5zdXBwb3J0c0dlc3R1cmVDb250cm9sLFxyXG4gICAgICAgIHN1cHBvcnRzRHluYW1pY0xvY2FsZTogcHJlZmVyZW5jZXNNb2RlbC5sb2NhbGl6YXRpb25Nb2RlbC5zdXBwb3J0c0R5bmFtaWNMb2NhbGUsXHJcblxyXG4gICAgICAgIC8vIE1ldGhvZC1iYXNlZFxyXG4gICAgICAgIHN1cHBvcnRzQXVkaW9QcmVmZXJlbmNlczogcHJlZmVyZW5jZXNNb2RlbC5zdXBwb3J0c0F1ZGlvUHJlZmVyZW5jZXMoKSxcclxuICAgICAgICBzdXBwb3J0c0lucHV0UHJlZmVyZW5jZXM6IHByZWZlcmVuY2VzTW9kZWwuc3VwcG9ydHNJbnB1dFByZWZlcmVuY2VzKCksXHJcbiAgICAgICAgc3VwcG9ydHNMb2NhbGl6YXRpb25QcmVmZXJlbmNlczogcHJlZmVyZW5jZXNNb2RlbC5zdXBwb3J0c0xvY2FsaXphdGlvblByZWZlcmVuY2VzKCksXHJcbiAgICAgICAgc3VwcG9ydHNTaW11bGF0aW9uUHJlZmVyZW5jZXM6IHByZWZlcmVuY2VzTW9kZWwuc3VwcG9ydHNTaW11bGF0aW9uUHJlZmVyZW5jZXMoKSxcclxuICAgICAgICBzdXBwb3J0c1Zpc3VhbFByZWZlcmVuY2VzOiBwcmVmZXJlbmNlc01vZGVsLnN1cHBvcnRzVmlzdWFsUHJlZmVyZW5jZXMoKVxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuICAgIHN0YXRlU2NoZW1hOiB7XHJcbiAgICAgIHN1cHBvcnRzUHJvamVjdG9yTW9kZTogQm9vbGVhbklPLFxyXG4gICAgICBzdXBwb3J0c0ludGVyYWN0aXZlSGlnaGxpZ2h0czogQm9vbGVhbklPLFxyXG4gICAgICBzdXBwb3J0c1ZvaWNpbmc6IEJvb2xlYW5JTyxcclxuICAgICAgc3VwcG9ydHNTb3VuZDogQm9vbGVhbklPLFxyXG4gICAgICBzdXBwb3J0c0V4dHJhU291bmQ6IEJvb2xlYW5JTyxcclxuICAgICAgc3VwcG9ydHNHZXN0dXJlQ29udHJvbDogQm9vbGVhbklPLFxyXG4gICAgICBzdXBwb3J0c0R5bmFtaWNMb2NhbGU6IEJvb2xlYW5JTyxcclxuXHJcbiAgICAgIC8vIE1ldGhvZC1iYXNlZFxyXG4gICAgICBzdXBwb3J0c0F1ZGlvUHJlZmVyZW5jZXM6IEJvb2xlYW5JTyxcclxuICAgICAgc3VwcG9ydHNJbnB1dFByZWZlcmVuY2VzOiBCb29sZWFuSU8sXHJcbiAgICAgIHN1cHBvcnRzTG9jYWxpemF0aW9uUHJlZmVyZW5jZXM6IEJvb2xlYW5JTyxcclxuICAgICAgc3VwcG9ydHNTaW11bGF0aW9uUHJlZmVyZW5jZXM6IEJvb2xlYW5JTyxcclxuICAgICAgc3VwcG9ydHNWaXN1YWxQcmVmZXJlbmNlczogQm9vbGVhbklPXHJcbiAgICB9XHJcbiAgfSApO1xyXG59XHJcblxyXG5qb2lzdC5yZWdpc3RlciggJ1ByZWZlcmVuY2VzTW9kZWwnLCBQcmVmZXJlbmNlc01vZGVsICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFNBQVNBLG9CQUFvQixFQUFRQyxjQUFjLEVBQUVDLHFCQUFxQixRQUFRLGdDQUFnQztBQUNsSCxPQUFPQyxpQkFBaUIsTUFBTSxrREFBa0Q7QUFDaEYsT0FBT0MsZUFBZSxNQUFNLHFDQUFxQztBQUNqRSxPQUFPQyxLQUFLLE1BQU0sYUFBYTtBQUMvQixPQUFPQyxrQkFBa0IsTUFBTSx5QkFBeUI7QUFDeEQsT0FBT0MsWUFBWSxNQUFNLG1DQUFtQztBQUM1RCxPQUFPQyxZQUFZLE1BQU0sb0JBQW9CO0FBRzdDLE9BQU9DLFlBQVksTUFBK0Isb0NBQW9DO0FBQ3RGLE9BQU9DLFNBQVMsTUFBNEIsb0NBQW9DO0FBQ2hGLE9BQU9DLHdCQUF3QixNQUFNLHlEQUF5RDtBQUM5RixPQUFPQyxNQUFNLE1BQU0sOEJBQThCO0FBQ2pELE9BQU9DLGNBQWMsTUFBa0IsMkJBQTJCO0FBQ2xFLE9BQU9DLEtBQUssTUFBTSxnQ0FBZ0M7QUFFbEQsT0FBT0MsTUFBTSxNQUFNLG9DQUFvQztBQUN2RCxPQUFPQyxTQUFTLE1BQU0sdUNBQXVDO0FBQzdELE9BQU9DLFNBQVMsTUFBTSwrQkFBK0I7QUFDckQsU0FBU0MsK0JBQStCLFFBQVEscUNBQXFDO0FBZ0JyRixNQUFNQyxrQkFBa0IsR0FBRyxZQUFZO0FBQ3ZDLE1BQU1DLG1CQUFtQixHQUFHLGFBQWE7QUFDekMsTUFBTUMsa0JBQWtCLEdBQUcsWUFBWTs7QUFFdkM7QUFDQTs7QUFFQTs7QUFnRUE7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