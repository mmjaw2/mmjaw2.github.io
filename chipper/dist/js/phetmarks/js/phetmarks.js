// Copyright 2016-2024, University of Colorado Boulder

/**
 * Page for quickly launching phet-related tasks, such as simulations, automated/unit tests, or other utilities.
 *
 * Displays three columns. See type information below for details:
 *
 * - Repositories: A list of repositories to select from, each one of which has a number of modes.
 * - Modes: Based on the repository selected. Decides what type of URL is loaded when "Launch" or the enter key is
 *          pressed.
 * - Query Parameters: If available, controls what optional query parameters will be added to the end of the URL.
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

(async function () {
  // QueryParameter has the format

  const demoRepos = ['bamboo', 'griddle', 'scenery-phet', 'sun', 'tambo', 'vegas'];
  const docRepos = ['scenery', 'kite', 'dot', 'phet-io', 'binder'];
  // the name of a repo;

  // Use this as a parameter value to omit the query parameter selection (even if not the default selection)
  const NO_VALUE = 'No Value';

  // "General" is the default

  // Mode has the format

  // Query parameters that appear in multiple arrays.
  const audioQueryParameter = {
    value: 'audio',
    text: 'Audio support',
    type: 'parameterValues',
    parameterValues: ['enabled', 'disabled', 'muted'],
    omitIfDefault: true
  };
  const eaQueryParameter = {
    value: 'ea',
    text: 'Assertions',
    default: true
  };
  const localesQueryParameter = {
    value: 'locales=*',
    text: 'Load all locales',
    dependentQueryParameters: [{
      value: 'keyboardLocaleSwitcher',
      text: 'ctrl + u/i to cycle locales'
    }]
  };
  const phetioDebugParameter = {
    value: 'phetioDebug',
    text: 'Enable sim assertions from wrapper',
    type: 'boolean'
  };
  const phetioDebugTrueParameter = _.assign({
    default: true
  }, phetioDebugParameter);
  const phetioElementsDisplayParameter = {
    value: 'phetioElementsDisplay',
    text: 'What PhET-iO Elements to show',
    type: 'parameterValues',
    parameterValues: ['all', 'featured']
  };
  const phetioPrintAPIProblemsQueryParameter = {
    value: 'phetioPrintAPIProblems',
    text: 'Print all API problems at once'
  };
  const phetioPrintMissingTandemsQueryParameter = {
    value: 'phetioPrintMissingTandems',
    text: 'Print uninstrumented tandems'
  };
  const screensQueryParameter = {
    value: 'screens',
    text: 'Sim Screen',
    type: 'parameterValues',
    parameterValues: ['all', '1', '2', '3', '4', '5', '6'],
    omitIfDefault: true
  };
  const demosQueryParameters = [{
    value: 'component=Something',
    text: 'Component selection'
  }];

  // Query parameters used for the following modes: unbuilt, compiled, production
  const simNoLocalesQueryParameters = [audioQueryParameter, {
    value: 'fuzz',
    text: 'Fuzz',
    dependentQueryParameters: [{
      value: 'fuzzPointers=2',
      text: 'Multitouch-fuzz'
    }]
  }, {
    value: 'fuzzBoard',
    text: 'Keyboard Fuzz'
  }, {
    value: 'debugger',
    text: 'Debugger',
    default: true
  }, {
    value: 'deprecationWarnings',
    text: 'Deprecation Warnings'
  }, {
    value: 'dev',
    text: 'Dev'
  }, {
    value: 'profiler',
    text: 'Profiler'
  }, {
    value: 'showPointers',
    text: 'Pointers'
  }, {
    value: 'showPointerAreas',
    text: 'Pointer Areas'
  }, {
    value: 'showFittedBlockBounds',
    text: 'Fitted Block Bounds'
  }, {
    value: 'showCanvasNodeBounds',
    text: 'CanvasNode Bounds'
  }, {
    value: 'supportsInteractiveDescription',
    text: 'Supports Interactive Description',
    type: 'boolean'
  }, {
    value: 'supportsSound',
    text: 'Supports Sound',
    type: 'boolean'
  }, {
    value: 'supportsExtraSound',
    text: 'Supports Extra Sound',
    type: 'boolean'
  }, {
    value: 'extraSoundInitiallyEnabled',
    text: 'Extra Sound on by default'
  }, {
    value: 'supportsPanAndZoom',
    text: 'Supports Pan and Zoom',
    type: 'boolean'
  }, {
    value: 'supportsVoicing',
    text: 'Supports Voicing',
    type: 'boolean'
  }, {
    value: 'voicingInitiallyEnabled',
    text: 'Voicing on by default'
  }, {
    value: 'printVoicingResponses',
    text: 'console.log() voicing responses'
  }, {
    value: 'interactiveHighlightsInitiallyEnabled',
    text: 'Interactive Highlights on by default'
  }, {
    value: 'preferencesStorage',
    text: 'Load Preferences from localStorage.'
  }, {
    value: 'webgl',
    text: 'WebGL',
    type: 'boolean'
  }, {
    value: 'disableModals',
    text: 'Disable Modals'
  }, {
    value: 'regionAndCulture',
    text: 'Initial Region and Culture',
    type: 'parameterValues',
    omitIfDefault: true,
    parameterValues: ['default', 'usa', 'africa', 'africaModest', 'asia', 'latinAmerica', 'oceania', 'multi']
  }, {
    value: 'listenerOrder',
    text: 'Alter listener order',
    type: 'parameterValues',
    omitIfDefault: true,
    parameterValues: ['default', 'reverse', 'random', 'random(42)' // very random, do not change
    ]
  }, {
    value: 'strictAxonDependencies',
    text: 'Strict Axon Dependencies',
    type: 'boolean'
  }];

  // This weirdness is to keep the order the same (screens last), while allowing phet-io to change the default of locales=*;
  const simQueryParameters = simNoLocalesQueryParameters.concat([localesQueryParameter]);
  simQueryParameters.push(screensQueryParameter);
  simNoLocalesQueryParameters.push(screensQueryParameter);
  const phetBrandQueryParameter = {
    value: 'brand=phet',
    text: 'PhET Brand',
    default: true
  };

  // Query parameters used for unbuilt and PhET-iO wrappers
  const devSimQueryParameters = [phetBrandQueryParameter, eaQueryParameter, {
    value: 'eall',
    text: 'All Assertions'
  }];
  const phetioBaseParameters = [audioQueryParameter, {
    value: 'phetioEmitHighFrequencyEvents',
    type: 'boolean',
    text: 'Emit events that occur often'
  }, {
    value: 'phetioEmitStates',
    type: 'boolean',
    text: 'Emit state events'
  }, {
    value: 'phetioCompareAPI&randomSeed=332211',
    // NOTE: DUPLICATION ALERT: random seed must match that of API generation, see generatePhetioMacroAPI.js
    text: 'Compare with reference API'
  }, phetioPrintMissingTandemsQueryParameter, phetioPrintAPIProblemsQueryParameter, _.extend({
    default: true
  }, localesQueryParameter), {
    value: 'phetioValidation',
    text: 'Stricter, PhET-iO-specific validation',
    type: 'boolean'
  }];

  // See aqua/fuzz-lightyear for details
  const getFuzzLightyearParameters = (duration = 10000, testTask = true, moreFuzzers = true) => {
    return [{
      value: 'ea&audio=disabled',
      text: 'general sim params to include',
      default: true
    }, {
      value: 'randomize',
      text: 'Randomize'
    }, {
      value: 'reverse',
      text: 'Reverse'
    }, {
      value: 'loadTimeout=30000',
      text: 'time sim has to load',
      default: true
    }, {
      value: `testDuration=${duration}`,
      text: 'fuzz time after load',
      default: true
    }, {
      value: 'fuzzers=2',
      text: 'More fuzzers',
      default: moreFuzzers
    }, {
      value: 'wrapperName',
      text: 'PhET-iO Wrapper',
      type: 'parameterValues',
      omitIfDefault: true,
      parameterValues: ['default', 'studio', 'state']
    }, {
      value: `testTask=${testTask}`,
      text: 'test fuzzing after loading, set to false to just test loading',
      default: true
    }];
  };

  // See perennial-alias/data/wrappers for format
  const nonPublishedPhetioWrappersToAddToPhetmarks = ['phet-io-wrappers/mirror-inputs'];

  // Query parameters for the PhET-iO wrappers (including iframe tests)
  const phetioWrapperQueryParameters = phetioBaseParameters.concat([phetioDebugTrueParameter, {
    value: 'phetioWrapperDebug',
    text: 'Enable wrapper-side assertions',
    type: 'boolean',
    default: true
  }]);

  // For phetio sim frame links
  const phetioSimQueryParameters = phetioBaseParameters.concat([eaQueryParameter,
  // this needs to be first in this list
  {
    value: 'brand=phet-io&phetioStandalone&phetioConsoleLog=colorized',
    text: 'Formatted PhET-IO Console Output'
  }, phetioPrintMissingTandemsQueryParameter, phetioPrintAPIProblemsQueryParameter, {
    value: 'phetioPrintAPI',
    text: 'Print the API to the console'
  }]);
  const migrationQueryParameters = [...phetioWrapperQueryParameters, phetioElementsDisplayParameter];

  /**
   * Returns a local-storage key that has additional information included, to prevent collision with other applications (or in the future, previous
   * versions of phetmarks).
   */
  function storageKey(key) {
    return `phetmarks-${key}`;
  }

  /**
   * From the wrapper path in perennial-alias/data/wrappers, get the name of the wrapper.
   */
  const getWrapperName = function (wrapper) {
    // If the wrapper has its own individual repo, then get the name 'classroom-activity' from 'phet-io-wrapper-classroom-activity'
    // Maintain compatibility for wrappers in 'phet-io-wrappers-'
    const wrapperParts = wrapper.split('phet-io-wrapper-');
    const wrapperName = wrapperParts.length > 1 ? wrapperParts[1] : wrapper.startsWith('phet-io-sim-specific') ? wrapper.split('/')[wrapper.split('/').length - 1] : wrapper;

    // If the wrapper still has slashes in it, then it looks like 'phet-io-wrappers/active'
    const splitOnSlash = wrapperName.split('/');
    return splitOnSlash[splitOnSlash.length - 1];
  };

  // Track whether 'shift' key is pressed, so that we can change how windows are opened.  If shift is pressed, the
  // page is launched in a separate tab.
  let shiftPressed = false;
  window.addEventListener('keydown', event => {
    shiftPressed = event.shiftKey;
  });
  window.addEventListener('keyup', event => {
    shiftPressed = event.shiftKey;
  });
  function openURL(url) {
    if (shiftPressed) {
      window.open(url, '_blank');
    } else {
      // @ts-expect-error - the browser supports setting to a string.
      window.location = url;
    }
  }

  /**
   * Fills out the modeData map with information about repositories, modes and query parameters. Parameters are largely
   * repo lists from perennial-alias/data files.
   *
   */
  function populate(activeRunnables, activeRepos, phetioSims, interactiveDescriptionSims, wrappers, unitTestsRepos, phetioHydrogenSims, phetioPackageJSONs) {
    const modeData = {};
    activeRepos.forEach(repo => {
      const modes = [];
      modeData[repo] = modes;
      const isPhetio = _.includes(phetioSims, repo);
      const hasUnitTests = _.includes(unitTestsRepos, repo);
      const isRunnable = _.includes(activeRunnables, repo);
      const supportsInteractiveDescription = _.includes(interactiveDescriptionSims, repo);
      if (isRunnable) {
        modes.push({
          name: 'unbuilt',
          text: 'Unbuilt',
          description: 'Runs the simulation from the top-level development HTML in unbuilt mode',
          url: `../${repo}/${repo}_en.html`,
          queryParameters: [...devSimQueryParameters, ...(demoRepos.includes(repo) ? demosQueryParameters : []), ...simQueryParameters]
        });
        modes.push({
          name: 'compiled',
          text: 'Compiled',
          description: 'Runs the English simulation from the build/phet/ directory (built from chipper)',
          url: `../${repo}/build/phet/${repo}_en_phet.html`,
          queryParameters: simQueryParameters
        });
        modes.push({
          name: 'compiledXHTML',
          text: 'Compiled XHTML',
          description: 'Runs the English simulation from the build/phet/xhtml directory (built from chipper)',
          url: `../${repo}/build/phet/xhtml/${repo}_all.xhtml`,
          queryParameters: simQueryParameters
        });
        modes.push({
          name: 'production',
          text: 'Production',
          description: 'Runs the latest English simulation from the production server',
          url: `https://phet.colorado.edu/sims/html/${repo}/latest/${repo}_all.html`,
          queryParameters: simQueryParameters
        });
        modes.push({
          name: 'spot',
          text: 'Dev (bayes)',
          description: 'Loads the location on phet-dev.colorado.edu with versions for each dev deploy',
          url: `https://phet-dev.colorado.edu/html/${repo}`
        });

        // Color picker UI
        modes.push({
          name: 'colors',
          text: 'Color Editor',
          description: 'Runs the top-level -colors.html file (allows editing/viewing different profile colors)',
          url: `color-editor.html?sim=${repo}`,
          queryParameters: [phetBrandQueryParameter]
        });
      }
      if (repo === 'scenery') {
        modes.push({
          name: 'inspector',
          text: 'Inspector',
          description: 'Displays saved Scenery snapshots',
          url: `../${repo}/tests/inspector.html`
        });
      }
      if (repo === 'phet-io') {
        modes.push({
          name: 'test-studio-sims',
          text: 'Fuzz Test Studio Wrapper',
          description: 'Runs automated testing with fuzzing on studio, 15 second timer',
          url: '../aqua/fuzz-lightyear/',
          queryParameters: getFuzzLightyearParameters(15000).concat([{
            value: `fuzz&wrapperName=studio&wrapperContinuousTest=%7B%7D&repos=${phetioSims.join(',')}`,
            text: 'Fuzz Test PhET-IO sims',
            default: true
          }])
        });
        modes.push({
          name: 'test-migration-sims',
          text: 'Fuzz Test Migration',
          description: 'Runs automated testing with fuzzing on studio, 10 second timer',
          url: '../aqua/fuzz-lightyear/',
          queryParameters: getFuzzLightyearParameters(20000).concat(migrationQueryParameters).concat([{
            value: 'fuzz&wrapperName=migration&wrapperContinuousTest=%7B%7D&migrationRate=2000&' + `phetioMigrationReport=assert&repos=${phetioHydrogenSims.map(simData => simData.sim).join(',')}`,
            text: 'Fuzz Test PhET-IO sims',
            default: true
          }])
        });
        modes.push({
          name: 'test-state-sims',
          text: 'Fuzz Test State Wrapper',
          description: 'Runs automated testing with fuzzing on state, 15 second timer',
          url: '../aqua/fuzz-lightyear/',
          queryParameters: getFuzzLightyearParameters(15000).concat([{
            value: `fuzz&wrapperName=state&setStateRate=3000&wrapperContinuousTest=%7B%7D&repos=${phetioSims.join(',')}`,
            text: 'Fuzz Test PhET-IO sims',
            default: true
          }])
        });
      }
      if (repo === 'phet-io-website') {
        modes.push({
          name: 'viewRoot',
          text: 'View Local',
          description: 'view the local roon of the website',
          url: `../${repo}/root/`
        });
      }
      if (hasUnitTests) {
        modes.push({
          name: 'unitTestsUnbuilt',
          text: 'Unit Tests (unbuilt)',
          description: 'Runs unit tests in unbuilt mode',
          url: `../${repo}/${repo}-tests.html`,
          queryParameters: [eaQueryParameter, {
            value: 'brand=phet-io',
            text: 'PhET-iO Brand',
            default: repo === 'phet-io' || repo === 'tandem' || repo === 'phet-io-wrappers'
          }, ...(repo === 'phet-io-wrappers' ? [{
            value: 'sim=gravity-and-orbits',
            text: 'neededTestParams',
            default: true
          }] : [])]
        });
      }
      if (docRepos.includes(repo)) {
        modes.push({
          name: 'documentation',
          text: 'Documentation',
          description: 'Browse HTML documentation',
          url: `../${repo}/doc${repo === 'binder' ? 's' : ''}/`
        });
      }
      if (repo === 'scenery') {
        modes.push({
          name: 'layout-documentation',
          text: 'Layout Documentation',
          description: 'Browse HTML layout documentation',
          url: `../${repo}/doc/layout.html`
        });
      }
      if (repo === 'scenery' || repo === 'kite' || repo === 'dot') {
        modes.push({
          name: 'examples',
          text: 'Examples',
          description: 'Browse Examples',
          url: `../${repo}/examples/`
        });
      }
      if (repo === 'scenery' || repo === 'kite' || repo === 'dot' || repo === 'phet-core') {
        modes.push({
          name: 'playground',
          text: 'Playground',
          description: `Loads ${repo} and dependencies in the tab, and allows quick testing`,
          url: `../${repo}/tests/playground.html`
        });
      }
      if (repo === 'scenery') {
        modes.push({
          name: 'sandbox',
          text: 'Sandbox',
          description: 'Allows quick testing of Scenery features',
          url: `../${repo}/tests/sandbox.html`
        });
      }
      if (repo === 'chipper' || repo === 'aqua') {
        modes.push({
          name: 'test-phet-sims',
          text: 'Fuzz Test PhET Sims',
          description: 'Runs automated testing with fuzzing, 10 second timer',
          url: '../aqua/fuzz-lightyear/',
          queryParameters: getFuzzLightyearParameters().concat([{
            value: 'brand=phet&fuzz',
            text: 'Fuzz PhET sims',
            default: true
          }])
        });
        modes.push({
          name: 'test-phet-io-sims',
          text: 'Fuzz Test PhET-iO Sims',
          description: 'Runs automated testing with fuzzing, 10 second timer',
          url: '../aqua/fuzz-lightyear/',
          queryParameters: getFuzzLightyearParameters().concat([{
            value: 'brand=phet-io&fuzz&phetioStandalone',
            text: 'Fuzz PhET-IO brand',
            default: true
          }, {
            value: `repos=${phetioSims.join(',')}`,
            text: 'Test only PhET-iO sims',
            default: true
          }])
        });
        modes.push({
          name: 'test-interactive-description-sims',
          text: 'Fuzz Test Interactive Description Sims',
          description: 'Runs automated testing with fuzzing, 10 second timer',
          url: '../aqua/fuzz-lightyear/',
          // only one fuzzer because two iframes cannot both receive focus/blur events
          queryParameters: getFuzzLightyearParameters(10000, true, false).concat([phetBrandQueryParameter, {
            value: 'fuzzBoard&supportsInteractiveDescription=true',
            text: 'Keyboard Fuzz Test sims',
            default: true
          }, {
            value: 'fuzz&supportsInteractiveDescription=true',
            text: 'Normal Fuzz Test sims'
          }, {
            value: `repos=${interactiveDescriptionSims.join(',')}`,
            text: 'Test only A11y sims',
            default: true
          }])
        });
        modes.push({
          name: 'fuzz-sims-load-only',
          text: 'Load Sims',
          description: 'Runs automated testing that just loads sims (without fuzzing or building)',
          url: '../aqua/fuzz-lightyear/',
          queryParameters: getFuzzLightyearParameters(10000, false).concat([phetBrandQueryParameter])
        });
        modes.push({
          name: 'continuous-testing',
          text: 'Continuous Testing',
          description: 'Link to the continuous testing on Bayes.',
          url: 'https://bayes.colorado.edu/continuous-testing/aqua/html/continuous-report.html'
        });

        // Shared by old and multi snapshop comparison.
        const sharedComparisonQueryParameters = [{
          value: 'simSeed=123',
          text: 'Custom seed (defaults to a non random value)'
        }, {
          value: `simWidth=${1024 / 2}`,
          text: 'Larger sim width'
        }, {
          value: `simHeight=${768 / 2}`,
          text: 'Larger sim height'
        }, {
          value: 'numFrames=30',
          text: 'more comparison frames'
        }];
        modes.push({
          name: 'snapshot-comparison',
          text: 'Snapshot Comparison',
          description: 'Sets up snapshot screenshot comparison that can be run on different SHAs',
          url: '../aqua/html/snapshot-comparison.html',
          queryParameters: [eaQueryParameter, {
            value: 'repos=density,buoyancy',
            text: 'Sims to compare'
          }, {
            value: 'randomSims=10',
            text: 'Test a random number of sims'
          }, ...sharedComparisonQueryParameters, {
            value: 'simQueryParameters=ea',
            text: 'sim frame parameters'
          }, {
            value: 'showTime',
            text: 'show time taken for each snpashot',
            type: 'boolean'
          }, {
            value: 'compareDescription',
            text: 'compare description PDOM and text too',
            type: 'boolean'
          }]
        });
        modes.push({
          name: 'multi-snapshot-comparison',
          text: 'Multi-snapshot Comparison',
          description: 'Sets up snapshot screenshot comparison for two different checkouts',
          url: '../aqua/html/multi-snapshot-comparison.html',
          queryParameters: [eaQueryParameter, {
            value: 'repos=density,buoyancy',
            text: 'Sims to compare'
          }, {
            value: 'urls=http://localhost,http://localhost:8080',
            text: 'Testing urls',
            default: true
          }, ...sharedComparisonQueryParameters, {
            value: 'testPhetio',
            type: 'boolean',
            text: 'Test PhET-iO Brand'
          }, {
            value: 'simQueryParameters=ea',
            text: 'sim parameters (not ?brand)',
            default: true
          }, {
            value: 'copies=1',
            text: 'IFrames per column'
          }]
        });
      }
      if (repo === 'yotta') {
        modes.push({
          name: 'yotta-statistics',
          text: 'Statistics page',
          description: 'Goes to the yotta report page, credentials in the Google Doc',
          url: 'https://bayes.colorado.edu/statistics/yotta/'
        });
      }
      if (repo === 'skiffle') {
        modes.push({
          name: 'sound-board',
          text: 'Sound Board',
          description: 'Interactive HTML page for exploring existing sounds in sims and common code',
          url: '../skiffle/html/sound-board.html'
        });
      }
      if (repo === 'quake') {
        modes.push({
          name: 'quake-built',
          text: 'Haptics Playground (built for browser)',
          description: 'Built browser version of the Haptics Playground app',
          url: '../quake/platforms/browser/www/haptics-playground.html'
        });
      }
      if (supportsInteractiveDescription) {
        modes.push({
          name: 'a11y-view',
          text: 'A11y View',
          description: 'Runs the simulation in an iframe next to a copy of the PDOM tot easily inspect accessible content.',
          url: `../${repo}/${repo}_a11y_view.html`,
          queryParameters: devSimQueryParameters.concat(simQueryParameters)
        });
      }
      if (repo === 'interaction-dashboard') {
        modes.push({
          name: 'preprocessor',
          text: 'Preprocessor',
          description: 'Load the preprocessor for parsing data logs down to a size that can be used by the simulation.',
          url: `../${repo}/preprocessor.html`,
          queryParameters: [eaQueryParameter, {
            value: 'parseX=10',
            text: 'Test only 10 sessions'
          }, {
            value: 'forSpreadsheet',
            text: 'Create output for a spreadsheet.'
          }]
        });
      }
      modes.push({
        name: 'github',
        text: 'GitHub',
        description: 'Opens to the repository\'s GitHub main page',
        url: `https://github.com/phetsims/${repo}`
      });
      modes.push({
        name: 'issues',
        text: 'Issues',
        description: 'Opens to the repository\'s GitHub issues page',
        url: `https://github.com/phetsims/${repo}/issues`
      });

      // if a phet-io sim, then add the wrappers to them
      if (isPhetio) {
        // Add the console logging, not a wrapper but nice to have
        modes.push({
          name: 'one-sim-wrapper-tests',
          text: 'Wrapper Unit Tests',
          group: 'PhET-iO',
          description: 'Test the PhET-iO API for this sim.',
          // Each sim gets its own test, just run sim-less tests here
          url: `../phet-io-wrappers/phet-io-wrappers-tests.html?sim=${repo}`,
          queryParameters: phetioWrapperQueryParameters
        });

        // Add a link to the compiled wrapper index;
        modes.push({
          name: 'compiled-index',
          text: 'Compiled Index',
          group: 'PhET-iO',
          description: 'Runs the PhET-iO wrapper index from build/ directory (built from chipper)',
          url: `../${repo}/build/phet-io/`,
          queryParameters: phetioWrapperQueryParameters
        });
        modes.push({
          name: 'standalone',
          text: 'Standalone',
          group: 'PhET-iO',
          description: 'Runs the sim in phet-io brand with the standalone query parameter',
          url: `../${repo}/${repo}_en.html?brand=phet-io&phetioStandalone`,
          queryParameters: phetioSimQueryParameters.concat(simNoLocalesQueryParameters)
        });
        const simSpecificWrappers = phetioPackageJSONs[repo]?.phet['phet-io']?.wrappers || [];
        const allWrappers = wrappers.concat(nonPublishedPhetioWrappersToAddToPhetmarks).concat(simSpecificWrappers);

        // phet-io wrappers
        _.sortBy(allWrappers, getWrapperName).forEach(wrapper => {
          const wrapperName = getWrapperName(wrapper);
          let url = '';

          // Process for dedicated wrapper repos
          if (wrapper.startsWith('phet-io-wrapper-')) {
            // Special use case for the sonification wrapper
            url = wrapperName === 'sonification' ? `../phet-io-wrapper-${wrapperName}/${repo}-sonification.html?sim=${repo}` : `../${wrapper}/?sim=${repo}`;
          }
          // Load the wrapper urls for the phet-io-wrappers/
          else {
            url = `../${wrapper}/?sim=${repo}`;
          }

          // add recording to the console by default
          if (wrapper === 'phet-io-wrappers/record') {
            url += '&console';
          }
          let queryParameters = [];
          if (wrapperName === 'studio') {
            // So we don't mutate the common list
            const studioQueryParameters = [...phetioWrapperQueryParameters];

            // Studio defaults to phetioDebug=true, so this parameter can't be on by default
            _.remove(studioQueryParameters, item => item === phetioDebugTrueParameter);
            queryParameters = studioQueryParameters.concat([phetioDebugParameter, phetioElementsDisplayParameter]);
          } else if (wrapperName === 'migration') {
            queryParameters = [...migrationQueryParameters, {
              value: 'phetioMigrationReport',
              type: 'parameterValues',
              text: 'How should the migration report be reported?',
              parameterValues: ['dev', 'client', 'verbose', 'assert'],
              omitIfDefault: false
            }];
          } else if (wrapperName === 'state') {
            queryParameters = [...phetioWrapperQueryParameters, {
              value: 'setStateRate=1000',
              text: 'Customize the "set state" rate for how often a state is set to the downstream sim (in ms)',
              default: true
            }, {
              value: 'logTiming',
              text: 'Console log the amount of time it took to set the state of the simulation.'
            }];
          } else if (wrapperName === 'playback') {
            queryParameters = [];
          } else {
            queryParameters = phetioWrapperQueryParameters;
          }
          modes.push({
            name: wrapperName,
            text: wrapperName,
            group: 'PhET-iO',
            description: `Runs the phet-io wrapper ${wrapperName}`,
            url: url,
            queryParameters: queryParameters
          });
        });

        // Add the console logging, not a wrapper but nice to have
        modes.push({
          name: 'colorized',
          text: 'Data: colorized',
          group: 'PhET-iO',
          description: 'Show the colorized event log in the console of the stand alone sim.',
          url: `../${repo}/${repo}_en.html?brand=phet-io&phetioConsoleLog=colorized&phetioStandalone&phetioEmitHighFrequencyEvents=false`,
          queryParameters: phetioSimQueryParameters.concat(simNoLocalesQueryParameters)
        });
      }
    });
    return modeData;
  }
  function clearChildren(element) {
    while (element.childNodes.length) {
      element.removeChild(element.childNodes[0]);
    }
  }
  function createRepositorySelector(repositories) {
    const select = document.createElement('select');
    select.autofocus = true;
    repositories.forEach(repo => {
      const option = document.createElement('option');
      option.value = option.label = option.innerHTML = repo;
      select.appendChild(option);
    });

    // IE or no-scrollIntoView will need to be height-limited
    // @ts-expect-error
    if (select.scrollIntoView && !navigator.userAgent.includes('Trident/')) {
      select.setAttribute('size', `${repositories.length}`);
    } else {
      select.setAttribute('size', '30');
    }

    // Select a repository if it's been stored in localStorage before
    const repoKey = storageKey('repo');
    const value = localStorage.getItem(repoKey);
    if (value) {
      select.value = value;
    }
    select.focus();

    // Scroll to the selected element
    function tryScroll() {
      const element = select.childNodes[select.selectedIndex];

      // @ts-expect-error
      if (element.scrollIntoViewIfNeeded) {
        // @ts-expect-error
        element.scrollIntoViewIfNeeded();
      } else if (element.scrollIntoView) {
        element.scrollIntoView();
      }
    }
    select.addEventListener('change', tryScroll);
    // We need to wait for things to load fully before scrolling (in Chrome).
    // See https://github.com/phetsims/phetmarks/issues/13
    setTimeout(tryScroll, 0);
    return {
      element: select,
      get value() {
        // @ts-expect-error - it is an HTMLElement, not just a node
        return select.childNodes[select.selectedIndex].value;
      }
    };
  }
  function createModeSelector(modeData, repositorySelector) {
    const select = document.createElement('select');
    const selector = {
      element: select,
      get value() {
        return select.value;
      },
      get mode() {
        const currentModeName = selector.value;
        return _.filter(modeData[repositorySelector.value], mode => {
          return mode.name === currentModeName;
        })[0];
      },
      update: function () {
        localStorage.setItem(storageKey('repo'), repositorySelector.value);
        clearChildren(select);
        const groups = {};
        modeData[repositorySelector.value].forEach(choice => {
          const choiceOption = document.createElement('option');
          choiceOption.value = choice.name;
          choiceOption.label = choice.text;
          choiceOption.title = choice.description;
          choiceOption.innerHTML = choice.text;

          // add to an `optgroup` instead of having all modes on the `select`
          choice.group = choice.group || 'General';

          // create if the group doesn't exist
          if (!groups[choice.group]) {
            const optGroup = document.createElement('optgroup');
            optGroup.label = choice.group;
            groups[choice.group] = optGroup;
            select.appendChild(optGroup);
          }

          // add the choice to the property group
          groups[choice.group].appendChild(choiceOption);
        });
        select.setAttribute('size', modeData[repositorySelector.value].length + Object.keys(groups).length + '');
        if (select.selectedIndex < 0) {
          select.selectedIndex = 0;
        }
      }
    };
    return selector;
  }

  // Create control for type 'parameterValues', and also 'boolean' which has hard coded values true/false/sim default.
  function createParameterValuesSelector(queryParameter) {
    // We don't want to mutate the provided data
    queryParameter = _.assignIn({}, queryParameter);
    if (queryParameter.type === 'boolean') {
      assert && assert(!queryParameter.hasOwnProperty('parameterValues'), 'parameterValues are filled in for boolean');
      assert && assert(!queryParameter.hasOwnProperty('omitIfDefault'), 'omitIfDefault is filled in for boolean');
      queryParameter.parameterValues = ['true', 'false', NO_VALUE];

      // sim default is the default for booleans
      if (!queryParameter.hasOwnProperty('default')) {
        queryParameter.default = NO_VALUE;
      }
    } else {
      assert && assert(queryParameter.type === 'parameterValues', `parameterValues type only please: ${queryParameter.value} - ${queryParameter.type}`);
    }
    assert && assert(queryParameter.parameterValues, 'parameterValues expected');
    assert && assert(queryParameter.parameterValues.length > 0, 'parameterValues expected (more than 0 of them)');
    assert && assert(!queryParameter.hasOwnProperty('dependentQueryParameters'), 'type=parameterValues and type=boolean do not support dependent query parameters at this time.');
    const div = document.createElement('div');
    const queryParameterName = queryParameter.value;
    const parameterValues = queryParameter.parameterValues;
    const providedADefault = queryParameter.hasOwnProperty('default');
    const theProvidedDefault = queryParameter.default + '';
    if (providedADefault) {
      assert && assert(parameterValues.includes(theProvidedDefault), `parameter default for ${queryParameterName} is not an available value: ${theProvidedDefault}`);
    }
    const defaultValue = providedADefault ? theProvidedDefault : parameterValues[0];
    const createParameterValuesRadioButton = value => {
      const label = document.createElement('label');
      label.className = 'choiceLabel';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = queryParameterName;
      radio.value = value;
      radio.checked = value === defaultValue;
      label.appendChild(radio);
      label.appendChild(document.createTextNode(value)); // use the query parameter value as the display text for clarity
      return label;
    };
    const bullet = document.createElement('span');
    bullet.innerHTML = '⚫';
    bullet.className = 'bullet';
    div.appendChild(bullet);
    const label = document.createTextNode(`${queryParameter.text} (?${queryParameterName})`);
    div.appendChild(label);
    for (let i = 0; i < parameterValues.length; i++) {
      div.appendChild(createParameterValuesRadioButton(parameterValues[i]));
    }
    return {
      element: div,
      get value() {
        const radioButtonValue = $(`input[name=${queryParameterName}]:checked`).val() + '';

        // A value of "Simulation Default" tells us not to provide the query parameter.
        const omitQueryParameter = radioButtonValue === NO_VALUE || queryParameter.omitIfDefault && radioButtonValue === defaultValue;
        return omitQueryParameter ? '' : `${queryParameterName}=${radioButtonValue}`;
      }
    };
  }

  // get Flag checkboxes as their individual query strings (in a list), but only if they are different from their default.
  function getFlagParameters(toggleContainer) {
    const checkboxElements = $(toggleContainer).find('.flagParameter');

    // Only checked boxed.
    return _.filter(checkboxElements, checkbox => checkbox.checked).map(checkbox => checkbox.name);
  }

  // Create a checkbox to toggle if the flag parameter should be added to the mode URL
  function createFlagSelector(parameter, toggleContainer, elementToQueryParameter) {
    assert && assert(!parameter.hasOwnProperty('parameterValues'), 'parameterValues are for type=parameterValues');
    assert && assert(!parameter.hasOwnProperty('omitIfDefault'), 'omitIfDefault are for type=parameterValues');
    assert && parameter.hasOwnProperty('default') && assert(typeof parameter.default === 'boolean', 'default is a boolean for flags');
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = parameter.value;
    checkbox.classList.add('flagParameter');
    label.appendChild(checkbox);
    assert && assert(!elementToQueryParameter.has(checkbox), 'sanity check for overwriting');
    elementToQueryParameter.set(checkbox, parameter);
    const queryParameterDisplay = parameter.value;
    label.appendChild(document.createTextNode(`${parameter.text} (?${queryParameterDisplay})`));
    toggleContainer.appendChild(label);
    toggleContainer.appendChild(document.createElement('br'));
    checkbox.checked = !!parameter.default;
    if (parameter.dependentQueryParameters) {
      /**
       * Creates a checkbox whose value is dependent on another checkbox, it is only used if the parent
       * checkbox is checked.
       */
      const createDependentCheckbox = (label, value, checked) => {
        const dependentQueryParametersContainer = document.createElement('div');
        const dependentCheckbox = document.createElement('input');
        dependentCheckbox.id = getDependentParameterControlId(value);
        dependentCheckbox.type = 'checkbox';
        dependentCheckbox.name = value;
        dependentCheckbox.classList.add('flagParameter');
        dependentCheckbox.style.marginLeft = '40px';
        dependentCheckbox.checked = checked;
        const labelElement = document.createElement('label');
        labelElement.appendChild(document.createTextNode(label));
        labelElement.htmlFor = dependentCheckbox.id;
        dependentQueryParametersContainer.appendChild(dependentCheckbox);
        dependentQueryParametersContainer.appendChild(labelElement);

        // checkbox becomes unchecked and disabled if dependency checkbox is unchecked
        const enableButton = () => {
          dependentCheckbox.disabled = !checkbox.checked;
          if (!checkbox.checked) {
            dependentCheckbox.checked = false;
          }
        };
        checkbox.addEventListener('change', enableButton);
        enableButton();
        return dependentQueryParametersContainer;
      };
      const containerDiv = document.createElement('div');
      parameter.dependentQueryParameters.forEach(relatedParameter => {
        const dependentCheckbox = createDependentCheckbox(`${relatedParameter.text} (${relatedParameter.value})`, relatedParameter.value, !!relatedParameter.default);
        containerDiv.appendChild(dependentCheckbox);
      });
      toggleContainer.appendChild(containerDiv);
    }
  }
  function createQueryParametersSelector(modeSelector) {
    const customTextBox = document.createElement('input');
    customTextBox.type = 'text';
    const toggleContainer = document.createElement('div');
    let elementToQueryParameter = new Map();
    const parameterValuesSelectors = [];
    return {
      toggleElement: toggleContainer,
      customElement: customTextBox,
      get value() {
        // flag query parameters, in string form
        const flagQueryParameters = getFlagParameters(toggleContainer);
        const parameterValuesQueryParameters = parameterValuesSelectors.map(selector => selector.value).filter(queryParameter => queryParameter !== '');
        const customQueryParameters = customTextBox.value.length ? [customTextBox.value] : [];
        return flagQueryParameters.concat(parameterValuesQueryParameters).concat(customQueryParameters).join('&');
      },
      update: function () {
        // Rebuild based on a new mode/repo change

        elementToQueryParameter = new Map();
        parameterValuesSelectors.length = 0;
        clearChildren(toggleContainer);
        const queryParameters = modeSelector.mode.queryParameters || [];
        queryParameters.forEach(parameter => {
          if (parameter.type === 'parameterValues' || parameter.type === 'boolean') {
            const selector = createParameterValuesSelector(parameter);
            toggleContainer.appendChild(selector.element);
            parameterValuesSelectors.push(selector);
          } else {
            createFlagSelector(parameter, toggleContainer, elementToQueryParameter);
          }
        });
      }
    };
  }

  /**
   * Create the view and hook everything up.
   */
  function render(modeData) {
    const repositorySelector = createRepositorySelector(Object.keys(modeData));
    const modeSelector = createModeSelector(modeData, repositorySelector);
    const queryParameterSelector = createQueryParametersSelector(modeSelector);
    function getCurrentURL() {
      const queryParameters = queryParameterSelector.value;
      const url = modeSelector.mode.url;
      const separator = url.includes('?') ? '&' : '?';
      return url + (queryParameters.length ? separator + queryParameters : '');
    }
    const launchButton = document.createElement('button');
    launchButton.id = 'launchButton';
    launchButton.name = 'launch';
    launchButton.innerHTML = 'Launch';
    const resetButton = document.createElement('button');
    resetButton.name = 'reset';
    resetButton.innerHTML = 'Reset Query Parameters';
    function header(string) {
      const head = document.createElement('h3');
      head.appendChild(document.createTextNode(string));
      return head;
    }

    // Divs for our three columns
    const repoDiv = document.createElement('div');
    repoDiv.id = 'repositories';
    const modeDiv = document.createElement('div');
    modeDiv.id = 'choices';
    const queryParametersDiv = document.createElement('div');
    queryParametersDiv.id = 'queryParameters';

    // Layout of all the major elements
    repoDiv.appendChild(header('Repositories'));
    repoDiv.appendChild(repositorySelector.element);
    modeDiv.appendChild(header('Modes'));
    modeDiv.appendChild(modeSelector.element);
    modeDiv.appendChild(document.createElement('br'));
    modeDiv.appendChild(document.createElement('br'));
    modeDiv.appendChild(launchButton);
    queryParametersDiv.appendChild(header('Query Parameters'));
    queryParametersDiv.appendChild(queryParameterSelector.toggleElement);
    queryParametersDiv.appendChild(document.createTextNode('Query Parameters: '));
    queryParametersDiv.appendChild(queryParameterSelector.customElement);
    queryParametersDiv.appendChild(document.createElement('br'));
    queryParametersDiv.appendChild(resetButton);
    document.body.appendChild(repoDiv);
    document.body.appendChild(modeDiv);
    document.body.appendChild(queryParametersDiv);
    function updateQueryParameterVisibility() {
      queryParametersDiv.style.visibility = modeSelector.mode.queryParameters ? 'inherit' : 'hidden';
    }

    // Align panels based on width
    function layout() {
      modeDiv.style.left = `${repositorySelector.element.clientWidth + 20}px`;
      queryParametersDiv.style.left = `${repositorySelector.element.clientWidth + +modeDiv.clientWidth + 40}px`;
    }
    window.addEventListener('resize', layout);

    // Hook updates to change listeners
    function onRepositoryChanged() {
      modeSelector.update();
      onModeChanged();
    }
    function onModeChanged() {
      queryParameterSelector.update();
      updateQueryParameterVisibility();
      layout();
    }
    repositorySelector.element.addEventListener('change', onRepositoryChanged);
    modeSelector.element.addEventListener('change', onModeChanged);
    onRepositoryChanged();

    // Clicking 'Launch' or pressing 'enter' opens the URL
    function openCurrentURL() {
      openURL(getCurrentURL());
    }
    window.addEventListener('keydown', event => {
      // Check for enter key
      if (event.which === 13) {
        openCurrentURL();
      }
    }, false);
    launchButton.addEventListener('click', openCurrentURL);

    // Reset by redrawing everything
    resetButton.addEventListener('click', queryParameterSelector.update);
  }
  async function loadPackageJSONs(repos) {
    const packageJSONs = {};
    for (const repo of repos) {
      packageJSONs[repo] = await $.ajax({
        url: `../${repo}/package.json`
      });
    }
    return packageJSONs;
  }

  // Splits file strings (such as perennial-alias/data/active-runnables) into a list of entries, ignoring blank lines.
  function whiteSplitAndSort(rawDataList) {
    return rawDataList.split('\n').map(line => {
      return line.replace('\r', '');
    }).filter(line => {
      return line.length > 0;
    }).sort();
  }

  // get the ID for a checkbox that is "dependent" on another value
  const getDependentParameterControlId = value => `dependent-checkbox-${value}`;

  // Load files serially, populate then render
  const activeRunnables = whiteSplitAndSort(await $.ajax({
    url: '../perennial-alias/data/active-runnables'
  }));
  const activeRepos = whiteSplitAndSort(await $.ajax({
    url: '../perennial-alias/data/active-repos'
  }));
  const phetioSims = whiteSplitAndSort(await $.ajax({
    url: '../perennial-alias/data/phet-io'
  }));
  const interactiveDescriptionSims = whiteSplitAndSort(await $.ajax({
    url: '../perennial-alias/data/interactive-description'
  }));
  const wrappers = whiteSplitAndSort(await $.ajax({
    url: '../perennial-alias/data/wrappers'
  }));
  const unitTestsRepos = whiteSplitAndSort(await $.ajax({
    url: '../perennial-alias/data/unit-tests'
  }));
  const phetioHydrogenSims = await $.ajax({
    url: '../perennial-alias/data/phet-io-hydrogen.json'
  });
  const phetioPackageJSONs = await loadPackageJSONs(phetioSims);
  render(populate(activeRunnables, activeRepos, phetioSims, interactiveDescriptionSims, wrappers, unitTestsRepos, phetioHydrogenSims, phetioPackageJSONs));
})().catch(e => {
  throw e;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJkZW1vUmVwb3MiLCJkb2NSZXBvcyIsIk5PX1ZBTFVFIiwiYXVkaW9RdWVyeVBhcmFtZXRlciIsInZhbHVlIiwidGV4dCIsInR5cGUiLCJwYXJhbWV0ZXJWYWx1ZXMiLCJvbWl0SWZEZWZhdWx0IiwiZWFRdWVyeVBhcmFtZXRlciIsImRlZmF1bHQiLCJsb2NhbGVzUXVlcnlQYXJhbWV0ZXIiLCJkZXBlbmRlbnRRdWVyeVBhcmFtZXRlcnMiLCJwaGV0aW9EZWJ1Z1BhcmFtZXRlciIsInBoZXRpb0RlYnVnVHJ1ZVBhcmFtZXRlciIsIl8iLCJhc3NpZ24iLCJwaGV0aW9FbGVtZW50c0Rpc3BsYXlQYXJhbWV0ZXIiLCJwaGV0aW9QcmludEFQSVByb2JsZW1zUXVlcnlQYXJhbWV0ZXIiLCJwaGV0aW9QcmludE1pc3NpbmdUYW5kZW1zUXVlcnlQYXJhbWV0ZXIiLCJzY3JlZW5zUXVlcnlQYXJhbWV0ZXIiLCJkZW1vc1F1ZXJ5UGFyYW1ldGVycyIsInNpbU5vTG9jYWxlc1F1ZXJ5UGFyYW1ldGVycyIsInNpbVF1ZXJ5UGFyYW1ldGVycyIsImNvbmNhdCIsInB1c2giLCJwaGV0QnJhbmRRdWVyeVBhcmFtZXRlciIsImRldlNpbVF1ZXJ5UGFyYW1ldGVycyIsInBoZXRpb0Jhc2VQYXJhbWV0ZXJzIiwiZXh0ZW5kIiwiZ2V0RnV6ekxpZ2h0eWVhclBhcmFtZXRlcnMiLCJkdXJhdGlvbiIsInRlc3RUYXNrIiwibW9yZUZ1enplcnMiLCJub25QdWJsaXNoZWRQaGV0aW9XcmFwcGVyc1RvQWRkVG9QaGV0bWFya3MiLCJwaGV0aW9XcmFwcGVyUXVlcnlQYXJhbWV0ZXJzIiwicGhldGlvU2ltUXVlcnlQYXJhbWV0ZXJzIiwibWlncmF0aW9uUXVlcnlQYXJhbWV0ZXJzIiwic3RvcmFnZUtleSIsImtleSIsImdldFdyYXBwZXJOYW1lIiwid3JhcHBlciIsIndyYXBwZXJQYXJ0cyIsInNwbGl0Iiwid3JhcHBlck5hbWUiLCJsZW5ndGgiLCJzdGFydHNXaXRoIiwic3BsaXRPblNsYXNoIiwic2hpZnRQcmVzc2VkIiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsImV2ZW50Iiwic2hpZnRLZXkiLCJvcGVuVVJMIiwidXJsIiwib3BlbiIsImxvY2F0aW9uIiwicG9wdWxhdGUiLCJhY3RpdmVSdW5uYWJsZXMiLCJhY3RpdmVSZXBvcyIsInBoZXRpb1NpbXMiLCJpbnRlcmFjdGl2ZURlc2NyaXB0aW9uU2ltcyIsIndyYXBwZXJzIiwidW5pdFRlc3RzUmVwb3MiLCJwaGV0aW9IeWRyb2dlblNpbXMiLCJwaGV0aW9QYWNrYWdlSlNPTnMiLCJtb2RlRGF0YSIsImZvckVhY2giLCJyZXBvIiwibW9kZXMiLCJpc1BoZXRpbyIsImluY2x1ZGVzIiwiaGFzVW5pdFRlc3RzIiwiaXNSdW5uYWJsZSIsInN1cHBvcnRzSW50ZXJhY3RpdmVEZXNjcmlwdGlvbiIsIm5hbWUiLCJkZXNjcmlwdGlvbiIsInF1ZXJ5UGFyYW1ldGVycyIsImpvaW4iLCJtYXAiLCJzaW1EYXRhIiwic2ltIiwic2hhcmVkQ29tcGFyaXNvblF1ZXJ5UGFyYW1ldGVycyIsImdyb3VwIiwic2ltU3BlY2lmaWNXcmFwcGVycyIsInBoZXQiLCJhbGxXcmFwcGVycyIsInNvcnRCeSIsInN0dWRpb1F1ZXJ5UGFyYW1ldGVycyIsInJlbW92ZSIsIml0ZW0iLCJjbGVhckNoaWxkcmVuIiwiZWxlbWVudCIsImNoaWxkTm9kZXMiLCJyZW1vdmVDaGlsZCIsImNyZWF0ZVJlcG9zaXRvcnlTZWxlY3RvciIsInJlcG9zaXRvcmllcyIsInNlbGVjdCIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImF1dG9mb2N1cyIsIm9wdGlvbiIsImxhYmVsIiwiaW5uZXJIVE1MIiwiYXBwZW5kQ2hpbGQiLCJzY3JvbGxJbnRvVmlldyIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsInNldEF0dHJpYnV0ZSIsInJlcG9LZXkiLCJsb2NhbFN0b3JhZ2UiLCJnZXRJdGVtIiwiZm9jdXMiLCJ0cnlTY3JvbGwiLCJzZWxlY3RlZEluZGV4Iiwic2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCIsInNldFRpbWVvdXQiLCJjcmVhdGVNb2RlU2VsZWN0b3IiLCJyZXBvc2l0b3J5U2VsZWN0b3IiLCJzZWxlY3RvciIsIm1vZGUiLCJjdXJyZW50TW9kZU5hbWUiLCJmaWx0ZXIiLCJ1cGRhdGUiLCJzZXRJdGVtIiwiZ3JvdXBzIiwiY2hvaWNlIiwiY2hvaWNlT3B0aW9uIiwidGl0bGUiLCJvcHRHcm91cCIsIk9iamVjdCIsImtleXMiLCJjcmVhdGVQYXJhbWV0ZXJWYWx1ZXNTZWxlY3RvciIsInF1ZXJ5UGFyYW1ldGVyIiwiYXNzaWduSW4iLCJhc3NlcnQiLCJoYXNPd25Qcm9wZXJ0eSIsImRpdiIsInF1ZXJ5UGFyYW1ldGVyTmFtZSIsInByb3ZpZGVkQURlZmF1bHQiLCJ0aGVQcm92aWRlZERlZmF1bHQiLCJkZWZhdWx0VmFsdWUiLCJjcmVhdGVQYXJhbWV0ZXJWYWx1ZXNSYWRpb0J1dHRvbiIsImNsYXNzTmFtZSIsInJhZGlvIiwiY2hlY2tlZCIsImNyZWF0ZVRleHROb2RlIiwiYnVsbGV0IiwiaSIsInJhZGlvQnV0dG9uVmFsdWUiLCIkIiwidmFsIiwib21pdFF1ZXJ5UGFyYW1ldGVyIiwiZ2V0RmxhZ1BhcmFtZXRlcnMiLCJ0b2dnbGVDb250YWluZXIiLCJjaGVja2JveEVsZW1lbnRzIiwiZmluZCIsImNoZWNrYm94IiwiY3JlYXRlRmxhZ1NlbGVjdG9yIiwicGFyYW1ldGVyIiwiZWxlbWVudFRvUXVlcnlQYXJhbWV0ZXIiLCJjbGFzc0xpc3QiLCJhZGQiLCJoYXMiLCJzZXQiLCJxdWVyeVBhcmFtZXRlckRpc3BsYXkiLCJjcmVhdGVEZXBlbmRlbnRDaGVja2JveCIsImRlcGVuZGVudFF1ZXJ5UGFyYW1ldGVyc0NvbnRhaW5lciIsImRlcGVuZGVudENoZWNrYm94IiwiaWQiLCJnZXREZXBlbmRlbnRQYXJhbWV0ZXJDb250cm9sSWQiLCJzdHlsZSIsIm1hcmdpbkxlZnQiLCJsYWJlbEVsZW1lbnQiLCJodG1sRm9yIiwiZW5hYmxlQnV0dG9uIiwiZGlzYWJsZWQiLCJjb250YWluZXJEaXYiLCJyZWxhdGVkUGFyYW1ldGVyIiwiY3JlYXRlUXVlcnlQYXJhbWV0ZXJzU2VsZWN0b3IiLCJtb2RlU2VsZWN0b3IiLCJjdXN0b21UZXh0Qm94IiwiTWFwIiwicGFyYW1ldGVyVmFsdWVzU2VsZWN0b3JzIiwidG9nZ2xlRWxlbWVudCIsImN1c3RvbUVsZW1lbnQiLCJmbGFnUXVlcnlQYXJhbWV0ZXJzIiwicGFyYW1ldGVyVmFsdWVzUXVlcnlQYXJhbWV0ZXJzIiwiY3VzdG9tUXVlcnlQYXJhbWV0ZXJzIiwicmVuZGVyIiwicXVlcnlQYXJhbWV0ZXJTZWxlY3RvciIsImdldEN1cnJlbnRVUkwiLCJzZXBhcmF0b3IiLCJsYXVuY2hCdXR0b24iLCJyZXNldEJ1dHRvbiIsImhlYWRlciIsInN0cmluZyIsImhlYWQiLCJyZXBvRGl2IiwibW9kZURpdiIsInF1ZXJ5UGFyYW1ldGVyc0RpdiIsImJvZHkiLCJ1cGRhdGVRdWVyeVBhcmFtZXRlclZpc2liaWxpdHkiLCJ2aXNpYmlsaXR5IiwibGF5b3V0IiwibGVmdCIsImNsaWVudFdpZHRoIiwib25SZXBvc2l0b3J5Q2hhbmdlZCIsIm9uTW9kZUNoYW5nZWQiLCJvcGVuQ3VycmVudFVSTCIsIndoaWNoIiwibG9hZFBhY2thZ2VKU09OcyIsInJlcG9zIiwicGFja2FnZUpTT05zIiwiYWpheCIsIndoaXRlU3BsaXRBbmRTb3J0IiwicmF3RGF0YUxpc3QiLCJsaW5lIiwicmVwbGFjZSIsInNvcnQiLCJjYXRjaCIsImUiXSwic291cmNlcyI6WyJwaGV0bWFya3MudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTYtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogUGFnZSBmb3IgcXVpY2tseSBsYXVuY2hpbmcgcGhldC1yZWxhdGVkIHRhc2tzLCBzdWNoIGFzIHNpbXVsYXRpb25zLCBhdXRvbWF0ZWQvdW5pdCB0ZXN0cywgb3Igb3RoZXIgdXRpbGl0aWVzLlxyXG4gKlxyXG4gKiBEaXNwbGF5cyB0aHJlZSBjb2x1bW5zLiBTZWUgdHlwZSBpbmZvcm1hdGlvbiBiZWxvdyBmb3IgZGV0YWlsczpcclxuICpcclxuICogLSBSZXBvc2l0b3JpZXM6IEEgbGlzdCBvZiByZXBvc2l0b3JpZXMgdG8gc2VsZWN0IGZyb20sIGVhY2ggb25lIG9mIHdoaWNoIGhhcyBhIG51bWJlciBvZiBtb2Rlcy5cclxuICogLSBNb2RlczogQmFzZWQgb24gdGhlIHJlcG9zaXRvcnkgc2VsZWN0ZWQuIERlY2lkZXMgd2hhdCB0eXBlIG9mIFVSTCBpcyBsb2FkZWQgd2hlbiBcIkxhdW5jaFwiIG9yIHRoZSBlbnRlciBrZXkgaXNcclxuICogICAgICAgICAgcHJlc3NlZC5cclxuICogLSBRdWVyeSBQYXJhbWV0ZXJzOiBJZiBhdmFpbGFibGUsIGNvbnRyb2xzIHdoYXQgb3B0aW9uYWwgcXVlcnkgcGFyYW1ldGVycyB3aWxsIGJlIGFkZGVkIHRvIHRoZSBlbmQgb2YgdGhlIFVSTC5cclxuICogQGF1dGhvciBNaWNoYWVsIEthdXptYW5uIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbiggYXN5bmMgZnVuY3Rpb24oKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgdHlwZSBQYWNrYWdlSlNPTiA9IHtcclxuICAgIHZlcnNpb246IHN0cmluZztcclxuICAgIHBoZXQ6IHtcclxuICAgICAgJ3BoZXQtaW8nOiB7XHJcbiAgICAgICAgd3JhcHBlcnM6IHN0cmluZ1tdO1xyXG4gICAgICB9O1xyXG4gICAgfTtcclxuICB9O1xyXG4gIC8vIFF1ZXJ5UGFyYW1ldGVyIGhhcyB0aGUgZm9ybWF0XHJcbiAgdHlwZSBQaGV0bWFya3NRdWVyeVBhcmFtZXRlciA9IHtcclxuICAgIHZhbHVlOiBzdHJpbmc7IC8vIFRoZSBhY3R1YWwgcXVlcnkgcGFyYW1ldGVyIGluY2x1ZGVkIGluIHRoZSBVUkwsXHJcbiAgICB0ZXh0OiBzdHJpbmc7IC8vIERpc3BsYXkgc3RyaW5nIHNob3duIGluIHRoZSBxdWVyeSBwYXJhbWV0ZXIgbGlzdCxcclxuXHJcbiAgICAvLyBkZWZhdWx0cyB0byBmbGFnLCB3aXRoIGEgY2hlY2tib3ggdG8gYWRkIHRoZSBwYXJhbWV0ZXIuXHJcbiAgICAvLyBJZiBib29sZWFuLCB0aGVuIGl0IHdpbGwgbWFwIG92ZXIgdG8gYSBwYXJhbWV0ZXJWYWx1ZXMgd2l0aCB0cnVlL2ZhbHNlL3NpbSBkZWZhdWx0IHJhZGlvIGJ1dHRvbnNcclxuICAgIC8vIElmIHBhcmFtZXRlclZhbHVlcywgbXVzdCBwcm92aWRlIFwicGFyYW1ldGVyVmFsdWVzXCIga2V5LCB3aGVyZSBmaXJzdCBvbmUgaXMgdGhlIGRlZmF1bHQuXHJcbiAgICB0eXBlPzogJ2ZsYWcnIHwgJ2Jvb2xlYW4nIHwgJ3BhcmFtZXRlclZhbHVlcyc7XHJcblxyXG4gICAgLy8gKiBGb3IgdHlwZT1mbGFnOiBJZiB0cnVlLCB0aGUgcXVlcnkgcGFyYW1ldGVyIHdpbGwgYmUgaW5jbHVkZWQgYnkgZGVmYXVsdC4gVGhpcyB3aWxsIGJlIGZhbHNlIGlmIG5vdCBwcm92aWRlZC5cclxuICAgIC8vICogRm9yIHR5cGU9Ym9vbGVhbnxwYXJhbWV0ZXJWYWx1ZXM6IGRlZmF1bHQgc2hvdWxkIGJlIHRoZSBkZWZhdWx0VmFsdWUsIGFuZCBtdXN0IGJlIGluIHRoZSBwYXJhbWV0ZXIgdmFsdWVzIGFuZFxyXG4gICAgLy8gZGVmYXVsdHMgdG8gdGhlIGZpcnN0IGVsZW1lbnQgaW4gcGFyYW1ldGVyVmFsdWVzXHJcbiAgICBkZWZhdWx0PzogYm9vbGVhbiB8IHN0cmluZztcclxuXHJcbiAgICAvLyBGb3IgdHlwZT0nZmxhZycgb25seSBBIFwic3ViIHF1ZXJ5IHBhcmFtZXRlclwiIGxpc3QgdGhhdCBpcyBuZXN0ZWQgdW5kZXJuZWF0aCBhbm90aGVyLCBhbmQgaXMgb25seSBhdmFpbGFibGUgaWYgdGhlIHBhcmVudCBpcyBjaGVja2VkLlxyXG4gICAgZGVwZW5kZW50UXVlcnlQYXJhbWV0ZXJzPzogUGhldG1hcmtzUXVlcnlQYXJhbWV0ZXJbXTtcclxuXHJcbiAgICAvLyBNdXN0IGJlIHByb3ZpZGVkIGZvciB0eXBlICdwYXJhbWV0ZXJWYWx1ZXMnLCBpZiB0eXBlPSdib29sZWFuJywgdGhlbiB0aGlzIGlzIGZpbGxlZCBpbiBhcyBzaW0gZGVmYXVsdCwgdHJ1ZSwgYW5kIGZhbHNlLlxyXG4gICAgcGFyYW1ldGVyVmFsdWVzPzogc3RyaW5nW107IC8vIHZhbHVlcyBvZiB0aGUgcGFyYW1ldGVyLlxyXG4gICAgb21pdElmRGVmYXVsdD86IGJvb2xlYW47IC8vIGlmIHRydWUsIG9taXQgdGhlIGRlZmF1bHQgc2VsZWN0aW9uIG9mIHRoZSBxdWVyeSBwYXJhbWV0ZXIsIG9ubHkgYWRkaW5nIGl0IHdoZW4gY2hhbmdlZC4gRGVmYXVsdHMgdG8gZmFsc2VcclxuICB9O1xyXG5cclxuICBjb25zdCBkZW1vUmVwb3MgPSBbXHJcbiAgICAnYmFtYm9vJyxcclxuICAgICdncmlkZGxlJyxcclxuICAgICdzY2VuZXJ5LXBoZXQnLFxyXG4gICAgJ3N1bicsXHJcbiAgICAndGFtYm8nLFxyXG4gICAgJ3ZlZ2FzJ1xyXG4gIF07XHJcblxyXG4gIGNvbnN0IGRvY1JlcG9zID0gW1xyXG4gICAgJ3NjZW5lcnknLFxyXG4gICAgJ2tpdGUnLFxyXG4gICAgJ2RvdCcsXHJcbiAgICAncGhldC1pbycsXHJcbiAgICAnYmluZGVyJ1xyXG4gIF07XHJcblxyXG4gIHR5cGUgUmVwb05hbWUgPSBzdHJpbmc7IC8vIHRoZSBuYW1lIG9mIGEgcmVwbztcclxuXHJcbiAgLy8gVXNlIHRoaXMgYXMgYSBwYXJhbWV0ZXIgdmFsdWUgdG8gb21pdCB0aGUgcXVlcnkgcGFyYW1ldGVyIHNlbGVjdGlvbiAoZXZlbiBpZiBub3QgdGhlIGRlZmF1bHQgc2VsZWN0aW9uKVxyXG4gIGNvbnN0IE5PX1ZBTFVFID0gJ05vIFZhbHVlJztcclxuXHJcbiAgdHlwZSBNaWdyYXRpb25EYXRhID0ge1xyXG4gICAgc2ltOiBzdHJpbmc7XHJcbiAgICB2ZXJzaW9uOiBzdHJpbmc7XHJcbiAgfTtcclxuXHJcbiAgLy8gXCJHZW5lcmFsXCIgaXMgdGhlIGRlZmF1bHRcclxuICB0eXBlIE1vZGVHcm91cCA9ICdQaEVULWlPJyB8ICdHZW5lcmFsJztcclxuXHJcbiAgLy8gTW9kZSBoYXMgdGhlIGZvcm1hdFxyXG4gIHR5cGUgTW9kZSA9IHtcclxuICAgIG5hbWU6IHN0cmluZzsgLy8gSW50ZXJuYWwgdW5pcXVlIHZhbHVlIChmb3IgbG9va2luZyB1cCB3aGljaCBvcHRpb24gd2FzIGNob3NlbiksXHJcbiAgICB0ZXh0OiBzdHJpbmc7IC8vIFNob3duIGluIHRoZSBtb2RlIGxpc3RcclxuICAgIGdyb3VwPzogTW9kZUdyb3VwOyAvLyBUaGUgb3B0Z3JvdXAgdGhhdCB0aGlzIG1vZGUgYmVsb25ncyB0bywgZGVmYXVsdHMgdG8gXCJHZW5lcmFsXCJcclxuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7IC8vIFNob3duIHdoZW4gaG92ZXJpbmcgb3ZlciB0aGUgbW9kZSBpbiB0aGUgbGlzdCxcclxuICAgIHVybDogc3RyaW5nOyAvLyBUaGUgYmFzZSBVUkwgdG8gdmlzaXQgKHdpdGhvdXQgYWRkZWQgcXVlcnkgcGFyYW1ldGVycykgd2hlbiB0aGUgbW9kZSBpcyBjaG9zZW4sXHJcbiAgICBxdWVyeVBhcmFtZXRlcnM/OiBQaGV0bWFya3NRdWVyeVBhcmFtZXRlcltdO1xyXG4gIH07XHJcbiAgdHlwZSBNb2RlRGF0YSA9IFJlY29yZDxSZXBvTmFtZSwgTW9kZVtdPjtcclxuICB0eXBlIFJlcG9TZWxlY3RvciA9IHtcclxuICAgIGVsZW1lbnQ6IEhUTUxTZWxlY3RFbGVtZW50O1xyXG4gICAgZ2V0IHZhbHVlKCk6IHN0cmluZztcclxuICB9O1xyXG5cclxuICB0eXBlIE1vZGVTZWxlY3RvciA9IHtcclxuICAgIGVsZW1lbnQ6IEhUTUxTZWxlY3RFbGVtZW50O1xyXG4gICAgdmFsdWU6IHN0cmluZztcclxuICAgIG1vZGU6IE1vZGU7XHJcbiAgICB1cGRhdGU6ICgpID0+IHZvaWQ7XHJcbiAgfTtcclxuXHJcbiAgdHlwZSBRdWVyeVBhcmFtZXRlclNlbGVjdG9yID0ge1xyXG4gICAgZWxlbWVudDogSFRNTEVsZW1lbnQ7XHJcbiAgICB2YWx1ZTogc3RyaW5nOyAvLyBUaGUgc2luZ2xlIHF1ZXJ5U3RyaW5nLCBsaWtlIGBzY3JlZW5zPTFgLCBvciAnJyBpZiBub3RoaW5nIHNob3VsZCBiZSBhZGRlZCB0byB0aGUgcXVlcnkgc3RyaW5nLlxyXG4gIH07XHJcblxyXG4gIHR5cGUgUXVlcnlQYXJhbWV0ZXJzU2VsZWN0b3IgPSB7XHJcbiAgICB0b2dnbGVFbGVtZW50OiBIVE1MRWxlbWVudDtcclxuICAgIGN1c3RvbUVsZW1lbnQ6IEhUTUxFbGVtZW50O1xyXG5cclxuICAgIC8vIEdldCB0aGUgY3VycmVudCBxdWVyeVN0cmluZyB2YWx1ZSBiYXNlZCBvbiB0aGUgY3VycmVudCBzZWxlY3Rpb24uXHJcbiAgICB2YWx1ZTogc3RyaW5nO1xyXG4gICAgdXBkYXRlOiAoKSA9PiB2b2lkO1xyXG4gIH07XHJcblxyXG4gIHR5cGUgRWxlbWVudFRvUGFyYW1ldGVyTWFwID0gTWFwPEhUTUxFbGVtZW50LCBQaGV0bWFya3NRdWVyeVBhcmFtZXRlcj47XHJcblxyXG4gIC8vIFF1ZXJ5IHBhcmFtZXRlcnMgdGhhdCBhcHBlYXIgaW4gbXVsdGlwbGUgYXJyYXlzLlxyXG4gIGNvbnN0IGF1ZGlvUXVlcnlQYXJhbWV0ZXI6IFBoZXRtYXJrc1F1ZXJ5UGFyYW1ldGVyID0ge1xyXG4gICAgdmFsdWU6ICdhdWRpbycsXHJcbiAgICB0ZXh0OiAnQXVkaW8gc3VwcG9ydCcsXHJcbiAgICB0eXBlOiAncGFyYW1ldGVyVmFsdWVzJyxcclxuICAgIHBhcmFtZXRlclZhbHVlczogWyAnZW5hYmxlZCcsICdkaXNhYmxlZCcsICdtdXRlZCcgXSxcclxuICAgIG9taXRJZkRlZmF1bHQ6IHRydWVcclxuICB9O1xyXG4gIGNvbnN0IGVhUXVlcnlQYXJhbWV0ZXI6IFBoZXRtYXJrc1F1ZXJ5UGFyYW1ldGVyID0ge1xyXG4gICAgdmFsdWU6ICdlYScsXHJcbiAgICB0ZXh0OiAnQXNzZXJ0aW9ucycsXHJcbiAgICBkZWZhdWx0OiB0cnVlXHJcbiAgfTtcclxuICBjb25zdCBsb2NhbGVzUXVlcnlQYXJhbWV0ZXI6IFBoZXRtYXJrc1F1ZXJ5UGFyYW1ldGVyID0ge1xyXG4gICAgdmFsdWU6ICdsb2NhbGVzPSonLFxyXG4gICAgdGV4dDogJ0xvYWQgYWxsIGxvY2FsZXMnLFxyXG4gICAgZGVwZW5kZW50UXVlcnlQYXJhbWV0ZXJzOiBbXHJcbiAgICAgIHsgdmFsdWU6ICdrZXlib2FyZExvY2FsZVN3aXRjaGVyJywgdGV4dDogJ2N0cmwgKyB1L2kgdG8gY3ljbGUgbG9jYWxlcycgfVxyXG4gICAgXVxyXG4gIH07XHJcbiAgY29uc3QgcGhldGlvRGVidWdQYXJhbWV0ZXI6IFBoZXRtYXJrc1F1ZXJ5UGFyYW1ldGVyID0ge1xyXG4gICAgdmFsdWU6ICdwaGV0aW9EZWJ1ZycsXHJcbiAgICB0ZXh0OiAnRW5hYmxlIHNpbSBhc3NlcnRpb25zIGZyb20gd3JhcHBlcicsXHJcbiAgICB0eXBlOiAnYm9vbGVhbidcclxuICB9O1xyXG4gIGNvbnN0IHBoZXRpb0RlYnVnVHJ1ZVBhcmFtZXRlcjogUGhldG1hcmtzUXVlcnlQYXJhbWV0ZXIgPSBfLmFzc2lnbigge1xyXG4gICAgZGVmYXVsdDogdHJ1ZVxyXG4gIH0sIHBoZXRpb0RlYnVnUGFyYW1ldGVyICk7XHJcbiAgY29uc3QgcGhldGlvRWxlbWVudHNEaXNwbGF5UGFyYW1ldGVyOiBQaGV0bWFya3NRdWVyeVBhcmFtZXRlciA9IHtcclxuICAgIHZhbHVlOiAncGhldGlvRWxlbWVudHNEaXNwbGF5JyxcclxuICAgIHRleHQ6ICdXaGF0IFBoRVQtaU8gRWxlbWVudHMgdG8gc2hvdycsXHJcbiAgICB0eXBlOiAncGFyYW1ldGVyVmFsdWVzJyxcclxuICAgIHBhcmFtZXRlclZhbHVlczogWyAnYWxsJywgJ2ZlYXR1cmVkJyBdXHJcbiAgfTtcclxuICBjb25zdCBwaGV0aW9QcmludEFQSVByb2JsZW1zUXVlcnlQYXJhbWV0ZXI6IFBoZXRtYXJrc1F1ZXJ5UGFyYW1ldGVyID0ge1xyXG4gICAgdmFsdWU6ICdwaGV0aW9QcmludEFQSVByb2JsZW1zJyxcclxuICAgIHRleHQ6ICdQcmludCBhbGwgQVBJIHByb2JsZW1zIGF0IG9uY2UnXHJcbiAgfTtcclxuICBjb25zdCBwaGV0aW9QcmludE1pc3NpbmdUYW5kZW1zUXVlcnlQYXJhbWV0ZXI6IFBoZXRtYXJrc1F1ZXJ5UGFyYW1ldGVyID0ge1xyXG4gICAgdmFsdWU6ICdwaGV0aW9QcmludE1pc3NpbmdUYW5kZW1zJyxcclxuICAgIHRleHQ6ICdQcmludCB1bmluc3RydW1lbnRlZCB0YW5kZW1zJ1xyXG4gIH07XHJcbiAgY29uc3Qgc2NyZWVuc1F1ZXJ5UGFyYW1ldGVyOiBQaGV0bWFya3NRdWVyeVBhcmFtZXRlciA9IHtcclxuICAgIHZhbHVlOiAnc2NyZWVucycsXHJcbiAgICB0ZXh0OiAnU2ltIFNjcmVlbicsXHJcbiAgICB0eXBlOiAncGFyYW1ldGVyVmFsdWVzJyxcclxuICAgIHBhcmFtZXRlclZhbHVlczogWyAnYWxsJywgJzEnLCAnMicsICczJywgJzQnLCAnNScsICc2JyBdLFxyXG4gICAgb21pdElmRGVmYXVsdDogdHJ1ZVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGRlbW9zUXVlcnlQYXJhbWV0ZXJzOiBQaGV0bWFya3NRdWVyeVBhcmFtZXRlcltdID0gWyB7XHJcbiAgICB2YWx1ZTogJ2NvbXBvbmVudD1Tb21ldGhpbmcnLFxyXG4gICAgdGV4dDogJ0NvbXBvbmVudCBzZWxlY3Rpb24nXHJcbiAgfSBdO1xyXG5cclxuICAvLyBRdWVyeSBwYXJhbWV0ZXJzIHVzZWQgZm9yIHRoZSBmb2xsb3dpbmcgbW9kZXM6IHVuYnVpbHQsIGNvbXBpbGVkLCBwcm9kdWN0aW9uXHJcbiAgY29uc3Qgc2ltTm9Mb2NhbGVzUXVlcnlQYXJhbWV0ZXJzOiBQaGV0bWFya3NRdWVyeVBhcmFtZXRlcltdID0gW1xyXG4gICAgYXVkaW9RdWVyeVBhcmFtZXRlciwge1xyXG4gICAgICB2YWx1ZTogJ2Z1enonLCB0ZXh0OiAnRnV6eicsIGRlcGVuZGVudFF1ZXJ5UGFyYW1ldGVyczogW1xyXG4gICAgICAgIHsgdmFsdWU6ICdmdXp6UG9pbnRlcnM9MicsIHRleHQ6ICdNdWx0aXRvdWNoLWZ1enonIH1cclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIHsgdmFsdWU6ICdmdXp6Qm9hcmQnLCB0ZXh0OiAnS2V5Ym9hcmQgRnV6eicgfSxcclxuICAgIHsgdmFsdWU6ICdkZWJ1Z2dlcicsIHRleHQ6ICdEZWJ1Z2dlcicsIGRlZmF1bHQ6IHRydWUgfSxcclxuICAgIHsgdmFsdWU6ICdkZXByZWNhdGlvbldhcm5pbmdzJywgdGV4dDogJ0RlcHJlY2F0aW9uIFdhcm5pbmdzJyB9LFxyXG4gICAgeyB2YWx1ZTogJ2RldicsIHRleHQ6ICdEZXYnIH0sXHJcbiAgICB7IHZhbHVlOiAncHJvZmlsZXInLCB0ZXh0OiAnUHJvZmlsZXInIH0sXHJcbiAgICB7IHZhbHVlOiAnc2hvd1BvaW50ZXJzJywgdGV4dDogJ1BvaW50ZXJzJyB9LFxyXG4gICAgeyB2YWx1ZTogJ3Nob3dQb2ludGVyQXJlYXMnLCB0ZXh0OiAnUG9pbnRlciBBcmVhcycgfSxcclxuICAgIHsgdmFsdWU6ICdzaG93Rml0dGVkQmxvY2tCb3VuZHMnLCB0ZXh0OiAnRml0dGVkIEJsb2NrIEJvdW5kcycgfSxcclxuICAgIHsgdmFsdWU6ICdzaG93Q2FudmFzTm9kZUJvdW5kcycsIHRleHQ6ICdDYW52YXNOb2RlIEJvdW5kcycgfSxcclxuICAgIHsgdmFsdWU6ICdzdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb24nLCB0ZXh0OiAnU3VwcG9ydHMgSW50ZXJhY3RpdmUgRGVzY3JpcHRpb24nLCB0eXBlOiAnYm9vbGVhbicgfSxcclxuICAgIHsgdmFsdWU6ICdzdXBwb3J0c1NvdW5kJywgdGV4dDogJ1N1cHBvcnRzIFNvdW5kJywgdHlwZTogJ2Jvb2xlYW4nIH0sXHJcbiAgICB7IHZhbHVlOiAnc3VwcG9ydHNFeHRyYVNvdW5kJywgdGV4dDogJ1N1cHBvcnRzIEV4dHJhIFNvdW5kJywgdHlwZTogJ2Jvb2xlYW4nIH0sXHJcbiAgICB7IHZhbHVlOiAnZXh0cmFTb3VuZEluaXRpYWxseUVuYWJsZWQnLCB0ZXh0OiAnRXh0cmEgU291bmQgb24gYnkgZGVmYXVsdCcgfSxcclxuICAgIHsgdmFsdWU6ICdzdXBwb3J0c1BhbkFuZFpvb20nLCB0ZXh0OiAnU3VwcG9ydHMgUGFuIGFuZCBab29tJywgdHlwZTogJ2Jvb2xlYW4nIH0sXHJcbiAgICB7IHZhbHVlOiAnc3VwcG9ydHNWb2ljaW5nJywgdGV4dDogJ1N1cHBvcnRzIFZvaWNpbmcnLCB0eXBlOiAnYm9vbGVhbicgfSxcclxuICAgIHsgdmFsdWU6ICd2b2ljaW5nSW5pdGlhbGx5RW5hYmxlZCcsIHRleHQ6ICdWb2ljaW5nIG9uIGJ5IGRlZmF1bHQnIH0sXHJcbiAgICB7IHZhbHVlOiAncHJpbnRWb2ljaW5nUmVzcG9uc2VzJywgdGV4dDogJ2NvbnNvbGUubG9nKCkgdm9pY2luZyByZXNwb25zZXMnIH0sXHJcbiAgICB7IHZhbHVlOiAnaW50ZXJhY3RpdmVIaWdobGlnaHRzSW5pdGlhbGx5RW5hYmxlZCcsIHRleHQ6ICdJbnRlcmFjdGl2ZSBIaWdobGlnaHRzIG9uIGJ5IGRlZmF1bHQnIH0sXHJcbiAgICB7IHZhbHVlOiAncHJlZmVyZW5jZXNTdG9yYWdlJywgdGV4dDogJ0xvYWQgUHJlZmVyZW5jZXMgZnJvbSBsb2NhbFN0b3JhZ2UuJyB9LFxyXG4gICAgeyB2YWx1ZTogJ3dlYmdsJywgdGV4dDogJ1dlYkdMJywgdHlwZTogJ2Jvb2xlYW4nIH0sXHJcbiAgICB7IHZhbHVlOiAnZGlzYWJsZU1vZGFscycsIHRleHQ6ICdEaXNhYmxlIE1vZGFscycgfSxcclxuICAgIHtcclxuICAgICAgdmFsdWU6ICdyZWdpb25BbmRDdWx0dXJlJyxcclxuICAgICAgdGV4dDogJ0luaXRpYWwgUmVnaW9uIGFuZCBDdWx0dXJlJyxcclxuICAgICAgdHlwZTogJ3BhcmFtZXRlclZhbHVlcycsXHJcbiAgICAgIG9taXRJZkRlZmF1bHQ6IHRydWUsXHJcbiAgICAgIHBhcmFtZXRlclZhbHVlczogW1xyXG4gICAgICAgICdkZWZhdWx0JyxcclxuICAgICAgICAndXNhJyxcclxuICAgICAgICAnYWZyaWNhJyxcclxuICAgICAgICAnYWZyaWNhTW9kZXN0JyxcclxuICAgICAgICAnYXNpYScsXHJcbiAgICAgICAgJ2xhdGluQW1lcmljYScsXHJcbiAgICAgICAgJ29jZWFuaWEnLFxyXG4gICAgICAgICdtdWx0aSdcclxuICAgICAgXVxyXG4gICAgfSwge1xyXG4gICAgICB2YWx1ZTogJ2xpc3RlbmVyT3JkZXInLFxyXG4gICAgICB0ZXh0OiAnQWx0ZXIgbGlzdGVuZXIgb3JkZXInLFxyXG4gICAgICB0eXBlOiAncGFyYW1ldGVyVmFsdWVzJyxcclxuICAgICAgb21pdElmRGVmYXVsdDogdHJ1ZSxcclxuICAgICAgcGFyYW1ldGVyVmFsdWVzOiBbXHJcbiAgICAgICAgJ2RlZmF1bHQnLFxyXG4gICAgICAgICdyZXZlcnNlJyxcclxuICAgICAgICAncmFuZG9tJyxcclxuICAgICAgICAncmFuZG9tKDQyKScgLy8gdmVyeSByYW5kb20sIGRvIG5vdCBjaGFuZ2VcclxuICAgICAgXVxyXG4gICAgfSwge1xyXG4gICAgICB2YWx1ZTogJ3N0cmljdEF4b25EZXBlbmRlbmNpZXMnLFxyXG4gICAgICB0ZXh0OiAnU3RyaWN0IEF4b24gRGVwZW5kZW5jaWVzJyxcclxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXHJcbiAgICB9XHJcbiAgXTtcclxuXHJcbiAgLy8gVGhpcyB3ZWlyZG5lc3MgaXMgdG8ga2VlcCB0aGUgb3JkZXIgdGhlIHNhbWUgKHNjcmVlbnMgbGFzdCksIHdoaWxlIGFsbG93aW5nIHBoZXQtaW8gdG8gY2hhbmdlIHRoZSBkZWZhdWx0IG9mIGxvY2FsZXM9KjtcclxuICBjb25zdCBzaW1RdWVyeVBhcmFtZXRlcnMgPSBzaW1Ob0xvY2FsZXNRdWVyeVBhcmFtZXRlcnMuY29uY2F0KCBbIGxvY2FsZXNRdWVyeVBhcmFtZXRlciBdICk7XHJcbiAgc2ltUXVlcnlQYXJhbWV0ZXJzLnB1c2goIHNjcmVlbnNRdWVyeVBhcmFtZXRlciApO1xyXG4gIHNpbU5vTG9jYWxlc1F1ZXJ5UGFyYW1ldGVycy5wdXNoKCBzY3JlZW5zUXVlcnlQYXJhbWV0ZXIgKTtcclxuXHJcbiAgY29uc3QgcGhldEJyYW5kUXVlcnlQYXJhbWV0ZXIgPSB7IHZhbHVlOiAnYnJhbmQ9cGhldCcsIHRleHQ6ICdQaEVUIEJyYW5kJywgZGVmYXVsdDogdHJ1ZSB9O1xyXG5cclxuICAvLyBRdWVyeSBwYXJhbWV0ZXJzIHVzZWQgZm9yIHVuYnVpbHQgYW5kIFBoRVQtaU8gd3JhcHBlcnNcclxuICBjb25zdCBkZXZTaW1RdWVyeVBhcmFtZXRlcnM6IFBoZXRtYXJrc1F1ZXJ5UGFyYW1ldGVyW10gPSBbXHJcbiAgICBwaGV0QnJhbmRRdWVyeVBhcmFtZXRlcixcclxuICAgIGVhUXVlcnlQYXJhbWV0ZXIsXHJcbiAgICB7IHZhbHVlOiAnZWFsbCcsIHRleHQ6ICdBbGwgQXNzZXJ0aW9ucycgfVxyXG4gIF07XHJcblxyXG4gIGNvbnN0IHBoZXRpb0Jhc2VQYXJhbWV0ZXJzOiBQaGV0bWFya3NRdWVyeVBhcmFtZXRlcltdID0gW1xyXG4gICAgYXVkaW9RdWVyeVBhcmFtZXRlciwge1xyXG4gICAgICB2YWx1ZTogJ3BoZXRpb0VtaXRIaWdoRnJlcXVlbmN5RXZlbnRzJyxcclxuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICB0ZXh0OiAnRW1pdCBldmVudHMgdGhhdCBvY2N1ciBvZnRlbidcclxuICAgIH0sIHtcclxuICAgICAgdmFsdWU6ICdwaGV0aW9FbWl0U3RhdGVzJyxcclxuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICB0ZXh0OiAnRW1pdCBzdGF0ZSBldmVudHMnXHJcbiAgICB9LCB7XHJcbiAgICAgIHZhbHVlOiAncGhldGlvQ29tcGFyZUFQSSZyYW5kb21TZWVkPTMzMjIxMScsIC8vIE5PVEU6IERVUExJQ0FUSU9OIEFMRVJUOiByYW5kb20gc2VlZCBtdXN0IG1hdGNoIHRoYXQgb2YgQVBJIGdlbmVyYXRpb24sIHNlZSBnZW5lcmF0ZVBoZXRpb01hY3JvQVBJLmpzXHJcbiAgICAgIHRleHQ6ICdDb21wYXJlIHdpdGggcmVmZXJlbmNlIEFQSSdcclxuICAgIH0sXHJcbiAgICBwaGV0aW9QcmludE1pc3NpbmdUYW5kZW1zUXVlcnlQYXJhbWV0ZXIsXHJcbiAgICBwaGV0aW9QcmludEFQSVByb2JsZW1zUXVlcnlQYXJhbWV0ZXIsXHJcbiAgICBfLmV4dGVuZCggeyBkZWZhdWx0OiB0cnVlIH0sIGxvY2FsZXNRdWVyeVBhcmFtZXRlciApLCB7XHJcbiAgICAgIHZhbHVlOiAncGhldGlvVmFsaWRhdGlvbicsXHJcbiAgICAgIHRleHQ6ICdTdHJpY3RlciwgUGhFVC1pTy1zcGVjaWZpYyB2YWxpZGF0aW9uJyxcclxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXHJcbiAgICB9XHJcbiAgXTtcclxuXHJcbiAgLy8gU2VlIGFxdWEvZnV6ei1saWdodHllYXIgZm9yIGRldGFpbHNcclxuICBjb25zdCBnZXRGdXp6TGlnaHR5ZWFyUGFyYW1ldGVycyA9ICggZHVyYXRpb24gPSAxMDAwMCwgdGVzdFRhc2sgPSB0cnVlLCBtb3JlRnV6emVycyA9IHRydWUgKTogUGhldG1hcmtzUXVlcnlQYXJhbWV0ZXJbXSA9PiB7XHJcbiAgICByZXR1cm4gW1xyXG4gICAgICB7IHZhbHVlOiAnZWEmYXVkaW89ZGlzYWJsZWQnLCB0ZXh0OiAnZ2VuZXJhbCBzaW0gcGFyYW1zIHRvIGluY2x1ZGUnLCBkZWZhdWx0OiB0cnVlIH0sXHJcbiAgICAgIHsgdmFsdWU6ICdyYW5kb21pemUnLCB0ZXh0OiAnUmFuZG9taXplJyB9LFxyXG4gICAgICB7IHZhbHVlOiAncmV2ZXJzZScsIHRleHQ6ICdSZXZlcnNlJyB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgdmFsdWU6ICdsb2FkVGltZW91dD0zMDAwMCcsXHJcbiAgICAgICAgdGV4dDogJ3RpbWUgc2ltIGhhcyB0byBsb2FkJyxcclxuICAgICAgICBkZWZhdWx0OiB0cnVlXHJcbiAgICAgIH0sIHtcclxuICAgICAgICB2YWx1ZTogYHRlc3REdXJhdGlvbj0ke2R1cmF0aW9ufWAsXHJcbiAgICAgICAgdGV4dDogJ2Z1enogdGltZSBhZnRlciBsb2FkJyxcclxuICAgICAgICBkZWZhdWx0OiB0cnVlXHJcbiAgICAgIH0sIHtcclxuICAgICAgICB2YWx1ZTogJ2Z1enplcnM9MicsXHJcbiAgICAgICAgdGV4dDogJ01vcmUgZnV6emVycycsXHJcbiAgICAgICAgZGVmYXVsdDogbW9yZUZ1enplcnNcclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIHZhbHVlOiAnd3JhcHBlck5hbWUnLFxyXG4gICAgICAgIHRleHQ6ICdQaEVULWlPIFdyYXBwZXInLFxyXG4gICAgICAgIHR5cGU6ICdwYXJhbWV0ZXJWYWx1ZXMnLFxyXG4gICAgICAgIG9taXRJZkRlZmF1bHQ6IHRydWUsXHJcbiAgICAgICAgcGFyYW1ldGVyVmFsdWVzOiBbXHJcbiAgICAgICAgICAnZGVmYXVsdCcsXHJcbiAgICAgICAgICAnc3R1ZGlvJyxcclxuICAgICAgICAgICdzdGF0ZSdcclxuICAgICAgICBdXHJcbiAgICAgIH0sIHtcclxuICAgICAgICB2YWx1ZTogYHRlc3RUYXNrPSR7dGVzdFRhc2t9YCxcclxuICAgICAgICB0ZXh0OiAndGVzdCBmdXp6aW5nIGFmdGVyIGxvYWRpbmcsIHNldCB0byBmYWxzZSB0byBqdXN0IHRlc3QgbG9hZGluZycsXHJcbiAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICB9XHJcbiAgICBdO1xyXG4gIH07XHJcblxyXG4gIC8vIFNlZSBwZXJlbm5pYWwtYWxpYXMvZGF0YS93cmFwcGVycyBmb3IgZm9ybWF0XHJcbiAgY29uc3Qgbm9uUHVibGlzaGVkUGhldGlvV3JhcHBlcnNUb0FkZFRvUGhldG1hcmtzID0gWyAncGhldC1pby13cmFwcGVycy9taXJyb3ItaW5wdXRzJyBdO1xyXG5cclxuICAvLyBRdWVyeSBwYXJhbWV0ZXJzIGZvciB0aGUgUGhFVC1pTyB3cmFwcGVycyAoaW5jbHVkaW5nIGlmcmFtZSB0ZXN0cylcclxuICBjb25zdCBwaGV0aW9XcmFwcGVyUXVlcnlQYXJhbWV0ZXJzOiBQaGV0bWFya3NRdWVyeVBhcmFtZXRlcltdID0gcGhldGlvQmFzZVBhcmFtZXRlcnMuY29uY2F0KCBbIHBoZXRpb0RlYnVnVHJ1ZVBhcmFtZXRlciwge1xyXG4gICAgdmFsdWU6ICdwaGV0aW9XcmFwcGVyRGVidWcnLFxyXG4gICAgdGV4dDogJ0VuYWJsZSB3cmFwcGVyLXNpZGUgYXNzZXJ0aW9ucycsXHJcbiAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICBkZWZhdWx0OiB0cnVlXHJcbiAgfSBdICk7XHJcblxyXG4gIC8vIEZvciBwaGV0aW8gc2ltIGZyYW1lIGxpbmtzXHJcbiAgY29uc3QgcGhldGlvU2ltUXVlcnlQYXJhbWV0ZXJzOiBQaGV0bWFya3NRdWVyeVBhcmFtZXRlcltdID0gcGhldGlvQmFzZVBhcmFtZXRlcnMuY29uY2F0KCBbXHJcbiAgICBlYVF1ZXJ5UGFyYW1ldGVyLCAvLyB0aGlzIG5lZWRzIHRvIGJlIGZpcnN0IGluIHRoaXMgbGlzdFxyXG4gICAgeyB2YWx1ZTogJ2JyYW5kPXBoZXQtaW8mcGhldGlvU3RhbmRhbG9uZSZwaGV0aW9Db25zb2xlTG9nPWNvbG9yaXplZCcsIHRleHQ6ICdGb3JtYXR0ZWQgUGhFVC1JTyBDb25zb2xlIE91dHB1dCcgfSxcclxuICAgIHBoZXRpb1ByaW50TWlzc2luZ1RhbmRlbXNRdWVyeVBhcmFtZXRlcixcclxuICAgIHBoZXRpb1ByaW50QVBJUHJvYmxlbXNRdWVyeVBhcmFtZXRlciwge1xyXG4gICAgICB2YWx1ZTogJ3BoZXRpb1ByaW50QVBJJyxcclxuICAgICAgdGV4dDogJ1ByaW50IHRoZSBBUEkgdG8gdGhlIGNvbnNvbGUnXHJcbiAgICB9XHJcbiAgXSApO1xyXG5cclxuICBjb25zdCBtaWdyYXRpb25RdWVyeVBhcmFtZXRlcnM6IFBoZXRtYXJrc1F1ZXJ5UGFyYW1ldGVyW10gPSBbIC4uLnBoZXRpb1dyYXBwZXJRdWVyeVBhcmFtZXRlcnMsIHBoZXRpb0VsZW1lbnRzRGlzcGxheVBhcmFtZXRlciBdO1xyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgbG9jYWwtc3RvcmFnZSBrZXkgdGhhdCBoYXMgYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBpbmNsdWRlZCwgdG8gcHJldmVudCBjb2xsaXNpb24gd2l0aCBvdGhlciBhcHBsaWNhdGlvbnMgKG9yIGluIHRoZSBmdXR1cmUsIHByZXZpb3VzXHJcbiAgICogdmVyc2lvbnMgb2YgcGhldG1hcmtzKS5cclxuICAgKi9cclxuICBmdW5jdGlvbiBzdG9yYWdlS2V5KCBrZXk6IHN0cmluZyApOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGBwaGV0bWFya3MtJHtrZXl9YDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZyb20gdGhlIHdyYXBwZXIgcGF0aCBpbiBwZXJlbm5pYWwtYWxpYXMvZGF0YS93cmFwcGVycywgZ2V0IHRoZSBuYW1lIG9mIHRoZSB3cmFwcGVyLlxyXG4gICAqL1xyXG4gIGNvbnN0IGdldFdyYXBwZXJOYW1lID0gZnVuY3Rpb24oIHdyYXBwZXI6IHN0cmluZyApOiBzdHJpbmcge1xyXG5cclxuICAgIC8vIElmIHRoZSB3cmFwcGVyIGhhcyBpdHMgb3duIGluZGl2aWR1YWwgcmVwbywgdGhlbiBnZXQgdGhlIG5hbWUgJ2NsYXNzcm9vbS1hY3Rpdml0eScgZnJvbSAncGhldC1pby13cmFwcGVyLWNsYXNzcm9vbS1hY3Rpdml0eSdcclxuICAgIC8vIE1haW50YWluIGNvbXBhdGliaWxpdHkgZm9yIHdyYXBwZXJzIGluICdwaGV0LWlvLXdyYXBwZXJzLSdcclxuICAgIGNvbnN0IHdyYXBwZXJQYXJ0cyA9IHdyYXBwZXIuc3BsaXQoICdwaGV0LWlvLXdyYXBwZXItJyApO1xyXG4gICAgY29uc3Qgd3JhcHBlck5hbWUgPSB3cmFwcGVyUGFydHMubGVuZ3RoID4gMSA/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdyYXBwZXJQYXJ0c1sgMSBdIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgd3JhcHBlci5zdGFydHNXaXRoKCAncGhldC1pby1zaW0tc3BlY2lmaWMnICkgPyB3cmFwcGVyLnNwbGl0KCAnLycgKVsgd3JhcHBlci5zcGxpdCggJy8nICkubGVuZ3RoIC0gMSBdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogd3JhcHBlcjtcclxuXHJcbiAgICAvLyBJZiB0aGUgd3JhcHBlciBzdGlsbCBoYXMgc2xhc2hlcyBpbiBpdCwgdGhlbiBpdCBsb29rcyBsaWtlICdwaGV0LWlvLXdyYXBwZXJzL2FjdGl2ZSdcclxuICAgIGNvbnN0IHNwbGl0T25TbGFzaCA9IHdyYXBwZXJOYW1lLnNwbGl0KCAnLycgKTtcclxuICAgIHJldHVybiBzcGxpdE9uU2xhc2hbIHNwbGl0T25TbGFzaC5sZW5ndGggLSAxIF07XHJcbiAgfTtcclxuXHJcbiAgLy8gVHJhY2sgd2hldGhlciAnc2hpZnQnIGtleSBpcyBwcmVzc2VkLCBzbyB0aGF0IHdlIGNhbiBjaGFuZ2UgaG93IHdpbmRvd3MgYXJlIG9wZW5lZC4gIElmIHNoaWZ0IGlzIHByZXNzZWQsIHRoZVxyXG4gIC8vIHBhZ2UgaXMgbGF1bmNoZWQgaW4gYSBzZXBhcmF0ZSB0YWIuXHJcbiAgbGV0IHNoaWZ0UHJlc3NlZCA9IGZhbHNlO1xyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAna2V5ZG93bicsIGV2ZW50ID0+IHtcclxuICAgIHNoaWZ0UHJlc3NlZCA9IGV2ZW50LnNoaWZ0S2V5O1xyXG4gIH0gKTtcclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ2tleXVwJywgZXZlbnQgPT4ge1xyXG4gICAgc2hpZnRQcmVzc2VkID0gZXZlbnQuc2hpZnRLZXk7XHJcbiAgfSApO1xyXG5cclxuICBmdW5jdGlvbiBvcGVuVVJMKCB1cmw6IHN0cmluZyApOiB2b2lkIHtcclxuICAgIGlmICggc2hpZnRQcmVzc2VkICkge1xyXG4gICAgICB3aW5kb3cub3BlbiggdXJsLCAnX2JsYW5rJyApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcblxyXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIC0gdGhlIGJyb3dzZXIgc3VwcG9ydHMgc2V0dGluZyB0byBhIHN0cmluZy5cclxuICAgICAgd2luZG93LmxvY2F0aW9uID0gdXJsO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmlsbHMgb3V0IHRoZSBtb2RlRGF0YSBtYXAgd2l0aCBpbmZvcm1hdGlvbiBhYm91dCByZXBvc2l0b3JpZXMsIG1vZGVzIGFuZCBxdWVyeSBwYXJhbWV0ZXJzLiBQYXJhbWV0ZXJzIGFyZSBsYXJnZWx5XHJcbiAgICogcmVwbyBsaXN0cyBmcm9tIHBlcmVubmlhbC1hbGlhcy9kYXRhIGZpbGVzLlxyXG4gICAqXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gcG9wdWxhdGUoIGFjdGl2ZVJ1bm5hYmxlczogUmVwb05hbWVbXSwgYWN0aXZlUmVwb3M6IFJlcG9OYW1lW10sIHBoZXRpb1NpbXM6IFJlcG9OYW1lW10sXHJcbiAgICAgICAgICAgICAgICAgICAgIGludGVyYWN0aXZlRGVzY3JpcHRpb25TaW1zOiBSZXBvTmFtZVtdLCB3cmFwcGVyczogc3RyaW5nW10sXHJcbiAgICAgICAgICAgICAgICAgICAgIHVuaXRUZXN0c1JlcG9zOiBSZXBvTmFtZVtdLCBwaGV0aW9IeWRyb2dlblNpbXM6IE1pZ3JhdGlvbkRhdGFbXSwgcGhldGlvUGFja2FnZUpTT05zOiBSZWNvcmQ8UmVwb05hbWUsIFBhY2thZ2VKU09OPiApOiBNb2RlRGF0YSB7XHJcbiAgICBjb25zdCBtb2RlRGF0YTogTW9kZURhdGEgPSB7fTtcclxuXHJcbiAgICBhY3RpdmVSZXBvcy5mb3JFYWNoKCAoIHJlcG86IFJlcG9OYW1lICkgPT4ge1xyXG4gICAgICBjb25zdCBtb2RlczogTW9kZVtdID0gW107XHJcbiAgICAgIG1vZGVEYXRhWyByZXBvIF0gPSBtb2RlcztcclxuXHJcbiAgICAgIGNvbnN0IGlzUGhldGlvID0gXy5pbmNsdWRlcyggcGhldGlvU2ltcywgcmVwbyApO1xyXG4gICAgICBjb25zdCBoYXNVbml0VGVzdHMgPSBfLmluY2x1ZGVzKCB1bml0VGVzdHNSZXBvcywgcmVwbyApO1xyXG4gICAgICBjb25zdCBpc1J1bm5hYmxlID0gXy5pbmNsdWRlcyggYWN0aXZlUnVubmFibGVzLCByZXBvICk7XHJcbiAgICAgIGNvbnN0IHN1cHBvcnRzSW50ZXJhY3RpdmVEZXNjcmlwdGlvbiA9IF8uaW5jbHVkZXMoIGludGVyYWN0aXZlRGVzY3JpcHRpb25TaW1zLCByZXBvICk7XHJcblxyXG4gICAgICBpZiAoIGlzUnVubmFibGUgKSB7XHJcbiAgICAgICAgbW9kZXMucHVzaCgge1xyXG4gICAgICAgICAgbmFtZTogJ3VuYnVpbHQnLFxyXG4gICAgICAgICAgdGV4dDogJ1VuYnVpbHQnLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdSdW5zIHRoZSBzaW11bGF0aW9uIGZyb20gdGhlIHRvcC1sZXZlbCBkZXZlbG9wbWVudCBIVE1MIGluIHVuYnVpbHQgbW9kZScsXHJcbiAgICAgICAgICB1cmw6IGAuLi8ke3JlcG99LyR7cmVwb31fZW4uaHRtbGAsXHJcbiAgICAgICAgICBxdWVyeVBhcmFtZXRlcnM6IFtcclxuICAgICAgICAgICAgLi4uZGV2U2ltUXVlcnlQYXJhbWV0ZXJzLFxyXG4gICAgICAgICAgICAuLi4oIGRlbW9SZXBvcy5pbmNsdWRlcyggcmVwbyApID8gZGVtb3NRdWVyeVBhcmFtZXRlcnMgOiBbXSApLFxyXG4gICAgICAgICAgICAuLi5zaW1RdWVyeVBhcmFtZXRlcnNcclxuICAgICAgICAgIF1cclxuICAgICAgICB9ICk7XHJcbiAgICAgICAgbW9kZXMucHVzaCgge1xyXG4gICAgICAgICAgbmFtZTogJ2NvbXBpbGVkJyxcclxuICAgICAgICAgIHRleHQ6ICdDb21waWxlZCcsXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1J1bnMgdGhlIEVuZ2xpc2ggc2ltdWxhdGlvbiBmcm9tIHRoZSBidWlsZC9waGV0LyBkaXJlY3RvcnkgKGJ1aWx0IGZyb20gY2hpcHBlciknLFxyXG4gICAgICAgICAgdXJsOiBgLi4vJHtyZXBvfS9idWlsZC9waGV0LyR7cmVwb31fZW5fcGhldC5odG1sYCxcclxuICAgICAgICAgIHF1ZXJ5UGFyYW1ldGVyczogc2ltUXVlcnlQYXJhbWV0ZXJzXHJcbiAgICAgICAgfSApO1xyXG4gICAgICAgIG1vZGVzLnB1c2goIHtcclxuICAgICAgICAgIG5hbWU6ICdjb21waWxlZFhIVE1MJyxcclxuICAgICAgICAgIHRleHQ6ICdDb21waWxlZCBYSFRNTCcsXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1J1bnMgdGhlIEVuZ2xpc2ggc2ltdWxhdGlvbiBmcm9tIHRoZSBidWlsZC9waGV0L3hodG1sIGRpcmVjdG9yeSAoYnVpbHQgZnJvbSBjaGlwcGVyKScsXHJcbiAgICAgICAgICB1cmw6IGAuLi8ke3JlcG99L2J1aWxkL3BoZXQveGh0bWwvJHtyZXBvfV9hbGwueGh0bWxgLFxyXG4gICAgICAgICAgcXVlcnlQYXJhbWV0ZXJzOiBzaW1RdWVyeVBhcmFtZXRlcnNcclxuICAgICAgICB9ICk7XHJcbiAgICAgICAgbW9kZXMucHVzaCgge1xyXG4gICAgICAgICAgbmFtZTogJ3Byb2R1Y3Rpb24nLFxyXG4gICAgICAgICAgdGV4dDogJ1Byb2R1Y3Rpb24nLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdSdW5zIHRoZSBsYXRlc3QgRW5nbGlzaCBzaW11bGF0aW9uIGZyb20gdGhlIHByb2R1Y3Rpb24gc2VydmVyJyxcclxuICAgICAgICAgIHVybDogYGh0dHBzOi8vcGhldC5jb2xvcmFkby5lZHUvc2ltcy9odG1sLyR7cmVwb30vbGF0ZXN0LyR7cmVwb31fYWxsLmh0bWxgLFxyXG4gICAgICAgICAgcXVlcnlQYXJhbWV0ZXJzOiBzaW1RdWVyeVBhcmFtZXRlcnNcclxuICAgICAgICB9ICk7XHJcbiAgICAgICAgbW9kZXMucHVzaCgge1xyXG4gICAgICAgICAgbmFtZTogJ3Nwb3QnLFxyXG4gICAgICAgICAgdGV4dDogJ0RldiAoYmF5ZXMpJyxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTG9hZHMgdGhlIGxvY2F0aW9uIG9uIHBoZXQtZGV2LmNvbG9yYWRvLmVkdSB3aXRoIHZlcnNpb25zIGZvciBlYWNoIGRldiBkZXBsb3knLFxyXG4gICAgICAgICAgdXJsOiBgaHR0cHM6Ly9waGV0LWRldi5jb2xvcmFkby5lZHUvaHRtbC8ke3JlcG99YFxyXG4gICAgICAgIH0gKTtcclxuXHJcbiAgICAgICAgLy8gQ29sb3IgcGlja2VyIFVJXHJcbiAgICAgICAgbW9kZXMucHVzaCgge1xyXG4gICAgICAgICAgbmFtZTogJ2NvbG9ycycsXHJcbiAgICAgICAgICB0ZXh0OiAnQ29sb3IgRWRpdG9yJyxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUnVucyB0aGUgdG9wLWxldmVsIC1jb2xvcnMuaHRtbCBmaWxlIChhbGxvd3MgZWRpdGluZy92aWV3aW5nIGRpZmZlcmVudCBwcm9maWxlIGNvbG9ycyknLFxyXG4gICAgICAgICAgdXJsOiBgY29sb3ItZWRpdG9yLmh0bWw/c2ltPSR7cmVwb31gLFxyXG4gICAgICAgICAgcXVlcnlQYXJhbWV0ZXJzOiBbIHBoZXRCcmFuZFF1ZXJ5UGFyYW1ldGVyIF1cclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggcmVwbyA9PT0gJ3NjZW5lcnknICkge1xyXG4gICAgICAgIG1vZGVzLnB1c2goIHtcclxuICAgICAgICAgIG5hbWU6ICdpbnNwZWN0b3InLFxyXG4gICAgICAgICAgdGV4dDogJ0luc3BlY3RvcicsXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Rpc3BsYXlzIHNhdmVkIFNjZW5lcnkgc25hcHNob3RzJyxcclxuICAgICAgICAgIHVybDogYC4uLyR7cmVwb30vdGVzdHMvaW5zcGVjdG9yLmh0bWxgXHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIHJlcG8gPT09ICdwaGV0LWlvJyApIHtcclxuICAgICAgICBtb2Rlcy5wdXNoKCB7XHJcbiAgICAgICAgICBuYW1lOiAndGVzdC1zdHVkaW8tc2ltcycsXHJcbiAgICAgICAgICB0ZXh0OiAnRnV6eiBUZXN0IFN0dWRpbyBXcmFwcGVyJyxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUnVucyBhdXRvbWF0ZWQgdGVzdGluZyB3aXRoIGZ1enppbmcgb24gc3R1ZGlvLCAxNSBzZWNvbmQgdGltZXInLFxyXG4gICAgICAgICAgdXJsOiAnLi4vYXF1YS9mdXp6LWxpZ2h0eWVhci8nLFxyXG4gICAgICAgICAgcXVlcnlQYXJhbWV0ZXJzOiBnZXRGdXp6TGlnaHR5ZWFyUGFyYW1ldGVycyggMTUwMDAgKS5jb25jYXQoIFsge1xyXG4gICAgICAgICAgICB2YWx1ZTogYGZ1enomd3JhcHBlck5hbWU9c3R1ZGlvJndyYXBwZXJDb250aW51b3VzVGVzdD0lN0IlN0QmcmVwb3M9JHtwaGV0aW9TaW1zLmpvaW4oICcsJyApfWAsXHJcbiAgICAgICAgICAgIHRleHQ6ICdGdXp6IFRlc3QgUGhFVC1JTyBzaW1zJyxcclxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgICAgfSBdIClcclxuICAgICAgICB9ICk7XHJcbiAgICAgICAgbW9kZXMucHVzaCgge1xyXG4gICAgICAgICAgbmFtZTogJ3Rlc3QtbWlncmF0aW9uLXNpbXMnLFxyXG4gICAgICAgICAgdGV4dDogJ0Z1enogVGVzdCBNaWdyYXRpb24nLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdSdW5zIGF1dG9tYXRlZCB0ZXN0aW5nIHdpdGggZnV6emluZyBvbiBzdHVkaW8sIDEwIHNlY29uZCB0aW1lcicsXHJcbiAgICAgICAgICB1cmw6ICcuLi9hcXVhL2Z1enotbGlnaHR5ZWFyLycsXHJcbiAgICAgICAgICBxdWVyeVBhcmFtZXRlcnM6IGdldEZ1enpMaWdodHllYXJQYXJhbWV0ZXJzKCAyMDAwMCApLmNvbmNhdCggbWlncmF0aW9uUXVlcnlQYXJhbWV0ZXJzICkuY29uY2F0KCBbIHtcclxuICAgICAgICAgICAgdmFsdWU6ICdmdXp6JndyYXBwZXJOYW1lPW1pZ3JhdGlvbiZ3cmFwcGVyQ29udGludW91c1Rlc3Q9JTdCJTdEJm1pZ3JhdGlvblJhdGU9MjAwMCYnICtcclxuICAgICAgICAgICAgICAgICAgIGBwaGV0aW9NaWdyYXRpb25SZXBvcnQ9YXNzZXJ0JnJlcG9zPSR7cGhldGlvSHlkcm9nZW5TaW1zLm1hcCggc2ltRGF0YSA9PiBzaW1EYXRhLnNpbSApLmpvaW4oICcsJyApfWAsXHJcbiAgICAgICAgICAgIHRleHQ6ICdGdXp6IFRlc3QgUGhFVC1JTyBzaW1zJyxcclxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgICAgfSBdIClcclxuICAgICAgICB9ICk7XHJcbiAgICAgICAgbW9kZXMucHVzaCgge1xyXG4gICAgICAgICAgbmFtZTogJ3Rlc3Qtc3RhdGUtc2ltcycsXHJcbiAgICAgICAgICB0ZXh0OiAnRnV6eiBUZXN0IFN0YXRlIFdyYXBwZXInLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdSdW5zIGF1dG9tYXRlZCB0ZXN0aW5nIHdpdGggZnV6emluZyBvbiBzdGF0ZSwgMTUgc2Vjb25kIHRpbWVyJyxcclxuICAgICAgICAgIHVybDogJy4uL2FxdWEvZnV6ei1saWdodHllYXIvJyxcclxuICAgICAgICAgIHF1ZXJ5UGFyYW1ldGVyczogZ2V0RnV6ekxpZ2h0eWVhclBhcmFtZXRlcnMoIDE1MDAwICkuY29uY2F0KCBbIHtcclxuICAgICAgICAgICAgdmFsdWU6IGBmdXp6JndyYXBwZXJOYW1lPXN0YXRlJnNldFN0YXRlUmF0ZT0zMDAwJndyYXBwZXJDb250aW51b3VzVGVzdD0lN0IlN0QmcmVwb3M9JHtwaGV0aW9TaW1zLmpvaW4oICcsJyApfWAsXHJcbiAgICAgICAgICAgIHRleHQ6ICdGdXp6IFRlc3QgUGhFVC1JTyBzaW1zJyxcclxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgICAgfSBdIClcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggcmVwbyA9PT0gJ3BoZXQtaW8td2Vic2l0ZScgKSB7XHJcbiAgICAgICAgbW9kZXMucHVzaCgge1xyXG4gICAgICAgICAgbmFtZTogJ3ZpZXdSb290JyxcclxuICAgICAgICAgIHRleHQ6ICdWaWV3IExvY2FsJyxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAndmlldyB0aGUgbG9jYWwgcm9vbiBvZiB0aGUgd2Vic2l0ZScsXHJcbiAgICAgICAgICB1cmw6IGAuLi8ke3JlcG99L3Jvb3QvYFxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCBoYXNVbml0VGVzdHMgKSB7XHJcbiAgICAgICAgbW9kZXMucHVzaCgge1xyXG4gICAgICAgICAgbmFtZTogJ3VuaXRUZXN0c1VuYnVpbHQnLFxyXG4gICAgICAgICAgdGV4dDogJ1VuaXQgVGVzdHMgKHVuYnVpbHQpJyxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUnVucyB1bml0IHRlc3RzIGluIHVuYnVpbHQgbW9kZScsXHJcbiAgICAgICAgICB1cmw6IGAuLi8ke3JlcG99LyR7cmVwb30tdGVzdHMuaHRtbGAsXHJcbiAgICAgICAgICBxdWVyeVBhcmFtZXRlcnM6IFtcclxuICAgICAgICAgICAgZWFRdWVyeVBhcmFtZXRlcixcclxuICAgICAgICAgICAgeyB2YWx1ZTogJ2JyYW5kPXBoZXQtaW8nLCB0ZXh0OiAnUGhFVC1pTyBCcmFuZCcsIGRlZmF1bHQ6IHJlcG8gPT09ICdwaGV0LWlvJyB8fCByZXBvID09PSAndGFuZGVtJyB8fCByZXBvID09PSAncGhldC1pby13cmFwcGVycycgfSxcclxuICAgICAgICAgICAgLi4uKCByZXBvID09PSAncGhldC1pby13cmFwcGVycycgPyBbIHsgdmFsdWU6ICdzaW09Z3Jhdml0eS1hbmQtb3JiaXRzJywgdGV4dDogJ25lZWRlZFRlc3RQYXJhbXMnLCBkZWZhdWx0OiB0cnVlIH0gXSA6IFtdIClcclxuICAgICAgICAgIF1cclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCBkb2NSZXBvcy5pbmNsdWRlcyggcmVwbyApICkge1xyXG4gICAgICAgIG1vZGVzLnB1c2goIHtcclxuICAgICAgICAgIG5hbWU6ICdkb2N1bWVudGF0aW9uJyxcclxuICAgICAgICAgIHRleHQ6ICdEb2N1bWVudGF0aW9uJyxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQnJvd3NlIEhUTUwgZG9jdW1lbnRhdGlvbicsXHJcbiAgICAgICAgICB1cmw6IGAuLi8ke3JlcG99L2RvYyR7cmVwbyA9PT0gJ2JpbmRlcicgPyAncycgOiAnJ30vYFxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIHJlcG8gPT09ICdzY2VuZXJ5JyApIHtcclxuICAgICAgICBtb2Rlcy5wdXNoKCB7XHJcbiAgICAgICAgICBuYW1lOiAnbGF5b3V0LWRvY3VtZW50YXRpb24nLFxyXG4gICAgICAgICAgdGV4dDogJ0xheW91dCBEb2N1bWVudGF0aW9uJyxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQnJvd3NlIEhUTUwgbGF5b3V0IGRvY3VtZW50YXRpb24nLFxyXG4gICAgICAgICAgdXJsOiBgLi4vJHtyZXBvfS9kb2MvbGF5b3V0Lmh0bWxgXHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggcmVwbyA9PT0gJ3NjZW5lcnknIHx8IHJlcG8gPT09ICdraXRlJyB8fCByZXBvID09PSAnZG90JyApIHtcclxuICAgICAgICBtb2Rlcy5wdXNoKCB7XHJcbiAgICAgICAgICBuYW1lOiAnZXhhbXBsZXMnLFxyXG4gICAgICAgICAgdGV4dDogJ0V4YW1wbGVzJyxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQnJvd3NlIEV4YW1wbGVzJyxcclxuICAgICAgICAgIHVybDogYC4uLyR7cmVwb30vZXhhbXBsZXMvYFxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIHJlcG8gPT09ICdzY2VuZXJ5JyB8fCByZXBvID09PSAna2l0ZScgfHwgcmVwbyA9PT0gJ2RvdCcgfHwgcmVwbyA9PT0gJ3BoZXQtY29yZScgKSB7XHJcbiAgICAgICAgbW9kZXMucHVzaCgge1xyXG4gICAgICAgICAgbmFtZTogJ3BsYXlncm91bmQnLFxyXG4gICAgICAgICAgdGV4dDogJ1BsYXlncm91bmQnLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246IGBMb2FkcyAke3JlcG99IGFuZCBkZXBlbmRlbmNpZXMgaW4gdGhlIHRhYiwgYW5kIGFsbG93cyBxdWljayB0ZXN0aW5nYCxcclxuICAgICAgICAgIHVybDogYC4uLyR7cmVwb30vdGVzdHMvcGxheWdyb3VuZC5odG1sYFxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIHJlcG8gPT09ICdzY2VuZXJ5JyApIHtcclxuICAgICAgICBtb2Rlcy5wdXNoKCB7XHJcbiAgICAgICAgICBuYW1lOiAnc2FuZGJveCcsXHJcbiAgICAgICAgICB0ZXh0OiAnU2FuZGJveCcsXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FsbG93cyBxdWljayB0ZXN0aW5nIG9mIFNjZW5lcnkgZmVhdHVyZXMnLFxyXG4gICAgICAgICAgdXJsOiBgLi4vJHtyZXBvfS90ZXN0cy9zYW5kYm94Lmh0bWxgXHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggcmVwbyA9PT0gJ2NoaXBwZXInIHx8IHJlcG8gPT09ICdhcXVhJyApIHtcclxuICAgICAgICBtb2Rlcy5wdXNoKCB7XHJcbiAgICAgICAgICBuYW1lOiAndGVzdC1waGV0LXNpbXMnLFxyXG4gICAgICAgICAgdGV4dDogJ0Z1enogVGVzdCBQaEVUIFNpbXMnLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdSdW5zIGF1dG9tYXRlZCB0ZXN0aW5nIHdpdGggZnV6emluZywgMTAgc2Vjb25kIHRpbWVyJyxcclxuICAgICAgICAgIHVybDogJy4uL2FxdWEvZnV6ei1saWdodHllYXIvJyxcclxuICAgICAgICAgIHF1ZXJ5UGFyYW1ldGVyczogZ2V0RnV6ekxpZ2h0eWVhclBhcmFtZXRlcnMoKS5jb25jYXQoIFsge1xyXG4gICAgICAgICAgICB2YWx1ZTogJ2JyYW5kPXBoZXQmZnV6eicsXHJcbiAgICAgICAgICAgIHRleHQ6ICdGdXp6IFBoRVQgc2ltcycsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICAgIH0gXSApXHJcbiAgICAgICAgfSApO1xyXG4gICAgICAgIG1vZGVzLnB1c2goIHtcclxuICAgICAgICAgIG5hbWU6ICd0ZXN0LXBoZXQtaW8tc2ltcycsXHJcbiAgICAgICAgICB0ZXh0OiAnRnV6eiBUZXN0IFBoRVQtaU8gU2ltcycsXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1J1bnMgYXV0b21hdGVkIHRlc3Rpbmcgd2l0aCBmdXp6aW5nLCAxMCBzZWNvbmQgdGltZXInLFxyXG4gICAgICAgICAgdXJsOiAnLi4vYXF1YS9mdXp6LWxpZ2h0eWVhci8nLFxyXG4gICAgICAgICAgcXVlcnlQYXJhbWV0ZXJzOiBnZXRGdXp6TGlnaHR5ZWFyUGFyYW1ldGVycygpLmNvbmNhdCggWyB7XHJcbiAgICAgICAgICAgIHZhbHVlOiAnYnJhbmQ9cGhldC1pbyZmdXp6JnBoZXRpb1N0YW5kYWxvbmUnLFxyXG4gICAgICAgICAgICB0ZXh0OiAnRnV6eiBQaEVULUlPIGJyYW5kJyxcclxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICB2YWx1ZTogYHJlcG9zPSR7cGhldGlvU2ltcy5qb2luKCAnLCcgKX1gLFxyXG4gICAgICAgICAgICB0ZXh0OiAnVGVzdCBvbmx5IFBoRVQtaU8gc2ltcycsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICAgIH0gXSApXHJcbiAgICAgICAgfSApO1xyXG4gICAgICAgIG1vZGVzLnB1c2goIHtcclxuICAgICAgICAgIG5hbWU6ICd0ZXN0LWludGVyYWN0aXZlLWRlc2NyaXB0aW9uLXNpbXMnLFxyXG4gICAgICAgICAgdGV4dDogJ0Z1enogVGVzdCBJbnRlcmFjdGl2ZSBEZXNjcmlwdGlvbiBTaW1zJyxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUnVucyBhdXRvbWF0ZWQgdGVzdGluZyB3aXRoIGZ1enppbmcsIDEwIHNlY29uZCB0aW1lcicsXHJcbiAgICAgICAgICB1cmw6ICcuLi9hcXVhL2Z1enotbGlnaHR5ZWFyLycsXHJcblxyXG4gICAgICAgICAgLy8gb25seSBvbmUgZnV6emVyIGJlY2F1c2UgdHdvIGlmcmFtZXMgY2Fubm90IGJvdGggcmVjZWl2ZSBmb2N1cy9ibHVyIGV2ZW50c1xyXG4gICAgICAgICAgcXVlcnlQYXJhbWV0ZXJzOiBnZXRGdXp6TGlnaHR5ZWFyUGFyYW1ldGVycyggMTAwMDAsIHRydWUsIGZhbHNlICkuY29uY2F0KCBbXHJcbiAgICAgICAgICAgIHBoZXRCcmFuZFF1ZXJ5UGFyYW1ldGVyLCB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6ICdmdXp6Qm9hcmQmc3VwcG9ydHNJbnRlcmFjdGl2ZURlc2NyaXB0aW9uPXRydWUnLFxyXG4gICAgICAgICAgICAgIHRleHQ6ICdLZXlib2FyZCBGdXp6IFRlc3Qgc2ltcycsXHJcbiAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6ICdmdXp6JnN1cHBvcnRzSW50ZXJhY3RpdmVEZXNjcmlwdGlvbj10cnVlJyxcclxuICAgICAgICAgICAgICB0ZXh0OiAnTm9ybWFsIEZ1enogVGVzdCBzaW1zJ1xyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6IGByZXBvcz0ke2ludGVyYWN0aXZlRGVzY3JpcHRpb25TaW1zLmpvaW4oICcsJyApfWAsXHJcbiAgICAgICAgICAgICAgdGV4dDogJ1Rlc3Qgb25seSBBMTF5IHNpbXMnLFxyXG4gICAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICAgICAgfSBdIClcclxuICAgICAgICB9ICk7XHJcbiAgICAgICAgbW9kZXMucHVzaCgge1xyXG4gICAgICAgICAgbmFtZTogJ2Z1enotc2ltcy1sb2FkLW9ubHknLFxyXG4gICAgICAgICAgdGV4dDogJ0xvYWQgU2ltcycsXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1J1bnMgYXV0b21hdGVkIHRlc3RpbmcgdGhhdCBqdXN0IGxvYWRzIHNpbXMgKHdpdGhvdXQgZnV6emluZyBvciBidWlsZGluZyknLFxyXG4gICAgICAgICAgdXJsOiAnLi4vYXF1YS9mdXp6LWxpZ2h0eWVhci8nLFxyXG4gICAgICAgICAgcXVlcnlQYXJhbWV0ZXJzOiBnZXRGdXp6TGlnaHR5ZWFyUGFyYW1ldGVycyggMTAwMDAsIGZhbHNlICkuY29uY2F0KCBbIHBoZXRCcmFuZFF1ZXJ5UGFyYW1ldGVyIF0gKVxyXG4gICAgICAgIH0gKTtcclxuICAgICAgICBtb2Rlcy5wdXNoKCB7XHJcbiAgICAgICAgICBuYW1lOiAnY29udGludW91cy10ZXN0aW5nJyxcclxuICAgICAgICAgIHRleHQ6ICdDb250aW51b3VzIFRlc3RpbmcnLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdMaW5rIHRvIHRoZSBjb250aW51b3VzIHRlc3Rpbmcgb24gQmF5ZXMuJyxcclxuICAgICAgICAgIHVybDogJ2h0dHBzOi8vYmF5ZXMuY29sb3JhZG8uZWR1L2NvbnRpbnVvdXMtdGVzdGluZy9hcXVhL2h0bWwvY29udGludW91cy1yZXBvcnQuaHRtbCdcclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgIC8vIFNoYXJlZCBieSBvbGQgYW5kIG11bHRpIHNuYXBzaG9wIGNvbXBhcmlzb24uXHJcbiAgICAgICAgY29uc3Qgc2hhcmVkQ29tcGFyaXNvblF1ZXJ5UGFyYW1ldGVyczogUGhldG1hcmtzUXVlcnlQYXJhbWV0ZXJbXSA9IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdmFsdWU6ICdzaW1TZWVkPTEyMycsXHJcbiAgICAgICAgICAgIHRleHQ6ICdDdXN0b20gc2VlZCAoZGVmYXVsdHMgdG8gYSBub24gcmFuZG9tIHZhbHVlKSdcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhbHVlOiBgc2ltV2lkdGg9JHsxMDI0IC8gMn1gLFxyXG4gICAgICAgICAgICB0ZXh0OiAnTGFyZ2VyIHNpbSB3aWR0aCdcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhbHVlOiBgc2ltSGVpZ2h0PSR7NzY4IC8gMn1gLFxyXG4gICAgICAgICAgICB0ZXh0OiAnTGFyZ2VyIHNpbSBoZWlnaHQnXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB2YWx1ZTogJ251bUZyYW1lcz0zMCcsXHJcbiAgICAgICAgICAgIHRleHQ6ICdtb3JlIGNvbXBhcmlzb24gZnJhbWVzJ1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF07XHJcbiAgICAgICAgbW9kZXMucHVzaCgge1xyXG4gICAgICAgICAgbmFtZTogJ3NuYXBzaG90LWNvbXBhcmlzb24nLFxyXG4gICAgICAgICAgdGV4dDogJ1NuYXBzaG90IENvbXBhcmlzb24nLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdTZXRzIHVwIHNuYXBzaG90IHNjcmVlbnNob3QgY29tcGFyaXNvbiB0aGF0IGNhbiBiZSBydW4gb24gZGlmZmVyZW50IFNIQXMnLFxyXG4gICAgICAgICAgdXJsOiAnLi4vYXF1YS9odG1sL3NuYXBzaG90LWNvbXBhcmlzb24uaHRtbCcsXHJcbiAgICAgICAgICBxdWVyeVBhcmFtZXRlcnM6IFtcclxuICAgICAgICAgICAgZWFRdWVyeVBhcmFtZXRlcixcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiAncmVwb3M9ZGVuc2l0eSxidW95YW5jeScsXHJcbiAgICAgICAgICAgICAgdGV4dDogJ1NpbXMgdG8gY29tcGFyZSdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiAncmFuZG9tU2ltcz0xMCcsXHJcbiAgICAgICAgICAgICAgdGV4dDogJ1Rlc3QgYSByYW5kb20gbnVtYmVyIG9mIHNpbXMnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC4uLnNoYXJlZENvbXBhcmlzb25RdWVyeVBhcmFtZXRlcnMsXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB2YWx1ZTogJ3NpbVF1ZXJ5UGFyYW1ldGVycz1lYScsXHJcbiAgICAgICAgICAgICAgdGV4dDogJ3NpbSBmcmFtZSBwYXJhbWV0ZXJzJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6ICdzaG93VGltZScsXHJcbiAgICAgICAgICAgICAgdGV4dDogJ3Nob3cgdGltZSB0YWtlbiBmb3IgZWFjaCBzbnBhc2hvdCcsXHJcbiAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB2YWx1ZTogJ2NvbXBhcmVEZXNjcmlwdGlvbicsXHJcbiAgICAgICAgICAgICAgdGV4dDogJ2NvbXBhcmUgZGVzY3JpcHRpb24gUERPTSBhbmQgdGV4dCB0b28nLFxyXG4gICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfSApO1xyXG4gICAgICAgIG1vZGVzLnB1c2goIHtcclxuICAgICAgICAgIG5hbWU6ICdtdWx0aS1zbmFwc2hvdC1jb21wYXJpc29uJyxcclxuICAgICAgICAgIHRleHQ6ICdNdWx0aS1zbmFwc2hvdCBDb21wYXJpc29uJyxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2V0cyB1cCBzbmFwc2hvdCBzY3JlZW5zaG90IGNvbXBhcmlzb24gZm9yIHR3byBkaWZmZXJlbnQgY2hlY2tvdXRzJyxcclxuICAgICAgICAgIHVybDogJy4uL2FxdWEvaHRtbC9tdWx0aS1zbmFwc2hvdC1jb21wYXJpc29uLmh0bWwnLFxyXG4gICAgICAgICAgcXVlcnlQYXJhbWV0ZXJzOiBbXHJcbiAgICAgICAgICAgIGVhUXVlcnlQYXJhbWV0ZXIsXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB2YWx1ZTogJ3JlcG9zPWRlbnNpdHksYnVveWFuY3knLFxyXG4gICAgICAgICAgICAgIHRleHQ6ICdTaW1zIHRvIGNvbXBhcmUnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB2YWx1ZTogJ3VybHM9aHR0cDovL2xvY2FsaG9zdCxodHRwOi8vbG9jYWxob3N0OjgwODAnLFxyXG4gICAgICAgICAgICAgIHRleHQ6ICdUZXN0aW5nIHVybHMnLFxyXG4gICAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLi4uc2hhcmVkQ29tcGFyaXNvblF1ZXJ5UGFyYW1ldGVycyxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiAndGVzdFBoZXRpbycsXHJcbiAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICAgICAgICAgIHRleHQ6ICdUZXN0IFBoRVQtaU8gQnJhbmQnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB2YWx1ZTogJ3NpbVF1ZXJ5UGFyYW1ldGVycz1lYScsXHJcbiAgICAgICAgICAgICAgdGV4dDogJ3NpbSBwYXJhbWV0ZXJzIChub3QgP2JyYW5kKScsXHJcbiAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6ICdjb3BpZXM9MScsXHJcbiAgICAgICAgICAgICAgdGV4dDogJ0lGcmFtZXMgcGVyIGNvbHVtbidcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIHJlcG8gPT09ICd5b3R0YScgKSB7XHJcbiAgICAgICAgbW9kZXMucHVzaCgge1xyXG4gICAgICAgICAgbmFtZTogJ3lvdHRhLXN0YXRpc3RpY3MnLFxyXG4gICAgICAgICAgdGV4dDogJ1N0YXRpc3RpY3MgcGFnZScsXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0dvZXMgdG8gdGhlIHlvdHRhIHJlcG9ydCBwYWdlLCBjcmVkZW50aWFscyBpbiB0aGUgR29vZ2xlIERvYycsXHJcbiAgICAgICAgICB1cmw6ICdodHRwczovL2JheWVzLmNvbG9yYWRvLmVkdS9zdGF0aXN0aWNzL3lvdHRhLydcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCByZXBvID09PSAnc2tpZmZsZScgKSB7XHJcbiAgICAgICAgbW9kZXMucHVzaCgge1xyXG4gICAgICAgICAgbmFtZTogJ3NvdW5kLWJvYXJkJyxcclxuICAgICAgICAgIHRleHQ6ICdTb3VuZCBCb2FyZCcsXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ludGVyYWN0aXZlIEhUTUwgcGFnZSBmb3IgZXhwbG9yaW5nIGV4aXN0aW5nIHNvdW5kcyBpbiBzaW1zIGFuZCBjb21tb24gY29kZScsXHJcbiAgICAgICAgICB1cmw6ICcuLi9za2lmZmxlL2h0bWwvc291bmQtYm9hcmQuaHRtbCdcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCByZXBvID09PSAncXVha2UnICkge1xyXG4gICAgICAgIG1vZGVzLnB1c2goIHtcclxuICAgICAgICAgIG5hbWU6ICdxdWFrZS1idWlsdCcsXHJcbiAgICAgICAgICB0ZXh0OiAnSGFwdGljcyBQbGF5Z3JvdW5kIChidWlsdCBmb3IgYnJvd3NlciknLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdCdWlsdCBicm93c2VyIHZlcnNpb24gb2YgdGhlIEhhcHRpY3MgUGxheWdyb3VuZCBhcHAnLFxyXG4gICAgICAgICAgdXJsOiAnLi4vcXVha2UvcGxhdGZvcm1zL2Jyb3dzZXIvd3d3L2hhcHRpY3MtcGxheWdyb3VuZC5odG1sJ1xyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCBzdXBwb3J0c0ludGVyYWN0aXZlRGVzY3JpcHRpb24gKSB7XHJcbiAgICAgICAgbW9kZXMucHVzaCgge1xyXG4gICAgICAgICAgbmFtZTogJ2ExMXktdmlldycsXHJcbiAgICAgICAgICB0ZXh0OiAnQTExeSBWaWV3JyxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUnVucyB0aGUgc2ltdWxhdGlvbiBpbiBhbiBpZnJhbWUgbmV4dCB0byBhIGNvcHkgb2YgdGhlIFBET00gdG90IGVhc2lseSBpbnNwZWN0IGFjY2Vzc2libGUgY29udGVudC4nLFxyXG4gICAgICAgICAgdXJsOiBgLi4vJHtyZXBvfS8ke3JlcG99X2ExMXlfdmlldy5odG1sYCxcclxuICAgICAgICAgIHF1ZXJ5UGFyYW1ldGVyczogZGV2U2ltUXVlcnlQYXJhbWV0ZXJzLmNvbmNhdCggc2ltUXVlcnlQYXJhbWV0ZXJzIClcclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICggcmVwbyA9PT0gJ2ludGVyYWN0aW9uLWRhc2hib2FyZCcgKSB7XHJcbiAgICAgICAgbW9kZXMucHVzaCgge1xyXG4gICAgICAgICAgbmFtZTogJ3ByZXByb2Nlc3NvcicsXHJcbiAgICAgICAgICB0ZXh0OiAnUHJlcHJvY2Vzc29yJyxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTG9hZCB0aGUgcHJlcHJvY2Vzc29yIGZvciBwYXJzaW5nIGRhdGEgbG9ncyBkb3duIHRvIGEgc2l6ZSB0aGF0IGNhbiBiZSB1c2VkIGJ5IHRoZSBzaW11bGF0aW9uLicsXHJcbiAgICAgICAgICB1cmw6IGAuLi8ke3JlcG99L3ByZXByb2Nlc3Nvci5odG1sYCxcclxuICAgICAgICAgIHF1ZXJ5UGFyYW1ldGVyczogWyBlYVF1ZXJ5UGFyYW1ldGVyLCB7XHJcbiAgICAgICAgICAgIHZhbHVlOiAncGFyc2VYPTEwJyxcclxuICAgICAgICAgICAgdGV4dDogJ1Rlc3Qgb25seSAxMCBzZXNzaW9ucydcclxuICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgdmFsdWU6ICdmb3JTcHJlYWRzaGVldCcsXHJcbiAgICAgICAgICAgIHRleHQ6ICdDcmVhdGUgb3V0cHV0IGZvciBhIHNwcmVhZHNoZWV0LidcclxuICAgICAgICAgIH0gXVxyXG4gICAgICAgIH0gKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgbW9kZXMucHVzaCgge1xyXG4gICAgICAgIG5hbWU6ICdnaXRodWInLFxyXG4gICAgICAgIHRleHQ6ICdHaXRIdWInLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnT3BlbnMgdG8gdGhlIHJlcG9zaXRvcnlcXCdzIEdpdEh1YiBtYWluIHBhZ2UnLFxyXG4gICAgICAgIHVybDogYGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy8ke3JlcG99YFxyXG4gICAgICB9ICk7XHJcbiAgICAgIG1vZGVzLnB1c2goIHtcclxuICAgICAgICBuYW1lOiAnaXNzdWVzJyxcclxuICAgICAgICB0ZXh0OiAnSXNzdWVzJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ09wZW5zIHRvIHRoZSByZXBvc2l0b3J5XFwncyBHaXRIdWIgaXNzdWVzIHBhZ2UnLFxyXG4gICAgICAgIHVybDogYGh0dHBzOi8vZ2l0aHViLmNvbS9waGV0c2ltcy8ke3JlcG99L2lzc3Vlc2BcclxuICAgICAgfSApO1xyXG5cclxuICAgICAgLy8gaWYgYSBwaGV0LWlvIHNpbSwgdGhlbiBhZGQgdGhlIHdyYXBwZXJzIHRvIHRoZW1cclxuICAgICAgaWYgKCBpc1BoZXRpbyApIHtcclxuXHJcbiAgICAgICAgLy8gQWRkIHRoZSBjb25zb2xlIGxvZ2dpbmcsIG5vdCBhIHdyYXBwZXIgYnV0IG5pY2UgdG8gaGF2ZVxyXG4gICAgICAgIG1vZGVzLnB1c2goIHtcclxuICAgICAgICAgIG5hbWU6ICdvbmUtc2ltLXdyYXBwZXItdGVzdHMnLFxyXG4gICAgICAgICAgdGV4dDogJ1dyYXBwZXIgVW5pdCBUZXN0cycsXHJcbiAgICAgICAgICBncm91cDogJ1BoRVQtaU8nLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdUZXN0IHRoZSBQaEVULWlPIEFQSSBmb3IgdGhpcyBzaW0uJyxcclxuXHJcbiAgICAgICAgICAvLyBFYWNoIHNpbSBnZXRzIGl0cyBvd24gdGVzdCwganVzdCBydW4gc2ltLWxlc3MgdGVzdHMgaGVyZVxyXG4gICAgICAgICAgdXJsOiBgLi4vcGhldC1pby13cmFwcGVycy9waGV0LWlvLXdyYXBwZXJzLXRlc3RzLmh0bWw/c2ltPSR7cmVwb31gLFxyXG4gICAgICAgICAgcXVlcnlQYXJhbWV0ZXJzOiBwaGV0aW9XcmFwcGVyUXVlcnlQYXJhbWV0ZXJzXHJcbiAgICAgICAgfSApO1xyXG5cclxuICAgICAgICAvLyBBZGQgYSBsaW5rIHRvIHRoZSBjb21waWxlZCB3cmFwcGVyIGluZGV4O1xyXG4gICAgICAgIG1vZGVzLnB1c2goIHtcclxuICAgICAgICAgIG5hbWU6ICdjb21waWxlZC1pbmRleCcsXHJcbiAgICAgICAgICB0ZXh0OiAnQ29tcGlsZWQgSW5kZXgnLFxyXG4gICAgICAgICAgZ3JvdXA6ICdQaEVULWlPJyxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUnVucyB0aGUgUGhFVC1pTyB3cmFwcGVyIGluZGV4IGZyb20gYnVpbGQvIGRpcmVjdG9yeSAoYnVpbHQgZnJvbSBjaGlwcGVyKScsXHJcbiAgICAgICAgICB1cmw6IGAuLi8ke3JlcG99L2J1aWxkL3BoZXQtaW8vYCxcclxuICAgICAgICAgIHF1ZXJ5UGFyYW1ldGVyczogcGhldGlvV3JhcHBlclF1ZXJ5UGFyYW1ldGVyc1xyXG4gICAgICAgIH0gKTtcclxuXHJcbiAgICAgICAgbW9kZXMucHVzaCgge1xyXG4gICAgICAgICAgbmFtZTogJ3N0YW5kYWxvbmUnLFxyXG4gICAgICAgICAgdGV4dDogJ1N0YW5kYWxvbmUnLFxyXG4gICAgICAgICAgZ3JvdXA6ICdQaEVULWlPJyxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUnVucyB0aGUgc2ltIGluIHBoZXQtaW8gYnJhbmQgd2l0aCB0aGUgc3RhbmRhbG9uZSBxdWVyeSBwYXJhbWV0ZXInLFxyXG4gICAgICAgICAgdXJsOiBgLi4vJHtyZXBvfS8ke3JlcG99X2VuLmh0bWw/YnJhbmQ9cGhldC1pbyZwaGV0aW9TdGFuZGFsb25lYCxcclxuICAgICAgICAgIHF1ZXJ5UGFyYW1ldGVyczogcGhldGlvU2ltUXVlcnlQYXJhbWV0ZXJzLmNvbmNhdCggc2ltTm9Mb2NhbGVzUXVlcnlQYXJhbWV0ZXJzIClcclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNpbVNwZWNpZmljV3JhcHBlcnMgPSBwaGV0aW9QYWNrYWdlSlNPTnNbIHJlcG8gXT8ucGhldFsgJ3BoZXQtaW8nIF0/LndyYXBwZXJzIHx8IFtdO1xyXG4gICAgICAgIGNvbnN0IGFsbFdyYXBwZXJzID0gd3JhcHBlcnMuY29uY2F0KCBub25QdWJsaXNoZWRQaGV0aW9XcmFwcGVyc1RvQWRkVG9QaGV0bWFya3MgKS5jb25jYXQoIHNpbVNwZWNpZmljV3JhcHBlcnMgKTtcclxuXHJcbiAgICAgICAgLy8gcGhldC1pbyB3cmFwcGVyc1xyXG4gICAgICAgIF8uc29ydEJ5KCBhbGxXcmFwcGVycywgZ2V0V3JhcHBlck5hbWUgKS5mb3JFYWNoKCB3cmFwcGVyID0+IHtcclxuXHJcbiAgICAgICAgICBjb25zdCB3cmFwcGVyTmFtZSA9IGdldFdyYXBwZXJOYW1lKCB3cmFwcGVyICk7XHJcblxyXG4gICAgICAgICAgbGV0IHVybCA9ICcnO1xyXG5cclxuICAgICAgICAgIC8vIFByb2Nlc3MgZm9yIGRlZGljYXRlZCB3cmFwcGVyIHJlcG9zXHJcbiAgICAgICAgICBpZiAoIHdyYXBwZXIuc3RhcnRzV2l0aCggJ3BoZXQtaW8td3JhcHBlci0nICkgKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIHVzZSBjYXNlIGZvciB0aGUgc29uaWZpY2F0aW9uIHdyYXBwZXJcclxuICAgICAgICAgICAgdXJsID0gd3JhcHBlck5hbWUgPT09ICdzb25pZmljYXRpb24nID8gYC4uL3BoZXQtaW8td3JhcHBlci0ke3dyYXBwZXJOYW1lfS8ke3JlcG99LXNvbmlmaWNhdGlvbi5odG1sP3NpbT0ke3JlcG99YCA6XHJcbiAgICAgICAgICAgICAgICAgIGAuLi8ke3dyYXBwZXJ9Lz9zaW09JHtyZXBvfWA7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBMb2FkIHRoZSB3cmFwcGVyIHVybHMgZm9yIHRoZSBwaGV0LWlvLXdyYXBwZXJzL1xyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHVybCA9IGAuLi8ke3dyYXBwZXJ9Lz9zaW09JHtyZXBvfWA7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gYWRkIHJlY29yZGluZyB0byB0aGUgY29uc29sZSBieSBkZWZhdWx0XHJcbiAgICAgICAgICBpZiAoIHdyYXBwZXIgPT09ICdwaGV0LWlvLXdyYXBwZXJzL3JlY29yZCcgKSB7XHJcbiAgICAgICAgICAgIHVybCArPSAnJmNvbnNvbGUnO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGxldCBxdWVyeVBhcmFtZXRlcnM6IFBoZXRtYXJrc1F1ZXJ5UGFyYW1ldGVyW10gPSBbXTtcclxuICAgICAgICAgIGlmICggd3JhcHBlck5hbWUgPT09ICdzdHVkaW8nICkge1xyXG5cclxuICAgICAgICAgICAgLy8gU28gd2UgZG9uJ3QgbXV0YXRlIHRoZSBjb21tb24gbGlzdFxyXG4gICAgICAgICAgICBjb25zdCBzdHVkaW9RdWVyeVBhcmFtZXRlcnMgPSBbIC4uLnBoZXRpb1dyYXBwZXJRdWVyeVBhcmFtZXRlcnMgXTtcclxuXHJcbiAgICAgICAgICAgIC8vIFN0dWRpbyBkZWZhdWx0cyB0byBwaGV0aW9EZWJ1Zz10cnVlLCBzbyB0aGlzIHBhcmFtZXRlciBjYW4ndCBiZSBvbiBieSBkZWZhdWx0XHJcbiAgICAgICAgICAgIF8ucmVtb3ZlKCBzdHVkaW9RdWVyeVBhcmFtZXRlcnMsIGl0ZW0gPT4gaXRlbSA9PT0gcGhldGlvRGVidWdUcnVlUGFyYW1ldGVyICk7XHJcblxyXG4gICAgICAgICAgICBxdWVyeVBhcmFtZXRlcnMgPSBzdHVkaW9RdWVyeVBhcmFtZXRlcnMuY29uY2F0KCBbIHBoZXRpb0RlYnVnUGFyYW1ldGVyLCBwaGV0aW9FbGVtZW50c0Rpc3BsYXlQYXJhbWV0ZXIgXSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSBpZiAoIHdyYXBwZXJOYW1lID09PSAnbWlncmF0aW9uJyApIHtcclxuICAgICAgICAgICAgcXVlcnlQYXJhbWV0ZXJzID0gWyAuLi5taWdyYXRpb25RdWVyeVBhcmFtZXRlcnMsIHtcclxuICAgICAgICAgICAgICB2YWx1ZTogJ3BoZXRpb01pZ3JhdGlvblJlcG9ydCcsXHJcbiAgICAgICAgICAgICAgdHlwZTogJ3BhcmFtZXRlclZhbHVlcycsXHJcbiAgICAgICAgICAgICAgdGV4dDogJ0hvdyBzaG91bGQgdGhlIG1pZ3JhdGlvbiByZXBvcnQgYmUgcmVwb3J0ZWQ/JyxcclxuICAgICAgICAgICAgICBwYXJhbWV0ZXJWYWx1ZXM6IFsgJ2RldicsICdjbGllbnQnLCAndmVyYm9zZScsICdhc3NlcnQnIF0sXHJcbiAgICAgICAgICAgICAgb21pdElmRGVmYXVsdDogZmFsc2VcclxuICAgICAgICAgICAgfSBdO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSBpZiAoIHdyYXBwZXJOYW1lID09PSAnc3RhdGUnICkge1xyXG4gICAgICAgICAgICBxdWVyeVBhcmFtZXRlcnMgPSBbIC4uLnBoZXRpb1dyYXBwZXJRdWVyeVBhcmFtZXRlcnMsIHtcclxuICAgICAgICAgICAgICB2YWx1ZTogJ3NldFN0YXRlUmF0ZT0xMDAwJyxcclxuICAgICAgICAgICAgICB0ZXh0OiAnQ3VzdG9taXplIHRoZSBcInNldCBzdGF0ZVwiIHJhdGUgZm9yIGhvdyBvZnRlbiBhIHN0YXRlIGlzIHNldCB0byB0aGUgZG93bnN0cmVhbSBzaW0gKGluIG1zKScsXHJcbiAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6ICdsb2dUaW1pbmcnLFxyXG4gICAgICAgICAgICAgIHRleHQ6ICdDb25zb2xlIGxvZyB0aGUgYW1vdW50IG9mIHRpbWUgaXQgdG9vayB0byBzZXQgdGhlIHN0YXRlIG9mIHRoZSBzaW11bGF0aW9uLidcclxuICAgICAgICAgICAgfSBdO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSBpZiAoIHdyYXBwZXJOYW1lID09PSAncGxheWJhY2snICkge1xyXG4gICAgICAgICAgICBxdWVyeVBhcmFtZXRlcnMgPSBbXTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBxdWVyeVBhcmFtZXRlcnMgPSBwaGV0aW9XcmFwcGVyUXVlcnlQYXJhbWV0ZXJzO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIG1vZGVzLnB1c2goIHtcclxuICAgICAgICAgICAgbmFtZTogd3JhcHBlck5hbWUsXHJcbiAgICAgICAgICAgIHRleHQ6IHdyYXBwZXJOYW1lLFxyXG4gICAgICAgICAgICBncm91cDogJ1BoRVQtaU8nLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYFJ1bnMgdGhlIHBoZXQtaW8gd3JhcHBlciAke3dyYXBwZXJOYW1lfWAsXHJcbiAgICAgICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgICAgICBxdWVyeVBhcmFtZXRlcnM6IHF1ZXJ5UGFyYW1ldGVyc1xyXG4gICAgICAgICAgfSApO1xyXG4gICAgICAgIH0gKTtcclxuXHJcbiAgICAgICAgLy8gQWRkIHRoZSBjb25zb2xlIGxvZ2dpbmcsIG5vdCBhIHdyYXBwZXIgYnV0IG5pY2UgdG8gaGF2ZVxyXG4gICAgICAgIG1vZGVzLnB1c2goIHtcclxuICAgICAgICAgIG5hbWU6ICdjb2xvcml6ZWQnLFxyXG4gICAgICAgICAgdGV4dDogJ0RhdGE6IGNvbG9yaXplZCcsXHJcbiAgICAgICAgICBncm91cDogJ1BoRVQtaU8nLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdTaG93IHRoZSBjb2xvcml6ZWQgZXZlbnQgbG9nIGluIHRoZSBjb25zb2xlIG9mIHRoZSBzdGFuZCBhbG9uZSBzaW0uJyxcclxuICAgICAgICAgIHVybDogYC4uLyR7cmVwb30vJHtyZXBvfV9lbi5odG1sP2JyYW5kPXBoZXQtaW8mcGhldGlvQ29uc29sZUxvZz1jb2xvcml6ZWQmcGhldGlvU3RhbmRhbG9uZSZwaGV0aW9FbWl0SGlnaEZyZXF1ZW5jeUV2ZW50cz1mYWxzZWAsXHJcbiAgICAgICAgICBxdWVyeVBhcmFtZXRlcnM6IHBoZXRpb1NpbVF1ZXJ5UGFyYW1ldGVycy5jb25jYXQoIHNpbU5vTG9jYWxlc1F1ZXJ5UGFyYW1ldGVycyApXHJcbiAgICAgICAgfSApO1xyXG4gICAgICB9XHJcbiAgICB9ICk7XHJcblxyXG4gICAgcmV0dXJuIG1vZGVEYXRhO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY2xlYXJDaGlsZHJlbiggZWxlbWVudDogSFRNTEVsZW1lbnQgKTogdm9pZCB7XHJcbiAgICB3aGlsZSAoIGVsZW1lbnQuY2hpbGROb2Rlcy5sZW5ndGggKSB7IGVsZW1lbnQucmVtb3ZlQ2hpbGQoIGVsZW1lbnQuY2hpbGROb2Rlc1sgMCBdICk7IH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGNyZWF0ZVJlcG9zaXRvcnlTZWxlY3RvciggcmVwb3NpdG9yaWVzOiBSZXBvTmFtZVtdICk6IFJlcG9TZWxlY3RvciB7XHJcbiAgICBjb25zdCBzZWxlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnc2VsZWN0JyApO1xyXG4gICAgc2VsZWN0LmF1dG9mb2N1cyA9IHRydWU7XHJcbiAgICByZXBvc2l0b3JpZXMuZm9yRWFjaCggcmVwbyA9PiB7XHJcbiAgICAgIGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdvcHRpb24nICk7XHJcbiAgICAgIG9wdGlvbi52YWx1ZSA9IG9wdGlvbi5sYWJlbCA9IG9wdGlvbi5pbm5lckhUTUwgPSByZXBvO1xyXG4gICAgICBzZWxlY3QuYXBwZW5kQ2hpbGQoIG9wdGlvbiApO1xyXG4gICAgfSApO1xyXG5cclxuICAgIC8vIElFIG9yIG5vLXNjcm9sbEludG9WaWV3IHdpbGwgbmVlZCB0byBiZSBoZWlnaHQtbGltaXRlZFxyXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgaWYgKCBzZWxlY3Quc2Nyb2xsSW50b1ZpZXcgJiYgIW5hdmlnYXRvci51c2VyQWdlbnQuaW5jbHVkZXMoICdUcmlkZW50LycgKSApIHtcclxuICAgICAgc2VsZWN0LnNldEF0dHJpYnV0ZSggJ3NpemUnLCBgJHtyZXBvc2l0b3JpZXMubGVuZ3RofWAgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBzZWxlY3Quc2V0QXR0cmlidXRlKCAnc2l6ZScsICczMCcgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTZWxlY3QgYSByZXBvc2l0b3J5IGlmIGl0J3MgYmVlbiBzdG9yZWQgaW4gbG9jYWxTdG9yYWdlIGJlZm9yZVxyXG4gICAgY29uc3QgcmVwb0tleSA9IHN0b3JhZ2VLZXkoICdyZXBvJyApO1xyXG4gICAgY29uc3QgdmFsdWUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSggcmVwb0tleSApO1xyXG4gICAgaWYgKCB2YWx1ZSApIHtcclxuICAgICAgc2VsZWN0LnZhbHVlID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgc2VsZWN0LmZvY3VzKCk7XHJcblxyXG4gICAgLy8gU2Nyb2xsIHRvIHRoZSBzZWxlY3RlZCBlbGVtZW50XHJcbiAgICBmdW5jdGlvbiB0cnlTY3JvbGwoKTogdm9pZCB7XHJcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBzZWxlY3QuY2hpbGROb2Rlc1sgc2VsZWN0LnNlbGVjdGVkSW5kZXggXSBhcyBIVE1MRWxlbWVudDtcclxuXHJcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcclxuICAgICAgaWYgKCBlbGVtZW50LnNjcm9sbEludG9WaWV3SWZOZWVkZWQgKSB7XHJcbiAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxyXG4gICAgICAgIGVsZW1lbnQuc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKCBlbGVtZW50LnNjcm9sbEludG9WaWV3ICkge1xyXG4gICAgICAgIGVsZW1lbnQuc2Nyb2xsSW50b1ZpZXcoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNlbGVjdC5hZGRFdmVudExpc3RlbmVyKCAnY2hhbmdlJywgdHJ5U2Nyb2xsICk7XHJcbiAgICAvLyBXZSBuZWVkIHRvIHdhaXQgZm9yIHRoaW5ncyB0byBsb2FkIGZ1bGx5IGJlZm9yZSBzY3JvbGxpbmcgKGluIENocm9tZSkuXHJcbiAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3BoZXRzaW1zL3BoZXRtYXJrcy9pc3N1ZXMvMTNcclxuICAgIHNldFRpbWVvdXQoIHRyeVNjcm9sbCwgMCApO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGVsZW1lbnQ6IHNlbGVjdCxcclxuICAgICAgZ2V0IHZhbHVlKCkge1xyXG4gICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgLSBpdCBpcyBhbiBIVE1MRWxlbWVudCwgbm90IGp1c3QgYSBub2RlXHJcbiAgICAgICAgcmV0dXJuIHNlbGVjdC5jaGlsZE5vZGVzWyBzZWxlY3Quc2VsZWN0ZWRJbmRleCBdLnZhbHVlO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY3JlYXRlTW9kZVNlbGVjdG9yKCBtb2RlRGF0YTogTW9kZURhdGEsIHJlcG9zaXRvcnlTZWxlY3RvcjogUmVwb1NlbGVjdG9yICk6IE1vZGVTZWxlY3RvciB7XHJcbiAgICBjb25zdCBzZWxlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnc2VsZWN0JyApO1xyXG5cclxuICAgIGNvbnN0IHNlbGVjdG9yID0ge1xyXG4gICAgICBlbGVtZW50OiBzZWxlY3QsXHJcbiAgICAgIGdldCB2YWx1ZSgpIHtcclxuICAgICAgICByZXR1cm4gc2VsZWN0LnZhbHVlO1xyXG4gICAgICB9LFxyXG4gICAgICBnZXQgbW9kZSgpIHtcclxuICAgICAgICBjb25zdCBjdXJyZW50TW9kZU5hbWUgPSBzZWxlY3Rvci52YWx1ZTtcclxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoIG1vZGVEYXRhWyByZXBvc2l0b3J5U2VsZWN0b3IudmFsdWUgXSwgbW9kZSA9PiB7XHJcbiAgICAgICAgICByZXR1cm4gbW9kZS5uYW1lID09PSBjdXJyZW50TW9kZU5hbWU7XHJcbiAgICAgICAgfSApWyAwIF07XHJcbiAgICAgIH0sXHJcbiAgICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oIHN0b3JhZ2VLZXkoICdyZXBvJyApLCByZXBvc2l0b3J5U2VsZWN0b3IudmFsdWUgKTtcclxuXHJcbiAgICAgICAgY2xlYXJDaGlsZHJlbiggc2VsZWN0ICk7XHJcblxyXG4gICAgICAgIGNvbnN0IGdyb3VwczogUGFydGlhbDxSZWNvcmQ8TW9kZUdyb3VwLCBIVE1MT3B0R3JvdXBFbGVtZW50Pj4gPSB7fTtcclxuICAgICAgICBtb2RlRGF0YVsgcmVwb3NpdG9yeVNlbGVjdG9yLnZhbHVlIF0uZm9yRWFjaCggKCBjaG9pY2U6IE1vZGUgKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBjaG9pY2VPcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnb3B0aW9uJyApO1xyXG4gICAgICAgICAgY2hvaWNlT3B0aW9uLnZhbHVlID0gY2hvaWNlLm5hbWU7XHJcbiAgICAgICAgICBjaG9pY2VPcHRpb24ubGFiZWwgPSBjaG9pY2UudGV4dDtcclxuICAgICAgICAgIGNob2ljZU9wdGlvbi50aXRsZSA9IGNob2ljZS5kZXNjcmlwdGlvbjtcclxuICAgICAgICAgIGNob2ljZU9wdGlvbi5pbm5lckhUTUwgPSBjaG9pY2UudGV4dDtcclxuXHJcbiAgICAgICAgICAvLyBhZGQgdG8gYW4gYG9wdGdyb3VwYCBpbnN0ZWFkIG9mIGhhdmluZyBhbGwgbW9kZXMgb24gdGhlIGBzZWxlY3RgXHJcbiAgICAgICAgICBjaG9pY2UuZ3JvdXAgPSBjaG9pY2UuZ3JvdXAgfHwgJ0dlbmVyYWwnO1xyXG5cclxuICAgICAgICAgIC8vIGNyZWF0ZSBpZiB0aGUgZ3JvdXAgZG9lc24ndCBleGlzdFxyXG4gICAgICAgICAgaWYgKCAhZ3JvdXBzWyBjaG9pY2UuZ3JvdXAgXSApIHtcclxuICAgICAgICAgICAgY29uc3Qgb3B0R3JvdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnb3B0Z3JvdXAnICk7XHJcbiAgICAgICAgICAgIG9wdEdyb3VwLmxhYmVsID0gY2hvaWNlLmdyb3VwO1xyXG4gICAgICAgICAgICBncm91cHNbIGNob2ljZS5ncm91cCBdID0gb3B0R3JvdXA7XHJcbiAgICAgICAgICAgIHNlbGVjdC5hcHBlbmRDaGlsZCggb3B0R3JvdXAgKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBhZGQgdGhlIGNob2ljZSB0byB0aGUgcHJvcGVydHkgZ3JvdXBcclxuICAgICAgICAgIGdyb3Vwc1sgY2hvaWNlLmdyb3VwIF0hLmFwcGVuZENoaWxkKCBjaG9pY2VPcHRpb24gKTtcclxuICAgICAgICB9ICk7XHJcblxyXG4gICAgICAgIHNlbGVjdC5zZXRBdHRyaWJ1dGUoICdzaXplJywgbW9kZURhdGFbIHJlcG9zaXRvcnlTZWxlY3Rvci52YWx1ZSBdLmxlbmd0aCArIE9iamVjdC5rZXlzKCBncm91cHMgKS5sZW5ndGggKyAnJyApO1xyXG4gICAgICAgIGlmICggc2VsZWN0LnNlbGVjdGVkSW5kZXggPCAwICkge1xyXG4gICAgICAgICAgc2VsZWN0LnNlbGVjdGVkSW5kZXggPSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gc2VsZWN0b3I7XHJcbiAgfVxyXG5cclxuICAvLyBDcmVhdGUgY29udHJvbCBmb3IgdHlwZSAncGFyYW1ldGVyVmFsdWVzJywgYW5kIGFsc28gJ2Jvb2xlYW4nIHdoaWNoIGhhcyBoYXJkIGNvZGVkIHZhbHVlcyB0cnVlL2ZhbHNlL3NpbSBkZWZhdWx0LlxyXG4gIGZ1bmN0aW9uIGNyZWF0ZVBhcmFtZXRlclZhbHVlc1NlbGVjdG9yKCBxdWVyeVBhcmFtZXRlcjogUGhldG1hcmtzUXVlcnlQYXJhbWV0ZXIgKTogUXVlcnlQYXJhbWV0ZXJTZWxlY3RvciB7XHJcblxyXG4gICAgLy8gV2UgZG9uJ3Qgd2FudCB0byBtdXRhdGUgdGhlIHByb3ZpZGVkIGRhdGFcclxuICAgIHF1ZXJ5UGFyYW1ldGVyID0gXy5hc3NpZ25Jbigge30sIHF1ZXJ5UGFyYW1ldGVyICk7XHJcblxyXG4gICAgaWYgKCBxdWVyeVBhcmFtZXRlci50eXBlID09PSAnYm9vbGVhbicgKSB7XHJcbiAgICAgIGFzc2VydCAmJiBhc3NlcnQoICFxdWVyeVBhcmFtZXRlci5oYXNPd25Qcm9wZXJ0eSggJ3BhcmFtZXRlclZhbHVlcycgKSwgJ3BhcmFtZXRlclZhbHVlcyBhcmUgZmlsbGVkIGluIGZvciBib29sZWFuJyApO1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhcXVlcnlQYXJhbWV0ZXIuaGFzT3duUHJvcGVydHkoICdvbWl0SWZEZWZhdWx0JyApLCAnb21pdElmRGVmYXVsdCBpcyBmaWxsZWQgaW4gZm9yIGJvb2xlYW4nICk7XHJcbiAgICAgIHF1ZXJ5UGFyYW1ldGVyLnBhcmFtZXRlclZhbHVlcyA9IFsgJ3RydWUnLCAnZmFsc2UnLCBOT19WQUxVRSBdO1xyXG5cclxuICAgICAgLy8gc2ltIGRlZmF1bHQgaXMgdGhlIGRlZmF1bHQgZm9yIGJvb2xlYW5zXHJcbiAgICAgIGlmICggIXF1ZXJ5UGFyYW1ldGVyLmhhc093blByb3BlcnR5KCAnZGVmYXVsdCcgKSApIHtcclxuICAgICAgICBxdWVyeVBhcmFtZXRlci5kZWZhdWx0ID0gTk9fVkFMVUU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBhc3NlcnQgJiYgYXNzZXJ0KCBxdWVyeVBhcmFtZXRlci50eXBlID09PSAncGFyYW1ldGVyVmFsdWVzJywgYHBhcmFtZXRlclZhbHVlcyB0eXBlIG9ubHkgcGxlYXNlOiAke3F1ZXJ5UGFyYW1ldGVyLnZhbHVlfSAtICR7cXVlcnlQYXJhbWV0ZXIudHlwZX1gICk7XHJcbiAgICB9XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBxdWVyeVBhcmFtZXRlci5wYXJhbWV0ZXJWYWx1ZXMsICdwYXJhbWV0ZXJWYWx1ZXMgZXhwZWN0ZWQnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCBxdWVyeVBhcmFtZXRlci5wYXJhbWV0ZXJWYWx1ZXMhLmxlbmd0aCA+IDAsICdwYXJhbWV0ZXJWYWx1ZXMgZXhwZWN0ZWQgKG1vcmUgdGhhbiAwIG9mIHRoZW0pJyApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIXF1ZXJ5UGFyYW1ldGVyLmhhc093blByb3BlcnR5KCAnZGVwZW5kZW50UXVlcnlQYXJhbWV0ZXJzJyApLFxyXG4gICAgICAndHlwZT1wYXJhbWV0ZXJWYWx1ZXMgYW5kIHR5cGU9Ym9vbGVhbiBkbyBub3Qgc3VwcG9ydCBkZXBlbmRlbnQgcXVlcnkgcGFyYW1ldGVycyBhdCB0aGlzIHRpbWUuJyApO1xyXG5cclxuICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XHJcbiAgICBjb25zdCBxdWVyeVBhcmFtZXRlck5hbWUgPSBxdWVyeVBhcmFtZXRlci52YWx1ZTtcclxuICAgIGNvbnN0IHBhcmFtZXRlclZhbHVlcyA9IHF1ZXJ5UGFyYW1ldGVyLnBhcmFtZXRlclZhbHVlcyE7XHJcblxyXG4gICAgY29uc3QgcHJvdmlkZWRBRGVmYXVsdCA9IHF1ZXJ5UGFyYW1ldGVyLmhhc093blByb3BlcnR5KCAnZGVmYXVsdCcgKTtcclxuICAgIGNvbnN0IHRoZVByb3ZpZGVkRGVmYXVsdCA9IHF1ZXJ5UGFyYW1ldGVyLmRlZmF1bHQgKyAnJztcclxuICAgIGlmICggcHJvdmlkZWRBRGVmYXVsdCApIHtcclxuICAgICAgYXNzZXJ0ICYmIGFzc2VydCggcGFyYW1ldGVyVmFsdWVzLmluY2x1ZGVzKCB0aGVQcm92aWRlZERlZmF1bHQgKSxcclxuICAgICAgICBgcGFyYW1ldGVyIGRlZmF1bHQgZm9yICR7cXVlcnlQYXJhbWV0ZXJOYW1lfSBpcyBub3QgYW4gYXZhaWxhYmxlIHZhbHVlOiAke3RoZVByb3ZpZGVkRGVmYXVsdH1gICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGVmYXVsdFZhbHVlID0gcHJvdmlkZWRBRGVmYXVsdCA/IHRoZVByb3ZpZGVkRGVmYXVsdCA6IHBhcmFtZXRlclZhbHVlc1sgMCBdO1xyXG5cclxuICAgIGNvbnN0IGNyZWF0ZVBhcmFtZXRlclZhbHVlc1JhZGlvQnV0dG9uID0gKCB2YWx1ZTogc3RyaW5nICk6IEhUTUxFbGVtZW50ID0+IHtcclxuICAgICAgY29uc3QgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnbGFiZWwnICk7XHJcbiAgICAgIGxhYmVsLmNsYXNzTmFtZSA9ICdjaG9pY2VMYWJlbCc7XHJcbiAgICAgIGNvbnN0IHJhZGlvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2lucHV0JyApO1xyXG4gICAgICByYWRpby50eXBlID0gJ3JhZGlvJztcclxuICAgICAgcmFkaW8ubmFtZSA9IHF1ZXJ5UGFyYW1ldGVyTmFtZTtcclxuICAgICAgcmFkaW8udmFsdWUgPSB2YWx1ZTtcclxuICAgICAgcmFkaW8uY2hlY2tlZCA9IHZhbHVlID09PSBkZWZhdWx0VmFsdWU7XHJcbiAgICAgIGxhYmVsLmFwcGVuZENoaWxkKCByYWRpbyApO1xyXG4gICAgICBsYWJlbC5hcHBlbmRDaGlsZCggZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoIHZhbHVlICkgKTsgLy8gdXNlIHRoZSBxdWVyeSBwYXJhbWV0ZXIgdmFsdWUgYXMgdGhlIGRpc3BsYXkgdGV4dCBmb3IgY2xhcml0eVxyXG4gICAgICByZXR1cm4gbGFiZWw7XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IGJ1bGxldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdzcGFuJyApO1xyXG4gICAgYnVsbGV0LmlubmVySFRNTCA9ICfimqsnO1xyXG4gICAgYnVsbGV0LmNsYXNzTmFtZSA9ICdidWxsZXQnO1xyXG4gICAgZGl2LmFwcGVuZENoaWxkKCBidWxsZXQgKTtcclxuICAgIGNvbnN0IGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoIGAke3F1ZXJ5UGFyYW1ldGVyLnRleHR9ICg/JHtxdWVyeVBhcmFtZXRlck5hbWV9KWAgKTtcclxuICAgIGRpdi5hcHBlbmRDaGlsZCggbGFiZWwgKTtcclxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHBhcmFtZXRlclZhbHVlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgZGl2LmFwcGVuZENoaWxkKCBjcmVhdGVQYXJhbWV0ZXJWYWx1ZXNSYWRpb0J1dHRvbiggcGFyYW1ldGVyVmFsdWVzWyBpIF0gKSApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZWxlbWVudDogZGl2LFxyXG4gICAgICBnZXQgdmFsdWUoKSB7XHJcbiAgICAgICAgY29uc3QgcmFkaW9CdXR0b25WYWx1ZSA9ICQoIGBpbnB1dFtuYW1lPSR7cXVlcnlQYXJhbWV0ZXJOYW1lfV06Y2hlY2tlZGAgKS52YWwoKSArICcnO1xyXG5cclxuICAgICAgICAvLyBBIHZhbHVlIG9mIFwiU2ltdWxhdGlvbiBEZWZhdWx0XCIgdGVsbHMgdXMgbm90IHRvIHByb3ZpZGUgdGhlIHF1ZXJ5IHBhcmFtZXRlci5cclxuICAgICAgICBjb25zdCBvbWl0UXVlcnlQYXJhbWV0ZXIgPSByYWRpb0J1dHRvblZhbHVlID09PSBOT19WQUxVRSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICggcXVlcnlQYXJhbWV0ZXIub21pdElmRGVmYXVsdCAmJiByYWRpb0J1dHRvblZhbHVlID09PSBkZWZhdWx0VmFsdWUgKTtcclxuICAgICAgICByZXR1cm4gb21pdFF1ZXJ5UGFyYW1ldGVyID8gJycgOiBgJHtxdWVyeVBhcmFtZXRlck5hbWV9PSR7cmFkaW9CdXR0b25WYWx1ZX1gO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLy8gZ2V0IEZsYWcgY2hlY2tib3hlcyBhcyB0aGVpciBpbmRpdmlkdWFsIHF1ZXJ5IHN0cmluZ3MgKGluIGEgbGlzdCksIGJ1dCBvbmx5IGlmIHRoZXkgYXJlIGRpZmZlcmVudCBmcm9tIHRoZWlyIGRlZmF1bHQuXHJcbiAgZnVuY3Rpb24gZ2V0RmxhZ1BhcmFtZXRlcnMoIHRvZ2dsZUNvbnRhaW5lcjogSFRNTEVsZW1lbnQgKTogc3RyaW5nW10ge1xyXG4gICAgY29uc3QgY2hlY2tib3hFbGVtZW50cyA9ICQoIHRvZ2dsZUNvbnRhaW5lciApLmZpbmQoICcuZmxhZ1BhcmFtZXRlcicgKSBhcyB1bmtub3duIGFzIEhUTUxJbnB1dEVsZW1lbnRbXTtcclxuXHJcbiAgICAvLyBPbmx5IGNoZWNrZWQgYm94ZWQuXHJcbiAgICByZXR1cm4gXy5maWx0ZXIoIGNoZWNrYm94RWxlbWVudHMsICggY2hlY2tib3g6IEhUTUxJbnB1dEVsZW1lbnQgKSA9PiBjaGVja2JveC5jaGVja2VkIClcclxuICAgICAgLm1hcCggKCBjaGVja2JveDogSFRNTElucHV0RWxlbWVudCApID0+IGNoZWNrYm94Lm5hbWUgKTtcclxuICB9XHJcblxyXG4gIC8vIENyZWF0ZSBhIGNoZWNrYm94IHRvIHRvZ2dsZSBpZiB0aGUgZmxhZyBwYXJhbWV0ZXIgc2hvdWxkIGJlIGFkZGVkIHRvIHRoZSBtb2RlIFVSTFxyXG4gIGZ1bmN0aW9uIGNyZWF0ZUZsYWdTZWxlY3RvciggcGFyYW1ldGVyOiBQaGV0bWFya3NRdWVyeVBhcmFtZXRlciwgdG9nZ2xlQ29udGFpbmVyOiBIVE1MRWxlbWVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRUb1F1ZXJ5UGFyYW1ldGVyOiBFbGVtZW50VG9QYXJhbWV0ZXJNYXAgKTogdm9pZCB7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhcGFyYW1ldGVyLmhhc093blByb3BlcnR5KCAncGFyYW1ldGVyVmFsdWVzJyApLCAncGFyYW1ldGVyVmFsdWVzIGFyZSBmb3IgdHlwZT1wYXJhbWV0ZXJWYWx1ZXMnICk7XHJcbiAgICBhc3NlcnQgJiYgYXNzZXJ0KCAhcGFyYW1ldGVyLmhhc093blByb3BlcnR5KCAnb21pdElmRGVmYXVsdCcgKSwgJ29taXRJZkRlZmF1bHQgYXJlIGZvciB0eXBlPXBhcmFtZXRlclZhbHVlcycgKTtcclxuXHJcbiAgICBhc3NlcnQgJiYgcGFyYW1ldGVyLmhhc093blByb3BlcnR5KCAnZGVmYXVsdCcgKSAmJiBhc3NlcnQoIHR5cGVvZiBwYXJhbWV0ZXIuZGVmYXVsdCA9PT0gJ2Jvb2xlYW4nLCAnZGVmYXVsdCBpcyBhIGJvb2xlYW4gZm9yIGZsYWdzJyApO1xyXG5cclxuICAgIGNvbnN0IGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2xhYmVsJyApO1xyXG4gICAgY29uc3QgY2hlY2tib3ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnaW5wdXQnICk7XHJcbiAgICBjaGVja2JveC50eXBlID0gJ2NoZWNrYm94JztcclxuICAgIGNoZWNrYm94Lm5hbWUgPSBwYXJhbWV0ZXIudmFsdWU7XHJcbiAgICBjaGVja2JveC5jbGFzc0xpc3QuYWRkKCAnZmxhZ1BhcmFtZXRlcicgKTtcclxuICAgIGxhYmVsLmFwcGVuZENoaWxkKCBjaGVja2JveCApO1xyXG4gICAgYXNzZXJ0ICYmIGFzc2VydCggIWVsZW1lbnRUb1F1ZXJ5UGFyYW1ldGVyLmhhcyggY2hlY2tib3ggKSwgJ3Nhbml0eSBjaGVjayBmb3Igb3ZlcndyaXRpbmcnICk7XHJcbiAgICBlbGVtZW50VG9RdWVyeVBhcmFtZXRlci5zZXQoIGNoZWNrYm94LCBwYXJhbWV0ZXIgKTtcclxuXHJcbiAgICBjb25zdCBxdWVyeVBhcmFtZXRlckRpc3BsYXkgPSBwYXJhbWV0ZXIudmFsdWU7XHJcblxyXG4gICAgbGFiZWwuYXBwZW5kQ2hpbGQoIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCBgJHtwYXJhbWV0ZXIudGV4dH0gKD8ke3F1ZXJ5UGFyYW1ldGVyRGlzcGxheX0pYCApICk7XHJcbiAgICB0b2dnbGVDb250YWluZXIuYXBwZW5kQ2hpbGQoIGxhYmVsICk7XHJcbiAgICB0b2dnbGVDb250YWluZXIuYXBwZW5kQ2hpbGQoIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdicicgKSApO1xyXG4gICAgY2hlY2tib3guY2hlY2tlZCA9ICEhcGFyYW1ldGVyLmRlZmF1bHQ7XHJcblxyXG4gICAgaWYgKCBwYXJhbWV0ZXIuZGVwZW5kZW50UXVlcnlQYXJhbWV0ZXJzICkge1xyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIENyZWF0ZXMgYSBjaGVja2JveCB3aG9zZSB2YWx1ZSBpcyBkZXBlbmRlbnQgb24gYW5vdGhlciBjaGVja2JveCwgaXQgaXMgb25seSB1c2VkIGlmIHRoZSBwYXJlbnRcclxuICAgICAgICogY2hlY2tib3ggaXMgY2hlY2tlZC5cclxuICAgICAgICovXHJcbiAgICAgIGNvbnN0IGNyZWF0ZURlcGVuZGVudENoZWNrYm94ID0gKCBsYWJlbDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nLCBjaGVja2VkOiBib29sZWFuICk6IEhUTUxEaXZFbGVtZW50ID0+IHtcclxuICAgICAgICBjb25zdCBkZXBlbmRlbnRRdWVyeVBhcmFtZXRlcnNDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xyXG5cclxuICAgICAgICBjb25zdCBkZXBlbmRlbnRDaGVja2JveCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdpbnB1dCcgKTtcclxuICAgICAgICBkZXBlbmRlbnRDaGVja2JveC5pZCA9IGdldERlcGVuZGVudFBhcmFtZXRlckNvbnRyb2xJZCggdmFsdWUgKTtcclxuICAgICAgICBkZXBlbmRlbnRDaGVja2JveC50eXBlID0gJ2NoZWNrYm94JztcclxuICAgICAgICBkZXBlbmRlbnRDaGVja2JveC5uYW1lID0gdmFsdWU7XHJcbiAgICAgICAgZGVwZW5kZW50Q2hlY2tib3guY2xhc3NMaXN0LmFkZCggJ2ZsYWdQYXJhbWV0ZXInICk7XHJcbiAgICAgICAgZGVwZW5kZW50Q2hlY2tib3guc3R5bGUubWFyZ2luTGVmdCA9ICc0MHB4JztcclxuICAgICAgICBkZXBlbmRlbnRDaGVja2JveC5jaGVja2VkID0gY2hlY2tlZDtcclxuICAgICAgICBjb25zdCBsYWJlbEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnbGFiZWwnICk7XHJcbiAgICAgICAgbGFiZWxFbGVtZW50LmFwcGVuZENoaWxkKCBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSggbGFiZWwgKSApO1xyXG4gICAgICAgIGxhYmVsRWxlbWVudC5odG1sRm9yID0gZGVwZW5kZW50Q2hlY2tib3guaWQ7XHJcblxyXG4gICAgICAgIGRlcGVuZGVudFF1ZXJ5UGFyYW1ldGVyc0NvbnRhaW5lci5hcHBlbmRDaGlsZCggZGVwZW5kZW50Q2hlY2tib3ggKTtcclxuICAgICAgICBkZXBlbmRlbnRRdWVyeVBhcmFtZXRlcnNDb250YWluZXIuYXBwZW5kQ2hpbGQoIGxhYmVsRWxlbWVudCApO1xyXG5cclxuICAgICAgICAvLyBjaGVja2JveCBiZWNvbWVzIHVuY2hlY2tlZCBhbmQgZGlzYWJsZWQgaWYgZGVwZW5kZW5jeSBjaGVja2JveCBpcyB1bmNoZWNrZWRcclxuICAgICAgICBjb25zdCBlbmFibGVCdXR0b24gPSAoKSA9PiB7XHJcbiAgICAgICAgICBkZXBlbmRlbnRDaGVja2JveC5kaXNhYmxlZCA9ICFjaGVja2JveC5jaGVja2VkO1xyXG4gICAgICAgICAgaWYgKCAhY2hlY2tib3guY2hlY2tlZCApIHtcclxuICAgICAgICAgICAgZGVwZW5kZW50Q2hlY2tib3guY2hlY2tlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgY2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lciggJ2NoYW5nZScsIGVuYWJsZUJ1dHRvbiApO1xyXG4gICAgICAgIGVuYWJsZUJ1dHRvbigpO1xyXG5cclxuICAgICAgICByZXR1cm4gZGVwZW5kZW50UXVlcnlQYXJhbWV0ZXJzQ29udGFpbmVyO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgY29udGFpbmVyRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcclxuICAgICAgcGFyYW1ldGVyLmRlcGVuZGVudFF1ZXJ5UGFyYW1ldGVycy5mb3JFYWNoKCByZWxhdGVkUGFyYW1ldGVyID0+IHtcclxuICAgICAgICBjb25zdCBkZXBlbmRlbnRDaGVja2JveCA9IGNyZWF0ZURlcGVuZGVudENoZWNrYm94KCBgJHtyZWxhdGVkUGFyYW1ldGVyLnRleHR9ICgke3JlbGF0ZWRQYXJhbWV0ZXIudmFsdWV9KWAsIHJlbGF0ZWRQYXJhbWV0ZXIudmFsdWUsICEhcmVsYXRlZFBhcmFtZXRlci5kZWZhdWx0ICk7XHJcbiAgICAgICAgY29udGFpbmVyRGl2LmFwcGVuZENoaWxkKCBkZXBlbmRlbnRDaGVja2JveCApO1xyXG4gICAgICB9ICk7XHJcbiAgICAgIHRvZ2dsZUNvbnRhaW5lci5hcHBlbmRDaGlsZCggY29udGFpbmVyRGl2ICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBjcmVhdGVRdWVyeVBhcmFtZXRlcnNTZWxlY3RvciggbW9kZVNlbGVjdG9yOiBNb2RlU2VsZWN0b3IgKTogUXVlcnlQYXJhbWV0ZXJzU2VsZWN0b3Ige1xyXG5cclxuICAgIGNvbnN0IGN1c3RvbVRleHRCb3ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnaW5wdXQnICk7XHJcbiAgICBjdXN0b21UZXh0Qm94LnR5cGUgPSAndGV4dCc7XHJcblxyXG4gICAgY29uc3QgdG9nZ2xlQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcclxuXHJcbiAgICBsZXQgZWxlbWVudFRvUXVlcnlQYXJhbWV0ZXI6IEVsZW1lbnRUb1BhcmFtZXRlck1hcCA9IG5ldyBNYXAoKTtcclxuICAgIGNvbnN0IHBhcmFtZXRlclZhbHVlc1NlbGVjdG9yczogUXVlcnlQYXJhbWV0ZXJTZWxlY3RvcltdID0gW107XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdG9nZ2xlRWxlbWVudDogdG9nZ2xlQ29udGFpbmVyLFxyXG4gICAgICBjdXN0b21FbGVtZW50OiBjdXN0b21UZXh0Qm94LFxyXG4gICAgICBnZXQgdmFsdWUoKSB7XHJcblxyXG4gICAgICAgIC8vIGZsYWcgcXVlcnkgcGFyYW1ldGVycywgaW4gc3RyaW5nIGZvcm1cclxuICAgICAgICBjb25zdCBmbGFnUXVlcnlQYXJhbWV0ZXJzID0gZ2V0RmxhZ1BhcmFtZXRlcnMoIHRvZ2dsZUNvbnRhaW5lciApO1xyXG4gICAgICAgIGNvbnN0IHBhcmFtZXRlclZhbHVlc1F1ZXJ5UGFyYW1ldGVycyA9IHBhcmFtZXRlclZhbHVlc1NlbGVjdG9yc1xyXG4gICAgICAgICAgLm1hcCggKCBzZWxlY3RvcjogUXVlcnlQYXJhbWV0ZXJTZWxlY3RvciApID0+IHNlbGVjdG9yLnZhbHVlIClcclxuICAgICAgICAgIC5maWx0ZXIoICggcXVlcnlQYXJhbWV0ZXI6IHN0cmluZyApID0+IHF1ZXJ5UGFyYW1ldGVyICE9PSAnJyApO1xyXG5cclxuICAgICAgICBjb25zdCBjdXN0b21RdWVyeVBhcmFtZXRlcnMgPSBjdXN0b21UZXh0Qm94LnZhbHVlLmxlbmd0aCA/IFsgY3VzdG9tVGV4dEJveC52YWx1ZSBdIDogW107XHJcblxyXG4gICAgICAgIHJldHVybiBmbGFnUXVlcnlQYXJhbWV0ZXJzLmNvbmNhdCggcGFyYW1ldGVyVmFsdWVzUXVlcnlQYXJhbWV0ZXJzICkuY29uY2F0KCBjdXN0b21RdWVyeVBhcmFtZXRlcnMgKS5qb2luKCAnJicgKTtcclxuICAgICAgfSxcclxuICAgICAgdXBkYXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBSZWJ1aWxkIGJhc2VkIG9uIGEgbmV3IG1vZGUvcmVwbyBjaGFuZ2VcclxuXHJcbiAgICAgICAgZWxlbWVudFRvUXVlcnlQYXJhbWV0ZXIgPSBuZXcgTWFwKCk7XHJcbiAgICAgICAgcGFyYW1ldGVyVmFsdWVzU2VsZWN0b3JzLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgY2xlYXJDaGlsZHJlbiggdG9nZ2xlQ29udGFpbmVyICk7XHJcblxyXG4gICAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1ldGVycyA9IG1vZGVTZWxlY3Rvci5tb2RlLnF1ZXJ5UGFyYW1ldGVycyB8fCBbXTtcclxuICAgICAgICBxdWVyeVBhcmFtZXRlcnMuZm9yRWFjaCggcGFyYW1ldGVyID0+IHtcclxuICAgICAgICAgIGlmICggcGFyYW1ldGVyLnR5cGUgPT09ICdwYXJhbWV0ZXJWYWx1ZXMnIHx8IHBhcmFtZXRlci50eXBlID09PSAnYm9vbGVhbicgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdG9yID0gY3JlYXRlUGFyYW1ldGVyVmFsdWVzU2VsZWN0b3IoIHBhcmFtZXRlciApO1xyXG4gICAgICAgICAgICB0b2dnbGVDb250YWluZXIuYXBwZW5kQ2hpbGQoIHNlbGVjdG9yLmVsZW1lbnQgKTtcclxuICAgICAgICAgICAgcGFyYW1ldGVyVmFsdWVzU2VsZWN0b3JzLnB1c2goIHNlbGVjdG9yICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgY3JlYXRlRmxhZ1NlbGVjdG9yKCBwYXJhbWV0ZXIsIHRvZ2dsZUNvbnRhaW5lciwgZWxlbWVudFRvUXVlcnlQYXJhbWV0ZXIgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9ICk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGUgdGhlIHZpZXcgYW5kIGhvb2sgZXZlcnl0aGluZyB1cC5cclxuICAgKi9cclxuICBmdW5jdGlvbiByZW5kZXIoIG1vZGVEYXRhOiBNb2RlRGF0YSApOiB2b2lkIHtcclxuICAgIGNvbnN0IHJlcG9zaXRvcnlTZWxlY3RvciA9IGNyZWF0ZVJlcG9zaXRvcnlTZWxlY3RvciggT2JqZWN0LmtleXMoIG1vZGVEYXRhICkgKTtcclxuICAgIGNvbnN0IG1vZGVTZWxlY3RvciA9IGNyZWF0ZU1vZGVTZWxlY3RvciggbW9kZURhdGEsIHJlcG9zaXRvcnlTZWxlY3RvciApO1xyXG4gICAgY29uc3QgcXVlcnlQYXJhbWV0ZXJTZWxlY3RvciA9IGNyZWF0ZVF1ZXJ5UGFyYW1ldGVyc1NlbGVjdG9yKCBtb2RlU2VsZWN0b3IgKTtcclxuXHJcbiAgICBmdW5jdGlvbiBnZXRDdXJyZW50VVJMKCk6IHN0cmluZyB7XHJcbiAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1ldGVycyA9IHF1ZXJ5UGFyYW1ldGVyU2VsZWN0b3IudmFsdWU7XHJcbiAgICAgIGNvbnN0IHVybCA9IG1vZGVTZWxlY3Rvci5tb2RlLnVybDtcclxuICAgICAgY29uc3Qgc2VwYXJhdG9yID0gdXJsLmluY2x1ZGVzKCAnPycgKSA/ICcmJyA6ICc/JztcclxuICAgICAgcmV0dXJuIHVybCArICggcXVlcnlQYXJhbWV0ZXJzLmxlbmd0aCA/IHNlcGFyYXRvciArIHF1ZXJ5UGFyYW1ldGVycyA6ICcnICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbGF1bmNoQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2J1dHRvbicgKTtcclxuICAgIGxhdW5jaEJ1dHRvbi5pZCA9ICdsYXVuY2hCdXR0b24nO1xyXG4gICAgbGF1bmNoQnV0dG9uLm5hbWUgPSAnbGF1bmNoJztcclxuICAgIGxhdW5jaEJ1dHRvbi5pbm5lckhUTUwgPSAnTGF1bmNoJztcclxuXHJcbiAgICBjb25zdCByZXNldEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdidXR0b24nICk7XHJcbiAgICByZXNldEJ1dHRvbi5uYW1lID0gJ3Jlc2V0JztcclxuICAgIHJlc2V0QnV0dG9uLmlubmVySFRNTCA9ICdSZXNldCBRdWVyeSBQYXJhbWV0ZXJzJztcclxuXHJcbiAgICBmdW5jdGlvbiBoZWFkZXIoIHN0cmluZzogc3RyaW5nICk6IEhUTUxFbGVtZW50IHtcclxuICAgICAgY29uc3QgaGVhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdoMycgKTtcclxuICAgICAgaGVhZC5hcHBlbmRDaGlsZCggZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoIHN0cmluZyApICk7XHJcbiAgICAgIHJldHVybiBoZWFkO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERpdnMgZm9yIG91ciB0aHJlZSBjb2x1bW5zXHJcbiAgICBjb25zdCByZXBvRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcclxuICAgIHJlcG9EaXYuaWQgPSAncmVwb3NpdG9yaWVzJztcclxuICAgIGNvbnN0IG1vZGVEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xyXG4gICAgbW9kZURpdi5pZCA9ICdjaG9pY2VzJztcclxuICAgIGNvbnN0IHF1ZXJ5UGFyYW1ldGVyc0RpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XHJcbiAgICBxdWVyeVBhcmFtZXRlcnNEaXYuaWQgPSAncXVlcnlQYXJhbWV0ZXJzJztcclxuXHJcbiAgICAvLyBMYXlvdXQgb2YgYWxsIHRoZSBtYWpvciBlbGVtZW50c1xyXG4gICAgcmVwb0Rpdi5hcHBlbmRDaGlsZCggaGVhZGVyKCAnUmVwb3NpdG9yaWVzJyApICk7XHJcbiAgICByZXBvRGl2LmFwcGVuZENoaWxkKCByZXBvc2l0b3J5U2VsZWN0b3IuZWxlbWVudCApO1xyXG4gICAgbW9kZURpdi5hcHBlbmRDaGlsZCggaGVhZGVyKCAnTW9kZXMnICkgKTtcclxuICAgIG1vZGVEaXYuYXBwZW5kQ2hpbGQoIG1vZGVTZWxlY3Rvci5lbGVtZW50ICk7XHJcbiAgICBtb2RlRGl2LmFwcGVuZENoaWxkKCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnYnInICkgKTtcclxuICAgIG1vZGVEaXYuYXBwZW5kQ2hpbGQoIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdicicgKSApO1xyXG4gICAgbW9kZURpdi5hcHBlbmRDaGlsZCggbGF1bmNoQnV0dG9uICk7XHJcbiAgICBxdWVyeVBhcmFtZXRlcnNEaXYuYXBwZW5kQ2hpbGQoIGhlYWRlciggJ1F1ZXJ5IFBhcmFtZXRlcnMnICkgKTtcclxuICAgIHF1ZXJ5UGFyYW1ldGVyc0Rpdi5hcHBlbmRDaGlsZCggcXVlcnlQYXJhbWV0ZXJTZWxlY3Rvci50b2dnbGVFbGVtZW50ICk7XHJcbiAgICBxdWVyeVBhcmFtZXRlcnNEaXYuYXBwZW5kQ2hpbGQoIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCAnUXVlcnkgUGFyYW1ldGVyczogJyApICk7XHJcbiAgICBxdWVyeVBhcmFtZXRlcnNEaXYuYXBwZW5kQ2hpbGQoIHF1ZXJ5UGFyYW1ldGVyU2VsZWN0b3IuY3VzdG9tRWxlbWVudCApO1xyXG4gICAgcXVlcnlQYXJhbWV0ZXJzRGl2LmFwcGVuZENoaWxkKCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnYnInICkgKTtcclxuICAgIHF1ZXJ5UGFyYW1ldGVyc0Rpdi5hcHBlbmRDaGlsZCggcmVzZXRCdXR0b24gKTtcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIHJlcG9EaXYgKTtcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIG1vZGVEaXYgKTtcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIHF1ZXJ5UGFyYW1ldGVyc0RpdiApO1xyXG5cclxuICAgIGZ1bmN0aW9uIHVwZGF0ZVF1ZXJ5UGFyYW1ldGVyVmlzaWJpbGl0eSgpOiB2b2lkIHtcclxuICAgICAgcXVlcnlQYXJhbWV0ZXJzRGl2LnN0eWxlLnZpc2liaWxpdHkgPSBtb2RlU2VsZWN0b3IubW9kZS5xdWVyeVBhcmFtZXRlcnMgPyAnaW5oZXJpdCcgOiAnaGlkZGVuJztcclxuICAgIH1cclxuXHJcbiAgICAvLyBBbGlnbiBwYW5lbHMgYmFzZWQgb24gd2lkdGhcclxuICAgIGZ1bmN0aW9uIGxheW91dCgpOiB2b2lkIHtcclxuICAgICAgbW9kZURpdi5zdHlsZS5sZWZ0ID0gYCR7cmVwb3NpdG9yeVNlbGVjdG9yLmVsZW1lbnQuY2xpZW50V2lkdGggKyAyMH1weGA7XHJcbiAgICAgIHF1ZXJ5UGFyYW1ldGVyc0Rpdi5zdHlsZS5sZWZ0ID0gYCR7cmVwb3NpdG9yeVNlbGVjdG9yLmVsZW1lbnQuY2xpZW50V2lkdGggKyArbW9kZURpdi5jbGllbnRXaWR0aCArIDQwfXB4YDtcclxuICAgIH1cclxuXHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ3Jlc2l6ZScsIGxheW91dCApO1xyXG5cclxuICAgIC8vIEhvb2sgdXBkYXRlcyB0byBjaGFuZ2UgbGlzdGVuZXJzXHJcbiAgICBmdW5jdGlvbiBvblJlcG9zaXRvcnlDaGFuZ2VkKCk6IHZvaWQge1xyXG4gICAgICBtb2RlU2VsZWN0b3IudXBkYXRlKCk7XHJcbiAgICAgIG9uTW9kZUNoYW5nZWQoKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBvbk1vZGVDaGFuZ2VkKCk6IHZvaWQge1xyXG4gICAgICBxdWVyeVBhcmFtZXRlclNlbGVjdG9yLnVwZGF0ZSgpO1xyXG4gICAgICB1cGRhdGVRdWVyeVBhcmFtZXRlclZpc2liaWxpdHkoKTtcclxuICAgICAgbGF5b3V0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVwb3NpdG9yeVNlbGVjdG9yLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ2NoYW5nZScsIG9uUmVwb3NpdG9yeUNoYW5nZWQgKTtcclxuICAgIG1vZGVTZWxlY3Rvci5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdjaGFuZ2UnLCBvbk1vZGVDaGFuZ2VkICk7XHJcbiAgICBvblJlcG9zaXRvcnlDaGFuZ2VkKCk7XHJcblxyXG4gICAgLy8gQ2xpY2tpbmcgJ0xhdW5jaCcgb3IgcHJlc3NpbmcgJ2VudGVyJyBvcGVucyB0aGUgVVJMXHJcbiAgICBmdW5jdGlvbiBvcGVuQ3VycmVudFVSTCgpOiB2b2lkIHtcclxuICAgICAgb3BlblVSTCggZ2V0Q3VycmVudFVSTCgpICk7XHJcbiAgICB9XHJcblxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdrZXlkb3duJywgZXZlbnQgPT4ge1xyXG4gICAgICAvLyBDaGVjayBmb3IgZW50ZXIga2V5XHJcbiAgICAgIGlmICggZXZlbnQud2hpY2ggPT09IDEzICkge1xyXG4gICAgICAgIG9wZW5DdXJyZW50VVJMKCk7XHJcbiAgICAgIH1cclxuICAgIH0sIGZhbHNlICk7XHJcbiAgICBsYXVuY2hCdXR0b24uYWRkRXZlbnRMaXN0ZW5lciggJ2NsaWNrJywgb3BlbkN1cnJlbnRVUkwgKTtcclxuXHJcbiAgICAvLyBSZXNldCBieSByZWRyYXdpbmcgZXZlcnl0aGluZ1xyXG4gICAgcmVzZXRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lciggJ2NsaWNrJywgcXVlcnlQYXJhbWV0ZXJTZWxlY3Rvci51cGRhdGUgKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGZ1bmN0aW9uIGxvYWRQYWNrYWdlSlNPTnMoIHJlcG9zOiBSZXBvTmFtZVtdICk6IFByb21pc2U8UmVjb3JkPFJlcG9OYW1lLCBQYWNrYWdlSlNPTj4+IHtcclxuICAgIGNvbnN0IHBhY2thZ2VKU09OczogUmVjb3JkPFJlcG9OYW1lLCBQYWNrYWdlSlNPTj4gPSB7fTtcclxuICAgIGZvciAoIGNvbnN0IHJlcG8gb2YgcmVwb3MgKSB7XHJcbiAgICAgIHBhY2thZ2VKU09Oc1sgcmVwbyBdID0gYXdhaXQgJC5hamF4KCB7IHVybDogYC4uLyR7cmVwb30vcGFja2FnZS5qc29uYCB9ICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcGFja2FnZUpTT05zO1xyXG4gIH1cclxuXHJcbiAgLy8gU3BsaXRzIGZpbGUgc3RyaW5ncyAoc3VjaCBhcyBwZXJlbm5pYWwtYWxpYXMvZGF0YS9hY3RpdmUtcnVubmFibGVzKSBpbnRvIGEgbGlzdCBvZiBlbnRyaWVzLCBpZ25vcmluZyBibGFuayBsaW5lcy5cclxuICBmdW5jdGlvbiB3aGl0ZVNwbGl0QW5kU29ydCggcmF3RGF0YUxpc3Q6IHN0cmluZyApOiBSZXBvTmFtZVtdIHtcclxuICAgIHJldHVybiByYXdEYXRhTGlzdC5zcGxpdCggJ1xcbicgKS5tYXAoIGxpbmUgPT4ge1xyXG4gICAgICByZXR1cm4gbGluZS5yZXBsYWNlKCAnXFxyJywgJycgKTtcclxuICAgIH0gKS5maWx0ZXIoIGxpbmUgPT4ge1xyXG4gICAgICByZXR1cm4gbGluZS5sZW5ndGggPiAwO1xyXG4gICAgfSApLnNvcnQoKTtcclxuICB9XHJcblxyXG4gIC8vIGdldCB0aGUgSUQgZm9yIGEgY2hlY2tib3ggdGhhdCBpcyBcImRlcGVuZGVudFwiIG9uIGFub3RoZXIgdmFsdWVcclxuICBjb25zdCBnZXREZXBlbmRlbnRQYXJhbWV0ZXJDb250cm9sSWQgPSAoIHZhbHVlOiBzdHJpbmcgKSA9PiBgZGVwZW5kZW50LWNoZWNrYm94LSR7dmFsdWV9YDtcclxuXHJcbiAgLy8gTG9hZCBmaWxlcyBzZXJpYWxseSwgcG9wdWxhdGUgdGhlbiByZW5kZXJcclxuICBjb25zdCBhY3RpdmVSdW5uYWJsZXMgPSB3aGl0ZVNwbGl0QW5kU29ydCggYXdhaXQgJC5hamF4KCB7IHVybDogJy4uL3BlcmVubmlhbC1hbGlhcy9kYXRhL2FjdGl2ZS1ydW5uYWJsZXMnIH0gKSApO1xyXG4gIGNvbnN0IGFjdGl2ZVJlcG9zID0gd2hpdGVTcGxpdEFuZFNvcnQoIGF3YWl0ICQuYWpheCggeyB1cmw6ICcuLi9wZXJlbm5pYWwtYWxpYXMvZGF0YS9hY3RpdmUtcmVwb3MnIH0gKSApO1xyXG4gIGNvbnN0IHBoZXRpb1NpbXMgPSB3aGl0ZVNwbGl0QW5kU29ydCggYXdhaXQgJC5hamF4KCB7IHVybDogJy4uL3BlcmVubmlhbC1hbGlhcy9kYXRhL3BoZXQtaW8nIH0gKSApO1xyXG4gIGNvbnN0IGludGVyYWN0aXZlRGVzY3JpcHRpb25TaW1zID0gd2hpdGVTcGxpdEFuZFNvcnQoIGF3YWl0ICQuYWpheCggeyB1cmw6ICcuLi9wZXJlbm5pYWwtYWxpYXMvZGF0YS9pbnRlcmFjdGl2ZS1kZXNjcmlwdGlvbicgfSApICk7XHJcbiAgY29uc3Qgd3JhcHBlcnMgPSB3aGl0ZVNwbGl0QW5kU29ydCggYXdhaXQgJC5hamF4KCB7IHVybDogJy4uL3BlcmVubmlhbC1hbGlhcy9kYXRhL3dyYXBwZXJzJyB9ICkgKTtcclxuICBjb25zdCB1bml0VGVzdHNSZXBvcyA9IHdoaXRlU3BsaXRBbmRTb3J0KCBhd2FpdCAkLmFqYXgoIHsgdXJsOiAnLi4vcGVyZW5uaWFsLWFsaWFzL2RhdGEvdW5pdC10ZXN0cycgfSApICk7XHJcbiAgY29uc3QgcGhldGlvSHlkcm9nZW5TaW1zID0gYXdhaXQgJC5hamF4KCB7IHVybDogJy4uL3BlcmVubmlhbC1hbGlhcy9kYXRhL3BoZXQtaW8taHlkcm9nZW4uanNvbicgfSApO1xyXG4gIGNvbnN0IHBoZXRpb1BhY2thZ2VKU09OcyA9IGF3YWl0IGxvYWRQYWNrYWdlSlNPTnMoIHBoZXRpb1NpbXMgKTtcclxuXHJcbiAgcmVuZGVyKCBwb3B1bGF0ZSggYWN0aXZlUnVubmFibGVzLCBhY3RpdmVSZXBvcywgcGhldGlvU2ltcywgaW50ZXJhY3RpdmVEZXNjcmlwdGlvblNpbXMsIHdyYXBwZXJzLCB1bml0VGVzdHNSZXBvcywgcGhldGlvSHlkcm9nZW5TaW1zLCBwaGV0aW9QYWNrYWdlSlNPTnMgKSApO1xyXG59ICkoKS5jYXRjaCggKCBlOiBFcnJvciApID0+IHtcclxuICB0aHJvdyBlO1xyXG59ICk7Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLENBQUUsa0JBQWdDO0VBU2hDOztFQXVC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